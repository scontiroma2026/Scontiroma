// Offerte: il commerciante crea l'offerta dal sito (con foto e "Migliora foto" con Gemini
// simulato), l'admin la approva, l'offerta compare nella home del cliente.
const path = require('path');
const { test, expect, chiama, registra, admin, creaOffertaApprovata, loginNelBrowser } = require('../fixtures');

const FOTO = path.join(__dirname, '..', 'files', 'foto-offerta.jpg');

test('commerciante crea l\'offerta, admin approva, il cliente la vede', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  const titolo = `Menù di pesce e2e ${Date.now()}`;

  // 1. Il commerciante compila il form dal sito
  await loginNelBrowser(page, m.email, m.password);
  await page.goto('/merchant/discount');
  await page.getByTestId('disc-title').fill(titolo);
  await page.getByTestId('disc-description').fill('Antipasto di mare, primo e secondo di pesce del giorno.');
  await page.getByTestId('disc-original').fill('40');
  await page.getByTestId('disc-discounted').fill('20');
  await page.locator('input[type=file]').first().setInputFiles(FOTO);
  await page.getByTestId('photo-add-confirm').click();
  await expect(page.getByTestId('photo-tile-0')).toBeVisible();

  // 2. "Migliora foto": Gemini è simulato da server_e2e.py e restituisce un PNG fisso
  const risposta = page.waitForResponse((r) => r.url().endsWith('/api/ai/enhance-image'));
  await page.getByTestId('photo-ai-enhance-0').click();
  const r = await risposta;
  expect(r.status()).toBe(200);
  await expect(page.getByTestId('photo-tile-0').locator('img')).toHaveAttribute('src', /^data:image\/png;base64,/);

  await page.getByTestId('disc-validity-info').fill('Solo mercoledì e venerdì');
  await page.getByTestId('disc-uses-1').click();
  // Prima la risposta del server (esito certo), poi l'avviso a comparsa, che sparisce da solo.
  const salvataggio = page.waitForResponse((r) => r.url().endsWith('/api/merchants/me/discount') && r.request().method() === 'POST');
  await page.getByTestId('disc-submit').click();
  const salvato = await salvataggio;
  expect(salvato.status(), await salvato.text()).toBe(200);
  await expect(page.getByText(/Attende approvazione/i).first()).toBeVisible();

  // 3. Prima dell'approvazione non è pubblica
  const pubblichePrima = await chiama(request, 'GET', '/discounts');
  expect(pubblichePrima.data.discounts.map((d) => d.title)).not.toContain(titolo);

  // 4. L'admin la trova tra quelle in attesa e la approva
  const a = await admin(request);
  const pending = await chiama(request, 'GET', '/admin/discounts/pending', { token: a.token, headers: a.headers });
  expect(pending.status).toBe(200);
  const lista = pending.data.discounts || pending.data.items || pending.data;
  const offerta = lista.find((d) => d.title === titolo);
  expect(offerta, 'offerta in attesa di approvazione').toBeTruthy();
  expect(offerta).toMatchObject({ original_price: 40, discounted_price: 20, validity_info: 'Solo mercoledì e venerdì', max_uses_per_month: 1 });
  const ok = await chiama(request, 'POST', `/admin/discounts/${offerta.id}/approve`, { token: a.token, headers: a.headers });
  expect(ok.status).toBe(200);

  // 5. Il cliente la vede nella home degli sconti, con la foto migliorata
  //    (stessa finestra: il login del cliente sostituisce i cookie del commerciante)
  const c = await registra(request, 'client');
  await loginNelBrowser(page, c.email, c.password);
  await page.goto('/discounts');
  await expect(page.getByText(titolo)).toBeVisible();
  await page.getByText(titolo).click();
  await expect(page).toHaveURL(new RegExp(`/discounts/${offerta.id}`));
  await expect(page.getByText('€20.00').first()).toBeVisible();
});

test('"Migliora foto" senza essere commerciante: rifiutato', async ({ request }) => {
  const c = await registra(request, 'client');
  const r = await chiama(request, 'POST', '/ai/enhance-image', { token: c.token, body: { image_url: 'data:image/png;base64,AAAA' } });
  expect(r.status).toBe(403);
});

test('filtro zone degli sconti: solo Garbatella, San Paolo e Marconi', async ({ page }) => {
  await page.goto('/discounts');
  const opzioni = page.getByTestId('filter-zone').locator('option');
  await expect(opzioni).toHaveText(['Tutte le zone', 'Garbatella', 'San Paolo', 'Marconi']);
});

test('pagina offerta: "Chiama" e "WhatsApp" hanno lo stesso formato, nessun consiglio sotto', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  const offerta = await creaOffertaApprovata(request, m.token);
  const c = await registra(request, 'client');
  await loginNelBrowser(page, c.email, c.password);
  await page.goto(`/discounts/${offerta.id}`);
  const chiama = page.getByTestId('btn-call-merchant');
  const wa = page.getByTestId('btn-whatsapp-merchant');
  await expect(chiama).toHaveText('Chiama per prenotare');
  await expect(wa).toHaveText('Scrivi su WhatsApp');
  const [a, b] = [await chiama.boundingBox(), await wa.boundingBox()];
  expect(Math.round(a.height)).toBe(Math.round(b.height));
  expect(Math.round(a.width)).toBe(Math.round(b.width));
  // Il «Consiglio furbo» è stato tolto (03/10)
  await expect(page.getByTestId('phone-booking-block')).not.toContainText(/Consiglio|abbonamento/);
  // Il messaggio che parte su WhatsApp non parla di abbonamento (04/10)
  const testoWa = decodeURIComponent(new URL(await wa.getAttribute('href')).searchParams.get('text'));
  expect(testoWa).toBe('Ciao! Ho trovato la vostra offerta su Sconti Roma e vorrei prenotare per usufruire dello sconto. Grazie!');
});

test('lista sconti: con un solo risultato scrive "1 sconto trovato"', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  const titolo = `Offerta unica ${Date.now()}`;
  await creaOffertaApprovata(request, m.token, { title: titolo });
  await page.goto('/discounts');
  await page.getByTestId('search-input').fill(titolo);
  await expect(page.getByTestId('results-count')).toHaveText('1 sconto trovato');
});

test('modulo offerta: con il server lento quello che scrivi non viene cancellato', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  await loginNelBrowser(page, m.email, m.password);
  // Il server risponde dopo 2 s (come Render appena svegliato)
  await page.route('**/api/merchants/me/discount', async (route) => {
    if (route.request().method() === 'GET') await new Promise((r) => setTimeout(r, 2000));
    await route.continue();
  });
  await page.goto('/merchant/discount');
  await page.getByTestId('disc-title').fill('Titolo scritto subito');
  await expect(page.getByTestId('disc-form')).toHaveAttribute('data-loaded', '1');
  await expect(page.getByTestId('disc-title')).toHaveValue('Titolo scritto subito');
});
