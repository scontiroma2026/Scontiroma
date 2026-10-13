"""Protezione dalle registrazioni false in massa: simula abusi e verifica cosa passa e cosa no.
Solo database locale (mongomock), email finte, nessun IP salvato. Con `-s` stampa la tabella finale.
Vedi docs/operazioni/PROTEZIONE_REGISTRAZIONI.md."""
import pytest

from test_interruttore_abbonamento import run
import server

CLIENTE = {"password": "password-prova-1", "name": "Cliente Prova", "role": "client", "legal_accepted": True}
NEGOZIO = {"password": "password-prova-1", "name": "Titolare Prova", "role": "merchant", "legal_accepted": True,
           "legal_specific_accepted": True, "shop_name": "Negozio Prova", "phone": "0600000000"}
PIVA_VALIDA = "12345678903"
RISULTATI: list = []


def da(n: int) -> dict:
    """Un «client» diverso: l'indirizzo arriva dall'intestazione del proxy (solo in memoria)."""
    return {"X-Forwarded-For": f"203.0.113.{n}"}


@pytest.fixture(autouse=True)
def _ambiente(monkeypatch):
    inviate = {"benvenuto": 0, "reset": 0}

    async def benvenuto(*a, **k):
        inviate["benvenuto"] += 1

    async def reset(*a, **k):
        inviate["reset"] += 1

    monkeypatch.setattr(server, "send_welcome_client", benvenuto)
    monkeypatch.setattr(server, "send_welcome_merchant", benvenuto)
    monkeypatch.setattr(server, "send_password_reset", reset)
    monkeypatch.setattr(server, "send_admin_segnalazione", benvenuto)
    monkeypatch.setenv("ADMIN_NOTIFY_EMAIL", "")
    monkeypatch.setenv("REGISTRAZIONI_MAX_PER_FINESTRA", "10")
    monkeypatch.setenv("RESET_MAX_PER_CLIENT_10MIN", "3")
    monkeypatch.setenv("RESET_MAX_PER_CLIENT_ORA", "5")
    server._limiti_client.clear()
    server._interesse_richieste.clear()
    server._segnalazioni_recenti.clear()
    return inviate


def esito(abuso: str, stato: str, nota: str):
    RISULTATI.append((abuso, stato, nota))


def test_raffica_di_registrazioni_dallo_stesso_client():
    async def body(c):
        codici = []
        for i in range(14):
            r = await c.post("/api/auth/register", json={**CLIENTE, "email": f"raffica{i}@example.com"}, headers=da(1))
            codici.append(r.status_code)
        assert codici[:10] == [200] * 10
        assert codici[10:] == [429] * 4
        assert r.json()["detail"] == "Troppe richieste, riprova tra qualche minuto."
        # un altro client (altra famiglia, altro negozio) non è toccato
        r = await c.post("/api/auth/register", json={**CLIENTE, "email": "altro@example.com"}, headers=da(2))
        assert r.status_code == 200
        # nessun indirizzo IP finisce nel database
        assert "203.0.113" not in str([u async for u in server.db.users.find({})])
        assert "203.0.113" not in str(list(server._limiti_client))
        esito("Raffica di registrazioni dallo stesso client", "protetto", "10 ogni 10 minuti, poi 429")
    run(body, False)


def test_limite_spento_con_zero():
    async def body(c):
        for i in range(25):
            r = await c.post("/api/auth/register", json={**CLIENTE, "email": f"libero{i}@example.com"}, headers=da(1))
            assert r.status_code == 200
    import os
    os.environ["REGISTRAZIONI_MAX_PER_FINESTRA"] = "0"
    run(body, False)


def test_famiglia_e_negozio_non_sono_bloccati():
    """5 persone sullo stesso Wi-Fi, o un negozio che iscrive 8 clienti in negozio: tutto passa."""
    async def body(c):
        for i in range(8):
            r = await c.post("/api/auth/register", json={**CLIENTE, "email": f"famiglia{i}@example.com"}, headers=da(7))
            assert r.status_code == 200
    run(body, False)


