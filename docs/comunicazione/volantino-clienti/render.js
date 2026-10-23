// Genera il volantino clienti A5: PNG (anteprima, scala 3), PDF A5 e PDF A4 con due volantini affiancati da tagliare.
// Uso:  node docs/comunicazione/volantino-clienti/render.js   (serve Playwright in e2e/node_modules e Chromium)
const path = require('path');
const fs = require('fs');
const radici = [path.resolve(__dirname, '../../../e2e/node_modules/playwright'), '/home/user/Scontiroma/e2e/node_modules/playwright'];
const { chromium } = require(radici.find(p => fs.existsSync(p)) || 'playwright');
const exe = ['/opt/pw-browsers/chromium', process.env.CHROMIUM_PATH].find(p => p && fs.existsSync(p));
(async () => {
  const b = await chromium.launch(exe ? { executablePath: exe } : {});
  const p = await b.newPage({ viewport: { width: 559, height: 794 }, deviceScaleFactor: 3 });
  await p.goto('file://' + path.join(__dirname, 'volantino.html'));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(__dirname, 'volantino-clienti-a5.png') });
  await p.pdf({ path: path.join(__dirname, 'volantino-clienti-a5.pdf'), width: '148mm', height: '210mm', printBackground: true, pageRanges: '1' });
  // A4 orizzontale con due A5 affiancati
  const html = fs.readFileSync(path.join(__dirname, 'volantino.html'), 'utf8');
  const doppio = `<!doctype html><meta charset="utf-8"><style>@page{size:297mm 210mm;margin:0}html,body{margin:0;width:297mm;height:210mm}
  .r{display:flex;width:297mm;height:210mm}.r iframe{border:0;width:148.5mm;height:210mm}</style>
  <div class="r"><iframe src="file://${path.join(__dirname, 'volantino.html')}"></iframe><iframe src="file://${path.join(__dirname, 'volantino.html')}"></iframe></div>`;
  const q = await b.newPage();
  fs.writeFileSync(path.join(__dirname, '.doppio.html'), doppio);
  await q.goto('file://' + path.join(__dirname, '.doppio.html'));
  await q.waitForTimeout(800);
  await q.pdf({ path: path.join(__dirname, 'volantino-clienti-a4-due-per-foglio.pdf'), width: '297mm', height: '210mm', printBackground: true });
  fs.unlinkSync(path.join(__dirname, '.doppio.html'));
  await b.close();
  console.log('ok');
})();
