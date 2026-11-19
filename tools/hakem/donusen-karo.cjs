// 🔄 Dönüşen karo (morph) — hakem.cjs K bölümü çağırır. Ayrıntı: docs/kurallar/donusen-karo.md
// Üretim (çözüm geçerli, başlangıç çözülmüş değil, döngü çözümü içerir; uyumlu her eklentiyle), çözücü dört hâli bilir, zorluk önce/sonra,
// makas ve silik kolla aynı bölümde gelmez, hat ve merdiven, eski bölümler bit bit aynı, kural kartı (9 dil, 320 px), dokunuşta biçim + yön değişimi,
// robot kazanır (hat başı, hat ortası, karanlık tünel), konsol hatası yok, 4× yavaş CPU'da çizim süresi.
module.exports = async T => {
  const { browser, URL, open, check, solve, shot, tapTile, waitModal, starsUpTo, RL, AT, seenTo } = T;
  const errs = [], XL = RL.morph, A = AT('morph');
  const NO_MO = `window.RAY_RULES = []; { const push = window.RAY_RULES.push.bind(window.RAY_RULES); window.RAY_RULES.push = f => push(api => { const m = f(api); return m?.key === 'morph' ? null : m; }); }`;
  const A_CYC = [3, 10, 12, 5], B_CYC = [6, 5, 9, 10];

  // ---------- a) üretim, çözücü, zorluk ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 9 } });
    const g = await page.evaluate(([XL, A_CYC, B_CYC]) => {
      const R = window.__ray, o = { n: 0, none: 0, bad: 0, pre: 0, place: 0, cyc: 0, start: 0, taps: 0, k: 0, leafBad: 0, found: 0, ms: 0 };
      const me = R.MODS.find(m => m.key === 'morph'), keys = R.MODS.map(m => m.key).filter(k => k !== 'morph' && !me.clash.includes(k));
      const popc = m => (m & 1) + (m >> 1 & 1) + (m >> 2 & 1) + (m >> 3 & 1), CY = [null, A_CYC, B_CYC];
      const t0 = performance.now();
      for (const [c, r] of [[6, 8], [7, 9]]) for (const x of [{}, { two: true }, { fog: true, rev: 3, cnt: 3 }, ...keys.map(k => ({ [k]: 2 }))]) for (let s = 1; s <= 8; s++) {
        const k = 2 + s % 3, P = R.generate(c, r, s * 7919 + 211, 0, s % 3 || Object.keys(x).some(q => keys.includes(q)) ? 0 : 2, { ...x, morph: k }); o.n++;
        if (!R.lit({ ...P, cur: P.sol }).solved) o.bad++;
        if (R.lit(P).solved) o.pre++;
        if (!P.morph) { o.none++; continue; }
        const cells = P.morph.map((f, i) => f ? i : -1).filter(i => i >= 0); o.k += cells.length;
        for (const i of cells) {
          const u = P.unitOf?.[i] ?? -1, U = P.units?.[u], cy = CY[P.morph[i]];
          // çözümde köşe ya da düz, merkez/eşli/ters/sayaçlı değil, tek karoluk K = 4 birim
          if (popc(P.sol[i]) !== 2 || i === P.hub || i === P.hub2 || P.link[i] >= 0 || P.rev[i] || P.cnt[i] >= 0 || !U || U.kind !== 'morph' || U.K !== 4 || U.cells.length !== 1) o.place++;
          // döngü çözümü ve başlangıcı içerir; her dokunuş biçim değiştirir (köşe ↔ düz); 4 dokunuşta başa döner
          if (!cy || !cy.includes(P.sol[i]) || !cy.includes(P.cur[i])) { o.cyc++; continue; }
          const a = P.cur.slice(), seq = [a[i]]; for (let t = 0; t < 4; t++) { U.tap(a); seq.push(a[i]); }
          if (seq[4] !== seq[0] || new Set(seq.slice(0, 4)).size !== 4 || seq.some((m, t) => t && (m === 5 || m === 10) === (seq[t - 1] === 5 || seq[t - 1] === 10))) o.cyc++;
          if (P.cur[i] === P.sol[i]) o.start++;
          const t = R.unitTaps(U, P.cur, P.sol); if (t < 1 || t > 3) o.taps++;
        }
        // çözücü: yapraktaki her dizilimde dönüşen karo kendi döngüsünde; çözümü bulur (tavan 2000)
        let hit = false;
        R.difficulty(P, cfg => { if (cells.some(i => !CY[P.morph[i]].includes(cfg[i]))) o.leafBad++; if (R.lit({ ...P, cur: cfg }).solved) hit = true; return hit; }, 2000);
        if (hit) o.found++;
      }
      o.ms = Math.round(performance.now() - t0);
      // zorluk önce/sonra: aynı tohumlar, 7×9, kuralsız ↔ 4 dönüşen karo
      const dv = x => { let d = 0; for (let s = 1; s <= 40; s++) d += R.difficulty(R.generate(7, 9, s * 104729 + 17, 0, 0, x)); return +(d / 40).toFixed(1); };
      o.diff = { before: dv({}), after: dv({ morph: 4 }), after6: dv({ morph: 6 }) };
      // hat, clash
      const a = R.lineStart(XL), z = R.lineStart(XL + 1); let early = 0, own = 0, mix = 0, km = 0;
      for (let l = 1; l < a; l++) if (R.rulesFor(l).has('morph')) early++;
      for (let l = a; l < z; l++) if (R.puzzleFor(l).morph) own++;
      for (let l = a; l < a + 900; l++) { const U = R.rulesFor(l); if (U.has('morph') && me.clash.some(q => U.has(q))) mix++; if (l >= z && U.has('morph')) km++; }
      const avg = c => { let d = 0; const a = R.lineStart(c), z = R.lineStart(c + 1); for (let l = a; l < z; l++) d += R.puzzleFor(l).diff; return +(d / (z - a)).toFixed(1); };
      const cnt = l => R.puzzleFor(l).morph?.filter(f => f).length;
      o.line = { early, own, len: z - a, mix, km, karma: R.rulesFor(z).size > 0 && !R.RULES?.[XL + 1], intro: cnt(a), fin: cnt(z - 1), size: [a, a + 1, a + 2, a + 3].map(l => R.sizeFor(l).join('x')).join(' '), ladder: [avg(XL - 2), avg(XL - 1), avg(XL), avg(XL + 1)] };
      return o;
    }, [XL, A_CYC, B_CYC]);
    const ok = g.n - g.none;
    check('rule.morph.gen', `Dönüşen karo: ${g.n} tohum (6×8 · 7×9, uyumlu her eklentiyle) → çözüm geçerli, çözülmüş gelmez; karo çözümde köşe/düz, tek karoluk 4 durumlu birim, döngü çözümü içerir, her dokunuş biçim değiştirir, başlangıç çözüm değil (1–3 dokunuş)`,
      g.n >= 300 && g.none === 0 && g.bad === 0 && g.pre === 0 && g.place === 0 && g.cyc === 0 && g.start === 0 && g.taps === 0 && g.k >= g.n * 2, JSON.stringify({ ...g, line: undefined, diff: undefined }));
    check('rule.morph.solver', `Çözücü dönüşen karonun dört hâlini bilir: yapraktaki dizilimler döngü içinde (${g.leafBad} dışarıda), çözüm ${g.found}/${ok} bölümde bulunur; zorluk 7×9 (40 tohum) kuralsız ${g.diff.before} → 4 karo ${g.diff.after} · 6 karo ${g.diff.after6}`,
      g.leafBad === 0 && g.found >= ok * .97 && g.diff.after > g.diff.before, JSON.stringify({ leafBad: g.leafBad, found: g.found, ok, diff: g.diff }));
    check('rule.morph.clash', 'Dönüşen karo makas ve silik kolla hiçbir bölümde birlikte gelmez (900 bölüm, karma dahil)', g.line.mix === 0, String(g.line.mix));
    check('rule.morph.line', `M${XL + 1} (${A}. bölümden): önceki bölümlerde yok, hattın her bölümünde var, giriş 2 karo, final ${g.line.fin}, ilk 3 bölüm 6×8, sonrası karma; merdiven M${XL - 1} ${g.line.ladder[0]} < M${XL} ${g.line.ladder[1]} < M${XL + 1} ${g.line.ladder[2]} (karma M${XL + 2} ${g.line.ladder[3]})`,
      g.line.early === 0 && g.line.own === g.line.len && g.line.intro === 2 && g.line.fin >= 4 && g.line.km >= 5 && g.line.size === '6x8 6x8 6x8 7x9' && g.line.ladder[0] < g.line.ladder[1] && g.line.ladder[1] < g.line.ladder[2], JSON.stringify(g.line));
    errs.push(...errors); await ctx.close();
  }

  // ---------- b) eski bölümler ----------
  {
    const sig = page => page.evaluate(a => {
      const R = window.__ray, h = s => { let x = 2166136261; for (const c of s) x = Math.imul(x ^ c.charCodeAt(0), 16777619); return (x >>> 0).toString(36); };
      let lv = ''; for (let l = 1; l < a; l += 5) { const P = R.puzzleFor(l); lv += P.sol.join('') + P.cur.join('') + P.diff; }
      lv += R.puzzleFor(a - 1).cur.join('');
      return { lv: h(lv), d: h(['2026-10-27', '2027-03-14', '2026-11-08', '2026-11-21'].map(d => R.dailyBase(d).cur.join('')).join()) };
    }, A);
    const PA = await open(browser, URL, { save: { played: 1 } }), PB = await open(browser, URL, { save: { played: 1 }, init: NO_MO });
    const sa = await sig(PA.page), sb = await sig(PB.page);
    check('rule.morph.old', `Dönüşen karo eklentisi çıkarılınca 1–${A - 1}. bölümler ve Günün Hattı aynı`, sa.lv === sb.lv && sa.d === sb.d, JSON.stringify({ sa, sb }));
    errs.push(...PA.errors, ...PB.errors); await PA.ctx.close(); await PB.ctx.close();
  }

  // ---------- c) kural kartı: 9 dil, 320 px ----------
  {
    const res = {};
    const nc = browser.newContext;
    for (const loc of ['tr-TR', 'en-US', 'de-DE', 'es-ES', 'pt-BR', 'fr-FR', 'ko-KR', 'ja-JP', 'zh-TW']) {
      browser.newContext = x => nc.call(browser, { ...x, locale: loc });
      let o; try { o = await open(browser, URL, { vp: [320, 568], save: { played: A - 1, level: A, stars: starsUpTo(A), seen: seenTo(XL), remindAsked: true } }); } finally { browser.newContext = nc; }
      const { ctx, page, errors } = o;
      await page.click('#bPlay'); await page.waitForTimeout(800);
      res[loc] = await page.evaluate(() => {
        const M = document.getElementById('modal'), m = M.querySelector('.sheet'), r = m?.getBoundingClientRect(), d = document.querySelector('.rd-morph .pt')?.getBoundingClientRect();
        const kids = m ? [...m.querySelectorAll('*')].every(e => { const q = e.getBoundingClientRect(); return !q.width || (q.left >= r.left - 1 && q.right <= r.right + 1); }) : false;
        return { open: M.classList.contains('open'), h: m?.querySelector('h2')?.textContent, demo: !!d && d.width >= 70, anim: getComputedStyle(document.querySelector('.rd-m1') || document.body).animationName,
          fit: !!m && m.scrollWidth <= m.clientWidth + 1 && r.right <= innerWidth + 1 && r.left >= -1 && r.top >= 0 && r.bottom <= innerHeight + 1 && kids, tr: /[ğışĞİŞ]/.test(m?.textContent || '') };
      });
      if (['tr-TR', 'en-US', 'de-DE', 'ja-JP'].includes(loc)) await shot(page, 'rule-morph-' + loc.slice(0, 2));
      errs.push(...errors); await ctx.close();
    }
    const bad = Object.entries(res).filter(([l, v]) => !v.open || !v.demo || v.anim !== 'rdmF' || !v.fit || (l !== 'tr-TR' && v.tr));
    check('rule.morph.card', `M${XL + 1} ilk girişte kural kartı (animasyonlu, 9 dil), 320×568 px'te taşmaz, Türkçe dışında Türkçe harf yok`, !bad.length && /Dönüşen karo/.test(res['tr-TR'].h) && /Shifting tile/.test(res['en-US'].h), JSON.stringify(bad.length ? bad : res['tr-TR']), 'medium');
  }

  // ---------- d) oyun: dokunuşta biçim + yön değişimi, ipucu, robot kazanır ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { vp: [320, 640], save: { played: A - 1, level: A, stars: starsUpTo(A), seen: { ...seenTo(XL), [XL]: 1 }, remindAsked: true } });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    const g0 = await page.evaluate(() => { const G = window.__ray.G; return { cells: G.morph.map((f, i) => f ? i : -1).filter(i => i >= 0), fam: G.morph.filter(f => f), cur: G.cur.slice(), moves: G.moves, W: document.documentElement.scrollWidth <= innerWidth }; });
    await shot(page, 'morph');
    const i = g0.cells[0], cy = g0.fam[0] === 1 ? A_CYC : B_CYC, seq = [g0.cur[i]];
    for (let t = 0; t < 4; t++) { await tapTile(page, i); await page.waitForTimeout(240); seq.push(await page.evaluate(i => window.__ray.G.cur[i], i)); }
    const st = await page.evaluate(() => ({ moves: window.__ray.G.moves, t: document.getElementById('toast').textContent, saved: !!JSON.parse(localStorage.getItem('ray')).morphTold }));
    const exp = [0, 1, 2, 3, 4].map(t => cy[(cy.indexOf(g0.cur[i]) + t) % 4]);
    const turn = seq.slice(1).every((m, t) => (m === 5 || m === 10) !== (seq[t] === 5 || seq[t] === 10) && m !== seq[t]);
    const taps = await solve(page, 12); const won = await waitModal(page);
    await shot(page, 'morph-won');
    check('rule.morph.tap', `Bölüm ${A}: ${g0.cells.length} dönüşen karo; dokunuş ${seq.join(' → ')} (her dokunuşta biçim köşe ↔ düz ve yön değişir, 4 dokunuşta başa döner, art arda 4 dokunuş = 1 hamle), ilk dokunuşta bir kez bildirim`,
      g0.cells.length === 2 && seq.join() === exp.join() && turn && st.moves === g0.moves + 1 && /Dönüşen karo/.test(st.t) && st.saved && g0.W, JSON.stringify({ seq, exp, st, W: g0.W }));
    check('rule.morph.play', `Bölüm ${A}: robot kazanır (${taps} dokunuş)`, won, JSON.stringify({ taps, won }));
    errs.push(...errors); await ctx.close();
  }
  {
    // hattın ortasında (zorluk paylı, 7×9) bir bölüm: robot kazanır
    const L2 = A + 7, { ctx, page, errors } = await open(browser, URL, { save: { played: L2 - 1, level: L2, stars: starsUpTo(L2), seen: { ...seenTo(XL), [XL]: 1 }, remindAsked: true, morphTold: 1 } });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    const info = await page.evaluate(() => { const G = window.__ray.G; return { k: G.morph?.filter(f => f).length, size: G.cols + 'x' + G.rows }; });
    await shot(page, 'morph-mid');
    await solve(page, 8); const won = await waitModal(page);
    check('rule.morph.mid', `Bölüm ${L2}: ${info.k} dönüşen karo (${info.size}); robot kazanır`, info.k >= 3 && won, JSON.stringify({ ...info, won }));
    errs.push(...errors); await ctx.close();
  }
  {
    // karanlık tünel + dönüşen karo (karma): robot ışığı izleyerek kazanır; karanlık karonun önizlemesi çizilmez
    const pg = await open(browser, URL, { save: { played: 9 } });
    const f = await pg.page.evaluate(() => { const R = window.__ray; for (let l = R.lineStart(R.RULE_LINE.morph + 1); l < 20000; l++) { const U = R.rulesFor(l); if (U.has('morph') && U.has('fog')) return l; } return -1; });
    await pg.ctx.close();
    const o = await open(browser, URL, { save: { played: f - 1, level: f, stars: starsUpTo(f), seen: Object.fromEntries(Array.from({ length: 40 }, (_, k) => [k, 1])), remindAsked: true, morphTold: 1 } });
    await o.page.click('#bPlay'); await o.page.waitForTimeout(800);
    const info = await o.page.evaluate(() => { const G = window.__ray.G; return { fog: !!G.fog, morph: !!G.morph, dark: G.morph?.some((v, i) => v && !G.seen[i]) }; });
    await shot(o.page, 'morph-fog');
    await solve(o.page, 8, 80); const won = await waitModal(o.page);
    check('rule.morph.fog', `Bölüm ${f}: karanlık tünel + dönüşen karo; robot ışığı izleyerek kazanır`, f > 0 && info.fog && info.morph && won, JSON.stringify({ f, ...info, won }));
    errs.push(...o.errors); await o.ctx.close();
  }
  {
    // 4× yavaş CPU, 7×9 hat finali (en çok dönüşen karo): kare çizimi ve eklenti kancalarının süresi
    const L7 = AT('morph', 27), { ctx, page, errors } = await open(browser, URL, { save: { played: L7 - 1, level: L7, stars: starsUpTo(L7), seen: { ...seenTo(XL), [XL]: 1 }, remindAsked: true, morphTold: 1 } });
    await page.click('#bPlay'); await page.waitForTimeout(600);
    const cells = await page.evaluate(() => {
      const R = window.__ray, G = R.G, m = R.MODS.find(q => q.key === 'morph'), raf = window.requestAnimationFrame; let hk = 0;
      window.__dt = []; window.__hk = [];
      for (const h of ['under', 'over']) { const f = m[h]; m[h] = function (D) { const a = performance.now(), r = f.call(this, D); hk += performance.now() - a; return r; }; }
      window.requestAnimationFrame = cb => raf(t => { hk = 0; const a = performance.now(); cb(t); window.__dt.push(performance.now() - a); window.__hk.push(hk); });
      return G.morph.map((f, i) => f ? i : -1).filter(i => i >= 0);
    });
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    for (let k = 0; k < 30; k++) { await tapTile(page, cells[k % cells.length]); await page.waitForTimeout(60); }
    await page.waitForTimeout(800);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const r = await page.evaluate(() => {
      const q = (a, p) => { a = a.slice().sort((x, y) => x - y); return +(a[Math.min(a.length - 1, Math.floor(a.length * p))] || 0).toFixed(2); };
      return { n: window.__dt.length, d50: q(window.__dt, .5), d95: q(window.__dt, .95), h50: q(window.__hk, .5), h95: q(window.__hk, .95) };
    });
    check('rule.morph.perf', `4× yavaş CPU, 7×9 hat finali (${cells.length} dönüşen karo): kare çizimi ortanca < 8 ms, dönüşen karo kancaları ortanca < 1 ms`, cells.length >= 4 && r.n > 60 && r.d50 < 8 && r.h50 < 1,
      `çizim p50 ${r.d50} · p95 ${r.d95} ms · kancalar p50 ${r.h50} · p95 ${r.h95} ms · ${r.n} kare`, 'medium');
    errs.push(...errors); await ctx.close();
  }
  check('rule.morph.errors', 'Dönüşen karo senaryolarında konsol hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
};
