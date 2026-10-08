"""Zone: 16 aree di Roma e dintorni (senza i singoli quartieri) nei menu di iscrizione,
nei filtri degli sconti e nella mappa. /api/zones è fisso; il filtro riconosce anche i
commercianti già registrati con un quartiere (es. Garbatella) dentro la loro area."""
import asyncio
import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "test_unit")
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")

import httpx  # noqa: E402

import server  # noqa: E402


def test_sedici_aree():
    async def main():
        transport = httpx.ASGITransport(app=server.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
            return await c.get("/api/zones")
    r = asyncio.run(main())
    assert r.status_code == 200
    dati = r.json()
    assert len(dati["zones"]) == 16 and len(set(dati["zones"])) == 16
    assert len(dati["areas"]) == 16
    assert [a["value"] for a in dati["areas"]] == dati["zones"]
    assert dati["areas"][0]["label"].startswith("Centro storico")
    assert "Fuori Roma" in dati["zones"] and "Garbatella" in dati["zones"]
    assert not any("Municipio" in a["label"] for a in dati["areas"])


def test_filtro_riconosce_i_quartieri():
    assert server._zona_corrisponde("Garbatella", "Garbatella")
    assert server._zona_corrisponde("San Paolo", "Garbatella")      # stessa area
    assert server._zona_corrisponde("Boccea", "Aurelio")
    assert not server._zona_corrisponde("Boccea", "Garbatella")
    assert not server._zona_corrisponde(None, "Aurelio")
