"""Codice del negozio (4 cifre al banco): generazione, cambio, convalida giusta/sbagliata, blocco dopo
5 errori, nome del cliente mai esposto senza prova, attestato «ricordato» (valido, scaduto, invalidato
dal cambio codice), QR non consumato con codice errato. Database locale (mongomock) come gli altri test."""
import re
import uuid
from datetime import datetime, timedelta, timezone

import jwt

from test_interruttore_abbonamento import nuovo_utente, run, server


async def scenario(nome="Giulia Rossi"):
    """Negozio, cliente e una riscossione in attesa; ritorna (mid, header_negozio, funzione che dà il QR)."""
    mid, mh = await nuovo_utente("merchant")
    did = str(uuid.uuid4())
    await server.db.discounts.insert_one({"id": did, "merchant_id": mid, "title": "Menù di pesce",
                                          "original_price": 40.0, "discounted_price": 20.0})
    now = datetime.now(timezone.utc).isoformat()
    n = {"i": 0}

    async def qr(stesso_cliente=False):
        # ogni QR ha un cliente nuovo: altrimenti scatta il limite di un utilizzo al giorno
        n["i"] += 1
        if not stesso_cliente or "cid" not in n:
            n["cid"], _ = await nuovo_utente("client")
            await server.db.users.update_one({"id": n["cid"]}, {"$set": {"name": nome}})
        cid = n["cid"]
        code = f"QR{uuid.uuid4().hex[:8].upper()}"
        await server.db.redemptions.insert_one({
            "id": f"r-{uuid.uuid4().hex[:6]}", "code": code, "user_id": cid, "merchant_id": mid, "discount_id": did,
            "status": "pending", "month_key": now[:7], "created_at": now, "redeemed_at": None})
        slot = server.current_slot()
        return code, f"{code}.{slot}.{server._rotating_hmac(code, slot)}"
    return mid, mh, qr


def test_codice_generato_stabile_e_non_nel_profilo():
    async def body(c):
        mid, mh, _ = await scenario()
        r = await c.get("/api/merchants/me/shop-code", headers=mh)
        assert r.status_code == 200, r.text
        d = r.json()
        assert re.fullmatch(r"\d{4}", d["code"]) and d["version"] == 1
        assert (await c.get("/api/merchants/me/shop-code", headers=mh)).json()["code"] == d["code"]
        # non esce dal profilo né da /auth/me
        me = await c.get("/api/auth/me", headers=mh)
        assert "shop_code" not in me.text and d["code"] not in me.json()["user"].values()
        # solo il commerciante
        _, ch = await nuovo_utente("client")
        assert (await c.get("/api/merchants/me/shop-code", headers=ch)).status_code == 403
        assert (await c.get("/api/merchants/me/shop-code")).status_code == 401
        assert (await c.post("/api/merchants/me/shop-code/regenerate", headers=ch)).status_code == 403
    run(body, required=False)


def test_codici_casuali_non_sequenziali():
    codici = {server._new_shop_code() for _ in range(60)}
    assert len(codici) > 40  # non una sequenza né un valore fisso
    assert all(re.fullmatch(r"\d{4}", x) for x in codici)
    assert server._new_shop_code(exclude="1234") != "1234"


def test_cambio_codice_invalida_il_vecchio():
    async def body(c):
        mid, mh, qr = await scenario()
        vecchio = (await c.get("/api/merchants/me/shop-code", headers=mh)).json()
        n = (await c.post("/api/merchants/me/shop-code/regenerate", headers=mh)).json()
        assert n["code"] != vecchio["code"] and n["version"] == vecchio["version"] + 1
        _, tok = await qr()
        r = await c.post("/api/qr/redeem", json={"token": tok, "shop_code": vecchio["code"]})
        assert r.status_code == 403 and r.json()["error"] == "wrong_code"
        r = await c.post("/api/qr/redeem", json={"token": tok, "shop_code": n["code"]})
        assert r.status_code == 200 and r.json()["client_name"] == "Giulia R."
    run(body, required=False)


