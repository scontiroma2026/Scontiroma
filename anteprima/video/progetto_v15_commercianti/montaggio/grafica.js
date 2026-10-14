// Disegna le grafiche del video v15 (commercianti): titolo, schede, esempio ristorante/enoteca, costi, chiusura con la guida.
// Formati: v = 1080x1920 con scritte, vc = 1080x1920 senza scritte, q = 1080x1080 quadrato con scritte.
// Uscita in $PRIV/img/<formato>_<nome>.png (cartella privata, fuori dal repository). Uso: PRIV=... node grafica.js
const fs = require('fs'); const path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const cop = require('./copione.json');
const PRIV = process.env.PRIV; if (!PRIV) { console.error('Imposta PRIV'); process.exit(1); }
const OUT = path.join(PRIV, 'img') + '/'; fs.mkdirSync(OUT, { recursive: true });
const FONTS = path.resolve(__dirname, '../../../../frontend/public/fonts/fonts.css');
const GUIDA = path.join(PRIV, 'guida') + '/';
const INK = '#1A1530', FUCSIA = '#D81B72', VIOLA = '#6D4AFF', TEAL = '#00798C', FONDO = '#F2F0EB', SOFT = '#4a4560';
const F = {
  v: { W: 1080, H: 1920, clean: false }, vc: { W: 1080, H: 1920, clean: true }, q: { W: 1080, H: 1080, clean: false },
};
const base = f => `<meta charset="utf-8"><link rel="stylesheet" href="file://${FONTS}"><style>
*{box-sizing:border-box;margin:0;padding:0} html,body{width:${F[f].W}px;height:${F[f].H}px;overflow:hidden}
body{font-family:'Manrope',sans-serif;color:${INK};-webkit-font-smoothing:antialiased;position:relative}
b{color:${FUCSIA};font-weight:inherit}
.logo{display:flex;align-items:center;gap:22px;justify-content:center}
.logo i{width:96px;height:96px;border-radius:28px;background:linear-gradient(135deg,${FUCSIA},${VIOLA});color:#fff;font:800 60px/96px 'Manrope',sans-serif;text-align:center;font-style:normal}
.logo span{font:800 64px 'Manrope',sans-serif}
${F[f].clean ? '.tx,.lab,.tit,.pr,.vec,.ch,.cr,.gi{visibility:hidden!important}' : '.sc{display:none!important}'}
</style>`;
const logo = (z = 1) => `<div class="logo" style="zoom:${z}"><i>S</i><span>Sconti Roma</span></div>`;
const pag = (f, css, corpo, fondo = FONDO) => `<!doctype html><html><head>${base(f)}<style>body{background:${fondo}}${css}</style></head><body>${corpo}</body></html>`;
// logo al centro, visibile solo nella versione senza scritte (le grafiche di solo testo)
const logoClean = f => `<div class="sc" style="position:absolute;left:0;right:0;top:${F[f].H / 2 - 60}px"><div class="logo" style="zoom:1.3"><i>S</i><span>Sconti Roma</span></div></div>`;

// sottotitoli sopra le schermate dell'app (sfondo trasparente)
const sottotitolo = (f, t) => f === 'q'
  ? pag(f, `.c{position:absolute;left:50px;right:50px;top:20px;height:250px;display:flex;align-items:center;justify-content:center;text-align:center;font:800 50px/1.2 'Manrope',sans-serif;letter-spacing:-.01em}`, `<div class="c"><div>${t}</div></div>`, 'transparent')
  : pag(f, `.c{position:absolute;left:70px;right:70px;top:60px;height:380px;display:flex;align-items:center;justify-content:center;text-align:center;font:800 58px/1.22 'Manrope',sans-serif;letter-spacing:-.01em}`, `<div class="c"><div>${t}</div></div>`, 'transparent');
const subTop = (f, t) => f === 'q'
  ? `<div class="tx" style="position:absolute;left:50px;right:50px;top:20px;height:250px;display:flex;align-items:center;justify-content:center;text-align:center;font:800 50px/1.2 'Manrope',sans-serif"><div>${t}</div></div>`
  : `<div class="tx" style="position:absolute;left:70px;right:70px;top:60px;height:380px;display:flex;align-items:center;justify-content:center;text-align:center;font:800 58px/1.22 'Manrope',sans-serif"><div>${t}</div></div>`;

