// ⇄ Manevra karosu (shunt) — hakem.cjs K bölümü çağırır. Ayrıntı: docs/kurallar/manevra.md
// Üretim (çözüm geçerli, başlangıç çözülmüş değil, başlangıç = çözüm biçimlerinin düzensiz dağılımı; uyumlu her eklentiyle), birim sözleşmesi
// (K dizilim, tap döngüsü, unitTaps, U.moves), çözücü bütün dizilimleri bilir, zorluk (çözücü + insan modeli) önce/sonra, clash, hat ve merdiven,
// eski bölümler bit bit aynı, kural kartı (9 dil, 320 px), takas davranışı (seçim, takas, bırakma, 1 hamle, geri al, kayıt, ipucu),
// robot kazanır (hat başı, 7×9, karanlık tünel), konsol hatası yok, 4× yavaş CPU'da çizim süresi.
module.exports = async T => {
  const { browser, URL, open, check, solve, shot, tapTile, waitModal, starsUpTo, RL, AT, seenTo } = T;
  const errs = [], XL = RL.shunt, A = AT('shunt');
  const NO_SH = `window.RAY_RULES = []; { const push = window.RAY_RULES.push.bind(window.RAY_RULES); window.RAY_RULES.push = f => push(api => { const m = f(api); return m?.key === 'shunt' ? null : m; }); }`;

  // ---------- a) üretim, birim, çözücü, zorluk ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 9 } });
    const g = await page.evaluate(XL => {
      const R = window.__ray, o = { n: 0, none: 0, bad: 0, pre: 0, place: 0, perm: 0, inplace: 0, dup: 0, unit: 0, moves: 0, k: 0, leafBad: 0, found: 0, ms: 0 };
      const me = R.MODS.find(m => m.key === 'shunt'), keys = R.MODS.map(m => m.key).filter(k => k !== 'shunt' && !me.clash.includes(k));
      const fact = k => k < 2 ? 1 : k * fact(k - 1), arrs = v => { const m = {}; v.forEach(x => { m[x] = (m[x] || 0) + 1; }); return Object.values(m).reduce((r, c) => r / fact(c), fact(v.length)); };
      const ms = a => a.slice().sort((x, y) => x - y).join();
      const t0 = performance.now();
      for (const [c, r] of [[6, 8], [7, 9]]) for (const x of [{}, { two: true }, { fog: true, rev: 3, cnt: 3 }, ...keys.map(k => ({ [k]: 2 }))]) for (let s = 1; s <= 7; s++) {
        const k = 3 + s % 3, P = R.generate(c, r, s * 7919 + 307, 0, s % 3 || Object.keys(x).some(q => keys.includes(q)) ? 0 : 2, { ...x, shunt: k }); o.n++;
        if (!R.lit({ ...P, cur: P.sol }).solved) o.bad++;
        if (R.lit(P).solved) o.pre++;
        if (!P.shunt) { o.none++; continue; }
        const cells = P.shunt, U = P.units?.[P.unitOf[cells[0]]]; o.k += cells.length;
        if (cells.length !== k || cells.some(i => i === P.hub || i === P.hub2 || P.link[i] >= 0 || P.rev[i] || P.cnt[i] >= 0 || P.unitOf[i] !== P.unitOf[cells[0]])) o.place++;
        // başlangıç = çözüm biçimlerinin karışık dağılımı (aynı çoklu küme), biçimler farklıysa hiçbiri yerinde değil
        if (ms(cells.map(i => P.cur[i])) !== ms(cells.map(i => P.sol[i]))) o.perm++;
        const dist = new Set(cells.map(i => P.sol[i])).size === cells.length; if (!dist) o.dup++;
        if (dist && cells.some(i => P.cur[i] === P.sol[i])) o.inplace++;
        // birim: K = farklı dizilim sayısı; tap K dokunuşta başa döner ve her dizilimi bir kez gezer; yalnız grup karoları değişir
        if (!U || U.kind !== 'shunt' || U.K !== arrs(cells.map(i => P.sol[i])) || U.cells.join() !== cells.join()) o.unit++;
        else {
          const a = P.cur.slice(), seen = new Set(); let ok = true;
          for (let t = 0; t < U.K; t++) { seen.add(cells.map(i => a[i]).join()); U.tap(a); if (a.some((v, i) => !cells.includes(i) && v !== P.cur[i])) ok = false; }
          if (!ok || seen.size !== U.K || a.join() !== P.cur.join()) o.unit++;
          const b = P.cur.slice(); for (let t = R.unitTaps(U, P.cur, P.sol); t > 0; t--) U.tap(b);
          if (cells.some(i => b[i] !== P.sol[i])) o.unit++;
          const m = U.moves(P.cur, P.sol); if (m < 1 || m > k - 1) o.moves++;
        }
        // çözücü: yapraktaki her dizilimde grup biçimleri aynı çoklu küme; çözüm bulunur (tavan 2000)
        let hit = false; const want = ms(cells.map(i => P.sol[i]));
        R.difficulty(P, cfg => { if (ms(cells.map(i => cfg[i])) !== want) o.leafBad++; if (R.lit({ ...P, cur: cfg }).solved) hit = true; return hit; }, 2000);
        if (hit) o.found++;
      }
      o.ms = Math.round(performance.now() - t0);
      // zorluk önce/sonra (7×9, aynı 40 tohum): çekirdek çözücü (grubu tek birim olarak, bütün dizilimlerle ortak çıkarım yapar) ve
      // insan modeli: her ⇄ karo grubun biçimlerinden biri olabilir, "her biçim bir kez" defteri tutulmaz (karo karo düşünen oyuncu)
      const H = { key: 'shuntH', cands: (P, i) => P.shunt.includes(i) ? [...new Set(P.shunt.map(q => P.cur[q]))] : null }; R.MODS.push(H);
      const dv = (x, hum) => { let d = 0; for (let s = 1; s <= 40; s++) { const P = R.generate(7, 9, s * 104729 + 17, 0, 0, x); d += R.difficulty(hum ? { ...P, units: undefined, unitOf: undefined, shuntH: 1 } : P); } return +(d / 40).toFixed(1); };
      o.diff = { before: dv({}), k4: dv({ shunt: 4 }), k5: dv({ shunt: 5 }), h4: dv({ shunt: 4 }, 1), h5: dv({ shunt: 5 }, 1) };
      R.MODS.splice(R.MODS.indexOf(H), 1);
      // hat, clash, merdiven
      const a = R.lineStart(XL), z = R.lineStart(XL + 1); let early = 0, own = 0, mix = 0, km = 0;
      for (let l = 1; l < a; l++) if (R.rulesFor(l).has('shunt')) early++;
      for (let l = a; l < z; l++) if (R.puzzleFor(l).shunt) own++;
      for (let l = a; l < a + 900; l++) { const U = R.rulesFor(l); if (U.has('shunt') && me.clash.some(q => U.has(q))) mix++; if (l >= z && U.has('shunt')) km++; }
      const avg = c => { let d = 0; const a = R.lineStart(c), z = R.lineStart(c + 1); for (let l = a; l < z; l++) d += R.puzzleFor(l).diff; return +(d / (z - a)).toFixed(1); };
      const cnt = l => R.puzzleFor(l).shunt?.length;
      const tg = performance.now(); R.puzzleFor(a + 20); const gen = Math.round(performance.now() - tg);
      o.line = { a, early, own, len: z - a, mix, km, intro: cnt(a), mid: cnt(a + 7), fin: cnt(z - 1), gen, size: [a, a + 1, a + 2, a + 3].map(l => R.sizeFor(l).join('x')).join(' '), ladder: [avg(XL - 2), avg(XL - 1), avg(XL), avg(XL + 1)] };
      return o;
    }, XL);
    const ok = g.n - g.none;
    check('rule.shunt.gen', `Manevra: ${g.n} tohum (6×8 · 7×9, uyumlu her eklentiyle) → çözüm geçerli, çözülmüş gelmez; 3–5 ⇄ karo tek birim, başlangıç çözüm biçimlerinin karışık dağılımı (farklı biçimlerde hiçbiri yerinde değil); K = dizilim sayısı, tap her dizilimi bir kez gezer, unitTaps çözüme götürür, en az takas 1…k−1`,
      g.n >= 300 && g.none === 0 && g.bad === 0 && g.pre === 0 && g.place === 0 && g.perm === 0 && g.inplace === 0 && g.unit === 0 && g.moves === 0 && g.k >= g.n * 3, JSON.stringify({ ...g, line: undefined, diff: undefined }));
    check('rule.shunt.solver', `Çözücü bütün dizilimleri bilir: yaprakta grup biçimleri hep aynı (${g.leafBad} dışarıda), çözüm ${g.found}/${ok} bölümde bulunur; zorluk 7×9 (40 tohum) kuralsız ${g.diff.before} → çekirdek çözücü 4 karo ${g.diff.k4} · 5 karo ${g.diff.k5}; insan modeli (karo karo) 4 karo ${g.diff.h4} · 5 karo ${g.diff.h5}`,
      g.leafBad === 0 && g.found === ok && g.diff.h4 > g.diff.before && g.diff.h5 > g.diff.h4, JSON.stringify({ leafBad: g.leafBad, found: g.found, ok, diff: g.diff }));
    check('rule.shunt.clash', 'Manevra kayan sıra, kayan sütun ve döner tablayla hiçbir bölümde birlikte gelmez (900 bölüm, karma dahil)', g.line.mix === 0, String(g.line.mix));
    check('rule.shunt.line', `M${XL + 1} (${A}. bölümden): önceki bölümlerde yok, hattın her bölümünde var, giriş 3 karo, 7×9 ${g.line.mid}, final ${g.line.fin}, ilk 3 bölüm 6×8, sonrası karma; merdiven M${XL - 1} ${g.line.ladder[0]} < M${XL} ${g.line.ladder[1]} < M${XL + 1} ${g.line.ladder[2]} (karma M${XL + 2} ${g.line.ladder[3]}); bölüm üretimi ${g.line.gen} ms`,
      A === 829 && g.line.early === 0 && g.line.own === g.line.len && g.line.intro === 3 && g.line.mid === 5 && g.line.fin === 5 && g.line.km >= 5 && g.line.size === '6x8 6x8 6x8 7x9' && g.line.ladder[1] < g.line.ladder[2] && g.line.ladder[2] > 26.6, JSON.stringify(g.line));
    errs.push(...errors); await ctx.close();
  }

  // ---------- b) eski bölümler ----------
  {
    const sig = page => page.evaluate(a => {
      const R = window.__ray, h = s => { let x = 2166136261; for (const c of s) x = Math.imul(x ^ c.charCodeAt(0), 16777619); return (x >>> 0).toString(36); };
      let lv = ''; for (let l = 1; l < a; l += 5) { const P = R.puzzleFor(l); lv += P.sol.join('') + P.cur.join('') + P.diff + P.par; }
      for (const l of [a - 3, a - 2, a - 1]) lv += R.puzzleFor(l).cur.join('') + R.puzzleFor(l).par;
      return { lv: h(lv), d: h(['2026-10-27', '2027-03-14', '2026-11-08', '2026-11-21', '2026-11-22'].map(d => R.dailyBase(d).cur.join('') + R.dailyFor(d).cur.join('')).join()) };
    }, A);
    const PA = await open(browser, URL, { save: { played: 1 } }), PB = await open(browser, URL, { save: { played: 1 }, init: NO_SH });
    const sa = await sig(PA.page), sb = await sig(PB.page);
    check('rule.shunt.old', `Manevra eklentisi çıkarılınca 1–${A - 1}. bölümler ve Günün Hattı aynı`, sa.lv === sb.lv && sa.d === sb.d, JSON.stringify({ sa, sb }));
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
      if (loc === 'tr-TR') await page.waitForTimeout(1500);   // demo: seçim halkası görünsün
      res[loc] = await page.evaluate(() => {
        const M = document.getElementById('modal'), m = M.querySelector('.sheet'), r = m?.getBoundingClientRect(), d = document.querySelector('.rd-shunt')?.getBoundingClientRect();
        const kids = m ? [...m.querySelectorAll('*')].every(e => { const q = e.getBoundingClientRect(); return !q.width || (q.left >= r.left - 1 && q.right <= r.right + 1); }) : false;
        return { open: M.classList.contains('open'), h: m?.querySelector('h2')?.textContent, demo: !!d && d.width >= 170, anim: getComputedStyle(document.querySelector('.rd-shunt .ra') || document.body).animationName,
          fit: !!m && m.scrollWidth <= m.clientWidth + 1 && r.right <= innerWidth + 1 && r.left >= -1 && r.top >= 0 && r.bottom <= innerHeight + 1 && kids, tr: /[ğışĞİŞ]/.test(m?.textContent || '') };
      });
      if (['tr-TR', 'en-US', 'de-DE', 'ja-JP'].includes(loc)) await shot(page, 'rule-shunt-' + loc.slice(0, 2));
      errs.push(...errors); await ctx.close();
    }
    const bad = Object.entries(res).filter(([l, v]) => !v.open || !v.demo || v.anim !== 'rdsA' || !v.fit || (l !== 'tr-TR' && v.tr));
    check('rule.shunt.card', `M${XL + 1} ilk girişte kural kartı (animasyonlu, 9 dil), 320×568 px'te taşmaz, Türkçe dışında Türkçe harf yok`, !bad.length && /Manevra karosu/.test(res['tr-TR'].h) && /Shunt tile/.test(res['en-US'].h), JSON.stringify(bad.length ? bad : res['tr-TR']), 'medium');
  }

  // ---------- d) oyun: seçim, takas, bırakma, hamle, geri al, kayıt, ipucu, robot ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { vp: [320, 640], save: { played: A - 1, level: A, stars: starsUpTo(A), seen: { ...seenTo(XL), [XL]: 1 }, remindAsked: true, bst: { geri: 2 }, hints: 3 } });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    const st = () => page.evaluate(() => { const G = window.__ray.G; return { c: G.shunt.map(i => G.cur[i]), sel: G.shSel ?? -1, m: G.moves, all: G.cur.join(), hist: G.hist?.length || 0, fx: G.shunt.filter(i => G.fixed[i]).length }; });
    const cells = await page.evaluate(() => window.__ray.G.shunt.slice());
    const W = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    await shot(page, 'shunt');
    const s0 = await st();
    await tapTile(page, cells[0]); await page.waitForTimeout(150);
    const s1 = await st();   // seçildi, hamle yok, dizilim aynı
    await shot(page, 'shunt-select');
    const toast = await page.evaluate(() => ({ t: document.getElementById('toast').textContent, saved: !!JSON.parse(localStorage.getItem('ray')).shuntTold }));
    await tapTile(page, cells[0]); await page.waitForTimeout(150);
    const s2 = await st();   // aynı karo: seçim bırakıldı
    await tapTile(page, cells[0]); await page.waitForTimeout(100); await tapTile(page, cells[1]); await page.waitForTimeout(120);
    const s3 = await st();   // takas: 1 hamle
    await shot(page, 'shunt-swap');
    await page.waitForTimeout(300);
    await tapTile(page, cells[1]); await page.waitForTimeout(100); await tapTile(page, cells[2]); await page.waitForTimeout(400);
    const s4 = await st();   // ikinci takas: ayrı hamle
    const sw = (c, a, b) => { const d = c.slice(); [d[a], d[b]] = [d[b], d[a]]; return d.join(); };
    const okSel = s1.sel === cells[0] && s1.m === s0.m && s1.all === s0.all && s1.hist === s0.hist;
    const okOff = s2.sel === -1 && s2.m === s0.m && s2.all === s0.all;
    const okSw = s3.sel === -1 && s3.m === s0.m + 1 && s3.c.join() === sw(s0.c, 0, 1) && s3.all.split(',').every((v, i) => cells.includes(i) || v === s0.all.split(',')[i]);
    const okSw2 = s4.m === s0.m + 2 && s4.c.join() === sw(s3.c.map(String), 1, 2);
    check('rule.shunt.tap', `Bölüm ${A}: ${cells.length} ⇄ karo; dokunuş seçer (hamle yok, dizilim aynı), aynı karoya yeniden dokunuş bırakır, başka ⇄ karoya dokunuş ikisini yer değiştirir (yönler aynı, öbür karolar aynı, 1 hamle), ikinci takas ayrı hamle; ilk seçimde bir kez bildirim`,
      cells.length === 3 && okSel && okOff && okSw && okSw2 && /Manevra/.test(toast.t) && toast.saved && W, JSON.stringify({ okSel, okOff, okSw, okSw2, s0: s0.c, s1: [s1.sel, s1.m], s2: [s2.sel, s2.m], s3: s3.c, s4: s4.c, toast, W }));
    // geri al: son takas geri gelir, seçim bırakılır
    await tapTile(page, cells[0]); await page.waitForTimeout(100);   // bir karo seçili dururken
    await page.click('#gUndo'); await page.waitForTimeout(300);
    const s5 = await st();
    check('rule.shunt.undo', 'Manevra: ↶ geri al son takası (ve hamleyi) geri getirir, seçimi bırakır', s5.c.join() === s0.c.join() && s5.m === s0.m && s5.sel === -1, JSON.stringify({ s5: [s5.c, s5.m, s5.sel], s0: s0.c }));
    // kayıt: yarım oyun aynı dizilimle sürer (seçim kaydedilmez)
    await tapTile(page, cells[0]); await page.waitForTimeout(100); await tapTile(page, cells[2]); await page.waitForTimeout(300);
    const b0 = await st();
    await page.reload(); await page.waitForTimeout(400); await page.click('#bPlay'); await page.waitForTimeout(600);
    const b1 = await st();
    check('rule.shunt.resume', 'Manevra: yarım kalan bölüm aynı dizilim ve hamleyle sürer', b0.all === b1.all && b0.m === b1.m && b1.sel === -1, JSON.stringify({ same: b0.all === b1.all, m: [b0.m, b1.m] }), 'medium');
    // ipucu: öbür karolar çözülmüşken 💡 → bir takas yapılır, yerine oturan karo(lar) sabitlenir; robot kalanını bitirir
    await page.evaluate(Q => { const G = window.__ray.G; G.cur.forEach((v, i) => { if (!Q.includes(i)) G.cur[i] = G.sol[i]; }); }, cells);
    const h0 = await st();
    await page.click('#bHint'); await page.waitForTimeout(150);
    const h1 = await page.evaluate(() => { const G = window.__ray.G; return { c: G.shunt.map(i => G.cur[i]), fx: G.shunt.filter(i => G.fixed[i] && G.cur[i] === G.sol[i]).length, bad: G.shunt.filter(i => G.fixed[i] && G.cur[i] !== G.sol[i]).length }; });
    await shot(page, 'shunt-hint');
    const diff = h1.c.filter((v, k) => v !== h0.c[k]).length;
    const taps = await solve(page, 15); const won = await waitModal(page);
    check('rule.shunt.hint', 'Manevra: ipucu bir takas yapar (iki karo yer değiştirir), yerine oturan karoyu sabitler; robot kalanını bitirir', diff === 2 && h1.fx >= 1 && h1.bad === 0 && won, JSON.stringify({ diff, h1, taps, won }));
    errs.push(...errors); await ctx.close();
  }
  {
    // robot hat başında kazanır (en az hamle: par)
    const { ctx, page, errors } = await open(browser, URL, { save: { played: A - 1, level: A, stars: starsUpTo(A), seen: { ...seenTo(XL), [XL]: 1 }, remindAsked: true, shuntTold: 1 } });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    const taps = await solve(page, 12); const won = await waitModal(page);
    const r = await page.evaluate(() => { const G = window.__ray.G; return { won: G.won, moves: G.moves, par: G.par, lim: G.lim.m }; });
    await shot(page, 'shunt-won');
    check('rule.shunt.play', `Bölüm ${A}: robot kazanır, hamle = par (takas başına 1 hamle; ${taps} dokunuş)`, won && r.won && r.moves === r.par && r.moves <= r.lim, JSON.stringify({ taps, ...r }));
    errs.push(...errors); await ctx.close();
  }
  {
    // hattın ortasında (zorluk paylı, 7×9) bir bölüm: robot kazanır
    const L2 = A + 7, { ctx, page, errors } = await open(browser, URL, { save: { played: L2 - 1, level: L2, stars: starsUpTo(L2), seen: { ...seenTo(XL), [XL]: 1 }, remindAsked: true, shuntTold: 1 } });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    const info = await page.evaluate(() => { const G = window.__ray.G; return { k: G.shunt?.length, size: G.cols + 'x' + G.rows }; });
    await shot(page, 'shunt-mid');
    await solve(page, 8); const won = await waitModal(page);
    check('rule.shunt.mid', `Bölüm ${L2}: ${info.k} ⇄ karo (${info.size}); robot kazanır`, info.k === 5 && info.size === '7x9' && won, JSON.stringify({ ...info, won }));
    errs.push(...errors); await ctx.close();
  }
  {
    // karanlık tünel + manevra (karma): robot ışığı izleyerek kazanır
    const pg = await open(browser, URL, { save: { played: 9 } });
    const f = await pg.page.evaluate(() => { const R = window.__ray; for (let l = R.lineStart(R.RULE_LINE.shunt + 1); l < 20000; l++) { const U = R.rulesFor(l); if (U.has('shunt') && U.has('fog')) return l; } return -1; });
    await pg.ctx.close();
    const o = await open(browser, URL, { save: { played: f - 1, level: f, stars: starsUpTo(f), seen: Object.fromEntries(Array.from({ length: 40 }, (_, k) => [k, 1])), remindAsked: true, shuntTold: 1 } });
    await o.page.click('#bPlay'); await o.page.waitForTimeout(800);
    const info = await o.page.evaluate(() => { const G = window.__ray.G; return { fog: !!G.fog, shunt: !!G.shunt, dark: G.shunt?.some(i => !G.seen[i]) }; });
    await shot(o.page, 'shunt-fog');
    await solve(o.page, 8, 80); const won = await waitModal(o.page);
    check('rule.shunt.fog', `Bölüm ${f}: karanlık tünel + manevra; robot ışığı izleyerek kazanır`, f > 0 && info.fog && info.shunt && won, JSON.stringify({ f, ...info, won }));
    errs.push(...o.errors); await o.ctx.close();
  }
  {
    // 4× yavaş CPU, 7×9 hat finali (5 ⇄ karo): seçim + takas animasyonu sırasında kare çizimi ve eklenti kancalarının süresi
    const L7 = AT('shunt', 27), { ctx, page, errors } = await open(browser, URL, { save: { played: L7 - 1, level: L7, stars: starsUpTo(L7), seen: { ...seenTo(XL), [XL]: 1 }, remindAsked: true, shuntTold: 1 } });
    await page.click('#bPlay'); await page.waitForTimeout(600);
    const cells = await page.evaluate(() => {
      const R = window.__ray, G = R.G, m = R.MODS.find(q => q.key === 'shunt'), raf = window.requestAnimationFrame; let hk = 0;
      window.__dt = []; window.__hk = [];
      for (const h of ['xform', 'over']) { const f = m[h]; m[h] = function (D) { const a = performance.now(), r = f.call(this, D); hk += performance.now() - a; return r; }; }
      window.requestAnimationFrame = cb => raf(t => { hk = 0; const a = performance.now(); cb(t); window.__dt.push(performance.now() - a); window.__hk.push(hk); });
      return G.shunt.slice();
    });
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    for (let k = 0; k < 30; k++) { await tapTile(page, cells[k % cells.length]); await page.waitForTimeout(70); }
    await page.waitForTimeout(800);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const r = await page.evaluate(() => {
      const q = (a, p) => { a = a.slice().sort((x, y) => x - y); return +(a[Math.min(a.length - 1, Math.floor(a.length * p))] || 0).toFixed(2); };
      return { n: window.__dt.length, d50: q(window.__dt, .5), d95: q(window.__dt, .95), h50: q(window.__hk, .5), h95: q(window.__hk, .95) };
    });
    check('rule.shunt.perf', `4× yavaş CPU, 7×9 hat finali (${cells.length} ⇄ karo): kare çizimi ortanca < 8 ms, manevra kancaları ortanca < 1 ms`, cells.length === 5 && r.n > 60 && r.d50 < 8 && r.h50 < 1,
      `çizim p50 ${r.d50} · p95 ${r.d95} ms · kancalar p50 ${r.h50} · p95 ${r.h95} ms · ${r.n} kare`, 'medium');
    errs.push(...errors); await ctx.close();
  }
  check('rule.shunt.errors', 'Manevra senaryolarında konsol hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
};
