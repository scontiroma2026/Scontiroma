# Video v15 per i commercianti: come si rifà

Solo sorgenti leggeri. Tutti i file pesanti (voce, clip, immagini, video) stanno in una cartella privata fuori dal repository.

Serve: `ffmpeg`, Python con Pillow, Node con Playwright (Chromium). Nessun servizio a pagamento.

1. Tenere nella cartella privata `$PRIV`: `voce_femminile_FINALE.mp3`, `foto/` (le foto di prova; `riprese/gen_foto_carne.js` crea l'illustrazione del menù di carne) e `gh/guida.html` con le immagini della guida (da `docs/comunicazione/guida-negozi/` della PR #146, con il percorso dei caratteri puntato a `frontend/public/fonts`).
1b. Riprese dell'app: `riprese/avvia_riprese.sh` (server di prova in memoria, dati inventati) e `PRIV=... node riprese/rec_clip.js tutte` creano `$PRIV/app15/clip_*.mp4`. Il sito di prova va costruito con l'indirizzo API `http://localhost:8011`.
1c. Guida: `PRIV=... node montaggio/guida_pagina.js`, poi `PRIV=... python3 montaggio/guida_zoom.py v $PRIV/seg/v_guida.mp4` (e `q`; per `vc` si copia quella di `v`, con il suo `.json`).
2. Voce a circa -16 LUFS senza saturare: `ffmpeg -i voce_femminile_FINALE.mp3 -af "volume=3.0dB,alimiter=limit=0.84:attack=3:release=60:level=disabled,aresample=44100" -ac 1 $PRIV/export/voce_norm.wav`
3. Grafiche: `PRIV=$PRIV node montaggio/grafica.js`
4. Montaggio (uno per formato): `PRIV=$PRIV python3 montaggio/monta.py v|vc|q $PRIV/export/voce_norm.wav <nome>`
   `v` verticale 1080x1920 con scritte, `vc` verticale senza scritte, `q` quadrato 1080x1080.
5. Versione leggera per WhatsApp: `ffmpeg -i master.mp4 -vf scale=720:1280 -c:v libx264 -crf 26 -maxrate 1300k -bufsize 2200k -c:a aac -b:a 96k -movflags +faststart leggera.mp4`

I tempi (`a` in `montaggio/copione.json`) sono le pause della voce rilevate con `ffmpeg -af silencedetect=noise=-26dB:d=0.12`. Per un'altra voce vanno rifatti a mano.
Font: Manrope (licenza OFL) da `frontend/public/fonts/`.
**Non pubblicare**: serve prima la validazione dei Termini da parte del consulente.

## Consegna (cartella privata `export/`) e controlli
| File | Formato | Peso |
|---|---|---|
| `scontiroma_v15_commercianti_master.mp4` | 1080x1920, voce e scritte | 17,3 MB |
| `scontiroma_v15_commercianti_senza_scritte.mp4` | 1080x1920, voce, senza sottotitoli né scritte grafiche | 16,3 MB |
| `scontiroma_v15_commercianti_leggera_whatsapp.mp4` | 720x1280, voce e scritte | 4,2 MB (sotto i 16 MB) |
| `scontiroma_v15_commercianti_quadrato.mp4` | 1080x1080, voce e scritte | 10,8 MB |
| `miniatura_v15_commercianti.png` | 1080x1920, titolo | 0,14 MB |

Controlli: durata 101,7 s (voce 84,35 s intera, seguita da guida e scheda finale senza parlato); loudness -16,3 LUFS in tutti i formati, senza saturare (+3 dB e limitatore). Fotogrammi controllati a ogni pausa della voce e a ogni scena, anche a 1080x1920 (testi della guida e dell'app leggibili). Le clip scorrono a velocità costante, senza accelerazioni.
