"""Notifiche push per commercianti e clienti (interruttore PUSH_UTENTI_ENABLED, predefinito spento).
pywebpush è sostituito da una funzione finta: nessuna chiamata di rete. Database locale (mongomock)."""
import json
import uuid
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import pytest

from test_interruttore_abbonamento import nuovo_utente, run, server

ROMA = ZoneInfo("Europe/Rome")
ENDPOINT = "https://push.example.com/utente/"
MASTER = "master-test-123456"


@pytest.fixture
def push(monkeypatch):
    """webpush finto: registra ogni invio; un endpoint che finisce con «-scaduto» risponde 410."""
    inviate = []

    class Risposta:
        def __init__(self, status_code):
            self.status_code = status_code
            self.text = ""

    def finto_webpush(subscription_info, data, vapid_private_key, vapid_claims, **kwargs):
        if subscription_info["endpoint"].endswith("-scaduto"):
            raise server.WebPushException("Gone", response=Risposta(410))
        inviate.append({"endpoint": subscription_info["endpoint"], "dati": json.loads(data)})
        return Risposta(201)

    monkeypatch.setattr(server, "webpush", finto_webpush)
    monkeypatch.setenv("ADMIN_MASTER_PASSWORD", MASTER)
    monkeypatch.delenv("VAPID_PUBLIC_KEY", raising=False)
    monkeypatch.delenv("VAPID_PRIVATE_KEY", raising=False)
    monkeypatch.setenv("PUSH_UTENTI_ENABLED", "true")
    return inviate


def orologio(monkeypatch, *args):
    """Fissa l'ora di Roma usata dal server."""
    monkeypatch.setattr(server, "_rome_now", lambda: datetime(*args, tzinfo=ROMA))


def iscrizione(fine):
    return {"endpoint": ENDPOINT + fine, "keys": {"p256dh": "B" + "x" * 86, "auth": "a" * 22}}


async def iscrivi(c, h, fine):
    r = await c.post("/api/push/iscrizione", json=iscrizione(fine), headers=h)
    assert r.status_code == 200, r.text


async def attendi():
    await server.attendi_lavori_in_background()  # aspetta la fine delle notifiche in background


async def negozio_con_offerta(zona="Garbatella", titolo="Menù del giorno", stato="approved"):
    mid, hm = await nuovo_utente("merchant")
    await server.db.users.update_one({"id": mid}, {"$set": {"zone": zona, "shop_name": "Osteria di prova"}})
    did = str(uuid.uuid4())
    await server.db.discounts.insert_one({
        "id": did, "merchant_id": mid, "title": titolo, "active": True, "approval_status": stato,
        "locked_month": server.current_month_key() if stato == "approved" else None,
        "created_at": datetime.now(timezone.utc).isoformat()})
    return mid, hm, did


async def cliente_con_consenso(c, servizio=False, offerte=False, zone=(), preferiti=()):
    uid, h = await nuovo_utente("client")
    if preferiti:
        await server.db.users.update_one({"id": uid}, {"$set": {"preferiti": list(preferiti)}})
    await iscrivi(c, h, uid[:8])
    if servizio or offerte:
        r = await c.put("/api/push/consenso", json={"servizio": servizio, "offerte": offerte, "zone": list(zone)}, headers=h)
        assert r.status_code == 200, r.text
    return uid, h


# ---------- Interruttore spento ----------

def test_interruttore_spento_niente_endpoint_e_niente_invii(push, monkeypatch):
    monkeypatch.delenv("PUSH_UTENTI_ENABLED")

    async def body(c):
        uid, h = await nuovo_utente("client")
        mid, hm = await nuovo_utente("merchant")
        for hh in ({}, h, hm):
            assert (await c.get("/api/push/stato", headers=hh)).status_code == 404
            assert (await c.post("/api/push/iscrizione", json=iscrizione("x"), headers=hh)).status_code == 404
            assert (await c.request("DELETE", "/api/push/iscrizione", json={"endpoint": ENDPOINT + "x"}, headers=hh)).status_code == 404
            assert (await c.post("/api/push/prova", headers=hh)).status_code == 404
            assert (await c.put("/api/push/consenso", json={"servizio": True}, headers=hh)).status_code == 404
            assert (await c.delete("/api/push/tutto", headers=hh)).status_code == 404
        # anche con un'iscrizione e un consenso già nel database (per esempio da prima dello spegnimento) non parte nulla
        await server.db.push_iscrizioni.insert_one({"endpoint": ENDPOINT + "x", "user_id": mid, "p256dh": "B" * 87, "auth": "a" * 22})
        await server.db.push_iscrizioni.insert_one({"endpoint": ENDPOINT + "y", "user_id": uid, "p256dh": "B" * 87, "auth": "a" * 22})
        await server.db.users.update_one({"id": uid}, {"$set": {"push_consenso.servizio.attivo": True, "push_consenso.offerte.attivo": True}})
        assert (await server._invia_push_utente(mid, "Prova"))["inviate"] == 0
        _, _, did = await negozio_con_offerta(stato="pending")
        await server._approva_offerta(did)
        await attendi()
        for lavoro in (server._run_push_offerte_in_scadenza, server._run_push_riepilogo_commercianti,
                       server._run_push_sconti_in_scadenza, server._invia_coda_promozionale):
            assert (await lavoro()).get("spento") is True
        assert push == []
        assert await server.db.push_coda.count_documents({}) == 0
    run(body, required=False)


