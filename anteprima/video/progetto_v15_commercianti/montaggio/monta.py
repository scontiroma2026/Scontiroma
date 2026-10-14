#!/usr/bin/env python3
"""Montaggio del video v15 per i commercianti (voce femminile registrata dal titolare, nessuna musica).
Clip dell'app in $PRIV/app, schermate della guida in $PRIV/guida, grafiche in $PRIV/img (da grafica.js).
I tempi sono in copione.json (campo "a" = inizio di ogni frase, preso dalle pause della voce con silencedetect).
Uso: PRIV=<cartella privata> python3 monta.py <v|vc|q> <voce_normalizzata.wav> <nome_uscita>
  v = 1080x1920 con scritte, vc = 1080x1920 senza scritte, q = 1080x1080 con scritte.
Fuori dal repository restano tutti i file pesanti (clip, immagini, video).
"""
import json, os, re, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter

AQUI = os.path.dirname(os.path.abspath(__file__))
PRIV = os.environ["PRIV"]
APP, IMG, SEG, EXP = (os.path.join(PRIV, d) for d in ("app", "img", "seg", "export"))
FMT, WAV, NOME = sys.argv[1], sys.argv[2], sys.argv[3]
FONDO = (242, 240, 235)
if FMT == "q":
    W, H, WX, WY, WW, WH, RAD = 1080, 1080, 292, 290, 496, 770, 34
else:
    W, H, WX, WY, WW, WH, RAD = 1080, 1920, 90, 470, 900, 1398, 48
SUBS = FMT != "vc"
cop = json.load(open(os.path.join(AQUI, "copione.json")))
dur_audio = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", WAV]).strip())
FINE = dur_audio + cop["coda"]


def ffmpeg(*a):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *a], capture_output=True, text=True)
    if r.returncode:
        print(r.stderr); sys.exit(1)


def durata(f):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).strip())


P = f"{FMT}_"
bg = Image.new("RGB", (W, H), FONDO)
ombra = Image.new("L", (W, H), 0)
ImageDraw.Draw(ombra).rounded_rectangle((WX, WY + 12, WX + WW, WY + WH + 12), RAD, fill=70)
ombra = ombra.filter(ImageFilter.GaussianBlur(24))
bg.paste(Image.new("RGB", bg.size, (40, 30, 70)), mask=ombra)
bg.save(f"{SEG}/{P}bg.png")
ang = Image.new("RGBA", (WW, WH), FONDO + (255,))
mask = Image.new("L", (WW * 4, WH * 4), 0)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, WW * 4 - 1, WH * 4 - 1), RAD * 4, fill=255)
mask = mask.resize((WW, WH), Image.LANCZOS)
ang.putalpha(Image.eval(mask, lambda v: 255 - v)); ang.save(f"{SEG}/{P}angoli.png")
bordo = Image.new("RGBA", (WW, WH), (0, 0, 0, 0))
ImageDraw.Draw(bordo).rounded_rectangle((0, 0, WW - 1, WH - 1), RAD, outline=(205, 200, 215, 255), width=2)
bordo.save(f"{SEG}/{P}bordo.png")

