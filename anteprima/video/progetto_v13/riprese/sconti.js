// Solo sconti_full.png (senza toccare lo stato del server). Uso: node sconti.js
const { chromium, appContext, loginCliente, APP, APPDIR } = require('./ctx');
const ids = require('./demo_ids.json').osteria;
(async () => {
  const b = await chromium.launch(); const c = await appContext(b); const p = await c.newPage();
  await loginCliente(p);
  await p.goto(APP + '/discounts', { waitUntil: 'networkidle' });
  await p.getByTestId(`discount-card-${ids.discount}`).first().waitFor({ timeout: 30000 }); await p.waitForTimeout(2500); await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: APPDIR + 'sconti_full.png', fullPage: true }); await b.close();
})();
