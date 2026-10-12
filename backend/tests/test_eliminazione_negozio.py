"""Eliminazione dell'account di un negozio: con un'offerta in corso vale dal 1° del mese dopo (lo sconto va
rispettato fino a fine mese); senza offerta è immediata. Database locale (mongomock)."""
import uuid
from datetime import datetime, timedelta, timezone

from test_interruttore_abbonamento import run
import server


async def _negozio(con_offerta):
    uid = str(uuid.uuid4())
    await server.db.users.insert_one({"id": uid, "email": f"n{uid[:5]}@example.com", "name": "N", "role": "merchant",
                                      "shop_name": "Negozio"})
    if con_offerta:
        await server.db.discounts.insert_one({"id": f"d{uid[:5]}", "merchant_id": uid, "title": "T",
                                              "approval_status": "approved", "active": True})
    return uid, {"Authorization": f"Bearer {server.create_token(uid, 'x@example.com')}"}


def test_con_offerta_in_corso_l_eliminazione_e_programmata(monkeypatch):
    async def body(c):
        uid, h = await _negozio(True)
        r = await c.delete("/api/gdpr/delete-account", headers=h)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["programmata_per"].endswith("-01") and "sconto va rispettato" in j["message"]
        # il negozio e l'offerta restano
        assert await server.db.users.find_one({"id": uid}) is not None
        assert await server.db.discounts.find_one({"merchant_id": uid}) is not None
        # prima della data non succede nulla
        assert (await server._run_eliminazioni_programmate())["cancellati"] == 0
        # ripensamento: nessuna eliminazione
        await c.post("/api/gdpr/delete-account/annulla", headers=h)
        assert "deletion_effective_on" not in await server.db.users.find_one({"id": uid})
        # nuova richiesta e arrivo del giorno: cancellato davvero, offerta compresa
        await c.delete("/api/gdpr/delete-account", headers=h)
        ieri = (datetime.now(timezone.utc) - timedelta(days=1)).date().isoformat()
        await server.db.users.update_one({"id": uid}, {"$set": {"deletion_effective_on": ieri}})
        assert (await server._run_eliminazioni_programmate())["cancellati"] == 1
        assert await server.db.users.find_one({"id": uid}) is None
        assert await server.db.discounts.find_one({"merchant_id": uid}) is None

    run(body, False)


def test_senza_offerta_l_eliminazione_e_immediata():
    async def body(c):
        uid, h = await _negozio(False)
        r = await c.delete("/api/gdpr/delete-account", headers=h)
        assert r.status_code == 200 and "programmata_per" not in r.json()
        assert await server.db.users.find_one({"id": uid}) is None

    run(body, False)
