"""Pannello commerciante, "Ultimi codici": nessun dato personale del cliente,
solo ora, offerta e cliente nuovo / di ritorno. Stesso database locale dei test
dell'interruttore (rifiuta database remoti)."""
import uuid
from datetime import datetime, timedelta, timezone

from test_interruttore_abbonamento import nuovo_utente, run, server


def _iso(dt):
    return dt.isoformat()


def test_ultimi_codici_senza_nome_con_nuovo_e_di_ritorno():
    async def body(c):
        mid, mh = await nuovo_utente("merchant")
        cid, _ = await nuovo_utente("client")
        await server.db.users.update_one({"id": cid}, {"$set": {"name": "Nome Da Non Mostrare"}})
        did = str(uuid.uuid4())
        await server.db.discounts.insert_one({"id": did, "merchant_id": mid, "title": "Pizza e birra"})
        t0 = datetime.now(timezone.utc) - timedelta(days=40)
        base = {"user_id": cid, "merchant_id": mid, "discount_id": did}
        await server.db.redemptions.insert_many([
            {**base, "id": "r1", "code": "AAA111", "status": "redeemed",
             "created_at": _iso(t0), "redeemed_at": _iso(t0)},
            {**base, "id": "r2", "code": "BBB222", "status": "redeemed",
             "created_at": _iso(t0 + timedelta(days=35)), "redeemed_at": _iso(t0 + timedelta(days=35))},
            {**base, "id": "r3", "code": "CCC333", "status": "pending",
             "created_at": _iso(t0 + timedelta(days=39)), "redeemed_at": None},
        ])
        r = await c.get("/api/merchants/me/redemptions", headers=mh)
        assert r.status_code == 200, r.text
        rows = {x["id"]: x for x in r.json()["redemptions"]}
        assert rows["r1"]["client_type"] == "new"
        assert rows["r2"]["client_type"] == "returning"
        assert rows["r3"]["client_type"] == "returning"
        for x in rows.values():
            assert x["discount_title"] == "Pizza e birra"
            assert set(x) == {"id", "code", "status", "created_at", "redeemed_at", "discount_title", "client_type"}
        assert "Nome Da Non Mostrare" not in r.text and cid not in r.text
    run(body, required=False)


def test_nome_breve_del_cliente():
    assert server.short_client_name("Mario Rossi") == "Mario R."
    assert server.short_client_name("anna maria de luca") == "Anna L."
    assert server.short_client_name("Giulia") == "Giulia"
    assert server.short_client_name("") == "Cliente"
    assert server.short_client_name(None) == "Cliente"


def test_scansione_qr_solo_nome_e_iniziale():
    async def body(c):
        mid, mh = await nuovo_utente("merchant")
        cid, _ = await nuovo_utente("client")
        await server.db.users.update_one({"id": cid}, {"$set": {"name": "Mario Rossi"}})
        did = str(uuid.uuid4())
        await server.db.discounts.insert_one({"id": did, "merchant_id": mid, "title": "Pizza",
                                              "original_price": 20.0, "discounted_price": 10.0})
        now = datetime.now(timezone.utc).isoformat()
        base = {"user_id": cid, "merchant_id": mid, "discount_id": did, "status": "pending",
                "month_key": now[:7], "created_at": now, "redeemed_at": None}
        # Seconda scansione in un altro negozio (stesso negozio e stesso giorno = limite giornaliero)
        mid2, _ = await nuovo_utente("merchant")
        await server.db.redemptions.insert_many([
            {**base, "id": "q1", "code": "QQQ11111"},
            {**base, "id": "q2", "code": "QQQ22222", "merchant_id": mid2}])
        # App del commerciante (codice inserito o scansionato)
        r = await c.post("/api/redemptions/verify", json={"code": "QQQ11111"}, headers=mh)
        assert r.status_code == 200, r.text
        red = r.json()["redemption"]
        assert red["client_name"] == "Mario R." and "user_id" not in red
        assert "Rossi" not in r.text and cid not in r.text
        # Pagina di conferma aperta dal QR (link con codice a rotazione)
        slot = server.current_slot()
        tok = f"QQQ22222.{slot}.{server._rotating_hmac('QQQ22222', slot)}"
        r = await c.get("/api/qr/verify", params={"token": tok})
        assert r.json()["valid"] is True, r.text
        assert r.json()["client_name"] == "Mario R."
        assert "Rossi" not in r.text and cid not in r.text
    run(body, required=False)