def test_config_pubblica_senza_push_non_cambia(push, monkeypatch):
    """Il sito scopre l'interruttore solo da /api/push/stato (404 = riquadro nascosto)."""
    monkeypatch.delenv("PUSH_UTENTI_ENABLED")

    async def body(c):
        r = await c.get("/api/config/public")
        assert r.status_code == 200 and "push" not in json.dumps(r.json())
    run(body, required=False)


# ---------- Autorizzazioni ----------

def test_autorizzazioni(push):
    async def body(c):
        assert (await c.get("/api/push/stato")).status_code == 401
        _, ha = await nuovo_utente("admin")
        assert (await c.get("/api/push/stato", headers=ha)).status_code == 403
        assert (await c.post("/api/push/iscrizione", json=iscrizione("adm"), headers=ha)).status_code == 403
        uid, h = await nuovo_utente("client")
        mid, hm = await nuovo_utente("merchant")
        # il commerciante non ha consensi da cliente
        assert (await c.put("/api/push/consenso", json={"servizio": True}, headers=hm)).status_code == 403
        stato = (await c.get("/api/push/stato", headers=hm)).json()
        assert stato["ruolo"] == "merchant" and "consenso" not in stato and "private_key" not in stato
        # stessa chiave VAPID dell'admin
        assert stato["public_key"] == (await server._chiavi_vapid())["public_key"]
        # un utente non può cancellare l'iscrizione di un altro
        await iscrivi(c, h, "cliente")
        r = await c.request("DELETE", "/api/push/iscrizione", json={"endpoint": ENDPOINT + "cliente"}, headers=hm)
        assert r.json()["rimosse"] == 0
        assert await server.db.push_iscrizioni.count_documents({"user_id": uid}) == 1
        # «prova» e «Disattiva tutto» toccano solo i propri dispositivi
        assert (await c.post("/api/push/prova", headers=hm)).status_code == 404
        await c.delete("/api/push/tutto", headers=hm)
        assert await server.db.push_iscrizioni.count_documents({"user_id": uid}) == 1
        assert (await c.post("/api/push/prova", headers=h)).json()["inviate"] == 1
        # endpoint non https rifiutato
        assert (await c.post("/api/push/iscrizione", json={"endpoint": "http://x.example.com/abc",
                                                            "keys": iscrizione("z")["keys"]}, headers=h)).status_code == 422
    run(body, required=False)


def test_massimo_dieci_dispositivi(push):
    async def body(c):
        _, h = await nuovo_utente("merchant")
        for i in range(10):
            await iscrivi(c, h, f"tel{i}")
        r = await c.post("/api/push/iscrizione", json=iscrizione("tel10"), headers=h)
        assert r.status_code == 409
        await iscrivi(c, h, "tel3")  # lo stesso dispositivo si può rinnovare
        assert await server.db.push_iscrizioni.count_documents({}) == 10
    run(body, required=False)


# ---------- Commercianti ----------

