#!/usr/bin/env python3
"""Montaggio MUTO del video v14 (nessuna voce, nessuna musica): clip dell'app in ../app, grafiche in img/,
tempi da copione.json (stima a 15,5 caratteri al secondo: si ricalcolano quando c'è la voce vera).
Esce in export/ (fuori da git): master 1080x1920 e anteprima leggera. Uso: python3 monta.py
"""
import json
import os
import re
import subprocess
import sys
from PIL import Image, ImageDraw, ImageFilter

AQUI = os.path.dirname(os.path.abspath(__file__))
APP = os.path.join(AQUI, "..", "app")
IMG = os.path.join(AQUI, "img")
SEG = os.path.join(AQUI, "seg")
EXP = os.path.join(AQUI, "export")
for d in (SEG, EXP):
    os.makedirs(d, exist_ok=True)
FONDO = (242, 240, 235)
WX, WY, WW, WH, RAD = 90, 470, 900, 1398, 48   # finestra con l'app

cop = json.load(open(os.path.join(AQUI, "copione.json")))


def ffmpeg(*a):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *a], capture_output=True, text=True)
    if r.returncode:
        print(r.stderr)
        sys.exit(1)


def durata(f):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).strip())


# ---- sfondo con ombra della finestra e angoli arrotondati
bg = Image.new("RGB", (1080, 1920), FONDO)
ombra = Image.new("L", (1080, 1920), 0)
ImageDraw.Draw(ombra).rounded_rectangle((WX, WY + 14, WX + WW, WY + WH + 14), RAD, fill=70)
ombra = ombra.filter(ImageFilter.GaussianBlur(26))
bg.paste(Image.new("RGB", bg.size, (40, 30, 70)), mask=ombra)
bg.save(os.path.join(SEG, "bg.png"))
ang = Image.new("RGBA", (WW, WH), FONDO + (255,))
mask = Image.new("L", (WW * 4, WH * 4), 0)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, WW * 4 - 1, WH * 4 - 1), RAD * 4, fill=255)
mask = mask.resize((WW, WH), Image.LANCZOS)
ang.putalpha(Image.eval(mask, lambda v: 255 - v))
ang.save(os.path.join(SEG, "angoli.png"))
bordo = Image.new("RGBA", (WW, WH), (0, 0, 0, 0))
ImageDraw.Draw(bordo).rounded_rectangle((0, 0, WW - 1, WH - 1), RAD, outline=(205, 200, 215, 255), width=2)
bordo.save(os.path.join(SEG, "bordo.png"))


def testo_semplice(h):
    return re.sub(r"<[^>]+>", "", h)


