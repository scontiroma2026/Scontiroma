"""Pre-lancio: approvazione di tutte le offerte in attesa con parola di conferma; promemoria di fine prova
(10 e 3 giorni prima, una sola volta, solo con l'interruttore acceso). Database locale (mongomock)."""
import asyncio
from datetime import datetime, timedelta, timezone

import prova_pagamenti as pp
from test_interruttore_abbonamento import run


def test_funzioni_di_data_coerenti():
    primo = datetime(2026, 10, 1, 10, 0, tzinfo=timezone.utc).isoformat()
    fine = pp.trial_end_date(primo)
    assert fine is not None and fine > pp.a_data_roma(primo)


def test_promemoria_10_e_3_giorni_una_volta_sola(monkeypatch):
    import server
    inviati = []

    async def finto(to, name, shop, days_left, end_label):
        inviati.append((to, days_left))

    monkeypatch.setattr(server, "send_merchant_trial_reminder", finto)

    async def body(c):
        # interruttore spento: niente
        monkeypatch.delenv("MERCHANT_PAYMENT_REQUIRED", raising=False)
        assert (await server._run_trial_reminders())["skipped"] == "pagamenti_negozi_spenti"
        monkeypatch.setenv("MERCHANT_PAYMENT_REQUIRED", "true")
        primo = datetime.now(timezone.utc) - timedelta(days=50)
        await server.db.users.insert_one({"id": "m1", "role": "merchant", "email": "m1@example.com", "name": "M",
                                          "shop_name": "S", "first_published_at": primo.isoformat()})
        fine = pp.trial_end_date(primo.isoformat())
        oggi = fine - timedelta(days=9)
        assert (await server._run_trial_reminders(oggi))["sent"] == 1
        assert (await server._run_trial_reminders(oggi))["sent"] == 0  # già inviato
        assert (await server._run_trial_reminders(fine - timedelta(days=2)))["sent"] == 1
        assert (await server._run_trial_reminders(fine - timedelta(days=2)))["sent"] == 0
        assert [d for _, d in inviati] == [9, 2]

    run(body, False)


def test_approva_tutte_chiede_conferma():
    import server

    async def body(c):
        r = await c.post("/api/admin/discounts/approve-all-pending", json={"conferma": "no"})
        assert r.status_code in (400, 401, 403)

    run(body, False)


def test_approva_tutte_con_parola_giusta():
    import pytest
    import server
    from fastapi import HTTPException

    async def body(c):
        for i in (1, 2):
            await server.db.users.insert_one({"id": f"n{i}", "role": "merchant", "email": f"n{i}@example.com", "name": "N",
                                              "shop_name": f"Negozio {i}"})
            await server.db.discounts.insert_one({"id": f"o{i}", "merchant_id": f"n{i}", "title": "Offerta",
                                                  "approval_status": "pending", "active": False})
        with pytest.raises(HTTPException):
            await server.admin_approve_all_pending(server.ApprovaTutteIn(conferma="no"), {})
        esito = await server.admin_approve_all_pending(server.ApprovaTutteIn(conferma="lancia"), {})
        assert esito["approvate"] == 2
        for i in (1, 2):
            assert (await server.db.discounts.find_one({"id": f"o{i}"}))["approval_status"] == "approved"
            assert (await server.db.users.find_one({"id": f"n{i}"})).get("first_published_at")

    run(body, False)


def test_approvazione_solo_se_pagato_nei_giorni_stabiliti(monkeypatch):
    import pytest
    import server
    from fastapi import HTTPException

    async def body(c):
        monkeypatch.setenv("MERCHANT_PAYMENT_REQUIRED", "true")
        vecchio = (datetime.now(timezone.utc) - timedelta(days=200)).isoformat()  # prova finita da tempo
        await server.db.users.insert_one({"id": "p1", "role": "merchant", "email": "p1@example.com", "name": "P",
                                          "shop_name": "Non paga", "first_published_at": vecchio})
        await server.db.discounts.insert_one({"id": "d1", "merchant_id": "p1", "title": "T",
                                              "approval_status": "pending", "active": False})
        with pytest.raises(HTTPException) as e:
            await server.admin_approve_discount("d1", {})
        assert e.value.status_code == 409
        esito = await server.admin_approve_all_pending(server.ApprovaTutteIn(conferma="LANCIA"), {})
        assert esito["approvate"] == 0 and esito["saltate_per_pagamento"] == 1
        # pagamento registrato in tempo: ora si può
        oggi = pp.a_data_roma(datetime.now(timezone.utc))
        await server.db.merchant_payments.insert_one({"merchant_id": "p1", "month_key": pp.chiave_mese(oggi),
                                                      "paid_at": oggi.replace(day=1).isoformat(), "stato": "pagato"})
        await server.admin_approve_discount("d1", {})
        assert (await server.db.discounts.find_one({"id": "d1"}))["approval_status"] == "approved"
        # interruttore spento: nessun vincolo
        monkeypatch.delenv("MERCHANT_PAYMENT_REQUIRED", raising=False)
        assert (await server._approvazione_consentita({"id": "p1"}))["ok"] is True

    run(body, False)
