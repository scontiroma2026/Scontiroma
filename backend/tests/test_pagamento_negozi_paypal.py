"""Abbonamento dei negozi con PayPal, con PayPal FINTO (nessuna chiamata di rete) e database locale (mongomock)."""
import json
import uuid
from datetime import date, datetime, timezone

import prova_pagamenti as pp
from test_interruttore_abbonamento import run
import server


def _paypal_finto(monkeypatch, sub):
    ps = server.paypal_service
    monkeypatch.setattr(ps, "is_configured", lambda: True)
    monkeypatch.setattr(ps, "PAYPAL_CLIENT_ID", "client_finto", raising=False)

    async def piano(cents, iva_percent=0):
        assert iva_percent == 22  # il piano PayPal aggiunge l'IVA
        return "P-FINTO"

    async def leggi(sub_id):
        return sub

    async def firma_ok(headers, event):
        return True

    annullate = []

    async def annulla(sub_id, reason=""):
        annullate.append(sub_id)

    monkeypatch.setattr(ps, "ensure_plan_negozio", piano)
    monkeypatch.setattr(ps, "get_subscription", leggi)
    monkeypatch.setattr(ps, "verify_webhook", firma_ok)
    monkeypatch.setattr(ps, "cancel_subscription", annulla)
    return annullate


async def _negozio(first_published_at):
    uid = str(uuid.uuid4())
    await server.db.users.insert_one({"id": uid, "email": f"n{uid[:5]}@example.com", "name": "N", "role": "merchant",
                                      "shop_name": "Negozio", "first_published_at": first_published_at})
    return uid, {"Authorization": f"Bearer {server.create_token(uid, 'x@example.com')}"}


async def _evento(c, tipo, risorsa):
    return await c.post("/api/paypal/webhook", content=json.dumps(
        {"id": f"WH-{uuid.uuid4().hex[:6]}", "event_type": tipo, "resource": risorsa}),
        headers={"content-type": "application/json"})


def test_spento_non_fa_nulla(monkeypatch):
    monkeypatch.delenv("MERCHANT_PAYMENT_REQUIRED", raising=False)
    _paypal_finto(monkeypatch, {})

    async def body(c):
        _, h = await _negozio("2026-10-02T09:00:00+00:00")
        assert (await c.get("/api/merchant/pagamento/paypal/config", headers=h)).status_code == 409
        assert (await c.post("/api/merchant/pagamento/paypal/activate", headers=h,
                             json={"subscription_id": "I-1"})).status_code == 409

    run(body, False)


def test_config_attivazione_pagamento_e_disdetta(monkeypatch):
    monkeypatch.setenv("MERCHANT_PAYMENT_REQUIRED", "true")
    sub = {}
    annullate = _paypal_finto(monkeypatch, sub)

    async def body(c):
        mid, h = await _negozio("2026-01-02T09:00:00+00:00")
        r = await c.get("/api/merchant/pagamento/paypal/config", headers=h)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["plan_id"] == "P-FINTO" and j["custom_id"] == mid
        assert date.fromisoformat(j["primo_addebito"]).day == 1
        assert j["start_time"].endswith("Z")
        # abbonamento di un altro negozio o di un altro piano: rifiutato
        sub.update({"plan_id": "P-FINTO", "custom_id": "altro", "status": "ACTIVE"})
        assert (await c.post("/api/merchant/pagamento/paypal/activate", headers=h,
                             json={"subscription_id": "I-1"})).status_code == 403
        sub.update({"plan_id": "P-FINTO", "custom_id": mid, "status": "APPROVAL_PENDING"})
        assert (await c.post("/api/merchant/pagamento/paypal/activate", headers=h,
                             json={"subscription_id": "I-1"})).status_code == 409
        sub["status"] = "ACTIVE"
        assert (await c.post("/api/merchant/pagamento/paypal/activate", headers=h,
                             json={"subscription_id": "I-1"})).status_code == 200
        # primo addebito riuscito il 1° dicembre 2026
        pagamento = {"id": "SALE-1", "billing_agreement_id": "I-1", "amount": {"total": "4.99"},
                     "create_time": "2026-12-01T05:10:00Z"}
        assert (await _evento(c, "PAYMENT.SALE.COMPLETED", pagamento)).status_code == 200
        await _evento(c, "PAYMENT.SALE.COMPLETED", pagamento)  # stesso evento due volte
        assert await server.db.merchant_payments.count_documents({"merchant_id": mid}) == 1
        reg = await server.db.merchant_payments.find_one({"merchant_id": mid})
        assert reg["month_key"] == "2026-12" and reg["importo_cent"] == 499 and reg["metodo"] == "paypal"
        st = pp.stato_pagamento("2026-01-02T09:00:00+00:00", await server._pagamenti_negozio(mid), date(2026, 12, 10), 5)
        assert st["fase"] == "pagato"
        # pagamento fallito: errore segnato, nessun pagamento in più
        await _evento(c, "BILLING.SUBSCRIPTION.PAYMENT.FAILED", {"id": "I-1"})
        assert (await server.db.merchant_subscriptions.find_one({"merchant_id": mid})).get("ultimo_errore_il")
        # disdetta
        r = await c.post("/api/merchant/pagamento/disdici", headers=h)
        assert r.status_code == 200 and annullate == ["I-1"]

    run(body, False)
