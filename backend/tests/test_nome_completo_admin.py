"""Nome e cognome completi dei clienti: solo nelle risposte admin (ruolo admin + master password).
Il modello utente ha un unico campo `name` («Giulia Esempiobrevissimo»). Commercianti e pubblico continuano
a vedere nome + iniziale («Giulia E.»). Database locale (mongomock), solo dati inventati."""
import logging
import uuid
from datetime import datetime, timezone

from test_interruttore_abbonamento import nuovo_utente, offerta_approvata, run, server

MASTER = "master-test-123456"
NOME = "Giulia Esempiobrevissimo"
COGNOME = "Esempiobrevissimo"
BREVE = "Giulia E."


async def admin_headers(c):
    _, h = await nuovo_utente("admin")
    m = await c.post("/api/admin/verify-master", json={"password": MASTER}, headers=h)
    assert m.status_code == 200, m.text
    return {**h, "X-Admin-Master": m.json()["token"]}, h


async def cliente():
    uid, h = await nuovo_utente("client")
    await server.db.users.update_one({"id": uid}, {"$set": {"name": NOME}})
    return uid, h


async def riscatto(uid, mid, did, code, status="pending"):
    await server.db.redemptions.insert_one({
        "id": str(uuid.uuid4()), "code": code, "user_id": uid, "merchant_id": mid, "discount_id": did,
        "status": status, "created_at": datetime.now(timezone.utc).isoformat()})


async def scansione_fallita(uid, mid=None):
    await server.db.qr_scans.insert_one({
        "id": str(uuid.uuid4()), "timestamp": datetime.now(timezone.utc).isoformat(), "valid": False,
        "reason": "Limite giornaliero: cliente ha già usato lo sconto oggi", "user_id": uid,
        "merchant_id": mid, "shop_name": "Negozio di prova"})


def test_admin_vede_nome_completo_negli_elenchi(monkeypatch):
    monkeypatch.setenv("ADMIN_MASTER_PASSWORD", MASTER)

    async def body(c):
        uid, ch = await cliente()
        did = await offerta_approvata()
        mid = (await server.db.discounts.find_one({"id": did}))["merchant_id"]
        await riscatto(uid, mid, did, "ABC123", "redeemed")
        await scansione_fallita(uid, mid)
        r = await c.post("/api/app-feedback", json={"stars": 4, "comment": "ok"}, headers=ch)
        assert r.status_code == 200, r.text
        ah, _ = await admin_headers(c)

        fr = (await c.get("/api/admin/fraud-log", headers=ah)).json()["scans"]
        assert fr[0]["client_name"] == NOME and fr[0]["client_email"].startswith("client.")
        af = (await c.get("/api/admin/app-feedback", headers=ah)).json()["feedback"]
        assert af[0]["name"] == NOME
        st = (await c.get("/api/admin/stats", headers=ah)).json()
        assert st["recent"][0]["client_name"] == NOME
        assert st["top_clients"][0]["name"] == NOME
    run(body, required=False)


def test_senza_ruolo_admin_o_master_niente_nomi(monkeypatch):
    monkeypatch.setenv("ADMIN_MASTER_PASSWORD", MASTER)

    async def body(c):
        uid, ch = await cliente()
        _, mh = await nuovo_utente("merchant")
        await scansione_fallita(uid)
        _, solo_admin = await admin_headers(c)       # admin senza master password
        for path in ("/api/admin/fraud-log", "/api/admin/app-feedback", "/api/admin/stats"):
            for h in ({}, ch, mh, solo_admin):
                r = await c.get(path, headers=h)
                assert r.status_code in (401, 403), (path, r.status_code)
                assert COGNOME not in r.text
    run(body, required=False)


def test_commerciante_riceve_solo_nome_breve(monkeypatch):
    monkeypatch.setenv("ADMIN_MASTER_PASSWORD", MASTER)

    async def body(c):
        uid, ch = await cliente()
        mid, mh = await nuovo_utente("merchant")
        did = str(uuid.uuid4())
        await server.db.discounts.insert_one({
            "id": did, "merchant_id": mid, "title": "Offerta", "description": "x", "original_price": 20.0,
            "discounted_price": 10.0, "active": True, "approval_status": "approved",
            "created_at": datetime.now(timezone.utc).isoformat()})
        await riscatto(uid, mid, did, "ZXC789")
        r = await c.post("/api/redemptions/verify", json={"code": "ZXC789"}, headers=mh)
        assert r.status_code == 200, r.text
        assert r.json()["redemption"]["client_name"] == BREVE
        assert COGNOME not in r.text and uid not in r.text
        r = await c.get("/api/merchants/me/redemptions", headers=mh)
        assert COGNOME not in r.text
    run(body, required=False)


def test_nessun_cognome_nei_log(monkeypatch, caplog):
    monkeypatch.setenv("ADMIN_MASTER_PASSWORD", MASTER)

    async def body(c):
        uid, ch = await cliente()
        await scansione_fallita(uid)
        await c.post("/api/app-feedback", json={"stars": 5}, headers=ch)
        ah, _ = await admin_headers(c)
        with caplog.at_level(logging.DEBUG):
            for p in ("/api/admin/fraud-log", "/api/admin/app-feedback", "/api/admin/stats"):
                assert (await c.get(p, headers=ah)).status_code == 200
    run(body, required=False)
    assert COGNOME not in caplog.text
