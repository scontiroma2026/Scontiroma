"""
Tests for the monthly sales counter feature:
- GET /api/discounts returns `sales_this_month` per discount
- GET /api/merchants/top?limit=3 returns discounts ordered by monthly sales
- GET /api/auth/me returns `has_active_subscription`
- E2E: seed redemptions in current month and verify counters + top ranking
- Regression: filters zone/category/q + percent_off + merchant enrichment
"""
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

import pytest
import requests
from pymongo import MongoClient

# Load env from /app/backend/.env if not present (tests may run without exports)
_ENV = Path("/app/backend/.env")
if _ENV.exists():
    for line in _ENV.read_text().splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else "https://deal-bundle.preview.emergentagent.com"
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

CLIENT_EMAIL = "francesco@gmail.com"
CLIENT_PASS = "francesco123"


@pytest.fixture(scope="module")
def db():
    return MongoClient(MONGO_URL)[DB_NAME]


@pytest.fixture(scope="module")
def client_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": CLIENT_EMAIL, "password": CLIENT_PASS}, timeout=15)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def anon_session():
    return requests.Session()


def _month_start_iso():
    now = datetime.now(timezone.utc)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()


# ---------- /auth/me ----------
class TestAuthMeSubscriptionFlag:
    def test_subscribed_client_has_flag_true(self, client_session):
        r = client_session.get(f"{BASE_URL}/api/auth/me", timeout=10)
        assert r.status_code == 200
        u = r.json()["user"]
        assert u["email"] == CLIENT_EMAIL
        assert u.get("has_active_subscription") is True

    def test_anon_no_access(self, anon_session):
        r = anon_session.get(f"{BASE_URL}/api/auth/me", timeout=10)
        assert r.status_code in (401, 403)

    def test_non_subscribed_client_flag_false(self, db):
        # register a fresh client without subscription
        email = f"TEST_nosub_{uuid.uuid4().hex[:8]}@scontiroma.it"
        s = requests.Session()
        r = s.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": "pass1234", "name": "TEST NoSub", "role": "client",
        }, timeout=15)
        assert r.status_code in (200, 201), r.text
        try:
            r = s.get(f"{BASE_URL}/api/auth/me", timeout=10)
            assert r.status_code == 200
            assert r.json()["user"].get("has_active_subscription") is False
        finally:
            db.users.delete_one({"email": email})


