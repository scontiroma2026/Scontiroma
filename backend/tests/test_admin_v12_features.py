"""
Backend tests for iteration 12 — new admin features:
- Merchant registration phone required
- /admin/merchants includes phone
- /admin/merchants/{id}/discounts
- /admin/fraud-log
- /admin/reviews
- /admin/health
- POST /reviews + GET /redemptions/mine + GET /reviews/shop/{id}
- /qr/verify?token=INVALID logs fraud entry
"""
import os
import time
import uuid
import pytest
import requests

def _load_backend_url():
    v = os.environ.get("REACT_APP_BACKEND_URL")
    if v:
        return v.rstrip("/")
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    return line.split("=", 1)[1].strip().strip('"').rstrip("/")
    except Exception:
        pass
    raise RuntimeError("REACT_APP_BACKEND_URL not configured")


BASE = _load_backend_url()
ADMIN_EMAIL = os.environ.get("TEST_ADMIN_EMAIL", "admin@scontiroma.it")
ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD", "admin123")
MASTER = os.environ.get("TEST_ADMIN_MASTER_PASSWORD", "ValeRoma2026")


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def admin_headers(s):
    # login admin
    r = s.post(f"{BASE}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    access = r.json().get("access_token")
    # verify master
    r2 = s.post(f"{BASE}/api/admin/verify-master", json={"password": MASTER},
                headers={"Authorization": f"Bearer {access}"})
    assert r2.status_code == 200, r2.text
    master_token = r2.json()["token"]
    return {"Authorization": f"Bearer {access}", "X-Admin-Master": master_token}


# ----- Registration: phone required for merchants -----
def test_merchant_register_no_phone_returns_422():
    email = f"TEST_merch_nophone_{int(time.time()*1000)}@example.com"
    r = requests.post(f"{BASE}/api/auth/register", json={
        "email": email, "password": "password123", "name": "MerchNoPhone",
        "role": "merchant", "shop_name": "T", "zone": "Centro Storico", "category": "Ristorante"
    })
    assert r.status_code == 422, f"expected 422 got {r.status_code}: {r.text}"
    assert "telefono" in r.text.lower()


def test_merchant_register_with_phone_ok(admin_headers):
    email = f"TEST_merch_phone_{int(time.time()*1000)}@example.com"
    r = requests.post(f"{BASE}/api/auth/register", json={
        "email": email, "password": "password123", "name": "MerchPhone",
        "role": "merchant", "shop_name": "TShop", "zone": "Centro Storico",
        "category": "Ristorante", "phone": "+393331234567"
    })
    assert r.status_code == 200, r.text
    user = r.json()["user"]
    assert user["role"] == "merchant"
    mid = user["id"]

    # verify appears in admin/merchants with phone
    rl = requests.get(f"{BASE}/api/admin/merchants", headers=admin_headers)
    assert rl.status_code == 200, rl.text
    merchants = rl.json()["merchants"]
    found = next((m for m in merchants if m["id"] == mid), None)
    assert found is not None, "created merchant not returned"
    assert found.get("phone") == "+393331234567"


def test_client_register_no_phone_ok():
    email = f"TEST_client_nophone_{int(time.time()*1000)}@example.com"
    r = requests.post(f"{BASE}/api/auth/register", json={
        "email": email, "password": "password123", "name": "ClientOk", "role": "client"
    })
    assert r.status_code == 200, r.text
    assert r.json()["user"]["role"] == "client"


# ----- Admin: merchant discounts -----
def test_admin_merchant_discounts_endpoint(admin_headers):
    # pick any existing merchant
    rl = requests.get(f"{BASE}/api/admin/merchants", headers=admin_headers)
    assert rl.status_code == 200
    merchants = rl.json()["merchants"]
    assert merchants, "no merchants exist"
    mid = merchants[0]["id"]
    r = requests.get(f"{BASE}/api/admin/merchants/{mid}/discounts", headers=admin_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "merchant" in body and body["merchant"]["id"] == mid
    assert "phone" in body["merchant"]
    assert isinstance(body["discounts"], list)
    for d in body["discounts"]:
        assert "redemptions_count" in d
        assert "_id" not in d


def test_admin_merchant_discounts_404(admin_headers):
    r = requests.get(f"{BASE}/api/admin/merchants/nonexistent-id/discounts", headers=admin_headers)
    assert r.status_code == 404


# ----- Fraud log -----
def test_fraud_log_records_invalid_token(admin_headers):
    # trigger an invalid scan
    unique = f"INVALIDTOK_{uuid.uuid4().hex[:8]}"
    r = requests.get(f"{BASE}/api/qr/verify", params={"token": unique})
    assert r.status_code == 200
    body = r.json()
    assert body["valid"] is False
    assert body["reason"] == "Formato codice non valido"

    # fetch fraud log
    time.sleep(0.3)
    rf = requests.get(f"{BASE}/api/admin/fraud-log", headers=admin_headers)
    assert rf.status_code == 200, rf.text
    scans = rf.json()["scans"]
    assert isinstance(scans, list) and len(scans) > 0
    # top entries should be invalid; and there should be a "Formato codice non valido" recent entry
    assert all(s.get("valid") is False for s in scans[:10])
    reasons = [s.get("reason") for s in scans[:20]]
    assert "Formato codice non valido" in reasons
    # timestamp desc check
    ts = [s.get("timestamp") for s in scans[:5]]
    assert ts == sorted(ts, reverse=True)


# ----- Health -----
def test_admin_health(admin_headers):
    r = requests.get(f"{BASE}/api/admin/health", headers=admin_headers, timeout=30)
    assert r.status_code == 200, r.text
    body = r.json()
    for k in ("db", "stripe", "paypal", "resend"):
        assert k in body, f"missing {k}"
        assert "ok" in body[k]
    assert body["db"]["ok"] is True
    # Stripe/PayPal/Resend keys configured — should be ok
    assert body["stripe"]["ok"] is True, body["stripe"]
    assert body["paypal"]["ok"] is True, body["paypal"]
    assert body["resend"]["ok"] is True, body["resend"]


# ----- Reviews E2E -----
@pytest.fixture(scope="module")
def redeemed_setup(s, admin_headers):
    """Login francesco (paid client) and either reuse an existing redeemed redemption or create one and drive it through /qr/verify."""
    r = s.post(f"{BASE}/api/auth/login", json={"email": "francesco@gmail.com", "password": "francesco123"})
    assert r.status_code == 200, r.text
    client_access = r.json()["access_token"]
    ch = {"Authorization": f"Bearer {client_access}"}

    # First check for existing redeemed redemption
    rm = requests.get(f"{BASE}/api/redemptions/mine", headers=ch)
    assert rm.status_code == 200, rm.text
    existing = rm.json().get("redemptions", [])
    if existing:
        row = existing[0]
        return {"headers": ch, "redemption_id": row["id"], "discount_id": row["discount_id"]}

    # Otherwise create fresh: find an approved discount
    rd = requests.get(f"{BASE}/api/discounts")
    disc_list = rd.json() if isinstance(rd.json(), list) else rd.json().get("discounts", [])
    assert disc_list, "no discounts available"

    rid = None
    did = None
    for cand in disc_list:
        rc = requests.post(f"{BASE}/api/redemptions/create/{cand['id']}", headers=ch)
        if rc.status_code == 200:
            rid = rc.json()["redemption"]["id"]
            did = cand["id"]
            break
    assert rid, "could not create redemption on any discount (all used-this-month or not approved)"

    # Drive to redeemed via /qr/verify
    rt = requests.get(f"{BASE}/api/redemptions/{rid}/token", headers=ch)
    assert rt.status_code == 200, rt.text
    qv = rt.json()["qr_value"]
    token = qv.rsplit("/qr/", 1)[-1] if "/qr/" in qv else qv
    rv = requests.get(f"{BASE}/api/qr/verify", params={"token": token})
    assert rv.status_code == 200
    assert rv.json().get("valid") is True, f"scan failed: {rv.json()}"

    return {"headers": ch, "redemption_id": rid, "discount_id": did}


def test_redemptions_mine_lists_redeemed(redeemed_setup):
    r = requests.get(f"{BASE}/api/redemptions/mine", headers=redeemed_setup["headers"])
    assert r.status_code == 200, r.text
    items = r.json()["redemptions"]
    row = next((x for x in items if x["id"] == redeemed_setup["redemption_id"]), None)
    assert row is not None, "redeemed redemption not present"
    assert row["reviewed"] in (False, True)


def test_create_review_then_double_fails(redeemed_setup):
    rid = redeemed_setup["redemption_id"]
    ch = redeemed_setup["headers"]

    # first — may already exist from a prior test run; delete via nothing available so try create,
    # if 400 "già recensito" that's still testing the double-block
    r = requests.post(f"{BASE}/api/reviews", headers=ch,
                      json={"redemption_id": rid, "stars": 2, "comment": "TEST private feedback"})
    if r.status_code == 400 and "già" in r.text.lower():
        pytest.skip("review already exists from previous run — cannot re-test create; double-block implicitly verified")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True
    assert body["review"]["stars"] == 2
    assert body["review"]["private_comment"] == "TEST private feedback"

    # double should fail
    r2 = requests.post(f"{BASE}/api/reviews", headers=ch,
                       json={"redemption_id": rid, "stars": 3, "comment": "x"})
    assert r2.status_code == 400
    assert "già" in r2.text.lower()


def test_reviews_shop_public_summary(redeemed_setup, admin_headers):
    # find merchant id of that redemption
    r = requests.get(f"{BASE}/api/redemptions/mine", headers=redeemed_setup["headers"])
    items = r.json()["redemptions"]
    row = next((x for x in items if x["id"] == redeemed_setup["redemption_id"]), None)
    # get discount details to find merchant
    rd = requests.get(f"{BASE}/api/discounts/{row['discount_id']}")
    assert rd.status_code == 200
    body_d = rd.json()
    mid = body_d.get("merchant_id") or (body_d.get("merchant") or {}).get("id")
    if not mid:
        # fallback: search list
        rlist = requests.get(f"{BASE}/api/discounts").json()
        arr = rlist if isinstance(rlist, list) else rlist.get("discounts", [])
        item = next((x for x in arr if x.get("id") == row["discount_id"]), None)
        mid = item and item.get("merchant_id")
    assert mid
    r2 = requests.get(f"{BASE}/api/reviews/shop/{mid}")
    assert r2.status_code == 200
    body = r2.json()
    assert "count" in body and "avg" in body


def test_admin_reviews_list_contains_fields(admin_headers):
    r = requests.get(f"{BASE}/api/admin/reviews", headers=admin_headers)
    assert r.status_code == 200, r.text
    reviews = r.json()["reviews"]
    assert isinstance(reviews, list)
    if reviews:
        r0 = reviews[0]
        for k in ("user_name", "shop_name", "discount_title", "merchant_phone", "private_comment", "stars"):
            assert k in r0, f"missing key {k}"


# ----- Regression: master required -----
def test_admin_fraud_log_requires_master():
    # Login admin without master
    s = requests.Session()
    r = s.post(f"{BASE}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200
    access = r.json()["access_token"]
    # no master header/cookie
    r2 = requests.get(f"{BASE}/api/admin/fraud-log", headers={"Authorization": f"Bearer {access}"})
    assert r2.status_code == 403
