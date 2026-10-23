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
            await server.attendi_lavori_in_background()  # nessun lavoro in background lasciato a metà
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


def test_admin_vede_sempre_i_numeri_il_commerciante_no(monkeypatch):
    """Con 1 solo cliente il commerciante non vede i dettagli sui clienti; l'admin sì, sempre, ma solo numeri."""
    monkeypatch.setenv("ADMIN_MASTER_PASSWORD", "master-test-123456")

    async def body(c):
        mid, mh = await utente("merchant", shop_name="Osteria")
        cid, ch = await utente("client")
        await uso(mid, cid, datetime.now(timezone.utc))
        dm = (await c.get("/api/merchants/me/insights", headers=mh)).json()
        assert dm["dati_sufficienti"] is False and "clienti_mese" not in dm and "clienti_nuovi" not in dm

        aid, ah = await utente("admin")
        m = await c.post("/api/admin/verify-master", json={"password": "master-test-123456"}, headers=ah)
        ah = {**ah, "X-Admin-Master": m.cookies["admin_master_token"]}
        da = (await c.get(f"/api/admin/merchants/{mid}/insights", headers=ah)).json()
        assert da["dati_sufficienti"] is True
        assert (da["clienti_mese"], da["clienti_nuovi"], da["clienti_di_ritorno"]) == (1, 1, 0)
        assert "user_id" not in str(da) and "@" not in str(da)
        assert (await c.get("/api/admin/merchants/non-esiste/insights", headers=ah)).status_code == 404
        assert (await c.get(f"/api/admin/merchants/{mid}/insights", headers=mh)).status_code in (401, 403)  # non per il commerciante
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
        ah = {**ah, "X-Admin-Master": m.cookies["admin_master_token"]}
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


def test_visite_e_iscrizioni_per_fonte_clienti_e_negozi(monkeypatch):
    """QR dei volantini: le visite (anonime) e le iscrizioni di clienti e negozi si contano per fonte, senza dati personali."""
    monkeypatch.setenv("ADMIN_MASTER_PASSWORD", "master-test-123456")

    async def body(c):
        for tipo in ("cliente", "cliente", "negozio"):
            r = await c.post("/api/fonte/visita", json={"fonte": "volantino-strada" if tipo == "cliente" else "volantino-negozi", "tipo": tipo})
            assert r.status_code == 200 and r.json()["ok"] is True
        r = await c.post("/api/fonte/visita", json={"fonte": "Non Valida!", "tipo": "cliente"})
        assert r.status_code == 200 and r.json()["ok"] is False  # fonte non valida: ignorata
        assert (await c.post("/api/fonte/visita", json={"fonte": "x", "tipo": "altro"})).status_code == 422
        # iscrizioni: un cliente e un negozio con fonte
        await utente("client", fonte_iscrizione="volantino-strada", fonte_iscrizione_at=datetime.now(timezone.utc).isoformat())
        await utente("merchant", shop_name="Osteria", fonte_iscrizione="volantino-negozi", fonte_iscrizione_at=datetime.now(timezone.utc).isoformat())
        aid, ah = await utente("admin")
        m = await c.post("/api/admin/verify-master", json={"password": "master-test-123456"}, headers=ah)
        ah = {**ah, "X-Admin-Master": m.cookies["admin_master_token"]}
        d = (await c.get("/api/admin/fonti-qr", headers=ah)).json()["fonti"]
        riga = {r["fonte"]: r for r in d}
        assert riga["volantino-strada"]["visite_clienti"] == 2 and riga["volantino-strada"]["clienti_iscritti"] == 1
        assert riga["volantino-negozi"]["visite_negozi"] == 1 and riga["volantino-negozi"]["negozi_iscritti"] == 1
        assert "@" not in str(d) and "user" not in str(d)
        assert (await c.get("/api/admin/fonti-qr")).status_code in (401, 403)
    run(body)
