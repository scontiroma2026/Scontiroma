"""Nessuna risposta del server deve contenere i campi riservati degli utenti
(hash di password e PIN, token di reset, codici PIN, contatori di sicurezza, credenziali
Face ID), né quelli di chi chiama né quelli di altri utenti.

Prepara un cliente e un commerciante con tutti i campi riservati valorizzati con un
marcatore riconoscibile, poi chiama OGNI rotta GET del server (più login e modifiche
profilo) da anonimo, cliente, commerciante e admin con master password, e controlla che
nessuna risposta contenga né il nome di un campo riservato né il marcatore.
Gira in-process contro un MongoDB locale o l'emulatore (rifiuta database remoti).
"""
import asyncio
import json
import os
import uuid
from datetime import datetime, timezone
from urllib.parse import urlparse

import pytest

# Il server richiede un MONGO_URL "mongodb://": l'indirizzo scelto per i test resta in
# TEST_MONGO_URL, così più file di test nello stesso pytest vedono tutti lo stesso valore.
MONGO_URL = os.environ.setdefault("TEST_MONGO_URL", os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
_u = urlparse(MONGO_URL)
if not (_u.scheme == "mongomock" or (_u.scheme == "mongodb" and (_u.hostname or "") in ("localhost", "127.0.0.1", "::1"))):
    pytest.exit(f"MONGO_URL non locale ({_u.scheme}://{_u.hostname}): test rifiutati.", returncode=2)
USE_MOCK = _u.scheme == "mongomock"
DB_NAME = "e2e_unit_campi_riservati"

os.environ["MONGO_URL"] = "mongodb://localhost:27017" if USE_MOCK else MONGO_URL
os.environ.setdefault("DB_NAME", DB_NAME)
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")
os.environ["RESEND_API_KEY"] = ""

import httpx  # noqa: E402

import server  # noqa: E402


def run(test_body):
    """Esegue `test_body(client)` in-process contro un database di test vuoto."""
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
            await test_body(c)
    asyncio.run(main())


MARK = "SEGRETO-TEST"
PASSWORD = "password-test-123456"
MASTER = "master-test-123456"
PRIVATE = set(server._PRIVATE_USER_FIELDS)

# Rotte GET che chiamano servizi esterni (Stripe, PayPal, OpenStreetMap) o solo documentazione.
SKIP = {
    "/openapi.json", "/docs", "/docs/oauth2-redirect", "/redoc",
    "/api/admin/health", "/api/geocode/suggest", "/api/payments/status/{session_id}",
}


def _private_fields(uid: str) -> dict:
    return {
        "password_hash": server.hash_password(PASSWORD),
        "pin_hash": f"{MARK}-pin_hash-{uid}", "pin_set": True,
        "reset_token": f"{MARK}-reset_token-{uid}", "reset_expires": f"{MARK}-reset_expires",
        "reset_req_log": [f"{MARK}-reset_req_log"],
        "pin_reset_code_hash": f"{MARK}-pin_reset_code_hash", "pin_reset_expires": f"{MARK}-pin_reset_expires",
        "pin_reset_attempts": 0, "pin_reset_req_log": [f"{MARK}-pin_reset_req_log"],
        "login_failed_attempts": 0, "pin_failed_attempts": 0, "recovery_failed_attempts": 0,
        "master_hash": f"{MARK}-master_hash", "recovery_id_hash": f"{MARK}-recovery_id_hash",
        "webauthn_user_id": f"{MARK}-webauthn_user_id",
        "webauthn_credentials": [{"credential_id": f"{MARK}-cred", "public_key": f"{MARK}-pk",
                                  "sign_count": 0, "transports": ["internal"]}],
    }


async def _utente(role: str, **extra) -> dict:
    uid = str(uuid.uuid4())
    email = f"{role}.{uid[:8]}@example.com"
    doc = {"id": uid, "email": email, "name": f"Prova {role}", "role": role,
           "created_at": datetime.now(timezone.utc).isoformat(), **_private_fields(uid), **extra}
    await server.db.users.insert_one(doc)
    return {"id": uid, "email": email,
            "h": {"Authorization": f"Bearer {server.create_token(uid, email)}"}}


def _controlla(where: str, text: str, hashes: list) -> None:
    assert MARK not in text, f"{where}: contiene un valore riservato"
    for h in hashes:
        assert h not in text, f"{where}: contiene un hash di password"
    try:
        data = json.loads(text)
    except ValueError:
        return

    def walk(x, path="$"):
        if isinstance(x, dict):
            for k, v in x.items():
                assert k not in PRIVATE, f"{where}: campo riservato {k!r} in {path}"
                walk(v, f"{path}.{k}")
        elif isinstance(x, list):
            for i, v in enumerate(x):
                walk(v, f"{path}[{i}]")
    walk(data)


def test_nessuna_risposta_contiene_campi_riservati(monkeypatch):
    monkeypatch.setenv("ADMIN_MASTER_PASSWORD", MASTER)

    async def body(c):
        merchant = await _utente("merchant", shop_name="Negozio di prova", zone="Garbatella",
                                 category="Ristorante", address="Via di prova 1, Roma", phone="")
        client = await _utente("client", referred_by=merchant["id"])
        admin = await _utente("admin")
        now = datetime.now(timezone.utc).isoformat()
        did, rid = str(uuid.uuid4()), str(uuid.uuid4())
        await server.db.discounts.insert_one({
            "id": did, "merchant_id": merchant["id"], "title": "Offerta di prova", "description": "x",
            "original_price": 20.0, "discounted_price": 10.0, "active": True,
            "approval_status": "approved", "created_at": now, "updated_at": now})
        await server.db.redemptions.insert_one({
            "id": rid, "code": "ABC12345", "user_id": client["id"], "merchant_id": merchant["id"],
            "discount_id": did, "status": "redeemed", "month_key": now[:7],
            "created_at": now, "redeemed_at": now})
        await server.db.subscriptions.insert_one({
            "id": str(uuid.uuid4()), "user_id": client["id"], "status": "active", "provider": "stripe",
            "start_date": now, "end_date": "2999-01-01T00:00:00+00:00", "price_eur": 2.99})
        await server.db.reviews.insert_one({
            "id": str(uuid.uuid4()), "user_id": client["id"], "merchant_id": merchant["id"],
            "redemption_id": rid, "stars": 5, "comment": "ok", "created_at": now})

        await server.db.admin_security.delete_many({})
        m = await c.post("/api/admin/verify-master", json={"password": MASTER}, headers=admin["h"])
        assert m.status_code == 200, m.text
        admin_h = {**admin["h"], "X-Admin-Master": m.json()["token"]}

        hashes = [u["password_hash"] async for u in server.db.users.find({}, {"password_hash": 1})]
        params = {"discount_id": did, "merchant_id": merchant["id"], "rid": rid, "archivio_id": "inesistente", "codice": "ZZZZZ"}
        ruoli = {"anonimo": {}, "cliente": client["h"], "commerciante": merchant["h"], "admin": admin_h}

        controllate = 0
        for route in server.app.routes:
            if "GET" not in (getattr(route, "methods", None) or set()) or route.path in SKIP:
                continue
            path = route.path.format(**params)
            for ruolo, h in ruoli.items():
                r = await c.get(path, headers=h, params={"token": "x"} if path == "/api/qr/verify" else None)
                _controlla(f"GET {route.path} ({ruolo})", r.text, hashes)
                controllate += 1

        # Risposte che restituiscono l'utente dopo un'azione
        for u in (client, merchant):
            r = await c.post("/api/auth/login", json={"email": u["email"], "password": PASSWORD})
            assert r.status_code == 200, r.text
            _controlla("POST /api/auth/login", r.text, hashes)
        r = await c.post("/api/auth/register", json={
            "email": f"nuovo.{uuid.uuid4().hex[:6]}@example.com", "password": PASSWORD,
            "name": "Nuovo", "role": "client", "legal_accepted": True})
        assert r.status_code == 200, r.text
        _controlla("POST /api/auth/register", r.text, hashes)
        r = await c.put(f"/api/admin/merchants/{merchant['id']}", json={"approved": True}, headers=admin_h)
        _controlla("PUT /api/admin/merchants/{id}", r.text, hashes)

        # Le rotte più importanti devono aver risposto davvero
        for path, h in [("/api/auth/me", client["h"]), ("/api/gdpr/export", client["h"]),
                        ("/api/merchants/me/redemptions", merchant["h"]),
                        ("/api/admin/merchants", admin_h), ("/api/admin/subscribers", admin_h)]:
            assert (await c.get(path, headers=h)).status_code == 200, path
        assert controllate > 100
    run(body)
