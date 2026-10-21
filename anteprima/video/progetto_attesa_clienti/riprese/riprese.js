// Riprese dell'app LOCALE (sito 3012, API 8012) per il video di attesa clienti: schermate «iPhone» a 3x.
// Solo localhost: ogni richiesta verso l'esterno è bloccata. Prezzi, percentuali e zone sono NASCOSTI.
// Uso: OUT=<cartella privata> node riprese.js
const { chromium, devices } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'); const fs = require('fs');
const APP = process.env.ATTESA_APP || 'http://localhost:3012';
const API = process.env.ATTESA_API || 'http://localhost:8012';
const OUT = path.join(process.env.OUT, 'app'); fs.mkdirSync(OUT, { recursive: true });

async function contesto(browser) {
  const ctx = await browser.newContext({ ...devices['iPhone 13'], locale: 'it-IT', viewport: { width: 390, height: 797 }, deviceScaleFactor: 3 });
  await ctx.route('**/*', r => {
    const u = r.request().url();
    if (u.startsWith(APP) || u.startsWith(API) || u.startsWith('data:') || u.startsWith('blob:')) return r.continue();
    return r.abort();
  });
  // Come in produzione prima del lancio: «Migliora foto con IA» spento
  await ctx.route('**/api/config/public', async r => {
    const resp = await r.fetch(); const j = await resp.json(); j.ai_enhance_enabled = false;
    await r.fulfill({ response: resp, json: j });
  });
  await ctx.addInitScript(() => { try {
    localStorage.setItem('sr_cookie_consent', JSON.stringify({ version: 1, action: 'reject_all', prefs: { essential: true }, ts: Date.now() }));
    localStorage.setItem('pwa_install_dismissed_at', String(Date.now())); localStorage.setItem('app_feedback_dismissed_v1', '1'); } catch (e) {} });
  // Niente prezzi, percentuali o nomi di quartiere nel video: si nascondono gli elementi che li mostrano.
  await ctx.addInitScript(() => {
    const ZONE = /^(Cassia|Monte Mario|Aurelio|Tiburtino|Flaminio|Prati|Trastevere|Monteverde|Appio|Portuense|Garbatella|San Paolo|Marconi|Testaccio|Monti)([\s·\-–].*)?$/i;
    const SOLDI = /€\s?\d|\d\s?%|Risparmi/;
    const proprio = e => [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    const nascondi = () => document.querySelectorAll('span,div,p,a,strong').forEach(e => {
      const t = proprio(e);
      if (!t || t.length > 40) return;
      if ((e.children.length <= 1 && ZONE.test(t)) || SOLDI.test(t)) e.style.visibility = 'hidden';
    });
    new MutationObserver(nascondi).observe(document, { childList: true, subtree: true, characterData: true });
    document.addEventListener('DOMContentLoaded', nascondi);
  });
  return ctx;
}
const pausa = ms => new Promise(r => setTimeout(r, ms));
async function scatta(page, nome, full = false) {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); }); await pausa(900);
  await page.screenshot({ path: path.join(OUT, nome + '.png'), fullPage: full });
  console.log('ripresa', nome);
}

(async () => {
  const br = await chromium.launch();
  await fetch(API + '/__e2e/prelancio?acceso=false', { method: 'POST' });
  let ctx = await contesto(br); let p = await ctx.newPage();
  // 1. Home (sito com'è oggi)
  await p.goto(APP + '/', { waitUntil: 'networkidle' }); await scatta(p, 'home', true);
  // 2. Elenco delle offerte (dati finti)
  await p.goto(APP + '/discounts', { waitUntil: 'networkidle' }); await pausa(1500); await scatta(p, 'offerte', true);
  await ctx.close();
  // 3. Lista d'attesa: pre-lancio acceso SOLO su questo server locale
  await fetch(API + '/__e2e/prelancio?acceso=true', { method: 'POST' });
  ctx = await contesto(br); p = await ctx.newPage();
  await p.goto(APP + '/?fonte=video-attesa', { waitUntil: 'networkidle' });
  await scatta(p, 'attesa_vuoto', true);
  await p.fill('[data-testid="lista-attesa-email"]', 'tu@esempio.it');
  await p.check('[data-testid="lista-attesa-consenso"]');
  await scatta(p, 'attesa_pieno', true);
  await p.click('[data-testid="lista-attesa-invia"]');
  await p.waitForSelector('[data-testid="lista-attesa-grazie"]', { timeout: 15000 });
  await scatta(p, 'attesa_grazie', true);
  await ctx.close();
  await fetch(API + '/__e2e/prelancio?acceso=false', { method: 'POST' });
  await br.close();
})().catch(e => { console.error(e); process.exit(1); });
