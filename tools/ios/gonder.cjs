// App Store Connect: düzenlenebilir sürüme (VERSION) yapıyı (BUILD) bağlar ve App Review'a gönderir.
// Varsayılan yalnız denetler (ne yapılacağını ve eksikleri yazar); APPLY=1 bağlar ve gönderir.
// REPLACE=1: incelemede bekleyen gönderim geri çekilir (yeni yapıyla yeniden göndermek için); yalnız APPLY=1 ile birlikte iş görür.
// Ortam: APPSTORE_API_KEY_ID, APPSTORE_API_ISSUER_ID, AUTHKEY, VERSION (ör. 1.1), BUILD (ör. 10)
'use strict';
const crypto = require('crypto'), fs = require('fs');
const BUNDLE = 'com.osmanadali.ray', APPLY = process.env.APPLY === '1', REPLACE = process.env.REPLACE === '1', VERSION = process.env.VERSION || '1.1', BUILD = String(process.env.BUILD || '').trim();
const KID = process.env.APPSTORE_API_KEY_ID.trim(), ISS = process.env.APPSTORE_API_ISSUER_ID.trim(), KEY = fs.readFileSync(process.env.AUTHKEY);
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
function jwt() { const t = Math.floor(Date.now() / 1e3), h = b64({ alg: 'ES256', kid: KID, typ: 'JWT' }), p = b64({ iss: ISS, iat: t, exp: t + 900, aud: 'appstoreconnect-v1' });
  return h + '.' + p + '.' + crypto.sign('sha256', Buffer.from(h + '.' + p), { key: KEY, dsaEncoding: 'ieee-p1363' }).toString('base64url'); }
