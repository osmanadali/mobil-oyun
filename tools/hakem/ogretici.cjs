// 🎓 Öğretici bölüm: yeni oyuncu doğrudan buraya gelir (zorunlu), adım adım vurgulanan karolar, "şimdi sen dene", bitişte Bölüm 1.
// Kayıtta yalnız save.tut; bölüm, yıldız, can, played, reklam sayacı değişmez. Kayıtlı oyuncu görmez. hakem.cjs K bölümü çağırır; tek başına: --only=ogretici
module.exports = async T => {
  const { browser, URL, open, check, shot, getSave, tapTile } = T;
  const errs = [];
  // ölçüm olayları: olcum.js'in Olcum'u sarmalanır (window.__ev'e ad yazılır)
  const EV = `{ let o; Object.defineProperty(window, 'Olcum', { configurable: true, get: () => o, set: v => { o = { ...v, event: (n, p) => { (window.__ev = window.__ev || []).push(n); return v.event(n, p); } }; o.ev = o.event; } }); }`;
  const st = page => page.evaluate(() => {
    const G = window.__ray.G, tb = document.getElementById('tabbar'), tip = document.getElementById('tutTip');
    return { tut: !!G?.tut, s: G?.tutS, hi: G?.tutHi, won: !!G?.won, lvl: G?.lvl, cur: G?.cur?.join(), lit: G ? G.L.d.map(v => v >= 0 ? 1 : 0).join('') : '', moves: G?.moves,
      game: document.getElementById('game').classList.contains('active'), home: document.getElementById('home').classList.contains('active'),
      title: document.getElementById('gTitle').textContent, txt: document.getElementById('tutTxt').textContent, tab: getComputedStyle(tb).display,
      tip: tip.offsetHeight > 0, back: getComputedStyle(document.getElementById('bBack')).visibility, hint: getComputedStyle(document.querySelector('#game .bottom')).display,
      modal: document.getElementById('modal').classList.contains('open') ? document.getElementById('mCard').textContent.replace(/\s+/g, ' ').trim() : '', ev: window.__ev || [] };
  });
  const tap = async (page, i, w = 260) => { await tapTile(page, i); await page.waitForTimeout(w); };
  // 320 px: yatay taşma yok, adım yazısı ve tahta ekranda, yazı kesilmiyor
  const fit = page => page.evaluate(() => {
    const W = innerWidth, H = innerHeight, t = document.getElementById('tutTip').getBoundingClientRect(), p = document.getElementById('tutTxt'), { geo, G } = window.__ray, b = document.getElementById('board').getBoundingClientRect();
    return { ov: document.documentElement.scrollWidth > W || document.body.scrollWidth > W, tip: t.left >= 0 && t.right <= W + 1 && t.top >= 0, cut: p.scrollWidth > p.clientWidth + 1,
      board: b.top + geo.oy + geo.s * G.rows <= H + 1, s: geo.s };
  });

  // ---------- a) boş kayıt: öğretici açılır; adımlar sırayla; vurgusuz karo ilerletmez; serbest adımda takılınca vurgu; bitişte Bölüm 1 ----------
  for (const [w, h] of [[390, 844], [320, 640]]) {
    const { ctx, page, errors } = await open(browser, URL, { vp: [w, h], init: EV });
    await page.waitForTimeout(700);
    const a0 = await st(page), f0 = await fit(page);
    await shot(page, `ogretici-1-ilk-${w}`);
    // vurgusuz karoya dokunma: dönmez, adım değişmez, hamle sayılmaz
    await tap(page, 2); await tap(page, 4);
    const a1 = await st(page);
    await tap(page, 5); const a2 = await st(page);                 // döner, henüz bağlı değil
    await tap(page, 5); const a3 = await st(page);                 // merkeze bağlandı → yanar
    await shot(page, `ogretici-2-orta-${w}`);
    const f1 = await fit(page);
    await tap(page, 8); const a4 = await st(page);                 // durak yandı
    await tap(page, 1); const a5 = await st(page); await tap(page, 1); const a6 = await st(page);
    await page.waitForTimeout(250); await shot(page, `ogretici-3-sen-dene-${w}`);
    const f2 = await fit(page);
    await page.waitForTimeout(await page.evaluate(() => window.__ray.tut.IDLE) + 600);
    const a7 = await st(page);                                    // takıldı → sıradaki karo yine vurgulanır
    await tap(page, 0); const a8 = await st(page);                // serbest adımda her karo döner (doğru karo bozulur)
    for (let k = 0; k < 3; k++) await tap(page, 0, 120);
    await tap(page, 2); await tap(page, 6, 400);
    const a9 = await st(page);
    await page.waitForTimeout(2600);
    const a10 = await st(page), s1 = await getSave(page);
    await shot(page, `ogretici-4-bitis-${w}`);
    const f3 = await page.evaluate(() => { const c = document.getElementById('mCard').getBoundingClientRect(); return c.left >= 0 && c.right <= innerWidth + 1 && c.top >= 0 && c.bottom <= innerHeight + 1 && document.documentElement.scrollWidth <= innerWidth; });
    await page.click('#tGo'); await page.waitForTimeout(700);
    const a11 = await st(page), s2 = await getSave(page);
    await page.reload(); await page.waitForTimeout(900);
    const a12 = await st(page);
    errs.push(...errors);
    if (w === 390) {
      check('tut.open', 'Boş kayıt: açılışta doğrudan öğretici (anlatıcı penceresi açılmaz); başlık "Öğretici", alt sekme gizli, duraklat ve ipucu yok, ilk adımda 5. karo vurgulu',
        a0.tut && a0.game && !a0.modal && a0.title === 'Öğretici' && a0.tab === 'none' && a0.back === 'hidden' && a0.hint === 'none' && a0.s === 0 && a0.hi === 5 && /90°/.test(a0.txt) && a0.lit === '000010000', JSON.stringify(a0));
      check('tut.gate', 'Vurgusuz karoya (ve merkeze) dokunmak döndürmez, adım ve hamle değişmez',
        a1.cur === a0.cur && a1.s === 0 && a1.moves === 0, JSON.stringify({ a0: a0.cur, a1: a1.cur, s: a1.s, m: a1.moves }));
      check('tut.steps', 'Adımlar sırayla: dokun → döner (ışık yok) · bir kez daha → merkeze bağlanır, yanar · durak yanar · ışık yayılır · "Şimdi sen dene"',
        a2.s === 1 && a2.lit === a0.lit && a3.s === 2 && a3.hi === 8 && a3.lit[5] === '1' && a4.s === 3 && a4.hi === 1 && a4.lit[8] === '1' && a5.s === 3 && /Bir kez daha/.test(a5.txt) && a6.s === 4 && a6.hi === -1 && /Şimdi sen dene/.test(a6.txt) && a6.lit === '110111101',
        JSON.stringify([a2, a3, a4, a5, a6].map(a => [a.s, a.hi, a.lit, a.txt.slice(0, 24)])));
      check('tut.free', 'Serbest adım: takılınca birkaç sn sonra sıradaki karo yine vurgulanır; her karo döner; çözülünce kazanılır',
        a7.hi === 2 && /Takıldın/.test(a7.txt) && a8.cur !== a7.cur && a9.won, JSON.stringify({ a7: [a7.hi, a7.txt], a8: a8.cur, won: a9.won }));
      check('tut.done', 'Bitiş: "Hazırsın" kutlaması → "Bölüm 1" doğrudan açılır; kayıtta yalnız tut = 1 (played, bölüm, yıldız, can, bilet, reklam sayacı, yarım oyun değişmez); tutorial_begin / tutorial_complete',
        /Hazırsın/.test(a10.modal) && a11.game && !a11.tut && a11.lvl === 1 && a11.title === 'Bölüm 1' && s1.tut === 1 && !s1.played && s1.level === 1 && !Object.keys(s1.stars || {}).length && (s1.lives ?? 5) === 5 && !Object.keys(s1.crowns || {}).length && !s1.adW && !Object.keys(s1.runs || {}).length && s2.tut === 1
          && a11.ev.includes('tutorial_begin') && a11.ev.includes('tutorial_complete') && !a11.ev.includes('level_end'),
        JSON.stringify({ modal: a10.modal, lvl: a11.lvl, title: a11.title, save: { tut: s1.tut, played: s1.played, level: s1.level, stars: s1.stars, lives: s1.lives, adW: s1.adW, runs: s1.runs }, ev: a11.ev }));
      check('tut.once', 'Öğreticiyi bitiren oyuncu yeniden açınca öğreticiyi görmez (henüz bölüm oynamamış olsa da)', !a12.tut, JSON.stringify({ tut: a12.tut, home: a12.home, game: a12.game }));
    }
    check(`tut.fit.${w}`, `${w}×${h}: öğreticide yatay taşma yok, adım yazısı ve tahta ekranda, kutlama penceresi sığar`,
      [f0, f1, f2].every(f => !f.ov && f.tip && !f.cut && f.board && f.s >= 60) && f3, JSON.stringify({ f0, f1, f2, f3 }), 'medium');
    await ctx.close();
  }

  // ---------- b) kayıtlı oyuncular öğreticiyi görmez (güncelleme sonrası zorla sokulmaz); Bölüm 1 kendi tahtası bit bit aynı ----------
  {
    const seen = [];
    for (const sv of [{ played: 5, level: 6, stars: { 1: 3, 2: 3, 3: 3, 4: 2, 5: 3 } }, { played: 1 }, { level: 20, stars: { 1: 3 } }, { lastDaily: '2026-11-01', dailyDone: '2026-11-01' }]) {
      const { ctx, page, errors } = await open(browser, URL, { save: { ...sv, remindAsked: true } });
      await page.waitForTimeout(700);
      const a = await st(page);
      if (!seen.length) { await page.click('#bPlay'); await page.waitForTimeout(600); const b = await st(page); a.play = [b.tut, b.lvl]; }
      seen.push(a); errs.push(...errors); await ctx.close();
    }
    check('tut.old', 'Kaydında ilerleme olan oyuncu öğreticiye girmez: ana sayfa açılır, Oyna sıradaki bölümü açar',
      seen.every(a => !a.tut && a.home && !a.modal) && seen[0].play.join() === 'false,6', JSON.stringify(seen.map(a => ({ tut: a.tut, home: a.home, modal: a.modal.slice(0, 30), play: a.play }))));
  }

  // ---------- c) Ayarlar: "Nasıl oynanır?" anlatıcıyı açar; "Öğreticiyi yeniden oyna" öğreticiyi açar, ‹ ile çıkılır, kayıt değişmez ----------
  {
    const sv = { played: 3, level: 4, stars: { 1: 3, 2: 3, 3: 3 }, remindAsked: true, tut: 1 };
    const { ctx, page, errors } = await open(browser, URL, { save: sv, init: EV });
    await page.waitForTimeout(500);
    await page.click('#bSettings'); await page.waitForTimeout(500); await page.click('#oHow'); await page.waitForTimeout(600);
    const how = await page.evaluate(() => ({ open: document.getElementById('modal').classList.contains('open'), demo: !!document.querySelector('.demobox'), txt: document.getElementById('demoTxt')?.textContent }));
    for (let k = 0; k < 8 && await page.evaluate(() => document.getElementById('modal').classList.contains('open')); k++) { await page.click('#mClose', { timeout: 2000 }).catch(() => {}); await page.waitForTimeout(250); }
    const afterHow = await st(page);
    await page.click('#bSettings'); await page.waitForTimeout(500); await page.click('#oTut'); await page.waitForTimeout(600);
    const re = await st(page);
    await tap(page, 5);
    await page.click('#bBack'); await page.waitForTimeout(600);
    const out = await st(page), s = await getSave(page);
    check('tut.replay', 'Ayarlar › "Nasıl oynanır?" anlatıcıyı açar (oyunu başlatmaz); "Öğreticiyi yeniden oyna" öğreticiyi açar, ‹ görünür ve ana sayfaya döner; kayıt değişmez, ölçüm olayı yok',
      how.open && how.demo && /Karoya dokun/.test(how.txt) && afterHow.home && !afterHow.game && re.tut && re.game && re.back === 'visible' && re.s === 0 && out.home && s.level === 4 && s.played === 3 && !Object.keys(s.runs || {}).length && !out.ev.includes('tutorial_begin'),
      JSON.stringify({ how, afterHow: afterHow.home, re: [re.tut, re.back, re.s], out: out.home, s: [s.level, s.played, s.runs], ev: out.ev }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- d) 9 dil: öğretici metinleri çevrili (İngilizce dışında İngilizce kalmamış), Türkçe harf yok ----------
  {
    const LOC = { tr: 'tr-TR', en: 'en-US', de: 'de-DE', es: 'es-ES', 'pt-BR': 'pt-BR', fr: 'fr-FR', ko: 'ko-KR', ja: 'ja-JP', 'zh-Hant': 'zh-TW' }, R = {};
    for (const [g, locale] of Object.entries(LOC)) {
      const { ctx, page, errors } = await open(browser, URL, { vp: [320, 640], locale });
      await page.waitForTimeout(500);
      const txt = [];
      const grab = async () => txt.push(await page.evaluate(() => document.getElementById('gTitle').textContent + ' | ' + document.getElementById('gMoves').textContent + ' | ' + document.getElementById('tutTxt').textContent));
      await grab();
      for (const i of [5, 5, 8, 1]) { await tap(page, i, 320); await grab(); }
      await tap(page, 1, 320); await grab();
      await page.evaluate(() => { const G = window.__ray.G; G.cur[2] = G.sol[2]; }); await tap(page, 6, 300);
      await page.waitForTimeout(2400);
      txt.push(await page.evaluate(() => document.getElementById('mCard').textContent.replace(/\s+/g, ' ').trim()));
      const f = await fit(page).catch(() => ({}));
      R[g] = { txt, miss: await page.evaluate(() => [...(window.__L_MISS || [])].filter(k => /tile|station|hub|Tutorial|ready|Stuck|try/i.test(k))), f, err: errors.length };
      errs.push(...errors); await ctx.close();
    }
    const en = R.en.txt, bad = [];
    for (const [g, r] of Object.entries(R)) {
      if (g !== 'tr' && r.txt.some(t => (g === 'en' ? /[ğüşıöçĞÜŞİÖÇ]/ : /[ğşıĞŞİ]/).test(t))) bad.push(`${g}: Türkçe harf`);   // ü ö ç Almanca, Fransızca, Portekizcede de var
      if (!['tr', 'en'].includes(g) && r.txt.some((t, k) => t === en[k])) bad.push(`${g}: İngilizce kalmış #${r.txt.findIndex((t, k) => t === en[k])}`);
      if (r.miss.length) bad.push(`${g}: sözlükte yok ${r.miss.slice(0, 2).join(' / ')}`);
    }
    check('tut.lang', '9 dilde öğretici: başlık, adım yazıları ve kutlama çevrili; Türkçe dışında Türkçe harf yok; sözlükte eksik yok',
      !bad.length && /Tutorial/.test(en[0]) && /You’re ready/.test(en.at(-1)), bad.join(' · ') || JSON.stringify({ en: en[0], de: R.de.txt[0], ja: R.ja.txt[1] }), 'medium');
  }
  check('tut.errors', 'Öğretici senaryolarında konsol hatası yok', !errs.length, errs.slice(0, 3).join(' | '));
};
