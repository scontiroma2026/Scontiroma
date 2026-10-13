#!/usr/bin/env bash
# Estrae 6 fotogrammi PNG dal master e copia l'anteprima leggera in una cartella FUORI dal repository.
# Uso: bash fotogrammi.sh <cartella_uscita>
set -e
AQUI="$(cd "$(dirname "$0")" && pwd)"
OUT="$1"; mkdir -p "$OUT"
M="$AQUI/export/scontiroma_clienti_v1_muto_master.mp4"
cp "$AQUI/export/scontiroma_clienti_v1_muto_anteprima.mp4" "$OUT/"
f() { ffmpeg -hide_banner -loglevel error -y -ss "$1" -i "$M" -frames:v 1 "$OUT/$2.png"; }
f 1.8  f1_titolo
f 14   f2_registrazione
f 27   f3_catalogo_badge
f 46.5 f4_sconto_valido
f 60   f5_costi
f 65.5 f6_chiusura
# miniature piccole per il repository (schermate/)
mkdir -p "$AQUI/../schermate"
for p in "$OUT"/f*.png; do b=$(basename "$p" .png); ffmpeg -hide_banner -loglevel error -y -i "$p" -vf scale=540:-1 -q:v 5 "$AQUI/../schermate/fotogramma_$b.jpg"; done