async function api(method, url, body) {
  const r = await fetch('https://api.appstoreconnect.apple.com' + url, { method, headers: { Authorization: 'Bearer ' + jwt(), 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
  const j = r.status === 204 ? {} : await r.json().catch(() => ({}));
  if (!r.ok) throw Error(`${method} ${url} → ${r.status}: ${(j.errors || []).map(x => [x.title, x.detail, x.source?.pointer].filter(Boolean).join(' · ')).join(' | ')}`);
  return j;
}
const out = [`## Ray · ${VERSION} (yapı ${BUILD}) App Review'a gönderim (${APPLY ? 'GÖNDERİLDİ' : 'yalnız denetim'})`, ''];
const say = s => { out.push(s); console.log(s); };
(async () => {
  if (!/^\d+$/.test(BUILD)) throw Error('BUILD (yapı numarası) girilmeli');
  const app = (await api('GET', `/v1/apps?filter[bundleId]=${BUNDLE}`)).data[0];
  const ver = (await api('GET', `/v1/apps/${app.id}/appStoreVersions?filter[versionString]=${VERSION}&filter[platform]=IOS`)).data[0];
  if (!ver) throw Error(`Sürüm ${VERSION} yok`);
  say(`- Sürüm ${VERSION}: ${ver.attributes.appStoreState}`);
  if (!['PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED'].includes(ver.attributes.appStoreState) && !(REPLACE && ['WAITING_FOR_REVIEW', 'IN_REVIEW'].includes(ver.attributes.appStoreState))) throw Error(`Sürüm gönderilebilir durumda değil: ${ver.attributes.appStoreState}`);
  const b = (await api('GET', `/v1/builds?filter[app]=${app.id}&filter[version]=${BUILD}&filter[preReleaseVersion.version]=${VERSION}&limit=5`)).data[0];
  if (!b) throw Error(`Yapı ${BUILD} (${VERSION}) bulunamadı`);
  say(`- Yapı ${BUILD}: ${b.attributes.processingState} · şifreleme beyanı: ${b.attributes.usesNonExemptEncryption ?? 'yok'}`);
  if (b.attributes.processingState !== 'VALID') throw Error('Yapı henüz işlenmedi (VALID değil)');
  const cur = (await api('GET', `/v1/appStoreVersions/${ver.id}/relationships/build`)).data;
  say(`- Sürüme bağlı yapı: ${cur ? (cur.id === b.id ? BUILD + ' (zaten bağlı)' : 'başka bir yapı') : 'yok'}`);
  let open = (await api('GET', `/v1/reviewSubmissions?filter[app]=${app.id}&filter[platform]=IOS&filter[state]=READY_FOR_REVIEW,WAITING_FOR_REVIEW,IN_REVIEW,UNRESOLVED_ISSUES`)).data;
  say(`- Açık inceleme gönderimi: ${open.length ? open.map(x => x.attributes.state).join(', ') : 'yok'}`);
  const busy = open.filter(x => ['WAITING_FOR_REVIEW', 'IN_REVIEW', 'UNRESOLVED_ISSUES'].includes(x.attributes.state));
  if (busy.length && !REPLACE) throw Error('Zaten incelemede bekleyen bir gönderim var (yeni yapıyla değiştirmek için replace=true)');
  if (busy.length && !APPLY) say('- replace: incelemedeki gönderim geri çekilecek, yapı ' + BUILD + ' ile yeniden gönderilecek');
  if (busy.length && APPLY) {
    for (const x of busy) { await api('PATCH', `/v1/reviewSubmissions/${x.id}`, { data: { type: 'reviewSubmissions', id: x.id, attributes: { canceled: true } } }); say('- İncelemedeki gönderim geri çekildi'); }
    for (let i = 0; i < 40; i++) {   // Apple geri çekmeyi birkaç saniye-dakikada işler
      await new Promise(r => setTimeout(r, 15000));
      const st = (await api('GET', `/v1/appStoreVersions/${ver.id}`)).data.attributes.appStoreState;
      const still = (await api('GET', `/v1/reviewSubmissions?filter[app]=${app.id}&filter[platform]=IOS&filter[state]=WAITING_FOR_REVIEW,IN_REVIEW,CANCELING`)).data.length;
      if (!still && ['PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED'].includes(st)) { say('- Sürüm yeniden düzenlenebilir: ' + st); break; }
      if (i === 39) throw Error('Geri çekme 10 dakikada tamamlanmadı: ' + st);
    }
    open = [];
  }
  if (!APPLY) { say('', 'Denetim tamam. Göndermek için apply=true ile yeniden çalıştır.'); return; }
  if (b.attributes.usesNonExemptEncryption == null) await api('PATCH', `/v1/builds/${b.id}`, { data: { type: 'builds', id: b.id, attributes: { usesNonExemptEncryption: false } } });
  if (!cur || cur.id !== b.id) { await api('PATCH', `/v1/appStoreVersions/${ver.id}/relationships/build`, { data: { type: 'builds', id: b.id } }); say(`- Yapı ${BUILD} sürüme bağlandı`); }
  let sub = open.find(x => x.attributes.state === 'READY_FOR_REVIEW');
  if (!sub) sub = (await api('POST', '/v1/reviewSubmissions', { data: { type: 'reviewSubmissions', attributes: { platform: 'IOS' }, relationships: { app: { data: { type: 'apps', id: app.id } } } } })).data;
  const items = (await api('GET', `/v1/reviewSubmissions/${sub.id}/items`)).data;
  if (!items.length) await api('POST', '/v1/reviewSubmissionItems', { data: { type: 'reviewSubmissionItems', relationships: { reviewSubmission: { data: { type: 'reviewSubmissions', id: sub.id } }, appStoreVersion: { data: { type: 'appStoreVersions', id: ver.id } } } } });
  const done = (await api('PATCH', `/v1/reviewSubmissions/${sub.id}`, { data: { type: 'reviewSubmissions', id: sub.id, attributes: { submitted: true } } })).data;
  say(`- İncelemeye gönderildi: ${done.attributes.state}`);
})().catch(e => { say('::error::' + e.message); process.exitCode = 1; }).finally(() => { if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, out.join('\n') + '\n'); });
