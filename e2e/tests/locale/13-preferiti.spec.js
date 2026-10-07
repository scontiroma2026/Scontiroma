// Negozi preferiti: il cliente tocca il cuore, ritrova l'offerta in «Preferiti» e può chiedere
// (o togliere) l'avviso via email. Chi non ha fatto l'accesso viene invitato ad accedere.
const { test, expect, chiama, registra, creaOffertaApprovata, loginNelBrowser } = require('../fixtures');

test('preferiti: cuore sull\'offerta, vista «Preferiti» e avvisi via email', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  const offerta = await creaOffertaApprovata(request, m.token, { title: `Preferita ${Date.now()}` });
  const c = await registra(request, 'client');
  await loginNelBrowser(page, c.email, c.password);

  await page.goto(`/discounts/${offerta.id}`);
  const cuore = page.getByTestId(`preferito-${m.user.id}`);
  await cuore.click();
  await expect(cuore).toHaveAttribute('data-pieno', '1');

  await page.goto('/discounts');
  await page.getByTestId('vista-preferiti-tab').click();
  await expect(page).toHaveURL(/vista=preferiti/);
  const vista = page.getByTestId('vista-preferiti');
  await expect(vista.getByTestId(`discount-card-${offerta.id}`)).toBeVisible();

  await page.getByTestId('avvisi-si').click();
  await expect(page.getByTestId('avvisi-attivi')).toBeVisible();
  const r = await chiama(request, 'GET', '/me/preferiti', { token: c.token });
  expect(r.data.avvisi).toBe(true);

  await page.getByTestId('avvisi-no').click();
  await expect(page.getByTestId('avvisi-banner')).toBeVisible();

  // Togliendo il cuore l'offerta sparisce dalla vista
  await vista.getByTestId(`preferito-${m.user.id}`).click();
  await expect(page.getByTestId('preferiti-vuoti')).toBeVisible();
});

test('preferiti: senza accesso il cuore invita ad accedere', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  const offerta = await creaOffertaApprovata(request, m.token);
  await page.goto(`/discounts/${offerta.id}`);
  await page.getByTestId(`preferito-${m.user.id}`).click();
  await expect(page.getByText('Accedi come cliente per salvare i tuoi negozi preferiti.')).toBeVisible();
  await expect(page.getByTestId('vista-preferiti-tab')).toHaveCount(0);
});
