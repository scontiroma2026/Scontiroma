"""Account e offerte demo, solo per i test e lo sviluppo in locale.

Non fanno parte del server: li carica solo e2e/server_e2e.py, che rifiuta di partire
se il database non è locale. Così non possono mai comparire in produzione.
"""
import uuid
from datetime import datetime, timezone

SEED_MERCHANTS = [
    {"email": "trattoria@scontiroma.it", "name": "Marco Rossi", "shop_name": "Trattoria da Marco",
     "zone": "Garbatella", "category": "Ristorante",
     "description": "Cucina romana tradizionale nel cuore di Trastevere.",
     "address": "Via del Moro 12, Roma",
     "lat": 41.8896, "lng": 12.4681,
     "image_url": "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800",
     "discount": {"title": "Menu degustazione a metà prezzo",
                  "description": "Antipasto, primo, secondo e dolce con vino della casa.",
                  "original_price": 45.0, "discounted_price": 22.5,
                  "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
                  "terms": "Valido dal lunedì al giovedì, cena. Massimo 4 persone.", "active": True}},
    {"email": "caffe@scontiroma.it", "name": "Giulia Bianchi", "shop_name": "Caffè del Corso",
     "zone": "San Paolo", "category": "Bar & Caffè",
     "description": "Caffè storico dal 1954, torrefazione artigianale.",
     "address": "Via del Corso 88, Roma",
     "lat": 41.9028, "lng": 12.4796,
     "image_url": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",
     "discount": {"title": "Cappuccino + Cornetto a €2",
                  "description": "Colazione italiana con cappuccino e cornetto artigianale.",
                  "original_price": 4.5, "discounted_price": 2.0,
                  "image_url": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800",
                  "terms": "Valido dalle 7:00 alle 11:00 tutti i giorni.", "active": True}},
    {"email": "spa@scontiroma.it", "name": "Elena Conti", "shop_name": "Aurora SPA",
     "zone": "Marconi", "category": "Beauty & SPA",
     "description": "Centro benessere con percorso termale e massaggi.",
     "address": "Via Cola di Rienzo 200, Roma",
     "lat": 41.9086, "lng": 12.4620,
     "image_url": "https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800",
     "discount": {"title": "Massaggio 60min -50%",
                  "description": "Massaggio rilassante di 60 minuti con oli essenziali.",
                  "original_price": 80.0, "discounted_price": 40.0,
                  "image_url": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800",
                  "terms": "Su prenotazione. Un utilizzo per abbonamento.", "active": True}},
    {"email": "pizza@scontiroma.it", "name": "Luca Ferrari", "shop_name": "Pizzeria Testaccio",
     "zone": "Garbatella", "category": "Pizzeria",
     "description": "Pizza romana sottile e croccante, forno a legna.",
     "address": "Via Galvani 24, Roma",
     "lat": 41.8759, "lng": 12.4756,
     "image_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
     "discount": {"title": "Pizza + Birra a €7",
                  "description": "Una pizza a scelta con birra artigianale media.",
                  "original_price": 15.0, "discounted_price": 7.0,
                  "image_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
                  "terms": "Cena dal martedì al giovedì.", "active": True}},
    {"email": "gelato@scontiroma.it", "name": "Sofia Greco", "shop_name": "Gelateria Monti",
     "zone": "San Paolo", "category": "Gelateria",
     "description": "Gelato artigianale con ingredienti biologici a km 0.",
     "address": "Via dei Serpenti 45, Roma",
     "lat": 41.8951, "lng": 12.4905,
     "image_url": "https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=800",
     "discount": {"title": "Coppa media a €2",
                  "description": "Coppa 3 gusti a scelta con panna inclusa.",
                  "original_price": 5.5, "discounted_price": 2.0,
                  "image_url": "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=800",
                  "terms": "Tutti i giorni fino alle 20:00.", "active": True}},
    {"email": "gym@scontiroma.it", "name": "Andrea Marchetti", "shop_name": "EUR Fitness Club",
     "zone": "Marconi", "category": "Sport & Fitness",
     "description": "Palestra premium con piscina, sauna e corsi.",
     "address": "Viale Europa 100, Roma",
     "lat": 41.8330, "lng": 12.4682,
     "image_url": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800",
     "discount": {"title": "Ingresso singolo a €5",
                  "description": "Accesso libero a sala pesi, cardio e piscina.",
                  "original_price": 20.0, "discounted_price": 5.0,
                  "image_url": "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800",
                  "terms": "Lun-Ven 9-18. Un utilizzo a settimana.", "active": True}},
]


async def seed_demo(db, hash_password):
    """Crea (se mancano) un cliente demo e i commercianti demo con le loro offerte approvate."""
    # Seed a test client
    client_email = "cliente@scontiroma.it"
    if not await db.users.find_one({"email": client_email}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": client_email,
            "password_hash": hash_password("cliente123"),
            "name": "Mario Cliente",
            "role": "client",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    # Seed merchants + discounts
    for m in SEED_MERCHANTS:
        existing = await db.users.find_one({"email": m["email"]})
        if not existing:
            uid = str(uuid.uuid4())
            await db.users.insert_one({
                "id": uid,
                "email": m["email"],
                "password_hash": hash_password("merchant123"),
                "name": m["name"],
                "role": "merchant",
                "shop_name": m["shop_name"],
                "zone": m["zone"],
                "category": m["category"],
                "description": m["description"],
                "address": m["address"],
                "lat": m.get("lat"),
                "lng": m.get("lng"),
                "image_url": m["image_url"],
                "phone": "",
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
            merchant_id = uid
        else:
            # Backfill lat/lng if missing
            if m.get("lat") and not existing.get("lat"):
                await db.users.update_one({"id": existing["id"]}, {"$set": {"lat": m.get("lat"), "lng": m.get("lng")}})
            merchant_id = existing["id"]

        if not await db.discounts.find_one({"merchant_id": merchant_id}):
            d = m["discount"]
            now_iso = datetime.now(timezone.utc).isoformat()
            await db.discounts.insert_one({
                "id": str(uuid.uuid4()),
                "merchant_id": merchant_id,
                "title": d["title"],
                "description": d["description"],
                "original_price": d["original_price"],
                "discounted_price": d["discounted_price"],
                "image_url": d["image_url"],
                "terms": d["terms"],
                "active": d["active"],
                "created_at": now_iso,
                "updated_at": now_iso,
                "approval_status": "approved",
                "approved_at": now_iso,
                "locked_month": datetime.now(timezone.utc).strftime("%Y-%m"),
                "approval_note": "",
                "force_editable": False,
            })
