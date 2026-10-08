// Controllo a vista: schermate dell'app nuova (non entra nel video). Uso: node guarda.js <cartella>
const { chromium, appContext, loginCliente, APP } = require('./ctx');
const ids = require('./demo_ids.json').osteria;
const out = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const c = await appContext(b); const p = await c.newPage();
  await p.goto(APP + '/', { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1500);
  await p.screenshot({ path: out + '/home.png' });
  await p.screenshot({ path: out + '/home_full.png', fullPage: true });
  await p.goto(APP + '/register?role=merchant', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
  await p.screenshot({ path: out + '/reg.png', fullPage: true });
  await loginCliente(p);
  await p.goto(APP + '/discounts', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  await p.screenshot({ path: out + '/sconti_full.png', fullPage: true });
  await p.goto(APP + '/discounts/' + ids.discount, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  await p.screenshot({ path: out + '/offerta_full.png', fullPage: true });
  await b.close();
})();
