// Fotogrammi singoli (PNG) a tempi scelti: node render_tempi.js <cartella> t1 t2 ...
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'); const fs = require('fs');
const out = process.argv[2], times = process.argv.slice(3).map(parseFloat);
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await pg.goto('file://' + path.join(__dirname, 'scene.html'));
  await pg.evaluate(() => document.fonts.ready);
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'timeline.json')));
  data.captions = JSON.parse(fs.readFileSync(path.join(__dirname, 'captions.json')));
  data.sfondi = JSON.parse(fs.readFileSync(path.join(__dirname, 'sfondi.json')));
  await pg.evaluate(d => window.setup(d), data);
  await pg.waitForTimeout(300);
  for (const t of times) {
    await pg.evaluate(t => window.render(t), t);
    await pg.evaluate(() => Promise.all([...document.images].filter(i => i.src && !i.complete).map(i => new Promise(r => { i.onload = i.onerror = r; }))));
    await pg.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await pg.screenshot({ path: path.join(out, `t_${t.toFixed(2)}.png`) });
  }
  await br.close();
})();
