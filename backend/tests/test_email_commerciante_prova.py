"""Email al commerciante su prova e pagamento (lista di lancio, punto 21): giorno 30, promemoria del primo
pagamento, mancato pagamento, ricevuta. Spente di default. Database locale (mongomock), nessun invio vero."""
import re
from datetime import date, datetime, timezone

import pytest

import email_service
import prova_pagamenti as pp
from test_interruttore_abbonamento import run

PUBBLICATA = datetime(2026, 10, 5, 10, 0, tzinfo=timezone.utc).isoformat()   # entro l'11 -> paga dal 1 dicembre
PUBBLICATA_TARDI = datetime(2026, 10, 20, 10, 0, tzinfo=timezone.utc).isoformat()  # dal 12 -> paga dal 1 gennaio


@pytest.fixture
def inviate(monkeypatch):
    out = []

    async def finto(to, subject, html):
        out.append({"to": to, "subject": subject, "html": html})
        return "finto"

    monkeypatch.setattr(email_service, "_send", finto)
    for v in ("MERCHANT_TRIAL_EMAILS", "MERCHANT_PAYMENT_REQUIRED", "CLIENT_SUBSCRIPTION_REQUIRED"):
        monkeypatch.delenv(v, raising=False)
    return out


async def negozio(server, mid="m1", pubblicata=PUBBLICATA, **extra):
    await server.db.users.insert_one({"id": mid, "role": "merchant", "email": f"{mid}@example.com", "name": "Anna",
                                      "shop_name": "Bar Prova", "first_published_at": pubblicata, **extra})


def regole_comuni(html: str):
    t = re.sub(r"<[^>]+>", "", html).lower()  # solo il testo, non gli attributi HTML
    assert "4,99" in html and "+ iva" in t
    assert "Non rinnovo" in html
    for vietato in ("gratis per sempre", "prezzo bloccato", "%", "stripe", "paypal", "google", "apple"):
        assert vietato not in t


def test_date_della_prova():
    assert pp.billing_start_date(PUBBLICATA) == date(2026, 12, 1)
    assert pp.billing_start_date(PUBBLICATA_TARDI) == date(2027, 1, 1)


def test_giorno30_spento_di_default(inviate):
    import server

    async def body(c):
        await negozio(server)
        r = await server._run_trial_emails(date(2026, 11, 4))
        assert r["skipped"] == "email_prova_spente" and inviate == []

    run(body, False)


def test_giorno30_contenuto_e_una_sola_volta(inviate, monkeypatch):
    import server
    monkeypatch.setenv("MERCHANT_TRIAL_EMAILS", "true")

    async def body(c):
        await negozio(server)
        assert (await server._run_trial_emails(date(2026, 11, 3)))["sent"] == 0   # giorno 29
        assert (await server._run_trial_emails(date(2026, 11, 4)))["sent"] == 1   # giorno 30
        assert (await server._run_trial_emails(date(2026, 11, 4)))["sent"] == 0
        assert (await server._run_trial_emails(date(2026, 11, 6)))["sent"] == 0   # nessun doppio invio
        assert len(inviate) == 1
        e = inviate[0]
        assert e["to"] == "m1@example.com" and "30 giorni" in e["subject"]
        assert "30 novembre 2026" in e["html"] and "1 dicembre 2026" in e["html"]
        assert "Disdici quando vuoi, porti avanti solo l'offerta che è in corso a fine mese. Per non continuare, scegli «Non rinnovo»." in e["html"]
        regole_comuni(e["html"])

    run(body, False)


def test_giorno30_non_a_chi_ha_disdetto_e_non_dopo_il_recupero(inviate, monkeypatch):
    import server
    monkeypatch.setenv("MERCHANT_TRIAL_EMAILS", "true")

    async def body(c):
        await negozio(server, "m1", no_renew_month="2026-12")
        await negozio(server, "m2")
        assert (await server._run_trial_emails(date(2026, 11, 4)))["sent"] == 1
        assert [e["to"] for e in inviate] == ["m2@example.com"]
        await negozio(server, "m3")
        assert (await server._run_trial_emails(date(2026, 11, 20)))["sent"] == 0  # troppo tardi: giorno 46

    run(body, False)


