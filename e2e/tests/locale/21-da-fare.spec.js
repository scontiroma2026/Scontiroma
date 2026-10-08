// Dashboard commerciante: scheda «Da fare» e data di scadenza nella pillola dell'offerta.
const { test, expect, API, chiama, registra, creaOffertaApprovata, loginNelBrowser } = require('../fixtures');

test.use({ viewport: { width: 390, height: 844 } });

// Piccola foto (1 pixel) per l'offerta, così non manca la foto
const FOTO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const fineMese = () => {
  // Data di oggi a Roma, come fa il server
  const [g, m, a] = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date()).split('/');
  const ultimo = new Date(Number(a), Number(m), 0).getDate();
  return `${String(ultimo).padStart(2, '0')}/${m}`;
};

async function autenticatoreVirtuale(page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true },
  });
}

const troppoPiccoli = (page, sel) => page.evaluate((s) => [...document.querySelectorAll(s)]
  .filter((e) => e.getBoundingClientRect().height < 43.5).map((e) => Math.round(e.getBoundingClientRect().height)), sel);

test('Da fare: negozio incompleto, voci con collegamento, poi scompare e resta il messaggio positivo', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  await creaOffertaApprovata(request, m.token, { title: `Da fare e2e ${Date.now()}`, image_url: FOTO });
  await autenticatoreVirtuale(page);
  await loginNelBrowser(page, m.email, m.password);
  await page.goto('/merchant/dashboard');

  // Pillola con la scadenza reale (fine del mese in corso)
  await expect(page.getByTestId('stato-offerta')).toHaveText(`Offerta visibile ai clienti fino al ${fineMese()}`);

  // Negozio incompleto: descrizione, orari, Face ID (la foto c'è, l'offerta del mese dopo non è ancora aperta)
  const card = page.getByTestId('da-fare');
  await expect(card).toBeVisible();
  await expect(page.getByTestId('da-fare-descrizione')).toBeVisible();
  await expect(page.getByTestId('da-fare-orari')).toBeVisible();
  await expect(page.getByTestId('da-fare-faceid')).toBeVisible();
  await expect(page.getByTestId('da-fare-foto')).toHaveCount(0);
  await expect(page.getByTestId('da-fare-ok')).toHaveCount(0);
  expect(await troppoPiccoli(page, '[data-testid^=da-fare-]')).toEqual([]);
  await page.screenshot({ path: process.env.E2E_SHOT_DIR ? `${process.env.E2E_SHOT_DIR}/dopo-incompleto.png` : undefined, fullPage: true }).catch(() => {});

  // Descrizione: il collegamento porta alla scheda giusta; salvando la voce sparisce
  await page.getByTestId('da-fare-descrizione').click();
  await expect(page).toHaveURL(/#negozio$/);
  await page.getByTestId('shop-description-input').fill('Cucina romana fatta in casa, nel cuore del quartiere.');
  await page.getByTestId('shop-description-save').click();
  await expect(page.getByTestId('da-fare-descrizione')).toHaveCount(0);

  // Orari
  await page.getByTestId('orari-0-0-apre').fill('08:00');
  await page.getByTestId('orari-salva').click();
  await expect(page.getByTestId('da-fare-orari')).toHaveCount(0);

  // Face ID dal collegamento della voce
  await page.getByTestId('da-fare-faceid').click();
  await expect(page).toHaveURL(/setup-security\?da=account/);
  const completa = page.waitForResponse((r) => r.url().endsWith('/api/webauthn/register/complete'));
  await page.getByTestId('enroll-biometric-btn').click();
  expect((await completa).status()).toBe(200);
  await page.goto('/merchant/dashboard');

  // Tutto a posto: messaggio positivo, nessun elenco
  await expect(page.getByTestId('da-fare-ok')).toContainText('Tutto a posto');
  await expect(page.getByTestId('da-fare').locator('ul')).toHaveCount(0);
  await page.screenshot({ path: process.env.E2E_SHOT_DIR ? `${process.env.E2E_SHOT_DIR}/dopo-completo.png` : undefined, fullPage: true }).catch(() => {});
});

test('Da fare: senza offerta e con offerta senza foto', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  await loginNelBrowser(page, m.email, m.password);
  await page.goto('/merchant/dashboard');
  await expect(page.getByTestId('stato-offerta')).toHaveText('Nessuna offerta pubblicata');
  await expect(page.getByTestId('da-fare-offerta')).toBeVisible();
  await page.getByTestId('da-fare-offerta').click();
  await expect(page).toHaveURL(/\/merchant\/discount/);

  // Offerta in revisione, senza foto: la voce c'è, senza data nella pillola
  const body = { title: `Senza foto e2e ${Date.now()}`, description: 'Descrizione di prova.', original_price: 40, discounted_price: 20, image_url: '', image_urls: [] };
  const c = await chiama(request, 'POST', '/merchants/me/discount', { token: m.token, body });
  expect(c.status, JSON.stringify(c.data)).toBe(200);
  await page.goto('/merchant/dashboard');
  await expect(page.getByTestId('stato-offerta')).toHaveText('Offerta in revisione');
  await expect(page.getByTestId('da-fare-offerta')).toHaveCount(0);
  await expect(page.getByTestId('da-fare-foto')).toBeVisible();
  await page.getByTestId('da-fare-foto').click();
  await expect(page).toHaveURL(/\/merchant\/discount/);

  // Con la foto la voce sparisce
  const c2 = await chiama(request, 'POST', '/merchants/me/discount', { token: m.token, body: { ...body, image_url: FOTO } });
  expect(c2.status, JSON.stringify(c2.data)).toBe(200);
  await page.goto('/merchant/dashboard');
  await expect(page.getByTestId('da-fare')).toBeVisible();
  await expect(page.getByTestId('da-fare-foto')).toHaveCount(0);
});

test('Da fare: il server vecchio senza data non rompe la pillola', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  await creaOffertaApprovata(request, m.token);
  await loginNelBrowser(page, m.email, m.password);
  // Risposta senza valid_until, come quella di prima
  await page.route(`${API}/api/merchants/me/discount`, async (route) => {
    const r = await route.fetch();
    const j = await r.json();
    delete j.discount.valid_until;
    await route.fulfill({ response: r, json: j });
  });
  await page.goto('/merchant/dashboard');
  await expect(page.getByTestId('stato-offerta')).toHaveText('Offerta visibile ai clienti');
});

test('Da fare: «Non adesso» nasconde la voce facoltativa del Face ID', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  await creaOffertaApprovata(request, m.token, { title: `Non adesso e2e ${Date.now()}`, image_url: FOTO });
  await autenticatoreVirtuale(page);
  await loginNelBrowser(page, m.email, m.password);
  await page.goto('/merchant/dashboard');
  await expect(page.getByTestId('da-fare-faceid')).toBeVisible();
  await page.getByTestId('da-fare-faceid-non-adesso').click();
  await expect(page.getByTestId('da-fare-faceid')).toHaveCount(0);
  // Le altre voci restano, e dopo un ricaricamento la voce non ricompare
  await expect(page.getByTestId('da-fare-descrizione')).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('da-fare-descrizione')).toBeVisible();
  await expect(page.getByTestId('da-fare-faceid')).toHaveCount(0);
});
