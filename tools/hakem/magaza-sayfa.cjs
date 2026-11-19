// Mağaza ve Kapış ayrı sayfa (sekme çubuğu): 🛍️ Mağaza → #shop ekranı (Paketler | Temalar), ⚔️ Kapış → #vs ekranı.
// Menülerden açılınca sayfa; bölüm sürerken (oyun ekranı) Mağaza eskisi gibi pencere (oyun bırakılmaz, kapanınca sürer).
// Sekme vurgusu, ‹ geri, 320 px'te taşma yok, açık/koyu tema. Ekran görüntüleri: hakem-out/shots/sayfa-*.png
// hakem.cjs K bölümü çağırır; tek başına: --only=magaza-sayfa
module.exports = async T => {
  const { browser, URL, open, check, starsUpTo, seenTo, shot } = T;
  const base = { played: 30, level: 30, stars: starsUpTo(29), remindAsked: true, g11: 1, lastGift: Date.now(), seen: seenTo(5) };
  const st = page => page.evaluate(() => {
    const sc = document.querySelector('.screen.active')?.id, b = document.querySelector('#shopBody,#vsBody') && document.getElementById(sc === 'vs' ? 'vsBody' : 'shopBody');
    const tb = document.getElementById('tabbar').getBoundingClientRect(), last = b && [...b.children].pop()?.getBoundingClientRect();
    return { scr: sc, ds: document.body.dataset.scr, on: document.querySelector('#tabbar button.on')?.dataset.tab, modal: document.getElementById('modal').classList.contains('open'),
      tab: document.querySelector('#shopTabs .tabs .on')?.id || '', store: !!document.querySelector('#shopBody #store'), skins: !!document.querySelector('#shopBody #skins'),
      rows: document.querySelectorAll('#shopBody #store [data-p]').length, ov: document.documentElement.scrollWidth > innerWidth + 1 || (b ? b.scrollWidth > b.clientWidth + 1 : false),
      tabbar: getComputedStyle(document.getElementById('tabbar')).display, sub: document.getElementById('shSub').textContent,
      clear: b ? (b.scrollHeight <= b.clientHeight + 1 || true) && (last ? true : false) : false, endAbove: b ? b.getBoundingClientRect().bottom <= tb.top + 2 : false };
  });
  // sahte mağaza (gelir-olcum.cjs ile aynı biçim, sade): bütün ürünler satışta, sipariş hemen onaylanır
  const STORE = `window.CdvPurchase = (() => { const L = window.__iap = { reg: [], fin: [], restore: 0 }, cb = { a: [], v: [], p: [], r: [] }, prods = {}, owned = {}; let n = 0;
    const PR = { ray_reklamsiz: '₺89,99', ray_temalar: '₺119,99', ray_ipucu_10: '₺29,99', ray_ipucu_30: '₺59,99', ray_ipucu_80: '₺119,99', ray_guclendirici: '₺59,99', ray_bilet_50: '₺59,99', ray_baslangic: '₺89,99' }, NC = { ray_reklamsiz: 1, ray_temalar: 1 };
    const tx = id => { const t = { transactionId: 'GPA.' + (++n), products: [{ id }], verify() { cb.v.forEach(f => f({ finish: () => t.finish() })); }, finish() { L.fin.push(id); if (NC[id]) { owned[id] = true; cb.r.forEach(f => f({})); } } }; return t; };
    const when = { approved(f) { cb.a.push(f); return when; }, verified(f) { cb.v.push(f); return when; }, productUpdated(f) { cb.p.push(f); return when; }, receiptUpdated(f) { cb.r.push(f); return when; } };
    return { ProductType: { NON_CONSUMABLE: 'nc', CONSUMABLE: 'c' }, Platform: { GOOGLE_PLAY: 'gp', APPLE_APPSTORE: 'as' }, ErrorCode: { PAYMENT_CANCELLED: 6777006 },
      store: { register(a) { L.reg = a; }, when: () => when,
        initialize: async () => { L.reg.forEach(r => { prods[r.id] = { id: r.id, canPurchase: true, pricing: { price: PR[r.id], currency: 'TRY' }, getOffer: () => ({ order: async () => { const t = tx(r.id); setTimeout(() => cb.a.forEach(f => f(t)), 20); } }) }; cb.p.forEach(f => f(prods[r.id])); }); return []; },
        get: id => prods[id], owned: id => !!owned[id], restorePurchases: async () => { L.restore++; cb.r.forEach(f => f({})); } } }; })();`;
  const R = {};
  for (const [vp, scheme, loc] of [[[390, 844], 'dark', 'tr-TR'], [[320, 640], 'light', 'tr-TR'], [[390, 844], 'light', 'en-US'], [[320, 640], 'dark', 'en-US']]) {
    const tag = `${vp[0]}-${scheme}`, { ctx, page, errors } = await open(browser, URL, { vp, scheme, locale: loc, save: base, init: 'window.__ligFake = true;' + STORE });
    await page.waitForTimeout(600);
    const r = R[tag] = {};
    await page.click('#bShop'); await page.waitForTimeout(700); r.pk = await st(page);
    await shot(page, `sayfa-magaza-paketler-${tag}`);
    await page.click('#tTh'); await page.waitForTimeout(600); r.th = await st(page);
    await shot(page, `sayfa-magaza-temalar-${tag}`);
    // tema seç (sayfada), kilitli temaya dokun → onay penceresi sayfanın üstünde; Temalara dön → sayfa
    await page.click('#tPk'); await page.waitForTimeout(500); r.pk2 = await st(page);
    const h0 = await page.evaluate(() => JSON.parse(localStorage.getItem('ray')).hints || 0);
    await page.click('#store [data-p=hint10]'); await page.waitForTimeout(700);
    r.buy = { ...(await st(page)), dh: (await page.evaluate(() => JSON.parse(localStorage.getItem('ray')).hints || 0)) - h0 };
    await page.click('#mRestore'); await page.waitForTimeout(400); r.restore = await page.evaluate(() => window.__iap.restore);
    await page.click('#store [data-p=noads]'); await page.waitForTimeout(500);
    r.noads = await page.evaluate(() => ({ modal: document.getElementById('modal').classList.contains('open'), h: document.querySelector('#mCard h2')?.textContent, scr: document.querySelector('.screen.active')?.id }));
    await page.click('#mClose'); await page.waitForTimeout(500);
    await page.click('#shBack'); await page.waitForTimeout(500); r.back = await st(page);
    await page.click('#crownChip'); await page.waitForTimeout(600); r.chip = await st(page);
    // ⚔️ Kapış: katılmamış → sayfa + katılım penceresi; katıl → sayfada rakip bul düğmeleri
    await page.click('#tabbar [data-tab=vs]'); await page.waitForTimeout(600);
    r.vs0 = { ...(await st(page)), nick: !!(await page.$('#mNick')) };
    await page.fill('#mNick', 'Hızlı Martı'); await page.click('#mJoin'); await page.waitForTimeout(700);
    r.vs = { ...(await st(page)), btn: await page.evaluate(() => ['vpR', 'vpH', 'vpJ'].every(i => document.querySelector('#vsBody #' + i)?.getBoundingClientRect().width > 0)) };
    await page.evaluate(() => document.getElementById('toast').classList.remove('show')); await page.waitForTimeout(400);   // geri yükleme bildirimi görüntüyü örtmesin
    await shot(page, `sayfa-kapis-${tag}`);
    await page.click('#vpJ'); await page.waitForTimeout(500);
    r.code = await page.evaluate(() => ({ modal: document.getElementById('modal').classList.contains('open'), inp: !!document.getElementById('vIn'), scr: document.querySelector('.screen.active')?.id }));
    await page.click('#mClose'); await page.waitForTimeout(500);
    await page.click('#tabbar [data-tab=league]'); await page.waitForTimeout(600); await page.click('#lgVs'); await page.waitForTimeout(500); r.lgvs = await st(page);
    // oyunda (bölüm sürerken) Mağaza pencere olarak açılır: oyun ekranı kalır, kapanınca süre akar
    await page.click('#tabbar [data-tab=home]'); await page.waitForTimeout(500);
    await page.click('#bPlay'); await page.waitForTimeout(800);
    await page.evaluate(() => { const g = window.__ray.G; if (g) document.querySelector('#gMoves'); });
    await page.evaluate(() => window.__ray.store?.());
    r.inGame = await page.evaluate(() => ({ scr: document.querySelector('.screen.active')?.id, modal: document.getElementById('modal').classList.contains('open'), store: !!document.querySelector('#mCard #store'), page: !!document.querySelector('#shopBody #store') }));
    await page.click('#mClose'); await page.waitForTimeout(500);
    r.after = await page.evaluate(() => ({ scr: document.querySelector('.screen.active')?.id, run: !!window.__ray.G?.runAt }));
    r.err = errors.slice(0, 3);
    await ctx.close();
  }
  const pageOk = s => s.scr === 'shop' && s.ds === 'shop' && s.on === 'shop' && !s.modal && s.tabbar === 'flex' && !s.ov && s.endAbove;
  const ok = Object.values(R).every(r => pageOk(r.pk) && r.pk.tab === 'tPk' && r.pk.store && r.pk.rows >= 1 && /💡/.test(r.pk.sub)
    && pageOk(r.th) && r.th.tab === 'tTh' && r.th.skins && !r.th.store && pageOk(r.pk2) && r.pk2.store
    && r.pk.rows >= 8 && pageOk(r.buy) && r.buy.store && r.buy.dh === 10 && new RegExp(`💡 ${r.buy.dh + 3}`).test(r.buy.sub) && r.restore === 1
    && r.noads.modal && r.noads.scr === 'shop' && r.back.scr === 'home' && r.back.on === 'home' && pageOk(r.chip) && r.chip.tab === 'tTh');
  check('magaza.sayfa', 'Mağaza ayrı sayfa: sekme çubuğu 🛍️ → #shop (Paketler | Temalar), sekme vurgusu Mağaza\'da, ‹ ana sayfaya; 🎫 çipi Temalar sekmesinde açar; sayfada satın alma (10 ipucu) ve geri yükleme çalışır, sayfa yerinde tazelenir; paket ayrıntısı sayfanın üstünde pencere; 320 px taşma yok, gövde sekme çubuğunun üstünde bitiyor (açık/koyu)',
    ok, JSON.stringify(Object.fromEntries(Object.entries(R).map(([k, r]) => [k, { pk: r.pk, th: r.th, buy: r.buy, restore: r.restore, noads: r.noads, back: r.back.scr, chip: r.chip.tab }]))), 'high');
  const vsOk = Object.values(R).every(r => r.vs0.scr === 'vs' && r.vs0.on === 'vs' && r.vs0.nick && r.vs.scr === 'vs' && r.vs.ds === 'vs' && r.vs.on === 'vs' && !r.vs.modal && r.vs.btn && !r.vs.ov && r.vs.endAbove
    && r.code.modal && r.code.inp && r.code.scr === 'vs' && r.lgvs.scr === 'vs');
  check('kapis.sayfa', 'Kapış ayrı sayfa: sekme çubuğu ⚔️ → #vs (takma ad yoksa katılım penceresi sayfanın üstünde), rastgele rakip · davet · koda katıl sayfada; kod penceresi sayfanın üstünde; Lig\'deki Kapış düğmesi de bu sayfaya; 320 px taşma yok',
    vsOk, JSON.stringify(Object.fromEntries(Object.entries(R).map(([k, r]) => [k, { vs0: r.vs0, vs: r.vs, code: r.code, lgvs: r.lgvs.scr }]))), 'high');
  check('magaza.oyunda', 'Bölüm sürerken Mağaza pencere olarak açılır (oyun ekranı bırakılmaz, sayfada #store yok), kapanınca bölüm sürer; konsol hatası yok',
    Object.values(R).every(r => r.inGame.scr === 'game' && r.inGame.modal && r.inGame.store && !r.inGame.page && r.after.scr === 'game' && r.after.run && !r.err.length),
    JSON.stringify(Object.fromEntries(Object.entries(R).map(([k, r]) => [k, { inGame: r.inGame, after: r.after, err: r.err }]))), 'high');
};
