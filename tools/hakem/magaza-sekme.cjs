// Mağaza iki sekme (1.1): 🛍️ Paketler | 🎨 Temalar — Mağaza düğmesi Paketler'de, 🎫 çipi Temalar'da açılır. Mağaza ayrı sayfa (#shop):
// sekmeler başlığın altında sabit, gövde kendi içinde kayar (sekme değişince sayfa zıplamaz); ‹ ana sayfaya.
// Bölüm sürerken aynı iki sekme pencerede (tam boy, ✕) — oyun ekranı bırakılmaz.
// hakem.cjs K bölümü çağırır; tek başına: --only=magaza-sekme
module.exports = async T => {
  const { browser, URL, open, check, starsUpTo } = T;
  const R = {};
  for (const [vp, loc] of [[[320, 568], 'en-US'], [[390, 844], 'tr-TR']]) {
    const { ctx, page, errors } = await open(browser, URL, { vp, locale: loc, save: { played: 30, level: 30, stars: starsUpTo(30), remindAsked: true } });
    await page.waitForTimeout(600);
    const st = () => page.evaluate(() => { const b = document.getElementById('shopBody'), t = document.getElementById('shopTabs'), r = b.getBoundingClientRect(), on = t.querySelector('.tabs .on');
      return { page: document.getElementById('shop').classList.contains('active'), modal: document.getElementById('modal').classList.contains('open'), tab: on?.id, n: t.querySelectorAll('.tabs button').length,
        top: Math.round(r.top), tabsY: Math.round(t.getBoundingClientRect().top), store: !!b.querySelector('#store'), skins: !!b.querySelector('#skins'), ov: b.scrollWidth > b.clientWidth + 1 || document.documentElement.scrollWidth > innerWidth + 1 }; });
    await page.click('#bShop'); await page.waitForTimeout(700); const a = await st();
    await page.click('#tTh'); await page.waitForTimeout(700); const b = await st();
    await page.click('#tPk'); await page.waitForTimeout(700); const c = await st();
    await page.click('#shBack'); await page.waitForTimeout(600);
    await page.click('#crownChip'); await page.waitForTimeout(700); const d = await st();
    // oyunda: pencere, iki sekme, tam boy, ✕
    await page.click('#shBack'); await page.waitForTimeout(500); await page.click('#bPlay'); await page.waitForTimeout(800);
    await page.evaluate(() => window.__ray.store()); await page.waitForTimeout(600);
    const m = () => page.evaluate(() => { const m = document.getElementById('mCard'), r = m.getBoundingClientRect(); return { open: document.getElementById('modal').classList.contains('open'), tab: m.querySelector('.tabs .on')?.id,
      h: Math.round(r.height), H: innerHeight, x: !!document.getElementById('mX'), game: document.getElementById('game').classList.contains('active'), ov: m.scrollWidth > m.clientWidth + 1 }; });
    const e = await m(); await page.click('#mCard #tTh'); await page.waitForTimeout(600); const f = await m();
    R[vp[0]] = { a, b, c, d, e, f, err: errors.length };
    await ctx.close();
  }
  const pg = s => s.page && !s.modal && s.n === 2 && !s.ov;
  const ok = Object.values(R).every(({ a, b, c, d, e, f, err }) => pg(a) && a.tab === 'tPk' && a.store && pg(b) && b.tab === 'tTh' && b.skins && pg(c) && c.tab === 'tPk' && c.store && pg(d) && d.tab === 'tTh' && d.skins
    && a.top === b.top && a.tabsY === b.tabsY && [e, f].every(s => s.open && s.game && s.h >= s.H * .9 && s.x && !s.ov) && e.tab === 'tPk' && f.tab === 'tTh' && Math.abs(e.h - f.h) <= 2 && !err);
  check('magaza.sekme', 'Mağaza iki sekme: Mağaza düğmesi Paketler\'de, 🎫 çipi Temalar\'da açılır (ayrı sayfa), sekmeler arası geçiş çalışır, sekme değişince sayfa zıplamaz; bölüm sürerken iki sekme pencerede (tam boy, ✕); 320 px\'te taşma yok',
    ok, JSON.stringify(R), 'high');
};
