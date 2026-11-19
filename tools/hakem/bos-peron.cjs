// 🅿️ Boş peron (yard) — hakem.cjs K bölümü çağırır. Ayrıntı: docs/kurallar/bos-peron.md
// Üretim (çözüm geçerli, çözümde peronda gerçek boşluk, başlangıç çözülmüş değil ve çözümden geçerli kaydırmalarla ulaşılır; uyumlu her eklentiyle),
// çözücü peronu bilir, zorluk önce/sonra, çakışan kurallarla aynı bölümde gelmez, hat ve merdiven, eski bölümler bit bit aynı, kural kartı (9 dil, 320 px),
// kaydırma (yalnız boşluğa bitişik karo kayar, dönmez, 1 hamle), geri al, kayıt, ipucu (doğru yöne bir kaydırma), robot kazanır (hat başı, 7×9, karanlık tünel),
// konsol hatası yok, 4× yavaş CPU'da çizim ve üretim süresi.
module.exports = async T => {
  const { browser, URL, open, check, solve, shot, tapTile, waitModal, starsUpTo, RL, AT, seenTo } = T;
  const errs = [], XL = RL.yard, A = AT('yard');
  const NO_YD = `window.RAY_RULES = []; { const push = window.RAY_RULES.push.bind(window.RAY_RULES); window.RAY_RULES.push = f => push(api => { const m = f(api); return m?.key === 'yard' ? null : m; }); }`;
  // sayfa içi bağımsız denetçi: peron durumundan çözüme en kısa kaydırma sayısı (tek yönlü BFS, eklentinin koduna dayanmaz)
  const BFS = `window.__ybfs = (P, cur) => {
    const cells = P.yard.cells, w = P.cols, k = c => cells.map(q => c[q].toString(16)).join(''), a = k(cur), b = k(P.sol);
    const adj = cells.map(x => cells.map((y, j) => Math.abs(x % w - y % w) + Math.abs((x / w | 0) - (y / w | 0)) === 1 ? j : -1).filter(j => j >= 0));
    const D = new Map([[a, 0]]); let f = [a];
    while (f.length && !D.has(b)) { const nx = []; for (const s of f) { const p = s.indexOf('0'); for (const q of adj[p]) { const t = s.split(''); t[p] = s[q]; t[q] = '0'; const u = t.join(''); if (!D.has(u)) { D.set(u, D.get(s) + 1); nx.push(u); } } } f = nx; if (D.size > 4e5) break; }
    return D.has(b) ? D.get(b) : -1;
  };`;

  // ---------- a) üretim, çözücü, zorluk ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 9 }, init: BFS });
    const g = await page.evaluate(XL => {
      const R = window.__ray, o = { n: 0, none: 0, bad: 0, pre: 0, place: 0, gap: 0, perm: 0, unit: 0, dist: 0, par: 0, other: 0, leafBad: 0, found: 0, ms: 0, dmin: 99, dmax: 0 };
      const me = R.MODS.find(m => m.key === 'yard'), keys = R.MODS.map(m => m.key).filter(k => k !== 'yard' && !me.clash.includes(k));
      const popc = m => (m & 1) + (m >> 1 & 1) + (m >> 2 & 1) + (m >> 3 & 1), ms = a => a.slice().sort((x, y) => x - y).join();
      let gt = 0;
      for (const [c, r] of [[6, 8], [7, 9]]) for (const x of [{}, { two: true }, { fog: true, rev: 3, cnt: 3 }, ...keys.map(k => ({ [k]: 2 }))]) for (let s = 1; s <= 10; s++) {
        const want = 4 + s % 6, t0 = performance.now(), P = R.generate(c, r, s * 7919 + 211, 0, s % 3 || Object.keys(x).some(q => keys.includes(q)) ? 0 : 2, { ...x, yard: want }); gt += performance.now() - t0; o.n++;
        if (!R.lit({ ...P, cur: P.sol }).solved) o.bad++;
        if (R.lit(P).solved) o.pre++;
        if (!P.yard) { o.none++; continue; }
        const cells = P.yard.cells, xs = cells.map(q => q % c), ys = cells.map(q => q / c | 0), x0 = Math.min(...xs), y0 = Math.min(...ys);
        // 3×3 bitişik blok, kenara değer, merkez yok
        if (cells.length !== 9 || Math.max(...xs) - x0 !== 2 || Math.max(...ys) - y0 !== 2 || !(x0 === 0 || y0 === 0 || x0 === c - 3 || y0 === r - 3) || cells.some(q => q === P.hub || q === P.hub2)) o.place++;
        // çözümde tahtada tek boş hücre (maske 0) ve peronda; başlangıçta da peronda tek boşluk; çözüm ağacında yaprak/kol tutarlı (lit sol ile)
        if (P.sol.filter(m => !m).length !== 1 || cells.filter(q => !P.sol[q]).length !== 1 || cells.filter(q => !P.cur[q]).length !== 1 || cells.some(q => P.sol[q] && popc(P.sol[q]) < 1)) o.gap++;
        // karolar yalnız yer değiştirir (dönmez): peron maskelerinin çoklu kümesi aynı
        if (ms(cells.map(q => P.cur[q])) !== ms(cells.map(q => P.sol[q]))) o.perm++;
        // her hücre tek karoluk birim, eşli/ters/sayaçlı değil
        if (cells.some(q => { const U = P.units?.[P.unitOf?.[q]]; return !U || U.kind !== 'yard' || U.cells.length !== 1 || P.link[q] >= 0 || P.rev[q] || P.cnt[q] >= 0; })) o.unit++;
        // çözüme ulaşılır: bağımsız BFS uzaklığı = eklentinin uzaklığı ≥ 3; par bu kaydırmaları içerir
        const d = window.__ybfs(P, P.cur); o.dmin = Math.min(o.dmin, d); o.dmax = Math.max(o.dmax, d);
        if (d < 3 || d !== P.yard.d) o.dist++;
        if (P.taps < d || P.par < d) o.par++;
        // başka eklentilerin işaretleri peron hücrelerine düşmez
        for (const k of Object.keys(x).filter(k => keys.includes(k))) { const v = P[k]; const arr = Array.isArray(v) && v.length === P.cur.length ? v : v?.mark?.length === P.cur.length ? v.mark : null; if (arr && cells.some(q => arr[q])) o.other++; }
        // çözücü: yapraktaki dizilimlerde peron karoları bir permütasyon; çözüm bulunur (tavan 2000)
        let hit = false;
        R.difficulty(P, cfg => { if (ms(cells.map(q => cfg[q])) !== ms(cells.map(q => P.cur[q]))) o.leafBad++; if (R.lit({ ...P, cur: cfg }).solved) hit = true; return hit; }, 2000);
        if (hit) o.found++;
      }
      o.ms = +(gt / o.n).toFixed(1);
      // zorluk önce/sonra: aynı tohumlar, 7×9, kuralsız ↔ peron (uzaklık 9)
      const dv = x => { let d = 0; for (let s = 1; s <= 40; s++) d += R.difficulty(R.generate(7, 9, s * 104729 + 17, 0, 0, x)); return +(d / 40).toFixed(1); };
      o.diff = { before: dv({}), after: dv({ yard: 9 }) };
      // hat, clash
      const a = R.lineStart(XL), z = R.lineStart(XL + 1); let early = 0, own = 0, mix = 0, km = 0;
      for (let l = 1; l < a; l++) if (R.rulesFor(l).has('yard')) early++;
      for (let l = a; l < z; l++) if (R.puzzleFor(l).yard) own++;
      for (let l = a; l < a + 900; l++) { const U = R.rulesFor(l); if (U.has('yard') && me.clash.some(q => U.has(q))) mix++; if (l >= z && U.has('yard')) km++; }
      const avg = c => { let d = 0; const a = R.lineStart(c), z = R.lineStart(c + 1); for (let l = a; l < z; l++) d += R.puzzleFor(l).diff; return +(d / (z - a)).toFixed(1); };
      o.line = { early, own, len: z - a, mix, km, intro: R.puzzleFor(a).yard?.d, fin: R.puzzleFor(z - 1).yard?.d, size: [a, a + 1, a + 2, a + 3].map(l => R.sizeFor(l).join('x')).join(' '), ladder: [avg(XL - 2), avg(XL - 1), avg(XL), avg(XL + 1)] };
      return o;
    }, XL);
    const ok = g.n - g.none;
    check('rule.yard.gen', `Boş peron: ${g.n} tohum (6×8 · 7×9, uyumlu her eklentiyle) → çözüm geçerli, çözülmüş gelmez; kenarda 3×3 peron, çözümde tek gerçek boşluk (maske 0), karolar yalnız yer değiştirir, her hücre tek karoluk birim; başlangıç çözüme ${g.dmin}–${g.dmax} kaydırma uzakta (bağımsız BFS), par/dokunuş bunu içerir; ortalama üretim ${g.ms} ms`,
      g.n >= 300 && g.none === 0 && g.bad === 0 && g.pre === 0 && g.place === 0 && g.gap === 0 && g.perm === 0 && g.unit === 0 && g.dist === 0 && g.par === 0 && g.other === 0, JSON.stringify({ ...g, line: undefined, diff: undefined }));
    check('rule.yard.solver', `Çözücü peronu bilir: yapraktaki dizilimler peron karolarının permütasyonu (${g.leafBad} dışarıda), çözüm ${g.found}/${ok} bölümde bulunur; zorluk 7×9 (40 tohum) kuralsız ${g.diff.before} → peronlu ${g.diff.after}`,
      g.leafBad === 0 && g.found >= ok * .97 && g.diff.after > g.diff.before + 3, JSON.stringify({ leafBad: g.leafBad, found: g.found, ok, diff: g.diff }));
    check('rule.yard.clash', 'Boş peron kayan sıra/sütun, döner tabla, sarmal tahta, kapalı durak, nehir, tarife, depo, son sefer ve bakım karosuyla hiçbir bölümde birlikte gelmez (900 bölüm, karma dahil)', g.line.mix === 0, String(g.line.mix));
    check('rule.yard.line', `M${XL + 1} (${A}. bölümden): önceki bölümlerde yok, hattın her bölümünde var, giriş ${g.line.intro} kaydırma, final ${g.line.fin}, ilk 3 bölüm 6×8, sonrası karma; merdiven M${XL - 1} ${g.line.ladder[0]} < M${XL} ${g.line.ladder[1]} < M${XL + 1} ${g.line.ladder[2]} (karma M${XL + 2} ${g.line.ladder[3]})`,
      g.line.early === 0 && g.line.own === g.line.len && g.line.intro === 4 && g.line.fin >= 9 && g.line.km >= 5 && g.line.size === '6x8 6x8 6x8 7x9' && g.line.ladder[0] < g.line.ladder[1] && g.line.ladder[1] < g.line.ladder[2], JSON.stringify(g.line));
    errs.push(...errors); await ctx.close();
  }

  // ---------- b) eski bölümler ----------
  {
    const sig = page => page.evaluate(a => {
      const R = window.__ray, h = s => { let x = 2166136261; for (const c of s) x = Math.imul(x ^ c.charCodeAt(0), 16777619); return (x >>> 0).toString(36); };
      let lv = ''; for (let l = 1; l < a; l += 5) { const P = R.puzzleFor(l); lv += P.sol.join('') + P.cur.join('') + P.diff; }
      for (let l = a - 28; l < a; l++) { const P = R.puzzleFor(l); lv += P.sol.join('') + P.cur.join('') + P.par + P.taps; }   // önceki hattın her bölümü
      return { lv: h(lv), d: h(['2026-10-27', '2027-03-14', '2026-11-08', '2026-11-21', '2026-11-22'].map(d => R.dailyBase(d).cur.join('') + R.dailyFor(d).cur.join('')).join()) };
    }, A);
    const PA = await open(browser, URL, { save: { played: 1 } }), PB = await open(browser, URL, { save: { played: 1 }, init: NO_YD });
    const sa = await sig(PA.page), sb = await sig(PB.page);
    check('rule.yard.old', `Boş peron eklentisi çıkarılınca 1–${A - 1}. bölümler ve Günün Hattı aynı`, sa.lv === sb.lv && sa.d === sb.d, JSON.stringify({ sa, sb }));
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
        const M = document.getElementById('modal'), m = M.querySelector('.sheet'), r = m?.getBoundingClientRect(), d = document.querySelector('.rd-yard')?.getBoundingClientRect();
        const kids = m ? [...m.querySelectorAll('*')].every(e => { const q = e.getBoundingClientRect(); return !q.width || (q.left >= r.left - 1 && q.right <= r.right + 1); }) : false;
        return { open: M.classList.contains('open'), h: m?.querySelector('h2')?.textContent, demo: !!d && d.width >= 100, anim: getComputedStyle(document.querySelector('.rd-yard .m') || document.body).animationName,
          fit: !!m && m.scrollWidth <= m.clientWidth + 1 && r.right <= innerWidth + 1 && r.left >= -1 && r.top >= 0 && r.bottom <= innerHeight + 1 && kids, tr: /[ğışĞİŞ]/.test(m?.textContent || '') };
      });
      if (['tr-TR', 'en-US', 'de-DE', 'ja-JP'].includes(loc)) await shot(page, 'rule-yard-' + loc.slice(0, 2));
      errs.push(...errors); await ctx.close();
    }
    const bad = Object.entries(res).filter(([l, v]) => !v.open || !v.demo || v.anim !== 'rdyS' || !v.fit || (l !== 'tr-TR' && v.tr));
    check('rule.yard.card', `M${XL + 1} ilk girişte kural kartı (animasyonlu, 9 dil), 320×568 px'te taşmaz, Türkçe dışında Türkçe harf yok`, !bad.length && /Boş peron/.test(res['tr-TR'].h) && /Empty platform/.test(res['en-US'].h), JSON.stringify(bad.length ? bad : res['tr-TR']), 'medium');
  }

  // ---------- d) oyun: kaydırma, geri al, kayıt, ipucu, robot kazanır ----------
  {
    const sv = { played: A - 1, level: A, stars: starsUpTo(A), seen: { ...seenTo(XL), [XL]: 1 }, remindAsked: true, hints: 5, bst: { geri: 3 } };
    const { ctx, page, errors } = await open(browser, URL, { vp: [320, 640], save: sv, init: BFS });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    const st = () => page.evaluate(() => { const G = window.__ray.G, c = G.yard.cells; return { cur: G.cur.slice(), moves: G.moves, hole: c.find(q => !G.cur[q]), d: window.__ybfs(G, G.cur), toast: document.getElementById('toast').textContent }; });
    const info = await page.evaluate(() => { const G = window.__ray.G, c = G.yard.cells, w = G.cols, h = c.find(q => !G.cur[q]), md = (a, b) => Math.abs(a % w - b % w) + Math.abs((a / w | 0) - (b / w | 0));
      return { cells: c, near: c.filter(q => md(q, h) === 1), far: c.filter(q => q !== h && md(q, h) > 1), W: document.documentElement.scrollWidth <= innerWidth }; });
    await shot(page, 'yard');
    const s0 = await st();
    await tapTile(page, info.far[0]); await page.waitForTimeout(250); const s1 = await st();   // boşluğa bitişik değil: kaymaz, dönmez
    await tapTile(page, s0.hole); await page.waitForTimeout(250); const s2 = await st();      // boşluğun kendisi
    const q = info.near[0]; await tapTile(page, q); await page.waitForTimeout(80);
    await shot(page, 'yard-slide'); await page.waitForTimeout(200); const s3 = await st();
    const slid = s3.cur[s0.hole] === s0.cur[q] && s3.cur[q] === 0 && s3.cur.every((v, i) => i === q || i === s0.hole || v === s0.cur[i]) && s3.moves === s0.moves + 1;
    // ikinci kaydırma: boşluğa (q) bitişik başka bir peron karosu → ayrı hamle
    const q2 = await page.evaluate(([q, h]) => { const G = window.__ray.G, w = G.cols; return G.yard.cells.find(c => c !== h && Math.abs(c % w - q % w) + Math.abs((c / w | 0) - (q / w | 0)) === 1); }, [q, s0.hole]);
    await tapTile(page, q2); await page.waitForTimeout(250); const s4 = await st();
    check('rule.yard.tap', `Bölüm ${A}: boşluğa bitişik olmayan karo ve boşluk dokunuşu reddedilir (kaymaz, dönmez, hamle yok, bildirim); bitişik karo boşluğa kayar, yönü aynı, 1 hamle; ikinci kaydırma ayrı hamle (${s0.moves} → ${s3.moves} → ${s4.moves})`,
      s1.cur.join() === s0.cur.join() && s1.moves === s0.moves && /yalnız boşluğa bitişik/.test(s1.toast) && s2.cur.join() === s0.cur.join() && s2.moves === s0.moves && slid && s4.moves === s0.moves + 2 && s4.cur[q] === s3.cur[q2] && s4.cur[q2] === 0 && info.W,
      JSON.stringify({ q, q2, hole: s0.hole, far: info.far[0], m: [s0.moves, s1.moves, s2.moves, s3.moves, s4.moves], toast: s1.toast, slid }));
    // geri al: iki kaydırma birden geri gelir
    await page.click('#gUndo').catch(() => {}); await page.waitForTimeout(300); const s6 = await st();
    // kayıt: iki kaydırma daha, sayfa yeniden açılınca peron durumu ve hamle sayısı aynı
    for (const c of [q, q2]) { await tapTile(page, c); await page.waitForTimeout(250); }
    const s7 = await st();
    await page.reload(); await page.waitForTimeout(500); await page.click('#bPlay'); await page.waitForTimeout(700);
    const s5 = await st();
    // ipucu: doğru yöne bir kaydırma (uzaklık 1 azalır), peron karosu sabitlenmez
    const hs = []; for (let k = 0; k < 2; k++) { const a = await st(); await page.click('#bHint'); await page.waitForTimeout(300); const b = await st(); const fx = await page.evaluate(() => window.__ray.G.yard.cells.some(q => window.__ray.G.fixed[q])); hs.push([a.d, b.d, b.moves === a.moves, fx]); }
    check('rule.yard.undo', `↶ geri al iki kaydırmayı geri getirir (hamle ${s4.moves} → ${s6.moves}); kayıt: yeniden açılınca peron ve hamle aynı (${s7.moves} → ${s5.moves}); 💡 ipucu doğru yöne bir kaydırma (uzaklık ${hs.map(h => h[0] + '→' + h[1]).join(', ')}), hamle saymaz, karo sabitlemez`,
      s6.cur.join() === s0.cur.join() && s6.moves === s0.moves && s7.moves === s0.moves + 2 && s5.cur.join() === s7.cur.join() && s5.moves === s7.moves && hs.every(([a, b, m, fx]) => b === a - 1 && m && !fx), JSON.stringify({ s6: s6.moves, back: s6.cur.join() === s0.cur.join(), s7: s7.moves, s5: s5.moves, same: s5.cur.join() === s7.cur.join(), hs }));
    const taps = await solve(page, 12); const won = await waitModal(page);
    await shot(page, 'yard-won');
    check('rule.yard.play', `Bölüm ${A}: robot kazanır (${taps} dokunuş)`, won, JSON.stringify({ taps, won }));
    errs.push(...errors); await ctx.close();
  }
  {
    // hattın ortasında (zorluk paylı, 7×9) bir bölüm: robot kazanır
    const L2 = A + 7, { ctx, page, errors } = await open(browser, URL, { save: { played: L2 - 1, level: L2, stars: starsUpTo(L2), seen: { ...seenTo(XL), [XL]: 1 }, remindAsked: true, yardTold: 1 } });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    const info = await page.evaluate(() => { const G = window.__ray.G; return { d: G.yard?.d, size: G.cols + 'x' + G.rows, lim: G.lim?.m, par: G.par }; });
    await shot(page, 'yard-mid');
    const taps = await solve(page, 8); const won = await waitModal(page);
    check('rule.yard.mid', `Bölüm ${L2}: peron ${info.d} kaydırma uzakta (${info.size}, par ${info.par}, hamle hedefi ${info.lim}); robot kazanır (${taps} dokunuş)`, info.d >= 9 && info.size === '7x9' && won, JSON.stringify({ ...info, won }));
    errs.push(...errors); await ctx.close();
  }
  {
    // karanlık tünel + boş peron (karma): robot ışığı izleyerek kazanır
    const pg = await open(browser, URL, { save: { played: 9 } });
    const f = await pg.page.evaluate(() => { const R = window.__ray; for (let l = R.lineStart(R.RULE_LINE.yard + 1); l < 20000; l++) { const U = R.rulesFor(l); if (U.has('yard') && U.has('fog')) return l; } return -1; });
    await pg.ctx.close();
    const o = await open(browser, URL, { save: { played: f - 1, level: f, stars: starsUpTo(f), seen: Object.fromEntries(Array.from({ length: 40 }, (_, k) => [k, 1])), remindAsked: true, yardTold: 1 } });
    await o.page.click('#bPlay'); await o.page.waitForTimeout(800);
    const info = await o.page.evaluate(() => { const G = window.__ray.G; return { fog: !!G.fog, yard: !!G.yard, dark: G.yard?.cells.some(q => !G.seen[q]) }; });
    await shot(o.page, 'yard-fog');
    await solve(o.page, 8, 80); const won = await waitModal(o.page);
    check('rule.yard.fog', `Bölüm ${f}: karanlık tünel + boş peron; robot ışığı izleyerek kazanır`, f > 0 && info.fog && info.yard && won, JSON.stringify({ f, ...info, won }));
    errs.push(...o.errors); await o.ctx.close();
  }
  {
    // 4× yavaş CPU, 7×9 hat finali: kare çizimi, eklenti kancaları ve 7×9 bölüm üretimi süresi
    const L7 = AT('yard', 27), { ctx, page, errors } = await open(browser, URL, { save: { played: L7 - 1, level: L7, stars: starsUpTo(L7), seen: { ...seenTo(XL), [XL]: 1 }, remindAsked: true, yardTold: 1 } });
    await page.click('#bPlay'); await page.waitForTimeout(600);
    await page.evaluate(() => {
      const R = window.__ray, m = R.MODS.find(q => q.key === 'yard'), raf = window.requestAnimationFrame; let hk = 0;
      window.__dt = []; window.__hk = [];
      for (const h of ['xform', 'base']) { const f = m[h]; m[h] = function (D) { const a = performance.now(), r = f.call(this, D); hk += performance.now() - a; return r; }; }
      window.requestAnimationFrame = cb => raf(t => { hk = 0; const a = performance.now(); cb(t); window.__dt.push(performance.now() - a); window.__hk.push(hk); });
    });
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    for (let k = 0; k < 24; k++) {
      const c = await page.evaluate(() => { const G = window.__ray.G, w = G.cols, h = G.yard.cells.find(q => !G.cur[q]), nb = G.yard.cells.filter(q => Math.abs(q % w - h % w) + Math.abs((q / w | 0) - (h / w | 0)) === 1); return nb[(Math.random() * nb.length) | 0]; });
      await tapTile(page, c); await page.waitForTimeout(70);
    }
    await page.waitForTimeout(600);
    const gen = await page.evaluate(() => { const R = window.__ray, a = R.lineStart(R.RULE_LINE.yard), out = []; for (const l of [a + 4, a + 10, a + 16]) { const t = performance.now(); R.puzzleFor(l + 0); out.push(Math.round(performance.now() - t)); } return out; });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const r = await page.evaluate(() => {
      const q = (a, p) => { a = a.slice().sort((x, y) => x - y); return +(a[Math.min(a.length - 1, Math.floor(a.length * p))] || 0).toFixed(2); };
      return { n: window.__dt.length, d50: q(window.__dt, .5), d95: q(window.__dt, .95), h50: q(window.__hk, .5), h95: q(window.__hk, .95) };
    });
    const gm = gen.slice().sort((a, b) => a - b)[1];   // ortanca (başka iş yükünden etkilenmesin)
    check('rule.yard.perf', `4× yavaş CPU, 7×9 hat finali (24 kaydırma): kare çizimi ortanca < 8 ms, peron kancaları ortanca < 1 ms; 7×9 bölüm üretimi ${gen.join(' / ')} ms (4× yavaşta ortanca < 500 ms)`, r.n > 40 && r.d50 < 8 && r.h50 < 1 && gm < 500,
      `çizim p50 ${r.d50} · p95 ${r.d95} ms · kancalar p50 ${r.h50} · p95 ${r.h95} ms · ${r.n} kare · üretim ${gen.join('/')} ms`, 'medium');
    errs.push(...errors); await ctx.close();
  }
  check('rule.yard.errors', 'Boş peron senaryolarında konsol hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
};
