// Reklamsız paket: tek seferlik satın alma (cordova-plugin-purchase). Android: Google Play, iOS: App Store.
// Mağaza yoksa (web, mağaza dışından kurulan test APK'sı) sessizce devre dışı kalır; oyun etkilenmez.
// Ürün kimliği iki mağazada da aynı: ray_reklamsiz (Play: uygulama içi ürün; App Store Connect: Non-Consumable / tüketilemez).
window.Shop = (() => {
  const ID = 'ray_reklamsiz';
  const C = () => window.CdvPurchase;
  const ios = () => window.Capacitor?.getPlatform?.() === 'ios';
  let product = null, started = false, plat = null, onOwned = () => {};
  function setup() {
    const P = C(); if (!P || started) return;
    started = true;
    const { store, ProductType, Platform } = P;
    plat = ios() ? Platform.APPLE_APPSTORE : Platform.GOOGLE_PLAY;
    store.register([{ id: ID, type: ProductType.NON_CONSUMABLE, platform: plat }]);
    store.when()
      .approved(t => t.verify())
      .verified(r => r.finish())
      .productUpdated(p => { if (p.id === ID) product = p; })
      .receiptUpdated(() => { if (store.owned(ID)) onOwned(); });
    store.initialize([plat]).then(() => { product = store.get(ID, plat) || product; if (store.owned(ID)) onOwned(); }).catch(() => {});
  }
  function init(cb) { onOwned = cb; document.addEventListener('deviceready', setup, { once: true }); setup(); }
  // 'ok' | 'iptal' | 'hata'
  async function buy() {
    const o = product?.getOffer?.(); if (!o) return 'hata';
    try { const err = await o.order(); return !err ? 'ok' : err.code === C().ErrorCode.PAYMENT_CANCELLED ? 'iptal' : 'hata'; } catch { return 'hata'; }
  }
  // Geri yükleme (iki mağazada da): Play satın alımları yeniden sorgular, App Store tamamlanmış işlemleri geri getirir → receiptUpdated → onOwned
  async function restore() { try { const S = C()?.store; if (!S) return; await S.restorePurchases(); if (S.owned(ID)) onOwned(); } catch {} }
  return { init, buy, restore, avail: () => !!C(), ready: () => !!product?.canPurchase, price: () => product?.pricing?.price || '',
    name: () => ios() ? 'App Store' : 'Google Play' };
})();
