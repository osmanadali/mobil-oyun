// Ray — otomatik hakem (test robotu).
// Oyunu gerçek tarayıcıda oynar, ölçer, ekran görüntüsü alır.
// Kullanım: node tools/hakem.cjs [--strict]
// Çıktı: hakem-out/metrics.json, hakem-out/ozet.md, hakem-out/shots/*.png
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..', 'www');
const OUT = process.env.HAKEM_OUT || path.join(__dirname, '..', 'hakem-out');
const SHOTS = path.join(OUT, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png' };
function serve() {
  return new Promise(res => {
    const s = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-cache' });
      fs.createReadStream(f).pipe(r);
    });
    s.listen(0, '127.0.0.1', () => res(s));
  });
}

const checks = [], metrics = {};
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const TODAY = ymd(new Date()), YDAY = ymd(new Date(Date.now() - 864e5)), DAY2 = ymd(new Date(Date.now() - 2 * 864e5));
const starsUpTo = (l, v = 3) => Object.fromEntries(Array.from({ length: l - 1 }, (_, k) => [k + 1, v]));   // 1..l-1 bölümleri
function check(id, name, pass, detail = '', severity = 'high') {
  checks.push({ id, name, pass: !!pass, detail: String(detail), severity });
  console.log(`${pass ? '✓' : '✗'} [${severity}] ${name}${detail ? ' — ' + detail : ''}`);
}

// Capacitor eklentilerinin sahtesi: reklam, titreşim, paylaşım çağrılarını kaydeder.
const MOCK = `
  window.__noIntro = !window.__withIntro;
  window.__log = { ads: [], hap: 0, share: [], raf: 0, errors: [] };
  const _raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = cb => { window.__log.raf++; return _raf(cb); };
  if (!window.__noCap) window.Capacitor = { Plugins: {
    AdMob: (() => { const L = {}, emit = e => (L[e] || []).slice().forEach(f => f({}));
      return { addListener: (e, f) => { (L[e] = L[e] || []).push(f); return Promise.resolve({ remove() { L[e] = L[e].filter(x => x !== f); } }); },
        initialize: async () => {}, prepareInterstitial: async () => {}, prepareRewardVideoAd: async () => {},
        showInterstitial: async () => { window.__log.ads.push('interstitial'); setTimeout(() => emit('interstitialAdDismissed'), 50); },
        showRewardVideoAd: async () => { window.__log.ads.push('rewarded'); setTimeout(() => { emit('onRewardedVideoAdReward'); emit('onRewardedVideoAdDismissed'); }, 50); return { type: 'hint', amount: 2 }; } }; })(),
    Haptics: { impact() { window.__log.hap++; }, notification() { window.__log.hap++; } },
    Share: { share: async o => { window.__log.share.push(o.text); } } } };
  // günlük hatırlatma (yalnızca __withNotif ile; yoksa diğer senaryolarda izin penceresi araya girer)
  if (window.__withNotif && window.Capacitor) window.Capacitor.Plugins.LocalNotifications = { addListener() {},
    checkPermissions: async () => ({ display: 'prompt' }), requestPermissions: async () => ({ display: 'granted' }),
    cancel: async () => {}, schedule: async o => { window.__log.notif = o.notifications; } };
`;
// Google Play satın alma sahtesi (cordova-plugin-purchase): sipariş → hemen sahip olunur
const SHOP_MOCK = `window.CdvPurchase = (() => { let owned = false; const cb = {};
  const product = { id: 'ray_reklamsiz', canPurchase: true, pricing: { price: '₺59,99' }, getOffer: () => ({ order: async () => { owned = true; window.__log.bought = 1; (cb.r || []).forEach(f => f({})); } }) };
  const when = { approved() { return when; }, verified() { return when; }, productUpdated(f) { cb.p = [f]; return when; }, receiptUpdated(f) { cb.r = [f]; return when; } };
  return { ProductType: { NON_CONSUMABLE: 'nc' }, Platform: { GOOGLE_PLAY: 'gp' }, ErrorCode: { PAYMENT_CANCELLED: 1 },
    store: { register() {}, when: () => when, initialize: async () => { (cb.p || []).forEach(f => f(product)); return []; }, get: () => product, owned: () => owned, restorePurchases: async () => {} } }; })();`;

async function open(browser, url, { vp = [390, 844], scheme = 'dark', save = null, cap = true, init = '' } = {}) {
  const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] }, deviceScaleFactor: 2, colorScheme: scheme, hasTouch: true, isMobile: true });
  if (!cap) await ctx.addInitScript('window.__noCap = true');
  if (init) await ctx.addInitScript(init);
  await ctx.addInitScript(MOCK);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url);
  if (save) { await page.evaluate(s => localStorage.setItem('ray', JSON.stringify(s)), save); await page.reload(); }
  await page.waitForTimeout(300);
  return { ctx, page, errors };
}
const shot = (page, name) => page.screenshot({ path: path.join(SHOTS, name + '.png') });
const getSave = page => page.evaluate(() => JSON.parse(localStorage.getItem('ray') || '{}'));
const modalOpen = page => page.evaluate(() => document.getElementById('modal').classList.contains('open') || document.getElementById('game').classList.contains('won'));

