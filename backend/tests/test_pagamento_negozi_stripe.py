"""Abbonamento dei negozi con Stripe, con Stripe FINTO (nessuna chiamata di rete) e database locale (mongomock).
Spento con MERCHANT_PAYMENT_REQUIRED spento; acceso: checkout con prova fino al primo 1°, webhook che scrive
il registro dei pagamenti, disdetta."""
import json
import time
import uuid
from datetime import date, datetime, timezone
from types import SimpleNamespace

import prova_pagamenti as pp
from test_interruttore_abbonamento import firma_stripe, run, WEBHOOK_SECRET
import server


def _stripe_finto(monkeypatch, chiamate):
    monkeypatch.setattr(server.stripe, "api_key", "sk_test_finta", raising=False)
    monkeypatch.setattr(server.stripe.Price, "list", lambda **kw: SimpleNamespace(data=[SimpleNamespace(id="price_finto")]))

    def crea(**kw):
        chiamate.append(kw)
        return SimpleNamespace(id="cs_finto", url="https://checkout.example/finto")
    monkeypatch.setattr(server.stripe.checkout.Session, "create", crea)
    monkeypatch.setattr(server.stripe.TaxRate, "list", lambda **kw: SimpleNamespace(data=[SimpleNamespace(
        id="txr_iva", inclusive=False, percentage=22, display_name="IVA")]))
    monkeypatch.setattr(server.stripe.Customer, "create", lambda **kw: SimpleNamespace(id="cus_finto"))
    monkeypatch.setattr(server.stripe.Subscription, "modify", lambda sid, **kw: chiamate.append(("modify", sid, kw)))


async def _negozio(first_published_at):
    uid = str(uuid.uuid4())
    await server.db.users.insert_one({"id": uid, "email": f"n{uid[:5]}@example.com", "name": "N", "role": "merchant",
                                      "shop_name": "Negozio", "first_published_at": first_published_at})
    return uid, {"Authorization": f"Bearer {server.create_token(uid, 'x@example.com')}"}


async def _webhook(c, tipo, oggetto):
    corpo = json.dumps({"id": f"evt_{uuid.uuid4().hex[:8]}", "type": tipo, "data": {"object": oggetto}})
    return await c.post("/api/stripe/webhook", content=corpo,
                        headers={"stripe-signature": firma_stripe(corpo), "content-type": "application/json"})


def test_spento_non_fa_nulla(monkeypatch):
    monkeypatch.delenv("MERCHANT_PAYMENT_REQUIRED", raising=False)

    async def body(c):
        _, h = await _negozio("2026-10-02T09:00:00+00:00")
        assert (await c.post("/api/merchant/pagamento/stripe/checkout", headers=h)).status_code == 409
        assert (await c.get("/api/merchant/pagamento", headers=h)).json()["attivo"] is False

    run(body, False)


def test_checkout_con_prova_fino_al_primo_addebito(monkeypatch):
    monkeypatch.setenv("MERCHANT_PAYMENT_REQUIRED", "true")
    monkeypatch.setenv("FRONTEND_URL", "https://sito.example")
    chiamate = []
    _stripe_finto(monkeypatch, chiamate)

    async def body(c):
        # senza prima pubblicazione: non si può ancora attivare
        _, h0 = await _negozio(None)
        assert (await c.post("/api/merchant/pagamento/stripe/checkout", headers=h0)).status_code == 409
        # pubblicato poco fa: primo addebito = un 1° nel futuro, mai prima di 3 giorni da oggi
        adesso = datetime.now(timezone.utc)
        mid, h = await _negozio(adesso.isoformat())
        r = await c.post("/api/merchant/pagamento/stripe/checkout", headers=h)
        assert r.status_code == 200, r.text
        primo = date.fromisoformat(r.json()["primo_addebito"])
        assert primo.day == 1 and (primo - pp.a_data_roma(adesso)).days >= 3
        kw = chiamate[0]
        assert kw["mode"] == "subscription" and kw["metadata"]["tipo"] == "negozio"
        assert kw["line_items"][0]["tax_rates"] == ["txr_iva"]  # IVA aggiunta all'addebito
        assert kw["subscription_data"]["trial_end"] > time.time() + 2 * 86400
        assert kw["subscription_data"]["metadata"]["merchant_id"] == mid

    run(body, False)


