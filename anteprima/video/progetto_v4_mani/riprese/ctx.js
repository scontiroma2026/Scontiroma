// Contesto Playwright «iPhone» per l'app locale (video V4 «solo mani»): solo localhost, nessuna richiesta verso l'esterno.
// Solo per le riprese, uno script ripulisce ciò che nel video non deve comparire (prezzi, percentuali, zone, «quartiere»)
// e inserisce il DITO ANIMATO (grafica vettoriale in pagina). Il sito vero non viene modificato.
const { chromium, devices } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'); const fs = require('fs');
const APP = 'http://localhost:3020';
const API = 'http://localhost:8021';
const VP = { viewport: { width: 390, height: 830 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const FOTO = path.join(__dirname, 'foto') + '/';
const APPDIR = path.join(__dirname, '..', 'app') + '/';

// ---------- ripulitura del contenuto (eseguita nel browser) ----------
function ripulisci() {
  const SOST = [[/nel tuo quartiere/gi, 'vicino a te'], [/quartiere per quartiere/gi, 'negozio per negozio'], [/per quartiere/gi, 'per categoria'],
    [/,\s*quartiere/gi, ''], [/quartieri?/gi, 'negozi']];
  const VIETATO = /€|%|\bzon[ae]\b|^\s*risparmi\b|\bIA\b|migliora/i;
  const w = document.createTreeWalker(document.body || document, NodeFilter.SHOW_TEXT); const nodi = [];
  while (w.nextNode()) nodi.push(w.currentNode);
  for (const n of nodi) {
    const t = n.textContent; let nuovo = t;
    for (const [re, s] of SOST) nuovo = nuovo.replace(re, s);
    if (nuovo !== t) n.textContent = nuovo;
    const el = n.parentElement;
    if (VIETATO.test(n.textContent) && el && !el.closest('#dito') && !/^(SCRIPT|STYLE)$/.test(el.tagName)) el.style.display = 'none';
  }
  document.querySelectorAll('input[placeholder]').forEach(i => { const p = i.placeholder.replace(/,?\s*quartiere/gi, ''); if (p !== i.placeholder) i.placeholder = p; });
}
// controllo a vista: elenca i testi VISIBILI nello schermo che contengono parole o simboli vietati
function controlla() {
  const bad = /€|%|quartier|\bzon[ae]\b|migliora|\bIA\b|\d+\s?euro/i; const trovati = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) {
    const n = w.currentNode; const el = n.parentElement; if (!el || !bad.test(n.textContent)) continue;
    let nascosto = false; for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') { nascosto = true; break; } }
    if (nascosto) continue;
    const r = document.createRange(); r.selectNodeContents(n); const b = r.getBoundingClientRect();
    if (b.width > 0 && b.bottom > 0 && b.top < innerHeight) trovati.push(n.textContent.trim().slice(0, 60));
  }
  document.querySelectorAll('input[placeholder]').forEach(i => { if (bad.test(i.placeholder)) trovati.push('placeholder:' + i.placeholder); });
  return trovati;
}
// ---------- il dito animato (SVG) ----------
function inserisciDito() {
  const css = `#dito{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;width:0;height:0;transform:translate(200px,900px);transition:transform 1s cubic-bezier(.45,0,.2,1)}
  #dito .mano{position:absolute;left:-30px;top:-14px;width:84px;height:130px;transform-origin:30px 14px;transition:transform .25s ease-out;filter:drop-shadow(0 8px 10px rgba(26,21,48,.35))}
  #dito.premi .mano{transform:scale(.88) translate(2px,4px)}
  #dito .onda{position:absolute;left:-34px;top:-34px;width:68px;height:68px;border-radius:50%;border:5px solid #D81B72;background:rgba(216,27,114,.18);opacity:0;transform:scale(.3)}
  #dito.premi .onda{animation:onda .7s ease-out}
  @keyframes onda{0%{opacity:.95;transform:scale(.3)}100%{opacity:0;transform:scale(1.9)}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const d = document.createElement('div'); d.id = 'dito';
  d.innerHTML = `<div class="onda"></div><svg class="mano" viewBox="0 0 84 130" xmlns="http://www.w3.org/2000/svg">
    <path d="M30 14c-5 0-9 4-9 9v44l-6-6c-4-4-10-3-13 1-2 3-2 6 0 9l20 33c4 7 11 12 20 12h12c13 0 22-9 22-22V68c0-4-3-7-7-7-2 0-3 0-4 1-1-3-4-5-7-5-2 0-4 1-5 2-1-3-4-5-7-5h-1V23c0-5-4-9-9-9z" fill="#fff" stroke="#1A1530" stroke-width="4" stroke-linejoin="round"/>
    <path d="M52 61v14M64 62v13" stroke="#1A1530" stroke-width="3.5" stroke-linecap="round" opacity=".55"/>
    <circle cx="30" cy="30" r="3.2" fill="#D81B72"/></svg>`;
  document.body.appendChild(d);
  window.__dito = {
    vai(x, y, s) { d.style.transitionDuration = s + 's'; d.style.transform = `translate(${x}px,${y}px)`; },
    premi() { d.classList.remove('premi'); void d.offsetWidth; d.classList.add('premi'); },
    rilascia() { d.classList.remove('premi'); },
  };
}
async function appContext(browser, opts = VP) {
  const ctx = await browser.newContext({ ...devices['iPhone 13'], locale: 'it-IT', ...opts });
  await ctx.route('**/*', r => {
    const u = r.request().url();
    if (u.includes('photo-1552832230')) return r.fulfill({ contentType: 'image/jpeg', body: fs.readFileSync(FOTO + 'via.jpg') });
    if (u.includes('photo-1531572753322')) return r.fulfill({ contentType: 'image/jpeg', body: fs.readFileSync(FOTO + 'roma_card.jpg') });
    if (u.startsWith(APP) || u.startsWith(API) || u.startsWith('data:') || u.startsWith('blob:')) return r.continue();
    return r.abort();
  });
  // «Migliora foto con IA» spento (come in produzione prima del lancio)
  await ctx.route('**/api/config/public', async r => {
    const resp = await r.fetch(); const j = await resp.json(); j.ai_enhance_enabled = false;
    await r.fulfill({ response: resp, json: j });
  });
  await ctx.addInitScript(() => { try {
    localStorage.setItem('sr_cookie_consent', JSON.stringify({ version: 1, action: 'reject_all', prefs: { essential: true }, ts: Date.now() }));
    localStorage.setItem('pwa_install_dismissed_at', String(Date.now())); localStorage.setItem('app_feedback_dismissed_v1', '1'); } catch (e) {} });
  await ctx.addInitScript(`${ripulisci.toString()}\nwindow.__controlla = ${controlla.toString()};
    (function(){ const run = () => { try { ripulisci(); } catch (e) {} }; new MutationObserver(run).observe(document, { childList: true, subtree: true, characterData: true }); document.addEventListener('DOMContentLoaded', run); })();
    document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = '[data-testid="filter-zone"]{display:none!important}'; document.head.appendChild(s); (${inserisciDito.toString()})(); });`);
  return ctx;
}
async function loginCliente(page, email = 'cliente.demo@example.com', password = 'demo-cliente-2026') {
  await page.goto(APP + '/login', { waitUntil: 'domcontentloaded' });
  const st = await page.evaluate(async ({ api, email, password }) => (await fetch(api + '/api/auth/login', { method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })).status, { api: API, email, password });
  if (st !== 200) throw new Error('login ' + st);
}
module.exports = { chromium, appContext, loginCliente, APP, API, VP, FOTO, APPDIR };
