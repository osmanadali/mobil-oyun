// 🌐 Sarmal tahta (wrap) — hakem.cjs K bölümü çağırır. Ayrıntı: docs/kurallar/sarmal-tahta.md
module.exports = async T => {
  const { browser, URL, open, check, solve, shot, waitModal, starsUpTo, RL, AT, seenTo } = T;
  const errs = [], WL = RL.wrap, A = AT('wrap');
  const NO_WRAP = `window.RAY_RULES = []; { const push = window.RAY_RULES.push.bind(window.RAY_RULES); window.RAY_RULES.push = f => push(api => { const m = f(api); return m?.key === 'wrap' ? null : m; }); }`;

  // ---------- a) üretim: komşuluk, çözüm, kenar geçişi, öteki eklentilerle, zorluk ölçümü, hat ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 9 } });
    const g = await page.evaluate(WL => {
      const R = window.__ray, o = { n: 0, adj: 0, bad: 0, pre: 0, cross: 0, minCross: 99, open: 0, openN: 0 };
      const wrapM = R.MODS.find(m => m.key === 'wrap'), keys = R.MODS.map(m => m.key).filter(k => k !== 'wrap' && !wrapM.clash.includes(k));
      for (const [c, r] of [[6, 8], [7, 9]]) for (let s = 1; s <= 150; s++) {
        const P = R.generate(c, r, s * 7919 + 13, 0, s % 4 ? 0 : 2, { wrap: 1, two: s % 5 === 0, rev: s % 3 ? 0 : 3 }); o.n++;
        // sarmal komşuluk: her karonun 4 komşusu var, simetrik, geometrik komşu kipine (mod) göre
        for (let i = 0; i < P.cur.length; i++) for (let k = 0; k < 4; k++) {
          const j = R.nb(P, i, k), dx = [0, 1, 0, -1][k], dy = [-1, 0, 1, 0][k], x = (i % c + dx + c) % c, y = ((i / c | 0) + dy + r) % r;
          if (j !== y * c + x || R.nb(P, j, (k + 2) % 4) !== i || P.ao[i * 4 + k] !== [4, 8, 1, 2][k]) o.adj++;
        }
        if (!R.lit({ ...P, cur: P.sol }).solved) o.bad++;
        if (R.lit(P).solved) o.pre++;
        let x = 0; for (let i = 0; i < P.sol.length; i++) { if (i % c === c - 1 && (P.sol[i] & 2)) x++; if ((i / c | 0) === r - 1 && (P.sol[i] & 4)) x++; }
        o.cross += x; o.minCross = Math.min(o.minCross, x);
        // geçişi tek taraftan kullanan dizilim çözülmez: kenardan taşan bir kolun karşısını çevir
        const e = P.sol.findIndex((v, i) => i % c === c - 1 && (v & 2)); if (e >= 0) { const j = R.nb(P, e, 1), cur = P.sol.slice(); let t = cur[j]; for (let q = 0; q < 3 && (t & 8); q++) t = R.rot(t); if (!(t & 8)) { cur[j] = t; o.openN++; if (!R.lit({ ...P, cur }).solved) o.open++; } }
      }
      // yüklü öteki eklentilerle (çakışmayanlar): çözüm çözülü
      o.mix = {}; for (const k of keys) { let b = 0; for (let s = 1; s <= 60; s++) { const P = R.generate(7, 9, s * 131, 0, 1, { wrap: 1, [k]: 2, two: s % 3 === 0, fog: !!(s % 2) }); if (!R.lit({ ...P, cur: P.sol }).solved) b++; } o.mix[k] = b; }
      // zorluk ölçümü: aynı tohumlarda sarmalsız → sarmallı (çözücü: ilk tur kenar çıkarımı, dal sayısı)
      const dm = (x, N = 80) => { let d = 0, f = 0; for (let s = 1; s <= N; s++) { const P = R.generate(7, 9, s * 37, 0, 0, x); d += R.difficulty(P); } return +(d / N).toFixed(1); };
      o.diff = [dm({}), dm({ wrap: 1 })];
      // hat: sarmal hattından önce yok, hattın her bölümünde var; ilk 3 bölüm 6×8; zorluk merdiveni
      const a = R.lineStart(WL), z = R.lineStart(WL + 1); let early = 0, own = 0;
      for (let l = 1; l < a; l++) if (R.rulesFor(l).has('wrap')) early++;
      for (let l = a; l < z; l++) if (R.puzzleFor(l).wrap) own++;
      const avg = c => { let d = 0; const a = R.lineStart(c), z = R.lineStart(c + 1); for (let l = a; l < z; l++) d += R.puzzleFor(l).diff; return +(d / (z - a)).toFixed(1); };
      o.line = { early, own, len: z - a, size: [a, a + 1, a + 2, a + 3].map(l => R.sizeFor(l).join('x')).join(' '), ladder: [avg(WL - 1), avg(WL), avg(WL + 1)] };
      return o;
    }, WL);
    check('rule.wrap.gen', `Sarmal tahta: ${g.n} tohum → her karonun 4 komşusu var (karşı kenar, simetrik), çözüm çözülü, çözülmüş gelmez, her bölümde ≥ 2 kenar geçişi (ort. ${(g.cross / g.n).toFixed(1)})`,
      g.adj === 0 && g.bad === 0 && g.pre === 0 && g.minCross >= 2, JSON.stringify({ ...g, mix: undefined, line: undefined }));
    check('rule.wrap.open', 'Kenar geçişini tek taraftan kullanan dizilim açık uç sayılır (çözülmez)', g.openN > 100 && g.open === g.openN, JSON.stringify({ open: g.open, openN: g.openN }));
    check('rule.wrap.mix', 'Sarmal tahta + çakışmayan her eklenti (karanlık, iki merkez dönüşümlü): 60 tohumda çözüm çözülü', Object.values(g.mix).every(v => v === 0) && Object.keys(g.mix).length >= 8, JSON.stringify(g.mix));
    check('rule.wrap.diff', `Zorluk ölçümü (7×9, 80 tohum): sarmalsız ${g.diff[0]} → sarmallı ${g.diff[1]} (kenardan başlama taktiği çöker)`, g.diff[1] > g.diff[0] + 6, JSON.stringify(g.diff), 'medium');
    check('rule.wrap.line', `M${WL + 1} (${A}. bölümden): önceki bölümlerde sarmal yok, hattın her bölümünde var, ilk 3 bölüm 6×8; merdiven M${WL} ${g.line.ladder[0]} < M${WL + 1} ${g.line.ladder[1]} < M${WL + 2} ${g.line.ladder[2]}`,
      g.line.early === 0 && g.line.own === g.line.len && g.line.size === '6x8 6x8 6x8 7x9' && g.line.ladder[0] < g.line.ladder[1] && g.line.ladder[1] < g.line.ladder[2], JSON.stringify(g.line));
    errs.push(...errors); await ctx.close();
  }

  // ---------- b) eski bölümler: eklenti çıkarılınca sarmal hattından önceki bölümler aynı ----------
  {
    const sig = page => page.evaluate(a => {
      const R = window.__ray, h = s => { let x = 2166136261; for (const c of s) x = Math.imul(x ^ c.charCodeAt(0), 16777619); return (x >>> 0).toString(36); };
      let lv = ''; for (let l = 1; l < a; l += 5) { const P = R.puzzleFor(l); lv += P.sol.join('') + P.cur.join('') + P.diff; }
      return { lv: h(lv), d: h(['2026-10-27', '2027-03-14'].map(d => R.dailyBase(d).cur.join('')).join()) };
    }, A);
    const PA = await open(browser, URL, { save: { played: 1 } }), PB = await open(browser, URL, { save: { played: 1 }, init: NO_WRAP });
    const sa = await sig(PA.page), sb = await sig(PB.page);
    check('rule.wrap.old', `Sarmal eklentisi çıkarılınca 1–${A - 1}. bölümler ve Günün Hattı aynı`, sa.lv === sb.lv && sa.d === sb.d, JSON.stringify({ sa, sb }));
    errs.push(...PA.errors, ...PB.errors); await PA.ctx.close(); await PB.ctx.close();
  }

  // ---------- c) oyun: kural kartı, kenar işaretleri tahta dışında ve ekranda, robot çözer; karanlık tünelde ışık kenardan geçer ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: A - 1, level: A, stars: starsUpTo(A), seen: seenTo(WL), remindAsked: true } });
    await page.click('#bPlay'); await page.waitForTimeout(800);
    const card = await page.evaluate(() => ({ open: document.getElementById('modal').classList.contains('open'), txt: document.querySelector('.sheet h2')?.textContent, demo: !!document.querySelector('.rd-wrap em'), anim: getComputedStyle(document.querySelector('.rd-wrap em') || document.body).animationName }));
    await shot(page, 'rule-wrap');
    if (card.open) await page.click('#mGo'); await page.waitForTimeout(500);
    const geo = await page.evaluate(() => { const { G, geo } = window.__ray, W = document.getElementById('cv').getBoundingClientRect().width; return { wrap: !!G.wrap, s: geo.s, left: geo.ox, right: geo.ox + geo.s * G.cols, W }; });
    await shot(page, 'wrap');
    const taps = await solve(page, 10); const won = await waitModal(page);
    check('rule.wrap.card', `M${WL + 1} ilk girişte "YENİ KURAL · Sarmal tahta" kartı (animasyonlu)`, card.open && /Sarmal tahta/.test(card.txt || '') && card.demo && card.anim === 'rdwp', JSON.stringify(card), 'medium');
    check('rule.wrap.play', `Bölüm ${A}: kenar işaretleri için tahta dışında pay var (ekrana sığar), robot çözer`, geo.wrap && geo.left >= geo.s * .2 && geo.W - geo.right >= geo.s * .2 && won, JSON.stringify({ ...geo, taps, won }));
    errs.push(...errors); await ctx.close();
  }
  {
    // karanlık tünel + sarmal: ışığı izleyen robot (yalnız aydınlık karolara dokunur) kazanır
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 9 } });
    const f = await page.evaluate(() => {
      const R = window.__ray; let l = R.lineStart(R.RULE_LINE.wrap + 4); for (; l < 20000; l++) { const U = R.rulesFor(l); if (U.has('wrap') && U.has('fog')) break; } return l;
    });
    const o = await open(browser, URL, { save: { played: f - 1, level: f, stars: starsUpTo(f), seen: Object.fromEntries(Array.from({ length: 30 }, (_, k) => [k, 1])), remindAsked: true } });
    await o.page.click('#bPlay'); await o.page.waitForTimeout(800);
    const info = await o.page.evaluate(() => { const G = window.__ray.G; return { fog: !!G.fog, wrap: !!G.wrap, dark: G.seen.filter(v => !v).length }; });
    await solve(o.page, 8, 60); const won = await waitModal(o.page);
    check('rule.wrap.fog', `Bölüm ${f}: karanlık tünel + sarmal tahta, ışık kenardan geçer; robot ışığı izleyerek kazanır`, info.fog && info.wrap && info.dark > 10 && won, JSON.stringify({ f, ...info, won }));
    errs.push(...errors, ...o.errors); await ctx.close(); await o.ctx.close();
  }
  check('rule.wrap.errors', 'Sarmal tahta senaryolarında konsol hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
};
