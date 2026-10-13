// Disegna le grafiche del video v14 (sottotitoli e schermate a tutto schermo) con Fraunces e Manrope.
// Stile pulito: fondo chiaro, un solo colore di accento, nessun effetto. Uscita: img/*.png (1080x1920).
// Uso: node grafica.js
const fs = require('fs'); const path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const cop = require('./copione.json');
const OUT = path.join(__dirname, 'img') + '/'; fs.mkdirSync(OUT, { recursive: true });
const INK = '#1A1530', FUCSIA = '#D81B72', VIOLA = '#6D4AFF', TEAL = '#00798C', FONDO = '#F2F0EB';
const BASE = `<meta charset="utf-8"><link rel="stylesheet" href="file://${__dirname}/fonts/fonts.css"><style>
*{box-sizing:border-box;margin:0;padding:0} html,body{width:1080px;height:1920px;overflow:hidden}
body{font-family:'Manrope',sans-serif;color:${INK};-webkit-font-smoothing:antialiased}
.serif{font-family:'Fraunces',serif;font-optical-sizing:auto;font-variation-settings:"WONK" 0,"SOFT" 0}
b{color:${FUCSIA};font-weight:inherit}
.logo{display:flex;align-items:center;gap:22px;justify-content:center}
.logo i{width:96px;height:96px;border-radius:28px;background:linear-gradient(135deg,${FUCSIA},${VIOLA});color:#fff;font:600 60px/96px 'Fraunces',serif;text-align:center;font-style:normal}
.logo span{font:600 64px 'Fraunces',serif;font-variation-settings:"WONK" 0,"SOFT" 0}
</style>`;
const logo = '<div class="logo"><i>S</i><span>Sconti Roma</span></div>';
const pagina = (css, corpo, fondo = FONDO) => `<!doctype html><html><head>${BASE}<style>body{background:${fondo}}${css}</style></head><body>${corpo}</body></html>`;

const G = {};
// ---- sottotitoli sopra le schermate dell'app (sfondo trasparente)
const sottotitolo = t => pagina(`.c{position:absolute;left:70px;right:70px;top:60px;height:380px;display:flex;align-items:center;justify-content:center;text-align:center;
  font:600 68px/1.17 'Fraunces',serif;font-variation-settings:"WONK" 0,"SOFT" 0;letter-spacing:-.01em}`, `<div class="c"><div>${t}</div></div>`, 'transparent');
// ---- titolo
G.titolo_1 = pagina(`.l{position:absolute;top:200px;left:0;right:0}.h{position:absolute;left:80px;right:80px;top:700px;text-align:center;font:600 128px/1.08 'Fraunces',serif;font-variation-settings:"WONK" 0,"SOFT" 0}`,
  `<div class="l">${logo}</div><div class="h">Hai un'attività a <b>Roma</b>?</div>`);
G.titolo_2 = pagina(`.l{position:absolute;top:200px;left:0;right:0}.h{position:absolute;left:80px;right:80px;top:640px;text-align:center;font:600 128px/1.08 'Fraunces',serif;font-variation-settings:"WONK" 0,"SOFT" 0}
  .s{position:absolute;left:100px;right:100px;top:1110px;text-align:center;font:700 58px/1.3 'Manrope',sans-serif;color:#4a4560}`,
  `<div class="l">${logo}</div><div class="h">Hai un'attività a <b>Roma</b>?</div><div class="s">Come portare <b>nuovi clienti</b> nel tuo negozio.</div>`);
// ---- costi
const voci = [
  ['Gratuita nella fase di lancio', ''],
  ['Circa due mesi di prova', 'dalla prima offerta'],
  ['Poi un abbonamento mensile semplice', '<span class="p">4,99 € al mese + IVA</span>'],
  ['Lo attivi una volta sola', 'con carta o PayPal. Nessuna sorpresa.'],
];
const costi = n => pagina(`
  .h{position:absolute;left:0;right:0;top:190px;text-align:center;font:600 112px/1 'Fraunces',serif;font-variation-settings:"WONK" 0,"SOFT" 0}
  .v{position:absolute;left:110px;right:110px;display:flex;gap:36px;align-items:flex-start}
  .n{flex:none;width:76px;height:76px;border-radius:50%;background:${FUCSIA};color:#fff;font:800 40px/76px 'Manrope',sans-serif;text-align:center;margin-top:6px}
  .t{font:800 54px/1.2 'Manrope',sans-serif}.u{margin-top:12px;font:600 44px/1.3 'Manrope',sans-serif;color:#4a4560}
  .p{display:inline-block;font:700 76px/1.1 'Fraunces',serif;font-variation-settings:"WONK" 0,"SOFT" 0;color:${FUCSIA}}
  .f{position:absolute;left:110px;right:110px;top:1610px;border-radius:36px;border:3px solid ${TEAL};padding:44px 50px;font:700 50px/1.3 'Manrope',sans-serif;color:${TEAL};text-align:center}`,
  `<div class="h">Quanto costa</div>` + voci.map((v, i) => `<div class="v" style="top:${440 + i * 295}px;visibility:${n > i ? 'visible' : 'hidden'}"><div class="n">${i + 1}</div><div><div class="t">${v[0]}</div><div class="u">${v[1]}</div></div></div>`).join('')
  + `<div class="f" style="visibility:${n >= 5 ? 'visible' : 'hidden'}">La disdetta vale dalla fine del mese</div>`);
for (let i = 0; i <= 5; i++) G['costi_' + i] = costi(i === 4 ? 4 : i);
G.costi_4 = costi(4);
// il quarto stato (3 voci + prezzo) è lo stesso della terza voce
G.costi_3 = costi(3);
// ---- segnaposto del titolare
G.segnaposto = pagina(`.b{position:absolute;left:90px;right:90px;top:560px;height:800px;border:6px dashed ${VIOLA};border-radius:48px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:34px}
  .a{font:800 92px/1.1 'Manrope',sans-serif;color:${VIOLA}}.d{font:700 66px/1.2 'Fraunces',serif;font-variation-settings:"WONK" 0,"SOFT" 0}.n{font:600 38px/1.3 'Manrope',sans-serif;color:#4a4560;padding:0 90px}`,
  `<div class="b"><div class="a">DA INSERIRE</div><div class="d">testo del titolare</div><div class="n">Scena segnaposto: il video funziona anche senza questa scena.</div></div>`);
// ---- chiusura
const chiusura = n => pagina(`.l{position:absolute;top:240px;left:0;right:0}.q{position:absolute;left:80px;right:80px;top:700px;text-align:center;font:700 60px/1.2 'Manrope',sans-serif;color:#4a4560}
  .e{position:absolute;left:40px;right:40px;top:800px;text-align:center;font:600 92px/1.1 'Fraunces',serif;font-variation-settings:"WONK" 0,"SOFT" 0}
  .s{position:absolute;left:80px;right:80px;top:1010px;text-align:center;font:600 76px/1.2 'Fraunces',serif;font-variation-settings:"WONK" 0,"SOFT" 0;visibility:${n >= 2 ? 'visible' : 'hidden'}}
  .m{position:absolute;left:40px;right:40px;bottom:130px;text-align:center;font:700 34px/1.4 'Manrope',sans-serif;color:#6a6580}`,
  `<div class="l">${logo}</div><div class="q">Scrivici a</div><div class="e"><b>info@scontiroma.it</b></div><div class="s">e ti aiutiamo a partire.</div><div class="m">Per maggiorenni (18+) · Roma e dintorni · Sconti Roma</div>`);
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
