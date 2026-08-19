"""Sconti Roma backend tests - iteration 2 (Stripe, rotating QR, admin)."""
import os
import time
import hmac
import hashlib
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://deal-bundle.preview.emergentagent.com").rstrip("/")
API = f"{BASE}/api"
JWT_SECRET = "7bf1620c584ce701c6eaa055faa0d7599172631b3a4203ad6d68e950d50b1e6b"


def _login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=30)
    assert r.status_code == 200, f"login failed for {email}: {r.status_code} {r.text}"
    return r.json()["access_token"]


def _hdr(tok):
    return {"Authorization": f"Bearer {tok}"}


@pytest.fixture(scope="module")
def client_token():
    return _login("cliente@scontiroma.it", "cliente123")


@pytest.fixture(scope="module")
def merchant_gym_token():
    return _login("gym@scontiroma.it", "merchant123")


@pytest.fixture(scope="module")
def merchant_tratt_token():
    return _login("trattoria@scontiroma.it", "merchant123")


@pytest.fixture(scope="module")
def admin_token():
    return _login("admin@scontiroma.it", "admin123")


@pytest.fixture(scope="module")
def ensure_client_sub(client_token):
    # mock subscribe so redemption works
    r = requests.post(f"{API}/subscription/subscribe", json={"plan": "monthly", "card_last4": "4242"}, headers=_hdr(client_token), timeout=30)
    assert r.status_code == 200


# ------- Stripe Checkout -------
class TestStripeCheckout:
    def test_checkout_unauth_401(self):
        r = requests.post(f"{API}/payments/checkout", json={"origin_url": BASE}, timeout=30)
        assert r.status_code == 401

    def test_checkout_as_client_returns_stripe_url(self, client_token):
        r = requests.post(f"{API}/payments/checkout", json={"origin_url": BASE}, headers=_hdr(client_token), timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "checkout_url" in data and "session_id" in data
        assert data["checkout_url"].startswith("https://checkout.stripe.com/"), data["checkout_url"]
        # payment_transactions record
        st = requests.get(f"{API}/payments/status/{data['session_id']}", timeout=30)
        assert st.status_code == 200
        j = st.json()
        assert j["session_id"] == data["session_id"]
        assert j["payment_status"] in ("pending", "unpaid", "paid")


# ------- Rotating QR / verify -------
def _create_redemption(client_token, discount_id):
    r = requests.post(f"{API}/redemptions/create/{discount_id}", headers=_hdr(client_token), timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["redemption"]


def _get_gym_discount():
    r = requests.get(f"{API}/discounts", timeout=30)
    for d in r.json()["discounts"]:
        if d["merchant"]["shop_name"] == "EUR Fitness Club":
            return d
    raise AssertionError("gym discount not found")


class TestRotatingQR:
    def test_token_owner(self, client_token, ensure_client_sub):
        d = _get_gym_discount()
        red = _create_redemption(client_token, d["id"])
        r = requests.get(f"{API}/redemptions/{red['id']}/token", headers=_hdr(client_token), timeout=30)
        assert r.status_code == 200, r.text
        j = r.json()
        for k in ("code", "slot", "token", "qr_value", "expires_in"):
            assert k in j
        assert j["qr_value"] == f"{j['code']}|{j['slot']}|{j['token']}"
        # verify hmac
        expected = hmac.new(JWT_SECRET.encode(), f"{j['code']}:{j['slot']}".encode(), hashlib.sha256).hexdigest()[:12]
        assert j["token"] == expected

    def test_token_non_owner_404(self, merchant_gym_token, client_token, ensure_client_sub):
        d = _get_gym_discount()
        red = _create_redemption(client_token, d["id"])
        r = requests.get(f"{API}/redemptions/{red['id']}/token", headers=_hdr(merchant_gym_token), timeout=30)
        # merchant role -> require_client will 403; some other user id -> 404. Either is a rejection.
        assert r.status_code in (403, 404)

    def test_verify_rotating_owner_merchant(self, client_token, merchant_gym_token, ensure_client_sub):
        d = _get_gym_discount()
        red = _create_redemption(client_token, d["id"])
        tok = requests.get(f"{API}/redemptions/{red['id']}/token", headers=_hdr(client_token), timeout=30).json()
        r = requests.post(f"{API}/redemptions/verify", json={"code": tok["qr_value"]}, headers=_hdr(merchant_gym_token), timeout=30)
        assert r.status_code == 200, r.text
        assert r.json()["redemption"]["status"] == "redeemed"

    def test_verify_plain_code_backcompat(self, client_token, merchant_gym_token, ensure_client_sub):
        d = _get_gym_discount()
        red = _create_redemption(client_token, d["id"])
        r = requests.post(f"{API}/redemptions/verify", json={"code": red["code"]}, headers=_hdr(merchant_gym_token), timeout=30)
        assert r.status_code == 200, r.text

    def test_verify_tampered_token_400(self, client_token, merchant_gym_token, ensure_client_sub):
        d = _get_gym_discount()
        red = _create_redemption(client_token, d["id"])
        tok = requests.get(f"{API}/redemptions/{red['id']}/token", headers=_hdr(client_token), timeout=30).json()
        bad_qr = f"{tok['code']}|{tok['slot']}|000000000000"
        r = requests.post(f"{API}/redemptions/verify", json={"code": bad_qr}, headers=_hdr(merchant_gym_token), timeout=30)
        assert r.status_code == 400, r.text


# ------- Admin stats -------
class TestAdminStats:
    def test_admin_stats_ok(self, admin_token):
        r = requests.get(f"{API}/admin/stats", headers=_hdr(admin_token), timeout=30)
        assert r.status_code == 200, r.text
        j = r.json()
        for k in ("totals", "daily", "by_hour", "by_weekday", "top_merchants", "top_clients", "recent"):
            assert k in j
        assert len(j["by_hour"]) == 24
        assert len(j["by_weekday"]) == 7
        for k in ("clients", "merchants", "active_subscriptions", "mrr_eur", "total_redemptions"):
            assert k in j["totals"]

    def test_admin_stats_non_admin_403(self, client_token):
        r = requests.get(f"{API}/admin/stats", headers=_hdr(client_token), timeout=30)
        assert r.status_code == 403
