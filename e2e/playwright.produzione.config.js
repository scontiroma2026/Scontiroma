// Smoke test di SOLA LETTURA contro la produzione (https://scontiroma.it).
// Nessun login, nessuna scrittura: solo GET, HEAD e OPTIONS.
const { defineConfig, devices } = require('@playwright/test');
const { PROD_WEB } = require('./tests/env');

module.exports = defineConfig({
  testDir: './tests/produzione',
  timeout: 60_000,
  retries: 1, // la rete esterna può avere un singhiozzo: un secondo tentativo, non di più
  workers: 2,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: { ...devices['iPhone 13'], browserName: 'chromium', baseURL: PROD_WEB, locale: 'it-IT' },
});
