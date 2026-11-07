// App Store Connect: oyun içi ürünleri API ile kurar (yoksa oluşturur, eksik parçayı tamamlar; var olana dokunmaz).
// Ortam: APPSTORE_API_KEY_ID, APPSTORE_API_ISSUER_ID, AUTHKEY (p8 dosya yolu). Kullanım: node tools/ios/iap.cjs [--dry]
'use strict';
const crypto = require('crypto'), fs = require('fs'), path = require('path');
const BUNDLE = 'com.osmanadali.ray', SHOT = path.join(__dirname, '..', '..', 'store', 'inceleme-magaza.png');
const NOTE = 'Open the game, tap Settings (top right on the home screen) > Shop. Consumable packs add hints, boosters or tickets; purchased tickets can only be spent on color themes. Non-consumables can be restored with "Restore purchases" in the same sheet.';
// usd: ABD taban fiyatı · tr: Türkiye elle fiyat (en yakın basamak) · ad/açıklama: App Store sınırı 30 / 45
const P = [
  { id: 'ray_reklamsiz', nc: 1, usd: '2.99', tr: 79.99, tr_n: 'Reklamsız paket', tr_d: 'Reklamlar kalkar, 20 ipucu ve 3 özel tema', en_n: 'Ad-free Pack', en_d: 'No ads between levels, 20 hints, 3 themes' },
  { id: 'ray_temalar', nc: 1, usd: '3.99', tr: 99.99, tr_n: 'Tema paketi', tr_d: '28 renk temasının hepsi, tek seferlik', en_n: 'Theme Pack', en_d: 'All 28 color themes, one-time' },
  { id: 'ray_ipucu_10', usd: '0.99', tr: 29.99, tr_n: '10 ipucu', tr_d: 'Takıldığın karoyu yerine oturtur', en_n: '10 Hints', en_d: 'Puts a tricky tile in place' },
  { id: 'ray_ipucu_30', usd: '1.99', tr: 49.99, tr_n: '30 ipucu', tr_d: 'Takıldığın karoyu yerine oturtur', en_n: '30 Hints', en_d: 'Puts a tricky tile in place' },
  { id: 'ray_ipucu_80', usd: '3.99', tr: 99.99, tr_n: '80 ipucu', tr_d: 'Takıldığın karoyu yerine oturtur', en_n: '80 Hints', en_d: 'Puts a tricky tile in place' },
  { id: 'ray_guclendirici', usd: '1.99', tr: 49.99, tr_n: 'Güçlendirici paketi', tr_d: 'Her güçlendiriciden 3', en_n: 'Booster Pack', en_d: '3 of each booster' },
  { id: 'ray_bilet_50', usd: '1.99', tr: 49.99, tr_n: 'Bilet paketi', tr_d: '50 bilet, renk temaları için', en_n: 'Ticket Pack', en_d: '50 tickets for color themes' },
  { id: 'ray_baslangic', usd: '2.99', tr: 79.99, tr_n: 'Başlangıç paketi', tr_d: '10 ipucu, 8 güçlendirici, 1 sa can, 20 bilet', en_n: 'Starter Pack', en_d: '10 hints, 8 boosters, 1 h lives, 20 tickets' },
];
const DRY = process.argv.includes('--dry');
for (const p of P) for (const k of ['tr_n', 'en_n']) if ([...p[k]].length > 30) throw Error(`${p.id} ${k} > 30`);
for (const p of P) for (const k of ['tr_d', 'en_d']) if ([...p[k]].length > 45) throw Error(`${p.id} ${k} > 45`);
if (DRY) { console.log('denetim tamam:', P.length, 'ürün'); process.exit(0); }
const KID = process.env.APPSTORE_API_KEY_ID.trim(), ISS = process.env.APPSTORE_API_ISSUER_ID.trim(), KEY = fs.readFileSync(process.env.AUTHKEY);
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
function jwt() { const t = Math.floor(Date.now() / 1e3), h = b64({ alg: 'ES256', kid: KID, typ: 'JWT' }), p = b64({ iss: ISS, iat: t, exp: t + 900, aud: 'appstoreconnect-v1' });
  return h + '.' + p + '.' + crypto.sign('sha256', Buffer.from(h + '.' + p), { key: KEY, dsaEncoding: 'ieee-p1363' }).toString('base64url'); }
