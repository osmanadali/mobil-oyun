// ⏳ Son sefer (last) — hakem.cjs K bölümü çağırır. Ayrıntı: docs/kurallar/son-sefer.md
// Üretim (saatli durak, hamle payı kanıtı: sırayla bağlayan kusursuz oyuncu her sayaca yetişir), kuralın etkisi (sırasız oyuncu kaçırır),
// eski bölümler bit bit aynı, hat ve merdiven, kural kartı, oyun (sayaç, kaçınca ↻ yıldızı söner ama bölüm sürer, ↶ geri al, ipucu sırası, kayıt), karanlık tünel.
module.exports = async T => {
  const { browser, URL, open, check, solve, shot, tapTile, waitModal, starsUpTo, RL, AT, seenTo } = T;
  const errs = [], LL = RL.last, A = AT('last');
  const NO_LAST = `window.RAY_RULES = []; { const push = window.RAY_RULES.push.bind(window.RAY_RULES); window.RAY_RULES.push = f => push(api => { const m = f(api); return m?.key === 'last' ? null : m; }); }`;

  // ---------- a) üretim ve hamle payı ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 9 } });
    const g = await page.evaluate(LL => {
      const R = window.__ray, o = { n: 0, none: 0, st: 0, place: 0, order: 0, bad: 0, pre: 0, late: 0, over: 0, naive: 0, ms: 0 };
      const me = R.MODS.find(m => m.key === 'last'), keys = R.MODS.map(m => m.key).filter(k => k !== 'last' && !me.clash.includes(k));
      // kusursuz oyuncu: durakları sırayla (yolunu merkezden dışa), sonra kalan karoları düzeltir; her birim/karo/eş 1 hamle. Dönüş: her durağın bağlandığı hamle, toplam hamle
      const fix = (P, cur, i) => { const u = P.unitOf?.[i] ?? -1; if (u >= 0) { const U = P.units[u]; if (!R.unitTaps(U, cur, P.sol)) return 0; for (let t = R.unitTaps(U, cur, P.sol); t > 0; t--) U.tap(cur); return 1; }
        const j = P.link[i]; if (cur[i] === P.sol[i] && (j < 0 || cur[j] === P.sol[j])) return 0; cur[i] = P.sol[i]; if (j >= 0) cur[j] = P.sol[j]; return 1; };
      const play = (P, order) => {
        const cur = P.cur.slice(), at = P.last.st.map(() => -1); let m = 0;
        const look = () => { const d = R.lit({ ...P, cur }).d; P.last.st.forEach((s, j) => { if (at[j] < 0 && d[s] >= 0) at[j] = m; }); };
        look(); for (const i of order) if (fix(P, cur, i)) { m++; look(); }
        return { at, m, solved: R.lit({ ...P, cur }).solved };
      };
      const t0 = performance.now();
      const mixes = [{}, { two: true }, { fog: true, rev: 3, cnt: 3 }, ...keys.map(k => ({ [k]: 2 }))];
      for (const [c, r] of [[6, 8], [7, 9]]) for (const x of mixes) for (let s = 1; s <= 10; s++) {
        const k = 1 + s % 3, P = R.generate(c, r, s * 7919 + 77, 0, s % 4 ? 0 : 2, { ...x, last: k }); o.n++;
        if (!R.lit({ ...P, cur: P.sol }).solved) o.bad++;
        if (R.lit(P).solved) o.pre++;
        if (!P.last) { o.none++; continue; }
        const S = P.last.st; o.st += S.length;
        // saatli durak: çözümde uç (tek kollu), merkez/birim/kapalı/silik değil; sayaçlar artan sırada ve yol sonu durak
        if (S.some((i, j) => [0, 1, 2, 3].filter(b => P.sol[i] >> b & 1).length !== 1 || i === P.hub || i === P.hub2 || (P.unitOf?.[i] ?? -1) >= 0 || P.void?.[i] || P.self?.[i] || P.last.path[j].at(-1) !== i || P.last.path[j][0] !== (R.tree(P).ow[i] === 2 ? P.hub2 : P.hub))) o.place++;
        if (P.last.B.some((b, j) => j && b < P.last.B[j - 1]) || S.length !== Math.min(k, S.length)) o.order++;
        const all = [...new Set([...P.last.path.flat(), ...P.cur.map((_, i) => i)])], p = play(P, all), lim = R.limits({ ...P, z: .98, diff: 20 });
        if (!p.solved || p.at.some((a, j) => a < 0 || a > P.last.B[j])) o.late++;
        if (p.m !== P.par || p.m > lim.m) o.over++;
        // sırasız oyuncu (karoları dizin sırasıyla düzeltir): en az bir sayaca yetişemez → kural gerçekten sıra dayatır
        const q = play(P, P.cur.map((_, i) => i)); if (q.at.some((a, j) => a > P.last.B[j])) o.naive++;
      }
      o.ms = Math.round(performance.now() - t0);
      // hat: önceki bölümlerde yok, hattın her bölümünde var, giriş 1 saatli durak, ilk 3 bölüm 6×8, final 3 · merdiven
      const a = R.lineStart(LL), z = R.lineStart(LL + 1); let early = 0, own = 0;
      for (let l = 1; l < a; l++) if (R.rulesFor(l).has('last')) early++;
      for (let l = a; l < z; l++) if (R.puzzleFor(l).last) own++;
      const avg = c => { let d = 0; const a = R.lineStart(c), z = R.lineStart(c + 1); for (let l = a; l < z; l++) d += R.puzzleFor(l).diff; return +(d / (z - a)).toFixed(1); };
      o.line = { early, own, len: z - a, intro: R.puzzleFor(a).last?.st.length, fin: R.puzzleFor(z - 1).last?.st.length, size: [a, a + 1, a + 2, a + 3].map(l => R.sizeFor(l).join('x')).join(' '), ladder: [avg(LL - 1), avg(LL), avg(LL + 1)] };
      return o;
    }, LL);
    check('rule.last.gen', `Son sefer: ${g.n} tohum (6×8 · 7×9, uyumlu her eklentiyle) → çözüm geçerli, çözülmüş gelmez, saatli durak çözümde uç ve kurala uygun yerde, sayaçlar artan`,
      g.bad === 0 && g.pre === 0 && g.none === 0 && g.place === 0 && g.order === 0 && g.st >= g.n * 1.8, JSON.stringify(g));
    check('rule.last.fair', 'Hamle payı: durakları sırayla bağlayan kusursuz oyuncu her sayaca yetişir, toplam hamle = par ≤ ↻ hedefi; sırasız oyuncu çoğu bölümde kaçırır (kural sıra dayatır)',
      g.late === 0 && g.over === 0 && g.naive > g.n * .5, JSON.stringify({ late: g.late, over: g.over, naive: g.naive, n: g.n }));
    check('rule.last.line', `M${LL + 1} (${A}. bölümden): önceki bölümlerde yok, hattın her bölümünde var, giriş 1 saatli durak, final 3, ilk 3 bölüm 6×8; merdiven M${LL} ${g.line.ladder[0]} < M${LL + 1} ${g.line.ladder[1]} < M${LL + 2} ${g.line.ladder[2]}`,
      g.line.early === 0 && g.line.own === g.line.len && g.line.intro === 1 && g.line.fin === 3 && g.line.size === '6x8 6x8 6x8 7x9' && g.line.ladder[0] < g.line.ladder[1] && g.line.ladder[1] < g.line.ladder[2], JSON.stringify(g.line));
    errs.push(...errors); await ctx.close();
  }

  // ---------- b) eski bölümler: eklenti çıkarılınca son sefer hattından önceki bölümler ve Günün Hattı aynı ----------
  {
    const sig = page => page.evaluate(a => {
      const R = window.__ray, h = s => { let x = 2166136261; for (const c of s) x = Math.imul(x ^ c.charCodeAt(0), 16777619); return (x >>> 0).toString(36); };
      let lv = ''; for (let l = 1; l < a; l += 5) { const P = R.puzzleFor(l); lv += P.sol.join('') + P.cur.join('') + P.diff; }
      return { lv: h(lv), d: h(['2026-10-27', '2027-03-14', '2026-11-08'].map(d => R.dailyBase(d).cur.join('')).join()) };
    }, A);
    const PA = await open(browser, URL, { save: { played: 1 } }), PB = await open(browser, URL, { save: { played: 1 }, init: NO_LAST });
    const sa = await sig(PA.page), sb = await sig(PB.page);
    check('rule.last.old', `Son sefer eklentisi çıkarılınca 1–${A - 1}. bölümler ve Günün Hattı aynı`, sa.lv === sb.lv && sa.d === sb.d, JSON.stringify({ sa, sb }));
    errs.push(...PA.errors, ...PB.errors); await PA.ctx.close(); await PB.ctx.close();
  }

  // ---------- c) oyun: kural kartı, sayaç görünür, robot sırayla bağlar → ↻ yıldızı yanık; ipucu saatli durağın yoluna ----------
  const base = { played: A - 1, level: A, stars: starsUpTo(A), seen: seenTo(LL), remindAsked: true };
  {
    const { ctx, page, errors } = await open(browser, URL, { vp: [320, 640], save: base });
    await page.click('#bPlay'); await page.waitForTimeout(800);
    const card = await page.evaluate(() => { const m = document.querySelector('#modal .sheet'); return { open: document.getElementById('modal').classList.contains('open'), txt: m?.querySelector('h2')?.textContent, demo: !!document.querySelector('.rd-last em'), anim: getComputedStyle(document.querySelector('.rd-last s') || document.body).animationName, fit: m ? m.scrollWidth <= m.clientWidth + 1 && m.getBoundingClientRect().right <= innerWidth + 1 : false }; });
    await shot(page, 'rule-last');
    if (card.open) await page.click('#mGo'); await page.waitForTimeout(500);
    const g0 = await page.evaluate(() => { const G = window.__ray.G; return { last: !!G.last, st: G.last?.st, B: G.last?.B, lim: G.lim.m, par: G.par, pr: window.__ray.prio().length, W: document.documentElement.scrollWidth, w: innerWidth }; });
    await shot(page, 'last');
    const taps = await solve(page, 12); const won = await waitModal(page);
    const g1 = await page.evaluate(() => { const G = window.__ray.G; return { mOk: G.mOk, lost: G.mLost, moves: G.moves, at: G.lastS?.at }; });
    check('rule.last.card', `M${LL + 1} ilk girişte "YENİ KURAL · Son sefer" kartı (animasyonlu), 320 px'te taşmaz`, card.open && /Son sefer/.test(card.txt || '') && card.demo && card.anim === 'rdlR' && card.fit, JSON.stringify(card), 'medium');
    check('rule.last.play', `Bölüm ${A}: 1 saatli durak, sayaç (${g0.B}) ↻ hedefinden (${g0.lim}) küçük; robot sırayla bağlar → sayaca yetişir, ↻ yıldızı yanık, bölüm kazanılır; 320 px'te yatay taşma yok`,
      g0.last && g0.st.length === 1 && g0.B[0] < g0.lim && g0.pr > 0 && won && g1.mOk && !g1.lost && g1.at[0] != null && g1.at[0] <= g0.B[0] && g0.W <= g0.w, JSON.stringify({ ...g0, taps, won, ...g1 }));
    errs.push(...errors); await ctx.close();
  }
  {
    // sırasız oyun: saatli durağın yolunda olmayan karolarla sayacı bitir → ↻ söner, bildirim, gösterge "SEFER KAÇTI"; bölüm sürer ve kazanılır; kayıt "son sefer kaçtı"
    const { ctx, page, errors } = await open(browser, URL, { save: { ...base, seen: { ...seenTo(LL), [LL]: 1 }, bst: { geri: 2 } } });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    // saatli durağın yolunda olmayan yanlış karolar: her biri çözüme getirilir (1 hamle) → toplam hamle par'ı aşmaz, yalnız sıra yanlış
    const offs = () => page.evaluate(() => {
      const R = window.__ray, G = R.G, on = new Set(G.last.path.flat()), un = m => ((m >> 1) | (m << 3)) & 15, off = [];
      G.cur.forEach((v, i) => {
        if (on.has(i) || (G.unitOf?.[i] ?? -1) >= 0 || G.link[i] >= 0 || G.fixed[i] || v === G.sol[i] || (G.seen && !G.seen[i]) || G.cnt[i] === 0) return;
        let k = 0, t = v; while (t !== G.sol[i] && k < 4) { t = G.rev[i] ? un(t) : R.rot(t); k++; } off.push([i, k]);
      });
      return { B: G.last.B[0], off };
    });
    const run = async (list, n) => { for (const [i, k] of list.slice(0, n)) for (let q = 0; q < k; q++) { await tapTile(page, i); await page.waitForTimeout(40); } await page.waitForTimeout(250); };
    const info = await offs(), n = Math.min(info.off.length, info.B + 1);
    await run(info.off, n);
    const m1 = await page.evaluate(() => { const G = window.__ray.G; return { moves: G.moves, lost: !!G.mLost, mOk: G.mOk, lbl: document.getElementById('gParLbl').textContent, star: document.getElementById('gStars').children[2].classList.contains('on'), toast: document.getElementById('toast').textContent, over: G.over, won: G.won }; });
    await shot(page, 'last-miss');
    // ↶ geri al: sayacın içine dönünce kaçırma silinir, ↻ yıldızı geri yanar
    await page.click('#gUndo'); await page.waitForTimeout(300);
    const m2 = await page.evaluate(() => { const G = window.__ray.G; return { moves: G.moves, lost: !!G.mLost, star: document.getElementById('gStars').children[2].classList.contains('on') }; });
    // yeniden kaçır (kalan hamleler yine yolun dışında), sonra çöz
    const again = await offs(); await run(again.off, info.B + 1 - m2.moves);
    const lost2 = await page.evaluate(() => !!window.__ray.G.mLost);
    await solve(page, 10); const won = await waitModal(page);
    const sv = await page.evaluate(() => JSON.parse(localStorage.getItem('ray')));
    const miss = sv.miss?.[sv.level - 1];
    check('rule.last.miss', `Sırasız oyun: ${info.B} hamlede bağlanmayınca ↻ yıldızı söner ("Son sefer kaçtı", gösterge "SEFER KAÇTI"), oyun sürer; ↶ geri al kaçırmayı siler; sonra bölüm kazanılır, kayıt "⏳ son sefer kaçtı"`,
      n === info.B + 1 && m1.lost && !m1.mOk && !m1.star && /SEFER KAÇTI/.test(m1.lbl) && /Son sefer kaçtı/.test(m1.toast) && !m1.over && !m1.won && m2.moves <= info.B && !m2.lost && m2.star && lost2 && won && (sv.stars[A] || 0) <= 2 && miss?.[1] === -1,
      JSON.stringify({ B: info.B, off: info.off.length, m1, m2, lost2, won, stars: sv.stars[A], miss }));
    errs.push(...errors); await ctx.close();
  }
  {
    // ipucu: saatli durağın yolundaki ilk yanlış karoyu açar (merkezden dışa)
    const { ctx, page, errors } = await open(browser, URL, { save: { ...base, seen: { ...seenTo(LL), [LL]: 1 }, hints: 3, hintDay: new Date().toISOString().slice(0, 10) } });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    const want = await page.evaluate(() => { const R = window.__ray, G = R.G; return R.prio().filter(i => G.cur[i] !== G.sol[i]); });
    await page.click('#bHint'); await page.waitForTimeout(400);
    const got = await page.evaluate(() => window.__ray.G.fixed.map((f, i) => f ? i : -1).filter(i => i >= 0));
    check('rule.last.hint', 'İpucu saatli durağın yolundaki ilk yanlış karoyu açar', want.length > 0 && got.length >= 1 && got.includes(want[0]), JSON.stringify({ want, got }), 'medium');
    errs.push(...errors); await ctx.close();
  }
  {
    // karanlık tünel + son sefer (karma): sayaç karanlıkta da görünür; ışığı izleyen robot sırayla bağlar, ↻ yıldızı yanık kalır
    const pg = await open(browser, URL, { save: { played: 9 } });
    const f = await pg.page.evaluate(() => { const R = window.__ray; for (let l = R.lineStart(R.RULE_LINE.last + 1); l < 20000; l++) { const U = R.rulesFor(l); if (U.has('last') && U.has('fog')) return l; } return -1; });
    await pg.ctx.close();
    const o = await open(browser, URL, { save: { played: f - 1, level: f, stars: starsUpTo(f), seen: Object.fromEntries(Array.from({ length: 40 }, (_, k) => [k, 1])), remindAsked: true } });
    await o.page.click('#bPlay'); await o.page.waitForTimeout(800);
    const info = await o.page.evaluate(() => { const G = window.__ray.G; return { fog: !!G.fog, last: !!G.last, dark: G.last ? G.last.st.filter(s => !G.seen[s]).length : -1 }; });
    await shot(o.page, 'last-fog');
    await solve(o.page, 8, 80); const won = await waitModal(o.page);
    const mOk = await o.page.evaluate(() => window.__ray.G.mOk);
    check('rule.last.fog', `Bölüm ${f}: karanlık tünel + son sefer; robot ışığı izleyerek sırayla bağlar, kazanır, ↻ yıldızı yanık`, f > 0 && info.fog && info.last && won && mOk, JSON.stringify({ f, ...info, won, mOk }));
    errs.push(...o.errors); await o.ctx.close();
  }
  check('rule.last.errors', 'Son sefer senaryolarında konsol hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
};
