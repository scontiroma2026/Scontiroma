// Rendering a fotogrammi della scena (video v17). Uso: PRIV=... node render.js <modo v|vc|q> <inizio> <fine> <cartella> [ogni_n_secondi]
// Ogni fotogramma ha un limite di tempo: se il browser si blocca (succede ogni tanto con quattro blocchi in parallelo) si riapre e si rifà il fotogramma.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'); const fs = require('fs');
const R = path.join(process.env.PRIV, 'v17', 'render');
const [modo, a, b, out, step] = [process.argv[2], parseFloat(process.argv[3]), parseFloat(process.argv[4]), process.argv[5], process.argv[6]];
const FPS = 30, W = 1080, H = modo === 'q' ? 1080 : 1920;
const LIMITE = 90000;
const entro = (p, ms, cosa) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('tempo scaduto: ' + cosa)), ms))]);
let br = null, pg = null;
async function apri() {
  if (br) { const v = br; br = null; entro(v.close(), 10000, 'chiusura').catch(() => {}); }
  br = await chromium.launch();
  pg = await br.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await pg.goto('file://' + path.join(R, 'scene.html'));
  await pg.evaluate(() => document.fonts.ready);
  const data = JSON.parse(fs.readFileSync(path.join(R, 'timeline.json')));
  await pg.evaluate(m => window.setMode(m), modo);
  await pg.evaluate(d => window.setup(d), data);
  await pg.waitForTimeout(300);
}
async function fotogramma(t, file) {
  await pg.evaluate(t => window.render(t), t);
  // le immagini che non si caricano non devono bloccare: al massimo 15 s
  await pg.evaluate(() => Promise.race([Promise.all([...document.images].filter(i => i.src && !i.complete).map(i => new Promise(r => { i.onload = i.onerror = r; }))), new Promise(r => setTimeout(r, 15000))]));
  await pg.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  await pg.screenshot({ path: file, type: 'jpeg', quality: 88 });
}
(async () => {
  fs.mkdirSync(out, { recursive: true });
  await entro(apri(), LIMITE, 'avvio');
  const times = []; const n = step ? Math.floor((b - a) / parseFloat(step)) : Math.round((b - a) * FPS);
  for (let i = 0; i < n; i++) times.push(step ? a + i * parseFloat(step) : a + i / FPS);
  for (let i = 0; i < n; i++) {
    const t = times[i];
    const file = path.join(out, step ? `t_${t.toFixed(2)}.jpg` : String(i).padStart(5, '0') + '.jpg');
    for (let prova = 1; ; prova++) {
      try { await entro(fotogramma(t, file), LIMITE, 'fotogramma ' + t.toFixed(2)); break; }
      catch (e) {
        console.error(`[${modo} ${a}-${b}] ${e.message} (prova ${prova})`);
        if (prova >= 4) throw e;
        await entro(apri(), LIMITE, 'riapertura').catch(async () => { await apri(); });
      }
    }
  }
  await entro(br.close(), 10000, 'chiusura finale').catch(() => {});
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
