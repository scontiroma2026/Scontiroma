"""Offerta «omaggio» (13/11): un regalo o un'esperienza senza prezzi, per i locali che non vogliono fare sconti.
Server in-process su database locale o emulatore."""
import asyncio
import os
import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

import pytest

MONGO_URL = os.environ.setdefault("TEST_MONGO_URL", os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
_u = urlparse(MONGO_URL)
if not (_u.scheme == "mongomock" or (_u.scheme == "mongodb" and (_u.hostname or "") in ("localhost", "127.0.0.1", "::1"))):
    pytest.exit(f"MONGO_URL non locale ({_u.scheme}://{_u.hostname}): test rifiutati.", returncode=2)
USE_MOCK = _u.scheme == "mongomock"
DB_NAME = "e2e_unit_offerta_omaggio"
os.environ["MONGO_URL"] = "mongodb://localhost:27017" if USE_MOCK else MONGO_URL
os.environ.setdefault("DB_NAME", DB_NAME)
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")
os.environ["RESEND_API_KEY"] = ""

import httpx  # noqa: E402

import server  # noqa: E402


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
            await server.attendi_lavori_in_background()  # nessun lavoro in background lasciato a metà
    asyncio.run(main())


def _token(uid, email):
    import jwt
    exp = datetime.now(timezone.utc) + timedelta(days=1)
    return jwt.encode({"sub": uid, "email": email, "type": "access", "exp": exp}, server.JWT_SECRET, algorithm=server.JWT_ALGORITHM)


async def negozio():
    uid = str(uuid.uuid4())
    email = f"omaggio.{uid[:8]}@example.com"
    await server.db.users.insert_one({"id": uid, "email": email, "name": "Prova", "role": "merchant",
                                      "shop_name": "Osteria famosa", "zone": "Garbatella", "category": "Ristorante",
                                      "approved": True, "created_at": datetime.now(timezone.utc).isoformat()})
    return uid, {"Authorization": f"Bearer {_token(uid, email)}"}


BASE = {"title": "Calice di benvenuto", "description": "Un calice della casa per chi arriva da Sconti Roma.",
        "terms": "Con la cena. Uno per persona.", "max_uses_per_month": 1}


def test_omaggio_senza_prezzi_si_salva_e_i_prezzi_mandati_si_ignorano():
    async def body(c):
        uid, h = await negozio()
        r = await c.post("/api/merchants/me/discount", headers=h,
                         json={**BASE, "offer_type": "omaggio", "original_price": 30, "discounted_price": 20})
        assert r.status_code == 200, r.text
        d = r.json()["discount"]
        assert d["offer_type"] == "omaggio"
        assert d["original_price"] is None and d["discounted_price"] is None
        assert "percent_off" not in d or d["percent_off"] in (None, 0)
        salvata = await server.db.discounts.find_one({"merchant_id": uid})
        assert salvata["offer_type"] == "omaggio" and salvata["original_price"] is None
        # Approvata: nel catalogo pubblico compare come omaggio, senza percentuale
        await server.db.discounts.update_one({"merchant_id": uid}, {"$set": {"approval_status": "approved", "active": True}})
        pubbliche = (await c.get("/api/discounts")).json()
        lista = pubbliche if isinstance(pubbliche, list) else pubbliche.get("discounts", [])
        mia = [x for x in lista if x.get("id") == salvata["id"]]
        assert mia and mia[0]["offer_type"] == "omaggio" and not mia[0].get("percent_off")
    run(body)


def test_sconto_resta_obbligatorio_con_i_prezzi():
    async def body(c):
        _, h = await negozio()
        senza = await c.post("/api/merchants/me/discount", headers=h, json=BASE)
        assert senza.status_code == 422
        assert "prezzo" in senza.text.lower()
        rovescio = await c.post("/api/merchants/me/discount", headers=h,
                                json={**BASE, "original_price": 10, "discounted_price": 12})
        assert rovescio.status_code == 422
        ok = await c.post("/api/merchants/me/discount", headers=h,
                          json={**BASE, "original_price": 10, "discounted_price": 8})
        assert ok.status_code == 200, ok.text
        d = ok.json()["discount"]
        assert d["offer_type"] == "sconto" and d["percent_off"] == 20
    run(body)


def test_tipo_sconosciuto_rifiutato():
    async def body(c):
        _, h = await negozio()
        r = await c.post("/api/merchants/me/discount", headers=h, json={**BASE, "offer_type": "gratis"})
        assert r.status_code == 422
    run(body)


def test_mese_prossimo_omaggio_senza_percentuale():
    d = server._enrich_next({"id": "x", "title": "t", "offer_type": "omaggio", "original_price": None, "discounted_price": None})
    assert d["percent_off"] is None
    vecchia = server._enrich_next({"id": "y", "original_price": 20.0, "discounted_price": 10.0})
    assert vecchia["percent_off"] == 50
