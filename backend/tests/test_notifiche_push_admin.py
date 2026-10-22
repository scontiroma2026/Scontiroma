"""Notifiche push sul telefono dell'admin (Web Push/VAPID) ed email «Nuovo cliente iscritto».
pywebpush è sostituito da una funzione finta: nessuna chiamata di rete. Database locale (mongomock)."""
import asyncio
import base64
import json
import uuid

import pytest

import email_service
from test_interruttore_abbonamento import nuovo_utente, run, server

MASTER = "master-test-123456"
ENDPOINT = "https://push.example.com/invio/"


@pytest.fixture
def push(monkeypatch):
    """Sostituisce webpush: registra ogni invio; un endpoint che finisce con «-scaduto» risponde 410."""
    inviate = []

    class Risposta:
        def __init__(self, status_code):
            self.status_code = status_code
            self.text = ""

    def finto_webpush(subscription_info, data, vapid_private_key, vapid_claims, **kwargs):
        if subscription_info["endpoint"].endswith("-scaduto"):
            raise server.WebPushException("Gone", response=Risposta(410))
        if subscription_info["endpoint"].endswith("-guasto"):
            raise server.WebPushException("Errore", response=Risposta(500))
        inviate.append({"endpoint": subscription_info["endpoint"], "dati": json.loads(data),
                        "chiave": vapid_private_key, "claims": dict(vapid_claims)})
        return Risposta(201)

    monkeypatch.setattr(server, "webpush", finto_webpush)
    monkeypatch.setenv("ADMIN_MASTER_PASSWORD", MASTER)
    monkeypatch.delenv("VAPID_PUBLIC_KEY", raising=False)
    monkeypatch.delenv("VAPID_PRIVATE_KEY", raising=False)
    return inviate


@pytest.fixture
def posta(monkeypatch):
    inviate = []

    def finta(nome):
        async def f(*args, **kwargs):
            inviate.append((nome, args))
        return f

    for nome in ("send_welcome_client", "send_welcome_merchant", "send_admin_new_merchant",
                 "send_admin_new_offer", "send_admin_new_client", "send_email_confirmation"):
        monkeypatch.setattr(server, nome, finta(nome))
    monkeypatch.setenv("ADMIN_NOTIFY_EMAIL", "avvisi@example.com")
    monkeypatch.delenv("ADMIN_EMAIL_NUOVO_CLIENTE", raising=False)
    return inviate


async def admin_master(c):
    uid, h = await nuovo_utente("admin")
    m = await c.post("/api/admin/verify-master", json={"password": MASTER}, headers=h)
    assert m.status_code == 200, m.text
    return uid, {**h, "X-Admin-Master": m.cookies["admin_master_token"]}


def iscrizione(fine="telefono"):
    return {"endpoint": ENDPOINT + fine, "keys": {"p256dh": "B" + "x" * 86, "auth": "a" * 22}}


async def iscrivi_telefono(c, h, fine="telefono"):
    r = await c.post("/api/admin/push/iscrizione", json=iscrizione(fine), headers=h)
    assert r.status_code == 200, r.text


async def attendi():
    await server.attendi_lavori_in_background()  # aspetta la fine di notifiche ed email in background


async def registra(c, role):
    body = {"email": f"{role}.{uuid.uuid4().hex[:8]}@example.com", "password": "Password-prova-123",
            "name": "Mario Rossi", "role": role, "legal_accepted": True}
    if role == "merchant":
        body.update({"shop_name": "Osteria di prova", "zone": "Garbatella", "category": "Ristorante",
                     "phone": "+39 06 0000000", "partita_iva": "12345678903", "legal_specific_accepted": True})
    r = await c.post("/api/auth/register", json=body)
    assert r.status_code == 200, r.text
    return body, r.json()


# ---------- Autorizzazione ----------

def test_solo_admin_con_master(push):
    async def body(c):
        r = await c.get("/api/admin/push/chiave-pubblica")
        assert r.status_code == 401
        _, hc = await nuovo_utente("client")
        _, hm = await nuovo_utente("merchant")
        for h in (hc, hm):
            assert (await c.get("/api/admin/push/chiave-pubblica", headers=h)).status_code == 403
            assert (await c.post("/api/admin/push/iscrizione", json=iscrizione(), headers=h)).status_code == 403
            assert (await c.request("DELETE", "/api/admin/push/iscrizione", json={"endpoint": ENDPOINT + "telefono"}, headers=h)).status_code == 403
            assert (await c.post("/api/admin/push/prova", headers=h)).status_code == 403
        # admin senza master password: rifiutato
        _, ha = await nuovo_utente("admin")
        assert (await c.get("/api/admin/push/chiave-pubblica", headers=ha)).status_code == 403
        assert await server.db.admin_push_iscrizioni.count_documents({}) == 0
    run(body, required=False)


# ---------- Chiavi VAPID ----------

