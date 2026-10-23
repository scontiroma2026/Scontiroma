// Rendering a fotogrammi della scena. Uso: OUT=... node render.js <v|q> <cartella_fotogrammi> [ogni_n_secondi] [istanti,separati,da,virgole]
// Con il terzo o quarto argomento rende solo alcuni fotogrammi (per il controllo a vista).
// Il browser si riapre ogni 300 fotogrammi e, se si chiude da solo (memoria), riprende dal fotogramma a cui era arrivato.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'); const fs = require('fs');
const R = path.join(process.env.OUT, 'render');
const [modo, out, step] = [process.argv[2], process.argv[3], process.argv[4]];
const FPS = 30, W = 1080, H = modo === 'q' ? 1080 : 1920, BLOCCO = 300;
const data = JSON.parse(fs.readFileSync(path.join(R, 'timeline.json')));
let br = null, pg = null;
async function apri() {
  if (br) await br.close().catch(() => {});
  br = await chromium.launch();
  pg = await br.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await pg.route('**/*', r => r.request().url().startsWith('file:') ? r.continue() : r.abort());
  await pg.goto('file://' + path.join(R, 'scene.html'));
  await pg.evaluate(() => document.fonts.ready);
  await pg.evaluate(m => window.setMode(m), modo);
  await pg.evaluate(d => window.setup(d), data);
  await pg.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; }))));
}
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const times = (process.argv[5] ? process.argv[5].split(',').map(Number) : null) ||
    (step && step !== '0' ? Array.from({ length: Math.floor(data.durata / step) + 1 }, (_, i) => i * step) : Array.from({ length: Math.round(data.durata * FPS) }, (_, i) => i / FPS));
  const nomina = i => path.join(out, process.argv[5] || (step && step !== '0') ? `t_${times[i].toFixed(2)}.jpg` : String(i).padStart(5, '0') + '.jpg');
  await apri();
  for (let i = 0; i < times.length; i++) {
    if (i && i % BLOCCO === 0) await apri();
    for (let prova = 1; ; prova++) {
      try {
        await pg.evaluate(t => window.render(t), times[i]);
        await pg.screenshot({ path: nomina(i), type: 'jpeg', quality: 92 });
        break;
      } catch (e) {
        console.error(`fotogramma ${i}: ${e.message.split('\n')[0]} (prova ${prova})`);
        if (prova >= 3) throw e;
        await apri();
      }
    }
  }
  await br.close();
  console.log(modo, 'fotogrammi', times.length);
})().catch(e => { console.error(e); process.exit(1); });
