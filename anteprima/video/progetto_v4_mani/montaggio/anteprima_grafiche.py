#!/usr/bin/env python3
"""Foglio di controllo delle scene illustrate: 5 fotogrammi per scena con le scritte sovrapposte e,
tratteggiate, le zone sicure (270 px in alto, 380 px in basso, 60 px ai lati).
Uso: python3 anteprima_grafiche.py <scena> <file_uscita.png>"""
import json
import os
import sys
from PIL import Image, ImageDraw

AQUI = os.path.dirname(os.path.abspath(__file__))
cop = json.load(open(os.path.join(AQUI, "copione.json")))
scena = next(s for s in cop["scene"] if s["id"] == sys.argv[1])
dirf = os.path.join(AQUI, "frames", scena["id"])
n = len(os.listdir(dirf))
tempi = [int(n * k) for k in (0.08, 0.3, 0.5, 0.72, 0.97)]
fogli = []
for i in tempi:
    im = Image.open(os.path.join(dirf, f"f{i:04d}.jpg")).convert("RGBA")
    t = i / 30
    for sc in scena["scritte"]:
        if sc["da"] <= t:
            im.alpha_composite(Image.open(os.path.join(AQUI, "img", sc["img"] + ".png")).convert("RGBA"))
    d = ImageDraw.Draw(im)
    for y in (270, 1540):
        d.line((0, y, 1080, y), fill=(0, 160, 255, 255), width=3)
    d.line((60, 0, 60, 1920), fill=(0, 160, 255, 255), width=3)
    d.line((1020, 0, 1020, 1920), fill=(0, 160, 255, 255), width=3)
    fogli.append(im.convert("RGB").resize((360, 640)))
W = Image.new("RGB", (360 * len(fogli), 640), "white")
for k, f in enumerate(fogli):
    W.paste(f, (360 * k, 0))
W.save(sys.argv[2])
