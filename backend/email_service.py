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
REPLY_TO_EMAIL = os.environ.get("REPLY_TO_EMAIL", "")
APP_URL = (os.environ.get("FRONTEND_URL") or os.environ.get("APP_URL") or "http://localhost:3000").rstrip("/")

_configured = bool(RESEND_API_KEY) and not RESEND_API_KEY.startswith("re_placeholder")
if _configured:
    resend.api_key = RESEND_API_KEY


async def _send(to: str, subject: str, html: str) -> Optional[str]:
    if not _configured:
        log.info(f"[email:mock] to={to} subject={subject!r} (RESEND_API_KEY not set)")
        return None
    try:
        params = {"from": SENDER_EMAIL, "to": [to], "subject": subject, "html": html}
        if REPLY_TO_EMAIL:
            params["reply_to"] = [REPLY_TO_EMAIL]
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


async def send_master_reset(to: str, token: str) -> Optional[str]:
    link = f"{APP_URL}/admin/master-reset?token={token}"
    inner = f"""
<h2 style="margin:0 0 12px;font-family:Georgia,serif;font-size:24px;color:#fff">Reset Master Password</h2>
<p style="margin:0 0 16px;color:#d4d4d8">Ciao Admin,</p>
<p style="margin:0 0 24px;color:#d4d4d8">È stata richiesta la reimpostazione della <strong style="color:#00E5FF">Master Password</strong> dell'area amministrativa di Sconti Roma, verificata tramite Recovery ID. Clicca il pulsante qui sotto (link valido per 30 minuti):</p>
<div style="text-align:center;margin:24px 0">
<a href="{link}" style="display:inline-block;padding:14px 32px;background:#FF2E93;color:#fff;text-decoration:none;font-weight:700;border-radius:9999px">Imposta nuova Master Password</a>
</div>
<p style="margin:16px 0 0;color:#a1a1aa;font-size:13px">Se non sei stato tu, ignora questa mail e valuta di rigenerare il Recovery ID dalla dashboard admin.</p>
<p style="margin:24px 0 0;color:#71717a;font-size:12px;word-break:break-all">Link diretto: {link}</p>
"""
    return await _send(to, "Reset Master Password — Sconti Roma", _shell(inner))


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


async def send_pin_reset_code(to: str, name: str, code: str) -> Optional[str]:
    """Email con codice OTP a 6 cifre per resettare il PIN. Valido 10 minuti."""
    safe_name = (name or "").strip() or "utente"
    inner = f"""
<h2 style="margin:0 0 12px;font-family:Georgia,serif;font-size:24px;color:#fff">Recupero PIN</h2>
<p style="margin:0 0 16px;color:#d4d4d8">Ciao {safe_name},</p>
<p style="margin:0 0 20px;color:#d4d4d8">Hai richiesto di reimpostare il PIN. Usa questo codice a 6 cifre per proseguire (valido 10 minuti):</p>
<div style="text-align:center;margin:28px 0">
  <div style="display:inline-block;padding:20px 36px;background:#0b0b0f;border:2px solid #FF6B35;border-radius:14px;font-family:'Courier New',monospace;font-size:38px;letter-spacing:12px;color:#FF6B35;font-weight:700">{code}</div>
</div>
<p style="margin:20px 0 0;color:#a1a1aa;font-size:13px">Se non sei stato tu a richiederlo, ignora questa email — il codice scadrà da solo.</p>
"""
    return await _send(to, "Il tuo codice per reimpostare il PIN — Sconti Roma", _shell(inner, "Sconti Roma"))



