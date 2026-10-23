"""Dati FITTIZI per le riprese del video tutorial per i clienti (server locale, database in memoria).
Nomi inventati («... dell'Esempio»), email @example.com, password di prova, Partita IVA e telefono di fantasia.
Foto: libreria del sito (frontend/public/esempi, licenza Unsplash), nessun volto, nessun marchio.
Prezzi e zone servono solo perché il modulo li chiede: nelle riprese sono NASCOSTI (riprese.js).
Il Bar è «retrodatato» di 30 giorni: la sua offerta mostra «Nuova offerta», gli altri «Nuovo su Sconti Roma».
Uso: python seed_tutorial.py   (scrive solo su http://localhost:8013)
"""
import json
import os
import httpx

API = os.environ.get("TUTORIAL_API", "http://localhost:8013")
assert API.startswith(("http://localhost", "http://127.0.0.1")), "solo server locale"
B = API + "/api"
SITO = os.environ.get("TUTORIAL_APP", "http://localhost:3013")
OUT = os.environ.get("OUT", ".")
ADMIN_EMAIL, ADMIN_PASSWORD, MASTER = "admin@example.com", "e2e-admin-password", "e2e-master-password"  # solo test locali
PIVA = "12345678903"  # Partita IVA di fantasia (cifra di controllo valida)


def foto(i):
    return f"{SITO}/esempi/{i}.jpg"


a = httpx.Client(timeout=60)
r = a.post(f"{B}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
a.headers["Authorization"] = "Bearer " + r.json()["access_token"]
a.headers["X-Admin-Master"] = a.post(f"{B}/admin/verify-master", json={"password": MASTER}).json()["token"]

SHOPS = [
    dict(email="bar.esempio@example.com", shop="Bar dell'Esempio", zone="Aurelio", cat="Bar & Caffè", retro=30,
         offer=dict(title="Colazione al banco", description="Cappuccino e cornetto a scelta, al banco.", original_price=4, discounted_price=3,
                    validity_info="Tutti i giorni fino alle 11", max_uses_per_month=4, image_url=foto("1509042239860-f550ce710b93"))),
    dict(email="osteria.esempio@example.com", shop="Osteria dell'Esempio", zone="Cassia", cat="Ristorante", retro=0,
         offer=dict(title="Menù di carne", description="Antipasto, primo e secondo di carne.", original_price=50, discounted_price=30,
                    validity_info="Il martedì e il giovedì", max_uses_per_month=1, image_url=foto("1611171711791-b34fa42e9fc2"))),
    dict(email="pizzeria.esempio@example.com", shop="Pizzeria dell'Esempio", zone="Tiburtino", cat="Pizzeria", retro=0,
         offer=dict(title="Pizza e bibita", description="Una pizza a scelta e una bibita.", original_price=14, discounted_price=10,
                    validity_info="Dal lunedì al giovedì, a cena", max_uses_per_month=2, image_url=foto("1513104890138-7c749659a591"))),
    dict(email="enoteca.esempio@example.com", shop="Enoteca dell'Esempio", zone="Monte Mario", cat="Vino & Gastronomia", retro=0,
         offer=dict(title="Bottiglia di vino rosso", description="Un rosso della casa per la tavola di tutti i giorni.", original_price=30, discounted_price=20,
                    validity_info="Il martedì e il giovedì", max_uses_per_month=1, image_url=foto("1506377247377-2a5b3b417ebb"))),
]
ids = {}
for s in SHOPS:
    m = httpx.Client(timeout=60)
    r = m.post(f"{B}/auth/register", json={"email": s["email"], "password": "demo-shop-2026", "name": "Esempio", "role": "merchant",
               "shop_name": s["shop"], "zone": s["zone"], "category": s["cat"], "phone": "+39 06 0000000",
               "address": "Via dell'Esempio 1, Roma", "partita_iva": PIVA, "legal_accepted": True})
    assert r.status_code == 200, r.text
    m.headers["Authorization"] = "Bearer " + r.json()["access_token"]
    c = m.post(f"{B}/merchants/me/discount", json=s["offer"])
    assert c.status_code == 200, c.text
    did = c.json()["discount"]["id"]
    ok = a.post(f"{B}/admin/discounts/{did}/approve")
    if s["retro"]:
        print("  retrodata", httpx.post(API + "/__video/retrodata", params={"email": s["email"], "giorni_negozio": s["retro"]}).json())
    ids[s["shop"]] = did
    print(s["shop"], "approvazione", ok.status_code)
r = httpx.post(f"{B}/auth/register", json={"email": "cliente.demo@example.com", "password": "demo-cliente-2026", "first_name": "Cliente",
               "last_name": "Esempio", "name": "Cliente Esempio", "role": "client", "legal_accepted": True})
print("cliente", r.status_code)
os.makedirs(OUT, exist_ok=True)
json.dump(ids, open(os.path.join(OUT, "demo_ids.json"), "w"))
