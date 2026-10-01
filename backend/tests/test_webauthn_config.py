"""WebAuthn: configurazione tollerante e transports (test unitari, senza server avviato).

In produzione WEBAUTHN_ORIGIN era "https://scontiroma.it/" (con la barra finale) e la
registrazione Face ID falliva con "Unexpected client data origin https://scontiroma.it,
expected https://scontiroma.it/". Il browser invia l'origine sempre senza barra.
"""
import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "test_unit")
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")

import server  # noqa: E402
from webauthn import generate_authentication_options, options_to_json  # noqa: E402
from webauthn.helpers.structs import PublicKeyCredentialDescriptor  # noqa: E402


def test_origine_senza_barra_finale():
    assert server._webauthn_origins("https://scontiroma.it/") == ["https://scontiroma.it"]
    assert server._webauthn_origins(" https://scontiroma.it ") == ["https://scontiroma.it"]


def test_piu_origini_separate_da_virgola():
    assert server._webauthn_origins("https://scontiroma.it/, https://www.scontiroma.it") == [
        "https://scontiroma.it", "https://www.scontiroma.it"]
    assert server._webauthn_origins("") == []


def test_rp_id_solo_dominio():
    assert server._webauthn_rp_id("scontiroma.it") == "scontiroma.it"
    assert server._webauthn_rp_id("https://scontiroma.it/") == "scontiroma.it"
    assert server._webauthn_rp_id(" Scontiroma.it/ ") == "scontiroma.it"


def test_transports_salvati_come_stringhe():
    # Prima: AttributeError ('str' object has no attribute 'value') e /webauthn/login/begin in 500.
    opts = generate_authentication_options(
        rp_id="localhost",
        allow_credentials=[PublicKeyCredentialDescriptor(id=b"cred", transports=server._transports(["internal", "hybrid", "sconosciuto"]))],
    )
    assert '"transports": ["internal", "hybrid"]' in options_to_json(opts)
    assert server._transports([]) is None
