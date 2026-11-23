// Google Play: oyun içi ürünleri API ile kurar (Play Developer API, oneTimeProducts). Yoksa oluşturur, var olana dokunmaz.
// Adlar ve fiyatlar App Store ile aynı (tools/ios/iap.cjs): ABD fiyatından Play bütün ülkelere çevirir, Türkiye elle.
// Ortam: SA (servis hesabı JSON), APPLY=1 ise kurar (yoksa yalnız denetler ve ne yapacağını yazar).
'use strict';
const crypto = require('crypto');
const PKG = 'com.osmanadali.ray', API = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PKG}`;
const APPLY = process.env.APPLY === '1';
// Play: ad ≤ 55, açıklama ≤ 200 (App Store metinlerinin uzun hali, docs/MAGAZA.md §10)
const P = [
  { id: 'ray_reklamsiz', usd: 2.99, tr: 79.99, tr_n: 'Reklamsız paket', tr_d: 'Bölüm aralarındaki reklamları kaldırır, 20 ipucu hediye eder ve 3 özel temayı (Altın, Elmas, Yakut) açar. Tek seferlik, ömür boyu.', en_n: 'Ad-free Pack', en_d: 'Removes the ads between levels, gives you 20 hints and unlocks 3 exclusive themes (Gold, Diamond, Ruby). One-time purchase, yours forever.' },
  { id: 'ray_temalar', usd: 3.99, tr: 99.99, tr_n: 'Tema paketi', tr_d: '28 renk temasının hepsi, tek seferlik.', en_n: 'Theme Pack', en_d: 'All 28 color themes, one-time purchase.' },
  { id: 'ray_ipucu_10', usd: 0.99, tr: 29.99, tr_n: '10 ipucu', tr_d: '10 ipucu: takıldığın karo yerine oturur.', en_n: '10 Hints', en_d: '10 hints: puts a tricky tile in place.' },
  { id: 'ray_ipucu_30', usd: 1.99, tr: 49.99, tr_n: '30 ipucu', tr_d: '30 ipucu: takıldığın karo yerine oturur.', en_n: '30 Hints', en_d: '30 hints: puts a tricky tile in place.' },
  { id: 'ray_ipucu_80', usd: 3.99, tr: 99.99, tr_n: '80 ipucu', tr_d: '80 ipucu: takıldığın karo yerine oturur.', en_n: '80 Hints', en_d: '80 hints: puts a tricky tile in place.' },
  { id: 'ray_guclendirici', usd: 1.99, tr: 49.99, tr_n: 'Güçlendirici paketi', tr_d: 'Her güçlendiriciden 3: ek tur, fener, +15 sn, geri al.', en_n: 'Booster Pack', en_d: '3 of each booster: turn, lantern, +15 s, undo.' },
  { id: 'ray_bilet_50', usd: 1.99, tr: 49.99, tr_n: 'Bilet paketi', tr_d: '50 bilet, renk temaları için.', en_n: 'Ticket Pack', en_d: '50 tickets to spend on color themes.' },
  { id: 'ray_baslangic', usd: 2.99, tr: 79.99, tr_n: 'Başlangıç paketi', tr_d: '10 ipucu, 8 güçlendirici, 1 saat sınırsız can, 20 bilet.', en_n: 'Starter Pack', en_d: '10 hints, 8 boosters, 1 hour of unlimited lives, 20 tickets.' },
];
for (const p of P) { if ([...p.tr_n].length > 55 || [...p.en_n].length > 55) throw Error(p.id + ' ad > 55'); if ([...p.tr_d].length > 200 || [...p.en_d].length > 200) throw Error(p.id + ' açıklama > 200'); }

const sa = JSON.parse(process.env.SA || '{}');
if (sa.type !== 'service_account') { console.error('SA servis hesabı JSON değil'); process.exit(1); }
const b64 = x => Buffer.from(typeof x === 'string' ? x : JSON.stringify(x)).toString('base64url');
async function token() {
  const now = Math.floor(Date.now() / 1000), head = b64({ alg: 'RS256', typ: 'JWT' }), body = b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const sig = crypto.sign('RSA-SHA256', Buffer.from(head + '.' + body), sa.private_key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${head}.${body}.${sig}` }) });
  const j = await r.json(); if (!j.access_token) throw Error('giriş: ' + JSON.stringify(j)); return j.access_token;
}
let TOK;
async function api(method, path, body) {
  const r = await fetch(API + path, { method, headers: { authorization: 'Bearer ' + TOK, 'content-type': 'application/json' }, body: body && JSON.stringify(body) });
  const t = await r.text(); let j = {}; try { j = t ? JSON.parse(t) : {}; } catch { j = { error: { message: 'JSON değil: ' + t.slice(0, 120).replace(/\s+/g, ' ') } }; }
  if (!r.ok) { const e = Error(`${method} ${path.split('?')[0]} → ${r.status} ${j.error?.message || t.slice(0, 300)}`); e.status = r.status; throw e; }
  return j;
}
const micros = m => String(BigInt(m.units || 0) * 1000000n + BigInt(Math.round((m.nanos || 0) / 1000)));
const money = v => ({ currencyCode: 'USD', units: String(Math.floor(v)), nanos: Math.round((v - Math.floor(v)) * 100) * 10000000 });

