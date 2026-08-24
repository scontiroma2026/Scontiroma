"""Iteration 4 backend tests: approval workflow, monthly redemption enforcement,
rotating QR (20s + URL), public /qr/verify auto-consume, admin pending/approve/reject/force-edit."""
import os
import time
import uuid
import hmac as hmac_lib
import hashlib
from datetime import datetime, timezone
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://deal-bundle.preview.emergentagent.com").rstrip("/")
API = f"{BASE}/api"
MASTER_PW = os.environ.get("TEST_ADMIN_MASTER_PASSWORD", "ValeRoma2026")
JWT_SECRET = os.environ.get(
    "TEST_JWT_SECRET",
    "7bf1620c584ce701c6eaa055faa0d7599172631b3a4203ad6d68e950d50b1e6b",
)
FRONTEND_URL = "https://deal-bundle.preview.emergentagent.com"


def month_key():
    return datetime.now(timezone.utc).strftime("%Y-%m")


def current_slot(rot=20):
    return int(datetime.now(timezone.utc).timestamp()) // rot


def rotating_hmac(code, slot):
    msg = f"{code}:{slot}".encode()
    return hmac_lib.new(JWT_SECRET.encode(), msg, hashlib.sha256).hexdigest()[:12]


def login(email, password):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"login {email}: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def admin_session():
    s = login("admin@scontiroma.it", "admin123")
    r = s.post(f"{API}/admin/verify-master", json={"password": MASTER_PW})
    assert r.status_code == 200
    tok = r.json()["token"]
    s.headers.update({"X-Admin-Master": tok})
    return s


@pytest.fixture(scope="module")
def fresh_merchant():
    email = f"TEST_merch_{uuid.uuid4().hex[:8]}@t.it"
    s = requests.Session()
    r = s.post(f"{API}/auth/register", json={
        "email": email, "password": "merchant123", "name": "Test Merchant",
        "role": "merchant", "shop_name": f"TEST Shop {email[:6]}",
        "zone": "Trastevere", "category": "Ristorante",
    })
    assert r.status_code == 200, r.text
    return {"session": s, "email": email}


@pytest.fixture(scope="module")
def fresh_client():
    email = f"TEST_cli_{uuid.uuid4().hex[:8]}@t.it"
    s = requests.Session()
    r = s.post(f"{API}/auth/register", json={
        "email": email, "password": "cliente123", "name": "Test Client",
        "role": "client",
    })
    assert r.status_code == 200, r.text
    # subscribe
    r = s.post(f"{API}/subscription/subscribe", json={"plan": "monthly"})
    assert r.status_code == 200, r.text
    return {"session": s, "email": email}


# ---------- Discount approval flow ----------