async function api(method, url, body) {
  const r = await fetch(url.startsWith('http') ? url : 'https://api.appstoreconnect.apple.com' + url, { method, headers: { Authorization: 'Bearer ' + jwt(), 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
  const txt = await r.text(), j = txt ? JSON.parse(txt) : {};
  if (!r.ok) { const e = Error(`${method} ${url} → ${r.status}: ${(j.errors || []).map(x => x.detail || x.title).join(' | ') || txt.slice(0, 300)}`); e.status = r.status; throw e; }
  return j;
}
async function all(url) { const out = []; for (let u = url; u;) { const j = await api('GET', u); out.push(...j.data); u = j.links?.next; } return out; }
const rel = (type, id) => ({ data: { type, id } });

(async () => {
  const app = (await api('GET', `/v1/apps?filter[bundleId]=${BUNDLE}`)).data[0]; if (!app) throw Error('Uygulama bulunamadı: ' + BUNDLE);
  const have = await all(`/v1/apps/${app.id}/inAppPurchasesV2?limit=200`), byPid = Object.fromEntries(have.map(x => [x.attributes.productId, x]));
  const terr = (await all('/v1/territories?limit=200')).map(t => t.id);
  const shot = fs.readFileSync(SHOT), md5 = crypto.createHash('md5').update(shot).digest('hex');
  let errs = 0;
  for (const p of P) {
    const log = (...a) => console.log(`[${p.id}]`, ...a);
    try {
      let iap = byPid[p.id];
      if (!iap) {
        iap = (await api('POST', '/v2/inAppPurchases', { data: { type: 'inAppPurchases', attributes: { name: p.tr_n, productId: p.id, inAppPurchaseType: p.nc ? 'NON_CONSUMABLE' : 'CONSUMABLE', reviewNote: NOTE, ...(p.nc ? { familySharable: true } : {}) }, relationships: { app: rel('apps', app.id) } } })).data;
        log('oluşturuldu');
      } else log('zaten var, eksikler tamamlanıyor');
      const id = iap.id;
      // dil metinleri
      const locs = await all(`/v2/inAppPurchases/${id}/inAppPurchaseLocalizations?limit=50`), hasL = new Set(locs.map(l => l.attributes.locale));
      for (const [locale, name, description] of [['tr', p.tr_n, p.tr_d], ['en-US', p.en_n, p.en_d]]) {
        if (hasL.has(locale)) continue;
        await api('POST', '/v1/inAppPurchaseLocalizations', { data: { type: 'inAppPurchaseLocalizations', attributes: { locale, name, description }, relationships: { inAppPurchaseV2: rel('inAppPurchases', id) } } });
        log('dil eklendi:', locale);
      }
      // ülkeler
      let avail = null; try { avail = (await api('GET', `/v2/inAppPurchases/${id}/inAppPurchaseAvailability`)).data; } catch (e) { if (e.status !== 404) throw e; }
      if (!avail) {
        await api('POST', '/v1/inAppPurchaseAvailabilities', { data: { type: 'inAppPurchaseAvailabilities', attributes: { availableInNewTerritories: true }, relationships: { inAppPurchase: rel('inAppPurchases', id), availableTerritories: { data: terr.map(t => ({ type: 'territories', id: t })) } } } });
        log('bütün ülkelerde satışta');
      }
      // fiyat: ABD taban + Türkiye elle
      let sched = null; try { sched = (await api('GET', `/v2/inAppPurchases/${id}/iapPriceSchedule?include=manualPrices`)); } catch (e) { if (e.status !== 404) throw e; }
      if (!sched?.data || !(sched.included || []).length) {
        const pts = await all(`/v2/inAppPurchases/${id}/pricePoints?filter[territory]=USA,TUR&include=territory&limit=200`);
        const ter = x => x.relationships?.territory?.data?.id;
        const us = pts.find(x => ter(x) === 'USA' && x.attributes.customerPrice === p.usd);
        const trs = pts.filter(x => ter(x) === 'TUR').sort((a, b) => Math.abs(a.attributes.customerPrice - p.tr) - Math.abs(b.attributes.customerPrice - p.tr));
        if (!us) throw Error('ABD fiyat basamağı yok: ' + p.usd);
        const prices = [['${p1}', us], ['${p2}', trs[0]]].filter(x => x[1]);
        await api('POST', '/v1/inAppPurchasePriceSchedules', { data: { type: 'inAppPurchasePriceSchedules', relationships: { inAppPurchase: rel('inAppPurchases', id), baseTerritory: rel('territories', 'USA'), manualPrices: { data: prices.map(([k]) => ({ type: 'inAppPurchasePrices', id: k })) } } },
          included: prices.map(([k, pt]) => ({ type: 'inAppPurchasePrices', id: k, attributes: { startDate: null }, relationships: { inAppPurchasePricePoint: rel('inAppPurchasePricePoints', pt.id) } })) });
        log('fiyat:', us.attributes.customerPrice, 'USD ·', trs[0]?.attributes.customerPrice, 'TRY');
      }
      // inceleme görüntüsü
      let ss = null; try { ss = (await api('GET', `/v2/inAppPurchases/${id}/appStoreReviewScreenshot`)).data; } catch (e) { if (e.status !== 404) throw e; }
      if (!ss) {
        const r = (await api('POST', '/v1/inAppPurchaseAppStoreReviewScreenshots', { data: { type: 'inAppPurchaseAppStoreReviewScreenshots', attributes: { fileName: 'inceleme-magaza.png', fileSize: shot.length }, relationships: { inAppPurchaseV2: rel('inAppPurchases', id) } } })).data;
        for (const op of r.attributes.uploadOperations) {
          const h = Object.fromEntries((op.requestHeaders || []).map(x => [x.name, x.value]));
          const u = await fetch(op.url, { method: op.method, headers: h, body: shot.subarray(op.offset, op.offset + op.length) });
          if (!u.ok) throw Error('görüntü yüklenemedi: ' + u.status);
        }
        await api('PATCH', `/v1/inAppPurchaseAppStoreReviewScreenshots/${r.id}`, { data: { type: 'inAppPurchaseAppStoreReviewScreenshots', id: r.id, attributes: { uploaded: true, sourceFileChecksum: md5 } } });
        log('inceleme görüntüsü yüklendi');
      }
      log('tamam');
    } catch (e) { errs++; console.log(`::error::[${p.id}] ${e.message}`); }
  }
  if (errs) process.exit(1);
})().catch(e => { console.log('::error::' + e.message); process.exit(1); });
