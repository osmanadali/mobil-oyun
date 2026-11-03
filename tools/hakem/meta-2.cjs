// Meta-2: şehir haritası · rozetler — hakem.cjs K bölümü çağırır (geliştirirken --only=meta-2)
// Bölüm numarasına sabit bağlı değil: hat sınırları __ray.lineStart'tan, kural hatları __ray.RULE_LINE'dan okunur.
module.exports = async T => {
  const { browser, URL, open, check, solve, shot, getSave, waitModal } = T;
  const errs = [];
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, k) => a + k);
  const all = (a, b, v) => Object.fromEntries(range(a, b).map(l => [l, v]));
  let LS, RL;
  {
    const { ctx, page } = await open(browser, URL, { save: { played: 1 } });
    [LS, RL] = await page.evaluate(() => [Array.from({ length: 60 }, (_, c) => window.__ray.lineStart(c)), Object.values(window.__ray.RULE_LINE)]);
    await ctx.close();
  }
  const base = { played: 60, remindAsked: true, seen: Object.fromEntries(range(0, 60).map(k => [k, 1])) };

  // ---------- a) şehir: logodan açılır; biten hatlar semt yakar, 👑'lı hat altın; 320×568 açık/koyu taşma yok ----------
  {
    // M1–M5 bitti (M6'nın ilk bölümünde), M1 ve M3 bütünüyle kusursuz
    const level = LS[5], crowns = { ...all(LS[0], LS[1] - 1, 1), ...all(LS[2], LS[3] - 1, 1), [LS[1]]: 1 };
    for (const [scheme, vp] of [['dark', [390, 844]], ['light', [320, 568]], ['dark', [320, 568]]]) {
      const { ctx, page, errors } = await open(browser, URL, { scheme, vp, save: { ...base, level, stars: all(1, level - 1, 3), crowns } });
      await page.click('#home .logo'); await page.waitForTimeout(1500);
      const r = await page.evaluate(() => {
        const q = s => document.querySelectorAll('#cityBody ' + s).length, b = document.getElementById('cityBody');
        const over = [...document.querySelectorAll('#city *')].filter(e => { const x = e.getBoundingClientRect(); return x.width && (x.right > innerWidth + 1 || x.left < -1); }).length;
        return { act: document.getElementById('city').classList.contains('active'), d: q('.sd'), lit: q('.sd.lit'), gold: q('.sd.gold'), cur: q('.sd.cur'), sub: document.getElementById('cSub').textContent, over, sw: b.scrollWidth - b.clientWidth, doc: document.documentElement.scrollWidth - innerWidth };
      });
      check(`meta2.city.${scheme}.${vp[0]}`, `Şehir haritası (${scheme === 'dark' ? 'koyu' : 'açık'} ${vp.join('×')}): ana sayfa logosundan açılır; 24 semt, biten 5 hattın 3'ü yanık + 2'si altın, sıradaki hat yapımda; yatay taşma yok`,
        r.act && r.d === 24 && r.lit === 3 && r.gold === 2 && r.cur === 1 && /5\/24/.test(r.sub) && !r.over && r.sw <= 0 && r.doc <= 0 && !errors.length, JSON.stringify({ ...r, errors }));
      await shot(page, `meta2-city-${scheme}-${vp[0]}`);
      // semt seçilince bilgi kartı o hattı gösterir
      if (vp[0] === 390) {
        await page.click('#cityBody .sd.gold'); await page.waitForTimeout(250);
        const info = await page.evaluate(() => document.getElementById('cInfo').textContent);
        check('meta2.city.info', 'Semte dokununca bilgi kartı hattın adını, ★ ve 🎫 sayısını ve "Altın semt" durumunu gösterir', /M1 ·/.test(info) && /Altın semt/.test(info), info);
        // rozet sekmesi
        await page.click('#cTabs [data-t=ach]'); await page.waitForTimeout(300);
        const want = ['gold', ...(level > 100 ? ['l100'] : []), 'line', 'p1', 'p10'].join();   // 100 bölüm: hat boyuna bağlı
        const a = await page.evaluate(() => ({ n: document.querySelectorAll('.ach').length, got: document.querySelectorAll('.ach.got').length, ids: Object.keys(JSON.parse(localStorage.getItem('ray')).ach || {}).sort().join() }));
        check('meta2.ach.list', 'Rozetler sekmesi: bütün rozetler listelenir; güncellemeden önce hak edilenler (ilk kusursuz, kusursuz 10, ilk semt, altın semt) sessizce işlenmiş', a.n >= 12 && a.ids === want && a.got === want.split(',').length, JSON.stringify(a));
        await shot(page, 'meta2-badges');
      }
      errs.push(...errors); await ctx.close();
    }
  }

  // ---------- b) Hatlar ekranındaki düğme; 24 hattan sonra yeni şehir (sayfa) ----------
  {
    const level = LS[26] + 2;
    const { ctx, page, errors } = await open(browser, URL, { save: { ...base, level, stars: all(1, level - 1, 3) } });
    await page.click('#bMap'); await page.waitForTimeout(400); await page.click('#pCity'); await page.waitForTimeout(800);
    const p1 = await page.evaluate(() => ({ act: document.getElementById('city').classList.contains('active'), lit: document.querySelectorAll('#cityBody .sd.lit').length, pager: !!document.getElementById('cPrev'), prevOff: document.getElementById('cPrev')?.disabled, t: document.querySelector('.cpager b')?.textContent }));
    await page.click('#cPrev'); await page.waitForTimeout(500);
    const p0 = await page.evaluate(() => ({ lit: document.querySelectorAll('#cityBody .sd.lit').length, nextOff: document.getElementById('cNext').disabled, t: document.querySelector('.cpager b').textContent }));
    check('meta2.city.pages', 'Hatlar ekranından açılır; 26 hat bitince 2. şehir (M25–M48, 2 semt yanık) gösterilir, önceki şehirde 24 semtin hepsi yanık',
      p1.act && p1.pager && !p1.prevOff && p1.lit === 2 && /M25–M48/.test(p1.t) && p0.lit === 24 && !p0.nextOff && /M1–M24/.test(p0.t) && !errors.length, JSON.stringify({ p1, p0, errors }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- c) rozet bildirimi: oyunda kazanılınca küçük bildirim; ödül yok (ipucu/taç değişmez) ----------
  {
    const level = LS[1] - 2, crowns = all(1, 9, 1);   // 9 taç → bu bölüm kusursuz = 10.
    const { ctx, page, errors } = await open(browser, URL, { save: { ...base, level, stars: all(1, level - 1, 3), crowns, hints: 5, chests: 0 } });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    await solve(page, 15);
    let pop = '', hit = false;
    for (let t = 0; t < 30 && !hit; t++) { await page.waitForTimeout(100); pop = await page.evaluate(() => document.getElementById('achPop').classList.contains('show') ? document.getElementById('achPop').textContent : ''); hit = !!pop; }
    await waitModal(page);
    const s = await getSave(page);
    check('meta2.ach.pop', 'Kusursuz 10. bölümde "Kusursuz 10" rozeti kazanılır, üstte küçük bildirim çıkar; rozet ödülsüz (ipucu aynı)', hit && /Kusursuz 10/.test(pop) && s.ach?.p10 > 1 && s.hints === 5 && !errors.length, JSON.stringify({ pop, ach: s.ach, hints: s.hints, errors }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- f) İngilizce: şehir ve rozet metinleri ----------
  {
    const level = LS[3];
    const { ctx, page, errors } = await open(browser, URL, { locale: 'en-US', vp: [320, 568], save: { ...base, level, stars: all(1, level - 1, 3) } });
    await page.click('#home .logo'); await page.waitForTimeout(900);
    const t1 = await page.evaluate(() => document.getElementById('city').innerText);
    await page.click('#cTabs [data-t=ach]'); await page.waitForTimeout(300);
    const t2 = await page.evaluate(() => document.getElementById('city').innerText);
    const tr = /[ğışçöüĞİŞÇÖÜ]|Şehir|Rozet|semt|bölüm/;
    check('meta2.en', 'İngilizce: şehir ve rozet ekranında Türkçe metin yok', /districts/.test(t1) && /Badges/.test(t2) && !tr.test(t1 + t2) && !errors.length, (t1 + ' | ' + t2).slice(0, 300));
    errs.push(...errors); await ctx.close();
  }
  // ---------- g) kural ustası (RULE_LINE'dan) ve haftanın görevleri rozeti: yüklemede sessizce işlenir ----------
  {
    const last = Math.max(...RL), level = LS[last + 1];
    const { ctx, page, errors } = await open(browser, URL, { save: { ...base, level, stars: all(1, level - 1, 3), wqAll: 1 } });
    await page.waitForTimeout(500);
    const s = await getSave(page);
    const r = await page.evaluate(() => { const a = window.__ray.ACH.find(x => x[0] === 'rule'); return { goal: a[4](), val: a[5]() }; });
    check('meta2.rule', `Kural ustası: kurallı hatların (${RL.length} kural, son M${last + 1}) hepsi bitince rozet; haftalık görev rozeti; ödül yok`, s.ach?.rule && s.ach?.w1 && r.goal === new Set(RL).size && r.val === r.goal && !errors.length, JSON.stringify({ ach: s.ach, r, errors }));
    errs.push(...errors); await ctx.close();
  }
  check('meta2.errors', 'Şehir ve rozet ekranlarında konsol hatası yok', !errs.length, errs.slice(0, 3).join(' | '));
};
