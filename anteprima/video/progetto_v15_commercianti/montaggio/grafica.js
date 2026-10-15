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
    .pc{display:inline-block;margin-top:6px;font:800 84px/1 'Manrope',sans-serif;color:#fff;background:${FUCSIA};padding:14px 30px;border-radius:30px}
    .tag{background:#fff;border:5px solid #e4dff0;border-radius:36px;padding:24px 34px;text-align:center;box-shadow:0 8px 26px rgba(40,30,70,.16)}
    .gi{font:800 54px/1.2 'Manrope',sans-serif;padding:26px 40px;border-radius:30px;border:4px solid ${TEAL};color:${TEAL}}
    .esn{position:absolute;right:${Q ? 78 : 110}px;bottom:${Q ? 58 : 172}px;font:800 30px/1 'Manrope',sans-serif;color:${SOFT};letter-spacing:.06em;text-transform:uppercase}`;
  const ristor = (n) => {
    let h = `<div>${piatto}</div><div class="lab">RISTORANTE</div>`;
    if (n >= 1) h += `<div class="tit">Menù di carne</div>`;
    if (n === 1) h += `<div class="pr">€50</div>`;
    if (n >= 2) h += chipsG(['Mar', 'Gio']);
    if (n === 2) h += `<div class="pr">€50</div>`;
    if (n >= 3) h += `<div style="display:flex;gap:40px;align-items:center"><div class="vec">€50</div><div class="pr" style="color:${FUCSIA}">€30</div></div>`;
    return h;
  };
  const bottigliaPrezzo = (n) => `<div style="position:relative;width:560px;height:560px;margin:0 auto">
      <svg width="300" height="540" viewBox="0 0 120 220" style="position:absolute;left:30px;top:10px" fill="none"><path d="M46 0h28v52q34 16 34 62v92a10 10 0 0 1-10 10H22a10 10 0 0 1-10-10v-92q0-46 34-62z" fill="#5e0f27"/><rect x="46" y="0" width="28" height="18" rx="5" fill="${INK}"/><path d="M30 120v76" stroke="#fff" stroke-opacity=".28" stroke-width="7" stroke-linecap="round"/></svg>
      <div class="tag tx" style="position:absolute;left:250px;top:150px"><div class="vec" style="font-size:80px">${n >= 1 ? '€30' : ''}</div><div class="pr" style="color:${n >= 1 ? FUCSIA : INK};font-size:130px">${n >= 1 ? '€15' : '€30'}</div>${n >= 1 ? `<div class="pc">−50%</div>` : ''}</div></div>`;
  const eno = n => {
    let h = `<div class="lab">ENOTECA</div><div class="tit">Vini che girano poco</div>${bottigliaPrezzo(n >= 1 ? 1 : 0)}`;
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

  // ---- chiusura (come nella v14): logo, email, «e ti aiutiamo a partire.», 18+
  const chius = n => pag(f, Q ? `.l{position:absolute;top:90px;left:0;right:0}.q{position:absolute;left:60px;right:60px;top:330px;text-align:center;font:700 52px/1.2 'Manrope',sans-serif;color:${SOFT}}
      .e{position:absolute;left:30px;right:30px;top:410px;text-align:center;font:800 76px/1.1 'Manrope',sans-serif}
      .s{position:absolute;left:60px;right:60px;top:600px;text-align:center;font:800 56px/1.2 'Manrope',sans-serif;visibility:${n >= 2 ? 'visible' : 'hidden'}}
      .m{position:absolute;left:30px;right:30px;bottom:50px;text-align:center;font:700 28px/1.4 'Manrope',sans-serif;color:#6a6580}`
    : `.l{position:absolute;top:240px;left:0;right:0}.q{position:absolute;left:80px;right:80px;top:700px;text-align:center;font:700 60px/1.2 'Manrope',sans-serif;color:${SOFT}}
      .e{position:absolute;left:40px;right:40px;top:800px;text-align:center;font:800 80px/1.1 'Manrope',sans-serif}
      .s{position:absolute;left:80px;right:80px;top:1010px;text-align:center;font:800 64px/1.2 'Manrope',sans-serif;visibility:${n >= 2 ? 'visible' : 'hidden'}}
      .m{position:absolute;left:40px;right:40px;bottom:130px;text-align:center;font:700 34px/1.4 'Manrope',sans-serif;color:#6a6580}`,
    `<div class="l">${logo()}</div><div class="q tx">Scrivici a</div><div class="e tx"><b>info@scontiroma.it</b></div><div class="s tx">e ti aiutiamo a partire.</div><div class="m tx">Per maggiorenni (18+) · Roma e dintorni · Sconti Roma</div>`);
  G[f + '_chiusura_1'] = chius(1); G[f + '_chiusura_2'] = chius(2);
  // ---- percentuale in evidenza (decisione esplicita del titolare per questo video) e didascalie della guida
  const pill = t => pag(f, `.p{position:absolute;left:0;right:0;top:${Q ? 965 : 1700}px;display:flex;justify-content:center}.p div{font:800 ${Q ? 84 : 130}px/1 'Manrope',sans-serif;color:#fff;background:${FUCSIA};padding:${Q ? '14px 34px' : '22px 54px'};border-radius:${Q ? 30 : 46}px;box-shadow:0 10px 30px rgba(40,30,70,.3)}`, `<div class="p tx"><div>${t}</div></div>`, 'transparent');
  G[f + '_pill40'] = pill('−40%');
  const gg = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
  G[f + '_giorni'] = pag(f, `.p{position:absolute;left:0;right:0;top:${Q ? 880 : 1590}px;display:flex;justify-content:center;gap:${Q ? 8 : 12}px}
    .p span{font:800 ${Q ? 28 : 44}px/1 'Manrope',sans-serif;padding:${Q ? '12px 14px' : '18px 20px'};border-radius:${Q ? 16 : 24}px;background:#fff;color:#8c86a0;border:3px solid #d9d4e6;box-shadow:0 6px 18px rgba(40,30,70,.18)}
    .p span.on{background:${FUCSIA};border-color:${FUCSIA};color:#fff}`,
    `<div class="p tx">${gg.map(d => `<span class="${d === 'Mar' || d === 'Gio' ? 'on' : ''}">${d}</span>`).join('')}</div>`, 'transparent');
  const gcap = (t, s) => pag(f, `.c{position:absolute;left:40px;right:40px;top:${Q ? 18 : 60}px;text-align:center;background:rgba(255,255,255,.94);border-radius:${Q ? 24 : 36}px;padding:${Q ? '14px 20px' : '26px 30px'};box-shadow:0 6px 22px rgba(40,30,70,.2);font:800 ${Q ? 38 : 56}px/1.15 'Manrope',sans-serif}.c small{display:block;font:600 ${Q ? 24 : 34}px/1.2 'Manrope',sans-serif;color:${SOFT};margin-top:6px}`, `<div class="c tx">${t}${s ? `<small>${s}</small>` : ''}</div>`, 'transparent');
  G[f + '_gcap_0'] = gcap('Guida in una pagina', 'Schermate di esempio, dati inventati');
  G[f + '_gcap_1'] = gcap('<b>1</b> · Registrati', 'Con la Partita IVA');
  G[f + '_gcap_2'] = gcap('<b>2</b> · Scegli cosa offri e lo sconto', '');
  G[f + '_gcap_3'] = gcap('<b>3</b> · Aggiungi una foto', '');
}

(async () => {
  const b = await chromium.launch();
  const salva = async (nome, html, f, trasp = false) => {
    const p = await b.newPage({ viewport: { width: F[f].W, height: F[f].H } });
    const tmp = OUT + nome + '.html'; fs.writeFileSync(tmp, html);
    await p.goto('file://' + tmp); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(120);
    await p.screenshot({ path: OUT + nome + '.png', omitBackground: trasp }); fs.unlinkSync(tmp); await p.close();
  };
  for (const [k, h] of Object.entries(G)) await salva(k, h, k.split('_')[0], /_(pill40|giorni|gcap_\d)$/.test(k));
  for (const f of ['v', 'q']) for (const parte of cop.parti) for (let i = 0; i < (parte.segmenti || []).length; i++) {
    const s = parte.segmenti[i]; if (s.t && !parte.grafica) await salva(`${f}_sub_${parte.id}_${i}`, sottotitolo(f, s.t), f, true);
  }
  await b.close();
  console.log('grafiche:', fs.readdirSync(OUT).length);
})().catch(e => { console.error(e); process.exit(1); });
