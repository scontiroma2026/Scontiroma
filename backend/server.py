from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import secrets
import string
import uuid
from datetime import datetime, timezone, timedelta, date
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from zoneinfo import ZoneInfo
from typing import List, Optional, Literal

import bcrypt
import base64
import re
import binascii
from html import escape as html_escape
import hmac as hmac_lib
import hashlib
import calendar
import json as _json
import stripe
import jwt
import asyncio
import time
import httpx
import ipaddress
import socket
from urllib.parse import urlparse, urljoin
from email_service import (
    send_password_reset,
    send_preferito_nuova_offerta,
    send_merchant_approved,
    send_merchant_rejected,
    send_monthly_discounts_notification,
    send_renewal_receipt,
    send_payment_failed_immediate,
    send_grace_period_reminder,
    send_subscription_cancelled,
    send_master_reset,
    send_next_offer_reminder,
    send_offer_expired,
    send_admin_month_summary,
    send_welcome_client,
    send_welcome_merchant,
    send_admin_new_merchant,
    send_admin_new_offer,
    send_account_deleted,
)
import paypal_service
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse, HTMLResponse, RedirectResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError
from pydantic import BaseModel, EmailStr, Field, model_validator
from webauthn import (
    generate_registration_options, verify_registration_response,
    generate_authentication_options, verify_authentication_response,
    options_to_json,
)
from webauthn.helpers.structs import (
    AuthenticatorAttachment, AuthenticatorSelectionCriteria,
    ResidentKeyRequirement, UserVerificationRequirement,
    PublicKeyCredentialDescriptor, AuthenticatorTransport,
)


# ---------- Setup ----------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
ACCESS_TTL_MIN = 60 * 24  # 1 day
REFRESH_TTL_DAYS = 7

# Abbonamento del cliente. Spento (predefinito) = l'app è gratuita per i clienti:
# QR e riscatti senza abbonamento, nessun nuovo pagamento, webhook senza effetti,
# promemoria di pagamento spenti. Acceso ("true") = tutto torna come prima.
def client_subscription_required() -> bool:
    return os.environ.get("CLIENT_SUBSCRIPTION_REQUIRED", "false").strip().lower() in ("1", "true", "yes", "on")


# Stripe
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or None
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
STRIPE_PRICE_LOOKUP = "sconti_roma_monthly_299eur"

# WebAuthn
def _webauthn_origins(raw: str) -> list:
    """Origini accettate per Face ID / impronta, normalizzate come le invia il browser:
    senza spazi e senza barra finale ("https://scontiroma.it/" -> "https://scontiroma.it").
    Se ne possono indicare più di una separate da virgola."""
    return [o.strip().rstrip("/") for o in (raw or "").split(",") if o.strip().rstrip("/")]


def _webauthn_rp_id(raw: str) -> str:
    """RP ID = solo il dominio: tollera "https://", barra finale e maiuscole."""
    rp = (raw or "").strip().lower()
    if "://" in rp:
        rp = urlparse(rp).hostname or ""
    return rp.strip("/")


WEBAUTHN_RP_ID = _webauthn_rp_id(os.environ.get("WEBAUTHN_RP_ID", "localhost")) or "localhost"
WEBAUTHN_ORIGIN = _webauthn_origins(os.environ.get("WEBAUTHN_ORIGIN", "http://localhost:3000")) or ["http://localhost:3000"]
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
# Versione corrente di Termini, Privacy e Cookie Policy accettati alla registrazione.
# Unico punto da aggiornare quando cambiano i testi legali (es. "2026-11").
LEGAL_VERSION = "2026-10"

# Zone di Roma e dintorni (decisione dell'utente dell'08/10): iscrizione, filtri e mappa.
# Il menu mostra solo 16 aree (senza i singoli quartieri, che sono troppi). Per ogni area:
# valore salvato sul commerciante, titolo del menu e quartieri compresi (servono solo per il
# filtro, così i commercianti già registrati con un quartiere si trovano nella loro area).
# Le prime attività da cercare restano Garbatella, San Paolo e Marconi, ma l'app è aperta a tutta Roma.
ZONE_AREE = [
    ('Centro storico', 'Centro storico · Prati, Trastevere, Monti', [
        "Centro Storico", "Aventino", "Borgo", "Campitelli", "Campo Marzio", "Castro Pretorio", "Celio", "Colonna", "Esquilino", "Ludovisi", "Monti", "Parione", "Pigna", "Ponte", "Prati", "Regola", "Ripa", "San Saba", "Sallustiano", "Sant'Eustachio", "Testaccio", "Trastevere", "Trevi",
    ]),
    ('Parioli', 'Parioli · Nomentano, San Lorenzo, Trieste', [
        "Africano", "Bologna", "Flaminio", "Parioli", "Pinciano", "Policlinico", "Salario", "San Lorenzo", "Trieste", "Nomentano", "Villa Ada", "Villaggio Olimpico",
    ]),
    ('Monte Sacro', "Monte Sacro · Talenti, Conca d'Oro, Serpentara", [
        "Bufalotta", "Casal Boccone", "Castel Giubileo", "Città Giardino", "Conca d'Oro", "Fidene", "Monte Sacro", "Porta di Roma", "Sacco Pastore", "Serpentara", "Settebagni", "Talenti", "Tufello", "Val Melaina", "Vigne Nuove",
    ]),
    ('Tiburtino', 'Tiburtino · Pietralata, Rebibbia, San Basilio', [
        "Casal de' Pazzi", "Casal Monastero", "Colli Aniene", "Pietralata", "Ponte Mammolo", "Portonaccio", "Rebibbia", "San Basilio", "Settecamini", "Tiburtino", "Tor Cervara",
    ]),
    ('Prenestino', 'Prenestino · Centocelle, Pigneto, Tor Pignattara', [
        "Alessandrino", "Casilino", "Centocelle", "La Rustica", "Pigneto", "Prenestino", "Quarticciolo", "Tor Pignattara", "Tor Sapienza", "Tor Tre Teste", "Villa Gordiani",
    ]),
    ('Tor Bella Monaca', 'Tor Bella Monaca · Torre Angela, Lunghezza', [
        "Borghesiana", "Finocchio", "Giardinetti", "Lunghezza", "Tor Bella Monaca", "Tor Vergata", "Torre Angela", "Torre Gaia", "Torre Maura",
    ]),
    ('Appio', 'Appio · Tuscolano, Cinecittà, San Giovanni', [
        "Appio Claudio", "Appio Latino", "Appio Pignatelli", "Capannelle", "Cinecittà", "Colli Albani", "Don Bosco", "Furio Camillo", "Quadraro", "Re di Roma", "San Giovanni", "Tor Fiscale", "Torre Spaccata", "Tuscolano",
    ]),
    ('Garbatella', 'Garbatella · Ostiense, San Paolo', [
        "Appia Antica", "Ardeatino", "Garbatella", "Grottaperfetta", "Montagnola", "Navigatori", "Ostiense", "San Paolo", "Tor Marancia",
    ]),
    ('EUR', 'EUR · Laurentino, Spinaceto, Torrino', [
        "Cecchignola", "Decima", "EUR", "Fonte Meravigliosa", "Giuliano-Dalmata", "Laurentino", "Mostacciano", "Spinaceto", "Tor de' Cenci", "Torrino", "Tre Fontane",
    ]),
    ('Ostia', 'Ostia · Acilia, Infernetto, Casal Palocco', [
        "Acilia", "Axa", "Casal Palocco", "Castel Fusano", "Dragona", "Infernetto", "Malafede", "Ostia Antica", "Ostia Lido", "Vitinia",
    ]),
    ('Portuense', 'Portuense · Marconi, Magliana, Trullo', [
        "Casetta Mattei", "Corviale", "Magliana", "Marconi", "Muratella", "Ponte Galeria", "Poggio Verde", "Portuense", "Trullo",
    ]),
    ('Monteverde', 'Monteverde · Gianicolense, Pisana', [
        "Bravetta", "Colli Portuensi", "Gianicolense", "Gianicolo", "Monteverde", "Pisana", "Villa Pamphilj",
    ]),
    ('Aurelio', 'Aurelio · Boccea, Primavalle, Casalotti', [
        "Aurelio", "Boccea", "Casalotti", "Cornelia", "Monte Spaccato", "Primavalle", "Selva Candida", "Torrevecchia", "Valle Aurelia",
    ]),
    ('Monte Mario', 'Monte Mario · Trionfale, Balduina, Ottavia', [
        "Balduina", "Camilluccia", "Cipro", "Giustiniana", "Medaglie d'Oro", "Monte Mario", "Ottavia", "Pineta Sacchetti", "Santa Maria della Pietà", "Trionfale",
    ]),
    ('Cassia', 'Cassia · Flaminia, Ponte Milvio, La Storta', [
        "Cassia", "Cesano", "Due Ponti", "Grottarossa", "Isola Farnese", "La Storta", "Labaro", "Olgiata", "Ponte Milvio", "Prima Porta", "Saxa Rubra", "Tor di Quinto", "Vigna Clara",
    ]),
    ('Fuori Roma', 'Fuori Roma · Fiumicino, Castelli Romani', [
        "Albano Laziale", "Anzio", "Bracciano", "Castelli Romani", "Ciampino", "Fiumicino", "Frascati", "Fregene", "Genzano di Roma", "Grottaferrata", "Guidonia Montecelio", "Maccarese", "Marino", "Monterotondo", "Nettuno", "Pomezia", "Tivoli", "Altra zona di Roma e dintorni",
    ]),
]
ZONES = [valore for valore, _, _ in ZONE_AREE]


def _zona_corrisponde(zona_negozio: Optional[str], filtro: str) -> bool:
    """Vero se la zona del negozio coincide con l'area scelta (o è un quartiere compreso nell'area)."""
    if (zona_negozio or "") == filtro:
        return True
    for valore, _, membri in ZONE_AREE:
        if valore == filtro:
            return (zona_negozio or "") in membri
    return False

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


# Campi che non devono mai uscire dal server (hash, token monouso, contatori di sicurezza).
_PRIVATE_USER_FIELDS = (
    "_id", "password_hash", "pin_hash", "master_hash", "recovery_id_hash",
    "reset_token", "reset_expires", "reset_req_log",
    "pin_reset_code_hash", "pin_reset_expires", "pin_reset_attempts", "pin_reset_req_log",
    "login_failed_attempts", "pin_failed_attempts", "recovery_failed_attempts",
    "webauthn_credentials", "webauthn_user_id",
    # PIN rimosso il 03/10: i campi possono restare negli account vecchi finché non rientrano.
    "pin_set", "pin_locked_until",
)


def sanitize_user(u: dict) -> dict:
    if not u:
        return u
    u = dict(u)
    # Per la pagina Sicurezza basta sapere quanti dispositivi Face ID sono registrati.
    u["biometric_devices"] = len(u.get("webauthn_credentials") or [])
    for k in _PRIVATE_USER_FIELDS:
        u.pop(k, None)
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


async def _expire_stale_active_subscriptions(user_id: str) -> None:
    """Cleanup lazy: senza un vero rinnovo (Stripe/PayPal non configurati, o
    provider offline), un abbonamento 'active' resta scritto così anche dopo
    che end_date è passata — nessun evento arriva a correggerlo da solo.
    Qui lo marchiamo 'expired' non appena qualcuno guarda quell'utente, così la
    pagina account non mostra più 'Attivo' con una data già passata."""
    now_iso = datetime.now(timezone.utc).isoformat()
    await db.subscriptions.update_many(
        {"user_id": user_id, "status": "active", "end_date": {"$lt": now_iso}},
        {"$set": {"status": "expired", "expired_at": now_iso}},
    )


async def user_has_active_sub(user_id: str) -> bool:
    # Cleanup lazy: se la grace di 7gg è scaduta, marca la sub come cancellata;
    # se l'abbonamento è scaduto senza rinnovo, marcalo 'expired'.
    await _cancel_expired_grace(user_id)
    await _expire_stale_active_subscriptions(user_id)
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
    # Solo commercianti: approvazione specifica delle clausole dei Termini (artt. 1341-1342 c.c.)
    legal_specific_accepted: Optional[bool] = False
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
    # Sezioni informative stile Groupon (tutte opzionali)
    plan_ahead: Optional[str] = ""       # "Pianifica in anticipo" (disdetta, prenotazione)
    validity_info: Optional[str] = ""    # "Inclusioni ed esclusioni" (giorni/orari validità)
    additional_info: Optional[str] = ""  # "Informazioni aggiuntive"
    active: bool = True
    # Numero massimo di volte che uno stesso abbonato può usare lo sconto nel mese in corso.
    # Default 1. Massimo 10 per prevenire abusi.
    max_uses_per_month: int = Field(default=1, ge=1, le=10)

    @model_validator(mode="after")
    def _prezzi_validi(self):
        # Lo sconto deve essere uno sconto vero: prezzi positivi e scontato minore del pieno.
        if self.original_price <= 0 or self.discounted_price <= 0:
            raise ValueError("I prezzi devono essere maggiori di zero")
        if self.discounted_price >= self.original_price:
            raise ValueError("Il prezzo scontato deve essere più basso del prezzo pieno")
        return self

    def cleaned(self) -> dict:
        d = self.model_dump()
        for k in ("title", "description", "image_url", "terms", "plan_ahead", "validity_info", "additional_info"):
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
    shop_description: Optional[str] = Field(None, max_length=1500)
    zone: Optional[str] = None
    category: Optional[str] = None
    address: Optional[str] = None
    image_url: Optional[str] = None
    phone: Optional[str] = None


# ---------- Orari del negozio (li scrive il commerciante) ----------
GIORNI_SETTIMANA = ["lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica"]
_ORA_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


class FasciaOraria(BaseModel):
    apre: str
    chiude: str  # se è prima dell'apertura, la fascia finisce dopo mezzanotte (es. 19:30–01:00)


class GiornoOrari(BaseModel):
    chiuso: bool = False
    fasce: List[FasciaOraria] = []


class OrariIn(BaseModel):
    giorni: List[GiornoOrari]  # 7 giorni, da lunedì a domenica
    chiusura_straordinaria: bool = False
    nota_chiusura: Optional[str] = Field(None, max_length=120)

    @model_validator(mode="after")
    def _controlla(self):
        if len(self.giorni) != 7:
            raise ValueError("Servono gli orari di tutti e 7 i giorni")
        for nome, g in zip(GIORNI_SETTIMANA, self.giorni):
            if g.chiuso:
                g.fasce = []
                continue
            if not 1 <= len(g.fasce) <= 2:
                raise ValueError(f"{nome.capitalize()}: indica una o due fasce orarie, oppure «Chiuso»")
            for f in g.fasce:
                if not (_ORA_RE.match(f.apre) and _ORA_RE.match(f.chiude)) or f.apre == f.chiude:
                    raise ValueError(f"{nome.capitalize()}: orario non valido")
        return self


