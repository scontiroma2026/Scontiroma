"""Voce v13: sostituisce tre frasi nella traccia voce della v9 (stems/voce.wav), senza cambiare la durata (83,6 s).
Le frasi nuove (ElevenLabs, voce Fernando Martínez, scelte dal titolare l'08/10) stanno fuori dal repository.
Per ogni frase: si azzera la finestra della frase vecchia (i bordi cadono nelle pause tra una frase e l'altra),
si inserisce la frase nuova con l'inizio allineato all'inizio del sottotitolo, volume uguale alle frasi vicine,
dissolvenze di 25 ms. Il resto della traccia resta identico. Uso: python voce_v13.py <cartella_mp3> <voce_v9.wav> <uscita.wav>
"""
import subprocess
import sys
import numpy as np

SR = 48000
FADE = int(0.025 * SR)
# (file, inizio del sottotitolo, finestra da svuotare [a, b], intorno per il volume)
SOSTITUZIONI = [
    ('1A.mp3', 9.83, (9.70, 13.28)),    # «Stiamo partendo adesso a Roma e dintorni,»
    ('2B.mp3', 35.78, (35.65, 39.44)),  # «Decide di scontarlo il mercoledì e il venerdì,»
    ('3B.mp3', 64.73, (64.60, 67.73)),  # «Mantieni lo sconto fino a fine mese,»
]


def carica(p, canali):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', str(canali), '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype=np.float32).reshape(-1, canali)


def rms_parlato(x, soglia_db=-40):
    """RMS (dB) dei soli campioni sopra soglia: misura il volume del parlato senza le pause."""
    m = x.mean(1); h = int(0.02 * SR); n = len(m) // h
    blocchi = m[:n * h].reshape(n, h); liv = 20 * np.log10(np.sqrt((blocchi ** 2).mean(1)) + 1e-9)
    att = blocchi[liv > soglia_db]
    return 20 * np.log10(np.sqrt((att ** 2).mean()) + 1e-9)


def main(mp3, voce, out):
    v = carica(voce, 2).copy()
    orig = v.copy()
    n0 = len(v)
    for nome, inizio, (a, b) in SOSTITUZIONI:
        c = carica(f'{mp3}/{nome}', 1)[:, 0]
        # niente silenzio iniziale/finale della sintesi: l'inizio della parola cade su `inizio`
        liv = np.abs(c); sp = np.where(liv > 10 ** (-45 / 20))[0]
        c = c[sp[0]:sp[-1] + 1]
        # volume: come le frasi vicine (±10 s, finestra della frase esclusa)
        i0, i1 = int(max(0, a - 10) * SR), int((b + 10) * SR)
        vic = np.concatenate([orig[i0:int(a * SR)], orig[int(b * SR):i1]])
        g = 10 ** ((rms_parlato(vic) - rms_parlato(c[:, None])) / 20)
        c = c * g
        picco = np.abs(c).max()
        if picco > 0.89: c = c * (0.89 / picco)
        c = c.copy(); c[:FADE] *= np.linspace(0, 1, FADE); c[-FADE:] *= np.linspace(1, 0, FADE)
        ia, ib, ic = int(a * SR), int(b * SR), int(inizio * SR)
        assert ic + len(c) <= ib, (nome, (ic + len(c)) / SR, b)
        # finestra vecchia -> silenzio (bordi smussati), poi la frase nuova
        fin = v[ia:ib].copy()
        env = np.ones(ib - ia); env[:FADE] = np.linspace(1, 0, FADE); env[FADE:] = 0
        # i bordi sono in pausa: l'inizio della finestra sfuma, la fine è già a zero
        fin *= env[:, None]
        # fondo: l'ambiente delle pause originali (rumore minimo) resta; qui la sintesi non ne ha, quindi si resta in silenzio
        fin[ic - ia:ic - ia + len(c)] += c[:, None]
        v[ia:ib] = fin
        print(f'{nome}: guadagno {20*np.log10(g):+.1f} dB, durata {len(c)/SR:.2f} s, {inizio:.2f}-{inizio+len(c)/SR:.2f} s, picco {np.abs(c).max():.2f}')
    assert len(v) == n0
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', out], input=v.astype(np.float32).tobytes(), check=True)


if __name__ == '__main__':
    main(*sys.argv[1:4])
