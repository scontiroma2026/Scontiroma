// L'admin vede le statistiche di ogni negozio sempre (solo numeri); il commerciante, con meno di 3 clienti, no.
const { test, expect, chiama, registra, loginNelBrowser } = require('../fixtures');
const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_MASTER_PASSWORD } = require('../env');

test.use({ viewport: { width: 390, height: 844 } });

test('admin: scheda «Statistiche del negozio» nella tab Negozi, senza nomi', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  await loginNelBrowser(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto('/admin');
  await page.getByTestId('master-pw').fill(ADMIN_MASTER_PASSWORD);
  await page.getByTestId('master-submit').click();
  await page.getByTestId('tab-merchants').click();
  const riquadro = page.getByTestId(`admin-statistiche-${m.user.id}`);
  await expect(riquadro).toBeVisible();
  await page.getByTestId(`stat-show-${m.user.id}`).click();
  await expect(page.getByTestId(`stat-utilizzi-${m.user.id}`)).toHaveText('0');
  await expect(page.getByTestId(`stat-clienti-${m.user.id}`)).toHaveText('0');
  await expect(riquadro).toContainText('Ultimi 6 mesi');
  await expect(riquadro).not.toContainText('@');
  await page.getByTestId(`stat-hide-${m.user.id}`).click();
  await expect(page.getByTestId(`stat-show-${m.user.id}`)).toBeVisible();
});
