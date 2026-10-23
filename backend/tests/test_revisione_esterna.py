"""Correzioni dalla revisione esterna (22/10):
  - P1: il token master non torna più nel corpo della risposta (resta solo nel cookie httpOnly);
  - P3: nessun testo mostrato agli utenti cita il vecchio prezzo cliente da 2,99 €;
  - allarme email non partite: conteggio senza dati personali, numero nel riquadro «Salute», una sola notifica
    push all'admin oltre la soglia (mai un'email).
Database locale (mongomock o MongoDB su localhost), nessuna chiamata di rete: Resend e pywebpush sono finti."""
import json
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

import email_service
from test_interruttore_abbonamento import nuovo_utente, run, server

MASTER = "master-test-123456"
ENDPOINT = "https://push.example.com/invio/"
RADICE = Path(__file__).resolve().parents[2]


@pytest.fixture
def push(monkeypatch):
    inviate = []

    class Risposta:
        status_code = 201
        text = ""

    def finto_webpush(subscription_info, data, vapid_private_key, vapid_claims, **kwargs):
        inviate.append(json.loads(data))
        return Risposta()

    monkeypatch.setattr(server, "webpush", finto_webpush)
    monkeypatch.setenv("ADMIN_MASTER_PASSWORD", MASTER)
    monkeypatch.delenv("VAPID_PUBLIC_KEY", raising=False)
    monkeypatch.delenv("VAPID_PRIVATE_KEY", raising=False)
    monkeypatch.delenv("EMAIL_FALLITE_SOGLIA_ORA", raising=False)
    return inviate


@pytest.fixture
def resend_rotto(monkeypatch):
    """Resend «configurato» ma ogni invio fallisce con un errore che contiene l'indirizzo del destinatario."""
    class ErroreResend(Exception):
        def __init__(self, msg):
            super().__init__(msg)
            self.code = 422

    tentativi = []

    def invio(params):
        tentativi.append(params["subject"])
        raise ErroreResend(f"Invalid `to` field: {params['to'][0]}")

    monkeypatch.setattr(email_service, "_configured", True)
    monkeypatch.setattr(email_service.resend.Emails, "send", invio)
    return tentativi


async def admin_master(c):
    uid, h = await nuovo_utente("admin")
    m = await c.post("/api/admin/verify-master", json={"password": MASTER}, headers=h)
    assert m.status_code == 200, m.text
    return uid, h, m


# ---------- P1: token master solo nel cookie ----------

def test_verify_master_non_restituisce_il_token(push):
    async def body(c):
        _, h, m = await admin_master(c)
        corpo = m.json()
        assert corpo["ok"] is True and "token" not in corpo
        token = m.cookies.get("admin_master_token")
        assert token and token not in m.text
        set_cookie = m.headers.get("set-cookie", "").lower()
        assert "httponly" in set_cookie and "secure" in set_cookie
        # il token del cookie funziona (qui passato come intestazione, il client di prova è in http)
        r = await c.get("/api/admin/health", headers={**h, "X-Admin-Master": token})
        assert r.status_code == 200
    run(body, False)


# ---------- P3: niente 2,99 € nei testi per gli utenti ----------

def test_nessun_prezzo_cliente_nei_testi_mostrati():
    vietato = re.compile(r"2,99|€\s*2\.99")
    for rel in ("frontend/src/pages/Subscribe.jsx", "frontend/src/pages/ClientDashboard.jsx"):
        assert not vietato.search((RADICE / rel).read_text(encoding="utf-8")), rel
    # le email per i clienti non citano un prezzo (la ricevuta mostra l'importo davvero pagato)
    for nome in ("send_welcome_client", "send_email_confirmation"):
        assert "2,99" not in str(getattr(email_service, nome).__code__.co_consts)
    # il prezzo del vecchio abbonamento (spento) sta in un solo punto del server
    testo = (RADICE / "backend/server.py").read_text(encoding="utf-8")
    assert testo.count("2.99") == 0 and testo.count("= 299") == 1


# ---------- Allarme email non partite ----------

def test_email_fallita_conteggiata_senza_dati_personali(push, resend_rotto, caplog):
    async def body(c):
        esito = await email_service.send_welcome_client("mario.rossi@example.com", "Mario")
        assert esito is None
        righe = await server.db.email_fallite.find({}, {"_id": 0}).to_list(None)
        assert len(righe) == 1
        r = righe[0]
        assert r["tipo"] == "send_welcome_client" and r["codice"] == "422"
        assert "mario" not in json.dumps(r, default=str).lower()
        # sotto la soglia nessuna notifica
        assert push == []
    run(body, False)
    assert "mario.rossi@example.com" not in caplog.text


def test_oltre_la_soglia_una_sola_notifica_push_e_nessuna_email(push, resend_rotto):
    async def body(c):
        uid, h, m = await admin_master(c)
        hm = {**h, "X-Admin-Master": m.cookies["admin_master_token"]}
        r = await c.post("/api/admin/push/iscrizione", headers=hm,
                         json={"endpoint": ENDPOINT + "telefono", "keys": {"p256dh": "B" + "x" * 86, "auth": "a" * 22}})
        assert r.status_code == 200, r.text
        for i in range(5):
            await email_service.send_welcome_client(f"cliente{i}@example.com", "Cliente")
        assert [p["title"] for p in push] == ["Email non partite"]  # una sola, anche con 5 fallimenti
        assert "3 email" in push[0]["body"]
        assert not any("@" in json.dumps(p) for p in push)
        # solo i 5 invii falliti: nessuna email mandata per segnalare le email fallite
        assert len(resend_rotto) == 5

        salute = (await c.get("/api/admin/health", headers=hm)).json()["email_fallite"]
        assert salute["ultime_24h"] == 5 and salute["ultima_ora"] == 5 and salute["ok"] is False
        assert salute["per_tipo"] == {"send_welcome_client": 5} and salute["codici"] == ["422"]
        assert salute["soglia_ora"] == 3
    run(body, False)


def test_salute_conta_solo_le_ultime_24_ore(push):
    async def body(c):
        _, h, m = await admin_master(c)
        hm = {**h, "X-Admin-Master": m.cookies["admin_master_token"]}
        ora = datetime.now(timezone.utc)
        await server.db.email_fallite.insert_many([
            {"id": "a", "tipo": "send_password_reset", "codice": "500", "at": (ora - timedelta(hours=30)).isoformat()},
            {"id": "b", "tipo": "send_password_reset", "codice": "500", "at": (ora - timedelta(hours=2)).isoformat()},
        ])
        salute = (await c.get("/api/admin/health", headers=hm)).json()["email_fallite"]
        assert salute["ultime_24h"] == 1 and salute["ultima_ora"] == 0
        await server.db.email_fallite.delete_many({})
        salute = (await c.get("/api/admin/health", headers=hm)).json()["email_fallite"]
        assert salute["ok"] is True and salute["ultime_24h"] == 0
    run(body, False)


def test_errore_nel_conteggio_non_blocca_l_invio(push, resend_rotto, monkeypatch):
    async def guasto(tipo, codice):
        raise RuntimeError("db giù")

    monkeypatch.setattr(email_service, "_avviso_email_fallita", guasto)

    async def body(c):
        assert await email_service.send_welcome_client("x@example.com", "X") is None
    run(body, False)
