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

- **[2026-02-25]** Tripla modifica: **Sospensione immediata su rinnovo fallito** + **testo Termini aggiornato** + **logo Colosseo semplificato**:
  - **Sospensione immediata al mancato pagamento** (Stripe `invoice.payment_failed`, PayPal `PAYMENT.SALE.DENIED` / `BILLING.SUBSCRIPTION.PAYMENT.FAILED`):
    - Nuovo helper backend `suspend_subscription_on_payment_failed()`: status→`past_due`, end_date→now, salva `payment_failed_at` e `grace_expires_at=now+7gg`, aggiorna `users.data_scadenza_abbonamento`→now. Idempotente via `renewal_events`.
    - Cablato nel webhook Stripe (salta però `subscription_create` per non sospendere il primo pagamento fallito, che è gestito lato checkout).
    - Cablato nel webhook PayPal (spostato `PAYMENT.SALE.DENIED` fuori dal branch che cancellava direttamente).
    - `PAYMENT.SALE.COMPLETED` successivo (retry riuscito) → `extend_subscription_on_renewal()` riporta lo status a `active` + 30gg (già idempotente).
    - Lazy cleanup su `/subscription/me` e `user_has_active_sub()`: se `past_due` con `grace_expires_at<now` → status diventa `cancelled` con `cancel_reason='grace_period_expired'` (l'abbonamento decade definitivamente dopo 7 giorni).
    - `/subscription/me` ora ritorna anche `past_due` bool e `grace_expires_at` per permettere al frontend di mostrare il banner "abbonamento sospeso, hai X giorni per pagare".
    - Nuovo endpoint QA `POST /admin/simulate-payment-failed/{user_id}?provider=stripe|paypal` (require_admin_master).
    - **[Aggiornamento 2026-02-25 T22:00]** `_cancel_expired_grace()` ora chiama anche `stripe.Subscription.cancel()` (Stripe) o `paypal_service.cancel_subscription()` (PayPal) quando marca la sub come `cancelled` dopo i 7gg → il provider smette di riprovare il pagamento e non addebita più il cliente. Errori sul gateway (rate limit, sub già cancellata) sono log-warned ma NON bloccano la cancellazione locale.
    - **Verificato E2E**: 1) Francesco active → simulate-payment-failed → `active:false, past_due:true, end_date=now, grace=+7gg` ✅ 2) simulate-renewal → `active:true, past_due:false, +30gg` ✅ 3) grace forzato al passato → lazy cleanup marca `cancelled` + chiama Stripe API DELETE `/v1/subscriptions/{id}` (200 OK confermato nei log) ✅.
  - **Terms & Conditions** (`/termini`): riscritta la clausola "Mancato pagamento" — ora dice esplicitamente che l'abbonamento viene sospeso IMMEDIATAMENTE al rinnovo fallito, che ci sono 7 giorni per pagare (durante i quali Stripe/PayPal riproveranno), e che dopo 7 giorni l'abbonamento DECADE definitivamente.
  - **Logo Colosseo semplificato**: rimossi la upper gallery (i piccoli archi in cima) e la fascia orizzontale intermedia. Restano solo skyline stepped + 4 archi grandi (centrale fucsia) + sparkle ciano + base rosa. Look più pulito e leggibile a piccole dimensioni.

- **[2026-02-25 T23:30]** **JWT httpOnly cookies migration (P0 security fix)**:
  - **Backend già configurato**: `set_auth_cookies()` imposta `access_token` (24h) + `refresh_token` (7gg) come cookie `httpOnly=True, secure=True, samesite=None, path=/`. `get_current_user()` legge cookie-first, fallback su `Authorization: Bearer` per tool esterni. Tutti e 4 gli endpoint di login (register, login, pin-login, webauthn-complete) chiamano `set_auth_cookies`.
  - **Frontend rifattorizzato**:
    - `lib/api.js`: rimosso l'interceptor che leggeva `access_token` da localStorage e aggiungeva header `Authorization: Bearer`. Aggiunto cleanup legacy che rimuove qualsiasi `access_token` residuo in localStorage al boot. Solo `withCredentials: true` — i cookie viaggiano automaticamente.
    - `context/AuthContext.jsx`: rimossi tutti i `localStorage.setItem("access_token", ...)` da login e register. Il logout continua a chiamare `removeItem` come cleanup difensivo.
    - `pages/Login.jsx`: rimossi i `localStorage.setItem("access_token", ...)` dai flow webauthn e pin-login.
  - **CORS**: sostituito il fallback `["*"]` con `["http://localhost:3000"]` — browser blocca `*` + `allow_credentials=True`. In prod usa `CORS_ORIGINS` da .env.
  - **Verificato E2E**: 1) login francesco → `localStorage.access_token = null` ✅ 2) cookie `access_token` presente con `httpOnly=True, secure=True` ✅ 3) reload di `/dashboard` → utente ancora loggato (persistenza cookie) ✅ 4) logout → cookie cleared `[]` + redirect a `/login` da rotta protetta ✅.
  - **Impatto XSS**: uno script iniettato via XSS ora NON può leggere il JWT dal `document.cookie` né da `localStorage.getItem("access_token")` — attacco reso inefficace. Rimane la mitigazione di prevenire XSS con Content Security Policy (task futuro).

