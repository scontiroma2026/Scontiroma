"""Zone: Roma, quartieri e dintorni (Ostia, Fiumicino, Castelli Romani) nei menu di
iscrizione, nei filtri degli sconti e nella mappa. Nessun database: /api/zones è fisso."""
import asyncio
import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "test_unit")
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")

import httpx  # noqa: E402

import server  # noqa: E402


def test_zone_di_roma_e_dintorni():
    async def main():
        transport = httpx.ASGITransport(app=server.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
            return await c.get("/api/zones")
    r = asyncio.run(main())
    assert r.status_code == 200
    zone = r.json()["zones"]
    for z in ("Garbatella", "San Paolo", "Marconi", "Ostia", "Fiumicino", "Castelli Romani", "Trastevere"):
        assert z in zone
    assert len(zone) == len(set(zone))
    assert zone[-1].startswith("Altra zona")
