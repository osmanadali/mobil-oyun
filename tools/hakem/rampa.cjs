// 🐣 Öğrenme rampası (12 Kasım, oyuncular "çok zor" dedi): ilk hatlarda ⏱ yıldız süresi geniş, M5'ten sonra eskisi; ilk iki hatta son süre yok (can gitmez)
// hakem.cjs K bölümü çağırır; tek başına: --only=rampa
module.exports = async T => {
  const { browser, URL, open, check } = T;
  const { ctx, page, errors } = await open(browser, URL, { save: { played: 1 } });
  const r = await page.evaluate(() => {
    const R = window.__ray, out = [];
    for (let c = 0; c < 7; c++) { const l = R.lineStart(c) + 2, P = R.puzzleFor(l), raw = .75 * (P.taps * 1.3 + P.cur.length * .5 + Math.max(0, (P.diff || 0) - 8) * 3);
      out.push({ c, l, raw, base: Math.max(11, Math.round(raw)), t: R.limits({ ...P, lvl: l, daily: false }).t, daily: R.limits({ ...P, lvl: 0, daily: true }).t }); }
    return out;
  });
  const want = c => Math.max(1, 1.6 - .15 * c);
  const ok = r.every(x => x.t === Math.max(11, Math.round(want(x.c) * x.raw)) && x.daily === x.base) && r[0].t > r[0].base * 1.4 && r[5].t === r[5].base;
  await ctx.close();
  check('rampa', 'Öğrenme rampası: ⏱ yıldız süresi M1 ×1,6 · M2 ×1,45 · M3 ×1,3 · M4 ×1,15 · M5+ eskisi gibi; Günün Hattı değişmez', ok && !errors.length, JSON.stringify(r), 'high');
};
