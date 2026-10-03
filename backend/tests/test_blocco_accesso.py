"""Accesso solo con email e password (il PIN è stato tolto il 03/10).

- Dopo 5 tentativi sbagliati scatta il blocco di 15 minuti, sia per un account vero sia
  per un'email che non corrisponde a nessun account (così non si capisce quali esistono).
- Le vecchie rotte del PIN non esistono più.
- I dati del vecchio PIN rimasti in un account si cancellano al primo accesso riuscito.
Server in-process su database locale o emulatore: rifiuta database remoti.
"""
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
DB_NAME = "e2e_unit_blocco_accesso"
os.environ["MONGO_URL"] = "mongodb://localhost:27017" if USE_MOCK else MONGO_URL
os.environ.setdefault("DB_NAME", DB_NAME)
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")
os.environ["RESEND_API_KEY"] = ""

import httpx  # noqa: E402

import server  # noqa: E402

PASSWORD = "password-giusta-123"


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


async def utente(**extra):
    uid = str(uuid.uuid4())
    email = f"cliente.{uid[:8]}@example.com"
    await server.db.users.insert_one({"id": uid, "email": email, "name": "Prova", "role": "client",
                                      "password_hash": server.hash_password(PASSWORD), **extra})
    return email


async def tentativi(c, email, password, n=6):
    return [(await c.post("/api/auth/login", json={"email": email, "password": password})).status_code
            for _ in range(n)]


def test_blocco_dopo_cinque_tentativi_account_vero():
    async def body(c):
        email = await utente()
        assert await tentativi(c, email, "sbagliata") == [401, 401, 401, 401, 401, 429]
        # Durante il blocco anche la password giusta è rifiutata
        r = await c.post("/api/auth/login", json={"email": email, "password": PASSWORD})
        assert r.status_code == 429 and "15 minuti" in r.json()["detail"]
    run(body)


def test_blocco_anche_per_email_inesistente():
    async def body(c):
        email = f"nessuno.{uuid.uuid4().hex[:8]}@example.com"
        assert await tentativi(c, email, "qualsiasi") == [401, 401, 401, 401, 401, 429]
        # Si conserva solo l'impronta dell'email, non l'email
        doc = await server.db.login_guard.find_one({})
        assert email not in str(doc)
    run(body)


def test_password_giusta_azzera_i_tentativi():
    async def body(c):
        email = await utente()
        assert await tentativi(c, email, "sbagliata", n=4) == [401] * 4
        assert (await c.post("/api/auth/login", json={"email": email, "password": PASSWORD})).status_code == 200
        assert await tentativi(c, email, "sbagliata", n=4) == [401] * 4
    run(body)


def test_rotte_del_pin_tolte():
    paths = {getattr(rt, "path", "") for rt in server.app.routes}
    for p in ("/api/auth/pin", "/api/auth/pin-login", "/api/auth/pin-forgot", "/api/auth/pin-reset"):
        assert p not in paths

    async def body(c):
        r = await c.post("/api/auth/pin-login", json={"email": "a@example.com", "pin": "123456"})
        assert r.status_code in (404, 405)
    run(body)


def test_dati_del_vecchio_pin_cancellati_al_primo_accesso():
    async def body(c):
        email = await utente(pin_hash="vecchio-hash", pin_set=True, pin_failed_attempts=2,
                             pin_reset_req_log=["2026-10-01T10:00:00+00:00"])
        r = await c.post("/api/auth/login", json={"email": email, "password": PASSWORD})
        assert r.status_code == 200
        assert "pin" not in r.text.lower()
        u = await server.db.users.find_one({"email": email})
        assert not [k for k in u if k.startswith("pin")]
    run(body)
