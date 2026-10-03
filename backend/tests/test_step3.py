"""Step 3: statistiche aggregate per il commerciante, riepilogo «Fase di lancio» per l'admin,
data di fine prova solo se impostata. Database locale o emulatore, mai produzione."""
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
DB_NAME = "e2e_unit_step3"
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
    asyncio.run(main())


async def utente(role, **extra):
    uid = str(uuid.uuid4())
    await server.db.users.insert_one({"id": uid, "email": f"{role}.{uid[:6]}@example.com", "name": "Prova", "role": role,
                                      "created_at": datetime.now(timezone.utc).isoformat(), **extra})
    return uid, {"Authorization": f"Bearer {server.create_token(uid, 'x@example.com')}"}


async def uso(mid, cid, quando):
    await server.db.redemptions.insert_one({"id": str(uuid.uuid4()), "code": uuid.uuid4().hex[:8], "user_id": cid,
                                            "merchant_id": mid, "status": "redeemed", "month_key": quando.strftime("%Y-%m"),
                                            "redeemed_at": quando.isoformat()})


def test_statistiche_insufficienti_sotto_tre_clienti():
    async def body(c):
        mid, h = await utente("merchant", shop_name="Osteria")
        cid, _ = await utente("client")
        await uso(mid, cid, datetime.now(timezone.utc))
        d = (await c.get("/api/merchants/me/insights", headers=h)).json()
        assert d["utilizzi_mese"] == 1 and d["dati_sufficienti"] is False
        assert "clienti_nuovi" not in d and "giorni" not in d
        assert len(d["ultimi_6_mesi"]) == 6 and d["ultimi_6_mesi"][-1]["utilizzi"] == 1
    run(body)


def test_statistiche_clienti_nuovi_e_di_ritorno():
    async def body(c):
        mid, h = await utente("merchant", shop_name="Osteria")
        ora = datetime.now(timezone.utc)
        vecchio, _ = await utente("client")
        await uso(mid, vecchio, ora - timedelta(days=40))  # era già venuto un altro mese
        await uso(mid, vecchio, ora)
        for _ in range(2):
            cid, _ = await utente("client")
            await uso(mid, cid, ora)
        d = (await c.get("/api/merchants/me/insights", headers=h)).json()
        assert d["dati_sufficienti"] is True
        assert (d["clienti_mese"], d["clienti_nuovi"], d["clienti_di_ritorno"]) == (3, 2, 1)
        assert sum(g["utilizzi"] for g in d["giorni"]) == 3
        assert "user_id" not in str(d) and "@" not in str(d)  # mai dati dei clienti
    run(body)


def test_statistiche_solo_commercianti():
    async def body(c):
        _, h = await utente("client")
        assert (await c.get("/api/merchants/me/insights", headers=h)).status_code == 403
    run(body)


def test_riepilogo_fase_di_lancio(monkeypatch):
    monkeypatch.setenv("ADMIN_MASTER_PASSWORD", "master-test-123456")

    async def body(c):
        aid, ah = await utente("admin")
        m = await c.post("/api/admin/verify-master", json={"password": "master-test-123456"}, headers=ah)
        ah = {**ah, "X-Admin-Master": m.json()["token"]}
        con, _ = await utente("merchant", shop_name="Con offerta", zone="Garbatella")
        await utente("merchant", shop_name="Senza offerta", zone="Marconi")
        await utente("merchant", shop_name="Sospeso", zone="Garbatella", approved=False)
        await server.db.discounts.insert_one({"id": "d1", "merchant_id": con, "approval_status": "approved", "active": True})
        await server.db.next_discounts.insert_one({"id": "n1", "merchant_id": con, "approval_status": "pending"})
        await utente("client")
        d = (await c.get("/api/admin/launch-summary", headers=ah)).json()
        assert d["clienti"] == 1 and d["commercianti"] == 3 and d["sospesi"] == 1
        assert d["offerte_da_approvare"] == 1
        assert set(d["negozi_senza_offerta"]) == {"Senza offerta", "Sospeso"}
        z = {x["zona"]: x for x in d["zone"]}
        assert z["Garbatella"] == {"zona": "Garbatella", "negozi": 2, "online": 1}
        assert (await c.get("/api/admin/launch-summary", headers=ah | {"X-Admin-Master": ""})).status_code in (401, 403)
    run(body)


def test_data_fine_prova_solo_se_impostata(monkeypatch):
    async def body(c):
        monkeypatch.delenv("TRIAL_END_DATE", raising=False)
        assert "trial_end_date" not in (await c.get("/api/config/public")).json()
        monkeypatch.setenv("TRIAL_END_DATE", "2026-11-30")
        d = (await c.get("/api/config/public")).json()
        assert d["trial_end_date"] == "2026-11-30" and d["trial_end_label"] == "30 novembre 2026"
        monkeypatch.setenv("TRIAL_END_DATE", "30/11/2026")
        assert "trial_end_date" not in (await c.get("/api/config/public")).json()
    run(body)
