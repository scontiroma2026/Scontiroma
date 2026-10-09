"""Widget «Stato dei servizi»: riga «Indirizzi (LocationIQ)». Nessuna rete, chiave finta."""
import asyncio
import json
import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "test_unit")
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")

import pytest  # noqa: E402

import server  # noqa: E402
from test_locationiq import CHIAVE_FINTA, FintaRisposta, FintoClient, hosts  # noqa: E402,F401
from test_locationiq import ambiente  # noqa: E402,F401  (fixture autouse)


class FintoDb:
    async def command(self, _c):
        return {"ok": 1}


@pytest.fixture
def salute(monkeypatch):
    """Esegue admin_health con DB, Stripe, PayPal e Resend finti."""
    import email_service
    monkeypatch.setattr(server, "db", FintoDb())
    monkeypatch.setattr(server.stripe.Balance, "retrieve", staticmethod(lambda: {}))
    monkeypatch.setattr(server.paypal_service, "is_configured", lambda: False)
    monkeypatch.setattr(email_service, "_configured", False)
    return lambda: asyncio.run(server.admin_health(user={}))


def test_senza_chiave_avviso_e_nessuna_richiesta(salute):
    r = salute()["locationiq"]
    assert r == {"ok": False, "warning": True, "error": "non configurato (si usa Nominatim)"}
    assert FintoClient.chiamate == []


def test_con_chiave_che_risponde(salute, monkeypatch):
    monkeypatch.setenv("LOCATIONIQ_API_KEY", CHIAVE_FINTA)
    FintoClient.risposte["locationiq"] = FintaRisposta(200, [{"lat": "41.86", "lon": "12.48"}])
    out = salute()
    r = out["locationiq"]
    assert r["ok"] is True and isinstance(r["ms"], int)
    assert hosts() == ["locationiq"]  # una sola richiesta
    params = FintoClient.chiamate[0][2]
    assert params["q"] == "Via Ostiense 100, Roma" and params["limit"] == 1
    assert CHIAVE_FINTA not in json.dumps(out)


@pytest.mark.parametrize("status,testo", [(401, "chiave rifiutata"), (403, "chiave rifiutata"), (429, "limite raggiunto"), (500, "non risponde")])
def test_con_chiave_rifiutata_o_limite(salute, monkeypatch, caplog, status, testo):
    monkeypatch.setenv("LOCATIONIQ_API_KEY", CHIAVE_FINTA)
    FintoClient.risposte["locationiq"] = FintaRisposta(status)
    out = salute()
    assert out["locationiq"] == {"ok": False, "error": testo}
    assert CHIAVE_FINTA not in json.dumps(out)
    assert CHIAVE_FINTA not in caplog.text


def test_in_pausa_non_fa_richieste_e_dice_il_motivo(salute, monkeypatch):
    monkeypatch.setenv("LOCATIONIQ_API_KEY", CHIAVE_FINTA)
    FintoClient.risposte["locationiq"] = FintaRisposta(401)
    salute()
    FintoClient.chiamate.clear()
    assert salute()["locationiq"] == {"ok": False, "error": "chiave rifiutata"}
    assert FintoClient.chiamate == []


def test_errore_di_rete(salute, monkeypatch):
    monkeypatch.setenv("LOCATIONIQ_API_KEY", CHIAVE_FINTA)
    FintoClient.risposte["locationiq"] = RuntimeError(f"timeout {CHIAVE_FINTA}")
    out = salute()
    assert out["locationiq"] == {"ok": False, "error": "non risponde"}
    assert CHIAVE_FINTA not in json.dumps(out)