def test_chiavi_generate_una_volta_e_riusate(push):
    async def body(c):
        _, h = await admin_master(c)
        r1 = await c.get("/api/admin/push/chiave-pubblica", headers=h)
        assert r1.status_code == 200, r1.text
        pub = r1.json()["public_key"]
        grezza = base64.urlsafe_b64decode(pub + "=" * (-len(pub) % 4))
        assert len(grezza) == 65 and grezza[0] == 4  # punto P-256 non compresso
        assert "private_key" not in r1.json()
        r2 = await c.get("/api/admin/push/chiave-pubblica", headers=h)
        assert r2.json()["public_key"] == pub
        assert await server.db.config_push.count_documents({"key": "vapid"}) == 1
        doc = await server.db.config_push.find_one({"key": "vapid"})
        priv = doc["private_key"]
        assert len(base64.urlsafe_b64decode(priv + "=" * (-len(priv) % 4))) == 32
        # la chiave privata salvata è quella usata per firmare
        await iscrivi_telefono(c, h)
        assert (await c.post("/api/admin/push/prova", headers=h)).json()["inviate"] == 1
        assert push[0]["chiave"] == priv and push[0]["claims"]["sub"] == "mailto:info@scontiroma.it"
    run(body, required=False)


def test_chiavi_da_env_hanno_la_precedenza(push, monkeypatch):
    coppia = server._genera_chiavi_vapid()
    monkeypatch.setenv("VAPID_PUBLIC_KEY", coppia["public_key"])
    monkeypatch.setenv("VAPID_PRIVATE_KEY", coppia["private_key"])

    async def body(c):
        _, h = await admin_master(c)
        r = await c.get("/api/admin/push/chiave-pubblica", headers=h)
        assert r.json()["public_key"] == coppia["public_key"]
        assert await server.db.config_push.count_documents({}) == 0
    run(body, required=False)


def test_chiavi_vere_firmano_con_py_vapid():
    """La coppia generata è nel formato che pywebpush/py_vapid sa leggere."""
    from py_vapid import Vapid
    coppia = server._genera_chiavi_vapid()
    v = Vapid.from_string(private_key=coppia["private_key"])
    intestazioni = v.sign({"sub": "mailto:info@scontiroma.it", "aud": "https://push.example.com"})
    assert "vapid" in intestazioni["Authorization"].lower() or intestazioni["Authorization"].startswith("WebPush")


# ---------- Iscrizione, cancellazione, prova ----------

def test_iscrizione_cancellazione_e_prova(push):
    async def body(c):
        uid, h = await admin_master(c)
        assert (await c.post("/api/admin/push/prova", headers=h)).status_code == 404  # nessun telefono
        await iscrivi_telefono(c, h)
        await iscrivi_telefono(c, h)  # stessa iscrizione: nessun doppione
        assert await server.db.admin_push_iscrizioni.count_documents({"user_id": uid}) == 1
        assert (await c.get("/api/admin/push/chiave-pubblica", headers=h)).json()["iscrizioni"] == 1
        r = await c.post("/api/admin/push/prova", headers=h)
        assert r.status_code == 200 and r.json()["ok"] is True and r.json()["inviate"] == 1
        assert push[-1]["dati"]["url"] == "/admin"
        # endpoint non https: rifiutato
        cattiva = {**iscrizione(), "endpoint": "http://push.example.com/x"}
        assert (await c.post("/api/admin/push/iscrizione", json=cattiva, headers=h)).status_code == 422
        r = await c.request("DELETE", "/api/admin/push/iscrizione", json={"endpoint": ENDPOINT + "telefono"}, headers=h)
        assert r.status_code == 200 and r.json()["rimosse"] == 1
        assert await server.db.admin_push_iscrizioni.count_documents({}) == 0
    run(body, required=False)


def test_pulizia_iscrizione_scaduta_410(push):
    async def body(c):
        _, h = await admin_master(c)
        await iscrivi_telefono(c, h, "telefono")
        await iscrivi_telefono(c, h, "vecchio-scaduto")
        await iscrivi_telefono(c, h, "rotto-guasto")
        r = await c.post("/api/admin/push/prova", headers=h)
        assert r.json()["inviate"] == 1 and r.json()["rimosse"] == 1 and r.json()["errori"] == 1
        rimaste = sorted([d["endpoint"] async for d in server.db.admin_push_iscrizioni.find({})])
        assert rimaste == [ENDPOINT + "rotto-guasto", ENDPOINT + "telefono"]  # il 500 non cancella
    run(body, required=False)


def test_iscrizione_di_un_non_admin_non_riceve(push):
    """Una riga rimasta di un utente che non è più admin non riceve notifiche."""
    async def body(c):
        _, h = await admin_master(c)
        await iscrivi_telefono(c, h)
        ex_uid, _ = await nuovo_utente("client")
        await server.db.admin_push_iscrizioni.insert_one(
            {"endpoint": ENDPOINT + "ex-admin", "user_id": ex_uid, "p256dh": "B" + "x" * 86, "auth": "a" * 22})
        esito = await server._invia_push_admin("Titolo")
        assert esito["inviate"] == 1 and [p["endpoint"] for p in push] == [ENDPOINT + "telefono"]
    run(body, required=False)