def test_email_usa_e_getta_simili():
    async def body(c):
        stati = []
        for i in range(1, 7):
            r = await c.post("/api/auth/register", json={**CLIENTE, "email": f"a+{i}@example.com"}, headers=da(i))
            stati.append(r.status_code)
        # da client diversi gli alias passano tutti: non c'è verifica dell'email
        assert stati == [200] * 6
        esito("Molti account con email simili (a+1@, a+2@...)", "non protetto",
              "gli alias sono email valide; manca la verifica dell'email; frena solo il limite per client")
    run(body, False)


def test_email_di_altri_senza_verifica(_ambiente):
    async def body(c):
        r = await c.post("/api/auth/register", json={**CLIENTE, "email": "vittima@example.com"}, headers=da(3))
        assert r.status_code == 200 and _ambiente["benvenuto"] == 1  # la «vittima» riceve l'email di benvenuto
        r = await c.post("/api/auth/register", json={**CLIENTE, "email": "vittima@example.com"}, headers=da(3))
        assert r.status_code == 400 and r.json()["detail"] == "Email già registrata"
        esito("Iscrivere l'email di un'altra persona", "non protetto",
              "nessuna verifica dell'email; la risposta «Email già registrata» rivela chi è iscritto (frenata dal limite)")
    run(body, False)


def test_stessa_partita_iva_per_piu_negozi():
    async def body(c):
        stati = []
        for i in range(3):
            r = await c.post("/api/auth/register", json={**NEGOZIO, "email": f"neg{i}@example.com", "partita_iva": PIVA_VALIDA}, headers=da(i + 1))
            stati.append(r.status_code)
        assert stati == [200, 200, 200]
        assert await server.db.users.count_documents({"partita_iva": PIVA_VALIDA}) == 3
        # ma una Partita IVA inventata (cifra di controllo sbagliata) è rifiutata
        r = await c.post("/api/auth/register", json={**NEGOZIO, "email": "neg9@example.com", "partita_iva": "12345678900"}, headers=da(9))
        assert r.status_code == 422
        esito("Stessa Partita IVA per più negozi", "parzialmente",
              "il formato è controllato (cifra di controllo) ma non l'unicità né l'esistenza; più sedi della stessa ditta sono legittime")
    run(body, False)


def test_diciassette_anni():
    async def body(c):
        # senza la dichiarazione 18+/Termini il server rifiuta
        r = await c.post("/api/auth/register", json={**CLIENTE, "legal_accepted": False, "email": "minore@example.com"}, headers=da(1))
        assert r.status_code == 400
        # il server non conosce l'età: un campo «eta: 17» viene ignorato e la registrazione passa con la spunta
        r = await c.post("/api/auth/register", json={**CLIENTE, "eta": 17, "email": "minore2@example.com"}, headers=da(1))
        assert r.status_code == 200
        esito("Registrazione dichiarando 17 anni", "parzialmente",
              "la spunta «ho almeno 18 anni» è obbligatoria (sito e server) ma è solo una dichiarazione, non verificabile")
    run(body, False)


def test_fammi_sapere_a_raffica():
    async def body(c):
        stati = [(await c.post("/api/interesse-zona", json={"zona": "Garbatella"}, headers=da(5))).status_code for _ in range(14)]
        assert stati[:10] == [200] * 10 and stati[10:] == [429] * 4
        # chi cambia a ogni richiesta l'intestazione del proxy aggira il limite
        stati = [(await c.post("/api/interesse-zona", json={"zona": "Garbatella"}, headers=da(100 + i))).status_code for i in range(30)]
        assert stati == [200] * 30
        esito("«Fammi sapere quando arrivate» a raffica", "parzialmente",
              "10 all'ora per client; un bot che falsifica l'intestazione del proxy lo aggira (effetto: numeri gonfiati, nessun dato personale)")
    run(body, False)


