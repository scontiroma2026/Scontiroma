"""Sconti Roma backend tests - iteration 3 (PIN, WebAuthn, forgot/reset, admin master + merchants CRUD)."""
import os
import uuid
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://deal-bundle.preview.emergentagent.com").rstrip("/")
API = f"{BASE}/api"
MASTER_PW = "RomaMaster2026!"


def _login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=30)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


def _h(tok, extra=None):
    h = {"Authorization": f"Bearer {tok}"}
    if extra:
        h.update(extra)
    return h


@pytest.fixture(scope="module")
def client_token():
    return _login("cliente@scontiroma.it", "cliente123")


@pytest.fixture(scope="module")
def admin_token():
    return _login("admin@scontiroma.it", os.environ.get("TEST_ADMIN_PASSWORD", ""))


@pytest.fixture(scope="module")
def merchant_token():
    return _login("gelato@scontiroma.it", "merchant123")


@pytest.fixture(scope="module")
def master_token(admin_token):
    r = requests.post(f"{API}/admin/verify-master", json={"password": MASTER_PW},
                      headers=_h(admin_token), timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["token"]


# ---------- PIN ----------
class TestPin:
    def test_set_pin_ok(self, client_token):
        r = requests.post(f"{API}/auth/pin", json={"pin": "1234"}, headers=_h(client_token), timeout=30)
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is True

    def test_set_pin_non_numeric_returns_422(self, client_token):
        # pin length 4 passes pydantic; endpoint raises 422 for non-digit
        r = requests.post(f"{API}/auth/pin", json={"pin": "abcd"}, headers=_h(client_token), timeout=30)
        assert r.status_code == 422, r.text

    def test_set_pin_wrong_length_422(self, client_token):
        r = requests.post(f"{API}/auth/pin", json={"pin": "12"}, headers=_h(client_token), timeout=30)
        assert r.status_code == 422

    def test_pin_login_success(self, client_token):
        # ensure set
        requests.post(f"{API}/auth/pin", json={"pin": "1234"}, headers=_h(client_token), timeout=30)
        r = requests.post(f"{API}/auth/pin-login",
                         json={"email": "cliente@scontiroma.it", "pin": "1234"}, timeout=30)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "access_token" in j and "user" in j
        assert j["user"]["email"] == "cliente@scontiroma.it"

    def test_pin_login_wrong_pin_401(self, client_token):
        requests.post(f"{API}/auth/pin", json={"pin": "1234"}, headers=_h(client_token), timeout=30)
        r = requests.post(f"{API}/auth/pin-login",
                         json={"email": "cliente@scontiroma.it", "pin": "9999"}, timeout=30)
        assert r.status_code == 401


# ---------- WebAuthn ----------
class TestWebAuthn:
    def test_register_begin_returns_options(self, client_token):
        r = requests.post(f"{API}/webauthn/register/begin", headers=_h(client_token), timeout=30)
        assert r.status_code == 200, r.text
        opts = r.json()
        assert "challenge" in opts
        assert "rp" in opts and "id" in opts["rp"]
        assert "user" in opts and "name" in opts["user"]
        assert opts["user"]["name"] == "cliente@scontiroma.it"

    def test_login_begin_no_credential_400(self):
        # merchant with no webauthn creds
        r = requests.post(f"{API}/webauthn/login/begin",
                         json={"email": "gelato@scontiroma.it"}, timeout=30)
        assert r.status_code == 400
        assert "biometrico" in r.text.lower() or "biometric" in r.text.lower()


# ---------- Password recovery ----------
class TestForgotReset:
    def test_forgot_existing_email_returns_token(self):
        r = requests.post(f"{API}/auth/forgot",
                         json={"email": "cliente@scontiroma.it"}, timeout=30)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "reset_token" in j and len(j["reset_token"]) > 10

    def test_forgot_unknown_email_no_token(self):
        r = requests.post(f"{API}/auth/forgot",
                         json={"email": f"nouser_{uuid.uuid4().hex[:6]}@example.com"}, timeout=30)
        assert r.status_code == 200
        assert "reset_token" not in r.json()

    def test_reset_invalid_token_400(self):
        r = requests.post(f"{API}/auth/reset",
                         json={"token": "invalidtoken123", "new_password": "abcdef"}, timeout=30)
        assert r.status_code == 400

    def test_reset_password_too_short_422(self):
        r = requests.post(f"{API}/auth/reset",
                         json={"token": "any", "new_password": "abc"}, timeout=30)
        assert r.status_code == 422

    def test_reset_flow_updates_password(self):
        # Create a throwaway user
        email = f"TEST_reset_{uuid.uuid4().hex[:8]}@example.com"
        rr = requests.post(f"{API}/auth/register", json={
            "email": email, "password": "oldpass123", "name": "T", "role": "client"
        }, timeout=30)
        assert rr.status_code == 200, rr.text
        # Forgot
        f = requests.post(f"{API}/auth/forgot", json={"email": email}, timeout=30).json()
        token = f["reset_token"]
        # Reset
        r = requests.post(f"{API}/auth/reset",
                        json={"token": token, "new_password": "newpass123"}, timeout=30)
        assert r.status_code == 200, r.text
        # Login with new password
        l = requests.post(f"{API}/auth/login",
                        json={"email": email, "password": "newpass123"}, timeout=30)
        assert l.status_code == 200


# ---------- Admin master ----------
class TestAdminMaster:
    def test_verify_master_wrong_password_401(self, admin_token):
        r = requests.post(f"{API}/admin/verify-master",
                         json={"password": "wrong"}, headers=_h(admin_token), timeout=30)
        assert r.status_code == 401

    def test_verify_master_as_non_admin_403(self, client_token):
        r = requests.post(f"{API}/admin/verify-master",
                         json={"password": MASTER_PW}, headers=_h(client_token), timeout=30)
        assert r.status_code == 403

    def test_verify_master_correct(self, master_token):
        assert isinstance(master_token, str) and len(master_token) > 20

    def test_admin_stats_without_master_403(self, admin_token):
        r = requests.get(f"{API}/admin/stats", headers=_h(admin_token), timeout=30)
        assert r.status_code == 403
        assert "master" in r.text.lower()

    def test_admin_stats_with_master_ok(self, admin_token, master_token):
        r = requests.get(f"{API}/admin/stats",
                        headers=_h(admin_token, {"X-Admin-Master": master_token}), timeout=30)
        assert r.status_code == 200, r.text
        j = r.json()
        for k in ("totals", "daily", "by_hour", "by_weekday", "top_merchants", "top_clients", "recent"):
            assert k in j

    def test_admin_session_endpoint(self, admin_token, master_token):
        r = requests.get(f"{API}/admin/session",
                        headers=_h(admin_token, {"X-Admin-Master": master_token}), timeout=30)
        assert r.status_code == 200
        assert r.json()["master_verified"] is True


# ---------- Admin merchants CRUD ----------
class TestAdminMerchants:
    def test_list_merchants(self, admin_token, master_token):
        r = requests.get(f"{API}/admin/merchants",
                        headers=_h(admin_token, {"X-Admin-Master": master_token}), timeout=30)
        assert r.status_code == 200, r.text
        merchants = r.json()["merchants"]
        assert isinstance(merchants, list) and len(merchants) > 0
        m0 = merchants[0]
        for k in ("shop_name", "approved", "has_discount", "redemptions_count"):
            assert k in m0, f"missing {k}: {m0}"

    def test_update_merchant_approve_and_edit(self, admin_token, master_token):
        hdr = _h(admin_token, {"X-Admin-Master": master_token})
        merchants = requests.get(f"{API}/admin/merchants", headers=hdr, timeout=30).json()["merchants"]
        # pick trattoria to edit (not gelato which client uses for redemption tests)
        target = next(m for m in merchants if m["email"] == "trattoria@scontiroma.it")
        mid = target["id"]
        original_name = target["shop_name"]
        # suspend
        r = requests.put(f"{API}/admin/merchants/{mid}", json={"approved": False}, headers=hdr, timeout=30)
        assert r.status_code == 200
        assert r.json()["merchant"]["approved"] is False
        # edit
        r = requests.put(f"{API}/admin/merchants/{mid}",
                        json={"shop_name": "TEST_Trattoria", "zone": "Monti", "category": "Pizzeria", "approved": True},
                        headers=hdr, timeout=30)
        assert r.status_code == 200
        m = r.json()["merchant"]
        assert m["shop_name"] == "TEST_Trattoria"
        assert m["zone"] == "Monti"
        # restore
        requests.put(f"{API}/admin/merchants/{mid}",
                    json={"shop_name": original_name, "zone": "Trastevere", "category": "Ristorante", "approved": True},
                    headers=hdr, timeout=30)

    def test_update_discount_and_delete_via_admin(self, admin_token, master_token):
        hdr = _h(admin_token, {"X-Admin-Master": master_token})
        # Create test merchant + discount via register + merchant login
        email = f"TEST_merch_{uuid.uuid4().hex[:6]}@example.com"
        rr = requests.post(f"{API}/auth/register", json={
            "email": email, "password": "merchant123", "name": "TM",
            "role": "merchant", "shop_name": "TEST_Shop", "zone": "Monti", "category": "Pizzeria"
        }, timeout=30)
        assert rr.status_code == 200
        mt = rr.json()["access_token"]
        # Create discount
        d = requests.post(f"{API}/merchants/me/discount", json={
            "title": "TEST_disc", "description": "x", "original_price": 10, "discounted_price": 5, "active": True
        }, headers=_h(mt), timeout=30)
        assert d.status_code == 200
        did = d.json()["discount"]["id"]
        # admin update discount
        u = requests.put(f"{API}/admin/discounts/{did}", json={"title": "TEST_disc_upd"}, headers=hdr, timeout=30)
        assert u.status_code == 200
        assert u.json()["discount"]["title"] == "TEST_disc_upd"
        # admin delete discount
        dd = requests.delete(f"{API}/admin/discounts/{did}", headers=hdr, timeout=30)
        assert dd.status_code == 200
        # 2nd delete -> 404
        dd2 = requests.delete(f"{API}/admin/discounts/{did}", headers=hdr, timeout=30)
        assert dd2.status_code == 404
        # admin delete merchant (cascades)
        mid = rr.json()["user"]["id"]
        r = requests.delete(f"{API}/admin/merchants/{mid}", headers=hdr, timeout=30)
        assert r.status_code == 200
        r2 = requests.delete(f"{API}/admin/merchants/{mid}", headers=hdr, timeout=30)
        assert r2.status_code == 404
