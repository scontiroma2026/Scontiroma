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


async def user_has_active_sub(user_id: str) -> bool:
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


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class DiscountIn(BaseModel):
    title: str
    description: str
    original_price: float
    discounted_price: float
    image_url: Optional[str] = None
    terms: Optional[str] = ""
    active: bool = True


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


ROTATION_WINDOW_SEC = 10


def _rotating_hmac(code: str, slot: int) -> str:
    msg = f"{code}:{slot}".encode()
    return hmac_lib.new(JWT_SECRET.encode(), msg, hashlib.sha256).hexdigest()[:12]


def current_slot() -> int:
    return int(datetime.now(timezone.utc).timestamp()) // ROTATION_WINDOW_SEC


def parse_rotating_code(raw: str):
    """Return (code, slot, token) if rotating, else (code, None, None)."""
    parts = raw.strip().split("|")
    if len(parts) == 3:
        return parts[0].upper(), int(parts[1]), parts[2]
    return raw.strip().upper(), None, None


# ---------- Auth Routes ----------
@api.post("/auth/register")
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email già registrata")

    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(payload.password),
        "name": payload.name.strip(),
        "role": payload.role,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    if payload.role == "merchant":
        doc.update({
            "shop_name": payload.shop_name or payload.name,
            "zone": payload.zone or "Centro Storico",
            "category": payload.category or "Ristorante",
            "description": "",
            "address": "",
            "image_url": "",
            "phone": "",
        })
    await db.users.insert_one(doc)

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
    return {"user": user}


# ---------- PIN & WebAuthn ----------
class PinIn(BaseModel):
    pin: str = Field(min_length=4, max_length=4)


class PinLoginIn(BaseModel):
    email: EmailStr
    pin: str = Field(min_length=4, max_length=4)


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
        raise HTTPException(422, "Il PIN deve essere di 4 cifre")
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
@api.post("/auth/forgot")
async def forgot_password(payload: ForgotIn):
    email = payload.email.lower().strip()
    u = await db.users.find_one({"email": email})
    # Return same response either way (no user enumeration), but include token for demo/MVP
    if not u:
        return {"ok": True, "message": "Se l'email esiste, riceverai le istruzioni."}
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(hours=1)
    await db.users.update_one({"id": u["id"]}, {"$set": {
        "reset_token": token, "reset_expires": expires.isoformat(),
    }})
    # MVP: return token directly since no email provider is configured
    return {
        "ok": True,
        "message": "Recupero attivato. Copia il codice qui sotto per resettare la password.",
        "reset_token": token,
        "reset_link": f"{os.environ.get('FRONTEND_URL','')}/reset-password?token={token}",
    }


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
        }
    if d.get("original_price") and d.get("discounted_price") is not None:
        try:
            saving = d["original_price"] - d["discounted_price"]
            d["percent_off"] = round((saving / d["original_price"]) * 100)
        except Exception:
            d["percent_off"] = 0
    return d


@api.get("/discounts")
async def list_discounts(zone: Optional[str] = None, category: Optional[str] = None, q: Optional[str] = None):
    # Find active discounts; filter merchants after enrich
    docs = await db.discounts.find({"active": True}).to_list(500)
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
    if existing:
        data = payload.model_dump()
        data["updated_at"] = now_iso
        await db.discounts.update_one({"id": existing["id"]}, {"$set": data})
        d = await db.discounts.find_one({"id": existing["id"]})
    else:
        did = str(uuid.uuid4())
        doc = payload.model_dump()
        doc.update({
            "id": did,
            "merchant_id": user["id"],
            "created_at": now_iso,
            "updated_at": now_iso,
        })
        await db.discounts.insert_one(doc)
        d = doc
    return {"discount": await enrich_discount(d)}


