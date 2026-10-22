"""Riepilogo settimanale per l'admin: calcoli con dati inventati, confronto con la settimana prima, «cose da
guardare», job del lunedì (idempotente, email finta) ed endpoint admin. Database locale (mongomock)."""
import asyncio
import json
import os
import uuid
from datetime import date, datetime, timezone
from urllib.parse import urlparse

import pytest

MONGO_URL = os.environ.setdefault("TEST_MONGO_URL", os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
_u = urlparse(MONGO_URL)
if not (_u.scheme == "mongomock" or (_u.scheme == "mongodb" and (_u.hostname or "") in ("localhost", "127.0.0.1", "::1"))):
    pytest.exit(f"MONGO_URL non locale ({_u.scheme}://{_u.hostname}): test rifiutati.", returncode=2)
USE_MOCK = _u.scheme == "mongomock"
DB_NAME = "e2e_unit_riepilogo_settimanale"
os.environ["MONGO_URL"] = "mongodb://localhost:27017" if USE_MOCK else MONGO_URL
os.environ.setdefault("DB_NAME", DB_NAME)
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")
os.environ["RESEND_API_KEY"] = ""

import httpx  # noqa: E402

import server  # noqa: E402

# Lunedì 12 ottobre 2026: settimana conclusa = 5-11 ottobre; quella prima = 28 settembre - 4 ottobre.
OGGI = date(2026, 10, 12)
ADESSO = datetime(2026, 10, 12, 6, 0, tzinfo=timezone.utc)
DA, A = date(2026, 10, 5), date(2026, 10, 12)
ORA = "2026-10-08T10:00:00+00:00"       # dentro la settimana conclusa
PRIMA = "2026-09-30T10:00:00+00:00"     # dentro la settimana prima
FUORI = "2026-09-10T10:00:00+00:00"     # più vecchio


@pytest.fixture(autouse=True)
def _ambiente(monkeypatch):
    monkeypatch.setenv("ADMIN_MASTER_PASSWORD", "master-test-123456")
    monkeypatch.delenv("MERCHANT_PAYMENT_REQUIRED", raising=False)
    monkeypatch.delenv("ADMIN_NOTIFY_EMAIL", raising=False)


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


def cliente(quando, fonte=None, ref=None):
    uid = str(uuid.uuid4())
    d = {"id": uid, "role": "client", "email": f"persona.{uid[:6]}@example.com", "name": f"Persona Inventata {uid[:4]}",
         "created_at": quando}
    if fonte:
        d.update(fonte_iscrizione=fonte, fonte_iscrizione_at=quando)
    if ref:
        d.update(referred_by=ref, referred_at=quando)
    return d


def negozio(mid, quando, nome=None):
    return {"id": mid, "role": "merchant", "email": f"{mid}@example.com", "name": "Titolare Inventato", "approved": True,
            "shop_name": nome or f"Bottega {mid}", "created_at": quando}


async def semina():
    db = server.db
    # clienti: 3 questa settimana (fonti: volantino x2, social x1; 1 dal QR del negozio n1), 1 la settimana prima
    await db.users.insert_many([
        cliente(ORA, fonte="volantino"), cliente(ORA, fonte="volantino"), cliente(ORA, fonte="social", ref="n1"),
        cliente(PRIMA, fonte="social"), cliente(PRIMA, fonte="passaparola"), cliente(FUORI),
    ])
    # negozi: 2 nuovi questa settimana, 1 prima
    await db.users.insert_many([negozio("n1", ORA, "Forno Uno"), negozio("n2", ORA, "Bar Due"), negozio("n3", PRIMA, "Pizzeria Tre")])
    # offerte: n1 approvata questa settimana; n3 in attesa da 5 giorni; n2 nessuna
    await db.discounts.insert_one({"id": "o1", "merchant_id": "n1", "title": "A", "approval_status": "approved",
                                   "created_at": ORA, "approved_at": ORA, "updated_at": ORA, "active": True})
    await db.discounts.insert_one({"id": "o3", "merchant_id": "n3", "title": "B", "approval_status": "pending",
                                   "created_at": PRIMA, "updated_at": "2026-10-07T10:00:00+00:00"})
    await db.next_discounts.insert_one({"id": "x1", "merchant_id": "n1", "approval_status": "pending",
                                        "created_at": "2026-10-11T10:00:00+00:00", "updated_at": "2026-10-11T10:00:00+00:00"})
    # sconti usati: 2 questa settimana, 1 prima, 1 solo generato (non usato)
    await db.redemptions.insert_many([
        {"id": "r1", "status": "redeemed", "redeemed_at": ORA, "created_at": ORA},
        {"id": "r2", "status": "redeemed", "redeemed_at": ORA, "created_at": ORA},
        {"id": "r3", "status": "redeemed", "redeemed_at": PRIMA, "created_at": PRIMA},
        {"id": "r4", "status": "pending", "created_at": ORA},
    ])
    # scansioni dei QR dei negozi (un numero per negozio e giorno)
    await db.scansioni_locandina.insert_many([
        {"merchant_id": "n1", "giorno": "2026-10-06", "conteggio": 4}, {"merchant_id": "n2", "giorno": "2026-10-11", "conteggio": 3},
        {"merchant_id": "n1", "giorno": "2026-10-12", "conteggio": 9},      # lunedì dopo: fuori
        {"merchant_id": "n1", "giorno": "2026-09-30", "conteggio": 5}])
    # interesse per zona, segnalazioni
    await db.interesse_zona.insert_many([{"zona": "Garbatella", "voti": 7}, {"zona": "Testaccio", "voti": 2}])
    await db.segnalazioni.insert_many([
        {"id": "s1", "tipo": "offerta", "stato": "ricevuta", "creata_il": ORA, "email": "chi.segnala@example.com", "motivo": "x"},
        {"id": "s2", "tipo": "reclamo_commerciante", "stato": "in_esame", "creata_il": PRIMA, "motivo": "y"},
        {"id": "s3", "tipo": "offerta", "stato": "accolta", "creata_il": ORA, "motivo": "z"}])
    # account cancellati dai clienti (solo ruolo e data, nessun dato personale)
    await db.cancellazioni_account.insert_many([
        {"ruolo": "client", "creata_il": ORA}, {"ruolo": "client", "creata_il": ORA}, {"ruolo": "client", "creata_il": PRIMA}])


def test_calcoli_e_confronto_con_la_settimana_prima():
    async def body(c):
        await semina()
        r = await server._riepilogo_settimanale(DA, A, ADESSO)
        m = {x["chiave"]: x for x in r["metriche"]}
        assert r["periodo"]["da"] == "2026-10-05" and r["periodo"]["a"] == "2026-10-11"
        assert r["periodo"]["precedente"] == {"da": "2026-09-28", "a": "2026-10-04"}
        assert (m["nuovi_clienti"]["questa"], m["nuovi_clienti"]["precedente"], m["nuovi_clienti"]["freccia"]) == (3, 2, "↑")
        assert (m["nuovi_commercianti"]["questa"], m["nuovi_commercianti"]["precedente"], m["nuovi_commercianti"]["freccia"]) == (2, 1, "↑")
        assert m["offerte_caricate"]["questa"] == 2 and m["offerte_caricate"]["precedente"] == 1
        assert m["offerte_approvate"]["questa"] == 1 and m["offerte_approvate"]["precedente"] == 0
        assert (m["sconti_usati"]["questa"], m["sconti_usati"]["precedente"], m["sconti_usati"]["delta"]) == (2, 1, 1)
        assert (m["scansioni_qr"]["questa"], m["scansioni_qr"]["precedente"]) == (7, 5)
        assert m["iscrizioni_da_qr_negozi"]["questa"] == 1 and m["iscrizioni_da_qr_negozi"]["precedente"] == 0
        assert m["nuove_segnalazioni"]["questa"] == 2 and m["nuove_segnalazioni"]["precedente"] == 1
        assert m["account_cancellati"]["questa"] == 2 and m["account_cancellati"]["precedente"] == 1
        fonti = {f["fonte"]: f for f in r["fonti"]}
        assert (fonti["volantino"]["questa"], fonti["volantino"]["precedente"]) == (2, 0)
        assert (fonti["social"]["questa"], fonti["social"]["precedente"], fonti["social"]["totale"]) == (1, 1, 2)
        assert (fonti["passaparola"]["questa"], fonti["passaparola"]["freccia"]) == (0, "↓")
        s = r["situazione"]
        assert s["offerte_in_attesa"] == 2 and s["offerte_in_attesa_oltre_3_giorni"] == 1
        assert s["negozi_senza_offerta"] == 1 and s["negozi_senza_offerta_nomi"] == ["Bar Due"]
        assert (s["segnalazioni_aperte"], s["reclami_aperti"]) == (1, 1)
        assert r["interesse_zone"][0] == {"zona": "Garbatella", "voti": 7}
        assert r["pagamenti"] is None          # interruttore dei pagamenti dei negozi spento
    run(body)


def test_settimana_conclusa_e_variazione():
    assert server._settimana_conclusa(date(2026, 10, 12)) == (date(2026, 10, 5), date(2026, 10, 12))
    assert server._settimana_conclusa(date(2026, 10, 15)) == (date(2026, 10, 5), date(2026, 10, 12))   # giovedì
    assert server._variazione(3, 3)["freccia"] == "="
    assert server._variazione(1, 4) == {"questa": 1, "precedente": 4, "delta": -3, "freccia": "↓"}


def test_cose_da_guardare_massimo_tre_con_regole_semplici():
    async def body(c):
        await semina()
        r = await server._riepilogo_settimanale(DA, A, ADESSO)
        g = r["da_guardare"]
        assert len(g) == 3
        assert "segnalazioni o reclami aperti" in g[0]            # la più urgente per prima
        assert "più di 3 giorni" in g[1]
        assert "passaparola" in g[2]                              # fonte a zero questa settimana
        # tutto tranquillo: nessuna voce
        await server.db.segnalazioni.delete_many({})
        await server.db.discounts.update_many({}, {"$set": {"approval_status": "approved"}})
        await server.db.next_discounts.delete_many({})
        await server.db.discounts.insert_one({"id": "o2", "merchant_id": "n2", "approval_status": "approved", "created_at": FUORI})
        await server.db.users.update_many({"fonte_iscrizione": "passaparola"}, {"$set": {"fonte_iscrizione_at": ORA}})
        r2 = await server._riepilogo_settimanale(DA, A, ADESSO)
        assert r2["da_guardare"] == []
    run(body)


def test_pagamenti_solo_con_interruttore_acceso(monkeypatch):
    async def body(c):
        await semina()
        monkeypatch.setenv("MERCHANT_PAYMENT_REQUIRED", "true")
        r = await server._riepilogo_settimanale(DA, A, ADESSO)
        assert set(r["pagamenti"]["per_stato"]) == {"in_prova", "attivo", "scaduto", "sospeso"}
        assert sum(r["pagamenti"]["per_stato"].values()) == 3
    run(body)


def test_nessun_dato_personale_nel_risultato():
    async def body(c):
        await semina()
        r = await server._riepilogo_settimanale(DA, A, ADESSO)
        testo = json.dumps(r, ensure_ascii=False)
        for vietato in ("@", "Persona Inventata", "Titolare Inventato", "chi.segnala", "referred_by", "password"):
            assert vietato not in testo
        # solo numeri nelle metriche
        assert all(isinstance(x["questa"], int) and isinstance(x["precedente"], int) for x in r["metriche"])
    run(body)


def test_job_senza_destinatario_non_fa_nulla(caplog):
    async def body(c):
        await semina()
        inviati = []

        async def finto(to, r):
            inviati.append(to)
        server.send_admin_riepilogo_settimanale, originale = finto, server.send_admin_riepilogo_settimanale
        try:
            assert (await server._run_riepilogo_settimanale(OGGI))["skipped"] == "nessun_destinatario"
        finally:
            server.send_admin_riepilogo_settimanale = originale
        assert inviati == []
        assert await server.db.settings.count_documents({}) == 0
    run(body)


def test_job_idempotente_una_email_a_settimana(monkeypatch):
    async def body(c):
        await semina()
        monkeypatch.setenv("ADMIN_NOTIFY_EMAIL", "admin.prova@example.com")
        inviati = []

        async def finto(to, r):
            inviati.append((to, r["periodo"]["da"]))
        monkeypatch.setattr(server, "send_admin_riepilogo_settimanale", finto)
        assert (await server._run_riepilogo_settimanale(OGGI))["sent"] == 1
        # riavvio del server / secondo avvio dello stesso lunedì (o un altro giorno della stessa settimana)
        assert (await server._run_riepilogo_settimanale(OGGI))["skipped"] == "gia_inviato"
        assert (await server._run_riepilogo_settimanale(date(2026, 10, 14)))["skipped"] == "gia_inviato"
        assert inviati == [("admin.prova@example.com", "2026-10-05")]
        # la settimana dopo se ne invia un'altra
        assert (await server._run_riepilogo_settimanale(date(2026, 10, 19)))["sent"] == 1
        assert len(inviati) == 2
    run(body)


def test_job_con_invio_fallito_si_puo_ritentare(monkeypatch):
    async def body(c):
        monkeypatch.setenv("ADMIN_NOTIFY_EMAIL", "admin.prova@example.com")
        chiamate = []

        async def rotto(to, r):
            chiamate.append(1)
            if len(chiamate) == 1:
                raise RuntimeError("servizio email spento")
        monkeypatch.setattr(server, "send_admin_riepilogo_settimanale", rotto)
        assert (await server._run_riepilogo_settimanale(OGGI))["skipped"] == "errore"
        assert (await server._run_riepilogo_settimanale(OGGI))["sent"] == 1
    run(body)


def test_email_vera_con_servizio_finto_contiene_tabella_e_frecce(monkeypatch):
    import email_service

    async def body(c):
        await semina()
        spedite = []

        async def finta(to, subject, html):
            spedite.append((to, subject, html))
        monkeypatch.setattr(email_service, "_send", finta)
        r = await server._riepilogo_settimanale(DA, A, ADESSO)
        await email_service.send_admin_riepilogo_settimanale("admin.prova@example.com", r)
        (to, oggetto, html), = spedite
        assert to == "admin.prova@example.com" and "5 ottobre" in oggetto
        assert "Nuovi clienti" in html and "↑" in html and "↓" in html and "Da guardare" in html
        assert "persona." not in html and "Persona Inventata" not in html
    run(body)


def test_pianificato_il_lunedi_alle_8():
    async def body(c):
        server._scheduler = None
        server._start_scheduler()
        try:
            job = server._scheduler.get_job("riepilogo_settimanale")
            assert job is not None
            testo = str(job.trigger)
            assert "day_of_week='mon'" in testo and "hour='8'" in testo and "minute='0'" in testo
            assert str(job.trigger.timezone) == "Europe/Rome"
        finally:
            server._stop_scheduler()
    run(body)


def test_endpoint_admin_richiede_master_password():
    async def body(c):
        await semina()
        senza = await c.get("/api/admin/riepilogo-settimanale")
        assert senza.status_code in (401, 403)
        uid = str(uuid.uuid4())
        await server.db.users.insert_one({"id": uid, "email": "a.prova@example.com", "role": "admin", "name": "A"})
        h = {"Authorization": f"Bearer {server.create_token(uid, 'a.prova@example.com')}"}
        assert (await c.get("/api/admin/riepilogo-settimanale", headers=h)).status_code in (401, 403)   # manca la master
        m = await c.post("/api/admin/verify-master", json={"password": "master-test-123456"}, headers=h)
        h["X-Admin-Master"] = m.cookies["admin_master_token"]
        r = await c.get("/api/admin/riepilogo-settimanale", headers=h)
        assert r.status_code == 200
        j = r.json()
        assert {"periodo", "metriche", "fonti", "interesse_zone", "situazione", "da_guardare"} <= set(j)
        assert len(j["metriche"]) == 9
    run(body)
