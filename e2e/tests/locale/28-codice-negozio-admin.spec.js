// Codice del negozio nel pannello admin: l'admin lo vede solo su richiesta, per un negozio alla volta,
// e può rigenerarlo (il vecchio smette di valere). Non compare nella lista dei negozi.
const { test, expect, chiama, registra, admin, loginNelBrowser } = require('../fixtures');
const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_MASTER_PASSWORD } = require('../env');

test.use({ viewport: { width: 390, height: 844 } });

test('admin: vede il codice del negozio, lo rigenera, il commerciante vede quello nuovo', async ({ page, request }) => {
  const nome = `Forno Codice ${Date.now()}`;
  const m = await registra(request, 'merchant', { shop_name: nome });
  const id = m.user.id;
  const sc = await chiama(request, 'GET', '/merchants/me/shop-code', { token: m.token });
  expect(sc.status).toBe(200);
  const codice = sc.data.code;

  // Mai nelle liste: la lista admin dei negozi non contiene il campo
  const a = await admin(request);
  const lista = await chiama(request, 'GET', '/admin/merchants', { token: a.token, headers: a.headers });
  expect(lista.status).toBe(200);
  expect(JSON.stringify(lista.data)).not.toContain('shop_code');
  // Un commerciante non può leggere il codice di un altro via admin
  const altro = await registra(request, 'merchant');
  expect((await chiama(request, 'GET', `/admin/merchants/${id}/shop-code`, { token: altro.token })).status).toBe(403);

  await loginNelBrowser(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto('/admin');
  await page.getByTestId('master-pw').fill(ADMIN_MASTER_PASSWORD);
  await page.getByTestId('master-submit').click();
  await page.getByTestId('tab-merchants').click();

  const scheda = page.getByTestId(`admin-shopcode-${id}`);
  await expect(scheda).toBeVisible();
  // Nascosto finché l'admin non lo chiede
  await expect(page.getByTestId(`shopcode-value-${id}`)).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(`${codice}`.padStart(4, '0') + ' versione');
  await page.getByTestId(`shopcode-show-${id}`).click();
  await expect(page.getByTestId(`shopcode-value-${id}`)).toHaveText(codice);
  expect((await page.getByTestId(`shopcode-regen-${id}`).boundingBox()).height).toBeGreaterThanOrEqual(44);

  // Rigenera: prima chiede conferma, «Annulla» non cambia nulla
  await page.getByTestId(`shopcode-regen-${id}`).click();
  await page.getByTestId(`shopcode-regen-cancel-${id}`).click();
  await expect(page.getByTestId(`shopcode-value-${id}`)).toHaveText(codice);

  await page.getByTestId(`shopcode-regen-${id}`).click();
  await page.getByTestId(`shopcode-regen-confirm-${id}`).click();
  await expect(page.getByTestId(`shopcode-value-${id}`)).not.toHaveText(codice);
  const nuovo = (await page.getByTestId(`shopcode-value-${id}`).innerText()).trim();
  expect(nuovo).toMatch(/^\d{4}$/);

  // Il commerciante vede il codice nuovo (versione + 1)
  const dopo = await chiama(request, 'GET', '/merchants/me/shop-code', { token: m.token });
  expect(dopo.data.code).toBe(nuovo);
  expect(dopo.data.version).toBe(sc.data.version + 1);

  // «Nascondi» rimette il codice fuori vista
  await page.getByTestId(`shopcode-hide-${id}`).click();
  await expect(page.getByTestId(`shopcode-value-${id}`)).toHaveCount(0);
});
