"""Pulizia automatica dei dati oltre la durata dichiarata. Database locale (mongomock)."""
from datetime import datetime, timedelta, timezone

from test_interruttore_abbonamento import run
import server


def _giorni_fa(n):
    return (datetime.now(timezone.utc) - timedelta(days=n)).isoformat()


def test_cancella_solo_il_vecchio():
    async def body(c):
        db = server.db
        await db.qr_scans.insert_many([{"id": "vecchia", "timestamp": _giorni_fa(400)}, {"id": "recente", "timestamp": _giorni_fa(10)}])
        await db.analytics_events.insert_many([{"id": "v", "created_at": _giorni_fa(500)}, {"id": "r", "created_at": _giorni_fa(100)}])
        await db.redemptions.insert_many([{"id": "rv", "created_at": _giorni_fa(800), "status": "redeemed"},
                                          {"id": "rr", "created_at": _giorni_fa(30), "status": "pending"}])
        esito = await server._pulizia_conservazione()
        assert esito == {"qr_scans": 1, "analytics_events": 1, "redemptions": 1}
        assert [x["id"] async for x in db.qr_scans.find()] == ["recente"]
        assert [x["id"] async for x in db.analytics_events.find()] == ["r"]
        assert [x["id"] async for x in db.redemptions.find()] == ["rr"]
        assert await server._pulizia_conservazione() == {"qr_scans": 0, "analytics_events": 0, "redemptions": 0}

    run(body, False)
