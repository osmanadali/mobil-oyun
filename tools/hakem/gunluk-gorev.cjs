// Haftalık görevler, 🎫 bilet, Günün Hattı arşivi ve haftanın kuralı (pazar) — hakem.cjs K bölümü çağırır
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
    const { ctx, page, errors } = await open(browser, URL, { init: clock(2026, 10, 1), save: { played: 30, level: 80, stars: starsUpTo(80), remindAsked: true, tickets: 0, streak: 2, lastDaily: '2026-10-31', dailyDone: '2026-10-31', dailyLog: ['2026-10-30', '2026-10-31'], seen: {}, wk: { id: '2026-10-26', q: [{ t: 'daily', n: 3, p: 0 }, { t: 'win', n: 9, p: 0 }, { t: 'perfect', n: 9, p: 0 }], all: 0 } } });
    await page.click('#bDaily'); await page.waitForTimeout(700);
    const card = await page.evaluate(() => { const R = window.__ray, c = R.RULE_LINE[R.G.week]; return { open: document.getElementById('modal').classList.contains('open'), t: document.getElementById('mCard').textContent, k: R.G.week, c, name: R.RULES[c]?.name, sub: document.getElementById('gMoves').textContent }; });
    await page.click('#mGo'); await page.waitForTimeout(300);
    await solve(page, 8); const won = await waitModal(page);
    const s = await getSave(page), panel = await page.evaluate(() => document.getElementById('winPanel').textContent);
    check('week.card', 'Pazar Günün Hattı: kuralı görmeyen oyuncuya "Haftanın kuralı" kartı açılır, başlıkta kural adı',
      card.open && /HAFTANIN KURALI/.test(card.t) && card.k && card.name && card.sub.includes(card.name) && card.t.includes(card.name) && s.seen?.[card.c] === 1, JSON.stringify(card).slice(0, 200));
    check('ticket.daily', 'Bilet: Günün Hattı bitince +1 🎫 (günde bir), seri sürer, görevde sayılır',
      won && s.tickets === 1 && s.streak === 3 && s.dailyDone === '2026-11-01' && /🎫/.test(panel) && s.wk?.q.find(q => q.t === 'daily')?.p === 1, JSON.stringify({ won, tk: s.tickets, streak: s.streak, wk: s.wk }));
    // pratik (ikinci kez): bilet yeniden verilmez
    const tk = s.tickets;
    await page.evaluate(() => window.__ray && document.getElementById('mHome').click()); await page.waitForTimeout(500);
    await page.click('#bDaily'); await page.waitForTimeout(500);
    const res = await page.evaluate(() => document.getElementById('mReplay') ? (document.getElementById('mReplay').click(), 1) : 0); await page.waitForTimeout(500);
    const again = await page.evaluate(() => document.getElementById('modal').classList.contains('open'));   // kural görüldü → kart yok
    await solve(page, 8); await waitModal(page);
    const s2 = await getSave(page);
    check('ticket.once', 'Bilet: aynı günün Günün Hattı pratikte yeniden bilet vermez; görülen kuralın kartı yeniden açılmaz', res && !again && s2.tickets === tk, JSON.stringify({ res, again, tk, now: s2.tickets }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- c) haftalık görevler: herkeste aynı tohum, yeni oyuncuya ağır görev yok, pazartesi yenilenir ----------
  {
    const mk = async (x, init) => { const o = await open(browser, URL, { init, save: { played: 30, remindAsked: true, ...x } }); const w = await o.page.evaluate(() => window.__ray.weekQ()); await o.ctx.close(); errs.push(...o.errors); return w; };
    const wed = clock(2026, 10, 4), sun = clock(2026, 10, 8), mon = clock(2026, 10, 9);
    const fresh = await mk({ level: 5 }, wed), vet = await mk({ level: 400, dailyDone: '2026-11-03', bst: { geri: 3, sure: 2 } }, wed), vet2 = await mk({ level: 500, dailyDone: '2026-11-01', bst: { geri: 1, sure: 4 } }, sun), vet3 = await mk({ level: 500, dailyDone: '2026-11-01', bst: { geri: 1, sure: 4 } }, mon);
    const T = w => w.q.map(q => q.t + q.n).join();
    check('quest.tier', 'Haftalık görev: 3 görev; yeni oyuncuya Günün Hattı/güçlendirici görevi ve büyük sayı çıkmaz, deneyimliye daha çok',
      fresh.q.length === 3 && vet.q.length === 3 && fresh.q.every(q => q.t !== 'daily' && q.t !== 'bst' && q.n <= 5) && vet.q.some(q => q.n >= 8 || q.t === 'daily' || q.t === 'bst') && fresh.id === '2026-11-02',
      JSON.stringify({ fresh: T(fresh), vet: T(vet) }));
    check('quest.seed', 'Haftalık görev: aynı haftada aynı basamaktaki oyunculara aynı görevler (pazar dahil), pazartesi yeni hafta',
      T(vet) === T(vet2) && vet2.id === '2026-11-02' && vet3.id === '2026-11-09', JSON.stringify({ vet: T(vet), vet2: T(vet2), vet3: T(vet3), id3: vet3.id }));
  }

  // ---------- d) görev tamamlanınca ödül: +1 🎫 ve 💡/👑; üçü birden +1 🎫 ek; taçlı bölümü tekrar oynamak sayılmaz ----------
  {
    const wid = '2026-11-02', L0 = 40;
    const wk = { id: wid, q: [{ t: 'win', n: 3, p: 2 }, { t: 'nohint', n: 3, p: 2 }, { t: 'perfect', n: 3, p: 3 }], all: 0 };
    const { ctx, page, errors } = await open(browser, URL, { init: clock(2026, 10, 4), save: { played: 30, level: L0, stars: starsUpTo(L0), seen: SEEN, remindAsked: true, tickets: 0, hints: 3, hintDay: '2026-11-04', wk } });
    const crown0 = await page.evaluate(() => +document.getElementById('sCrowns').textContent);
    await page.click('#bPlay'); await page.waitForTimeout(600);
    await solve(page, 8); await waitModal(page);
    const s = await getSave(page), panel = await page.evaluate(() => document.getElementById('winPanel').textContent);
    check('quest.reward', 'Haftalık görev: "bölüm bitir" ve "ipucusuz" tamamlanınca her biri +1 🎫 +1 💡; üçü bitince +1 🎫 ek; sonuç panelinde yazar',
      s.tickets === 3 && s.wk.all === 1 && s.wk.q.every(q => q.p >= q.n) && s.hints >= 5 && /Görev tamam/.test(panel), JSON.stringify({ tk: s.tickets, hints: s.hints, wk: s.wk, panel: panel.slice(0, 160) }));
    errs.push(...errors); await ctx.close();
    // taçlı eski bölüm + ipucu: görev ilerlemez / ipucusuz sayılmaz
    const wk2 = { id: wid, q: [{ t: 'win', n: 5, p: 0 }, { t: 'nohint', n: 5, p: 0 }, { t: 'perfect', n: 5, p: 0 }], all: 0 };
    const o = await open(browser, URL, { init: clock(2026, 10, 4), save: { played: 30, level: L0, stars: starsUpTo(L0), crowns: { 3: 1 }, seen: SEEN, remindAsked: true, hints: 3, hintDay: '2026-11-04', wk: wk2 } });
    await o.page.evaluate(() => window.__ray && null);
    await o.page.click('#bMap'); await o.page.waitForTimeout(300);
    await o.page.evaluate(() => { document.querySelector('[data-l="3"]')?.click(); }); await o.page.waitForTimeout(500);
    const startedOld = await o.page.evaluate(() => window.__ray.G?.lvl);
    if (startedOld === 3) { await solve(o.page, 8); await waitModal(o.page); }
    const sa = await getSave(o.page);
    await o.page.click('#mHome').catch(() => {}); await o.page.waitForTimeout(400);
    await o.page.click('#bPlay'); await o.page.waitForTimeout(600);
    await o.page.click('#bHint'); await o.page.waitForTimeout(300);
    await solve(o.page, 8); await waitModal(o.page);
    const sb = await getSave(o.page), q = t => sb.wk.q.find(x => x.t === t).p;
    check('quest.fair', 'Haftalık görev: taçlı bölümü tekrar oynamak sayılmaz; ipucu kullanılan bölüm "ipucusuz" görevine sayılmaz',
      (startedOld !== 3 || sa.wk.q.every(x => x.p === 0)) && q('win') === 1 && q('nohint') === 0, JSON.stringify({ startedOld, a: sa.wk.q, b: sb.wk.q }));
    errs.push(...o.errors); await o.ctx.close();
  }

  // ---------- e) güçlendirici görevi: kullanılınca ilerler ----------
  {
    const wk = { id: '2026-11-02', q: [{ t: 'bst', n: 1, p: 0 }, { t: 'win', n: 9, p: 0 }, { t: 'perfect', n: 9, p: 0 }], all: 0 };
    const { ctx, page, errors } = await open(browser, URL, { init: clock(2026, 10, 4), save: { played: 30, level: 20, stars: starsUpTo(20), seen: SEEN, remindAsked: true, bst: { geri: 1 }, tickets: 0, wk } });
    await page.click('#bPlay'); await page.waitForTimeout(600);
    const i = await page.evaluate(() => { const G = window.__ray.G; return G.cur.findIndex((v, k) => !G.pinned[k] && G.link[k] < 0 && v !== G.sol[k]); });
    await T.tapTile(page, i); await page.waitForTimeout(200);
    await page.click('#gUndo'); await page.waitForTimeout(300);
    const s = await getSave(page);
    check('quest.bst', 'Haftalık görev: güçlendirici kullanınca "güçlendirici kullan" ilerler, tamamlanınca +1 🎫', s.wk.q[0].p === 1 && s.tickets === 1, JSON.stringify({ q: s.wk.q[0], tk: s.tickets }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- f) arşiv: 1 🎫 ile geçmiş gün açılır (kalıcı), seriyi etkilemez, kusursuz → 👑, paylaşımda "geçmiş gün" ----------
  {
    const DAY = '2026-11-01';   // pazar (haftanın kuralı)
    const save = { played: 30, level: 80, stars: starsUpTo(80), seen: SEEN, remindAsked: true, tickets: 1, streak: 4, best: 4, lastDaily: '2026-11-10', dailyDone: '2026-11-10', dailyLog: ['2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10'] };
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
    check('arch.open', 'Arşiv: seri ekranından açılır, son 30 gün listelenir (oynanan günler ✓, kapalı günler 🎫); 1 🎫 ile açılan gün kalıcı, oyun "geçmiş gün" başlığıyla başlar',
      inStreak && grid.length === 30 && grid[0].startsWith('2026-11-09:on') && grid.some(c => c.startsWith(DAY + ':') && c.endsWith('🎫')) && /🎫 1/.test(ask) && s0.tickets === 0 && s0.arch?.[DAY] === 1 && g.arch && g.day === DAY && /geçmiş gün/.test(g.title) && !!g.week,
      JSON.stringify({ inStreak, n: grid.length, g0: grid[0], g, tk: s0.tickets }));
    const perfect = s.archDone?.[DAY] === 2;
    check('arch.win', 'Arşiv: bitince seri, günlük kayıt ve bugünün sonucu değişmez; kusursuzsa +1 👑; paylaşım "geçmiş gün" der, meydan okuma bağlantısı taşımaz',
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
    check('arch.keep', 'Arşiv: açılmış gün bilet istemeden yeniden oynanır (ödülsüz); bilet yoksa kapalı gün açılmaz, görevlere yönlendirir',
      again.arch && again.practice && !again.modal && /Bilet yok/.test(noTk), JSON.stringify({ again, noTk }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- g) ana sayfa: tek satır görev girişi (yeni oyuncuda gizli), küçük ekranda düğmeler görünür; İngilizce ----------
  {
    const a = await open(browser, URL, { vp: [320, 568], save: { played: 3, level: 1, remindAsked: true } });
    const hid = await a.page.evaluate(() => document.getElementById('bQuest').hidden); errs.push(...a.errors); await a.ctx.close();
    const b = await open(browser, URL, { vp: [320, 568], save: { played: 30, level: 61, stars: starsUpTo(61), remindAsked: true, tickets: 2 } });
    const row = await b.page.evaluate(() => ({ vis: !document.getElementById('bQuest').hidden, h: document.getElementById('bQuest').getBoundingClientRect().height, t: document.getElementById('bQuest').textContent }));
    const vp = {}; for (const s of ['#bPlay', '#bDaily', '#bQuest', '#bMap']) vp[s] = (await inViewport(b.page, s)).ok;
    await b.page.click('#bQuest'); await b.page.waitForTimeout(400);
    const sheet = await b.page.evaluate(() => ({ n: document.querySelectorAll('.quests > div').length, t: document.getElementById('mCard').textContent, fit: document.getElementById('mCard').scrollWidth <= document.getElementById('mCard').clientWidth + 1 }));
    check('quest.home', 'Ana sayfa: görevler Günün Hattı kartının altında tek ince satır (≤ 34 px, 🎫 sayısıyla), yeni oyuncuda gizli; 320×568\'de Oyna/Günün Hattı/Hatlar görünür; pencerede 3 görev',
      hid && row.vis && row.h <= 34 && /🎫 2/.test(row.t) && Object.values(vp).every(Boolean) && sheet.n === 3 && sheet.fit && /Geçmiş günler/.test(sheet.t), JSON.stringify({ hid, row, vp, sheet: { ...sheet, t: sheet.t.slice(0, 80) } }));
    errs.push(...b.errors); await b.ctx.close();
    const c = await open(browser, URL, { locale: 'en-US', vp: [320, 568], save: { played: 30, level: 61, stars: starsUpTo(61), remindAsked: true, tickets: 1 } });
    await c.page.click('#bQuest'); await c.page.waitForTimeout(400);
    const en = await c.page.evaluate(() => document.getElementById('bQuest').textContent + '|' + document.getElementById('mCard').textContent);
    await c.page.click('#mArch'); await c.page.waitForTimeout(400);
    const enA = await c.page.evaluate(() => document.getElementById('mCard').textContent);
    check('quest.en', 'İngilizce: görev satırı, görev penceresi ve arşiv İngilizce (Türkçe kelime yok)',
      /Weekly quests/.test(en) && /Past days/.test(en) && /Daily Line archive/.test(enA) && !/[ğışçöü]|görev|bilet|Bölüm/i.test(en + enA), (en + ' || ' + enA).slice(0, 300));
    errs.push(...c.errors); await c.ctx.close();
  }

  check('daily2.errors', 'Haftalık görev / bilet / arşiv testlerinde JS hatası yok', !errs.length, errs.slice(0, 3).join(' | '));
};
