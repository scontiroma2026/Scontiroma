// Revisione admin: prima di approvare si legge per esteso tutto quello che ha inserito il negozio,
// compresa la descrizione del negozio; i campi lasciati vuoti sono segnati «Lasciato vuoto».
const { test, expect, chiama, registra, loginNelBrowser } = require('../fixtures');
const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_MASTER_PASSWORD } = require('../env');

test.use({ viewport: { width: 390, height: 844 } });

test('admin: offerta in attesa con tutti i campi per esteso e i campi vuoti segnalati', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  const lunga = 'Pulizia dei denti completa con controllo. '.repeat(12).trim() + ' FINE DESCRIZIONE';
  const negozio = 'Studio con tre poltrone, aperto anche il sabato mattina. '.repeat(6).trim() + ' FINE NEGOZIO';
  const p = await chiama(request, 'PUT', '/merchants/me/profile', { token: m.token, body: { shop_description: negozio } });
  expect(p.status, JSON.stringify(p.data)).toBe(200);
  const c = await chiama(request, 'POST', '/merchants/me/discount', { token: m.token, body: {
    title: `Scheda e2e ${Date.now()}`, description: lunga, original_price: 80, discounted_price: 50, terms: '' } });
  expect(c.status, JSON.stringify(c.data)).toBe(200);
  const did = c.data.discount.id;

  await loginNelBrowser(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto('/admin');
  await page.getByTestId('master-pw').fill(ADMIN_MASTER_PASSWORD);
  await page.getByTestId('master-submit').click();
  await page.getByTestId('tab-pending').click();

  const scheda = page.getByTestId(`scheda-completa-${did}`);
  await expect(scheda).toBeVisible();
  await expect(page.getByTestId(`sc-descrizione-${did}`)).toContainText('FINE DESCRIZIONE');
  await expect(page.getByTestId(`sc-descr-negozio-${did}`)).toContainText('FINE NEGOZIO');
  await expect(page.getByTestId(`sc-termini-${did}`)).toHaveAttribute('data-vuoto', 'si');
  await expect(page.getByTestId(`sc-termini-${did}`)).toContainText('Lasciato vuoto');
  await expect(page.getByTestId(`scheda-vuoti-${did}`)).toContainText('campi vuoti');
  await expect(scheda).toContainText('12345678903'); // Partita IVA (prima risultava sempre «non fornita»)
  // Testo intero, senza taglio: l'ultima parola è davvero visibile
  await expect(page.getByTestId(`sc-descrizione-${did}`).getByText('FINE DESCRIZIONE')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
});
