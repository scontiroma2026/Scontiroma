// Orari del negozio: li scrive il commerciante, il cliente vede «Aperto ora» / «Chiuso» sull'offerta.
const { test, expect, chiama, registra, creaOffertaApprovata, loginNelBrowser } = require('../fixtures');

test('orari: il commerciante li inserisce e il cliente li vede sull\'offerta', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  const offerta = await creaOffertaApprovata(request, m.token);
  await loginNelBrowser(page, m.email, m.password);
  await page.goto('/merchant/dashboard');
  const box = page.getByTestId('merchant-hours');
  await expect(box).toBeVisible();

  await page.getByTestId('orari-0-0-apre').fill('08:00');
  await page.getByTestId('orari-0-0-chiude').fill('12:00');
  await page.getByTestId('orari-0-aggiungi').click();
  await page.getByText('Copia gli orari del lunedì da martedì a venerdì').click();
  await page.getByTestId('orari-salva').click();
  await expect(page.getByTestId('orari-stato')).toContainText(/Aperto ora|Chiuso/);

  const d = await chiama(request, 'GET', `/discounts/${offerta.id}`);
  const giorni = d.data.discount.merchant.orari.giorni;
  expect(giorni[0].fasce).toEqual([{ apre: '08:00', chiude: '12:00' }, { apre: '16:00', chiude: '20:00' }]);
  expect(giorni[4].fasce).toEqual(giorni[0].fasce);
  expect(giorni[6].chiuso).toBe(true);

  // Chiusura straordinaria: il cliente lo vede subito
  await page.getByTestId('orari-straordinaria').check();
  await page.getByTestId('orari-nota').fill('Chiusi per ferie fino al 20 agosto');
  await page.getByTestId('orari-salva').click();
  await expect(page.getByTestId('orari-stato')).toContainText('Chiuso temporaneamente');

  await page.goto(`/discounts/${offerta.id}`);
  const orari = page.getByTestId('orari-negozio');
  await expect(orari).toContainText('Chiuso temporaneamente');
  await expect(orari).toContainText('Chiusi per ferie fino al 20 agosto');
  await orari.getByRole('button').click();
  await expect(page.getByTestId('orari-negozio-settimana')).toContainText('08:00–12:00 · 16:00–20:00');
});

test('orari: senza orari inseriti il riquadro non compare', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  const offerta = await creaOffertaApprovata(request, m.token);
  await page.goto(`/discounts/${offerta.id}`);
  await expect(page.getByTestId('redeem-btn')).toBeVisible();
  await expect(page.getByTestId('orari-negozio')).toHaveCount(0);
});
