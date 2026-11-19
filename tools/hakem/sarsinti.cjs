// 🌋 Sarsıntı durağı (quake) — hakem.cjs K bölümü çağırır. Ayrıntı: docs/kurallar/sarsinti.md
// Üretim (durak çözümde uç; sarsılan komşular sıradan karo, hiçbir durağın yolunda değil; uyumlu her eklentiyle), çözülebilirlik (benzetim:
// "önce sarsılmayan karolar" sırası par içinde kazanır, okuma sırası da kilitlenmeden kazanır), zorluk (saf oyuncunun fazladan hamlesi), çakışmalar,
// eski bölümler bit bit aynı, hat ve merdiven, kural kartı (320 px, bütün diller), sarsıntı davranışı (bağlanınca 90°, yeniden bağlanınca yine,
// hamle sayacı, kazanma sarsıntıdan sonra), robot kazanır, karanlık tünel, konsol hatası, 4× yavaş CPU'da çizim.
module.exports = async T => {
  const { browser, URL, open, check, solve, shot, tapTile, waitModal, starsUpTo, RL, AT, seenTo } = T;
  const errs = [], XL = RL.quake, A = AT('quake');
  const NO_Q = `window.RAY_RULES = []; { const push = window.RAY_RULES.push.bind(window.RAY_RULES); window.RAY_RULES.push = f => push(api => { const m = f(api); return m?.key === 'quake' ? null : m; }); }`;
  const CLASH = ['gear', 'slide', 'column', 'last'];

  // sayfa içi benzetim: sarsıntı kuralıyla dokunuş (çekirdek + eklenti after ile aynı mantık; öteki kuralların engelleri yok sayılır)
  const SIM = `window.__qsim = (P, order, rounds = 12) => {
    const R = window.__ray, rot = R.rot, unrot = m => ((m >> 1) | (m << 3)) & 15, cur = P.cur.slice(), G = { ...P, cur }, { st, nb } = P.quake;
    let L = R.lit(G), moves = 0, last = null, shakes = 0, taps = 0;
    const tap = i => {
      const was = st.map(q => L.d[q] >= 0), u = P.unitOf?.[i] ?? -1;
      if (u >= 0) P.units[u].tap(cur); else { cur[i] = P.rev[i] ? unrot(cur[i]) : rot(cur[i]); const j = P.link[i]; if (j >= 0) cur[j] = rot(cur[j]); }
      const key = u >= 0 ? 'u' + u : P.link[i] >= 0 ? Math.min(i, P.link[i]) : i; if (key !== last) { moves++; last = key; } taps++;
      L = R.lit(G); const done = new Set();
      for (let p = 0; p < st.length; p++) { let any = false; st.forEach((q, j) => { if (done.has(j) || was[j] || L.d[q] < 0) return; done.add(j); any = true; shakes++; for (const t of nb[j]) cur[t] = rot(cur[t]); }); if (!any) break; L = R.lit(G); }
    };
    const wrong = i => { const u = P.unitOf?.[i] ?? -1; if (u >= 0) return R.unitTaps(P.units[u], cur, P.sol) > 0; const j = P.link[i]; return cur[i] !== P.sol[i] || (j >= 0 && cur[j] !== P.sol[j]); };
    for (let r = 0; r < rounds && !L.solved; r++) for (const i of order) { for (let k = 0; k < 4 && wrong(i) && !L.solved; k++) tap(i); if (L.solved) break; }
    return { won: L.solved, moves, shakes, taps };
  };
  // kanıttaki sıra: önce sarsılmayan bütün karolar (merkezden dışa; durakların yolu tamamlanır, duraklar kalıcı olarak yanar), sonra sarsılan komşular
  window.__qsmart = P => { const R = window.__ray, n = P.cur.length, d = R.lit({ ...P, cur: P.sol }).d, S = new Set(P.quake.nb.flat()), I = Array.from({ length: n }, (_, i) => i);
    return [...I.filter(i => !S.has(i)).sort((a, b) => d[a] - d[b] || a - b), ...I.filter(i => S.has(i))]; };`;

  // ---------- a) üretim, çözülebilirlik, zorluk ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 9 }, init: SIM });
    const g = await page.evaluate(([XL, CLASH]) => {
      const R = window.__ray, rot = R.rot, o = { n: 0, none: 0, bad: 0, pre: 0, place: 0, path: 0, start: 0, litQ: 0, st: 0, S: 0, smart: 0, smartPar: 0, naive: 0, naiveW: 0, extra: 0, over: 0, shk: 0, ms: 0 };
      const me = R.MODS.find(m => m.key === 'quake'), keys = R.MODS.map(m => m.key).filter(k => k !== 'quake' && !me.clash.includes(k));
      const popc = m => (m & 1) + (m >> 1 & 1) + (m >> 2 & 1) + (m >> 3 & 1), per = m => rot(m) === m ? 1 : rot(rot(m)) === m ? 2 : 4;
      const t0 = performance.now();
      for (const [c, r] of [[6, 8], [7, 9]]) for (const x of [{}, { two: true }, { fog: true, rev: 3, cnt: 3 }, ...keys.map(k => ({ [k]: 2 }))]) for (let s = 1; s <= 8; s++) {
        const k = 1 + s % 3, P = R.generate(c, r, s * 6007 + 911, 0, s % 3 || Object.keys(x).some(k => keys.includes(k)) ? 0 : 2, { ...x, quake: k }); o.n++;
        if (!R.lit({ ...P, cur: P.sol }).solved) o.bad++;
        if (R.lit(P).solved) o.pre++;
        if (!P.quake) { o.none++; continue; }
        const { st, nb } = P.quake, all = new Set(nb.flat()); o.st += st.length; o.S += all.size;
        const plain = i => i !== P.hub && i !== P.hub2 && !((P.unitOf?.[i] ?? -1) >= 0) && P.link[i] < 0 && P.cnt[i] < 0 && !P.rev[i] && !P.void?.[i] && !P.self?.[i] && !P.split?.[i];
        const adj = (a, b) => Math.abs(a % c - b % c) + Math.abs((a / c | 0) - (b / c | 0)) === 1;
        // durak: çözümde uç, sıradan; komşular: ızgara komşusu, sıradan, simetrik değil, durak değil
        if (st.some((q, j) => popc(P.sol[q]) !== 1 || !plain(q) || all.has(q) || nb[j].length < 2 || nb[j].some(t => !adj(t, q) || !plain(t) || per(P.sol[t]) < 2))) o.place++;
        // yol koşulu: bütün sarsılan karolar boşaltılınca da her durak bağlı (sarsıntı yolu bozamaz)
        { const z = P.sol.slice(); for (const t of all) z[t] = 0; const d = R.lit({ ...P, cur: z }).d; if (st.some(q => d[q] < 0)) o.path++; }
        if ([...all, ...st].some(t => P.cur[t] === P.sol[t])) o.start++;
        { const d = R.lit(P).d; if (st.some(q => d[q] >= 0)) o.litQ++; }
        // benzetim: önce sarsılmayan karolar → kazanır, hamle ≤ par · okuma sırası (saf oyuncu) → kilitlenmeden kazanır, fazladan hamle
        const sm = window.__qsim(P, window.__qsmart(P)), nv = window.__qsim(P, Array.from({ length: P.cur.length }, (_, i) => i)), lim = R.limits(P).m;
        if (sm.won) o.smart++; if (sm.won && sm.moves <= P.par) o.smartPar++;
        if (nv.won) o.naive++; o.extra += nv.moves - P.par; if (nv.moves > P.par) o.naiveW++; if (nv.moves > lim) o.over++; o.shk += nv.shakes;
      }
      o.ms = Math.round(performance.now() - t0);
      const a = R.lineStart(XL), z = R.lineStart(XL + 1); let early = 0, own = 0, mix = 0, km = 0;
      for (let l = 1; l < a; l++) if (R.rulesFor(l).has('quake')) early++;
      for (let l = a; l < z; l++) if (R.puzzleFor(l).quake) own++;
      for (let l = a; l < a + 900; l++) { const U = R.rulesFor(l); if (U.has('quake') && CLASH.some(k => U.has(k))) mix++; if (l >= z && U.has('quake')) km++; }
      const avg = c => { let d = 0; const a = R.lineStart(c), z = R.lineStart(c + 1); for (let l = a; l < z; l++) d += R.puzzleFor(l).diff; return +(d / (z - a)).toFixed(1); };
      // hattın kendi bölümlerinde saf oyuncu: fazladan hamle ve ↻ hamle hedefini aşma oranı
      let lx = 0, lo = 0, ln = 0; for (let l = a; l < z; l++) { const P = R.puzzleFor(l), nv = window.__qsim(P, Array.from({ length: P.cur.length }, (_, i) => i)); ln++; lx += nv.moves - P.par; if (nv.moves > R.limits({ ...P, lvl: l }).m) lo++; }
      o.line = { early, own, len: z - a, mix, km, intro: R.puzzleFor(a).quake?.st.length, fin: R.puzzleFor(z - 1).quake?.st.length, size: [a, a + 1, a + 2, a + 3].map(l => R.sizeFor(l).join('x')).join(' '), ladder: [avg(XL - 2), avg(XL - 1), avg(XL)], naive: +(lx / ln).toFixed(2), over: lo };
      return o;
    }, [XL, CLASH]);
    const ok = g.n - g.none;
    check('rule.quake.gen', `Sarsıntı durağı: ${g.n} tohum (6×8 · 7×9, uyumlu her eklentiyle) → çözüm geçerli, çözülmüş gelmez; durak çözümde uç, sarsılan komşular sıradan ızgara komşusu; sarsılan karolar boşaltılınca da her durak bağlı (yol koşulu); komşu ve durak çözümde başlamaz`,
      g.n >= 300 && g.none === 0 && g.bad === 0 && g.pre === 0 && g.place === 0 && g.path === 0 && g.start === 0 && g.st >= g.n, JSON.stringify({ ...g, line: undefined }));
    check('rule.quake.solve', `Çözülebilirlik (benzetim, ${ok} bölüm): "önce sarsılmayan karolar, sonra komşular" sırası kazanır ${g.smart}/${ok} ve par içinde ${g.smartPar}/${ok}; okuma sırasıyla saf oyuncu da kilitlenmeden kazanır ${g.naive}/${ok}`,
      g.smart === ok && g.smartPar === ok && g.naive === ok, JSON.stringify({ smart: g.smart, smartPar: g.smartPar, naive: g.naive, ok }));
    check('rule.quake.hard', `Zorlaştırır: saf oyuncu ${g.naiveW}/${ok} bölümde par'ı aşar (ortalama +${(g.extra / ok).toFixed(2)} hamle, ${g.shk} sarsıntı), ${g.over} bölümde ↻ hamle hedefini kaçırır; M${XL + 1} hattında ortalama +${g.line.naive} hamle`,
      g.naiveW >= ok * .3 && g.extra > 0 && g.line.naive > 0, JSON.stringify({ naiveW: g.naiveW, extra: g.extra, over: g.over, shk: g.shk, line: g.line.naive, lineOver: g.line.over }));
    check('rule.quake.clash', `Sarsıntı durağı ${CLASH.join(', ')} ile hiçbir bölümde birlikte gelmez (900 bölüm, karma dahil)`, g.line.mix === 0, String(g.line.mix));
    check('rule.quake.line', `M${XL + 1} (${A}. bölümden): önceki bölümlerde yok, hattın her bölümünde var, giriş 1 durak, final 3, ilk 3 bölüm 6×8, sonrası karma; merdiven M${XL - 1} ${g.line.ladder[0]} · M${XL} ${g.line.ladder[1]} < M${XL + 1} ${g.line.ladder[2]}`,
      g.line.early === 0 && g.line.own === g.line.len && g.line.intro === 1 && g.line.fin >= 2 && g.line.km >= 5 && g.line.size === '6x8 6x8 6x8 7x9' && g.line.ladder[1] < g.line.ladder[2], JSON.stringify(g.line));
    errs.push(...errors); await ctx.close();
  }

  // ---------- b) eski bölümler ----------
  {
    const sig = page => page.evaluate(a => {
      const R = window.__ray, h = s => { let x = 2166136261; for (const c of s) x = Math.imul(x ^ c.charCodeAt(0), 16777619); return (x >>> 0).toString(36); };
      let lv = ''; for (let l = 1; l < a; l += 5) { const P = R.puzzleFor(l); lv += P.sol.join('') + P.cur.join('') + P.diff; }
      for (let l = a - 28; l < a; l++) { const P = R.puzzleFor(l); lv += P.sol.join('') + P.cur.join(''); }   // önceki hattın her bölümü
      return { lv: h(lv), d: h(['2026-10-27', '2027-03-14', '2026-11-08', '2026-11-21', '2026-11-22'].map(d => R.dailyBase(d).cur.join('')).join()) };
    }, A);
    const PA = await open(browser, URL, { save: { played: 1 } }), PB = await open(browser, URL, { save: { played: 1 }, init: NO_Q });
    const sa = await sig(PA.page), sb = await sig(PB.page);
    check('rule.quake.old', `Sarsıntı durağı eklentisi çıkarılınca 1–${A - 1}. bölümler ve Günün Hattı aynı`, sa.lv === sb.lv && sa.d === sb.d, JSON.stringify({ sa, sb }));
    errs.push(...PA.errors, ...PB.errors); await PA.ctx.close(); await PB.ctx.close();
  }

  // ---------- c) kural kartı: 320 px, bütün diller ----------
  {
    const LANGS = [['tr', 'tr-TR'], ['en', 'en-US'], ['de', 'de-DE'], ['es', 'es-ES'], ['pt', 'pt-BR'], ['fr', 'fr-FR'], ['ko', 'ko-KR'], ['ja', 'ja-JP'], ['zh', 'zh-TW']];
    const res = [];
    for (const [lang, locale] of LANGS) {
      const nc = browser.newContext; browser.newContext = x => nc({ ...x, locale });
      let o; try { o = await open(browser, URL, { vp: [320, 568], save: { played: A - 1, level: A, stars: starsUpTo(A), seen: seenTo(XL), remindAsked: true } }); } finally { browser.newContext = nc; }
      await o.page.click('#bPlay'); await o.page.waitForTimeout(800);
      const c = await o.page.evaluate(() => { const M = document.getElementById('modal'), m = M.querySelector('.sheet'), h = m?.querySelector('h2'), go = document.getElementById('mGo'), r = go?.getBoundingClientRect();
        return { open: M.classList.contains('open'), h: h?.textContent, one: h ? h.getBoundingClientRect().height < parseFloat(getComputedStyle(h).lineHeight || '40') * 1.6 : false, demo: !!document.querySelector('.rd-quake em'), anim: getComputedStyle(document.querySelector('.rd-quake .n') || document.body).animationName,
          fit: m ? m.scrollWidth <= m.clientWidth + 1 && m.scrollHeight <= m.clientHeight + 1 && m.getBoundingClientRect().right <= innerWidth + 1 && m.getBoundingClientRect().top >= 0 : false, btn: !!r && r.bottom <= innerHeight + 1, tr: /[ğşıĞŞİ]/.test(m?.textContent || '') }; });
      res.push({ lang, ...c });
      if (lang === 'tr' || lang === 'en' || lang === 'ja') await shot(o.page, `rule-quake-${lang}`);
      errs.push(...o.errors); await o.ctx.close();
    }
    const bad = res.filter(c => !(c.open && c.demo && c.anim === 'rdqN' && c.fit && c.btn && c.one && (c.lang === 'tr' || !c.tr)));
    check('rule.quake.card', `M${XL + 1} ilk girişte "YENİ KURAL · Sarsıntı durağı" kartı (animasyonlu) ${res.length} dilde 320×568'de sığar: başlık tek satır, kaydırma yok, düğme ekranda, çevrilmemiş metin yok`,
      !bad.length && /Sarsıntı durağı/.test(res[0].h || '') && /Quake station/.test(res[1].h || ''), JSON.stringify(bad.length ? bad : res.map(c => c.lang + ':' + c.h)).slice(0, 900), 'medium');
  }

  // ---------- d) sarsıntı davranışı ve robot ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { vp: [320, 640], save: { played: A - 1, level: A, stars: starsUpTo(A), seen: { ...seenTo(XL), [XL]: 1 }, remindAsked: true } });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    await shot(page, 'quake');
    // 1) her şey çözümde, durak bir dokunuş geride, komşular çözümde → dokununca komşular 90° döner, hamle +1, bölüm bitmez (kazanma sarsıntıdan sonra)
    const s0 = await page.evaluate(() => {
      const R = window.__ray, G = R.G, unrot = m => ((m >> 1) | (m << 3)) & 15, { st: [q], nb: [S] } = G.quake;
      G.sol.forEach((v, i) => { G.cur[i] = v; }); G.cur[q] = unrot(G.sol[q]); G.lastTile = null; G.L = R.lit(G);
      return { q, S, lit: G.L.d[q] >= 0, m0: G.moves, W: document.documentElement.scrollWidth <= innerWidth };
    });
    await tapTile(page, s0.q); await page.waitForTimeout(250);
    const s1 = await page.evaluate(S => { const R = window.__ray, G = R.G; return { rot: S.every(t => G.cur[t] === R.rot(G.sol[t])), moves: G.moves, won: !!G.won, lit: G.L.d[G.quake.st[0]] >= 0, toast: document.getElementById('toast').textContent, saved: !!JSON.parse(localStorage.getItem('ray')).qkTip }; }, s0.S);
    await page.waitForTimeout(150); await shot(page, 'quake-shake');
    // 2) aynı durağa 4 kez daha dokun (koparıp yeniden bağlar): yeniden bağlanışta yine sarsar; art arda aynı karo = hâlâ 1 hamle
    let trans = 0;
    for (let k = 0; k < 4; k++) {
      const b = await page.evaluate(() => window.__ray.G.L.d[window.__ray.G.quake.st[0]] >= 0);
      await tapTile(page, s0.q); await page.waitForTimeout(120);
      const a = await page.evaluate(() => window.__ray.G.L.d[window.__ray.G.quake.st[0]] >= 0); if (!b && a) trans++;
    }
    const s2 = await page.evaluate(([S, n]) => { const R = window.__ray, G = R.G; const off = t => { let v = G.sol[t], k = 0; while (v !== G.cur[t] && k < 4) { v = R.rot(v); k++; } return k; }, ks = S.map(off); const ok = n >= 2 && ks.every(k => k === ks[0]) && ks[0] !== 1 && ks[0] < 4; /* yeniden bağlanışta yine sarsar; sarsıntı durağı geri koparabildiği için komşuların ortak dönüşüyle ölçülür */ return { ok, moves: G.moves, won: !!G.won, wrong: S.filter(t => G.cur[t] !== G.sol[t]).length }; }, [s0.S, 1 + trans]);
    // 3) robot komşuları düzeltir: her komşu 1 hamle, durak yanık kaldığı için yeni sarsıntı yok → kazanır
    await solve(page, 12); const won = await waitModal(page);
    const s3 = await page.evaluate(() => ({ moves: window.__ray.G.moves }));
    check('rule.quake.shake', `Bölüm ${A}: durak bağlanınca ${s0.S.length} komşu 90° saat yönünde döner, hamle +1 (sarsıntı hamle sayılmaz), bölüm sarsıntıdan sonraki durumla denetlenir (bitmez); ilk sarsıntıda bir kez bildirim; 4 dokunuşla kopup yeniden bağlanınca (${trans} kez) yine sarsar, sayaç hâlâ +1; robot ${s2.wrong} komşuyu düzeltip kazanır (hamle ${s3.moves} = ${s0.m0} + 1 + ${s2.wrong})`,
      !s0.lit && s1.rot && s1.moves === s0.m0 + 1 && !s1.won && s1.lit && /Sarsıntı/.test(s1.toast) && s1.saved && trans >= 1 && s2.ok && s2.moves === s0.m0 + 1 && won && s3.moves === s0.m0 + 1 + s2.wrong && s0.W,
      JSON.stringify({ s0, s1, trans, s2, won, s3 }));
    errs.push(...errors); await ctx.close();
  }
  {
    // komşular bir tık geride, durak en son: son dokunuş durağı bağlar, sarsıntı komşuları çözüme oturtur → bölüm o dokunuşta biter
    const { ctx, page, errors } = await open(browser, URL, { save: { played: A - 1, level: A, stars: starsUpTo(A), seen: { ...seenTo(XL), [XL]: 1 }, remindAsked: true, qkTip: 1 } });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    const s0 = await page.evaluate(() => {
      const R = window.__ray, G = R.G, unrot = m => ((m >> 1) | (m << 3)) & 15, { st: [q], nb: [S] } = G.quake;
      G.sol.forEach((v, i) => { G.cur[i] = v; }); S.forEach(t => { G.cur[t] = unrot(G.sol[t]); }); G.cur[q] = unrot(G.sol[q]); G.lastTile = null; G.L = R.lit(G);
      return { q, lit: G.L.d[q] >= 0, m0: G.moves };
    });
    await tapTile(page, s0.q); const won = await waitModal(page);
    const m = await page.evaluate(() => window.__ray.G.moves);
    check('rule.quake.last', `Bölüm ${A}: komşular bir tık geride, durak en son bağlanır → sarsıntı komşuları çözüme oturtur, bölüm o dokunuşta biter (hamle +1)`, !s0.lit && won && m === s0.m0 + 1, JSON.stringify({ ...s0, won, m }));
    errs.push(...errors); await ctx.close();
  }
  {
    // baştan: robot (okuma sırası, turlar) giriş bölümünü ve hattın ortasındaki 7×9 bölümü kazanır
    for (const L2 of [A, A + 7, A + 27]) {
      const { ctx, page, errors } = await open(browser, URL, { save: { played: L2 - 1, level: L2, stars: starsUpTo(L2), seen: { ...seenTo(XL), [XL]: 1 }, remindAsked: true } });
      await page.click('#bPlay'); await page.waitForTimeout(700);
      const info = await page.evaluate(() => { const G = window.__ray.G; return { k: G.quake?.st.length, S: G.quake?.nb.flat().length, size: G.cols + 'x' + G.rows }; });
      const taps = await solve(page, 8); const won = await waitModal(page);
      check('rule.quake.play' + (L2 === A ? '' : L2 === A + 7 ? '.mid' : '.fin'), `Bölüm ${L2}: ${info.k} sarsıntı durağı, ${info.S} sarsılan komşu (${info.size}); robot kazanır`, info.k >= 1 && won, JSON.stringify({ ...info, taps, won }));
      errs.push(...errors); await ctx.close();
    }
  }
  {
    // karanlık tünel + sarsıntı durağı (karma): robot ışığı izleyerek kazanır
    const pg = await open(browser, URL, { save: { played: 9 } });
    const f = await pg.page.evaluate(() => { const R = window.__ray; for (let l = R.lineStart(R.RULE_LINE.quake + 1); l < 20000; l++) { const U = R.rulesFor(l); if (U.has('quake') && U.has('fog')) return l; } return -1; });
    await pg.ctx.close();
    const o = await open(browser, URL, { save: { played: f - 1, level: f, stars: starsUpTo(f), seen: Object.fromEntries(Array.from({ length: 40 }, (_, k) => [k, 1])), remindAsked: true } });
    await o.page.click('#bPlay'); await o.page.waitForTimeout(800);
    const info = await o.page.evaluate(() => { const G = window.__ray.G; return { fog: !!G.fog, quake: !!G.quake }; });
    await shot(o.page, 'quake-fog');
    await solve(o.page, 8, 80); const won = await waitModal(o.page);
    check('rule.quake.fog', `Bölüm ${f}: karanlık tünel + sarsıntı durağı; robot ışığı izleyerek kazanır`, f > 0 && info.fog && info.quake && won, JSON.stringify({ f, ...info, won }));
    errs.push(...o.errors); await o.ctx.close();
  }
  {
    // düşük donanım: 7×9 sarsıntılı bölüm, 4× yavaş CPU; durağa art arda dokunarak sürekli sarsıntı
    const L2 = A + 7, { ctx, page, errors } = await open(browser, URL, { save: { played: L2 - 1, level: L2, stars: starsUpTo(L2), seen: { ...seenTo(XL), [XL]: 1 }, remindAsked: true, qkTip: 1 } });
    await page.click('#bPlay'); await page.waitForTimeout(500);
    const q = await page.evaluate(() => {
      const R = window.__ray, G = R.G, m = R.MODS.find(q => q.key === 'quake'), raf = window.requestAnimationFrame; let hk = 0;
      window.__dt = []; window.__hk = [];
      for (const h of ['xform', 'over']) { const f = m[h]; m[h] = function (D) { const a = performance.now(), r = f.call(this, D); hk += performance.now() - a; return r; }; }
      window.requestAnimationFrame = cb => raf(t => { hk = 0; const a = performance.now(); cb(t); window.__dt.push(performance.now() - a); window.__hk.push(hk); });
      G.sol.forEach((v, i) => { if (!G.quake.nb.flat().includes(i) && !(G.unitOf?.[i] >= 0)) G.cur[i] = v; }); G.L = R.lit(G);
      return G.quake.st;
    });
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    for (let k = 0; k < 32; k++) { await tapTile(page, q[(k >> 2) % q.length]); await page.waitForTimeout(70); }
    await page.waitForTimeout(800);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const r = await page.evaluate(() => {
      const q = (a, p) => { a = a.slice().sort((x, y) => x - y); return +(a[Math.min(a.length - 1, Math.floor(a.length * p))] || 0).toFixed(2); };
      return { n: window.__dt.length, d50: q(window.__dt, .5), d95: q(window.__dt, .95), h50: q(window.__hk, .5), h95: q(window.__hk, .95) };
    });
    check('rule.quake.perf', '4× yavaş CPU, sarsıntılı 7×9: kare çizimi ortanca < 8 ms, sarsıntı kancaları ortanca < 1 ms', r.n > 60 && r.d50 < 8 && r.h50 < 1, `çizim p50 ${r.d50} · p95 ${r.d95} ms · kancalar p50 ${r.h50} · p95 ${r.h95} ms · ${r.n} kare`, 'medium');
    errs.push(...errors); await ctx.close();
  }
  check('rule.quake.errors', 'Sarsıntı durağı senaryolarında konsol hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
};
