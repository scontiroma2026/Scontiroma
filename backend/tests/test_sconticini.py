"""Sconticini (raccolta a premio per negozio): interruttore spento di default, un sconticino per riscatto verificato,
limite giornaliero, soglia e premio con QR monouso e scadenza, ripartenza del contatore, email, tracciamento admin,
cancellazione ed esportazione GDPR. Database locale (mongomock), solo dati inventati, nessun invio vero di email."""
import asyncio
import uuid
from datetime import datetime, timedelta, timezone

import pytest

from test_interruttore_abbonamento import nuovo_utente, run, server

MASTER = "master-test-123456"


@pytest.fixture(autouse=True)
def _env(monkeypatch):
    monkeypatch.setenv("ADMIN_MASTER_PASSWORD", MASTER)
    monkeypatch.delenv("SCONTICINI_ENABLED", raising=False)
    monkeypatch.delenv("SCONTICINI_PREMIO_GIORNI", raising=False)


async def indici():
    # all'avvio vero li crea il server; qui il database di prova è vuoto
    await server.db.sconticini_eventi.create_index("chiave", unique=True)
    await server.db.sconticini_saldi.create_index([("user_id", 1), ("merchant_id", 1)], unique=True)
    await server.db.sconticini_premi.create_index("code", unique=True)
    await server.db.redemptions.create_index("code", unique=True)


async def negozio_e_cliente(nome="Giulia Rossi"):
    await indici()
    mid, mh = await nuovo_utente("merchant")
    cid, ch = await nuovo_utente("client")
    await server.db.users.update_one({"id": cid}, {"$set": {"name": nome}})
    did = str(uuid.uuid4())
    await server.db.discounts.insert_one({"id": did, "merchant_id": mid, "title": "Menù di pesce", "active": True,
                                          "approval_status": "approved", "original_price": 40.0, "discounted_price": 20.0})
    return mid, mh, cid, ch, did


async def attiva(c, mh, soglia=3, premio="Un caffè offerto dal negozio"):
    r = await c.put("/api/merchants/me/sconticini", headers=mh,
                    json={"attivo": True, "soglia": soglia, "premio": premio, "accetto_regolamento": True})
    assert r.status_code == 200, r.text
    return r.json()["config"]


async def qr_nuovo(mid, cid, did, stato="pending", redeemed_at=None):
    code = f"QR{uuid.uuid4().hex[:8].upper()}"
    rid = str(uuid.uuid4())
    await server.db.redemptions.insert_one({
        "id": rid, "code": code, "user_id": cid, "merchant_id": mid, "discount_id": did, "status": stato,
        "month_key": datetime.now(timezone.utc).strftime("%Y-%m"), "created_at": datetime.now(timezone.utc).isoformat(),
        "redeemed_at": redeemed_at})
    slot = server.current_slot()
    return rid, f"{code}.{slot}.{server._rotating_hmac(code, slot)}"


async def codice_negozio(c, mh):
    return (await c.get("/api/merchants/me/shop-code", headers=mh)).json()["code"]


async def soli_eventi(tipo):
    return await server.db.sconticini_eventi.count_documents({"tipo": tipo})


# ---------- interruttore spento ----------
def test_spento_di_default_nulla_viene_contato(monkeypatch):
    async def body(c):
        assert (await c.get("/api/config/public")).json()["sconticini_enabled"] is False
        mid, mh, cid, ch, did = await negozio_e_cliente()
        # anche con una configurazione già in archivio, spento = nessun effetto
        await server.db.sconticini_config.insert_one({"merchant_id": mid, "attivo": True, "soglia": 3, "premio": "Caffè"})
        sc = await codice_negozio(c, mh)
        rid, tok = await qr_nuovo(mid, cid, did)
        r = await c.post("/api/qr/redeem", json={"token": tok, "shop_code": sc})
        assert r.status_code == 200 and r.json()["valid"] and "sconticino" not in r.json()
        assert await server.db.sconticini_eventi.count_documents({}) == 0
        assert await server.db.sconticini_saldi.count_documents({}) == 0
        for chiamata in (c.get("/api/sconticini/me", headers=ch), c.get("/api/merchants/me/sconticini", headers=mh),
                         c.put("/api/merchants/me/sconticini", headers=mh,
                               json={"attivo": True, "soglia": 5, "premio": "Caffè", "accetto_regolamento": True})):
            assert (await chiamata).status_code == 404
    run(body, required=False)