# ---------- I tre eventi ----------

def test_push_nuovo_commerciante(push, posta):
    async def body(c):
        _, h = await admin_master(c)
        await iscrivi_telefono(c, h)
        await registra(c, "merchant")
        await attendi()
    run(body, required=False)
    assert [p["dati"]["title"] for p in push] == ["Nuovo commerciante: Osteria di prova"]
    assert push[0]["dati"]["url"] == "/admin"


def test_push_offerta_da_approvare(push, posta):
    async def body(c):
        _, h = await admin_master(c)
        await iscrivi_telefono(c, h)
        _, reg = await registra(c, "merchant")
        await attendi()
        push.clear()
        hm = {"Authorization": f"Bearer {reg['access_token']}"}
        offerta = {"title": "Menù di pesce", "description": "Descrizione.", "original_price": 40, "discounted_price": 20}
        assert (await c.post("/api/merchants/me/discount", json=offerta, headers=hm)).status_code == 200
        await attendi()
        # ancora in attesa: nessuna seconda notifica (come per l'email)
        assert (await c.post("/api/merchants/me/discount", json={**offerta, "title": "Bis"}, headers=hm)).status_code == 200
        await attendi()
    run(body, required=False)
    assert [p["dati"]["title"] for p in push] == ["Offerta da approvare: Osteria di prova"]


def test_push_e_email_nuovo_cliente_senza_dati_personali(push, posta):
    async def body(c):
        _, h = await admin_master(c)
        await iscrivi_telefono(c, h)
        dati, _ = await registra(c, "client")
        await attendi()
        return dati
    dati_cliente = {}

    async def corpo(c):
        dati_cliente.update(await body(c))
    run(corpo, required=False)
    assert [p["dati"]["title"] for p in push] == ["Nuovo cliente iscritto"]
    testo = json.dumps(push[0]["dati"], ensure_ascii=False)
    assert dati_cliente["email"] not in testo and "Mario" not in testo and "Rossi" not in testo
    email = [a for n, a in posta if n == "send_admin_new_client"]
    assert len(email) == 1
    to, quando, totale = email[0]
    assert to == "avvisi@example.com" and totale == 1 and "alle" in quando
    assert dati_cliente["email"] not in " ".join(map(str, email[0]))


def test_email_nuovo_cliente_interruttore_spento(push, posta, monkeypatch):
    monkeypatch.setenv("ADMIN_EMAIL_NUOVO_CLIENTE", "false")

    async def body(c):
        _, h = await admin_master(c)
        await iscrivi_telefono(c, h)
        await registra(c, "client")
        await attendi()
    run(body, required=False)
    assert "send_admin_new_client" not in [n for n, _ in posta]
    assert [p["dati"]["title"] for p in push] == ["Nuovo cliente iscritto"]  # la notifica parte lo stesso


def test_nuovo_cliente_con_conferma_email_avvisa_solo_dopo_la_conferma(push, posta, monkeypatch):
    monkeypatch.setenv("CLIENT_EMAIL_CONFIRMATION_REQUIRED", "true")

    async def body(c):
        _, h = await admin_master(c)
        await iscrivi_telefono(c, h)
        await registra(c, "client")
        await attendi()
        assert push == [] and "send_admin_new_client" not in [n for n, _ in posta]
        token = next(a for n, a in posta if n == "send_email_confirmation")[2]
        assert (await c.post("/api/auth/confirm-email", json={"token": token})).status_code == 200
        await attendi()
    run(body, required=False)
    assert [p["dati"]["title"] for p in push] == ["Nuovo cliente iscritto"]
    assert [n for n, _ in posta].count("send_admin_new_client") == 1


def test_nessun_telefono_nessun_invio(push, posta):
    async def body(c):
        await registra(c, "client")
        await registra(c, "merchant")
        await attendi()
    run(body, required=False)
    assert push == []


# ---------- Testo delle email ----------

def test_testo_email_nuovo_cliente(monkeypatch):
    catturate = []

    async def finto_send(to, subject, html):
        catturate.append((to, subject, html))

    monkeypatch.setattr(email_service, "_send", finto_send)
    asyncio.run(email_service.send_admin_new_client("avvisi@example.com", "21/10/2026 alle 10:30", 42))
    to, oggetto, html = catturate[0]
    assert oggetto == "Nuovo cliente iscritto"
    assert "21/10/2026 alle 10:30" in html and ">42<" in html and "/admin" in html
    assert "@" not in html.replace("avvisi@example.com", "")  # nessun indirizzo email nel testo


def test_email_nuovo_commerciante_dice_zona(monkeypatch):
    catturate = []

    async def finto_send(to, subject, html):
        catturate.append(html)

    monkeypatch.setattr(email_service, "_send", finto_send)
    asyncio.run(email_service.send_admin_new_merchant("avvisi@example.com", "Bar", "Bar", "Garbatella", "n@example.com", "06"))
    assert ">Zona<" in catturate[0] and "Quartiere" not in catturate[0]
