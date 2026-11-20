// Ray — canlı kapışmayı GERÇEK Firebase'e (ray-metro) karşı uçtan uca dener: iki anonim istemci (iki Playwright sayfası,
// window.__ligFake yok; B'nin yerel saati +3 sn kaymış). Denetlenen: aynı anda arayınca eşleşme, geri sayım farkı, aynı bulmaca,
// iki ekranda aynı kazanan ve puanlar, ikinci eşleşme. Sonunda iki istemci de Lig.leave() ile verilerini ve anonim hesabını siler.
// Sayfanın Google istekleri Node üzerinden gönderilir (vekil sunucu / sertifika ayarı Node'da): NODE_USE_ENV_PROXY=1 ile çalıştır.
// Kullanım: NODE_USE_ENV_PROXY=1 node tools/kapis-gercek.cjs [maç sayısı=2]
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'www'), N = +process.argv[2] || 2;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png' };
const serve = () => new Promise(res => { const s = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }); s.listen(0, '127.0.0.1', () => res(s)); });
const stars = Object.fromEntries(Array.from({ length: 29 }, (_, k) => [k + 1, 3]));
const SAVE = { played: 30, level: 30, stars, remindAsked: true, g11: 1, lastGift: Date.now(), sound: false, music: false, tut: 1 };
// Google istekleri Node'dan (sayfa yalnız sonucu görür)
async function relay(route) {
  const q = route.request();
  if (q.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
  const h = { ...q.headers() }; delete h.origin; delete h.referer; delete h['user-agent'];
  try {
    const r = await fetch(q.url(), { method: q.method(), headers: h, body: q.postData() || undefined, signal: AbortSignal.timeout(15e3) });
    return route.fulfill({ status: r.status, headers: { 'content-type': r.headers.get('content-type') || 'application/json', 'access-control-allow-origin': '*' }, body: Buffer.from(await r.arrayBuffer()) });
  } catch (e) { console.log('ağ hatası', q.method(), q.url().split('/documents')[1] || q.url().slice(0, 60), e.message); return route.abort(); }
}
(async () => {
  const server = await serve(), URL = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();
  const mk = async (nick, skew) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'tr-TR' });
    await ctx.route(/https:\/\/(firestore|identitytoolkit|securetoken)\.googleapis\.com\//, relay);
    await ctx.addInitScript(`window.__plog = []; const __f = window.fetch; window.fetch = (u, o) => { const t = Date.now(), k = (o?.method || 'GET') + ' ' + String(u).split('/documents')[1]?.slice(0, 40); return __f(u, o).then(r => { window.__plog.push([t % 100000, Date.now() - t, k, r.status]); window.__plog = window.__plog.slice(-60); if (r.status >= 400) r.clone().text().then(b => window.__plog.push(['body', b.slice(0, 300)])); return r; }, e => { window.__plog.push([t % 100000, Date.now() - t, k, 'ERR ' + e.name]); throw e; }); }; window.__ligFake = false; window.__noFest = true; window.__noRec = true; window.__noIntro = true;${skew ? 'const __n = Date.now; Date.now = () => __n.call(Date) + 3000;' : ''}`);
    const page = await ctx.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(URL); await page.evaluate(s => localStorage.setItem('ray', JSON.stringify(s)), SAVE); await page.reload(); await page.waitForTimeout(800);
    await page.evaluate(n => window.Lig.join(n), nick);
    return { ctx, page, errors };
  };
  const A = await mk('Robot Deneme A'), B = await mk('Robot Deneme B', true), P = [A.page, B.page];
  const solve = async page => { for (let r = 0; r < 30; r++) { const taps = await page.evaluate(() => { const { G, rot } = window.__ray, out = []; if (!G || G.won) return out;
    G.cur.forEach((v, i) => { if (G.fixed[i]) return; let k = 0, t = v; while (t !== G.sol[i] && k < 4) { t = rot(t); k++; } for (let q = 0; q < k; q++) out.push(i); }); return out; });
    if (!taps.length) break;
    for (const i of taps) { const xy = await page.evaluate(i => { const { G, geo } = window.__ray, r = document.getElementById('cv').getBoundingClientRect();
      return { x: r.left + geo.ox + (i % G.cols) * geo.s + geo.s / 2, y: r.top + geo.oy + (i / G.cols | 0) * geo.s + geo.s / 2 }; }, i); await page.mouse.click(xy.x, xy.y); } } };
  const pts = () => Promise.all(P.map(p => p.evaluate(() => JSON.parse(localStorage.getItem('ray.lig')).pts || 0)));
  const out = [];
  let p0 = await pts();
  try {
  for (let i = 0; i < N; i++) {
    if (i === 0) await Promise.all(P.map(p => p.evaluate(() => { window.__ray.lig.vs(); window.__ray.lig.find(); })));
    else await Promise.all(P.map(p => p.evaluate(() => { if (document.getElementById('vAgain')) document.getElementById('vAgain').click(); else { window.__ray.lig.vs(); window.__ray.lig.find(); } })));
    const t0 = Date.now();
    const ok = await Promise.all(P.map(p => p.waitForFunction(() => window.__ray.G?.duel && document.getElementById('game').classList.contains('active') && !document.getElementById('modal').classList.contains('open'), null, { timeout: 45000 }))).then(() => true, () => false);
    if (!ok) { out.push({ i, matched: false }); break; }
    const info = await Promise.all(P.map(p => p.evaluate(() => ({ go: window.__ray.vsGo(), sig: window.__ray.G.sig, id: window.__ray.G.duel.id, ghost: !!window.__ray.G.duel.opp.ghost, skew: window.Lig.duel._skew?.() }))));
    await solve(P[i % 2]);
    const res = await Promise.all(P.map(p => p.waitForFunction(() => document.getElementById('vrPts')?.classList.contains('done'), null, { timeout: 30000 })
      .then(() => p.evaluate(() => ({ win: document.querySelector('.vres').classList.contains('win'), cards: [...document.querySelectorAll('.vr-p')].map(c => c.querySelector('b').textContent + ' ' + c.querySelector('em').textContent) }))).catch(e => p.evaluate(() => ({ err: 'zaman aşımı', over: window.__ray.G?.duelOver, won: window.__ray.G?.won, scr: document.body.dataset.scr, modal: document.getElementById('mCard').textContent.slice(0, 120), bar: document.getElementById('vsOpp').style.cssText })))));
    if (res.some(x => x.err)) console.log('kayıt:', JSON.stringify(await Promise.all(P.map(p => p.evaluate(() => window.__plog.filter(x => !String(x[2]).startsWith('GET')))))));
    await P[0].waitForTimeout(2500);
    const p1 = await pts();
    out.push({ i, matched: true, wait: Date.now() - t0, goDiff: Math.round(Math.abs(info[0].go - info[1].go)), sameSig: info[0].sig === info[1].sig, sameMatch: info[0].id === info[1].id, ghost: info.some(x => x.ghost), skew: info.map(x => x.skew), winnerShouldBe: i % 2 ? 'B' : 'A', res, dPts: [p1[0] - p0[0], p1[1] - p0[1]] });
    p0 = p1;
    console.log(JSON.stringify(out.at(-1)));
  }
  } catch (e) { console.log('hata:', e.message); }
  const pass = out.length === N && out.every(r => r.matched && !r.ghost && r.sameSig && r.sameMatch && r.goDiff < 150 && r.res[0].win === (r.winnerShouldBe === 'A') && r.res[1].win === (r.winnerShouldBe === 'B')
    && r.dPts.join() === (r.winnerShouldBe === 'A' ? '10,2' : '2,10'));
  // temizlik: iki istemci de ligden çıkar (tablo, kullanıcı, kuyruk, kayıtlı oyunlar ve anonim hesap silinir)
  const uids = await Promise.all(P.map(p => p.evaluate(() => window.Lig.me().uid)));
  await Promise.all(P.map(p => p.evaluate(() => window.Lig.leave())));
  console.log('temizlendi:', uids.join(', '), '· hatalar:', JSON.stringify([...A.errors, ...B.errors]));
  console.log(pass ? 'GEÇTİ' : 'KALDI');
  await browser.close(); server.close(); process.exit(pass ? 0 : 1);
})();
