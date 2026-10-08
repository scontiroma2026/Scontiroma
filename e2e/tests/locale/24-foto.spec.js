// Foto dell'offerta: la foto scattata o scelta entra subito nella galleria (ridotta a 1600 px, JPEG),
// messaggi chiari se il file non va bene, mai un'immagine di default al posto della foto,
// e confronto «Originale / Migliorata con IA» con «Ripristina l'originale».
// L'IA è simulata con page.route: nessuna chiamata vera.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { test, expect, registra, creaOffertaApprovata, loginNelBrowser } = require('../fixtures');

const FOTO = path.join(__dirname, '..', 'files', 'foto-offerta.jpg');
const CARTELLA_SCREEN = process.env.E2E_SCREEN_FOTO || '';

test.use({ viewport: { width: 390, height: 844 } });

async function schermata(page, nome) {
  if (!CARTELLA_SCREEN) return;
  fs.mkdirSync(CARTELLA_SCREEN, { recursive: true });
  await page.screenshot({ path: path.join(CARTELLA_SCREEN, `${nome}.png`) });
}

// PNG 64x64 fucsia, generato qui: è la foto «migliorata» del finto servizio IA.
function pngFucsia() {
  const w = 64, h = 64;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    for (let x = 0; x < w; x++) { const o = y * (w * 3 + 1) + 1 + x * 3; raw[o] = 216; raw[o + 1] = 27; raw[o + 2] = 114; }
  }
  const crcTab = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTab[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (tipo, dati) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(dati.length);
    const corpo = Buffer.concat([Buffer.from(tipo), dati]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(corpo));
    return Buffer.concat([len, corpo, c]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const MIGLIORATA = `data:image/png;base64,${pngFucsia().toString('base64')}`;

async function apriForm(page, request) {
  const m = await registra(request, 'merchant');
  await loginNelBrowser(page, m.email, m.password);
  await page.goto('/merchant/discount');
  await expect(page.getByTestId('photo-gallery')).toBeVisible();
  return m;
}

async function aggiungiFoto(page, file) {
  await page.locator('input[type=file]').first().setInputFiles(file);
}

async function simulaIA(page, { ritardoMs = 0, stato = 200 } = {}) {
  await page.route('**/api/ai/enhance-image', async (route) => {
    if (ritardoMs) await new Promise((r) => setTimeout(r, ritardoMs));
    if (stato === 200) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ enhanced_image_url: MIGLIORATA, mime_type: 'image/png' }) });
    const detail = stato === 503 ? 'AI enhancer non configurato (GEMINI_API_KEY mancante)' : 'Errore AI: prova';
    return route.fulfill({ status: stato, contentType: 'application/json', body: JSON.stringify({ detail }) });
  });
}

test('la foto scelta entra subito nella galleria (JPEG) e viene salvata con l\'offerta', async ({ page, request }) => {
  await apriForm(page, request);
  await aggiungiFoto(page, FOTO);
  // Nessun passaggio di conferma da dimenticare: la foto è già nella galleria
  await expect(page.getByTestId('photo-tile-0')).toBeVisible();
  await expect(page.getByTestId('photo-tile-0').locator('img')).toHaveAttribute('src', /^data:image\/jpeg;base64,/);
  await schermata(page, '01-foto-aggiunta');

  await page.getByTestId('disc-title').fill('Offerta con foto e2e');
  await page.getByTestId('disc-description').fill('Descrizione di prova.');
  await page.getByTestId('disc-original').fill('40');
  await page.getByTestId('disc-discounted').fill('20');
  const salvataggio = page.waitForResponse((r) => r.url().endsWith('/api/merchants/me/discount') && r.request().method() === 'POST');
  await page.getByTestId('disc-submit').click();
  const r = await salvataggio;
  expect(r.status(), await r.text()).toBe(200);
  const corpo = r.request().postDataJSON();
  expect(corpo.image_urls).toHaveLength(1);
  expect(corpo.image_urls[0]).toMatch(/^data:image\/jpeg;base64,/);
  expect(corpo.image_url).toBe(corpo.image_urls[0]);
});

