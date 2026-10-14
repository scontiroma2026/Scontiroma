// Pre-lancio: lista d'attesa con doppio consenso, pagina di conferma, disiscrizione e riquadro admin.
// Il file accende PRELAUNCH_MODE sul server di prova (/__e2e/prelancio) e lo rispegne alla fine; l'ultimo test
// verifica che con l'interruttore spento la home e il catalogo siano quelli di sempre. Nessuna email vera:
// i token arrivano da /__e2e/lista-attesa/token e l'avviso di lancio è un invio finto.
const { test, expect, API, unico, chiama, registra, admin, loginNelBrowser, PASSWORD } = require('../fixtures');
const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_MASTER_PASSWORD } = require('../env');

test.describe.configure({ mode: 'serial' });
test.use({ viewport: { width: 390, height: 844 } });

async function interruttore(request, acceso) {
  const r = await request.post(`${API}/__e2e/prelancio`, { params: { acceso: String(acceso) } });
  expect(r.status()).toBe(200);
}
async function datiLink(request, email) {
  const t = await request.get(`${API}/__e2e/lista-attesa/token`, { params: { email } });
  expect(t.status()).toBe(200);
  return t.json();
}
async function conteggi(request) {
  const a = await admin(request);
  const r = await chiama(request, 'GET', '/admin/lista-attesa', { token: a.token, headers: a.headers });
  expect(r.status).toBe(200);
  return r.data;
}

test.beforeAll(async ({ request }) => { await interruttore(request, true); });
test.afterAll(async ({ request }) => { await interruttore(request, false); });

// Dentro la pagina: contrasto di ogni testo dell'elemento, altezza dei controlli, scroll orizzontale.
function misura(selettore) {
  const num = (css) => (css.match(/[\d.]+/g) || []).map(Number);
  const lum = ([r, g, b]) => {
    const k = [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
  };
  const rapporto = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const fondo = (el) => {
    for (let e = el; e; e = e.parentElement) {
      // pulsante con sfumatura fucsia→viola: si misura sul tono più chiaro (#D81B72), il caso peggiore
      if (/gradient/.test(getComputedStyle(e).backgroundImage)) return [216, 27, 114];
      const c = num(getComputedStyle(e).backgroundColor);
      if (c.length >= 3 && (c.length === 3 || c[3] === 1)) return c.slice(0, 3);
    }
    return [255, 255, 255];
  };
  const radice = document.querySelector(selettore);
  const errori = [];
  for (const el of [radice, ...radice.querySelectorAll('*')]) {
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    if (el.closest('[aria-hidden="true"]')) continue;
    const cs = getComputedStyle(el);
    const grande = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && +cs.fontWeight >= 700);
    if (el.classList.contains('text-grad')) continue; // testo con sfumatura: controllato a vista, non con un solo colore
    const r = rapporto(num(cs.color).slice(0, 3), fondo(el));
    if (r < (grande ? 3 : 4.5)) errori.push(`${el.tagName} «${el.textContent.trim().slice(0, 30)}» ${r.toFixed(2)}:1`);
  }
  // Controlli: pulsanti, link, campo email e la riga della casella (il tocco vale su tutta l'etichetta, non sul quadratino)
  const piccoli = [...radice.querySelectorAll('input[type="email"], button, a, label:has(input[type="checkbox"])')]
    .filter((e) => !e.closest('[aria-hidden="true"]') && e.getBoundingClientRect().height > 0 && e.getBoundingClientRect().height < 43.5)
    .map((e) => `${e.tagName} «${(e.textContent || e.name || '').trim().slice(0, 25)}» ${e.getBoundingClientRect().height}`);
  return { errori, piccoli, lumFondo: lum(num(getComputedStyle(document.body).backgroundColor)),
    eccesso: document.documentElement.scrollWidth - window.innerWidth };
}

