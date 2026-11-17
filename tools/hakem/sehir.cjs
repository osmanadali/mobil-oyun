// Şehir: ana sayfada oyuncunun şehri (biten hatların semtleri yanar), hattın son bölümü ilk kez bitince açılış töreni.
// hakem.cjs K bölümü çağırır; tek başına: --only=sehir
module.exports = async T => {
  const { browser, URL, open, check, solve, LE, starsUpTo, seenTo } = T;
  const lvl = LE(1);   // M2'nin son bölümü
  const save = { played: lvl, level: lvl, stars: starsUpTo(lvl - 1), remindAsked: true, g11: 1, rec: { n: 3, at: Date.now(), line: 99 }, lastGift: Date.now(), seen: seenTo(5) };
  const { ctx, page, errors } = await open(browser, URL, { save, init: 'window.__noFest = false' });
  await page.evaluate(() => document.getElementById('mClose')?.click()); await page.waitForTimeout(300);
  const home = await page.evaluate(() => ({ txt: document.getElementById('skyTxt')?.textContent || '', lit: document.querySelectorAll('#skyBox .bk.lit,#skyBox .bk.gold').length, cur: document.querySelectorAll('#skyBox .bk.cur').length }));
  await page.click('#bPlay'); await page.waitForTimeout(700);
  if (await page.$('#mGo')) { await page.click('#mGo'); await page.waitForTimeout(300); }
  await solve(page, 10); await page.waitForTimeout(2600);
  const fest = await page.evaluate(() => ({ on: !!document.getElementById('fest'), h: document.querySelector('#fest h2')?.textContent || '', p: document.querySelector('#fest p')?.textContent || '', win: !!document.querySelector('#winPanel .wp-top') }));
  await page.click('#fest'); await page.waitForTimeout(200);
  await page.click('#fGo'); await page.waitForTimeout(600);
  const closed = await page.evaluate(() => !document.getElementById('fest') && !!document.querySelector('#winPanel #mNext,#winPanel #mMap,#winPanel #mRetry'));
  await page.evaluate(() => document.getElementById('bBack')?.click()); await page.waitForTimeout(700);
  const after = await page.evaluate(() => ({ txt: document.getElementById('skyTxt')?.textContent || '', lit: document.querySelectorAll('#skyBox .bk.lit,#skyBox .bk.gold').length }));
  await ctx.close();
  const ok = home.lit === 1 && home.cur === 1 && /1\/24/.test(home.txt) && fest.on && /M2/.test(fest.h) && /2\/24/.test(fest.p) && fest.win && closed && after.lit === 2 && /2\/24/.test(after.txt) && !errors.length;
  check('sehir', 'Ana sayfada şehir (biten semtler yanar, sıradaki iskelede); hat bitince açılış töreni, Devam ile sonuç paneline döner', ok, JSON.stringify({ home, fest, closed, after, errors }), 'high');
};
