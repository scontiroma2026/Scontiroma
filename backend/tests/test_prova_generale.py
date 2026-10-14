"""Prova generale pre-lancio: intestazioni di sicurezza, valori predefiniti sicuri e render.yaml.

Nessun database: si usano /api/ e /api/auth/logout, che non leggono né scrivono dati. Nessun valore segreto.
"""
import asyncio
import os
import re
from pathlib import Path

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "test_unit")
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")

import httpx  # noqa: E402
import pytest  # noqa: E402

import server  # noqa: E402

RENDER_YAML = Path(__file__).resolve().parents[2] / "render.yaml"
ATTESE = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
}


def _chiama(metodo, percorso, **kw):
    async def go():
        t = httpx.ASGITransport(app=server.app)
        async with httpx.AsyncClient(transport=t, base_url="http://test") as c:
            return await c.request(metodo, percorso, **kw)
    return asyncio.run(go())


@pytest.mark.parametrize("metodo,percorso,kw", [
    ("GET", "/api/", {}),
    ("GET", "/api/percorso-che-non-esiste", {}),   # 404
    ("POST", "/api/auth/logout", {}),               # 200
    ("POST", "/api/auth/logout", {"headers": {"Origin": "https://sito-malevolo.example"}}),  # anche se rifiutata
])
def test_intestazioni_di_sicurezza_su_ogni_risposta(metodo, percorso, kw):
    r = _chiama(metodo, percorso, **kw)
    for nome, valore in ATTESE.items():
        assert r.headers.get(nome) == valore, f"{nome} manca su {metodo} {percorso} ({r.status_code})"


def test_cors_origine_estranea_non_riceve_il_permesso():
    r = _chiama("GET", "/api/", headers={"Origin": "https://sito-malevolo.example"})
    assert "access-control-allow-origin" not in r.headers
    r = _chiama("OPTIONS", "/api/auth/login", headers={
        "Origin": "https://sito-malevolo.example", "Access-Control-Request-Method": "POST"})
    assert r.headers.get("access-control-allow-origin") != "https://sito-malevolo.example"


def test_valori_predefiniti_sicuri_senza_variabili(monkeypatch):
    """Se su Render una variabile manca, il server deve cadere sul valore prudente."""
    for nome in ("CLIENT_SUBSCRIPTION_REQUIRED", "MERCHANT_PAYMENT_REQUIRED", "PRELAUNCH_MODE",
                 "CLIENT_EMAIL_CONFIRMATION_REQUIRED", "WAITLIST_DAILY_CAP"):
        monkeypatch.delenv(nome, raising=False)
    assert server.client_subscription_required() is False       # nessun pagamento dei clienti
    assert server.merchant_payment_required() is False          # nessun addebito ai commercianti
    assert server.prelaunch_mode() is False                     # il sito vero non cambia
    assert server.client_email_confirmation_required() is True  # conferma email dei clienti accesa
    assert server._soglia_env("WAITLIST_DAILY_CAP", 80) == 80   # tetto giornaliero dell'avviso di lancio


def test_render_yaml_valori_prudenti_e_nessun_segreto():
    testo = RENDER_YAML.read_text(encoding="utf-8")
    assert re.search(r"key: CSRF_ORIGIN_MODE\s+value: enforce", testo)
    assert re.search(r"key: CLIENT_SUBSCRIPTION_REQUIRED\s+value: \"false\"", testo)
    assert re.search(r"key: PAYPAL_MODE\s+value: sandbox", testo)
    # Le chiavi segrete non hanno un valore scritto qui: solo `sync: false`.
    for nome in ("MONGO_URL", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "PAYPAL_SECRET", "RESEND_API_KEY",
                 "ADMIN_PASSWORD", "ADMIN_MASTER_PASSWORD", "ADMIN_RECOVERY_ID", "GEMINI_API_KEY"):
        m = re.search(rf"key: {nome}\n\s+(\w+): ", testo)
        assert m and m.group(1) == "sync", f"{nome} deve essere sync: false in render.yaml"
    # Il sito statico manda le stesse intestazioni di sicurezza del server.
    for nome, valore in ATTESE.items():
        assert re.search(rf"name: {nome}\s+value: {re.escape(valore)}", testo), f"render.yaml: manca {nome} sul sito"


# ---------- Log senza indirizzi email interi ----------
def test_maschera_email():
    import email_service
    assert email_service.mask_email("Giulia.Rossi@Gmail.com") == "G***@gmail.com"
    assert email_service.mask_email("a@b.it") == "a***@b.it"
    assert email_service.mask_email("senza-chiocciola") == "?"
    assert email_service.mask_email(None) == "?"
    t = email_service.mask_emails_in_text("Invalid to: mario.rossi@example.com; cc luisa@example.org, ok")
    assert "mario.rossi" not in t and "luisa@" not in t and "m***@example.com" in t and "l***@example.org" in t


def test_i_log_delle_email_non_contengono_indirizzi_interi(caplog):
    import logging
    import email_service
    caplog.set_level(logging.INFO)
    asyncio.run(email_service._send(["persona.vera@example.com", "altra@example.org"], "Prova", "<p>x</p>"))  # senza chiave: simulata
    testo = caplog.text
    assert "[email:mock]" in testo
    assert "persona.vera@example.com" not in testo and "altra@example.org" not in testo
    assert "p***@example.com" in testo


def test_nel_codice_nessun_log_con_indirizzo_intero():
    sorgente = (Path(__file__).resolve().parents[1] / "server.py").read_text(encoding="utf-8")
    assert re.search(r"logging\.\w+\(f\"[^\"\n]*to=\{u\['email'\]\}", sorgente) is None
