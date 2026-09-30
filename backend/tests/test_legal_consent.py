"""
Registrazione e accettazione dei Termini:
- senza legal_accepted il server rifiuta (400) e non crea l'account, per clienti e commercianti;
- con legal_accepted l'account viene creato e consents.legal_version è salvata;
- l'admin creato all'avvio può ancora accedere (non passa dalla registrazione).
"""
import uuid

import pytest
import requests

from _test_config import ADMIN_EMAIL, ADMIN_PASSWORD, API_URL

MERCHANT_FIELDS = {"shop_name": "TEST Negozio", "zone": "Garbatella", "category": "Ristorante", "phone": "+39 06 0000000"}


def _email(tag):
    return f"test_legal_{tag}_{uuid.uuid4().hex[:8]}@example.com"


@pytest.mark.parametrize("role", ["client", "merchant"])
def test_register_without_legal_is_rejected(role):
    email = _email(f"no_{role}")
    body = {"email": email, "password": "password123", "name": "Senza consenso", "role": role}
    if role == "merchant":
        body.update(MERCHANT_FIELDS)
    for extra in ({}, {"legal_accepted": False}):
        r = requests.post(f"{API_URL}/auth/register", json={**body, **extra}, timeout=15)
        assert r.status_code == 400, r.text
        assert "Termini" in r.json().get("detail", "")
    # l'account non esiste: il login fallisce
    r = requests.post(f"{API_URL}/auth/login", json={"email": email, "password": "password123"}, timeout=15)
    assert r.status_code == 401, r.text


@pytest.mark.parametrize("role", ["client", "merchant"])
def test_register_with_legal_saves_version(role):
    body = {"legal_accepted": True, "email": _email(f"ok_{role}"), "password": "password123",
            "name": "Con consenso", "role": role}
    if role == "merchant":
        body.update(MERCHANT_FIELDS)
    r = requests.post(f"{API_URL}/auth/register", json=body, timeout=15)
    assert r.status_code == 200, r.text
    h = {"Authorization": f"Bearer {r.json()['access_token']}"}
    try:
        consents = requests.get(f"{API_URL}/gdpr/export", headers=h, timeout=15).json()["profile"]["consents"]
        assert consents["legal_accepted"] is True
        assert consents["legal_accepted_at"]
        assert consents["legal_version"]  # es. "2026-10" (LEGAL_VERSION in server.py)
    finally:
        requests.delete(f"{API_URL}/gdpr/delete-account", headers=h, timeout=15)


@pytest.mark.skipif(not ADMIN_PASSWORD, reason="TEST_ADMIN_PASSWORD non impostata")
def test_seeded_admin_can_still_log_in():
    r = requests.post(f"{API_URL}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, r.text
