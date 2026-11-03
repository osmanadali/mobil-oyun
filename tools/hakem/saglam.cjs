// Sağlamlık: kalıcı kayıt yedeği (Capacitor Preferences), JavaScript hata bildirimi (js_error), akıcılık ölçümü (jank) — hakem.cjs K bölümü çağırır
module.exports = async T => {
  const { browser, URL, open, check, solve, getSave, starsUpTo } = T;
  // uygulama sahtesi: Preferences sessionStorage'da (sayfa yenilense de durur, localStorage silinse de)
  const NATIVE = `window.__noIntro = 1; window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'android', Plugins: { Preferences: {
    get: async ({ key }) => ({ value: sessionStorage.getItem('pref:' + key) }), set: async ({ key, value }) => { sessionStorage.setItem('pref:' + key, value); window.__prefSets = (window.__prefSets || 0) + 1; },
    remove: async ({ key }) => { sessionStorage.removeItem('pref:' + key); } } } };`;
  const pref = page => page.evaluate(() => { const v = sessionStorage.getItem('pref:ray'); return v ? JSON.parse(v) : null; });

  // ---------- a) yedek: kayıt yazılınca 1,5 sn sonra kalıcı depoya; tarayıcı belleği silinince açılışta geri gelir; Verilerimi sil yedeği de siler ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { cap: false, init: NATIVE, save: { played: 40, level: 30, stars: starsUpTo(30), remindAsked: true, hints: 7 } });
    await page.waitForTimeout(500);
    await page.click('#bSettings'); await page.waitForTimeout(300); await page.click('#oV'); await page.waitForTimeout(200);   // bir ayar → kayıt yazılır
    const sets0 = await page.evaluate(() => window.__prefSets || 0);
    await page.waitForTimeout(1800);
    const p1 = await pref(page), sets1 = await page.evaluate(() => window.__prefSets || 0);
    // tarayıcı belleği silindi (WebView temizlendi) → açılış boş kayıtla başlar, yedek daha yeni → geri yüklenir
    await page.evaluate(() => localStorage.removeItem('ray')); await page.reload(); await page.waitForTimeout(1500);
    const s2 = await getSave(page), home = await page.evaluate(() => document.getElementById('home').classList.contains('active'));
    // İlerlemeyi taşı ile gelen kod: eski yedek geri gelmesin
    const imp = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('ray')); s.level = 31; s.ts = Date.now() + 5000; sessionStorage.setItem('pref:ray', JSON.stringify({ ...s, level: 12, ts: 1 })); localStorage.setItem('ray', JSON.stringify(s)); return s.level; });
    await page.reload(); await page.waitForTimeout(1200);
    const s3 = await getSave(page), p3 = await pref(page);
    // Verilerimi sil → yedek de silinir, oyun baştan
    const tap = id => page.evaluate(id => document.getElementById(id)?.click(), id).then(() => page.waitForTimeout(400));
    await tap('bSettings'); await tap('oPriv'); await tap('mWipe');
    const wq = await page.evaluate(() => document.getElementById('mCard').textContent.slice(0, 60) + ' | ' + !!document.getElementById('mWipeOk'));
    await tap('mWipeOk'); await page.waitForTimeout(2500);
    const p4 = await pref(page), s4 = await getSave(page);
    check('kasa.backup', 'Kalıcı yedek: kayıt değişince ~1,5 sn sonra telefonun kalıcı deposuna yazılır (dokunuş başına değil); tarayıcı belleği silinince açılışta yedekten geri gelir (Bölüm 30, ipuçları); daha yeni yerel kayıt eski yedeğin üstüne yazılır; Verilerimi sil yedeği de siler',
      sets1 > sets0 && p1?.level === 30 && p1?.ts > 0 && s2.level === 30 && s2.hints === 7 && home && s3.level === imp && p3?.level === 31 && (!p4 || ((p4.played || 0) === 0 && (p4.level || 1) === 1)) && (s4.level || 1) === 1 && !errors.length,
      JSON.stringify({ sets0, sets1, p1: p1 && { level: p1.level, ts: !!p1.ts }, s2: { level: s2.level, hints: s2.hints }, s3: s3.level, p3: p3?.level, p4: p4 && { played: p4.played, level: p4.level }, s4: s4.level, wq, errors }));
    await ctx.close();
  }

  // ---------- b) hata bildirimi ve takılma ölçümü ----------
  {
    const { ctx, page } = await open(browser, URL, { save: { played: 40, level: 20, stars: starsUpTo(20), remindAsked: true, seen: Object.fromEntries(Array.from({ length: 30 }, (_, k) => [k, 1])) } });
    await page.evaluate(() => { window.__ev = []; window.Olcum.event = (n, p) => window.__ev.push([n, p]); });
    // aynı hata iki kez → bir bildirim; 7 farklı hata → en çok 5
    await page.evaluate(() => { for (let i = 0; i < 2; i++) setTimeout(() => { throw new Error('deneme hatası'); }, 10); for (let i = 0; i < 7; i++) setTimeout(() => { throw new Error('hata ' + i); }, 20); Promise.reject(new Error('söz hatası')); });
    await page.waitForTimeout(400);
    const errs = await page.evaluate(() => window.__ev.filter(e => e[0] === 'js_error').map(e => e[1]));
    // bölüm oynanırken ana iş parçacığı 120 ms kilitlenir → level_end'de jank ≥ 1
    await page.click('#bPlay'); await page.waitForTimeout(700);
    await page.evaluate(() => { const t = performance.now(); while (performance.now() - t < 120); });
    await page.waitForTimeout(200); await solve(page, 15); await page.waitForTimeout(2500);
    const end = await page.evaluate(() => window.__ev.find(e => e[0] === 'level_end')?.[1]);
    await page.evaluate(() => window.__ray.jank.report(true));
    const ses = await page.evaluate(() => window.__ev.find(e => e[0] === 'perf_session')?.[1]);
    check('olcum.hata', 'Hata bildirimi: yakalanmayan hata ve söz reddi js_error olarak gider (ileti, dosya:satır, ekran, bölüm); aynısı bir kez, oturumda en çok 5',
      errs.length === 5 && errs.filter(e => /deneme hatası$/.test(e.msg)).length === 1 && errs.some(e => e.src === 'promise' && /söz/.test(e.msg)) && errs.every(e => e.scr === 'home' && 'lvl' in e && !/^Uncaught/.test(e.msg)), JSON.stringify(errs));
    check('olcum.jank', 'Akıcılık: bölüm sonunda level_end\'e takılan kare sayısı (jank) ve süresi (jank_ms) eklenir; arka plana geçişte oturum özeti perf_session (en kötü kare, çekirdek, ekran ölçeği)',
      end && end.jank >= 1 && end.jank_ms >= 100 && ses && ses.jank >= 1 && ses.worst >= 100 && 'cores' in ses && ses.dpr > 0, JSON.stringify({ end, ses }));
    await ctx.close();
  }
};
