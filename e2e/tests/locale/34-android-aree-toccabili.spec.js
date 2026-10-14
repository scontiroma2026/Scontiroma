// Android economico a schermo piccolo (emulazione, NON un telefono vero): nessuno scroll orizzontale,
// aree toccabili di almeno 44 px per i comandi principali, nessun testo sotto i 12 px nei punti corretti.
const { test, expect, registra, creaOffertaApprovata, loginNelBrowser } = require('../fixtures');

test.use({
  viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-A105F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Mobile Safari/537.36',
});

const piccoli = (page, selettore) => page.evaluate((sel) => [...document.querySelectorAll(sel)]
  .filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; })
  .filter((e) => e.getBoundingClientRect().height < 43.5)
  .map((e) => `${e.tagName} ${(e.innerText || e.getAttribute('data-testid') || '').trim().slice(0, 30)} h=${Math.round(e.getBoundingClientRect().height)}`), selettore);

const testoSotto12 = (page) => page.evaluate(() => [...document.querySelectorAll('body *')]
  .filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; })
  .filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
  .filter((e) => parseFloat(getComputedStyle(e).fontSize) < 12)
  .map((e) => `${e.tagName} ${e.textContent.trim().slice(0, 30)} ${getComputedStyle(e).fontSize}`));

test('Android piccolo: home senza scroll orizzontale, FAQ e piè di pagina toccabili, testi leggibili', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  expect(await piccoli(page, 'details > summary')).toEqual([]);
  expect(await piccoli(page, '[data-testid="legal-footer"] nav a, [data-testid="legal-footer"] nav button')).toEqual([]);
  expect(await testoSotto12(page)).toEqual([]);
});

test('Android piccolo: accesso e iscrizione senza scroll orizzontale, comandi toccabili', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByTestId('login-page')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  expect(await piccoli(page, '[data-testid="login-page"] form a, [data-testid="login-page"] button')).toEqual([]);
  await page.goto('/register');
  await expect(page.getByTestId('register-page')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  const casella = await page.getByTestId('legal-accept').boundingBox();
  expect(casella.width).toBeGreaterThanOrEqual(24);
});

test('Android piccolo: scheda negozio e area commerciante', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  await creaOffertaApprovata(request, m.token, { title: `Android e2e ${Date.now()}` });
  await loginNelBrowser(page, m.email, m.password);
  for (const url of ['/discounts', '/merchant/dashboard', '/merchant/discount', '/merchant/scan']) {
    await page.goto(url);
    await expect(page.locator('main').first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), `${url}: scroll orizzontale`).toBeLessThanOrEqual(0);
    expect(await testoSotto12(page), `${url}: testi sotto 12 px`).toEqual([]);
  }
  // il comando «Offerta attiva» ha un'area toccabile di almeno 44 px (anche oltre il disegno)
  await page.goto('/merchant/discount');
  const sw = page.getByTestId('disc-active');
  await sw.scrollIntoViewIfNeeded();
  const area = await sw.evaluate((e) => { const c = getComputedStyle(e, '::after'); return { h: parseFloat(c.height), pos: c.position }; });
  expect(area.pos).toBe('absolute');
  expect(area.h).toBeGreaterThanOrEqual(44);
});
