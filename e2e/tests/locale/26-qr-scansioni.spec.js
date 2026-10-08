// Conteggio delle scansioni del QR della locandina: link corto /q/<codice>, solo un numero per negozio e giorno.
const { test, expect, chiama, registra, creaOffertaApprovata, loginNelBrowser } = require('../fixtures');
const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_MASTER_PASSWORD } = require('../env');

async function codiceDi(request, id) {
  const r = await chiama(request, 'GET', `/negozio/${id}`);
  expect(r.status).toBe(200);
  return r.data.negozio.qr_code;
}

test('/q/<codice>: mostra la pagina del negozio e il contatore sale (una volta anche se si ricarica)', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  const offerta = await creaOffertaApprovata(request, m.token, { title: `Menù scansione ${Date.now()}` });
  const cod = await codiceDi(request, m.user.id);
  expect(cod).toMatch(/^[2-9A-HJKMNP-Z]{4,6}$/);

  await page.goto(`/q/${cod}`);
  await expect(page.getByTestId('negozio-qr-nome')).toHaveText('Negozio di prova');
  await expect(page.getByTestId(`discount-card-${offerta.id}`)).toBeVisible();

  const conta = async () => (await chiama(request, 'GET', '/merchants/me/referrals', { token: m.token })).data;
  let r = await conta();
  expect(r.scansioni_totali).toBe(1);
  expect(r.scansioni_30_giorni).toBe(1);
  expect(r.referral_url).toContain(`/q/${cod}`);

  // Ricaricando la stessa pagina il conteggio non sale
  await page.reload();
  await expect(page.getByTestId('negozio-qr-nome')).toBeVisible();
  r = await conta();
  expect(r.scansioni_totali).toBe(1);

  // Il codice sconosciuto mostra l'errore pulito; il vecchio /n/<id> funziona ancora e non conta
  await page.goto('/q/ZZZZZ');
  await expect(page.getByTestId('negozio-qr-errore')).toBeVisible();
  await page.goto(`/n/${m.user.id}`);
  await expect(page.getByTestId('negozio-qr-nome')).toBeVisible();
  expect((await conta()).scansioni_totali).toBe(1);
});

test('commerciante: vede solo il numero delle sue scansioni nella dashboard', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  const cod = await codiceDi(request, m.user.id);
  await page.goto(`/q/${cod}`);
  await expect(page.getByTestId('negozio-qr-nome')).toBeVisible();
  await loginNelBrowser(page, m.email, m.password);
  await page.goto('/merchant/dashboard');
  await expect(page.getByTestId('referral-scansioni')).toContainText('1 scansioni negli ultimi 30 giorni');
});

test('admin: nella scheda Referral QR vede scansioni, iscrizioni e sconti usati', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  const cod = await codiceDi(request, m.user.id);
  await page.goto(`/q/${cod}`);
  await expect(page.getByTestId('negozio-qr-nome')).toBeVisible();

  await loginNelBrowser(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto('/admin');
  await page.getByTestId('master-pw').fill(ADMIN_MASTER_PASSWORD);
  await page.getByTestId('master-submit').click();
  await page.getByTestId('tab-referrals').click();
  await expect(page.getByTestId('admin-percorso-qr')).toBeVisible();
  const riga = page.getByTestId(`percorso-${m.user.id}`);
  await expect(riga.locator('[data-col="scansioni-30"]')).toHaveText('1');
  await expect(riga.locator('[data-col="scansioni-tot"]')).toHaveText('1');
  await expect(riga.locator('[data-col="iscrizioni-tot"]')).toHaveText('0');
  await expect(riga.locator('[data-col="sconti-tot"]')).toHaveText('0');
  await expect(page.getByTestId('percorso-totale')).toBeVisible();
});

test('locandina: il QR punta al link corto /q/<codice>', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  const cod = await codiceDi(request, m.user.id);
  await page.goto(`/locandina?ref=${m.user.id}`);
  await expect(page.getByTestId('locandina-qr')).toHaveAttribute('data-qr-url', new RegExp(`/q/${cod}$`));
  // La locandina generica (senza negozio) resta com'era
  await page.goto('/locandina');
  await expect(page.getByTestId('locandina-qr')).toHaveAttribute('data-qr-url', /\/register$/);
});
