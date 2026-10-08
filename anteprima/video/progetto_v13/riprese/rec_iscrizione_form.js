// v13 · clip_iscrizione e clip_form_offerta con l'app nuova (tema chiaro, area commerciante «D», 16 zone).
// Dati fittizi, server locale (avvia_server_v13.py). Uso: node rec_iscrizione_form.js
const { chromium, appContext, APP, FOTO, APPDIR } = require('./ctx');
const { startRec, stopRec, wait } = require('./recorder');
const TMP = process.env.V13_TMP || '/tmp/v13_rec/';
require('fs').mkdirSync(TMP, { recursive: true });
const RATE = 0.25;
const typeSlow = async (loc, text, cps = 14) => { await loc.click(); await loc.pressSequentially(text, { delay: 1000 / cps / RATE }); };
// scorrimento lento: durata in «tempo di scena»
const glide = async (p, loc, off, dur) => {
  const [y0, y1] = await loc.evaluate((e, off) => [window.scrollY, e.getBoundingClientRect().top + window.scrollY - off], off);
  const ms = dur * 1000 / RATE, t0 = Date.now();
  for (;;) {
    const q = Math.min(1, (Date.now() - t0) / ms), k = q < .5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;
    await p.evaluate(y => window.scrollTo(0, y), y0 + (y1 - y0) * k);
    if (q >= 1) break;
    await p.waitForTimeout(30);
  }
};
(async () => {
  const b = await chromium.launch();
  const c = await appContext(b); const p = await c.newPage();
  // ---- iscrizione del commerciante (account nuovo) ----
  await p.goto(APP + '/register?role=merchant', { waitUntil: 'domcontentloaded' });
  await p.getByTestId('reg-shop').waitFor({ timeout: 60000 }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1500);
  let r = await startRec(p, TMP + 'rec_reg');
  await wait(p, 0.4);
  await typeSlow(p.getByTestId('reg-name'), 'Luca');
  await typeSlow(p.getByTestId('reg-email'), 'osteria.nuova@example.com', 22);
  await typeSlow(p.getByTestId('reg-password'), 'demo-luca-2026', 22);
  await typeSlow(p.getByTestId('reg-shop'), "Osteria dell'Esempio", 22);
  await glide(p, p.getByTestId('reg-address-input'), 220, 1.2);
  await typeSlow(p.getByTestId('reg-address-input'), "Via dell'Esempio 1, Roma", 22);
  await typeSlow(p.getByTestId('reg-phone'), '+39 06 0000000', 22);
  await p.getByTestId('reg-zone').selectOption('Garbatella'); await wait(p, 0.4);
  await p.getByTestId('reg-category').selectOption('Ristorante'); await wait(p, 0.4);
  await glide(p, p.getByTestId('legal-accept'), 260, 1.0);
  await p.getByTestId('legal-accept').click(); await wait(p, 0.5);
  await glide(p, p.getByTestId('legal-specific'), 300, 0.6); await p.getByTestId('legal-specific').click(); await wait(p, 0.5);
  await glide(p, p.getByTestId('reg-submit'), 420, 0.8);
  await p.getByTestId('reg-submit').tap();
  await p.waitForURL(/setup-security|merchant/, { timeout: 30000 }); await wait(p, 1.2);
  console.log('iscrizione fotogrammi', await stopRec(r, APPDIR + 'clip_iscrizione.mp4'));
  console.log('dopo iscrizione:', p.url());
  await p.getByTestId('skip-security').click().catch(() => {}); await p.waitForTimeout(1500);
  // ---- modulo dell'offerta: descrizione e foto preparate prima ----
  await p.goto(APP + '/merchant/discount', { waitUntil: 'domcontentloaded' });
  await p.getByTestId('disc-title').waitFor({ timeout: 30000 }); await p.evaluate(() => document.fonts.ready);
  await p.getByTestId('disc-description').fill('Antipasto, primo e secondo di mare.');
  await p.locator('input[type=file]').first().setInputFiles(FOTO + 'menu_pesce.jpg'); await p.waitForTimeout(3000);
  const conf = p.getByTestId('photo-add-confirm'); if (await conf.count()) { await conf.click(); await p.waitForTimeout(2000); }
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(500);
  await p.getByTestId('disc-title').evaluate(e => window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 200));
  await p.waitForTimeout(1000);
  await p.screenshot({ path: TMP + 'form_prima.png' });
  r = await startRec(p, TMP + 'rec_form');
  const Y = async (m) => console.log(m, await p.evaluate(() => window.scrollY), r.frames.length);
  await wait(p, 0.4);
  await typeSlow(p.getByTestId('disc-title'), 'Menù di pesce', 8);
  await wait(p, 0.4);
  await glide(p, p.getByTestId('disc-original'), 260, 1.6);
  await wait(p, 0.3);
  await typeSlow(p.getByTestId('disc-original'), '40', 3); await Y('prezzo pieno'); await wait(p, 0.2);
  await typeSlow(p.getByTestId('disc-discounted'), '20', 3); await Y('prezzo scontato');
  await wait(p, 0.5);
  await glide(p, p.getByTestId('disc-uses-1'), 320, 2.2);
  await wait(p, 0.3);
  await p.getByTestId('disc-uses-1').click(); await Y('1 volta'); await wait(p, 0.7);
  await glide(p, p.getByTestId('disc-submit'), 480, 1.4);
  await wait(p, 0.3);
  await p.getByTestId('disc-submit').tap(); await Y('invio'); await wait(p, 2.2);
  console.log('form fotogrammi', await stopRec(r, APPDIR + 'clip_form_offerta.mp4'));
  await p.screenshot({ path: TMP + 'form_dopo.png' });
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
