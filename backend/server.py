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
import prova_pagamenti as pp
import email_service
from email_service import (
    mask_email,
    send_ci_pensiamo_noi,
    send_admin_offerta_confermata,
    send_password_reset,
    send_email_confirmation,
    send_preferito_nuova_offerta,
    send_merchant_approved,
    send_merchant_rejected,
    send_monthly_discounts_notification,
    send_renewal_receipt,
    send_payment_failed_immediate,
    send_grace_period_reminder,
    send_subscription_cancelled,
    send_master_reset,
    send_admin_segnalazione,
    send_admin_riepilogo_settimanale,
    send_esito_segnalazione,
    send_merchant_trial_reminder,
    send_next_offer_reminder,
    send_offer_expired,
    send_admin_month_summary,
    send_welcome_client,
    send_welcome_merchant,
    send_admin_new_merchant,
    send_admin_new_offer,
    send_admin_new_client,
    send_account_deleted,
    send_waitlist_confirmation,
    send_waitlist_launch_notice,
)
import paypal_service
from pywebpush import webpush, WebPushException
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Response, Body
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


# Modalità pre-lancio: SPENTA per impostazione predefinita (il sito vero non cambia). La accende il titolare
# su Render (PRELAUNCH_MODE=true) quando serve: la home e l'elenco offerte vuoto mostrano «Stiamo arrivando»
# con la lista d'attesa. Le funzioni per i negozi restano sempre attive. Letta a ogni richiesta.
def prelaunch_mode() -> bool:
    return os.environ.get("PRELAUNCH_MODE", "false").strip().lower() in ("1", "true", "yes", "on")


# Conferma dell'email per i soli CLIENTI (i commercianti hanno Partita IVA e approvazione manuale).
# Acceso (predefinito) = il cliente non entra finché non tocca il link ricevuto per email. Spento
# ("false") = si entra subito, come prima; i test e2e e di backend lo tengono spento.
def client_email_confirmation_required() -> bool:
    return os.environ.get("CLIENT_EMAIL_CONFIRMATION_REQUIRED", "true").strip().lower() in ("1", "true", "yes", "on")


# «Prima il pagamento, poi la pubblicazione» per i negozi. Spento (predefinito) = nessun effetto:
# le offerte si vedono come sempre. Acceso ("true") = un negozio non in prova e non in regola col
# pagamento del mese non è visibile ai clienti. Non addebita nulla: i pagamenti si segnano a mano.
def merchant_payment_required() -> bool:
    return os.environ.get("MERCHANT_PAYMENT_REQUIRED", "false").strip().lower() in ("1", "true", "yes", "on")


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
    "email_confirmed", "email_confirm_token_hash", "email_confirm_expires", "email_confirm_req_log",
    "pin_reset_code_hash", "pin_reset_expires", "pin_reset_attempts", "pin_reset_req_log",
    "login_failed_attempts", "pin_failed_attempts", "recovery_failed_attempts",
    "webauthn_credentials", "webauthn_user_id",
    # PIN rimosso il 03/10: i campi possono restare negli account vecchi finché non rientrano.
    "pin_set", "pin_locked_until",
    # Codice del negozio (4 cifre al banco): lo legge solo il commerciante, dall'endpoint dedicato.
    "shop_code", "shop_code_version", "shop_code_changed_at",
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
            logging.info(f"[grace-expired] email cancellazione inviata to={mask_email(u['email'])}")
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
    partita_iva: Optional[str] = None
    # GDPR consents:
    legal_accepted: Optional[bool] = False
    # Solo commercianti: approvazione specifica delle clausole dei Termini (artt. 1341-1342 c.c.)
    legal_specific_accepted: Optional[bool] = False
    marketing_opt_in: Optional[bool] = False
    # Tracking referral: merchant_id da cui l'iscritto proviene (QR personalizzato)
    referred_by: Optional[str] = None
    # Da quale volantino/QR di campagna arriva (es. «volantino-garbatella»): solo lettere minuscole, numeri e trattini
    fonte: Optional[str] = None


_FONTE_RE = re.compile(r"^[a-z0-9-]{1,40}$")


def _partita_iva_valida(valore) -> Optional[str]:
    """Partita IVA italiana: 11 cifre con cifra di controllo (algoritmo di Luhn). Ritorna le sole cifre, oppure None."""
    cifre = re.sub(r"[\s.]", "", str(valore or "")).upper()
    if cifre.startswith("IT"):
        cifre = cifre[2:]
    if not re.fullmatch(r"\d{11}", cifre):
        return None
    totale = 0
    for i, c in enumerate(cifre):
        n = int(c)
        if i % 2 == 1:
            n *= 2
            if n > 9:
                n -= 9
        totale += n
    return cifre if totale % 10 == 0 else None


def _fonte_valida(valore) -> Optional[str]:
    """Fonte di campagna (volantino, QR): accetta solo minuscole, numeri e trattini, massimo 40 caratteri."""
    v = (valore or "").strip().lower()
    return v if _FONTE_RE.match(v) else None


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


# Vecchio abbonamento clienti (SPENTO: CLIENT_SUBSCRIPTION_REQUIRED=false). Il codice di Stripe/PayPal resta ma non
# addebita nulla; il prezzo sta solo qui e non compare in nessun testo mostrato agli utenti.
PREZZO_CLIENTE_CENT = 299
PREZZO_CLIENTE_EUR = PREZZO_CLIENTE_CENT / 100


# Lavori che partono «in background» dopo la risposta (email, notifiche push, geocodifica, avviso di lancio).
# asyncio tiene solo un riferimento debole ai task: senza questo insieme un lavoro può sparire a metà. L'insieme
# serve anche ai test, che aspettano la fine dei lavori invece di indovinare un'attesa fissa (asyncio.sleep).
_LAVORI_IN_BACKGROUND: set = set()


def _in_background(coro) -> asyncio.Task:
    """Fa partire `coro` senza far aspettare chi usa l'app e ne tiene il riferimento finché non finisce."""
    task = asyncio.create_task(coro)
    _LAVORI_IN_BACKGROUND.add(task)
    task.add_done_callback(_LAVORI_IN_BACKGROUND.discard)
    return task


async def attendi_lavori_in_background(timeout: float = 15.0) -> None:
    """Aspetta la fine dei lavori in background di questo event loop, compresi quelli fatti partire da altri lavori
    (per esempio avvisi ai preferiti → notifiche promozionali). Oltre `timeout` secondi alza TimeoutError."""
    loop = asyncio.get_running_loop()
    scadenza = loop.time() + timeout
    while True:
        attivi = [t for t in list(_LAVORI_IN_BACKGROUND)
                  if not t.done() and t.get_loop() is loop and t is not asyncio.current_task()]
        if not attivi:
            return
        resto = scadenza - loop.time()
        if resto <= 0:
            raise TimeoutError(f"{len(attivi)} lavori in background non finiti dopo {timeout} s")
        await asyncio.wait(attivi, timeout=resto)


def _email_in_background(coro, label: str) -> None:
    """Invia un'email senza far aspettare chi usa l'app; un errore finisce solo nei log."""
    async def run():
        try:
            await coro
        except Exception as e:
            logging.warning(f"[email:{label}] non inviata: {e}")
    _in_background(run())


# ---------- Notifiche push all'admin (Web Push standard, chiavi VAPID) ----------
# Le chiavi VAPID arrivano da VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY se impostate; altrimenti il server ne
# genera una coppia la prima volta e la salva in `config_push` (mai nel repository né nei log).
VAPID_SUBJECT = "mailto:info@scontiroma.it"
PUSH_TTL_SEC = 24 * 3600
PUSH_ISCRIZIONI_MAX_PER_ADMIN = 10


