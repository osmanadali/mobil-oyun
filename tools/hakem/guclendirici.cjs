// Güçlendiriciler (🔄 ek tur · 🔦 fener · ⏱ +15 sn · ↶ geri al) ve yeni sandık dağılımı — hakem.cjs K bölümü çağırır
module.exports = async T => {
  const { browser, URL, open, check, tapTile, getSave, starsUpTo } = T;
  const errs = [];
  const play = async (level, bst, x = {}) => {
    const o = await open(browser, URL, { save: { played: 60, level, stars: starsUpTo(level), seen: Object.fromEntries(Array.from({ length: 20 }, (_, k) => [k, 1])), remindAsked: true, bst, ...x } });
    await o.page.click('#bPlay'); await o.page.waitForTimeout(800); return o;
  };
  const vis = (page, id) => page.evaluate(id => !document.getElementById(id).hidden, id);

  // ---------- a) sandık: ipucu artık baskın değil; güçlendirici yalnız kuralı açılmışsa çıkar ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 60, level: 200, remindAsked: true } });
    const r = await page.evaluate(() => {
      const R = window.__ray, count = level => { const k = {}, ids = {}; for (let s = 1; s <= 600; s++) { const x = R.roll(s * 7919, s % 9, level); k[x.kind] = (k[x.kind] || 0) + 1; if (x.kind === 'bst') ids[x.id] = 1; } return { k, ids: Object.keys(ids).sort().join() }; };
      return { late: count(200), early: count(20) };
    });
    const hint = r.late.k.hint / 600, b = r.late.k.bst / 600;
    check('bst.chest', 'Sandık: ipucu payı %50\'nin altında, güçlendirici ~%35–45; M7\'ye gelmiş oyuncuya 4 güçlendirici de çıkar, M2\'de yalnız ⏱ ve ↶',
      hint < .5 && b > .3 && b < .5 && r.late.ids === 'fener,geri,sure,tur' && r.early.ids === 'geri,sure', JSON.stringify(r));
    errs.push(...errors); await ctx.close();
  }

  // ---------- b) 🔄 ek tur: kilitlenen sayılı karoya dokununca sorulur, kabul edilince bir kez daha döner ----------
  {
    const { ctx, page, errors } = await play(140, { tur: 2 });
    const i = await page.evaluate(() => { const G = window.__ray.G; const i = G.cnt.findIndex((v, k) => v >= 0 && G.cur[k] !== G.sol[k] && !G.fixed[k]); if (i >= 0) G.cnt[i] = 0; return i; });
    await tapTile(page, i); await page.waitForTimeout(400);
    const asked = await page.evaluate(() => document.getElementById('modal').classList.contains('open') && /Ek tur/.test(document.getElementById('mCard').textContent));
    await page.click('#mYes'); await page.waitForTimeout(300);
    const c1 = await page.evaluate(i => window.__ray.G.cnt[i], i), v0 = await page.evaluate(i => window.__ray.G.cur[i], i);
    await tapTile(page, i); await page.waitForTimeout(200);
    const r = await page.evaluate(i => ({ v: window.__ray.G.cur[i], c: window.__ray.G.cnt[i] }), i), s = await getSave(page);
    check('bst.tur', '🔄 Ek tur: kilitli sayılı karoya dokununca sorulur; kullanınca karo bir kez daha döner, ek tur 1 azalır',
      i >= 0 && asked && c1 === 1 && r.v !== v0 && r.c === 0 && s.bst?.tur === 1, JSON.stringify({ i, asked, c1, r, tur: s.bst?.tur }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- c) 🔦 fener: karanlık tünelde düğme görünür; 5 sn bütün tahta aydınlık, sonra yeniden kararır ----------
  {
    const { ctx, page, errors } = await play(105, { fener: 1 });
    const seen = () => page.evaluate(() => { const G = window.__ray.G; return [G.seen.filter(Boolean).length, G.cur.length]; });
    const b0 = await vis(page, 'gLamp'), [s0, n] = await seen();
    await page.click('#gLamp'); await page.waitForTimeout(400);
    const [s1] = await seen(), b1 = await vis(page, 'gLamp');
    await page.waitForTimeout(5200);
    const [s2] = await seen(), s = await getSave(page);
    check('bst.fener', '🔦 Fener: karanlık tünelde görünür; basınca bütün karolar 5 sn aydınlık, sonra yeniden kararır; fener 1 azalır',
      b0 && s0 < n && s1 === n && !b1 && s2 < n && s.bst?.fener === 0, JSON.stringify({ b0, s0, s1, s2, n, b1, fener: s.bst?.fener }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- d) ⏱ +15 sn: yalnız son 10 saniyede görünür; süre hedefi 15 sn uzar ----------
  {
    const { ctx, page, errors } = await play(20, { sure: 1 });
    const b0 = await vis(page, 'gPlus');
    const t0 = await page.evaluate(() => { const G = window.__ray.G; G.ms = (G.lim.t - 6) * 1000; return G.lim.t; });
    await page.waitForTimeout(500);
    const b1 = await vis(page, 'gPlus');
    await page.click('#gPlus'); await page.waitForTimeout(400);
    const r = await page.evaluate(() => { const G = window.__ray.G; return { t: G.lim.t, stars: [...document.getElementById('gStars').children].filter(e => e.classList.contains('on')).length }; }), s = await getSave(page);
    check('bst.sure', '⏱ +15 sn: başta gizli, son 10 sn\'de görünür; basınca süre hedefi 15 sn uzar, ⏱ yıldızı yanık kalır',
      !b0 && b1 && r.t === t0 + 15 && r.stars === 3 && s.bst?.sure === 0 && s.runs?.level?.xt === 15, JSON.stringify({ b0, b1, t0, ...r, sure: s.bst?.sure, xt: s.runs?.level?.xt }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- e) ↶ geri al: son 5 hamle silinir, hamle sayacı geri gider ----------
  {
    const { ctx, page, errors } = await play(20, { geri: 1 });
    const b0 = await vis(page, 'gUndo');
    const tiles = await page.evaluate(() => { const G = window.__ray.G, out = []; for (let i = 0; i < G.cur.length && out.length < 7; i++) if (!G.pinned[i] && G.link[i] < 0 && G.cur[i] !== G.sol[i]) out.push(i); return out; });
    const snaps = [];
    for (const i of tiles) { snaps.push(await page.evaluate(() => ({ cur: window.__ray.G.cur.join(), m: window.__ray.G.moves }))); await tapTile(page, i); await page.waitForTimeout(120); }
    const m7 = await page.evaluate(() => window.__ray.G.moves), b1 = await vis(page, 'gUndo');
    await page.click('#gUndo'); await page.waitForTimeout(300);
    const r = await page.evaluate(() => ({ cur: window.__ray.G.cur.join(), m: window.__ray.G.moves })), s = await getSave(page), b2 = await vis(page, 'gUndo');
    check('bst.geri', '↶ Geri al: hamle yapılınca görünür; son 5 hamle silinir (dizilim 5 hamle öncesine döner), hamle sayacı 5 azalır',
      !b0 && b1 && tiles.length === 7 && m7 === 7 && r.m === 2 && r.cur === snaps[2].cur && s.bst?.geri === 0 && !b2, JSON.stringify({ b0, b1, m7, m: r.m, same: r.cur === snaps[2].cur, geri: s.bst?.geri, b2 }));
    errs.push(...errors); await ctx.close();
  }

  check('bst.errors', 'Güçlendirici senaryolarında konsol hatası yok', !errs.length, errs.slice(0, 3).join(' | ') || 'hata yok');
};
