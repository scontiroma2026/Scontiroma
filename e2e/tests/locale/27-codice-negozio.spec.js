// Codice del negozio (4 cifre al banco): chi inquadra il QR vede solo «Codice valido» (offerta e negozio), il nome
// del cliente compare solo dopo il codice giusto; «Ricorda su questo telefono» (90 giorni) e cambio codice che lo invalida;
// blocco dopo 5 errori; il commerciante già collegato non scrive nulla.
const { test, expect, API, chiama, registra, creaOffertaApprovata, loginNelBrowser } = require('../fixtures');

test.use({ viewport: { width: 390, height: 844 } });

const SHOT = process.env.E2E_SHOT_DIR;
const foto = (page, nome) => (SHOT ? page.screenshot({ path: `${SHOT}/${nome}.png` }).catch(() => {}) : Promise.resolve());

// Un cliente nuovo con il suo QR appena generato (il QR cambia ogni 20 s: si usa subito).
async function nuovoQr(request, offerta) {
  const c = await registra(request, 'client');
  const red = await chiama(request, 'POST', `/redemptions/create/${offerta.id}`, { token: c.token });
  expect(red.status, JSON.stringify(red.data)).toBe(200);
  const tk = await chiama(request, 'GET', `/redemptions/${red.data.redemption.id}/token`, { token: c.token });
  expect(tk.status).toBe(200);
  return { client: c, id: red.data.redemption.id, code: tk.data.code, url: `/qr/${tk.data.code}.${tk.data.slot}.${tk.data.token}`,
    token: `${tk.data.code}.${tk.data.slot}.${tk.data.token}` };
}

async function stato(request, merchantToken, redCode) {
  const r = await chiama(request, 'GET', '/merchants/me/redemptions', { token: merchantToken });
  return (r.data.redemptions.find((x) => x.code === redCode) || {}).status;
}

const sbagliato = (codice) => (codice === '0000' ? '1111' : '0000');

