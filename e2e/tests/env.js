// Indirizzi e credenziali DI TEST. Le credenziali admin valgono solo per il database
// locale creato da server_e2e.py (stessi valori predefiniti, sovrascrivibili da ambiente).
const env = process.env;
module.exports = {
  API: env.E2E_API_URL || 'http://localhost:8001',
  WEB: env.E2E_WEB_URL || 'http://localhost:3000',
  ADMIN_EMAIL: env.ADMIN_EMAIL || 'admin@example.com',
  ADMIN_PASSWORD: env.ADMIN_PASSWORD || 'e2e-admin-password',
  ADMIN_MASTER_PASSWORD: env.ADMIN_MASTER_PASSWORD || 'e2e-master-password',
  STRIPE_WEBHOOK_SECRET: 'whsec_e2e_solo_test', // forzato da server_e2e.py
  PROD_WEB: env.PROD_WEB_URL || 'https://scontiroma.it',
  PROD_API: env.PROD_API_URL || 'https://api.scontiroma.it',
};
