"""Cancellazione dell'account (art. 17 GDPR) ed esportazione dei dati (art. 20).

- «Elimina il mio account» cancella anche recensioni, valutazione dell'app, codici,
  offerte del mese dopo e archivio; i dati di pagamento restano solo anonimizzati.
- I dati degli altri utenti non vengono toccati.
- L'esportazione comprende recensioni, valutazione dell'app e (commercianti) tutte le offerte.
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
DB_NAME = "e2e_unit_gdpr_cancellazione"
os.environ["MONGO_URL"] = "mongodb://localhost:27017" if USE_MOCK else MONGO_URL
os.environ.setdefault("DB_NAME", DB_NAME)
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")
os.environ["RESEND_API_KEY"] = ""

import httpx  # noqa: E402

import server  # noqa: E402

# Raccolte con un campo user_id / merchant_id che riguardano l'utente
PER_UTENTE = ("redemptions", "qr_scans", "consent_logs", "reviews", "app_feedback", "webauthn_challenges")
PER_NEGOZIO = ("discounts", "next_discounts", "discounts_archive", "reviews")
PAGAMENTI = ("subscriptions", "payment_transactions", "renewal_events")


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


async def utente(role: str) -> dict:
    uid = str(uuid.uuid4())
    email = f"{role}.{uid[:8]}@example.com"
    await server.db.users.insert_one({"id": uid, "email": email, "name": "Prova", "role": role})
    for coll in PER_UTENTE + PAGAMENTI:
        await server.db[coll].insert_one({"id": str(uuid.uuid4()), "user_id": uid})
    if role == "merchant":
        for coll in PER_NEGOZIO:
            await server.db[coll].insert_one({"id": str(uuid.uuid4()), "merchant_id": uid})
    await server.db.login_guard.insert_one({"key": server._login_guard_key(email), "failed": 2})
    return {"id": uid, "email": email,
            "h": {"Authorization": f"Bearer {server.create_token(uid, email)}"}}


async def resti(uid: str) -> list:
    out = []
    for coll in set(PER_UTENTE + PER_NEGOZIO + PAGAMENTI):
        if await server.db[coll].count_documents({"$or": [{"user_id": uid}, {"merchant_id": uid}]}):
            out.append(coll)
    if await server.db.users.count_documents({"id": uid}):
        out.append("users")
    return sorted(out)


@pytest.mark.parametrize("role", ["client", "merchant"])
def test_cancellazione_completa(role):
    async def body(c):
        io = await utente(role)
        altro = await utente(role)
        r = await c.delete("/api/gdpr/delete-account", headers=io["h"])
        assert r.status_code == 200, r.text
        assert await resti(io["id"]) == []
        # Pagamenti: restano solo anonimizzati (obbligo fiscale)
        for coll in PAGAMENTI:
            doc = await server.db[coll].find_one({"user_id": f"deleted_{io['id'][:8]}"})
            assert doc and doc["anonymized"] is True
        assert await server.db.login_guard.count_documents({"key": server._login_guard_key(io["email"])}) == 0
        # L'altro utente non è stato toccato
        assert "users" in await resti(altro["id"])
        assert len(await resti(altro["id"])) > 5
    run(body)


def test_esportazione_completa_commerciante():
    async def body(c):
        io = await utente("merchant")
        r = await c.get("/api/gdpr/export", headers=io["h"])
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ("reviews", "app_feedback", "merchant_discounts", "merchant_next_discounts",
                  "merchant_discounts_archive", "redemptions", "qr_scans"):
            assert d[k], f"manca {k}"
    run(body)


def test_ricerca_indirizzi_una_richiesta_al_secondo():
    """Policy di Nominatim: al massimo una richiesta al secondo da tutto il server."""
    async def main():
        server._nominatim_last = 0.0
        assert await server._nominatim_turno(max_attesa=0) is True
        # Subito dopo il turno non c'è: i suggerimenti rinunciano invece di aspettare
        assert await server._nominatim_turno(max_attesa=0) is False
    asyncio.run(main())
