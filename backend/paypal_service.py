"""
PayPal Subscriptions REST API integration (Sandbox/Live).

Doc: https://developer.paypal.com/docs/api/subscriptions/v1/

Espone helper async per:
- OAuth token
- creazione/idempotente di Product + Billing Plan €3/mese
- creazione subscription (frontend usa questo via PayPal Buttons)
- cancel subscription
- verify webhook signature

Se le credenziali non sono configurate le funzioni lanciano `PayPalNotConfigured`,
in modo che l'app degradi in modo pulito (Stripe rimane funzionante).
"""
import os
import logging
from typing import Optional

import httpx

log = logging.getLogger(__name__)

PAYPAL_CLIENT_ID = os.environ.get("PAYPAL_CLIENT_ID", "")
PAYPAL_SECRET = os.environ.get("PAYPAL_SECRET", "")
PAYPAL_MODE = os.environ.get("PAYPAL_MODE", "sandbox")
PAYPAL_WEBHOOK_ID = os.environ.get("PAYPAL_WEBHOOK_ID", "")
PAYPAL_PLAN_ID_ENV = os.environ.get("PAYPAL_PLAN_ID", "")

BASE = "https://api-m.sandbox.paypal.com" if PAYPAL_MODE == "sandbox" else "https://api-m.paypal.com"
PLAN_LOOKUP_NAME = "Sconti Roma Monthly 3EUR"

_cached_plan_id: Optional[str] = PAYPAL_PLAN_ID_ENV or None
# Cache access token 5 min (PayPal tokens live ~9 hours; short cache avoids
# burning auth quota on 30s health polls without risking staleness).
_cached_token: Optional[str] = None
_cached_token_exp: float = 0.0


class PayPalNotConfigured(Exception):
    pass


def _configured() -> bool:
    return bool(PAYPAL_CLIENT_ID) and bool(PAYPAL_SECRET) and not PAYPAL_CLIENT_ID.startswith("paypal_client_id_placeholder")


def _require():
    if not _configured():
        raise PayPalNotConfigured("PAYPAL_CLIENT_ID/PAYPAL_SECRET non configurati")


async def _access_token() -> str:
    global _cached_token, _cached_token_exp
    import time as _t
    if _cached_token and _cached_token_exp > _t.time() + 30:
        return _cached_token
    _require()
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.post(
            f"{BASE}/v1/oauth2/token",
            data={"grant_type": "client_credentials"},
            auth=(PAYPAL_CLIENT_ID, PAYPAL_SECRET),
            headers={"Accept": "application/json"},
        )
        r.raise_for_status()
        j = r.json()
        _cached_token = j["access_token"]
        _cached_token_exp = _t.time() + min(int(j.get("expires_in", 300)), 300)
        return _cached_token


async def _authed_headers() -> dict:
    return {"Authorization": f"Bearer {await _access_token()}", "Content-Type": "application/json"}


async def ensure_plan() -> str:
    """Ritorna un plan_id valido, creando Product + Plan idempotenti se necessario."""
    global _cached_plan_id
    if _cached_plan_id:
        return _cached_plan_id
    _require()
    headers = await _authed_headers()
    async with httpx.AsyncClient(timeout=20) as c:
        # cerca un plan con il nostro nome tra i plans esistenti
        try:
            r = await c.get(f"{BASE}/v1/billing/plans?page_size=20", headers=headers)
            if r.status_code == 200:
                for p in r.json().get("plans", []):
                    if p.get("name") == PLAN_LOOKUP_NAME and p.get("status") == "ACTIVE":
                        _cached_plan_id = p["id"]
                        return _cached_plan_id
        except Exception:
            pass

        # crea Product
        prod = await c.post(
            f"{BASE}/v1/catalogs/products",
            headers=headers,
            json={
                "name": "Sconti Roma Membership",
                "description": "Abbonamento mensile Sconti Roma",
                "type": "SERVICE",
                "category": "SOFTWARE",
            },
        )
        prod.raise_for_status()
        product_id = prod.json()["id"]

        # crea Plan €3/mese
        plan_body = {
            "product_id": product_id,
            "name": PLAN_LOOKUP_NAME,
            "description": "€3 al mese, ricorrente, cancellabile in ogni momento.",
            "billing_cycles": [
                {
                    "frequency": {"interval_unit": "MONTH", "interval_count": 1},
                    "tenure_type": "REGULAR",
                    "sequence": 1,
                    "total_cycles": 0,  # infinito
                    "pricing_scheme": {"fixed_price": {"value": "3.00", "currency_code": "EUR"}},
                }
            ],
            "payment_preferences": {
                "auto_bill_outstanding": True,
                "setup_fee": {"value": "0", "currency_code": "EUR"},
                "setup_fee_failure_action": "CONTINUE",
                "payment_failure_threshold": 3,
            },
        }
        plan = await c.post(f"{BASE}/v1/billing/plans", headers=headers, json=plan_body)
        plan.raise_for_status()
        _cached_plan_id = plan.json()["id"]
        log.info(f"[paypal] created plan {_cached_plan_id}")
        return _cached_plan_id


async def get_subscription(sub_id: str) -> dict:
    _require()
    headers = await _authed_headers()
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get(f"{BASE}/v1/billing/subscriptions/{sub_id}", headers=headers)
        r.raise_for_status()
        return r.json()


async def cancel_subscription(sub_id: str, reason: str = "User cancel"):
    _require()
    headers = await _authed_headers()
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.post(
            f"{BASE}/v1/billing/subscriptions/{sub_id}/cancel",
            headers=headers,
            json={"reason": reason[:127]},
        )
        # 204 = success; 422 se già cancellata
        if r.status_code not in (204, 422):
            log.warning(f"[paypal] cancel {sub_id} -> {r.status_code} {r.text[:200]}")


async def verify_webhook(headers: dict, body_json: dict) -> bool:
    """Verifica firma webhook. In assenza di PAYPAL_WEBHOOK_ID accetta senza verifica (dev)."""
    if not PAYPAL_WEBHOOK_ID:
        return True
    _require()
    payload = {
        "transmission_id": headers.get("paypal-transmission-id"),
        "transmission_time": headers.get("paypal-transmission-time"),
        "cert_url": headers.get("paypal-cert-url"),
        "auth_algo": headers.get("paypal-auth-algo"),
        "transmission_sig": headers.get("paypal-transmission-sig"),
        "webhook_id": PAYPAL_WEBHOOK_ID,
        "webhook_event": body_json,
    }
    h = await _authed_headers()
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.post(f"{BASE}/v1/notifications/verify-webhook-signature", headers=h, json=payload)
        return r.status_code == 200 and r.json().get("verification_status") == "SUCCESS"


def is_configured() -> bool:
    return _configured()