test('prelancio acceso: la home dice «Stiamo arrivando» senza data e ha il modulo', async ({ page }) => {
  await page.goto('/');
  const home = page.getByTestId('prelaunch-home');
  await expect(home).toBeVisible();
  await expect(page.getByTestId('landing-page')).toHaveCount(0);
  await expect(page.getByTestId('prelaunch-titolo')).toContainText('Stiamo arrivando a Roma e dintorni');
  const testo = await home.innerText();
  expect(testo).toContain('maggiorenni (18+)');
  expect(testo).toContain('le offerte dei negozi vicino a te');
  // nessuna data, prezzo, percentuale o promessa vietata
  expect(testo).not.toMatch(/\d{1,2}\s?\/\s?\d{1,2}|ottobre|novembre|%|€|gratis per sempre|nessuna commissione|prezzo bloccato/i);

  // modulo: casella NON preselezionata, testo chiaro, link alla Privacy esistente
  const modulo = page.getByTestId('prelaunch-modulo');
  await expect(page.getByTestId('lista-attesa-consenso')).not.toBeChecked();
  await expect(modulo).toContainText("Voglio ricevere un'email quando Sconti Roma è online");
  const privacy = page.getByTestId('lista-attesa-privacy');
  await expect(privacy).toHaveAttribute('href', '/privacy');

  // tema chiaro, Manrope, controlli da 44 px, testo contrastato, nessuno scroll laterale
  const font = await page.getByTestId('prelaunch-titolo').evaluate((e) => getComputedStyle(e).fontFamily);
  expect(font).toMatch(/^"?Manrope/);
  const r = await page.evaluate(misura, '[data-testid="prelaunch-home"]');
  expect(r.lumFondo, 'fondo chiaro').toBeGreaterThan(0.9);
  expect(r.errori, 'contrasto sotto soglia').toEqual([]);
  expect(r.piccoli, 'controlli sotto i 44 px').toEqual([]);
  expect(r.eccesso, 'scroll orizzontale').toBeLessThanOrEqual(0);

  // il campo trappola esiste ma non si vede
  const trappola = page.getByTestId('lista-attesa-trappola');
  await expect(trappola).toHaveCount(1);
  const box = await trappola.boundingBox();
  expect(box === null || box.x < 0 || box.width <= 1).toBeTruthy();
});

test('prelancio acceso: le funzioni per i negozi restano attive', async ({ page, request }) => {
  await page.goto('/');
  await page.getByTestId('prelaunch-negozio-iscriviti').click();
  await expect(page).toHaveURL(/\/register\?role=merchant/);
  await expect(page.getByTestId('reg-submit')).toBeVisible();
  // un negozio si iscrive e carica un'offerta: resta «in attesa», invisibile ai clienti
  const m = await registra(request, 'merchant');
  const c = await chiama(request, 'POST', '/merchants/me/discount', { token: m.token, body: {
    title: `Offerta prelancio ${Date.now()}`, description: 'Descrizione di prova.', original_price: 40, discounted_price: 20,
    validity_info: 'Solo mercoledì', max_uses_per_month: 1 } });
  expect(c.status, JSON.stringify(c.data)).toBe(200);
  expect(c.data.discount.approval_status).toBe('pending');
  const pubbliche = await chiama(request, 'GET', '/discounts');
  expect(pubbliche.data.discounts.map((d) => d.id)).not.toContain(c.data.discount.id);
});

test('lista d\'attesa: consenso obbligatorio, doppio consenso, pagina di conferma e conteggi admin', async ({ page, request }) => {
  const prima = await conteggi(request);
  const email = unico('attesa');
  await page.goto('/?src=instagram');
  await page.getByTestId('lista-attesa-email').fill(email);

  // senza spuntare la casella non parte nulla
  await page.getByTestId('lista-attesa-invia').click();
  await expect(page.getByTestId('lista-attesa-errore')).toContainText('spunta la casella');
  const dopoErrore = await conteggi(request);
  expect(dopoErrore.da_confermare).toBe(prima.da_confermare);

  // con il consenso: si manda solo email, consenso, fonte e trappola vuota
  const corpi = [];
  page.on('request', (rq) => { if (rq.url().endsWith('/api/prelaunch/waitlist')) corpi.push(JSON.parse(rq.postData())); });
  await page.getByTestId('lista-attesa-consenso').check();
  await page.getByTestId('lista-attesa-invia').click();
  await expect(page.getByTestId('lista-attesa-grazie')).toContainText("tocca il link per confermare l'iscrizione");
  expect(corpi).toEqual([{ email, consenso: true, src: 'instagram', sito_web: '' }]);
  // nessun cookie nuovo né dati salvati sul telefono
  expect(await page.context().cookies()).toEqual([]);
  expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => /attesa|waitlist/i.test(k)))).toEqual([]);

  // finché non conferma resta «da confermare»
  const mid = await conteggi(request);
  expect(mid.da_confermare).toBe(prima.da_confermare + 1);
  expect(mid.confermate).toBe(prima.confermate);

  // il link dell'email porta alla pagina «Iscrizione confermata»
  const link = await datiLink(request, email);
  await page.goto(`/lista-attesa/conferma?token=${encodeURIComponent(link.token)}`);
  await expect(page.getByTestId('lista-attesa-conferma-ok')).toContainText('Iscrizione confermata');
  const alt = await page.getByTestId('lista-attesa-conferma-ok').getByRole('link').boundingBox();
  expect(alt.height).toBeGreaterThanOrEqual(44);
  // monouso
  await page.goto(`/lista-attesa/conferma?token=${encodeURIComponent(link.token)}`);
  await expect(page.getByTestId('lista-attesa-conferma-errore')).toContainText('Link non valido');
  await page.goto('/lista-attesa/conferma');
  await expect(page.getByTestId('lista-attesa-conferma-errore')).toBeVisible();

  const dopo = await conteggi(request);
  expect(dopo.da_confermare).toBe(prima.da_confermare);
  expect(dopo.confermate).toBe(prima.confermate + 1);
  const ig = (x) => x.per_fonte.find((f) => f.fonte === 'instagram') || { confermata: 0 };
  expect(ig(dopo).confermata).toBe(ig(prima).confermata + 1);
});

