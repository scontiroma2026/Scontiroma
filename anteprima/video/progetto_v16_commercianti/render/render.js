// Rendering a fotogrammi della scena (video v16). Uso: PRIV=... node render.js <modo v|vc|q> <inizio> <fine> <cartella> [ogni_n_secondi]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'); const fs = require('fs');
const R = path.join(process.env.PRIV, 'v16', 'render');
const [modo, a, b, out, step] = [process.argv[2], parseFloat(process.argv[3]), parseFloat(process.argv[4]), process.argv[5], process.argv[6]];
const FPS = 30, W = 1080, H = modo === 'q' ? 1080 : 1920;
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await pg.goto('file://' + path.join(R, 'scene.html'));
  await pg.evaluate(() => document.fonts.ready);
  const data = JSON.parse(fs.readFileSync(path.join(R, 'timeline.json')));
  await pg.evaluate(m => window.setMode(m), modo);
  await pg.evaluate(d => window.setup(d), data);
  await pg.waitForTimeout(300);
  const times = []; const n = step ? Math.floor((b - a) / parseFloat(step)) : Math.round((b - a) * FPS);
  for (let i = 0; i < n; i++) times.push(step ? a + i * parseFloat(step) : a + i / FPS);
  for (let i = 0; i < n; i++) {
    const t = times[i];
    await pg.evaluate(t => window.render(t), t);
    await pg.evaluate(() => Promise.all([...document.images].filter(i => i.src && !i.complete).map(i => new Promise(r => { i.onload = i.onerror = r; }))));
    await pg.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await pg.screenshot({ path: path.join(out, step ? `t_${t.toFixed(2)}.jpg` : String(i).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 88 });
  }
  await br.close();
})().catch(e => { console.error(e); process.exit(1); });
