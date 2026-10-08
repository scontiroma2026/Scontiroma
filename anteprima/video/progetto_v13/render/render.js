// Rendering a fotogrammi della pagina scene.html: node render.js <inizio> <fine> <cartella> [ogni_n_secondi]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'); const fs = require('fs');
const [a, b, out, step] = [parseFloat(process.argv[2]), parseFloat(process.argv[3]), process.argv[4], process.argv[5]];
const FPS = 30;
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await pg.goto('file://' + path.join(__dirname, 'scene.html'));
  await pg.evaluate(() => document.fonts.ready);
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'timeline.json')));
  data.captions = JSON.parse(fs.readFileSync(path.join(__dirname, 'captions.json')));
  const sf = path.join(__dirname, 'sfondi.json'); data.sfondi = fs.existsSync(sf) ? JSON.parse(fs.readFileSync(sf)) : {};
  await pg.evaluate(d => window.setup(d), data);
  await pg.waitForTimeout(300);
  const times = step ? [] : null;
  if (step) for (let t = a; t < b; t += parseFloat(step)) times.push(t);
  const n = step ? times.length : Math.round((b - a) * FPS);
  for (let i = 0; i < n; i++) {
    const t = step ? times[i] : a + i / FPS;
    await pg.evaluate(t => window.render(t), t);
    await pg.evaluate(() => Promise.all([...document.images].filter(i => i.src && !i.complete).map(i => new Promise(r => { i.onload = i.onerror = r; }))));
    await pg.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await pg.screenshot({ path: path.join(out, (step ? `t_${t.toFixed(2)}` : String(i).padStart(5, '0')) + '.jpg'), type: 'jpeg', quality: 93 });
  }
  await br.close();
})();