test('codice del negozio: anonimo, ricorda questo telefono, cambio codice', async ({ page, request }) => {
  test.setTimeout(150_000);
  const m = await registra(request, 'merchant');
  const offerta = await creaOffertaApprovata(request, m.token, { title: `Codice negozio ${Date.now()}` });
  const sc = await chiama(request, 'GET', '/merchants/me/shop-code', { token: m.token });
  expect(sc.status).toBe(200);
  const codice = sc.data.code;
  expect(codice).toMatch(/^\d{4}$/);

  // 1. Anonimo: la pagina dice «Codice valido», titolo e negozio, ma non il cliente
  const q1 = await nuovoQr(request, offerta);
  const pubblico = await request.get(`${API}/api/qr/verify`, { params: { token: q1.token } });
  const pj = await pubblico.json();
  expect(pj).toMatchObject({ valid: true, discount_title: offerta.title, shop_name: 'Negozio di prova' });
  expect(JSON.stringify(pj)).not.toMatch(/Giulia|Prova|client/);
  await page.goto(q1.url);
  const pagina = page.getByTestId('qr-codice-valido');
  await expect(pagina.getByRole('heading', { name: 'Codice valido' })).toBeVisible();
  await expect(pagina).toContainText(offerta.title);
  await expect(pagina).not.toContainText('Giulia');
  const input = page.getByTestId('shop-code-input');
  await expect(input).toHaveAttribute('inputmode', 'numeric');
  const applica = page.getByTestId('shop-code-apply');
  expect((await applica.boundingBox()).height).toBeGreaterThanOrEqual(44);
  expect((await input.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await foto(page, '01-codice-valido');

  // 2. Codice sbagliato: messaggio chiaro, il QR non viene consumato, niente nome
  await input.fill(sbagliato(codice));
  await applica.click();
  await expect(page.getByTestId('shop-code-error')).toContainText('Codice del negozio errato');
  await expect(page.getByTestId('shop-code-error')).toContainText('Ti restano 4 tentativi');
  await expect(page.locator('body')).not.toContainText('Giulia');
  await foto(page, '02-codice-errato');
  expect(await stato(request, m.token, q1.code)).toBe('pending');

  // 3. Codice giusto + «Ricorda su questo telefono»: sconto valido col nome breve; sul telefono resta solo l'attestato
  await input.fill(codice);
  await page.getByTestId('shop-code-remember').check();
  await applica.click();
  await expect(page.getByRole('heading', { name: /SCONTO\s*VALIDO/i })).toBeVisible();
  await expect(page.getByText('Giulia P.')).toBeVisible();
  await expect(page.getByTestId('telefono-salvato')).toBeVisible();
  await foto(page, '03-sconto-valido');
  expect(await stato(request, m.token, q1.code)).toBe('redeemed');
  const salvato = await page.evaluate(() => localStorage.getItem('sr_codice_negozio_v1'));
  expect(salvato).toBeTruthy();
  expect(salvato).not.toContain(`"${codice}"`);
  expect(JSON.parse(salvato)[pj.shop_id]).toMatch(/^eyJ/); // attestato firmato, non il codice

  // 4. Telefono ricordato: basta «Applica sconto», senza riscrivere il codice
  const q2 = await nuovoQr(request, offerta);
  await page.goto(q2.url);
  await expect(page.getByTestId('telefono-ricordato')).toBeVisible();
  await expect(page.getByTestId('shop-code-input')).toHaveCount(0);
  await foto(page, '04-telefono-ricordato');
  await page.getByTestId('shop-code-apply').click();
  await expect(page.getByRole('heading', { name: /SCONTO\s*VALIDO/i })).toBeVisible();
  await expect(page.getByText('Giulia P.')).toBeVisible();

  // 5. «Dimentica questo telefono»: torna il campo del codice
  const q3 = await nuovoQr(request, offerta);
  await page.goto(q3.url);
  await page.getByTestId('shop-code-forget').click();
  await expect(page.getByTestId('shop-code-input')).toBeVisible();
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('sr_codice_negozio_v1')))[pj.shop_id]).toBeUndefined();
  await page.getByTestId('shop-code-input').fill(codice);
  await page.getByTestId('shop-code-remember').check();
  await page.getByTestId('shop-code-apply').click();
  await expect(page.getByRole('heading', { name: /SCONTO\s*VALIDO/i })).toBeVisible();

  // 6. Il titolare cambia il codice: il telefono ricordato smette di valere e il vecchio codice non funziona
  const nuovo = await chiama(request, 'POST', '/merchants/me/shop-code/regenerate', { token: m.token });
  expect(nuovo.status).toBe(200);
  expect(nuovo.data.code).not.toBe(codice);
  const q4 = await nuovoQr(request, offerta);
  await page.goto(q4.url);
  await expect(page.getByTestId('telefono-ricordato')).toBeVisible(); // il telefono non lo sa ancora
  await page.getByTestId('shop-code-apply').click();
  await expect(page.getByTestId('shop-code-error')).toContainText('è cambiato');
  await expect(page.getByTestId('shop-code-input')).toBeVisible();
  await foto(page, '05-codice-cambiato');
  expect(await stato(request, m.token, q4.code)).toBe('pending');
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('sr_codice_negozio_v1')))[pj.shop_id]).toBeUndefined();
  await page.getByTestId('shop-code-input').fill(codice === nuovo.data.code ? sbagliato(codice) : codice); // il vecchio
  await page.getByTestId('shop-code-apply').click();
  await expect(page.getByTestId('shop-code-error')).toContainText('Codice del negozio errato');
  await page.getByTestId('shop-code-input').fill(nuovo.data.code);
  await page.getByTestId('shop-code-apply').click();
  await expect(page.getByRole('heading', { name: /SCONTO\s*VALIDO/i })).toBeVisible();
});

test('codice del negozio: blocco dopo 5 errori', async ({ page, request }) => {
  test.setTimeout(90_000);
  const m = await registra(request, 'merchant');
  const offerta = await creaOffertaApprovata(request, m.token, { title: `Blocco codice ${Date.now()}` });
  const codice = (await chiama(request, 'GET', '/merchants/me/shop-code', { token: m.token })).data.code;
  const q = await nuovoQr(request, offerta);
  for (let i = 0; i < 5; i++) {
    const r = await chiama(request, 'POST', '/qr/redeem', { body: { token: q.token, shop_code: sbagliato(codice) } });
    expect(r.status).toBe(403);
    expect(r.data.error).toBe('wrong_code');
    expect(JSON.stringify(r.data)).not.toMatch(/Giulia/);
  }
  await page.goto(q.url);
  await page.getByTestId('shop-code-input').fill(codice); // anche quello giusto è bloccato
  await page.getByTestId('shop-code-apply').click();
  await expect(page.getByTestId('shop-code-error')).toContainText('Troppi tentativi');
  await foto(page, '06-bloccato');
  expect(await stato(request, m.token, q.code)).toBe('pending');
});

