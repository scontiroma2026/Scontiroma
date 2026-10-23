// Illustrazione di fantasia (nessuna foto di terzi) per l'offerta «Menù di carne» delle riprese: piatto con bistecca, pomodorini e bicchiere.
const { chromium } = require('/opt/node22/lib/node_modules/playwright'); const fs = require('fs');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1062" viewBox="0 0 800 1062">
<defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a4a2a"/><stop offset="1" stop-color="#5b3519"/></linearGradient>
<radialGradient id="p" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e9e5df"/></radialGradient>
<linearGradient id="v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8e1b3a"/><stop offset="1" stop-color="#5e0f27"/></linearGradient></defs>
<rect width="800" height="1062" fill="url(#t)"/>
${Array.from({ length: 14 }, (_, i) => `<path d="M0 ${40 + i * 78} C 250 ${20 + i * 78} 550 ${70 + i * 78} 800 ${40 + i * 78}" stroke="#4a2a12" stroke-opacity=".35" stroke-width="3" fill="none"/>`).join('')}
<ellipse cx="400" cy="600" rx="330" ry="320" fill="#000" opacity=".25" transform="translate(14 18)"/>
<circle cx="400" cy="600" r="330" fill="url(#p)"/><circle cx="400" cy="600" r="250" fill="none" stroke="#d8d2c8" stroke-width="6"/>
<path d="M240 560 C 250 470 380 440 480 470 C 580 500 590 600 540 660 C 480 730 330 740 270 680 C 235 645 232 600 240 560Z" fill="#6b2f1c"/>
<path d="M262 568 C 275 492 385 466 475 490 C 560 515 570 595 528 648 C 478 708 342 716 288 664 C 258 636 256 598 262 568Z" fill="#8a3f26"/>
${[0, 1, 2, 3, 4].map(i => `<path d="M${300 + i * 45} ${500 + i * 8} L ${330 + i * 45} ${690 - i * 6}" stroke="#4d1f12" stroke-width="12" stroke-linecap="round" opacity=".75"/>`).join('')}
<g stroke="#2f6b2f" stroke-width="7" stroke-linecap="round"><path d="M430 460 L 560 400"/><path d="M450 450 l10 -26M470 442 l12 -24M490 434 l10 -26M510 424 l12 -22M530 414 l10 -22"/></g>
${[[300, 760], [350, 790], [330, 740]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="34" fill="#c8321e"/><circle cx="${x - 10}" cy="${y - 10}" r="9" fill="#e8705a" opacity=".7"/>`).join('')}
<circle cx="540" cy="770" r="24" fill="#c8321e"/>
<g transform="translate(610 130)"><path d="M0 0h130c0 150-30 240-65 240S0 150 0 0z" fill="#fff" fill-opacity=".35" stroke="#fff" stroke-opacity=".6" stroke-width="5"/>
<path d="M6 80h118c-4 110-28 160-59 160S10 190 6 80z" fill="url(#v)"/><rect x="60" y="240" width="10" height="170" fill="#fff" fill-opacity=".5"/><ellipse cx="65" cy="414" rx="55" ry="10" fill="#fff" fill-opacity=".5"/></g>
</svg>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 800, height: 1062 } });
  await p.setContent(`<body style="margin:0">${svg}</body>`);
  await p.screenshot({ path: process.argv[2], type: 'jpeg', quality: 92 }); await b.close();
})();