def test_segnalazioni_a_raffica():
    async def body(c):
        corpo = {"tipo": "altro", "motivo": "Segnalazione di prova lunga abbastanza"}
        stati = [(await c.post("/api/segnalazioni", json=corpo, headers=da(5))).status_code for _ in range(8)]
        assert stati == [200] * 5 + [429] * 3
        # client diversi hanno contatori diversi (prima del fix dietro il proxy erano tutti uno solo)
        assert (await c.post("/api/segnalazioni", json=corpo, headers=da(6))).status_code == 200
        esito("Segnalazioni a raffica", "protetto", "5 all'ora per client; non c'è un tetto globale (spam possibile da molti client)")
    run(body, False)


def test_reset_password_a_raffica(_ambiente):
    async def body(c):
        await c.post("/api/auth/register", json={**CLIENTE, "email": "reset@example.com"}, headers=da(1))
        # stesso indirizzo (3 richieste, entro il limite del client): una sola email, le altre richieste vengono ignorate in silenzio (risposta identica)
        for _ in range(3):
            r = await c.post("/api/auth/forgot", json={"email": "reset@example.com"}, headers=da(2))
            assert r.status_code == 200
        assert _ambiente["reset"] == 1
        # (le 6 richieste sopra erano di un altro client: questo parte da zero)
        # molti indirizzi diversi dallo stesso client: la 4ª in 10 minuti arriva con 429
        stati = []
        for i in range(5):
            r = await c.post("/api/auth/forgot", json={"email": f"x{i}@example.com"}, headers=da(3))
            stati.append(r.status_code)
        assert stati == [200, 200, 200, 429, 429]
        assert r.json()["detail"] == "Troppe richieste, riprova tra qualche minuto."
        # un altro client non è toccato
        assert (await c.post("/api/auth/forgot", json={"email": "y@example.com"}, headers=da(4))).status_code == 200
        esito("Reset password a raffica sullo stesso indirizzo", "protetto", "1 al minuto e 5 all'ora per account")
        esito("Reset password verso molti indirizzi dallo stesso client", "protetto", "3 ogni 10 minuti e 5 all'ora per client")
    run(body, False)


def test_reset_sesta_richiesta_in_un_ora_bloccata(monkeypatch):
    """Passano 3 richieste, trascorrono 11 minuti (finestra breve libera): la 4ª e la 5ª passano
    (5 all'ora), la 6ª no."""
    async def body(c):
        t = [1000.0]
        monkeypatch.setattr(server.time, "monotonic", lambda: t[0])
        stati = []
        for i in range(6):
            if i == 3:
                t[0] += 660
            r = await c.post("/api/auth/forgot", json={"email": f"o{i}@example.com"}, headers=da(8))
            stati.append(r.status_code)
        assert stati == [200, 200, 200, 200, 200, 429]
        # passata l'ora, si può di nuovo
        t[0] += 3600
        assert (await c.post("/api/auth/forgot", json={"email": "o9@example.com"}, headers=da(8))).status_code == 200
    run(body, False)


def test_tentativi_di_accesso():
    async def body(c):
        await c.post("/api/auth/register", json={**CLIENTE, "email": "accesso@example.com"}, headers=da(1))
        stati = [(await c.post("/api/auth/login", json={"email": "accesso@example.com", "password": "sbagliata"}, headers=da(4))).status_code for _ in range(7)]
        assert stati[:5] == [401] * 5 and stati[5:] == [429] * 2
        stati = [(await c.post("/api/auth/login", json={"email": "non-esiste@example.com", "password": "x"}, headers=da(4))).status_code for _ in range(7)]
        assert stati[5:] == [429] * 2
        esito("Tentativi di accesso a raffica", "protetto", "5 errori e blocco di 15 minuti, anche per email inesistenti")
    run(body, False)


def test_senza_accettare_i_termini_e_stampa_tabella():
    async def body(c):
        r = await c.post("/api/auth/register", json={**CLIENTE, "legal_accepted": False, "email": "t@example.com"}, headers=da(1))
        assert r.status_code == 400
        esito("Registrazione senza accettare Termini/Privacy", "protetto", "il server rifiuta (400)")
    run(body, False)
    print("\n\nABUSO | ESITO | NOTA")
    for a, s, n in RISULTATI:
        print(f"{a} | {s} | {n}")
