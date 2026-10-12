"""Il registro del consenso cookie si cancella dopo 24 mesi (come dichiarato nella Cookie Policy).
Database locale (mongomock)."""
from datetime import datetime, timedelta, timezone

from test_interruttore_abbonamento import run


def test_nuove_righe_hanno_scadenza_e_vecchie_si_cancellano():
    import server

    async def body(c):
        r = await c.post("/api/gdpr/consent-log", json={"action": "reject_all", "prefs": {"essential": True}})
        assert r.status_code == 200
        nuova = await server.db.consent_logs.find_one({"id": r.json()["id"]})
        scade = nuova["expires_at"]
        if scade.tzinfo is None:
            scade = scade.replace(tzinfo=timezone.utc)
        assert timedelta(days=729) < scade - datetime.now(timezone.utc) <= timedelta(days=730)
        vecchia = (datetime.now(timezone.utc) - timedelta(days=800)).isoformat()
        await server.db.consent_logs.insert_one({"id": "vecchia", "timestamp": vecchia})
        assert await server._pulisci_registro_consenso() == 1
        assert await server.db.consent_logs.find_one({"id": "vecchia"}) is None
        assert await server.db.consent_logs.find_one({"id": nuova["id"]}) is not None

    run(body, False)
