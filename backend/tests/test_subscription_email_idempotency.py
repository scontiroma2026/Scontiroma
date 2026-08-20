"""Iteration 10 — Idempotency of Stripe subscription welcome email.

Bug: `mark_subscription_paid` was invoked both by polling `/payments/status/{sid}`
and by the Stripe webhook `checkout.session.completed`. The welcome email was
sent from inside the webhook's `modified_count>0` branch, so if polling arrived
first the webhook found modified_count=0 and the email never went out.

Fix (server.py ~L878): email is now sent from inside `mark_subscription_paid`
guarded by a `welcome_email_sent` flag on the payment_transaction, set via
`find_one_and_update({..., welcome_email_sent: {$ne: True}})` so exactly one
caller wins the race and sends the email.

These tests import `mark_subscription_paid` directly and count how many times
`send_monthly_discounts_notification` is invoked when the function is called
twice for the same session (both orderings), plus scenarios A/B/C.
"""
import asyncio
import os
import sys
import time
import uuid
from datetime import datetime, timezone

import pytest

# Ensure /app/backend is on sys.path so `import server` / `email_service` work
sys.path.insert(0, "/app/backend")

import server  # noqa: E402
import email_service  # noqa: E402


# ---------- helpers ----------
def run(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


@pytest.fixture()
def sent_counter(monkeypatch):
    """Replace send_monthly_discounts_notification with a call counter."""
    calls = []

    async def _fake(to, name, cta_url=None):
        calls.append({"to": to, "name": name, "cta_url": cta_url})
        return True

    # Patch both the email_service source AND the reference already imported
    # into `server` (from email_service import send_monthly_discounts_notification).
    monkeypatch.setattr(email_service, "send_monthly_discounts_notification", _fake)
    monkeypatch.setattr(server, "send_monthly_discounts_notification", _fake)
    return calls


@pytest.fixture()
def test_user_and_tx():
    """Create a fresh user + payment_transaction, cleanup after."""
    ts = int(time.time() * 1000)
    user_id = f"TEST_user_{ts}_{uuid.uuid4().hex[:6]}"
    session_id = f"TEST_sess_{ts}_{uuid.uuid4().hex[:6]}"
    email = f"TEST_{ts}@example.com"

    async def _setup():
        await server.db.users.insert_one({
            "id": user_id,
            "email": email,
            "name": "Test Subscriber",
            "role": "client",
            "password": "x",
        })
        await server.db.payment_transactions.insert_one({
            "session_id": session_id,
            "user_id": user_id,
            "amount": 300, "currency": "eur",
            "status": "initiated", "payment_status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    async def _teardown():
        await server.db.users.delete_many({"id": user_id})
        await server.db.payment_transactions.delete_many({"session_id": session_id})
        await server.db.subscriptions.delete_many({"user_id": user_id})

    run(_setup())
    yield {"user_id": user_id, "session_id": session_id, "email": email}
    run(_teardown())


def _fake_session(session_id, subscription_id="sub_TEST_123"):
    return {"id": session_id, "subscription": subscription_id,
            "payment_status": "paid",
            "metadata": {"user_id": "unused_here"}}


# ---------- Scenario A: polling first, then webhook ----------
def test_scenario_A_polling_then_webhook_sends_email_once(test_user_and_tx, sent_counter):
    ctx = test_user_and_tx
    sess = _fake_session(ctx["session_id"])

    # first call (simulates polling path)
    run(server.mark_subscription_paid(sess, ctx["user_id"]))
    # second call (simulates webhook path arriving later)
    run(server.mark_subscription_paid(sess, ctx["user_id"]))

    # Email should have been sent exactly once
    assert len(sent_counter) == 1, f"expected 1 email, got {len(sent_counter)}: {sent_counter}"
    assert sent_counter[0]["to"] == ctx["email"]

    # welcome_email_sent flag persisted
    tx = run(server.db.payment_transactions.find_one({"session_id": ctx["session_id"]}))
    assert tx.get("welcome_email_sent") is True


# ---------- Scenario B: webhook first, then polling ----------
def test_scenario_B_webhook_then_polling_sends_email_once(test_user_and_tx, sent_counter):
    ctx = test_user_and_tx
    sess = _fake_session(ctx["session_id"])

    run(server.mark_subscription_paid(sess, ctx["user_id"]))  # webhook first
    run(server.mark_subscription_paid(sess, ctx["user_id"]))  # polling second

    assert len(sent_counter) == 1, f"expected 1 email, got {len(sent_counter)}"


# ---------- Scenario C: only polling (no webhook) ----------
def test_scenario_C_only_polling_still_sends_email(test_user_and_tx, sent_counter):
    ctx = test_user_and_tx
    sess = _fake_session(ctx["session_id"])
    run(server.mark_subscription_paid(sess, ctx["user_id"]))
    assert len(sent_counter) == 1


# ---------- Subscription is NOT duplicated by definition of the fix?  ----------
# NOTE: the current implementation creates a subscription row on every call and
# marks the previous one as `replaced`. That means calling twice yields 1 active
# + 1 replaced (not two active). This is by design (idempotent from the user's
# perspective: only one active sub) — we verify that below.
def test_no_duplicate_active_subscription_after_double_call(test_user_and_tx, sent_counter):
    ctx = test_user_and_tx
    sess = _fake_session(ctx["session_id"])
    run(server.mark_subscription_paid(sess, ctx["user_id"]))
    run(server.mark_subscription_paid(sess, ctx["user_id"]))

    active = run(server.db.subscriptions.count_documents(
        {"user_id": ctx["user_id"], "status": "active"}))
    assert active == 1, f"expected exactly 1 active subscription, got {active}"


# ---------- Email failure does not break subscription creation ----------
def test_email_failure_does_not_break_subscription(test_user_and_tx, monkeypatch):
    ctx = test_user_and_tx

    async def _boom(*a, **kw):
        raise RuntimeError("Resend rejected recipient")

    monkeypatch.setattr(email_service, "send_monthly_discounts_notification", _boom)
    monkeypatch.setattr(server, "send_monthly_discounts_notification", _boom)

    sess = _fake_session(ctx["session_id"])
    # Should not raise
    run(server.mark_subscription_paid(sess, ctx["user_id"]))

    active = run(server.db.subscriptions.count_documents(
        {"user_id": ctx["user_id"], "status": "active"}))
    assert active == 1


# ---------- Stripe webhook regression: bad signature still 400 ----------
def test_stripe_webhook_invalid_signature_regression():
    import requests
    BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
    if not BASE_URL:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                    break
    r = requests.post(f"{BASE_URL}/api/stripe/webhook",
                      data='{"type":"noop"}',
                      headers={"Content-Type": "application/json",
                               "stripe-signature": "t=1,v1=invalid"})
    assert r.status_code == 400
