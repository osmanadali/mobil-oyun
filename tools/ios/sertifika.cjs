// Apple Developer: sertifikaları listeler. APPLY=1 ile yalnız API'den oluşmuş GELİŞTİRME sertifikalarını iptal eder
// (Codemagic otomatik imzasının bıraktıkları; "Revoke certificate" / "No profiles" hatası). Dağıtım sertifikalarına dokunmaz.
'use strict';
const crypto = require('crypto'), fs = require('fs');
const APPLY = process.env.APPLY === '1';
const KID = process.env.APPSTORE_API_KEY_ID.trim(), ISS = process.env.APPSTORE_API_ISSUER_ID.trim(), KEY = fs.readFileSync(process.env.AUTHKEY);
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
function jwt() { const t = Math.floor(Date.now() / 1e3), h = b64({ alg: 'ES256', kid: KID, typ: 'JWT' }), p = b64({ iss: ISS, iat: t, exp: t + 900, aud: 'appstoreconnect-v1' });
  return h + '.' + p + '.' + crypto.sign('sha256', Buffer.from(h + '.' + p), { key: KEY, dsaEncoding: 'ieee-p1363' }).toString('base64url'); }
async function api(method, url) {
  const r = await fetch('https://api.appstoreconnect.apple.com' + url, { method, headers: { Authorization: 'Bearer ' + jwt() } });
  const j = r.status === 204 ? {} : await r.json().catch(() => ({}));
  if (!r.ok) throw Error(`${method} ${url} → ${r.status}: ${(j.errors || []).map(x => x.detail || x.title).join(' | ')}`);
  return j;
}
const out = [`## Sertifikalar (${APPLY ? 'geliştirme sertifikaları İPTAL EDİLDİ' : 'yalnız liste'})`, ''];
(async () => {
  const certs = (await api('GET', '/v1/certificates?limit=200')).data;
  for (const c of certs) { const a = c.attributes; out.push(`- ${a.certificateType} · ${a.displayName || a.name} · bitiş ${String(a.expirationDate).slice(0, 10)} · ${c.id}`); }
  const dev = certs.filter(c => ['DEVELOPMENT', 'IOS_DEVELOPMENT'].includes(c.attributes.certificateType) && /Created via API/i.test(c.attributes.displayName || c.attributes.name || ''));
  out.push('', `İptal adayı (API'den oluşmuş geliştirme): ${dev.length}`);
  if (APPLY) for (const c of dev) { await api('DELETE', `/v1/certificates/${c.id}`); out.push(`- iptal: ${c.id}`); }
  const profs = (await api('GET', '/v1/profiles?limit=200')).data;
  out.push('', '## Profiller', ...profs.map(p => `- ${p.attributes.profileType} · ${p.attributes.name} · ${p.attributes.profileState}`));
  const txt = out.join('\n'); console.log(txt); if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, txt + '\n');
})().catch(e => { console.log('::error::' + e.message); process.exit(1); });
