# Video tutorial per i clienti: come si rifà

Nel repository solo copione e script. Video, audio, riprese e fotogrammi stanno nella cartella privata `$OUT` (fuori dal repository); i file finali in `$OUT/export/`.

1. **Sito locale**: `E2E_API_URL=http://localhost:8013 bash e2e/scripts/build-sito.sh` (cartella `frontend/build-e2e`, puntata al server locale).
2. **Server e dati finti**: `OUT=... VENV=<venv del backend> BUILD=frontend/build-e2e riprese/avvia_riprese.sh` — sito su 3013, API su 8013, database **mongomock in memoria** (e2e/server_e2e.py rifiuta database non locali). `riprese/seed_tutorial.py` crea quattro negozi finti e un cliente di prova; il Bar è «retrodatato» (rotta di prova `/__video/retrodata`, solo qui) per mostrare il distintivo «Nuova offerta» accanto a «Nuovo su Sconti Roma».
3. **Riprese**: `OUT=... node riprese/riprese.js` — schermate «iPhone» 3x di home, registrazione (vuota e compilata), offerte, pagina dell'offerta e «Mostra QR Code»; misura anche la posizione dei riquadri da evidenziare (`$OUT/app/posizioni.json`). Richieste esterne bloccate; prezzi, percentuali e zone nascosti; QR dell'app sfocato.
4. **Tempi della voce**: `python3 render/silenzi.py <voce.mp3>` (pause) e `python3 render/inviluppo.py <voce.mp3> 25.9 27.4` (chiusure delle consonanti dentro una frase). Tagli e sottotitoli in `render/copione_voce.json`.
5. **QR**: `NODE_PATH=frontend/node_modules node render/qr.js $OUT/render/qr.svg` (`https://scontiroma.it/?fonte=video-tutorial`).
6. **Scena**: `OUT=... CONTATTO_WHATSAPP='nnn nnn nnnn' python3 render/prepara.py`.
7. **Video**: `OUT=... VOCE=<voce_66s.mp3> render/renderizza.sh` — tagli della voce con dissolvenze di 30 ms, -16 LUFS (loudnorm in due passaggi), fotogrammi 30 fps dei due formati (il browser si riapre ogni 300 fotogrammi), montaggio, versione WhatsApp e miniatura.
8. **Controllo**: `OUT=... render/controlla.sh` — durate, loudness, QR del finale e fogli dei fotogrammi principali.
9. Chiudere sito e server locali alla fine.

Font: Manrope da `frontend/public/fonts/` (licenza OFL). Foto: libreria del sito (licenza Unsplash, `frontend/public/esempi/LICENZA.txt`). Cornetta del glifo WhatsApp: Material Icons «call» (Apache 2.0).
**Non pubblicare** senza l'OK del titolare.
