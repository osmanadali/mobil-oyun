// App Store Connect: düzenlenebilir sürümün 9 dildeki ekran görüntülerini store/screens*/ klasörlerinden yükler (01…07 sırasıyla).
// iPhone 6,9" (ios-69 → APP_IPHONE_67), iPhone 6,5" (ios-65 → APP_IPHONE_65), iPad 13" (ios-ipad13 → APP_IPAD_PRO_3GEN_129).
// Her set önce boşaltılır, sonra sırayla yüklenir. Varsayılan önizleme; APPLY=1 yükler. Ortam: ios-metin.yml ile aynı + VERSION.
'use strict';
const crypto = require('crypto'), fs = require('fs'), path = require('path');
const BUNDLE = 'com.osmanadali.ray', APPLY = process.env.APPLY === '1', VERSION = process.env.VERSION || '1.1';
const KID = process.env.APPSTORE_API_KEY_ID.trim(), ISS = process.env.APPSTORE_API_ISSUER_ID.trim(), KEY = fs.readFileSync(process.env.AUTHKEY);
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
function jwt() { const t = Math.floor(Date.now() / 1e3), h = b64({ alg: 'ES256', kid: KID, typ: 'JWT' }), p = b64({ iss: ISS, iat: t, exp: t + 900, aud: 'appstoreconnect-v1' });
  return h + '.' + p + '.' + crypto.sign('sha256', Buffer.from(h + '.' + p), { key: KEY, dsaEncoding: 'ieee-p1363' }).toString('base64url'); }
async function api(method, url, body) {
  const r = await fetch('https://api.appstoreconnect.apple.com' + url, { method, headers: { Authorization: 'Bearer ' + jwt(), 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
  const j = r.status === 204 ? {} : await r.json().catch(() => ({}));
  if (!r.ok) throw Error(`${method} ${url} → ${r.status}: ${(j.errors || []).map(x => x.detail || x.title).join(' | ')}`);
  return j;
}
const R = path.join(__dirname, '..', '..'), DIR = { tr: 'screens', 'en-US': 'screens-en', 'de-DE': 'screens-de', 'es-ES': 'screens-es', 'pt-BR': 'screens-pt-BR', 'fr-FR': 'screens-fr', ko: 'screens-ko', ja: 'screens-ja', 'zh-Hant': 'screens-zh-Hant' };
const TYPES = { 'ios-69': 'APP_IPHONE_67', 'ios-65': 'APP_IPHONE_65', 'ios-ipad13': 'APP_IPAD_PRO_3GEN_129' };
const out = [`## Ray · ekran görüntüleri ${VERSION} (${APPLY ? 'YÜKLENDİ' : 'yalnız önizleme'})`, ''];
async function upload(setId, file) {
  const buf = fs.readFileSync(file), name = path.basename(file);
  const res = (await api('POST', '/v1/appScreenshots', { data: { type: 'appScreenshots', attributes: { fileName: name, fileSize: buf.length }, relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: setId } } } } })).data;
  for (const op of res.attributes.uploadOperations) {
    const headers = Object.fromEntries((op.requestHeaders || []).map(h => [h.name, h.value]));
    const r = await fetch(op.url, { method: op.method, headers, body: buf.subarray(op.offset, op.offset + op.length) });
    if (!r.ok) throw Error(`yükleme parçası ${name}: ${r.status}`);
  }
  await api('PATCH', `/v1/appScreenshots/${res.id}`, { data: { type: 'appScreenshots', id: res.id, attributes: { uploaded: true, sourceFileChecksum: crypto.createHash('md5').update(buf).digest('hex') } } });
  return res.id;
}
(async () => {
  const app = (await api('GET', `/v1/apps?filter[bundleId]=${BUNDLE}`)).data[0];
  const ver = (await api('GET', `/v1/apps/${app.id}/appStoreVersions?filter[versionString]=${VERSION}&filter[platform]=IOS`)).data[0];
  if (!ver) throw Error(`Sürüm ${VERSION} yok`);
  if (!['PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED'].includes(ver.attributes.appStoreState)) throw Error(`Sürüm düzenlenemez: ${ver.attributes.appStoreState}`);
  const locs = (await api('GET', `/v1/appStoreVersions/${ver.id}/appStoreVersionLocalizations?limit=50`)).data;
  for (const [loc, dir] of Object.entries(DIR)) {
    const L = locs.find(x => x.attributes.locale === loc); if (!L) { out.push(`- **${loc}**: dil sürümde yok, atlandı`); continue; }
    const sets = (await api('GET', `/v1/appStoreVersionLocalizations/${L.id}/appScreenshotSets?limit=50`)).data, line = [];
    for (const [sub, type] of Object.entries(TYPES)) {
      const d = path.join(R, 'store', dir, sub); if (!fs.existsSync(d)) { line.push(`${sub}: klasör yok`); continue; }
      const files = fs.readdirSync(d).filter(f => /^\d\d-.*\.png$/.test(f)).sort().slice(0, 10).map(f => path.join(d, f));
      let set = sets.find(s => s.attributes.screenshotDisplayType === type);
      const old = set ? (await api('GET', `/v1/appScreenshotSets/${set.id}/appScreenshots?limit=50`)).data : [];
      line.push(`${sub}: ${old.length} → ${files.length}`);
      if (!APPLY) continue;
      if (!set) set = (await api('POST', '/v1/appScreenshotSets', { data: { type: 'appScreenshotSets', attributes: { screenshotDisplayType: type }, relationships: { appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: L.id } } } } })).data;
      for (const s of old) await api('DELETE', `/v1/appScreenshots/${s.id}`);
      const ids = []; for (const f of files) ids.push(await upload(set.id, f));
      await api('PATCH', `/v1/appScreenshotSets/${set.id}/relationships/appScreenshots`, { data: ids.map(id => ({ type: 'appScreenshots', id })) });
    }
    out.push(`- **${loc}**: ${line.join(' · ')}`);
  }
  const txt = out.join('\n'); console.log(txt);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, txt + '\n');
})().catch(e => { console.log('::error::' + e.message); process.exit(1); });
