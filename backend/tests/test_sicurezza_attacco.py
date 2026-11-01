"""Correzioni del finto attacco del 01/11: IP vero dietro il proxy, limite login per IP, webhook Stripe
chiuso senza segreto vero, push solo verso i servizi ufficiali, codice di reset salvato come impronta,
sessioni che scadono col cambio password, limite foto IA, WebAuthn solo con id testuale."""
import asyncio
import os
import uuid
from datetime import datetime, timedelta, timezone

import pytest

os.environ.setdefault("TEST_MONGO_URL", "mongomock://x")
os.environ["MONGO_URL"] = "mongodb://localhost:27017"
os.environ.setdefault("DB_NAME", "e2e_unit_sicurezza")
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")
os.environ["RESEND_API_KEY"] = ""

import httpx  # noqa: E402
import mongomock_motor  # noqa: E402
from starlette.requests import Request  # noqa: E402

import server  # noqa: E402


def run(body):
    async def main():
        server.db = mongomock_motor.AsyncMongoMockClient()["e2e_unit_sicurezza"]
        server._login_falliti_ip.clear()
        transport = httpx.ASGITransport(app=server.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
            await body(c)
            await server.attendi_lavori_in_background()
    asyncio.run(main())


async def utente(role, **extra):
    uid = str(uuid.uuid4())
    email = f"{role}.{uid[:8]}@example.com"
    await server.db.users.insert_one({"id": uid, "email": email, "name": "Prova", "role": role,
                                      "password_hash": server.hash_password("Password-giusta-1"), **extra})
    return uid, email, {"Authorization": f"Bearer {server.create_token(uid, email)}"}


def _richiesta(intestazioni, client=("10.0.0.1", 1)):
    return Request({"type": "http", "headers": [(k.lower().encode(), v.encode()) for k, v in intestazioni.items()],
                    "client": client})


def test_ip_non_falsificabile():
    # Il primo valore di X-Forwarded-For lo sceglie il client: non deve contare.
    assert server._ip_richiesta(_richiesta({"X-Forwarded-For": "1.2.3.4, 203.0.113.7"})) == "203.0.113.7"
    assert server._ip_richiesta(_richiesta({"X-Forwarded-For": "9.9.9.9", "CF-Connecting-IP": "198.51.100.5"})) == "198.51.100.5"
    assert server._ip_richiesta(_richiesta({})) == "10.0.0.1"


def test_limite_login_per_ip(monkeypatch):
    monkeypatch.setenv("LOGIN_FALLITI_MAX_PER_IP", "3")

    async def body(c):
        emails = [(await utente("client"))[1] for _ in range(4)]
        for e in emails[:3]:
            r = await c.post("/api/auth/login", json={"email": e, "password": "sbagliata-123"},
                             headers={"X-Forwarded-For": "127.0.0.1"})
            assert r.status_code == 401
        # Il client inventa un IP all'inizio di X-Forwarded-For; il proxy aggiunge in fondo quello vero
        # (qui 127.0.0.1, lo stesso dei tentativi sopra): resta bloccato.
        r = await c.post("/api/auth/login", json={"email": emails[3], "password": "Password-giusta-1"},
                         headers={"X-Forwarded-For": "8.8.8.8, 127.0.0.1"})
        assert r.status_code == 429
    run(body)


@pytest.mark.parametrize("segreto", ["", "da-impostare"])
def test_webhook_stripe_chiuso_senza_segreto_vero(monkeypatch, segreto):
    monkeypatch.setattr(server, "STRIPE_WEBHOOK_SECRET", segreto)

    async def body(c):
        r = await c.post("/api/stripe/webhook", content=b'{"type":"checkout.session.completed"}',
                         headers={"stripe-signature": "t=1,v1=abc"})
        assert r.status_code == 503
    run(body)


def test_push_solo_servizi_ufficiali():
    assert server._push_endpoint_valido("https://fcm.googleapis.com/fcm/send/abc")
    assert server._push_endpoint_valido("https://web.push.apple.com/xyz")
    assert not server._push_endpoint_valido("https://169.254.169.254/latest/meta-data")
    assert not server._push_endpoint_valido("https://localhost:8001/api/")
    assert not server._push_endpoint_valido("https://fcm.googleapis.com.evil.example/x")
    assert not server._push_endpoint_valido("http://fcm.googleapis.com/x")


def test_reset_salvato_come_impronta_e_sessioni_scadute():
    async def body(c):
        uid, email, h = await utente("client")
        assert (await c.get("/api/auth/me", headers=h)).status_code == 200
        r = await c.post("/api/auth/forgot", json={"email": email})
        assert r.status_code == 200
        u = await server.db.users.find_one({"id": uid})
        assert len(u["reset_token"]) == 64  # impronta sha256, non il codice mandato per email
        token = "codice-di-prova-123"
        await server.db.users.update_one({"id": uid}, {"$set": {
            "reset_token": server._impronta_reset(token),
            "reset_expires": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()}})
        assert (await c.post("/api/auth/reset", json={"token": server._impronta_reset(token),
                                                       "new_password": "Nuova-password-1"})).status_code == 400
        r = await c.post("/api/auth/reset", json={"token": token, "new_password": "Nuova-password-1"})
        assert r.status_code == 200
        # Il vecchio accesso non vale più; il nuovo login sì.
        assert (await c.get("/api/auth/me", headers=h)).status_code == 401
        r = await c.post("/api/auth/login", json={"email": email, "password": "Nuova-password-1"})
        assert r.status_code == 200
        nuovo = {"Authorization": f"Bearer {r.json()['access_token']}"}
        assert (await c.get("/api/auth/me", headers=nuovo)).status_code == 200
    run(body)


def test_password_minima_8():
    async def body(c):
        r = await c.post("/api/auth/register", json={"email": "corta@example.com", "password": "1234567",
                                                     "name": "X", "role": "client", "legal_accepted": True})
        assert r.status_code == 422
    run(body)


def test_limite_foto_ia(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "finta")
    monkeypatch.setenv("AI_FOTO_MAX_AL_GIORNO", "2")

    async def body(c):
        _, _, h = await utente("merchant")
        piccola = "data:image/png;base64,AAAA"
        for _ in range(2):
            r = await c.post("/api/ai/enhance-image", json={"image_url": piccola}, headers=h)
            assert r.status_code != 429
        r = await c.post("/api/ai/enhance-image", json={"image_url": piccola}, headers=h)
        assert r.status_code == 429
        _, _, hs = await utente("merchant", approved=False)
        r = await c.post("/api/ai/enhance-image", json={"image_url": piccola}, headers=hs)
        assert r.status_code == 403
    run(body)


def test_webauthn_id_solo_testo():
    async def body(c):
        r = await c.post("/api/webauthn/login/complete", json={"credential": {"id": {"$regex": ".*"}}})
        assert r.status_code == 400
    run(body)
