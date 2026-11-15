// Hatlar ekranı açılışta mevcut bölüme kaydırılır (uzun listede baştan aşağı kaydırmak gerekmesin): mevcut bölüm görünür, ilk hatta kaydırma yok.
// hakem.cjs K bölümü çağırır; tek başına: --only=harita
module.exports = async T => {
  const { browser, URL, open, check } = T;
  const look = async level => {
    const stars = Object.fromEntries(Array.from({ length: level - 1 }, (_, k) => [k + 1, 3]));
    const o = await open(browser, URL, { save: { played: level, level, stars, remindAsked: true, g11: 1, rec: { n: 3, at: Date.now(), line: 99 }, seen: Object.fromEntries(Array.from({ length: 40 }, (_, c) => [c, 1])) } });
    await o.page.evaluate(() => document.getElementById('mClose')?.click()); await o.page.waitForTimeout(300);
    await o.page.evaluate(() => document.getElementById('bMap').click()); await o.page.waitForTimeout(600);
    const r = await o.page.evaluate(() => { const box = document.getElementById('mapList'), cur = box.querySelector('.lv.cur'), b = box.getBoundingClientRect(), c = cur?.getBoundingClientRect();
      return { top: box.scrollTop, cur: cur ? +cur.dataset.l : 0, vis: !!c && c.top >= b.top - 1 && c.bottom <= b.bottom + 1 }; });
    await T.shot(o.page, `harita-${level}`).catch(() => {});
    await o.ctx.close(); return r;
  };
  const a = await look(3), b = await look(120);
  const ok = a.top === 0 && a.vis && b.top > 0 && b.vis && b.cur === 120;
  check('harita', 'Hatlar ekranı mevcut bölümden açılır (bölüm görünür; ilk hatta kaydırma yok)', ok, JSON.stringify({ a, b }), 'high');
};