async function tapTile(page, i) {
  const p = await page.evaluate(i => {
    const { G, geo } = window.__ray, r = document.getElementById('cv').getBoundingClientRect();
    return { x: r.left + geo.ox + (i % G.cols) * geo.s + geo.s / 2, y: r.top + geo.oy + (i / G.cols | 0) * geo.s + geo.s / 2 };
  }, i);
  await page.mouse.click(p.x, p.y);
}
// En kısa çözüm: her karoyu çözüm yönüne getirecek kadar dokun.
async function solve(page, gap = 25) {
  const taps = await page.evaluate(() => {
    const { G, rot } = window.__ray, out = [];
    G.cur.forEach((v, i) => { if (G.fixed[i]) return; let k = 0, t = v; while (t !== G.sol[i] && k < 4) { t = rot(t); k++; } for (let j = 0; j < k; j++) out.push(i); });
    return out;
  });
  for (const i of taps) { await tapTile(page, i); if (gap) await page.waitForTimeout(gap); }
  return taps.length;
}
async function waitModal(page, ms = 5000) {
  const t = Date.now();
  while (Date.now() - t < ms) { if (await modalOpen(page)) { await page.waitForTimeout(700); return true; } await page.waitForTimeout(100); }   // alt sayfa animasyonu bitsin
  return false;
}
async function inViewport(page, sel) {
  return page.evaluate(sel => {
    const el = document.querySelector(sel); if (!el) return { ok: false, why: 'yok' };
    const r = el.getBoundingClientRect();
    return { ok: r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight + 1 && r.right <= innerWidth + 1 && r.width > 0, w: Math.round(r.width), h: Math.round(r.height) };
  }, sel);
}

