// Smoke test di SOLA LETTURA sulla produzione: nessun login, nessun dato scritto.
// Solo richieste GET/HEAD/OPTIONS, una visita alla home come un visitatore qualunque e
// POST /api/auth/logout senza essere collegati (cancella solo cookie inesistenti, non scrive nulla).
const tls = require('tls');
const { test, expect } = require('@playwright/test');
const { PROD_WEB, PROD_API } = require('../env');

const host = (u) => new URL(u).hostname;

test('il server risponde: GET /api/ → status ok', async ({ request }) => {
  const r = await request.get(`${PROD_API}/api/`);
  expect(r.status()).toBe(200);
  expect(await r.json()).toMatchObject({ status: 'ok' });
});

test('la home carica senza errori in console e chiama api.scontiroma.it', async ({ page }) => {
  const errori = [];
  const versoApi = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    // Un visitatore non loggato riceve 401 da /auth/me e /auth/refresh: è il comportamento atteso.
    const u = (m.location() || {}).url || '';
    if (/\/api\/auth\/(me|refresh)/.test(u) && /status of 401/.test(m.text())) return;
    errori.push(`${m.text()} ${u}`);
  });
  page.on('pageerror', (e) => errori.push(e.message));
  page.on('request', (r) => { if (host(r.url()) === host(PROD_API)) versoApi.push(r.url()); });
  // Nessun cookie di consenso: è la visita di un utente nuovo.
  const r = await page.goto('/', { waitUntil: 'load' });
  expect(r.status()).toBe(200);
  await expect(page.locator('#root')).not.toBeEmpty();
  // La pagina sconti legge sempre dall'API: verifica che le chiamate vadano al server giusto.
  await page.goto('/discounts', { waitUntil: 'networkidle' });
  expect(versoApi.length, 'nessuna chiamata verso il server API').toBeGreaterThan(0);
  expect(errori, `errori in console:\n${errori.join('\n')}`).toEqual([]);
});

test('CORS: accetta https://scontiroma.it e rifiuta un\'altra origine', async ({ request }) => {
  const ok = await request.get(`${PROD_API}/api/`, { headers: { Origin: PROD_WEB } });
  expect(ok.headers()['access-control-allow-origin']).toBe(PROD_WEB);
  expect(ok.headers()['access-control-allow-credentials']).toBe('true');

  // Preflight come lo fa il browser prima di un POST con credenziali
  const pre = await request.fetch(`${PROD_API}/api/auth/login`, {
    method: 'OPTIONS',
    headers: { Origin: PROD_WEB, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' },
  });
  expect(pre.status()).toBe(200);
  expect(pre.headers()['access-control-allow-origin']).toBe(PROD_WEB);

  const altro = await request.get(`${PROD_API}/api/`, { headers: { Origin: 'https://sito-qualunque.example' } });
  expect(altro.headers()['access-control-allow-origin']).toBeUndefined();
  const preAltro = await request.fetch(`${PROD_API}/api/auth/login`, {
    method: 'OPTIONS',
    headers: { Origin: 'https://sito-qualunque.example', 'Access-Control-Request-Method': 'POST' },
  });
  expect(preAltro.headers()['access-control-allow-origin']).toBeUndefined();
});

test('www.scontiroma.it reindirizza a scontiroma.it', async ({ request }) => {
  const www = PROD_WEB.replace('://', '://www.');
  const r = await request.get(`${www}/`, { maxRedirects: 0 });
  expect([301, 302, 307, 308]).toContain(r.status());
  expect(r.headers().location).toMatch(new RegExp(`^${PROD_WEB.replace(/\./g, '\\.')}/?`));
});

for (const url of [PROD_WEB, PROD_API, PROD_WEB.replace('://', '://www.')]) {
  test(`certificato valido per ${host(url)} (e non in scadenza entro 14 giorni)`, async () => {
    const cert = await new Promise((resolve, reject) => {
      const s = tls.connect({ host: host(url), port: 443, servername: host(url), rejectUnauthorized: true }, () => {
        const c = s.getPeerCertificate();
        s.end();
        resolve({ authorized: s.authorized, validTo: new Date(c.valid_to) });
      });
      s.setTimeout(15_000, () => { s.destroy(); reject(new Error('timeout TLS')); });
      s.on('error', reject);
    });
    expect(cert.authorized).toBe(true);
    const giorni = (cert.validTo - Date.now()) / 86_400_000;
    expect(giorni, `il certificato scade il ${cert.validTo.toISOString()}`).toBeGreaterThan(14);
  });
}

test('CSRF: le richieste dal nostro sito non vengono bloccate (anche con CSRF_ORIGIN_MODE=enforce)', async ({ request }) => {
  // Come fa Safari/Chrome su iPhone o dall'icona sulla schermata Home: Origin = indirizzo del sito.
  const nostro = await request.post(`${PROD_API}/api/auth/logout`, { headers: { Origin: PROD_WEB } });
  expect(nostro.status(), 'il sito non deve ricevere "Origine non consentita"').not.toBe(403);

  // www: accettato sia dal CORS sia dal controllo CSRF, oppure da nessuno dei due (oggi www
  // reindirizza al sito, quindi dal browser non parte mai una richiesta con Origin www).
  const www = PROD_WEB.replace('://', '://www.');
  const pre = await request.fetch(`${PROD_API}/api/auth/login`, {
    method: 'OPTIONS',
    headers: { Origin: www, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' },
  });
  const corsOk = pre.headers()['access-control-allow-origin'] === www;
  const post = await request.post(`${PROD_API}/api/auth/logout`, { headers: { Origin: www } });
  if (corsOk) expect(post.status()).not.toBe(403);
});
