// Meta: zen modu · mevsim temaları — hakem.cjs K bölümü çağırır (geliştirirken --only=meta)
// Bölüm numarasına sabit bağlı değil: hat sınırları __ray.lineStart'tan okunur (kural sırası ve hat boyları değişebilir).
module.exports = async T => {
  const { browser, URL, open, check, solve, shot, getSave, waitModal } = T;
  const errs = [];
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, k) => a + k);
  const all = (a, b, v) => Object.fromEntries(range(a, b).map(l => [l, v]));
  // hat sınırlarını oyundan oku (boş bir sayfada)
  let LS;
  {
    const { ctx, page } = await open(browser, URL, { save: { played: 1 } });
    LS = await page.evaluate(() => Array.from({ length: 30 }, (_, c) => window.__ray.lineStart(c)));
    await ctx.close();
  }
  const base = { played: 60, remindAsked: true, seen: Object.fromEntries(range(0, 40).map(k => [k, 1])) };

  // ---------- d) zen modu: Ayarlar'da anahtar; hedefler gizli, bitiş 3 ★, taç ve seri yok; Günün Hattı etkilenmez ----------
  {
    const level = LS[1] + 2;
    const { ctx, page, errors } = await open(browser, URL, { save: { ...base, level, stars: all(1, level - 1, 3), combo: 4, hints: 5 } });
    await page.click('#bSettings'); await page.waitForTimeout(500);
    await page.click('#oZ'); await page.waitForTimeout(200);
    const on = (await getSave(page)).zen === true;
    await page.evaluate(() => document.getElementById('mClose').click()); await page.waitForTimeout(400);
    await page.click('#bPlay'); await page.waitForTimeout(700);
    const hide = await page.evaluate(() => ['#gPill', '#gTrip', '.parInfo'].map(s => getComputedStyle(document.querySelector(s)).visibility));
    // süre hedefini geçir: zen'de rötar uyarısı ve +15 düğmesi çıkmaz
    await page.evaluate(() => { const G = window.__ray.G; G.ms = (G.lim.t + 30) * 1000; });
    await page.waitForTimeout(600);
    const warn = await page.evaluate(() => document.getElementById('toast').classList.contains('show') ? document.getElementById('toast').textContent : '');
    await shot(page, 'meta-zen-game');
    await solve(page, 10); await waitModal(page);
    const s = await getSave(page), panel = await page.evaluate(() => document.getElementById('winPanel').textContent);
    check('meta.zen.level', 'Zen: Ayarlar\'dan açılır; tren şeridi, yıldız çipi ve hamle hedefi gizli; süre geçse de uyarı yok; bitiş 3 ★ ama 🎫 (taç kaydı) yok, ✨ seri değişmez, kıl payı yok',
      on && hide.every(v => v === 'hidden') && !/rötar|söndü/.test(warn) && s.stars[level] === 3 && !s.crowns?.[level] && s.combo === 4 && !s.miss?.[level] && s.zenWins === 1 && /ZEN/.test(panel) && !/Tekrar dene/.test(panel) && !errors.length,
      JSON.stringify({ on, hide, warn, st: s.stars[level], cr: s.crowns?.[level], combo: s.combo, miss: s.miss?.[level], zenWins: s.zenWins, errors }));
    await shot(page, 'meta-zen-win');
    // Günün Hattı zen'den etkilenmez
    await page.evaluate(() => document.getElementById('mHome')?.click()); await page.waitForTimeout(500);
    await page.click('#bDaily'); await page.waitForTimeout(800);
    const d = await page.evaluate(() => ({ zen: document.getElementById('game').classList.contains('zen'), pill: getComputedStyle(document.getElementById('gPill')).visibility, gz: window.__ray.G.zen }));
    check('meta.zen.daily', 'Zen açıkken Günün Hattı normal: hedefler görünür (herkes aynı koşulda)', !d.zen && d.pill === 'visible' && !d.gz, JSON.stringify(d));
    errs.push(...errors); await ctx.close();
  }

  // ---------- e) mevsim temaları: takvim, ücretsiz alma, mevsim bitince sahibinde kalır ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { ...base, level: 30 } });
    const cal = await page.evaluate(() => {
      const w = (id, d) => !!window.__ray.seaWin(id, new Date(d + 'T12:00:00'));
      return {
        kis: [w('kis', '2026-12-01'), w('kis', '2027-01-31'), !w('kis', '2027-02-01'), !w('kis', '2026-11-30')],
        hazan: [w('hazan', '2026-10-31'), !w('hazan', '2026-12-02')],
        ramazan: [w('fener', '2026-03-20'), w('fener', '2026-03-18'), w('fener', '2026-03-26'), !w('fener', '2026-03-27'), w('fener', '2027-03-09'), w('fener', '2030-02-04')],
        kurban: [w('kurban', '2026-05-27'), w('kurban', '2027-05-16'), w('kurban', '2028-05-05'), !w('kurban', '2026-07-01')],
        yaz: [w('yaz', '2027-07-15'), !w('yaz', '2027-09-02')], erguvan: [w('erguvan', '2027-04-23'), !w('erguvan', '2027-06-01')],
      };
    });
    const ok = Object.values(cal).flat().every(Boolean);
    check('meta.sea.cal', 'Mevsim takvimi: kış 1 Ara–31 Oca, hazan Eki–Kas, erguvan, yaz; Ramazan ve Kurban Bayramı tablodan (ilk gün −2 … +6)', ok && !errors.length, JSON.stringify(cal));
    await ctx.close();
  }
  {
    // aralıkta: kış teması 👑 çipinde nokta ile duyurulur, temalar sayfasında ücretsiz alınır
    const init = "window.__rayDate = '2026-12-15T12:00:00'";
    const { ctx, page, errors } = await open(browser, URL, { init, save: { ...base, level: 30 } });
    const dot = await page.evaluate(() => document.getElementById('crownChip').classList.contains('new'));
    await page.click('#crownChip'); await page.waitForTimeout(500);
    const sheet = await page.evaluate(() => ({ cards: [...document.querySelectorAll('#skins .skin')].map(b => b.dataset.k), head: document.querySelector('.vipk.sea')?.textContent || '' }));
    await shot(page, 'meta-season-sheet');
    await page.click('#skins .skin[data-k=kis]'); await page.waitForTimeout(400);
    const s1 = await getSave(page);
    check('meta.sea.claim', 'Aralıkta Kar Feneri teması çıkar (👑 çipinde nokta), ücretsiz alınır ve seçilir; mevsimi geçmiş temalar (hazan, bayram) görünmez; bakiye değişmez',
      dot && sheet.cards.includes('kis') && !sheet.cards.includes('hazan') && !sheet.cards.includes('fener') && /31 Ocak/.test(sheet.head) && s1.owned?.kis === 1 && s1.skin === 'kis' && !s1.spent && !errors.length,
      JSON.stringify({ dot, sheet, owned: s1.owned, skin: s1.skin, spent: s1.spent, errors }));
    errs.push(...errors); await ctx.close();
    // şubatta: mevsim bitti, sahibinde kalır ve kullanılır; alınmamış kış teması yeni oyuncuya görünmez
    const init2 = "window.__rayDate = '2027-02-15T12:00:00'";
    const o2 = await open(browser, URL, { init: init2, save: { ...base, level: 30, owned: { metro: 1, kis: 1 }, skin: 'kis' } });
    await o2.page.click('#crownChip'); await o2.page.waitForTimeout(400);
    const r2 = await o2.page.evaluate(() => ({ cards: [...document.querySelectorAll('#skins .skin')].map(b => b.dataset.k), on: document.querySelector('#skins .skin.on')?.dataset.k, acc: getComputedStyle(document.documentElement).getPropertyValue('--acc').trim() }));
    await o2.ctx.close();
    const o3 = await open(browser, URL, { init: init2, save: { ...base, level: 30 } });
    await o3.page.click('#crownChip'); await o3.page.waitForTimeout(400);
    const r3 = await o3.page.evaluate(() => [...document.querySelectorAll('#skins .skin')].map(b => b.dataset.k));
    await o3.ctx.close();
    check('meta.sea.keep', 'Mevsim bitince: sahibi Kar Feneri\'ni kullanmaya devam eder (seçili, renkleri uygulanır); sahibi olmayan görmez',
      r2.cards.includes('kis') && r2.on === 'kis' && r2.acc === '#8fd3ff' && !r3.includes('kis') && !o2.errors.length && !o3.errors.length, JSON.stringify({ r2, r3, e: [...o2.errors, ...o3.errors] }));
  }

  check('meta.errors', 'Zen ve mevsim temalarında konsol hatası yok', !errs.length, errs.slice(0, 3).join(' | '));
};
