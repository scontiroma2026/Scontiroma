# Video v16 per i commercianti: come si rifà

Sorgenti leggeri in `render/` (scena HTML, linea del tempo) e `riprese/` (app di prova, riprese, audio). I file pesanti stanno nella cartella privata `$PRIV/v16/`.
1. Riprese: `riprese/avvia_riprese.sh` (server di prova in memoria con `seed_v16.py`; il sito di prova va costruito con API su `http://localhost:8011`), poi `PRIV=... node riprese/rec_v16.js` crea schermate intere e clip in `$PRIV/v16/app/`. Le clip si estraggono in fotogrammi (`ffmpeg -i clip.mp4 frames/<clip>/%05d.jpg`).
2. Guida: `PRIV=... node ../progetto_v15_commercianti/montaggio/guida_pagina.js` (pagina e riquadri dei passi in `$PRIV/gh/`).
3. Audio: `PRIV=... python3 riprese/mix_v16.py` (voce con 13 s di silenzio per la guida + musica allungata, ducking, -16 LUFS).
4. Scena: `PRIV=... python3 render/prepara.py`, poi `PRIV=... render/renderizza.sh <v|vc|q> <nome>` (v = 1080x1920 con scritte, vc = senza scritte, q = quadrato 1080x1080).
5. Versione WhatsApp: `ffmpeg -i master.mp4 -vf scale=720:1280 -c:v libx264 -crf 26 -maxrate 1300k -bufsize 2600k -c:a aac -b:a 96k -movflags +faststart leggera.mp4`.
Font: Manrope, Fraunces e Archivo Black (licenze libere, in `render/fonts.css` e nel repository del video dell'8 ottobre).
**Non pubblicare**: serve prima la validazione dei Termini da parte del consulente.
