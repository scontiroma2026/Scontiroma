# PRD — Sconti Roma

## Original Problem Statement
Vorrei creare un app di sconti. Raggruppare uno prodotto scontato per ogni esercente di una zona a Roma, con abbonamento mensile a pochi euro per usufruire degli sconti. Il concetto è vendere tanti sconti a pochi euro.

## Architecture
- **Frontend**: React (CRA) + Tailwind + shadcn/ui + Fraunces (serif) + Inter (sans). Custom "Elegante Italiano" palette: cream/terracotta/gold/espresso.
- **Backend**: FastAPI + Motor (Mongo). All routes prefixed `/api`.
- **Auth**: Custom JWT (bcrypt password_hash), access token via httpOnly cookie + Bearer localStorage fallback.
- **DB**: MongoDB collections: `users`, `discounts`, `subscriptions`, `redemptions`.

## User Personas
1. **Cliente** — abbonato mensile che sfoglia sconti a Roma e riscatta con QR code.
2. **Commerciante** — pubblica UN singolo sconto per la sua attività e valida i codici dei clienti.

## Core Requirements (static)
- Un solo sconto per commerciante.
- Abbonamento mensile mock (€4.99).
- Filtri per zona di Roma + categoria + ricerca testuale.
- QR code per redemption; il commerciante scansiona/inserisce codice.
- Ruoli separati con protezione route.

