from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import secrets
import string
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import bcrypt
import base64
import hmac as hmac_lib
import hashlib
import json as _json
import stripe
import jwt
import asyncio
import httpx
from email_service import (
    send_password_reset,
    send_merchant_approved,
    send_merchant_rejected,
    send_monthly_discounts_notification,
    send_renewal_receipt,
    send_payment_failed_immediate,
    send_grace_period_reminder,
    send_subscription_cancelled,
    send_master_reset,
)
import paypal_service
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Response, status
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from webauthn import (
    generate_registration_options, verify_registration_response,
    generate_authentication_options, verify_authentication_response,
    options_to_json,
)
from webauthn.helpers.structs import (
    AuthenticatorAttachment, AuthenticatorSelectionCriteria,
    ResidentKeyRequirement, UserVerificationRequirement,
    PublicKeyCredentialDescriptor,
)


# ---------- Setup ----------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
ACCESS_TTL_MIN = 60 * 24  # 1 day
REFRESH_TTL_DAYS = 7

# Stripe
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "sk_test_emergent")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
STRIPE_PRICE_LOOKUP = "sconti_roma_monthly_3eur"

# WebAuthn
WEBAUTHN_RP_ID = os.environ.get("WEBAUTHN_RP_ID", "localhost")
WEBAUTHN_ORIGIN = os.environ.get("WEBAUTHN_ORIGIN", "http://localhost:3000")
WEBAUTHN_RP_NAME = os.environ.get("WEBAUTHN_RP_NAME", "Sconti Roma")
CHALLENGE_TTL = timedelta(minutes=5)


def b64u(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def unb64u(s: str) -> bytes:
    pad = 4 - len(s) % 4
    return base64.urlsafe_b64decode(s + ("=" * pad if pad != 4 else ""))

app = FastAPI(title="Sconti Roma API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ---------- Constants ----------
ZONES = [
    "Centro Storico", "Trastevere", "Prati", "Testaccio", "Monti",
    "Ostiense", "EUR", "Parioli", "San Giovanni", "Trieste-Salario",
    "Pigneto", "Flaminio",
]

CATEGORIES = [
    "Ristorante", "Bar & Caffè", "Pizzeria", "Gelateria",
    "Beauty & SPA", "Sport & Fitness", "Shopping", "Cultura",
    "Vino & Gastronomia", "Servizi",
]


# ---------- Helpers ----------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_token(user_id: str, email: str, ttype: str = "access") -> str:
    if ttype == "access":
        exp = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TTL_MIN)
    else:
        exp = datetime.now(timezone.utc) + timedelta(days=REFRESH_TTL_DAYS)
    payload = {"sub": user_id, "email": email, "type": ttype, "exp": exp}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, access: str, refresh: str):
    common = dict(httponly=True, secure=True, samesite="none", path="/")
    response.set_cookie("access_token", access, max_age=ACCESS_TTL_MIN * 60, **common)
    response.set_cookie("refresh_token", refresh, max_age=REFRESH_TTL_DAYS * 86400, **common)


def sanitize_user(u: dict) -> dict:
    if not u:
        return u
    u = dict(u)
    u.pop("password_hash", None)
    u.pop("_id", None)
    return u


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(401, "Non autenticato")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(401, "Token non valido")
        user = await db.users.find_one({"id": payload["sub"]})
        if not user:
            raise HTTPException(401, "Utente non trovato")
        return sanitize_user(user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token scaduto")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Token non valido")


def require_merchant(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "merchant":
        raise HTTPException(403, "Riservato ai commercianti")
    return user


def require_client(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "client":
        raise HTTPException(403, "Riservato ai clienti")
    return user


def gen_code(n: int = 8) -> str:
    return "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(n))


async def _cancel_expired_grace(user_id: str) -> None:
    """Se l'utente ha una subscription 'past_due' con grace_expires_at già passata,
    la marca 'cancelled' definitivamente (7 giorni dal mancato pagamento senza
    retry riuscito → abbonamento decaduto per sempre).

    In più, cancella la subscription anche sul gateway (Stripe / PayPal) così il
    provider smette di riprovare il pagamento e non addebita più il cliente.
    """
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    # Prima trova le sub che stanno per essere marcate cancelled, per poter
    # chiamare l'API del gateway (dopo l'update non abbiamo più il sub_id).
    expired = await db.subscriptions.find({
        "user_id": user_id,
        "status": "past_due",
        "grace_expires_at": {"$lt": now_iso},
    }).to_list(length=None)

    if not expired:
        return

    for s in expired:
        provider = s.get("provider")
        try:
            if provider == "stripe" and s.get("stripe_subscription_id"):
                stripe.Subscription.cancel(s["stripe_subscription_id"])
                logging.info(f"[grace-expired] Stripe sub {s['stripe_subscription_id'][:12]}… cancellata via API")
            elif provider == "paypal" and s.get("paypal_subscription_id"):
                await paypal_service.cancel_subscription(
                    s["paypal_subscription_id"],
                    reason="Payment failed for 7 days — grace period expired",
                )
                logging.info(f"[grace-expired] PayPal sub {s['paypal_subscription_id'][:12]}… cancellata via API")
        except Exception as e:
            # Se la chiamata al gateway fallisce (rate limit, network, sub già cancellata
            # dal loro sistema), continuiamo comunque a cancellare in locale. Il retry
            # verrà eventualmente coperto da un webhook `customer.subscription.deleted`
            # / `BILLING.SUBSCRIPTION.CANCELLED`.
            logging.warning(f"[grace-expired] gateway cancel failed for user={user_id[:8]} sub={s.get('id','?')}: {e}")

    # Aggiorna in blocco lo stato locale (idempotente rispetto agli update già fatti)
    await db.subscriptions.update_many(
        {
            "user_id": user_id,
            "status": "past_due",
            "grace_expires_at": {"$lt": now_iso},
        },
        {"$set": {
            "status": "cancelled",
            "cancelled_at": now_iso,
            "cancel_reason": "grace_period_expired",
        }},
    )
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"subscription_status": "cancelled"}},
    )
    logging.info(f"[grace-expired] user={user_id[:8]} sub decaduta dopo 7gg senza pagamento")

    # Email #3: notifica finale di cancellazione (idempotente via flag su user)
    try:
        u = await db.users.find_one({"id": user_id})
        if u and u.get("email") and not u.get("cancellation_email_sent"):
            await send_subscription_cancelled(to=u["email"], name=u.get("name") or "")
            await db.users.update_one(
                {"id": user_id},
                {"$set": {"cancellation_email_sent": True, "cancellation_email_sent_at": now_iso}},
            )
            logging.info(f"[grace-expired] email cancellazione inviata to={u['email']}")
    except Exception as e:
        logging.error(f"[grace-expired] email send failed: {e}")


async def user_has_active_sub(user_id: str) -> bool:
    # Cleanup lazy: se la grace di 7gg è scaduta, marca la sub come cancellata
    await _cancel_expired_grace(user_id)
    now_iso = datetime.now(timezone.utc).isoformat()
    sub = await db.subscriptions.find_one({
        "user_id": user_id,
        "status": "active",
        "end_date": {"$gt": now_iso},
    })
    return sub is not None


# ---------- Pydantic Models ----------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str
    role: Literal["client", "merchant"]
    # Merchant only:
    shop_name: Optional[str] = None
    zone: Optional[str] = None
    category: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    # GDPR consents:
    legal_accepted: Optional[bool] = False
    marketing_opt_in: Optional[bool] = False
    # Tracking referral: merchant_id da cui l'iscritto proviene (QR personalizzato)
    referred_by: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class DiscountIn(BaseModel):
    title: str
    description: str
    original_price: float
    discounted_price: float
    image_url: Optional[str] = None
    # Galleria fino a 8 foto. La prima è la copertina (usata come thumbnail nelle liste).
    image_urls: Optional[List[str]] = None
    terms: Optional[str] = ""
    active: bool = True
    # Numero massimo di volte che uno stesso abbonato può usare lo sconto nel mese in corso.
    # Default 1. Massimo 10 per prevenire abusi.
    max_uses_per_month: int = Field(default=1, ge=1, le=10)

    def cleaned(self) -> dict:
        d = self.model_dump()
        for k in ("title", "description", "image_url", "terms"):
            if isinstance(d.get(k), str):
                d[k] = d[k].strip()
        # Normalizza image_urls: max 8, filtra vuoti
        urls = d.get("image_urls") or []
        if not isinstance(urls, list):
            urls = []
        urls = [u.strip() for u in urls if isinstance(u, str) and u.strip()][:8]
        d["image_urls"] = urls
        # Se image_url mancante ma image_urls presente, usa la prima come copertina
        if not d.get("image_url") and urls:
            d["image_url"] = urls[0]
        # Se image_url c'è ma non è in image_urls, mettilo in cima
        elif d.get("image_url") and d["image_url"] not in urls:
            d["image_urls"] = [d["image_url"], *urls][:8]
        return d


class MerchantProfileIn(BaseModel):
    shop_name: Optional[str] = None
    description: Optional[str] = None
    zone: Optional[str] = None
    category: Optional[str] = None
    address: Optional[str] = None
    image_url: Optional[str] = None
    phone: Optional[str] = None


class SubscribeIn(BaseModel):
    plan: Literal["monthly"] = "monthly"
    # mock payment - we accept any card info
    card_last4: Optional[str] = "4242"


class StripeCheckoutIn(BaseModel):
    origin_url: str


class RedeemVerifyIn(BaseModel):
    code: str  # Accepts plain "ABC123" or rotating "ABC123|slot|hmac"


ROTATION_WINDOW_SEC = 20


def _rotating_hmac(code: str, slot: int) -> str:
    msg = f"{code}:{slot}".encode()
    return hmac_lib.new(JWT_SECRET.encode(), msg, hashlib.sha256).hexdigest()[:12]


def current_slot() -> int:
    return int(datetime.now(timezone.utc).timestamp()) // ROTATION_WINDOW_SEC


def parse_rotating_code(raw: str):
    """Return (code, slot, token). Accepts formats:
    - plain 'ABC123'
    - 'CODE|slot|hmac'  (legacy)
    - 'CODE.slot.hmac'  (URL-safe)
    - full URL '.../qr/CODE.slot.hmac' or '.../qr/CODE|slot|hmac'
    """
    raw = raw.strip()
    if "/qr/" in raw:
        raw = raw.rsplit("/qr/", 1)[-1]
    for sep in (".", "|"):
        parts = raw.split(sep)
        if len(parts) == 3:
            try:
                return parts[0].upper(), int(parts[1]), parts[2]
            except ValueError:
                continue
    return raw.upper(), None, None


def current_month_key() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


# ---------- Auth Routes ----------
@api.post("/auth/register")
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email già registrata")

    user_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    # Verifica referral merchant_id (se presente)
    referral_ok = False
    if payload.role == "client" and payload.referred_by:
        ref_merchant = await db.users.find_one({"id": payload.referred_by, "role": "merchant"})
        referral_ok = bool(ref_merchant)

    doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(payload.password),
        "name": (payload.name or "").strip(),
        "role": payload.role,
        "created_at": now_iso,
        # GDPR consent snapshot (art. 7 GDPR — proof of consent)
        "consents": {
            "legal_accepted": bool(payload.legal_accepted),
            "legal_accepted_at": now_iso if payload.legal_accepted else None,
            "marketing_opt_in": bool(payload.marketing_opt_in),
            "marketing_opt_in_at": now_iso if payload.marketing_opt_in else None,
        },
    }
    if referral_ok:
        doc["referred_by"] = payload.referred_by
        doc["referred_at"] = now_iso
    if payload.role == "merchant":
        phone = (payload.phone or "").strip()
        if not phone:
            raise HTTPException(422, "Il numero di telefono è obbligatorio per i commercianti")
        doc.update({
            "shop_name": (payload.shop_name or payload.name or "").strip() or "Negozio",
            "zone": (payload.zone or "Centro Storico").strip(),
            "category": (payload.category or "Ristorante").strip(),
            "description": "",
            "address": (payload.address or "").strip(),
            "image_url": "",
            "phone": phone,
        })
    await db.users.insert_one(doc)

    # Geocoding fire-and-forget per il merchant (Nominatim può essere lento, non blocchiamo)
    if payload.role == "merchant" and doc.get("address"):
        asyncio.create_task(geocode_and_save_merchant(user_id, doc["address"]))

    access = create_token(user_id, email, "access")
    refresh = create_token(user_id, email, "refresh")
    set_auth_cookies(response, access, refresh)
    return {"user": sanitize_user(doc), "access_token": access}


@api.post("/auth/login")
async def login(payload: LoginIn, response: Response):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(401, "Credenziali non valide")

    access = create_token(user["id"], user["email"], "access")
    refresh = create_token(user["id"], user["email"], "refresh")
    set_auth_cookies(response, access, refresh)
    return {"user": sanitize_user(user), "access_token": access}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    # Aggiunge flag abbonamento attivo (usato dal frontend per mostrare il contatore
    # vendite del mese sulle card).
    has_sub = False
    if user.get("role") == "client":
        has_sub = await db.subscriptions.count_documents({
            "user_id": user["id"], "status": "active",
        }) > 0
    return {"user": {**user, "has_active_subscription": has_sub}}


# ---------- PIN & WebAuthn ----------
class PinIn(BaseModel):
    pin: str = Field(min_length=6, max_length=6)


class PinLoginIn(BaseModel):
    email: EmailStr
    pin: str = Field(min_length=6, max_length=6)


class WebAuthnCompleteIn(BaseModel):
    credential: dict


class WebAuthnLoginBeginIn(BaseModel):
    email: EmailStr


class ForgotIn(BaseModel):
    email: EmailStr


class ResetIn(BaseModel):
    token: str
    new_password: str = Field(min_length=6)


@api.post("/auth/pin")
async def set_pin(payload: PinIn, user: dict = Depends(get_current_user)):
    if not payload.pin.isdigit():
        raise HTTPException(422, "Il PIN deve essere di 6 cifre")
    await db.users.update_one({"id": user["id"]}, {"$set": {"pin_hash": hash_password(payload.pin), "pin_set": True}})
    return {"ok": True}


@api.post("/auth/pin-login")
async def pin_login(payload: PinLoginIn, response: Response):
    if not payload.pin.isdigit():
        raise HTTPException(422, "PIN non valido")
    email = payload.email.lower().strip()
    u = await db.users.find_one({"email": email})
    if not u or not u.get("pin_hash") or not verify_password(payload.pin, u["pin_hash"]):
        raise HTTPException(401, "Credenziali non valide")
    access = create_token(u["id"], u["email"], "access")
    refresh = create_token(u["id"], u["email"], "refresh")
    set_auth_cookies(response, access, refresh)
    return {"user": sanitize_user(u), "access_token": access}


# ---------- PIN forgot / reset (OTP via email) ----------
class PinForgotIn(BaseModel):
    email: EmailStr

class PinResetIn(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)
    new_pin: str = Field(min_length=6, max_length=6)


@api.post("/auth/pin-forgot")
async def pin_forgot(payload: PinForgotIn):
    email = payload.email.lower().strip()
    u = await db.users.find_one({"email": email})
    if u:
        code = f"{secrets.randbelow(1_000_000):06d}"
        expires = datetime.now(timezone.utc) + timedelta(minutes=10)
        await db.users.update_one({"id": u["id"]}, {"$set": {
            "pin_reset_code_hash": hash_password(code),
            "pin_reset_expires": expires.isoformat(),
        }})
        try:
            from email_service import send_pin_reset_code
            await send_pin_reset_code(u["email"], u.get("name") or "utente", code)
        except Exception as e:
            logging.warning(f"pin_forgot email failed: {e}")
    return {"ok": True, "message": "Se l'email è registrata, riceverai un codice a 6 cifre entro pochi secondi."}


@api.post("/auth/pin-reset")
async def pin_reset(payload: PinResetIn):
    if not payload.code.isdigit() or not payload.new_pin.isdigit():
        raise HTTPException(422, "Codice o PIN non valido")
    email = payload.email.lower().strip()
    u = await db.users.find_one({"email": email})
    if not u or not u.get("pin_reset_code_hash"):
        raise HTTPException(400, "Nessuna richiesta di reset attiva. Ripeti la procedura.")
    try:
        exp = datetime.fromisoformat(u.get("pin_reset_expires"))
    except Exception:
        exp = datetime.now(timezone.utc) - timedelta(seconds=1)
    if exp < datetime.now(timezone.utc):
        raise HTTPException(400, "Codice scaduto, richiedine uno nuovo.")
    if not verify_password(payload.code, u["pin_reset_code_hash"]):
        raise HTTPException(401, "Codice non valido.")
    await db.users.update_one({"id": u["id"]}, {
        "$set": {"pin_hash": hash_password(payload.new_pin), "pin_set": True},
        "$unset": {"pin_reset_code_hash": "", "pin_reset_expires": ""},
    })
    return {"ok": True, "message": "PIN aggiornato. Ora puoi accedere."}


