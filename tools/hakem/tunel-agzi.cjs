// M19 · Tünel ağzı — robot testleri (hakem.cjs K bölümü çağırır). Sözleşme: docs/kurallar/README.md
module.exports = async T => {
  const { browser, URL, open, check, solve, shot, waitModal, starsUpTo } = T;
  const seen = Object.fromEntries(Array.from({ length: 17 }, (_, k) => [k + 2, 1]));   // 2–18: bütün kural kartları görülmüş
  // 1) üretim: 300 tohum {portal:3}, sınırlar, tek taraflı tünel, karanlık tünelde ışığı izleyen çözüm, eski bölümler
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 4 } });
    const r = await page.evaluate(() => {
      const R = window.__ray, bit = k => [1, 2, 4, 8][k], md = (c, i, j) => Math.abs(i % c - j % c) + Math.abs((i / c | 0) - (j / c | 0));
      const used = (m, p) => (m[p.a] & bit(p.ka)) && (m[p.b] & bit(p.kb));
      const H = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0).toString(36); };
      const o = { bad: 0, noUse: 0, rule: 0, open: 0, openN: 0, both: 0 };
      for (let s = 1; s <= 300; s++) {
        const P = R.generate(7, 9, s * 7919, 0, 0, { portal: 3 });
        if (!R.lit({ ...P, cur: P.sol }).solved) o.bad++;
        if (!P.portal.some(p => used(P.sol, p))) o.noUse++;
        const cells = P.portal.flatMap(p => [p.a, p.b]);
        if (P.portal.length !== 3 || new Set(cells).size !== 6 || P.portal.some(p => md(7, p.a, p.b) < 2 || md(7, p.a, P.hub) < 2 || md(7, p.b, P.hub) < 2 || P.adj[p.a * 4 + p.ka] !== p.b || P.adj[p.b * 4 + p.kb] !== p.a)) o.rule++;
        // tüneli tek taraftan kullanmak açık uçtur: kullanılmayan çiftte yalnız bir ağza kol ekle · kullanılan çiftte bir kolu kes
        const p = P.portal.find(q => !(P.sol[q.a] & bit(q.ka))), u = P.portal.find(q => used(P.sol, q));
        if (p) { const cur = P.sol.slice(); cur[p.a] |= bit(p.ka); o.openN++; if (!R.lit({ ...P, cur }).solved) o.open++; }
        if (u) { const cur = P.sol.slice(); cur[u.b] &= ~bit(u.kb); if (!R.lit({ ...P, cur }).solved) o.both++; }
      }
      // karanlık tünel + 2 çift: robotun yolu (yalnız aydınlık karoyu çöz, ışık ilerledikçe yeni tur) her tohumda çözüme varır
      const M = R.MODS.find(m => m.key === 'portal'); let fogOk = 0, viaTunnel = 0;
      for (let s = 1; s <= 200; s++) {
        const P = R.generate(7, 9, s * 104729, 2, 1, { portal: 2, fog: true, rev: 4, cnt: 3 }), n = P.cur.length;
        const G = { ...P, cur: P.cur.slice(), seen: new Array(n).fill(false) };
        const area = i => { const x = i % 7, y = i / 7 | 0; for (let j = 0; j < n; j++) if (Math.abs(j % 7 - x) + Math.abs((j / 7 | 0) - y) <= 2) G.seen[j] = true; };
        const rev = () => { G.L = R.lit(G); G.L.d.forEach((v, i) => v >= 0 && area(i)); M.reveal(G, i => { G.seen[i] = true; }, area); };
        rev(); const dark0 = P.portal.some(p => !G.seen[p.b] || !G.seen[p.a]);
        for (let k = 0; k < 60 && !G.L.solved; k++) { G.seen.forEach((v, i) => { if (v) G.cur[i] = P.sol[i]; }); rev(); }
        if (G.L.solved && G.seen.every(Boolean)) fogOk++;
        if (dark0 && P.portal.some(p => used(P.sol, p))) viaTunnel++;
      }
      // {portal:0} → üretim ve zorluk eski kodla birebir (adj yok, R() tüketilmez)
      let same = 0;
      for (let s = 1; s <= 60; s++) { const a = R.generate(7, 9, s, 3, 2, { portal: 0, rev: 3, two: s % 2 }), b = R.generate(7, 9, s, 3, 2, { rev: 3, two: s % 2 }); if (!a.adj && JSON.stringify(a) === JSON.stringify(b) && R.difficulty(a) === R.difficulty(b)) same++; }
      // eski bölümler ve Günün Hattı: kural eklenmeden önce ölçülen imza (1–208 hiçbir eklentiye bağlı değil) · 209–828'de tünel yok
      const pz = P => P.sol.join('') + '|' + P.cur.join('') + '|' + P.diff + '|' + P.par;
      const old = H([1, 13, 29, 49, 73, 101, 150, 208].map(l => pz(R.puzzleFor(l))).join(';')), day = H(['2026-01-01', '2026-10-27'].map(d => pz(R.dailyFor(d))).join(';'));
      let mid = 0; for (let l = 1; l <= 828; l++) if (R.rulesFor(l).has('portal')) mid++;
      const L0 = R.lineStart(18), P829 = R.puzzleFor(L0);
      const d = k => { let a = 0; for (let s = 0; s < 150; s++) a += R.difficulty(R.generate(7, 9, s * 31, 0, 0, { portal: k })); return +(a / 150).toFixed(2); };
      return { ...o, fogOk, viaTunnel, same, old, day, mid, L0, p829: { n: P829.portal.length, row: P829.portal[0] && (P829.portal[0].a / P829.cols | 0) === (P829.portal[0].b / P829.cols | 0), size: P829.cols + 'x' + P829.rows, adjMid: !!R.puzzleFor(L0 - 1).adj }, diff: [0, 1, 2, 3].map(d) };
    });
    check('rule.portal.gen', 'Tünel ağzı: 300 tohum {portal:3} → çözüm çözülü, her birinde en az bir tünel kullanılıyor, geçitler kurala uygun (merkezden uzak, komşu değil, köşede tek)', r.bad === 0 && r.noUse === 0 && r.rule === 0, JSON.stringify({ bad: r.bad, noUse: r.noUse, rule: r.rule }));
    check('rule.portal.open', 'Tüneli tek taraftan kullanan dizilim açık uç sayılır (çözülmez)', r.openN > 50 && r.open === r.openN && r.both === 300, JSON.stringify({ open: r.open, openN: r.openN, cut: r.both }));
    check('rule.portal.fog', 'Karanlık tünel + 2 tünel (+ sabit, eşli, ters, sayaçlı): 200 tohumda ışığı izleyen robot çözüme varır (ışık tünelden geçer)', r.fogOk === 200 && r.viaTunnel > 20, JSON.stringify({ fogOk: r.fogOk, viaTunnel: r.viaTunnel }));
    check('rule.portal.old', 'Eski bölümler bit bit aynı: {portal:0} üretim + zorluk birebir, 1–208 ve Günün Hattı imzası değişmedi, 1–828 tünelsiz', r.same === 60 && r.old === 'ehstyp' && r.day === 'rfdaew' && r.mid === 0 && !r.p829.adjMid, JSON.stringify({ same: r.same, old: r.old, day: r.day, mid: r.mid, adjMid: r.p829.adjMid }));
    check('rule.portal.intro', `Bölüm ${r.L0} (tanıtım): 1 tünel, aynı satırın iki ucunda`, r.L0 === 829 && r.p829.n === 1 && r.p829.row, JSON.stringify(r.p829), 'medium');
    check('rule.portal.diff', 'Zorluk tünel sayısıyla artar (0 → 3 çift)', r.diff[3] > r.diff[0] && r.diff[2] >= r.diff[0], r.diff.join(' → '), 'low');
    check('rule.portal.errors', 'Tünel ağzı üretim testinde konsol hatası yok', !errors.length, errors.join(' | '));
    await ctx.close();
  }
  // 2) bölüm 829: kural kartı (animasyonlu), ağızlar tahtanın dışında ve ekranda, robot çözer
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 828, level: 829, stars: starsUpTo(829), seen: { ...seen, 18: 0 }, remindAsked: true } });
    await page.click('#bPlay'); await page.waitForTimeout(800);
    const card = await page.evaluate(() => ({ open: document.getElementById('modal').classList.contains('open'), txt: document.querySelector('.sheet h2')?.textContent, demo: !!document.querySelector('.rd-portal .rd-pt'), anim: getComputedStyle(document.querySelector('.rd-pt') || document.body).animationName }));
    await shot(page, 'rule-portal');
    if (card.open) await page.click('#mGo');
    await page.waitForTimeout(400);
    const g = await page.evaluate(() => {
      const { G, geo } = window.__ray, r = document.getElementById('cv').getBoundingClientRect(), p = G.portal[0];
      const mx = i => geo.ox + (i % G.cols) * geo.s;   // karonun sol kenarı
      return { lvl: G.lvl, n: G.portal.length, s: geo.s, left: mx(p.b) - .2 * geo.s, right: mx(p.a) + 1.2 * geo.s, W: r.width };
    });
    await shot(page, 'portal');
    const taps = await solve(page, 20); const won = await waitModal(page);
    check('rule.portal.card', 'Bölüm 829 ilk girişte "YENİ KURAL · Tünel ağzı" kartı (animasyonlu demo)', card.open && /Tünel ağzı/.test(card.txt || '') && card.demo && card.anim === 'rdpt', JSON.stringify(card), 'medium');
    check('rule.portal.win', 'Bölüm 829: ağızlar tahta dışında ve ekranda, robot çözer', g.lvl === 829 && g.n === 1 && g.left >= 0 && g.right <= g.W && won, JSON.stringify({ ...g, taps, won }));
    check('rule.portal.errors2', 'Bölüm 829 senaryosunda konsol hatası yok', !errors.length, errors.join(' | '));
    await ctx.close();
  }
  // 3) M19 hattında karanlık tünelli bir bölüm (2 tünel): gerçek oyunda robot ışığı izleyerek kazanır
  {
    const p0 = await open(browser, URL, { save: { played: 4 } });
    const lvl = await p0.page.evaluate(() => { const R = window.__ray; for (let l = R.lineStart(18) + 3; l < R.lineStart(19) - 1; l++) if (R.rulesFor(l).has('fog')) return l; return 0; });
    await p0.ctx.close();
    const { ctx, page, errors } = await open(browser, URL, { save: { played: lvl - 1, level: lvl, stars: starsUpTo(lvl), seen, remindAsked: true } });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    if (await page.evaluate(() => document.getElementById('modal').classList.contains('open'))) { await page.click('#mGo'); await page.waitForTimeout(300); }
    const g = await page.evaluate(() => { const G = window.__ray.G; return { fog: G.fog, n: G.portal?.length, dark: G.seen.filter(v => !v).length }; });
    await shot(page, 'portal-fog');
    const taps = await solve(page, 8); const won = await waitModal(page);
    check('rule.portal.fogwin', `Bölüm ${lvl}: karanlık tünel + ${g.n} tünel, robot solve() ile kazanır`, lvl > 0 && g.fog && g.n === 2 && g.dark > 5 && won, JSON.stringify({ lvl, ...g, taps, won }));
    check('rule.portal.errors3', 'Karanlık tünelli M19 bölümünde konsol hatası yok', !errors.length, errors.join(' | '));
    await ctx.close();
  }
};