def _b64url(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def _genera_chiavi_vapid() -> dict:
    """Nuova coppia P-256: pubblica «non compressa» e privata grezza (32 byte), entrambe base64url,
    lo stesso formato di `web-push generate-vapid-keys`."""
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
    priv = ec.generate_private_key(ec.SECP256R1())
    raw_priv = priv.private_numbers().private_value.to_bytes(32, "big")
    pub = priv.public_key().public_bytes(Encoding.X962, PublicFormat.UncompressedPoint)
    return {"public_key": _b64url(pub), "private_key": _b64url(raw_priv)}


async def _chiavi_vapid() -> dict:
    """Chiavi VAPID da usare: env se presenti, altrimenti quelle salvate (generate una sola volta)."""
    env_pub = os.environ.get("VAPID_PUBLIC_KEY", "").strip()
    env_priv = os.environ.get("VAPID_PRIVATE_KEY", "").strip()
    if env_pub and env_priv:
        return {"public_key": env_pub, "private_key": env_priv, "origine": "env"}
    doc = await db.config_push.find_one({"key": "vapid"})
    if not doc:
        nuove = _genera_chiavi_vapid()
        try:
            # $setOnInsert: se due avvii generano insieme, vince la prima coppia salvata.
            await db.config_push.update_one(
                {"key": "vapid"},
                {"$setOnInsert": {**nuove, "created_at": datetime.now(timezone.utc).isoformat()}},
                upsert=True)
        except DuplicateKeyError:
            pass
        doc = await db.config_push.find_one({"key": "vapid"})
        logging.info("[push-admin] chiavi VAPID generate e salvate nel database")
    return {"public_key": doc["public_key"], "private_key": doc["private_key"], "origine": "database"}


async def _invia_push_admin(titolo: str, testo: str = "", url: str = "/admin", user_id: Optional[str] = None) -> dict:
    """Manda una notifica a tutte le iscrizioni degli admin (o di un solo admin)."""
    filtro_admin = {"role": "admin"}
    if user_id:
        filtro_admin["id"] = user_id
    admin_ids = [u["id"] async for u in db.users.find(filtro_admin, {"_id": 0, "id": 1})]
    if not admin_ids:
        return {"inviate": 0, "rimosse": 0, "errori": 0}
    iscrizioni = await db.admin_push_iscrizioni.find(
        {"user_id": {"$in": admin_ids}}, {"_id": 0}).to_list(PUSH_ISCRIZIONI_MAX_PER_ADMIN * len(admin_ids))
    return await _manda_push(db.admin_push_iscrizioni, iscrizioni, titolo, testo, url, "push-admin")


async def _manda_push(collezione, iscrizioni: list, titolo: str, testo: str, url: str, etichetta: str) -> dict:
    """Motore comune (admin, commercianti, clienti): stessa notifica a ogni iscrizione dell'elenco. Le scadute
    (404/410) si cancellano dalla `collezione`; ogni altro errore va solo nei log, senza l'indirizzo dell'iscrizione."""
    esito = {"inviate": 0, "rimosse": 0, "errori": 0}
    if not iscrizioni:
        return esito
    chiavi = await _chiavi_vapid()
    dati = _json.dumps({"title": titolo, "body": testo, "url": url}, ensure_ascii=False)
    for s in iscrizioni:
        info = {"endpoint": s["endpoint"], "keys": {"p256dh": s["p256dh"], "auth": s["auth"]}}
        try:
            # Claims nuovi a ogni invio: la libreria ci scrive dentro «aud» del servizio push.
            await asyncio.to_thread(webpush, subscription_info=info, data=dati,
                                    vapid_private_key=chiavi["private_key"],
                                    vapid_claims={"sub": VAPID_SUBJECT}, ttl=PUSH_TTL_SEC, timeout=10)
            esito["inviate"] += 1
        except WebPushException as e:
            stato = getattr(getattr(e, "response", None), "status_code", None)
            if stato in (404, 410):
                await collezione.delete_one({"endpoint": s["endpoint"]})
                esito["rimosse"] += 1
                logging.info(f"[{etichetta}] iscrizione scaduta ({stato}) cancellata")
            else:
                esito["errori"] += 1
                logging.warning(f"[{etichetta}] non inviata (stato {stato})")
        except Exception as e:
            esito["errori"] += 1
            logging.warning(f"[{etichetta}] non inviata: {type(e).__name__}")
    return esito


def _push_admin_in_background(titolo: str, testo: str = "", label: str = "push") -> None:
    """Notifica all'admin senza far aspettare chi usa l'app; un errore finisce solo nei log."""
    async def run():
        try:
            await _invia_push_admin(titolo, testo)
        except Exception as e:
            logging.warning(f"[push-admin:{label}] non inviata: {type(e).__name__}")
    _in_background(run())


# ---------- Allarme email non partite (invio Resend fallito) ----------
# Ogni fallimento è una riga in `email_fallite` con solo tipo di email e codice d'errore (nessun indirizzo, nessun
# dato personale), cancellata da sola dopo 7 giorni. Oltre la soglia in un'ora l'admin riceve UNA notifica push
# (mai un'email: se le email non partono, un'email di avviso non arriverebbe).
EMAIL_FALLITE_GIORNI = 7


def _soglia_email_fallite() -> int:
    try:
        return max(1, int(os.environ.get("EMAIL_FALLITE_SOGLIA_ORA", "3")))
    except ValueError:
        return 3


async def _registra_email_fallita(tipo: str, codice: str) -> None:
    ora = datetime.now(timezone.utc)
    await db.email_fallite.insert_one({
        "id": str(uuid.uuid4()), "tipo": str(tipo or "sconosciuta")[:60], "codice": str(codice or "?")[:40],
        "at": ora.isoformat(), "expires_at": ora + timedelta(days=EMAIL_FALLITE_GIORNI),
    })
    soglia = _soglia_email_fallite()
    ultima_ora = await db.email_fallite.count_documents({"at": {"$gte": (ora - timedelta(hours=1)).isoformat()}})
    if ultima_ora < soglia:
        return
    # Al massimo un avviso per ora solare, anche con due copie del server accese (prenotazione atomica).
    chiave = f"allarme_email_fallite_{ora:%Y%m%d%H}"
    try:
        prenota = await db.reminder_claims.update_one(
            {"key": chiave}, {"$setOnInsert": {"key": chiave, "expires_at": ora + timedelta(days=2)}}, upsert=True)
    except DuplicateKeyError:
        return
    if prenota.upserted_id is None:
        return
    logging.warning(f"[email:allarme] {ultima_ora} email non partite nell'ultima ora (soglia {soglia})")
    await _invia_push_admin("Email non partite",
                            f"{ultima_ora} email non sono partite nell'ultima ora. Controlla «Salute» nel pannello admin.")


async def _conteggio_email_fallite() -> dict:
    """Per il riquadro «Salute»: quante email non sono partite nelle ultime 24 ore, per tipo e per codice."""
    ora = datetime.now(timezone.utc)
    da_24h = (ora - timedelta(hours=24)).isoformat()
    righe = await db.email_fallite.find({"at": {"$gte": da_24h}}, {"_id": 0, "tipo": 1, "codice": 1, "at": 1}).to_list(5000)
    per_tipo: dict = {}
    for r in righe:
        per_tipo[r.get("tipo") or "sconosciuta"] = per_tipo.get(r.get("tipo") or "sconosciuta", 0) + 1
    da_1h = (ora - timedelta(hours=1)).isoformat()
    return {
        "ok": not righe, "ultime_24h": len(righe), "ultima_ora": sum(1 for r in righe if (r.get("at") or "") >= da_1h),
        "per_tipo": per_tipo, "codici": sorted({r.get("codice") or "?" for r in righe}),
        "ultima": max((r.get("at") or "" for r in righe), default=None), "soglia_ora": _soglia_email_fallite(),
    }


email_service.imposta_avviso_email_fallita(_registra_email_fallita)


def admin_email_nuovo_cliente_attiva() -> bool:
    """Interruttore ADMIN_EMAIL_NUOVO_CLIENTE (predefinito acceso)."""
    return os.environ.get("ADMIN_EMAIL_NUOVO_CLIENTE", "true").strip().lower() not in ("false", "0", "no", "off")


def _avvisa_admin_nuovo_cliente() -> None:
    """Nuovo cliente iscritto: notifica push ed email all'admin, entrambe SENZA dati del cliente."""
    _push_admin_in_background("Nuovo cliente iscritto", "", "nuovo-cliente")
    to = _admin_notify_to()
    if not (to and admin_email_nuovo_cliente_attiva()):
        return

    async def email():
        totale = await db.users.count_documents({"role": "client"})
        quando = _rome_now().strftime("%d/%m/%Y alle %H:%M")
        await send_admin_new_client(to, quando, totale)
    _email_in_background(email(), "admin-nuovo-cliente")


# ---------- Notifiche push per commercianti e clienti (interruttore PUSH_UTENTI_ENABLED) ----------
# Stesse chiavi VAPID e stesso service worker (/sw-push.js) dell'admin. Interruttore SPENTO per impostazione
# predefinita: gli indirizzi /api/push/* rispondono 404, il sito non mostra nulla e nessuna notifica parte.
# Da accendere solo dopo l'aggiornamento di Privacy e Cookie. Nel testo delle notifiche mai dati personali.
PUSH_ISCRIZIONI_MAX_PER_UTENTE = 10
# Versione del testo dei consensi mostrato nel riquadro «Notifiche» del cliente: si salva con ogni scelta.
PUSH_CONSENSO_VERSIONE = "2026-10-21"
PUSH_PROMO_ORA_INIZIO = 9   # notifiche promozionali solo dalle 9:00 alle 21:00 (ora di Roma);
PUSH_PROMO_ORA_FINE = 21    # fuori fascia restano in coda e partono dopo
PUSH_CATEGORIE_CLIENTE = ("servizio", "offerte")


def push_utenti_attivo() -> bool:
    return os.environ.get("PUSH_UTENTI_ENABLED", "false").strip().lower() in ("1", "true", "yes", "on")


def _consenso_push(user: dict, categoria: str) -> bool:
    return bool(((user.get("push_consenso") or {}).get(categoria) or {}).get("attivo"))


def _breve(testo: str, n: int = 60) -> str:
    testo = (testo or "").strip()
    return testo if len(testo) <= n else testo[: n - 1].rstrip() + "…"


async def _prenota_push(chiave: str, user_id: Optional[str], giorni: int = 60) -> bool:
    """Prenotazione atomica: True solo la prima volta per quella chiave (due server insieme non mandano doppioni)."""
    r = await db.push_inviati.update_one(
        {"chiave": chiave},
        {"$setOnInsert": {"chiave": chiave, "user_id": user_id,
                          "expires_at": datetime.now(timezone.utc) + timedelta(days=giorni)}}, upsert=True)
    return r.upserted_id is not None


async def _invia_push_utente(user_id: str, titolo: str, testo: str = "", url: str = "/",
                             categoria: str = "servizio") -> dict:
    """Notifica a tutti i dispositivi di un commerciante o di un cliente. Il cliente la riceve solo con il consenso
    di quella categoria («servizio» o «offerte»); il commerciante riceve solo notifiche di servizio."""
    vuoto = {"inviate": 0, "rimosse": 0, "errori": 0}
    if not push_utenti_attivo() or not user_id:
        return vuoto
    u = await db.users.find_one({"id": user_id}, {"_id": 0, "id": 1, "role": 1, "push_consenso": 1})
    if not u or u.get("role") not in ("client", "merchant"):
        return vuoto
    if u["role"] == "client" and not _consenso_push(u, categoria):
        return vuoto
    if u["role"] == "merchant" and categoria != "servizio":
        return vuoto
    iscrizioni = await db.push_iscrizioni.find({"user_id": user_id}, {"_id": 0}).to_list(PUSH_ISCRIZIONI_MAX_PER_UTENTE)
    return await _manda_push(db.push_iscrizioni, iscrizioni, titolo, testo, url, "push-utenti")


def _push_utente_in_background(user_id: Optional[str], titolo: str, testo: str = "", url: str = "/",
                               categoria: str = "servizio", label: str = "push") -> None:
    """Come _invia_push_utente, senza far aspettare chi usa l'app; un errore finisce solo nei log."""
    if not push_utenti_attivo() or not user_id:
        return

    async def run():
        try:
            await _invia_push_utente(user_id, titolo, testo, url, categoria)
        except Exception as e:
            logging.warning(f"[push-utenti:{label}] non inviata: {type(e).__name__}")
    _in_background(run())


def _push_esito_offerta(merchant_id: Optional[str], titolo_offerta: str, approvata: bool, mese_dopo: bool = False) -> None:
    """Al commerciante: «Offerta approvata: …» o «Offerta da correggere: …» (il motivo resta nell'app e nell'email)."""
    t = _breve(titolo_offerta) or "la tua offerta"
    if approvata:
        _push_utente_in_background(
            merchant_id, f"Offerta approvata: {t}",
            "Sarà online dal 1° del mese prossimo." if mese_dopo else "Ora i clienti la vedono su Sconti Roma.",
            "/merchant/dashboard", label="offerta-approvata")
    else:
        _push_utente_in_background(
            merchant_id, f"Offerta da correggere: {t}", "Apri Sconti Roma per vedere cosa cambiare.",
            "/merchant/dashboard" if mese_dopo else "/merchant/discount", label="offerta-rifiutata")


def _aree_della_zona(zona: Optional[str]) -> list:
    """Aree del menu (le 16 zone) che comprendono la zona salvata sul negozio."""
    return [v for v, _, _ in ZONE_AREE if _zona_corrisponde(zona, v)]


async def _accoda_push_offerta(d: dict) -> int:
    """Offerta appena online: mette in coda una notifica PROMOZIONALE per i clienti con il consenso «offerte»
    che seguono il negozio (preferiti) o hanno scelto la sua zona. Una volta per cliente, negozio e mese."""
    if not push_utenti_attivo():
        return 0
    mid = d.get("merchant_id")
    m = await db.users.find_one({"id": mid, "role": "merchant"}, {"_id": 0, "id": 1, "zone": 1, "approved": 1}) if mid else None
    if not m or m.get("approved") is False:
        return 0
    aree = _aree_della_zona(m.get("zone"))
    condizioni = [{"preferiti": mid}]
    if aree:
        condizioni.append({"push_consenso.offerte.zone": {"$in": aree}})
    iscritti = set(await db.push_iscrizioni.distinct("user_id"))
    mese = current_month_key()
    now_iso = datetime.now(timezone.utc).isoformat()
    accodate = 0
    async for c in db.users.find({"role": "client", "push_consenso.offerte.attivo": True, "$or": condizioni},
                                 {"_id": 0, "id": 1, "preferiti": 1}):
        if c["id"] not in iscritti:
            continue
        if not await _prenota_push(f"promo:{c['id']}:{mid}:{mese}", c["id"], 40):
            continue
        await db.push_coda.insert_one({
            "id": str(uuid.uuid4()), "user_id": c["id"], "merchant_id": mid, "discount_id": d.get("id"),
            "tipo": "preferito" if mid in (c.get("preferiti") or []) else "zona", "creata_il": now_iso})
        accodate += 1
    return accodate


async def _invia_coda_promozionale() -> dict:
    """Svuota la coda delle notifiche promozionali: al massimo UNA al giorno per cliente e mai tra le 21:00 e
    le 9:00 (ora di Roma). Più offerte in coda diventano una sola notifica; chi ha già ricevuto quella del
    giorno resta in coda fino a domani. Consenso, offerta e negozio si ricontrollano al momento dell'invio."""
    esito = {"inviate": 0, "rimandate": 0, "scartate": 0}
    if not push_utenti_attivo():
        return {**esito, "spento": True}
    adesso = _rome_now()
    if not (PUSH_PROMO_ORA_INIZIO <= adesso.hour < PUSH_PROMO_ORA_FINE):
        return {**esito, "fuori_orario": True}
    giorno = adesso.strftime("%Y-%m-%d")
    sospesi = await _merchant_sospesi()
    for uid in await db.push_coda.distinct("user_id"):
        voci = await db.push_coda.find({"user_id": uid}, {"_id": 0}).sort("creata_il", 1).to_list(200)
        ids = [v["id"] for v in voci]
        c = await db.users.find_one({"id": uid, "role": "client"},
                                    {"_id": 0, "id": 1, "preferiti": 1, "push_consenso": 1})
        if not c or not _consenso_push(c, "offerte"):
            await db.push_coda.delete_many({"id": {"$in": ids}})
            esito["scartate"] += len(ids)
            continue
        aree_cliente = set(((c.get("push_consenso") or {}).get("offerte") or {}).get("zone") or [])
        valide = []
        for v in voci:
            d = await db.discounts.find_one({"id": v.get("discount_id")}, {"_id": 0})
            if not d or d.get("approval_status") != "approved" or d.get("active") is False \
                    or d.get("merchant_id") in sospesi:
                continue
            m = await db.users.find_one({"id": d.get("merchant_id")}, {"_id": 0, "id": 1, "shop_name": 1, "zone": 1})
            segue = d.get("merchant_id") in (c.get("preferiti") or [])
            if m and (segue or aree_cliente & set(_aree_della_zona(m.get("zone")))):
                valide.append((d, m, segue))
        if not valide:
            await db.push_coda.delete_many({"id": {"$in": ids}})
            esito["scartate"] += len(ids)
            continue
        if not await _prenota_push(f"promo-giorno:{uid}:{giorno}", uid, 3):
            esito["rimandate"] += 1  # già una oggi: resta in coda per domani
            continue
        if len(valide) == 1:
            d, m, segue = valide[0]
            titolo = "Nuova offerta da un negozio che segui" if segue else "Nuova offerta nella tua zona"
            testo = _breve(f"{m.get('shop_name') or 'Un negozio'}: {d.get('title') or ''}", 110)
            url = f"/discounts/{d['id']}"
        else:
            titolo = "Nuove offerte per te"
            testo = f"{len(valide)} nuove offerte da negozi che segui o nella tua zona."
            url = "/discounts"
        await _invia_push_utente(uid, titolo, testo, url, "offerte")
        await db.push_coda.delete_many({"id": {"$in": ids}})
        esito["inviate"] += 1
    return esito


def _push_promo_in_background(d: dict) -> None:
    """Accoda le notifiche promozionali per un'offerta appena online e prova subito a mandarle (se in fascia)."""
    if not push_utenti_attivo():
        return

    async def run():
        try:
            if await _accoda_push_offerta(d):
                await _invia_coda_promozionale()
        except Exception as e:
            logging.warning(f"[push-utenti:promo] non inviata: {type(e).__name__}")
    _in_background(run())


async def _run_push_offerte_in_scadenza() -> dict:
    """Ogni giorno (10:05, Roma): «La tua offerta scade tra 3 giorni» ai commercianti con l'offerta online che
    non hanno ancora caricato quella del mese dopo né scelto «Non rinnovo». Una sola volta per offerta e mese."""
    if not push_utenti_attivo():
        return {"spento": True, "inviate": 0}
    oggi = _rome_now().date()
    nm = next_month_key()
    caricate = set(await db.next_discounts.distinct("merchant_id", {"target_month": nm}))
    iscritti = set(await db.push_iscrizioni.distinct("user_id"))
    inviate = 0
    for d in await db.discounts.find({"approval_status": "approved", "active": True}, {"_id": 0}).to_list(None):
        fino = _offerta_valida_fino_al(d)
        if not fino or d.get("merchant_id") in caricate or d.get("merchant_id") not in iscritti:
            continue
        if (date.fromisoformat(fino) - oggi).days != 3:
            continue
        m = await db.users.find_one({"id": d.get("merchant_id")}, {"_id": 0, "id": 1, "no_renew_month": 1})
        if not m or m.get("no_renew_month") == nm:
            continue
        if not await _prenota_push(f"scade3:{d['id']}:{fino}", d.get("merchant_id")):
            continue
        await _invia_push_utente(d["merchant_id"], "La tua offerta scade tra 3 giorni",
                                 "Carica l'offerta del mese prossimo per restare visibile.", "/merchant/dashboard")
        inviate += 1
    return {"inviate": inviate}


async def _run_push_riepilogo_commercianti() -> dict:
    """Ogni sera (21:30, Roma): «Oggi X clienti hanno usato il tuo sconto», SOLO se X > 0. Mai una notifica per
    ogni scansione, nessun nome. Una sola volta per negozio e giorno."""
    if not push_utenti_attivo():
        return {"spento": True, "inviate": 0}
    giorno = _rome_now().strftime("%Y-%m-%d")
    da = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
    iscritti = set(await db.push_iscrizioni.distinct("user_id"))
    conteggi: dict = {}
    async for r in db.redemptions.find({"status": "redeemed", "redeemed_at": {"$gte": da}},
                                       {"_id": 0, "merchant_id": 1, "redeemed_at": 1}):
        if r.get("merchant_id") in iscritti and _rome_day(r.get("redeemed_at")) == giorno:
            conteggi[r["merchant_id"]] = conteggi.get(r["merchant_id"], 0) + 1
    inviate = 0
    for mid, x in conteggi.items():
        if x <= 0 or not await _prenota_push(f"riepilogo:{mid}:{giorno}", mid, 3):
            continue
        titolo = "Oggi 1 cliente ha usato il tuo sconto" if x == 1 else f"Oggi {x} clienti hanno usato il tuo sconto"
        await _invia_push_utente(mid, titolo, "", "/merchant/dashboard")
        inviate += 1
    return {"inviate": inviate}


async def _run_push_sconti_in_scadenza() -> dict:
    """Penultimo giorno del mese (10:10, Roma): «Il tuo sconto scade domani» ai clienti con un QR generato e non
    ancora usato (il codice vale solo nel mese in cui è nato). Notifica di servizio, una per cliente e mese."""
    if not push_utenti_attivo():
        return {"spento": True, "inviate": 0}
    adesso = _rome_now()
    ultimo = calendar.monthrange(adesso.year, adesso.month)[1]
    if ultimo - adesso.day != 1:
        return {"inviate": 0, "oggi_no": True}
    mese = current_month_key()
    sospesi = await _merchant_sospesi()
    iscritti = set(await db.push_iscrizioni.distinct("user_id"))
    gia = set()
    inviate = 0
    async for r in db.redemptions.find({"status": "pending", "month_key": mese},
                                       {"_id": 0, "user_id": 1, "discount_id": 1, "merchant_id": 1}):
        uid = r.get("user_id")
        if uid not in iscritti or uid in gia or r.get("merchant_id") in sospesi:
            continue
        d = await db.discounts.find_one({"id": r.get("discount_id")}, {"_id": 0, "approval_status": 1, "active": 1})
        if not d or d.get("approval_status") != "approved" or d.get("active") is False:
            continue
        gia.add(uid)
        if not await _prenota_push(f"sconto-domani:{uid}:{mese}", uid):
            continue
        esito = await _invia_push_utente(uid, "Il tuo sconto scade domani",
                                         "Hai un QR non ancora usato: vale fino a domani sera.", "/dashboard")
        inviate += 1 if esito["inviate"] else 0
    return {"inviate": inviate}


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


# ---------- Limite per client (anti registrazioni e richieste di massa) ----------
# I contatori restano SOLO in memoria (il server li dimentica al riavvio) e usano l'impronta dell'IP,
# mai l'IP in chiaro: nessun IP finisce nel database o nei log. Soglie larghe per non fermare gli utenti veri:
# una famiglia sullo stesso Wi-Fi o un negozio che iscrive clienti in negozio restano ben sotto il limite.
# Con il valore 0 il limite è spento (lo usano i test end-to-end, che iscrivono molti account dallo stesso IP).
MSG_TROPPE_RICHIESTE = "Troppe richieste, riprova tra qualche minuto."
_limiti_client: dict = {}


def _soglia_env(nome: str, predefinito: int) -> int:
    try:
        return int(os.environ.get(nome, predefinito))
    except (TypeError, ValueError):
        return predefinito


def _limite_client_ok(nome: str, request: Request, *regole: tuple) -> bool:
    """Vero se questo client può procedere; conta la richiesta solo se passa tutte le regole.
    Ogni regola è (massimo, finestra in secondi); massimo <= 0 = regola spenta."""
    regole = [(m, f) for m, f in regole if m > 0]
    if not regole:
        return True
    adesso = time.monotonic()
    chiave = (nome, hashlib.sha256(_ip_richiesta(request).encode()).hexdigest()[:16])
    recenti = [t for t in _limiti_client.get(chiave, []) if adesso - t < max(f for _, f in regole)]
    for massimo, finestra_sec in regole:
        if sum(1 for t in recenti if adesso - t < finestra_sec) >= massimo:
            _limiti_client[chiave] = recenti
            return False
    recenti.append(adesso)
    _limiti_client[chiave] = recenti
    if len(_limiti_client) > 5000:  # pulizia: via le chiavi scadute
        for k in [k for k, v in _limiti_client.items() if not v or adesso - v[-1] >= 86400]:
            _limiti_client.pop(k, None)
    return True


def _limite_registrazioni_ok(request: Request) -> bool:
    return _limite_client_ok("registrazione", request,
                             (_soglia_env("REGISTRAZIONI_MAX_PER_FINESTRA", 10),
                              _soglia_env("REGISTRAZIONI_FINESTRA_SEC", 600)))


def _limite_reset_ok(request: Request) -> bool:
    """Doppio limite per client: al massimo 3 richieste ogni 10 minuti E 5 all'ora."""
    return _limite_client_ok("reset-password", request,
                             (_soglia_env("RESET_MAX_PER_CLIENT_10MIN", 3), 600),
                             (_soglia_env("RESET_MAX_PER_CLIENT_ORA", 5), 3600))


# ---------- Conferma dell'email dei clienti ----------
CONFERMA_EMAIL_ORE = 48
CONFERMA_ACCOUNT_GIORNI = 7
MSG_CONFERMA_INVIATA = "Ti abbiamo mandato un'email: tocca il link per confermare il tuo account."
MSG_EMAIL_NON_CONFERMATA = ("Devi ancora confermare il tuo account: tocca il link nell'email che ti abbiamo mandato. "
                            "Non la trovi? Controlla lo spam oppure fattela rimandare.")
MSG_CONFERMA_RIMANDATA = "Se c'è un account da confermare con questa email, ti abbiamo mandato un nuovo link."
CODICE_EMAIL_NON_CONFERMATA = "email_non_confermata"
MSG_LINK_NON_VALIDO = "Questo link non è valido o è già stato usato."


def _hash_token_conferma(token: str) -> str:
    return hashlib.sha256((token or "").encode()).hexdigest()


def _campi_conferma_email(token: str) -> dict:
    """Campi da salvare per un account da confermare: solo l'impronta del token e la scadenza."""
    return {
        "email_confirmed": False,
        "email_confirm_token_hash": _hash_token_conferma(token),
        "email_confirm_expires": (datetime.now(timezone.utc) + timedelta(hours=CONFERMA_EMAIL_ORE)).isoformat(),
    }


_TOGLI_CONFERMA = {"email_confirm_token_hash": "", "email_confirm_expires": "", "email_confirm_req_log": ""}


async def _blocca_se_non_confermato(user: dict) -> None:
    """Chiamata dopo la verifica della password: un cliente non confermato non entra.
    Con l'interruttore spento chi era rimasto da confermare viene ammesso e segnato confermato."""
    if not user or user.get("role") != "client" or user.get("email_confirmed") is not False:
        return
    if client_email_confirmation_required():
        raise HTTPException(403, {"code": CODICE_EMAIL_NON_CONFERMATA, "msg": MSG_EMAIL_NON_CONFERMATA})
    await db.users.update_one({"id": user["id"]}, {"$set": {"email_confirmed": True}, "$unset": _TOGLI_CONFERMA})


class ConfirmEmailIn(BaseModel):
    token: str


class ResendConfirmIn(BaseModel):
    email: EmailStr


def _limite_conferma_ok(request: Request) -> bool:
    """«Rimanda l'email»: al massimo 3 richieste ogni 10 minuti E 5 all'ora per dispositivo.
    Solo in memoria (impronta dell'indirizzo, mai salvato)."""
    return _limite_client_ok("conferma-email", request,
                             (_soglia_env("CONFERMA_MAX_PER_CLIENT_10MIN", 3), 600),
                             (_soglia_env("CONFERMA_MAX_PER_CLIENT_ORA", 5), 3600))


@api.post("/auth/confirm-email")
async def confirm_email(payload: ConfirmEmailIn):
    """Conferma con il token ricevuto per email. Monouso: dopo la conferma l'impronta sparisce.
    Si chiama con POST dalla pagina dell'app (un GET potrebbe essere aperto dagli antivirus della posta)."""
    token = (payload.token or "").strip()
    u = await db.users.find_one({"email_confirm_token_hash": _hash_token_conferma(token)}) if token else None
    if not u:
        raise HTTPException(400, {"code": "link_non_valido", "msg": MSG_LINK_NON_VALIDO})
    try:
        scaduto = datetime.fromisoformat(u.get("email_confirm_expires", "")) < datetime.now(timezone.utc)
    except Exception:
        scaduto = True
    if scaduto:
        raise HTTPException(400, {"code": "link_scaduto", "msg": "Questo link è scaduto."})
    res = await db.users.update_one(
        {"id": u["id"], "email_confirm_token_hash": u["email_confirm_token_hash"]},
        {"$set": {"email_confirmed": True, "email_confirmed_at": datetime.now(timezone.utc).isoformat()},
         "$unset": _TOGLI_CONFERMA},
    )
    if res.modified_count != 1:  # due tocchi insieme: ne vale uno solo
        raise HTTPException(400, {"code": "link_non_valido", "msg": MSG_LINK_NON_VALIDO})
    _email_in_background(send_welcome_client(u["email"], u.get("name") or ""), "benvenuto-cliente")
    if u.get("role") == "client":
        _avvisa_admin_nuovo_cliente()
    return {"ok": True}


@api.post("/auth/resend-confirmation")
async def resend_confirmation(payload: ResendConfirmIn, request: Request):
    """Rimanda il link. Risposta identica se l'email esiste, non esiste o è già confermata."""
    if not _limite_conferma_ok(request):
        raise HTTPException(429, MSG_TROPPE_RICHIESTE, headers={"Retry-After": "600"})
    email = payload.email.lower().strip()
    u = await db.users.find_one({"email": email})
    if (u and u.get("role") == "client" and u.get("email_confirmed") is False
            and await _reset_request_allowed(u, "email_confirm_req_log")):
        token = secrets.token_urlsafe(32)  # il nuovo link sostituisce il precedente
        await db.users.update_one({"id": u["id"]}, {"$set": _campi_conferma_email(token)})
        try:
            await send_email_confirmation(u["email"], u.get("name") or "", token)
        except Exception as e:
            logging.warning(f"[email:conferma] non inviata: {e}")
    return {"ok": True, "message": MSG_CONFERMA_RIMANDATA}


async def _migra_conferma_email() -> int:
    """Chi era già iscritto prima di questa funzione è confermato: nessun utente esistente resta bloccato.
    Idempotente; non tocca gli account che hanno già il campo (compresi i nuovi non confermati)."""
    r = await db.users.update_many({"email_confirmed": {"$exists": False}}, {"$set": {"email_confirmed": True}})
    return r.modified_count


async def _run_unconfirmed_cleanup() -> dict:
    """Cancella i clienti mai confermati dopo CONFERMA_ACCOUNT_GIORNI giorni, con gli stessi dati
    collegati della cancellazione GDPR (`_erase_user_data`). Con l'interruttore spento non fa nulla."""
    if not client_email_confirmation_required():
        return {"skipped": True, "deleted": 0}
    limite = datetime.now(timezone.utc) - timedelta(days=CONFERMA_ACCOUNT_GIORNI)
    cancellati = 0
    async for u in db.users.find({"role": "client", "email_confirmed": False}):
        try:
            creato = datetime.fromisoformat(u.get("created_at", ""))
            if creato.tzinfo is None:
                creato = creato.replace(tzinfo=timezone.utc)
        except Exception:
            continue
        if creato >= limite:
            continue
        await _erase_user_data(u)
        await db.users.delete_one({"id": u["id"], "email_confirmed": False})
        cancellati += 1
    return {"skipped": False, "deleted": cancellati}


# ---------- Auth Routes ----------
@api.post("/auth/register")
async def register(payload: RegisterIn, response: Response, request: Request):
    # Anti registrazioni di massa: al massimo REGISTRAZIONI_MAX_PER_FINESTRA tentativi per client in
    # REGISTRAZIONI_FINESTRA_SEC (predefinito 10 ogni 10 minuti). Conta anche i tentativi con email già
    # usata, così non si possono nemmeno provare a raffica indirizzi per scoprire chi è iscritto.
    if not _limite_registrazioni_ok(request):
        raise HTTPException(429, MSG_TROPPE_RICHIESTE, headers={"Retry-After": "600"})
    # Termini, Privacy e Cookie Policy vanno accettati: il sito lo impone già, il server ora lo verifica.
    # Gli account demo/admin creati all'avvio (seed_data) non passano da qui e non sono toccati.
    if not payload.legal_accepted:
        raise HTTPException(400, "Devi accettare Termini, Privacy e Cookie Policy per registrarti")
    # Pre-lancio: i CLIENTI non si registrano ancora (lista d'attesa); commercianti e admin non cambiano.
    if prelaunch_mode() and payload.role == "client":
        raise HTTPException(403, "Stiamo arrivando: le iscrizioni dei clienti si aprono al lancio. Lascia la tua email nella lista d'attesa.")
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
    fonte = _fonte_valida(payload.fonte)  # clienti e negozi: serve a contare le iscrizioni per volantino/QR
    if fonte:
        doc["fonte_iscrizione"] = fonte
        doc["fonte_iscrizione_at"] = now_iso
    # Conferma dell'email: solo clienti, solo con l'interruttore acceso. Si salva l'impronta (sha256)
    # del token, mai il token. Chi si iscrive con l'interruttore spento è già confermato.
    conferma_token = None
    if payload.role == "client":
        if client_email_confirmation_required():
            conferma_token = secrets.token_urlsafe(32)
            doc.update(_campi_conferma_email(conferma_token))
        else:
            doc["email_confirmed"] = True
    if payload.role == "merchant":
        phone = (payload.phone or "").strip()
        if not phone:
            raise HTTPException(422, "Il numero di telefono è obbligatorio per i commercianti")
        # Partita IVA obbligatoria (decisione del titolare, 14/10): solo controllo formale, mai online.
        # I negozi già registrati senza Partita IVA non sono toccati (questo controllo vale solo alla registrazione).
        if not (payload.partita_iva or "").strip():
            raise HTTPException(422, "La Partita IVA è obbligatoria per i commercianti (11 numeri)")
        partita_iva = _partita_iva_valida(payload.partita_iva)
        if not partita_iva:
            solo_cifre = re.sub(r"[\s.]", "", str(payload.partita_iva or "")).upper().removeprefix("IT")
            if re.fullmatch(r"\d{11}", solo_cifre):
                raise HTTPException(422, "La Partita IVA ha 11 cifre ma non risulta corretta: controlla le cifre, soprattutto l'ultima")
            raise HTTPException(422, "La Partita IVA deve avere 11 numeri (solo cifre)")
        doc.update({
            "shop_name": (payload.shop_name or payload.name or "").strip() or "Negozio",
            "zone": (payload.zone or "Centro storico").strip(),
            "category": (payload.category or "Ristorante").strip(),
            "description": "",
            "address": (payload.address or "").strip(),
            "image_url": "",
            "phone": phone,
        })
        doc["partita_iva"] = partita_iva
    await db.users.insert_one(doc)

    # Geocoding fire-and-forget per il merchant (Nominatim può essere lento, non blocchiamo)
    if payload.role == "merchant" and doc.get("address"):
        _in_background(geocode_and_save_merchant(user_id, doc["address"]))

    # Email di benvenuto e, per i commercianti, avviso all'admin (in background)
    if payload.role == "merchant":
        _email_in_background(send_welcome_merchant(email, doc.get("name") or "", doc.get("shop_name") or ""), "benvenuto-commerciante")
        if _admin_notify_to():
            _email_in_background(send_admin_new_merchant(_admin_notify_to(), doc.get("shop_name") or "", doc.get("category") or "",
                                                         doc.get("zone") or "", email, doc.get("phone") or ""), "admin-nuovo-commerciante")
        _push_admin_in_background(f"Nuovo commerciante: {doc.get('shop_name') or 'senza nome'}", "", "nuovo-commerciante")
    elif conferma_token:
        # Niente accesso finché non tocca il link; il benvenuto parte dopo la conferma.
        _email_in_background(send_email_confirmation(email, doc.get("name") or "", conferma_token), "conferma-email")
        return {"confirmation_required": True, "email": email, "message": MSG_CONFERMA_INVIATA}
    else:
        _email_in_background(send_welcome_client(email, doc.get("name") or ""), "benvenuto-cliente")
        if payload.role == "client":
            # Con la conferma dell'email accesa l'avviso parte solo dopo la conferma (niente avvisi per account mai attivati).
            _avvisa_admin_nuovo_cliente()

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
    await _blocca_se_non_confermato(user)

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
    await _blocca_se_non_confermato(u)
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
async def forgot_password(payload: ForgotIn, request: Request):
    # Oltre al limite per account (1 al minuto, 5 all'ora), un limite per client: impedisce di
    # mandare email di reset a molti indirizzi diversi da un solo dispositivo (spam e quota Resend).
    if not _limite_reset_ok(request):
        raise HTTPException(429, MSG_TROPPE_RICHIESTE, headers={"Retry-After": "600"})
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
    # Aver ricevuto e usato il link di reset prova che l'indirizzo è suo: vale come conferma.
    if u.get("email_confirmed") is False:
        await db.users.update_one({"id": u["id"]}, {"$set": {"email_confirmed": True}, "$unset": _TOGLI_CONFERMA})
    return {"ok": True, "email": u["email"]}


# ---------- Meta ----------
@api.get("/zones")
async def zones():
    return {"zones": ZONES, "areas": [{"value": v, "label": l} for v, l, _ in ZONE_AREE]}


# ---------- Interesse per zona (scheda «Stiamo arrivando nella tua zona») ----------
# Si conta solo un NUMERO per zona (collezione `interesse_zona`: {zona, voti}). Nessuna email, nessun
# identificativo, nessun IP salvato. Limite per IP: l'IP resta solo in memoria, per un'ora, e serve
# a rifiutare le raffiche; non finisce mai nel database. Un solo voto per zona e per browser lo garantisce il sito.
INTERESSE_MAX_PER_ORA = 10
INTERESSE_FINESTRA_SEC = 3600
_interesse_richieste: dict = {}


def _ip_richiesta(request: Request) -> str:
    inoltrato = (request.headers.get("x-forwarded-for") or "").split(",")[0].strip()
    return inoltrato or (request.client.host if request.client else "sconosciuto")


def _interesse_consentito(ip: str) -> bool:
    adesso = time.monotonic()
    recenti = [t for t in _interesse_richieste.get(ip, []) if adesso - t < INTERESSE_FINESTRA_SEC]
    if len(recenti) >= INTERESSE_MAX_PER_ORA:
        _interesse_richieste[ip] = recenti
        return False
    recenti.append(adesso)
    _interesse_richieste[ip] = recenti
    if len(_interesse_richieste) > 5000:
        for k in [k for k, v in _interesse_richieste.items() if not v or adesso - v[-1] >= INTERESSE_FINESTRA_SEC]:
            _interesse_richieste.pop(k, None)
    return True


class InteresseZonaIn(BaseModel):
    zona: str


@api.post("/interesse-zona")
async def interesse_zona(payload: InteresseZonaIn, request: Request):
    """Endpoint pubblico: +1 all'interesse per una zona. Accetta solo i nomi delle 16 aree."""
    zona = (payload.zona or "").strip()
    if zona not in ZONES:
        raise HTTPException(400, "Zona non valida")
    if not _interesse_consentito(_ip_richiesta(request)):
        raise HTTPException(429, "Troppe richieste, riprova più tardi")
    await db.interesse_zona.update_one({"zona": zona}, {"$inc": {"voti": 1}}, upsert=True)
    return {"ok": True}


async def _interesse_per_zona() -> list:
    docs = await db.interesse_zona.find({}, {"_id": 0, "zona": 1, "voti": 1}).to_list(None)
    return sorted(({"zona": d["zona"], "voti": int(d.get("voti") or 0)} for d in docs),
                  key=lambda x: (-x["voti"], x["zona"]))


# ---------- Lista d'attesa pre-lancio ----------
# Collezione `waitlist`: email, data e versione del consenso, stato, fonte generica. Nessun IP, nessun cookie.
# Doppio consenso: l'iscritto è «da_confermare» finché non tocca il link ricevuto per email (48 ore, nel DB solo
# l'impronta del token). Le voci mai confermate si cancellano dopo 7 giorni. Il link per disiscriversi non si salva:
# è una firma (HMAC) dell'id, così si può mettere in ogni email senza tenere altri segreti nel database.
WAITLIST_CONSENT_VERSION = "2026-10-v1"  # cambia insieme al testo del consenso mostrato nel sito
WAITLIST_CONFERMA_ORE = 48
WAITLIST_NON_CONFERMATI_GIORNI = 7
WAITLIST_FONTI = ("instagram", "facebook", "volantino", "passaparola")  # lista chiusa; poi «diretto» e «altro»
WAITLIST_FONTI_GRUPPO = ("facebook", "gruppo")  # con codice: «facebook-garbatella», «gruppo-eur»
WAITLIST_FONTI_GRUPPO = ("facebook", "gruppo")  # con codice: «facebook-garbatella», «gruppo-eur»
WAITLIST_STATI = ("da_confermare", "confermata", "disiscritta")
MSG_LISTA_RICHIESTA = ("Ti abbiamo mandato un'email: tocca il link per confermare l'iscrizione. "
                       "Se non la trovi, controlla lo spam.")
MSG_LISTA_LINK = "Questo link non è valido o è già stato usato."


def _waitlist_fonte(valore) -> str:
    """Fonte generica da una lista chiusa; qualsiasi altro testo diventa «altro», assente = «diretto»."""
    v = (valore or "").strip().lower()
    if not v:
        return "diretto"
    # gruppi: «facebook-<codice>» e «gruppo-<codice>» restano interi (codice = minuscole, numeri, trattino, max 20)
    for pre in WAITLIST_FONTI_GRUPPO:
        if v.startswith(pre + "-") and re.fullmatch(r"[a-z0-9-]{1,20}", v[len(pre) + 1:]):
            return v
    if any(v.startswith(pre + "-") for pre in WAITLIST_FONTI_GRUPPO):
        return v if re.fullmatch(r"(facebook|gruppo)-[a-z0-9-]{1,20}", v) else "altro"  # codice non valido = «altro»
    for f in WAITLIST_FONTI:
        if v == f or v.startswith(f + "-"):
            return f
    return "altro"


def _waitlist_unsub_token(uid: str) -> str:
    return hmac_lib.new(JWT_SECRET.encode(), f"waitlist-unsub:{uid}".encode(), hashlib.sha256).hexdigest()[:32]


def _limite_lista_attesa_ok(request: Request) -> bool:
    """Per dispositivo (impronta, solo in memoria): 3 iscrizioni ogni 10 minuti e 5 all'ora. 0 = spento (test)."""
    return _limite_client_ok("lista-attesa", request,
                             (_soglia_env("WAITLIST_MAX_PER_CLIENT_10MIN", 3), 600),
                             (_soglia_env("WAITLIST_MAX_PER_CLIENT_ORA", 5), 3600))


def _waitlist_rimando_ok(doc: dict) -> bool:
    """Per indirizzo: almeno RESET_REQ_MIN_GAP_SEC secondi tra due email e al massimo RESET_REQ_MAX_PER_HOUR all'ora."""
    adesso = datetime.now(timezone.utc)
    recenti = []
    for raw in (doc.get("req_log") or []):
        try:
            t = datetime.fromisoformat(raw)
        except Exception:
            continue
        if (adesso - t).total_seconds() < 3600:
            recenti.append(t)
    recenti.sort()
    if recenti and (adesso - recenti[-1]).total_seconds() < RESET_REQ_MIN_GAP_SEC:
        return False
    return len(recenti) < RESET_REQ_MAX_PER_HOUR


class ListaAttesaIn(BaseModel):
    email: EmailStr
    consenso: bool = False
    src: Optional[str] = None
    sito_web: Optional[str] = ""  # campo trappola: un utente vero non lo vede e non lo compila


class ListaAttesaTokenIn(BaseModel):
    token: str


class ListaAttesaAnnullaIn(BaseModel):
    i: str
    t: str


@api.post("/prelaunch/waitlist")
async def lista_attesa_iscrivi(payload: ListaAttesaIn, request: Request):
    """Iscrizione alla lista d'attesa. Risposta identica per email nuova o già presente: non rivela nulla."""
    if not prelaunch_mode():
        raise HTTPException(404, "Non disponibile")
    if not _limite_lista_attesa_ok(request):
        raise HTTPException(429, MSG_TROPPE_RICHIESTE, headers={"Retry-After": "600"})
    risposta = {"ok": True, "message": MSG_LISTA_RICHIESTA}
    if (payload.sito_web or "").strip():  # trappola riempita: finta riuscita, non si salva nulla
        return risposta
    if not payload.consenso:
        raise HTTPException(400, "Per iscriverti spunta la casella del consenso.")
    email = payload.email.lower().strip()
    ora = datetime.now(timezone.utc)
    token = secrets.token_urlsafe(32)
    campi = {
        "status": "da_confermare",
        "consent_at": ora.isoformat(),
        "consent_version": WAITLIST_CONSENT_VERSION,
        "src": _waitlist_fonte(payload.src),
        "confirm_token_hash": _hash_token_conferma(token),
        "confirm_expires": (ora + timedelta(hours=WAITLIST_CONFERMA_ORE)).isoformat(),
    }
    doc = await db.waitlist.find_one({"email": email})
    if doc is None:
        doc = {"id": str(uuid.uuid4()), "email": email, "created_at": ora.isoformat(),
               "req_log": [ora.isoformat()], "notice_sent_at": None, **campi}
        try:
            await db.waitlist.insert_one(doc)
        except Exception:  # due richieste insieme: vince la prima, l'altra non manda altro
            return risposta
    elif doc.get("status") == "confermata":
        return risposta  # già dentro: niente da rifare, niente da rivelare
    elif not _waitlist_rimando_ok(doc):
        return risposta
    else:
        log = list(doc.get("req_log") or [])[-20:] + [ora.isoformat()]
        await db.waitlist.update_one({"id": doc["id"]}, {"$set": {**campi, "req_log": log},
                                                         "$unset": {"unsubscribed_at": ""}})
    try:
        await send_waitlist_confirmation(email, token, doc["id"], _waitlist_unsub_token(doc["id"]))
    except Exception as e:
        logging.warning(f"[lista-attesa] email di conferma non inviata: {e}")
    return risposta


@api.post("/prelaunch/waitlist/confirm")
async def lista_attesa_conferma(payload: ListaAttesaTokenIn):
    """Conferma con il token ricevuto per email. Monouso. Funziona anche a modalità pre-lancio spenta."""
    token = (payload.token or "").strip()
    doc = await db.waitlist.find_one({"confirm_token_hash": _hash_token_conferma(token)}) if token else None
    if not doc or doc.get("status") != "da_confermare":
        raise HTTPException(400, {"code": "link_non_valido", "msg": MSG_LISTA_LINK})
    try:
        scaduto = datetime.fromisoformat(doc.get("confirm_expires", "")) < datetime.now(timezone.utc)
    except Exception:
        scaduto = True
    if scaduto:
        raise HTTPException(400, {"code": "link_scaduto", "msg": "Questo link è scaduto."})
    res = await db.waitlist.update_one(
        {"id": doc["id"], "confirm_token_hash": doc["confirm_token_hash"]},
        {"$set": {"status": "confermata", "confirmed_at": datetime.now(timezone.utc).isoformat()},
         "$unset": {"confirm_token_hash": "", "confirm_expires": ""}})
    if res.modified_count != 1:
        raise HTTPException(400, {"code": "link_non_valido", "msg": MSG_LISTA_LINK})
    return {"ok": True}


@api.post("/prelaunch/waitlist/unsubscribe")
async def lista_attesa_annulla(payload: ListaAttesaAnnullaIn):
    """Disiscrizione dal link di ogni email. L'indirizzo resta segnato «disiscritta» per non riscriverti per errore."""
    uid, tok = (payload.i or "").strip(), (payload.t or "").strip()
    if not uid or not hmac_lib.compare_digest(_waitlist_unsub_token(uid).encode(), tok.encode()):
        raise HTTPException(400, {"code": "link_non_valido", "msg": MSG_LISTA_LINK})
    await db.waitlist.update_one(
        {"id": uid, "status": {"$ne": "disiscritta"}},
        {"$set": {"status": "disiscritta", "unsubscribed_at": datetime.now(timezone.utc).isoformat()},
         "$unset": {"confirm_token_hash": "", "confirm_expires": ""}})
    return {"ok": True}


async def _run_waitlist_cleanup() -> dict:
    """Cancella le iscrizioni mai confermate dopo WAITLIST_NON_CONFERMATI_GIORNI giorni (data del consenso)."""
    limite = (datetime.now(timezone.utc) - timedelta(days=WAITLIST_NON_CONFERMATI_GIORNI)).isoformat()
    r = await db.waitlist.delete_many({"status": "da_confermare", "consent_at": {"$lt": limite}})
    return {"deleted": r.deleted_count}


WAITLIST_CONSERVAZIONE_MESI = 12  # confermate e annullate (decisione del titolare, 14/10); le non confermate restano a 7 giorni


def _data_iso(valore) -> Optional[datetime]:
    try:
        d = datetime.fromisoformat(str(valore))
    except Exception:
        return None
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)


