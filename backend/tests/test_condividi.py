"""Condivisione di un'offerta: la pagina /api/share/o/{id} dà l'anteprima (titolo, prezzo, foto)
solo per offerte pubbliche e porta alla pagina dell'offerta. Nessun dato del commerciante oltre
nome del negozio e quartiere. Server in-process su database locale o emulatore."""
import asyncio
import base64
import os
import uuid
from urllib.parse import urlparse

import pytest

MONGO_URL = os.environ.setdefault("TEST_MONGO_URL", os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
_u = urlparse(MONGO_URL)
if not (_u.scheme == "mongomock" or (_u.scheme == "mongodb" and (_u.hostname or "") in ("localhost", "127.0.0.1", "::1"))):
    pytest.exit(f"MONGO_URL non locale ({_u.scheme}://{_u.hostname}): test rifiutati.", returncode=2)
USE_MOCK = _u.scheme == "mongomock"
DB_NAME = "e2e_unit_condividi"
os.environ["MONGO_URL"] = "mongodb://localhost:27017" if USE_MOCK else MONGO_URL
os.environ.setdefault("DB_NAME", DB_NAME)
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")
os.environ["RESEND_API_KEY"] = ""
os.environ["FRONTEND_URL"] = "https://sito.example"

import httpx  # noqa: E402

import server  # noqa: E402

PNG = base64.b64encode(b"\x89PNG\r\n\x1a\nfinto").decode()


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
    asyncio.run(main())


async def offerta(stato="approved", titolo="Menù di pesce", immagine=f"data:image/png;base64,{PNG}", approved=True):
    mid, did = str(uuid.uuid4()), str(uuid.uuid4())
    await server.db.users.insert_one({"id": mid, "role": "merchant", "approved": approved, "email": f"m.{mid[:6]}@example.com",
                                      "shop_name": "Osteria dell'Esempio", "zone": "Garbatella", "phone": "+39 06 0000000"})
    await server.db.discounts.insert_one({"id": did, "merchant_id": mid, "title": titolo, "active": True,
                                          "approval_status": stato, "original_price": 40, "discounted_price": 20,
                                          "image_url": immagine})
    return did


def test_anteprima_offerta_pubblica():
    async def body(c):
        did = await offerta()
        r = await c.get(f"/api/share/o/{did}")
        assert r.status_code == 200
        t = r.text
        assert 'property="og:title" content="Menù di pesce a €20,00 invece di €40,00"' in t
        assert "Osteria dell&#x27;Esempio · Garbatella · Sconti Roma" in t
        assert f"https://sito.example/discounts/{did}" in t
        assert f"/api/share/o/{did}/img" in t
        assert "+39" not in t and "@example.com" not in t
        img = await c.get(f"/api/share/o/{did}/img")
        assert img.status_code == 200 and img.headers["content-type"] == "image/png"
        assert img.content.startswith(b"\x89PNG")
    run(body)


def test_offerta_non_pubblica_non_si_vede():
    async def body(c):
        for did in (await offerta(stato="pending"), await offerta(approved=False)):
            r = await c.get(f"/api/share/o/{did}")
            assert r.status_code == 200 and "Menù di pesce" not in r.text
            assert "https://sito.example/discounts\"" in r.text
            assert (await c.get(f"/api/share/o/{did}/img")).status_code == 404
    run(body)


def test_testo_del_commerciante_non_esegue_codice():
    async def body(c):
        did = await offerta(titolo='<script>alert(1)</script>"><b>')
        t = (await c.get(f"/api/share/o/{did}")).text
        assert "<script>alert" not in t and '"><b>' not in t
    run(body)


def test_immagine_svg_rifiutata():
    async def body(c):
        svg = base64.b64encode(b"<svg onload='alert(1)'/>").decode()
        did = await offerta(immagine=f"data:image/svg+xml;base64,{svg}")
        assert (await c.get(f"/api/share/o/{did}/img")).status_code == 404
    run(body)
