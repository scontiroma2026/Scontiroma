"""Dopo rec_v17.js: ritaglia le schermate intere e copre la data di scadenza nelle dashboard (come nella v16).
- elenco sconti = intestazione (primi 228 px) + ultimi tre riquadri (px 6252-9900 della pagina intera, 10422 px);
- home e dashboard = primi 4500 px;
- dashboard: la riga «Offerta visibile ai clienti fino al ...» (px 480-620) si copre con la stessa fascia delle dashboard della v16
  ($PRIV/v16/app/, senza la scritta; il layout è identico).
Poi estrae i fotogrammi delle clip: ffmpeg -i clip.mp4 -q:v 2 frames/<clip>/%05d.jpg
Uso: PRIV=... python3 post_riprese.py"""
import glob, os, subprocess
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
PRIV = os.environ["PRIV"]; A = f"{PRIV}/v17/app/"
im = Image.open(A + "sconti_full.png").convert("RGB")
im.save(A + "sconti_full_orig.png")
assert im.size[1] == 10422, im.size
c = Image.new("RGB", (1170, 3876), "white")
c.paste(im.crop((0, 0, 1170, 228)), (0, 0)); c.paste(im.crop((0, 6252, 1170, 9900)), (0, 228)); c.save(A + "sconti_full.png")
for n in ("home_full", "dashboard_full", "dashboard_enoteca_full"):
    i = Image.open(A + n + ".png").convert("RGB"); i = i.crop((0, 0, i.size[0], 4500))
    if n.startswith("dashboard"):
        v16 = Image.open(f"{PRIV}/v16/app/{n}.png").convert("RGB")
        i.paste(v16.crop((0, 480, 1170, 620)), (0, 480))
    i.save(A + n + ".png")
for clip in ("clip_form_offerta", "clip_iscrizione", "clip_qr_cliente", "clip_qr_conferma"):
    d = f"{A}frames/{clip}"; os.makedirs(d, exist_ok=True)
    for f in glob.glob(d + "/*.jpg"): os.remove(f)
    subprocess.check_call(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", f"{A}{clip}.mp4", "-q:v", "2", d + "/%05d.jpg"])
print("fatto")
