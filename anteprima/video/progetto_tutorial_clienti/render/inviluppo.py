#!/usr/bin/env python3
"""Inviluppo dell'energia della voce (dB ogni 10 ms) in un intervallo: serve a trovare le chiusure delle consonanti
occlusive (p, t, k: brevi silenzi dentro una frase) quando tra due parole non c'è una vera pausa.
Così si è trovato l'inizio di «per» dopo «Seleziona il tuo quartiere» (chiusure t-k-t-p-k-p di «tuo quartiere per scoprire»).
Uso: python3 inviluppo.py <voce.mp3> <da_secondi> <a_secondi>
"""
import subprocess
import sys

import numpy as np

voce, a, b = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
SR = 16000
raw = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", voce, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                     capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype=np.int16).astype(float)
for t0 in np.arange(a, b, 0.01):
    seg = x[int(t0 * SR):int(t0 * SR) + 160]
    db = 20 * np.log10(np.sqrt((seg ** 2).mean()) / 32768 + 1e-9)
    print(f"{t0:6.2f} {db:6.1f} " + "#" * max(0, int((db + 60) / 1.5)))
