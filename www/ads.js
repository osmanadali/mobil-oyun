// Reklam katmanı. İnternet ya da rıza yoksa → hiçbir şey göstermez, oyun kesintisiz.
// Android/iOS: @capacitor-community/admob (8.x API, işlev yoksa atlanır). Web: sessiz no-op.
// Gerçek kimlikler derlemede index.html'de bu dosyadan önce verilir:
//   window.RAY_ADS = { android: { interstitial, rewarded }, ios: { interstitial, rewarded } }
// Yoksa (ya da o platformunki eksikse) Google test kimlikleri ve test kipi.
// Açılış sırası: UMP rıza bilgisi → gerekiyorsa rıza formu → (iOS) izleme izni → canRequestAds ise initialize.
// Rıza sorgusu hata verse ya da reklam izni çıkmasa da iOS izleme izni sorulur (App Store 5.1.2).
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
  let ready = false, allowed = false, privacy = false, starting = null, npa = false;
  // tanı (Ayarlar başlığına 5 dokunuş): reklam neden çıkmıyor, telefondan okunur. Kişisel veri yok.
  const D = { os: OS, plug: !!plug(), testing: TESTING, step: 'bekliyor', tries: 0 };
  const em = e => String(e?.message || e?.errorMessage || e?.code || e || '?').slice(0, 160);
  let interReady = false, rewardReady = false, busy = false, lastShown = 0;
  let interAt = 0, rewardAt = 0, loadingI = false, loadingR = false, tries = 0, retryT = 0, asking = null;
  const ok = () => ready && allowed && online();   // rıza alınmadan, başlatılmadan reklam isteği yok
  const within = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
  // UMP yanıtı → reklam izni + ayarlardaki "Reklam gizlilik seçenekleri" görünürlüğü
  const consent = c => { privacy = c?.privacyOptionsRequirementStatus === 'REQUIRED'; window.Olcum?.consent(c); return allowed = !!c?.canRequestAds; };   // ölçüm de aynı karara uyar (olcum.js)

  async function start() {
    const A = plug(); D.plug = !!A; D.tries++; if (!A || ready) return;
    let c = null, failed = false; D.step = 'rıza';
    if (A.requestConsentInfo) {
      // Rıza sorgusu hata verebilir (internet yok, AdMob uygulaması henüz mağazaya bağlı değil) → ATT yine sorulur.
      try {
        c = await A.requestConsentInfo(); D.consent = { status: c?.status, can: c?.canRequestAds, form: c?.isConsentFormAvailable, priv: c?.privacyOptionsRequirementStatus };
        if (c?.isConsentFormAvailable && c.status === 'REQUIRED' && A.showConsentForm) try { c = await A.showConsentForm(); } catch {}   // form açılamazsa önceki rıza geçerli
      } catch (e) { failed = true; D.consentErr = em(e); }
      consent(c); if (!failed) npa = D.npa = false;
    } else allowed = true;   // rıza API'si olmayan eski eklenti
    // iOS izleme izni: rıza sonucundan bağımsız, sayfa görünürken ve durum 'notDetermined' iken bir kez.
    // UMP'nin IDFA mesajı zaten sorduysa durum 'notDetermined' değildir → ikinci kez sorulmaz. İzin yoksa reklamlar kişiselleştirilmez.
    D.step = 'izin'; await att();
    // Rıza sorgusu hata verdi (ör. AdMob uygulama ayarı henüz yayılmadı): reklamsız kalma, kişiselleştirilmemiş reklamla başla.
    // AB/EEA'da rıza dizesi olmadığı için Google kendisi sınırlı reklam sunar. Sorgu her ön plana dönüşte yeniden denenir.
    if (failed) { npa = true; allowed = true; D.npa = true; }   // init() yutar; bağlantı / ön plan dönüşünde yeniden denenir
    if (!allowed) { D.step = 'reklam izni yok'; return; }
    D.step = 'başlatılıyor';
    try { await A.initialize({ initializeForTesting: TESTING, maxAdContentRating: 'ParentalGuidance', tagForChildDirectedTreatment: false, tagForUnderAgeOfConsent: false }); } catch (e) { D.step = 'başlatma hatası'; D.initErr = em(e); throw e; }
    ready = true; D.step = 'hazır'; soft();
  }
  // iOS izleme izni (ATT): yalnız sayfa görünürken (arka planda sorulan pencere görünmeden reddedilir); aynı anda tek sorgu
  function att() {
    const A = plug(); if (OS !== 'ios' || !A?.requestTrackingAuthorization || document.hidden) return;
    return asking ||= (async () => {
      try { const t = await A.trackingAuthorizationStatus?.(); D.att = t?.status; if (!t || t.status === 'notDetermined') { await A.requestTrackingAuthorization(); D.att = (await A.trackingAuthorizationStatus?.())?.status; } } catch (e) { D.attErr = em(e); }
    })().finally(() => { asking = null; });
  }
  // kişiselleştirilmemiş kipteyken rıza sorgusu yeniden: başarılı olursa normal kipe dön (gerekirse rıza formu)
  async function recheck() {
    const A = plug(); if (!A?.requestConsentInfo) return;
    try { let c = await A.requestConsentInfo(); if (c?.isConsentFormAvailable && c.status === 'REQUIRED' && A.showConsentForm) try { c = await A.showConsentForm(); } catch {}
      D.consent = { status: c?.status, can: c?.canRequestAds }; D.consentErr = undefined; consent(c); npa = D.npa = false; if (!allowed) interReady = rewardReady = false; } catch (e) { D.consentErr = em(e); }
  }
  // tek seferde bir başlatma; hata (çoğu kez internetsiz rıza sorgusu) → bağlantı gelince yeniden
  function init() { return starting ||= start().catch(() => {}).finally(() => { starting = null; }); }
  // Yüklü reklam 55 dakikadan eskiyse yenilenir (AdMob ~1 saatte geçersiz sayar).
  const fresh = at => Date.now() - at < 55 * 60e3;
  async function preload() {
    const A = plug(); if (!A || !ok() || loadingI || (interReady && fresh(interAt))) return;
    interReady = false; loadingI = true;
    try { await A.prepareInterstitial({ adId: IDS.interstitial, isTesting: TESTING, npa }); interReady = true; interAt = Date.now(); tries = 0; D.inter = 'yüklendi ' + new Date().toLocaleTimeString(); } catch (e) { D.inter = 'hata: ' + em(e); }
    loadingI = false;
    if (!interReady) retry();
  }
  // ödüllü reklamı önceden yükle → "İzle"ye basınca hemen açılır
  async function preloadReward() {
    const A = plug(); if (!A || !ok() || busy || loadingR || (rewardReady && fresh(rewardAt))) return;
    rewardReady = false; loadingR = true;
    try { await A.prepareRewardVideoAd({ adId: IDS.rewarded, isTesting: TESTING, npa }); rewardReady = true; rewardAt = Date.now(); D.reward = 'yüklendi ' + new Date().toLocaleTimeString(); } catch (e) { D.reward = 'hata: ' + em(e); }
    loadingR = false;
  }
  // Geçiş reklamı yüklenemedi → 30, 60, sonra 120 sn arayla yeniden dene (ön plana dönüş de dener)
  function retry() { clearTimeout(retryT); retryT = setTimeout(soft, [30, 60, 120][Math.min(tries++, 2)] * 1e3); }
  // warm: eksik / bayat reklamı yükle. Oyun bunu sakin anda çağırır (sonuç paneli, ana sayfa).
  function warm() { if (!ready) return; preload(); preloadReward(); }   // başlatma (rıza) yalnız açılışta / ön plana dönüşte / bağlantı gelince
  // Android'de reklam sayfası oyunla aynı tarayıcı sürecinde çalışır: yüklenirken oyun takılır. Bu yüzden kendiliğinden
  // (açılış, ön plana dönüş, yeniden deneme) yalnız oyun sakinse yüklenir; reklam kapandıktan sonra 5 sn hiç yüklenmez
  // (yeni bölüm açılıyor). Değilse ilk sakin anı (sonuç paneli) bekler. Gösterimden hemen sonra da yüklenmez.
  let hush = 0;
  function soft() { if (Date.now() > hush && (window.__rayCalm?.() ?? true)) warm(); }
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
    if (!A || !ok() || Date.now() - lastShown < 90e3) return false;   // en az 90 sn arayla (ödüllü video da sayılır)
    if (!interReady || !fresh(interAt)) return false;   // şimdi yükleme: "Sonraki"ye basıldı, bölüm açılıyor (sonuç panelinde yüklenir)
    let shown = false;
    try {
      const wait = closed(A, ['interstitialAdDismissed'], ['interstitialAdFailedToShow'], 60e3);
      interReady = false;
      await A.showInterstitial();
      if (shown = await wait) { lastShown = Date.now(); window.Olcum?.event('ad_impression', { ad_platform: 'admob', ad_format: 'interstitial' }); }
    } catch {}
    hush = Date.now() + 5e3;   // yenisi sonraki sonuç panelinde yüklenir
    return shown;
  }
  // 'earned': ödül hak edildi (video sonuna kadar izlendi) · 'closed': video açıldı, erken kapandı · 'nofill': video yok / açılamadı.
  // Aynı anda tek reklam.
  async function rewarded() {
    const A = plug(); if (!A || !ok() || busy) return 'nofill';
    busy = true;
    let earned = false, shown = false;
    const h = A.addListener('onRewardedVideoAdReward', () => { earned = true; });
    try {
      if (!rewardReady || !fresh(rewardAt)) await within(A.prepareRewardVideoAd({ adId: IDS.rewarded, isTesting: TESTING, npa }), 10e3);
      rewardReady = false;
      const wait = closed(A, ['onRewardedVideoAdDismissed'], ['onRewardedVideoAdFailedToShow', 'onRewardedVideoAdFailedToLoad'], 180e3);
      A.showRewardVideoAd().then(r => { if (r) earned = true; }).catch(() => {});
      shown = await wait;
      await new Promise(r => setTimeout(r, 300));   // ödül olayı kapanıştan hemen sonra gelebilir
    } catch {}
    Promise.resolve(h).then(x => x?.remove?.()).catch(() => {});
    busy = false;
    if (earned || shown) lastShown = Date.now();   // videonun hemen ardından geçiş reklamı gelmesin
    if (earned || shown) window.Olcum?.event('ad_impression', { ad_platform: 'admob', ad_format: 'rewarded', earned });
    hush = Date.now() + 5e3;   // oyuna dönülüyor: yenisi sakin anda yüklenir
    return earned ? 'earned' : shown ? 'closed' : 'nofill';
  }
  // Ayarlar › Gizlilik › Reklam gizlilik seçenekleri (UMP gerekli dediyse görünür). Seçim değişince izin yenilenir.
  async function privacyForm() {
    const A = plug(); if (!A?.showPrivacyOptionsForm) return;
    try { await A.showPrivacyOptionsForm(); if (A.requestConsentInfo) consent(await A.requestConsentInfo()); } catch {}
    if (!allowed) interReady = rewardReady = false;
    else if (!ready) init();
  }
  addEventListener('online', () => ready ? soft() : init());
  // ön plana dönüş: açılışta arka plandaysak ATT şimdi sorulur; eksik / bayat reklam yeniden yüklenir
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { if (ready) att(); if (ready && npa) recheck(); ready ? soft() : init(); } });
  const diag = () => ({ ...D, ready, allowed, online: online(), interReady, rewardReady, unit: (IDS.interstitial || '').slice(-10) });
  return { diag, init, warm, interstitial, rewarded, privacyForm, busy: () => busy, online: () => !!plug() && ok(), privacy: () => !!plug() && privacy };
})();
