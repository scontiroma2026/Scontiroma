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
- Subscribe page (Stripe test mode + fallback mock)
- Client dashboard con abbonamento e cronologia codici
- Merchant dashboard con stats (totali/utilizzati/pending)
- Merchant discount form (crea/modifica singola offerta)
- Merchant scan (validazione codice con success/error UI)
- Seed: admin, 1 cliente demo, 6 commercianti con 6 sconti
- **[2026-02-19]** Redesign "Dark Bubblegum" (nero + fucsia/ciano/neon + immagini Roma)
- **[2026-02-19]** Prezzo abbonamento €2,99/mese
- **[2026-02-19]** QR dinamico rotante ogni 10 secondi (HMAC signature anti-fraud)
- **[2026-02-19]** Admin dashboard `/admin` con KPI + grafici + top merchant/clienti + log recenti
- **[2026-02-19]** FAQ 8-item su landing
- **[2026-02-19]** Stripe Billing test mode integrato (Checkout hosted + webhook + payment success/cancel)
- **[2026-02-19]** Mappa interattiva Roma `/map` (Leaflet + OpenStreetMap tema dark, pin fucsia con % sconto, popup con dettagli)

## Prioritized Backlog
- **P1**: Real Stripe integration (currently mocked).
- **P1**: Merchant profile page (edit shop image, description, address).
- **P2**: Client saved/favoriti discounts.
- **P2**: Mappa Roma con quartieri interattivi.
- **P2**: Notifiche nuovi sconti nella tua zona.
- **P3**: Programma referral (invita amici = mese gratis).
- **P3**: Admin dashboard per moderare commercianti.

## Test Credentials
See `/app/memory/test_credentials.md`.
