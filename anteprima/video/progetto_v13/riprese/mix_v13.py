"""Mix: musica bassa con ducking (attacco/rilascio ~300 ms) sotto la voce, -16 LUFS, picco < -1,5 dBTP."""
import json, subprocess, sys
MIX = ("[1:a]asplit=2[vk][vo];[0:a]volume=0.32[mu];"
       "[mu][vk]sidechaincompress=threshold=0.025:ratio=6:attack=300:release=300:makeup=1[md];"
       "[vo][md]amix=inputs=2:normalize=0")
ins = ["-i", "musica.wav", "-i", "voce.wav"]
r = subprocess.run(["ffmpeg", "-hide_banner", "-y", *ins, "-filter_complex", MIX + ",loudnorm=I=-16:TP=-2:LRA=11:print_format=json[a]",
                    "-map", "[a]", "-f", "null", "-"], capture_output=True, text=True)
js = json.loads(r.stderr[r.stderr.rindex("{"):r.stderr.rindex("}") + 1])
ln = (f"loudnorm=I=-16:TP=-2:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:"
      f"measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *ins, "-filter_complex", MIX + f",{ln},aresample=44100[a]",
                "-map", "[a]", "-ar", "44100", "mix.wav"], check=True)
