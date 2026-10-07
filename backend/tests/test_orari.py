"""Orari del negozio scritti dal commerciante: «Aperto ora» / «Chiuso · apre…» all'ora di Roma,
fasce dopo mezzanotte, chiusura straordinaria, controlli sui dati inseriti.
Server in-process su database locale o emulatore: rifiuta database remoti."""
import asyncio
import os
import uuid
from datetime import datetime
from urllib.parse import urlparse
from zoneinfo import ZoneInfo

import pytest

MONGO_URL = os.environ.setdefault("TEST_MONGO_URL", os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
_u = urlparse(MONGO_URL)
if not (_u.scheme == "mongomock" or (_u.scheme == "mongodb" and (_u.hostname or "") in ("localhost", "127.0.0.1", "::1"))):
    pytest.exit(f"MONGO_URL non locale ({_u.scheme}://{_u.hostname}): test rifiutati.", returncode=2)
USE_MOCK = _u.scheme == "mongomock"
DB_NAME = "e2e_unit_orari"
os.environ["MONGO_URL"] = "mongodb://localhost:27017" if USE_MOCK else MONGO_URL
os.environ.setdefault("DB_NAME", DB_NAME)
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")
os.environ["RESEND_API_KEY"] = ""

import httpx  # noqa: E402

import server  # noqa: E402

ROMA = ZoneInfo("Europe/Rome")
FERIALE = {"chiuso": False, "fasce": [{"apre": "12:30", "chiude": "15:00"}, {"apre": "19:30", "chiude": "23:00"}]}
SABATO = {"chiuso": False, "fasce": [{"apre": "19:30", "chiude": "01:00"}]}  # dopo mezzanotte
DOMENICA = {"chiuso": True, "fasce": []}
ORARI = {"giorni": [FERIALE] * 5 + [SABATO, DOMENICA], "chiusura_straordinaria": False, "nota_chiusura": ""}


def ore(giorno, hh, mm=0):  # 5/10/2026 è lunedì
    return datetime(2026, 10, 5 + giorno, hh, mm, tzinfo=ROMA)


@pytest.mark.parametrize("quando,atteso", [
    (ore(0, 13), "Aperto ora · chiude alle 15:00"),
    (ore(0, 16), "Chiuso · apre oggi alle 19:30"),
    (ore(0, 23, 30), "Chiuso · apre domani alle 12:30"),
    (ore(5, 23, 59), "Aperto ora · chiude alle 01:00"),
    (ore(6, 0, 30), "Aperto ora · chiude alle 01:00"),   # domenica notte: è ancora il sabato sera
    (ore(6, 12), "Chiuso · apre domani alle 12:30"),
    (ore(5, 2), "Chiuso · apre oggi alle 19:30"),
    (ore(4, 23, 30), "Chiuso · apre domani alle 19:30"),
])
def test_stato_orari(quando, atteso):
    assert server.stato_orari(ORARI, quando)["testo"] == atteso


def test_chiusura_straordinaria_e_orari_assenti():
    assert server.stato_orari(None, ore(0, 13)) is None
    st = server.stato_orari({**ORARI, "chiusura_straordinaria": True, "nota_chiusura": "Ferie"}, ore(0, 13))
    assert st == {"aperto": False, "testo": "Chiuso temporaneamente", "nota": "Ferie"}


def run(body):
    async def main():
        if USE_MOCK:
            import mongomock_motor
            server.db = mongomock_motor.AsyncMongoMockClient()[DB_NAME]
        else:
            from motor.motor_asyncio import AsyncIOMotorClient
            cli = AsyncIOMotorClient(MONGO_URL)
            await cli.drop_database(DB_NAME)
            server.db = cli[DB_NAME]
        transport = httpx.ASGITransport(app=server.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
            await body(c)
    asyncio.run(main())


async def utente(role):
    uid = str(uuid.uuid4())
    email = f"{role}.{uid[:8]}@example.com"
    await server.db.users.insert_one({"id": uid, "email": email, "role": role, "shop_name": "Negozio"})
    return uid, {"Authorization": f"Bearer {server.create_token(uid, email)}"}


def test_salvataggio_e_visibilita_sull_offerta():
    async def body(c):
        mid, h = await utente("merchant")
        r = await c.put("/api/merchants/me/hours", json=ORARI, headers=h)
        assert r.status_code == 200, r.text
        assert r.json()["orari"]["aggiornati_il"]
        did = str(uuid.uuid4())
        await server.db.discounts.insert_one({"id": did, "merchant_id": mid, "title": "Prova", "active": True,
                                              "approval_status": "approved", "original_price": 10, "discounted_price": 5})
        m = (await c.get(f"/api/discounts/{did}")).json()["discount"]["merchant"]
        assert m["orari"]["giorni"][6]["chiuso"] is True
        assert m["stato_orari"]["testo"].startswith(("Aperto", "Chiuso"))
    run(body)


@pytest.mark.parametrize("giorni,errore", [
    ([FERIALE] * 6, "tutti e 7"),
    ([{"chiuso": False, "fasce": []}] + [DOMENICA] * 6, "Lunedì"),
    ([{"chiuso": False, "fasce": [{"apre": "25:00", "chiude": "26:00"}]}] + [DOMENICA] * 6, "orario non valido"),
    ([{"chiuso": False, "fasce": [{"apre": "10:00", "chiude": "10:00"}]}] + [DOMENICA] * 6, "orario non valido"),
])
def test_orari_sbagliati_rifiutati(giorni, errore):
    async def body(c):
        _, h = await utente("merchant")
        r = await c.put("/api/merchants/me/hours", json={"giorni": giorni}, headers=h)
        assert r.status_code == 422 and errore in r.text
    run(body)


def test_solo_il_commerciante():
    async def body(c):
        _, h = await utente("client")
        assert (await c.put("/api/merchants/me/hours", json=ORARI, headers=h)).status_code == 403
    run(body)


def test_riapertura_dopo_piu_giorni():
    solo_lunedi = {"giorni": [FERIALE] + [DOMENICA] * 6}
    assert server.stato_orari(solo_lunedi, ore(2, 10))["testo"] == "Chiuso · apre lunedì alle 12:30"
