#!/bin/bash
# Audio (solo voce, nessuna musica, -16 LUFS in due passaggi, picco sotto -1,5 dBTP) e video nei due formati,
# più versione leggera per WhatsApp (< 10 MB) e miniatura PNG. Tutto in $OUT/export (fuori dal repository).
# Uso: OUT=<cartella privata> VOCE=<voce_16s.mp3> ./renderizza.sh      (prima: prepara.py)
set -euo pipefail
cd "$(dirname "$0")"
EXP="$OUT/export"; mkdir -p "$EXP"
DUR=$(python3 -c "import json;print(json.load(open('$OUT/render/timeline.json'))['durata'])")
# 1. voce a -16 LUFS, allungata con silenzio fino alla fine del video
MIS=$(ffmpeg -hide_banner -i "$VOCE" -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$MIS" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
LN="loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true"
ffmpeg -hide_banner -loglevel error -y -i "$VOCE" -af "$LN,aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur=$DUR" -t "$DUR" "$OUT/voce_16lufs.wav"
# 2. fotogrammi e video
for M in v q; do
  rm -rf "$OUT/fr_$M"; node render.js $M "$OUT/fr_$M"
done
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i "$OUT/fr_v/%05d.jpg" -i "$OUT/voce_16lufs.wav" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -shortest -movflags +faststart "$EXP/sconti_roma_attesa_verticale_1080x1920.mp4"
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i "$OUT/fr_q/%05d.jpg" -i "$OUT/voce_16lufs.wav" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -shortest -movflags +faststart "$EXP/sconti_roma_attesa_quadrato_1080x1080.mp4"
# 3. WhatsApp: 720x1280, bitrate limitato
ffmpeg -hide_banner -loglevel error -y -i "$EXP/sconti_roma_attesa_verticale_1080x1920.mp4" -vf scale=720:1280 -c:v libx264 -preset slow -crf 25 \
  -maxrate 1800k -bufsize 3600k -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart "$EXP/sconti_roma_attesa_whatsapp_720x1280.mp4"
# 4. miniatura: il finale con QR e indirizzo
cp "$OUT/fr_v/$(printf %05d $(python3 -c "print(int(16.2*30))")).jpg" "$OUT/min.jpg"
ffmpeg -hide_banner -loglevel error -y -i "$OUT/min.jpg" "$EXP/sconti_roma_attesa_miniatura.png"
rm -rf "$OUT/fr_v" "$OUT/fr_q" "$OUT/min.jpg"
ls -la "$EXP"