@api.post("/webauthn/register/begin")
async def webauthn_register_begin(user: dict = Depends(get_current_user)):
    u = await db.users.find_one({"id": user["id"]})
    if u.get("webauthn_user_id"):
        wid = unb64u(u["webauthn_user_id"])
    else:
        wid = secrets.token_bytes(32)
        await db.users.update_one({"id": u["id"]}, {"$set": {"webauthn_user_id": b64u(wid)}})
    exclude = [PublicKeyCredentialDescriptor(id=unb64u(c["credential_id"]))
               for c in u.get("webauthn_credentials", [])]
    options = generate_registration_options(
        rp_id=WEBAUTHN_RP_ID, rp_name=WEBAUTHN_RP_NAME,
        user_id=wid, user_name=u["email"], user_display_name=u.get("name") or u["email"],
        exclude_credentials=exclude,
        authenticator_selection=AuthenticatorSelectionCriteria(
            authenticator_attachment=AuthenticatorAttachment.PLATFORM,
            resident_key=ResidentKeyRequirement.PREFERRED,
            user_verification=UserVerificationRequirement.PREFERRED,
        ),
    )
    await db.webauthn_challenges.insert_one({
        "user_id": u["id"], "kind": "register", "challenge": b64u(options.challenge),
        "expires_at": datetime.now(timezone.utc) + CHALLENGE_TTL,
    })
    return _json.loads(options_to_json(options))


@api.post("/webauthn/register/complete")
async def webauthn_register_complete(payload: WebAuthnCompleteIn, user: dict = Depends(get_current_user)):
    ch = await db.webauthn_challenges.find_one_and_delete({
        "user_id": user["id"], "kind": "register",
        "expires_at": {"$gt": datetime.now(timezone.utc)},
    })
    if not ch:
        raise HTTPException(400, "Sessione scaduta, riprova")
    try:
        v = verify_registration_response(
            credential=payload.credential,
            expected_challenge=unb64u(ch["challenge"]),
            expected_rp_id=WEBAUTHN_RP_ID,
            expected_origin=WEBAUTHN_ORIGIN,
            require_user_verification=False,
        )
    except Exception as exc:
        raise HTTPException(400, f"Registrazione biometrica fallita: {exc}")
    transports = payload.credential.get("response", {}).get("transports", [])
    record = {
        "credential_id": b64u(v.credential_id),
        "public_key": b64u(v.credential_public_key),
        "sign_count": v.sign_count,
        "transports": transports,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.update_one({"id": user["id"]}, {"$push": {"webauthn_credentials": record}, "$set": {"biometric_enabled": True}})
    return {"ok": True}


@api.post("/webauthn/login/begin")
async def webauthn_login_begin(payload: WebAuthnLoginBeginIn):
    email = payload.email.lower().strip()
    u = await db.users.find_one({"email": email})
    if not u or not u.get("webauthn_credentials"):
        raise HTTPException(400, "Nessun dispositivo biometrico registrato")
    allow = [PublicKeyCredentialDescriptor(
        id=unb64u(c["credential_id"]), transports=c.get("transports") or None)
        for c in u["webauthn_credentials"]]
    options = generate_authentication_options(
        rp_id=WEBAUTHN_RP_ID, allow_credentials=allow,
        user_verification=UserVerificationRequirement.PREFERRED,
    )
    await db.webauthn_challenges.insert_one({
        "user_id": u["id"], "kind": "login", "challenge": b64u(options.challenge),
        "expires_at": datetime.now(timezone.utc) + CHALLENGE_TTL,
    })
    return _json.loads(options_to_json(options))


@api.post("/webauthn/login/complete")
async def webauthn_login_complete(payload: WebAuthnCompleteIn, response: Response):
    cid = payload.credential.get("id")
    if not cid:
        raise HTTPException(400, "Credenziale non valida")
    u = await db.users.find_one({"webauthn_credentials.credential_id": cid})
    if not u:
        raise HTTPException(401, "Autenticazione fallita")
    ch = await db.webauthn_challenges.find_one_and_delete({
        "user_id": u["id"], "kind": "login",
        "expires_at": {"$gt": datetime.now(timezone.utc)},
    })
    if not ch:
        raise HTTPException(401, "Sessione scaduta, riprova")
    cred = next(c for c in u["webauthn_credentials"] if c["credential_id"] == cid)
    try:
        v = verify_authentication_response(
            credential=payload.credential,
            expected_challenge=unb64u(ch["challenge"]),
            expected_rp_id=WEBAUTHN_RP_ID,
            expected_origin=WEBAUTHN_ORIGIN,
            credential_public_key=unb64u(cred["public_key"]),
            credential_current_sign_count=cred.get("sign_count", 0),
            require_user_verification=False,
        )
    except Exception:
        raise HTTPException(401, "Autenticazione fallita")
    await db.users.update_one(
        {"id": u["id"], "webauthn_credentials.credential_id": cid},
        {"$set": {"webauthn_credentials.$.sign_count": v.new_sign_count}},
    )
    access = create_token(u["id"], u["email"], "access")
    refresh = create_token(u["id"], u["email"], "refresh")
    set_auth_cookies(response, access, refresh)
    return {"user": sanitize_user(u), "access_token": access}


# ---------- Password recovery ----------
GENERIC_RESET_MSG = "Se l'email è registrata, riceverai a breve un link per reimpostare la password."


@api.post("/auth/forgot")
async def forgot_password(payload: ForgotIn):
    email = payload.email.lower().strip()
    u = await db.users.find_one({"email": email})
    # Risposta identica sia se l'utente esiste sia se no (anti-enumeration).
    # Il token viene SOLO inviato per email tramite Resend, MAI restituito nella response.
    if u:
        token = secrets.token_urlsafe(32)
        expires = datetime.now(timezone.utc) + timedelta(hours=1)
        await db.users.update_one({"id": u["id"]}, {"$set": {
            "reset_token": token, "reset_expires": expires.isoformat(),
        }})
        try:
            await send_password_reset(u["email"], u.get("name") or "utente", token)
        except Exception as e:
            logging.warning(f"forgot-password email send failed: {e}")
    return {"ok": True, "message": GENERIC_RESET_MSG}


@api.post("/auth/reset")
async def reset_password(payload: ResetIn):
    u = await db.users.find_one({"reset_token": payload.token})
    if not u:
        raise HTTPException(400, "Codice non valido")
    try:
        exp = datetime.fromisoformat(u.get("reset_expires", ""))
        if exp < datetime.now(timezone.utc):
            raise HTTPException(400, "Codice scaduto")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(400, "Codice non valido")
    await db.users.update_one({"id": u["id"]}, {
        "$set": {"password_hash": hash_password(payload.new_password)},
        "$unset": {"reset_token": "", "reset_expires": ""},
    })
    return {"ok": True, "email": u["email"]}


# ---------- Meta ----------
@api.get("/zones")
async def zones():
    return {"zones": ZONES}


@api.get("/categories")
async def categories():
    return {"categories": CATEGORIES}


@api.get("/default-images")
async def default_images():
    """Return the curated 100-image library grouped by 10 categories."""
    from default_images import DEFAULT_IMAGE_LIBRARY
    return {"library": DEFAULT_IMAGE_LIBRARY}


# ---------- Discounts ----------
async def enrich_discount(d: dict) -> dict:
    d = {k: v for k, v in d.items() if k != "_id"}
    merchant = await db.users.find_one({"id": d.get("merchant_id")})
    if merchant:
        d["merchant"] = {
            "id": merchant["id"],
            "shop_name": merchant.get("shop_name") or merchant.get("name"),
            "zone": merchant.get("zone"),
            "category": merchant.get("category"),
            "address": merchant.get("address", ""),
            "image_url": merchant.get("image_url", ""),
            "description": merchant.get("description", ""),
            "lat": merchant.get("lat"),
            "lng": merchant.get("lng"),
            "phone": merchant.get("phone", ""),
        }
    if d.get("original_price") and d.get("discounted_price") is not None:
        try:
            saving = d["original_price"] - d["discounted_price"]
            d["percent_off"] = round((saving / d["original_price"]) * 100)
        except Exception:
            d["percent_off"] = 0
    # Contatore mensile scansioni (redemption) — visibile agli abbonati sul card
    try:
        month_start_iso = _month_start_iso()
        d["sales_this_month"] = await db.redemptions.count_documents({
            "discount_id": d.get("id"),
            "status": "redeemed",
            "redeemed_at": {"$gte": month_start_iso},
        })
    except Exception:
        d["sales_this_month"] = 0
    # Include approval + lock info for merchant/admin views
    d.setdefault("approval_status", "approved")
    d.setdefault("locked_month", None)
    d.setdefault("approval_note", "")
    d.setdefault("force_editable", False)
    d.setdefault("max_uses_per_month", 1)
    # Galleria foto (max 8) — se mancante, fallback al singolo image_url
    if not isinstance(d.get("image_urls"), list) or not d.get("image_urls"):
        d["image_urls"] = [d["image_url"]] if d.get("image_url") else []
    d["locked_this_month"] = (d.get("approval_status") == "approved"
                              and d.get("locked_month") == current_month_key()
                              and not d.get("force_editable", False))
    return d


def _month_start_iso() -> str:
    now = datetime.now(timezone.utc)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()


# ---------- Geocoding via Nominatim (OpenStreetMap, gratuito) ----------
# Rate limit: max 1 req/sec per policy Nominatim. Usa User-Agent identificativo.
_geocode_cache: dict = {}

async def geocode_address(address: str) -> Optional[dict]:
    """Trasforma un indirizzo stringa in {lat, lng} via Nominatim.
    Ritorna None se non trovato o errore. Cache in-memory per evitare hit ripetuti."""
    if not address or not isinstance(address, str) or len(address.strip()) < 4:
        return None
    key = address.strip().lower()
    if key in _geocode_cache:
        return _geocode_cache[key]
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={
                    "q": address,
                    "format": "json",
                    "limit": 1,
                    "countrycodes": "it",
                    "addressdetails": 0,
                },
                headers={"User-Agent": "ScontiRoma/1.0 (info@scontiroma.it)"},
            )
        if r.status_code != 200:
            return None
        data = r.json()
        if not data:
            _geocode_cache[key] = None
            return None
        result = {"lat": float(data[0]["lat"]), "lng": float(data[0]["lon"])}
        _geocode_cache[key] = result
        return result
    except Exception as e:
        logging.warning(f"[geocode] failed for '{address[:50]}': {e}")
        return None



_geocode_suggest_cache: dict = {}


async def geocode_suggest(query: str, limit: int = 5) -> list:
    """Autocomplete indirizzi via Nominatim, focalizzato su Roma.

    Nominatim ritorna suggerimenti CON numero civico SOLO se l'utente ha già
    digitato un numero nella query (es. "Via del Corso 100"). Quando il numero
    manca, tornano match street-level (senza civico). Per aiutare l'utente:
      - `bounded=1` + `viewbox` di Roma → filtra risultati fuori città (più veloce e pertinente)
      - `limit` maggiorato → più candidati per il filtro
      - ordinamento: le suggerimenti CON house_number vengono per prime
    """
    q = (query or "").strip()
    if len(q) < 3:
        return []
    key = f"{q.lower()}::{limit}"
    if key in _geocode_suggest_cache:
        return _geocode_suggest_cache[key]
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={
                    "q": q,
                    "format": "json",
                    "limit": max(limit * 2, 10),  # più candidati per il riordino
                    "countrycodes": "it",
                    "addressdetails": 1,
                    # Bounding box di Roma (SW→NE) per privilegiare match locali
                    "viewbox": "12.234,41.649,12.855,42.141",
                    "bounded": 1,
                },
                headers={"User-Agent": "ScontiRoma/1.0 (info@scontiroma.it)"},
            )
        if r.status_code != 200:
            return []
        raw = r.json() or []
        out = []
        for item in raw:
            addr = item.get("address") or {}
            road = addr.get("road") or addr.get("pedestrian") or addr.get("footway") or ""
            house = addr.get("house_number") or ""
            postcode = addr.get("postcode") or ""
            city = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("suburb") or ""
            street = f"{road} {house}".strip() if road else ""
            parts = [p for p in [street, f"{postcode} {city}".strip()] if p]
            display = ", ".join(parts) if parts else (item.get("display_name") or "")[:120]
            out.append({
                "display": display,
                "full_display_name": item.get("display_name"),
                "lat": float(item["lat"]),
                "lng": float(item["lon"]),
                "road": road,
                "house_number": house,
                "postcode": postcode,
                "city": city,
                "has_house_number": bool(house),
            })
        # Ordina: prima quelli col civico, poi gli altri (mantenendo l'ordine originale interno)
        out.sort(key=lambda s: 0 if s["has_house_number"] else 1)
        # Deduplica per display finale
        seen = set()
        deduped = []
        for s in out:
            key_disp = s["display"].lower()
            if key_disp in seen:
                continue
            seen.add(key_disp)
            deduped.append(s)
        out = deduped[:limit]
        _geocode_suggest_cache[key] = out
        return out
    except Exception as e:
        logging.warning(f"[geocode_suggest] failed for '{q[:40]}': {e}")
        return []


async def geocode_and_save_merchant(user_id: str, address: str) -> None:
    """Fire-and-forget: geocodifica l'indirizzo del merchant e salva lat/lng.
    Non blocca il flusso di registrazione/update se Nominatim è lento.
    Se il geocoding fallisce, marca il merchant con `geocode_failed=true` per
    consentire all'admin di correggere manualmente l'indirizzo."""
    coords = await geocode_address(address)
    now_iso = datetime.now(timezone.utc).isoformat()
    if coords:
        await db.users.update_one(
            {"id": user_id},
            {"$set": {
                "lat": coords["lat"],
                "lng": coords["lng"],
                "geocoded_at": now_iso,
            }, "$unset": {"geocode_failed": "", "geocode_failed_at": "", "geocode_failed_address": ""}},
        )
        logging.info(f"[geocode] merchant {user_id[:8]} → {coords}")
    else:
        await db.users.update_one(
            {"id": user_id},
            {"$set": {
                "geocode_failed": True,
                "geocode_failed_at": now_iso,
                "geocode_failed_address": address,
            }},
        )
        logging.warning(f"[geocode] FAILED merchant {user_id[:8]} address='{address[:60]}'")


@api.get("/merchants/top")
async def top_merchants(limit: int = 3):
    """Top N commercianti per numero di scansioni riuscite (redemption) del mese corrente."""
    limit = max(1, min(limit, 20))
    month_start = _month_start_iso()
    pipeline = [
        {"$match": {"status": "redeemed", "redeemed_at": {"$gte": month_start}}},
        {"$group": {"_id": "$merchant_id", "sales": {"$sum": 1}}},
        {"$sort": {"sales": -1}},
        {"$limit": limit},
    ]
    top = await db.redemptions.aggregate(pipeline).to_list(limit)
    out = []
    for row in top:
        mid = row["_id"]
        if not mid:
            continue
        m = await db.users.find_one({"id": mid, "role": "merchant"})
        if not m:
            continue
        # Sconto attivo attuale del merchant
        d = await db.discounts.find_one({
            "merchant_id": mid, "active": True, "approval_status": "approved",
        })
        if not d:
            continue
        item = await enrich_discount(d)
        item["sales_this_month"] = row["sales"]
        out.append(item)
    return {"merchants": out}


@api.get("/discounts")
async def list_discounts(zone: Optional[str] = None, category: Optional[str] = None, q: Optional[str] = None):
    # Only APPROVED + active discounts visible publicly
    docs = await db.discounts.find({"active": True, "approval_status": "approved"}).to_list(500)
    out = []
    for d in docs:
        item = await enrich_discount(d)
        m = item.get("merchant")
        if not m:
            continue
        if zone and m.get("zone") != zone:
            continue
        if category and m.get("category") != category:
            continue
        if q:
            hay = f"{item.get('title','')} {item.get('description','')} {m.get('shop_name','')}".lower()
            if q.lower() not in hay:
                continue
        out.append(item)
    out.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return {"discounts": out}


@api.get("/discounts/{discount_id}")
async def get_discount(discount_id: str):
    d = await db.discounts.find_one({"id": discount_id})
    if not d:
        raise HTTPException(404, "Sconto non trovato")
    return {"discount": await enrich_discount(d)}


# ---------- Merchant Routes ----------
@api.get("/merchants/me/discount")
async def merchant_get_discount(user: dict = Depends(require_merchant)):
    d = await db.discounts.find_one({"merchant_id": user["id"]})
    if not d:
        return {"discount": None}
    return {"discount": await enrich_discount(d)}


