// v13 · home_full, sconti_full, offerta_full, clip_qr_cliente, clip_qr_conferma, qr_*.png, dashboard_full.
// Dati fittizi del server locale (seed_v13.py). Uso: node rec_schermate_qr.js
const fs = require('fs');
const { chromium, appContext, loginCliente, APP, API, APPDIR } = require('./ctx');
const { startRec, stopRec, wait } = require('./recorder');
const ids = require('./demo_ids.json').osteria;
const TMP = process.env.V13_TMP || '/tmp/v13_rec/';
fs.mkdirSync(TMP, { recursive: true });
(async () => {
  const b = await chromium.launch();
  // ---- home (cliente non registrato) ----
  const c0 = await appContext(b); const h = await c0.newPage();
  await h.goto(APP + '/', { waitUntil: 'networkidle' });
  await h.getByTestId('hero-sottotitolo').waitFor({ timeout: 30000 }); await h.waitForTimeout(2500); await h.evaluate(() => document.fonts.ready);
  await h.screenshot({ path: APPDIR + 'home_full.png', fullPage: true });
  // ---- cliente: sconti, offerta, QR ----
  const c1 = await appContext(b); const p = await c1.newPage();
  await loginCliente(p);
  await p.goto(APP + '/discounts', { waitUntil: 'networkidle' });
  await p.getByTestId(`discount-card-${ids.discount}`).first().waitFor({ timeout: 30000 }); await p.waitForTimeout(2500); await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: APPDIR + 'sconti_full.png', fullPage: true });
  await p.goto(APP + '/discounts/' + ids.discount, { waitUntil: 'domcontentloaded' });
  await p.getByText('Menù di pesce').first().waitFor({ timeout: 30000 }); await p.waitForTimeout(2500); await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: APPDIR + 'offerta_full.png', fullPage: true });
  const btn = p.getByRole('button', { name: /Mostra QR Code|Genera QR/ }).first();
  await btn.waitFor({ timeout: 30000 });
  await btn.scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -140)); await p.waitForTimeout(800);
  const r1 = await startRec(p, TMP + 'rec_qr1', 1);  // velocità reale: il conto alla rovescia del QR è un timer JS
  await p.waitForTimeout(1000); await btn.tap(); await p.getByTestId('qr-dialog').waitFor({ timeout: 30000 }); await p.waitForTimeout(4500);
  console.log('clip qr cliente fotogrammi', await stopRec(r1, APPDIR + 'clip_qr_cliente.mp4'));
  await p.screenshot({ path: APPDIR + 'qr_cliente.png' });
  const qr = await p.evaluate(async ({ api, did }) => {
    const r = await fetch(api + '/api/redemptions/create/' + did, { method: 'POST', credentials: 'include' }).then(r => r.json());
    const t = await fetch(`${api}/api/redemptions/${r.redemption.id}/token`, { credentials: 'include' }).then(r => r.json());
    return t.qr_value;
  }, { api: API, did: ids.discount });
  // ---- banco: il commerciante inquadra il QR e scrive il codice del negozio ----
  const code = await (async () => {
    const m = await fetch(API + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'osteria.esempio@example.com', password: 'demo-shop-2026' }) }).then(r => r.json());
    const s = await fetch(API + '/api/merchants/me/shop-code', { headers: { Authorization: 'Bearer ' + m.access_token } }).then(r => r.json());
    return s.code;
  })();
  const c2 = await appContext(b); const q = await c2.newPage();
  await q.goto('about:blank');
  const r2 = await startRec(q, TMP + 'rec_qr2');
  await q.goto(qr, { waitUntil: 'domcontentloaded' });
  await q.getByTestId('shop-code-input').waitFor({ timeout: 30000 }); await q.evaluate(() => document.fonts.ready); await wait(q, 1.4);
  await q.getByTestId('shop-code-input').click(); await q.getByTestId('shop-code-input').pressSequentially(code, { delay: 400 });
  await wait(q, 0.5);
  await q.getByTestId('shop-code-apply').tap();
  await q.getByRole('heading', { name: /SCONTO\s*VALIDO/i }).waitFor({ timeout: 30000 });
  await q.evaluate(() => document.fonts.ready); await wait(q, 3.0);
  console.log('clip qr conferma fotogrammi', await stopRec(r2, APPDIR + 'clip_qr_conferma.mp4'));
  await q.screenshot({ path: APPDIR + 'qr_conferma.png' });
  // ---- dashboard del commerciante (dopo la scansione) ----
  const c3 = await appContext(b); const d = await c3.newPage();
  await loginCliente(d, 'osteria.esempio@example.com', 'demo-shop-2026');
  await d.goto(APP + '/merchant/dashboard', { waitUntil: 'networkidle' });
  await d.getByTestId('merchant-dashboard').waitFor({ timeout: 30000 }); await d.waitForTimeout(2500); await d.evaluate(() => document.fonts.ready);
  await d.screenshot({ path: APPDIR + 'dashboard_full.png', fullPage: true });
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
