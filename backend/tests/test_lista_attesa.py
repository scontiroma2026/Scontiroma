"""Lista d'attesa pre-lancio (PRELAUNCH_MODE).

Copre: iscrizione con consenso esplicito, doppio consenso (token a 48 ore, nel DB solo l'impronta), token scaduto,
rimando limitato (per indirizzo e per dispositivo), campo trappola, risposte che non rivelano se l'email esiste,
fonte da lista chiusa, disiscrizione, pulizia dei non confermati dopo 7 giorni, esportazione delle sole confermate,
avviso di lancio idempotente e a lotti (invio finto: nessuna email vera), interruttore spento = nulla cambia.
Server in-process su database locale o emulatore (mongomock): rifiuta database remoti.
"""
import asyncio
import hashlib
import os
import re
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

import pytest

MONGO_URL = os.environ.setdefault("TEST_MONGO_URL", os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
_u = urlparse(MONGO_URL)
if not (_u.scheme == "mongomock" or (_u.scheme == "mongodb" and (_u.hostname or "") in ("localhost", "127.0.0.1", "::1"))):
    pytest.exit(f"MONGO_URL non locale ({_u.scheme}://{_u.hostname}): test rifiutati.", returncode=2)
USE_MOCK = _u.scheme == "mongomock"
DB_NAME = "e2e_unit_lista_attesa"
os.environ["MONGO_URL"] = "mongodb://localhost:27017" if USE_MOCK else MONGO_URL
os.environ.setdefault("DB_NAME", DB_NAME)
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")
os.environ["RESEND_API_KEY"] = ""

import httpx  # noqa: E402

import email_service  # noqa: E402
import server  # noqa: E402
from test_interruttore_abbonamento import nuovo_utente  # noqa: E402

MASTER = "master-test-123456"
URL = "/api/prelaunch/waitlist"
CONSENSO = {"consenso": True}


@pytest.fixture(autouse=True)
def _ambiente(monkeypatch):
    """Modalità pre-lancio ACCESA, limiti come in produzione, email e invii finti (si tengono token e destinatari)."""
    monkeypatch.setenv("PRELAUNCH_MODE", "true")
    monkeypatch.setenv("WAITLIST_MAX_PER_CLIENT_10MIN", "0")  # il test dedicato li accende (3 ogni 10 minuti, 5 all'ora)
    monkeypatch.setenv("WAITLIST_MAX_PER_CLIENT_ORA", "0")
    monkeypatch.setenv("ADMIN_MASTER_PASSWORD", MASTER)
    monkeypatch.setenv("WAITLIST_PAUSA_MESSAGGIO_SEC", "0")
    monkeypatch.setenv("WAITLIST_PAUSA_LOTTO_SEC", "0")
    monkeypatch.setenv("WAITLIST_DAILY_CAP", "0")
    posta = {"conferma": [], "avvisi": [], "pause": [], "fallisci": set(), "tutti_falliscono": False}

    async def conferma(to, token, uid, utoken):
        posta["conferma"].append({"to": to, "token": token, "id": uid, "utoken": utoken})

    async def avviso(to, uid, utoken):
        if posta["tutti_falliscono"] or to in posta["fallisci"]:
            return None
        posta["avvisi"].append({"to": to, "id": uid, "utoken": utoken})
        return "id-finto"

    async def pausa(secondi):
        posta["pause"].append(secondi)

    monkeypatch.setattr(server, "send_waitlist_confirmation", conferma)
    monkeypatch.setattr(server, "send_waitlist_launch_notice", avviso)
    monkeypatch.setattr(server, "_pausa", pausa)
    server._limiti_client.clear()
    server._avviso_stato.update({"in_corso": False, "ultimo": None})
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
    asyncio.run(main())


def sha(t):
    return hashlib.sha256(t.encode()).hexdigest()


async def iscrivi(c, email, **extra):
    return await c.post(URL, json={"email": email, **CONSENSO, **extra})


async def conferma(c, posta, email):
    token = [m for m in posta["conferma"] if m["to"] == email][-1]["token"]
    r = await c.post(URL + "/confirm", json={"token": token})
    assert r.status_code == 200, r.text
    return token


async def admin(c):
    _, h = await nuovo_utente("admin")
    m = await c.post("/api/admin/verify-master", json={"password": MASTER}, headers=h)
    assert m.status_code == 200, m.text
    return {**h, "X-Admin-Master": m.json()["token"]}


async def avvia_avviso(c, ah):
    r = await c.post("/api/admin/lista-attesa/invia-avviso", json={"conferma": "AVVISA"}, headers=ah)
    assert r.status_code == 200, r.text
    if server._avviso_task is not None:
        await server._avviso_task
    return r.json()


def test_iscrizione_e_doppio_consenso(_ambiente):
    async def body(c):
        r = await iscrivi(c, "Nuova@Example.com", src="instagram")
        assert r.status_code == 200 and r.json()["ok"] is True
        assert len(_ambiente["conferma"]) == 1
        m = _ambiente["conferma"][0]
        assert m["to"] == "nuova@example.com" and len(m["token"]) >= 40
        doc = await server.db.waitlist.find_one({"email": "nuova@example.com"})
        assert doc["status"] == "da_confermare" and doc["src"] == "instagram"
        assert doc["consent_version"] == server.WAITLIST_CONSENT_VERSION
        assert doc["confirm_token_hash"] == sha(m["token"]) and m["token"] not in repr(doc)
        scad = datetime.fromisoformat(doc["confirm_expires"])
        assert timedelta(hours=47, minutes=55) < scad - datetime.now(timezone.utc) <= timedelta(hours=48)
        # si salvano solo questi campi: nessun IP, nessun dispositivo, nessun nome
        assert set(doc) <= {"_id", "id", "email", "created_at", "req_log", "notice_sent_at", "status", "consent_at",
                            "consent_version", "src", "confirm_token_hash", "confirm_expires"}
        assert "set-cookie" not in r.headers
        # conferma con il link
        ok = await c.post(URL + "/confirm", json={"token": m["token"]})
        assert ok.status_code == 200 and ok.json() == {"ok": True}
        doc = await server.db.waitlist.find_one({"email": "nuova@example.com"})
        assert doc["status"] == "confermata" and doc["confirmed_at"]
        assert "confirm_token_hash" not in doc and "confirm_expires" not in doc
        # monouso
        again = await c.post(URL + "/confirm", json={"token": m["token"]})
        assert again.status_code == 400 and again.json()["detail"]["code"] == "link_non_valido"
        assert (await c.post(URL + "/confirm", json={"token": "inventato"})).status_code == 400
        assert (await c.post(URL + "/confirm", json={"token": ""})).status_code == 400
    run(body)


def test_senza_consenso_non_si_salva_nulla(_ambiente):
    async def body(c):
        r = await c.post(URL, json={"email": "a@example.com", "consenso": False})
        assert r.status_code == 400 and "consenso" in r.json()["detail"]
        r = await c.post(URL, json={"email": "a@example.com"})
        assert r.status_code == 400
        assert await server.db.waitlist.count_documents({}) == 0 and not _ambiente["conferma"]
    run(body)


def test_token_scaduto(_ambiente):
    async def body(c):
        await iscrivi(c, "scade@example.com")
        await server.db.waitlist.update_one({"email": "scade@example.com"},
                                            {"$set": {"confirm_expires": (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat()}})
        r = await c.post(URL + "/confirm", json={"token": _ambiente["conferma"][0]["token"]})
        assert r.status_code == 400 and r.json()["detail"]["code"] == "link_scaduto"
        assert (await server.db.waitlist.find_one({"email": "scade@example.com"}))["status"] == "da_confermare"
    run(body)


def test_honeypot_finta_riuscita_senza_salvare(_ambiente):
    async def body(c):
        normale = await iscrivi(c, "vero@example.com")
        r = await iscrivi(c, "bot@example.com", sito_web="http://spam.example")
        assert r.status_code == 200 and r.json() == normale.json()
        assert await server.db.waitlist.find_one({"email": "bot@example.com"}) is None
        assert [m["to"] for m in _ambiente["conferma"]] == ["vero@example.com"]
    run(body)


def test_nessuna_rivelazione_dell_esistenza(_ambiente):
    async def body(c):
        nuova = await iscrivi(c, "x@example.com")
        # stessa email ancora da confermare (rimando limitato) e poi già confermata: risposta identica
        di_nuovo = await iscrivi(c, "x@example.com")
        await conferma(c, _ambiente, "x@example.com")
        confermata = await iscrivi(c, "x@example.com")
        for r in (di_nuovo, confermata):
            assert (r.status_code, r.json()) == (nuova.status_code, nuova.json())
        # chi è già confermato non riceve altre email
        assert len(_ambiente["conferma"]) == 1
        assert await server.db.waitlist.count_documents({"email": "x@example.com"}) == 1
    run(body)


def test_rimando_limitato_per_indirizzo(_ambiente):
    async def body(c):
        await iscrivi(c, "r@example.com")
        await iscrivi(c, "r@example.com")  # subito dopo: troppo presto, nessuna seconda email
        assert len(_ambiente["conferma"]) == 1
        # passato il minuto: il nuovo link sostituisce il vecchio
        vecchio = _ambiente["conferma"][0]["token"]
        passato = (datetime.now(timezone.utc) - timedelta(minutes=2)).isoformat()
        await server.db.waitlist.update_one({"email": "r@example.com"}, {"$set": {"req_log": [passato]}})
        await iscrivi(c, "r@example.com")
        assert len(_ambiente["conferma"]) == 2
        nuovo = _ambiente["conferma"][1]["token"]
        assert nuovo != vecchio
        assert (await c.post(URL + "/confirm", json={"token": vecchio})).status_code == 400
        # tetto orario: 5 richieste nell'ultima ora, poi basta
        ora = datetime.now(timezone.utc)
        await server.db.waitlist.update_one({"email": "r@example.com"}, {"$set": {"req_log": [
            (ora - timedelta(minutes=10 + i)).isoformat() for i in range(5)]}})
        await iscrivi(c, "r@example.com")
        assert len(_ambiente["conferma"]) == 2
    run(body)


def test_limite_per_dispositivo_in_memoria_senza_ip_salvato(_ambiente, monkeypatch):
    monkeypatch.setenv("WAITLIST_MAX_PER_CLIENT_10MIN", "3")
    monkeypatch.setenv("WAITLIST_MAX_PER_CLIENT_ORA", "5")
    async def body(c):
        codici = [(await iscrivi(c, f"d{i}@example.com")).status_code for i in range(5)]
        assert codici == [200, 200, 200, 429, 429]
        r = await iscrivi(c, "d9@example.com")
        assert r.status_code == 429 and r.headers.get("retry-after") == "600"
        # le chiavi in memoria sono impronte, non l'indirizzo IP
        chiavi = [k for k in server._limiti_client if k[0] == "lista-attesa"]
        assert chiavi and all(re.fullmatch(r"[0-9a-f]{16}", k[1]) for k in chiavi)
        # nessun IP nel database
        for d in await server.db.waitlist.find({}).to_list(None):
            assert "127.0.0.1" not in repr(d) and "ip" not in d
    run(body)


def test_fonte_da_lista_chiusa(_ambiente):
    assert server._waitlist_fonte("Instagram") == "instagram"
    assert server._waitlist_fonte("volantino-garbatella") == "volantino"
    assert server._waitlist_fonte("passaparola") == "passaparola"
    assert server._waitlist_fonte("") == "diretto" and server._waitlist_fonte(None) == "diretto"
    assert server._waitlist_fonte("<script>") == "altro" and server._waitlist_fonte("tiktok") == "altro"

    async def body(c):
        await iscrivi(c, "f1@example.com", src="facebook")
        await iscrivi(c, "f2@example.com", src="mario.rossi@example.org")
        await iscrivi(c, "f3@example.com")
        fonti = {d["email"]: d["src"] async for d in server.db.waitlist.find({})}
        assert fonti == {"f1@example.com": "facebook", "f2@example.com": "altro", "f3@example.com": "diretto"}
    run(body)


def test_fonte_gruppi_con_codice(_ambiente):
    f = server._waitlist_fonte
    assert f("facebook-garbatella") == "facebook-garbatella" and f("Gruppo-EUR-2") == "gruppo-eur-2"
    assert f("facebook-" + "a" * 20) == "facebook-" + "a" * 20
    assert f("facebook-" + "a" * 21) == "altro" and f("gruppo-" + "a" * 21) == "altro"
    for strano in ("facebook-Mario Rossi", "facebook-a@b.it", "gruppo-<b>", "facebook-a_b", "facebook-", "gruppo-è", "gruppo-a.b"):
        assert f(strano) == "altro", strano
    assert f("facebook") == "facebook" and f("volantino-xyz") == "volantino" and f("gruppox-1") == "altro"

    async def body(c):
        await iscrivi(c, "g1@example.com", src="facebook-garbatella")
        await iscrivi(c, "g2@example.com", src="facebook-garbatella")
        await iscrivi(c, "g3@example.com", src="gruppo-eur")
        await iscrivi(c, "g4@example.com", src="facebook")
        await iscrivi(c, "g5@example.com", src="facebook-" + "x" * 30)
        for e in ("g1@example.com", "g2@example.com", "g3@example.com", "g4@example.com"):
            await conferma(c, _ambiente, e)
        ah = await admin(c)
        per = {x["fonte"]: x for x in (await c.get("/api/admin/lista-attesa", headers=ah)).json()["per_fonte"]}
        assert per["facebook-garbatella"]["confermata"] == 2 and per["gruppo-eur"]["confermata"] == 1
        assert per["facebook"]["confermata"] == 1 and per["altro"]["da_confermare"] == 1
        r = await c.get("/api/admin/lista-attesa/esporta.csv", headers=ah)
        assert "facebook-garbatella" in r.text and "gruppo-eur" in r.text
    run(body)


def test_disiscrizione(_ambiente):
    async def body(c):
        await iscrivi(c, "u@example.com")
        await conferma(c, _ambiente, "u@example.com")
        doc = await server.db.waitlist.find_one({"email": "u@example.com"})
        tok = server._waitlist_unsub_token(doc["id"])
        # il link dell'email di conferma porta già id e firma validi
        assert _ambiente["conferma"][0]["id"] == doc["id"] and _ambiente["conferma"][0]["utoken"] == tok
        # firma sbagliata o id inventato: rifiutato, nessun cambiamento
        assert (await c.post(URL + "/unsubscribe", json={"i": doc["id"], "t": "x" * 32})).status_code == 400
        assert (await c.post(URL + "/unsubscribe", json={"i": "altro-id", "t": tok})).status_code == 400
        assert (await server.db.waitlist.find_one({"id": doc["id"]}))["status"] == "confermata"
        r = await c.post(URL + "/unsubscribe", json={"i": doc["id"], "t": tok})
        assert r.status_code == 200 and r.json() == {"ok": True}
        assert (await server.db.waitlist.find_one({"id": doc["id"]}))["status"] == "disiscritta"
        # ripetibile; un id che non esiste più (cancellato) risponde ugualmente bene
        assert (await c.post(URL + "/unsubscribe", json={"i": doc["id"], "t": tok})).status_code == 200
        falso = "id-cancellato"
        assert (await c.post(URL + "/unsubscribe", json={"i": falso, "t": server._waitlist_unsub_token(falso)})).status_code == 200
        # chi è disiscritto non riceve l'avviso e non è nell'esportazione
        ah = await admin(c)
        assert (await avvia_avviso(c, ah))["avviato"] is False
        csv = (await c.get("/api/admin/lista-attesa/esporta.csv", headers=ah)).text
        assert "u@example.com" not in csv
        # può iscriversi di nuovo: nuovo consenso, ma resta da confermare
        await server.db.waitlist.update_one({"id": doc["id"]}, {"$set": {"req_log": []}})
        await iscrivi(c, "u@example.com")
        assert (await server.db.waitlist.find_one({"id": doc["id"]}))["status"] == "da_confermare"
    run(body)


def test_pulizia_dei_non_confermati_dopo_7_giorni(_ambiente):
    async def body(c):
        for e in ("vecchia", "recente", "confermata", "disiscritta"):
            await iscrivi(c, f"{e}@example.com")
        await conferma(c, _ambiente, "confermata@example.com")
        antico = (datetime.now(timezone.utc) - timedelta(days=8)).isoformat()
        await server.db.waitlist.update_many({"email": {"$in": ["vecchia@example.com", "confermata@example.com", "disiscritta@example.com"]}},
                                             {"$set": {"consent_at": antico}})
        await server.db.waitlist.update_one({"email": "disiscritta@example.com"}, {"$set": {"status": "disiscritta"}})
        assert await server._run_waitlist_cleanup() == {"deleted": 1}
        resta = sorted([d["email"] async for d in server.db.waitlist.find({})])
        assert resta == ["confermata@example.com", "disiscritta@example.com", "recente@example.com"]
        assert await server._run_waitlist_cleanup() == {"deleted": 0}
    run(body)


def test_cancellazione_dopo_12_mesi_confermate_e_annullate(_ambiente, caplog):
    """Orologio finto: 11 mesi e 29 giorni resta, 12 mesi e 1 giorno sparisce; confermate (data iscrizione) e annullate
    (data annullamento). Nei log solo indirizzi mascherati."""
    import logging
    ora = datetime(2027, 10, 14, 3, 50, tzinfo=timezone.utc)
    limite = server._meno_mesi(ora, 12)
    dopo = lambda giorni: (limite + timedelta(days=giorni)).isoformat()  # noqa: E731
    righe = [
        ("conf-nuova@example.com", "confermata", {"consent_at": dopo(1)}),     # 11 mesi e 29 giorni
        ("conf-vecchia@example.com", "confermata", {"consent_at": dopo(-1)}),  # 12 mesi e 1 giorno
        ("ann-nuova@example.com", "disiscritta", {"consent_at": dopo(-500), "unsubscribed_at": dopo(1)}),
        ("ann-vecchia@example.com", "disiscritta", {"consent_at": dopo(-500), "unsubscribed_at": dopo(-1)}),
        ("ann-senza-data@example.com", "disiscritta", {"consent_at": dopo(-30)}),  # ripiega su consent_at
        ("attesa@example.com", "da_confermare", {"consent_at": dopo(-300)}),       # non è compito di questo lavoro
        ("esatta@example.com", "confermata", {"consent_at": limite.isoformat()}),  # 12 mesi esatti: ancora dentro
    ]

    async def body(c):
        for i, (email, stato, campi) in enumerate(righe):
            await server.db.waitlist.insert_one({"id": f"id{i}", "email": email, "status": stato,
                                                 "created_at": dopo(-1000), **campi})
        with caplog.at_level(logging.INFO):
            assert await server._run_waitlist_retention(ora) == {"skipped": False, "deleted": 3}
        resta = sorted([d["email"] async for d in server.db.waitlist.find({})])
        assert resta == ["ann-nuova@example.com", "attesa@example.com", "conf-nuova@example.com", "esatta@example.com"]
        assert "conf-vecchia@example.com" not in caplog.text and "c***@example.com" in caplog.text
        # stessa giornata: prenotata, non si ripete (nemmeno da un'altra copia del server)
        assert await server._run_waitlist_retention(ora) == {"skipped": True, "deleted": 0}
        # il giorno dopo l'iscrizione di 12 mesi esatti è diventata troppo vecchia
        assert await server._run_waitlist_retention(ora + timedelta(days=1)) == {"skipped": False, "deleted": 1}
    run(body)


def test_cancellazione_12_mesi_vale_a_interruttore_spento_e_senza_iscrizioni(_ambiente, monkeypatch):
    monkeypatch.setenv("PRELAUNCH_MODE", "false")

    async def body(c):
        await server.db.waitlist.delete_many({})
        assert await server._run_waitlist_retention(datetime(2027, 1, 1, tzinfo=timezone.utc)) == {"skipped": False, "deleted": 0}
        await server.db.waitlist.insert_one({"id": "x", "email": "x@example.com", "status": "confermata",
                                             "consent_at": "2025-01-01T00:00:00+00:00"})
        assert (await server._run_waitlist_retention(datetime(2027, 1, 2, tzinfo=timezone.utc)))["deleted"] == 1
    run(body)


def test_meno_mesi_bisestile():
    assert server._meno_mesi(datetime(2028, 2, 29, tzinfo=timezone.utc), 12) == datetime(2027, 2, 28, tzinfo=timezone.utc)
    assert server._meno_mesi(datetime(2027, 1, 15, tzinfo=timezone.utc), 12) == datetime(2026, 1, 15, tzinfo=timezone.utc)


def test_conteggi_e_csv_solo_confermate(_ambiente):
    async def body(c):
        await iscrivi(c, "a@example.com", src="instagram")
        await iscrivi(c, "b@example.com", src="instagram")
        await iscrivi(c, "c@example.com", src="volantino")
        await conferma(c, _ambiente, "a@example.com")
        await conferma(c, _ambiente, "c@example.com")
        ba = await server.db.waitlist.find_one({"email": "b@example.com"})
        await c.post(URL + "/unsubscribe", json={"i": ba["id"], "t": server._waitlist_unsub_token(ba["id"])})
        await iscrivi(c, "d@example.com")  # resta da confermare
        ah = await admin(c)
        j = (await c.get("/api/admin/lista-attesa", headers=ah)).json()
        assert (j["da_confermare"], j["confermate"], j["disiscritte"]) == (1, 2, 1)
        per = {f["fonte"]: f for f in j["per_fonte"]}
        assert per["instagram"]["confermata"] == 1 and per["instagram"]["disiscritta"] == 1
        assert per["volantino"]["confermata"] == 1 and per["diretto"]["da_confermare"] == 1
        r = await c.get("/api/admin/lista-attesa/esporta.csv", headers=ah)
        assert r.status_code == 200 and "text/csv" in r.headers["content-type"]
        assert "attachment" in r.headers["content-disposition"]
        righe = r.text.lstrip("﻿").strip().split("\r\n")
        assert len(righe) == 3  # intestazione + 2 confermate
        assert "a@example.com" in r.text and "c@example.com" in r.text
        assert "b@example.com" not in r.text and "d@example.com" not in r.text
        assert "token" not in r.text.lower() and "hash" not in r.text.lower()
        # solo l'admin con la master password
        _, ch = await nuovo_utente("client")
        for h in ({}, ch):
            assert (await c.get("/api/admin/lista-attesa", headers=h)).status_code in (401, 403)
            assert (await c.get("/api/admin/lista-attesa/esporta.csv", headers=h)).status_code in (401, 403)
            assert (await c.post("/api/admin/lista-attesa/invia-avviso", json={"conferma": "AVVISA"}, headers=h)).status_code in (401, 403)
    run(body)


def test_avviso_parola_di_conferma(_ambiente):
    async def body(c):
        ah = await admin(c)
        await iscrivi(c, "p@example.com")
        await conferma(c, _ambiente, "p@example.com")
        for parola in ("", "avvisa tutti", "LANCIA", None):
            r = await c.post("/api/admin/lista-attesa/invia-avviso", json={"conferma": parola}, headers=ah)
            assert r.status_code == 400
        assert not _ambiente["avvisi"]
        r = await avvia_avviso(c, ah)  # la parola vale anche in minuscolo
        assert r == {"avviato": True, "da_inviare": 1}
        assert [m["to"] for m in _ambiente["avvisi"]] == ["p@example.com"]
    run(body)


def test_avviso_idempotente_a_lotti_con_pausa(_ambiente, monkeypatch):
    monkeypatch.setenv("WAITLIST_LOTTO", "2")
    monkeypatch.setenv("WAITLIST_PAUSA_MESSAGGIO_SEC", "0.5")
    monkeypatch.setenv("WAITLIST_PAUSA_LOTTO_SEC", "3")

    async def body(c):
        ah = await admin(c)
        for i in range(5):
            await iscrivi(c, f"l{i}@example.com")
            await conferma(c, _ambiente, f"l{i}@example.com")
        await iscrivi(c, "nonconf@example.com")  # da confermare: escluso
        r = await avvia_avviso(c, ah)
        assert r == {"avviato": True, "da_inviare": 5}
        destinatari = sorted(m["to"] for m in _ambiente["avvisi"])
        assert destinatari == [f"l{i}@example.com" for i in range(5)]
        # 5 persone, lotti da 2 = 3 lotti; pausa lunga tra i lotti, breve tra i messaggi
        assert _ambiente["pause"].count(3.0) == 3 and _ambiente["pause"].count(0.5) == 5
        ultimo = server._avviso_stato["ultimo"]
        assert ultimo["inviati"] == 5 and ultimo["lotti"] == 3 and ultimo["restano"] == 0 and ultimo["fermato_per"] is None
        # ogni email porta il link di disiscrizione valido
        for m in _ambiente["avvisi"]:
            assert m["utoken"] == server._waitlist_unsub_token(m["id"])
        # secondo giro: nessuno riceve due volte
        assert await avvia_avviso(c, ah) == {"avviato": False, "da_inviare": 0}
        assert len(_ambiente["avvisi"]) == 5
        # una nuova confermata riceve solo il suo
        await iscrivi(c, "nuova@example.com")
        await conferma(c, _ambiente, "nuova@example.com")
        assert (await avvia_avviso(c, ah))["da_inviare"] == 1
        assert len(_ambiente["avvisi"]) == 6 and _ambiente["avvisi"][-1]["to"] == "nuova@example.com"
        j = (await c.get("/api/admin/lista-attesa", headers=ah)).json()
        assert j["avviso"]["avvisate"] == 6 and j["avviso"]["da_avvisare"] == 0 and j["avviso"]["in_corso"] is False
    run(body)


def test_avviso_richieste_insieme_non_duplicano(_ambiente):
    async def body(c):
        for i in range(3):
            await iscrivi(c, f"k{i}@example.com")
            await conferma(c, _ambiente, f"k{i}@example.com")
        # due giri contemporanei sulle stesse persone: ognuna è prenotata una volta sola
        await asyncio.gather(server._invia_avviso_lancio(), server._invia_avviso_lancio())
        assert sorted(m["to"] for m in _ambiente["avvisi"]) == [f"k{i}@example.com" for i in range(3)]
    run(body)


def test_avviso_errori_riprovabili_e_stop_dopo_tre(_ambiente):
    async def body(c):
        for i in range(5):
            await iscrivi(c, f"e{i}@example.com")
            await conferma(c, _ambiente, f"e{i}@example.com")
        _ambiente["tutti_falliscono"] = True
        esito = await server._invia_avviso_lancio()
        assert esito["inviati"] == 0 and esito["non_inviati"] == 3 and esito["fermato_per"] == "errori" and esito["restano"] == 5
        # nessuno è segnato come avvisato: al giro dopo riceve
        assert await server.db.waitlist.count_documents({"notice_sent_at": {"$ne": None}}) == 0
        _ambiente["tutti_falliscono"] = False
        esito = await server._invia_avviso_lancio()
        assert esito["inviati"] == 5 and esito["restano"] == 0
        assert len(_ambiente["avvisi"]) == 5
    run(body)


def test_avviso_tetto_giornaliero(_ambiente, monkeypatch):
    monkeypatch.setenv("WAITLIST_DAILY_CAP", "3")

    async def body(c):
        for i in range(5):
            await iscrivi(c, f"t{i}@example.com")
            await conferma(c, _ambiente, f"t{i}@example.com")
        esito = await server._invia_avviso_lancio()
        assert esito["inviati"] == 3 and esito["fermato_per"] == "tetto_giornaliero" and esito["restano"] == 2
        # lo stesso giorno non si manda altro
        esito = await server._invia_avviso_lancio()
        assert esito["inviati"] == 0 and esito["fermato_per"] == "tetto_giornaliero"
        # il giorno dopo (invii di ieri) si riprende da dove ci si era fermati
        ieri = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        await server.db.waitlist.update_many({"notice_sent_at": {"$ne": None}}, {"$set": {"notice_sent_at": ieri}})
        esito = await server._invia_avviso_lancio()
        assert esito["inviati"] == 2 and esito["restano"] == 0
        assert len({m["to"] for m in _ambiente["avvisi"]}) == 5
    run(body)


def test_avviso_tetto_predefinito_80(_ambiente, monkeypatch):
    """Senza WAITLIST_DAILY_CAP il tetto è 80 al giorno (prova generale del 14/10): le altre vanno al giorno dopo."""
    monkeypatch.delenv("WAITLIST_DAILY_CAP", raising=False)

    async def body(c):
        for i in range(85):
            await iscrivi(c, f"p{i}@example.com")
            await conferma(c, _ambiente, f"p{i}@example.com")
        ah = await admin(c)
        stato = (await c.get("/api/admin/lista-attesa", headers=ah)).json()
        assert stato["avviso"]["tetto_giornaliero"] == 80 and stato["avviso"]["da_avvisare"] == 85
        esito = await server._invia_avviso_lancio()
        assert esito["inviati"] == 80 and esito["fermato_per"] == "tetto_giornaliero" and esito["restano"] == 5
        assert len({m["to"] for m in _ambiente["avvisi"]}) == 80
        # la parola sbagliata non fa partire nulla
        r = await c.post("/api/admin/lista-attesa/invia-avviso", json={"conferma": "avvisa tutti"}, headers=ah)
        assert r.status_code == 400
        assert len(_ambiente["avvisi"]) == 80
    run(body)


def test_interruttore_spento_nulla_cambia(_ambiente, monkeypatch):
    monkeypatch.setenv("PRELAUNCH_MODE", "false")

    async def body(c):
        cfg = (await c.get("/api/config/public")).json()
        assert cfg["prelaunch_mode"] is False and "client_subscription_required" in cfg and "ai_enhance_enabled" in cfg
        r = await iscrivi(c, "off@example.com")
        assert r.status_code == 404
        assert await server.db.waitlist.count_documents({}) == 0 and not _ambiente["conferma"]
        # i link già spediti continuano a funzionare anche a interruttore spento
        monkeypatch.setenv("PRELAUNCH_MODE", "true")
        await iscrivi(c, "on@example.com")
        monkeypatch.setenv("PRELAUNCH_MODE", "false")
        assert (await c.post(URL + "/confirm", json={"token": _ambiente["conferma"][0]["token"]})).status_code == 200
        # le funzioni per i negozi e per i clienti sono quelle di sempre
        assert (await c.get("/api/discounts")).json() == {"discounts": []}
        assert (await c.get("/api/zones")).status_code == 200
        reg = await c.post("/api/auth/register", json={"email": "cliente@example.com", "password": "password-giusta-123",
                                                      "name": "Giulia Prova", "role": "client", "legal_accepted": True})
        assert reg.status_code == 200
        neg = await c.post("/api/auth/register", json={
            "email": "negozio@example.com", "password": "password-giusta-123", "name": "Titolare Prova", "role": "merchant",
            "legal_accepted": True, "legal_specific_accepted": True, "shop_name": "Negozio Prova", "phone": "0600000000", "partita_iva": "12345678903"})
        assert neg.status_code == 200
    run(body)


def test_interruttore_acceso_espone_la_modalita_e_lascia_i_negozi(_ambiente):
    async def body(c):
        assert (await c.get("/api/config/public")).json()["prelaunch_mode"] is True
        neg = await c.post("/api/auth/register", json={
            "email": "negozio@example.com", "password": "password-giusta-123", "name": "Titolare Prova", "role": "merchant",
            "legal_accepted": True, "legal_specific_accepted": True, "shop_name": "Negozio Prova", "phone": "0600000000", "partita_iva": "12345678903"})
        assert neg.status_code == 200
        assert (await c.get("/api/discounts")).json() == {"discounts": []}
    run(body)


def test_registrazione_clienti_chiusa_in_prelancio(_ambiente, monkeypatch):
    """Con PRELAUNCH_MODE acceso i CLIENTI non si registrano (403); i negozi sì; spento tutto come sempre."""
    cliente = {"email": "cliente-pre@example.com", "password": "password-giusta-123", "name": "Giulia Prova",
               "role": "client", "legal_accepted": True}
    negozio = {"email": "negozio-pre@example.com", "password": "password-giusta-123", "name": "Titolare Prova",
               "role": "merchant", "legal_accepted": True, "legal_specific_accepted": True,
               "shop_name": "Negozio Prova", "phone": "0600000000", "partita_iva": "12345678903"}

    async def body(c):
        r = await c.post("/api/auth/register", json=cliente)
        assert r.status_code == 403 and "Stiamo arrivando" in r.json()["detail"]
        assert await server.db.users.find_one({"email": cliente["email"]}) is None
        assert (await c.post("/api/auth/register", json=negozio)).status_code == 200
        monkeypatch.setenv("PRELAUNCH_MODE", "false")
        assert (await c.post("/api/auth/register", json=cliente)).status_code == 200
    run(body)


def test_avviso_riprende_da_solo_ogni_giorno(_ambiente, monkeypatch):
    """Dopo AVVISA l'invio prosegue da solo, un giorno alla volta, col tetto giornaliero e senza doppi invii."""
    monkeypatch.setenv("WAITLIST_DAILY_CAP", "2")

    async def body(c):
        for i in range(5):
            await iscrivi(c, f"g{i}@example.com")
            await conferma(c, _ambiente, f"g{i}@example.com")
        # prima di AVVISA non parte mai nulla
        assert (await server._avviso_giornaliero())["saltato"] == "non_avviato"
        assert _ambiente["avvisi"] == []
        ah = await admin(c)
        await avvia_avviso(c, ah)                      # giorno 1: ne partono 2 (tetto)
        assert len(_ambiente["avvisi"]) == 2
        assert (await server._avviso_giornaliero())["inviati"] == 0   # stesso giorno: tetto raggiunto, nulla di più
        giorno = server._rome_now().date()

        async def passa_un_giorno(n):
            monkeypatch.setattr(server, "_rome_now", lambda: datetime.combine(giorno + timedelta(days=n), datetime.min.time()).replace(hour=10))
            ieri = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
            await server.db.waitlist.update_many({"notice_sent_at": {"$ne": None}}, {"$set": {"notice_sent_at": ieri}})

        await passa_un_giorno(1)                       # giorno 2: altri 2, anche con due lavori insieme
        esiti = await asyncio.gather(server._avviso_giornaliero(), server._avviso_giornaliero())
        assert sum(e["inviati"] for e in esiti) == 2
        assert (await server._avviso_giornaliero())["saltato"] == "gia_fatto_oggi"
        assert len(_ambiente["avvisi"]) == 4
        await passa_un_giorno(2)                       # giorno 3: l'ultima, poi il proseguimento si spegne
        assert (await server._avviso_giornaliero())["inviati"] == 1
        assert len(_ambiente["avvisi"]) == 5 and len({m["to"] for m in _ambiente["avvisi"]}) == 5
        stato = await server.db.settings.find_one({"key": "avviso_lancio_automatico"})
        assert stato["attivo"] is False
        await passa_un_giorno(3)
        assert (await server._avviso_giornaliero())["saltato"] == "non_avviato"
        assert len(_ambiente["avvisi"]) == 5
    run(body)


def test_valore_predefinito_dell_interruttore_e_spento(monkeypatch):
    monkeypatch.delenv("PRELAUNCH_MODE", raising=False)
    assert server.prelaunch_mode() is False
    for v in ("true", "1", "on", "YES"):
        monkeypatch.setenv("PRELAUNCH_MODE", v)
        assert server.prelaunch_mode() is True
    for v in ("false", "", "0", "no"):
        monkeypatch.setenv("PRELAUNCH_MODE", v)
        assert server.prelaunch_mode() is False


def test_testo_delle_email(monkeypatch):
    """Conferma e avviso: link di disiscrizione sempre presente; avviso senza prezzi, percentuali o date."""
    inviate = []

    async def finto(to, subject, html):
        inviate.append((to, subject, html))
        return "id-finto"

    monkeypatch.setattr(email_service, "_send", finto)

    async def main():
        await email_service.send_waitlist_confirmation("x@example.com", "TOKEN123", "ID1", "FIRMA1")
        await email_service.send_waitlist_launch_notice("x@example.com", "ID1", "FIRMA1")
    asyncio.run(main())
    (_, _, conf), (_, oggetto, avviso) = inviate
    assert "/lista-attesa/conferma?token=TOKEN123" in conf
    for h in (conf, avviso):
        assert "/lista-attesa/annulla?i=ID1&t=FIRMA1" in h
    assert oggetto == "Sconti Roma è online"
    testo = re.sub(r"<[^>]+>", " ", avviso)
    assert "Roma e dintorni" in testo and "18+" in testo
    assert not re.search(r"%|€|\d{1,2}/\d{1,2}|\b(gratis|gratuit|commission|bloccato)", testo, re.I)
