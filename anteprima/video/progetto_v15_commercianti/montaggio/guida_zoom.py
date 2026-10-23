#!/usr/bin/env python3
"""Percorso sulla guida per i negozi con zoom progressivo (effetto «pinch» dello smartphone):
pagina intera, poi avvicinamento ai passi 1, 2 e 3 con pause di lettura, poi di nuovo la pagina intera.
Uso: PRIV=... python3 guida_zoom.py <v|vc|q> <uscita.mp4>
Legge PRIV/gh/pagina.png e celle.json (guida_pagina.js). Le didascalie sono png trasparenti di grafica.js (PRIV/img/<fmt>_gcap_k.png).
"""
import json, math, os, subprocess, sys
from PIL import Image

PRIV = os.environ["PRIV"]; FMT, OUT = sys.argv[1], sys.argv[2]
W, H = (1080, 1080) if FMT == "q" else (1080, 1920)
FPS = 30
Z = 4.0                      # la pagina è stata resa a 4x
pg = Image.open(f"{PRIV}/gh/pagina.png").convert("RGB")
meta = json.load(open(f"{PRIV}/gh/celle.json"))
celle = {c["t"][:2] if c["t"][0].isdigit() else c["t"]: c for c in meta["celle"]}
FONDO = (242, 240, 235)
PW, PH = pg.size
x0 = meta["pagina"]["x"]


def centro(c):  # centro del riquadro in pixel della pagina resa
    return ((c["x"] - x0 + c["w"] / 2) * Z, (c["y"] + c["h"] / 2) * Z)


def vista(cx, cy, w):
    """Frame W x H che mostra la regione larga w (pixel della pagina) centrata in (cx, cy)."""
    h = w * H / W
    box = (cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2)
    ix0, iy0, ix1, iy1 = max(box[0], 0), max(box[1], 0), min(box[2], PW), min(box[3], PH)
    out = Image.new("RGB", (W, H), FONDO)
    if ix1 <= ix0 or iy1 <= iy0:
        return out
    s = W / w
    part = pg.crop((int(ix0), int(iy0), int(math.ceil(ix1)), int(math.ceil(iy1))))
    part = part.resize((max(1, round(part.width * s)), max(1, round(part.height * s))), Image.LANCZOS)
    out.paste(part, (round((ix0 - box[0]) * s), round((iy0 - box[1]) * s)))
    return out


def liscio(q):
    return q * q * (3 - 2 * q)


full = (PW / 2, PH / 2, PW * 1.0)
def passo(k):
    cx, cy = centro(celle[k]); return (cx, cy, celle[k]["w"] * Z * 1.10)
S1, S2, S3 = passo("1R"), passo("2S"), passo("3A")
# (tempo di arrivo, punto, durata della pausa dopo l'arrivo); tra due passi si «allarga» un po' e si riavvicina
percorso = [(0.0, full, 1.6)]
t = 1.6
for i, s in enumerate((S1, S2, S3)):
    if i:
        a, b = percorso[-1][1], s
        percorso.append((t + 0.55, ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, max(a[2], b[2]) * 1.35), 0.0)); t += 0.55
    t += 1.1; percorso.append((t, s, 2.6 if i < 2 else 2.4)); t += percorso[-1][2]
t += 1.2; percorso.append((t, full, 0.8)); t += 0.8
DUR = t
print("durata guida %.2f s" % DUR)

def stato(tt):
    for (ta, pa, pausa), (tb, pb, _) in zip(percorso, percorso[1:]):
        if tt < ta + pausa:
            return pa
        if tt < tb:
            q = liscio((tt - ta - pausa) / (tb - ta - pausa))
            lw = math.exp(math.log(pa[2]) + (math.log(pb[2]) - math.log(pa[2])) * q)
            return (pa[0] + (pb[0] - pa[0]) * q, pa[1] + (pb[1] - pa[1]) * q, lw)
    return percorso[-1][1]


cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
       "-c:v", "libx264", "-crf", "17", "-pix_fmt", "yuv420p", OUT]
pr = subprocess.Popen(cmd, stdin=subprocess.PIPE)
n = int(DUR * FPS)
for i in range(n):
    pr.stdin.write(vista(*stato(i / FPS)).tobytes())
pr.stdin.close(); pr.wait()
json.dump({"durata": DUR, "punti": [(a, p[2], c) for a, p, c in percorso]}, open(OUT + ".json", "w"))
