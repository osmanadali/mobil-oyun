// Günün Hattı arşivi (🎫 bilet ile) ve haftanın kuralı (pazar) — hakem.cjs K bölümü çağırır
// Bölüm numarasına bağlı değil: kurallı bölüm gerekirse __ray.lineStart(RULE_LINE[k]) kullanılır.
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// Günün Hattı'nın pazar dışındaki günleri: haftanın kuralından ÖNCE ölçülen parmak izi (2026-10-01'den 70 gün, pazarlar hariç; FNV-1a)
const FP_WEEKDAYS = '397d7f63';
// sahte saat: oyun bu yerel anı "şimdi" sanır (performance.now dokunulmaz)
const clock = (y, m, d, h = 12) => `{ const D = Date, off = new D(${y}, ${m}, ${d}, ${h}).getTime() - D.now();
  class FD extends D { constructor(...a) { super(...(a.length ? a : [D.now() + off])); } static now() { return D.now() + off; } }
  window.Date = FD; }`;
const SEEN = Object.fromEntries(Array.from({ length: 24 }, (_, k) => [k, 1]));

module.exports = async T => {
  const { browser, URL, open, check, solve, getSave, waitModal, starsUpTo, inViewport } = T;
  const errs = [];

  // ---------- a) haftanın kuralı: yalnız pazar değişir, kural haftaya göre döner, herkeste aynı ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 9 } });
    const r = await page.evaluate(() => {
      const R = window.__ray, fnv = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0).toString(16); };
      const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      let wd = ''; const sun = [];
      for (let k = 0; k < 70; k++) {
        const d = new Date(2026, 9, 1 + k), s = ymd(d), P = R.dailyFor(s);
        if (d.getDay()) { wd += P.sol.join() + '|' + P.cur.join() + ';'; if (P.rules || P.week || R.dailyRule?.(s)) return { bad: s }; }
        else sun.push({ s, k: P.week, rule: R.dailyRule?.(s), rules: (P.rules || []).join(), fog: !!P.fog, two: P.hub2 >= 0, pins: P.pinned.filter(Boolean).length, links: P.link.filter(v => v >= 0).length, rev: (P.rev || []).filter(Boolean).length, cnt: P.cnt.filter(v => v >= 0).length, solved: R.lit({ ...P, cur: P.sol }).solved, fresh: !R.lit(P).solved, n: P.cur.length });
      }
      return { fp: fnv(wd), sun };
    });
    const has = s => ({ fog: s.fog, two: s.two, pins: s.pins > 0, pairs: s.links > 0, rev: s.rev > 0, cnt: s.cnt > 0 }[s.k]);
    const kinds = new Set((r.sun || []).map(s => s.k));
    check('week.fp', 'Haftanın kuralı: pazar dışındaki Günün Hattı bit bit eskisi gibi (60 gün parmak izi), kuralsız',
      !r.bad && r.fp === FP_WEEKDAYS, JSON.stringify({ bad: r.bad, fp: r.fp }));
    check('week.sun', 'Haftanın kuralı: her pazar tek kural taşır, kural bulmacada gerçekten var, çözüm geçerli; 10 pazarda ≥ 6 farklı kural, 7×9',
      r.sun?.length === 10 && r.sun.every(s => s.k && s.k === s.rule && s.rules === s.k && has(s) && s.solved && s.fresh && s.n === 63) && kinds.size >= 6,
      JSON.stringify(r.sun?.map(s => `${s.s}:${s.k}${has(s) ? '' : '!'}${s.solved ? '' : '✗'}`)));
    // iki ayrı sayfa (iki oyuncu) aynı pazar bulmacasını görür
    const { ctx: c2, page: p2 } = await open(browser, URL, { save: { played: 3, level: 400 } });
    const sig = p => p.evaluate(() => { const P = window.__ray.dailyFor('2026-11-01'); return P.week + P.sol.join() + P.cur.join(); });
    check('week.same', 'Haftanın kuralı: farklı ilerlemedeki iki oyuncu pazar günü aynı bulmacayı görür (tohum + kural)', (await sig(page)) === (await sig(p2)));
    errs.push(...errors); await ctx.close(); await c2.close();
  }

  // ---------- b) pazar Günün Hattı: kural kartı (görülmediyse), kazanınca +1 🎫, görev ilerler ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { init: clock(2026, 10, 1), save: { played: 30, level: 80, stars: starsUpTo(80), remindAsked: true, streak: 2, lastDaily: '2026-10-31', dailyDone: '2026-10-31', dailyLog: ['2026-10-30', '2026-10-31'], seen: {} } });
    await page.click('#bDaily'); await page.waitForTimeout(700);
    const card = await page.evaluate(() => { const R = window.__ray, c = R.RULE_LINE[R.G.week]; return { open: document.getElementById('modal').classList.contains('open'), t: document.getElementById('mCard').textContent, k: R.G.week, c, name: R.RULES[c]?.name, sub: document.getElementById('gMoves').textContent }; });
    await page.click('#mGo'); await page.waitForTimeout(300);
    await solve(page, 8); const won = await waitModal(page);
    const s = await getSave(page), panel = await page.evaluate(() => document.getElementById('winPanel').textContent);
    check('week.card', 'Pazar Günün Hattı: kuralı görmeyen oyuncuya "Haftanın kuralı" kartı açılır, başlıkta kural adı',
      card.open && /HAFTANIN KURALI/.test(card.t) && card.k && card.name && card.sub.includes(card.name) && card.t.includes(card.name) && s.seen?.[card.c] === 1, JSON.stringify(card).slice(0, 200));
    check('week.win', 'Pazar Günün Hattı: kurallı bulmaca çözülür, seri sürer, sonuç kaydedilir; kusursuzsa 1 🎫 (dCrowns)',
      won && s.streak === 3 && s.dailyDone === '2026-11-01' && s.dailyStats?.day === '2026-11-01' && (s.dCrowns || 0) === (s.dailyStats.perfect ? 1 : 0) && /Günün Hattı tamam/.test(panel), JSON.stringify({ won, streak: s.streak, d: s.dailyStats }));
    // pratik (ikinci kez): bilet yeniden verilmez
    
    await page.evaluate(() => window.__ray && document.getElementById('mHome').click()); await page.waitForTimeout(500);
    await page.click('#bDaily'); await page.waitForTimeout(500);
    const res = await page.evaluate(() => document.getElementById('mReplay') ? (document.getElementById('mReplay').click(), 1) : 0); await page.waitForTimeout(500);
    const again = await page.evaluate(() => document.getElementById('modal').classList.contains('open'));   // kural görüldü → kart yok
    await solve(page, 8); await waitModal(page);
    const s2 = await getSave(page);
    check('week.once', 'Pazar Günün Hattı pratikte: görülen kuralın kartı yeniden açılmaz, 🎫 yeniden verilmez, seri değişmez', res && !again && (s2.dCrowns || 0) === (s.dCrowns || 0) && s2.streak === 3, JSON.stringify({ res, again, d0: s.dCrowns, d1: s2.dCrowns }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- f) arşiv: 3 🎫 ile geçmiş gün açılır (kalıcı), seriyi etkilemez, kusursuz → +1 🎫, paylaşımda "geçmiş gün" ----------
  {
    const DAY = '2026-11-01';   // pazar (haftanın kuralı)
    const save = { played: 30, level: 80, stars: starsUpTo(80), seen: SEEN, remindAsked: true, crowns: { 1: 1, 2: 1, 3: 1 }, streak: 4, best: 4, lastDaily: '2026-11-10', dailyDone: '2026-11-10', dailyLog: ['2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10'] };
    const { ctx, page, errors } = await open(browser, URL, { init: clock(2026, 10, 10), save });
    await page.click('#streakChip'); await page.waitForTimeout(400);
    const inStreak = await page.evaluate(() => !!document.getElementById('mArch'));
    await page.click('#mArch'); await page.waitForTimeout(400);
    const grid = await page.evaluate(() => [...document.querySelectorAll('#archGrid button')].map(b => b.dataset.d + ':' + b.className.trim() + ':' + b.querySelector('i').textContent));
    await page.click(`#archGrid [data-d="${DAY}"]`); await page.waitForTimeout(400);
    const ask = await page.evaluate(() => document.getElementById('mCard').textContent);
    await page.click('#mYes'); await page.waitForTimeout(700);
    const g = await page.evaluate(() => ({ arch: window.__ray.G.arch, day: window.__ray.G.day, title: document.getElementById('gTitle').textContent, week: window.__ray.G.week }));
    const s0 = await getSave(page);
    await solve(page, 8); const won = await waitModal(page);
    await page.click('#mShare').catch(() => {}); await page.waitForTimeout(200);
    const s = await getSave(page), log = await page.evaluate(() => window.__log.share);
    check('arch.open', 'Arşiv: seri ekranından açılır, son 30 gün listelenir (oynanan günler ✓, kapalı günler 🔒); 3 🎫 ile açılan gün kalıcı, oyun "geçmiş gün" başlığıyla başlar',
      inStreak && grid.length === 30 && grid[0].startsWith('2026-11-09:on') && grid.some(c => c.startsWith(DAY + ':') && c.endsWith('🔒')) && /🎫 3/.test(ask) && s0.spent === 3 && s0.arch?.[DAY] === 1 && g.arch && g.day === DAY && /geçmiş gün/.test(g.title) && !!g.week,
      JSON.stringify({ inStreak, n: grid.length, g0: grid[0], g, spent: s0.spent }));
    const perfect = s.archDone?.[DAY] === 2;
    check('arch.win', 'Arşiv: bitince seri, günlük kayıt ve bugünün sonucu değişmez; kusursuzsa +1 🎫; paylaşım "geçmiş gün" der, meydan okuma bağlantısı taşımaz',
      won && s.archDone?.[DAY] >= 1 && s.streak === 4 && s.dailyDone === '2026-11-10' && !s.dailyLog.includes(DAY) && (s.aCrowns || 0) === (perfect ? 1 : 0) && log.length === 1 && /geçmiş gün/.test(log[0]) && !/\?d=/.test(log[0]),
      JSON.stringify({ won, done: s.archDone, streak: s.streak, ac: s.aCrowns, share: (log[0] || '').replace(/\n/g, ' ⏎ ') }));
    // açılan gün yeniden bilet istemez; arşiv düğmesi arşive döner
    await page.click('#mArch'); await page.waitForTimeout(400);
    await page.click(`#archGrid [data-d="${DAY}"]`); await page.waitForTimeout(600);
    const again = await page.evaluate(() => ({ arch: window.__ray.G.arch, practice: window.__ray.G.practice, modal: document.getElementById('modal').classList.contains('open') }));
    await page.evaluate(() => window.__ray.G && document.getElementById('bBack').click()); await page.waitForTimeout(300);
    await page.click('#streakChip'); await page.waitForTimeout(300); await page.click('#mArch'); await page.waitForTimeout(300);
    await page.click('#archGrid [data-d="2026-10-20"]'); await page.waitForTimeout(400);
    const noTk = await page.evaluate(() => document.getElementById('toast').textContent);
    check('arch.keep', 'Arşiv: açılmış gün bilet istemeden yeniden oynanır (ödülsüz); bilet yetmezse kapalı gün açılmaz, nasıl kazanılacağını söyler',
      again.arch && again.practice && !again.modal && /3 🎫 gerekli/.test(noTk), JSON.stringify({ again, noTk }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- g) arşiv girişi: yeni oyuncuda yok, ana sayfaya yeni düğme eklenmez; İngilizce ----------
  {
    const a = await open(browser, URL, { save: { played: 3, level: 1, remindAsked: true } });
    await a.page.click('#streakChip'); await a.page.waitForTimeout(400);
    const fresh = await a.page.evaluate(() => !document.getElementById('mArch')); errs.push(...a.errors); await a.ctx.close();
    const c = await open(browser, URL, { locale: 'en-US', vp: [320, 568], save: { played: 30, level: 61, stars: starsUpTo(61), remindAsked: true, crowns: { 1: 1 } } });
    const home = await c.page.evaluate(() => document.querySelectorAll('#home button').length);
    await c.page.click('#streakChip'); await c.page.waitForTimeout(400);
    const btn = await c.page.evaluate(() => document.getElementById('mArch')?.textContent || '');
    await c.page.click('#mArch'); await c.page.waitForTimeout(400);
    const enA = await c.page.evaluate(() => ({ t: document.getElementById('mCard').textContent, fit: document.getElementById('mCard').scrollWidth <= document.getElementById('mCard').clientWidth + 1 }));
    await c.page.click('#archGrid button:last-child'); await c.page.waitForTimeout(300);
    const toast = await c.page.evaluate(() => document.getElementById('toast').textContent);
    check('arch.en', 'Arşiv: ilk hat bitmeden seri penceresinde yok; ana sayfada yeni düğme yok (7, main ile aynı); İngilizce metinler (Türkçe kelime yok), 320 px\'de taşmaz, bilet yetmezse söyler',
      fresh && home === 7 && /Past days/.test(btn) && /Daily Line archive/.test(enA.t) && /3 🎫/.test(enA.t) && enA.fit && /needed/.test(toast) && !/[ğışçöü]|bilet|gün/i.test(btn + enA.t + toast), JSON.stringify({ fresh, home, btn, t: enA.t.slice(0, 160), toast }));
    errs.push(...c.errors); await c.ctx.close();
  }

  check('daily2.errors', 'Arşiv / haftanın kuralı testlerinde JS hatası yok', !errs.length, errs.slice(0, 3).join(' | '));
};
