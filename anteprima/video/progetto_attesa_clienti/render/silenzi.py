#!/usr/bin/env python3
"""Trova le pause della voce con il rilevamento dei silenzi di ffmpeg (silencedetect), senza trascrizioni a pagamento.
Stampa le pause per alcune soglie: servono a scegliere i punti di taglio dei sottotitoli (copione_voce.json).
Uso: python3 silenzi.py <voce.mp3>
"""
import re
import subprocess
import sys

voce = sys.argv[1]
for soglia, durata in [(-35, 0.12), (-30, 0.07), (-26, 0.05)]:
    err = subprocess.run(["ffmpeg", "-hide_banner", "-i", voce, "-af", f"silencedetect=noise={soglia}dB:d={durata}", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    ini = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", err)]
    fin = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", err)]
    print(f"soglia {soglia} dB, durata minima {durata} s:")
    for a, b in zip(ini, fin):
        print(f"  pausa {a:6.2f} - {b:6.2f}  (centro {(a + b) / 2:6.2f})")
