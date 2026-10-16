// Scadenza dell'offerta: nessun rinnovo automatico. Con la finestra "mese prossimo" aperta
// il commerciante vede il banner arancione, sceglie "Non rinnovo" e può annullare.
const { test, expect, chiama, registra, admin, creaOffertaApprovata, loginNelBrowser } = require('../fixtures');

test('banner di scadenza: "Non rinnovo" e annulla', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  await creaOffertaApprovata(request, m.token);
  const a = await admin(request);
  const apri = await chiama(request, 'POST', '/admin/next-offers/window-override', { token: a.token, headers: a.headers, body: { open: true } });
  expect(apri.status).toBe(200);
  try {
    await loginNelBrowser(page, m.email, m.password);
    await page.goto('/merchant/dashboard');
    const banner = page.getByTestId('renewal-banner');
    await expect(banner).toHaveAttribute('data-state', 'expiring');
    await expect(banner).toContainText('non si rinnova da sola');
    await expect(page.getByTestId('renewal-upload-btn')).toBeVisible();

    page.once('dialog', (d) => d.accept());
    const scelta = page.waitForResponse((r) => r.url().endsWith('/api/merchants/me/no-renew'));
    await page.getByTestId('renewal-no-renew-btn').click();
    expect((await scelta).status()).toBe(200);
    await expect(banner).toHaveAttribute('data-state', 'no-renew');

    const st = await chiama(request, 'GET', '/merchants/me/renewal-status', { token: m.token });
    expect(st.data.no_renew).toBe(true);

    // Con «Non rinnovo» il caricamento del mese dopo si spegne (scheda grigia, modulo bloccato)...
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
  } finally {
    await chiama(request, 'POST', '/admin/next-offers/window-override', { token: a.token, headers: a.headers, body: { open: null } });
  }
});
