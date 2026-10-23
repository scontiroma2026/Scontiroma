"""Prova del cambio mese (punto 17): 31/10 -> 01/11 e gli altri passaggi delicati (30/11 -> 01/12,
31/12 -> 01/01, fine febbraio anche bisestile, 30/09 -> 01/10 con l'ora legale), sempre con l'orologio finto
all'ora di Roma. Controlla: offerta del mese che scade, offerta del mese dopo che diventa quella corrente,
«Non rinnovo» rispettato, nessun addebito con gli interruttori spenti, nessun doppio invio di email
(promemoria, avviso di scadenza, riepilogo per l'admin, riepilogo settimanale, avvisi ai preferiti).

Database locale finto (mongomock), nessuna email vera, nessuna chiamata a Stripe/PayPal.
"""
import asyncio
import os
import uuid
from datetime import date, datetime, timedelta, timezone
from urllib.parse import urlparse
from zoneinfo import ZoneInfo

import pytest

MONGO_URL = os.environ.setdefault("TEST_MONGO_URL", os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
_u = urlparse(MONGO_URL)
if not (_u.scheme == "mongomock" or (_u.scheme == "mongodb" and (_u.hostname or "") in ("localhost", "127.0.0.1", "::1"))):
    pytest.exit(f"MONGO_URL non locale ({_u.scheme}://{_u.hostname}): test rifiutati.", returncode=2)
USE_MOCK = _u.scheme == "mongomock"
DB_NAME = "e2e_unit_cambio_mese"

os.environ["MONGO_URL"] = "mongodb://localhost:27017" if USE_MOCK else MONGO_URL
os.environ.setdefault("DB_NAME", DB_NAME)
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")
os.environ["RESEND_API_KEY"] = ""

import httpx  # noqa: E402

import prova_pagamenti as pp  # noqa: E402
import server  # noqa: E402

ROME = ZoneInfo("Europe/Rome")
UTC = timezone.utc

# (ultimo giorno del mese, primo giorno del mese dopo)
TRANSIZIONI = [
    ("2026-10-31", "2026-11-01"),   # il caso del lancio
    ("2026-11-30", "2026-12-01"),
    ("2026-12-31", "2027-01-01"),   # cambio d'anno
    ("2027-02-28", "2027-03-01"),   # febbraio normale
    ("2028-02-29", "2028-03-01"),   # febbraio bisestile
    ("2026-09-30", "2026-10-01"),   # ora legale (CEST, UTC+2)
]


class _Finto(datetime):
    """`datetime` con l'istante «adesso» deciso dal test (stesso istante per UTC e per Roma)."""
    _ora = datetime(2026, 10, 1, 12, 0, tzinfo=UTC)

    @classmethod
    def now(cls, tz=None):
        return cls._ora.astimezone(tz) if tz else cls._ora.replace(tzinfo=None)


@pytest.fixture
def orologio(monkeypatch):
    monkeypatch.setattr(server, "datetime", _Finto)

    def imposta_roma(giorno: str, h=12, mi=0, s=0):
        y, m, d = (int(x) for x in giorno.split("-"))
        monkeypatch.setattr(_Finto, "_ora", datetime(y, m, d, h, mi, s, tzinfo=ROME).astimezone(UTC))

    def imposta_utc(iso: str):
        monkeypatch.setattr(_Finto, "_ora", datetime.fromisoformat(iso).astimezone(UTC))

    imposta_roma.utc = imposta_utc
    return imposta_roma


@pytest.fixture
def posta(monkeypatch):
    """Registra le email invece di inviarle; con gli interruttori spenti nessuna chiamata di pagamento."""
    monkeypatch.setenv("ADMIN_NOTIFY_EMAIL", "admin@example.com")
    monkeypatch.delenv("MERCHANT_PAYMENT_REQUIRED", raising=False)
    monkeypatch.delenv("CLIENT_SUBSCRIPTION_REQUIRED", raising=False)
    inviate = {"promemoria": [], "scaduta": [], "admin": [], "settimanale": [], "preferiti": [], "prova": [], "grace": []}

    async def promemoria(to, name, shop, label, days_left):
        await asyncio.sleep(0)  # cede il turno: così due passaggi in parallelo si incrociano davvero
        inviate["promemoria"].append((to, days_left))

    async def scaduta(to, name, shop, no_renew=False):
        inviate["scaduta"].append((to, no_renew))

    async def admin(to, label, pending, rejected, missing, no_renew):
        await asyncio.sleep(0)
        inviate["admin"].append({"label": label, "pending": pending, "rejected": rejected,
                                 "missing": missing, "no_renew": no_renew})

    async def settimanale(to, riepilogo):
        await asyncio.sleep(0)
        inviate["settimanale"].append(riepilogo["periodo"]["etichetta"])

    async def preferiti(to, *a, **k):
        inviate["preferiti"].append(to)

    async def prova(*a, **k):
        inviate["prova"].append(a)

    async def grace(*a, **k):
        inviate["grace"].append(a)

    monkeypatch.setattr(server, "send_next_offer_reminder", promemoria)
    monkeypatch.setattr(server, "send_offer_expired", scaduta)
    monkeypatch.setattr(server, "send_admin_month_summary", admin)
    monkeypatch.setattr(server, "send_admin_riepilogo_settimanale", settimanale)
    monkeypatch.setattr(server, "send_preferito_nuova_offerta", preferiti)
    monkeypatch.setattr(server, "send_merchant_trial_day30", prova)
    monkeypatch.setattr(server, "send_merchant_first_payment_reminder", prova)
    monkeypatch.setattr(server, "send_grace_period_reminder", grace)

    # Nessuna chiamata di pagamento deve partire: se parte, il test fallisce.
    def vietato(*a, **k):
        raise AssertionError("chiamata di pagamento inattesa con gli interruttori spenti")

    async def vietato_async(*a, **k):
        vietato()

    monkeypatch.setattr(server.stripe.checkout.Session, "create", vietato)
    monkeypatch.setattr(server.stripe.Customer, "create", vietato)
    monkeypatch.setattr(server.stripe.Price, "create", vietato)
    monkeypatch.setattr(server.stripe.Subscription, "modify", vietato)
    for nome in ("ensure_plan", "ensure_plan_negozio", "get_subscription", "cancel_subscription"):
        monkeypatch.setattr(server.paypal_service, nome, vietato_async)
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
            await server.attendi_lavori_in_background()  # nessun lavoro in background lasciato a metà
    asyncio.run(main())


def _token(uid, email):
    """Accesso valido per tutto il test: la libreria JWT controlla la scadenza con l'orologio vero, non con quello finto."""
    import jwt
    exp = datetime.now(timezone.utc) + timedelta(days=3650)   # `datetime` qui è quello vero
    return jwt.encode({"sub": uid, "email": email, "type": "access", "exp": exp}, server.JWT_SECRET, algorithm=server.JWT_ALGORITHM)


async def negozio(nome, mese_corrente=None, titolo=None, prossimo=None, no_renew_mese=None):
    """Un negozio con (se richiesto) l'offerta approvata del mese corrente e/o quella del mese dopo."""
    uid = str(uuid.uuid4())
    email = f"negozio.{uid[:8]}@example.com"
    doc = {"id": uid, "email": email, "name": "Prova", "role": "merchant", "shop_name": nome,
           "zone": "Garbatella", "category": "Ristorante", "approved": True,
           "created_at": datetime.now(UTC).isoformat()}
    if no_renew_mese:
        doc["no_renew_month"] = no_renew_mese
    await server.db.users.insert_one(doc)
    ora = "2026-01-10T10:00:00+00:00"
    if mese_corrente:
        await server.db.discounts.insert_one({
            "id": str(uuid.uuid4()), "merchant_id": uid, "title": titolo or f"Offerta {nome}", "description": "x",
            "original_price": 20.0, "discounted_price": 10.0, "active": True, "approval_status": "approved",
            "locked_month": mese_corrente, "created_at": ora, "updated_at": ora})
    if prossimo:
        mese_dopo, stato = prossimo
        await server.db.next_discounts.insert_one({
            "id": str(uuid.uuid4()), "merchant_id": uid, "target_month": mese_dopo, "title": f"Prossima {nome}",
            "description": "x", "original_price": 20.0, "discounted_price": 12.0, "active": True,
            "approval_status": stato, "created_at": ora, "updated_at": ora})
    return {"id": uid, "email": email, "h": {"Authorization": f"Bearer {_token(uid, email)}"}}


async def titoli_pubblici(c):
    r = await c.get("/api/discounts")
    assert r.status_code == 200, r.text
    return {d["title"] for d in r.json()["discounts"]}


def giorni_finestra(ultimo: str):
    y, m, d = (int(x) for x in ultimo.split("-"))
    return [f"{y:04d}-{m:02d}-{g:02d}" for g in range(d - 6, d + 1)]


# ============================================================
# Il confine di mezzanotte è quello di Roma, con ora solare e ora legale
# ============================================================

@pytest.mark.parametrize("prima,dopo,mese_prima,mese_dopo", [
    ("2026-10-31T22:59:59+00:00", "2026-10-31T23:00:00+00:00", "2026-10", "2026-11"),   # CET, UTC+1
    ("2026-11-30T22:59:59+00:00", "2026-11-30T23:00:00+00:00", "2026-11", "2026-12"),
    ("2026-12-31T22:59:59+00:00", "2026-12-31T23:00:00+00:00", "2026-12", "2027-01"),
    ("2027-02-28T22:59:59+00:00", "2027-02-28T23:00:00+00:00", "2027-02", "2027-03"),
    ("2028-02-29T22:59:59+00:00", "2028-02-29T23:00:00+00:00", "2028-02", "2028-03"),
    ("2026-09-30T21:59:59+00:00", "2026-09-30T22:00:00+00:00", "2026-09", "2026-10"),   # CEST, UTC+2
])
def test_mezzanotte_di_roma(orologio, prima, dopo, mese_prima, mese_dopo):
    orologio.utc(prima)
    assert server.current_month_key() == mese_prima
    assert server.next_month_key() == mese_dopo
    inizio_prima = server._month_start_iso()
    orologio.utc(dopo)
    assert server.current_month_key() == mese_dopo
    # il mese nuovo comincia a mezzanotte di Roma (in UTC: 23:00 o 22:00 del giorno prima), non a mezzanotte UTC
    inizio_dopo = server._month_start_iso()
    assert inizio_dopo > inizio_prima
    assert datetime.fromisoformat(inizio_dopo) == datetime.fromisoformat(dopo)


def test_pianificazione_dei_lavori_a_ora_di_roma(orologio):
    """Il passaggio parte l'1 alle 00:05 di Roma (anche con ora legale) e perdona un ritardo di ore."""
    async def body(_c):
        server._start_scheduler()
        try:
            # Ogni lavoro pianificato deve avere il fuso di Roma nel suo orario (il fuso dello scheduler non
            # basta: un CronTrigger senza fuso usa quello del computer, su Render UTC = 1-2 ore di ritardo).
            for j in server._scheduler.get_jobs():
                assert str(j.trigger.timezone) == "Europe/Rome", j.id
            job = server._scheduler.get_job("month_rollover")
            assert job.misfire_grace_time == 6 * 3600 and job.coalesce is True
            for da, atteso in (("2026-10-20T10:00:00+00:00", "2026-10-31T23:05:00+00:00"),   # 01/11 00:05 CET
                               ("2026-09-20T10:00:00+00:00", "2026-09-30T22:05:00+00:00"),   # 01/10 00:05 CEST
                               ("2026-12-20T10:00:00+00:00", "2026-12-31T23:05:00+00:00"),   # 01/01 00:05 CET
                               ("2027-02-10T10:00:00+00:00", "2027-02-28T23:05:00+00:00")):  # 01/03 00:05 CET
                prossimo = job.trigger.get_next_fire_time(None, datetime.fromisoformat(da))
                assert prossimo.astimezone(UTC) == datetime.fromisoformat(atteso)
            promemoria = server._scheduler.get_job("next_offer_reminders_daily")
            assert promemoria.trigger.get_next_fire_time(None, datetime(2026, 10, 31, 6, 0, tzinfo=UTC)) \
                .astimezone(ROME).strftime("%H:%M") == "09:30"
            lunedi = server._scheduler.get_job("riepilogo_settimanale")
            assert lunedi.trigger.get_next_fire_time(None, datetime(2026, 10, 31, 6, 0, tzinfo=UTC)) \
                .astimezone(ROME).strftime("%a %d/%m %H:%M") == "Mon 02/11 08:00"
        finally:
            server._stop_scheduler()
    run(body)


# ============================================================
# Il passaggio di mese, per ogni confine
# ============================================================

@pytest.mark.parametrize("ultimo,primo", TRANSIZIONI)
def test_passaggio_di_mese_completo(orologio, posta, ultimo, primo):
    corrente, dopo = ultimo[:7], primo[:7]

    async def body(c):
        a = await negozio("A scade", corrente)                                    # nessuna offerta nuova: scade
        b = await negozio("B rinnova", corrente, prossimo=(dopo, "approved"))     # nuova approvata: subentra
        cc = await negozio("C non rinnova", corrente)                             # sceglie «Non rinnovo»
        d = await negozio("D in attesa", corrente, prossimo=(dopo, "pending"))    # nuova non ancora approvata
        e = await negozio("E nuovo", None, prossimo=(dopo, "approved"))           # prima offerta, già approvata

        # --- ultimi 7 giorni del mese: un promemoria per fase (7, 3, 1 giorni), mai doppioni ---
        for giorno in giorni_finestra(ultimo):
            orologio(giorno, 9, 30)
            if giorno == giorni_finestra(ultimo)[0]:   # appena si apre la finestra C sceglie «Non rinnovo»
                r = await c.post("/api/merchants/me/no-renew", json={"no_renew": True}, headers=cc["h"])
                assert r.status_code == 200 and r.json()["no_renew"] is True
            await server._run_next_offer_reminders()
            await server._run_next_offer_reminders()   # lo stesso giorno, due volte: nessun doppione
        assert {to for to, _ in posta["promemoria"]} == {a["email"]}, "promemoria solo ad A"
        assert [g for _, g in posta["promemoria"]] == [7, 3, 1]
        assert len(posta["admin"]) == 1, "un solo riepilogo per l'admin"
        assert posta["admin"][0]["missing"] == ["A scade"]
        assert posta["admin"][0]["no_renew"] == ["C non rinnova"]
        assert posta["admin"][0]["pending"] == ["D in attesa"]

        # --- ultimo secondo del mese: le offerte del mese si vedono ancora ---
        orologio(ultimo, 23, 59, 59)
        assert await titoli_pubblici(c) == {"Offerta A scade", "Offerta B rinnova", "Offerta C non rinnova", "Offerta D in attesa"}

        # --- 1° alle 00:05 di Roma: scattano insieme job e recupero all'avvio (e un terzo tentativo) ---
        orologio(primo, 0, 5)
        esiti = await asyncio.gather(server._run_month_rollover(), server._run_month_rollover())
        esiti.append(await server._run_month_rollover())
        eseguiti = [x for x in esiti if not x["skipped"]]
        assert len(eseguiti) == 1, esiti
        assert eseguiti[0]["month"] == dopo
        assert (eseguiti[0]["promoted"], eseguiti[0]["migrated_pending"], eseguiti[0]["expired"]) == (2, 1, 2)
        await server.attendi_lavori_in_background()

        # offerte del mese dopo: B ed E sono online, A e C scadute, D aspetta l'approvazione
        assert await titoli_pubblici(c) == {"Prossima B rinnova", "Prossima E nuovo"}
        for chi in (b, e):
            doc = await server.db.discounts.find_one({"merchant_id": chi["id"]})
            assert doc["approval_status"] == "approved" and doc["locked_month"] == dopo and doc["active"] is True
        for chi in (a, cc):
            doc = await server.db.discounts.find_one({"merchant_id": chi["id"]})
            assert doc["approval_status"] == "expired" and doc["active"] is False and doc["locked_month"] is None
        doc_d = await server.db.discounts.find_one({"merchant_id": d["id"]})
        assert doc_d["approval_status"] == "pending" and doc_d["title"] == "Prossima D in attesa"
        assert await server.db.next_discounts.count_documents({}) == 0

        # archivio: ogni vecchia versione una sola volta
        motivi = sorted([x["archive_reason"] async for x in server.db.discounts_archive.find({})])
        assert motivi == sorted(["replaced_by_next_month"] * 2 + ["expired_no_replacement"] * 2)

        # email di scadenza: una sola a testa; C riceve quella con la scelta «Non rinnovo» rispettata
        assert sorted(posta["scaduta"]) == sorted([(a["email"], False), (cc["email"], True)])

        # il 1° la finestra è chiusa: niente promemoria né riepilogo
        orologio(primo, 9, 30)
        res = await server._run_next_offer_reminders()
        assert res == {"window_open": False, "sent": 0}
        assert len(posta["promemoria"]) == 3 and len(posta["admin"]) == 1

        # chi ha l'offerta nuova non può modificarla; chi è scaduto può caricarne una
        r = await c.post("/api/merchants/me/discount", headers=b["h"], json={
            "title": "Cambio", "description": "descrizione", "original_price": 20, "discounted_price": 10})
        assert r.status_code == 423
        r = await c.post("/api/merchants/me/discount", headers=a["h"], json={
            "title": "Di nuovo", "description": "descrizione", "original_price": 20, "discounted_price": 10})
        assert r.status_code == 200, r.text
        st = (await c.get("/api/merchants/me/renewal-status", headers=cc["h"])).json()
        assert st["current_expired"] is True and st["window"]["open"] is False and st["window"]["current_month"] == dopo
        d_b = (await c.get("/api/merchants/me/discount", headers=b["h"])).json()["discount"]
        assert d_b["locked_this_month"] is True

        # niente addebiti, niente pagamenti, nessun promemoria di prova o di grazia
        assert posta["prova"] == [] and posta["grace"] == []
        assert (await server._run_trial_emails())["skipped"] == "email_prova_spente"
        assert (await server._run_grace_reminders())["skipped"] == "subscription_not_required"
        for coll in ("merchant_payments", "merchant_subscriptions", "subscriptions", "renewal_events"):
            assert await server.db[coll].count_documents({}) == 0, coll
        for chi in (a, b, cc, d, e):
            m = await server.db.users.find_one({"id": chi["id"]})
            assert await server.offer_visible_for_payment(m) is True
    run(body)


def test_non_rinnovo_poi_il_mese_dopo_si_riparte(orologio, posta):
    """«Non rinnovo» vale per UN mese: dopo, chi ricarica un'offerta torna a ricevere i promemoria."""
    async def body(c):
        n = await negozio("Ex non rinnova", "2026-10")
        await c.post("/api/merchants/me/no-renew", json={"no_renew": True}, headers=n["h"])
        orologio("2026-11-01", 0, 5)
        await server._run_month_rollover()
        assert (await server.db.users.find_one({"id": n["id"]}))["no_renew_month"] == "2026-11"
        # a novembre il negozio carica e ottiene un'offerta nuova (approvata a mano dall'admin)
        await server.db.discounts.update_one({"merchant_id": n["id"]}, {"$set": {
            "approval_status": "approved", "active": True, "locked_month": "2026-11"}})
        for giorno in giorni_finestra("2026-11-30"):
            orologio(giorno, 9, 30)
            await server._run_next_offer_reminders()
        assert [g for _, g in posta["promemoria"]] == [7, 3, 1]
    run(body)


def test_non_rinnovo_non_vale_se_si_annulla_prima_della_fine(orologio, posta):
    async def body(c):
        n = await negozio("Ci ripensa", "2026-10")
        orologio("2026-10-29", 10)
        await c.post("/api/merchants/me/no-renew", json={"no_renew": True}, headers=n["h"])
        orologio("2026-10-31", 20)
        await c.post("/api/merchants/me/no-renew", json={"no_renew": False}, headers=n["h"])
        await server._run_next_offer_reminders()
        assert [g for _, g in posta["promemoria"]] == [1]
        orologio("2026-11-01", 0, 5)
        res = await server._run_month_rollover()
        assert res["expired"] == 1
    run(body)
    assert posta["scaduta"][0][1] is False


def test_server_spento_il_primo_riparte_e_recupera_una_volta(orologio, posta):
    """Se il server dormiva alle 00:05, al risveglio (anche ore dopo) il passaggio avviene una volta sola."""
    async def body(c):
        a = await negozio("A", "2026-10")
        b = await negozio("B", "2026-10", prossimo=("2026-11", "approved"))
        orologio("2026-11-01", 7, 40)
        assert (await server._run_month_rollover())["expired"] == 1
        assert (await server._run_month_rollover())["skipped"] is True
        assert await titoli_pubblici(c) == {"Prossima B"}
        assert len(posta["scaduta"]) == 1
    run(body)


def test_passaggio_fallito_si_puo_ritentare(orologio, posta, monkeypatch):
    async def body(_c):
        await negozio("A", "2026-10")
        orologio("2026-11-01", 0, 5)
        originale = server._archivia

        async def rotto(*a, **k):
            raise RuntimeError("database momentaneamente non raggiungibile")
        monkeypatch.setattr(server, "_archivia", rotto)
        with pytest.raises(RuntimeError):
            await server._run_month_rollover()
        assert await server.db.rollover_runs.count_documents({"month": "2026-11"}) == 0
        monkeypatch.setattr(server, "_archivia", originale)
        res = await server._run_month_rollover()
        assert res["skipped"] is False and res["expired"] == 1
    run(body)


def test_avviso_ai_preferiti_una_volta_per_mese(orologio, posta):
    async def body(c):
        b = await negozio("B", "2026-10", prossimo=("2026-11", "approved"))
        cid = str(uuid.uuid4())
        await server.db.users.insert_one({"id": cid, "email": "cliente@example.com", "name": "C", "role": "client",
                                          "preferiti": [b["id"]], "consents": {"avvisi_preferiti": True}})
        orologio("2026-11-01", 0, 5)
        await asyncio.gather(server._run_month_rollover(), server._run_month_rollover())
        await server.attendi_lavori_in_background()
        await server._run_month_rollover()
        await server.attendi_lavori_in_background()
    run(body)
    assert posta["preferiti"] == ["cliente@example.com"]


def test_promemoria_in_parallelo_non_si_duplicano(orologio, posta):
    """Due copie del server accese insieme (per esempio durante un aggiornamento) alle 9:30."""
    async def body(_c):
        await negozio("A", "2026-10")
        await negozio("B", "2026-10")
        orologio("2026-10-29", 9, 30)
        await asyncio.gather(*[server._run_next_offer_reminders() for _ in range(4)])
    run(body)
    assert len(posta["promemoria"]) == 2 and len(posta["admin"]) == 1


def test_promemoria_non_partito_si_ritenta(orologio, posta, monkeypatch):
    async def body(_c):
        n = await negozio("A", "2026-10")
        orologio("2026-10-25", 9, 30)

        async def rotto(*a, **k):
            raise RuntimeError("Resend non raggiungibile")
        buono = server.send_next_offer_reminder
        monkeypatch.setattr(server, "send_next_offer_reminder", rotto)
        assert (await server._run_next_offer_reminders())["sent"] == 0
        monkeypatch.setattr(server, "send_next_offer_reminder", buono)
        assert (await server._run_next_offer_reminders())["sent"] == 1
        assert (await server._run_next_offer_reminders())["sent"] == 0
    run(body)


# ============================================================
# Conteggi del mese all'ora di Roma (bug corretto: prima il mese cominciava a mezzanotte UTC)
# ============================================================

def test_conteggi_del_mese_seguono_roma(orologio, posta):
    async def body(c):
        n = await negozio("A", "2026-11")
        d = await server.db.discounts.find_one({"merchant_id": n["id"]})
        uid = str(uuid.uuid4())

        async def utilizzo(quando_utc):
            await server.db.redemptions.insert_one({
                "id": str(uuid.uuid4()), "code": uuid.uuid4().hex[:8], "user_id": uid, "discount_id": d["id"],
                "merchant_id": n["id"], "status": "redeemed", "month_key": "x", "redeemed_at": quando_utc})
        await utilizzo("2026-10-31T22:30:00+00:00")   # 23:30 del 31/10 a Roma: ottobre
        await utilizzo("2026-10-31T23:30:00+00:00")   # 00:30 del 01/11 a Roma: novembre
        await utilizzo("2026-11-01T09:00:00+00:00")   # novembre
        orologio("2026-11-01", 12)
        r = await c.get("/api/discounts")
        assert r.json()["discounts"][0]["sales_this_month"] == 2

        # archivio: l'offerta di ottobre conta solo gli utilizzi di ottobre (ora di Roma)
        ora = "2026-11-01T00:05:00+00:00"
        await server.db.discounts_archive.insert_one({
            "archivio_id": str(uuid.uuid4()), "id": d["id"], "merchant_id": n["id"], "title": "Ottobre",
            "locked_month": "2026-10", "archived_at": ora, "archive_reason": "expired_no_replacement"})
        arch = (await c.get("/api/merchants/me/archive", headers=n["h"])).json()["archivio"]
        assert arch[0]["mese"] == "2026-10" and arch[0]["utilizzi"] == 1
    run(body)


# ============================================================
# Riepilogo settimanale del lunedì a cavallo del mese e dell'anno
# ============================================================

@pytest.mark.parametrize("lunedi,etichetta", [
    ("2026-11-02", "26 ottobre – 1 novembre"),
    ("2026-11-30", "23 novembre – 29 novembre"),
    ("2026-12-07", "30 novembre – 6 dicembre"),
    ("2027-01-04", "28 dicembre – 3 gennaio"),
    ("2027-03-01", "22 febbraio – 28 febbraio"),
    ("2028-03-06", "28 febbraio – 5 marzo"),
])
def test_riepilogo_settimanale_una_volta_a_cavallo_del_mese(orologio, posta, lunedi, etichetta):
    async def body(_c):
        orologio(lunedi, 8, 0)
        esiti = await asyncio.gather(server._run_riepilogo_settimanale(), server._run_riepilogo_settimanale())
        assert sorted(e.get("skipped", "ok") for e in esiti) == ["gia_inviato", "ok"]
        assert (await server._run_riepilogo_settimanale())["skipped"] == "gia_inviato"
        # il lunedì dopo è un'altra settimana: una nuova email
        orologio((date.fromisoformat(lunedi) + timedelta(days=7)).isoformat(), 8, 0)
        assert (await server._run_riepilogo_settimanale())["sent"] == 1
    run(body)
    assert len(posta["settimanale"]) == 2 and posta["settimanale"][0] == etichetta


def test_riepilogo_settimanale_senza_pagamenti_con_interruttore_spento(orologio, posta):
    async def body(_c):
        await negozio("A", "2026-10")
        r = await server._riepilogo_settimanale(date(2026, 10, 26), date(2026, 11, 2))
        assert r["periodo"]["etichetta"] == "26 ottobre – 1 novembre"
        assert not (r.get("pagamenti") or {}).get("per_stato"), "nessun dato di pagamento con l'interruttore spento"
    run(body)


# ============================================================
# Prova gratuita e pagamenti (funzioni pure: nessun addebito) al confine del mese
# ============================================================

@pytest.mark.parametrize("pubblicata_utc,primo_pagamento", [
    ("2026-10-31T22:59:00+00:00", date(2027, 1, 1)),   # 31/10 23:59 Roma: giorno 31 -> tre mesi dopo
    ("2026-10-31T23:01:00+00:00", date(2027, 1, 1)),   # 01/11 00:01 Roma: giorno 1 -> due mesi dopo (stesso 1°)
    ("2026-12-31T22:59:00+00:00", date(2027, 3, 1)),   # fine d'anno
    ("2026-12-31T23:01:00+00:00", date(2027, 3, 1)),
    ("2027-02-28T22:59:00+00:00", date(2027, 5, 1)),
    ("2027-02-28T23:01:00+00:00", date(2027, 5, 1)),
    ("2026-11-11T22:59:00+00:00", date(2027, 1, 1)),   # 11/11 23:59 Roma: ultimo giorno «due mesi»
    ("2026-11-11T23:01:00+00:00", date(2027, 2, 1)),   # 12/11 00:01 Roma: già «tre mesi»
])
def test_inizio_pagamenti_ai_confini(pubblicata_utc, primo_pagamento):
    assert pp.billing_start_date(pubblicata_utc) == primo_pagamento
    assert pp.trial_end_date(pubblicata_utc) == primo_pagamento - timedelta(days=1)


def test_non_rinnovo_visibilita_a_fine_mese():
    """Con i pagamenti accesi (solo funzione pura): «Non rinnovo» tiene l'offerta fino all'ultimo giorno."""
    kw = dict(required=True, first_published_at="2026-05-02T10:00:00+00:00", pagamenti={}, tolleranza=5)
    # prova finita, nessun pagamento: senza disdetta l'offerta non è visibile
    assert pp.offer_visible_for_payment_core(oggi=date(2026, 10, 31), **kw) is False
    # con disdetta per novembre: visibile il 31/10, non più dal 1/11
    assert pp.offer_visible_for_payment_core(oggi=date(2026, 10, 31), no_renew_month="2026-11", **kw) is True
    assert pp.offer_visible_for_payment_core(oggi=date(2026, 11, 1), no_renew_month="2026-11", **kw) is False
    assert pp.offer_visible_for_payment_core(oggi=date(2026, 12, 31), no_renew_month="2027-01", **kw) is True
    assert pp.offer_visible_for_payment_core(oggi=date(2027, 1, 1), no_renew_month="2027-01", **kw) is False
    # interruttore spento: sempre visibile, qualunque cosa succeda
    assert pp.offer_visible_for_payment_core(required=False, first_published_at=None, pagamenti={},
                                             oggi=date(2026, 11, 1), tolleranza=5, no_renew_month="2026-11") is True


def test_pagamento_in_ritardo_vale_dal_mese_dopo_a_cavallo_d_anno():
    pagamenti = {"2026-12": "2026-12-20T10:00:00+00:00"}       # pagato il 20/12: oltre i 5 giorni di tolleranza
    f = "2026-05-02T10:00:00+00:00"
    assert pp.stato_pagamento(f, pagamenti, date(2026, 12, 21), 5)["fase"] == "da_pagare"
    assert pp.stato_pagamento(f, pagamenti, date(2027, 1, 1), 5)["fase"] == "pagato"    # vale per gennaio
    assert pp.stato_pagamento(f, pagamenti, date(2027, 1, 20), 5)["fase"] == "pagato"   # per tutto gennaio


# ============================================================
# Codice creato a fine mese: vale solo fino alle 02:00 (ora di Roma) del 1° giorno del mese dopo
# ============================================================

@pytest.mark.parametrize("creato,quando,valido", [
    ("2026-10", ("2026-10-31", 23, 59), True),    # ancora il mese di creazione
    ("2026-10", ("2026-11-01", 0, 1), True),      # dopo mezzanotte del 1°
    ("2026-10", ("2026-11-01", 1, 59), True),     # 01:59
    ("2026-10", ("2026-11-01", 2, 0), False),     # 02:00: scade
    ("2026-10", ("2026-11-01", 2, 1), False),     # 02:01
    ("2026-10", ("2026-11-01", 23, 59), False),
    ("2026-10", ("2026-11-02", 0, 0), False),
    ("2026-10", ("2026-12-01", 0, 30), False),    # il 1° ma di due mesi dopo: scade
    ("2026-09", ("2026-10-01", 1, 59), True),     # ora legale (CEST) a fine settembre
    ("2026-09", ("2026-10-01", 2, 0), False),
    ("2026-10", ("2026-10-25", 12, 0), True),     # giorno del cambio d'ora (fine ora legale): stesso mese
    ("2026-10", ("2026-10-25", 2, 30), True),     # 02:30 ambiguo del 25/10: stesso mese, nessun effetto
    ("2026-11", ("2026-12-01", 1, 59), True),
    ("2026-11", ("2026-12-01", 2, 1), False),
    ("2026-12", ("2027-01-01", 1, 59), True),     # cambio d'anno
    ("2026-12", ("2027-01-01", 2, 0), False),
    ("2026-12", ("2027-01-01", 2, 1), False),
    ("2027-02", ("2027-03-01", 1, 59), True),
    ("2027-02", ("2027-03-01", 2, 0), False),
    ("2028-02", ("2028-03-01", 1, 59), True),     # febbraio bisestile
    ("2028-02", ("2028-03-01", 2, 0), False),
    ("2028-02", ("2028-03-02", 0, 0), False),
])
def test_codice_di_fine_mese(orologio, posta, creato, quando, valido):
    async def body(c):
        n = await negozio("A", creato)
        d = await server.db.discounts.find_one({"merchant_id": n["id"]})
        cid = str(uuid.uuid4())
        await server.db.users.insert_one({"id": cid, "email": f"c{cid[:6]}@example.com", "name": "Giulia Prova", "role": "client"})
        await server.db.redemptions.insert_one({
            "id": str(uuid.uuid4()), "code": "ABCD2345", "user_id": cid, "discount_id": d["id"], "merchant_id": n["id"],
            "status": "pending", "month_key": creato, "use_number": 1, "max_uses_per_month": 1,
            "created_at": "2026-01-01T00:00:00+00:00", "redeemed_at": None})
        orologio(quando[0], quando[1], quando[2])
        slot = server.current_slot()
        token = f"ABCD2345.{slot}.{server._rotating_hmac('ABCD2345', slot)}"
        r = (await c.get("/api/qr/verify", params={"token": token})).json()
        assert r["valid"] is valido, r
        if not valido:
            assert "mese scorso" in r["reason"]
        v = await c.post("/api/redemptions/verify", json={"code": "ABCD2345"}, headers=n["h"])
        assert (v.status_code == 200) is valido, v.text
        if valido:
            # l'uso conta per il mese di creazione
            assert (await server.db.redemptions.find_one({"code": "ABCD2345"}))["month_key"] == creato
    run(body)
