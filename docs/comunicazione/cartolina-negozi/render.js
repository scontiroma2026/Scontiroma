// Genera la cartolina negozi A6: PNG di anteprima, PDF A6 e PDF A4 con 4 cartoline (2x2) da tagliare.
// Uso:  node docs/comunicazione/cartolina-negozi/render.js   (serve Playwright in e2e/node_modules e Chromium)
const path = require('path');
const fs = require('fs');
const radici = [path.resolve(__dirname, '../../../e2e/node_modules/playwright'), '/home/user/Scontiroma/e2e/node_modules/playwright'];
const { chromium } = require(radici.find(p => fs.existsSync(p)) || 'playwright');
const exe = ['/opt/pw-browsers/chromium', process.env.CHROMIUM_PATH].find(p => p && fs.existsSync(p));
(async () => {
  const b = await chromium.launch(exe ? { executablePath: exe } : {});
  const p = await b.newPage({ viewport: { width: 397, height: 559 }, deviceScaleFactor: 4 });
  const src = 'file://' + path.join(__dirname, 'cartolina.html');
  await p.goto(src);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(__dirname, 'cartolina-negozi-a6.png') });
  await p.pdf({ path: path.join(__dirname, 'cartolina-negozi-a6.pdf'), width: '105mm', height: '148mm', printBackground: true, pageRanges: '1' });
  const f = `<iframe src="${src}"></iframe>`;
  const doppio = `<!doctype html><meta charset="utf-8"><style>@page{size:210mm 297mm;margin:0}html,body{margin:0;width:210mm;height:297mm}
  .g{display:grid;grid-template-columns:105mm 105mm;grid-template-rows:148.5mm 148.5mm;width:210mm;height:297mm}.g iframe{border:0;width:105mm;height:148.5mm}</style>
  <div class="g">${f}${f}${f}${f}</div>`;
  fs.writeFileSync(path.join(__dirname, '.doppio.html'), doppio);
  const q = await b.newPage();
  await q.goto('file://' + path.join(__dirname, '.doppio.html'));
  await q.waitForTimeout(1000);
  await q.pdf({ path: path.join(__dirname, 'cartolina-negozi-a4-quattro-per-foglio.pdf'), width: '210mm', height: '297mm', printBackground: true });
  fs.unlinkSync(path.join(__dirname, '.doppio.html'));
  await b.close();
  console.log('ok');
})();
