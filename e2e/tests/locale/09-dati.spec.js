// Step 3: statistiche del commerciante, scheda «Fase di lancio» dell'admin, nessun banner prova senza data.
const { test, expect, registra, loginNelBrowser } = require('../fixtures');
const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_MASTER_PASSWORD } = require('../env');

test('commerciante: scheda «I tuoi clienti» con dati insufficienti, nessun banner della prova', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  await loginNelBrowser(page, m.email, m.password);
  await page.goto('/merchant/dashboard');
  await expect(page.getByTestId('merchant-insights')).toContainText('I tuoi clienti');
  await expect(page.getByTestId('ins-utilizzi')).toHaveText('0');
  await expect(page.getByTestId('ins-insufficienti')).toBeVisible();
  await expect(page.getByTestId('trial-banner')).toHaveCount(0); // TRIAL_END_DATE non impostata
});

test('admin: la prima scheda è «Fase di lancio» con i numeri principali', async ({ page, request }) => {
  await registra(request, 'merchant');
  await loginNelBrowser(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto('/admin');
  await page.getByTestId('master-pw').fill(ADMIN_MASTER_PASSWORD);
  await page.getByTestId('master-submit').click();
  await expect(page.getByTestId('admin-launch')).toBeVisible();
  await expect(page.getByTestId('lancio-commercianti')).not.toHaveText('0');
  await expect(page.getByTestId('lancio-senza-offerta')).toBeVisible();
});
