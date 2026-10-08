"""Registro manuale dei pagamenti dei commercianti (solo admin, nessun addebito).
Server in-process su database locale o emulatore: rifiuta database remoti."""
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
DB_NAME = "e2e_unit_pagamenti"
os.environ["MONGO_URL"] = "mongodb://localhost:27017" if USE_MOCK else MONGO_URL
os.environ.setdefault("DB_NAME", DB_NAME)
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")
os.environ["RESEND_API_KEY"] = ""

import httpx  # noqa: E402

import server  # noqa: E402

BASE = "/api/admin/pagamenti-commercianti"
OGGI = datetime(2026, 10, 8, 12, 0, tzinfo=ZoneInfo("Europe/Rome"))


@pytest.fixture(autouse=True)
def _ambiente(monkeypatch):
    monkeypatch.setattr(server, "_rome_now", lambda: OGGI)
    monkeypatch.setenv("ADMIN_MASTER_PASSWORD", "master-test-123456")
    monkeypatch.delenv("TRIAL_END_DATE", raising=False)


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


async def admin(c):
    _, h = await utente("admin")
    m = await c.post("/api/admin/verify-master", json={"password": "master-test-123456"}, headers=h)
    return {**h, "X-Admin-Master": m.json()["token"]}


async def riga(c, h, mid):
    righe = (await c.get(f"{BASE}/commercianti", headers=h)).json()["commercianti"]
    return next(r for r in righe if r["merchant_id"] == mid)


async def piano(mid, **campi):
    await server.db.merchant_plans.insert_one({"merchant_id": mid, **campi})


def test_calcolo_degli_stati():
    async def body(c):
        h = await admin(c)
        ids = {}
        for nome in ("Prova valida", "Prova finita", "Attivo", "Scaduto", "Sospeso", "Senza date"):
            ids[nome], _ = await utente("merchant", shop_name=nome)
        await piano(ids["Prova valida"], prova_fino_al="2026-10-08")  # oggi: ancora in prova
        await piano(ids["Prova finita"], prova_fino_al="2026-10-07")
        await piano(ids["Attivo"], prova_fino_al="2026-01-01", prossimo_rinnovo="2026-10-08")  # rinnovo oggi: attivo
        await piano(ids["Scaduto"], prossimo_rinnovo="2026-10-07")
        await piano(ids["Sospeso"], prossimo_rinnovo="2026-12-01", stato_manuale="sospeso")
        stati = {r["negozio"]: r["stato"] for r in (await c.get(f"{BASE}/commercianti", headers=h)).json()["commercianti"]}
        assert stati == {"Prova valida": "in_prova", "Prova finita": "scaduto", "Attivo": "attivo", "Scaduto": "scaduto",
                         "Sospeso": "sospeso", "Senza date": "in_prova"}
    run(body)


def test_prova_predefinita_da_trial_end_date(monkeypatch):
    async def body(c):
        h = await admin(c)
        mid, _ = await utente("merchant", shop_name="Bar")
        monkeypatch.setenv("TRIAL_END_DATE", "2026-12-15")
        r = await riga(c, h, mid)
        assert r["prova_fino_al"] == "2026-12-15" and r["stato"] == "in_prova"
        monkeypatch.setenv("TRIAL_END_DATE", "2026-10-01")
        assert (await riga(c, h, mid))["stato"] == "scaduto"
        # una data scritta a mano per il singolo commerciante vince su quella predefinita
        await c.patch(f"{BASE}/commercianti/{mid}", json={"prova_fino_al": "2027-01-31"}, headers=h)
        assert (await riga(c, h, mid))["stato"] == "in_prova"
    run(body)


def test_registra_pagamento_scaduto_riparte_da_oggi():
    async def body(c):
        h = await admin(c)
        mid, mh = await utente("merchant", shop_name="Forno")
        await piano(mid, prossimo_rinnovo="2026-09-01")
        r = await c.post(BASE, json={"merchant_id": mid, "importo": "4,99", "metodo": "bonifico", "nota": "ricevuta n. 1"}, headers=h)
        assert r.status_code == 200, r.text
        p = r.json()["pagamento"]
        assert p["importo_cent"] == 499 and p["importo"] == "4.99" and p["stato"] == "registrato"
        assert p["data_pagamento"] == "2026-10-08"
        assert (p["periodo_coperto_dal"], p["periodo_coperto_al"]) == ("2026-10-08", "2026-11-08")
        x = await riga(c, h, mid)
        assert x["stato"] == "attivo" and x["prossimo_rinnovo"] == "2026-11-08"
        assert x["ultimo_pagamento"]["importo"] == "4.99" and x["ultimo_pagamento"]["metodo"] == "bonifico"
    run(body)


