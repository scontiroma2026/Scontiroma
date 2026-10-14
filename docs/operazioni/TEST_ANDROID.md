# Prova Android in emulazione (14/10/2026)

> **È un'emulazione con Chromium su un computer, NON un telefono Android vero.** Sito compilato in locale, server di prova con database finto, nessuna chiamata verso la produzione. Schermate fuori dal repository.

Profili: Pixel 7 (412 px), Android economico 360×640 (DPR 2), Android molto piccolo 320×534. Percorsi: home (anche col banner cookie), sconti, mappa, scheda offerta, scheda negozio da QR, «Per i commercianti», Termini e Privacy, iscrizione cliente (con tastiera simulata riducendo l'altezza al 55%), accesso, area cliente, area commerciante (dashboard, offerta, archivio, scansione), PWA.

## Risultati
- **Nessuno scroll orizzontale** in nessuna pagina e su nessun profilo; nessun errore JavaScript.
- **Tastiera:** con l'altezza ridotta i campi email e password restano visibili e senza essere coperti (tipo `email`, `autocomplete` corretti).
- **Aree toccabili sotto i 44 px** (da migliorare, non bloccanti): domande frequenti della home (altezza 32 px), «Diventa partner» (22 px), link Privacy/Cookie/Termini del piè di pagina (larghezza ~40 px), link «Iscriviti per usare lo sconto» e «Guarda gli altri sconti» nella scheda negozio (20-22 px), casella delle condizioni nel modulo di iscrizione (16 px, l'etichetta può essere più grande), caselle dei giorni degli orari e un pulsante da 56×32 px nell'area commerciante, link dentro i testi legali.
- **Testi piccoli:** alcune etichette a 11 px («ROMA È TUA», «Nuovo su Sconti Roma», «RISPARMI €…», etichette dei mesi).
- **Testo tagliato:** la riga «Roma e dintorni – Dal centro alla periferia» nella home è più larga del suo riquadro (426 px su 362) e viene scorsa/tagliata: da guardare nelle schermate (`02-home.png`).
- **PWA:** nessun service worker; il manifest ha solo icone SVG (192 e 512) con «any maskable» insieme; `theme-color` della pagina (#FFFFFF) diverso da quello del manifest (#0A0A0A); la descrizione del manifest dice ancora «Garbatella, San Paolo e Marconi» (l'app è aperta a tutta Roma dall'08/10). Il banner di installazione non è comparso con l'evento simulato: da provare su un Android vero.
- **Mappa:** i riquadri della mappa non si caricano (le richieste esterne sono bloccate): layout dei controlli verificato, mappa vera no.

Nessuna correzione al sito fatta in questa PR (i problemi sono di rifinitura e vanno scelti dal titolare).

## Da provare a mano su un Android vero
Installazione sulla schermata Home da Chrome, tastiera vera (copertura dei campi, suggerimenti password), mappa con tasselli e posizione, fotocamera/scansione QR, Face ID/impronta (WebAuthn), condivisione WhatsApp, rotazione schermo, modalità risparmio dati, Samsung Internet e Firefox.
