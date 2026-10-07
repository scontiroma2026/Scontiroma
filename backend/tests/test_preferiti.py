"""Negozi preferiti: solo per i clienti, avvisi via email solo con consenso e al massimo uno per
negozio al mese, pulizia alla cancellazione. Server in-process su database locale o emulatore."""
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
DB_NAME = "e2e_unit_preferiti"
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


async def utente(role, **extra):
    uid = str(uuid.uuid4())
    email = f"{role}.{uid[:8]}@example.com"
    await server.db.users.insert_one({"id": uid, "email": email, "name": "Prova", "role": role, **extra})
    return uid, {"Authorization": f"Bearer {server.create_token(uid, email)}"}


async def negozio_con_offerta():
    mid, _ = await utente("merchant", shop_name="Osteria dell'Esempio", zone="Garbatella")
    did = str(uuid.uuid4())
    await server.db.discounts.insert_one({"id": did, "merchant_id": mid, "title": "Menù di pesce", "active": True,
                                          "approval_status": "approved", "original_price": 40, "discounted_price": 20})
    return mid, did


def test_aggiungi_elenca_togli():
    async def body(c):
        mid, did = await negozio_con_offerta()
        _, h = await utente("client")
        assert (await c.post(f"/api/me/preferiti/{mid}", headers=h)).status_code == 200
        assert (await c.post(f"/api/me/preferiti/{mid}", headers=h)).status_code == 200  # nessun doppione
        r = (await c.get("/api/me/preferiti", headers=h)).json()
        assert r["merchant_ids"] == [mid] and [o["id"] for o in r["offerte"]] == [did] and r["avvisi"] is False
        assert (await c.delete(f"/api/me/preferiti/{mid}", headers=h)).status_code == 200
        assert (await c.get("/api/me/preferiti", headers=h)).json()["merchant_ids"] == []
        assert (await c.post(f"/api/me/preferiti/{uuid.uuid4()}", headers=h)).status_code == 404
    run(body)


def test_solo_clienti():
    async def body(c):
        mid, _ = await negozio_con_offerta()
        _, h = await utente("merchant")
        assert (await c.post(f"/api/me/preferiti/{mid}", headers=h)).status_code == 403
        assert (await c.get("/api/me/preferiti")).status_code == 401
    run(body)


def test_avvisi_solo_con_consenso_e_uno_al_mese(monkeypatch):
    inviate = []

    async def finta(to, *a, **k):
        inviate.append(to)
    monkeypatch.setattr(server, "send_preferito_nuova_offerta", finta)

    async def body(c):
        mid, did = await negozio_con_offerta()
        _, h_si = await utente("client")
        _, h_no = await utente("client")
        for h in (h_si, h_no):
            await c.post(f"/api/me/preferiti/{mid}", headers=h)
        r = await c.put("/api/me/preferiti/avvisi", json={"attivo": True}, headers=h_si)
        assert r.json() == {"avvisi": True}
        d = await server.db.discounts.find_one({"id": did})
        assert await server._avvisa_preferiti(d) == 1
        assert await server._avvisa_preferiti(d) == 0  # stesso mese: niente doppioni
        assert len(inviate) == 1
        # Revoca del consenso
        await c.put("/api/me/preferiti/avvisi", json={"attivo": False}, headers=h_si)
        await server.db.avvisi_preferiti.delete_many({})
        assert await server._avvisa_preferiti(d) == 0
    run(body)


def test_negozio_sospeso_nessun_avviso(monkeypatch):
    monkeypatch.setattr(server, "send_preferito_nuova_offerta", lambda *a, **k: None)

    async def body(c):
        mid, did = await negozio_con_offerta()
        _, h = await utente("client", consents={"avvisi_preferiti": True})
        await c.post(f"/api/me/preferiti/{mid}", headers=h)
        await server.db.users.update_one({"id": mid}, {"$set": {"approved": False}})
        assert await server._avvisa_preferiti(await server.db.discounts.find_one({"id": did})) == 0
        assert (await c.get("/api/me/preferiti", headers=h)).json()["offerte"] == []
    run(body)


def test_cancellazione_negozio_toglie_i_preferiti():
    async def body(c):
        mid, _ = await negozio_con_offerta()
        cid, h = await utente("client")
        await c.post(f"/api/me/preferiti/{mid}", headers=h)
        m = await server.db.users.find_one({"id": mid})
        await server._erase_user_data(m)
        assert (await server.db.users.find_one({"id": cid})).get("preferiti") == []
    run(body)