## What's Implemented (2026-02-05 → 2026-02-19)
- Landing page (hero, come funziona, in vetrina, categorie, merchant CTA)
- Registrazione/login clienti + commercianti (JWT)
- 12 zone Roma + 10 categorie
- Catalogo `/discounts` con filtri (zona, categoria, ricerca) e 6 seed
- Detail `/discounts/:id` con generazione QR code
- Subscribe page (Stripe test mode)
- Client dashboard con abbonamento e cronologia codici
- Merchant dashboard con stats (totali/utilizzati/pending)
- Merchant discount form (crea/modifica singola offerta)
- Merchant scan (validazione codice con success/error UI)
- Seed: admin, 1 cliente demo, 6 commercianti con 6 sconti
- **[2026-02-19]** Redesign "Dark Bubblegum" (nero + fucsia/ciano/neon + immagini Roma)
- **[2026-02-19]** Prezzo abbonamento €2,99/mese
- **[2026-02-19]** QR dinamico rotante ogni 10 secondi (HMAC signature anti-fraud)
- **[2026-02-19]** Admin dashboard `/admin` con KPI + grafici + top merchant/clienti + log
- **[2026-02-19]** FAQ 8-item su landing
- **[2026-02-19]** Stripe Billing test mode integrato (Checkout hosted + webhook + payment success/cancel)
- **[2026-02-19]** Mappa interattiva Roma `/map` (Leaflet + OSM tema dark)
- **[2026-02-19]** WebAuthn biometric login (Face ID / impronta) + PIN 4 cifre fallback + Setup Security post-registrazione
- **[2026-02-19]** Recupero credenziali (email → token → nuova password)
- **[2026-02-19]** Master password gate su /admin + gestione negozi (approva/modifica/elimina con cascade)
- **[2026-02-19]** Password: nuova master `ValeRoma2026` + toggle mostra/nascondi su ogni campo
- **[2026-02-19]** Workflow approvazione: ogni offerta merchant sale come `pending` → invisibile al pubblico → admin tab "Offerte in Attesa" con Approva/Rifiuta (con motivo) / force-edit
- **[2026-02-19]** Lock modifiche mese in corso: offerta approvata è read-only fino al 1° del mese seguente (banner "Offerta attiva per questo mese")
- **[2026-02-19]** Limite 1 coupon/negozio/utente per mese solare (reset automatico ogni 1° con `month_key`); pulsante disabilitato con "Sconto già utilizzato questo mese"
- **[2026-02-19]** QR dinamico URL universale a 20s: `/qr/{code}.{slot}.{hmac}` scansionabile da qualsiasi fotocamera senza app. Pagina pubblica full-screen VERDE ✓ ABBONAMENTO VALIDO o ROSSA X CODICE NON VALIDO. Timer + barra progresso 20s.
- **[2026-02-19]** Analytics scan tracciate automaticamente su prima scansione valida (user/negozio/sconto/timestamp)
- **[2026-02-19]** Bug fix: rimossi negozi TEST_ dal QA + trim automatico whitespace su shop_name/title/description/terms + validazione 422 per campi vuoti
- **[2026-02-19]** Auto-enhancement foto client-side: al caricamento, Canvas applica automaticamente luminosità +15%, contrasto +10%, saturazione +15%, sharpening (kernel 3x3 anti-mosso), resize max 1200px, JPEG q0.85. Anteprima immediata con badge "Foto ottimizzata automaticamente per la homepage!". Componente `PhotoEnhancer` riutilizzabile.
- **[2026-02-20]** Bug fix Stripe (Francesco): `POST /api/subscription/cancel` ora annulla anche su Stripe (prima cancellava solo nel DB → utenti ancora addebitati). `POST /api/payments/checkout` crea/riusa Stripe Customer senza email + forza `payment_method_types=["card"]` per bypassare il loop OTP "Confirm it's you" di Stripe Link che bloccava i re-iscritti.
- **[2026-02-20]** Libreria 100 immagini default (10 categorie × 10): `backend/default_images.py` con URL Unsplash CDN 800x450 verificati (Ristoranti, Pizzerie, Palestre, Padel, Calcetto, Meccanici, Bar, Parrucchieri, Abbigliamento, Alimentari). Endpoint `GET /api/default-images` e componente `DefaultImagePicker.jsx` con dialog tab-based sul form MerchantDiscount.
- **[2026-02-20]** Resend integration (placeholder key): `backend/email_service.py` con send async non-blocking, template HTML dark theme. Wired su `POST /auth/forgot` (mail di recovery), `POST /admin/discounts/:id/approve` e `/reject` (notifica merchant). Se `RESEND_API_KEY` non è settata, log-only no-op.
- **[2026-02-20]** PayPal Subscriptions Sandbox (placeholder keys): `backend/paypal_service.py` con OAuth + bootstrap idempotente Product+Plan €3/mese EUR, endpoint `GET /api/paypal/config`, `POST /api/paypal/activate`, `POST /api/paypal/webhook` (gestisce ACTIVATED/CANCELLED/SUSPENDED/EXPIRED/PAYMENT_DENIED). Frontend `Subscribe.jsx` con tab Carta/PayPal e componente `PayPalCheckout.jsx` (`@paypal/react-paypal-js`).
- **[2026-02-20]** Geolocalizzazione utente: `MapView.jsx` chiede posizione al mount, centra la mappa sul pin ciano dell'utente e ordina gli sconti per distanza (Haversine). Anche `Discounts.jsx` mostra la griglia ordinata "dal più vicino". Pulsante "Aggiorna posizione".
- **[2026-02-22]** GDPR Legal Suite completa:
  - 4 pagine legali statiche interne: `/privacy`, `/cookies`, `/termini`, `/recesso` (basate su GDPR + Codice Consumo). Componente `LegalLayout` condiviso.
  - Cookie Banner GDPR compliant (`CookieBanner.jsx`) con 3 opzioni (Accetta tutti / Rifiuta / Personalizza), preferenze granulari (Essenziali/Funzionali/Marketing), salvato in localStorage + log server per prova legale.
  - Endpoint GDPR: `POST /api/gdpr/consent-log` (log consenso cookie), `GET /api/gdpr/export` (art. 20 portabilità dati in JSON), `DELETE /api/gdpr/delete-account` (art. 17 diritto all'oblio con anonimizzazione fatture), `POST /api/gdpr/marketing-consent` (revoca consenso marketing).
  - Componente `GdprSection.jsx` in ClientDashboard e MerchantDashboard con toggle marketing + pulsanti Scarica dati / Elimina account.
  - Register.jsx aggiornato con checkbox marketing opzionale + consensi salvati in `users.consents` con timestamp.
  - Footer legale aggiornato: link interni + pulsante "Gestisci cookie".
- **[2026-02-23]** Indirizzo attività obbligatorio alla registrazione commerciante (`Register.jsx` + `RegisterIn` model).
- **[2026-02-23]** Utilizzi multipli mensili configurabili per sconto:
  - `DiscountIn.max_uses_per_month` (1-10, default 1) — merchant sceglie quante volte al mese ogni abbonato può usare lo sconto (Es. Pizzeria da Marco: 3 usi/mese).
  - UI selettore preset `1/2/3/5/10` in `MerchantDiscount.jsx`.
  - `POST /api/redemptions/create/{id}` conta utilizzi consumati (`status:redeemed`) e blocca oltre max, altrimenti genera NUOVO codice ogni volta.
  - `GET /api/redemptions/discount/{id}/status` ritorna `{used_count, max_uses, remaining, has_pending}` (backward compat con `used_this_month`).
  - `DiscountDetail.jsx` mostra badge "N utilizzi/mese", contatore "X/N rimasti", label dinamica "Genera QR (utilizzo 2 di 3)".

- **[2026-02-23]** Mappatura 3 email reali contestuali (tutte cliccabili con `mailto:` che apre app di posta):
  - `info@scontiroma.it` → Assistenza generale. Creata pagina `/support` (`Support.jsx`) con testo "Hai bisogno di aiuto? Scrivici a info@scontiroma.it, ti risponderemo entro 24 ore!". Link "Assistenza" aggiunto al footer globale. Usata anche in Recesso (contatti + modulo) e LegalLayout (sidebar aiuto).
  - `privacy@scontiroma.it` → Diritti GDPR. Mantenuta in PrivacyPolicy (3 ref), CookiePolicy, GdprSection (sotto "Scarica i miei dati"), Termini §12 (row Privacy).
  - `partner@scontiroma.it` → Sezione dedicata "Modifiche o rimozione del negozio" in Termini §5 con **preavviso minimo 15 giorni** per modifiche/sospensione/rimozione + candidature nuovi negozi. Row anche in Support e Termini §12.

- **[2026-02-23]** Rinnovi automatici mensili via webhook + email di ricevuta:
  - Stripe webhook estende su `invoice.payment_succeeded` (esclude il primo charge `subscription_create`).
  - PayPal webhook estende su `PAYMENT.SALE.COMPLETED` / `PAYMENT.CAPTURE.COMPLETED`.
  - Helper `extend_subscription_on_renewal()` idempotente via collection `renewal_events` (chiave `provider_event_id`).
  - Aggiorna `subscriptions.end_date` + nuovo campo `users.data_scadenza_abbonamento` (base = `max(now, current_end)` + 30gg, evita di bruciare giorni residui).
  - Nuova email `send_renewal_receipt` con soggetto **"Il tuo abbonamento a Sconti Roma si è rinnovato!"** — HTML dark theme con importo, prossimo rinnovo formattato in italiano, CTA "Scopri i nuovi sconti".
  - Endpoint QA `POST /api/admin/simulate-renewal/{user_id}?provider=stripe|paypal` (require_admin_master) per test manuali senza collegare Stripe Test Clocks / PayPal Webhook Simulator.
  - Test completo: 2 rinnovi Stripe (+30gg cumulativi ✅), idempotenza (stesso event_id → skip ✅), rinnovo PayPal (✅). 4 email Resend inviate a Francesco confermate con ID.
  - Nota: user aveva chiesto sender `noreply@send.scontiroma.it` ma quel sottodominio NON è verificato su Resend (solo `scontiroma.it` root). Uso `SENDER_EMAIL` corrente = `noreply@scontiroma.it` che funziona.

- **[2026-02-24]** Feature triple: **Galleria foto** (max 8) + **Geocoding automatico** + **Mini-mappa**:
  - `DiscountIn.image_urls: List[str]` (max 8, filtered/deduped in `cleaned()`), backward compat con `image_url` (auto-sync copertina).
  - Nuovo componente `PhotoGallery.jsx`: tile grid con badge "Copertina" sulla 1ª foto, controlli riordino ↑↓/rimozione, staged-preview con Libreria + PhotoEnhancer.
  - Nuovo endpoint helper `geocode_address()` via Nominatim OpenStreetMap (gratuito, User-Agent identificativo, cache in-memory). `geocode_and_save_merchant()` fire-and-forget su registrazione merchant + su update profilo se address cambia.
  - Nuovo componente `MiniMap.jsx` con react-leaflet + tema dark, pin fucsia, popup con nome/indirizzo, header "Dove siamo" + pulsante "Portami qui" (link Google Maps navigation).
  - `DiscountDetail.jsx` ora ha hero con frecce di navigazione ← →, dot indicator, thumbnail strip, MiniMap sotto la card prezzo.
  - **Verificato E2E**: registrato "Pizzeria da Marco Geo" a Piazza Navona 10 → geocode restituisce `lat=41.8978, lng=12.4728` in 4 secondi ✓ · galleria 3 foto salvata ✓ · mini-mappa renderizza sulla pagina sconto ✓.

- **[2026-02-24]** Doppia feature: **QR Referral per merchant** + **AI Description Assistant**:
  - **Referral tracking**: `RegisterIn.referred_by` (merchant_id) + campi `users.referred_by` / `referred_at`. `Landing.jsx` cattura `?ref=` dall'URL e salva in `localStorage.referral_merchant_id`; `Register.jsx` include il ref (priorità URL, poi localStorage) nel payload. Nuovo endpoint `GET /api/merchants/me/referrals` con conteggi (total, subscribed, active) + `referral_url` + `flyer_url`. Nuovo componente `MerchantReferralCard.jsx` nella MerchantDashboard: QR personalizzato + link copiabile + 3 stat card + CTA "Stampa la mia locandina" che apre `/locandina?ref=MID`. Locandina aggiornata per generare QR dinamico su `scontiroma.it/?ref=MID`.
  - **AI Improve Description**: Nuovo endpoint `POST /api/discounts/improve-description` che usa Claude Sonnet 5 via `emergentintegrations` + `EMERGENT_LLM_KEY`. Prompt system in italiano con 7 regole (max 220 char, no emoji, no prezzi, dettaglio concreto, tono romano-amichevole). Bottone "✨ Migliora con AI" in `MerchantDiscount.jsx` (gradient fucsia→viola) + "↺ Ripristina originale" se l'AI non convince.
  - **Verificato E2E**: 
    - AI: "pizza al 50%" → "Margherita cotta nel forno a legna, con pomodoro fresco e mozzarella filante: la classica napoletana da gustare in trattoria..." (168 char, 8.9s) ✅
    - Referral: iscrizione con `referred_by` persiste correttamente in DB ✅
    - Backend `/merchants/me/referrals` ritorna il count corretto ✅

- **[2026-02-25]** Doppia feature UX/PWA: **PWA install banner** + **Pulsante "Chiama & Prenota" con WhatsApp**:
  - **PWA install banner** (`PWAInstallBanner.jsx` montato in `App.js`): rileva mobile (iOS Safari / Android Chrome) tramite navigator.userAgent + `display-mode: standalone` per non mostrarsi se già installata. Su iOS mostra il testo "Clicca sul tasto Condividi ⎋ in basso e seleziona ➕ Aggiungi alla schermata Home"; su Android usa l'evento `beforeinstallprompt` per lanciare l'install prompt nativo se disponibile, altrimenti "Clicca sui 3 puntini in alto a destra e seleziona Installa applicazione". Dismiss persistente 7 giorni via localStorage (`pwa_install_dismissed_at`). Delay 3s per non saltare al primo paint. Aggiunti anche `manifest.json`, icon-192.svg, icon-512.svg, meta tag Apple e titolo pagina.
  - **Pulsante Chiama & Prenota + WhatsApp** su `DiscountDetail.jsx`: due CTA affiancate. "Chiama e Prenota con lo Sconto" (arancione terracotta, icona Phone) → link `tel:` con numero normalizzato in formato E.164 italiano (`+39...`). "Scrivi su WhatsApp" (verde #25D366) → `wa.me/...?text=` con messaggio precompilato. Sotto, riquadro gold con "💡 Consiglio furbo: ricorda di specificare a voce «Ho l'abbonamento attivo a Sconti Roma»". Backend `enrich_discount` estende `merchant` con `phone` (già obbligatorio in registrazione merchant).
  - **Verificato E2E**: iOS Safari UA → banner iOS ✅ · Android Chrome UA → banner Android ✅ · Desktop → banner nascosto ✅ · DiscountDetail mobile → entrambi i pulsanti + tel: cliccabile ✅.

- **[2026-02-25]** Tripla feature: **Nuovo logo brand originale** + **Icona app pink "S"** + **AI Photo Enhancement con Nano Banana**:
  - **Nuovo logo `BrandMark.jsx`** (rewrite da zero, NON è più la freccia Amazon): 3 archi decrescenti stile acquedotto romano — il centrale pieno fucsia (accento del brand) + i laterali outline che seguono `currentColor` (si adatta al testo circostante) + una sparkle ciano a 4 punte in alto a destra + linea rosa alla base (suolo/pavimento romano). Scala automaticamente col font-size ereditato. Modalità: default (colonna icona+testo), `inline` (riga), `iconOnly`. Applicato in Navbar, LegalFooter, Landing footer, Login header e PWA banner.
  - **Icona app**: `favicon.svg`, `icon-192.svg`, `icon-512.svg` ridisegnate: singola "S" bianca su gradient rosa→viola (stesso look del quadratino nella navbar). Manifest PWA aggiornato di conseguenza.
  - **AI Photo Enhancement** (Gemini Nano Banana): nuovo endpoint `POST /api/ai/enhance-image` (require merchant) che accetta `image_url` + `category`, scarica l'immagine (max 8MB) via httpx o base64 data-URL, la invia a `gemini-3.1-flash-image-preview` con prompt category-aware ("professional food photography", "energetic sport facility", "luxury beauty & wellness", "fashion retail" o "professional commercial") e regole strict "keep same subject/composition, only improve lighting/color/sharpness". Ritorna un `data:image/*;base64` URL pronto per essere salvato al posto dell'originale. Nel frontend `PhotoGallery.jsx`, ogni tile ha ora un pulsante `photo-ai-enhance-{i}` in alto ("✨ Ottimizza con AI" gradient fucsia→viola on-hover, stato "Ottimizzo…" con spinner durante la chiamata). Passa `category` dal profilo merchant per contestualizzare il prompt.
  - **Verificato**: endpoint `/api/ai/enhance-image` risponde 401 senza auth ✅ · logo con 3 archi + sparkle renderizzato su Landing (3 istanze BrandMark) ✅ · icona pink "S" visibile nel tab browser + navbar ✅.

## Prioritized Backlog
- **P1**: Sostituire placeholder `[DA COMPILARE]` nelle pagine legali con Ragione Sociale + P.IVA + sede quando Francesco aprirà P.IVA in Regime Forfettario.
- **P1**: Aggiungere autoresponder Aruba sulle 3 caselle (info/privacy/partner) con acknowledge "Abbiamo ricevuto, risposta entro 24h".
- **P1**: Connect Stripe live (currently Sandbox)
- **P2**: Filtri "nel raggio di X km" sulla mappa
- **P2**: Recupero credenziali admin (via email + eventuale master password reset)
- **P2**: Client saved/favoriti discounts.
- **P2**: Mappa Roma con quartieri interattivi.
- **P2**: Notifiche nuovi sconti nella tua zona.
- **P3**: Programma referral (invita amici = mese gratis).
- **P3**: Split `server.py` (2170+ righe) in `routes/auth.py`, `routes/payments.py`, `routes/admin.py`, `routes/gdpr.py`.

## Test Credentials
See `/app/memory/test_credentials.md`.
