// Testi legali allineati alle regole della fase di lancio: niente 2,99 €, niente PIN,
// niente rinnovo automatico né abbonamento clienti; fornitori della mappa elencati.
const { test, expect } = require('../fixtures');

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

test('privacy [PROPOSTA]: lista d\'attesa e LocationIQ, evidenziati e senza IP né cookie', async ({ page }) => {
  await page.goto('/privacy');
  const lista = page.getByTestId('privacy-lista-attesa');
  await expect(lista).toContainText("Avvisami quando parte");
  await expect(lista).toContainText('art. 6, par. 1, lett. a, GDPR');
  await expect(lista).toContainText('doppio consenso');
  await expect(lista).toContainText("Annulla l'iscrizione");
  await expect(lista).toContainText('Non salviamo il tuo indirizzo IP');
  await expect(lista).toContainText('non usa cookie');
  await expect(lista).toContainText('Resend');
  await expect(lista).toContainText('18+');
  await expect(lista).toContainText('cancellate dopo 7 giorni');
  await expect(page.getByTestId('privacy-lista-attesa-base')).toContainText('Consenso (art. 6.1.a GDPR)');
  const cons = page.getByTestId('privacy-lista-attesa-conservazione');
  await expect(cons).toContainText('12 mesi dalla data dell\'iscrizione');
  await expect(cons).toContainText('12 mesi dall\'annullamento');
  await expect(cons).toContainText('ogni notte');
  const liq = page.getByTestId('privacy-locationiq');
  await expect(liq).toContainText('LocationIQ');
  await expect(liq).toContainText('non riceve il tuo indirizzo IP');
  await expect(liq).toContainText('[DA VERIFICARE');
  // le modifiche sono evidenziate finché il consulente non dà l'OK
  expect(await page.getByTestId('privacy-policy-page').locator('mark').count()).toBeGreaterThanOrEqual(8);
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

test('iscrizione: dichiarazione dei 18 anni', async ({ page }) => {
  await page.goto('/register');
  await expect(page.getByText('Dichiaro di avere almeno 18 anni')).toBeVisible();
});

test('privacy e termini: titolare identificato, nessun riferimento alla piattaforma ODR abrogata', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.getByTestId('privacy-policy-page')).toContainText('Euro Linea S.r.l.s.');
  await expect(page.getByTestId('privacy-policy-page')).toContainText('nome, cognome, email');
  await page.goto('/termini');
  const t = page.getByTestId('termini-page');
  await expect(t).toContainText('Euro Linea S.r.l.s.');
  await expect(t).not.toContainText('524/2013');
  await expect(t).not.toContainText('senza rimborso');
});

test('iscrizione commerciante: seconda casella per le clausole specifiche', async ({ page }) => {
  await page.goto('/register?role=merchant');
  await expect(page.getByTestId('legal-specific')).toBeVisible();
  await page.goto('/register');
  await expect(page.getByTestId('legal-specific')).toHaveCount(0);
});
