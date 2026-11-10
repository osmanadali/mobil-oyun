// App Store Connect: inceleme durumu (son sürümler, son yapılar, inceleme gönderimleri). Yalnız okur, hiçbir şeyi değiştirmez.
// Ortam: APPSTORE_API_KEY_ID, APPSTORE_API_ISSUER_ID, AUTHKEY (p8 dosya yolu). Kullanım: node tools/ios/durum.cjs
'use strict';
const crypto = require('crypto'), fs = require('fs');
const BUNDLE = 'com.osmanadali.ray';
const KID = process.env.APPSTORE_API_KEY_ID.trim(), ISS = process.env.APPSTORE_API_ISSUER_ID.trim(), KEY = fs.readFileSync(process.env.AUTHKEY);
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
function jwt() { const t = Math.floor(Date.now() / 1e3), h = b64({ alg: 'ES256', kid: KID, typ: 'JWT' }), p = b64({ iss: ISS, iat: t, exp: t + 900, aud: 'appstoreconnect-v1' });
  return h + '.' + p + '.' + crypto.sign('sha256', Buffer.from(h + '.' + p), { key: KEY, dsaEncoding: 'ieee-p1363' }).toString('base64url'); }
async function get(url) {
  const r = await fetch('https://api.appstoreconnect.apple.com' + url, { headers: { Authorization: 'Bearer ' + jwt() } }), j = await r.json().catch(() => ({}));
  if (!r.ok) throw Error(`GET ${url} → ${r.status}: ${(j.errors || []).map(x => x.detail || x.title).join(' | ')}`);
  return j;
}
// durum adlarının Türkçesi (ekranda bunlar görünür)
const TR = { PREPARE_FOR_SUBMISSION: 'Gönderime hazırlanıyor', WAITING_FOR_REVIEW: 'İnceleme sırasında', IN_REVIEW: 'İnceleniyor', PENDING_DEVELOPER_RELEASE: 'Onaylandı · senin yayınlaman bekleniyor',
  PENDING_APPLE_RELEASE: 'Onaylandı · Apple yayınlayacak', READY_FOR_SALE: 'Yayında', REJECTED: 'Reddedildi', METADATA_REJECTED: 'Bilgiler reddedildi', DEVELOPER_REJECTED: 'Geri çekildi',
  INVALID_BINARY: 'Geçersiz yapı', PROCESSING_FOR_APP_STORE: 'Yayına hazırlanıyor', WAITING_FOR_EXPORT_COMPLIANCE: 'Şifreleme beyanı bekleniyor', READY_FOR_REVIEW: 'İncelemeye hazır',
  UNRESOLVED_ISSUES: 'Çözülmemiş sorun var (Apple mesajına bak)', COMPLETE: 'Tamamlandı', CANCELING: 'İptal ediliyor', READY_TO_SUBMIT: 'Gönderilmeye hazır',
  VALID: 'Hazır', PROCESSING: 'İşleniyor', FAILED: 'Başarısız', INVALID: 'Geçersiz' };
const tr = s => s ? `${TR[s] || s} (${s})` : '-';
const day = s => s ? new Date(s).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'medium', timeStyle: 'short' }) : '-';
(async () => {
  const app = (await get(`/v1/apps?filter[bundleId]=${BUNDLE}`)).data[0]; if (!app) throw Error('Uygulama bulunamadı: ' + BUNDLE);
  const out = [`## Ray · App Store durumu (${day(new Date().toISOString())})`, ''];
  const vers = (await get(`/v1/apps/${app.id}/appStoreVersions?limit=5`)).data;
  out.push('**Sürümler**', '');
  for (const v of vers) out.push(`- ${v.attributes.versionString} · ${v.attributes.platform}: **${tr(v.attributes.appStoreState)}** · oluşturma ${day(v.attributes.createdDate)}`);
  const subs = (await get(`/v1/reviewSubmissions?filter[app]=${app.id}&limit=5`)).data;
  out.push('', '**İnceleme gönderimleri**', '');
  for (const s of subs) out.push(`- ${tr(s.attributes.state)} · gönderim ${day(s.attributes.submittedDate)}`);
  if (!subs.length) out.push('- yok');
  const builds = (await get(`/v1/builds?filter[app]=${app.id}&sort=-uploadedDate&limit=5`)).data;
  out.push('', '**Son yüklenen yapılar**', '');
  for (const b of builds) out.push(`- yapı ${b.attributes.version}: ${tr(b.attributes.processingState)} · yükleme ${day(b.attributes.uploadedDate)}`);
  out.push('', 'Not: Apple\'ın yazılı mesajları API\'den okunamaz; "Reddedildi" ya da "Çözülmemiş sorun" görürsen App Store Connect › App Review\'daki mesaja bak.');
  const txt = out.join('\n'); console.log(txt);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, txt + '\n');
})().catch(e => { console.log('::error::' + e.message); process.exit(1); });
