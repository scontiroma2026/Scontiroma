"""Dati FITTIZI per le riprese del video di attesa per i clienti (server locale, database in memoria).
Nomi inventati («... dell'Esempio»), email @example.com, password di prova, Partita IVA di fantasia.
Foto: libreria del sito (frontend/public/esempi, licenza Unsplash), nessun volto, nessun marchio.
Prezzi e zone servono solo perché il modulo li chiede: nelle riprese sono NASCOSTI (riprese.js).
Uso: python seed_attesa.py   (scrive solo su http://localhost:8012)
"""
import os
import httpx

API = os.environ.get("ATTESA_API", "http://localhost:8012")
assert API.startswith(("http://localhost", "http://127.0.0.1")), "solo server locale"
B = API + "/api"
SITO = os.environ.get("ATTESA_APP", "http://localhost:3012")
ADMIN_EMAIL, ADMIN_PASSWORD, MASTER = "admin@example.com", "e2e-admin-password", "e2e-master-password"  # solo test locali
PIVA = "12345678903"  # Partita IVA di fantasia (cifra di controllo valida)


def foto(i):
    return f"{SITO}/esempi/{i}.jpg"


a = httpx.Client(timeout=60)
r = a.post(f"{B}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
a.headers["Authorization"] = "Bearer " + r.json()["access_token"]
a.headers["X-Admin-Master"] = a.post(f"{B}/admin/verify-master", json={"password": MASTER}).json()["token"]

SHOPS = [
    dict(email="osteria.esempio@example.com", shop="Osteria dell'Esempio", zone="Cassia", cat="Ristorante",
         offer=dict(title="Menù di carne", description="Antipasto, primo e secondo di carne.", original_price=50, discounted_price=30,
                    validity_info="Il martedì e il giovedì", max_uses_per_month=1, image_url=foto("1611171711791-b34fa42e9fc2"))),
    dict(email="bar.esempio@example.com", shop="Bar dell'Esempio", zone="Aurelio", cat="Bar & Caffè",
         offer=dict(title="Colazione al banco", description="Cappuccino e cornetto a scelta.", original_price=4, discounted_price=3,
                    validity_info="Tutti i giorni fino alle 11", max_uses_per_month=4, image_url=foto("1509042239860-f550ce710b93"))),
    dict(email="pizzeria.esempio@example.com", shop="Pizzeria dell'Esempio", zone="Tiburtino", cat="Pizzeria",
         offer=dict(title="Pizza e bibita", description="Una pizza a scelta e una bibita.", original_price=14, discounted_price=10,
                    validity_info="Dal lunedì al giovedì, a cena", max_uses_per_month=2, image_url=foto("1513104890138-7c749659a591"))),
    dict(email="enoteca.esempio@example.com", shop="Enoteca dell'Esempio", zone="Monte Mario", cat="Vino & Gastronomia",
         offer=dict(title="Bottiglia di vino rosso", description="Un rosso della casa per la tavola di tutti i giorni.", original_price=30, discounted_price=20,
                    validity_info="Il martedì e il giovedì", max_uses_per_month=1, image_url=foto("1506377247377-2a5b3b417ebb"))),
]
for s in SHOPS:
    m = httpx.Client(timeout=60)
    r = m.post(f"{B}/auth/register", json={"email": s["email"], "password": "demo-shop-2026", "name": "Esempio", "role": "merchant",
               "shop_name": s["shop"], "zone": s["zone"], "category": s["cat"], "phone": "+39 06 0000000",
               "address": "Via dell'Esempio 1, Roma", "partita_iva": PIVA, "legal_accepted": True})
    assert r.status_code == 200, r.text
    m.headers["Authorization"] = "Bearer " + r.json()["access_token"]
    c = m.post(f"{B}/merchants/me/discount", json=s["offer"])
    assert c.status_code == 200, c.text
    ok = a.post(f"{B}/admin/discounts/{c.json()['discount']['id']}/approve")
    print(s["shop"], "approvazione", ok.status_code)
