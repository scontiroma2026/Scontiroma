// Area commerciante, variante «D · Bianco vivo»: fondo chiaro, solo Fraunces e Manrope,
// nessuno scroll orizzontale a 390 px, aree toccabili da almeno 44 px.
const { test, expect, registra, creaOffertaApprovata, loginNelBrowser } = require('../fixtures');

const PAGINE = ['/merchant/dashboard', '/merchant/discount', '/merchant/discount?tab=archivio', '/merchant/scan'];

test.use({ viewport: { width: 390, height: 844 } });

test('area commerciante: fondo chiaro, Fraunces e Manrope, nessuno scroll orizzontale a 390 px', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  await creaOffertaApprovata(request, m.token, { title: `Menù chiaro e2e ${Date.now()}` });
  await loginNelBrowser(page, m.email, m.password);

  for (const url of PAGINE) {
    await page.goto(url);
    await expect(page.locator('main h1').first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);

    const r = await page.evaluate(() => {
      const luminanza = (css) => {
        const c = css.match(/\d+(\.\d+)?/g).map(Number).slice(0, 3).map((v) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
      };
      const prima = (f) => f.split(',')[0].replace(/["']/g, '').trim();
      const famiglie = new Set();
      for (const el of document.querySelectorAll('main, main *, header, header *')) {
        if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
        famiglie.add(prima(getComputedStyle(el).fontFamily));
      }
      return {
        sfondoBody: getComputedStyle(document.body).backgroundColor,
        lumBody: luminanza(getComputedStyle(document.body).backgroundColor),
        lumTesto: luminanza(getComputedStyle(document.querySelector('main')).color),
        h1: prima(getComputedStyle(document.querySelector('main h1')).fontFamily),
        famiglie: [...famiglie].sort(),
        eccesso: document.documentElement.scrollWidth - window.innerWidth,
        manrope: document.fonts.check('400 16px Manrope'),
        fraunces: document.fonts.check('700 30px Fraunces'),
      };
    });

    expect(r.lumBody, `${url}: fondo ${r.sfondoBody}`).toBeGreaterThan(0.9); // bianco o quasi
    expect(r.lumTesto, `${url}: il testo deve essere scuro`).toBeLessThan(0.1);
    expect(r.h1, url).toBe('Fraunces');
    expect(r.famiglie, `${url}: famiglie di carattere usate`).toEqual(expect.arrayContaining(['Manrope']));
    for (const f of r.famiglie) expect(['Fraunces', 'Manrope'], `${url}: carattere inatteso ${f}`).toContain(f);
    expect(r.eccesso, `${url}: scroll orizzontale`).toBeLessThanOrEqual(0);
    expect(r.manrope && r.fraunces).toBe(true);
  }
});

test('area commerciante: pulsanti e campi principali alti almeno 44 px', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  await loginNelBrowser(page, m.email, m.password);

  const troppoPiccoli = async (selettori) => page.evaluate((sel) => sel.flatMap((s) =>
    [...document.querySelectorAll(s)].filter((e) => e.getBoundingClientRect().width > 0)
      .filter((e) => e.getBoundingClientRect().height < 43.5).map((e) => `${s}: ${Math.round(e.getBoundingClientRect().height)}px`)), selettori);

  await page.goto('/merchant/dashboard');
  await expect(page.getByTestId('go-scan-btn')).toBeVisible();
  expect(await troppoPiccoli(['[data-testid=go-scan-btn]', '[data-testid=mobile-menu-btn]', '[data-testid=security-link]', '[data-testid=create-offer-btn]'])).toEqual([]);

  await page.goto('/merchant/discount');
  await expect(page.getByTestId('disc-form')).toHaveAttribute('data-loaded', '1');
  expect(await troppoPiccoli(['[data-testid=disc-title]', '[data-testid=disc-original]', '[data-testid=disc-submit]', '[data-testid^=offer-tab-]', '[data-testid^=disc-uses-]'])).toEqual([]);

  await page.goto('/merchant/scan');
  expect(await troppoPiccoli(['[data-testid=scan-code-input]', '[data-testid=scan-verify-btn]'])).toEqual([]);
});

test('area commerciante: il resto del sito resta scuro', async ({ page }) => {
  await page.goto('/');
  const lum = await page.evaluate(() => {
    const c = getComputedStyle(document.body).backgroundColor.match(/\d+/g).map(Number);
    return (c[0] + c[1] + c[2]) / 3;
  });
  expect(lum).toBeLessThan(40);
});
