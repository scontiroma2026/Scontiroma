"""Un abbonamento con end_date passata senza rinnovo viene marcato 'expired' e non risulta piu' attivo.
Server in-process su database locale (mongomock o MongoDB su localhost)."""
import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

import pytest

MONGO_URL = os.environ.setdefault("TEST_MONGO_URL", os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
_u = urlparse(MONGO_URL)
if not (_u.scheme == "mongomock" or (_u.scheme == "mongodb" and (_u.hostname or "") in ("localhost", "127.0.0.1", "::1"))):
    pytest.exit(f"MONGO_URL non locale ({_u.scheme}://{_u.hostname}): test rifiutati.", returncode=2)
USE_MOCK = _u.scheme == "mongomock"
DB_NAME = "unit_subscription_expiry"
os.environ["MONGO_URL"] = "mongodb://localhost:27017" if USE_MOCK else MONGO_URL
os.environ.setdefault("DB_NAME", DB_NAME)
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")
os.environ["RESEND_API_KEY"] = ""

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import httpx  # noqa: E402

import server  # noqa: E402


def test_abbonamento_scaduto_non_risulta_attivo(monkeypatch):
    monkeypatch.setenv("CLIENT_SUBSCRIPTION_REQUIRED", "true")

    async def main():
        if USE_MOCK:
            import mongomock_motor
            server.db = mongomock_motor.AsyncMongoMockClient()[DB_NAME]
        else:
            from motor.motor_asyncio import AsyncIOMotorClient
            cli = AsyncIOMotorClient(MONGO_URL)
            await cli.drop_database(DB_NAME)
            server.db = cli[DB_NAME]
        uid = "u-prova-scadenza"
        email = "scadenza@example.com"
        await server.db.users.insert_one({"id": uid, "email": email, "name": "Prova", "role": "client"})
        now = datetime.now(timezone.utc)
        await server.db.subscriptions.insert_one({
            "id": "s1", "user_id": uid, "status": "active", "plan": "monthly",
            "start_date": (now - timedelta(days=36)).isoformat(),
            "end_date": (now - timedelta(days=6)).isoformat(), "provider": "mock",
        })
        headers = {"Authorization": f"Bearer {server.create_token(uid, email)}"}
        transport = httpx.ASGITransport(app=server.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
            r = await c.get("/api/subscription/me", headers=headers)
        assert r.status_code == 200, r.text
        # la pagina account non mostra piu' "Attivo" con data passata
        assert r.json()["active"] is False
        # il database viene corretto in automatico a 'expired'
        assert (await server.db.subscriptions.find_one({"id": "s1"}))["status"] == "expired"
        # il riscatto dello sconto resta bloccato
        assert await server.user_has_active_sub(uid) is False

    asyncio.run(main())