def test_promemoria_primo_pagamento(inviate, monkeypatch):
    import server
    monkeypatch.setenv("MERCHANT_TRIAL_EMAILS", "true")

    async def body(c):
        await negozio(server)
        await negozio(server, "m2", datetime(2026, 11, 10, 9, 0, tzinfo=timezone.utc).isoformat())  # prova appena iniziata: nulla
        assert (await server._run_trial_emails(date(2026, 11, 23)))["sent"] == 0  # 8 giorni prima
        assert (await server._run_trial_emails(date(2026, 11, 24)))["sent"] == 1  # 7 giorni prima
        assert (await server._run_trial_emails(date(2026, 11, 28)))["sent"] == 0  # già inviato
        assert len(inviate) == 1
        e = inviate[0]
        assert e["to"] == "m1@example.com" and "7 giorni" in e["subject"]
        assert "1 dicembre 2026" in e["html"] and "dal 1° al 5" in e["html"]
        regole_comuni(e["html"])
        assert (await server._run_trial_emails(date(2026, 12, 1)))["sent"] == 0  # dal 1° non è più un promemoria

    run(body, False)


def test_vecchi_promemoria_sostituiti_con_interruttore_prova(inviate, monkeypatch):
    import server
    monkeypatch.setenv("MERCHANT_PAYMENT_REQUIRED", "true")
    monkeypatch.setenv("MERCHANT_TRIAL_EMAILS", "true")

    async def body(c):
        await negozio(server)
        assert (await server._run_trial_reminders(date(2026, 11, 25)))["skipped"] == "sostituiti_da_email_prova"
        assert inviate == []

    run(body, False)


def test_mancato_pagamento_spento_se_pagamenti_spenti(inviate):
    import server

    async def body(c):
        await negozio(server)
        r = await server._run_payment_missed(date(2026, 12, 10))
        assert r["skipped"] == "pagamenti_negozi_spenti" and inviate == []

    run(body, False)


def test_mancato_pagamento_contenuto_e_una_volta_al_mese(inviate, monkeypatch):
    import server
    monkeypatch.setenv("MERCHANT_PAYMENT_REQUIRED", "true")

    async def body(c):
        await negozio(server, "m1")                                  # non ha pagato
        await negozio(server, "m2")                                  # ha pagato dicembre
        await negozio(server, "m3", no_renew_month="2026-12")        # disdetta in vigore
        await negozio(server, "m4", PUBBLICATA_TARDI)                # ancora in prova a dicembre
        await server.db.merchant_payments.insert_one({"merchant_id": "m2", "month_key": "2026-12",
                                                      "paid_at": "2026-12-02T09:00:00+00:00"})
        assert (await server._run_payment_missed(date(2026, 12, 5)))["skipped"] == "entro_la_tolleranza"
        assert (await server._run_payment_missed(date(2026, 12, 6)))["sent"] == 1
        assert (await server._run_payment_missed(date(2026, 12, 7)))["sent"] == 0
        assert [e["to"] for e in inviate] == ["m1@example.com"]
        e = inviate[0]
        assert "dicembre 2026" in e["subject"] and "dal 1° al 5" in e["html"]
        regole_comuni(e["html"])
        # il mese dopo, ancora senza pagamento: una nuova email
        assert (await server._run_payment_missed(date(2027, 1, 8)))["sent"] >= 1
        assert any("gennaio 2027" in x["subject"] for x in inviate)

    run(body, False)


