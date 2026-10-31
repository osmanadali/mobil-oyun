// Gelir: mağaza penceresi, tüketilebilir/tüketilemez ürünler (sahte cordova-plugin-purchase) — robot testleri (hakem.cjs K bölümü çağırır; tek başına: --only=gelir-olcum)
module.exports = async T => {
  const { browser, URL, open, check, solve, shot, getSave, waitModal, starsUpTo } = T;
  const G = (page, f, a) => page.evaluate(f, a);
  const wait = (page, ms = 450) => page.waitForTimeout(ms);
  const today = `(() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })()`;
  // sahte mağaza: v13 olay zinciri (approved → verify → verified → finish), tüketilemez sahiplik, geri yükleme, aynı işlemin yeniden gelmesi
  const STORE = (o = {}) => `window.CdvPurchase = (() => {
    const L = window.__iap = Object.assign({ reg: [], fin: [], atFin: [], ver: 0, owned: {}, orders: [], restore: 0, restorable: {}, cancel: false }, ${JSON.stringify(o)});
    const cb = { a: [], v: [], p: [], r: [] }, PR = { ray_reklamsiz: '$2.99', ray_temalar: '$3.99', ray_ipucu_10: '$0.99', ray_ipucu_30: '$1.99', ray_ipucu_80: '$3.99', ray_guclendirici: '$1.99', ray_bilet_50: '$1.99' };
    const NC = { ray_reklamsiz: 1, ray_temalar: 1 }, prods = {}; let n = 0;
    const tx = (id, txid) => { const t = { transactionId: txid || 'GPA.' + (++n), products: [{ id }],
      verify() { L.ver++; cb.v.forEach(f => f({ finish: () => t.finish() })); },
      finish() { L.fin.push(t.transactionId + ':' + id); L.atFin.push(JSON.parse(localStorage.getItem('ray') || '{}')); if (NC[id]) { L.owned[id] = true; cb.r.forEach(f => f({})); } } }; return t; };
    L.replay = (id, txid) => cb.a.forEach(f => f(tx(id, txid)));
    const when = { approved(f) { cb.a.push(f); return when; }, verified(f) { cb.v.push(f); return when; }, productUpdated(f) { cb.p.push(f); return when; }, receiptUpdated(f) { cb.r.push(f); return when; } };
    return { ProductType: { NON_CONSUMABLE: 'nc', CONSUMABLE: 'c' }, Platform: { GOOGLE_PLAY: 'gp', APPLE_APPSTORE: 'as' }, ErrorCode: { PAYMENT_CANCELLED: 6777006 },
      store: { register(a) { L.reg = a; }, when: () => when,
        initialize: async () => { L.reg.forEach(r => { prods[r.id] = { id: r.id, canPurchase: true, pricing: { price: PR[r.id], currency: 'USD' },
          getOffer: () => ({ order: async () => { if (L.cancel) return { code: 6777006 }; L.orders.push(r.id); const t = tx(r.id); setTimeout(() => cb.a.forEach(f => f(t)), 20); } }) }; cb.p.forEach(f => f(prods[r.id])); }); return []; },
        get: id => prods[id], owned: id => !!L.owned[id],
        restorePurchases: async () => { L.restore++; Object.assign(L.owned, L.restorable); cb.r.forEach(f => f({})); } } }; })();`;
  // Capacitor sahtesi: AdMob (UMP), titreşim
  const CAP = (ump = 'NOT_REQUIRED') => `window.__noCap = true;
  (() => {
    const Lst = {}, emit = e => (Lst[e] || []).slice().forEach(f => f({}));
    window.Capacitor = { getPlatform: () => 'android', isNativePlatform: () => true, Plugins: {
      Haptics: { impact() {}, notification() {} },
      AdMob: { addListener: (e, f) => { (Lst[e] = Lst[e] || []).push(f); return Promise.resolve({ remove() { Lst[e] = Lst[e].filter(x => x !== f); } }); },
        requestConsentInfo: async () => ({ status: '${ump}', isConsentFormAvailable: false, canRequestAds: true, privacyOptionsRequirementStatus: 'NOT_REQUIRED' }),
        initialize: async () => {}, prepareInterstitial: async () => {}, prepareRewardVideoAd: async () => {},
        showInterstitial: async () => { setTimeout(() => emit('interstitialAdDismissed'), 50); },
        showRewardVideoAd: async () => { setTimeout(() => { emit('onRewardedVideoAdReward'); emit('onRewardedVideoAdDismissed'); }, 50); return { type: 'hint', amount: 2 }; } },
    } };
  })();`;
  const base = { played: 5, level: 3, stars: starsUpTo(3), remindAsked: true };
  const iap = page => G(page, () => window.__iap);
  const storeRows = page => G(page, () => [...document.querySelectorAll('#store [data-p]')].map(b => ({ k: b.dataset.p, t: b.textContent.replace(/\s+/g, ' ').trim(), r: b.getBoundingClientRect().right })));
  async function openStore(page) { if (await G(page, () => document.getElementById('modal').classList.contains('open'))) { await page.click('#mClose'); await wait(page); } await page.click('#bSettings'); await wait(page); await page.click('#oShop'); await wait(page, 600); }
  async function buy(page, k, ms = 500) { await page.click(`#store [data-p=${k}]`); await wait(page, ms); }

  // ---- 1) Ayarlar › Mağaza: 7 ürün, fiyatlar, 320 px taşmaz; tüketilebilir: ödül kayda yazıldıktan sonra finish ----
  {
    const init = CAP() + STORE();
    const { ctx, page, errors } = await open(browser, URL, { vp: [320, 640], init, save: { ...base, hintDay: '' } });
    await G(page, d => { const s = JSON.parse(localStorage.getItem('ray')); s.hintDay = d; s.hints = 2; localStorage.setItem('ray', JSON.stringify(s)); }, await G(page, today));
    await page.reload(); await wait(page, 500);
    const reg = (await iap(page)).reg.map(r => `${r.id}:${r.type}`).sort().join(',');
    check('gelir.kayit', 'Yedi ürün iki mağazada aynı ray_ kimliğiyle kaydolur: 2 tüketilemez (reklamsız, tema), 5 tüketilebilir',
      reg === 'ray_bilet_50:c,ray_guclendirici:c,ray_ipucu_10:c,ray_ipucu_30:c,ray_ipucu_80:c,ray_reklamsiz:nc,ray_temalar:nc', reg, 'medium');
    const row = await G(page, () => document.querySelector('#bSettings') && 1);
    await openStore(page);
    const rows = await storeRows(page), sh = await G(page, () => { const s = document.getElementById('mCard'); return { h: s.querySelector('h2')?.textContent, ov: s.scrollWidth > s.clientWidth + 1, rs: !!document.getElementById('mRestore') }; });
    await shot(page, 'magaza-320');
    check('gelir.pencere', 'Ayarlar › Mağaza: tek pencerede 7 satır, her birinde fiyat; 320 px\'te taşma yok; geri yükleme düğmesi var',
      row && sh.h === 'Mağaza' && rows.length === 7 && rows.every(r => /\$\d/.test(r.t) && r.r <= 320) && !sh.ov && sh.rs, JSON.stringify({ sh, rows }), 'medium');
    await buy(page, 'hint30', 700);
    let v = await getSave(page), I = await iap(page);
    const fin = I.fin.find(x => x.endsWith(':ray_ipucu_30')), atFin = I.atFin[I.fin.indexOf(fin)];
    check('gelir.ipucu', '30 ipucu: ipucu +30, işlem bitirilir (consume) ve bitirme anında kayıtta ödül + işlem kimliği zaten yazılı', v.hints === 32 && fin && atFin?.hints === 32 && atFin.iapTx?.includes(fin), JSON.stringify({ hints: v.hints, fin, atFinHints: atFin?.hints, tx: atFin?.iapTx }), 'high');
    // aynı işlem yeniden gelirse (uygulama ödülle bitirme arasında kapandı) ikinci ödül yok, yine bitirilir
    await G(page, t => window.__iap.replay('ray_ipucu_30', t), fin.split(':')[0]); await wait(page, 300);
    v = await getSave(page); I = await iap(page);
    check('gelir.tekrar', 'Aynı işlem ikinci kez onaylanırsa ipucu yeniden verilmez, işlem yine bitirilir', v.hints === 32 && I.fin.filter(x => x === fin).length === 2, JSON.stringify({ hints: v.hints, fin: I.fin }), 'high');
    await openStore(page); await buy(page, 'bst', 700);
    v = await getSave(page);
    check('gelir.guclendirici', 'Güçlendirici paketi: 🔄 tur, 🔦 fener, ⏱ süre, ↶ geri her biri +3', ['tur', 'fener', 'sure', 'geri'].every(k => v.bst?.[k] === 3), JSON.stringify(v.bst), 'medium');
    // bilet paketi: bakiye +50, ayrı sayılır; sandık yalnız kazanılanla; temada önce satın alınan harcanır
    await openStore(page); await buy(page, 'crown', 700);
    v = await getSave(page);
    await page.click('#mClose').catch(() => {}); await wait(page);
    await page.click('#crownChip'); await wait(page);
    const chip = await G(page, () => ({ bal: document.querySelector('.bal')?.textContent, chest: document.getElementById('mChest').classList.contains('can') }));
    await page.click('#mChest'); await wait(page);
    const chestTxt = await G(page, () => ({ btn: document.getElementById('mOpen').textContent, tip: document.querySelector('#mCard .tip')?.textContent || '' }));
    await page.click('#mBack'); await wait(page);
    await page.click('.skin[data-k=ocean]'); await wait(page); await page.click('#mBuy'); await wait(page);
    const v2 = await getSave(page);
    check('gelir.tac', 'Bilet paketi: satın alınan 🎫 ayrı sayılır (bCrowns) ve bakiyeye eklenir; sandık açılmaz (yalnız kazanılan); tema alınca önce satın alınan harcanır',
      v.bCrowns === 50 && /50/.test(chip.bal) && !chip.chest && /Taç topla/.test(chestTxt.btn) && /kazanılan 🎫/.test(chestTxt.tip) && v2.owned.ocean && v2.bSpent === 25 && v2.spent === 25,
      JSON.stringify({ b: v.bCrowns, chip, chestTxt, bSpent: v2.bSpent, spent: v2.spent }), 'high');
    // iptal: ödül yok
    await G(page, () => { window.__iap.cancel = true; });
    await page.click('#mClose').catch(() => {}); await wait(page);
    await openStore(page); await buy(page, 'hint10', 600);
    const v3 = await getSave(page);
    check('gelir.iptal', 'Ödeme iptal edilirse ödül verilmez, işlem açılmaz', v3.hints === 32 && !(await iap(page)).orders.includes('ray_ipucu_10'), JSON.stringify({ hints: v3.hints }), 'medium');
    check('gelir.errors', 'Mağaza senaryosunda konsol hatası yok', !errors.length, errors.join(' | '));
    await ctx.close();
  }

  // ---- 2) Tema paketi (tüketilemez) + geri yükleme yalnız tüketilemezleri getirir ----
  {
    const { ctx, page, errors } = await open(browser, URL, { init: CAP() + STORE(), save: base });
    await openStore(page); await buy(page, 'themes', 700);
    const sk = await G(page, () => window.__ray.SKINS.map(k => k.id));
    const v = await getSave(page);
    await page.click('#mClose').catch(() => {}); await wait(page);
    await page.click('#crownChip'); await wait(page);
    const open1 = await G(page, () => ({ lock: [...document.querySelectorAll('.skin.lockd')].map(b => b.dataset.k) }));
    check('gelir.tema', 'Tema paketi: reklamsız pakete özel 3 tema dışındaki bütün renk temaları açılır', v.allThemes && open1.lock.sort().join() === 'diamond,gold,ruby' && sk.length > 20, JSON.stringify({ all: v.allThemes, ...open1 }), 'medium');
    await ctx.close();
    // yeni cihaz: geri yükle → tema paketi döner; tüketilebilir (ipucu) geri gelmez
    const { ctx: c2, page: p2, errors: e2 } = await open(browser, URL, { init: CAP() + STORE({ restorable: { ray_temalar: true } }), save: base });
    const h0 = (await getSave(p2)).hints;
    await openStore(p2); await p2.click('#mRestore'); await wait(p2, 800);
    const w = await getSave(p2), I = await iap(p2);
    check('gelir.geri', 'Geri yükleme: tema paketi döner, reklamsız paket (alınmadı) ve ipucu gelmez', I.restore === 1 && w.allThemes && !w.noAds && w.hints === h0, JSON.stringify({ restore: I.restore, all: w.allThemes, noAds: w.noAds, hints: [h0, w.hints] }), 'high');
    check('gelir.tema.errors', 'Tema / geri yükleme senaryosunda konsol hatası yok', !errors.length && !e2.length, [...errors, ...e2].join(' | '));
    await c2.close();
  }

  // ---- 3) Web (mağaza yok): pencere yalnız Reklamsız paketi gösterir, "mağaza sürümünde" notu; ölçüm no-op ----
  {
    const { ctx, page, errors } = await open(browser, URL, { cap: false, save: base });
    await openStore(page);
    const r = await G(page, () => ({ rows: [...document.querySelectorAll('#store [data-p]')].map(b => b.dataset.p), tip: document.querySelector('#mCard .tip')?.textContent, rs: !!document.getElementById('mRestore') }));
    check('gelir.web', 'Web\'de mağaza yok: yalnız Reklamsız paket satırı, "mağazadan indirilen sürümde" notu, geri yükleme yok',
      r.rows.join() === 'noads' && /mağazadan indirilen/.test(r.tip) && !r.rs && !errors.length, JSON.stringify({ ...r, errors }), 'medium');
    await ctx.close();
  }

  // ---- 4) EN 320 px: mağaza metinleri İngilizce, taşmıyor ----
  {
    const { ctx, page, errors } = await open(browser, URL, { vp: [320, 640], locale: 'en-US', init: CAP() + STORE(), save: base });
    await openStore(page);
    const rows = await storeRows(page), sh = await G(page, () => { const s = document.getElementById('mCard'); return { h: s.querySelector('h2')?.textContent, ov: s.scrollWidth > s.clientWidth + 1, txt: s.textContent }; });
    await shot(page, 'magaza-en-320');
    check('gelir.en', 'EN: "Shop" penceresi İngilizce (ipucu, güçlendirici, tema, bilet), 320 px\'te taşmaz', sh.h === 'Shop' && rows.length === 7 && !sh.ov && /Booster pack/.test(sh.txt) && /Theme pack/.test(sh.txt) && /50 tickets/.test(sh.txt) && !/ipucu|Tema paketi|bilet/.test(sh.txt) && rows.every(r => r.r <= 320) && !errors.length, JSON.stringify({ sh: { ...sh, txt: sh.txt.slice(0, 200) }, rows, errors }), 'medium');
    await ctx.close();
  }

  // ---- 5) ipucu bitince açılan pencerede sade "İpucu paketleri" bağlantısı ----
  {
    const { ctx, page, errors } = await open(browser, URL, { init: CAP() + STORE(), save: base });
    await G(page, d => { const s = JSON.parse(localStorage.getItem('ray')); s.hintDay = d; s.hints = 0; localStorage.setItem('ray', JSON.stringify(s)); }, await G(page, today));
    await page.reload(); await wait(page, 500);
    await page.click('#bPlay'); await wait(page, 600);
    await page.click('#bHint'); await wait(page, 500);
    const pack = await G(page, () => !!document.getElementById('mPack'));
    await page.click('#mPack'); await wait(page, 500);
    const foc = await G(page, () => [...document.querySelectorAll('#store .prod.on')].map(b => b.dataset.p));
    await shot(page, 'magaza-ipucu');
    check('gelir.ipucu.bitti', 'İpucu bitince açılan pencerede sade "İpucu paketleri" bağlantısı → Mağaza, ipucu satırları öne çıkar', pack && foc.join() === 'hint10,hint30,hint80' && !errors.length, JSON.stringify({ pack, foc, errors }), 'medium');
    await ctx.close();
  }
};
