// Gizli depo (RL.depot hattı) — robot testleri (hakem.cjs K bölümü çağırır). Sözleşme: docs/kurallar/README.md · tasarım: docs/kurallar/gizli-depo.md
// Üretim, kazanma denetimi, adillik (bağımsız sayım), çözücü süzgeci, zorluk ölçümü, eski bölümler (kural yüklü/yüksüz parmak izi),
// karma hatlar (rulesFor taraması), kural kartı, bildirimler, yarım oyun, ↺ baştan, ipucu, robotun kazanması.
const SEEN = Object.fromEntries(Array.from({ length: 30 }, (_, k) => [k + 2, 1]));   // bütün kural kartları görülmüş
// depo eklentisini yüklemeyen sayfa: fabrika RAY_RULES'a hiç girmez (parmak izi karşılaştırması)
const NO_DEPOT = `(() => { const a = window.RAY_RULES || []; a.push = function (...f) { return Array.prototype.push.apply(this, f.filter(x => !String(x).includes("key: 'depot'"))); }; window.RAY_RULES = a; })();`;

module.exports = async T => {
  const { browser, URL, open, check, solve, shot, getSave, tapTile, waitModal, starsUpTo, RL, AT } = T;
  const DL = RL.depot, A = AT('depot');
  const errs = [];
  // her toast() çağrısı ayrı kaydedilir (aynı dokunuşta iki bildirim gelirse MutationObserver yalnız sonuncuyu görür)
  const toasts = page => page.evaluate(() => { const t = document.getElementById('toast'), d = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent'); window.__toasts = []; Object.defineProperty(t, 'textContent', { configurable: true, get() { return d.get.call(this); }, set(v) { window.__toasts.push(v); d.set.call(this, v); } }); });

  // ---------- 1. Üretim, kazanma denetimi, adillik, çözücü, zorluk ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 1 } });
    const g = await page.evaluate(() => {
      const R = window.__ray, bit = k => [1, 2, 4, 8][k], M = R.MODS.find(m => m.key === 'depot');
      const keyOf = (P, c) => P.depot.map(V => V.cells.find(i => c[i] & bit(V.k))).join();
      const bad = {}, B = k => { bad[k] = (bad[k] || 0) + 1; };
      let n = 0, narrowed = 0, twoX = 0, noX = 0;
      for (const [c, r] of [[6, 8], [7, 9]]) for (const amt of [1, 2, 3]) for (let s = 1; s <= 50; s++) {
        const P = R.generate(c, r, s * 7919 + amt, s % 4 ? 0 : 4, s % 5 ? 0 : 2, { depot: amt, two: s % 6 === 0, rev: s % 3 ? 0 : 4, cnt: s % 7 ? 0 : 3 }); n++;
        if (!P.depot || P.depot.length !== amt) { B('sayı'); continue; }
        if (!R.lit({ ...P, cur: P.sol }).solved) B('solÇözülmedi');
        if (R.lit(P).solved) B('hazırÇözülü');
        const cells = P.depot.flatMap(V => V.cells);
        if (new Set(cells).size !== cells.length) B('ortakKaro');
        for (const V of P.depot) {
          const ex = V.e >> 2, cs = V.cells, step = V.k % 2 ? c : 1;
          if (V.cells.length === 1) narrowed++;
          if (!cs.includes(ex) || (V.e & 3) !== V.k) B('çıkışAyraçta');
          if (cs.length !== 3 && cs.length !== 1) B('genişlik');
          const srt = cs.slice().sort((a, b) => a - b); if (srt.some((v, j) => j && v - srt[j - 1] !== step)) B('ardışık');
          if (cs.some(i => R.nb(P, i, V.k) >= 0 || i === P.hub || i === P.hub2 || P.pinned[i] || P.link[i] >= 0)) B('ayraçKaro');
          if (cs.filter(i => P.sol[i] & bit(V.k)).length !== 1) B('solTekÇıkış');
        }
        // ikinci çıkış ve çıkışsız ayraç kabul edilmez
        const V = P.depot.find(W => W.cells.length > 1);
        if (V) {
          const o = V.cells.find(i => !(P.sol[i] & bit(V.k))), cur = P.sol.slice(); cur[o] |= bit(V.k); twoX++;
          if (R.lit({ ...P, cur }).solved) B('ikiÇıkışKabul');
          const cur2 = P.sol.slice(); cur2[V.e >> 2] &= ~bit(V.k); noX++;
          if (R.lit({ ...P, cur: cur2 }).solved) B('çıkışsızKabul');
        }
        // kenar karosunun ayraç dışındaki dışa kolu açık uçtur
        const out = P.sol.findIndex((m, i) => !cells.includes(i) && i !== P.hub && [0, 1, 2, 3].some(k => R.nb(P, i, k) < 0 && !(m & bit(k))));
        if (out >= 0) { const k = [0, 1, 2, 3].find(q => R.nb(P, out, q) < 0 && !(P.sol[out] & bit(q))), cur = P.sol.slice(); cur[out] |= bit(k); if (R.lit({ ...P, cur }).solved) B('duvarDelindi'); }
      }
      // adillik, BAĞIMSIZ sayım: sayım süzgeci (prune) kapalı, geniş tavan → oyuncunun gördüğüyle bütün çözümler aynı depo yerini verir
      let fair = 0, fairN = 0, capHit = 0, solKey = 0;
      const pr = M.prune; M.prune = undefined;
      for (let s = 1; s <= 120; s++) {
        const P = R.generate(s % 2 ? 7 : 6, s % 2 ? 9 : 8, s * 31 + 7, 0, s % 3 ? 0 : 2, { depot: 2, two: s % 5 === 0 }); fairN++;
        const keys = new Set(), sc = R.difficulty(P, cfg => { if (R.lit({ ...P, cur: cfg }).solved) keys.add(keyOf(P, cfg)); return false; }, 30000);
        if (sc >= 90000) capHit++; else if (keys.size === 1) fair++;
        if (keys.has(keyOf(P, P.sol))) solKey++;
      }
      M.prune = pr;
      // süzgeç sağlam: açıkken de çözüm bulunur, aynı anahtar
      let pruneOk = 0;
      for (let s = 1; s <= 120; s++) {
        const P = R.generate(s % 2 ? 7 : 6, s % 2 ? 9 : 8, s * 31 + 7, 0, s % 3 ? 0 : 2, { depot: 2, two: s % 5 === 0 }), keys = new Set();
        R.difficulty(P, cfg => { if (R.lit({ ...P, cur: cfg }).solved) keys.add(keyOf(P, cfg)); return false; }, 30000);
        if (keys.size === 1 && keys.has(keyOf(P, P.sol))) pruneOk++;
      }
      // zorluk: aynı tohum ve boyut, kural kapalı/açık (2 depo)
      const delta = (c, r) => { let a = 0, b = 0, up = 0; for (let s = 1; s <= 160; s++) { const d0 = R.difficulty(R.generate(c, r, s * 7919, 0, 0, {})), d1 = R.difficulty(R.generate(c, r, s * 7919, 0, 0, { depot: 2 })); a += d0; b += d1; if (d1 > d0) up++; } return { off: +(a / 160).toFixed(2), on: +(b / 160).toFixed(2), d: +((b - a) / 160).toFixed(2), up }; };
      const d79 = delta(7, 9), d68 = delta(6, 8);
      // {depot:0} ≡ {} (R() tüketilmez)
      let zero = 0; for (let s = 1; s <= 40; s++) { const a = R.generate(7, 9, s, 3, 1, { rev: 3, depot: 0 }), b = R.generate(7, 9, s, 3, 1, { rev: 3 }); if (JSON.stringify(a) !== JSON.stringify(b)) zero++; }
      return { n, bad, narrowed, twoX, noX, fair, fairN, capHit, solKey, pruneOk, d79, d68, zero };
    });
    check('rule.depot.gen', `Gizli depo: ${g.n} üretimde (1–3 depo; sabit, eşli, ters, sayaçlı, iki merkez ile) sol çözülü, başlangıç çözülmemiş; ayraç 3 ardışık kenar karosu (ya da daraltılmış 1), çıkışı içerir, sol'da tam bir çıkış`, g.n === 300 && !Object.keys(g.bad).length, JSON.stringify({ bad: g.bad, narrowed: g.narrowed }));
    check('rule.depot.win', 'Gizli depo: ayraçta iki çıkış ya da hiç çıkış kabul edilmez; ayraç dışındaki kenar duvardır', g.twoX > 100 && g.noX > 100 && !g.bad.ikiÇıkışKabul && !g.bad.çıkışsızKabul && !g.bad.duvarDelindi, JSON.stringify({ twoX: g.twoX, noX: g.noX }));
    check('rule.depot.fair', `Gizli depo adil: ${g.fairN} bölümde, depo yeri bilinmeden (sayım süzgeci kapalı, bağımsız sayım) bütün çözümler aynı depo yerini veriyor ve bu sol'un yeri`, g.fair === g.fairN && g.solKey === g.fairN && !g.capHit, JSON.stringify({ fair: g.fair, solKey: g.solKey, capHit: g.capHit }));
    check('rule.depot.prune', 'Gizli depo: çözücüdeki "her ayraçta tam 1" süzgeci çözümü elemiyor (açıkken de tek ve doğru anahtar)', g.pruneOk === 120, `${g.pruneOk}/120`);
    check('rule.depot.diff', `Gizli depo zorluk katıyor (160 tohum, 2 depo): 7×9 ${g.d79.off} → ${g.d79.on} (Δ ${g.d79.d}), 6×8 ${g.d68.off} → ${g.d68.on} (Δ ${g.d68.d}); ikisi de ≥ +1`, g.d79.d >= 1 && g.d68.d >= 1, JSON.stringify({ d79: g.d79, d68: g.d68 }), 'medium');
    check('rule.depot.zero', 'Gizli depo: {depot:0} üretimi {} ile birebir (R() tüketilmez)', !g.zero, `${g.zero} fark`);
    errs.push(...errors); await ctx.close();
  }

  // ---------- 2. Eski bölümler bit bit aynı: kural yüklü/yüksüz, depo hattından öncesi ve Günün Hattı ----------
  {
    const fp = DL => {
      const R = window.__ray, fnv = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0).toString(36); };
      const sum = P => JSON.stringify([P.sol, P.cur, P.pinned, P.link, P.rev, P.cnt, P.hub2, P.par, P.taps, P.diff, P.rules, Object.keys(P).sort()]);
      let lv = ''; for (let l = 1; l < R.lineStart(DL); l++) lv += fnv(sum(R.puzzleFor(l)));
      let day = ''; for (let d = 0; d < 40; d++) { const t = new Date(2026, 9, 1 + d * 9); day += fnv(sum(R.dailyFor(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`))); }
      return { lv: fnv(lv), day: fnv(day), last: R.lineStart(DL) - 1, keys: R.MODS.map(m => m.key).join() };
    };
    const a = await open(browser, URL, { save: { played: 1 } }), b = await open(browser, URL, { save: { played: 1 }, init: NO_DEPOT });
    const [x, y] = await Promise.all([a.page.evaluate(fp, DL), b.page.evaluate(fp, DL)]);
    check('rule.depot.old', `Gizli depo: 1–${x.last} ve Günün Hattı (40 gün) kural yüklü/yüksüz bit bit aynı`, x.last === A - 1 && x.lv === y.lv && x.day === y.day && /depot/.test(x.keys) && !/depot/.test(y.keys), JSON.stringify({ x, y }));
    errs.push(...a.errors, ...b.errors); await a.ctx.close(); await b.ctx.close();
  }

  // ---------- 3. Hat ve karma hatlar ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 1 } });
    const h = await page.evaluate(DL => {
      const R = window.__ray, L0 = R.lineStart(DL), L1 = R.lineStart(DL + 1), avg = c => { let a = 0, n = 0; for (let l = R.lineStart(c); l < R.lineStart(c + 1); l++) { a += R.puzzleFor(l).diff; n++; } return +(a / n).toFixed(2); };
      let early = 0, own = 0, miss = 0; const intro = [];
      for (let l = 1; l < L0; l++) if (R.rulesFor(l).has('depot')) early++;
      for (let l = L0; l < L1; l++) { if (R.rulesFor(l).has('depot')) own++; const P = R.puzzleFor(l); if (!P.depot) miss++; if (l < L0 + 4) intro.push(`${l}:${P.cols}x${P.rows}/${P.depot?.length}`); }
      const m13 = avg(DL - 1), m14 = avg(DL);
      // karma: depo hattı sonrası depo taşıyan ilk 300 bölüm → hepsi üretilir, sol çözülü, başlangıç çözülmemiş, çakışmalı kural yok
      const clashOf = k => R.MODS.find(m => m.key === k)?.clash || [];
      let n = 0, bad = 0, noDep = 0, clash = 0, mixed = 0; const with_ = {};
      for (let l = L1; n < 300 && l < 20000; l++) {
        const U = R.rulesFor(l); if (!U.has('depot')) continue; n++;
        const P = R.puzzleFor(l);
        if (!P.depot) noDep++;
        if (!R.lit({ ...P, cur: P.sol }).solved || R.lit(P).solved) bad++;
        if ([...U].some(k => clashOf('depot').includes(k) || clashOf(k).includes('depot'))) clash++;
        if (U.size > 1) mixed++; for (const k of U) if (k !== 'depot') with_[k] = (with_[k] || 0) + 1;
      }
      return { L0, L1, early, own, miss, intro, m13, m14, n, bad, noDep, clash, mixed, with_ };
    }, DL);
    check('rule.depot.line', `Gizli depo: 1–${h.L0 - 1} depo yok; M${DL + 1}'in her bölümünde var; ${h.L0} tanıtım 6×8 + 1 depo`, !h.early && h.own === h.L1 - h.L0 && !h.miss && h.intro[0] === `${A}:6x8/1`, JSON.stringify({ early: h.early, own: h.own, miss: h.miss, intro: h.intro }));
    check('rule.depot.ladder', `Gizli depo: M${DL + 1} ortalama zorluğu ${h.m14}, önceki hattın (${h.m13}) üstünde`, h.m14 > h.m13, `M${DL} ${h.m13} → M${DL + 1} ${h.m14}`, 'medium');
    check('rule.depot.mix', `Gizli depo karma hatlarda: ${h.n} bölüm (${h.mixed} tanesi öteki kurallarla) üretilir, sol çözülü, başlangıç çözülmemiş, çakışmalı kural yok`, h.n === 300 && !h.bad && !h.noDep && !h.clash && h.mixed > 100, JSON.stringify({ bad: h.bad, noDep: h.noDep, clash: h.clash, with: h.with_ }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- 4. Depo hattının ilk bölümü: kural kartı, ilk dokunuş bildirimi, iki çıkış uyarısı, yarım oyun, ↺ baştan, robot kazanır ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: A - 1, level: A, stars: starsUpTo(A), seen: { ...SEEN, [DL]: 0 }, remindAsked: true } });
    await page.click('#bPlay'); await page.waitForTimeout(900);
    const card = await page.evaluate(() => ({ open: document.getElementById('modal').classList.contains('open'), txt: document.querySelector('.sheet h2')?.textContent, p: document.querySelector('.sheet p')?.textContent, demo: !!document.querySelector('.rd-depot .rd-dh'), icon: !!document.querySelector('.sheet p .rd-depot-i'), anim: getComputedStyle(document.querySelector('.rd-dh') || document.body).animationName }));
    await shot(page, 'rule-depot');
    if (card.open) await page.click('#mGo');
    await page.waitForTimeout(400);
    await toasts(page);
    const g0 = await page.evaluate(() => { const { G, geo } = window.__ray, r = document.getElementById('cv').getBoundingClientRect(), V = G.depot[0];
      return { lvl: G.lvl, size: G.cols + 'x' + G.rows, n: G.depot.length, cells: V.cells, k: V.k, s: geo.s, W: r.width, ox: geo.ox, right: geo.ox + G.cols * geo.s, seen: JSON.parse(localStorage.getItem('ray')).seen?.[window.__ray.RULE_LINE.depot] }; });
    await shot(page, 'depot');
    // iki çıkış (gerçek dokunuşlar): önce ayraçta yalnız gerçek çıkış dışa bakar, sonra ikinci bir karo da dışa çevrilir → uyarı bir kez
    const plan = await page.evaluate(() => {
      const { G, rot } = window.__ray, V = G.depot[0], b = [1, 2, 4, 8][V.k], ex = V.e >> 2, cur = G.cur.slice(), taps = [];
      const to = (i, f, min = 0) => { let k = 0; while ((k < min || !f(cur[i])) && k < 4) { cur[i] = rot(cur[i]); taps.push(i); k++; } };
      const [o, t] = V.cells.filter(i => i !== ex && rot(G.sol[i]) !== G.sol[i]).concat(V.cells.filter(i => i !== ex));
      to(t, m => !(m & b)); to(o, m => !(m & b)); to(ex, m => m & b); to(o, m => m & b, 1);
      return { taps, ok: V.cells.filter(i => cur[i] & b).length === 2 };
    });
    for (const i of plan.taps) await tapTile(page, i);
    await page.waitForTimeout(300);
    const g1 = await page.evaluate(() => { const G = window.__ray.G; return { dpN: G.L.dpN, warn: G.dpWarn, toasts: window.__toasts, told: JSON.parse(localStorage.getItem('ray')).depotTold }; });
    await shot(page, 'depot-two');
    const st = () => page.evaluate(() => { const G = window.__ray.G; return { cur: G.cur.join(), m: G.moves }; });
    const s1 = await st();
    await page.reload(); await page.waitForTimeout(400); await page.click('#bPlay'); await page.waitForTimeout(600);
    const s2 = await st();
    await page.click('#bReset'); await page.waitForTimeout(400);
    const s3 = await page.evaluate(A => { const { G, puzzleFor } = window.__ray; return { same: G.cur.join() === puzzleFor(A).cur.join(), m: G.moves }; }, A);
    const taps = await solve(page, 8), won = await waitModal(page);
    const g2 = await page.evaluate(() => { const G = window.__ray.G; return { won: G.won, dpN: G.L.dpN }; });
    await shot(page, 'depot-win');
    check('rule.depot.card', `M${DL + 1} ilk girişte "YENİ KURAL · Gizli depo" kartı (animasyonlu demo, satır içi depo simgesi)`, card.open && /Gizli depo/.test(card.txt || '') && /tam biri/.test(card.p || '') && card.demo && card.icon && card.anim === 'rd-df' && g0.seen === 1, JSON.stringify(card), 'medium');
    check('rule.depot.screen', `Bölüm ${A}: 6×8, 1 depo, ayraç ve depo tahtanın dışında, ekranda`, g0.lvl === A && g0.size === '6x8' && g0.n === 1 && g0.cells.length === 3 && (g0.k !== 3 || g0.ox - .46 * g0.s >= 0) && (g0.k !== 1 || g0.right + .46 * g0.s <= g0.W), JSON.stringify(g0), 'medium');
    check('rule.depot.warn', 'Gizli depo: ayraçta iki çıkış → uyarı bir kez, ilk dokunuşta depo bildirimi (ömürde bir kez)', plan.ok && g1.dpN[0] === 2 && g1.warn === 1 && g1.toasts.some(t => /yalnız bir ray/.test(t)) && g1.toasts.some(t => /Depo/.test(t)) && g1.told === 1, JSON.stringify(g1));
    check('rule.depot.run', 'Gizli depo: yarım oyun aynı dizilimle sürer, ↺ baştan ilk duruma döner, robot (solve + plan) kazanır', s2.cur === s1.cur && s2.m === s1.m && s3.same && s3.m === 0 && won && g2.won && g2.dpN[0] === 1, JSON.stringify({ s1m: s1.m, s2m: s2.m, s3, taps, won, g2 }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- 5. İpucu: yalnız depo karosu yanlış → ipucu onu oturtup sabitler, bölüm biter (7×9, 2 depo) ----------
  {
    const p0 = await open(browser, URL, { save: { played: 1 } });
    const lvl = await p0.page.evaluate(DL => { const R = window.__ray; for (let l = R.lineStart(DL) + 3; l < R.lineStart(DL + 1); l++) { const U = R.rulesFor(l); if ([...U].every(k => ['depot', 'pins', 'pairs', 'rev', 'cnt'].includes(k))) return l; } return 0; }, DL);
    await p0.ctx.close();
    const { ctx, page, errors } = await open(browser, URL, { save: { played: lvl - 1, level: lvl, stars: starsUpTo(lvl), seen: SEEN, remindAsked: true, depotTold: 1, hints: 3 } });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    const i = await page.evaluate(() => { const { G, rot, lit } = window.__ray, V = G.depot[0], ex = V.e >> 2; G.cur.forEach((v, j) => { G.cur[j] = G.sol[j]; }); G.cur[ex] = rot(G.sol[ex]); G.L = lit(G); return ex; });
    await page.click('#bHint'); const won = await waitModal(page);
    const r = await page.evaluate(i => { const G = window.__ray.G; return { fixed: G.fixed[i], ok: G.cur[i] === G.sol[i], n: G.depot.length, size: G.cols + 'x' + G.rows }; }, i);
    check('rule.depot.hint', `Gizli depo (bölüm ${lvl}): ipucu depo karosunu çözüme oturtup sabitler, bölüm biter`, lvl > 0 && r.fixed && r.ok && won && r.n === 2 && r.size === '7x9', JSON.stringify({ lvl, ...r, won }), 'medium');
    errs.push(...errors); await ctx.close();
  }

  check('rule.depot.errors', 'Gizli depo senaryolarında konsol hatası yok', !errs.length, errs.join(' | '));
};
