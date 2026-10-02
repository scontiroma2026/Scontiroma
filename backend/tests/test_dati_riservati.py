"""I dati che il server restituisce sull'utente (/auth/me, login, registrazione) non devono
contenere hash, token monouso o contatori di sicurezza (test unitari, senza database)."""
import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "test_unit")
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")

import server  # noqa: E402

UTENTE = {
    "_id": "oid", "id": "u1", "email": "a@example.com", "name": "A", "role": "client",
    "password_hash": "h", "pin_hash": "h", "pin_set": True, "biometric_enabled": True,
    "reset_token": "t", "reset_expires": "x", "reset_req_log": [],
    "pin_reset_code_hash": "h", "pin_reset_expires": "x", "pin_reset_attempts": 1, "pin_reset_req_log": [],
    "login_failed_attempts": 2, "pin_failed_attempts": 1, "recovery_failed_attempts": 0,
    "master_hash": "h", "recovery_id_hash": "h",
    "webauthn_user_id": "w", "webauthn_credentials": [{"credential_id": "c1"}, {"credential_id": "c2"}],
}


def test_nessun_campo_riservato():
    out = server.sanitize_user(UTENTE)
    for k in server._PRIVATE_USER_FIELDS:
        assert k not in out, k


def test_restano_i_dati_utili_alla_pagina_sicurezza():
    out = server.sanitize_user(UTENTE)
    assert out["pin_set"] is True
    assert out["biometric_devices"] == 2
    assert out["email"] == "a@example.com" and out["role"] == "client"


def test_originale_non_modificato():
    server.sanitize_user(UTENTE)
    assert "pin_hash" in UTENTE and "webauthn_credentials" in UTENTE
