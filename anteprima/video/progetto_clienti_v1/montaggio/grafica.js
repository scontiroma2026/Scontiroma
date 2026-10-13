// Disegna le grafiche del video per i clienti (v1): sottotitoli e schermate a tutto schermo.
// Stile pulito come la v14 (fondo chiaro, un solo accento fucsia, nessun effetto) ma con MANROPE anche nei titoli
// (decisione: al titolare non piacciono la «s» e la «f» del serif Fraunces; scelta definitiva ancora da fare).
// Uscita: img/*.png (1080x1920). Uso: node grafica.js
const fs = require('fs'); const path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const cop = require('./copione.json');
const OUT = path.join(__dirname, 'img') + '/'; fs.mkdirSync(OUT, { recursive: true });
// caratteri: si usano quelli già nel repository (frontend/public/fonts), con percorsi di file locali
const FONTDIR = path.join(__dirname, 'fonts'); fs.mkdirSync(FONTDIR, { recursive: true });
const PUB = path.resolve(__dirname, '..', '..', '..', '..', 'frontend', 'public', 'fonts');
fs.writeFileSync(FONTDIR + '/fonts.css', fs.readFileSync(PUB + '/fonts.css', 'utf8').replace(/url\(\/fonts\//g, `url(file://${PUB}/`));
const INK = '#1A1530', FUCSIA = '#D81B72', VIOLA = '#6D4AFF', TEAL = '#00798C', FONDO = '#F2F0EB';
const BASE = `<meta charset="utf-8"><link rel="stylesheet" href="file://${FONTDIR}/fonts.css"><style>
*{box-sizing:border-box;margin:0;padding:0} html,body{width:1080px;height:1920px;overflow:hidden}
body{font-family:'Manrope',sans-serif;color:${INK};-webkit-font-smoothing:antialiased}
b{color:${FUCSIA};font-weight:inherit}
.logo{display:flex;align-items:center;gap:22px;justify-content:center}
.logo i{width:96px;height:96px;border-radius:28px;background:linear-gradient(135deg,${FUCSIA},${VIOLA});color:#fff;font:800 58px/96px 'Manrope',sans-serif;text-align:center;font-style:normal}
.logo span{font:800 64px 'Manrope',sans-serif;letter-spacing:-.02em}
</style>`;
const logo = '<div class="logo"><i>S</i><span>Sconti Roma</span></div>';
const pagina = (css, corpo, fondo = FONDO) => `<!doctype html><html><head>${BASE}<style>body{background:${fondo}}${css}</style></head><body>${corpo}</body></html>`;

const G = {};
// ---- sottotitoli sopra le schermate dell'app (sfondo trasparente)
const sottotitolo = t => pagina(`.c{position:absolute;left:70px;right:70px;top:60px;height:380px;display:flex;align-items:center;justify-content:center;text-align:center;
  font:800 64px/1.2 'Manrope',sans-serif;letter-spacing:-.02em}`, `<div class="c"><div>${t}</div></div>`, 'transparent');
// ---- titolo
G.titolo_1 = pagina(`.l{position:absolute;top:200px;left:0;right:0}.h{position:absolute;left:80px;right:80px;top:700px;text-align:center;font:800 120px/1.1 'Manrope',sans-serif;letter-spacing:-.03em}`,
  `<div class="l">${logo}</div><div class="h">Cerchi <b>sconti</b> vicino a casa?</div>`);
G.titolo_2 = pagina(`.l{position:absolute;top:200px;left:0;right:0}.h{position:absolute;left:80px;right:80px;top:640px;text-align:center;font:800 120px/1.1 'Manrope',sans-serif;letter-spacing:-.03em}
  .s{position:absolute;left:40px;right:40px;top:1160px;text-align:center;font:700 52px/1.3 'Manrope',sans-serif;color:#4a4560}`,
  `<div class="l">${logo}</div><div class="h">Cerchi <b>sconti</b> vicino a casa?</div><div class="s">Ecco come funziona <b>Sconti Roma</b>.</div>`);
// ---- costi (clienti)
const voci = [
  ['Gratuita nella fase di lancio', 'per chi usa gli sconti'],
  ['Registrarti e usare le offerte non costa nulla', ''],
  ['Non ti chiediamo dati di pagamento', ''],
];
const costi = n => pagina(`
  .h{position:absolute;left:0;right:0;top:400px;text-align:center;font:800 108px/1 'Manrope',sans-serif;letter-spacing:-.03em}
  .v{position:absolute;left:110px;right:110px;display:flex;gap:36px;align-items:flex-start}
  .n{flex:none;width:76px;height:76px;border-radius:50%;background:${FUCSIA};color:#fff;font:800 40px/76px 'Manrope',sans-serif;text-align:center;margin-top:6px}
  .t{font:800 58px/1.2 'Manrope',sans-serif}.u{margin-top:12px;font:600 46px/1.3 'Manrope',sans-serif;color:#4a4560}`,
  `<div class="h">Quanto costa</div>` + voci.map((v, i) => `<div class="v" style="top:${700 + i * 270}px;visibility:${n > i ? 'visible' : 'hidden'}"><div class="n">${i + 1}</div><div><div class="t">${v[0]}</div><div class="u">${v[1]}</div></div></div>`).join(''));
for (let i = 0; i <= 3; i++) G['costi_' + i] = costi(i);
// ---- chiusura
const chiusura = n => pagina(`.l{position:absolute;top:300px;left:0;right:0}
  .e{position:absolute;left:60px;right:60px;top:760px;text-align:center;font:800 112px/1.1 'Manrope',sans-serif;letter-spacing:-.03em}
  .s{position:absolute;left:60px;right:60px;top:1060px;text-align:center;font:800 88px/1.15 'Manrope',sans-serif;letter-spacing:-.03em;visibility:${n >= 2 ? 'visible' : 'hidden'}}
  .m{position:absolute;left:40px;right:40px;bottom:130px;text-align:center;font:700 34px/1.5 'Manrope',sans-serif;color:#6a6580}`,
  `<div class="l">${logo}</div><div class="e">Apri <b>Sconti Roma</b></div><div class="s">e scegli la tua zona.</div><div class="m">Per maggiorenni (18+) · Roma e dintorni<br>Gratuita nella fase di lancio · Sconti Roma</div>`);
G.chiusura_1 = chiusura(1); G.chiusura_2 = chiusura(2);

(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const salva = async (nome, html, trasp = false) => {
    fs.writeFileSync(OUT + nome + '.html', html);
    await p.goto('file://' + OUT + nome + '.html'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150);
    await p.screenshot({ path: OUT + nome + '.png', omitBackground: trasp }); fs.unlinkSync(OUT + nome + '.html');
  };
  for (const [k, h] of Object.entries(G)) await salva(k, h);
  for (const parte of cop.parti) for (let i = 0; i < parte.segmenti.length; i++) {
    const s = parte.segmenti[i]; if (s.t && !parte.grafica) await salva(`sub_${parte.id}_${i}`, sottotitolo(s.t), true);
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
