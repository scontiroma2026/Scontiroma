// Grafiche del video V4 «solo mani»: tutto in grafica vettoriale (HTML/SVG disegnato qui), nessuna foto di persone, nessuna IA.
//  - img/cap_*.png      scritte a schermo (sfondo trasparente) nelle zone sicure di Instagram/Facebook
//  - img/telefono.png   cornice dell'iPhone stilizzato (con o senza etichetta «ESEMPIO»)
//  - frames/<scena>/    fotogrammi delle scene illustrate (vetrina, colazione, QR in cassa, «Stiamo arrivando», chiusura)
// Stile come i video v14/clienti: fondo chiaro, un solo accento fucsia, Manrope, nessun effetto. Uso: node grafica.js [scena]
const fs = require('fs'); const path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const cop = require('./copione.json');
const IMG = path.join(__dirname, 'img') + '/'; fs.mkdirSync(IMG, { recursive: true });
const FRAMES = path.join(__dirname, 'frames') + '/'; fs.mkdirSync(FRAMES, { recursive: true });
const FONTDIR = path.join(__dirname, 'fonts'); fs.mkdirSync(FONTDIR, { recursive: true });
const PUB = path.resolve(__dirname, '..', '..', '..', '..', 'frontend', 'public', 'fonts');   // Manrope: licenza OFL, già nel repository
fs.writeFileSync(FONTDIR + '/fonts.css', fs.readFileSync(PUB + '/fonts.css', 'utf8').replace(/url\(\/fonts\//g, `url(file://${PUB}/`));
const INK = '#1A1530', FUCSIA = '#D81B72', VIOLA = '#6D4AFF', FONDO = '#F2F0EB', SABBIA = '#E4DFD6';
// Zone sicure (Reels/Storie 1080x1920): non mettere scritte nei primi 270 px né negli ultimi 380 px, e a 60 px dai lati.
const ZONA = { su: 270, giu: 1540, lato: 60 };
const BASE = `<meta charset="utf-8"><link rel="stylesheet" href="file://${FONTDIR}/fonts.css"><style>
*{box-sizing:border-box;margin:0;padding:0} html,body{width:1080px;height:1920px;overflow:hidden}
body{font-family:'Manrope',sans-serif;color:${INK};-webkit-font-smoothing:antialiased}
b{color:${FUCSIA};font-weight:inherit}
.cap{position:absolute;left:90px;right:90px;top:${ZONA.su + 14}px;height:270px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.cap .m{font:800 84px/1.1 'Manrope',sans-serif;letter-spacing:-.025em}
.cap .s{margin-top:14px;font:700 46px/1.2 'Manrope',sans-serif;color:#4a4560}
.n{display:inline-block;width:78px;height:78px;border-radius:50%;background:${FUCSIA};color:#fff;font:800 48px/78px 'Manrope',sans-serif;text-align:center;font-style:normal;margin-right:16px;vertical-align:5px;letter-spacing:0}
.logo{display:flex;align-items:center;gap:26px;justify-content:center}
.logo i{width:128px;height:128px;border-radius:38px;background:linear-gradient(135deg,${FUCSIA},${VIOLA});color:#fff;font:800 78px/128px 'Manrope',sans-serif;text-align:center;font-style:normal}
.logo span{font:800 88px 'Manrope',sans-serif;letter-spacing:-.025em}
</style>`;
const pagina = (css, corpo, fondo = 'transparent') => `<!doctype html><html><head>${BASE}<style>body{background:${fondo}}${css}</style></head><body>${corpo}</body></html>`;
const cap = (m, s = '') => pagina('', `<div class="cap"><div class="m">${m}</div>${s ? `<div class="s">${s}</div>` : ''}</div>`);
const G = {};   // pagine statiche con sfondo trasparente
G.cap_s1 = cap('Il negozio sotto casa…');
G.cap_s2 = cap('…ha la sua app: <b>Sconti Roma</b>', 'Le offerte dei negozi, a Roma e dintorni');
G.cap_s3 = cap('<i class="n">1</i>Scegli cosa <b>cerchi</b>');
G.cap_s4 = cap('<i class="n">2</i>L’offerta del mese: <b>una per negozio</b>');
G.cap_s5 = cap('Vai nel <b>tuo negozio</b>');
G.cap_s6 = cap('<i class="n">3</i>Mostra il <b>QR in cassa</b>');
G.cap_s7 = cap('Stiamo arrivando a <b>Roma e dintorni</b>');
// chiusura: tre righe che compaiono una dopo l'altra (tutte tra 270 e 1540 px)
G.cap_s8a = pagina(`.p{position:absolute;left:0;right:0;top:900px;display:flex;justify-content:center}
  .p div{background:${FUCSIA};color:#fff;font:800 68px/1.1 'Manrope',sans-serif;padding:34px 56px;border-radius:100px;letter-spacing:-.02em;text-align:center}`,
  `<div class="p"><div>Lista d’attesa: link in bio</div></div>`);
G.cap_s8b = pagina(`.t{position:absolute;left:80px;right:80px;top:1150px;text-align:center;font:800 64px/1.2 'Manrope',sans-serif;letter-spacing:-.02em}`,
  `<div class="t">Gratuita nella fase di lancio</div>`);
G.cap_s8c = pagina(`.t{position:absolute;left:80px;right:80px;top:1290px;text-align:center;font:700 54px/1.2 'Manrope',sans-serif;color:#4a4560}`,
  `<div class="t">Roma e dintorni · 18+</div>`);
// cornice dell'iPhone stilizzato: schermo 530x1128 a (275,630), bordo scuro, isola in alto; con l'etichetta «ESEMPIO» opzionale
const SCH = { x: 275, y: 630, w: 530, h: 1128, r: 64 };
const telefono = esempio => pagina(`.s{position:absolute;left:${SCH.x}px;top:${SCH.y}px;width:${SCH.w}px;height:${SCH.h}px;border-radius:${SCH.r}px;box-shadow:0 0 0 30px ${INK};}
  .i{position:absolute;left:${SCH.x + SCH.w / 2 - 55}px;top:${SCH.y - 23}px;width:110px;height:14px;border-radius:8px;background:#3a3354}
  .e{position:absolute;left:${SCH.x + SCH.w - 250}px;top:${SCH.y - 70}px;transform:rotate(5deg);background:${FUCSIA};color:#fff;font:800 38px/1 'Manrope',sans-serif;letter-spacing:.08em;padding:18px 34px;border-radius:100px;border:6px solid ${FONDO}}`,
  `<div class="s"></div><div class="i"></div>${esempio ? '<div class="e">ESEMPIO</div>' : ''}`);
G.telefono = telefono(false); G.telefono_esempio = telefono(true);
// sfondo delle scene con l'app: fondo chiaro e ombra morbida del telefono
G.sfondo_app = pagina(`.o{position:absolute;left:${SCH.x - 30}px;top:${SCH.y - 30 + 18}px;width:${SCH.w + 60}px;height:${SCH.h + 60}px;border-radius:${SCH.r + 30}px;background:rgba(40,30,70,.30);filter:blur(30px)}`, '<div class="o"></div>', FONDO);

// ---------- scene illustrate: un'unica pagina con le 5 illustrazioni, animate da setScene(nome, t) ----------
const MANO = `<path d="M30 14c-5 0-9 4-9 9v44l-6-6c-4-4-10-3-13 1-2 3-2 6 0 9l20 33c4 7 11 12 20 12h12c13 0 22-9 22-22V68c0-4-3-7-7-7-2 0-3 0-4 1-1-3-4-5-7-5-2 0-4 1-5 2-1-3-4-5-7-5h-1V23c0-5-4-9-9-9z" fill="#fff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M52 61v14M64 62v13" stroke="${INK}" stroke-width="3.5" stroke-linecap="round" opacity=".55"/><circle cx="30" cy="30" r="3.2" fill="${FUCSIA}"/>`;
const dito = id => `<g id="${id}" opacity="0"><circle id="${id}_o" cx="0" cy="0" r="30" fill="rgba(216,27,114,.18)" stroke="${FUCSIA}" stroke-width="6" opacity="0"/><g id="${id}_m"><g filter="url(#ombra)">${MANO}</g></g></g>`;
// QR stilizzato (non è un QR vero: serve solo come disegno) – 25x25 moduli con i tre riquadri d'angolo
function qrDisegno(px) {
  const N = 25, m = px / N; let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280; let s = '';
  const finder = (x, y) => `<rect x="${x * m}" y="${y * m}" width="${7 * m}" height="${7 * m}" fill="${INK}"/><rect x="${(x + 1) * m}" y="${(y + 1) * m}" width="${5 * m}" height="${5 * m}" fill="#fff"/><rect x="${(x + 2) * m}" y="${(y + 2) * m}" width="${3 * m}" height="${3 * m}" fill="${INK}"/>`;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const inF = (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9); if (inF) continue;
    if (rnd() < .48) s += `<rect x="${x * m}" y="${y * m}" width="${m + .5}" height="${m + .5}" fill="${INK}"/>`;
  }
  return s + finder(0, 0) + finder(N - 7, 0) + finder(0, N - 7);
}
const telSvg = (id, w, h, interno) => `<g id="${id}"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="52" fill="${INK}"/><rect x="${-w / 2 + 16}" y="${-h / 2 + 16}" width="${w - 32}" height="${h - 32}" rx="38" fill="#fff"/>${interno}<rect x="-46" y="${-h / 2 + 26}" width="92" height="24" rx="12" fill="${INK}"/></g>`;
const SCENE_HTML = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="file://${FONTDIR}/fonts.css"><style>*{margin:0;padding:0}html,body{width:1080px;height:1920px;overflow:hidden;background:${FONDO}}svg{display:block}</style></head><body>
<svg id="svg" width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg" font-family="Manrope">
<defs><filter id="ombra" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="${INK}" flood-opacity=".32"/></filter>
<linearGradient id="caldo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF1CF"/><stop offset="1" stop-color="#F6D9A0"/></linearGradient>
<linearGradient id="logoG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${FUCSIA}"/><stop offset="1" stop-color="${VIOLA}"/></linearGradient></defs>
<rect width="1080" height="1920" fill="${FONDO}"/>

<!-- 1) VETRINA: il dito spinge la porta del negozio -->
<g id="vetrina">
  <ellipse cx="540" cy="1520" rx="470" ry="30" fill="rgba(26,21,48,.14)"/>
  <rect x="170" y="806" width="740" height="694" fill="#FBFAF7" stroke="${INK}" stroke-width="6"/>
  <rect x="640" y="880" width="210" height="620" fill="url(#caldo)"/>
  <rect x="640" y="1380" width="210" height="120" fill="#EAC98A"/>
  <g id="v_porta"><rect x="640" y="880" width="210" height="620" fill="#fff" stroke="${INK}" stroke-width="6"/><rect x="670" y="920" width="150" height="280" rx="14" fill="#E9E5F3" stroke="${INK}" stroke-width="5"/><circle cx="668" cy="1290" r="14" fill="${INK}"/><rect x="660" y="1270" width="10" height="40" rx="5" fill="${INK}"/></g>
  <rect x="640" y="880" width="210" height="620" fill="none" stroke="${INK}" stroke-width="8"/>
  <rect x="230" y="880" width="350" height="500" rx="20" fill="#fff" stroke="${INK}" stroke-width="6"/>
  <line x1="230" y1="1070" x2="580" y2="1070" stroke="${INK}" stroke-width="6"/><line x1="230" y1="1240" x2="580" y2="1240" stroke="${INK}" stroke-width="6"/>
  <rect x="260" y="990" width="70" height="80" rx="8" fill="${FUCSIA}" stroke="${INK}" stroke-width="5"/><rect x="345" y="1010" width="60" height="60" rx="8" fill="${SABBIA}" stroke="${INK}" stroke-width="5"/><rect x="420" y="975" width="80" height="95" rx="8" fill="#fff" stroke="${INK}" stroke-width="5"/><rect x="440" y="1010" width="40" height="22" fill="${FUCSIA}"/>
  <path d="M290 1240 L310 1160 H380 L400 1240 Z" fill="${SABBIA}" stroke="${INK}" stroke-width="5"/><circle cx="345" cy="1130" r="44" fill="#fff" stroke="${INK}" stroke-width="5"/><circle cx="520" cy="1195" r="40" fill="${FUCSIA}" stroke="${INK}" stroke-width="5"/>
  <rect x="270" y="1290" width="270" height="60" rx="12" fill="${INK}"/><text x="405" y="1334" font-size="34" font-weight="800" fill="#fff" text-anchor="middle" letter-spacing="3">APERTO</text>
  <g id="v_tenda">${Array.from({ length: 8 }, (_, i) => `<path d="M${170 + i * 92.5} 700 h92.5 v100 a46.25 46.25 0 0 1 -92.5 0 Z" fill="${i % 2 ? '#fff' : FUCSIA}" stroke="${INK}" stroke-width="5"/>`).join('')}<rect x="150" y="668" width="780" height="40" rx="10" fill="${INK}"/></g>
  <g id="v_stelle" opacity="0"><path d="M900 640 l12 30 30 12 -30 12 -12 30 -12 -30 -30 -12 30 -12z" fill="${FUCSIA}"/><path d="M170 620 l9 22 22 9 -22 9 -9 22 -9 -22 -22 -9 22 -9z" fill="${INK}"/><path d="M780 560 l8 18 18 8 -18 8 -8 18 -8 -18 -18 -8 18 -8z" fill="${INK}"/></g>
  ${dito('v_dito')}
</g>

<!-- 2) COLAZIONE: tazzina e cornetto stilizzati -->
<g id="colazione"><g transform="translate(540 1250) scale(1.04) translate(-540 -1330)">
  <rect x="0" y="1330" width="1080" height="400" fill="${SABBIA}"/><line x1="0" y1="1330" x2="1080" y2="1330" stroke="${INK}" stroke-width="6"/>
  <g id="c_tazza">
    <ellipse cx="370" cy="1330" rx="250" ry="46" fill="#fff" stroke="${INK}" stroke-width="7"/><ellipse cx="370" cy="1322" rx="170" ry="26" fill="${SABBIA}"/>
    <path d="M500 1170 C590 1160 600 1275 495 1285" fill="none" stroke="${INK}" stroke-width="32" stroke-linecap="round"/><path d="M500 1170 C590 1160 600 1275 495 1285" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round"/>
    <path d="M240 1130 H500 V1200 C500 1275 450 1318 370 1318 C290 1318 240 1275 240 1200 Z" fill="#fff" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
    <ellipse cx="370" cy="1130" rx="130" ry="26" fill="#7A5545" stroke="${INK}" stroke-width="7"/><path d="M300 1128 q70 -16 140 0" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".5"/>
    <rect x="285" y="1190" width="170" height="14" rx="7" fill="${FUCSIA}"/>
  </g>
  <g id="c_vapore" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round" opacity=".28">
    <path id="c_v1" d="M320 1070 c-30 -40 30 -70 0 -110 c-30 -40 30 -70 0 -110" stroke-dasharray="260" /><path id="c_v2" d="M375 1070 c-30 -40 30 -70 0 -110 c-30 -40 30 -70 0 -110" stroke-dasharray="260"/><path id="c_v3" d="M430 1070 c-30 -40 30 -70 0 -110 c-30 -40 30 -70 0 -110" stroke-dasharray="260"/></g>
  <g id="c_cornetto">
    <ellipse cx="780" cy="1335" rx="240" ry="44" fill="#fff" stroke="${INK}" stroke-width="7"/>
    <path d="M590 1300 C590 1170 700 1100 780 1100 C860 1100 970 1170 970 1300 C925 1262 880 1250 780 1250 C680 1250 635 1262 590 1300 Z" fill="#E8C48F" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M660 1160 C690 1190 695 1225 690 1255 M730 1125 C750 1170 752 1215 748 1250 M830 1125 C812 1170 810 1215 814 1250 M900 1160 C870 1190 866 1225 870 1255" fill="none" stroke="#B98A4E" stroke-width="7" stroke-linecap="round"/>
  </g>
  <g id="c_cuori" opacity="0"><path d="M820 1010 c-20 -26 -58 0 -30 28 l30 28 30 -28 c28 -28 -10 -54 -30 -28z" fill="${FUCSIA}"/></g>
