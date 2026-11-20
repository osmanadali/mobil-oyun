// Şehir haritası hareketi: sıradaki hattın treni merkezden çıkıp ilerleme oranındaki noktaya gider (geçtiği duraklar yanar),
// biten hatlarda küçük trenler; azaltılmış harekette canlandırma yok. Şehir okları başlığı da değiştirir.
// hakem.cjs K bölümü çağırır; tek başına: --only=sehir
module.exports = async T => {
  const { browser, URL, open, check, LS } = T;
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, k) => a + k);
  const all = (a, b, v) => Object.fromEntries(range(a, b).map(l => [l, v]));
  const base = { played: 60, remindAsked: true, cityLit: 999, seen: Object.fromEntries(range(0, 60).map(k => [k, 1])) };
  // M6 yarıda: bitirilen bölüm / hattın bölüm sayısı = 0,5 → tren 2. durakta, 2 durak yanık
  const half = (LS(6) - LS(5)) / 2, level = LS(5) + half;
  const read = page => page.evaluate(() => {
    const cur = document.querySelector('#cityBody .sd.cur'), now = cur.querySelector('.now'), m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(now.getAttribute('transform'));
    const s = [...cur.querySelectorAll('.stn')], st = s[1];
    return { x: +m[1], y: +m[2], sx: +st.getAttribute('cx'), sy: +st.getAttribute('cy'), on: cur.querySelectorAll('.stn.on').length, n: s.length, arr: now.classList.contains('arr'), p: +now.dataset.p,
      minis: document.querySelectorAll('#cityBody .cmini').length, anim: document.getAnimations().filter(a => a.effect?.target?.closest?.('#cityBody')).map(a => (a.animationName || a.transitionProperty) + ':' + a.effect.target.getAttribute('class')).slice(0, 6).join() };
  });
  const errs = [];
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { ...base, level, stars: all(1, level - 1, 3) } });
    await page.click('#home .logo'); await page.waitForTimeout(120);
    const a = await read(page);
    await page.waitForTimeout(3200);
    const b = await read(page);
    const d0 = Math.hypot(a.x, a.y), d1 = Math.hypot(b.x - b.sx, b.y - b.sy);
    check('sehir.tren', 'Şehir haritası: sıradaki hattın treni merkezden çıkar (başta durak yanmaz), ilerleme oranındaki noktaya gider (M6 yarıda → 2. durak, 2 durak yanık), orada nabız atar; biten hatlarda küçük trenler',
      a.p === .5 && d0 < 40 && a.on === 0 && d1 < 1.5 && b.on === 2 && b.arr && b.minis === 3 && !errors.length, JSON.stringify({ a, b, d0, d1, errors }));
    errs.push(...errors); await ctx.close();
  }
  {
    const { ctx, page, errors } = await open(browser, URL, { rm: true, save: { ...base, level, stars: all(1, level - 1, 3) } });
    await page.click('#home .logo'); await page.waitForTimeout(700);
    const r = await read(page), d1 = Math.hypot(r.x - r.sx, r.y - r.sy);
    check('sehir.tren.rm', 'Azaltılmış hareket: tren baştan yerinde (2. durak), küçük tren yok, şehir haritasında canlandırma yok', d1 < 1.5 && r.on === 2 && !r.minis && !r.anim && !errors.length, JSON.stringify({ r, errors }));
    errs.push(...errors); await ctx.close();
  }
  {
    const lv = LS(26) + 2;
    const { ctx, page, errors } = await open(browser, URL, { save: { ...base, level: lv, stars: all(1, lv - 1, 3) } });
    await page.click('#home .logo'); await page.waitForTimeout(600);
    const t = () => page.evaluate(() => ({ title: document.getElementById('cTitle').textContent, sub: document.getElementById('cSub').textContent, pg: document.querySelector('.cpager b').firstChild.textContent }));
    const p1 = await t(); await page.click('#cPrev'); await page.waitForTimeout(400); const p0 = await t();
    check('sehir.baslik', 'Şehir okları: başlık ve alt yazı gösterilen şehrin adını ve durumunu gösterir', p1.title === p1.pg && p0.title === p0.pg && p0.title !== p1.title && /^2\/24/.test(p1.sub) && /^24\/24/.test(p0.sub) && !errors.length, JSON.stringify({ p1, p0, errors }));
    errs.push(...errors); await ctx.close();
  }
};
