// Le statistiche contano solo le persone vere: il telefono dove entra l'amministratore non si conta (03/11).
const { test, expect, loginNelBrowser } = require('../fixtures');
const { ADMIN_EMAIL, ADMIN_PASSWORD } = require('../env');

const conConsenso = (page) => page.addInitScript(() => {
  localStorage.setItem('sr_cookie_consent', JSON.stringify({ version: 1, action: 'accept_all', prefs: { essential: true, functional: true }, ts: Date.now() }));
});
const ascolta = (page) => { const inviate = []; page.on('request', (r) => { if (r.url().includes('/api/track')) inviate.push(r.postData() || ''); }); return inviate; };
const svuota = async (page) => { await page.evaluate(() => window.dispatchEvent(new Event('pagehide'))); await page.waitForTimeout(1500); };

test('un visitatore normale viene contato', async ({ page }) => {
  await conConsenso(page);
  const inviate = ascolta(page);
  await page.goto('/');
  await svuota(page);
  expect(inviate.join(' ')).toContain('"pageview"');
});

test("dopo l'accesso dell'amministratore il dispositivo non si conta più", async ({ page }) => {
  await conConsenso(page);
  await loginNelBrowser(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('sr_dispositivo_admin'))).toBe('1');
  const inviate = ascolta(page);
  await page.goto('/discounts');
  await svuota(page);
  expect(inviate).toEqual([]);
});

test('le pagine /admin non si contano mai', async ({ page }) => {
  await conConsenso(page);
  const inviate = ascolta(page);
  await page.goto('/admin');
  await svuota(page);
  expect(inviate.join(' ')).not.toContain('/admin');
});