</g></g>

<!-- 3) QR IN CASSA: un telefono mostra il QR a un altro telefono -->
<g id="cassa"><g transform="translate(540 1090) scale(1.2) translate(-540 -1000)">
  ${telSvg('q_a', 340, 700, `<rect x="-154" y="-334" width="308" height="86" rx="30" fill="${FUCSIA}" opacity="0"/><g transform="translate(-125 -150)">${qrDisegno(250)}</g><rect x="-110" y="150" width="220" height="26" rx="13" fill="${SABBIA}"/><rect x="-70" y="196" width="140" height="22" rx="11" fill="${SABBIA}"/>`)}
  ${telSvg('q_b', 340, 700, `<rect x="-154" y="-300" width="308" height="600" rx="30" fill="${INK}" opacity=".94"/>
     <g id="q_mirino" stroke="#fff" stroke-width="12" stroke-linecap="round" fill="none"><path d="M-110 -150 v-50 h50"/><path d="M110 -150 v-50 h-50"/><path d="M-110 150 v50 h50"/><path d="M110 150 v50 h-50"/></g>
     <rect id="q_linea" x="-120" y="-150" width="240" height="10" rx="5" fill="${FUCSIA}"/>
     <g id="q_mini" opacity="0" transform="translate(-95 -95)">${qrDisegno(190)}</g>
     <g id="q_ok" opacity="0"><circle id="q_okr" r="0" fill="none" stroke="${FUCSIA}" stroke-width="8"/><circle id="q_okc" r="86" fill="${FUCSIA}"/><path d="M-40 4 L-10 36 L44 -30" fill="none" stroke="#fff" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/></g>`)}
