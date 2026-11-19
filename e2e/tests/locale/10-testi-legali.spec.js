// Testi legali allineati alle regole della fase di lancio: niente 2,99 €, niente PIN,
// niente rinnovo automatico né abbonamento clienti; fornitori della mappa elencati.
const { test, expect, passoUnoNegozio } = require('../fixtures');

const PAGINE = { '/privacy': 'privacy-policy-page', '/termini': 'termini-page', '/recesso': 'recesso-page', '/cookies': 'cookie-policy-page' };
const VIETATI = [/2,99/, /\bPIN\b/, /rinnovo automatico/i, /abbonat[io]/i, /gratis per sempre/i, /nessuna commissione/i];

for (const [path, id] of Object.entries(PAGINE)) {
  test(`testo legale aggiornato: ${path}`, async ({ page }) => {
    await page.goto(path);
    const testo = await page.getByTestId(id).innerText();
    for (const v of VIETATI) expect(testo, `${path} contiene ${v}`).not.toMatch(v);
  });
}

test('privacy: fornitori della mappa e dati visti dal commerciante', async ({ page }) => {
  await page.goto('/privacy');
  const p = page.getByTestId('privacy-policy-page');
  await expect(p).toContainText('OpenStreetMap Foundation');
  await expect(p).not.toContainText('Google Fonts');          // i caratteri sono ospitati da noi
  await expect(p).toContainText('ospitati sul nostro server');
  await expect(p).toContainText('Nominatim');
  await expect(p).toContainText("nome e l'iniziale del cognome");
});

test('termini: costi per i commercianti dopo la fase di lancio', async ({ page }) => {
  await page.goto('/termini');
  const t = page.getByTestId('termini-page');
  await expect(t).toContainText('€4,99 al mese + IVA');
  await expect(t).not.toContainText('IVA inclusa');
  await expect(t).not.toContainText('Prezzo bloccato');
  await expect(t).toContainText('Nessun addebito senza la tua conferma');
  await expect(t).toContainText('non si rinnovano');
});

test('termini: prova, esempio, disdetta e zona allineati alla decisione del titolare', async ({ page }) => {
  await page.goto('/termini');
  const t = page.getByTestId('termini-page');
  await expect(t).toContainText('Prova gratuita di 2 mesi (almeno 60 giorni)');
  await expect(t).toContainText('prima pubblicazione');
  await expect(t).toContainText('dura da 60 a 90 giorni');
  // esempi numerici con la regola dei 60 giorni (decisione del titolare del 31/10)
  await expect(t).toContainText('10 novembre 2026');
  await expect(t).toContainText('9 gennaio 2027');
  await expect(t).toContainText('31 gennaio 2027 (83 giorni)');
  await expect(t).toContainText('1° febbraio 2027');
  await expect(t).toContainText('2 ottobre 2026');
  await expect(t).toContainText('30 novembre 2026 (60 giorni)');
  await expect(t).toContainText('1° dicembre 2026');
  await expect(t).toContainText('disdici quando vuoi, porti avanti solo l\'offerta che è in corso a fine mese');
  await expect(t).toContainText('Mese pagato non rimborsabile');
  await expect(t).toContainText('Roma e dintorni');
  await expect(t).toContainText('almeno 18 anni');
  for (const v of [/circa due mesi/i, /entro l'11/, /dal 12 in poi/, /81 giorni/, /dal 61/, /nessun vincolo/i, /prezzo bloccato/i, /Garbatella/, /San Paolo/, /Marconi/]) {
    expect(await t.innerText(), `Termini contiene ${v}`).not.toMatch(v);
  }
});

test('iscrizione: dichiarazione dei 18 anni', async ({ page }) => {
  await page.goto('/register');
  await expect(page.getByText('Dichiaro di avere almeno 18 anni')).toBeVisible();
});

test('privacy e termini: titolare identificato, nessun riferimento alla piattaforma ODR abrogata', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.getByTestId('privacy-policy-page')).toContainText('EUROLINEA S.r.l.s.');
  await expect(page.getByTestId('privacy-policy-page')).toContainText('nome, cognome, email');
  await page.goto('/termini');
  const t = page.getByTestId('termini-page');
  await expect(t).toContainText('EUROLINEA S.r.l.s.');
  await expect(t).not.toContainText('524/2013');
  await expect(t).not.toContainText('senza rimborso');
  await expect(t).toContainText('REA AV-313674');
  await expect(page.getByTestId('footer-dati-societari')).toContainText('03240220644');
});

test('iscrizione commerciante: seconda casella per le clausole specifiche', async ({ page }) => {
  await passoUnoNegozio(page);
  await expect(page.getByTestId('legal-specific')).toBeVisible();
  await page.goto('/register');
  await expect(page.getByTestId('legal-specific')).toHaveCount(0);
});

