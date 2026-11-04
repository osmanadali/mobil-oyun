// ⬡ Altıgen gün: cumartesi Günün Hattı altıgen tahtada — hakem.cjs K bölümü çağırır. Ayrıntı: docs/kurallar/altigen.md
// Tek başına: node tools/hakem.cjs --only=altigen
const clock = (y, m, d, h = 12) => `{ const D = Date, off = new D(${y}, ${m}, ${d}, ${h}).getTime() - D.now();
  class FD extends D { constructor(...a) { super(...(a.length ? a : [D.now() + off])); } static now() { return D.now() + off; } }
  window.Date = FD; }`;
const SAT = [2026, 10, 7], SAT_S = '2026-11-07';   // 7 Kasım 2026 cumartesi
const FP_HEX = '51beb371';   // üretim parmak izi (R 3/4 × 40 tohum + 8 cumartesi Günün Hattı): değişirse eski cumartesiler (arşiv) değişir

module.exports = async T => {
  const { browser, URL, open, check, solve, shot, getSave, waitModal, tapTile } = T;
  const errs = [];
  const SAVE = { played: 30, level: 80, remindAsked: true, streak: 2, lastDaily: '2026-11-06', dailyDone: '2026-11-06', dailyLog: ['2026-11-05', '2026-11-06'] };

  // ---------- a) hangi gün: yalnız cumartesi altıgen; pazar haftanın kuralı; dailyBase eski kare bulmaca ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 9 } });
    const r = await page.evaluate(() => {
      const R = window.__ray, ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, o = { bad: [], sat: 0, r3: 0, r4: 0 };
      for (let k = 0; k < 120; k++) {
        const d = new Date(2026, 9, 1 + k), s = ymd(d), P = R.dailyFor(s), B = R.dailyBase(s), wd = d.getDay();
        if (wd === 6) {
          o.sat++; if (P.R === 3) o.r3++; else o.r4++;
          if (!P.hex || B.hex || P.week || P.rules || R.dailyRule(s) || P.R !== R.HX.ringsFor(P.z) || P.cur.length !== (P.R === 3 ? 37 : 61) || B.cur.length < 48) o.bad.push(s);
        } else if (P.hex || (wd === 0 && !P.week)) o.bad.push(s);
      }
      return o;
    });
    check('hex.day', `Altıgen gün yalnız cumartesi (120 günde ${r.sat} cumartesi: ${r.r3}× 3 halka, ${r.r4}× 4 halka, zorluk dalgasına göre); pazar haftanın kuralı sürer, öteki günler kare; dailyBase cumartesi eski kare bulmaca`,
      r.bad.length === 0 && r.sat === 17 && r.r3 > 0 && r.r4 > 0, JSON.stringify(r));
    errs.push(...errors); await ctx.close();
  }

  // ---------- b) üretim: çözülebilir, çözülmüş gelmez, kapsayan ağaç, şekil çeşidi, bit bit aynı, hızlı ----------
  {
    const fp = async () => {
      const { ctx, page, errors } = await open(browser, URL, { save: { played: 9 } });
      const g = await page.evaluate(() => {
        const { HX, lit } = window.__ray, popc = m => { let c = 0; for (; m; m &= m - 1) c++; return c; }, o = { n: 0, bad: 0, pre: 0, tree: 0, adj: 0, deg5: 0, shapes: {}, fp: '' };
        const kind = m => { const k = popc(m), a = [0, 1, 2, 3, 4, 5].filter(b => m >> b & 1); if (k === 1) return 'uç'; if (k === 2) { const g = (a[1] - a[0]) % 6; return g === 3 ? 'düz' : g === 1 || g === 5 ? 'dar' : 'geniş'; } if (k === 3) return m === 21 || m === 42 ? 'Y' : 'üçlü'; return k + 'kol'; };
        for (const R of [3, 4]) {
          const B = HX.board(R);
          for (let i = 0; i < B.n; i++) for (let k = 0; k < 6; k++) { const j = B.adj[i * 6 + k]; if (j >= 0 && B.adj[j * 6 + (k + 3) % 6] !== i) o.adj++; }
          for (let s = 1; s <= 300; s++) {
            const P = HX.generate(R, s * 7919 + 13); o.n++;
            if (!lit({ ...P, cur: P.sol }).solved) o.bad++;
            if (lit(P).solved) o.pre++;
            if (P.sol.reduce((a, m) => a + popc(m), 0) !== 2 * (P.cur.length - 1)) o.tree++;
            P.sol.forEach(m => { const k = kind(m); o.shapes[k] = (o.shapes[k] || 0) + 1; if (popc(m) >= 5) o.deg5++; });
            if (s <= 40) o.fp += P.sol.join('') + P.cur.join('') + P.par;
          }
        }
        for (let k = 0; k < 8; k++) { const d = new Date(2026, 10, 7 + 7 * k), P = window.__ray.dailyFor(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`); o.fp += P.sol.join('') + P.cur.join('') + P.par + P.diff; }
        let h = 2166136261; for (const c of o.fp) h = Math.imul(h ^ c.charCodeAt(0), 16777619); o.fp = (h >>> 0).toString(16);
        // süre: önbellekte olmayan 12 cumartesi (pick + zorluk çözücüsü dahil)
        const ms = []; for (let k = 0; k < 12; k++) { const d = new Date(2027, 0, 2 + 7 * k), s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, t = performance.now(); window.__ray.dailyFor(s); ms.push(performance.now() - t); }
        o.ms = { avg: Math.round(ms.reduce((a, b) => a + b) / ms.length), max: Math.round(Math.max(...ms)) };
        return o;
      });
      errs.push(...errors); await ctx.close(); return g;
    };
    const g = await fp(), g2 = await fp();
    const want = ['uç', 'dar', 'geniş', 'düz', 'Y', 'üçlü', '4kol'];
    check('hex.gen', `Altıgen üretim: ${g.n} tohum (3 ve 4 halka) → çözüm çözülü, çözülmüş gelmez, kapsayan ağaç (kol sayısı 2·(n−1)), komşuluk simetrik; şekiller: ${want.map(k => `${k} ${g.shapes[k] || 0}`).join(' · ')}`,
      g.bad === 0 && g.pre === 0 && g.tree === 0 && g.adj === 0 && want.every(k => g.shapes[k] > 0) && g.deg5 < g.n / 20, JSON.stringify({ ...g, ms: undefined }));
    check('hex.fp', `Altıgen üretim bit bit aynı: iki ayrı sayfada aynı parmak izi, sabit (${FP_HEX})`, g.fp === g2.fp && g.fp === FP_HEX, JSON.stringify({ fp: g.fp, fp2: g2.fp }));
    check('hex.fast', `Altıgen Günün Hattı üretimi telefon için makul: masaüstünde ort. ${g.ms.avg} ms, en çok ${g.ms.max} ms (< 60 ms)`, g.ms.max < 60, JSON.stringify(g.ms), 'medium');
  }

  // ---------- c) dokunma isabeti: her karonun kenarına ve köşesine yakın nokta o karoyu seçer; tahta dışı −1 ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 9 } });
    const h = await page.evaluate(() => {
      const { HX } = window.__ray, o = { n: 0, bad: 0, out: 0 };
      for (const R of [3, 4]) {
        const G = { R }, g = { s: 40, ox: 200, oy: 300 }, B = HX.board(R), rad = g.s / Math.sqrt(3);
        for (let i = 0; i < B.n; i++) {
          const [x, y] = HX.xy(G, i, g);
          for (let k = 0; k < 6; k++) {
            const ea = k * Math.PI / 3, ca = (k * 60 - 90) * Math.PI / 180;   // kenar ortası yönü · köşe yönü
            for (const [px, py] of [[x + Math.cos(ea) * g.s / 2 * .9, y + Math.sin(ea) * g.s / 2 * .9], [x + Math.cos(ca) * rad * .85, y + Math.sin(ca) * rad * .85]]) { o.n++; if (HX.hit(G, g, px, py) !== i) o.bad++; }
            // komşusu olmayan yönde bir karo öteye: tahta dışı
            if (B.adj[i * 6 + k] < 0) { o.n++; if (HX.hit(G, g, x + Math.cos(ea) * g.s * 1.1, y + Math.sin(ea) * g.s * 1.1) !== -1) o.out++; }
          }
        }
      }
      return o;
    });
    check('hex.hit', `Dokunma isabeti: ${h.n} nokta (her karonun 6 kenarına ve 6 köşesine yakın, kenar dışı) doğru karoyu ya da tahta dışını verir`, h.bad === 0 && h.out === 0 && h.n > 1000, JSON.stringify(h));
    errs.push(...errors); await ctx.close();
  }

  // ---------- d) cumartesi oynanış: ana sayfa ⬡, kural kartı bir kez, robot par hamlede çözer, seri/bilet/görev/paylaşım ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { init: clock(...SAT), save: { ...SAVE, wk: { id: '2026-11-02', q: [{ t: 'daily', n: 3, p: 0 }, { t: 'win', n: 9, p: 0 }, { t: 'perfect', n: 9, p: 0 }], all: 0 } } });
    const home = await page.evaluate(() => document.getElementById('dailyK').textContent);
    await shot(page, 'hex-home');
    await page.click('#bDaily'); await page.waitForTimeout(800);
    const card = await page.evaluate(() => ({ open: document.getElementById('modal').classList.contains('open'), t: document.getElementById('mCard')?.textContent || '', paused: !window.__ray.G.runAt, sub: document.getElementById('gMoves').textContent, demo: getComputedStyle(document.querySelector('.rd-hex .rl') || document.body).animationName }));
    await shot(page, 'hex-card');
    if (card.open) await page.click('#mGo'); await page.waitForTimeout(500);
    await shot(page, 'hex-game');
    const g0 = await page.evaluate(() => { const G = window.__ray.G; return { hex: !!G.hex, n: G.cur.length, par: G.par, plan: window.__ray.plan().length, taps: G.taps, lim: G.lim, moves: G.moves }; });
    const taps = await solve(page, 12); const won = await waitModal(page);
    const fin = await page.evaluate(() => { const G = window.__ray.G; return { moves: G.moves, won: G.won, st: document.querySelectorAll('#winPanel .stars .on').length }; });
    await shot(page, 'hex-win');
    const s = await getSave(page);
    await page.click('#bBack'); await page.waitForTimeout(600);
    await page.click('#bDaily'); await page.waitForTimeout(600);
    if (await page.$('#mShare')) { await page.click('#mShare'); await page.waitForTimeout(300); }
    const share = await page.evaluate(() => window.__log.share[0] || '');
    // ikinci kez (pratik): kart yeniden açılmaz
    await page.evaluate(() => document.getElementById('mReplay')?.click()); await page.waitForTimeout(700);
    const again = await page.evaluate(() => ({ hex: !!window.__ray.G?.hex, card: !!document.getElementById('mCard')?.textContent.match(/ALTIGEN/) && document.getElementById('modal').classList.contains('open') }));
    check('hex.home', 'Cumartesi ana sayfa Günün Hattı kartında ⬡; oyun başlığında "⬡ Altıgen"', /⬡/.test(home) && /⬡ Altıgen/.test(card.sub), JSON.stringify({ home, sub: card.sub }), 'medium');
    check('hex.card', 'İlk altıgen günde kısa kural kartı ("CUMARTESİ · ALTIGEN GÜN", 60° animasyonu), kart açıkken süre durur; görülünce bir daha açılmaz', card.open && /ALTIGEN GÜN/.test(card.t) && /60°/.test(card.t) && card.paused && card.demo === 'rdhx' && s.seen?.hex === 1 && again.hex && !again.card, JSON.stringify({ ...card, seen: s.seen?.hex, again }));
    check('hex.robot', `Robot plan() ile par hamlede çözer: ${g0.n} karo, par ${g0.par}, ${taps} dokunuş (60°), hamle ${fin.moves} ≤ hedef ${g0.lim.m}, 3★`, g0.hex && won && fin.won && fin.moves === g0.par && g0.plan === g0.taps && taps === g0.taps && fin.st === 3 && g0.lim.m > g0.par, JSON.stringify({ g0, fin, taps }));
    check('hex.daily', 'Altıgen Günün Hattı bitince seri +1, +1 ipucu, +1 🎫, görev ilerler; paylaşım metninde ⬡', s.dailyDone === SAT_S && s.streak === 3 && s.dt === 1 && s.wk?.q.find(q => q.t === 'daily')?.p === 1 && /⬡/.test(share) && /7\.11/.test(share), JSON.stringify({ dailyDone: s.dailyDone, streak: s.streak, dt: s.dt, share }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- e) ipucu, kenardan dokunuş, yarım oyun, duraklat ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { init: clock(...SAT), save: { ...SAVE, hints: 3, seen: { hex: 1 } } });
    await page.click('#bDaily'); await page.waitForTimeout(700);
    // ipucu: bir karo çözüm yönüne oturur, sabitlenir; sabit karo dönmez
    const h0 = await page.evaluate(() => { const G = window.__ray.G; return { wrong: G.cur.filter((v, i) => v !== G.sol[i]).length, plan: window.__ray.plan().length }; });
    await page.click('#bHint'); await page.waitForTimeout(400);
    const h1 = await page.evaluate(() => { const G = window.__ray.G, i = G.fixed.indexOf(true); return { i, ok: i >= 0 && G.cur[i] === G.sol[i], fixed: G.fixed.filter(Boolean).length, wrong: G.cur.filter((v, i) => v !== G.sol[i]).length, plan: window.__ray.plan().length, hints: JSON.parse(localStorage.ray).hints }; });
    const fv = await page.evaluate(i => window.__ray.G.cur[i], h1.i);
    await tapTile(page, h1.i); await page.waitForTimeout(300);
    const fv2 = await page.evaluate(i => window.__ray.G.cur[i], h1.i);
    check('hex.hint', `İpucu bir karoyu oturtur ve sabitler (yanlış ${h0.wrong} → ${h1.wrong}), sabit karo dönmez, plan kısalır`, h1.ok && h1.fixed === 1 && h1.wrong === h0.wrong - 1 && h1.plan < h0.plan && h1.hints === 2 && fv === fv2, JSON.stringify({ h0, h1, fv, fv2 }));
    // gerçek dokunuş: tahtanın en dış halkasındaki karolar, merkezden uzak kenar/köşe yakınından dokunulur → yalnız o karo 60° döner
    const rim = await page.evaluate(() => {
      const { G, geo, HX } = window.__ray, r = document.getElementById('cv').getBoundingClientRect(), B = HX.board(G.R), out = [];
      for (let i = 0; i < B.n; i++) { const [q, rr] = B.cells[i]; if (Math.max(Math.abs(q), Math.abs(rr), Math.abs(q + rr)) !== G.R || G.fixed[i]) continue;
        const [x, y] = HX.xy(G, i, geo), k = [0, 1, 2, 3, 4, 5].find(k => B.adj[i * 6 + k] < 0), a = k * Math.PI / 3, ca = ((k * 60 - 90) * Math.PI) / 180;
        out.push({ i, x: r.left + x + Math.cos(a) * geo.s * .42, y: r.top + y + Math.sin(a) * geo.s * .42 }, { i, x: r.left + x + Math.cos(ca) * geo.s / Math.sqrt(3) * .8, y: r.top + y + Math.sin(ca) * geo.s / Math.sqrt(3) * .8 }); }
      return out.filter((_, k) => k % 3 === 0).slice(0, 12);
    });
    let tapBad = 0;
    for (const p of rim) {
      const before = await page.evaluate(() => window.__ray.G.cur.slice());
      await page.mouse.click(p.x, p.y); await page.waitForTimeout(60);
      const after = await page.evaluate(() => window.__ray.G.cur.slice());
      const diff = after.map((v, j) => v !== before[j] ? j : -1).filter(j => j >= 0), rot = m => ((m << 1) | (m >> 5)) & 63;
      if (diff.length > 1 || (diff.length === 1 && diff[0] !== p.i) || after[p.i] !== rot(before[p.i])) tapBad++;
    }
    check('hex.tap', `Gerçek dokunuş: dış halkada ${rim.length} kenar/köşe yakını noktada yalnız o karo 60° döner`, rim.length >= 8 && tapBad === 0, JSON.stringify({ n: rim.length, tapBad }));
    // yarım oyun: kaydedilir, yeniden açılınca aynı dizilim ve hamle
    const mid = await page.evaluate(() => { const G = window.__ray.G; return { cur: G.cur.join(), moves: G.moves, fixed: G.fixed.filter(Boolean).length }; });
    await page.reload(); await page.waitForTimeout(500); await page.click('#bDaily'); await page.waitForTimeout(700);
    const res = await page.evaluate(() => { const G = window.__ray.G; return { hex: !!G.hex, cur: G.cur.join(), moves: G.moves, fixed: G.fixed.filter(Boolean).length }; });
    // duraklat: süre durur, pencere açılır
    await page.click('#bBack'); await page.waitForTimeout(500);
    const pz = await page.evaluate(() => ({ open: document.getElementById('modal').classList.contains('open'), run: !!window.__ray.G.runAt }));
    check('hex.resume', `Yarım altıgen oyun kaydedilir ve sürer (${mid.moves} hamle, ipucu karosu korunur); duraklatınca süre durur`, res.hex && res.cur === mid.cur && res.moves === mid.moves && res.fixed === 1 && mid.moves > 0 && pz.open && !pz.run, JSON.stringify({ mid: { moves: mid.moves }, res: { moves: res.moves, same: res.cur === mid.cur, fixed: res.fixed }, pz }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- f) 320×568: tahta ekrana sığar, karo dokunulacak boyda, yatay taşma yok (4 halka, koyu ve açık tema) ----------
  {
    const out = [];
    for (const scheme of ['dark', 'light']) {
      const { ctx, page, errors } = await open(browser, URL, { vp: [320, 568], scheme, init: clock(2026, 10, 21), save: { ...SAVE, seen: { hex: 1 } } });
      await page.click('#bDaily'); await page.waitForTimeout(800);
      const f = await page.evaluate(() => {
        const { G, geo, HX } = window.__ray, r = document.getElementById('cv').getBoundingClientRect(), b = document.getElementById('board').getBoundingClientRect(), B = HX.board(G.R);
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; const rad = geo.s / Math.sqrt(3);
        for (let i = 0; i < B.n; i++) { const [x, y] = HX.xy(G, i, geo); x0 = Math.min(x0, x - geo.s / 2); x1 = Math.max(x1, x + geo.s / 2); y0 = Math.min(y0, y - rad); y1 = Math.max(y1, y + rad); }
        return { R: G.R, s: geo.s, box: [r.left + x0, r.top + y0, r.left + x1, r.top + y1].map(Math.round), board: [b.left, b.top, b.right, b.bottom].map(Math.round), vw: innerWidth, vh: innerHeight, ov: document.documentElement.scrollWidth - innerWidth };
      });
      await shot(page, `hex-320-${scheme}`);
      out.push(f); errs.push(...errors); await ctx.close();
    }
    const ok = f => f.R === 4 && f.s >= 30 && f.box[0] >= f.board[0] && f.box[2] <= f.board[2] && f.box[1] >= f.board[1] && f.box[3] <= f.board[3] && f.box[2] <= f.vw && f.box[3] <= f.vh && f.ov <= 0;
    check('hex.320', `320×568 (4 halka, 61 karo): tahta ekrana sığar, karo genişliği ${out[0].s} px (≥ 30), yatay taşma yok — koyu ve açık tema`, out.every(ok), JSON.stringify(out));
  }

  // ---------- g) İngilizce ve Almanca: kart ve başlık çevrili, eksik çeviri yok ----------
  {
    const t = {};
    for (const [locale, lang] of [['en-US', null], ['de-DE', 'de']]) {
      const { ctx, page, errors } = await open(browser, URL, { locale, init: clock(...SAT), save: { ...SAVE, ...(lang ? { lang } : {}) } });
      await page.click('#bDaily'); await page.waitForTimeout(800);
      t[locale] = await page.evaluate(() => ({ card: document.getElementById('mCard')?.textContent.replace(/\s+/g, ' ') || '', sub: document.getElementById('gMoves').textContent, miss: [...(window.__L_MISS || [])] }));
      if (locale === 'en-US') await shot(page, 'hex-card-en');
      errs.push(...errors); await ctx.close();
    }
    const en = t['en-US'], de = t['de-DE'];
    check('hex.en', 'İngilizce: "SATURDAY · HEX DAY", "⬡ Hex day", 60°, başlıkta "⬡ Hex"; Almanca: "SAMSTAG", "Sechseck", sözlükte eksik yok', /SATURDAY · HEX DAY/.test(en.card) && /Hex day/.test(en.card) && /60°/.test(en.card) && /⬡ Hex/.test(en.sub) && /SAMSTAG/.test(de.card) && /Sechseck/.test(de.sub) && !de.miss.length, JSON.stringify({ en: en.card.slice(0, 80), sub: en.sub, de: de.card.slice(0, 60), dsub: de.sub, miss: de.miss }), 'medium');
  }

  // ---------- h) arşiv: geçmiş cumartesi de altıgen, ızgarada ⬡ işareti ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { init: clock(2026, 10, 10), save: { ...SAVE, seen: { hex: 1 }, arch: { '2026-11-07': 1 } } });
    await page.click('#streakChip'); await page.waitForTimeout(400);   // seri penceresi › 📅 Geçmiş günler
    await page.click('#mArch'); await page.waitForTimeout(400);
    await shot(page, 'hex-arch');
    const grid = await page.evaluate(() => [...document.querySelectorAll('#archGrid button.hex')].map(b => b.dataset.d));
    await page.evaluate(() => { const b = document.querySelector('#archGrid button[data-d="2026-11-07"]'); if (b) b.click(); });
    await page.waitForTimeout(700);
    const st = await page.evaluate(() => ({ g: !!window.__ray.G, hex: !!window.__ray.G?.hex, arch: !!window.__ray.G?.arch, title: document.getElementById('gTitle').textContent }));
    check('hex.arch', 'Arşiv: geçmiş cumartesi altıgen açılır, ızgarada cumartesiler ⬡ işaretli', grid.includes('2026-11-07') && grid.includes('2026-10-31') && grid.length >= 4 && st.hex && st.arch, JSON.stringify({ grid, st }), 'medium');
    errs.push(...errors); await ctx.close();
  }

  check('hex.errors', 'Altıgen gün senaryolarında konsol hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
};