@api.post("/merchants/me/discount")
async def merchant_upsert_discount(payload: DiscountIn, user: dict = Depends(require_merchant)):
    existing = await db.discounts.find_one({"merchant_id": user["id"]})
    now_iso = datetime.now(timezone.utc).isoformat()
    month_key = current_month_key()
    if existing:
        # Locked if approved this month unless admin override flag set
        if (existing.get("approval_status") == "approved"
                and existing.get("locked_month") == month_key
                and not existing.get("force_editable", False)):
            raise HTTPException(423, "Offerta attiva per questo mese. Potrai inserire o modificare la nuova offerta a partire dal 1° del mese prossimo.")
        data = payload.cleaned()
        if not data.get("title") or not data.get("description"):
            raise HTTPException(422, "Titolo e descrizione sono obbligatori")
        data["updated_at"] = now_iso
        data["approval_status"] = "pending"
        data["approval_note"] = ""
        data["locked_month"] = None
        data["approved_at"] = None
        data["force_editable"] = False
        await db.discounts.update_one({"id": existing["id"]}, {"$set": data})
        d = await db.discounts.find_one({"id": existing["id"]})
    else:
        did = str(uuid.uuid4())
        doc = payload.cleaned()
        if not doc.get("title") or not doc.get("description"):
            raise HTTPException(422, "Titolo e descrizione sono obbligatori")
        doc.update({
            "id": did,
            "merchant_id": user["id"],
            "created_at": now_iso,
            "updated_at": now_iso,
            "approval_status": "pending",
            "approval_note": "",
            "locked_month": None,
            "approved_at": None,
            "force_editable": False,
        })
        await db.discounts.insert_one(doc)
        d = doc
    return {"discount": await enrich_discount(d)}


@api.put("/merchants/me/profile")
async def merchant_update_profile(payload: MerchantProfileIn, user: dict = Depends(require_merchant)):
    updates = {}
    for k, v in payload.model_dump().items():
        if v is None:
            continue
        updates[k] = v.strip() if isinstance(v, str) else v
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
        # Se l'indirizzo è cambiato, re-geocodifica in background
        if updates.get("address") and updates["address"] != user.get("address"):
            asyncio.create_task(geocode_and_save_merchant(user["id"], updates["address"]))
    u = await db.users.find_one({"id": user["id"]})
    return {"user": sanitize_user(u)}


@api.get("/merchants/me/stats")
async def merchant_stats(user: dict = Depends(require_merchant)):
    total = await db.redemptions.count_documents({"merchant_id": user["id"]})
    redeemed = await db.redemptions.count_documents({"merchant_id": user["id"], "status": "redeemed"})
    pending = total - redeemed
    return {"total": total, "redeemed": redeemed, "pending": pending}


@api.get("/merchants/me/referrals")
async def merchant_referrals(user: dict = Depends(require_merchant)):
    """Ritorna solo il link e la locandina personalizzati del commerciante.
    Le statistiche di attribuzione (chi si è iscritto tramite questo QR) sono
    riservate all'admin: vedi `/api/admin/referrals-by-merchant`.
    """
    # Priorità: FRONTEND_URL (canonical, aggiornato in .env) → APP_URL (fallback legacy).
    app_url = (os.environ.get("FRONTEND_URL") or os.environ.get("APP_URL") or "").rstrip("/")
    return {
        "merchant_id": user["id"],
        "shop_name": user.get("shop_name"),
        "referral_url": f"{app_url}/register?ref={user['id']}",
        "flyer_url": f"{app_url}/locandina?ref={user['id']}",
    }




@api.get("/merchants/me/redemptions")
async def merchant_redemptions(user: dict = Depends(require_merchant)):
    docs = await db.redemptions.find({"merchant_id": user["id"]}).sort("created_at", -1).to_list(200)
    out = []
    for d in docs:
        d = {k: v for k, v in d.items() if k != "_id"}
        cu = await db.users.find_one({"id": d.get("user_id")})
        d["client_name"] = cu.get("name") if cu else "Utente"
        out.append(d)
    return {"redemptions": out}


# ---------- Subscription ----------
@api.get("/subscription/me")
async def my_subscription(user: dict = Depends(get_current_user)):
    # Lazy cleanup: se la grace di 7gg è scaduta, marca past_due → cancelled
    await _cancel_expired_grace(user["id"])
    now_iso = datetime.now(timezone.utc).isoformat()
    sub = await db.subscriptions.find_one({"user_id": user["id"], "status": "active"})
    if sub:
        sub = {k: v for k, v in sub.items() if k != "_id"}
        return {"subscription": sub, "active": True, "past_due": False}
    # Nessuna sub attiva: controlla se c'è una past_due ancora nella finestra di 7gg
    # (utente sospeso ma può ancora salvare l'abbonamento pagando entro grace_expires_at).
    past = await db.subscriptions.find_one(
        {"user_id": user["id"], "status": "past_due", "grace_expires_at": {"$gt": now_iso}},
        sort=[("payment_failed_at", -1)],
    )
    if past:
        past = {k: v for k, v in past.items() if k != "_id"}
        return {"subscription": past, "active": False, "past_due": True,
                "grace_expires_at": past.get("grace_expires_at")}
    return {"subscription": None, "active": False, "past_due": False}


@api.post("/subscription/subscribe")
async def subscribe(payload: SubscribeIn, user: dict = Depends(require_client)):
    # Mock payment: always succeeds
    now = datetime.now(timezone.utc)
    end = now + timedelta(days=30)
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "plan": payload.plan,
        "status": "active",
        "price_eur": 2.99,
        "start_date": now.isoformat(),
        "end_date": end.isoformat(),
        "card_last4": payload.card_last4 or "4242",
        "mock_payment_id": f"mock_{uuid.uuid4().hex[:12]}",
    }
    # Deactivate any previous active sub
    await db.subscriptions.update_many(
        {"user_id": user["id"], "status": "active"},
        {"$set": {"status": "replaced"}}
    )
    await db.subscriptions.insert_one(doc)
    return {"subscription": {k: v for k, v in doc.items() if k != "_id"}}


class CancelSubIn(BaseModel):
    reason: Optional[str] = None
    feedback: Optional[str] = None


@api.post("/subscription/cancel")
async def cancel_sub(payload: Optional[CancelSubIn] = None, user: dict = Depends(require_client)):
    reason = (payload.reason if payload else None) or "user_requested"
    feedback = (payload.feedback if payload else None) or ""
    now_iso = datetime.now(timezone.utc).isoformat()
    # Cancel on Stripe first (for stripe-provider subs), then update DB
    active_subs = await db.subscriptions.find(
        {"user_id": user["id"], "status": "active"}
    ).to_list(length=None)
    for s in active_subs:
        sid = s.get("stripe_subscription_id")
        if s.get("provider") == "stripe" and sid:
            try:
                stripe.Subscription.cancel(sid)
            except Exception as e:
                logging.warning(f"Stripe cancel failed for {sid}: {e}")
        elif s.get("provider") == "paypal" and s.get("paypal_subscription_id"):
            try:
                await paypal_service.cancel_subscription(s["paypal_subscription_id"], "User requested cancel")
            except Exception as e:
                logging.warning(f"PayPal cancel failed for {s['paypal_subscription_id']}: {e}")
    await db.subscriptions.update_many(
        {"user_id": user["id"], "status": "active"},
        {"$set": {
            "status": "cancelled",
            "cancelled_at": now_iso,
            "cancelled_reason": reason,
            "cancelled_feedback": feedback,
        }}
    )
    return {"ok": True, "cancelled_at": now_iso, "reason": reason}


# ---------- Stripe Checkout (subscription €3/month) ----------
async def get_or_create_stripe_customer(user: dict) -> str:
    """Return the Stripe customer id for the given user, creating & storing it if needed."""
    cid = user.get("stripe_customer_id")
    if cid:
        try:
            c = stripe.Customer.retrieve(cid)
            if not getattr(c, "deleted", False):
                return cid
        except Exception:
            pass
    # Create a new dedicated customer for this user. We deliberately omit `email` so that
    # Stripe Link does NOT auto-attach on Checkout (which triggers the "Confirm it's you"
    # OTP loop and blocks users who cancelled and want to resubscribe).
    c = stripe.Customer.create(
        name=user.get("name") or None,
        description=user["email"],
        metadata={"user_id": user["id"], "app_email": user["email"]},
    )
    await db.users.update_one({"id": user["id"]}, {"$set": {"stripe_customer_id": c.id}})
    return c.id


@api.post("/payments/checkout")
async def create_checkout(payload: StripeCheckoutIn, user: dict = Depends(require_client)):
    prices = stripe.Price.list(lookup_keys=[STRIPE_PRICE_LOOKUP], active=True, limit=1).data
    if not prices:
        raise HTTPException(500, "Prezzo non configurato")
    price = prices[0]
    customer_id = await get_or_create_stripe_customer(user)
    common_kwargs = dict(
        line_items=[{"price": price.id, "quantity": 1}],
        mode="subscription",
        success_url=f"{payload.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{payload.origin_url}/payment/cancel",
        customer=customer_id,
        # Force plain card to avoid Stripe Link auth loop (OTP "Confirm it's you")
        payment_method_types=["card"],
        metadata={"user_id": user["id"], "lookup_key": STRIPE_PRICE_LOOKUP},
    )
    try:
        # Explicit payment_method_types=['card'] disables Link auth ("Confirm it's you" loop)
        session = stripe.checkout.Session.create(**common_kwargs)
    except stripe.error.InvalidRequestError as e:
        raise HTTPException(500, f"Stripe error: {e}")

    await db.payment_transactions.insert_one({
        "session_id": session.id,
        "user_id": user["id"],
        "lookup_key": STRIPE_PRICE_LOOKUP,
        "amount": 300, "currency": "eur",
        "status": "initiated", "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"checkout_url": session.url, "session_id": session.id}


async def suspend_subscription_on_payment_failed(
    *,
    user_id: str,
    provider: str,
    provider_event_id: str,
    provider_sub_id: str,
) -> None:
    """Sospende IMMEDIATAMENTE l'abbonamento quando arriva un evento di pagamento
    fallito dai gateway (Stripe `invoice.payment_failed`, PayPal `PAYMENT.SALE.DENIED`
    o `BILLING.SUBSCRIPTION.PAYMENT.FAILED`).

    Regole:
      - status → 'past_due', end_date → now (l'utente non può più riscattare sconti)
      - users.data_scadenza_abbonamento → now (idem per la view "il mio account")
      - grace_expires_at = now + 7 giorni: finestra in cui Stripe/PayPal riproveranno
        automaticamente il pagamento (se una successiva `invoice.payment_succeeded`
        arriva, `extend_subscription_on_renewal` rimette status='active' + 30gg)
      - IDEMPOTENTE via collection `renewal_events` chiave `provider_event_id`
    """
    existing = await db.renewal_events.find_one({"provider_event_id": provider_event_id})
    if existing:
        logging.info(f"[payment-failed] event {provider_event_id} già processato, skip")
        return

    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    grace_expires_iso = (now + timedelta(days=7)).isoformat()

    match = {"user_id": user_id, "provider": provider}
    if provider == "stripe":
        match["stripe_subscription_id"] = provider_sub_id
    elif provider == "paypal":
        match["paypal_subscription_id"] = provider_sub_id
    sub = await db.subscriptions.find_one(match, sort=[("start_date", -1)])
    if not sub:
        sub = await db.subscriptions.find_one(
            {"user_id": user_id, "status": "active"},
            sort=[("start_date", -1)],
        )
    if not sub:
        logging.warning(f"[payment-failed] nessuna subscription per {user_id}/{provider}")
        return

    await db.subscriptions.update_one(
        {"id": sub["id"]},
        {"$set": {
            "status": "past_due",
            "end_date": now_iso,  # sospensione immediata: l'accesso agli sconti si blocca subito
            "payment_failed_at": now_iso,
            "grace_expires_at": grace_expires_iso,
            "last_failure_event_id": provider_event_id,
        }},
    )
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "data_scadenza_abbonamento": now_iso,
            "subscription_status": "past_due",
            "grace_expires_at": grace_expires_iso,
        }},
    )
    await db.renewal_events.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "provider": provider,
        "provider_event_id": provider_event_id,
        "provider_sub_id": provider_sub_id,
        "type": "payment_failed",
        "processed_at": now_iso,
        "grace_expires_at": grace_expires_iso,
    })
    logging.info(f"[payment-failed] user={user_id[:8]} suspended via {provider} (grace until {grace_expires_iso})")

    # Email #1: notifica immediata di pagamento fallito (idempotente via renewal_events)
    try:
        u = await db.users.find_one({"id": user_id})
        if u and u.get("email"):
            await send_payment_failed_immediate(
                to=u["email"],
                name=u.get("name") or "",
                grace_expires_iso=grace_expires_iso,
                provider=provider,
            )
            logging.info(f"[payment-failed] email inviata to={u['email']}")
    except Exception as e:
        logging.error(f"[payment-failed] email send failed: {e}")


async def extend_subscription_on_renewal(
    *,
    user_id: str,
    provider: str,
    provider_event_id: str,
    provider_sub_id: str,
    price_eur: float = 3.00,
) -> Optional[str]:
    """Estende l'abbonamento di 30 giorni quando arriva un evento di rinnovo pagato
    (Stripe `invoice.payment_succeeded` o PayPal `PAYMENT.SALE.COMPLETED`).

    - IDEMPOTENTE via `renewal_events` collection (chiave `provider_event_id`).
    - new_end = max(now, current_end_date) + 30 giorni (non brucia giorni residui).
    - Aggiorna `users.data_scadenza_abbonamento` per lookup rapido.
    - Ritorna l'ID email Resend (o None).
    """
    existing = await db.renewal_events.find_one({"provider_event_id": provider_event_id})
    if existing:
        logging.info(f"[renewal] event {provider_event_id} già processato, skip")
        return None

    u = await db.users.find_one({"id": user_id})
    if not u:
        logging.warning(f"[renewal] utente {user_id} non trovato")
        return None

    match = {"user_id": user_id, "provider": provider}
    if provider == "stripe":
        match["stripe_subscription_id"] = provider_sub_id
    elif provider == "paypal":
        match["paypal_subscription_id"] = provider_sub_id
    sub = await db.subscriptions.find_one(match, sort=[("start_date", -1)])
    if not sub:
        sub = await db.subscriptions.find_one(
            {"user_id": user_id, "status": "active"},
            sort=[("start_date", -1)],
        )
    if not sub:
        logging.warning(f"[renewal] nessuna subscription per {user_id}/{provider}")
        return None

    now = datetime.now(timezone.utc)
    try:
        current_end = datetime.fromisoformat(sub.get("end_date", "").replace("Z", "+00:00"))
    except Exception:
        current_end = now
    base = max(now, current_end)
    new_end = base + timedelta(days=30)
    new_end_iso = new_end.isoformat()

    await db.subscriptions.update_one(
        {"id": sub["id"]},
        {"$set": {
            "end_date": new_end_iso,
            "status": "active",
            "last_renewal_at": now.isoformat(),
            "last_renewal_event_id": provider_event_id,
        }},
    )
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "data_scadenza_abbonamento": new_end_iso,
            "last_renewal_at": now.isoformat(),
            "subscription_status": "active",
        }, "$unset": {
            "grace_reminder_sent": "",
            "grace_reminder_sent_at": "",
            "cancellation_email_sent": "",
            "cancellation_email_sent_at": "",
            "grace_expires_at": "",
        }},
    )
    await db.renewal_events.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "provider": provider,
        "provider_event_id": provider_event_id,
        "provider_sub_id": provider_sub_id,
        "amount_eur": price_eur,
        "processed_at": now.isoformat(),
        "new_end_date": new_end_iso,
    })

    email_id = None
    try:
        email_id = await send_renewal_receipt(
            to=u["email"],
            name=u.get("name") or "",
            next_end_date_iso=new_end_iso,
            price_eur=price_eur,
            provider=provider,
        )
        logging.info(f"[renewal] email inviata to={u['email']} id={email_id}")
    except Exception as e:
        logging.error(f"[renewal] email send failed: {e}")

    return email_id



