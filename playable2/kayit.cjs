// Reklam kaydı: gerçek zamanlı (CSS animasyonları da doğal hızda), 1080×1920, ~20 sn, sessiz MP4 + 4 ara kare.
//   node playable2/kayit.cjs <tema>   (önce node playable2/build.cjs)
// Not: sahte saatle kare kare kayıtta CSS animasyonları (tören, el, kart) gerçek saatle aktığı için videoda hızlı görünüyordu.
'use strict';
const { chromium } = require('playwright'), fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const DIST = path.join(__dirname, 'dist'), th = process.argv[2] || 'neon';
const TOTAL = 20500, TAPS = [2600, 4700, 7100], STILLS = [[1500, 1], [6000, 2], [7900, 3], [13500, 4], [19000, 5]];
(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ray-v-')), b = await chromium.launch();
  const ctx = await b.newContext({ locale: 'tr-TR', viewport: { width: 540, height: 960 }, deviceScaleFactor: 2, hasTouch: true, recordVideo: { dir: tmp, size: { width: 1080, height: 1920 } } });
  const p = await ctx.newPage();
  p.on('pageerror', e => { console.error('HATA', e.message); process.exitCode = 1; });
  await p.route('**/*', r => r.request().url() === 'https://ad.test/ray.html' ? r.fulfill({ contentType: 'text/html', body: fs.readFileSync(path.join(DIST, `ray-reklam-${th}.html`)) }) : r.abort());
  const t0 = Date.now(); await p.goto('https://ad.test/ray.html');
  const ev = [...TAPS.map(t => [t, 'tap']), ...STILLS.map(([t, k]) => [t, k])].sort((a, b) => a[0] - b[0]);
  for (const [t, what] of ev) {
    const w = t - (Date.now() - t0); if (w > 0) await p.waitForTimeout(w);
    if (what === 'tap') { const s = await p.evaluate(() => window.RAY_AD_STATE()); if (s.hint >= 0) { const c = await p.evaluate(i => window.RAY_AD_TILE(i), s.hint); await p.touchscreen.tap(c.x, c.y); } }
    else await p.screenshot({ path: path.join(DIST, `ray-reklam-${th}-kare-${what}.png`) });
  }
  const w = TOTAL - (Date.now() - t0); if (w > 0) await p.waitForTimeout(w);
  console.log(th, JSON.stringify(await p.evaluate(() => window.RAY_AD_STATE())));
  const vid = await p.video().path(); await ctx.close(); await b.close();
  // baştaki boş yükleme anı kırpılır (sayfa çizilmeden önceki ~0,4 sn)
  const out = path.join(DIST, `ray-reklam-${th}-kayit.mp4`);
  cp.execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '0.4', '-i', vid, '-t', '20', '-r', '30', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', '-an', out]);
  fs.rmSync(tmp, { recursive: true, force: true }); console.log(out, (fs.statSync(out).size / 1048576).toFixed(1) + ' MB');
})().catch(e => { console.error(e); process.exit(2); });
