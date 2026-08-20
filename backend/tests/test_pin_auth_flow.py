"""Test PIN 6-digit auth + forgot/reset OTP flow (iteration 9)."""
import os
import time
import asyncio
import pytest
import requests
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback read from frontend/.env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break

MONGO_URL = os.environ.get("MONGO_URL") or open("/app/backend/.env").read().split("MONGO_URL=")[1].split("\n")[0].strip()
DB_NAME = os.environ.get("DB_NAME") or open("/app/backend/.env").read().split("DB_NAME=")[1].split("\n")[0].strip()

CLIENT_EMAIL = "francesco@gmail.com"
CLIENT_PASSWORD = "francesco123"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": CLIENT_EMAIL, "password": CLIENT_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]


def run(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


# ---------- Register new client with concatenated name ----------
def test_register_new_client_with_full_name():
    ts = int(time.time())
    email = f"test_pin_{ts}@example.com"
    r = requests.post(f"{BASE_URL}/api/auth/register", json={
        "email": email, "password": "password123",
        "name": "Mario Rossi", "role": "client"
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["user"]["email"] == email
    assert data["user"]["name"] == "Mario Rossi"
    assert data["user"]["role"] == "client"


# ---------- PIN validation ----------
def test_pin_4_digits_rejected_422(session):
    r = session.post(f"{BASE_URL}/api/auth/pin", json={"pin": "1234"})
    assert r.status_code == 422, r.text


def test_pin_5_digits_rejected_422(session):
    r = session.post(f"{BASE_URL}/api/auth/pin", json={"pin": "12345"})
    assert r.status_code == 422, r.text


def test_pin_6_digits_accepted_200(session):
    r = session.post(f"{BASE_URL}/api/auth/pin", json={"pin": "123456"})
    assert r.status_code == 200, r.text
    assert r.json().get("ok") is True


def test_pin_6_non_digit_rejected_422(session):
    r = session.post(f"{BASE_URL}/api/auth/pin", json={"pin": "12ab56"})
    assert r.status_code == 422, r.text


def test_pin_login_success():
    """Uses the PIN just set (123456) via pin-login endpoint."""
    r = requests.post(f"{BASE_URL}/api/auth/pin-login", json={
        "email": CLIENT_EMAIL, "pin": "123456"
    })
    assert r.status_code == 200, r.text
    assert r.json()["user"]["email"] == CLIENT_EMAIL


def test_pin_login_wrong_pin_401():
    r = requests.post(f"{BASE_URL}/api/auth/pin-login", json={
        "email": CLIENT_EMAIL, "pin": "999999"
    })
    assert r.status_code == 401


def test_pin_login_4_digits_rejected_422():
    r = requests.post(f"{BASE_URL}/api/auth/pin-login", json={
        "email": CLIENT_EMAIL, "pin": "1234"
    })
    assert r.status_code == 422


# ---------- Forgot PIN ----------
def test_pin_forgot_existing_email_returns_ok_and_stores_hash(db):
    r = requests.post(f"{BASE_URL}/api/auth/pin-forgot", json={"email": CLIENT_EMAIL})
    assert r.status_code == 200
    assert r.json().get("ok") is True
    # Check DB has hash + expiry
    u = run(db.users.find_one({"email": CLIENT_EMAIL}))
    assert u is not None
    assert u.get("pin_reset_code_hash"), "pin_reset_code_hash not stored"
    assert u.get("pin_reset_expires"), "pin_reset_expires not stored"
    # hash should start with bcrypt marker
    assert u["pin_reset_code_hash"].startswith("$2"), "hash not bcrypt"


def test_pin_forgot_unknown_email_returns_ok_no_enumeration():
    r = requests.post(f"{BASE_URL}/api/auth/pin-forgot", json={"email": "nonexistent_xyz@example.com"})
    assert r.status_code == 200
    assert r.json().get("ok") is True


# ---------- Reset PIN edge cases ----------
def test_pin_reset_wrong_code_401(db):
    # Ensure a fresh forgot request exists
    requests.post(f"{BASE_URL}/api/auth/pin-forgot", json={"email": CLIENT_EMAIL})
    r = requests.post(f"{BASE_URL}/api/auth/pin-reset", json={
        "email": CLIENT_EMAIL, "code": "000000", "new_pin": "654321"
    })
    assert r.status_code == 401, r.text
    assert "Codice non valido" in r.json().get("detail", "")


def test_pin_reset_no_request_active_400(db):
    """After clearing the reset hash, calling reset should return 400."""
    run(db.users.update_one({"email": CLIENT_EMAIL},
                             {"$unset": {"pin_reset_code_hash": "", "pin_reset_expires": ""}}))
    r = requests.post(f"{BASE_URL}/api/auth/pin-reset", json={
        "email": CLIENT_EMAIL, "code": "111111", "new_pin": "654321"
    })
    assert r.status_code == 400, r.text
    assert "Nessuna richiesta" in r.json().get("detail", "")


# ---------- Full E2E reset with known code (inject hash) ----------
def test_pin_reset_full_flow_success(db):
    """
    1) call forgot to make sure reset window is open
    2) inject known code hash into Mongo
    3) call reset with that code → 200
    4) verify pin_reset_code_hash removed & pin-login works with new pin
    """
    # 1) trigger forgot
    r = requests.post(f"{BASE_URL}/api/auth/pin-forgot", json={"email": CLIENT_EMAIL})
    assert r.status_code == 200

    # 2) inject hash of a known code
    known_code = "424242"
    known_hash = bcrypt.hashpw(known_code.encode(), bcrypt.gensalt()).decode()
    run(db.users.update_one({"email": CLIENT_EMAIL}, {"$set": {"pin_reset_code_hash": known_hash}}))

    # 3) reset with correct code
    new_pin = "987654"
    r = requests.post(f"{BASE_URL}/api/auth/pin-reset", json={
        "email": CLIENT_EMAIL, "code": known_code, "new_pin": new_pin
    })
    assert r.status_code == 200, r.text
    assert r.json().get("ok") is True

    # 4) verify hash was unset
    u = run(db.users.find_one({"email": CLIENT_EMAIL}))
    assert "pin_reset_code_hash" not in u or not u.get("pin_reset_code_hash"), "hash not cleared"

    # 5) login with new PIN works
    r = requests.post(f"{BASE_URL}/api/auth/pin-login", json={
        "email": CLIENT_EMAIL, "pin": new_pin
    })
    assert r.status_code == 200, r.text

    # Restore to francesco123 default PIN via new forgot+reset for future runs
    requests.post(f"{BASE_URL}/api/auth/pin-forgot", json={"email": CLIENT_EMAIL})
    known_hash2 = bcrypt.hashpw("123456".encode(), bcrypt.gensalt()).decode()
    run(db.users.update_one({"email": CLIENT_EMAIL}, {"$set": {"pin_reset_code_hash": known_hash2}}))
    requests.post(f"{BASE_URL}/api/auth/pin-reset", json={
        "email": CLIENT_EMAIL, "code": "123456", "new_pin": "123456"
    })


def test_pin_reset_short_code_422(db):
    r = requests.post(f"{BASE_URL}/api/auth/pin-reset", json={
        "email": CLIENT_EMAIL, "code": "1234", "new_pin": "654321"
    })
    assert r.status_code == 422


def test_pin_reset_short_new_pin_422(db):
    r = requests.post(f"{BASE_URL}/api/auth/pin-reset", json={
        "email": CLIENT_EMAIL, "code": "123456", "new_pin": "1234"
    })
    assert r.status_code == 422


# ---------- Stripe webhook regression ----------
def test_stripe_webhook_invalid_signature_400():
    """Webhook must respond 400 (not 500) with invalid signature — no regression."""
    r = requests.post(f"{BASE_URL}/api/stripe/webhook",
                       data='{"type":"noop"}',
                       headers={"Content-Type": "application/json",
                                "stripe-signature": "t=1,v1=invalid"})
    assert r.status_code == 400, f"expected 400 invalid signature, got {r.status_code}: {r.text}"
