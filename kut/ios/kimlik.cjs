// Apple Developer: com.osmanadali.kutarena paket kimliğini (Identifier) kaydeder, App Store Connect'te uygulama kaydını denetler.
// Ortam: APPSTORE_API_KEY_ID, APPSTORE_API_ISSUER_ID, AUTHKEY (p8 dosya yolu). Codemagic "kut-ios" iş akışında çalışır.
'use strict';
const crypto = require('crypto'), fs = require('fs');
const BUNDLE = 'com.osmanadali.kutarena', AD = 'Kut Arena';
const KID = process.env.APPSTORE_API_KEY_ID.trim(), ISS = process.env.APPSTORE_API_ISSUER_ID.trim(), KEY = fs.readFileSync(process.env.AUTHKEY);
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
function jwt() { const t = Math.floor(Date.now() / 1e3), h = b64({ alg: 'ES256', kid: KID, typ: 'JWT' }), p = b64({ iss: ISS, iat: t, exp: t + 900, aud: 'appstoreconnect-v1' });
  return h + '.' + p + '.' + crypto.sign('sha256', Buffer.from(h + '.' + p), { key: KEY, dsaEncoding: 'ieee-p1363' }).toString('base64url'); }
async function api(method, url, body) {
  const r = await fetch('https://api.appstoreconnect.apple.com' + url, { method, headers: { Authorization: 'Bearer ' + jwt(), 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
  const j = r.status === 204 ? {} : await r.json().catch(() => ({}));
  if (!r.ok) throw Error(`${method} ${url} → ${r.status}: ${(j.errors || []).map(x => [x.title, x.detail].filter(Boolean).join(' · ')).join(' | ')}`);
  return j;
}
(async () => {
  const var_ = (await api('GET', `/v1/bundleIds?filter[identifier]=${BUNDLE}`)).data.find(b => b.attributes.identifier === BUNDLE);
  if (var_) console.log(`Identifier zaten kayıtlı: ${BUNDLE}`);
  else { await api('POST', '/v1/bundleIds', { data: { type: 'bundleIds', attributes: { identifier: BUNDLE, name: AD, platform: 'IOS' } } }); console.log(`Identifier kaydedildi: ${BUNDLE}`); }
  const app = (await api('GET', `/v1/apps?filter[bundleId]=${BUNDLE}`)).data[0];
  if (app) { console.log(`App Store Connect uygulaması var: ${app.attributes.name} (${app.id})`); return; }
  console.log(`\nApp Store Connect'te ${BUNDLE} için uygulama kaydı YOK. Apple bunu API ile açtırmıyor (yalnız web):`);
  console.log(`appstoreconnect.apple.com › Uygulamalar › + › Yeni Uygulama › iOS, ad "${AD}", paket kimliği ${BUNDLE}, SKU kutarena. Sonra derlemeyi yeniden başlat.`);
  process.exit(1);
})().catch(e => { console.error(e.message); process.exit(1); });