def stato_orari(orari: Optional[dict], ora: datetime) -> Optional[dict]:
    """«Aperto ora · chiude alle 23:00» oppure «Chiuso · apre domani alle 12:30»."""
    if not orari or not orari.get("giorni"):
        return None
    if orari.get("chiusura_straordinaria"):
        return {"aperto": False, "testo": "Chiuso temporaneamente", "nota": orari.get("nota_chiusura") or ""}
    settimana = 7 * 1440
    minuti = lambda hhmm: int(hhmm[:2]) * 60 + int(hhmm[3:])
    fasce = []
    for d, g in enumerate(orari["giorni"]):
        if g.get("chiuso"):
            continue
        for f in g.get("fasce") or []:
            a, c = minuti(f["apre"]), minuti(f["chiude"])
            inizio = d * 1440 + a
            fasce.append((inizio, d * 1440 + c + (1440 if c <= a else 0)))
    if not fasce:
        return {"aperto": False, "testo": "Chiuso", "nota": ""}
    t = ora.weekday() * 1440 + ora.hour * 60 + ora.minute
    hhmm = lambda m: f"{(m % 1440) // 60:02d}:{m % 60:02d}"
    for inizio, fine in fasce:
        for tt in (t, t + settimana):
            if inizio <= tt < fine:
                return {"aperto": True, "testo": f"Aperto ora · chiude alle {hhmm(fine)}", "nota": ""}
    prossima = min((i if i > t else i + settimana) for i, _ in fasce)
    giorni_dopo = prossima // 1440 - t // 1440
    quando = ("oggi" if giorni_dopo == 0 else "domani" if giorni_dopo == 1
              else GIORNI_SETTIMANA[(prossima // 1440) % 7])
    return {"aperto": False, "testo": f"Chiuso · apre {quando} alle {hhmm(prossima)}", "nota": ""}


class StripeCheckoutIn(BaseModel):
    # Ignorato: gli indirizzi di ritorno da Stripe vengono da FRONTEND_URL, non dal browser
    # (altrimenti chiunque potrebbe far tornare il cliente su un sito qualsiasi).
    origin_url: Optional[str] = None


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


def _rome_now() -> datetime:
    """Ora di Roma (funzione a parte così i test possono fissare il giorno)."""
    return datetime.now(ZoneInfo("Europe/Rome"))


def current_month_key() -> str:
    # Mese di Roma (prima era UTC: il 1° tra mezzanotte e l'1/le 2 risultava ancora il mese prima).
    return _rome_now().strftime("%Y-%m")


def _admin_notify_to() -> str:
    """Indirizzo a cui arrivano gli avvisi per l'admin."""
    return os.environ.get("ADMIN_NOTIFY_EMAIL") or os.environ.get("ADMIN_EMAIL", "")


def _email_in_background(coro, label: str) -> None:
    """Invia un'email senza far aspettare chi usa l'app; un errore finisce solo nei log."""
    async def run():
        try:
            await coro
        except Exception as e:
            logging.warning(f"[email:{label}] non inviata: {e}")
    asyncio.create_task(run())


# ---------- Offerta Mese Prossimo: helpers ----------
NEXT_OFFER_WINDOW_DAYS = 7

MESI_IT = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
           "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"]

DISCOUNT_CONTENT_FIELDS = ("title", "description", "original_price", "discounted_price",
                           "image_url", "image_urls", "terms", "plan_ahead", "validity_info",
                           "additional_info", "active", "max_uses_per_month")

MOTIVI_ARCHIVIO = {
    "replaced_by_next_month": "Scaduta",
    "expired_no_replacement": "Scaduta",
    "withdrawn_no_renew": "Ritirata",
    "rejected": "Rifiutata",
    "deleted_by_admin": "Eliminata",
}


async def _archivia(doc: dict, motivo: str) -> None:
    """Copia nell'archivio una versione dell'offerta; ogni copia ha il suo archivio_id
    (l'id dell'offerta resta lo stesso da un mese all'altro)."""
    copia = {k: v for k, v in doc.items() if k != "_id"}
    copia.update({"archivio_id": str(uuid.uuid4()), "archived_at": datetime.now(timezone.utc).isoformat(),
                  "archive_reason": motivo})
    await db.discounts_archive.insert_one(copia)


def next_month_key() -> str:
    now = _rome_now()
    y, m = (now.year + 1, 1) if now.month == 12 else (now.year, now.month + 1)
    return f"{y}-{m:02d}"


def month_label_it(key: str) -> str:
    y, m = key.split("-")
    return f"{MESI_IT[int(m) - 1]} {y}"


async def next_offer_window() -> dict:
    """Finestra caricamento offerta mese prossimo: ultimi 7 giorni del mese corrente.
    Override manuale admin via db.settings {key: 'next_offer_window_override'}."""
    now = _rome_now()
    last_day = calendar.monthrange(now.year, now.month)[1]
    opens_day = last_day - (NEXT_OFFER_WINDOW_DAYS - 1)
    is_open = now.day >= opens_day
    override = await db.settings.find_one({"key": "next_offer_window_override"})
    overridden = bool(override and isinstance(override.get("value"), bool))
    if overridden:
        is_open = override["value"]
    nk = next_month_key()
    return {
        "open": is_open,
        "overridden": overridden,
        "opens_on": f"{opens_day:02d}/{now.month:02d}/{now.year}",
        "days_to_month_end": last_day - now.day,
        "current_month": current_month_key(),
        "next_month": nk,
        "next_month_label": month_label_it(nk),
    }


# ---------- Auth Routes ----------
@api.post("/auth/register")
async def register(payload: RegisterIn, response: Response):
    # Termini, Privacy e Cookie Policy vanno accettati: il sito lo impone già, il server ora lo verifica.
    # Gli account demo/admin creati all'avvio (seed_data) non passano da qui e non sono toccati.
    if not payload.legal_accepted:
        raise HTTPException(400, "Devi accettare Termini, Privacy e Cookie Policy per registrarti")
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
            "legal_version": LEGAL_VERSION if payload.legal_accepted else None,
            "legal_specific_accepted": bool(payload.legal_specific_accepted and payload.role == "merchant"),
            "legal_specific_accepted_at": now_iso if (payload.legal_specific_accepted and payload.role == "merchant") else None,
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
            "zone": (payload.zone or "Centro storico").strip(),
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

    # Email di benvenuto e, per i commercianti, avviso all'admin (in background)
    if payload.role == "merchant":
        _email_in_background(send_welcome_merchant(email, doc.get("name") or "", doc.get("shop_name") or ""), "benvenuto-commerciante")
        if _admin_notify_to():
            _email_in_background(send_admin_new_merchant(_admin_notify_to(), doc.get("shop_name") or "", doc.get("category") or "",
                                                         doc.get("zone") or "", email, doc.get("phone") or ""), "admin-nuovo-commerciante")
    else:
        _email_in_background(send_welcome_client(email, doc.get("name") or ""), "benvenuto-cliente")

    access = create_token(user_id, email, "access")
    refresh = create_token(user_id, email, "refresh")
    set_auth_cookies(response, access, refresh)
    return {"user": sanitize_user(doc), "access_token": access}


LOGIN_MAX_ATTEMPTS = 5
LOGIN_LOCK_MINUTES = 15


async def _register_login_failure(email: str) -> None:
    """Contatore di tentativi falliti per account, stesso pattern usato per la
    master password admin. Dopo LOGIN_MAX_ATTEMPTS tentativi, blocca l'account
    per LOGIN_LOCK_MINUTES minuti (anti brute-force). Incremento e lettura in
    un'unica operazione atomica."""
    u = await db.users.find_one_and_update(
        {"email": email},
        {"$inc": {"login_failed_attempts": 1}},
        return_document=ReturnDocument.AFTER,
    )
    if (u or {}).get("login_failed_attempts", 0) >= LOGIN_MAX_ATTEMPTS:
        until = (datetime.now(timezone.utc) + timedelta(minutes=LOGIN_LOCK_MINUTES)).isoformat()
        await db.users.update_one(
            {"email": email},
            {"$set": {"login_locked_until": until, "login_failed_attempts": 0}},
        )


# Dati del vecchio PIN (rimosso il 03/10): si cancellano dall'account al primo accesso.
_OLD_PIN_FIELDS = {f: "" for f in (
    "pin_hash", "pin_set", "pin_failed_attempts", "pin_locked_until",
    "pin_reset_code_hash", "pin_reset_expires", "pin_reset_attempts", "pin_reset_req_log")}


@api.post("/auth/login")
async def login(payload: LoginIn, response: Response):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if user:
        _lock_check(user, "login_locked_until")
    else:
        guard = await db.login_guard.find_one({"key": _login_guard_key(email)})
        if guard:
            _lock_check(guard, "locked_until")
    # Con un'email sconosciuta si fa lo stesso lavoro (hash fittizio) e vale lo stesso limite
    # di 5 tentativi: la risposta non rivela se l'account esiste.
    ok = verify_password(payload.password, user["password_hash"] if user else _DUMMY_PASSWORD_HASH)
    if not user or not ok:
        if user:
            await _register_login_failure(email)
        else:
            await _login_guard_fail(email)
        raise HTTPException(401, "Credenziali non valide")

    await db.users.update_one(
        {"email": email},
        {"$set": {"login_failed_attempts": 0, "login_locked_until": None}, "$unset": _OLD_PIN_FIELDS},
    )
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
    return {"user": {**user, "has_active_subscription": has_sub,
                     "subscription_required": client_subscription_required()}}


# ---------- WebAuthn (Face ID) ----------
class WebAuthnCompleteIn(BaseModel):
    credential: dict


class WebAuthnLoginBeginIn(BaseModel):
    email: EmailStr


class ForgotIn(BaseModel):
    email: EmailStr


class ResetIn(BaseModel):
    token: str
    new_password: str = Field(min_length=6)


RESET_REQ_MIN_GAP_SEC = 60
RESET_REQ_MAX_PER_HOUR = 5


async def _reset_request_allowed(user: dict, key: str) -> bool:
    """Anti-abuso sulle richieste di reset della password: almeno RESET_REQ_MIN_GAP_SEC
    secondi tra due richieste e al massimo RESET_REQ_MAX_PER_HOUR all'ora, per account.
    Evita di inondare di email un utente e di consumare il limite giornaliero di Resend."""
    now = datetime.now(timezone.utc)
    stamps = []
    for raw in (user.get(key) or []):
        try:
            t = datetime.fromisoformat(raw)
        except Exception:
            continue
        if (now - t).total_seconds() < 3600:
            stamps.append(t)
    stamps.sort()
    if stamps and (now - stamps[-1]).total_seconds() < RESET_REQ_MIN_GAP_SEC:
        return False
    if len(stamps) >= RESET_REQ_MAX_PER_HOUR:
        return False
    stamps.append(now)
    await db.users.update_one({"id": user["id"]}, {"$set": {key: [t.isoformat() for t in stamps]}})
    return True


# Hash bcrypt di una password che nessuno può avere: con un'email sconosciuta il login fa
# lo stesso lavoro (e ci mette lo stesso tempo) di quando l'account esiste.
_DUMMY_PASSWORD_HASH = hash_password(secrets.token_hex(16))


def _login_guard_key(email: str) -> str:
    # Si conserva solo l'impronta dell'email digitata, non l'email: può non essere di nessuno.
    return hashlib.sha256(email.encode()).hexdigest()


async def _login_guard_fail(email: str) -> None:
    """Accesso fallito per un'email senza account: stesso limite (LOGIN_MAX_ATTEMPTS, poi
    blocco di LOGIN_LOCK_MINUTES) degli account veri, così il comportamento è identico."""
    now = datetime.now(timezone.utc)
    doc = await db.login_guard.find_one_and_update(
        {"key": _login_guard_key(email)},
        {"$inc": {"failed_attempts": 1}, "$set": {"expires_at": now + timedelta(days=1)}},
        upsert=True, return_document=ReturnDocument.AFTER,
    )
    if doc and doc.get("failed_attempts", 0) >= LOGIN_MAX_ATTEMPTS:
        await db.login_guard.update_one({"key": doc["key"]}, {"$set": {
            "locked_until": (now + timedelta(minutes=LOGIN_LOCK_MINUTES)).isoformat(),
            "failed_attempts": 0}})


def _transports(raw) -> Optional[List[AuthenticatorTransport]]:
    """I transports salvati nel DB sono stringhe ("internal", "hybrid"...): la libreria
    vuole i valori dell'enum, altrimenti /login/begin va in errore 500 appena il telefono
    li ha comunicati (cioè sempre su iPhone). I valori sconosciuti vengono ignorati."""
    out = []
    for t in raw or []:
        try:
            out.append(AuthenticatorTransport(t))
        except ValueError:
            pass
    return out or None


async def _verify_with_challenge(user_id: str, kind: str, verify):
    """Verifica la risposta biometrica con le sfide ancora valide dell'utente, dalla più
    recente. Se /begin è stato chiamato più volte (doppio tocco, nuovo tentativo dopo un
    annullamento) restano più sfide: prima veniva presa una qualsiasi, spesso la vecchia,
    e la verifica falliva. Le sfide provate vengono poi cancellate (sono monouso).
    Ritorna (risultato, errore); (None, None) se non c'è nessuna sfida valida."""
    chs = await db.webauthn_challenges.find({
        "user_id": user_id, "kind": kind,
        "expires_at": {"$gt": datetime.now(timezone.utc)},
    }).sort("expires_at", -1).to_list(length=10)
    if not chs:
        return None, None
    result, err = None, None
    for ch in chs:
        try:
            result = verify(unb64u(ch["challenge"]))
            break
        except Exception as exc:  # sfida sbagliata o risposta non valida: prova la successiva
            err = exc
    await db.webauthn_challenges.delete_many({"_id": {"$in": [c["_id"] for c in chs]}})
    return result, err


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
    v, err = await _verify_with_challenge(user["id"], "register", lambda challenge: verify_registration_response(
        credential=payload.credential,
        expected_challenge=challenge,
        expected_rp_id=WEBAUTHN_RP_ID,
        expected_origin=WEBAUTHN_ORIGIN,
        require_user_verification=False,
    ))
    if v is None and err is None:
        raise HTTPException(400, "Sessione scaduta, riprova")
    if v is None:
        raise HTTPException(400, f"Registrazione biometrica fallita: {err}")
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
        id=unb64u(c["credential_id"]), transports=_transports(c.get("transports")))
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
    cred = next(c for c in u["webauthn_credentials"] if c["credential_id"] == cid)
    v, err = await _verify_with_challenge(u["id"], "login", lambda challenge: verify_authentication_response(
        credential=payload.credential,
        expected_challenge=challenge,
        expected_rp_id=WEBAUTHN_RP_ID,
        expected_origin=WEBAUTHN_ORIGIN,
        credential_public_key=unb64u(cred["public_key"]),
        credential_current_sign_count=cred.get("sign_count", 0),
        require_user_verification=False,
    ))
    if v is None and err is None:
        raise HTTPException(401, "Sessione scaduta, riprova")
    if v is None:
        raise HTTPException(401, "Autenticazione fallita")
    await db.users.update_one(
        {"id": u["id"], "webauthn_credentials.credential_id": cid},
        {"$set": {"webauthn_credentials.$.sign_count": v.new_sign_count}, "$unset": _OLD_PIN_FIELDS},
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
    if u and await _reset_request_allowed(u, "reset_req_log"):
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
    return {"zones": ZONES, "areas": [{"value": v, "label": l} for v, l, _ in ZONE_AREE]}


@api.get("/categories")
async def categories():
    return {"categories": CATEGORIES}


@api.get("/default-images")
async def default_images():
    """Return the curated 100-image library grouped by 10 categories."""
    from default_images import DEFAULT_IMAGE_LIBRARY
    return {"library": DEFAULT_IMAGE_LIBRARY}


# ---------- Discounts ----------
async def _merchant_sospesi() -> set:
    """Commercianti sospesi dall'admin: le loro offerte non compaiono e non si possono usare."""
    return set(await db.users.distinct("id", {"role": "merchant", "approved": False}))


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
            "shop_description": merchant.get("shop_description", ""),
            "lat": merchant.get("lat"),
            "lng": merchant.get("lng"),
            "phone": merchant.get("phone", ""),
            "orari": merchant.get("orari"),
            "stato_orari": stato_orari(merchant.get("orari"), _rome_now()),
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
    # Rating medio del negozio (solo stelle, nessun commento pubblico)
    try:
        stars = [r["stars"] async for r in db.reviews.find({"merchant_id": d.get("merchant_id")})]
        d["rating_count"] = len(stars)
        d["rating_avg"] = round(sum(stars) / len(stars), 1) if stars else None
    except Exception:
        d["rating_count"], d["rating_avg"] = 0, None
    # Include approval + lock info for merchant/admin views
    d.setdefault("approval_status", "approved")
    d.setdefault("locked_month", None)
    d.setdefault("approval_note", "")
    d.setdefault("force_editable", False)
    d.setdefault("max_uses_per_month", 1)
    d.setdefault("expired_at", None)
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
_GEOCODE_CACHE_MAX = 2000
_nominatim_lock = asyncio.Lock()
_nominatim_last = 0.0


async def _nominatim_turno(max_attesa: float) -> bool:
    """Una richiesta al secondo verso Nominatim per tutto il server (policy OSMF).
    Se il turno arriverebbe dopo più di `max_attesa` secondi si rinuncia (False)."""
    global _nominatim_last
    async with _nominatim_lock:
        attesa = _nominatim_last + 1.0 - time.monotonic()
        if attesa > max_attesa:
            return False
        if attesa > 0:
            await asyncio.sleep(attesa)
        _nominatim_last = time.monotonic()
        return True


def _cache_put(cache: dict, key: str, value) -> None:
    if len(cache) >= _GEOCODE_CACHE_MAX:
        cache.clear()
    cache[key] = value

async def geocode_address(address: str) -> Optional[dict]:
    """Trasforma un indirizzo stringa in {lat, lng} via Nominatim.
    Ritorna None se non trovato o errore. Cache in-memory per evitare hit ripetuti."""
    if not address or not isinstance(address, str) or len(address.strip()) < 4:
        return None
    key = address.strip().lower()
    if key in _geocode_cache:
        return _geocode_cache[key]
    if not await _nominatim_turno(max_attesa=60):
        return None
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
            _cache_put(_geocode_cache, key, None)
            return None
        result = {"lat": float(data[0]["lat"]), "lng": float(data[0]["lon"])}
        _cache_put(_geocode_cache, key, result)
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
    # Suggerimenti: se la coda verso Nominatim è lunga si rinuncia subito (niente attese infinite)
    if not await _nominatim_turno(max_attesa=2):
        return []
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
        _cache_put(_geocode_suggest_cache, key, out)
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
        if not m or m.get("approved") is False:
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
    sospesi = await _merchant_sospesi()
    out = []
    for d in docs:
        if d.get("merchant_id") in sospesi:
            continue
        item = await enrich_discount(d)
        m = item.get("merchant")
        if not m:
            continue
        if zone and not _zona_corrisponde(m.get("zone"), zone):
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


@api.get("/negozio/{merchant_id}")
async def pagina_negozio(merchant_id: str):
    """Pagina pubblica a cui porta il QR della locandina: nome del negozio e offerta del mese in corso.
    Nessun dato personale: solo nome, quartiere, categoria e l'offerta già visibile a tutti."""
    m = await db.users.find_one({"id": merchant_id, "role": "merchant"})
    if not m or merchant_id in await _merchant_sospesi():
        raise HTTPException(404, "Negozio non trovato")
    d = await db.discounts.find_one({"merchant_id": merchant_id, "active": True, "approval_status": "approved"})
    return {
        "negozio": {"id": m["id"], "shop_name": m.get("shop_name") or m.get("name"),
                    "zone": m.get("zone"), "category": m.get("category")},
        "discount": await enrich_discount(d) if d else None,
    }


# ---------- Condivisione di un'offerta (anteprima del link per WhatsApp e simili) ----------
def _euro(v) -> str:
    try:
        return f"{float(v):.2f}".replace(".", ",")
    except (TypeError, ValueError):
        return ""


async def _offerta_pubblica(discount_id: str) -> Optional[dict]:
    """Solo offerte visibili a tutti: approvate, attive, di negozi non sospesi."""
    d = await db.discounts.find_one({"id": discount_id, "active": True, "approval_status": "approved"})
    if not d or d.get("merchant_id") in await _merchant_sospesi():
        return None
    return d


def _base_api(request: Request) -> str:
    proto = request.headers.get("x-forwarded-proto") or request.url.scheme
    return f"{proto}://{request.url.netloc}"


@api.get("/share/o/{discount_id}", response_class=HTMLResponse)
async def share_offerta(discount_id: str, request: Request):
    """Pagina minima con i meta Open Graph: l'anteprima mostra foto, titolo e prezzo,
    poi il browser passa subito alla pagina dell'offerta sul sito."""
    front = _frontend_url() or "https://scontiroma.it"
    d = await _offerta_pubblica(discount_id)
    img = ""
    if d:
        m = await db.users.find_one({"id": d.get("merchant_id")}) or {}
        shop = m.get("shop_name") or m.get("name") or ""
        dest = f"{front}/discounts/{discount_id}"
        prezzi = ""
        if d.get("discounted_price") is not None and d.get("original_price"):
            prezzi = f" a €{_euro(d['discounted_price'])} invece di €{_euro(d['original_price'])}"
        titolo = f"{d.get('title', '')}{prezzi}"
        desc = " · ".join(x for x in (shop, m.get("zone") or "", "Sconti Roma") if x)
        if d.get("image_url"):
            img = f"{_base_api(request)}/api/share/o/{discount_id}/img"
    else:
        dest = f"{front}/discounts"
        titolo = "Sconti Roma"
        desc = "Sconti nei negozi di Roma e dintorni."
    e = html_escape
    og_img = f'<meta property="og:image" content="{e(img)}">' if img else ""
    pagina = f"""<!doctype html><html lang="it"><head><meta charset="utf-8">
<title>{e(titolo)}</title>
<meta property="og:type" content="website"><meta property="og:site_name" content="Sconti Roma">
<meta property="og:title" content="{e(titolo)}"><meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{e(dest)}">{og_img}
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0;url={e(dest)}">
</head><body><a href="{e(dest)}">Apri l'offerta su Sconti Roma</a></body></html>"""
    return HTMLResponse(pagina, headers={"Cache-Control": "public, max-age=600"})


@api.get("/share/o/{discount_id}/img")
async def share_offerta_img(discount_id: str):
    d = await _offerta_pubblica(discount_id)
    src = (d or {}).get("image_url") or ""
    if src.startswith("data:image/") and ";base64," in src:
        tipo, dati = src[5:].split(";base64,", 1)
        if tipo not in ("image/jpeg", "image/png", "image/webp", "image/gif"):
            raise HTTPException(404, "Immagine non disponibile")
        try:
            corpo = base64.b64decode(dati, validate=False)
        except (ValueError, binascii.Error):
            raise HTTPException(404, "Immagine non disponibile")
        return Response(corpo, media_type=tipo, headers={"Cache-Control": "public, max-age=3600",
                                                         "X-Content-Type-Options": "nosniff"})
    if src.startswith("https://"):
        return RedirectResponse(src, status_code=302)
    raise HTTPException(404, "Immagine non disponibile")


# ---------- Negozi preferiti del cliente ----------
MAX_PREFERITI = 200


class AvvisiPreferitiIn(BaseModel):
    attivo: bool


@api.get("/me/preferiti")
async def preferiti_elenco(user: dict = Depends(require_client)):
    ids = user.get("preferiti") or []
    sospesi = await _merchant_sospesi()
    offerte = []
    for d in await db.discounts.find({"merchant_id": {"$in": ids}, "active": True,
                                      "approval_status": "approved"}).to_list(MAX_PREFERITI):
        if d.get("merchant_id") not in sospesi:
            offerte.append(await enrich_discount(d))
    return {"merchant_ids": ids, "offerte": offerte,
            "avvisi": bool((user.get("consents") or {}).get("avvisi_preferiti"))}


@api.post("/me/preferiti/{merchant_id}")
async def preferiti_aggiungi(merchant_id: str, user: dict = Depends(require_client)):
    if not await db.users.find_one({"id": merchant_id, "role": "merchant"}, {"_id": 1}):
        raise HTTPException(404, "Negozio non trovato")
    if len(user.get("preferiti") or []) >= MAX_PREFERITI:
        raise HTTPException(400, "Hai raggiunto il numero massimo di preferiti")
    await db.users.update_one({"id": user["id"]}, {"$addToSet": {"preferiti": merchant_id}})
    return {"ok": True}


@api.delete("/me/preferiti/{merchant_id}")
async def preferiti_togli(merchant_id: str, user: dict = Depends(require_client)):
    await db.users.update_one({"id": user["id"]}, {"$pull": {"preferiti": merchant_id}})
    return {"ok": True}


@api.put("/me/preferiti/avvisi")
async def preferiti_avvisi(payload: AvvisiPreferitiIn, user: dict = Depends(require_client)):
    """Consenso (revocabile) a ricevere un'email quando un negozio preferito pubblica l'offerta."""
    now_iso = datetime.now(timezone.utc).isoformat()
    await db.users.update_one({"id": user["id"]}, {"$set": {
        "consents.avvisi_preferiti": payload.attivo,
        "consents.avvisi_preferiti_at": now_iso,
    }})
    return {"avvisi": payload.attivo}


def _avvisi_in_background(d: dict) -> None:
    """Gli avvisi partono dopo la risposta: l'admin non aspetta l'invio delle email."""
    async def _invia():
        try:
            n = await _avvisa_preferiti(d)
            if n:
                logging.info(f"[preferiti] {n} avvisi per l'offerta {d.get('id', '')[:8]}")
        except Exception as e:
            logging.warning(f"[preferiti] avvisi non inviati: {e}")
    asyncio.create_task(_invia())


async def _avvisa_preferiti(d: dict) -> int:
    """Email ai clienti che hanno il negozio tra i preferiti e hanno chiesto gli avvisi.
    Al massimo un avviso per cliente, negozio e mese."""
    mid = d.get("merchant_id")
    m = await db.users.find_one({"id": mid}) or {}
    if not mid or m.get("approved") is False:
        return 0
    mese = current_month_key()
    inviati = 0
    clienti = await db.users.find({"role": "client", "preferiti": mid,
                                   "consents.avvisi_preferiti": True}).to_list(None)
    for c in clienti:
        chiave = f"{c['id']}:{mid}:{mese}"
        if await db.avvisi_preferiti.find_one({"id": chiave}):
            continue
        await db.avvisi_preferiti.insert_one({"id": chiave, "user_id": c["id"], "merchant_id": mid,
                                              "mese": mese, "inviato_at": datetime.now(timezone.utc).isoformat()})
        prezzo = _euro(d["discounted_price"]) if d.get("discounted_price") is not None else ""
        pieno = _euro(d["original_price"]) if d.get("original_price") else ""
        await send_preferito_nuova_offerta(c["email"], c.get("name") or "", m.get("shop_name") or "",
                                           m.get("zone") or "", d.get("title") or "", prezzo, pieno, d["id"])
        inviati += 1
    return inviati


# ---------- Merchant Routes ----------
def _offerta_valida_fino_al(d: dict):
    """Ultimo giorno in cui l'offerta si vede ai clienti, come «AAAA-MM-GG»: la fine del mese di
    approvazione (le offerte scadono il 1° del mese dopo). None se l'offerta non è visibile."""
    if d.get("approval_status") != "approved" or d.get("active") is False:
        return None
    mese = d.get("locked_month") or current_month_key()
    try:
        anno, m = (int(x) for x in mese.split("-"))
        return f"{anno:04d}-{m:02d}-{calendar.monthrange(anno, m)[1]:02d}"
    except Exception:
        return None


@api.get("/merchants/me/discount")
async def merchant_get_discount(user: dict = Depends(require_merchant)):
    d = await db.discounts.find_one({"merchant_id": user["id"]})
    if not d:
        return {"discount": None}
    out = await enrich_discount(d)
    out["valid_until"] = _offerta_valida_fino_al(d)  # campo in più: i client vecchi lo ignorano
    return {"discount": out}


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
        data["expired_at"] = None
        await db.discounts.update_one({"id": existing["id"]}, {"$set": data})
        d = await db.discounts.find_one({"id": existing["id"]})
        if existing.get("approval_status") != "pending" and _admin_notify_to():
            _email_in_background(send_admin_new_offer(_admin_notify_to(), user.get("shop_name") or "", d.get("title") or ""), "admin-offerta")
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
        if _admin_notify_to():
            _email_in_background(send_admin_new_offer(_admin_notify_to(), user.get("shop_name") or "", d.get("title") or ""), "admin-offerta")
    return {"discount": await enrich_discount(d)}


# ---------- Offerta Mese Prossimo (merchant) ----------
def _enrich_next(nd: dict) -> dict:
    d = {k: v for k, v in nd.items() if k != "_id"}
    try:
        d["percent_off"] = round(((d["original_price"] - d["discounted_price"]) / d["original_price"]) * 100)
    except Exception:
        d["percent_off"] = 0
    return d


@api.get("/merchants/me/next-discount")
async def merchant_get_next_discount(user: dict = Depends(require_merchant)):
    window = await next_offer_window()
    nd = await db.next_discounts.find_one({"merchant_id": user["id"], "target_month": window["next_month"]})
    u = await db.users.find_one({"id": user["id"]}) or {}
    return {"next_discount": _enrich_next(nd) if nd else None, "window": window,
            "no_renew": u.get("no_renew_month") == window["next_month"]}


@api.post("/merchants/me/next-discount")
async def merchant_upsert_next_discount(payload: DiscountIn, user: dict = Depends(require_merchant)):
    window = await next_offer_window()
    if not window["open"]:
        raise HTTPException(423, f"La finestra per caricare l'offerta di {window['next_month_label']} si apre il {window['opens_on']} (ultimi 7 giorni del mese).")
    data = payload.cleaned()
    if not data.get("title") or not data.get("description"):
        raise HTTPException(422, "Titolo e descrizione sono obbligatori")
    now_iso = datetime.now(timezone.utc).isoformat()
    data.update({"approval_status": "pending", "approval_note": "", "approved_at": None, "updated_at": now_iso})
    existing = await db.next_discounts.find_one({"merchant_id": user["id"], "target_month": window["next_month"]})
    if (not existing or existing.get("approval_status") != "pending") and _admin_notify_to():
        _email_in_background(send_admin_new_offer(_admin_notify_to(), user.get("shop_name") or "", data.get("title") or "",
                                                  window["next_month_label"]), "admin-offerta-mese-prossimo")
    if existing:
        await db.next_discounts.update_one({"id": existing["id"]}, {"$set": data})
        nd = await db.next_discounts.find_one({"id": existing["id"]})
    else:
        data.update({"id": str(uuid.uuid4()), "merchant_id": user["id"],
                     "target_month": window["next_month"], "created_at": now_iso})
        await db.next_discounts.insert_one(data)
        nd = data
    # Caricare l'offerta del mese dopo annulla un'eventuale scelta "Non rinnovo".
    await db.users.update_one({"id": user["id"]}, {"$unset": {"no_renew_month": ""}})
    return {"next_discount": _enrich_next(nd), "window": window}


class NoRenewIn(BaseModel):
    no_renew: bool


def _current_offer_end_label() -> str:
    now = _rome_now()
    last = calendar.monthrange(now.year, now.month)[1]
    return f"{last} {MESI_IT[now.month - 1]}"


@api.get("/merchants/me/renewal-status")
async def merchant_renewal_status(user: dict = Depends(require_merchant)):
    """Stato del rinnovo per il banner della dashboard. Nessun rinnovo automatico:
    se a fine mese non c'è l'offerta del mese dopo, quella attuale scade."""
    window = await next_offer_window()
    cur = await db.discounts.find_one({"merchant_id": user["id"]})
    nd = await db.next_discounts.find_one({"merchant_id": user["id"], "target_month": window["next_month"]})
    u = await db.users.find_one({"id": user["id"]})
    return {
        "window": window,
        "current_active": bool(cur and cur.get("active") and cur.get("approval_status") == "approved"),
        "current_expired": bool(cur and cur.get("approval_status") == "expired"),
        "expires_on": _current_offer_end_label(),
        "next_status": nd.get("approval_status") if nd else None,
        "no_renew": (u or {}).get("no_renew_month") == window["next_month"],
    }


@api.post("/merchants/me/no-renew")
async def merchant_set_no_renew(payload: NoRenewIn, user: dict = Depends(require_merchant)):
    """«Non rinnovo»: l'offerta attuale termina a fine mese e i promemoria si fermano.
    Se l'offerta del mese dopo era già stata caricata viene ritirata (e archiviata),
    così il 1° del mese non riparte nulla. Si può annullare fino alla fine del mese."""
    window = await next_offer_window()
    nm = window["next_month"]
    if payload.no_renew:
        nd = await db.next_discounts.find_one({"merchant_id": user["id"], "target_month": nm})
        if nd:
            await _archivia(nd, "withdrawn_no_renew")
            await db.next_discounts.delete_one({"id": nd["id"]})
        await db.users.update_one({"id": user["id"]}, {"$set": {"no_renew_month": nm}})
    else:
        await db.users.update_one({"id": user["id"]}, {"$unset": {"no_renew_month": ""}})
    return await merchant_renewal_status(user)


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


@api.put("/merchants/me/hours")
async def merchant_update_hours(payload: OrariIn, user: dict = Depends(require_merchant)):
    orari = payload.model_dump()
    orari["nota_chiusura"] = (orari.get("nota_chiusura") or "").strip()
    orari["aggiornati_il"] = datetime.now(timezone.utc).isoformat()
    await db.users.update_one({"id": user["id"]}, {"$set": {"orari": orari}})
    return {"orari": orari, "stato": stato_orari(orari, _rome_now())}


@api.get("/merchants/me/archive")
async def merchant_archive(user: dict = Depends(require_merchant)):
    """Le offerte passate del commerciante (scadute, ritirate, rifiutate, eliminate), dalla più recente."""
    docs = await db.discounts_archive.find({"merchant_id": user["id"]}).sort("archived_at", -1).to_list(50)
    out = []
    for d in docs:
        if not d.get("archivio_id"):  # copie archiviate prima del 07/10: si assegna l'id ora
            d["archivio_id"] = str(uuid.uuid4())
            await db.discounts_archive.update_one({"_id": d["_id"]}, {"$set": {"archivio_id": d["archivio_id"]}})
        mese = d.get("locked_month") or d.get("target_month") or ""
        utilizzi = 0
        if mese:
            utilizzi = await db.redemptions.count_documents({
                "discount_id": d.get("id"), "status": "redeemed", "redeemed_at": {"$regex": f"^{mese}"}})
        out.append({
            "archivio_id": d["archivio_id"], "title": d.get("title") or "",
            "original_price": d.get("original_price"), "discounted_price": d.get("discounted_price"),
            "image_url": d.get("image_url") or "", "mese": mese, "archived_at": d.get("archived_at"),
            "stato": MOTIVI_ARCHIVIO.get(d.get("archive_reason"), "Archiviata"),
            "nota": (d.get("approval_note") or "") if d.get("archive_reason") == "rejected" else "",
            "utilizzi": utilizzi,
        })
    return {"archivio": out}


@api.get("/merchants/me/archive/{archivio_id}")
async def merchant_archive_item(archivio_id: str, user: dict = Depends(require_merchant)):
    """Il contenuto di un'offerta archiviata, per riusarla nel modulo del mese prossimo."""
    d = await db.discounts_archive.find_one({"archivio_id": archivio_id, "merchant_id": user["id"]})
    if not d:
        raise HTTPException(404, "Offerta non trovata nell'archivio")
    return {"offerta": {k: d.get(k) for k in DISCOUNT_CONTENT_FIELDS if k in d}}


@api.get("/merchants/me/stats")
async def merchant_stats(user: dict = Depends(require_merchant)):
    total = await db.redemptions.count_documents({"merchant_id": user["id"]})
    redeemed = await db.redemptions.count_documents({"merchant_id": user["id"], "status": "redeemed"})
    pending = total - redeemed
    return {"total": total, "redeemed": redeemed, "pending": pending}


GIORNI_IT = ["lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica"]
INSIGHTS_MIN_CLIENTI = 3  # sotto questa soglia niente dettagli: si riconoscerebbero i singoli clienti


@api.get("/merchants/me/insights")
async def merchant_insights(user: dict = Depends(require_merchant)):
    """Statistiche aggregate per il commerciante: utilizzi del mese, clienti nuovi e di
    ritorno, giorni preferiti, andamento degli ultimi 6 mesi. Solo numeri, mai nomi; sotto
    i 3 clienti nel mese i dettagli non vengono mostrati ("dati insufficienti")."""
    used = await db.redemptions.find(
        {"merchant_id": user["id"], "status": "redeemed"},
        {"_id": 0, "user_id": 1, "redeemed_at": 1}).to_list(None)
    mese = current_month_key()
    def mese_di(r):
        d = _rome_day(r.get("redeemed_at"))
        return d[:7] if d else None
    prima_volta: dict = {}
    for r in sorted(used, key=lambda r: r.get("redeemed_at") or ""):
        prima_volta.setdefault(r["user_id"], mese_di(r))
    del_mese = [r for r in used if mese_di(r) == mese]
    clienti = {r["user_id"] for r in del_mese}
    nuovi = {u for u in clienti if prima_volta.get(u) == mese}
    now = _rome_now()
    serie = []
    for k in range(5, -1, -1):
        y, m = now.year, now.month - k
        while m <= 0:
            y, m = y - 1, m + 12
        key = f"{y}-{m:02d}"
        serie.append({"mese": f"{MESI_IT[m - 1]} {y}", "utilizzi": sum(1 for r in used if mese_di(r) == key)})
    out = {"mese": month_label_it(mese), "utilizzi_mese": len(del_mese), "utilizzi_totali": len(used),
           "ultimi_6_mesi": serie, "dati_sufficienti": len(clienti) >= INSIGHTS_MIN_CLIENTI}
    if out["dati_sufficienti"]:
        giorni = [0] * 7
        for r in del_mese:
            try:
                giorni[datetime.fromisoformat(r["redeemed_at"]).astimezone(ROME_TZ).weekday()] += 1
            except Exception:
                pass
        out.update({"clienti_mese": len(clienti), "clienti_nuovi": len(nuovi), "clienti_di_ritorno": len(clienti) - len(nuovi),
                    "giorni": [{"giorno": GIORNI_IT[i], "utilizzi": n} for i, n in enumerate(giorni)]})
    return out


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
        "referral_url": f"{app_url}/n/{user['id']}",
        "flyer_url": f"{app_url}/locandina?ref={user['id']}",
    }




@api.get("/merchants/me/redemptions")
async def merchant_redemptions(user: dict = Depends(require_merchant)):
    """Ultimi codici del negozio, senza dati personali del cliente: niente nome né id,
    solo se è un cliente nuovo (mai riscattato qui prima) o di ritorno."""
    docs = await db.redemptions.find({"merchant_id": user["id"]}).sort("created_at", -1).to_list(200)
    # Primo riscatto di ogni cliente in questo negozio (per "nuovo" / "di ritorno").
    first_redeemed: dict = {}
    async for r in db.redemptions.find(
        {"merchant_id": user["id"], "status": "redeemed"}, {"user_id": 1, "redeemed_at": 1}
    ):
        uid, at = r.get("user_id"), r.get("redeemed_at") or ""
        if uid and (uid not in first_redeemed or at < first_redeemed[uid]):
            first_redeemed[uid] = at
    titles: dict = {}
    out = []
    for d in docs:
        did = d.get("discount_id")
        if did not in titles:
            disc = await db.discounts.find_one({"id": did}, {"title": 1}) or \
                await db.discounts_archive.find_one({"id": did}, {"title": 1})
            titles[did] = (disc or {}).get("title") or "Offerta"
        first = first_redeemed.get(d.get("user_id"))
        if d.get("status") == "redeemed":
            returning = bool(first) and first < (d.get("redeemed_at") or "")
        else:
            returning = bool(first)
        out.append({
            "id": d.get("id"),
            "code": d.get("code"),
            "status": d.get("status"),
            "created_at": d.get("created_at"),
            "redeemed_at": d.get("redeemed_at"),
            "discount_title": titles[did],
            "client_type": "returning" if returning else "new",
        })
    return {"redemptions": out}


# ---------- Subscription ----------
PAYMENTS_OFF_MSG = "Sconti Roma è gratuito durante la fase di lancio: nessun pagamento necessario."


def _frontend_url() -> str:
    return (os.environ.get("FRONTEND_URL") or os.environ.get("APP_URL") or "").strip().rstrip("/")


@api.get("/config/public")
async def public_config():
    """Impostazioni pubbliche lette dal sito all'avvio (nessun dato riservato)."""
    out = {"client_subscription_required": client_subscription_required()}
    # Fine della prova gratuita dei commercianti: compare solo quando l'utente la imposta su Render.
    fine = (os.environ.get("TRIAL_END_DATE") or "").strip()
    if fine:
        try:
            d = datetime.strptime(fine, "%Y-%m-%d")
            out["trial_end_date"] = fine
            out["trial_end_label"] = f"{d.day} {MESI_IT[d.month - 1]} {d.year}"
        except ValueError:
            logging.warning("TRIAL_END_DATE non valida (atteso AAAA-MM-GG): banner della prova non mostrato")
    return out


@api.get("/subscription/me")
async def my_subscription(user: dict = Depends(get_current_user)):
    # Lazy cleanup: se la grace di 7gg è scaduta, marca past_due → cancelled;
    # se l'abbonamento è scaduto senza un vero rinnovo, marcalo 'expired'.
    await _cancel_expired_grace(user["id"])
    await _expire_stale_active_subscriptions(user["id"])
    now_iso = datetime.now(timezone.utc).isoformat()
    # required=False: l'abbonamento non serve (fase di lancio). Chi ne ha uno lo vede
    # comunque e può annullarlo.
    required = client_subscription_required()
    sub = await db.subscriptions.find_one({"user_id": user["id"], "status": "active"})
    if sub:
        sub = {k: v for k, v in sub.items() if k != "_id"}
        return {"subscription": sub, "active": True, "past_due": False, "required": required}
    # Nessuna sub attiva: controlla se c'è una past_due ancora nella finestra di 7gg
    # (utente sospeso ma può ancora salvare l'abbonamento pagando entro grace_expires_at).
    past = await db.subscriptions.find_one(
        {"user_id": user["id"], "status": "past_due", "grace_expires_at": {"$gt": now_iso}},
        sort=[("payment_failed_at", -1)],
    )
    if past:
        past = {k: v for k, v in past.items() if k != "_id"}
        return {"subscription": past, "active": False, "past_due": True,
                "grace_expires_at": past.get("grace_expires_at"), "required": required}
    return {"subscription": None, "active": False, "past_due": False, "required": required}


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
async def create_checkout(payload: Optional[StripeCheckoutIn] = None, user: dict = Depends(require_client)):
    if not client_subscription_required():
        raise HTTPException(409, PAYMENTS_OFF_MSG)
    site = _frontend_url()
    if not site:
        raise HTTPException(500, "FRONTEND_URL non configurato")
    prices = stripe.Price.list(lookup_keys=[STRIPE_PRICE_LOOKUP], active=True, limit=1).data
    if prices:
        price = prices[0]
    else:
        # Crea Price €2,99/mese (idempotente via lookup_key)
        price = stripe.Price.create(
            unit_amount=299,
            currency="eur",
            recurring={"interval": "month"},
            lookup_key=STRIPE_PRICE_LOOKUP,
            product_data={"name": "Sconti Roma Mensile"},
        )
    customer_id = await get_or_create_stripe_customer(user)
    common_kwargs = dict(
        line_items=[{"price": price.id, "quantity": 1}],
        mode="subscription",
        success_url=f"{site}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{site}/payment/cancel",
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
        "amount": 299, "currency": "eur",
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
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    grace_expires_iso = (now + timedelta(days=7)).isoformat()

    # Prenotazione atomica dell'evento (stesso schema di extend_subscription_on_renewal):
    # l'insert fallisce con DuplicateKeyError se un webhook ri-consegnato in parallelo
    # ha già reclamato lo stesso provider_event_id, così la sospensione e l'email
    # partono una volta sola.
    try:
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
    except DuplicateKeyError:
        logging.info(f"[payment-failed] event {provider_event_id} già processato, skip")
        return

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
    price_eur: float = 2.99,
) -> Optional[str]:
    """Estende l'abbonamento di 30 giorni quando arriva un evento di rinnovo pagato
    (Stripe `invoice.payment_succeeded` o PayPal `PAYMENT.SALE.COMPLETED`).

    - IDEMPOTENTE via `renewal_events` collection (chiave `provider_event_id`).
    - new_end = max(now, current_end_date) + 30 giorni (non brucia giorni residui).
    - Aggiorna `users.data_scadenza_abbonamento` per lookup rapido.
    - Ritorna l'ID email Resend (o None).
    """
    # Prenotazione atomica dell'evento: l'insert fallisce con DuplicateKeyError
    # se un'altra richiesta concorrente (es. webhook ri-consegnato da Stripe/PayPal)
    # ha già reclamato lo stesso provider_event_id. Il find_one da solo non basta:
    # due richieste in race possono passarlo entrambe prima che una delle due
    # scriva, estendendo l'abbonamento due volte invece di una.
    try:
        await db.renewal_events.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "provider": provider,
            "provider_event_id": provider_event_id,
            "provider_sub_id": provider_sub_id,
            "amount_eur": price_eur,
            "processed_at": datetime.now(timezone.utc).isoformat(),
            "new_end_date": None,  # aggiornato sotto una volta calcolato
        })
    except DuplicateKeyError:
        logging.info(f"[renewal] event {provider_event_id} già processato (race), skip")
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
    await db.renewal_events.update_one(
        {"provider_event_id": provider_event_id},
        {"$set": {"new_end_date": new_end_iso}},
    )

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
        "price_eur": 2.99,
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
        except Exception as e:
            # best-effort: se Stripe non risponde restituiamo comunque lo stato
            # in DB, ma se questo fallisce ripetutamente vogliamo saperlo (finora
            # era silenzioso e mascherava problemi reali di sync col webhook).
            logging.warning(f"[checkout-status] Stripe retrieve fallback failed for session={session_id}: {e}")
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
    if not client_subscription_required():
        # Fase di lancio: evento autentico ma senza effetti (nessun abbonamento da gestire).
        return {"received": True, "ignored": "subscription_not_required"}
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
        amount_paid = (obj.get("amount_paid") or 299) / 100.0  # cents → EUR
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
    if not client_subscription_required() or not paypal_service.is_configured():
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
    if not client_subscription_required():
        raise HTTPException(409, PAYMENTS_OFF_MSG)
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
        "price_eur": 2.99,
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
    if not client_subscription_required():
        # Fase di lancio: evento autentico ma senza effetti (nessun abbonamento da gestire).
        return {"status": "ignored", "reason": "subscription_not_required"}
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
        price = float(amount.get("total") or amount.get("value") or 2.99)
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
ROME_TZ = ZoneInfo("Europe/Rome")


