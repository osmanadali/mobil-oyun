// 👆 Dokunma (1.2.1): dokunmatikte tahta touchstart ile dinlenir (iOS/Android'de karonun ortası "dönmüyordu", kullanıcı videosu 21 Kasım);
// bir dokunuş tam bir kez döndürür (pointer ve touch iki kez işlemez); fare yolu da çalışır; 🩺 dokunma tanısı olayları ve sonucu yazar.
// Tek başına: node tools/hakem.cjs --only=dokunma
module.exports = async T => {
  const { browser, URL, open, check, starsUpTo, seenTo } = T;
  const { ctx, page, errors } = await open(browser, URL, { vp: [393, 852], save: { played: 141, level: 141, stars: starsUpTo(140), remindAsked: true, seen: seenTo(40), sound: true, vib: true }, init: "localStorage.setItem('ray.tapdbg','1')" });
  await page.click('#bPlay').catch(() => {}); await page.waitForTimeout(1500);
  await page.evaluate(() => document.getElementById('mGo')?.click()); await page.waitForTimeout(500);
  const pt = (i, f = .5) => page.evaluate(([i, f]) => { const R = window.__ray, G = R.G, g = R.geo, rc = document.getElementById('cv').getBoundingClientRect(); return [rc.left + g.ox + ((i % G.cols) + f) * g.s, rc.top + g.oy + (((i / G.cols) | 0) + f) * g.s]; }, [i, f]);
  const st = () => page.evaluate(() => { const G = window.__ray.G; return { cur: G.cur.slice(), moves: G.moves }; });
  // düz ya da köşe bir karo seç (dörtlü kavşak dönünce aynı kalır)
  const i = await page.evaluate(() => { const G = window.__ray.G, pc = m => (m & 1) + (m >> 1 & 1) + (m >> 2 & 1) + (m >> 3 & 1); return G.cur.findIndex((v, j) => pc(v) === 2 && !(G.cnt[j] >= 0) && !G.fixed[j]); });
  const s0 = await st(); const [x, y] = await pt(i);
  await page.touchscreen.tap(x, y); await page.waitForTimeout(120);
  const s1 = await st();
  const rot = m => ((m << 1) | (m >> 3)) & 15;
  // aynı karonun ortasına 6 kez daha (insan hızında): her biri bir kez döndürür
  for (let k = 0; k < 6; k++) { await page.touchscreen.tap(x, y); await page.waitForTimeout(130); }
  const s2 = await st();
  let want = s0.cur[i]; for (let k = 0; k < 7; k++) want = rot(want);
  const [x2, y2] = await pt(i + 1); await page.mouse.click(x2, y2); await page.waitForTimeout(120);
  const s3 = await st();
  const log = await page.evaluate(() => document.getElementById('tapDbg')?.textContent || '');
  check('dokunma.touch', 'Dokunmatik: karonun ortasına her dokunuş tam bir kez döndürür (7 dokunuş = 7 × 90°; çift işleme yok); aynı karoya art arda dokunuş 1 hamle; fare yolu da çalışır',
    s1.cur[i] === rot(s0.cur[i]) && s2.cur[i] === want && s2.moves === s0.moves + 1 && s3.cur[i + 1] !== s2.cur[i + 1] && s3.moves === s2.moves + 1, JSON.stringify({ i, s0: s0.cur[i], s1: s1.cur[i], s2: s2.cur[i], want, m: [s0.moves, s1.moves, s2.moves, s3.moves] }), 'high');
  check('dokunma.tani', '🩺 Dokunma tanısı: her olayı, düştüğü karoyu ve sonucu yazar (touch → karo → döndü)', /touch \d+,\d+ → karo \d+ \(s\d+ k\d+\) → döndü/.test(log) && /mouse/.test(log), log.slice(0, 400), 'high');
  check('dokunma.konsol', 'Dokunma testinde konsolda hata yok', !errors.length, JSON.stringify(errors.slice(0, 3)));
  await ctx.close();
};
