// QR: il cliente abbonato genera il QR dal sito, il commerciante lo scansiona (pagina di
// conferma), la seconda scansione è bloccata e il QR scade dopo la finestra di 20 secondi.
const { test, expect, API, chiama, registra, creaOffertaApprovata, abbonamentoSimulato, loginNelBrowser } = require('../fixtures');

const FINESTRA = 20; // secondi, ROTATION_WINDOW_SEC nel server

test('QR: generazione, scansione del commerciante, doppia scansione bloccata, scadenza dopo 20 s', async ({ page, request }) => {
  test.setTimeout(150_000);
  const m = await registra(request, 'merchant');
  const offerta = await creaOffertaApprovata(request, m.token, { title: `QR e2e ${Date.now()}` });
  const c = await registra(request, 'client');

  // Senza abbonamento il QR non si genera
  const senza = await chiama(request, 'POST', `/redemptions/create/${offerta.id}`, { token: c.token });
  expect(senza.status).toBe(402);
  await abbonamentoSimulato(request, c.email, c.user.id);

  // 1. Il cliente apre l'offerta e mostra il QR
  await loginNelBrowser(page, c.email, c.password);
  await page.goto(`/discounts/${offerta.id}`);
  await page.getByRole('button', { name: /Mostra QR Code|Genera QR/ }).click();
  const dialog = page.getByTestId('qr-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Il QR cambia ogni 20 secondi');
  await expect(dialog.locator('svg, canvas, img').first()).toBeVisible();

  // 2. Stesso codice lato API: finestra di 20 secondi
  const red = await chiama(request, 'POST', `/redemptions/create/${offerta.id}`, { token: c.token });
  expect(red.status).toBe(200);
  const tk = await chiama(request, 'GET', `/redemptions/${red.data.redemption.id}/token`, { token: c.token });
  expect(tk.status).toBe(200);
  expect(tk.data.window_sec).toBe(FINESTRA);
  expect(tk.data.expires_in).toBeGreaterThan(0);
  expect(tk.data.expires_in).toBeLessThanOrEqual(FINESTRA);
  const payload = `${tk.data.code}.${tk.data.slot}.${tk.data.token}`;
  expect(tk.data.qr_value).toContain(`/qr/${payload}`);

  // 3. Il commerciante inquadra il QR: si apre la pagina di conferma
  await page.goto(tk.data.qr_value);
  await expect(page.getByRole('heading', { name: /ABBONAMENTO\s*VALIDO/i })).toBeVisible();
  await expect(page.getByText(offerta.title)).toBeVisible();

  // 4. Seconda scansione dello stesso codice: bloccata
  const doppia = await chiama(request, 'POST', '/redemptions/verify', { token: m.token, body: { code: payload } });
  expect(doppia.status).toBe(400);
  expect(doppia.data.detail).toMatch(/già utilizzato/);
  // Un secondo utilizzo nello stesso mese non si può creare (1 volta al mese)
  const altro = await chiama(request, 'POST', `/redemptions/create/${offerta.id}`, { token: c.token });
  expect(altro.status).toBe(409);

  // 5. Scadenza: passate due finestre da 20 s il vecchio QR non vale più
  const scade = (tk.data.slot + 2) * FINESTRA * 1000 + 500;
  await page.waitForTimeout(Math.max(0, scade - Date.now()));
  const vecchio = await request.get(`${API}/api/qr/verify`, { params: { token: payload } });
  expect(await vecchio.json()).toMatchObject({ valid: false, reason: 'QR code scaduto' });
});

test('QR manomesso: rifiutato', async ({ request }) => {
  const r = await request.get(`${API}/api/qr/verify`, { params: { token: `ABC123.${Math.floor(Date.now() / 20000)}.deadbeef` } });
  const d = await r.json();
  expect(d.valid).toBe(false);
  expect(d.reason).toMatch(/manomesso|non trovato/);
});
