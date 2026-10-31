// Tasarım turu 2: tek süre göstergesi, oyun başlığında ⚡% yok, 💎 parça birimi yok, "Nasıl oynanır?" Ayarlar'da, sıradaki tema,
// mağaza puanı (sistem penceresi), ilerlemeyi taşı (kod), ikinci hat deseni, 7×9 hatlarında kısa bölüm — hakem.cjs K bölümü çağırır
module.exports = async T => {
  const { browser, URL, open, check, solve, starsUpTo } = T;
  const errs = [];

  // ---------- a) oyun ekranı + ana sayfa + ayarlar ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 30, level: 19, stars: starsUpTo(19), seen: { 2: 1 }, remindAsked: true } });
    const home = await page.evaluate(() => ({ how: !!document.getElementById('bHow'), mark: !!document.querySelector('#home .logo.mark .hub') }));
    await page.click('#bSettings'); await page.waitForTimeout(500);
    const rows = await page.evaluate(() => ['oHow', 'oMove', 'oMail'].map(id => !!document.getElementById(id)));
    await page.click('#oHow'); await page.waitForTimeout(600);
    const howOpen = await page.evaluate(() => document.getElementById('modal').classList.contains('open') && /Nasıl|How/.test(document.querySelector('#mCard h2')?.textContent || ''));
    await page.evaluate(() => document.getElementById('modal').classList.remove('open')); await page.reload(); await page.waitForTimeout(400);
    await page.click('#bPlay'); await page.waitForTimeout(700);
    const g = await page.evaluate(() => ({ t: document.getElementById('gMoves').textContent, time: !!document.getElementById('gTime'), pill: document.getElementById('gPill').textContent }));
    check('t2.ui', 'Sade ekran: oyunda tek süre (kalan süre şeritte), başlıkta ⚡% yok; ana sayfa logosu ikon işareti; "Nasıl oynanır?" ve "İlerlemeyi taşı" Ayarlar\'da; destek e-postası boşken "Bize yaz" yok',
      !g.time && !/⚡|%/.test(g.t) && /M2/.test(g.t) && !home.how && home.mark && rows[0] && rows[1] && !rows[2] && howOpen, JSON.stringify({ g, home, rows, howOpen }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- b) 💎 yok: 3 yeni taçta +1 ipucu, ara sayaç yazılmaz ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 30, level: 5, stars: starsUpTo(5), shards: 2, hints: 3, remindAsked: true } });
    await page.click('#bPlay'); await page.waitForTimeout(700); await solve(page, 10); await page.waitForTimeout(2600);
    const r = await page.evaluate(() => ({ txt: document.getElementById('winPanel').textContent, s: JSON.parse(localStorage.getItem('ray')) }));
    check('t2.shard', '💎 parça birimi yok: kusursuz 3. yeni taçta "👑 3 yeni taç · +1 ipucu", ara sayaç (1/3) yazılmaz',
      !/💎|parça/.test(r.txt) && (r.s.crowns?.[5] ? /3 yeni taç/.test(r.txt) && r.s.hints === 4 : true), `${r.txt.slice(0, 120)} · ipucu ${r.s.hints}`);
    errs.push(...errors); await ctx.close();
  }

  // ---------- c) mağaza puanı + ilerlemeyi taşı + üretim ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 30, level: 40, stars: starsUpTo(40), noAds: true, owned: { metro: 1, gold: 1 }, hints: 7, remindAsked: true } });
    const r = await page.evaluate(() => {
      const R = window.__ray; let n = 0; window.Capacitor.Plugins.InAppReview = { requestReview: () => { n++; return Promise.resolve(); } };
      const a = R.review(2), b = R.review(3), c = R.review(3), s = JSON.parse(localStorage.getItem('ray'));
      // kısa bölüm: 7×9 hatlarında hattın 3., 9.… bölümü 6×8; diğerleri 7×9
      const sz = [181, 182, 183, 184, 189].map(l => R.sizeFor(l).join('x')).join(' ');
      return { a, b, c, n, rv: !!s.rv, sz };
    });
    // kod: kopyala → başka cihazda yükle; reklamsız paket ve VIP tema kodla taşınmaz
    const code = await page.evaluate(() => { document.getElementById('bSettings').click(); return null; });
    await page.waitForTimeout(400); await page.click('#oMove'); await page.waitForTimeout(400);
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await page.click('#mCopy'); await page.waitForTimeout(300);
    const cp = await page.evaluate(async () => { try { return await navigator.clipboard.readText(); } catch { return document.getElementById('mCode').value; } });
    errs.push(...errors); await ctx.close();
    const o = await open(browser, URL, { save: { played: 2, level: 3, stars: starsUpTo(3), remindAsked: true } });
    await o.page.click('#bSettings'); await o.page.waitForTimeout(400); await o.page.click('#oMove'); await o.page.waitForTimeout(400);
    await o.page.fill('#mCode', 'RAY1.bozuk.kod'); await o.page.click('#mLoad'); await o.page.waitForTimeout(300);
    const bad = await o.page.evaluate(() => JSON.parse(localStorage.getItem('ray')).level);
    await o.page.fill('#mCode', cp); await o.page.click('#mLoad'); await o.page.waitForTimeout(200);
    await Promise.all([o.page.waitForNavigation().catch(() => {}), o.page.click('#mLoad')]); await o.page.waitForTimeout(600);
    const s2 = await o.page.evaluate(() => JSON.parse(localStorage.getItem('ray')));
    errs.push(...o.errors); await o.ctx.close();
    check('t2.review', 'Mağaza puanı: yalnız 3 ★ ve ilk hattan sonra, bir kez (60 gün + 40 bölüm geçmeden tekrar yok)', !r.a && r.b && !r.c && r.n === 1 && r.rv, JSON.stringify(r));
    check('t2.short', '7×9 hatlarında kısa bölüm: hattın 3., 9.… bölümü 6×8 (183, 189), diğerleri 7×9', r.sz === '7x9 7x9 6x8 7x9 6x8', r.sz);
    check('t2.move', 'İlerlemeyi taşı: kod öteki cihazda bölüm, ★ ve ipucunu taşır; bozuk kod reddedilir; reklamsız paket ve VIP tema kodla taşınmaz',
      /^RAY1\./.test(cp) && bad === 3 && s2.level === 40 && s2.hints === 7 && Object.keys(s2.stars).length === 39 && !s2.noAds && !s2.owned?.gold, `${cp.slice(0, 16)}… · bozuk→${bad} · yüklenen bölüm ${s2.level} · ipucu ${s2.hints} · noAds ${s2.noAds} · gold ${s2.owned?.gold}`);
  }

  check('t2.errors', 'Tasarım turu 2 senaryolarında konsol hatası yok', !errs.length, errs.slice(0, 3).join(' | ') || 'hata yok');
};
