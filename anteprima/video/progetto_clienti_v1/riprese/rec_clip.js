// Riprese del video per i clienti (v1) dall'app di main (server locale con dati inventati: avvia_server.py + seed.py).
// Uso: node rec_clip.js <home|iscrizione|catalogo|pagina_offerta|qr_cliente|banco|zona_vuota|tutte>
// Uscita: ../app/clip_<nome>.mp4 (1170x1818 circa, 30 fps), poi montate da ../montaggio/monta.py.
const fs = require('fs');
const { chromium, appContext, loginCliente, APP, API, APPDIR } = require('./ctx');
const { startRec, stopRec, wait, RATE } = require('./recorder');
const ids = require('./demo_ids.json');
const offerta = ids.offerta, tutti = ids.tutti;
const TMP = process.env.CLIENTI_TMP || '/tmp/clienti_rec/'; fs.mkdirSync(TMP, { recursive: true }); fs.mkdirSync(APPDIR, { recursive: true });
const OUT = n => APPDIR + 'clip_' + n + '.mp4';
const typeSlow = async (loc, text, cps = 14) => { await loc.click(); await loc.pressSequentially(text, { delay: 1000 / cps / RATE }); };
// scorrimento dolce verso una posizione (px) o un elemento: durata in «tempo di scena»
const glideY = async (p, y1, dur) => {
  const y0 = await p.evaluate(() => window.scrollY); const ms = dur * 1000 / RATE, t0 = Date.now();
  for (;;) {
    const q = Math.min(1, (Date.now() - t0) / ms), k = q < .5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;
    await p.evaluate(y => window.scrollTo(0, y), y0 + (y1 - y0) * k);
    if (q >= 1) break; await p.waitForTimeout(30);
  }
};
const glide = async (p, loc, off, dur) => glideY(p, await loc.evaluate((e, off) => e.getBoundingClientRect().top + window.scrollY - off, off), dur);
const pronta = async p => { await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1500); };
// il testo legale dell'offerta («Informative legali») non deve comparire a schermo
const nascondiLegale = p => p.evaluate(() => { const e = document.querySelector('[data-testid="info-legal"]'); if (e) e.style.display = 'none'; });

