"""Link corto del QR della locandina (/q/<codice>): codice stabile, conteggio anonimo per negozio e giorno,
antiduplicazione, vecchio /n/<id> ancora valido, statistiche admin e numero per il commerciante."""
import asyncio
import json
import os
import uuid
from datetime import datetime, timezone
from urllib.parse import urlparse

import pytest

MONGO_URL = os.environ.setdefault("TEST_MONGO_URL", os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
_u = urlparse(MONGO_URL)
if not (_u.scheme == "mongomock" or (_u.scheme == "mongodb" and (_u.hostname or "") in ("localhost", "127.0.0.1", "::1"))):
    pytest.exit(f"MONGO_URL non locale ({_u.scheme}://{_u.hostname}): test rifiutati.", returncode=2)
USE_MOCK = _u.scheme == "mongomock"
DB_NAME = "e2e_unit_scansioni_qr"
os.environ["MONGO_URL"] = "mongodb://localhost:27017" if USE_MOCK else MONGO_URL
os.environ.setdefault("DB_NAME", DB_NAME)
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")
os.environ["RESEND_API_KEY"] = ""

import httpx  # noqa: E402

import server  # noqa: E402

UA = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1"}


@pytest.fixture(autouse=True)
def _ambiente(monkeypatch):
    monkeypatch.setenv("ADMIN_MASTER_PASSWORD", "master-test-123456")
    server._qr_ultimo_conteggio.clear()


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
        async with httpx.AsyncClient(transport=transport, base_url="http://test", headers=UA) as c:
            await body(c)
    asyncio.run(main())


async def negozio(sospeso=False, nome="Osteria dell'Esempio"):
    mid = str(uuid.uuid4())
    await server.db.users.insert_one({
        "id": mid, "role": "merchant", "approved": not sospeso, "email": f"m.{mid[:6]}@example.com", "password_hash": "x",
        "shop_name": nome, "zone": "Garbatella", "category": "Ristorante"})
    return mid


async def codice_di(c, mid):
    return (await c.get(f"/api/negozio/{mid}")).json()["negozio"]["qr_code"]


async def totale(mid):
    docs = await server.db.scansioni_locandina.find({"merchant_id": mid}).to_list(None)
    return sum(d["conteggio"] for d in docs)


async def admin(c):
    uid = str(uuid.uuid4())
    await server.db.users.insert_one({"id": uid, "email": f"a.{uid[:6]}@example.com", "role": "admin", "name": "A"})
    h = {"Authorization": f"Bearer {server.create_token(uid, 'x@example.com')}"}
    m = await c.post("/api/admin/verify-master", json={"password": "master-test-123456"}, headers=h)
    return {**h, "X-Admin-Master": m.json()["token"]}


def test_codice_stabile_breve_e_non_ambiguo():
    async def body(c):
        mid = await negozio()
        cod = await codice_di(c, mid)
        assert 4 <= len(cod) <= 6 and set(cod) <= set(server.QR_ALFABETO)
        assert not set(cod) & set("01OIL")
        assert await codice_di(c, mid) == cod                                    # stabile
        assert (await server.db.users.find_one({"id": mid}))["qr_code"] == cod   # salvato sul commerciante
        altri = {await codice_di(c, await negozio()) for _ in range(15)}
        assert cod not in altri and len(altri) == 15                              # diversi tra negozi
    run(body)


def test_scansione_conta_e_restituisce_il_negozio():
    async def body(c):
        mid = await negozio()
        cod = await codice_di(c, mid)
        r = await c.get(f"/api/q/{cod.lower()}")                                  # maiuscole/minuscole indifferenti
        assert r.status_code == 200, r.text
        assert r.json()["negozio"]["id"] == mid and r.json()["negozio"]["shop_name"] == "Osteria dell'Esempio"
        assert await totale(mid) == 1
        doc = await server.db.scansioni_locandina.find_one({"merchant_id": mid})
        assert doc["giorno"] == server._rome_day() and doc["conteggio"] == 1
    run(body)


def test_antiduplicazione_finestra_ricarica_e_bot():
    async def body(c):
        mid = await negozio()
        cod = await codice_di(c, mid)
        await c.get(f"/api/q/{cod}")
        await c.get(f"/api/q/{cod}")                                              # dentro la finestra del negozio
        assert await totale(mid) == 1
        server._qr_ultimo_conteggio[mid] -= server.QR_FINESTRA_SEC + 1            # finestra trascorsa
        await c.get(f"/api/q/{cod}?r=1")                                          # ricaricamento dello stesso browser
        assert await totale(mid) == 1
        await c.get(f"/api/q/{cod}")
        assert await totale(mid) == 2
        server._qr_ultimo_conteggio[mid] -= server.QR_FINESTRA_SEC + 1
        for ua in ("Googlebot/2.1", "facebookexternalhit/1.1", "WhatsApp/2.23", "python-requests/2.31", "curl/8.0"):
            r = await c.get(f"/api/q/{cod}", headers={"User-Agent": ua})
            assert r.status_code == 200                                          # la pagina si apre, ma non si conta
        assert await totale(mid) == 2
    run(body)


def test_vecchio_link_con_id_funziona_e_non_conta():
    async def body(c):
        mid = await negozio()
        r = await c.get(f"/api/negozio/{mid}")
        assert r.status_code == 200 and r.json()["negozio"]["id"] == mid
        assert await totale(mid) == 0
    run(body)


def test_codice_sconosciuto_non_valido_o_sospeso_da_404_pulito():
    async def body(c):
        sid = await negozio(sospeso=True)
        cod_s = await server.codice_qr_negozio(await server.db.users.find_one({"id": sid}))
        for cod in ("ZZZZZ", "ab", "AB12CD3", "AB-12", "%E2%82%AC123", cod_s):
            r = await c.get(f"/api/q/{cod}")
            assert r.status_code == 404 and r.json() == {"detail": "Negozio non trovato"}, cod
        assert await server.db.scansioni_locandina.count_documents({}) == 0
        cid = str(uuid.uuid4())                                                   # un cliente con un codice non è un negozio
        await server.db.users.insert_one({"id": cid, "role": "client", "qr_code": "CCCCC", "email": "c@example.com"})
        assert (await c.get("/api/q/CCCCC")).status_code == 404
    run(body)


def test_nessun_dato_personale_salvato():
    async def body(c):
        mid = await negozio()
        cod = await codice_di(c, mid)
        await c.get(f"/api/q/{cod}", headers={**UA, "X-Forwarded-For": "203.0.113.7", "Cookie": "a=b", "Referer": "https://esempio.it/x"})
        docs = await server.db.scansioni_locandina.find({}).to_list(None)
        assert len(docs) == 1 and set(docs[0]) == {"_id", "merchant_id", "giorno", "conteggio"}
        testo = json.dumps(docs, default=str)
        for traccia in ("203.0.113.7", "Mozilla", "iPhone", "esempio.it"):
            assert traccia not in testo
        assert set(server._qr_ultimo_conteggio) == {mid}                          # in memoria solo id negozio -> ora
    run(body)


def test_statistiche_admin_e_commerciante():
    async def body(c):
        mid = await negozio(nome="Pizzeria Uno")
        zero = await negozio(nome="Bar Due")
        cod = await codice_di(c, mid)
        await c.get(f"/api/q/{cod}")
        adesso = datetime.now(timezone.utc).isoformat()
        vecchio = "2025-01-10T10:00:00+00:00"
        await server.db.scansioni_locandina.insert_one({"merchant_id": mid, "giorno": "2025-01-10", "conteggio": 7})
        for i, quando in enumerate((adesso, vecchio)):
            await server.db.users.insert_one({"id": f"cl{i}", "role": "client", "email": f"cl{i}@example.com", "name": "C",
                                              "referred_by": mid, "referred_at": quando, "created_at": quando})
        for i, (st, quando) in enumerate((("redeemed", adesso), ("redeemed", vecchio), ("pending", None))):
            await server.db.redemptions.insert_one({"id": f"r{i}", "code": f"C{i}", "merchant_id": mid, "user_id": "x",
                                                    "status": st, "redeemed_at": quando})
        h = await admin(c)
        j = (await c.get("/api/admin/referrals-by-merchant", headers=h)).json()
        r = next(x for x in j["merchants"] if x["merchant_id"] == mid)
        assert (r["scansioni_30_giorni"], r["scansioni_totali"]) == (1, 8)
        assert (r["iscrizioni_30_giorni"], r["iscrizioni_totali"]) == (1, 2)
        assert (r["sconti_usati_30_giorni"], r["sconti_usati_totali"]) == (1, 2)
        assert all(x["merchant_id"] != zero for x in j["merchants"])
        t = j["totals"]
        assert (t["scansioni_totali"], t["iscrizioni_totali"], t["sconti_usati_totali"]) == (8, 2, 2)
        assert t["total_signups"] == 2
        tok = {"Authorization": f"Bearer {server.create_token(mid, 'x@example.com')}"}
        mr = (await c.get("/api/merchants/me/referrals", headers=tok)).json()
        assert mr["scansioni_30_giorni"] == 1 and mr["scansioni_totali"] == 8
        assert mr["referral_url"].endswith(f"/q/{cod}")
    run(body)


def test_admin_senza_iscritti_ne_scansioni_non_si_rompe():
    async def body(c):
        h = await admin(c)
        j = (await c.get("/api/admin/referrals-by-merchant", headers=h)).json()
        assert j["merchants"] == [] and j["totals"]["scansioni_totali"] == 0
    run(body)
