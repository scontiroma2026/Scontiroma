// Riprese del video v15 (commercianti) dall'app di prova: server locale con dati inventati (avvia_riprese.sh).
// Tutte le schermate scorrono alla STESSA velocità, lenta e leggibile (VEL = 60 px CSS al secondo, circa 140 px sul video),
// e le clip sono pensate per durare quanto la scena della voce (copione.json): nel montaggio NON si accelerano.
// Uso: PRIV=... node rec_clip.js <home|catalogo|iscrizione|pagina_offerta|qr_cliente|banco|tutte>
const fs = require('fs');
const { chromium, appContext, loginCliente, APP, API, FOTO, APPDIR } = require('./ctx');
const { startRec, stopRec, RATE } = require('./recorder');
const ids = require(process.env.PRIV + '/demo_ids.json');
const osteria = ids.osteria, tutti = ids.tutti;
const TMP = (process.env.PRIV || '/tmp') + '/rec_tmp/'; fs.mkdirSync(TMP, { recursive: true }); fs.mkdirSync(APPDIR, { recursive: true });
const OUT = n => APPDIR + 'clip_' + n + '.mp4';
const VEL = 60;   // px CSS al secondo
let T0 = 0; const T = () => (Date.now() - T0) * RATE / 1000;   // «tempo di scena» in secondi dall'avvio della ripresa
const avvia = async (p, nome, rate) => { const r = await startRec(p, TMP + nome, rate); T0 = Date.now(); return r; };
const fino = async (p, t) => { const d = (t - T()) * 1000 / RATE; if (d > 0) await p.waitForTimeout(d); };
const typeSlow = async (loc, text, cps) => { await loc.click(); await loc.pressSequentially(text, { delay: 1000 / cps / RATE }); };
// scorrimento a velocità costante verso y1 (px CSS): la durata dipende solo dalla distanza
const glideY = async (p, y1) => {
  const y0 = await p.evaluate(() => window.scrollY); const ms = Math.abs(y1 - y0) / VEL * 1000 / RATE, t0 = Date.now();
  for (;;) {
    const q = Math.min(1, (Date.now() - t0) / ms);
    await p.evaluate(y => window.scrollTo(0, y), y0 + (y1 - y0) * q);
    if (q >= 1) break; await p.waitForTimeout(30);
  }
};
const yDi = (loc, off) => loc.evaluate((e, off) => e.getBoundingClientRect().top + window.scrollY - off, off);
const pronta = async p => { await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1500); };
const nascondiLocale = p => p.evaluate(() => {
  document.querySelectorAll('input,a,p,span,code').forEach(e => {
    if (e.value && /localhost:\d+/.test(e.value)) e.value = e.value.replace(/http:\/\/localhost:\d+/, 'https://scontiroma.it');
    else if (e.children.length === 0 && /localhost:\d+/.test(e.textContent || '')) e.textContent = e.textContent.replace(/http:\/\/localhost:\d+/, 'https://scontiroma.it');
  });
});

