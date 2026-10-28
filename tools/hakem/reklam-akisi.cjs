// Reklam akışı — robot testleri (hakem.cjs K bölümü çağırır)
// 1) iOS ATT: rıza sorgusu hata verse de, canRequestAds false olsa da sorulur; initialize yalnız canRequestAds true iken; Android'de ATT yok
// 2) ödüllü video 'earned' | 'closed' | 'nofill': video yokken oyuncu suçlanmaz (TR + EN)
// 3) ödüllü video izlenen turda geçiş reklamı yok, sıra korunur → sonraki "Sonraki"de çıkar
// 4) yüklenemeyen geçiş reklamı 30/60/120 sn arayla ve ön plana dönüşte yeniden yüklenir; 55 dk'yı geçen yenilenir
// 5) sonuç panelinde "Reklamsız oyna · fiyat" bağlantısı: 320/360 px'te taşmaz, dokununca mağaza; reklamsız pakette yok
module.exports = async T => {
  const { browser, URL, open, check, solve, shot, waitModal, starsUpTo } = T;
  const G = (page, f, a) => page.evaluate(f, a);
  const NO_FILL = { tr: 'Şu an video yok · biraz sonra dene', en: 'No video right now · try again soon' };
  const NO_REWARD = { tr: 'Ödül alınamadı · video sonuna kadar izlenmeli', en: 'No reward · watch the video to the end' };

  // AdMob sahtesi. c: { consent: 'ok'|'deny'|'throw'|null (rıza API'si yok), rFill, rEarn, iFail: ilk kaç yükleme başarısız }
  const CAP = (os, c = {}) => `(() => {
    const C = window.__ad = Object.assign({ consent: 'ok', rFill: true, rEarn: true, iFail: 0, att: 'notDetermined', calls: [], timers: [] }, ${JSON.stringify(c)});
    const log = x => C.calls.push(x), L = {}, emit = e => (L[e] || []).slice().forEach(f => f({}));
    // uzun bekleyişler (≥ 30 sn) kaydedilir, kendiliğinden çalışmaz: test elle tetikler
    const st = window.setTimeout.bind(window);
    window.setTimeout = (f, ms, ...a) => ms >= 30e3 ? (C.timers.push({ ms, f }), 0) : st(f, ms, ...a);
    const info = () => ({ status: C.consent === 'ok' ? 'OBTAINED' : 'REQUIRED', isConsentFormAvailable: false, canRequestAds: C.consent === 'ok', privacyOptionsRequirementStatus: 'NOT_REQUIRED' });
    const A = { addListener: (e, f) => { (L[e] = L[e] || []).push(f); return Promise.resolve({ remove() { L[e] = L[e].filter(x => x !== f); } }); },
      trackingAuthorizationStatus: async () => { log('attStatus'); return { status: C.att }; },
      requestTrackingAuthorization: async () => { log('att'); C.att = 'denied'; },
      initialize: async () => { log('init'); },
      prepareInterstitial: async () => { log('prepI'); if (C.iFail-- > 0) throw new Error('no fill'); },
      prepareRewardVideoAd: async () => { log('prepR'); if (!C.rFill) throw new Error('no fill'); },
      showInterstitial: async () => { log('showI'); st(() => emit('interstitialAdDismissed'), 50); },
      showRewardVideoAd: async () => { log('showR'); st(() => { if (C.rEarn) emit('onRewardedVideoAdReward'); emit('onRewardedVideoAdDismissed'); }, 50); return C.rEarn ? { type: 'hint', amount: 1 } : undefined; } };
    if (C.consent) A.requestConsentInfo = async () => { log('info'); if (C.consent === 'throw') throw new Error('app not linked'); return info(); };
    window.Capacitor = { getPlatform: () => '${os}', isNativePlatform: () => true, Plugins: { AdMob: A } };
  })();`;
  // mağaza sahtesi: fiyat görünür, sipariş hemen sahip olunur
  const SHOP = price => `window.CdvPurchase = (() => { let owned = false; const cb = {};
    const product = { id: 'ray_reklamsiz', canPurchase: true, pricing: { price: '${price}' }, getOffer: () => ({ order: async () => { owned = true; (cb.r || []).forEach(f => f({})); } }) };
    const when = { approved() { return when; }, verified() { return when; }, productUpdated(f) { cb.p = [f]; return when; }, receiptUpdated(f) { cb.r = [f]; return when; } };
    return { ProductType: { NON_CONSUMABLE: 'nc' }, Platform: { GOOGLE_PLAY: 'gp', APPLE_APPSTORE: 'as' }, ErrorCode: { PAYMENT_CANCELLED: 1 },
      store: { register() {}, when: () => when, initialize: async () => { (cb.p || []).forEach(f => f(product)); return []; }, get: () => product, owned: () => owned, restorePurchases: async () => {} } }; })();`;
  const calls = page => G(page, () => window.__ad.calls.slice());
  const ads = page => G(page, () => window.__log.ads.slice());
  // bölümü çöz, sonuç paneli gelsin (yeni hat kartı çıkarsa geç)
  async function winLevel(page) {
    if (await page.$('#mGo')) { await page.click('#mGo'); await page.waitForTimeout(300); }
    await solve(page, 8);
    return await waitModal(page) && await G(page, () => window.__ray.G.won);
  }
  async function nextLevel(page) { await page.click('#mNext'); await page.waitForTimeout(500); }
  // bağlantı ölçüsü: panel içinde, metin kesilmeden, yatay kaydırma yok
  const linkAt = (page, w) => page.setViewportSize({ width: w, height: 640 }).then(() => page.waitForTimeout(350)).then(() => G(page, () => {
    const b = document.getElementById('mAdFree'), p = document.getElementById('winPanel'); if (!b) return null;
    const r = b.getBoundingClientRect(), q = p.getBoundingClientRect(), rg = document.createRange(); rg.selectNodeContents(b); const t = rg.getBoundingClientRect();
    return { txt: b.textContent, w: innerWidth, fits: t.left >= r.left - 1 && t.right <= r.right + 1 && r.left >= q.left - 1 && r.right <= q.right + 1 && r.left >= 0 && r.right <= innerWidth,
      page: document.documentElement.scrollWidth <= innerWidth, h: Math.round(r.height) };
  }));

  // ---- 1) iOS ATT: rıza sorgusu hata verince / reklam izni yokken de sorulur; initialize yalnız izin varken ----
  {
    const run = async (os, consent) => {
      const { ctx, page, errors } = await open(browser, URL, { cap: false, init: CAP(os, { consent }), save: { played: 5, level: 3, stars: starsUpTo(3), remindAsked: true } });
      await page.waitForTimeout(300);
      const c = await calls(page), on = await G(page, () => Ads.online());
      await ctx.close();
      return { c, on, errors };
    };
    const thr = await run('ios', 'throw'), deny = await run('ios', 'deny'), okk = await run('ios', 'ok'), andT = await run('android', 'throw'), andD = await run('android', 'deny');
    const at = (r, k) => r.c.indexOf(k);
    check('reklam.att.throw', 'iOS: rıza sorgusu hata verse de ATT sorulur; initialize ve reklam isteği yok', thr.c.includes('att') && !thr.c.includes('init') && !thr.c.some(k => /^prep/.test(k)) && !thr.on && !thr.errors.length, thr.c.join(' → '));
    check('reklam.att.deny', 'iOS: canRequestAds false iken de ATT sorulur; initialize yok', at(deny, 'att') > at(deny, 'info') && !deny.c.includes('init') && !deny.on && !deny.errors.length, deny.c.join(' → '));
    check('reklam.att.ok', 'iOS: rıza → ATT → initialize sırası korunur, reklam yüklenir', at(okk, 'info') === 0 && at(okk, 'att') > 0 && at(okk, 'init') > at(okk, 'att') && at(okk, 'prepI') > at(okk, 'init') && okk.on, okk.c.join(' → '));
    check('reklam.att.android', 'Android: ATT hiç sorulmaz; rıza hatası / izin yokken initialize yok', ![...andT.c, ...andD.c].some(k => /^att/.test(k)) && !andT.c.includes('init') && !andD.c.includes('init') && !andT.errors.length && !andD.errors.length, `${andT.c.join(' → ')} | ${andD.c.join(' → ')}`);
  }

  // ---- 2) ödüllü video sonuçları: nofill → "video yok" (oyuncu suçlanmaz), closed → "sonuna kadar izlenmeli" (TR + EN) ----
  {
    const hintVideo = async (lang, c) => {
      const { ctx, page, errors } = await open(browser, URL, { cap: false, init: CAP('android', { consent: null, ...c }), locale: lang === 'en' ? 'en-US' : 'tr-TR', save: { played: 5, level: 3, stars: starsUpTo(3), remindAsked: true } });
      const direct = await G(page, () => Ads.rewarded());
      await page.click('#bPlay'); await page.waitForTimeout(500);
      if (await page.$('#mGo')) { await page.click('#mGo'); await page.waitForTimeout(300); }
      for (let k = 0; k < 12 && !(await page.$('#mAd')); k++) { await page.click('#bHint'); await page.waitForTimeout(250); }
      const sheet = !!(await page.$('#mAd'));
      if (sheet) await page.click('#mAd');
      await page.waitForTimeout(700);
      const msg = await G(page, () => document.getElementById('toast').textContent);
      if (lang === 'tr' && !c.rFill) await shot(page, 'reklam-nofill');
      await ctx.close();
      return { direct, sheet, msg, errors };
    };
    const nfT = await hintVideo('tr', { rFill: false }), nfE = await hintVideo('en', { rFill: false });
    const clT = await hintVideo('tr', { rEarn: false }), clE = await hintVideo('en', { rEarn: false });
    const okT = await hintVideo('tr', {});
    check('reklam.nofill', 'Video yokken (yüklenemedi): rewarded() → nofill; ipucu videosunda "Şu an video yok · biraz sonra dene" / "No video right now · try again soon"', nfT.direct === 'nofill' && nfT.sheet && nfT.msg === NO_FILL.tr && nfE.sheet && nfE.msg === NO_FILL.en && !nfT.errors.length && !nfE.errors.length, JSON.stringify({ nfT, nfE }));
    check('reklam.closed', 'Video erken kapatılınca: rewarded() → closed; "video sonuna kadar izlenmeli" (TR + EN)', clT.direct === 'closed' && clT.msg === NO_REWARD.tr && clE.msg === NO_REWARD.en && !clT.errors.length, JSON.stringify({ clT, clE }));
    check('reklam.earned', 'Video izlenince: rewarded() → earned, ipucu verilir', okT.direct === 'earned' && /\+2/.test(okT.msg) && !okT.errors.length, JSON.stringify(okT));
  }

  // ---- 3) + 5) TR: 4. galibiyet hat sonu (12): "▶ 2 katı" izlenirse o turda geçiş reklamı yok, sıra korunur;
  //            bağlantı 320/360 px'te taşmaz; 90 sn sonra sonraki "Sonraki"de geçiş reklamı çıkar ----
  {
    const { ctx, page, errors } = await open(browser, URL, { init: SHOP('₺59,99'), locale: 'tr-TR', vp: [360, 640], save: { played: 20, level: 9, stars: starsUpTo(9), remindAsked: true } });
    await page.click('#bPlay'); await page.waitForTimeout(500);
    let won = 0, early = false;
    for (let l = 9; l <= 12; l++) {
      if (await winLevel(page)) won++;
      if (l < 12) { early ||= !!(await page.$('#mAdFree')); await nextLevel(page); }
    }
    const w320 = await linkAt(page, 320), w360 = await linkAt(page, 360);
    await shot(page, 'reklam-baglanti-360');
    const dbl = !!(await page.$('#mDbl'));
    if (dbl) { await page.click('#mDbl'); await page.waitForTimeout(900); }
    await nextLevel(page);
    const a1 = await ads(page);
    // ödüllü videodan 91 sn sonra: 13. bölüm → Sonraki → geçiş reklamı (sıra kaybolmadı)
    await G(page, () => { const n = Date.now; Date.now = () => n() + 91e3; });
    const w13 = await winLevel(page), link13 = !!(await page.$('#mAdFree'));
    await nextLevel(page); await page.waitForTimeout(300);
    const a2 = await ads(page);
    check('reklam.sira', 'Hat sonunda "▶ 2 katı" izlenince o turda geçiş reklamı çıkmaz; sıra korunur, sonraki "Sonraki"de çıkar', won === 4 && dbl && a1.join() === 'rewarded' && w13 && a2.join() === 'rewarded,interstitial', JSON.stringify({ won, dbl, a1, w13, a2 }));
    check('reklam.baglanti', 'Sıra gelince sonuç panelinde tek "Reklamsız oyna · ₺59,99" bağlantısı; daha önce yok; 320 ve 360 px\'te taşmaz', !early && w320?.txt === 'Reklamsız oyna · ₺59,99' && w320.fits && w320.page && w360?.fits && w360.page && link13, JSON.stringify({ early, w320, w360, link13 }), 'medium');
    check('reklam.akis.errors', 'Reklam akışı senaryosunda konsol hatası yok', !errors.length, errors.join(' | '));
    await ctx.close();
  }

  // ---- 5) EN: bağlantı metni + fiyat, 320/360; dokununca mağaza, satın alınca kaybolur ve geçiş reklamı çıkmaz ----
  {
    const { ctx, page, errors } = await open(browser, URL, { init: SHOP('$4.99'), locale: 'en-US', vp: [320, 640], save: { played: 20, level: 1, remindAsked: true } });
    await page.click('#bPlay'); await page.waitForTimeout(500);
    let won = 0;
    for (let l = 1; l <= 4; l++) { if (await winLevel(page)) won++; if (l < 4) await nextLevel(page); }
    const w320 = await linkAt(page, 320), w360 = await linkAt(page, 360);
    await page.setViewportSize({ width: 320, height: 640 }); await page.waitForTimeout(300); await shot(page, 'reklam-baglanti-en-320');
    await page.click('#mAdFree').catch(() => {}); await page.waitForTimeout(450);
    const shop = await G(page, () => ({ h: document.querySelector('.sheet h2')?.textContent || '', buy: document.getElementById('mBuy')?.textContent || '' }));
    await page.click('#mBuy').catch(() => {}); await page.waitForTimeout(500);
    await page.click('#mClose').catch(() => {}); await page.waitForTimeout(400);
    const gone = !(await page.$('#mAdFree'));
    await nextLevel(page);
    const a = await ads(page);
    check('reklam.baglanti.en', 'EN: "Play ad-free · $4.99" 320/360 px\'te taşmaz; dokununca Reklamsız paket açılır; satın alınca bağlantı kalkar, geçiş reklamı çıkmaz', won === 4 && w320?.txt === 'Play ad-free · $4.99' && w320.fits && w320.page && w360?.fits && /Ad-free pack/.test(shop.h) && /4\.99/.test(shop.buy) && gone && !a.includes('interstitial') && !errors.length, JSON.stringify({ won, w320, w360, shop, gone, a, errors }), 'medium');
    await ctx.close();
  }

  // ---- 5) reklamsız paketi olan: bağlantı hiç çıkmaz, geçiş reklamı yok ----
  {
    const { ctx, page, errors } = await open(browser, URL, { init: SHOP('₺59,99'), save: { played: 20, level: 1, noAds: true, remindAsked: true } });
    await page.click('#bPlay'); await page.waitForTimeout(500);
    let won = 0, link = false;
    for (let l = 1; l <= 4; l++) { if (await winLevel(page)) won++; link ||= !!(await page.$('#mAdFree')); await nextLevel(page); }
    const a = await ads(page);
    check('reklam.baglanti.noads', 'Reklamsız pakette "Reklamsız oyna" bağlantısı ve geçiş reklamı hiç çıkmaz', won === 4 && !link && !a.includes('interstitial') && !errors.length, JSON.stringify({ won, link, a, errors }), 'medium');
    await ctx.close();
  }

  // ---- 4) yükleme yeniden denemesi: 30 → 60 → 120 sn; ön plana dönüş; 55 dk'yı geçen reklam yenilenir ----
  {
    const { ctx, page, errors } = await open(browser, URL, { cap: false, init: CAP('android', { consent: null, iFail: 3 }), save: { played: 5, level: 3, stars: starsUpTo(3), remindAsked: true } });
    await page.waitForTimeout(200);
    const runT = () => G(page, async () => { const t = window.__ad.timers.filter(x => [30e3, 60e3, 120e3].includes(x.ms)).pop(); t?.f(); await new Promise(r => setTimeout(r, 50)); });
    const delays = () => G(page, () => window.__ad.timers.map(x => x.ms).filter(ms => [30e3, 60e3, 120e3].includes(ms)));
    const d1 = await delays();
    await runT(); const d2 = await delays();
    await runT(); const d3 = await delays();
    // arka plan → ön plan: eksik reklam hemen yeniden yüklenir (4. deneme başarılı)
    const n0 = (await calls(page)).filter(k => k === 'prepI').length;
    await G(page, () => document.dispatchEvent(new Event('visibilitychange'))); await page.waitForTimeout(100);
    const n1 = (await calls(page)).filter(k => k === 'prepI').length;
    const show1 = await G(page, () => Ads.interstitial()); await page.waitForTimeout(100);
    const n1b = (await calls(page)).filter(k => k === 'prepI').length;   // gösterimden sonra yenisi yüklenir
    // 56 dk sonra: yüklü reklam bayat → gösterilmez, yenilenir; sonraki istekte gösterilir
    await G(page, () => { const n = Date.now; Date.now = () => n() + 56 * 60e3; });
    const stale = await G(page, () => Ads.interstitial()); await page.waitForTimeout(100);
    const n2 = (await calls(page)).filter(k => k === 'prepI').length;
    const show2 = await G(page, () => Ads.interstitial());
    check('reklam.warm', 'Geçiş reklamı yüklenemezse 30 / 60 / 120 sn arayla yeniden; ön plana dönüşte yeniden yüklenir; 55 dk\'yı geçen yenilenir', d1.join() === '30000' && d2.join() === '30000,60000' && d3.join() === '30000,60000,120000' && n1 === n0 + 1 && show1 && n1b === n1 + 1 && !stale && n2 === n1b + 1 && show2 && !errors.length, JSON.stringify({ d1, d2, d3, n0, n1, show1, n1b, stale, n2, show2, errors }));
    await ctx.close();
  }
};
