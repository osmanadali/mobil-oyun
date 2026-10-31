// M20 · Tarife bölgesi — robot testleri (hakem.cjs K bölümü çağırır). Sözleşme: docs/kurallar/README.md
module.exports = async T => {
  const { browser, URL, open, check, solve, shot, getSave, tapTile, waitModal, starsUpTo } = T;
  const seen = Object.fromEntries(Array.from({ length: 18 }, (_, k) => [k + 2, 1]));   // 2–19: bütün kural kartları görülmüş
  const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  // sayfa içi yardımcılar: sınır sayımı (eklentiden bağımsız), çözüm bulma/sayma (çözücünün yaprağı), yakın kazanç dizilimi
  const HELP = `window.__zh = (() => {
    const R = window.__ray, D = [[1, 0, -1, 4], [2, 1, 0, 8], [4, 0, 1, 1], [8, -1, 0, 2]];
    const count = (P, m) => { const pr = P.zone.pr; let b = 0, t = 0; for (let p = 0; p < pr.length; p += 3) { const k = pr[p + 1], u = !!(m[pr[p]] & D[k][0]), v = !!(m[pr[p + 2]] & D[k][3]); if (u && v) b++; else if (u || v) t++; } return [b, t]; };
    const find = (P, max = 2, cap = 20000) => { const out = []; R.difficulty(P, cfg => { if (R.lit({ ...P, cur: cfg }).solved) out.push(cfg); return out.length >= max; }, cap); return out; };
    // yakın kazanç: sayıları değiştirilmiş bölgeyle çözülen dizilim → gerçek bölgede her şey bağlı, sayılar tutmuyor
    const near = P => { for (const [dB, dT] of [[0, 1], [-1, 1], [1, 1], [-2, 0], [2, 0], [-1, 0], [1, 0], [0, 2]]) { const Z = { ...P.zone, B: P.zone.B + dB, T: P.zone.T + dT }; if (Z.B < 0) continue; const c = find({ ...P, zone: Z }, 1, 4000)[0]; if (c) return c; } return null; };
    return { count, find, near };
  })();`;

  // 1) üretim, kazanma denetimi, çözücü, zorluk, eski bölümler, karışım, hattın ortalaması (tek sayfa, gerçek kod)
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 4 } });
    await page.evaluate(HELP);
    const r = await page.evaluate(() => {
      const R = window.__ray, Z = window.__zh, D = [[1, 0, -1, 4], [2, 1, 0, 8], [4, 0, 1, 1], [8, -1, 0, 2]];
      const o = { bad: 0, T: 0, Bok: 0, edge: 0, noBuf: 0, loose: 0, near: 0, nearN: 0, uns: 0, uniq: 0, kept: 0, rej: 0 };
      for (const [c, rw] of [[7, 9], [6, 8]]) for (let s = 1; s <= 150; s++) {
        const P = R.generate(c, rw, s * 7919, 0, 0, { zone: 1 }), n = P.cur.length, hx = P.hub % c, hy = P.hub / c | 0;
        if (!R.lit({ ...P, cur: P.sol }).solved) o.bad++;
        if (P.zone.T === 1 || P.reject) o.T++;   // tampon konamadıysa (nadir) aday reddedilir
        const [b, t] = Z.count(P, P.sol); if (b === P.zone.B && t === P.zone.T) o.Bok++;
        // sınır kenarları: tam olarak Chebyshev 1 karesinin iç/dış komşu çiftleri, open simetrik
        const inZ = i => Math.max(Math.abs(i % c - hx), Math.abs((i / c | 0) - hy)) <= 1;
        let e = 0; for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) { const x = i % c + D[k][1], y = (i / c | 0) + D[k][2]; if (x < 0 || y < 0 || x >= c || y >= rw) { if (P.zone.E[i * 4 + k]) e++; continue; } const j = y * c + x; if (!!P.zone.E[i * 4 + k] !== (inZ(i) !== inZ(j)) || P.zone.E[i * 4 + k] !== P.zone.E[j * 4 + ((k + 2) & 3)]) e++; }
        if (e || P.zone.pr.length / 3 !== 12) o.edge++;
        // tampon kolu kesilirse (T = 0) çözülmez · sınır dışında eşsiz kol gevşek uçtur
        if (P.zone.T) { const [i, k] = P.zone.at[0], cur = P.sol.slice(); cur[i] &= ~D[k][0]; if (R.lit({ ...P, cur }).solved) o.noBuf++; }
        { let done = 0; for (let i = 0; i < n && !done; i++) for (let k = 0; k < 4 && !done; k++) { const x = i % c + D[k][1], y = (i / c | 0) + D[k][2], j = y * c + x; if (x < 0 || y < 0 || x >= c || y >= rw || P.zone.E[i * 4 + k] || (P.sol[i] & D[k][0]) || (P.sol[j] & D[k][3])) continue; const cur = P.sol.slice(); cur[i] |= D[k][0]; done = 1; if (R.lit({ ...P, cur }).solved) o.loose++; } if (!done) o.loose++; }
        // yakın kazanç: her şey bağlı ama sayılar tutmuyor → L.zNear, çözülmedi
        if (s <= 40) { const cfg = Z.near(P); if (cfg) { o.nearN++; const L = R.lit({ ...P, cur: cfg }); if (L.zNear && !L.solved) o.near++; } }
        // çözücü sağlam: büyük tavanla bir çözüm bulur · reddedilmeyen aday tek çözümlü
        const f = Z.find(P, 2); if (!f.length) o.uns++;
        if (P.reject) o.rej++; else { o.kept++; if (f.length === 1) o.uniq++; }
      }
      // aynı tohum ve boyut, kural açık/kapalı (≥150 tohum)
      const dd = (c, rw) => { let a = 0, b = 0; for (let s = 1; s <= 160; s++) { a += R.difficulty(R.generate(c, rw, s * 31, 0, 0, {})); b += R.difficulty(R.generate(c, rw, s * 31, 0, 0, { zone: 1 })); } return [+(a / 160).toFixed(2), +(b / 160).toFixed(2)]; };
      const d79 = dd(7, 9), d68 = dd(6, 8);
      // {zone:0} → üretim ve zorluk birebir (R() tüketilmez)
      let same = 0;
      for (let s = 1; s <= 60; s++) { const a = R.generate(7, 9, s, 3, 2, { zone: 0, rev: 3, two: s % 2 }), b = R.generate(7, 9, s, 3, 2, { rev: 3, two: s % 2 }); if (!a.zone && JSON.stringify(a) === JSON.stringify(b) && R.difficulty(a) === R.difficulty(b)) same++; }
      // karma hatlar: rulesFor'da bölge taşıyan ≥ 300 bölüm (M21+) üretilir, çözüm geçerli, çakışanlar dışlanmış
      const L0 = R.lineStart(19), s0 = R.lineStart(20), mix = { n: 0, bad: 0, clash: 0, with: {} };
      for (let l = 1; l < L0; l++) if (R.rulesFor(l).has('zone')) mix.early = (mix.early || 0) + 1;
      for (let l = s0; mix.n < 300 && l < s0 + 12000; l++) {
        const U = R.rulesFor(l); if (!U.has('zone')) continue; mix.n++;
        if (['two', 'river'].some(k => U.has(k))) mix.clash++;
        const P = R.puzzleFor(l); if (!P.zone || !R.lit({ ...P, cur: P.sol }).solved) mix.bad++;
        for (const k of U) if (k !== 'zone') mix.with[k] = (mix.with[k] || 0) + 1;
      }
      // yüklü her eklentiyle doğrudan (sabit, eşli, karanlık dönüşümlü): çözüm çözülü, çözücü bir çözüm bulur
      const direct = {}; for (const k of R.MODS.map(m => m.key).filter(k => !['zone', 'river'].includes(k))) { let b = 0; for (let s = 1; s <= 60; s++) { const P = R.generate(7, 9, s * 131, 2, 1, { zone: 1, [k]: 2, fog: !!(s % 2) }); if (!R.lit({ ...P, cur: P.sol }).solved || !Z.find(P, 1).length) b++; } direct[k] = b; }
      // hattın ortalaması (puzzleFor, boost dahil) · M19 ile karşılaştırma
      const avg = ln => { let a = 0, n = 0; for (let l = R.lineStart(ln); l < R.lineStart(ln + 1); l++) { a += R.puzzleFor(l).diff; n++; } return +(a / n).toFixed(2); };
      const P913 = R.puzzleFor(L0), cut = l => R.puzzleFor(l).cols + 'x' + R.puzzleFor(l).rows;
      return { ...o, d79, d68, same, mix, direct, m19: avg(18), m20: avg(19), L0, p913: { rules: P913.rules, T: P913.zone?.T, size: cut(L0), saw: [L0 + 2, L0 + 3].map(cut), rej: !!P913.reject } };
    });
    check('rule.zone.gen', 'Tarife bölgesi: 300 tohum (7×9, 6×8) → çözüm çözülü, 1 tampon (konamazsa reddedilir), sınır 3×3 karenin 12 kenarı (open simetrik), rozet sayıları çözümle aynı', r.bad === 0 && r.T === 300 && r.Bok === 300 && r.edge === 0, JSON.stringify({ bad: r.bad, T: r.T, Bok: r.Bok, edge: r.edge }));
    check('rule.zone.check', 'Tampon kesilirse çözülmez · sınır dışındaki eşsiz kol gevşek uç · her şey bağlı ama sayı tutmuyorsa L.zNear ve çözülmedi', r.noBuf === 0 && r.loose === 0 && r.nearN >= 10 && r.near === r.nearN, JSON.stringify({ noBuf: r.noBuf, loose: r.loose, near: r.near, nearN: r.nearN }));
    check('rule.zone.solver', 'Çözücü sağlam (prune hiçbir tohumda çözümü kesmiyor) · reddedilmeyen aday rozetteki bilgiyle tek çözümlü', r.uns === 0 && r.uniq === r.kept && r.kept > 200, JSON.stringify({ uns: r.uns, uniq: r.uniq, kept: r.kept, rej: r.rej }));
    check('rule.zone.diff', 'Zorluk katıyor: aynı tohum ve boyutta (160 tohum) kural açık/kapalı difficulty() farkı ≥ +1 (7×9 ve 6×8)', r.d79[1] - r.d79[0] >= 1 && r.d68[1] - r.d68[0] >= 1, `7×9 ${r.d79.join(' → ')} · 6×8 ${r.d68.join(' → ')}`);
    check('rule.zone.line', 'M20 bölümlerinin ortalama zorluğu M19\'dan en az +1 yüksek (boost dahil)', r.m20 >= r.m19 + 1, `M19 ${r.m19} → M20 ${r.m20}`);
    check('rule.zone.old', 'Eski bölümler: {zone:0} üretim + zorluk birebir, 1–912 hiçbir bölümde bölge yok', r.same === 60 && !r.mix.early, JSON.stringify({ same: r.same, early: r.mix.early || 0 }));
    check('rule.zone.mix', 'Karma hatlar: bölge taşıyan 300 bölüm üretilir, çözüm geçerli, iki merkez/nehir ile hiç gelmez; yüklü her eklentiyle doğrudan üretimde çözüm geçerli ve bulunur', r.mix.n === 300 && r.mix.bad === 0 && r.mix.clash === 0 && Object.values(r.direct).every(v => v === 0),
      JSON.stringify({ mix: r.mix, direct: r.direct }));
    check('rule.zone.intro', `Bölüm ${r.L0} (tanıtım): yalnız bölge, 6×8, 1 tampon; testere dişi 3 bölüm sonra 7×9`, r.L0 === 913 && r.p913.rules.join() === 'zone' && r.p913.T === 1 && r.p913.size === '6x8' && !r.p913.rej && r.p913.saw.join() === '6x8,7x9', JSON.stringify(r.p913), 'medium');
    check('rule.zone.errors', 'Tarife bölgesi üretim testinde konsol hatası yok', !errors.length, errors.join(' | '));
    await ctx.close();
  }

  // 2) eski bölümler bit bit aynı: kural dosyası yüklü / yüksüz 1–912 ve Günün Hattı imzası eşit
  {
    const sig = async block => {
      // hizmet çalışanı kapalı: yoksa önbellekten gelen dosya yönlendirmeyi atlar
      const ctx = await browser.newContext({ serviceWorkers: 'block' }); await ctx.addInitScript('window.__noIntro = true');
      if (block) await ctx.route('**/rules/tarife-bolgesi.js', q => q.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
      const page = await ctx.newPage(); await page.goto(URL); await page.waitForTimeout(300);
      const r = await page.evaluate(() => {
        const R = window.__ray, H = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0).toString(36); };
        const pz = P => P.sol.join('') + '|' + P.cur.join('') + '|' + P.diff + '|' + P.par + '|' + P.taps + '|' + (P.rules || []).join();
        const a = []; for (let l = 1; l < R.lineStart(19); l++) a.push(pz(R.puzzleFor(l)));
        const d = []; for (let k = 0; k < 20; k++) d.push(pz(R.dailyBase(new Date(Date.UTC(2026, 0, 1) + k * 17 * 864e5).toISOString().slice(0, 10))));
        return { lv: H(a.join(';')), day: H(d.join(';')), n: a.length, zone: R.MODS.some(m => m.key === 'zone') };
      });
      await ctx.close(); return r;
    };
    const a = await sig(false), b = await sig(true);
    check('rule.zone.fp', 'Parmak izi: tarife-bolgesi.js yüklü/yüksüz 1–912. bölüm ve 20 Günün Hattı aynı', a.zone && !b.zone && a.n === 912 && a.lv === b.lv && a.day === b.day, JSON.stringify({ a, b }));
  }

  // 3) bölüm 913 (360 px): kural kartı, rozet tahta dışında, ipucu, ↺ baştan, yarım oyun, robot kazanır
  {
    const save = { played: 912, level: 913, stars: starsUpTo(913), seen: { ...seen, 19: 0 }, remindAsked: true, hints: 3, hintDay: ymd(new Date()) };
    const { ctx, page, errors } = await open(browser, URL, { vp: [360, 740], save });
    await page.evaluate(HELP);
    await page.click('#bPlay'); await page.waitForTimeout(900);
    const card = await page.evaluate(() => ({ open: document.getElementById('modal').classList.contains('open'), txt: document.querySelector('.sheet h2')?.textContent, p: document.querySelector('.sheet p')?.textContent, demo: !!document.querySelector('.rd-zone svg'), anim: getComputedStyle(document.querySelector('.rd-zone-x') || document.body).animationName }));
    await shot(page, 'rule-zone');
    if (card.open) await page.click('#mGo');
    await page.waitForTimeout(400);
    const g0 = await page.evaluate(() => {
      const { G, geo } = window.__ray, W = document.getElementById('cv').getBoundingClientRect().width, b = G.zBadge || [];
      return { lvl: G.lvl, size: G.cols + 'x' + G.rows, s: geo.s, B: G.zone.B, T: G.zone.T, badge: b.map(Math.round), out: b[1] >= 0 && b[3] <= geo.oy + 3 && b[0] >= 0 && b[2] <= W, seen: JSON.parse(localStorage.getItem('ray')).seen?.[19] };
    });
    await shot(page, 'zone');
    // yarım oyun: birkaç dokunuş → yeniden yükle → aynı dizilim ve hamle
    const pre = await page.evaluate(() => { const G = window.__ray.G; return G.cur.map((v, i) => i).filter(i => i !== G.hub && G.cur[i] !== G.sol[i]).slice(0, 3); });
    for (const i of pre) await tapTile(page, i);
    await page.waitForTimeout(300);
    const st1 = await page.evaluate(() => { const G = window.__ray.G; return { cur: G.cur.join(), moves: G.moves }; });
    await page.reload(); await page.waitForTimeout(400); await page.evaluate(HELP);
    await page.click('#bPlay'); await page.waitForTimeout(600);
    const st2 = await page.evaluate(() => { const G = window.__ray.G; return { cur: G.cur.join(), moves: G.moves, lvl: G.lvl, modal: document.getElementById('modal').classList.contains('open') }; });
    // ↺ baştan: başlangıç dizilimine döner, hamle 0
    await page.click('#bReset'); await page.waitForTimeout(400);
    const st3 = await page.evaluate(() => { const { G, puzzleFor } = window.__ray; return { moves: G.moves, same: G.cur.join() === puzzleFor(913).cur.join() }; });
    // ipucu: bir karo çözüm yönüne sabitlenir, rozet sayımı güncel
    await page.click('#bHint'); await page.waitForTimeout(500);
    const h = await page.evaluate(() => { const G = window.__ray.G, i = G.fixed.indexOf(true), c = window.__zh.count(G, G.cur); return { fixed: G.fixed.filter(Boolean).length, ok: i >= 0 && G.cur[i] === G.sol[i], live: G.L.zb === c[0] && G.L.zt === c[1] }; });
    const taps = await solve(page, 12), won = await waitModal(page);
    const g2 = await page.evaluate(() => { const G = window.__ray.G; return { won: G.won, zb: G.L.zb, zt: G.L.zt, B: G.zone.B, T: G.zone.T }; });
    await shot(page, 'zone-win');
    check('rule.zone.card', 'Bölüm 913 ilk girişte "YENİ KURAL · Tarife bölgesi" kartı (animasyonlu demo), kart görüldü sayılır', card.open && /Tarife bölgesi/.test(card.txt || '') && /tampon/.test(card.p || '') && card.demo && card.anim === 'rd-zone-x' && g0.seen === 1, JSON.stringify(card), 'medium');
    check('rule.zone.badge', '360 px, 6×8: rozet karoların üstünde değil, tahtanın üstünde ve ekranda', g0.lvl === 913 && g0.size === '6x8' && g0.out && g0.badge.length === 4, JSON.stringify(g0), 'medium');
    check('rule.zone.resume', 'Bölge bölümünde yarım oyun kaydı: yeniden açınca aynı dizilim ve hamle; ↺ baştan başlangıca döner', st2.lvl === 913 && st2.cur === st1.cur && st2.moves === st1.moves && st1.moves === pre.length && st3.moves === 0 && st3.same, JSON.stringify({ st1: st1.moves, st2: { moves: st2.moves, lvl: st2.lvl, same: st2.cur === st1.cur }, st3 }));
    check('rule.zone.hint', 'İpucu bölge bölümünde bir karoyu çözüme sabitler, rozet sayımı canlı', h.fixed === 1 && h.ok && h.live, JSON.stringify(h));
    check('rule.zone.win', 'Bölüm 913: robot solve() ile kazanır, rozetler tutar', won && g2.won && g2.zb === g2.B && g2.zt === g2.T, JSON.stringify({ taps, ...g2 }));
    check('rule.zone.errors2', 'Bölüm 913 senaryosunda konsol hatası yok', !errors.length, errors.join(' | '));
    await ctx.close();
  }

  // 3b) yakın kazanç (açık tema): sayıları tutmayan bağlı dizilimi olan ilk yalın M20 bölümü
  {
    const p0 = await open(browser, URL, { save: { played: 4 } });
    await p0.page.evaluate(HELP);
    const lvl = await p0.page.evaluate(() => { const R = window.__ray; for (let l = R.lineStart(19) + 1; l < R.lineStart(20); l++) if ([...R.rulesFor(l)].join() === 'zone' && window.__zh.near(R.puzzleFor(l))) return l; return 0; });
    await p0.ctx.close();
    const { ctx, page, errors } = await open(browser, URL, { scheme: 'light', save: { played: lvl - 1, level: lvl, stars: starsUpTo(lvl), seen, remindAsked: true, zoneTold: 1 } });
    await page.evaluate(HELP);
    await page.click('#bPlay'); await page.waitForTimeout(600);
    // yakın kazanç: sayıları tutmayan bağlı dizilime tek dokunuşla gel → kazanılmaz, bir kez uyarı, rozet nabız
    const nz = await page.evaluate(() => {
      const R = window.__ray, G = R.G, cfg = window.__zh.near(G); if (!cfg) return null;
      const t = cfg.findIndex((v, i) => i !== G.hub && !G.fixed[i] && R.rot(v) !== v), unrot = m => ((m >> 1) | (m << 3)) & 15;
      G.cur = cfg.slice(); G.cur[t] = unrot(cfg[t]); G.L = R.lit(G);
      const el = document.getElementById('toast'); window.__toasts = []; new MutationObserver(() => window.__toasts.push(el.textContent)).observe(el, { childList: true, characterData: true, subtree: true });
      return { t, near0: !!G.L.zNear };
    });
    if (nz) { await tapTile(page, nz.t); await page.waitForTimeout(300); }
    const w = await page.evaluate(() => { const G = window.__ray.G; return { near: !!G.L.zNear, won: G.won, warn: G.zWarn, pulse: !!G.zPulse, toasts: window.__toasts || [] }; });
    await shot(page, 'zone-warn');
    check('rule.zone.warn', `Bölüm ${lvl}: her şey bağlı ama geçiş/tampon sayısı tutmuyorsa kazanılmaz, "Sınırdan … geçmeli" bir kez söylenir, rozet nabız atar`, nz && !nz.near0 && w.near && !w.won && w.warn === 1 && w.pulse && w.toasts.some(s => /Sınırdan \d+ hat geçmeli/.test(s)), JSON.stringify({ lvl, nz, w }));
    const taps = await solve(page, 8), won = await waitModal(page);
    check('rule.zone.warnwin', `Bölüm ${lvl}: uyarıdan sonra robot kazanır`, won && !errors.length, JSON.stringify({ taps, won, errors }));
    await ctx.close();
  }

  // 4) karma bölümler: tünel ağzı (üst sekme rozetle çakışmaz) ve karanlık tünel (ışığı izleyen robot kazanır) · koyu tema
  {
    const p0 = await open(browser, URL, { save: { played: 4 } });
    const L = await p0.page.evaluate(() => { const R = window.__ray, o = {}; for (let l = R.lineStart(19) + 3; l < R.lineStart(19) + 3000 && !(o.portal && o.fog); l++) { const U = R.rulesFor(l); if (!U.has('zone')) continue; if (!o.portal && U.has('portal') && !U.has('fog')) o.portal = l; if (!o.fog && U.has('fog')) o.fog = l; } return o; });
    await p0.ctx.close();
    for (const k of ['portal', 'fog']) {
      const lvl = L[k];
      const { ctx, page, errors } = await open(browser, URL, { vp: [360, 740], scheme: 'dark', save: { played: lvl - 1, level: lvl, stars: starsUpTo(lvl), seen, remindAsked: true, zoneTold: 1 } });
      await page.click('#bPlay'); await page.waitForTimeout(700);
      if (await page.evaluate(() => document.getElementById('modal').classList.contains('open'))) { await page.click('#mGo'); await page.waitForTimeout(300); }
      const g = await page.evaluate(() => {
        const { G, geo } = window.__ray, b = G.zBadge, s = geo.s;
        const tabs = (G.portal || []).flatMap(p => [[p.a, p.ka], [p.b, p.kb]]).filter(([, k]) => k === 0).map(([i]) => geo.ox + (i % G.cols) * s + s / 2);
        return { rules: G.rules, fog: G.fog, dark: G.seen ? G.seen.filter(v => !v).length : 0, size: G.cols + 'x' + G.rows, out: b[3] <= geo.oy + 3, free: tabs.every(t => t + s * .27 < b[0] || t - s * .27 > b[2]) };
      });
      await shot(page, 'zone-' + k);
      const taps = await solve(page, 8), won = await waitModal(page);
      check('rule.zone.' + k, `Bölge + ${k === 'portal' ? 'tünel ağzı' : 'karanlık tünel'} (bölüm ${lvl}, koyu tema, 360 px): rozet tahta dışında${k === 'portal' ? ' ve üst tünel sekmesiyle çakışmıyor' : ''}, robot kazanır`,
        lvl && g.rules.includes(k === 'portal' ? 'portal' : 'fog') && g.out && g.free && (k !== 'fog' || g.dark > 5) && won && !errors.length, JSON.stringify({ lvl, ...g, taps, won, errors }));
      await ctx.close();
    }
  }
};