def test_rinnovo_di_un_mese_dalla_copertura_precedente():
    async def body(c):
        h = await admin(c)
        mid, _ = await utente("merchant", shop_name="Libreria")
        await piano(mid, prossimo_rinnovo="2026-10-31")
        r = await c.post(BASE, json={"merchant_id": mid, "metodo": "contanti"}, headers=h)  # importo suggerito
        p = r.json()["pagamento"]
        assert p["importo_cent"] == 499
        assert (p["periodo_coperto_dal"], p["periodo_coperto_al"]) == ("2026-10-31", "2026-11-30")  # fine mese: nessun salto a dicembre
        r2 = await c.post(BASE, json={"merchant_id": mid, "importo": 9.98, "metodo": "paypal",
                                      "data_pagamento": "2026-10-09", "periodo_coperto_dal": "2026-11-30", "periodo_coperto_al": "2027-01-30"}, headers=h)
        assert r2.json()["pagamento"]["importo_cent"] == 998
        assert (await riga(c, h, mid))["prossimo_rinnovo"] == "2027-01-30"
    run(body)


def test_primo_pagamento_in_prova_parte_dalla_fine_della_prova():
    async def body(c):
        h = await admin(c)
        mid, _ = await utente("merchant", shop_name="Fiori")
        await piano(mid, prova_fino_al="2026-12-10")
        p = (await c.post(BASE, json={"merchant_id": mid, "metodo": "altro"}, headers=h)).json()["pagamento"]
        assert (p["periodo_coperto_dal"], p["periodo_coperto_al"]) == ("2026-12-10", "2027-01-10")
    run(body)


def test_dati_non_validi_rifiutati():
    async def body(c):
        h = await admin(c)
        mid, _ = await utente("merchant", shop_name="Bar")
        for extra, codice in [({"importo": "0"}, 422), ({"importo": "-5"}, 422), ({"importo": "abc"}, 422), ({"importo": "NaN"}, 422),
                              ({"importo": "5000"}, 422), ({"metodo": "carta"}, 422), ({"data_pagamento": "08/10/2026"}, 422),
                              ({"periodo_coperto_dal": "2026-10-10", "periodo_coperto_al": "2026-10-01"}, 422),
                              ({"merchant_id": "inesistente"}, 404)]:
            corpo = {"merchant_id": mid, "importo": "4,99", "metodo": "bonifico", **extra}
            assert (await c.post(BASE, json=corpo, headers=h)).status_code == codice, extra
        assert (await c.get(BASE, headers=h)).json()["pagamenti"] == []
    run(body)


def test_annullamento_ripristina_il_rinnovo_senza_cancellare():
    async def body(c):
        h = await admin(c)
        mid, _ = await utente("merchant", shop_name="Bar")
        await piano(mid, prossimo_rinnovo="2026-10-20")
        p1 = (await c.post(BASE, json={"merchant_id": mid, "metodo": "bonifico"}, headers=h)).json()["pagamento"]  # 20/10 -> 20/11
        p2 = (await c.post(BASE, json={"merchant_id": mid, "metodo": "bonifico"}, headers=h)).json()["pagamento"]  # 20/11 -> 20/12
        assert (await riga(c, h, mid))["prossimo_rinnovo"] == "2026-12-20"
        assert (await c.delete(f"{BASE}/{p2['id']}", headers=h)).status_code == 200
        assert (await riga(c, h, mid))["prossimo_rinnovo"] == "2026-11-20"
        assert (await c.delete(f"{BASE}/{p2['id']}", headers=h)).status_code == 409  # già annullato
        assert (await c.delete(f"{BASE}/{p1['id']}", headers=h)).status_code == 200
        assert (await riga(c, h, mid))["prossimo_rinnovo"] is None
        elenco = (await c.get(BASE, headers=h)).json()["pagamenti"]
        assert len(elenco) == 2 and {x["stato"] for x in elenco} == {"annullato"}  # restano nel registro
        assert await server.db.merchant_payments.count_documents({}) == 2
        assert (await c.delete(f"{BASE}/non-esiste", headers=h)).status_code == 404
        riep = (await c.get(f"{BASE}/riepilogo", headers=h)).json()
        assert riep["totale_cent"] == 0 and riep["numero_pagamenti"] == 0
    run(body)


