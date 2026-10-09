"""Interesse per zona: contatore aggregato e anonimo («Fammi sapere quando arrivate»).
Solo database locale o mongomock: nessun dato personale, un numero per zona, limite per IP."""
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
DB_NAME = "e2e_unit_interesse_zona"
os.environ["MONGO_URL"] = "mongodb://localhost:27017" if USE_MOCK else MONGO_URL
os.environ.setdefault("DB_NAME", DB_NAME)
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")
os.environ["RESEND_API_KEY"] = ""

import httpx  # noqa: E402

import server  # noqa: E402


@pytest.fixture(autouse=True)
def _ambiente(monkeypatch):
    monkeypatch.setenv("ADMIN_MASTER_PASSWORD", "master-test-123456")
    server._interesse_richieste.clear()


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


def ip(n):
    return {"X-Forwarded-For": f"203.0.113.{n}"}


def test_il_voto_incrementa_il_contatore_della_zona():
    async def body(c):
        for n in (1, 2, 3):
            r = await c.post("/api/interesse-zona", json={"zona": "Aurelio"}, headers=ip(n))
            assert r.status_code == 200 and r.json() == {"ok": True}
        await c.post("/api/interesse-zona", json={"zona": "EUR"}, headers=ip(4))
        assert (await server.db.interesse_zona.find_one({"zona": "Aurelio"}))["voti"] == 3
        assert (await server.db.interesse_zona.find_one({"zona": "EUR"}))["voti"] == 1
        assert await server.db.interesse_zona.count_documents({}) == 2
    run(body)


def test_nessun_dato_personale_nel_documento():
    async def body(c):
        await c.post("/api/interesse-zona", json={"zona": "Ostia", "email": "a@example.com"}, headers=ip(9))
        doc = await server.db.interesse_zona.find_one({"zona": "Ostia"}, {"_id": 0})
        assert doc == {"zona": "Ostia", "voti": 1}                      # solo zona e numero
        assert "203.0.113.9" not in str(doc)
    run(body)


def test_zona_non_valida_rifiutata():
    async def body(c):
        for zona in ("", "Atlantide", "garbatella", {"$gt": ""}):
            r = await c.post("/api/interesse-zona", json={"zona": zona}, headers=ip(5))
            assert r.status_code in (400, 422), (zona, r.status_code)
        assert await server.db.interesse_zona.count_documents({}) == 0
    run(body)


def test_limite_di_richieste_per_ip():
    async def body(c):
        for _ in range(server.INTERESSE_MAX_PER_ORA):
            assert (await c.post("/api/interesse-zona", json={"zona": "Cassia"}, headers=ip(7))).status_code == 200
        r = await c.post("/api/interesse-zona", json={"zona": "Cassia"}, headers=ip(7))
        assert r.status_code == 429
        assert (await server.db.interesse_zona.find_one({"zona": "Cassia"}))["voti"] == server.INTERESSE_MAX_PER_ORA
        # un altro IP non è toccato dal limite
        assert (await c.post("/api/interesse-zona", json={"zona": "Cassia"}, headers=ip(8))).status_code == 200
        # passata la finestra, lo stesso IP può votare di nuovo
        server._interesse_richieste["203.0.113.7"] = [t - server.INTERESSE_FINESTRA_SEC - 1 for t in server._interesse_richieste["203.0.113.7"]]
        assert (await c.post("/api/interesse-zona", json={"zona": "Cassia"}, headers=ip(7))).status_code == 200
    run(body)


def test_admin_vede_la_tabella_interesse_per_zona():
    async def body(c):
        for n, zona in enumerate(["Aurelio", "Aurelio", "EUR", "Aurelio", "Ostia", "EUR"], start=20):
            await c.post("/api/interesse-zona", json={"zona": zona}, headers=ip(n))
        uid = str(uuid.uuid4())
        await server.db.users.insert_one({"id": uid, "email": f"a.{uid[:6]}@example.com", "role": "admin", "name": "A"})
        h = {"Authorization": f"Bearer {server.create_token(uid, 'x@example.com')}"}
        m = await c.post("/api/admin/verify-master", json={"password": "master-test-123456"}, headers=h)
        r = await c.get("/api/admin/launch-summary", headers={**h, "X-Admin-Master": m.json()["token"]})
        assert r.status_code == 200, r.text
        assert r.json()["interesse_zone"] == [
            {"zona": "Aurelio", "voti": 3}, {"zona": "EUR", "voti": 2}, {"zona": "Ostia", "voti": 1}]
        # senza admin la tabella non è raggiungibile
        assert (await c.get("/api/admin/launch-summary")).status_code in (401, 403)
    run(body)
