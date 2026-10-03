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
  await expect(p).toContainText('Google Fonts');
  await expect(p).toContainText('Nominatim');
  await expect(p).toContainText("nome e l'iniziale del cognome");
});

test('termini: costi per i commercianti dopo la fase di lancio', async ({ page }) => {
  await page.goto('/termini');
  const t = page.getByTestId('termini-page');
  await expect(t).toContainText('€4,99 al mese, IVA inclusa');
  await expect(t).toContainText('Nessun addebito senza la tua conferma');
  await expect(t).toContainText('non si rinnovano');
});

test('iscrizione: dichiarazione dei 18 anni', async ({ page }) => {
  await page.goto('/register');
  await expect(page.getByText('Dichiaro di avere almeno 18 anni')).toBeVisible();
});
