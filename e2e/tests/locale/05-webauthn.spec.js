// Face ID / impronta (WebAuthn) con l'autenticatore virtuale di Chromium.
// Il server di test usa WEBAUTHN_ORIGIN con la barra finale ("http://localhost:3000/"),
// la stessa configurazione che in produzione faceva fallire la registrazione con
// "Unexpected client data origin ..., expected .../".
const { test, expect, API, chiama, registra, loginNelBrowser } = require('../fixtures');

async function autenticatoreVirtuale(page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true },
  });
}

test('Face ID: attivazione dal sito e accesso biometrico', async ({ page, request }) => {
  const c = await registra(request, 'client');
  await autenticatoreVirtuale(page);
  await loginNelBrowser(page, c.email, c.password);
  await page.goto('/setup-security');
  // Niente PIN (tolto il 03/10): il Face ID si attiva subito
  const completa = page.waitForResponse((r) => r.url().endsWith('/api/webauthn/register/complete'));
  await page.getByTestId('enroll-biometric-btn').click();
  const r = await completa;
  expect(r.status(), await r.text()).toBe(200);
  await expect(page.getByText('Face ID attivato')).toBeVisible();

  // Esci e rientra solo con il Face ID
  await page.evaluate(async (api) => { await fetch(`${api}/api/auth/logout`, { method: 'POST', credentials: 'include' }); }, API);
  await page.goto('/login');
  await page.getByTestId('login-email').fill(c.email);
  const accesso = page.waitForResponse((r) => r.url().includes('/api/webauthn/login/'));
  await page.getByTestId('face-id-btn').click();
  const a = await accesso;
  expect(a.status(), `${a.url()} ${await a.text()}`).toBe(200);
  await expect(page).toHaveURL(/\/discounts/);
});

test('Face ID: con due richieste di registrazione vale la sfida più recente', async ({ page, request }) => {
  // Doppio tocco sul pulsante o un nuovo tentativo dopo un annullamento: il server crea
  // due sfide. La verifica deve usare quella con cui il telefono ha firmato (l'ultima).
  const c = await registra(request, 'client');
  await autenticatoreVirtuale(page);
  await loginNelBrowser(page, c.email, c.password);
  const esito = await page.evaluate(async (api) => {
    const b64uToBuf = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (ch) => ch.charCodeAt(0));
    const bufToB64u = (b) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const post = (p, body) => fetch(`${api}/api${p}`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
    await (await post('/webauthn/register/begin')).json(); // prima sfida, abbandonata
    const o = await (await post('/webauthn/register/begin')).json(); // seconda sfida
    const cred = await navigator.credentials.create({ publicKey: {
      ...o, challenge: b64uToBuf(o.challenge), user: { ...o.user, id: b64uToBuf(o.user.id) },
      excludeCredentials: (o.excludeCredentials || []).map((x) => ({ ...x, id: b64uToBuf(x.id) })),
    } });
    const r = await post('/webauthn/register/complete', { credential: {
      id: cred.id, rawId: bufToB64u(cred.rawId), type: cred.type, clientExtensionResults: {},
      response: { clientDataJSON: bufToB64u(cred.response.clientDataJSON), attestationObject: bufToB64u(cred.response.attestationObject), transports: cred.response.getTransports() },
    } });
    return { status: r.status, body: await r.text() };
  }, API);
  expect(esito.status, esito.body).toBe(200);
});

test('Sicurezza: un cliente già registrato attiva il Face ID dal suo account', async ({ page, request }) => {
  // Cliente "vecchio": nessun Face ID, non passa più dalla registrazione.
  const c = await registra(request, 'client');
  await autenticatoreVirtuale(page);
  await loginNelBrowser(page, c.email, c.password);

  await page.goto('/dashboard');
  await page.getByTestId('security-link').click();
  await expect(page).toHaveURL(/\/setup-security\?da=account/);
  await expect(page.getByTestId('setup-security-page')).toContainText('Face ID');
  await expect(page.getByTestId('setup-security-page')).not.toContainText('PIN');
  await expect(page.getByTestId('bio-status')).toHaveCount(0);

  // Face ID
  const completa = page.waitForResponse((r) => r.url().endsWith('/api/webauthn/register/complete'));
  await page.getByTestId('enroll-biometric-btn').click();
  const r = await completa;
  expect(r.status(), await r.text()).toBe(200);
  await expect(page.getByTestId('bio-status')).toContainText('1 dispositivo');
  await page.getByTestId('back-account').click();
  await expect(page).toHaveURL(/\/dashboard$/);

  // Rientro con il Face ID appena attivato
  await page.evaluate(async (api) => { await fetch(`${api}/api/auth/logout`, { method: 'POST', credentials: 'include' }); }, API);
  await page.goto('/login');
  await page.getByTestId('login-email').fill(c.email);
  const accesso = page.waitForResponse((r) => r.url().includes('/api/webauthn/login/'));
  await page.getByTestId('face-id-btn').click();
  const a = await accesso;
  expect(a.status(), `${a.url()} ${await a.text()}`).toBe(200);
  await expect(page).toHaveURL(/\/discounts/);
});

test('i dati riservati dell\'account non escono dal server', async ({ request }) => {
  const c = await registra(request, 'client');
  await chiama(request, 'POST', '/auth/forgot', { body: { email: c.email } });
  const me = (await chiama(request, 'GET', '/auth/me', { token: c.token })).data.user;
  for (const k of ['password_hash', 'pin_hash', 'reset_token', 'reset_expires', 'webauthn_credentials', 'webauthn_user_id']) {
    expect(me, k).not.toHaveProperty(k);
  }
  expect(me).toMatchObject({ biometric_devices: 0 });
  expect(me).not.toHaveProperty('pin_set');
});
