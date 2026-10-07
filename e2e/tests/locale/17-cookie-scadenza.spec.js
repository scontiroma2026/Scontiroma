// La scelta sui cookie vale 6 mesi, come scritto nella Cookie Policy: poi il banner ricompare.
const { test, expect } = require('../fixtures');

const sceltaDi = (giorni) => {
  localStorage.setItem('sr_cookie_consent', JSON.stringify({
    version: 1, action: 'reject_all', prefs: { essential: true, functional: false, marketing: false },
    timestamp: new Date(Date.now() - giorni * 24 * 60 * 60 * 1000).toISOString(),
  }));
};

test('cookie: una scelta di 1 mese fa vale ancora', async ({ page }) => {
  await page.addInitScript(sceltaDi, 30);
  await page.goto('/');
  await page.waitForTimeout(1500);
  await expect(page.getByTestId('cookie-banner')).toHaveCount(0);
});

test('cookie: dopo 6 mesi il banner chiede di nuovo', async ({ page }) => {
  await page.addInitScript(sceltaDi, 200);
  await page.goto('/');
  await expect(page.getByTestId('cookie-banner')).toBeVisible();
  await page.getByTestId('cookie-reject').click();
  await expect(page.getByTestId('cookie-banner')).toHaveCount(0);
});
