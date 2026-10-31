// Kapalı durak (RL.closed hattı) — robot testleri (hakem.cjs K bölümü çağırır). Sözleşme: docs/kurallar/README.md · tasarım: docs/kurallar/kapali-durak.md
// Üretim + adillik (prune'suz çapraz sayım), zorluk farkı, eski bölümler bit bit aynı, hat ortalaması, kural kartı, oyun (dokunuş, kayıt, ↺, kazanma, ⊘ damgası),
// ipucu, yakın kazanç uyarısı, gösterilmiş kapalı (engel), karma hat taraması ve karanlık tünelli karma bölüm.
// Eklentisiz tabanın özeti (FNV-1a, JSON): halka testindekiyle aynı değerler → hiç değişmemeli (133/169/208: 31 Ekim hat düzeniyle yenilendi).
const BASE = { l1: 'dukhsf', l29: '1ucs2l5', l77: '1notwly', l133: 's1mvix', l169: 've660k', l208: 'rn02th', '2026-10-01': '1npbt0', '2026-10-27': 'qx5s5f', '2027-03-14': '1s6o7ll' };
const SEEN = Object.fromEntries(Array.from({ length: 30 }, (_, k) => [k + 2, 1]));   // bütün kural kartları görülmüş

module.exports = async T => {
  const { browser, URL, open, check, solve, shot, getSave, tapTile, waitModal, starsUpTo, RL, AT } = T;
  const CL = RL.closed, A = AT('closed');   // kapalı durak hattı · ilk bölümü
  const errs = [], lvlSave = (l, x = {}) => ({ played: l - 1, level: l, stars: starsUpTo(l), seen: SEEN, remindAsked: true, closedTold: 1, ...x });

  // ---------- 1. Üretim, adillik, zorluk farkı ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 1 } });
    const g = await page.evaluate(A => {
      const R = window.__ray, m = R.MODS.find(q => q.key === 'closed'), popc = v => (v & 1) + (v >> 1 & 1) + (v >> 2 & 1) + (v >> 3 & 1);
      const md = (P, a, b) => b < 0 ? 99 : Math.abs(a % P.cols - b % P.cols) + Math.abs((a / P.cols | 0) - (b / P.cols | 0));
      const isSt = (P, i) => i !== P.hub && i !== P.hub2 && popc(P.cur[i]) === 1 && !P.pinned[i] && P.link[i] < 0 && !(P.unitOf?.[i] >= 0);
      // oyuncunun gözünden bütün kapalı kümeler (prune KAPALI: sayım yalnız yaprakta) → tek olmalı ve gerçek küme olmalı
      const sets = P => {
        const st = P.cur.map((_, i) => i).filter(i => isSt(P, i)), keys = new Set(), pr = m.prune; delete m.prune;
        try { R.difficulty(P, cfg => { const z = st.filter(j => !cfg[j]); if (z.length === P.closed && R.lit({ ...P, cur: cfg, void: cfg.map(v => v ? 0 : 1) }).solved) keys.add(z.join()); return keys.size > 1; }, 20000); }
        finally { m.prune = pr; }
        return [...keys];
      };
      const bad = {}, B = k => { bad[k] = (bad[k] || 0) + 1; }, D = {};
      let n = 0, fairN = 0; const t = performance.now();
      for (const [c, r] of [[7, 9], [6, 8]]) for (const K of [1, 2]) {
        let a = 0, b = 0, N = 0;
        for (let s = 1; s <= 150; s++) {
          const seed = s * 7919 + 13, P0 = R.generate(c, r, seed, 0, 0, {}), P = R.generate(c, r, seed, 0, 0, { closed: K }); n++;
          if (P.closed !== K) { B('miktar'); continue; }
          const vd = P.void.map((v, i) => v ? i : -1).filter(i => i >= 0);
          if (vd.length !== K) B('voidSayısı');
          if (vd.some(i => popc(P.cur[i]) !== 1 || P.cur[i] !== P.sol[i])) B('durakDeğil');
          if (vd.some(i => md(P, i, P.hub) < 2 || P.pinned[i] || P.link[i] >= 0 || P.rev[i] || P.cnt[i] >= 0)) B('yer');
          if (K === 2 && Math.max(Math.abs(vd[0] % c - vd[1] % c), Math.abs((vd[0] / c | 0) - (vd[1] / c | 0))) < 2) B('bitişik');
          // çözümde hiçbir ray kapalı karoya bakmaz; kapalı dışındaki her karo bağlı
          if (vd.some(v => [0, 1, 2, 3].some(k => { const j = R.nb(P, v, k); return j >= 0 && (P.sol[j] & [4, 8, 1, 2][k]); }))) B('raBakıyor');
          if (!R.lit({ ...P, cur: P.sol }).solved) B('solÇözülmedi');
          if (R.lit(P).solved) B('hazırÇözülü');
          if (P.reject || P.closedShown) B('ret');
          if (s <= 30) { fairN++; const S = sets(P); if (S.length !== 1 || S[0] !== vd.join()) B('adilDeğil'); }
          a += R.difficulty(P0); b += R.difficulty(P); N++;
        }
        D[`${c}x${r}/${K}`] = +((b - a) / N).toFixed(2);
      }
      const ms = Math.round(performance.now() - t);
      // eski bölümler: kanca çağrılmaz, R() tüketilmez, özet tutar
      const calls = { n: 0 }, wrap = {};
      for (const h of ['mark', 'cands', 'prune', 'after', 'over', 'block']) { wrap[h] = m[h]; m[h] = function (...a) { calls.n++; return wrap[h].apply(this, a); }; }
      let old = 0; for (let l = 1; l < A; l += 3) if (R.puzzleFor(l).closed) old++;
      ['2026-10-01', '2026-10-27'].forEach(d => { if (R.dailyFor(d).closed) old++; });
      Object.assign(m, wrap);
      let zero = 0; for (let s = 1; s <= 40; s++) { const a = R.generate(7, 9, s, 3, 1, { rev: 3, closed: 0 }), b = R.generate(7, 9, s, 3, 1, { rev: 3 }); if (JSON.stringify([a.sol, a.cur]) !== JSON.stringify([b.sol, b.cur]) || a.closed || a.void) zero++; }
      const fnv = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0).toString(36); };
      const sum = P => fnv(JSON.stringify([P.sol, P.cur, P.pinned, P.link, P.rev, P.cnt, P.hub2, P.par, P.taps, P.diff]));
      const hash = {}; for (const l of [1, 29, 77, 133, 169, 208]) hash['l' + l] = sum(R.puzzleFor(l));
      for (const d of ['2026-10-01', '2026-10-27', '2027-03-14']) hash[d] = sum(R.dailyFor(d));
      let early = 0; for (let l = 1; l < A; l++) if (R.rulesFor(l).has('closed')) early++;
      return { n, fairN, bad, D, ms, calls: calls.n, old, zero, hash, early };
    }, A);
    const hashOk = Object.keys(BASE).every(k => g.hash[k] === BASE[k]);
    check('rule.closed.gen', `Kapalı durak: ${g.n} üretimde k kapalı durak (sol = cur, tek kol), çözümde hiçbir ray ona bakmıyor, lit(sol) çözülü; ${g.fairN} bölümde oyuncunun gördüğüyle kapalı küme tek (prune'suz sayım)`,
      g.n === 600 && !Object.keys(g.bad).length, JSON.stringify({ bad: g.bad, ms: g.ms }));
    check('rule.closed.diff', 'Kapalı durak: aynı tohumda zorluk farkı ≥ +1 (7×9 ve 6×8, 1 kapalı; 150 tohum)', g.D['7x9/1'] >= 1 && g.D['6x8/1'] >= 1 && g.D['7x9/2'] >= 1, JSON.stringify(g.D));
    check('rule.closed.old', `Kapalı durak: 1–${A - 1} ve Günün Hattı bit bit aynı (kanca çağrılmıyor, {closed:0} ≡ {}, eklentisiz özet tutuyor)`, !g.calls && !g.old && !g.zero && !g.early && hashOk,
      JSON.stringify({ calls: g.calls, old: g.old, zero: g.zero, early: g.early, hash: hashOk ? 'ok' : g.hash }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- 2. Hat: kapalı durak hattının her bölümünde kapalı durak; ilk 3 bölüm 6×8 ve 1 kapalı; final 2; ortalama zorluk önceki hattan yüksek ----------
  let L7 = 0, LF = 0;
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 1 } });
    const h = await page.evaluate(CL => {
      const R = window.__ray, a = R.lineStart(CL), b = R.lineStart(CL + 1) - 1, avg = (x, y, f) => { let s = 0, c = 0; for (let l = x; l <= y; l++) { const P = R.puzzleFor(l); f?.(l, P); s += P.diff; c++; } return +(s / c).toFixed(2); };
      let miss = 0, shown = 0, gms = 0, L7 = 0; const intro = [];
      const t = performance.now();
      const m16 = avg(a, b, (l, P) => {
        if (!P.closed || !R.rulesFor(l).has('closed')) miss++; if (P.closedShown || P.reject) shown++;
        if (l < a + 3 || l === b) intro.push(`${l}:${P.cols}x${P.rows}/${P.closed}`);
        if (!L7 && l >= a + 3 && P.cols === 7 && P.rules.every(k => ['closed', 'pins', 'pairs', 'rev', 'cnt'].includes(k))) L7 = l;
      });
      gms = (performance.now() - t) / (b - a + 1);
      const m15 = avg(R.lineStart(CL - 1), a - 1);
      let LF = 0; for (let l = a; l < 20000 && !LF; l++) { const U = R.rulesFor(l); if (U.has('closed') && U.has('fog')) LF = l; }
      return { a, b, m16, m15, miss, shown, intro, genMs: Math.round(gms), L7, LF };
    }, CL);
    L7 = h.L7; LF = h.LF;
    const introOk = h.intro.length === 4 && h.intro.slice(0, 3).every(s => /:6x8\/1$/.test(s)) && /:7x9\/2$/.test(h.intro[3]);
    check('rule.closed.line', `Kapalı durak: M${CL + 1} (${h.a}–${h.b}) her bölümde var; ilk 3 bölüm 6×8 ve 1 kapalı, final 7×9 ve 2 kapalı; ortalama zorluk önceki hattan yüksek`,
      h.a === A && !h.miss && !h.shown && introOk && h.m16 > h.m15, JSON.stringify(h));
    errs.push(...errors); await ctx.close();
  }

  // ---------- 3. Oyun: kural kartı, ilk dokunuş bildirimi, kapalı durak döner ve hamle sayar, yarım kayıt, ↺, kazanma, ⊘ damgası ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: A - 1, level: A, stars: starsUpTo(A), seen: Object.fromEntries(Object.values(RL).filter(c => c < CL).map(c => [c, 1])), remindAsked: true } });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    const card = await page.evaluate(() => ({ open: document.getElementById('modal').classList.contains('open'), txt: document.querySelector('.sheet h2')?.textContent, p: document.querySelector('.sheet p')?.textContent, demo: !!document.querySelector('.rd-closed .rd-cl-h u svg'), icon: !!document.querySelector('.sheet p .rd-closed-i'), words: (document.querySelector('.sheet p')?.textContent || '').trim().split(/\s+/).length }));
    await page.waitForTimeout(3600); await shot(page, 'rule-closed');
    if (card.open) await page.click('#mGo');
    await page.waitForTimeout(400);
    await page.evaluate(() => { const t = document.getElementById('toast'); window.__toasts = []; new MutationObserver(() => window.__toasts.push(t.textContent)).observe(t, { childList: true, characterData: true, subtree: true }); });
    const g0 = await page.evaluate(() => { const G = window.__ray.G, v = G.void.indexOf(1); return { size: G.cols + 'x' + G.rows, closed: G.closed, v, cur: G.cur[v], seen: JSON.parse(localStorage.getItem('ray')).seen?.[window.__ray.RULE_LINE.closed] }; });
    await shot(page, 'closed');
    await tapTile(page, g0.v); await page.waitForTimeout(300);
    const st = () => page.evaluate(v => { const G = window.__ray.G; return { cur: G.cur[v], moves: G.moves, lit: G.L.d[v] >= 0 }; }, g0.v);
    const s1 = await st(), told = (await getSave(page)).closedTold, toasts = await page.evaluate(() => window.__toasts);
    await page.reload(); await page.waitForTimeout(400); await page.click('#bPlay'); await page.waitForTimeout(600);
    const s2 = await st();
    await page.click('#bReset'); await page.waitForTimeout(400); const s3 = await st();
    const taps = await solve(page, 8), won = await waitModal(page);
    await page.waitForTimeout(200);
    const g2 = await page.evaluate(v => { const G = window.__ray.G; return { won: G.won, stamp: !!G.clWin, voidLit: G.L.d[v] >= 0 }; }, g0.v);
    await shot(page, 'closed-win');
    check('rule.closed.card', `M${CL + 1} ilk girişte "YENİ KURAL · Kapalı durak" kartı (animasyonlu demo, satır içi ⊘ simgesi, ≤ 30 kelime)`, card.open && /Kapalı durak/.test(card.txt || '') && /kapalı/.test(card.p || '') && card.demo && card.icon && card.words <= 30 && g0.seen === 1, JSON.stringify(card));
    check('rule.closed.play', `Kapalı durak: ${A} 6×8, 1 kapalı; ona dokununca döner, hamle sayar, hiç yanmaz; ilk dokunuşta "⊘ 1 durak kapalı" bildirimi; yarım kayıt ve ↺ çalışır; robot kazanır, ⊘ damgası iner`,
      g0.size === '6x8' && g0.closed === 1 && s1.cur !== g0.cur && s1.moves === 1 && !s1.lit && told === 1 && toasts.some(s => /⊘ 1 durak kapalı/.test(s)) &&
      s2.cur === s1.cur && s2.moves === 1 && s3.cur === g0.cur && s3.moves === 0 && won && g2.won && g2.stamp && !g2.voidLit, JSON.stringify({ g0, s1, s2, s3, taps, won, g2 }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- 4. İpucu kapalı durağa verilmez; yakın kazanç uyarısı; gösterilmiş kapalı dönmez ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: lvlSave(L7, { hints: 3 }) });
    await page.click('#bPlay'); await page.waitForTimeout(600);
    const h = await page.evaluate(() => {
      const R = window.__ray, G = R.G, v = G.void.indexOf(1);
      // kapalı durak çevrilmiş, bir açık karo yanlış → ipucu açık karoyu düzeltir, kapalıya dokunmaz
      const w = G.cur.findIndex((x, i) => !G.void[i] && i !== G.hub && !G.pinned[i] && G.link[i] < 0 && !G.rev[i] && G.cnt[i] < 0 && !(G.unitOf?.[i] >= 0) && R.rot(G.sol[i]) !== G.sol[i]);
      G.cur = G.sol.slice(); G.cur[v] = R.rot(G.sol[v]); G.cur[w] = R.rot(G.sol[w]); G.L = R.lit(G);
      return { v, w, cv: G.cur[v] };
    });
    await page.click('#bHint'); const won = await waitModal(page);
    const h2 = await page.evaluate(({ v, w }) => { const G = window.__ray.G; return { fixedW: G.fixed[w], fixedV: G.fixed[v], cv: G.cur[v], won: G.won }; }, h);
    check('rule.closed.hint', `Kapalı durak (bölüm ${L7}, 7×9): ipucu yanlış açık karoyu oturtup sabitler, kapalı durağa dokunmaz (çevrik kalsa da bölüm biter)`, h.w >= 0 && h2.fixedW && !h2.fixedV && h2.cv === h.cv && won && h2.won, JSON.stringify({ h, h2, won }));
    errs.push(...errors); await ctx.close();
  }
  {
    const { ctx, page, errors } = await open(browser, URL, { save: lvlSave(L7) });
    await page.click('#bPlay'); await page.waitForTimeout(600);
    const r = await page.evaluate(() => {
      const R = window.__ray, G = R.G, m = R.MODS.find(q => q.key === 'closed'), v = G.void.indexOf(1), out = {};
      const el = document.getElementById('toast'); window.__toasts = []; new MutationObserver(() => window.__toasts.push(el.textContent)).observe(el, { childList: true, characterData: true, subtree: true });
      // hepsi bağlı, bir komşu ray kapalı durağa bakıyor (yapay maske): kazanılmaz, bir kez uyarı
      const k = [0, 1, 2, 3].find(k => R.nb(G, v, k) >= 0), j = R.nb(G, v, k);
      G.cur = G.sol.slice(); G.cur[j] |= [4, 8, 1, 2][k]; G.L = R.lit(G);
      out.lit = G.L.n === G.cur.length; out.solved = G.L.solved;
      m.after(G, j, performance.now()); m.after(G, j, performance.now());
      // gösterilmiş kapalı (adil olmayan aday seçilirse): dokunuş engellenir
      out.block = m.block({ ...G, closedShown: G.void }, v); out.free = m.block(G, v);
      return { ...out, v };
    });
    await page.waitForTimeout(300);
    const t = await page.evaluate(() => window.__toasts);
    check('rule.closed.warn', 'Kapalı durak: her şey bağlı ama bir ray kapalı durağa bakıyorsa kazanılmaz, "Kapalı durağa ray bağlanmaz" bir kez; baştan gösterilen kapalı dönmez',
      r.lit && !r.solved && t.filter(s => /Kapalı durağa ray bağlanmaz/.test(s)).length === 1 && /Kapalı durak/.test(r.block) && !r.free, JSON.stringify({ r, t }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- 5. Karma: ≥ 300 bölüm (rulesFor) hepsi üretiliyor, çözüm geçerli, adil; çakışma tanımı; karanlık tünelli bölümü robot kazanır ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 1 } });
    const s = await page.evaluate(A => {
      const R = window.__ray, keys = R.MODS.map(m => m.key), cl = R.MODS.find(m => m.key === 'closed').clash;
      let n = 0, miss = 0, solBad = 0, rej = 0, clash = 0; const co = {};
      for (let l = A; n < 320 && l < 12000; l++) {
        const U = R.rulesFor(l); if (!U.has('closed')) continue; n++;
        if ([...U].some(k => cl.includes(k))) clash++;
        const P = R.puzzleFor(l); if (!P.closed) miss++; if (!R.lit({ ...P, cur: P.sol }).solved || R.lit(P).solved) solBad++; if (P.reject || P.closedShown) rej++;
        for (const r of U) if (r !== 'closed') co[r] = (co[r] || 0) + 1;
      }
      return { n, miss, solBad, rej, clash, co, others: Object.keys(co).length, keys };
    }, A);
    check('rule.closed.mix', `Kapalı durak: ${A} sonrası 320 bölümde (rulesFor) hepsi üretiliyor, çözüm geçerli, ret yok, çakışan kural yok; öteki kurallarla karışıyor`,
      s.n === 320 && !s.miss && !s.solBad && !s.rej && !s.clash && s.others >= 8, JSON.stringify(s));
    errs.push(...errors); await ctx.close();
  }
  {
    const { ctx, page, errors } = await open(browser, URL, { save: lvlSave(LF) });
    await page.click('#bPlay'); await page.waitForTimeout(600);
    const m0 = await page.evaluate(() => { const G = window.__ray.G; return { closed: G.closed, fog: G.fog, rules: G.rules, dark: G.seen.filter(v => !v).length }; });
    await shot(page, 'closed-fog');
    const taps = await solve(page, 8), won = await waitModal(page);
    check('rule.closed.fog', `Kapalı durak + karanlık tünel (bölüm ${LF}): ışığı izleyen çözüm kazanır`, LF && m0.closed && m0.fog && m0.dark > 5 && won, JSON.stringify({ LF, ...m0, taps, won }));
    errs.push(...errors); await ctx.close();
  }

  check('rule.closed.errors', 'Kapalı durak senaryolarında konsol hatası yok', !errs.length, errs.join(' | '));
};
