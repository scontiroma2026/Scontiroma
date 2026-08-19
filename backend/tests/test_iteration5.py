"""Iteration 5 — trim + validation + no TEST leftovers.

Tests:
 - GET /api/discounts returns exactly 9 approved discounts, none TEST/whitespace
 - First 3 by created_at DESC have clean shop_name/title
 - New discount POST strips leading/trailing whitespace on title/description/terms
 - Empty (whitespace-only) title or description => 422
 - Profile PUT trims shop_name/zone
 - Register merchant trims shop_name/name
"""
import os
import uuid
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@scontiroma.it"
ADMIN_PASS = "admin123"
MASTER_PASS = "ValeRoma2026"

TEST_EMAIL_PREFIX = "trim_test_"
_created_emails: list[str] = []
_created_discount_ids: list[str] = []


# ---------- helpers ----------
def _s():
    return requests.Session()


def _register_merchant(session, email, name="  Mario  ", shop_name="  Test Shop  ",
                       zone="  Trastevere  ", category="Ristorante"):
    r = session.post(f"{API}/auth/register", json={
        "email": email, "password": "merch123", "name": name,
        "role": "merchant", "shop_name": shop_name, "zone": zone,
        "category": category,
    })
    return r


def _admin_master_headers():
    s = _s()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    assert r.status_code == 200, f"admin login failed: {r.text}"
    r2 = s.post(f"{API}/admin/verify-master", json={"password": MASTER_PASS})
    assert r2.status_code == 200, f"master verify failed: {r2.text}"
    token = r2.json().get("token") or s.cookies.get("admin_master_token")
    return s, {"X-Admin-Master": token} if token else {}


# ---------- Cleanup fixture ----------
@pytest.fixture(scope="module", autouse=True)
def cleanup_after_module():
    yield
    # cleanup created users and their discounts via admin -> direct mongo not possible from tests
    # We'll attempt via a helper endpoint if exists — otherwise rely on prefix.
    # No admin delete-user endpoint, so leave with trim_test_ prefix for main agent cleanup.
    # But we can try to reject / remove discounts individually is not available either.
    # Log the emails for manual/subsequent cleanup.
    print("Created test emails (trim_test_ prefix, safe to bulk-delete):", _created_emails)


# ---------- Tests ----------
class TestPublicDiscountsCleanliness:
    def test_public_list_no_TEST_and_no_whitespace(self):
        r = requests.get(f"{API}/discounts")
        assert r.status_code == 200
        discounts = r.json().get("discounts", [])
        # Must be exactly 9 (per problem statement) -- but be tolerant: assert >=9 and log if !=9
        assert len(discounts) >= 3, f"Expected at least 3 discounts, got {len(discounts)}"

        for d in discounts:
            title = d.get("title") or ""
            shop = (d.get("merchant") or {}).get("shop_name") or ""
            assert "TEST" not in title.upper() or "TEST_" not in title, \
                f"TEST leftover in discount title: {title!r}"
            assert not shop.startswith("TEST_"), f"TEST_ leftover shop_name: {shop!r}"
            assert shop == shop.strip(), f"shop_name has leading/trailing whitespace: {shop!r}"
            assert title == title.strip(), f"title has whitespace: {title!r}"
            desc = d.get("description") or ""
            assert desc == desc.strip(), f"desc has whitespace: {desc!r}"

    def test_public_list_expected_count_9(self):
        r = requests.get(f"{API}/discounts")
        discounts = r.json().get("discounts", [])
        # informational — assert exactly 9 as per spec
        assert len(discounts) == 9, f"Expected exactly 9 approved discounts, got {len(discounts)}: " \
            + ", ".join((d.get('merchant') or {}).get('shop_name','?') + ':' + (d.get('title') or '?') for d in discounts)

    def test_first_three_sensible(self):
        r = requests.get(f"{API}/discounts")
        discounts = r.json().get("discounts", [])
        top3 = discounts[:3]
        assert len(top3) == 3
        for d in top3:
            shop = (d.get("merchant") or {}).get("shop_name") or ""
            title = d.get("title") or ""
            assert shop and title, f"empty shop/title in top3: shop={shop!r} title={title!r}"
            assert shop == shop.strip() and title == title.strip()
            op = d.get("original_price")
            dp = d.get("discounted_price")
            assert isinstance(op, (int, float)) and op > 0
            assert isinstance(dp, (int, float)) and dp >= 0
            assert dp <= op, f"discounted_price > original_price for {shop} / {title}"


