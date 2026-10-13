// Riprese del video v14 dall'app di main (server locale con dati inventati: avvia_server_v14.py + seed_v14.py).
// Uso: node rec_clip.js <home|catalogo|iscrizione|offerta_form|pagina_offerta|qr_cliente|banco|qr_negozio|tutte>
// Uscita: ../app/clip_<nome>.mp4 (1170x1818, 30 fps), poi montate da ../montaggio/monta.py.
const fs = require('fs'); const path = require('path');
const { chromium, appContext, loginCliente, APP, API, FOTO, APPDIR } = require('./ctx');
const { startRec, stopRec, wait, RATE } = require('./recorder');
const ids = require('./demo_ids.json');
const osteria = ids.osteria, tutti = ids.tutti;
const TMP = process.env.V14_TMP || '/tmp/v14_rec/'; fs.mkdirSync(TMP, { recursive: true }); fs.mkdirSync(APPDIR, { recursive: true });
const OUT = n => APPDIR + 'clip_' + n + '.mp4';
const typeSlow = async (loc, text, cps = 14) => { await loc.click(); await loc.pressSequentially(text, { delay: 1000 / cps / RATE }); };
// scorrimento dolce verso una posizione (px) o un elemento: durata in «tempo di scena»
const glideY = async (p, y1, dur) => {
  const y0 = await p.evaluate(() => window.scrollY); const ms = dur * 1000 / RATE, t0 = Date.now();
  for (;;) {
    const q = Math.min(1, (Date.now() - t0) / ms), k = q < .5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;
    await p.evaluate(y => window.scrollTo(0, y), y0 + (y1 - y0) * k);
    if (q >= 1) break; await p.waitForTimeout(30);
  }
};
const glide = async (p, loc, off, dur) => glideY(p, await loc.evaluate((e, off) => e.getBoundingClientRect().top + window.scrollY - off, off), dur);
const pronta = async p => { await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1500); };
// nel video non devono comparire indirizzi locali: si nascondono (campi o testi con «localhost»)
// (si sostituiscono con il dominio del sito, solo a video: nel video non compaiono indirizzi locali)
const nascondiLocale = p => p.evaluate(() => {
  document.querySelectorAll('input,a,p,span,code').forEach(e => {
    if (e.value && /localhost:3000/.test(e.value)) e.value = e.value.replace('http://localhost:3000', 'https://scontiroma.it');
    else if (e.children.length === 0 && /localhost:3000/.test(e.textContent || '')) e.textContent = e.textContent.replace('http://localhost:3000', 'https://scontiroma.it');
  });
});

