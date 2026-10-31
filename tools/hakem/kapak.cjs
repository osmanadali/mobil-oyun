// Kapak (RL.cover hattı) — robot testleri (hakem.cjs K bölümü çağırır). Sözleşme: docs/kurallar/README.md · tasarım: docs/kurallar/kapak.md
// Üretim + adillik (bağımsız sayım), eski bölümler bit bit aynı, zorluk farkı, hat ortalaması, kural kartı, dokunuş engeli, kazanma,
// ipucu, ↺ baştan, yarım oyun, karma hatlar (≥ 300 bölüm), çakışma (karanlık tünel).
const SEEN = Object.fromEntries(Array.from({ length: 30 }, (_, k) => [k + 2, 1]));   // bütün kural kartları görülmüş
// kapak hattından önceki bölümlerin ve 40 Günün Hattı'nın parmak izi (FNV-1a, JSON). Kapak yalnız kendi hattından başlar → değişmemeli.
const FP = { old: '1twxbdu', day: '109kff2' };   // old: mola (28 Ekim), kısa bölüm (31 Ekim) ve hat düzeni (31 Ekim: 28 bölüm tavanı, yeni kural sırası) ile yenilendi

module.exports = async T => {
  const { browser, URL, open, check, solve, shot, getSave, tapTile, waitModal, starsUpTo, RL, LS, LE, AT } = T;
  const C = RL.cover, A = AT('cover'), Z = LE(C);
  const errs = [];

  // ---------- 1. Üretim, adillik, eski bölümler, zorluk ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 1 } });
    const g = await page.evaluate(([FP, C]) => {
      const R = window.__ray, popc = m => (m & 1) + (m >> 1 & 1) + (m >> 2 & 1) + (m >> 3 & 1), cols = P => P.cols;
      const md = (c, i, j) => j < 0 ? 99 : Math.abs(i % c - j % c) + Math.abs((i / c | 0) - (j / c | 0));
      const keys = R.MODS.map(m => m.key), mixes = [[0, 0, {}], [6, 0, {}], [0, 3, {}], [0, 0, { rev: 6, cnt: 5 }], [0, 0, { two: true }], [4, 2, { rev: 4, cnt: 3, two: true }]];
      for (const k of ['sw', 'bridge', 'sign', 'table', 'ring', 'portal']) if (keys.includes(k)) mixes.push([0, 0, { [k]: 2 }]);
      const bad = {}, B = k => { bad[k] = (bad[k] || 0) + 1; };
      let n = 0, fairN = 0; const t0 = performance.now();
      for (const [c, r] of [[6, 8], [7, 9]]) for (const [pins, pairs, x0] of mixes) for (let s = 1; s <= 25; s++) {
        const amt = 1 + s % 3, P = R.generate(c, r, s * 7919 + 31, pins, pairs, { ...x0, cover: amt }); n++;
        if (!P.cover) { B('kapakYok'); continue; }
        const I = P.cover.flatMap((v, i) => v ? [i] : []);
        if (I.length !== amt) B('sayı');
        if (!R.lit({ ...P, cur: P.sol }).solved) B('solÇözülmedi');
        if (R.lit(P).solved) B('hazırÇözülü');
        for (const i of I) {
          if (P.cover[i] !== P.sol[i] || P.cur[i] !== P.sol[i] || !P.self?.[i]) B('kapakYanlış');
          if (popc(P.sol[i]) < 2 || popc(P.sol[i]) > 3 || md(c, i, P.hub) < 2 || md(c, i, P.hub2) < 2) B('kapakYeri');
          if (P.pinned[i] || P.link[i] >= 0 || P.rev[i] || P.cnt[i] >= 0 || (P.unitOf?.[i] ?? -1) >= 0 || P.bridge?.includes(i) || P.portal?.some(p => p.a === i || p.b === i)) B('kapakÇıplakDeğil');
          if ([0, 1, 2, 3].some(k => { const j = R.nb(P, i, k); return j >= 0 && P.cover[j]; })) B('bitişik');
        }
        // adillik, bağımsız sayım: kapak bilinmeden (15 maske) bütün çözümler; hepsinde kapak maskeleri gerçek olmalı
        const Q = { ...P, cover: null }, seen = new Set(); let sols = 0;
        const sc = R.difficulty(P, cfg => { if (R.lit({ ...Q, cur: cfg }).solved) { sols++; seen.add(I.map(i => cfg[i]).join()); } return false; }, 20000);
        if (sc >= 60000 || seen.size !== 1 || [...seen][0] !== I.map(i => P.sol[i]).join()) B('adilDeğil'); else fairN++;
        // kapaklı bölümün zorluk puanı tutarlı: gerçek maskeyle çözüm bulunur
        if (!(R.difficulty(P) < 600)) B('puan');
      }
      const ms = Math.round(performance.now() - t0);
      // {cover: 0} ≡ {}: R() tüketilmez, alan eklenmez
      let zero = 0; for (let s = 1; s <= 40; s++) { const a = R.generate(7, 9, s, 3, 1, { rev: 3, cover: 0 }), b = R.generate(7, 9, s, 3, 1, { rev: 3 }); if (a.cover || JSON.stringify(a) !== JSON.stringify(b)) zero++; }
      // eski bölümler: kancalar kapak hattından önce hiç çağrılmaz; parmak izi kapaksız ölçümle aynı
      const m = R.MODS.find(q => q.key === 'cover'), calls = { n: 0 }, wrap = {};
      for (const h of ['mark', 'cands', 'check', 'amount']) { wrap[h] = m[h]; m[h] = function (...a) { calls.n++; return wrap[h].apply(this, a); }; }
      const H = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0).toString(36); };
      const pz = P => JSON.stringify([P.sol, P.cur, P.pinned, P.link, P.rev, P.cnt, P.hub2, P.par, P.taps, P.diff, P.units?.map(u => u.cells), P.sw, P.rules]);
      let fp = '', early = 0; for (let l = 1; l < R.lineStart(C); l++) { const P = R.puzzleFor(l); fp = H(fp + pz(P)); if (P.cover || R.rulesFor(l).has('cover')) early++; }
      const days = []; for (let k = 0; k < 40; k++) days.push(new Date(Date.UTC(2026, 0, 1) + k * 9 * 864e5).toISOString().slice(0, 10));
      const day = H(days.map(d => pz(R.dailyFor(d))).join());
      Object.assign(m, wrap);
      // zorluk: aynı tohum ve boyut, kural kapalı → açık (2 kapak)
      const dd = {}; for (const [c, r] of [[7, 9], [6, 8]]) { let a = 0, b = 0; for (let s = 0; s < 150; s++) { const seed = s * 7919 + 17; a += R.difficulty(R.generate(c, r, seed, 0, 0, {})); b += R.difficulty(R.generate(c, r, seed, 0, 0, { cover: 2 })); } dd[c + 'x' + r] = +((b - a) / 150).toFixed(2); }
      // hat: kapak hattının her bölümünde kapak; ilk 3 bölüm 6×8 ve 1 kapak; ortalama zorluk önceki hattan ≥ 1 yüksek
      const avg = ln => { let d = 0; const a = R.lineStart(ln), z = R.lineStart(ln + 1) - 1; for (let l = a; l <= z; l++) d += R.puzzleFor(l).diff; return +(d / (z - a + 1)).toFixed(2); };
      let own = 0, miss = 0; const intro = [], t1 = performance.now();
      const a0 = R.lineStart(C), z0 = R.lineStart(C + 1) - 1;
      for (let l = a0; l <= z0; l++) { const P = R.puzzleFor(l); if (R.rulesFor(l).has('cover')) own++; if (!P.cover || !R.lit({ ...P, cur: P.sol }).solved) miss++; if (l <= a0 + 3) intro.push(`${l}:${P.cols}x${P.rows}/${P.cover?.filter(Boolean).length}`); }
      const genMs = Math.round((performance.now() - t1) / (z0 - a0 + 1));
      return { n, bad, fairN, ms, zero, calls: calls.n, fp, day, early, dd, own, miss, intro, genMs, m9: avg(C - 1), m10: avg(C), len: z0 - a0 + 1, clash: m.clash };
    }, [FP, C]);
    check('rule.cover.gen', `Kapak: ${g.n} üretimde (sabit, eşli, ters, sayaçlı, iki merkez, öteki eklentiler) lit(sol) çözülü, kapak sayısı tam, kapak çözüm yönünde sabit, 2–3 kollu, merkezden ≥ 2, çıplak, bitişik değil`, g.n >= 500 && !Object.keys(g.bad).filter(k => k !== 'adilDeğil').length, JSON.stringify({ n: g.n, bad: g.bad, ms: g.ms }));
    check('rule.cover.fair', 'Kapak adil: kapak bilinmeden bulunan bütün çözümlerde kapak maskeleri gerçek maskeyle aynı (bağımsız sayım, tavan 20000)', g.fairN === g.n, `${g.fairN}/${g.n}`);
    check('rule.cover.old', `Kapak: 1–${A - 1} ve Günün Hattı bit bit aynı (kanca çağrılmıyor, {cover:0} ≡ {}, kapaksız parmak izi tutuyor)`, !g.calls && !g.zero && !g.early && g.fp === FP.old && g.day === FP.day, JSON.stringify({ calls: g.calls, zero: g.zero, early: g.early, fp: g.fp, day: g.day }));
    check('rule.cover.diff', 'Kapak zorluk katar: 150 tohum, 2 kapak, Δ difficulty ≥ +1 (7×9 ve 6×8)', g.dd['7x9'] >= 1 && g.dd['6x8'] >= 1, JSON.stringify(g.dd), 'medium');
    check('rule.cover.line', `M${C + 1} (${A}–${Z}): her bölümde kapak; ilk 3 bölüm 6×8, 1 kapak; hat ortalaması M${C}'den ≥ +1`, g.own === g.len && !g.miss && g.intro.slice(0, 3).every(s => /6x8\/1$/.test(s)) && /7x9\/2$/.test(g.intro[3]) && g.m10 >= g.m9 + 1 && g.genMs < 250,
      JSON.stringify({ own: g.own, miss: g.miss, intro: g.intro, m9: g.m9, m10: g.m10, genMs: g.genMs }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- 2. Karma hatlar: kapaklı ≥ 300 bölüm (rulesFor taraması) üretilir, çözüm geçerli, karanlık tünelle hiç gelmez ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 1 } });
    const c = await page.evaluate(([N, A]) => {
      const R = window.__ray, combo = {}; let n = 0, bad = 0, noCover = 0, fogClash = 0, scan = 0;
      for (let l = N; l <= 20000 && n < 300; l++) {
        const U = R.rulesFor(l); scan++; if (!U.has('cover')) continue;
        if (U.has('fog') || U.has('faint')) fogClash++;
        const P = R.puzzleFor(l); n++;
        if (!P.cover) noCover++; else if (!R.lit({ ...P, cur: P.sol }).solved || R.lit(P).solved) bad++;
        const k = [...U].filter(q => q !== 'cover').sort().join('+') || '-'; combo[k] = (combo[k] || 0) + 1;
      }
      let fogAll = 0; for (let l = A; l <= 20000; l++) { const U = R.rulesFor(l); if (U.has('cover') && U.has('fog')) fogAll++; }
      return { n, scan, bad, noCover, fogClash, fogAll, kinds: Object.keys(combo).length, top: Object.entries(combo).sort((a, b) => b[1] - a[1]).slice(0, 8) };
    }, [Z + 1, A]);
    check('rule.cover.mix', `Kapak karma hatlarda: ${c.n} kapaklı bölüm (${Z + 1}+) üretilir, kapak yerleşir, çözüm geçerli; öteki kurallarla karışır`, c.n >= 300 && !c.bad && !c.noCover && c.kinds >= 6, JSON.stringify(c));
    check('rule.cover.clash', `Kapak karanlık tünelle aynı bölümde hiç gelmez (${A}–20000, rulesFor)`, !c.fogClash && !c.fogAll, JSON.stringify({ fogClash: c.fogClash, fogAll: c.fogAll }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- 3. Kapak hattının ilk bölümü: kural kartı, kapağa dokunuş, ışık geri bildirimi, kazanma (kapak açılır) ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: A - 1, level: A, stars: starsUpTo(A), seen: { ...SEEN, [C]: 0 }, remindAsked: true } });
    await page.click('#bPlay'); await page.waitForTimeout(800);
    const card = await page.evaluate(() => ({ open: document.getElementById('modal').classList.contains('open'), txt: document.querySelector('.sheet h2')?.textContent, p: document.querySelector('.sheet p')?.textContent, demo: !!document.querySelector('.rd-cover .rd-cv s'), anim: getComputedStyle(document.querySelector('.rd-cv .w') || document.body).animationName }));
    await page.waitForTimeout(1200); await shot(page, 'rule-cover');
    if (card.open) await page.click('#mGo');
    await page.waitForTimeout(400);
    const g0 = await page.evaluate(() => { const G = window.__ray.G; window.__toasts = []; const el = document.getElementById('toast'); new MutationObserver(() => window.__toasts.push(el.textContent)).observe(el, { childList: true, characterData: true, subtree: true }); return { size: G.cols + 'x' + G.rows, i: G.cover.findIndex(Boolean), cur: G.cur.slice(), moves: G.moves, n: G.cover.filter(Boolean).length }; });
    await tapTile(page, g0.i); await page.waitForTimeout(150); await tapTile(page, g0.i); await page.waitForTimeout(200);
    const g1 = await page.evaluate(i => { const G = window.__ray.G; return { same: G.cur[i] === G.sol[i], moves: G.moves, toasts: window.__toasts }; }, g0.i);
    await shot(page, 'cover-intro');
    const taps = await solve(page, 20); const won = await waitModal(page);
    const g2 = await page.evaluate(() => { const G = window.__ray.G; return { won: G.won, open: !!G.cvWin, coverTip: JSON.parse(localStorage.getItem('ray')).coverTip }; });
    await shot(page, 'cover-win');
    check('rule.cover.card', `Bölüm ${A} ilk girişte "YENİ KURAL · Kapak" kartı (animasyonlu demo)`, card.open && /Kapak/.test(card.txt || '') && /dönmez/.test(card.p || '') && card.demo && card.anim === 'rdcv2', JSON.stringify(card), 'medium');
    check('rule.cover.tap', 'Kapağa dokunuş: karo dönmez, hamle sayılmaz, bir kez "Kapak · … dönmez" bildirimi', g0.size === '6x8' && g0.n === 1 && g1.same && g1.moves === g0.moves && g1.toasts.filter(s => /^Kapak · altındaki ray/.test(s)).length === 1, JSON.stringify({ g0: { size: g0.size, n: g0.n }, g1 }));
    check('rule.cover.win', `Bölüm ${A}: robot (solve + plan) çözer, kazanınca kapak açılır; ışık altından geçince bir kez açıklama`, won && g2.won && g2.open && g2.coverTip === 1, JSON.stringify({ taps, ...g2 }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- 4. 7×9 kapaklı bölüm: ipucu kapağa gitmez, ↺ baştan, yarım oyun kaydı ve sürdürme ----------
  {
    const p0 = await open(browser, URL, { save: { played: 1 } });
    const lvl = await p0.page.evaluate(([a, z]) => { const R = window.__ray; for (let l = a; l <= z; l++) { const U = R.rulesFor(l); if (U.size === 1 && R.puzzleFor(l).cover?.filter(Boolean).length === 2) return l; } return 0; }, [A + 6, Z - 1]);
    await p0.ctx.close();
    const { ctx, page, errors } = await open(browser, URL, { save: { played: lvl - 1, level: lvl, stars: starsUpTo(lvl), seen: SEEN, remindAsked: true, hints: 9, coverTip: 1 } });
    await page.click('#bPlay'); await page.waitForTimeout(600);
    const a = await page.evaluate(() => { const G = window.__ray.G; return { cov: G.cover.slice(), I: G.cover.flatMap((v, i) => v ? [i] : []), wrong: G.cur.filter((v, i) => v !== G.sol[i]).length }; });
    for (let k = 0; k < 4; k++) { await page.click('#bHint'); await page.waitForTimeout(250); }
    const h = await page.evaluate(I => { const G = window.__ray.G; return { fixed: G.fixed.filter(Boolean).length, onCover: I.some(i => G.fixed[i]), wrongNow: G.cur.filter((v, i) => v !== G.sol[i]).length }; }, a.I);
    // bir karoyu çevir, kaydı oku, sayfayı yenile → aynı dizilim sürer
    const t = await page.evaluate(() => { const G = window.__ray.G; return G.cur.findIndex((v, i) => !G.fixed[i] && !G.pinned[i] && !G.cover[i] && G.link[i] < 0 && G.cnt[i] < 0 && i !== G.hub && v !== G.sol[i]); });
    await tapTile(page, t); await page.waitForTimeout(300);
    const before = await page.evaluate(() => { const G = window.__ray.G; return { cur: G.cur.join(), moves: G.moves, fixed: G.fixed.filter(Boolean).length }; });
    const sv = await getSave(page);
    await page.reload(); await page.waitForTimeout(400); await page.click('#bPlay'); await page.waitForTimeout(600);
    const after = await page.evaluate(() => { const G = window.__ray.G; return { cur: G.cur.join(), moves: G.moves, fixed: G.fixed.filter(Boolean).length, cov: G.cover.slice() }; });
    await page.click('#bReset'); await page.waitForTimeout(500);
    const rs = await page.evaluate(I => { const G = window.__ray.G; return { moves: G.moves, cov: I.every(i => G.cur[i] === G.sol[i] && G.cover[i]), fixed: G.fixed.filter(Boolean).length }; }, a.I);
    await shot(page, 'cover-79');
    const taps = await solve(page, 8), won = await waitModal(page);
    check('rule.cover.hint', `Bölüm ${lvl} (7×9, 2 kapak): ipucu kapağa hiç gitmez (kapak hep doğru), 4 ipucu 4 karo sabitler`, lvl && a.I.length === 2 && h.fixed === 4 && !h.onCover && h.wrongNow < a.wrong, JSON.stringify({ lvl, ...h, wrong0: a.wrong }));
    check('rule.cover.save', 'Kapaklı yarım oyun kaydedilir ve sayfa yenilenince aynı dizilim, hamle ve kapakla sürer; ↺ baştan hamleyi sıfırlar, kapak yerinde, ipuçları korunur; robot kazanır',
      sv.runs?.level?.lvl === lvl && after.cur === before.cur && after.moves === before.moves && after.fixed === before.fixed && JSON.stringify(after.cov) === JSON.stringify(a.cov) && rs.moves === 0 && rs.cov && rs.fixed === 4 && won,
      JSON.stringify({ saved: sv.runs?.level?.lvl, same: after.cur === before.cur, moves: [before.moves, after.moves, rs.moves], fixed: rs.fixed, taps, won }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- 5. Karma bölüm: kapak + başka bir eklenti kuralı, gerçek oyunda robot kazanır ----------
  {
    const p0 = await open(browser, URL, { save: { played: 1 } });
    const lvl = await p0.page.evaluate(N => { const R = window.__ray, ext = R.MODS.map(m => m.key).filter(k => k !== 'cover'); for (let l = N; l < 3000; l++) { const U = R.rulesFor(l); if (U.has('cover') && [...U].some(k => ext.includes(k))) return l; } return 0; }, Z + 1);
    await p0.ctx.close();
    const { ctx, page, errors } = await open(browser, URL, { save: { played: lvl - 1, level: lvl, stars: starsUpTo(lvl), seen: SEEN, remindAsked: true, coverTip: 1 } });
    await page.click('#bPlay'); await page.waitForTimeout(600);
    if (await page.evaluate(() => document.getElementById('modal').classList.contains('open'))) { await page.click('#mGo'); await page.waitForTimeout(300); }
    const m0 = await page.evaluate(() => { const G = window.__ray.G; return { rules: G.rules, n: G.cover?.filter(Boolean).length }; });
    const taps = await solve(page, 8), won = await waitModal(page);
    check('rule.cover.mixwin', `Kapak + eklenti kuralı (bölüm ${lvl}): robot (solve + plan) kazanır`, lvl && m0.n >= 1 && m0.rules.length === 2 && won, JSON.stringify({ lvl, ...m0, taps, won }));
    errs.push(...errors); await ctx.close();
  }

  check('rule.cover.errors', 'Kapak senaryolarında konsol hatası yok', !errs.length, errs.join(' | '));
};
