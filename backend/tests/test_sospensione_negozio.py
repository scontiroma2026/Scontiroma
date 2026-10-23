"""Sospensione del negozio con motivo (Termini art. 2): motivo obbligatorio, email al commerciante con motivo e
come contestare, storico, riattivazione con email, solo admin, scadenza dei 10 giorni lavorativi per il riesame.
Server in-process su database locale o emulatore: rifiuta database remoti."""
import asyncio
import os
import uuid
from datetime import date
from urllib.parse import urlparse

import pytest

MONGO_URL = os.environ.setdefault("TEST_MONGO_URL", os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
_u = urlparse(MONGO_URL)
if not (_u.scheme == "mongomock" or (_u.scheme == "mongodb" and (_u.hostname or "") in ("localhost", "127.0.0.1", "::1"))):
    pytest.exit(f"MONGO_URL non locale ({_u.scheme}://{_u.hostname}): test rifiutati.", returncode=2)
USE_MOCK = _u.scheme == "mongomock"
DB_NAME = "e2e_unit_sospensione"
os.environ["MONGO_URL"] = "mongodb://localhost:27017" if USE_MOCK else MONGO_URL
os.environ.setdefault("DB_NAME", DB_NAME)
os.environ.setdefault("JWT_SECRET", "test-unit-secret-0123456789abcdef")
os.environ["RESEND_API_KEY"] = ""

import httpx  # noqa: E402

import email_service  # noqa: E402
import server  # noqa: E402

MOTIVO = "Lo sconto pubblicato non viene applicato in negozio."


@pytest.fixture
def email_inviate(monkeypatch):
    inviate = []

    async def sospeso(to, name, shop_name, reason, date_label):
        inviate.append(("sospeso", to, shop_name, reason, date_label))

    async def riattivato(to, name, shop_name):
        inviate.append(("riattivato", to, shop_name))
    monkeypatch.setattr(server, "send_merchant_suspended", sospeso)
    monkeypatch.setattr(server, "send_merchant_reactivated", riattivato)
    monkeypatch.delenv("ADMIN_NOTIFY_EMAIL", raising=False)
    monkeypatch.delenv("MERCHANT_PAYMENT_REQUIRED", raising=False)
    return inviate


def run(body, admin=True, merchant=None):
    async def main():
        if USE_MOCK:
            import mongomock_motor
            server.db = mongomock_motor.AsyncMongoMockClient()[DB_NAME]
        else:
            from motor.motor_asyncio import AsyncIOMotorClient
            cli = AsyncIOMotorClient(MONGO_URL)
            await cli.drop_database(DB_NAME)
            server.db = cli[DB_NAME]

        async def no_admin():
            return {"id": "admin", "role": "admin"}
        if admin:
            server.app.dependency_overrides[server.require_admin_master] = no_admin
        try:
            transport = httpx.ASGITransport(app=server.app)
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
                await body(c)
                await server.attendi_lavori_in_background()
        finally:
            server.app.dependency_overrides.pop(server.require_admin_master, None)
            server.app.dependency_overrides.pop(server.require_merchant, None)
    asyncio.run(main())


async def negozio(approved=True):
    mid = str(uuid.uuid4())
    doc = {"id": mid, "email": f"m.{mid[:8]}@example.com", "role": "merchant", "name": "Titolare", "shop_name": "Bar Prova"}
    if approved is False:
        doc["approved"] = False
    await server.db.users.insert_one(doc)
    return mid


@pytest.mark.parametrize("corpo", [{"approved": False}, {"approved": False, "motivo_sospensione": ""},
                                   {"approved": False, "motivo_sospensione": "   corto   "}])
def test_sospendere_senza_motivo_rifiutato(email_inviate, corpo):
    async def body(c):
        mid = await negozio()
        r = await c.put(f"/api/admin/merchants/{mid}", json=corpo)
        assert r.status_code == 422
        assert "motivo della sospensione" in r.json()["detail"]
        m = await server.db.users.find_one({"id": mid})
        assert m.get("approved") is not False and "sospensione" not in m
        assert await server.db.sospensioni.count_documents({}) == 0
    run(body)
    assert email_inviate == []


def test_sospensione_salva_motivo_storico_e_manda_email(email_inviate):
    async def body(c):
        mid = await negozio()
        r = await c.put(f"/api/admin/merchants/{mid}", json={"approved": False, "motivo_sospensione": f"  {MOTIVO}  "})
        assert r.status_code == 200
        m = await server.db.users.find_one({"id": mid})
        assert m["approved"] is False
        assert m["sospensione"]["motivo"] == MOTIVO and m["sospensione"]["data"]
        assert "motivo_sospensione" not in m
        st = (await c.get(f"/api/admin/merchants/{mid}/sospensioni")).json()["storico"]
        assert [(s["azione"], s["motivo"]) for s in st] == [("sospeso", MOTIVO)]
        # L'offerta sparisce subito (regola esistente)
        assert mid in await server._merchant_sospesi()
        # Una seconda richiesta di sospensione non manda un'altra email
        r2 = await c.put(f"/api/admin/merchants/{mid}", json={"approved": False, "motivo_sospensione": MOTIVO})
        assert r2.status_code == 200
    run(body)
    assert len(email_inviate) == 1
    tipo, to, negozio_, motivo, data = email_inviate[0]
    assert tipo == "sospeso" and to.endswith("@example.com") and negozio_ == "Bar Prova" and motivo == MOTIVO and data


def test_riattivazione_toglie_sospensione_e_manda_email(email_inviate):
    async def body(c):
        mid = await negozio()
        await c.put(f"/api/admin/merchants/{mid}", json={"approved": False, "motivo_sospensione": MOTIVO})
        r = await c.put(f"/api/admin/merchants/{mid}", json={"approved": True})
        assert r.status_code == 200
        m = await server.db.users.find_one({"id": mid})
        assert m["approved"] is True and "sospensione" not in m
        st = (await c.get(f"/api/admin/merchants/{mid}/sospensioni")).json()["storico"]
        assert sorted(s["azione"] for s in st) == ["riattivato", "sospeso"]
        # Riattivare un negozio già attivo non manda email
        await c.put(f"/api/admin/merchants/{mid}", json={"approved": True})
    run(body)
    assert [e[0] for e in email_inviate] == ["sospeso", "riattivato"]


def test_altre_modifiche_non_chiedono_motivo(email_inviate):
    async def body(c):
        mid = await negozio()
        r = await c.put(f"/api/admin/merchants/{mid}", json={"shop_name": "Bar Nuovo"})
        assert r.status_code == 200
    run(body)
    assert email_inviate == []


@pytest.mark.parametrize("metodo,url,corpo", [
    ("PUT", "/api/admin/merchants/{}", {"approved": False, "motivo_sospensione": MOTIVO}),
    ("GET", "/api/admin/merchants/{}/sospensioni", None),
    ("POST", "/api/admin/merchants/{}/contestazione", {"nota": "Contesta la sospensione per email."}),
])
def test_solo_admin(email_inviate, metodo, url, corpo):
    async def body(c):
        mid = await negozio()
        r = await c.request(metodo, url.format(mid), json=corpo)
        assert r.status_code in (401, 403)
        assert (await server.db.users.find_one({"id": mid})).get("approved") is not False
    run(body, admin=False)
    assert email_inviate == []


def test_email_sospensione_ha_motivo_e_come_contestare(monkeypatch):
    catturate = []

    async def finto_send(to, subject, html, tipo=""):
        catturate.append((subject, html))
    monkeypatch.setattr(email_service, "_send", finto_send)
    asyncio.run(email_service.send_merchant_suspended("m@example.com", "Mario", "Bar <Prova>", "Motivo <b>scritto</b>", "23 ottobre 2026"))
    asyncio.run(email_service.send_merchant_reactivated("m@example.com", "Mario", "Bar Prova"))
    (sogg, html), (sogg2, html2) = catturate
    assert "Il tuo account è stato sospeso" in sogg and "Il tuo account è stato sospeso" in html
    assert "Motivo &lt;b&gt;scritto&lt;/b&gt;" in html and "Bar &lt;Prova&gt;" in html  # testo dell'admin escapato
    assert "info@scontiroma.it" in html and "10 giorni lavorativi" in html
    assert "Account riattivato" in sogg2 and "Account riattivato" in html2


def test_giorni_lavorativi():
    # Venerdì 23/10/2026 + 10 lavorativi: salta due fine settimana e il 1° novembre (domenica) -> 6/11
    assert server._aggiungi_giorni_lavorativi(date(2026, 10, 23), 10) == date(2026, 11, 6)
    # Pasquetta 2027 è il 29/3; 25/4 cade di domenica
    assert server._festivo_roma(date(2027, 3, 29))
    assert server._festivo_roma(date(2026, 12, 8)) and server._festivo_roma(date(2026, 6, 29))
    assert not server._festivo_roma(date(2026, 10, 22))
    # Dal 21/12/2026 (lun): 22,23,24,28,29,30,31/12, 4,5,7/1 (25, 26/12, 1/1, 6/1 festivi) -> 7/1/2027
    assert server._aggiungi_giorni_lavorativi(date(2026, 12, 21), 10) == date(2027, 1, 7)


def test_reclamo_del_negozio_sospeso_ha_scadenza_e_va_nel_riepilogo(email_inviate):
    async def body(c):
        mid = await negozio(approved=False)
        attivo = await negozio()

        def come(uid):
            async def m():
                return {"id": uid, "role": "merchant", "email": "x@example.com", "shop_name": "Bar Prova"}
            return m
        server.app.dependency_overrides[server.require_merchant] = come(mid)
        r = await c.post("/api/merchants/me/reclami", json={"tipo": "reclamo_commerciante", "motivo": "Non sono d'accordo con la sospensione."})
        assert r.status_code == 200
        s = await server.db.segnalazioni.find_one({"id": r.json()["id"]})
        assert s["sospensione"] is True
        atteso = server._aggiungi_giorni_lavorativi(server._rome_now().date(), 10).isoformat()
        assert s["riesame_entro"] == atteso
        # Il reclamo di un negozio attivo non è una contestazione di sospensione
        server.app.dependency_overrides[server.require_merchant] = come(attivo)
        r = await c.post("/api/merchants/me/reclami", json={"tipo": "reclamo_commerciante", "motivo": "Reclamo su altro argomento."})
        assert "sospensione" not in await server.db.segnalazioni.find_one({"id": r.json()["id"]})

        rp = (await c.get("/api/admin/riepilogo-settimanale")).json()
        assert rp["situazione"]["reclami_sospensione_aperti"] == 1
        assert rp["situazione"]["riesame_sospensione_entro"] == atteso
        assert "reclami su sospensioni da riesaminare" in rp["da_guardare"][0]
        assert "10 giorni lavorativi" in rp["da_guardare"][0]

        # Chiuso con un esito: non compare più
        await c.post(f"/api/admin/segnalazioni/{s['id']}/esito", json={"stato": "respinta", "motivazione": "Sospensione confermata dopo il riesame."})
        rp = (await c.get("/api/admin/riepilogo-settimanale")).json()
        assert rp["situazione"]["reclami_sospensione_aperti"] == 0
    run(body)


def test_contestazione_ricevuta_per_email_registrata_dall_admin(email_inviate):
    async def body(c):
        attivo = await negozio()
        r = await c.post(f"/api/admin/merchants/{attivo}/contestazione", json={"nota": "Contesta la sospensione per email."})
        assert r.status_code == 409
        mid = await negozio(approved=False)
        r = await c.post(f"/api/admin/merchants/{mid}/contestazione", json={"nota": "corta"})
        assert r.status_code == 422
        r = await c.post(f"/api/admin/merchants/{mid}/contestazione", json={"nota": "Contesta la sospensione per email."})
        assert r.status_code == 200
        s = await server.db.segnalazioni.find_one({"id": r.json()["id"]})
        assert s["tipo"] == "reclamo_commerciante" and s["sospensione"] is True and s["canale"] == "email"
        assert s["riesame_entro"] == r.json()["riesame_entro"]
        elenco = (await c.get("/api/admin/segnalazioni")).json()["segnalazioni"]
        assert any(x["id"] == s["id"] and x["riesame_entro"] for x in elenco)
    run(body)
