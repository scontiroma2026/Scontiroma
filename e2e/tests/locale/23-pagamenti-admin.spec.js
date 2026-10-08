// Registro manuale dei pagamenti dei commercianti: solo l'admin lo vede; non addebita nulla.
const { test, expect, chiama, registra, admin, loginNelBrowser } = require('../fixtures');
const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_MASTER_PASSWORD } = require('../env');

const BASE = '/admin/pagamenti-commercianti';
const giorno = (delta) => {
  const d = new Date(Date.now() + delta * 86400000);
  return d.toISOString().slice(0, 10);
};

async function apriPagamenti(page) {
  await loginNelBrowser(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto('/admin');
  await page.getByTestId('master-pw').fill(ADMIN_MASTER_PASSWORD);
  await page.getByTestId('master-submit').click();
  await page.getByTestId('tab-payments').click();
  await expect(page.getByTestId('admin-pagamenti')).toBeVisible();
  await expect(page.getByTestId('pagamenti-riepilogo')).toBeVisible();
}

test('admin: registra un pagamento, lo vede tra gli attivi e i rinnovi, lo annulla', async ({ page, request }) => {
  const nome = `Forno Pagamenti ${Date.now()}`;
  const m = await registra(request, 'merchant', { shop_name: nome });
  const id = m.user.id;
  page.on('dialog', (d) => d.accept());
  await apriPagamenti(page);

  await expect(page.getByTestId('pagamenti-nota')).toHaveText('Registro manuale: qui annoti i pagamenti che incassi. Non addebita nulla.');
  const riga = page.getByTestId(`commerciante-${id}`);
  await expect(riga).toContainText(nome);
  await expect(page.getByTestId(`stato-${id}`)).toHaveText('In prova');
  await expect(page.getByTestId(`ultimo-${id}`)).toHaveText('nessuno');
  const prima = Number(await page.getByTestId('riep-numero').innerText());
  const attiviPrima = Number(await page.getByTestId('riep-stato-attivo').innerText());

  // Registra un pagamento: importo suggerito, bonifico, periodo che finisce tra 10 giorni
  await page.getByTestId(`registra-${id}`).click();
  await expect(page.getByTestId('pag-dialog')).toBeVisible();
  await expect(page.getByTestId('pag-importo')).toHaveValue('4,99');
  await page.getByTestId('pag-metodo').selectOption('bonifico');
  await page.getByTestId('pag-dal').fill(giorno(-20));
  await page.getByTestId('pag-al').fill(giorno(10));
  await page.getByTestId('pag-nota').fill('Pagamento di prova');
  await page.getByTestId('pag-salva').click();
  await expect(page.getByTestId('pag-dialog')).toBeHidden();

  await expect(page.getByTestId(`stato-${id}`)).toHaveText('Attivo');
  await expect(page.getByTestId(`ultimo-${id}`)).toContainText('4,99 €');
  await expect(page.getByTestId(`rinnovo-${id}`)).toBeVisible(); // tra i rinnovi dei prossimi 30 giorni
  await expect(page.getByTestId(`registra-rinnovo-${id}`)).toBeVisible();
  await expect(page.getByTestId('riep-numero')).toHaveText(String(prima + 1));
  await expect(page.getByTestId('riep-stato-attivo')).toHaveText(String(attiviPrima + 1));
  const pag = page.locator('[data-testid^="pagamento-"]', { hasText: nome }).first();
  await expect(pag).toContainText('4,99 €');
  await expect(pag).toContainText('Bonifico');
  await expect(pag).toContainText('Nota: Pagamento di prova');

  // Il commerciante non nota nulla: nessuna email, offerta e account come prima
  const lista = await chiama(request, 'GET', '/auth/me', { token: m.token });
  expect(lista.status).toBe(200);

  // Esporta CSV
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('pag-esporta').click()]);
  expect(download.suggestedFilename()).toBe('pagamenti-commercianti.csv');

  // Annulla: il pagamento resta nel registro come annullato, il commerciante torna in prova
  await pag.getByTestId(/annulla-pagamento-/).click();
  await expect(pag.getByTestId(/pagamento-annullato-/)).toHaveText('Annullato');
  await expect(pag.getByTestId(/annulla-pagamento-/)).toHaveCount(0);
  await expect(page.getByTestId(`stato-${id}`)).toHaveText('In prova');
  await expect(page.getByTestId(`rinnovo-${id}`)).toHaveCount(0);
  await expect(page.getByTestId('riep-numero')).toHaveText(String(prima));
});

test('admin: modifica rapida, scaduto da rinnovare e registrazione da lì', async ({ page, request }) => {
  const nome = `Bar Scaduti ${Date.now()}`;
  const m = await registra(request, 'merchant', { shop_name: nome });
  const id = m.user.id;
  await apriPagamenti(page);

  await page.getByTestId(`modifica-${id}`).click();
  await page.getByTestId('mod-rinnovo').fill(giorno(-3));
  await page.getByTestId('mod-note').fill('Paga a fine mese');
  await page.getByTestId('mod-salva').click();
  await expect(page.getByTestId('mod-dialog')).toBeHidden();
  await expect(page.getByTestId(`stato-${id}`)).toHaveText('Scaduto');
  await expect(page.getByTestId(`commerciante-${id}`)).toContainText('Paga a fine mese');
  await expect(page.getByTestId(`scaduto-${id}`)).toBeVisible();

  await page.getByTestId(`registra-scaduto-${id}`).click();
  await page.getByTestId('pag-importo').fill('5');
  await page.getByTestId('pag-metodo').selectOption('contanti');
  await page.getByTestId('pag-salva').click();
  await expect(page.getByTestId(`stato-${id}`)).toHaveText('Attivo');
  await expect(page.getByTestId(`scaduto-${id}`)).toHaveCount(0);

  await page.getByTestId(`modifica-${id}`).click();
  await page.getByTestId('mod-stato').selectOption('sospeso');
  await page.getByTestId('mod-salva').click();
  await expect(page.getByTestId(`stato-${id}`)).toHaveText('Sospeso');

  // Sospeso solo nel registro: l'account del commerciante funziona come prima
  expect((await chiama(request, 'GET', '/auth/me', { token: m.token })).status).toBe(200);
});

test('commerciante e cliente non vedono la scheda e non raggiungono i dati', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  const c = await registra(request, 'client');
  const a = await admin(request);
  for (const [chi, token] of [['commerciante', m.token], ['cliente', c.token]]) {
    for (const [metodo, url, body] of [['GET', `${BASE}/commercianti`], ['GET', BASE], ['GET', `${BASE}/esporta.csv`], ['GET', `${BASE}/riepilogo`],
      ['POST', BASE, { merchant_id: m.user.id, metodo: 'bonifico' }], ['PATCH', `${BASE}/commercianti/${m.user.id}`, { note: 'x' }]]) {
      const r = await chiama(request, metodo, url, { token, body });
      expect([401, 403], `${chi} ${metodo} ${url}`).toContain(r.status);
    }
  }
  expect((await chiama(request, 'GET', `${BASE}/commercianti`, { token: a.token, headers: a.headers })).status).toBe(200);

  for (const utente of [m, c]) {
    await loginNelBrowser(page, utente.email, utente.password);
    await page.goto('/admin');
    await page.waitForTimeout(800);
    await expect(page.getByTestId('tab-payments')).toHaveCount(0);
    await expect(page.getByTestId('admin-pagamenti')).toHaveCount(0);
  }
});