@api.put("/merchants/me/profile")
async def merchant_update_profile(payload: MerchantProfileIn, user: dict = Depends(require_merchant)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
    u = await db.users.find_one({"id": user["id"]})
    return {"user": sanitize_user(u)}


@api.get("/merchants/me/stats")
async def merchant_stats(user: dict = Depends(require_merchant)):
    total = await db.redemptions.count_documents({"merchant_id": user["id"]})
    redeemed = await db.redemptions.count_documents({"merchant_id": user["id"], "status": "redeemed"})
    pending = total - redeemed
    return {"total": total, "redeemed": redeemed, "pending": pending}


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
    sub = await db.subscriptions.find_one({"user_id": user["id"], "status": "active"})
    if sub:
        sub = {k: v for k, v in sub.items() if k != "_id"}
    return {"subscription": sub, "active": sub is not None}


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


@api.post("/subscription/cancel")
async def cancel_sub(user: dict = Depends(require_client)):
    await db.subscriptions.update_many(
        {"user_id": user["id"], "status": "active"},
        {"$set": {"status": "cancelled"}}
    )
    return {"ok": True}


# ---------- Stripe Checkout (subscription €3/month) ----------
@api.post("/payments/checkout")
async def create_checkout(payload: StripeCheckoutIn, user: dict = Depends(require_client)):
    prices = stripe.Price.list(lookup_keys=[STRIPE_PRICE_LOOKUP], active=True, limit=1).data
    if not prices:
        raise HTTPException(500, "Prezzo non configurato")
    price = prices[0]
    try:
        session = stripe.checkout.Session.create(
            line_items=[{"price": price.id, "quantity": 1}],
            mode="subscription",
            success_url=f"{payload.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{payload.origin_url}/payment/cancel",
            customer_email=user["email"],
            metadata={"user_id": user["id"], "lookup_key": STRIPE_PRICE_LOOKUP},
            managed_payments={"enabled": True},
        )
    except stripe.error.InvalidRequestError as e:
        msg = (getattr(e, "user_message", "") or "").lower()
        if "managed payments" in msg or "ineligible" in msg:
            session = stripe.checkout.Session.create(
                line_items=[{"price": price.id, "quantity": 1}],
                mode="subscription",
                success_url=f"{payload.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{payload.origin_url}/payment/cancel",
                customer_email=user["email"],
                metadata={"user_id": user["id"], "lookup_key": STRIPE_PRICE_LOOKUP},
                automatic_tax={"enabled": True},
                billing_address_collection="required",
            )
        else:
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


async def mark_subscription_paid(session, user_id: str):
    now = datetime.now(timezone.utc)
    end = now + timedelta(days=30)
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
        "stripe_session_id": session.get("id") if isinstance(session, dict) else session.id,
        "stripe_subscription_id": (session.get("subscription") if isinstance(session, dict) else session.subscription),
        "provider": "stripe",
    })


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
    elif t == "customer.subscription.deleted":
        sub_id = obj.get("id")
        await db.subscriptions.update_many(
            {"stripe_subscription_id": sub_id, "status": "active"},
            {"$set": {"status": "cancelled"}}
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

    # Reuse existing pending redemption for same discount if any (last 24h)
    existing = await db.redemptions.find_one({
        "user_id": user["id"],
        "discount_id": discount_id,
        "status": "pending",
    })
    if existing:
        existing = {k: v for k, v in existing.items() if k != "_id"}
        return {"redemption": existing}

    code = gen_code(8)
    doc = {
        "id": str(uuid.uuid4()),
        "code": code,
        "user_id": user["id"],
        "discount_id": discount_id,
        "merchant_id": d["merchant_id"],
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "redeemed_at": None,
    }
    await db.redemptions.insert_one(doc)
    return {"redemption": {k: v for k, v in doc.items() if k != "_id"}}


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
    return {
        "code": r["code"],
        "slot": slot,
        "token": token,
        "qr_value": f"{r['code']}|{slot}|{token}",
        "expires_in": ROTATION_WINDOW_SEC - (int(datetime.now(timezone.utc).timestamp()) % ROTATION_WINDOW_SEC),
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


ADMIN_MASTER_PASSWORD = os.environ.get("ADMIN_MASTER_PASSWORD", "")
ADMIN_MASTER_TTL_MIN = 60


def _sign_master(user_id: str, exp: datetime) -> str:
    return jwt.encode({"sub": user_id, "typ": "admin_master", "exp": exp}, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _verify_master_token(token: str, user_id: str) -> bool:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get("typ") == "admin_master" and payload.get("sub") == user_id
    except Exception:
        return False


def require_admin_master(request: Request, user: dict = Depends(require_admin)) -> dict:
    token = request.cookies.get("admin_master_token") or request.headers.get("X-Admin-Master", "")
    if not token or not _verify_master_token(token, user["id"]):
        raise HTTPException(403, "Master password richiesta")
    return user


class MasterVerifyIn(BaseModel):
    password: str


@api.post("/admin/verify-master")
async def admin_verify_master(payload: MasterVerifyIn, response: Response, user: dict = Depends(require_admin)):
    if not ADMIN_MASTER_PASSWORD or payload.password != ADMIN_MASTER_PASSWORD:
        raise HTTPException(401, "Master password errata")
    exp = datetime.now(timezone.utc) + timedelta(minutes=ADMIN_MASTER_TTL_MIN)
    token = _sign_master(user["id"], exp)
    response.set_cookie(
        "admin_master_token", token,
        max_age=ADMIN_MASTER_TTL_MIN * 60,
        httponly=True, secure=True, samesite="none", path="/",
    )
    return {"ok": True, "token": token, "expires_in": ADMIN_MASTER_TTL_MIN * 60}


@api.post("/admin/logout-master")
async def admin_logout_master(response: Response):
    response.delete_cookie("admin_master_token", path="/")
    return {"ok": True}


@api.get("/admin/session")
async def admin_session(request: Request, user: dict = Depends(require_admin)):
    token = request.cookies.get("admin_master_token") or request.headers.get("X-Admin-Master", "")
    verified = bool(token and _verify_master_token(token, user["id"]))
    return {"master_verified": verified}


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
    if not await db.users.find_one({"email": admin_email}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(os.environ.get("ADMIN_PASSWORD", "admin123")),
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

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
            })


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


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


# ---------- Include Router & CORS ----------
app.include_router(api)

cors_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@api.get("/")
async def root():
    return {"message": "Sconti Roma API", "status": "ok"}
