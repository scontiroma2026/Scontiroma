"""Fonte di iscrizione (volantini con QR): si salva solo se valida, solo per i clienti, e il conteggio è anonimo.
Database locale (mongomock) come gli altri test."""
from test_interruttore_abbonamento import run, server


def _reg(email, **extra):
    base = {"email": email, "password": "Password-di-prova-123", "name": "Cliente Prova", "role": "client",
            "legal_accepted": True}
    base.update(extra)
    return base


def test_fonte_valida_salvata_e_contata():
    async def body(c):
        r = await c.post("/api/auth/register", json=_reg("a1@example.com", fonte="volantino-garbatella"))
        assert r.status_code == 200, r.text
        r = await c.post("/api/auth/register", json=_reg("a2@example.com", fonte="Volantino-Garbatella "))
        assert r.status_code == 200, r.text
        r = await c.post("/api/auth/register", json=_reg("a3@example.com", fonte="volantino-marconi"))
        assert r.status_code == 200, r.text
        # fonte non valida: ignorata, l'iscrizione riesce comunque
        r = await c.post("/api/auth/register", json=_reg("a4@example.com", fonte="<script>x</script>"))
        assert r.status_code == 200, r.text
        r = await c.post("/api/auth/register", json=_reg("a5@example.com"))
        assert r.status_code == 200, r.text
        u4 = await server.db.users.find_one({"email": "a4@example.com"})
        assert "fonte_iscrizione" not in u4
        righe = await server._iscrizioni_per_fonte()
        per = {x["fonte"]: x for x in righe}
        assert per["volantino-garbatella"]["totale"] == 2
        assert per["volantino-garbatella"]["ultimi_30_giorni"] == 2
        assert per["volantino-marconi"]["totale"] == 1
        assert set(per) == {"volantino-garbatella", "volantino-marconi"}
        # il conteggio non contiene dati personali
        assert all(set(x) == {"fonte", "ultimi_30_giorni", "totale"} for x in righe)

    run(body, False)


def test_fonte_salvata_anche_per_i_negozi():
    """Dal 16/10 la fonte si salva anche per i negozi (QR dei volantini per i commercianti), senza dati personali."""
    async def body(c):
        r = await c.post("/api/auth/register", json=_reg(
            "negozio1@example.com", role="merchant", shop_name="Negozio di prova", zone="Garbatella",
            category="Ristorante", phone="3331112222", partita_iva="12345678903", legal_specific_accepted=True, fonte="volantino-garbatella"))
        assert r.status_code == 200, r.text
        u = await server.db.users.find_one({"email": "negozio1@example.com"})
        assert u["fonte_iscrizione"] == "volantino-garbatella"

    run(body, False)
