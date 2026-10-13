"""Rifiuto di un'offerta: il motivo è obbligatorio (almeno 10 caratteri), sia per l'offerta corrente sia per
quella del mese prossimo. Server in-process su database locale o emulatore: rifiuta database remoti."""
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
DB_NAME = "e2e_unit_motivo_rifiuto"
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

        async def no_admin():
            return {"id": "admin", "role": "admin"}
        server.app.dependency_overrides[server.require_admin_master] = no_admin
        try:
            transport = httpx.ASGITransport(app=server.app)
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
                await body(c)
        finally:
            server.app.dependency_overrides.pop(server.require_admin_master, None)
    asyncio.run(main())


async def inserisci(coll):
    mid = str(uuid.uuid4())
    await server.db.users.insert_one({"id": mid, "email": f"m.{mid[:8]}@example.com", "role": "merchant", "shop_name": "Negozio"})
    doc = {"id": str(uuid.uuid4()), "merchant_id": mid, "title": "Menù di pesce", "description": "Descrizione",
           "original_price": 40, "discounted_price": 20, "active": True, "approval_status": "pending",
           "max_uses_per_month": 2, "terms": "Solo a pranzo"}
    await server.db[coll].insert_one(dict(doc))
    return doc["id"]


CASI = [
    ("discounts", "/api/admin/discounts/{}/reject"),
    ("next_discounts", "/api/admin/next-offers/{}/reject"),
]


@pytest.mark.parametrize("coll,url", CASI)
@pytest.mark.parametrize("corpo", [{}, {"reason": ""}, {"reason": None}, {"reason": "          "}, {"reason": "123456789"}, {"reason": "  corto   "}])
def test_motivo_mancante_o_corto_rifiutato(coll, url, corpo):
    async def body(c):
        i = await inserisci(coll)
        r = await c.post(url.format(i), json=corpo)
        assert r.status_code == 422
        assert "motivo del rifiuto" in r.json()["detail"] and "10 caratteri" in r.json()["detail"]
        d = await server.db[coll].find_one({"id": i})
        assert d["approval_status"] == "pending"  # nessun cambio di stato
    run(body)


@pytest.mark.parametrize("coll,url", CASI)
def test_motivo_valido_accettato_e_salvato_senza_spazi(coll, url):
    async def body(c):
        i = await inserisci(coll)
        r = await c.post(url.format(i), json={"reason": "  Foto poco chiara  "})
        assert r.status_code == 200
        d = await server.db[coll].find_one({"id": i})
        assert d["approval_status"] == "rejected"
        assert d["approval_note"] == "Foto poco chiara"
    run(body)


def test_dieci_caratteri_esatti_bastano():
    async def body(c):
        i = await inserisci("discounts")
        assert (await c.post(f"/api/admin/discounts/{i}/reject", json={"reason": "1234567890"})).status_code == 200
    run(body)


@pytest.mark.parametrize("coll,url", CASI)
def test_offerta_inesistente_con_motivo_valido_resta_404(coll, url):
    async def body(c):
        r = await c.post(url.format("non-esiste"), json={"reason": "Foto poco chiara"})
        assert r.status_code == 404
    run(body)


def test_email_rifiuto_riceve_il_motivo(monkeypatch):
    inviate = []

    async def finta(to, name, shop, titolo, motivo):
        inviate.append(motivo)
    monkeypatch.setattr(server, "send_merchant_rejected", finta)

    async def body(c):
        i = await inserisci("discounts")
        assert (await c.post(f"/api/admin/discounts/{i}/reject", json={"reason": "  Prezzo pieno non vero  "})).status_code == 200
    run(body)
    assert inviate == ["Prezzo pieno non vero"]
