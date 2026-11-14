"""Durata dell'offerta scelta dal negozio (decisione del titolare, 14/11): non più «fino a fine mese».

Controlla: la scelta della durata nel modulo (giorni, data di fine, senza scadenza solo per l'omaggio, massimi),
la validità che parte dal giorno dell'approvazione, il blocco fino alla data di fine, «Prolunga» senza nuova
approvazione, la «Prossima offerta» senza finestra, i promemoria per le offerte corte e i codici dopo la fine.

Il giorno è fissato sostituendo `server._rome_now`. Database locale finto (mongomock), nessuna email vera.
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
DB_NAME = "e2e_unit_durata_offerta"

os.environ["MONGO_URL"] = "mongodb://localhost:27017" if USE_MOCK else MONGO_URL
os.environ.setdefault("DB_NAME", DB_NAME)
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")
os.environ["RESEND_API_KEY"] = ""

import httpx  # noqa: E402

import server  # noqa: E402

ROME = ZoneInfo("Europe/Rome")
SCONTO = {"title": "Pizza + bibita", "description": "Una pizza classica e una bibita.",
          "original_price": 12, "discounted_price": 9}
OMAGGIO = {"title": "Calice di benvenuto", "description": "Un calice della casa.", "offer_type": "omaggio"}


@pytest.fixture
def posta(monkeypatch):
    """Registra le email invece di inviarle."""
    inviate = {"promemoria": [], "scaduta": [], "approvata": []}

    async def promemoria(to, name, shop, label, days_left, prolungabile=True):
        inviate["promemoria"].append((label, days_left, prolungabile))

    async def scaduta(to, name, shop, no_renew=False):
        inviate["scaduta"].append((to, no_renew))

    async def approvata(to, name, shop, title, foto_scartate=None, fino_al="", parte_il=""):
        inviate["approvata"].append({"title": title, "fino_al": fino_al, "parte_il": parte_il})

    monkeypatch.setattr(server, "send_next_offer_reminder", promemoria)
    monkeypatch.setattr(server, "send_offer_expired", scaduta)
    monkeypatch.setattr(server, "send_merchant_approved", approvata)
    monkeypatch.delenv("ADMIN_NOTIFY_EMAIL", raising=False)
    monkeypatch.delenv("ADMIN_EMAIL", raising=False)
    monkeypatch.delenv("MERCHANT_PAYMENT_REQUIRED", raising=False)
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
        await server.db.reminder_claims.create_index("key", unique=True)

        async def admin():
            return {"id": "admin", "role": "admin"}
        server.app.dependency_overrides[server.require_admin_master] = admin
        try:
            transport = httpx.ASGITransport(app=server.app)
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
                await test_body(c)
                await server.attendi_lavori_in_background()
        finally:
            server.app.dependency_overrides.pop(server.require_admin_master, None)
    asyncio.run(main())


async def negozio(nome="Negozio di prova"):
    uid = str(uuid.uuid4())
    email = f"merchant.{uid[:8]}@example.com"
    await server.db.users.insert_one({
        "id": uid, "email": email, "name": "Prova", "role": "merchant", "shop_name": nome,
        "zone": "Garbatella", "category": "Pizzeria", "approved": True,
        "created_at": datetime.now(timezone.utc).isoformat()})
    return {"id": uid, "email": email, "h": {"Authorization": f"Bearer {server.create_token(uid, email)}"}}


async def cliente():
    uid = str(uuid.uuid4())
    email = f"cliente.{uid[:8]}@example.com"
    await server.db.users.insert_one({"id": uid, "email": email, "name": "Giulia Prova", "role": "client"})
    return {"id": uid, "h": {"Authorization": f"Bearer {server.create_token(uid, email)}"}}


async def invia_e_approva(c, n, **campi):
    """Il negozio invia l'offerta e l'admin la approva oggi. Ritorna l'offerta come la vede il negozio."""
    r = await c.post("/api/merchants/me/discount", headers=n["h"], json={**SCONTO, **campi})
    assert r.status_code == 200, r.text
    r = await c.post(f"/api/admin/discounts/{r.json()['discount']['id']}/approve", json={})
    assert r.status_code == 200, r.text
    return (await c.get("/api/merchants/me/discount", headers=n["h"])).json()["discount"]


