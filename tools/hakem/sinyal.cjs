// 🚦 Sinyal karosu (signal) — hakem.cjs K bölümü çağırır. Ayrıntı: docs/kurallar/sinyal.md
// Üretim (sinyal çıplak, yanlış duran, başta kilitsiz karo; sinyali önce ayarlayan oyuncu her bölümü çözer, sinyal ayarı ışığı değiştirmez),
// kuralın etkisi (merkezden dışa çözen oyuncu takılır; tahta ve çözücü puanı kuralsızla aynı), clash, hat ve merdiven, eski bölümler,
// kural kartı (9 dil, 320 px), oyun (kilit: komşu yanınca dokunuş yok sayılır, kopunca açılır; robot kazanır), karanlık tünel.
module.exports = async T => {
  const { browser, URL, open, check, solve, shot, tapTile, waitModal, starsUpTo, RL, AT, seenTo } = T;
  const errs = [], GL = RL.signal, A = AT('signal');
  const NO_SIG = `window.RAY_RULES = []; { const push = window.RAY_RULES.push.bind(window.RAY_RULES); window.RAY_RULES.push = f => push(api => { const m = f(api); return m?.key === 'signal' ? null : m; }); }`;
  const SHUT = `(P, L, i) => [0, 1, 2, 3].some(k => { const j = window.__ray.nb(P, i, k); return j >= 0 && L.d[j] >= 0; })`;

  // ---------- a) üretim, çözülebilirlik, kuralın etkisi ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 9 } });
    const g = await page.evaluate(([GL, SH]) => {
      const R = window.__ray, shut = eval(SH), o = { n: 0, none: 0, rej: 0, sig: 0, bad: 0, pre: 0, place: 0, shut0: 0, lemma: 0, stuck: 0, rounds: 0, self: 0, naive: 0, same: 0, diffEq: 0, ms: 0 };
      const me = R.MODS.find(m => m.key === 'signal'), keys = R.MODS.map(m => m.key).filter(k => k !== 'signal' && !me.clash.includes(k) && !['shunt', 'remote', 'yard'].includes(k));   // benzetim takas/kumanda/peron birimlerini oynamaz (onlar kendi testlerinde)
      const fixTile = (G, i) => { const u = G.unitOf?.[i] ?? -1; if (u >= 0) { const U = G.units[u]; for (let t = R.unitTaps(U, G.cur, G.sol); t > 0; t--) U.tap(G.cur); } else { const j = G.link[i]; G.cur[i] = G.sol[i]; if (j >= 0) G.cur[j] = G.sol[j]; } };
      // sinyali önce ayarlayan oyuncu: 1) her yanlış sinyal (kilitsiz olmalı) çözüme; her adımda ışık (lit d) değişmemeli · 2) kalan karolar turlarla (sinyal kilidine uyarak)
      const first = P => {
        const G = { ...P, cur: P.cur.slice() }; let L = R.lit(G);
        for (let i = 0; i < G.cur.length; i++) if (G.signal[i] && G.cur[i] !== G.sol[i]) {
          if (shut(G, L, i)) return -1;
          const d0 = L.d.join(); G.cur[i] = G.sol[i]; L = R.lit(G); if (L.d.join() !== d0) o.lemma++;
        }
        for (let r = 0; r < 60; r++) {
          if (L.solved) return r;
          let moved = 0;
          for (let i = 0; i < G.cur.length; i++) { if (G.cur[i] === G.sol[i] || (G.signal[i] && shut(G, L, i))) continue; fixTile(G, i); moved++; L = R.lit(G); }
          if (!moved) return -1;
        }
        return -1;
      };
      // merkezden dışa (çözüm ağacının derinlik sırasıyla) çözen oyuncu: mühürlü karoda doğru yol; sinyalde takılır
      const naive = P => {
        const G = { ...P, cur: P.cur.slice() }, tr = R.tree(G), ord = G.cur.map((_, i) => i).sort((a, b) => tr.dep[a] - tr.dep[b]); let L = R.lit(G);
        for (let r = 0; r < 20; r++) { if (L.solved) return true; let moved = 0; for (const i of ord) { if (G.cur[i] === G.sol[i] || (G.signal[i] && shut(G, L, i))) continue; fixTile(G, i); moved++; L = R.lit(G); } if (!moved) break; }
        return R.lit(G).solved;
      };
      const t0 = performance.now();
      for (const [c, r] of [[6, 8], [7, 9]]) for (const x of [{}, { two: true }, { fog: true, rev: 3, cnt: 3 }, ...keys.map(k => ({ [k]: 2 }))]) for (let s = 1; s <= 8; s++) {
        const k = 2 + s % 3, P = R.generate(c, r, s * 7919 + 211, 0, s % 3 || Object.keys(x).some(q => keys.includes(q)) ? 0 : 2, { ...x, signal: k }); o.n++;
        const Ls = R.lit({ ...P, cur: P.sol }); if (!Ls.solved) o.bad++;
        if (R.lit(P).solved) o.pre++;
        // kural tahtayı değiştirmez: sinyalsiz aynı tohum aynı çözüm ve başlangıç, aynı çözücü puanı
        const Q = R.generate(c, r, s * 7919 + 211, 0, s % 3 || Object.keys(x).some(q => keys.includes(q)) ? 0 : 2, { ...x });
        if (Q.sol.join() === P.sol.join() && Q.cur.join() === P.cur.join()) { o.same++; if (R.difficulty(P) === R.difficulty(Q)) o.diffEq++; }
        if (!P.signal) { o.none++; continue; }
        if (P.reject) o.rej++;
        const mk = P.signal.map((v, i) => v ? i : -1).filter(i => i >= 0), hubs = [P.hub, P.hub2].filter(h => h >= 0), L0 = R.lit(P); o.sig += mk.length;
        if (mk.some(i => hubs.includes(i) || hubs.some(h => [0, 1, 2, 3].some(q => R.nb(P, i, q) === h)) || P.cur[i] === P.sol[i] || P.link[i] >= 0 || P.rev[i] || P.cnt[i] >= 0 || (P.unitOf?.[i] ?? -1) >= 0 || P.split?.[i] || P.void?.[i] || P.self?.[i] || P.seal?.[i])) o.place++;
        if (mk.some(i => shut(P, L0, i))) o.shut0++;
        if (mk.some(i => !shut(P, Ls, i))) o.self++;   // çözümde (sinyal hatta) her sinyal kilitli: tanım tutarlı
        const t = first(P); if (t < 0) o.stuck++; else o.rounds = Math.max(o.rounds, t);
        if (!naive(P)) o.naive++;
      }
      o.ms = Math.round(performance.now() - t0);
      // clash: mühürlü, bakım, son sefer
      let mix = 0; for (let l = R.lineStart(GL); l < R.lineStart(GL) + 700; l++) { const U = R.rulesFor(l); if (U.has('signal') && me.clash.some(q => U.has(q))) mix++; }
      const a = R.lineStart(GL), z = R.lineStart(GL + 1); let early = 0, own = 0;
      for (let l = 1; l < a; l++) if (R.rulesFor(l).has('signal')) early++;
      for (let l = a; l < z; l++) if (R.puzzleFor(l).signal) own++;
      const avg = c => { let d = 0; const a = R.lineStart(c), z = R.lineStart(c + 1); for (let l = a; l < z; l++) d += R.puzzleFor(l).diff; return +(d / (z - a)).toFixed(1); };
      let km = 0; for (let l = z; l < z + 280; l++) if (R.rulesFor(l).has('signal')) km++;
      o.line = { early, own, len: z - a, km, mix, intro: R.puzzleFor(a).signal?.filter(Boolean).length, size: [a, a + 1, a + 2, a + 3].map(l => R.sizeFor(l).join('x')).join(' '), ladder: [avg(GL - 1), avg(GL)] };
      return o;
    }, [GL, SHUT]);
    check('rule.signal.gen', `Sinyal karosu: ${g.n} tohum (6×8 · 7×9, uyumlu her eklentiyle) → çözüm geçerli, çözülmüş gelmez; sinyal çıplak, yanlış duran, merkez komşusu olmayan ve başta kilitsiz karo; çözümde her sinyal kilitli (tanım tutarlı)`,
      g.n >= 300 && g.bad === 0 && g.pre === 0 && g.place === 0 && g.shut0 === 0 && g.self === 0 && g.none <= g.n * .03 && g.sig >= (g.n - g.none) * 2, JSON.stringify({ ...g, line: undefined }));
    check('rule.signal.solve', `Çözülebilirlik: sinyalleri önce ayarlayan oyuncu ${g.n - g.none - g.stuck}/${g.n - g.none} bölümü çözer (en çok ${g.rounds} tur); kilitsiz sinyali çevirmek ışığı hiç değiştirmez (${g.lemma} ihlal)`,
      g.stuck === 0 && g.lemma === 0, JSON.stringify({ stuck: g.stuck, lemma: g.lemma, rounds: g.rounds }));
    check('rule.signal.effect', `Kuralın etkisi: merkezden dışa çözen oyuncu ${g.naive}/${g.n - g.none} bölümde takılır (sinyal kilitlenir); tahta sinyalsiz tohumla aynı (${g.same}/${g.n}), çözücü puanı aynı (${g.diffEq}/${g.same}) → zorluk payı boost ile`,
      g.naive >= (g.n - g.none) * .8 && g.same >= g.n * .9 && g.diffEq === g.same, JSON.stringify({ naive: g.naive, same: g.same, diffEq: g.diffEq }), 'medium');
    check('rule.signal.clash', 'Sinyal karosu mühürlü karo, bakım karosu ve son seferle hiçbir bölümde birlikte gelmez (700 bölüm, karma dahil)', g.line.mix === 0, String(g.line.mix));
    check('rule.signal.line', `M${GL + 1} (${A}. bölümden): önceki bölümlerde sinyal yok, hattın her bölümünde var, giriş 2 sinyal, ilk 3 bölüm 6×8, sonrası karmada (${g.line.km}/280); merdiven M${GL} ${g.line.ladder[0]} < M${GL + 1} ${g.line.ladder[1]}`,
      g.line.early === 0 && g.line.own === g.line.len && g.line.intro === 2 && g.line.size === '6x8 6x8 6x8 7x9' && g.line.km >= 5 && g.line.ladder[0] < g.line.ladder[1], JSON.stringify(g.line));
    errs.push(...errors); await ctx.close();
  }

  // ---------- b) eski bölümler: eklenti çıkarılınca 1–(A−1). bölümler ve Günün Hattı bit bit aynı ----------
  {
    const sig = page => page.evaluate(a => {
      const R = window.__ray, h = s => { let x = 2166136261; for (const c of s) x = Math.imul(x ^ c.charCodeAt(0), 16777619); return (x >>> 0).toString(36); };
      let lv = ''; for (let l = 1; l < a; l += 3) { const P = R.puzzleFor(l); lv += P.sol.join('') + P.cur.join('') + P.diff; }
      return { lv: h(lv), d: h(['2026-10-27', '2026-11-19', '2027-03-14'].map(d => R.dailyBase(d).cur.join('')).join()) };
    }, A);
    const PA = await open(browser, URL, { save: { played: 1 } }), PB = await open(browser, URL, { save: { played: 1 }, init: NO_SIG });
    const sa = await sig(PA.page), sb = await sig(PB.page);
    check('rule.signal.old', `Sinyal eklentisi çıkarılınca 1–${A - 1}. bölümler ve Günün Hattı aynı (eklenti R() tüketmez)`, sa.lv === sb.lv && sa.d === sb.d, JSON.stringify({ sa, sb }));
    errs.push(...PA.errors, ...PB.errors); await PA.ctx.close(); await PB.ctx.close();
  }

  // ---------- c) kural kartı: 9 dilde 320 px'te taşmaz, animasyonlu demo ----------
  {
    const res = [];
    for (const loc of ['tr-TR', 'en-US', 'de-DE', 'es-ES', 'pt-BR', 'fr-FR', 'ko-KR', 'ja-JP', 'zh-TW']) {
      const nc = browser.newContext; browser.newContext = x => nc({ ...x, locale: loc });
      let o; try { o = open(browser, URL, { vp: [320, 568], save: { played: A - 1, level: A, stars: starsUpTo(A), seen: seenTo(GL), remindAsked: true } }); } finally { browser.newContext = nc; }
      const { ctx, page, errors } = await o;
      await page.click('#bPlay'); await page.waitForTimeout(800);
      const c = await page.evaluate(() => { const m = document.querySelector('#modal .sheet'), r = m?.getBoundingClientRect(); return { lang: window.RAY_LANG, open: document.getElementById('modal').classList.contains('open'), h2: m?.querySelector('h2')?.textContent, demo: !!document.querySelector('.rd-signal em.r'), anim: getComputedStyle(document.querySelector('.rd-signal .b b') || document.body).animationName, fit: !!m && m.scrollWidth <= m.clientWidth + 1 && r.right <= innerWidth + 1 && r.left >= -1 && r.top >= 0 && r.bottom <= innerHeight + 1, miss: [...(window.__L_MISS || [])].filter(k => /signal|Signal/.test(k)) }; });
      await shot(page, `rule-signal-${c.lang}`);
      res.push(c); errs.push(...errors); await ctx.close();
    }
    const bad = res.filter(c => !c.open || !c.demo || c.anim !== 'rdgB' || !c.fit || c.miss.length || !c.h2);
    check('rule.signal.card', `M${GL + 1} ilk girişte "YENİ KURAL · Sinyal karosu" kartı (animasyonlu sinyal) 9 dilde 320 px'te taşmaz, çevirisi eksik değil`,
      bad.length === 0 && /Sinyal karosu/.test(res[0].h2) && /Signal tile/.test(res[1].h2), JSON.stringify(bad.length ? bad : res.map(c => c.lang + ':' + c.h2)), 'medium');
  }

  // ---------- d) oyun: kilitsiz sinyal döner; komşu yanınca dokunuş yok sayılır (hamle sayılmaz); hat kopunca açılır; robot kazanır ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: A - 1, level: A, stars: starsUpTo(A), seen: { ...seenTo(GL), [GL]: 1 }, remindAsked: true } });
    await page.click('#bPlay'); await page.waitForTimeout(800);
    const st = () => page.evaluate(SH => { const G = window.__ray.G, shut = eval(SH); return { cur: G.cur.join(), moves: G.moves, sig: G.signal.map((v, i) => v ? i : -1).filter(i => i >= 0), shut: G.signal.map((v, i) => v && shut(G, G.L, i) ? i : -1).filter(i => i >= 0) }; }, SHUT);
    const s0 = await st(); await shot(page, 'signal');
    const si = s0.sig[0];
    await tapTile(page, si); await page.waitForTimeout(200); const s1 = await st();
    const turns = s1.cur !== s0.cur && s1.moves === s0.moves + 1;
    // kilit: bütün öteki karolar çözümde, sinyal yanlış → hat yanına ulaşır
    const start = await page.evaluate(i => { const R = window.__ray, G = R.G, keep = G.cur.slice(); G.cur = G.sol.slice(); G.cur[i] = R.rot(G.sol[i]) === G.sol[i] ? keep[i] : R.rot(G.sol[i]); G.L = R.lit(G); return keep; }, si);
    const s2 = await st(); await shot(page, 'signal-lock');
    await tapTile(page, si); await page.waitForTimeout(250); const s3 = await st();
    const toast = await page.evaluate(() => document.getElementById('toast').textContent);
    const locked = s2.shut.includes(si) && s3.cur === s2.cur && s3.moves === s2.moves;
    // hattı kopar: sinyalin yanan komşularının merkeze bitişik atası boşaltılır (çözüm ağaç: başka yol yok)
    await page.evaluate(i => { const R = window.__ray, G = R.G, tr = R.tree(G); for (const j of [0, 1, 2, 3].map(k => R.nb(G, i, k)).filter(j => j >= 0 && G.L.d[j] >= 0)) { let a = j; while (tr.pa[a] >= 0 && tr.pa[a] !== G.hub && tr.pa[a] !== G.hub2) a = tr.pa[a]; G.cur[a] = 0; } G.L = R.lit(G); }, si);
    const s4 = await st();
    await tapTile(page, si); await page.waitForTimeout(200); const s5 = await st();
    const reopen = !s4.shut.includes(si) && s5.cur !== s4.cur;   // hamle: aynı karoya art arda dokunuş tek hamle (engellenen dokunuş sırayı bozmaz)
    // başa dön ve robotla çöz
    await page.evaluate(keep => { const R = window.__ray, G = R.G; G.cur = keep; G.L = R.lit(G); }, start);
    const taps = await solve(page, 10); const won = await waitModal(page);
    await shot(page, 'signal-won');
    check('rule.signal.play', `Bölüm ${A}: ${s0.sig.length} sinyal, başta kilitsiz ve döner; komşusu yanınca dokunuş yok sayılır (dönmez, hamle sayılmaz, bildirim), hat kopunca yeniden döner; robot sinyalleri önce ayarlayıp kazanır`,
      s0.sig.length === 2 && s0.shut.length === 0 && turns && locked && /Sinyal kırmızı/.test(toast) && reopen && won, JSON.stringify({ s0: { sig: s0.sig, shut: s0.shut }, turns, locked, toast, reopen, taps, won }));
    errs.push(...errors); await ctx.close();
  }
  {
    // hattın ortasında (zorluk paylı, 7×9) bir bölüm: robot kazanır
    const L2 = A + 7, { ctx, page, errors } = await open(browser, URL, { save: { played: L2 - 1, level: L2, stars: starsUpTo(L2), seen: { ...seenTo(GL), [GL]: 1 }, remindAsked: true } });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    const info = await page.evaluate(() => { const G = window.__ray.G; return { k: G.signal?.filter(Boolean).length, size: G.cols + 'x' + G.rows }; });
    await solve(page, 8); const won = await waitModal(page);
    check('rule.signal.mid', `Bölüm ${L2}: ${info.k} sinyal (${info.size}); robot kazanır`, info.k >= 3 && won, JSON.stringify({ ...info, won }));
    errs.push(...errors); await ctx.close();
  }
  {
    // karanlık tünel + sinyal (karma): sinyal lambası karanlıkta görünür, çevresi açılmaz; robot kazanır
    const pg = await open(browser, URL, { save: { played: 9 } });
    const f = await pg.page.evaluate(() => { const R = window.__ray; for (let l = R.lineStart(R.RULE_LINE.signal + 1); l < 20000; l++) { const U = R.rulesFor(l); if (U.has('signal') && U.has('fog')) return l; } return -1; });
    await pg.ctx.close();
    const o = await open(browser, URL, { save: { played: f - 1, level: f, stars: starsUpTo(f), seen: Object.fromEntries(Array.from({ length: 40 }, (_, k) => [k, 1])), remindAsked: true } });
    await o.page.click('#bPlay'); await o.page.waitForTimeout(800);
    const info = await o.page.evaluate(SH => { const G = window.__ray.G, shut = eval(SH), sg = G.signal.map((v, i) => v ? i : -1).filter(i => i >= 0); return { fog: !!G.fog, n: sg.length, vis: sg.every(i => G.seen[i]), dark: G.seen.filter(v => !v).length, shut: sg.filter(i => shut(G, G.L, i)).length }; }, SHUT);
    await shot(o.page, 'signal-fog');
    await solve(o.page, 8, 80); const won = await waitModal(o.page);
    check('rule.signal.fog', `Bölüm ${f}: karanlık tünel + sinyal; sinyal karoları karanlıkta görünür, başta kilitsiz; robot kazanır`, f > 0 && info.fog && info.n > 0 && info.vis && info.dark > 0 && info.shut === 0 && won, JSON.stringify({ f, ...info, won }));
    errs.push(...o.errors); await o.ctx.close();
  }
  check('rule.signal.errors', 'Sinyal karosu senaryolarında konsol hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
};