(async () => {
  const t0 = Date.now();
  const server = await serve();
  const URL = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();
  const FRESH_DONE = { played: 1 };   // nasıl oynanır penceresi kendiliğinden açılmasın

  // ---------- A. Üretici: çözülebilirlik + zorluk eğrisi ----------
  {
    const { ctx, page } = await open(browser, URL, { save: FRESH_DONE });
    const r = await page.evaluate(() => {
      const R = window.__ray, sizes = [[3, 3], [4, 4], [4, 5], [5, 6], [5, 7], [6, 8], [7, 9]], out = {};
      let bad = 0, pre = 0; const t = performance.now();
      for (const [c, r] of sizes) {
        let par = 0, junc = 0, ends = 0;
        for (let s = 1; s <= 300; s++) {
          const P = R.generate(c, r, s * 7919 + 13);
          if (!R.lit({ ...P, cur: P.sol }).solved) bad++;
          if (R.lit(P).solved) pre++;
          par += P.par;
          P.sol.forEach(m => { const k = (m & 1) + (m >> 1 & 1) + (m >> 2 & 1) + (m >> 3 & 1); if (k >= 3) junc++; if (k === 1) ends++; });
        }
        out[`${c}x${r}`] = { avgPar: +(par / 300).toFixed(1), junctionPct: +(junc / 300 / (c * r) * 100).toFixed(1), stationPct: +(ends / 300 / (c * r) * 100).toFixed(1) };
      }
      return { bad, pre, ms: Math.round(performance.now() - t), sizes: out };
    });
    metrics.generator = r;
    check('gen.solvable', 'Tüm üretilen bulmacalar çözülebilir (2100 örnek)', r.bad === 0, `${r.bad} hatalı`);
    check('gen.notPresolved', 'Hiçbir bulmaca çözülmüş gelmiyor', r.pre === 0, `${r.pre} hazır çözülü`);
    check('gen.fast', 'Üretim hızlı (2100 bulmaca < 2 sn)', r.ms < 2000, `${r.ms} ms`, 'low');
    await ctx.close();
  }

  // ---------- B. Ekran boyutları × tema: hata, taşma, ulaşılabilirlik, dokunma alanı ----------
  metrics.layout = {};
  for (const vp of [[360, 640], [390, 844], [412, 915]]) for (const scheme of ['dark', 'light']) {
    const key = `${vp[0]}x${vp[1]}-${scheme}`;
    const { ctx, page, errors } = await open(browser, URL, { vp, scheme, save: { level: 61, played: 3, streak: 2, lastDaily: YDAY, stars: starsUpTo(61) } });
    await page.waitForTimeout(1600);
    await shot(page, `home-${key}`);
    const ov = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight);
    const homeEls = {}; for (const s of ['#bPlay', '#bDaily', '#bSettings', '#bHow']) homeEls[s] = await inViewport(page, s);
    await page.click('#bPlay'); await page.waitForTimeout(700);
    await shot(page, `game7x9-${key}`);
    const gameEls = {}; for (const s of ['#bHint', '#bBack', '#bReset']) gameEls[s] = await inViewport(page, s);
    const tile = await page.evaluate(() => window.__ray.geo.s);
    const small = await page.evaluate(() => [...document.querySelectorAll('.btn,.ic')].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.height && (r.width < 44 || r.height < 44) && getComputedStyle(e.closest('.screen') || document.body).opacity !== '0'; }).map(e => e.id || e.className));
    metrics.layout[key] = { overflow: ov, tilePx: tile, homeEls, gameEls, smallTargets: small };
    const off = [...Object.entries(homeEls), ...Object.entries(gameEls)].filter(([, v]) => !v.ok).map(([k]) => k);
    check(`layout.${key}`, `${key}: hata yok, taşma yok, düğmeler ekranda`, !errors.length && !ov && !off.length, [errors.join(' | '), ov ? 'taşma' : '', off.join(',')].filter(Boolean).join(' · '));
    check(`tile.${key}`, `${key}: 7×9 ızgarada karo ≥ 44 px (başparmak)`, tile >= 44, `${tile} px`, 'medium');
    await ctx.close();
  }

  // ---------- C. İlk açılış + 12 bölüm oynanış + geçiş reklamı ----------
  {
    const { ctx, page, errors } = await open(browser, URL);
    await page.waitForTimeout(2200);
    const howOpen = await modalOpen(page);
    await shot(page, 'onboarding');
    const cap1 = await page.textContent('#demoTxt').catch(() => ''); await page.waitForTimeout(3700); const cap2 = await page.textContent('#demoTxt').catch(() => '');
    await shot(page, 'onboarding-demo');
    check('onboard.auto', 'İlk açılışta "Nasıl oynanır" kendiliğinden açılıyor', howOpen, '', 'medium');
    check('onboard.demo', 'Nasıl oynanır: sayfa kendi sahnesini oynayıp ~3 sn sonra kendiliğinden geçiyor', !!cap1 && !!cap2 && cap1 !== cap2, `"${cap1}" → "${cap2}"`, 'medium');
    // kilit: dışarı dokunmak kapatmaz · kaydırma: sola → sonraki sayfa
    await page.mouse.click(195, 30); await page.waitForTimeout(400);
    const drag = async sel => { const b = await page.locator(sel).boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2 + 260, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(600); };
    await drag('.sheet h2');
    const lockOpen = await modalOpen(page), capA = await page.textContent('#demoTxt');
    const bx = await page.locator('.demobox').boundingBox();
    await page.mouse.move(bx.x + bx.width * .8, bx.y + bx.height / 2); await page.mouse.down();
    await page.mouse.move(bx.x + bx.width * .2, bx.y + bx.height / 2, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(450);
    const capB = await page.textContent('#demoTxt');
    check('onboard.swipe', 'Anlatıcı parmakla kaydırılıyor (sola → sonraki sayfa)', capA !== capB, `"${capA}" → "${capB}"`, 'medium');
    let fwd = 0;
    while (fwd < 10 && !/Hadi|Tamam/.test(await page.textContent('#mClose'))) { await page.click('#mClose'); fwd++; await page.waitForTimeout(250); }
    await shot(page, 'onboarding-last');
    check('onboard.lock', 'Anlatıcı son sayfaya gelmeden kapanmıyor (dışarı dokunma, aşağı çekme); "İleri" sayfa sayfa ilerler', lockOpen && await modalOpen(page) && fwd >= 3 && fwd <= 6, `${fwd} kez İleri`, 'medium');
    if (howOpen) await page.click('#mClose');
    await page.waitForTimeout(600);
    const inGame = await page.evaluate(() => document.getElementById('game').classList.contains('active'));
    check('onboard.start', '"Başla" doğrudan Bölüm 1\'i açıyor', inGame, '', 'medium');
    if (!inGame) { await page.click('#bPlay'); await page.waitForTimeout(500); }
    const lv = [];
    for (let L = 1; L <= 12; L++) {
      const t = Date.now();
      const st = await page.evaluate(() => ({ lvl: window.__ray.G.lvl, par: window.__ray.G.par, size: window.__ray.G.cols + 'x' + window.__ray.G.rows }));
      const taps = await solve(page, 15);
      const won = await waitModal(page);
      const stars = await page.evaluate(() => document.querySelectorAll('.stars svg.on').length);
      lv.push({ ...st, taps, won, stars, ms: Date.now() - t });
      if (L === 1) {
        await shot(page, 'win-sheet');
        // sonuç paneli tahtayı örtmemeli; "Hattı gör" tahtayı büyütmeli
        const vis = () => page.evaluate(() => { const { G, geo } = window.__ray, bd = document.getElementById('board').getBoundingClientRect(), wp = document.getElementById('winPanel').getBoundingClientRect();
          const bottom = bd.top + geo.oy + geo.s * G.rows; return { s: geo.s, boardBottom: Math.round(bottom), panelTop: Math.round(wp.top), top: Math.round(bd.top + geo.oy) }; });
        const v1 = await vis();
        await page.click('#wTog'); await page.waitForTimeout(700);
        const v2 = await vis(); await shot(page, 'win-mini');
        const rowHidden = await page.evaluate(() => getComputedStyle(document.querySelector('#winPanel .row2')).display === 'none' && getComputedStyle(document.getElementById('bReset')).visibility === 'hidden');
        check('win.miniRow', '"Hattı gör": Tekrar/Paylaş/Ana sayfa gizlenir, üstteki ↺ bitişte gizli', rowHidden, '', 'medium');
        await page.click('#wTog'); await page.waitForTimeout(600);
        metrics.winView = { full: v1, mini: v2 };
        check('win.visible', 'Kazanınca tamamlanan hat görünür (panel tahtayı örtmez)', v1.boardBottom <= v1.panelTop + 1 && v1.s >= 40, JSON.stringify(v1));
        check('win.mini', '"Hattı gör" paneli küçültüp tahtayı büyütür', (v1.s >= 96 || v2.s > v1.s) && v2.boardBottom <= v2.panelTop + 1, `${v1.s} → ${v2.s} px`, 'medium');
      }
      if (!won) {
        lv[lv.length - 1].diag = await page.evaluate(() => { const { G } = window.__ray; return { lvl: G.lvl, won: G.won, solved: G.L.solved, lit: G.L.n, tiles: G.cur.length, wrong: G.cur.filter((v, i) => v !== G.sol[i]).length, moves: G.moves, modal: document.getElementById('modal').className, active: document.querySelector('.screen.active').id }; });
        await shot(page, `fail-level-${L}`);
        break;
      }
      if (L === 10) {
        const h0 = (await getSave(page)).hints, has = await page.$('#mDbl');
        if (has) { await page.click('#mDbl'); await page.waitForTimeout(900); }
        const h1 = (await getSave(page)).hints, ok = await page.$('.dblok');
        await shot(page, 'win-double');
        check('reward.double', 'Hat sonu ödülü: "▶ 2 katı" videosuyla +2 ipucu daha (bir kez)', !!has && h1 === h0 + 2 && !!ok, `${h0} → ${h1}`, 'medium');
      }
      await page.click('#mNext'); await page.waitForTimeout(450);
    }
    const s = await getSave(page), log = await page.evaluate(() => window.__log);
    metrics.playthrough = { levels: lv, ads: log.ads, haptics: log.hap };
    check('play.12', '12 bölüm art arda çözülüp kazanılıyor', lv.length === 12 && lv.every(l => l.won), `${lv.filter(l => l.won).length}/12`);
    check('play.perfect', 'Kusursuz çözüm: 3★ + 👑 + ipucu parçası', Object.keys(s.crowns || {}).length === 12 && (s.shards || 0) === 0, `👑 ${Object.keys(s.crowns || {}).length} · parça ${s.shards}`, 'medium');
    check('play.stars', 'Hedef hamlede çözünce 3 yıldız', lv.every(l => l.stars === 3), lv.map(l => l.stars).join(''), 'medium');
    check('play.save', 'İlerleme kaydediliyor (seviye 13)', s.level === 13, `level=${s.level}`);
    check('ads.inter', 'Geçiş reklamı 8. bölüm sonrası 1 kez (90 sn aralık kuralı)', log.ads.filter(a => a === 'interstitial').length === 1, JSON.stringify(log.ads), 'medium');
    check('haptic', 'Dokunsal geri bildirim tetikleniyor', log.hap > 20, `${log.hap} titreşim`, 'medium');
    check('play.errors', 'Oynanış boyunca konsol hatası yok', !errors.length, errors.join(' | '));
    await ctx.close();
  }

  // ---------- D. Günün Hattı + seri + paylaşım ----------
  {
    const { ctx, page } = await open(browser, URL, { save: { played: 4, streak: 3, lastDaily: YDAY, dailyDone: YDAY, hints: 3, hintDay: TODAY } });
    await page.click('#bDaily'); await page.waitForTimeout(500);
    await solve(page, 10);
    const won = await waitModal(page);
    await shot(page, 'daily-win');
    if (won) { await page.click('#mShare'); await page.waitForTimeout(200); }
    const s = await getSave(page), log = await page.evaluate(() => window.__log);
    check('daily.win', 'Günün Hattı çözülüyor', won);
    check('daily.streak', 'Seri dün → bugün artıyor (3 → 4)', s.streak === 4, `streak=${s.streak}`);
    check('daily.hint', 'Günlük ödül +1 ipucu', s.hints === 4, `hints=${s.hints}`, 'medium');
    check('share', 'Paylaşım metni oluşuyor', log.share.length === 1 && /Günün Hattı/.test(log.share[0]), (log.share[0] || '').replace(/\n/g, ' ⏎ '), 'medium');
    metrics.shareText = log.share[0] || null;
    if (won) { await page.click('#mHome'); await page.waitForTimeout(600); }
    await shot(page, 'home-after-daily');
    await ctx.close();
  }

  // ---------- E. İpucu + ödüllü reklam + çevrimdışı ----------
  {
    const today = TODAY;
    const { ctx, page } = await open(browser, URL, { save: { played: 4, level: 20, hints: 1, hintDay: today, stars: starsUpTo(20) } });
    await page.click('#bPlay'); await page.waitForTimeout(500);
    await page.click('#bHint'); await page.waitForTimeout(500);
    const h = await page.evaluate(() => { const G = window.__ray.G; const i = G.fixed.indexOf(true); return { fixed: G.fixed.filter(Boolean).length, correct: i >= 0 && G.cur[i] === G.sol[i] }; });
    check('hint.use', 'İpucu bir karoyu doğru yöne sabitliyor', h.fixed === 1 && h.correct, JSON.stringify(h));
    await shot(page, 'hint-used');
    await page.click('#bHint'); await page.waitForTimeout(500);
    const adSheet = await page.$('#mAd');
    await shot(page, 'hint-ad-offer');
    if (adSheet) { await page.click('#mAd'); await page.waitForTimeout(600); }
    const s = await getSave(page), log = await page.evaluate(() => window.__log);
    // kademeli reklam: aynı bölümde 2. ipucu seti için 2 video (her biri kullanıcının basışıyla)
    await page.click('#bHint'); await page.waitForTimeout(350); await page.click('#bHint'); await page.waitForTimeout(350);
    await page.click('#bHint'); await page.waitForTimeout(400);
    const offer2 = await page.evaluate(() => document.querySelector('#mAd small')?.textContent || '');
    await shot(page, 'ad-tier2');
    let cont = '';
    if (await page.$('#mAd')) { await page.click('#mAd'); await page.waitForTimeout(700); cont = await page.evaluate(() => document.querySelector('#mAd span')?.textContent || ''); if (cont) { await page.click('#mAd'); await page.waitForTimeout(700); } }
    const s2 = await getSave(page), adsN = (await page.evaluate(() => window.__log.ads)).filter(a => a === 'rewarded').length;
    check('ads.tier', 'Aynı bölümde 2. ipucu için 2 video (~30 sn), 2. videoyu oyuncu başlatır', /30 sn · 2 video/.test(offer2) && /2\. video/.test(cont) && adsN === 3 && s2.hints === 2, `teklif "${offer2}" · devam "${cont}" · reklam ${adsN} · ipucu ${s2.hints}`, 'high');
    check('ads.reward', 'İpucu bitince ödüllü reklam → +2 ipucu', !!adSheet && log.ads.includes('rewarded') && s.hints === 2, `hints=${s.hints} ads=${JSON.stringify(log.ads)}`);
    await ctx.close();
    // çevrimdışıyken reklam teklifi çıkmamalı
    const o = await open(browser, URL, { save: { played: 4, level: 20, hints: 0, hintDay: today, stars: starsUpTo(20) } });
    await o.ctx.setOffline(true);
    await o.page.click('#bPlay'); await o.page.waitForTimeout(400);
    await o.page.click('#bHint'); await o.page.waitForTimeout(500);
    const offAd = await o.page.$('#mAd');
    const toast = await o.page.textContent('#toast');
    check('ads.offline', 'İnternet yokken reklam teklifi yok, nazik uyarı var', !offAd && /İpucu/.test(toast), toast);
    await o.ctx.close();
  }

  // ---------- E2. Süre → yıldız, hat kilidi, Hatlar ekranı, yarım oyunu sürdürme ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 4, level: 5, stars: starsUpTo(5) } });
    await page.click('#bPlay'); await page.waitForTimeout(400);
    const pill0 = await page.evaluate(() => document.querySelectorAll('#gStars i.on').length);
    const mus0 = await page.evaluate(() => window.__ray.music());
    await page.evaluate(() => { const G = window.__ray.G; G.ms = (G.lim.t - 5) * 1000; });
    await page.waitForTimeout(400);
    const mus1 = await page.evaluate(() => window.__ray.music());
    // 3★ süresini aş → gösterge 2★'a düşmeli, çözünce en fazla 2★
    await page.evaluate(() => { const G = window.__ray.G; G.ms += (G.lim.t + 1) * 1000; });
    await page.waitForTimeout(400);
    const pill1 = await page.evaluate(() => document.querySelectorAll('#gStars i.on').length);
    const next = await page.textContent('#gNext');
    const mus2 = await page.evaluate(() => window.__ray.music());
    check('music.tension', 'Oyun müziği: başta sakin → kademeli hızlanır, son 10 sn kalp atışı, süre geçince düşmeden hızlanmaya devam', mus0.on && mus0.mode === 'game' && mus0.tension === 0 && mus1.alarm && mus1.tension >= .5 && !mus2.alarm && mus2.tension > mus1.tension, `${mus0.mode} ${mus0.tension} → ${mus1.tension}${mus1.alarm ? '♥' : ''} → ${mus2.tension}${mus2.alarm ? '♥' : ''}`, 'medium');
    await shot(page, 'timer-2star');
    await solve(page, 15); await waitModal(page);
    const st = await page.evaluate(() => document.querySelectorAll('.stars svg.on').length);
    check('time.stars', 'Süre hedefi kaçınca ⏱ yıldızı söner, sonuç 2★ (gösterge + sonuç)', pill0 === 3 && pill1 === 2 && st === 2, `başta ${pill0}★ → süre aşımı ${pill1}★ → sonuç ${st}★ · "${next}"`);
    await shot(page, 'win-2star');
    const ms = await page.evaluate(() => { const l = window.__ray.G.lvl; return JSON.parse(localStorage.getItem('ray')).miss?.[l]; });
    check('miss.track', 'Kaçan hedef kaydediliyor (⏱ kaç sn geç, ↻ kaç hamle fazla)', Array.isArray(ms) && ms[0] >= 1 && ms[1] === 0, JSON.stringify(ms), 'medium');
    await ctx.close();

    // süre yalnızca oyun ekranında akmalı + geri dönünce kaldığı yerden sürmeli
    const r = await open(browser, URL, { save: { played: 4, level: 12, stars: starsUpTo(12) } });
    await r.page.click('#bPlay'); await r.page.waitForTimeout(300);
    for (const i of [0, 1, 2]) await tapTile(r.page, i);
    await r.page.click('#bBack'); await r.page.waitForTimeout(300);
    const t1 = await r.page.evaluate(() => window.__ray.G.ms);
    await r.page.waitForTimeout(1500);
    const t2 = await r.page.evaluate(() => window.__ray.G.ms);
    await r.page.reload(); await r.page.waitForTimeout(300);
    await r.page.click('#bPlay'); await r.page.waitForTimeout(300);
    const resumed = await r.page.evaluate(() => ({ lvl: window.__ray.G.lvl, moves: window.__ray.G.moves, ms: window.__ray.G.ms }));
    for (let k = 0; k < 3; k++) await tapTile(r.page, 5);
    const m3 = await r.page.evaluate(() => window.__ray.G.moves);
    await tapTile(r.page, 6); await tapTile(r.page, 5);
    const m5 = await r.page.evaluate(() => window.__ray.G.moves);
    check('moves.rule', 'Aynı karoya art arda 3 dokunuş = 1 hamle; başka karodan dönünce yeni hamle', m3 === resumed.moves + 1 && m5 === m3 + 2, `${resumed.moves} → ${m3} → ${m5}`, 'high');
    check('timer.pause', 'Ana sayfadayken süre durur', t2 === t1, `${t1} → ${t2} ms`, 'medium');
    check('resume', 'Yarım bölüm uygulama kapanınca bile kaldığı yerden sürer', resumed.lvl === 12 && resumed.moves === 3 && resumed.ms >= t1 - 5, JSON.stringify(resumed), 'medium');
    await r.ctx.close();

    // yıldız kapısı: M2 için ★22 gerekli
    const g = await open(browser, URL, { save: { played: 10, level: 11, stars: { ...starsUpTo(11, 2), 5: 3 } } });   // ★21 / 22
    await g.page.click('#bPlay'); await g.page.waitForTimeout(500);
    const lockedOk = !!(await g.page.$('#mMap')) && !(await g.page.evaluate(() => document.getElementById('game').classList.contains('active')));
    await shot(g.page, 'gate-locked');
    await g.page.click('#mMap'); await g.page.waitForTimeout(600);
    const map = await g.page.evaluate(() => ({ lines: document.querySelectorAll('.line').length, open: document.querySelectorAll('.lv:not([disabled])').length, locked: document.querySelectorAll('.line.lockd').length }));
    await shot(g.page, 'map');
    await g.page.click('.lv[data-l="3"]'); await g.page.waitForTimeout(500);
    const replay = await g.page.evaluate(() => window.__ray.G?.lvl);
    await solve(g.page, 15); await waitModal(g.page);
    const after = await getSave(g.page);
    const sum = Object.values(after.stars).reduce((a, b) => a + b, 0);
    await shot(g.page, 'gate-unlock');
    const badge = await g.page.textContent('.badge').catch(() => '');
    check('gate.lock', 'Yetersiz yıldızda yeni hat kilitli (★21/22)', lockedOk, '', 'high');
    check('map', 'Hatlar ekranı: açık bölümler seçilebilir, kilitli hat görünür', map.open === 10 && map.locked >= 1 && replay === 3, JSON.stringify({ ...map, replay }), 'high');
    check('gate.replay', 'Eski bölümü 3★ yapınca (★22) yeni hat açılır', sum === 22 && /YENİ HAT/.test(badge || ''), `★${sum} · rozet: ${badge || '-'}`, 'medium');
    check('e2.errors', 'Bu senaryolarda konsol hatası yok', !errors.length && !r.errors.length && !g.errors.length, [...errors, ...r.errors, ...g.errors].join(' | '));
    await g.ctx.close();
  }

  // ---------- E3. Seri penceresi, müzik ayarı, açılış intro'su ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 9, streak: 3, best: 5, lastDaily: YDAY, dailyLog: [YDAY, ymd(new Date(Date.now() - 2 * 864e5)), ymd(new Date(Date.now() - 3 * 864e5))] } });
    await page.click('#streakChip'); await page.waitForTimeout(600);
    const w = await page.evaluate(() => ({ cells: document.querySelectorAll('.week i').length, on: document.querySelectorAll('.week i.on').length, title: document.querySelector('.sheet h2')?.textContent }));
    await shot(page, 'streak-sheet');
    check('streak.sheet', 'Seri rozetine dokununca 7 günlük seri penceresi', w.cells === 7 && w.on === 3 && /3 gün/.test(w.title), JSON.stringify(w), 'medium');
    await page.click('#mPlayD').catch(() => {}); await page.waitForTimeout(300);
    await page.click('#bBack').catch(() => {}); await page.waitForTimeout(300);
    await page.click('#bSettings'); await page.waitForTimeout(500);
    const hasM = !!(await page.$('#oM')); if (hasM) await page.click('#oM');
    const mus = (await getSave(page)).music;
    await shot(page, 'settings');
    check('music', 'Ayarlarda Müzik anahtarı çalışıyor', hasM && mus === false, `music=${mus}`, 'medium');
    await ctx.close();
    const ictx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'dark' });
    await ictx.addInitScript('window.__withIntro = true;'); await ictx.addInitScript(MOCK);
    const ip = await ictx.newPage(), ierr = []; ip.on('pageerror', e => ierr.push(e.message));
    await ip.goto(URL); await ip.waitForTimeout(1500);
    const showing = await ip.evaluate(() => !document.getElementById('intro').classList.contains('gone'));
    await shot(ip, 'intro');
    await ip.waitForTimeout(2000);
    const gone = await ip.evaluate(() => document.getElementById('intro').classList.contains('gone'));
    check('intro', 'Açılışta intro oynar ve kendiliğinden kapanır', showing && gone, `görünür:${showing} kapandı:${gone}`, 'medium');
    check('e3.errors', 'Seri/müzik/intro senaryosunda konsol hatası yok', !errors.length && !ierr.length, [...errors, ...ierr].join(' | '));
    await ictx.close();
  }

  // ---------- E4. Yeni kural: sabit karolar (M4, bölüm 31+) ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 30, level: 31, stars: starsUpTo(31) } });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    const card = await page.evaluate(() => ({ open: document.getElementById('modal').classList.contains('open'), txt: document.querySelector('.sheet h2')?.textContent, timerPaused: !window.__ray.G.runAt }));
    await shot(page, 'rule-card');
    if (card.open) await page.click('#mGo');
    await page.waitForTimeout(400);
    const g = await page.evaluate(() => { const G = window.__ray.G; return { size: G.cols + 'x' + G.rows, pins: G.pinned.filter(Boolean).length, idx: G.pinned.indexOf(true) }; });
    const st = i => page.evaluate(i => ({ m: window.__ray.G.moves, v: window.__ray.G.cur[i] }), i);
    const before = await st(g.idx); await tapTile(page, g.idx); await page.waitForTimeout(200); const after = await st(g.idx);
    await shot(page, 'pinned');
    await solve(page, 10); const won = await waitModal(page);
    const sv = await getSave(page);
    const sizes = await page.evaluate(() => [30, 31, 33, 34, 40, 41].map(l => window.__ray.sizeFor(l).join('x')).join(' '));
    check('rule.card', 'M4 ilk girişte "YENİ KURAL · Sabit karo" kartı, kart açıkken süre durur', card.open && /Sabit karo/.test(card.txt || '') && card.timerPaused && sv.seen?.[3] === 1, JSON.stringify(card));
    check('rule.pins', 'Sabit karolar dönmez, hamle saymaz; bölüm çözülür', g.pins >= 5 && before.m === after.m && before.v === after.v && won, JSON.stringify({ ...g, before, after, won }), 'high');
    check('rule.saw', 'Testere dişi: M4 ilk 3 bölüm bir küçük ızgara (5×6), sonra 5×7', sizes === '5x7 5x6 5x6 5x7 5x7 6x8', sizes, 'medium');
    check('e4.errors', 'Sabit karo senaryosunda konsol hatası yok', !errors.length, errors.join(' | '));
    await ctx.close();
  }

  // ---------- E5. Renk temaları (👑), günlük hatırlatma, reklamsız paket ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 12, level: 13, stars: { ...starsUpTo(10), 10: 2, 11: 1, 12: 2 }, crowns: starsUpTo(10, 1), miss: { 10: [4, 0], 11: [3, 2], 12: [0, 5] } }, init: 'window.__withNotif = true;\n' + SHOP_MOCK });
    // temalar: 9 👑 → Gün Batımı (3) ve Okyanus (8) açık, Neon (15) kilitli
    await page.click('#crownChip'); await page.waitForTimeout(500);
    const acc0 = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--acc').trim());
    await page.click('.skin[data-k=neon]'); await page.waitForTimeout(350);
    // kilitli tema → "Taç topla": kusursuz olmayan bölümler yıldızlarıyla, kusursuza en yakın önce
    const hunt = await page.evaluate(() => [...document.querySelectorAll('#hunt .hrow')].map(b => b.textContent));
    await shot(page, 'crown-hunt');
    check('skin.hunt', 'Taç yetmeyince kusursuz olmayan bölümler yıldızları ve kaçan hedefiyle listeleniyor (en yakın önce)', hunt.join(',') === '10★★☆⏱ 4 sn geç,12★★☆↻ 5 hamle fazla,11★☆☆⏱ 3 sn geç · ↻ 2 hamle fazla', hunt.join(','), 'medium');
    await page.click('#mBack'); await page.waitForTimeout(350);
    const neonLocked = await page.evaluate(() => !document.querySelector('.skin[data-k=neon]').classList.contains('on'));
    await page.click('.skin[data-k=ocean]'); await page.waitForTimeout(400);
    await shot(page, 'skins');
    const sk = await page.evaluate(() => ({ acc: getComputedStyle(document.documentElement).getPropertyValue('--acc').trim(), sel: JSON.parse(localStorage.getItem('ray')).skin, open: document.querySelectorAll('.skin:not(.lockd)').length }));
    await page.click('#mClose'); await page.waitForTimeout(400);
    await page.click('#bPlay'); await page.waitForTimeout(600);
    const lineCol = await page.evaluate(() => window.__ray.G.color);
    await shot(page, 'skin-game');
    check('skin.pick', 'Renk temaları: 👑 ile açılan tema seçiliyor, kilitli tema seçilmiyor, oyuna yansıyor', sk.sel === 'ocean' && sk.acc !== acc0 && neonLocked && sk.open === 3 && lineCol === '#4fa3ff', JSON.stringify({ ...sk, acc0, lineCol }), 'medium');
    // hatırlatma: oyundan ana sayfaya dönünce bir kez sorulur → izin → bildirimler planlanır
    await page.click('#bBack'); await page.waitForTimeout(1300);
    const asked = await page.evaluate(() => /Hatırlatayım/.test(document.querySelector('.sheet h2')?.textContent || '') && document.getElementById('modal').classList.contains('open'));
    await shot(page, 'remind-ask');
    if (asked) { await page.click('#mYes'); await page.waitForTimeout(500); }
    const nt = await page.evaluate(() => ({ n: window.__log.notif?.length || 0, titles: (window.__log.notif || []).map(x => x.title), on: JSON.parse(localStorage.getItem('ray')).remind }));
    check('remind', 'Günlük hatırlatma: ana sayfada bir kez sorulur, izinle 3–4 bildirim planlanır', asked && nt.on && nt.n >= 3, JSON.stringify(nt), 'medium');
    // reklamsız paket: ayarlar → satın al → +20 ipucu, Altın tema, geçiş reklamı yok
    const dragClose = async () => { const b = await page.locator('.sheet h2').boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + 10); await page.mouse.down(); await page.mouse.move(b.x + b.width / 2, b.y + 250, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(600); return !(await page.evaluate(() => document.getElementById('modal').classList.contains('open'))); };
    await page.click('#bSettings'); await page.waitForTimeout(500); const c1 = await dragClose();
    await page.click('#crownChip'); await page.waitForTimeout(500); const c2 = await dragClose();
    check('sheet.swipe', 'Ayarlar ve Renk temaları aşağı kaydırınca kapanıyor', c1 && c2, `ayarlar ${c1} · temalar ${c2}`, 'medium');
    const h0 = (await getSave(page)).hints;
    await page.click('#bSettings'); await page.waitForTimeout(400); await page.click('#oShop'); await page.waitForTimeout(400);
    const price = await page.textContent('#mBuy').catch(() => '');
    await shot(page, 'shop');
    await page.click('#mBuy'); await page.waitForTimeout(600);
    const sv = await getSave(page);
    await page.click('#mClose').catch(() => {}); await page.waitForTimeout(300);
    await page.click('#bPlay'); await page.waitForTimeout(500);
    for (let k = 0; k < 4; k++) { await solve(page, 10); await waitModal(page); await page.click('#mNext'); await page.waitForTimeout(500); }   // 4. galibiyet normalde geçiş reklamı
    const ads = await page.evaluate(() => window.__log.ads.filter(a => a === 'interstitial').length);
    check('shop', 'Reklamsız paket: fiyat görünür, satın alınca +20 ipucu + Altın tema, geçiş reklamı çıkmaz', /59,99/.test(price) && sv.noAds && sv.hints === h0 + 20 && ads === 0, JSON.stringify({ price: price.trim(), noAds: sv.noAds, hints: [h0, sv.hints], ads }), 'medium');
    check('e5.errors', 'Tema / hatırlatma / mağaza senaryosunda konsol hatası yok', !errors.length, errors.join(' | '));
    await ctx.close();
  }

  // ---------- E6. Seriyi kurtar: dün kaçtı → bugün video (7+ gün: 2 video) ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 20, level: 21, stars: starsUpTo(21), streak: 8, best: 8, lastDaily: DAY2, dailyDone: DAY2, dailyLog: [DAY2], remindAsked: true } });
    await page.waitForTimeout(900);
    const sheet = await page.evaluate(() => ({ open: document.getElementById('modal').classList.contains('open'), h: document.querySelector('.sheet h2')?.textContent, dot: document.getElementById('streakChip').classList.contains('new'), streak: document.getElementById('sStreak').textContent }));
    await shot(page, 'rescue');
    for (let k = 0; k < 2; k++) { if (await page.$('#mSave')) { await page.click('#mSave'); await page.waitForTimeout(900); } }
    const sv = await getSave(page), ads = await page.evaluate(() => window.__log.ads.filter(a => a === 'rewarded').length);
    await page.click('#streakChip'); await page.waitForTimeout(500); await shot(page, 'rescue-week');
    const ice = await page.evaluate(() => !!document.querySelector('.week i.ice'));
    check('rescue', 'Seriyi kurtar: dün kaçınca bugün açılışta sorulur, 8 gün seride 2 video → seri 8 gün geri gelir', sheet.open && /8 günlük serin koptu/.test(sheet.h || '') && sheet.dot && sheet.streak === '0' && ads === 2 && sv.streak === 8 && sv.lastDaily === YDAY && !sv.lost && ice, JSON.stringify({ ...sheet, ads, streak: sv.streak, last: sv.lastDaily, ice }), 'medium');
    // seriyi kurtardıktan sonra Günün Hattı → 9 gün
    await page.click('#mPlayD').catch(() => {}); await page.waitForTimeout(600); await solve(page, 10); await waitModal(page);
    check('rescue.next', 'Kurtarılan seri bugünün hattıyla devam eder (8 → 9)', (await getSave(page)).streak === 9, String((await getSave(page)).streak), 'medium');
    check('e6.errors', 'Seri kurtarma senaryosunda konsol hatası yok', !errors.length, errors.join(' | '));
    await ctx.close();
  }

  // ---------- F. Boşta CPU: animasyon döngüsü durmalı ----------
  {
    const { ctx, page } = await open(browser, URL, { save: { played: 4, level: 30, stars: starsUpTo(30) } });
    await page.click('#bPlay'); await page.waitForTimeout(400);
    await tapTile(page, 0); await page.waitForTimeout(1500);
    const a = await page.evaluate(() => window.__log.raf); await page.waitForTimeout(2000);
    const b = await page.evaluate(() => window.__log.raf);
    metrics.idleRafPer2s = b - a;
    check('perf.idle', 'Boşta canvas çizimi duruyor (pil dostu)', b - a <= 2, `${b - a} kare / 2 sn`);
    await ctx.close();
  }

  // ---------- G. Düşük donanım: 4× yavaş CPU'da kare süresi ----------
  {
    const { ctx, page } = await open(browser, URL, { save: { played: 4, level: 61, stars: starsUpTo(61) } });
    await page.click('#bPlay'); await page.waitForTimeout(500);
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.evaluate(() => { window.__ft = []; let last = performance.now(); const loop = t => { window.__ft.push(t - last); last = t; if (window.__ft.length < 400) window.__rafOrig(loop); }; window.__rafOrig = window.requestAnimationFrame; window.__rafOrig(loop); });
    for (let k = 0; k < 30; k++) { await tapTile(page, (k * 7) % 63); await page.waitForTimeout(60); }
    await page.waitForTimeout(800);
    const ft = (await page.evaluate(() => window.__ft)).slice(5).sort((x, y) => x - y);
    const p = q => +ft[Math.min(ft.length - 1, Math.floor(ft.length * q))].toFixed(1);
    metrics.frameMs4x = { p50: p(.5), p95: p(.95), max: +ft[ft.length - 1].toFixed(1), n: ft.length };
    check('perf.frames', '4× yavaş CPU, 7×9 ızgara: p95 kare süresi < 34 ms (≥30 fps)', p(.95) < 34, `p50 ${p(.5)} · p95 ${p(.95)} ms`, 'medium');
    await ctx.close();
  }

  // ---------- H. Çevrimdışı açılış (service worker) ----------
  {
    const { ctx, page } = await open(browser, URL, { save: { played: 4 }, cap: false });
    const ready = await page.evaluate(() => navigator.serviceWorker ? Promise.race([navigator.serviceWorker.ready.then(() => true), new Promise(r => setTimeout(() => r(false), 5000))]) : false);
    await page.waitForTimeout(800);
    await ctx.setOffline(true);
    let ok = false, err = '';
    try { await page.reload({ timeout: 8000 }); await page.waitForTimeout(800); ok = await page.isVisible('#bPlay'); await page.click('#bPlay'); await page.waitForTimeout(400); ok = ok && await page.evaluate(() => !!window.__ray.G); }
    catch (e) { err = e.message.split('\n')[0]; }
    await shot(page, 'offline').catch(() => {});
    check('offline', 'İnternetsiz yeniden açılıyor ve oynanıyor', ready && ok, ready ? err : 'service worker hazır değil');
    await ctx.close();
  }

  // ---------- I. Boyut ----------
  {
    let bytes = 0; const walk = d => fs.readdirSync(d).forEach(f => { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : bytes += fs.statSync(p).size; });
    walk(ROOT); metrics.webBytes = bytes;
    check('size', 'Web paketi < 300 KB', bytes < 300e3, `${(bytes / 1024).toFixed(0)} KB`, 'low');
  }

  await browser.close(); server.close();
  const failed = checks.filter(c => !c.pass);
  metrics.durationSec = Math.round((Date.now() - t0) / 1000);
  fs.writeFileSync(path.join(OUT, 'metrics.json'), JSON.stringify({ when: new Date().toISOString(), checks, metrics }, null, 2));
  const md = [`# Hakem — otomatik test özeti`, ``, `${checks.length - failed.length}/${checks.length} kontrol geçti · ${metrics.durationSec} sn`, ``, `| | Önem | Kontrol | Ayrıntı |`, `|---|---|---|---|`,
    ...checks.map(c => `| ${c.pass ? '✅' : '❌'} | ${c.severity} | ${c.name} | ${c.detail.replace(/\|/g, '/')} |`)].join('\n');
  fs.writeFileSync(path.join(OUT, 'ozet.md'), md + '\n');
  console.log(`\n${checks.length - failed.length}/${checks.length} geçti → ${path.relative(process.cwd(), OUT)}/ozet.md`);
  if (process.argv.includes('--strict') && failed.some(c => c.severity === 'high')) process.exit(1);
})().catch(e => { console.error(e); process.exit(2); });
