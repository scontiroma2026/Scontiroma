#!/usr/bin/env python3
"""Audio del video v16: voce femminile finale con N secondi di silenzio inseriti dopo l'enoteca (per la guida) e la musica del video dell'8 ottobre
(stessa traccia della v13, allungata ripetendo un pezzo prima dell'inserimento), con ducking sotto la voce, -16 LUFS, picco sotto -1,5 dBTP.
Nessuna parte del video resta in silenzio: durante la guida c'è solo la musica.
Uso: PRIV=... python3 mix_v16.py"""
import json, os, subprocess
PRIV = os.environ["PRIV"]; V = f"{PRIV}/v16/stems"; os.makedirs(V, exist_ok=True)
N, PUNTO, TAIL = 13.0, 51.51, 0.8
voce_in = f"{PRIV}/voce_femminile_FINALE.mp3"; musica = f"{V}/musica.wav"
def ff(*a):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *a], capture_output=True, text=True)
    if r.returncode: raise SystemExit(r.stderr)
dv = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", voce_in]))
tot = dv + N + TAIL
# voce: prima parte + silenzio + seconda parte (dissolvenze di 20 ms sul taglio), poi coda di silenzio
ff("-i", voce_in, "-filter_complex",
   f"[0:a]aformat=sample_rates=44100:channel_layouts=stereo,asplit=2[x][y];[x]atrim=0:{PUNTO},afade=t=out:st={PUNTO - 0.02}:d=0.02,asetpts=PTS-STARTPTS[a];"
   f"anullsrc=r=44100:cl=stereo,atrim=0:{N}[s];[y]atrim={PUNTO},afade=t=in:st=0:d=0.02,asetpts=PTS-STARTPTS[b];[a][s][b]concat=n=3:v=0:a=1,apad=whole_dur={tot:.3f}[o]",
   "-map", "[o]", f"{V}/voce16.wav")
# musica: [0, PUNTO] + pezzo ripetuto lungo N+TAIL (i secondi appena prima del punto) + [PUNTO, fine]; giunzioni con dissolvenza incrociata di 0,3 s
L = N + TAIL
ff("-i", musica, "-filter_complex",
   f"[0:a]asplit=3[m1][m2][m3];[m1]atrim=0:{PUNTO},asetpts=PTS-STARTPTS[a];[m2]atrim={PUNTO - L}:{PUNTO},asetpts=PTS-STARTPTS[b];[m3]atrim={PUNTO},asetpts=PTS-STARTPTS[c];"
   f"[a][b]acrossfade=d=0.3[ab];[ab][c]acrossfade=d=0.3,afade=t=out:st={tot - 1.2:.2f}:d=1.2,atrim=0:{tot:.3f}[o]", "-map", "[o]", f"{V}/musica16.wav")
MIX = ("[1:a]asplit=2[vk][vo];[0:a]volume=0.32[mu];"
       "[mu][vk]sidechaincompress=threshold=0.025:ratio=6:attack=300:release=300:makeup=1[md];[vo][md]amix=inputs=2:normalize=0:duration=longest")
ins = ["-i", f"{V}/musica16.wav", "-i", f"{V}/voce16.wav"]
r = subprocess.run(["ffmpeg", "-hide_banner", "-y", *ins, "-filter_complex", MIX + ",loudnorm=I=-16:TP=-2:LRA=11:print_format=json[a]", "-map", "[a]", "-f", "null", "-"], capture_output=True, text=True)
js = json.loads(r.stderr[r.stderr.rindex("{"):r.stderr.rindex("}") + 1])
ln = (f"loudnorm=I=-16:TP=-2:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:"
      f"measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
ff(*ins, "-filter_complex", MIX + f",{ln},aresample=44100[a]", "-map", "[a]", "-ar", "44100", f"{V}/mix16.wav")
print("mix pronto, durata", tot)
