// Test end-to-end LOCALI: server FastAPI di test (e2e/server_e2e.py) + sito compilato
// in frontend/build-e2e. Database: MongoDB locale oppure emulatore in memoria.
// Nessuna chiamata verso la produzione (vedi fixtures.js: le richieste a *.scontiroma.it
// vengono bloccate).
const { defineConfig, devices } = require('@playwright/test');
const { API, WEB } = require('./tests/env');

module.exports = defineConfig({
  testDir: './tests/locale',
  globalSetup: require.resolve('./tests/global-setup.js'),
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1, // un solo server/database condiviso: i flussi girano in sequenza
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    ...devices['iPhone 13'],
    browserName: 'chromium',
    baseURL: WEB,
    locale: 'it-IT',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: `${process.env.E2E_PYTHON || 'python3'} server_e2e.py`,
      url: `${API}/api/`,
      timeout: 120_000,
      reuseExistingServer: false,
      stdout: process.env.E2E_LOG ? 'pipe' : 'ignore', // E2E_LOG=1 per vedere i log del server
    },
    {
      command: 'npx serve -s ../frontend/build-e2e -l 3000 --no-clipboard',
      url: WEB,
      timeout: 60_000,
      reuseExistingServer: false,
    },
  ],
});
