"""Interruttore CLIENT_SUBSCRIPTION_REQUIRED e controlli sui vecchi pagamenti simulati.

Il server gira in-process (httpx + ASGI) contro un MongoDB LOCALE: rifiuta qualsiasi
host remoto, quindi non può mai toccare il database di produzione.
  - in CI: MONGO_URL=mongodb://localhost:27017 (MongoDB del runner)
  - senza MongoDB installato: MONGO_URL=mongomock://localhost (pip install mongomock-motor)
"""
import asyncio
import hashlib
import hmac
import json
import os
import time
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
DB_NAME = "e2e_unit_interruttore"

os.environ["MONGO_URL"] = "mongodb://localhost:27017" if USE_MOCK else MONGO_URL
os.environ.setdefault("DB_NAME", DB_NAME)
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")
os.environ["RESEND_API_KEY"] = ""

import httpx  # noqa: E402

import server  # noqa: E402

WEBHOOK_SECRET = "whsec_test_unit_interruttore"


def run(test_body, required: bool):
    """Esegue `test_body(client)` con un database di test vuoto e l'interruttore impostato."""
    os.environ["CLIENT_SUBSCRIPTION_REQUIRED"] = "true" if required else "false"
    server.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET

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

    try:
        asyncio.run(main())
    finally:
        os.environ.pop("CLIENT_SUBSCRIPTION_REQUIRED", None)


async def nuovo_utente(role="client"):
    uid = str(uuid.uuid4())
    email = f"{role}.{uid[:8]}@example.com"
    doc = {"id": uid, "email": email, "name": "Prova", "role": role,
           "created_at": datetime.now(timezone.utc).isoformat()}
    if role == "merchant":
        doc.update({"shop_name": "Negozio di prova", "zone": "Garbatella", "category": "Ristorante"})
    await server.db.users.insert_one(doc)
    return uid, {"Authorization": f"Bearer {server.create_token(uid, email)}"}


async def offerta_approvata():
    mid, _ = await nuovo_utente("merchant")
    did = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    await server.db.discounts.insert_one({
        "id": did, "merchant_id": mid, "title": "Offerta di prova", "description": "x",
        "original_price": 20.0, "discounted_price": 10.0, "active": True,
        "approval_status": "approved", "created_at": now, "updated_at": now,
    })
    return did


def firma_stripe(payload: str, secret: str = WEBHOOK_SECRET) -> str:
    t = int(time.time())
    v1 = hmac.new(secret.encode(), f"{t}.{payload}".encode(), hashlib.sha256).hexdigest()
    return f"t={t},v1={v1}"


async def checkout_completato(c, uid):
    """Webhook Stripe firmato di un checkout pagato, con la transazione già registrata."""
    sid = f"cs_test_{uuid.uuid4().hex[:12]}"
    await server.db.payment_transactions.insert_one({
        "session_id": sid, "user_id": uid, "status": "initiated", "payment_status": "pending"})
    payload = json.dumps({
        "id": f"evt_{uuid.uuid4().hex[:12]}", "object": "event", "type": "checkout.session.completed",
        "data": {"object": {"id": sid, "object": "checkout.session", "payment_status": "paid",
                            "subscription": f"sub_{uuid.uuid4().hex[:12]}", "metadata": {"user_id": uid}}},
    })
    return await c.post("/api/stripe/webhook", content=payload,
                        headers={"Content-Type": "application/json", "Stripe-Signature": firma_stripe(payload)})


# ---------- Interruttore spento (predefinito): fase di lancio gratuita ----------

def test_predefinito_spento():
    os.environ.pop("CLIENT_SUBSCRIPTION_REQUIRED", None)
    assert server.client_subscription_required() is False


def test_spento_configurazione_pubblica():
    async def body(c):
        r = await c.get("/api/config/public")
        assert r.status_code == 200
        assert r.json() == {"client_subscription_required": False}
    run(body, required=False)


def test_spento_qr_senza_abbonamento():
    async def body(c):
        did = await offerta_approvata()
        _, h = await nuovo_utente()
        r = await c.post(f"/api/redemptions/create/{did}", headers=h)
        assert r.status_code == 200, r.text
        assert r.json()["redemption"]["status"] == "pending"
        me = await c.get("/api/subscription/me", headers=h)
        assert me.json()["required"] is False and me.json()["active"] is False
        auth = await c.get("/api/auth/me", headers=h)
        assert auth.json()["user"]["subscription_required"] is False
    run(body, required=False)


def test_spento_limite_mensile_resta():
    async def body(c):
        did = await offerta_approvata()
        uid, h = await nuovo_utente()
        r = await c.post(f"/api/redemptions/create/{did}", headers=h)
        await server.db.redemptions.update_one({"id": r.json()["redemption"]["id"]},
                                               {"$set": {"status": "redeemed", "redeemed_at": datetime.now(timezone.utc).isoformat()}})
        again = await c.post(f"/api/redemptions/create/{did}", headers=h)
        assert again.status_code in (409, 429), again.text
    run(body, required=False)


