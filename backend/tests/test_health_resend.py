"""Widget Server Health: controllo Resend con chiave «solo invio». Nessuna rete, chiave finta."""
import asyncio
import logging
import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "test_unit")
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")

import httpx  # noqa: E402

import email_service  # noqa: E402
import server  # noqa: E402

CHIAVE_FINTA = "re_FINTA_test_0000000000"


class _Risposta:
    def __init__(self, status, corpo=None):
        self.status_code = status
        self._corpo = corpo

    def json(self):
        if self._corpo is None:
            raise ValueError("non json")
        return self._corpo


def _client(risposta=None, errore=None):
    class _C:
        def __init__(self, *a, **k):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *a):
            return False

        async def get(self, url, headers=None):
            if errore:
                raise errore
            return risposta
    return _C


def _esegui(monkeypatch, risposta=None, errore=None):
    monkeypatch.setattr(email_service, "_configured", True)
    monkeypatch.setattr(email_service, "RESEND_API_KEY", CHIAVE_FINTA)
    monkeypatch.setattr(server.httpx, "AsyncClient", _client(risposta, errore))
    return asyncio.run(server._check_resend())


def test_200_ok(monkeypatch):
    r = _esegui(monkeypatch, _Risposta(200, {"data": []}))
    assert r["ok"] is True and "note" not in r and "error" not in r


def test_401_chiave_solo_invio(monkeypatch):
    corpo = {"name": "restricted_api_key", "message": "This API key is restricted to only send emails"}
    r = _esegui(monkeypatch, _Risposta(401, corpo))
    assert r["ok"] is True and r["note"] == "chiave solo invio" and "ms" in r


def test_401_solo_nome_maiuscolo(monkeypatch):
    r = _esegui(monkeypatch, _Risposta(401, {"name": "Restricted_API_Key", "message": ""}))
    assert r["ok"] is True and r["note"] == "chiave solo invio"


def test_401_chiave_non_valida(monkeypatch):
    r = _esegui(monkeypatch, _Risposta(401, {"name": "invalid_api_key", "message": "API key is invalid"}))
    assert r == {"ok": False, "error": "chiave rifiutata"}


def test_403_e_corpo_non_json(monkeypatch):
    assert _esegui(monkeypatch, _Risposta(403, None))["error"] == "chiave rifiutata"
    assert _esegui(monkeypatch, _Risposta(401, None))["error"] == "chiave rifiutata"


def test_errore_di_rete(monkeypatch):
    r = _esegui(monkeypatch, errore=httpx.ConnectError(f"boom {CHIAVE_FINTA}"))
    assert r["ok"] is False and "error" in r


def test_chiave_mai_in_risposta_ne_log(monkeypatch, caplog):
    caplog.set_level(logging.DEBUG)
    casi = [
        dict(risposta=_Risposta(200, {})),
        dict(risposta=_Risposta(401, {"name": "restricted_api_key", "message": "x"})),
        dict(risposta=_Risposta(401, {"name": "invalid_api_key", "message": CHIAVE_FINTA})),
        dict(errore=httpx.ConnectError(f"boom {CHIAVE_FINTA}")),
    ]
    for c in casi:
        assert CHIAVE_FINTA not in str(_esegui(monkeypatch, **c))
    assert CHIAVE_FINTA not in caplog.text
