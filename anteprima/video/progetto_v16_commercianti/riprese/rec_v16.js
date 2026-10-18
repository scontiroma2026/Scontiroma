// Riprese REALI dell'app per il video v16 (commercianti), server di prova locale con dati inventati (avvia_riprese.sh).
// Schermate intere: home, elenco sconti, pagina dell'offerta del ristorante e dell'enoteca, dashboard dei due commercianti.
// Clip: modulo dell'offerta («Menù di carne» 50 → 30), iscrizione con Partita IVA, QR del cliente, conferma al banco.
// Le clip sono già alla velocità della scena (scorrimenti a 65 px CSS/s, mai accelerati). Uso: PRIV=... node rec_v16.js
const fs = require('fs');
const { chromium, appContext, loginCliente, APP, API, FOTO, APPDIR } = require('./ctx');
const { startRec, stopRec, RATE } = require('./recorder');
const ids = require(process.env.PRIV + '/v16/demo_ids.json');
const osteria = ids.osteria, enoteca = ids.tutti['enoteca.esempio@example.com'];
const TMP = process.env.PRIV + '/v16/rec_tmp/'; fs.mkdirSync(TMP, { recursive: true }); fs.mkdirSync(APPDIR, { recursive: true });
const VEL = 65;
let T0 = 0; const T = () => (Date.now() - T0) * RATE / 1000;
const avvia = async (p, nome, rate) => { const r = await startRec(p, TMP + nome, rate); T0 = Date.now(); return r; };
const fino = async (p, t) => { const d = (t - T()) * 1000 / RATE; if (d > 0) await p.waitForTimeout(d); };
const typeSlow = async (loc, text, cps) => { await loc.click(); await loc.pressSequentially(text, { delay: 1000 / cps / RATE }); };
const glideY = async (p, y1) => {
  const y0 = await p.evaluate(() => window.scrollY); const ms = Math.abs(y1 - y0) / VEL * 1000 / RATE, t0 = Date.now();
  for (;;) { const q = Math.min(1, (Date.now() - t0) / ms); await p.evaluate(y => window.scrollTo(0, y), y0 + (y1 - y0) * q); if (q >= 1) break; await p.waitForTimeout(30); }
};
const yDi = (loc, off) => loc.evaluate((e, off) => e.getBoundingClientRect().top + window.scrollY - off, off);
const pronta = async p => { await p.waitForTimeout(2500); await p.evaluate(() => document.fonts.ready); };
const nascondiLocale = p => p.evaluate(() => document.querySelectorAll('input,a,p,span,code').forEach(e => {
  if (e.value && /localhost:\d+/.test(e.value)) e.value = e.value.replace(/http:\/\/localhost:\d+/, 'https://scontiroma.it');
  else if (e.children.length === 0 && /localhost:\d+/.test(e.textContent || '')) e.textContent = e.textContent.replace(/http:\/\/localhost:\d+/, 'https://scontiroma.it');
}));
(async () => {
  const b = await chromium.launch();
  // ---- schermate intere ----
  const c0 = await appContext(b); const h = await c0.newPage();
  await h.goto(APP + '/', { waitUntil: 'networkidle' }); await h.getByTestId('hero-sottotitolo').waitFor({ timeout: 30000 }); await pronta(h);
  await h.screenshot({ path: APPDIR + 'home_full.png', fullPage: true });
  const c1 = await appContext(b); const p = await c1.newPage(); await loginCliente(p);
  await p.goto(APP + '/discounts', { waitUntil: 'networkidle' });
  await p.getByTestId(`discount-card-${osteria.discount}`).first().waitFor({ timeout: 30000 }); await pronta(p);
  await p.screenshot({ path: APPDIR + 'sconti_full.png', fullPage: true });
  for (const [id, titolo, file] of [[osteria.discount, 'Menù di carne', 'offerta_full.png'], [enoteca.discount, 'Bottiglia di vino rosso', 'offerta_enoteca_full.png']]) {
    await p.goto(APP + '/discounts/' + id, { waitUntil: 'domcontentloaded' });
    await p.getByText(titolo).first().waitFor({ timeout: 30000 }); await pronta(p);
    await p.screenshot({ path: APPDIR + file, fullPage: true });
  }
  // ---- QR del cliente (velocità reale: il conto alla rovescia è un timer JS) ----
  await p.goto(APP + '/discounts/' + osteria.discount, { waitUntil: 'domcontentloaded' }); await p.getByText('Menù di carne').first().waitFor({ timeout: 30000 }); await pronta(p);
  const btn = p.getByRole('button', { name: /Mostra QR Code|Genera QR/ }).first(); await btn.waitFor({ timeout: 30000 });
  await btn.scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -140)); await p.waitForTimeout(800);
  const r1 = await startRec(p, TMP + 'rec_qr1', 1);
  await p.waitForTimeout(700); await btn.tap(); await p.getByTestId('qr-dialog').waitFor({ timeout: 30000 }); await p.waitForTimeout(3300);
  console.log('qr_cliente', await stopRec(r1, APPDIR + 'clip_qr_cliente.mp4'));
  const qr = await p.evaluate(async ({ api, did }) => {
    const r = await fetch(api + '/api/redemptions/create/' + did, { method: 'POST', credentials: 'include' }).then(r => r.json());
    const t = await fetch(`${api}/api/redemptions/${r.redemption.id}/token`, { credentials: 'include' }).then(r => r.json());
    return t.qr_value;
  }, { api: API, did: osteria.discount });
  const m = await fetch(API + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'osteria.esempio@example.com', password: 'demo-shop-2026' }) }).then(r => r.json());
  const code = (await fetch(API + '/api/merchants/me/shop-code', { headers: { Authorization: 'Bearer ' + m.access_token } }).then(r => r.json())).code;
  const c2 = await appContext(b); const q = await c2.newPage(); await q.goto('about:blank');
  const r2 = await avvia(q, 'rec_qr2');
  await q.goto(qr, { waitUntil: 'domcontentloaded' });
  await q.getByTestId('shop-code-input').waitFor({ timeout: 30000 }); await q.evaluate(() => document.fonts.ready); await fino(q, 0.9);
  await q.getByTestId('shop-code-input').click(); await q.getByTestId('shop-code-input').pressSequentially(code, { delay: 300 }); await fino(q, 2.4);
  await q.getByTestId('shop-code-apply').tap();
  await q.getByRole('heading', { name: /SCONTO\s*VALIDO/i }).waitFor({ timeout: 30000 }); await q.evaluate(() => document.fonts.ready); await fino(q, 4.4);
  console.log('qr_conferma', await stopRec(r2, APPDIR + 'clip_qr_conferma.mp4'));
  // ---- dashboard dei due commercianti ----
  for (const [email, file] of [['osteria.esempio@example.com', 'dashboard_full.png'], ['enoteca.esempio@example.com', 'dashboard_enoteca_full.png']]) {
    const c3 = await appContext(b); const d = await c3.newPage(); await loginCliente(d, email, 'demo-shop-2026');
    await d.goto(APP + '/merchant/dashboard', { waitUntil: 'networkidle' }); await d.getByTestId('merchant-dashboard').waitFor({ timeout: 30000 }); await pronta(d);
    await nascondiLocale(d); await d.screenshot({ path: APPDIR + file, fullPage: true });
  }
  // ---- iscrizione (Partita IVA) e modulo dell'offerta ----
  const c = await appContext(b); const pp = await c.newPage();
  await pp.goto(APP + '/register?role=merchant', { waitUntil: 'domcontentloaded' });
  await pp.getByTestId('reg-shop').waitFor({ timeout: 60000 }); await pronta(pp);
  await pp.getByTestId('reg-name').fill('Luca'); await pp.getByTestId('reg-email').fill('osteria.nuova7@example.com');
  await pp.getByTestId('reg-password').fill('demo-luca-2026'); await pp.getByTestId('reg-shop').fill("Osteria dell'Esempio");
  await pp.getByTestId('reg-address-input').fill("Via dell'Esempio 1, Roma"); await pp.getByTestId('reg-phone').fill('+39 06 0000000');
  await pp.getByTestId('reg-zone').selectOption('Cassia'); await pp.getByTestId('reg-category').selectOption('Ristorante');
  await pp.evaluate(y => window.scrollTo(0, y), await yDi(pp.getByTestId('reg-partita-iva'), 330)); await pp.waitForTimeout(800);
  let r = await avvia(pp, 'rec_reg');
  await fino(pp, 0.3); await typeSlow(pp.getByTestId('reg-partita-iva'), '12345678903', 12);
  await fino(pp, 2.0); await glideY(pp, (await pp.evaluate(() => window.scrollY)) + 150); await fino(pp, 4.4);
  console.log('iscrizione', await stopRec(r, APPDIR + 'clip_iscrizione.mp4'));
  await pp.getByTestId('legal-accept').scrollIntoViewIfNeeded(); await pp.getByTestId('legal-accept').click(); await pp.getByTestId('legal-specific').click();
  await pp.getByTestId('reg-submit').scrollIntoViewIfNeeded(); await pp.getByTestId('reg-submit').tap();
  await pp.waitForURL(/setup-security|merchant/, { timeout: 30000 });
  await pp.getByTestId('skip-security').click().catch(() => {}); await pp.waitForTimeout(1500);
  await pp.goto(APP + '/merchant/discount', { waitUntil: 'domcontentloaded' });
  await pp.getByTestId('disc-title').waitFor({ timeout: 30000 }); await pp.evaluate(() => document.fonts.ready);
  await pp.getByTestId('disc-description').fill('Antipasto, primo e secondo di carne.');
  await pp.locator('input[type=file]').first().setInputFiles(FOTO + 'menu_carne.jpg'); await pp.waitForTimeout(3000);
  const conf = pp.getByTestId('photo-add-confirm'); if (await conf.count()) { await conf.click(); await pp.waitForTimeout(2000); }
  await pp.evaluate(() => window.scrollTo(0, 0)); await pp.waitForTimeout(500);
  await pp.evaluate(y => window.scrollTo(0, y), await yDi(pp.getByTestId('disc-title'), 200)); await pp.waitForTimeout(1000);
  const yu = await yDi(pp.getByTestId('disc-uses-1'), 200);
  r = await avvia(pp, 'rec_form');
  // il modulo è lungo: parte alta (titolo e prezzi), poi taglio ai pulsanti degli utilizzi e a «Pubblica»
  await fino(pp, 0.3); await typeSlow(pp.getByTestId('disc-title'), 'Menù di carne', 7);
  await fino(pp, 2.5); await typeSlow(pp.getByTestId('disc-original'), '50', 3); await typeSlow(pp.getByTestId('disc-discounted'), '30', 3);
  await fino(pp, 4.2); await pp.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), yu);
  await fino(pp, 4.9); await pp.getByTestId('disc-uses-1').click(); await fino(pp, 6.9);
  await pp.getByTestId('disc-submit').tap(); await fino(pp, 8.4);
  console.log('form', await stopRec(r, APPDIR + 'clip_form_offerta.mp4'));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
