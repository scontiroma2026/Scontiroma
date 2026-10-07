// Archivio delle offerte: un'offerta rifiutata finisce nell'archivio del commerciante e con
// «Correggi e riusa» viene copiata nel modulo del mese prossimo (finestra aperta).
const { test, expect, chiama, registra, admin, loginNelBrowser } = require('../fixtures');

test('archivio: offerta rifiutata, poi «Correggi e riusa» nel mese prossimo', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  const titolo = `Menù da archiviare ${Date.now()}`;
  const c = await chiama(request, 'POST', '/merchants/me/discount', { token: m.token,
    body: { title: titolo, description: 'Antipasto e primo.', original_price: 30, discounted_price: 18, max_uses_per_month: 2 } });
  expect(c.status).toBe(200);
  const a = await admin(request);
  const rif = await chiama(request, 'POST', `/admin/discounts/${c.data.discount.id}/reject`,
    { token: a.token, headers: a.headers, body: { reason: 'Foto poco chiara' } });
  expect(rif.status).toBe(200);
  const apri = await chiama(request, 'POST', '/admin/next-offers/window-override', { token: a.token, headers: a.headers, body: { open: true } });
  expect(apri.status).toBe(200);
  try {
    await loginNelBrowser(page, m.email, m.password);
    await page.goto('/merchant/discount?tab=archivio');
    const archivio = page.getByTestId('archivio-offerte');
    await expect(archivio).toContainText(titolo);
    await expect(archivio).toContainText('Rifiutata');
    await expect(archivio).toContainText('Motivo del rifiuto: Foto poco chiara');

    await archivio.getByRole('button', { name: 'Correggi e riusa' }).click();
    await expect(page.getByTestId('disc-title')).toHaveValue(titolo);
    await expect(page.getByTestId('offer-tab-next')).toHaveAttribute('aria-pressed', 'true'); // la scheda attiva si riconosce da aria-pressed, non dal colore (cambiato con la variante «Bianco vivo»)
  } finally {
    await chiama(request, 'POST', '/admin/next-offers/window-override', { token: a.token, headers: a.headers, body: { open: null } });
  }
});
