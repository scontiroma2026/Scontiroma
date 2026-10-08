#!/bin/bash
# Montaggio della v13: fotogrammi render/fr/{a,b,c,d} + stems/mix.wav (voce e musica della v9, invariate)
# Esce in export/ (git-ignored): master, versione WhatsApp (<= 16 MB) e versione social.
set -e
cd "$(dirname "$0")"
mkdir -p export
rm -rf render/seq && mkdir -p render/seq
n=0; for d in a b c d; do for f in render/fr/$d/*.jpg; do ln -s "$(realpath $f)" render/seq/$(printf %05d $n).jpg; n=$((n+1)); done; done
echo "fotogrammi: $n"
IN="-framerate 30 -i render/seq/%05d.jpg -i stems/mix.wav"
ffmpeg -hide_banner -loglevel error -y $IN -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart export/scontiroma_v13_master.mp4
# 2 passaggi: WhatsApp 1250 kb/s (circa 15 MB per 84 s), social 1600 kb/s (circa 18 MB)
codifica() {  # nome, kb/s video, kb/s audio
  for p in 1 2; do
    ffmpeg -hide_banner -loglevel error -y $IN -c:v libx264 -preset slow -b:v $2k -maxrate $(( $2 * 2 ))k -bufsize $(( $2 * 4 ))k -pix_fmt yuv420p -pass $p -passlogfile render/x264pass_$1 \
      $( [ $p = 1 ] && echo "-an -f mp4 /dev/null" || echo "-c:a aac -b:a ${3}k -ar 44100 -shortest -movflags +faststart export/scontiroma_v13_$1_1080x1920.mp4" )
  done
}
codifica whatsapp 1250 128
codifica social_reel 1600 160
ls -la export/*.mp4
