// Conferma dell'email dei clienti (i commercianti no), con l'interruttore ACCESO.
// Gli altri test girano con l'interruttore spento (server_e2e.py): qui lo si accende per questo file
// e lo si rispegne alla fine. Il token arriva solo per email: in prova lo si legge da /__e2e/token-conferma.
const { test, expect, API, PASSWORD, unico, chiama, login } = require('../fixtures');

test.describe.configure({ mode: 'serial' });

async function interruttore(request, acceso) {
  const r = await request.post(`${API}/__e2e/conferma-email-obbligatoria`, { params: { acceso: String(acceso) } });
  expect(r.status()).toBe(200);
}
async function tokenConferma(request, email) {
  const t = await request.get(`${API}/__e2e/token-conferma`, { params: { email } });
  expect(t.status()).toBe(200);
  return (await t.json()).token;
}

test.beforeAll(async ({ request }) => { await interruttore(request, true); });
test.afterAll(async ({ request }) => { await interruttore(request, false); });

async function iscriviCliente(page, email) {
  await page.goto('/register');
  await page.getByTestId('reg-first-name').fill('Giulia');
  await page.getByTestId('reg-last-name').fill('Prova');
  await page.getByTestId('reg-email').fill(email);
  await page.getByTestId('reg-password').fill(PASSWORD);
  await page.getByTestId('legal-accept').click();
  await page.getByTestId('reg-submit').click();
}

test('iscrizione cliente: messaggio, niente accesso, link dall\'email, poi accesso', async ({ page, request }) => {
  const email = unico('conferma');
  await iscriviCliente(page, email);
  await expect(page.getByTestId('register-conferma-testo')).toHaveText("Ti abbiamo mandato un'email: tocca il link per confermare il tuo account.");
  await expect(page).not.toHaveURL(/setup-security/);

  // Non può accedere finché non conferma: messaggio chiaro e offerta di rimandare l'email
  const bloccato = await login(request, email, PASSWORD);
  expect(bloccato.status).toBe(403);
  expect(bloccato.data.detail.code).toBe('email_non_confermata');
  await page.goto('/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('use-pw-btn').click();
  await page.getByTestId('login-password').fill(PASSWORD);
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('login-non-confermato')).toContainText('Devi ancora confermare il tuo account');
  await expect(page.getByTestId('login-rimanda-btn')).toBeVisible();
  const alt = await page.getByTestId('login-rimanda-btn').boundingBox();
  expect(alt.height).toBeGreaterThanOrEqual(44);

  // «Rimanda l'email»: arriva un link nuovo, il vecchio non vale più
  const vecchio = await tokenConferma(request, email);
  await page.getByTestId('login-rimanda-btn').click();
  await expect(page.getByTestId('login-rimanda-esito')).toBeVisible();
  const nuovo = await tokenConferma(request, email);
  expect(nuovo).not.toBe(vecchio);
  await page.goto(`/conferma-email?token=${encodeURIComponent(vecchio)}`);
  await expect(page.getByTestId('conferma-errore')).toContainText('Link non valido');

  // Il link nuovo conferma
  await page.goto(`/conferma-email?token=${encodeURIComponent(nuovo)}`);
  await expect(page.getByTestId('conferma-ok')).toContainText('Iscrizione completata!');
  await expect(page.getByTestId('conferma-ok')).toContainText('Ora puoi accedere');
  await page.getByTestId('conferma-accedi').click();
  await expect(page).toHaveURL(/\/login/);
  expect((await login(request, email, PASSWORD)).status).toBe(200);

  // Monouso: riaprire lo stesso link dà un messaggio chiaro e il pulsante per rimandare
  await page.goto(`/conferma-email?token=${encodeURIComponent(nuovo)}`);
  await expect(page.getByTestId('conferma-errore')).toContainText('già stato usato');
  await expect(page.getByTestId('conferma-rimanda-btn')).toBeVisible();
});

test('link non valido: messaggio chiaro e «Rimanda l\'email» con la risposta uguale per ogni indirizzo', async ({ page }) => {
  await page.goto('/conferma-email?token=token-inventato');
  await expect(page.getByTestId('conferma-errore')).toContainText('Link non valido');
  await page.getByTestId('conferma-rimanda-email').fill(unico('sconosciuta'));
  await page.getByTestId('conferma-rimanda-btn').click();
  await expect(page.getByTestId('conferma-rimanda-esito')).toContainText('Se c\'è un account da confermare');
});

test('i commercianti non devono confermare l\'email', async ({ page, request }) => {
  const email = unico('negozio');
  const r = await chiama(request, 'POST', '/auth/register', { body: {
    email, password: PASSWORD, name: 'Luca', role: 'merchant', legal_accepted: true, legal_specific_accepted: true,
    shop_name: 'Negozio di prova', zone: 'Garbatella', category: 'Ristorante', phone: '+39 06 0000000', address: "Via dell'Esempio 1, Roma" } });
  expect(r.status).toBe(200);
  expect(r.data.access_token).toBeTruthy();
  expect(r.data.confirmation_required).toBeUndefined();
  expect((await login(request, email, PASSWORD)).status).toBe(200);
});