async def mark_subscription_paid(session, user_id: str):
    now = datetime.now(timezone.utc)
    end = now + timedelta(days=30)
    session_id = session.get("id") if isinstance(session, dict) else session.id
    # Deactivate old active subs
    await db.subscriptions.update_many(
        {"user_id": user_id, "status": "active"},
        {"$set": {"status": "replaced"}}
    )
    await db.subscriptions.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "plan": "monthly",
        "status": "active",
        "price_eur": 3.00,
        "start_date": now.isoformat(),
        "end_date": end.isoformat(),
        "stripe_session_id": session_id,
        "stripe_subscription_id": (session.get("subscription") if isinstance(session, dict) else session.subscription),
        "provider": "stripe",
    })
    # Invio idempotente della mail di benvenuto/attivazione. Usiamo un flag sul
    # payment_transaction per non spedirla due volte quando arriva sia il polling
    # che il webhook.
    flag = await db.payment_transactions.find_one_and_update(
        {"session_id": session_id, "welcome_email_sent": {"$ne": True}},
        {"$set": {"welcome_email_sent": True}},
    )
    if flag:
        try:
            u = await db.users.find_one({"id": user_id})
            if u and u.get("email"):
                await send_monthly_discounts_notification(u["email"], u.get("name") or "")
        except Exception as e:
            logging.warning(f"stripe welcome email failed: {e}")


@api.get("/payments/status/{session_id}")
async def payment_status(session_id: str):
    record = await db.payment_transactions.find_one({"session_id": session_id})
    if not record:
        raise HTTPException(404, "Transazione non trovata")
    # Webhook fallback: query Stripe directly if still pending
    if record.get("payment_status") != "paid":
        try:
            s = stripe.checkout.Session.retrieve(session_id)
            if s.payment_status == "paid" or s.status == "complete":
                result = await db.payment_transactions.update_one(
                    {"session_id": session_id, "payment_status": {"$ne": "paid"}},
                    {"$set": {"status": "completed", "payment_status": "paid",
                              "stripe_subscription_id": s.subscription,
                              "updated_at": datetime.now(timezone.utc).isoformat()}},
                )
                if result.modified_count > 0 and record.get("user_id"):
                    await mark_subscription_paid(s, record["user_id"])
                record = await db.payment_transactions.find_one({"session_id": session_id})
        except Exception:
            pass
    return {
        "session_id": record["session_id"],
        "status": record["status"],
        "payment_status": record["payment_status"],
    }


@api.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(400, "Invalid signature")
    obj = event["data"]["object"]
    t = event["type"]
    if t == "checkout.session.completed":
        result = await db.payment_transactions.update_one(
            {"session_id": obj["id"], "payment_status": {"$ne": "paid"}},
            {"$set": {"status": "completed", "payment_status": obj.get("payment_status", "paid"),
                      "stripe_subscription_id": obj.get("subscription"),
                      "updated_at": datetime.now(timezone.utc).isoformat()}},
        )
        if result.modified_count > 0:
            uid = (obj.get("metadata") or {}).get("user_id")
            if uid:
                await mark_subscription_paid(obj, uid)
    elif t == "invoice.payment_succeeded":
        # Rinnovo mensile riuscito (recurring charge). Estende abbonamento di 30 giorni.
        # Ignoriamo l'invoice della prima sottoscrizione (billing_reason=subscription_create)
        # perché mark_subscription_paid() gestisce già il primo pagamento in checkout.session.completed.
        billing_reason = obj.get("billing_reason")
        if billing_reason == "subscription_create":
            return {"status": "ok", "skipped": "first_charge_handled_by_checkout"}
        stripe_sub_id = obj.get("subscription")
        invoice_id = obj.get("id")
        amount_paid = (obj.get("amount_paid") or 300) / 100.0  # cents → EUR
        if stripe_sub_id and invoice_id:
            sub = await db.subscriptions.find_one({"stripe_subscription_id": stripe_sub_id})
            if sub:
                await extend_subscription_on_renewal(
                    user_id=sub["user_id"],
                    provider="stripe",
                    provider_event_id=f"stripe:{invoice_id}",
                    provider_sub_id=stripe_sub_id,
                    price_eur=amount_paid,
                )
    elif t == "invoice.payment_failed":
        # Rinnovo mensile FALLITO. Sospendi immediatamente l'abbonamento.
        # Stripe riproverà il pagamento più volte nei ~7 giorni successivi.
        # Se un retry ha successo, arriverà `invoice.payment_succeeded` e
        # `extend_subscription_on_renewal()` rimetterà status=active + 30gg.
        billing_reason = obj.get("billing_reason")
        stripe_sub_id = obj.get("subscription")
        invoice_id = obj.get("id")
        # Il primo pagamento fallito (subscription_create) è gestito lato checkout
        # (l'utente vede l'errore nel checkout stesso), non serve sospendere qui.
        if billing_reason == "subscription_create":
            return {"status": "ok", "skipped": "first_charge_failed_handled_by_checkout"}
        if stripe_sub_id and invoice_id:
            sub = await db.subscriptions.find_one({"stripe_subscription_id": stripe_sub_id})
            if sub:
                await suspend_subscription_on_payment_failed(
                    user_id=sub["user_id"],
                    provider="stripe",
                    provider_event_id=f"stripe:fail:{invoice_id}",
                    provider_sub_id=stripe_sub_id,
                )
    elif t == "customer.subscription.deleted":
        sub_id = obj.get("id")
        await db.subscriptions.update_many(
            {"stripe_subscription_id": sub_id, "status": "active"},
            {"$set": {"status": "cancelled"}}
        )
    return {"status": "ok"}


# ---------- PayPal Subscriptions (€3/mese ricorrente) ----------
class PayPalActivateIn(BaseModel):
    subscription_id: str


@api.get("/paypal/config")
async def paypal_config():
    """Ritorna client_id + plan_id per il frontend (PayPal Buttons SDK)."""
    if not paypal_service.is_configured():
        return {"enabled": False}
    try:
        plan_id = await paypal_service.ensure_plan()
    except Exception as e:
        logging.warning(f"PayPal plan setup failed: {e}")
        return {"enabled": False, "error": "plan_setup_failed"}
    return {
        "enabled": True,
        "client_id": paypal_service.PAYPAL_CLIENT_ID,
        "plan_id": plan_id,
        "mode": paypal_service.PAYPAL_MODE,
    }


@api.post("/paypal/activate")
async def paypal_activate(payload: PayPalActivateIn, user: dict = Depends(require_client)):
    """Chiamato dal frontend dopo `onApprove` di PayPal Buttons. Verifica lo stato reale
    su PayPal e crea la subscription attiva localmente."""
    if not paypal_service.is_configured():
        raise HTTPException(400, "PayPal non configurato")
    try:
        sub = await paypal_service.get_subscription(payload.subscription_id)
    except Exception as e:
        raise HTTPException(400, f"Impossibile verificare la sottoscrizione: {e}")
    pp_status = sub.get("status")
    if pp_status not in ("ACTIVE", "APPROVED", "APPROVAL_PENDING"):
        raise HTTPException(400, f"Stato sottoscrizione PayPal non valido: {pp_status}")
    now = datetime.now(timezone.utc)
    end = now + timedelta(days=30)
    # Deactivate old actives
    await db.subscriptions.update_many(
        {"user_id": user["id"], "status": "active"},
        {"$set": {"status": "replaced"}}
    )
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "plan": "monthly",
        "status": "active",
        "price_eur": 3.00,
        "start_date": now.isoformat(),
        "end_date": end.isoformat(),
        "paypal_subscription_id": payload.subscription_id,
        "provider": "paypal",
        "welcome_email_sent": True,
    }
    await db.subscriptions.insert_one(doc)
    # Idempotenza: mandiamo la mail solo se non l'abbiamo già mandata per questa PayPal subscription
    already = await db.subscriptions.count_documents({
        "paypal_subscription_id": payload.subscription_id,
        "welcome_email_sent": True,
        "id": {"$ne": doc["id"]},
    })
    if already == 0:
        try:
            await send_monthly_discounts_notification(user["email"], user.get("name") or "")
        except Exception as e:
            logging.warning(f"paypal welcome email failed: {e}")
    return {"subscription": {k: v for k, v in doc.items() if k != "_id"}}


@api.post("/paypal/webhook")
async def paypal_webhook(request: Request):
    body = await request.body()
    try:
        event = _json.loads(body.decode() or "{}")
    except Exception:
        raise HTTPException(400, "Body non JSON")
    # Verifica firma se abbiamo il webhook id configurato
    try:
        ok = await paypal_service.verify_webhook(dict(request.headers), event)
        if not ok:
            raise HTTPException(400, "Firma webhook non valida")
    except paypal_service.PayPalNotConfigured:
        raise HTTPException(400, "PayPal non configurato")
    etype = event.get("event_type", "")
    resource = event.get("resource", {})
    sub_id = resource.get("id") or resource.get("billing_agreement_id")
    if not sub_id:
        return {"status": "ignored"}
    if etype == "BILLING.SUBSCRIPTION.ACTIVATED":
        # nessuna azione se già attiva; se stiamo aspettando l'attivazione da /paypal/activate,
        # potrebbe non esistere ancora — in tal caso ignoriamo (verrà creata da /paypal/activate)
        await db.subscriptions.update_many(
            {"paypal_subscription_id": sub_id, "status": {"$ne": "active"}},
            {"$set": {"status": "active"}}
        )
    elif etype in ("PAYMENT.SALE.COMPLETED", "PAYMENT.CAPTURE.COMPLETED"):
        # Rinnovo ricorrente PayPal (charge mensile su subscription attiva).
        # `resource.billing_agreement_id` = subscription_id per subscription payments.
        # Il primo pagamento potrebbe anche arrivare qui: siamo idempotenti via sale_id.
        sale_id = resource.get("id")
        billing_agreement_id = resource.get("billing_agreement_id") or resource.get("supplementary_data", {}).get("related_ids", {}).get("subscription_id")
        amount = resource.get("amount", {})
        price = float(amount.get("total") or amount.get("value") or 3.00)
        if sale_id and billing_agreement_id:
            sub = await db.subscriptions.find_one({"paypal_subscription_id": billing_agreement_id})
            if sub:
                await extend_subscription_on_renewal(
                    user_id=sub["user_id"],
                    provider="paypal",
                    provider_event_id=f"paypal:{sale_id}",
                    provider_sub_id=billing_agreement_id,
                    price_eur=price,
                )
    elif etype in ("PAYMENT.SALE.DENIED",
                   "BILLING.SUBSCRIPTION.PAYMENT.FAILED"):
        # Rinnovo mensile PayPal FALLITO. Sospendi immediatamente.
        # PayPal riproverà il pagamento fino a 3 volte nei ~7 giorni successivi (retry policy).
        # Se una `PAYMENT.SALE.COMPLETED` arriva dopo, `extend_subscription_on_renewal`
        # rimetterà status=active + 30gg.
        billing_agreement_id = resource.get("billing_agreement_id") or sub_id or \
            resource.get("supplementary_data", {}).get("related_ids", {}).get("subscription_id")
        event_ref = resource.get("id") or event.get("id") or f"pp-{uuid.uuid4().hex[:8]}"
        if billing_agreement_id:
            sub = await db.subscriptions.find_one({"paypal_subscription_id": billing_agreement_id})
            if sub:
                await suspend_subscription_on_payment_failed(
                    user_id=sub["user_id"],
                    provider="paypal",
                    provider_event_id=f"paypal:fail:{event_ref}",
                    provider_sub_id=billing_agreement_id,
                )
    elif etype in ("BILLING.SUBSCRIPTION.CANCELLED",
                   "BILLING.SUBSCRIPTION.SUSPENDED",
                   "BILLING.SUBSCRIPTION.EXPIRED"):
        await db.subscriptions.update_many(
            {"paypal_subscription_id": sub_id, "status": "active"},
            {"$set": {"status": "cancelled", "cancelled_at": datetime.now(timezone.utc).isoformat()}}
        )
    return {"status": "ok"}


# ---------- Redemption ----------
@api.post("/redemptions/create/{discount_id}")
async def create_redemption(discount_id: str, user: dict = Depends(require_client)):
    if not await user_has_active_sub(user["id"]):
        raise HTTPException(402, "Serve un abbonamento attivo")
    d = await db.discounts.find_one({"id": discount_id})
    if not d:
        raise HTTPException(404, "Sconto non trovato")
    if d.get("approval_status") != "approved" or not d.get("active", True):
        raise HTTPException(403, "Offerta non disponibile")

    month_key = current_month_key()
    max_uses = int(d.get("max_uses_per_month") or 1)

    # 1) Se esiste una redemption PENDING (QR generato ma non ancora scansionato) → riusala.
    pending = await db.redemptions.find_one({
        "user_id": user["id"],
        "merchant_id": d["merchant_id"],
        "month_key": month_key,
        "status": "pending",
    })
    if pending:
        return {"redemption": {k: v for k, v in pending.items() if k != "_id"}}

    # 2) Conta gli usi già consumati questo mese (status = "redeemed")
    used_count = await db.redemptions.count_documents({
        "user_id": user["id"],
        "merchant_id": d["merchant_id"],
        "month_key": month_key,
        "status": "redeemed",
    })
    if used_count >= max_uses:
        if max_uses == 1:
            raise HTTPException(409, "Sconto già utilizzato questo mese. Torna il mese prossimo!")
        raise HTTPException(
            409,
            f"Hai già usato questo sconto {max_uses} volte questo mese. Torna il mese prossimo!",
        )

    # 3) Genera nuovo codice/QR — ogni chiamata produce un codice DIVERSO.
    code = gen_code(8)
    doc = {
        "id": str(uuid.uuid4()),
        "code": code,
        "user_id": user["id"],
        "discount_id": discount_id,
        "merchant_id": d["merchant_id"],
        "status": "pending",
        "month_key": month_key,
        "use_number": used_count + 1,  # 1-based (1° uso, 2° uso, ...)
        "max_uses_per_month": max_uses,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "redeemed_at": None,
    }
    await db.redemptions.insert_one(doc)
    return {"redemption": {k: v for k, v in doc.items() if k != "_id"}}


@api.get("/redemptions/discount/{discount_id}/status")
async def redemption_status(discount_id: str, user: dict = Depends(require_client)):
    """Ritorna quante volte l'utente ha già usato lo sconto questo mese e quante gliene restano."""
    d = await db.discounts.find_one({"id": discount_id})
    if not d:
        raise HTTPException(404, "Sconto non trovato")
    month_key = current_month_key()
    max_uses = int(d.get("max_uses_per_month") or 1)

    used_count = await db.redemptions.count_documents({
        "user_id": user["id"],
        "merchant_id": d["merchant_id"],
        "month_key": month_key,
        "status": "redeemed",
    })
    pending = await db.redemptions.find_one({
        "user_id": user["id"],
        "merchant_id": d["merchant_id"],
        "month_key": month_key,
        "status": "pending",
    })

    remaining = max(0, max_uses - used_count)
    return {
        "used_this_month": used_count >= max_uses,  # backward compat
        "used_count": used_count,
        "max_uses": max_uses,
        "remaining": remaining,
        "has_pending": bool(pending),
        "pending_redemption_id": pending.get("id") if pending else None,
        # legacy fields for old clients
        "status": pending.get("status") if pending else ("redeemed" if used_count >= max_uses else None),
        "redemption_id": pending.get("id") if pending else None,
    }


@api.get("/redemptions/me")
async def my_redemptions(user: dict = Depends(require_client)):
    docs = await db.redemptions.find({"user_id": user["id"]}).sort("created_at", -1).to_list(200)
    out = []
    for d in docs:
        d = {k: v for k, v in d.items() if k != "_id"}
        disc = await db.discounts.find_one({"id": d.get("discount_id")})
        if disc:
            merchant = await db.users.find_one({"id": disc.get("merchant_id")})
            d["discount_title"] = disc.get("title")
            d["shop_name"] = merchant.get("shop_name") if merchant else ""
        out.append(d)
    return {"redemptions": out}


@api.get("/redemptions/{rid}/token")
async def redemption_token(rid: str, user: dict = Depends(require_client)):
    r = await db.redemptions.find_one({"id": rid, "user_id": user["id"]})
    if not r:
        raise HTTPException(404, "Codice non trovato")
    slot = current_slot()
    token = _rotating_hmac(r["code"], slot)
    payload = f"{r['code']}.{slot}.{token}"
    origin = os.environ.get("FRONTEND_URL", "").rstrip("/")
    return {
        "code": r["code"],
        "slot": slot,
        "token": token,
        "qr_value": f"{origin}/qr/{payload}" if origin else payload,
        "expires_in": ROTATION_WINDOW_SEC - (int(datetime.now(timezone.utc).timestamp()) % ROTATION_WINDOW_SEC),
        "window_sec": ROTATION_WINDOW_SEC,
    }