def test_webhook_registra_il_pagamento_e_la_disdetta(monkeypatch):
    monkeypatch.setenv("MERCHANT_PAYMENT_REQUIRED", "true")
    monkeypatch.setenv("FRONTEND_URL", "https://sito.example")
    chiamate = []
    _stripe_finto(monkeypatch, chiamate)
    monkeypatch.setattr(server, "STRIPE_WEBHOOK_SECRET", WEBHOOK_SECRET)

    async def body(c):
        mid, h = await _negozio("2026-01-02T09:00:00+00:00")
        assert (await _webhook(c, "checkout.session.completed",
                               {"id": "cs_1", "subscription": "sub_1", "customer": "cus_1",
                                "metadata": {"tipo": "negozio", "merchant_id": mid}})).status_code == 200
        assert (await server.db.merchant_subscriptions.find_one({"merchant_id": mid}))["status"] == "active"
        # fattura a zero (prova): nessun pagamento registrato
        await _webhook(c, "invoice.payment_succeeded", {"id": "in_0", "subscription": "sub_1", "amount_paid": 0})
        assert await server.db.merchant_payments.find_one({"merchant_id": mid}) is None
        # primo addebito riuscito il 1° dicembre 2026 alle 06:00 (Roma)
        inizio = int(datetime(2026, 12, 1, 5, 0, tzinfo=timezone.utc).timestamp())
        r = await _webhook(c, "invoice.payment_succeeded", {
            "id": "in_1", "subscription": "sub_1", "amount_paid": 499, "status_transitions": {"paid_at": inizio},
            "lines": {"data": [{"period": {"start": inizio}}]}})
        assert r.status_code == 200
        reg = await server.db.merchant_payments.find_one({"merchant_id": mid, "month_key": "2026-12"})
        assert reg["importo_cent"] == 499 and reg["metodo"] == "stripe"
        # lo stesso evento ricevuto due volte non crea doppioni
        await _webhook(c, "invoice.payment_succeeded", {
            "id": "in_1", "subscription": "sub_1", "amount_paid": 499, "status_transitions": {"paid_at": inizio},
            "lines": {"data": [{"period": {"start": inizio}}]}})
        assert await server.db.merchant_payments.count_documents({"merchant_id": mid}) == 1
        # il pagamento è in tempo (1° dicembre): il negozio risulta pagato per dicembre
        pagamenti = await server._pagamenti_negozio(mid)
        st = pp.stato_pagamento("2026-01-02T09:00:00+00:00", pagamenti, date(2026, 12, 10), 5)
        assert st["fase"] == "pagato" and st["visibile"] is True
        # pagamento fallito: nessun registro, ma l'errore resta segnato
        await _webhook(c, "invoice.payment_failed", {"id": "in_2", "subscription": "sub_1"})
        assert (await server.db.merchant_subscriptions.find_one({"merchant_id": mid})).get("ultimo_errore_il")
        # disdetta: Stripe non rinnova e il negozio ha «Non rinnovo» dal mese dopo
        r = await c.post("/api/merchant/pagamento/disdici", headers=h)
        assert r.status_code == 200
        assert ("modify", "sub_1", {"cancel_at_period_end": True}) in chiamate
        assert (await server.db.users.find_one({"id": mid})).get("no_renew_month")

    run(body, False)


def test_evento_di_altri_o_a_pagamenti_spenti_non_toccano_i_negozi(monkeypatch):
    monkeypatch.delenv("MERCHANT_PAYMENT_REQUIRED", raising=False)
    monkeypatch.setattr(server, "STRIPE_WEBHOOK_SECRET", WEBHOOK_SECRET)

    async def body(c):
        mid, _ = await _negozio("2026-01-02T09:00:00+00:00")
        r = await _webhook(c, "checkout.session.completed",
                           {"id": "cs_9", "subscription": "sub_9", "customer": "cus_9",
                            "metadata": {"tipo": "negozio", "merchant_id": mid}})
        assert r.status_code == 200 and r.json().get("ignored") == "pagamenti_negozi_spenti"
        assert await server.db.merchant_subscriptions.find_one({"merchant_id": mid}) is None

    run(body, False)
