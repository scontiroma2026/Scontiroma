#!/usr/bin/env python3
"""Montaggio del video v15 per i commercianti (voce femminile registrata dal titolare, nessuna musica), stile v14:
finestra del telefono con angoli arrotondati, sottotitoli in Manrope, schede a tutto schermo.
Le clip dell'app ($PRIV/app15, da riprese/rec_clip.js) durano quanto la scena e NON si accelerano: scorrono tutte alla stessa velocità.
I tempi sono in copione.json (campo "a" = inizio di ogni frase, dalle pause della voce con silencedetect).
Dopo la voce c'è il percorso con zoom sulla guida (guida_zoom.py) e una scheda finale.
Uso: PRIV=<cartella privata> python3 monta.py <v|vc|q> <voce_normalizzata.wav> <nome_uscita>
  v = 1080x1920 con scritte, vc = 1080x1920 senza scritte, q = 1080x1080 con scritte.
"""
import json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter

AQUI = os.path.dirname(os.path.abspath(__file__))
PRIV = os.environ["PRIV"]
APP, IMG, SEG, EXP = (os.path.join(PRIV, d) for d in ("app15", "img", "seg", "export"))
FMT, WAV, NOME = sys.argv[1], sys.argv[2], sys.argv[3]
FONDO = (242, 240, 235)
if FMT == "q":
    W, H, WX, WY, WW, WH, RAD = 1080, 1080, 292, 290, 496, 770, 34
else:
    W, H, WX, WY, WW, WH, RAD = 1080, 1920, 90, 470, 900, 1398, 48
SUBS = FMT != "vc"
P = f"{FMT}_"
cop = json.load(open(os.path.join(AQUI, "copione.json")))
dur_audio = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", WAV]).strip())


def ffmpeg(*a):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *a], capture_output=True, text=True)
    if r.returncode:
        print(r.stderr); sys.exit(1)


def durata(f):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).strip())


# ---- sfondo, ombra e angoli della finestra
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

# ---- tempi: ogni parte con voce parte alla sua prima frase; la guida e la scheda finale seguono la voce
parti = cop["parti"]
voc = [bool(p.get("segmenti")) and "a" in p["segmenti"][0] for p in parti]
starts = [0.0 if i == 0 else (p["segmenti"][0]["a"] if voc[i] else None) for i, p in enumerate(parti)]
guida_json = f"{SEG}/{P}guida.mp4.json"
t = dur_audio
durs_extra = {}
for i, p in enumerate(parti):
    if starts[i] is None:
        starts[i] = t
        durs_extra[i] = json.load(open(guida_json))["durata"] if p.get("tipo") == "guida" else p["durata"]
        t += durs_extra[i]
ends = []
for i in range(len(parti)):
    if i in durs_extra:
        ends.append(starts[i] + durs_extra[i])
    elif i + 1 < len(parti):
        ends.append(starts[i + 1])
    else:
        ends.append(dur_audio)
FINE = ends[-1]

