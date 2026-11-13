// Iscrizione del negozio in 2 passi e offerte pronte alla prima offerta (mossa 2, 13/11).
const { test, expect, PASSWORD, unico, registra, loginNelBrowser } = require('../fixtures');

test.use({ viewport: { width: 390, height: 844 } });

test('iscrizione negozio: il passo 1 chiede solo i dati essenziali e non si salta', async ({ page }) => {
  await page.goto('/register?role=merchant');
  await expect(page.getByTestId('reg-passo')).toContainText('Passo 1 di 2');
  // Nel passo 1 non ci sono i dati dell'attività né i consensi
  await expect(page.getByTestId('reg-partita-iva')).toHaveCount(0);
  await expect(page.getByTestId('legal-accept')).toHaveCount(0);
  await expect(page.getByTestId('reg-whatsapp')).toHaveAttribute('href', /^https:\/\/wa\.me\/393522473526/);
  // Senza i campi obbligatori resta al passo 1
  await page.getByTestId('reg-avanti').click();
  await expect(page.getByTestId('reg-passo')).toContainText('Passo 1 di 2');
  await page.getByTestId('reg-name').fill('Luca');
  await page.getByTestId('reg-email').fill(unico('passi'));
  await page.getByTestId('reg-password').fill(PASSWORD);
  await page.getByTestId('reg-shop').fill('Bottega dei passi');
  await page.getByTestId('reg-category').selectOption('Pizzeria');
  await page.getByTestId('reg-avanti').click();
  await expect(page.getByTestId('reg-passo')).toContainText('Passo 2 di 2');
  await expect(page.getByTestId('reg-partita-iva')).toBeVisible();
  await expect(page.getByTestId('legal-specific')).toBeVisible();
  // Tornando indietro i dati restano
  await page.getByTestId('reg-indietro').click();
  await expect(page.getByTestId('reg-shop')).toHaveValue('Bottega dei passi');
  // Nessuno scroll orizzontale a 390 px
  const eccesso = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(eccesso).toBeLessThanOrEqual(0);
});

test('prima offerta: un\'offerta pronta riempie i testi ma non i prezzi', async ({ page, request }) => {
  const m = await registra(request, 'merchant', { category: 'Pizzeria' });
  await loginNelBrowser(page, m.email, m.password);
  await page.goto('/merchant/discount');
  await expect(page.getByTestId('offerte-pronte')).toBeVisible();
  await page.getByTestId('offerta-pronta-pizza-bibita').click();
  await expect(page.getByTestId('disc-title')).toHaveValue('Pizza + bibita');
  await expect(page.getByTestId('disc-description')).not.toHaveValue('');
  await expect(page.getByTestId('disc-terms')).not.toHaveValue('');
  await expect(page.getByTestId('disc-original')).toHaveValue('');
  await expect(page.getByTestId('disc-discounted')).toHaveValue('');
  // L'offerta valida per tutti c'è sempre
  await expect(page.getByTestId('offerta-pronta-benvenuto')).toBeVisible();
});
