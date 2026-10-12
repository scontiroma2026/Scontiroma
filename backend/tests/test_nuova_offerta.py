"""Scritta «Nuova offerta»: `is_new` è vero solo per 48 ore dalla pubblicazione, calcolato dal server.
Server in-process su database locale o emulatore."""
import asyncio
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
DB_NAME = "e2e_unit_nuova_offerta"
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


async def offerta(**extra):
    mid = str(uuid.uuid4())
    await server.db.users.insert_one({"id": mid, "email": f"n.{mid[:8]}@example.com", "role": "merchant",
                                      "name": "Prova", "shop_name": "Bar dell'Esempio", "zone": "Garbatella"})
    did = str(uuid.uuid4())
    doc = {"id": did, "merchant_id": mid, "title": "Caffè", "active": True,
           "approval_status": "approved", "original_price": 2, "discounted_price": 1,
           "created_at": "2026-01-01T00:00:00+00:00"}
    doc.update(extra)
    await server.db.discounts.insert_one(doc)
    return did


def ore_fa(h):
    return (datetime.now(timezone.utc) - timedelta(hours=h)).isoformat()


def test_costante():
    assert server.NEW_OFFER_HOURS == 48


def test_elenco_e_dettaglio():
    async def body(c):
        nuova = await offerta(published_at=ore_fa(1))
        vecchia = await offerta(published_at=ore_fa(49))
        senza = await offerta()
        el = {d["id"]: d["is_new"] for d in (await c.get("/api/discounts")).json()["discounts"]}
        assert el == {nuova: True, vecchia: False, senza: False}
        for did, atteso in ((nuova, True), (vecchia, False), (senza, False)):
            assert (await c.get(f"/api/discounts/{did}")).json()["discount"]["is_new"] is atteso
    run(body)


def test_data_illeggibile_o_futura_non_e_nuova():
    assert server._is_new_offer("non una data") is False
    assert server._is_new_offer(ore_fa(-5)) is False
    assert server._is_new_offer(ore_fa(47)) is True


def test_approvazione_salva_published_at():
    async def body(c):
        did = await offerta(approval_status="pending")
        assert (await c.get(f"/api/discounts/{did}")).json()["discount"]["is_new"] is False
        server.app.dependency_overrides[server.require_admin_master] = lambda: {"id": "adm", "role": "admin"}
        try:
            r = await c.post(f"/api/admin/discounts/{did}/approve")
        finally:
            server.app.dependency_overrides.pop(server.require_admin_master, None)
        assert r.status_code == 200
        d = await server.db.discounts.find_one({"id": did})
        assert d["published_at"]
        assert (await c.get(f"/api/discounts/{did}")).json()["discount"]["is_new"] is True
    run(body)


# ---------- «Nuovo su Sconti Roma» (prima pubblicazione del negozio, 7 giorni) ----------

def test_costante_negozio_nuovo():
    assert server.NEW_SHOP_DAYS == 7


def test_negozio_nuovo_confini():
    adesso = datetime.now(timezone.utc)
    assert server._is_new_shop((adesso - timedelta(days=3)).isoformat()) is True
    assert server._is_new_shop((adesso - timedelta(days=8)).isoformat()) is False
    assert server._is_new_shop(None) is False
    assert server._is_new_shop("data-sbagliata") is False


def test_prima_pubblicazione_contro_rinnovo():
    async def body(c):
        adesso = datetime.now(timezone.utc)
        # negozio alla prima pubblicazione: offerta di 1 ora fa, negozio pubblicato per la prima volta ora
        mid1 = str(uuid.uuid4())
        await server.db.users.insert_one({"id": mid1, "email": "n1@example.com", "role": "merchant", "name": "A",
                                          "shop_name": "Nuovo", "zone": "Marconi",
                                          "first_published_at": (adesso - timedelta(hours=1)).isoformat()})
        d1 = str(uuid.uuid4())
        await server.db.discounts.insert_one({"id": d1, "merchant_id": mid1, "title": "X", "active": True,
                                              "approval_status": "approved", "original_price": 2, "discounted_price": 1,
                                              "published_at": (adesso - timedelta(hours=1)).isoformat()})
        # negozio che rinnova: offerta di 1 ora fa, ma negozio pubblicato per la prima volta 30 giorni fa
        mid2 = str(uuid.uuid4())
        await server.db.users.insert_one({"id": mid2, "email": "n2@example.com", "role": "merchant", "name": "B",
                                          "shop_name": "Storico", "zone": "Marconi",
                                          "first_published_at": (adesso - timedelta(days=30)).isoformat()})
        d2 = str(uuid.uuid4())
        await server.db.discounts.insert_one({"id": d2, "merchant_id": mid2, "title": "Y", "active": True,
                                              "approval_status": "approved", "original_price": 2, "discounted_price": 1,
                                              "published_at": (adesso - timedelta(hours=1)).isoformat()})
        nuovo = await server.enrich_discount(await server.db.discounts.find_one({"id": d1}))
        assert nuovo["is_new"] is True and nuovo["is_new_shop"] is True
        rinnovo = await server.enrich_discount(await server.db.discounts.find_one({"id": d2}))
        assert rinnovo["is_new"] is True and rinnovo["is_new_shop"] is False

    run(body)


def test_negozio_esistente_senza_campo_non_e_nuovo():
    async def body(c):
        # negozio già online da mesi, senza `first_published_at`: lo si ricava dalla prima offerta approvata (vecchia)
        did = await offerta(published_at=ore_fa(1), approved_at="2026-01-02T00:00:00+00:00")
        d = await server.enrich_discount(await server.db.discounts.find_one({"id": did}))
        assert d["is_new"] is True and d["is_new_shop"] is False

    run(body)