def test_acceso_dall_ambiente(monkeypatch):
    monkeypatch.setenv("SCONTICINI_ENABLED", "true")

    async def body(c):
        assert (await c.get("/api/config/public")).json()["sconticini_enabled"] is True
    run(body, required=False)


# ---------- impostazioni del negozio ----------
def test_impostazioni_validate_e_regolamento(monkeypatch):
    monkeypatch.setenv("SCONTICINI_ENABLED", "true")

    async def body(c):
        mid, mh, cid, ch, did = await negozio_e_cliente()
        url = "/api/merchants/me/sconticini"
        base = {"attivo": True, "soglia": 5, "premio": "Un dolce a scelta", "accetto_regolamento": True}
        for sbagliato in ({**base, "soglia": 2}, {**base, "soglia": 21}, {**base, "premio": "ab"},
                          {**base, "premio": "x" * 81}, {**base, "premio": "<b>caffè</b>"}):
            assert (await c.put(url, headers=mh, json=sbagliato)).status_code in (400, 422), sbagliato
        # senza accettare il regolamento non si attiva
        r = await c.put(url, headers=mh, json={**base, "accetto_regolamento": False})
        assert r.status_code == 400 and "regolamento" in r.text
        # ma si può salvare spento
        r = await c.put(url, headers=mh, json={**base, "attivo": False, "accetto_regolamento": False})
        assert r.status_code == 200 and r.json()["config"]["attivo"] is False
        ok = await c.put(url, headers=mh, json=base)
        assert ok.status_code == 200 and ok.json()["config"]["attivo"] and ok.json()["config"]["regolamento_accettato"]
        doc = await server.db.sconticini_config.find_one({"merchant_id": mid})
        assert doc["regolamento_versione"] == server.SCONTICINI_REGOLAMENTO_VERSIONE and doc["regolamento_accettato_il"]
        # le modifiche si registrano (tracciamento)
        r = await c.put(url, headers=mh, json={**base, "soglia": 7, "accetto_regolamento": False})
        assert r.status_code == 200 and r.json()["config"]["soglia"] == 7
        assert await soli_eventi("config") == 3
        # il cliente non può impostare nulla
        assert (await c.put(url, headers=ch, json=base)).status_code == 403
        g = (await c.get(url, headers=mh)).json()
        assert g["config"]["limiti"]["soglia_min"] == 3 and g["numeri"]["sconticini_assegnati"] == 0
    run(body, required=False)


# ---------- conteggio ----------
def test_un_sconticino_per_sconto_scansionato_con_codice(monkeypatch):
    monkeypatch.setenv("SCONTICINI_ENABLED", "true")

    async def body(c):
        mid, mh, cid, ch, did = await negozio_e_cliente()
        await attiva(c, mh, soglia=3)
        sc = await codice_negozio(c, mh)
        # codice del negozio sbagliato: nessuno sconto usato, nessuno sconticino
        rid, tok = await qr_nuovo(mid, cid, did)
        r = await c.post("/api/qr/redeem", json={"token": tok, "shop_code": "0000" if sc != "0000" else "1111"})
        assert r.status_code == 403
        assert await soli_eventi("guadagnato") == 0
        # codice giusto: uno sconticino, mostrato al negozio senza dati personali
        r = await c.post("/api/qr/redeem", json={"token": tok, "shop_code": sc})
        d = r.json()
        assert r.status_code == 200 and d["sconticino"] == {"count": 1, "soglia": 3, "sbloccato": False}
        assert "Rossi" not in r.text and cid not in r.text
        # la stessa scansione ripetuta (doppio tap) non dà un secondo sconticino
        r2 = await c.post("/api/qr/redeem", json={"token": tok, "shop_code": sc})
        assert "sconticino" not in r2.json()
        saldo = await server.db.sconticini_saldi.find_one({"user_id": cid, "merchant_id": mid})
        assert saldo["count"] == 1 and saldo["totale"] == 1
        # solo scansionati: un riscatto "creato" ma mai convalidato non conta
        await qr_nuovo(mid, cid, did)
        assert (await server.db.sconticini_saldi.find_one({"user_id": cid}))["count"] == 1
        # tessera del cliente
        t = (await c.get("/api/sconticini/me", headers=ch)).json()["tessere"]
        assert len(t) == 1 and t[0]["count"] == 1 and t[0]["soglia"] == 3 and t[0]["shop_name"] == "Negozio di prova"
        assert t[0]["ultimo_uso_at"] and t[0]["premi"] == []
    run(body, required=False)


