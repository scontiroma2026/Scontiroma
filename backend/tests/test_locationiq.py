"""Geocodifica: LocationIQ se c'è LOCATIONIQ_API_KEY, altrimenti Nominatim (comportamento di prima).
Nessuna rete e nessun database: httpx è sostituito da un finto client; la chiave è finta."""
import asyncio
import os
import time

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "test_unit")
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")

import pytest  # noqa: E402

import server  # noqa: E402

CHIAVE_FINTA = "chiave-finta-solo-per-test"


class FintaRisposta:
    def __init__(self, status=200, dati=None):
        self.status_code = status
        self._dati = dati if dati is not None else []

    def json(self):
        return self._dati


class FintoClient:
    """Sostituisce httpx.AsyncClient: registra le chiamate e risponde in base all'host."""
    chiamate: list = []
    risposte: dict = {}  # "locationiq" / "nominatim" -> FintaRisposta o Exception

    def __init__(self, *a, **k):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, *a):
        return False

    async def get(self, url, params=None, headers=None):
        host = "locationiq" if "locationiq" in url else "nominatim"
        FintoClient.chiamate.append((host, url, dict(params or {})))
        r = FintoClient.risposte.get(host, FintaRisposta())
        if isinstance(r, Exception):
            raise r
        return r


@pytest.fixture(autouse=True)
def ambiente(monkeypatch):
    FintoClient.chiamate = []
    FintoClient.risposte = {}
    monkeypatch.setattr(server.httpx, "AsyncClient", FintoClient)
    monkeypatch.delenv("LOCATIONIQ_API_KEY", raising=False)
    server._geocode_cache.clear()
    server._geocode_suggest_cache.clear()
    server._locationiq_stop_fino = 0.0
    server._locationiq_last = 0.0
    server._nominatim_last = 0.0

    async def senza_attesa(_s):
        return None
    monkeypatch.setattr(server.asyncio, "sleep", senza_attesa)
    yield


def hosts():
    return [c[0] for c in FintoClient.chiamate]


def test_senza_chiave_si_usa_solo_nominatim(monkeypatch):
    FintoClient.risposte["nominatim"] = FintaRisposta(200, [{"lat": "41.86", "lon": "12.48"}])
    ris = asyncio.run(server.geocode_address("Via Ostiense 100, Roma"))
    assert ris == {"lat": 41.86, "lng": 12.48}
    assert hosts() == ["nominatim"]


def test_con_chiave_si_usa_locationiq_e_la_chiave_va_nei_parametri(monkeypatch):
    monkeypatch.setenv("LOCATIONIQ_API_KEY", CHIAVE_FINTA)
    FintoClient.risposte["locationiq"] = FintaRisposta(200, [{"lat": "41.9", "lon": "12.5"}])
    ris = asyncio.run(server.geocode_address("Via del Corso 1, Roma"))
    assert ris == {"lat": 41.9, "lng": 12.5}
    assert hosts() == ["locationiq"]
    _, url, params = FintoClient.chiamate[0]
    assert url.startswith("https://eu1.locationiq.com/v1/search")
    assert params["key"] == CHIAVE_FINTA and params["countrycodes"] == "it"


def test_cache_niente_seconda_chiamata(monkeypatch):
    monkeypatch.setenv("LOCATIONIQ_API_KEY", CHIAVE_FINTA)
    FintoClient.risposte["locationiq"] = FintaRisposta(200, [{"lat": "41.9", "lon": "12.5"}])
    asyncio.run(server.geocode_address("Via del Corso 1, Roma"))
    asyncio.run(server.geocode_address("  VIA DEL CORSO 1, ROMA "))
    assert hosts() == ["locationiq"]


def test_nessun_risultato_404_non_ripiega_e_viene_ricordato(monkeypatch):
    monkeypatch.setenv("LOCATIONIQ_API_KEY", CHIAVE_FINTA)
    FintoClient.risposte["locationiq"] = FintaRisposta(404, {"error": "Unable to geocode"})
    assert asyncio.run(server.geocode_address("Via Inesistente 999")) is None
    assert asyncio.run(server.geocode_address("Via Inesistente 999")) is None
    assert hosts() == ["locationiq"]


def test_chiave_rifiutata_ripiega_su_nominatim_e_sospende_locationiq(monkeypatch):
    monkeypatch.setenv("LOCATIONIQ_API_KEY", CHIAVE_FINTA)
    FintoClient.risposte["locationiq"] = FintaRisposta(401, {"error": "Invalid key"})
    FintoClient.risposte["nominatim"] = FintaRisposta(200, [{"lat": "41.8", "lon": "12.4"}])
    assert asyncio.run(server.geocode_address("Via Appia 10, Roma")) == {"lat": 41.8, "lng": 12.4}
    assert asyncio.run(server.geocode_address("Via Latina 10, Roma")) == {"lat": 41.8, "lng": 12.4}
    assert hosts() == ["locationiq", "nominatim", "nominatim"]  # la seconda volta LocationIQ è saltata


