// Ses: arka plandan dönüş (bildirim perdesi, satın alma penceresi) — kaçan notalar topluca çalınmaz, müzik 0'dan yumuşak açılır, gizliyken efekt sesi kuyruğa girmez. hakem.cjs K bölümü çağırır; tek başına: --only=ses-donus
module.exports = async T => {
  const { browser, URL, open, check, starsUpTo } = T;
  const SEEN = Object.fromEntries(Array.from({ length: 40 }, (_, k) => [k, 1]));
  const { ctx, page, errors } = await open(browser, URL, { vp: [360, 740], save: { played: 20, level: 20, stars: starsUpTo(20), seen: SEEN, remindAsked: true, sound: true, music: true } });
  await page.click('#bPlay'); await page.waitForTimeout(1500);
  const m0 = await page.evaluate(() => window.__ray.music());
  // a) ana iş parçacığı 3 sn tıkanır (arka planda zamanlayıcılar durur, ses saati akar): dönüşte kurulan nota sayısı
  const burst = await page.evaluate(async () => {
    const n0 = window.__ray.music().notes, t = performance.now(); while (performance.now() - t < 3000) {}
    await new Promise(r => setTimeout(r, 30)); return window.__ray.music().notes - n0;
  });
  // b) arka plan → ön plan: gizliyken müzik susar, dönüşte kazanç 0'dan yükselir
  const vis = h => page.evaluate(h => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => h }); document.dispatchEvent(new Event('visibilitychange')); }, h);
  await vis(true); await page.waitForTimeout(300);
  const mh = await page.evaluate(() => window.__ray.music());
  await vis(false); await page.waitForTimeout(250);
  const mw = await page.evaluate(() => window.__ray.music());
  await page.waitForTimeout(1800);
  const mf = await page.evaluate(() => window.__ray.music());
  check('ses.donus', 'Ses: arka plandan dönüşte kaçan notalar topluca çalınmaz (≤ 3 nota), gizliyken müzik kısık, dönüşte 0\'dan yumuşak açılır (patlama yok)',
    m0.on && burst <= 3 && mh.gain < .01 && mw.gain < .45 && mf.gain > .5, JSON.stringify({ on: m0.on, ac: m0.ac, burst, hid: +mh.gain.toFixed(3), back: +mw.gain.toFixed(3), later: +mf.gain.toFixed(3) }), 'high');
  await ctx.close();
  if (errors.length) check('ses.donus.err', 'Ses dönüş testinde sayfa hatası yok', false, errors.slice(0, 3).join(' | '));
};