def test_ricevuta_solo_con_pagamenti_accesi_e_una_volta(inviate, monkeypatch):
    import server

    async def body(c):
        await negozio(server)
        # pagamenti spenti: nessuna email, ma il pagamento si registra comunque
        await server._registra_pagamento_automatico("m1", "2026-12", "2026-12-02T09:00:00+00:00", 609, "stripe",
                                                    {"invoice_id": "in_1"}, "Pagamento automatico con carta")
        assert inviate == []
        monkeypatch.setenv("MERCHANT_PAYMENT_REQUIRED", "true")
        await server._registra_pagamento_automatico("m1", "2026-12", "2026-12-02T09:00:00+00:00", 609, "stripe",
                                                    {"invoice_id": "in_1"}, "Pagamento automatico con carta")
        await server._registra_pagamento_automatico("m1", "2026-12", "2026-12-02T09:00:00+00:00", 609, "stripe",
                                                    {"invoice_id": "in_1"}, "evento ripetuto")
        assert len(inviate) == 1
        e = inviate[0]
        assert e["to"] == "m1@example.com" and "dicembre 2026" in e["subject"]
        assert "6,09 €" in e["html"] and "Bar Prova" in e["html"] and "non è un documento fiscale" in e["html"]
        regole_comuni(e["html"])
        # mese successivo: una nuova ricevuta
        await server._registra_pagamento_automatico("m1", "2027-01", "2027-01-02T09:00:00+00:00", 609, "paypal",
                                                    {"sale_id": "s1"}, "Pagamento automatico con PayPal")
        assert len(inviate) == 2

    run(body, False)


async def abbonato(server, mid, stato="active"):
    await server.db.merchant_subscriptions.insert_one({"merchant_id": mid, "provider": "stripe", "status": stato})


def test_promemoria_addebito_spento_con_pagamenti_spenti(inviate):
    import server

    async def body(c):
        await negozio(server)
        await abbonato(server, "m1")
        r = await server._run_monthly_charge_reminders(date(2027, 1, 29))
        assert r["skipped"] == "pagamenti_negozi_spenti" and inviate == []

    run(body, False)


def test_promemoria_addebito_contenuto_e_uno_al_mese(inviate, monkeypatch):
    import server
    monkeypatch.setenv("MERCHANT_PAYMENT_REQUIRED", "true")

    async def body(c):
        await negozio(server, "m1")                                  # abbonato
        await negozio(server, "m2")                                  # non abbonato
        await negozio(server, "m3", no_renew_month="2027-02")        # abbonato ma ha disdetto
        await negozio(server, "m4")                                  # abbonamento chiuso
        await negozio(server, "m5", PUBBLICATA_TARDI)                # abbonato, ma il 1 gennaio è il primo pagamento
        for mid in ("m1", "m3", "m5"):
            await abbonato(server, mid)
        await abbonato(server, "m4", "cancelled")
        assert (await server._run_monthly_charge_reminders(date(2026, 12, 27)))["skipped"] == "non_ancora_il_momento"
        # 29 dicembre (3 giorni prima): il 1 gennaio è il primo pagamento di m5 (esclusa); m1 riceve
        assert (await server._run_monthly_charge_reminders(date(2026, 12, 29)))["sent"] == 1
        assert (await server._run_monthly_charge_reminders(date(2026, 12, 29)))["sent"] == 0
        assert (await server._run_monthly_charge_reminders(date(2026, 12, 30)))["sent"] == 0
        assert [e["to"] for e in inviate] == ["m1@example.com"]
        e = inviate[0]
        assert "3 giorni" in e["subject"] and "1 gennaio 2027" in e["html"] and "4,99 €" in e["html"]
        assert "dashboard" in e["html"]
        assert "Disdici quando vuoi, porti avanti solo l'offerta che è in corso a fine mese. Per non continuare, scegli «Non rinnovo»." in e["html"]
        regole_comuni(e["html"])
        # febbraio 2027 ha 28 giorni: il promemoria del 1 marzo è il 26; m5 ora è a regime
        assert (await server._run_monthly_charge_reminders(date(2027, 2, 25)))["skipped"] == "non_ancora_il_momento"
        assert (await server._run_monthly_charge_reminders(date(2027, 2, 26)))["sent"] == 2
        # già pagato il mese dopo: niente
        await server.db.merchant_payments.insert_one({"merchant_id": "m1", "month_key": "2027-04", "paid_at": "2027-03-31T10:00:00+00:00"})
        assert (await server._run_monthly_charge_reminders(date(2027, 3, 29)))["sent"] == 1  # solo m5

    run(body, False)
