// Reklam denetimi: ağ çağrısı yok, konsol hatası yok, el doğru karoyu gösterir, 3 dokunuşta biter, tören ve indirme kartı gelir, dikey ve yatay.
'use strict';
const { chromium } = require('playwright'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, 'dist'), th = process.argv[2] || 'neon';
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const [w, h] of [[390, 844], [844, 390]]) {
    const ctx = await b.newContext({ locale: 'tr-TR', colorScheme: 'light', viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: true });
    const p = await ctx.newPage(), net = [], errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
    await p.route('**/*', r => { const u = r.request().url(); if (u === 'https://ad.test/ray.html') return r.fulfill({ contentType: 'text/html', body: fs.readFileSync(path.join(DIST, `ray-reklam-${th}.html`)) }); if (!u.startsWith('data:')) net.push(u); return r.abort(); });
    await p.goto('https://ad.test/ray.html'); await p.waitForTimeout(1200);
    const ls = await p.evaluate(() => { try { return Object.keys(window.localStorage).length >= 0 && typeof Storage !== 'undefined' && window.localStorage instanceof Storage; } catch { return 'err'; } });
    const st0 = await p.evaluate(() => window.RAY_AD_STATE());
    await p.screenshot({ path: `/tmp/claude-0/t-${w}-0.png` });
    let taps = 0;
    for (let k = 0; k < 8; k++) { const s = await p.evaluate(() => window.RAY_AD_STATE()); if (s.hint < 0) break; const c = await p.evaluate(i => window.RAY_AD_TILE(i), s.hint); await p.touchscreen.tap(c.x, c.y); taps++; await p.waitForTimeout(900); if (k === 1) await p.screenshot({ path: `/tmp/claude-0/t-${w}-1.png` }); }
    await p.waitForTimeout(400); await p.screenshot({ path: `/tmp/claude-0/t-${w}-2.png` });
    await p.waitForTimeout(3000); await p.screenshot({ path: `/tmp/claude-0/t-${w}-3.png` });
    await p.waitForTimeout(3500); await p.screenshot({ path: `/tmp/claude-0/t-${w}-4.png` });
    const st = await p.evaluate(() => window.RAY_AD_STATE());
    const ok = st0.phase === 'play' && taps === 3 && st.won && st.phase === 'cta' && !net.length && !errs.length && ls === false;
    if (!ok) bad++;
    console.log(`${w}x${h}`, ok ? 'GEÇTİ' : 'DÜŞTÜ', JSON.stringify({ st0, taps, st, net: net.slice(0, 3), errs: errs.slice(0, 3), realLocalStorage: ls }));
    await ctx.close();
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