# ---------- Public QR scan verification (no auth) ----------
async def _log_scan(valid: bool, reason: str, redemption: Optional[dict] = None):
    """Salva ogni scansione (soprattutto quelle fallite) per il registro frodi admin."""
    try:
        doc = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "valid": valid,
            "reason": reason,
            "redemption_id": redemption.get("id") if redemption else None,
            "discount_id": redemption.get("discount_id") if redemption else None,
            "merchant_id": redemption.get("merchant_id") if redemption else None,
            "user_id": redemption.get("user_id") if redemption else None,
        }
        # Aggiungi shop_name pre-calcolato per il log admin (evita join a query)
        if redemption and redemption.get("merchant_id"):
            m = await db.users.find_one({"id": redemption["merchant_id"]})
            if m:
                doc["shop_name"] = m.get("shop_name") or m.get("name") or "-"
        await db.qr_scans.insert_one(doc)
    except Exception as e:
        logging.warning(f"scan log failed: {e}")


@api.get("/qr/verify")
async def qr_verify_public(token: str):
    code, slot, hmac_tok = parse_rotating_code(token)
    if slot is None or hmac_tok is None:
        await _log_scan(False, "Formato codice non valido")
        return {"valid": False, "reason": "Formato codice non valido"}
    cur = current_slot()
    if abs(cur - slot) > 1:
        await _log_scan(False, "QR code scaduto")
        return {"valid": False, "reason": "QR code scaduto"}
    if not hmac_lib.compare_digest(_rotating_hmac(code, slot), hmac_tok):
        await _log_scan(False, "QR code manomesso")
        return {"valid": False, "reason": "QR code manomesso"}
    r = await db.redemptions.find_one({"code": code})
    if not r:
        await _log_scan(False, "Codice non trovato")
        return {"valid": False, "reason": "Codice non trovato"}
    if r.get("status") == "redeemed":
        # If redeemed in same slot window (~40s), still show green as freshly scanned
        try:
            ts = datetime.fromisoformat(r.get("redeemed_at",""))
            if (datetime.now(timezone.utc) - ts).total_seconds() < ROTATION_WINDOW_SEC * 2:
                pass  # allow re-display
            else:
                await _log_scan(False, "Codice già utilizzato", r)
                return {"valid": False, "reason": "Codice già utilizzato"}
        except Exception:
            await _log_scan(False, "Codice già utilizzato", r)
            return {"valid": False, "reason": "Codice già utilizzato"}
    # Consume on first successful scan
    if r.get("status") == "pending":
        await db.redemptions.update_one(
            {"id": r["id"], "status": "pending"},
            {"$set": {"status": "redeemed",
                      "redeemed_at": datetime.now(timezone.utc).isoformat()}}
        )
        await _log_scan(True, "OK", r)
    # Fetch enriched data
    disc = await db.discounts.find_one({"id": r.get("discount_id")})
    m = await db.users.find_one({"id": r.get("merchant_id")})
    c = await db.users.find_one({"id": r.get("user_id")})
    return {
        "valid": True,
        "client_name": (c.get("name") if c else "").split(" ")[0] if c else "Cliente",
        "client_initial": ((c.get("name","?")[:1] or "?").upper()) if c else "?",
        "shop_name": m.get("shop_name") if m else "-",
        "discount_title": disc.get("title") if disc else "-",
        "discount_percent": None if not disc or not disc.get("original_price") else round((1 - disc["discounted_price"]/disc["original_price"])*100),
        "redeemed_at": r.get("redeemed_at") or datetime.now(timezone.utc).isoformat(),
    }


@api.post("/redemptions/verify")
async def verify_redemption(payload: RedeemVerifyIn, user: dict = Depends(require_merchant)):
    code, slot, token = parse_rotating_code(payload.code)
    r = await db.redemptions.find_one({"code": code, "merchant_id": user["id"]})
    if not r:
        raise HTTPException(404, "Codice non trovato")
    if r["status"] == "redeemed":
        raise HTTPException(400, "Codice già utilizzato")
    # If rotating format supplied, validate freshness (±1 slot = 10-20s window)
    if slot is not None and token is not None:
        cur = current_slot()
        if abs(cur - slot) > 1:
            raise HTTPException(400, "QR code scaduto, chiedi al cliente di aggiornarlo")
        if not hmac_lib.compare_digest(_rotating_hmac(code, slot), token):
            raise HTTPException(400, "QR code non valido (possibile screenshot)")
    await db.redemptions.update_one(
        {"id": r["id"]},
        {"$set": {"status": "redeemed", "redeemed_at": datetime.now(timezone.utc).isoformat()}}
    )
    r = await db.redemptions.find_one({"id": r["id"]})
    r = {k: v for k, v in r.items() if k != "_id"}
    disc = await db.discounts.find_one({"id": r["discount_id"]})
    cu = await db.users.find_one({"id": r["user_id"]})
    r["discount_title"] = disc.get("title") if disc else ""
    r["client_name"] = cu.get("name") if cu else ""
    return {"redemption": r}


# ---------- Admin ----------
def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(403, "Riservato all'amministratore")
    return user


ADMIN_MASTER_TTL_MIN = 60
MASTER_MAX_ATTEMPTS = 5
MASTER_LOCK_MINUTES = 15
_master_state = {"version": 1}


