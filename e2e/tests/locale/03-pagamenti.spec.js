// Abbonamento con Stripe.
// - Con una chiave Stripe di TEST in ambiente (STRIPE_SECRET_KEY=sk_test_...): pagamento vero
//   sulla pagina di Stripe con la carta 4242 4242 4242 4242, poi ritorno al sito.
// - Senza chiave: quel test viene SALTATO e si prova lo stesso percorso lato server con un
//   webhook "checkout.session.completed" firmato come lo firma Stripe (segreto di test).
const { test, expect, API, WEB, chiama, registra, loginNelBrowser, webhookCheckoutCompletato, abbonamentoSimulato } = require('../fixtures');
const { STRIPE_TEST_KEY } = require('../env');

async function abbonato(request, token) {
  const me = await chiama(request, 'GET', '/auth/me', { token });
  return me.data.user.has_active_subscription;
}

test('abbonamento con Stripe in modalità test (carta 4242)', async ({ page, request }) => {
  test.skip(!STRIPE_TEST_KEY, 'Nessuna chiave Stripe di test (sk_test_...) in ambiente: pagamento reale saltato.');
  test.setTimeout(180_000);
  const c = await registra(request, 'client');
  await loginNelBrowser(page, c.email, c.password);
  // Solo per questo test la pagina può raggiungere Stripe (checkout ospitato da Stripe).
  await page.route(/stripe\.(com|network)|stripecdn\.com|hcaptcha\.com/, (route) => route.continue());

  const r = await chiama(request, 'POST', '/payments/checkout', { token: c.token, body: { origin_url: WEB } });
  expect(r.status, JSON.stringify(r.data)).toBe(200);
  expect(r.data.session_id).toMatch(/^cs_test_/);
  await page.goto(r.data.checkout_url);
  const email = page.locator('#email');
  if (await email.isVisible().catch(() => false)) await email.fill(c.email);
  await page.locator('#cardNumber').fill('4242 4242 4242 4242');
  await page.locator('#cardExpiry').fill('12 / 34');
  await page.locator('#cardCvc').fill('123');
  await page.locator('#billingName').fill('Giulia Prova');
  const cap = page.locator('#billingPostalCode');
  if (await cap.isVisible().catch(() => false)) await cap.fill('00154');
  await page.locator('button[type=submit]').click();
  await page.waitForURL(`${WEB}/payment/success**`, { timeout: 90_000 });
  // La pagina di successo interroga /payments/status, che conferma il pagamento con Stripe.
  await expect.poll(() => abbonato(request, c.token), { timeout: 60_000 }).toBe(true);
});

test('abbonamento attivato dal webhook Stripe firmato (pagamento simulato)', async ({ request }) => {
  const c = await registra(request, 'client');
  expect(await abbonato(request, c.token)).toBe(false);
  await abbonamentoSimulato(request, c.email, c.user.id);
  expect(await abbonato(request, c.token)).toBe(true);
});

test('webhook Stripe: firma sbagliata rifiutata, evento ripetuto senza doppio abbonamento', async ({ request }) => {
  const c = await registra(request, 'client');
  const s = await (await request.post(`${API}/__e2e/stripe/sessione-finta`, { params: { email: c.email } })).json();

  const falso = await request.fetch(`${API}/api/stripe/webhook`, {
    method: 'POST', failOnStatusCode: false, data: '{"type":"checkout.session.completed"}',
    headers: { 'Content-Type': 'application/json', 'Stripe-Signature': 't=1,v1=00' },
  });
  expect(falso.status()).toBe(400);

  for (let i = 0; i < 2; i++) {
    const w = await webhookCheckoutCompletato(request, s.session_id, c.user.id);
    expect(w.status()).toBe(200);
  }
  // L'esportazione GDPR elenca tutti gli abbonamenti dell'utente: ne deve esistere uno solo attivo.
  const exp = await chiama(request, 'GET', '/gdpr/export', { token: c.token });
  expect(exp.data.subscriptions.filter((x) => x.status === 'active')).toHaveLength(1);
  expect(await abbonato(request, c.token)).toBe(true);
});
