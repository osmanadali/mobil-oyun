// Reklam katmanı. İnternet yoksa → hiçbir şey göstermez, oyun kesintisiz.
// Android/iOS: @capacitor-community/admob. Web: sessiz no-op.
// ÜRETİMDE: aşağıdaki test kimliklerini kendi AdMob kimliklerinle değiştir, isTesting → false.
window.Ads = (() => {
  const IDS = {
    interstitial: 'ca-app-pub-3940256099942544/1033173712', // Google test ID
    rewarded: 'ca-app-pub-3940256099942544/5224354917'      // Google test ID
  };
  const TESTING = true;
  const plug = () => window.Capacitor?.Plugins?.AdMob;
  const online = () => navigator.onLine !== false;
  let ready = false, interReady = false, rewardReady = false, busy = false, lastShown = 0;
  const within = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

  async function init() {
    const A = plug(); if (!A) return;
    try { await A.initialize({ initializeForTesting: TESTING }); ready = true; preload(); preloadReward(); } catch {}
  }
  async function preload() {
    const A = plug(); if (!A || !ready || !online() || interReady) return;
    try { await A.prepareInterstitial({ adId: IDS.interstitial, isTesting: TESTING }); interReady = true; } catch {}
  }
  // ödüllü reklamı önceden yükle → "İzle"ye basınca hemen açılır
  async function preloadReward() {
    const A = plug(); if (!A || !ready || !online() || rewardReady || busy) return;
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
  async function interstitial() {
    const A = plug();
    if (!A || !ready || !online() || Date.now() - lastShown < 90e3) return;   // en az 90 sn arayla
    if (!interReady) { preload(); return; }
    try {
      const wait = closed(A, ['interstitialAdDismissed'], ['interstitialAdFailedToShow'], 60e3);
      interReady = false;
      await A.showInterstitial();
      if (await wait) lastShown = Date.now();
    } catch {}
    preload();
  }
  // true yalnızca ödül hak edildiyse (video sonuna kadar izlendi). Aynı anda tek reklam.
  async function rewarded() {
    const A = plug(); if (!A || !ready || !online() || busy) return false;
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
  addEventListener('online', () => { preload(); preloadReward(); });
  return { init, interstitial, rewarded, busy: () => busy, online: () => online() && !!plug() };
})();