- **[2026-02-26]** Doppia feature merchant: **Autocomplete indirizzi con civico** + **Lightbox foto ingrandita**:
  - **Address autocomplete con civici** (`geocode_suggest` backend + `AddressAutocomplete` frontend): backend ora usa `bounded=1` + viewbox di Roma per pertinenza + dedup + ordina i suggerimenti con `has_house_number=true` PRIMA di quelli senza numero. Il frontend mostra un badge giallo "senza civico" su ogni suggerimento privo di numero e un banner "⚠️ Aggiungi il n. civico" quando la query dell'utente NON contiene cifre. Aggiunto tip in footer del dropdown: "Per suggerimenti col civico digita 'Via, numero, città'". Limitazione documentata: Nominatim NON offre enumerazione automatica dei civici (a differenza di Google Places) — l'utente DEVE digitare il numero nella query per ottenere un match con `has_house_number`.
  - **Lightbox foto** (`PhotoGallery.jsx`): ogni tile foto ora è cliccabile (icona ZoomIn + testo "Ingrandisci" in hover). Al click apre un modale full-screen con foto max-h-85vh, contatore "N / M", badge Copertina se index=0, frecce ←/→ per navigare, thumbstrip di dot in basso, chiusura con ESC / click overlay / pulsante X. Blocca lo scroll del body mentre è aperto. Funziona anche in read-only (il merchant può vedere le foto ingrandite anche quando l'offerta è già attiva). Gli overlay-hint hanno `pointer-events-none` per non intercettare i click.
  - **Verificato E2E**: 1) query "Via del Corso Roma" → 2 risultati con badge "senza civico" + hint "Aggiungi il n. civico" ✅ 2) query "Via del Corso 100 Roma" → 1 risultato con `has_house_number=true` senza warning ✅ 3) click su tile foto → lightbox si apre con contatore "1 / 1" + foto full-screen ✅.

- **[2026-02-26 T12:00]** **Refactor AdminDashboard + logo Colosseo su Locandina**:
  - **AdminDashboard split**: da 655 righe monolitiche → orchestratore snello (175 righe) + 4 nuovi sotto-componenti in `/components/admin/`:
    - `AdminGate.jsx` (68 righe) — master password gate
    - `AdminAnalytics.jsx` (135 righe) — KPI, grafici (30gg, weekday, hourly), top merchants & clients
    - `AdminPending.jsx` (114 righe) — offerte in attesa con approve/reject inline
    - `AdminLog.jsx` (57 righe) — log cronologico QR/riscatti
    - `AdminMerchantsTable.jsx` (336 righe) — tabella merchants + `MerchantRow` + `DiscountEditModal` estratti come sotto-funzioni della stessa cartella
  - **AdminDashboard.jsx** ora contiene solo: state del master token, session check, `loadData()`, tab-switcher, orchestrazione + `MerchantDiscountsDialog` esistente.
  - **Logo Colosseo su Locandina** (`/locandina`): aggiunto SVG inline (22×18mm) sopra "Sconti Roma" nel flyer A5 stampabile. Colori hard-coded (#FFFFFF outline, #FF2E93 arco centrale + base, #00E5FF sparkle) per garantire fidelity di stampa (non usa `currentColor`).
  - **Verificato E2E**: 1) admin login → gate password → dashboard renderizza con 7 tabs, 6 KPI corretti (29 clienti, 17 merchants, 8 abbonati, €23.92 MRR, 19 sconti/mese, 19 totali), grafici visibili, zero errori JS ✅. 2) Locandina mostra il Colosseo sopra "Sconti Roma" ✅.