</g></g>

<!-- 4) STIAMO ARRIVANDO: il segnaposto cade e si allargano i cerchi -->
<g id="arrivando">
  <g id="a_strade" stroke="${SABBIA}" stroke-width="22" stroke-linecap="round" fill="none"><path d="M60 800 C300 900 500 760 1020 880"/><path d="M120 1500 C380 1380 700 1560 980 1400"/><path d="M300 640 C330 900 250 1200 360 1520"/><path d="M780 640 C760 900 860 1200 800 1520"/></g>
  <g id="a_anelli" fill="none" stroke="${FUCSIA}" stroke-width="8"><ellipse id="a_r1" cx="540" cy="1250" rx="0" ry="0"/><ellipse id="a_r2" cx="540" cy="1250" rx="0" ry="0"/><ellipse id="a_r3" cx="540" cy="1250" rx="0" ry="0"/></g>
  <ellipse id="a_ombra" cx="540" cy="1250" rx="70" ry="20" fill="rgba(26,21,48,.25)" opacity="0"/>
  <g id="a_pin"><path d="M0 -150 C-80 -150 -118 -92 -118 -38 C-118 50 0 160 0 160 C0 160 118 50 118 -38 C118 -92 80 -150 0 -150 Z" fill="${FUCSIA}" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/><circle cx="0" cy="-36" r="44" fill="#fff" stroke="${INK}" stroke-width="8"/></g>
  ${[[250, 1420], [830, 1390], [540, 1490]].map(([x, y], i) => `<g id="a_n${i}" opacity="0"><g transform="translate(${x} ${y})"><rect x="-70" y="-30" width="140" height="90" rx="6" fill="#fff" stroke="${INK}" stroke-width="6"/><path d="M-84 -30 L-62 -78 H62 L84 -30 Z" fill="${FUCSIA}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/><rect x="-18" y="6" width="36" height="54" fill="${SABBIA}" stroke="${INK}" stroke-width="5"/></g></g>`).join('')}
