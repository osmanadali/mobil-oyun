// Ana ekranda Mağaza düğmesi (App Store incelemesi Ayarlar'ın altında bulamamıştı): alt sekme çubuğunda, her zaman görünür — hakem.cjs K bölümü çağırır; tek başına: --only=magaza-ana
module.exports = async T => {
  const { browser, URL, open, check, starsUpTo } = T;
  for (const [vp, loc] of [[[320, 568], 'tr-TR'], [[360, 740], 'en-US'], [[768, 1024], 'ko-KR']]) {
    const { ctx, page, errors } = await open(browser, URL, { vp, locale: loc, save: { played: 30, level: 30, stars: starsUpTo(30), remindAsked: true } });
    await page.waitForTimeout(600);
    const r = await page.evaluate(() => { const b = document.getElementById('bShop'), p = document.getElementById('bDaily'), m = document.getElementById('bMap'), q = document.getElementById('bQuest'); if (!b) return null; const a = b.getBoundingClientRect(), d = p.getBoundingClientRect(), mp = m.getBoundingClientRect(), qr = q.getBoundingClientRect();
      return { txt: b.textContent.trim(), vis: a.width > 0 && getComputedStyle(b).visibility !== 'hidden' && getComputedStyle(b.parentElement).display !== 'none', inView: a.bottom <= innerHeight && a.left >= 0 && a.right <= innerWidth, tab: !!b.closest('#tabbar'), h: Math.round(a.height) }; });
    await page.click('#bShop'); await page.waitForTimeout(600);
    const m = await page.evaluate(() => ({ open: document.getElementById('shop').classList.contains('active') && document.querySelector('#tabbar button.on')?.dataset.tab === 'shop', h: document.querySelector('#shop .title b')?.textContent, rows: document.querySelectorAll('#shopBody #store [data-p]').length }));   // Mağaza ayrı sayfa (sekme vurgusu Mağaza'da)
    check(`magaza.ana.${vp[0]}`, `Ana ekranda Mağaza düğmesi (${vp.join('×')}, ${loc}): alt sekme çubuğunda, ekran içinde, ≥ 28 px yüksek; dokununca Mağaza sayfası açılır (sekme vurgusu Mağaza'da)`,
      r && r.vis && r.inView && r.tab && r.h >= 28 && m.open && !!m.h && m.rows >= 1 && !errors.length, JSON.stringify({ r, m, errors }), 'medium');
    await ctx.close();
  }
};
