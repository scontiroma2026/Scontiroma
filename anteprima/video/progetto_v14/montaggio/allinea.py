#!/usr/bin/env python3
"""Allinea i sottotitoli del copione a una traccia vocale già registrata, SENZA strumenti di trascrizione.
1) ffmpeg (silencedetect) trova le pause della voce;
2) una programmazione dinamica sceglie, per la fine di ogni sottotitolo, la pausa che rende la durata di ogni
   frase più vicina a quella attesa dal numero di sillabe (più un piccolo premio per le pause lunghe);
3) i confini escono come tempi in secondi per ogni sottotitolo (copione.json: parte:indice).
Uso: python3 allinea.py <voce.mp3> <uscita.json>   (variabili facoltative NOISE=-26, PAUSA=0.12)
"""
import json
import os
import re
import subprocess
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
mp3, out = sys.argv[1], sys.argv[2]
cop = json.load(open(os.path.join(AQUI, "copione.json")))


def peso(t):
    """Sillabe (gruppi di vocali) + pausa di punteggiatura (2 sillabe dopo . ? ; 1 dopo , :)."""
    sill = len(re.findall(r"[aeiouàèéìòù]+", t.lower()))
    return sill + (2 if re.search(r"[.?]$", t) else 1 if re.search(r"[,:]$", t) else 0)


dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3]).strip())
log = subprocess.run(["ffmpeg", "-hide_banner", "-i", mp3, "-af", "silencedetect=noise=" + os.environ.get("NOISE", "-26") + "dB:d=" + os.environ.get("PAUSA", "0.12"),
                      "-f", "null", "-"], capture_output=True, text=True).stderr
ini = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
fin = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
voce_ini = fin[0] if ini and ini[0] < 0.05 and fin else 0.0
voce_fin = ini[-1] if len(ini) > len(fin) else dur
sil = [(a, b) for a, b in zip(ini, fin) if a > voce_ini + 0.3 and b < voce_fin - 0.3]
mid = [(a + b) / 2 for a, b in sil]
M = len(sil)

segs = [[p["id"], i, s["v"]] for p in cop["parti"] for i, s in enumerate(p["segmenti"]) if s["v"]]
w = [peso(s[2]) for s in segs]
N = len(segs)
r = (voce_fin - voce_ini) / sum(w)      # secondi per sillaba (media)
INF = 1e9
# cost[k][m]: la fine del sottotitolo k cade sulla pausa m (k = 0..N-2); prev = pausa scelta per k-1
cost = [[INF] * M for _ in range(N - 1)]
prev = [[-1] * M for _ in range(N - 1)]


def tratto(a, b, k, mm):
    d = sil[mm][1] - sil[mm][0] if mm is not None else 0
    attesa = r * w[k]
    return (b - a - attesa) ** 2 / (attesa + 1.0) - 1.2 * min(d, 0.6)


for m in range(M):
    cost[0][m] = tratto(voce_ini, mid[m], 0, m)
for k in range(1, N - 1):
    for m in range(M):
        best, bj = INF, -1
        for j in range(m):
            if cost[k - 1][j] < INF:
                c = cost[k - 1][j] + tratto(mid[j], mid[m], k, m)
                if c < best:
                    best, bj = c, j
        cost[k][m], prev[k][m] = best, bj
fine = [cost[N - 2][m] + tratto(mid[m], voce_fin, N - 1, None) if cost[N - 2][m] < INF else INF for m in range(M)]
m = min(range(M), key=lambda x: fine[x])
sc = [0] * (N - 1)
for k in range(N - 2, -1, -1):
    sc[k] = m
    m = prev[k][m]
conf = [voce_ini] + [mid[x] for x in sc] + [voce_fin]
tempi = {f"{s[0]}:{s[1]}": [round(a, 2), round(b, 2)] for s, a, b in zip(segs, conf[:-1], conf[1:])}
json.dump({"durata_audio": round(dur, 2), "voce_inizio": round(voce_ini, 2), "voce_fine": round(voce_fin, 2), "segmenti": tempi}, open(out, "w"), indent=1)
print(os.path.basename(mp3), "audio %.1fs, parlato %.1f-%.1f, %d pause trovate, %d sottotitoli" % (dur, voce_ini, voce_fin, M, N))
for s, a, b in zip(segs, conf[:-1], conf[1:]):
    print(f"{a:6.2f} {b:6.2f} ({b - a:4.1f}s, atteso {r * peso(s[2]):4.1f})  {s[2][:60]}")
