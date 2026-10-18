// Illustrazione di fantasia (nessuna foto di terzi) per l'offerta dell'enoteca: bottiglia senza etichetta e due calici su un tavolo di legno.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const calice = (x, y) => `<g transform="translate(${x} ${y})"><path d="M0 0h110c0 120-24 190-55 190S0 120 0 0z" fill="#fff" fill-opacity=".35" stroke="#fff" stroke-opacity=".6" stroke-width="5"/><path d="M6 70h98c-4 90-22 122-49 122S10 160 6 70z" fill="#7a1530"/><rect x="50" y="190" width="10" height="130" fill="#fff" fill-opacity=".5"/><ellipse cx="55" cy="322" rx="48" ry="9" fill="#fff" fill-opacity=".5"/></g>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1062" viewBox="0 0 800 1062">
<defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e4224"/><stop offset="1" stop-color="#4a2a14"/></linearGradient>
<linearGradient id="b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3d0a1a"/><stop offset=".45" stop-color="#6b1530"/><stop offset="1" stop-color="#32081a"/></linearGradient></defs>
<rect width="800" height="1062" fill="url(#t)"/>
${Array.from({ length: 14 }, (_, i) => `<path d="M0 ${40 + i * 78} C 250 ${20 + i * 78} 550 ${70 + i * 78} 800 ${40 + i * 78}" stroke="#3a200e" stroke-opacity=".35" stroke-width="3" fill="none"/>`).join('')}
<ellipse cx="330" cy="900" rx="170" ry="26" fill="#000" opacity=".3"/>
<path d="M270 130h120v230q95 40 95 150v390a22 22 0 0 1-22 22H197a22 22 0 0 1-22-22V510q0-110 95-150z" fill="url(#b)"/>
<rect x="268" y="96" width="124" height="70" rx="16" fill="#1a1a1f"/>
<path d="M215 520v330" stroke="#fff" stroke-opacity=".18" stroke-width="16" stroke-linecap="round"/>
${calice(560, 520)}${calice(600, 700)}
</svg>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 800, height: 1062 } });
  await p.setContent(`<body style="margin:0">${svg}</body>`);
  await p.screenshot({ path: process.argv[2], type: 'jpeg', quality: 92 }); await b.close();
})();
