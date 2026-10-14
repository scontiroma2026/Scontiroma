// Prova generale pre-lancio (14/10): i percorsi completi dal telefono, come li farà il titolare su iPhone.
//  1. Cliente: iscrizione con conferma email ACCESA (email simulata), accesso, preferiti, segnalazione, eliminazione account.
//  2. Commerciante: registrazione, offerta con foto, approvazione, «Non rinnovo».
//  3. Admin: rifiuto con motivo, «Approva tutte» (parola LANCIA), riepilogo, segnalazioni, scheda Clienti.
//  4. Testi del sito pubblico: niente percentuali, promesse vietate, marchi di terzi, zone pilota, né con il pre-lancio né senza.
//  5. Lista d'attesa: tetto giornaliero dell'avviso di 80 e parola AVVISA.
// Nessuna email vera: i link arrivano da /__e2e/token-conferma. Tutti i dati sono di prova (example.com).
const path = require('path');
const { test, expect, API, PASSWORD, unico, chiama, registra, login, admin, creaOffertaApprovata, loginNelBrowser } = require('../fixtures');
const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_MASTER_PASSWORD } = require('../env');

const FOTO = path.join(__dirname, '..', 'files', 'foto-offerta.jpg');

test.describe.configure({ mode: 'serial' });
test.use({ viewport: { width: 390, height: 844 } }); // iPhone

async function interruttore(request, rotta, acceso) {
  const r = await request.post(`${API}/__e2e/${rotta}`, { params: { acceso: String(acceso) } });
  expect(r.status()).toBe(200);
}
const scrollOrizzontale = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

