// Güncelleme düzeni (servis çalışanı yalnız web'de) ve hatırlatma bildirimleri (hedef ekran, izin sorusunun zamanı) — hakem.cjs K bölümü çağırır
const fs = require('fs'), path = require('path');
module.exports = async T => {
  const { browser, URL, open, check, solve, shot, getSave, waitModal, starsUpTo } = T;
  const errs = [];
  const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const TODAY = ymd(new Date()), YDAY = ymd(new Date(Date.now() - 864e5));
  // Capacitor sahtesine araya girer: ?native → isNativePlatform() true; LocalNotifications dinleyicisi window.__nl'de yakalanır
  const CAP = `(() => { window.__nl = {}; const nat = location.search.includes('native');
    Object.defineProperty(window, 'Capacitor', { configurable: true, get() { return undefined; }, set(v) {
      if (v) { v.isNativePlatform = () => nat; let ln;
        if (v.Plugins) Object.defineProperty(v.Plugins, 'LocalNotifications', { configurable: true, enumerable: true, get: () => ln,
          set(o) { ln = { ...o, addListener: (e, f) => { window.__nl[e] = f; } }; } }); }
      Object.defineProperty(window, 'Capacitor', { value: v, writable: true, configurable: true }); } }); })();`;
  const NOTIF = CAP + '\nwindow.__withNotif = true;';
  const notifs = page => page.evaluate(() => (window.__log.notif || []).map(n => ({ id: n.id, t: n.title, b: n.body, go: n.extra?.go })));
  const tap = async (page, go) => { await page.evaluate(go => window.__nl.localNotificationActionPerformed?.({ notification: { extra: { go } } }), go); await page.waitForTimeout(900); };
  const where = page => page.evaluate(() => { const G = window.__ray.G, on = id => document.getElementById(id).classList.contains('active');
    return { game: on('game'), home: on('home'), daily: !!G?.daily, lvl: G?.lvl ?? null, won: !!G?.won }; });
  const sheetH = page => page.evaluate(() => document.getElementById('modal').classList.contains('open') ? document.querySelector('.sheet h2')?.textContent || '' : '');

  // ---------- a) index.html'deki her <script src> sw.js önbellek listesinde ----------
  {
    const root = path.join(__dirname, '..', '..', 'www');
    const srcs = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
    const F = new Function('return ' + fs.readFileSync(path.join(root, 'sw.js'), 'utf8').match(/F = (\[[\s\S]*?\]);/)[1])();
    const miss = srcs.filter(s => !F.includes(s));
    check('sw.list', 'Servis çalışanı: index.html\'deki her <script src> sw.js önbellek listesinde', srcs.length >= 10 && !miss.length, `${srcs.length} betik · eksik: ${miss.join(', ') || '—'}`);
  }

  // ---------- b) web'de servis çalışanı kaydı var; uygulamada (native) yok, eski kayıt ve 'ray-' önbellekleri temizlenir ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { init: CAP });
    const web = await page.evaluate(async () => {
      await Promise.race([navigator.serviceWorker.ready, new Promise(r => setTimeout(r, 4000))]);
      for (let k = 0; k < 40 && !(await caches.keys()).some(c => c.startsWith('ray-')); k++) await new Promise(r => setTimeout(r, 100));
      return { regs: (await navigator.serviceWorker.getRegistrations()).length, caches: (await caches.keys()).filter(c => c.startsWith('ray-')).length };
    });
    const nat = [];
    for (let k = 0; k < 2; k++) {   // 2. açılış: artık hiçbir şey sayfayı denetlemiyor, önbellek yeniden dolmamalı
      await page.goto(URL + '?native=1'); await page.waitForTimeout(1200);
      nat.push(await page.evaluate(async () => ({ native: !!window.Capacitor?.isNativePlatform?.(), regs: (await navigator.serviceWorker.getRegistrations()).length, caches: (await caches.keys()).filter(c => c.startsWith('ray-')).length })));
    }
    check('sw.native', 'Servis çalışanı yalnız web\'de: web\'de kayıt + önbellek var; uygulamada kayıt yapılmaz, eski kayıt ve ray- önbellekleri silinir',
      web.regs >= 1 && web.caches >= 1 && nat.every(n => n.native && !n.regs && !n.caches), JSON.stringify({ web, nat }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- c) yeni oyuncu (Günün Hattı yok, Bölüm 13): bildirimler bölüme çağırır, dokununca sıradaki bölüm açılır ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { init: NOTIF, save: { played: 12, level: 13, stars: starsUpTo(13), remind: true, remindAsked: true } });
    const n = await notifs(page);
    const ok = n.length >= 3 && n.every(x => x.go === 'level') && n.filter(x => x.id <= 2).every(x => /Bölüm 13 seni bekliyor/.test(x.b)) && !n.some(x => /Günün Hattı|seri/i.test(x.t + x.b));
    await tap(page, 'level'); const w = await where(page);
    check('notif.newbie', 'Hatırlatma (yeni oyuncu): bildirimler "Bölüm N seni bekliyor" ve go=level; dokununca sıradaki bölüm açılır', ok && w.game && !w.daily && w.lvl === 13, JSON.stringify({ n, w }), 'medium');
    errs.push(...errors); await ctx.close();
  }

  // ---------- d) Günün Hattı oyuncusu: 1–2 Günün Hattı'na, 3. gün bölüme; bugün bitmişse ana sayfa; yarım oyunu bölmez ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { init: NOTIF, save: { played: 30, level: 31, stars: starsUpTo(31), streak: 3, best: 3, lastDaily: YDAY, dailyDone: YDAY, dailyLog: [YDAY], remind: true, remindAsked: true } });
    const n = await notifs(page), go = Object.fromEntries(n.map(x => [x.id, x.go]));
    await tap(page, 'daily'); const w1 = await where(page);
    await tap(page, 'level'); const w2 = await where(page);   // Günün Hattı yarımken: dokunmaz
    await page.click('#bBack'); await page.waitForTimeout(500);
    await tap(page, 'level'); const w3 = await where(page);
    check('notif.daily', 'Hatırlatma (Günün Hattı oyuncusu): 1–2 go=daily, 3. gün go=level; daily → Günün Hattı, level → sıradaki bölüm, yarım oyun bölünmez',
      go[2] === 'daily' && go[3] === 'level' && (go[1] ?? 'daily') === 'daily' && w1.game && w1.daily && w2.daily && w3.game && !w3.daily && w3.lvl === 31, JSON.stringify({ go, w1, w2, w3 }), 'medium');
    errs.push(...errors); await ctx.close();
  }
  {
    const { ctx, page, errors } = await open(browser, URL, { init: NOTIF, save: { played: 30, level: 31, stars: starsUpTo(31), streak: 3, best: 3, lastDaily: TODAY, dailyDone: TODAY, dailyLog: [TODAY], remind: true, remindAsked: true } });
    await page.click('#bMap'); await page.waitForTimeout(400);
    await tap(page, 'daily'); const w = await where(page);
    check('notif.dailyDone', 'Hatırlatma: Günün Hattı bugün bitmişse "daily" bildirimi ana sayfayı açar (boş kalmaz)', w.home && !w.game, JSON.stringify(w), 'medium');
    errs.push(...errors); await ctx.close();
  }

  // ---------- e) izin sorusu: Bölüm 7'de sorulmaz; Bölüm 12 bitince "Kaldığın yeri…", ilk Günün Hattı'ndan sonra seri metni ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { init: NOTIF, save: { played: 6, level: 7, stars: starsUpTo(7) } });
    await page.click('#bPlay'); await page.waitForTimeout(500); await page.click('#bBack'); await page.waitForTimeout(1300);
    const early = await sheetH(page);
    errs.push(...errors); await ctx.close();
    const o = await open(browser, URL, { init: NOTIF, save: { played: 11, level: 12, stars: starsUpTo(12) } });
    await o.page.click('#bPlay'); await o.page.waitForTimeout(500); await solve(o.page, 10); await waitModal(o.page);
    await o.page.click('#mHome'); await o.page.waitForTimeout(1400);
    const h12 = await sheetH(o.page), p12 = await o.page.evaluate(() => document.querySelector('.sheet p')?.textContent || '');
    await shot(o.page, 'remind-ask-level');
    errs.push(...o.errors); await o.ctx.close();
    const d = await open(browser, URL, { init: NOTIF, save: { played: 3, level: 4, stars: starsUpTo(4) } });
    await d.page.click('#bDaily'); await d.page.waitForTimeout(500); await solve(d.page, 10); await waitModal(d.page);
    await d.page.click('#mHome'); await d.page.waitForTimeout(1400);
    const hd = await sheetH(d.page), pd = await d.page.evaluate(() => document.querySelector('.sheet p')?.textContent || '');
    errs.push(...d.errors); await d.ctx.close();
    check('remind.when', 'İzin sorusu: Bölüm 7\'de sorulmaz; Bölüm 12 bitince "Kaldığın yeri hatırlatayım mı?", ilk Günün Hattı\'ndan sonra seri metniyle',
      !early && /Kaldığın yeri hatırlatayım mı/.test(h12) && !/[Ss]eri/.test(p12) && /^Hatırlatayım mı/.test(hd) && /[Ss]erin/.test(pd), JSON.stringify({ early, h12, hd }), 'medium');
  }

  // ---------- f) İngilizce: yeni oyuncu bildirimi ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { locale: 'en-US', init: NOTIF, save: { played: 12, level: 13, stars: starsUpTo(13), remind: true, remindAsked: true } });
    const n = await notifs(page);
    check('notif.en', 'Hatırlatma İngilizce: "Level N is waiting", Türkçe harf yok', n.length >= 3 && n.filter(x => x.id <= 2).every(x => /^Level 13 is waiting/.test(x.b)) && !n.some(x => /[ğüşıöçĞÜŞİÖÇ]/.test(x.t + x.b)), JSON.stringify(n.map(x => x.b)), 'medium');
    errs.push(...errors); await ctx.close();
  }
  check('gb.errors', 'Güncelleme/bildirim senaryolarında konsol hatası yok', !errs.length, errs.join(' | '));
};