test('lista d\'attesa: la stessa email dà la stessa risposta e non rivela nulla', async ({ request }) => {
  const email = unico('doppia');
  const corpo = { email, consenso: true };
  const a = await chiama(request, 'POST', '/prelaunch/waitlist', { body: corpo });
  const b = await chiama(request, 'POST', '/prelaunch/waitlist', { body: corpo });
  expect(a.status).toBe(200);
  expect([b.status, b.data]).toEqual([a.status, a.data]);
  const bot = await chiama(request, 'POST', '/prelaunch/waitlist', { body: { email: unico('bot'), consenso: true, sito_web: 'http://spam.example' } });
  expect([bot.status, bot.data]).toEqual([a.status, a.data]);
  expect((await chiama(request, 'POST', '/prelaunch/waitlist', { body: { email: unico('nc'), consenso: false } })).status).toBe(400);
});

test('disiscrizione: il link di ogni email porta a «Non riceverai più email»', async ({ page, request }) => {
  const email = unico('annulla');
  await chiama(request, 'POST', '/prelaunch/waitlist', { body: { email, consenso: true } });
  const link = await datiLink(request, email);
  await chiama(request, 'POST', '/prelaunch/waitlist/confirm', { body: { token: link.token } });
  const prima = await conteggi(request);
  await page.goto(`/lista-attesa/annulla?i=${link.id}&t=${link.utoken}`);
  await expect(page.getByTestId('lista-attesa-annulla-ok')).toContainText('Non riceverai più email');
  const dopo = await conteggi(request);
  expect(dopo.disiscritte).toBe(prima.disiscritte + 1);
  expect(dopo.confermate).toBe(prima.confermate - 1);
  await page.goto(`/lista-attesa/annulla?i=${link.id}&t=sbagliato`);
  await expect(page.getByTestId('lista-attesa-annulla-errore')).toBeVisible();
});

test('catalogo vuoto in prelancio: stesso invito, non una pagina vuota', async ({ page }) => {
  await page.goto('/discounts');
  await page.getByTestId('filter-zone').selectOption('Aurelio');
  const invito = page.getByTestId('catalogo-prelancio');
  await expect(invito).toBeVisible();
  await expect(invito).toContainText('Stiamo arrivando a Roma e dintorni');
  await expect(page.getByTestId('scheda-zona-vuota')).toHaveCount(0);
  await expect(page.getByTestId('catalogo-attesa-consenso')).not.toBeChecked();
  const r = await page.evaluate(misura, '[data-testid="catalogo-prelancio"]');
  expect(r.errori).toEqual([]);
  expect(r.piccoli).toEqual([]);
});

