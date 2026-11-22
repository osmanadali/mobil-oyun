// Haftalık lig ve canlı kapışma (sahte arka uç: window.__ligFake). Lig.on() değilse menüde görünmez.
// Katılım (takma ad filtresi), bölüm sonu tırmanış (yeni ★ kadar puan; tekrar oynama puan vermez), kapışma (ilk bitiren kazanır,
// rakip önce biterse yenilgi, ipucu yok, can harcamaz), terk = puansız yenilgi, ligden çık = veriler silinir.
// hakem.cjs K bölümü çağırır; tek başına: --only=lig
module.exports = async T => {
  const { browser, URL, open, check, solve, waitModal, starsUpTo, seenTo, shot } = T;
  const base = { played: 30, level: 30, stars: starsUpTo(29), remindAsked: true, g11: 1, lastGift: Date.now(), seen: seenTo(5) };
  // 1) sekme çubuğunda Lig ve Kapış görünür
  let o = await open(browser, URL, { save: base });
  const hidden = await o.page.evaluate(() => getComputedStyle(document.querySelector('#tabbar [data-tab=league]')).display === 'none');
  await o.ctx.close();
  // 2) katılım: kötü takma ad reddedilir, iyisi kabul
  o = await open(browser, URL, { save: base, init: 'window.__ligFake = true' });
  const { page } = o;
  const vis = await page.evaluate(() => getComputedStyle(document.querySelector('#tabbar [data-tab=league]')).display !== 'none');
  await page.click('#tabbar [data-tab=league]'); await page.waitForTimeout(400);
  // takma ad kutusu boş gelir (rastgele öneri yok); boşken katılınmaz
  const empty = await page.evaluate(() => ({ v: document.getElementById('mNick')?.value, ph: document.getElementById('mNick')?.placeholder }));
  await page.click('#mJoin'); await page.waitForTimeout(200);
  const emptyErr = await page.evaluate(() => ({ err: document.getElementById('mNickE')?.textContent || '', joined: !!JSON.parse(localStorage.getItem('ray.lig') || '{}').joined }));
  check('lig.ad-bos', 'Lige katılırken takma ad kutusu boş gelir (rastgele “Metrocu 773” yok, yalnız soluk yönlendirme); boşken katılınmaz, uyarı çıkar', empty.v === '' && /Takma adını yaz/.test(empty.ph) && /takma ad yaz/.test(emptyErr.err) && !emptyErr.joined, JSON.stringify({ empty, emptyErr }), 'high');
  await page.fill('#mNick', 's1kt1r'); await page.click('#mJoin'); await page.waitForTimeout(200);
  const bad = await page.evaluate(() => ({ err: document.getElementById('mNickE')?.textContent || '', joined: JSON.parse(localStorage.getItem('ray.lig') || '{}').joined }));
  await page.fill('#mNick', 'Hızlı Martı'); await page.click('#mJoin'); await page.waitForTimeout(900);
  const board = await page.evaluate(() => ({ screen: document.getElementById('league').classList.contains('active'), rows: document.querySelectorAll('#lgList .lgr').length, me: document.querySelector('#lgList .lgr.me span')?.textContent || '' }));
  await shot(page, 'lig-tablo');
  // 3) bölüm kazan → tırmanış (yeni ★); aynı bölümü tekrar oyna → puan yok
  await page.click('#lgBack'); await page.waitForTimeout(400);
  const pts0 = await page.evaluate(() => JSON.parse(localStorage.getItem('ray.lig')).pts || 0);
  await page.click('#bPlay'); await page.waitForTimeout(700);
  await solve(page, 0); await waitModal(page); await page.waitForTimeout(1500);
  const climb = await page.evaluate(() => ({ el: !!document.querySelector('#winPanel .climb'), h: document.querySelector('#winPanel .cl-h')?.textContent || '', pts: JSON.parse(localStorage.getItem('ray.lig')).pts }));
  await shot(page, 'lig-tirmanis');
  await page.click('#bReset'); await page.waitForTimeout(700);
  await solve(page, 0); await waitModal(page); await page.waitForTimeout(1200);
  const again = await page.evaluate(() => JSON.parse(localStorage.getItem('ray.lig')).pts);
  // 4) kapışma: kazan
  await page.evaluate(() => { document.getElementById('bBack')?.click(); }); await page.waitForTimeout(500);
  await page.evaluate(() => window.__ray.lig.find({ wait: 300, oppT: 120 }));
  await page.waitForFunction(() => window.__ray.G?.duel && !document.getElementById('modal').classList.contains('open'), null, { timeout: 8000 }); await page.waitForTimeout(300);
  const g1 = await page.evaluate(() => { const G = window.__ray.G; return { duel: !!G?.duel, bar: getComputedStyle(document.getElementById('vsBar')).display, hint: getComputedStyle(document.getElementById('bHint')).display, lives: JSON.parse(localStorage.getItem('ray')).lives ?? 5 }; });
  await shot(page, 'kapis-oyun');
  await solve(page, 0); await page.waitForTimeout(1600);
  const w = await page.evaluate(() => ({ pts: JSON.parse(localStorage.getItem('ray.lig')).pts, h: document.querySelector('.sheet h2')?.textContent || '', climb: !!document.querySelector('#vsClimb .climb'), vs: JSON.parse(localStorage.getItem('ray')).vs, lives: JSON.parse(localStorage.getItem('ray')).lives ?? 5 }));
  await shot(page, 'kapis-kazandin');
  // 5) kapışma: rakip önce biter → yenilgi
  await page.evaluate(() => document.getElementById('vHome')?.click()); await page.waitForTimeout(400);
  await page.evaluate(() => window.__ray.lig.find({ wait: 200, oppT: 2 })); await page.waitForTimeout(6500);
  const l = await page.evaluate(() => ({ pts: JSON.parse(localStorage.getItem('ray.lig')).pts, h: document.querySelector('.sheet h2')?.textContent || '', vs: JSON.parse(localStorage.getItem('ray')).vs }));
  await shot(page, 'kapis-kaybettin');
  // 6) terk: kapışmadan çıkınca puansız yenilgi; 7) ligden çık → veriler silinir
  await page.evaluate(() => document.getElementById('vHome')?.click()); await page.waitForTimeout(400);
  const p1 = await page.evaluate(() => JSON.parse(localStorage.getItem('ray.lig')).pts);
  await page.evaluate(() => window.__ray.lig.find({ wait: 200, oppT: 120 }));
  await page.waitForFunction(() => window.__ray.G?.duel && document.getElementById('game').classList.contains('active') && !document.getElementById('modal').classList.contains('open'), null, { timeout: 8000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { document.getElementById('bBack').click(); }); await page.waitForTimeout(300); await page.evaluate(() => document.getElementById('pHome')?.click()); await page.waitForTimeout(500);
  const quit = await page.evaluate(() => ({ home: document.getElementById('home').classList.contains('active'), pts: JSON.parse(localStorage.getItem('ray.lig')).pts }));
  await page.click('#bSettings'); await page.waitForTimeout(400);
  const rows = await page.evaluate(() => ({ nick: !!document.getElementById('oNick'), leave: !!document.getElementById('oLeave') }));
  await page.click('#oLeave'); await page.waitForTimeout(300); await page.click('#mDel'); await page.waitForTimeout(500);
  const gone = await page.evaluate(() => JSON.parse(localStorage.getItem('ray.lig') || '{}').joined);
  const errors = o.errors; await o.ctx.close();
  check('lig.menu', 'Sekme çubuğunda Lig ve Kapış görünür', !hidden && vis, JSON.stringify({ hidden, vis }), 'high');
  check('lig.katil', 'Lige katılım: uygunsuz takma ad reddedilir, uygunu kabul; lig ekranı 30 kişi, sen işaretli', !!bad.err && !bad.joined && board.screen && board.rows === 30 && /Hızlı Martı/.test(board.me), JSON.stringify({ bad, board }), 'high');
  check('lig.tirmanis', 'Bölüm sonu tırmanış: yeni yıldız kadar puan, panelde #eski → #yeni; aynı bölümü tekrar oynamak puan vermez', climb.el && climb.pts > pts0 && again === climb.pts, JSON.stringify({ pts0, climb, again }), 'high');
  check('lig.kapis', 'Kapışma: rakip çubuğu, ipucu yok, can harcamaz; ilk bitiren kazanır (+10), rakip önce biterse yenilgi (+2); terk puansız; ligden çık verileri siler',
    g1.duel && g1.bar === 'flex' && g1.hint === 'none' && w.lives === g1.lives && /Kazandın/.test(w.h) && w.climb && w.vs?.w === 1 && w.pts - again === 10 && /Kaybettin/.test(l.h) && l.vs?.l === 1 && l.pts - w.pts === 2 && quit.home && quit.pts === p1 && rows.nick && rows.leave && !gone && !errors.length,
    JSON.stringify({ again, g1, w, l, p1, quit, rows, gone, errors }), 'high');
};