def _meno_mesi(d: datetime, mesi: int) -> datetime:
    """Stessa data di `mesi` mesi fa (il 29/02 diventa 28/02 se l'anno prima non è bisestile)."""
    tot = d.year * 12 + (d.month - 1) - mesi
    anno, mese = divmod(tot, 12)
    mese += 1
    giorno = d.day
    while True:
        try:
            return d.replace(year=anno, month=mese, day=giorno)
        except ValueError:
            giorno -= 1


async def _run_waitlist_retention(adesso: Optional[datetime] = None) -> dict:
    """Cancella le iscrizioni alla lista d'attesa più vecchie di 12 mesi. Vale sempre, anche con PRELAUNCH_MODE spento.
    Data di riferimento: per le confermate la data di iscrizione (consent_at, rinnovata a ogni nuovo consenso); per le
    annullate la data di annullamento (unsubscribed_at, altrimenti consent_at): l'indirizzo annullato serve a non
    riscrivere per errore chi ha detto no, quindi i 12 mesi partono da quando ha detto no.
    Il giorno si «prenota» in modo atomico: due copie del server o un riavvio non lo ripetono. Nei log nessun indirizzo intero."""
    adesso = adesso or datetime.now(timezone.utc)
    giorno = adesso.astimezone(ZoneInfo("Europe/Rome")).strftime("%Y-%m-%d")
    chiave = f"waitlist_retention:{giorno}"
    prenota = await db.job_claims.update_one({"key": chiave}, {"$setOnInsert": {"key": chiave, "ran_at": adesso.isoformat()}}, upsert=True)
    if prenota.upserted_id is None:
        return {"skipped": True, "deleted": 0}
    limite = _meno_mesi(adesso, WAITLIST_CONSERVAZIONE_MESI)
    cancellate = 0
    try:
        async for d in db.waitlist.find({"status": {"$in": ["confermata", "disiscritta"]}}):
            campo = "unsubscribed_at" if d.get("status") == "disiscritta" else "consent_at"
            rif = _data_iso(d.get(campo)) or _data_iso(d.get("consent_at")) or _data_iso(d.get("created_at"))
            if rif is None or rif >= limite:
                continue
            r = await db.waitlist.delete_one({"id": d.get("id"), "status": d.get("status")})
            if r.deleted_count:
                cancellate += 1
                logging.info(f"[lista-attesa] iscrizione {d.get('status')} oltre {WAITLIST_CONSERVAZIONE_MESI} mesi cancellata to={mask_email(d.get('email'))}")
    except Exception:
        await db.job_claims.delete_one({"key": chiave})  # si potrà ritentare
        raise
    return {"skipped": False, "deleted": cancellate}


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
    sospesi = set(await db.users.distinct("id", {"role": "merchant", "approved": False}))
    if merchant_payment_required():  # con l'interruttore spento questa riga non fa nulla
        sospesi |= await _merchant_non_in_regola()
    return sospesi


async def _tolleranza_giorni() -> int:
    doc = await db.settings.find_one({"key": "giorni_tolleranza_pagamento"})
    v = (doc or {}).get("value")
    return v if isinstance(v, int) and not isinstance(v, bool) and 0 <= v <= 31 else pp.TOLLERANZA_PREDEFINITA


async def _prima_pubblicazione(m: dict):
    """Campo `first_published_at` del negozio; se manca (negozi esistenti) lo calcola al volo dalla
    prima approvazione tra le sue offerte, senza scrivere nulla."""
    if m.get("first_published_at"):
        return m["first_published_at"]
    date_ok = []
    for d in await db.discounts.find({"merchant_id": m["id"], "approval_status": "approved"}).to_list(50):
        v = d.get("approved_at") or d.get("created_at")
        if v:
            date_ok.append(str(v))
    return min(date_ok) if date_ok else None


async def _pagamenti_negozio(merchant_id: str) -> dict:
    """{month_key: paid_at} dei pagamenti registrati a mano."""
    docs = await db.merchant_payments.find({"merchant_id": merchant_id}).to_list(200)
    return {d["month_key"]: d.get("paid_at") for d in docs if d.get("month_key")}


async def offer_visible_for_payment(merchant: dict, now: Optional[datetime] = None) -> bool:
    """Le offerte del negozio possono essere mostrate ai clienti? Vero se MERCHANT_PAYMENT_REQUIRED è
    spento; altrimenti vedi `prova_pagamenti.offer_visible_for_payment_core`."""
    if not merchant_payment_required():
        return True
    oggi = pp.a_data_roma(now or datetime.now(timezone.utc))
    return pp.offer_visible_for_payment_core(
        required=True, first_published_at=await _prima_pubblicazione(merchant),
        pagamenti=await _pagamenti_negozio(merchant["id"]), oggi=oggi,
        tolleranza=await _tolleranza_giorni(), no_renew_month=merchant.get("no_renew_month"))


async def _merchant_non_in_regola() -> set:
    """Id dei negozi le cui offerte non vanno mostrate per mancato pagamento (solo interruttore acceso)."""
    out = set()
    for m in await db.users.find({"role": "merchant"}).to_list(None):
        if not await offer_visible_for_payment(m):
            out.add(m["id"])
    return out


async def _segna_prima_pubblicazione(merchant_id: str, quando_iso: str):
    """Imposta `first_published_at` alla prima approvazione e non lo cambia più."""
    await db.users.update_one({"id": merchant_id, "role": "merchant", "first_published_at": {"$in": [None]}},
                              {"$set": {"first_published_at": quando_iso}})


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
    d["is_new"] = d.get("approval_status") == "approved" and _is_new_offer(d.get("published_at"))
    # «Nuovo su Sconti Roma»: il negozio ha pubblicato per la prima volta da meno di NEW_SHOP_DAYS giorni
    d["is_new_shop"] = bool(d.get("approval_status") == "approved" and merchant
                            and _is_new_shop(await _prima_pubblicazione_cache(merchant)))
    d["locked_this_month"] = (d.get("approval_status") == "approved"
                              and d.get("locked_month") == current_month_key()
                              and not d.get("force_editable", False))
    return d


# Scritta «Nuova offerta»: per quante ore dalla pubblicazione (decisione provvisoria: vale per tutte
# le offerte pubblicate, anche i rinnovi del mese dopo; per cambiarla basta questa costante).
NEW_OFFER_HOURS = 48


# Scritta «Nuovo su Sconti Roma»: per quanti giorni dalla PRIMA pubblicazione del negozio (decisione 12/10: 7 giorni).
NEW_SHOP_DAYS = 7
_prima_pub_cache: dict = {}   # id negozio -> (valore, istante): evita una ricerca per ogni offerta dell'elenco
_PRIMA_PUB_TTL_SEC = 300


async def _prima_pubblicazione_cache(m: dict):
    if m.get("first_published_at"):
        return m["first_published_at"]
    adesso = time.monotonic()
    hit = _prima_pub_cache.get(m["id"])
    if hit and adesso - hit[1] < _PRIMA_PUB_TTL_SEC:
        return hit[0]
    v = await _prima_pubblicazione(m)
    if len(_prima_pub_cache) > 2000:
        _prima_pub_cache.clear()
    _prima_pub_cache[m["id"]] = (v, adesso)
    return v


