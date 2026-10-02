"""Difesa CSRF (CSRF_ORIGIN_MODE=enforce) con le origini di produzione.

Il server accetta una richiesta che modifica dati (POST/PUT/PATCH/DELETE) se:
  - non ha l'header Origin (chiamate server-to-server, es. webhook Stripe/PayPal), oppure
  - l'Origin è in CORS_ORIGINS (in produzione https://scontiroma.it e https://www.scontiroma.it), oppure
  - l'Origin ha lo stesso host dell'API (https://api.scontiroma.it).
Safari su iPhone, anche dall'icona sulla schermata Home, invia come Origin l'indirizzo del sito
(https://scontiroma.it), senza barra finale, come gli altri browser.

Il test verifica anche che enforce non possa rifiutare un'origine che il browser accetterebbe:
la lista CSRF è la stessa del CORS, quindi ogni origine da cui il sito funziona oggi passa.
Nessun database: si usa /api/auth/logout, che non legge né scrive dati.
"""
import asyncio
import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "test_unit")
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")

import httpx  # noqa: E402
import pytest  # noqa: E402

import server  # noqa: E402

PRODUZIONE = "https://scontiroma.it, https://www.scontiroma.it/"  # spazi e barra finale voluti
API_HOST = "api.scontiroma.it"

ACCETTATE = [
    "https://scontiroma.it",        # sito, Safari/Chrome su iPhone e computer, app dalla schermata Home
    "https://www.scontiroma.it",    # www (oggi reindirizza al sito, accettato comunque)
    "https://api.scontiroma.it",    # stesso host dell'API
]
RIFIUTATE = [
    "https://sito-malevolo.example",
    "http://scontiroma.it",               # senza https
    "https://scontiroma.it.evil.example",  # dominio che "contiene" il nostro
    "https://evil-scontiroma.it",
    "null",                               # Origin opaco: rifiutato anche dal CORS
]


def _post(origin):
    async def go():
        t = httpx.ASGITransport(app=server.app)
        async with httpx.AsyncClient(transport=t, base_url=f"https://{API_HOST}") as c:
            h = {"Origin": origin} if origin else {}
            return (await c.post("/api/auth/logout", headers=h)).status_code
    return asyncio.run(go())


def _preflight_ok(origin):
    async def go():
        t = httpx.ASGITransport(app=server.app)
        async with httpx.AsyncClient(transport=t, base_url=f"https://{API_HOST}") as c:
            r = await c.options("/api/auth/login", headers={
                "Origin": origin, "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type"})
            return r.headers.get("access-control-allow-origin") == origin
    return asyncio.run(go())


@pytest.fixture(autouse=True)
def produzione(monkeypatch):
    origins = [o.strip().rstrip("/") for o in PRODUZIONE.split(",") if o.strip().rstrip("/")]
    monkeypatch.setattr(server, "cors_origins", origins)
    monkeypatch.setattr(server, "CSRF_ORIGIN_MODE", "enforce")
    # Il CORSMiddleware ha la sua copia della lista: la allineiamo per il controllo del preflight.
    for m in server.app.user_middleware:
        if m.cls.__name__ == "CORSMiddleware":
            monkeypatch.setitem(m.kwargs, "allow_origins", origins)
    server.app.middleware_stack = None  # ricostruito alla prossima richiesta con la lista di prova
    yield
    server.app.middleware_stack = None


def test_lista_normalizzata_come_l_header_origin():
    assert server.cors_origins == ["https://scontiroma.it", "https://www.scontiroma.it"]


@pytest.mark.parametrize("origin", ACCETTATE)
def test_origini_legittime_accettate(origin):
    assert _post(origin) != 403


def test_senza_origin_accettata():
    assert _post(None) != 403  # webhook Stripe / PayPal


@pytest.mark.parametrize("origin", RIFIUTATE)
def test_origini_estranee_rifiutate(origin):
    assert _post(origin) == 403


@pytest.mark.parametrize("origin", ["https://scontiroma.it", "https://www.scontiroma.it"] + RIFIUTATE)
def test_enforce_non_rifiuta_nulla_che_il_cors_accetta(origin):
    # Se il browser accetta l'origine (preflight CORS ok), anche il controllo CSRF deve accettarla.
    if _preflight_ok(origin):
        assert _post(origin) != 403
