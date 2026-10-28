// Mağaza öncesi kalite düzeltmeleri — gerileme testleri (hakem.cjs K bölümü çağırır). Rapor: docs/KALITE.md
module.exports = async T => {
  const { browser, URL, open, check, solve, shot, getSave, waitModal, starsUpTo } = T;
  const errs = [];
  // Capacitor App eklentisinin sahtesi (geri tuşu, arka plan): hakem MOCK'u window.Capacitor'u kurarken araya girer
  const APP = `(() => { const L = {}; window.__app = { fire: (e, d) => (L[e] || []).slice().forEach(f => f(d)), min: 0 };
    const App = { addListener: (e, f) => { (L[e] = L[e] || []).push(f); return Promise.resolve({ remove() {} }); }, minimizeApp() { window.__app.min++; } };
    Object.defineProperty(window, 'Capacitor', { configurable: true, get() { return undefined; },
      set(v) { if (v && v.Plugins) v.Plugins.App = App; Object.defineProperty(window, 'Capacitor', { value: v, writable: true, configurable: true }); } }); })();`;
  const back = page => page.evaluate(() => window.__app.fire('backButton', {}));
  const appState = (page, on) => page.evaluate(on => window.__app.fire('appStateChange', { isActive: on }), on);
  const setHidden = (page, h) => page.evaluate(h => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => h }); document.dispatchEvent(new Event('visibilitychange')); }, h);
  const running = page => page.evaluate(() => !!window.__ray.G?.runAt);
  const active = (page, id) => page.evaluate(id => document.getElementById(id).classList.contains('active'), id);
  const mOpen = page => page.evaluate(() => document.getElementById('modal').classList.contains('open'));

  // ---------- a) hat haritası: kural rozeti ("Yeni: sabit karo") satır ortasında bölünmez, kartın içinde kalır ----------
  {
    const res = {};
    for (const vp of [[360, 740], [412, 915]]) {
      const { ctx, page, errors } = await open(browser, URL, { vp, save: { played: 1 }, init: 'window.__rayTest = 1' });
      await page.click('#bMap'); await page.waitForTimeout(450);
      res[vp[0]] = await page.evaluate(() => {
        const tags = [...document.querySelectorAll('.lh b em')], bad = [];
        for (const t of tags) {
          const r = t.getBoundingClientRect(), L = t.closest('.line').getBoundingClientRect();
          if (t.getClientRects().length !== 1 || r.left < L.left || r.right > L.right) bad.push(t.textContent);
        }
        return { n: tags.length, bad };
      });
      if (vp[0] === 360) await shot(page, 'kalite-map-360');
      errs.push(...errors); await ctx.close();
    }
    check('kalite.mapTag', 'Hat haritası: kural rozeti tek parça (satır ortasında bölünmez), kartın içinde (360 ve 412 px)',
      res[360].n >= 10 && !res[360].bad.length && !res[412].bad.length, JSON.stringify(res), 'medium');
  }

  // ---------- b) sonuç paneli: başlık kesilmez, rozet "Hattı gör"e binmez (320–412 px); "▶ 2 katı" dokunma alanı ≥ 44 px ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { vp: [360, 740], save: { played: 5, hints: 3 } });
    await page.click('#bDaily'); await page.waitForTimeout(500);
    await solve(page, 15); await waitModal(page);
    const real = await page.evaluate(() => {
      const h = document.querySelector('#winPanel h2'), bd = document.querySelector('#winPanel .badge'), tg = document.getElementById('wTog').getBoundingClientRect(), d = document.getElementById('mDbl');
      const lines = Math.round(h.getBoundingClientRect().height / parseFloat(getComputedStyle(h).lineHeight));
      let hit = null;
      if (d) { const r = d.getBoundingClientRect(), x = r.left + r.width / 2; hit = { h: Math.round(r.height), up: document.elementFromPoint(x, r.top - 9)?.id, down: document.elementFromPoint(x, r.bottom + 9)?.id }; }
      return { title: h.textContent, clip: h.scrollWidth > h.clientWidth + 1, lines, over: bd ? Math.round(bd.getBoundingClientRect().right - tg.left) : null, hit };
    });
    await shot(page, 'kalite-daily-win-360');
    // aynı (gerçek) panelde en uzun başlık × rozet × düğme yazısı, üç genişlikte
    const vars = {};
    for (const w of [320, 360, 412]) {
      await page.setViewportSize({ width: w, height: 740 }); await page.waitForTimeout(200);
      vars[w] = await page.evaluate(() => {
        const h = document.querySelector('#winPanel h2'), t = document.querySelector('#winPanel .wp-t'), tog = document.getElementById('wTog'), out = [];
        let bd = t.querySelector('.badge'); if (!bd) { bd = document.createElement('span'); bd.className = 'badge'; t.appendChild(bd); }
        for (const title of ['Hat açıldı!', 'Günün Hattı tamam!', 'Pratik tamam!']) for (const b of ['YENİ HAT AÇILDI · M12', 'TEMA ALINABİLİR 🎨', 'KUSURSUZ 👑 · 🔥15']) for (const lab of ['Hattı gör', 'Sonuç']) {
          h.textContent = title; bd.textContent = b; tog.querySelector('span').textContent = lab;
          const lines = Math.round(h.getBoundingClientRect().height / parseFloat(getComputedStyle(h).lineHeight)), br = bd.getBoundingClientRect(), tr = tog.getBoundingClientRect();
          if (h.scrollWidth > h.clientWidth + 1 || lines > 2 || br.right > tr.left || bd.scrollWidth > bd.clientWidth + 1 || tr.height < 43.5 || tr.width < 43.5) out.push(`${title}|${b}|${lab}`);
        }
        return out;
      });
    }
    check('kalite.winHead', 'Sonuç paneli: "Günün Hattı tamam!" kesilmez (en çok 2 satır); en uzun başlık/rozet/düğme yazısı 320, 360, 412 px\'te sığar, rozet "Hattı gör"e binmez',
      real.title === 'Günün Hattı tamam!' && !real.clip && real.lines <= 2 && (real.over == null || real.over <= 0) && !vars[320].length && !vars[360].length && !vars[412].length, JSON.stringify({ real: { ...real, hit: undefined }, vars }), 'medium');
    check('kalite.dblHit', '"▶ 2 katı" küçük görünür ama dokunma alanı ≥ 44 px (üstünden ve altından 9 px dokunuş da düğmeye gider)',
      !!real.hit && real.hit.up === 'mDbl' && real.hit.down === 'mDbl', JSON.stringify(real.hit), 'medium');
    errs.push(...errors); await ctx.close();
  }

  // ---------- c) ana ekran: üst çipler 38 px görünür, 44 px dokunulur; "Nasıl oynanır?" ≥ 44 px ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { vp: [360, 740], save: { played: 3, streak: 2, lastDaily: '' } });
    const r = await page.evaluate(() => {
      const ch = [...document.querySelectorAll('#home .top button.chip')].map(c => { const b = c.getBoundingClientRect(), x = b.left + b.width / 2; return { h: Math.round(b.height), vis: c.clientHeight, clip: getComputedStyle(c).backgroundClip, edge: document.elementFromPoint(x, b.top + 1)?.closest('.chip') === c && document.elementFromPoint(x, b.bottom - 1)?.closest('.chip') === c, l: b.left, r: b.right }; });
      const sep = ch.every((c, i) => !i || c.l >= ch[i - 1].r);
      return { ch: ch.map(({ h, vis, clip, edge }) => ({ h, vis, clip, edge })), sep, how: Math.round(document.getElementById('bHow').getBoundingClientRect().height) };
    });
    check('kalite.chips', 'Ana ekran: 🔥 ★ 👑 çipleri görünüşte 38 px, dokunma alanı 44 px (saydam kenar), alanlar birbirine binmez; "Nasıl oynanır?" ≥ 44 px',
      r.ch.length === 3 && r.ch.every(c => c.h >= 44 && c.vis === 38 && c.clip === 'padding-box' && c.edge) && r.sep && r.how >= 44, JSON.stringify(r), 'medium');
    // bildirim: uzun yazı 320 px'te ekrandan taşmaz (iki satır), kısa yazı tek satır kalır
    await page.setViewportSize({ width: 320, height: 640 }); await page.waitForTimeout(150);
    const t = await page.evaluate(() => {
      const el = document.getElementById('toast'), m = s => { el.textContent = s; const b = el.getBoundingClientRect(); return { l: Math.round(b.left), r: Math.round(b.right), h: Math.round(b.height) }; };
      return { long: m('Reklamsız paket aktif 💛 +20 ipucu · 3 özel tema açıldı'), short: m('Baştan başladı'), w: innerWidth };
    });
    check('kalite.toast', 'Bildirim: uzun yazı 320 px ekranda taşmaz (iki satıra iner), kısa yazı tek satır', t.long.l >= 8 && t.long.r <= t.w - 8 && t.short.h < 48, JSON.stringify(t), 'medium');
    errs.push(...errors); await ctx.close();
  }

  // ---------- d) açık tema: beyaz karttaki küçük vurgu yazıları okunur (≥ 4,5:1) ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { vp: [360, 740], scheme: 'light', save: { played: 30, level: 20, stars: starsUpTo(20, 2), crowns: { 1: 1, 2: 1 }, cc: 12 } });
    const cr = sels => page.evaluate(sels => {
      const c2 = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
      const rgb = col => { c2.clearRect(0, 0, 1, 1); c2.fillStyle = '#000'; c2.fillStyle = col; c2.fillRect(0, 0, 1, 1); return [...c2.getImageData(0, 0, 1, 1).data].slice(0, 3); };
      const lum = a => a.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
      const bg = lum([246, 241, 244]);   // açık temada pencere zemini (kartlar bundan da açık)
      return Object.fromEntries(sels.map(s => { const el = document.querySelector(s); if (!el) return [s, null]; const L = lum(rgb(getComputedStyle(el).color)); return [s, +((Math.max(L, bg) + .05) / (Math.min(L, bg) + .05)).toFixed(2)]; }));
    }, sels);
    await page.click('#crownChip'); await page.waitForTimeout(450);
    const a = await cr(['.skin.on small', '.skin.can small', '.chestrow em']);
    await page.click('#mChest'); await page.waitForTimeout(400);
    const b = await cr(['.odds .tier-r', '.odds .tier-e']);
    const all = { ...a, ...b };
    check('kalite.lightContrast', 'Açık tema: "Seçili ✓", tema fiyatı, sandık fiyatı, Nadir/Destansı yazıları zeminde ≥ 4,5:1',
      Object.values(all).every(v => v != null && v >= 4.5), JSON.stringify(all), 'medium');
    errs.push(...errors); await ctx.close();
  }

  // ---------- e) "Sonraki"ye çift dokunuş: reklam sürerken ikinci basış bölüm atlatmaz ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 10, level: 2, stars: { 1: 3 }, seen: {} } });
    // geçiş reklamı yarım saniye sonra açılsın (ikinci dokunuş reklam beklerken gelsin)
    await page.evaluate(() => { const A = window.Capacitor.Plugins.AdMob, o = A.showInterstitial; A.showInterstitial = async () => { await new Promise(r => setTimeout(r, 500)); return o(); }; });
    await page.click('#bPlay'); await page.waitForTimeout(400);
    const tapNext = async (two) => { const b = await page.locator('#mNext').boundingBox(), x = b.x + b.width / 2, y = b.y + b.height / 2; await page.mouse.click(x, y); if (two) { await page.waitForTimeout(90); await page.mouse.click(x, y); } };
    for (let k = 0; k < 4; k++) { await solve(page, 15); await waitModal(page); await tapNext(k === 3); await page.waitForTimeout(k === 3 ? 1600 : 500); }   // 4. galibiyette reklam
    const r = await page.evaluate(() => ({ lvl: window.__ray.G.lvl, ads: window.__log.ads.slice(), level: JSON.parse(localStorage.getItem('ray')).level }));
    check('kalite.nextDouble', '"Sonraki"ye çift dokunuş (geçiş reklamı sürerken) tek geçiş sayılır: bölüm 6 açılır, 7\'ye atlamaz',
      r.lvl === 6 && r.level === 6 && r.ads.filter(a => a === 'interstitial').length === 1, JSON.stringify(r), 'high');
    errs.push(...errors); await ctx.close();
  }

  // ---------- f) arka plan ↔ ön plan: süre durur (visibilitychange ve Capacitor appStateChange); kural kartı açıkken akmaz ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { init: APP, save: { played: 3, level: 5 } });
    await page.click('#bPlay'); await page.waitForTimeout(400);
    const r = { run0: await running(page) };
    await appState(page, false); r.appOff = await running(page);
    const ms0 = await page.evaluate(() => window.__ray.G.ms); await page.waitForTimeout(500);
    r.frozen = (await page.evaluate(() => window.__ray.G.ms)) === ms0;
    await appState(page, true); r.appOn = await running(page);
    await setHidden(page, true); r.visOff = await running(page);
    await setHidden(page, false); r.visOn = await running(page);
    await ctx.close();
    // kural kartı (M3 · sabit karo, ilk giriş): arka plandan dönünce süre kart kapanana dek durgun
    const c2 = await open(browser, URL, { init: APP, save: { played: 30, level: 29, stars: starsUpTo(29), seen: {} } });
    await c2.page.click('#bPlay'); await c2.page.waitForTimeout(500);
    r.card = await mOpen(c2.page);
    await appState(c2.page, false); await appState(c2.page, true);
    await setHidden(c2.page, true); await setHidden(c2.page, false);
    r.cardRun = await running(c2.page);
    await c2.page.click('#mGo'); await c2.page.waitForTimeout(400); r.goRun = await running(c2.page);
    check('kalite.background', 'Arka plan: appStateChange(false) ve visibilitychange süreyi durdurur, dönünce akar; kural kartı açıkken dönüşte süre durgun, "Anladım"la akar',
      r.run0 && !r.appOff && r.frozen && r.appOn && !r.visOff && r.visOn && r.card && !r.cardRun && r.goRun, JSON.stringify(r), 'high');
    errs.push(...errors, ...c2.errors); await c2.ctx.close();
  }

  // ---------- g) Android geri tuşu ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { init: APP, save: { played: 30, level: 29, stars: starsUpTo(29), seen: {} } });
    const r = {};
    await page.click('#bSettings'); await page.waitForTimeout(400); await back(page); await page.waitForTimeout(350);
    r.modal = !(await mOpen(page)) && await active(page, 'home');
    await page.click('#bMap'); await page.waitForTimeout(400); await back(page); await page.waitForTimeout(350);
    r.map = await active(page, 'home');
    await page.click('#bPlay'); await page.waitForTimeout(500);   // kural kartı (kilitli pencere) → ana sayfa, kart görülmemiş sayılır
    r.cardOpen = await mOpen(page); await back(page); await page.waitForTimeout(350);
    r.card = !(await mOpen(page)) && await active(page, 'home') && !(await getSave(page)).seen?.[2];
    await page.click('#bPlay'); await page.waitForTimeout(500); await page.click('#mGo'); await page.waitForTimeout(300);
    await back(page); await page.waitForTimeout(350);
    r.game = await active(page, 'home');
    await back(page); await page.waitForTimeout(200);
    r.min = await page.evaluate(() => window.__app.min);
    check('kalite.back', 'Geri tuşu: pencere kapanır; harita/oyun → ana sayfa; kural kartı → ana sayfa (kart sonra yine gelir); ana sayfada uygulama arka plana alınır',
      r.modal && r.map && r.cardOpen && r.card && r.game && r.min === 1, JSON.stringify(r), 'medium');
    errs.push(...errors); await ctx.close();
  }

  // ---------- h) metinler: taç avında "0 👑 daha gerekli" yok; ★/👑 sayısından satır sonunda kopmaz ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { vp: [360, 740], save: { played: 30, level: 20, stars: starsUpTo(20, 2), cc: 12 } });
    await page.click('#crownChip'); await page.waitForTimeout(400); await page.click('#mHunt'); await page.waitForTimeout(400);
    const rich = await page.textContent('#mCard p');
    await page.click('#mBack'); await page.waitForTimeout(300); await page.click('.skin.can'); await page.waitForTimeout(400);
    const buy = await page.textContent('#mCard p');
    const nwOf = pg => pg.evaluate(() => [...document.querySelectorAll('#mCard p .nw')].filter(e => getComputedStyle(e).whiteSpace === 'nowrap').map(e => e.textContent));
    const nw = { buy: await nwOf(page) };
    await ctx.close();
    const c2 = await open(browser, URL, { vp: [360, 740], save: { played: 30, level: 101, stars: starsUpTo(101, 2) } });
    await c2.page.click('#crownChip'); await c2.page.waitForTimeout(400); await c2.page.click('#mHunt'); await c2.page.waitForTimeout(400);
    const poor = await c2.page.textContent('#mCard p');
    await c2.page.click('#mBack'); await c2.page.waitForTimeout(300); await c2.page.click('#mClose'); await c2.page.waitForTimeout(300);
    await c2.page.click('#bPlay'); await c2.page.waitForTimeout(450);   // M6 kilitli (★ 200 / 220)
    const lock = await c2.page.textContent('#mCard p');
    nw.lock = await nwOf(c2.page);
    check('kalite.texts', 'Taç avı: bakiye yetiyorsa "0 👑 daha gerekli" yazmaz, yetmiyorsa eksik sayıyı yazar; kilitli hat ve tema satın alma: ★/👑 sayısından kopmaz',
      !/daha gerekli/.test(rich) && /Gün Batımı için 5 👑 daha gerekli/.test(poor) && nw.lock.join() === '★ 220,★ 200' && nw.buy.join() === '👑 5,👑 12,👑 7',
      JSON.stringify({ rich: rich.slice(0, 40), poor: poor.slice(0, 40), nw }), 'low');
    errs.push(...errors, ...c2.errors); await c2.ctx.close();
    // yeni oyuncu: "0 bölüm kusursuz bitmeyi bekliyor" ve "Oynadığın her bölüm kusursuz! 🎉" yazmaz
    const c3 = await open(browser, URL, { vp: [360, 740], save: { played: 1 } });
    await c3.page.click('#crownChip'); await c3.page.waitForTimeout(400);
    const sub = await c3.page.textContent('#mHunt small');
    await c3.page.click('#mHunt'); await c3.page.waitForTimeout(400);
    const fresh = await c3.page.textContent('#mCard');
    check('kalite.huntNew', 'Yeni oyuncu temalarda: "0 bölüm…" ve "Aşağıdaki bölümleri…/Oynadığın her bölüm kusursuz" yerine yol gösteren yazı',
      !/^0 /.test(sub) && !/Aşağıdaki|her bölüm kusursuz/.test(fresh) && /Bölümleri ⏱ süre/.test(fresh), JSON.stringify({ sub, fresh: fresh.replace(/\s+/g, ' ').slice(0, 140) }), 'low');
    errs.push(...c3.errors); await c3.ctx.close();
  }

  check('kalite.errors', 'Mağaza kalite senaryolarında konsol hatası yok', !errs.length, errs.join(' | '));
};