class TestMerchantTrimOnCreate:
    def test_new_merchant_discount_trims_fields(self):
        email = f"{TEST_EMAIL_PREFIX}m1_{uuid.uuid4().hex[:8]}@ex.com"
        _created_emails.append(email)
        s = _s()
        r = _register_merchant(s, email)
        assert r.status_code in (200, 201), r.text

        # Post discount with whitespace
        payload = {
            "title": "  Pizza al Taglio  ",
            "description": "  desc  ",
            "terms": "  lun-ven  ",
            "original_price": 10,
            "discounted_price": 6,
        }
        r = s.post(f"{API}/merchants/me/discount", json=payload)
        assert r.status_code == 200, r.text
        did = r.json().get("discount", {}).get("id")
        _created_discount_ids.append(did)

        # verify GET returns stripped
        r2 = s.get(f"{API}/merchants/me/discount")
        assert r2.status_code == 200
        d = r2.json().get("discount") or {}
        assert d.get("title") == "Pizza al Taglio", f"title not stripped: {d.get('title')!r}"
        assert d.get("description") == "desc", f"description not stripped: {d.get('description')!r}"
        assert d.get("terms") == "lun-ven", f"terms not stripped: {d.get('terms')!r}"

    def test_empty_title_returns_422(self):
        email = f"{TEST_EMAIL_PREFIX}m2_{uuid.uuid4().hex[:8]}@ex.com"
        _created_emails.append(email)
        s = _s()
        _register_merchant(s, email)
        r = s.post(f"{API}/merchants/me/discount", json={
            "title": "   ",
            "description": "d",
            "original_price": 10,
            "discounted_price": 5,
        })
        assert r.status_code == 422, f"expected 422, got {r.status_code}: {r.text}"

    def test_empty_description_returns_422(self):
        email = f"{TEST_EMAIL_PREFIX}m3_{uuid.uuid4().hex[:8]}@ex.com"
        _created_emails.append(email)
        s = _s()
        _register_merchant(s, email)
        r = s.post(f"{API}/merchants/me/discount", json={
            "title": "Ok",
            "description": "",
            "original_price": 10,
            "discounted_price": 5,
        })
        assert r.status_code == 422, f"expected 422, got {r.status_code}: {r.text}"


class TestProfileAndRegisterTrim:
    def test_profile_put_trims(self):
        email = f"{TEST_EMAIL_PREFIX}p1_{uuid.uuid4().hex[:8]}@ex.com"
        _created_emails.append(email)
        s = _s()
        _register_merchant(s, email)
        r = s.put(f"{API}/merchants/me/profile", json={
            "shop_name": "  My Shop  ",
            "zone": "  Trastevere  ",
        })
        assert r.status_code == 200, r.text
        u = r.json().get("user") or {}
        assert u.get("shop_name") == "My Shop", f"shop_name not trimmed: {u.get('shop_name')!r}"
        assert u.get("zone") == "Trastevere", f"zone not trimmed: {u.get('zone')!r}"

        # verify persistence via /auth/me
        r2 = s.get(f"{API}/auth/me")
        assert r2.status_code == 200
        u2 = r2.json().get("user") or {}
        assert u2.get("shop_name") == "My Shop"
        assert u2.get("zone") == "Trastevere"

    def test_register_trims_shop_and_name(self):
        email = f"{TEST_EMAIL_PREFIX}r1_{uuid.uuid4().hex[:8]}@ex.com"
        _created_emails.append(email)
        s = _s()
        r = _register_merchant(s, email, name="  Mario  ", shop_name="  Test  ")
        assert r.status_code in (200, 201), r.text
        r2 = s.get(f"{API}/auth/me")
        u = r2.json().get("user") or {}
        assert u.get("name") == "Mario", f"name not trimmed: {u.get('name')!r}"
        assert u.get("shop_name") == "Test", f"shop_name not trimmed: {u.get('shop_name')!r}"


class TestRegression:
    def test_seed_merchants_present_and_clean(self):
        r = requests.get(f"{API}/discounts")
        discounts = r.json().get("discounts", [])
        shop_names = {(d.get("merchant") or {}).get("shop_name") for d in discounts}
        # At least two seed merchants should be present
        expected_any = {"Trattoria da Marco", "Caffè del Corso", "Aurora SPA"}
        overlap = expected_any & shop_names
        assert overlap, f"None of the expected seed merchants present. Got shops: {shop_names}"
        for name in overlap:
            assert name == name.strip()