def _entro(data, durata: timedelta, now: Optional[datetime] = None) -> bool:
    """Vero se `data` (ISO o datetime) è nel passato e più recente di `durata`. Data assente o illeggibile: falso."""
    if not data:
        return False
    try:
        dt = data if isinstance(data, datetime) else datetime.fromisoformat(str(data).replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
    except (ValueError, TypeError):
        return False
    now = now or datetime.now(timezone.utc)
    return timedelta(0) <= now - dt < durata


def _is_new_shop(first_published_at, now: Optional[datetime] = None) -> bool:
    return _entro(first_published_at, timedelta(days=NEW_SHOP_DAYS), now)


def _is_new_offer(published_at, now: Optional[datetime] = None) -> bool:
    """Vero se l'offerta è stata pubblicata da meno di NEW_OFFER_HOURS ore. Usa l'orologio del server.
    Senza `published_at` (offerte già esistenti) o con data illeggibile: falso."""
    if not published_at:
        return False
    try:
        dt = published_at if isinstance(published_at, datetime) else datetime.fromisoformat(str(published_at).replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
    except (ValueError, TypeError):
        return False
    now = now or datetime.now(timezone.utc)
    return timedelta(0) <= now - dt < timedelta(hours=NEW_OFFER_HOURS)


def _mese_roma_estremi(chiave: str) -> tuple:
    """(inizio, fine escluso) del mese «AAAA-MM» all'ora di Roma, come testo ISO in UTC (le date nel database
    sono in UTC): il 1° alle 00:30 di Roma è già il mese nuovo, anche se in UTC è ancora il 31."""
    anno, mese = (int(x) for x in chiave.split("-"))
    dopo = (anno + 1, 1) if mese == 12 else (anno, mese + 1)
    inizio = datetime(anno, mese, 1, tzinfo=ZoneInfo("Europe/Rome")).astimezone(timezone.utc)
    fine = datetime(dopo[0], dopo[1], 1, tzinfo=ZoneInfo("Europe/Rome")).astimezone(timezone.utc)
    return inizio.isoformat(), fine.isoformat()


def _month_start_iso() -> str:
    return _mese_roma_estremi(current_month_key())[0]


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


# ---------- Geocodifica con LocationIQ (facoltativa, piano gratuito senza carta) ----------
# Si attiva solo se la variabile d'ambiente LOCATIONIQ_API_KEY è impostata (su Render).
# Senza chiave tutto resta com'era: solo Nominatim. Piano gratuito: circa 2 richieste al
# secondo e 5.000 al giorno -> una richiesta ogni 0,6 s per tutto il server + cache.
# La chiave non va mai scritta nel codice, nei log o nei test.
LOCATIONIQ_BASE_URL = "https://eu1.locationiq.com/v1"
_LOCATIONIQ_INTERVALLO = 0.6
_locationiq_lock = asyncio.Lock()
_locationiq_last = 0.0
_locationiq_stop_fino = 0.0  # dopo un rifiuto (chiave errata, limite) si salta LocationIQ per un po'
_locationiq_stop_motivo = ""  # "chiave" o "limite": solo per il widget di salute dell'admin


def _locationiq_key() -> str:
    return (os.environ.get("LOCATIONIQ_API_KEY") or "").strip()


def _locationiq_attivo() -> bool:
    return bool(_locationiq_key()) and time.monotonic() >= _locationiq_stop_fino


async def _locationiq_turno(max_attesa: float) -> bool:
    """Una richiesta ogni 0,6 s verso LocationIQ (sotto il limite di 2 al secondo)."""
    global _locationiq_last
    async with _locationiq_lock:
        attesa = _locationiq_last + _LOCATIONIQ_INTERVALLO - time.monotonic()
        if attesa > max_attesa:
            return False
        if attesa > 0:
            await asyncio.sleep(attesa)
        _locationiq_last = time.monotonic()
        return True


async def _locationiq_cerca(path: str, params: dict, max_attesa: float) -> Optional[list]:
    """Chiama LocationIQ. Ritorna la lista di risultati ([] = nessun indirizzo trovato),
    oppure None se LocationIQ non è utilizzabile adesso (senza chiave, limite raggiunto,
    chiave rifiutata, errore di rete): in quel caso il chiamante ripiega su Nominatim."""
    global _locationiq_stop_fino, _locationiq_stop_motivo
    key = _locationiq_key()
    if not key or not _locationiq_attivo():
        return None
    if not await _locationiq_turno(max_attesa):
        return None
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(
                f"{LOCATIONIQ_BASE_URL}/{path}",
                params={**params, "key": key, "format": "json"},
            )
        if r.status_code == 404:  # LocationIQ risponde 404 quando non trova nulla
            return []
        if r.status_code in (401, 403):
            _locationiq_stop_fino = time.monotonic() + 600
            _locationiq_stop_motivo = "chiave"
            logging.warning("[geocode] LocationIQ ha rifiutato la chiave: uso Nominatim per 10 minuti")
            return None
        if r.status_code == 429:
            _locationiq_stop_fino = time.monotonic() + 60
            _locationiq_stop_motivo = "limite"
            logging.warning("[geocode] LocationIQ: limite raggiunto, uso Nominatim per 1 minuto")
            return None
        if r.status_code != 200:
            return None
        data = r.json()
        return data if isinstance(data, list) else None
    except Exception as e:  # solo il tipo di errore nei log: il messaggio può contenere l'indirizzo con la chiave
        logging.warning(f"[geocode] LocationIQ non raggiungibile ({type(e).__name__})")
        return None

async def _locationiq_prova() -> dict:
    """Una sola richiesta di prova (per il widget di salute admin). Non restituisce mai la chiave."""
    if not _locationiq_key():
        return {"ok": False, "warning": True, "error": "non configurato (si usa Nominatim)"}
    errori = {"chiave": "chiave rifiutata", "limite": "limite raggiunto"}

    def motivo_pausa() -> str:
        if time.monotonic() < _locationiq_stop_fino:
            return errori.get(_locationiq_stop_motivo, "non risponde")
        return "non risponde"

    if not _locationiq_attivo():  # in pausa dopo un 401/403/429: niente richiesta, si rispetta la pausa
        return {"ok": False, "error": motivo_pausa()}
    t0 = time.monotonic()
    trovati = await _locationiq_cerca(
        "search",
        {"q": "Via Ostiense 100, Roma", "limit": 1, "countrycodes": "it", "addressdetails": 0},
        max_attesa=5,
    )
    if trovati is None:
        return {"ok": False, "error": motivo_pausa()}
    return {"ok": True, "ms": round((time.monotonic() - t0) * 1000)}


async def geocode_address(address: str) -> Optional[dict]:
    """Trasforma un indirizzo stringa in {lat, lng}: LocationIQ se c'è la chiave,
    altrimenti (o se non risponde) Nominatim.
    Ritorna None se non trovato o errore. Cache in-memory per evitare hit ripetuti."""
    if not address or not isinstance(address, str) or len(address.strip()) < 4:
        return None
    key = address.strip().lower()
    if key in _geocode_cache:
        return _geocode_cache[key]
    if _locationiq_attivo():
        trovati = await _locationiq_cerca(
            "search",
            {"q": address, "limit": 1, "countrycodes": "it", "addressdetails": 0},
            max_attesa=60,
        )
        if trovati is not None:
            try:
                result = {"lat": float(trovati[0]["lat"]), "lng": float(trovati[0]["lon"])} if trovati else None
            except (KeyError, ValueError, TypeError):
                result = None
            _cache_put(_geocode_cache, key, result)
            return result
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


def _suggerimenti_da_risultati(raw: list, limit: int) -> list:
    """Trasforma i risultati (stesso formato per Nominatim e LocationIQ) nei suggerimenti
    per il form: prima quelli col civico, senza doppioni."""
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
    return deduped[:limit]


# Bounding box di Roma (SW→NE) per privilegiare match locali
_ROMA_VIEWBOX = "12.234,41.649,12.855,42.141"


async def geocode_suggest(query: str, limit: int = 5) -> list:
    """Autocomplete indirizzi, focalizzato su Roma: LocationIQ (se c'è la chiave) o Nominatim.

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
    if _locationiq_attivo():
        # Suggerimenti: se la coda è lunga si rinuncia subito (niente attese infinite)
        trovati = await _locationiq_cerca(
            "autocomplete",
            {
                "q": q,
                "limit": max(limit * 2, 10),
                "countrycodes": "it",
                "addressdetails": 1,
                "viewbox": _ROMA_VIEWBOX,
                "bounded": 1,
                "dedupe": 1,
            },
            max_attesa=2,
        )
        if trovati is not None:
            try:
                out = _suggerimenti_da_risultati(trovati, limit)
            except (KeyError, ValueError, TypeError):
                out = []
            _cache_put(_geocode_suggest_cache, key, out)
            return out
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
                    "viewbox": _ROMA_VIEWBOX,
                    "bounded": 1,
                },
                headers={"User-Agent": "ScontiRoma/1.0 (info@scontiroma.it)"},
            )
        if r.status_code != 200:
            return []
        out = _suggerimenti_da_risultati(r.json() or [], limit)
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
    # «Ci pensiamo noi»: l'offerta preparata da noi non si vede finché il negozio non la conferma
    if not d or d.get("approval_status") == STATO_ATTESA_NEGOZIO:
        raise HTTPException(404, "Sconto non trovato")
    return {"discount": await enrich_discount(d)}


async def _payload_negozio(m: dict) -> dict:
    """Nome del negozio e offerta del mese in corso, uguali per `/negozio/<id>` e `/q/<codice>`.
    Nessun dato personale: solo nome, quartiere, categoria e l'offerta già visibile a tutti."""
    d = await db.discounts.find_one({"merchant_id": m["id"], "active": True, "approval_status": "approved"})
    return {
        "negozio": {"id": m["id"], "shop_name": m.get("shop_name") or m.get("name"),
                    "zone": m.get("zone"), "category": m.get("category"),
                    "qr_code": await codice_qr_negozio(m)},
        "discount": await enrich_discount(d) if d else None,
    }


@api.get("/negozio/{merchant_id}")
async def pagina_negozio(merchant_id: str):
    """Pagina pubblica a cui porta il vecchio QR (`/n/<id>`, ancora valido) e da cui la locandina
    legge il codice breve: nome del negozio e offerta del mese in corso. Non conta le scansioni."""
    m = await db.users.find_one({"id": merchant_id, "role": "merchant"})
    if not m or merchant_id in await _merchant_sospesi():
        raise HTTPException(404, "Negozio non trovato")
    return await _payload_negozio(m)


# ---------- Conteggio delle scansioni del QR della locandina ----------
# Si conta solo un NUMERO per negozio e per giorno (collezione `scansioni_locandina`): nessun IP, nessuno user agent,
# nessun cookie, nessun identificativo. Il nome `qr_scans` è già usato dal registro delle convalide al banco.
# Anti-duplicati: (1) finestra per NEGOZIO e non per persona, tenuta in memoria (solo l'id del negozio e l'ora
# dell'ultimo conteggio, mai chi ha scansionato); (2) ricaricamenti dello stesso browser: lo evita il sito
# con sessionStorage (`?r=1` = «già contata da poco», non si conta); (3) bot ovvi riconosciuti dall'intestazione
# del momento, che non viene salvata.
QR_ALFABETO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"   # senza 0 O 1 I L (si confondono a mano e a stampa)
QR_LUNGHEZZA = 5
QR_FINESTRA_SEC = 10
_QR_FORMATO = re.compile(r"^[A-Za-z0-9]{4,6}$")
_QR_BOT = re.compile(r"bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|curl|wget|python-requests|"
                     r"httpx|monitor|uptime|lighthouse", re.I)
_qr_ultimo_conteggio: dict = {}


async def codice_qr_negozio(m: dict) -> str:
    """Codice breve stabile del negozio: generato la prima volta e salvato sul commerciante."""
    if m.get("qr_code"):
        return m["qr_code"]
    for _ in range(30):
        cod = "".join(secrets.choice(QR_ALFABETO) for _ in range(QR_LUNGHEZZA))
        if await db.users.find_one({"qr_code": cod}):
            continue
        res = await db.users.update_one({"id": m["id"], "qr_code": {"$exists": False}}, {"$set": {"qr_code": cod}})
        if res.modified_count == 1:
            m["qr_code"] = cod
            return cod
        attuale = await db.users.find_one({"id": m["id"]})   # un'altra richiesta ha vinto la gara
        if attuale and attuale.get("qr_code"):
            m["qr_code"] = attuale["qr_code"]
            return attuale["qr_code"]
    raise HTTPException(503, "Riprova tra poco")


def _scansione_da_contare(merchant_id: str, request: Request, ricarica: bool) -> bool:
    if ricarica or _QR_BOT.search(request.headers.get("user-agent", "")):
        return False
    adesso = time.monotonic()
    ultimo = _qr_ultimo_conteggio.get(merchant_id)
    if ultimo is not None and adesso - ultimo < QR_FINESTRA_SEC:
        return False
    if len(_qr_ultimo_conteggio) > 5000:
        for k in [k for k, t in _qr_ultimo_conteggio.items() if adesso - t > QR_FINESTRA_SEC]:
            _qr_ultimo_conteggio.pop(k, None)
    _qr_ultimo_conteggio[merchant_id] = adesso
    return True


@api.get("/q/{codice}")
async def scansione_qr(codice: str, request: Request, r: int = 0):
    """Link corto del QR della locandina (`/q/AB12`): conta la scansione e restituisce la pagina del negozio."""
    if not _QR_FORMATO.match(codice):
        raise HTTPException(404, "Negozio non trovato")
    m = await db.users.find_one({"qr_code": codice.upper(), "role": "merchant"})
    if not m or m["id"] in await _merchant_sospesi():
        raise HTTPException(404, "Negozio non trovato")
    if _scansione_da_contare(m["id"], request, bool(r)):
        await db.scansioni_locandina.update_one(
            {"merchant_id": m["id"], "giorno": _rome_day()}, {"$inc": {"conteggio": 1}}, upsert=True)
    return JSONResponse(await _payload_negozio(m), headers={"Cache-Control": "no-store"})


async def _scansioni_per_negozio() -> dict:
    """{merchant_id: (ultimi 30 giorni, da sempre)}"""
    da = (datetime.now(ROME_TZ) - timedelta(days=29)).strftime("%Y-%m-%d")
    out: dict = {}
    for d in await db.scansioni_locandina.find({}, {"_id": 0}).to_list(length=None):
        a, b = out.get(d["merchant_id"], (0, 0))
        n = int(d.get("conteggio") or 0)
        out[d["merchant_id"]] = (a + (n if d["giorno"] >= da else 0), b + n)
    return out


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
    _in_background(_invia())
    _push_promo_in_background(d)  # notifiche push promozionali (solo con PUSH_UTENTI_ENABLED e consenso «offerte»)


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
        if existing.get("approval_status") == STATO_ATTESA_NEGOZIO:
            # «Ci pensiamo noi»: il negozio ha modificato e inviato lui l'offerta preparata da noi
            data.update({"merchant_confirmed_at": now_iso, "merchant_confirm_version": None,
                         "merchant_confirm_via": "modifica"})
            await db.ci_pensiamo_noi_link.update_many({"discount_id": existing["id"], "used_at": None},
                                                      {"$set": {"used_at": now_iso}})
        await db.discounts.update_one({"id": existing["id"]}, {"$set": data})
        d = await db.discounts.find_one({"id": existing["id"]})
        if existing.get("approval_status") != "pending":
            if _admin_notify_to():
                _email_in_background(send_admin_new_offer(_admin_notify_to(), user.get("shop_name") or "", d.get("title") or ""), "admin-offerta")
            _push_admin_in_background(f"Offerta da approvare: {user.get('shop_name') or 'negozio'}", "", "admin-offerta")
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
        _push_admin_in_background(f"Offerta da approvare: {user.get('shop_name') or 'negozio'}", "", "admin-offerta")
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
    if user.get("no_renew_month") == window["next_month"]:
        raise HTTPException(409, f"Hai scelto «Non rinnovo»: per caricare l'offerta di {window['next_month_label']} annulla prima la scelta.")
    data = payload.cleaned()
    if not data.get("title") or not data.get("description"):
        raise HTTPException(422, "Titolo e descrizione sono obbligatori")
    now_iso = datetime.now(timezone.utc).isoformat()
    data.update({"approval_status": "pending", "approval_note": "", "approved_at": None, "updated_at": now_iso})
    existing = await db.next_discounts.find_one({"merchant_id": user["id"], "target_month": window["next_month"]})
    if not existing or existing.get("approval_status") != "pending":
        if _admin_notify_to():
            _email_in_background(send_admin_new_offer(_admin_notify_to(), user.get("shop_name") or "", data.get("title") or "",
                                                      window["next_month_label"]), "admin-offerta-mese-prossimo")
        _push_admin_in_background(f"Offerta da approvare: {user.get('shop_name') or 'negozio'}",
                                  f"Mese di {window['next_month_label']}", "admin-offerta-mese-prossimo")
    if existing:
        await db.next_discounts.update_one({"id": existing["id"]}, {"$set": data})
        nd = await db.next_discounts.find_one({"id": existing["id"]})
    else:
        data.update({"id": str(uuid.uuid4()), "merchant_id": user["id"],
                     "target_month": window["next_month"], "created_at": now_iso})
        await db.next_discounts.insert_one(data)
        nd = data
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
            _in_background(geocode_and_save_merchant(user["id"], updates["address"]))
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
            try:
                inizio, fine = _mese_roma_estremi(mese)
                utilizzi = await db.redemptions.count_documents({
                    "discount_id": d.get("id"), "status": "redeemed", "redeemed_at": {"$gte": inizio, "$lt": fine}})
            except ValueError:
                utilizzi = 0
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
    return await _insights_negozio(user["id"], applica_soglia=True)


async def _insights_negozio(merchant_id: str, applica_soglia: bool) -> dict:
    used = await db.redemptions.find(
        {"merchant_id": merchant_id, "status": "redeemed"},
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
           "ultimi_6_mesi": serie,
           "dati_sufficienti": (len(clienti) >= INSIGHTS_MIN_CLIENTI) or not applica_soglia}
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
    cod = await codice_qr_negozio(user)
    s30, tot = (await _scansioni_per_negozio()).get(user["id"], (0, 0))
    return {
        "merchant_id": user["id"],
        "shop_name": user.get("shop_name"),
        "referral_url": f"{app_url}/q/{cod}",
        "flyer_url": f"{app_url}/locandina?ref={user['id']}",
        "scansioni_30_giorni": s30,
        "scansioni_totali": tot,
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
    out = {"client_subscription_required": client_subscription_required(),
           "prelaunch_mode": prelaunch_mode(),
           # «Migliora foto» compare solo se la chiave Gemini è impostata su Render
           "ai_enhance_enabled": bool((os.environ.get("GEMINI_API_KEY") or "").strip())}
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
        # Crea il Price mensile (idempotente via lookup_key)
        price = stripe.Price.create(
            unit_amount=PREZZO_CLIENTE_CENT,
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
        "amount": PREZZO_CLIENTE_CENT, "currency": "eur",
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
            logging.info(f"[payment-failed] email inviata to={mask_email(u['email'])}")
    except Exception as e:
        logging.error(f"[payment-failed] email send failed: {e}")


async def extend_subscription_on_renewal(
    *,
    user_id: str,
    provider: str,
    provider_event_id: str,
    provider_sub_id: str,
    price_eur: float = PREZZO_CLIENTE_EUR,
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
        logging.info(f"[renewal] email inviata to={mask_email(u['email'])} id={email_id}")
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
        "price_eur": PREZZO_CLIENTE_EUR,
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


# ---------- Abbonamento dei negozi (Stripe) — SPENTO finché MERCHANT_PAYMENT_REQUIRED è spento ----------
MERCHANT_PRICE_CENTS = int(os.environ.get("MERCHANT_PRICE_CENTS") or 499)  # 4,99 € al mese, IVA ESCLUSA
MERCHANT_VAT_PERCENT = int(os.environ.get("MERCHANT_VAT_PERCENT") or 22)  # IVA aggiunta all'addebito (da confermare col commercialista)
STRIPE_MERCHANT_LOOKUP = f"sconti_roma_negozio_mensile_{MERCHANT_PRICE_CENTS}"
PAYMENTS_MERCHANT_OFF_MSG = "I pagamenti dei negozi non sono ancora attivi."


def _stripe_tax_rate_iva() -> str:
    """Id dell'aliquota IVA (esclusa, Italia) da applicare all'abbonamento: la trova o la crea una sola volta."""
    for t in stripe.TaxRate.list(active=True, limit=100).data:
        if (not t.inclusive) and float(t.percentage) == float(MERCHANT_VAT_PERCENT) and t.display_name == "IVA":
            return t.id
    return stripe.TaxRate.create(display_name="IVA", percentage=MERCHANT_VAT_PERCENT, inclusive=False,
                                 country="IT", jurisdiction="IT").id


def _stripe_negozio_fuso(d: date) -> int:
    """Timestamp Unix del 1° `d` alle 06:00 di Roma (l'addebito parte in mattinata)."""
    return int(datetime(d.year, d.month, d.day, 6, 0, tzinfo=pp.ROMA).timestamp())


@api.get("/merchant/pagamento")
async def merchant_pagamento_stato(user: dict = Depends(require_merchant)):
    """Stato del pagamento del negozio: serve alla schermata «Attiva il pagamento»."""
    prima = await _prima_pubblicazione(user)
    oggi = pp.a_data_roma(datetime.now(timezone.utc))
    st = pp.stato_pagamento(prima, await _pagamenti_negozio(user["id"]), oggi, await _tolleranza_giorni())
    abb = await db.merchant_subscriptions.find_one({"merchant_id": user["id"]}, {"_id": 0})
    primo = pp.primo_addebito_stripe(prima, oggi)
    return {
        "attivo": merchant_payment_required(),
        "fase": st["fase"],
        "prova_fino_al": st["prova_fino_al"].isoformat() if st.get("prova_fino_al") else None,
        "primo_addebito": primo.isoformat() if primo else None,
        "importo_cent": MERCHANT_PRICE_CENTS,
        "iva_percent": MERCHANT_VAT_PERCENT,
        "abbonamento": ({"metodo": abb.get("provider"), "stato": abb.get("status")} if abb else None),
        "disdetta_da": user.get("no_renew_month"),
    }


@api.post("/merchant/pagamento/stripe/checkout")
async def merchant_stripe_checkout(user: dict = Depends(require_merchant)):
    """Apre il pagamento con carta: prova gratuita fino al primo addebito (sempre un 1°), poi 4,99 € al mese + IVA.
    Nessun addebito parte adesso."""
    if not merchant_payment_required():
        raise HTTPException(409, PAYMENTS_MERCHANT_OFF_MSG)
    if not stripe.api_key:
        raise HTTPException(503, "Pagamento con carta non disponibile")
    site = _frontend_url()
    if not site:
        raise HTTPException(500, "FRONTEND_URL non configurato")
    oggi = pp.a_data_roma(datetime.now(timezone.utc))
    primo = pp.primo_addebito_stripe(await _prima_pubblicazione(user), oggi)
    if primo is None:
        raise HTTPException(409, "Potrai attivare il pagamento dopo la prima offerta pubblicata.")
    if await db.merchant_subscriptions.find_one({"merchant_id": user["id"], "status": "active"}):
        raise HTTPException(409, "Il pagamento è già attivo.")
    prices = stripe.Price.list(lookup_keys=[STRIPE_MERCHANT_LOOKUP], active=True, limit=1).data
    price = prices[0] if prices else stripe.Price.create(
        unit_amount=MERCHANT_PRICE_CENTS, currency="eur", recurring={"interval": "month"},
        lookup_key=STRIPE_MERCHANT_LOOKUP, product_data={"name": "Sconti Roma — abbonamento negozio"})
    customer_id = await get_or_create_stripe_customer(user)
    meta = {"tipo": "negozio", "merchant_id": user["id"]}
    try:
        session = stripe.checkout.Session.create(
            line_items=[{"price": price.id, "quantity": 1, "tax_rates": [_stripe_tax_rate_iva()]}], mode="subscription",
            success_url=f"{site}/merchant/dashboard?pagamento=ok", cancel_url=f"{site}/merchant/dashboard?pagamento=annullato",
            customer=customer_id, payment_method_types=["card"], metadata=meta,
            subscription_data={"trial_end": _stripe_negozio_fuso(primo), "metadata": meta},
        )
    except stripe.error.InvalidRequestError as e:
        raise HTTPException(500, f"Stripe error: {e}")
    return {"checkout_url": session.url, "primo_addebito": primo.isoformat()}


@api.post("/merchant/pagamento/disdici")
async def merchant_pagamento_disdici(user: dict = Depends(require_merchant)):
    """Disdetta: l'abbonamento non si rinnova e l'offerta resta pubblica fino a fine mese."""
    if not merchant_payment_required():
        raise HTTPException(409, PAYMENTS_MERCHANT_OFF_MSG)
    abb = await db.merchant_subscriptions.find_one({"merchant_id": user["id"], "status": "active"})
    if abb and abb.get("provider") == "stripe" and stripe.api_key:
        try:
            stripe.Subscription.modify(abb["stripe_subscription_id"], cancel_at_period_end=True)
        except Exception as e:
            raise HTTPException(502, f"Stripe: {e}")
    if abb and abb.get("provider") == "paypal":
        try:
            await paypal_service.cancel_subscription(abb["paypal_subscription_id"], "Disdetta del negozio")
        except Exception as e:
            raise HTTPException(502, f"PayPal: {e}")
    mese = pp.mese_dopo(pp.chiave_mese(pp.a_data_roma(datetime.now(timezone.utc))))
    await db.users.update_one({"id": user["id"]}, {"$set": {"no_renew_month": mese}})
    return {"ok": True, "disdetta_da": mese}


async def _registra_pagamento_automatico(merchant_id: str, month_key: str, paid_at: str, cent: int, metodo: str,
                                         riferimento: dict, nota: str) -> None:
    """Scrive un pagamento arrivato da Stripe/PayPal nel registro: sia per la visibilità delle offerte
    (mese e data) sia per la scheda «Pagamenti» dell'admin (data, periodo coperto, ultimo pagamento) e aggiorna
    il piano (prossimo rinnovo = 1° del mese dopo). Lo stesso evento due volte non crea doppioni."""
    giorno = pp.a_data_roma(paid_at)
    y, m = month_key.split("-")
    dal = date(int(y), int(m), 1)
    al = pp.primo_del_mese_tra(dal, 1) - timedelta(days=1)
    await db.merchant_payments.update_one(
        {"merchant_id": merchant_id, "month_key": month_key},
        {"$set": {"merchant_id": merchant_id, "month_key": month_key, "paid_at": paid_at, "importo_cent": cent,
                  "metodo": metodo, "fonte": "automatico", "note": nota, "stato": "registrato",
                  "data_pagamento": giorno.isoformat() if giorno else None,
                  "periodo_coperto_dal": dal.isoformat(), "periodo_coperto_al": al.isoformat(), **riferimento},
         "$setOnInsert": {"id": str(uuid.uuid4()), "creato_il": datetime.now(timezone.utc).isoformat()}},
        upsert=True)
    await db.merchant_plans.update_one(
        {"merchant_id": merchant_id},
        {"$set": {"merchant_id": merchant_id, "prossimo_rinnovo": pp.primo_del_mese_tra(dal, 1).isoformat()}},
        upsert=True)


async def _stripe_evento_negozio(event) -> Optional[dict]:
    """Eventi Stripe degli abbonamenti dei NEGOZI. Ritorna None se l'evento non è di un negozio
    (allora lo gestisce il codice dei clienti). Con i pagamenti dei negozi spenti: nessun effetto."""
    t, obj = event["type"], event["data"]["object"]
    if t == "checkout.session.completed":
        md = obj.get("metadata") or {}
        if md.get("tipo") != "negozio":
            return None
        if not merchant_payment_required():
            return {"received": True, "ignored": "pagamenti_negozi_spenti"}
        await db.merchant_subscriptions.update_one(
            {"merchant_id": md.get("merchant_id")},
            {"$set": {"merchant_id": md.get("merchant_id"), "provider": "stripe", "status": "active",
                      "stripe_subscription_id": obj.get("subscription"), "stripe_customer_id": obj.get("customer"),
                      "attivato_il": datetime.now(timezone.utc).isoformat()}}, upsert=True)
        return {"status": "ok"}
    if t not in ("invoice.payment_succeeded", "invoice.payment_failed", "customer.subscription.deleted"):
        return None
    sub_id = obj.get("id") if t == "customer.subscription.deleted" else obj.get("subscription")
    abb = await db.merchant_subscriptions.find_one({"stripe_subscription_id": sub_id}) if sub_id else None
    if not abb:
        return None
    if not merchant_payment_required():
        return {"received": True, "ignored": "pagamenti_negozi_spenti"}
    adesso = datetime.now(timezone.utc).isoformat()
    if t == "customer.subscription.deleted":
        await db.merchant_subscriptions.update_one({"_id": abb["_id"]}, {"$set": {"status": "cancelled", "chiuso_il": adesso}})
    elif t == "invoice.payment_failed":
        await db.merchant_subscriptions.update_one({"_id": abb["_id"]}, {"$set": {"ultimo_errore_il": adesso}})
    else:
        cent = int(obj.get("amount_paid") or 0)
        if cent <= 0:
            return {"status": "ok", "skipped": "fattura_a_zero"}
        pagato = (obj.get("status_transitions") or {}).get("paid_at")
        paid_at = datetime.fromtimestamp(pagato, timezone.utc).isoformat() if pagato else adesso
        righe = ((obj.get("lines") or {}).get("data") or [])
        inizio = ((righe[0].get("period") or {}).get("start") if righe else None)
        giorno = pp.a_data_roma(datetime.fromtimestamp(inizio, timezone.utc)) if inizio else pp.a_data_roma(paid_at)
        month_key = pp.chiave_mese(giorno)
        await _registra_pagamento_automatico(abb["merchant_id"], month_key, paid_at, cent, "stripe",
                                             {"invoice_id": obj.get("id")}, "Pagamento automatico con carta")
    return {"status": "ok"}


@api.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(400, "Invalid signature")
    esito_negozio = await _stripe_evento_negozio(event)
    if esito_negozio is not None:
        return esito_negozio
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
        amount_paid = (obj.get("amount_paid") or PREZZO_CLIENTE_CENT) / 100.0  # cents → EUR
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


class PayPalNegozioIn(BaseModel):
    subscription_id: str


@api.get("/merchant/pagamento/paypal/config")
async def merchant_paypal_config(user: dict = Depends(require_merchant)):
    """Dati per il pulsante PayPal del negozio: piano mensile e data del primo addebito (un 1°, alle 06:00 di Roma)."""
    if not merchant_payment_required():
        raise HTTPException(409, PAYMENTS_MERCHANT_OFF_MSG)
    if not paypal_service.is_configured():
        raise HTTPException(503, "Pagamento con PayPal non disponibile")
    primo = pp.primo_addebito_stripe(await _prima_pubblicazione(user), pp.a_data_roma(datetime.now(timezone.utc)))
    if primo is None:
        raise HTTPException(409, "Potrai attivare il pagamento dopo la prima offerta pubblicata.")
    if await db.merchant_subscriptions.find_one({"merchant_id": user["id"], "status": "active"}):
        raise HTTPException(409, "Il pagamento è già attivo.")
    try:
        plan_id = await paypal_service.ensure_plan_negozio(MERCHANT_PRICE_CENTS, MERCHANT_VAT_PERCENT)
    except Exception as e:
        logging.warning(f"PayPal plan negozio: {e}")
        raise HTTPException(502, "PayPal non risponde, riprova più tardi")
    inizio = datetime(primo.year, primo.month, primo.day, 6, 0, tzinfo=pp.ROMA).astimezone(timezone.utc)
    return {"client_id": paypal_service.PAYPAL_CLIENT_ID, "mode": paypal_service.PAYPAL_MODE, "plan_id": plan_id,
            "start_time": inizio.strftime("%Y-%m-%dT%H:%M:%SZ"), "custom_id": user["id"],
            "primo_addebito": primo.isoformat()}


@api.post("/merchant/pagamento/paypal/activate")
async def merchant_paypal_activate(payload: PayPalNegozioIn, user: dict = Depends(require_merchant)):
    """Dopo l'approvazione su PayPal: verifica l'abbonamento (piano giusto, intestato a questo negozio) e lo registra."""
    if not merchant_payment_required():
        raise HTTPException(409, PAYMENTS_MERCHANT_OFF_MSG)
    try:
        sub = await paypal_service.get_subscription(payload.subscription_id)
        plan_atteso = await paypal_service.ensure_plan_negozio(MERCHANT_PRICE_CENTS, MERCHANT_VAT_PERCENT)
    except Exception as e:
        raise HTTPException(502, f"PayPal: {e}")
    if sub.get("plan_id") != plan_atteso or sub.get("custom_id") != user["id"]:
        raise HTTPException(403, "Abbonamento non valido per questo negozio")
    if sub.get("status") not in ("ACTIVE", "APPROVED"):
        raise HTTPException(409, "L'abbonamento PayPal non è ancora attivo")
    if await db.merchant_subscriptions.find_one({"paypal_subscription_id": payload.subscription_id,
                                                 "merchant_id": {"$ne": user["id"]}}):
        raise HTTPException(409, "Abbonamento già usato")
    await db.merchant_subscriptions.update_one(
        {"merchant_id": user["id"]},
        {"$set": {"merchant_id": user["id"], "provider": "paypal", "status": "active",
                  "paypal_subscription_id": payload.subscription_id,
                  "attivato_il": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    return {"ok": True}


async def _paypal_evento_negozio(event: dict) -> Optional[dict]:
    """Eventi PayPal degli abbonamenti dei NEGOZI. None se l'evento non è di un negozio."""
    etype, res = event.get("event_type", ""), event.get("resource", {}) or {}
    sub_id = res.get("billing_agreement_id") if etype.startswith("PAYMENT.") else res.get("id")
    abb = await db.merchant_subscriptions.find_one({"paypal_subscription_id": sub_id}) if sub_id else None
    if not abb:
        return None
    if not merchant_payment_required():
        return {"status": "ignored", "reason": "pagamenti_negozi_spenti"}
    adesso = datetime.now(timezone.utc).isoformat()
    if etype == "PAYMENT.SALE.COMPLETED":
        amount = res.get("amount") or {}
        try:
            cent = int(round(float(amount.get("total") or amount.get("value") or 0) * 100))
        except (TypeError, ValueError):
            cent = 0
        if cent <= 0:
            return {"status": "ok", "skipped": "importo_zero"}
        paid_at = res.get("create_time") or adesso
        if pp.a_data_roma(paid_at) is None:
            paid_at = adesso
        month_key = pp.chiave_mese(pp.a_data_roma(paid_at))
        await _registra_pagamento_automatico(abb["merchant_id"], month_key, paid_at, cent, "paypal",
                                             {"sale_id": res.get("id")}, "Pagamento automatico con PayPal")
    elif etype in ("PAYMENT.SALE.DENIED", "BILLING.SUBSCRIPTION.PAYMENT.FAILED"):
        await db.merchant_subscriptions.update_one({"_id": abb["_id"]}, {"$set": {"ultimo_errore_il": adesso}})
    elif etype in ("BILLING.SUBSCRIPTION.CANCELLED", "BILLING.SUBSCRIPTION.SUSPENDED", "BILLING.SUBSCRIPTION.EXPIRED"):
        await db.merchant_subscriptions.update_one({"_id": abb["_id"]}, {"$set": {"status": "cancelled", "chiuso_il": adesso}})
    return {"status": "ok"}


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
        "price_eur": PREZZO_CLIENTE_EUR,
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
    esito_negozio = await _paypal_evento_negozio(event)
    if esito_negozio is not None:
        return esito_negozio
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
        price = float(amount.get("total") or amount.get("value") or PREZZO_CLIENTE_EUR)
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


# ---------- Codice del negozio (convalida al banco) ----------
# Il QR del cliente, inquadrato con la fotocamera, apre una pagina pubblica che dice solo «codice valido»
# (offerta e negozio). Per consumare lo sconto e vedere il nome del cliente serve una di queste prove:
#  - essere il commerciante di quel negozio, già collegato (come prima);
#  - il codice a 4 cifre del negozio (massimo 5 errori ogni 15 minuti per negozio);
#  - l'attestato «ricordato su questo telefono» (firmato dal server, 90 giorni, legato alla versione del codice).
SHOP_CODE_MAX_ERRORS = 5
SHOP_CODE_WINDOW_MIN = 15
SHOP_DEVICE_DAYS = 90


def _new_shop_code(exclude: Optional[str] = None) -> str:
    """4 cifre casuali dal generatore sicuro del sistema (mai sequenziali), diverse dal codice precedente."""
    while True:
        c = f"{secrets.randbelow(10000):04d}"
        if c != exclude:
            return c


async def _shop_code_doc(merchant_id: str) -> dict:
    """Codice del negozio e versione; lo crea la prima volta. Il codice sta SOLO nel documento del
    negozio sul server: 4 cifre non sono una password, e il commerciante deve poterlo rivedere."""
    u = await db.users.find_one({"id": merchant_id}) or {}
    if not u.get("shop_code"):
        now = datetime.now(timezone.utc).isoformat()
        await db.users.update_one(
            {"id": merchant_id, "shop_code": {"$in": [None, ""]}},
            {"$set": {"shop_code": _new_shop_code(), "shop_code_version": 1, "shop_code_changed_at": now}},
        )
        u = await db.users.find_one({"id": merchant_id}) or {}
    return {"code": u.get("shop_code") or "", "version": int(u.get("shop_code_version") or 1),
            "changed_at": u.get("shop_code_changed_at")}


@api.get("/merchants/me/shop-code")
async def merchant_shop_code(user: dict = Depends(require_merchant)):
    return await _shop_code_doc(user["id"])


async def _shop_code_regenerate(merchant_id: str) -> dict:
    """Nuovo codice: il vecchio smette di valere e, con la nuova versione, anche i telefoni «ricordati»."""
    cur = await _shop_code_doc(merchant_id)
    now = datetime.now(timezone.utc).isoformat()
    await db.users.update_one(
        {"id": merchant_id},
        {"$set": {"shop_code": _new_shop_code(exclude=cur["code"]), "shop_code_changed_at": now},
         "$inc": {"shop_code_version": 1}},
    )
    await db.shop_code_attempts.delete_one({"merchant_id": merchant_id})
    return await _shop_code_doc(merchant_id)


@api.post("/merchants/me/shop-code/regenerate")
async def merchant_shop_code_regenerate(user: dict = Depends(require_merchant)):
    return await _shop_code_regenerate(user["id"])


def _device_token(merchant_id: str, version: int) -> str:
    exp = datetime.now(timezone.utc) + timedelta(days=SHOP_DEVICE_DAYS)
    return jwt.encode({"type": "shop_device", "sub": merchant_id, "ver": version, "exp": exp},
                      JWT_SECRET, algorithm=JWT_ALGORITHM)


def _device_token_ok(token: Optional[str], merchant_id: str, version: int) -> bool:
    if not token:
        return False
    try:
        p = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.InvalidTokenError:
        return False
    return p.get("type") == "shop_device" and p.get("sub") == merchant_id and p.get("ver") == version


async def _optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


SHOP_PERMIT_SEC = 120


def _qr_permit(r: dict) -> str:
    """Permesso breve (2 minuti) rilasciato quando la pagina si apre con un QR ancora valido: lega QR e negozio,
    così il QR non scade mentre si scrive il codice. Non è una prova del negozio e non contiene dati personali."""
    exp = datetime.now(timezone.utc) + timedelta(seconds=SHOP_PERMIT_SEC)
    return jwt.encode({"type": "qr_permit", "sub": r["id"], "code": r["code"], "mid": r["merchant_id"],
                       "jti": secrets.token_hex(8), "exp": exp}, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _qr_permit_claims(permit: Optional[str], r: dict) -> Optional[dict]:
    """Le informazioni del permesso se è valido per questo QR e questo negozio e non è già stato usato."""
    if not permit:
        return None
    try:
        p = jwt.decode(permit, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.InvalidTokenError:
        return None
    if p.get("type") != "qr_permit" or p.get("sub") != r.get("id") or p.get("code") != r.get("code") \
            or p.get("mid") != r.get("merchant_id") or r.get("permit_used") == p.get("jti"):
        return None
    return p


def _codice_di_mese_scaduto(r: dict) -> bool:
    """Un codice non ancora usato, creato in un mese passato, vale solo fino alle 02:00 (ora di Roma) del 1° giorno del mese dopo
    (ora di Roma); poi scade. L'uso conta comunque per il mese di creazione (`month_key`)."""
    mk = r.get("month_key")
    if r.get("status") != "pending" or not mk or mk == current_month_key():
        return False
    ora = _rome_now()
    return not (pp.mese_dopo(mk) == current_month_key() and ora.day == 1 and ora.hour < 2)


MSG_CODICE_MESE_SCADUTO = "Codice scaduto: era del mese scorso, il cliente ne chiede uno nuovo"


async def _qr_find_redemption(token: str, ignora_finestra: bool = False):
    """Controlla il QR (formato, finestra di 20 s, firma, esistenza). Ritorna (redemption, None) oppure (None, motivo).
    Con `ignora_finestra` (permesso breve valido) salta solo il controllo dei 20 secondi: la firma resta."""
    code, slot, hmac_tok = parse_rotating_code(token)
    if slot is None or hmac_tok is None:
        await _log_scan(False, "Formato codice non valido")
        return None, "Formato codice non valido"
    if abs(current_slot() - slot) > 1 and not ignora_finestra:
        await _log_scan(False, "QR code scaduto")
        return None, "QR code scaduto"
    if not hmac_lib.compare_digest(_rotating_hmac(code, slot), hmac_tok):
        await _log_scan(False, "QR code manomesso")
        return None, "QR code manomesso"
    r = await db.redemptions.find_one({"code": code})
    if not r:
        await _log_scan(False, "Codice non trovato")
        return None, "Codice non trovato"
    if _codice_di_mese_scaduto(r):
        await _log_scan(False, "Codice del mese scorso scaduto", r)
        return None, MSG_CODICE_MESE_SCADUTO
    return r, None


@api.get("/qr/verify")
async def qr_verify_public(token: str):
    """Pagina pubblica del QR: dice solo se il codice è valido e per quale offerta. Non consuma lo sconto
    e non mostra mai il cliente né altri dati personali."""
    r, errore = await _qr_find_redemption(token)
    if errore:
        return {"valid": False, "reason": errore}
    if r.get("status") == "redeemed":
        await _log_scan(False, "Codice già utilizzato", r)
        return {"valid": False, "reason": "Codice già utilizzato"}
    disc = await db.discounts.find_one({"id": r.get("discount_id")})
    m = await db.users.find_one({"id": r.get("merchant_id")})
    return {
        "valid": True,
        "shop_id": r.get("merchant_id"),
        "shop_name": (m.get("shop_name") if m else None) or "-",
        "discount_title": disc.get("title") if disc else "-",
        "permit": _qr_permit(r),
        "permit_sec": SHOP_PERMIT_SEC,
    }


class QrRedeemIn(BaseModel):
    token: str
    permit: Optional[str] = Field(default=None, max_length=2000)
    shop_code: Optional[str] = Field(default=None, max_length=16)
    device_token: Optional[str] = Field(default=None, max_length=2000)
    remember: bool = False


def _redeem_error(status: int, error: str, reason: str, **extra):
    return JSONResponse(status_code=status, content={"valid": False, "error": error, "reason": reason, **extra})


async def _shop_code_attempt(merchant_id: str):
    """Prenota un tentativo PRIMA di confrontare il codice (così più richieste insieme non superano il limite).
    Ritorna (consentito, secondi_di_attesa, id_tentativo)."""
    now = datetime.now(timezone.utc)
    cutoff = (now - timedelta(minutes=SHOP_CODE_WINDOW_MIN)).isoformat()
    stamp = f"{now.isoformat()}#{secrets.token_hex(4)}"
    await db.shop_code_attempts.update_one({"merchant_id": merchant_id}, {"$pull": {"t": {"$lt": cutoff}}})
    doc = await db.shop_code_attempts.find_one_and_update(
        {"merchant_id": merchant_id}, {"$push": {"t": stamp}}, upsert=True, return_document=ReturnDocument.AFTER)
    times = sorted(doc.get("t") or [])
    if len(times) > SHOP_CODE_MAX_ERRORS:
        await db.shop_code_attempts.update_one({"merchant_id": merchant_id}, {"$pull": {"t": stamp}})
        oldest = datetime.fromisoformat(times[0].split("#")[0])
        wait = int((oldest + timedelta(minutes=SHOP_CODE_WINDOW_MIN) - now).total_seconds()) + 1
        return False, max(wait, 1), stamp
    return True, 0, stamp


@api.post("/qr/redeem")
async def qr_redeem(payload: QrRedeemIn, request: Request):
    """Applica lo sconto dal QR del cliente. Il nome del cliente esce solo dopo una prova valida."""
    r, errore = await _qr_find_redemption(payload.token)
    permit = None
    if errore == "QR code scaduto" and payload.permit:
        # La finestra dei 20 secondi è passata mentre si scriveva il codice: vale il permesso breve (2 minuti).
        r, errore = await _qr_find_redemption(payload.token, ignora_finestra=True)
        permit = _qr_permit_claims(payload.permit, r) if r else None
        if not errore and not permit:
            return _redeem_error(400, "permit_expired", "Il tempo è scaduto: chiedi al cliente di mostrare di nuovo il QR")
    elif payload.permit and r:
        permit = _qr_permit_claims(payload.permit, r)
    if errore:
        return _redeem_error(400, "invalid", errore)
    mid = r["merchant_id"]
    user = await _optional_user(request)
    autorizzato = bool(user and user.get("role") == "merchant" and user.get("id") == mid)
    device_token_new = None
    if not autorizzato:
        cur = await _shop_code_doc(mid)
        if payload.device_token and _device_token_ok(payload.device_token, mid, cur["version"]):
            autorizzato = True
        else:
            code_in = (payload.shop_code or "").strip()
            if not code_in:
                if payload.device_token:
                    return _redeem_error(403, "device_invalid",
                                         "Il codice del negozio è cambiato o l'attestato è scaduto: scrivi il codice.")
                return _redeem_error(403, "code_required", "Scrivi il codice del negozio.")
            ok_slot, wait, stamp = await _shop_code_attempt(mid)
            if not ok_slot:
                await _log_scan(False, "Codice del negozio: troppi errori", r)
                return _redeem_error(429, "locked",
                                     f"Troppi tentativi. Riprova tra {max(1, -(-wait // 60))} minuti.",
                                     retry_after_sec=wait)
            if not hmac_lib.compare_digest(code_in.encode(), cur["code"].encode()):
                await _log_scan(False, "Codice del negozio errato", r)
                times = (await db.shop_code_attempts.find_one({"merchant_id": mid}) or {}).get("t") or []
                return _redeem_error(403, "wrong_code", "Codice del negozio errato",
                                     attempts_left=max(0, SHOP_CODE_MAX_ERRORS - len(times)))
            await db.shop_code_attempts.update_one({"merchant_id": mid}, {"$pull": {"t": stamp}})
            autorizzato = True
            if payload.remember:
                device_token_new = _device_token(mid, cur["version"])
    # A questo punto la prova c'è: si consuma lo sconto come prima.
    if r.get("status") == "redeemed":
        try:
            ts = datetime.fromisoformat(r.get("redeemed_at", ""))
            rivisto = (datetime.now(timezone.utc) - ts).total_seconds() < ROTATION_WINDOW_SEC * 2
        except Exception:
            rivisto = False
        if not rivisto:
            await _log_scan(False, "Codice già utilizzato", r)
            return _redeem_error(400, "used", "Codice già utilizzato")
    prev = await _last_redeemed(r["user_id"], mid, exclude_id=r["id"])
    if r.get("status") == "pending":
        if prev and _rome_day(prev.get("redeemed_at")) == _rome_day():
            await _log_scan(False, "Limite giornaliero: cliente ha già usato lo sconto oggi", r)
            return _redeem_error(400, "daily_limit",
                                 "Limite giornaliero: il cliente ha già utilizzato questo sconto oggi", daily_limit=True)
        res = await db.redemptions.update_one(
            {"id": r["id"], "status": "pending"},
            {"$set": {"status": "redeemed", "redeemed_at": datetime.now(timezone.utc).isoformat(),
                      **({"permit_used": permit["jti"]} if permit else {})}})
        if res.modified_count == 1:
            await _log_scan(True, "OK", r)
        r = await db.redemptions.find_one({"id": r["id"]}) or r
    disc = await db.discounts.find_one({"id": r.get("discount_id")})
    m = await db.users.find_one({"id": mid})
    c = await db.users.find_one({"id": r.get("user_id")})
    out = {
        "valid": True,
        "client_name": short_client_name(c.get("name") if c else None),
        "shop_name": m.get("shop_name") if m else "-",
        "discount_title": disc.get("title") if disc else "-",
        "discount_percent": None if not disc or not disc.get("original_price") else round((1 - disc["discounted_price"] / disc["original_price"]) * 100),
        "redeemed_at": r.get("redeemed_at") or datetime.now(timezone.utc).isoformat(),
        "use_number": r.get("use_number") or 1,
        "max_uses": r.get("max_uses_per_month") or 1,
        "prev_used_at": prev.get("redeemed_at") if prev else None,
    }
    if device_token_new:
        out["device_token"] = device_token_new
        out["device_days"] = SHOP_DEVICE_DAYS
    return out


@api.post("/redemptions/verify")
async def verify_redemption(payload: RedeemVerifyIn, user: dict = Depends(require_merchant)):
    code, slot, token = parse_rotating_code(payload.code)
    r = await db.redemptions.find_one({"code": code, "merchant_id": user["id"]})
    if not r:
        raise HTTPException(404, "Codice non trovato")
    if r["status"] == "redeemed":
        raise HTTPException(400, "Codice già utilizzato")
    if _codice_di_mese_scaduto(r):
        raise HTTPException(400, MSG_CODICE_MESE_SCADUTO)
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


# ---------- Notifiche push sul telefono dell'admin ----------
class PushChiaviIn(BaseModel):
    p256dh: str = Field(..., min_length=10, max_length=200)
    auth: str = Field(..., min_length=8, max_length=100)


class PushIscrizioneIn(BaseModel):
    endpoint: str = Field(..., min_length=10, max_length=1000)
    keys: PushChiaviIn


class PushDisiscrizioneIn(BaseModel):
    endpoint: str = Field(..., min_length=10, max_length=1000)


@api.get("/admin/push/chiave-pubblica")
async def admin_push_chiave_pubblica(user: dict = Depends(require_admin_master)):
    chiavi = await _chiavi_vapid()
    iscritti = await db.admin_push_iscrizioni.count_documents({"user_id": user["id"]})
    return {"public_key": chiavi["public_key"], "iscrizioni": iscritti}


@api.post("/admin/push/iscrizione")
async def admin_push_iscrizione(payload: PushIscrizioneIn, user: dict = Depends(require_admin_master)):
    if not payload.endpoint.startswith("https://"):
        raise HTTPException(422, "Iscrizione non valida")
    now_iso = datetime.now(timezone.utc).isoformat()
    esistente = await db.admin_push_iscrizioni.find_one({"endpoint": payload.endpoint})
    if not esistente and await db.admin_push_iscrizioni.count_documents({"user_id": user["id"]}) >= PUSH_ISCRIZIONI_MAX_PER_ADMIN:
        raise HTTPException(409, f"Hai già {PUSH_ISCRIZIONI_MAX_PER_ADMIN} dispositivi con le notifiche: disattivane uno prima.")
    await db.admin_push_iscrizioni.update_one(
        {"endpoint": payload.endpoint},
        {"$set": {"user_id": user["id"], "p256dh": payload.keys.p256dh, "auth": payload.keys.auth, "updated_at": now_iso},
         "$setOnInsert": {"created_at": now_iso}},
        upsert=True)
    return {"ok": True}


@api.delete("/admin/push/iscrizione")
async def admin_push_disiscrizione(payload: PushDisiscrizioneIn, user: dict = Depends(require_admin_master)):
    res = await db.admin_push_iscrizioni.delete_one({"endpoint": payload.endpoint, "user_id": user["id"]})
    return {"ok": True, "rimosse": res.deleted_count}


@api.post("/admin/push/prova")
async def admin_push_prova(user: dict = Depends(require_admin_master)):
    if not await db.admin_push_iscrizioni.count_documents({"user_id": user["id"]}):
        raise HTTPException(404, "Nessun dispositivo con le notifiche attive: tocca prima «Attiva notifiche».")
    esito = await _invia_push_admin("Prova di Sconti Roma", "Le notifiche su questo telefono funzionano.", user_id=user["id"])
    return {"ok": esito["inviate"] > 0, **esito}


# ---------- Notifiche push di commercianti e clienti (ognuno solo per sé) ----------
async def require_push_utente(request: Request) -> dict:
    """Interruttore spento = l'indirizzo non esiste (404, anche senza accesso). Solo commercianti e clienti,
    ognuno per sé: l'utente viene sempre dal token, mai dal corpo della richiesta."""
    if not push_utenti_attivo():
        raise HTTPException(404, "Not Found")
    user = await get_current_user(request)
    if user.get("role") not in ("client", "merchant"):
        raise HTTPException(403, "Riservato a commercianti e clienti")
    return user


def require_push_cliente(user: dict = Depends(require_push_utente)) -> dict:
    if user.get("role") != "client":
        raise HTTPException(403, "Riservato ai clienti")
    return user


class PushConsensoIn(BaseModel):
    servizio: bool = False
    offerte: bool = False
    zone: List[str] = Field(default_factory=list, max_length=len(ZONES))


def _stato_consenso_push(user: dict) -> dict:
    pc = user.get("push_consenso") or {}
    return {"servizio": _consenso_push(user, "servizio"), "offerte": _consenso_push(user, "offerte"),
            "zone": list((pc.get("offerte") or {}).get("zone") or [])}


@api.get("/push/stato")
async def push_stato(user: dict = Depends(require_push_utente)):
    chiavi = await _chiavi_vapid()
    out = {"public_key": chiavi["public_key"], "ruolo": user["role"],
           "iscrizioni": await db.push_iscrizioni.count_documents({"user_id": user["id"]}),
           "max_dispositivi": PUSH_ISCRIZIONI_MAX_PER_UTENTE}
    if user["role"] == "client":
        out["consenso"] = _stato_consenso_push(user)
        out["versione_testo"] = PUSH_CONSENSO_VERSIONE
    return out


@api.post("/push/iscrizione")
async def push_iscrizione(payload: PushIscrizioneIn, user: dict = Depends(require_push_utente)):
    if not payload.endpoint.startswith("https://"):
        raise HTTPException(422, "Iscrizione non valida")
    now_iso = datetime.now(timezone.utc).isoformat()
    esistente = await db.push_iscrizioni.find_one({"endpoint": payload.endpoint}, {"_id": 0, "user_id": 1})
    if (not esistente or esistente.get("user_id") != user["id"]) and \
            await db.push_iscrizioni.count_documents({"user_id": user["id"]}) >= PUSH_ISCRIZIONI_MAX_PER_UTENTE:
        raise HTTPException(409, f"Hai già {PUSH_ISCRIZIONI_MAX_PER_UTENTE} dispositivi con le notifiche: disattivane uno prima.")
    # Stesso telefono usato prima da un altro account: l'iscrizione passa al nuovo (il vecchio non riceve più nulla qui).
    await db.push_iscrizioni.update_one(
        {"endpoint": payload.endpoint},
        {"$set": {"user_id": user["id"], "ruolo": user["role"], "p256dh": payload.keys.p256dh,
                  "auth": payload.keys.auth, "updated_at": now_iso},
         "$setOnInsert": {"created_at": now_iso}},
        upsert=True)
    return {"ok": True}


@api.delete("/push/iscrizione")
async def push_disiscrizione(payload: PushDisiscrizioneIn, user: dict = Depends(require_push_utente)):
    res = await db.push_iscrizioni.delete_one({"endpoint": payload.endpoint, "user_id": user["id"]})
    return {"ok": True, "rimosse": res.deleted_count}


@api.post("/push/prova")
async def push_prova(user: dict = Depends(require_push_utente)):
    if not await db.push_iscrizioni.count_documents({"user_id": user["id"]}):
        raise HTTPException(404, "Nessun dispositivo con le notifiche attive: tocca prima «Attiva notifiche».")
    iscrizioni = await db.push_iscrizioni.find({"user_id": user["id"]}, {"_id": 0}).to_list(PUSH_ISCRIZIONI_MAX_PER_UTENTE)
    esito = await _manda_push(db.push_iscrizioni, iscrizioni, "Prova di Sconti Roma",
                              "Le notifiche su questo telefono funzionano.",
                              "/merchant/dashboard" if user["role"] == "merchant" else "/dashboard", "push-utenti")
    return {"ok": esito["inviate"] > 0, **esito}


@api.put("/push/consenso")
async def push_consenso(payload: PushConsensoIn, user: dict = Depends(require_push_cliente)):
    """Consensi SEPARATI del cliente: «servizio» e «offerte» (promozionale). Ogni categoria salva il proprio
    momento e la versione del testo solo quando cambia. Revoca immediata: le offerte in coda si cancellano."""
    zone = [z for z in dict.fromkeys(payload.zone) if z in ZONES]
    if payload.offerte and not zone and not (user.get("preferiti") or []):
        raise HTTPException(422, "Scegli almeno una zona (o segui un negozio con il cuore) per le notifiche sulle offerte.")
    now_iso = datetime.now(timezone.utc).isoformat()
    attuale = _stato_consenso_push(user)
    sets = {}
    for cat in PUSH_CATEGORIE_CLIENTE:
        nuovo = bool(getattr(payload, cat))
        if nuovo != attuale[cat]:
            sets[f"push_consenso.{cat}.attivo"] = nuovo
            sets[f"push_consenso.{cat}.at"] = now_iso
            sets[f"push_consenso.{cat}.versione_testo"] = PUSH_CONSENSO_VERSIONE
            await db.consent_logs.insert_one({
                "id": str(uuid.uuid4()), "user_id": user["id"], "action": f"push_{cat}_{'si' if nuovo else 'no'}",
                "prefs": {"versione_testo": PUSH_CONSENSO_VERSIONE}, "timestamp": now_iso})
    sets["push_consenso.offerte.zone"] = zone if payload.offerte else []
    await db.users.update_one({"id": user["id"]}, {"$set": sets})
    if not payload.offerte:
        await db.push_coda.delete_many({"user_id": user["id"]})
    u = await db.users.find_one({"id": user["id"]}, {"_id": 0, "push_consenso": 1})
    return {"consenso": _stato_consenso_push(u or {}), "versione_testo": PUSH_CONSENSO_VERSIONE}


@api.delete("/push/tutto")
async def push_disattiva_tutto(user: dict = Depends(require_push_utente)):
    """«Disattiva tutto»: toglie i consensi (cliente), svuota la coda e cancella le iscrizioni di TUTTI i suoi dispositivi."""
    now_iso = datetime.now(timezone.utc).isoformat()
    if user["role"] == "client":
        sets = {"push_consenso.offerte.zone": []}
        attuale = _stato_consenso_push(user)
        for cat in PUSH_CATEGORIE_CLIENTE:
            if attuale[cat]:
                sets.update({f"push_consenso.{cat}.attivo": False, f"push_consenso.{cat}.at": now_iso,
                             f"push_consenso.{cat}.versione_testo": PUSH_CONSENSO_VERSIONE})
                await db.consent_logs.insert_one({
                    "id": str(uuid.uuid4()), "user_id": user["id"], "action": f"push_{cat}_no",
                    "prefs": {"versione_testo": PUSH_CONSENSO_VERSIONE}, "timestamp": now_iso})
        await db.users.update_one({"id": user["id"]}, {"$set": sets})
    await db.push_coda.delete_many({"user_id": user["id"]})
    res = await db.push_iscrizioni.delete_many({"user_id": user["id"]})
    return {"ok": True, "rimosse": res.deleted_count}


def _issue_master_cookie(response: Response, user_id: str) -> dict:
    exp = datetime.now(timezone.utc) + timedelta(minutes=ADMIN_MASTER_TTL_MIN)
    token = _sign_master(user_id, exp)
    response.set_cookie(
        "admin_master_token", token,
        max_age=ADMIN_MASTER_TTL_MIN * 60,
        httponly=True, secure=True, samesite="none", path="/",
    )
    # Il token vive solo nel cookie httpOnly: mai nel corpo della risposta (revisione esterna, P1).
    return {"ok": True, "expires_in": ADMIN_MASTER_TTL_MIN * 60}


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


async def _negozi_senza_offerta() -> list:
    """Nomi (dell'attività) dei negozi iscritti che non hanno ancora caricato nessuna offerta."""
    con_offerta = set(await db.discounts.distinct("merchant_id"))
    docs = await db.users.find({"role": "merchant"}, {"_id": 0, "id": 1, "shop_name": 1}).to_list(None)
    return sorted((m.get("shop_name") or "senza nome") for m in docs if m["id"] not in con_offerta)
# ---------- Lista d'attesa: area admin ----------
WAITLIST_PAROLA_AVVISO = "AVVISA"
_avviso_stato: dict = {"in_corso": False, "ultimo": None}
_avviso_task: Optional[asyncio.Task] = None


async def _pausa(secondi: float) -> None:
    if secondi > 0:
        await asyncio.sleep(secondi)


def _env_float(nome: str, predefinito: float) -> float:
    try:
        return float(os.environ.get(nome, predefinito))
    except (TypeError, ValueError):
        return predefinito


async def _waitlist_riepilogo() -> dict:
    conteggi = {s: 0 for s in WAITLIST_STATI}
    fonti: dict = {}
    async for d in db.waitlist.find({}, {"_id": 0, "status": 1, "src": 1}):
        st = d.get("status") if d.get("status") in conteggi else "da_confermare"
        conteggi[st] += 1
        nome = d.get("src") or "diretto"
        f = fonti.setdefault(nome, {"fonte": nome, **{s: 0 for s in WAITLIST_STATI}})
        f[st] += 1
    oggi = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return {
        "da_confermare": conteggi["da_confermare"], "confermate": conteggi["confermata"], "disiscritte": conteggi["disiscritta"],
        "per_fonte": sorted(fonti.values(), key=lambda f: (-f["confermata"], f["fonte"])),
        "avviso": {
            "da_avvisare": await db.waitlist.count_documents({"status": "confermata", "notice_sent_at": None}),
            "avvisate": await db.waitlist.count_documents({"status": "confermata", "notice_sent_at": {"$ne": None}}),
            "avvisate_oggi": await db.waitlist.count_documents({"notice_sent_at": {"$gte": oggi}}),
            "tetto_giornaliero": _soglia_env("WAITLIST_DAILY_CAP", 80),
            "in_corso": _avviso_stato["in_corso"], "ultimo": _avviso_stato["ultimo"],
        },
        "modalita_prelancio": prelaunch_mode(),
    }


@api.get("/admin/lista-attesa")
async def admin_lista_attesa(user: dict = Depends(require_admin_master)):
    return await _waitlist_riepilogo()


@api.get("/admin/lista-attesa/esporta.csv")
async def admin_lista_attesa_csv(user: dict = Depends(require_admin_master)):
    """Solo le iscrizioni CONFERMATE (mai quelle da confermare o disiscritte)."""
    righe = await db.waitlist.find({"status": "confermata"}, {"_id": 0}).to_list(None)
    righe.sort(key=lambda d: (d.get("confirmed_at") or "", d.get("email") or ""))
    linee = [";".join(_csv_cella(h) for h in ["Email", "Data del consenso", "Versione del testo", "Fonte", "Confermata il"])]
    for d in righe:
        linee.append(";".join(_csv_cella(v) for v in [d.get("email"), d.get("consent_at"), d.get("consent_version"),
                                                       d.get("src"), d.get("confirmed_at")]))
    return Response(content="﻿" + "\r\n".join(linee) + "\r\n", media_type="text/csv; charset=utf-8",
                    headers={"Content-Disposition": 'attachment; filename="lista-attesa-confermate.csv"'})


async def _invia_avviso_lancio() -> dict:
    """Manda «Sconti Roma è online» alle iscrizioni confermate non ancora avvisate, a lotti con pause (limiti di Resend).
    Idempotente: ogni persona viene «prenotata» con un'operazione atomica prima dell'invio, quindi non riceve mai due
    avvisi, nemmeno rilanciando o con due richieste insieme. Se un invio fallisce la prenotazione viene tolta e potrà
    essere riprovata. Si ferma dopo 3 errori di fila o al tetto giornaliero (WAITLIST_DAILY_CAP, 0 = nessun tetto)."""
    lotto = max(1, _soglia_env("WAITLIST_LOTTO", 20))
    pausa_msg, pausa_lotto = _env_float("WAITLIST_PAUSA_MESSAGGIO_SEC", 0.6), _env_float("WAITLIST_PAUSA_LOTTO_SEC", 3.0)
    tetto = _soglia_env("WAITLIST_DAILY_CAP", 80)
    oggi = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    gia_oggi = await db.waitlist.count_documents({"notice_sent_at": {"$gte": oggi}})
    candidati = await db.waitlist.find({"status": "confermata", "notice_sent_at": None},
                                       {"_id": 0, "id": 1, "email": 1}).to_list(None)
    esito = {"inviati": 0, "non_inviati": 0, "lotti": 0, "fermato_per": None, "restano": len(candidati)}
    errori_di_fila = 0
    for i in range(0, len(candidati), lotto):
        esito["lotti"] += 1
        for c in candidati[i:i + lotto]:
            if tetto > 0 and gia_oggi + esito["inviati"] >= tetto:
                esito["fermato_per"] = "tetto_giornaliero"
                break
            preso = await db.waitlist.update_one({"id": c["id"], "status": "confermata", "notice_sent_at": None},
                                                 {"$set": {"notice_sent_at": datetime.now(timezone.utc).isoformat()}})
            if preso.modified_count != 1:
                continue  # disiscritta nel frattempo o già avvisata da un altro giro
            try:
                eid = await send_waitlist_launch_notice(c["email"], c["id"], _waitlist_unsub_token(c["id"]))
            except Exception as e:
                logging.warning(f"[lista-attesa] avviso non inviato: {e}")
                eid = None
            if eid:
                esito["inviati"] += 1
                errori_di_fila = 0
            else:
                await db.waitlist.update_one({"id": c["id"]}, {"$set": {"notice_sent_at": None}})
                esito["non_inviati"] += 1
                errori_di_fila += 1
                if errori_di_fila >= 3:
                    esito["fermato_per"] = "errori"
                    break
            await _pausa(pausa_msg)
        if esito["fermato_per"]:
            break
        await _pausa(pausa_lotto)
    esito["restano"] = await db.waitlist.count_documents({"status": "confermata", "notice_sent_at": None})
    return esito


async def _avviso_in_background() -> None:
    try:
        esito = await _invia_avviso_lancio()
    except Exception as e:
        logging.error(f"[lista-attesa] avviso di lancio interrotto: {e}")
        esito = {"fermato_per": "errore"}
    _avviso_stato["ultimo"] = {**esito, "fine": datetime.now(timezone.utc).isoformat()}
    _avviso_stato["in_corso"] = False


class AvvisoLancioIn(BaseModel):
    conferma: Optional[str] = ""


@api.post("/admin/lista-attesa/invia-avviso")
async def admin_lista_attesa_avviso(payload: AvvisoLancioIn, user: dict = Depends(require_admin_master)):
    """«Invia l'avviso di lancio»: serve la parola AVVISA. Parte in background e si segue dai conteggi."""
    global _avviso_task
    if (payload.conferma or "").strip().upper() != WAITLIST_PAROLA_AVVISO:
        raise HTTPException(400, f"Scrivi {WAITLIST_PAROLA_AVVISO} per confermare")
    if _avviso_stato["in_corso"]:
        raise HTTPException(409, "L'invio è già in corso")
    da_inviare = await db.waitlist.count_documents({"status": "confermata", "notice_sent_at": None})
    if da_inviare == 0:
        return {"avviato": False, "da_inviare": 0}
    _avviso_stato["in_corso"] = True
    await db.settings.update_one({"key": "avviso_lancio_automatico"}, {"$set": {
        "key": "avviso_lancio_automatico", "attivo": True, "avviato_il": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    _avviso_task = _in_background(_avviso_in_background())
    return {"avviato": True, "da_inviare": da_inviare}


async def _avviso_giornaliero() -> dict:
    """Ogni giorno alle 10:00 (Roma): se l'admin ha già avviato l'avviso con AVVISA e ci sono ancora iscritte da avvisare,
    riprende da dove si era fermato, con lo stesso tetto giornaliero (WAITLIST_DAILY_CAP). Senza AVVISA non parte mai.
    Il giorno viene «prenotato» nel database prima dell'invio (un riavvio o due server non lo ripetono) e ogni persona
    è comunque prenotata con un'operazione atomica: nessun doppio invio."""
    stato = await db.settings.find_one({"key": "avviso_lancio_automatico"})
    if not stato or not stato.get("attivo"):
        return {"inviati": 0, "saltato": "non_avviato"}
    if _avviso_stato["in_corso"]:
        return {"inviati": 0, "saltato": "in_corso"}
    if await db.waitlist.count_documents({"status": "confermata", "notice_sent_at": None}) == 0:
        await db.settings.update_one({"key": "avviso_lancio_automatico"}, {"$set": {"attivo": False}})
        return {"inviati": 0, "saltato": "finito"}
    chiave = f"avviso_lancio_giorno_{_rome_now().date().isoformat()}"
    res = await db.settings.update_one({"key": chiave}, {"$setOnInsert": {
        "key": chiave, "claimed_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    if res.upserted_id is None:
        return {"inviati": 0, "saltato": "gia_fatto_oggi"}
    _avviso_stato["in_corso"] = True
    try:
        esito = await _invia_avviso_lancio()
    except Exception as e:
        logging.error(f"[lista-attesa] avviso giornaliero interrotto: {e}")
        esito = {"inviati": 0, "fermato_per": "errore"}
    _avviso_stato["ultimo"] = {**esito, "fine": datetime.now(timezone.utc).isoformat()}
    _avviso_stato["in_corso"] = False
    if esito.get("restano") == 0:
        await db.settings.update_one({"key": "avviso_lancio_automatico"}, {"$set": {"attivo": False}})
    return esito


@api.get("/admin/launch-summary")
async def admin_launch_summary(user: dict = Depends(require_admin_master)):
    """Fase di lancio a colpo d'occhio: iscritti, negozi per quartiere, offerte da approvare,
    negozi senza offerta, utilizzi del mese."""
    sospesi = await _merchant_sospesi()
    merchants = await db.users.find({"role": "merchant"}, {"_id": 0, "id": 1, "shop_name": 1, "zone": 1, "created_at": 1}).to_list(None)
    offerte = {d["merchant_id"]: d for d in await db.discounts.find({}, {"_id": 0, "merchant_id": 1, "approval_status": 1, "active": 1}).to_list(None)}
    zone: dict = {}
    for m in merchants:
        z = zone.setdefault(m.get("zone") or "—", {"zona": m.get("zone") or "—", "negozi": 0, "online": 0})
        z["negozi"] += 1
        d = offerte.get(m["id"])
        if d and d.get("approval_status") == "approved" and d.get("active", True) and m["id"] not in sospesi:
            z["online"] += 1
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
        "negozi_senza_offerta": await _negozi_senza_offerta(),
        "utilizzi_mese": await db.redemptions.count_documents({"status": "redeemed", "month_key": mese}),
        "mese": month_label_it(mese),
        "interesse_zone": await _interesse_per_zona(),
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
    mrr = active_subs * PREZZO_CLIENTE_EUR

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


MOTIVO_RIFIUTO_MIN = 10


class RejectIn(BaseModel):
    reason: Optional[str] = ""


def _motivo_rifiuto(payload: "RejectIn") -> str:
    """Il motivo del rifiuto è obbligatorio (almeno 10 caratteri, spazi ai bordi esclusi): il commerciante
    lo riceve per email e in archivio, e deve capire cosa correggere."""
    motivo = (payload.reason or "").strip()
    if len(motivo) < MOTIVO_RIFIUTO_MIN:
        raise HTTPException(422, f"Scrivi il motivo del rifiuto (almeno {MOTIVO_RIFIUTO_MIN} caratteri): il commerciante lo legge per correggere l'offerta.")
    return motivo


@api.get("/admin/merchants/{merchant_id}/insights")
async def admin_merchant_insights(merchant_id: str, user: dict = Depends(require_admin_master)):
    """Le stesse statistiche, per l'admin, SEMPRE complete (senza soglia dei 3 clienti): solo numeri, mai nomi."""
    if not await db.users.find_one({"id": merchant_id, "role": "merchant"}, {"_id": 1}):
        raise HTTPException(404, "Negozio non trovato")
    return await _insights_negozio(merchant_id, applica_soglia=False)


@api.get("/admin/discounts/pending")
async def admin_list_pending(user: dict = Depends(require_admin_master)):
    docs = await db.discounts.find({"approval_status": "pending"}).sort("updated_at", -1).to_list(200)
    out = []
    for d in docs:
        e = await enrich_discount(d)
        e["pagamento"] = await _approvazione_consentita(await db.users.find_one({"id": d.get("merchant_id")}))
        out.append(e)
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

    scansioni = await _scansioni_per_negozio()
    da30 = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    sconti_tot: dict = {}
    sconti_30: dict = {}
    async for rd in db.redemptions.find({"status": "redeemed"}, {"_id": 0, "merchant_id": 1, "redeemed_at": 1}):
        mid = rd.get("merchant_id")
        sconti_tot[mid] = sconti_tot.get(mid, 0) + 1
        if (rd.get("redeemed_at") or "") >= da30:
            sconti_30[mid] = sconti_30.get(mid, 0) + 1

    # Lookup subscriptions per determinare "abbonato almeno una volta" e "attivo ora"
    client_ids = [c["id"] for c in clients] or [""]
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
    for mid in scansioni:            # negozi con scansioni ma ancora senza iscritti
        by_merchant.setdefault(mid, [])

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
            "scansioni_30_giorni": scansioni.get(mid, (0, 0))[0],
            "scansioni_totali": scansioni.get(mid, (0, 0))[1],
            "iscrizioni_30_giorni": sum(1 for c in cl if (c.get("referred_at") or c.get("created_at") or "") >= da30),
            "iscrizioni_totali": len(cl),
            "sconti_usati_30_giorni": sconti_30.get(mid, 0),
            "sconti_usati_totali": sconti_tot.get(mid, 0),
            "conversion_rate": round((subscribed / len(cl)) * 100, 1) if cl else 0.0,
            "clients": clients_enriched,
        })

    # Sort: prima chi ha più abbonati attivi, poi più iscritti totali
    rows.sort(key=lambda r: (r["active_subscribers"], r["total_signups"], r["scansioni_totali"]), reverse=True)
    percorso = {k: sum(r[k] for r in rows) for k in (
        "scansioni_30_giorni", "scansioni_totali", "iscrizioni_30_giorni", "iscrizioni_totali",
        "sconti_usati_30_giorni", "sconti_usati_totali")}

    return {
        "merchants": rows,
        "totals": {
            "merchants_with_referrals": sum(1 for r in rows if r["total_signups"]),
            **percorso,
            "total_signups": len(clients),
            "total_subscribed": len(subscribed_ids),
            "total_active": len(active_ids),
        },
    }



async def _iscrizioni_per_fonte(lo: Optional[str] = None, hi: Optional[str] = None, ruolo: str = "client") -> list:
    """Conteggio anonimo delle iscrizioni dei clienti per fonte di campagna (volantini). Nessun dato personale.
    Con `lo`/`hi` (istanti ISO, hi escluso) aggiunge `nel_periodo` (usato dal riepilogo settimanale)."""
    da30 = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    conteggi: dict = {}
    async for c in db.users.find({"role": ruolo, "fonte_iscrizione": {"$exists": True, "$nin": [None, ""]}},
                                 {"_id": 0, "fonte_iscrizione": 1, "fonte_iscrizione_at": 1, "created_at": 1}):
        f = c["fonte_iscrizione"]
        quando = c.get("fonte_iscrizione_at") or c.get("created_at") or ""
        r = conteggi.setdefault(f, {"fonte": f, "ultimi_30_giorni": 0, "totale": 0})
        r["totale"] += 1
        if quando >= da30:
            r["ultimi_30_giorni"] += 1
        if lo and hi:
            r["nel_periodo"] = r.get("nel_periodo", 0) + (1 if lo <= quando < hi else 0)
    return sorted(conteggi.values(), key=lambda r: (r["totale"], r["fonte"]), reverse=True)


class FonteVisitaIn(BaseModel):
    fonte: str = Field(max_length=60)
    tipo: Literal["cliente", "negozio"]


@api.post("/fonte/visita")
async def fonte_visita(payload: FonteVisitaIn):
    """Conta in modo anonimo una visita arrivata da un QR o un volantino (?fonte=...). Si salva solo la fonte, il tipo di
    pagina (cliente o negozio) e il giorno: nessun indirizzo IP, nessun cookie, nessun dato personale."""
    fonte = _fonte_valida(payload.fonte)
    if not fonte:
        return {"ok": False}
    giorno = _rome_now().date().isoformat()
    await db.fonte_visite.update_one({"fonte": fonte, "tipo": payload.tipo, "giorno": giorno},
                                     {"$inc": {"visite": 1}}, upsert=True)
    return {"ok": True}


@api.get("/admin/fonti-qr")
async def admin_fonti_qr(user: dict = Depends(require_admin_master)):
    """Per ogni volantino o QR di campagna: visite (clienti e negozi) e iscrizioni (clienti e negozi). Solo numeri."""
    da30 = (_rome_now().date() - timedelta(days=30)).isoformat()
    righe: dict = {}

    def riga(f):
        return righe.setdefault(f, {"fonte": f, "visite_clienti": 0, "visite_negozi": 0, "visite_30_giorni": 0,
                                    "clienti_iscritti": 0, "negozi_iscritti": 0})
    async for v in db.fonte_visite.find({}, {"_id": 0}):
        r = riga(v["fonte"])
        r["visite_clienti" if v.get("tipo") == "cliente" else "visite_negozi"] += int(v.get("visite") or 0)
        if v.get("giorno", "") >= da30:
            r["visite_30_giorni"] += int(v.get("visite") or 0)
    for x in await _iscrizioni_per_fonte(ruolo="client"):
        riga(x["fonte"])["clienti_iscritti"] = x["totale"]
    for x in await _iscrizioni_per_fonte(ruolo="merchant"):
        riga(x["fonte"])["negozi_iscritti"] = x["totale"]
    out = sorted(righe.values(), key=lambda r: (-(r["visite_clienti"] + r["visite_negozi"]), r["fonte"]))
    return {"fonti": out}


@api.get("/admin/iscrizioni-per-fonte")
async def admin_iscrizioni_per_fonte(user: dict = Depends(require_admin_master)):
    """Quante iscrizioni arrivano da ogni volantino o QR di campagna (solo numeri)."""
    return {"fonti": await _iscrizioni_per_fonte()}


# ---------- Riepilogo settimanale per l'admin (cosa funziona e cosa no) ----------
# Solo conteggi aggregati: nessuna email, nessun nome di persona. Riusa i calcoli esistenti
# (`_iscrizioni_per_fonte`, `_interesse_per_zona`, `_negozi_senza_offerta`, `_pag_righe_commercianti`).
RIEPILOGO_ATTESA_GIORNI = 3


def _settimana_conclusa(oggi: date) -> tuple:
    """(lunedì, lunedì successivo escluso) della settimana di Roma appena conclusa."""
    lunedi = oggi - timedelta(days=oggi.weekday())
    return lunedi - timedelta(days=7), lunedi


def _istante_roma(giorno: date) -> str:
    """Mezzanotte di Roma di quel giorno, in UTC ISO (come le date salvate nel database)."""
    return datetime(giorno.year, giorno.month, giorno.day, tzinfo=ROME_TZ).astimezone(timezone.utc).isoformat()


def _etichetta_periodo(da: date, a: date) -> str:
    ultimo = a - timedelta(days=1)
    return f"{da.day} {MESI_IT[da.month - 1]} – {ultimo.day} {MESI_IT[ultimo.month - 1]}"


def _variazione(questa: int, prima: int) -> dict:
    return {"questa": questa, "precedente": prima, "delta": questa - prima,
            "freccia": "↑" if questa > prima else "↓" if questa < prima else "="}


async def _conteggi_settimana(da: date, a: date) -> dict:
    """Conteggi di una settimana [da, a) (a escluso, date di Roma)."""
    lo, hi = _istante_roma(da), _istante_roma(a)
    intervallo = {"$gte": lo, "$lt": hi}
    giorni = {"$gte": da.isoformat(), "$lt": a.isoformat()}
    caricate = (await db.discounts.count_documents({"created_at": intervallo})
                + await db.next_discounts.count_documents({"created_at": intervallo}))
    approvate = (await db.discounts.count_documents({"approved_at": intervallo})
                 + await db.next_discounts.count_documents({"approved_at": intervallo}))
    scansioni = 0
    async for d in db.scansioni_locandina.find({"giorno": giorni}, {"_id": 0, "conteggio": 1}):
        scansioni += int(d.get("conteggio") or 0)
    return {
        "nuovi_clienti": await db.users.count_documents({"role": "client", "created_at": intervallo}),
        "nuovi_commercianti": await db.users.count_documents({"role": "merchant", "created_at": intervallo}),
        "offerte_caricate": caricate,
        "offerte_approvate": approvate,
        "sconti_usati": await db.redemptions.count_documents({"status": "redeemed", "redeemed_at": intervallo}),
        "scansioni_qr": scansioni,
        "iscrizioni_da_qr_negozi": await db.users.count_documents({"role": "client", "referred_at": intervallo}),
        "nuove_segnalazioni": await db.segnalazioni.count_documents({"creata_il": intervallo}),
        "account_cancellati": await db.cancellazioni_account.count_documents({"creata_il": intervallo}),
        "fonti": {r["fonte"]: r["nel_periodo"] for r in await _iscrizioni_per_fonte(lo, hi)},
    }


METRICHE_RIEPILOGO = (
    ("nuovi_clienti", "Nuovi clienti"),
    ("nuovi_commercianti", "Nuovi commercianti"),
    ("offerte_caricate", "Offerte caricate"),
    ("offerte_approvate", "Offerte approvate"),
    ("sconti_usati", "Sconti usati"),
    ("scansioni_qr", "Scansioni dei QR dei negozi"),
    ("iscrizioni_da_qr_negozi", "Iscrizioni dai QR dei negozi"),
    ("nuove_segnalazioni", "Nuove segnalazioni e reclami"),
    ("account_cancellati", "Account cancellati dai clienti"),
)


async def _riepilogo_settimanale(da: date, a: date, adesso: Optional[datetime] = None) -> dict:
    """Riepilogo della settimana [da, a) (date di Roma, `a` escluso) con confronto con la settimana prima.
    Solo conteggi: nessun dato personale."""
    adesso = adesso or datetime.now(timezone.utc)
    prima_da = da - (a - da)
    ora, prima = await _conteggi_settimana(da, a), await _conteggi_settimana(prima_da, da)
    metriche = [{"chiave": k, "etichetta": e, **_variazione(ora[k], prima[k])} for k, e in METRICHE_RIEPILOGO]

    totali_fonte = {r["fonte"]: r["totale"] for r in await _iscrizioni_per_fonte()}
    fonti = []
    for f in sorted(totali_fonte, key=lambda f: (-totali_fonte[f], f)):
        v = _variazione(ora["fonti"].get(f, 0), prima["fonti"].get(f, 0))
        fonti.append({"fonte": f, "questa": v["questa"], "precedente": v["precedente"],
                      "freccia": v["freccia"], "totale": totali_fonte[f]})

    soglia = (adesso - timedelta(days=RIEPILOGO_ATTESA_GIORNI)).isoformat()
    in_attesa = vecchie = 0
    for coll in (db.discounts, db.next_discounts):
        async for d in coll.find({"approval_status": "pending"}, {"_id": 0, "updated_at": 1, "created_at": 1}):
            in_attesa += 1
            if (d.get("updated_at") or d.get("created_at") or "") < soglia:
                vecchie += 1
    senza_offerta = await _negozi_senza_offerta()
    aperte = [s async for s in db.segnalazioni.find({"stato": {"$in": ["ricevuta", "in_esame"]}}, {"_id": 0, "tipo": 1})]
    reclami = sum(1 for s in aperte if s.get("tipo") == "reclamo_commerciante")

    pagamenti = None
    if merchant_payment_required():
        per_stato = {s: 0 for s in PAG_STATI}
        for r in await _pag_righe_commercianti():
            per_stato[r["stato"]] += 1
        pagamenti = {"per_stato": per_stato}

    situazione = {
        "offerte_in_attesa": in_attesa, "offerte_in_attesa_oltre_3_giorni": vecchie,
        "negozi_senza_offerta": len(senza_offerta), "negozi_senza_offerta_nomi": senza_offerta,
        "segnalazioni_aperte": len(aperte) - reclami, "reclami_aperti": reclami,
    }
    riepilogo = {
        "periodo": {"da": da.isoformat(), "a": (a - timedelta(days=1)).isoformat(), "etichetta": _etichetta_periodo(da, a),
                    "precedente": {"da": prima_da.isoformat(), "a": (da - timedelta(days=1)).isoformat()}},
        "metriche": metriche, "fonti": fonti, "interesse_zone": await _interesse_per_zona(),
        "situazione": situazione, "pagamenti": pagamenti,
    }
    riepilogo["da_guardare"] = _da_guardare(riepilogo)
    return riepilogo


def _da_guardare(r: dict) -> list:
    """Al massimo 3 cose, scelte con regole semplici, dalla più urgente."""
    s, voci = r["situazione"], []
    aperte = s["segnalazioni_aperte"] + s["reclami_aperti"]
    if aperte:
        voci.append(f"{aperte} segnalazioni o reclami aperti: la risposta va data entro 5 giorni lavorativi.")
    if s["offerte_in_attesa_oltre_3_giorni"]:
        voci.append(f"{s['offerte_in_attesa_oltre_3_giorni']} offerte in attesa da più di {RIEPILOGO_ATTESA_GIORNI} giorni: da approvare o rifiutare.")
    scaduti = ((r.get("pagamenti") or {}).get("per_stato") or {}).get("scaduto", 0)
    if scaduti:
        voci.append(f"{scaduti} negozi con il pagamento scaduto.")
    ferme = [f["fonte"] for f in r["fonti"] if f["questa"] == 0 and f["totale"] > 0]
    if ferme:
        voci.append("Zero iscrizioni questa settimana da: " + ", ".join(ferme[:3]) + ".")
    if s["negozi_senza_offerta"]:
        voci.append(f"{s['negozi_senza_offerta']} negozi iscritti senza nessuna offerta: da contattare.")
    nuovi = next((m for m in r["metriche"] if m["chiave"] == "nuovi_clienti"), None)
    if nuovi and nuovi["questa"] == 0:
        voci.append("Nessun nuovo cliente iscritto questa settimana.")
    return voci[:3]


@api.get("/admin/riepilogo-settimanale")
async def admin_riepilogo_settimanale(user: dict = Depends(require_admin_master)):
    """Riepilogo dell'ultima settimana conclusa (lunedì-domenica, ora di Roma) col confronto con quella prima."""
    da, a = _settimana_conclusa(_rome_now().date())
    return await _riepilogo_settimanale(da, a)


async def _run_riepilogo_settimanale(oggi: Optional[date] = None) -> dict:
    """Ogni lunedì: manda il riepilogo a `ADMIN_NOTIFY_EMAIL`. Una sola email a settimana: la settimana
    viene «prenotata» nel database prima dell'invio, quindi un riavvio o un secondo avvio non la ripetono."""
    to = os.environ.get("ADMIN_NOTIFY_EMAIL", "").strip()
    if not to:
        logging.info("[riepilogo-settimanale] ADMIN_NOTIFY_EMAIL non impostato: niente invio")
        return {"sent": 0, "skipped": "nessun_destinatario"}
    da, a = _settimana_conclusa(oggi or _rome_now().date())
    chiave = f"riepilogo_settimanale_{da.isoformat()}"
    res = await db.settings.update_one({"key": chiave}, {"$setOnInsert": {
        "key": chiave, "claimed_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    if res.upserted_id is None:
        return {"sent": 0, "skipped": "gia_inviato"}
    try:
        riepilogo = await _riepilogo_settimanale(da, a)
        await send_admin_riepilogo_settimanale(to, riepilogo)
    except Exception as e:
        logging.error(f"[riepilogo-settimanale] invio non riuscito: {e}")
        await db.settings.delete_one({"key": chiave})   # si potrà ritentare
        return {"sent": 0, "skipped": "errore"}
    return {"sent": 1, "settimana": da.isoformat()}


async def _approvazione_consentita(merchant: Optional[dict], per_mese_dopo: bool = False) -> dict:
    """Si può approvare l'offerta di questo negozio? Con i pagamenti dei negozi accesi, dopo la prova
    l'approvazione è consentita solo se il pagamento del mese è arrivato nei giorni stabiliti
    (1° + tolleranza). Interruttore spento o negozio ancora in prova / alla prima offerta -> sempre sì.
    `per_mese_dopo`: offerta del mese prossimo, valutata al 1° del mese prossimo.
    Ritorna {"ok": bool, "fase": str, "motivo": str}."""
    if not merchant_payment_required() or not merchant:
        return {"ok": True, "fase": "non_richiesto", "motivo": ""}
    oggi = pp.a_data_roma(datetime.now(timezone.utc))
    if per_mese_dopo:
        oggi = pp.primo_del_mese_dopo(oggi)
    st = pp.stato_pagamento(await _prima_pubblicazione(merchant), await _pagamenti_negozio(merchant["id"]),
                            oggi, await _tolleranza_giorni())
    if merchant.get("no_renew_month") and merchant["no_renew_month"] <= pp.chiave_mese(oggi):
        return {"ok": False, "fase": "disdetta", "motivo": "Il negozio ha disdetto: l'offerta non si approva."}
    if st["fase"] == "da_pagare":
        return {"ok": False, "fase": "da_pagare",
                "motivo": "Pagamento del mese non ricevuto nei giorni stabiliti: approva dopo il pagamento."}
    return {"ok": True, "fase": st["fase"], "motivo": ""}


class FotoScartataIn(BaseModel):
    url: str = Field(max_length=2000)
    motivo: str = Field(default="", max_length=500)


class ApprovaIn(BaseModel):
    foto_scartate: Optional[List[FotoScartataIn]] = None


def _foto_dell_offerta(d: dict) -> list:
    urls = [u for u in (d.get("image_urls") or []) if u]
    if d.get("image_url") and d["image_url"] not in urls:
        urls.insert(0, d["image_url"])
    return urls


def _prepara_foto_scartate(d: dict, scarti) -> tuple:
    """Controlla le foto scartate dall'admin (motivo di almeno 10 caratteri, foto davvero dell'offerta, almeno
    una foto che resta). Ritorna (foto che restano, [(numero della foto, motivo)])."""
    foto = _foto_dell_offerta(d)
    motivi = {}
    for x in scarti or []:
        motivo = (x.motivo or "").strip()
        if x.url not in foto:
            raise HTTPException(422, "Una foto scartata non fa parte dell'offerta: ricarica la pagina")
        if len(motivo) < MOTIVO_RIFIUTO_MIN:
            raise HTTPException(422, f"Scrivi il motivo per cui scarti la foto (almeno {MOTIVO_RIFIUTO_MIN} caratteri)")
        motivi[x.url] = motivo
    restano = [u for u in foto if u not in motivi]
    if motivi and not restano:
        raise HTTPException(422, "Se scarti tutte le foto, rifiuta l'offerta con un motivo")
    return restano, [(i + 1, motivi[u]) for i, u in enumerate(foto) if u in motivi]


async def _approva_offerta(discount_id: str, foto_scartate: Optional[list] = None) -> Optional[dict]:
    """Approva un'offerta: pubblica, segna la prima pubblicazione del negozio, avvisa il commerciante
    e i clienti interessati. Ritorna l'offerta aggiornata, o None se non esiste."""
    now = datetime.now(timezone.utc)
    result = await db.discounts.update_one({"id": discount_id}, {"$set": {
        "approval_status": "approved",
        "approved_at": now.isoformat(),
        "published_at": now.isoformat(),
        "locked_month": current_month_key(),
        "approval_note": "",
        "force_editable": False,
    }})
    if result.matched_count == 0:
        return None
    d = await db.discounts.find_one({"id": discount_id})
    await _segna_prima_pubblicazione(d.get("merchant_id"), now.isoformat())
    # Notifica il commerciante via email
    try:
        m = await db.users.find_one({"id": d.get("merchant_id")})
        if m and m.get("email"):
            await send_merchant_approved(m["email"], m.get("name") or "commerciante", m.get("shop_name") or "il tuo negozio", d.get("title") or "", foto_scartate)
    except Exception as e:
        logging.warning(f"approve email failed: {e}")
    _push_esito_offerta(d.get("merchant_id"), d.get("title") or "", approvata=True)
    if d.get("active", True):
        _avvisi_in_background(d)
    return d


@api.post("/admin/discounts/{discount_id}/approve")
async def admin_approve_discount(discount_id: str, payload: Optional[ApprovaIn] = Body(default=None), user: dict = Depends(require_admin_master)):
    d0 = await db.discounts.find_one({"id": discount_id})
    if d0 and d0.get("approval_status") == STATO_ATTESA_NEGOZIO:
        raise HTTPException(409, "Il negozio non ha ancora confermato l'offerta preparata da noi.")
    if d0:
        via = await _approvazione_consentita(await db.users.find_one({"id": d0.get("merchant_id")}))
        if not via["ok"]:
            raise HTTPException(409, via["motivo"])
    scartate = []
    if d0 and payload and payload.foto_scartate:
        restano, scartate = _prepara_foto_scartate(d0, payload.foto_scartate)
        await db.discounts.update_one({"id": discount_id}, {"$set": {
            "image_urls": restano, "image_url": restano[0],
            "foto_scartate": [{"numero": n, "motivo": mt} for n, mt in scartate]}})
    d = await _approva_offerta(discount_id, scartate)
    if d is None:
        raise HTTPException(404, "Sconto non trovato")
    return {"discount": await enrich_discount(d)}


class ApprovaTutteIn(BaseModel):
    conferma: Optional[str] = ""


@api.post("/admin/discounts/approve-all-pending")
async def admin_approve_all_pending(payload: ApprovaTutteIn, user: dict = Depends(require_admin_master)):
    """Pre-lancio: approva in un colpo solo tutte le offerte in attesa (il giorno del lancio).
    Per i negozi alla prima pubblicazione la prova (circa due mesi) parte da questo momento.
    Serve la parola di conferma «LANCIA» per evitare tocchi per errore."""
    if (payload.conferma or "").strip().upper() != "LANCIA":
        raise HTTPException(400, "Scrivi LANCIA per confermare")
    pendenti = await db.discounts.find({"approval_status": "pending"}, {"id": 1, "merchant_id": 1, "_id": 0}).to_list(None)
    approvate = saltate = 0
    for p in pendenti:
        via = await _approvazione_consentita(await db.users.find_one({"id": p.get("merchant_id")}))
        if not via["ok"]:
            saltate += 1
            continue
        if await _approva_offerta(p["id"]):
            approvate += 1
    return {"approvate": approvate, "saltate_per_pagamento": saltate}


@api.post("/admin/discounts/{discount_id}/reject")
async def admin_reject_discount(discount_id: str, payload: RejectIn, user: dict = Depends(require_admin_master)):
    motivo = _motivo_rifiuto(payload)
    result = await db.discounts.update_one({"id": discount_id}, {"$set": {
        "approval_status": "rejected",
        "approval_note": motivo,
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
            await send_merchant_rejected(m["email"], m.get("name") or "commerciante", m.get("shop_name") or "il tuo negozio", d.get("title") or "", motivo)
    except Exception as e:
        logging.warning(f"reject email failed: {e}")
    if d_rif:  # nella notifica niente motivo: lo legge nell'app e nell'email
        _push_esito_offerta(d_rif.get("merchant_id"), d_rif.get("title") or "", approvata=False)
    return {"ok": True}


@api.post("/admin/discounts/{discount_id}/force-edit")
async def admin_force_edit(discount_id: str, user: dict = Depends(require_admin_master)):
    """Admin override: allow merchant to modify a locked offer this month."""
    d0 = await db.discounts.find_one({"id": discount_id}, {"approval_status": 1})
    if d0 and d0.get("approval_status") == STATO_ATTESA_NEGOZIO:
        raise HTTPException(409, "Il negozio non ha ancora confermato l'offerta preparata da noi.")
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
async def admin_approve_next_offer(next_id: str, payload: Optional[ApprovaIn] = Body(default=None), user: dict = Depends(require_admin_master)):
    nd0 = await db.next_discounts.find_one({"id": next_id})
    if nd0:
        via = await _approvazione_consentita(await db.users.find_one({"id": nd0.get("merchant_id")}), per_mese_dopo=True)
        if not via["ok"]:
            raise HTTPException(409, via["motivo"])
    scartate = []
    if nd0 and payload and payload.foto_scartate:
        restano, scartate = _prepara_foto_scartate(nd0, payload.foto_scartate)
        await db.next_discounts.update_one({"id": next_id}, {"$set": {
            "image_urls": restano, "image_url": restano[0],
            "foto_scartate": [{"numero": n, "motivo": mt} for n, mt in scartate]}})
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
                                         m.get("shop_name") or "il tuo negozio", nd.get("title") or "", scartate)
    except Exception as e:
        logging.warning(f"next-offer approve email failed: {e}")
    _push_esito_offerta(nd.get("merchant_id"), nd.get("title") or "", approvata=True, mese_dopo=True)
    return {"next_discount": _enrich_next(nd)}


@api.post("/admin/next-offers/{next_id}/reject")
async def admin_reject_next_offer(next_id: str, payload: RejectIn, user: dict = Depends(require_admin_master)):
    motivo = _motivo_rifiuto(payload)
    result = await db.next_discounts.update_one({"id": next_id}, {"$set": {
        "approval_status": "rejected", "approval_note": motivo, "approved_at": None}})
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
                                         nd.get("title") or "", motivo)
    except Exception as e:
        logging.warning(f"next-offer reject email failed: {e}")
    if nd_rif:
        _push_esito_offerta(nd_rif.get("merchant_id"), nd_rif.get("title") or "", approvata=False, mese_dopo=True)
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
    oggi = pp.a_data_roma(datetime.now(timezone.utc))
    mese_corrente = pp.chiave_mese(oggi)
    tol = await _tolleranza_giorni()
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
        st = pp.stato_pagamento(await _prima_pubblicazione(m), await _pagamenti_negozio(m["id"]), oggi, tol)
        m["stato_pagamento"] = {"fase": st["fase"],
                                "prova_fino_al": st["prova_fino_al"].isoformat() if st["prova_fino_al"] else None,
                                "primo_pagamento": st["primo_pagamento"].isoformat() if st["primo_pagamento"] else None,
                                "mese": mese_corrente}
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


@api.get("/admin/merchants/{merchant_id}/shop-code")
async def admin_merchant_shop_code(merchant_id: str, user: dict = Depends(require_admin_master)):
    """Solo admin (con master password), un negozio alla volta: mai nelle liste, mai nei log."""
    if not await db.users.find_one({"id": merchant_id, "role": "merchant"}, {"id": 1}):
        raise HTTPException(404, "Commerciante non trovato")
    return await _shop_code_doc(merchant_id)


@api.post("/admin/merchants/{merchant_id}/shop-code/regenerate")
async def admin_merchant_shop_code_regenerate(merchant_id: str, user: dict = Depends(require_admin_master)):
    if not await db.users.find_one({"id": merchant_id, "role": "merchant"}, {"id": 1}):
        raise HTTPException(404, "Commerciante non trovato")
    return await _shop_code_regenerate(merchant_id)


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


# ---------- «Ci pensiamo noi»: offerta preparata dall'admin, confermata dal negozio ----------
# Decisione del titolare (18/10): per i negozi che hanno poco tempo l'offerta la inseriamo noi, gratis.
# L'offerta nasce nello stato STATO_ATTESA_NEGOZIO: non si vede ai clienti, non conta come pubblicazione
# e non avvia la prova. Il negozio la conferma con un link monouso (7 giorni, senza login) o dalla sua
# dashboard; da lì segue il flusso normale «in revisione» -> approvazione dell'admin.
# Della conferma si salvano solo data/ora e versione del testo: nessun IP, nessun dato del dispositivo.
STATO_ATTESA_NEGOZIO = "awaiting_merchant"
CPN_SCADENZA_GIORNI = 7
CPN_TESTO_VERSIONE = "ci-pensiamo-noi-2026-10-22"
CPN_TESTO_CONFERMA = ("Confermando dichiari che i dati dell'offerta sono corretti e te ne assumi la responsabilità, "
                      "come se l'avessi inserita tu.")
# Stati dell'offerta attuale che l'admin può sostituire con una preparata da noi: mai un'offerta in
# revisione (l'ha inviata il negozio) o approvata (è online o bloccata per il mese).
_CPN_SOSTITUIBILI = (STATO_ATTESA_NEGOZIO, "rejected", "expired")
_CPN_CAMPI_OFFERTA = ("title", "description", "original_price", "discounted_price", "image_url", "image_urls",
                      "terms", "plan_ahead", "validity_info", "additional_info", "max_uses_per_month")


def _cpn_link(path: str) -> str:
    return f"{_frontend_url() or 'http://localhost:3000'}{path}"


def _cpn_offerta_pubblica(d: dict) -> dict:
    """Solo i campi dell'offerta da far vedere al negozio nella pagina di conferma."""
    out = {k: d.get(k) for k in _CPN_CAMPI_OFFERTA}
    if not isinstance(out.get("image_urls"), list) or not out["image_urls"]:
        out["image_urls"] = [d["image_url"]] if d.get("image_url") else []
    try:
        out["percent_off"] = round((d["original_price"] - d["discounted_price"]) / d["original_price"] * 100)
    except Exception:
        out["percent_off"] = 0
    return out


async def _cpn_puo_preparare(merchant_id: str) -> dict:
    d = await db.discounts.find_one({"merchant_id": merchant_id})
    if not d:
        return {"ok": True, "motivo": "", "discount": None}
    st = d.get("approval_status") or "approved"
    if st in _CPN_SOSTITUIBILI:
        return {"ok": True, "motivo": "", "discount": d}
    motivo = ("Il negozio ha già un'offerta in revisione: approvala o rifiutala dalla scheda «Offerte in attesa»."
              if st == "pending" else "Il negozio ha già un'offerta approvata per questo mese.")
    return {"ok": False, "motivo": motivo, "discount": d}


async def _cpn_conferma(d: dict, via: str) -> Optional[dict]:
    """Il negozio conferma l'offerta preparata: passa «in revisione» (poi approvazione dell'admin; in
    pre-lancio resta in attesa fino ad «Approva tutte»). Ritorna l'offerta aggiornata, None se nel
    frattempo non era più da confermare (due tocchi insieme, modifica, nuova versione dell'admin)."""
    ora = datetime.now(timezone.utc).isoformat()
    res = await db.discounts.update_one(
        {"id": d["id"], "approval_status": STATO_ATTESA_NEGOZIO, "prepared_at": d.get("prepared_at")},
        {"$set": {"approval_status": "pending", "approval_note": "", "updated_at": ora,
                  "merchant_confirmed_at": ora, "merchant_confirm_version": CPN_TESTO_VERSIONE,
                  "merchant_confirm_via": via}})
    if res.modified_count != 1:
        return None
    # Prova della conferma: solo data/ora, versione del testo e da dove (link o dashboard). Niente IP.
    await db.conferme_offerta.insert_one({
        "id": str(uuid.uuid4()), "merchant_id": d["merchant_id"], "discount_id": d["id"],
        "prepared_at": d.get("prepared_at"), "confirmed_at": ora, "testo_versione": CPN_TESTO_VERSIONE,
        "via": via, "titolo": d.get("title") or ""})
    # I link ancora in giro per questa offerta non servono più
    await db.ci_pensiamo_noi_link.update_many({"discount_id": d["id"], "used_at": None}, {"$set": {"used_at": ora}})
    m = await db.users.find_one({"id": d["merchant_id"]}) or {}
    negozio = m.get("shop_name") or "Un negozio"
    if _admin_notify_to():
        _email_in_background(send_admin_offerta_confermata(_admin_notify_to(), negozio, d.get("title") or ""),
                             "admin-ci-pensiamo-noi")
    _push_admin_in_background(f"Il negozio {negozio} ha confermato l'offerta", d.get("title") or "", "admin-ci-pensiamo-noi")
    return await db.discounts.find_one({"id": d["id"]})


@api.get("/admin/merchants/{merchant_id}/ci-pensiamo-noi")
async def admin_cpn_stato(merchant_id: str, user: dict = Depends(require_admin_master)):
    """Per il modulo dell'admin: si può preparare l'offerta? Se ce n'è già una da confermare, i suoi dati."""
    if not await db.users.find_one({"id": merchant_id, "role": "merchant"}, {"id": 1}):
        raise HTTPException(404, "Commerciante non trovato")
    v = await _cpn_puo_preparare(merchant_id)
    d = v["discount"]
    da_confermare = bool(d and d.get("approval_status") == STATO_ATTESA_NEGOZIO)
    return {"ok": v["ok"], "motivo": v["motivo"],
            "offerta": _cpn_offerta_pubblica(d) if da_confermare else None,
            "inviata_at": d.get("prepared_at") if da_confermare else None}


@api.post("/admin/merchants/{merchant_id}/ci-pensiamo-noi")
async def admin_cpn_prepara(merchant_id: str, payload: DiscountIn, user: dict = Depends(require_admin_master)):
    """L'admin inserisce l'offerta per conto del negozio (gratis) e gli manda l'email con «Confermo»."""
    m = await db.users.find_one({"id": merchant_id, "role": "merchant"})
    if not m:
        raise HTTPException(404, "Commerciante non trovato")
    if not m.get("email"):
        raise HTTPException(409, "Il negozio non ha un indirizzo email: non possiamo chiedergli la conferma.")
    v = await _cpn_puo_preparare(merchant_id)
    if not v["ok"]:
        raise HTTPException(409, v["motivo"])
    data = payload.cleaned()
    if not data.get("title") or not data.get("description"):
        raise HTTPException(422, "Titolo e descrizione sono obbligatori")
    ora = datetime.now(timezone.utc)
    data.update({
        "active": True, "updated_at": ora.isoformat(),
        "approval_status": STATO_ATTESA_NEGOZIO, "approval_note": "", "locked_month": None,
        "approved_at": None, "published_at": None, "force_editable": False, "expired_at": None,
        "prepared_by_admin": True, "prepared_at": ora.isoformat(),
        "merchant_confirmed_at": None, "merchant_confirm_version": None, "merchant_confirm_via": None,
    })
    esistente = v["discount"]
    if esistente:  # rifiutata o scaduta: è già nell'archivio; da confermare: si sostituisce
        await db.discounts.update_one({"id": esistente["id"]}, {"$set": data})
        did = esistente["id"]
    else:
        did = str(uuid.uuid4())
        data.update({"id": did, "merchant_id": merchant_id, "created_at": ora.isoformat()})
        await db.discounts.insert_one(dict(data))
    # Un solo link valido per offerta: quello nuovo sostituisce i precedenti
    await db.ci_pensiamo_noi_link.update_many({"discount_id": did, "used_at": None},
                                              {"$set": {"used_at": ora.isoformat(), "sostituito": True}})
    token = secrets.token_urlsafe(32)
    scade = ora + timedelta(days=CPN_SCADENZA_GIORNI)
    await db.ci_pensiamo_noi_link.insert_one({
        "id": str(uuid.uuid4()), "discount_id": did, "merchant_id": merchant_id,
        "token_hash": _hash_token_conferma(token), "created_at": ora.isoformat(),
        "expires_at": scade.isoformat(), "used_at": None})
    d = await db.discounts.find_one({"id": did})
    inviata = await send_ci_pensiamo_noi(
        m["email"], m.get("name") or "", m.get("shop_name") or "il tuo negozio", _cpn_offerta_pubblica(d),
        _cpn_link(f"/conferma-offerta?token={token}"), _cpn_link("/merchant/discount"),
        CPN_TESTO_CONFERMA, CPN_SCADENZA_GIORNI)
    return {"discount": await enrich_discount(d), "email_inviata": bool(inviata), "scade_il": scade.isoformat()}


class CpnTokenIn(BaseModel):
    token: str = Field(default="", max_length=200)


async def _cpn_da_token(token: str):
    """(link, offerta) dal token, oppure un errore 400 con codice: link_non_valido, link_usato, link_scaduto."""
    token = (token or "").strip()
    link = await db.ci_pensiamo_noi_link.find_one({"token_hash": _hash_token_conferma(token)}) if token else None
    if not link:
        raise HTTPException(400, {"code": "link_non_valido", "msg": "Questo link non è valido."})
    if link.get("used_at"):
        raise HTTPException(400, {"code": "link_usato", "msg": "Questo link è già stato usato: l'offerta è già confermata o ne è arrivata una versione nuova."})
    try:
        scaduto = datetime.fromisoformat(link.get("expires_at", "")) < datetime.now(timezone.utc)
    except Exception:
        scaduto = True
    if scaduto:
        raise HTTPException(400, {"code": "link_scaduto", "msg": "Questo link è scaduto (vale 7 giorni). Entra nell'area commercianti per confermare o modificare l'offerta, oppure scrivici."})
    d = await db.discounts.find_one({"id": link["discount_id"], "merchant_id": link["merchant_id"]})
    if not d or d.get("approval_status") != STATO_ATTESA_NEGOZIO:
        raise HTTPException(400, {"code": "link_usato", "msg": "Questa offerta non è più da confermare."})
    return link, d


@api.post("/ci-pensiamo-noi/anteprima")
async def cpn_anteprima(payload: CpnTokenIn):
    """Pagina «Conferma la tua offerta» (senza login): riepilogo e testo da accettare. Non consuma il link."""
    link, d = await _cpn_da_token(payload.token)
    m = await db.users.find_one({"id": d["merchant_id"]}) or {}
    return {"negozio": m.get("shop_name") or "", "offerta": _cpn_offerta_pubblica(d),
            "testo_conferma": CPN_TESTO_CONFERMA, "testo_versione": CPN_TESTO_VERSIONE,
            "scade_il": link.get("expires_at")}


@api.post("/ci-pensiamo-noi/conferma")
async def cpn_conferma_link(payload: CpnTokenIn):
    """«Confermo» dal link dell'email: monouso, valido 7 giorni, senza login. Con POST dalla pagina dell'app
    (un GET potrebbe essere aperto dagli antivirus della posta)."""
    link, d = await _cpn_da_token(payload.token)
    ora = datetime.now(timezone.utc).isoformat()
    res = await db.ci_pensiamo_noi_link.update_one({"id": link["id"], "used_at": None}, {"$set": {"used_at": ora}})
    if res.modified_count != 1:  # due tocchi insieme: ne vale uno solo
        raise HTTPException(400, {"code": "link_usato", "msg": "Questo link è già stato usato."})
    if not await _cpn_conferma(d, "link_email"):
        raise HTTPException(400, {"code": "link_usato", "msg": "Questa offerta non è più da confermare."})
    m = await db.users.find_one({"id": d["merchant_id"]}) or {}
    return {"ok": True, "negozio": m.get("shop_name") or ""}


@api.post("/merchants/me/discount/conferma-preparata")
async def merchant_cpn_conferma(user: dict = Depends(require_merchant)):
    """«Confermo» dalla dashboard del commerciante (già entrato con il suo account)."""
    d = await db.discounts.find_one({"merchant_id": user["id"]})
    if not d or d.get("approval_status") != STATO_ATTESA_NEGOZIO:
        raise HTTPException(409, "Non c'è un'offerta preparata da confermare.")
    d2 = await _cpn_conferma(d, "dashboard")
    if not d2:
        raise HTTPException(409, "Non c'è un'offerta preparata da confermare.")
    return {"discount": await enrich_discount(d2)}


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


async def _run_trial_reminders(oggi=None) -> dict:
    """Promemoria di fine prova ai negozi: uno a 10 giorni e uno a 3 giorni prima (idempotente: ogni
    promemoria parte una volta sola per negozio). Attivo solo con MERCHANT_PAYMENT_REQUIRED acceso;
    la data di fine prova viene da `trial_end_date` (stessa regola dei pagamenti)."""
    if not merchant_payment_required():
        return {"checked": 0, "sent": 0, "skipped": "pagamenti_negozi_spenti"}
    oggi = oggi or pp.a_data_roma(datetime.now(timezone.utc))
    now_iso = datetime.now(timezone.utc).isoformat()
    negozi = await db.users.find({"role": "merchant"}).to_list(None)
    sent = 0
    for m in negozi:
        if not m.get("email") or m.get("no_renew_month"):
            continue
        fine = pp.trial_end_date(await _prima_pubblicazione(m))
        if not fine:
            continue
        giorni = (fine - oggi).days
        if 3 < giorni <= 10:
            flag = "trial_reminder_10_sent_at"
        elif 0 <= giorni <= 3:
            flag = "trial_reminder_3_sent_at"
        else:
            continue
        if m.get(flag):
            continue
        # Un promemoria a 3 giorni non va mai accompagnato da uno a 10 arrivato in ritardo
        if flag == "trial_reminder_3_sent_at":
            await db.users.update_one({"id": m["id"], "trial_reminder_10_sent_at": {"$in": [None]}},
                                      {"$set": {"trial_reminder_10_sent_at": "saltato"}})
        try:
            await send_merchant_trial_reminder(
                m["email"], m.get("name") or "", m.get("shop_name") or "il tuo negozio",
                max(giorni, 1), f"{fine.day} {MESI_IT[fine.month - 1]} {fine.year}")
            await db.users.update_one({"id": m["id"]}, {"$set": {flag: now_iso}})
            sent += 1
        except Exception as e:
            logging.error(f"[trial-reminder] invio non riuscito per negozio={str(m.get('id'))[:8]}: {e}")
    return {"checked": len(negozi), "sent": sent}


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
            logging.info(f"[grace-reminder] email inviata to={mask_email(u['email'])} days_left={days_left}")
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
    now_iso = datetime.now(timezone.utc).isoformat()
    if force:
        await db.rollover_runs.update_one({"month": month}, {"$set": {"ran_at": now_iso}}, upsert=True)
    else:
        # Il mese si «prenota» in un colpo solo (atomico): il job delle 00:05 e il recupero all'avvio, o due
        # copie del server accese insieme, non possono passare entrambi (niente offerte archiviate o email doppie).
        claim = await db.rollover_runs.update_one(
            {"month": month}, {"$setOnInsert": {"month": month, "ran_at": now_iso}}, upsert=True)
        if claim.upserted_id is None:
            return {"skipped": True, "month": month}
    try:
        return await _esegui_rollover(month, now_iso)
    except Exception:
        if not force:
            await db.rollover_runs.delete_one({"month": month})  # si potrà ritentare (al riavvio o col job)
        raise


async def _esegui_rollover(month: str, now_iso: str) -> dict:
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
            await _segna_prima_pubblicazione(mid, now_iso)
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
        # «Prenotazione» atomica prima dell'invio: due copie del server accese insieme (per esempio durante un
        # aggiornamento) o due passaggi in parallelo non mandano la stessa email due volte.
        prenota = await db.reminder_claims.update_one(
            {"key": f"offerta_{nm}_{mid}_{stage}"},
            {"$setOnInsert": {"key": f"offerta_{nm}_{mid}_{stage}",
                              "expires_at": datetime.now(timezone.utc) + timedelta(days=60)}}, upsert=True)
        if prenota.upserted_id is None:
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
            await db.reminder_claims.delete_one({"key": f"offerta_{nm}_{mid}_{stage}"})  # si potrà ritentare
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
    # Prenotazione atomica prima dell'invio (due passaggi insieme non mandano due email).
    claim = await db.settings.update_one({"key": key}, {"$setOnInsert": {"key": key}}, upsert=True)
    if claim.upserted_id is None:
        return False
    try:
        await send_admin_month_summary(to, label, pending, rejected, missing, no_renew)
    except Exception as e:
        logging.error(f"[admin-summary] send failed: {e}")
        await db.settings.delete_one({"key": key})  # si potrà ritentare
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
        CronTrigger(hour=10, minute=0, timezone="Europe/Rome"),
        id="grace_reminders_daily",
        replace_existing=True,
    )
    # Promemoria "carica offerta mese prossimo" — ogni giorno 09:30 (invia solo in finestra, idempotente)
    _scheduler.add_job(
        _run_next_offer_reminders,
        CronTrigger(hour=9, minute=30, timezone="Europe/Rome"),
        id="next_offer_reminders_daily",
        replace_existing=True,
    )
    # Promemoria di fine prova ai negozi (10 e 3 giorni prima) — ogni giorno 09:45, solo con pagamenti negozi accesi
    _scheduler.add_job(
        _run_trial_reminders,
        CronTrigger(hour=9, minute=45, timezone="Europe/Rome"),
        id="trial_reminders_daily",
        replace_existing=True,
    )
    # Avviso di lancio alla lista d'attesa: riprende ogni giorno alle 10:00 (Roma) solo dopo che l'admin ha premuto AVVISA
    _scheduler.add_job(
        _avviso_giornaliero,
        CronTrigger(hour=10, minute=0, timezone="Europe/Rome"),
        id="avviso_lancio_giornaliero",
        replace_existing=True,
        misfire_grace_time=3 * 3600,
        coalesce=True,
    )
    # Riepilogo settimanale all'admin — ogni lunedì alle 8:00 (idempotente; senza ADMIN_NOTIFY_EMAIL non fa nulla)
    _scheduler.add_job(
        _run_riepilogo_settimanale,
        CronTrigger(day_of_week="mon", hour=8, minute=0, timezone="Europe/Rome"),
        id="riepilogo_settimanale",
        replace_existing=True,
        misfire_grace_time=6 * 3600,
        coalesce=True,
    )
    # Passaggio mese: il 1° alle 00:05 — promuove offerte approvate, fa scadere le altre
    _scheduler.add_job(
        _run_month_rollover,
        CronTrigger(day=1, hour=0, minute=5, timezone="Europe/Rome"),
        id="month_rollover",
        replace_existing=True,
        misfire_grace_time=6 * 3600,  # se il server è occupato o riparte dopo le 00:05 il passaggio parte comunque
        coalesce=True,
    )
    # Account cliente non confermati da 7 giorni: ogni giorno alle 03:30 (e anche all'avvio)
    _scheduler.add_job(
        _run_unconfirmed_cleanup,
        CronTrigger(hour=3, minute=30, timezone="Europe/Rome"),
        id="unconfirmed_cleanup_daily",
        replace_existing=True,
    )
    # Lista d'attesa: iscrizioni mai confermate da 7 giorni, ogni giorno alle 03:40 (e anche all'avvio)
    _scheduler.add_job(
        _run_waitlist_cleanup,
        CronTrigger(hour=3, minute=40, timezone="Europe/Rome"),
        id="waitlist_cleanup_daily",
        replace_existing=True,
    )
    # Lista d'attesa: confermate e annullate oltre 12 mesi, ogni giorno alle 03:50 (e anche all'avvio)
    _scheduler.add_job(
        _run_waitlist_retention,
        CronTrigger(hour=3, minute=50, timezone="Europe/Rome"),
        id="waitlist_retention_daily",
        replace_existing=True,
    )
    # Notifiche push a commercianti e clienti: i lavori girano sempre ma non fanno nulla con PUSH_UTENTI_ENABLED spento.
    _scheduler.add_job(_run_push_offerte_in_scadenza, CronTrigger(hour=10, minute=5, timezone="Europe/Rome"),
                       id="push_offerte_in_scadenza", replace_existing=True, misfire_grace_time=3 * 3600, coalesce=True)
    _scheduler.add_job(_run_push_sconti_in_scadenza, CronTrigger(hour=10, minute=10, timezone="Europe/Rome"),
                       id="push_sconti_in_scadenza", replace_existing=True, misfire_grace_time=3 * 3600, coalesce=True)
    _scheduler.add_job(_run_push_riepilogo_commercianti, CronTrigger(hour=21, minute=30, timezone="Europe/Rome"),
                       id="push_riepilogo_commercianti", replace_existing=True, misfire_grace_time=3600, coalesce=True)
    _scheduler.add_job(_invia_coda_promozionale, CronTrigger(hour="9-20", minute="*/15", timezone="Europe/Rome"),
                       id="push_coda_promozionale", replace_existing=True, misfire_grace_time=600, coalesce=True)
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
    await db.scansioni_locandina.create_index([("merchant_id", 1), ("giorno", 1)], unique=True)
    await db.users.create_index("qr_code", unique=True, sparse=True)
    await db.webauthn_challenges.create_index("expires_at", expireAfterSeconds=0)
    await db.segnalazioni.create_index("expires_at", expireAfterSeconds=0)
    await db.reminder_claims.create_index("key", unique=True)
    await db.reminder_claims.create_index("expires_at", expireAfterSeconds=0)
    await db.email_fallite.create_index("expires_at", expireAfterSeconds=0)  # righe delle email non partite: 7 giorni
    await db.email_fallite.create_index("at")
    await db.users.create_index("webauthn_credentials.credential_id", sparse=True)
    await db.users.create_index("reset_token", sparse=True)
    await db.users.create_index("email_confirm_token_hash", sparse=True)
    await db.waitlist.create_index("email", unique=True)
    await db.waitlist.create_index("id", unique=True)
    await db.waitlist.create_index("confirm_token_hash", sparse=True)
    await db.ci_pensiamo_noi_link.create_index("token_hash")
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
    # Notifiche push all'admin: indici e chiavi VAPID (generate al primo avvio se non sono su Render).
    try:
        await db.config_push.create_index("key", unique=True)
        await db.admin_push_iscrizioni.create_index("endpoint", unique=True)
        await db.admin_push_iscrizioni.create_index("user_id")
        # Commercianti e clienti (usate solo con PUSH_UTENTI_ENABLED acceso)
        await db.push_iscrizioni.create_index("endpoint", unique=True)
        await db.push_iscrizioni.create_index("user_id")
        await db.push_coda.create_index("user_id")
        await db.push_inviati.create_index("chiave", unique=True)
        await db.push_inviati.create_index("expires_at", expireAfterSeconds=0)
        chiavi = await _chiavi_vapid()
        logging.info(f"[push-admin] chiavi VAPID pronte (origine: {chiavi['origine']})")
    except Exception as e:
        logging.error(f"[push-admin] preparazione fallita: {type(e).__name__}")
    # Migrazione sicura: chi era già iscritto è confermato (nessun utente esistente resta bloccato).
    # Idempotente; non tocca chi ha già il campo (anche i nuovi non confermati).
    try:
        n = await _migra_conferma_email()
        if n:
            logging.info(f"[conferma-email] account già esistenti segnati come confermati: {n}")
    except Exception as e:
        logging.error(f"[conferma-email] migrazione fallita: {e}")
    try:
        esito = await _run_unconfirmed_cleanup()
        if esito.get("deleted"):
            logging.info(f"[conferma-email] account non confermati cancellati all'avvio: {esito['deleted']}")
    except Exception as e:
        logging.error(f"[conferma-email] pulizia all'avvio fallita: {e}")
    try:
        esito = await _run_waitlist_cleanup()
        if esito.get("deleted"):
            logging.info(f"[lista-attesa] iscrizioni non confermate cancellate all'avvio: {esito['deleted']}")
    except Exception as e:
        logging.error(f"[lista-attesa] pulizia all'avvio fallita: {e}")
    try:
        esito = await _run_waitlist_retention()
        if esito.get("deleted"):
            logging.info(f"[lista-attesa] iscrizioni oltre 12 mesi cancellate all'avvio: {esito['deleted']}")
    except Exception as e:
        logging.error(f"[lista-attesa] pulizia 12 mesi all'avvio fallita: {e}")
    try:
        orfani = await _pulisci_dati_orfani()
        if any(orfani.values()):
            logging.info(f"[orfani] puliti all'avvio: {orfani}")
    except Exception as e:
        logging.error(f"[orfani] pulizia fallita: {e}")
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


# ---------- Segnalazioni (contenuti, sconti non rispettati) e reclami dei commercianti ----------
# Canale unico: il pubblico segnala dalla scheda dell'offerta, il commerciante manda i reclami dalla sua area.
# Tutto arriva nell'area admin → Segnalazioni; conferma di ricezione entro 5 giorni lavorativi, esito motivato.
SEGNALAZIONE_TIPI = ("contenuto_illecito", "offerta_non_rispettata", "reclamo_commerciante", "altro")
SEGNALAZIONE_ESITI = ("in_esame", "accolta", "respinta")
SEGNALAZIONE_CONSERVAZIONE = timedelta(days=730)  # 24 mesi, poi si cancella da sola
_segnalazioni_recenti: dict = {}  # solo in memoria: chi ha scritto di recente (nessun IP salvato)


class SegnalazioneIn(BaseModel):
    tipo: Literal["contenuto_illecito", "offerta_non_rispettata", "reclamo_commerciante", "altro"]
    motivo: str = Field(min_length=10, max_length=1500)
    discount_id: Optional[str] = Field(default=None, max_length=64)
    email: Optional[EmailStr] = None


class EsitoSegnalazioneIn(BaseModel):
    stato: Literal["in_esame", "accolta", "respinta"]
    motivazione: Optional[str] = Field(default="", max_length=1500)


def _segnalazione_limite_ok(chiave: str, massimo: int = 5, finestra: int = 3600) -> bool:
    """Al massimo 5 segnalazioni all'ora per chi scrive (chiave anonima, solo in memoria)."""
    adesso = time.time()
    recenti = [t for t in _segnalazioni_recenti.get(chiave, []) if adesso - t < finestra]
    if len(recenti) >= massimo:
        _segnalazioni_recenti[chiave] = recenti
        return False
    recenti.append(adesso)
    _segnalazioni_recenti[chiave] = recenti
    return True


async def _crea_segnalazione(payload: SegnalazioneIn, chiave: str, user: Optional[dict]) -> dict:
    if not _segnalazione_limite_ok(chiave):
        raise HTTPException(429, "Troppe segnalazioni in poco tempo: riprova più tardi")
    merchant_id, riferimento = None, "-"
    if payload.discount_id:
        d = await db.discounts.find_one({"id": payload.discount_id})
        if d:
            merchant_id = d.get("merchant_id")
            m = await db.users.find_one({"id": merchant_id})
            riferimento = f"{d.get('title') or 'offerta'} · {(m or {}).get('shop_name') or '-'}"
    if user and user.get("role") == "merchant":
        merchant_id, riferimento = user["id"], user.get("shop_name") or "negozio"
    adesso = datetime.now(timezone.utc)
    doc = {"id": str(uuid.uuid4()), "tipo": payload.tipo, "motivo": payload.motivo.strip(),
           "discount_id": payload.discount_id, "merchant_id": merchant_id, "riferimento": riferimento,
           "email": (str(payload.email).lower() if payload.email else (user or {}).get("email")),
           "autore_ruolo": (user or {}).get("role"), "stato": "ricevuta", "motivazione": "",
           "creata_il": adesso.isoformat(), "conferma_entro": (adesso + timedelta(days=7)).date().isoformat(),
           "expires_at": adesso + SEGNALAZIONE_CONSERVAZIONE}
    await db.segnalazioni.insert_one(dict(doc))
    if _admin_notify_to():
        _email_in_background(send_admin_segnalazione(_admin_notify_to(), payload.tipo.replace("_", " "),
                                                     doc["motivo"], riferimento, doc["id"]), "segnalazione")
    return {"ok": True, "id": doc["id"], "conferma_entro": doc["conferma_entro"]}


@api.post("/segnalazioni")
async def invia_segnalazione(payload: SegnalazioneIn, request: Request):
    """Segnalazione pubblica (anche senza account). Nessun IP salvato."""
    if payload.tipo == "reclamo_commerciante":
        raise HTTPException(400, "I reclami dei commercianti si inviano dalla loro area")
    # Dietro il proxy di Render request.client.host è il proxy (uguale per tutti): si usa l'IP inoltrato.
    chiave = hashlib.sha256(_ip_richiesta(request).encode()).hexdigest()[:16]
    return await _crea_segnalazione(payload, chiave, await _optional_user(request))


@api.post("/merchants/me/reclami")
async def invia_reclamo(payload: SegnalazioneIn, user: dict = Depends(require_merchant)):
    """Reclamo del commerciante (sospensione, rimozione di un'offerta, altro)."""
    payload = payload.model_copy(update={"tipo": "reclamo_commerciante"})
    return await _crea_segnalazione(payload, "m:" + user["id"], user)


@api.get("/admin/segnalazioni")
async def admin_segnalazioni(user: dict = Depends(require_admin_master)):
    out = []
    async for s in db.segnalazioni.find().sort("creata_il", -1).limit(500):
        s.pop("_id", None)
        s.pop("expires_at", None)
        out.append(s)
    return {"segnalazioni": out, "da_gestire": sum(1 for s in out if s["stato"] in ("ricevuta", "in_esame"))}


@api.post("/admin/segnalazioni/{sid}/esito")
async def admin_esito_segnalazione(sid: str, payload: EsitoSegnalazioneIn, user: dict = Depends(require_admin_master)):
    """Esito motivato (obbligatorio per «accolta» e «respinta»); se c'è un'email, la persona lo riceve."""
    s = await db.segnalazioni.find_one({"id": sid})
    if not s:
        raise HTTPException(404, "Segnalazione non trovata")
    motivazione = (payload.motivazione or "").strip()
    if payload.stato in ("accolta", "respinta") and len(motivazione) < 10:
        raise HTTPException(422, "Scrivi la motivazione (almeno 10 caratteri)")
    await db.segnalazioni.update_one({"id": sid}, {"$set": {
        "stato": payload.stato, "motivazione": motivazione, "esaminata_il": datetime.now(timezone.utc).isoformat()}})
    if payload.stato in ("accolta", "respinta") and s.get("email"):
        _email_in_background(send_esito_segnalazione(s["email"], payload.stato, motivazione), "esito-segnalazione")
    return {"ok": True}


# ---------- Admin: elenco ed eliminazione dei clienti (richieste di cancellazione, pulizie) ----------
@api.get("/admin/clients")
async def admin_list_clients(user: dict = Depends(require_admin_master)):
    out = []
    async for c in db.users.find({"role": "client"}, {"_id": 0, "id": 1, "name": 1, "email": 1, "created_at": 1}).sort("created_at", -1).limit(1000):
        out.append(c)
    return {"clients": out}


@api.delete("/admin/clients/{client_id}")
async def admin_delete_client(client_id: str, user: dict = Depends(require_admin_master)):
    c = await db.users.find_one({"id": client_id, "role": "client"})
    if not c:
        raise HTTPException(404, "Cliente non trovato")
    await _erase_user_data(c)
    await db.users.delete_one({"id": client_id, "role": "client"})
    return {"ok": True}


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
        # Solo admin: nome e cognome completi (il modello utente ha un unico campo `name`).
        u = await db.users.find_one({"id": f.get("user_id")}, {"_id": 0, "name": 1})
        f["name"] = (u or {}).get("name") or ""
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
        # Solo admin: nome e cognome completi del cliente (non salvati nel registro, letti al momento).
        s["client_name"] = ""
        s["client_email"] = ""
        if s.get("user_id"):
            u = await db.users.find_one({"id": s["user_id"]}, {"_id": 0, "name": 1, "email": 1})
            if u:
                s["client_name"] = u.get("name") or ""
                s["client_email"] = u.get("email") or ""
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


async def _check_resend():
    """Controllo Resend per il widget Server Health. Mai restituire né registrare la chiave.
    Una chiave «solo invio» (restricted_api_key) riceve 401 su /domains ma l'invio funziona."""
    import time as _t
    import email_service as _es
    if not _es._configured:
        return {"ok": False, "error": "non configurato", "warning": True}
    t0 = _t.time()
    try:
        async with httpx.AsyncClient(timeout=6) as c:
            r = await c.get("https://api.resend.com/domains",
                            headers={"Authorization": f"Bearer {_es.RESEND_API_KEY}"})
        ms = round((_t.time() - t0) * 1000)
        if r.status_code == 200:
            return {"ok": True, "ms": ms}
        if r.status_code == 401:
            try:
                body = r.json()
            except Exception:
                body = None
            if isinstance(body, dict):
                testo = f"{body.get('name', '')} {body.get('message', '')}".lower()
                if "restricted_api_key" in testo or "restricted" in testo:
                    return {"ok": True, "ms": ms, "note": "chiave solo invio"}
        if r.status_code in (401, 403):
            return {"ok": False, "error": "chiave rifiutata"}
        return {"ok": False, "error": f"HTTP {r.status_code}"}
    except Exception as e:
        return {"ok": False, "error": type(e).__name__}


@api.get("/admin/health")
async def admin_health(user: dict = Depends(require_admin_master)):
    """Stato di salute dei servizi critici (DB, Stripe, PayPal, Resend, LocationIQ)."""
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
    async def check_email_fallite():
        try:
            return await _conteggio_email_fallite()
        except Exception as e:
            return {"ok": False, "error": type(e).__name__}
    results = await asyncio.gather(check_db(), check_stripe(), check_paypal(), _check_resend(), _locationiq_prova(),
                                   check_email_fallite())
    return {
        "db": results[0],
        "stripe": results[1],
        "paypal": results[2],
        "resend": results[3],
        "locationiq": results[4],
        "email_fallite": results[5],
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


@api.api_route("/", methods=["GET", "HEAD"])
async def root():
    # HEAD serve ai controlli online (UptimeRobot gratuito usa HEAD, non GET)
    return {"message": "Sconti Roma API", "status": "ok", "version": APP_VERSION}


@api.api_route("/salute-db", methods=["GET", "HEAD"])
async def salute_db():
    # Controllo online del database (UptimeRobot, GET o HEAD): 200 se MongoDB risponde, 503 se no.
    # Non legge né restituisce dati.
    try:
        await db.command("ping")
    except Exception:
        return JSONResponse(status_code=503, content={"database": "non raggiungibile"})
    return {"database": "ok"}


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
    discounts, next_discounts, archive, conferme = [], [], [], []
    if user.get("role") == "merchant":
        conferme = await db.conferme_offerta.find({"merchant_id": uid}, {"_id": 0}).to_list(length=None)
        discounts =await db.discounts.find({"merchant_id": uid}, {"_id": 0}).to_list(length=None)
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
        "merchant_offer_confirmations": conferme,
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
                 db.app_feedback, db.webauthn_challenges, db.avvisi_preferiti,
                 db.push_iscrizioni, db.push_coda, db.push_inviati):
        await coll.delete_many({"user_id": uid})
    if user.get("email"):
        await db.login_guard.delete_many({"key": _login_guard_key(user["email"].strip().lower())})

    # 3. Se merchant: offerte (attuale, mese dopo, archivio) e recensioni ricevute
    if user.get("role") == "merchant":
        for coll in (db.discounts, db.next_discounts, db.discounts_archive, db.reviews,
                     db.conferme_offerta, db.ci_pensiamo_noi_link):
            await coll.delete_many({"merchant_id": uid})
        await db.avvisi_preferiti.delete_many({"merchant_id": uid})
        await db.push_coda.delete_many({"merchant_id": uid})
        await db.scansioni_locandina.delete_many({"merchant_id": uid})
        # Sconti usati e scansioni QR fatti dai clienti presso questo negozio: senza il negozio
        # restavano orfani e continuavano a contare nelle statistiche dell'admin.
        await db.redemptions.delete_many({"merchant_id": uid})
        await db.qr_scans.delete_many({"merchant_id": uid})
        await db.users.update_many({"preferiti": uid}, {"$pull": {"preferiti": uid}})


async def _pulisci_dati_orfani() -> dict:
    """Toglie sconti usati e scansioni QR che puntano a un negozio che non esiste più
    (rimasti da prima della correzione di _erase_user_data). Idempotente."""
    negozi = {m["id"] async for m in db.users.find({"role": "merchant"}, {"id": 1})}
    esito = {}
    for nome, coll in (("redemptions", db.redemptions), ("qr_scans", db.qr_scans)):
        orfani = [x["_id"] async for x in coll.find({"merchant_id": {"$nin": list(negozi), "$ne": None}}, {"_id": 1})]
        if orfani:
            await coll.delete_many({"_id": {"$in": orfani}})
        esito[nome] = len(orfani)
    return esito


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
    # Solo un conteggio per l'admin: nessun nome, email o identificativo della persona.
    await db.cancellazioni_account.insert_one({"ruolo": user.get("role"), "creata_il": datetime.now(timezone.utc).isoformat()})
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
    PRICE = PREZZO_CLIENTE_EUR
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
    negozi = {m["id"]: m for m in await db.users.find({"role": "merchant"}, {"_id": 0, "id": 1, "first_published_at": 1}).to_list(None)}
    for mid, nome in nomi.items():
        raw = piani.get(mid) or {}
        # Fine prova: data scritta a mano dall'admin; altrimenti calcolata dalla prima pubblicazione
        # (stessa regola dei promemoria); altrimenti la data predefinita dell'ambiente.
        calcolata = pp.trial_end_date(await _prima_pubblicazione(negozi[mid])) if mid in negozi else None
        piano = {
            "prova_fino_al": raw.get("prova_fino_al") or (calcolata.isoformat() if calcolata else None) or (prova_def.isoformat() if prova_def else None),
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
# ---------- Prova gratuita e pagamenti mensili dei negozi (registro MANUALE, nessun addebito) ----------
class ImpostazioniPagamentiIn(BaseModel):
    giorni_tolleranza: int = Field(ge=0, le=31)


@api.get("/admin/impostazioni-pagamenti")
async def get_impostazioni_pagamenti(user: dict = Depends(require_admin_master)):
    return {"giorni_tolleranza": await _tolleranza_giorni(), "predefinito": pp.TOLLERANZA_PREDEFINITA,
            "interruttore_acceso": merchant_payment_required()}


@api.put("/admin/impostazioni-pagamenti")
async def put_impostazioni_pagamenti(payload: ImpostazioniPagamentiIn, user: dict = Depends(require_admin_master)):
    await db.settings.update_one({"key": "giorni_tolleranza_pagamento"},
                                 {"$set": {"value": payload.giorni_tolleranza}}, upsert=True)
    return {"giorni_tolleranza": payload.giorni_tolleranza}


class PagatoIn(BaseModel):
    paid_at: Optional[str] = None  # data/ora ISO; vuoto = adesso
    note: Optional[str] = Field(default=None, max_length=300)


def _controlla_mese(month_key: str) -> str:
    if not re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", month_key or ""):
        raise HTTPException(400, "Mese non valido: usa AAAA-MM")
    return month_key


@api.get("/admin/pagamenti-mensili/{merchant_id}")
async def mp_elenco(merchant_id: str, user: dict = Depends(require_admin_master)):
    docs = await db.merchant_payments.find({"merchant_id": merchant_id}).sort("month_key", -1).to_list(200)
    return {"pagamenti": [{k: v for k, v in d.items() if k != "_id"} for d in docs]}


@api.put("/admin/pagamenti-mensili/{merchant_id}/{month_key}")
async def mp_segna_pagato(merchant_id: str, month_key: str, payload: Optional[PagatoIn] = None,
                          user: dict = Depends(require_admin_master)):
    month_key = _controlla_mese(month_key)
    if not await db.users.find_one({"id": merchant_id, "role": "merchant"}):
        raise HTTPException(404, "Negozio non trovato")
    payload = payload or PagatoIn()
    if payload.paid_at and pp.a_data_roma(payload.paid_at) is None:
        raise HTTPException(400, "Data non valida")
    doc = {"merchant_id": merchant_id, "month_key": month_key,
           "paid_at": payload.paid_at or datetime.now(timezone.utc).isoformat(), "note": payload.note or ""}
    await db.merchant_payments.update_one({"merchant_id": merchant_id, "month_key": month_key},
                                          {"$set": doc}, upsert=True)
    return {"pagamento": doc}


@api.delete("/admin/pagamenti-mensili/{merchant_id}/{month_key}")
async def mp_togli_pagato(merchant_id: str, month_key: str, user: dict = Depends(require_admin_master)):
    month_key = _controlla_mese(month_key)
    await db.merchant_payments.delete_one({"merchant_id": merchant_id, "month_key": month_key})
    return {"ok": True}


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


@app.middleware("http")
async def intestazioni_sicurezza(request: Request, call_next):
    """Intestazioni di sicurezza su ogni risposta del server: il browser non indovina il tipo dei file
    (nosniff), nessuna pagina del server può essere incorniciata in un altro sito (clickjacking) e
    l'indirizzo completo non viene passato ai siti esterni. Non cambiano il funzionamento del sito."""
    risposta = await call_next(request)
    risposta.headers.setdefault("X-Content-Type-Options", "nosniff")
    risposta.headers.setdefault("X-Frame-Options", "DENY")
    risposta.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    return risposta


app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
