#!/usr/bin/env python3
"""Montaggio del video V4 «solo mani» (versione «dito animato»): nessuna persona, nessuna IA, nessuna musica.
Ingredienti: clip dell'app in ../app/clip_*.mp4 (rec_clip.js), fotogrammi delle scene illustrate in frames/ e grafiche in img/
(grafica.js). Uscita in export/ (fuori da git, i file grandi non vanno nel repository):
  scontiroma_v4_mani_master.mp4          1080x1920, 30 fps, H.264, scritte a schermo, audio SILENZIOSO
  scontiroma_v4_mani_senza_scritte.mp4   come sopra ma senza le scritte (l'etichetta «ESEMPIO» sul telefono resta)
  scontiroma_v4_mani_leggera.mp4         versione più leggera del master, per l'invio
Nessuna traccia di sottotitoli nascosti (soft subtitle) in nessun file: le scritte sono nell'immagine oppure assenti.
Uso: python3 monta.py
"""
import json
import os
import subprocess
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
APP = os.path.join(AQUI, "..", "app")
IMG = os.path.join(AQUI, "img")
FRM = os.path.join(AQUI, "frames")
SEG = os.path.join(AQUI, "seg")
EXP = os.path.join(AQUI, "export")
for d in (SEG, EXP):
    os.makedirs(d, exist_ok=True)
SCH = dict(x=275, y=630, w=530, h=1128)   # schermo dell'iPhone disegnato (come in grafica.js)
cop = json.load(open(os.path.join(AQUI, "copione.json")))


def ffmpeg(*a):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *a], capture_output=True, text=True)
    if r.returncode:
        print(r.stderr)
        sys.exit(1)


def durata(f):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).strip())


def base(s):
    """Scena senza scritte."""
    D = s["durata"]
    out = os.path.join(SEG, f"base_{s['id']}.mp4")
    if s["tipo"] == "grafica":
        ffmpeg("-framerate", "30", "-i", os.path.join(FRM, s["id"], "f%04d.jpg"), "-vf", "fps=30,format=yuv420p", "-t", f"{D:.3f}",
               "-c:v", "libx264", "-crf", "14", "-preset", "fast", out)
        return out
    a, b = s["ritaglia"]
    tel = os.path.join(IMG, "telefono_esempio.png" if s.get("esempio") else "telefono.png")
    clip = os.path.join(APP, f"clip_{s['clip']}.mp4")
    if durata(clip) < b:
        print("clip troppo corta:", clip, durata(clip), "<", b)
        sys.exit(1)
    fv = (f"[1:v]trim=start={a}:end={b},setpts=(PTS-STARTPTS)*{D / (b - a):.5f},fps=30,scale={SCH['w']}:{SCH['h']}:flags=lanczos,"
          f"tpad=stop_mode=clone:stop_duration={D:.3f},trim=duration={D:.3f},setpts=PTS-STARTPTS[cl];"
          f"[0:v][cl]overlay={SCH['x']}:{SCH['y']}[a];[a][2:v]overlay=0:0,format=yuv420p[o]")
    ffmpeg("-loop", "1", "-framerate", "30", "-t", f"{D:.3f}", "-i", os.path.join(IMG, "sfondo_app.png"), "-i", clip,
           "-loop", "1", "-framerate", "30", "-t", f"{D:.3f}", "-i", tel, "-filter_complex", fv, "-map", "[o]", "-t", f"{D:.3f}",
           "-r", "30", "-c:v", "libx264", "-crf", "14", "-preset", "fast", out)
    return out


def con_scritte(s, bs):
    """Aggiunge le scritte con dissolvenza in ingresso (le scene si tagliano a vivo: nessuna dissolvenza in uscita)."""
    out = os.path.join(SEG, f"titolata_{s['id']}.mp4")
    D = s["durata"]
    ins = ["-i", bs]
    fc = []
    ult = "0:v"
    for k, sc in enumerate(s["scritte"], start=1):
        ins += ["-loop", "1", "-framerate", "30", "-t", f"{D:.3f}", "-i", os.path.join(IMG, sc["img"] + ".png")]
        f = "format=rgba"
        if sc["da"] > 0.05:
            f += f",fade=t=in:st=0:d=0.2:alpha=1,setpts=PTS+{sc['da']}/TB"
        fc.append(f"[{k}:v]{f}[s{k}]")
        fc.append(f"[{ult}][s{k}]overlay=0:0:eof_action=pass[o{k}]")
        ult = f"o{k}"
    fc.append(f"[{ult}]format=yuv420p[fin]")
    ffmpeg(*ins, "-filter_complex", ";".join(fc), "-map", "[fin]", "-t", f"{D:.3f}", "-r", "30", "-c:v", "libx264", "-crf", "14", "-preset", "fast", out)
    return out


def unisci(files, nome):
    lista = os.path.join(SEG, f"lista_{nome}.txt")
    open(lista, "w").write("\n".join(f"file '{f}'" for f in files))
    out = os.path.join(EXP, f"scontiroma_v4_mani_{nome}.mp4")
    # audio: traccia SILENZIOSA (la musica la aggiunge il titolare dalla libreria dei brani consentiti da Instagram/Facebook)
    ffmpeg("-f", "concat", "-safe", "0", "-i", lista, "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-map", "0:v", "-map", "1:a", "-shortest",
           "-vf", "scale=1080:1920,setsar=1,format=yuv420p", "-r", "30", "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-crf", "17",
           "-c:a", "aac", "-b:a", "64k", "-sn", "-movflags", "+faststart", out)
    return out


tempo = 0.0
basi, titolate = [], []
for s in cop["scene"]:
    b = base(s)
    basi.append(b)
    titolate.append(con_scritte(s, b))
    print(f"{s['id']:4s} {tempo:5.1f} -> {tempo + s['durata']:5.1f}  {s['tipo']}")
    tempo += s["durata"]
master = unisci(titolate, "master")
pulita = unisci(basi, "senza_scritte")
leggera = os.path.join(EXP, "scontiroma_v4_mani_leggera.mp4")
ffmpeg("-i", master, "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-maxrate", "1500k", "-bufsize", "3000k", "-pix_fmt", "yuv420p",
       "-c:a", "aac", "-b:a", "32k", "-sn", "-movflags", "+faststart", leggera)
print("durata totale prevista %.1f s" % tempo)
for f in (master, pulita, leggera):
    print(os.path.basename(f), os.path.getsize(f) // 1024, "KB", "%.2f s" % durata(f))
json.dump({"durata": round(tempo, 1), "scene": [{"id": s["id"], "tipo": s["tipo"], "durata": s["durata"], "copione_clip": s["copione_clip"]} for s in cop["scene"]]},
          open(os.path.join(AQUI, "tempi.json"), "w"), indent=1)
