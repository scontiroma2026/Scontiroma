// QR della locandina: porta alla pagina del negozio con l'offerta del mese e il pulsante «Iscriviti»;
// il negozio resta memorizzato anche se il cliente guarda gli sconti prima di iscriversi.
const { test, expect, chiama, registra, creaOffertaApprovata, admin, MERCHANT } = require('../fixtures');

test('QR: pagina del negozio con l\'offerta, poi iscrizione attribuita al negozio', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  const offerta = await creaOffertaApprovata(request, m.token, { title: `Menù del QR ${Date.now()}` });

  await page.goto(`/n/${m.user.id}`);
  await expect(page.getByTestId('negozio-qr-nome')).toHaveText(MERCHANT.shop_name);
  await expect(page.getByTestId(`discount-card-${offerta.id}`)).toBeVisible();

  // Il cliente prima guarda gli sconti, poi si iscrive: il negozio non si perde
  await page.getByRole('link', { name: 'Guarda gli altri sconti' }).click();
  await expect(page).toHaveURL(/\/discounts$/);
  await page.goto('/register');
  const email = `qr.${Date.now()}@example.com`;
  await page.getByTestId('reg-first-name').fill('Giulia');
  await page.getByTestId('reg-last-name').fill('Esempio');
  await page.getByTestId('reg-email').fill(email);
  await page.getByTestId('reg-password').fill('password-e2e-123');
  await page.getByTestId('legal-accept').click();
  await page.getByTestId('reg-submit').click();
  await expect(page).not.toHaveURL(/register/, { timeout: 15000 });

  // L'iscrizione risulta attribuita al negozio (lo vede solo l'admin)
  const ad = await admin(request);
  const r = await chiama(request, 'GET', '/admin/referrals-by-merchant', { token: ad.token, headers: ad.headers });
  expect(r.status).toBe(200);
  const riga = r.data.merchants.find((x) => x.merchant_id === m.user.id);
  expect(riga && riga.total_signups).toBe(1);
});

test('QR: negozio senza offerta e negozio sconosciuto', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  await page.goto(`/n/${m.user.id}`);
  await expect(page.getByTestId('negozio-qr-senza-offerta')).toContainText('Offerta in arrivo');
  await page.goto('/n/non-esiste');
  await expect(page.getByTestId('negozio-qr-errore')).toBeVisible();
});

test('locandina: QR verso la pagina del negozio, nome e testi nuovi', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  await page.goto(`/locandina?ref=${m.user.id}`);
  await expect(page.getByTestId('affiliate-badge-text')).toContainText(`${MERCHANT.shop_name} aderisce a Sconti Roma`);
  const testo = await page.locator('body').innerText();
  expect(testo).toContain('Iscrizione gratuita');
  expect(testo.toLowerCase()).toContain("inquadra e scopri l'offerta di questo mese");   // il testo è in maiuscolo nella stampa
  expect(testo).not.toMatch(/affiliato|fase di lancio|30 secondi/i);
  // «Roma e dintorni» al posto di «quartiere»; titoli in Manrope (scelta del titolare, 13/10)
  expect(testo).toContain('Gli sconti di Roma e dintorni.');
  expect(testo).toContain('negozi di Roma e dintorni');
  expect(testo).not.toMatch(/quartier/i);
  const caratteri = await page.locator('.flyer').evaluate((el) => [...el.querySelectorAll('*')].map((n) => getComputedStyle(n).fontFamily));
  expect(caratteri.join('|')).not.toMatch(/fraunces/i);
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('700 34pt Manrope'))).toBe(true);
  // la stampa resta leggibile: stesso carattere anche con @media print
  await page.emulateMedia({ media: 'print' });
  const titolo = page.locator('.flyer div').filter({ hasText: /^Sconti Roma$/ }).first();
  await expect(titolo).toBeVisible();
  expect(await titolo.evaluate((n) => getComputedStyle(n).fontFamily)).toMatch(/Manrope/);
});