def test_negozio_che_non_partecipa_non_da_sconticini(monkeypatch):
    monkeypatch.setenv("SCONTICINI_ENABLED", "true")

    async def body(c):
        mid, mh, cid, ch, did = await negozio_e_cliente()
        sc = await codice_negozio(c, mh)
        rid, tok = await qr_nuovo(mid, cid, did)
        r = await c.post("/api/qr/redeem", json={"token": tok, "shop_code": sc})
        assert r.status_code == 200 and "sconticino" not in r.json()
        # configurato ma spento
        await c.put("/api/merchants/me/sconticini", headers=mh,
                    json={"attivo": False, "soglia": 5, "premio": "Un caffè", "accetto_regolamento": False})
        rid, tok = await qr_nuovo(mid, cid, did)
        r = await c.post("/api/qr/redeem", json={"token": tok, "shop_code": sc})
        assert "sconticino" not in r.json()
        assert await server.db.sconticini_saldi.count_documents({}) == 0
    run(body, required=False)


def test_limite_giornaliero_per_negozio_e_cliente(monkeypatch):
    monkeypatch.setenv("SCONTICINI_ENABLED", "true")

    async def body(c):
        mid, mh, cid, ch, did = await negozio_e_cliente()
        await attiva(c, mh, soglia=5)
        r1, r2, r3 = ({"id": str(uuid.uuid4()), "merchant_id": mid, "user_id": cid} for _ in range(3))
        assert (await server._sconticini_dopo_riscatto(r1))["count"] == 1
        # secondo uso lo stesso giorno: nessun sconticino, ma resta traccia del rifiuto
        assert await server._sconticini_dopo_riscatto(r2) is None
        assert await soli_eventi("rifiutato_limite") == 1
        assert (await server.db.sconticini_saldi.find_one({"user_id": cid}))["count"] == 1
        # un altro cliente nello stesso negozio non è limitato
        c2, _ = await nuovo_utente("client")
        assert (await server._sconticini_dopo_riscatto({"id": str(uuid.uuid4()), "merchant_id": mid, "user_id": c2}))["count"] == 1
        # il giorno dopo si riparte
        monkeypatch.setattr(server, "_rome_day", lambda dt_iso=None: "2099-01-01")
        assert (await server._sconticini_dopo_riscatto(r3))["count"] == 2
    run(body, required=False)


# ---------- soglia, premio, ripartenza ----------
async def raggiungi_soglia(monkeypatch, mid, cid, n):
    esiti = []
    for i in range(n):
        monkeypatch.setattr(server, "_rome_day", lambda dt_iso=None, i=i: f"2099-02-{i + 1:02d}")
        esiti.append(await server._sconticini_dopo_riscatto({"id": str(uuid.uuid4()), "merchant_id": mid, "user_id": cid}))
    return esiti


