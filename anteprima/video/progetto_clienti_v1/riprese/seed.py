"""Dati FITTIZI per le riprese del video per i clienti (v1), server locale con database in memoria (avvia_server.py).
Nomi inventati («... dell'Esempio»), email @example.com, password di prova, foto della libreria di esempio del sito
(frontend/public/esempi, licenza Unsplash, senza marchi). Nessun dato di persone reali.
Le attività hanno la zona «Altra zona di Roma e dintorni» (rientra nell'area «Fuori Roma»): nelle schede non compare
nessun quartiere né «zona pilota». Il cliente di prova serve solo per il banco; la registrazione del video
si fa dal vivo con un altro account.
Uso: python seed.py   (scrive solo su http://localhost:8001)
"""
import json
import os
import httpx

B = "http://localhost:8001/api"
D = os.path.dirname(os.path.abspath(__file__))
SITO = "http://localhost:3000"
ADMIN_EMAIL, ADMIN_PASSWORD, MASTER = "admin@example.com", "e2e-admin-password", "e2e-master-password"  # solo test locali
PIVA = "12345678903"  # Partita IVA di fantasia (cifra di controllo valida)
ZONA = "Altra zona di Roma e dintorni"


def foto(pid):
    return f"{SITO}/esempi/{pid}.jpg"


a = httpx.Client(timeout=60)
r = a.post(f"{B}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
a.headers["Authorization"] = "Bearer " + r.json()["access_token"]
a.headers["X-Admin-Master"] = a.post(f"{B}/admin/verify-master", json={"password": MASTER}).json()["token"]

SHOPS = [
    dict(email="pizzeria.esempio@example.com", shop="Pizzeria dell'Esempio", cat="Pizzeria", addr="Via dell'Esempio 1, Roma",
         retro=None,  # negozio e offerta nuovi: badge «Nuovo su Sconti Roma»
         offer=dict(title="Pizza e bibita", description="Una pizza a scelta dal menù e una bibita.", original_price=12, discounted_price=8,
                    validity_info="Dal lunedì al giovedì", max_uses_per_month=1, image_url=foto("1574071318508-1cdbab80d002"))),
    dict(email="osteria.esempio@example.com", shop="Osteria dell'Esempio", cat="Ristorante", addr="Via dell'Esempio 2, Roma",
         retro=dict(giorni_negozio=20),  # negozio già presente, offerta nuova: badge «Nuova offerta»
         offer=dict(title="Pasta fresca del giorno", description="Un primo di pasta fresca con il sugo del giorno.", original_price=14, discounted_price=9,
                    validity_info="Il mercoledì e il venerdì", max_uses_per_month=1, image_url=foto("1481931098730-318b6f776db0"))),
    dict(email="bar.esempio@example.com", shop="Bar dell'Esempio", cat="Bar & Caffè", addr="Via dell'Esempio 3, Roma",
         retro=dict(giorni_negozio=30, giorni_offerta=10),  # nessun badge
         offer=dict(title="Colazione per due", description="Due cappuccini e due cornetti.", original_price=8, discounted_price=5,
                    validity_info="Tutti i giorni fino alle 11", max_uses_per_month=2, image_url=foto("1509042239860-f550ce710b93"))),
    dict(email="frutta.esempio@example.com", shop="Frutta e verdura dell'Esempio", cat="Vino & Gastronomia", addr="Via dell'Esempio 4, Roma",
         retro=dict(giorni_negozio=30, giorni_offerta=10),
         offer=dict(title="Cassetta di frutta di stagione", description="Frutta fresca di stagione in una cassetta da due chili.", original_price=10, discounted_price=7,
                    validity_info="Dal martedì al sabato", max_uses_per_month=1, image_url=foto("1444459094717-a39f1e3e0903"))),
]
ids = {}
for s in SHOPS:
    m = httpx.Client(timeout=60)
    r = m.post(f"{B}/auth/register", json={"email": s["email"], "password": "demo-shop-2026", "name": "Luca", "role": "merchant",
               "shop_name": s["shop"], "zone": ZONA, "category": s["cat"], "phone": "+39 06 0000000", "address": s["addr"],
               "partita_iva": PIVA, "legal_accepted": True, "legal_specific_accepted": True})
    assert r.status_code == 200, r.text
    m.headers["Authorization"] = "Bearer " + r.json()["access_token"]
    uid = r.json()["user"]["id"]
    c = m.post(f"{B}/merchants/me/discount", json=s["offer"])
    assert c.status_code == 200, c.text
    did = c.json()["discount"]["id"]
    ok = a.post(f"{B}/admin/discounts/{did}/approve")
    print(s["shop"], "approvazione", ok.status_code)
    if s["retro"]:
        print("  retrodata", httpx.post("http://localhost:8001/__video/retrodata", params={"email": s["email"], **s["retro"]}).json())
    ids[s["email"]] = {"merchant": uid, "discount": did}
r = httpx.post(f"{B}/auth/register", json={"email": "cliente.demo@example.com", "password": "demo-cliente-2026", "name": "Giulia Esempio", "role": "client", "legal_accepted": True})
print("cliente", r.status_code, r.text[:80])
json.dump({"offerta": ids["pizzeria.esempio@example.com"], "tutti": ids}, open(os.path.join(D, "demo_ids.json"), "w"))
