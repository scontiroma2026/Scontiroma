// Nome e cognome completi dei clienti: li vede solo l'admin (Registro Frodi, Feedback App, Log completo, Referral QR);
// il commerciante continua a vedere nome + iniziale («Giulia P.»).
const { test, expect, chiama, registra, creaOffertaApprovata, loginNelBrowser } = require('../fixtures');
const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_MASTER_PASSWORD } = require('../env');

test.use({ viewport: { width: 390, height: 844 } });

test('admin: nome e cognome interi dei clienti negli elenchi; il commerciante vede solo «Nome C.»', async ({ page, request }) => {
  const sigla = `${Date.now()}`.slice(-6);
  const cognome = `Cognomeprova${sigla}`;
  const nome = `Giulia ${cognome}`;
  const m = await registra(request, 'merchant');
  const o1 = await creaOffertaApprovata(request, m.token, { title: `Nome1 ${sigla}` });
  const c = await registra(request, 'client', { name: nome });

  // Il commerciante conferma il riscatto; riaprire lo stesso QR finisce nel registro frodi («Codice già utilizzato»)
  const red = await chiama(request, 'POST', `/redemptions/create/${o1.id}`, { token: c.token });
  expect(red.status).toBe(200);
  const tk = await chiama(request, 'GET', `/redemptions/${red.data.redemption.id}/token`, { token: c.token });
  const payload = `${tk.data.code}.${tk.data.slot}.${tk.data.token}`;
  const ok = await chiama(request, 'POST', '/redemptions/verify', { token: m.token, body: { code: payload } });
  expect(ok.status).toBe(200);
  expect(ok.data.redemption.client_name).toBe('Giulia C.');          // al commerciante: nome + iniziale
  expect(JSON.stringify(ok.data)).not.toContain(cognome);
  const di_nuovo = await chiama(request, 'GET', '/qr/verify', { params: { token: payload } });
  expect(di_nuovo.data).toMatchObject({ valid: false, reason: 'Codice già utilizzato' });
  expect(JSON.stringify(di_nuovo.data)).not.toContain(cognome);

  const miei = await chiama(request, 'GET', '/merchants/me/redemptions', { token: m.token });
  expect(JSON.stringify(miei.data)).not.toContain(cognome);

  const fb = await chiama(request, 'POST', '/app-feedback', { token: c.token, body: { stars: 5, comment: `Ottima ${sigla}` } });
  expect(fb.status).toBe(200);

  // Pagina del commerciante: solo il nome breve
  await loginNelBrowser(page, m.email, m.password);
  await page.goto('/merchant/dashboard');
  await expect(page.locator('body')).not.toContainText(cognome);

  // Admin
  await loginNelBrowser(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto('/admin');
  await page.getByTestId('master-pw').fill(ADMIN_MASTER_PASSWORD);
  await page.getByTestId('master-submit').click();

  await page.getByTestId('tab-fraud').click();
  await page.getByTestId('fraud-search').fill(cognome);
  const riga = page.locator('[data-testid^="fraud-client-"]', { hasText: nome });
  await expect(riga).toHaveCount(1);
  await expect(riga).toContainText(c.email);

  await page.getByTestId('tab-log').click();
  await expect(page.getByRole('cell', { name: nome }).first()).toBeVisible();

  // Feedback App (solo admin): nome intero accanto all'email
  await page.getByTestId('tab-appfeedback').click();
  await expect(page.getByText(`Ottima ${sigla}`)).toBeVisible();
  await expect(page.locator('body')).toContainText(`${nome} · ${c.email}`);
});
