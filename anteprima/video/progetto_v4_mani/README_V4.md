# Video V4 «solo mani» — versione «dito animato» (decisione del titolare, 14/10)

Video verticale di circa 35 secondi che spiega l'app ai clienti **senza persone vere, senza IA generativa e senza spendere crediti**.
Al posto delle mani del titolare c'è un **dito animato disegnato in grafica vettoriale** che tocca, scorre e preme sull'app vera;
le clip del copione che richiedevano mani, una tazzina con cornetto o una porta sono **illustrazioni vettoriali** (grafiche, non riprese).
Copione di riferimento: `docs/comunicazione/campagna-prelancio/COPIONI_VIDEO.md` §5 (ramo `claude/campagna-prelancio`, PR #140) e `CHECK_REGOLE.md`.

## Cosa c'è nei file
| File | Contenuto |
|---|---|
| `rifai.sh` | rifà tutto da zero (sito, server finto, riprese, grafiche, montaggio, controlli) |
| `riprese/avvia_server.py`, `riprese/seed.py` | server locale con database finto in memoria (`MONGO_URL=mongomock://localhost`, porte 8021 e 3020) e dati **inventati** («… dell'Esempio», email `@example.com`) |
| `riprese/ctx.js` | browser «iPhone» (Playwright), **ripulitura delle schermate** (niente prezzi, percentuali, zone, «quartiere», «Migliora con IA»), **dito animato** (SVG) e **controllo automatico** dei testi visibili |
| `riprese/rec_clip.js`, `riprese/recorder.js` | le 4 riprese dell'app con il dito (home, scelta, offerta, QR) |
| `montaggio/grafica.js` | scritte a schermo, cornice dell'iPhone, e le 5 scene illustrate (vetrina, colazione, QR in cassa, «Stiamo arrivando», chiusura) fotogramma per fotogramma |
| `montaggio/monta.py` | montaggio, tre uscite, audio silenzioso |
| `montaggio/controlli.sh`, `anteprima_grafiche.py`, `fogli_clip.sh` | durata, risoluzione, fotogrammi neri, fogli di anteprima con le zone sicure |
| `schermate/` | fogli di anteprima (un fotogramma al secondo, con e senza zone sicure) e la versione leggera |

Stile come i video v14 e clienti: fondo chiaro `#F2F0EB`, **un solo accento fucsia** `#D81B72`, testo `#1A1530`, carattere **Manrope** (già in `frontend/public/fonts`, licenza OFL), telefono con angoli arrotondati.

## Come rifarlo
```
bash anteprima/video/progetto_v4_mani/rifai.sh
```
Serve `frontend/node_modules` (anche come collegamento a un'altra copia del repository che abbia `protomaps-leaflet`), Playwright globale per Node, Python con `fastapi uvicorn mongomock-motor httpx Pillow` e `ffmpeg`. Il sito è compilato con `e2e/scripts/build-sito.sh` puntato a `http://localhost:8021`; i processi avviati vengono chiusi alla fine. Mai database di produzione.
Le riprese durano circa 4 minuti (l'app è registrata a 1/8 di velocità per avere movimenti fluidi), il montaggio circa 2.

Uscite (in `montaggio/export/`, **fuori da git**):
- `scontiroma_v4_mani_master.mp4` — con le scritte (1080×1920, 30 fps, H.264 High, yuv420p);
- `scontiroma_v4_mani_senza_scritte.mp4` — senza scritte, per metterne altre; resta solo l'etichetta «ESEMPIO» sul telefono;
- `scontiroma_v4_mani_leggera.mp4` — master compresso (circa 1,2 MB) per l'invio.

**Audio: traccia silenziosa** (AAC, −91 dB). La musica la aggiunge il titolare dalla libreria dei brani consentiti agli account professionali di Instagram/Facebook. **Nessuna traccia di sottotitoli nascosti**: le scritte sono scritte nell'immagine (master) oppure assenti (versione senza scritte).

## Scene (34,5 secondi)
| # | Tempo | Tipo | Cosa si vede | Scritta a schermo |
|---|---|---|---|---|
| 1 | 0,0–3,2 | **grafica** | vetrina stilizzata con tenda fucsia; il dito spinge la porta, si apre e compaiono delle stelline | «Il negozio sotto casa…» |
| 2 | 3,2–7,6 | app | schermata iniziale dell'app nell'iPhone disegnato; il dito scorre verso l'alto | «…ha la sua app: Sconti Roma» · «Le offerte dei negozi, a Roma e dintorni» |
| 3 | 7,6–12,0 | app | pagina degli sconti: il dito tocca la scelta delle categorie e sceglie «Bar & Caffè», poi scorre; etichetta «ESEMPIO» | «① Scegli cosa cerchi» |
| 4 | 12,0–17,2 | app | il dito tocca la scheda «Colazione + cornetto» (offerta di prova), si apre la pagina e scorre fino a «Mostra QR Code»; «ESEMPIO» | «② L'offerta del mese: una per negozio» |
| 5 | 17,2–20,5 | **grafica** | tazzina con vapore e cornetto su un piatto, che compaiono sul tavolo | «Vai nel tuo negozio» |
| 6a | 20,5–23,7 | app | il dito tocca «Mostra QR Code» e compare il codice finto dell'ambiente di prova; «ESEMPIO» | «③ Mostra il QR in cassa» |
| 6b | 23,7–26,9 | **grafica** | un telefono con un QR disegnato (non è un QR vero) si avvicina a un altro telefono, che lo inquadra e mostra la spunta | «③ Mostra il QR in cassa» |
| 7 | 26,9–30,1 | **grafica** | segnaposto che cade su una mappa stilizzata, cerchi che si allargano, tre negozietti | «Stiamo arrivando a Roma e dintorni» |
| 8 | 30,1–34,5 | **grafica** | logo «Sconti Roma» e tre righe che compaiono una dopo l'altra | «Lista d'attesa: link in bio» · «Gratuita nella fase di lancio» · «Roma e dintorni · 18+» |

Differenze dal copione §5 (scelte da confermare): la clip 3 mostra la scelta delle **categorie** invece della zona (per decisione: niente zone né quartieri); la clip 5 dice «Vai nel tuo negozio» (senza «di quartiere»); la clip 6 è divisa in app + illustrazione (6a, 6b) e dura 6,4 s invece di 4; la clip 4 dura 5,2 s. Le scritte restano di 2–7 parole.

## Regole rispettate e come sono controllate
- **Nessuna persona, nessuna voce, nessuna IA generativa, nessun credito speso.** Tutto è registrato dall'app locale o disegnato in SVG/HTML.
- **Nessun prezzo, percentuale, zona o «quartiere» a schermo.** Il sito vero mostra prezzi, «-37%» e zone: solo nelle riprese `ctx.js` nasconde i testi con «€», «%», «zona/zone», «Risparmi…», sostituisce «quartiere» (es. «vicino a te»), nasconde il filtro per zona e tiene spenta la funzione «Migliora foto con IA». In più `rec_clip.js` **controlla più volte durante ogni ripresa** i testi visibili nello schermo e **fallisce** se ne trova uno vietato (esito dell'ultima prova: nessuna segnalazione). Le schermate e le scritte non contengono nomi di negozi veri: «Bar dell'Esempio» e simili sono inventati; l'indirizzo «Via dell'Esempio» è finto.
- **Nessuna data, nessuna promessa di sconti specifici**: l'offerta «Colazione + cornetto» è una scheda di prova, segnata «ESEMPIO», senza cifre. Nessun prezzo di abbonamento, nessun nome di commercianti reali, nessun marchio di terzi.
- «Gratuita nella fase di lancio», «Roma e dintorni», **18+** nella chiusura. Nessuna riga sui negozi (restano bloccate dai Termini).
- **Zone sicure** (Reels/Storie): nessuna scritta nei primi 270 px né negli ultimi 380 px (fino a 1540 px) né a meno di 60 px dai lati; corpo del testo 84 px (chiusura 64–68 px), contrasto alto (testo scuro su fondo chiaro). Il telefono scende fino a 1790 px solo come decorazione. Verifica a vista: `schermate/foglio_zone_sicure.png` (linee azzurre = limiti).
- Dove si vede un'offerta c'è l'etichetta «ESEMPIO» (scene 3, 4 e 6a). Il QR della scena 6a è quello dell'ambiente di prova (codice finto, non porta a un negozio vero); quello della 6b è un disegno.
- Le illustrazioni (vetrina, tazzina, cornetto, telefoni, segnaposto) sono **grafiche**, non riprese: va detto se qualcuno lo chiede.

## Controlli eseguiti sul master
`controlli.sh`: 34,50 s; 1080×1920; 30 fps; H.264 yuv420p; audio AAC silenzioso (max −91 dB); nessuna traccia di sottotitoli; nessun fotogramma nero (blackdetect); fogli di anteprima in `schermate/`.