async def send_payment_failed_immediate(
    to: str,
    name: str,
    grace_expires_iso: str,
    provider: str = "stripe",
) -> Optional[str]:
    """Email inviata IMMEDIATAMENTE quando il pagamento del rinnovo fallisce.
    Informa l'utente che l'abbonamento è sospeso ma può ancora essere salvato
    entro 7 giorni aggiornando il metodo di pagamento.
    """
    safe_name = (name or "").strip() or "abbonato"
    try:
        from datetime import datetime as _dt
        dt = _dt.fromisoformat(grace_expires_iso.replace("Z", "+00:00"))
        it_months = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
                     "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"]
        deadline_human = f"{dt.day} {it_months[dt.month - 1]} {dt.year}"
    except Exception:
        deadline_human = grace_expires_iso[:10]

    provider_label = {"stripe": "carta di credito", "paypal": "PayPal"}.get(provider, "metodo di pagamento")

    inner = f"""
<h2 style="margin:0 0 12px;font-family:Georgia,serif;font-size:24px;color:#fff">⚠️ Problema con il tuo pagamento</h2>
<p style="margin:0 0 16px;color:#d4d4d8;font-size:16px">Ciao {safe_name},</p>
<p style="margin:0 0 16px;color:#d4d4d8;font-size:15px;line-height:1.6">
  Non siamo riusciti ad addebitare il rinnovo mensile del tuo abbonamento a <strong style="color:#fff">Sconti Roma</strong> tramite {provider_label}.
</p>
<p style="margin:0 0 20px;color:#d4d4d8;font-size:15px;line-height:1.6">
  Il tuo abbonamento è stato <strong style="color:#f59e0b">temporaneamente sospeso</strong> — al momento non puoi riscattare nuovi sconti.
</p>

<div style="background:#1a1a20;border:1px solid #f59e0b;border-radius:10px;padding:16px 20px;margin:20px 0">
  <div style="color:#f59e0b;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Hai 7 giorni per salvare il tuo abbonamento</div>
  <div style="color:#f4f4f5;font-size:15px;line-height:1.5">
    Se aggiorni il tuo metodo di pagamento entro il <strong>{deadline_human}</strong>, il rinnovo verrà ritentato automaticamente e non perderai nulla.
  </div>
</div>

<div style="text-align:center;margin:28px 0">
  <a href="{APP_URL}/account" style="display:inline-block;padding:14px 36px;background:linear-gradient(90deg,#FF2E93,#7C3AED);color:#fff;text-decoration:none;border-radius:999px;font-weight:600;font-size:15px">
    Aggiorna metodo di pagamento →
  </a>
</div>

<p style="margin:24px 0 0;color:#a1a1aa;font-size:13px;line-height:1.5">
  Se non aggiorni il pagamento entro il {deadline_human}, il tuo abbonamento verrà annullato definitivamente e per tornare a usare Sconti Roma dovrai iscriverti di nuovo.
</p>
<p style="margin:12px 0 0;color:#71717a;font-size:11px">
  Serve aiuto? Scrivici a <a href="mailto:info@scontiroma.it" style="color:#FF2E93">info@scontiroma.it</a>.
</p>
"""
    return await _send(to, "⚠️ Problema con il tuo pagamento — Sconti Roma", _shell(inner, "Pagamento fallito"))


