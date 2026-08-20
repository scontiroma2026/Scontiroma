"""Iteration 11 — PayPal /paypal/activate welcome-email idempotency.

Verifies the fix in server.paypal_activate (L996-1040):
- On successful PayPal subscription activation, send_monthly_discounts_notification
  is invoked EXACTLY ONCE per paypal_subscription_id.
- Calling paypal_activate a second time with the same subscription_id inserts a
  new subscription row (previous one flipped to `replaced`) but does NOT resend
  the welcome email (idempotency via
  count_documents({paypal_subscription_id, welcome_email_sent: True, id: $ne})).
- welcome_email_sent flag is persisted True on all resulting subscription docs.
- If Resend raises inside the email send, subscription creation still succeeds.
- If PayPal is not configured, /paypal/activate returns 400.
"""
import asyncio
import sys
import time
import uuid

import pytest

sys.path.insert(0, "/app/backend")

import server  # noqa: E402
import email_service  # noqa: E402
import paypal_service  # noqa: E402


def run(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


# ---------- fixtures ----------
@pytest.fixture()
def sent_counter(monkeypatch):
    calls = []

    async def _fake(to, name, cta_url=None):
        calls.append({"to": to, "name": name})
        return True

    monkeypatch.setattr(email_service, "send_monthly_discounts_notification", _fake)
    monkeypatch.setattr(server, "send_monthly_discounts_notification", _fake)
    return calls


@pytest.fixture()
def paypal_mock(monkeypatch):
    """Force paypal_service.is_configured -> True, get_subscription -> ACTIVE."""
    monkeypatch.setattr(paypal_service, "is_configured", lambda: True)

    async def _get_sub(sub_id):
        return {"id": sub_id, "status": "ACTIVE"}

    monkeypatch.setattr(paypal_service, "get_subscription", _get_sub)


@pytest.fixture()
def test_user():
    ts = int(time.time() * 1000)
    user = {
        "id": f"TEST_pp_user_{ts}_{uuid.uuid4().hex[:6]}",
        "email": f"TEST_pp_{ts}@example.com",
        "name": "PayPal Tester",
        "role": "client",
    }

    async def _setup():
        await server.db.users.insert_one({**user, "password": "x"})

    async def _teardown():
        await server.db.users.delete_many({"id": user["id"]})
        await server.db.subscriptions.delete_many({"user_id": user["id"]})

    run(_setup())
    yield user
    run(_teardown())


# ---------- tests ----------
def test_paypal_activate_sends_welcome_email_once_on_first_call(
    test_user, paypal_mock, sent_counter
):
    sub_id = f"I-TEST-{uuid.uuid4().hex[:10]}"
    payload = server.PayPalActivateIn(subscription_id=sub_id)

    resp = run(server.paypal_activate(payload, user=test_user))

    assert resp["subscription"]["paypal_subscription_id"] == sub_id
    assert resp["subscription"]["status"] == "active"
    assert resp["subscription"]["welcome_email_sent"] is True
    assert len(sent_counter) == 1
    assert sent_counter[0]["to"] == test_user["email"]


def test_paypal_activate_double_call_same_subid_sends_email_only_once(
    test_user, paypal_mock, sent_counter
):
    sub_id = f"I-TEST-{uuid.uuid4().hex[:10]}"
    payload = server.PayPalActivateIn(subscription_id=sub_id)

    run(server.paypal_activate(payload, user=test_user))
    run(server.paypal_activate(payload, user=test_user))

    # Email exactly once
    assert len(sent_counter) == 1, f"expected 1 email, got {len(sent_counter)}"

    # Two subscription docs, both flagged welcome_email_sent=True
    docs = run(server.db.subscriptions.find(
        {"user_id": test_user["id"], "paypal_subscription_id": sub_id}
    ).to_list(length=10))
    assert len(docs) == 2
    assert all(d.get("welcome_email_sent") is True for d in docs)

    # Only one active, the other replaced
    statuses = sorted([d["status"] for d in docs])
    assert statuses == ["active", "replaced"]


def test_paypal_activate_email_failure_does_not_break_subscription(
    test_user, paypal_mock, monkeypatch
):
    async def _boom(*a, **kw):
        raise RuntimeError("Resend rejected recipient")

    monkeypatch.setattr(email_service, "send_monthly_discounts_notification", _boom)
    monkeypatch.setattr(server, "send_monthly_discounts_notification", _boom)

    sub_id = f"I-TEST-{uuid.uuid4().hex[:10]}"
    payload = server.PayPalActivateIn(subscription_id=sub_id)

    # Should NOT raise
    resp = run(server.paypal_activate(payload, user=test_user))
    assert resp["subscription"]["status"] == "active"

    active = run(server.db.subscriptions.count_documents(
        {"user_id": test_user["id"], "status": "active"}
    ))
    assert active == 1


def test_paypal_activate_returns_400_when_paypal_not_configured(
    test_user, monkeypatch
):
    monkeypatch.setattr(paypal_service, "is_configured", lambda: False)

    payload = server.PayPalActivateIn(subscription_id="I-TEST-NOCONF")
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc:
        run(server.paypal_activate(payload, user=test_user))
    assert exc.value.status_code == 400
    assert "PayPal" in exc.value.detail


def test_paypal_activate_deactivates_previous_active_subscriptions(
    test_user, paypal_mock, sent_counter
):
    """When user already has an active (e.g. Stripe) subscription, activating PayPal
    marks the previous one as 'replaced' and welcome email is still sent once
    for the NEW paypal_subscription_id (accepted behaviour per review request)."""
    # Seed a pre-existing active Stripe subscription
    run(server.db.subscriptions.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": test_user["id"],
        "plan": "monthly",
        "status": "active",
        "provider": "stripe",
        "welcome_email_sent": True,
    }))

    sub_id = f"I-TEST-{uuid.uuid4().hex[:10]}"
    payload = server.PayPalActivateIn(subscription_id=sub_id)
    run(server.paypal_activate(payload, user=test_user))

    # Old stripe row now 'replaced'
    stripe_row = run(server.db.subscriptions.find_one(
        {"user_id": test_user["id"], "provider": "stripe"}
    ))
    assert stripe_row["status"] == "replaced"

    # New PayPal row active + email sent once (per-provider welcome)
    pp_row = run(server.db.subscriptions.find_one(
        {"user_id": test_user["id"], "paypal_subscription_id": sub_id}
    ))
    assert pp_row["status"] == "active"
    assert len(sent_counter) == 1
