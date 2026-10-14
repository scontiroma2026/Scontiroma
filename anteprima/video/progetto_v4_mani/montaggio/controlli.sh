#!/usr/bin/env bash
# Controlli sul video finito: durata, risoluzione, fps, tracce, fotogrammi neri, volume dell'audio + fogli di anteprima
# (un fotogramma al secondo; il secondo foglio ha le zone sicure tratteggiate: 270 px in alto, 380 px in basso, 60 px ai lati).
# Uso: bash controlli.sh <cartella_con_i_mp4> <cartella_uscita_fogli>
set -e
V="$1"; OUT="$2"; mkdir -p "$OUT"
for f in master senza_scritte leggera; do
  p="$V/scontiroma_v4_mani_$f.mp4"
  echo "== $f"
  ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,avg_frame_rate,pix_fmt,channels:format=duration,size -of compact "$p"
  echo -n "tracce di sottotitoli: "; ffprobe -v error -select_streams s -show_entries stream=index -of csv=p=0 "$p" | wc -l
  echo -n "fotogrammi neri: "; ffmpeg -hide_banner -i "$p" -vf blackdetect=d=0.05:pix_th=0.08 -an -f null - 2>&1 | grep -c black_start || true
  echo -n "volume audio: "; ffmpeg -hide_banner -i "$p" -af volumedetect -vn -f null - 2>&1 | grep -E "max_volume" || true
done
M="$V/scontiroma_v4_mani_master.mp4"
ffmpeg -hide_banner -loglevel error -y -i "$M" -vf "fps=1,scale=216:384,tile=9x4" -frames:v 1 "$OUT/foglio_master.png"
ffmpeg -hide_banner -loglevel error -y -i "$M" -vf "fps=1,drawbox=x=0:y=270:w=1080:h=3:color=cyan@0.9:t=fill,drawbox=x=0:y=1540:w=1080:h=3:color=cyan@0.9:t=fill,drawbox=x=60:y=0:w=3:h=1920:color=cyan@0.9:t=fill,drawbox=x=1017:y=0:w=3:h=1920:color=cyan@0.9:t=fill,scale=216:384,tile=9x4" -frames:v 1 "$OUT/foglio_zone_sicure.png"