# ---------- La scelta della durata ----------

def test_la_durata_parte_dal_giorno_dell_approvazione(monkeypatch, posta):
    async def body(c):
        n = await negozio()
        giorno(monkeypatch, 2026, 11, 10)
        r = await c.post("/api/merchants/me/discount", headers=n["h"], json={**SCONTO, "duration_days": 7})
        assert r.status_code == 200, r.text
        d = r.json()["discount"]
        # in revisione: nessuna data, non è bloccata, e si legge la durata scelta
        assert d["valid_until"] is None and d["locked"] is False and d["durata"] == "7 giorni"
        giorno(monkeypatch, 2026, 11, 14)   # l'admin approva quattro giorni dopo: i 7 giorni partono da qui
        assert (await c.post(f"/api/admin/discounts/{d['id']}/approve", json={})).status_code == 200
        d = (await c.get("/api/merchants/me/discount", headers=n["h"])).json()["discount"]
        assert d["valid_from"] == "2026-11-14" and d["valid_until"] == "2026-11-20"
        assert d["days_left"] == 7 and d["locked"] is True and d["no_end"] is False
        pubblica = (await c.get("/api/discounts")).json()["discounts"][0]
        assert pubblica["valid_until"] == "2026-11-20" and pubblica["days_left"] == 7
    run(body)
    assert posta["approvata"] == [{"title": "Pizza + bibita", "fino_al": "20 novembre", "parte_il": ""}]


def test_senza_scelta_vale_trenta_giorni(monkeypatch, posta):
    giorno(monkeypatch, 2026, 11, 14)

    async def body(c):
        d = await invia_e_approva(c, await negozio())
        assert d["valid_from"] == "2026-11-14" and d["valid_until"] == "2026-12-13" and d["durata"] == "30 giorni"
    run(body)


def test_data_di_fine_scelta_dal_negozio(monkeypatch, posta):
    giorno(monkeypatch, 2026, 11, 14)

    async def body(c):
        n = await negozio()
        d = await invia_e_approva(c, n, end_date="2026-11-30")
        assert d["valid_until"] == "2026-11-30" and d["days_left"] == 17
        # data già passata, data illeggibile, data oltre il massimo: il modulo le rifiuta
        m = await negozio("Altro")
        for fine in ("2026-11-13", "trenta novembre", "2027-03-01"):
            r = await c.post("/api/merchants/me/discount", headers=m["h"], json={**SCONTO, "end_date": fine})
            assert r.status_code == 422, (fine, r.text)
    run(body)


def test_data_di_fine_passata_al_momento_dell_approvazione(monkeypatch, posta):
    async def body(c):
        n = await negozio()
        giorno(monkeypatch, 2026, 11, 14)
        r = await c.post("/api/merchants/me/discount", headers=n["h"], json={**SCONTO, "end_date": "2026-11-16"})
        did = r.json()["discount"]["id"]
        giorno(monkeypatch, 2026, 11, 18)   # l'admin arriva tardi: la data scelta è già passata
        r = await c.post(f"/api/admin/discounts/{did}/approve", json={})
        assert r.status_code == 409 and "già passato" in r.json()["detail"]
        assert (await server.db.discounts.find_one({"id": did}))["approval_status"] == "pending"
    run(body)


