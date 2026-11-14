// Offerta «omaggio» (13/11): un regalo o un'esperienza senza prezzi, per i locali che non vogliono fare sconti.
const { test, expect, registra, loginNelBrowser, admin, chiama } = require('../fixtures');

test.use({ viewport: { width: 390, height: 844 } });

test('omaggio: il negozio lo crea senza prezzi, il cliente lo vede «In omaggio»', async ({ page, request }) => {
  const m = await registra(request, 'merchant', { category: 'Ristorante' });
  await loginNelBrowser(page, m.email, m.password);
  await page.goto('/merchant/discount');
  // Offerta pronta di tipo omaggio: sceglie il tipo e nasconde i prezzi
  await page.getByTestId('offerta-pronta-dolce-casa').click();
  await expect(page.getByTestId('disc-tipo-omaggio')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('disc-original')).toHaveCount(0);
  await expect(page.getByTestId('disc-omaggio-aiuto')).toBeVisible();
  // Tornando a «Sconto» i prezzi ricompaiono, poi di nuovo omaggio
  await page.getByTestId('disc-tipo-sconto').click();
  await expect(page.getByTestId('disc-original')).toBeVisible();
  await page.getByTestId('disc-tipo-omaggio').click();
  const titolo = `Dolce della casa e2e ${Date.now()}`;
  await page.getByTestId('disc-title').fill(titolo);
  const salvataggio = page.waitForResponse((r) => r.url().endsWith('/api/merchants/me/discount') && r.request().method() === 'POST');
  await page.getByTestId('disc-submit').click();
  const r = await salvataggio;
  expect(r.status()).toBe(200);
  const d = (await r.json()).discount;
  expect(d).toMatchObject({ offer_type: 'omaggio', original_price: null, discounted_price: null });

  // L'admin approva: nel dettaglio pubblico niente prezzi né percentuale
  const a = await admin(request);
  const ok = await chiama(request, 'POST', `/admin/discounts/${d.id}/approve`, { token: a.token, headers: a.headers });
  expect(ok.status).toBe(200);
  await page.goto(`/discounts/${d.id}`);
  await expect(page.getByTestId('omaggio-dettaglio')).toHaveText('In omaggio');
  await expect(page.getByTestId('discounted-price')).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText('NaN');
  await expect(page.locator('main')).not.toContainText('undefined');
});
