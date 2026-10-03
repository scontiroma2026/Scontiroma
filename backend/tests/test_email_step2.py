"""Email dello step 2: benvenuto (cliente e commerciante), avviso all'admin per un nuovo
commerciante e per un'offerta da approvare, conferma di cancellazione dell'account.
Le funzioni di invio sono sostituite: nessuna email vera. Database locale o emulatore."""
import asyncio
import os
import uuid
from datetime import datetime
from urllib.parse import urlparse
from zoneinfo import ZoneInfo

import pytest

MONGO_URL = os.environ.setdefault("TEST_MONGO_URL", os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
_u = urlparse(MONGO_URL)
if not (_u.scheme == "mongomock" or (_u.scheme == "mongodb" and (_u.hostname or "") in ("localhost", "127.0.0.1", "::1"))):
    pytest.exit(f"MONGO_URL non locale ({_u.scheme}://{_u.hostname}): test rifiutati.", returncode=2)
USE_MOCK = _u.scheme == "mongomock"
DB_NAME = "e2e_unit_email_step2"
os.environ["MONGO_URL"] = "mongodb://localhost:27017" if USE_MOCK else MONGO_URL
os.environ.setdefault("DB_NAME", DB_NAME)
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")
os.environ["RESEND_API_KEY"] = ""

import httpx  # noqa: E402

import server  # noqa: E402


@pytest.fixture
def posta(monkeypatch):
    inviate = []

    def finta(nome):
        async def f(*args, **kwargs):
            inviate.append((nome, args))
        return f

    for nome in ("send_welcome_client", "send_welcome_merchant", "send_admin_new_merchant",
                 "send_admin_new_offer", "send_account_deleted"):
        monkeypatch.setattr(server, nome, finta(nome))
    monkeypatch.setenv("ADMIN_NOTIFY_EMAIL", "avvisi@example.com")
    return inviate


def run(body):
    async def main():
        if USE_MOCK:
            import mongomock_motor
            server.db = mongomock_motor.AsyncMongoMockClient()[DB_NAME]
        else:
            from motor.motor_asyncio import AsyncIOMotorClient
            cli = AsyncIOMotorClient(MONGO_URL)
            await cli.drop_database(DB_NAME)
            server.db = cli[DB_NAME]
        transport = httpx.ASGITransport(app=server.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
            await body(c)
            await asyncio.sleep(0.05)  # lascia finire le email in background
    asyncio.run(main())


async def iscrivi(c, role):
    body = {"email": f"{role}.{uuid.uuid4().hex[:8]}@example.com", "password": "Password-prova-123",
            "name": "Mario Rossi", "role": role, "legal_accepted": True}
    if role == "merchant":
        body.update({"shop_name": "Osteria di prova", "zone": "Garbatella", "category": "Ristorante", "phone": "+39 06 0000000"})
    r = await c.post("/api/auth/register", json=body)
    assert r.status_code == 200, r.text
    await asyncio.sleep(0.02)
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def nomi(posta):
    return [n for n, _ in posta]


def test_benvenuto_cliente(posta):
    async def body(c):
        await iscrivi(c, "client")
    run(body)
    assert nomi(posta) == ["send_welcome_client"]


def test_benvenuto_commerciante_e_avviso_admin(posta):
    async def body(c):
        await iscrivi(c, "merchant")
    run(body)
    assert sorted(nomi(posta)) == ["send_admin_new_merchant", "send_welcome_merchant"]
    admin = next(a for n, a in posta if n == "send_admin_new_merchant")
    assert admin[0] == "avvisi@example.com" and "Osteria di prova" in admin and "Garbatella" in admin


def test_offerta_da_approvare_una_sola_email_finche_resta_in_attesa(posta):
    async def body(c):
        h = await iscrivi(c, "merchant")
        posta.clear()
        offerta = {"title": "Menù di pesce", "description": "Descrizione.", "original_price": 40, "discounted_price": 20}
        assert (await c.post("/api/merchants/me/discount", json=offerta, headers=h)).status_code == 200
        await asyncio.sleep(0.02)
        assert (await c.post("/api/merchants/me/discount", json={**offerta, "title": "Menù di pesce bis"}, headers=h)).status_code == 200
        await asyncio.sleep(0.02)
    run(body)
    assert nomi(posta) == ["send_admin_new_offer"]


def test_offerta_mese_prossimo_avvisa_admin(posta, monkeypatch):
    monkeypatch.setattr(server, "_rome_now", lambda: datetime(2026, 10, 27, 10, 0, tzinfo=ZoneInfo("Europe/Rome")))

    async def body(c):
        h = await iscrivi(c, "merchant")
        posta.clear()
        r = await c.post("/api/merchants/me/next-discount", headers=h,
                         json={"title": "Offerta di novembre", "description": "Descrizione.", "original_price": 30, "discounted_price": 15})
        assert r.status_code == 200, r.text
        await asyncio.sleep(0.02)
    run(body)
    assert nomi(posta) == ["send_admin_new_offer"]
    assert "novembre 2026" in posta[0][1]


def test_conferma_cancellazione_account(posta):
    async def body(c):
        h = await iscrivi(c, "client")
        posta.clear()
        assert (await c.request("DELETE", "/api/gdpr/delete-account", headers=h)).status_code == 200
        await asyncio.sleep(0.02)
    run(body)
    assert nomi(posta) == ["send_account_deleted"]


def test_modelli_email_si_compongono():
    """I modelli producono l'HTML senza errori (invio simulato: niente chiave Resend)."""
    async def tutte():
        import email_service as es
        await es.send_welcome_client("a@example.com", "Mario Rossi")
        await es.send_welcome_merchant("a@example.com", "Mario", "Osteria <prova>")
        await es.send_admin_new_merchant("a@example.com", "Osteria", "Ristorante", "Garbatella", "x@example.com", "")
        await es.send_admin_new_offer("a@example.com", "Osteria", "Menù", "novembre 2026")
        await es.send_account_deleted("a@example.com", "Mario")
    asyncio.run(tutte())
