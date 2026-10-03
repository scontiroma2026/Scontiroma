// Fase di lancio (CLIENT_SUBSCRIPTION_REQUIRED spento, come in produzione): Sconti Roma è
// gratuito per i clienti. Nessuna pagina può avviare un pagamento, il server rifiuta nuovi
// checkout Stripe e PayPal e i webhook firmati vengono accettati ma restano senza effetti.
// Con l'interruttore acceso il comportamento a pagamento è provato in
// backend/tests/test_interruttore_abbonamento.py.
const { test, expect, API, chiama, registra, loginNelBrowser, webhookCheckoutCompletato } = require('../fixtures');

test('il server dichiara la fase di lancio gratuita', async ({ request }) => {
  const r = await chiama(request, 'GET', '/config/public');
  expect(r.status).toBe(200);
  expect(r.data.client_subscription_required).toBe(false);
});

test('dopo il PIN il cliente va agli sconti, non al pagamento', async ({ page, request }) => {
  const c = await registra(request, 'client');
  await loginNelBrowser(page, c.email, c.password);
  await page.goto('/setup-security');
  await page.getByTestId('skip-security').click();
  await expect(page).toHaveURL(/\/discounts/);
});

test('pagina abbonamento e account: "Gratis durante la fase di lancio", nessun pagamento', async ({ page, request }) => {
  const c = await registra(request, 'client');
  await loginNelBrowser(page, c.email, c.password);
  await page.goto('/subscribe');
  await expect(page.getByTestId('launch-free')).toContainText('Gratis durante la fase di lancio');
  await expect(page.getByTestId('subscribe-btn')).toHaveCount(0);
  await expect(page.getByText(/€\s*2,99/)).toHaveCount(0);
  await page.goto('/dashboard');
  await expect(page.getByTestId('launch-free')).toContainText('Gratis durante la fase di lancio');
  await expect(page.getByTestId('activate-btn')).toHaveCount(0);
});

test('il server rifiuta nuovi pagamenti; il pagamento finto non esiste più', async ({ request }) => {
  const c = await registra(request, 'client');
  const stripe = await chiama(request, 'POST', '/payments/checkout', { token: c.token, body: {} });
  expect(stripe.status).toBe(409);
  const paypal = await chiama(request, 'POST', '/paypal/activate', { token: c.token, body: { subscription_id: 'I-PROVA' } });
  expect(paypal.status).toBe(409);
  expect((await chiama(request, 'GET', '/paypal/config')).data.enabled).toBe(false);
  const finto = await chiama(request, 'POST', '/subscription/subscribe', { token: c.token, body: { plan: 'monthly' } });
  expect([404, 405]).toContain(finto.status);
  const me = await chiama(request, 'GET', '/subscription/me', { token: c.token });
  expect(me.data).toMatchObject({ active: false, required: false });
});

test('webhook Stripe: firma sbagliata rifiutata, evento firmato accettato senza effetti', async ({ request }) => {
  const c = await registra(request, 'client');
  const s = await (await request.post(`${API}/__e2e/stripe/sessione-finta`, { params: { email: c.email } })).json();

  const falso = await request.fetch(`${API}/api/stripe/webhook`, {
    method: 'POST', failOnStatusCode: false, data: '{"type":"checkout.session.completed"}',
    headers: { 'Content-Type': 'application/json', 'Stripe-Signature': 't=1,v1=00' },
  });
  expect(falso.status()).toBe(400);

  const w = await webhookCheckoutCompletato(request, s.session_id, c.user.id);
  expect(w.status()).toBe(200);
  const exp = await chiama(request, 'GET', '/gdpr/export', { token: c.token });
  expect(exp.data.subscriptions).toHaveLength(0);
});

test('pannello admin: "Economics" e "Abbonati" nascoste nella fase di lancio', async ({ page }) => {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_MASTER_PASSWORD } = require('../env');
  await loginNelBrowser(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto('/admin');
  await page.getByTestId('master-pw').fill(ADMIN_MASTER_PASSWORD);
  await page.getByTestId('master-submit').click();
  await expect(page.getByTestId('tab-analytics')).toBeVisible();
  await expect(page.getByTestId('tab-traffic')).toBeVisible();
  await expect(page.getByTestId('tab-economics')).toHaveCount(0);
  await expect(page.getByTestId('tab-subscribers')).toHaveCount(0);
});

test('assistenza: fase di lancio gratuita, nessun prezzo, annullamento solo per chi ha un abbonamento', async ({ page }) => {
  await page.goto('/support');
  const testo = page.getByTestId('support-launch-free');
  await expect(testo).toContainText('Abbonamento e recesso');
  await expect(testo).toContainText('durante la fase di lancio Sconti Roma è gratuito e non serve nessun abbonamento');
  await expect(testo).toContainText('Se hai un abbonamento attivo (per esempio di prova)');
  await expect(page.getByTestId('row-info')).toContainText('Problemi di accesso, uso dei QR, domande sugli sconti');
  await expect(page.getByTestId('row-info')).not.toContainText('pagamento');
  await expect(page.getByText(/€\s*\d|per sempre/i)).toHaveCount(0);
});

test('home: nessun prezzo 2,99 €', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('cta-start')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('2,99');
  await expect(page.getByText('Membership')).toHaveCount(0);
});

test('home: niente fascia dei quartieri né sconti dei commercianti', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('cta-start')).toBeVisible();
  await expect(page.getByText('Gli sconti del momento')).toHaveCount(0);
  await expect(page.getByText(/★ GARBATELLA/)).toHaveCount(0);
  await expect(page.locator('[data-testid^="discount-card"]')).toHaveCount(0);
});