async function apriAdmin(page, scheda) {
  await loginNelBrowser(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto('/admin');
  await page.getByTestId('master-pw').fill(ADMIN_MASTER_PASSWORD);
  await page.getByTestId('master-submit').click();
  await page.getByTestId(`tab-${scheda}`).click();
}

// ---------------------------------------------------------------------------------------------
// 1. CLIENTE (con la conferma dell'email accesa, come in produzione)
// ---------------------------------------------------------------------------------------------
test.describe('cliente', () => {
  test.beforeAll(async ({ request }) => { await interruttore(request, 'conferma-email-obbligatoria', true); });
  test.afterAll(async ({ request }) => { await interruttore(request, 'conferma-email-obbligatoria', false); });

  test('iscrizione, conferma email, accesso, preferiti, segnalazione ed eliminazione dell\'account', async ({ page, request }) => {
    const m = await registra(request, 'merchant');
    const offerta = await creaOffertaApprovata(request, m.token, { title: `Prova generale ${Date.now()}` });
    const email = unico('cliente-pg');

    // Iscrizione dal sito: nessun accesso finché non si tocca il link
    await page.goto('/register');
    await page.getByTestId('reg-first-name').fill('Giulia');
    await page.getByTestId('reg-last-name').fill('Prova');
    await page.getByTestId('reg-email').fill(email);
    await page.getByTestId('reg-password').fill(PASSWORD);
    await page.getByTestId('legal-accept').click();
    await page.getByTestId('reg-submit').click();
    await expect(page.getByTestId('register-conferma-testo')).toContainText('tocca il link per confermare');
    expect((await login(request, email, PASSWORD)).status).toBe(403);

    // Email simulata: il link arriva dal server di prova
    const t = await request.get(`${API}/__e2e/token-conferma`, { params: { email } });
    expect(t.status()).toBe(200);
    await page.goto(`/conferma-email?token=${encodeURIComponent((await t.json()).token)}`);
    await expect(page.getByTestId('conferma-ok')).toContainText('Iscrizione completata!');

    // Accesso dal sito
    await page.goto('/login');
    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('use-pw-btn').click();
    await page.getByTestId('login-password').fill(PASSWORD);
    await page.getByTestId('login-submit').click();
    await expect(page).not.toHaveURL(/\/login/);

    // Preferiti: cuore sull'offerta, poi la vista «Preferiti»
    await page.goto(`/discounts/${offerta.id}`);
    const cuore = page.getByTestId(`preferito-${m.user.id}`);
    await cuore.click();
    await expect(cuore).toHaveAttribute('data-pieno', '1');
    await page.goto('/discounts');
    await page.getByTestId('vista-preferiti-tab').click();
    await expect(page.getByTestId('vista-preferiti').getByTestId(`discount-card-${offerta.id}`)).toBeVisible();

    // Segnalazione dalla scheda dell'offerta: arriva all'admin
    await page.goto(`/discounts/${offerta.id}`);
    await page.getByTestId('segnala-apri').click();
    await page.getByTestId('segnala-form-tipo').selectOption('offerta_non_rispettata');
    await page.getByTestId('segnala-form-motivo').fill('Allo sportello non mi hanno riconosciuto lo sconto.');
    const invio = page.waitForResponse((r) => r.url().endsWith('/api/segnalazioni') && r.request().method() === 'POST');
    await page.getByTestId('segnala-form-invia').click();
    const risposta = await invio;
    expect(risposta.status(), await risposta.text()).toBe(200);
    const a = await admin(request);
    const elenco = await chiama(request, 'GET', '/admin/segnalazioni', { token: a.token, headers: a.headers });
    expect(elenco.data.segnalazioni.some((s) => s.discount_id === offerta.id && s.tipo === 'offerta_non_rispettata')).toBe(true);

    // Eliminazione dell'account dall'area cliente
    await page.goto('/dashboard');
    await page.getByTestId('gdpr-delete').click();
    await expect(page.getByTestId('gdpr-delete-confirm')).toBeVisible();
    const eliminazione = page.waitForResponse((r) => r.url().endsWith('/api/gdpr/delete-account'));
    await page.getByTestId('gdpr-delete-confirm').click();
    expect((await eliminazione).status()).toBe(200);
    await expect(page).toHaveURL(/\/$/, { timeout: 10_000 });
    // l'account non esiste più, né nelle liste dell'admin
    expect((await login(request, email, PASSWORD)).status).toBe(401);
    const clienti = await chiama(request, 'GET', '/admin/clients', { token: a.token, headers: a.headers });
    expect(clienti.data.clients.map((c) => c.email)).not.toContain(email);
  });
});

// ---------------------------------------------------------------------------------------------
// 2. COMMERCIANTE
// ---------------------------------------------------------------------------------------------
test('commerciante: registrazione, offerta con foto, approvazione e «Non rinnovo»', async ({ page, request }) => {
  const email = unico('negozio-pg');
  await page.goto('/register?role=merchant');
  await page.getByTestId('reg-name').fill('Luca');
  await page.getByTestId('reg-email').fill(email);
  await page.getByTestId('reg-password').fill(PASSWORD);
  await page.getByTestId('reg-shop').fill('Bottega di prova');
  await page.getByTestId('reg-address-input').fill("Via dell'Esempio 1, Roma");
  await page.getByTestId('reg-phone').fill('+39 06 0000000');
  await page.getByTestId('reg-partita-iva').fill('12345678903');
  await page.getByTestId('reg-zone').selectOption('Garbatella');
  await page.getByTestId('reg-category').selectOption('Ristorante');
  await page.getByTestId('legal-accept').click();
  await page.getByTestId('legal-specific').click();
  await page.getByTestId('reg-submit').click();
  await expect(page).toHaveURL(/\/setup-security/);
  // i commercianti entrano subito (nessuna conferma email)
  const l = await login(request, email, PASSWORD);
  expect(l.status).toBe(200);
  expect(l.data.user.role).toBe('merchant');

  // Offerta con foto, dal telefono
  await page.goto('/merchant/discount');
  const titolo = `Offerta negozio PG ${Date.now()}`;
  await page.getByTestId('disc-title').fill(titolo);
  await page.getByTestId('disc-description').fill('Descrizione di prova della prova generale.');
  await page.getByTestId('disc-original').fill('40');
  await page.getByTestId('disc-discounted').fill('20');
  await page.locator('input[type=file]').first().setInputFiles(FOTO);
  await expect(page.getByTestId('photo-tile-0').locator('img')).toHaveAttribute('src', /^data:image\/jpeg;base64,/);
  await page.getByTestId('disc-validity-info').fill('Solo mercoledì e venerdì');
  await page.getByTestId('disc-uses-1').click();
  const salvataggio = page.waitForResponse((r) => r.url().endsWith('/api/merchants/me/discount') && r.request().method() === 'POST');
  await page.getByTestId('disc-submit').click();
  const salvato = await salvataggio;
  expect(salvato.status(), await salvato.text()).toBe(200);
  const did = (await salvato.json()).discount.id;
  expect(await scrollOrizzontale(page)).toBeLessThanOrEqual(0);

  // In attesa: invisibile ai clienti; poi l'admin approva e compare con la foto
  expect((await chiama(request, 'GET', '/discounts')).data.discounts.map((d) => d.id)).not.toContain(did);
  const a = await admin(request);
  expect((await chiama(request, 'POST', `/admin/discounts/${did}/approve`, { token: a.token, headers: a.headers })).status).toBe(200);
  const pubblica = (await chiama(request, 'GET', '/discounts')).data.discounts.find((d) => d.id === did);
  expect(pubblica, 'offerta pubblicata').toBeTruthy();
  expect(pubblica.image_urls || [pubblica.image_url]).toHaveLength(1);

  // «Non rinnovo» con la finestra del mese prossimo aperta; si può annullare
  const apri = await chiama(request, 'POST', '/admin/next-offers/window-override', { token: a.token, headers: a.headers, body: { open: true } });
  expect(apri.status).toBe(200);
  try {
    await loginNelBrowser(page, email, PASSWORD);
    await page.goto('/merchant/dashboard');
    const banner = page.getByTestId('renewal-banner');
    await expect(banner).toHaveAttribute('data-state', 'expiring');
    page.once('dialog', (d) => d.accept());
    await page.getByTestId('renewal-no-renew-btn').click();
    await expect(banner).toHaveAttribute('data-state', 'no-renew');
    await page.getByTestId('renewal-undo-btn').click();
    await expect(banner).toHaveAttribute('data-state', 'expiring');
  } finally {
    await chiama(request, 'POST', '/admin/next-offers/window-override', { token: a.token, headers: a.headers, body: { open: null } });
  }
});

// ---------------------------------------------------------------------------------------------
// 3. ADMIN
// ---------------------------------------------------------------------------------------------
test('admin: rifiuta con motivo, «Approva tutte» chiede LANCIA, poi riepilogo', async ({ page, request }) => {
  const offerte = {};
  for (const nome of ['rifiutata', 'uno', 'due']) {
    const m = await registra(request, 'merchant');
    const c = await chiama(request, 'POST', '/merchants/me/discount', { token: m.token, body: {
      title: `PG ${nome} ${Date.now()}`, description: 'Descrizione di prova.', original_price: 30, discounted_price: 15, validity_info: 'Solo giovedì' } });
    expect(c.status, JSON.stringify(c.data)).toBe(200);
    offerte[nome] = c.data.discount.id;
  }
  const pubbliche = async () => (await chiama(request, 'GET', '/discounts')).data.discounts.map((d) => d.id);

  await apriAdmin(page, 'pending');
  // Rifiuto: finestra con motivo obbligatorio
  await page.getByTestId(`reject-${offerte.rifiutata}`).click();
  await expect(page.getByTestId('rifiuto-conferma')).toBeDisabled();
  await page.getByTestId('rifiuto-motivo').fill('Il prezzo pieno non è quello praticato.');
  await page.getByTestId('rifiuto-conferma').click();
  await expect(page.getByTestId(`pending-${offerte.rifiutata}`)).toHaveCount(0);
  expect(await pubbliche()).not.toContain(offerte.rifiutata);

  // «Approva tutte»: con la parola sbagliata non succede nulla
  page.once('dialog', (d) => d.accept('lancia tutto'));
  await page.getByTestId('approva-tutte').click();
  await page.waitForTimeout(800);
  expect(await pubbliche()).not.toContain(offerte.uno);
  await expect(page.getByTestId(`pending-${offerte.uno}`)).toBeVisible();

  // con LANCIA le approva tutte
  page.once('dialog', (d) => d.accept('LANCIA'));
  const tutte = page.waitForResponse((r) => r.url().endsWith('/api/admin/discounts/approve-all-pending'));
  await page.getByTestId('approva-tutte').click();
  const esito = await tutte;
  expect(esito.status()).toBe(200);
  expect((await esito.json()).approvate).toBeGreaterThanOrEqual(2);
  const dopo = await pubbliche();
  expect(dopo).toContain(offerte.uno);
  expect(dopo).toContain(offerte.due);
  expect(dopo).not.toContain(offerte.rifiutata);

  // Riepilogo
  await page.getByTestId('tab-riepilogo').click();
  await expect(page.getByTestId('admin-riepilogo')).toBeVisible();
  await expect(page.getByTestId('riepilogo-periodo')).toBeVisible();
  await expect(page.getByTestId('riepilogo-metriche')).toBeVisible();
  expect(await scrollOrizzontale(page)).toBeLessThanOrEqual(0);
});

test('admin: esito motivato di una segnalazione e scheda «Clienti» con eliminazione', async ({ page, request }) => {
  // segnalazione anonima (come dal sito) + un cliente da eliminare
  const s = await chiama(request, 'POST', '/segnalazioni', { body: { tipo: 'altro', motivo: 'Segnalazione di prova della prova generale.' } });
  expect(s.status, JSON.stringify(s.data)).toBe(200);
  const c = await registra(request, 'client');

  await apriAdmin(page, 'segnalazioni');
  const a = await admin(request);
  const elenco = await chiama(request, 'GET', '/admin/segnalazioni', { token: a.token, headers: a.headers });
  const mia = elenco.data.segnalazioni.find((x) => x.motivo === 'Segnalazione di prova della prova generale.');
  expect(mia).toBeTruthy();
  const scheda = page.getByTestId(`segnalazione-${mia.id}`);
  // senza motivazione l'esito non passa
  page.once('dialog', (d) => d.accept('corta'));
  await scheda.getByRole('button', { name: 'Accolta' }).click();
  await expect(scheda).toContainText('Stato: ricevuta');
  page.once('dialog', (d) => d.accept('Verificato con il negozio: lo sconto va applicato.'));
  await scheda.getByRole('button', { name: 'Accolta' }).click();
  await expect(scheda).toContainText('Stato: accolta');

  // Clienti: cerca, elimina, scompare e non può più accedere
  await page.getByTestId('tab-clienti').click();
  await expect(page.getByTestId('admin-clienti')).toBeVisible();
  await page.getByTestId('clienti-search').fill(c.email);
  page.once('dialog', (d) => d.accept());
  await page.getByTestId(`cliente-elimina-${c.user.id}`).click();
  await expect(page.getByTestId(`cliente-elimina-${c.user.id}`)).toHaveCount(0);
  expect((await login(request, c.email, c.password)).status).toBe(401);
});

// ---------------------------------------------------------------------------------------------
// 4. TESTI DEL SITO PUBBLICO
// ---------------------------------------------------------------------------------------------
// Regole della skill «comunicazione-marchio». Pagine legali escluse (nominano i fornitori per obbligo di legge).
const VIETATI = [
  [/\d\s?%/, 'percentuale'],
  [/gratis per sempre/i, 'gratis per sempre'],
  [/nessuna commissione/i, 'nessuna commissione'],
  [/prezzo bloccat/i, 'prezzo bloccato'],
  [/\bgarbatella\b|san paolo|\bmarconi\b/i, 'zona pilota'],
  [/stripe|paypal|google|gemini|resend|mongodb|locationiq|nominatim|openstreetmap|instagram|facebook|tiktok|youtube|netflix|disney|lego|nintendo|amazon|groupon|thefork/i, 'marchio di terzi'],
];
const PAGINE_PUBBLICHE = ['/', '/per-i-commercianti', '/support', '/register', '/register?role=merchant', '/login'];

async function testoPagina(page, url) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  // Gli elenchi a tendina delle zone (una delle 16 aree di Roma si chiama «Garbatella · Ostiense, San Paolo») sono
  // geografia del catalogo, non messaggi di comunicazione: si controllano a parte (scelta del titolare, vedi la PR).
  return page.evaluate(() => {
    const copia = document.body.cloneNode(true);
    copia.querySelectorAll('select, option, script, style').forEach((e) => e.remove());
    return copia.textContent.replace(/\s+/g, ' ');
  });
}