test('privacy: lista d\'attesa tolta il 02/11 (nessun trattamento attivo, iscrizioni cancellate)', async ({ page }) => {
  await page.goto('/privacy');
  const p = page.getByTestId('privacy-policy-page');
  await expect(p).toContainText('Lista d\'attesa pre-lancio (chiusa)');
  await expect(p).toContainText('sono state cancellate dal nostro database');
  const testo = await p.innerText();
  for (const v of [/elenco di esclusione/i, /avviso di lancio/i, /conferma dell'iscrizione/i, /iscrizione alla lista d'attesa/i]) {
    expect(testo, `Privacy contiene ${v}`).not.toMatch(v);
  }
});

// ---------- Testi legali allineati al codice (agente legale, 18/11) ----------

test('privacy 18/11: fornitori e dati allineati al codice (Cloudflare, Aruba, WhatsApp, Partita IVA)', async ({ page }) => {
  await page.goto('/privacy');
  const p = page.getByTestId('privacy-policy-page');
  for (const t of ['Cloudflare, Inc.', 'Fornitori dei nostri fornitori', 'Aruba S.p.A.', 'WhatsApp Business', '352 247 3526',
    'non ricontattare', 'Partita IVA', 'Oggi questa funzione è spenta', '4.2 Pagine social', 'Ci pensiamo noi',
    'Segnalazioni e reclami', 'cancelliamo l\'account dopo 7 giorni', 'Ultimo aggiornamento: Novembre 2026']) {
    await expect(p, `Privacy senza «${t}»`).toContainText(t);
  }
  // la regione di Render non si tocca finché il titolare non la verifica
  await expect(p).toContainText('Hosting');
  const testo = await p.innerText();
  for (const v of [/Log di sicurezza: 12 mesi/, /Statistiche anonime/i]) {
    expect(testo, `Privacy contiene ${v}`).not.toMatch(v);
  }
});

test('cookie policy 18/11: memoria del browser completa, identificativo non «anonimo», Cloudflare, registro a 24 mesi', async ({ page }) => {
  await page.goto('/cookies');
  const c = page.getByTestId('cookie-policy-page');
  for (const t of ['referral_captured_at', 'fonte_iscrizione', 'sr_interesse_zona', 'sr_codice_negozio_v1',
    'sr_da_fare_non_adesso_v1', 'sr_bozza_v1', 'qr_scansione_', 'sr_dispositivo_admin', 'Cloudflare',
    'si cancella in automatico']) {
    await expect(c, `Cookie Policy senza «${t}»`).toContainText(t);
  }
  await expect(c).not.toContainText('Identificativo anonimo');
});

test('termini 18/11: omaggio, Partita IVA dei negozi e «Ci pensiamo noi»', async ({ page }) => {
  await page.goto('/termini');
  const t = page.getByTestId('termini-page');
  await expect(t).toContainText('oppure un omaggio');
  await expect(t).toContainText('In omaggio');
  await expect(t).toContainText('per i Commercianti Sconti Roma è riservato a imprese e professionisti');
  await expect(page.getByTestId('termini-ci-pensiamo-noi')).toContainText('come se l\'avessi inserita tu');
  await expect(page.getByTestId('termini-ci-pensiamo-noi')).toContainText('valido 7 giorni');
});

test('pagine legali: tutti i link sono sottolineati', async ({ page }) => {
  for (const path of ['/privacy', '/cookies', '/termini', '/recesso']) {
    await page.goto(path);
    await expect(page.getByTestId('legal-content')).toBeVisible();
    const link = await page.locator('[data-testid="legal-content"] a, [data-testid="legal-contatti"] a').evaluateAll(
      (els) => els.map((a) => ({ testo: a.textContent.trim(), linea: getComputedStyle(a).textDecorationLine })));
    expect(link.length, `${path}: nessun link trovato`).toBeGreaterThan(1);
    for (const l of link) expect(l.linea, `${path}: link «${l.testo}» non sottolineato`).toContain('underline');
  }
});

test('banner cookie: niente «Marketing», «Accetta tutti» lo lascia spento (correzione della #95)', async ({ page }) => {
  // scelta vecchia di 200 giorni: il banner ricompare (la scelta vale 6 mesi)
  await page.addInitScript(() => localStorage.setItem('sr_cookie_consent', JSON.stringify({
    version: 1, action: 'reject_all', prefs: { essential: true, functional: false, marketing: false },
    timestamp: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString() })));
  await page.goto('/');
  await expect(page.getByTestId('cookie-banner')).toBeVisible();
  await expect(page.getByTestId('cookie-banner')).not.toContainText('geolocalizzazione');
  await page.getByTestId('cookie-customize').click();
  await expect(page.getByTestId('pref-functional')).toBeVisible();
  await expect(page.getByTestId('pref-marketing')).toHaveCount(0);
  await page.getByTestId('cookie-close').click();
  const registro = page.waitForRequest((r) => r.url().includes('/gdpr/consent-log') && r.method() === 'POST');
  await page.getByTestId('cookie-accept-all').click();
  const inviato = (await registro).postDataJSON();
  expect(inviato.prefs.marketing).toBe(false);
  expect(inviato.prefs.functional).toBe(true);
  const salvato = await page.evaluate(() => JSON.parse(localStorage.getItem('sr_cookie_consent')));
  expect(salvato.prefs.marketing).toBe(false);
});
