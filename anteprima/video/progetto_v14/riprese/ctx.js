// Contesto Playwright «iPhone» per l'app locale (v14): solo localhost, nessuna richiesta verso l'esterno.
// I caratteri (Fraunces, Manrope) sono ospitati dall'app stessa: nessuna cache di font da disco.
const { chromium, devices } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'); const fs = require('fs');
const APP = process.env.V14_APP || 'http://localhost:3010';
const API = process.env.V14_API || 'http://localhost:8011';
const VP = { viewport: { width: 390, height: 606 }, deviceScaleFactor: 2.4, isMobile: true, hasTouch: true };
const FOTO = path.join(__dirname, 'foto') + '/';
const APPDIR = path.join(__dirname, '..', 'app') + '/';
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
  // Il sito mostra da solo la percentuale di sconto sulle offerte (es. «-50%»): nel video non deve comparire.
  await ctx.addInitScript(() => {
    const proprio = e => [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    const nascondi = () => document.querySelectorAll('span,div,p,b').forEach(e => {
      if (/^([−–-]\s?\d{1,3}\s?%|\d{1,3}\s?%\s+di sconto)$/i.test(proprio(e)) && e.textContent.trim() === proprio(e)) e.style.display = 'none';
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
