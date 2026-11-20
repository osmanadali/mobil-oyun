// Ray playable ekran kaydı: 1080×1920 dikey, 30 kare/sn, sessiz MP4 (H.264) + ara kareler.
//   node playable/kayit.cjs            (önce node playable/build.cjs)
// Sahte saat (page.clock) kare kare ilerletilir: kayıt gerçek zamana ve makine hızına bağlı değildir.
// Oyuncu simülasyonu: oyunun ipucunu izler, ~1 sn arayla dokunur (insan hızında, bulmaca akıcı görünsün).
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const DIST = path.join(__dirname, 'dist');
const FPS = 30, TOTAL_MS = 24000, GAP = 1250, FIRST = 2000;
const STILLS = { 900: 1, 6500: 2, 15500: 3, 22800: 4 };   // ms → ara kare numarası

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ray-kayit-'));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ locale: 'tr-TR', viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on('pageerror', e => { console.error('HATA', e.message); process.exitCode = 1; });
  await page.route('**/*', r => r.request().url() === 'https://ad.test/ray.html'
    ? r.fulfill({ contentType: 'text/html', body: fs.readFileSync(path.join(DIST, 'ray-playable.html')) }) : r.abort());
  await page.clock.install({ time: 0 });
  await page.goto('https://ad.test/ray.html#test');
  await page.clock.pauseAt(5000);
  const step = 1000 / FPS, frames = Math.round(TOTAL_MS / step);
  let nextTap = FIRST, stills = Object.entries(STILLS).map(([t, n]) => [+t, n]);
  for (let f = 0; f < frames; f++) {
    const t = f * step;
    const s = await page.evaluate(() => window.__ray.state());
    if (s.phase === 'play' && s.hint >= 0 && s.now >= nextTap) {
      const c = await page.evaluate(i => window.__ray.tiles()[i], s.hint);
      await page.mouse.click(c.x, c.y);
      nextTap = s.now + GAP;
    }
    const file = path.join(tmp, String(f).padStart(5, '0') + '.png');
    await page.screenshot({ path: file });
    const st = stills.find(([ms]) => t >= ms);
    if (st) { fs.copyFileSync(file, path.join(DIST, `ray-playable-kare-${st[1]}.png`)); stills = stills.filter(x => x !== st); }
    await page.clock.runFor(step);
    if (f % 90 === 0) console.log(`kare ${f}/${frames}  oyun ${Math.round(s.now)} ms  ${s.phase}  bulmaca ${s.puz}`);
  }
  const fin = await page.evaluate(() => window.__ray.state());
  console.log('son durum:', JSON.stringify({ phase: fin.phase, puz: fin.puz, solved: fin.solved }));
  await browser.close();
  const out = path.join(DIST, 'ray-playable-kayit.mp4');
  cp.execFileSync('/usr/bin/ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(tmp, '%05d.png'),
    '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'slow', '-movflags', '+faststart', '-an', out], { stdio: 'inherit' });
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(out, fs.statSync(out).size, 'bayt');
})().catch(e => { console.error(e); process.exit(2); });
