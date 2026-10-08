"""Dati FITTIZI per le riprese del video v13 (server locale con database in memoria, vedi avvia_server_v13.py).
Nomi inventati («... dell'Esempio»), email @example.com, password di prova, foto di fantasia.
Crea quattro attività già online (con l'offerta approvata) e un cliente.
Le iscrizioni e il modulo dell'offerta del video si registrano dal vivo con altri account.
Uso: python seed_v13.py   (scrive solo su http://localhost:8001)
"""
import base64
import json
import os
import httpx

B = "http://localhost:8001/api"
D = os.path.dirname(os.path.abspath(__file__))
ADMIN_EMAIL, ADMIN_PASSWORD, MASTER = "admin@example.com", "e2e-admin-password", "e2e-master-password"  # solo test locali


def img(f):
    return "data:image/jpeg;base64," + base64.b64encode(open(os.path.join(D, "foto", f), "rb").read()).decode()


a = httpx.Client(timeout=60)
r = a.post(f"{B}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
a.headers["Authorization"] = "Bearer " + r.json()["access_token"]
a.headers["X-Admin-Master"] = a.post(f"{B}/admin/verify-master", json={"password": MASTER}).json()["token"]

SHOPS = [
    dict(email="osteria.esempio@example.com", shop="Osteria dell'Esempio", zone="Garbatella", cat="Ristorante", addr="Via dell'Esempio 1, Roma",
         offer=dict(title="Menù di pesce", description="Antipasto, primo e secondo di mare.", original_price=40, discounted_price=20,
                    validity_info="Il mercoledì e il venerdì", max_uses_per_month=1, image_url=img("menu_pesce.jpg"))),
    dict(email="forno.esempio@example.com", shop="Forno dell'Esempio", zone="Portuense", cat="Vino & Gastronomia", addr="Via dell'Esempio 2, Roma",
         offer=dict(title="Colazione per due", description="Due cornetti, due cappuccini e una fetta di crostata.", original_price=10, discounted_price=6,
                    validity_info="Dal lunedì al venerdì, 7-10", max_uses_per_month=2, image_url=img("forno.jpg"))),
    dict(email="bar.esempio@example.com", shop="Bar dell'Esempio", zone="Appio", cat="Bar & Caffè", addr="Via dell'Esempio 3, Roma",
         offer=dict(title="Caffè e cornetto", description="Caffè al banco e cornetto a scelta.", original_price=3, discounted_price=2,
                    validity_info="Tutti i giorni fino alle 11", max_uses_per_month=4, image_url=img("caffe_crop.jpg"))),
    dict(email="bottega.esempio@example.com", shop="Bottega dell'Esempio", zone="Monteverde", cat="Shopping", addr="Via dell'Esempio 4, Roma",
         offer=dict(title="Cesto di prodotti tipici", description="Pasta, olio e conserve del territorio in un cesto regalo.", original_price=30, discounted_price=22,
                    validity_info="Dal martedì al sabato", max_uses_per_month=1, image_url=img("via.jpg"))),
]
ids = {}
for s in SHOPS:
    m = httpx.Client(timeout=60)
    r = m.post(f"{B}/auth/register", json={"email": s["email"], "password": "demo-shop-2026", "name": "Luca", "role": "merchant",
               "shop_name": s["shop"], "zone": s["zone"], "category": s["cat"], "phone": "+39 06 0000000", "address": s["addr"], "legal_accepted": True})
    assert r.status_code == 200, r.text
    m.headers["Authorization"] = "Bearer " + r.json()["access_token"]
    uid = r.json()["user"]["id"]
    c = m.post(f"{B}/merchants/me/discount", json=s["offer"])
    assert c.status_code == 200, c.text
    did = c.json()["discount"]["id"]
    ok = a.post(f"{B}/admin/discounts/{did}/approve")
    print(s["shop"], s["zone"], "approvazione", ok.status_code)
    ids[s["email"]] = {"merchant": uid, "discount": did}
r = httpx.post(f"{B}/auth/register", json={"email": "cliente.demo@example.com", "password": "demo-cliente-2026", "name": "Giulia Esempio", "role": "client", "legal_accepted": True})
print("cliente", r.status_code, r.text[:120])
json.dump({"osteria": ids["osteria.esempio@example.com"]}, open(os.path.join(D, "demo_ids.json"), "w"))
