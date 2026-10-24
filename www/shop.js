// Reklamsız paket: Google Play tek seferlik satın alma (cordova-plugin-purchase).
// Mağaza yoksa (web, Play dışından kurulan test APK'sı) sessizce devre dışı kalır; oyun etkilenmez.
// Play Console'da ürün kimliği: ray_reklamsiz (uygulama içi ürün, tüketilemez).
window.Shop = (() => {
  const ID = 'ray_reklamsiz';
  const C = () => window.CdvPurchase;
  let product = null, started = false, onOwned = () => {};
  function setup() {
    const P = C(); if (!P || started) return;
    started = true;
    const { store, ProductType, Platform } = P;
    store.register([{ id: ID, type: ProductType.NON_CONSUMABLE, platform: Platform.GOOGLE_PLAY }]);
    store.when()
      .approved(t => t.verify())
      .verified(r => r.finish())
      .productUpdated(p => { if (p.id === ID) product = p; })
      .receiptUpdated(() => { if (store.owned(ID)) onOwned(); });
    store.initialize([Platform.GOOGLE_PLAY]).then(() => { product = store.get(ID, Platform.GOOGLE_PLAY) || product; if (store.owned(ID)) onOwned(); }).catch(() => {});
  }
  function init(cb) { onOwned = cb; document.addEventListener('deviceready', setup, { once: true }); setup(); }
  // 'ok' | 'iptal' | 'hata'
  async function buy() {
    const o = product?.getOffer?.(); if (!o) return 'hata';
    try { const err = await o.order(); return !err ? 'ok' : err.code === C().ErrorCode.PAYMENT_CANCELLED ? 'iptal' : 'hata'; } catch { return 'hata'; }
  }
  async function restore() { try { await C()?.store.restorePurchases(); } catch {} }
  return { init, buy, restore, avail: () => !!C(), ready: () => !!product?.canPurchase, price: () => product?.pricing?.price || '' };
})();