const clip = {
  // home, poi tocco su «Inizia ora»
  async home(b) {
    const c = await appContext(b); const p = await c.newPage();
    await p.goto(APP + '/', { waitUntil: 'networkidle' }); await p.getByTestId('hero-sottotitolo').waitFor({ timeout: 30000 }); await pronta(p);
    const r = await startRec(p, TMP + 'rec_home');
    await wait(p, 1.6); await glideY(p, 120, 1.4); await wait(p, 1.2);
    await p.getByTestId('cta-start').tap(); await p.getByTestId('register-page').waitFor({ timeout: 30000 }); await wait(p, 1.0);
    console.log('home', await stopRec(r, OUT('home')));
  },
  // modulo cliente: nome, cognome, email, password, 18+ e Termini, «Crea account», poi Face ID facoltativo e «Salta per ora»
  async iscrizione(b) {
    const c = await appContext(b); const p = await c.newPage();
    await p.goto(APP + '/register', { waitUntil: 'domcontentloaded' });
    await p.getByTestId('reg-first-name').waitFor({ timeout: 60000 }); await pronta(p);
    const r = await startRec(p, TMP + 'rec_reg');
    await wait(p, 0.5);
    await typeSlow(p.getByTestId('reg-first-name'), 'Giulia', 20);
    await typeSlow(p.getByTestId('reg-last-name'), 'Esempio', 20);
    await glide(p, p.getByTestId('reg-email'), 260, 0.8);
    await typeSlow(p.getByTestId('reg-email'), 'giulia.nuova' + (process.env.N || '') + '@example.com', 50);
    await typeSlow(p.getByTestId('reg-password'), 'demo-giulia-2026', 50); await wait(p, 0.3);
    await glide(p, p.getByTestId('legal-accept'), 300, 1.0);
    await p.getByTestId('legal-accept').click(); await wait(p, 0.8);
    await glide(p, p.getByTestId('reg-submit'), 500, 0.9); await wait(p, 0.4);
    await p.getByTestId('reg-submit').tap();
    await p.getByTestId('setup-security-page').waitFor({ timeout: 30000 }); await p.evaluate(() => window.scrollTo(0, 0)); await wait(p, 1.4);
    await p.getByTestId('skip-security').tap(); await wait(p, 0.2);
    console.log('iscrizione', await stopRec(r, OUT('iscrizione')));
  },
  // catalogo: zona, schede con i distintivi
  async catalogo(b) {
    const c = await appContext(b); const p = await c.newPage(); await loginCliente(p);
    await p.goto(APP + '/discounts', { waitUntil: 'networkidle' });
    await p.getByTestId(`discount-card-${offerta.discount}`).first().waitFor({ timeout: 30000 }); await pronta(p);
    const r = await startRec(p, TMP + 'rec_cat');
    await wait(p, 0.8);
    const z = p.getByTestId('filter-zone'); await z.focus(); await wait(p, 0.6);
    await z.selectOption('Fuori Roma'); await wait(p, 1.0);
    await glide(p, p.getByTestId(`discount-card-${tutti['frutta.esempio@example.com'].discount}`).first(), 110, 1.8); await wait(p, 1.0);
    await glide(p, p.getByTestId(`discount-card-${tutti['osteria.esempio@example.com'].discount}`).first(), 110, 1.8); await wait(p, 1.6);
    await glide(p, p.getByTestId(`discount-card-${offerta.discount}`).first(), 110, 1.6); await wait(p, 1.8);
    console.log('catalogo', await stopRec(r, OUT('catalogo')));
  },
  // pagina offerta: prezzo, cuore dei preferiti, Chiama e WhatsApp
  async pagina_offerta(b) {
    const c = await appContext(b); const p = await c.newPage(); await loginCliente(p);
    await p.goto(APP + '/discounts/' + offerta.discount, { waitUntil: 'domcontentloaded' });
    await p.getByText('Pizza e bibita').first().waitFor({ timeout: 30000 }); await pronta(p); await nascondiLegale(p);
    const cuore = p.getByTestId(`preferito-${offerta.merchant}`);
    if ((await cuore.getAttribute('data-pieno')) === '1') { await cuore.evaluate(e => e.click()); await p.waitForTimeout(800); }   // parte sempre dal cuore vuoto
    const r = await startRec(p, TMP + 'rec_off');
    await wait(p, 1.2); await glideY(p, 330, 2.2); await wait(p, 1.8);
    await glideY(p, 0, 1.0); await wait(p, 0.5);
    await cuore.evaluate(e => e.click()); await wait(p, 1.6);
    await glideY(p, 880, 2.6); await wait(p, 2.4);
    console.log('pagina_offerta', await stopRec(r, OUT('pagina_offerta')));
  },
  async qr_cliente(b) {
    const c = await appContext(b); const p = await c.newPage(); await loginCliente(p);
    await p.goto(APP + '/discounts/' + offerta.discount, { waitUntil: 'domcontentloaded' }); await p.getByText('Pizza e bibita').first().waitFor({ timeout: 30000 }); await pronta(p); await nascondiLegale(p);
    const btn = p.getByRole('button', { name: /Mostra QR Code|Genera QR/ }).first(); await btn.waitFor({ timeout: 30000 });
    await btn.scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -200)); await p.waitForTimeout(800);
    const r = await startRec(p, TMP + 'rec_qr1', 1);  // velocità reale: il conto alla rovescia del QR è un timer JS
    await p.waitForTimeout(900); await btn.tap(); await p.getByTestId('qr-dialog').waitFor({ timeout: 30000 }); await p.waitForTimeout(3800);
    console.log('qr_cliente', await stopRec(r, OUT('qr_cliente')));
  },
  // al banco: il negozio scrive il codice a 4 cifre, «SCONTO VALIDO»
  async banco(b) {
    const c = await appContext(b); const p = await c.newPage(); await loginCliente(p);
    const qr = await p.evaluate(async ({ api, did }) => {
      const r = await fetch(api + '/api/redemptions/create/' + did, { method: 'POST', credentials: 'include' }).then(r => r.json());
      const t = await fetch(`${api}/api/redemptions/${r.redemption.id}/token`, { credentials: 'include' }).then(r => r.json());
      return t.qr_value;
    }, { api: API, did: offerta.discount });
    const m = await fetch(API + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'pizzeria.esempio@example.com', password: 'demo-shop-2026' }) }).then(r => r.json());
    const code = (await fetch(API + '/api/merchants/me/shop-code', { headers: { Authorization: 'Bearer ' + m.access_token } }).then(r => r.json())).code;
    const c2 = await appContext(b); const q = await c2.newPage(); await q.goto('about:blank');
    const r = await startRec(q, TMP + 'rec_banco');
    await q.goto(qr, { waitUntil: 'domcontentloaded' });
    await q.getByTestId('shop-code-input').waitFor({ timeout: 30000 }); await q.evaluate(() => document.fonts.ready); await wait(q, 1.2);
    await q.getByTestId('shop-code-input').click(); await q.getByTestId('shop-code-input').pressSequentially(code, { delay: 400 }); await wait(q, 0.5);
    await q.getByTestId('shop-code-apply').tap();
    await q.getByRole('heading', { name: /SCONTO\s*VALIDO/i }).waitFor({ timeout: 30000 }); await q.evaluate(() => document.fonts.ready); await wait(q, 2.6);
    console.log('banco', await stopRec(r, OUT('banco')));
    await q.screenshot({ path: TMP + 'banco_valido.png' });
  },
  // zona senza offerte: «Stiamo arrivando nella tua zona» e «Fammi sapere quando arrivate»
  async zona_vuota(b) {
    const c = await appContext(b); const p = await c.newPage(); await loginCliente(p);
    await p.goto(APP + '/discounts', { waitUntil: 'networkidle' });
    await p.getByTestId(`discount-card-${offerta.discount}`).first().waitFor({ timeout: 30000 }); await pronta(p);
    const r = await startRec(p, TMP + 'rec_zv');
    await wait(p, 0.6);
    const z = p.getByTestId('filter-zone'); await z.focus(); await wait(p, 0.5);
    await z.selectOption('Ostia'); await p.getByTestId('scheda-zona-vuota').waitFor({ timeout: 30000 }); await wait(p, 0.8);
    await glide(p, p.getByTestId('scheda-zona-vuota'), 120, 1.2); await wait(p, 1.6);
    await p.getByTestId('scheda-interesse').tap(); await p.getByTestId('interesse-grazie').waitFor({ timeout: 30000 }); await wait(p, 2.0);
    console.log('zona_vuota', await stopRec(r, OUT('zona_vuota')));
  },
};
(async () => {
  const b = await chromium.launch();
  const which = process.argv[2] || 'tutte';
  const lista = which === 'tutte' ? ['home', 'iscrizione', 'catalogo', 'pagina_offerta', 'qr_cliente', 'zona_vuota', 'banco'] : [which];
  for (const n of lista) await clip[n](b);
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