- **[2026-02-26 T13:00]** **Bug fix Locandina overflow + Referral URL stale**:
  - **BUG 1 — Locandina QR troncato**: il flyer A5 (148×210mm) andava in overflow verticale (contenuto ~200+ mm dopo l'aggiunta del logo Colosseo). Ridotti: logo 22×18mm→16×13mm, titolo 38pt→34pt, marginBottom "SCOPRI" 4mm→2mm, marginBottom logo 3mm→1.5mm, marginTop tagline 3mm→2mm, divider margin 6mm→4mm, "3 passaggi" marginTop 8mm→5mm marginBottom 5mm→3mm, step cards padding 3mm 4mm→2mm 3mm marginBottom 2.5mm→1.5mm, footer marginTop 4mm→2.5mm, container padding 12mm 10mm→9mm 8mm + `overflow:hidden`. Verificato: `innerH=605px < flyerH=794px`, QR renderizzato, tutti gli elementi visibili nel A5.
  - **BUG 2 — Referral URLs con host stale**: `supervisord.conf` inietta `APP_URL="https://68074b6b-8089-4395-a1ca-2291114b108b.preview.emergentagent.com"` (URL vecchio del container) che sovrascriveva il `.env`. Fix: `merchant_referrals` (server.py:1092) e `email_service.py:19` ora leggono `FRONTEND_URL` (solo `.env`, no conflict) come sorgente primaria + fallback su `APP_URL` per retrocompatibilità. Verificato: sia `referral_url` sia `flyer_url` ora contengono `https://deal-bundle.preview.emergentagent.com`.
  - **Fix minori dal testing agent**: ridotto padding orizzontale Locandina 10mm→8mm per eliminare i 46px di overflow orizzontale residuo (era mascherato da overflow:hidden); aggiunto fallback key robusto in `AdminSubscribers.jsx` per gli eventi rinnovo con `provider_event_id` null (evita React warning).
  - **🧪 Verificato da testing_agent (iteration_15.json)**: backend 100%, frontend 100%, retest_needed=false. Test creato: `/app/backend/tests/test_bugs_fix.py`.

- **[2026-02-26 T14:00]** **Bug fix (2° tentativo) Locandina — stampa 1 pagina A5 pulita**:
  - **Bug residuo**: quando l'utente cliccava "Stampa/Salva PDF" dal /locandina, oltre al flyer venivano stampati anche la navbar in cima, il footer legale in fondo, il cookie banner e il pulsante flottante — spingendo il contenuto su 2+ pagine con la navbar in cima alla prima e il QR troncato.
  - **Root cause**: il vecchio print CSS nascondeva solo elementi con classe `.no-print`, ma navbar/footer/cookie banner non avevano quella classe.
  - **Fix robusto**: sostituito il pattern con:
    ```css
    body * { visibility: hidden !important; }
    .flyer-wrap, .flyer-wrap * { visibility: visible !important; }
    .flyer-wrap { position: absolute; top: 0; left: 0; width: 148mm; height: 210mm; }
    ```
    Nasconde TUTTO il chrome dell'app senza doverlo taggare esplicitamente, poi riporta visibile solo il flyer e lo posiziona in alto-sinistra della pagina di stampa. Aggiunto anche `page-break-inside: avoid` + `break-inside: avoid` su `.flyer` e figli per garantire una singola pagina A5.
  - **🧪 Verificato dal testing_agent (iteration_16.json)**: 100% frontend, 0 issues. PDF generato con `page.pdf(format='A5', prefer_css_page_size=True)` per entrambe le route `/locandina` e `/locandina?ref=MERCHANT_ID`: `Pages: 1`, `Page size: 420 x 594.96 pts (A5)`. Tutto il contenuto del flyer estratto via pdftotext (Sconti Roma, tagline, 3 passaggi, 3 step, scontiroma.it, info@scontiroma.it). Nessuna navbar/footer/cookie stampata.

- **[2026-08-26]** **Sicurezza admin P0 — credenziali default eliminate + recupero master**:
  - Password admin `admin123` → sostituita con password forte (env `ADMIN_PASSWORD`, seed aggiorna hash se cambia). Master `ValeRoma2026` → sostituita e **spostata in DB** (`admin_security`, hash bcrypt, seed iniziale da env).
  - **Recovery ID** `SR-XXXX-XXXX-XXXX` (hash bcrypt): gate /admin → "Master password dimenticata?" → Recovery ID → email Resend a admin con link `/admin/master-reset?token=` (30 min, monouso). Reset incrementa `master_version` → invalida tutti i master token esistenti.
  - **Sblocco biometrico** del gate admin via WebAuthn (`/admin/webauthn-master/begin|complete`, challenge kind "master"); pulsante mostrato se l'admin ha passkey registrate (`/admin/session` ritorna `biometric_available`).
  - Brute-force lockout: 5 tentativi falliti (master o recovery) → 15 min. Pulsante "Recovery ID" in dashboard rigenera l'ID (mostrato una sola volta, require_admin_master).
  - Verificato E2E via curl (15 step: login vecchia/nuova pw, master vecchia/nuova, forgot errato/corretto, email Resend reale inviata, reset corto/valido/riuso, token invalidato, regenerate) + screenshot gate/forgot/dashboard/reset-page.

- **[2026-08-26]** **QR unificati merchant (dashboard = locandina)**:
  - `referral_url` backend ora punta a `/register?ref=MID` (prima homepage `/?ref=`). QR dashboard e QR locandina codificano ESATTAMENTE lo stesso URL.
  - `Locandina.jsx` non hardcoda più `scontiroma.it`: usa `window.location.origin` (in produzione sarà scontiroma.it, ora preview → testabile subito col telefono).
  - Confermato: esiste UNA sola locandina — l'anteprima a schermo e la stampa sono lo stesso identico flyer (print CSS isola solo `.flyer-wrap`).
  - Verificato: curl `/merchants/me/referrals` + decodifica zbarimg del QR renderizzato → URL identici.

## Prioritized Backlog

- **[2026-02-26 T14:09]** Locandina print fix + QR redirect (bug commerciante):
  - **Bug 1 — "ROMA non si legge in stampa"**: Fraunces era importato solo per weight 600 e 800, ma il titolo "Sconti Roma" usava weight **700** → il browser sintetizzava il font a schermo ma in stampa cadeva su Georgia/serif di sistema, deformando il logo. Fix: espanso `@import` di Fraunces a **400-500-600-700-800-900** in `index.css`. Aggiunto **preload esplicito** (`document.fonts.load("700 34pt Fraunces")`) prima di `window.print()` per garantire che il font sia disponibile al print engine.
  - **Bug 2 — Colori sbiaditi in stampa**: aggiunto `print-color-adjust: exact !important` (con prefissi WebKit e generico) su `.flyer-wrap, .flyer-wrap *` così Safari/Firefox non rimuovono background scuri e sfumature. Il PDF ora è identico all'anteprima a schermo.
  - **Fix 3 — QR destinazione**: il QR della locandina puntava a `scontiroma.it/?ref=X` (landing); ora punta **direttamente a `scontiroma.it/register?ref=X`** così l'utente che scansiona il codice va subito al form di iscrizione. `Register.jsx` già leggeva `?ref=` dai searchParams (linea 60).
  - **Verifica**: PDF generato via Playwright + `zbarimg` conferma `QR-Code:https://scontiroma.it/register?ref=a709af18-...`. Rendering PDF pixel-perfect vs preview (screenshot + PDF rasterizzato).

- **[2026-02-26 T13:54]** Referral analytics spostati da Merchant → Admin (per privacy iscritti):
  - `/api/merchants/me/referrals` (backend) **non ritorna più** `total_referrals`, `subscribed_count`, `active_subscribers` e `referrals`. Restituisce solo `referral_url` e `flyer_url`. Il commerciante non può più vedere dati anagrafici o statistiche sugli abbonati arrivati tramite il suo QR.
  - `MerchantReferralCard.jsx` (frontend) **rimossa la griglia di 3 stat** (Iscrizioni/Abbonati/Attivi ora). Restano solo QR + link + CTA "Stampa locandina" / "Prova il link".
  - Nuovo endpoint admin `GET /api/admin/referrals-by-merchant`: per ogni merchant elenco clienti attribuiti + `total_signups`, `subscribed_count`, `active_subscribers`, `conversion_rate`. Ordinato per top-performer (abbonati attivi desc).
  - Nuovo componente `AdminReferralsByMerchant.jsx` con tab "Referral QR" in Admin Dashboard: 4 KPI cards totali, search, righe espandibili con tabella clienti (nome, email, data iscrizione, stato Attivo/Scaduto/Solo registrato).
  - **Test end-to-end verificato**: merchant vede solo QR/link, admin vede piena attribuzione (2 negozi con 2 iscritti, 1 abbonato attivo).

- **[2026-02-26 T13:45]** Email dunning per pagamento fallito (P0 growth) — implementati **3 email + scheduler** per non perdere abbonati:
  - **Email #1 (immediata)** in `send_payment_failed_immediate`: triggerata dentro `suspend_subscription_on_payment_failed` quando lo webhook Stripe/PayPal marca `past_due` (giorno 0). Avvisa che sub è sospesa, mostra la scadenza dei 7gg, CTA su `/account`. Idempotente via `renewal_events`.
  - **Email #2 (promemoria giorno 5)** in `send_grace_period_reminder`: `AsyncIOScheduler` gira ogni giorno alle 10:00 Europe/Rome (`_start_scheduler`), scansiona sub `past_due` con `grace_expires_at` fra 36-60h da now, calcola `days_left` con ceil(hours/24), invia email urgente ("Ultimi 2 giorni"). Flag `users.grace_reminder_sent` per idempotenza. Endpoint manuale `POST /api/admin/run-grace-reminders`.
  - **Email #3 (cancellazione finale)**: aggiunta dentro `_cancel_expired_grace` — al termine dei 7gg quando la sub passa a `cancelled`, invia notifica con CTA riabbonati. Flag `users.cancellation_email_sent` per idempotenza.
  - **Reset dei flag** al rinnovo pagato: `extend_subscription_on_renewal` fa `$unset` di `grace_reminder_sent`, `cancellation_email_sent`, `grace_expires_at` così se in futuro il pagamento fallirà di nuovo, il ciclo email riparte.
  - **Test manuale**: `admin/simulate-payment-failed/{user_id}` → email #1 verificata in log; grace_expires_at spostato a +48h + `admin/run-grace-reminders` → email #2 verificata; grace_expires_at spostato a -1h + hit di `subscription/me` → email #3 verificata. Tutte e 3 le email consegnate via Resend con ID di conferma nei log.
  - Nuove dipendenze: `apscheduler==3.11.3`, `tzlocal==5.4.4`.

- **[2026-02-25 T23:00]** Code review quality fixes (quick wins):
  - **Empty catch blocks** → sostituiti con `console.warn` diagnostici in `PaymentSuccess`, `Register`, `Landing`, `AuthContext`, `MyUsedDiscounts`, `GeocodeIssuesWidget`, `PWAInstallBanner` (7 file, 10+ istanze). Ora nessun errore silente.
  - **Array index come React key** → sostituiti con ID stabili in Landing (`f.q`), Subscribe (`f.t`), DiscountDetail (`thumb-${url}-${i}`, `dot-${url}-${i}`), AdminDashboard (`day-${i}`, `hour-${i}`), AddressAutocomplete (`s.place_id`).
  - **Hardcoded secrets in test** → tutti spostati dietro `os.environ.get("TEST_*_PASSWORD", fallback)` in `tests/backend_test.py`, `test_iteration4.py`, `test_admin_v12_features.py`, `test_pin_auth_flow.py`, `test_sec001_forgot_password.py`. Aggiunto `tests/_test_config.py` come modulo condiviso opzionale.
  - **Hook deps `Discounts.jsx`** → aggiunto commento eslint-disable esplicito (`run one-shot at mount`) + logging su fallimento `merchants/top`.
  - **Python undefined vars** → verificato con `pyflakes`: nessun undefined reale in server.py/email_service.py/paypal_service.py (solo 1 import inutilizzato `fastapi.status`, non critico).
  - **Non affrontati in questa passata** (richiedono task dedicati con testing agent per il rischio regressione):
    - localStorage → httpOnly cookies (refactor completo auth WebAuthn/PIN)
    - Split AdminDashboard/DiscountDetail/Subscribe/Locandina in sub-componenti (300+ righe)
    - Split webhook Stripe/PayPal in strategy pattern (rischio rompere i pagamenti)
    - Estrazione template HTML da email_service
- **P1**: Sostituire placeholder `[DA COMPILARE]` nelle pagine legali con Ragione Sociale + P.IVA + sede quando Francesco aprirà P.IVA in Regime Forfettario.
- **P1**: Aggiungere autoresponder Aruba sulle 3 caselle (info/privacy/partner) con acknowledge "Abbiamo ricevuto, risposta entro 24h".
- **P1**: Connect Stripe live (currently Sandbox)
- **P2**: Filtri "nel raggio di X km" sulla mappa
- **P2**: ~~Recupero credenziali admin (via email + eventuale master password reset)~~ ✅ Fatto il 2026-08-26 (Recovery ID + email reset + biometria).
- **P2**: Client saved/favoriti discounts.
- **P2**: Mappa Roma con quartieri interattivi.
- **P2**: Notifiche nuovi sconti nella tua zona.
- **P3**: Programma referral (invita amici = mese gratis).
- **P3**: Split `server.py` (2170+ righe) in `routes/auth.py`, `routes/payments.py`, `routes/admin.py`, `routes/gdpr.py`.

## Test Credentials
See `/app/memory/test_credentials.md`.
