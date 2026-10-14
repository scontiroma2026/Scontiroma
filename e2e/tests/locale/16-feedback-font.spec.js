// Banner con le stelle dopo 3 minuti di uso e titoli in Fraunces su ogni telefono.
const { test, expect, registra, loginNelBrowser } = require('../fixtures');

// I test partono con il banner già chiuso (fixtures): qui lo riapriamo e fissiamo i secondi già usati
// a ogni caricamento della pagina.
const secondiUsati = (s) => {
  localStorage.removeItem('app_feedback_dismissed_v1');
  localStorage.setItem('app_feedback_secondi_v1', String(s));
};

test('feedback: non compare prima dei 3 minuti', async ({ page, request }) => {
  const c = await registra(request, 'client');
  await page.addInitScript(secondiUsati, 0);
  await loginNelBrowser(page, c.email, c.password);
  await page.goto('/discounts');
  await page.waitForTimeout(6500);
  await expect(page.getByTestId('app-feedback-banner')).toHaveCount(0);
  expect(Number(await page.evaluate(() => localStorage.getItem('app_feedback_secondi_v1')))).toBeGreaterThan(0);
});

test('feedback: dopo 3 minuti compare e si può votare', async ({ page, request }) => {
  const c = await registra(request, 'client');
  await page.addInitScript(secondiUsati, 178);
  await loginNelBrowser(page, c.email, c.password);
  await page.goto('/discounts');
  await expect(page.getByTestId('app-feedback-banner')).toBeVisible({ timeout: 15000 });
  await page.getByTestId('app-feedback-star-5').click();
  await page.getByTestId('app-feedback-submit').click();
  await expect(page.getByTestId('app-feedback-banner')).toHaveCount(0);
});

test('feedback: mai sopra la scansione del commerciante', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  await page.addInitScript(secondiUsati, 400);
  await loginNelBrowser(page, m.email, m.password);
  await page.goto('/merchant/scan');
  await page.waitForTimeout(3000);
  await expect(page.getByTestId('app-feedback-banner')).toHaveCount(0);
});

test('font: i titoli usano Manrope', async ({ page }) => {
  await page.goto('/');
  // La home mostra prima un titolo di attesa e, appena il server risponde, quello vero: l'asserzione
  // si ripete finché il titolo è stabile (prima leggeva il carattere di un elemento già sostituito).
  await expect(page.getByTestId('landing-caricamento')).toHaveCount(0);
  await expect(page.locator('h1').first()).toHaveCSS('font-family', /^"?Manrope/);
});