const G = {};
for (const f of ['v', 'vc', 'q']) {
  const Q = f === 'q';
  // ---- titolo
  G[f + '_titolo_1'] = pag(f, Q ? `.l{position:absolute;top:150px;left:0;right:0}.h{position:absolute;left:60px;right:60px;top:470px;text-align:center;font:800 100px/1.1 'Manrope',sans-serif}`
    : `.l{position:absolute;top:200px;left:0;right:0}.h{position:absolute;left:80px;right:80px;top:700px;text-align:center;font:800 112px/1.1 'Manrope',sans-serif}`,
    `<div class="l">${logo()}</div><div class="h tx">Hai un'attività a <b>Roma</b>?</div>`);
  G[f + '_titolo_2'] = pag(f, Q ? `.l{position:absolute;top:110px;left:0;right:0}.h{position:absolute;left:60px;right:60px;top:390px;text-align:center;font:800 100px/1.1 'Manrope',sans-serif}.s{position:absolute;left:80px;right:80px;top:720px;text-align:center;font:700 52px/1.3 'Manrope',sans-serif;color:${SOFT}}`
    : `.l{position:absolute;top:200px;left:0;right:0}.h{position:absolute;left:80px;right:80px;top:640px;text-align:center;font:800 112px/1.1 'Manrope',sans-serif}.s{position:absolute;left:100px;right:100px;top:1110px;text-align:center;font:700 58px/1.3 'Manrope',sans-serif;color:${SOFT}}`,
    `<div class="l">${logo()}</div><div class="h tx">Hai un'attività a <b>Roma</b>?</div><div class="s tx">Come portare <b>nuovi clienti</b> nel tuo negozio.</div>`);
  // ---- costi
  const voci = [['Gratuita nella fase di lancio', ''], ['Circa due mesi di prova', 'dalla prima offerta'], ['Poi un abbonamento mensile semplice', '<span class="p">4,99 € al mese + IVA</span>'], ['Lo attivi una volta sola', 'con carta o PayPal. Nessuna sorpresa.']];
  const costi = n => pag(f, Q ? `
    .h{position:absolute;left:0;right:0;top:36px;text-align:center;font:800 78px/1 'Manrope',sans-serif}
    .v{position:absolute;left:80px;right:80px;display:flex;gap:28px;align-items:flex-start}
    .n{flex:none;width:60px;height:60px;border-radius:50%;background:${FUCSIA};color:#fff;font:800 32px/60px 'Manrope',sans-serif;text-align:center;margin-top:4px}
    .t{font:800 42px/1.2 'Manrope',sans-serif}.u{margin-top:6px;font:600 34px/1.3 'Manrope',sans-serif;color:${SOFT}}
    .p{display:inline-block;font:800 56px/1.1 'Manrope',sans-serif;color:${FUCSIA}}
    .f{position:absolute;left:80px;right:80px;top:930px;border-radius:28px;border:3px solid ${TEAL};padding:26px 36px;font:700 40px/1.3 'Manrope',sans-serif;color:${TEAL};text-align:center}`
    : `
    .h{position:absolute;left:0;right:0;top:190px;text-align:center;font:800 100px/1 'Manrope',sans-serif}
    .v{position:absolute;left:110px;right:110px;display:flex;gap:36px;align-items:flex-start}
    .n{flex:none;width:76px;height:76px;border-radius:50%;background:${FUCSIA};color:#fff;font:800 40px/76px 'Manrope',sans-serif;text-align:center;margin-top:6px}
    .t{font:800 54px/1.2 'Manrope',sans-serif}.u{margin-top:12px;font:600 44px/1.3 'Manrope',sans-serif;color:${SOFT}}
    .p{display:inline-block;font:800 76px/1.1 'Manrope',sans-serif;color:${FUCSIA}}
    .f{position:absolute;left:110px;right:110px;top:1610px;border-radius:36px;border:3px solid ${TEAL};padding:44px 50px;font:700 50px/1.3 'Manrope',sans-serif;color:${TEAL};text-align:center}`,
    `<div class="tx"><div class="h">Quanto costa</div>` + voci.map((v, i) => `<div class="v" style="top:${Q ? 170 + i * 185 : 440 + i * 295}px;visibility:${n > i ? 'visible' : 'hidden'}"><div class="n">${i + 1}</div><div><div class="t">${v[0]}</div><div class="u">${v[1]}</div></div></div>`).join('')
    + `<div class="f" style="visibility:${n >= 5 ? 'visible' : 'hidden'}">La disdetta vale dalla fine del mese</div></div>` + logoClean(f));
  for (let i = 0; i <= 5; i++) G[f + '_costi_' + i] = costi(i);

  // ---- esempio: ristorante ed enoteca (grafica neutra, nessun marchio, nessuna percentuale)
  const k = Q ? 0.7 : 1;
  const piatto = `<svg width="260" height="260" viewBox="0 0 260 260" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"><circle cx="130" cy="130" r="86" fill="#fff"/><circle cx="130" cy="130" r="52"/><path d="M28 60v60M44 60v60M60 60v60M28 120q16 14 32 0M44 120v90"/><path d="M232 60q-22 22-22 70h22M232 60v150"/></svg>`;
  const bott = (x, c, h) => `<g transform="translate(${x},${150 - h})"><path d="M22 0h16v28q22 10 22 40v${h - 72}a8 8 0 0 1-8 8H8a8 8 0 0 1-8-8V68q0-30 22-40z" fill="${c}"/><rect x="22" y="0" width="16" height="10" rx="3" fill="${INK}"/></g>`;
  const bottiglie = `<svg width="300" height="260" viewBox="0 0 300 200" fill="none">${bott(20, VIOLA, 170)}${bott(120, FUCSIA, 150)}${bott(220, TEAL, 165)}</svg>`;
  const giorni = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
  const chipsG = on => `<div class="ch">${giorni.map(g => `<span class="${on.includes(g) ? 'on' : ''}">${g}</span>`).join('')}</div>`;
  const cardCss = `.card{position:absolute;left:${Q ? 60 : 90}px;right:${Q ? 60 : 90}px;top:${Q ? 290 : 520}px;bottom:${Q ? 40 : 150}px;background:#fff;border-radius:48px;box-shadow:0 14px 50px rgba(40,30,70,.18);overflow:hidden}
    .in{zoom:${k};position:absolute;left:0;right:0;top:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px;padding:40px 60px;text-align:center}
    .lab{font:800 40px/1 'Manrope',sans-serif;letter-spacing:.18em;color:${TEAL}}
    .tit{font:800 92px/1.05 'Manrope',sans-serif}
    .pr{font:800 150px/1 'Manrope',sans-serif}
    .vec{font:800 100px/1 'Manrope',sans-serif;color:#9a95aa;text-decoration:line-through;text-decoration-thickness:8px}
    .ch{display:flex;gap:14px;flex-wrap:wrap;justify-content:center}.ch span{font:700 44px/1 'Manrope',sans-serif;padding:20px 26px;border-radius:26px;border:3px solid #d9d4e6;color:#8c86a0}
    .ch span.on{background:${FUCSIA};border-color:${FUCSIA};color:#fff}
    .cr{display:flex;gap:16px;flex-wrap:wrap;justify-content:center}.cr span{font:700 44px/1 'Manrope',sans-serif;padding:20px 28px;border-radius:26px;background:#efeaff;color:${VIOLA}}
    .gi{font:800 54px/1.2 'Manrope',sans-serif;padding:26px 40px;border-radius:30px;border:4px solid ${TEAL};color:${TEAL}}
    .esn{position:absolute;right:${Q ? 78 : 110}px;top:${Q ? 306 : 540}px;font:800 30px/1 'Manrope',sans-serif;color:${SOFT};letter-spacing:.06em;text-transform:uppercase}`;
  const ristor = (n) => {
    let h = `<div>${piatto}</div><div class="lab">RISTORANTE</div>`;
    if (n >= 1) h += `<div class="tit">Menù di carne</div>`;
    if (n === 1) h += `<div class="pr">€50</div>`;
    if (n >= 2) h += chipsG(['Mar', 'Gio']);
    if (n === 2) h += `<div class="pr">€50</div>`;
    if (n >= 3) h += `<div style="display:flex;gap:40px;align-items:center"><div class="vec">€50</div><div class="pr" style="color:${FUCSIA}">€30</div></div>`;
    return h;
  };
  const eno = n => {
    let h = `<div>${bottiglie}</div><div class="lab">ENOTECA</div><div class="tit">Vini che girano poco</div>`;
    if (n >= 1) h += `<div class="cr"><span>di quanto</span><span>in quali giorni</span><span>quante volte al mese</span></div>`;
    if (n >= 2) h += `<div class="gi">Smaltisci la giacenza</div>`;
    return h;
  };
  const esempio = (corpo, t) => pag(f, cardCss, `${subTop(f, t)}<div class="card"><div class="in">${corpo}</div></div><div class="esn tx">Scena di esempio</div>${F[f].clean ? '' : ''}`);
  const tmap = {};
  for (const p of cop.parti) if (p.grafica === 'esempio') for (const s of p.segmenti) tmap[s.img] = s.t;
  G[f + '_rist_a'] = esempio(ristor(0), tmap.rist_a); G[f + '_rist_0'] = esempio(ristor(1), tmap.rist_0);
  G[f + '_rist_1'] = esempio(ristor(2), tmap.rist_1); G[f + '_rist_2'] = esempio(ristor(3), tmap.rist_2); G[f + '_rist_3'] = esempio(ristor(3), tmap.rist_3);
  G[f + '_eno_0'] = esempio(eno(0), tmap.eno_0); G[f + '_eno_1'] = esempio(eno(1), tmap.eno_1); G[f + '_eno_2'] = esempio(eno(2), tmap.eno_2);

  // ---- chiusura con la guida (8 schermate della guida per i negozi, dati d'esempio)
  const gTit = ['Registrati', 'Scegli offerta e sconto', 'Aggiungi una foto', 'Giorni e utilizzi', 'Approvazione', 'Codice a 4 cifre', 'Dashboard', 'Stampa la locandina'];
  const cols = Q ? 4 : 2, cw = Q ? 238 : 440, ch = Q ? 142 : 220, gx = Q ? 12 : 20, gy = Q ? 56 : 50;
  const chius = n => {
    const x0 = (1080 - (cols * cw + (cols - 1) * gx)) / 2, y0 = Q ? 205 : 380;
    let tiles = '';
    for (let i = 0; i < 8; i++) {
      const x = x0 + (i % cols) * (cw + gx), y = y0 + Math.floor(i / cols) * (ch + gy);
      tiles += `<div style="position:absolute;left:${x}px;top:${y}px;width:${cw}px;visibility:${n === 'fin' || n > i ? 'visible' : 'hidden'}"><div style="width:${cw}px;height:${ch}px;border-radius:${Q ? 12 : 18}px;overflow:hidden;border:2px solid #d9d4e6;background:#fff"><img src="file://${GUIDA}${i + 1}-${['registrazione', 'offerta', 'foto', 'giorni-utilizzi', 'approvazione', 'codice', 'dashboard', 'locandina'][i]}.jpg" style="width:100%;height:100%;object-fit:cover;object-position:left top"></div><div class="tx" style="font:800 ${Q ? 19 : 28}px/1.2 'Manrope',sans-serif;margin-top:${Q ? 6 : 8}px"><span style="color:${FUCSIA}">${i + 1}</span> ${gTit[i]}</div></div>`;
    }
    const ey = Q ? 710 : 1500;
    return pag(f, `.m{position:absolute;left:30px;right:30px;bottom:${Q ? 40 : 110}px;text-align:center;font:700 ${Q ? 26 : 34}px/1.4 'Manrope',sans-serif;color:#6a6580}`,
      `<div style="position:absolute;top:${Q ? 24 : 110}px;left:0;right:0">${logo(Q ? 0.62 : 0.9)}</div>
       <div class="tx" style="position:absolute;top:${Q ? 112 : 250}px;left:40px;right:40px;text-align:center;font:800 ${Q ? 42 : 56}px/1.15 'Manrope',sans-serif">Guida in una pagina per i negozi</div>
       <div class="tx" style="position:absolute;top:${Q ? 160 : 322}px;left:40px;right:40px;text-align:center;font:600 ${Q ? 24 : 32}px/1.2 'Manrope',sans-serif;color:${SOFT}">Schermate di esempio, dati inventati</div>
       ${tiles}
       <div class="tx" style="position:absolute;left:30px;right:30px;top:${ey}px;text-align:center;font:800 ${Q ? 64 : 76}px/1.1 'Manrope',sans-serif;color:${FUCSIA}">info@scontiroma.it</div>
       <div class="tx" style="position:absolute;left:60px;right:60px;top:${ey + (Q ? 90 : 120)}px;text-align:center;font:800 ${Q ? 46 : 60}px/1.2 'Manrope',sans-serif;visibility:${n === 'fin' ? 'visible' : 'hidden'}">e ti aiutiamo a partire.</div>
       <div class="m tx">Per maggiorenni (18+) · Roma e dintorni · Sconti Roma</div>`);
  };
  for (let i = 0; i <= 8; i++) G[f + '_chiusura_' + i] = chius(i);
  G[f + '_chiusura_fin'] = chius('fin');
}

(async () => {
  const b = await chromium.launch();
  const salva = async (nome, html, f, trasp = false) => {
    const p = await b.newPage({ viewport: { width: F[f].W, height: F[f].H } });
    const tmp = OUT + nome + '.html'; fs.writeFileSync(tmp, html);
    await p.goto('file://' + tmp); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(120);
    await p.screenshot({ path: OUT + nome + '.png', omitBackground: trasp }); fs.unlinkSync(tmp); await p.close();
  };
  for (const [k, h] of Object.entries(G)) await salva(k, h, k.split('_')[0]);
  for (const f of ['v', 'q']) for (const parte of cop.parti) for (let i = 0; i < parte.segmenti.length; i++) {
    const s = parte.segmenti[i]; if (s.t && !parte.grafica) await salva(`${f}_sub_${parte.id}_${i}`, sottotitolo(f, s.t), f, true);
  }
  await b.close();
  console.log('grafiche:', fs.readdirSync(OUT).length);
})().catch(e => { console.error(e); process.exit(1); });
