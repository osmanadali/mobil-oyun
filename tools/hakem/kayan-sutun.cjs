// ↕ Kayan sütun (column) — hakem.cjs K bölümü çağırır. Ayrıntı: docs/kurallar/kayan-sutun.md
// Üretim (dikey birim, tek doğru konum, öteki eklentilerle), kayan sırayla aynı bölümde gelmez, eski bölümler bit bit aynı,
// hat ve merdiven, kural kartı (320 px), oyun (dokununca sütun aşağı kayar, robot çözer), karanlık tünel.
module.exports = async T => {
  const { browser, URL, open, check, solve, shot, tapTile, waitModal, starsUpTo, RL, AT, seenTo } = T;
  const errs = [], CL = RL.column, A = AT('column');
  const NO_COL = `window.RAY_RULES = []; { const push = window.RAY_RULES.push.bind(window.RAY_RULES); window.RAY_RULES.push = f => push(api => { const m = f(api); return m?.key === 'column' ? null : m; }); }`;

  // ---------- a) üretim ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 9 } });
    const g = await page.evaluate(CL => {
      const R = window.__ray, o = { n: 0, none: 0, shape: 0, bad: 0, pre: 0, solve: 0, unique: 0, slideMix: 0, ms: 0 };
      const me = R.MODS.find(m => m.key === 'column'), keys = R.MODS.map(m => m.key).filter(k => k !== 'column' && !me.clash.includes(k));
      const t0 = performance.now();
      for (const [c, r] of [[6, 8], [7, 9]]) for (const x of [{}, { two: true }, { fog: true, rev: 3, cnt: 3 }, ...keys.map(k => ({ [k]: 2 }))]) for (let s = 1; s <= 8; s++) {
        const P = R.generate(c, r, s * 7919 + 101, 0, s % 3 || Object.keys(x).some(k => keys.includes(k)) ? 0 : 2, { ...x, column: 1 }); o.n++;   // eşli karo yalnız eklentisiz karışımda (bölümde en çok 2 kural)
        if (!R.lit({ ...P, cur: P.sol }).solved) o.bad++;
        if (R.lit(P).solved) o.pre++;
        if (!P.column) { o.none++; continue; }
        const col = P.column, x0 = col[0] % c, U = P.units[P.unitOf[col[0]]];
        // dikey: bir sütunun bütün karoları, yukarıdan aşağı; merkez yok; birim K = satır sayısı
        if (col.length !== r || col.some((q, k) => q !== k * c + x0) || col.some(q => q === P.hub || q === P.hub2) || U.K !== r || U.kind !== 'column') o.shape++;
        // dokunuş: her karo bir alta, en alttaki başa (yönler değişmez); K dokunuşta başa döner; tek doğru konum
        const cur = P.cur.slice(), v = col.map(q => cur[q]); U.tap(cur);
        if (col.some((q, k) => cur[q] !== v[(k + r - 1) % r])) o.shape++;
        const t = R.unitTaps(U, P.cur, P.sol); if (t < 1 || t > r - 1) o.solve++;
        const w = P.cur.slice(); let hits = 0; for (let k = 0; k < r; k++) { if (col.every(q => w[q] === P.sol[q])) hits++; U.tap(w); } if (hits !== 1) o.unique++;
      }
      o.ms = Math.round(performance.now() - t0);
      // kayan sıra ile hiçbir bölümde birlikte değil (karma dahil)
      for (let l = R.lineStart(CL); l < R.lineStart(CL) + 600; l++) { const U = R.rulesFor(l); if (U.has('column') && U.has('slide')) o.slideMix++; }
      // hat ve merdiven
      const a = R.lineStart(CL), z = R.lineStart(CL + 1); let early = 0, own = 0;
      for (let l = 1; l < a; l++) if (R.rulesFor(l).has('column')) early++;
      for (let l = a; l < z; l++) if (R.puzzleFor(l).column) own++;
      const avg = c => { let d = 0; const a = R.lineStart(c), z = R.lineStart(c + 1); for (let l = a; l < z; l++) d += R.puzzleFor(l).diff; return +(d / (z - a)).toFixed(1); };
      // karma: sütunlu bölüm de gelir
      let km = 0; for (let l = z; l < z + 280; l++) if (R.rulesFor(l).has('column')) km++;
      o.line = { early, own, len: z - a, km, size: [a, a + 1, a + 2, a + 3].map(l => R.sizeFor(l).join('x')).join(' '), ladder: [avg(CL - 1), avg(CL)] };
      return o;
    }, CL);
    check('rule.column.gen', `Kayan sütun: ${g.n} tohum (6×8 · 7×9, uyumlu her eklentiyle) → bir sütunun bütün karoları (merkezsiz), dokununca aşağı kayar, ${'1…satır−1'} dokunuşta hizalanır, tek doğru konum, çözüm geçerli, çözülmüş gelmez`,
      g.none === 0 && g.shape === 0 && g.bad === 0 && g.pre === 0 && g.solve === 0 && g.unique === 0, JSON.stringify({ ...g, line: undefined }));
    check('rule.column.clash', 'Kayan sütun ve kayan sıra hiçbir bölümde birlikte gelmez (600 bölüm, karma dahil)', g.slideMix === 0, String(g.slideMix));
    check('rule.column.line', `M${CL + 1} (${A}. bölümden): önceki bölümlerde yok, hattın her bölümünde var, ilk 3 bölüm 6×8, karmada da gelir; merdiven M${CL} ${g.line.ladder[0]} < M${CL + 1} ${g.line.ladder[1]}`,
      g.line.early === 0 && g.line.own === g.line.len && g.line.km >= 5 && g.line.size === '6x8 6x8 6x8 7x9' && g.line.ladder[0] < g.line.ladder[1], JSON.stringify(g.line));
    errs.push(...errors); await ctx.close();
  }

  // ---------- b) eski bölümler ----------
  {
    const sig = page => page.evaluate(a => {
      const R = window.__ray, h = s => { let x = 2166136261; for (const c of s) x = Math.imul(x ^ c.charCodeAt(0), 16777619); return (x >>> 0).toString(36); };
      let lv = ''; for (let l = 1; l < a; l += 5) { const P = R.puzzleFor(l); lv += P.sol.join('') + P.cur.join('') + P.diff; }
      return { lv: h(lv), d: h(['2026-10-27', '2027-03-14', '2026-11-08'].map(d => R.dailyBase(d).cur.join('')).join()) };
    }, A);
    const PA = await open(browser, URL, { save: { played: 1 } }), PB = await open(browser, URL, { save: { played: 1 }, init: NO_COL });
    const sa = await sig(PA.page), sb = await sig(PB.page);
    check('rule.column.old', `Kayan sütun eklentisi çıkarılınca 1–${A - 1}. bölümler ve Günün Hattı aynı`, sa.lv === sb.lv && sa.d === sb.d, JSON.stringify({ sa, sb }));
    errs.push(...PA.errors, ...PB.errors); await PA.ctx.close(); await PB.ctx.close();
  }

  // ---------- c) oyun: kural kartı (320 px), dokununca sütun aşağı kayar, robot çözer ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { vp: [320, 640], save: { played: A - 1, level: A, stars: starsUpTo(A), seen: seenTo(CL), remindAsked: true } });
    await page.click('#bPlay'); await page.waitForTimeout(800);
    const card = await page.evaluate(() => { const m = document.querySelector('#modal .sheet'); return { open: document.getElementById('modal').classList.contains('open'), txt: m?.querySelector('h2')?.textContent, demo: !!document.querySelector('.rd-column i'), anim: getComputedStyle(document.querySelector('.rd-column i') || document.body).animationName, fit: m ? m.scrollWidth <= m.clientWidth + 1 && m.getBoundingClientRect().right <= innerWidth + 1 && m.getBoundingClientRect().top >= 0 : false }; });
    await shot(page, 'rule-column');
    if (card.open) await page.click('#mGo'); await page.waitForTimeout(500);
    const col = await page.evaluate(() => window.__ray.G.column), get = () => page.evaluate(c => c.map(q => window.__ray.G.cur[q]), col);
    const v0 = await get(), m0 = await page.evaluate(() => window.__ray.G.moves);
    await tapTile(page, col[2]); await page.waitForTimeout(80); await shot(page, 'column');
    await tapTile(page, col[0]); await page.waitForTimeout(250);
    const v2 = await get(), m2 = await page.evaluate(() => window.__ray.G.moves), W = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    const r = v0.length, ok = v2.every((v, k) => v === v0[(k + 2 * r - 2) % r]);
    const taps = await solve(page, 12); const won = await waitModal(page);
    check('rule.column.card', `M${CL + 1} ilk girişte "YENİ KURAL · Kayan sütun" kartı (animasyonlu), 320 px'te taşmaz`, card.open && /Kayan sütun/.test(card.txt || '') && card.demo && card.anim === 'slideD' && card.fit, JSON.stringify(card), 'medium');
    check('rule.column.play', `Bölüm ${A}: sütuna iki dokunuş → iki kare aşağı kayar, yönler değişmez, art arda aynı sütun 1 hamle; robot çözer; 320 px'te yatay taşma yok`,
      ok && m2 - m0 === 1 && won && W, JSON.stringify({ col, v0, v2, m0, m2, taps, won, W }));
    errs.push(...errors); await ctx.close();
  }
  {
    // karanlık tünel + kayan sütun (karma): sütunun bir karosu aydınlanınca bütün sütun görünür; robot ışığı izleyerek kazanır
    const pg = await open(browser, URL, { save: { played: 9 } });
    const f = await pg.page.evaluate(() => { const R = window.__ray; for (let l = R.lineStart(R.RULE_LINE.column + 1); l < 20000; l++) { const U = R.rulesFor(l); if (U.has('column') && U.has('fog')) return l; } return -1; });
    await pg.ctx.close();
    const o = await open(browser, URL, { save: { played: f - 1, level: f, stars: starsUpTo(f), seen: Object.fromEntries(Array.from({ length: 40 }, (_, k) => [k, 1])), remindAsked: true } });
    await o.page.click('#bPlay'); await o.page.waitForTimeout(800);
    const info = await o.page.evaluate(() => { const G = window.__ray.G; const s = G.column?.map(q => G.seen[q]) || []; return { fog: !!G.fog, column: !!G.column, same: s.every(v => v === s[0]) }; });
    await solve(o.page, 8, 80); const won = await waitModal(o.page);
    check('rule.column.fog', `Bölüm ${f}: karanlık tünel + kayan sütun; sütun bütün olarak aydınlanır, robot ışığı izleyerek kazanır`, f > 0 && info.fog && info.column && info.same && won, JSON.stringify({ f, ...info, won }));
    errs.push(...o.errors); await o.ctx.close();
  }
  check('rule.column.errors', 'Kayan sütun senaryolarında konsol hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
};
