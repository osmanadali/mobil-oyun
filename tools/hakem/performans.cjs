// Android akıcılığı: tuval belleği bölüm geçişinde ve bitişte yeniden ayrılmaz; gizli ekranlar boyanmaz; sıradaki bölüm boşta hazırlanır — hakem.cjs K bölümü çağırır
module.exports = async T => {
  const { browser, URL, open, check, solve, starsUpTo } = T;
  const SEEN = Object.fromEntries(Array.from({ length: 60 }, (_, k) => [k, 1]));
  const { ctx, page, errors } = await open(browser, URL, { vp: [412, 915], save: { played: 60, level: 300, stars: starsUpTo(300), seen: SEEN, remindAsked: true, hints: 5 } });
  // ana sayfa açılınca Oyna'nın bölümü boşta üretilir → Oyna'ya basınca üretim beklenmez
  await page.waitForTimeout(3500);
  const pre = await page.evaluate(() => { const t = performance.now(); window.__ray.puzzleFor(300); return Math.round((performance.now() - t) * 10) / 10; });
  const vis = () => page.evaluate(() => Object.fromEntries([...document.querySelectorAll('.screen')].map(s => [s.id, getComputedStyle(s).visibility])));
  const v0 = await vis();
  // tuvale yeni bellek ayrılınca say (width/height ataması)
  await page.evaluate(() => { const cv = document.getElementById('cv'); window.__alloc = 0; for (const k of ['width', 'height']) { const d = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, k); Object.defineProperty(cv, k, { get() { return d.get.call(this); }, set(v) { window.__alloc++; d.set.call(this, v); } }); } });
  await page.click('#bPlay'); await page.waitForTimeout(900);
  const a1 = await page.evaluate(() => window.__alloc), v1 = await vis();
  await solve(page, 25); await page.waitForTimeout(3800);
  const a2 = await page.evaluate(() => window.__alloc), cut = await page.evaluate(() => { const b = document.getElementById('board').getBoundingClientRect(), c = document.getElementById('cv').getBoundingClientRect(); return { board: Math.round(b.height), cv: Math.round(c.height) }; });
  // sonraki bölüm boşta hazırlanmış olmalı
  const nx = await page.evaluate(() => { const t = performance.now(); window.__ray.puzzleFor(301); return Math.round((performance.now() - t) * 10) / 10; });
  await page.click('#mNext').catch(() => {}); await page.waitForTimeout(900);
  const a3 = await page.evaluate(() => window.__alloc), lvl = await page.evaluate(() => window.__ray.G.lvl);
  check('perf.canvas', 'Tuval belleği yalnız ilk açılışta ayrılır: bitişte (panel tahtayı küçültür, tuvalin taşan kısmı kesilir) ve sonraki bölümde yeniden ayrılmaz',
    a2 === a1 && a3 === a1 && cut.cv >= cut.board && lvl === 301 && !errors.length, JSON.stringify({ a1, a2, a3, cut, lvl, errors }));
  check('perf.idle', 'Bölüm boşta hazırlanır: ana sayfada Oyna\'nın bölümü, bitişte sıradaki bölüm hazır (ikisi de < 5 ms)', pre < 5 && nx < 5, JSON.stringify({ pre, nx }));
  check('perf.screens', 'Görünmeyen ekranlar boyanmaz (visibility: hidden), görünen ekran görünür', v0.home === 'visible' && v0.game === 'hidden' && v1.game === 'visible' && v1.home === 'hidden',
    JSON.stringify({ v0, v1 }));
  await ctx.close();
};