tempo = 0.0
parti_info = []
for p in cop["parti"]:
    durs = []
    for s in p["segmenti"]:
        n = len(s["v"])
        durs.append(max(0.9, n / cop["cps"] + cop["pausa_segmento"]) if n else 0)
    D = p.get("durata") or max(sum(durs) + cop["pausa_scena"], p.get("min", 0))
    if p.get("durata"):
        durs = [D]
    else:
        durs[-1] += cop["pausa_scena"]
    out = os.path.join(SEG, f"parte_{p['id']}.mp4")
    if p.get("grafica"):
        lista = []
        for s, d in zip(p["segmenti"], durs):
            lista += [f"file '{os.path.join(IMG, s['img'])}.png'", f"duration {d:.3f}"]
        lista.append(f"file '{os.path.join(IMG, p['segmenti'][-1]['img'])}.png'")
        open(os.path.join(SEG, f"lista_{p['id']}.txt"), "w").write("\n".join(lista))
        ffmpeg("-f", "concat", "-safe", "0", "-i", os.path.join(SEG, f"lista_{p['id']}.txt"), "-vf", "fps=30,format=yuv420p",
               "-t", f"{D:.3f}", "-c:v", "libx264", "-crf", "18", out)
        nota = ""
    else:
        clip = os.path.join(APP, f"clip_{p['clip']}.mp4")
        dc = durata(clip)
        if p.get("ritaglia") or p.get("congela"):   # ritaglio e/o fotogramma fermo (es. il messaggio «Offerta inviata!», che dura poco)
            a, b = p.get("ritaglia", [0, dc])
            prep = os.path.join(SEG, f"prep_{p['id']}.mp4")
            if p.get("congela"):
                t, sec = p["congela"]
                f = (f"[0:v]split=3[x][y][z];[x]trim=start={a}:end={t},setpts=PTS-STARTPTS[x1];"
                     f"[y]trim=start={t}:end={t + 0.04},setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration={sec}[y1];"
                     f"[z]trim=start={t}:end={b},setpts=PTS-STARTPTS[z1];[x1][y1][z1]concat=n=3:v=1[o]")
            else:
                f = f"[0:v]trim=start={a}:end={b},setpts=PTS-STARTPTS[o]"
            ffmpeg("-i", clip, "-filter_complex", f, "-map", "[o]", "-r", "30", "-c:v", "libx264", "-crf", "14", prep)
            clip = prep
            dc = durata(clip)
        vel = dc / D
        vmax = p.get("vmax", 1.3)
        if vel > vmax:   # clip più lunga: si accelera al massimo vmax e si taglia la coda
            vel = vmax
        elif vel < 1:   # clip più corta: velocità normale e ultimo fotogramma fermo
            vel = 1.0
        nota = f"clip {dc:.1f}s -> scena {D:.1f}s (velocità x{vel:.2f}{', ultimo fotogramma fermo' if dc / vel < D else ''})"
        ins = ["-loop", "1", "-framerate", "30", "-t", f"{D:.3f}", "-i", os.path.join(SEG, "bg.png"), "-i", clip,
               "-loop", "1", "-framerate", "30", "-t", f"{D:.3f}", "-i", os.path.join(SEG, "angoli.png"),
               "-loop", "1", "-framerate", "30", "-t", f"{D:.3f}", "-i", os.path.join(SEG, "bordo.png")]
        fc = [f"[1:v]setpts=PTS/{vel:.4f},fps=30,scale={WW}:{WH}:flags=lanczos,tpad=stop_mode=clone:stop_duration={D:.3f},trim=duration={D:.3f},setpts=PTS-STARTPTS[cl]",
              f"[0:v][cl]overlay={WX}:{WY}[a]", f"[a][2:v]overlay={WX}:{WY}[b]", f"[b][3:v]overlay={WX}:{WY}[c0]"]
        ult, t0, k = "c0", 0.0, 4
        for i, (s, d) in enumerate(zip(p["segmenti"], durs)):
            if s["t"]:
                ins += ["-loop", "1", "-framerate", "30", "-t", f"{d:.3f}", "-i", os.path.join(IMG, f"sub_{p['id']}_{i}.png")]
                fc.append(f"[{k}:v]format=rgba,fade=t=in:st=0:d=0.15:alpha=1,fade=t=out:st={d - 0.15:.3f}:d=0.15:alpha=1,setpts=PTS+{t0:.3f}/TB[s{k}]")
                fc.append(f"[{ult}][s{k}]overlay=0:0:eof_action=pass[o{k}]")
                ult = f"o{k}"
                k += 1
            t0 += d
        fc.append(f"[{ult}]format=yuv420p[fin]")
        ffmpeg(*ins, "-filter_complex", ";".join(fc), "-map", "[fin]", "-t", f"{D:.3f}", "-r", "30", "-c:v", "libx264", "-crf", "18", out)
    parti_info.append((p["id"], tempo, D, nota))
    t0 = tempo
    for s, d in zip(p["segmenti"], durs):
        s["_inizio"] = round(t0, 2)
        t0 += d
    tempo += D
    print(f"{p['id']:10s} {tempo - D:6.1f} -> {tempo:6.1f}  {nota}")

lista = "\n".join(f"file '{os.path.join(SEG, 'parte_' + p['id'] + '.mp4')}'" for p in cop["parti"])
open(os.path.join(SEG, "tutte.txt"), "w").write(lista)
ffmpeg("-f", "concat", "-safe", "0", "-i", os.path.join(SEG, "tutte.txt"), "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo",
       "-map", "0:v", "-map", "1:a", "-shortest", "-c:v", "copy", "-c:a", "aac", "-b:a", "32k", "-movflags", "+faststart",
       os.path.join(EXP, "scontiroma_v14_muto_master.mp4"))
ffmpeg("-i", os.path.join(EXP, "scontiroma_v14_muto_master.mp4"), "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-maxrate", "1200k",
       "-bufsize", "2400k", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", os.path.join(EXP, "scontiroma_v14_muto_anteprima.mp4"))
print("durata totale %.1f s" % tempo)
for f in ("master", "anteprima"):
    pth = os.path.join(EXP, f"scontiroma_v14_muto_{f}.mp4")
    print(f, os.path.getsize(pth) // 1024, "KB")

# ---- testo vocale e tempi stimati
voce = []
for p in cop["parti"]:
    if p["id"] == "titolare":
        voce.append("[SCENA SEGNAPOSTO: DA INSERIRE, testo del titolare]")
        continue
    voce.append(" ".join(s["v"] for s in p["segmenti"]))
blocco = " ".join(v for v in voce if not v.startswith("["))
open(os.path.join(AQUI, "testo_voce.txt"), "w").write(blocco + "\n")
json.dump({"durata": round(tempo, 1), "parti": [{"id": a, "inizio": round(b, 1), "durata": round(c, 1)} for a, b, c, _ in parti_info],
           "caratteri_voce": len(blocco)}, open(os.path.join(AQUI, "tempi.json"), "w"), indent=1)
print("caratteri del testo vocale:", len(blocco))
