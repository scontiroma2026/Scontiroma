// Indirizzo del commerciante: se il suggerimento non ha il civico, si tiene quello scritto.
// La risposta di /geocode/suggest è simulata: nei test non si chiama Nominatim.
const { test, expect } = require('../fixtures');

const SOLO_VIA = {
  suggestions: [{
    display: "Via dell'Esempio, 00154 Roma", full_display_name: "Via dell'Esempio, Garbatella, Roma, Lazio, 00154, Italia",
    lat: 41.86, lng: 12.49, road: "Via dell'Esempio", house_number: '', postcode: '00154', city: 'Roma', has_house_number: false,
  }],
};

test('iscrizione: scegliendo un suggerimento senza civico il civico scritto resta', async ({ page }) => {
  await page.route('**/api/geocode/suggest**', (r) => r.fulfill({ json: SOLO_VIA }));
  await page.goto('/register?role=merchant');
  const campo = page.getByTestId('reg-address-input');
  await campo.fill("Via dell'Esempio 12");
  await expect(page.getByTestId('reg-address-item-0')).toContainText("Via dell'Esempio 12, 00154 Roma");
  await expect(page.getByTestId('reg-address-item-0')).toContainText('civico 12 da te');
  await page.getByTestId('reg-address-item-0').click();
  await expect(campo).toHaveValue("Via dell'Esempio 12, 00154 Roma");
  await expect(page.getByTestId('reg-address-civico-tenuto')).toContainText('civico 12');
});

test('iscrizione: senza civico scritto il suggerimento resta com\'è', async ({ page }) => {
  await page.route('**/api/geocode/suggest**', (r) => r.fulfill({ json: SOLO_VIA }));
  await page.goto('/register?role=merchant');
  const campo = page.getByTestId('reg-address-input');
  await campo.fill("Via dell'Esempio");
  await expect(page.getByTestId('reg-address-item-0')).toContainText('senza civico');
  await page.getByTestId('reg-address-item-0').click();
  await expect(campo).toHaveValue("Via dell'Esempio, 00154 Roma");
});
