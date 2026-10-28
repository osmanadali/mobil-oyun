// M15 · Döner tabla — robot testleri (hakem.cjs K bölümü çağırır). Sözleşme: docs/kurallar/README.md · tasarım: docs/kurallar/doner-tabla.md
module.exports = async T => {
  const { browser, URL, open, check, solve, shot, getSave, tapTile, waitModal, starsUpTo } = T;
  const rot = m => ((m << 1) | (m >> 3)) & 15, spin = c => c.map((_, p) => rot(c[(p + 3) % 4]));   // tabla dönüşü (Q sırasındaki 4 değer)
  const seenTo = c => Object.fromEntries(Array.from({ length: c - 1 }, (_, k) => [k + 2, 1]));   // 2..c hatlarının kartı görülmüş
  const lvlSave = (l, x = {}) => ({ played: l - 1, level: l, stars: starsUpTo(l), seen: seenTo(13), remindAsked: true, hints: 3, ...x });
  const errs = [];

  // ---------- 1. Üretici: çözülebilirlik, yörünge, merkez/çakışma dışlaması, miktar ----------
  const { ctx, page, errors } = await open(browser, URL, { save: { played: 1 } }); errs.push(errors);
  const gen = await page.evaluate(() => {
    const R = window.__ray, out = { n: 0, bad: 0, pre: 0, orbit: 0, hub: 0, clash: 0, gap: 0, short: 0, taps: 0, play: 0, plates: 0, why: [] };
    // [sütun, satır, sabit, eşli, x, tohum, 2 tabla şart mı]. Bölümde en çok 2 kural olur; aşırı yüklü 6×8 karışımında (iki merkez +
    // sabit + eşli + ters + sayaç + karanlık) aday azalır, orada yalnız çözülebilirlik aranır
    const cfg = [[7, 9, 0, 0, {}, 300, 1], [6, 8, 0, 0, {}, 300, 1], [5, 6, 0, 0, {}, 100, 0], [7, 9, 9, 0, {}, 150, 1], [7, 9, 0, 4, {}, 150, 1], [7, 9, 0, 0, { rev: 9, cnt: 7 }, 150, 1],
      [7, 9, 0, 0, { two: true }, 150, 1], [6, 8, 0, 0, { two: true }, 150, 1], [7, 9, 0, 0, { fog: true }, 150, 1], [6, 8, 5, 3, { rev: 5, cnt: 4, two: true, fog: true }, 150, 0]];
    const rot = R.rot, unrot = m => ((m >> 1) | (m << 3)) & 15, spin = c => c.map((_, p) => rot(c[(p + 3) % 4]));
    for (const [c, r, pins, pairs, x, N, full] of cfg) for (let sd = 1; sd <= N; sd++) {
      const P = R.generate(c, r, sd * 7919 + 31, pins, pairs, { ...x, table: 2 }), md = (a, b) => Math.abs(a % c - b % c) + Math.abs((a / c | 0) - (b / c | 0));
      const Ps = P.table?.plates || [], fail = w => { out.bad++; if (out.why.length < 5) out.why.push(`${c}x${r}#${sd}: ${w}`); };
      out.n++; out.plates += Ps.length;
      if (!R.lit({ ...P, cur: P.sol }).solved) fail('sol');
      if (R.lit(P).solved) out.pre++;
      if (full && Ps.length < 2) out.short++;
      // her tabla: birim türü table, K = 4; 1–3 tabla dokunuşuyla çözüme döner; dokunuş yalnız kendi 4 karosunu değiştirir
      Ps.forEach((Q, k) => {
        const U = P.units[P.unitOf[Q[0]]], c0 = P.cur.slice(); let t = 0;
        if (!U || U.kind !== 'table' || U.K !== 4 || Q.some(q => P.unitOf[q] !== P.unitOf[Q[0]] || P.table.plate[q] !== k)) fail('birim');
        const c1 = P.cur.slice(); U.tap(c1); if (c1.some((v, i) => !Q.includes(i) && v !== P.cur[i]) || Q.some((q, p) => c1[q] !== spin(Q.map(j => P.cur[j]))[p])) fail('dokunuş');
        while (Q.some(q => c0[q] !== P.sol[q]) && t < 4) { U.tap(c0); t++; }
        if (t < 1 || t > 3) out.orbit++;
        if (Q.some(q => md(q, P.hub) <= 1 || (P.hub2 >= 0 && md(q, P.hub2) <= 1))) out.hub++;
        if (Q.some(q => P.pinned[q] || P.link[q] >= 0 || P.rev[q] || P.cnt[q] >= 0)) out.clash++;
        if (Ps.some((O, j) => j !== k && O.some(o => Q.some(q => md(o, q) <= 1)))) out.gap++;
        if (Q[1] !== Q[0] + 1 || Q[2] !== Q[0] + c + 1 || Q[3] !== Q[0] + c || Q[0] % c === c - 1) fail('2x2');
      });
      // oyuncu gibi çöz: tabla R^k, eşli ikisi birden, ters karo ters yöne (sayaçlı en çok 3); dokunuş sayısı P.taps ile aynı
      const cur = P.cur.slice(); let taps = 0;
      Ps.forEach(Q => { const U = P.units[P.unitOf[Q[0]]], k = R.unitTaps(U, cur, P.sol); for (let q = 0; q < k; q++) U.tap(cur); taps += k; });
      cur.forEach((v, i) => {
        const j = P.link[i]; if (P.unitOf?.[i] >= 0 || (j >= 0 && j < i)) return;
        let k = 0; const st = P.rev[i] ? unrot : rot;
        while ((cur[i] !== P.sol[i] || (j >= 0 && cur[j] !== P.sol[j])) && k < 4) { cur[i] = st(cur[i]); if (j >= 0) cur[j] = rot(cur[j]); k++; }
        if (P.cnt[i] >= 0 && k > 3) fail('sayaç'); taps += k;
      });
      if (!R.lit({ ...P, cur }).solved) out.play++;
      if (taps !== P.taps) out.taps++;
    }
    // bölüm merdiveni: M15 girişi tek tabla, sonra 2; tablalı her bölümde istenen kadar tabla; ilk 3 bölüm 6×8
    const lv = [];
    for (let l = 533; l <= 572; l++) { const P = R.puzzleFor(l); if (P.rules.includes('table')) lv.push([l, P.table?.plates.length || 0, P.cols + 'x' + P.rows, P.diff]); }
    out.lv = { n: lv.length, intro: lv[0], miss: lv.filter(([l, k]) => k !== (l === 533 ? 1 : 2)).map(v => v[0]), saw: lv.slice(0, 4).map(v => v[2]).join(' ') };
    // karanlık + tablalı bölüm (arayüz testi için)
    for (let l = 536; l <= 3000 && !out.fogLvl; l++) { const U = R.rulesFor(l); if (!U.has('fog') || !U.has('table')) continue; const P = R.puzzleFor(l); if (P.fog && P.table) out.fogLvl = l; }   // karma hatlar yeni kurallara ağırlık verir → aralık geniş
    return out;
  });
  check('rule.table.gen', `Döner tabla: ${gen.n} üretim (7×9, 6×8, 5×6; sabit, eşli, ters/sayaçlı, iki merkez, karanlık, hepsi) çözülebilir, hazır çözülü gelmez; her tabla 2×2 tek birim, dokunuş yalnız dört karoyu çevirir`, gen.bad === 0 && gen.pre === 0 && gen.play === 0 && gen.taps === 0, JSON.stringify({ n: gen.n, plates: gen.plates, bad: gen.bad, pre: gen.pre, play: gen.play, taps: gen.taps, why: gen.why }));
  check('rule.table.orbit', 'Döner tabla: her tablanın 4 karosu çözümün yörüngesinde (1–3 dokunuş); merkeze bitişik değil; sabit/eşli/ters/sayaçlı ile çakışmaz; iki tabla arasında en az 1 karo; 6×8 ve 7×9 karışımlarında 2 tabla eksiksiz', gen.orbit === 0 && gen.hub === 0 && gen.clash === 0 && gen.gap === 0 && gen.short === 0, JSON.stringify({ orbit: gen.orbit, hub: gen.hub, clash: gen.clash, gap: gen.gap, short: gen.short }));
  check('rule.table.ladder', 'M15 bölümleri: giriş (533) tek tabla, sonra 2; tablalı her bölümde tabla eksiksiz; ilk 3 bölüm 6×8 (testere dişi)', gen.lv.n >= 30 && gen.lv.intro?.[0] === 533 && gen.lv.intro?.[1] === 1 && !gen.lv.miss.length && /^6x8 6x8 6x8 7x9/.test(gen.lv.saw), JSON.stringify(gen.lv), 'medium');
  await ctx.close();

  // ---------- 2. Eski bölümler bit bit aynı: tabla eklentisi olmadan açılan sayfayla 1–532 ve Günün Hattı karşılaştırılır ----------
  const NO_TABLE = `window.RAY_RULES = []; { const push = window.RAY_RULES.push.bind(window.RAY_RULES); window.RAY_RULES.push = f => push(api => { const m = f(api); return m?.key === 'table' ? null : m; }); }`;
  const sig = p => p.evaluate(() => {
    const R = window.__ray, L = [1, 2, 13, 29, 49, 73, 101, 133, 169, 200, 208, 209, 240, 300, 301, 360, 408, 409, 470, 531, 532];
    const h = P => [P.cols, P.rows, P.sol, P.cur, P.pinned, P.link, P.rev, P.cnt, P.par, P.taps, P.diff, P.rules || ''].join('|');
    return { has: !!R.MODS.find(m => m.key === 'table'), lv: L.map(l => h(R.puzzleFor(l))), d: ['2026-10-27', '2026-11-01', '2027-03-14'].map(d => h(R.dailyFor(d))) };
  });
  const A = await open(browser, URL, { save: { played: 1 } }), B = await open(browser, URL, { save: { played: 1 }, init: NO_TABLE }); errs.push(A.errors, B.errors);
  const sa = await sig(A.page), sb = await sig(B.page);
  const diff = sa.lv.map((v, k) => v === sb.lv[k] ? 0 : 1).reduce((a, b) => a + b, 0) + sa.d.map((v, k) => v === sb.d[k] ? 0 : 1).reduce((a, b) => a + b, 0);
  check('rule.table.compat', 'Döner tabla: 1–532 bölümleri (21 örnek) ve Günün Hattı (3 gün) eklentili ve eklentisiz sayfada bit bit aynı', sa.has && !sb.has && diff === 0, JSON.stringify({ with: sa.has, without: sb.has, diff }));
  await A.ctx.close(); await B.ctx.close();

  // ---------- 3. Arayüz (bölüm 533): kural kartı, dokunuş (4 karo yer değiştirir + döner, 1 hamle), kayıt, ipucu, robot ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: lvlSave(533) }); errs.push(errors);
    await page.click('#bPlay'); await page.waitForTimeout(800);
    const card = await page.evaluate(() => {
      const d = document.querySelector('.rd-table'), p = d?.firstElementChild;
      return { open: document.getElementById('modal').classList.contains('open'), badge: document.querySelector('.sheet .badge')?.textContent, txt: document.querySelector('.sheet h2')?.textContent, w: d?.offsetWidth, anim: p && getComputedStyle(p).animationName };
    });
    await shot(page, 'rule-table');
    check('rule.table.card', 'M15 ilk girişte "YENİ KURAL · Döner tabla" kartı (dönen plaka demosu)', card.open && /YENİ KURAL/.test(card.badge || '') && card.txt === 'Döner tabla' && card.w === 104 && card.anim === 'spin4', JSON.stringify(card), 'medium');
    if (card.open) await page.click('#mGo');
    await page.waitForTimeout(400);
    const g = await page.evaluate(() => { const G = window.__ray.G; return { size: G.cols + 'x' + G.rows, n: G.table?.plates.length, Q: G.table?.plates[0] }; });
    const st = () => page.evaluate(Q => { const G = window.__ray.G; return { m: G.moves, c: Q.map(q => G.cur[q]), solved: Q.every(q => G.cur[q] === G.sol[q]) }; }, g.Q);
    await shot(page, 'table');
    const s0 = await st(); await tapTile(page, g.Q[1]); await page.waitForTimeout(250); const s1 = await st();
    // dönüşün ortası: saat 30 ms'de dondurulur (190 ms'lik dönüşün ~%45'i), ekran görüntüsü alınır
    await page.evaluate(() => { const t = performance.now(); window.__pt = t; performance.now = () => window.__pt; });
    await tapTile(page, g.Q[2]); await page.evaluate(() => { window.__pt += 30; }); await page.waitForTimeout(120);
    await shot(page, 'table-spin');
    await page.evaluate(() => { delete performance.now; }); await page.waitForTimeout(300);
    const s2 = await st();
    for (const k of [0, 3]) { await tapTile(page, g.Q[k]); await page.waitForTimeout(220); }
    const s4 = await st();
    const ok1 = s1.c.every((v, p) => v === spin(s0.c)[p]) && s1.m === s0.m + 1, ok2 = s2.c.every((v, p) => v === spin(s1.c)[p]) && s2.m === s1.m, ok4 = s4.c.join() === s0.c.join() && s4.m === s1.m;
    check('rule.table.tap', 'Döner tabla: dokununca 4 karo saat yönünde yer değiştirir ve döner (1 hamle); aynı tablaya art arda dokunuş aynı hamle; 4 dokunuşta başa döner', g.size === '6x8' && g.n === 1 && ok1 && ok2 && ok4, JSON.stringify({ ...g, s0, s1, s2, s4 }));
    // kayıt: yarım oyun yeniden açılınca aynı durum (tabla yörüngede)
    await tapTile(page, g.Q[0]); await page.waitForTimeout(250);
    const before = await page.evaluate(() => ({ cur: window.__ray.G.cur.join(), m: window.__ray.G.moves }));
    await page.reload(); await page.waitForTimeout(400); await page.click('#bPlay'); await page.waitForTimeout(600);
    const after = await page.evaluate(() => ({ cur: window.__ray.G.cur.join(), m: window.__ray.G.moves }));
    check('rule.table.resume', 'Döner tabla: yarım kalan bölüm aynı tabla durumuyla sürer', before.cur === after.cur && before.m === after.m, JSON.stringify({ same: before.cur === after.cur, m: [before.m, after.m] }), 'medium');
    // ipucu: yalnız tabla yanlışken 💡 → dört karo birden çözüme oturur ve sabitlenir, bölüm biter
    if ((await st()).solved) { await tapTile(page, g.Q[0]); await page.waitForTimeout(250); }
    await page.evaluate(Q => { const G = window.__ray.G; G.cur.forEach((v, i) => { if (!Q.includes(i)) G.cur[i] = G.sol[i]; }); }, g.Q);
    await page.click('#bHint'); await page.waitForTimeout(120);
    const hf = await page.evaluate(Q => { const G = window.__ray.G; return { fixed: Q.every(q => G.fixed[q]), sol: Q.every(q => G.cur[q] === G.sol[q]), others: G.fixed.filter(Boolean).length }; }, g.Q);
    await shot(page, 'table-hint');
    const won = await waitModal(page);
    check('rule.table.hint', 'Döner tabla: ipucu tablaya düşünce dört karoyu birden oturtur ve sabitler; bölüm kazanılır', hf.fixed && hf.sol && hf.others === 4 && won, JSON.stringify({ ...hf, won }));
    // robot: plan() tabla dokunuşlarını verir → bölüm en az hamleyle (par) çözülür
    await page.click('#mRetry'); await page.waitForTimeout(600);
    const taps = await solve(page, 15), won2 = await waitModal(page);
    const r = await page.evaluate(() => { const G = window.__ray.G; return { won: G.won, moves: G.moves, par: G.par }; });
    check('rule.table.solve', 'Döner tabla: robot (solve + plan) 533. bölümü par hamlede kazanır', won2 && r.won && r.moves === r.par, JSON.stringify({ taps, ...r }));
    await ctx.close();
  }

  // ---------- 3b. Hareketi azalt: tabla anında yer değiştirir, animasyon döngüsü boşta durur ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { rm: true, save: lvlSave(533, { seen: seenTo(14) }) }); errs.push(errors);
    await page.click('#bPlay'); await page.waitForTimeout(600);
    const Q = await page.evaluate(() => window.__ray.G.table.plates[0]), cur = () => page.evaluate(Q => Q.map(q => window.__ray.G.cur[q]), Q);
    const c0 = await cur(); await tapTile(page, Q[0]); await page.waitForTimeout(700);
    const c1 = await cur(), a = await page.evaluate(() => window.__log.raf); await page.waitForTimeout(1000); const b = await page.evaluate(() => window.__log.raf);
    check('rule.table.calm', 'Döner tabla, hareketi azalt: dokunuş anında uygulanır, dönüş animasyonu yok (çizim döngüsü boşta durur)', c1.join() === spin(c0).join() && b - a <= 2, JSON.stringify({ c0, c1, raf: b - a }), 'medium');
    await ctx.close();
  }

  // ---------- 4. Karanlık tünel + tabla (açık tema): dört karo birlikte aydınlanır, ışığı izleyerek çözülür ----------
  // Karma hatların dağılımı her yeni kuralla değişir (rulesFor havuzu); bu ikili bulunamazsa çift hat kuralları (M10–M20) yüklenmeden aranır.
  let fogInit = '';
  if (!gen.fogLvl) {
    fogInit = `window.RAY_RULES = []; { const p = window.RAY_RULES.push.bind(window.RAY_RULES); window.RAY_RULES.push = f => p(api => { const m = f(api); return m && ['cover', 'faint', 'depot', 'closed', 'river', 'zone'].includes(m.key) ? null : m; }); }`;
    const o = await open(browser, URL, { save: { played: 1 }, init: fogInit }); errs.push(o.errors);
    gen.fogLvl = await o.page.evaluate(() => { const R = window.__ray; for (let l = 536; l <= 3000; l++) { const U = R.rulesFor(l); if (!U.has('fog') || !U.has('table')) continue; const P = R.puzzleFor(l); if (P.fog && P.table) return l; } return 0; });
    await o.ctx.close();
  }
  if (gen.fogLvl) {
    const l = gen.fogLvl, { ctx, page, errors } = await open(browser, URL, { scheme: 'light', save: lvlSave(l, { seen: seenTo(15) }), init: fogInit }); errs.push(errors);
    await page.click('#bPlay'); await page.waitForTimeout(700);
    if (await page.evaluate(() => document.getElementById('modal').classList.contains('open'))) { await page.click('#mGo'); await page.waitForTimeout(400); }
    const half = async () => {   // yarı karanlık tabla sayısı; bir tabla ilk kez aydınlanınca ekran görüntüsü
      const r = await page.evaluate(() => { const G = window.__ray.G, P = G.table.plates; return { h: P.filter(Q => Q.some(q => G.seen[q]) && !Q.every(q => G.seen[q])).length, on: P.some(Q => Q.every(q => G.seen[q])) }; });
      if (r.on && !lit) { lit = true; await page.waitForTimeout(500); await shot(page, 'table-fog-lit'); }
      return r.h;
    };
    let lit = false, bad = await half(), taps = 0;
    await shot(page, 'table-fog');
    for (let round = 0; round < 40; round++) {
      const list = await page.evaluate(() => {
        const { G, rot } = window.__ray, out = [], unrot = m => ((m >> 1) | (m << 3)) & 15;
        if (G.won) return out;
        G.cur.forEach((v, i) => {
          if (G.fixed[i] || G.pinned[i] || G.unitOf?.[i] >= 0 || !G.seen[i]) return;
          const j = G.link[i]; if (j >= 0 && (j < i ? G.seen[j] : !G.seen[i])) return;
          let k = 0, t = v, u = j >= 0 ? G.cur[j] : 0; const s = G.rev[i] ? unrot : rot;
          while ((t !== G.sol[i] || (j >= 0 && u !== G.sol[j])) && k < 4) { t = s(t); if (j >= 0) u = rot(u); k++; }
          for (let q = 0; q < k; q++) out.push(i);
        });
        return out.concat(window.__ray.plan());
      });
      if (!list.length) break;
      for (const i of list) { await tapTile(page, i); taps++; bad += await half(); }
    }
    const won = await waitModal(page), info = await page.evaluate(() => { const G = window.__ray.G; return { lvl: G.lvl, fog: G.fog, plates: G.table.plates.length, rules: G.rules }; });
    check('rule.table.fog', 'Döner tabla + karanlık tünel: tablanın dört karosu hep birlikte aydınlanır (yarı karanlık tabla yok), ışığı izleyerek kazanılır', info.fog && bad === 0 && won, JSON.stringify({ ...info, bad, taps, won }));
    await ctx.close();
  } else check('rule.table.fog', 'Döner tabla + karanlık tünel: 536–3000 arasında karanlık ve tablalı bölüm bulunmalı', false, 'bulunamadı');

  check('rule.table.errors', 'Döner tabla senaryolarında konsol hatası yok', !errs.flat().length, errs.flat().slice(0, 3).join(' | '));
};
