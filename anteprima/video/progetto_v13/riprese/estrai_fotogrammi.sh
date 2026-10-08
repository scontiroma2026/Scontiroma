#!/bin/bash
# Estrae i fotogrammi (30 fps) delle clip in app/frames/<clip>/NNNNN.jpg; scrive il numero di fotogrammi.
cd "$(dirname "$0")/../app" || exit 1
for n in clip_iscrizione clip_form_offerta clip_qr_cliente clip_qr_conferma; do
  rm -rf frames/$n && mkdir -p frames/$n
  ffmpeg -hide_banner -loglevel error -y -i $n.mp4 -qscale:v 3 frames/$n/%05d.jpg
  echo "$n $(ls frames/$n | wc -l)"
done
