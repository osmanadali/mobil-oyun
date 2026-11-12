// Mağaza iki sekme (1.1): 🛍️ Paketler | 🎨 Temalar — Mağaza düğmesi Paketler'de, 🎫 çipi Temalar'da açılır; iki sekme de tam boy, ikisinde de ✕
// hakem.cjs K bölümü çağırır; tek başına: --only=magaza-sekme
module.exports = async T => {
  const { browser, URL, open, check, starsUpTo } = T;
  const R = {};
  for (const [vp, loc] of [[[320, 568], 'en-US'], [[390, 844], 'tr-TR']]) {
    const { ctx, page, errors } = await open(browser, URL, { vp, locale: loc, save: { played: 30, level: 30, stars: starsUpTo(30), remindAsked: true } });
    await page.waitForTimeout(600);
    const st = () => page.evaluate(() => { const m = document.getElementById('mCard'), r = m.getBoundingClientRect(), on = m.querySelector('.tabs .on');
      return { open: document.getElementById('modal').classList.contains('open'), tab: on?.id, n: m.querySelectorAll('.tabs button').length, h: Math.round(r.height), H: innerHeight, x: !!document.getElementById('mX'),
        store: !!document.getElementById('store'), skins: !!document.getElementById('skins'), ov: m.scrollWidth > m.clientWidth + 1 }; });
    await page.click('#bShop'); await page.waitForTimeout(700); const a = await st();
    await page.click('#tTh'); await page.waitForTimeout(700); const b = await st();
    await page.click('#tPk'); await page.waitForTimeout(700); const c = await st();
    await page.click('#mX'); await page.waitForTimeout(600);
    await page.click('#crownChip'); await page.waitForTimeout(700); const d = await st();
    R[vp[0]] = { a, b, c, d, err: errors.length };
    await ctx.close();
  }
  const full = s => s.h >= s.H * .9;
  const ok = Object.values(R).every(({ a, b, c, d, err }) => a.open && a.n === 2 && a.tab === 'tPk' && a.store && b.tab === 'tTh' && b.skins && c.tab === 'tPk' && c.store && d.tab === 'tTh' && d.skins
    && [a, b, c, d].every(s => full(s) && s.x && !s.ov) && Math.abs(a.h - b.h) <= 2 && !err);
  check('magaza.sekme', 'Mağaza iki sekme: Mağaza düğmesi Paketler\'de, 🎫 çipi Temalar\'da açılır, sekmeler arası geçiş çalışır; iki sekme de tam boy (pencere zıplamaz), ikisinde de ✕, 320 px\'te taşma yok',
    ok, JSON.stringify(R), 'high');
};
