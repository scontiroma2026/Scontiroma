// Riprese del video V4 «solo mani» dall'app di main (server locale con dati inventati: avvia_server.py + seed.py).
// Il dito animato è disegnato in pagina (ctx.js). Uso: node rec_clip.js <home|scegli|offerta|qr|tutte>
// Uscita: ../app/clip_<nome>.mp4 (780x1660, 30 fps), poi montate da ../montaggio/monta.py.
const fs = require('fs');
const { chromium, appContext, loginCliente, APP, APPDIR } = require('./ctx');
const { startRec, stopRec, wait, RATE } = require('./recorder');
const ids = require('./demo_ids.json');
const colazione = ids.tutti['bar.esempio@example.com'];
const TMP = process.env.V4_TMP || '/tmp/v4_rec/'; fs.mkdirSync(TMP, { recursive: true }); fs.mkdirSync(APPDIR, { recursive: true });
const OUT = n => APPDIR + 'clip_' + n + '.mp4';
const problemi = [];
// controllo a vista: nello schermo non deve comparire nessun prezzo, percentuale, zona o «quartiere»
const audit = async (p, dove) => { const t = await p.evaluate(() => window.__controlla()); if (t.length) problemi.push(dove + ': ' + t.join(' | ')); };

const glideY = async (p, y1, dur, mentre) => {
  const y0 = await p.evaluate(() => window.scrollY); const ms = dur * 1000 / RATE, t0 = Date.now(); let i = 0;
  for (;;) {
    const q = Math.min(1, (Date.now() - t0) / ms), k = q < .5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;
    await p.evaluate(y => window.scrollTo(0, y), y0 + (y1 - y0) * k);
    if (++i % 25 === 0) await audit(p, 'scorrimento');
    if (q >= 1) break; await p.waitForTimeout(30);
  }
};
const pronta = async p => { await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1500); };
// --- gesti del dito (in coordinate dello schermo dell'app, 390x830)
const dito = {
  parti: async (p, x, y) => { await p.evaluate(([x, y]) => { const d = document.getElementById('dito'); d.style.transitionDuration = '0s'; d.style.transform = `translate(${x}px,${y}px)`; }, [x, y]); await p.waitForTimeout(80); },
  vai: async (p, x, y, s) => { await p.evaluate(([x, y, s]) => window.__dito.vai(x, y, s), [x, y, s]); await wait(p, s); },
  premi: async p => { await p.evaluate(() => window.__dito.premi()); await wait(p, 0.25); },
  rilascia: async p => { await p.evaluate(() => window.__dito.rilascia()); await wait(p, 0.2); },
};
const centro = async loc => { const b = await loc.boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
// il dito va sull'elemento, preme, poi si esegue l'azione
const tocca = async (p, loc, azione, dx = 0, dy = 0, durata = 0.8) => {
  const [x, y] = await centro(loc); await dito.vai(p, x + dx, y + dy, durata); await dito.premi(p);
  await azione(); await dito.rilascia(p);
};
// trascinamento: il dito preme e sale di dy mentre il contenuto scorre di dy
const trascina = async (p, x, y, dy, dur) => {
  await dito.vai(p, x, y, 0.8); await p.evaluate(() => window.__dito.premi()); await wait(p, 0.2);
  const y0 = await p.evaluate(() => window.scrollY);
  await p.evaluate(([x, y, s]) => window.__dito.vai(x, y, s), [x, y - dy, dur]);
  await glideY(p, y0 + dy, dur); await dito.rilascia(p);
};

const clip = {
  // scena 2: la schermata iniziale; il dito scorre un poco
  async home(b) {
    const c = await appContext(b); const p = await c.newPage();
    await p.goto(APP + '/', { waitUntil: 'networkidle' }); await p.getByTestId('hero-sottotitolo').waitFor({ timeout: 30000 }); await pronta(p);
    await dito.parti(p, 250, 900);
    const r = await startRec(p, TMP + 'rec_home');
    await wait(p, 0.7); await audit(p, 'home');
    await trascina(p, 250, 700, 190, 1.4); await wait(p, 0.7); await audit(p, 'home dopo');
    await dito.vai(p, 250, 900, 0.7); await wait(p, 0.3);
    console.log('home', await stopRec(r, OUT('home')));
  },
  // scena 3: il dito tocca la scelta «categorie» e sceglie «Bar & Caffè»
  async scegli(b) {
    const c = await appContext(b); const p = await c.newPage(); await loginCliente(p);
    await p.goto(APP + '/discounts', { waitUntil: 'networkidle' });
    await p.getByTestId(`discount-card-${colazione.discount}`).first().waitFor({ timeout: 30000 }); await pronta(p);
    await dito.parti(p, 300, 900);
    const r = await startRec(p, TMP + 'rec_scegli');
    await wait(p, 0.5); await audit(p, 'sconti');
    const sel = p.getByTestId('filter-category');
    await tocca(p, sel, async () => { await wait(p, 0.2); await sel.selectOption('Bar & Caffè'); }, 40, 0, 0.9);
    await wait(p, 0.6); await audit(p, 'sconti filtrati');
    await trascina(p, 280, 650, 150, 1.0); await wait(p, 0.6); await audit(p, 'sconti scorsi');
    console.log('scegli', await stopRec(r, OUT('scegli')));
  },
  // scena 4: il dito tocca la scheda dell'offerta; si apre la pagina e il dito scorre fino al pulsante del QR
  async offerta(b) {
    const c = await appContext(b); const p = await c.newPage(); await loginCliente(p);
    await p.goto(APP + '/discounts', { waitUntil: 'networkidle' });
    const card = p.getByTestId(`discount-card-${colazione.discount}`).first(); await card.waitFor({ timeout: 30000 });
    await p.getByTestId('filter-category').selectOption('Bar & Caffè'); await pronta(p);
    await p.evaluate(() => window.scrollTo(0, 330)); await p.waitForTimeout(500);
    await dito.parti(p, 300, 900);
    const r = await startRec(p, TMP + 'rec_offerta');
    await wait(p, 0.6); await audit(p, 'scheda');
    await tocca(p, card, async () => { await card.click(); }, 20, 20, 0.9);
    await p.getByText('Colazione + cornetto').first().waitFor({ timeout: 30000 }); await wait(p, 0.9); await audit(p, 'pagina offerta');
    await dito.vai(p, 250, 760, 0.6);
    await trascina(p, 250, 700, 250, 1.1); await wait(p, 0.6); await audit(p, 'pagina offerta 2');
    console.log('offerta', await stopRec(r, OUT('offerta')));
  },
  // scena 6a: il dito tocca «Mostra QR Code» e compare il codice (finto, dell'ambiente di prova)
  async qr(b) {
    const c = await appContext(b);
    // i conti alla rovescia del QR sono timer: si rallentano come le animazioni, per restare in tempo di scena
    await c.addInitScript(`(function(){const si=window.setInterval;window.setInterval=function(f,ms,...a){return si.call(window,f,ms/${RATE},...a)}})();`);
    const p = await c.newPage(); await loginCliente(p);
    await p.goto(APP + '/discounts/' + colazione.discount, { waitUntil: 'domcontentloaded' });
    await p.getByText('Colazione + cornetto').first().waitFor({ timeout: 30000 }); await pronta(p);
    const btn = p.getByRole('button', { name: /Mostra QR Code|Genera QR/ }).first(); await btn.waitFor({ timeout: 30000 });
    await btn.scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -260)); await p.waitForTimeout(600);
    await dito.parti(p, 300, 900);
    const r = await startRec(p, TMP + 'rec_qr');
    await wait(p, 0.4); await audit(p, 'pulsante QR');
    await tocca(p, btn, async () => { await btn.click(); }, 0, 0, 0.9);
    await p.getByTestId('qr-dialog').waitFor({ timeout: 30000 }); await wait(p, 1.8); await audit(p, 'QR');
    console.log('qr', await stopRec(r, OUT('qr')));
  },
};
(async () => {
  const b = await chromium.launch();
  const which = process.argv[2] || 'tutte';
  const lista = which === 'tutte' ? ['home', 'scegli', 'offerta', 'qr'] : [which];
  for (const n of lista) await clip[n](b);
  await b.close();
  if (problemi.length) { console.error('ATTENZIONE, testi vietati visibili:\n' + [...new Set(problemi)].join('\n')); process.exit(2); }
  console.log('Controllo schermate: nessun prezzo, percentuale, zona o «quartiere» visibile.');
})().catch(e => { console.error(e); process.exit(1); });
