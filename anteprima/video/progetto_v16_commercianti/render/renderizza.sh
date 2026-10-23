#!/bin/bash
# Rende i fotogrammi (30 fps) di un formato in 4 blocchi paralleli e li unisce alla traccia audio.
# Uso: PRIV=... ./renderizza.sh <v|vc|q> <nome_file_uscita>
cd "$(dirname "$0")" || exit 1
M=$1; NOME=$2; FR="$PRIV/v16/fr_$M"; EXP="$PRIV/export"; mkdir -p "$EXP"
rm -rf "$FR"; mkdir -p "$FR"
FINE=$(python3 -c "import json;print(json.load(open('$PRIV/v16/render/timeline.json'))['scenes']['s9'][1])")
node render.js $M 0 24.5 $FR/a > $FR/log_a.txt 2>&1 &
node render.js $M 24.5 49 $FR/b > $FR/log_b.txt 2>&1 &
node render.js $M 49 73.5 $FR/c > $FR/log_c.txt 2>&1 &
node render.js $M 73.5 $FINE $FR/d > $FR/log_d.txt 2>&1 &
wait
mkdir -p $FR/seq; n=0; for d in a b c d; do for f in $FR/$d/*.jpg; do ln -s "$f" $FR/seq/$(printf %05d $n).jpg; n=$((n+1)); done; done
echo "fotogrammi $M: $n"
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i $FR/seq/%05d.jpg -i $PRIV/v16/stems/mix16.wav -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "$EXP/$NOME.mp4"
ls -la "$EXP/$NOME.mp4"
rm -rf "$FR"
