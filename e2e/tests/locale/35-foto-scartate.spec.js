// Controllo foto all'approvazione: ogni foto si ingrandisce e si approva o si scarta con un motivo.
// La foto scartata sparisce dall'offerta; le altre restano e l'offerta si pubblica.
const fs = require('fs');
const { test, expect, chiama, registra, loginNelBrowser, WEB } = require('../fixtures');
const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_MASTER_PASSWORD } = require('../env');

test.use({ viewport: { width: 390, height: 844 } });

test('admin: scarta una foto con un motivo e approva il resto dell\'offerta', async ({ page, request }) => {
  const ids = fs.readdirSync(`${__dirname}/../../../frontend/public/esempi`).filter((f) => f.endsWith('.jpg')).slice(0, 2);
  const foto = ids.map((f) => `${WEB}/esempi/${f}`);
  const m = await registra(request, 'merchant');
  const c = await chiama(request, 'POST', '/merchants/me/discount', { token: m.token, body: {
    title: `Foto e2e ${Date.now()}`, description: 'Descrizione di prova.', original_price: 30, discounted_price: 15,
    image_url: foto[0], image_urls: foto } });
  expect(c.status, JSON.stringify(c.data)).toBe(200);
  const did = c.data.discount.id;

  await loginNelBrowser(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto('/admin');
  await page.getByTestId('master-pw').fill(ADMIN_MASTER_PASSWORD);
  await page.getByTestId('master-submit').click();
  await page.getByTestId('tab-pending').click();
  const controllo = page.getByTestId(`foto-controllo-${did}`);
  await expect(controllo).toBeVisible();

  // Ingrandire la foto 1 e chiudere
  await page.getByTestId(`foto-${did}-0`).getByRole('button', { name: /Ingrandisci/ }).click();
  await expect(page.getByTestId('foto-ingrandita')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('foto-ingrandita')).toBeHidden();

  // Motivo troppo corto: nulla cambia. Motivo valido: la foto risulta scartata.
  page.once('dialog', (d) => d.accept('corto'));
  await page.getByTestId(`foto-scarta-${did}-0`).click();
  await expect(page.getByTestId(`foto-scartata-${did}-0`)).toHaveCount(0);
  page.once('dialog', (d) => d.accept('Volto riconoscibile in primo piano'));
  await page.getByTestId(`foto-scarta-${did}-0`).click();
  await expect(page.getByTestId(`foto-scartata-${did}-0`)).toContainText('Volto riconoscibile in primo piano');
  await page.getByTestId(`foto-approva-${did}-1`).click();

  await page.getByTestId(`approve-${did}`).click();
  await expect(page.getByTestId(`pending-${did}`)).toHaveCount(0);
  const pubblica = (await chiama(request, 'GET', '/discounts')).data.discounts.find((d) => d.id === did);
  expect(pubblica.image_urls).toEqual([foto[1]]);
  expect(pubblica.image_url).toBe(foto[1]);
});