test('foto grande dell\'iPhone: ridimensionata a 1600 px, in JPEG', async ({ page, request }) => {
  await apriForm(page, request);
  // 4032x3024 con rumore, creata nel browser (come una foto dell'iPhone, ~10 MB)
  await page.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 4032; c.height = 3024;
    const ctx = c.getContext('2d');
    const dati = ctx.createImageData(c.width, c.height);
    for (let i = 0; i < dati.data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      dati.data[i] = v; dati.data[i + 1] = (v * 7) & 255; dati.data[i + 2] = (v * 13) & 255; dati.data[i + 3] = 255;
    }
    ctx.putImageData(dati, 0, 0);
    const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.95));
    const file = new File([blob], 'IMG_0001.JPG', { type: 'image/jpeg' });
    window.__pesoOriginale = file.size;
    const dt = new DataTransfer();
    dt.items.add(file);
    const input = document.querySelector('input[type=file]');
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  const pesoOriginale = await page.evaluate(() => window.__pesoOriginale);
  expect(pesoOriginale).toBeGreaterThan(5 * 1024 * 1024);
  const img = page.getByTestId('photo-tile-0').locator('img');
  await expect(img).toHaveAttribute('src', /^data:image\/jpeg;base64,/, { timeout: 30_000 });
  const m = await img.evaluate((el) => ({ w: el.naturalWidth, h: el.naturalHeight, kb: Math.round(el.src.length * 0.75 / 1024) }));
  expect(m.w).toBe(1600);
  expect(m.h).toBe(1200);
  expect(m.kb).toBeLessThan(3000);
  await schermata(page, '02-foto-grande-ridotta');
});

