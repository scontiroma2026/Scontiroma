"""Backend tests for BUG 2 fix (merchant referrals URLs) and auth regression."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://deal-bundle.preview.emergentagent.com").rstrip("/")
EXPECTED_HOST = "https://deal-bundle.preview.emergentagent.com"
STALE_HOST = "https://68074b6b-8089-4395-a1ca-2291114b108b.preview.emergentagent.com"


def _login(session, email, password):
    r = session.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    return r


class TestMerchantReferralsURLs:
    def test_merchant_login_and_referrals_urls(self):
        s = requests.Session()
        r = _login(s, "trattoria@scontiroma.it", "merchant123")
        assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"

        # httpOnly cookies must be set
        cookies_names = [c.name for c in s.cookies]
        assert "access_token" in cookies_names, f"no access_token cookie, got: {cookies_names}"

        # localStorage token should NOT be in response body (httpOnly)
        body = r.json()
        # token might be omitted from body for httpOnly-only approach
        # Just verify user info
        assert body.get("user", {}).get("email") == "trattoria@scontiroma.it"

        r2 = s.get(f"{BASE_URL}/api/merchants/me/referrals")
        assert r2.status_code == 200, f"referrals failed: {r2.status_code} {r2.text}"
        data = r2.json()

        assert "referral_url" in data and "flyer_url" in data
        ref_url = data["referral_url"]
        flyer_url = data["flyer_url"]
        merchant_id = data["merchant_id"]

        # must use FRONTEND_URL (correct host), NOT stale host
        assert ref_url.startswith(EXPECTED_HOST), f"referral_url uses wrong host: {ref_url}"
        assert flyer_url.startswith(EXPECTED_HOST), f"flyer_url uses wrong host: {flyer_url}"
        assert STALE_HOST not in ref_url
        assert STALE_HOST not in flyer_url

        # suffixes
        assert ref_url.endswith(f"/?ref={merchant_id}"), f"bad ref_url suffix: {ref_url}"
        assert flyer_url.endswith(f"/locandina?ref={merchant_id}"), f"bad flyer_url suffix: {flyer_url}"


class TestAuthHttpOnlyCookies:
    def test_client_login_httponly_cookies(self):
        s = requests.Session()
        r = _login(s, "francesco@gmail.com", "francesco123")
        assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"

        # Inspect Set-Cookie headers for HttpOnly and Secure attributes
        set_cookies = r.headers.get("set-cookie") or ""
        # Sessions may combine; also check via raw headers
        raw_cookies = []
        for h_name, h_val in r.raw.headers.items() if hasattr(r.raw, "headers") else []:
            if h_name.lower() == "set-cookie":
                raw_cookies.append(h_val)

        # Combined check via lowercased blob
        combined = set_cookies.lower()
        assert "access_token=" in combined, f"no access_token in Set-Cookie: {set_cookies}"
        assert "httponly" in combined, f"access_token cookie not HttpOnly: {set_cookies}"
        # Secure required for cross-site cookies in preview
        assert "secure" in combined, f"cookie not Secure: {set_cookies}"

        # Authenticated call works with cookies
        me = s.get(f"{BASE_URL}/api/auth/me")
        assert me.status_code == 200, f"/auth/me failed: {me.status_code} {me.text}"
        me_data = me.json()
        u = me_data.get("user", me_data)
        assert u.get("email") == "francesco@gmail.com"

    def test_logout_clears_cookies(self):
        s = requests.Session()
        r = _login(s, "francesco@gmail.com", "francesco123")
        assert r.status_code == 200

        # try common logout paths
        lo = s.post(f"{BASE_URL}/api/auth/logout")
        assert lo.status_code in (200, 204), f"logout status: {lo.status_code} {lo.text}"

        # After logout, /auth/me should be 401
        me = s.get(f"{BASE_URL}/api/auth/me")
        assert me.status_code in (401, 403), f"expected 401 after logout, got {me.status_code}"


class TestAdminLogin:
    def test_admin_login(self):
        s = requests.Session()
        r = _login(s, "admin@scontiroma.it", "admin123")
        assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
        me = s.get(f"{BASE_URL}/api/auth/me")
        assert me.status_code == 200
        data = me.json()
        u = data.get("user", data)
        assert u.get("role") in ("admin", "superadmin") or u.get("is_admin") is True, f"user not admin: {u}"
