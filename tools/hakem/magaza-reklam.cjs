// Mağaza hazırlığı · reklam rızası (UMP + iOS ATT), gizlilik satırı, politika sayfası, veri silme — robot testleri (hakem.cjs K bölümü çağırır)
const fs = require('fs'), path = require('path');
module.exports = async T => {
  const { browser, URL, open, check, shot, getSave, solve, waitModal, starsUpTo } = T;
  const G = (page, f, a) => page.evaluate(f, a);
  const h2 = page => G(page, () => document.querySelector('.sheet h2')?.textContent || '');
  const base = { played: 5, level: 30, stars: starsUpTo(30), remindAsked: true };
  const POLICY = 'https://osmanadali.github.io/mobil-oyun/gizlilik.html#tr';
  const TEST_IOS = { interstitial: 'ca-app-pub-3940256099942544/4411468910', rewarded: 'ca-app-pub-3940256099942544/1712485313' };
  // AdMob 8.x sahtesi: rıza (UMP), ATT, Browser. Çağrılar sırayla __consent.calls'a yazılır.
  const CAP = ({ os = 'ios', c = {}, ids = null } = {}) => `${ids ? `window.RAY_ADS = ${JSON.stringify(ids)};` : ''}
  (() => {
    const C = window.__consent = Object.assign({ status: 'REQUIRED', form: true, priv: 'REQUIRED', att: 'notDetermined', calls: [] }, ${JSON.stringify(c)});
    const log = x => C.calls.push(x), L = {}, emit = e => (L[e] || []).slice().forEach(f => f({}));
    const info = () => ({ status: C.status, isConsentFormAvailable: C.form, canRequestAds: C.status === 'OBTAINED' || C.status === 'NOT_REQUIRED', privacyOptionsRequirementStatus: C.priv });
    window.Capacitor = { getPlatform: () => '${os}', isNativePlatform: () => true, Plugins: {
      Browser: { open: async o => log('browser:' + o.url) },
      AdMob: { addListener: (e, f) => { (L[e] = L[e] || []).push(f); return Promise.resolve({ remove() { L[e] = L[e].filter(x => x !== f); } }); },
        requestConsentInfo: async () => { log('info'); return info(); },
        showConsentForm: async () => { log('form'); C.status = 'OBTAINED'; return info(); },
        showPrivacyOptionsForm: async () => { log('privacy'); },
        trackingAuthorizationStatus: async () => { log('attStatus'); return { status: C.att }; },
        requestTrackingAuthorization: async () => { log('att'); C.att = 'denied'; },
        initialize: async o => { log('init'); C.initOpts = o; },
        prepareInterstitial: async o => { log('prepI'); C.prepI = o; },
        prepareRewardVideoAd: async o => { log('prepR'); C.prepR = o; },
        showInterstitial: async () => { log('showI'); setTimeout(() => emit('interstitialAdDismissed'), 50); },
        showRewardVideoAd: async () => { log('showR'); setTimeout(() => { emit('onRewardedVideoAdReward'); emit('onRewardedVideoAdDismissed'); }, 50); return { type: 'hint', amount: 1 }; } } } };
  })();`;
  const consentOf = page => G(page, () => ({ ...window.__consent, online: Ads.online(), privacy: Ads.privacy() }));

  // ---- 1) Ayarlar › Gizlilik: özet, politika (iki dil, çevrimdışı tek dosya), web'de reklam seçeneği yok, iki adımlı veri silme ----
  {
    const { ctx, page, errors } = await open(browser, URL, { vp: [360, 640], save: base });
    await page.click('#bSettings'); await page.waitForTimeout(450);
    const row = await G(page, () => { const b = document.getElementById('oPriv'); return b ? b.textContent.trim() : ''; });
    await page.click('#oPriv'); await page.waitForTimeout(450);
    const sh = await G(page, () => { const s = document.getElementById('mCard'); return { h: s.querySelector('h2')?.textContent, txt: s.textContent, pol: !!document.getElementById('mPol'), adp: !!document.getElementById('mAdP'), wipe: !!document.getElementById('mWipe'), ov: s.scrollWidth > s.clientWidth + 1 }; });
    await shot(page, 'gizlilik-ayar');
    check('gizlilik.row', 'Ayarlarda "Gizlilik" satırı → kısa özet (hesap yok, cihazda, AdMob) + politika + Verilerimi sil; web\'de reklam seçeneği gizli', /^Gizlilik/.test(row) && sh.h === 'Gizlilik' && /Hesap yok/.test(sh.txt) && /AdMob/.test(sh.txt) && sh.pol && sh.wipe && !sh.adp && !sh.ov, JSON.stringify({ row, ...sh, txt: undefined }), 'medium');
    // politika: web'de yeni sekmede yerel kopya
    const [pop] = await Promise.all([ctx.waitForEvent('page', { timeout: 6000 }).catch(() => null), page.click('#mPol')]);
    let pol = { url: '' };
    if (pop) {
      await pop.waitForLoadState('load').catch(() => {}); await pop.setViewportSize({ width: 360, height: 640 }); await pop.waitForTimeout(300);
      pol = await G(pop, () => { const t = document.body.innerText; return { url: location.pathname, tr: document.querySelector('#tr[lang=tr] h1')?.textContent, en: document.querySelector('#en[lang=en] h1')?.textContent,
        date: /28 Ekim 2026/.test(t) && /28 October 2026/.test(t), mail: (t.match(/\[iletişim e-postası\]/g) || []).length, google: !!document.querySelector('a[href="https://policies.google.com/technologies/partner-sites"]'),
        facts: ['localStorage', 'AdMob', 'IDFA', 'IP', 'Google Play', 'App Store', '13', 'Verilerimi sil', 'analitik', 'analytics'].filter(k => !t.includes(k)), ov: document.documentElement.scrollWidth > innerWidth }; });
      await pop.evaluate(() => scrollTo(0, 0)); await shot(pop, 'gizlilik-politika');
      await pop.close();
    }
    const src = fs.readFileSync(path.join(__dirname, '..', '..', 'www', 'gizlilik.html'), 'utf8'), sw = fs.readFileSync(path.join(__dirname, '..', '..', 'www', 'sw.js'), 'utf8');
    const ext = (src.match(/<(?:script|link|img|iframe)\b[^>]*(?:src|href)="(?:https?:)?\/\/[^"]*"/gi) || []).length;
    check('gizlilik.page', 'Politika sayfası açılır: Türkçe + İngilizce, yürürlük 28 Ekim 2026, AdMob/yerel veri/satın alma/13+/silme anlatılır, 360 px taşmaz', /gizlilik\.html$/.test(pol.url) && pol.tr === 'Gizlilik Politikası' && pol.en === 'Privacy Policy' && pol.date && pol.mail >= 2 && pol.google && !pol.facts?.length && !pol.ov, JSON.stringify(pol), 'medium');
    check('gizlilik.offline', 'Politika tek dosya (dış betik/stil/görsel yok) ve çevrimdışı önbellekte; kullanıcı e-postası yok, yer tutucu var', !ext && /'gizlilik\.html'/.test(sw) && !/@gmail\.com/i.test(src), `dış kaynak ${ext} · sw ${/'gizlilik\.html'/.test(sw)}`, 'medium');
    // veri silme: önce onay; Vazgeç → hiçbir şey silinmez; Evet → kayıt gider, oyun baştan açılır
    await page.click('#mWipe'); await page.waitForTimeout(400);
    const ask = await h2(page), lvl0 = (await getSave(page)).level;
    await shot(page, 'gizlilik-sil');
    await page.click('#mNo'); await page.waitForTimeout(400);
    const back = await h2(page), lvl1 = (await getSave(page)).level;
    await page.click('#mWipe'); await page.waitForTimeout(400);
    await Promise.all([page.waitForNavigation({ timeout: 8000 }).catch(() => {}), page.click('#mWipeOk')]);
    await page.waitForTimeout(600);
    const sv = await getSave(page), home = await G(page, () => document.getElementById('hLevel').textContent);
    check('gizlilik.wipe', 'Verilerimi sil iki adımlı: onay penceresi, Vazgeç korur, Evet bütün ilerlemeyi siler ve oyunu baştan açar', /silinsin/.test(ask) && lvl0 === 30 && back === 'Gizlilik' && lvl1 === 30 && (sv.level ?? 1) === 1 && !Object.keys(sv.stars || {}).length && home === '1', JSON.stringify({ ask, lvl0, back, lvl1, after: sv.level, stars: Object.keys(sv.stars || {}).length, home }), 'medium');
    check('gizlilik.errors', 'Gizlilik / veri silme senaryosunda konsol hatası yok', !errors.length, errors.join(' | '));
    await ctx.close();
  }

  // ---- 2) Web (Capacitor yok): reklam katmanı sessiz no-op ----
  {
    const { ctx, page, errors } = await open(browser, URL, { cap: false, save: base });
    const r = await G(page, async () => {
      await Ads.init(); await Ads.privacyForm();
      return { i: await Ads.interstitial(), r: await Ads.rewarded(), on: Ads.online(), p: Ads.privacy(), busy: Ads.busy() };
    });
    await page.click('#bSettings'); await page.waitForTimeout(400); await page.click('#oPriv'); await page.waitForTimeout(400);
    const adp = await G(page, () => !!document.getElementById('mAdP'));
    check('ads.web', 'Web\'de reklam katmanı sessiz: reklam yok, hata yok, gizlilik seçeneği gizli', !r.i && !r.r && !r.on && !r.p && !r.busy && !adp && !errors.length, JSON.stringify({ ...r, adp, errors }));
    await ctx.close();
  }

  // ---- 3) iOS, AB kullanıcısı: rıza bilgisi → rıza formu → ATT → initialize (PG, çocuk etiketleri kapalı, test kipi) → reklam yükleme ----
  {
    const { ctx, page, errors } = await open(browser, URL, { cap: false, init: CAP({ os: 'ios' }), save: base });
    await page.waitForTimeout(300);
    const c = await consentOf(page), at = k => c.calls.indexOf(k);
    const o = c.initOpts || {};
    check('ads.consent', 'Rıza akışı: requestConsentInfo → showConsentForm → (iOS) ATT → initialize; rızadan önce reklam isteği yok', at('info') === 0 && at('form') === 1 && at('att') > at('form') && at('init') > at('att') && at('prepI') > at('init') && at('prepR') > at('init') && c.online, c.calls.join(' → '));
    check('ads.init', 'initialize: maxAdContentRating PG, çocuk/yaş etiketleri kapalı, RAY_ADS yokken test kipi + iOS test kimlikleri', o.maxAdContentRating === 'ParentalGuidance' && o.tagForChildDirectedTreatment === false && o.tagForUnderAgeOfConsent === false && o.initializeForTesting === true && c.prepI?.adId === TEST_IOS.interstitial && c.prepR?.adId === TEST_IOS.rewarded && c.prepI?.isTesting === true, JSON.stringify({ o, i: c.prepI, r: c.prepR }));
    // gizlilik seçenekleri gerekli → ayarlarda düğme; politika uygulamada sistem tarayıcısında
    await page.click('#bSettings'); await page.waitForTimeout(400); await page.click('#oPriv'); await page.waitForTimeout(450);
    const adp = await G(page, () => !!document.getElementById('mAdP'));
    await shot(page, 'gizlilik-ayar-ios');
    await page.click('#mPol'); await page.waitForTimeout(200);
    if (adp) { await page.click('#mAdP'); await page.waitForTimeout(400); }
    const c2 = await consentOf(page);
    check('ads.privacy', 'Gizlilik seçenekleri gerekliyse ayarlarda "Reklam gizlilik seçenekleri" → UMP formu; politika sistem tarayıcısında açılır', adp && c2.calls.includes('privacy') && c2.calls.includes('browser:' + POLICY) && c2.online, c2.calls.slice(-4).join(' → '), 'medium');
    // ödüllü reklam rızayla çalışır
    const rw = await G(page, () => Ads.rewarded());
    check('ads.consent.errors', 'Rıza verilmiş iOS akışında ödüllü reklam çalışır, konsol hatası yok', rw && !errors.length, `ödül ${rw} · ${errors.join(' | ')}`);
    await ctx.close();
  }

  // ---- 4) Rıza alınamadı (form yüklenemedi): reklam isteği yok, oyun reklamsız akar; bağlantı gelince yeniden denenir ----
  {
    const { ctx, page, errors } = await open(browser, URL, { cap: false, init: CAP({ os: 'android', c: { form: false, priv: 'NOT_REQUIRED' } }), save: { ...base, level: 2, stars: starsUpTo(2), played: 1 } });
    await page.waitForTimeout(300);
    const c = await consentOf(page);
    const ad = await G(page, async () => ({ i: await Ads.interstitial(), r: await Ads.rewarded() }));
    await page.click('#bPlay'); await page.waitForTimeout(500); await solve(page, 10);
    const won = await waitModal(page) && await G(page, () => window.__ray.G.won);
    const none = !c.calls.some(k => /^(init|prep|show|att)/.test(k)) && !ad.i && !ad.r && !c.online;
    await page.click('#mNext').catch(() => {}); await page.waitForTimeout(400);
    await G(page, () => { window.__consent.status = 'OBTAINED'; dispatchEvent(new Event('online')); }); await page.waitForTimeout(300);
    const c2 = await consentOf(page);
    check('ads.noconsent', 'Rıza yokken initialize/reklam isteği yok, bölüm reklamsız biter; bağlantı gelince rıza yeniden sorulur ve reklam açılır (Android\'de ATT yok)', none && won && c2.calls.includes('init') && c2.online && !c2.calls.some(k => /^att/.test(k)) && !errors.length, JSON.stringify({ before: c.calls, after: c2.calls, ad, won, errors }));
    await ctx.close();
  }

  // ---- 5) Derleme kimlikleri (window.RAY_ADS) varsa: gerçek kimlik, test kipi kapalı; gizlilik seçeneği gerekmiyorsa düğme gizli ----
  {
    const ids = { android: { interstitial: 'ca-app-pub-1111111111111111/2222222222', rewarded: 'ca-app-pub-1111111111111111/3333333333' } };
    const { ctx, page, errors } = await open(browser, URL, { cap: false, init: CAP({ os: 'android', c: { status: 'NOT_REQUIRED', priv: 'NOT_REQUIRED' }, ids }), save: base });
    await page.waitForTimeout(300);
    const c = await consentOf(page);
    await page.click('#bSettings'); await page.waitForTimeout(400); await page.click('#oPriv'); await page.waitForTimeout(400);
    const adp = await G(page, () => !!document.getElementById('mAdP'));
    check('ads.prod', 'RAY_ADS verilince platform kimlikleri kullanılır, test kipi kapalı; rıza gerekmiyorsa form ve gizlilik düğmesi çıkmaz', c.initOpts?.initializeForTesting === false && c.prepI?.adId === ids.android.interstitial && c.prepR?.adId === ids.android.rewarded && c.prepI?.isTesting === false && !c.calls.includes('form') && !adp && !c.privacy && !errors.length, JSON.stringify({ calls: c.calls, t: c.initOpts?.initializeForTesting, i: c.prepI, adp, errors }));
    await ctx.close();
  }
};