class TestApprovalFlow:

    def test_merchant_creates_pending(self, fresh_merchant):
        s = fresh_merchant["session"]
        r = s.post(f"{API}/merchants/me/discount", json={
            "title": "TEST Pizza -30%", "description": "d",
            "original_price": 20, "discounted_price": 14,
            "terms": "t", "active": True,
        })
        assert r.status_code == 200, r.text
        d = r.json()["discount"]
        assert d["approval_status"] == "pending"
        assert d["locked_month"] is None
        assert d["locked_this_month"] is False
        fresh_merchant["discount_id"] = d["id"]

    def test_pending_not_in_public_list(self, fresh_merchant):
        did = fresh_merchant["discount_id"]
        r = requests.get(f"{API}/discounts")
        assert r.status_code == 200
        ids = [x["id"] for x in r.json()["discounts"]]
        assert did not in ids

    def test_get_merchant_discount_shows_fields(self, fresh_merchant):
        s = fresh_merchant["session"]
        r = s.get(f"{API}/merchants/me/discount")
        assert r.status_code == 200
        d = r.json()["discount"]
        assert d["approval_status"] == "pending"
        assert "locked_this_month" in d

    def test_pending_in_admin_pending_list(self, admin_session, fresh_merchant):
        r = admin_session.get(f"{API}/admin/discounts/pending")
        assert r.status_code == 200
        ids = [x["id"] for x in r.json()["discounts"]]
        assert fresh_merchant["discount_id"] in ids

    def test_admin_approve(self, admin_session, fresh_merchant):
        did = fresh_merchant["discount_id"]
        r = admin_session.post(f"{API}/admin/discounts/{did}/approve")
        assert r.status_code == 200, r.text
        d = r.json()["discount"]
        assert d["approval_status"] == "approved"
        assert d["locked_month"] == month_key()
        # now in public list
        r2 = requests.get(f"{API}/discounts")
        ids = [x["id"] for x in r2.json()["discounts"]]
        assert did in ids

    def test_merchant_edit_locked_returns_423(self, fresh_merchant):
        s = fresh_merchant["session"]
        r = s.post(f"{API}/merchants/me/discount", json={
            "title": "TEST changed", "description": "d",
            "original_price": 20, "discounted_price": 10,
            "terms": "t", "active": True,
        })
        assert r.status_code == 423, r.text
        assert "attiva" in r.json().get("detail", "").lower()

    def test_force_edit_unlocks(self, admin_session, fresh_merchant):
        did = fresh_merchant["discount_id"]
        r = admin_session.post(f"{API}/admin/discounts/{did}/force-edit")
        assert r.status_code == 200
        # merchant can now modify -> back to pending
        s = fresh_merchant["session"]
        r2 = s.post(f"{API}/merchants/me/discount", json={
            "title": "TEST after force edit", "description": "d",
            "original_price": 20, "discounted_price": 12,
            "terms": "t", "active": True,
        })
        assert r2.status_code == 200
        assert r2.json()["discount"]["approval_status"] == "pending"

    def test_reject_and_resubmit(self, admin_session, fresh_merchant):
        did = fresh_merchant["discount_id"]
        r = admin_session.post(f"{API}/admin/discounts/{did}/reject",
                               json={"reason": "Prezzo poco chiaro"})
        assert r.status_code == 200
        # merchant sees rejected
        s = fresh_merchant["session"]
        d = s.get(f"{API}/merchants/me/discount").json()["discount"]
        assert d["approval_status"] == "rejected"
        assert d["approval_note"] == "Prezzo poco chiaro"
        # resubmit -> pending
        r2 = s.post(f"{API}/merchants/me/discount", json={
            "title": "TEST resubmit", "description": "d",
            "original_price": 20, "discounted_price": 15,
            "terms": "t", "active": True,
        })
        assert r2.status_code == 200
        assert r2.json()["discount"]["approval_status"] == "pending"


# ---------- Redemption monthly enforcement + rotating QR + public verify ----------

