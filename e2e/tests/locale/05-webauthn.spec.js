// Face ID / impronta (WebAuthn) con l'autenticatore virtuale di Chromium.
// Il server di test usa WEBAUTHN_ORIGIN con la barra finale ("http://localhost:3000/"),
// la stessa configurazione che in produzione faceva fallire la registrazione con
// "Unexpected client data origin ..., expected .../".
const { test, expect, API, registra, loginNelBrowser } = require('../fixtures');

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
  // Passo 1 della pagina: il PIN (il Face ID si sblocca dopo)
  await page.getByTestId('pin-new').fill('482916');
  await page.getByTestId('pin-confirm').fill('482916');
  await page.getByTestId('pin-save').click();
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
