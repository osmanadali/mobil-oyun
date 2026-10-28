// M11 · Köprü — robot testleri (hakem.cjs K bölümü çağırır). Sözleşme: docs/kurallar/README.md · tasarım: docs/kurallar/kopru.md
// Üretici (çözülebilirlik, yerleşim kuralları), bölünmüş lit regresyonları, eski bölümler bit bit aynı, oyunda dokunma/çizim/kazanma, kayıt.
const SEEN = Object.fromEntries(Array.from({ length: 40 }, (_, c) => [c, 1]));   // bütün kural kartları görülmüş
// eski bölümlerin parmak izi (köprüden ÖNCE ölçüldü): puzzleFor(1..208) ve iki Günün Hattı için cur|sol FNV-1a. 209–300 makasa göre değişebilir → köprülü/köprüsüz karşılaştırılır.
const H208 = 73850021, DAILY = [['2026-10-27', 3956970903], ['2027-03-14', 476147362]];
const fnv = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

module.exports = async T => {
  const { browser, URL, open, check, solve, shot, tapTile, waitModal, starsUpTo } = T;
  const allErr = [];

  // ---------- 1) Üretici + bölünmüş lit (sayfada) ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 1 } });
    const g = await page.evaluate(() => {
      const R = window.__ray, bad = [], t0 = performance.now();
      let n = 0, placed = 0, want = 0, pre = 0, twoN = 0, cross = 0;
      const sizes = [[4, 4], [5, 6], [6, 8], [7, 9]];
      const combos = [{}, { pins: 1 }, { pairs: 1 }, { rev: 4, cnt: 3 }, { fog: true }, { two: true }, { two: true, fog: true, rev: 3, cnt: 3, pins: 1, pairs: 1 }];
      for (const [c, r] of sizes) combos.forEach((cb, ci) => {
        if (cb.two && c < 6) return;   // iki merkez + köprü oyunda yalnız ≥ 6×8 (küçük ızgarada merkez aç kalabilir; belgede)
        for (let sd = 1; sd <= (ci ? 100 : 300); sd++) {
          const P = R.generate(c, r, sd * 7919 + 13, cb.pins ? Math.round(c * r * .1) : 0, cb.pairs ? 2 : 0, { bridge: 2, rev: cb.rev || 0, cnt: cb.cnt || 0, two: !!cb.two, fog: !!cb.fog });
          const B = P.bridge || [], tag = `${c}x${r}#${sd}${JSON.stringify(cb)}`, hubs = [P.hub, P.hub2].filter(h => h >= 0);
          n++; want += 2; placed += B.length;
          if (B.length !== (P.split || []).filter(Boolean).length || B.some(b => !P.split[b])) bad.push(tag + ' split');
          for (const b of B) {
            const bx = b % c, by = b / c | 0;
            if (P.cur[b] !== 15 || P.sol[b] !== 15 || P.pinned[b] || P.link[b] >= 0 || P.rev[b] || P.cnt[b] >= 0 || P.unitOf?.[b] >= 0) bad.push(tag + ' köprü karosu');
            if (bx < 1 || by < 1 || bx > c - 2 || by > r - 2) bad.push(tag + ' kenar');
            if (hubs.some(h => Math.abs(h % c - bx) + Math.abs((h / c | 0) - by) < 2)) bad.push(tag + ' merkez');
            if (B.some(q => q !== b && Math.max(Math.abs(q % c - bx), Math.abs((q / c | 0) - by)) < 3)) bad.push(tag + ' Chebyshev');
          }
          const L = R.lit({ ...P, cur: P.sol });
          if (!L.solved) bad.push(tag + ' sol çözülmüyor');
          if (B.some(b => !(L.own[b] > 0 && L.ownB[b] > 0 && L.dB[b] >= 0))) bad.push(tag + ' yarı kopuk');
          if (P.sol.some(v => !v)) bad.push(tag + ' boş hücre');
          if (R.lit(P).solved) pre++;
          if (cb.two) { twoN++; if (L.merged) bad.push(tag + ' karıştı'); cross += B.filter(b => L.own[b] !== L.ownB[b]).length; }
        }
      });
      // sabit 3×3 regresyonlar (köprü 4. hücrede, merkez 0): sahte düzende D–B yarısına yalnız K–G üzerinden varılıyor → çözülmüş SAYILMAZ
      const sp = [0, 0, 0, 0, 1, 0, 0, 0, 0], P3 = cur => ({ cols: 3, rows: 3, cur, hub: 0, hub2: -1, split: sp, bridge: [4] });
      const pos = R.lit(P3([4, 6, 12, 3, 15, 9, 2, 11, 8])).solved;
      const fake = [4, 6, 8, 3, 15, 8, 2, 11, 8], neg = R.lit(P3(fake)).solved, old = R.lit({ ...P3(fake), split: undefined, bridge: undefined }).solved;
      const L2 = R.lit({ ...P3([2, 12, 4, 2, 15, 13, 2, 9, 1]), hub2: 8 });
      return { n, bad: bad.slice(0, 8), nBad: bad.length, avgPlaced: +(placed / n).toFixed(2), wantAvg: want / n, pre, twoN, cross, ms: Math.round(performance.now() - t0),
        reg: { pos, neg, old, two: { solved: L2.solved, merged: L2.merged, own4: L2.own[4], ownB4: L2.ownB[4] } } };
    });
    check('bridge.gen', `Köprü üretici: ${g.n} bulmaca (4×4…7×9 × yalın/sabit/eşli/ters+sayaç/karanlık/iki merkez/hepsi): lit(sol) çözülü, iki yarı bağlı, köprü 15 ve dönmez, iç bölgede, merkeze ≥2, köprüler arası ≥3, hazır çözülü yok`,
      g.nBad === 0 && g.pre === 0 && g.avgPlaced > 1.5, JSON.stringify({ nBad: g.nBad, bad: g.bad, pre: g.pre, köprü: g.avgPlaced, ms: g.ms }));
    check('bridge.split', 'Bölünmüş lit: 3×3 doğru düzen çözülü; D–B yarısına yalnız K–G üzerinden varılan sahte düzen çözülü sayılmaz (eski kavşak lit\'i "çözüldü" derdi)',
      g.reg.pos && !g.reg.neg && g.reg.old, JSON.stringify(g.reg));
    check('bridge.two', `İki merkez + köprü: iki renk köprüde kesişir ama karışmaz (${g.twoN} bulmacada merged yok, ${g.cross} renk çaprazı; 3×3 örnekte own=1, ownB=2)`,
      g.twoN > 0 && g.cross > 0 && g.reg.two.solved && !g.reg.two.merged && g.reg.two.own4 === 1 && g.reg.two.ownB4 === 2, JSON.stringify({ twoN: g.twoN, cross: g.cross, ...g.reg.two }));

    // eski bölümler bit bit aynı · R() yalnız köprü miktarı > 0 iken tüketilir · süre
    const b = await page.evaluate(() => {
      const R = window.__ray, sig = P => P.cur.join() + '|' + P.sol.join(), fnv = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
      let s208 = '', leak = 0; const rest = [];
      for (let l = 1; l <= 300; l++) { const P = R.puzzleFor(l); if (l <= 208) s208 += sig(P) + ';'; else rest.push(sig(P)); if (R.rulesFor(l).has('bridge') || P.bridge || P.split) leak++; }
      const daily = ['2026-10-27', '2027-03-14'].map(d => fnv(sig(R.dailyFor(d))));
      // 209–300 köprü eklentisi çıkarılınca da aynı (önbellek 4 bölüm tutar; sırayla yeniden üretilir)
      const k = R.MODS.findIndex(m => m.key === 'bridge'), M = R.MODS.splice(k, 1)[0];
      let diff = 0; for (let l = 209; l <= 300; l++) if (sig(R.puzzleFor(l)) !== rest[l - 209]) diff++;
      R.MODS.splice(k, 0, M);
      // M11 süresi: 301–340 bölüm üretimi (pick + zorluk) ve lit
      let t = performance.now(); for (let l = 301; l <= 340; l++) R.puzzleFor(l); const perLvl = (performance.now() - t) / 40;
      const P = R.generate(7, 9, 4242, 0, 0, { bridge: 2 }), Q = { ...P, split: undefined, bridge: undefined };
      t = performance.now(); for (let k2 = 0; k2 < 3000; k2++) R.lit(P); const litMs = (performance.now() - t) / 3000;
      t = performance.now(); for (let k2 = 0; k2 < 3000; k2++) R.lit(Q); const litOld = (performance.now() - t) / 3000;
      return { h208: fnv(s208), daily, leak, diff, perLvl: +perLvl.toFixed(1), litUs: Math.round(litMs * 1000), litOldUs: Math.round(litOld * 1000), nbr: P.bridge?.length };
    });
    const dOk = DAILY.every(([, h], k) => b.daily[k] === h);
    check('bridge.old', 'Köprüsüz bölümler bit bit aynı: 1–208 ve Günün Hattı parmak izi köprüden önceki sabite eşit, 209–300 köprü eklentisiyle/eklentisiz aynı, 1–300\'de köprü yok',
      b.h208 === H208 && dOk && b.leak === 0 && b.diff === 0, JSON.stringify({ h208: b.h208, daily: b.daily, leak: b.leak, diff: b.diff }));
    check('bridge.perf', 'Köprü hızlı: 301–340 bölüm üretimi < 60 ms/bölüm; bölünmüş lit 7×9 < 150 µs/çağrı', b.perLvl < 60 && b.litUs < 150 && b.nbr === 2,
      `${b.perLvl} ms/bölüm · lit ${b.litUs} µs (köprüsüz ${b.litOldUs} µs)`, 'medium');
    allErr.push(...errors);
    await ctx.close();
  }

  // ---------- 2) Bölüm 301: kural kartı, köprüye dokunmak hamle saymaz, çözülür ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 300, level: 301, stars: starsUpTo(301), remindAsked: true } });
    await page.click('#bPlay'); await page.waitForTimeout(800);
    const card = await page.evaluate(() => ({ open: document.getElementById('modal').classList.contains('open'), txt: document.getElementById('mCard').textContent, demo: !!document.querySelector('#mCard .rd-bridge'), paused: !window.__ray.G.runAt }));
    await shot(page, 'kopru-kart');
    await page.click('#mGo').catch(() => {}); await page.waitForTimeout(500);
    const g = await page.evaluate(() => { const G = window.__ray.G; return { size: `${G.cols}x${G.rows}`, br: G.bridge || [], rules: G.rules }; });
    const B = g.br[0] ?? -1;
    const st = () => page.evaluate(b => { const G = window.__ray.G; return { m: G.moves, v: G.cur[b], last: G.lastTile, toast: document.getElementById('toast').textContent }; }, B);
    const s0 = await st(); await tapTile(page, B); await page.waitForTimeout(250); const s1 = await st();
    await tapTile(page, B); await page.waitForTimeout(500); const s2 = await st();
    await shot(page, 'kopru-oyun');
    await solve(page, 12); const won = await waitModal(page);
    const w = await page.evaluate(() => ({ won: window.__ray.G.won, moves: window.__ray.G.moves }));
    check('bridge.card', 'M11 bölüm 301: "YENİ KURAL · Köprü" kartı (canlı demo), kart açıkken süre durur; 6×8, tek köprü',
      card.open && /Köprü/.test(card.txt) && card.demo && card.paused && g.size === '6x8' && g.br.length === 1 && g.rules.includes('bridge'), JSON.stringify({ ...card, txt: card.txt.slice(0, 60), ...g }));
    check('bridge.tap', 'Köprüye dokunmak hamle saymaz, karo dönmez; bir kez "Köprü · dönmez" bildirimi; bölüm robotla çözülür',
      B >= 0 && s1.m === s0.m && s2.m === s0.m && s1.v === 15 && s2.v === 15 && s1.last === s0.last && /Köprü · dönmez/.test(s1.toast) && won && w.won, JSON.stringify({ B, s0, s1, s2, won, ...w }));
    allErr.push(...errors);
    await ctx.close();
  }

  // ---------- 3) Karma hat: köprü öteki kurallarla; iki merkezde renk çaprazı çizilir ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 1 } });
    const lv = await page.evaluate(() => {
      const R = window.__ray; let mix = 0, cross = 0, tries = 0;
      // köprü + iki merkez karma hatta seyrek (rulesFor en yeni kurallara ağırlık verir): çaprazlı bölüm yoksa ilk köprü + iki merkez bölümü alınır,
      // aşağıda tahtası aynı boyutta çaprazlı bir üretimle değiştirilir (swap)
      let alt = 0;
      for (let l = 353; l < 20000 && (!mix || !cross); l++) {
        const U = R.rulesFor(l); if (!U.has('bridge')) continue;
        if (!mix && U.size > 1) mix = l;
        if (!cross && U.has('two') && !U.has('fog') && tries++ < 30) {
          const P = R.puzzleFor(l), L = R.lit({ ...P, cur: P.sol });
          if ((P.bridge || []).some(b => L.own[b] && L.ownB[b] && L.own[b] !== L.ownB[b])) cross = l; else if (!alt && P.bridge?.length) alt = l;
        }
      }
      if (!cross && alt) return { mix, cross: alt, swap: true };
      return { mix, cross };
    });
    await ctx.close();
    if (!lv.mix || !lv.cross) check('bridge.mixed', 'Karma hat: köprülü karma ve iki merkezli bölüm bulunur', false, JSON.stringify(lv));
    // karma bölüm: robot çözer
    if (lv.mix) {
      const o = await open(browser, URL, { save: { played: lv.mix - 1, level: lv.mix, stars: starsUpTo(lv.mix), seen: SEEN, remindAsked: true } });
      await o.page.click('#bPlay'); await o.page.waitForTimeout(600);
      const g = await o.page.evaluate(() => ({ br: window.__ray.G.bridge?.length || 0, rules: window.__ray.G.rules }));
      await solve(o.page, 8); const won = await waitModal(o.page);
      check('bridge.mixed', `Karma hat: köprülü ilk karma bölüm (${lv.mix}) robotla çözülür`, lv.mix > 0 && g.br > 0 && won, JSON.stringify({ l: lv.mix, ...g, won }));
      allErr.push(...o.errors);
      await o.ctx.close();
    }
    // iki merkez: bir istasyon dışında çözülmüş tahta → köprüde iki renk; çizilen piksel renkleri ve alt geçit boşluğu
    if (lv.cross) {
      const o = await open(browser, URL, { save: { played: lv.cross - 1, level: lv.cross, stars: starsUpTo(lv.cross), seen: SEEN, remindAsked: true } });
      const { page } = o;
      await page.click('#bPlay'); await page.waitForTimeout(600);
      const t = await page.evaluate(swap => {
        const R = window.__ray, G = R.G, rot = R.rot, hubs = [G.hub, G.hub2];
        if (swap) for (let s = 1; s < 500; s++) {   // aynı boyutta köprüde renk çaprazı olan üretim
          const P = R.generate(G.cols, G.rows, s * 7919, 0, 0, { bridge: 2, two: true }), L = R.lit({ ...P, cur: P.sol });
          if (P.bridge.some(b => L.own[b] && L.ownB[b] && L.own[b] !== L.ownB[b])) { Object.assign(G, P); break; }
        }
        G.cur = G.sol.slice();
        const ok = i => !G.split?.[i] && !hubs.includes(i) && !G.pinned[i] && !G.fixed[i] && G.link[i] < 0 && !(G.unitOf?.[i] >= 0) && G.cnt[i] < 0 && !G.rev[i] && rot(rot(G.sol[i])) !== G.sol[i];
        const far = i => Math.min(...G.bridge.map(b => Math.abs(b % G.cols - i % G.cols) + Math.abs((b / G.cols | 0) - (i / G.cols | 0))));
        const c = G.sol.map((v, i) => i).filter(ok).sort((a, b) => (((G.sol[b] & (G.sol[b] - 1)) === 0) - ((G.sol[a] & (G.sol[a] - 1)) === 0)) || far(b) - far(a))[0];
        G.cur[c] = rot(rot(G.sol[c]));
        return c;
      }, !!lv.swap);
      await tapTile(page, t); await page.waitForTimeout(600);
      // parlamalar bitsin: çizim döngüsü durana dek bekle (yük altında kare gecikebilir)
      for (let k = 0, a = -1, b = 0; k < 20 && a !== b; k++) { a = b; await page.waitForTimeout(150); b = await page.evaluate(() => window.__log.raf); }
      const px = await page.evaluate(() => {
        const { G, geo } = window.__ray, cv = document.getElementById('cv'), x2 = cv.getContext('2d'), d = geo.dpr, s = geo.s;
        const hex = h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16)), OC = [null, G.color, G.color2 || G.color, G.warn];
        const at = (x, y) => Array.from(x2.getImageData(Math.round(x * d), Math.round(y * d), 1, 1).data).slice(0, 3);
        const near = (a, b, e = 14) => a.every((v, k) => Math.abs(v - b[k]) <= e);
        const b = G.bridge.find(i => G.L.own[i] && G.L.ownB[i] && G.L.own[i] !== G.L.ownB[i]);
        if (b == null) return { b };
        const x = geo.ox + (b % G.cols) * s + s / 2, y = geo.oy + (b / G.cols | 0) * s + s / 2;
        const ns = at(x, y - s * .4), ew = at(x - s * .42, y), gap = at(x - s * .12, y), cNS = hex(OC[G.L.own[b]]), cEW = hex(OC[G.L.ownB[b]]);
        return { b, merged: G.L.merged, solved: G.L.solved, own: G.L.own[b], ownB: G.L.ownB[b], nsOk: near(ns, cNS), ewOk: near(ew, cEW), gapOk: !near(gap, cEW, 40), ns, ew, gap };
      });
      await shot(page, 'kopru-iki-merkez');
      await tapTile(page, t); const won = await waitModal(page);
      check('bridge.cross', `İki merkez (bölüm ${lv.cross}): köprüde iki renk kesişir, "karıştı" olmaz; K–G ve D–B kendi renginde çizilir, alt geçitte boşluk var; bölüm biter`,
        lv.cross > 0 && px.b != null && !px.merged && px.nsOk && px.ewOk && px.gapOk && won, JSON.stringify({ l: lv.cross, ...px, won }));
      allErr.push(...o.errors);
      await o.ctx.close();
    }
  }

  // ---------- 4) Kayıt: imzasız (pv:4) ya da imzası tutmayan yarım oyun köprülü bölüme yüklenmez; doğru imzalı yüklenir ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 300, level: 301, stars: starsUpTo(301), seen: SEEN, remindAsked: true } });
    const P = await page.evaluate(() => { const P = window.__ray.puzzleFor(301); return { cur: P.cur, sol: P.sol, B: P.bridge[0] }; });
    const run = (extra, cur = P.cur) => ({ lvl: 301, cur, fixed: cur.map(() => false), moves: 3, last: -1, ms: 1000, ...extra });
    const bad = P.cur.slice(); bad[P.B] = 5;
    const res = [];
    for (const r of [run({ pv: 4 }, bad), run({ pv: 4, sig: 12345 }, bad), run({ pv: 4, sig: fnv(P.sol.join() + '|' + P.cur.join()) })]) {
      // önce ana sayfaya: oyun açıkken yeniden yüklemek pause() → saveRun() ile yazdığımız kaydı ezer
      await page.evaluate(() => document.getElementById('bBack').click()); await page.waitForTimeout(200);
      await page.evaluate(r => { const s = JSON.parse(localStorage.getItem('ray')); s.runs = { level: r }; localStorage.setItem('ray', JSON.stringify(s)); }, r);
      await page.reload(); await page.waitForTimeout(300);
      await page.click('#bPlay'); await page.waitForTimeout(400);
      res.push(await page.evaluate(b => ({ m: window.__ray.G.moves, v: window.__ray.G.cur[b] }), P.B));
    }
    check('bridge.save', 'Kayıt: imzasız ya da imzası tutmayan yarım oyun köprülü bölüme yüklenmez (köprü 15 kalır); doğru imzalı yarım oyun sürer',
      res[0].m === 0 && res[0].v === 15 && res[1].m === 0 && res[1].v === 15 && res[2].m === 3 && res[2].v === 15, JSON.stringify(res), 'medium');
    allErr.push(...errors);
    await ctx.close();
  }
  check('bridge.errors', 'Köprü senaryolarında konsol hatası yok', !allErr.length, allErr.slice(0, 3).join(' | '));
};