test('file non utilizzabili: messaggi chiari e nessuna foto aggiunta', async ({ page, request }) => {
  await apriForm(page, request);
  const errore = page.getByTestId('gallery-slot-0-error');

  // HEIC (Chrome non lo decodifica; Safari sì)
  await aggiungiFoto(page, { name: 'IMG_0002.HEIC', mimeType: 'image/heic', buffer: Buffer.concat([Buffer.from('....ftypheic'), Buffer.alloc(4000, 7)]) });
  await expect(errore).toContainText('Formato non supportato (HEIC)');
  await expect(errore).toContainText('Più compatibile');
  await schermata(page, '03-errore-heic');

  // Un documento
  await aggiungiFoto(page, { name: 'nota.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 prova') });
  await expect(errore).toContainText('Formato non supportato. Usa una foto JPG o PNG.');

  // Un finto JPEG rotto
  await aggiungiFoto(page, { name: 'rotta.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(3000, 1) });
  await expect(errore).toContainText('Formato non supportato');

  // Troppo grande (oltre 40 MB)
  await aggiungiFoto(page, { name: 'enorme.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(41 * 1024 * 1024, 1) });
  await expect(errore).toContainText('Foto troppo grande');

  await expect(page.getByTestId('photo-tile-0')).toHaveCount(0);
  await expect(page.getByTestId('disc-title')).toBeVisible(); // la pagina non si è rotta
});

test('«Migliora con IA»: confronto, «Usa la migliorata» e «Ripristina l\'originale»', async ({ page, request }) => {
  await apriForm(page, request);
  await simulaIA(page, { ritardoMs: 600 });
  await aggiungiFoto(page, FOTO);
  const tile = page.getByTestId('photo-tile-0').locator('img');
  await expect(tile).toHaveAttribute('src', /^data:image\/jpeg;base64,/);
  const originale = await tile.getAttribute('src');
  await expect(page.getByTestId('photo-ai-badge-0')).toHaveCount(0);

  await page.getByTestId('photo-ai-enhance-0').click();
  // Attesa
  await expect(page.getByTestId('photo-compare-loading')).toContainText('Sto migliorando la foto…');
  await schermata(page, '04-attesa');
  // Confronto
  await expect(page.getByTestId('photo-compare-enhanced')).toBeVisible();
  await expect(page.getByTestId('photo-compare-original')).toHaveAttribute('src', originale);
  await expect(page.getByTestId('photo-compare-enhanced')).toHaveAttribute('src', MIGLIORATA);
  await expect(page.getByText('Originale', { exact: true })).toBeVisible();
  await expect(page.getByText('Migliorata con IA')).toBeVisible();
  // La foto non cambia finché non si sceglie
  await expect(tile).toHaveAttribute('src', originale);
  // Tasti da almeno 44 px
  for (const id of ['photo-compare-use-enhanced', 'photo-compare-keep-original', 'photo-compare-close']) {
    const box = await page.getByTestId(id).boundingBox();
    expect(box.height, id).toBeGreaterThanOrEqual(44);
    expect(box.width, id).toBeGreaterThanOrEqual(44);
  }
  await schermata(page, '05-confronto');

  await page.getByTestId('photo-compare-use-enhanced').click();
  await expect(page.getByTestId('photo-compare-dialog')).toHaveCount(0);
  await expect(tile).toHaveAttribute('src', MIGLIORATA);
  await expect(page.getByTestId('photo-ai-badge-0')).toHaveText(/Foto ottimizzata con IA/);
  await schermata(page, '06-migliorata-usata');

  // Ripristino
  await page.getByTestId('photo-restore-0').click();
  await expect(tile).toHaveAttribute('src', originale);
  await expect(page.getByTestId('photo-ai-badge-0')).toHaveCount(0);
  await expect(page.getByTestId('photo-restore-0')).toHaveCount(0);
});

test('«Migliora con IA»: «Tieni l\'originale», chiusura e annulla lasciano la foto com\'è', async ({ page, request }) => {
  await apriForm(page, request);
  await simulaIA(page, { ritardoMs: 300 });
  await aggiungiFoto(page, FOTO);
  const tile = page.getByTestId('photo-tile-0').locator('img');
  await expect(tile).toHaveAttribute('src', /^data:image\/jpeg;base64,/);
  const originale = await tile.getAttribute('src');

  // Tieni l'originale
  await page.getByTestId('photo-ai-enhance-0').click();
  await page.getByTestId('photo-compare-keep-original').click();
  await expect(page.getByTestId('photo-compare-dialog')).toHaveCount(0);
  await expect(tile).toHaveAttribute('src', originale);
  await expect(page.getByTestId('photo-ai-badge-0')).toHaveCount(0);

  // Chiudere con la X = tenere l'originale
  await page.getByTestId('photo-ai-enhance-0').click();
  await expect(page.getByTestId('photo-compare-enhanced')).toBeVisible();
  await page.getByTestId('photo-compare-close').click();
  await expect(page.getByTestId('photo-compare-dialog')).toHaveCount(0);
  await expect(tile).toHaveAttribute('src', originale);

  // Annullare durante l'attesa: la risposta che arriva dopo non cambia nulla
  await page.getByTestId('photo-ai-enhance-0').click();
  await page.getByTestId('photo-compare-cancel').click();
  await expect(page.getByTestId('photo-compare-dialog')).toHaveCount(0);
  await page.waitForTimeout(800);
  await expect(page.getByTestId('photo-compare-dialog')).toHaveCount(0);
  await expect(tile).toHaveAttribute('src', originale);
  // e si può riprovare
  await expect(page.getByTestId('photo-ai-enhance-0')).toBeEnabled();
});

test('«Migliora con IA»: senza chiave (503) o con errore, messaggio chiaro e foto invariata', async ({ page, request }) => {
  await apriForm(page, request);
  await aggiungiFoto(page, FOTO);
  const tile = page.getByTestId('photo-tile-0').locator('img');
  await expect(tile).toHaveAttribute('src', /^data:image\/jpeg;base64,/);
  const originale = await tile.getAttribute('src');

  await simulaIA(page, { stato: 503 });
  await page.getByTestId('photo-ai-enhance-0').click();
  await expect(page.getByTestId('photo-compare-error')).toContainText('non è attiva');
  await expect(page.getByTestId('photo-compare-error')).toContainText('La foto resta com\'è');
  await schermata(page, '07-errore-ia');
  await page.getByTestId('photo-compare-keep-original').click();
  await expect(tile).toHaveAttribute('src', originale);

  await page.unroute('**/api/ai/enhance-image');
  await simulaIA(page, { stato: 502 });
  await page.getByTestId('photo-ai-enhance-0').click();
  await expect(page.getByTestId('photo-compare-error')).toContainText('non è riuscita a migliorare');
  await page.getByTestId('photo-compare-close').click();
  await expect(tile).toHaveAttribute('src', originale);

  // Quota del fornitore dell'IA esaurita (429): messaggio chiaro, senza testo tecnico
  await page.unroute('**/api/ai/enhance-image');
  await simulaIA(page, { stato: 429 });
  await page.getByTestId('photo-ai-enhance-0').click();
  await expect(page.getByTestId('photo-compare-error')).toContainText('ha raggiunto il limite per ora');
  await expect(page.getByTestId('photo-compare-error')).not.toContainText('RESOURCE_EXHAUSTED');
  await page.getByTestId('photo-compare-close').click();
  await expect(tile).toHaveAttribute('src', originale);
});

test('offerta senza foto: «Nessuna foto», mai un\'immagine di default', async ({ page, request }) => {
  const m = await registra(request, 'merchant');
  const titolo = `Senza foto e2e ${Date.now()}`;
  const o = await creaOffertaApprovata(request, m.token, { title: titolo });
  const c = await registra(request, 'client');
  await loginNelBrowser(page, c.email, c.password);

  await page.goto('/discounts');
  const card = page.getByTestId(`discount-card-${o.id}`);
  await expect(card).toBeVisible();
  await expect(card.getByTestId('no-photo')).toContainText('Nessuna foto');
  await expect(card.locator('img[src*="unsplash"]')).toHaveCount(0); // nessuna foto di cibo finta
  await schermata(page, '08-card-senza-foto');

  await page.goto(`/discounts/${o.id}`);
  await expect(page.getByTestId('no-photo').first()).toContainText('Nessuna foto');
  await expect(page.getByTestId('discount-hero-image')).toHaveCount(0);
  await schermata(page, '09-dettaglio-senza-foto');
});
