"""Prova gratuita dei negozi, registro manuale dei pagamenti e interruttore MERCHANT_PAYMENT_REQUIRED.
Server in-process su database locale (mongomock): nessun addebito, nessun database di produzione."""
import uuid
from datetime import date, datetime, timedelta, timezone

import pytest

import prova_pagamenti as pp
from test_interruttore_abbonamento import nuovo_utente, run, server

MASTER = "master-test-123456"
VECCHIA = "2020-01-01T10:00:00+00:00"  # prova finita da anni


# ---------- funzioni pure ----------
def test_fine_prova_e_primo_pagamento():
    # giorno 61 a metà mese: la prova continua fino a fine mese, si paga dal 1° dopo
    assert pp.billing_start_date("2026-10-15T09:00:00+00:00") == date(2027, 1, 1)
    assert pp.trial_end_date("2026-10-15T09:00:00+00:00") == date(2026, 12, 31)
    assert pp.billing_start_date("2026-10-02") == date(2026, 12, 1)  # +60 = 01/12: proprio un 1°
    assert pp.trial_end_date("2026-10-02") == date(2026, 11, 30)
    assert pp.billing_start_date("2026-10-01") == date(2026, 12, 1)
    assert pp.billing_start_date("2026-10-11") == date(2027, 1, 1)   # +60 = 10/12: 1° successivo, 82 giorni
    assert pp.billing_start_date("2026-10-12") == date(2027, 1, 1)   # 81 giorni
    assert pp.billing_start_date("2026-12-10") == date(2027, 3, 1)   # passa l'anno (+60 = 08/02)
    assert pp.billing_start_date("2026-12-20") == date(2027, 3, 1)
    assert pp.billing_start_date(None) is None and pp.trial_end_date("") is None


def test_confini_del_mese_con_fuso_di_roma():
    # 02/10 22:30 UTC = 03/10 00:30 a Roma: +60 giorni = 02/12 -> 1° gennaio; alle 23:30 di Roma del 02/10 -> 01/12
    assert pp.billing_start_date("2026-10-02T22:30:00+00:00") == date(2027, 1, 1)  # per Roma è già il 3
    assert pp.billing_start_date("2026-10-02T21:30:00+00:00") == date(2026, 12, 1)  # per Roma è ancora il 2


def test_tolleranza_e_stato():
    assert pp.pagato_in_tempo("2026-11-05T10:00:00+00:00", "2026-11", 5)  # fino al 5 incluso
    assert not pp.pagato_in_tempo("2026-11-06T10:00:00+00:00", "2026-11", 5)
    assert pp.pagato_in_tempo("2026-10-28T10:00:00+00:00", "2026-11", 0)  # in anticipo
    assert pp.pagato_in_tempo("2026-11-01T10:00:00+00:00", "2026-11", 0)
    assert not pp.pagato_in_tempo("2026-11-02T10:00:00+00:00", "2026-11", 0)
    assert not pp.pagato_in_tempo("non-una-data", "2026-11", 5)
    oggi = date(2026, 11, 20)
    st = pp.stato_pagamento(VECCHIA, {}, oggi, 5)
    assert st["fase"] == "da_pagare" and not st["visibile"]
    # pagato in ritardo per novembre: novembre resta nascosto, dicembre è coperto
    ritardo = {"2026-11": "2026-11-10T10:00:00+00:00"}
    assert not pp.stato_pagamento(VECCHIA, ritardo, date(2026, 11, 20), 5)["visibile"]
    assert pp.stato_pagamento(VECCHIA, ritardo, date(2026, 12, 3), 5)["visibile"]
    assert pp.stato_pagamento("2026-10-15", {}, date(2026, 12, 31), 5)["fase"] == "in_prova"
    assert pp.stato_pagamento("2026-10-15", {}, date(2027, 1, 1), 5)["fase"] == "da_pagare"
    assert pp.stato_pagamento(None, {}, oggi, 5)["visibile"]  # mai pubblicato: prudente, nessun blocco


def test_disdetta_e_interruttore_spento_nel_nucleo():
    kw = dict(first_published_at=VECCHIA, pagamenti={}, oggi=date(2026, 11, 20), tolleranza=5)
    assert pp.offer_visible_for_payment_core(required=False, **kw) is True
    assert pp.offer_visible_for_payment_core(required=True, **kw) is False
    # «Non rinnovo» scelto per dicembre: novembre resta pubblico anche senza pagamento, dal 1° dic decade
    assert pp.offer_visible_for_payment_core(required=True, no_renew_month="2026-12", **kw) is True
    kw["oggi"] = date(2026, 12, 1)
    assert pp.offer_visible_for_payment_core(required=True, no_renew_month="2026-12",
                                             **{**kw, "pagamenti": {"2026-12": "2026-12-01T08:00:00+00:00"}}) is False


# ---------- server ----------
def _mese_corrente():
    return pp.chiave_mese(pp.a_data_roma(datetime.now(timezone.utc)))