def test_massimi_e_senza_scadenza_solo_per_l_omaggio(monkeypatch, posta):
    giorno(monkeypatch, 2026, 11, 14)

    async def body(c):
        n = await negozio()
        # uno sconto dura al massimo 90 giorni e ha sempre una fine
        for campi in ({"duration_days": 91}, {"duration_days": 0}, {"open_ended": True}):
            r = await c.post("/api/merchants/me/discount", headers=n["h"], json={**SCONTO, **campi})
            assert r.status_code == 422, (campi, r.text)
        d = await invia_e_approva(c, n, duration_days=90)
        assert d["valid_until"] == "2027-02-11"
        # un omaggio può durare di più, o non avere scadenza
        m = await negozio("Enoteca")
        r = await c.post("/api/merchants/me/discount", headers=m["h"], json={**OMAGGIO, "duration_days": 366})
        assert r.status_code == 422
        r = await c.post("/api/merchants/me/discount", headers=m["h"], json={**OMAGGIO, "open_ended": True})
        assert r.status_code == 200 and r.json()["discount"]["durata"] == "senza scadenza"
        await c.post(f"/api/admin/discounts/{r.json()['discount']['id']}/approve", json={})
        o = (await c.get("/api/merchants/me/discount", headers=m["h"])).json()["discount"]
        assert o["valid_until"] is None and o["no_end"] is True and o["locked"] is True and o["days_left"] is None
        cfg = (await c.get("/api/config/public")).json()["offer_duration"]
        assert cfg == {"default_days": 30, "max_days_sconto": 90, "max_days_omaggio": 365}
    run(body)
    assert posta["approvata"][-1]["fino_al"] == ""   # senza scadenza: l'email non promette una data


# ---------- Blocco e «Prolunga» ----------

def test_offerta_online_bloccata_fino_alla_fine(monkeypatch, posta):
    async def body(c):
        n = await negozio()
        giorno(monkeypatch, 2026, 11, 14)
        await invia_e_approva(c, n, duration_days=7)
        giorno(monkeypatch, 2026, 11, 20)   # ultimo giorno: ancora bloccata e ancora online
        r = await c.post("/api/merchants/me/discount", headers=n["h"], json=SCONTO)
        assert r.status_code == 423 and "prolungarla" in r.json()["detail"]
        assert len((await c.get("/api/discounts")).json()["discounts"]) == 1
        giorno(monkeypatch, 2026, 11, 21, h=0)
        assert (await server._run_cambio_offerte())["expired"] == 1
        st = (await c.get("/api/merchants/me/renewal-status", headers=n["h"])).json()
        assert st["current_expired"] is True and st["current_active"] is False
        r = await c.post("/api/merchants/me/discount", headers=n["h"], json={**SCONTO, "duration_days": 14})
        assert r.status_code == 200 and r.json()["discount"]["approval_status"] == "pending"
    run(body)
    assert len(posta["scaduta"]) == 1


def test_prolunga_senza_nuova_approvazione(monkeypatch, posta):
    async def body(c):
        n = await negozio()
        giorno(monkeypatch, 2026, 11, 14)
        await invia_e_approva(c, n, duration_days=30)            # fino al 13 dicembre
        giorno(monkeypatch, 2026, 12, 10)
        st = (await c.get("/api/merchants/me/renewal-status", headers=n["h"])).json()
        assert st["expiring"] is True and st["days_left"] == 4 and st["max_extend_days"] == 60
        await c.post("/api/merchants/me/no-renew", json={"no_renew": True}, headers=n["h"])
        r = await c.post("/api/merchants/me/discount/extend", headers=n["h"], json={"days": 30})
        assert r.status_code == 200, r.text
        d = r.json()["discount"]
        # stessa offerta, sempre approvata e online, con la data nuova; «Non rinnovo» decade
        assert d["approval_status"] == "approved" and d["valid_until"] == "2027-01-12" and d["valid_from"] == "2026-11-14"
        st = (await c.get("/api/merchants/me/renewal-status", headers=n["h"])).json()
        assert st["expiring"] is False and st["no_renew"] is False and st["max_extend_days"] == 30
        # in tutto non più di 90 giorni dal giorno in cui è andata online (11 febbraio)
        r = await c.post("/api/merchants/me/discount/extend", headers=n["h"], json={"days": 31})
        assert r.status_code == 409 and "11 febbraio" in r.json()["detail"]
        assert (await c.post("/api/merchants/me/discount/extend", headers=n["h"], json={"days": 30})).status_code == 200
        r = await c.post("/api/merchants/me/discount/extend", headers=n["h"], json={"days": 1})
        assert r.status_code == 409 and "prossima offerta" in r.json()["detail"]
    run(body)


