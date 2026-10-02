"""Avvia il server FastAPI SOLO per i test end-to-end (mai in produzione).

Cosa fa in più rispetto a `uvicorn server:app`:
- rifiuta di partire se MONGO_URL non punta a un database locale
  (localhost / 127.0.0.1) o all'emulatore in memoria: i test creano account,
  offerte e pagamenti e non devono mai scrivere nel database di produzione;
- svuota il database di test all'avvio (il nome deve iniziare con "e2e");
- imposta valori di prova per tutto ciò che non è un segreto reale
  (admin di test, segreto JWT di test, segreto webhook Stripe di test...);
- spegne email, PayPal e Gemini veri: Gemini è simulato e restituisce
  un'immagine fissa, così "Migliora foto" si prova senza chiamare Google;
- crea gli account e le offerte demo (e2e/seed_demo.py);
- aggiunge due rotte /__e2e/... usate solo dai test (leggere il token di
  reset password dal DB locale e creare una sessione di pagamento finta).

Uso:  python e2e/server_e2e.py          (porta 8001)
Senza MongoDB installato:  MONGO_URL=mongomock://localhost  (pip install mongomock-motor)
"""
import os
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
PORT = int(os.environ.get("E2E_API_PORT", "8001"))
WEB = os.environ.get("E2E_WEB_URL", "http://localhost:3000")

# ---------- Protezione: solo database locali ----------
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
_u = urlparse(MONGO_URL)
if _u.scheme == "mongomock":
    USE_MOCK = True
elif _u.scheme == "mongodb" and (_u.hostname or "") in ("localhost", "127.0.0.1", "::1"):
    USE_MOCK = False
else:
    sys.exit(f"[e2e] MONGO_URL non locale ({_u.scheme}://{_u.hostname}): rifiuto di avviare i test.")
DB_NAME = os.environ.get("DB_NAME", "e2e")
if not DB_NAME.startswith("e2e"):
    sys.exit(f"[e2e] DB_NAME deve iniziare con 'e2e' (ricevuto {DB_NAME!r}).")
STRIPE_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
if STRIPE_KEY and not STRIPE_KEY.startswith(("sk_test_", "rk_test_")):
    sys.exit("[e2e] STRIPE_SECRET_KEY non è una chiave di test: rifiuto di avviare i test.")

# ---------- Ambiente di prova (nessun segreto reale) ----------
os.environ.update({
    "MONGO_URL": MONGO_URL if not USE_MOCK else "mongodb://localhost:27017",
    "DB_NAME": DB_NAME,
    "APP_URL": WEB, "FRONTEND_URL": WEB, "CORS_ORIGINS": WEB,
    "CSRF_ORIGIN_MODE": "enforce",
    "WEBAUTHN_RP_ID": "localhost",
    # Barra finale voluta: è la configurazione che in produzione rompeva Face ID.
    "WEBAUTHN_ORIGIN": WEB + "/",
    "RESEND_API_KEY": "", "PAYPAL_CLIENT_ID": "", "PAYPAL_SECRET": "",
    "GEMINI_API_KEY": "chiave-finta-solo-test",
    # I webhook veri di Stripe non arrivano mai a localhost: i test firmano i propri.
    "STRIPE_WEBHOOK_SECRET": "whsec_e2e_solo_test",
})
for k, v in {
    "JWT_SECRET": "e2e-jwt-secret-solo-test-0123456789abcdef",
    "ADMIN_EMAIL": "admin@example.com",
    "ADMIN_PASSWORD": "e2e-admin-password",
    "ADMIN_MASTER_PASSWORD": "e2e-master-password",
    "ADMIN_RECOVERY_ID": "e2e-recovery-id",
}.items():
    os.environ.setdefault(k, v)

if USE_MOCK:
    # Emulatore MongoDB in memoria (per chi non ha MongoDB installato).
    import mongomock.collection as _mc
    import mongomock_motor
    import motor.motor_asyncio
    _orig_ci = _mc.Collection.create_index

    def _create_index(self, keys, **kw):
        if isinstance(keys, list):
            keys = [(k, 1) if isinstance(k, str) else k for k in keys]
        kw.pop("partialFilterExpression", None)
        if kw.get("unique") and isinstance(keys, list) and len(keys) > 1:
            kw.pop("unique")
        return _orig_ci(self, keys, **kw)
    _mc.Collection.create_index = _create_index
    motor.motor_asyncio.AsyncIOMotorClient = mongomock_motor.AsyncMongoMockClient
else:
    import pymongo
    pymongo.MongoClient(MONGO_URL).drop_database(DB_NAME)

# ---------- Gemini simulato ----------
import base64  # noqa: E402
from types import SimpleNamespace  # noqa: E402

import google.genai  # noqa: E402

# PNG 1x1 fucsia: è l'immagine "migliorata" restituita dal finto Gemini.
FAKE_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4/+8/AAX+Av4N70a4AAAAAElFTkSuQmCC")


class _FakeModels:
    async def generate_content(self, **_kw):
        part = SimpleNamespace(inline_data=SimpleNamespace(data=FAKE_PNG, mime_type="image/png"))
        return SimpleNamespace(candidates=[SimpleNamespace(content=SimpleNamespace(parts=[part]))])


class _FakeGeminiClient:
    def __init__(self, **_kw):
        self.aio = SimpleNamespace(models=_FakeModels())


google.genai.Client = _FakeGeminiClient

# ---------- Server + rotte solo-test ----------
sys.path.insert(0, str(ROOT / "backend"))
import uuid  # noqa: E402
from datetime import datetime, timezone  # noqa: E402

import uvicorn  # noqa: E402
from fastapi import HTTPException  # noqa: E402

import server  # noqa: E402
from seed_demo import seed_demo  # noqa: E402


@server.app.on_event("startup")
async def _e2e_seed_demo():
    """Account e offerte demo (e2e/seed_demo.py): esistono solo nel database di test."""
    await seed_demo(server.db, server.hash_password)


@server.app.get("/__e2e/reset-token")
async def _e2e_reset_token(email: str):
    """Legge dal DB locale il token di reset password (in produzione arriva solo via email)."""
    u = await server.db.users.find_one({"email": email.lower()})
    if not u or not u.get("reset_token"):
        raise HTTPException(404, "nessun token")
    return {"token": u["reset_token"]}


@server.app.post("/__e2e/stripe/sessione-finta")
async def _e2e_fake_checkout(email: str):
    """Scrive la transazione 'initiated' che /payments/checkout crea dopo aver aperto il
    checkout su Stripe: serve quando non ci sono chiavi Stripe di test in ambiente."""
    u = await server.db.users.find_one({"email": email.lower()})
    if not u:
        raise HTTPException(404, "utente non trovato")
    sid = f"cs_test_e2e_{uuid.uuid4().hex[:16]}"
    now = datetime.now(timezone.utc).isoformat()
    await server.db.payment_transactions.insert_one({
        "session_id": sid, "user_id": u["id"], "lookup_key": server.STRIPE_PRICE_LOOKUP,
        "amount": 299, "currency": "eur", "status": "initiated", "payment_status": "pending",
        "created_at": now, "updated_at": now,
    })
    return {"session_id": sid, "user_id": u["id"]}


if __name__ == "__main__":
    print(f"[e2e] server di test su http://localhost:{PORT} — db={'emulatore' if USE_MOCK else MONGO_URL}/{DB_NAME}")
    uvicorn.run(server.app, host="127.0.0.1", port=PORT, log_level="warning")
