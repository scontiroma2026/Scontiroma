#!/bin/bash
# Audio (solo voce montata, nessuna musica, -16 LUFS in due passaggi, picco sotto -1,5 dBTP) e video nei due formati,
# più versione leggera per WhatsApp (< 10 MB) e miniatura PNG. Tutto in $OUT/export (fuori dal repository).
# Uso: OUT=<cartella privata> VOCE=<voce_66s.mp3> ./renderizza.sh      (prima: prepara.py)
set -euo pipefail
cd "$(dirname "$0")"
EXP="$OUT/export"; mkdir -p "$EXP"
TL="$OUT/render/timeline.json"
DUR=$(python3 -c "import json;print(json.load(open('$TL'))['durata'])")
# 1. voce montata: si tolgono i tratti «tagli_voce» (tempi sulla voce originale), dissolvenze di 30 ms ai bordi di ogni pezzo
FILTRO=$(python3 - "$TL" <<'EOF'
import json, sys
tagli = json.load(open(sys.argv[1]))["tagli_voce"]
pezzi, inizio = [], 0.0
for a, b in tagli:
    pezzi.append((inizio, a)); inizio = b
pezzi.append((inizio, None))
f = [f"[0:a]aresample=48000,asplit={len(pezzi)}" + "".join(f"[s{i}]" for i in range(len(pezzi)))]
for i, (a, b) in enumerate(pezzi):
    tr = f"atrim={a}:{b}" if b is not None else f"atrim={a}"
    fi = ",afade=t=in:st=0:d=0.03" if i else ""
    fo = f",areverse,afade=t=in:st=0:d=0.03,areverse" if b is not None else ""
    f.append(f"[s{i}]{tr},asetpts=PTS-STARTPTS{fi}{fo}[p{i}]")
f.append("".join(f"[p{i}]" for i in range(len(pezzi))) + f"concat=n={len(pezzi)}:v=0:a=1[o]")
print(";".join(f))
EOF
)
ffmpeg -hide_banner -loglevel error -y -i "$VOCE" -filter_complex "$FILTRO" -map "[o]" "$OUT/voce_montata.wav"
# 2. voce a -16 LUFS (misura sulla voce montata), allungata con silenzio fino alla fine del video
MIS=$(ffmpeg -hide_banner -i "$OUT/voce_montata.wav" -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$MIS" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
LN="loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true"
ffmpeg -hide_banner -loglevel error -y -i "$OUT/voce_montata.wav" -af "$LN,aresample=48000,aformat=channel_layouts=stereo,apad=pad_dur=3" -t "$DUR" "$OUT/voce_16lufs.wav"
# 3. fotogrammi e video
for M in v q; do
  rm -rf "$OUT/fr_$M"; node render.js $M "$OUT/fr_$M"
done
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i "$OUT/fr_v/%05d.jpg" -i "$OUT/voce_16lufs.wav" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -shortest -movflags +faststart "$EXP/sconti_roma_tutorial_verticale_1080x1920.mp4"
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i "$OUT/fr_q/%05d.jpg" -i "$OUT/voce_16lufs.wav" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -shortest -movflags +faststart "$EXP/sconti_roma_tutorial_quadrato_1080x1080.mp4"
# 4. WhatsApp: 720x1280, bitrate limitato (sotto 10 MB)
ffmpeg -hide_banner -loglevel error -y -i "$EXP/sconti_roma_tutorial_verticale_1080x1920.mp4" -vf scale=720:1280 -c:v libx264 -preset slow -crf 26 \
  -maxrate 1200k -bufsize 2400k -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart "$EXP/sconti_roma_tutorial_whatsapp_720x1280.mp4"
# 5. miniatura: il finale con QR e contatti
cp "$OUT/fr_v/$(printf %05d $(python3 -c "print(int(58.4*30))")).jpg" "$OUT/min.jpg"
ffmpeg -hide_banner -loglevel error -y -i "$OUT/min.jpg" "$EXP/sconti_roma_tutorial_miniatura.png"
rm -rf "$OUT/fr_v" "$OUT/fr_q" "$OUT/min.jpg"
ls -la "$EXP"
