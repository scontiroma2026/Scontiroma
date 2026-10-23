#!/usr/bin/env python3
"""Prepara la cartella di rendering privata ($PRIV/v16/render): scena, linea del tempo, sottotitoli, dati della guida.
Tempi: voce femminile finale (pause da silencedetect), con N secondi di musica senza voce inseriti dopo l'enoteca per la guida.
Uso: PRIV=... python3 prepara.py"""
import json, os, re, shutil, glob
AQUI = os.path.dirname(os.path.abspath(__file__)); PRIV = os.environ["PRIV"]; R = f"{PRIV}/v16/render"
N = 13.0               # secondi della guida (musica, nessuna voce)
PUNTO = 51.51          # la guida si inserisce qui (pausa dopo «la giacenza»)
FINE_VOCE = 84.35
def sh(t): return t + N if t >= PUNTO - 0.01 else t
SC = {"s1": [0, 5.54], "s2": [5.54, 15.24], "s3": [15.24, 18.65], "s4": [18.65, 31.24, 27.03], "s5": [31.24, 43.47], "s5b": [43.47, 51.51],
      "sg": [51.51, 51.51 + N], "s6": [sh(51.51), sh(58.83), sh(54.70)], "s7": [sh(58.83), sh(79.15)], "s9": [sh(79.15), sh(FINE_VOCE) + 0.8, sh(82.65)]}
SC = {k: [round(x, 2) for x in v] for k, v in SC.items()}
cop = json.load(open(f"{AQUI}/copione_voce.json"))
caps = []
segs = [s for p in cop["parti"] for s in p.get("segmenti", []) if "a" in s]
for i, s in enumerate(segs):
    h = (s["t"] or s["v"]); h = re.sub(r"<b>", "<b class=c>", h)
    a = sh(s["a"]); b = sh(segs[i + 1]["a"]) if i + 1 < len(segs) else sh(FINE_VOCE)
    if i + 1 < len(segs) and s["a"] < PUNTO <= segs[i + 1]["a"] + 0.01: b = PUNTO       # la frase prima della guida finisce lì
    caps.append({"a": round(a, 2), "b": round(b - 0.04, 2), "h": h})
sf = json.load(open(f"{AQUI}/sfondi.json"))
cel = json.load(open(f"{PRIV}/gh/celle.json"))
by = {c["t"][:2]: c for c in cel["celle"] if c["t"][0].isdigit()}
guida = {"zoom": 4, "w": 4488, "h": 3172, "x0": cel["pagina"]["x"], "passi": [by["1R"], by["2S"], by["3A"]]}
nf = {n: len(glob.glob(f"{PRIV}/v16/app/frames/{n}/*.jpg")) for n in ("clip_form_offerta", "clip_iscrizione", "clip_qr_cliente", "clip_qr_conferma")}
data = {"scenes": SC, "captions": caps, "sfondi": sf, "guida": guida, "nframes": nf, "preload": []}
json.dump(data, open(f"{R}/timeline.json", "w"), ensure_ascii=False, indent=1)
shutil.copy(f"{AQUI}/scene.html", f"{R}/scene.html")
os.makedirs(f"{PRIV}/v16/app", exist_ok=True)
shutil.copy(f"{PRIV}/gh/pagina.png", f"{PRIV}/v16/app/guida_pagina.png")
print("scene", SC); print("fotogrammi clip", nf); print("sottotitoli", len(caps))
