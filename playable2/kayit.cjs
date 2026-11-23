// Reklam kaydı: 1080×1920, 30 kare/sn, ~20 sn, sessiz MP4 + 4 ara kare. Sahte saat kare kare ilerletilir (makine hızından bağımsız).
//   node playable2/kayit.cjs <tema>   (önce node playable2/build.cjs)
'use strict';
const { chromium } = require('playwright'), fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const DIST = path.join(__dirname, 'dist'), th = process.argv[2] || 'neon';
const FPS = 30, TOTAL = 20000, TAPS = [2600, 4600, 7000], STILLS = { 1500: 1, 6000: 2, 7700: 3, 18000: 4 };
(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ray-k-')), b = await chromium.launch();
  const ctx = await b.newContext({ locale: 'tr-TR', viewport: { width: 540, height: 960 }, deviceScaleFactor: 2, hasTouch: true }), p = await ctx.newPage();
  p.on('pageerror', e => { console.error('HATA', e.message); process.exitCode = 1; });
  await p.route('**/*', r => r.request().url() === 'https://ad.test/ray.html' ? r.fulfill({ contentType: 'text/html', body: fs.readFileSync(path.join(DIST, `ray-reklam-${th}.html`)) }) : r.abort());
  await p.clock.install({ time: Date.now() });
  await p.goto('https://ad.test/ray.html'); await p.clock.pauseAt(Date.now() + 1000);
  const step = 1000 / FPS, n = Math.round(TOTAL / step); let taps = TAPS.slice(), stills = Object.entries(STILLS).map(([t, k]) => [+t, k]);
  for (let f = 0; f < n; f++) {
    const t = f * step;
    if (taps.length && t >= taps[0]) { taps.shift(); const s = await p.evaluate(() => window.RAY_AD_STATE()); if (s.hint >= 0) { const c = await p.evaluate(i => window.RAY_AD_TILE(i), s.hint); await p.touchscreen.tap(c.x, c.y); } }
    const file = path.join(tmp, String(f).padStart(5, '0') + '.png'); await p.screenshot({ path: file });
    const st = stills.find(([ms]) => t >= ms); if (st) { fs.copyFileSync(file, path.join(DIST, `ray-reklam-${th}-kare-${st[1]}.png`)); stills = stills.filter(x => x !== st); }
    await p.clock.runFor(step);
  }
  console.log(th, JSON.stringify(await p.evaluate(() => window.RAY_AD_STATE())));
  await b.close();
  const out = path.join(DIST, `ray-reklam-${th}-kayit.mp4`);
  cp.execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(tmp, '%05d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium', '-movflags', '+faststart', '-an', out]);
  fs.rmSync(tmp, { recursive: true, force: true }); console.log(out, (fs.statSync(out).size / 1048576).toFixed(1) + ' MB');
})().catch(e => { console.error(e); process.exit(2); });