def _primo_del_mese():
    oggi = pp.a_data_roma(datetime.now(timezone.utc))
    return oggi.replace(day=1)


async def negozio(first_published_at=VECCHIA, con_offerta=True, **extra):
    mid, _ = await nuovo_utente("merchant")
    campi = dict(extra)
    if first_published_at:
        campi["first_published_at"] = first_published_at
    if campi:
        await server.db.users.update_one({"id": mid}, {"$set": campi})
    if con_offerta:
        await server.db.discounts.insert_one({"id": str(uuid.uuid4()), "merchant_id": mid, "title": "Offerta", "active": True,
                                              "approval_status": "approved", "original_price": 20, "discounted_price": 10,
                                              "created_at": VECCHIA, "approved_at": VECCHIA})
    return mid


async def admin_master(c, monkeypatch):
    monkeypatch.setenv("ADMIN_MASTER_PASSWORD", MASTER)
    _, h = await nuovo_utente("admin")
    m = await c.post("/api/admin/verify-master", json={"password": MASTER}, headers=h)
    assert m.status_code == 200, m.text
    return {**h, "X-Admin-Master": m.cookies["admin_master_token"]}, h


async def titoli_pubblici(c):
    return [d["merchant_id"] for d in (await c.get("/api/discounts")).json()["discounts"]]


def test_interruttore_spento_comportamento_identico_a_oggi(monkeypatch):
    monkeypatch.delenv("MERCHANT_PAYMENT_REQUIRED", raising=False)

    async def body(c):
        non_pagante = await negozio()                        # fuori prova e senza pagamenti
        senza_data = await negozio(first_published_at=None)  # negozio esistente senza il campo nuovo
        assert not server.merchant_payment_required()
        assert await server.offer_visible_for_payment(await server.db.users.find_one({"id": non_pagante})) is True
        assert set(await titoli_pubblici(c)) == {non_pagante, senza_data}
        assert await server._merchant_sospesi() == set()
        assert (await c.get(f"/api/negozio/{non_pagante}")).json()["discount"] is not None
    run(body, required=False)


def test_interruttore_acceso_prova_pagamento_ritardo(monkeypatch):
    monkeypatch.setenv("MERCHANT_PAYMENT_REQUIRED", "true")
    mk = _mese_corrente()
    primo = _primo_del_mese()

    async def body(c):
        ah, _ = await admin_master(c, monkeypatch)
        in_prova = await negozio(first_published_at=datetime.now(timezone.utc).isoformat())
        non_pagante = await negozio()
        in_tempo = await negozio()
        in_ritardo = await negozio()
        senza_campo = await negozio(first_published_at=None)  # campo assente: data calcolata al volo (2020) -> da pagare
        # tolleranza 2 giorni: pagato il 1° = in tempo; pagato il 4 = in ritardo
        assert (await c.put("/api/admin/impostazioni-pagamenti", json={"giorni_tolleranza": 2}, headers=ah)).status_code == 200
        r = await c.put(f"/api/admin/pagamenti-mensili/{in_tempo}/{mk}", headers=ah,
                        json={"paid_at": f"{primo.isoformat()}T12:00:00+00:00", "note": "bonifico"})
        assert r.status_code == 200, r.text
        tardi = (primo + timedelta(days=3)).isoformat()
        assert (await c.put(f"/api/admin/pagamenti-mensili/{in_ritardo}/{mk}", headers=ah,
                            json={"paid_at": f"{tardi}T12:00:00+00:00"})).status_code == 200
        visibili = set(await titoli_pubblici(c))
        assert visibili == {in_prova, in_tempo}
        assert not {non_pagante, in_ritardo, senza_campo} & visibili
        # nascosto anche nella pagina del negozio e nei preferiti/riscatto (stessa regola)
        assert (await c.get(f"/api/negozio/{non_pagante}")).status_code == 404
        # togliere «pagato» rimette il negozio tra quelli da pagare
        assert (await c.delete(f"/api/admin/pagamenti-mensili/{in_tempo}/{mk}", headers=ah)).status_code == 200
        assert in_tempo not in await titoli_pubblici(c)
    run(body, required=False)


def test_disdetta_con_interruttore_acceso(monkeypatch):
    monkeypatch.setenv("MERCHANT_PAYMENT_REQUIRED", "true")
    prossimo = pp.mese_dopo(_mese_corrente())

    async def body(c):
        disdetto = await negozio(no_renew_month=prossimo)   # offerta pubblica fino a fine mese
        gia_decaduto = await negozio(no_renew_month=_mese_corrente())
        assert await titoli_pubblici(c) == [disdetto]
        assert gia_decaduto not in await titoli_pubblici(c)
    run(body, required=False)


