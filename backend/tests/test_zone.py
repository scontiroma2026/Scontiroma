"""Zone: solo le tre zone pilota (Garbatella, San Paolo, Marconi) nei menu di
iscrizione, nei filtri degli sconti e nella mappa. Nessun database: /api/zones è fisso."""
import asyncio
import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "test_unit")
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")

import httpx  # noqa: E402

import server  # noqa: E402


def test_solo_zone_pilota():
    async def main():
        transport = httpx.ASGITransport(app=server.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
            return await c.get("/api/zones")
    r = asyncio.run(main())
    assert r.status_code == 200
    assert r.json() == {"zones": ["Garbatella", "San Paolo", "Marconi"]}