test('admin: conteggi per fonte, esportazione delle sole confermate e avviso di lancio idempotente', async ({ page, request }) => {
  const conf = unico('conf'); const nonConf = unico('nonconf'); const dis = unico('dis');
  for (const [e, src] of [[conf, 'volantino'], [nonConf, 'facebook'], [dis, 'passaparola']]) {
    await chiama(request, 'POST', '/prelaunch/waitlist', { body: { email: e, consenso: true, src } });
  }
  for (const e of [conf, dis]) {
    const l = await datiLink(request, e);
    await chiama(request, 'POST', '/prelaunch/waitlist/confirm', { body: { token: l.token } });
  }
  const ld = await datiLink(request, dis);
  await chiama(request, 'POST', '/prelaunch/waitlist/unsubscribe', { body: { i: ld.id, t: ld.utoken } });

  await loginNelBrowser(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto('/admin');
  await page.getByTestId('master-pw').fill(ADMIN_MASTER_PASSWORD);
  await page.getByTestId('master-submit').click();
  await page.getByTestId('tab-listaattesa').click();
  const pannello = page.getByTestId('admin-lista-attesa');
  await expect(pannello).toBeVisible();
  const c = await conteggi(request);
  await expect(page.getByTestId('attesa-da-confermare')).toHaveText(String(c.da_confermare));
  await expect(page.getByTestId('attesa-confermate')).toHaveText(String(c.confermate));
  await expect(page.getByTestId('attesa-disiscritte')).toHaveText(String(c.disiscritte));
  await expect(page.getByTestId('attesa-fonte-riga').filter({ hasText: 'Volantino' })).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  const pic = await page.evaluate(misura, '[data-testid="admin-lista-attesa"]');
  expect(pic.piccoli).toEqual([]);

  // esportazione: solo le confermate
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('attesa-esporta').click()]);
  const fs = require('fs');
  const csv = fs.readFileSync(await download.path(), 'utf8');
  expect(csv).toContain(conf);
  expect(csv).not.toContain(nonConf);
  expect(csv).not.toContain(dis);

  // avviso di lancio: serve la parola AVVISA
  await expect(page.getByTestId('attesa-da-avvisare')).toHaveText(String(c.avviso.da_avvisare));
  page.once('dialog', (d) => d.accept('sbagliata'));
  await page.getByTestId('attesa-invia-avviso').click();
  await expect(page.getByTestId('attesa-da-avvisare')).toHaveText(String(c.avviso.da_avvisare));
  page.once('dialog', (d) => d.accept('AVVISA'));
  await page.getByTestId('attesa-invia-avviso').click();
  await expect(page.getByTestId('attesa-da-avvisare')).toHaveText('0', { timeout: 20_000 });
  await expect(page.getByTestId('attesa-ultimo')).toContainText('inviate');

  const inviati = (await (await request.get(`${API}/__e2e/lista-attesa/avvisi`)).json()).destinatari;
  expect(inviati).toContain(conf);
  expect(inviati).not.toContain(nonConf);
  expect(inviati).not.toContain(dis);
  expect(new Set(inviati).size).toBe(inviati.length); // nessuno due volte
  // un secondo invio non manda altro
  const a = await admin(request);
  const di_nuovo = await chiama(request, 'POST', '/admin/lista-attesa/invia-avviso', { token: a.token, headers: a.headers, body: { conferma: 'AVVISA' } });
  expect(di_nuovo.data).toEqual({ avviato: false, da_inviare: 0 });
  const dopo = (await (await request.get(`${API}/__e2e/lista-attesa/avvisi`)).json()).destinatari;
  expect(dopo).toEqual(inviati);
});

test('prelancio spento: home e catalogo sono quelli di sempre', async ({ page, request }) => {
  await interruttore(request, false);
  await page.goto('/');
  await expect(page.getByTestId('landing-page')).toBeVisible();
  await expect(page.getByTestId('cta-start')).toBeVisible();
  await expect(page.getByTestId('prelaunch-home')).toHaveCount(0);
  await expect(page.getByTestId('lista-attesa-form')).toHaveCount(0);
  await page.goto('/discounts');
  await page.getByTestId('filter-zone').selectOption('Aurelio');
  await expect(page.getByTestId('scheda-zona-vuota')).toBeVisible();
  await expect(page.getByTestId('catalogo-prelancio')).toHaveCount(0);
  const r = await chiama(request, 'POST', '/prelaunch/waitlist', { body: { email: unico('spento'), consenso: true } });
  expect(r.status).toBe(404);
  const cfg = await chiama(request, 'GET', '/config/public');
  expect(cfg.data.prelaunch_mode).toBe(false);
  // le pagine dei link già spediti funzionano comunque
  await page.goto('/lista-attesa/conferma?token=inventato');
  await expect(page.getByTestId('lista-attesa-conferma-errore')).toBeVisible();
  await interruttore(request, true);
});
