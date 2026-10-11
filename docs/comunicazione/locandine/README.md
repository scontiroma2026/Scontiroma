# Locandine A4 per i negozi aderenti

Stesso contenuto in 10 stili grafici (bozze da scegliere). Formato A4 verticale, PNG 1588×2246 px (scala 2) in `png/`.
Il testo è sempre quello di `docs/comunicazione/CLIENTI_LOCANDINA_E_POST.md` (versione A4), con il segnaposto `[NOME NEGOZIO]`.

| Stile (file in `png/`) | Periodo d'uso consigliato | Inchiostro |
|---|---|---|
| `locandina-app-chiara.png` | tutto l'anno (base) | poco |
| `locandina-halloween-app.png` | fine ottobre, colori dell'app | molto |
| `locandina-halloween-arancio-blu.png` | fine ottobre | molto |
| `locandina-halloween-viola-giallo.png` | fine ottobre | molto |
| `locandina-halloween-rosso-blu-bianco.png` | fine ottobre | molto |
| `locandina-fabbrica-di-dolci.png` | periodo dolci/feste, autunno-inverno | molto |
| `locandina-mattoncini.png` | tutto l'anno, tono giocoso | poco |
| `locandina-natale.png` | dicembre – 6 gennaio | molto |
| `locandina-pasqua.png` | marzo – aprile (Pasqua) | poco |
| `locandina-estate.png` | giugno – agosto | medio |

## Come rigenerare

Serve Chromium e Playwright (`cd e2e && npm ci`). Dalla radice del repository:

```
node docs/comunicazione/locandine/render.js              # tutti gli stili
node docs/comunicazione/locandine/render.js natale       # solo uno
```

Il generatore è un unico file, `locandina.html`; lo stile si sceglie con `?s=NOME` (es. `locandina.html?s=pasqua`).
Se Chromium non è in `/opt/pw-browsers/chromium`, imposta `CHROMIUM_PATH`. Logo e caratteri dell'app sono letti da `frontend/public`; gli altri caratteri sono in `fonts/` (licenza OFL, vedi `fonts/LICENZE.txt`).

## Come inserire il QR

- Il riquadro tratteggiato è il posto del QR: sta sempre su un pannello **bianco** con margine ampio, anche negli stili scuri.
- QR **nero su bianco**, senza scritte né colori sopra, grande **almeno 8 × 8 cm** (il riquadro è circa 8,1 cm sul foglio A4 a 100%).
- Il nome del negozio sostituisce `[NOME NEGOZIO]` (due punti nel testo) prima di stampare.
- Prima di stampare le copie, **prova il QR stampato con due telefoni diversi** (iPhone e Android), da circa 30 cm.
- Stampa al 100% (nessun "adatta alla pagina").

## Nota stampa

Gli stili scuri consumano più inchiostro: per stampare molte copie preferisci `app-chiara`, `pasqua` o `mattoncini`.