async def send_grace_period_reminder(
    to: str,
    name: str,
    grace_expires_iso: str,
    days_left: int,
) -> Optional[str]:
    """Promemoria inviato al giorno 5 della grace period (2 giorni rimasti).
    Ultimo push per convincere l'utente ad aggiornare il metodo di pagamento
    prima della cancellazione automatica.
    """
    safe_name = (name or "").strip() or "abbonato"
    try:
        from datetime import datetime as _dt
        dt = _dt.fromisoformat(grace_expires_iso.replace("Z", "+00:00"))
        it_months = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
                     "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"]
        deadline_human = f"{dt.day} {it_months[dt.month - 1]} {dt.year}"
    except Exception:
        deadline_human = grace_expires_iso[:10]

    days_label = "giorno" if days_left == 1 else "giorni"

    inner = f"""
<h2 style="margin:0 0 12px;font-family:Georgia,serif;font-size:24px;color:#fff">⏰ Ultimi {days_left} {days_label} per il tuo abbonamento</h2>
<p style="margin:0 0 16px;color:#d4d4d8;font-size:16px">Ciao {safe_name},</p>
<p style="margin:0 0 16px;color:#d4d4d8;font-size:15px;line-height:1.6">
  Il tuo abbonamento a <strong style="color:#fff">Sconti Roma</strong> è ancora sospeso perché non siamo riusciti ad addebitare il rinnovo.
</p>

<div style="background:#1a1a20;border:2px solid #ef4444;border-radius:10px;padding:20px;margin:24px 0;text-align:center">
  <div style="color:#ef4444;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px">Scadenza</div>
  <div style="color:#fff;font-family:Georgia,serif;font-size:22px;font-weight:700">{deadline_human}</div>
  <div style="color:#fecaca;font-size:14px;margin-top:8px">
    Dopo questa data l'abbonamento sarà <strong>annullato definitivamente</strong>.
  </div>
</div>

<p style="margin:0 0 20px;color:#d4d4d8;font-size:15px;line-height:1.6">
  Ti bastano <strong>30 secondi</strong> per aggiornare il metodo di pagamento e non perdere l'accesso agli sconti dei commercianti del tuo quartiere.
</p>

<div style="text-align:center;margin:28px 0">
  <a href="{APP_URL}/account" style="display:inline-block;padding:16px 40px;background:linear-gradient(90deg,#ef4444,#FF2E93);color:#fff;text-decoration:none;border-radius:999px;font-weight:700;font-size:16px;box-shadow:0 4px 16px rgba(239,68,68,0.4)">
    Salva il mio abbonamento →
  </a>
</div>

<p style="margin:24px 0 0;color:#71717a;font-size:12px;line-height:1.5;text-align:center">
  Se non vuoi più rinnovare, non devi fare nulla: l'abbonamento decadrà automaticamente il {deadline_human}.
</p>
"""
    return await _send(to, f"⏰ Ultimi {days_left} {days_label} per salvare il tuo abbonamento", _shell(inner, "Promemoria"))


async def send_subscription_cancelled(
    to: str,
    name: str,
) -> Optional[str]:
    """Email finale inviata quando la grace period scade e l'abbonamento
    viene cancellato definitivamente. Include CTA per riabbonarsi.
    """
    safe_name = (name or "").strip() or "abbonato"
    inner = f"""
<h2 style="margin:0 0 12px;font-family:Georgia,serif;font-size:24px;color:#fff">Il tuo abbonamento è stato annullato</h2>
<p style="margin:0 0 16px;color:#d4d4d8;font-size:16px">Ciao {safe_name},</p>
<p style="margin:0 0 16px;color:#d4d4d8;font-size:15px;line-height:1.6">
  Non siamo riusciti a rinnovare il tuo abbonamento a <strong style="color:#fff">Sconti Roma</strong> nei 7 giorni di tolleranza. Come da nostri termini, l'abbonamento è stato <strong>annullato</strong>.
</p>

<div style="background:#1a1a20;border:1px solid #27272a;border-radius:10px;padding:16px 20px;margin:20px 0">
  <div style="color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Cosa succede ora?</div>
  <ul style="margin:0;padding-left:20px;color:#d4d4d8;font-size:14px;line-height:1.7">
    <li>Non ti verrà più addebitato nulla.</li>
    <li>Non puoi più riscattare sconti dei commercianti.</li>
    <li>I tuoi dati e la cronologia sconti restano salvati.</li>
  </ul>
</div>

<p style="margin:0 0 20px;color:#d4d4d8;font-size:15px;line-height:1.6">
  Cambiato idea? Puoi <strong>riattivare il tuo abbonamento</strong> in qualsiasi momento — solo 3€/mese e torni subito a risparmiare sui commercianti del tuo quartiere.
</p>

<div style="text-align:center;margin:28px 0">
  <a href="{APP_URL}/subscription" style="display:inline-block;padding:14px 36px;background:linear-gradient(90deg,#FF2E93,#7C3AED);color:#fff;text-decoration:none;border-radius:999px;font-weight:600;font-size:15px">
    Riattiva l'abbonamento →
  </a>
</div>

<p style="margin:24px 0 0;color:#71717a;font-size:12px;text-align:center;line-height:1.5">
  Ci dispiace vederti andare. Se c'è qualcosa che possiamo fare meglio, scrivici a <a href="mailto:info@scontiroma.it" style="color:#FF2E93">info@scontiroma.it</a> — ogni feedback conta.
</p>
"""
    return await _send(to, "Il tuo abbonamento Sconti Roma è stato annullato", _shell(inner, "Abbonamento annullato"))


