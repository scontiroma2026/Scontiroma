"""Permesso breve (2 minuti): il QR non scade mentre si scrive il codice del negozio, ma non sostituisce
la prova del negozio. Monouso, legato a QR e negozio, senza dati personali."""
from datetime import datetime, timedelta, timezone

import jwt

from test_codice_negozio import scenario
from test_interruttore_abbonamento import run, server


def _tempo_passato(slot_avanti=5):
    """Fa sembrare passato del tempo: la finestra dei 20 secondi del QR scade."""
    vero = server.current_slot
    server.current_slot = lambda: vero() + slot_avanti
    return lambda: setattr(server, "current_slot", vero)


def test_permesso_emesso_solo_per_qr_valido_e_senza_dati_personali():
    async def body(c):
        mid, mh, qr = await scenario("Mario Rossi")
        code, tok = await qr()
        r = await c.get("/api/qr/verify", params={"token": tok})
        d = r.json()
        assert d["valid"] and d["permit"] and d["permit_sec"] == 120
        claims = jwt.decode(d["permit"], server.JWT_SECRET, algorithms=["HS256"])
        assert claims["type"] == "qr_permit" and claims["mid"] == mid
        assert "Mario" not in r.text and "Rossi" not in r.text and "Mario" not in str(claims)
        for t in ("x", f"{code}.{server.current_slot()}.sbagliato", f"{code}.1.abc"):
            assert "permit" not in (await c.get("/api/qr/verify", params={"token": t})).json()
        await server.db.redemptions.update_one({"code": code}, {"$set": {"status": "redeemed", "redeemed_at": "2020-01-01T00:00:00+00:00"}})
        assert "permit" not in (await c.get("/api/qr/verify", params={"token": tok})).json()
    run(body, required=False)


def test_redeem_dopo_scadenza_qr_ma_entro_due_minuti_e_monouso():
    async def body(c):
        mid, mh, qr = await scenario("Giulia Rossi")
        code, tok = await qr()
        sc = (await c.get("/api/merchants/me/shop-code", headers=mh)).json()["code"]
        permit = (await c.get("/api/qr/verify", params={"token": tok})).json()["permit"]
        ripristina = _tempo_passato()
        try:
            r = await c.post("/api/qr/redeem", json={"token": tok, "shop_code": sc})
            assert r.json()["reason"] == "QR code scaduto"  # senza permesso il QR è scaduto
            # il permesso NON sostituisce il codice del negozio
            r = await c.post("/api/qr/redeem", json={"token": tok, "permit": permit})
            assert r.status_code == 403 and r.json()["error"] == "code_required" and "Giulia" not in r.text
            sbagliato = f"{(int(sc) + 1) % 10000:04d}"
            r = await c.post("/api/qr/redeem", json={"token": tok, "permit": permit, "shop_code": sbagliato})
            assert r.status_code == 403 and r.json()["error"] == "wrong_code" and "Giulia" not in r.text
            assert (await server.db.redemptions.find_one({"code": code}))["status"] == "pending"
            r = await c.post("/api/qr/redeem", json={"token": tok, "permit": permit, "shop_code": sc})
            assert r.status_code == 200 and r.json()["client_name"] == "Giulia R."
            # monouso
            r = await c.post("/api/qr/redeem", json={"token": tok, "permit": permit, "shop_code": sc})
            assert r.status_code == 400 and r.json()["error"] == "permit_expired" and "Giulia" not in r.text
        finally:
            ripristina()
    run(body, required=False)


def test_permesso_scaduto_o_di_altro_qr_o_negozio_rifiutato():
    async def body(c):
        mid, mh, qr = await scenario()
        sc = (await c.get("/api/merchants/me/shop-code", headers=mh)).json()["code"]
        code, tok = await qr()
        r = await server.db.redemptions.find_one({"code": code})
        scaduto = jwt.encode({"type": "qr_permit", "sub": r["id"], "code": code, "mid": mid, "jti": "a",
                              "exp": datetime.now(timezone.utc) - timedelta(seconds=3)}, server.JWT_SECRET, algorithm="HS256")
        valido = server._qr_permit(r)
        code2, _ = await qr()
        altro_qr = server._qr_permit(await server.db.redemptions.find_one({"code": code2}))
        _, _, qr3 = await scenario()
        code3, _ = await qr3()
        altro_negozio = server._qr_permit(await server.db.redemptions.find_one({"code": code3}))
        falso = jwt.encode({"type": "qr_permit", "sub": r["id"], "code": code, "mid": mid, "jti": "b",
                            "exp": datetime.now(timezone.utc) + timedelta(seconds=90)}, "altro-segreto-0123456789abcdef0123", algorithm="HS256")
        ripristina = _tempo_passato()
        try:
            for p in (scaduto, altro_qr, altro_negozio, falso, "x"):
                r_ = await c.post("/api/qr/redeem", json={"token": tok, "permit": p, "shop_code": sc})
                assert r_.status_code == 400 and r_.json()["error"] == "permit_expired"
                assert "Il tempo è scaduto: chiedi al cliente di mostrare di nuovo il QR" == r_.json()["reason"]
            # la firma del QR resta obbligatoria
            r_ = await c.post("/api/qr/redeem", json={"token": f"{code}.{server.current_slot() - 9}.beef", "permit": valido, "shop_code": sc})
            assert r_.json()["reason"] == "QR code manomesso"
            assert (await server.db.redemptions.find_one({"code": code}))["status"] == "pending"
            assert (await c.post("/api/qr/redeem", json={"token": tok, "permit": valido, "shop_code": sc})).status_code == 200
        finally:
            ripristina()
    run(body, required=False)


def test_permesso_con_telefono_ricordato_e_limite_tentativi_invariato():
    async def body(c):
        mid, mh, qr = await scenario()
        sc = (await c.get("/api/merchants/me/shop-code", headers=mh)).json()["code"]
        _, tok0 = await qr()
        dt = (await c.post("/api/qr/redeem", json={"token": tok0, "shop_code": sc, "remember": True})).json()["device_token"]
        _, tok = await qr()
        permit = (await c.get("/api/qr/verify", params={"token": tok})).json()["permit"]
        ripristina = _tempo_passato()
        try:
            r = await c.post("/api/qr/redeem", json={"token": tok, "permit": permit, "device_token": dt})
            assert r.status_code == 200
            code2, tok2 = await qr()
            sbagliato = f"{(int(sc) + 1) % 10000:04d}"
            p2 = server._qr_permit(await server.db.redemptions.find_one({"code": code2}))
            for _ in range(5):
                await c.post("/api/qr/redeem", json={"token": tok2, "permit": p2, "shop_code": sbagliato})
            r = await c.post("/api/qr/redeem", json={"token": tok2, "permit": p2, "shop_code": sc})
            assert r.status_code == 429 and r.json()["error"] == "locked"
        finally:
            ripristina()
    run(body, required=False)
