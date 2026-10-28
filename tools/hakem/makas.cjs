// M9 · Makas — robot testleri (hakem.cjs K bölümü çağırır). Sözleşme: docs/kurallar/README.md · tasarım: docs/kurallar/makas.md
module.exports = async T => {
  const { browser, URL, open, check, solve, shot, getSave, tapTile, waitModal, starsUpTo } = T;
  const seen = { 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1 }, base = (l, s = seen) => ({ played: l - 1, level: l, stars: starsUpTo(l), seen: s, remindAsked: true });
  const G = (page, f, a) => page.evaluate(f, a);
  const toastTxt = page => G(page, () => document.getElementById('toast').textContent);

  // ---- 1) üretici: 300 tohum × (7×9 makas 5 · 6×8 karma), eski bölümler bit bit aynı, M10'da makaslı karma bölüm ----
  let mixLvl = 0;
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 1 } });
    const r = await G(page, () => {
      const R = window.__ray, popc = m => (m & 1) + (m >> 1 & 1) + (m >> 2 & 1) + (m >> 3 & 1);
      const md = (P, a, b) => b < 0 ? 99 : Math.abs(a % P.cols - b % P.cols) + Math.abs((a / P.cols | 0) - (b / P.cols | 0));
      const out = {};
      for (const [name, c, rw, pins, pairs, x] of [['7x9', 7, 9, 0, 0, { sw: 5 }], ['karma', 6, 8, 3, 2, { sw: 4, rev: 4, cnt: 4, two: true, fog: true }]]) {
        const o = out[name] = { bad: 0, pre: 0, sw: 0, wrong: 0, near: 0, ex: 0, orbit: 0, tap: 0 };
        for (let s = 1; s <= 300; s++) {
          const P = R.generate(c, rw, name === '7x9' ? s : s * 7919 + 5, pins, pairs, x);
          if (!R.lit({ ...P, cur: P.sol }).solved) o.bad++;
          if (R.lit(P).solved) o.pre++;
          P.sw.forEach((m, i) => {
            if (!m) return; o.sw++;
            if (P.cur[i] !== P.sol[i]) o.wrong++;
            // yörünge: cur ∈ {sol, sol^sw}; iki kol, biri çözümde açık; öbür kol tahtanın içine bakar
            if ((P.cur[i] !== P.sol[i] && P.cur[i] !== (P.sol[i] ^ m)) || popc(m) !== 2 || popc(P.sol[i]) !== 2 || popc(m & P.sol[i]) !== 1 || R.nb(P, i, 31 - Math.clz32(m & ~P.sol[i])) < 0) o.orbit++;
            if (md(P, i, P.hub) < 2 || md(P, i, P.hub2) < 2) o.near++;
            if (P.pinned[i] || P.link[i] >= 0 || P.rev[i] || P.cnt[i] >= 0) o.ex++;
            // birim: K = 2, dokunuş cur ^= sw, iki dokunuş kimlik
            const U = P.units?.[P.unitOf[i]], c2 = P.cur.slice();
            if (!U || U.kind !== 'sw' || U.K !== 2) { o.tap++; return; }
            U.tap(c2); const one = c2[i] === (P.cur[i] ^ m); U.tap(c2); if (!one || c2[i] !== P.cur[i] || R.unitTaps(U, P.cur, P.sol) !== (P.cur[i] !== P.sol[i] ? 1 : 0)) o.tap++;
          });
        }
      }
      // 1–208 ve Günün Hattı: makas kuralından önceki üretimle bit bit aynı (imza, eklentisiz iskelette ölçüldü)
      const h = s => { let x = 2166136261; for (const c of s) x = Math.imul(x ^ c.charCodeAt(0), 16777619); return x >>> 0; };
      const sig = P => [P.cols, P.rows, P.sol.join(), P.cur.join(), P.par, P.taps, P.diff, (P.rules || []).join(), P.pinned.map(Number).join(''), P.link.join(), P.rev.map(Number).join(''), P.cnt.join(), P.hub, P.hub2].join('|');
      let a = ''; for (let l = 1; l <= 208; l++) a += sig(R.puzzleFor(l));
      let d = ''; for (let k = 0; k < 40; k++) { const dt = new Date(2026, 9, 1 + k * 9); d += sig(R.dailyFor(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`)); }
      out.legacy = { lv: h(a), daily: h(d) };
      // giriş bölümü ve testere dişi; M10'da makası başka bir kuralla taşıyan ilk bölüm
      const p = R.puzzleFor(209); out.intro = { size: p.cols + 'x' + p.rows, rules: p.rules.join('+'), sw: p.sw.filter(Boolean).length, wrong: p.sw.filter((m, i) => m && p.cur[i] !== p.sol[i]).length };
      out.saw = [208, 209, 211, 212].map(l => R.sizeFor(l).join('x')).join(' ');
      for (let l = 253; l <= 300 && !out.mix; l++) { const q = R.puzzleFor(l); if (q.rules.includes('sw') && q.rules.length > 1) out.mix = l; }
      return out;
    });
    mixLvl = r.mix || 0;
    const ok = o => o.bad === 0 && o.pre === 0 && o.orbit === 0 && o.near === 0 && o.ex === 0 && o.tap === 0;
    check('sw.gen', 'Makas: 300 tohum × (7×9 · 6×8 karma) çözülebilir, çözülmüş gelmez, cur ∈ {sol, sol^sw}, merkeze bitişik değil, sabit/eşli/ters/sayaçlı değil', ok(r['7x9']) && ok(r.karma) && r['7x9'].sw >= 1425 && r.karma.sw >= 1140 && [r['7x9'], r.karma].every(o => o.wrong / o.sw > .65 && o.wrong / o.sw < .9), JSON.stringify({ a: r['7x9'], b: r.karma }));
    check('sw.legacy', 'Makas: 1–208 ve Günün Hattı bit bit aynı', r.legacy.lv === 2448604344 && r.legacy.daily === 1906665804, JSON.stringify(r.legacy));
    check('sw.intro', 'Makas: 209 giriş bölümü 6×8, yalnız makas, ≥2 makas ve en az biri ters · testere dişi 208–212', r.intro.size === '6x8' && r.intro.rules === 'sw' && r.intro.sw >= 2 && r.intro.wrong >= 1 && r.saw === '7x9 6x8 6x8 7x9', JSON.stringify({ ...r.intro, saw: r.saw }), 'medium');
    check('sw.gen.errors', 'Makas üretici denetiminde konsol hatası yok', !errors.length, errors.join(' | '));
    await ctx.close();
  }

  // ---- 2) 209: kural kartı, dokunuş (dönmez, cur ^= sw, art arda = 1 hamle), bildirim, yarım kayıt, baştan, robot çözer ----
  {
    const { ctx, page, errors } = await open(browser, URL, { save: base(209) });
    await page.click('#bPlay'); await page.waitForTimeout(900);
    const card = await G(page, () => ({ open: document.getElementById('modal').classList.contains('open'), txt: document.querySelector('.sheet h2')?.textContent, demo: !!document.querySelector('.rd-sw .pt u'), noB: !document.querySelector('.rd-sw .pt b') }));
    await shot(page, 'rule-sw');
    if (card.open) await page.click('#mGo');
    await page.waitForTimeout(400);
    const g = await G(page, () => { const G = window.__ray.G, sw = G.sw.map((m, i) => m ? i : -1).filter(i => i >= 0), i = sw.find(j => G.cur[j] !== G.sol[j]) ?? sw[0]; return { size: G.cols + 'x' + G.rows, n: sw.length, i, m: G.sw[i], v: G.cur[i] }; });
    await shot(page, 'sw');
    const st = () => G(page, i => ({ v: window.__ray.G.cur[i], m: window.__ray.G.moves }), g.i);
    const s0 = await st(); await tapTile(page, g.i); await page.waitForTimeout(250);
    const s1 = await st(), t1 = await toastTxt(page), told = (await getSave(page)).swTold;
    await shot(page, 'sw-tap');
    await tapTile(page, g.i); await page.waitForTimeout(250); const s2 = await st();
    await tapTile(page, g.i); await page.waitForTimeout(250); const s3 = await st();
    // yarım kayıt: yeniden açınca makasın durumu ve hamle geri gelir
    await page.reload(); await page.waitForTimeout(400); await page.click('#bPlay'); await page.waitForTimeout(600);
    const s4 = await st();
    await page.click('#bReset'); await page.waitForTimeout(400); const s5 = await st();
    await solve(page, 8); const won = await waitModal(page);
    check('rule.sw.card', 'M9 ilk girişte "YENİ KURAL · Makas" kartı (animasyonlu demo, .pt içinde <b> yok)', card.open && /Makas/.test(card.txt || '') && card.demo && card.noB, JSON.stringify(card), 'medium');
    check('rule.sw', 'Makas: dokununca cur ^= sw (iki kol yer değişir), art arda dokunuş 1 hamle, ilk dokunuşta bildirim',
      g.n >= 2 && s1.v === (s0.v ^ g.m) && s1.m === s0.m + 1 && s2.v === s0.v && s2.m === s1.m && s3.v === s1.v && /Makas/.test(t1) && told === 1, JSON.stringify({ g, s0, s1, s2, s3, t1, told }));
    check('rule.sw.run', 'Makas: yarım oyun makasın durumuyla geri gelir, ↺ baştan ilk duruma döner', s4.v === s3.v && s4.m === s3.m && s5.v === g.v && s5.m === 0, JSON.stringify({ s4, s5 }), 'medium');
    check('rule.sw.win', 'Makaslı bölüm robotla (solve + plan) çözülüp kazanılıyor', won, String(won));
    check('sw.errors', 'Makas senaryosunda konsol hatası yok', !errors.length, errors.join(' | '));
    await ctx.close();
  }

  // ---- 3) ipucu: yalnız bir makas ters → ipucu onu oturtur ve sabitler, bölüm biter ----
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { ...base(210, { ...seen, 8: 1 }), hints: 3 } });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    const i = await G(page, () => { const G = window.__ray.G, i = G.sw.findIndex(Boolean); G.cur.forEach((v, j) => { G.cur[j] = j === i ? G.sol[j] ^ G.sw[j] : G.sol[j]; }); return i; });
    await page.click('#bHint'); const won = await waitModal(page);
    const h = await G(page, i => { const G = window.__ray.G; return { fixed: G.fixed[i], ok: G.cur[i] === G.sol[i] }; }, i);
    check('rule.sw.hint', 'Makas: ipucu makası çözüme oturtup sabitler, bölüm biter', i >= 0 && h.fixed && h.ok && won, JSON.stringify({ i, ...h, won }), 'medium');
    check('sw.hint.errors', 'Makas ipucu senaryosunda konsol hatası yok', !errors.length, errors.join(' | '));
    await ctx.close();
  }

  // ---- 4) M10 karma: makas başka bir kuralla aynı bölümde; robot çözer ----
  {
    const { ctx, page, errors } = await open(browser, URL, { save: base(mixLvl || 253, { ...seen, 8: 1, 9: 1 }) });   // M10 artık kapak hattı: kapak kartı da görülmüş
    await page.click('#bPlay'); await page.waitForTimeout(700);
    const g = await G(page, () => { const G = window.__ray.G; return { lvl: G.lvl, rules: G.rules.join('+'), sw: G.sw?.filter(Boolean).length || 0, card: document.getElementById('modal').classList.contains('open') }; });
    await shot(page, 'sw-mix');
    await solve(page, 8); const won = await waitModal(page);
    check('rule.sw.mix', 'M10 karma bölümde makas başka bir kuralla birlikte geliyor ve çözülüyor', mixLvl >= 253 && g.sw >= 2 && /\+/.test(g.rules) && !g.card && won, JSON.stringify({ ...g, won }), 'medium');
    check('sw.mix.errors', 'Makas karma senaryosunda konsol hatası yok', !errors.length, errors.join(' | '));
    await ctx.close();
  }
};
