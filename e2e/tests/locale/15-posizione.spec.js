// Posizione e testi della home: il browser chiede la posizione solo quando il cliente tocca
// «Usa la mia posizione», mai all'apertura della pagina degli sconti o della mappa.
const { test, expect } = require('../fixtures');

// Finto GPS: conta le richieste e risponde con un punto a Garbatella
const finto = () => {
  window.__richiestePosizione = 0;
  const geo = {
    getCurrentPosition: (ok) => { window.__richiestePosizione += 1; setTimeout(() => ok({ coords: { latitude: 41.8636, longitude: 12.4880 } }), 10); },
    watchPosition: () => { window.__richiestePosizione += 1; return 0; },
    clearWatch: () => {},
  };
  Object.defineProperty(navigator, 'geolocation', { configurable: true, get: () => geo });
};

test('sconti: la posizione si chiede solo dopo il tocco sul pulsante', async ({ page }) => {
  await page.addInitScript(finto);
  await page.goto('/discounts');
  await expect(page.getByTestId('geo-invito')).toContainText('Vuoi trovare gli sconti vicino a te?');
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.__richiestePosizione)).toBe(0);

  await page.getByTestId('discounts-locate-btn').click();
  await expect(page.getByText('· ordinati per distanza')).toBeVisible();
  expect(await page.evaluate(() => window.__richiestePosizione)).toBe(1);
  await expect(page.getByTestId('geo-invito')).toHaveCount(0);
  await expect(page.getByTestId('discounts-locate-btn')).toHaveText(/Aggiorna posizione/);
});

test('mappa: nessuna richiesta di posizione all\'apertura', async ({ page }) => {
  await page.addInitScript(finto);
  await page.goto('/map');
  await expect(page.getByTestId('geo-invito')).toBeVisible();
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.__richiestePosizione)).toBe(0);
  await page.getByTestId('locate-me-btn').click();
  await expect(page.getByTestId('locate-me-btn')).toHaveText(/Aggiorna posizione/);
  expect(await page.evaluate(() => window.__richiestePosizione)).toBe(1);
});

test('home: niente «metà prezzo» né «migliaia di romani»', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('hero-sottotitolo')).toHaveText('Scopri quanto puoi risparmiare nel tuo quartiere.');
  const testo = await page.locator('body').innerText();
  expect(testo).not.toMatch(/metà prezzo/i);
  expect(testo).not.toMatch(/migliaia/i);
});
