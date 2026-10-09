// Zona senza offerte: scheda «Stiamo arrivando nella tua zona» con due azioni.
// Il voto è solo un contatore per zona (nessun dato personale); un voto per zona e per browser.
const { test, expect, loginNelBrowser } = require('../fixtures');
const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_MASTER_PASSWORD } = require('../env');

test.use({ viewport: { width: 390, height: 844 } });

// Dentro la pagina: contrasto di ogni testo della scheda e altezza dei pulsanti.
function misuraScheda() {
  const num = (css) => (css.match(/[\d.]+/g) || []).map(Number);
  const lum = ([r, g, b]) => {
    const k = [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
  };
  const rapporto = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const fondo = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const c = num(getComputedStyle(e).backgroundColor);
      if (c.length >= 3 && (c.length === 3 || c[3] === 1)) return c.slice(0, 3);
    }
    return [255, 255, 255];
  };
  const scheda = document.querySelector('[data-testid="scheda-zona-vuota"]');
  const errori = [];
  for (const el of [scheda, ...scheda.querySelectorAll('*')]) {
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const cs = getComputedStyle(el);
    const colore = num(cs.color);
    const grande = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && +cs.fontWeight >= 700);
    const r = rapporto(colore.slice(0, 3), fondo(el));
    if (r < (grande ? 3 : 4.5)) errori.push(`${el.tagName} «${el.textContent.trim().slice(0, 30)}» ${r.toFixed(2)}:1`);
  }
  const piccoli = [...scheda.querySelectorAll('button')].filter((b) => b.getBoundingClientRect().height < 43.5).map((b) => b.textContent.trim());
  const bg = num(getComputedStyle(document.body).backgroundColor);
  return { errori, piccoli, lumFondo: lum(bg), eccesso: document.documentElement.scrollWidth - window.innerWidth };
}

async function interesseAdmin(page) {
  await loginNelBrowser(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto('/admin');
  await page.getByTestId('master-pw').fill(ADMIN_MASTER_PASSWORD);
  await page.getByTestId('master-submit').click();
  await expect(page.getByTestId('lancio-interesse')).toBeVisible();
}

test('zona senza offerte: scheda, controlli 44 px e contrasto', async ({ page }) => {
  await page.goto('/discounts');
  await page.getByTestId('filter-zone').selectOption('Aurelio');
  const scheda = page.getByTestId('scheda-zona-vuota');
  await expect(scheda).toBeVisible();
  await expect(scheda.getByRole('heading', { name: 'Stiamo arrivando nella tua zona' })).toBeVisible();
  await expect(scheda).toContainText('Qui non ci sono ancora offerte. Stiamo cercando i primi negozi: torna a trovarci presto.');
  await expect(scheda.getByRole('button', { name: 'Vedi le offerte nelle altre zone' })).toBeVisible();
  await expect(scheda.getByRole('button', { name: 'Fammi sapere quando arrivate' })).toBeVisible();
  // Nessun campo da compilare, nessuna promessa sui prezzi
  await expect(scheda.locator('input, textarea')).toHaveCount(0);
  expect(await scheda.innerText()).not.toMatch(/-\s?50\s?%|metà prezzo|sconto del/i);

  const r = await page.evaluate(misuraScheda);
  expect(r.lumFondo, 'fondo chiaro').toBeGreaterThan(0.9);
  expect(r.errori, 'contrasto sotto soglia').toEqual([]);
  expect(r.piccoli, 'pulsanti sotto i 44 px').toEqual([]);
  expect(r.eccesso, 'scroll orizzontale').toBeLessThanOrEqual(0);
});

test('zona senza offerte: «Fammi sapere» conta un voto, ringrazia e non si ripete', async ({ page }) => {
  await page.goto('/discounts');
  await page.getByTestId('filter-zone').selectOption('Cassia');
  const richieste = [];
  page.on('request', (rq) => { if (rq.url().includes('/api/interesse-zona')) richieste.push(rq.postData()); });
  await page.getByTestId('scheda-interesse').click();
  await expect(page.getByTestId('interesse-grazie')).toContainText('Grazie');
  await expect(page.getByTestId('scheda-interesse')).toHaveCount(0);
  expect(richieste).toEqual([JSON.stringify({ zona: 'Cassia' })]); // solo la zona: nessun altro dato

  // Ricaricando la pagina lo stesso browser ha già votato: ringraziamento subito, nessun secondo voto
  await page.reload();
  await page.getByTestId('filter-zone').selectOption('Cassia');
  await expect(page.getByTestId('interesse-grazie')).toBeVisible();
  await expect(page.getByTestId('scheda-interesse')).toHaveCount(0);
  expect(richieste).toHaveLength(1);

  // Un'altra zona non è ancora votata
  await page.getByTestId('filter-zone').selectOption('Aurelio');
  await expect(page.getByTestId('scheda-interesse')).toBeVisible();

  // L'admin vede la tabella «Interesse per zona» (zona, voti), leggibile da telefono
  await interesseAdmin(page);
  const riga = page.getByTestId('interesse-riga').filter({ hasText: 'Cassia' });
  await expect(riga).toHaveCount(1);
  await expect(riga.locator('td').nth(1)).toHaveText(/^[1-9]\d*$/);
  const eccesso = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(eccesso).toBeLessThanOrEqual(0);
});

test('zona senza offerte: «Vedi le offerte nelle altre zone» azzera il filtro', async ({ page }) => {
  await page.goto('/discounts');
  await page.getByTestId('filter-zone').selectOption('Monte Mario');
  await expect(page.getByTestId('scheda-zona-vuota')).toBeVisible();
  await page.getByTestId('scheda-altre-zone').click();
  await expect(page.getByTestId('filter-zone')).toHaveValue('');
  await expect(page.getByTestId('scheda-zona-vuota')).toHaveCount(0);
  await expect(page.getByTestId('results-count')).not.toHaveText(/^0 sconti/);
});

test('zona con offerte: nessuna scheda', async ({ page }) => {
  await page.goto('/discounts');
  await page.getByTestId('filter-zone').selectOption('Garbatella');
  await expect(page.getByTestId('results-count')).not.toHaveText(/^0 sconti/);
  await expect(page.getByTestId('scheda-zona-vuota')).toHaveCount(0);
});

test('endpoint interesse-zona: zona non valida rifiutata', async ({ request }) => {
  const r = await request.post(`${require('../env').API}/api/interesse-zona`, { data: { zona: 'Atlantide' }, failOnStatusCode: false });
  expect(r.status()).toBe(400);
});