def test_modifica_rapida_del_piano():
    async def body(c):
        h = await admin(c)
        mid, _ = await utente("merchant", shop_name="Bar")
        r = await c.patch(f"{BASE}/commercianti/{mid}", json={"prossimo_rinnovo": "2026-11-15", "note": "paga a fine mese"}, headers=h)
        assert r.status_code == 200
        x = r.json()["commerciante"]
        assert x["stato"] == "attivo" and x["prossimo_rinnovo"] == "2026-11-15" and x["note"] == "paga a fine mese"
        x = (await c.patch(f"{BASE}/commercianti/{mid}", json={"stato": "sospeso"}, headers=h)).json()["commerciante"]
        assert x["stato"] == "sospeso" and x["prossimo_rinnovo"] == "2026-11-15"  # il resto non si perde
        x = (await c.patch(f"{BASE}/commercianti/{mid}", json={"stato": "automatico", "prossimo_rinnovo": None}, headers=h)).json()["commerciante"]
        assert x["stato"] == "in_prova" and x["prossimo_rinnovo"] is None
        assert (await c.patch(f"{BASE}/commercianti/{mid}", json={"stato": "attivo"}, headers=h)).status_code == 422
        assert (await c.patch(f"{BASE}/commercianti/{mid}", json={"prova_fino_al": "ieri"}, headers=h)).status_code == 422
        assert (await c.patch(f"{BASE}/commercianti/{mid}", json={}, headers=h)).status_code == 400
        assert (await c.patch(f"{BASE}/commercianti/xx", json={"note": "a"}, headers=h)).status_code == 404
    run(body)


def test_elenchi_rinnovi_e_scaduti_e_riepilogo():
    async def body(c):
        h = await admin(c)
        ids = {}
        for nome in ("Tra 5 giorni", "Tra 30 giorni", "Tra 31 giorni", "Scaduto ieri", "Sospeso", "Prova che finisce", "Prova lunga"):
            ids[nome], _ = await utente("merchant", shop_name=nome)
        await piano(ids["Tra 5 giorni"], prossimo_rinnovo="2026-10-13")
        await piano(ids["Tra 30 giorni"], prossimo_rinnovo="2026-11-07")
        await piano(ids["Tra 31 giorni"], prossimo_rinnovo="2026-11-08")
        await piano(ids["Scaduto ieri"], prossimo_rinnovo="2026-10-07")
        await piano(ids["Sospeso"], prossimo_rinnovo="2026-10-10", stato_manuale="sospeso")
        await piano(ids["Prova che finisce"], prova_fino_al="2026-10-20")
        await piano(ids["Prova lunga"], prova_fino_al="2027-03-01")
        # un pagamento di ottobre e uno di settembre
        await c.post(BASE, json={"merchant_id": ids["Tra 5 giorni"], "importo": "4,99", "metodo": "bonifico", "data_pagamento": "2026-10-02"}, headers=h)
        await c.post(BASE, json={"merchant_id": ids["Scaduto ieri"], "importo": "5", "metodo": "paypal", "data_pagamento": "2026-10-03"}, headers=h)
        await c.post(BASE, json={"merchant_id": ids["Tra 31 giorni"], "importo": "4,99", "metodo": "contanti", "data_pagamento": "2026-09-30"}, headers=h)
        stati = {r["negozio"]: (r["stato"], r["prossimo_rinnovo"]) for r in (await c.get(f"{BASE}/commercianti", headers=h)).json()["commercianti"]}
        assert stati["Scaduto ieri"] == ("attivo", "2026-11-08")  # pagamento da scaduto: riparte da oggi
        assert stati["Tra 5 giorni"] == ("attivo", "2026-11-13")
        riv = (await c.get(f"{BASE}/rinnovi", headers=h)).json()
        assert [r["negozio"] for r in riv["rinnovi"]] == ["Tra 30 giorni"]  # 7/11 sì; 8/11 e 13/11 oltre 30 giorni; sospeso escluso
        assert [r["negozio"] for r in riv["prove_in_scadenza"]] == ["Prova che finisce"]
        # un altro scaduto vero
        await piano((await utente("merchant", shop_name="Scaduto vero"))[0], prossimo_rinnovo="2026-09-15")
        sc = (await c.get(f"{BASE}/scaduti", headers=h)).json()["scaduti"]
        assert [r["negozio"] for r in sc] == ["Scaduto vero"]
        riep = (await c.get(f"{BASE}/riepilogo", headers=h)).json()
        assert riep["mese"] == "2026-10" and riep["numero_pagamenti"] == 2 and riep["totale_cent"] == 499 + 500
        assert riep["totale"] == "9.99"
        assert riep["commercianti_per_stato"] == {"in_prova": 2, "attivo": 4, "scaduto": 1, "sospeso": 1}
        sett = (await c.get(f"{BASE}/riepilogo?mese=2026-09", headers=h)).json()
        assert sett["numero_pagamenti"] == 1 and sett["totale_cent"] == 499
        assert (await c.get(f"{BASE}/riepilogo?mese=2026-13", headers=h)).status_code == 422
    run(body)


