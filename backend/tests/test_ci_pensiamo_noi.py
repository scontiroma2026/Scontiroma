"""«Ci pensiamo noi»: l'admin inserisce l'offerta per conto del negozio, il negozio la conferma.

Server in-process (httpx + ASGI) su database locale o emulatore (mongomock): rifiuta database remoti,
quindi non può mai toccare il database di produzione. Nessuna email vera (RESEND_API_KEY vuota):
le email e le notifiche push sono intercettate qui.
"""
import asyncio
import os
import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import parse_qs, urlparse

import pytest

MONGO_URL = os.environ.setdefault("TEST_MONGO_URL", os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
_u = urlparse(MONGO_URL)
if not (_u.scheme == "mongomock" or (_u.scheme == "mongodb" and (_u.hostname or "") in ("localhost", "127.0.0.1", "::1"))):
    pytest.exit(f"MONGO_URL non locale ({_u.scheme}://{_u.hostname}): test rifiutati.", returncode=2)
USE_MOCK = _u.scheme == "mongomock"
DB_NAME = "e2e_unit_ci_pensiamo_noi"
os.environ["MONGO_URL"] = "mongodb://localhost:27017" if USE_MOCK else MONGO_URL
os.environ.setdefault("DB_NAME", DB_NAME)
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")
os.environ["RESEND_API_KEY"] = ""

import httpx  # noqa: E402

import server  # noqa: E402

OFFERTA = {
    "title": "Menù di carne per due", "description": "Antipasto, secondo e dolce",
    "original_price": 60, "discounted_price": 45,
    "image_urls": ["/esempi/foto-di-prova.jpg"], "validity_info": "Da lunedì a venerdì, 12-15",
    "terms": "Su prenotazione", "max_uses_per_month": 2,
}


class Registro:
    """Raccoglie email e notifiche push al posto degli invii veri."""
    def __init__(self):
        self.email_negozio, self.email_admin, self.push = [], [], []


def run(body, admin=True):
    reg = Registro()
    originali = (server.send_ci_pensiamo_noi, server.send_admin_offerta_confermata, server._push_admin_in_background)

    async def finta_email_negozio(*args, **kwargs):
        reg.email_negozio.append(args)
        return "id-finto"

    def finta_email_admin(*args, **kwargs):
        reg.email_admin.append(args)

        async def _niente():
            return None
        return _niente()

    server.send_ci_pensiamo_noi = finta_email_negozio
    server.send_admin_offerta_confermata = finta_email_admin
    server._push_admin_in_background = lambda titolo, testo="", label="": reg.push.append((titolo, testo))
    os.environ["ADMIN_NOTIFY_EMAIL"] = "admin@example.com"

    async def main():
        if USE_MOCK:
            import mongomock_motor
            server.db = mongomock_motor.AsyncMongoMockClient()[DB_NAME]
        else:
            from motor.motor_asyncio import AsyncIOMotorClient
            cli = AsyncIOMotorClient(MONGO_URL)
            await cli.drop_database(DB_NAME)
            server.db = cli[DB_NAME]

        async def finto_admin():
            return {"id": "admin", "role": "admin"}
        if admin:
            server.app.dependency_overrides[server.require_admin_master] = finto_admin
        try:
            transport = httpx.ASGITransport(app=server.app)
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
                await body(c, reg)
                await asyncio.sleep(0)  # lascia finire gli invii in background
        finally:
            server.app.dependency_overrides.pop(server.require_admin_master, None)
    try:
        asyncio.run(main())
    finally:
        server.send_ci_pensiamo_noi, server.send_admin_offerta_confermata, server._push_admin_in_background = originali
        os.environ.pop("ADMIN_NOTIFY_EMAIL", None)


async def negozio(nome="Trattoria di prova"):
    mid = str(uuid.uuid4())
    email = f"m.{mid[:8]}@example.com"
    await server.db.users.insert_one({"id": mid, "email": email, "name": "Prova", "role": "merchant",
                                      "shop_name": nome, "zone": "Garbatella", "category": "Ristoranti",
                                      "created_at": datetime.now(timezone.utc).isoformat()})
    return mid, {"Authorization": f"Bearer {server.create_token(mid, email)}"}


def token_dal_link(reg) -> str:
    link = reg.email_negozio[-1][4]
    return parse_qs(urlparse(link).query)["token"][0]


async def prepara(c, mid):
    r = await c.post(f"/api/admin/merchants/{mid}/ci-pensiamo-noi", json=OFFERTA)
    assert r.status_code == 200, r.text
    return r.json()["discount"]


# ---------- Creazione: solo admin ----------
def test_solo_admin_puo_preparare():
    async def body(c, reg):
        mid, h = await negozio()
        r = await c.post(f"/api/admin/merchants/{mid}/ci-pensiamo-noi", json=OFFERTA, headers=h)
        assert r.status_code in (401, 403)
        r = await c.post(f"/api/admin/merchants/{mid}/ci-pensiamo-noi", json=OFFERTA)
        assert r.status_code in (401, 403)
        assert await server.db.discounts.count_documents({}) == 0
        assert reg.email_negozio == []
    run(body, admin=False)


def test_admin_crea_offerta_in_attesa_del_negozio_e_manda_email():
    async def body(c, reg):
        mid, _ = await negozio()
        d = await prepara(c, mid)
        assert d["approval_status"] == "awaiting_merchant"
        assert d["prepared_by_admin"] is True and d["merchant_confirmed_at"] is None
        assert d["max_uses_per_month"] == 2 and d["validity_info"].startswith("Da lunedì")
        # Email al commerciante: offerta completa, testo di responsabilità, link di conferma e di modifica
        assert len(reg.email_negozio) == 1
        to, _nome, negozio_nome, offerta, link_conferma, link_modifica, testo, giorni = reg.email_negozio[0]
        assert to.endswith("@example.com") and negozio_nome == "Trattoria di prova"
        assert offerta["title"] == OFFERTA["title"] and offerta["image_urls"] == OFFERTA["image_urls"]
        assert "/conferma-offerta?token=" in link_conferma and link_modifica.endswith("/merchant/discount")
        assert "te ne assumi la responsabilità" in testo and giorni == 7
        # Nel database c'è solo l'impronta del token, non il token
        link = await server.db.ci_pensiamo_noi_link.find_one({})
        assert link["token_hash"] != token_dal_link(reg) and "token" not in link
        # Nessuna notifica all'admin prima della conferma
        assert reg.email_admin == [] and reg.push == []
    run(body)


def test_non_sostituisce_offerta_in_revisione_o_approvata():
    async def body(c, reg):
        for stato in ("pending", "approved"):
            mid, _ = await negozio()
            await server.db.discounts.insert_one({"id": str(uuid.uuid4()), "merchant_id": mid, "title": "Sua",
                                                  "description": "x", "original_price": 10, "discounted_price": 5,
                                                  "approval_status": stato, "active": True})
            r = await c.post(f"/api/admin/merchants/{mid}/ci-pensiamo-noi", json=OFFERTA)
            assert r.status_code == 409
            assert (await server.db.discounts.find_one({"merchant_id": mid}))["title"] == "Sua"
        r = await c.post(f"/api/admin/merchants/{uuid.uuid4()}/ci-pensiamo-noi", json=OFFERTA)
        assert r.status_code == 404
    run(body)


# ---------- Non visibile ai clienti, nessuna prova ----------
def test_offerta_da_confermare_non_visibile_e_non_avvia_la_prova():
    async def body(c, reg):
        mid, _ = await negozio()
        d = await prepara(c, mid)
        assert (await c.get(f"/api/discounts/{d['id']}")).status_code == 404
        elenco = (await c.get("/api/discounts")).json()
        ids = [x["id"] for x in (elenco.get("discounts") if isinstance(elenco, dict) else elenco)]
        assert d["id"] not in ids
        r = await c.get(f"/api/negozio/{mid}")
        assert r.status_code == 200 and r.json()["discount"] is None
        # Non conta come pubblicazione: la prova non parte
        m = await server.db.users.find_one({"id": mid})
        assert not m.get("first_published_at") and await server._prima_pubblicazione(m) is None
        # L'admin non può approvarla né sbloccarla prima della conferma del negozio
        assert (await c.post(f"/api/admin/discounts/{d['id']}/approve", json={})).status_code == 409
        assert (await c.post(f"/api/admin/discounts/{d['id']}/force-edit")).status_code == 409
        r = await c.post("/api/admin/discounts/approve-all-pending", json={"conferma": "LANCIA"})
        assert r.json()["approvate"] == 0
        assert (await server.db.discounts.find_one({"id": d["id"]}))["approval_status"] == "awaiting_merchant"
        assert (await c.get("/api/admin/discounts/pending")).json()["discounts"] == []
    run(body)


# ---------- Token ----------
def test_conferma_con_link_passa_in_revisione_e_avvisa_admin():
    async def body(c, reg):
        mid, _ = await negozio()
        d = await prepara(c, mid)
        token = token_dal_link(reg)
        r = await c.post("/api/ci-pensiamo-noi/anteprima", json={"token": token})
        assert r.status_code == 200
        assert r.json()["offerta"]["title"] == OFFERTA["title"] and r.json()["negozio"] == "Trattoria di prova"
        assert "responsabilità" in r.json()["testo_conferma"]
        r = await c.post("/api/ci-pensiamo-noi/conferma", json={"token": token})
        assert r.status_code == 200, r.text
        d2 = await server.db.discounts.find_one({"id": d["id"]})
        assert d2["approval_status"] == "pending"
        assert d2["merchant_confirmed_at"] and d2["merchant_confirm_version"] == server.CPN_TESTO_VERSIONE
        prova = await server.db.conferme_offerta.find_one({"discount_id": d["id"]})
        assert prova["confirmed_at"] and prova["testo_versione"] == server.CPN_TESTO_VERSIONE
        assert not any(k for k in prova if "ip" == k.lower() or "user_agent" in k.lower())
        # Ora segue il flusso normale: è tra le offerte in attesa di approvazione
        assert [x["id"] for x in (await c.get("/api/admin/discounts/pending")).json()["discounts"]] == [d["id"]]
        # Notifica all'admin (email + push)
        await asyncio.sleep(0)
        assert reg.email_admin and reg.email_admin[0][1] == "Trattoria di prova"
        assert reg.push and reg.push[0][0] == "Il negozio Trattoria di prova ha confermato l'offerta"
        # Confermata ma non ancora approvata: la prova non parte
        assert await server._prima_pubblicazione(await server.db.users.find_one({"id": mid})) is None
        # Dopo l'approvazione dell'admin parte come ogni altra offerta
        assert (await c.post(f"/api/admin/discounts/{d['id']}/approve", json={})).status_code == 200
        assert (await server.db.users.find_one({"id": mid}))["first_published_at"]
    run(body)


def test_token_riutilizzato_non_vale():
    async def body(c, reg):
        mid, _ = await negozio()
        await prepara(c, mid)
        token = token_dal_link(reg)
        assert (await c.post("/api/ci-pensiamo-noi/conferma", json={"token": token})).status_code == 200
        for url in ("/api/ci-pensiamo-noi/conferma", "/api/ci-pensiamo-noi/anteprima"):
            r = await c.post(url, json={"token": token})
            assert r.status_code == 400 and r.json()["detail"]["code"] == "link_usato"
        assert await server.db.conferme_offerta.count_documents({}) == 1
    run(body)


def test_token_scaduto_o_inventato():
    async def body(c, reg):
        mid, _ = await negozio()
        d = await prepara(c, mid)
        token = token_dal_link(reg)
        ieri = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        await server.db.ci_pensiamo_noi_link.update_one({"discount_id": d["id"]}, {"$set": {"expires_at": ieri}})
        r = await c.post("/api/ci-pensiamo-noi/conferma", json={"token": token})
        assert r.status_code == 400 and r.json()["detail"]["code"] == "link_scaduto"
        for t in ("", "inventato", token + "x"):
            r = await c.post("/api/ci-pensiamo-noi/conferma", json={"token": t})
            assert r.status_code == 400 and r.json()["detail"]["code"] == "link_non_valido"
        assert (await server.db.discounts.find_one({"id": d["id"]}))["approval_status"] == "awaiting_merchant"
    run(body)


def test_scadenza_dopo_sette_giorni():
    async def body(c, reg):
        mid, _ = await negozio()
        await prepara(c, mid)
        link = await server.db.ci_pensiamo_noi_link.find_one({})
        durata = datetime.fromisoformat(link["expires_at"]) - datetime.fromisoformat(link["created_at"])
        assert durata == timedelta(days=7)
    run(body)


def test_nuova_versione_dell_admin_annulla_il_link_vecchio():
    async def body(c, reg):
        mid, _ = await negozio()
        await prepara(c, mid)
        vecchio = token_dal_link(reg)
        await prepara(c, mid)
        nuovo = token_dal_link(reg)
        r = await c.post("/api/ci-pensiamo-noi/conferma", json={"token": vecchio})
        assert r.status_code == 400 and r.json()["detail"]["code"] == "link_usato"
        assert (await c.post("/api/ci-pensiamo-noi/conferma", json={"token": nuovo})).status_code == 200
        assert await server.db.discounts.count_documents({"merchant_id": mid}) == 1
    run(body)


# ---------- «Voglio modificarla»: serve il login del proprietario ----------
def test_modificarla_richiede_login_del_proprietario():
    async def body(c, reg):
        mid, h = await negozio()
        altro, h_altro = await negozio("Altro negozio")
        d = await prepara(c, mid)
        token = token_dal_link(reg)
        modifica = {**OFFERTA, "title": "Menù corretto dal negozio"}
        # Senza login: niente
        assert (await c.post("/api/merchants/me/discount", json=modifica)).status_code == 401
        assert (await c.post("/api/merchants/me/discount/conferma-preparata")).status_code == 401
        # Un altro negozio non tocca l'offerta preparata (salva solo la sua)
        assert (await c.post("/api/merchants/me/discount/conferma-preparata", headers=h_altro)).status_code == 409
        await c.post("/api/merchants/me/discount", json=modifica, headers=h_altro)
        d1 = await server.db.discounts.find_one({"id": d["id"]})
        assert d1["title"] == OFFERTA["title"] and d1["approval_status"] == "awaiting_merchant"
        # Il proprietario la vede con il segno «preparata da Sconti Roma»
        r = await c.get("/api/merchants/me/discount", headers=h)
        assert r.json()["discount"]["prepared_by_admin"] is True
        assert r.json()["discount"]["approval_status"] == "awaiting_merchant"
        # ... la modifica e la invia: va in revisione e il link dell'email non vale più
        r = await c.post("/api/merchants/me/discount", json=modifica, headers=h)
        assert r.status_code == 200
        d2 = await server.db.discounts.find_one({"id": d["id"]})
        assert d2["title"] == "Menù corretto dal negozio" and d2["approval_status"] == "pending"
        assert d2["merchant_confirm_via"] == "modifica"
        r = await c.post("/api/ci-pensiamo-noi/conferma", json={"token": token})
        assert r.status_code == 400 and r.json()["detail"]["code"] == "link_usato"
        assert altro != mid
    run(body)


def test_conferma_dalla_dashboard():
    async def body(c, reg):
        mid, h = await negozio()
        d = await prepara(c, mid)
        r = await c.post("/api/merchants/me/discount/conferma-preparata", headers=h)
        assert r.status_code == 200 and r.json()["discount"]["approval_status"] == "pending"
        prova = await server.db.conferme_offerta.find_one({"discount_id": d["id"]})
        assert prova["via"] == "dashboard"
        # Il link dell'email ora non vale più; una seconda conferma non serve
        r = await c.post("/api/ci-pensiamo-noi/conferma", json={"token": token_dal_link(reg)})
        assert r.status_code == 400
        assert (await c.post("/api/merchants/me/discount/conferma-preparata", headers=h)).status_code == 409
    run(body)


def test_email_al_negozio_ha_riepilogo_responsabilita_e_pulsanti():
    """Il modello dell'email (senza invio: RESEND_API_KEY vuota) contiene tutto il necessario e protegge i testi."""
    import email_service

    catturato = {}

    async def finto_send(to, subject, html):
        catturato.update(to=to, subject=subject, html=html)
        return None
    originale = email_service._send
    email_service._send = finto_send
    try:
        offerta = {**OFFERTA, "title": "<b>Menù</b>", "percent_off": 25,
                   "image_urls": ["/esempi/a.jpg", "data:image/jpeg;base64,AAAA"]}
        asyncio.run(email_service.send_ci_pensiamo_noi(
            "negozio@example.com", "Mario", "Trattoria", offerta, "https://x/conferma-offerta?token=abc",
            "https://x/merchant/discount", server.CPN_TESTO_CONFERMA, 7))
    finally:
        email_service._send = originale
    html = catturato["html"]
    assert "Confermo" in html and "Voglio modificarla" in html
    assert "te ne assumi la responsabilità" in html and "gratuito" in html
    assert "&lt;b&gt;Menù&lt;/b&gt;" in html and "<b>Menù</b>" not in html
    assert "/esempi/a.jpg" in html and "data:image" not in html
    assert "45,00 €" in html and "Da lunedì a venerdì" in html and "2 volte per cliente" in html