async def send_renewal_receipt(
    to: str,
    name: str,
    next_end_date_iso: str,
    price_eur: float = 3.00,
    provider: str = "stripe",
) -> Optional[str]:
    """Email di ricevuta mensile inviata quando l'abbonamento si rinnova con successo.
    Chiamata dai webhook Stripe (invoice.payment_succeeded) e PayPal (PAYMENT.SALE.COMPLETED).
    """
    safe_name = (name or "").strip() or "abbonato"
    # Formatta la nuova data di scadenza in italiano leggibile
    try:
        from datetime import datetime as _dt
        dt = _dt.fromisoformat(next_end_date_iso.replace("Z", "+00:00"))
        it_months = [
            "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
            "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
        ]
        next_end_human = f"{dt.day} {it_months[dt.month - 1]} {dt.year}"
    except Exception:
        next_end_human = next_end_date_iso[:10]

    provider_label = {"stripe": "Carta di credito", "paypal": "PayPal"}.get(provider, "Metodo di pagamento")

    inner = f"""
<h2 style="margin:0 0 12px;font-family:Georgia,serif;font-size:26px;color:#fff">
  🎉 Rinnovo confermato!
</h2>
<p style="margin:0 0 16px;color:#d4d4d8;font-size:16px">Ciao {safe_name},</p>
<p style="margin:0 0 20px;color:#d4d4d8;font-size:15px;line-height:1.6">
  Il tuo abbonamento a <strong style="color:#fff">Sconti Roma</strong> si è rinnovato con successo.
  Puoi continuare a usare tutti gli sconti dei nostri commercianti per un altro mese intero!
</p>

<!-- Riepilogo pagamento -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0b0b0f;border:1px solid #27272a;border-radius:12px;margin:24px 0">
  <tr>
    <td style="padding:20px">
      <div style="display:flex;justify-content:space-between;margin-bottom:12px">
        <span style="color:#71717a;font-size:13px;text-transform:uppercase;letter-spacing:1px">Importo</span>
      </div>
      <div style="font-family:Georgia,serif;font-size:32px;color:#FF2E93;font-weight:700;margin-bottom:20px">€{price_eur:.2f}</div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:6px 0;color:#71717a;font-size:13px">Metodo:</td>
          <td style="padding:6px 0;color:#f4f4f5;font-size:13px;text-align:right">{provider_label}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#71717a;font-size:13px">Piano:</td>
          <td style="padding:6px 0;color:#f4f4f5;font-size:13px;text-align:right">Mensile a rinnovo automatico</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#71717a;font-size:13px">Prossimo rinnovo:</td>
          <td style="padding:6px 0;color:#00E5FF;font-size:13px;text-align:right;font-weight:600">{next_end_human}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- CTA -->
<div style="text-align:center;margin:28px 0">
  <a href="{APP_URL}/discounts" style="display:inline-block;padding:14px 36px;background:linear-gradient(90deg,#FF2E93,#7C3AED);color:#fff;text-decoration:none;border-radius:999px;font-weight:600;font-size:15px">
    Scopri i nuovi sconti del mese →
  </a>
</div>

<p style="margin:24px 0 0;color:#a1a1aa;font-size:12px;line-height:1.5">
  Vuoi disdire? Puoi farlo in qualsiasi momento dalla tua area personale
  (<a href="{APP_URL}/account" style="color:#00E5FF">Il tuo account → Gestisci abbonamento</a>).
  Rispettiamo il tuo diritto di recesso — nessuna penale, nessuna trattenuta.
</p>
<p style="margin:12px 0 0;color:#71717a;font-size:11px">
  Questa è una ricevuta di pagamento automatico. Non rispondere a questa email.
  Per assistenza scrivi a <a href="mailto:info@scontiroma.it" style="color:#FF2E93">info@scontiroma.it</a>.
</p>
"""
    return await _send(
        to,
        "Il tuo abbonamento a Sconti Roma si è rinnovato!",
        _shell(inner, "Ricevuta rinnovo"),
    )