const clip = {
  async home(b) {   // scena 2: 9,7 s
    const c = await appContext(b); const p = await c.newPage();
    await p.goto(APP + '/', { waitUntil: 'networkidle' }); await p.getByTestId('hero-sottotitolo').waitFor({ timeout: 30000 }); await pronta(p);
    const r = await avvia(p, 'rec_home');
    await fino(p, 2.0); await glideY(p, 200); await fino(p, 9.4);
    console.log('home', await stopRec(r, OUT('home')));
  },
  async catalogo(b) {   // scena 3: 3,4 s
    const c = await appContext(b); const p = await c.newPage(); await loginCliente(p);
    await p.goto(APP + '/discounts', { waitUntil: 'networkidle' });
    await p.getByTestId(`discount-card-${osteria.discount}`).first().waitFor({ timeout: 30000 }); await pronta(p);
    const y0 = await yDi(p.getByTestId(`discount-card-${osteria.discount}`).first(), 130);
    await p.evaluate(y => window.scrollTo(0, y), y0); await p.waitForTimeout(600);
    const r = await avvia(p, 'rec_cat');
    await fino(p, 0.7); await glideY(p, y0 + 90); await fino(p, 3.3);
    console.log('catalogo', await stopRec(r, OUT('catalogo')));
  },
  // iscrizione (scena 4b, 4,2 s) e modulo offerta (scena 4a, 8,4 s)
  async iscrizione(b) {
    const c = await appContext(b); const p = await c.newPage();
    await p.goto(APP + '/register?role=merchant', { waitUntil: 'domcontentloaded' });
    await p.getByTestId('reg-shop').waitFor({ timeout: 60000 }); await pronta(p);
    await p.getByTestId('reg-name').fill('Luca'); await p.getByTestId('reg-email').fill('osteria.nuova6@example.com');
    await p.getByTestId('reg-password').fill('demo-luca-2026'); await p.getByTestId('reg-shop').fill("Osteria dell'Esempio");
    await p.getByTestId('reg-address-input').fill("Via dell'Esempio 1, Roma"); await p.getByTestId('reg-phone').fill('+39 06 0000000');
    await p.getByTestId('reg-zone').selectOption('Cassia'); await p.getByTestId('reg-category').selectOption('Ristorante');
    await p.evaluate(y => window.scrollTo(0, y), await yDi(p.getByTestId('reg-partita-iva'), 230)); await p.waitForTimeout(800);
    let r = await avvia(p, 'rec_reg');
    await fino(p, 0.3); await typeSlow(p.getByTestId('reg-partita-iva'), '12345678903', 12);
    await fino(p, 2.0); await glideY(p, (await p.evaluate(() => window.scrollY)) + 150); await fino(p, 4.4);
    console.log('iscrizione', await stopRec(r, OUT('iscrizione')));
    // fuori ripresa: si completano le caselle e si crea l'account, per poter registrare il modulo dell'offerta
    await p.getByTestId('legal-accept').scrollIntoViewIfNeeded(); await p.getByTestId('legal-accept').click(); await p.getByTestId('legal-specific').click();
    await p.getByTestId('reg-submit').scrollIntoViewIfNeeded(); await p.getByTestId('reg-submit').tap();
    await p.waitForURL(/setup-security|merchant/, { timeout: 30000 });
    await p.getByTestId('skip-security').click().catch(() => {}); await p.waitForTimeout(1500);
    await p.goto(APP + '/merchant/discount', { waitUntil: 'domcontentloaded' });
    await p.getByTestId('disc-title').waitFor({ timeout: 30000 }); await p.evaluate(() => document.fonts.ready);
    await p.getByTestId('disc-description').fill('Antipasto, primo e secondo di carne.');
    await p.locator('input[type=file]').first().setInputFiles(FOTO + 'menu_carne.jpg'); await p.waitForTimeout(3000);
    const conf = p.getByTestId('photo-add-confirm'); if (await conf.count()) { await conf.click(); await p.waitForTimeout(2000); }
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(500);
    const yt = await yDi(p.getByTestId('disc-title'), 150); await p.evaluate(y => window.scrollTo(0, y), yt); await p.waitForTimeout(1000);
    console.log('posizioni', JSON.stringify({ yt, yp: await yDi(p.getByTestId('disc-original'), 150), yu: await yDi(p.getByTestId('disc-uses-1'), 150), ys: await yDi(p.getByTestId('disc-submit'), 400) }));
    // Il modulo è molto lungo: a velocità lenta non si può scorrere tutto in 8 s. Si mostra la parte alta (titolo e prezzi),
    // poi si PASSA (taglio, senza scorrimento) ai pulsanti degli utilizzi e a «Pubblica».
    const yu = await yDi(p.getByTestId('disc-uses-1'), 150);
    r = await avvia(p, 'rec_form');
    await fino(p, 0.3); await typeSlow(p.getByTestId('disc-title'), 'Menù di carne', 7);
    await fino(p, 2.5); await typeSlow(p.getByTestId('disc-original'), '50', 3); await typeSlow(p.getByTestId('disc-discounted'), '30', 3);
    await fino(p, 4.2); await p.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), yu);
    await fino(p, 4.9); await p.getByTestId('disc-uses-1').click(); await fino(p, 6.9);
    await p.getByTestId('disc-submit').tap(); await fino(p, 8.4);
    console.log('offerta_form', await stopRec(r, OUT('offerta_form')));
  },
  async pagina_offerta(b) {   // scena 5: 12,2 s (il testo dei giorni sta più in basso: lo mostra anche una scritta grafica)
    const c = await appContext(b); const p = await c.newPage(); await loginCliente(p);
    await p.goto(APP + '/discounts/' + osteria.discount, { waitUntil: 'domcontentloaded' });
    await p.getByText('Menù di carne').first().waitFor({ timeout: 30000 }); await pronta(p);
    await p.evaluate(() => window.scrollTo(0, 140)); await p.waitForTimeout(600);
    const r = await avvia(p, 'rec_off');
    await fino(p, 0.6); await glideY(p, 430); await fino(p, 6.0); await glideY(p, 600); await fino(p, 12.4);
    console.log('pagina_offerta', await stopRec(r, OUT('pagina_offerta')));
  },
  async qr_cliente(b) {   // scena 6a: 3,2 s, a velocità reale (il conto alla rovescia del QR è un timer JS)
    const c = await appContext(b); const p = await c.newPage(); await loginCliente(p);
    await p.goto(APP + '/discounts/' + osteria.discount, { waitUntil: 'domcontentloaded' }); await p.getByText('Menù di carne').first().waitFor({ timeout: 30000 }); await pronta(p);
    const btn = p.getByRole('button', { name: /Mostra QR Code|Genera QR/ }).first(); await btn.waitFor({ timeout: 30000 });
    await btn.scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -200)); await p.waitForTimeout(800);
    const r = await startRec(p, TMP + 'rec_qr1', 1);
    await p.waitForTimeout(600); await btn.tap(); await p.getByTestId('qr-dialog').waitFor({ timeout: 30000 }); await p.waitForTimeout(2800);
    console.log('qr_cliente', await stopRec(r, OUT('qr_cliente')));
  },
  async banco(b) {   // scena 6b: 4,1 s
    const c = await appContext(b); const p = await c.newPage(); await loginCliente(p);
    const qr = await p.evaluate(async ({ api, did }) => {
      const r = await fetch(api + '/api/redemptions/create/' + did, { method: 'POST', credentials: 'include' }).then(r => r.json());
      const t = await fetch(`${api}/api/redemptions/${r.redemption.id}/token`, { credentials: 'include' }).then(r => r.json());
      return t.qr_value;
    }, { api: API, did: osteria.discount });
    const m = await fetch(API + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'osteria.esempio@example.com', password: 'demo-shop-2026' }) }).then(r => r.json());
    const code = (await fetch(API + '/api/merchants/me/shop-code', { headers: { Authorization: 'Bearer ' + m.access_token } }).then(r => r.json())).code;
    const c2 = await appContext(b); const q = await c2.newPage(); await q.goto('about:blank');
    const r = await avvia(q, 'rec_banco');
    await q.goto(qr, { waitUntil: 'domcontentloaded' });
    await q.getByTestId('shop-code-input').waitFor({ timeout: 30000 }); await q.evaluate(() => document.fonts.ready); await fino(q, 0.9);
    await q.getByTestId('shop-code-input').click(); await q.getByTestId('shop-code-input').pressSequentially(code, { delay: 300 }); await fino(q, 2.4);
    await q.getByTestId('shop-code-apply').tap();
    await q.getByRole('heading', { name: /SCONTO\s*VALIDO/i }).waitFor({ timeout: 30000 }); await q.evaluate(() => document.fonts.ready); await fino(q, 4.2);
    console.log('banco', await stopRec(r, OUT('banco')));
  },
};
(async () => {
  const b = await chromium.launch();
  const which = process.argv[2] || 'tutte';
  const lista = which === 'tutte' ? ['home', 'catalogo', 'pagina_offerta', 'qr_cliente', 'banco', 'iscrizione'] : [which];
  for (const n of lista) await clip[n](b);
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