def test_soglia_sblocca_premio_e_il_contatore_riparte(monkeypatch):
    monkeypatch.setenv("SCONTICINI_ENABLED", "true")

    async def body(c):
        mid, mh, cid, ch, did = await negozio_e_cliente()
        await attiva(c, mh, soglia=3, premio="Un caffè offerto")
        e = await raggiungi_soglia(monkeypatch, mid, cid, 3)
        assert [x["sbloccato"] for x in e] == [False, False, True] and e[2]["premio"] == "Un caffè offerto"
        assert (await server.db.sconticini_saldi.find_one({"user_id": cid}))["count"] == 0  # riparte da zero
        premi = await server.db.sconticini_premi.find({"user_id": cid}).to_list(10)
        assert len(premi) == 1 and premi[0]["status"] == "pending" and premi[0]["code"].startswith("PR")
        scade = datetime.fromisoformat(premi[0]["expires_at"]) - datetime.fromisoformat(premi[0]["created_at"])
        assert scade.days == 60
        t = (await c.get("/api/sconticini/me", headers=ch)).json()["tessere"][0]
        assert t["count"] == 0 and len(t["premi"]) == 1 and t["premi"][0]["stato"] == "pending"
        # nuovo ciclo
        monkeypatch.setattr(server, "_rome_day", lambda dt_iso=None: "2099-03-01")
        n = await server._sconticini_dopo_riscatto({"id": str(uuid.uuid4()), "merchant_id": mid, "user_id": cid})
        assert n["count"] == 1 and not n["sbloccato"]
        # numeri del negozio
        g = (await c.get("/api/merchants/me/sconticini", headers=mh)).json()
        assert g["numeri"]["sconticini_assegnati"] == 4 and g["numeri"]["premi_sbloccati"] == 1
        assert g["numeri"]["premi_da_usare"] == 1 and g["numeri"]["clienti_con_tessera"] == 1
        assert g["premi"][0]["cliente"] == "Giulia R." and "Rossi" not in str(g)
    run(body, required=False)


def test_premio_giorni_da_ambiente(monkeypatch):
    monkeypatch.setenv("SCONTICINI_ENABLED", "true")
    monkeypatch.setenv("SCONTICINI_PREMIO_GIORNI", "10")

    async def body(c):
        mid, mh, cid, ch, did = await negozio_e_cliente()
        await attiva(c, mh, soglia=3)
        await raggiungi_soglia(monkeypatch, mid, cid, 3)
        p = await server.db.sconticini_premi.find_one({"user_id": cid})
        assert (datetime.fromisoformat(p["expires_at"]) - datetime.fromisoformat(p["created_at"])).days == 10
    run(body, required=False)


def test_modifica_della_soglia_non_tocca_i_premi_gia_sbloccati(monkeypatch):
    monkeypatch.setenv("SCONTICINI_ENABLED", "true")

    async def body(c):
        mid, mh, cid, ch, did = await negozio_e_cliente()
        await attiva(c, mh, soglia=3, premio="Un caffè")
        await raggiungi_soglia(monkeypatch, mid, cid, 3)
        await attiva(c, mh, soglia=10, premio="Una cena")
        p = await server.db.sconticini_premi.find_one({"user_id": cid})
        assert p["premio"] == "Un caffè" and p["soglia"] == 3
    run(body, required=False)


# ---------- QR del premio ----------
async def premio_sbloccato(c, monkeypatch, mid, mh, cid):
    await attiva(c, mh, soglia=3, premio="Un caffè offerto")
    await raggiungi_soglia(monkeypatch, mid, cid, 3)
    return await server.db.sconticini_premi.find_one({"user_id": cid})


