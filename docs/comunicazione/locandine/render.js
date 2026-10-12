// Genera i PNG A4 (794x1123 px, scala 2 = 1588x2246) di tutti gli stili.
// Uso:  node docs/comunicazione/locandine/render.js [stile ...]
// Richiede Playwright (e2e/node_modules, dopo "npm ci" in e2e/) e Chromium.
const path = require('path');
const fs = require('fs');
const radici = [path.resolve(__dirname, '../../../e2e/node_modules/playwright'), '/home/user/Scontiroma/e2e/node_modules/playwright'];
const { chromium } = require(radici.find(p => fs.existsSync(p)) || 'playwright');
const STILI = ['app-chiara', 'halloween-app', 'halloween-arancio-blu', 'halloween-viola-giallo',
  'halloween-rosso-blu-bianco', 'fabbrica-di-dolci', 'mattoncini', 'natale', 'pasqua', 'estate'];
const exe = ['/opt/pw-browsers/chromium', process.env.CHROMIUM_PATH].find(p => p && fs.existsSync(p));
(async () => {
  const scelti = process.argv.slice(2).length ? process.argv.slice(2) : STILI;
  const b = await chromium.launch(exe ? { executablePath: exe } : {});
  const p = await b.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
  fs.mkdirSync(path.join(__dirname, 'png'), { recursive: true });
  for (const s of scelti) {
    await p.goto('file://' + path.join(__dirname, 'locandina.html') + '?s=' + s);
    await p.waitForFunction(() => document.title === 'pronto');
    await p.waitForTimeout(300);
    const out = path.join(__dirname, 'png', `locandina-${s}.png`);
    await p.screenshot({ path: out });
    console.log('ok', out);
  }
  await b.close();
})();
