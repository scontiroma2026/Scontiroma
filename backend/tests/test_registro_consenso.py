"""Il registro delle scelte del banner cookie si cancella dopo 24 mesi, come dice la Cookie Policy
(correzione della PR #95, rifatta il 18/11). Le righe dei consensi alle notifiche (azioni push_*)
non si toccano: restano finché c'è l'account. Solo database locale (mongomock o MongoDB del runner)."""
from datetime import datetime, timedelta, timezone

from test_interruttore_abbonamento import run


def _utc(d):
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)


def test_nuove_righe_hanno_scadenza_a_24_mesi():
    import server

    async def body(c):
        r = await c.post("/api/gdpr/consent-log", json={"action": "accept_all",
                                                        "prefs": {"essential": True, "functional": True, "marketing": False}})
        assert r.status_code == 200
        riga = await server.db.consent_logs.find_one({"id": r.json()["id"]})
        mancano = _utc(riga["expires_at"]) - datetime.now(timezone.utc)
        assert timedelta(days=729) < mancano <= timedelta(days=730)

    run(body, False)


def test_pulizia_toglie_solo_le_righe_vecchie_del_banner():
    import server

    async def body(c):
        vecchia = (datetime.now(timezone.utc) - timedelta(days=800)).isoformat()
        recente = (datetime.now(timezone.utc) - timedelta(days=100)).isoformat()
        await server.db.consent_logs.insert_many([
            {"id": "banner-vecchia", "action": "reject_all", "timestamp": vecchia},
            {"id": "banner-recente", "action": "custom", "timestamp": recente},
            {"id": "push-vecchia", "action": "push_offerte_si", "user_id": "u1", "timestamp": vecchia},
        ])
        assert await server._pulisci_registro_consenso() == 1
        assert await server.db.consent_logs.find_one({"id": "banner-vecchia"}) is None
        assert await server.db.consent_logs.find_one({"id": "banner-recente"}) is not None
        assert await server.db.consent_logs.find_one({"id": "push-vecchia"}) is not None
        assert await server._pulisci_registro_consenso() == 0  # seconda volta: niente da fare

    run(body, False)
