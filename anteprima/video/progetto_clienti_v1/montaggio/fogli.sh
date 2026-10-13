#!/usr/bin/env bash
# Fogli di anteprima per guardare a occhio le clip: 8 fotogrammi per clip. Uso: bash fogli.sh <cartella_uscita>
set -e
AQUI="$(cd "$(dirname "$0")" && pwd)"
OUT="$1"; mkdir -p "$OUT"
for f in "$AQUI"/../app/clip_*.mp4; do
  n=$(basename "$f" .mp4)
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
  echo "$n $d"
  ffmpeg -hide_banner -loglevel error -y -i "$f" -vf "fps=8/$d,scale=270:-1,tile=8x1" -frames:v 1 "$OUT/$n.png"
done
