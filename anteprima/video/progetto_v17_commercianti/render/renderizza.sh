#!/bin/bash
# Rende i fotogrammi (30 fps) di un formato in 4 blocchi paralleli e li unisce alla traccia audio.
# Se un blocco resta incompleto (browser chiuso per memoria o altro) lo rifà, fino a 3 volte; se resta incompleto si ferma senza montare un video corto.
# Uso: PRIV=... ./renderizza.sh <v|vc|q> <nome_file_uscita>
cd "$(dirname "$0")" || exit 1
M=$1; NOME=$2; FR="$PRIV/v17/fr_$M"; EXP="$PRIV/export"; mkdir -p "$EXP"
[ -z "$RIUSA" ] && rm -rf "$FR"; mkdir -p "$FR"
FINE=$(python3 -c "import json;print(json.load(open('$PRIV/v17/render/timeline.json'))['scenes']['s9'][1])")
INI=(0 24.5 49 73.5); FIN=(24.5 49 73.5 $FINE); NOMI=(a b c d)
for prova in 1 2 3; do
  for i in 0 1 2 3; do
    d=${NOMI[$i]}
    ATT=$(python3 -c "import math;print(math.floor((${FIN[$i]}-${INI[$i]})*30+0.5))")
    if [ "$(ls $FR/$d 2>/dev/null | wc -l)" -ne "$ATT" ]; then
      rm -rf $FR/$d
      node render.js $M ${INI[$i]} ${FIN[$i]} $FR/$d > $FR/log_${d}_$prova.txt 2>&1 &
    fi
  done
  wait
done
mkdir -p $FR/seq; n=0
for i in 0 1 2 3; do
  d=${NOMI[$i]}; ATT=$(python3 -c "import math;print(math.floor((${FIN[$i]}-${INI[$i]})*30+0.5))")
  c=$(ls $FR/$d 2>/dev/null | wc -l)
  if [ "$c" -ne "$ATT" ]; then echo "ERRORE: blocco $d incompleto ($c di $ATT fotogrammi)"; exit 1; fi
  for f in $FR/$d/*.jpg; do ln -s "$f" $FR/seq/$(printf %05d $n).jpg; n=$((n+1)); done
done
echo "fotogrammi $M: $n"
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i $FR/seq/%05d.jpg -i $PRIV/v17/stems/mix17.wav -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "$EXP/$NOME.mp4"
ls -la "$EXP/$NOME.mp4"
rm -rf "$FR"
