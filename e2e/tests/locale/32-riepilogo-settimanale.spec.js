// Riepilogo settimanale: scheda «Riepilogo» del pannello admin (solo numeri, controlli da 44 px, tema chiaro)
// ed endpoint protetto dalla master password.
const { test, expect, chiama, registra, admin, loginNelBrowser } = require('../fixtures');
const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_MASTER_PASSWORD } = require('../env');

test.use({ viewport: { width: 390, height: 844 } });

test('riepilogo: l\'endpoint chiede la master password e non contiene dati personali', async ({ request }) => {
  const c = await registra(request, 'client');
  expect((await chiama(request, 'GET', '/admin/riepilogo-settimanale', { token: c.token })).status).toBe(403);
  const a = await admin(request);
  const r = await chiama(request, 'GET', '/admin/riepilogo-settimanale', { token: a.token, headers: a.headers });
  expect(r.status).toBe(200);
  expect(r.data.metriche).toHaveLength(9);
  expect(JSON.stringify(r.data)).not.toContain('@');
});

test('riepilogo: scheda admin leggibile da iPhone', async ({ page }) => {
  await loginNelBrowser(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto('/admin');
  await page.getByTestId('master-pw').fill(ADMIN_MASTER_PASSWORD);
  await page.getByTestId('master-submit').click();
  await page.getByTestId('tab-riepilogo').click();
  await expect(page.getByTestId('admin-riepilogo')).toBeVisible();
  await expect(page.getByTestId('riepilogo-da-guardare')).toBeVisible();
  await expect(page.getByTestId('riepilogo-nuovi_clienti')).toContainText('Nuovi clienti');
  await expect(page.getByTestId('riepilogo-periodo')).toContainText('rispetto alla settimana prima');
  expect((await page.getByTestId('riepilogo-aggiorna').boundingBox()).height).toBeGreaterThanOrEqual(44);
  const r = await page.evaluate(() => {
    const [rr, g, b] = getComputedStyle(document.body).backgroundColor.match(/[\d.]+/g).map(Number);
    return { chiaro: (rr + g + b) / 3 > 230, eccesso: document.documentElement.scrollWidth - window.innerWidth,
             font: getComputedStyle(document.querySelector('[data-testid="admin-riepilogo"] table')).fontFamily };
  });
  expect(r.chiaro, 'fondo chiaro').toBe(true);
  expect(r.eccesso, 'scroll orizzontale').toBeLessThanOrEqual(0);
  expect(r.font).toContain('Manrope');
  await page.getByTestId('riepilogo-aggiorna').click();
  await expect(page.getByTestId('riepilogo-aggiorna')).toHaveText('Aggiorna');
});