def test_prolunga_solo_con_offerta_online_e_con_una_fine(monkeypatch, posta):
    giorno(monkeypatch, 2026, 11, 14)

    async def body(c):
        n = await negozio()
        assert (await c.post("/api/merchants/me/discount/extend", headers=n["h"], json={"days": 7})).status_code == 409
        r = await c.post("/api/merchants/me/discount", headers=n["h"], json=SCONTO)   # in revisione: non è online
        assert (await c.post("/api/merchants/me/discount/extend", headers=n["h"], json={"days": 7})).status_code == 409
        m = await negozio("Enoteca")
        r = await c.post("/api/merchants/me/discount", headers=m["h"], json={**OMAGGIO, "open_ended": True})
        await c.post(f"/api/admin/discounts/{r.json()['discount']['id']}/approve", json={})
        r = await c.post("/api/merchants/me/discount/extend", headers=m["h"], json={"days": 7})
        assert r.status_code == 409 and "non ha una scadenza" in r.json()["detail"]
        # serve l'accesso da commerciante
        cl = await cliente()
        assert (await c.post("/api/merchants/me/discount/extend", headers=cl["h"], json={"days": 7})).status_code == 403
    run(body)


# ---------- Prossima offerta ----------

def test_prossima_offerta_senza_finestra_parte_alla_fine(monkeypatch, posta):
    async def body(c):
        n = await negozio()
        giorno(monkeypatch, 2026, 11, 14)
        # senza un'offerta online la prossima non si prepara
        assert (await c.post("/api/merchants/me/next-discount", headers=n["h"], json=SCONTO)).status_code == 423
        await invia_e_approva(c, n, duration_days=14)            # fino al 27 novembre
        giorno(monkeypatch, 2026, 11, 15)                        # il giorno dopo: nessuna finestra da aspettare
        prossima = {**SCONTO, "title": "Pizza del mese", "duration_days": 7}
        r = await c.post("/api/merchants/me/next-discount", headers=n["h"], json=prossima)
        assert r.status_code == 200, r.text
        assert r.json()["window"]["starts_on"] == "2026-11-28" and r.json()["next_discount"]["durata"] == "7 giorni"
        # una data di fine prima della partenza non ha senso
        r2 = await c.post("/api/merchants/me/next-discount", headers=n["h"], json={**prossima, "end_date": "2026-11-20"})
        assert r2.status_code == 422 and "28 novembre" in r2.json()["detail"]
        nid = r.json()["next_discount"]["id"]
        r = await c.post(f"/api/admin/next-offers/{nid}/approve", json={})
        assert r.status_code == 200 and r.json()["online"] is False
        assert posta["approvata"][-1] == {"title": "Pizza del mese", "fino_al": "", "parte_il": "28 novembre"}
        # fino al 27 resta online la prima; la notte dopo subentra la prossima, con i suoi 7 giorni
        giorno(monkeypatch, 2026, 11, 27, h=23)
        assert (await server._run_cambio_offerte())["promoted"] == 0
        assert (await c.get("/api/discounts")).json()["discounts"][0]["title"] == "Pizza + bibita"
        giorno(monkeypatch, 2026, 11, 28, h=0)
        assert (await server._run_cambio_offerte())["promoted"] == 1
        d = (await c.get("/api/merchants/me/discount", headers=n["h"])).json()["discount"]
        assert d["title"] == "Pizza del mese" and d["valid_from"] == "2026-11-28" and d["valid_until"] == "2026-12-04"
        arch = (await c.get("/api/merchants/me/archive", headers=n["h"])).json()["archivio"]
        assert arch[0]["title"] == "Pizza + bibita" and arch[0]["stato"] == "Scaduta"
        assert arch[0]["valid_from"] == "2026-11-14" and arch[0]["valid_until"] == "2026-11-27"
    run(body)
    assert posta["scaduta"] == []


