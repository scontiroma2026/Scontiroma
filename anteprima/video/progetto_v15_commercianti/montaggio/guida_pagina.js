// Rende la guida per i negozi (PR #146) in alta risoluzione e salva i riquadri dei passi: PRIV/gh/pagina.png e PRIV/gh/celle.json
const { chromium } = require('/opt/node22/lib/node_modules/playwright'); const fs = require('fs');
(async () => {
  const D = process.env.PRIV + '/gh/'; const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1123, height: 794 }, deviceScaleFactor: 4 });
  await p.goto('file://' + D + 'guida.html'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  // Nel video si tolgono i due riquadri su costi e disdetta (il video li dice a voce, con la formula decisa dal titolare)
  await p.evaluate(() => document.querySelectorAll('.cella').forEach(e => { const t = (e.querySelector('h3') || {}).textContent || ''; if (/E dopo|Come disdire/.test(t)) e.style.visibility = 'hidden'; }));
  const celle = await p.evaluate(() => [...document.querySelectorAll('.cella')].map(e => { const r = e.getBoundingClientRect(); return { t: (e.querySelector('h1,h2,h3') || {}).textContent, x: r.x, y: r.y, w: r.width, h: r.height }; }));
  const pg = await p.evaluate(() => { const r = document.querySelector('.pagina').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await p.screenshot({ path: D + 'pagina.png', clip: { x: pg.x, y: pg.y, width: pg.w, height: pg.h } });
  fs.writeFileSync(D + 'celle.json', JSON.stringify({ pagina: pg, celle }, null, 1)); console.log(JSON.stringify({ pg, celle }, null, 0)); await b.close();
})();
