// Geçiş reklamı her 4 bölümde bir: sayaç kayıtta (save.adW), uygulamayı kapatıp açınca sıfırlanmaz; reklam gösterilince sıfırlanır
// hakem.cjs K bölümü çağırır; tek başına: --only=reklam-sayac
module.exports = async T => {
  const { browser, URL, open, check, solve, waitModal, starsUpTo, getSave } = T;
  const { ctx, page, errors } = await open(browser, URL, { save: { played: 9, level: 10, stars: starsUpTo(10), remindAsked: true, seen: Object.fromEntries(Array.from({ length: 40 }, (_, c) => [c, 1])) } });
  const ads = () => page.evaluate(() => window.__log.ads.filter(a => a === 'interstitial').length);
  const win = async () => { await solve(page, 0); await waitModal(page); await page.waitForTimeout(500); await page.click('#mNext'); await page.waitForTimeout(900); };
  await page.click('#bPlay'); await page.waitForTimeout(800);
  await win(); await win();
  const a1 = await ads(), w1 = (await getSave(page)).adW;
  await page.reload(); await page.waitForTimeout(1200);   // uygulama kapanıp açıldı
  await page.click('#bPlay'); await page.waitForTimeout(800);
  await win(); const a2 = await ads();
  await win(); const a3 = await ads(), w3 = (await getSave(page)).adW;
  await ctx.close();
  check('reklam.sayac', 'Geçiş reklamı her 4 bölümde bir: 2 bölüm + uygulama yeniden açıldı + 2 bölüm → 4. bölümden sonra 1 reklam; sayaç kayıtta, reklamdan sonra sıfır',
    a1 === 0 && w1 === 2 && a2 === 0 && a3 === 1 && w3 === 0 && !errors.length, JSON.stringify({ a1, w1, a2, a3, w3, err: errors.length }), 'high');
};
