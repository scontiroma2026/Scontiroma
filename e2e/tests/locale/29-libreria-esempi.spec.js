// Catalogo «Esempi»: le foto sono copiate sul nostro sito (/esempi), niente rete esterna.
// Si apre il catalogo, si scelgono le miniature, la foto scelta entra in galleria con
// l'indirizzo assoluto del sito. Un indirizzo Unsplash già salvato resta un semplice indirizzo.
const { test, expect, registra, loginNelBrowser } = require('../fixtures');

test.use({ viewport: { width: 390, height: 844 } });

test('il catalogo Esempi usa solo foto del sito e la scelta entra in galleria', async ({ page, request }) => {
  const esterne = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (!['localhost', '127.0.0.1'].includes(u.hostname) && !u.protocol.startsWith('data')) esterne.push(r.url());
  });
  const m = await registra(request, 'merchant');
  await loginNelBrowser(page, m.email, m.password);
  await page.goto('/merchant/discount');
  await expect(page.getByTestId('photo-gallery')).toBeVisible();

  await page.getByTestId('open-default-images-btn').click();
  await expect(page.getByTestId('default-images-dialog')).toBeVisible();
  const totale = await page.getByTestId('default-images-total').textContent();
  expect(parseInt(totale.replace(/\D/g, ''), 10)).toBeGreaterThanOrEqual(100);

  const prima = page.getByTestId('lib-img-0').locator('img');
  await expect(prima).toHaveAttribute('src', /\/esempi\/mini\/[0-9a-f-]+\.jpg$/);
  await expect.poll(() => prima.evaluate((i) => i.complete && i.naturalWidth)).toBe(400);
  await page.getByTestId('lib-img-0').click();

  await expect(page.getByTestId('default-images-dialog')).toBeHidden();
  const foto = page.getByTestId('photo-gallery').locator('img').first();
  await expect(foto).toHaveAttribute('src', /^http:\/\/localhost:3000\/esempi\/[0-9a-f-]+\.jpg$/);
  await expect.poll(() => foto.evaluate((i) => i.complete && i.naturalWidth)).toBe(800);
  expect(esterne).toEqual([]);
});
