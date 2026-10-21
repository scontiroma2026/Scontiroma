#!/bin/bash
# Controllo dei video esportati: durata, loudness della voce e foglio dei fotogrammi principali
# (inizio, ogni cambio scena, fine) per ciascun formato. Uso: OUT=<cartella privata> ./controlla.sh
set -euo pipefail
EXP="$OUT/export"
for f in "$EXP"/*.mp4; do
  echo "$(basename "$f"): $(ffprobe -v error -show_entries format=duration,size -of csv=p=0 "$f")"
done
ffmpeg -hide_banner -i "$EXP/sconti_roma_attesa_verticale_1080x1920.mp4" -af loudnorm=print_format=summary -f null - 2>&1 | grep -E "Input Integrated|Input True Peak"
# 0,2 inizio | 1,7 / 2,3 gancio→home | 3,2 / 3,9 home→offerte | 6,4 / 7,3 offerte→modulo | 9,0 email | 10,2 grazie | 11,3 finale | 13,0 18+ | 16,3 fine (contatti)
T="0.2 1.7 2.3 3.2 3.9 6.4 7.3 9.0 10.2 11.3 13.0 16.3"
for M in verticale_1080x1920 quadrato_1080x1080; do
  rm -rf "$OUT/chk_$M"; mkdir -p "$OUT/chk_$M"; i=0
  for t in $T; do ffmpeg -hide_banner -loglevel error -y -ss "$t" -i "$EXP/sconti_roma_attesa_$M.mp4" -frames:v 1 "$OUT/chk_$M/$(printf %02d $i).jpg"; i=$((i+1)); done
  ffmpeg -hide_banner -loglevel error -y -i "$OUT/chk_$M/%02d.jpg" -vf "scale=300:-1,tile=6x2:padding=4" -frames:v 1 "$OUT/foglio_$M.jpg"
done
echo "fogli: $OUT/foglio_*.jpg"
