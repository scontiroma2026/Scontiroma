// Foto della home e delle pagine pubbliche: servite dal nostro sito, mai da servizi di terzi
// (Unsplash e simili), così nessuno riceve l'IP dei visitatori.
// 1) scansione del sorgente: fallisce se compare un URL esterno di immagine;
// 2) nel browser (iPhone 13 e Pixel 7): nessuna richiesta di immagini verso altri domini,
//    le foto della home si caricano davvero. Con E2E_SCREEN_FOTO=<cartella> salva gli screenshot.
const fs = require('fs');
const path = require('path');
const { devices } = require('@playwright/test');
const { test, expect } = require('../fixtures');

const RADICE = path.join(__dirname, '..', '..', '..');
// Eccezione dichiarata: i riquadri della mappa (OpenStreetMap) hanno una regola a parte (vedi 30-mappe).
const MAPPA = /tile\.openstreetmap\.org/;
const CARTELLA_SCREEN = process.env.E2E_SCREEN_FOTO || '';

function file(dir) {
  const out = [];
  for (const nome of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, nome.name);
    if (nome.isDirectory()) out.push(...file(p));
    else if (/\.(jsx?|tsx?|css|html)$/.test(nome.name)) out.push(p);
  }
  return out;
}

test('sorgente: nessun URL esterno di immagini nel sito pubblico', () => {
  const trovati = [];
  const fonti = [...file(path.join(RADICE, 'frontend', 'src')), path.join(RADICE, 'frontend', 'public', 'index.html')];
  for (const f of fonti) {
    const righe = fs.readFileSync(f, 'utf8').split('\n');
    righe.forEach((r, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(r)) return; // commenti
      const estUrl = /https?:\/\/[^\s"'`)]+/g;
      for (const u of r.match(estUrl) || []) {
        if (MAPPA.test(u)) continue;
        const immagine = /\.(jpe?g|png|webp|gif|avif|svg)(\?|$)/i.test(u)
          || /unsplash|pexels|pixabay|picsum|imgur|cloudinary|googleusercontent|placeholder\.com|placehold|loremflickr/i.test(u);
        if (immagine) trovati.push(`${path.relative(RADICE, f)}:${i + 1} ${u}`);
      }
    });
  }
  expect(trovati, 'URL esterni di immagini nel sorgente').toEqual([]);
});

const DISPOSITIVI = [['iPhone 13', devices['iPhone 13']], ['Pixel 7', devices['Pixel 7']]];

for (const [nome, disp] of DISPOSITIVI) {
  test.describe(nome, () => {
    const { defaultBrowserType, ...opz } = disp;
    test.use({ ...opz });

    test(`home e pagine pubbliche: foto locali e visibili (${nome})`, async ({ page, baseURL }) => {
      const host = new URL(baseURL).hostname;
      const esterne = [];
      page.on('request', (r) => {
        const u = new URL(r.url());
        if (!['http:', 'https:'].includes(u.protocol) || u.hostname === host) return;
        if (r.resourceType() === 'image' && !MAPPA.test(r.url())) esterne.push(r.url());
      });

      for (const rotta of ['/', '/privacy', '/cookies', '/termini', '/login', '/register', '/discounts']) {
        await page.goto(rotta);
        await page.waitForLoadState('networkidle');
      }

      await page.goto('/');
      await expect(page.locator('h1').first()).toBeVisible();
      await page.waitForLoadState('networkidle');
      // tutte le foto della home sono caricate (larghezza naturale > 0) e vengono dal nostro sito
      const foto = await page.$$eval('img', (els) => els.map((e) => ({ src: e.currentSrc || e.src, ok: e.complete && e.naturalWidth > 0 })));
      expect(foto.length).toBeGreaterThan(0);
      for (const f of foto) {
        expect(f.ok, `foto non caricata: ${f.src}`).toBe(true);
        expect(new URL(f.src, baseURL).hostname).toBe(host);
      }
      if (CARTELLA_SCREEN) {
        fs.mkdirSync(CARTELLA_SCREEN, { recursive: true });
        const sigla = nome.replace(/\s+/g, '-').toLowerCase();
        await page.screenshot({ path: path.join(CARTELLA_SCREEN, `home-${sigla}.png`) });
        await page.screenshot({ path: path.join(CARTELLA_SCREEN, `home-${sigla}-intera.png`), fullPage: true });
      }
      expect(esterne, 'immagini richieste a domini esterni').toEqual([]);
    });
  });
}
