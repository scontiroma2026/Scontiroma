// Strumenti condivisi dai test locali.
const crypto = require('crypto');
const base = require('@playwright/test');
const { API, WEB, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_MASTER_PASSWORD, STRIPE_WEBHOOK_SECRET } = require('./env');

// Ogni pagina può parlare solo con il server e il sito locali: qualunque altra richiesta
// (produzione, font, mappe, PayPal...) viene bloccata. I test sono ripetibili e non
// toccano mai scontiroma.it.
const test = base.test.extend({
  context: async ({ context }, use) => {
    await context.route('**/*', (route) => {
      const u = route.request().url();
      if (u.startsWith(API) || u.startsWith(WEB) || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
      return route.abort();
    });
    await context.addInitScript(() => {
      try {
        localStorage.setItem('sr_cookie_consent', JSON.stringify({ version: 1, action: 'reject_all', prefs: { essential: true }, ts: Date.now() }));
        localStorage.setItem('pwa_install_dismissed_at', String(Date.now()));
        localStorage.setItem('app_feedback_dismissed_v1', '1');
      } catch (e) {}
    });
    await use(context);
  },
});
const { expect } = base;

const unico = (tag) => `e2e.${tag}.${Date.now()}.${crypto.randomBytes(3).toString('hex')}@example.com`;
const PASSWORD = 'password-e2e-123';
const MERCHANT = { shop_name: 'Negozio di prova', zone: 'Garbatella', category: 'Ristorante', phone: '+39 06 0000000', address: "Via dell'Esempio 1, Roma" };

// ---------- API ----------
// Ogni chiamata usa un contesto nuovo, senza cookie: il server legge prima il cookie e poi
// l'header Authorization, quindi i cookie di un login precedente falserebbero l'utente.
async function chiama(_request, method, path, { token, body, headers = {}, params } = {}) {
  const h = { ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  const ctx = await base.request.newContext();
  try {
    const r = await ctx.fetch(`${API}/api${path}`, { method, data: body, headers: h, params, failOnStatusCode: false });
    let data = null;
    try { data = await r.json(); } catch (e) {}
    return { status: r.status(), data, headers: r.headers() };
  } finally {
    await ctx.dispose();
  }
}

async function registra(request, role, extra = {}) {
  const email = unico(role);
  const body = { legal_accepted: true, email, password: PASSWORD, name: role === 'client' ? 'Giulia Prova' : 'Luca', role, ...(role === 'merchant' ? MERCHANT : {}), ...extra };
  const r = await chiama(request, 'POST', '/auth/register', { body });
  expect(r.status, JSON.stringify(r.data)).toBe(200);
  return { email, password: PASSWORD, token: r.data.access_token, user: r.data.user };
}

async function login(request, email, password) {
  return chiama(request, 'POST', '/auth/login', { body: { email, password } });
}

async function admin(request) {
  const r = await login(request, ADMIN_EMAIL, ADMIN_PASSWORD);
  expect(r.status, 'login admin di test').toBe(200);
  const m = await chiama(request, 'POST', '/admin/verify-master', { token: r.data.access_token, body: { password: ADMIN_MASTER_PASSWORD } });
  expect(m.status, 'master password di test').toBe(200);
  return { token: r.data.access_token, headers: { 'X-Admin-Master': m.data.token } };
}

async function creaOffertaApprovata(request, merchantToken, offerta = {}) {
  const body = { title: `Offerta e2e ${Date.now()}`, description: 'Descrizione di prova.', original_price: 40, discounted_price: 20,
    validity_info: 'Solo mercoledì e venerdì', max_uses_per_month: 1, ...offerta };
  const c = await chiama(request, 'POST', '/merchants/me/discount', { token: merchantToken, body });
  expect(c.status, JSON.stringify(c.data)).toBe(200);
  const a = await admin(request);
  const ok = await chiama(request, 'POST', `/admin/discounts/${c.data.discount.id}/approve`, { token: a.token, headers: a.headers });
  expect(ok.status, JSON.stringify(ok.data)).toBe(200);
  return { id: c.data.discount.id, ...body };
}

// Firma un evento come fa Stripe (header Stripe-Signature, HMAC-SHA256) con il segreto di test.
function firmaStripe(payload, secret = STRIPE_WEBHOOK_SECRET) {
  const t = Math.floor(Date.now() / 1000);
  const v1 = crypto.createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');
  return `t=${t},v1=${v1}`;
}

async function webhookCheckoutCompletato(request, sessionId, userId) {
  const payload = JSON.stringify({
    id: `evt_e2e_${crypto.randomBytes(6).toString('hex')}`, object: 'event', type: 'checkout.session.completed',
    data: { object: { id: sessionId, object: 'checkout.session', payment_status: 'paid',
      subscription: `sub_e2e_${crypto.randomBytes(6).toString('hex')}`, metadata: { user_id: userId } } },
  });
  return request.fetch(`${API}/api/stripe/webhook`, {
    method: 'POST', data: payload, failOnStatusCode: false,
    headers: { 'Content-Type': 'application/json', 'Stripe-Signature': firmaStripe(payload) },
  });
}

// Abbonamento attivato come in produzione dopo il pagamento: sessione registrata + webhook firmato.
async function abbonamentoSimulato(request, email, userId) {
  const s = await request.post(`${API}/__e2e/stripe/sessione-finta`, { params: { email } });
  expect(s.status()).toBe(200);
  const { session_id } = await s.json();
  const w = await webhookCheckoutCompletato(request, session_id, userId);
  expect(w.status(), await w.text()).toBe(200);
  return session_id;
}

// ---------- Browser ----------
// Login come lo fa il sito (cookie httpOnly), chiamando l'API dalla pagina.
async function loginNelBrowser(page, email, password) {
  await page.goto('/login');
  const st = await page.evaluate(async ({ api, email, password }) => {
    const r = await fetch(`${api}/api/auth/login`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    return r.status;
  }, { api: API, email, password });
  expect(st).toBe(200);
}

module.exports = { test, expect, API, WEB, PASSWORD, MERCHANT, unico, chiama, registra, login, admin, creaOffertaApprovata, firmaStripe, webhookCheckoutCompletato, abbonamentoSimulato, loginNelBrowser };