test('codice del negozio: il commerciante collegato non scrive il codice', async ({ page, request }) => {
  test.setTimeout(120_000);
  const m = await registra(request, 'merchant');
  const offerta = await creaOffertaApprovata(request, m.token, { title: `Commerciante collegato ${Date.now()}` });

  // Il QR inquadrato col telefono su cui è collegato: lo sconto si applica da solo
  await loginNelBrowser(page, m.email, m.password);
  const q1 = await nuovoQr(request, offerta);
  await page.goto(q1.url);
  await expect(page.getByRole('heading', { name: /SCONTO\s*VALIDO/i })).toBeVisible();
  await expect(page.getByText('Giulia P.')).toBeVisible();
  await expect(page.getByTestId('shop-code-input')).toHaveCount(0);

  // Scansione dalla sua area (codice scritto a mano): come prima
  const q2 = await nuovoQr(request, offerta);
  await page.goto('/merchant/scan');
  await page.getByTestId('scan-code-input').fill(q2.code);
  await page.getByTestId('scan-verify-btn').click();
  await expect(page.getByTestId('scan-success')).toContainText('Giulia P.');

  // Un altro commerciante collegato non può usare il QR di questo negozio senza codice
  const altro = await registra(request, 'merchant');
  const q3 = await nuovoQr(request, offerta);
  const r = await chiama(request, 'POST', '/qr/redeem', { token: altro.token, body: { token: q3.token } });
  expect(r.status).toBe(403);
  expect(JSON.stringify(r.data)).not.toMatch(/Giulia/);
});

test('codice del negozio: sezione nella dashboard del commerciante', async ({ page, request }) => {
  test.setTimeout(90_000);
  const m = await registra(request, 'merchant');
  await loginNelBrowser(page, m.email, m.password);
  await page.goto('/merchant/dashboard');
  const scheda = page.getByTestId('shop-code-card');
  await expect(scheda).toBeVisible();
  const valore = page.getByTestId('shop-code-value');
  await expect(valore).toHaveText(/^\d{4}$/);
  const prima = (await valore.textContent()).trim();
  expect((await chiama(request, 'GET', '/merchants/me/shop-code', { token: m.token })).data.code).toBe(prima);
  await scheda.scrollIntoViewIfNeeded();
  await foto(page, '07-dashboard-codice');
  await page.getByTestId('shop-code-change').click();
  await foto(page, '08-dashboard-conferma');
  expect((await page.getByTestId('shop-code-confirm').boundingBox()).height).toBeGreaterThanOrEqual(44);
  await page.getByTestId('shop-code-confirm').click();
  await expect(valore).not.toHaveText(prima);
  const dopo = (await valore.textContent()).trim();
  expect((await chiama(request, 'GET', '/merchants/me/shop-code', { token: m.token })).data.code).toBe(dopo);
  // Il codice non esce dal profilo
  const me = await chiama(request, 'GET', '/auth/me', { token: m.token });
  expect(JSON.stringify(me.data)).not.toContain('shop_code');
});

test('codice del negozio: il QR scade mentre si scrive il codice, il permesso breve basta', async ({ page, request }) => {
  test.setTimeout(150_000);
  const m = await registra(request, 'merchant');
  const offerta = await creaOffertaApprovata(request, m.token, { title: `Permesso breve ${Date.now()}` });
  const codice = (await chiama(request, 'GET', '/merchants/me/shop-code', { token: m.token })).data.code;
  const q = await nuovoQr(request, offerta);
  await page.goto(q.url);
  await expect(page.getByTestId('qr-codice-valido')).toBeVisible();
  // La finestra di 20 secondi del QR passa (come in 04-qr: si aspetta davvero)
  const slot = Number(q.token.split('.')[1]);
  await page.waitForTimeout(Math.max(0, (slot + 2) * 20_000 + 1500 - Date.now()));
  // Il QR da solo ormai è scaduto...
  const scaduto = await chiama(request, 'POST', '/qr/redeem', { body: { token: q.token, shop_code: codice } });
  expect(scaduto.data.reason).toBe('QR code scaduto');
  // ...ma la pagina aperta in tempo ha il permesso: serve comunque il codice del negozio
  await page.getByTestId('shop-code-input').fill(sbagliato(codice));
  await page.getByTestId('shop-code-apply').click();
  await expect(page.getByTestId('shop-code-error')).toContainText('Codice del negozio errato');
  await expect(page.getByTestId('qr-codice-valido')).not.toContainText('Giulia');
  await page.getByTestId('shop-code-input').fill(codice);
  await page.getByTestId('shop-code-apply').click();
  await expect(page.getByRole('heading', { name: /SCONTO\s*VALIDO/i })).toBeVisible();
  await expect(page.getByText('Giulia P.')).toBeVisible();
  expect(await stato(request, m.token, q.code)).toBe('redeemed');
  // Senza permesso lo stesso QR non vale più
  const dopo = await chiama(request, 'POST', '/qr/redeem', { body: { token: q.token, shop_code: codice } });
  expect(dopo.status).toBe(400);
});
