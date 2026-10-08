// Pagina pubblica «Per i commercianti» (/per-i-commercianti): titolo, 3 passi, FAQ, bottone verso la
// registrazione commerciante, riquadro video con segnaposto, link da menu e footer, testi senza promesse.
const { test, expect } = require('../fixtures');

test.use({ viewport: { width: 390, height: 844 } });

const VIETATI = [/-\s?\d+\s?%/, /\d+\s?%/, /nessun vincolo/i, /gratis per sempre/i, /nessuna commissione/i, /€/];

test('per i commercianti: contenuti, video segnaposto e registrazione', async ({ page }) => {
  await page.goto('/per-i-commercianti');
  const pagina = page.getByTestId('per-i-commercianti-page');
  await expect(pagina.getByRole('heading', { level: 1 })).toBeVisible();
  for (const n of [1, 2, 3]) await expect(page.getByTestId(`passo-${n}`)).toBeVisible();
  await expect(pagina.locator('details')).not.toHaveCount(0);
  // Senza il file /video/commercianti.mp4 compare il segnaposto
  await expect(page.getByTestId('video-segnaposto')).toContainText('Video in arrivo');
  await expect(page.getByTestId('video-commercianti')).toHaveCount(0);
  // Nessuna percentuale, prezzo o promessa vietata
  const testo = await pagina.innerText();
  for (const re of VIETATI) expect(testo, `testo vietato ${re}`).not.toMatch(re);
  expect(testo).toContain('Roma e dintorni');
  // Bottone verso la registrazione commerciante
  await page.getByTestId('cta-registra-attivita').click();
  await expect(page).toHaveURL(/\/register\?role=merchant/);
  await expect(page.getByTestId('register-page')).toBeVisible();
});

test('per i commercianti: il video compare se il file esiste', async ({ page }) => {
  await page.route('**/video/commercianti.mp4', (route) =>
    route.fulfill({ status: 200, contentType: 'video/mp4', body: Buffer.alloc(16) }));
  await page.goto('/per-i-commercianti');
  await expect(page.getByTestId('video-commercianti')).toBeVisible();
  await expect(page.getByTestId('video-segnaposto')).toHaveCount(0);
});

test('per i commercianti: link dal footer e dal menu', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('footer-commercianti').click();
  await expect(page).toHaveURL(/\/per-i-commercianti$/);
  await page.goto('/');
  await page.getByTestId('landing-footer-commercianti').click();
  await expect(page).toHaveURL(/\/per-i-commercianti$/);
  await page.goto('/discounts');
  await page.getByTestId('mobile-menu-btn').click();
  await page.getByRole('link', { name: 'Per i commercianti' }).first().click();
  await expect(page).toHaveURL(/\/per-i-commercianti$/);
});

test('per i commercianti: 44 px, contrasto, caratteri e niente scroll orizzontale', async ({ page }) => {
  await page.goto('/per-i-commercianti');
  await expect(page.getByTestId('per-i-commercianti-page')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const r = await page.evaluate(() => {
    const rgba = (css) => { const m = css.match(/[\d.]+/g); return m && m.length >= 3 ? { r: +m[0], g: +m[1], b: +m[2], a: m.length > 3 ? +m[3] : 1 } : null; };
    const sopra = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
    const lum = (c) => { const k = [c.r, c.g, c.b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2]; };
    const rapporto = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const fondo = (el) => {
      let base = { r: 255, g: 255, b: 255, a: 1 };
      const catena = [];
      for (let e = el; e; e = e.parentElement) catena.push(e);
      for (const e of catena.reverse()) {
        const cs = getComputedStyle(e);
        if (cs.backgroundImage && cs.backgroundImage !== 'none') {
          const c = (cs.backgroundImage.match(/rgba?\([^)]*\)/g) || []).map(rgba).filter(Boolean);
          if (c.length) { base = sopra(c[0], base); continue; }
        }
        const c = rgba(cs.backgroundColor);
        if (c && c.a > 0) base = sopra(c, base);
      }
      return base;
    };
    const errori = [], piccoli = [], famiglie = new Set();
    for (const el of document.querySelectorAll('main *')) {
      const cs = getComputedStyle(el);
      const rc = el.getBoundingClientRect();
      if (rc.width === 0 || rc.height === 0 || el.closest('svg, [aria-hidden="true"]')) continue;
      if ([...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) {
        famiglie.add(cs.fontFamily.split(',')[0].replace(/["']/g, '').trim());
        const colore = rgba(cs.color);
        const f = fondo(el);
        const grande = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && +cs.fontWeight >= 700);
        const val = rapporto(sopra(colore, f), f);
        if (val < (grande ? 3 : 4.5)) errori.push(`${el.tagName} «${el.textContent.trim().slice(0, 30)}» ${val.toFixed(2)}`);
      }
      if (el.matches('button, a[data-testid="cta-registra-attivita"], summary') && rc.height < 43.5) piccoli.push(`${el.tagName} ${Math.round(rc.height)}px`);
    }
    return { errori, piccoli, famiglie: [...famiglie], eccesso: document.documentElement.scrollWidth - window.innerWidth };
  });
  expect(r.piccoli, 'elementi sotto i 44 px').toEqual([]);
  expect(r.errori, 'contrasto sotto soglia').toEqual([]);
  expect(r.eccesso).toBeLessThanOrEqual(0);
  for (const f of r.famiglie) expect(['Fraunces', 'Manrope']).toContain(f);
});