for pi, p in enumerate(parti):
    D = ends[pi] - starts[pi]
    out = f"{SEG}/{P}parte_{p['id']}.mp4"
    nota = ""
    if p.get("tipo") == "guida":
        base = f"{SEG}/{P}guida.mp4"
        pts = json.load(open(guida_json))["punti"]   # [tempo, larghezza, pausa]: 0 intera, 1 passo 1, 2 allarga, 3 passo 2, 4 allarga, 5 passo 3, 6 intera
        ins = ["-i", base]; fc = []; ult = "0:v"
        if SUBS:
            ini = [0.0, pts[1][0] - 0.3, pts[3][0] - 0.3, pts[5][0] - 0.3]
            fin = [pts[1][0] - 0.3, pts[2][0], pts[4][0], pts[6][0]]
            for k in range(4):
                ins += ["-loop", "1", "-framerate", "30", "-t", f"{fin[k] - ini[k]:.3f}", "-i", f"{IMG}/{P}gcap_{k}.png"]
                fc.append(f"[{k + 1}:v]format=rgba,fade=t=in:st=0:d=0.2:alpha=1,fade=t=out:st={fin[k] - ini[k] - 0.2:.3f}:d=0.2:alpha=1,setpts=PTS+{ini[k]:.3f}/TB[g{k}]")
                fc.append(f"[{ult}][g{k}]overlay=0:0:eof_action=pass[h{k}]"); ult = f"h{k}"
        fc.append(f"[{ult}]format=yuv420p[fin]")
        ffmpeg(*ins, "-filter_complex", ";".join(fc), "-map", "[fin]", "-t", f"{D:.3f}", "-r", "30", "-c:v", "libx264", "-crf", "17", out)
    elif p.get("grafica"):
        sa = [s.get("a", starts[pi]) for s in p["segmenti"]]; sa[0] = starts[pi]
        durs = [(sa[i + 1] if i + 1 < len(sa) else ends[pi]) - sa[i] for i in range(len(sa))]
        lista = []; ultimo = None
        for s, d in zip(p["segmenti"], durs):
            imgs = s["img"] if isinstance(s["img"], list) else [s["img"]]
            for j, im in enumerate(imgs):
                lista += [f"file '{IMG}/{P}{im}.png'", f"duration {max(d / len(imgs), 0.05):.3f}"]; ultimo = im
        lista.append(f"file '{IMG}/{P}{ultimo}.png'")
        open(f"{SEG}/{P}lista_{p['id']}.txt", "w").write("\n".join(lista))
        ffmpeg("-f", "concat", "-safe", "0", "-i", f"{SEG}/{P}lista_{p['id']}.txt", "-vf", "fps=30,format=yuv420p", "-t", f"{D:.3f}", "-c:v", "libx264", "-crf", "17", out)
    else:
        sa = [s["a"] for s in p["segmenti"]]; sa[0] = starts[pi]
        durs = [(sa[i + 1] if i + 1 < len(sa) else ends[pi]) - sa[i] for i in range(len(sa))]
        clip = f"{APP}/clip_{p['clip']}.mp4"
        dc = durata(clip)
        nota = f"clip {dc:.1f}s, scena {D:.1f}s" + ("  <-- clip più lunga: coda tagliata" if dc > D + 0.15 else "")
        if p.get("ritaglia") or p.get("congela"):   # ritaglio e/o fotogramma fermo (es. il messaggio «Offerta inviata!», che dura poco)
            a, b = p.get("ritaglia", [0, dc])
            prep = f"{SEG}/{P}prep_{p['id']}.mp4"
            if p.get("congela"):
                tt, sec = p["congela"]
                f = (f"[0:v]split=3[x][y][z];[x]trim=start={a}:end={tt},setpts=PTS-STARTPTS[x1];"
                     f"[y]trim=start={tt}:end={tt + 0.04},setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration={sec}[y1];"
                     f"[z]trim=start={tt}:end={b},setpts=PTS-STARTPTS[z1];[x1][y1][z1]concat=n=3:v=1[o]")
            else:
                f = f"[0:v]trim=start={a}:end={b},setpts=PTS-STARTPTS[o]"
            ffmpeg("-i", clip, "-filter_complex", f, "-map", "[o]", "-r", "30", "-c:v", "libx264", "-crf", "14", prep)
            clip = prep; dc = durata(clip)
        ins = ["-loop", "1", "-framerate", "30", "-t", f"{D:.3f}", "-i", f"{SEG}/{P}bg.png", "-i", clip,
               "-loop", "1", "-framerate", "30", "-t", f"{D:.3f}", "-i", f"{SEG}/{P}angoli.png",
               "-loop", "1", "-framerate", "30", "-t", f"{D:.3f}", "-i", f"{SEG}/{P}bordo.png"]
        # velocità 1: nessuna accelerazione; se la clip è più corta resta fermo l'ultimo fotogramma
        fc = [f"[1:v]fps=30,scale={WW}:{WH}:flags=lanczos,tpad=stop_mode=clone:stop_duration={D:.3f},trim=duration={D:.3f},setpts=PTS-STARTPTS[cl]",
              f"[0:v][cl]overlay={WX}:{WY}[a]", f"[a][2:v]overlay={WX}:{WY}[b]", f"[b][3:v]overlay={WX}:{WY}[c0]"]
        ult, t0, k = "c0", 0.0, 4
        for i, (s, d) in enumerate(zip(p["segmenti"], durs)):
            if s["t"] and SUBS:
                ins += ["-loop", "1", "-framerate", "30", "-t", f"{d:.3f}", "-i", f"{IMG}/{P}sub_{p['id']}_{i}.png"]
                fc.append(f"[{k}:v]format=rgba,fade=t=in:st=0:d=0.15:alpha=1,fade=t=out:st={d - 0.15:.3f}:d=0.15:alpha=1,setpts=PTS+{t0:.3f}/TB[s{k}]")
                fc.append(f"[{ult}][s{k}]overlay=0:0:eof_action=pass[o{k}]"); ult = f"o{k}"; k += 1
            t0 += d
        # scritte grafiche (percentuale, giorni): una sola volta, dal primo all'ultimo segmento che le richiede
        ovr, t1 = {}, 0.0
        for s, d in zip(p["segmenti"], durs):
            for ov in (s.get("ov") or []):
                a0 = ovr[ov][0] if ov in ovr else t1; ovr[ov] = (a0, t1 + d)
            t1 += d
        for ov, (a0, b0) in (ovr.items() if SUBS else []):
            ins += ["-loop", "1", "-framerate", "30", "-t", f"{b0 - a0:.3f}", "-i", f"{IMG}/{P}{ov}.png"]
            fc.append(f"[{k}:v]format=rgba,fade=t=in:st=0:d=0.3:alpha=1,setpts=PTS+{a0:.3f}/TB[s{k}]")
            fc.append(f"[{ult}][s{k}]overlay=0:0:eof_action=pass[o{k}]"); ult = f"o{k}"; k += 1
        fc.append(f"[{ult}]format=yuv420p[fin]")
        ffmpeg(*ins, "-filter_complex", ";".join(fc), "-map", "[fin]", "-t", f"{D:.3f}", "-r", "30", "-c:v", "libx264", "-crf", "17", out)
    print(f"{p['id']:6s} {starts[pi]:6.2f} -> {ends[pi]:6.2f}  {nota}")

open(f"{SEG}/{P}tutte.txt", "w").write("\n".join(f"file '{SEG}/{P}parte_{p['id']}.mp4'" for p in parti))
ffmpeg("-f", "concat", "-safe", "0", "-i", f"{SEG}/{P}tutte.txt", "-i", WAV, "-filter_complex", "[1:a]aformat=sample_rates=44100:channel_layouts=stereo,apad[a]",
       "-map", "0:v", "-map", "[a]", "-t", f"{FINE:.3f}", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", f"{EXP}/{NOME}.mp4")
print(NOME, "durata video %.2f s, voce %.2f s" % (durata(f"{EXP}/{NOME}.mp4"), dur_audio))
