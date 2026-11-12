// App Store Connect: düzenlenebilir sürümün (PREPARE_FOR_SUBMISSION) 9 dildeki mağaza metinlerini doldurur.
// Kaynak: docs/MAGAZA.md (§4 tam açıklama tr/en, §5 ad/alt başlık/tanıtım/anahtar kelime tr/en, §5b/§5c diğer diller) ve docs/YENILIKLER-<sürüm>.md.
// Varsayılan yalnız gösterir (ne değişecek); APPLY=1 ile yazar. Ortam: APPSTORE_API_KEY_ID, APPSTORE_API_ISSUER_ID, AUTHKEY, VERSION (ör. 1.1)
'use strict';
const crypto = require('crypto'), fs = require('fs'), path = require('path');
const BUNDLE = 'com.osmanadali.ray', APPLY = process.env.APPLY === '1', VERSION = process.env.VERSION || '1.1';
const MARKETING = 'https://osmanadali.github.io', SUPPORT = 'https://osmanadali.github.io/mobil-oyun/gizlilik.html';
const KID = process.env.APPSTORE_API_KEY_ID.trim(), ISS = process.env.APPSTORE_API_ISSUER_ID.trim(), KEY = fs.readFileSync(process.env.AUTHKEY);
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
function jwt() { const t = Math.floor(Date.now() / 1e3), h = b64({ alg: 'ES256', kid: KID, typ: 'JWT' }), p = b64({ iss: ISS, iat: t, exp: t + 900, aud: 'appstoreconnect-v1' });
  return h + '.' + p + '.' + crypto.sign('sha256', Buffer.from(h + '.' + p), { key: KEY, dsaEncoding: 'ieee-p1363' }).toString('base64url'); }
