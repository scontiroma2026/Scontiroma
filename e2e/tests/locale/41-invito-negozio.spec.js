// Invito personale a un negozio: «La pagina di … è pronta» (strategia approvata dal titolare, 14/11).
// Il link porta un'anteprima con un'idea di offerta; «Attiva la pagina» apre l'iscrizione con nome,
// categoria e zona già compilati. Nessun dato viene salvato o pubblicato finché il negozio non si iscrive.
const { test, expect, API, PASSWORD, unico, chiama, admin } = require('../fixtures');

test.use({ viewport: { width: 390, height: 844 } });

// Fonte diversa a ogni giro: i conteggi dell'admin restano esatti anche su un database già usato
const FONTE = `invito-e2e-${Date.now() % 100000}`;
const LINK = `/invito?n=Gelateria%20di%20Prova&c=gelateria&z=garbatella&o=coppetta&fonte=${FONTE}`;

test('invito: anteprima con il nome del negozio e iscrizione già compilata', async ({ page }) => {
  // Le statistiche anonime contano solo il percorso: il nome del negozio (nei parametri) non parte mai
  const tracciati = [];
  page.on('request', (r) => { if (r.url().startsWith(`${API}/api/track`)) tracciati.push(r.postData() || ''); });

  await page.goto(LINK);
  await expect(page.getByTestId('invito-titolo')).toHaveText('La pagina di Gelateria di Prova è pronta');
  const anteprima = page.getByTestId('invito-anteprima');
  await expect(anteprima).toContainText('Anteprima');
  await expect(anteprima).toContainText('Gelateria');
  await expect(page.getByTestId('invito-offerta')).toHaveText('Coppetta media');
  await expect(anteprima).toContainText('Il prezzo lo decidete voi');
  await expect(anteprima.locator('img')).toHaveAttribute('src', /^\/esempi\//);
  await expect(page.getByTestId('invito-page')).toContainText('Non è pubblica');
  await expect(page.getByTestId('invito-no')).toContainText('Rispondete NO');
  // Materiale pubblico: niente prezzi, percentuali o promesse
  const testo = await page.getByTestId('invito-page').innerText();
  expect(testo).not.toMatch(/€|%|gratis per sempre|nessuna commissione|18\+|quartiere/i);
  // Anteprima personale: fuori dai motori di ricerca
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  // WhatsApp con i colori ufficiali e il messaggio già pronto con il nome del negozio
  const wa = page.getByTestId('invito-whatsapp');
  await expect(wa).toHaveAttribute('href', /^https:\/\/wa\.me\/393522473526\?text=.*Gelateria%20di%20Prova/);
  expect(await wa.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(37, 211, 102)');
  // Nessuno scroll orizzontale e pulsanti comodi a 390 px
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  expect((await page.getByTestId('invito-attiva').boundingBox()).height).toBeGreaterThanOrEqual(44);

  // «Attiva la pagina»: iscrizione del negozio con nome e categoria già scritti...
  await page.getByTestId('invito-attiva').click();
  await expect(page).toHaveURL(/\/register\?role=merchant/);
  await expect(page.getByTestId('reg-passo')).toContainText('Passo 1 di 2');
  await expect(page.getByTestId('reg-shop')).toHaveValue('Gelateria di Prova');
  await expect(page.getByTestId('reg-category')).toHaveValue('Gelateria');
  await page.getByTestId('reg-name').fill('Luca');
  const email = unico('invito');
  await page.getByTestId('reg-email').fill(email);
  await page.getByTestId('reg-password').fill(PASSWORD);
  await page.getByTestId('reg-avanti').click();
  // ...e la zona nel passo 2 (scritta minuscola nel link: si ritrova lo stesso)
  await expect(page.getByTestId('reg-passo')).toContainText('Passo 2 di 2');
  await expect(page.getByTestId('reg-zone')).toHaveValue('Garbatella');

  for (const corpo of tracciati) expect(corpo).not.toContain('Gelateria di Prova');
});

test('invito: l\'iscrizione arriva fino in fondo e il negozio risulta arrivato dall\'invito', async ({ page, request }) => {
  await page.goto(LINK);
  await page.getByTestId('invito-attiva').click();
  await page.getByTestId('reg-name').fill('Luca');
  const email = unico('invito-fine');
  await page.getByTestId('reg-email').fill(email);
  await page.getByTestId('reg-password').fill(PASSWORD);
  await page.getByTestId('reg-avanti').click();
  await page.getByTestId('reg-address-input').fill("Via dell'Esempio 1, Roma");
  await page.getByTestId('reg-phone').fill('+39 06 0000000');
  await page.getByTestId('reg-partita-iva').fill('12345678903');
  await page.getByTestId('legal-accept').click();
  await page.getByTestId('legal-specific').click();
  await page.getByTestId('reg-submit').click();
  await expect(page).toHaveURL(/\/setup-security/);
  const l = await chiama(request, 'POST', '/auth/login', { body: { email, password: PASSWORD } });
  expect(l.status).toBe(200);
  expect(l.data.user.shop_name).toBe('Gelateria di Prova');
  expect(l.data.user.category).toBe('Gelateria');
  expect(l.data.user.zone).toBe('Garbatella');
  // Nell'admin («Volantini e QR») la visita e l'iscrizione del negozio risultano sotto la fonte dell'invito
  const a = await admin(request);
  const f = await chiama(request, 'GET', '/admin/fonti-qr', { token: a.token, headers: a.headers });
  expect(f.status).toBe(200);
  const riga = f.data.fonti.find((x) => x.fonte === FONTE);
  expect(riga, 'riga della fonte dell\'invito').toBeTruthy();
  expect(riga.visite_negozi).toBeGreaterThanOrEqual(1);
  expect(riga.negozi_iscritti).toBe(1);
});

test('invito: link incompleto o con testo strano resta una pagina sicura e generica', async ({ page }) => {
  await page.goto('/invito?n=%3Cscript%3Ealert(1)%3C%2Fscript%3E&c=boh&z=&o=inesistente');
  await expect(page.getByTestId('invito-titolo')).toContainText('è pronta');
  // i segni del codice vengono tolti: resta solo testo, nessuno script eseguito
  await expect(page.getByTestId('invito-titolo')).not.toContainText('<');
  expect(await page.evaluate(() => document.querySelectorAll('main script').length)).toBe(0);
  // senza categoria: offerta valida per tutti e nessuna foto finta
  await expect(page.getByTestId('invito-offerta')).toHaveText('Omaggio di benvenuto');
  await expect(page.getByTestId('invito-anteprima')).toContainText('In omaggio');
  await expect(page.getByTestId('invito-anteprima').getByTestId('no-photo')).toBeVisible();

  // senza nessun dato: pagina generica, iscrizione senza campi compilati
  await page.goto('/invito');
  await expect(page.getByTestId('invito-titolo')).toHaveText('La pagina del vostro negozio è pronta');
  await page.getByTestId('invito-attiva').click();
  await expect(page).toHaveURL(/\/register\?role=merchant$/);
  await expect(page.getByTestId('reg-shop')).toHaveValue('');
  await expect(page.getByTestId('reg-category')).toHaveValue('');
});
