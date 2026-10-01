# Sconti Roma

App di abbonamento (€2,99/mese) per sconti nei negozi di Roma, con QR dinamico anti-frode per il riscatto.

- **Backend**: FastAPI + MongoDB (Motor) — `backend/server.py`, `backend/email_service.py`, `backend/paypal_service.py`
- **Frontend**: React (CRA + craco) — `frontend/src`
- **Servizi**: Stripe e PayPal (pagamenti), Resend (email), Google Gemini (miglioramento foto)
- **Hosting**: Render + MongoDB Atlas — configurazione in `render.yaml`, guida in [`MIGRAZIONE.md`](MIGRAZIONE.md)

## Avvio in locale

Backend (serve un MongoDB raggiungibile):

```bash
cd backend
pip install -r requirements.txt
MONGO_URL=mongodb://localhost:27017 DB_NAME=scontiroma JWT_SECRET=dev \
  SEED_DEMO_DATA=true CORS_ORIGINS=http://localhost:3000 \
  uvicorn server:app --port 8001 --reload
```

`SEED_DEMO_DATA=true` crea gli account demo (cliente e commercianti). Non impostarlo mai in produzione.

Frontend:

```bash
cd frontend
yarn install --frozen-lockfile
REACT_APP_BACKEND_URL=http://localhost:8001 yarn start
```

## Come lanciare i test

### Test end-to-end in locale (Playwright)

Provano i flussi completi nel browser, contro un server e un database **locali**:
registrazione cliente e commerciante, login, password dimenticata, creazione dell'offerta
con "Migliora foto", approvazione admin, offerta visibile al cliente, abbonamento Stripe,
QR (scadenza dopo 20 s e doppia scansione), limite di tentativi sul login, difesa CSRF,
Face ID con autenticatore virtuale.

```bash
cd e2e
npm ci && npx playwright install chromium
pip install -r ../backend/requirements.txt
npm run build:sito          # compila il sito in frontend/build-e2e, puntato a localhost:8001
npm test                    # avvia da solo server di test (porta 8001) e sito (porta 3000)
```

- **Database**: serve un MongoDB su `localhost:27017` (il database `e2e` viene svuotato a ogni
  avvio). Senza MongoDB: `pip install mongomock-motor` e `MONGO_URL=mongomock://localhost npm test`.
- **Mai la produzione**: `e2e/server_e2e.py` rifiuta di partire se `MONGO_URL` non è locale o se
  `STRIPE_SECRET_KEY` non è una chiave di test; nel browser ogni richiesta che non va a
  localhost viene bloccata.
- **Credenziali**: admin e segreti di prova valgono solo per il database locale (vedi
  `e2e/tests/env.js`). Email, PayPal e Gemini non vengono chiamati: Gemini è simulato.
- **Stripe**: con `STRIPE_SECRET_KEY=sk_test_...` in ambiente il test paga davvero sulla pagina
  di Stripe con la carta `4242 4242 4242 4242`; senza chiave quel test viene saltato e
  l'attivazione dell'abbonamento si prova con un webhook firmato come lo firma Stripe.
- `E2E_LOG=1 npm test` mostra i log del server; `npm run report` apre il report dopo un errore.

### Smoke test di sola lettura in produzione

```bash
cd e2e && npm run test:produzione
```

Controllano https://scontiroma.it e https://api.scontiroma.it senza login e senza scrivere
nulla: `GET /api/` risponde `status: ok`, la home carica senza errori in console e chiama
`api.scontiroma.it`, CORS accetta solo `https://scontiroma.it`, `www` reindirizza al dominio
principale, certificati validi per almeno 14 giorni.

### Test del server (pytest)

```bash
cd backend
python -m pytest tests/test_webauthn_config.py -o addopts=""        # unitari, senza server
```

`tests/test_legal_consent.py` invece richiede il server di test avviato
(`python e2e/server_e2e.py`) con `TEST_BASE_URL=http://localhost:8001`,
`TEST_ADMIN_EMAIL=admin@example.com` e `TEST_ADMIN_PASSWORD=e2e-admin-password`.

## Controlli automatici

`.github/workflows/ci.yml` gira su ogni Pull Request e su `main`:

- **Server (FastAPI)**: il server si installa e si avvia, test unitari WebAuthn;
- **Sito (React)**: build di produzione;
- **Test end-to-end**: MongoDB in un container, sito compilato per localhost, tutti i test
  Playwright locali, poi `test_legal_consent.py`. Il test Stripe reale gira solo se nel
  repository è impostato il secret `STRIPE_TEST_SECRET_KEY` (chiave `sk_test_...`).

`.github/workflows/smoke-produzione.yml` lancia gli smoke test di sola lettura dopo ogni
unione su `main`, ogni mattina e a richiesta (Actions → Smoke produzione → Run workflow).