def test_pagina_pubblica_senza_nome_e_senza_consumo():
    async def body(c):
        mid, mh, qr = await scenario("Mario Rossi")
        code, tok = await qr()
        r = await c.get("/api/qr/verify", params={"token": tok})
        d = r.json()
        assert d["valid"] is True and d["discount_title"] == "Menù di pesce" and d["shop_name"] == "Negozio di prova"
        for vietato in ("Mario", "Rossi", "client", "user_id", "use_number", "prev_used"):
            assert vietato not in r.text, vietato
        # guardare la pagina non consuma lo sconto
        assert (await server.db.redemptions.find_one({"code": code}))["status"] == "pending"
        r2 = await c.get("/api/qr/verify", params={"token": tok})
        assert r2.json()["valid"] is True
        # anche i QR non validi non danno dettagli personali
        for t in ("x", f"{code}.{server.current_slot()}.sbagliato", f"{code}.1.abc"):
            j = (await c.get("/api/qr/verify", params={"token": t})).json()
            assert j["valid"] is False and set(j) == {"valid", "reason"}
    run(body, required=False)


def test_codice_giusto_consuma_e_mostra_il_nome_breve():
    async def body(c):
        mid, mh, qr = await scenario("Giulia Rossi")
        code, tok = await qr()
        sc = (await c.get("/api/merchants/me/shop-code", headers=mh)).json()["code"]
        r = await c.post("/api/qr/redeem", json={"token": tok, "shop_code": sc})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["valid"] and d["client_name"] == "Giulia R." and d["discount_title"] == "Menù di pesce"
        assert "Rossi" not in r.text and "user_id" not in r.text and "device_token" not in d
        assert (await server.db.redemptions.find_one({"code": code}))["status"] == "redeemed"
        # una seconda scansione dopo la finestra: già utilizzato
        await server.db.redemptions.update_one(
            {"code": code}, {"$set": {"redeemed_at": (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()}})
        r = await c.post("/api/qr/redeem", json={"token": tok, "shop_code": sc})
        assert r.status_code == 400 and r.json()["error"] == "used" and "Giulia" not in r.text
        assert (await c.get("/api/qr/verify", params={"token": tok})).json() == {"valid": False, "reason": "Codice già utilizzato"}
    run(body, required=False)


def test_codice_sbagliato_non_consuma_e_nessun_nome():
    async def body(c):
        mid, mh, qr = await scenario("Mario Rossi")
        code, tok = await qr()
        sc = (await c.get("/api/merchants/me/shop-code", headers=mh)).json()["code"]
        sbagliato = f"{(int(sc) + 1) % 10000:04d}"
        r = await c.post("/api/qr/redeem", json={"token": tok, "shop_code": sbagliato})
        assert r.status_code == 403
        d = r.json()
        assert d["valid"] is False and d["error"] == "wrong_code" and d["reason"] == "Codice del negozio errato"
        assert d["attempts_left"] == 4
        assert "Mario" not in r.text and "Rossi" not in r.text
        assert (await server.db.redemptions.find_one({"code": code}))["status"] == "pending"
        # senza codice: richiesto, mai consumato
        r = await c.post("/api/qr/redeem", json={"token": tok})
        assert r.status_code == 403 and r.json()["error"] == "code_required" and "Mario" not in r.text
        assert (await server.db.redemptions.find_one({"code": code}))["status"] == "pending"
        # QR manomesso o scaduto: rifiutato prima del codice
        r = await c.post("/api/qr/redeem", json={"token": f"{code}.{server.current_slot()}.beef", "shop_code": sc})
        assert r.status_code == 400 and r.json()["reason"] == "QR code manomesso"
        vecchio = server.current_slot() - 5
        r = await c.post("/api/qr/redeem", json={"token": f"{code}.{vecchio}.{server._rotating_hmac(code, vecchio)}", "shop_code": sc})
        assert r.json()["reason"] == "QR code scaduto"
        assert (await server.db.redemptions.find_one({"code": code}))["status"] == "pending"
    run(body, required=False)


def test_blocco_dopo_cinque_errori_per_negozio():
    async def body(c):
        mid, mh, qr = await scenario()
        altro_mid, _, altro_qr = await scenario()
        code, tok = await qr()
        sc = (await c.get("/api/merchants/me/shop-code", headers=mh)).json()["code"]
        sbagliato = f"{(int(sc) + 1) % 10000:04d}"
        for i in range(5):
            r = await c.post("/api/qr/redeem", json={"token": tok, "shop_code": sbagliato})
            assert r.status_code == 403 and r.json()["attempts_left"] == 4 - i
        # il sesto tentativo è bloccato, anche se il codice è giusto
        r = await c.post("/api/qr/redeem", json={"token": tok, "shop_code": sc})
        assert r.status_code == 429, r.text
        d = r.json()
        assert d["error"] == "locked" and "Riprova" in d["reason"] and 0 < d["retry_after_sec"] <= 15 * 60
        assert (await server.db.redemptions.find_one({"code": code}))["status"] == "pending"
        # il blocco non tocca gli altri negozi
        _, tok2 = await altro_qr()
        sc2 = await server.db.users.find_one({"id": altro_mid})
        sc2 = (await server.db.users.find_one({"id": altro_mid})).get("shop_code") or server._new_shop_code()
        await server.db.users.update_one({"id": altro_mid}, {"$set": {"shop_code": sc2, "shop_code_version": 1}})
        assert (await c.post("/api/qr/redeem", json={"token": tok2, "shop_code": sc2})).status_code == 200
        # il commerciante già collegato non dipende dal blocco
        assert (await c.post("/api/qr/redeem", json={"token": tok}, headers=mh)).status_code == 200
    run(body, required=False)


def test_blocco_finisce_dopo_quindici_minuti_e_codice_giusto_azzera():
    async def body(c):
        mid, mh, qr = await scenario()
        code, tok = await qr()
        sc = (await c.get("/api/merchants/me/shop-code", headers=mh)).json()["code"]
        sbagliato = f"{(int(sc) + 1) % 10000:04d}"
        for _ in range(5):
            await c.post("/api/qr/redeem", json={"token": tok, "shop_code": sbagliato})
        assert (await c.post("/api/qr/redeem", json={"token": tok, "shop_code": sc})).status_code == 429
        # i tentativi di 16 minuti fa non contano più
        vecchi = [(datetime.now(timezone.utc) - timedelta(minutes=16, seconds=i)).isoformat() + "#x" for i in range(5)]
        await server.db.shop_code_attempts.update_one({"merchant_id": mid}, {"$set": {"t": vecchi}})
        r = await c.post("/api/qr/redeem", json={"token": tok, "shop_code": sc})
        assert r.status_code == 200, r.text
        # un codice giusto non lascia tentativi in conto
        assert (await server.db.shop_code_attempts.find_one({"merchant_id": mid}))["t"] == []
    run(body, required=False)


def test_ricorda_questo_telefono_valido_scaduto_e_invalidato_dal_cambio():
    async def body(c):
        mid, mh, qr = await scenario()
        sc = (await c.get("/api/merchants/me/shop-code", headers=mh)).json()["code"]
        # senza «ricorda» nessun attestato
        _, tok = await qr()
        r = await c.post("/api/qr/redeem", json={"token": tok, "shop_code": sc})
        assert "device_token" not in r.json()
        # con «ricorda»: attestato firmato, 90 giorni, senza il codice in chiaro
        _, tok = await qr()
        r = await c.post("/api/qr/redeem", json={"token": tok, "shop_code": sc, "remember": True})
        d = r.json()
        dt = d["device_token"]
        assert d["device_days"] == 90 and sc not in dt.split(".")[1] and "shop_code" not in str(jwt.decode(dt, options={"verify_signature": False}))
        claims = jwt.decode(dt, server.JWT_SECRET, algorithms=["HS256"])
        assert claims["sub"] == mid and claims["type"] == "shop_device"
        assert 89 <= (datetime.fromtimestamp(claims["exp"], timezone.utc) - datetime.now(timezone.utc)).days <= 90
        # con l'attestato basta un tocco, senza codice
        code3, tok = await qr()
        r = await c.post("/api/qr/redeem", json={"token": tok, "device_token": dt})
        assert r.status_code == 200 and r.json()["client_name"] == "Giulia R." and "device_token" not in r.json()
        # l'attestato non vale per un altro negozio
        _, _, qr_altro = await scenario()
        _, tok_altro = await qr_altro()
        r = await c.post("/api/qr/redeem", json={"token": tok_altro, "device_token": dt})
        assert r.status_code == 403 and r.json()["error"] == "device_invalid" and "Giulia" not in r.text
        # non è un token di accesso, e un token di accesso non è un attestato
        assert (await c.get("/api/auth/me", headers={"Authorization": f"Bearer {dt}"})).status_code == 401
        # scaduto
        scaduto = jwt.encode({"type": "shop_device", "sub": mid, "ver": 1,
                              "exp": datetime.now(timezone.utc) - timedelta(seconds=5)}, server.JWT_SECRET, algorithm="HS256")
        _, tok = await qr()
        r = await c.post("/api/qr/redeem", json={"token": tok, "device_token": scaduto})
        assert r.status_code == 403 and r.json()["error"] == "device_invalid"
        # manomesso (firma di un altro segreto)
        falso = jwt.encode({"type": "shop_device", "sub": mid, "ver": 1,
                            "exp": datetime.now(timezone.utc) + timedelta(days=5)}, "altro-segreto-0123456789abcdef0123", algorithm="HS256")
        assert (await c.post("/api/qr/redeem", json={"token": tok, "device_token": falso})).json()["error"] == "device_invalid"
        # cambio codice: l'attestato di prima non vale più
        await c.post("/api/merchants/me/shop-code/regenerate", headers=mh)
        r = await c.post("/api/qr/redeem", json={"token": tok, "device_token": dt})
        assert r.status_code == 403 and r.json()["error"] == "device_invalid"
        assert (await server.db.redemptions.find_one({"code": tok.split(".")[0]}))["status"] == "pending"
    run(body, required=False)


def test_commerciante_collegato_senza_codice_ma_solo_il_suo_negozio():
    async def body(c):
        mid, mh, qr = await scenario("Mario Rossi")
        code, tok = await qr()
        # un altro commerciante collegato non ha il permesso
        _, altro_h = await nuovo_utente("merchant")
        r = await c.post("/api/qr/redeem", json={"token": tok}, headers=altro_h)
        assert r.status_code == 403 and r.json()["error"] == "code_required" and "Mario" not in r.text
        # un cliente collegato nemmeno
        _, ch = await nuovo_utente("client")
        assert (await c.post("/api/qr/redeem", json={"token": tok}, headers=ch)).status_code == 403
        assert (await server.db.redemptions.find_one({"code": code}))["status"] == "pending"
        # il titolare del negozio sì
        r = await c.post("/api/qr/redeem", json={"token": tok}, headers=mh)
        assert r.status_code == 200 and r.json()["client_name"] == "Mario R."
    run(body, required=False)


def test_limite_giornaliero_dopo_il_codice():
    async def body(c):
        mid, mh, qr = await scenario()
        sc = (await c.get("/api/merchants/me/shop-code", headers=mh)).json()["code"]
        _, tok1 = await qr()
        assert (await c.post("/api/qr/redeem", json={"token": tok1, "shop_code": sc})).status_code == 200
        code2, tok2 = await qr(stesso_cliente=True)
        r = await c.post("/api/qr/redeem", json={"token": tok2, "shop_code": sc})
        assert r.status_code == 400 and r.json()["error"] == "daily_limit"
        assert (await server.db.redemptions.find_one({"code": code2}))["status"] == "pending"
    run(body, required=False)