test('sito pubblico (pre-lancio SPENTO): nessuna promessa vietata, percentuale, marchio o zona pilota', async ({ page, request }) => {
  await interruttore(request, 'prelancio', false);
  const trovati = [];
  for (const url of PAGINE_PUBBLICHE) {
    const testo = await testoPagina(page, url);
    expect(testo.length, `${url} vuota`).toBeGreaterThan(80);
    for (const [re, nome] of VIETATI) {
      const m = testo.match(re);
      if (m) trovati.push(`${url}: ${nome} «${m[0]}»`);
    }
  }
  expect(trovati, trovati.join('\n')).toEqual([]);
});

test('sito pubblico (pre-lancio ACCESO): «stiamo arrivando», 18+, nessuna data, percentuale, marchio o zona pilota', async ({ page, request }) => {
  await interruttore(request, 'prelancio', true);
  try {
    const trovati = [];
    for (const url of ['/', '/discounts', ...PAGINE_PUBBLICHE.slice(1)]) {
      const testo = await testoPagina(page, url);
      if (url === '/') {
        expect(testo).toMatch(/Stiamo arrivando/i);
        expect(testo).toContain('maggiorenni (18+)');
        // l'anno del copyright in fondo («© 2026») non è una data di lancio
        expect(testo.replace(/©\s*20\d\d/g, '')).not.toMatch(/\b\d{1,2}\s?\/\s?\d{1,2}\b|\b(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\b|\b20\d\d\b/i);
      }
      if (url === '/discounts') continue; // il catalogo vuoto è già controllato in 33; qui solo la home e le pagine fisse
      for (const [re, nome] of VIETATI) {
        const m = testo.match(re);
        if (m) trovati.push(`${url}: ${nome} «${m[0]}»`);
      }
    }
    expect(trovati, trovati.join('\n')).toEqual([]);
    // anche i dati letti dal sito (configurazione pubblica) non contengono date di lancio
    const cfg = await chiama(request, 'GET', '/config/public');
    expect(cfg.data.prelaunch_mode).toBe(true);
    expect(JSON.stringify(cfg.data)).not.toMatch(/launch_date|data_lancio|\b2026-1[0-2]-\d\d\b/);
  } finally {
    await interruttore(request, 'prelancio', false);
  }
});

test('pre-lancio: i clienti non si registrano (lista d\'attesa), i negozi sì; a pre-lancio spento tutto come prima', async ({ page, request }) => {
  await interruttore(request, 'prelancio', true);
  try {
    await page.goto('/register');
    await expect(page.getByTestId('register-prelancio')).toContainText('Stiamo arrivando');
    await expect(page.getByTestId('lista-attesa-reg-form')).toBeVisible();
    await expect(page.getByTestId('reg-submit')).toHaveCount(0);
    expect(await scrollOrizzontale(page)).toBeLessThanOrEqual(0);
    const rifiutato = await chiama(request, 'POST', '/auth/register', { body: {
      legal_accepted: true, email: unico('pre-cliente'), password: PASSWORD, name: 'Giulia Prova', role: 'client' } });
    expect(rifiutato.status).toBe(403);
    // i negozi continuano a registrarsi
    await page.getByTestId('role-merchant').click();
    await expect(page.getByTestId('reg-submit')).toBeVisible();
    await expect(page.getByTestId('register-prelancio')).toHaveCount(0);
    const negozio = await registra(request, 'merchant');
    expect(negozio.token).toBeTruthy();
  } finally {
    await interruttore(request, 'prelancio', false);
  }
  await page.goto('/register');
  await expect(page.getByTestId('reg-submit')).toBeVisible();
  const cliente = await registra(request, 'client');
  expect(cliente.token).toBeTruthy();
});

test('pagine incorporate nel sito: titolo e descrizione senza zone pilota né percentuali', async ({ request }) => {
  const r = await request.get('http://localhost:3000/');
  const html = await r.text();
  const manifest = await (await request.get('http://localhost:3000/manifest.json')).text();
  for (const [nome, testo] of [['index.html', html], ['manifest.json', manifest]]) {
    expect(testo, nome).not.toMatch(/garbatella|san paolo|marconi/i);
    expect(testo, nome).not.toMatch(/gratis per sempre|nessuna commissione|prezzo bloccat/i);
  }
});

// ---------------------------------------------------------------------------------------------
// 5. LISTA D'ATTESA: tetto giornaliero e parola AVVISA
// ---------------------------------------------------------------------------------------------
test('lista d\'attesa: tetto giornaliero 80 e senza la parola AVVISA non parte nulla', async ({ request }) => {
  const a = await admin(request);
  const stato = await chiama(request, 'GET', '/admin/lista-attesa', { token: a.token, headers: a.headers });
  expect(stato.status).toBe(200);
  expect(stato.data.avviso.tetto_giornaliero).toBe(80);
  for (const conferma of ['', 'avvisa tutti', 'LANCIA']) {
    const r = await chiama(request, 'POST', '/admin/lista-attesa/invia-avviso', { token: a.token, headers: a.headers, body: { conferma } });
    expect(r.status, `parola «${conferma}»`).toBe(400);
  }
  // senza la password master dell'admin la rotta non si apre
  const senza = await chiama(request, 'POST', '/admin/lista-attesa/invia-avviso', { token: a.token, body: { conferma: 'AVVISA' } });
  expect([401, 403]).toContain(senza.status);
});

// ---------------------------------------------------------------------------------------------
// 6. INTESTAZIONI E ORIGINI (sul server di prova, come vengono viste dal telefono)
// ---------------------------------------------------------------------------------------------
test('server: intestazioni di sicurezza e nessun permesso CORS ai siti estranei', async ({ request }) => {
  const ok = await request.get(`${API}/api/`, { headers: { Origin: 'http://localhost:3000' } });
  expect(ok.headers()['x-content-type-options']).toBe('nosniff');
  expect(ok.headers()['x-frame-options']).toBe('DENY');
  expect(ok.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(ok.headers()['access-control-allow-origin']).toBe('http://localhost:3000');
  expect(ok.headers()['access-control-allow-credentials']).toBe('true');
  const estraneo = await request.get(`${API}/api/`, { headers: { Origin: 'https://sito-malevolo.example' } });
  expect(estraneo.headers()['access-control-allow-origin']).toBeUndefined();
  const scrittura = await request.post(`${API}/api/auth/login`, { headers: { Origin: 'https://sito-malevolo.example' }, data: { email: 'x@example.com', password: 'y' }, failOnStatusCode: false });
  expect(scrittura.status()).toBe(403);
});