# ---------- /discounts sales_this_month + regression ----------
class TestDiscountsSalesField:
    def test_list_contains_sales_field(self, anon_session):
        r = anon_session.get(f"{BASE_URL}/api/discounts", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "discounts" in data
        assert len(data["discounts"]) > 0, "seed discounts expected"
        for d in data["discounts"]:
            assert "sales_this_month" in d, f"missing sales_this_month in {d.get('id')}"
            assert isinstance(d["sales_this_month"], int)
            assert d["sales_this_month"] >= 0
            # Regression: merchant enrichment + percent_off + locked_this_month
            assert "merchant" in d and d["merchant"].get("shop_name")
            assert "zone" in d["merchant"] and "category" in d["merchant"]
            assert "percent_off" in d and isinstance(d["percent_off"], int)
            assert "locked_this_month" in d

    def test_filters_zone_category_q_still_work(self, anon_session):
        r = anon_session.get(f"{BASE_URL}/api/discounts", timeout=15).json()["discounts"]
        assert r
        pick = r[0]
        z = pick["merchant"]["zone"]
        c = pick["merchant"]["category"]
        r_z = anon_session.get(f"{BASE_URL}/api/discounts", params={"zone": z}, timeout=15).json()["discounts"]
        assert all(x["merchant"]["zone"] == z for x in r_z)
        r_c = anon_session.get(f"{BASE_URL}/api/discounts", params={"category": c}, timeout=15).json()["discounts"]
        assert all(x["merchant"]["category"] == c for x in r_c)
        term = pick["title"].split()[0][:4]
        r_q = anon_session.get(f"{BASE_URL}/api/discounts", params={"q": term}, timeout=15).json()["discounts"]
        assert len(r_q) >= 1


# ---------- /merchants/top ----------
class TestMerchantsTop:
    def test_basic_shape(self, anon_session):
        r = anon_session.get(f"{BASE_URL}/api/merchants/top?limit=3", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "merchants" in data
        assert isinstance(data["merchants"], list)
        assert len(data["merchants"]) <= 3
        for m in data["merchants"]:
            # each item is an enriched discount
            assert m.get("id") and m.get("merchant") and m["merchant"].get("shop_name")
            assert "sales_this_month" in m and m["sales_this_month"] >= 1

    def test_limit_bounds(self, anon_session):
        r = anon_session.get(f"{BASE_URL}/api/merchants/top?limit=1", timeout=15)
        assert r.status_code == 200
        assert len(r.json()["merchants"]) <= 1
        # too large gets capped
        r = anon_session.get(f"{BASE_URL}/api/merchants/top?limit=999", timeout=15)
        assert r.status_code == 200


# ---------- E2E: seed redemptions and verify counter + ranking ----------
class TestE2ESalesCounter:
    def test_seed_redemptions_updates_counter_and_ranking(self, db, anon_session):
        month_start = _month_start_iso()
        # Choose a discount that currently has fewer sales than the current top
        top_before = anon_session.get(f"{BASE_URL}/api/merchants/top?limit=3", timeout=15).json()["merchants"]
        current_top_sales = top_before[0]["sales_this_month"] if top_before else 0
        target_sales = current_top_sales + 5  # ensure ranking bump

        all_discs = anon_session.get(f"{BASE_URL}/api/discounts", timeout=15).json()["discounts"]
        # pick a discount not currently #1
        top_id = top_before[0]["id"] if top_before else None
        candidate = next((d for d in all_discs if d["id"] != top_id), all_discs[0])
        disc_id = candidate["id"]
        merch_id = candidate["merchant"]["id"]

        inserted_ids = []
        try:
            for _ in range(target_sales):
                rid = f"TEST_{uuid.uuid4().hex}"
                db.redemptions.insert_one({
                    "id": rid,
                    "discount_id": disc_id,
                    "merchant_id": merch_id,
                    "user_id": f"TEST_user_{uuid.uuid4().hex[:6]}",
                    "code": uuid.uuid4().hex[:8].upper(),
                    "status": "redeemed",
                    "created_at": month_start,
                    "redeemed_at": datetime.now(timezone.utc).isoformat(),
                    "month_key": datetime.now(timezone.utc).strftime("%Y-%m"),
                })
                inserted_ids.append(rid)

            # Also insert one OLD redemption to prove month-boundary filtering
            old_rid = f"TEST_{uuid.uuid4().hex}"
            db.redemptions.insert_one({
                "id": old_rid,
                "discount_id": disc_id,
                "merchant_id": merch_id,
                "user_id": f"TEST_user_old",
                "code": "OLD00000",
                "status": "redeemed",
                "created_at": "2024-01-01T00:00:00+00:00",
                "redeemed_at": "2024-01-15T12:00:00+00:00",
                "month_key": "2024-01",
            })
            inserted_ids.append(old_rid)

            # And one PENDING (must be ignored)
            pending_rid = f"TEST_{uuid.uuid4().hex}"
            db.redemptions.insert_one({
                "id": pending_rid,
                "discount_id": disc_id,
                "merchant_id": merch_id,
                "user_id": "TEST_user_pending",
                "code": "PEND0000",
                "status": "pending",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "redeemed_at": None,
                "month_key": datetime.now(timezone.utc).strftime("%Y-%m"),
            })
            inserted_ids.append(pending_rid)

            # Verify /discounts reflects EXACT count (only this-month, redeemed)
            all_after = anon_session.get(f"{BASE_URL}/api/discounts", timeout=15).json()["discounts"]
            found = next(d for d in all_after if d["id"] == disc_id)
            # baseline sales for this discount before was included in aggregate; recompute delta
            expected = db.redemptions.count_documents({
                "discount_id": disc_id,
                "status": "redeemed",
                "redeemed_at": {"$gte": month_start},
            })
            assert found["sales_this_month"] == expected, f"{found['sales_this_month']} != {expected}"
            assert found["sales_this_month"] >= target_sales

            # /merchants/top must place this discount #1
            top_after = anon_session.get(f"{BASE_URL}/api/merchants/top?limit=3", timeout=15).json()["merchants"]
            assert top_after, "top should not be empty"
            assert top_after[0]["id"] == disc_id, f"expected {disc_id} on top, got {top_after[0]['id']}"
            # Ordered desc
            sales_seq = [m["sales_this_month"] for m in top_after]
            assert sales_seq == sorted(sales_seq, reverse=True)
        finally:
            if inserted_ids:
                db.redemptions.delete_many({"id": {"$in": inserted_ids}})
