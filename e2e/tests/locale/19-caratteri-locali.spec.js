// Caratteri ospitati sul nostro sito: nessuna richiesta a Google Fonts (né ad altri domini)
// e Fraunces, Manrope e Archivo Black si caricano dai file in /fonts.
const { test, expect } = require('../fixtures');

test('caratteri: serviti dal nostro sito, nessuna richiesta a domini esterni', async ({ page, baseURL }) => {
  const host = new URL(baseURL).hostname; // il server dell'API gira sulla stessa macchina (porta diversa)
  const esterne = [];
  const fontCaricati = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (!['http:', 'https:'].includes(u.protocol)) return; // data:, blob:
    // Le foto dimostrative degli sconti arrivano da Unsplash: non sono caratteri e restano fuori da questo test
    if (u.hostname !== host && u.hostname !== 'images.unsplash.com') esterne.push(r.url());
  });
  page.on('response', (r) => {
    if (new URL(r.url()).pathname.startsWith('/fonts/') && r.url().endsWith('.woff2')) {
      fontCaricati.push({ url: r.url(), ok: r.ok() });
    }
  });

  await page.goto('/');
  await expect(page.locator('h1').first()).toBeVisible();

  // Forza il caricamento delle tre famiglie (il browser scarica solo ciò che usa)
  const risultato = await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('700 40px Fraunces'),
      document.fonts.load('400 16px Manrope'),
      document.fonts.load('400 16px "Archivo Black"'),
    ]);
    await document.fonts.ready;
    return {
      fraunces: document.fonts.check('700 40px Fraunces'),
      manrope: document.fonts.check('400 16px Manrope'),
      archivo: document.fonts.check('400 16px "Archivo Black"'),
      h1: getComputedStyle(document.querySelector('h1')).fontFamily,
    };
  });

  expect(risultato.fraunces).toBe(true);
  expect(risultato.manrope).toBe(true);
  expect(risultato.archivo).toBe(true);
  expect(risultato.h1).toMatch(/^"?Fraunces/);

  expect(fontCaricati.length).toBeGreaterThan(0);
  for (const f of fontCaricati) expect(f.ok, f.url).toBe(true);
  expect(esterne).toEqual([]);
});
