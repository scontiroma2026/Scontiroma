"""Avvisi di scadenza delle offerte e «Non rinnovo» (nessun rinnovo automatico).

Il giorno è fissato sostituendo `server._rome_now`; le email sono sostituite da funzioni
che le registrano, quindi non parte nessuna email vera.
Gira in-process contro un MongoDB LOCALE o l'emulatore: rifiuta database remoti.
"""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from urllib.parse import urlparse
from zoneinfo import ZoneInfo

import pytest

MONGO_URL = os.environ.setdefault("TEST_MONGO_URL", os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
_u = urlparse(MONGO_URL)
if not (_u.scheme == "mongomock" or (_u.scheme == "mongodb" and (_u.hostname or "") in ("localhost", "127.0.0.1", "::1"))):
    pytest.exit(f"MONGO_URL non locale ({_u.scheme}://{_u.hostname}): test rifiutati.", returncode=2)
USE_MOCK = _u.scheme == "mongomock"
DB_NAME = "e2e_unit_avvisi_scadenza"

os.environ["MONGO_URL"] = "mongodb://localhost:27017" if USE_MOCK else MONGO_URL
os.environ.setdefault("DB_NAME", DB_NAME)
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")
os.environ["RESEND_API_KEY"] = ""

import httpx  # noqa: E402

import server  # noqa: E402

ROME = ZoneInfo("Europe/Rome")


@pytest.fixture
def posta(monkeypatch):
    """Registra le email invece di inviarle."""
    inviate = {"promemoria": [], "scaduta": [], "admin": []}

    async def promemoria(to, name, shop, label, days_left):
        inviate["promemoria"].append((to, days_left))

    async def scaduta(to, name, shop, no_renew=False):
        inviate["scaduta"].append((to, no_renew))

    async def admin(to, label, pending, rejected, missing, no_renew):
        inviate["admin"].append({"to": to, "pending": pending, "rejected": rejected,
                                 "missing": missing, "no_renew": no_renew})

    monkeypatch.setattr(server, "send_next_offer_reminder", promemoria)
    monkeypatch.setattr(server, "send_offer_expired", scaduta)
    monkeypatch.setattr(server, "send_admin_month_summary", admin)
    monkeypatch.setenv("ADMIN_NOTIFY_EMAIL", "admin@example.com")
    return inviate


def giorno(monkeypatch, y, m, d, h=10):
    monkeypatch.setattr(server, "_rome_now", lambda: datetime(y, m, d, h, 0, tzinfo=ROME))


def run(test_body):
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
            await test_body(c)
    asyncio.run(main())


async def commerciante(shop="Negozio di prova", offerta=True):
    uid = str(uuid.uuid4())
    email = f"merchant.{uid[:8]}@example.com"
    await server.db.users.insert_one({
        "id": uid, "email": email, "name": "Prova", "role": "merchant", "shop_name": shop,
        "zone": "Garbatella", "category": "Ristorante", "approved": True,
        "created_at": datetime.now(timezone.utc).isoformat()})
    if offerta:
        now = datetime.now(timezone.utc).isoformat()
        await server.db.discounts.insert_one({
            "id": str(uuid.uuid4()), "merchant_id": uid, "title": "Offerta di ottobre", "description": "x",
            "original_price": 20.0, "discounted_price": 10.0, "active": True, "approval_status": "approved",
            "locked_month": "2026-10", "created_at": now, "updated_at": now})
    return {"id": uid, "email": email, "h": {"Authorization": f"Bearer {server.create_token(uid, email)}"}}


async def offerta_prossima(mid, status="pending"):
    now = datetime.now(timezone.utc).isoformat()
    await server.db.next_discounts.insert_one({
        "id": str(uuid.uuid4()), "merchant_id": mid, "target_month": "2026-11", "title": "Offerta di novembre",
        "description": "x", "original_price": 20.0, "discounted_price": 12.0, "active": True,
        "approval_status": status, "created_at": now, "updated_at": now})


# ---------- Promemoria al commerciante ----------

def test_finestra_chiusa_nessun_promemoria(monkeypatch, posta):
    giorno(monkeypatch, 2026, 10, 20)

    async def body(_c):
        await commerciante()
        res = await server._run_next_offer_reminders()
        assert res == {"window_open": False, "sent": 0}
    run(body)
    assert posta["promemoria"] == [] and posta["admin"] == []


def test_tre_promemoria_uno_per_fase(monkeypatch, posta):
    async def body(_c):
        m = await commerciante()
        for d, fase in ((25, "apertura"), (26, "apertura"), (29, "tre_giorni"), (30, "tre_giorni"), (31, "ultimo_giorno")):
            giorno(monkeypatch, 2026, 10, d)
            res = await server._run_next_offer_reminders()
            assert res["stage"] == fase
            res2 = await server._run_next_offer_reminders()  # stesso giorno: niente doppioni
            assert res2["sent"] == 0
        u = await server.db.users.find_one({"id": m["id"]})
        assert u["next_offer_reminders"] == {"month": "2026-11", "stages": ["apertura", "tre_giorni", "ultimo_giorno"]}
    run(body)
    assert [d for _, d in posta["promemoria"]] == [7, 3, 1]


def test_server_spento_parte_solo_la_fase_piu_vicina(monkeypatch, posta):
    giorno(monkeypatch, 2026, 10, 30)

    async def body(_c):
        await commerciante()
        assert (await server._run_next_offer_reminders())["sent"] == 1
    run(body)
    assert [d for _, d in posta["promemoria"]] == [2]


def test_nessun_promemoria_se_caricata_o_non_rinnovo(monkeypatch, posta):
    giorno(monkeypatch, 2026, 10, 25)

    async def body(c):
        caricata = await commerciante("Caricata")
        await offerta_prossima(caricata["id"])
        non_rinnova = await commerciante("Non rinnova")
        r = await c.post("/api/merchants/me/no-renew", json={"no_renew": True}, headers=non_rinnova["h"])
        assert r.status_code == 200, r.text
        await commerciante("Senza offerta", offerta=False)
        res = await server._run_next_offer_reminders()
        assert res["sent"] == 0 and res["checked"] == 2
    run(body)
    assert posta["promemoria"] == []


# ---------- «Non rinnovo» e stato del banner ----------

def test_stato_rinnovo_e_non_rinnovo(monkeypatch, posta):
    giorno(monkeypatch, 2026, 10, 27)

    async def body(c):
        m = await commerciante()
        st = (await c.get("/api/merchants/me/renewal-status", headers=m["h"])).json()
        assert st["window"]["open"] is True and st["current_active"] is True
        assert st["expires_on"] == "31 ottobre" and st["next_status"] is None and st["no_renew"] is False

        st = (await c.post("/api/merchants/me/no-renew", json={"no_renew": True}, headers=m["h"])).json()
        assert st["no_renew"] is True
        st = (await c.post("/api/merchants/me/no-renew", json={"no_renew": False}, headers=m["h"])).json()
        assert st["no_renew"] is False
    run(body)


def test_non_rinnovo_ritira_e_archivia_offerta_caricata(monkeypatch, posta):
    giorno(monkeypatch, 2026, 10, 30)

    async def body(c):
        m = await commerciante()
        await offerta_prossima(m["id"], "approved")
        st = (await c.post("/api/merchants/me/no-renew", json={"no_renew": True}, headers=m["h"])).json()
        assert st["no_renew"] is True and st["next_status"] is None
        assert await server.db.next_discounts.count_documents({"merchant_id": m["id"]}) == 0
        arch = await server.db.discounts_archive.find_one({"merchant_id": m["id"]})
        assert arch["archive_reason"] == "withdrawn_no_renew" and arch["title"] == "Offerta di novembre"

        # Il 1° novembre non riparte nulla e arriva l'email "terminata" con la scelta Non rinnovo
        giorno(monkeypatch, 2026, 11, 1, h=0)
        res = await server._run_month_rollover()
        assert res["month"] == "2026-11" and res["expired"] == 1 and res["promoted"] == 0
        d = await server.db.discounts.find_one({"merchant_id": m["id"]})
        assert d["approval_status"] == "expired" and d["active"] is False
        st = (await c.get("/api/merchants/me/renewal-status", headers=m["h"])).json()
        assert st["current_expired"] is True and st["current_active"] is False
    run(body)
    assert posta["scaduta"] == [(posta["scaduta"][0][0], True)]


def test_caricare_offerta_annulla_non_rinnovo(monkeypatch, posta):
    giorno(monkeypatch, 2026, 10, 28)

    async def body(c):
        m = await commerciante()
        await c.post("/api/merchants/me/no-renew", json={"no_renew": True}, headers=m["h"])
        r = await c.post("/api/merchants/me/next-discount", headers=m["h"], json={
            "title": "Offerta di novembre", "description": "Una descrizione dell'offerta",
            "original_price": 20, "discounted_price": 12})
        assert r.status_code == 200, r.text
        st = (await c.get("/api/merchants/me/renewal-status", headers=m["h"])).json()
        assert st["no_renew"] is False and st["next_status"] == "pending"
    run(body)


def test_solo_commercianti(monkeypatch, posta):
    async def body(c):
        r = await c.get("/api/merchants/me/renewal-status")
        assert r.status_code == 401
        uid = str(uuid.uuid4())
        await server.db.users.insert_one({"id": uid, "email": f"c.{uid[:6]}@example.com", "name": "C", "role": "client"})
        h = {"Authorization": f"Bearer {server.create_token(uid, 'c@example.com')}"}
        assert (await c.post("/api/merchants/me/no-renew", json={"no_renew": True}, headers=h)).status_code == 403
    run(body)


# ---------- Passaggio di mese ----------

def test_rollover_usa_il_mese_di_roma(monkeypatch, posta):
    """Il 1° alle 00:05 di Roma in UTC è ancora il mese prima: il passaggio non va saltato."""
    async def body(_c):
        await server.db.rollover_runs.insert_one({"month": "2026-10", "ran_at": "2026-10-01T00:05:00+02:00"})
        m = await commerciante()
        giorno(monkeypatch, 2026, 11, 1, h=0)
        res = await server._run_month_rollover()
        assert res["skipped"] is False and res["month"] == "2026-11" and res["expired"] == 1
        assert (await server._run_month_rollover())["skipped"] is True
        assert (await server.db.discounts.find_one({"merchant_id": m["id"]}))["approval_status"] == "expired"
    run(body)
    assert len(posta["scaduta"]) == 1 and posta["scaduta"][0][1] is False


def test_rollover_offerta_approvata_nessuna_email(monkeypatch, posta):
    async def body(_c):
        m = await commerciante()
        await offerta_prossima(m["id"], "approved")
        giorno(monkeypatch, 2026, 11, 1, h=0)
        res = await server._run_month_rollover()
        assert res["promoted"] == 1 and res["expired"] == 0
        d = await server.db.discounts.find_one({"merchant_id": m["id"]})
        assert d["title"] == "Offerta di novembre" and d["locked_month"] == "2026-11"
    run(body)
    assert posta["scaduta"] == []


# ---------- Riepilogo per l'admin ----------

def test_riepilogo_admin_una_volta(monkeypatch, posta):
    async def body(_c):
        attesa = await commerciante("In attesa")
        await offerta_prossima(attesa["id"], "pending")
        rifiutata = await commerciante("Rifiutata")
        await offerta_prossima(rifiutata["id"], "rejected")
        await commerciante("Mancante")
        nr = await commerciante("Non rinnova")
        await server.db.users.update_one({"id": nr["id"]}, {"$set": {"no_renew_month": "2026-11"}})

        giorno(monkeypatch, 2026, 10, 27)  # 5 giorni alla fine: ancora presto
        assert (await server._run_next_offer_reminders())["admin_summary"] is False
        giorno(monkeypatch, 2026, 10, 28)
        assert (await server._run_next_offer_reminders())["admin_summary"] is True
        giorno(monkeypatch, 2026, 10, 30)
        assert (await server._run_next_offer_reminders())["admin_summary"] is False
    run(body)
    assert len(posta["admin"]) == 1
    a = posta["admin"][0]
    assert a["to"] == "admin@example.com"
    assert a["pending"] == ["In attesa"] and a["rejected"] == ["Rifiutata"]
    assert a["missing"] == ["Mancante"] and a["no_renew"] == ["Non rinnova"]
