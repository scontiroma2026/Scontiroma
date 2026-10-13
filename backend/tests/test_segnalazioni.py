"""Segnalazioni pubbliche, reclami dei commercianti, esito motivato e eliminazione dei clienti dall'admin.
Database locale (mongomock), email finte."""
import asyncio
import uuid

import pytest
from fastapi import HTTPException

from test_interruttore_abbonamento import run
import server


@pytest.fixture(autouse=True)
def _email_finte(monkeypatch):
    inviate = []

    async def finta_admin(*a, **k):
        inviate.append(("admin", a))

    async def finta_esito(*a, **k):
        inviate.append(("esito", a))

    monkeypatch.setattr(server, "send_admin_segnalazione", finta_admin)
    monkeypatch.setattr(server, "send_esito_segnalazione", finta_esito)
    monkeypatch.setenv("ADMIN_NOTIFY_EMAIL", "admin@example.com")
    server._segnalazioni_recenti.clear()
    return inviate


async def _negozio_con_offerta():
    uid = str(uuid.uuid4())
    await server.db.users.insert_one({"id": uid, "email": f"n{uid[:5]}@example.com", "role": "merchant", "name": "N",
                                      "shop_name": "Negozio"})
    did = f"d{uid[:5]}"
    await server.db.discounts.insert_one({"id": did, "merchant_id": uid, "title": "Offerta", "approval_status": "approved"})
    return uid, did, {"Authorization": f"Bearer {server.create_token(uid, 'x@example.com')}"}


def test_segnalazione_pubblica_e_esito(_email_finte):
    async def body(c):
        uid, did, _ = await _negozio_con_offerta()
        # troppo corta: rifiutata
        r = await c.post("/api/segnalazioni", json={"tipo": "altro", "motivo": "corto"})
        assert r.status_code == 422
        # il reclamo dei commercianti non passa dal canale pubblico
        r = await c.post("/api/segnalazioni", json={"tipo": "reclamo_commerciante", "motivo": "x" * 20})
        assert r.status_code == 400
        r = await c.post("/api/segnalazioni", json={"tipo": "offerta_non_rispettata", "motivo": "Lo sconto non è stato applicato",
                                                    "discount_id": did, "email": "persona@example.com"})
        assert r.status_code == 200 and r.json()["conferma_entro"]
        sid = r.json()["id"]
        doc = await server.db.segnalazioni.find_one({"id": sid})
        assert doc["merchant_id"] == uid and doc["stato"] == "ricevuta" and "ip" not in doc and doc["expires_at"]
        assert any(x[0] == "admin" for x in _email_finte)
        # l'admin vede la segnalazione e deve motivare l'esito
        elenco = await server.admin_segnalazioni({})
        assert elenco["da_gestire"] == 1
        with pytest.raises(HTTPException) as e:
            await server.admin_esito_segnalazione(sid, server.EsitoSegnalazioneIn(stato="respinta", motivazione=""), {})
        assert e.value.status_code == 422
        await server.admin_esito_segnalazione(sid, server.EsitoSegnalazioneIn(stato="accolta", motivazione="Verificato con il negozio."), {})
        assert (await server.db.segnalazioni.find_one({"id": sid}))["stato"] == "accolta"
        await asyncio.sleep(0.05)  # le email partono in background
        assert any(x[0] == "esito" for x in _email_finte)

    run(body, False)


def test_limite_orario_e_reclamo_commerciante():
    async def body(c):
        _, _, h = await _negozio_con_offerta()
        r = await c.post("/api/merchants/me/reclami", headers=h, json={"tipo": "altro", "motivo": "La mia offerta è stata tolta senza motivo"})
        assert r.status_code == 200
        doc = await server.db.segnalazioni.find_one({"id": r.json()["id"]})
        assert doc["tipo"] == "reclamo_commerciante" and doc["autore_ruolo"] == "merchant"
        for _ in range(5):
            await c.post("/api/segnalazioni", json={"tipo": "altro", "motivo": "Segnalazione di prova numero uno"})
        r = await c.post("/api/segnalazioni", json={"tipo": "altro", "motivo": "Segnalazione di prova numero sei"})
        assert r.status_code == 429

    run(body, False)


def test_admin_elimina_un_cliente():
    async def body(c):
        cid = str(uuid.uuid4())
        await server.db.users.insert_one({"id": cid, "email": "c@example.com", "role": "client", "name": "Cliente Prova"})
        await server.db.redemptions.insert_one({"id": "r1", "user_id": cid, "merchant_id": "m", "code": "ABC", "status": "pending"})
        assert [x["id"] for x in (await server.admin_list_clients({}))["clients"]] == [cid]
        await server.admin_delete_client(cid, {})
        assert await server.db.users.find_one({"id": cid}) is None
        assert await server.db.redemptions.find_one({"user_id": cid}) is None
        with pytest.raises(HTTPException):
            await server.admin_delete_client(cid, {})

    run(body, False)
