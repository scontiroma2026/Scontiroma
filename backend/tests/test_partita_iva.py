"""Partita IVA dei commercianti alla registrazione: validata (11 cifre + cifra di controllo). Database locale (mongomock)."""
from test_interruttore_abbonamento import run
from server import _partita_iva_valida

BASE = {"password": "secret123", "name": "Referente", "role": "merchant", "shop_name": "Negozio", "zone": "Garbatella",
        "category": "Ristorante", "phone": "+39 06 0000000", "legal_accepted": True, "legal_specific_accepted": True}


def test_validazione():
    assert _partita_iva_valida("12345678903") == "12345678903"
    assert _partita_iva_valida("IT 123 456 789 03") == "12345678903"
    assert _partita_iva_valida("12345678900") is None
    assert _partita_iva_valida("1234") is None
    assert _partita_iva_valida("abcdefghijk") is None
    assert _partita_iva_valida(None) is None


def test_registrazione_commerciante():
    async def body(c):
        r = await c.post("/api/auth/register", json={**BASE, "email": "piva1@example.com", "partita_iva": "12345678900"})
        assert r.status_code == 422
        r = await c.post("/api/auth/register", json={**BASE, "email": "piva2@example.com", "partita_iva": "IT12345678903"})
        assert r.status_code == 200, r.text

    run(body, False)
