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
// En kısa çözüm: her karoyu çözüm yönüne getirecek kadar dokun. Eşli karo: biri çevrilir (eşi de döner).
// Karanlık tünel: yalnızca aydınlık karolara dokunulur; hat ilerledikçe yeni tur (ışığı takip eder).
async function solve(page, gap = 25) {
  let total = 0;
  for (let round = 0; round < 40; round++) {
    const taps = await page.evaluate(() => {
      const { G, rot } = window.__ray, out = [], lit = i => !G.seen || G.seen[i], unrot = m => ((m >> 1) | (m << 3)) & 15;
      if (!G || G.won) return out;
      G.cur.forEach((v, i) => {
        if (G.fixed[i] || G.pinned[i]) return;
        const j = G.link?.[i] ?? -1, lo = j >= 0 ? Math.min(i, j) : i, hi = j >= 0 ? Math.max(i, j) : i, tapper = lit(lo) ? lo : hi;
        if (i !== tapper || !lit(i)) return;
        let k = 0, t = v, u = j >= 0 ? G.cur[j] : 0; const step = G.rev?.[i] ? unrot : rot;   // ters karo saat yönünün tersine
        while ((t !== G.sol[i] || (j >= 0 && u !== G.sol[j])) && k < 4) { t = step(t); if (j >= 0) u = rot(u); k++; }
        for (let q = 0; q < k; q++) out.push(i);
      });
      return out;
    });
    if (!taps.length) break;
    for (const i of taps) { await tapTile(page, i); if (gap) await page.waitForTimeout(gap); }
    total += taps.length;
  }
  return total;
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
      if (L === 12) {   // M1 sonu = hat finali (SON DURAK)
        const fin = await page.evaluate(() => ({ title: document.getElementById('gTitle').textContent, cls: document.getElementById('game').classList.contains('final'), fc: JSON.parse(localStorage.getItem('ray')).fc, tip: document.getElementById('winPanel').textContent }));
        check('final', 'Hat finali: son bölüm "🏁 Son durak", altın çerçeve; kusursuz → +1 bonus 👑', /Son durak/.test(fin.title) && fin.cls && fin.fc === 1 && /bonus/.test(fin.tip), JSON.stringify({ ...fin, tip: undefined }), 'medium');
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

    // yıldız kapısı: M2 için ★26 gerekli (12 bölüm × 2,2)
    const g = await open(browser, URL, { save: { played: 12, level: 13, stars: { ...starsUpTo(13, 2), 5: 3 } } });   // ★25 / 26
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
    check('gate.lock', 'Yetersiz yıldızda yeni hat kilitli (★25/26)', lockedOk, '', 'high');
    check('map', 'Hatlar ekranı: M1 12 bölüm seçilebilir, kilitli hat görünür', map.open === 12 && map.locked >= 1 && replay === 3, JSON.stringify({ ...map, replay }), 'high');
    check('gate.replay', 'Eski bölümü 3★ yapınca (★26) yeni hat açılır', sum === 26 && /YENİ HAT/.test(badge || ''), `★${sum} · rozet: ${badge || '-'}`, 'medium');
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

  // ---------- E4. Yeni kural: sabit karolar (M3, bölüm 29+) ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 28, level: 29, stars: starsUpTo(29) } });
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
    const sizes = await page.evaluate(() => [28, 29, 31, 32, 40, 41].map(l => window.__ray.sizeFor(l).join('x')).join(' '));
    check('rule.card', 'M3 ilk girişte "YENİ KURAL · Sabit karo" kartı, kart açıkken süre durur', card.open && /Sabit karo/.test(card.txt || '') && card.timerPaused && sv.seen?.[2] === 1, JSON.stringify(card));
    check('rule.pins', 'Sabit karolar dönmez, hamle saymaz; bölüm çözülür', g.pins >= 5 && before.m === after.m && before.v === after.v && won, JSON.stringify({ ...g, before, after, won }), 'high');
    check('rule.saw', 'Testere dişi: M3 ilk 3 bölüm bir küçük ızgara (5×6), sonra 5×7', sizes === '5x7 5x6 5x6 5x7 5x7 6x8', sizes, 'medium');
    check('e4.errors', 'Sabit karo senaryosunda konsol hatası yok', !errors.length, errors.join(' | '));
    await ctx.close();
  }

  // ---------- E5. Renk temaları (👑), günlük hatırlatma, reklamsız paket ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 12, level: 13, stars: { ...starsUpTo(10), 10: 2, 11: 1, 12: 2 }, crowns: starsUpTo(10, 1), dCrowns: 18, miss: { 10: [4, 0], 11: [3, 2], 12: [0, 5] } }, init: 'window.__withNotif = true;\n' + SHOP_MOCK });
    // temalar: 👑 para birimi. Bakiye 27 (9 bölüm + 18 günlük) → Okyanus (25) alınır, kalan 2 Gün Batımı'na (5) yetmez
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
    const buy = await page.evaluate(() => document.querySelector('.sheet p')?.textContent || '');
    await shot(page, 'skin-buy');
    await page.click('#mBuy'); await page.waitForTimeout(450);
    await shot(page, 'skins');
    const sk = await page.evaluate(() => { const v = JSON.parse(localStorage.getItem('ray')); return { acc: getComputedStyle(document.documentElement).getPropertyValue('--acc').trim(), sel: v.skin, spent: v.spent, chip: document.getElementById('sCrowns').textContent, own: document.querySelectorAll('.skin:not(.lockd)').length }; });
    await page.click('.skin[data-k=sunset]'); await page.waitForTimeout(400);   // kalan 2 👑 → 5'lik temaya yetmez → Taç topla
    const poor = await page.evaluate(() => /Taç topla/.test(document.querySelector('.sheet h2')?.textContent || '') && /3 👑/.test(document.querySelector('.sheet p')?.textContent || '') && JSON.parse(localStorage.getItem('ray')).skin === 'ocean');
    await page.click('#mBack'); await page.waitForTimeout(350); await page.click('#mClose'); await page.waitForTimeout(400);
    await page.click('#bPlay'); await page.waitForTimeout(600);
    const lineCol = await page.evaluate(() => ({ c: window.__ray.G.color, acc: getComputedStyle(document.getElementById('game')).getPropertyValue('--acc').trim() }));
    await shot(page, 'skin-game');
    check('skin.buy', 'Temalar 👑 ile satın alınır: onayda kalan bakiye, harcanan düşer, kalan diğerine yetmez', /kalan 👑 2/.test(buy) && sk.sel === 'ocean' && sk.spent === 25 && sk.chip === '2' && sk.own === 2 && poor && neonLocked, JSON.stringify({ ...sk, poor, buy: buy.slice(0, 60) }), 'medium');
    check('skin.pick', 'Seçilen tema oyuna yansır; oyunda düğme/yıldız rengi oynanan hattın rengi', sk.acc !== acc0 && lineCol.c === '#4fa3ff' && lineCol.acc === lineCol.c, JSON.stringify({ acc0, acc: sk.acc, ...lineCol }), 'medium');
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
    // 💛 özel tema taçla alınmaz: Altın'a dokununca Reklamsız paket açılır
    await page.click('#crownChip'); await page.waitForTimeout(450); await page.click('.skin[data-k=gold]'); await page.waitForTimeout(400);
    const vipShop = await page.evaluate(() => /Reklamsız paket/.test(document.querySelector('.sheet h2')?.textContent || ''));
    const price = await page.textContent('#mBuy').catch(() => '');
    await shot(page, 'shop');
    await page.click('#mBuy'); await page.waitForTimeout(600);
    const sv = await getSave(page);
    await page.click('#mClose').catch(() => {}); await page.waitForTimeout(300);
    await page.click('#bPlay'); await page.waitForTimeout(500);
    for (let k = 0; k < 4; k++) { await solve(page, 10); await waitModal(page); await page.click('#mNext'); await page.waitForTimeout(500); }   // 4. galibiyet normalde geçiş reklamı
    const ads = await page.evaluate(() => window.__log.ads.filter(a => a === 'interstitial').length);
    const vip = ['gold', 'diamond', 'ruby'].every(k => sv.owned?.[k]);
    check('shop', 'Reklamsız paket: özel temaya dokununca açılır, fiyat görünür; satın alınca +20 ipucu + 3 özel tema, geçiş reklamı çıkmaz', vipShop && /59,99/.test(price) && sv.noAds && sv.hints === h0 + 20 && vip && ads === 0, JSON.stringify({ vipShop, price: price.trim(), noAds: sv.noAds, hints: [h0, sv.hints], vip, ads }), 'medium');
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

  // ---------- E7. Yeni kural: eşli karolar (M4, bölüm 49+) + zorluk merdiveni ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 48, level: 49, stars: starsUpTo(49), seen: { 2: 1 }, remindAsked: true } });
    // çözülebilirlik: eşli + sabit karolu 600 bölüm, eşleri birlikte çevirerek çözülmeli
    const gen = await page.evaluate(() => {
      const { generate, lit, rot } = window.__ray; let bad = 0, pairs = 0, pre = 0;
      for (const [c, r] of [[5, 7], [6, 8], [7, 9]]) for (let sd = 1; sd <= 200; sd++) {
        const n = c * r, P = generate(c, r, sd * 7919 + 13, Math.round(n * .14), Math.max(1, Math.round(n * .07))), cur = P.cur.slice();
        if (lit(P).solved) pre++;
        cur.forEach((v, i) => {
          const j = P.link[i]; if (j >= 0) pairs += .5; if (j >= 0 && j < i) return;
          let k = 0; while ((cur[i] !== P.sol[i] || (j >= 0 && cur[j] !== P.sol[j])) && k < 4) { cur[i] = rot(cur[i]); if (j >= 0) cur[j] = rot(cur[j]); k++; }
        });
        if (!lit({ ...P, cur }).solved || P.link.some((j, i) => j >= 0 && (P.pinned[i] || P.link[j] !== i))) bad++;
      }
      return { bad, pairs, pre };
    });
    // zorluk merdiveni: hat uzunluğu doğrusal (12, 16, 20…), her hattın ortalama zorluğu bir öncekinden yüksek; Günün Hattı da her gün zorlaşır
    const cv = await page.evaluate(() => {
      const R = window.__ray, lines = [], lens = [];
      for (let c = 0; c < 9; c++) { const a = R.lineStart(c), z = R.lineStart(c + 1) - 1; let d = 0; for (let l = a; l <= z; l++) d += R.puzzleFor(l).diff; lines.push(Math.round(d / (z - a + 1) * 10) / 10); lens.push(z - a + 1); }
      const t0 = performance.now(); for (let l = 901; l <= 910; l++) R.puzzleFor(l); const ms = Math.round((performance.now() - t0) / 10 * 10) / 10;
      // Günün Hattı: haftalık dalga (Pzt kolay → Paz zor), %40 tabanı, tepe %85+; yıl içinde ortalama yükselir
      const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const week = mon => Array.from({ length: 7 }, (_, k) => { const d = new Date(mon); d.setDate(d.getDate() + k); return R.dPct(ymd(d)); });
      const weeks = [new Date(2026, 10, 2), new Date(2026, 10, 9), new Date(2026, 10, 16), new Date(2026, 10, 23)].map(week), late = week(new Date(2027, 8, 6));
      const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
      const daily = { wave: weeks.every(w => w.every((v, k) => !k || v > w[k - 1])), min: Math.min(...weeks.flat(), ...late), peak: Math.max(...weeks.map(w => w[6])), early: Math.round(avg(weeks.flat())), late: Math.round(avg(late)) };
      return { lines, lens, ms, daily, far: R.zPct(5000) };
    });
    metrics.difficulty = cv;
    check('difficulty.ladder', 'Zorluk merdiveni: hat uzunluğu doğrusal artıyor, her hat bir öncekinden zor, sonsuzda %99', cv.lens.every((v, k) => v === 12 + 4 * k) && cv.lines.every((v, k) => !k || v > cv.lines[k - 1]) && cv.far === 99 && cv.ms < 60, `${cv.lines.join(' → ')} · ${cv.ms} ms/bölüm`, 'medium');
    check('difficulty.daily', 'Günün Hattı haftalık dalga: Pzt→Paz zorlaşır, %40 altına düşmez, tepe %85+, zamanla yükselir', cv.daily.wave && cv.daily.min >= 40 && cv.daily.peak >= 85 && cv.daily.late > cv.daily.early, JSON.stringify(cv.daily), 'medium');
    check('pairs.solvable', 'Eşli karolu 600 bölümün hepsi çözülebilir, eşler simetrik, sabit karoyla çakışmaz', gen.bad === 0 && gen.pairs > 1000 && gen.pre === 0, JSON.stringify(gen));
    await page.click('#bPlay'); await page.waitForTimeout(700);
    const card = await page.evaluate(() => ({ open: document.getElementById('modal').classList.contains('open'), txt: document.querySelector('.sheet h2')?.textContent, demo: !!document.querySelector('.rdemo2') }));
    await shot(page, 'rule-pairs');
    if (card.open) await page.click('#mGo');
    await page.waitForTimeout(400);
    const g = await page.evaluate(() => { const G = window.__ray.G; const a = G.link.findIndex(v => v >= 0); return { size: G.cols + 'x' + G.rows, pairs: G.link.filter(v => v >= 0).length / 2, a, b: G.link[a] }; });
    const st = () => page.evaluate(([a, b]) => ({ m: window.__ray.G.moves, a: window.__ray.G.cur[a], b: window.__ray.G.cur[b] }), [g.a, g.b]);
    const s0 = await st(); await tapTile(page, g.a); await page.waitForTimeout(150); const s1 = await st(); await tapTile(page, g.b); await page.waitForTimeout(150); const s2 = await st();
    await shot(page, 'pairs');
    const rot = (m, k) => { while (k--) m = ((m << 1) | (m >> 3)) & 15; return m; };
    check('rule.pairs.card', 'M4 ilk girişte "YENİ KURAL · Eşli karo" kartı (animasyonlu)', card.open && /Eşli karo/.test(card.txt || '') && card.demo, JSON.stringify(card), 'medium');
    check('rule.pairs', 'Eşli karo: birine dokununca ikisi döner; eşine art arda dokunuş aynı hamle', g.pairs === 1 && s1.a === rot(s0.a, 1) && s1.b === rot(s0.b, 1) && s1.m === s0.m + 1 && s2.m === s1.m && s2.a === rot(s0.a, 2), JSON.stringify({ ...g, s0, s1, s2 }));
    // ipucu: yalnızca eş yanlışken ipucu → ikisi birden oturur, bölüm biter
    if (await page.evaluate(([a, b]) => { const G = window.__ray.G; return G.cur[a] === G.sol[a] && G.cur[b] === G.sol[b]; }, [g.a, g.b])) { await tapTile(page, g.a); await page.waitForTimeout(150); }
    await page.evaluate(([a, b]) => { const G = window.__ray.G; G.cur.forEach((v, i) => { if (i !== a && i !== b) G.cur[i] = G.sol[i]; }); }, [g.a, g.b]);
    await page.click('#bHint'); const won = await waitModal(page);
    const hf = await page.evaluate(([a, b]) => { const G = window.__ray.G; return G.fixed[a] && G.fixed[b] && G.cur[a] === G.sol[a] && G.cur[b] === G.sol[b]; }, [g.a, g.b]);
    check('rule.pairs.hint', 'İpucu eşli karoyu seçince ikisini birden oturtur', hf && won, `${hf} · ${won}`, 'medium');
    const sizes = await page.evaluate(() => [49, 51, 52, 60, 61].map(l => window.__ray.sizeFor(l).join('x')).join(' '));
    check('rule.pairs.win', 'Eşli karolu bölüm çözülüp kazanılıyor · testere dişi (49–51: 5×7)', won && sizes === '5x7 5x7 6x8 6x8 7x9', `${won} · ${sizes}`, 'medium');
    check('e7.errors', 'Eşli karo senaryosunda konsol hatası yok', !errors.length, errors.join(' | '));
    await ctx.close();
  }

  // ---------- E8. Yeni kural: karanlık tünel (M6, bölüm 101+) ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 100, level: 101, stars: starsUpTo(101), seen: { 2: 1, 3: 1 }, remindAsked: true } });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    const card = await page.evaluate(() => ({ open: document.getElementById('modal').classList.contains('open'), txt: document.querySelector('.sheet h2')?.textContent, demo: !!document.querySelector('.rdemo3') }));
    await shot(page, 'rule-fog');
    if (card.open) await page.click('#mGo');
    await page.waitForTimeout(400);
    const f0 = await page.evaluate(() => { const G = window.__ray.G, dark = G.seen.map((v, i) => v ? -1 : i).filter(i => i >= 0); return { fog: G.fog, dark: dark.length, n: G.cur.length, size: G.cols + 'x' + G.rows, idx: dark.find(i => !G.pinned[i] && G.link[i] < 0) ?? dark[0] }; });
    const st = () => page.evaluate(i => ({ m: window.__ray.G.moves, v: window.__ray.G.cur[i] }), f0.idx);
    const b0 = await st(); await tapTile(page, f0.idx); await page.waitForTimeout(200); const b1 = await st();
    await shot(page, 'fog');
    const taps = await solve(page, 8); const won = await waitModal(page);
    const all = await page.evaluate(() => window.__ray.G.seen.every(Boolean));
    const sizes = await page.evaluate(() => [100, 101, 103, 104].map(l => window.__ray.sizeFor(l).join('x')).join(' '));
    check('rule.fog.card', 'M6 ilk girişte "YENİ KURAL · Karanlık tünel" kartı (animasyonlu)', card.open && /Karanlık tünel/.test(card.txt || '') && card.demo, JSON.stringify(card), 'medium');
    check('rule.fog', 'Karanlık tünel: başta karanlık karolar var, dokunulmaz, hamle saymaz; ışığı takip ederek çözülür', f0.fog && f0.dark > 10 && b0.m === b1.m && b0.v === b1.v && won && all, JSON.stringify({ ...f0, b0, b1, taps, won, all }));
    check('rule.fog.saw', 'Testere dişi: M6 ilk 3 bölüm 6×8, sonra 7×9', sizes === '7x9 6x8 6x8 7x9', sizes, 'medium');
    check('e8.errors', 'Karanlık tünel senaryosunda konsol hatası yok', !errors.length, errors.join(' | '));
    await ctx.close();
  }

  // ---------- E9. Ters karo (M5), sayaçlı karo (M7), iki merkez (M8), kural dönüşümü ----------
  {
    const ruleIntro = async (lvl, seenUpTo) => {
      const seen = Object.fromEntries(Array.from({ length: seenUpTo - 1 }, (_, k) => [k + 2, 1]));
      const o = await open(browser, URL, { save: { played: lvl - 1, level: lvl, stars: starsUpTo(lvl), seen, remindAsked: true } });
      await o.page.click('#bPlay'); await o.page.waitForTimeout(700);
      o.card = await o.page.evaluate(() => ({ open: document.getElementById('modal').classList.contains('open'), txt: document.querySelector('.sheet h2')?.textContent }));
      return o;
    };
    // ters karo
    const A = await ruleIntro(73, 3); await shot(A.page, 'rule-rev'); if (A.card.open) await A.page.click('#mGo'); await A.page.waitForTimeout(400);
    const ra = await A.page.evaluate(() => { const G = window.__ray.G, i = G.rev.indexOf(true); return { n: G.rev.filter(Boolean).length, i, v: G.cur[i] }; });
    await tapTile(A.page, ra.i); await A.page.waitForTimeout(250);
    const rb = await A.page.evaluate(i => window.__ray.G.cur[i], ra.i); await shot(A.page, 'rev');
    await solve(A.page, 8); const wA = await waitModal(A.page);
    check('rule.rev', 'M5 ters karo: kural kartı, ↺ karo saat yönünün tersine döner, bölüm çözülür', /Ters karo/.test(A.card.txt || '') && ra.n >= 2 && rb === (((ra.v >> 1) | (ra.v << 3)) & 15) && wA, JSON.stringify({ ...A.card, ...ra, rb, wA }));
    // sayaçlı karo: 3 dokunuştan sonra kilitlenir, baştan alınca sayaç geri gelir
    const B = await ruleIntro(133, 5); await shot(B.page, 'rule-cnt'); if (B.card.open) await B.page.click('#mGo'); await B.page.waitForTimeout(400);
    const ca = await B.page.evaluate(() => { const G = window.__ray.G, i = G.cnt.indexOf(3); return { n: G.cnt.filter(v => v >= 0).length, i }; });
    for (let k = 0; k < 4; k++) { await tapTile(B.page, ca.i); await B.page.waitForTimeout(160); }
    const cb = await B.page.evaluate(i => ({ c: window.__ray.G.cnt[i] }), ca.i); await shot(B.page, 'cnt');
    await B.page.click('#bReset'); await B.page.waitForTimeout(400);
    const cc = await B.page.evaluate(i => window.__ray.G.cnt[i], ca.i);
    await solve(B.page, 8); const wB = await waitModal(B.page);
    check('rule.cnt', 'M7 sayaçlı karo: 3 dönüşten sonra kilitlenir, ↺ baştan sayacı yeniler, bölüm çözülür', /Sayaçlı karo/.test(B.card.txt || '') && ca.n >= 2 && cb.c === 0 && cc === 3 && wB, JSON.stringify({ ...B.card, ...ca, ...cb, cc, wB }));
    // iki merkez: ikinci merkez var; hatlar değerse "karıştı" ve çözülmüş sayılmaz; 300 bölüm çözülebilir
    const C2 = await ruleIntro(169, 6); await shot(C2.page, 'rule-two'); if (C2.card.open) await C2.page.click('#mGo'); await C2.page.waitForTimeout(400);
    const tw = await C2.page.evaluate(() => {
      const R = window.__ray; let bad = 0, merge = 0;
      for (let sd = 1; sd <= 300; sd++) {
        const P = R.generate(7, 9, sd * 7919 + 5, 0, 2, { two: true }), L = R.lit({ ...P, cur: P.sol });
        if (!L.solved || L.merged || !L.own.includes(1) || !L.own.includes(2)) bad++;
        // birbirine komşu iki farklı hattın karolarını bağla → karışmalı
        const own = L.own, cur = P.sol.slice(); let done = false;
        for (let i = 0; i < cur.length && !done; i++) { const j = i + 1; if (j % P.cols && own[i] === 1 && own[j] === 2) { cur[i] |= 2; cur[j] |= 8; done = true; } }
        if (done) { const M = R.lit({ ...P, cur }); if (M.merged && !M.solved) merge++; else bad++; }
      }
      const G = R.G; return { bad, merge, hub2: G.hub2, two: G.hub2 >= 0 };
    });
    await shot(C2.page, 'two');
    await solve(C2.page, 8); const wC = await waitModal(C2.page);
    check('rule.two', 'M8 iki merkez: kural kartı, iki ayrı hat; değince karışır (çözülmez); 300 bölüm çözülebilir', /İki merkez/.test(C2.card.txt || '') && tw.two && tw.bad === 0 && tw.merge > 200 && wC, JSON.stringify({ ...C2.card, ...tw, wC }));
    // kural dönüşümü: M9+ (209+) her bölüm 1–2 kural, karışım bölümden bölüme değişir
    const mix = await C2.page.evaluate(() => { const R = window.__ray, L = []; for (let l = 209; l <= 240; l++) L.push(R.puzzleFor(l).rules.sort().join('+')); return { sizes: [...new Set(L.map(x => x.split('+').length))], kinds: new Set(L).size, sample: L.slice(0, 6) }; });
    check('rule.mix', 'Karma hatlar (M9+): her bölümde 1–2 kural, karışım çeşitli', mix.sizes.every(k => k >= 1 && k <= 2) && mix.kinds >= 6, JSON.stringify(mix), 'medium');
    check('e9.errors', 'Yeni kural senaryolarında konsol hatası yok', ![...A.errors, ...B.errors, ...C2.errors].length, [...A.errors, ...B.errors, ...C2.errors].join(' | '));
    await A.ctx.close(); await B.ctx.close(); await C2.ctx.close();
  }

  // ---------- E10. Sefer şeridi (tren sayacı), kusursuz seri, kıl payı tekrar ----------
  {
    const base = { played: 6, level: 14, stars: starsUpTo(14, 2), hints: 3 };   // 1–13 taçsız → 14 seriyi etkiler
    const { ctx, page, errors } = await open(browser, URL, { save: { ...base, combo: 2 } });
    await page.click('#bPlay'); await page.waitForTimeout(400);
    const trip = () => page.evaluate(() => { const t = document.getElementById('gTrip'); return { p: +t.style.getPropertyValue('--p'), cls: t.className, next: document.getElementById('gNext').textContent, bub: document.getElementById('gBub').classList.contains('show'), combo: document.getElementById('gCombo').hidden ? '' : document.getElementById('gCombo').textContent, off: document.getElementById('gCombo').classList.contains('off') }; });
    const t0 = await trip();
    await page.evaluate(() => { const G = window.__ray.G; G.ms = (G.lim.t + 3.2) * 1000; }); await page.waitForTimeout(450);
    const t1 = await trip(), toast1 = await page.textContent('#toast');
    check('trip.run', 'Sefer şeridi: tren süreyle ilerler; süre dolunca sinyalde bekler, "+rötar" sayar, yolcu laf atar; seri 🔥 göstergesi sönükleşir', t0.p < .1 && /^⏱/.test(t0.next) && t0.combo === '🔥2' && /late/.test(t1.cls) && Math.abs(t1.p - .84) < .001 && /rötar/.test(t1.next) && t1.bub && t1.off && /baştan/.test(toast1), `${JSON.stringify(t0)} → ${JSON.stringify(t1)} · "${toast1}"`, 'medium');
    await shot(page, 'trip-late');
    await page.evaluate(() => { const G = window.__ray.G; G.ms = (G.lim.t + 1) * 1000; });   // kıl payı: ~1–3 sn rötar
    await solve(page, 10); await waitModal(page);
    const w1 = await page.evaluate(() => ({ prim: document.querySelector('#winPanel .primary')?.id, ptxt: document.querySelector('#winPanel .primary')?.textContent, next: !!document.querySelector('#winPanel .row2 #mNext'), n: document.querySelectorAll('#winPanel button').length, trip: document.getElementById('gTrip').className }));
    const s1 = await getSave(page);
    await shot(page, 'win-near');
    check('near.retry', 'Kıl payı + kırılan seri: "Tekrar dene" büyük düğmeye geçer, Sonraki alt sıraya iner (düğme sayısı aynı)', w1.prim === 'mRetry' && /Kıl payı/.test(w1.ptxt) && /2 seri/.test(w1.ptxt) && w1.next && w1.n === 5 && /arr/.test(w1.trip) && s1.combo === 0 && s1.comboLost?.n === 2 && s1.comboLost?.lvl === 14, JSON.stringify({ ...w1, combo: s1.combo, lost: s1.comboLost }), 'medium');
    await page.click('#mRetry'); await page.waitForTimeout(800);   // bildirim 600 ms sonra çıkar
    const toast2 = await page.textContent('#toast'), chip = await page.evaluate(() => document.getElementById('gCombo').textContent);
    await solve(page, 10); await waitModal(page);
    const w2 = await page.evaluate(() => ({ prim: document.querySelector('#winPanel .primary')?.id, txt: document.getElementById('winPanel').textContent, next: document.getElementById('gNext').textContent }));
    const s2 = await getSave(page);
    check('combo.restore', 'Kırılan seri aynı bölümü kusursuz bitirince geri gelir; 3. kusursuz → +1 ipucu, rozet 🔥3', /geri gelir/.test(toast2) && chip === '🔥2' && s2.combo === 3 && s2.hints === base.hints + 1 && !s2.comboLost && /🔥3/.test(w2.txt) && /3 kusursuz seri/.test(w2.txt) && w2.prim === 'mNext' && w2.next === 'Tam vaktinde', JSON.stringify({ toast2, chip, combo: s2.combo, hints: s2.hints, prim: w2.prim, next: w2.next }), 'medium');
    check('trip.errors', 'Sefer şeridi + seri: konsol hatası yok', errors.length === 0, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
  {
    const { ctx, page } = await open(browser, URL, { save: { played: 6, level: 14, stars: starsUpTo(14, 2), hints: 3, combo: 4 } });
    await page.click('#bPlay'); await page.waitForTimeout(400);
    await solve(page, 10); await waitModal(page);
    const s1 = await getSave(page), cr = await page.evaluate(() => document.getElementById('winPanel').textContent);
    await page.click('#mRetry'); await page.waitForTimeout(450);   // artık taçlı → seri etkilenmez
    const chip = await page.evaluate(() => document.getElementById('gCombo').hidden);
    await page.evaluate(() => { const G = window.__ray.G; G.ms = (G.lim.t + 1) * 1000; });
    await solve(page, 10); await waitModal(page);
    const s2 = await getSave(page), prim = await page.evaluate(() => document.querySelector('#winPanel .primary')?.id);
    check('combo.crown', '5. kusursuz → +1 bonus 👑 (bakiyeye eklenir); taçlı bölüm seriyi bozmaz, Tekrar öne çıkmaz', s1.combo === 5 && s1.cc === 1 && /bonus 👑/.test(cr) && chip && s2.combo === 5 && !s2.comboLost && prim === 'mNext', JSON.stringify({ c1: s1.combo, cc: s1.cc, chipHidden: chip, c2: s2.combo, prim }), 'medium');
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
