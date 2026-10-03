// Privacy: senza consenso ai cookie funzionali il sito non invia statistiche (né visite né clic).
const { test, expect, registra, creaOffertaApprovata } = require('../fixtures');

test('statistiche: con i cookie rifiutati nessun invio, nemmeno dei clic', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  const offerta = await creaOffertaApprovata(request, m.token, { title: `Privacy ${Date.now()}` });
  const inviate = [];
  page.on('request', (r) => { if (r.url().includes('/api/track')) inviate.push(r.url()); });
  // Le fixture partono con i cookie rifiutati
  await page.goto('/discounts');
  await page.getByTestId(`discount-card-${offerta.id}`).click();
  await expect(page).toHaveURL(new RegExp(`/discounts/${offerta.id}`));
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await page.waitForTimeout(5000); // le statistiche partono al massimo dopo 4 s
  expect(inviate).toEqual([]);
  expect(await page.evaluate(() => localStorage.getItem('sr_vid'))).toBeNull();
});

test('offerta: il prezzo scontato deve essere più basso di quello pieno', async ({ request }) => {
  const m = await registra(request, 'merchant');
  const { chiama } = require('../fixtures');
  const r = await chiama(request, 'POST', '/merchants/me/discount', { token: m.token, body: { title: 'X', description: 'Descrizione.', original_price: 10, discounted_price: 20 } });
  expect(r.status).toBe(422);
  expect(JSON.stringify(r.data)).toContain('più basso del prezzo pieno');
});
