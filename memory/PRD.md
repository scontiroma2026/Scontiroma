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

## Prioritized Backlog
- **P0**: PayPal Subscriptions integration (piano ricorrente €3/mese Sandbox) — richiede CLIENT_ID + CLIENT_SECRET da https://developer.paypal.com/dashboard/applications/sandbox
- **P1**: Connect Stripe live (currently Sandbox)
- **P1**: Iubenda placeholder → real customer IDs
- **P1**: Geolocalizza Utente (map centered on user location + nearest first)
- **P1**: Provider Email (Resend) per recovery token e notifiche approvazione
- **P2**: Client saved/favoriti discounts.
- **P2**: Mappa Roma con quartieri interattivi.
- **P2**: Notifiche nuovi sconti nella tua zona.
- **P3**: Programma referral (invita amici = mese gratis).
- **P3**: Admin dashboard per moderare commercianti.

## Test Credentials
See `/app/memory/test_credentials.md`.