// Play'in yeni ürün servisi (oneTimeProducts, 2025; eski inappproducts "Please migrate to the new publishing API" diyor)
const OPT = 'satin-al', RV = 'regionsVersion.version=2022%2F02';
(async () => {
  TOK = await token();
  console.log('Servis hesabı:', sa.client_email, '· uygulama:', PKG, '·', APPLY ? 'KURULUM' : 'yalnız denetim');
  let have = [];
  try { have = (await api('GET', '/oneTimeProducts?pageSize=100')).oneTimeProducts || []; }
  catch (e) { console.error('::error::Ürün listesi okunamadı: ' + e.message); if (e.status === 403) console.error('::error::Servis hesabına Play Console › Kullanıcılar ve izinler › bu uygulama › "Uygulama içi ürünleri ve abonelikleri yönet" izni verilmeli (ödeme profili de bağlı olmalı).'); process.exit(1); }
  const byId = Object.fromEntries(have.map(x => [x.productId, x]));
  console.log(`Play'de var olan ürünler (${have.length}):`, have.map(x => `${x.productId} [${(x.purchaseOptions || []).map(o => o.state).join(',')}]`).join(' · ') || 'yok');
  let fail = 0;
  for (const p of P) {
    const cur = byId[p.id];
    if (cur && (cur.purchaseOptions || []).some(o => o.state === 'ACTIVE')) { console.log(`✓ ${p.id} zaten var ve etkin, dokunulmadı`); continue; }
    let conv;
    try { conv = await api('POST', '/pricing:convertRegionPrices', { price: money(p.usd) }); }
    catch (e) { console.error(`::error::${p.id}: fiyat çevrilemedi: ${e.message}`); fail++; continue; }
    const reg = { ...(conv.convertedRegionPrices || {}) };
    const cfg = Object.entries(reg).map(([rc, v]) => ({ regionCode: rc, price: rc === 'TR' ? { currencyCode: 'TRY', units: String(Math.floor(p.tr)), nanos: Math.round((p.tr % 1) * 100) * 10000000 } : rc === 'US' ? money(p.usd) : v.price, availability: 'AVAILABLE' }));
    if (!cfg.some(c => c.regionCode === 'TR')) cfg.push({ regionCode: 'TR', price: { currencyCode: 'TRY', units: String(Math.floor(p.tr)), nanos: Math.round((p.tr % 1) * 100) * 10000000 }, availability: 'AVAILABLE' });
    const other = conv.convertedOtherRegionsPrice;
    const body = { packageName: PKG, productId: p.id,
      listings: [{ languageCode: 'tr-TR', title: p.tr_n, description: p.tr_d }, { languageCode: 'en-US', title: p.en_n, description: p.en_d }],
      purchaseOptions: [{ purchaseOptionId: OPT, buyOption: { legacyCompatible: true, multiQuantityEnabled: false }, regionalPricingAndAvailabilityConfigs: cfg,
        ...(other ? { newRegionsConfig: { usdPrice: other.usdPrice, eurPrice: other.eurPrice, availability: 'AVAILABLE' } } : {}) }] };
    const gb = cfg.find(c => c.regionCode === 'GB')?.price, de = cfg.find(c => c.regionCode === 'DE')?.price;
    console.log(`${APPLY ? '→' : '•'} ${p.id}${cur ? ' (var, etkin değil)' : ''}: ${p.tr_n} / ${p.en_n} · ₺${p.tr} · ${p.usd} $ · ${cfg.length} ülke (örn. GB ${gb ? (gb.units || 0) + '.' + String(gb.nanos / 1e7 | 0).padStart(2, '0') + ' ' + gb.currencyCode : '-'}, DE ${de ? (de.units || 0) + '.' + String(de.nanos / 1e7 | 0).padStart(2, '0') + ' ' + de.currencyCode : '-'})`);
    if (!APPLY) continue;
    try {
      await api('PATCH', `/onetimeproducts/${p.id}?allowMissing=true&${RV}&updateMask=listings,purchaseOptions`, body);
      await api('POST', `/oneTimeProducts/${p.id}/purchaseOptions:batchUpdateStates`, { requests: [{ activatePurchaseOptionRequest: { packageName: PKG, productId: p.id, purchaseOptionId: OPT } }] });
      console.log(`  ✓ ${p.id} oluşturuldu ve etkin`);
    } catch (e) { console.error(`::error::${p.id}: ${e.message}`); fail++; }
  }
  if (fail) process.exit(1);
  console.log(APPLY ? 'Bitti.' : 'Denetim bitti: kurmak için play_urun=kur ile çalıştır.');
})().catch(e => { console.error('::error::' + e.message); process.exit(1); });