def test_spento_pagamenti_rifiutati():
    async def body(c):
        _, h = await nuovo_utente()
        r = await c.post("/api/payments/checkout", json={}, headers=h)
        assert r.status_code == 409
        assert "fase di lancio" in r.json()["detail"]
        r = await c.post("/api/paypal/activate", json={"subscription_id": "I-PROVA"}, headers=h)
        assert r.status_code == 409
        r = await c.get("/api/paypal/config")
        assert r.json()["enabled"] is False
    run(body, required=False)


def test_spento_webhook_stripe_senza_effetti():
    async def body(c):
        uid, _ = await nuovo_utente()
        r = await checkout_completato(c, uid)
        assert r.status_code == 200, r.text
        assert r.json().get("ignored") == "subscription_not_required"
        assert await server.db.subscriptions.count_documents({"user_id": uid}) == 0
        # La firma resta obbligatoria anche a interruttore spento
        bad = await c.post("/api/stripe/webhook", content="{}",
                           headers={"Content-Type": "application/json", "Stripe-Signature": "t=1,v1=sbagliata"})
        assert bad.status_code == 400
    run(body, required=False)


def test_spento_promemoria_pagamento_saltati():
    async def body(_c):
        res = await server._run_grace_reminders()
        assert res["sent"] == 0 and res.get("skipped") == "subscription_not_required"
    run(body, required=False)


def test_spento_chi_ha_un_abbonamento_puo_annullarlo():
    async def body(c):
        uid, h = await nuovo_utente()
        now = datetime.now(timezone.utc)
        await server.db.subscriptions.insert_one({
            "id": str(uuid.uuid4()), "user_id": uid, "status": "active", "provider": "stripe",
            "start_date": now.isoformat(), "end_date": now.replace(year=now.year + 1).isoformat()})
        me = await c.get("/api/subscription/me", headers=h)
        assert me.json()["active"] is True and me.json()["required"] is False
        r = await c.post("/api/subscription/cancel", json={}, headers=h)
        assert r.status_code == 200, r.text
        assert await server.db.subscriptions.count_documents({"user_id": uid, "status": "active"}) == 0
    run(body, required=False)


# ---------- Interruttore acceso: tutto come prima ----------

def test_acceso_configurazione_pubblica():
    async def body(c):
        assert (await c.get("/api/config/public")).json() == {"client_subscription_required": True}
    run(body, required=True)


def test_acceso_qr_richiede_abbonamento():
    async def body(c):
        did = await offerta_approvata()
        _, h = await nuovo_utente()
        r = await c.post(f"/api/redemptions/create/{did}", headers=h)
        assert r.status_code == 402
        assert (await c.get("/api/subscription/me", headers=h)).json()["required"] is True
    run(body, required=True)


def test_acceso_webhook_stripe_attiva_abbonamento_e_qr():
    async def body(c):
        did = await offerta_approvata()
        uid, h = await nuovo_utente()
        r = await checkout_completato(c, uid)
        assert r.status_code == 200, r.text
        assert await server.db.subscriptions.count_documents({"user_id": uid, "status": "active"}) == 1
        r = await c.post(f"/api/redemptions/create/{did}", headers=h)
        assert r.status_code == 200, r.text
    run(body, required=True)


# ---------- Pagamento simulato rimosso ----------

def test_pagamento_finto_rimosso():
    async def body(c):
        _, h = await nuovo_utente()
        r = await c.post("/api/subscription/subscribe", json={"plan": "monthly"}, headers=h)
        assert r.status_code in (404, 405), r.text
        assert await server.db.subscriptions.count_documents({}) == 0
    for required in (False, True):
        run(body, required=required)
    paths = {getattr(rt, "path", "") for rt in server.app.routes}
    assert "/api/subscription/subscribe" not in paths


def test_simulazioni_admin_rimosse():
    paths = {getattr(rt, "path", "") for rt in server.app.routes}
    assert "/api/admin/simulate-renewal/{user_id}" not in paths
    assert "/api/admin/simulate-payment-failed/{user_id}" not in paths


def test_account_demo_non_nel_server():
    assert not hasattr(server, "SEED_MERCHANTS")


@pytest.mark.parametrize("email,password,creato", [
    ("", "una-password-lunga-abbastanza", False),
    ("admin@example.com", "", False),
    ("admin@example.com", "corta", False),
    ("admin@example.com", "una-password-lunga-abbastanza", True),
])
def test_admin_mai_con_password_vuota_o_corta(email, password, creato, monkeypatch):
    monkeypatch.setenv("ADMIN_EMAIL", email)
    monkeypatch.setenv("ADMIN_PASSWORD", password)

    async def body(_c):
        await server.seed_data()
        n = await server.db.users.count_documents({"role": "admin"})
        assert n == (1 if creato else 0)
    run(body, required=False)
