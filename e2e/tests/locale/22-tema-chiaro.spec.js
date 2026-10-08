// Tema chiaro «Bianco vivo» su tutto il sito: fondo chiaro, solo Fraunces e Manrope, nessuno scroll
// orizzontale a 390 px e testo con contrasto di almeno 4.5:1 (3:1 per i testi grandi).
// La locandina stampabile (/locandina) è un foglio da stampare e resta fuori da questi controlli.
const { test, expect, registra, creaOffertaApprovata, loginNelBrowser } = require('../fixtures');
const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_MASTER_PASSWORD } = require('../env');

test.use({ viewport: { width: 390, height: 844 } });

// Eseguito dentro la pagina: misura fondo, caratteri, scroll e contrasto di ogni testo visibile.
function misura() {
  const rgba = (css) => {
    const m = css.match(/[\d.]+/g);
    if (!m || m.length < 3) return null;
    return { r: +m[0], g: +m[1], b: +m[2], a: m.length > 3 ? +m[3] : 1 };
  };
  const sopra = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const lum = (c) => {
    const k = [c.r, c.g, c.b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
  };
  const rapporto = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const prima = (f) => f.split(',')[0].replace(/["']/g, '').trim();
  const BIANCO = { r: 255, g: 255, b: 255, a: 1 };

  // Fondi possibili di un elemento: i colori pieni sotto il testo; un gradiente dà più colori (si prende il peggiore).
  const fondi = (el) => {
    let attuale = [BIANCO];
    const catena = [];
    for (let e = el; e; e = e.parentElement) catena.push(e);
    for (const e of catena.reverse()) {
      const cs = getComputedStyle(e);
      const img = cs.backgroundImage;
      if (img && img !== 'none') {
        if (/url\(/.test(img)) return null; // foto: non misurabile
        const colori = (img.match(/rgba?\([^)]*\)/g) || []).map(rgba).filter(Boolean);
        if (colori.length) { attuale = attuale.flatMap((base) => colori.map((c) => sopra(c, base))); continue; }
      }
      const c = rgba(cs.backgroundColor);
      if (c && c.a > 0) attuale = attuale.map((base) => sopra(c, base));
    }
    return attuale;
  };

  const errori = [];
  const famiglie = new Set();
  const radici = document.querySelectorAll('main, header, footer, [role="dialog"], [data-testid="cookie-banner"], [data-testid="app-feedback-banner"]');
  const visti = new Set();
  for (const radice of radici) {
    for (const el of [radice, ...radice.querySelectorAll('*')]) {
      if (visti.has(el)) continue;
      visti.add(el);
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
      if (el.closest('[aria-hidden="true"], svg, option, [disabled], style, script')) continue;
      if (el.closest('[data-solo-stampa], .leaflet-container')) continue;
      famiglie.add(prima(cs.fontFamily));
      if (cs.webkitTextFillColor === 'rgba(0, 0, 0, 0)' || cs.color === 'rgba(0, 0, 0, 0)') continue; // testo a gradiente (.text-grad)
      const colore = rgba(cs.color);
      const fondiEl = fondi(el);
      if (!colore || !fondiEl) continue;
      const grande = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && +cs.fontWeight >= 700);
      let peggiore = Infinity;
      for (const f of fondiEl) peggiore = Math.min(peggiore, rapporto(sopra(colore, f), f));
      if (peggiore < (grande ? 3 : 4.5)) {
        errori.push(`${el.tagName.toLowerCase()}${el.dataset.testid ? `[${el.dataset.testid}]` : ''} «${el.textContent.trim().slice(0, 40)}» ${peggiore.toFixed(2)}:1 (${cs.color})`);
      }
    }
  }
  // Pulsanti e campi: almeno 44 px di altezza
  const piccoli = [];
  for (const el of document.querySelectorAll('main button, main select, main textarea, main input:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=file]), header button, [data-testid="cookie-banner"] button, [data-testid="app-feedback-banner"] button')) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden' || el.closest('.leaflet-container, [aria-hidden="true"]') || el.disabled) continue;
    if (r.height < 43.5) piccoli.push(`${el.tagName.toLowerCase()}${el.dataset.testid ? `[${el.dataset.testid}]` : ''} «${(el.textContent || el.getAttribute('aria-label') || el.placeholder || '').trim().slice(0, 30)}» ${Math.round(r.height)}px`);
  }
  const bg = rgba(getComputedStyle(document.body).backgroundColor);
  return {
    piccoli: [...new Set(piccoli)].slice(0, 5),
    lumFondo: lum(bg),
    famiglie: [...famiglie].sort(),
    eccesso: document.documentElement.scrollWidth - window.innerWidth,
    errori: [...new Set(errori)].slice(0, 12),
  };
}

async function controlla(page, nome) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const r = await page.evaluate(misura);
  expect.soft(r.lumFondo, `${nome}: il fondo deve essere chiaro`).toBeGreaterThan(0.9);
  for (const f of r.famiglie) expect.soft(['Fraunces', 'Manrope'], `${nome}: carattere inatteso ${f}`).toContain(f);
  expect.soft(r.eccesso, `${nome}: scroll orizzontale`).toBeLessThanOrEqual(0);
  expect.soft(r.errori, `${nome}: contrasto sotto soglia`).toEqual([]);
  expect.soft(r.piccoli, `${nome}: pulsanti o campi sotto i 44 px`).toEqual([]);
}

