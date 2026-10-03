// Account: registrazione (cliente e commerciante), login, password dimenticata,
// limite di tentativi sul login, difesa CSRF basata sull'header Origin.
const { test, expect, API, WEB, PASSWORD, unico, chiama, registra, login } = require('../fixtures');

test('registrazione cliente dal sito', async ({ page, request }) => {
  const email = unico('cliente');
  await page.goto('/register');
  await page.getByTestId('reg-first-name').fill('Giulia');
  await page.getByTestId('reg-last-name').fill('Prova');
  await page.getByTestId('reg-email').fill(email);
  await page.getByTestId('reg-password').fill(PASSWORD);
  await expect(page.getByTestId('reg-submit')).toBeDisabled(); // senza Termini non si parte
  await page.getByTestId('legal-accept').click();
  await page.getByTestId('reg-submit').click();
  await expect(page).toHaveURL(/\/setup-security/);
  const r = await login(request, email, PASSWORD);
  expect(r.status).toBe(200);
  expect(r.data.user.role).toBe('client');
});

test('registrazione commerciante dal sito', async ({ page, request }) => {
  const email = unico('commerciante');
  await page.goto('/register?role=merchant');
  await page.getByTestId('reg-name').fill('Luca');
  await page.getByTestId('reg-email').fill(email);
  await page.getByTestId('reg-password').fill(PASSWORD);
  await page.getByTestId('reg-shop').fill("Osteria dell'Esempio");
  await page.getByTestId('reg-address-input').fill("Via dell'Esempio 1, Roma");
  await page.getByTestId('reg-phone').fill('+39 06 0000000');
  await page.getByTestId('reg-zone').selectOption('Garbatella');
  await page.getByTestId('reg-category').selectOption('Ristorante');
  await page.getByTestId('legal-accept').click();
  await page.getByTestId('reg-submit').click();
  await expect(page).toHaveURL(/\/setup-security/);
  const r = await login(request, email, PASSWORD);
  expect(r.status).toBe(200);
  expect(r.data.user).toMatchObject({ role: 'merchant', shop_name: "Osteria dell'Esempio", zone: 'Garbatella' });
  expect(r.data.user.consents.legal_version).toBeTruthy();
});

test('registrazione senza accettare i Termini: il server rifiuta', async ({ request }) => {
  const r = await chiama(request, 'POST', '/auth/register', { body: { email: unico('noterms'), password: PASSWORD, name: 'X', role: 'client' } });
  expect(r.status).toBe(400);
});

test('login dal sito con password', async ({ page, request }) => {
  const u = await registra(request, 'client');
  await page.goto('/login');
  await page.getByTestId('login-email').fill(u.email);
  await page.getByTestId('use-pw-btn').click();
  await page.getByTestId('login-email-pw').fill(u.email);
  await page.getByTestId('login-password').fill(u.password);
  await page.getByTestId('login-submit').click();
  await expect(page).toHaveURL(/\/discounts/);
});

test('password dimenticata: richiesta dal sito, token dal DB locale, nuova password', async ({ page, request }) => {
  const u = await registra(request, 'client');
  await page.goto('/forgot-password');
  await page.getByTestId('forgot-email').fill(u.email);
  await page.getByTestId('forgot-submit').click();
  await expect(page.getByText(/riceverai a breve un link/i)).toBeVisible();

  // In produzione il token arriva solo per email: qui lo leggiamo dal database locale.
  const t = await request.get(`${API}/__e2e/reset-token`, { params: { email: u.email } });
  expect(t.status()).toBe(200);
  const { token } = await t.json();

  await page.goto(`/reset-password?token=${encodeURIComponent(token)}`);
  await page.getByTestId('reset-token').fill(token);
  await page.getByTestId('reset-pw').fill('nuova-password-e2e');
  await page.getByTestId('reset-pw2').fill('nuova-password-e2e');
  await page.getByTestId('reset-submit').click();
  await expect.poll(async () => (await login(request, u.email, 'nuova-password-e2e')).status).toBe(200);
  expect((await login(request, u.email, u.password)).status).toBe(401);
  // Il token è monouso
  const again = await chiama(request, 'POST', '/auth/reset', { body: { token, new_password: 'altra-password-e2e' } });
  expect(again.status).toBe(400);
});

