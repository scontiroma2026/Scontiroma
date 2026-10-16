# Prova Android in emulazione (14/10/2026)

> **È un'emulazione con Chromium su un computer, NON un telefono Android vero.** Sito compilato in locale, server di prova con database finto, nessuna chiamata verso la produzione. Schermate (prima e dopo) fuori dal repository, nella cartella privata della sessione (`.../scratchpad/android/prima` e `.../android/dopo`).

Profili: Pixel 7 (412 px), Android economico 360×640 (DPR 2), Android molto piccolo 320×534. Percorsi: home (anche col banner cookie), sconti, mappa, scheda offerta, scheda negozio da QR, «Per i commercianti», Termini e Privacy, iscrizione cliente (tastiera simulata riducendo l'altezza al 55%), accesso, area cliente, area commerciante, PWA.

## Prima delle correzioni
Nessuno scroll orizzontale, nessun errore JavaScript, tastiera senza campi coperti. Da sistemare: aree toccabili sotto i 44 px (~30 comandi distinti), 46 testi a 11 px o meno, icone/manifest PWA.

## Correzioni fatte (solo CSS/classi, nessun cambio di testi)
- Domande frequenti della home: altezza minima 44 px.
- Piè di pagina (Privacy, Cookie, Termini, Recesso, Assistenza…) e link dell'accesso («Password dimenticata?», «indietro»): almeno 44×44 px.
- «Torna alla home» (pagine legali e assistenza), link «Guarda gli altri sconti» (scheda negozio), link del QR in dashboard: almeno 44 px di altezza.
- Caselle di iscrizione (Termini, Privacy, comunicazioni) da 16 a 24 px; interruttore «Offerta attiva»: area toccabile estesa a 48 px.
- Testi da 10-11 px portati a 12 px (menu «Roma è tua», badge «Nuovo», «Risparmi», area commerciante, mappa, indirizzi, galleria foto). Restano più piccoli solo i testi del pannello admin (uso da computer).
- Test automatico: `e2e/tests/locale/34-android-aree-toccabili.spec.js` (360×640, tocco): niente scroll orizzontale, FAQ e piè di pagina ≥ 44 px, nessun testo sotto 12 px nelle pagine pubbliche e commerciante.
- Dopo: testi sotto i 12 px da 46 a 0 nelle pagine controllate; scroll orizzontale sempre 0.

## Non cambiato (spiegazione)
- «Roma e dintorni – Dal centro alla periferia» nella home: **non era testo tagliato**. Lo strumento misurava una macchia sfocata decorativa; il testo va a capo correttamente (vedi schermate).
- «Diventa partner», «Iscriviti per usare lo sconto»: sono link che contengono un pulsante già alto; il pulsante è toccabile.
- Link dentro frasi (email, «Privacy Policy» nelle caselle, testi legali) e le scritte «Leaflet/OpenStreetMap» della mappa: restano piccoli (link in testo corrido, attribuzione obbligatoria).
- `index.html` e `manifest.json` **non toccati** in questa PR (li modifica la PR #151): restano da fare lì o dopo la sua unione: `theme-color` (#FFFFFF nella pagina, #0A0A0A nel manifest), icone PNG 192/512 in aggiunta alle SVG, `purpose` separati («any» e «maskable»), descrizione che cita ancora tre quartieri, eventuale service worker.

## Da provare a mano su un Android vero
Installazione sulla schermata Home da Chrome (banner e icona), tastiera vera (copertura dei campi, suggerimenti password), mappa con tasselli e posizione, scansione QR con la fotocamera, impronta/Face ID (WebAuthn), condivisione WhatsApp, rotazione dello schermo, risparmio dati, Samsung Internet e Firefox, dimensione carattere di sistema aumentata, tocchi veri su interruttore e caselle.
