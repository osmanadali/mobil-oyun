// M12 · Silik kol — robot testleri (hakem.cjs K bölümü çağırır). Sözleşme: docs/kurallar/README.md · tasarım: docs/kurallar/silik-kol.md
module.exports = async T => {
  const { browser, URL, open, check, solve, shot, tapTile, waitModal, starsUpTo } = T;
  const seen = Object.fromEntries(Array.from({ length: 17 }, (_, k) => [k + 2, 1]));   // 2–18: bütün kural kartları görülmüş
  // 1) üretim: sızıntısız biçim, adillik (tam sayımla yeniden), zorluk artışı, hat ortalaması, karışım
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 4 } });
    const r = await page.evaluate(() => {
      const R = window.__ray, M = R.MODS.find(m => m.key === 'faint'), rot = R.rot, popc = m => (m & 1) + (m >> 1 & 1) + (m >> 2 & 1) + (m >> 3 & 1);
      const per4 = m => rot(m) !== m && rot(rot(m)) !== m, orbit = m => [m, rot(m), rot(rot(m)), rot(rot(rot(m)))];
      const md = (c, a, b) => b < 0 ? 99 : Math.abs(a % c - b % c) + Math.abs((a / c | 0) - (b / c | 0));
      const qOf = (P, i) => { const [c0, q0] = P.faint[i]; let v = c0, q = q0; for (let r = 0; r < 4 && v !== P.cur[i]; r++) { v = rot(v); q = rot(q); } return q; };
      // oyuncunun gördüğüyle bütün çözümler: silik karoların sınıfı (gerçek mi) tek mi · tavan geniş, arama sonuna dek
      const classes = P => { const F = P.faint.flatMap((v, i) => v ? [i] : []), K = new Set(), Q = { ...P, faint: null };
        const sc = R.difficulty(P, cfg => { if (R.lit({ ...Q, cur: cfg }).solved) K.add(F.map(j => +orbit(P.faint[j][0]).includes(cfg[j])).join('')); return false; }, 20000);
        return { n: K.size, done: sc < 60000, real: K.has(F.map(() => 1).join('')) }; };
      const o = { bad: 0, shape: 0, place: 0, cnt: 0, has: 0, not: 0, unfair: 0, fairN: 0, kinds: {}, cands: 0 };
      for (const [c, rw, k] of [[7, 9, 4], [6, 8, 3]]) for (let s = 1; s <= 150; s++) {
        const P = R.generate(c, rw, s * 7919 + 3, 0, 0, { faint: k }), F = (P.faint || []).flatMap((v, i) => v ? [i] : []);
        if (!R.lit({ ...P, cur: P.sol }).solved) o.bad++;
        if (F.length !== k) o.cnt++;
        for (const i of F) {
          const q = qOf(P, i), V = P.cur[i] & ~q, real = P.cur[i], j4 = [-c, 1, c, -1];
          const side = rot(q) | rot(rot(rot(q)));
          if (!per4(real) || !per4(V) || popc(V) > 2 || !(V & side) || !P.self[i] || P.rev[i] || P.cnt[i] >= 0 || P.pinned[i] || P.link[i] >= 0) o.shape++;
          if (md(c, i, P.hub) < 2 || F.some(j => md(c, i, j) === 1)) o.place++;
          (real & q ? o.has++ : o.not++); o.kinds[popc(V) + (real & q ? '+var' : '+yok')] = (o.kinds[popc(V) + (real & q ? '+var' : '+yok')] || 0) + 1;
          // çözücü adayları: görünen ve "? dahil" hâlin bütün yönleri, gerçek karo içinde
          const C = M.cands(P, i); if (!C.includes(real) || C.some(m => !orbit(V).includes(m) && !orbit(V | q).includes(m))) o.cands++;
        }
        if (M.check(P) !== 0) o.bad++;
        if (s <= 60) { const f = classes(P); o.fairN++; if (f.n !== 1 || !f.done || !f.real) o.unfair++; }
      }
      // Δ zorluk: aynı tohum ve boyut, kural açık/kapalı (150 tohum)
      const dd = (c, rw, k) => { let a = 0, b = 0; for (let s = 0; s < 150; s++) { const sd = s * 7919 + 11; a += R.difficulty(R.generate(c, rw, sd, 0, 0, {})); b += R.difficulty(R.generate(c, rw, sd, 0, 0, { faint: k })); } return +((b - a) / 150).toFixed(2); };
      const delta = { '7x9': dd(7, 9, 4), '6x8': dd(6, 8, 3) };
      // hat ortalamaları: M11 (köprü) ve M12 (silik kol), M12'nin her bölümü silik kollu
      const avg = ln => { let s = 0, f = 0; const a = R.lineStart(ln), b = R.lineStart(ln + 1); for (let l = a; l < b; l++) { const P = R.puzzleFor(l); s += P.diff; if (P.faint) f++; } return { avg: +(s / (b - a)).toFixed(2), n: b - a, f }; };
      const m11 = avg(10), m12 = avg(11), L0 = R.lineStart(11), P0 = R.puzzleFor(L0);
      // karma hatlar: silik kollu ≥ 300 bölüm (rulesFor) — puzzleFor'un miktarlarıyla üretilir, çözüm geçerli, çakışan kural yok
      const mix = { n: 0, bad: 0, clash: 0, none: 0, with: {} };
      for (let l = R.lineStart(12); l < 20000 && mix.n < 300; l++) {
        const U = R.rulesFor(l); if (!U.has('faint')) continue;
        mix.n++; if (U.has('cover')) mix.clash++;
        const [c, rw] = R.sizeFor(l), n = c * rw, x = { rev: U.has('rev') ? Math.round(n * .15) : 0, cnt: U.has('cnt') ? Math.round(n * .12) : 0, two: U.has('two'), fog: U.has('fog') };
        for (const m of R.MODS) if (U.has(m.key)) x[m.key] = m.amount(n, false, .9, false, c, rw);
        const P = R.generate(c, rw, l * 7919 + 13, U.has('pins') ? 3 : 0, U.has('pairs') ? 4 : 0, x);
        if (!R.lit({ ...P, cur: P.sol }).solved) mix.bad++;
        if (!P.faint) mix.none++;
        R.difficulty(P);
        for (const k of U) if (k !== 'faint') mix.with[k] = (mix.with[k] || 0) + 1;
      }
      return { ...o, delta, m11, m12, L0, intro: { size: P0.cols + 'x' + P0.rows, n: P0.faint ? P0.faint.filter(Boolean).length : 0, rules: P0.rules, prev: !!R.puzzleFor(L0 - 1).faint }, mix };
    });
    check('rule.faint.gen', 'Silik kol: 300 tohum (7×9 ×4, 6×8 ×3) → çözüm çözülü, istenen sayıda, biçim sızıntısız (görünen uç/köşe, ? ona 90°, gerçek karo simetrisiz), merkezden uzak ve birbirine bitişik değil',
      r.bad === 0 && r.cnt === 0 && r.shape === 0 && r.place === 0 && r.cands === 0, JSON.stringify({ bad: r.bad, cnt: r.cnt, shape: r.shape, place: r.place, cands: r.cands }));
    check('rule.faint.both', 'Silik kolun altında ray hem var hem yok çıkar; dört desen de görülür (uç+var/yok, köşe+var/yok)', r.has > 200 && r.not > 200 && Object.keys(r.kinds).length === 4, JSON.stringify({ has: r.has, not: r.not, kinds: r.kinds }), 'medium');
    check('rule.faint.fair', 'Adillik: 120 bölümde oyuncunun gördüğüyle bütün çözümler silik karoların gerçek sınıfında (tam sayım)', r.unfair === 0 && r.fairN === 120, JSON.stringify({ unfair: r.unfair, n: r.fairN }));
    check('rule.faint.diff', 'Zorluk: aynı tohum ve boyutta kural açık/kapalı farkı ≥ +1 (150 tohum, 7×9 ×4 ve 6×8 ×3)', r.delta['7x9'] >= 1 && r.delta['6x8'] >= 1, JSON.stringify(r.delta));
    check('rule.faint.line', `M12 hattı (${r.m12.n} bölüm) silik kollu ve ortalama zorluğu M11'den en az +1 yüksek`, r.m12.f === r.m12.n && r.m12.avg >= r.m11.avg + 1, JSON.stringify({ m11: r.m11.avg, m12: r.m12.avg }));
    check('rule.faint.intro', `Bölüm ${r.L0} (tanıtım): 6×8, 2 silik kol, yalnız bu kural; önceki bölümde silik kol yok`, r.L0 === 353 && r.intro.size === '6x8' && r.intro.n === 2 && r.intro.rules.join() === 'faint' && !r.intro.prev, JSON.stringify(r.intro), 'medium');
    check('rule.faint.mix', `Karma hatlar: silik kollu ${r.mix.n} bölüm üretilir, çözüm çözülü, kapakla (clash) hiç gelmez`, r.mix.n >= 300 && r.mix.bad === 0 && r.mix.clash === 0 && r.mix.none === 0 && Object.keys(r.mix.with).length >= 5, JSON.stringify(r.mix));
    check('rule.faint.errors', 'Silik kol üretim testinde konsol hatası yok', !errors.length, errors.join(' | '));
    await ctx.close();
  }
  // 2) eski bölümler bit bit aynı: silik-kol.js yüklü/yüksüz 1–352 ve Günün Hattı (28 gün) eşit
  {
    const fp = () => {
      const R = window.__ray, H = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0).toString(36); };
      const pz = P => P.sol.join('') + '|' + P.cur.join('') + '|' + P.diff + '|' + P.par + '|' + P.taps + '|' + (P.rules || []).join();
      const L = []; for (let l = 1; l < 353; l++) L.push(pz(R.puzzleFor(l)));
      const D = []; for (let d = 1; d <= 28; d++) D.push(pz(R.dailyFor('2026-10-' + String(d).padStart(2, '0'))));
      return { lv: H(L.join(';')), day: H(D.join(';')), faint: R.MODS.some(m => m.key === 'faint') };
    };
    // servis çalışanı kapalı (önbellekten sunmasın), ikinci bağlamda kural dosyası engellenir
    const run = async block => {
      const ctx = await browser.newContext({ serviceWorkers: 'block' });
      if (block) await ctx.route('**/rules/silik-kol.js', r => r.abort());
      await ctx.addInitScript('window.__noIntro = true');
      const page = await ctx.newPage(); await page.goto(URL); await page.waitForTimeout(300);
      const o = await page.evaluate(fp); await ctx.close(); return o;
    };
    const A = await run(false), B = await run(true);
    check('rule.faint.old', 'Eski bölümler bit bit aynı: silik-kol.js yüklü/yüksüz 1–352 ve Günün Hattı imzası eşit', A.faint && !B.faint && A.lv === B.lv && A.day === B.day, JSON.stringify({ A, B }));
  }
  // 3) bölüm 353: kural kartı, ilk dokunuş bildirimi, ? karoyla döner, ↺ baştan, yarım oyun kaydı, robot çözer
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 352, level: 353, stars: starsUpTo(353), seen: { ...seen, 11: 0 }, remindAsked: true } });
    await page.click('#bPlay'); await page.waitForTimeout(800);
    const card = await page.evaluate(() => ({ open: document.getElementById('modal').classList.contains('open'), txt: document.querySelector('.sheet h2')?.textContent, demo: !!document.querySelector('.rd-faint .rd-fq'), anim: getComputedStyle(document.querySelector('.rd-fr') || document.body).animationName }));
    await shot(page, 'rule-faint');
    if (card.open) await page.click('#mGo');
    await page.waitForTimeout(400);
    const qOf = `(G, i) => { const rot = window.__ray.rot, [c0, q0] = G.faint[i]; let v = c0, q = q0; for (let r = 0; r < 4 && v !== G.cur[i]; r++) { v = rot(v); q = rot(q); } return q; }`;
    const g0 = await page.evaluate(`(() => { const G = window.__ray.G, qOf = ${qOf}, i = G.faint.findIndex(Boolean); return { lvl: G.lvl, i, q: qOf(G, i), cur: G.cur[i], self: G.self[i], n: G.faint.filter(Boolean).length }; })()`);
    await tapTile(page, g0.i); await page.waitForTimeout(250);
    const toast = await page.textContent('#toast');
    const g1 = await page.evaluate(`(() => { const G = window.__ray.G, qOf = ${qOf}; return { q: qOf(G, ${g0.i}), cur: G.cur[${g0.i}], moves: G.moves }; })()`);
    await shot(page, 'faint');
    // yarım oyun: geri → yeniden aç → sürdür
    await page.click('#bBack'); await page.waitForTimeout(300); await page.reload(); await page.waitForTimeout(300);
    await page.click('#bPlay'); await page.waitForTimeout(500);
    const g2 = await page.evaluate(`(() => { const G = window.__ray.G, qOf = ${qOf}; return { lvl: G.lvl, q: qOf(G, ${g0.i}), cur: G.cur[${g0.i}], moves: G.moves }; })()`);
    // ↺ baştan: başlangıç dizilimi ve ? konumu geri gelir
    await page.click('#bReset'); await page.waitForTimeout(400);
    const g3 = await page.evaluate(`(() => { const G = window.__ray.G, qOf = ${qOf}; return { q: qOf(G, ${g0.i}), cur: G.cur[${g0.i}], moves: G.moves }; })()`);
    const rot = m => ((m << 1) | (m >> 3)) & 15;
    check('rule.faint.card', 'Bölüm 353 ilk girişte "YENİ KURAL · Silik kol" kartı (animasyonlu demo)', card.open && /Silik kol/.test(card.txt || '') && card.demo && card.anim === 'rd-fr', JSON.stringify(card), 'medium');
    check('rule.faint.tap', 'Silik karo normal döner, ? de onunla döner; ilk dokunuşta bildirim', g0.lvl === 353 && g0.n === 2 && g0.self === 1 && g1.cur === rot(g0.cur) && g1.q === rot(g0.q) && /Silik kol/.test(toast || ''), JSON.stringify({ g0, g1, toast }));
    check('rule.faint.resume', 'Yarım oyun: kapatıp açınca silik karo ve ? konumu kaldığı yerden sürer; ↺ baştan başlangıca döndürür', g2.lvl === 353 && g2.cur === g1.cur && g2.q === g1.q && g2.moves === g1.moves && g3.cur === g0.cur && g3.q === g0.q && g3.moves === 0, JSON.stringify({ g2, g3 }), 'medium');
    // ipucu: öteki karolar çözümde, silik karo yanlış → ipucu onu çözer ve sabitler, bölüm biter
    const h = await page.evaluate(() => {
      const G = window.__ray.G, i = G.faint.findIndex(Boolean), rot = window.__ray.rot;
      G.cur.forEach((v, k) => { if (!G.faint[k]) G.cur[k] = G.sol[k]; });
      for (const k of G.faint.flatMap((v, j) => v ? [j] : [])) if (G.cur[k] === G.sol[k]) G.cur[k] = rot(G.cur[k]);
      return { i, wrong: G.cur.filter((v, k) => v !== G.sol[k]).length };
    });
    await page.click('#bHint'); await page.waitForTimeout(300);
    const h1 = await page.evaluate(() => { const G = window.__ray.G; return { fixed: G.faint.flatMap((v, k) => v && G.fixed[k] ? [k] : []).length, ok: G.fixed.every((f, k) => !f || G.cur[k] === G.sol[k]) }; });
    await shot(page, 'faint-hint');
    const taps = await solve(page, 20); const won = await waitModal(page);
    check('rule.faint.hint', 'İpucu yanlış silik karoyu çözer ve sabitler; robot kalanı çözer, bölüm biter', h.wrong >= 2 && h1.fixed === 1 && h1.ok && won, JSON.stringify({ ...h, ...h1, taps, won }));
    check('rule.faint.errors2', 'Bölüm 353 senaryosunda konsol hatası yok', !errors.length, errors.join(' | '));
    await ctx.close();
  }
  // 4) M12'de 7×9 bir bölüm ve karma hatta silik kollu bir bölüm: robot solve() + plan() ile kazanır
  {
    const p0 = await open(browser, URL, { save: { played: 4 } });
    const lv = await p0.page.evaluate(() => { const R = window.__ray; let mixed = 0; for (let l = R.lineStart(12) + 3; l < 3000 && !mixed; l++) { const U = R.rulesFor(l); if (U.has('faint') && U.size > 1 && [...U].some(k => R.MODS.some(m => m.key === k && m.key !== 'faint'))) mixed = l; } return [R.lineStart(11) + 5, mixed]; });
    await p0.ctx.close();
    for (const lvl of lv) {
      const { ctx, page, errors } = await open(browser, URL, { save: { played: lvl - 1, level: lvl, stars: starsUpTo(lvl), seen, remindAsked: true } });
      await page.click('#bPlay'); await page.waitForTimeout(700);
      if (await page.evaluate(() => document.getElementById('modal').classList.contains('open'))) { await page.click('#mGo'); await page.waitForTimeout(300); }
      const g = await page.evaluate(() => { const G = window.__ray.G; return { size: G.cols + 'x' + G.rows, n: G.faint ? G.faint.filter(Boolean).length : 0, rules: G.rules }; });
      await shot(page, 'faint-' + lvl);
      const taps = await solve(page, 8); const won = await waitModal(page);
      check('rule.faint.win' + lvl, `Bölüm ${lvl} (${g.rules.join('+')}): ${g.n} silik kol, robot solve() ile kazanır`, lvl > 0 && g.n >= 3 && won, JSON.stringify({ lvl, ...g, taps, won }));
      check('rule.faint.errors' + lvl, `Bölüm ${lvl} senaryosunda konsol hatası yok`, !errors.length, errors.join(' | '));
      await ctx.close();
    }
  }
};
