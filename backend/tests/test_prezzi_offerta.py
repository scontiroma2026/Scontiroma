"""Offerte: prezzi positivi e prezzo scontato minore del prezzo pieno (test senza database)."""
import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "test_unit")
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")

import pytest  # noqa: E402
from pydantic import ValidationError  # noqa: E402

import server  # noqa: E402


def offerta(o, s):
    return server.DiscountIn(title="T", description="D", original_price=o, discounted_price=s)


def test_sconto_valido():
    assert offerta(40, 20).discounted_price == 20


@pytest.mark.parametrize("o,s", [(10, 20), (20, 20), (0, 0), (-5, -10), (20, 0)])
def test_prezzi_non_validi(o, s):
    with pytest.raises(ValidationError):
        offerta(o, s)


def test_sconto_senza_prezzi_rifiutato():
    with pytest.raises(ValidationError):
        server.DiscountIn(title="T", description="D")


def test_omaggio_senza_prezzi_valido_e_prezzi_tolti():
    o = server.DiscountIn(title="T", description="D", offer_type="omaggio", original_price=30, discounted_price=10)
    assert o.offer_type == "omaggio" and o.original_price is None and o.discounted_price is None
