// M17 · Halka hat — robot testleri (hakem.cjs K bölümü çağırır). Sözleşme: docs/kurallar/README.md · tasarım: docs/kurallar/halka.md
// Üretim (600+ bulmaca), işaret kayınca ret, eski bölümler bit bit aynı, çakışma (tabela/köprü), kural kartı, kapanma, yakın kazanç uyarısı, karma bölüm, kare süresi.
// Eklentisiz tabanın özeti (FNV-1a, JSON): 1–208 ve Günün Hattı hiçbir eklentiden etkilenmez → bu değerler hiç değişmemeli.
const BASE = { l1: 'dukhsf', l29: '1ucs2l5', l77: '1notwly', l133: 'xho41m', l169: '11dirt9', l208: '1m5fjur', '2026-10-01': '1npbt0', '2026-10-27': 'qx5s5f', '2027-03-14': '1s6o7ll' };
const SEEN = Object.fromEntries(Array.from({ length: 30 }, (_, k) => [k + 2, 1]));   // bütün kural kartları görülmüş

module.exports = async T => {
  const { browser, URL, open, check, solve, shot, getSave, tapTile, waitModal, starsUpTo } = T;
  const errs = [];

  // ---------- 1. Üretim, kazanma denetimi, eski bölümler ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 1 } });
    const g = await page.evaluate(() => {
      const R = window.__ray, rot = R.rot, per = m => rot(m) === m ? 1 : rot(rot(m)) === m ? 2 : 4;
      const mixes = [[0, 0, { ring: 1 }], [0, 0, { ring: 2 }], [8, 0, { ring: 2 }], [0, 3, { ring: 2 }], [0, 0, { ring: 2, rev: 9 }], [0, 0, { ring: 2, cnt: 7 }],
        [0, 0, { ring: 2, two: true }], [0, 0, { ring: 2, fog: true }], [0, 0, { ring: 2, two: true, fog: true }], [5, 2, { ring: 2, rev: 5, cnt: 4, two: true, fog: true }]];
      const keys = R.MODS.map(m => m.key);   // birleşmiş sürümde öteki eklentiler de karışıma girer
      if (keys.includes('sw')) mixes.push([0, 0, { ring: 2, sw: 3 }]);
      if (keys.includes('table')) mixes.push([0, 0, { ring: 2, table: 1 }]);
      if (keys.includes('sw') && keys.includes('table')) mixes.push([0, 0, { ring: 2, sw: 3, table: 1 }]);
      if (keys.includes('portal')) mixes.push([0, 0, { ring: 2, portal: 2 }]);
      const bad = {}, B = k => { bad[k] = (bad[k] || 0) + 1; }, lens = [];
      let n = 0, moved = 0; const t = performance.now();
      for (const [c, r] of [[6, 8], [7, 9]]) for (const [pins, pairs, x] of mixes) for (let s = 1; s <= 30; s++) {
        const P = R.generate(c, r, s * 7919 + 31, pins, pairs, x); n++;
        if (!P.ring) { B('halkaYok'); continue; }
        const L = R.lit({ ...P, cur: P.sol }), cyc = new Set(P.ring.cyc), core = [...L.core.keys()].filter(i => L.core[i]);
        if (!L.solved) B('solÇözülmedi');
        if (R.lit(P).solved) B('hazırÇözülü');
        // 2-çekirdek tam olarak tek döngü: döngü karoları, her birinin çekirdek derecesi 2
        if (core.length !== cyc.size || core.some(i => !cyc.has(i)) || !L.rc || core.some(i => !L.rc[i])) B('çekirdek≠döngü');
        const mk = P.ring.mark.map((v, i) => v ? i : -1).filter(i => i >= 0);
        if (mk.length !== x.ring || L.rOn !== mk.length) B('işaretSayısı');
        if (mk.some(i => !cyc.has(i) || i === P.hub || i === P.hub2 || per(P.sol[i]) < 2)) B('işaretYeri');
        if (mk.some(i => P.pinned[i] || P.link[i] >= 0 || P.rev[i] || P.cnt[i] >= 0 || (P.unitOf?.[i] ?? -1) >= 0)) B('işaretÇıplakDeğil');
        lens.push(cyc.size); if (cyc.size < 8 || cyc.size > (c * r < 63 ? 12 : 20)) B('uzunluk');
        // işaret döngü dışına kayınca sol reddedilir ve "yakın kazanç" olur
        const off = P.sol.map((_, i) => i).filter(i => !cyc.has(i) && i !== P.hub && i !== P.hub2), m2 = P.ring.mark.slice();
        m2[mk[0]] = false; m2[off[s % off.length]] = true;
        const L2 = R.lit({ ...P, cur: P.sol, ring: { ...P.ring, mark: m2 } });
        if (L2.solved || !L2.ringNear) B('kayanİşaretKabul'); else moved++;
      }
      const ms = Math.round(performance.now() - t);
      // eski bölümler: halka kancaları hiç çağrılmaz, R() tüketilmez
      const m = R.MODS.find(q => q.key === 'ring'), calls = { n: 0 }, wrap = {};
      for (const h of ['tree', 'mark', 'check']) { wrap[h] = m[h]; m[h] = function (...a) { calls.n++; return wrap[h].apply(this, a); }; }
      let old = 0; for (let l = 1; l < 673; l += 11) if (R.puzzleFor(l).ring) old++;
      ['2026-10-01', '2026-10-27'].forEach(d => { if (R.dailyFor(d).ring) old++; });
      Object.assign(m, wrap);
      let zero = 0; for (let s = 1; s <= 40; s++) { const a = R.generate(7, 9, s, 3, 1, { rev: 3, ring: 0 }), b = R.generate(7, 9, s, 3, 1, { rev: 3 }); if (JSON.stringify([a.sol, a.cur, a.ring]) !== JSON.stringify([b.sol, b.cur, b.ring])) zero++; }
      const fnv = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0).toString(36); };
      const sum = P => fnv(JSON.stringify([P.sol, P.cur, P.pinned, P.link, P.rev, P.cnt, P.hub2, P.par, P.taps, P.diff]));
      const hash = {}; for (const l of [1, 29, 77, 133, 169, 208]) hash['l' + l] = sum(R.puzzleFor(l));
      for (const d of ['2026-10-01', '2026-10-27', '2027-03-14']) hash[d] = sum(R.dailyFor(d));
      // hat: 1–672'de halka yok, M17'nin (673–748) her bölümünde var; ilk 3 bölüm 6×8, halka ≤ 12, 1 işaret
      let early = 0, own = 0, miss = 0, gt = 0, gms = 0; const intro = [];
      for (let l = 1; l < 673; l++) if (R.rulesFor(l).has('ring')) early++;
      for (let l = 673; l <= 748; l++) if (R.rulesFor(l).has('ring')) own++;
      for (let l = 673; l <= 760; l++) {
        if (!R.rulesFor(l).has('ring')) continue;
        const t0 = performance.now(), P = R.puzzleFor(l); gms += performance.now() - t0; gt++;
        if (!P.ring || !R.lit({ ...P, cur: P.sol }).solved) miss++;
        if (l <= 676 && P.ring) intro.push(`${l}:${P.cols}x${P.rows}/${P.ring.cyc.length}/${P.ring.mark.filter(Boolean).length}`);
      }
      return { n, bad, moved, ms, avgLen: +(lens.reduce((a, b) => a + b, 0) / lens.length).toFixed(1), calls: calls.n, old, zero, hash, early, own, miss, intro, genMs: +(gms / gt).toFixed(1), mixes: mixes.length };
    });
    const hashOk = Object.keys(BASE).every(k => g.hash[k] === BASE[k]);
    const introOk = g.intro.length === 4 && g.intro.slice(0, 3).every(s => { const [, sz, len, mk] = s.match(/:(\w+)\/(\d+)\/(\d+)/); return sz === '6x8' && +len <= 12 && +mk === 1; }) && /7x9\/\d+\/2$/.test(g.intro[3]);
    check('rule.ring.gen', `Halka: ${g.n} üretimde lit(sol) çözülü, 2-çekirdek tam tek döngü ve işaretleri içeriyor; işaret çıplak, döngüde; hazır çözülü yok`, g.n >= 600 && !Object.keys(g.bad).length, JSON.stringify({ n: g.n, mixes: g.mixes, bad: g.bad, avgLen: g.avgLen, ms: g.ms }));
    check('rule.ring.move', 'Halka: işaret döngü dışına kayınca sol reddediliyor (yakın kazanç)', g.moved === g.n && !g.bad.kayanİşaretKabul, `${g.moved}/${g.n}`);
    check('rule.ring.old', 'Halka: 1–672 ve Günün Hattı bit bit aynı (kanca hiç çağrılmıyor, {ring:0} ≡ {}, eklentisiz özet tutuyor)', !g.calls && !g.old && !g.zero && !g.early && hashOk, JSON.stringify({ calls: g.calls, old: g.old, zero: g.zero, early: g.early, hash: hashOk ? 'ok' : g.hash }));
    check('rule.ring.line', 'Halka: M17 (673–748) her bölümde halka var; ilk 3 bölüm 6×8, halka ≤ 12 karo, 1 işaret; sonra 7×9, 2 işaret', g.own === 76 && !g.miss && introOk && g.genMs < 60, JSON.stringify({ own: g.own, miss: g.miss, intro: g.intro, genMs: g.genMs }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- 2. Çakışma: halka tabela ve köprüyle aynı bölümde olmaz ----------
  {
    // tabela/köprü eklentisi henüz yoksa (ayrı dal) yerine miktarı 0 olan kukla kural konur → rulesFor gerçek çakışmayı sınar
    const probe = await open(browser, URL, { save: { played: 1 } });
    const keys = await probe.page.evaluate(() => window.__ray.MODS.map(m => m.key)); await probe.ctx.close();
    const dummy = [['bridge', 10, 'Köprü'], ['sign', 12, 'Yön tabelası']].filter(([k]) => !keys.includes(k));
    const init = dummy.length ? `window.RAY_RULES = (window.RAY_RULES || []).concat(${JSON.stringify(dummy)}.map(([key, line, name]) => () => ({ key, line, card: { name, tag: name, demo: '', text: '' }, amount: () => 0 })));` : '';
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 1 }, init });
    const c = await page.evaluate(() => {
      const R = window.__ray; let ring = 0, sign = 0, bridge = 0, bad = 0;
      for (let l = 673; l <= 20000; l++) { const U = R.rulesFor(l); if (U.has('sign')) sign++; if (U.has('bridge')) bridge++; if (U.has('ring')) { ring++; if (U.has('sign') || U.has('bridge')) bad++; } }
      return { ring, sign, bridge, bad, clash: R.MODS.find(m => m.key === 'ring').clash };
    });
    check('rule.ring.clash', 'Halka: tabela ve köprüyle aynı bölümde hiç gelmiyor (673–20000, rulesFor)', !c.bad && c.ring > 1000 && c.sign > 500 && c.bridge > 500 && c.clash.includes('sign') && c.clash.includes('bridge'), JSON.stringify({ ...c, dummy: dummy.map(d => d[0]) }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- 3. Oyun: kural kartı, açık halka, kapanma (çember dolar), kazanma ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 672, level: 673, stars: starsUpTo(673), remindAsked: true } });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    const card = await page.evaluate(() => ({ open: document.getElementById('modal').classList.contains('open'), txt: document.querySelector('.sheet h2')?.textContent, p: document.querySelector('.sheet p')?.textContent, demo: !!document.querySelector('.rd-ring svg'), icon: !!document.querySelector('.sheet p .rd-ring-i') }));
    await page.waitForTimeout(1600); await shot(page, 'rule-ring');
    if (card.open) await page.click('#mGo');
    await page.waitForTimeout(400);
    const g0 = await page.evaluate(() => { const G = window.__ray.G; return { size: G.cols + 'x' + G.rows, cyc: G.ring?.cyc.length, marks: G.ring?.mark.filter(Boolean).length, rOn: G.L.rOn, seen: JSON.parse(localStorage.getItem('ray')).seen?.[16] }; });
    await shot(page, 'ring-open');
    // halkayı kapat, bir durağı (tek kollu, döngü dışı) bozuk bırak → hat bağlı kalır, bölüm bitmez (gerçek dokunuşlar)
    const plan = await page.evaluate(() => {
      const { G, rot } = window.__ray, taps = [], need = i => { let k = 0, t = G.cur[i]; while (t !== G.sol[i] && k < 4) { t = rot(t); k++; } return k; };
      const st = G.cur.map((v, i) => i).filter(i => i !== G.hub && !G.pinned[i] && [1, 2, 4, 8].includes(G.sol[i])), hold = st.find(i => need(i) > 0) ?? st[0];
      G.cur.forEach((v, i) => { if (i !== hold && !G.pinned[i]) for (let k = need(i); k > 0; k--) taps.push(i); });
      if (!need(hold)) taps.push(hold);
      return { taps, hold };
    });
    await page.evaluate(() => { const t = document.getElementById('toast'); window.__toasts = []; new MutationObserver(() => window.__toasts.push(t.textContent)).observe(t, { childList: true, characterData: true, subtree: true }); });
    for (const i of plan.taps) await tapTile(page, i);
    await page.waitForTimeout(450);
    const g1 = await page.evaluate(() => { const G = window.__ray.G; return { rOn: G.L.rOn, won: G.won, toasts: window.__toasts, told: JSON.parse(localStorage.getItem('ray')).ringTold }; });
    await shot(page, 'ring-closed');
    const sv = await getSave(page);
    const taps = await solve(page, 8), won = await waitModal(page);
    const g2 = await page.evaluate(() => { const G = window.__ray.G; return { won: G.won, rOn: G.L.rOn, inCore: G.ring.mark.every((v, i) => !v || G.L.core[i]) }; });
    await shot(page, 'ring-win');
    check('rule.ring.card', 'M17 ilk girişte "YENİ KURAL · Halka hat" kartı (animasyonlu demo, satır içi kesik çember simgesi)', card.open && /Halka hat/.test(card.txt || '') && /kesik çemberli/.test(card.p || '') && card.demo && card.icon && g0.seen === 1, JSON.stringify(card));
    check('rule.ring.play', 'Halka: 673 6×8, 1 işaret, kesik başlar; döngü işaretten kapanınca çember dolar (bir kez açıklama), kazanmaz; kalan karo çözülünce kazanır', g0.size === '6x8' && g0.marks === 1 && g0.cyc <= 12 && g0.rOn === 0 && g1.rOn === 1 && !g1.won && g1.toasts.some(s => /çember doldu/.test(s)) && sv.ringTold === 1 && won && g2.won && g2.rOn === 1 && g2.inCore,
      JSON.stringify({ g0, g1, taps: plan.taps.length + taps, won, g2 }));
    errs.push(...errors); await ctx.close();
  }

  // 7×9, 2 işaretli, karanlıksız ve birimsiz bir M17 bölümü (4 ve 6 için)
  const p0 = await open(browser, URL, { save: { played: 1 } });
  const { L7, LF } = await p0.page.evaluate(() => {
    const R = window.__ray; let L7 = 0, LF = 0;
    for (let l = 676; l <= 748 && !L7; l++) { const U = R.rulesFor(l); if ([...U].every(k => ['ring', 'pins', 'pairs', 'rev', 'cnt'].includes(k))) L7 = l; }
    for (let l = 749; l < 3000 && !LF; l++) { const U = R.rulesFor(l); if (U.has('ring') && U.has('fog')) LF = l; }
    return { L7, LF };
  });
  await p0.ctx.close();

  // ---------- 4. Yakın kazanç: her şey bağlı ama halka işaretten geçmiyor → uyarı (bir kez), nabız, kazanma yok · açık tema ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { scheme: 'light', save: { played: L7 - 1, level: L7, stars: starsUpTo(L7), seen: SEEN, remindAsked: true, ringTold: 1 } });
    await page.click('#bPlay'); await page.waitForTimeout(600);
    const s = await page.evaluate(() => {
      const R = window.__ray, G = R.G, cyc = new Set(G.ring.cyc), mk = G.ring.mark.slice(), unrot = m => ((m >> 1) | (m << 3)) & 15;
      const off = G.cur.map((v, i) => i).filter(i => !cyc.has(i) && i !== G.hub && R.rot(G.sol[i]) !== G.sol[i]), m0 = mk.indexOf(true);
      mk[m0] = false; mk[off[0]] = true; G.ring = { ...G.ring, mark: mk };   // yalnız bu oyunun kopyası (önbellekteki P.ring değişmez)
      // tek dokunuşla tamamlanacak karo: döngüde, dört yönlü dönen, çıplak
      const t = G.ring.cyc.find(i => i !== G.hub && !mk[i] && !G.pinned[i] && !G.rev[i] && G.cnt[i] < 0 && G.link[i] < 0 && R.rot(R.rot(G.sol[i])) !== G.sol[i]);
      G.cur = G.sol.slice(); G.cur[t] = unrot(G.sol[t]); G.L = R.lit(G);
      const el = document.getElementById('toast'); window.__toasts = []; new MutationObserver(() => window.__toasts.push(el.textContent)).observe(el, { childList: true, characterData: true, subtree: true });
      return { t, moved: off[0], near0: G.L.ringNear, size: G.cols + 'x' + G.rows, marks: mk.filter(Boolean).length };
    });
    await tapTile(page, s.t); await page.waitForTimeout(200);
    await shot(page, 'ring-warn');
    const w1 = await page.evaluate(() => { const G = window.__ray.G; return { near: G.L.ringNear, solved: G.L.solved, won: G.won, warn: G.ringWarn, pulse: !!G.ringPulse, rOn: G.L.rOn }; });
    for (let k = 0; k < 4; k++) { await tapTile(page, s.t); await page.waitForTimeout(120); }   // açıp yeniden aynı yakın kazanca dön
    await page.waitForTimeout(500);
    const w2 = await page.evaluate(() => { const G = window.__ray.G; return { near: G.L.ringNear, won: G.won, warns: window.__toasts.filter(x => /kesik çemberli karodan geçmeli/.test(x)).length }; });
    check('rule.ring.warn', `Halka (bölüm ${L7}, 7×9): her şey bağlı ama halka işaretten geçmiyorsa kazanılmaz; "kesik çemberli karodan geçmeli" bir kez söylenir, işaret nabız atar`, s.size === '7x9' && s.marks === 2 && !s.near0 && w1.near && !w1.solved && !w1.won && w1.warn === 1 && w1.pulse && w2.near && !w2.won && w2.warns === 1, JSON.stringify({ s, w1, w2 }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- 5. Karma bölüm: halka + karanlık tünel (ışığı izleyen robot kazanır) ----------
  {
    const lvl = LF;
    const { ctx, page, errors } = await open(browser, URL, { save: { played: lvl - 1, level: lvl, stars: starsUpTo(lvl), seen: SEEN, remindAsked: true, ringTold: 1 } });
    await page.click('#bPlay'); await page.waitForTimeout(600);
    const m0 = await page.evaluate(() => { const G = window.__ray.G; return { ring: !!G.ring, fog: G.fog, rules: G.rules, dark: G.seen.filter(v => !v).length }; });
    await shot(page, 'ring-fog');
    const taps = await solve(page, 8), won = await waitModal(page);
    check('rule.ring.mix', `Halka + karanlık tünel (bölüm ${lvl}): ışığı izleyen çözüm kazanır`, lvl && m0.ring && m0.fog && m0.dark > 5 && won, JSON.stringify({ lvl, ...m0, taps, won }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- 6. Düşük donanım: halka kapalıyken (çift ray + düz çember her karede) 4× yavaş CPU ----------
  // Kare temposu değil, çizimin kendi süresi ölçülür (rAF geri çağrısı ve halka kancaları): aynı makinede koşan öteki işler sonucu bozmaz.
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: L7 - 1, level: L7, stars: starsUpTo(L7), seen: SEEN, remindAsked: true, ringTold: 1 } });
    await page.click('#bPlay'); await page.waitForTimeout(500);
    const off = await page.evaluate(() => {
      // duraklar dışında her karo çözümde → halka yanar ve kapalı; dokunuşlar yalnız duraklara (hat bağlı kalır)
      const R = window.__ray, G = R.G, st = G.cur.map((v, i) => i).filter(i => i !== G.hub && !G.pinned[i] && G.link[i] < 0 && G.cnt[i] < 0 && [1, 2, 4, 8].includes(G.sol[i]));
      G.cur = G.sol.map((v, i) => st.includes(i) ? R.rot(v) : v); G.L = R.lit(G);
      const m = R.MODS.find(q => q.key === 'ring'), raf = window.requestAnimationFrame; let hk = 0;
      window.__dt = []; window.__hk = [];
      for (const h of ['rails', 'over']) { const f = m[h]; m[h] = function (D) { const a = performance.now(), r = f.call(this, D); hk += performance.now() - a; return r; }; }
      window.requestAnimationFrame = cb => raf(t => { hk = 0; const a = performance.now(); cb(t); window.__dt.push(performance.now() - a); window.__hk.push(hk); });
      return { rOn: G.L.rOn, tiles: st.slice(0, 30) };
    });
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    for (let k = 0; k < 30; k++) { await tapTile(page, off.tiles[k % off.tiles.length]); await page.waitForTimeout(60); }
    await page.waitForTimeout(800);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const r = await page.evaluate(() => {
      const q = (a, p) => { a = a.slice().sort((x, y) => x - y); return +(a[Math.min(a.length - 1, Math.floor(a.length * p))] || 0).toFixed(2); };
      return { n: window.__dt.length, d50: q(window.__dt, .5), d95: q(window.__dt, .95), h50: q(window.__hk, .5), h95: q(window.__hk, .95), on: window.__ray.G.L.rOn };
    });
    check('rule.ring.perf', '4× yavaş CPU, halkalı 7×9 (kapalı halka): kare çizimi ortanca < 8 ms, halka kancaları ortanca < 1 ms', off.rOn === 2 && r.on === 2 && r.n > 60 && r.d50 < 8 && r.h50 < 1,
      `çizim p50 ${r.d50} · p95 ${r.d95} ms · halka kancaları p50 ${r.h50} · p95 ${r.h95} ms · ${r.n} kare`, 'medium');
    errs.push(...errors); await ctx.close();
  }

  check('rule.ring.errors', 'Halka senaryolarında konsol hatası yok', !errs.length, errs.join(' | '));
};