def test_limite_429_ripiega_su_nominatim(monkeypatch):
    monkeypatch.setenv("LOCATIONIQ_API_KEY", CHIAVE_FINTA)
    FintoClient.risposte["locationiq"] = FintaRisposta(429, {"error": "Rate Limited"})
    FintoClient.risposte["nominatim"] = FintaRisposta(200, [{"lat": "41.8", "lon": "12.4"}])
    assert asyncio.run(server.geocode_address("Via Appia 10, Roma")) == {"lat": 41.8, "lng": 12.4}
    assert server._locationiq_stop_fino > time.monotonic()


def test_errore_di_rete_non_fa_trapelare_la_chiave_nei_log(monkeypatch, caplog):
    monkeypatch.setenv("LOCATIONIQ_API_KEY", CHIAVE_FINTA)
    FintoClient.risposte["locationiq"] = RuntimeError(f"boom https://x/?key={CHIAVE_FINTA}")
    FintoClient.risposte["nominatim"] = FintaRisposta(200, [])
    with caplog.at_level("WARNING"):
        asyncio.run(server.geocode_address("Via Appia 10, Roma"))
    assert CHIAVE_FINTA not in caplog.text


def test_suggerimenti_locationiq_stesso_formato(monkeypatch):
    monkeypatch.setenv("LOCATIONIQ_API_KEY", CHIAVE_FINTA)
    FintoClient.risposte["locationiq"] = FintaRisposta(200, [
        {"lat": "41.1", "lon": "12.1", "display_name": "Via Roma, Roma",
         "address": {"road": "Via Roma", "postcode": "00100", "city": "Roma"}},
        {"lat": "41.2", "lon": "12.2", "display_name": "Via Roma 5, Roma",
         "address": {"road": "Via Roma", "house_number": "5", "postcode": "00100", "city": "Roma"}},
    ])
    out = asyncio.run(server.geocode_suggest("via roma 5"))
    assert hosts() == ["locationiq"]
    assert FintoClient.chiamate[0][1].endswith("/v1/autocomplete")
    assert out[0]["house_number"] == "5" and out[0]["has_house_number"] is True  # col civico prima
    assert out[0]["display"] == "Via Roma 5, 00100 Roma"
    # seconda richiesta uguale: dalla cache
    asyncio.run(server.geocode_suggest("via roma 5"))
    assert hosts() == ["locationiq"]


def test_suggerimenti_senza_chiave_usano_nominatim():
    FintoClient.risposte["nominatim"] = FintaRisposta(200, [])
    assert asyncio.run(server.geocode_suggest("via roma")) == []
    assert hosts() == ["nominatim"]


def test_throttling_una_richiesta_ogni_0_6_secondi(monkeypatch):
    """Dieci richieste di fila a LocationIQ non superano mai ~1,7 richieste al secondo."""
    monkeypatch.setenv("LOCATIONIQ_API_KEY", CHIAVE_FINTA)
    orologio = {"t": 1000.0}
    attese = []

    async def sleep_finto(s):
        attese.append(s)
        orologio["t"] += s

    monkeypatch.setattr(server.asyncio, "sleep", sleep_finto)
    monkeypatch.setattr(server.time, "monotonic", lambda: orologio["t"])
    server._locationiq_last = 0.0
    FintoClient.risposte["locationiq"] = FintaRisposta(200, [{"lat": "41.9", "lon": "12.5"}])

    async def main():
        for i in range(10):
            await server.geocode_address(f"Via Prova {i}, Roma")
    asyncio.run(main())
    assert hosts().count("locationiq") == 10
    assert len(attese) == 9 and all(abs(a - server._LOCATIONIQ_INTERVALLO) < 1e-6 for a in attese)
    assert server._LOCATIONIQ_INTERVALLO >= 0.5  # sotto il limite di 2 richieste al secondo


def test_suggerimenti_rinunciano_se_la_coda_e_lunga(monkeypatch):
    monkeypatch.setenv("LOCATIONIQ_API_KEY", CHIAVE_FINTA)
    server._locationiq_last = time.monotonic() + 30  # coda piena: turno dopo oltre 2 secondi
    FintoClient.risposte["nominatim"] = FintaRisposta(200, [])
    # LocationIQ rinuncia (None) e si ripiega su Nominatim, che qui è libero
    assert asyncio.run(server.geocode_suggest("via roma")) == []
    assert hosts() == ["nominatim"]
