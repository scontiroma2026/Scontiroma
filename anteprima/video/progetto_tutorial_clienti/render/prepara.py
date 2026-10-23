#!/usr/bin/env python3
"""Prepara la cartella di rendering (fuori dal repository): scena, linea del tempo con le posizioni misurate,
caratteri, QR e riprese in JPG.
Uso: OUT=<cartella privata> CONTATTO_WHATSAPP='nnn nnn nnnn' python3 prepara.py   (prima: riprese/riprese.js e qr.js)
"""
import json
import os
import shutil
import subprocess
from pathlib import Path

QUI = Path(__file__).resolve().parent
ROOT = QUI.parents[3]
OUT = Path(os.environ["OUT"]); R = OUT / "render"
(R / "app").mkdir(parents=True, exist_ok=True); (R / "fonts").mkdir(exist_ok=True)
shutil.copy(QUI / "scene.html", R / "scene.html")
tl = json.load(open(QUI / "copione_voce.json"))
# Numero WhatsApp di Sconti Roma: fuori dal repository pubblico, si passa al momento del rendering
tl["whatsapp"] = os.environ.get("CONTATTO_WHATSAPP", "").strip()
assert tl["whatsapp"], "manca CONTATTO_WHATSAPP (es. CONTATTO_WHATSAPP='nnn nnn nnnn')"
# Riquadri da evidenziare: misurati da riprese.js; i distintivi stanno in basso a sinistra della foto (4:3) della scheda
pos = json.load(open(OUT / "app" / "posizioni.json"))
for nome, chiave, larg in [("badge_pizza", "card_pizza", 480), ("badge_bar", "card_bar", 350)]:
    x, y, w, _ = pos[chiave]
    pos[nome] = [x + 24, y + round(w * 3 / 4) - 132, larg, 108]
tl["posizioni"] = pos
json.dump(tl, open(R / "timeline.json", "w"), ensure_ascii=False)
for f in (ROOT / "frontend/public/fonts").iterdir():
    if f.suffix in (".woff2", ".txt"):
        shutil.copy(f, R / "fonts" / f.name)
css = (ROOT / "frontend/public/fonts/fonts.css").read_text().replace("url(/fonts/", "url(")
(R / "fonts" / "fonts.css").write_text(css)
assert (R / "qr.svg").exists(), "manca qr.svg: NODE_PATH=frontend/node_modules node qr.js $OUT/render/qr.svg"
for n in sorted({i["img"] for i in tl["inquadrature"]}):
    # la home si usa solo in alto: si taglia a 4000 px (meno memoria nel browser)
    vf = ["-vf", "crop=iw:min(ih\\,4000):0:0"] if n == "home" else []
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(OUT / "app" / f"{n}.png"), *vf, "-q:v", "2", str(R / "app" / f"{n}.jpg")], check=True)
print("pronto:", R, "durata", tl["durata"])
