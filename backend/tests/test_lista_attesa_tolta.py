"""La lista d'attesa pre-lancio è stata tolta il 02/11 (app aperta a tutti): niente più rotte, niente
modalità pre-lancio, e le iscrizioni rimaste nel database vengono cancellate all'avvio."""
import asyncio
import os
from urllib.parse import urlparse

import pytest

MONGO_URL = os.environ.setdefault("TEST_MONGO_URL", os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
_u = urlparse(MONGO_URL)
if not (_u.scheme == "mongomock" or (_u.scheme == "mongodb" and (_u.hostname or "") in ("localhost", "127.0.0.1", "::1"))):
    pytest.exit(f"MONGO_URL non locale ({_u.scheme}://{_u.hostname}): test rifiutati.", returncode=2)
USE_MOCK = _u.scheme == "mongomock"
DB_NAME = "e2e_unit_lista_tolta"
os.environ["MONGO_URL"] = "mongodb://localhost:27017" if USE_MOCK else MONGO_URL
os.environ.setdefault("DB_NAME", DB_NAME)
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")
os.environ["RESEND_API_KEY"] = ""

import httpx  # noqa: E402

import server  # noqa: E402


async def _db():
    if USE_MOCK:
        import mongomock_motor
        return mongomock_motor.AsyncMongoMockClient()[DB_NAME]
    from motor.motor_asyncio import AsyncIOMotorClient
    cli = AsyncIOMotorClient(MONGO_URL)
    await cli.drop_database(DB_NAME)
    return cli[DB_NAME]


def test_rotte_e_dati_della_lista_tolti(monkeypatch):
    monkeypatch.setenv("PRELAUNCH_MODE", "true")  # anche se la variabile resta su Render, non cambia più nulla

    async def main():
        server.db = await _db()
        await server.db.waitlist.insert_many([{"id": "a", "email": "a@example.com"}, {"id": "b", "email": "b@example.com"}])
        await server.db.settings.insert_one({"key": "avviso_lancio_automatico", "attivo": True})
        assert await server._togli_lista_attesa() == 2
        assert await server.db.waitlist.count_documents({}) == 0
        assert await server.db.settings.count_documents({"key": "avviso_lancio_automatico"}) == 0
        assert await server._togli_lista_attesa() == 0  # idempotente
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=server.app), base_url="http://test") as c:
            for metodo, url in (("POST", "/api/prelaunch/waitlist"), ("POST", "/api/prelaunch/waitlist/confirm"),
                                ("POST", "/api/prelaunch/waitlist/unsubscribe"), ("GET", "/api/admin/lista-attesa"),
                                ("GET", "/api/admin/lista-attesa/esporta.csv"), ("POST", "/api/admin/lista-attesa/invia-avviso")):
                r = await c.request(metodo, url, json={})
                assert r.status_code in (404, 405), (url, r.status_code)
            conf = (await c.get("/api/config/public")).json()
            assert "prelaunch_mode" not in conf
            # i clienti si registrano anche con PRELAUNCH_MODE rimasto acceso
            r = await c.post("/api/auth/register", json={"email": "nuovo@example.com", "password": "Password-1234",
                                                         "name": "Prova", "role": "client", "legal_accepted": True})
            assert r.status_code == 200, r.text
        await server.attendi_lavori_in_background()
    asyncio.run(main())