</g>

<!-- 5) CHIUSURA: logo -->
<g id="chiusura"><g id="k_logo" transform="translate(540 640) scale(1.15)"><rect x="-330" y="-64" width="128" height="128" rx="38" fill="url(#logoG)"/><text x="-266" y="22" font-size="78" font-weight="800" fill="#fff" text-anchor="middle">S</text><text x="-176" y="30" font-size="88" font-weight="800" fill="${INK}" letter-spacing="-2">Sconti Roma</text></g>
  <g id="k_cerchi" fill="none" stroke="${FUCSIA}" stroke-width="6" opacity=".0"><circle cx="540" cy="560" r="200"/></g></g>
</svg>
<script>
const $=id=>document.getElementById(id);const cl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));const pr=(t,a,b)=>cl((t-a)/(b-a));
const eio=p=>p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;const eout=p=>1-Math.pow(1-p,3);const eb=p=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(p-1,3)+c1*Math.pow(p-1,2)};
const ebounce=p=>{const n=7.5625,d=2.75;if(p<1/d)return n*p*p;if(p<2/d){p-=1.5/d;return n*p*p+.75}if(p<2.5/d){p-=2.25/d;return n*p*p+.9375}p-=2.625/d;return n*p*p+.984375};
const lerp=(a,b,p)=>a+(b-a)*p;
const TR=(id,s)=>$(id).setAttribute('transform',s);const OP=(id,v)=>$(id).setAttribute('opacity',v);
// il dito: punta in (x,y), scala k; premi 0..1
function dito(id,x,y,k,premi,vis,onda){const m=$(id+'_m');TR(id,'translate('+x+' '+y+')');m.setAttribute('transform','scale('+k*(1-.12*premi)+') translate(-30 -14)');OP(id,vis);const o=$(id+'_o');o.setAttribute('r',22+onda*70);o.setAttribute('opacity',onda>0&&onda<1?.9*(1-onda):0);}
const SC={
 vetrina(t){
  TR('v_tenda','translate(0 '+(-26*(1-eb(pr(t,0,.6)))*1)+')');
  const entra=eio(pr(t,0,.9)); const px=lerp(520,676,entra), py=lerp(1760,1300,entra);
  const premi=pr(t,.9,1.15)*(1-pr(t,2.45,2.6)); const apre=eio(pr(t,1.1,2.1));
  TR('v_porta','translate(850 0) scale('+lerp(1,.22,apre)+' 1) translate(-850 0)');
  const spinge=eio(pr(t,1.1,2.1))*34; const esce=eio(pr(t,2.45,3.1));
  dito('v_dito',px+spinge+esce*40,py+esce*420,1.7,premi,1,pr(t,.95,1.6));
  OP('v_stelle',eout(pr(t,1.9,2.4))); TR('v_stelle','translate(540 700) scale('+(.6+.4*eb(pr(t,1.9,2.5)))+') translate(-540 -700)');
 },
 colazione(t){
  const d=(a)=>-330*(1-ebounce(pr(t,a,a+.8)));
  TR('c_tazza','translate(0 '+d(0)+')');TR('c_cornetto','translate(0 '+d(.25)+')');OP('c_tazza',pr(t,0,.12));OP('c_cornetto',pr(t,.25,.37));
  for(let i=1;i<=3;i++){const e=$('c_v'+i);const f=((t*.55+i*.31)%1);e.setAttribute('stroke-dashoffset',(260*(1-pr(f,0,.5))).toFixed(1));e.setAttribute('opacity',(pr(t,.9,1.3)*Math.sin(Math.PI*f)).toFixed(2));e.setAttribute('transform','translate(0 '+(-30*f)+')');}
  OP('c_cuori',eout(pr(t,1.6,1.9))*(1-pr(t,2.8,3.3)));TR('c_cuori','translate(0 '+(-60*pr(t,1.6,3.3))+')');
 },
 cassa(t){
  const ap=eio(pr(t,.2,1.5)); TR('q_a','translate('+lerp(250,420,ap)+' '+lerp(1350,1170,ap)+') rotate('+lerp(-9,-4,ap)+')');
  TR('q_b','translate('+(720)+' '+(1000+Math.sin(t*2)*6)+') rotate(5)');
  $('q_linea').setAttribute('y',-150+300*(.5-.5*Math.cos(t*Math.PI*1.6)));OP('q_linea',1-pr(t,1.5,1.8));
  OP('q_mini',eout(pr(t,1.2,1.7))*(1-pr(t,1.95,2.2)));
  const ok=pr(t,1.9,2.5);OP('q_ok',ok>0?1:0);TR('q_okc','scale('+eb(ok)+')');$('q_okr').setAttribute('r',90+ pr(t,2.1,3)*120);$('q_okr').setAttribute('opacity',(1-pr(t,2.1,3)).toFixed(2));
  OP('q_mirino',1-pr(t,2.0,2.3));
 },
 arrivando(t){
  const c=ebounce(pr(t,.2,1.0)); const y=lerp(640,1090,c); TR('a_pin','translate(540 '+y+')');OP('a_pin',pr(t,.15,.4));
  OP('a_ombra',pr(t,.2,1.0)*.9);$('a_ombra').setAttribute('rx',lerp(20,80,c));
  for(let i=1;i<=3;i++){const f=((t-.9-i*.45)/1.4);const e=$('a_r'+i);if(f<0||f>1.2){e.setAttribute('opacity',0);continue}const p=cl(f);e.setAttribute('rx',60+p*330);e.setAttribute('ry',(60+p*330)*.32);e.setAttribute('opacity',(1-p).toFixed(2));}
  for(let i=0;i<3;i++){const p=pr(t,1.1+i*.3,1.7+i*.3);OP('a_n'+i,p>0?1:0);const s=eb(p);const x=[250,830,540][i],yy=[1420,1390,1490][i];TR('a_n'+i,'translate('+x+' '+yy+') scale('+s+') translate('+(-x)+' '+(-yy)+')');}
 },
 chiusura(t){
  const p=eb(pr(t,.0,.7));TR('k_logo','translate(540 640) scale('+(1.15*(.7+.3*p))+')');OP('k_logo',pr(t,0,.3));
 }
};
window.setScene=(n,t)=>{for(const g of ['vetrina','colazione','cassa','arrivando','chiusura'])$(g).style.display=g===n?'inline':'none';SC[n](t);};
</script></body></html>`;

(async () => {
  const solo = process.argv[2];
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  // 1) pagine statiche trasparenti
  for (const [k, h] of Object.entries(G)) {
    fs.writeFileSync(IMG + k + '.html', h);
    await p.goto('file://' + IMG + k + '.html'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(120);
    await p.screenshot({ path: IMG + k + '.png', omitBackground: k !== 'sfondo_app' }); fs.unlinkSync(IMG + k + '.html');
  }
  // 2) scene illustrate, fotogramma per fotogramma a 30 fps
  fs.writeFileSync(IMG + 'scene.html', SCENE_HTML);
  await p.goto('file://' + IMG + 'scene.html'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200);
  for (const s of cop.scene.filter(x => x.tipo === 'grafica')) {
    if (solo && solo !== s.id) continue;
    const dir = FRAMES + s.id + '/'; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const n = Math.round(s.durata * 30);
    for (let i = 0; i < n; i++) {
      await p.evaluate(([g, t]) => window.setScene(g, t), [s.grafica, i / 30]);
      await p.screenshot({ path: dir + 'f' + String(i).padStart(4, '0') + '.jpg', type: 'jpeg', quality: 95 });
    }
    console.log(s.id, n, 'fotogrammi');
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
