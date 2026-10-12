"""La radice dell'API risponde sia a GET sia a HEAD: i controlli online gratuiti (UptimeRobot) usano HEAD
e con 405 segnalerebbero un falso «Down». Database locale (mongomock) come gli altri test."""
from test_interruttore_abbonamento import run


def test_radice_api_get_e_head():
    async def body(c):
        r = await c.get("/api/")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"
        h = await c.head("/api/")
        assert h.status_code == 200

    run(body, False)
