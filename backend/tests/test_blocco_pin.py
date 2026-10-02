"""Accesso con PIN: dopo 5 tentativi sbagliati scatta il blocco di 15 minuti SEMPRE,
anche se l'account non ha un PIN o l'email non corrisponde a nessun account. Prima in
questi due casi il server rispondeva all'infinito "Credenziali non valide" (e così si
capiva quali email hanno un PIN). Server in-process su database locale o emulatore.
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
DB_NAME = "e2e_unit_blocco_pin"
os.environ["MONGO_URL"] = "mongodb://localhost:27017" if USE_MOCK else MONGO_URL
os.environ.setdefault("DB_NAME", DB_NAME)
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")
os.environ["RESEND_API_KEY"] = ""

import httpx  # noqa: E402

import server  # noqa: E402

PIN = "135790"
SBAGLIATO = "000000"


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
        t = httpx.ASGITransport(app=server.app)
        async with httpx.AsyncClient(transport=t, base_url="http://test") as c:
            await body(c)
    asyncio.run(main())


async def _utente(c, con_pin: bool) -> str:
    email = f"pin.{uuid.uuid4().hex[:8]}@example.com"
    r = await c.post("/api/auth/register", json={"email": email, "password": "password-test-123",
                                                 "name": "Prova", "role": "client", "legal_accepted": True})
    assert r.status_code == 200, r.text
    if con_pin:
        h = {"Authorization": f"Bearer {r.json()['access_token']}"}
        assert (await c.post("/api/auth/pin", json={"pin": PIN}, headers=h)).status_code == 200
    c.cookies.clear()
    return email


async def _tentativi(c, email, pin=SBAGLIATO, n=6):
    return [(await c.post("/api/auth/pin-login", json={"email": email, "pin": pin})).status_code for _ in range(n)]


@pytest.mark.parametrize("caso", ["con_pin", "senza_pin", "email_inesistente"])
def test_blocco_dopo_5_tentativi_in_ogni_caso(caso):
    async def body(c):
        if caso == "email_inesistente":
            email = f"nessuno.{uuid.uuid4().hex[:8]}@example.com"
        else:
            email = await _utente(c, con_pin=(caso == "con_pin"))
        assert await _tentativi(c, email) == [401] * 5 + [429]
        r = await c.post("/api/auth/pin-login", json={"email": email, "pin": SBAGLIATO})
        assert r.status_code == 429 and "Riprova tra" in r.json()["detail"]
    run(body)


def test_durante_il_blocco_anche_il_pin_giusto_e_rifiutato():
    async def body(c):
        email = await _utente(c, con_pin=True)
        await _tentativi(c, email, n=5)
        assert (await c.post("/api/auth/pin-login", json={"email": email, "pin": PIN})).status_code == 429
    run(body)


def test_pin_giusto_prima_del_blocco_entra_e_azzera():
    async def body(c):
        email = await _utente(c, con_pin=True)
        assert await _tentativi(c, email, n=4) == [401] * 4
        assert (await c.post("/api/auth/pin-login", json={"email": email, "pin": PIN})).status_code == 200
        c.cookies.clear()
        assert await _tentativi(c, email, n=4) == [401] * 4  # contatore ripartito da zero
    run(body)


def test_email_digitata_non_salvata_in_chiaro():
    async def body(c):
        email = f"nessuno.{uuid.uuid4().hex[:8]}@example.com"
        await _tentativi(c, email, n=2)
        docs = await server.db.pin_login_guard.find({}).to_list(None)
        assert len(docs) == 1 and email not in str(docs)
    run(body)
