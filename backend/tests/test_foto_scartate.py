"""Foto scartate dall'admin all'approvazione: la foto sparisce dall'offerta, serve un motivo (almeno 10
caratteri), resta almeno una foto, e il commerciante lo legge nell'email di pubblicazione.
Server in-process su database locale o emulatore: rifiuta database remoti."""
import asyncio
import os
import uuid
from urllib.parse import urlparse

import pytest

MONGO_URL = os.environ.setdefault("TEST_MONGO_URL", os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
_u = urlparse(MONGO_URL)
if not (_u.scheme == "mongomock" or (_u.scheme == "mongodb" and (_u.hostname or "") in ("localhost", "127.0.0.1", "::1"))):
    pytest.exit(f"MONGO_URL non locale ({_u.scheme}://{_u.hostname}): test rifiutati.", returncode=2)
USE_MOCK = _u.scheme == "mongomock"
DB_NAME = "e2e_unit_foto_scartate"
os.environ["MONGO_URL"] = "mongodb://localhost:27017" if USE_MOCK else MONGO_URL
os.environ.setdefault("DB_NAME", DB_NAME)
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")
os.environ["RESEND_API_KEY"] = ""

import httpx  # noqa: E402

import email_service  # noqa: E402
import server  # noqa: E402

FOTO = ["https://x.example/1.jpg", "https://x.example/2.jpg", "https://x.example/3.jpg"]


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

        async def no_admin():
            return {"id": "admin", "role": "admin"}
        server.app.dependency_overrides[server.require_admin_master] = no_admin
        try:
            transport = httpx.ASGITransport(app=server.app)
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
                await body(c)
        finally:
            server.app.dependency_overrides.pop(server.require_admin_master, None)
    asyncio.run(main())


async def inserisci(coll):
    mid = str(uuid.uuid4())
    await server.db.users.insert_one({"id": mid, "email": f"m.{mid[:8]}@example.com", "role": "merchant", "shop_name": "Negozio", "name": "Anna"})
    doc = {"id": str(uuid.uuid4()), "merchant_id": mid, "title": "Menù di pesce", "description": "Descrizione",
           "original_price": 40, "discounted_price": 20, "active": True, "approval_status": "pending",
           "max_uses_per_month": 2, "image_url": FOTO[0], "image_urls": list(FOTO)}
    await server.db[coll].insert_one(dict(doc))
    return doc["id"]


CASI = [
    ("discounts", "/api/admin/discounts/{}/approve"),
    ("next_discounts", "/api/admin/next-offers/{}/approve"),
]


@pytest.fixture
def posta(monkeypatch):
    inviate = []

    async def finta(to, subject, html, *a, **k):
        inviate.append((subject, html))
        return "id"
    monkeypatch.setattr(email_service, "_send", finta)
    return inviate


@pytest.mark.parametrize("coll,url", CASI)
def test_foto_scartata_sparisce_e_il_motivo_va_nell_email(coll, url, posta):
    async def body(c):
        i = await inserisci(coll)
        r = await c.post(url.format(i), json={"foto_scartate": [{"url": FOTO[0], "motivo": "  Volto riconoscibile  "}]})
        assert r.status_code == 200, r.text
        d = await server.db[coll].find_one({"id": i})
        assert d["approval_status"] == "approved"
        assert d["image_urls"] == FOTO[1:] and d["image_url"] == FOTO[1]  # la copertina passa alla prima rimasta
        assert d["foto_scartate"] == [{"numero": 1, "motivo": "Volto riconoscibile"}]
    run(body)
    assert any("Foto 1: Volto riconoscibile" in html for _, html in posta)
    assert any("Per contestare scrivi a" in html and "info@scontiroma.it" in html for _, html in posta)


@pytest.mark.parametrize("coll,url", CASI)
def test_senza_foto_scartate_come_prima(coll, url, posta):
    async def body(c):
        i = await inserisci(coll)
        r = await c.post(url.format(i), json={})
        assert r.status_code == 200
        d = await server.db[coll].find_one({"id": i})
        assert d["image_urls"] == FOTO and "foto_scartate" not in d
    run(body)
    assert all("Foto non pubblicate" not in html for _, html in posta)
    assert all("Per contestare scrivi a" not in html for _, html in posta)


@pytest.mark.parametrize("coll,url", CASI)
@pytest.mark.parametrize("scarti,codice", [
    ([{"url": FOTO[0], "motivo": "corto"}], 422),
    ([{"url": "https://altra.example/x.jpg", "motivo": "Foto non dell'offerta"}], 422),
    ([{"url": u, "motivo": "Foto non adatta"} for u in FOTO], 422),
])
def test_scarti_non_validi_non_cambiano_nulla(coll, url, scarti, codice, posta):
    async def body(c):
        i = await inserisci(coll)
        r = await c.post(url.format(i), json={"foto_scartate": scarti})
        assert r.status_code == codice
        d = await server.db[coll].find_one({"id": i})
        assert d["approval_status"] == "pending" and d["image_urls"] == FOTO
    run(body)
