"""Codice del negozio visto dall'admin: lettura e «Rigenera» per un singolo negozio.
Solo admin con master password; il codice non compare in liste né in log. Database locale (mongomock)."""
import logging
import re
import uuid

from test_interruttore_abbonamento import nuovo_utente, run, server

MASTER = "master-test-123456"


async def admin_master(c):
    _, h = await nuovo_utente("admin")
    m = await c.post("/api/admin/verify-master", json={"password": MASTER}, headers=h)
    assert m.status_code == 200, m.text
    return {**h, "X-Admin-Master": m.json()["token"]}, h


def test_admin_vede_il_codice_e_coincide_con_quello_del_commerciante(monkeypatch):
    monkeypatch.setenv("ADMIN_MASTER_PASSWORD", MASTER)

    async def body(c):
        mid, mh = await nuovo_utente("merchant")
        ah, _ = await admin_master(c)
        r = await c.get(f"/api/admin/merchants/{mid}/shop-code", headers=ah)
        assert r.status_code == 200, r.text
        d = r.json()
        assert re.fullmatch(r"\d{4}", d["code"]) and d["version"] == 1
        mio = (await c.get("/api/merchants/me/shop-code", headers=mh)).json()
        assert mio["code"] == d["code"]
    run(body, required=False)


def test_rigenera_nuovo_codice_versione_piu_uno_e_azzera_tentativi(monkeypatch):
    monkeypatch.setenv("ADMIN_MASTER_PASSWORD", MASTER)

    async def body(c):
        mid, mh = await nuovo_utente("merchant")
        altro, _ = await nuovo_utente("merchant")
        ah, _ = await admin_master(c)
        prima = (await c.get(f"/api/admin/merchants/{mid}/shop-code", headers=ah)).json()
        altro_prima = (await c.get(f"/api/admin/merchants/{altro}/shop-code", headers=ah)).json()
        await server.db.shop_code_attempts.insert_one({"merchant_id": mid, "t": ["2026-10-08T10:00:00+00:00#x"] * 3})
        r = await c.post(f"/api/admin/merchants/{mid}/shop-code/regenerate", headers=ah)
        assert r.status_code == 200, r.text
        dopo = r.json()
        assert re.fullmatch(r"\d{4}", dopo["code"]) and dopo["code"] != prima["code"]
        assert dopo["version"] == prima["version"] + 1
        assert await server.db.shop_code_attempts.find_one({"merchant_id": mid}) is None
        # il commerciante vede subito il nuovo codice; l'altro negozio non cambia
        assert (await c.get("/api/merchants/me/shop-code", headers=mh)).json()["code"] == dopo["code"]
        assert (await c.get(f"/api/admin/merchants/{altro}/shop-code", headers=ah)).json() == altro_prima
    run(body, required=False)


def test_solo_admin_con_master_e_solo_commercianti(monkeypatch):
    monkeypatch.setenv("ADMIN_MASTER_PASSWORD", MASTER)

    async def body(c):
        mid, mh = await nuovo_utente("merchant")
        cid, ch = await nuovo_utente("client")
        ah, admin_senza_master = await admin_master(c)
        url = f"/api/admin/merchants/{mid}/shop-code"
        for nome, h in [("commerciante", mh), ("cliente", ch), ("admin senza master", admin_senza_master), ("anonimo", {})]:
            assert (await c.get(url, headers=h)).status_code in (401, 403), nome
            assert (await c.post(url + "/regenerate", headers=h)).status_code in (401, 403), nome
        # id inesistente o utente che non è un negozio: 404, e nessun codice creato
        falso = str(uuid.uuid4())
        assert (await c.get(f"/api/admin/merchants/{falso}/shop-code", headers=ah)).status_code == 404
        assert (await c.post(f"/api/admin/merchants/{falso}/shop-code/regenerate", headers=ah)).status_code == 404
        assert (await c.get(f"/api/admin/merchants/{cid}/shop-code", headers=ah)).status_code == 404
        assert (await c.post(f"/api/admin/merchants/{cid}/shop-code/regenerate", headers=ah)).status_code == 404
        assert not (await server.db.users.find_one({"id": cid})).get("shop_code")
    run(body, required=False)


def test_codice_mai_nelle_liste_ne_nei_log(monkeypatch, caplog):
    monkeypatch.setenv("ADMIN_MASTER_PASSWORD", MASTER)

    async def body(c):
        mid, mh = await nuovo_utente("merchant")
        ah, _ = await admin_master(c)
        with caplog.at_level(logging.DEBUG):
            await c.get(f"/api/admin/merchants/{mid}/shop-code", headers=ah)
            await c.post(f"/api/admin/merchants/{mid}/shop-code/regenerate", headers=ah)
        assert "shop_code" not in "\n".join(r.getMessage() for r in caplog.records)
        lista = await c.get("/api/admin/merchants", headers=ah)
        assert lista.status_code == 200 and "shop_code" not in lista.text
        assert "shop_code" not in (await c.get("/api/auth/me", headers=mh)).text
    run(body, required=False)