starts = [p["segmenti"][0]["a"] for p in cop["parti"]]
starts[0] = 0.0
ends = starts[1:] + [FINE]
tempo_info = []
for pi, p in enumerate(cop["parti"]):
    D = ends[pi] - starts[pi]
    sa = [s["a"] for s in p["segmenti"]]; sa[0] = starts[pi]
    durs = [(sa[i + 1] if i + 1 < len(sa) else ends[pi]) - sa[i] for i in range(len(sa))]
    out = f"{SEG}/{P}parte_{p['id']}.mp4"
    nota = ""
    if p.get("grafica"):
        lista = []; ultimo = None
        for s, d in zip(p["segmenti"], durs):
            imgs = s["img"] if isinstance(s["img"], list) else [s["img"]]
            n = len(imgs)
            passo = cop["passo_guida"] if n > 1 else d
            for j, im in enumerate(imgs):
                dd = passo if j < n - 1 else d - passo * (n - 1)
                lista += [f"file '{IMG}/{P}{im}.png'", f"duration {max(dd, 0.05):.3f}"]; ultimo = im
        lista.append(f"file '{IMG}/{P}{ultimo}.png'")
        open(f"{SEG}/{P}lista_{p['id']}.txt", "w").write("\n".join(lista))
        ffmpeg("-f", "concat", "-safe", "0", "-i", f"{SEG}/{P}lista_{p['id']}.txt", "-vf", "fps=30,format=yuv420p", "-t", f"{D:.3f}", "-c:v", "libx264", "-crf", "17", out)
    else:
        clip = f"{APP}/clip_{p['clip']}.mp4"
        dc = durata(clip)
        if p.get("ritaglia") or p.get("congela"):
            a, b = p.get("ritaglia", [0, dc])
            prep = f"{SEG}/{P}prep_{p['id']}.mp4"
            if p.get("congela"):
                t, sec = p["congela"]
                f = (f"[0:v]split=3[x][y][z];[x]trim=start={a}:end={t},setpts=PTS-STARTPTS[x1];"
                     f"[y]trim=start={t}:end={t + 0.04},setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration={sec}[y1];"
                     f"[z]trim=start={t}:end={b},setpts=PTS-STARTPTS[z1];[x1][y1][z1]concat=n=3:v=1[o]")
            else:
                f = f"[0:v]trim=start={a}:end={b},setpts=PTS-STARTPTS[o]"
            ffmpeg("-i", clip, "-filter_complex", f, "-map", "[o]", "-r", "30", "-c:v", "libx264", "-crf", "14", prep)
            clip = prep; dc = durata(clip)
        vel = dc / D
        vel = min(vel, p.get("vmax", 1.3)) if vel > 1 else 1.0
        nota = f"clip {dc:.1f}s -> scena {D:.1f}s (x{vel:.2f})"
        ins = ["-loop", "1", "-framerate", "30", "-t", f"{D:.3f}", "-i", f"{SEG}/{P}bg.png", "-i", clip,
               "-loop", "1", "-framerate", "30", "-t", f"{D:.3f}", "-i", f"{SEG}/{P}angoli.png",
               "-loop", "1", "-framerate", "30", "-t", f"{D:.3f}", "-i", f"{SEG}/{P}bordo.png"]
        fc = [f"[1:v]setpts=PTS/{vel:.4f},fps=30,scale={WW}:{WH}:flags=lanczos,tpad=stop_mode=clone:stop_duration={D:.3f},trim=duration={D:.3f},setpts=PTS-STARTPTS[cl]",
              f"[0:v][cl]overlay={WX}:{WY}[a]", f"[a][2:v]overlay={WX}:{WY}[b]", f"[b][3:v]overlay={WX}:{WY}[c0]"]
        ult, t0, k = "c0", 0.0, 4
        for i, (s, d) in enumerate(zip(p["segmenti"], durs)):
            if s["t"] and SUBS:
                ins += ["-loop", "1", "-framerate", "30", "-t", f"{d:.3f}", "-i", f"{IMG}/{P}sub_{p['id']}_{i}.png"]
                fc.append(f"[{k}:v]format=rgba,fade=t=in:st=0:d=0.15:alpha=1,fade=t=out:st={d - 0.15:.3f}:d=0.15:alpha=1,setpts=PTS+{t0:.3f}/TB[s{k}]")
                fc.append(f"[{ult}][s{k}]overlay=0:0:eof_action=pass[o{k}]"); ult = f"o{k}"; k += 1
            t0 += d
        fc.append(f"[{ult}]format=yuv420p[fin]")
        ffmpeg(*ins, "-filter_complex", ";".join(fc), "-map", "[fin]", "-t", f"{D:.3f}", "-r", "30", "-c:v", "libx264", "-crf", "17", out)
    tempo_info.append((p["id"], starts[pi], D))
    print(f"{p['id']:5s} {starts[pi]:6.2f} -> {ends[pi]:6.2f}  {nota}")

open(f"{SEG}/{P}tutte.txt", "w").write("\n".join(f"file '{SEG}/{P}parte_{p['id']}.mp4'" for p in cop["parti"]))
ffmpeg("-f", "concat", "-safe", "0", "-i", f"{SEG}/{P}tutte.txt", "-i", WAV, "-map", "0:v", "-map", "1:a", "-t", f"{FINE:.3f}",
       "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2", "-movflags", "+faststart", f"{EXP}/{NOME}.mp4")
print(NOME, "durata video %.2f s, voce %.2f s" % (durata(f"{EXP}/{NOME}.mp4"), dur_audio))
