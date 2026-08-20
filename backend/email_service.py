"""
Resend email service — async wrapper (SDK sync, run in thread).

I template HTML sono inline-CSS friendly (per compatibilità email client).
Se `RESEND_API_KEY` non è configurata o è un placeholder, le send diventano no-op
e loggano soltanto (non blocca il flusso applicativo).
"""
import os
import asyncio
import logging
from typing import Optional

import resend

log = logging.getLogger(__name__)

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
APP_URL = os.environ.get("APP_URL", "http://localhost:3000")

_configured = bool(RESEND_API_KEY) and not RESEND_API_KEY.startswith("re_placeholder")
if _configured:
    resend.api_key = RESEND_API_KEY


async def _send(to: str, subject: str, html: str) -> Optional[str]:
    if not _configured:
        log.info(f"[email:mock] to={to} subject={subject!r} (RESEND_API_KEY not set)")
        return None
    try:
        params = {"from": SENDER_EMAIL, "to": [to], "subject": subject, "html": html}
        res = await asyncio.to_thread(resend.Emails.send, params)
        eid = res.get("id") if isinstance(res, dict) else getattr(res, "id", None)
        log.info(f"[email:sent] to={to} id={eid}")
        return eid
    except Exception as e:
        log.error(f"[email:error] to={to} subject={subject!r} err={e}")
        return None


def _shell(inner: str, title: str = "Sconti Roma") -> str:
    return f"""<!doctype html><html><body style="margin:0;padding:0;background:#0b0b0f;font-family:Inter,Arial,sans-serif;color:#f4f4f5">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0f;padding:32px 0">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#141419;border:1px solid #27272a;border-radius:16px;overflow:hidden">
<tr><td style="padding:24px 32px;background:linear-gradient(90deg,#FF2E93,#7C3AED);color:#fff">
  <div style="font-family:Georgia,serif;font-size:24px;font-weight:700">{title}</div>
</td></tr>
<tr><td style="padding:32px">{inner}</td></tr>
<tr><td style="padding:16px 32px;background:#0b0b0f;color:#71717a;font-size:12px;text-align:center">
  © 2026 Sconti Roma · Made con amore ♡
</td></tr>
</table>
</td></tr></table></body></html>"""


async def send_password_reset(to: str, name: str, token: str) -> Optional[str]:
    link = f"{APP_URL}/reset-password?token={token}"
    inner = f"""
<h2 style="margin:0 0 12px;font-family:Georgia,serif;font-size:24px;color:#fff">Recupera la tua password</h2>
<p style="margin:0 0 16px;color:#d4d4d8">Ciao {name},</p>
<p style="margin:0 0 24px;color:#d4d4d8">Hai richiesto di reimpostare la password del tuo account Sconti Roma. Clicca il pulsante qui sotto (link valido per 1 ora):</p>
<div style="text-align:center;margin:24px 0">
<a href="{link}" style="display:inline-block;padding:14px 32px;background:#FF2E93;color:#fff;text-decoration:none;font-weight:700;border-radius:9999px">Reimposta la password</a>
</div>
<p style="margin:16px 0 0;color:#a1a1aa;font-size:13px">Se non sei stato tu, ignora questa mail. Il link scadrà da solo.</p>
<p style="margin:24px 0 0;color:#71717a;font-size:12px;word-break:break-all">Link diretto: {link}</p>
"""
    return await _send(to, "Reimposta la tua password — Sconti Roma", _shell(inner))


async def send_merchant_approved(to: str, name: str, shop_name: str, discount_title: str) -> Optional[str]:
    inner = f"""
<h2 style="margin:0 0 12px;font-family:Georgia,serif;font-size:24px;color:#fff">Offerta approvata ✓</h2>
<p style="margin:0 0 16px;color:#d4d4d8">Ciao {name},</p>
<p style="margin:0 0 16px;color:#d4d4d8">La tua offerta <strong style="color:#00E5FF">"{discount_title}"</strong> per <strong>{shop_name}</strong> è stata <strong style="color:#22c55e">approvata</strong> ed è ora visibile a tutti gli abbonati Sconti Roma.</p>
<p style="margin:0 0 24px;color:#d4d4d8">Ricorda che potrai modificarla il 1° del mese prossimo.</p>
<div style="text-align:center;margin:24px 0">
<a href="{APP_URL}/merchant/dashboard" style="display:inline-block;padding:12px 28px;background:#00E5FF;color:#0b0b0f;text-decoration:none;font-weight:700;border-radius:9999px">Vai alla dashboard</a>
</div>
"""
    return await _send(to, "Offerta approvata — Sconti Roma", _shell(inner))


