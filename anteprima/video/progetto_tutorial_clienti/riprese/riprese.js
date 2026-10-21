// Riprese dell'app LOCALE (sito 3013, API 8013) per il video tutorial clienti: schermate «iPhone» a 3x.
// Solo localhost: ogni richiesta verso l'esterno è bloccata. Prezzi, percentuali e zone sono NASCOSTI;
// il QR dell'app (codice di prova del server locale) è sfocato, perché nessuno provi a inquadrarlo.
// Uso: OUT=<cartella privata> node riprese.js
const { chromium, devices } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'); const fs = require('fs');
const APP = process.env.TUTORIAL_APP || 'http://localhost:3013';
const API = process.env.TUTORIAL_API || 'http://localhost:8013';
const OUT = path.join(process.env.OUT, 'app'); fs.mkdirSync(OUT, { recursive: true });
const IDS = JSON.parse(fs.readFileSync(path.join(process.env.OUT, 'demo_ids.json')));

async function contesto(browser) {
  const ctx = await browser.newContext({ ...devices['iPhone 13'], locale: 'it-IT', viewport: { width: 390, height: 797 }, deviceScaleFactor: 3 });
  await ctx.route('**/*', r => {
    const u = r.request().url();
    if (u.startsWith(APP) || u.startsWith(API) || u.startsWith('data:') || u.startsWith('blob:')) return r.continue();
    return r.abort();
  });
  await ctx.route('**/api/config/public', async r => {
    const resp = await r.fetch(); const j = await resp.json(); j.ai_enhance_enabled = false;
    await r.fulfill({ response: resp, json: j });
  });
  await ctx.addInitScript(() => { try {
    localStorage.setItem('sr_cookie_consent', JSON.stringify({ version: 1, action: 'reject_all', prefs: { essential: true }, ts: Date.now() }));
    localStorage.setItem('pwa_install_dismissed_at', String(Date.now())); localStorage.setItem('app_feedback_dismissed_v1', '1'); } catch (e) {} });
  // Niente prezzi, percentuali o nomi di quartiere nel video
  await ctx.addInitScript(() => {
    const ZONE = /^(Cassia|Monte Mario|Aurelio|Tiburtino|Flaminio|Prati|Trastevere|Monteverde|Appio|Portuense|Garbatella|San Paolo|Marconi|Testaccio|Monti)([\s·\-–,].*)?$/i;
    const SOLDI = /€\s?\d|\d\s?%|Risparmi/;
    const proprio = e => [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    const nascondi = () => document.querySelectorAll('span,div,p,a,strong,li').forEach(e => {
      const t = proprio(e);
      if (!t || t.length > 60) return;
      if ((e.children.length <= 2 && ZONE.test(t)) || SOLDI.test(t)) e.style.visibility = 'hidden';
    });
    new MutationObserver(nascondi).observe(document, { childList: true, subtree: true, characterData: true });
    document.addEventListener('DOMContentLoaded', nascondi);
  });
  return ctx;
}
const pausa = ms => new Promise(r => setTimeout(r, ms));
const POS = {};
// posizioni degli elementi da evidenziare (pixel della schermata 3x, pagina dall'alto)
async function misura(page, nome, sel) {
  const r = await page.evaluate(sel => { const e = typeof sel === 'string' ? document.querySelector(sel) : null; if (!e) return null;
    const b = e.getBoundingClientRect(); return [b.left * 3, (b.top + window.scrollY) * 3, b.width * 3, b.height * 3].map(Math.round); }, sel);
  POS[nome] = r; if (!r) console.log('manca', nome, sel);
}
async function scatta(page, nome, full = true) {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); }); await pausa(900);
  await page.screenshot({ path: path.join(OUT, nome + '.png'), fullPage: full });
  console.log('ripresa', nome);
}

(async () => {
  const br = await chromium.launch();
  await fetch(API + '/__e2e/prelancio?acceso=false', { method: 'POST' });
  // 1. Home e registrazione (cliente non ancora iscritto)
  let ctx = await contesto(br); let p = await ctx.newPage();
  await p.goto(APP + '/', { waitUntil: 'networkidle' }); await scatta(p, 'home');
  await p.goto(APP + '/register', { waitUntil: 'networkidle' });
  await p.click('[data-testid="role-client"]').catch(() => {});
  await scatta(p, 'reg_vuoto');
  await misura(p, 'reg_form', 'form');
  await p.fill('[data-testid="reg-first-name"]', 'Cliente');
  await p.fill('[data-testid="reg-last-name"]', 'Esempio');
  await p.fill('[data-testid="reg-email"]', 'cliente@esempio.it');
  await p.fill('[data-testid="reg-password"]', 'password-di-prova');
  await p.check('[data-testid="legal-accept"]');
  await scatta(p, 'reg_pieno');
  // 2. Offerte (con i distintivi) e filtro della zona
  await p.goto(APP + '/discounts', { waitUntil: 'networkidle' }); await pausa(1500); await scatta(p, 'offerte');
  await misura(p, 'zona', '[data-testid="filter-zone"]'); await misura(p, 'posizione', '[data-testid="geo-invito"]');
  await misura(p, 'card_bar', `[data-testid="discount-card-${IDS["Bar dell'Esempio"]}"]`);
  await misura(p, 'card_pizza', `[data-testid="discount-card-${IDS["Pizzeria dell'Esempio"]}"]`);
  await ctx.close();
  // 3. Cliente di prova: dettaglio dell'offerta e «Mostra QR Code»
  ctx = await contesto(br); p = await ctx.newPage();
  await p.goto(APP + '/login', { waitUntil: 'domcontentloaded' });
  const st = await p.evaluate(async api => (await fetch(api + '/api/auth/login', { method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'cliente.demo@example.com', password: 'demo-cliente-2026' }) })).status, API);
  if (st !== 200) throw new Error('login ' + st);
  await p.goto(APP + '/discounts/' + IDS["Bar dell'Esempio"], { waitUntil: 'networkidle' }); await pausa(1500);
  await scatta(p, 'dettaglio');
  await misura(p, 'redeem', '[data-testid="redeem-btn"]');
  await misura(p, 'chiama', 'a[href^="tel:"]'); await misura(p, 'whatsapp', 'a[href*="wa.me"]');
  await p.evaluate(() => { const b = document.querySelector('[data-testid="redeem-btn"]'); b && b.scrollIntoView({ block: 'center' }); });
  await pausa(600);
  fs.writeFileSync(path.join(OUT, 'posizioni.json'), JSON.stringify(POS, null, 1));
  await p.click('[data-testid="redeem-btn"]');
  await p.waitForSelector('[data-testid="qr-dialog"] svg', { timeout: 15000 });
  await p.addStyleTag({ content: '[data-testid="qr-dialog"] svg[role="img"], [data-testid="qr-dialog"] svg:not([class*="lucide"]) { filter: blur(9px); }' });
  await pausa(1200);
  await p.screenshot({ path: path.join(OUT, 'qr.png') }); console.log('ripresa qr');
  await ctx.close();
  await br.close();
})().catch(e => { console.error(e); process.exit(1); });
