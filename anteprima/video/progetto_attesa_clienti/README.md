# Video di attesa per i clienti: come si rifà

Nel repository solo copione e script. Video, audio, riprese e fotogrammi stanno nella cartella privata `$OUT` (fuori dal repository); i file finali in `$OUT/export/`.

1. **Sito locale**: `E2E_API_URL=http://localhost:8012 bash e2e/scripts/build-sito.sh` (cartella `frontend/build-e2e`, puntata al server locale).
2. **Server e dati finti**: `OUT=... VENV=<venv del backend> BUILD=frontend/build-e2e riprese/avvia_riprese.sh` — sito su 3012, API su 8012, database **mongomock in memoria** (e2e/server_e2e.py rifiuta database non locali), quattro negozi finti creati da `riprese/seed_attesa.py`.
3. **Riprese**: `OUT=... node riprese/riprese.js` — schermate «iPhone» 3x di home, offerte e lista d'attesa (pre-lancio acceso solo sul server locale con `/__e2e/prelancio`, poi rispento). Ogni richiesta esterna è bloccata; prezzi, percentuali e zone sono nascosti.
4. **QR**: `NODE_PATH=frontend/node_modules node render/qr.js $OUT/render/qr.svg` (stessa libreria del sito, `https://scontiroma.it/?fonte=video-attesa`).
5. **Scena**: `OUT=... CONTATTO_WHATSAPP='nnn nnn nnnn' python3 render/prepara.py` (copia scena, Manrope, riprese in JPG; aggiunge il numero alla linea del tempo).
6. **Video**: `OUT=... VOCE=<voce_16s.mp3> render/renderizza.sh` — taglio della frase «Niente da scaricare per ora:» (`taglio_voce` in `copione_voce.json`, dissolvenze di 30 ms), voce a -16 LUFS (loudnorm in due passaggi), fotogrammi 30 fps dei due formati con Playwright, montaggio, versione WhatsApp (720x1280) e miniatura PNG.
7. **Controllo**: `OUT=... render/controlla.sh` — durate, loudness e fogli dei fotogrammi principali (inizio, cambi scena, fine) dei due formati.
8. Chiudere sito e server locali alla fine.

Tempi dei sottotitoli: `python3 render/silenzi.py <voce.mp3>` stampa le pause (silencedetect); i tagli scelti sono in `render/copione_voce.json`.
Font: Manrope da `frontend/public/fonts/` (licenza OFL). Foto: libreria del sito (licenza Unsplash, `frontend/public/esempi/LICENZA.txt`). Cornetta del glifo WhatsApp: Material Icons «call» (Apache 2.0).
**Non pubblicare** senza l'OK del titolare.