def test_nessuna_email_ne_cambio_per_il_commerciante(monkeypatch):
    async def body(c):
        h = await admin(c)
        mid, mh = await utente("merchant", shop_name="Bar", approved=True)
        prima = await server.db.users.find_one({"id": mid}, {"_id": 0})
        inviate = []
        for nome in dir(server):
            if nome.startswith(("send_", "_send_")) and callable(getattr(server, nome)):
                monkeypatch.setattr(server, nome, lambda *a, **k: inviate.append(nome), raising=False)
        await c.post(BASE, json={"merchant_id": mid, "metodo": "bonifico"}, headers=h)
        await c.patch(f"{BASE}/commercianti/{mid}", json={"stato": "sospeso"}, headers=h)
        assert inviate == []
        assert await server.db.users.find_one({"id": mid}, {"_id": 0}) == prima  # il commerciante non è toccato
        assert (await c.get("/api/auth/me", headers=mh)).status_code == 200
    run(body)


def test_accesso_negato_ai_non_admin():
    async def body(c):
        h = await admin(c)
        mid, mh = await utente("merchant", shop_name="Bar")
        _, ch = await utente("client")
        _, ah_senza_master = await utente("admin")
        richieste = [("GET", f"{BASE}/commercianti"), ("GET", BASE), ("GET", f"{BASE}/rinnovi"), ("GET", f"{BASE}/scaduti"),
                     ("GET", f"{BASE}/riepilogo"), ("GET", f"{BASE}/esporta.csv"),
                     ("POST", BASE), ("PATCH", f"{BASE}/commercianti/{mid}"), ("DELETE", f"{BASE}/x")]
        corpi = {"POST": {"merchant_id": mid, "metodo": "bonifico"}, "PATCH": {"note": "x"}}
        for nome, hh in [("commerciante", mh), ("cliente", ch), ("admin senza master", ah_senza_master), ("anonimo", {})]:
            for metodo, url in richieste:
                r = await c.request(metodo, url, headers=hh, json=corpi.get(metodo))
                assert r.status_code in (401, 403), (nome, metodo, url, r.status_code)
        assert await server.db.merchant_payments.count_documents({}) == 0
        assert (await c.get(f"{BASE}/commercianti", headers=h)).status_code == 200
    run(body)


def test_esporta_csv_senza_dati_sensibili():
    async def body(c):
        h = await admin(c)
        mid, _ = await utente("merchant", shop_name='=CMD() "Bar", Roma', phone="+39 06 1234567", address="Via Segreta 1")
        await c.post(BASE, json={"merchant_id": mid, "importo": "4,99", "metodo": "bonifico", "nota": "IT60X0542811101000000123456"}, headers=h)
        r = await c.get(f"{BASE}/esporta.csv", headers=h)
        assert r.status_code == 200 and r.headers["content-type"].startswith("text/csv")
        assert "attachment" in r.headers["content-disposition"]
        testo = r.text.lstrip("﻿")
        righe = testo.strip().split("\r\n")
        assert righe[0] == '"Attività";"Importo (€)";"Metodo";"Data pagamento";"Periodo dal";"Periodo al";"Stato"'
        assert righe[1].startswith("\"'=CMD() \"\"Bar\"\", Roma\";\"4,99\";\"bonifico\";\"2026-10-08\";\"2026-10-08\";\"2026-11-08\";\"registrato\"")
        for vietato in ("IT60", "1234567", "Segreta", "@example.com", "Prova"):
            assert vietato not in testo
    run(body)
