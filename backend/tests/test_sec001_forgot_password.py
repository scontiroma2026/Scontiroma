"""
SEC-001 Regression Test — /api/auth/forgot must NOT leak reset_token/reset_link.
"""
import os
import pytest
import requests
from motor.motor_asyncio import AsyncIOMotorClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback to frontend/.env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")
if not MONGO_URL or not DB_NAME:
    with open("/app/backend/.env") as f:
        for line in f:
            if line.startswith("MONGO_URL=") and not MONGO_URL:
                MONGO_URL = line.split("=", 1)[1].strip().strip('"')
            if line.startswith("DB_NAME=") and not DB_NAME:
                DB_NAME = line.split("=", 1)[1].strip().strip('"')

EXISTING_EMAIL = os.environ.get("TEST_CLIENT_EMAIL", "francesco@gmail.com")
EXISTING_PASSWORD = os.environ.get("TEST_CLIENT_PASSWORD", "francesco123")
NONEXISTENT_EMAIL = "random_nonexistent_99213@example.com"


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def test_forgot_existing_email_no_token_leak(api):
    r = api.post(f"{BASE_URL}/api/auth/forgot", json={"email": EXISTING_EMAIL})
    assert r.status_code == 200, r.text
    data = r.json()
    # Only ok + message expected
    assert data.get("ok") is True
    assert "message" in data and isinstance(data["message"], str)
    # Critical: no sensitive fields
    assert "reset_token" not in data, f"LEAK: reset_token in response: {data}"
    assert "reset_link" not in data, f"LEAK: reset_link in response: {data}"
    assert "token" not in data, f"LEAK: token in response: {data}"
    # No other leaky fields
    unexpected = set(data.keys()) - {"ok", "message"}
    assert not unexpected, f"Unexpected fields in response: {unexpected}"


def test_forgot_nonexistent_email_same_response(api):
    r1 = api.post(f"{BASE_URL}/api/auth/forgot", json={"email": EXISTING_EMAIL})
    r2 = api.post(f"{BASE_URL}/api/auth/forgot", json={"email": NONEXISTENT_EMAIL})
    assert r1.status_code == 200 and r2.status_code == 200
    # Same shape and same content (anti-enumeration)
    assert r1.json() == r2.json(), f"Enumeration risk: {r1.json()} != {r2.json()}"
    # Ensure no leak on nonexistent path either
    data2 = r2.json()
    assert "reset_token" not in data2
    assert "reset_link" not in data2


@pytest.mark.asyncio
async def test_reset_token_persisted_in_db(api):
    # Trigger forgot
    r = api.post(f"{BASE_URL}/api/auth/forgot", json={"email": EXISTING_EMAIL})
    assert r.status_code == 200
    # Query MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    try:
        db = client[DB_NAME]
        user = await db.users.find_one({"email": EXISTING_EMAIL})
        assert user is not None, "Test user not found in DB"
        assert user.get("reset_token"), "reset_token was not persisted in DB"
        assert user.get("reset_expires"), "reset_expires was not persisted"
        assert isinstance(user["reset_token"], str) and len(user["reset_token"]) > 20
    finally:
        client.close()


@pytest.mark.asyncio
async def test_reset_with_valid_token_from_db_works(api):
    # Trigger to ensure fresh token
    api.post(f"{BASE_URL}/api/auth/forgot", json={"email": EXISTING_EMAIL})
    client = AsyncIOMotorClient(MONGO_URL)
    try:
        db = client[DB_NAME]
        user = await db.users.find_one({"email": EXISTING_EMAIL})
        token = user["reset_token"]
    finally:
        client.close()

    # Reset password to same value (idempotent for regression)
    r = api.post(f"{BASE_URL}/api/auth/reset", json={
        "token": token, "new_password": EXISTING_PASSWORD,
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("ok") is True
    assert data.get("email") == EXISTING_EMAIL

    # Confirm original login still works
    login = api.post(f"{BASE_URL}/api/auth/login", json={
        "email": EXISTING_EMAIL, "password": EXISTING_PASSWORD,
    })
    assert login.status_code == 200, login.text


def test_reset_with_invalid_token_fails(api):
    r = api.post(f"{BASE_URL}/api/auth/reset", json={
        "token": "this-is-not-a-real-token-xxxxx", "new_password": "whatever123",
    })
    # Server currently uses 400 for invalid; accept 400/401
    assert r.status_code in (400, 401), r.text


def test_login_regression_still_works(api):
    r = api.post(f"{BASE_URL}/api/auth/login", json={
        "email": EXISTING_EMAIL, "password": EXISTING_PASSWORD,
    })
    assert r.status_code == 200, r.text
    body = r.json()
    assert "user" in body
    assert body["user"]["email"] == EXISTING_EMAIL
