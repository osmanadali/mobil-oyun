// iPad (1.1): tablette arayüz telefondaki oranında büyür — görüş alanı kısa kenar 540 CSS px sayılır; telefonda değişiklik yok.
// hakem.cjs K bölümü çağırır; tek başına: --only=tablet
module.exports = async T => {
  const { browser, URL, open, check, starsUpTo, tapTile } = T;
  const R = {};
  for (const [tag, vp] of [['phone', [390, 844]], ['mini', [744, 1133]], ['air', [820, 1180]], ['pro13', [1024, 1366]]]) {
    const { ctx, page, errors } = await open(browser, URL, { vp, save: { played: 30, level: 30, stars: starsUpTo(30), remindAsked: true } });
    await page.waitForTimeout(600);
    const home = await page.evaluate(() => {
      const r = id => document.getElementById(id).getBoundingClientRect(), p = r('bPlay');
      return { tab: document.documentElement.classList.contains('tablet'), w: innerWidth, h: innerHeight, ov: document.documentElement.scrollWidth > innerWidth + 1,
        play: p.bottom <= innerHeight + 1 && p.height >= 44, shop: r('bShop').width > 0 };
    });
    await page.click('#bPlay'); await page.waitForTimeout(1500);
    if (await page.evaluate(() => document.getElementById('modal').classList.contains('open') && !!document.getElementById('mGo'))) { await page.click('#mGo'); await page.waitForTimeout(500); }   // kural kartı
    const g = await page.evaluate(() => { const c = document.getElementById('cv').getBoundingClientRect(), { G, geo } = window.__ray;
      return { s: geo.s, bw: geo.s * G.cols, fit: c.left >= -1 && c.right <= innerWidth + 1, hint: document.getElementById('bHint').getBoundingClientRect().bottom <= innerHeight + 1 };
    });
    const i = await page.evaluate(() => { const { G } = window.__ray; return G.cur.findIndex((v, i) => v && v !== 15 && !G.fixed[i] && !G.pinned?.[i] && !(G.unitOf?.[i] >= 0) && !((G.link?.[i] ?? -1) >= 0) && (!G.seen || G.seen[i])); });
    const c0 = await page.evaluate(i => window.__ray.G.cur[i], i);
    await tapTile(page, i); await page.waitForTimeout(350);   // dokunuş tuvaldeki doğru karoya gider: o karo döner
    const c1 = await page.evaluate(i => window.__ray.G.cur[i], i);
    R[tag] = { ...home, ...g, tap: c1 !== c0, i, err: errors.length };
    await ctx.close();
  }
  const t = R.phone, ok = !t.tab && t.w === 390 && ['mini', 'air', 'pro13'].every(k => { const r = R[k]; return r.tab && r.w === 540 && !r.ov && r.play && r.shop && r.fit && r.hint && r.tap && !r.err && r.bw >= 380; });
  check('tablet.scale', 'iPad: arayüz ekran oranında büyür (görüş alanı 540 CSS px, iPad mini/Air/Pro 13"), yatay taşma yok, Oyna ve İpucu ekranda, tahta ≥ 380 px ve dokunuş doğru karoya gider; telefonda (390 px) değişiklik yok',
    ok, JSON.stringify(R), 'high');
};
