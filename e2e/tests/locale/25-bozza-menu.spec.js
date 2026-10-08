// Bozza dell'offerta (quello che il commerciante scrive resta anche cambiando pagina) e menu a
// tendina che si richiudono dopo la scelta. Screenshot a 390 px in BOZZA_SHOTS (fuori dal repository).
const { test, expect, registra, loginNelBrowser } = require('../fixtures');

test.use({ viewport: { width: 390, height: 844 } });

const SHOTS = process.env.BOZZA_SHOTS || '';
const foto = async (page, nome) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/${nome}.png`, fullPage: true }); };
const bozzeSalvate = (page) => page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('sr_bozza_')));

async function scrivi(page) {
  await page.goto('/merchant/discount');
  await expect(page.getByTestId('disc-form')).toHaveAttribute('data-loaded', '1');
  await page.getByTestId('disc-title').fill('Menu degustazione di prova');
  await page.getByTestId('disc-description').fill('Quattro portate con **vino della casa**.');
  await page.getByTestId('disc-original').fill('60');
  await page.getByTestId('disc-discounted').fill('30');
}

test('bozza: cambiando pagina il testo non va perso, dopo l\'invio sparisce, il logout la cancella', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  await loginNelBrowser(page, m.email, m.password);
  await scrivi(page);
  // Salvataggio automatico dopo ~500 ms
  await expect.poll(() => bozzeSalvate(page)).toHaveLength(1);

  // Altra pagina (anche con ricarica completa) e ritorno: compare il riquadro e «Riprendi» rimette il testo
  await page.goto('/merchant/dashboard');
  await expect(page.getByTestId('merchant-dashboard-page').or(page.locator('main')).first()).toBeVisible();
  await page.goto('/merchant/discount');
  await expect(page.getByTestId('disc-form')).toHaveAttribute('data-loaded', '1');
  await expect(page.getByText('Hai una bozza non salvata')).toBeVisible();
  await foto(page, 'bozza-riquadro');
  await expect(page.getByTestId('bozza-foto-avviso')).toHaveCount(0);
  await page.getByTestId('bozza-riprendi').click();
  await expect(page.getByTestId('bozza-riquadro')).toHaveCount(0);
  await expect(page.getByTestId('disc-title')).toHaveValue('Menu degustazione di prova');
  await expect(page.getByTestId('disc-description')).toHaveValue('Quattro portate con **vino della casa**.');
  await expect(page.getByTestId('disc-original')).toHaveValue('60');
  await expect(page.getByTestId('disc-discounted')).toHaveValue('30');

  // «Scarta»: il riquadro sparisce e la bozza viene cancellata
  await page.goto('/merchant/dashboard');
  await page.goto('/merchant/discount');
  await expect(page.getByTestId('bozza-riquadro')).toBeVisible();
  await page.getByTestId('bozza-scarta').click();
  await expect(page.getByTestId('bozza-riquadro')).toHaveCount(0);
  await expect(page.getByTestId('disc-title')).toHaveValue('');
  expect(await bozzeSalvate(page)).toEqual([]);

  // Bozza vuota: non si salva niente
  await page.waitForTimeout(900);
  expect(await bozzeSalvate(page)).toEqual([]);

  // Scrivo di nuovo e invio: dopo l'invio la bozza non c'è più, nemmeno tornando sulla pagina
  await page.getByTestId('disc-title').fill('Offerta inviata davvero');
  await page.getByTestId('disc-description').fill('Descrizione.');
  await page.getByTestId('disc-original').fill('40');
  await page.getByTestId('disc-discounted').fill('20');
  await expect.poll(() => bozzeSalvate(page)).toHaveLength(1);
  await page.getByTestId('disc-submit').click();
  await expect(page.getByTestId('banner-pending')).toBeVisible();
  await page.waitForTimeout(900);
  expect(await bozzeSalvate(page)).toEqual([]);
  await page.goto('/merchant/dashboard');
  await page.goto('/merchant/discount');
  await expect(page.getByTestId('disc-form')).toHaveAttribute('data-loaded', '1');
  await expect(page.getByTestId('bozza-riquadro')).toHaveCount(0);
  await expect(page.getByTestId('disc-title')).toHaveValue('Offerta inviata davvero');

  // Una modifica non inviata diventa bozza; con l'uscita (logout) la bozza viene cancellata
  await page.getByTestId('disc-title').fill('Modifica non inviata');
  await expect.poll(() => bozzeSalvate(page)).toHaveLength(1);
  await page.getByTestId('mobile-menu-btn').click();
  await page.getByRole('button', { name: /Esci/ }).click();
  await expect.poll(() => bozzeSalvate(page)).toEqual([]);
});

test('bozza: se il server dà errore all\'invio il testo resta nella bozza', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  await loginNelBrowser(page, m.email, m.password);
  await page.route('**/api/merchants/me/discount', async (route) => {
    if (route.request().method() === 'POST') return route.fulfill({ status: 500, contentType: 'application/json', body: '{"detail":"Errore di prova"}' });
    return route.continue();
  });
  await scrivi(page);
  await page.getByTestId('disc-submit').click();
  await page.waitForTimeout(900);
  expect(await bozzeSalvate(page)).toHaveLength(1);
  await expect(page.getByTestId('disc-title')).toHaveValue('Menu degustazione di prova');
});

test('bozza: se le foto non sono entrate nella bozza (oltre 2 MB) compare l\'avviso «Le foto vanno aggiunte di nuovo»', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  await loginNelBrowser(page, m.email, m.password);
  await page.goto('/merchant/discount');
  await expect(page.getByTestId('disc-form')).toHaveAttribute('data-loaded', '1');
  await page.getByTestId('disc-title').fill('Con foto enormi');
  await page.getByTestId('disc-description').fill('Testo da salvare.');
  await page.getByTestId('disc-original').fill('50');
  await page.getByTestId('disc-discounted').fill('25');
  await expect.poll(() => bozzeSalvate(page)).toHaveLength(1);
  // Come lascia la bozza l'app quando le foto superano i 2 MB: solo testo + segnalazione
  await page.evaluate(() => {
    const k = Object.keys(localStorage).find((x) => x.startsWith('sr_bozza_'));
    const b = JSON.parse(localStorage.getItem(k));
    delete b.dati.image_urls; delete b.dati.image_url; b.fotoPerse = true;
    localStorage.setItem(k, JSON.stringify(b));
  });
  await page.goto('/merchant/dashboard');
  await page.goto('/merchant/discount');
  await expect(page.getByTestId('bozza-riquadro')).toBeVisible();
  await expect(page.getByTestId('bozza-foto-avviso')).toHaveText('Le foto vanno aggiunte di nuovo.');
  await foto(page, 'bozza-foto-avviso');
  await page.getByTestId('bozza-riprendi').click();
  await expect(page.getByTestId('disc-title')).toHaveValue('Con foto enormi');
});

test('descrizione del negozio: il testo scritto resta cambiando pagina', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  await loginNelBrowser(page, m.email, m.password);
  await page.goto('/merchant/dashboard');
  // La bozza si salva solo a dati del server arrivati: aspetto che la dashboard sia pronta prima di scrivere
  await expect(page.getByTestId('da-fare')).toBeVisible();
  await page.getByTestId('shop-description-input').fill('La nostra storia dal 1987.');
  await expect.poll(() => bozzeSalvate(page)).toHaveLength(1);
  await page.goto('/merchant/discount');
  await page.goto('/merchant/dashboard');
  await expect(page.getByTestId('bozza-negozio')).toBeVisible();
  await page.getByTestId('bozza-riprendi').click();
  await expect(page.getByTestId('shop-description-input')).toHaveValue('La nostra storia dal 1987.');
});

// ---------- Menu a tendina ----------
const aperto = (page) => page.evaluate(() => document.activeElement && document.activeElement.tagName === 'SELECT');

test('menu a tendina: dopo la scelta il menu si chiude e il valore resta impostato (filtri)', async ({ page }) => {
  await page.goto('/discounts');
  for (const [id, valore] of [['filter-zone', 'Garbatella'], ['filter-category', 'Ristorante']]) {
    const sel = page.getByTestId(id);
    await sel.focus();
    await sel.selectOption(valore);
    await expect(sel).toHaveValue(valore);
    await expect.poll(() => aperto(page), { message: `${id} ancora attivo dopo la scelta` }).toBe(false);
  }
  await foto(page, 'menu-filtri');
  await page.goto('/map');
  const z = page.getByTestId('map-zone');
  await z.selectOption('Garbatella');
  await expect(z).toHaveValue('Garbatella');
  await expect.poll(() => aperto(page)).toBe(false);
});

test('menu a tendina: iscrizione commerciante, zona e categoria si chiudono dopo la scelta', async ({ page }) => {
  await page.goto('/register?role=merchant');
  for (const [id, valore] of [['reg-zone', 'Garbatella'], ['reg-category', 'Ristorante']]) {
    const sel = page.getByTestId(id);
    await sel.focus();
    await sel.selectOption(valore);
    await expect(sel).toHaveValue(valore);
    await expect.poll(() => aperto(page)).toBe(false);
  }
  // Un ritorno a capo nella pagina (altro campo) non riapre né cambia il valore scelto
  await page.getByTestId('reg-phone').fill('+39 06 0000000');
  await expect(page.getByTestId('reg-zone')).toHaveValue('Garbatella');
  await foto(page, 'menu-registrazione');
});
