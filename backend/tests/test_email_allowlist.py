"""EMAIL_ALLOWED_RECIPIENTS (ambiente di prova). Nessuna rete: client Resend finto, chiave finta."""
import asyncio
import logging
import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "test_unit")
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")

import pytest  # noqa: E402

import email_service  # noqa: E402


@pytest.fixture
def inviate(monkeypatch):
    chiamate = []

    def finto(params):
        chiamate.append(params)
        return {"id": "id-finto"}

    monkeypatch.setattr(email_service, "_configured", True)
    monkeypatch.setattr(email_service.resend.Emails, "send", staticmethod(finto))
    monkeypatch.delenv("EMAIL_ALLOWED_RECIPIENTS", raising=False)
    return chiamate


def _invia(to):
    return asyncio.run(email_service._send(to, "Oggetto", "<p>x</p>"))


def test_variabile_assente_invio_normale(inviate):
    assert _invia("chiunque@esempio.it") == "id-finto"
    assert inviate[0]["to"] == ["chiunque@esempio.it"]


def test_variabile_vuota_invio_normale(inviate, monkeypatch):
    monkeypatch.setenv("EMAIL_ALLOWED_RECIPIENTS", "  , ")
    assert _invia("chiunque@esempio.it") == "id-finto"


def test_consentito_invia(inviate, monkeypatch):
    monkeypatch.setenv("EMAIL_ALLOWED_RECIPIENTS", "titolare@esempio.it")
    assert _invia("titolare@esempio.it") == "id-finto"
    assert len(inviate) == 1


def test_non_consentito_nessun_invio_nessuna_eccezione(inviate, monkeypatch):
    monkeypatch.setenv("EMAIL_ALLOWED_RECIPIENTS", "titolare@esempio.it")
    assert _invia("altro@esempio.it") is None
    assert inviate == []


def test_maiuscole_e_spazi(inviate, monkeypatch):
    monkeypatch.setenv("EMAIL_ALLOWED_RECIPIENTS", "  Titolare@Esempio.IT , altro@x.it ")
    assert _invia("TITOLARE@esempio.it") == "id-finto"
    assert _invia(" titolare@ESEMPIO.it ") == "id-finto"
    assert len(inviate) == 2


def test_dominio_con_chiocciola(inviate, monkeypatch):
    monkeypatch.setenv("EMAIL_ALLOWED_RECIPIENTS", "@Esempio.it")
    assert _invia("qualsiasi@esempio.it") == "id-finto"
    assert _invia("qualsiasi@sotto.esempio.it") is None
    assert _invia("qualsiasi@altroesempio.it") is None
    assert len(inviate) == 1


def test_piu_destinatari_solo_consentiti(inviate, monkeypatch):
    monkeypatch.setenv("EMAIL_ALLOWED_RECIPIENTS", "a@esempio.it")
    assert _invia(["a@esempio.it", "b@esempio.it"]) == "id-finto"
    assert inviate[0]["to"] == ["a@esempio.it"]
    assert _invia(["b@esempio.it", "c@esempio.it"]) is None
    assert len(inviate) == 1


def test_log_senza_indirizzi_completi(inviate, monkeypatch, caplog):
    monkeypatch.setenv("EMAIL_ALLOWED_RECIPIENTS", "a@esempio.it")
    with caplog.at_level(logging.INFO, logger=email_service.log.name):
        _invia("segreto.persona@dominio-esterno.it")
    testo = caplog.text
    assert "[email:bloccata-prova]" in testo
    assert "dominio-esterno.it" in testo
    assert "segreto.persona" not in testo
    assert "Oggetto" not in testo
