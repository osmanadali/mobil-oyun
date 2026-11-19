// 🎛 Kumanda karosu (remote) — hakem.cjs K bölümü çağırır. Ayrıntı: docs/kurallar/kumanda.md
// Üretim (kumanda çözümde, 2–4 ızgara komşusu bağlı, karo en çok iki kumandaya bağlı, her kumandanın kendine ait 4 yönlü kolu; uyumlu her eklentiyle),
// çözülebilirlik (öbek sayacı 4^m durumu gezer, en az hamleli basış çözüme götürür), zorluk (açgözlü oyuncunun fazladan hamlesi, merdiven), çakışmalar,
// eski bölümler bit bit aynı, hat, kural kartı (320 px, bütün diller), kumanda davranışı (bağlı komşular döner, kendisi dönmez, bağlı karoya dokunuş
// işlemez, 1 hamle, ortak kol iki kumandayla, geri al), robot kazanır (ilk bölüm, 7×9, karanlık tünel), konsol hatası, 4× yavaş CPU'da çizim.
module.exports = async T => {
  const { browser, URL, open, check, solve, shot, tapTile, waitModal, starsUpTo, RL, AT, seenTo } = T;
  const errs = [], XL = RL.remote, A = AT('remote');
  const NO_R = `window.RAY_RULES = []; { const push = window.RAY_RULES.push.bind(window.RAY_RULES); window.RAY_RULES.push = f => push(api => { const m = f(api); return m?.key === 'remote' ? null : m; }); }`;
  const CLASH = ['pairs', 'quake'];

  // ---------- a) üretim, çözülebilirlik, zorluk ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 9 } });
    const g = await page.evaluate(([XL, CLASH]) => {
      const R = window.__ray, rot = R.rot, o = { n: 0, none: 0, bad: 0, pre: 0, place: 0, share: 0, pairs: 0, cyc: 0, reach: 0, par: 0, st: 0, arms: 0, greedy: 0, gWorse: 0, gFail: 0, comps: 0, ms: 0 };
      const me = R.MODS.find(m => m.key === 'remote'), keys = R.MODS.map(m => m.key).filter(k => k !== 'remote' && !me.clash.includes(k));
      const per = m => rot(m) === m ? 1 : rot(rot(m)) === m ? 2 : 4;
      const t0 = performance.now();
      for (const [c, r] of [[6, 8], [7, 9]]) for (const x of [{}, { two: true }, { fog: true, rev: 3, cnt: 3 }, ...keys.map(k => ({ [k]: 2 }))]) for (let s = 1; s <= 8; s++) {
        const k = 1 + s % 3, P = R.generate(c, r, s * 6007 + 911, 0, 0, { ...x, remote: k }); o.n++;
        if (!R.lit({ ...P, cur: P.sol }).solved) o.bad++;
        if (R.lit(P).solved) o.pre++;
        if (!P.remote) { o.none++; continue; }
        const { st, arm, of, comp } = P.remote; o.st += st.length; o.arms += arm.flat().length;
        const adj = (a, b) => Math.abs(a % c - b % c) + Math.abs((a / c | 0) - (b / c | 0)) === 1;
        // kumanda çözümde; kollar 2–4 ızgara komşusu, simetrik değil; kumanda kimsenin kolu değil; karo en çok iki kumandaya; her kumandanın kendine ait 4 yönlü kolu
        if (st.some((q, j) => P.cur[q] !== P.sol[q] || of[q] || arm[j].length < 2 || arm[j].length > 4 || arm[j].some(t => !adj(t, q) || per(P.sol[t]) < 2 || !of[t]) || !arm[j].some(t => of[t] === 1 && per(P.sol[t]) === 4))) o.place++;
        if (of.some(v => v > 2) || comp.some(g => g.length > 2)) o.share++;
        for (const gp of comp) {
          o.comps++; if (gp.length === 2) o.pairs++;
          const U = P.units[P.unitOf[st[gp[0]]]];
          // sayaç: K = 4^m dokunuşta başa döner, arada K farklı durum
          { const cc = P.cur.slice(), seen = new Set(); for (let q = 0; q < U.K; q++) { seen.add(U.cells.map(i => cc[i]).join()); U.tap(cc); } if (seen.size !== U.K || U.cells.some(i => cc[i] !== P.cur[i])) o.cyc++; }
          // en az hamleli basış: çözüme götürür, hamle = basılan kumanda sayısı
          { const [sum, nz, ps] = U.need(P.cur, P.sol), cc = P.cur.slice(); ps.forEach((p, k) => { for (let q = 0; q < p; q++) U.at(cc, st[gp[k]]); }); if (U.cells.some(i => cc[i] !== P.sol[i]) || nz !== ps.filter(Boolean).length || sum !== ps.reduce((a, b) => a + b, 0) || !nz) o.reach++; }
          // açgözlü oyuncu: hedef resmi bilse bile her kumandayı sırayla "kendi kollarından en çoğunu düzelten" basışla dener (en çok 6 tur)
          { const cc = P.cur.slice(), opt = U.need(P.cur, P.sol)[1]; let mv = 0, last = -1;
            for (let round = 0; round < 6 && U.cells.some(i => cc[i] !== P.sol[i]); round++) for (const j of gp) {
              let bp = 0, bs = -1; for (let p = 0; p < 4; p++) { const t = cc.slice(); for (let q = 0; q < p; q++) U.at(t, st[j]); const sc = arm[j].filter(a => t[a] === P.sol[a]).length; if (sc > bs) { bs = sc; bp = p; } }
              if (bp) { for (let q = 0; q < bp; q++) U.at(cc, st[j]); if (last !== j) mv++; last = j; }
            }
            const won = U.cells.every(i => cc[i] === P.sol[i]); if (!won) o.gFail++; else if (mv > opt) o.gWorse++; o.greedy += won ? mv - opt : 0; }
        }
        // par: kumanda dışı karolar + öbek başına basılan kumanda sayısı
        { let p = 0; P.cur.forEach((v, i) => { if ((P.unitOf?.[i] ?? -1) >= 0) return; const j = P.link[i]; if (j >= 0 && j < i) return; let t = v, u = j >= 0 ? P.cur[j] : 0, k = 0; const step = P.rev[i] ? m => ((m >> 1) | (m << 3)) & 15 : rot; while ((t !== P.sol[i] || (j >= 0 && u !== P.sol[j])) && k < 4) { t = step(t); if (j >= 0) u = rot(u); k++; } if (k) p++; });
          for (const U of P.units) { if (U.moves) { p += U.moves(P.cur, P.sol); continue; } if (U.cost) { p += U.cost(P.cur); continue; } const r = R.unitTaps(U, P.cur, P.sol); if (r) p += U.need ? U.need(P.cur, P.sol)[1] : 1; } if (p !== P.par) o.par++; }
      }
      o.ms = Math.round(performance.now() - t0);
      // zorluk çözücüsü (aynı tohumlar, 7×9): kumandasız · tek kumanda · öbekli (çözücü son hâli sayar, basış planını saymaz → kumanda puanı düşürür)
      const dz = x => { let d = 0; for (let s = 1; s <= 60; s++) d += R.difficulty(R.generate(7, 9, s * 7919 + 13, 0, 0, x)); return +(d / 60).toFixed(1); };
      o.solver = { none: dz({}), one: dz({ remote: 1 }), two: dz({ remote: 2 }) };
      const a = R.lineStart(XL), z = R.lineStart(XL + 1); let early = 0, own = 0, mix = 0, km = 0, pairs = 0;
      for (let l = 1; l < a; l++) if (R.rulesFor(l).has('remote')) early++;
      for (let l = a; l < z; l++) { const P = R.puzzleFor(l); if (P.remote) own++; if (P.remote?.comp.some(g => g.length === 2)) pairs++; }
      for (let l = a; l < a + 900; l++) { const U = R.rulesFor(l); if (U.has('remote') && CLASH.some(k => U.has(k))) mix++; if (l >= z && U.has('remote')) km++; }
      const avg = c => { let d = 0; const a = R.lineStart(c), z = R.lineStart(c + 1); for (let l = a; l < z; l++) d += R.puzzleFor(l).diff; return +(d / (z - a)).toFixed(1); };
      o.line = { early, own, pairs, len: z - a, mix, km, intro: R.puzzleFor(a).remote?.st.length, fin: R.puzzleFor(z - 1).remote?.st.length, size: [a, a + 1, a + 2, a + 3].map(l => R.sizeFor(l).join('x')).join(' '), ladder: [avg(XL - 1), avg(XL), avg(XL + 1)] };
      return o;
    }, [XL, CLASH]);
    const ok = g.n - g.none;
    check('rule.remote.gen', `Kumanda karosu: ${g.n} tohum (6×8 · 7×9, uyumlu her eklentiyle) → çözüm geçerli, çözülmüş gelmez; kumanda çözümde, kimsenin kolu değil; 2–4 kol ızgara komşusu, simetrik değil; karo en çok 2 kumandaya, öbek en çok 2 kumanda; her kumandanın kendine ait 4 yönlü kolu; par = karo + basılan kumanda`,
      g.n >= 300 && g.none === 0 && g.bad === 0 && g.pre === 0 && g.place === 0 && g.share === 0 && g.par === 0 && g.st >= g.n, JSON.stringify({ ...g, line: undefined, solver: undefined }));
    check('rule.remote.solve', `Çözülebilirlik (${g.comps} öbek, ${g.pairs} çift kumandalı): öbek sayacı K = 4^m dokunuşta K farklı durumu gezip başa döner (bozuk ${g.cyc}); en az hamleli basış her öbeği çözüme götürür (bozuk ${g.reach})`,
      g.cyc === 0 && g.reach === 0 && g.pairs >= 50, JSON.stringify({ comps: g.comps, pairs: g.pairs, cyc: g.cyc, reach: g.reach }));
    check('rule.remote.hard', `Zorlaştırır: hedef resmi bilen açgözlü oyuncu ${g.gWorse + g.gFail}/${g.comps} öbekte en iyi basışı kaçırır (${g.gWorse} fazladan hamle, ${g.gFail} 6 turda çözemez, toplam +${g.greedy} hamle); merdiven M${XL} ${g.line.ladder[0]} < M${XL + 1} ${g.line.ladder[1]} (çözücü: kumandasız ${g.solver.none} · 1 kumanda ${g.solver.one} · 2 ${g.solver.two})`,
      g.gWorse + g.gFail > 0 && g.line.ladder[0] < g.line.ladder[1], JSON.stringify({ gWorse: g.gWorse, gFail: g.gFail, greedy: g.greedy, solver: g.solver, ladder: g.line.ladder }));
    check('rule.remote.clash', `Kumanda ${CLASH.join(', ')} ile hiçbir bölümde birlikte gelmez (900 bölüm, karma dahil)`, g.line.mix === 0, String(g.line.mix));
    check('rule.remote.line', `M${XL + 1} (${A}. bölümden): önceki bölümlerde yok, hattın her bölümünde var (${g.line.pairs} bölümde çift kumanda), giriş 1 kumanda, final 3, ilk 3 bölüm 6×8, sonrası karma`,
      A === 801 && g.line.early === 0 && g.line.own === g.line.len && g.line.intro === 1 && g.line.fin === 3 && g.line.pairs >= 20 && g.line.km >= 5 && g.line.size === '6x8 6x8 6x8 7x9', JSON.stringify(g.line));
    errs.push(...errors); await ctx.close();
  }

  // ---------- b) eski bölümler ----------
  {
    const sig = page => page.evaluate(a => {
      const R = window.__ray, h = s => { let x = 2166136261; for (const c of s) x = Math.imul(x ^ c.charCodeAt(0), 16777619); return (x >>> 0).toString(36); };
      let lv = ''; for (let l = 1; l < a; l += 5) { const P = R.puzzleFor(l); lv += P.sol.join('') + P.cur.join('') + P.diff + P.par + P.taps; }
      for (let l = a - 28; l < a; l++) { const P = R.puzzleFor(l); lv += P.sol.join('') + P.cur.join('') + P.par; }   // önceki hattın her bölümü
      return { lv: h(lv), d: h(['2026-10-27', '2027-03-14', '2026-11-08', '2026-11-21', '2026-11-22'].map(d => R.dailyBase(d).cur.join('')).join()) };
    }, A);
    const PA = await open(browser, URL, { save: { played: 1 } }), PB = await open(browser, URL, { save: { played: 1 }, init: NO_R });
    const sa = await sig(PA.page), sb = await sig(PB.page);
    check('rule.remote.old', `Kumanda eklentisi çıkarılınca 1–${A - 1}. bölümler ve Günün Hattı aynı`, sa.lv === sb.lv && sa.d === sb.d, JSON.stringify({ sa, sb }));
    errs.push(...PA.errors, ...PB.errors); await PA.ctx.close(); await PB.ctx.close();
  }

  // ---------- c) kural kartı: 320 px, bütün diller ----------
  {
    const LANGS = [['tr', 'tr-TR'], ['en', 'en-US'], ['de', 'de-DE'], ['es', 'es-ES'], ['pt', 'pt-BR'], ['fr', 'fr-FR'], ['ko', 'ko-KR'], ['ja', 'ja-JP'], ['zh', 'zh-TW']];
    const res = [];
    for (const [lang, locale] of LANGS) {
      const nc = browser.newContext; browser.newContext = x => nc({ ...x, locale });
      let o; try { o = await open(browser, URL, { vp: [320, 568], save: { played: A - 1, level: A, stars: starsUpTo(A), seen: seenTo(XL), remindAsked: true } }); } finally { browser.newContext = nc; }
      await o.page.click('#bPlay'); await o.page.waitForTimeout(800);
      const c = await o.page.evaluate(() => { const M = document.getElementById('modal'), m = M.querySelector('.sheet'), h = m?.querySelector('h2'), go = document.getElementById('mGo'), r = go?.getBoundingClientRect(), d = document.querySelector('.rd-remote');
        return { open: M.classList.contains('open'), h: h?.textContent, one: h ? h.getBoundingClientRect().height < parseFloat(getComputedStyle(h).lineHeight || '40') * 1.6 : false, demo: !!d && d.getBoundingClientRect().width > 150 && d.getBoundingClientRect().right <= innerWidth, anim: getComputedStyle(document.querySelector('.rd-remote .a') || document.body).animationName,
          fit: m ? m.scrollWidth <= m.clientWidth + 1 && m.scrollHeight <= m.clientHeight + 1 && m.getBoundingClientRect().right <= innerWidth + 1 && m.getBoundingClientRect().top >= 0 : false, btn: !!r && r.bottom <= innerHeight + 1, tr: /[ğşıĞŞİ]/.test(m?.textContent || '') }; });
      res.push({ lang, ...c });
      if (lang === 'tr' || lang === 'en' || lang === 'ja') await shot(o.page, `rule-remote-${lang}`);
      errs.push(...o.errors); await o.ctx.close();
    }
    const bad = res.filter(c => !(c.open && c.demo && c.anim === 'rdrT' && c.fit && c.btn && c.one && (c.lang === 'tr' || !c.tr)));
    check('rule.remote.card', `M${XL + 1} ilk girişte "YENİ KURAL · Kumanda karosu" kartı (animasyonlu) ${res.length} dilde 320×568'de sığar: başlık tek satır, kaydırma yok, düğme ekranda, çevrilmemiş metin yok`,
      !bad.length && /Kumanda karosu/.test(res[0].h || '') && /Remote tile/.test(res[1].h || ''), JSON.stringify(bad.length ? bad : res.map(c => c.lang + ':' + c.h)).slice(0, 900), 'medium');
  }

  // ---------- d) kumanda davranışı ve robot ----------
  {
    // giriş bölümü (tek kumanda): kumandaya dokununca bağlı komşular 90° döner, kumanda dönmez; art arda = 1 hamle; bağlı karoya dokunuş işlemez; geri al
    const { ctx, page, errors } = await open(browser, URL, { vp: [320, 640], save: { played: A - 1, level: A, stars: starsUpTo(A), seen: { ...seenTo(XL), [XL]: 1 }, remindAsked: true, bst: { geri: 3 } } });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    await shot(page, 'remote');
    const s0 = await page.evaluate(() => { const G = window.__ray.G, { st: [q], arm: [A] } = G.remote; return { q, A, cur: G.cur.slice(), m0: G.moves, W: document.documentElement.scrollWidth <= innerWidth }; });
    await tapTile(page, s0.q); await page.waitForTimeout(260);
    const s1 = await page.evaluate(([q, A, c0]) => { const R = window.__ray, G = R.G; return { rot: A.every(t => G.cur[t] === R.rot(c0[t])), self: G.cur[q] === c0[q], other: G.cur.every((v, i) => A.includes(i) || v === c0[i]), moves: G.moves, toast: document.getElementById('toast').textContent, saved: !!JSON.parse(localStorage.getItem('ray')).remoteTold }; }, [s0.q, s0.A, s0.cur]);
    await shot(page, 'remote-tap');
    await tapTile(page, s0.q); await page.waitForTimeout(200);
    const s2 = await page.evaluate(([q, A, c0]) => { const R = window.__ray, G = R.G; return { rot2: A.every(t => G.cur[t] === R.rot(R.rot(c0[t]))), self: G.cur[q] === c0[q], moves: G.moves }; }, [s0.q, s0.A, s0.cur]);
    // bağlı karoya dokunuş: hiçbir şey dönmez, hamle sayılmaz, bildirim
    const before = await page.evaluate(() => window.__ray.G.cur.slice());
    await tapTile(page, s0.A[0]); await page.waitForTimeout(200);
    const s3 = await page.evaluate(b => { const G = window.__ray.G; return { same: G.cur.every((v, i) => v === b[i]), moves: G.moves, toast: document.getElementById('toast').textContent }; }, before);
    // geri al: iki basış (1 hamle) geri alınır
    await page.waitForTimeout(300);
    await page.click('#gUndo'); await page.waitForTimeout(300);
    const s4 = await page.evaluate(c0 => { const G = window.__ray.G; return { back: G.cur.every((v, i) => v === c0[i]), moves: G.moves }; }, s0.cur);
    check('rule.remote.tap', `Bölüm ${A}: kumandaya dokununca ${s0.A.length} bağlı komşu 90° saat yönünde döner, kumanda ve öteki karolar dönmez; ilk dokunuşta bir kez bildirim; art arda 2 basış = 1 hamle; bağlı karoya dokunuş işlemez (hamle yok, bildirim); ↶ geri al ilk duruma döndürür`,
      s1.rot && s1.self && s1.other && s1.moves === s0.m0 + 1 && /Kumanda/.test(s1.toast) && s1.saved && s2.rot2 && s2.self && s2.moves === s0.m0 + 1 && s3.same && s3.moves === s2.moves && /kumandaya bağlı/.test(s3.toast) && s4.back && s4.moves === s0.m0 && s0.W,
      JSON.stringify({ s0: { q: s0.q, A: s0.A, m0: s0.m0 }, s1, s2, s3, s4 }));
    const taps = await solve(page, 12); const won = await waitModal(page);
    check('rule.remote.play', `Bölüm ${A}: robot kumandayı gereken sayıda basıp kazanır (${taps} dokunuş)`, won, JSON.stringify({ taps, won }));
    errs.push(...errors); await ctx.close();
  }
  {
    // çift kumandalı bölüm: ortak kol iki kumandayla döner, kumandalar ayrı hamle; ipucu öbeği bütünüyle çözüme oturtur
    const pg = await open(browser, URL, { save: { played: 9 } });
    const L2 = await pg.page.evaluate(a => { const R = window.__ray; for (let l = a + 1; l < a + 28; l++) if (R.puzzleFor(l).remote?.comp.some(g => g.length === 2)) return l; return -1; }, A);
    await pg.ctx.close();
    const { ctx, page, errors } = await open(browser, URL, { vp: [390, 844], save: { played: L2 - 1, level: L2, stars: starsUpTo(L2), seen: { ...seenTo(XL), [XL]: 1 }, remindAsked: true, remoteTold: 1, hints: 5 } });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    const s0 = await page.evaluate(() => { const G = window.__ray.G, { st, arm, comp } = G.remote, g = comp.find(g => g.length === 2), [a, b] = g; const sh = arm[a].filter(t => arm[b].includes(t)); return { qa: st[a], qb: st[b], A: arm[a], B: arm[b], sh, cur: G.cur.slice(), m0: G.moves }; });
    await shot(page, 'remote-pair');
    await tapTile(page, s0.qa); await page.waitForTimeout(150); await tapTile(page, s0.qb); await page.waitForTimeout(250);
    const s1 = await page.evaluate(([s0]) => { const R = window.__ray, G = R.G, r = R.rot, c0 = s0.cur;
      return { sh2: s0.sh.every(t => G.cur[t] === r(r(c0[t]))), a1: s0.A.filter(t => !s0.sh.includes(t)).every(t => G.cur[t] === r(c0[t])), b1: s0.B.filter(t => !s0.sh.includes(t)).every(t => G.cur[t] === r(c0[t])), still: G.cur[s0.qa] === c0[s0.qa] && G.cur[s0.qb] === c0[s0.qb], moves: G.moves }; }, [s0]);
    check('rule.remote.pair', `Bölüm ${L2}: iki kumanda ${s0.sh.length} ortak kolu paylaşır; ikisine birer basış: ortak kol 180°, kendi kolları 90° döner, kumandalar dönmez; iki kumanda = 2 hamle`,
      s0.sh.length >= 1 && s1.sh2 && s1.a1 && s1.b1 && s1.still && s1.moves === s0.m0 + 2, JSON.stringify({ s0: { qa: s0.qa, qb: s0.qb, sh: s0.sh }, s1 }));
    await shot(page, 'remote-pair-tap');
    const taps = await solve(page, 10); const won = await waitModal(page);
    check('rule.remote.pairplay', `Bölüm ${L2}: robot çift kumandalı bölümü en az hamleli basışlarla kazanır (${taps} dokunuş)`, won, JSON.stringify({ taps, won }));
    errs.push(...errors); await ctx.close();
  }
  {
    // ipucu: yanlış kollu öbeğe ipucu → kumandalar ve kolları birlikte sabitlenir
    const L2 = A + 1, { ctx, page, errors } = await open(browser, URL, { save: { played: L2 - 1, level: L2, stars: starsUpTo(L2), seen: { ...seenTo(XL), [XL]: 1 }, remindAsked: true, remoteTold: 1, hints: 5 } });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    await page.evaluate(() => { const G = window.__ray.G, U = new Set(G.remote.st.flatMap((q, j) => [q, ...G.remote.arm[j]])); G.sol.forEach((v, i) => { if (!U.has(i)) G.cur[i] = v; }); G.L = window.__ray.lit(G); });
    await page.click('#bHint'); await page.waitForTimeout(300);
    const h = await page.evaluate(() => { const G = window.__ray.G, { st, arm, comp } = G.remote, cs = comp.map(g => g.flatMap(j => [st[j], ...arm[j]])), f = cs.filter(c => c.every(i => G.fixed[i] && G.cur[i] === G.sol[i])); return { comps: cs.length, fixed: f.length, partial: cs.filter(c => c.some(i => G.fixed[i]) && !c.every(i => G.fixed[i])).length }; });
    check('rule.remote.hint', `Bölüm ${L2}: ipucu kumanda öbeğini (kumandalar + kollar) birlikte çözüme oturtup sabitler`, h.fixed >= 1 && h.partial === 0, JSON.stringify(h));
    errs.push(...errors); await ctx.close();
  }
  {
    // hattın ortasında 7×9 bölüm: robot kazanır
    const L2 = A + 7, { ctx, page, errors } = await open(browser, URL, { save: { played: L2 - 1, level: L2, stars: starsUpTo(L2), seen: { ...seenTo(XL), [XL]: 1 }, remindAsked: true, remoteTold: 1 } });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    const info = await page.evaluate(() => { const G = window.__ray.G; return { k: G.remote?.st.length, pairs: G.remote?.comp.filter(g => g.length === 2).length, size: G.cols + 'x' + G.rows }; });
    await shot(page, 'remote-mid');
    const taps = await solve(page, 8); const won = await waitModal(page);
    check('rule.remote.mid', `Bölüm ${L2}: ${info.k} kumanda (${info.pairs} çift), ${info.size}; robot kazanır`, info.k >= 2 && info.size === '7x9' && won, JSON.stringify({ ...info, taps, won }));
    errs.push(...errors); await ctx.close();
  }
  {
    // karanlık tünel + kumanda (karma): robot ışığı izleyerek kazanır
    const pg = await open(browser, URL, { save: { played: 9 } });
    const f = await pg.page.evaluate(() => { const R = window.__ray; for (let l = R.lineStart(R.RULE_LINE.remote + 1); l < 20000; l++) { const U = R.rulesFor(l); if (U.has('remote') && U.has('fog')) return l; } return -1; });
    await pg.ctx.close();
    const o = await open(browser, URL, { save: { played: f - 1, level: f, stars: starsUpTo(f), seen: Object.fromEntries(Array.from({ length: 40 }, (_, k) => [k, 1])), remindAsked: true, remoteTold: 1 } });
    await o.page.click('#bPlay'); await o.page.waitForTimeout(800);
    const info = await o.page.evaluate(() => { const G = window.__ray.G; return { fog: !!G.fog, remote: !!G.remote }; });
    await shot(o.page, 'remote-fog');
    await solve(o.page, 8, 80); const won = await waitModal(o.page);
    check('rule.remote.fog', `Bölüm ${f}: karanlık tünel + kumanda; robot ışığı izleyerek kazanır`, f > 0 && info.fog && info.remote && won, JSON.stringify({ f, ...info, won }));
    errs.push(...o.errors); await o.ctx.close();
  }
  {
    // düşük donanım: 7×9 hat finali (en çok kumanda), 4× yavaş CPU; kumandalara art arda dokunarak sürekli dönüş animasyonu
    const L2 = AT('remote', 27), { ctx, page, errors } = await open(browser, URL, { save: { played: L2 - 1, level: L2, stars: starsUpTo(L2), seen: { ...seenTo(XL), [XL]: 1 }, remindAsked: true, remoteTold: 1 } });
    await page.click('#bPlay'); await page.waitForTimeout(500);
    const q = await page.evaluate(() => {
      const R = window.__ray, G = R.G, m = R.MODS.find(q => q.key === 'remote'), raf = window.requestAnimationFrame; let hk = 0;
      window.__dt = []; window.__hk = [];
      for (const h of ['over']) { const f = m[h]; m[h] = function (D) { const a = performance.now(), r = f.call(this, D); hk += performance.now() - a; return r; }; }
      window.requestAnimationFrame = cb => raf(t => { hk = 0; const a = performance.now(); cb(t); window.__dt.push(performance.now() - a); window.__hk.push(hk); });
      return G.remote.st;
    });
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    for (let k = 0; k < 32; k++) { await tapTile(page, q[(k >> 2) % q.length]); await page.waitForTimeout(70); }
    await page.waitForTimeout(800);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const r = await page.evaluate(() => {
      const q = (a, p) => { a = a.slice().sort((x, y) => x - y); return +(a[Math.min(a.length - 1, Math.floor(a.length * p))] || 0).toFixed(2); };
      return { n: window.__dt.length, d50: q(window.__dt, .5), d95: q(window.__dt, .95), h50: q(window.__hk, .5), h95: q(window.__hk, .95) };
    });
    check('rule.remote.perf', `4× yavaş CPU, 7×9 hat finali (${q.length} kumanda): kare çizimi ortanca < 8 ms, kumanda kancası ortanca < 1 ms`, q.length >= 3 && r.n > 60 && r.d50 < 8 && r.h50 < 1, `çizim p50 ${r.d50} · p95 ${r.d95} ms · kanca p50 ${r.h50} · p95 ${r.h95} ms · ${r.n} kare`, 'medium');
    errs.push(...errors); await ctx.close();
  }
  check('rule.remote.errors', 'Kumanda senaryolarında konsol hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
};
