// Reklam katmanı. İnternet yoksa → hiçbir şey göstermez, oyun kesintisiz.
// Android/iOS: @capacitor-community/admob. Web: sessiz no-op.
// ÜRETİMDE: aşağıdaki test kimliklerini kendi AdMob kimliklerinle değiştir.
window.Ads = (() => {
  const IDS = {
    interstitial: 'ca-app-pub-3940256099942544/1033173712', // Google test ID
    rewarded: 'ca-app-pub-3940256099942544/5224354917'      // Google test ID
  };
  const plug = () => window.Capacitor?.Plugins?.AdMob;
  const online = () => navigator.onLine !== false;
  let ready = false, lastShown = 0;
  async function init() {
    const A = plug(); if (!A) return;
    try { await A.initialize({ initializeForTesting: true }); ready = true; preload(); } catch {}
  }
  async function preload() {
    const A = plug(); if (!A || !online()) return;
    try { await A.prepareInterstitial({ adId: IDS.interstitial, isTesting: true }); } catch {}
  }
  async function interstitial() {
    const A = plug();
    if (!A || !ready || !online() || Date.now() - lastShown < 90e3) return; // en az 90 sn arayla
    try { await A.showInterstitial(); lastShown = Date.now(); } catch {}
    preload();
  }
  async function rewarded() {
    const A = plug(); if (!A || !ready || !online()) return false;
    try {
      await A.prepareRewardVideoAd({ adId: IDS.rewarded, isTesting: true });
      const r = await A.showRewardVideoAd();
      return !!r;
    } catch { return false; }
  }
  addEventListener('online', preload);
  return { init, interstitial, rewarded, online: () => online() && !!plug() };
})();
