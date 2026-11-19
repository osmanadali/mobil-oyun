// 🚄 Ekspres durak (express) — hakem.cjs K bölümü çağırır. Ayrıntı: docs/kurallar/ekspres-durak.md
// Üretim (sayı = çözümdeki uzaklık, durak çözümde uç; uyumlu her eklentiyle), adillik (reddedilmeyen aday sayılarla tek çözüme iner; bağımsız sayım),
// kuralın etkisi (sayının elediği ikinci çözümler), son seferle aynı bölümde gelmez, eski bölümler bit bit aynı, hat ve merdiven,
// kural kartı (320 px), oyun (rozet, robot çözer), karanlık tünel.
module.exports = async T => {
  const { browser, URL, open, check, solve, shot, tapTile, waitModal, starsUpTo, RL, AT, seenTo } = T;
  const errs = [], XL = RL.express, A = AT('express');
  const NO_EX = `window.RAY_RULES = []; { const push = window.RAY_RULES.push.bind(window.RAY_RULES); window.RAY_RULES.push = f => push(api => { const m = f(api); return m?.key === 'express' ? null : m; }); }`;

  // ---------- a) üretim ve adillik ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 9 } });
    const g = await page.evaluate(XL => {
      const R = window.__ray, o = { n: 0, none: 0, place: 0, num: 0, bad: 0, pre: 0, rej: 0, uniq: 0, multi: 0, base2: 0, bind: 0, cut: 0, st: 0, mix: 0, ms: 0 };
      const me = R.MODS.find(m => m.key === 'express'), keys = R.MODS.map(m => m.key).filter(k => k !== 'express' && !me.clash.includes(k));
      const popc = m => (m & 1) + (m >> 1 & 1) + (m >> 2 & 1) + (m >> 3 & 1);
      // bağımsız sayım: çözücünün yaprağında çözümleri say (en çok 2); without: sayılar olmadan
      const count = (P, cap = 600) => { let k = 0; R.difficulty(P, cfg => (R.lit({ ...P, cur: cfg }).solved && k++, k > 1), cap); return k; };
      const t0 = performance.now();
      for (const [c, r] of [[6, 8], [7, 9]]) for (const x of [{}, { two: true }, { fog: true, rev: 3, cnt: 3 }, ...keys.map(k => ({ [k]: 2 }))]) for (let s = 1; s <= 8; s++) {
        const k = 2 + s % 3, P = R.generate(c, r, s * 7919 + 307, 0, s % 3 || Object.keys(x).some(k => keys.includes(k)) ? 0 : 2, { ...x, express: k }); o.n++;
        const Ls = R.lit({ ...P, cur: P.sol });
        if (!Ls.solved) o.bad++;
        if (R.lit(P).solved) o.pre++;
        if (!P.express) { o.none++; continue; }
        const { st, B } = P.express; o.st += st.length;
        // ekspres durak: çözümde uç (tek kollu), merkez/birim/eşli/sayaçlı/kapalı/silik değil; sayı = çözümdeki uzaklık (≥ 3)
        if (st.some(i => popc(P.sol[i]) !== 1 || i === P.hub || i === P.hub2 || (P.unitOf?.[i] ?? -1) >= 0 || P.link[i] >= 0 || P.cnt[i] >= 0 || P.void?.[i] || P.self?.[i]) || st.length !== Math.min(k, st.length) || new Set(st).size !== st.length) o.place++;
        if (st.some((i, j) => B[j] !== Ls.d[i] || B[j] < 3)) o.num++;
        if (P.reject) { o.rej++; continue; }
        const w = count(P), b = count({ ...P, express: null });
        if (w === 1) o.uniq++; else o.multi++;
        if (b > 1) { o.base2++; if (w === 1) o.bind++; }
      }
      // kuralın etkisi: sayılar olmadan ikinci çözümü olan bölümde o çözüm, ekspres denetimince reddedilir (uzun yol)
      for (let s = 1; s <= 400 && o.cut < 3; s++) {
        const P = R.generate(7, 9, s * 104729 + 5, 0, 0, { express: 3 }); if (!P.express || P.reject) continue;
        const key = P.sol.join(); let alt = null;
        R.difficulty({ ...P, express: null }, cfg => { if (cfg.join() !== key && R.lit({ ...P, express: null, cur: cfg }).solved) alt = cfg; return !!alt; }, 600);
        if (alt) { const L = R.lit({ ...P, cur: alt }); if (!L.solved && L.exBad?.length) o.cut++; }
      }
      o.ms = Math.round(performance.now() - t0);
      for (let l = R.lineStart(XL); l < R.lineStart(XL) + 600; l++) { const U = R.rulesFor(l); if (U.has('express') && U.has('last')) o.mix++; }
      const a = R.lineStart(XL), z = R.lineStart(XL + 1); let early = 0, own = 0;
      for (let l = 1; l < a; l++) if (R.rulesFor(l).has('express')) early++;
      for (let l = a; l < z; l++) if (R.puzzleFor(l).express) own++;
      const avg = c => { let d = 0; const a = R.lineStart(c), z = R.lineStart(c + 1); for (let l = a; l < z; l++) d += R.puzzleFor(l).diff; return +(d / (z - a)).toFixed(1); };
      let km = 0; for (let l = z; l < z + 280; l++) if (R.rulesFor(l).has('express')) km++;
      o.line = { early, own, len: z - a, km, karma: R.rulesFor(z).size > 0 && !R.RULES?.[XL + 1], intro: R.puzzleFor(a).express?.st.length, fin: R.puzzleFor(z - 1).express?.st.length, size: [a, a + 1, a + 2, a + 3].map(l => R.sizeFor(l).join('x')).join(' '), ladder: [avg(XL - 2), avg(XL - 1), avg(XL)] };
      return o;
    }, XL);
    const ok = g.n - g.none - g.rej;
    check('rule.express.gen', `Ekspres durak: ${g.n} tohum (6×8 · 7×9, uyumlu her eklentiyle) → çözüm geçerli, çözülmüş gelmez; durak çözümde uç ve kurala uygun, sayı çözümdeki uzaklık (≥ 3)`,
      g.n >= 300 && g.none === 0 && g.bad === 0 && g.pre === 0 && g.place === 0 && g.num === 0 && g.st >= g.n * 2, JSON.stringify({ ...g, line: undefined }));
    check('rule.express.fair', `Adillik: reddedilmeyen aday sayılarla tek çözüme iner (bağımsız sayım ${g.uniq}/${ok}); sayılar ikinci çözümü eler (${g.bind}/${g.base2}); reddedilen ${g.rej}`,
      g.uniq >= ok * .97 && g.rej <= g.n * .15 && g.cut >= 1, JSON.stringify({ uniq: g.uniq, multi: g.multi, ok, rej: g.rej, base2: g.base2, bind: g.bind, cut: g.cut }));
    check('rule.express.clash', 'Ekspres durak son seferle hiçbir bölümde birlikte gelmez (600 bölüm, karma dahil)', g.mix === 0, String(g.mix));
    check('rule.express.line', `M${XL + 1} (${A}. bölümden): önceki bölümlerde yok, hattın her bölümünde var, giriş 2 durak, final 4, ilk 3 bölüm 6×8, sonrası karma; merdiven M${XL - 1} ${g.line.ladder[0]} < M${XL} ${g.line.ladder[1]} < M${XL + 1} ${g.line.ladder[2]}`,
      g.line.early === 0 && g.line.own === g.line.len && g.line.intro === 2 && g.line.fin === 4 && g.line.km >= 5 && g.line.size === '6x8 6x8 6x8 7x9' && g.line.ladder[0] < g.line.ladder[1] && g.line.ladder[1] < g.line.ladder[2], JSON.stringify(g.line));
    errs.push(...errors); await ctx.close();
  }

  // ---------- b) eski bölümler ----------
  {
    const sig = page => page.evaluate(a => {
      const R = window.__ray, h = s => { let x = 2166136261; for (const c of s) x = Math.imul(x ^ c.charCodeAt(0), 16777619); return (x >>> 0).toString(36); };
      let lv = ''; for (let l = 1; l < a; l += 5) { const P = R.puzzleFor(l); lv += P.sol.join('') + P.cur.join('') + P.diff; }
      return { lv: h(lv), d: h(['2026-10-27', '2027-03-14', '2026-11-08'].map(d => R.dailyBase(d).cur.join('')).join()) };
    }, A);
    const PA = await open(browser, URL, { save: { played: 1 } }), PB = await open(browser, URL, { save: { played: 1 }, init: NO_EX });
    const sa = await sig(PA.page), sb = await sig(PB.page);
    check('rule.express.old', `Ekspres durak eklentisi çıkarılınca 1–${A - 1}. bölümler ve Günün Hattı aynı`, sa.lv === sb.lv && sa.d === sb.d, JSON.stringify({ sa, sb }));
    errs.push(...PA.errors, ...PB.errors); await PA.ctx.close(); await PB.ctx.close();
  }

  // ---------- c) oyun: kural kartı (320 px), rozet, robot çözer ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { vp: [320, 640], save: { played: A - 1, level: A, stars: starsUpTo(A), seen: seenTo(XL), remindAsked: true } });
    await page.click('#bPlay'); await page.waitForTimeout(800);
    const card = await page.evaluate(() => { const m = document.querySelector('#modal .sheet'); return { open: document.getElementById('modal').classList.contains('open'), txt: m?.querySelector('h2')?.textContent, demo: !!document.querySelector('.rd-express em'), anim: getComputedStyle(document.querySelector('.rd-express .q') || document.body).animationName, fit: m ? m.scrollWidth <= m.clientWidth + 1 && m.getBoundingClientRect().right <= innerWidth + 1 && m.getBoundingClientRect().top >= 0 : false }; });
    await shot(page, 'rule-express');
    if (card.open) await page.click('#mGo'); await page.waitForTimeout(500);
    const g0 = await page.evaluate(() => { const R = window.__ray, G = R.G, d = R.lit({ ...G, cur: G.sol }).d; return { st: G.express.st, B: G.express.B, d: G.express.st.map(i => d[i]), W: document.documentElement.scrollWidth <= innerWidth }; });
    await shot(page, 'express');
    // durağa ilk dokunuş: bir kez ipucu
    await tapTile(page, g0.st[0]); await page.waitForTimeout(300);
    const tip = await page.evaluate(() => ({ t: document.getElementById('toast').textContent, saved: !!JSON.parse(localStorage.getItem('ray')).exTip }));
    const taps = await solve(page, 12); const won = await waitModal(page);
    const L = await page.evaluate(() => { const G = window.__ray.G; return { bad: G.L.exBad, d: G.express.st.map(i => G.L.d[i]) }; });
    check('rule.express.card', `M${XL + 1} ilk girişte "YENİ KURAL · Ekspres durak" kartı (animasyonlu), 320 px'te taşmaz`, card.open && /Ekspres durak/.test(card.txt || '') && card.demo && card.anim === 'rdeS' && card.fit, JSON.stringify(card), 'medium');
    check('rule.express.play', `Bölüm ${A}: ${g0.st.length} ekspres durak (sayılar ${g0.B} = çözümdeki uzaklık); ilk dokunuşta bir kez ipucu; robot çözer, her durak sayısı içinde; 320 px'te yatay taşma yok`,
      g0.st.length === 2 && g0.B.join() === g0.d.join() && /Ekspres durak/.test(tip.t) && tip.saved && won && !L.bad.length && L.d.every((v, j) => v >= 0 && v <= g0.B[j]) && g0.W, JSON.stringify({ ...g0, tip, taps, won, L }));
    errs.push(...errors); await ctx.close();
  }
  {
    // hattın ortasında (zorluk paylı, 7×9) bir bölüm: robot kazanır
    const L2 = A + 7, { ctx, page, errors } = await open(browser, URL, { save: { played: L2 - 1, level: L2, stars: starsUpTo(L2), seen: { ...seenTo(XL), [XL]: 1 }, remindAsked: true } });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    const info = await page.evaluate(() => { const G = window.__ray.G; return { k: G.express?.st.length, size: G.cols + 'x' + G.rows }; });
    await solve(page, 8); const won = await waitModal(page);
    check('rule.express.mid', `Bölüm ${L2}: ${info.k} ekspres durak (${info.size}); robot kazanır`, info.k >= 3 && won, JSON.stringify({ ...info, won }));
    errs.push(...errors); await ctx.close();
  }
  {
    // karanlık tünel + ekspres durak (karma): robot ışığı izleyerek kazanır
    const pg = await open(browser, URL, { save: { played: 9 } });
    const f = await pg.page.evaluate(() => { const R = window.__ray; for (let l = R.lineStart(R.RULE_LINE.express + 1); l < 20000; l++) { const U = R.rulesFor(l); if (U.has('express') && U.has('fog')) return l; } return -1; });
    await pg.ctx.close();
    const o = await open(browser, URL, { save: { played: f - 1, level: f, stars: starsUpTo(f), seen: Object.fromEntries(Array.from({ length: 40 }, (_, k) => [k, 1])), remindAsked: true } });
    await o.page.click('#bPlay'); await o.page.waitForTimeout(800);
    const info = await o.page.evaluate(() => { const G = window.__ray.G; return { fog: !!G.fog, express: !!G.express }; });
    await solve(o.page, 8, 80); const won = await waitModal(o.page);
    check('rule.express.fog', `Bölüm ${f}: karanlık tünel + ekspres durak; robot ışığı izleyerek kazanır`, f > 0 && info.fog && info.express && won, JSON.stringify({ f, ...info, won }));
    errs.push(...o.errors); await o.ctx.close();
  }
  check('rule.express.errors', 'Ekspres durak senaryolarında konsol hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
};