def test_commerciante_approvata_e_da_correggere(push, monkeypatch):
    monkeypatch.setenv("ADMIN_MASTER_PASSWORD", MASTER)

    async def body(c):
        mid, hm, did = await negozio_con_offerta(stato="pending", titolo="Pizza e birra")
        await iscrivi(c, hm, "negozio")
        await server._approva_offerta(did)
        await attendi()
        assert push[-1]["dati"]["title"] == "Offerta approvata: Pizza e birra"
        assert push[-1]["dati"]["url"] == "/merchant/dashboard"
        uid_a, ha = await nuovo_utente("admin")
        m = await c.post("/api/admin/verify-master", json={"password": MASTER}, headers=ha)
        ha = {**ha, "X-Admin-Master": m.json()["token"]}
        motivo = "La foto non mostra il piatto offerto"
        r = await c.post(f"/api/admin/discounts/{did}/reject", json={"reason": motivo}, headers=ha)
        assert r.status_code == 200, r.text
        await attendi()
        ultima = push[-1]["dati"]
        assert ultima["title"] == "Offerta da correggere: Pizza e birra"
        assert motivo not in json.dumps(ultima, ensure_ascii=False)
        assert ultima["url"] == "/merchant/discount"
    run(body, required=False)


def test_scadenza_offerta_tre_giorni_una_volta(push, monkeypatch):
    orologio(monkeypatch, 2026, 10, 28, 10, 5)

    async def body(c):
        mid, hm, did = await negozio_con_offerta()
        await iscrivi(c, hm, "negozio")
        assert (await server._run_push_offerte_in_scadenza())["inviate"] == 1
        assert (await server._run_push_offerte_in_scadenza())["inviate"] == 0  # idempotente
        assert [p["dati"]["title"] for p in push] == ["La tua offerta scade tra 3 giorni"]
        # chi ha già caricato l'offerta del mese dopo non la riceve
        mid2, hm2, _ = await negozio_con_offerta()
        await iscrivi(c, hm2, "negozio2")
        await server.db.next_discounts.insert_one({"id": "n1", "merchant_id": mid2, "target_month": "2026-11"})
        assert (await server._run_push_offerte_in_scadenza())["inviate"] == 0
    run(body, required=False)


def test_scadenza_offerta_non_negli_altri_giorni(push, monkeypatch):
    orologio(monkeypatch, 2026, 10, 27, 10, 5)

    async def body(c):
        _, hm, _ = await negozio_con_offerta()
        await iscrivi(c, hm, "negozio")
        assert (await server._run_push_offerte_in_scadenza())["inviate"] == 0
        assert push == []
    run(body, required=False)


def test_riepilogo_serale_solo_se_qualcuno_ha_usato_lo_sconto(push, monkeypatch):
    orologio(monkeypatch, 2026, 10, 21, 21, 30)

    async def body(c):
        mid, hm, did = await negozio_con_offerta()
        mid0, hm0, _ = await negozio_con_offerta()
        await iscrivi(c, hm, "negozio")
        await iscrivi(c, hm0, "negozio0")
        oggi = datetime(2026, 10, 21, 12, 0, tzinfo=ROMA).astimezone(timezone.utc).isoformat()
        ieri = datetime(2026, 10, 20, 12, 0, tzinfo=ROMA).astimezone(timezone.utc).isoformat()
        for quando, stato in ((oggi, "redeemed"), (oggi, "redeemed"), (ieri, "redeemed"), (None, "pending")):
            await server.db.redemptions.insert_one({"id": str(uuid.uuid4()), "code": uuid.uuid4().hex[:8],
                                                    "user_id": "cliente-segreto", "merchant_id": mid,
                                                    "discount_id": did, "status": stato, "redeemed_at": quando})
        # nessuna notifica al momento della scansione: solo il riepilogo
        assert push == []
        assert (await server._run_push_riepilogo_commercianti())["inviate"] == 1
        assert (await server._run_push_riepilogo_commercianti())["inviate"] == 0
        assert len(push) == 1 and push[0]["endpoint"].endswith("negozio")
        assert push[0]["dati"]["title"] == "Oggi 2 clienti hanno usato il tuo sconto"
        assert "cliente-segreto" not in json.dumps(push)
    run(body, required=False)


# ---------- Clienti: consensi ----------

