# Video v15 per i commercianti: come si rifà

Solo sorgenti leggeri. Tutti i file pesanti (voce, clip, immagini, video) stanno in una cartella privata fuori dal repository.

Serve: `ffmpeg`, Python con Pillow, Node con Playwright (Chromium). Nessun servizio a pagamento.

1. Tenere nella cartella privata `$PRIV`: `voce_femminile_FINALE.mp3`, `app/` (le clip della v14: `clip_home`, `clip_catalogo`, `clip_offerta_form`, `clip_iscrizione`, `clip_qr_cliente`, `clip_banco`) e `guida/` (le 8 schermate di `docs/comunicazione/guida-negozi/img/` della PR #146).
2. Voce a circa -16 LUFS senza saturare: `ffmpeg -i voce_femminile_FINALE.mp3 -af "volume=3.0dB,alimiter=limit=0.84:attack=3:release=60:level=disabled,aresample=44100" -ac 1 $PRIV/export/voce_norm.wav`
3. Grafiche: `PRIV=$PRIV node montaggio/grafica.js`
4. Montaggio (uno per formato): `PRIV=$PRIV python3 montaggio/monta.py v|vc|q $PRIV/export/voce_norm.wav <nome>`
   `v` verticale 1080x1920 con scritte, `vc` verticale senza scritte, `q` quadrato 1080x1080.
5. Versione leggera per WhatsApp: `ffmpeg -i master.mp4 -vf scale=720:1280 -c:v libx264 -crf 27 -maxrate 1100k -bufsize 2200k -c:a aac -b:a 96k -movflags +faststart leggera.mp4`

I tempi (`a` in `montaggio/copione.json`) sono le pause della voce rilevate con `ffmpeg -af silencedetect=noise=-26dB:d=0.12`. Per un'altra voce vanno rifatti a mano.
Font: Manrope (licenza OFL) da `frontend/public/fonts/`.
**Non pubblicare**: serve prima la validazione dei Termini da parte del consulente.

## Consegna (cartella privata `export/`) e controlli
| File | Formato | Peso |
|---|---|---|
| `scontiroma_v15_commercianti_master.mp4` | 1080x1920, voce e scritte | 11,8 MB |
| `scontiroma_v15_commercianti_senza_scritte.mp4` | 1080x1920, voce, senza sottotitoli né testi sovrapposti | 11,1 MB |
| `scontiroma_v15_commercianti_leggera_whatsapp.mp4` | 720x1280, voce e scritte | 2,9 MB (sotto i 16 MB) |
| `scontiroma_v15_commercianti_quadrato.mp4` | 1080x1080, voce e scritte | 6,4 MB |
| `miniatura_v15_commercianti.png` | 1080x1920, titolo | 0,14 MB |

Controlli: durata 85,13 s (voce 84,35 s intera, 0,8 s di coda); loudness -16,3 LUFS in tutti i formati; la voce è stata portata a quel livello con +3 dB e limitatore (nessuna saturazione). Fotogrammi estratti a ogni pausa (36 fotogrammi): le scritte cambiano sulle pause della voce.
Da sapere: le clip dell'app (banco, QR) mostrano ancora «Menù di pesce» e un negozio d'esempio, perché sono le riprese della v14; l'esempio a voce parla di menù di carne. Per rifarle serve rigirare le clip dall'app di prova.
