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

## Controlli automatici

Ogni Pull Request esegue `.github/workflows/ci.yml`: il server deve avviarsi e il sito deve compilare.
