"""Eliminando un negozio spariscono anche gli sconti usati e le scansioni presso di lui;
quelli già rimasti orfani vengono puliti. Database locale (mongomock)."""
import uuid

from test_interruttore_abbonamento import run
import server


async def _utente(ruolo):
    uid = str(uuid.uuid4())
    await server.db.users.insert_one({"id": uid, "email": f"{uid[:6]}@example.com", "role": ruolo, "name": "X"})
    return uid


async def _uso(cliente, negozio):
    await server.db.redemptions.insert_one({"id": str(uuid.uuid4()), "code": uuid.uuid4().hex[:8], "user_id": cliente,
                                            "merchant_id": negozio, "status": "redeemed"})
    await server.db.qr_scans.insert_one({"id": str(uuid.uuid4()), "merchant_id": negozio, "user_id": cliente})


def test_eliminare_negozio_toglie_usi_e_scansioni():
    async def body(c):
        cliente, negozio, altro = await _utente("client"), await _utente("merchant"), await _utente("merchant")
        await _uso(cliente, negozio)
        await _uso(cliente, altro)
        m = await server.db.users.find_one({"id": negozio})
        await server._erase_user_data(m)
        assert await server.db.redemptions.count_documents({"merchant_id": negozio}) == 0
        assert await server.db.qr_scans.count_documents({"merchant_id": negozio}) == 0
        # gli usi presso un altro negozio restano
        assert await server.db.redemptions.count_documents({"merchant_id": altro}) == 1
    run(body, False)


def test_pulizia_orfani_toglie_solo_quelli_senza_negozio():
    async def body(c):
        cliente, negozio = await _utente("client"), await _utente("merchant")
        fantasma = str(uuid.uuid4())  # negozio già eliminato
        await _uso(cliente, negozio)
        await _uso(cliente, fantasma)
        esito = await server._pulisci_dati_orfani()
        assert esito["redemptions"] >= 1 and esito["qr_scans"] >= 1
        assert await server.db.redemptions.count_documents({"merchant_id": fantasma}) == 0
        assert await server.db.qr_scans.count_documents({"merchant_id": fantasma}) == 0
        assert await server.db.redemptions.count_documents({"merchant_id": negozio}) == 1
        # seconda esecuzione: niente da fare
        assert (await server._pulisci_dati_orfani()) == {"redemptions": 0, "qr_scans": 0}
    run(body, False)
