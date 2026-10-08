"""Pagina del negozio a cui porta il QR della locandina: nome, quartiere e offerta del mese in corso,
mai dati personali; 404 per id sbagliati, utenti che non sono negozi e negozi sospesi."""
import asyncio
import os
import uuid
from urllib.parse import urlparse

import pytest

MONGO_URL = os.environ.setdefault("TEST_MONGO_URL", os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
_u = urlparse(MONGO_URL)
if not (_u.scheme == "mongomock" or (_u.scheme == "mongodb" and (_u.hostname or "") in ("localhost", "127.0.0.1", "::1"))):
    pytest.exit(f"MONGO_URL non locale ({_u.scheme}://{_u.hostname}): test rifiutati.", returncode=2)
USE_MOCK = _u.scheme == "mongomock"
DB_NAME = "e2e_unit_negozio_qr"
os.environ["MONGO_URL"] = "mongodb://localhost:27017" if USE_MOCK else MONGO_URL
os.environ.setdefault("DB_NAME", DB_NAME)
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")
os.environ["RESEND_API_KEY"] = ""

import httpx  # noqa: E402

import server  # noqa: E402


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


async def negozio(stato="approved", attivo=True, role="merchant", sospeso=False):
    mid, did = str(uuid.uuid4()), str(uuid.uuid4())
    await server.db.users.insert_one({
        "id": mid, "role": role, "approved": not sospeso, "email": f"m.{mid[:6]}@example.com", "password_hash": "x",
        "shop_name": "Osteria dell'Esempio", "zone": "Garbatella", "category": "Ristorante", "phone": "+39 06 0000000"})
    await server.db.discounts.insert_one({"id": did, "merchant_id": mid, "title": "Menù di pesce", "active": attivo,
                                          "approval_status": stato, "original_price": 40, "discounted_price": 20})
    return mid, did


def test_negozio_con_offerta():
    async def body(c):
        mid, did = await negozio()
        r = await c.get(f"/api/negozio/{mid}")
        assert r.status_code == 200, r.text
        j = r.json()
        assert len(j["negozio"].pop("qr_code")) == 5
        assert j["negozio"] == {"id": mid, "shop_name": "Osteria dell'Esempio", "zone": "Garbatella", "category": "Ristorante"}
        assert j["discount"]["id"] == did and j["discount"]["percent_off"] == 50
        assert "password_hash" not in r.text and "email" not in j["negozio"]
    run(body)


def test_negozio_senza_offerta_pubblica():
    async def body(c):
        for stato, attivo in (("pending", True), ("approved", False), ("rejected", True)):
            mid, _ = await negozio(stato=stato, attivo=attivo)
            r = await c.get(f"/api/negozio/{mid}")
            assert r.status_code == 200 and r.json()["discount"] is None, (stato, attivo)
    run(body)


def test_negozio_inesistente_cliente_o_sospeso():
    async def body(c):
        assert (await c.get("/api/negozio/non-esiste")).status_code == 404
        cid, _ = await negozio(role="client")
        assert (await c.get(f"/api/negozio/{cid}")).status_code == 404
        sid, _ = await negozio(sospeso=True)
        assert (await c.get(f"/api/negozio/{sid}")).status_code == 404
    run(body)