def test_consensi_separati_salvati_con_data_e_versione(push):
    async def body(c):
        uid, h = await nuovo_utente("client")
        stato = (await c.get("/api/push/stato", headers=h)).json()
        assert stato["consenso"] == {"servizio": False, "offerte": False, "zone": []}  # spento per impostazione predefinita
        r = await c.put("/api/push/consenso", json={"servizio": True, "offerte": False}, headers=h)
        assert r.json()["consenso"]["servizio"] is True and r.json()["consenso"]["offerte"] is False
        u = await server.db.users.find_one({"id": uid})
        pc = u["push_consenso"]
        assert pc["servizio"]["attivo"] is True and pc["servizio"]["at"] and pc["servizio"]["versione_testo"] == server.PUSH_CONSENSO_VERSIONE
        assert "attivo" not in (pc.get("offerte") or {})
        # offerte senza zone e senza preferiti: rifiutato
        assert (await c.put("/api/push/consenso", json={"servizio": True, "offerte": True}, headers=h)).status_code == 422
        r = await c.put("/api/push/consenso", json={"servizio": True, "offerte": True, "zone": ["Garbatella", "Inventata"]}, headers=h)
        assert r.json()["consenso"] == {"servizio": True, "offerte": True, "zone": ["Garbatella"]}
        u2 = await server.db.users.find_one({"id": uid})
        assert u2["push_consenso"]["servizio"]["at"] == pc["servizio"]["at"]  # non cambiato: data invariata
        azioni = [x["action"] async for x in server.db.consent_logs.find({"user_id": uid})]
        assert azioni == ["push_servizio_si", "push_offerte_si"]
    run(body, required=False)


def test_servizio_senza_offerte_e_revoca_immediata(push, monkeypatch):
    orologio(monkeypatch, 2026, 10, 21, 12, 0)

    async def body(c):
        mid, _, did = await negozio_con_offerta(stato="pending")
        uid, h = await cliente_con_consenso(c, servizio=True, preferiti=[mid])
        await server._approva_offerta(did)  # niente consenso «offerte»: nessuna promozionale
        await attendi()
        assert push == []
        assert (await server._invia_push_utente(uid, "Servizio"))["inviate"] == 1
        # «Disattiva tutto»: consensi spenti e iscrizioni cancellate su tutti i dispositivi
        await iscrivi(c, h, "secondo")
        r = await c.delete("/api/push/tutto", headers=h)
        assert r.json()["rimosse"] == 2
        assert (await c.get("/api/push/stato", headers=h)).json()["consenso"] == {"servizio": False, "offerte": False, "zone": []}
        assert (await server._invia_push_utente(uid, "Servizio"))["inviate"] == 0
    run(body, required=False)


def test_revoca_offerte_svuota_la_coda(push, monkeypatch):
    orologio(monkeypatch, 2026, 10, 21, 22, 0)  # fuori fascia: resta in coda

    async def body(c):
        mid, _, did = await negozio_con_offerta(stato="pending")
        uid, h = await cliente_con_consenso(c, offerte=True, preferiti=[mid])
        await server._approva_offerta(did)
        await attendi()
        assert await server.db.push_coda.count_documents({"user_id": uid}) == 1
        await c.put("/api/push/consenso", json={"servizio": False, "offerte": False}, headers=h)
        assert await server.db.push_coda.count_documents({"user_id": uid}) == 0
        orologio(monkeypatch, 2026, 10, 22, 9, 0)
        await server._invia_coda_promozionale()
        assert push == []
    run(body, required=False)


# ---------- Clienti: promozionali, 1 al giorno e fascia oraria ----------

def test_promozionali_fascia_oraria_e_una_al_giorno(push, monkeypatch):
    orologio(monkeypatch, 2026, 10, 21, 22, 30)

    async def body(c):
        mid1, _, did1 = await negozio_con_offerta(stato="pending", titolo="Primo")
        mid2, _, did2 = await negozio_con_offerta(zona="Ostiense", stato="pending", titolo="Secondo")  # quartiere dell'area Garbatella
        mid3, _, did3 = await negozio_con_offerta(zona="Ostia", stato="pending", titolo="Altrove")
        uid, _ = await cliente_con_consenso(c, offerte=True, zone=["Garbatella"], preferiti=[mid1])
        await server._approva_offerta(did1)
        await attendi()
        assert push == [] and await server.db.push_coda.count_documents({}) == 1  # 22:30: in coda
        orologio(monkeypatch, 2026, 10, 22, 8, 59)
        assert (await server._invia_coda_promozionale()).get("fuori_orario") is True
        orologio(monkeypatch, 2026, 10, 22, 9, 0)
        assert (await server._invia_coda_promozionale())["inviate"] == 1
        assert push[0]["dati"]["title"] == "Nuova offerta da un negozio che segui"
        assert push[0]["dati"]["body"] == "Osteria di prova: Primo"
        assert push[0]["dati"]["url"] == f"/discounts/{did1}"
        await server._approva_offerta(did2)  # nella zona scelta, stesso giorno: rimandata a domani
        await server._approva_offerta(did3)  # fuori zona, non seguito: niente
        await attendi()
        assert len(push) == 1 and await server.db.push_coda.count_documents({}) == 1
        assert (await server._invia_coda_promozionale())["rimandate"] == 1
        orologio(monkeypatch, 2026, 10, 23, 10, 0)
        assert (await server._invia_coda_promozionale())["inviate"] == 1
        assert push[1]["dati"]["title"] == "Nuova offerta nella tua zona"
        # riapprovata nello stesso mese: nessun doppione
        await server._approva_offerta(did2)
        await attendi()
        assert await server.db.push_coda.count_documents({}) == 0
        # nessun dato personale del cliente nelle notifiche
        u = await server.db.users.find_one({"id": uid})
        assert u["email"] not in json.dumps(push)
    run(body, required=False)


