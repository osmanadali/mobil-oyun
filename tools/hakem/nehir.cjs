// M18 · Nehir — robot testleri (hakem.cjs K bölümü çağırır). Sözleşme: docs/kurallar/README.md · tasarım: docs/kurallar/nehir.md
// Üretim (sayım, tek çözüm, prune sağlamlığı), zorluk farkı, eski bölümler bit bit aynı, hat ortalaması, çakışma, kart, oyun (kazanma, ipucu, ↺, kayıt),
// döngü uyarısı, karma hatlar (≥300 bölüm), kare süresi.
const SEEN = Object.fromEntries(Array.from({ length: 30 }, (_, k) => [k + 2, 1]));   // bütün kural kartları görülmüş
// nehir eklentisini yüklemeden açmak için: fabrika sarılır, key 'river' olan kural düşer (loadRules key'siz nesneyi atlar)
const NO_RIVER = `window.RAY_RULES = []; { const p = window.RAY_RULES.push.bind(window.RAY_RULES); window.RAY_RULES.push = f => p(api => { const m = f(api); return m && m.key === 'river' ? null : m; }); }`;
// 1–748 ve Günün Hattı özeti (FNV-1a): iki bağlamda (nehirli / nehirsiz) aynı olmalı
const FP = () => {
  const R = window.__ray, fnv = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0).toString(36); };
  const sum = P => JSON.stringify([P.cols, P.rows, P.sol, P.cur, P.pinned, P.link, P.rev, P.cnt, P.hub2, P.par, P.taps, P.diff, P.rules, Object.keys(P).sort()]);
  let a = ''; for (let l = 1; l <= 748; l++) a += fnv(sum(R.puzzleFor(l)));
  let d = ''; for (let k = 0; k < 30; k++) { const t = new Date(2026, 9, 1 + k * 11), s = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; d += fnv(sum(R.dailyBase(s))); }
  return { levels: fnv(a), daily: fnv(d) };
};