def test_impostazione_tolleranza_e_permessi(monkeypatch):
    async def body(c):
        ah, admin_senza_master = await admin_master(c, monkeypatch)
        r = await c.get("/api/admin/impostazioni-pagamenti", headers=ah)
        assert r.status_code == 200 and r.json()["giorni_tolleranza"] == 5 and r.json()["interruttore_acceso"] is False
        assert (await c.put("/api/admin/impostazioni-pagamenti", json={"giorni_tolleranza": 7}, headers=ah)).status_code == 200
        assert (await c.get("/api/admin/impostazioni-pagamenti", headers=ah)).json()["giorni_tolleranza"] == 7
        for v in (-1, 32, "abc"):
            assert (await c.put("/api/admin/impostazioni-pagamenti", json={"giorni_tolleranza": v}, headers=ah)).status_code == 422
        assert (await c.get("/api/admin/impostazioni-pagamenti", headers=admin_senza_master)).status_code == 403
        _, cl = await nuovo_utente("client")
        assert (await c.get("/api/admin/impostazioni-pagamenti", headers=cl)).status_code in (401, 403)
        assert (await c.put(f"/api/admin/pagamenti-mensili/{uuid.uuid4()}/2026-10", headers=cl)).status_code in (401, 403)
    run(body, required=False)


def test_registro_pagamenti_manuale(monkeypatch):
    async def body(c):
        ah, _ = await admin_master(c, monkeypatch)
        mid = await negozio()
        assert (await c.put(f"/api/admin/pagamenti-mensili/{mid}/2026-13", headers=ah)).status_code == 400
        assert (await c.put(f"/api/admin/pagamenti-mensili/{uuid.uuid4()}/2026-10", headers=ah)).status_code == 404
        assert (await c.put(f"/api/admin/pagamenti-mensili/{mid}/2026-10", headers=ah, json={"paid_at": "boh"})).status_code == 400
        assert (await c.put(f"/api/admin/pagamenti-mensili/{mid}/2026-10", headers=ah, json={"note": "contanti"})).status_code == 200
        assert (await c.put(f"/api/admin/pagamenti-mensili/{mid}/2026-10", headers=ah)).status_code == 200  # nessun doppione
        elenco = (await c.get(f"/api/admin/pagamenti-mensili/{mid}", headers=ah)).json()["pagamenti"]
        assert len(elenco) == 1 and elenco[0]["month_key"] == "2026-10" and elenco[0]["merchant_id"] == mid
        assert (await c.delete(f"/api/admin/pagamenti-mensili/{mid}/2026-10", headers=ah)).status_code == 200
        assert (await c.get(f"/api/admin/pagamenti-mensili/{mid}", headers=ah)).json()["pagamenti"] == []
    run(body, required=False)


def test_first_published_at_alla_prima_approvazione_e_mai_cambiato(monkeypatch):
    async def body(c):
        ah, _ = await admin_master(c, monkeypatch)
        mid = await negozio(first_published_at=None, con_offerta=False)
        d1, d2 = str(uuid.uuid4()), str(uuid.uuid4())
        for did in (d1, d2):
            await server.db.discounts.insert_one({"id": did, "merchant_id": mid, "title": "x", "active": True,
                                                  "approval_status": "pending", "created_at": VECCHIA})
        assert "first_published_at" not in await server.db.users.find_one({"id": mid})
        assert (await c.post(f"/api/admin/discounts/{d1}/approve", headers=ah)).status_code == 200
        primo = (await server.db.users.find_one({"id": mid}))["first_published_at"]
        assert primo
        assert (await c.post(f"/api/admin/discounts/{d2}/approve", headers=ah)).status_code == 200
        assert (await server.db.users.find_one({"id": mid}))["first_published_at"] == primo
    run(body, required=False)


def test_elenco_negozi_mostra_stato_pagamento(monkeypatch):
    mk = _mese_corrente()

    async def body(c):
        ah, _ = await admin_master(c, monkeypatch)
        in_prova = await negozio(first_published_at="2026-10-15T09:00:00+00:00")
        pagante = await negozio()
        da_pagare = await negozio()
        await c.put(f"/api/admin/pagamenti-mensili/{pagante}/{mk}", headers=ah,
                    json={"paid_at": f"{_primo_del_mese().isoformat()}T10:00:00+00:00"})
        righe = {m["id"]: m["stato_pagamento"] for m in (await c.get("/api/admin/merchants", headers=ah)).json()["merchants"]}
        assert righe[in_prova]["prova_fino_al"] == "2026-12-31" and righe[in_prova]["primo_pagamento"] == "2027-01-01"
        assert righe[pagante]["fase"] == "pagato" and righe[da_pagare]["fase"] == "da_pagare"
        assert righe[pagante]["mese"] == mk
    run(body, required=False)


def test_prova_tra_60_e_90_giorni_e_si_paga_sempre_il_primo():
    from datetime import timedelta
    d = date(2026, 10, 1)
    giorni = []
    while d < date(2027, 10, 1):
        inizio = pp.billing_start_date(d.isoformat())
        assert inizio.day == 1
        giorni.append((inizio - d).days)
        d += timedelta(days=1)
    assert min(giorni) == 60 and max(giorni) <= 90  # «2 mesi gratis» garantiti (decisione del 31/10)
