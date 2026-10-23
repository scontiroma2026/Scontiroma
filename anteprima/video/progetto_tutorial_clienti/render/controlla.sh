#!/bin/bash
# Controllo dei video esportati: durata, loudness della voce, QR del finale e foglio dei fotogrammi principali
# (inizio, ogni cambio scena, fine) per ciascun formato. Uso: OUT=<cartella privata> ./controlla.sh
set -euo pipefail
EXP="$OUT/export"
for f in "$EXP"/*.mp4; do
  echo "$(basename "$f"): $(ffprobe -v error -show_entries format=duration,size -of csv=p=0 "$f")"
done
ffmpeg -hide_banner -i "$EXP/sconti_roma_tutorial_verticale_1080x1920.mp4" -af loudnorm=print_format=summary -f null - 2>&1 | grep -E "Input Integrated|Input True Peak"
# 0,5 / 3,0 apertura | 5,5 home | 7,8 tre passi | 10,5 / 16,5 registrazione | 19 / 21,5 zona | 24,5 offerte | 27,5 / 31 distintivi
# 35 / 40 dettaglio | 44,5 contatti | 49,5 «Mostra QR Code» | 52 QR | 56 / 59,2 finale
T="0.5 3.0 5.5 7.8 10.5 16.5 19.0 21.5 24.5 27.5 31.0 35.0 40.0 44.5 49.5 52.0 56.0 59.2"
for M in verticale_1080x1920 quadrato_1080x1080; do
  rm -rf "$OUT/chk_$M"; mkdir -p "$OUT/chk_$M"; i=0
  for t in $T; do ffmpeg -hide_banner -loglevel error -y -ss "$t" -i "$EXP/sconti_roma_tutorial_$M.mp4" -frames:v 1 "$OUT/chk_$M/$(printf %02d $i).jpg"; i=$((i+1)); done
  ffmpeg -hide_banner -loglevel error -y -i "$OUT/chk_$M/%02d.jpg" -vf "scale=270:-1,tile=9x2:padding=4" -frames:v 1 "$OUT/foglio_$M.jpg"
  python3 -c "import cv2,sys;print('QR $M:', cv2.QRCodeDetector().detectAndDecode(cv2.imread(sys.argv[1]))[0] or 'NON LETTO')" "$OUT/chk_$M/17.jpg" || true
done
echo "fogli: $OUT/foglio_*.jpg"