test('login: dopo 5 tentativi sbagliati l\'account si blocca (429), anche con la password giusta', async ({ request }) => {
  const u = await registra(request, 'client');
  for (let i = 0; i < 5; i++) {
    expect((await login(request, u.email, 'sbagliata-' + i)).status).toBe(401);
  }
  const r = await login(request, u.email, u.password);
  expect(r.status).toBe(429);
  expect(r.data.detail).toMatch(/Troppi tentativi/);
});

test('CSRF: una richiesta da un altro sito viene bloccata, dal nostro sito passa', async ({ request }) => {
  const body = { email: unico('csrf'), password: 'x-sbagliata' };
  const fuori = await chiama(request, 'POST', '/auth/login', { body, headers: { Origin: 'https://sito-malevolo.example' } });
  expect(fuori.status).toBe(403);
  expect(fuori.data.detail).toMatch(/Origine non consentita/);
  const nostro = await chiama(request, 'POST', '/auth/login', { body, headers: { Origin: WEB } });
  expect(nostro.status).toBe(401); // passa il controllo CSRF, poi credenziali sbagliate
  const senza = await chiama(request, 'POST', '/auth/login', { body }); // server-to-server (es. webhook)
  expect(senza.status).toBe(401);
});

test('PIN: dopo 5 tentativi sbagliati la pagina mostra il blocco e disattiva il campo', async ({ page, request }) => {
  const u = await registra(request, 'client');
  expect((await chiama(request, 'POST', '/auth/pin', { token: u.token, body: { pin: '135790' } })).status).toBe(200);
  await page.goto('/login');
  await page.getByTestId('login-email').fill(u.email);
  await page.getByTestId('use-pin-btn').click();
  for (let i = 0; i < 6; i++) {
    await page.getByTestId('pin-input').fill('000000');
    const risposta = page.waitForResponse((r) => r.url().endsWith('/api/auth/pin-login'));
    await page.getByTestId('pin-submit').click();
    if ((await risposta).status() === 429) break;
    await expect(page.getByTestId('pin-input')).toHaveValue(''); // svuotato dopo ogni errore
  }
  await expect(page.getByTestId('pin-locked')).toContainText('PIN bloccato per sicurezza');
  await expect(page.getByTestId('pin-locked')).toContainText(/Riprova tra \d+ minut/);
  await expect(page.getByTestId('pin-input')).toBeDisabled();
  await expect(page.getByTestId('pin-submit')).toBeDisabled();
  // Durante il blocco anche il PIN giusto è rifiutato dal server
  expect((await chiama(request, 'POST', '/auth/pin-login', { body: { email: u.email, pin: '135790' } })).status).toBe(429);
  await page.getByTestId('pin-locked-use-password').click();
  await expect(page.getByTestId('login-password')).toBeVisible();
});

test('PIN: blocco anche per un account senza PIN o un\'email inesistente', async ({ request }) => {
  const senzaPin = (await registra(request, 'client')).email;
  for (const email of [senzaPin, unico('nessuno')]) {
    const esiti = [];
    for (let i = 0; i < 6; i++) esiti.push((await chiama(request, 'POST', '/auth/pin-login', { body: { email, pin: '000000' } })).status);
    expect(esiti).toEqual([401, 401, 401, 401, 401, 429]);
  }
});

test('PIN: la pagina mostra l\'account e "Cambia account" permette di entrare con un altro', async ({ page, request }) => {
  const vecchio = await registra(request, 'client');
  const nuovo = await registra(request, 'client');
  expect((await chiama(request, 'POST', '/auth/pin', { token: vecchio.token, body: { pin: '246801' } })).status).toBe(200);
  // Sul telefono è rimasto l'ultimo account usato (quello nuovo)
  await page.goto('/login');
  await page.evaluate((e) => localStorage.setItem('last_email', e), nuovo.email);
  await page.goto('/login');
  await page.getByTestId('use-pin-btn').click();
  await expect(page.getByTestId('pin-account')).toContainText(nuovo.email);
  await page.getByTestId('switch-account').click();
  await expect(page.getByTestId('login-email')).toHaveValue('');
  expect(await page.evaluate(() => localStorage.getItem('last_email'))).toBeNull();
  await page.getByTestId('login-email').fill(vecchio.email);
  await page.getByTestId('use-pin-btn').click();
  await expect(page.getByTestId('pin-account')).toContainText(vecchio.email);
  await page.getByTestId('pin-input').fill('246801');
  const risposta = page.waitForResponse((r) => r.url().endsWith('/api/auth/pin-login'));
  await page.getByTestId('pin-submit').click();
  expect((await risposta).status()).toBe(200);
  await expect(page).toHaveURL(/\/discounts|\/setup-security/);
});