def _rome_day(dt_iso: Optional[str] = None) -> Optional[str]:
    """Giorno (YYYY-MM-DD) in ora italiana — il limite giornaliero segue la mezzanotte di Roma."""
    try:
        dt = datetime.fromisoformat(dt_iso) if dt_iso else datetime.now(timezone.utc)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(ROME_TZ).strftime("%Y-%m-%d")
    except Exception:
        return None


def short_client_name(name: Optional[str]) -> str:
    """Nome mostrato al commerciante alla scansione del QR: nome di battesimo e
    iniziale del cognome ("Mario Rossi" -> "Mario R."), mai il nome completo."""
    parts = (name or "").split()
    if not parts:
        return "Cliente"
    first = parts[0][:1].upper() + parts[0][1:]
    return f"{first} {parts[-1][:1].upper()}." if len(parts) > 1 else first


async def _last_redeemed(user_id: str, merchant_id: str, exclude_id: Optional[str] = None) -> Optional[dict]:
    q = {"user_id": user_id, "merchant_id": merchant_id, "status": "redeemed"}
    if exclude_id:
        q["id"] = {"$ne": exclude_id}
    return await db.redemptions.find_one(q, sort=[("redeemed_at", -1)])


@api.post("/redemptions/create/{discount_id}")
async def create_redemption(discount_id: str, user: dict = Depends(require_client)):
    # Fase di lancio (interruttore spento): basta essere registrati come clienti.
    # I limiti per negozio (al mese e al giorno) qui sotto valgono comunque.
    if client_subscription_required() and not await user_has_active_sub(user["id"]):
        raise HTTPException(402, "Serve un abbonamento attivo")
    d = await db.discounts.find_one({"id": discount_id})
    if not d:
        raise HTTPException(404, "Sconto non trovato")
    if d.get("approval_status") != "approved" or not d.get("active", True):
        raise HTTPException(403, "Offerta non disponibile")
    if d.get("merchant_id") in await _merchant_sospesi():
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

    # 2b) LIMITE GIORNALIERO anti-abuso: max 1 utilizzo al giorno per sconto.
    # Impedisce che i coupon multipli del mese vengano bruciati la stessa sera per amici non abbonati.
    last = await _last_redeemed(user["id"], d["merchant_id"])
    if last and _rome_day(last.get("redeemed_at")) == _rome_day():
        await _log_scan(False, "Limite giornaliero: sconto già usato oggi", last)
        raise HTTPException(429, "Hai già usato questo sconto oggi. Il prossimo utilizzo sarà disponibile da domani!")

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
    try:
        await db.redemptions.insert_one(doc)
    except DuplicateKeyError:
        # Due richieste concorrenti (doppio tap, retry di rete) sono arrivate qui
        # insieme: l'indice unique parziale su (user_id, merchant_id, month_key,
        # status="pending") ha bloccato la seconda. Restituisci quella che ha
        # vinto la race invece di emettere un secondo codice fuori limite.
        pending = await db.redemptions.find_one({
            "user_id": user["id"], "merchant_id": d["merchant_id"],
            "month_key": month_key, "status": "pending",
        })
        if pending:
            return {"redemption": {k: v for k, v in pending.items() if k != "_id"}}
        raise HTTPException(409, "Sconto già in elaborazione, riprova tra poco.")
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
    last = await _last_redeemed(user["id"], d["merchant_id"])
    used_today = bool(last and _rome_day(last.get("redeemed_at")) == _rome_day())
    return {
        "used_this_month": used_count >= max_uses,  # backward compat
        "used_count": used_count,
        "max_uses": max_uses,
        "remaining": remaining,
        "used_today": used_today,
        "last_used_at": last.get("redeemed_at") if last else None,
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
    # Utilizzo precedente (escluso il corrente) — serve per limite giornaliero e riepilogo merchant
    prev = await _last_redeemed(r["user_id"], r["merchant_id"], exclude_id=r["id"])
    # Consume on first successful scan
    if r.get("status") == "pending":
        # LIMITE GIORNALIERO: il cliente non può usare lo stesso sconto 2 volte nello stesso giorno
        if prev and _rome_day(prev.get("redeemed_at")) == _rome_day():
            await _log_scan(False, "Limite giornaliero: cliente ha già usato lo sconto oggi", r)
            return {"valid": False, "reason": "Limite giornaliero: il cliente ha già utilizzato questo sconto oggi", "daily_limit": True}
        res = await db.redemptions.update_one(
            {"id": r["id"], "status": "pending"},
            {"$set": {"status": "redeemed",
                      "redeemed_at": datetime.now(timezone.utc).isoformat()}}
        )
        # Con due scansioni simultanee vince una sola: il log di successo va scritto una volta.
        if res.modified_count == 1:
            await _log_scan(True, "OK", r)
    # Fetch enriched data
    disc = await db.discounts.find_one({"id": r.get("discount_id")})
    m = await db.users.find_one({"id": r.get("merchant_id")})
    c = await db.users.find_one({"id": r.get("user_id")})
    return {
        "valid": True,
        "client_name": short_client_name(c.get("name") if c else None),
        "client_initial": ((c.get("name","?")[:1] or "?").upper()) if c else "?",
        "shop_name": m.get("shop_name") if m else "-",
        "discount_title": disc.get("title") if disc else "-",
        "discount_percent": None if not disc or not disc.get("original_price") else round((1 - disc["discounted_price"]/disc["original_price"])*100),
        "redeemed_at": r.get("redeemed_at") or datetime.now(timezone.utc).isoformat(),
        # Riepilogo utilizzi per il commerciante
        "use_number": r.get("use_number") or 1,
        "max_uses": r.get("max_uses_per_month") or 1,
        "prev_used_at": prev.get("redeemed_at") if prev else None,
    }


@api.post("/redemptions/verify")
async def verify_redemption(payload: RedeemVerifyIn, user: dict = Depends(require_merchant)):
    code, slot, token = parse_rotating_code(payload.code)
    r = await db.redemptions.find_one({"code": code, "merchant_id": user["id"]})
    if not r:
        raise HTTPException(404, "Codice non trovato")
    if r["status"] == "redeemed":
        raise HTTPException(400, "Codice già utilizzato")
    # LIMITE GIORNALIERO anche sulla verifica manuale del commerciante
    prev = await _last_redeemed(r["user_id"], r["merchant_id"], exclude_id=r["id"])
    if prev and _rome_day(prev.get("redeemed_at")) == _rome_day():
        await _log_scan(False, "Limite giornaliero: cliente ha già usato lo sconto oggi", r)
        raise HTTPException(429, "Limite giornaliero: il cliente ha già utilizzato questo sconto oggi")
    # If rotating format supplied, validate freshness (±1 slot = 10-20s window)
    if slot is not None and token is not None:
        cur = current_slot()
        if abs(cur - slot) > 1:
            raise HTTPException(400, "QR code scaduto, chiedi al cliente di aggiornarlo")
        if not hmac_lib.compare_digest(_rotating_hmac(code, slot), token):
            raise HTTPException(400, "QR code non valido (possibile screenshot)")
    # Update atomico: la condizione status="pending" è nel filtro, non solo nel
    # check sopra. Se due scan concorrenti dello stesso codice arrivano insieme
    # (doppio tap sul lettore, retry di rete), solo una vince — la seconda vede
    # modified_count == 0 e riceve l'errore "già utilizzato", invece di poter
    # marcare due volte lo stesso redemption.
    result = await db.redemptions.update_one(
        {"id": r["id"], "status": "pending"},
        {"$set": {"status": "redeemed", "redeemed_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(400, "Codice già utilizzato")
    r = await db.redemptions.find_one({"id": r["id"]})
    disc = await db.discounts.find_one({"id": r["discount_id"]})
    cu = await db.users.find_one({"id": r["user_id"]})
    # Al commerciante niente id del cliente e solo nome + iniziale del cognome.
    r = {k: v for k, v in r.items() if k not in ("_id", "user_id")}
    r["discount_title"] = disc.get("title") if disc else ""
    r["client_name"] = short_client_name(cu.get("name") if cu else None)
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
        id=unb64u(c["credential_id"]), transports=_transports(c.get("transports")))
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
    v, err = await _verify_with_challenge(u["id"], "master", lambda challenge: verify_authentication_response(
        credential=payload.credential,
        expected_challenge=challenge,
        expected_rp_id=WEBAUTHN_RP_ID,
        expected_origin=WEBAUTHN_ORIGIN,
        credential_public_key=unb64u(cred["public_key"]),
        credential_current_sign_count=cred.get("sign_count", 0),
        require_user_verification=False,
    ))
    if v is None and err is None:
        raise HTTPException(401, "Sessione scaduta, riprova")
    if v is None:
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


@api.get("/admin/launch-summary")
async def admin_launch_summary(user: dict = Depends(require_admin_master)):
    """Fase di lancio a colpo d'occhio: iscritti, negozi per quartiere, offerte da approvare,
    negozi senza offerta, utilizzi del mese."""
    sospesi = await _merchant_sospesi()
    merchants = await db.users.find({"role": "merchant"}, {"_id": 0, "id": 1, "shop_name": 1, "zone": 1, "created_at": 1}).to_list(None)
    offerte = {d["merchant_id"]: d for d in await db.discounts.find({}, {"_id": 0, "merchant_id": 1, "approval_status": 1, "active": 1}).to_list(None)}
    zone: dict = {}
    senza_offerta = []
    for m in merchants:
        z = zone.setdefault(m.get("zone") or "—", {"zona": m.get("zone") or "—", "negozi": 0, "online": 0})
        z["negozi"] += 1
        d = offerte.get(m["id"])
        if d and d.get("approval_status") == "approved" and d.get("active", True) and m["id"] not in sospesi:
            z["online"] += 1
        if not d:
            senza_offerta.append(m.get("shop_name") or "senza nome")
    sette = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    mese = current_month_key()
    return {
        "clienti": await db.users.count_documents({"role": "client"}),
        "clienti_ultimi_7_giorni": await db.users.count_documents({"role": "client", "created_at": {"$gte": sette}}),
        "commercianti": len(merchants),
        "commercianti_ultimi_7_giorni": sum(1 for m in merchants if (m.get("created_at") or "") >= sette),
        "sospesi": len(sospesi),
        "zone": sorted(zone.values(), key=lambda z: -z["negozi"]),
        "offerte_da_approvare": await db.discounts.count_documents({"approval_status": "pending"})
            + await db.next_discounts.count_documents({"approval_status": "pending"}),
        "negozi_senza_offerta": sorted(senza_offerta),
        "utilizzi_mese": await db.redemptions.count_documents({"status": "redeemed", "month_key": mese}),
        "mese": month_label_it(mese),
    }


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
        "locked_month": current_month_key(),
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
    if d.get("active", True):
        _avvisi_in_background(d)
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
    d_rif = await db.discounts.find_one({"id": discount_id})
    if d_rif:
        await _archivia(d_rif, "rejected")
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


# ---------- Admin: Offerte Mese Prossimo ----------
class WindowOverrideIn(BaseModel):
    open: Optional[bool] = None  # None = torna alla regola automatica (ultimi 7 giorni)


@api.get("/admin/next-offers")
async def admin_next_offers(user: dict = Depends(require_admin_master)):
    window = await next_offer_window()
    nm = window["next_month"]
    merchants = await db.users.find({"role": "merchant"}).sort("shop_name", 1).to_list(1000)
    next_by_mid = {d["merchant_id"]: d async for d in db.next_discounts.find({"target_month": nm})}
    curr_by_mid = {d["merchant_id"]: d async for d in db.discounts.find({})}
    rows = []
    summary = {"total": 0, "approved": 0, "pending": 0, "rejected": 0, "missing": 0}
    for m in merchants:
        mid = m["id"]
        nd = next_by_mid.get(mid)
        cd = curr_by_mid.get(mid)
        st = (nd.get("approval_status") if nd else "missing") or "pending"
        summary["total"] += 1
        summary[st if st in summary else "missing"] += 1
        rows.append({
            "merchant_id": mid,
            "shop_name": m.get("shop_name") or m.get("name"),
            "zone": m.get("zone"),
            "category": m.get("category"),
            "email": m.get("email"),
            "merchant": {
                "name": m.get("name"),
                "email": m.get("email"),
                "phone": m.get("phone"),
                "address": m.get("address"),
                "piva": m.get("piva") or m.get("vat_number"),
                "zone": m.get("zone"),
                "category": m.get("category"),
            },
            "reminder_sent": m.get("next_offer_reminder_month") == nm,
            "current_offer": ({
                "title": cd.get("title"),
                "active": cd.get("active", True),
                "approval_status": cd.get("approval_status", "approved"),
            } if cd else None),
            "next_offer": _enrich_next(nd) if nd else None,
            "next_status": st,
        })
    order = {"pending": 0, "rejected": 1, "missing": 2, "approved": 3}
    rows.sort(key=lambda r: order.get(r["next_status"], 4))
    return {"window": window, "rows": rows, "summary": summary}


@api.post("/admin/next-offers/{next_id}/approve")
async def admin_approve_next_offer(next_id: str, user: dict = Depends(require_admin_master)):
    now_iso = datetime.now(timezone.utc).isoformat()
    result = await db.next_discounts.update_one({"id": next_id}, {"$set": {
        "approval_status": "approved", "approved_at": now_iso, "approval_note": ""}})
    if result.matched_count == 0:
        raise HTTPException(404, "Offerta non trovata")
    nd = await db.next_discounts.find_one({"id": next_id})
    try:
        m = await db.users.find_one({"id": nd.get("merchant_id")})
        if m and m.get("email"):
            await send_merchant_approved(m["email"], m.get("name") or "commerciante",
                                         m.get("shop_name") or "il tuo negozio", nd.get("title") or "")
    except Exception as e:
        logging.warning(f"next-offer approve email failed: {e}")
    return {"next_discount": _enrich_next(nd)}


@api.post("/admin/next-offers/{next_id}/reject")
async def admin_reject_next_offer(next_id: str, payload: RejectIn, user: dict = Depends(require_admin_master)):
    result = await db.next_discounts.update_one({"id": next_id}, {"$set": {
        "approval_status": "rejected", "approval_note": payload.reason or "", "approved_at": None}})
    if result.matched_count == 0:
        raise HTTPException(404, "Offerta non trovata")
    nd_rif = await db.next_discounts.find_one({"id": next_id})
    if nd_rif:
        await _archivia(nd_rif, "rejected")
    try:
        nd = await db.next_discounts.find_one({"id": next_id})
        m = await db.users.find_one({"id": nd.get("merchant_id")}) if nd else None
        if m and m.get("email"):
            await send_merchant_rejected(m["email"], m.get("name") or "commerciante",
                                         m.get("shop_name") or "il tuo negozio",
                                         nd.get("title") or "", payload.reason or "")
    except Exception as e:
        logging.warning(f"next-offer reject email failed: {e}")
    return {"ok": True}


class AdminNextOfferUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    original_price: Optional[float] = None
    discounted_price: Optional[float] = None
    image_url: Optional[str] = None
    image_urls: Optional[List[str]] = None
    terms: Optional[str] = None
    plan_ahead: Optional[str] = None
    validity_info: Optional[str] = None
    additional_info: Optional[str] = None
    active: Optional[bool] = None
    max_uses_per_month: Optional[int] = Field(default=None, ge=1, le=10)


@api.put("/admin/next-offers/{next_id}")
async def admin_update_next_offer(next_id: str, payload: AdminNextOfferUpdate, user: dict = Depends(require_admin_master)):
    """Modifica manuale admin: l'offerta torna sempre in revisione (pending)."""
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(400, "Nessuna modifica")
    updates.update({
        "approval_status": "pending",
        "approved_at": None,
        "approval_note": "",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })
    result = await db.next_discounts.update_one({"id": next_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(404, "Offerta non trovata")
    nd = await db.next_discounts.find_one({"id": next_id})
    return {"next_discount": _enrich_next(nd)}


@api.post("/admin/next-offers/window-override")
async def admin_next_window_override(payload: WindowOverrideIn, user: dict = Depends(require_admin_master)):
    if payload.open is None:
        await db.settings.delete_one({"key": "next_offer_window_override"})
    else:
        await db.settings.update_one({"key": "next_offer_window_override"},
                                     {"$set": {"value": bool(payload.open)}}, upsert=True)
    return {"window": await next_offer_window()}


@api.post("/admin/next-offers/run-rollover")
async def admin_run_rollover(user: dict = Depends(require_admin_master)):
    return await _run_month_rollover(force=True)


@api.post("/admin/next-offers/run-reminders")
async def admin_run_next_reminders(user: dict = Depends(require_admin_master)):
    return await _run_next_offer_reminders()


@api.get("/admin/merchants")
async def admin_list_merchants(user: dict = Depends(require_admin_master)):
    docs = await db.users.find({"role": "merchant"}).sort("created_at", -1).to_list(500)
    out = []
    for m in docs:
        m = sanitize_user(m)
        m["approved"] = m.get("approved", True)  # default True for existing
        disc = await db.discounts.find_one({"merchant_id": m["id"]})
        m["has_discount"] = disc is not None
        if disc:
            m["discount_id"] = disc["id"]
            m["discount_title"] = disc.get("title")
            m["discount_active"] = disc.get("active", True)
            m["discount_approval"] = disc.get("approval_status") or "approved"
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
    m = await db.users.find_one({"id": merchant_id, "role": "merchant"})
    if not m:
        raise HTTPException(404, "Commerciante non trovato")
    await _erase_user_data(m)
    await db.users.delete_one({"id": merchant_id, "role": "merchant"})
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
    d = await db.discounts.find_one({"id": discount_id})
    if d:
        await _archivia(d, "deleted_by_admin")
    result = await db.discounts.delete_one({"id": discount_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Sconto non trovato")
    return {"ok": True}


# ---------- Seeding ----------
ADMIN_PASSWORD_MIN_LEN = 12


async def seed_data():
    """Crea l'account admin da ADMIN_EMAIL / ADMIN_PASSWORD, o ne riallinea la password.
    Senza email o con una password vuota o corta non crea nulla: un admin con password
    vuota sarebbe accessibile a chiunque."""
    admin_email = os.environ.get("ADMIN_EMAIL", "").strip().lower()
    admin_pw = os.environ.get("ADMIN_PASSWORD", "")
    if not admin_email or len(admin_pw) < ADMIN_PASSWORD_MIN_LEN:
        logging.warning(
            f"[seed] ADMIN_EMAIL mancante o ADMIN_PASSWORD più corta di {ADMIN_PASSWORD_MIN_LEN} "
            "caratteri: account admin non creato né aggiornato."
        )
        return
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
    elif not verify_password(admin_pw, existing_admin.get("password_hash", "")):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_pw)}})


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
    if not client_subscription_required():
        return {"checked": 0, "sent": 0, "skipped": "subscription_not_required"}
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


# ============================================================
# Offerta Mese Prossimo — rollover mensile + promemoria
# ============================================================

async def _run_month_rollover(force: bool = False) -> dict:
    """Passaggio mese (1° alle 00:05 Europe/Rome):
    - offerta mese prossimo APPROVATA → sostituisce quella corrente (attiva + locked)
    - offerta mese prossimo pending/rejected → diventa la bozza in revisione del nuovo mese
    - offerta corrente senza sostituzione → scade (negozio senza offerta finché non ne carica una)
    Le versioni sostituite/scadute vengono archiviate in `discounts_archive`.
    Idempotente via `rollover_runs` (bypass con force=True)."""
    # Mese di Roma: con l'UTC il passaggio delle 00:05 del 1° veniva saltato.
    month = current_month_key()
    if not force and await db.rollover_runs.find_one({"month": month}):
        return {"skipped": True, "month": month}
    now_iso = datetime.now(timezone.utc).isoformat()
    await db.rollover_runs.update_one({"month": month}, {"$set": {"ran_at": now_iso}}, upsert=True)

    async def _archive(old: dict, reason: str):
        await _archivia(old, reason)

    handled = set()
    promoted = migrated = expired = 0
    # $lte: recupera anche eventuali offerte di mesi mai promossi (pod spento al 1°)
    next_docs = await db.next_discounts.find({"target_month": {"$lte": month}}).to_list(None)
    for nd in next_docs:
        mid = nd["merchant_id"]
        handled.add(mid)
        content = {k: nd.get(k) for k in DISCOUNT_CONTENT_FIELDS if k in nd}
        st = nd.get("approval_status") or "pending"
        if st == "approved":
            sets = {**content, "updated_at": now_iso, "approval_status": "approved",
                    "approved_at": nd.get("approved_at") or now_iso, "locked_month": month,
                    "approval_note": "", "force_editable": False, "expired_at": None}
            promoted += 1
        else:
            sets = {**content, "updated_at": now_iso, "approval_status": st,
                    "approval_note": nd.get("approval_note", ""), "approved_at": None,
                    "locked_month": None, "force_editable": False, "expired_at": None}
            migrated += 1
        existing = await db.discounts.find_one({"merchant_id": mid})
        if existing:
            await _archive(existing, "replaced_by_next_month")
            await db.discounts.update_one({"id": existing["id"]}, {"$set": sets})
        else:
            sets.update({"id": str(uuid.uuid4()), "merchant_id": mid, "created_at": now_iso})
            await db.discounts.insert_one(sets)
        await db.next_discounts.delete_one({"id": nd["id"]})
        if st == "approved":  # l'offerta del mese è online: avviso a chi ha il negozio tra i preferiti
            promossa = await db.discounts.find_one({"merchant_id": mid})
            if promossa and promossa.get("active", True):
                _avvisi_in_background(promossa)

    # Offerte del mese precedente senza sostituzione → scadono
    stale = await db.discounts.find({"approval_status": "approved", "active": True}).to_list(None)
    for d in stale:
        if d["merchant_id"] in handled or d.get("locked_month") == month:
            continue
        await _archive(d, "expired_no_replacement")
        await db.discounts.update_one({"id": d["id"]}, {"$set": {
            "active": False, "approval_status": "expired", "expired_at": now_iso,
            "locked_month": None, "updated_at": now_iso}})
        expired += 1
        try:
            m = await db.users.find_one({"id": d["merchant_id"]})
            if m and m.get("email"):
                await send_offer_expired(m["email"], m.get("name") or "", m.get("shop_name") or "il tuo negozio",
                                         no_renew=m.get("no_renew_month") == month)
        except Exception as e:
            logging.error(f"[rollover] email offerta scaduta non inviata merchant={d['merchant_id'][:8]}: {e}")
    logging.info(f"[rollover] month={month} promoted={promoted} migrated={migrated} expired={expired}")
    return {"skipped": False, "month": month, "promoted": promoted,
            "migrated_pending": migrated, "expired": expired}


# Promemoria al commerciante negli ultimi 7 giorni del mese: (fase, giorni rimasti massimi).
# Se il server era spento, parte solo la fase più vicina alla scadenza (niente raffiche).
NEXT_OFFER_REMINDER_STAGES = (("apertura", 7), ("tre_giorni", 3), ("ultimo_giorno", 1))
ADMIN_SUMMARY_DAYS_LEFT = 4  # riepilogo admin: il 28 in un mese di 31 giorni


async def _run_next_offer_reminders() -> dict:
    """Promemoria «la tua offerta scade»: fino a 3 email (apertura finestra, 3 giorni prima,
    ultimo giorno) ai commercianti con offerta attiva che non hanno caricato quella del mese
    dopo e non hanno scelto «Non rinnovo». Poi un riepilogo all'admin. Idempotente."""
    window = await next_offer_window()
    if not window["open"]:
        return {"window_open": False, "sent": 0}
    nm = window["next_month"]
    days_left = window["days_to_month_end"] + 1
    stage = [st for st, mx in NEXT_OFFER_REMINDER_STAGES if days_left <= mx]
    stage = stage[-1] if stage else "apertura"
    uploaded = set(await db.next_discounts.distinct("merchant_id", {"target_month": nm}))
    sent = checked = 0
    actives = await db.discounts.find({"approval_status": "approved", "active": True}).to_list(None)
    for d in actives:
        mid = d["merchant_id"]
        checked += 1
        if mid in uploaded:
            continue
        m = await db.users.find_one({"id": mid})
        if not m or not m.get("email") or m.get("no_renew_month") == nm:
            continue
        log = m.get("next_offer_reminders") or {}
        stages = list(log.get("stages", [])) if log.get("month") == nm else []
        if m.get("next_offer_reminder_month") == nm and "apertura" not in stages:
            stages.append("apertura")  # promemoria unico della versione precedente
        if stage in stages:
            continue
        try:
            await send_next_offer_reminder(m["email"], m.get("name") or "",
                                           m.get("shop_name") or "il tuo negozio",
                                           window["next_month_label"], days_left)
            stages.append(stage)
            await db.users.update_one({"id": mid}, {"$set": {
                "next_offer_reminders": {"month": nm, "stages": stages},
                "next_offer_reminder_month": nm}})
            sent += 1
        except Exception as e:
            logging.error(f"[next-offer-reminder] send failed merchant={mid[:8]}: {e}")
    admin_summary = await _send_admin_month_summary(nm, window["next_month_label"], days_left, actives)
    return {"window_open": True, "checked": checked, "sent": sent, "next_month": nm,
            "stage": stage, "admin_summary": admin_summary}


async def _send_admin_month_summary(nm: str, label: str, days_left: int, actives: list) -> bool:
    """Una volta al mese, negli ultimi giorni: offerte da approvare, rifiutate, mancanti, «Non rinnovo»."""
    if days_left > ADMIN_SUMMARY_DAYS_LEFT:
        return False
    key = f"admin_month_summary_{nm}"
    if await db.settings.find_one({"key": key}):
        return False
    to = os.environ.get("ADMIN_NOTIFY_EMAIL") or os.environ.get("ADMIN_EMAIL", "")
    if not to:
        return False
    names: dict = {}

    async def shop(mid):
        if mid not in names:
            m = await db.users.find_one({"id": mid}, {"shop_name": 1, "name": 1})
            names[mid] = (m or {}).get("shop_name") or (m or {}).get("name") or "negozio"
        return names[mid]

    pending, rejected = [], []
    async for nd in db.next_discounts.find({"target_month": nm}):
        (pending if (nd.get("approval_status") or "pending") == "pending"
         else rejected if nd.get("approval_status") == "rejected" else []).append(await shop(nd["merchant_id"]))
    uploaded = set(await db.next_discounts.distinct("merchant_id", {"target_month": nm}))
    missing, no_renew = [], []
    for d in actives:
        mid = d["merchant_id"]
        if mid in uploaded:
            continue
        m = await db.users.find_one({"id": mid}, {"no_renew_month": 1})
        (no_renew if (m or {}).get("no_renew_month") == nm else missing).append(await shop(mid))
    try:
        await send_admin_month_summary(to, label, pending, rejected, missing, no_renew)
    except Exception as e:
        logging.error(f"[admin-summary] send failed: {e}")
        return False
    await db.settings.update_one({"key": key}, {"$set": {"sent_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    return True


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
    # Promemoria "carica offerta mese prossimo" — ogni giorno 09:30 (invia solo in finestra, idempotente)
    _scheduler.add_job(
        _run_next_offer_reminders,
        CronTrigger(hour=9, minute=30),
        id="next_offer_reminders_daily",
        replace_existing=True,
    )
    # Passaggio mese: il 1° alle 00:05 — promuove offerte approvate, fa scadere le altre
    _scheduler.add_job(
        _run_month_rollover,
        CronTrigger(day=1, hour=0, minute=5),
        id="month_rollover",
        replace_existing=True,
    )
    _scheduler.start()
    logging.info("[scheduler] AsyncIOScheduler avviato — grace 10:00, next-offer reminders 09:30, rollover 1° 00:05 Europe/Rome")


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
    if not stripe.api_key:
        logging.warning("STRIPE_SECRET_KEY non impostata: i pagamenti Stripe non funzioneranno")
    await db.users.create_index("email", unique=True)
    await db.login_guard.create_index("key", unique=True)
    await db.login_guard.create_index("expires_at", expireAfterSeconds=0)
    await db.users.create_index("id", unique=True)
    await db.discounts.create_index("merchant_id")
    await db.subscriptions.create_index("user_id")
    await db.redemptions.create_index("code", unique=True)
    await db.redemptions.create_index("merchant_id")
    await db.webauthn_challenges.create_index("expires_at", expireAfterSeconds=0)
    await db.users.create_index("webauthn_credentials.credential_id", sparse=True)
    await db.users.create_index("reset_token", sparse=True)
    # Garantisce idempotenza reale dei webhook di rinnovo (Stripe/PayPal possono
    # ri-consegnare lo stesso evento più volte): l'indice unique fa fallire a
    # livello DB il secondo insert concorrente, anche se il check applicativo
    # find_one-poi-insert viene superato da entrambe le richieste in race.
    await db.renewal_events.create_index("provider_event_id", unique=True)
    # Un solo redemption "pending" per utente/negozio/mese: chiude a livello DB
    # la race condition di create_redemption (due richieste concorrenti che
    # superano entrambe il controllo max_uses prima di inserire).
    await db.redemptions.create_index(
        ["user_id", "merchant_id", "month_key"],
        unique=True,
        partialFilterExpression={"status": "pending"},
    )
    await seed_data()
    await ensure_master_doc()
    _start_scheduler()
    # Catch-up rollover: se il pod era spento il 1° del mese alle 00:05, il job cron
    # è andato perso. Idempotente via rollover_runs: gira solo se non già eseguito.
    try:
        res = await _run_month_rollover()
        if not res.get("skipped"):
            logging.info(f"[rollover:catchup] eseguito al riavvio: {res}")
    except Exception as e:
        logging.error(f"[rollover:catchup] failed: {e}")
    # Catch-up promemoria offerte: sul piano gratuito il server può dormire alle 9:30.
    # Idempotente per fase; mai di notte.
    try:
        if 9 <= _rome_now().hour < 21:
            await _run_next_offer_reminders()
    except Exception as e:
        logging.error(f"[next-offer-reminder:catchup] failed: {e}")


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


# ---------- Feedback sull'applicazione (banner stelle) ----------
class AppFeedbackIn(BaseModel):
    stars: int = Field(ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=500)


@api.post("/app-feedback")
async def submit_app_feedback(payload: AppFeedbackIn, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    await db.app_feedback.update_one(
        {"user_id": user["id"]},
        {"$set": {
            "user_id": user["id"], "role": user.get("role"), "email": user.get("email"),
            "stars": payload.stars, "comment": (payload.comment or "").strip(),
            "updated_at": now,
        }, "$setOnInsert": {"id": str(uuid.uuid4()), "created_at": now}},
        upsert=True,
    )
    return {"ok": True}


@api.get("/app-feedback/me")
async def my_app_feedback(user: dict = Depends(get_current_user)):
    doc = await db.app_feedback.find_one({"user_id": user["id"]})
    return {"given": bool(doc), "stars": doc.get("stars") if doc else None}


@api.get("/admin/app-feedback")
async def admin_app_feedback(user: dict = Depends(require_admin_master)):
    out = []
    async for f in db.app_feedback.find().sort("updated_at", -1).limit(500):
        f.pop("_id", None)
        out.append(f)
    avg = round(sum(f["stars"] for f in out) / len(out), 1) if out else None
    return {"feedback": out, "avg": avg, "count": len(out)}


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


# Commit pubblicato: Render imposta RENDER_GIT_COMMIT a ogni deploy. Serve allo smoke di
# produzione per aspettare che il deploy sia finito (il repository è pubblico, non è un segreto).
APP_VERSION = (os.environ.get("RENDER_GIT_COMMIT") or "dev")[:7]


@api.get("/")
async def root():
    return {"message": "Sconti Roma API", "status": "ok", "version": APP_VERSION}


# ---------- AI description assistant RIMOSSO su richiesta utente (2026-08-27) ----------


@api.get("/geocode/suggest")
async def api_geocode_suggest(q: str, limit: int = 5):
    """Endpoint pubblico per l'autocomplete indirizzi (usato dai form merchant)."""
    limit = max(1, min(limit, 10))
    return {"suggestions": await geocode_suggest(q, limit)}


# ---------- AI Image Enhancement (Gemini Nano Banana) ----------
class ImageEnhanceIn(BaseModel):
    image_url: str  # URL o data URL (base64) dell'immagine originale
    category: Optional[str] = None  # es. "Ristorante", "Palestra" — aiuta il prompt


_MAX_REMOTE_IMAGE_BYTES = 8 * 1024 * 1024


async def _assert_public_http_url(url: str) -> None:
    """Anti-SSRF: accetta solo http(s) verso host che risolvono a IP pubblici.
    Blocca localhost, reti private, link-local (es. metadata cloud 169.254.169.254)."""
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise HTTPException(400, "URL immagine non valido")
    try:
        infos = await asyncio.get_running_loop().getaddrinfo(
            parsed.hostname, parsed.port or (443 if parsed.scheme == "https" else 80),
            type=socket.SOCK_STREAM,
        )
    except socket.gaierror:
        raise HTTPException(400, "Host immagine non raggiungibile")
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if (ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved
                or ip.is_multicast or ip.is_unspecified):
            raise HTTPException(400, "URL immagine non consentito")


async def _fetch_public_image(url: str, max_redirects: int = 3) -> bytes:
    """Scarica un'immagine da un URL pubblico. I redirect sono seguiti a mano
    e ogni salto viene ri-validato; il download e' limitato in dimensione."""
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=False) as client:
        for _ in range(max_redirects + 1):
            await _assert_public_http_url(url)
            async with client.stream("GET", url, headers={"User-Agent": "ScontiRomaBot/1.0"}) as r:
                if r.is_redirect:
                    loc = r.headers.get("location")
                    if not loc:
                        raise HTTPException(400, "Redirect non valido")
                    url = urljoin(url, loc)
                    continue
                r.raise_for_status()
                buf = bytearray()
                async for chunk in r.aiter_bytes():
                    buf.extend(chunk)
                    if len(buf) > _MAX_REMOTE_IMAGE_BYTES:
                        raise HTTPException(413, "Immagine troppo grande (max 8MB)")
                return bytes(buf)
    raise HTTPException(400, "Troppi redirect")


@api.post("/ai/enhance-image")
async def ai_enhance_image(payload: ImageEnhanceIn, user: dict = Depends(require_merchant)):
    """Riottimizza una foto usando Gemini Nano Banana (image-to-image).
    Restituisce un data URL base64 pronto per essere salvato al posto dell'originale."""
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_key:
        raise HTTPException(503, "AI enhancer non configurato (GEMINI_API_KEY mancante)")

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
            image_bytes = await _fetch_public_image(raw_url)
        if len(image_bytes) > 8 * 1024 * 1024:
            raise HTTPException(413, "Immagine troppo grande (max 8MB)")
        if len(image_bytes) < 200:
            raise HTTPException(422, "Immagine troppo piccola o non valida")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Impossibile scaricare l'immagine: {str(e)[:100]}")

    # Gemini vuole il MIME type dell'immagine in ingresso: lo ricaviamo dai magic bytes.
    if image_bytes[:8] == b"\x89PNG\r\n\x1a\n":
        in_mime = "image/png"
    elif image_bytes[:4] == b"RIFF" and image_bytes[8:12] == b"WEBP":
        in_mime = "image/webp"
    elif image_bytes[:3] == b"\xff\xd8\xff":
        in_mime = "image/jpeg"
    else:
        raise HTTPException(422, "Formato immagine non supportato (usa JPG, PNG o WEBP)")

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

    from google import genai
    from google.genai import types as genai_types
    session_id = f"sconti-enhance-{user['id'][:8]}-{uuid.uuid4().hex[:6]}"
    client = genai.Client(api_key=gemini_key)

    try:
        resp = await client.aio.models.generate_content(
            model="gemini-3.1-flash-image-preview",
            contents=[prompt, genai_types.Part.from_bytes(data=image_bytes, mime_type=in_mime)],
            config=genai_types.GenerateContentConfig(
                system_instruction="You are a professional photo retoucher AI.",
                response_modalities=["IMAGE", "TEXT"],
            ),
        )
        img = None
        for cand in resp.candidates or []:
            for part in (cand.content.parts if cand.content else None) or []:
                if part.inline_data and part.inline_data.data:
                    img = part.inline_data
                    break
            if img:
                break
        if not img:
            raise HTTPException(502, "AI non ha restituito immagini. Riprova con una foto diversa.")
        mime = img.mime_type or "image/png"
        data_url = f"data:{mime};base64,{_b64.b64encode(img.data).decode('utf-8')}"
        return {"enhanced_image_url": data_url, "session_id": session_id, "mime_type": mime}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"[ai-enhance] failed for merchant {user['id'][:8]}: {e}")
        testo_errore = str(e)
        if "429" in testo_errore or "RESOURCE_EXHAUSTED" in testo_errore:
            # Quota o credito del fornitore dell'IA esauriti: messaggio chiaro, senza il testo tecnico
            raise HTTPException(429, "Il miglioramento delle foto con l'IA ha raggiunto il limite per ora.")
        raise HTTPException(502, "L'IA non è riuscita a migliorare la foto.")


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
    # Dati personali sì, segreti tecnici no (hash, token monouso, contatori di sicurezza).
    profile = sanitize_user(await db.users.find_one({"id": uid}))

    redemptions = await db.redemptions.find({"user_id": uid}, {"_id": 0}).to_list(length=None)
    qr_scans = await db.qr_scans.find({"user_id": uid}, {"_id": 0}).to_list(length=None)
    subscriptions = await db.subscriptions.find({"user_id": uid}, {"_id": 0}).to_list(length=None)
    consents = await db.consent_logs.find({"user_id": uid}, {"_id": 0}).to_list(length=None)
    reviews = await db.reviews.find({"user_id": uid}, {"_id": 0}).to_list(length=None)
    app_feedback = await db.app_feedback.find({"user_id": uid}, {"_id": 0}).to_list(length=None)

    # Merchant-specific
    discounts, next_discounts, archive = [], [], []
    if user.get("role") == "merchant":
        discounts = await db.discounts.find({"merchant_id": uid}, {"_id": 0}).to_list(length=None)
        next_discounts = await db.next_discounts.find({"merchant_id": uid}, {"_id": 0}).to_list(length=None)
        archive = await db.discounts_archive.find({"merchant_id": uid}, {"_id": 0}).to_list(length=None)

    export_doc = {
        "export_generated_at": datetime.now(timezone.utc).isoformat(),
        "export_version": 1,
        "notice": "Questo file contiene tutti i tuoi dati personali trattati da Sconti Roma (art. 20 GDPR). Password e chiavi biometriche sono escluse per motivi di sicurezza.",
        "profile": profile,
        "redemptions": redemptions,
        "qr_scans": qr_scans,
        "subscriptions": subscriptions,
        "cookie_consent_log": consents,
        "reviews": reviews,
        "app_feedback": app_feedback,
        "merchant_discounts": discounts,
        "merchant_next_discounts": next_discounts,
        "merchant_discounts_archive": archive,
    }
    return export_doc


async def _erase_user_data(user: dict) -> None:
    """Cancella tutti i dati collegati a un utente (art. 17 GDPR), tranne l'utente stesso.
    I dati di pagamento con obbligo fiscale vengono anonimizzati anziché cancellati."""
    uid = user["id"]
    # 1. Anonimizza i dati di pagamento (obbligo fiscale 10 anni)
    anon = {"$set": {"user_id": f"deleted_{uid[:8]}", "anonymized": True,
                     "anonymized_at": datetime.now(timezone.utc).isoformat()}}
    for coll in (db.subscriptions, db.payment_transactions, db.renewal_events):
        await coll.update_many({"user_id": uid}, anon)
    # 2. Elimina tutto il resto collegato all'utente
    for coll in (db.redemptions, db.qr_scans, db.consent_logs, db.reviews,
                 db.app_feedback, db.webauthn_challenges, db.avvisi_preferiti):
        await coll.delete_many({"user_id": uid})
    if user.get("email"):
        await db.login_guard.delete_many({"key": _login_guard_key(user["email"].strip().lower())})

    # 3. Se merchant: offerte (attuale, mese dopo, archivio) e recensioni ricevute
    if user.get("role") == "merchant":
        for coll in (db.discounts, db.next_discounts, db.discounts_archive, db.reviews):
            await coll.delete_many({"merchant_id": uid})
        await db.avvisi_preferiti.delete_many({"merchant_id": uid})
        await db.users.update_many({"preferiti": uid}, {"$pull": {"preferiti": uid}})


@api.delete("/gdpr/delete-account")
async def gdpr_delete_account(user: dict = Depends(get_current_user), response: Response = None):
    """Cancellazione completa dell'account e di tutti i dati collegati (art. 17 GDPR).
    NB: I dati con obbligo di legge (fatturazione) vengono anonimizzati anziché cancellati."""
    uid = user["id"]

    if user.get("role") == "admin":
        raise HTTPException(400, "L'account admin non può essere cancellato via GDPR")

    await _erase_user_data(user)

    # Elimina l'utente
    await db.users.delete_one({"id": uid})
    if user.get("email"):
        _email_in_background(send_account_deleted(user["email"], user.get("name") or ""), "account-cancellato")

    # Logout
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
# Abbonamenti: job manuali per l'admin
# =====================================================================

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


# ---------- Analytics first-party (anonima, GDPR-friendly) ----------
class TrackEvent(BaseModel):
    type: Literal["open", "pageview", "click"]
    name: Optional[str] = Field(None, max_length=60)
    path: Optional[str] = Field(None, max_length=120)


class TrackIn(BaseModel):
    vid: str = Field(min_length=4, max_length=64)
    events: List[TrackEvent] = Field(max_length=20)


@api.post("/track")
async def track_events(payload: TrackIn):
    """Riceve eventi anonimi (nessun dato personale, vid casuale non legato all'account)."""
    if not payload.events:
        return {"ok": True}
    day = _rome_day()
    now = datetime.now(timezone.utc).isoformat()
    docs = [{
        "id": str(uuid.uuid4()),
        "vid": payload.vid,
        "type": e.type,
        "name": e.name or "",
        "path": e.path or "",
        "day": day,
        "created_at": now,
    } for e in payload.events]
    await db.analytics_events.insert_many(docs)
    return {"ok": True}


@api.get("/admin/traffic")
async def admin_traffic(user: dict = Depends(require_admin_master)):
    """Aggregati ultimi 30 giorni: aperture, visitatori unici, pagine viste, click chiave."""
    days = [(datetime.now(ROME_TZ) - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(29, -1, -1)]
    start_day = days[0]
    match30 = {"day": {"$gte": start_day}}

    counts = {d: {"opens": 0, "pageviews": 0, "clicks": 0} for d in days}
    async for r in db.analytics_events.aggregate([
        {"$match": match30},
        {"$group": {"_id": {"day": "$day", "type": "$type"}, "n": {"$sum": 1}}},
    ]):
        d, t = r["_id"]["day"], r["_id"]["type"]
        if d in counts:
            counts[d]["opens" if t == "open" else "pageviews" if t == "pageview" else "clicks"] = r["n"]

    visitors = {d: 0 for d in days}
    async for r in db.analytics_events.aggregate([
        {"$match": match30},
        {"$group": {"_id": "$day", "v": {"$addToSet": "$vid"}}},
        {"$project": {"n": {"$size": "$v"}}},
    ]):
        if r["_id"] in visitors:
            visitors[r["_id"]] = r["n"]

    top_pages = []
    async for r in db.analytics_events.aggregate([
        {"$match": {**match30, "type": "pageview"}},
        {"$group": {"_id": "$path", "n": {"$sum": 1}}},
        {"$sort": {"n": -1}}, {"$limit": 10},
    ]):
        top_pages.append({"path": r["_id"] or "/", "count": r["n"]})

    clicks = []
    async for r in db.analytics_events.aggregate([
        {"$match": {**match30, "type": "click"}},
        {"$group": {"_id": "$name", "n": {"$sum": 1}}},
        {"$sort": {"n": -1}}, {"$limit": 15},
    ]):
        clicks.append({"name": r["_id"] or "?", "count": r["n"]})

    today = days[-1]
    return {
        "days": days,
        "series": {
            "opens": [counts[d]["opens"] for d in days],
            "pageviews": [counts[d]["pageviews"] for d in days],
            "visitors": [visitors[d] for d in days],
        },
        "today": {"opens": counts[today]["opens"], "visitors": visitors[today], "pageviews": counts[today]["pageviews"]},
        "totals_30d": {
            "opens": sum(c["opens"] for c in counts.values()),
            "pageviews": sum(c["pageviews"] for c in counts.values()),
        },
        "top_pages": top_pages,
        "clicks": clicks,
    }


@api.get("/admin/economics")
async def admin_economics(user: dict = Depends(require_admin_master)):
    """Riepilogo economico: abbonati attivi per provider, MRR, commissioni stimate, netto."""
    PRICE = 2.99
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()

    by_provider = {"stripe": 0, "paypal": 0, "other": 0}
    new_this_month = 0
    async for s in db.subscriptions.find({"status": "active"}):
        end = s.get("end_date")
        try:
            if end and datetime.fromisoformat(end) < now:
                continue
        except Exception:
            pass
        p = (s.get("provider") or "other").lower()
        by_provider[p if p in by_provider else "other"] += 1
        if (s.get("start_date") or "") >= month_start:
            new_this_month += 1

    active = sum(by_provider.values())
    gross = round(active * PRICE, 2)
    # Commissioni: Stripe carte EU 1.5% + €0.25 · PayPal ~3.4% + €0.35
    fee_stripe = round(by_provider["stripe"] * (PRICE * 0.015 + 0.25), 2)
    fee_paypal = round(by_provider["paypal"] * (PRICE * 0.034 + 0.35), 2)
    fees = round(fee_stripe + fee_paypal, 2)
    return {
        "price_eur": PRICE,
        "active_total": active,
        "by_provider": by_provider,
        "new_this_month": new_this_month,
        "mrr_gross": gross,
        "fees": {"stripe": fee_stripe, "paypal": fee_paypal, "total": fees},
        "net_estimated": round(gross - fees, 2),
        "net_per_sub": {
            "stripe": round(PRICE - (PRICE * 0.015 + 0.25), 2),
            "paypal": round(PRICE - (PRICE * 0.034 + 0.35), 2),
        },
    }


@api.get("/admin/merchants/geocode-issues")
async def admin_geocode_issues(user: dict = Depends(require_admin_master)):
    """Lista dei merchant che hanno un indirizzo NON geocodificabile (o mai geocodificato).
    Include sia i falliti espliciti sia quelli con address ma senza lat/lng."""
    query = {
        "role": "merchant",
        "address": {"$exists": True, "$ne": ""},
        "address_confirmed": {"$ne": True},
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


class AdminGeocodeConfirmIn(BaseModel):
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lng: Optional[float] = Field(None, ge=-180, le=180)


@api.post("/admin/merchants/{merchant_id}/geocode-confirm")
async def admin_geocode_confirm(
    merchant_id: str,
    payload: Optional[AdminGeocodeConfirmIn] = None,
    user: dict = Depends(require_admin_master),
):
    """Conferma manualmente un indirizzo non geocodificabile: l'admin accetta
    l'indirizzo così com'è (sparisce dagli avvisi). Se fornisce lat/lng
    (es. copiate da Google Maps) il negozio compare anche sulla mappa."""
    m = await db.users.find_one({"id": merchant_id, "role": "merchant"})
    if not m:
        raise HTTPException(404, "Merchant non trovato")
    if not m.get("address"):
        raise HTTPException(400, "Il merchant non ha un indirizzo da confermare")

    now_iso = datetime.now(timezone.utc).isoformat()
    set_fields = {"address_confirmed": True, "address_confirmed_at": now_iso}
    has_coords = payload is not None and payload.lat is not None and payload.lng is not None
    if has_coords:
        set_fields.update({"lat": payload.lat, "lng": payload.lng, "geocoded_at": now_iso, "geocode_manual": True})
    await db.users.update_one(
        {"id": merchant_id},
        {"$set": set_fields,
         "$unset": {"geocode_failed": "", "geocode_failed_at": "", "geocode_failed_address": ""}},
    )
    return {"ok": True, "on_map": bool(has_coords or (m.get("lat") is not None and m.get("lng") is not None))}


# ---------- Pagamenti dei commercianti: registro manuale (nessun addebito) ----------
# Il titolare incassa come vuole (bonifico, PayPal, contanti) e qui annota. Questo codice NON invia
# email, NON addebita nulla e NON cambia ciò che il commerciante vede: è solo un registro per l'admin.
# Niente dati di carte o IBAN. Il «piano» sta in `merchant_plans` (non nel documento utente).
PAG_METODI = ("bonifico", "paypal", "contanti", "altro")
PAG_STATI = ("in_prova", "attivo", "scaduto", "sospeso")
PAG_IMPORTO_SUGGERITO_CENT = 499
PAG_IMPORTO_MAX_CENT = 100_000  # 1000 €: oltre è quasi certamente un errore di battitura


def _pag_oggi() -> date:
    return _rome_now().date()


def _pag_data(valore, campo: str, obbligatoria: bool = False):
    """Legge 'AAAA-MM-GG' (o vuoto). Errore 422 in italiano se il formato non è giusto."""
    if valore in (None, ""):
        if obbligatoria:
            raise HTTPException(422, f"{campo}: la data è obbligatoria")
        return None
    try:
        return date.fromisoformat(str(valore).strip())
    except ValueError:
        raise HTTPException(422, f"{campo}: data non valida (usa il formato AAAA-MM-GG)")


def _pag_aggiungi_mese(d: date, mesi: int = 1) -> date:
    m = d.month - 1 + mesi
    anno, mese = d.year + m // 12, m % 12 + 1
    return date(anno, mese, min(d.day, calendar.monthrange(anno, mese)[1]))


def _pag_importo_cent(valore) -> int:
    try:
        euro = Decimal(str(valore).strip().replace(",", ".").replace("€", "").strip())
    except (InvalidOperation, AttributeError):
        raise HTTPException(422, "Importo non valido")
    if not euro.is_finite():
        raise HTTPException(422, "Importo non valido")
    cent = int((euro * 100).to_integral_value(rounding=ROUND_HALF_UP))
    if cent <= 0:
        raise HTTPException(422, "L'importo deve essere maggiore di zero")
    if cent > PAG_IMPORTO_MAX_CENT:
        raise HTTPException(422, "Importo troppo alto: controlla di non aver sbagliato")
    return cent


def _pag_euro(cent: int) -> str:
    return f"{cent // 100}.{cent % 100:02d}"


def _pag_prova_default() -> Optional[date]:
    fine = (os.environ.get("TRIAL_END_DATE") or "").strip()
    try:
        return date.fromisoformat(fine) if fine else None
    except ValueError:
        return None


def _pag_stato(piano: dict, oggi: date) -> str:
    """Stato del piano: «sospeso» solo se messo a mano; «attivo» se il rinnovo è oggi o dopo;
    «scaduto» se il rinnovo o la prova sono passati; altrimenti «in prova»."""
    if piano.get("stato_manuale") == "sospeso":
        return "sospeso"
    if piano.get("prossimo_rinnovo"):
        return "attivo" if date.fromisoformat(piano["prossimo_rinnovo"]) >= oggi else "scaduto"
    if piano.get("prova_fino_al") and date.fromisoformat(piano["prova_fino_al"]) < oggi:
        return "scaduto"
    return "in_prova"


async def _pag_piano(merchant_id: str) -> dict:
    p = await db.merchant_plans.find_one({"merchant_id": merchant_id}, {"_id": 0}) or {}
    prova = _pag_prova_default()
    return {
        "merchant_id": merchant_id,
        "prova_fino_al": p.get("prova_fino_al") or (prova.isoformat() if prova else None),
        "prossimo_rinnovo": p.get("prossimo_rinnovo"),
        "stato_manuale": p.get("stato_manuale"),
        "note": p.get("note") or "",
    }


def _pag_pubblico(p: dict, nomi: dict) -> dict:
    cent = int(p.get("importo_cent") or 0)
    return {
        "id": p["id"], "merchant_id": p["merchant_id"], "negozio": nomi.get(p["merchant_id"], "Negozio eliminato"),
        "importo_cent": cent, "importo": _pag_euro(cent), "metodo": p.get("metodo"),
        "data_pagamento": p.get("data_pagamento"),
        "periodo_coperto_dal": p.get("periodo_coperto_dal"), "periodo_coperto_al": p.get("periodo_coperto_al"),
        "nota": p.get("nota") or "", "stato": p.get("stato") or "registrato",
        "creato_da": p.get("creato_da"), "creato_il": p.get("creato_il"),
        "annullato_il": p.get("annullato_il"),
    }


async def _pag_nomi() -> dict:
    righe = await db.users.find({"role": "merchant"}, {"_id": 0, "id": 1, "shop_name": 1}).to_list(None)
    return {r["id"]: (r.get("shop_name") or "Senza nome") for r in righe}


async def _pag_righe_commercianti() -> list:
    """Un elemento per commerciante, con stato calcolato e ultimo pagamento valido."""
    oggi = _pag_oggi()
    nomi = await _pag_nomi()
    prova_def = _pag_prova_default()
    piani = {p["merchant_id"]: p for p in await db.merchant_plans.find({}, {"_id": 0}).to_list(None)}
    ultimi: dict = {}
    for p in await db.merchant_payments.find({"stato": {"$ne": "annullato"}}, {"_id": 0}).to_list(None):
        v = ultimi.get(p["merchant_id"])
        if not v or (p.get("data_pagamento") or "", p.get("creato_il") or "") > (v.get("data_pagamento") or "", v.get("creato_il") or ""):
            ultimi[p["merchant_id"]] = p
    out = []
    for mid, nome in nomi.items():
        raw = piani.get(mid) or {}
        piano = {
            "prova_fino_al": raw.get("prova_fino_al") or (prova_def.isoformat() if prova_def else None),
            "prossimo_rinnovo": raw.get("prossimo_rinnovo"),
            "stato_manuale": raw.get("stato_manuale"),
        }
        u = ultimi.get(mid)
        rinnovo = piano["prossimo_rinnovo"]
        out.append({
            "merchant_id": mid, "negozio": nome, "stato": _pag_stato(piano, oggi),
            "stato_manuale": piano["stato_manuale"] or "automatico",
            "prova_fino_al": piano["prova_fino_al"], "prossimo_rinnovo": rinnovo, "note": raw.get("note") or "",
            "giorni_al_rinnovo": (date.fromisoformat(rinnovo) - oggi).days if rinnovo else None,
            "ultimo_pagamento": ({"data": u.get("data_pagamento"), "importo_cent": u.get("importo_cent"),
                                  "importo": _pag_euro(int(u.get("importo_cent") or 0)), "metodo": u.get("metodo")} if u else None),
        })
    out.sort(key=lambda r: r["negozio"].lower())
    return out


class PagamentoIn(BaseModel):
    merchant_id: str
    importo: Optional[str] = None  # in euro, es. "4,99"; vuoto = importo suggerito
    metodo: str
    data_pagamento: Optional[str] = None
    periodo_coperto_dal: Optional[str] = None
    periodo_coperto_al: Optional[str] = None
    nota: Optional[str] = Field(default=None, max_length=300)

    @model_validator(mode="before")
    @classmethod
    def _importo_testo(cls, v):
        if isinstance(v, dict) and isinstance(v.get("importo"), (int, float)):
            v = {**v, "importo": str(v["importo"])}
        return v


class PianoIn(BaseModel):
    prova_fino_al: Optional[str] = None
    prossimo_rinnovo: Optional[str] = None
    stato: Optional[str] = None  # «automatico» o «sospeso»
    note: Optional[str] = Field(default=None, max_length=500)


@api.get("/admin/pagamenti-commercianti/commercianti")
async def pag_elenco_commercianti(user: dict = Depends(require_admin_master)):
    prova = _pag_prova_default()
    return {"oggi": _pag_oggi().isoformat(), "commercianti": await _pag_righe_commercianti(),
            "prova_predefinita": prova.isoformat() if prova else None,
            "importo_suggerito": _pag_euro(PAG_IMPORTO_SUGGERITO_CENT)}


@api.patch("/admin/pagamenti-commercianti/commercianti/{merchant_id}")
async def pag_modifica_piano(merchant_id: str, payload: PianoIn, user: dict = Depends(require_admin_master)):
    if not await db.users.find_one({"id": merchant_id, "role": "merchant"}, {"_id": 0, "id": 1}):
        raise HTTPException(404, "Commerciante non trovato")
    campi = payload.model_fields_set
    if not campi:
        raise HTTPException(400, "Nessuna modifica")
    modifiche: dict = {}
    if "prova_fino_al" in campi:
        d = _pag_data(payload.prova_fino_al, "Fine prova")
        modifiche["prova_fino_al"] = d.isoformat() if d else None
    if "prossimo_rinnovo" in campi:
        d = _pag_data(payload.prossimo_rinnovo, "Prossimo rinnovo")
        modifiche["prossimo_rinnovo"] = d.isoformat() if d else None
    if "stato" in campi:
        if payload.stato not in ("automatico", "sospeso", None):
            raise HTTPException(422, "Stato non valido: scegli «automatico» o «sospeso»")
        modifiche["stato_manuale"] = "sospeso" if payload.stato == "sospeso" else None
    if "note" in campi:
        modifiche["note"] = (payload.note or "").strip()
    modifiche["aggiornato_il"] = datetime.now(timezone.utc).isoformat()
    modifiche["aggiornato_da"] = user["id"]
    await db.merchant_plans.update_one({"merchant_id": merchant_id}, {"$set": modifiche}, upsert=True)
    righe = [r for r in await _pag_righe_commercianti() if r["merchant_id"] == merchant_id]
    return {"commerciante": righe[0]}


@api.post("/admin/pagamenti-commercianti")
async def pag_registra(payload: PagamentoIn, user: dict = Depends(require_admin_master)):
    """Annota un pagamento già incassato. Non addebita e non scrive al commerciante."""
    m = await db.users.find_one({"id": payload.merchant_id, "role": "merchant"}, {"_id": 0, "id": 1, "shop_name": 1})
    if not m:
        raise HTTPException(404, "Commerciante non trovato")
    if payload.metodo not in PAG_METODI:
        raise HTTPException(422, "Metodo non valido: bonifico, paypal, contanti o altro")
    cent = _pag_importo_cent(payload.importo) if (payload.importo or "").strip() else PAG_IMPORTO_SUGGERITO_CENT
    oggi = _pag_oggi()
    data_pag = _pag_data(payload.data_pagamento, "Data del pagamento") or oggi
    piano = await _pag_piano(payload.merchant_id)
    dal = _pag_data(payload.periodo_coperto_dal, "Periodo dal")
    al = _pag_data(payload.periodo_coperto_al, "Periodo al")
    if not dal:
        # Si riparte dalla copertura precedente se ancora valida (nessun giorno perso o regalato);
        # se è finita (o non c'è mai stata) si riparte da oggi. Primo pagamento durante la prova:
        # dalla fine della prova.
        rinnovo = date.fromisoformat(piano["prossimo_rinnovo"]) if piano["prossimo_rinnovo"] else None
        prova = date.fromisoformat(piano["prova_fino_al"]) if piano["prova_fino_al"] else None
        if rinnovo and rinnovo >= oggi:
            dal = rinnovo
        elif not rinnovo and prova and prova >= oggi:
            dal = prova
        else:
            dal = oggi
    if not al:
        al = _pag_aggiungi_mese(dal, 1)
    if al <= dal:
        raise HTTPException(422, "Il periodo coperto deve finire dopo il giorno di inizio")
    doc = {
        "id": str(uuid.uuid4()), "merchant_id": payload.merchant_id, "importo_cent": cent,
        "metodo": payload.metodo, "data_pagamento": data_pag.isoformat(),
        "periodo_coperto_dal": dal.isoformat(), "periodo_coperto_al": al.isoformat(),
        "nota": (payload.nota or "").strip(), "stato": "registrato",
        "creato_da": user["id"], "creato_il": datetime.now(timezone.utc).isoformat(),
    }
    await db.merchant_payments.insert_one(dict(doc))
    await db.merchant_plans.update_one(
        {"merchant_id": payload.merchant_id},
        {"$set": {"prossimo_rinnovo": al.isoformat(), "aggiornato_il": doc["creato_il"], "aggiornato_da": user["id"]}},
        upsert=True,
    )
    logging.info("Pagamento commerciante registrato (importo_cent=%s)", cent)
    return {"pagamento": _pag_pubblico(doc, {m["id"]: m.get("shop_name") or "Senza nome"}), "prossimo_rinnovo": al.isoformat()}


@api.delete("/admin/pagamenti-commercianti/{payment_id}")
async def pag_annulla(payment_id: str, user: dict = Depends(require_admin_master)):
    """Annulla (non cancella) un pagamento registrato per errore. Il rinnovo torna alla copertura precedente."""
    p = await db.merchant_payments.find_one({"id": payment_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Pagamento non trovato")
    if p.get("stato") == "annullato":
        raise HTTPException(409, "Pagamento già annullato")
    adesso = datetime.now(timezone.utc).isoformat()
    await db.merchant_payments.update_one({"id": payment_id}, {"$set": {"stato": "annullato", "annullato_il": adesso, "annullato_da": user["id"]}})
    piano = await db.merchant_plans.find_one({"merchant_id": p["merchant_id"]}, {"_id": 0}) or {}
    if piano.get("prossimo_rinnovo") == p.get("periodo_coperto_al"):
        rimasti = await db.merchant_payments.find({"merchant_id": p["merchant_id"], "stato": {"$ne": "annullato"}}, {"_id": 0}).to_list(None)
        fini = [x["periodo_coperto_al"] for x in rimasti if x.get("periodo_coperto_al")]
        await db.merchant_plans.update_one({"merchant_id": p["merchant_id"]},
                                           {"$set": {"prossimo_rinnovo": max(fini) if fini else None, "aggiornato_il": adesso, "aggiornato_da": user["id"]}})
    return {"ok": True}


@api.get("/admin/pagamenti-commercianti")
async def pag_elenco(merchant_id: Optional[str] = None, user: dict = Depends(require_admin_master)):
    filtro = {"merchant_id": merchant_id} if merchant_id else {}
    righe = await db.merchant_payments.find(filtro, {"_id": 0}).to_list(None)
    righe.sort(key=lambda p: (p.get("data_pagamento") or "", p.get("creato_il") or ""), reverse=True)
    nomi = await _pag_nomi()
    return {"pagamenti": [_pag_pubblico(p, nomi) for p in righe[:500]]}


@api.get("/admin/pagamenti-commercianti/rinnovi")
async def pag_rinnovi(user: dict = Depends(require_admin_master)):
    """Rinnovi nei prossimi 30 giorni, e prove che finiscono nei prossimi 30 giorni (senza pagamenti)."""
    limite = _pag_oggi() + timedelta(days=30)
    righe = await _pag_righe_commercianti()
    rinnovi = [r for r in righe if r["stato"] == "attivo" and date.fromisoformat(r["prossimo_rinnovo"]) <= limite]
    prove = [r for r in righe if r["stato"] == "in_prova" and r["prova_fino_al"] and date.fromisoformat(r["prova_fino_al"]) <= limite]
    rinnovi.sort(key=lambda r: r["prossimo_rinnovo"])
    prove.sort(key=lambda r: r["prova_fino_al"])
    return {"rinnovi": rinnovi, "prove_in_scadenza": prove}


@api.get("/admin/pagamenti-commercianti/scaduti")
async def pag_scaduti(user: dict = Depends(require_admin_master)):
    righe = [r for r in await _pag_righe_commercianti() if r["stato"] == "scaduto"]
    righe.sort(key=lambda r: r["prossimo_rinnovo"] or r["prova_fino_al"] or "")
    return {"scaduti": righe}


@api.get("/admin/pagamenti-commercianti/riepilogo")
async def pag_riepilogo(mese: Optional[str] = None, user: dict = Depends(require_admin_master)):
    """Totale incassato nel mese (di Roma, per data del pagamento), numero di pagamenti, commercianti per stato."""
    mese = mese or _pag_oggi().strftime("%Y-%m")
    if not re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", mese):
        raise HTTPException(422, "Mese non valido (usa AAAA-MM)")
    validi = await db.merchant_payments.find({"stato": {"$ne": "annullato"}}, {"_id": 0}).to_list(None)
    del_mese = [p for p in validi if (p.get("data_pagamento") or "").startswith(mese)]
    totale = sum(int(p.get("importo_cent") or 0) for p in del_mese)
    per_stato = {s: 0 for s in PAG_STATI}
    for r in await _pag_righe_commercianti():
        per_stato[r["stato"]] += 1
    return {"mese": mese, "mese_etichetta": month_label_it(mese), "totale_cent": totale, "totale": _pag_euro(totale),
            "numero_pagamenti": len(del_mese), "commercianti_per_stato": per_stato}


def _csv_cella(v) -> str:
    s = "" if v is None else str(v)
    if s[:1] in ("=", "+", "-", "@", "\t", "\r"):
        s = "'" + s  # niente formule eseguite da Excel
    return '"' + s.replace('"', '""') + '"'


@api.get("/admin/pagamenti-commercianti/esporta.csv")
async def pag_esporta_csv(user: dict = Depends(require_admin_master)):
    """Solo nome dell'attività, importo, metodo e date: niente note, email o altri dati."""
    righe = await db.merchant_payments.find({}, {"_id": 0}).to_list(None)
    righe.sort(key=lambda p: (p.get("data_pagamento") or "", p.get("creato_il") or ""))
    nomi = await _pag_nomi()
    intest = ["Attività", "Importo (€)", "Metodo", "Data pagamento", "Periodo dal", "Periodo al", "Stato"]
    linee = [";".join(_csv_cella(h) for h in intest)]
    for p in righe:
        cent = int(p.get("importo_cent") or 0)
        linee.append(";".join(_csv_cella(v) for v in [
            nomi.get(p["merchant_id"], "Negozio eliminato"), f"{cent // 100},{cent % 100:02d}", p.get("metodo"),
            p.get("data_pagamento"), p.get("periodo_coperto_dal"), p.get("periodo_coperto_al"), p.get("stato") or "registrato"]))
    corpo = "﻿" + "\r\n".join(linee) + "\r\n"
    return Response(content=corpo, media_type="text/csv; charset=utf-8",
                    headers={"Content-Disposition": 'attachment; filename="pagamenti-commercianti.csv"'})


# ---------- Include Router & CORS (LAST) ----------
app.include_router(api)

def _parse_cors_origins(raw: str) -> list:
    """Stessa forma che il browser mette nell'header Origin: senza spazi e senza barra finale."""
    return [o.strip().rstrip("/") for o in (raw or "").split(",") if o.strip().rstrip("/")]


cors_origins = _parse_cors_origins(os.environ.get("CORS_ORIGINS", ""))
if not cors_origins:
    # Non usare mai wildcard `*` con credentials — i browser rifiutano la
    # combinazione. In sviluppo locale accetta il frontend classico su :3000.
    logging.warning("CORS_ORIGINS non impostato: uso fallback dev http://localhost:3000")
    cors_origins = ["http://localhost:3000"]
CSRF_ORIGIN_MODE = os.environ.get("CSRF_ORIGIN_MODE", "log").strip().lower()  # off | log | enforce


@app.middleware("http")
async def origin_check_middleware(request: Request, call_next):
    """Difesa CSRF: i cookie sono SameSite=None, quindi un sito terzo potrebbe far
    partire richieste POST/PUT/PATCH/DELETE a nome di un utente loggato. I browser
    inviano sempre l'header Origin su queste richieste: se non e' il nostro sito
    (stesso host o CORS_ORIGINS) la richiesta e' sospetta. Le chiamate server-to-server
    (webhook Stripe/PayPal) non hanno Origin e passano.
    Modalita': off | log (default, solo avviso nei log) | enforce (blocca con 403)."""
    if CSRF_ORIGIN_MODE != "off" and request.method in ("POST", "PUT", "PATCH", "DELETE"):
        origin = request.headers.get("origin")
        if origin and origin not in cors_origins:
            from urllib.parse import urlparse as _urlparse
            o_host = (_urlparse(origin).netloc or "").lower()
            hosts = {
                (request.headers.get("host") or "").lower(),
                (request.headers.get("x-forwarded-host") or "").split(",")[0].strip().lower(),
            } - {""}  # un header mancante non deve far passare un Origin senza host ("null")
            if not o_host or o_host not in hosts:
                logging.warning(f"[csrf] Origin non riconosciuto: {origin} su {request.method} {request.url.path}")
                if CSRF_ORIGIN_MODE == "enforce":
                    return JSONResponse({"detail": "Origine non consentita"}, status_code=403)
    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
