// Ana ekranda Mağaza düğmesi (App Store incelemesi Ayarlar'ın altında bulamamıştı) — hakem.cjs K bölümü çağırır; tek başına: --only=magaza-ana
module.exports = async T => {
  const { browser, URL, open, check, starsUpTo } = T;
  for (const [vp, loc] of [[[320, 568], 'tr-TR'], [[360, 740], 'en-US'], [[768, 1024], 'ko-KR']]) {
    const { ctx, page, errors } = await open(browser, URL, { vp, locale: loc, save: { played: 30, level: 30, stars: starsUpTo(30), remindAsked: true } });
    await page.waitForTimeout(600);
    const r = await page.evaluate(() => { const b = document.getElementById('bShop'), p = document.getElementById('bPlay'); if (!b) return null; const a = b.getBoundingClientRect(), q = p.getBoundingClientRect();
      return { txt: b.textContent.trim(), vis: a.width > 0 && getComputedStyle(b).visibility !== 'hidden', inView: a.bottom <= innerHeight && a.left >= 0 && a.right <= innerWidth, below: a.top >= q.bottom - 1, h: Math.round(a.height) }; });
    await page.click('#bShop'); await page.waitForTimeout(600);
    const m = await page.evaluate(() => ({ open: document.getElementById('modal').classList.contains('open'), h: document.querySelector('#mCard h2')?.textContent, rows: document.querySelectorAll('#store [data-p]').length }));
    check(`magaza.ana.${vp[0]}`, `Ana ekranda Mağaza düğmesi (${vp.join('×')}, ${loc}): Oyna'nın altında, ekran içinde, ≥ 28 px yüksek; dokununca Mağaza penceresi açılır`,
      r && r.vis && r.inView && r.below && r.h >= 28 && m.open && !!m.h && m.rows >= 1 && !errors.length, JSON.stringify({ r, m, errors }), 'medium');
    await ctx.close();
  }
};