def test_prossima_offerta_dopo_un_omaggio_senza_scadenza_va_online_subito(monkeypatch, posta):
    giorno(monkeypatch, 2026, 11, 14)

    async def body(c):
        n = await negozio("Enoteca")
        r = await c.post("/api/merchants/me/discount", headers=n["h"], json={**OMAGGIO, "open_ended": True})
        await c.post(f"/api/admin/discounts/{r.json()['discount']['id']}/approve", json={})
        st = (await c.get("/api/merchants/me/next-discount", headers=n["h"])).json()["window"]
        assert st["open"] is True and st["senza_scadenza"] is True and st["starts_on"] is None
        r = await c.post("/api/merchants/me/next-discount", headers=n["h"], json={**SCONTO, "duration_days": 14})
        assert r.status_code == 200, r.text
        # finché la prossima non è approvata l'omaggio resta online, anche dopo il lavoro della notte
        assert (await server._run_cambio_offerte(force=True))["promoted"] == 0
        assert (await c.get("/api/discounts")).json()["discounts"][0]["title"] == "Calice di benvenuto"
        r = await c.post(f"/api/admin/next-offers/{r.json()['next_discount']['id']}/approve", json={})
        assert r.status_code == 200 and r.json()["online"] is True
        d = (await c.get("/api/merchants/me/discount", headers=n["h"])).json()["discount"]
        assert d["title"] == "Pizza + bibita" and d["valid_from"] == "2026-11-14" and d["valid_until"] == "2026-11-27"
        assert await server.db.next_discounts.count_documents({}) == 0
    run(body)
    assert posta["approvata"][-1] == {"title": "Pizza + bibita", "fino_al": "27 novembre", "parte_il": ""}


def test_elenco_admin_delle_prossime_offerte(monkeypatch, posta):
    giorno(monkeypatch, 2026, 11, 14)

    async def body(c):
        a = await negozio("A in scadenza")
        await invia_e_approva(c, a, duration_days=5)             # fino al 18: mancano 5 giorni
        b = await negozio("B con prossima")
        await invia_e_approva(c, b, duration_days=30)
        await c.post("/api/merchants/me/next-discount", headers=b["h"], json=SCONTO)
        await negozio("C senza niente")                          # niente online e niente in arrivo: non compare
        r = (await c.get("/api/admin/next-offers")).json()
        assert [x["shop_name"] for x in r["rows"]] == ["B con prossima", "A in scadenza"]
        assert r["summary"]["pending"] == 1 and r["summary"]["missing"] == 1 and r["summary"]["expiring"] == 1
        riga_a = r["rows"][1]
        assert riga_a["expiring"] is True and riga_a["current_offer"]["days_left"] == 5
        assert riga_a["current_offer"]["valid_until_label"] == "18 novembre"
        assert r["rows"][0]["starts_on_label"] == "14 dicembre"
    run(body)


# ---------- Promemoria per le offerte corte ----------

def test_offerta_di_una_settimana_niente_promemoria_dei_sette_giorni(monkeypatch, posta):
    async def body(c):
        n = await negozio()
        giorno(monkeypatch, 2026, 11, 14)
        await invia_e_approva(c, n, duration_days=7)             # dal 14 al 20
        for g in range(14, 21):
            giorno(monkeypatch, 2026, 11, g)
            await server._run_next_offer_reminders()
            await server._run_next_offer_reminders()
    run(body)
    # niente «mancano 7 giorni» il primo giorno: solo 3 giorni prima e l'ultimo giorno
    assert posta["promemoria"] == [("20 novembre", 3, True), ("20 novembre", 1, True)]


def test_dopo_la_proroga_i_promemoria_ripartono(monkeypatch, posta):
    async def body(c):
        n = await negozio()
        giorno(monkeypatch, 2026, 11, 14)
        await invia_e_approva(c, n, duration_days=30)            # fino al 13 dicembre
        giorno(monkeypatch, 2026, 12, 7)
        assert (await server._run_next_offer_reminders())["sent"] == 1
        await c.post("/api/merchants/me/discount/extend", headers=n["h"], json={"days": 60})   # fino all'11 febbraio
        giorno(monkeypatch, 2026, 12, 11)
        assert (await server._run_next_offer_reminders())["sent"] == 0
        giorno(monkeypatch, 2027, 2, 5)
        assert (await server._run_next_offer_reminders())["sent"] == 1
    run(body)
    # all'ultimo promemoria l'offerta ha già raggiunto i 90 giorni: non si può più prolungare
    assert posta["promemoria"] == [("13 dicembre", 7, True), ("11 febbraio", 7, False)]


