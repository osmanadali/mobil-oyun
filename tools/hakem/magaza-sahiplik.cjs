// 💳 Mağaza sahipliği (1.2.3, 22 Kasım): iOS'ta Satın Al'a basılınca cordova-plugin-purchase 13 ödeme penceresi açıkken
// "virtual.<ürün>" kimlikli, "initiated" durumunda geçici bir işlem ekleyip receiptUpdated yayınlıyor; store.owned() buna "sahip"
// diyordu → Tema paketi ve Reklamsız ÖDEMESİZ (iptal edilse bile) açılıyordu. Bu sahte mağaza eklentinin gerçek davranışını taklit eder
// (localReceipts + pseudo receipt + iptal/ödeme/geri yükleme). Tek başına: node tools/hakem.cjs --only=magaza-sahiplik
module.exports = async T => {
  const { browser, URL, open, check, getSave } = T;
  // gerçek eklentiye benzer: store.owned() bilerek GEVŞEK (eklentideki gibi durum bakmaz); oyun bunu kullanmamalı
  const STORE = `window.CdvPurchase = (() => { const cb = { a: [], v: [], p: [], r: [] }, prods = {}, pseudo = { platform: 'as', transactions: [] }, real = { platform: 'as', transactions: [] };
    const L = window.__iap = { reg: [], fin: [] }; let n = 0;
    const fire = () => cb.r.forEach(f => f({}));
    const mk = (id, state, tid) => { const t = { transactionId: tid || 'T' + (++n), state, products: [{ id }], isPending: false, isConsumed: false,
      verify() { t.state = 'approved'; cb.v.forEach(f => f({ finish: () => t.finish() })); }, finish() { t.state = 'finished'; L.fin.push(id); fire(); } }; return t; };
    window.__pay = {
      start(id) { pseudo.transactions = pseudo.transactions.filter(t => t.transactionId !== 'virtual.' + id); pseudo.transactions.push(mk(id, 'initiated', 'virtual.' + id)); fire(); },   // ödeme penceresi açıldı
      cancel(id) { pseudo.transactions = pseudo.transactions.filter(t => t.transactionId !== 'virtual.' + id); fire(); },   // kullanıcı vazgeçti
      deferred(id) { const t = mk(id, 'pending', 'virtual.' + id); t.isPending = true; pseudo.transactions = [t]; fire(); },   // ebeveyn onayı bekliyor
      pay(id) { pseudo.transactions = pseudo.transactions.filter(t => t.transactionId !== 'virtual.' + id); const t = mk(id, 'approved'); real.transactions.push(t); fire(); cb.a.forEach(f => f(t)); },   // Apple onayladı
      restore(id) { real.transactions.push(mk(id, 'approved')); fire(); },
    };
    const when = { approved(f) { cb.a.push(f); return when; }, verified(f) { cb.v.push(f); return when; }, productUpdated(f) { cb.p.push(f); return when; }, receiptUpdated(f) { cb.r.push(f); return when; } };
    return { ProductType: { NON_CONSUMABLE: 'nc', CONSUMABLE: 'c' }, Platform: { GOOGLE_PLAY: 'gp', APPLE_APPSTORE: 'as' }, ErrorCode: { PAYMENT_CANCELLED: 6777006 },
      getPlatform: () => 'ios',
      store: { register(a) { L.reg = a; }, when: () => when, get localReceipts() { return [real, pseudo]; },
        initialize: async () => { L.reg.forEach(r => { prods[r.id] = { id: r.id, canPurchase: true, pricing: { price: '₺119,99', currency: 'TRY' }, getOffer: () => ({ order: async () => { window.__pay.start(r.id); return new Promise(() => {}); } }) }; cb.p.forEach(f => f(prods[r.id])); }); },
        get: id => prods[id],
        owned: id => [real, pseudo].some(rc => rc.transactions.some(t => t.products[0].id === id && !t.isPending && !t.isConsumed)),   // eklentideki gevşek kontrol
        restorePurchases: async () => { fire(); } } }; })();`;
  const { ctx, page, errors } = await open(browser, URL, { save: { played: 30, level: 30, remindAsked: true }, init: 'window.__ligFake = true;' + STORE });
  await page.waitForTimeout(700);
  const st = async () => { const s = await getSave(page); return { themes: !!s.allThemes, noads: !!s.noAds }; };
  const r = {};
  // 1) Satın Al'a bas (ödeme penceresi açık) → hiçbir şey açılmamalı
  await page.evaluate(() => { window.__pay.start('ray_temalar'); window.__pay.start('ray_reklamsiz'); }); await page.waitForTimeout(300); r.acik = await st();
  // 2) vazgeç → hâlâ kapalı
  await page.evaluate(() => { window.__pay.cancel('ray_temalar'); window.__pay.cancel('ray_reklamsiz'); }); await page.waitForTimeout(300); r.iptal = await st();
  // 3) ebeveyn onayı bekliyor (deferred) → kapalı
  await page.evaluate(() => window.__pay.deferred('ray_temalar')); await page.waitForTimeout(300); r.bekle = await st();
  // 4) oyundaki gerçek Satın Al düğmesi akışı (order → ödeme penceresi) → kapalı kalır
  await page.evaluate(() => { window.Shop.buy('themes'); }); await page.waitForTimeout(400); r.dugme = await st();   // ödeme penceresi açık kalır (söz bitmez): beklenmez
  // 5) Apple ödemeyi onayladı → Tema paketi açılır (Reklamsız açılmaz)
  await page.evaluate(() => window.__pay.pay('ray_temalar')); await page.waitForTimeout(400); r.odeme = await st();
  check('magaza.sahiplik', 'Tema paketi / Reklamsız yalnız ÖDEME ONAYLANINCA açılır: Satın Al’a basınca (ödeme penceresi açıkken), vazgeçince, ebeveyn onayı beklerken açılmaz (eklentinin geçici "initiated" işlemi sayılmaz)',
    !r.acik.themes && !r.acik.noads && !r.iptal.themes && !r.bekle.themes && !r.dugme.themes && r.odeme.themes && !r.odeme.noads, JSON.stringify(r), 'high');
  await ctx.close();
  // 6) geri yükleme / yeni cihaz: önceden ödenmiş paket gelir
  const o2 = await open(browser, URL, { save: { played: 30, level: 30, remindAsked: true }, init: 'window.__ligFake = true;' + STORE });
  await o2.page.waitForTimeout(700);
  await o2.page.evaluate(() => window.__pay.restore('ray_reklamsiz')); await o2.page.waitForTimeout(400);
  const g = await (async () => { const s = await getSave(o2.page); return { themes: !!s.allThemes, noads: !!s.noAds }; })();
  check('magaza.geri-yukleme', 'Geri yükleme / yeni cihaz: önceden ödenmiş Reklamsız paketi gelir (onaylı işlem), ödenmemiş Tema paketi gelmez', g.noads && !g.themes, JSON.stringify(g), 'high');
  const bad = [...errors, ...o2.errors].filter(e => !/net::|Failed to load resource/.test(e));
  check('magaza.sahiplik-konsol', 'Mağaza sahiplik testinde konsolda hata yok', !bad.length, JSON.stringify(bad.slice(0, 3)));
  await o2.ctx.close();
};
