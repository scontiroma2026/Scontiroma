// Registrazione della pagina a piena risoluzione (screenshot 3x in sequenza, con i loro tempi).
// Le animazioni CSS vengono rallentate di RATE durante la registrazione e riportate a velocità
// reale nel montaggio, così il movimento resta fluido. Uscita: mp4 1170x2390, 30 fps.
const fs = require('fs'); const path = require('path'); const { execFileSync } = require('child_process');
const RATE = 0.25;
async function startRec(page, dir, rate = RATE) {
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Animation.enable'); await cdp.send('Animation.setPlaybackRate', { playbackRate: rate });
  const rec = { cdp, frames: [], dir, on: true, page, rate };
  rec.loop = (async () => {
    while (rec.on) {
      const ts = Date.now() / 1000; const file = path.join(dir, `f${String(rec.frames.length).padStart(5, '0')}.jpg`);
      try { await page.screenshot({ path: file, type: 'jpeg', quality: 92 }); rec.frames.push({ file, ts }); } catch (e) {}
    }
  })();
  return rec;
}
// wait: attesa in "tempo di scena" (le animazioni CSS sono rallentate, quindi si aspetta di più)
const wait = (page, sec) => page.waitForTimeout(sec * 1000 / RATE);
async function stopRec(rec, out, speed = null, tailSec = 0.4) {
  speed = speed || 1 / rec.rate;
  rec.on = false; await rec.loop;
  await rec.cdp.send('Animation.setPlaybackRate', { playbackRate: 1 });
  const fr = rec.frames; const lines = [];
  for (let i = 0; i < fr.length; i++) {
    const d = i < fr.length - 1 ? Math.max((fr[i + 1].ts - fr[i].ts) / speed, 0.001) : tailSec;
    lines.push(`file '${fr[i].file}'`, `duration ${d.toFixed(4)}`);
  }
  lines.push(`file '${fr[fr.length - 1].file}'`);
  fs.writeFileSync(path.join(rec.dir, 'list.txt'), lines.join('\n'));
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(rec.dir, 'list.txt'),
    '-vf', 'scale=1170:2390,setsar=1,fps=30,format=yuv420p', '-c:v', 'libx264', '-crf', '16', '-preset', 'fast', out]);
  return fr.length;
}
module.exports = { startRec, stopRec, wait, RATE };
