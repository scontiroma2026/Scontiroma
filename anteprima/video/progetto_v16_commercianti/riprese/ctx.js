// Contesto Playwright «iPhone» per l'app locale (v14): solo localhost, nessuna richiesta verso l'esterno.
// I caratteri (Fraunces, Manrope) sono ospitati dall'app stessa: nessuna cache di font da disco.
const { chromium, devices } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'); const fs = require('fs');
const APP = process.env.V16_APP || 'http://localhost:3010';
const API = process.env.V16_API || 'http://localhost:8011';
const VP = { viewport: { width: 390, height: 797 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
const FOTO = (process.env.PRIV || path.join(__dirname, '..')) + '/v16/foto/';
const APPDIR = (process.env.PRIV || path.join(__dirname, '..')) + '/v16/app/';
async function appContext(browser, opts = VP) {
  const ctx = await browser.newContext({ ...devices['iPhone 13'], locale: 'it-IT', ...opts });
  await ctx.route('**/*', r => {
    const u = r.request().url();
    // La home usa due foto di Roma da internet: offline si sostituiscono con foto locali di fantasia
    if (u.includes('photo-1552832230')) return r.fulfill({ contentType: 'image/jpeg', body: fs.readFileSync(FOTO + 'via.jpg') });
    if (u.includes('photo-1531572753322')) return r.fulfill({ contentType: 'image/jpeg', body: fs.readFileSync(FOTO + 'roma_card.jpg') });
    if (u.startsWith(APP) || u.startsWith(API) || u.startsWith('data:') || u.startsWith('blob:')) return r.continue();
    return r.abort();
  });
  // Come in produzione prima del lancio: «Migliora foto con IA» spento (il server di prova ha un finto Gemini acceso)
  await ctx.route('**/api/config/public', async r => {
    const resp = await r.fetch(); const j = await resp.json(); j.ai_enhance_enabled = false;
    await r.fulfill({ response: resp, json: j });
  });
  await ctx.addInitScript(() => { try {
    localStorage.setItem('sr_cookie_consent', JSON.stringify({ version: 1, action: 'reject_all', prefs: { essential: true }, ts: Date.now() }));
    localStorage.setItem('pwa_install_dismissed_at', String(Date.now())); localStorage.setItem('app_feedback_dismissed_v1', '1'); } catch (e) {} });
  // Per questo video il titolare ha deciso di mostrare la percentuale (-40%): resta quella che mostra l'app.
  // Nessun quartiere nel video: i nomi delle zone (e l'icona accanto) si nascondono.
  await ctx.addInitScript(() => {
    const ZONE = /^(Cassia|Monte Mario|Aurelio|Tiburtino|Flaminio|Prati|Trastevere|Monteverde|Appio|Portuense|Garbatella|San Paolo|Marconi)([\s·\-–].*)?$/i;
    const proprio = e => [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    const nascondi = () => document.querySelectorAll('span,div,p,a').forEach(e => {
      if (e.children.length <= 1 && ZONE.test(proprio(e)) && proprio(e).length < 30) e.style.visibility = 'hidden';
    });
    new MutationObserver(nascondi).observe(document, { childList: true, subtree: true, characterData: true });
    document.addEventListener('DOMContentLoaded', nascondi);
  });
  return ctx;
}
async function loginCliente(page, email = 'cliente.demo@example.com', password = 'demo-cliente-2026') {
  await page.goto(APP + '/login', { waitUntil: 'domcontentloaded' });
  const st = await page.evaluate(async ({ api, email, password }) => (await fetch(api + '/api/auth/login', { method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })).status, { api: API, email, password });
  if (st !== 200) throw new Error('login ' + st);
}
module.exports = { chromium, appContext, loginCliente, APP, API, VP, FOTO, APPDIR };
