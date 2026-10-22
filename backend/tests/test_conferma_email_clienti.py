"""Conferma dell'email dei CLIENTI (i commercianti no).

Copre: iscrizione senza accesso, email con link, token monouso e a scadenza (solo l'impronta nel DB),
login bloccato con messaggio chiaro, «Rimanda l'email» con limiti e risposta che non rivela nulla,
migrazione (gli utenti già iscritti sono confermati), cancellazione dopo 7 giorni, interruttore spento.
Server in-process su database locale o emulatore: rifiuta database remoti, nessuna email vera.
"""
import asyncio
import hashlib
import os
import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

import pytest

MONGO_URL = os.environ.setdefault("TEST_MONGO_URL", os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
_u = urlparse(MONGO_URL)
if not (_u.scheme == "mongomock" or (_u.scheme == "mongodb" and (_u.hostname or "") in ("localhost", "127.0.0.1", "::1"))):
    pytest.exit(f"MONGO_URL non locale ({_u.scheme}://{_u.hostname}): test rifiutati.", returncode=2)
USE_MOCK = _u.scheme == "mongomock"
DB_NAME = "e2e_unit_conferma_email"
os.environ["MONGO_URL"] = "mongodb://localhost:27017" if USE_MOCK else MONGO_URL
os.environ.setdefault("DB_NAME", DB_NAME)
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")
os.environ["RESEND_API_KEY"] = ""

import httpx  # noqa: E402

import server  # noqa: E402

PASSWORD = "password-giusta-123"
CLIENTE = {"password": PASSWORD, "name": "Giulia Prova", "role": "client", "legal_accepted": True}
NEGOZIO = {"password": PASSWORD, "name": "Titolare Prova", "role": "merchant", "legal_accepted": True,
           "legal_specific_accepted": True, "shop_name": "Negozio Prova", "phone": "0600000000", "partita_iva": "12345678903"}


@pytest.fixture(autouse=True)
def _ambiente(monkeypatch):
    """Interruttore acceso, email finte (si tengono i token mandati), limiti come in produzione."""
    monkeypatch.setenv("CLIENT_EMAIL_CONFIRMATION_REQUIRED", "true")
    monkeypatch.setenv("CONFERMA_MAX_PER_CLIENT_10MIN", "3")
    monkeypatch.setenv("CONFERMA_MAX_PER_CLIENT_ORA", "5")
    monkeypatch.setenv("ADMIN_NOTIFY_EMAIL", "")
    posta = {"conferma": [], "benvenuto": 0}

    async def conferma(to, name, token):
        posta["conferma"].append((to, token))

    async def benvenuto(*a, **k):
        posta["benvenuto"] += 1

    async def altro(*a, **k):
        return None

    monkeypatch.setattr(server, "send_email_confirmation", conferma)
    monkeypatch.setattr(server, "send_welcome_client", benvenuto)
    monkeypatch.setattr(server, "send_welcome_merchant", altro)
    monkeypatch.setattr(server, "send_admin_new_merchant", altro)
    server._limiti_client.clear()
    return posta


def run(body):
    async def main():
        if USE_MOCK:
            import mongomock_motor
            server.db = mongomock_motor.AsyncMongoMockClient()[DB_NAME]
        else:
            from motor.motor_asyncio import AsyncIOMotorClient
            cli = AsyncIOMotorClient(MONGO_URL)
            await cli.drop_database(DB_NAME)
            server.db = cli[DB_NAME]
        transport = httpx.ASGITransport(app=server.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
            await body(c)
            await server.attendi_lavori_in_background()  # nessun lavoro in background lasciato a metà
    asyncio.run(main())


async def iscrivi(c, email, **extra):
    r = await c.post("/api/auth/register", json={**CLIENTE, "email": email, **extra})
    assert r.status_code == 200, r.text
    await server.attendi_lavori_in_background()  # l'email parte in background
    return r


async def login(c, email, password=PASSWORD):
    return await c.post("/api/auth/login", json={"email": email, "password": password})


def sha(t):
    return hashlib.sha256(t.encode()).hexdigest()


def test_iscrizione_senza_accesso_e_email_con_link(_ambiente):
    async def body(c):
        r = await iscrivi(c, "nuova@example.com")
        j = r.json()
        assert j["confirmation_required"] is True
        assert "tocca il link per confermare il tuo account" in j["message"]
        assert "access_token" not in j and "user" not in j
        assert "access_token" not in r.cookies and "set-cookie" not in r.headers
        # una sola email, con un token; nel DB solo l'impronta, mai il token in chiaro
        assert len(_ambiente["conferma"]) == 1
        to, token = _ambiente["conferma"][0]
        assert to == "nuova@example.com" and len(token) >= 40
        doc = await server.db.users.find_one({"email": "nuova@example.com"})
        assert doc["email_confirmed"] is False
        assert doc["email_confirm_token_hash"] == sha(token)
        assert token not in repr(doc)
        scad = datetime.fromisoformat(doc["email_confirm_expires"])
        assert timedelta(hours=47, minutes=55) < scad - datetime.now(timezone.utc) <= timedelta(hours=48)
        assert _ambiente["benvenuto"] == 0  # il benvenuto parte dopo la conferma
        # l'API pubblica non espone i campi della conferma
        assert "email_confirm_token_hash" not in server.sanitize_user(doc)
        assert "email_confirmed" not in server.sanitize_user(doc)
    run(body)


def test_login_bloccato_finche_non_conferma_poi_entra(_ambiente):
    async def body(c):
        await iscrivi(c, "a@example.com")
        r = await login(c, "a@example.com")
        assert r.status_code == 403
        d = r.json()["detail"]
        assert d["code"] == "email_non_confermata"
        assert "confermare il tuo account" in d["msg"] and "rimandare" in d["msg"]
        assert "access_token" not in r.cookies
        # con la password sbagliata nessuna indicazione sullo stato dell'account
        assert (await login(c, "a@example.com", "sbagliata-1")).status_code == 401
        # conferma
        token = _ambiente["conferma"][-1][1]
        ok = await c.post("/api/auth/confirm-email", json={"token": token})
        assert ok.status_code == 200 and ok.json() == {"ok": True}
        await server.attendi_lavori_in_background()
        assert _ambiente["benvenuto"] == 1
        doc = await server.db.users.find_one({"email": "a@example.com"})
        assert doc["email_confirmed"] is True
        assert "email_confirm_token_hash" not in doc and "email_confirm_expires" not in doc
        r = await login(c, "a@example.com")
        assert r.status_code == 200 and r.json()["user"]["role"] == "client"
        # monouso: lo stesso link non vale più
        again = await c.post("/api/auth/confirm-email", json={"token": token})
        assert again.status_code == 400 and again.json()["detail"]["code"] == "link_non_valido"
    run(body)


def test_link_non_valido_o_scaduto(_ambiente):
    async def body(c):
        await iscrivi(c, "b@example.com")
        r = await c.post("/api/auth/confirm-email", json={"token": "inventato"})
        assert r.status_code == 400 and r.json()["detail"]["code"] == "link_non_valido"
        assert (await c.post("/api/auth/confirm-email", json={"token": ""})).status_code == 400
        # scaduto (oltre 48 ore)
        await server.db.users.update_one({"email": "b@example.com"}, {"$set": {
            "email_confirm_expires": (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat()}})
        token = _ambiente["conferma"][-1][1]
        r = await c.post("/api/auth/confirm-email", json={"token": token})
        assert r.status_code == 400 and r.json()["detail"]["code"] == "link_scaduto"
        assert "scaduto" in r.json()["detail"]["msg"]
        # non confermato: il login resta bloccato
        assert (await login(c, "b@example.com")).status_code == 403
        # «Rimanda l'email»: il nuovo link vale, il vecchio no
        rr = await c.post("/api/auth/resend-confirmation", json={"email": "b@example.com"})
        assert rr.status_code == 200
        assert len(_ambiente["conferma"]) == 2
        nuovo = _ambiente["conferma"][-1][1]
        assert nuovo != token
        assert (await c.post("/api/auth/confirm-email", json={"token": token})).status_code == 400
        assert (await c.post("/api/auth/confirm-email", json={"token": nuovo})).status_code == 200
        assert (await login(c, "b@example.com")).status_code == 200
    run(body)


def test_rimanda_non_rivela_se_l_email_esiste(_ambiente):
    async def body(c):
        await iscrivi(c, "c@example.com")
        await iscrivi(c, "d@example.com")
        token_d = _ambiente["conferma"][-1][1]
        await c.post("/api/auth/confirm-email", json={"token": token_d})  # d è confermato
        await c.post("/api/auth/register", json={**NEGOZIO, "email": "n@example.com"})
        prima = len(_ambiente["conferma"])
        risposte = []
        for i, mail in enumerate(("c@example.com", "d@example.com", "sconosciuta@example.com", "n@example.com")):
            r = await c.post("/api/auth/resend-confirmation", json={"email": mail},
                             headers={"X-Forwarded-For": f"203.0.113.{50 + i}"})
            risposte.append((r.status_code, r.json()))
        assert all(x == risposte[0] for x in risposte)
        assert risposte[0][0] == 200 and risposte[0][1]["ok"] is True
        assert len(_ambiente["conferma"]) == prima + 1  # solo per c, l'unico da confermare
    run(body)


def test_limiti_del_rimanda(_ambiente):
    async def body(c):
        await iscrivi(c, "e@example.com")
        h = {"X-Forwarded-For": "203.0.113.7"}
        codici = [(await c.post("/api/auth/resend-confirmation", json={"email": f"x{i}@example.com"}, headers=h)).status_code
                  for i in range(5)]
        assert codici == [200, 200, 200, 429, 429]  # 3 ogni 10 minuti
        assert (await c.post("/api/auth/resend-confirmation", json={"email": "x@example.com"}, headers=h)).json()["detail"].startswith("Troppe richieste")
        # un altro dispositivo non è toccato
        h2 = {"X-Forwarded-For": "203.0.113.8"}
        assert (await c.post("/api/auth/resend-confirmation", json={"email": "x@example.com"}, headers=h2)).status_code == 200
        # nessun indirizzo IP nel database
        salvati = [d async for d in server.db.users.find({})] + [d async for d in server.db.login_guard.find({})]
        assert "203.0.113" not in repr(salvati)
    run(body)


def test_limite_ora_e_pausa_per_account(_ambiente, monkeypatch):
    async def body(c):
        await iscrivi(c, "f@example.com")
        prima = len(_ambiente["conferma"])
        # due richieste ravvicinate sullo stesso account: la seconda non rimanda (pausa di 60 secondi) ma risponde uguale
        r1 = await c.post("/api/auth/resend-confirmation", json={"email": "f@example.com"})
        r2 = await c.post("/api/auth/resend-confirmation", json={"email": "f@example.com"})
        assert r1.json() == r2.json() and len(_ambiente["conferma"]) == prima + 1
        # e il limite per dispositivo è anche di 5 all'ora
        server._limiti_client.clear()
        monkeypatch.setenv("CONFERMA_MAX_PER_CLIENT_10MIN", "100")
        h = {"X-Forwarded-For": "203.0.113.9"}
        codici = [(await c.post("/api/auth/resend-confirmation", json={"email": f"y{i}@example.com"}, headers=h)).status_code
                  for i in range(7)]
        assert codici == [200] * 5 + [429] * 2
    run(body)


def test_commercianti_non_toccati(_ambiente):
    async def body(c):
        r = await c.post("/api/auth/register", json={**NEGOZIO, "email": "negozio@example.com"})
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "merchant" and r.json()["access_token"]
        assert "confirmation_required" not in r.json()
        assert _ambiente["conferma"] == []
        assert (await login(c, "negozio@example.com")).status_code == 200
        # nemmeno se un commerciante avesse per errore il campo
        await server.db.users.update_one({"email": "negozio@example.com"}, {"$set": {"email_confirmed": False}})
        assert (await login(c, "negozio@example.com")).status_code == 200
    run(body)


def test_interruttore_spento_come_prima(_ambiente, monkeypatch):
    async def body(c):
        monkeypatch.setenv("CLIENT_EMAIL_CONFIRMATION_REQUIRED", "false")
        r = await iscrivi(c, "g@example.com")
        assert r.json()["access_token"] and r.json()["user"]["role"] == "client"
        assert "confirmation_required" not in r.json()
        assert _ambiente["conferma"] == [] and _ambiente["benvenuto"] == 1
        assert (await login(c, "g@example.com")).status_code == 200
        # un account rimasto da confermare entra, con l'interruttore spento, e risulta confermato
        monkeypatch.setenv("CLIENT_EMAIL_CONFIRMATION_REQUIRED", "true")
        await iscrivi(c, "h@example.com")
        monkeypatch.setenv("CLIENT_EMAIL_CONFIRMATION_REQUIRED", "false")
        assert (await login(c, "h@example.com")).status_code == 200
        assert (await server.db.users.find_one({"email": "h@example.com"}))["email_confirmed"] is True
    run(body)


def test_migrazione_utenti_esistenti_confermati(_ambiente):
    async def body(c):
        vecchi = []
        for i in range(3):
            email = f"vecchio{i}@example.com"
            uid = str(uuid.uuid4())
            await server.db.users.insert_one({
                "id": uid, "email": email, "name": "Vecchio", "role": "client",
                "password_hash": server.hash_password(PASSWORD),
                "created_at": (datetime.now(timezone.utc) - timedelta(days=90)).isoformat()})
            vecchi.append(email)
        # un nuovo da confermare, già col campo: la migrazione non lo tocca
        await iscrivi(c, "nuovo@example.com")
        assert await server._migra_conferma_email() == 3
        assert await server._migra_conferma_email() == 0  # idempotente
        for email in vecchi:
            assert (await login(c, email)).status_code == 200
        assert (await login(c, "nuovo@example.com")).status_code == 403
        # e senza migrazione un utente senza il campo non è comunque bloccato
        await server.db.users.insert_one({
            "id": str(uuid.uuid4()), "email": "senza@example.com", "name": "S", "role": "client",
            "password_hash": server.hash_password(PASSWORD), "created_at": datetime.now(timezone.utc).isoformat()})
        assert (await login(c, "senza@example.com")).status_code == 200
    run(body)


def test_cancellazione_dopo_7_giorni(_ambiente):
    async def body(c):
        adesso = datetime.now(timezone.utc)

        async def crea(email, giorni, confermato, role="client"):
            uid = str(uuid.uuid4())
            await server.db.users.insert_one({
                "id": uid, "email": email, "name": "P", "role": role, "email_confirmed": confermato,
                "password_hash": "x", "created_at": (adesso - timedelta(days=giorni)).isoformat()})
            return uid
        vecchio = await crea("vecchio@example.com", 8, False)
        recente = await crea("recente@example.com", 6, False)
        confermato = await crea("confermato@example.com", 30, True)
        negozio = await crea("neg@example.com", 30, False, role="merchant")
        # dati collegati al non confermato: spariscono come nella cancellazione GDPR
        await server.db.avvisi_preferiti.insert_one({"user_id": vecchio, "merchant_id": negozio})
        await server.db.consent_logs.insert_one({"user_id": vecchio})
        esito = await server._run_unconfirmed_cleanup()
        assert esito == {"skipped": False, "deleted": 1}
        ids = {u["id"] async for u in server.db.users.find({})}
        assert vecchio not in ids and {recente, confermato, negozio} <= ids
        assert await server.db.avvisi_preferiti.count_documents({"user_id": vecchio}) == 0
        assert await server.db.consent_logs.count_documents({"user_id": vecchio}) == 0
        assert (await server._run_unconfirmed_cleanup())["deleted"] == 0
    run(body)


def test_pulizia_spenta_con_interruttore_spento(_ambiente, monkeypatch):
    async def body(c):
        await server.db.users.insert_one({
            "id": "u1", "email": "o@example.com", "role": "client", "email_confirmed": False,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()})
        monkeypatch.setenv("CLIENT_EMAIL_CONFIRMATION_REQUIRED", "false")
        assert (await server._run_unconfirmed_cleanup())["skipped"] is True
        assert await server.db.users.count_documents({"id": "u1"}) == 1
    run(body)


def test_reset_password_vale_come_conferma(_ambiente, monkeypatch):
    async def body(c):
        await iscrivi(c, "r@example.com")
        assert (await login(c, "r@example.com")).status_code == 403
        await server.db.users.update_one({"email": "r@example.com"}, {"$set": {
            "reset_token": "tok-reset-prova", "reset_expires": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()}})
        r = await c.post("/api/auth/reset", json={"token": "tok-reset-prova", "new_password": "nuova-password-1"})
        assert r.status_code == 200
        assert (await login(c, "r@example.com", "nuova-password-1")).status_code == 200
    run(body)


def test_blocco_valido_anche_per_face_id(_ambiente):
    async def body(c):
        with pytest.raises(server.HTTPException) as e:
            await server._blocca_se_non_confermato({"id": "x", "role": "client", "email_confirmed": False})
        assert e.value.status_code == 403
        await server._blocca_se_non_confermato({"id": "x", "role": "client"})
        await server._blocca_se_non_confermato({"id": "x", "role": "client", "email_confirmed": True})
    run(body)


def test_il_token_non_finisce_nei_log(_ambiente, caplog):
    async def body(c):
        caplog.set_level("DEBUG")
        await iscrivi(c, "l@example.com")
        await c.post("/api/auth/resend-confirmation", json={"email": "l@example.com"})
        for _, token in _ambiente["conferma"]:
            assert token not in caplog.text
    run(body)


def test_testo_email_di_conferma():
    import email_service

    async def main():
        catturata = {}

        async def finta(to, subject, html):
            catturata.update(to=to, subject=subject, html=html)
        orig = email_service._send
        email_service._send = finta
        try:
            await email_service.send_email_confirmation("a@example.com", "Giulia Rossi", "TOKENPROVA")
        finally:
            email_service._send = orig
        h = catturata["html"]
        assert "Conferma il tuo account" in h and "/conferma-email?token=TOKENPROVA" in h and "48 ore" in h
        assert "Ciao Giulia," in h
        for vietato in ("gratis per sempre", "nessuna commissione"):
            assert vietato not in h.lower()
    asyncio.run(main())
