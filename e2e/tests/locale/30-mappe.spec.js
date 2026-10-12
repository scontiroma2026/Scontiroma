// Mappa: sfondo Protomaps (file roma.pmtiles del sito) oppure, finché il file non c'è,
// tile pubblici di OpenStreetMap. In entrambi i casi l'attribuzione ODbL resta visibile.
// Nei test le mappe esterne sono bloccate (fixtures.js): si controllano le richieste, non i disegni.
const { test, expect } = require('../fixtures');

const PRIMI_BYTE = Buffer.from('PMTiles', 'latin1');

test('mappa senza file roma.pmtiles: ripiega su OpenStreetMap con attribuzione', async ({ page }) => {
  // Il sito (serve -s) risponde index.html con 200 al posto del file mancante: non deve ingannare la verifica.
  const richiesteOsm = [];
  page.on('request', (r) => { if (r.url().startsWith('https://tile.openstreetmap.org/')) richiesteOsm.push(r.url()); });
  await page.goto('/map');
  await expect(page.getByTestId('map-page')).toBeVisible();
  const attribuzione = page.locator('.leaflet-control-attribution');
  await expect(attribuzione).toContainText('OpenStreetMap contributors');
  await expect(attribuzione.locator('a[href="https://www.openstreetmap.org/copyright"]')).toHaveCount(1);
  await expect.poll(() => richiesteOsm.length).toBeGreaterThan(0);
});

test('mappa con file roma.pmtiles: tile Protomaps, nessuna richiesta a OpenStreetMap, attribuzione completa', async ({ page }) => {
  const richiesteOsm = [];
  const richiestePmtiles = [];
  page.on('request', (r) => { if (r.url().startsWith('https://tile.openstreetmap.org/')) richiesteOsm.push(r.url()); });
  await page.route('**/mappe/roma.pmtiles', (route) => {
    richiestePmtiles.push(route.request().headers()['range'] || '');
    // Finto file: i primi byte bastano per la verifica; il resto è vuoto (nessun tile disegnato)
    const corpo = Buffer.concat([PRIMI_BYTE, Buffer.alloc(16384 - PRIMI_BYTE.length)]);
    return route.fulfill({
      status: 206,
      headers: { 'Content-Range': `bytes 0-${corpo.length - 1}/${corpo.length}`, 'Content-Type': 'application/octet-stream' },
      body: corpo,
    });
  });
  await page.goto('/map');
  const attribuzione = page.locator('.leaflet-control-attribution');
  await expect(attribuzione).toContainText('OpenStreetMap contributors');
  await expect(attribuzione).toContainText('Protomaps');
  expect(richiestePmtiles.length).toBeGreaterThan(0);
  expect(richiestePmtiles[0]).toMatch(/^bytes=/); // lettura a intervalli, mai il file intero
  await page.waitForTimeout(500);
  expect(richiesteOsm).toEqual([]);
});
