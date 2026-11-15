// Scadenza dell'offerta: nessun rinnovo automatico. La durata la sceglie il negozio; negli ultimi giorni
// vede il banner arancione, può prolungarla con un tocco, scegliere «Non rinnovo» e annullare.
const { test, expect, chiama, registra, creaOffertaApprovata, loginNelBrowser } = require('../fixtures');

// «2026-11-20» -> «20/11» (come la pillola della dashboard)
const breve = (iso) => { const [, m, g] = iso.split('-'); return `${g}/${m}`; };

test('banner di scadenza: "Non rinnovo" e annulla', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  await creaOffertaApprovata(request, m.token, { duration_days: 5 });   // ultimi giorni: il banner compare subito
  await loginNelBrowser(page, m.email, m.password);
  await page.goto('/merchant/dashboard');
  const banner = page.getByTestId('renewal-banner');
  await expect(banner).toHaveAttribute('data-state', 'expiring');
  await expect(banner).toContainText('non si rinnova da sola');
  await expect(banner).toContainText('mancano 5 giorni');
  await expect(page.getByTestId('renewal-upload-btn')).toBeVisible();

  page.once('dialog', (d) => d.accept());
  const scelta = page.waitForResponse((r) => r.url().endsWith('/api/merchants/me/no-renew'));
  await page.getByTestId('renewal-no-renew-btn').click();
  expect((await scelta).status()).toBe(200);
  await expect(banner).toHaveAttribute('data-state', 'no-renew');

  const st = await chiama(request, 'GET', '/merchants/me/renewal-status', { token: m.token });
  expect(st.data.no_renew).toBe(true);

  // Con «Non rinnovo» la prossima offerta si spegne (scheda grigia, modulo bloccato)...
  await expect(page.getByTestId('next-offer-no-renew')).toBeVisible();
  await expect(page.getByTestId('next-offer-cta')).toHaveAttribute('aria-disabled', 'true');
  await page.goto('/merchant/discount?tab=next');
  await expect(page.getByTestId('banner-next-no-renew')).toBeVisible();
  await expect(page.getByTestId('disc-submit')).toBeDisabled();

  // ...e si riaccende se cambia idea
  await page.goto('/merchant/dashboard');
  await page.getByTestId('renewal-undo-btn').click();
  await expect(banner).toHaveAttribute('data-state', 'expiring');
  await expect(page.getByTestId('next-offer-cta')).not.toHaveAttribute('aria-disabled', 'true');
  await page.goto('/merchant/discount?tab=next');
  await expect(page.getByTestId('banner-next-new')).toBeVisible();
  await expect(page.getByTestId('disc-submit')).toBeEnabled();
});

test('«Prolunga»: un tocco, stessa offerta, nuova data senza nuova approvazione', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  const o = await creaOffertaApprovata(request, m.token, { duration_days: 5 });
  const prima = (await chiama(request, 'GET', '/merchants/me/discount', { token: m.token })).data.discount;
  expect(prima.days_left).toBe(5);

  await loginNelBrowser(page, m.email, m.password);
  await page.goto('/merchant/dashboard');
  await expect(page.getByTestId('stato-offerta')).toHaveText(`Offerta visibile ai clienti fino al ${breve(prima.valid_until)}`);
  await page.getByTestId('renewal-extend-btn').click();
  await expect(page.getByTestId('renewal-extend-scelte')).toContainText('non serve una nuova approvazione');
  const fatta = page.waitForResponse((r) => r.url().endsWith('/api/merchants/me/discount/extend'));
  await page.getByTestId('renewal-extend-7').click();
  expect((await fatta).status()).toBe(200);

  const dopo = (await chiama(request, 'GET', '/merchants/me/discount', { token: m.token })).data.discount;
  expect(dopo.days_left).toBe(12);
  expect(dopo.approval_status).toBe('approved');
  expect(dopo.valid_until > prima.valid_until).toBe(true);
  // la pagina si ricarica: data nuova nella pillola, e mancando più di 7 giorni l'avviso sparisce
  await expect(page.getByTestId('stato-offerta')).toHaveText(`Offerta visibile ai clienti fino al ${breve(dopo.valid_until)}`);
  await expect(page.getByTestId('renewal-banner')).toHaveCount(0);

  // i clienti vedono fino a quando vale
  await page.goto(`/discounts/${o.id}`);
  await expect(page.getByTestId('valida-fino')).toContainText('Valida fino al');
});

test('durata scelta nel modulo: una settimana, poi offerta bloccata e «Prossima offerta» sempre aperta', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  await loginNelBrowser(page, m.email, m.password);
  await page.goto('/merchant/discount');
  await expect(page.getByTestId('disc-form')).toHaveAttribute('data-loaded', '1');
  await page.getByTestId('disc-title').fill(`Durata e2e ${Date.now()}`);
  await page.getByTestId('disc-description').fill('Descrizione di prova.');
  await page.getByTestId('disc-original').fill('20');
  await page.getByTestId('disc-discounted').fill('12');
  // predefinito 1 mese; lo sconto non può essere «senza scadenza»
  await expect(page.getByTestId('disc-durata-30')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('disc-durata-aperta')).toHaveCount(0);
  await page.getByTestId('disc-durata-7').click();
  await expect(page.getByTestId('disc-durata-scelta')).toContainText('1 settimana (7 giorni)');
  const inviata = page.waitForResponse((r) => r.url().endsWith('/api/merchants/me/discount') && r.request().method() === 'POST');
  await page.getByTestId('disc-submit').click();
  expect((await inviata).status()).toBe(200);
  await expect(page.getByTestId('banner-pending')).toBeVisible();

  const d = (await chiama(request, 'GET', '/merchants/me/discount', { token: m.token })).data.discount;
  expect(d.duration_days).toBe(7);
  const { admin } = require('../fixtures');
  const a = await admin(request);
  expect((await chiama(request, 'POST', `/admin/discounts/${d.id}/approve`, { token: a.token, headers: a.headers })).status).toBe(200);

  // online: modulo bloccato fino alla fine; la prossima offerta si può preparare subito (niente finestra)
  await page.goto('/merchant/discount');
  await expect(page.getByTestId('banner-locked')).toContainText('Offerta online fino al');
  await expect(page.getByTestId('disc-submit')).toBeDisabled();
  await page.getByTestId('offer-tab-next').click();
  await expect(page.getByTestId('banner-next-new')).toContainText('quando finisce quella di adesso');
  await expect(page.getByTestId('disc-submit')).toBeEnabled();
  await page.getByTestId('disc-title').fill('Prossima e2e');
  const prossima = page.waitForResponse((r) => r.url().endsWith('/api/merchants/me/next-discount') && r.request().method() === 'POST');
  await page.getByTestId('disc-submit').click();
  expect((await prossima).status()).toBe(200);
  await expect(page.getByTestId('banner-next-pending')).toBeVisible();
});