# ---------- Codici dei clienti ----------

def test_codice_non_usato_scade_con_l_offerta(monkeypatch, posta):
    async def body(c):
        n = await negozio()
        cl = await cliente()
        giorno(monkeypatch, 2026, 11, 14)
        d = await invia_e_approva(c, n, duration_days=7)         # fino al 20 novembre
        r = await c.post(f"/api/redemptions/create/{d['id']}", headers=cl["h"])
        assert r.status_code == 200, r.text
        codice = r.json()["redemption"]["code"]

        def token():
            slot = server.current_slot()
            return f"{codice}.{slot}.{server._rotating_hmac(codice, slot)}"

        giorno(monkeypatch, 2026, 11, 20, h=23)                  # ultimo giorno: vale
        assert (await c.get("/api/qr/verify", params={"token": token()})).json()["valid"] is True
        giorno(monkeypatch, 2026, 11, 21, h=1)                   # dopo mezzanotte, prima delle 02:00: vale ancora
        await server._run_cambio_offerte()
        assert (await c.get("/api/qr/verify", params={"token": token()})).json()["valid"] is True
        giorno(monkeypatch, 2026, 11, 21, h=2)                   # dalle 02:00 non vale più
        r = (await c.get("/api/qr/verify", params={"token": token()})).json()
        assert r["valid"] is False and "terminata" in r["reason"]
        v = await c.post("/api/redemptions/verify", json={"code": codice}, headers=n["h"])
        assert v.status_code == 400 and "terminata" in v.json()["detail"]
        # e non se ne possono chiedere di nuovi
        assert (await c.post(f"/api/redemptions/create/{d['id']}", headers=cl["h"])).status_code == 403
    run(body)


def test_codice_resta_valido_se_parte_la_prossima_offerta(monkeypatch, posta):
    async def body(c):
        n = await negozio()
        cl = await cliente()
        giorno(monkeypatch, 2026, 11, 14)
        d = await invia_e_approva(c, n, duration_days=7)
        codice = (await c.post(f"/api/redemptions/create/{d['id']}", headers=cl["h"])).json()["redemption"]["code"]
        r = await c.post("/api/merchants/me/next-discount", headers=n["h"], json={**SCONTO, "title": "Nuova"})
        await c.post(f"/api/admin/next-offers/{r.json()['next_discount']['id']}/approve", json={})
        giorno(monkeypatch, 2026, 11, 22)
        assert (await server._run_cambio_offerte())["promoted"] == 1
        slot = server.current_slot()
        r = (await c.get("/api/qr/verify", params={"token": f"{codice}.{slot}.{server._rotating_hmac(codice, slot)}"})).json()
        assert r["valid"] is True, r   # il negozio ha un'offerta online: il codice del mese vale per quella
    run(body)


# ---------- Archivio ----------

def test_riuso_dall_archivio_senza_la_vecchia_data(monkeypatch, posta):
    async def body(c):
        n = await negozio()
        giorno(monkeypatch, 2026, 11, 14)
        await invia_e_approva(c, n, end_date="2026-11-23")       # 10 giorni
        giorno(monkeypatch, 2026, 11, 24, h=0)
        await server._run_cambio_offerte()
        arch = (await c.get("/api/merchants/me/archive", headers=n["h"])).json()["archivio"]
        voce = (await c.get(f"/api/merchants/me/archive/{arch[0]['archivio_id']}", headers=n["h"])).json()["offerta"]
        # la data di allora è passata: si ripropone la stessa durata in giorni
        assert voce["end_date"] is None and voce["duration_days"] == 10
        r = await c.post("/api/merchants/me/discount", headers=n["h"], json={
            k: v for k, v in voce.items() if v is not None})
        assert r.status_code == 200, r.text
    run(body)
