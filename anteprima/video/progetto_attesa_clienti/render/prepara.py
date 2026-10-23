#!/usr/bin/env python3
"""Prepara la cartella di rendering (fuori dal repository): scena, linea del tempo, caratteri, QR e riprese in JPG.
Uso: OUT=<cartella privata> python3 prepara.py   (prima: riprese/riprese.js e qr.js)
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
# Numero WhatsApp di Sconti Roma: fuori dal repository pubblico, si passa al momento del rendering
tl = json.load(open(QUI / "copione_voce.json"))
tl["whatsapp"] = os.environ.get("CONTATTO_WHATSAPP", "").strip()
assert tl["whatsapp"], "manca CONTATTO_WHATSAPP (es. CONTATTO_WHATSAPP='nnn nnn nnnn')"
json.dump(tl, open(R / "timeline.json", "w"), ensure_ascii=False)
# Manrope del sito (licenza OFL), con indirizzi relativi perché la scena si apre da file
for f in (ROOT / "frontend/public/fonts").iterdir():
    if f.suffix in (".woff2", ".txt"):
        shutil.copy(f, R / "fonts" / f.name)
css = (ROOT / "frontend/public/fonts/fonts.css").read_text().replace("url(/fonts/", "url(")
(R / "fonts" / "fonts.css").write_text(css)
assert (R / "qr.svg").exists(), "manca qr.svg: NODE_PATH=frontend/node_modules node qr.js $OUT/render/qr.svg"
for n in ["home", "offerte", "attesa_vuoto", "attesa_pieno", "attesa_grazie"]:
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(OUT / "app" / f"{n}.png"), "-q:v", "2", str(R / "app" / f"{n}.jpg")], check=True)
print("pronto:", R, "durata", json.load(open(R / "timeline.json"))["durata"])
