// Controllo a vista dell'app di main (non entra nel video). Uso: node guarda.js <cartella>
const { chromium, appContext, loginCliente, APP } = require('./ctx');
const ids = require('./demo_ids.json').offerta;
const out = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const c = await appContext(b); const p = await c.newPage();
  const snap = async n => { await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1200); await p.screenshot({ path: out + '/' + n + '.png', fullPage: true }); };
  await p.goto(APP + '/', { waitUntil: 'networkidle' }); await snap('home');
  await p.goto(APP + '/register', { waitUntil: 'networkidle' }); await snap('reg');
  await p.goto(APP + '/discounts', { waitUntil: 'networkidle' }); await p.getByTestId('filter-zone').selectOption('Fuori Roma'); await snap('sconti_zona');
  await p.getByTestId('filter-zone').selectOption('Ostia'); await snap('zona_vuota');
  await loginCliente(p);
  await p.goto(APP + '/setup-security', { waitUntil: 'networkidle' }); await snap('setup');
  await p.goto(APP + '/discounts/' + ids.discount, { waitUntil: 'networkidle' }); await snap('offerta');
  await b.close();
})();
