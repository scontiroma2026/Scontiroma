"""Archivio delle offerte del commerciante: ogni versione passata (scaduta, ritirata, rifiutata,
eliminata) resta consultabile e riusabile; solo il proprietario la vede.
Server in-process su database locale o emulatore: rifiuta database remoti."""
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
DB_NAME = "e2e_unit_archivio"
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


def offerta(mid, titolo, mese="2026-09"):
    return {"id": str(uuid.uuid4()), "merchant_id": mid, "title": titolo, "description": "Descrizione",
            "original_price": 40, "discounted_price": 20, "active": True, "approval_status": "approved",
            "locked_month": mese, "max_uses_per_month": 2, "terms": "Solo a pranzo"}


def test_archivio_elenco_dettaglio_e_utilizzi():
    async def body(c):
        mid, h = await negozio()
        d = offerta(mid, "Menù di pesce")
        await server.db.redemptions.insert_many([
            {"id": "r1", "discount_id": d["id"], "status": "redeemed", "redeemed_at": "2026-09-12T12:00:00+00:00"},
            {"id": "r2", "discount_id": d["id"], "status": "redeemed", "redeemed_at": "2026-10-02T12:00:00+00:00"},
        ])
        await server._archivia(d, "expired_no_replacement")
        await server._archivia({**d, "title": "Seconda versione"}, "withdrawn_no_renew")
        r = (await c.get("/api/merchants/me/archive", headers=h)).json()["archivio"]
        assert [x["title"] for x in r] == ["Seconda versione", "Menù di pesce"]  # dalla più recente
        assert r[1]["stato"] == "Scaduta" and r[0]["stato"] == "Ritirata"
        assert r[1]["utilizzi"] == 1 and r[1]["mese"] == "2026-09"
        assert r[0]["archivio_id"] != r[1]["archivio_id"]
        det = (await c.get(f"/api/merchants/me/archive/{r[1]['archivio_id']}", headers=h)).json()["offerta"]
        assert det["title"] == "Menù di pesce" and det["terms"] == "Solo a pranzo" and det["max_uses_per_month"] == 2
        assert "merchant_id" not in det and "id" not in det
    run(body)


def test_archivio_solo_del_proprietario():
    async def body(c):
        mid, _ = await negozio()
        _, h_altro = await negozio()
        await server._archivia(offerta(mid, "Segreta"), "rejected")
        assert (await c.get("/api/merchants/me/archive", headers=h_altro)).json()["archivio"] == []
        doc = await server.db.discounts_archive.find_one({})
        assert (await c.get(f"/api/merchants/me/archive/{doc['archivio_id']}", headers=h_altro)).status_code == 404
    run(body)


def test_copie_vecchie_senza_id_ricevono_un_id():
    async def body(c):
        mid, h = await negozio()
        await server.db.discounts_archive.insert_one({**offerta(mid, "Vecchia"), "archive_reason": "replaced_by_next_month",
                                                       "archived_at": "2026-09-01T00:00:00+00:00"})
        r = (await c.get("/api/merchants/me/archive", headers=h)).json()["archivio"]
        assert r[0]["archivio_id"] and r[0]["stato"] == "Scaduta"
        assert (await c.get(f"/api/merchants/me/archive/{r[0]['archivio_id']}", headers=h)).status_code == 200
    run(body)


def test_rifiuto_ed_eliminazione_admin_archiviano(monkeypatch):
    async def body(c):
        mid, _ = await negozio()
        d = offerta(mid, "Da rifiutare")
        await server.db.discounts.insert_one(dict(d))
        async def no_admin():
            return {"id": "admin", "role": "admin"}
        server.app.dependency_overrides[server.require_admin_master] = no_admin
        try:
            r = await c.post(f"/api/admin/discounts/{d['id']}/reject", json={"reason": "Foto non chiara"})
            assert r.status_code == 200, r.text
            assert (await c.delete(f"/api/admin/discounts/{d['id']}")).status_code == 200
        finally:
            server.app.dependency_overrides.clear()
        motivi = sorted(x["archive_reason"] for x in await server.db.discounts_archive.find({}).to_list(None))
        assert motivi == ["deleted_by_admin", "rejected"]
    run(body)
