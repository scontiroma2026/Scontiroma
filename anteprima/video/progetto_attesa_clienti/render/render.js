// Rendering a fotogrammi della scena. Uso: OUT=... node render.js <v|q> <cartella_fotogrammi> [ogni_n_secondi]
// Con il terzo argomento rende solo un fotogramma ogni n secondi (per il controllo a vista).
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'); const fs = require('fs');
const R = path.join(process.env.OUT, 'render');
const [modo, out, step] = [process.argv[2], process.argv[3], process.argv[4]];
const FPS = 30, W = 1080, H = modo === 'q' ? 1080 : 1920;
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const data = JSON.parse(fs.readFileSync(path.join(R, 'timeline.json')));
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await pg.route('**/*', r => r.request().url().startsWith('file:') ? r.continue() : r.abort());
  await pg.goto('file://' + path.join(R, 'scene.html'));
  await pg.evaluate(() => document.fonts.ready);
  await pg.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; }))));
  await pg.evaluate(m => window.setMode(m), modo);
  await pg.evaluate(d => window.setup(d), data);
  const times = (process.argv[5] ? process.argv[5].split(',').map(Number) : null) ||
    (step ? Array.from({ length: Math.floor(data.durata / step) + 1 }, (_, i) => i * step) : Array.from({ length: Math.round(data.durata * FPS) }, (_, i) => i / FPS));
  for (let i = 0; i < times.length; i++) {
    await pg.evaluate(t => window.render(t), times[i]);
    const file = path.join(out, step || process.argv[5] ? `t_${times[i].toFixed(2)}.jpg` : String(i).padStart(5, '0') + '.jpg');
    await pg.screenshot({ path: file, type: 'jpeg', quality: 92 });
  }
  await br.close();
  console.log(modo, 'fotogrammi', times.length);
})().catch(e => { console.error(e); process.exit(1); });
