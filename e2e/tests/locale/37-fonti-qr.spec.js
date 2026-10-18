// QR dei volantini: le visite (clienti e negozi) e le iscrizioni di clienti e negozi si contano per fonte, in modo anonimo.
const { test, expect, chiama, registra, loginNelBrowser } = require('../fixtures');
const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_MASTER_PASSWORD } = require('../env');

test.use({ viewport: { width: 390, height: 844 } });

test('QR volantino: visita clienti e negozi contate, iscrizione negozio con fonte, numeri in admin', async ({ page, request }) => {
  const f1 = `e2e-strada-${Date.now() % 100000}`;
  const f2 = `e2e-negozi-${Date.now() % 100000}`;

  // Visita da QR dei clienti e da QR dei negozi (la stessa fonte nello stesso giorno si conta una volta)
  const v1 = page.waitForResponse((r) => r.url().endsWith('/api/fonte/visita') && r.request().method() === 'POST');
  await page.goto(`/?fonte=${f1}`);
  expect((await v1).status()).toBe(200);
  const v2 = page.waitForResponse((r) => r.url().endsWith('/api/fonte/visita') && r.request().method() === 'POST');
  await page.goto(`/per-i-commercianti?fonte=${f2}`);
  expect((await v2).status()).toBe(200);
  await expect(page.getByTestId('per-i-commercianti-page')).toBeVisible();

  // Iscrizione di un negozio e di un cliente con quelle fonti
  await registra(request, 'merchant', { fonte: f2 });
  await registra(request, 'client', { fonte: f1 });

  await loginNelBrowser(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto('/admin');
  await page.getByTestId('master-pw').fill(ADMIN_MASTER_PASSWORD);
  await page.getByTestId('master-submit').click();
  await page.getByTestId('tab-riepilogo').click();
  const riga1 = page.getByTestId(`fonte-qr-${f1}`);
  const riga2 = page.getByTestId(`fonte-qr-${f2}`);
  await expect(riga1).toBeVisible();
  await expect(riga1.locator('td').nth(1)).toHaveText('1'); // visite clienti
  await expect(riga1.locator('td').nth(3)).toHaveText('1'); // clienti iscritti
  await expect(riga2.locator('td').nth(2)).toHaveText('1'); // visite negozi
  await expect(riga2.locator('td').nth(4)).toHaveText('1'); // negozi iscritti
});
