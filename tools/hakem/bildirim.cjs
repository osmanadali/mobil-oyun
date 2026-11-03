// Üst bildirim (görev tamam, rozet): kaydırınca (yukarı / yana) ya da dokununca gider, sıradaki hemen düşer; görev satırı 4. bölümden görünür — hakem.cjs K bölümü çağırır
module.exports = async T => {
  const { browser, URL, open, check } = T;
  const { ctx, page, errors } = await open(browser, URL, { vp: [360, 740], save: { played: 6, level: 5, remindAsked: true } });
  const row = await page.evaluate(() => !document.getElementById('bQuest').hidden);
  await page.evaluate(() => window.__ray.popUp(['☀️', 'GÜNLÜK GÖREV TAMAM', 'Bir', '🎁'], ['🎯', 'HAFTALIK GÖREV TAMAM', 'İki', '🎁'], ['🏅', 'YENİ ROZET', 'Üç']));
  await page.waitForTimeout(700);
  const pop = () => page.evaluate(() => { const e = document.getElementById('achPop'); return { show: e.classList.contains('show'), t: e.querySelector('b')?.textContent }; });
  const box = () => page.evaluate(() => { const r = document.getElementById('achPop').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  const p1 = await pop();
  // yukarı kaydır
  let [x, y] = await box();
  await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x, y - 20, { steps: 3 }); await page.mouse.move(x, y - 50, { steps: 3 }); await page.mouse.up();
  await page.waitForTimeout(650);
  const p2 = await pop();
  // yana kaydır
  [x, y] = await box();
  await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 60, y, { steps: 3 }); await page.mouse.move(x + 140, y, { steps: 3 }); await page.mouse.up();
  await page.waitForTimeout(650);
  const p3 = await pop();
  // az çekip bırakmak: geri yerine oturur, gitmez
  [x, y] = await box();
  await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 20, y - 8, { steps: 3 }); await page.mouse.up();
  await page.waitForTimeout(500);
  const p4 = await pop();
  // dokun → gider
  await page.mouse.click(x, y); await page.waitForTimeout(700);
  const p5 = await pop();
  // görev bildirimi: dokununca Görevler penceresi açılır; bölüm oynanırken süre durur, pencere kapanınca akar
  await page.evaluate(() => window.__ray.popUp(['☀️', 'GÜNLÜK GÖREV TAMAM', 'Dört', '🎁', 'q'])); await page.waitForTimeout(700);
  [x, y] = await box(); await page.mouse.click(x, y); await page.waitForTimeout(600);
  const q1 = await page.evaluate(() => ({ open: document.getElementById('modal').classList.contains('open'), h: document.querySelector('#mCard h2')?.textContent, pop: document.getElementById('achPop').classList.contains('show') }));
  await page.evaluate(() => document.getElementById('mClose')?.click()); await page.waitForTimeout(300);
  await page.click('#bPlay'); await page.waitForTimeout(700);
  await page.evaluate(() => window.__ray.popUp(['🎯', 'HAFTALIK GÖREV TAMAM', 'Beş', '🎁', 'q'])); await page.waitForTimeout(700);
  [x, y] = await box(); await page.mouse.click(x, y); await page.waitForTimeout(500);
  const g1 = await page.evaluate(() => ({ open: document.getElementById('modal').classList.contains('open'), run: window.__ray.G.runAt > 0, ms: window.__ray.G.ms }));
  await page.waitForTimeout(600);
  const ms2 = await page.evaluate(() => window.__ray.G.ms);
  await page.evaluate(() => document.getElementById('mClose')?.click()); await page.waitForTimeout(300);
  const g2 = await page.evaluate(() => window.__ray.G.runAt > 0);
  check('pop.quests', 'Görev bildirimine dokununca Görevler penceresi açılır (kaydırınca yalnız gider); oyun sırasında açılırsa süre durur, kapanınca akar',
    q1.open && /Görevler/.test(q1.h) && !q1.pop && g1.open && !g1.run && ms2 === g1.ms && g2 && !errors.length, JSON.stringify({ q1, g1, ms2, g2, errors }));
  check('pop.swipe', 'Üst bildirim: yukarı ya da yana kaydırınca gider ve sıradaki hemen düşer; az çekip bırakınca yerine döner; dokununca da gider. Görev satırı 4. bölümden görünür',
    row && p1.show && p1.t === 'Bir' && p2.show && p2.t === 'İki' && p3.show && p3.t === 'Üç' && p4.show && p4.t === 'Üç' && !p5.show && !errors.length, JSON.stringify({ row, p1, p2, p3, p4, p5, errors }));
  await ctx.close();
};
