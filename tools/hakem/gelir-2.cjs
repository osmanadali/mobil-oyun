// Gelir 2: özel teklif penceresi (sıklık kuralları, Başlangıç paketi) ve Firebase Analytics olayları + rıza
// (sahte cordova-plugin-purchase, sahte @capacitor-firebase/analytics + AdMob UMP) — hakem.cjs K bölümü çağırır; tek başına: --only=gelir-2
// Bölüm numaraları oyundan okunur (window.__ray.offer.MIN): eşik değişirse testler kendiliğinden uyar.
module.exports = async T => {
  const { browser, URL, open, check, solve, shot, getSave, waitModal, starsUpTo } = T;
  const G = (page, f, a) => page.evaluate(f, a);
  const wait = (page, ms = 450) => page.waitForTimeout(ms);
  const today = `(() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })()`;
  // sahte mağaza: v13 olay zinciri (approved → verify → verified → finish), tüketilemez sahiplik, geri yükleme, aynı işlemin yeniden gelmesi
  const STORE = (o = {}) => `window.CdvPurchase = (() => {
    const L = window.__iap = Object.assign({ reg: [], fin: [], atFin: [], ver: 0, owned: {}, orders: [], restore: 0, restorable: {}, cancel: false }, ${JSON.stringify(o)});
    const cb = { a: [], v: [], p: [], r: [] }, PR = { ray_reklamsiz: '$2.99', ray_temalar: '$3.99', ray_ipucu_10: '$0.99', ray_ipucu_30: '$1.99', ray_ipucu_80: '$3.99', ray_guclendirici: '$1.99', ray_bilet_50: '$1.99', ray_baslangic: '$2.99' };
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
  // Capacitor sahtesi: AdMob (UMP durumu verilir), Firebase Analytics (çağrılar __fa'ya)
  const CAP = (ump = 'NOT_REQUIRED', fa = true) => `window.__noCap = true;
  (() => {
    const F = window.__fa = { ev: [], en: [], consent: [], reset: 0 }, Lst = {}, emit = e => (Lst[e] || []).slice().forEach(f => f({}));
    window.Capacitor = { getPlatform: () => 'android', isNativePlatform: () => true, Plugins: {
      Haptics: { impact() {}, notification() {} },
      AdMob: { addListener: (e, f) => { (Lst[e] = Lst[e] || []).push(f); return Promise.resolve({ remove() { Lst[e] = Lst[e].filter(x => x !== f); } }); },
        requestConsentInfo: async () => ({ status: '${ump}', isConsentFormAvailable: false, canRequestAds: true, privacyOptionsRequirementStatus: 'NOT_REQUIRED' }),
        initialize: async () => {}, prepareInterstitial: async () => {}, prepareRewardVideoAd: async () => {},
        showInterstitial: async () => { setTimeout(() => emit('interstitialAdDismissed'), 50); },
        showRewardVideoAd: async () => { setTimeout(() => { emit('onRewardedVideoAdReward'); emit('onRewardedVideoAdDismissed'); }, 50); return { type: 'hint', amount: 2 }; } },
      ${fa ? `FirebaseAnalytics: { logEvent: async o => { F.ev.push(o); }, setEnabled: async o => { F.en.push(o.enabled); }, setConsent: async o => { F.consent.push(o.type + '=' + o.status); }, resetAnalyticsData: async () => { F.reset++; sessionStorage.setItem('faReset', F.en.join()); } },` : ''}
    } };
  })();`;
  const base = { played: 5, level: 3, stars: starsUpTo(3), remindAsked: true };
  const iap = page => G(page, () => window.__iap);
  const fa = page => G(page, () => window.__fa);
  const evs = (F, n) => F.ev.filter(e => e.name === n).map(e => e.params);
  async function buy(page, k, ms = 500) { await page.click(`#store [data-p=${k}]`); await wait(page, ms); }
  async function openStore(page) { if (await G(page, () => document.getElementById('modal').classList.contains('open'))) { await page.click('#mClose'); await wait(page); } await page.click('#bSettings'); await wait(page); await page.click('#oShop'); await wait(page, 600); }
  // teklif eşiğini oyundan oku (boş sayfada)
  let MIN, AGE, GAP;
  { const { ctx, page } = await open(browser, URL, { cap: false }); ({ MIN, AGE, GAP } = await G(page, () => window.__ray.offer)); await ctx.close(); }
  const H = 36e5, now = Date.now(), lv = MIN + 2;
  // teklife uygun oyuncu: eşiğin ötesinde, 3 gündür oynuyor, son teklif 49 saat önce; puan isteği yakın zamanda yapılmış (çakışmasın)
  const ripe = (o = {}) => ({ played: MIN + 5, level: lv, stars: starsUpTo(lv), remindAsked: true, born: now - AGE - 24 * H, offerAt: now - GAP - H, rv: { at: now, lvl: lv }, ...o });
  // bölümü kazan, teklif zamanını bekle; pencere durumu
  async function winAndLook(page, mode = 'bPlay') {
    await page.click('#' + mode); await wait(page, 600);
    await solve(page, 10); await waitModal(page); await wait(page, 2300);
    return G(page, () => { const m = document.getElementById('modal').classList.contains('open'), c = document.getElementById('mCard');
      return { open: m, h: m ? c.querySelector('h2')?.textContent : '', buy: !!document.getElementById('mOfBuy'), close: !!document.getElementById('mClose'), txt: m ? c.textContent : '', html: m ? c.innerHTML : '' }; });
  }

  // ---- 1) Uygun oyuncu: kazanma sonrası Özel teklif → Başlangıç paketi, gerçek fiyat, belirgin Kapat; sahte indirim / geri sayım yok; satın al ----
  {
    const { ctx, page, errors } = await open(browser, URL, { vp: [360, 640], init: CAP() + STORE(), save: ripe() });
    const o = await winAndLook(page);
    await shot(page, 'teklif-360');
    const fit = await G(page, () => { const c = document.getElementById('mCard'), b = document.getElementById('mClose').getBoundingClientRect(); return { ov: c.scrollWidth > c.clientWidth + 1, cl: b.height >= 40 && b.width >= 200 && b.bottom <= innerHeight }; });
    const s0 = await getSave(page);
    check('teklif.goster', `Kazanma sonrası (bölüm > ${MIN}, 2 günden eski, 48 sa geçmiş) "Özel teklif": Başlangıç paketi, gerçek fiyat ($2.99), içerik listesi (💡 🧰 ❤️∞ 🎫), belirgin "Hayır, teşekkürler"; 360 px taşmaz`,
      o.open && o.h === 'Özel teklif' && /Başlangıç paketi/.test(o.txt) && /\$2\.99/.test(o.txt) && /ipucu/.test(o.txt) && /sınırsız can/.test(o.txt) && /bilet/.test(o.txt) && o.close && /Hayır, teşekkürler/.test(o.txt) && fit.cl && !fit.ov && s0.offerAt > now && s0.offerN === 1,
      JSON.stringify({ ...o, html: undefined, txt: o.txt.slice(0, 160), fit, offerAt: s0.offerAt > now }), 'high');
    check('teklif.durust', 'Teklifte üstü çizili fiyat, yüzde indirim, geri sayım ya da "son şans" yok; ürünün mağazada her zaman olduğu yazılı',
      !/<s>|<del|<strike|line-through|%|\d:\d\d|son şans|kaçırma/i.test(o.html) && /her zaman/.test(o.txt), o.html.slice(0, 300), 'high');
    const h0 = s0.hints, c0 = s0.bCrowns || 0;
    await page.click('#mOfBuy'); await wait(page, 700);
    const s = await getSave(page), F = await fa(page), I = await iap(page);
    const shown = evs(F, 'offer_shown')[0], bought = evs(F, 'offer_buy')[0], pur = evs(F, 'purchase')[0];
    check('teklif.al', 'Başlangıç paketi (ray_baslangic): +10 💡, her güçlendiriciden +2, ❤️∞ 1 saat (infUntil), +20 🎫 satın alınan bilet; işlem bitirilir; pencere kapanır',
      s.hints === h0 + 10 && ['tur', 'fener', 'sure', 'geri'].every(k => s.bst?.[k] === 2) && s.infUntil >= Date.now() + 55 * 60e3 && s.infUntil <= Date.now() + 61 * 60e3 && s.bCrowns === c0 + 20 && I.fin.some(x => x.endsWith(':ray_baslangic'))
      && !(await G(page, () => document.getElementById('modal').classList.contains('open'))),
      JSON.stringify({ h: [h0, s.hints], bst: s.bst, inf: s.infUntil - Date.now(), b: s.bCrowns, fin: I.fin }), 'high');
    check('teklif.olay', 'offer_shown (ürün, bölüm) → offer_buy (ürün) + purchase (ray_baslangic, tüketilebilir)',
      shown?.item_id === 'ray_baslangic' && shown.level === lv && bought?.item_id === 'ray_baslangic' && pur?.item_id === 'ray_baslangic' && pur.kind === 'consumable', JSON.stringify({ shown, bought, pur }), 'high');
    // aynı oturumda bir sonraki galibiyette yeni teklif yok (48 saat)
    await page.click('#mNext'); await wait(page, 600);
    await solve(page, 10); await waitModal(page); await wait(page, 2300);
    const again = await G(page, () => document.getElementById('modal').classList.contains('open'));
    check('teklif.48', 'Teklif gösterildikten sonra 48 saat içinde yeni teklif yok (bir sonraki galibiyet sessiz)', !again && evs(await fa(page), 'offer_shown').length === 1, String(again), 'high');
    check('teklif.errors', 'Teklif senaryosunda konsol hatası yok', !errors.length, errors.join(' | '));
    await ctx.close();
  }

  // ---- 2) Gösterilmeyen durumlar: yeni oyuncu (ilk 2 gün), eşikteki bölüm, 48 saat dolmadı, Günün Hattı, geçiş reklamı turu ----
  {
    const cases = [
      ['teklif.yeni', 'İlk 2 günde teklif yok (kayıt 1 gün önce açılmış)', ripe({ born: now - AGE + 24 * H })],
      ['teklif.esik', `İlk ${MIN} bölümde teklif yok (eşikteki bölüm kazanılınca)`, ripe({ level: MIN, stars: starsUpTo(MIN), played: MIN + 5 })],
      ['teklif.sure', '48 saat dolmadan teklif yok (son teklif 47 saat önce)', ripe({ offerAt: now - GAP + H })],
    ];
    for (const [id, d, sv] of cases) {
      const { ctx, page, errors } = await open(browser, URL, { init: CAP() + STORE(), save: sv });
      const o = await winAndLook(page);
      check(id, d, !o.open && !evs(await fa(page), 'offer_shown').length && !errors.length, JSON.stringify({ open: o.open, h: o.h, errors }), 'high');
      await ctx.close();
    }
    // Günün Hattı
    {
      const { ctx, page, errors } = await open(browser, URL, { init: CAP() + STORE(), save: ripe() });
      const o = await winAndLook(page, 'bDaily');
      check('teklif.gunluk', 'Günün Hattı kazanılınca teklif yok', !(o.open && o.h === 'Özel teklif') && !errors.length, JSON.stringify({ open: o.open, h: o.h, errors }), 'high');
      await ctx.close();
    }
    // geçiş reklamı sırası bu turda → teklif yok; Sonraki'de geçiş reklamı gösterilir
    {
      const { ctx, page, errors } = await open(browser, URL, { init: CAP() + STORE(), save: ripe() });
      await page.click('#bPlay'); await wait(page, 600);
      await G(page, () => window.__ray.offer.inter(true));
      await solve(page, 10); await waitModal(page); await wait(page, 2300);
      const o = await G(page, () => document.getElementById('modal').classList.contains('open'));
      await page.click('#mNext'); await wait(page, 900);
      const ad = evs(await fa(page), 'ad_impression').filter(p => p.ad_format === 'interstitial').length;
      check('teklif.reklam', 'Geçiş reklamı sırası gelen turda teklif yok (aynı turda ikisi birden çıkmaz); Sonraki\'de geçiş reklamı gösterilir', !o && ad === 1 && (await getSave(page)).offerAt < now && !errors.length, JSON.stringify({ o, ad, errors }), 'high');
      await ctx.close();
    }
    // reklamsız sahibi: sıra reklamsız pakete gelse de o ürün gösterilmez
    {
      const { ctx, page, errors } = await open(browser, URL, { init: CAP() + STORE(), save: ripe({ noAds: true, offerN: 1 }) });
      const o = await winAndLook(page);
      const shown = evs(await fa(page), 'offer_shown')[0];
      check('teklif.reklamsiz', 'Reklamsız paket sahibine reklamsız teklifi gösterilmez (sıradaki gerçek ürün gelir); teklifte geçiş reklamı bağlantısı yok', o.open && shown && shown.item_id !== 'ray_reklamsiz' && !/Reklamsız paket/.test(o.txt) && !errors.length, JSON.stringify({ shown, txt: o.txt.slice(0, 120), errors }), 'high');
      await ctx.close();
    }
    // mağaza yok (web): teklif yok, süre işlemez
    {
      const { ctx, page, errors } = await open(browser, URL, { cap: false, save: ripe() });
      const o = await winAndLook(page);
      const s = await getSave(page);
      check('teklif.web', 'Web\'de (mağaza yok) teklif açılmaz, son teklif zamanı değişmez', !o.open && s.offerAt < now && !errors.length, JSON.stringify({ open: o.open, errors }), 'medium');
      await ctx.close();
    }
  }

  // ---- 3) Mağazada Başlangıç paketi satırı (TR/EN), Olcum arayüzü ----
  {
    const { ctx, page, errors } = await open(browser, URL, { vp: [320, 640], locale: 'en-US', init: CAP() + STORE(), save: base });
    await openStore(page);
    const r = await G(page, () => { const b = document.querySelector('#store [data-p=starter]'); return { t: b?.textContent.replace(/\s+/g, ' ').trim(), r: b?.getBoundingClientRect().right, api: typeof window.Olcum?.event }; });
    check('teklif.magaza', 'Mağazada "Starter pack" satırı (içerik ve fiyat), 320 px taşmaz; window.Olcum.event arayüzü var', /Starter pack/.test(r.t) && /\$2\.99/.test(r.t) && r.r <= 320 && r.api === 'function' && !errors.length, JSON.stringify({ ...r, errors }), 'medium');
    await ctx.close();
  }

  // ---- 6) Ölçüm: rıza gerekmiyor → açık; olaylar ve parametreleri ----
  {
    const { ctx, page, errors } = await open(browser, URL, { init: CAP('NOT_REQUIRED') + STORE(), save: base });
    await wait(page, 400);
    await page.click('#bPlay'); await wait(page, 600);
    await solve(page, 10); await waitModal(page);
    await page.click('#mNext'); await wait(page, 600);
    await page.click('#bHint'); await wait(page, 300);
    await page.click('#bBack'); await wait(page, 500);   // yarım bırak
    await page.click('#bSettings'); await wait(page); await page.click('#oHow'); await wait(page, 500);
    for (let k = 0; k < 8 && await G(page, () => document.getElementById('modal').classList.contains('open')); k++) { await page.click('#mClose', { timeout: 3000 }).catch(() => {}); await wait(page, 350); }
    await openStore(page); await buy(page, 'hint10', 700);
    const F = await G(page, () => window.__fa), ev = n => F.ev.filter(e => e.name === n).map(e => e.params);
    const end = ev('level_end')[0], st = ev('level_start'), quit = ev('level_quit')[0], tut = ev('tutorial'), pur = ev('purchase')[0];
    const allP = F.ev.flatMap(e => Object.entries(e.params)), bad = allP.filter(([k, v]) => !(typeof v === 'number' || (typeof v === 'string' && v.length <= 100)) || k.length > 40 || /@/.test(String(v)));
    check('olcum.riza', 'UMP "rıza gerekmiyor": toplama açılır, analytics_storage verilir, reklam rızaları (ad_storage, ad_user_data, ad_personalization) reddedilir',
      F.en.at(-1) === true && F.consent.includes('ANALYTICS_STORAGE=GRANTED') && ['AD_STORAGE', 'AD_USER_DATA', 'AD_PERSONALIZATION'].every(k => F.consent.includes(k + '=DENIED')), JSON.stringify({ en: F.en, c: F.consent }), 'high');
    check('olcum.bolum', 'level_start (bölüm, hat) → level_end (bölüm, hat, yıldız, süre, hamle, ipucu, kusursuz) → level_quit (yarım bırakınca)',
      st.length >= 2 && st[0].level === base.level && st[0].line === 1 && end && end.level === base.level && end.line === 1 && end.stars >= 1 && end.time_s >= 0 && end.moves > 0 && end.hints === 0 && 'perfect' in end && quit?.level === base.level + 1 && quit.hints === 1,
      JSON.stringify({ st, end, quit }), 'high');
    check('olcum.diger', 'tutorial (başla/bitir), purchase (ürün, tür; değer yok → gelir çift sayılmaz); parametreler kısa, sayı ya da metin, e-posta yok',
      tut[0]?.step === 'begin' && /complete|skip/.test(tut[1]?.step) && pur?.item_id === 'ray_ipucu_10' && pur.kind === 'consumable' && !('value' in pur) && !bad.length, JSON.stringify({ tut, pur, bad }), 'medium');
    check('olcum.errors', 'Ölçüm senaryosunda konsol hatası yok', !errors.length, errors.join(' | '));
    await ctx.close();
  }

  // ---- 7) Ödüllü reklam + güçlendirici + Günün Hattı olayları; ipucu bitince "İpucu paketleri" ----
  {
    const { ctx, page, errors } = await open(browser, URL, { init: CAP('NOT_REQUIRED') + STORE(), save: { ...base, bst: { geri: 1 } } });
    await G(page, d => { const s = JSON.parse(localStorage.getItem('ray')); s.hintDay = d; s.hints = 0; localStorage.setItem('ray', JSON.stringify(s)); }, await G(page, today));
    await page.reload(); await wait(page, 500);
    await page.click('#bPlay'); await wait(page, 600);
    const { tapTile } = T;
    const i = await G(page, () => window.__ray.G.cur.findIndex((v, i) => !window.__ray.G.fixed[i] && v !== 0));
    await tapTile(page, i); await wait(page, 120); await tapTile(page, (i + 1) % 9 === 0 ? i - 1 : i + 1); await wait(page, 300);
    const undoOn = await G(page, () => !document.getElementById('gUndo').hidden);
    if (undoOn) { await page.click('#gUndo'); await wait(page, 300); }
    await page.click('#bHint'); await wait(page, 500); await page.click('#mAd'); await wait(page, 1200);
    const F = await G(page, () => window.__fa), ev = n => F.ev.filter(e => e.name === n).map(e => e.params);
    check('olcum.reklam', 'ad_impression (ödüllü, admob) ve booster_use (geri, bölüm) olayları',
      ev('ad_impression').some(p => p.ad_format === 'rewarded' && p.ad_platform === 'admob') && undoOn && ev('booster_use')[0]?.booster === 'geri' && ev('booster_use')[0].level === base.level,
      JSON.stringify({ ad: ev('ad_impression'), b: ev('booster_use'), undoOn }), 'medium');
    // Günün Hattı
    await page.click('#bBack'); await wait(page, 500);
    await page.click('#bDaily'); await wait(page, 600);
    await solve(page, 10); await waitModal(page);
    const d = (await G(page, () => window.__fa.ev.filter(e => e.name === 'daily_end').map(e => e.params)))[0];
    check('olcum.gunluk', 'daily_end: yıldız, süre, hamle, ipucu, kusursuz, seri', d && d.stars >= 1 && d.moves > 0 && d.streak === 1 && 'perfect' in d, JSON.stringify(d), 'medium');
    check('olcum.reklam.errors', 'Reklam / günlük ölçüm senaryosunda konsol hatası yok', !errors.length, errors.join(' | '));
    await ctx.close();
  }

  // ---- 8) Rıza gerekli bölge (AB/BK): toplama kapalı, hiçbir olay gönderilmez; Verilerimi sil ölçümü sıfırlar ----
  {
    const { ctx, page, errors } = await open(browser, URL, { init: CAP('REQUIRED') + STORE(), save: base });
    await wait(page, 400);
    await page.click('#bPlay'); await wait(page, 600);
    await solve(page, 10); await waitModal(page);
    const F = await G(page, () => window.__fa);
    check('olcum.ab', 'UMP rıza gerektiren bölge: toplama kapalı (setEnabled false, analytics_storage reddedilir), hiç olay gönderilmez',
      F.en.at(-1) === false && F.consent.includes('ANALYTICS_STORAGE=DENIED') && !F.ev.length && !errors.length, JSON.stringify({ en: F.en, c: F.consent, n: F.ev.length, errors }), 'high');
    await page.click('#mHome').catch(() => {}); await wait(page, 500);
    await page.click('#bSettings'); await wait(page); await page.click('#oPriv'); await wait(page); await page.click('#mWipe'); await wait(page);
    await Promise.all([page.waitForNavigation({ timeout: 8000 }).catch(() => {}), page.click('#mWipeOk')]); await wait(page, 400);
    const reset = await G(page, () => sessionStorage.getItem('faReset'));
    check('olcum.sil', 'Verilerimi sil ölçüm verisini de sıfırlar (resetAnalyticsData) ve toplamayı kapatır', reset != null && /false$/.test(reset), String(reset), 'medium');
    await ctx.close();
  }
};
