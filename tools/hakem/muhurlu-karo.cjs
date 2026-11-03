// 🔒 Mühürlü karo (seal) — hakem.cjs K bölümü çağırır. Ayrıntı: docs/kurallar/muhurlu-karo.md
module.exports = async T => {
  const { browser, URL, open, check, solve, shot, tapTile, waitModal, starsUpTo, RL, AT, seenTo } = T;
  const errs = [], SL = RL.seal, A = AT('seal');
  const NO_SEAL = `window.RAY_RULES = []; { const push = window.RAY_RULES.push.bind(window.RAY_RULES); window.RAY_RULES.push = f => push(api => { const m = f(api); return m?.key === 'seal' ? null : m; }); }`;

  // ---------- a) üretim: çözülebilirlik (mühüre uyan, merkezden dışa çözen oyuncu), yer kuralları, hat ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 9 } });
    const g = await page.evaluate(SL => {
      const R = window.__ray, o = { n: 0, seals: 0, bad: 0, place: 0, shut0: 0, rounds: 0, stuck: 0 };
      const keys = R.MODS.map(m => m.key).filter(k => k !== 'seal' && !R.MODS.find(m => m.key === 'seal').clash?.includes(k));
      // mühüre uyan oyuncu: her turda yalnız açık (komşusu yanan) ya da mühürsüz karoları çözüme getirir; birimler bir dokunuş dizisiyle
      const play = P => {
        const G = { ...P, cur: P.cur.slice() }, near = i => [0, 1, 2, 3].some(k => { const j = R.nb(G, i, k); return j >= 0 && G.L.d[j] >= 0; });
        for (let r = 0; r < 60; r++) {
          G.L = R.lit(G); if (G.L.solved) return r;
          let moved = 0;
          for (let i = 0; i < G.cur.length; i++) {
            if (G.cur[i] === G.sol[i]) continue;
            if (G.seal?.[i] && !near(i)) continue;
            const u = G.unitOf?.[i] ?? -1;
            if (u >= 0) { const U = G.units[u]; for (let t = R.unitTaps(U, G.cur, G.sol); t > 0; t--) U.tap(G.cur); }
            else { const j = G.link[i]; G.cur[i] = G.sol[i]; if (j >= 0) G.cur[j] = G.sol[j]; }
            moved++; G.L = R.lit(G);
          }
          if (!moved) return -1;
        }
        return -1;
      };
      const mixes = [{}, { two: true }, { fog: true, rev: 3, cnt: 3 }, ...keys.map(k => ({ [k]: 2 }))];
      for (const [c, r] of [[6, 8], [7, 9]]) for (const x of mixes) for (let s = 1; s <= 12; s++) {
        const P = R.generate(c, r, s * 7919 + 31, 0, s % 3 ? 0 : 2, { ...x, seal: 3 + s % 3 }); o.n++;
        if (!P.seal) continue;
        const mk = P.seal.map((v, i) => v ? i : -1).filter(i => i >= 0); o.seals += mk.length;
        const hubs = [P.hub, P.hub2].filter(h => h >= 0);
        if (mk.some(i => hubs.some(h => [0, 1, 2, 3].some(k => R.nb(P, i, k) === h)) || P.cur[i] === P.sol[i] || P.link[i] >= 0 || P.rev[i] || P.cnt[i] >= 0 || (P.unitOf?.[i] ?? -1) >= 0 || P.split?.[i] || P.void?.[i] || P.self?.[i])) o.place++;
        const L = R.lit(P); if (mk.some(i => ![0, 1, 2, 3].some(k => { const j = R.nb(P, i, k); return j >= 0 && L.d[j] >= 0; }))) o.shut0++;
        const t = play(P); if (t < 0) o.stuck++; else o.rounds = Math.max(o.rounds, t);
        if (!R.lit({ ...P, cur: P.sol }).solved) o.bad++;
      }
      // hat: mühür hattından önce mühür yok; hattın her bölümünde var, giriş 2 mühür, ilk 3 bölüm 6×8
      const a = R.lineStart(SL), z = R.lineStart(SL + 1); let early = 0, own = 0;
      for (let l = 1; l < a; l++) if (R.rulesFor(l).has('seal')) early++;
      for (let l = a; l < z; l++) { const P = R.puzzleFor(l); if (P.seal) own++; }
      o.line = { early, own, len: z - a, intro: R.puzzleFor(a).seal?.filter(Boolean).length, size: [a, a + 1, a + 2, a + 3].map(l => R.sizeFor(l).join('x')).join(' ') };
      // zorluk merdiveni: önceki hat < mühür hattı < sonraki hat
      const avg = c => { let d = 0; const a = R.lineStart(c), z = R.lineStart(c + 1); for (let l = a; l < z; l++) d += R.puzzleFor(l).diff; return +(d / (z - a)).toFixed(1); };
      o.ladder = [avg(SL - 1), avg(SL), avg(SL + 1)];
      return o;
    }, SL);
    check('rule.seal.gen', `Mühürlü karo: ${g.n} tohum (6×8 · 7×9, yüklü her uyumlu eklentiyle) → mühüre uyan oyuncu her birini merkezden dışa çözer, mühür kurala uygun yerde (yanlış duran çıplak karo, merkez komşusu değil)`,
      g.stuck === 0 && g.bad === 0 && g.place === 0 && g.seals > g.n * 3 && g.shut0 > g.n * .6, JSON.stringify(g));
    check('rule.seal.line', `M${SL + 1} (${A}.–${A + g.line.len - 1}. bölüm): önceki bölümlerde mühür yok, hattın her bölümünde var, giriş 2 mühür, ilk 3 bölüm 6×8`,
      g.line.early === 0 && g.line.own === g.line.len && g.line.intro === 2 && g.line.size === '6x8 6x8 6x8 7x9', JSON.stringify(g.line));
    check('rule.seal.ladder', `Zorluk merdiveni: M${SL} ${g.ladder[0]} < M${SL + 1} ${g.ladder[1]} < M${SL + 2} ${g.ladder[2]}`, g.ladder[0] < g.ladder[1] && g.ladder[1] < g.ladder[2], JSON.stringify(g.ladder), 'medium');
    errs.push(...errors); await ctx.close();
  }

  // ---------- b) eski bölümler: eklenti çıkarılınca mühür hattından önceki bölümler ve Günün Hattı bit bit aynı ----------
  {
    const sig = page => page.evaluate(a => {
      const R = window.__ray, h = s => { let x = 2166136261; for (const c of s) x = Math.imul(x ^ c.charCodeAt(0), 16777619); return (x >>> 0).toString(36); };
      let lv = ''; for (let l = 1; l < a; l += 3) { const P = R.puzzleFor(l); lv += P.sol.join('') + P.cur.join('') + P.diff; }
      return { lv: h(lv), d: h(['2026-10-27', '2026-11-01', '2027-03-14'].map(d => R.dailyBase(d).cur.join('')).join()) };
    }, A);
    const PA = await open(browser, URL, { save: { played: 1 } }), PB = await open(browser, URL, { save: { played: 1 }, init: NO_SEAL });
    const sa = await sig(PA.page), sb = await sig(PB.page);
    check('rule.seal.old', `Mühür eklentisi çıkarılınca 1–${A - 1}. bölümler ve Günün Hattı aynı (eklenti R() tüketmez)`, sa.lv === sb.lv && sa.d === sb.d, JSON.stringify({ sa, sb }));
    errs.push(...PA.errors, ...PB.errors); await PA.ctx.close(); await PB.ctx.close();
  }

  // ---------- c) oyun: kural kartı, mühürlü karo dönmez (hamle sayılmaz), komşusu yanınca açılır, bağlantı kopunca yeniden mühürlenir; robot çözer ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: A - 1, level: A, stars: starsUpTo(A), seen: seenTo(SL), remindAsked: true } });
    await page.click('#bPlay'); await page.waitForTimeout(800);
    const card = await page.evaluate(() => ({ open: document.getElementById('modal').classList.contains('open'), txt: document.querySelector('.sheet h2')?.textContent, demo: !!document.querySelector('.rd-seal svg'), anim: getComputedStyle(document.querySelector('.rd-seal .b b') || document.body).animationName }));
    await shot(page, 'rule-seal');
    if (card.open) await page.click('#mGo'); await page.waitForTimeout(400);
    const near = `(G, i) => [0, 1, 2, 3].some(k => { const j = window.__ray.nb(G, i, k); return j >= 0 && G.L.d[j] >= 0; })`;
    const st = () => page.evaluate(n => { const G = window.__ray.G, near = eval(n); return { cur: G.cur.join(), moves: G.moves, shut: G.seal.map((v, i) => v && !near(G, i) ? i : -1).filter(i => i >= 0) }; }, near);
    const s0 = await st(), lockI = s0.shut[0];
    await tapTile(page, lockI); await page.waitForTimeout(150); const s1 = await st();
    const blocked = lockI >= 0 && s1.cur === s0.cur && s1.moves === s0.moves;
    await solve(page, 10); const won = await waitModal(page);
    // yeniden mühür: kazanılmış dizilimde mühürlü karonun yanan komşularını koparmak (kopya üzerinde lit ile)
    const re = await page.evaluate(n => {
      const R = window.__ray, G = R.G, near = eval(n), i = G.seal.findIndex(Boolean), P = { ...G, cur: G.sol.slice() };
      P.L = R.lit(P); const before = near(P, i);
      // yanan her komşunun merkezden gelen yolunu, merkezin hemen yanındaki atasında kes (çözüm ağaç: başka yol yok)
      const tr = R.tree(P), cut = [0, 1, 2, 3].map(k => R.nb(P, i, k)).filter(j => j >= 0 && P.L.d[j] >= 0).map(j => { let a = j; while (tr.pa[a] >= 0 && tr.pa[a] !== P.hub && tr.pa[a] !== P.hub2) a = tr.pa[a]; return a; });
      for (const a of cut) P.cur[a] = 0;
      P.L = R.lit(P); const m = R.MODS.find(m => m.key === 'seal'); return { i, before, after: near(P, i), cut: cut.length, block: !!m.block(P, i), free: !m.block({ ...P, L: R.lit({ ...P, cur: G.sol }) }, i) };
    }, near);
    await shot(page, 'seal-won');
    check('rule.seal.card', `M${SL + 1} ilk girişte "YENİ KURAL · Mühürlü karo" kartı (animasyonlu kilit)`, card.open && /Mühürlü karo/.test(card.txt || '') && card.demo && card.anim === 'rdsB', JSON.stringify(card), 'medium');
    check('rule.seal.play', 'Mühürlü karo: komşusu yanmıyorken dokunuş yok sayılır (dönmez, hamle sayılmaz); robot merkezden dışa çözüp kazanır; bağlantı kopunca karo yeniden mühürlenir',
      s0.shut.length >= 1 && blocked && won && re.before && !re.after && re.block && re.free, JSON.stringify({ shut: s0.shut, blocked, won, re }));
    errs.push(...errors); await ctx.close();
  }
  check('rule.seal.errors', 'Mühürlü karo senaryolarında konsol hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
};