class TestRedemptionAndQR:

    @pytest.fixture(scope="class")
    def approved_setup(self, admin_session):
        """Create merchant + approved discount + subscribed client."""
        # merchant
        me = f"TEST_rm_{uuid.uuid4().hex[:8]}@t.it"
        ms = requests.Session()
        assert ms.post(f"{API}/auth/register", json={
            "email": me, "password": "merchant123", "name": "M",
            "role": "merchant", "shop_name": f"TEST Redemp {me[:6]}",
            "zone": "Monti", "category": "Bar & Caffè",
        }).status_code == 200
        assert ms.post(f"{API}/merchants/me/discount", json={
            "title": "TEST redemp -50%", "description": "d",
            "original_price": 10, "discounted_price": 5,
            "terms": "t", "active": True,
        }).status_code == 200
        d = ms.get(f"{API}/merchants/me/discount").json()["discount"]
        did = d["id"]
        # approve
        assert admin_session.post(f"{API}/admin/discounts/{did}/approve").status_code == 200
        # client
        ce = f"TEST_rc_{uuid.uuid4().hex[:8]}@t.it"
        cs = requests.Session()
        assert cs.post(f"{API}/auth/register", json={
            "email": ce, "password": "cliente123", "name": "C", "role": "client",
        }).status_code == 200
        assert cs.post(f"{API}/subscription/subscribe", json={"plan": "monthly"}).status_code == 200
        return {"merchant_session": ms, "client_session": cs, "discount_id": did}

    def test_create_redemption_first_time(self, approved_setup):
        cs = approved_setup["client_session"]
        did = approved_setup["discount_id"]
        r = cs.post(f"{API}/redemptions/create/{did}")
        assert r.status_code == 200, r.text
        red = r.json()["redemption"]
        assert red["month_key"] == month_key()
        assert red["status"] == "pending"
        approved_setup["redemption"] = red

    def test_create_redemption_reuses_pending(self, approved_setup):
        cs = approved_setup["client_session"]
        did = approved_setup["discount_id"]
        r = cs.post(f"{API}/redemptions/create/{did}")
        assert r.status_code == 200
        assert r.json()["redemption"]["id"] == approved_setup["redemption"]["id"]

    def test_status_endpoint(self, approved_setup):
        cs = approved_setup["client_session"]
        did = approved_setup["discount_id"]
        r = cs.get(f"{API}/redemptions/discount/{did}/status")
        assert r.status_code == 200
        j = r.json()
        assert j["status"] == "pending"
        assert j["used_this_month"] is False

    def test_token_returns_url_and_20s(self, approved_setup):
        cs = approved_setup["client_session"]
        rid = approved_setup["redemption"]["id"]
        r = cs.get(f"{API}/redemptions/{rid}/token")
        assert r.status_code == 200
        j = r.json()
        assert j["window_sec"] == 20
        assert j["qr_value"].startswith(FRONTEND_URL + "/qr/")
        # dot separated
        tail = j["qr_value"].split("/qr/", 1)[1]
        parts = tail.split(".")
        assert len(parts) == 3, tail
        assert parts[0] == j["code"]
        assert parts[1] == str(j["slot"])
        assert parts[2] == j["token"]
        # verify hmac matches expected
        expected = rotating_hmac(j["code"], j["slot"])
        assert expected == j["token"]
        approved_setup["qr"] = j

    def test_public_verify_valid_and_consume(self, approved_setup):
        qr = approved_setup["qr"]
        token = f"{qr['code']}.{qr['slot']}.{qr['token']}"
        # PUBLIC: no cookies/auth
        r = requests.get(f"{API}/qr/verify", params={"token": token})
        assert r.status_code == 200
        j = r.json()
        assert j["valid"] is True, j
        assert j["shop_name"].startswith("TEST Redemp")
        assert j["discount_title"] == "TEST redemp -50%"
        assert j["discount_percent"] == 50

    def test_public_verify_second_call_still_valid_recent(self, approved_setup):
        qr = approved_setup["qr"]
        token = f"{qr['code']}.{qr['slot']}.{qr['token']}"
        # need fresh slot if changed - regenerate if too old
        cs = approved_setup["client_session"]
        rid = approved_setup["redemption"]["id"]
        j2 = cs.get(f"{API}/redemptions/{rid}/token").json()
        tok2 = f"{j2['code']}.{j2['slot']}.{j2['token']}"
        r = requests.get(f"{API}/qr/verify", params={"token": tok2})
        assert r.status_code == 200
        assert r.json()["valid"] is True  # recently redeemed still shows valid

    def test_public_verify_tampered_hmac(self, approved_setup):
        qr = approved_setup["qr"]
        bad = f"{qr['code']}.{qr['slot']}.deadbeef1234"
        r = requests.get(f"{API}/qr/verify", params={"token": bad})
        assert r.status_code == 200
        j = r.json()
        assert j["valid"] is False
        assert "manomes" in j["reason"].lower() or "non valid" in j["reason"].lower()

    def test_public_verify_expired_slot(self, approved_setup):
        qr = approved_setup["qr"]
        old_slot = current_slot() - 5
        bad_tok = rotating_hmac(qr["code"], old_slot)
        token = f"{qr['code']}.{old_slot}.{bad_tok}"
        r = requests.get(f"{API}/qr/verify", params={"token": token})
        j = r.json()
        assert j["valid"] is False
        assert "scadut" in j["reason"].lower()

    def test_status_after_consume(self, approved_setup):
        cs = approved_setup["client_session"]
        did = approved_setup["discount_id"]
        j = cs.get(f"{API}/redemptions/discount/{did}/status").json()
        assert j["used_this_month"] is True
        assert j["status"] == "redeemed"

    def test_second_redemption_blocked_409(self, approved_setup):
        cs = approved_setup["client_session"]
        did = approved_setup["discount_id"]
        r = cs.post(f"{API}/redemptions/create/{did}")
        assert r.status_code == 409, r.text
        assert "utilizzato" in r.json().get("detail", "").lower()


# ---------- Public discounts list only returns approved ----------

class TestPublicList:
    def test_public_list_all_approved(self):
        r = requests.get(f"{API}/discounts")
        assert r.status_code == 200
        for d in r.json()["discounts"]:
            assert d.get("approval_status", "approved") == "approved"
            assert d.get("active", True) is True