async def send_merchant_rejected(to: str, name: str, shop_name: str, discount_title: str, reason: str) -> Optional[str]:
    reason_html = f'<div style="background:#1a1a20;border:1px solid #ef4444;border-radius:8px;padding:12px 16px;margin:12px 0;color:#fecaca"><strong>Motivo:</strong> {reason}</div>' if reason else ""
    inner = f"""
<h2 style="margin:0 0 12px;font-family:Georgia,serif;font-size:24px;color:#fff">Offerta rifiutata</h2>
<p style="margin:0 0 16px;color:#d4d4d8">Ciao {name},</p>
<p style="margin:0 0 8px;color:#d4d4d8">La tua offerta <strong>"{discount_title}"</strong> per <strong>{shop_name}</strong> non è stata approvata.</p>
{reason_html}
<p style="margin:16px 0 24px;color:#d4d4d8">Puoi modificarla e reinviarla in revisione dalla dashboard.</p>
<div style="text-align:center;margin:24px 0">
<a href="{APP_URL}/merchant/discount" style="display:inline-block;padding:12px 28px;background:#FF2E93;color:#fff;text-decoration:none;font-weight:700;border-radius:9999px">Modifica offerta</a>
</div>
"""
    return await _send(to, "Offerta da rivedere — Sconti Roma", _shell(inner))


async def send_monthly_discounts_notification(to: str, name: str, cta_url: Optional[str] = None) -> Optional[str]:
    """Email mensile agli abbonati per annunciare i nuovi sconti del mese.
    Usa un template bulletproof (table-based) compatibile con Gmail / Outlook / Apple Mail,
    con bottone arancione (#FF6B35) grande e cliccabile su tutti i client.
    """
    safe_name = (name or "").strip() or "abbonato"
    link = cta_url or f"{APP_URL}/discounts"
    html = f"""<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sconti Quartiere</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111">
<!-- preheader nascosto -->
<div style="display:none;max-height:0;overflow:hidden;color:transparent">Il tuo abbonamento è attivo — scopri le nuove offerte del mese!</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;padding:32px 0">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06)">

        <!-- header -->
        <tr>
          <td align="center" style="padding:28px 32px;background:linear-gradient(90deg,#FF6B35,#FF2E93);color:#ffffff">
            <div style="font-family:Georgia,serif;font-size:26px;font-weight:700;letter-spacing:0.3px">Sconti Quartiere</div>
            <div style="margin-top:6px;font-size:13px;opacity:0.9">🛍️ Il tuo abbonamento è attivo!</div>
          </td>
        </tr>

        <!-- body -->
        <tr>
          <td style="padding:36px 40px 8px 40px">
            <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:24px;color:#111">Ciao {safe_name},</h1>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#333">
              Il tuo abbonamento mensile da <strong>3€</strong> è attivo e si è rinnovato con successo!
            </p>
            <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#333">
              I commercianti del tuo quartiere hanno appena inserito le nuove <strong>offerte esclusive</strong> per questo mese. Non perdere l'occasione di risparmiare sui tuoi acquisti quotidiani e di sostenere le attività locali della nostra comunità.
            </p>
          </td>
        </tr>

        <!-- BUTTON (bulletproof: VML + <a> fallback) -->
        <tr>
          <td align="center" style="padding:8px 40px 36px 40px">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{link}" style="height:60px;v-text-anchor:middle;width:460px;" arcsize="18%" strokecolor="#FF6B35" fillcolor="#FF6B35">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">VAI SUBITO A VEDERE I NUOVI SCONTI DI QUESTO MESE</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-- -->
            <a href="{link}"
               style="display:inline-block;background:#FF6B35;color:#ffffff !important;text-decoration:none;font-weight:800;font-size:15px;line-height:1.3;letter-spacing:0.4px;padding:18px 28px;border-radius:12px;box-shadow:0 6px 16px rgba(255,107,53,0.35);text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
               target="_blank" rel="noopener">
              VAI SUBITO A VEDERE I NUOVI SCONTI DI QUESTO MESE
            </a>
            <!--<![endif]-->
          </td>
        </tr>

        <!-- footer -->
        <tr>
          <td style="padding:24px 40px 32px 40px;background:#fafafa;border-top:1px solid #e5e5e5">
            <p style="margin:0;font-size:12px;line-height:1.6;color:#71717a;text-align:center">
              Ricevi questa email perché sei un abbonato attivo di <strong>Sconti Quartiere</strong>. Puoi gestire le tue preferenze o disdire il rinnovo in qualsiasi momento dalla sezione <strong>Profilo</strong> dentro l'app.
            </p>
          </td>
        </tr>
      </table>
      <div style="margin-top:16px;font-size:11px;color:#a1a1aa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
        © 2026 Sconti Quartiere · Roma
      </div>
    </td>
  </tr>
</table>
</body></html>"""
    subject = "🛍️ Il tuo abbonamento è attivo! Scopri i nuovi sconti di questo mese"
    return await _send(to, subject, html)