def test_piu_offerte_in_coda_diventano_una_sola_notifica(push, monkeypatch):
    orologio(monkeypatch, 2026, 10, 21, 23, 0)

    async def body(c):
        negozi = [await negozio_con_offerta(stato="pending", titolo=f"Offerta {i}") for i in range(3)]
        await cliente_con_consenso(c, offerte=True, zone=["Garbatella"])
        for _, _, did in negozi:
            await server._approva_offerta(did)
        await attendi()
        orologio(monkeypatch, 2026, 10, 22, 9, 15)
        await server._invia_coda_promozionale()
        assert len(push) == 1
        assert push[0]["dati"]["title"] == "Nuove offerte per te" and push[0]["dati"]["body"].startswith("3 ")
    run(body, required=False)


# ---------- Clienti: sconto in scadenza ----------

def test_sconto_scade_domani(push, monkeypatch):
    orologio(monkeypatch, 2026, 10, 30, 10, 10)

    async def body(c):
        mid, _, did = await negozio_con_offerta()
        uid, h = await cliente_con_consenso(c, servizio=True)
        uid2, _ = await cliente_con_consenso(c)  # QR non usato ma senza consenso: niente
        for u in (uid, uid2):
            await server.db.redemptions.insert_one({"id": str(uuid.uuid4()), "code": uuid.uuid4().hex[:8], "user_id": u,
                                                    "merchant_id": mid, "discount_id": did, "status": "pending",
                                                    "month_key": "2026-10"})
        assert (await server._run_push_sconti_in_scadenza())["inviate"] == 1
        assert (await server._run_push_sconti_in_scadenza())["inviate"] == 0
        assert [p["dati"]["title"] for p in push] == ["Il tuo sconto scade domani"]
        orologio(monkeypatch, 2026, 10, 29, 10, 10)
        assert (await server._run_push_sconti_in_scadenza()).get("oggi_no") is True
    run(body, required=False)


# ---------- Pulizia e cancellazione ----------

def test_iscrizione_scaduta_410_cancellata(push):
    async def body(c):
        mid, hm = await nuovo_utente("merchant")
        await iscrivi(c, hm, "buono")
        await iscrivi(c, hm, "vecchio-scaduto")
        esito = await server._invia_push_utente(mid, "Prova")
        assert esito == {"inviate": 1, "rimosse": 1, "errori": 0}
        assert await server.db.push_iscrizioni.count_documents({"user_id": mid}) == 1
    run(body, required=False)


def test_cancellazione_account_toglie_iscrizioni_e_coda(push, monkeypatch):
    orologio(monkeypatch, 2026, 10, 21, 23, 0)

    async def body(c):
        mid, hm, did = await negozio_con_offerta(stato="pending")
        await iscrivi(c, hm, "negozio")
        uid, h = await cliente_con_consenso(c, servizio=True, offerte=True, zone=["Garbatella"])
        await server._approva_offerta(did)
        await attendi()
        assert await server.db.push_coda.count_documents({"user_id": uid}) == 1
        r = await c.delete("/api/gdpr/delete-account", headers=h)
        assert r.status_code == 200, r.text
        for coll in (server.db.push_iscrizioni, server.db.push_coda, server.db.push_inviati):
            assert await coll.count_documents({"user_id": uid}) == 0
        assert await server.db.cancellazioni_account.count_documents({"ruolo": "client"}) == 1
        r = await c.delete("/api/gdpr/delete-account", headers=hm)
        assert r.status_code == 200, r.text
        assert await server.db.push_iscrizioni.count_documents({}) == 0
        assert await server.db.cancellazioni_account.count_documents({}) == 2
    run(body, required=False)
