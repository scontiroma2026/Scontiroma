const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const dir = process.argv[2], soloAnteprima = process.argv[3] === 'anteprima';
  fs.mkdirSync(dir + '/fotogrammi', { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await p.goto('file://' + dir + '/reel.html');
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  const tempi = soloAnteprima ? [1.6, 4.4, 7.2, 9.6] : [...Array(300).keys()].map((i) => i / 30);
  for (let i = 0; i < tempi.length; i++) {
    await p.evaluate((t) => window.render(t), tempi[i]);
    const nome = soloAnteprima ? `${dir}/anteprima_${i + 1}.png` : `${dir}/fotogrammi/f${String(i).padStart(4, '0')}.png`;
    await p.screenshot({ path: nome });
  }
  await b.close();
})();
