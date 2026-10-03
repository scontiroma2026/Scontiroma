// Pannello admin: azioni scritte per esteso, stato dell'offerta vero, «Sospendi» che nasconde davvero il negozio.
const { test, expect, chiama, registra, loginNelBrowser } = require('../fixtures');
const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_MASTER_PASSWORD } = require('../env');

async function apriNegozi(page) {
  await loginNelBrowser(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto('/admin');
  await page.getByTestId('master-pw').fill(ADMIN_MASTER_PASSWORD);
  await page.getByTestId('master-submit').click();
  await page.getByTestId('tab-merchants').click();
}

test('admin: offerta in attesa con pulsanti scritti, approva, sospendi e riattiva il negozio', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  const c = await chiama(request, 'POST', '/merchants/me/discount', { token: m.token, body: {
    title: `Admin e2e ${Date.now()}`, description: 'Descrizione di prova.', original_price: 30, discounted_price: 15 } });
  expect(c.status).toBe(200);
  const did = c.data.discount.id;
  page.on('dialog', (d) => d.accept());
  await apriNegozi(page);

  const card = page.getByTestId(`admin-merchant-${m.user.id}`);
  await expect(card.getByTestId(/admin-offerta-stato-/)).toHaveText('In attesa di approvazione');
  await expect(card.getByTestId(`inline-approve-${did}`)).toHaveText(/Approva/);
  await expect(card.getByTestId(`inline-reject-${did}`)).toHaveText(/Rifiuta/);

  await card.getByTestId(`inline-approve-${did}`).click();
  await expect(card.getByTestId(/admin-offerta-stato-/)).toHaveText('Approvata');
  expect((await chiama(request, 'GET', '/discounts')).data.discounts.map((d) => d.id)).toContain(did);

  await card.getByTestId(/admin-merchant-toggle-/).click();
  await expect(card.getByTestId(/admin-merchant-stato-/)).toHaveText('Negozio sospeso');
  expect((await chiama(request, 'GET', '/discounts')).data.discounts.map((d) => d.id)).not.toContain(did);
  const cl = await registra(request, 'client');
  expect((await chiama(request, 'POST', `/redemptions/create/${did}`, { token: cl.token })).status).toBe(403);

  await card.getByTestId(/admin-merchant-toggle-/).click();
  await expect(card.getByTestId(/admin-merchant-stato-/)).toHaveText('Negozio attivo');
  expect((await chiama(request, 'GET', '/discounts')).data.discounts.map((d) => d.id)).toContain(did);
});