async function api(method, url, body) {
  const r = await fetch('https://api.appstoreconnect.apple.com' + url, { method, headers: { Authorization: 'Bearer ' + jwt(), 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Error(`${method} ${url} → ${r.status}: ${(j.errors || []).map(x => x.detail || x.title).join(' | ')}`);
  return j;
}
// ---------- metinleri belgelerden oku ----------
const R = path.join(__dirname, '..', '..'), M = fs.readFileSync(path.join(R, 'docs/MAGAZA.md'), 'utf8');
const sec = (a, b) => { const i = M.indexOf(a), j = M.indexOf(b, i + 1); if (i < 0 || j < 0) throw Error('Bölüm yok: ' + a); return M.slice(i, j); };
const blocks = t => [...t.matchAll(/```(?:text)?\n([\s\S]*?)\n```/g)].map(m => m[1]);
const b4 = blocks(sec('## 4. Google Play', '## 5. App Store')), b5 = blocks(sec('## 5. App Store', '## 5b.'));
const T = {
  tr: { name: b5[0], subtitle: b5[2], promotionalText: b5[4], keywords: b5[6], description: b4[4] },
  'en-US': { name: b5[1], subtitle: b5[3], promotionalText: b5[5], keywords: b5[7], description: b4[5] },
};
for (const [loc, a, z] of [['de-DE', '### Deutsch', '### Español'], ['es-ES', '### Español', '### Português'], ['pt-BR', '### Português', '### Français'], ['fr-FR', '### Français', '## 5c.'],
  ['ko', '### 한국어', '### 日本語'], ['ja', '### 日本語', '### 繁體中文'], ['zh-Hant', '### 繁體中文', '## 6.']]) {
  const b = blocks(sec(a, z)); if (b.length < 6) throw Error(`${loc}: ${b.length} kutu (7 bekleniyordu)`);
  T[loc] = { name: b[0], subtitle: b[2], promotionalText: b[3], keywords: b[4], description: b[5] };
}
const NEWS = path.join(R, `docs/YENILIKLER-${VERSION}.md`);
if (fs.existsSync(NEWS)) {
  const N = fs.readFileSync(NEWS, 'utf8'), map = { tr: 'tr', en: 'en-US', de: 'de-DE', es: 'es-ES', 'pt-BR': 'pt-BR', fr: 'fr-FR', ko: 'ko', ja: 'ja', 'zh-Hant': 'zh-Hant' };
  for (const m of N.matchAll(/^## (\S+)\n\n```\n([\s\S]*?)\n```/gm)) if (map[m[1]]) T[map[m[1]]].whatsNew = m[2];
}
const LIM = { name: 30, subtitle: 30, promotionalText: 170, keywords: 100, description: 4000, whatsNew: 4000 };
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
for (const [loc, f] of Object.entries(T)) for (const [k, v] of Object.entries(f)) {
  if ([...v].length > LIM[k]) throw Error(`${loc} ${k}: ${[...v].length} > ${LIM[k]}`);
  if (k === 'whatsNew' && EMOJI.test(v)) throw Error(`${loc} whatsNew: emoji (App Store kabul etmez)`);
}
// ---------- App Store Connect ----------
const out = [`## Ray · mağaza metinleri ${VERSION} (${APPLY ? 'YAZILDI' : 'yalnız önizleme'})`, ''];
const short = v => v == null ? '∅' : JSON.stringify(v.length > 50 ? v.slice(0, 47) + '…' : v);
(async () => {
  const app = (await api('GET', `/v1/apps?filter[bundleId]=${BUNDLE}`)).data[0]; if (!app) throw Error('Uygulama yok');
  const ver = (await api('GET', `/v1/apps/${app.id}/appStoreVersions?filter[versionString]=${VERSION}&filter[platform]=IOS`)).data[0];
  if (!ver) throw Error(`Sürüm ${VERSION} App Store Connect'te yok (önce sürümü oluştur)`);
  if (!['PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED'].includes(ver.attributes.appStoreState)) throw Error(`Sürüm ${VERSION} düzenlenemez: ${ver.attributes.appStoreState}`);
  // sürüm yerelleştirmeleri: açıklama, anahtar kelime, tanıtım, yenilikler, URL'ler
  const vl = (await api('GET', `/v1/appStoreVersions/${ver.id}/appStoreVersionLocalizations?limit=50`)).data;
  for (const [loc, f] of Object.entries(T)) {
    const want = { description: f.description, keywords: f.keywords, promotionalText: f.promotionalText, marketingUrl: MARKETING, ...(f.whatsNew ? { whatsNew: f.whatsNew } : {}) };
    const cur = vl.find(x => x.attributes.locale === loc);
    if (!cur) { out.push(`- **${loc}**: dil sürümde yok → ${APPLY ? 'eklendi' : 'eklenecek'}`); if (APPLY) await api('POST', '/v1/appStoreVersionLocalizations', { data: { type: 'appStoreVersionLocalizations', attributes: { locale: loc, ...want, supportUrl: SUPPORT }, relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: ver.id } } } } }); continue; }
    if (!cur.attributes.supportUrl) want.supportUrl = SUPPORT;
    const diff = Object.entries(want).filter(([k, v]) => cur.attributes[k] !== v);
    out.push(`- **${loc}**: ${diff.length ? diff.map(([k, v]) => `${k} ${short(cur.attributes[k])} → ${short(v)}`).join(' · ') : 'aynı'}`);
    if (APPLY && diff.length) await api('PATCH', `/v1/appStoreVersionLocalizations/${cur.id}`, { data: { type: 'appStoreVersionLocalizations', id: cur.id, attributes: Object.fromEntries(diff) } });
  }
  // uygulama bilgisi yerelleştirmeleri: ad, alt başlık (düzenlenebilir appInfo)
  const infos = (await api('GET', `/v1/apps/${app.id}/appInfos`)).data, info = infos.find(i => /PREPARE|REJECT|DEVELOPER/.test(i.attributes.appStoreState || i.attributes.state || '')) || infos[0];
  const il = (await api('GET', `/v1/appInfos/${info.id}/appInfoLocalizations?limit=50`)).data;
  out.push('', `**Ad ve alt başlık** (appInfo ${info.attributes.appStoreState || info.attributes.state})`, '');
  for (const [loc, f] of Object.entries(T)) {
    const want = { name: f.name, subtitle: f.subtitle }, cur = il.find(x => x.attributes.locale === loc);
    if (!cur) { out.push(`- **${loc}**: ${APPLY ? 'eklendi' : 'eklenecek'}`); if (APPLY) await api('POST', '/v1/appInfoLocalizations', { data: { type: 'appInfoLocalizations', attributes: { locale: loc, ...want, privacyPolicyUrl: SUPPORT }, relationships: { appInfo: { data: { type: 'appInfos', id: info.id } } } } }); continue; }
    const diff = Object.entries(want).filter(([k, v]) => cur.attributes[k] !== v);
    out.push(`- **${loc}**: ${diff.length ? diff.map(([k, v]) => `${k} ${short(cur.attributes[k])} → ${short(v)}`).join(' · ') : 'aynı'}`);
    if (APPLY && diff.length) await api('PATCH', `/v1/appInfoLocalizations/${cur.id}`, { data: { type: 'appInfoLocalizations', id: cur.id, attributes: Object.fromEntries(diff) } });
  }
  const txt = out.join('\n'); console.log(txt);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, txt + '\n');
})().catch(e => { console.log('::error::' + e.message); process.exit(1); });