async def ensure_master_doc() -> dict:
    doc = await db.admin_security.find_one({"key": "master"})
    if not doc:
        pw = os.environ.get("ADMIN_MASTER_PASSWORD", "")
        rid = os.environ.get("ADMIN_RECOVERY_ID", "")
        doc = {
            "key": "master",
            "master_hash": hash_password(pw) if pw else "",
            "recovery_id_hash": hash_password(rid.strip().upper()) if rid else "",
            "master_version": 1,
            "failed_attempts": 0,
            "locked_until": None,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.admin_security.insert_one(doc)
    _master_state["version"] = doc.get("master_version", 1)
    return doc


def _sign_master(user_id: str, exp: datetime) -> str:
    return jwt.encode({"sub": user_id, "typ": "admin_master", "ver": _master_state["version"], "exp": exp}, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _verify_master_token(token: str, user_id: str) -> bool:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return (payload.get("typ") == "admin_master"
                and payload.get("sub") == user_id
                and payload.get("ver") == _master_state["version"])
    except Exception:
        return False


def require_admin_master(request: Request, user: dict = Depends(require_admin)) -> dict:
    token = request.cookies.get("admin_master_token") or request.headers.get("X-Admin-Master", "")
    if not token or not _verify_master_token(token, user["id"]):
        raise HTTPException(403, "Master password richiesta")
    return user


def _issue_master_cookie(response: Response, user_id: str) -> dict:
    exp = datetime.now(timezone.utc) + timedelta(minutes=ADMIN_MASTER_TTL_MIN)
    token = _sign_master(user_id, exp)
    response.set_cookie(
        "admin_master_token", token,
        max_age=ADMIN_MASTER_TTL_MIN * 60,
        httponly=True, secure=True, samesite="none", path="/",
    )
    return {"ok": True, "token": token, "expires_in": ADMIN_MASTER_TTL_MIN * 60}


def _lock_check(doc: dict, field: str = "locked_until"):
    lu = doc.get(field)
    if not lu:
        return
    try:
        t = datetime.fromisoformat(lu)
    except Exception:
        return
    if t > datetime.now(timezone.utc):
        mins = int((t - datetime.now(timezone.utc)).total_seconds() // 60) + 1
        raise HTTPException(429, f"Troppi tentativi falliti. Riprova tra {mins} minuti.")


async def _register_master_failure(prefix: str = ""):
    f_att, f_lock = f"{prefix}failed_attempts", f"{prefix}locked_until"
    await db.admin_security.update_one({"key": "master"}, {"$inc": {f_att: 1}})
    doc = await db.admin_security.find_one({"key": "master"})
    if (doc or {}).get(f_att, 0) >= MASTER_MAX_ATTEMPTS:
        until = (datetime.now(timezone.utc) + timedelta(minutes=MASTER_LOCK_MINUTES)).isoformat()
        await db.admin_security.update_one({"key": "master"}, {"$set": {f_lock: until, f_att: 0}})


class MasterVerifyIn(BaseModel):
    password: str


@api.post("/admin/verify-master")
async def admin_verify_master(payload: MasterVerifyIn, response: Response, user: dict = Depends(require_admin)):
    doc = await ensure_master_doc()
    _lock_check(doc)
    if not doc.get("master_hash") or not verify_password(payload.password, doc["master_hash"]):
        await _register_master_failure()
        raise HTTPException(401, "Master password errata")
    await db.admin_security.update_one({"key": "master"}, {"$set": {"failed_attempts": 0, "locked_until": None}})
    return _issue_master_cookie(response, user["id"])


@api.post("/admin/webauthn-master/begin")
async def webauthn_master_begin(user: dict = Depends(require_admin)):
    u = await db.users.find_one({"id": user["id"]})
    creds = (u or {}).get("webauthn_credentials") or []
    if not creds:
        raise HTTPException(400, "Nessun dispositivo biometrico registrato. Configuralo dalla pagina Sicurezza.")
    allow = [PublicKeyCredentialDescriptor(
        id=unb64u(c["credential_id"]), transports=c.get("transports") or None)
        for c in creds]
    options = generate_authentication_options(
        rp_id=WEBAUTHN_RP_ID, allow_credentials=allow,
        user_verification=UserVerificationRequirement.PREFERRED,
    )
    await db.webauthn_challenges.insert_one({
        "user_id": u["id"], "kind": "master", "challenge": b64u(options.challenge),
        "expires_at": datetime.now(timezone.utc) + CHALLENGE_TTL,
    })
    return _json.loads(options_to_json(options))


@api.post("/admin/webauthn-master/complete")
async def webauthn_master_complete(payload: WebAuthnCompleteIn, response: Response, user: dict = Depends(require_admin)):
    cid = payload.credential.get("id")
    u = await db.users.find_one({"id": user["id"]})
    cred = next((c for c in ((u or {}).get("webauthn_credentials") or []) if c["credential_id"] == cid), None)
    if not cred:
        raise HTTPException(401, "Credenziale non riconosciuta")
    ch = await db.webauthn_challenges.find_one_and_delete({
        "user_id": u["id"], "kind": "master",
        "expires_at": {"$gt": datetime.now(timezone.utc)},
    })
    if not ch:
        raise HTTPException(401, "Sessione scaduta, riprova")
    try:
        v = verify_authentication_response(
            credential=payload.credential,
            expected_challenge=unb64u(ch["challenge"]),
            expected_rp_id=WEBAUTHN_RP_ID,
            expected_origin=WEBAUTHN_ORIGIN,
            credential_public_key=unb64u(cred["public_key"]),
            credential_current_sign_count=cred.get("sign_count", 0),
            require_user_verification=False,
        )
    except Exception:
        raise HTTPException(401, "Verifica biometrica fallita")
    await db.users.update_one(
        {"id": u["id"], "webauthn_credentials.credential_id": cid},
        {"$set": {"webauthn_credentials.$.sign_count": v.new_sign_count}},
    )
    return _issue_master_cookie(response, u["id"])


class MasterForgotIn(BaseModel):
    recovery_id: str


@api.post("/admin/master-forgot")
async def admin_master_forgot(payload: MasterForgotIn, user: dict = Depends(require_admin)):
    doc = await ensure_master_doc()
    _lock_check(doc, "recovery_locked_until")
    rid = payload.recovery_id.strip().upper()
    if not doc.get("recovery_id_hash") or not verify_password(rid, doc["recovery_id_hash"]):
        await _register_master_failure("recovery_")
        raise HTTPException(401, "Recovery ID non valido")
    token = secrets.token_urlsafe(32)
    expires = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()
    await db.admin_security.update_one({"key": "master"}, {"$set": {
        "master_reset_token": token, "master_reset_expires": expires,
        "recovery_failed_attempts": 0, "recovery_locked_until": None,
    }})
    admin_email = os.environ.get("ADMIN_NOTIFY_EMAIL") or os.environ.get("ADMIN_EMAIL", "")
    try:
        await send_master_reset(admin_email, token)
    except Exception as e:
        logging.warning(f"master-reset email failed: {e}")
    masked = admin_email[:2] + "•••" + admin_email[admin_email.find("@"):] if "@" in admin_email else "email admin"
    return {"ok": True, "message": f"Link di reset inviato a {masked} (valido 30 minuti)."}


class MasterResetIn(BaseModel):
    token: str
    new_password: str


@api.post("/admin/master-reset")
async def admin_master_reset(payload: MasterResetIn):
    doc = await db.admin_security.find_one({"key": "master"})
    tok = (doc or {}).get("master_reset_token")
    if not tok or not hmac_lib.compare_digest(tok, payload.token):
        raise HTTPException(400, "Link non valido o già utilizzato")
    try:
        expired = datetime.fromisoformat(doc.get("master_reset_expires", "")) < datetime.now(timezone.utc)
    except Exception:
        expired = True
    if expired:
        raise HTTPException(400, "Link scaduto, richiedine uno nuovo")
    if len(payload.new_password) < 10:
        raise HTTPException(400, "La nuova master password deve avere almeno 10 caratteri")
    new_version = int(doc.get("master_version", 1)) + 1
    await db.admin_security.update_one({"key": "master"}, {
        "$set": {
            "master_hash": hash_password(payload.new_password),
            "master_version": new_version,
            "failed_attempts": 0, "locked_until": None,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
        "$unset": {"master_reset_token": "", "master_reset_expires": ""},
    })
    _master_state["version"] = new_version
    return {"ok": True, "message": "Master password aggiornata. Sblocca l'area admin con la nuova password."}


@api.post("/admin/regenerate-recovery-id")
async def admin_regenerate_recovery_id(user: dict = Depends(require_admin_master)):
    alphabet = string.ascii_uppercase + string.digits
    rid = "SR-" + "-".join("".join(secrets.choice(alphabet) for _ in range(4)) for _ in range(3))
    await db.admin_security.update_one({"key": "master"}, {"$set": {
        "recovery_id_hash": hash_password(rid),
        "recovery_failed_attempts": 0, "recovery_locked_until": None,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }}, upsert=True)
    return {"ok": True, "recovery_id": rid, "message": "Conserva questo Recovery ID: non sarà più mostrato."}


@api.post("/admin/logout-master")
async def admin_logout_master(response: Response):
    response.delete_cookie("admin_master_token", path="/")
    return {"ok": True}


@api.get("/admin/session")
async def admin_session(request: Request, user: dict = Depends(require_admin)):
    token = request.cookies.get("admin_master_token") or request.headers.get("X-Admin-Master", "")
    verified = bool(token and _verify_master_token(token, user["id"]))
    u = await db.users.find_one({"id": user["id"]})
    return {"master_verified": verified, "biometric_available": bool((u or {}).get("webauthn_credentials"))}


@api.get("/admin/stats")
async def admin_stats(user: dict = Depends(require_admin_master)):
    total_users = await db.users.count_documents({"role": "client"})
    total_merchants = await db.users.count_documents({"role": "merchant"})
    now = datetime.now(timezone.utc)
    start_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
    active_subs = await db.subscriptions.count_documents({"status": "active", "end_date": {"$gt": now.isoformat()}})
    total_redemptions = await db.redemptions.count_documents({})
    redemptions_month = await db.redemptions.count_documents({"created_at": {"$gte": start_month}})
    mrr = active_subs * 2.99

    # Last 30 days per-day counts
    thirty_ago = (now - timedelta(days=30)).isoformat()
    docs = await db.redemptions.find({"created_at": {"$gte": thirty_ago}}).to_list(5000)
    by_day = {}
    by_hour = [0] * 24
    by_weekday = [0] * 7
    for d in docs:
        try:
            dt = datetime.fromisoformat(d["created_at"])
            key = dt.strftime("%Y-%m-%d")
            by_day[key] = by_day.get(key, 0) + 1
            by_hour[dt.hour] += 1
            by_weekday[dt.weekday()] += 1
        except Exception:
            pass
    daily = [{"date": k, "count": v} for k, v in sorted(by_day.items())]

    # Top merchants
    all_reds = await db.redemptions.find({}).to_list(5000)
    per_merchant = {}
    for r in all_reds:
        mid = r.get("merchant_id")
        per_merchant[mid] = per_merchant.get(mid, 0) + 1
    top_ids = sorted(per_merchant.items(), key=lambda x: -x[1])[:10]
    top_merchants = []
    for mid, count in top_ids:
        m = await db.users.find_one({"id": mid})
        if m:
            top_merchants.append({
                "id": mid,
                "shop_name": m.get("shop_name") or m.get("name"),
                "zone": m.get("zone"),
                "category": m.get("category"),
                "redemptions": count,
            })

    # Top clients
    per_client = {}
    for r in all_reds:
        cid = r.get("user_id")
        per_client[cid] = per_client.get(cid, 0) + 1
    top_client_ids = sorted(per_client.items(), key=lambda x: -x[1])[:10]
    top_clients = []
    for cid, count in top_client_ids:
        c = await db.users.find_one({"id": cid})
        if c:
            top_clients.append({
                "id": cid,
                "name": c.get("name"),
                "email": c.get("email"),
                "redemptions": count,
            })

    # Recent redemptions (last 20)
    recent_docs = await db.redemptions.find({}).sort("created_at", -1).to_list(20)
    recent = []
    for r in recent_docs:
        m = await db.users.find_one({"id": r.get("merchant_id")})
        c = await db.users.find_one({"id": r.get("user_id")})
        disc = await db.discounts.find_one({"id": r.get("discount_id")})
        recent.append({
            "code": r.get("code"),
            "status": r.get("status"),
            "created_at": r.get("created_at"),
            "redeemed_at": r.get("redeemed_at"),
            "shop_name": m.get("shop_name") if m else "-",
            "client_name": c.get("name") if c else "-",
            "discount_title": disc.get("title") if disc else "-",
        })

    return {
        "totals": {
            "clients": total_users,
            "merchants": total_merchants,
            "active_subscriptions": active_subs,
            "mrr_eur": round(mrr, 2),
            "total_redemptions": total_redemptions,
            "redemptions_this_month": redemptions_month,
        },
        "daily": daily,
        "by_hour": by_hour,
        "by_weekday": by_weekday,
        "top_merchants": top_merchants,
        "top_clients": top_clients,
        "recent": recent,
    }


# ---------- Admin: Merchants management ----------
class AdminMerchantUpdate(BaseModel):
    shop_name: Optional[str] = None
    description: Optional[str] = None
    zone: Optional[str] = None
    category: Optional[str] = None
    address: Optional[str] = None
    image_url: Optional[str] = None
    phone: Optional[str] = None
    approved: Optional[bool] = None


class AdminDiscountUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    original_price: Optional[float] = None
    discounted_price: Optional[float] = None
    image_url: Optional[str] = None
    terms: Optional[str] = None
    active: Optional[bool] = None
    max_uses_per_month: Optional[int] = Field(default=None, ge=1, le=10)


class RejectIn(BaseModel):
    reason: Optional[str] = ""


@api.get("/admin/discounts/pending")
async def admin_list_pending(user: dict = Depends(require_admin_master)):
    docs = await db.discounts.find({"approval_status": "pending"}).sort("updated_at", -1).to_list(200)
    out = []
    for d in docs:
        out.append(await enrich_discount(d))
    return {"discounts": out}



@api.get("/admin/referrals-by-merchant")
async def admin_referrals_by_merchant(user: dict = Depends(require_admin_master)):
    """Attribuzione dei nuovi iscritti al QR personalizzato di ogni commerciante.
    Per ogni merchant restituisce elenco clienti che si sono registrati con
    `?ref=merchant_id` più conteggi di iscritti totali, abbonati e attivi ora.
    Ordinato per numero di abbonati attivi (top performer prima).
    """
    # Tutti i client con un `referred_by` valorizzato
    clients = await db.users.find(
        {"role": "client", "referred_by": {"$exists": True, "$nin": [None, ""]}},
        {"_id": 0, "id": 1, "name": 1, "email": 1, "created_at": 1,
         "referred_at": 1, "referred_by": 1, "subscription_status": 1,
         "data_scadenza_abbonamento": 1},
    ).sort("referred_at", -1).to_list(length=None)

    if not clients:
        return {"merchants": [], "totals": {"merchants_with_referrals": 0,
                                             "total_signups": 0,
                                             "total_subscribed": 0,
                                             "total_active": 0}}

    # Lookup subscriptions per determinare "abbonato almeno una volta" e "attivo ora"
    client_ids = [c["id"] for c in clients]
    subs = await db.subscriptions.find(
        {"user_id": {"$in": client_ids}},
        {"_id": 0, "user_id": 1, "status": 1, "end_date": 1},
    ).to_list(length=None)
    subscribed_ids = {s["user_id"] for s in subs}
    now_iso = datetime.now(timezone.utc).isoformat()
    active_ids = {s["user_id"] for s in subs
                  if s.get("status") == "active" and (s.get("end_date") or "") > now_iso}

    # Group per merchant_id
    by_merchant: dict = {}
    for c in clients:
        mid = c["referred_by"]
        by_merchant.setdefault(mid, []).append(c)

    # Merchant metadata
    merchant_ids = list(by_merchant.keys())
    merchants = await db.users.find(
        {"id": {"$in": merchant_ids}, "role": "merchant"},
        {"_id": 0, "id": 1, "shop_name": 1, "email": 1, "name": 1,
         "zone": 1, "category": 1},
    ).to_list(length=None)
    merchants_map = {m["id"]: m for m in merchants}

    rows = []
    for mid, cl in by_merchant.items():
        m = merchants_map.get(mid, {})
        clients_enriched = []
        subscribed = 0
        active = 0
        for c in cl:
            is_sub = c["id"] in subscribed_ids
            is_active = c["id"] in active_ids
            if is_sub:
                subscribed += 1
            if is_active:
                active += 1
            clients_enriched.append({
                **c,
                "is_subscribed": is_sub,
                "is_active_now": is_active,
            })
        rows.append({
            "merchant_id": mid,
            "shop_name": m.get("shop_name") or "(negozio eliminato)",
            "merchant_email": m.get("email"),
            "zone": m.get("zone"),
            "category": m.get("category"),
            "total_signups": len(cl),
            "subscribed_count": subscribed,
            "active_subscribers": active,
            "conversion_rate": round((subscribed / len(cl)) * 100, 1) if cl else 0.0,
            "clients": clients_enriched,
        })

    # Sort: prima chi ha più abbonati attivi, poi più iscritti totali
    rows.sort(key=lambda r: (r["active_subscribers"], r["total_signups"]), reverse=True)

    return {
        "merchants": rows,
        "totals": {
            "merchants_with_referrals": len(rows),
            "total_signups": len(clients),
            "total_subscribed": len(subscribed_ids),
            "total_active": len(active_ids),
        },
    }



@api.post("/admin/discounts/{discount_id}/approve")
async def admin_approve_discount(discount_id: str, user: dict = Depends(require_admin_master)):
    now = datetime.now(timezone.utc)
    result = await db.discounts.update_one({"id": discount_id}, {"$set": {
        "approval_status": "approved",
        "approved_at": now.isoformat(),
        "locked_month": now.strftime("%Y-%m"),
        "approval_note": "",
        "force_editable": False,
    }})
    if result.matched_count == 0:
        raise HTTPException(404, "Sconto non trovato")
    d = await db.discounts.find_one({"id": discount_id})
    # Notifica il commerciante via email
    try:
        m = await db.users.find_one({"id": d.get("merchant_id")})
        if m and m.get("email"):
            await send_merchant_approved(m["email"], m.get("name") or "commerciante", m.get("shop_name") or "il tuo negozio", d.get("title") or "")
    except Exception as e:
        logging.warning(f"approve email failed: {e}")
    return {"discount": await enrich_discount(d)}


@api.post("/admin/discounts/{discount_id}/reject")
async def admin_reject_discount(discount_id: str, payload: RejectIn, user: dict = Depends(require_admin_master)):
    result = await db.discounts.update_one({"id": discount_id}, {"$set": {
        "approval_status": "rejected",
        "approval_note": payload.reason or "",
        "approved_at": None,
        "locked_month": None,
    }})
    if result.matched_count == 0:
        raise HTTPException(404, "Sconto non trovato")
    try:
        d = await db.discounts.find_one({"id": discount_id})
        m = await db.users.find_one({"id": d.get("merchant_id")}) if d else None
        if m and m.get("email"):
            await send_merchant_rejected(m["email"], m.get("name") or "commerciante", m.get("shop_name") or "il tuo negozio", d.get("title") or "", payload.reason or "")
    except Exception as e:
        logging.warning(f"reject email failed: {e}")
    return {"ok": True}


@api.post("/admin/discounts/{discount_id}/force-edit")
async def admin_force_edit(discount_id: str, user: dict = Depends(require_admin_master)):
    """Admin override: allow merchant to modify a locked offer this month."""
    result = await db.discounts.update_one({"id": discount_id},
        {"$set": {"force_editable": True, "approval_status": "pending"}})
    if result.matched_count == 0:
        raise HTTPException(404, "Sconto non trovato")
    return {"ok": True}


@api.get("/admin/merchants")
async def admin_list_merchants(user: dict = Depends(require_admin_master)):
    docs = await db.users.find({"role": "merchant"}).sort("created_at", -1).to_list(500)
    out = []
    for m in docs:
        m = {k: v for k, v in m.items() if k not in ("_id", "password_hash", "pin_hash", "webauthn_credentials", "webauthn_user_id")}
        m["approved"] = m.get("approved", True)  # default True for existing
        disc = await db.discounts.find_one({"merchant_id": m["id"]})
        m["has_discount"] = disc is not None
        if disc:
            m["discount_id"] = disc["id"]
            m["discount_title"] = disc.get("title")
            m["discount_active"] = disc.get("active", True)
        red_count = await db.redemptions.count_documents({"merchant_id": m["id"]})
        m["redemptions_count"] = red_count
        out.append(m)
    return {"merchants": out}


@api.put("/admin/merchants/{merchant_id}")
async def admin_update_merchant(merchant_id: str, payload: AdminMerchantUpdate, user: dict = Depends(require_admin_master)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(400, "Nessuna modifica")
    result = await db.users.update_one({"id": merchant_id, "role": "merchant"}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(404, "Commerciante non trovato")
    m = await db.users.find_one({"id": merchant_id})
    return {"merchant": sanitize_user(m)}


@api.delete("/admin/merchants/{merchant_id}")
async def admin_delete_merchant(merchant_id: str, user: dict = Depends(require_admin_master)):
    result = await db.users.delete_one({"id": merchant_id, "role": "merchant"})
    if result.deleted_count == 0:
        raise HTTPException(404, "Commerciante non trovato")
    await db.discounts.delete_many({"merchant_id": merchant_id})
    return {"ok": True}


@api.put("/admin/discounts/{discount_id}")
async def admin_update_discount(discount_id: str, payload: AdminDiscountUpdate, user: dict = Depends(require_admin_master)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(400, "Nessuna modifica")
    result = await db.discounts.update_one({"id": discount_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(404, "Sconto non trovato")
    d = await db.discounts.find_one({"id": discount_id})
    return {"discount": await enrich_discount(d)}


@api.delete("/admin/discounts/{discount_id}")
async def admin_delete_discount(discount_id: str, user: dict = Depends(require_admin_master)):
    result = await db.discounts.delete_one({"id": discount_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Sconto non trovato")
    return {"ok": True}


# ---------- Seeding ----------
SEED_MERCHANTS = [
    {"email": "trattoria@scontiroma.it", "name": "Marco Rossi", "shop_name": "Trattoria da Marco",
     "zone": "Trastevere", "category": "Ristorante",
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
     "zone": "Centro Storico", "category": "Bar & Caffè",
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
     "zone": "Prati", "category": "Beauty & SPA",
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
     "zone": "Testaccio", "category": "Pizzeria",
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
     "zone": "Monti", "category": "Gelateria",
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
     "zone": "EUR", "category": "Sport & Fitness",
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


async def seed_data():
    # Seed admin (optional, not used in UI heavily)
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@scontiroma.it").lower()
    admin_pw = os.environ.get("ADMIN_PASSWORD", "")
    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_pw),
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    elif admin_pw and not verify_password(admin_pw, existing_admin.get("password_hash", "")):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_pw)}})

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



# ============================================================
# Grace-period reminder scheduler
# ============================================================
# Job giornaliero: scansiona utenti con abbonamento `past_due` la cui
# `grace_expires_at` cade fra ~2 giorni (giorno 5 dei 7 di grace),
# e invia l'email #2 di ultimo promemoria. Idempotente via flag
# `grace_reminder_sent` sull'user.

from apscheduler.schedulers.asyncio import AsyncIOScheduler  # noqa: E402
from apscheduler.triggers.cron import CronTrigger  # noqa: E402

_scheduler: Optional[AsyncIOScheduler] = None


async def _run_grace_reminders() -> dict:
    """Trova utenti past_due con grace_expires_at che scade fra 36-60 ore
    (finestra centrata sul giorno 5 di 7) e invia email #2. Ritorna un
    riepilogo con `checked` e `sent`.
    """
    now = datetime.now(timezone.utc)
    window_start = (now + timedelta(hours=36)).isoformat()
    window_end = (now + timedelta(hours=60)).isoformat()

    cursor = db.subscriptions.find({
        "status": "past_due",
        "grace_expires_at": {"$gte": window_start, "$lte": window_end},
    })
    subs = await cursor.to_list(length=None)
    sent = 0
    for s in subs:
        user_id = s.get("user_id")
        grace_iso = s.get("grace_expires_at")
        if not user_id or not grace_iso:
            continue
        u = await db.users.find_one({"id": user_id})
        if not u or not u.get("email"):
            continue
        if u.get("grace_reminder_sent"):
            continue
        try:
            grace_dt = datetime.fromisoformat(grace_iso.replace("Z", "+00:00"))
            hours_left = (grace_dt - now).total_seconds() / 3600
            days_left = max(1, int(-(-hours_left // 24)))  # ceil division
        except Exception:
            days_left = 2
        try:
            await send_grace_period_reminder(
                to=u["email"],
                name=u.get("name") or "",
                grace_expires_iso=grace_iso,
                days_left=days_left,
            )
            await db.users.update_one(
                {"id": user_id},
                {"$set": {"grace_reminder_sent": True, "grace_reminder_sent_at": now.isoformat()}},
            )
            sent += 1
            logging.info(f"[grace-reminder] email inviata to={u['email']} days_left={days_left}")
        except Exception as e:
            logging.error(f"[grace-reminder] send failed for user={user_id[:8]}: {e}")
    return {"checked": len(subs), "sent": sent}


def _start_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        return
    _scheduler = AsyncIOScheduler(timezone="Europe/Rome")
    # Ogni giorno alle 10:00 ora italiana
    _scheduler.add_job(
        _run_grace_reminders,
        CronTrigger(hour=10, minute=0),
        id="grace_reminders_daily",
        replace_existing=True,
    )
    _scheduler.start()
    logging.info("[scheduler] AsyncIOScheduler avviato — grace reminders alle 10:00 Europe/Rome")


def _stop_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        try:
            _scheduler.shutdown(wait=False)
        except Exception:
            pass
        _scheduler = None



@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.discounts.create_index("merchant_id")
    await db.subscriptions.create_index("user_id")
    await db.redemptions.create_index("code", unique=True)
    await db.redemptions.create_index("merchant_id")
    await db.webauthn_challenges.create_index("expires_at", expireAfterSeconds=0)
    await db.users.create_index("webauthn_credentials.credential_id", sparse=True)
    await db.users.create_index("reset_token", sparse=True)
    await seed_data()
    await ensure_master_doc()
    _start_scheduler()


@app.on_event("shutdown")
async def on_shutdown():
    _stop_scheduler()
    client.close()


# ---------- Reviews (client → private feedback) ----------
class ReviewIn(BaseModel):
    redemption_id: str
    stars: int = Field(ge=1, le=5)
    comment: Optional[str] = ""


@api.get("/redemptions/mine")
async def my_redemptions_v2(user: dict = Depends(require_client)):
    """Lista sconti già utilizzati dall'utente con flag `reviewed`."""
    reds = await db.redemptions.find({
        "user_id": user["id"],
        "status": "redeemed",
    }).sort("redeemed_at", -1).to_list(200)
    out = []
    for r in reds:
        review = await db.reviews.find_one({"redemption_id": r["id"], "user_id": user["id"]})
        d = await db.discounts.find_one({"id": r.get("discount_id")})
        m = await db.users.find_one({"id": r.get("merchant_id")})
        out.append({
            "id": r["id"],
            "redeemed_at": r.get("redeemed_at"),
            "discount_id": r.get("discount_id"),
            "discount_title": d.get("title") if d else "-",
            "shop_name": m.get("shop_name") if m else "-",
            "reviewed": bool(review),
            "stars": review.get("stars") if review else None,
        })
    return {"redemptions": out}


@api.post("/reviews")
async def create_review(payload: ReviewIn, user: dict = Depends(require_client)):
    r = await db.redemptions.find_one({"id": payload.redemption_id, "user_id": user["id"]})
    if not r:
        raise HTTPException(404, "Redemption non trovata")
    if r.get("status") != "redeemed":
        raise HTTPException(400, "Non puoi recensire uno sconto non ancora utilizzato")
    existing = await db.reviews.find_one({"redemption_id": r["id"], "user_id": user["id"]})
    if existing:
        raise HTTPException(400, "Hai già recensito questo sconto")
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "redemption_id": r["id"],
        "discount_id": r.get("discount_id"),
        "merchant_id": r.get("merchant_id"),
        "stars": payload.stars,
        "private_comment": (payload.comment or "").strip()[:1000],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.reviews.insert_one(doc)
    return {"ok": True, "review": {k: v for k, v in doc.items() if k != "_id"}}


@api.get("/reviews/shop/{merchant_id}")
async def shop_reviews_summary(merchant_id: str):
    """Solo aggregato pubblico (nessun commento) — usato per mostrare la media sull'app."""
    cur = db.reviews.find({"merchant_id": merchant_id})
    stars = [r["stars"] async for r in cur]
    if not stars:
        return {"count": 0, "avg": None}
    return {"count": len(stars), "avg": round(sum(stars) / len(stars), 2)}


# ---------- Admin — nuove sezioni ----------
@api.get("/admin/merchants/{merchant_id}/discounts")
async def admin_merchant_discounts(merchant_id: str, user: dict = Depends(require_admin_master)):
    """Restituisce tutte le offerte (attive + storico + rifiutate) di un commerciante."""
    m = await db.users.find_one({"id": merchant_id, "role": "merchant"})
    if not m:
        raise HTTPException(404, "Commerciante non trovato")
    cur = db.discounts.find({"merchant_id": merchant_id}).sort("created_at", -1)
    items = []
    async for d in cur:
        d.pop("_id", None)
        red_count = await db.redemptions.count_documents({"discount_id": d["id"]})
        d["redemptions_count"] = red_count
        items.append(d)
    return {
        "merchant": {
            "id": m["id"], "email": m["email"], "name": m.get("name"),
            "shop_name": m.get("shop_name"), "zone": m.get("zone"),
            "category": m.get("category"), "phone": m.get("phone", ""),
            "address": m.get("address", ""),
        },
        "discounts": items,
    }


@api.get("/admin/fraud-log")
async def admin_fraud_log(user: dict = Depends(require_admin_master), limit: int = 200):
    """Registro delle scansioni fallite (schermata rossa) per anti-frode."""
    cur = db.qr_scans.find({"valid": False}).sort("timestamp", -1).limit(min(limit, 500))
    out = []
    async for s in cur:
        s.pop("_id", None)
        if not s.get("shop_name") and s.get("merchant_id"):
            m = await db.users.find_one({"id": s["merchant_id"]})
            s["shop_name"] = m.get("shop_name") if m else "-"
        out.append(s)
    return {"scans": out}


@api.get("/admin/reviews")
async def admin_reviews(user: dict = Depends(require_admin_master), limit: int = 500):
    """Tutte le recensioni in ordine cronologico. Include commenti privati (visibili solo qui)."""
    cur = db.reviews.find().sort("created_at", -1).limit(min(limit, 1000))
    out = []
    async for r in cur:
        r.pop("_id", None)
        u = await db.users.find_one({"id": r.get("user_id")})
        m = await db.users.find_one({"id": r.get("merchant_id")})
        d = await db.discounts.find_one({"id": r.get("discount_id")})
        r["user_name"] = u.get("name") if u else "-"
        r["user_email"] = u.get("email") if u else "-"
        r["shop_name"] = m.get("shop_name") if m else "-"
        r["merchant_phone"] = m.get("phone") if m else ""
        r["discount_title"] = d.get("title") if d else "-"
        out.append(r)
    return {"reviews": out}


@api.get("/admin/health")
async def admin_health(user: dict = Depends(require_admin_master)):
    """Stato di salute dei servizi critici (DB, Stripe, PayPal, Resend)."""
    import time as _t
    async def check_db():
        t0 = _t.time()
        try:
            await db.command("ping")
            return {"ok": True, "ms": round((_t.time()-t0)*1000)}
        except Exception as e:
            return {"ok": False, "error": str(e)[:100]}
    async def check_stripe():
        t0 = _t.time()
        try:
            await asyncio.to_thread(stripe.Balance.retrieve)
            return {"ok": True, "ms": round((_t.time()-t0)*1000)}
        except Exception as e:
            return {"ok": False, "error": str(e)[:100]}
    async def check_paypal():
        if not paypal_service.is_configured():
            return {"ok": False, "error": "non configurato", "warning": True}
        t0 = _t.time()
        try:
            await paypal_service._access_token()
            return {"ok": True, "ms": round((_t.time()-t0)*1000)}
        except Exception as e:
            return {"ok": False, "error": str(e)[:100]}
    async def check_resend():
        import email_service as _es
        if not _es._configured:
            return {"ok": False, "error": "non configurato", "warning": True}
        t0 = _t.time()
        try:
            async with httpx.AsyncClient(timeout=6) as c:
                r = await c.get("https://api.resend.com/domains",
                                headers={"Authorization": f"Bearer {_es.RESEND_API_KEY}"})
            return {"ok": r.status_code == 200, "ms": round((_t.time()-t0)*1000),
                    **({"error": f"HTTP {r.status_code}"} if r.status_code != 200 else {})}
        except Exception as e:
            return {"ok": False, "error": str(e)[:100]}

    results = await asyncio.gather(check_db(), check_stripe(), check_paypal(), check_resend())
    return {
        "db": results[0],
        "stripe": results[1],
        "paypal": results[2],
        "resend": results[3],
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }


@api.get("/admin/subscribers")
async def admin_subscribers(
    filter_status: Optional[str] = None,  # "active" | "cancelled" | "expired" | "all"
    q: Optional[str] = None,
    user: dict = Depends(require_admin_master),
):
    """Ritorna elenco COMPLETO di tutti gli utenti che hanno mai avuto un abbonamento,
    con log dettagliato per ognuno:
    - dati anagrafici (email, nome, provider)
    - storico abbonamenti (attivazione, cancellazione, rinnovi)
    - conteggio sconti utilizzati + breakdown per negozio

    Filtri opzionali:
    - status: filtra per stato subscription più recente
    - q: filtra per email o nome (case-insensitive)
    """
    # 1) Trova tutti gli user_id che hanno almeno una subscription
    user_ids = await db.subscriptions.distinct("user_id")
    if not user_ids:
        return {"subscribers": [], "count": 0}

    # 2) Carica users in batch
    users = await db.users.find(
        {"id": {"$in": user_ids}, "role": "client"},
        {"_id": 0, "password_hash": 0, "pin_hash": 0, "webauthn_credentials": 0, "reset_token": 0},
    ).to_list(length=None)
    user_by_id = {u["id"]: u for u in users}

    # 3) Carica tutte le subscriptions raggruppate per user_id
    all_subs = await db.subscriptions.find(
        {"user_id": {"$in": user_ids}}, {"_id": 0},
        sort=[("start_date", -1)],
    ).to_list(length=None)
    subs_by_user: dict = {}
    for s in all_subs:
        subs_by_user.setdefault(s["user_id"], []).append(s)

    # 4) Carica tutti gli eventi di rinnovo
    all_renewals = await db.renewal_events.find(
        {"user_id": {"$in": user_ids}}, {"_id": 0},
        sort=[("processed_at", -1)],
    ).to_list(length=None)
    renewals_by_user: dict = {}
    for r in all_renewals:
        renewals_by_user.setdefault(r["user_id"], []).append(r)

    # 5) Redemptions aggregate per user (solo redeemed) con breakdown per negozio
    pipeline = [
        {"$match": {"user_id": {"$in": user_ids}, "status": "redeemed"}},
        {"$group": {
            "_id": {"user_id": "$user_id", "merchant_id": "$merchant_id"},
            "count": {"$sum": 1},
            "last_redeemed_at": {"$max": "$redeemed_at"},
        }},
    ]
    redemption_aggregations = await db.redemptions.aggregate(pipeline).to_list(length=None)

    # Carica shop_name per ogni merchant_id
    merchant_ids = list({r["_id"]["merchant_id"] for r in redemption_aggregations})
    merchants = await db.users.find(
        {"id": {"$in": merchant_ids}, "role": "merchant"},
        {"_id": 0, "id": 1, "shop_name": 1, "zone": 1},
    ).to_list(length=None) if merchant_ids else []
    shop_by_id = {m["id"]: m for m in merchants}

    # Raggruppa per user_id
    redemptions_by_user: dict = {}
    for r in redemption_aggregations:
        uid = r["_id"]["user_id"]
        mid = r["_id"]["merchant_id"]
        shop = shop_by_id.get(mid, {})
        redemptions_by_user.setdefault(uid, []).append({
            "merchant_id": mid,
            "shop_name": shop.get("shop_name", "Negozio eliminato"),
            "zone": shop.get("zone"),
            "count": r["count"],
            "last_redeemed_at": r.get("last_redeemed_at"),
        })

    # 6) Costruisci risposta
    q_lower = (q or "").strip().lower()
    result = []
    for uid in user_ids:
        u = user_by_id.get(uid)
        if not u:
            continue  # user deleted
        user_subs = subs_by_user.get(uid, [])
        latest = user_subs[0] if user_subs else None
        current_status = latest.get("status") if latest else None

        # Filtro status
        if filter_status and filter_status != "all" and current_status != filter_status:
            continue
        # Filtro q
        if q_lower and q_lower not in (u.get("email") or "").lower() and q_lower not in (u.get("name") or "").lower():
            continue

        shops = redemptions_by_user.get(uid, [])
        shops.sort(key=lambda x: x["count"], reverse=True)
        total_redemptions = sum(s["count"] for s in shops)

        result.append({
            "user": {
                "id": u["id"],
                "email": u["email"],
                "name": u.get("name"),
                "phone": u.get("phone"),
                "created_at": u.get("created_at"),
                "data_scadenza_abbonamento": u.get("data_scadenza_abbonamento"),
                "consents": u.get("consents"),
            },
            "current_status": current_status,
            "latest_subscription": latest,
            "subscriptions_history": user_subs,  # completo per audit
            "renewal_events": renewals_by_user.get(uid, []),
            "renewals_count": len(renewals_by_user.get(uid, [])),
            "total_redemptions": total_redemptions,
            "shops_used": shops,  # breakdown per negozio
        })

    # Ordina: attivi prima, poi per data ultima azione
    def sort_key(r):
        s = r.get("current_status")
        status_rank = 0 if s == "active" else (1 if s == "cancelled" else 2)
        latest_ts = (r.get("latest_subscription") or {}).get("cancelled_at") \
            or (r.get("latest_subscription") or {}).get("start_date") \
            or ""
        return (status_rank, -len(latest_ts), latest_ts)
    result.sort(key=lambda r: (
        0 if r.get("current_status") == "active" else 1,
        -(len((r.get("latest_subscription") or {}).get("start_date") or "")),
    ))

    return {"subscribers": result, "count": len(result)}




# ---------- Include Router & CORS (must be LAST - after all @api.* definitions) ----------


@api.get("/")
async def root():
    return {"message": "Sconti Roma API", "status": "ok"}


# ---------- AI helper (Claude Sonnet 5 via Emergent LLM key) ----------

class DescriptionImproveIn(BaseModel):
    title: str = Field(min_length=2, max_length=140)
    description: Optional[str] = ""
    category: Optional[str] = ""
    original_price: Optional[float] = None
    discounted_price: Optional[float] = None


@api.post("/discounts/improve-description")
async def improve_description(payload: DescriptionImproveIn, user: dict = Depends(require_merchant)):
    """Genera una descrizione migliorata per uno sconto usando Claude Sonnet 5.
    Il testo è mirato al catalogo Sconti Roma (breve, invitante, senza claim ingannevoli)."""
    llm_key = os.environ.get("EMERGENT_LLM_KEY")
    if not llm_key:
        raise HTTPException(503, "AI assistant non configurato (EMERGENT_LLM_KEY mancante)")

    savings = ""
    if payload.original_price and payload.discounted_price and payload.original_price > payload.discounted_price:
        pct = round((1 - payload.discounted_price / payload.original_price) * 100)
        savings = f"Il cliente risparmia il {pct}% (da €{payload.original_price:.2f} a €{payload.discounted_price:.2f})."

    system_msg = (
        "Sei un copywriter italiano esperto di food & retail, specializzato in offerte per "
        "abbonati a una piattaforma di sconti a Roma. Il tuo compito è trasformare la descrizione "
        "grezza di un'offerta commerciale in un testo INVITANTE, CHIARO e ONESTO. "
        "REGOLE FERREE: "
        "1) Massimo 220 caratteri (2-3 righe). "
        "2) Italiano naturale, tono amichevole e locale-romano ma non volgare. "
        "3) NIENTE claim ingannevoli, superlativi vuoti tipo 'il migliore del mondo'. "
        "4) NIENTE emoji, NIENTE hashtag, NIENTE 'CLICCA ORA'. "
        "5) Metti in evidenza UN dettaglio concreto (ingrediente, tecnica, tradizione, occasione). "
        "6) NON menzionare prezzi né percentuali di sconto: sono mostrati separatamente. "
        "7) Se la descrizione originale è vuota o troppo corta, usa il titolo + categoria per inventare "
        "un dettaglio credibile ma neutro. "
        "Ritorna SOLO il testo migliorato, senza virgolette, senza preamboli."
    )

    user_prompt = f"""Titolo offerta: {payload.title}
Categoria: {payload.category or "generico"}
{savings}
Descrizione attuale (da migliorare): {payload.description or "(vuota)"}

Restituisci la nuova descrizione ottimizzata per il catalogo."""

    from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
    session_id = f"sconti-improve-{user['id'][:8]}-{uuid.uuid4().hex[:6]}"
    chat = LlmChat(
        api_key=llm_key,
        session_id=session_id,
        system_message=system_msg,
    ).with_model("anthropic", "claude-sonnet-5")

    try:
        collected = []
        async for ev in chat.stream_message(UserMessage(text=user_prompt)):
            if isinstance(ev, TextDelta):
                collected.append(ev.content)
            elif isinstance(ev, StreamDone):
                break
        improved = "".join(collected).strip().strip('"').strip("'").strip()
        # Safety: taglia a 240 caratteri hard cap
        if len(improved) > 240:
            improved = improved[:237].rsplit(" ", 1)[0] + "…"
        return {"improved_description": improved, "session_id": session_id}
    except Exception as e:
        logging.error(f"[ai-improve] failed for merchant {user['id'][:8]}: {e}")
        raise HTTPException(502, f"Errore AI: {str(e)[:120]}")


@api.get("/geocode/suggest")
async def api_geocode_suggest(q: str, limit: int = 5):
    """Endpoint pubblico per l'autocomplete indirizzi (usato dai form merchant)."""
    limit = max(1, min(limit, 10))
    return {"suggestions": await geocode_suggest(q, limit)}


# ---------- AI Image Enhancement (Gemini Nano Banana) ----------
class ImageEnhanceIn(BaseModel):
    image_url: str  # URL o data URL (base64) dell'immagine originale
    category: Optional[str] = None  # es. "Ristorante", "Palestra" — aiuta il prompt


@api.post("/ai/enhance-image")
async def ai_enhance_image(payload: ImageEnhanceIn, user: dict = Depends(require_merchant)):
    """Riottimizza una foto usando Gemini Nano Banana (image-to-image).
    Restituisce un data URL base64 pronto per essere salvato al posto dell'originale."""
    llm_key = os.environ.get("EMERGENT_LLM_KEY")
    if not llm_key:
        raise HTTPException(503, "AI enhancer non configurato (EMERGENT_LLM_KEY mancante)")

    raw_url = (payload.image_url or "").strip()
    if not raw_url:
        raise HTTPException(422, "image_url mancante")

    # Scarica l'immagine (accetta http/https e data URLs)
    import base64 as _b64
    try:
        if raw_url.startswith("data:"):
            header, b64 = raw_url.split(",", 1)
            image_bytes = _b64.b64decode(b64)
        else:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                r = await client.get(raw_url, headers={"User-Agent": "ScontiRomaBot/1.0"})
                r.raise_for_status()
                image_bytes = r.content
        if len(image_bytes) > 8 * 1024 * 1024:
            raise HTTPException(413, "Immagine troppo grande (max 8MB)")
        if len(image_bytes) < 200:
            raise HTTPException(422, "Immagine troppo piccola o non valida")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Impossibile scaricare l'immagine: {str(e)[:100]}")

    image_b64 = _b64.b64encode(image_bytes).decode("utf-8")

    # Prompt category-aware
    cat = (payload.category or "").lower()
    if any(k in cat for k in ["ristorante", "pizzeria", "bar", "aliment"]):
        style_hint = "professional food photography: warm appetizing lighting, vibrant natural colors, subtle depth of field, restaurant menu quality"
    elif any(k in cat for k in ["palestr", "padel", "calcett", "sport"]):
        style_hint = "energetic sport facility photography: bright, motivational, sharp details on equipment, professional gym magazine quality"
    elif any(k in cat for k in ["parrucch", "estetic", "spa", "benes"]):
        style_hint = "luxury beauty & wellness photography: soft warm lighting, clean composition, editorial spa magazine quality"
    elif any(k in cat for k in ["abbigl", "moda", "shop"]):
        style_hint = "fashion retail photography: crisp lighting, elegant boutique aesthetic, high-end catalog quality"
    else:
        style_hint = "professional commercial photography: bright natural lighting, vibrant colors, sharp details, magazine editorial quality"

    prompt = (
        f"Enhance and re-render this photograph in {style_hint}. "
        "STRICT rules: keep the exact same subject, layout, and composition as the input image — "
        "do NOT change the main object, do NOT add or remove elements, do NOT alter branding, logos or text. "
        "Only improve: lighting, color balance, contrast, sharpness, background cleanliness. "
        "Output must look like the same scene shot by a professional photographer with premium equipment."
    )

    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
    session_id = f"sconti-enhance-{user['id'][:8]}-{uuid.uuid4().hex[:6]}"
    chat = LlmChat(
        api_key=llm_key,
        session_id=session_id,
        system_message="You are a professional photo retoucher AI.",
    ).with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])

    try:
        _, images = await chat.send_message_multimodal_response(
            UserMessage(text=prompt, file_contents=[ImageContent(image_b64)])
        )
        if not images:
            raise HTTPException(502, "AI non ha restituito immagini. Riprova con una foto diversa.")
        img = images[0]
        mime = img.get("mime_type") or "image/png"
        data_url = f"data:{mime};base64,{img['data']}"
        return {"enhanced_image_url": data_url, "session_id": session_id, "mime_type": mime}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"[ai-enhance] failed for merchant {user['id'][:8]}: {e}")
        raise HTTPException(502, f"Errore AI: {str(e)[:120]}")


# =====================================================================
# GDPR endpoints — art. 7 (proof of consent), art. 15 (access),
# art. 17 (right to erasure), art. 20 (portability)
# =====================================================================

class CookieConsentIn(BaseModel):
    action: Literal["accept_all", "reject_all", "custom"]
    prefs: dict


@api.post("/gdpr/consent-log")
async def gdpr_consent_log(payload: CookieConsentIn, request: Request):
    """Log del consenso cookie come prova legale (art. 7 GDPR).
    Non richiede autenticazione: memorizza IP + user-agent + scelta."""
    user_id = None
    try:
        # best-effort — se l'utente è loggato lo linkiamo, altrimenti anonimo
        user = await get_current_user(request)
        user_id = user.get("id")
    except Exception:
        pass

    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "action": payload.action,
        "prefs": payload.prefs or {},
        "ip": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent", "")[:300],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await db.consent_logs.insert_one(doc)
    return {"ok": True, "id": doc["id"]}


@api.get("/gdpr/export")
async def gdpr_export(user: dict = Depends(get_current_user)):
    """Esporta tutti i dati dell'utente in formato JSON (art. 20 GDPR portabilità)."""
    uid = user["id"]

    # Fetch collections (only what belongs to this user)
    profile = await db.users.find_one({"id": uid}, {"_id": 0, "password_hash": 0, "pin_hash": 0, "reset_token": 0, "webauthn_credentials": 0})

    redemptions = await db.redemptions.find({"user_id": uid}, {"_id": 0}).to_list(length=None)
    qr_scans = await db.qr_scans.find({"user_id": uid}, {"_id": 0}).to_list(length=None)
    subscriptions = await db.subscriptions.find({"user_id": uid}, {"_id": 0}).to_list(length=None)
    consents = await db.consent_logs.find({"user_id": uid}, {"_id": 0}).to_list(length=None)

    # Merchant-specific
    discounts = []
    if user.get("role") == "merchant":
        discounts = await db.discounts.find({"merchant_id": uid}, {"_id": 0}).to_list(length=None)

    export_doc = {
        "export_generated_at": datetime.now(timezone.utc).isoformat(),
        "export_version": 1,
        "notice": "Questo file contiene tutti i tuoi dati personali trattati da Sconti Roma (art. 20 GDPR). Password, PIN e chiavi biometriche sono esclusi per motivi di sicurezza.",
        "profile": profile,
        "redemptions": redemptions,
        "qr_scans": qr_scans,
        "subscriptions": subscriptions,
        "cookie_consent_log": consents,
        "merchant_discounts": discounts,
    }
    return export_doc


@api.delete("/gdpr/delete-account")
async def gdpr_delete_account(user: dict = Depends(get_current_user), response: Response = None):
    """Cancellazione completa dell'account e di tutti i dati collegati (art. 17 GDPR).
    NB: I dati con obbligo di legge (fatturazione) vengono anonimizzati anziché cancellati."""
    uid = user["id"]

    if user.get("role") == "admin":
        raise HTTPException(400, "L'account admin non può essere cancellato via GDPR")

    # 1. Anonimizza subscriptions (obbligo fiscale 10 anni)
    await db.subscriptions.update_many(
        {"user_id": uid},
        {"$set": {"user_id": f"deleted_{uid[:8]}", "anonymized": True, "anonymized_at": datetime.now(timezone.utc).isoformat()}},
    )
    # 2. Elimina redemptions, qr_scans, consent_logs, reset_tokens
    await db.redemptions.delete_many({"user_id": uid})
    await db.qr_scans.delete_many({"user_id": uid})
    await db.consent_logs.delete_many({"user_id": uid})

    # 3. Se merchant, elimina i suoi discounts
    if user.get("role") == "merchant":
        await db.discounts.delete_many({"merchant_id": uid})

    # 4. Elimina l'utente
    await db.users.delete_one({"id": uid})

    # 5. Logout
    if response is not None:
        response.delete_cookie("access_token", path="/")
        response.delete_cookie("refresh_token", path="/")

    return {"ok": True, "message": "Account e dati collegati eliminati definitivamente."}


@api.post("/gdpr/marketing-consent")
async def gdpr_update_marketing(opt_in: bool, user: dict = Depends(get_current_user)):
    """Aggiorna il consenso marketing dell'utente (revocabile in qualunque momento)."""
    now_iso = datetime.now(timezone.utc).isoformat()
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "consents.marketing_opt_in": bool(opt_in),
                "consents.marketing_opt_in_at": now_iso if opt_in else None,
                "consents.marketing_revoked_at": None if opt_in else now_iso,
            }
        },
    )
    return {"ok": True, "marketing_opt_in": bool(opt_in)}


# =====================================================================
# QA / Testing: Simulazione rinnovo abbonamento
# =====================================================================

@api.post("/admin/simulate-payment-failed/{user_id}")
async def admin_simulate_payment_failed(
    user_id: str,
    provider: str = "stripe",
    admin: dict = Depends(require_admin_master),
):
    """Simula un evento di pagamento FALLITO al rinnovo (Stripe `invoice.payment_failed`
    o PayPal `PAYMENT.SALE.DENIED`) senza dover forzare un fallimento reale sul gateway.

    Attiva `suspend_subscription_on_payment_failed()`: la subscription passa a
    `past_due`, end_date → ora, grace_expires_at → +7 giorni.
    """
    if provider not in ("stripe", "paypal"):
        raise HTTPException(400, "provider deve essere 'stripe' o 'paypal'")
    sub = await db.subscriptions.find_one(
        {"user_id": user_id, "provider": provider},
        sort=[("start_date", -1)],
    )
    if not sub:
        sub = await db.subscriptions.find_one({"user_id": user_id}, sort=[("start_date", -1)])
    if not sub:
        raise HTTPException(400, "Utente non ha nessuna subscription — impossibile simulare")

    provider_sub_id = (
        sub.get("stripe_subscription_id") if provider == "stripe" else sub.get("paypal_subscription_id")
    ) or f"sim_{provider}_{user_id[:8]}"

    fake_event_id = f"{provider}:sim-fail:{uuid.uuid4()}"
    await suspend_subscription_on_payment_failed(
        user_id=user_id,
        provider=provider,
        provider_event_id=fake_event_id,
        provider_sub_id=provider_sub_id,
    )
    updated_sub = await db.subscriptions.find_one({"id": sub["id"]})
    updated_user = await db.users.find_one({"id": user_id})
    return {
        "ok": True,
        "simulated_event_id": fake_event_id,
        "subscription_status": updated_sub.get("status"),
        "subscription_end_date": updated_sub.get("end_date"),
        "subscription_grace_expires_at": updated_sub.get("grace_expires_at"),
        "user_subscription_status": updated_user.get("subscription_status"),
        "provider": provider,
    }


@api.post("/admin/simulate-renewal/{user_id}")
async def admin_simulate_renewal(
    user_id: str,
    provider: str = "stripe",
    price_eur: float = 3.00,
    admin: dict = Depends(require_admin_master),
):
    """Simula un evento di rinnovo (Stripe invoice.payment_succeeded o PayPal
    PAYMENT.SALE.COMPLETED) senza dover collegare Test Clocks / Webhook Simulator.

    Utile per QA: chiama la stessa `extend_subscription_on_renewal()` usata dai webhook,
    quindi la logica testata è identica a quella di produzione (idempotenza inclusa).
    """
    if provider not in ("stripe", "paypal"):
        raise HTTPException(400, "provider deve essere 'stripe' o 'paypal'")
    u = await db.users.find_one({"id": user_id})
    if not u:
        raise HTTPException(404, "Utente non trovato")

    sub = await db.subscriptions.find_one(
        {"user_id": user_id, "provider": provider},
        sort=[("start_date", -1)],
    )
    if not sub:
        sub = await db.subscriptions.find_one({"user_id": user_id}, sort=[("start_date", -1)])
    if not sub:
        raise HTTPException(400, "Utente non ha nessuna subscription — impossibile simulare rinnovo")

    provider_sub_id = (
        sub.get("stripe_subscription_id") if provider == "stripe" else sub.get("paypal_subscription_id")
    ) or f"sim_{provider}_{user_id[:8]}"

    # Ogni chiamata genera un event_id unico → sempre processato (per test manuali multipli)
    fake_event_id = f"{provider}:sim_{uuid.uuid4()}"
    email_id = await extend_subscription_on_renewal(
        user_id=user_id,
        provider=provider,
        provider_event_id=fake_event_id,
        provider_sub_id=provider_sub_id,
        price_eur=price_eur,
    )
    # Ritorna lo stato post-rinnovo
    updated_user = await db.users.find_one({"id": user_id})
    updated_sub = await db.subscriptions.find_one({"id": sub["id"]})
    return {
        "ok": True,
        "simulated_event_id": fake_event_id,
        "email_dispatched_id": email_id,
        "user_data_scadenza_abbonamento": updated_user.get("data_scadenza_abbonamento"),
        "subscription_end_date": updated_sub.get("end_date"),
        "provider": provider,
    }


@api.post("/admin/run-grace-reminders")
async def admin_run_grace_reminders(user: dict = Depends(require_admin_master)):
    """Trigger MANUALE del job di reminder (utile per QA).
    In produzione parte in automatico ogni giorno alle 10:00 Europe/Rome.
    """
    result = await _run_grace_reminders()
    return {"ok": True, **result}


@api.post("/admin/geocode-backfill")
async def admin_geocode_backfill(
    limit: int = 100,
    user: dict = Depends(require_admin_master),
):
    """Batch geocoding di TUTTI i merchant che hanno un `address` ma non hanno
    `lat`/`lng`. Rispetta il rate-limit Nominatim (1 richiesta/sec)."""
    limit = max(1, min(limit, 500))
    query = {
        "role": "merchant",
        "address": {"$exists": True, "$ne": ""},
        "$or": [
            {"lat": {"$exists": False}},
            {"lng": {"$exists": False}},
            {"lat": None},
            {"lng": None},
        ],
    }
    merchants = await db.users.find(
        query, {"_id": 0, "id": 1, "shop_name": 1, "address": 1}
    ).to_list(length=limit)

    if not merchants:
        return {
            "ok": True,
            "total": 0,
            "geocoded": 0,
            "failed": 0,
            "message": "Nessun merchant necessita geocoding.",
        }

    results = []
    geocoded_count = 0
    failed_count = 0
    now_iso = datetime.now(timezone.utc).isoformat()
    for m in merchants:
        coords = await geocode_address(m["address"])
        if coords:
            await db.users.update_one(
                {"id": m["id"]},
                {"$set": {
                    "lat": coords["lat"], "lng": coords["lng"],
                    "geocoded_at": now_iso,
                }, "$unset": {"geocode_failed": "", "geocode_failed_at": "", "geocode_failed_address": ""}},
            )
            geocoded_count += 1
            results.append({
                "id": m["id"],
                "shop_name": m.get("shop_name"),
                "address": m["address"],
                "lat": coords["lat"],
                "lng": coords["lng"],
                "status": "ok",
            })
        else:
            await db.users.update_one(
                {"id": m["id"]},
                {"$set": {
                    "geocode_failed": True,
                    "geocode_failed_at": now_iso,
                    "geocode_failed_address": m["address"],
                }},
            )
            failed_count += 1
            results.append({
                "id": m["id"],
                "shop_name": m.get("shop_name"),
                "address": m["address"],
                "status": "failed",
            })
        # Rate limit Nominatim: 1 req/sec (policy ufficiale)
        await asyncio.sleep(1.1)

    return {
        "ok": True,
        "total": len(merchants),
        "geocoded": geocoded_count,
        "failed": failed_count,
        "results": results,
    }


@api.get("/admin/merchants/geocode-issues")
async def admin_geocode_issues(user: dict = Depends(require_admin_master)):
    """Lista dei merchant che hanno un indirizzo NON geocodificabile (o mai geocodificato).
    Include sia i falliti espliciti sia quelli con address ma senza lat/lng."""
    query = {
        "role": "merchant",
        "address": {"$exists": True, "$ne": ""},
        "$or": [
            {"geocode_failed": True},
            {"lat": {"$exists": False}},
            {"lng": {"$exists": False}},
            {"lat": None},
            {"lng": None},
        ],
    }
    rows = await db.users.find(
        query,
        {"_id": 0, "id": 1, "shop_name": 1, "name": 1, "email": 1, "address": 1,
         "phone": 1, "category": 1, "zone": 1, "geocode_failed": 1,
         "geocode_failed_at": 1, "geocode_failed_address": 1, "created_at": 1},
    ).sort("geocode_failed_at", -1).to_list(length=500)
    return {"issues": rows, "count": len(rows)}


class AdminMerchantAddressIn(BaseModel):
    address: str = Field(min_length=4, max_length=300)


@api.post("/admin/merchants/{merchant_id}/geocode-retry")
async def admin_geocode_retry(
    merchant_id: str,
    payload: Optional[AdminMerchantAddressIn] = None,
    user: dict = Depends(require_admin_master),
):
    """Riprova geocoding per un singolo merchant. Se `payload.address` è
    presente, aggiorna prima l'indirizzo del merchant (utile per correzioni
    manuali). Ritorna il risultato del retry."""
    m = await db.users.find_one({"id": merchant_id, "role": "merchant"})
    if not m:
        raise HTTPException(404, "Merchant non trovato")

    new_address = (payload.address.strip() if payload else "") or m.get("address", "")
    if not new_address:
        raise HTTPException(400, "Indirizzo mancante — impossibile geocodificare")

    if payload and payload.address and payload.address.strip() != m.get("address"):
        await db.users.update_one(
            {"id": merchant_id},
            {"$set": {"address": payload.address.strip()}},
        )

    # Bypass cache per il retry — l'admin potrebbe voler ri-tentare lo stesso indirizzo
    _geocode_cache.pop(new_address.strip().lower(), None)
    coords = await geocode_address(new_address)
    now_iso = datetime.now(timezone.utc).isoformat()
    if coords:
        await db.users.update_one(
            {"id": merchant_id},
            {"$set": {"lat": coords["lat"], "lng": coords["lng"], "geocoded_at": now_iso},
             "$unset": {"geocode_failed": "", "geocode_failed_at": "", "geocode_failed_address": ""}},
        )
        return {"ok": True, "status": "geocoded", "lat": coords["lat"], "lng": coords["lng"], "address": new_address}
    else:
        await db.users.update_one(
            {"id": merchant_id},
            {"$set": {"geocode_failed": True, "geocode_failed_at": now_iso, "geocode_failed_address": new_address}},
        )
        return {"ok": False, "status": "still_failed", "address": new_address}


# ---------- Include Router & CORS (LAST) ----------
app.include_router(api)

cors_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]
if not cors_origins:
    # Non usare mai wildcard `*` con credentials — i browser rifiutano la
    # combinazione. In sviluppo locale accetta il frontend classico su :3000.
    logging.warning("CORS_ORIGINS non impostato: uso fallback dev http://localhost:3000")
    cors_origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
