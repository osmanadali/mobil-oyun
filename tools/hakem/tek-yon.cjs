// ↗ Tek yön (oneway) — hakem.cjs K bölümü çağırır. Ayrıntı: docs/kurallar/tek-yon.md
// Üretim (oklu köşe/T, giriş = çözümde merkeze giden kol, yanıltıcı başlangıç, uyumlu her eklentiyle), denetimin yönü, çözücü süzgecinin sağlamlığı,
// tabela/halkayla aynı bölümde gelmez, eski bölümler bit bit aynı, hat ve merdiven, kural kartı (320 px), oyun (ok karoyla döner, robot çözer), karanlık tünel.
module.exports = async T => {
  const { browser, URL, open, check, solve, shot, tapTile, waitModal, starsUpTo, RL, AT, seenTo } = T;
  const errs = [], OL = RL.oneway, A = AT('oneway');
  const NO_OW = `window.RAY_RULES = []; { const push = window.RAY_RULES.push.bind(window.RAY_RULES); window.RAY_RULES.push = f => push(api => { const m = f(api); return m?.key === 'oneway' ? null : m; }); }`;

  // ---------- a) üretim ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 9 } });
    const g = await page.evaluate(OL => {
      const R = window.__ray, o = { n: 0, none: 0, place: 0, entry: 0, mis: 0, bad: 0, pre: 0, allow: 0, k: 0, mix: 0, ms: 0 };
      const me = R.MODS.find(m => m.key === 'oneway'), keys = R.MODS.map(m => m.key).filter(k => k !== 'oneway' && !me.clash.includes(k));
      const rot = R.rot, popc = m => (m & 1) + (m >> 1 & 1) + (m >> 2 & 1) + (m >> 3 & 1), per = m => rot(m) === m ? 1 : rot(rot(m)) === m ? 2 : 4;
      const t0 = performance.now();
      for (const [c, r] of [[6, 8], [7, 9]]) for (const x of [{}, { two: true }, { fog: true, rev: 3, cnt: 3 }, ...keys.map(k => ({ [k]: 2 }))]) for (let s = 1; s <= 8; s++) {
        const P = R.generate(c, r, s * 7919 + 211, 0, s % 3 || Object.keys(x).some(k => keys.includes(k)) ? 0 : 2, { ...x, oneway: 3 }); o.n++;
        const Ls = R.lit({ ...P, cur: P.sol });
        if (!Ls.solved) o.bad++;
        if (R.lit(P).solved) o.pre++;
        if (!P.oneway) { o.none++; continue; }
        const I = P.oneway.flatMap((b, i) => b ? [i] : []); o.k += I.length;
        for (const i of I) {
          // oklu karo: köşe ya da T (4 yönü ayrı), merkez/birim/eşli değil; giriş biti çözümde bir kol ve o kolun komşusu tam ebeveyn (d − 1, aynı merkez)
          if (per(P.sol[i]) !== 4 || popc(P.sol[i]) < 2 || popc(P.sol[i]) > 3 || i === P.hub || i === P.hub2 || (P.unitOf?.[i] ?? -1) >= 0 || P.link[i] >= 0 || P.sign?.[i]) o.place++;
          const b = P.oneway[i], k = [1, 2, 4, 8].indexOf(b), j = R.nb(P, i, k);
          if (!(P.sol[i] & b) || j < 0 || Ls.d[j] !== Ls.d[i] - 1) o.entry++;
          if (P.cur[i] === P.sol[i]) o.mis++;   // yanıltıcı başlangıç: ok çözüm yönünde gelmez
          if (!me.allow(P, i, P.sol[i])) o.allow++;   // çözücü süzgeci çözümü elemez (sağlam)
        }
      }
      o.ms = Math.round(performance.now() - t0);
      // denetimin yönü: 3×1 tahta, merkez solda; ortadaki düz… yerine köşe gerekir → 2×2: merkez 0 (sol üst), 0→1→3→2 yolu
      // sol = [E, W|S, E, N|W] (0: D · 1: B+G · 3: K+B · 2: D). Karo 1'in girişi B (merkezden) → geçer; girişi G (3'ten) olsaydı → kalır.
      const Q = { cols: 2, rows: 2, hub: 0, hub2: -1, sol: [2, 12, 2, 9], cur: [2, 12, 2, 9], link: [-1, -1, -1, -1], oneway: [0, 8, 0, 0] };
      const okIn = !me.check(Q, R.lit({ ...Q, oneway: null })), badIn = me.check({ ...Q, oneway: [0, 4, 0, 0] }, R.lit({ ...Q, oneway: null })) === 1;
      const T3 = { ...Q, oneway: [0, 0, 0, 1] }, ok3 = !me.check(T3, R.lit({ ...T3, oneway: null }));   // karo 3 (K+B): giriş K (1'den) → geçer
      o.dir = okIn && badIn && ok3;
      // tabela ve halkayla hiçbir bölümde birlikte değil (karma dahil)
      for (let l = R.lineStart(OL); l < R.lineStart(OL) + 600; l++) { const U = R.rulesFor(l); if (U.has('oneway') && (U.has('sign') || U.has('ring'))) o.mix++; }
      const a = R.lineStart(OL), z = R.lineStart(OL + 1); let early = 0, own = 0;
      for (let l = 1; l < a; l++) if (R.rulesFor(l).has('oneway')) early++;
      for (let l = a; l < z; l++) if (R.puzzleFor(l).oneway) own++;
      const avg = c => { let d = 0; const a = R.lineStart(c), z = R.lineStart(c + 1); for (let l = a; l < z; l++) d += R.puzzleFor(l).diff; return +(d / (z - a)).toFixed(1); };
      let km = 0; for (let l = R.lineStart(R.RULE_LINE.express + 1); l < R.lineStart(R.RULE_LINE.express + 1) + 280; l++) if (R.rulesFor(l).has('oneway')) km++;
      o.line = { early, own, len: z - a, km, intro: R.puzzleFor(a).oneway?.filter(Boolean).length, size: [a, a + 1, a + 2, a + 3].map(l => R.sizeFor(l).join('x')).join(' '), ladder: [avg(OL - 1), avg(OL)] };
      return o;
    }, OL);
    check('rule.oneway.gen', `Tek yön: ${g.n} tohum (6×8 · 7×9, uyumlu her eklentiyle) → çözüm geçerli, çözülmüş gelmez; oklu karo köşe/T, giriş çözümde merkeze giden kol, ok çözüm yönünde başlamaz; çözücü süzgeci çözümü elemez`,
      g.n >= 300 && g.none === 0 && g.bad === 0 && g.pre === 0 && g.place === 0 && g.entry === 0 && g.mis === 0 && g.allow === 0 && g.k >= g.n * 2, JSON.stringify({ ...g, line: undefined }));
    check('rule.oneway.dir', 'Tek yön denetimi: giriş kolu ebeveyne bakarsa geçer, çocuğa bakarsa bölüm bitmez (2×2 elle kurulmuş tahta)', g.dir, String(g.dir));
    check('rule.oneway.clash', 'Tek yön tabela ve halkayla hiçbir bölümde birlikte gelmez (600 bölüm, karma dahil)', g.mix === 0, String(g.mix));
    check('rule.oneway.line', `M${OL + 1} (${A}. bölümden): önceki bölümlerde yok, hattın her bölümünde var, giriş 2 oklu karo, ilk 3 bölüm 6×8, karmada da gelir; merdiven M${OL} ${g.line.ladder[0]} < M${OL + 1} ${g.line.ladder[1]}`,
      g.line.early === 0 && g.line.own === g.line.len && g.line.intro === 2 && g.line.km >= 5 && g.line.size === '6x8 6x8 6x8 7x9' && g.line.ladder[0] < g.line.ladder[1], JSON.stringify(g.line));
    errs.push(...errors); await ctx.close();
  }

  // ---------- b) eski bölümler ----------
  {
    const sig = page => page.evaluate(a => {
      const R = window.__ray, h = s => { let x = 2166136261; for (const c of s) x = Math.imul(x ^ c.charCodeAt(0), 16777619); return (x >>> 0).toString(36); };
      let lv = ''; for (let l = 1; l < a; l += 5) { const P = R.puzzleFor(l); lv += P.sol.join('') + P.cur.join('') + P.diff; }
      return { lv: h(lv), d: h(['2026-10-27', '2027-03-14', '2026-11-08'].map(d => R.dailyBase(d).cur.join('')).join()) };
    }, A);
    const PA = await open(browser, URL, { save: { played: 1 } }), PB = await open(browser, URL, { save: { played: 1 }, init: NO_OW });
    const sa = await sig(PA.page), sb = await sig(PB.page);
    check('rule.oneway.old', `Tek yön eklentisi çıkarılınca 1–${A - 1}. bölümler ve Günün Hattı aynı`, sa.lv === sb.lv && sa.d === sb.d, JSON.stringify({ sa, sb }));
    errs.push(...PA.errors, ...PB.errors); await PA.ctx.close(); await PB.ctx.close();
  }

  // ---------- c) oyun: kural kartı (320 px), ok karoyla döner, robot çözer ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { vp: [320, 640], save: { played: A - 1, level: A, stars: starsUpTo(A), seen: seenTo(OL), remindAsked: true } });
    await page.click('#bPlay'); await page.waitForTimeout(800);
    const card = await page.evaluate(() => { const m = document.querySelector('#modal .sheet'); return { open: document.getElementById('modal').classList.contains('open'), txt: m?.querySelector('h2')?.textContent, demo: !!document.querySelector('.rd-oneway u'), anim: getComputedStyle(document.querySelector('.rd-oneway-t b') || document.body).animationName, fit: m ? m.scrollWidth <= m.clientWidth + 1 && m.getBoundingClientRect().right <= innerWidth + 1 && m.getBoundingClientRect().top >= 0 : false }; });
    await shot(page, 'rule-oneway');
    if (card.open) await page.click('#mGo'); await page.waitForTimeout(500);
    const g0 = await page.evaluate(() => { const G = window.__ray.G, I = G.oneway.flatMap((b, i) => b ? [i] : []); return { I, cur: I.map(i => G.cur[i]), W: document.documentElement.scrollWidth <= innerWidth }; });
    await shot(page, 'oneway');
    await tapTile(page, g0.I[0]); await page.waitForTimeout(300);
    const g1 = await page.evaluate(i => { const G = window.__ray.G; return { cur: G.cur[i], tip: document.getElementById('toast').textContent, saved: !!JSON.parse(localStorage.getItem('ray')).owTip }; }, g0.I[0]);
    const rot = m => ((m << 1) | (m >> 3)) & 15;
    const taps = await solve(page, 12); const won = await waitModal(page);
    check('rule.oneway.card', `M${OL + 1} ilk girişte "YENİ KURAL · Tek yön" kartı (animasyonlu), 320 px'te taşmaz`, card.open && /Tek yön/.test(card.txt || '') && card.demo && card.anim === 'rdoR' && card.fit, JSON.stringify(card), 'medium');
    check('rule.oneway.play', `Bölüm ${A}: ${g0.I.length} oklu karo; oklu karo dokununca döner (ok onunla), ilk dokunuşta bir kez ipucu; robot çözer; 320 px'te yatay taşma yok`,
      g0.I.length === 2 && g1.cur === rot(g0.cur[0]) && /Tek yön/.test(g1.tip) && g1.saved && won && g0.W, JSON.stringify({ ...g0, ...g1, taps, won }));
    errs.push(...errors); await ctx.close();
  }
  {
    // hattın ortasında (zorluk paylı, 7×9) bir bölüm: robot kazanır
    const L2 = A + 7, { ctx, page, errors } = await open(browser, URL, { save: { played: L2 - 1, level: L2, stars: starsUpTo(L2), seen: { ...seenTo(OL), [OL]: 1 }, remindAsked: true } });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    const info = await page.evaluate(() => { const G = window.__ray.G; return { k: G.oneway?.filter(Boolean).length, size: G.cols + 'x' + G.rows }; });
    await solve(page, 8); const won = await waitModal(page);
    check('rule.oneway.mid', `Bölüm ${L2}: ${info.k} oklu karo (${info.size}); robot kazanır`, info.k >= 3 && won, JSON.stringify({ ...info, won }));
    errs.push(...errors); await ctx.close();
  }
  {
    // karanlık tünel + tek yön (karma): robot ışığı izleyerek kazanır
    const pg = await open(browser, URL, { save: { played: 9 } });
    const f = await pg.page.evaluate(() => { const R = window.__ray; for (let l = R.lineStart(R.RULE_LINE.oneway + 1); l < 20000; l++) { const U = R.rulesFor(l); if (U.has('oneway') && U.has('fog')) return l; } return -1; });
    await pg.ctx.close();
    const o = await open(browser, URL, { save: { played: f - 1, level: f, stars: starsUpTo(f), seen: Object.fromEntries(Array.from({ length: 40 }, (_, k) => [k, 1])), remindAsked: true } });
    await o.page.click('#bPlay'); await o.page.waitForTimeout(800);
    const info = await o.page.evaluate(() => { const G = window.__ray.G; return { fog: !!G.fog, oneway: !!G.oneway }; });
    await solve(o.page, 8, 80); const won = await waitModal(o.page);
    check('rule.oneway.fog', `Bölüm ${f}: karanlık tünel + tek yön; robot ışığı izleyerek kazanır`, f > 0 && info.fog && info.oneway && won, JSON.stringify({ f, ...info, won }));
    errs.push(...o.errors); await o.ctx.close();
  }
  check('rule.oneway.errors', 'Tek yön senaryolarında konsol hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
};
