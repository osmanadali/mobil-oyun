// Reklam katmanı. İnternet ya da rıza yoksa → hiçbir şey göstermez, oyun kesintisiz.
// Android/iOS: @capacitor-community/admob (8.x API, işlev yoksa atlanır). Web: sessiz no-op.
// Gerçek kimlikler derlemede index.html'de bu dosyadan önce verilir:
//   window.RAY_ADS = { android: { interstitial, rewarded }, ios: { interstitial, rewarded } }
// Yoksa (ya da o platformunki eksikse) Google test kimlikleri ve test kipi.
// Açılış sırası: UMP rıza bilgisi → gerekiyorsa rıza formu → (iOS) izleme izni → canRequestAds ise initialize.
window.Ads = (() => {
  const TEST_IDS = {
    android: { interstitial: 'ca-app-pub-3940256099942544/1033173712', rewarded: 'ca-app-pub-3940256099942544/5224354917' },
    ios: { interstitial: 'ca-app-pub-3940256099942544/4411468910', rewarded: 'ca-app-pub-3940256099942544/1712485313' }
  };
  const OS = window.Capacitor?.getPlatform?.() === 'ios' ? 'ios' : 'android';
  const own = window.RAY_ADS?.[OS], TESTING = !(own?.interstitial && own?.rewarded);
  const IDS = TESTING ? TEST_IDS[OS] : own;
  const plug = () => window.Capacitor?.Plugins?.AdMob;
  const online = () => navigator.onLine !== false;
  let ready = false, allowed = false, privacy = false, starting = null;
  let interReady = false, rewardReady = false, busy = false, lastShown = 0;
  const ok = () => ready && allowed && online();   // rıza alınmadan, başlatılmadan reklam isteği yok
  const within = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
  // UMP yanıtı → reklam izni + ayarlardaki "Reklam gizlilik seçenekleri" görünürlüğü
  const consent = c => { privacy = c?.privacyOptionsRequirementStatus === 'REQUIRED'; return allowed = !!c?.canRequestAds; };

  async function start() {
    const A = plug(); if (!A || ready) return;
    if (A.requestConsentInfo) {
      let c = await A.requestConsentInfo();
      if (c?.isConsentFormAvailable && c.status === 'REQUIRED' && A.showConsentForm) try { c = await A.showConsentForm(); } catch {}   // form açılamazsa önceki rıza geçerli
      if (!consent(c)) return;
    } else allowed = true;   // rıza API'si olmayan eski eklenti
    // iOS izleme izni: UMP'nin IDFA mesajı zaten sorduysa durum 'notDetermined' değildir → ikinci kez sorulmaz.
    // İzin verilmezse reklamlar kişiselleştirilmeden gelir.
    if (OS === 'ios' && A.requestTrackingAuthorization) {
      try { const t = await A.trackingAuthorizationStatus?.(); if (!t || t.status === 'notDetermined') await A.requestTrackingAuthorization(); } catch {}
    }
    await A.initialize({ initializeForTesting: TESTING, maxAdContentRating: 'ParentalGuidance', tagForChildDirectedTreatment: false, tagForUnderAgeOfConsent: false });
    ready = true; preload(); preloadReward();
  }
  // tek seferde bir başlatma; hata (çoğu kez internetsiz rıza sorgusu) → bağlantı gelince yeniden
  function init() { return starting ||= start().catch(() => {}).finally(() => { starting = null; }); }
  async function preload() {
    const A = plug(); if (!A || !ok() || interReady) return;
    try { await A.prepareInterstitial({ adId: IDS.interstitial, isTesting: TESTING }); interReady = true; } catch {}
  }
  // ödüllü reklamı önceden yükle → "İzle"ye basınca hemen açılır
  async function preloadReward() {
    const A = plug(); if (!A || !ok() || rewardReady || busy) return;
    try { await A.prepareRewardVideoAd({ adId: IDS.rewarded, isTesting: TESTING }); rewardReady = true; } catch {}
  }
  // Tam ekran reklam kapanana (ya da hata / zaman aşımı) kadar bekle.
  function closed(A, okEvents, failEvents, ms) {
    return new Promise(res => {
      let done = false, timer = 0;
      const hs = [];
      const fin = v => {
        if (done) return; done = true; clearTimeout(timer);
        hs.forEach(h => Promise.resolve(h).then(x => x?.remove?.()).catch(() => {}));
        res(v);
      };
      okEvents.forEach(e => hs.push(A.addListener(e, () => fin(true))));
      failEvents.forEach(e => hs.push(A.addListener(e, () => fin(false))));
      timer = setTimeout(() => fin(false), ms);
    });
  }
  // true: reklam gösterildi ve kapandı
  async function interstitial() {
    const A = plug();
    if (!A || !ok() || Date.now() - lastShown < 90e3) return false;   // en az 90 sn arayla
    if (!interReady) { preload(); return false; }
    let shown = false;
    try {
      const wait = closed(A, ['interstitialAdDismissed'], ['interstitialAdFailedToShow'], 60e3);
      interReady = false;
      await A.showInterstitial();
      if (shown = await wait) lastShown = Date.now();
    } catch {}
    preload();
    return shown;
  }
  // true yalnızca ödül hak edildiyse (video sonuna kadar izlendi). Aynı anda tek reklam.
  async function rewarded() {
    const A = plug(); if (!A || !ok() || busy) return false;
    busy = true;
    let earned = false;
    const h = A.addListener('onRewardedVideoAdReward', () => { earned = true; });
    try {
      if (!rewardReady) await within(A.prepareRewardVideoAd({ adId: IDS.rewarded, isTesting: TESTING }), 10e3);
      rewardReady = false;
      const wait = closed(A, ['onRewardedVideoAdDismissed'], ['onRewardedVideoAdFailedToShow', 'onRewardedVideoAdFailedToLoad'], 180e3);
      A.showRewardVideoAd().then(r => { if (r) earned = true; }).catch(() => {});
      await wait;
      await new Promise(r => setTimeout(r, 300));   // ödül olayı kapanıştan hemen sonra gelebilir
    } catch {}
    Promise.resolve(h).then(x => x?.remove?.()).catch(() => {});
    busy = false;
    preloadReward();
    return earned;
  }
  // Ayarlar › Gizlilik › Reklam gizlilik seçenekleri (UMP gerekli dediyse görünür). Seçim değişince izin yenilenir.
  async function privacyForm() {
    const A = plug(); if (!A?.showPrivacyOptionsForm) return;
    try { await A.showPrivacyOptionsForm(); if (A.requestConsentInfo) consent(await A.requestConsentInfo()); } catch {}
    if (!allowed) interReady = rewardReady = false;
    else if (!ready) init();
  }
  addEventListener('online', () => { if (!ready) init(); else { preload(); preloadReward(); } });
  return { init, interstitial, rewarded, privacyForm, busy: () => busy, online: () => !!plug() && ok(), privacy: () => !!plug() && privacy };
})();