module.exports = async T => {
  const { browser, URL, open, check, solve, shot, getSave, tapTile, waitModal, starsUpTo } = T;
  const errs = [], lvlSave = (l, x = {}) => ({ played: l - 1, level: l, stars: starsUpTo(l), seen: SEEN, remindAsked: true, ...x });

  // ---------- 1. Üretim, sayım, tek çözüm, prune sağlamlığı, zorluk farkı ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 1 } });
    const g = await page.evaluate(() => {
      const R = window.__ray, m = R.MODS.find(q => q.key === 'river'), pr = m.prune, keys = R.MODS.map(q => q.key);
      const mixes = [[0, 0, { river: 1 }], [0, 0, { river: 2 }], [8, 0, { river: 2 }], [0, 3, { river: 2 }], [0, 0, { river: 2, rev: 9 }], [0, 0, { river: 2, cnt: 7 }],
        [0, 0, { river: 2, two: true }], [0, 0, { river: 2, fog: true }], [5, 2, { river: 2, rev: 5, cnt: 4, fog: true }]];
      for (const [k, v] of [['sw', 3], ['sign', 3], ['portal', 2]]) if (keys.includes(k)) mixes.push([0, 0, { river: 2, [k]: v }]);
      const bad = {}, B = k => { bad[k] = (bad[k] || 0) + 1; };
      const count = P => { let k = 0; R.difficulty(P, cfg => (R.lit({ ...P, cur: cfg }).solved && k++, k > 1)); return k; };
      let n = 0, rej = 0, none = 0, sound = 0; const t = performance.now();
      for (const [c, r] of [[6, 8], [7, 9]]) for (const [pins, pairs, x] of mixes) for (let s = 1; s <= 25; s++) {
        const P = R.generate(c, r, s * 7919 + 31, pins, pairs, x); n++;
        if (!P.river) { none++; continue; }
        const L = R.lit({ ...P, cur: P.sol }), Rv = P.river;
        if (!L.solved) B('solÇözülmedi');
        if ((L.openBy.river || 0) !== Rv.T || Rv.T !== Math.abs(x.river)) B('tamponSayısı');
        if (R.lit(P).solved) B('hazırÇözülü');
        // tamponlar: kıyıda, merkez değil, karşı karo o kenarda kolsuz
        for (const [i, k] of Rv.at) { const j = R.nb(P, i, k); if (!m.open(P, i, k) || i === P.hub || i === P.hub2 || j < 0 || (P.sol[j] & [4, 8, 1, 2][k])) B('tamponYeri'); }
        // çizgi merkez(ler)e değmez, kenara yapışık değil
        const hs = [P.hub, P.hub2].filter(h => h >= 0), lim = Rv.vert ? c : r;
        if (Rv.a < 2 || Rv.a > lim - 2 || hs.some(h => (Rv.vert ? h % c : h / c | 0) === Rv.a || (Rv.vert ? h % c : h / c | 0) === Rv.a - 1)) B('çizgiYeri');
        // tek çözüm: reddedilmeyen adayda tam 1 çözüm, reddedilende ≥ 2
        const k = count(P); if (P.reject) { rej++; if (k < 2) B('boşunaRet'); } else if (k !== 1) B('tekÇözümDeğil');
        // prune sağlam: süzgeçsiz çözüm sayısıyla aynı (ilk 8 tohum)
        if (s <= 8) { m.prune = null; const k2 = count(P); m.prune = pr; if (k2 !== k) B('pruneÇözümSildi'); else sound++; }
      }
      const ms = Math.round(performance.now() - t);
      // zorluk farkı: aynı tohum ve boyut, 150 tohum, kural açık/kapalı (reddedilen adaylar dahil değil: oyunda pick onları seçmez)
      const delta = {};
      for (const [c, r] of [[7, 9], [6, 8]]) { let a = 0, b = 0, q = 0; for (let s = 1; s <= 150; s++) { const P1 = R.generate(c, r, s * 7919 + 13, 0, 0, { river: 2 }); if (P1.reject) continue; a += R.difficulty(R.generate(c, r, s * 7919 + 13)); b += R.difficulty(P1); q++; } delta[c + 'x' + r] = { off: +(a / q).toFixed(2), on: +(b / q).toFixed(2), d: +((b - a) / q).toFixed(2), n: q }; }
      return { n, bad, rej, none, sound, ms, delta, mixes: mixes.length };
    });
    check('rule.river.gen', `Nehir: ${g.n} üretimde lit(sol) çözülü, kıyıda tam T tampon, tampon ve çizgi yerinde, hazır çözülü yok; reddedilmeyen adayda tek çözüm`, g.n >= 500 && !g.none && !Object.keys(g.bad).length, JSON.stringify({ n: g.n, mixes: g.mixes, bad: g.bad, rej: g.rej, none: g.none, ms: g.ms }));
    check('rule.river.prune', 'Nehir: tampon sayımı süzgeci (prune) hiçbir çözümü silmiyor (süzgeçli/süzgeçsiz çözüm sayısı eşit)', g.sound >= 100 && !g.bad.pruneÇözümSildi, `${g.sound} bulmaca`);
    check('rule.river.delta', 'Nehir: aynı tohum ve boyutta difficulty() farkı ≥ +1 (7×9 ve 6×8, 150 tohum, T = 2)', g.delta['7x9'].d >= 1 && g.delta['6x8'].d >= 1, JSON.stringify(g.delta));
    errs.push(...errors); await ctx.close();
  }

  // ---------- 2. Eski bölümler bit bit aynı: 1–748 ve Günün Hattı, nehir dosyası yüklü / yüksüz ----------
  {
    const a = await open(browser, URL, { save: { played: 1 } });
    const on = await a.page.evaluate(() => {
      const R = window.__ray, m = R.MODS.find(q => q.key === 'river'), calls = { n: 0 }, wrap = {};
      for (const h of ['tree', 'mark', 'open', 'check', 'prune']) { wrap[h] = m[h]; m[h] = function (...x) { calls.n++; return wrap[h].apply(this, x); }; }
      let old = 0, early = 0; for (let l = 1; l < 749; l += 7) if (R.puzzleFor(l).river) old++;
      for (let l = 1; l < 749; l++) if (R.rulesFor(l).has('river')) early++;
      ['2026-10-01', '2026-10-28'].forEach(d => { if (R.dailyBase(d).river) old++; });
      Object.assign(m, wrap);
      let zero = 0; for (let s = 1; s <= 40; s++) { const x = R.generate(7, 9, s, 3, 1, { rev: 3, river: 0 }), y = R.generate(7, 9, s, 3, 1, { rev: 3 }); if (JSON.stringify([x.sol, x.cur, x.river]) !== JSON.stringify([y.sol, y.cur, y.river])) zero++; }
      return { calls: calls.n, old, early, zero };
    });
    const fpOn = await a.page.evaluate(FP); errs.push(...a.errors); await a.ctx.close();
    const b = await open(browser, URL, { save: { played: 1 }, init: NO_RIVER });
    const fpOff = await b.page.evaluate(FP), keysOff = await b.page.evaluate(() => window.__ray.MODS.map(m => m.key)); errs.push(...b.errors); await b.ctx.close();
    check('rule.river.old', 'Nehir: 1–748 ve Günün Hattı bit bit aynı (nehir dosyası yüklü/yüksüz özet eşit, kanca hiç çağrılmıyor, {river:0} ≡ {})',
      !on.calls && !on.old && !on.early && !on.zero && !keysOff.includes('river') && fpOn.levels === fpOff.levels && fpOn.daily === fpOff.daily, JSON.stringify({ ...on, fpOn, fpOff }));
  }

  // ---------- 3. Hat: M18 (749–828) her bölümde nehir; tanıtım 6×8 T=1, sonra T=2; ortalama zorluk M17'den ≥ 1 yüksek ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 1 } });
    const h = await page.evaluate(() => {
      const R = window.__ray, avg = (a, b) => { let s = 0; for (let l = a; l <= b; l++) s += R.puzzleFor(l).diff; return +(s / (b - a + 1)).toFixed(2); };
      let own = 0, miss = 0, rej = 0, ms = 0; const intro = [];
      for (let l = 749; l <= 828; l++) {
        if (R.rulesFor(l).has('river')) own++;
        const t = performance.now(), P = R.puzzleFor(l); ms += performance.now() - t;
        if (!P.river || !R.lit({ ...P, cur: P.sol }).solved) miss++; if (P.reject) rej++;
        if (l <= 752) intro.push(`${l}:${P.cols}x${P.rows}/T${P.river?.T}`);
      }
      return { own, miss, rej, intro, m18: avg(749, 828), m17: avg(673, 748), ms: Math.round(ms / 80) };
    });
    const introOk = h.intro[0] === '749:6x8/T1' && /^750:6x8\/T2$/.test(h.intro[1]) && /^751:6x8\/T2$/.test(h.intro[2]) && /^752:7x9\/T2$/.test(h.intro[3]);
    check('rule.river.line', `Nehir: M18 her bölümde nehir, tek çözümlü; tanıtım 6×8 T=1, sonra T=2; ortalama zorluk ${h.m18} ≥ M17 ${h.m17} + 1`, h.own === 80 && !h.miss && !h.rej && introOk && h.m18 >= h.m17 + 1 && h.ms < 250, JSON.stringify(h));
    errs.push(...errors); await ctx.close();
  }

  // ---------- 4. Çakışma: köprü, tabla, halka, tarife bölgesiyle aynı bölümde gelmez ----------
  {
    // eklentisi henüz olmayan kural (tarife bölgesi, ayrı dal) yerine miktarı 0 olan kukla kural konur → rulesFor gerçek çakışmayı sınar
    const probe = await open(browser, URL, { save: { played: 1 } });
    const keys = await probe.page.evaluate(() => window.__ray.MODS.map(m => m.key)); await probe.ctx.close();
    const dummy = [['bridge', 10, 'Köprü'], ['table', 14, 'Döner tabla'], ['ring', 16, 'Halka hat'], ['zone', 19, 'Tarife bölgesi']].filter(([k]) => !keys.includes(k));
    const init = dummy.length ? `window.RAY_RULES = (window.RAY_RULES || []).concat(${JSON.stringify(dummy)}.map(([key, line, name]) => () => ({ key, line, card: { name, tag: name, demo: '', text: '' }, amount: () => 0 })));` : '';
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 1 }, init });
    const c = await page.evaluate(() => {
      const R = window.__ray, X = ['bridge', 'table', 'ring', 'zone'], cnt = { river: 0, bad: 0 };
      for (let l = 749; l <= 20000; l++) { const U = R.rulesFor(l); for (const k of X) if (U.has(k)) cnt[k] = (cnt[k] || 0) + 1; if (U.has('river')) { cnt.river++; if (X.some(k => U.has(k))) cnt.bad++; } }
      return { ...cnt, clash: R.MODS.find(m => m.key === 'river').clash };
    });
    check('rule.river.clash', 'Nehir: köprü, döner tabla, halka ve tarife bölgesiyle aynı bölümde hiç gelmiyor (749–20000, rulesFor)', !c.bad && c.river > 1000 && ['bridge', 'table', 'ring', 'zone'].every(k => c[k] > 300 && c.clash.includes(k)), JSON.stringify({ ...c, dummy: dummy.map(d => d[0]) }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- 5. Oyun: kural kartı, ilk tampon bildirimi, kayıt/sürdürme, ↺ baştan, robot kazanır ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 748, level: 749, stars: starsUpTo(749), remindAsked: true } });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    const card = await page.evaluate(() => ({ open: document.getElementById('modal').classList.contains('open'), txt: document.querySelector('.sheet h2')?.textContent, p: document.querySelector('.sheet p')?.textContent, demo: !!document.querySelector('.rd-river svg .rd-river-w'), icon: !!document.querySelector('.sheet p .rd-river-i') }));
    await page.waitForTimeout(1800); await shot(page, 'rule-river');
    if (card.open) await page.click('#mGo');
    await page.waitForTimeout(400);
    const st = () => page.evaluate(() => { const G = window.__ray.G; return { cur: G.cur.join(), moves: G.moves, size: G.cols + 'x' + G.rows, T: G.river?.T, seen: JSON.parse(localStorage.getItem('ray')).seen?.[17] }; });
    const s0 = await st();
    await shot(page, 'river');
    // ilk tampon: kıyıya bakan kolu boşa düşen karoyu oluşturacak dokunuş (karşı karo kolsuz)
    await page.evaluate(() => { const t = document.getElementById('toast'); window.__toasts = []; new MutationObserver(() => window.__toasts.push(t.textContent)).observe(t, { childList: true, characterData: true, subtree: true }); });
    const tap = await page.evaluate(() => {
      const R = window.__ray, G = R.G, m = R.MODS.find(q => q.key === 'river'), rot = R.rot;
      const tampons = cur => { let k = 0; for (let i = 0; i < cur.length; i++) for (let d = 0; d < 4; d++) if ((cur[i] & [1, 2, 4, 8][d]) && m.open(G, i, d) && !(cur[R.nb(G, i, d)] & [4, 8, 1, 2][d])) k++; return k; };
      const t0 = tampons(G.cur);
      for (let i = 0; i < G.cur.length; i++) { if (G.pinned[i] || G.link[i] >= 0 || i === G.hub) continue; const c = G.cur.slice(); c[i] = rot(c[i]); if (tampons(c) > t0) return i; }
      return -1;
    });
    await tapTile(page, tap); await page.waitForTimeout(300);
    const told = (await getSave(page)).riverTold, toasts = await page.evaluate(() => window.__toasts);
    const s1 = await st();
    await page.reload(); await page.waitForTimeout(400); await page.click('#bPlay'); await page.waitForTimeout(600);
    const s2 = await st();
    await page.click('#bReset'); await page.waitForTimeout(400); const s3 = await st();
    const taps = await solve(page, 8), won = await waitModal(page);
    const w = await page.evaluate(() => { const G = window.__ray.G; return { won: G.won, open: G.L.openBy.river || 0, T: G.river.T }; });
    await shot(page, 'river-win');
    check('rule.river.card', 'M18 ilk girişte "YENİ KURAL · Nehir" kartı ("geçit" sözcüğü, dalgalı nehir demosu, satır içi tampon simgesi)', card.open && /Nehir/.test(card.txt || '') && /geçit/.test(card.p || '') && /tampon/.test(card.p || '') && card.demo && card.icon && s0.seen === 1, JSON.stringify(card));
    check('rule.river.play', 'Nehir 749: 6×8, T=1; ilk tampon bildirimi (ömürde bir kez); yarım oyun aynı durumla sürer; ↺ başa döner; robot (solve) kazanır, kıyıda tam T tampon',
      s0.size === '6x8' && s0.T === 1 && tap >= 0 && told === 1 && toasts.some(x => /Tampon/.test(x)) && s1.moves === 1 && s2.cur === s1.cur && s2.moves === 1 && s3.cur === s0.cur && s3.moves === 0 && won && w.won && w.open === w.T,
      JSON.stringify({ s0: { ...s0, cur: 0 }, tap, told, toasts, resume: s2.cur === s1.cur, reset: s3.cur === s0.cur, taps, won, w }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- 6. İpucu: yalnız tampon karosu yanlışken 💡 onu oturtur, sabitler, bölüm biter ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { ...lvlSave(760), hints: 3 } });
    await page.click('#bPlay'); await page.waitForTimeout(600);
    const i = await page.evaluate(() => {
      const R = window.__ray, G = R.G, i = G.river.at.map(a => a[0]).find(c => !G.pinned[c] && G.link[c] < 0 && (G.unitOf?.[c] ?? -1) < 0 && R.rot(G.sol[c]) !== G.sol[c]);
      G.cur.forEach((v, j) => { G.cur[j] = j === i ? R.rot(G.sol[j]) : G.sol[j]; }); G.L = R.lit(G); return i;
    });
    await page.click('#bHint'); const won = await waitModal(page);
    const h = await page.evaluate(i => { const G = window.__ray.G; return { fixed: G.fixed[i], ok: G.cur[i] === G.sol[i], won: G.won }; }, i);
    check('rule.river.hint', 'Nehir: ipucu tampon karosunu çözüme oturtup sabitler, bölüm biter', i >= 0 && h.fixed && h.ok && won && h.won, JSON.stringify({ i, ...h, won }), 'medium');
    errs.push(...errors); await ctx.close();
  }

  // ---------- 7. Döngü uyarısı: hepsi bağlı, açık uç yok ama tampon eksik → kazanılmaz, rozet nabız atar, bir kez bildirim ----------
  {
    const p0 = await open(browser, URL, { save: { played: 1 } });
    const f = await p0.page.evaluate(() => {
      // süzgeçsiz çözücüyle döngülü (tampon eksik) bir dizilim ara
      const R = window.__ray, m = R.MODS.find(q => q.key === 'river'), pr = m.prune;
      for (let l = 752; l <= 828; l++) {
        const P = R.puzzleFor(l); if (P.fog || P.units || P.pinned.some(Boolean) || P.link.some(v => v >= 0)) continue; let hit = null;
        m.prune = null; R.difficulty(P, cfg => { if (R.lit({ ...P, cur: cfg }).rvNear) { hit = cfg; return true; } return false; }, 3000); m.prune = pr;
        if (hit) return { l, cfg: hit };
      }
      return null;
    });
    await p0.ctx.close();
    if (!f) check('rule.river.loop', 'Nehir: döngülü dizilim bulundu', false, 'M18 içinde bulunamadı');
    else {
      const { ctx, page, errors } = await open(browser, URL, { save: lvlSave(f.l, { riverTold: 1 }) });
      await page.click('#bPlay'); await page.waitForTimeout(600);
      const s = await page.evaluate(cfg => {
        const R = window.__ray, G = R.G, t = cfg.findIndex((v, i) => i !== G.hub && R.rot(R.rot(v)) !== v);
        G.cur = cfg.slice(); G.cur[t] = ((cfg[t] >> 1) | (cfg[t] << 3)) & 15; G.L = R.lit(G);   // bir dokunuş önce
        const el = document.getElementById('toast'); window.__toasts = []; new MutationObserver(() => window.__toasts.push(el.textContent)).observe(el, { childList: true, characterData: true, subtree: true });
        return { t, near0: !!G.L.rvNear };
      }, f.cfg);
      await tapTile(page, s.t); await page.waitForTimeout(200);
      await shot(page, 'river-loop');
      const w1 = await page.evaluate(() => { const G = window.__ray.G; return { near: G.L.rvNear, solved: G.L.solved, won: G.won, open: G.L.openBy.river || 0, T: G.river.T, pulse: !!G.rvPulse, warn: G.rvWarn }; });
      for (let k = 0; k < 4; k++) { await tapTile(page, s.t); await page.waitForTimeout(120); }
      await page.waitForTimeout(400);
      const w2 = await page.evaluate(() => ({ near: window.__ray.G.L.rvNear, won: window.__ray.G.won, n: window.__toasts.filter(x => /döngü/.test(x)).length }));
      check('rule.river.loop', `Nehir (bölüm ${f.l}): hepsi bağlı ama tampon eksikse (döngü) kazanılmaz; rozet nabız atar, "döngü" bildirimi bir kez`, !s.near0 && w1.near && !w1.solved && !w1.won && w1.open < w1.T && w1.pulse && w1.warn === 1 && w2.near && !w2.won && w2.n === 1, JSON.stringify({ l: f.l, s, w1, w2 }));
      errs.push(...errors); await ctx.close();
    }
  }

  // ---------- 8. Karma hatlar: ≥ 300 nehirli bölüm (829+) üretilir, çözüm geçerli, çakışan kural yok; nehir + karanlık tünel robotla kazanılır ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 1 } });
    const k = await page.evaluate(() => {
      const R = window.__ray, X = ['bridge', 'table', 'ring', 'zone'], mix = {}; let n = 0, bad = 0, rej = 0, cl = 0, fog = 0, l = 829;
      for (; n < 300 && l < 6000; l++) {
        const U = R.rulesFor(l); if (!U.has('river')) continue; n++;
        if (X.some(q => U.has(q))) cl++;
        const P = R.puzzleFor(l), L = R.lit({ ...P, cur: P.sol });
        if (!P.river || !L.solved || (L.openBy.river || 0) !== P.river.T || R.lit(P).solved) bad++; if (P.reject) rej++;
        const o = [...U].filter(q => q !== 'river').join('+') || '-'; mix[o] = (mix[o] || 0) + 1;
        if (U.has('fog') && !fog && !P.units) fog = l;
      }
      return { n, bad, rej, cl, last: l - 1, fog, kinds: Object.keys(mix).length, mix };
    });
    check('rule.river.mix', `Nehir: karma hatlarda ${k.n} nehirli bölüm (829–${k.last}) üretiliyor, çözüm geçerli, çakışan kural yok`, k.n >= 300 && !k.bad && !k.cl && k.kinds >= 6, JSON.stringify(k));
    errs.push(...errors); await ctx.close();
    if (k.fog) {
      const o = await open(browser, URL, { save: lvlSave(k.fog, { riverTold: 1 }) });
      await o.page.click('#bPlay'); await o.page.waitForTimeout(600);
      const m0 = await o.page.evaluate(() => { const G = window.__ray.G; return { river: !!G.river, fog: G.fog, rules: G.rules, dark: G.seen.filter(v => !v).length }; });
      await shot(o.page, 'river-fog');
      const taps = await solve(o.page, 8), won = await waitModal(o.page);
      check('rule.river.fog', `Nehir + karanlık tünel (bölüm ${k.fog}): ışığı izleyen robot kazanır`, m0.river && m0.fog && m0.dark > 5 && won, JSON.stringify({ ...m0, taps, won }));
      errs.push(...o.errors); await o.ctx.close();
    } else check('rule.river.fog', 'Nehir + karanlık tünel bölümü bulundu', false, '');
  }

  // ---------- 9. Düşük donanım: nehirli 7×9, 4× yavaş CPU, çizim süresi ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: lvlSave(760, { riverTold: 1 }) });
    await page.click('#bPlay'); await page.waitForTimeout(500);
    const tiles = await page.evaluate(() => {
      const R = window.__ray, G = R.G, m = R.MODS.find(q => q.key === 'river'), raf = window.requestAnimationFrame; let hk = 0;
      window.__dt = []; window.__hk = [];
      for (const h of ['under', 'over']) { const f = m[h]; m[h] = function (D) { const a = performance.now(), r = f.call(this, D); hk += performance.now() - a; return r; }; }
      window.requestAnimationFrame = cb => raf(t => { hk = 0; const a = performance.now(); cb(t); window.__dt.push(performance.now() - a); window.__hk.push(hk); });
      return G.cur.map((v, i) => i).filter(i => !G.pinned[i] && i !== G.hub).slice(0, 30);
    });
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    for (let k = 0; k < 30; k++) { await tapTile(page, tiles[k % tiles.length]); await page.waitForTimeout(60); }
    await page.waitForTimeout(800);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const r = await page.evaluate(() => {
      const q = (a, p) => { a = a.slice().sort((x, y) => x - y); return +(a[Math.min(a.length - 1, Math.floor(a.length * p))] || 0).toFixed(2); };
      return { n: window.__dt.length, d50: q(window.__dt, .5), d95: q(window.__dt, .95), h50: q(window.__hk, .5), h95: q(window.__hk, .95) };
    });
    check('rule.river.perf', '4× yavaş CPU, nehirli 7×9: kare çizimi ortanca < 8 ms, nehir kancaları ortanca < 1 ms', r.n > 60 && r.d50 < 8 && r.h50 < 1, `çizim p50 ${r.d50} · p95 ${r.d95} ms · nehir kancaları p50 ${r.h50} · p95 ${r.h95} ms · ${r.n} kare`, 'medium');
    errs.push(...errors); await ctx.close();
  }

  check('rule.river.errors', 'Nehir senaryolarında konsol hatası yok', !errs.length, errs.join(' | '));
};
