// 1.2 ödüllü video yerleri: can penceresi (yalnız ▶ +1 ❤️), kusursuz bölümde ▶ +1 🎫, bitmiş güçlendirici ▶ (süre durur),
// Görevler'de 🎁 günlük hediye (günde 1), Mağaza'da ücretsiz ipucu (günde 3). Reklam katmanı sahte: her video "izlendi".
// hakem.cjs K bölümü çağırır; tek başına: --only=reklam-yerleri
module.exports = async T => {
  const { browser, URL, open, check, solve, waitModal, starsUpTo, getSave } = T;
  const AD = `addEventListener('DOMContentLoaded', () => setTimeout(() => { window.Ads.online = () => true; window.__vids = 0; window.Ads.rewarded = async () => { window.__vids++; await new Promise(r => setTimeout(r, 300)); return 'earned'; }; }, 0));`;
  const seen = Object.fromEntries(Array.from({ length: 40 }, (_, c) => [c, 1])), R = {};
  const go = save => open(browser, URL, { init: AD, save: { remindAsked: true, seen, ...save } });
  // a) can bitti → yalnız video + kapat; video → +1 ❤️
  {
    const { ctx, page, errors } = await go({ played: 60, level: 40, stars: starsUpTo(40), lives: 0, lifeT: Date.now() - 60e3 });
    await page.click('#bPlay'); await page.waitForTimeout(800);
    const btns = await page.evaluate(() => [...document.querySelectorAll('#lpAct button')].map(b => b.id));
    await page.click('#lpVid'); await page.waitForTimeout(900);
    R.can = { btns, lives: (await getSave(page)).lives, err: errors.length }; await ctx.close();
  }
  // b) kusursuz bölüm → başlığın yanında ▶ +1 🎫; izleyince bilet bakiyesi +1 (save.vc)
  {
    const { ctx, page, errors } = await go({ played: 9, level: 4, stars: starsUpTo(4) });
    await page.click('#bPlay'); await page.waitForTimeout(800);
    await solve(page, 0); await waitModal(page); await page.waitForTimeout(800);
    const inTop = await page.evaluate(() => !!document.querySelector('#winPanel .wp-top #mTk'));
    const b0 = await page.evaluate(() => window.__ray.crownBal?.() ?? null);
    await page.click('#mTk'); await page.waitForTimeout(900);
    const s = await getSave(page);
    R.bilet = { inTop, vc: s.vc, done: await page.evaluate(() => !!document.querySelector('.tkok')), err: errors.length }; await ctx.close();
  }
  // c) karanlık tünel, fener yok → "▶" düğme; izlerken süre durur, fener yanar
  {
    const { ctx, page, errors } = await go({ played: 60, level: 110, stars: starsUpTo(110), bst: { fener: 0 } });
    await page.click('#bPlay'); await page.waitForTimeout(1200);
    const vis = await page.evaluate(() => { const b = document.getElementById('gLamp'); return { shown: !b.hidden, vid: b.classList.contains('vid') }; });
    await page.evaluate(() => { window.__pauses = 0; const G = window.__ray.G; const o = Object.getOwnPropertyDescriptor(G, 'runAt'); });
    await page.click('#gLamp'); await page.waitForTimeout(120);
    const mid = await page.evaluate(() => ({ runAt: window.__ray.G.runAt }));
    await page.waitForTimeout(700);
    const after = await page.evaluate(() => ({ lamp: window.__ray.G.lamp > performance.now(), fener: JSON.parse(localStorage.getItem('ray')).bst?.fener, again: !document.getElementById('gLamp').hidden }));
    R.fener = { ...vis, paused: !mid.runAt, ...after, err: errors.length }; await ctx.close();
  }
  // d) Görevler › günlük hediye: günde bir (ilk hediye +2 ipucu), sonra satır yok
  {
    const { ctx, page, errors } = await go({ played: 30, level: 30, stars: starsUpTo(30), hints: 3 });
    await page.evaluate(() => document.getElementById('bQuest').hidden = false); await page.click('#bQuest'); await page.waitForTimeout(700);
    const row = await page.evaluate(() => !!document.getElementById('mGift'));
    await page.click('#mGift'); await page.waitForTimeout(1000);
    const s = await getSave(page), row2 = await page.evaluate(() => !!document.getElementById('mGift'));
    R.hediye = { row, row2, hints: s.hints, day: !!s.giftDay, err: errors.length }; await ctx.close();
  }
  // e) Mağaza › ücretsiz ipucu: günde 3, sonra kart kalkar
  {
    const { ctx, page, errors } = await go({ played: 30, level: 30, stars: starsUpTo(30), hints: 3 });
    await page.click('#bShop'); await page.waitForTimeout(700);
    const first = await page.evaluate(() => document.getElementById('mFree')?.textContent || '');
    for (let k = 0; k < 3; k++) { await page.click('#mFree'); await page.waitForTimeout(1000); }
    const s = await getSave(page), gone = await page.evaluate(() => !document.getElementById('mFree'));
    R.magaza = { first: first.replace(/\s+/g, ' ').slice(0, 60), hints: s.hints, gone, err: errors.length }; await ctx.close();
  }
  const ok = R.can.btns.join() === 'lpVid' && R.can.lives === 1 && !R.can.err
    && R.bilet.inTop && R.bilet.vc === 1 && R.bilet.done && !R.bilet.err
    && R.fener.shown && R.fener.vid && R.fener.paused && R.fener.lamp && R.fener.fener === 0 && !R.fener.err
    && R.hediye.row && !R.hediye.row2 && R.hediye.hints === 5 && R.hediye.day && !R.hediye.err
    && /3/.test(R.magaza.first) && R.magaza.hints === 6 && R.magaza.gone && !R.magaza.err;
  check('reklam.yerleri', 'Ödüllü video yerleri: can bitince yalnız ▶ +1 ❤️; kusursuz bölümde başlığın yanında ▶ +1 🎫; bitmiş fener ▶ ile (izlerken süre durur, fener yanar); Görevler › 🎁 günlük hediye günde 1 (+2 ipucu); Mağaza › ücretsiz ipucu günde 3',
    ok, JSON.stringify(R), 'high');
};