test('tema chiaro: pagine pubbliche', async ({ page, request }) => {
  test.setTimeout(240_000);
  const m = await registra(request, 'merchant');
  const offerta = await creaOffertaApprovata(request, m.token, { title: `Tema chiaro ${Date.now()}` });
  const pagine = ['/', '/discounts', `/discounts/${offerta.id}`, '/map', '/login', '/register', '/forgot-password', '/reset-password?token=abc',
    '/support', `/n/${m.user.id}`, '/qr/INVALIDO', '/privacy', '/cookies', '/termini', '/recesso', '/payment/success', '/payment/cancel'];
  for (const url of pagine) {
    await page.goto(url);
    await expect(page.locator('main, h1').first()).toBeVisible();
    await controlla(page, url);
  }
  const h1 = await page.goto('/').then(() => page.evaluate(() => getComputedStyle(document.querySelector('h1')).fontFamily));
  expect(h1).toMatch(/^"?Fraunces/);
});

test('tema chiaro: banner dei cookie e delle stelle', async ({ page, request }) => {
  await page.goto('/');
  // Il banner si riapre con «Gestisci cookie» (evento del sito): la scelta già salvata dal test resta com'è
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('sr:open-cookie-banner')));
  await expect(page.getByTestId('cookie-banner')).toBeVisible();
  await controlla(page, 'banner cookie (preferenze)');
  await page.getByTestId('cookie-close').click(); // torna alla vista principale del banner
  await controlla(page, 'banner cookie (vista principale)');
  await page.getByTestId('cookie-reject').click();
  // Il banner con le stelle compare dopo 3 minuti di uso a un cliente con l'accesso fatto
  const c = await registra(request, 'client');
  await page.addInitScript(() => {
    localStorage.removeItem('app_feedback_dismissed_v1');
    localStorage.setItem('app_feedback_secondi_v1', '178');
  });
  await loginNelBrowser(page, c.email, c.password);
  await page.goto('/discounts');
  await expect(page.getByTestId('app-feedback-banner')).toBeVisible({ timeout: 15000 });
  await controlla(page, 'banner stelle');
});

test('tema chiaro: area cliente', async ({ page, request }) => {
  test.setTimeout(240_000);
  const m = await registra(request, 'merchant');
  const offerta = await creaOffertaApprovata(request, m.token, { title: `Tema chiaro cliente ${Date.now()}` });
  const c = await registra(request, 'client');
  await loginNelBrowser(page, c.email, c.password);
  await page.goto(`/discounts/${offerta.id}`);
  await page.getByTestId(`preferito-${m.user.id}`).click();
  for (const url of ['/dashboard', '/setup-security', '/subscribe', '/discounts?vista=preferiti']) {
    await page.goto(url);
    await expect(page.locator('main, h1').first()).toBeVisible();
    await controlla(page, url);
  }
  await page.goto(`/discounts/${offerta.id}`);
  await page.getByRole('button', { name: /Mostra QR Code|Genera QR/ }).click();
  await expect(page.getByTestId('qr-dialog')).toBeVisible();
  await controlla(page, 'finestra QR');
});

test('tema chiaro: area admin', async ({ page, request }) => {
  test.setTimeout(240_000);
  const m = await registra(request, 'merchant');
  await creaOffertaApprovata(request, m.token, { title: `Tema chiaro admin ${Date.now()}` });
  await loginNelBrowser(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto('/admin');
  await expect(page.getByTestId('master-pw')).toBeVisible();
  await controlla(page, '/admin (accesso)');
  await page.getByTestId('master-pw').fill(ADMIN_MASTER_PASSWORD);
  await page.getByTestId('master-submit').click();
  await expect(page.getByTestId('tab-merchants')).toBeVisible();
  await controlla(page, '/admin');
  const tabs = await page.locator('[data-testid^="tab-"]').evaluateAll((els) => els.map((e) => e.dataset.testid));
  for (const t of tabs) {
    await page.getByTestId(t).click();
    await page.waitForTimeout(600);
    await controlla(page, `/admin ${t}`);
  }
  await page.goto('/admin/master-reset');
  await controlla(page, '/admin/master-reset');
});