def test_qr_premio_monouso_convalidato_come_uno_sconto(monkeypatch):
    monkeypatch.setenv("SCONTICINI_ENABLED", "true")

    async def body(c):
        mid, mh, cid, ch, did = await negozio_e_cliente()
        p = await premio_sbloccato(c, monkeypatch, mid, mh, cid)
        sc = await codice_negozio(c, mh)
        # solo il proprietario ottiene il QR
        _, altro = await nuovo_utente("client")
        assert (await c.get(f"/api/sconticini/premi/{p['id']}/token", headers=altro)).status_code == 404
        tk = (await c.get(f"/api/sconticini/premi/{p['id']}/token", headers=ch)).json()
        assert tk["qr_value"].split("/qr/")[-1].startswith(p["code"]) and tk["window_sec"] == 20
        token = tk["qr_value"].split("/qr/")[-1]
        # la pagina pubblica dice solo «valido» e che è un premio, nessun dato personale
        v = (await c.get("/api/qr/verify", params={"token": token})).json()
        assert v["valid"] and v["premio"] and v["discount_title"] == "Premio Sconticini: Un caffè offerto"
        assert "Giulia" not in str(v) and cid not in str(v)
        # senza il codice del negozio non si usa
        assert (await c.post("/api/qr/redeem", json={"token": token})).status_code == 403
        assert (await server.db.sconticini_premi.find_one({"id": p["id"]}))["status"] == "pending"
        # col codice: usato, nome breve, nessun nuovo sconticino
        r = await c.post("/api/qr/redeem", json={"token": token, "shop_code": sc})
        d = r.json()
        assert r.status_code == 200 and d["valid"] and d["premio"] and d["client_name"] == "Giulia R."
        assert "sconticino" not in d and "Rossi" not in r.text
        assert (await server.db.sconticini_saldi.find_one({"user_id": cid}))["count"] == 0
        assert await soli_eventi("premio_usato") == 1 and await soli_eventi("guadagnato") == 3
        # monouso: dopo la finestra il QR non vale più
        await server.db.sconticini_premi.update_one(
            {"id": p["id"]}, {"$set": {"redeemed_at": (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()}})
        r = await c.post("/api/qr/redeem", json={"token": token, "shop_code": sc})
        assert r.status_code == 400 and r.json()["error"] == "used"
        assert (await c.get(f"/api/sconticini/premi/{p['id']}/token", headers=ch)).status_code == 409
        assert await soli_eventi("premio_usato") == 1
    run(body, required=False)


def test_premio_scaduto_non_si_usa(monkeypatch):
    monkeypatch.setenv("SCONTICINI_ENABLED", "true")

    async def body(c):
        mid, mh, cid, ch, did = await negozio_e_cliente()
        p = await premio_sbloccato(c, monkeypatch, mid, mh, cid)
        sc = await codice_negozio(c, mh)
        token = (await c.get(f"/api/sconticini/premi/{p['id']}/token", headers=ch)).json()["qr_value"].split("/qr/")[-1]
        await server.db.sconticini_premi.update_one(
            {"id": p["id"]}, {"$set": {"expires_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()}})
        r = await c.post("/api/qr/redeem", json={"token": token, "shop_code": sc})
        assert r.status_code == 400 and "scaduto" in r.json()["reason"]
        assert (await server.db.sconticini_premi.find_one({"id": p["id"]}))["status"] == "expired"
        assert await soli_eventi("premio_scaduto") == 1 and await soli_eventi("premio_usato") == 0
        assert (await c.get(f"/api/sconticini/premi/{p['id']}/token", headers=ch)).status_code == 410
        g = (await c.get("/api/merchants/me/sconticini", headers=mh)).json()
        assert g["numeri"]["premi_scaduti"] == 1 and g["numeri"]["premi_da_usare"] == 0
    run(body, required=False)


def test_premio_con_firma_sbagliata_o_di_un_altro_negozio(monkeypatch):
    monkeypatch.setenv("SCONTICINI_ENABLED", "true")

    async def body(c):
        mid, mh, cid, ch, did = await negozio_e_cliente()
        p = await premio_sbloccato(c, monkeypatch, mid, mh, cid)
        slot = server.current_slot()
        r = await c.post("/api/qr/redeem", json={"token": f"{p['code']}.{slot}.sbagliato", "shop_code": "1234"})
        assert r.status_code == 400
        # un altro commerciante collegato non può usare il premio di questo negozio
        _, altro_m = await nuovo_utente("merchant")
        tok = f"{p['code']}.{slot}.{server._rotating_hmac(p['code'], slot)}"
        r = await c.post("/api/qr/redeem", json={"token": tok}, headers=altro_m)
        assert r.status_code == 403
        assert (await server.db.sconticini_premi.find_one({"id": p["id"]}))["status"] == "pending"
    run(body, required=False)


def test_commerciante_collegato_sconticino_e_premio_con_verify(monkeypatch):
    monkeypatch.setenv("SCONTICINI_ENABLED", "true")

    async def body(c):
        mid, mh, cid, ch, did = await negozio_e_cliente()
        await attiva(c, mh, soglia=3)
        rid, tok = await qr_nuovo(mid, cid, did)
        code = tok.split(".")[0]
        r = await c.post("/api/redemptions/verify", json={"code": tok}, headers=mh)
        assert r.status_code == 200 and r.json()["sconticino"]["count"] == 1
        # premio
        await raggiungi_soglia(monkeypatch, mid, cid, 3)
        p = await server.db.sconticini_premi.find_one({"user_id": cid})
        slot = server.current_slot()
        tp = f"{p['code']}.{slot}.{server._rotating_hmac(p['code'], slot)}"
        r = await c.post("/api/redemptions/verify", json={"code": tp}, headers=mh)
        assert r.status_code == 200 and r.json()["redemption"]["premio"] and r.json()["redemption"]["client_name"] == "Giulia R."
        r = await c.post("/api/redemptions/verify", json={"code": tp}, headers=mh)
        assert r.status_code == 400
    run(body, required=False)


# ---------- email ----------
def test_email_al_cliente_e_al_negozio_alla_soglia(monkeypatch):
    monkeypatch.setenv("SCONTICINI_ENABLED", "true")
    inviate = []

    async def finto_cliente(*a):
        inviate.append(("cliente",) + a)

    async def finto_negozio(*a):
        inviate.append(("negozio",) + a)
    monkeypatch.setattr(server, "send_sconticini_premio_cliente", finto_cliente)
    monkeypatch.setattr(server, "send_sconticini_premio_negozio", finto_negozio)

    async def body(c):
        mid, mh, cid, ch, did = await negozio_e_cliente("Mario Rossi")
        await attiva(c, mh, soglia=3, premio="Un caffè")
        await raggiungi_soglia(monkeypatch, mid, cid, 2)
        await asyncio.sleep(0.05)
        assert inviate == []  # niente email prima della soglia
        monkeypatch.setattr(server, "_rome_day", lambda dt_iso=None: "2099-04-01")
        await server._sconticini_dopo_riscatto({"id": str(uuid.uuid4()), "merchant_id": mid, "user_id": cid})
        await asyncio.sleep(0.05)
        assert sorted(x[0] for x in inviate) == ["cliente", "negozio"]
        cli = next(x for x in inviate if x[0] == "cliente")
        neg = next(x for x in inviate if x[0] == "negozio")
        assert cli[1].startswith("client.") and cli[3] == "Negozio di prova" and cli[4] == "Un caffè"
        assert neg[1].startswith("merchant.") and neg[4] == "Mario R." and "Rossi" not in str(neg)
    run(body, required=False)


def test_testi_delle_email():
    import email_service as es

    async def prova():
        es._send = _cattura
        await es.send_sconticini_premio_cliente("a@example.com", "Giulia Rossi", "Osteria <b>X</b>", "Un caffè", "1 gennaio 2030")
        await es.send_sconticini_premio_negozio("n@example.com", "Anna Bianchi", "Osteria", "Mario R.", "Un caffè", "1 gennaio 2030")
    inviati = []

    async def _cattura(to, subject, html):
        inviati.append((to, subject, html))
    originale = es._send
    try:
        asyncio.run(prova())
    finally:
        es._send = originale
    cliente, negozio = inviati
    assert "&lt;b&gt;" in cliente[2] and "<b>X</b>" not in cliente[2]  # testo del negozio sempre protetto
    assert "#sconticini" in cliente[2] and "Giulia" in cliente[2] and "Rossi" not in cliente[2]
    assert "Mario R." in negozio[2] and "a carico del negozio" in negozio[2]
    for _, _, html in inviati:
        assert "gratis" not in html.lower() and "garantit" not in html.lower()


# ---------- admin, GDPR ----------
async def admin_headers(c):
    _, h = await nuovo_utente("admin")
    m = await c.post("/api/admin/verify-master", json={"password": MASTER}, headers=h)
    assert m.status_code == 200, m.text
    return {**h, "X-Admin-Master": m.json()["token"]}


def test_admin_vede_tutto_e_puo_sospendere(monkeypatch):
    monkeypatch.setenv("SCONTICINI_ENABLED", "true")

    async def body(c):
        mid, mh, cid, ch, did = await negozio_e_cliente("Mario Rossi")
        ah = await admin_headers(c)
        await attiva(c, mh, soglia=3)
        await raggiungi_soglia(monkeypatch, mid, cid, 3)
        a = (await c.get("/api/admin/sconticini", headers=ah)).json()
        assert a["enabled"] and a["totali"]["sconticini_assegnati"] == 3 and a["totali"]["premi_sbloccati"] == 1
        assert a["negozi"][0]["shop_name"] == "Negozio di prova" and a["negozi"][0]["regolamento_accettato_il"]
        tipi = {e["tipo"] for e in a["eventi"]}
        assert {"guadagnato", "premio_sbloccato", "config"} <= tipi
        assert any(e.get("client_name") == "Mario Rossi" for e in a["eventi"])  # admin: nome intero
        assert all("chiave" not in e for e in a["eventi"])
        # senza master password niente
        _, solo_admin = await nuovo_utente("admin")
        assert (await c.get("/api/admin/sconticini", headers=solo_admin)).status_code == 403
        assert (await c.get("/api/admin/sconticini", headers=mh)).status_code == 403
        # sospensione: non si contano più sconticini, i premi già sbloccati restano
        r = await c.post(f"/api/admin/sconticini/negozi/{mid}/sospendi", json={"sospeso": True}, headers=ah)
        assert r.status_code == 200
        monkeypatch.setattr(server, "_rome_day", lambda dt_iso=None: "2099-09-09")
        assert await server._sconticini_dopo_riscatto({"id": str(uuid.uuid4()), "merchant_id": mid, "user_id": cid}) is None
        t = (await c.get("/api/sconticini/me", headers=ch)).json()["tessere"][0]
        assert t["attivo"] is False and len(t["premi"]) == 1
        assert (await c.post(f"/api/admin/sconticini/negozi/{uuid.uuid4()}/sospendi", json={"sospeso": True}, headers=ah)).status_code == 404
    run(body, required=False)


def test_admin_con_interruttore_spento():
    async def body(c):
        ah = await admin_headers(c)
        assert (await c.get("/api/admin/sconticini", headers=ah)).json() == {"enabled": False}
    run(body, required=False)


def test_gdpr_esporta_e_cancella(monkeypatch):
    monkeypatch.setenv("SCONTICINI_ENABLED", "true")

    async def body(c):
        mid, mh, cid, ch, did = await negozio_e_cliente()
        await attiva(c, mh, soglia=3)
        await raggiungi_soglia(monkeypatch, mid, cid, 3)
        exp = (await c.get("/api/gdpr/export", headers=ch)).json()["sconticini"]
        assert len(exp["saldi"]) == 1 and len(exp["premi"]) == 1 and len(exp["eventi"]) >= 3
        assert all("code" not in p for p in exp["premi"])  # il codice del QR non è un dato da esportare
        assert (await c.delete("/api/gdpr/delete-account", headers=ch)).status_code == 200
        for coll in (server.db.sconticini_saldi, server.db.sconticini_premi):
            assert await coll.count_documents({"user_id": cid}) == 0
        assert await server.db.sconticini_eventi.count_documents({"user_id": cid}) == 0
        # il negozio che si cancella porta via tutto il resto
        await raggiungi_soglia(monkeypatch, mid, (await nuovo_utente("client"))[0], 3)
        assert (await c.delete("/api/gdpr/delete-account", headers=mh)).status_code == 200
        for coll in (server.db.sconticini_config, server.db.sconticini_saldi, server.db.sconticini_premi,
                     server.db.sconticini_eventi):
            assert await coll.count_documents({"merchant_id": mid}) == 0
    run(body, required=False)
