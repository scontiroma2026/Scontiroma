"""Dashboard commerciante: scadenza dell'offerta (valid_until) e flag «non rinnovo» nell'offerta del mese dopo.
Server in-process su database locale o emulatore: rifiuta database remoti."""
import asyncio
import os
import uuid
from datetime import datetime
from urllib.parse import urlparse
from zoneinfo import ZoneInfo

import pytest

MONGO_URL = os.environ.setdefault("TEST_MONGO_URL", os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
_u = urlparse(MONGO_URL)
if not (_u.scheme == "mongomock" or (_u.scheme == "mongodb" and (_u.hostname or "") in ("localhost", "127.0.0.1", "::1"))):
    pytest.exit(f"MONGO_URL non locale ({_u.scheme}://{_u.hostname}): test rifiutati.", returncode=2)
USE_MOCK = _u.scheme == "mongomock"
DB_NAME = "e2e_unit_da_fare"
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


async def negozio():
    uid = str(uuid.uuid4())
    email = f"m.{uid[:8]}@example.com"
    await server.db.users.insert_one({"id": uid, "email": email, "role": "merchant", "shop_name": "Negozio"})
    return uid, {"Authorization": f"Bearer {server.create_token(uid, email)}"}


def offerta(mid, stato="approved", mese="2026-10", **extra):
    return {"id": str(uuid.uuid4()), "merchant_id": mid, "title": "Menù", "description": "Descrizione",
            "original_price": 40, "discounted_price": 20, "active": True, "approval_status": stato,
            "locked_month": mese, **extra}


async def scadenza(c, h):
    return (await c.get("/api/merchants/me/discount", headers=h)).json()["discount"]["valid_until"]


def test_offerta_approvata_scade_a_fine_mese():
    async def body(c):
        mid, h = await negozio()
        await server.db.discounts.insert_one(offerta(mid, mese="2026-10"))
        assert await scadenza(c, h) == "2026-10-31"
    run(body)


def test_fine_febbraio_bisestile_e_non():
    async def body(c):
        mid, h = await negozio()
        await server.db.discounts.insert_one(offerta(mid, mese="2028-02"))
        assert await scadenza(c, h) == "2028-02-29"
        await server.db.discounts.delete_many({})
        await server.db.discounts.insert_one(offerta(mid, mese="2027-02"))
        assert await scadenza(c, h) == "2027-02-28"
    run(body)


def test_senza_mese_di_blocco_vale_il_mese_in_corso(monkeypatch):
    monkeypatch.setattr(server, "_rome_now", lambda: datetime(2026, 11, 5, 10, 0, tzinfo=ZoneInfo("Europe/Rome")))

    async def body(c):
        mid, h = await negozio()
        await server.db.discounts.insert_one(offerta(mid, mese=None))
        assert await scadenza(c, h) == "2026-11-30"
    run(body)


def test_senza_data_se_non_visibile_o_assente():
    async def body(c):
        mid, h = await negozio()
        assert (await c.get("/api/merchants/me/discount", headers=h)).json() == {"discount": None}
        for stato, extra in (("pending", {}), ("rejected", {}), ("expired", {}), ("approved", {"active": False})):
            await server.db.discounts.delete_many({})
            await server.db.discounts.insert_one(offerta(mid, stato, **extra))
            d = (await c.get("/api/merchants/me/discount", headers=h)).json()["discount"]
            assert d["valid_until"] is None, (stato, extra)
            assert d["title"] == "Menù"  # i campi di prima ci sono ancora
    run(body)


def test_mese_di_blocco_illeggibile_non_rompe_la_risposta():
    async def body(c):
        mid, h = await negozio()
        await server.db.discounts.insert_one(offerta(mid, mese="boh"))
        r = await c.get("/api/merchants/me/discount", headers=h)
        assert r.status_code == 200 and r.json()["discount"]["valid_until"] is None
    run(body)


def test_next_discount_dice_se_non_rinnova():
    async def body(c):
        mid, h = await negozio()
        r = (await c.get("/api/merchants/me/next-discount", headers=h)).json()
        assert r["no_renew"] is False and r["next_discount"] is None and "window" in r
        await server.db.users.update_one({"id": mid}, {"$set": {"no_renew_month": r["window"]["next_month"]}})
        assert (await c.get("/api/merchants/me/next-discount", headers=h)).json()["no_renew"] is True
    run(body)