const clip = {
  async home(b) {
    const c = await appContext(b); const p = await c.newPage();
    await p.goto(APP + '/', { waitUntil: 'networkidle' }); await p.getByTestId('hero-sottotitolo').waitFor({ timeout: 30000 }); await pronta(p);
    const r = await startRec(p, TMP + 'rec_home');
    await wait(p, 2.2); await glideY(p, 330, 3.2); await wait(p, 2.2); await glideY(p, 0, 1.6); await wait(p, 0.8);
    console.log('home', await stopRec(r, OUT('home')));
  },
  async catalogo(b) {
    const c = await appContext(b); const p = await c.newPage(); await loginCliente(p);
    await p.goto(APP + '/discounts', { waitUntil: 'networkidle' });
    await p.getByTestId(`discount-card-${osteria.discount}`).first().waitFor({ timeout: 30000 }); await pronta(p);
    const r = await startRec(p, TMP + 'rec_cat');
    await wait(p, 1.0);
    await glide(p, p.getByTestId(`discount-card-${tutti['bottega.esempio@example.com'].discount}`).first(), 110, 2.0); await wait(p, 1.8);
    await glide(p, p.getByTestId(`discount-card-${tutti['forno.esempio@example.com'].discount}`).first(), 110, 2.4); await wait(p, 2.2);
    console.log('catalogo', await stopRec(r, OUT('catalogo')));
  },
  // iscrizione dell'account nuovo (con Partita IVA) e modulo dell'offerta, nello stesso contesto
  async iscrizione(b, soloForm) {
    const c = await appContext(b); const p = await c.newPage();
    await p.goto(APP + '/register?role=merchant', { waitUntil: 'domcontentloaded' });
    await p.getByTestId('reg-shop').waitFor({ timeout: 60000 }); await pronta(p);
    let r = await startRec(p, TMP + 'rec_reg');
    await wait(p, 0.4);
    await typeSlow(p.getByTestId('reg-name'), 'Luca', 30);
    await typeSlow(p.getByTestId('reg-email'), 'osteria.nuova2@example.com', 60);
    await typeSlow(p.getByTestId('reg-password'), 'demo-luca-2026', 60);
    await typeSlow(p.getByTestId('reg-shop'), "Osteria dell'Esempio", 45);
    await glide(p, p.getByTestId('reg-address-input'), 200, 0.9);
    await typeSlow(p.getByTestId('reg-address-input'), "Via dell'Esempio 1, Roma", 60);
    await typeSlow(p.getByTestId('reg-phone'), '+39 06 0000000', 60);
    await glide(p, p.getByTestId('reg-partita-iva'), 220, 0.9);
    await typeSlow(p.getByTestId('reg-partita-iva'), '12345678903', 22); await wait(p, 0.5);
    await glide(p, p.getByTestId('legal-accept'), 120, 1.0);
    await p.getByTestId('legal-accept').click(); await wait(p, 0.3);
    await p.getByTestId('legal-specific').click(); await wait(p, 0.3);
    // zona e categoria si scelgono fuori inquadratura: nel video non compaiono quartieri
    await p.getByTestId('reg-zone').selectOption('Cassia'); await p.getByTestId('reg-category').selectOption('Ristorante');
    await glide(p, p.getByTestId('reg-submit'), 420, 0.9); await wait(p, 0.4);
    await p.getByTestId('reg-submit').tap();
    await wait(p, 0.5);   // la clip finisce subito dopo il tocco: la pagina successiva (Face ID) non serve
    console.log('iscrizione', await stopRec(r, OUT('iscrizione')));
    await p.waitForURL(/setup-security|merchant/, { timeout: 30000 });
    await p.getByTestId('skip-security').click().catch(() => {}); await p.waitForTimeout(1500);
    // modulo dell'offerta: descrizione e foto preparate prima
    await p.goto(APP + '/merchant/discount', { waitUntil: 'domcontentloaded' });
    await p.getByTestId('disc-title').waitFor({ timeout: 30000 }); await p.evaluate(() => document.fonts.ready);
    await p.getByTestId('disc-description').fill('Antipasto, primo e secondo di mare.');
    await p.locator('input[type=file]').first().setInputFiles(FOTO + 'menu_pesce.jpg'); await p.waitForTimeout(3000);
    const conf = p.getByTestId('photo-add-confirm'); if (await conf.count()) { await conf.click(); await p.waitForTimeout(2000); }
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(500);
    await p.getByTestId('disc-title').evaluate(e => window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 150)); await p.waitForTimeout(1000);
    r = await startRec(p, TMP + 'rec_form');
    await wait(p, 0.4);
    await typeSlow(p.getByTestId('disc-title'), 'Menù di pesce', 9); await wait(p, 0.3);
    await glide(p, p.getByTestId('disc-original'), 200, 1.2);
    await typeSlow(p.getByTestId('disc-original'), '50', 3); await typeSlow(p.getByTestId('disc-discounted'), '30', 3); await wait(p, 0.4);
    await glide(p, p.getByTestId('disc-uses-1'), 260, 1.8);
    await p.getByTestId('disc-uses-1').click(); await wait(p, 0.6);
    await glide(p, p.getByTestId('disc-submit'), 400, 1.2); await wait(p, 0.3);
    await p.getByTestId('disc-submit').tap(); await wait(p, 2.0);
    console.log('offerta_form', await stopRec(r, OUT('offerta_form')));
    await p.screenshot({ path: TMP + 'form_dopo.png' });
  },
  async pagina_offerta(b) {
    const c = await appContext(b); const p = await c.newPage(); await loginCliente(p);
    await p.goto(APP + '/discounts/' + osteria.discount, { waitUntil: 'domcontentloaded' });
    await p.getByText('Menù di pesce').first().waitFor({ timeout: 30000 }); await pronta(p);
    const r = await startRec(p, TMP + 'rec_off');
    await wait(p, 1.4); await glideY(p, 330, 2.4); await wait(p, 3.4); await glideY(p, 760, 2.6); await wait(p, 2.4);
    console.log('pagina_offerta', await stopRec(r, OUT('pagina_offerta')));
  },
  async qr_cliente(b) {
    const c = await appContext(b); const p = await c.newPage(); await loginCliente(p);
    await p.goto(APP + '/discounts/' + osteria.discount, { waitUntil: 'domcontentloaded' }); await p.getByText('Menù di pesce').first().waitFor({ timeout: 30000 }); await pronta(p);
    const btn = p.getByRole('button', { name: /Mostra QR Code|Genera QR/ }).first(); await btn.waitFor({ timeout: 30000 });
    await btn.scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -200)); await p.waitForTimeout(800);
    const r = await startRec(p, TMP + 'rec_qr1', 1);  // velocità reale: il conto alla rovescia del QR è un timer JS
    await p.waitForTimeout(900); await btn.tap(); await p.getByTestId('qr-dialog').waitFor({ timeout: 30000 }); await p.waitForTimeout(3800);
    console.log('qr_cliente', await stopRec(r, OUT('qr_cliente')));
  },
  async banco(b) {
    const c = await appContext(b); const p = await c.newPage(); await loginCliente(p);
    const qr = await p.evaluate(async ({ api, did }) => {
      const r = await fetch(api + '/api/redemptions/create/' + did, { method: 'POST', credentials: 'include' }).then(r => r.json());
      const t = await fetch(`${api}/api/redemptions/${r.redemption.id}/token`, { credentials: 'include' }).then(r => r.json());
      return t.qr_value;
    }, { api: API, did: osteria.discount });
    const m = await fetch(API + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'osteria.esempio@example.com', password: 'demo-shop-2026' }) }).then(r => r.json());
    const code = (await fetch(API + '/api/merchants/me/shop-code', { headers: { Authorization: 'Bearer ' + m.access_token } }).then(r => r.json())).code;
    const c2 = await appContext(b); const q = await c2.newPage(); await q.goto('about:blank');
    const r = await startRec(q, TMP + 'rec_banco');
    await q.goto(qr, { waitUntil: 'domcontentloaded' });
    await q.getByTestId('shop-code-input').waitFor({ timeout: 30000 }); await q.evaluate(() => document.fonts.ready); await wait(q, 1.2);
    await q.getByTestId('shop-code-input').click(); await q.getByTestId('shop-code-input').pressSequentially(code, { delay: 400 }); await wait(q, 0.5);
    await q.getByTestId('shop-code-apply').tap();
    await q.getByRole('heading', { name: /SCONTO\s*VALIDO/i }).waitFor({ timeout: 30000 }); await q.evaluate(() => document.fonts.ready); await wait(q, 2.6);
    console.log('banco', await stopRec(r, OUT('banco')));
    await q.screenshot({ path: TMP + 'banco_valido.png' });
  },
  async qr_negozio(b) {
    const c = await appContext(b); const p = await c.newPage(); await loginCliente(p, 'osteria.esempio@example.com', 'demo-shop-2026');
    await p.goto(APP + '/merchant/dashboard', { waitUntil: 'networkidle' }); await p.getByTestId('merchant-dashboard').waitFor({ timeout: 30000 }); await pronta(p);
    await nascondiLocale(p);
    const tit = p.getByText('Il tuo QR personale').first();
    await tit.evaluate(e => e.scrollIntoView()); await p.evaluate(() => window.scrollBy(0, -420)); await p.waitForTimeout(800);
    const r = await startRec(p, TMP + 'rec_qrn');
    await wait(p, 1.0); await glide(p, tit, 90, 2.4); await wait(p, 2.4);
    console.log('qr_negozio', await stopRec(r, OUT('qr_negozio')));
  },
};
(async () => {
  const b = await chromium.launch();
  const which = process.argv[2] || 'tutte';
  const lista = which === 'tutte' ? ['home', 'catalogo', 'pagina_offerta', 'qr_cliente', 'banco', 'qr_negozio', 'iscrizione'] : [which];
  for (const n of lista) await clip[n](b);
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
