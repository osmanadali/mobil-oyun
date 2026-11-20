// Ray playable testi (Playwright). Önce `node playable/build.cjs`, sonra: node playable/test.cjs
// Kapsam: açılış (konsol hatasız), ağ isteği yok (Google sürümünde yalnız exitapi.js), bulmacayı dokunuşla çözme,
// bitiş kartı + düğme → openStore (ExitApi / MRAID / Meta / window.open), 25 sn zaman aşımı, üç en-boy oranında taşma yok, dosya boyutları.
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), cp = require('child_process');
const DIST = path.join(__dirname, 'dist');
const HTML = fs.readFileSync(path.join(DIST, 'ray-playable.html'), 'utf8');
const ZIP = path.join(DIST, 'ray-playable-google.zip');
const GHTML = cp.execFileSync('unzip', ['-p', ZIP, 'index.html']).toString('utf8');
const EXIT_URL = 'https://tpc.googlesyndication.com/pagead/gadgets/html5/api/exitapi.js';
const UA_AND = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36';
const UA_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const APPLE = 'https://apps.apple.com/app/id6831928554?ct=playable';
const PLAY = 'https://play.google.com/store/apps/details?id=com.osmanadali.ray&referrer=utm_source%3Dplayable';

let fail = 0;
const ok = (c, m) => { console.log((c ? '  GEÇTİ ' : '  KALDI ') + m); if (!c) fail++; };
const section = s => console.log('\n' + s);

// sayfa: https://ad.test/ray.html olarak sunulur (istek denetimi route ile); sahte saat: rAF/zamanlayıcı hızlı ilerler
async function open(browser, { html = HTML, google = false, locale = 'tr-TR', ua, vp = { width: 390, height: 844 }, init = '', clock = true } = {}) {
  const ctx = await browser.newContext({ locale, userAgent: ua, viewport: vp, hasTouch: !!ua, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const log = { console: [], errors: [], requests: [] };
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') log.console.push(m.text()); });
  page.on('pageerror', e => log.errors.push(e.message));
  await page.route('**/*', r => {
    const u = r.request().url();
    if (u === 'https://ad.test/ray.html') return r.fulfill({ contentType: 'text/html', body: html });
    log.requests.push(u);
    if (u === EXIT_URL && google) return r.fulfill({ contentType: 'text/javascript', body: 'window.ExitApi={exit:function(){(window.__exit=window.__exit||[]).push(1)}};' });
    return r.abort();
  });
  await page.addInitScript('window.__opened=[];window.open=function(u){window.__opened.push(u);return null};' + init);
  if (clock) await page.clock.install({ time: 0 });
  await page.goto('https://ad.test/ray.html#test');
  const adv = async ms => { for (let t = 0; t < ms; t += 250) await page.clock.runFor(Math.min(250, ms - t)); };
  const st = () => page.evaluate(() => window.__ray.state());
  const tap = async i => { const t = await page.evaluate(i => window.__ray.tiles()[i], i); await page.mouse.click(t.x, t.y); };
  return { ctx, page, log, adv, st, tap };
}
// bulmacaları ipucu sırasıyla çöz; bitiş kartına dek
async function solve(h) {
  const taps = [0, 0]; let s = await h.st();
  for (let g = 0; g < 120 && s.phase !== 'end'; g++) {
    if (s.phase === 'play' && s.hint >= 0) { await h.tap(s.hint); taps[s.puz]++; }
    await h.adv(260); s = await h.st();
  }
  return { s, taps };
}

(async () => {
  const browser = await chromium.launch();

  section('1) Açılış, konsol ve ağ (tek HTML sürümü)');
  let h = await open(browser, { ua: UA_AND });
  await h.adv(1200);
  let s = await h.st();
  ok(h.log.errors.length === 0 && h.log.console.length === 0, 'konsol/sayfa hatası yok ' + JSON.stringify([...h.log.errors, ...h.log.console]));
  ok(h.log.requests.length === 0, 'ağ isteği yok (' + h.log.requests.length + ')');
  ok(s.phase === 'play' && s.puz === 0 && s.hint >= 0, 'oyun açıldı, ilk saniyede ipucu var (hint=' + s.hint + ')');
  ok(await h.page.evaluate(() => document.getElementById('cap').textContent.startsWith('Karoya dokun')), 'Türkçe yerelde Türkçe metin');
  ok(!(await h.page.evaluate(() => document.cookie)) && (await h.page.evaluate(() => { try { return localStorage.length; } catch (e) { return 0; } })) === 0, 'çerez/localStorage kullanılmıyor');

  section('2) Dokunmalarla çözme, bitiş kartı');
  const sol = await solve(h);
  ok(sol.s.phase === 'end' && sol.s.puz === 1 && sol.s.solved, 'iki bulmaca çözüldü, bitiş kartı geldi');
  ok(sol.s.now < 25000, 'zaman aşımından önce bitti (' + Math.round(sol.s.now) + ' ms)');
  ok(sol.taps[0] === 7 && sol.taps[1] === 5, 'dokunuşlar: 3×3 = ' + sol.taps[0] + ', 4×4 = ' + sol.taps[1] + ' (beklenen 7 ve 5)');
  await h.adv(1000);
  ok(await h.page.evaluate(() => getComputedStyle(document.getElementById('card')).opacity) === '1', 'bitiş kartı tam görünür');
  ok(await h.page.evaluate(() => document.getElementById('dlt').textContent) === 'İndir', 'düğme: İndir');
  const vis = id => h.page.evaluate(i => { const e = document.getElementById(i), r = e.getBoundingClientRect(); return getComputedStyle(e).display !== 'none' && r.width > 0; }, id);
  ok((await vis('bAnd')) && !(await vis('bIos')), 'Android cihazda yalnız Google Play rozeti');
  await h.page.click('#dl', { force: true });
  let op = await h.page.evaluate(() => window.__opened);
  ok(op.length === 1 && op[0] === PLAY, 'düğme (Android) Play bağlantısını açar: ' + op[0]);
  await h.page.click('#bAnd', { force: true });
  op = await h.page.evaluate(() => window.__opened);
  ok(op.length === 2 && op[1] === PLAY, 'Play rozeti Play bağlantısını açar');
  ok(h.log.errors.length === 0 && h.log.requests.length === 0, 'çözüm boyunca hata/ağ isteği yok');
  await h.ctx.close();

  section('3) iOS cihazda rozet ve bağlantı');
  h = await open(browser, { ua: UA_IOS });
  await h.adv(500); await solve(h); await h.adv(1000);
  ok((await vis2(h, 'bIos')) && !(await vis2(h, 'bAnd')), 'iOS cihazda yalnız App Store rozeti');
  await h.page.click('#dl', { force: true });
  op = await h.page.evaluate(() => window.__opened);
  ok(op.length === 1 && op[0] === APPLE, 'düğme (iOS) App Store bağlantısını açar: ' + op[0]);
  await h.ctx.close();

  section('4) İngilizce cihaz: yalnız düğme, rozet yok');
  h = await open(browser, { ua: UA_AND, locale: 'en-US' });
  await h.adv(500);
  ok(await h.page.evaluate(() => document.getElementById('cap').textContent.startsWith('Tap a tile')), 'İngilizce metin');
  await solve(h); await h.adv(1000);
  ok(await h.page.evaluate(() => document.getElementById('dlt').textContent) === 'Download' && await h.page.evaluate(() => document.getElementById('tag').textContent) === 'Connect your metro', 'İngilizce: Download / Connect your metro');
  ok(!(await vis2(h, 'bAnd')) && !(await vis2(h, 'bIos')), 'İngilizce cihazda Türkçe rozet gösterilmez');
  ok((await h.page.click('#dl', { force: true }), (await h.page.evaluate(() => window.__opened))[0] === PLAY), 'Download düğmesi çalışır');
  await h.ctx.close();

  section('5) Reklam ağı kabukları (CTA)');
  h = await open(browser, { ua: UA_AND, init: 'window.mraid={_l:{},getState:function(){return "loading"},isViewable:function(){return true},addEventListener:function(e,f){this._l[e]=f},removeEventListener:function(){},open:function(u){(window.__mraid=window.__mraid||[]).push(u)}};' });
  await h.adv(800);
  ok(await h.page.evaluate(() => !window.__ray), 'MRAID: ready olayına dek oyun başlamaz');
  await h.page.evaluate(() => window.mraid._l.ready());
  await h.adv(800);
  ok(await h.page.evaluate(() => !!window.__ray), 'MRAID: ready sonrası oyun başladı');
  await solve(h); await h.adv(1000); await h.page.click('#dl', { force: true });
  ok(JSON.stringify(await h.page.evaluate(() => window.__mraid)) === JSON.stringify([PLAY]) && (await h.page.evaluate(() => window.__opened)).length === 0, 'mraid.open(url) çağrıldı, window.open çağrılmadı');
  await h.ctx.close();
  h = await open(browser, { ua: UA_AND, init: 'window.FbPlayableAd={onCTAClick:function(){window.__fb=(window.__fb||0)+1}};' });
  await h.adv(500); await solve(h); await h.adv(1000); await h.page.click('#dl', { force: true });
  ok((await h.page.evaluate(() => window.__fb)) === 1 && (await h.page.evaluate(() => window.__opened)).length === 0, 'Meta: FbPlayableAd.onCTAClick() çağrıldı');
  await h.ctx.close();
  h = await open(browser, { ua: UA_AND, init: 'window.ExitApi={exit:function(){window.__exit=(window.__exit||0)+1}};' });
  await h.adv(500); await solve(h); await h.adv(1000); await h.page.click('#dl', { force: true });
  ok((await h.page.evaluate(() => window.__exit)) === 1 && (await h.page.evaluate(() => window.__opened)).length === 0, 'Google: ExitApi.exit() öncelikli, window.open yok');
  await h.ctx.close();

  section('6) Google zip sürümü: yalnız exitapi.js isteği');
  h = await open(browser, { html: GHTML, google: true, ua: UA_AND });
  await h.adv(1200);
  ok(h.log.requests.length === 1 && h.log.requests[0] === EXIT_URL, 'istekler: ' + JSON.stringify(h.log.requests));
  ok(h.log.errors.length === 0 && h.log.console.length === 0, 'konsol/sayfa hatası yok');
  await solve(h); await h.adv(1000); await h.page.click('#dl', { force: true });
  ok((await h.page.evaluate(() => window.__exit)).length === 1 && (await h.page.evaluate(() => window.__opened)).length === 0, 'düğme ExitApi.exit() çağırır');
  ok(h.log.requests.length === 1, 'çözümden sonra da yalnız exitapi.js');
  await h.ctx.close();

  section('7) 25 sn zaman aşımı kartı');
  h = await open(browser, { ua: UA_AND });
  await h.adv(24000); s = await h.st();
  ok(s.phase === 'play', '24 sn: henüz oyunda');
  await h.adv(2500); s = await h.st();
  ok(s.phase === 'end' && !s.solved, '25 sn sonra bitiş kartı (çözülmemiş)');
  await h.adv(1000);
  await h.page.click('#dl', { force: true });
  ok((await h.page.evaluate(() => window.__opened))[0] === PLAY, 'zaman aşımı kartında düğme çalışır');
  await h.ctx.close();

  section('8) Düzen: taşma yok (dikey, yatay, kare ve uç boyutlar)');
  const sizes = [[390, 844], [844, 390], [600, 600], [320, 480], [480, 320], [1080, 1920], [1920, 1080], [768, 768]];
  for (const [w, hh] of sizes) {
    for (const lang of ['tr-TR', 'en-US']) {
      h = await open(browser, { ua: UA_AND, vp: { width: w, height: hh }, locale: lang });
      await h.adv(1200);
      const play = await layout(h.page);
      await solve(h); await h.adv(1200);
      const end = await layout(h.page);
      const tag = `${w}×${hh} ${lang.slice(0, 2)}`;
      ok(play.noScroll && play.board.w > 100 && play.board.h > 100 && play.canvasOk, tag + ' oyun: taşma yok, tahta ' + play.board.w + '×' + play.board.h);
      ok(end.noScroll && end.inside && !end.overlap && end.board.w > 80 && end.board.h > 80, tag + ' kart: ' + (end.inside ? 'hepsi ekran içinde' : 'TAŞIYOR ' + JSON.stringify(end.bad)) + (end.overlap ? ', tahtayla ÇAKIŞIYOR' : ', tahtayla çakışmıyor') + ', tahta ' + end.board.w + '×' + end.board.h + ', düğme ' + end.dl.w + '×' + end.dl.h);
      if (lang === 'tr-TR' && process.env.SHOTS) await h.page.screenshot({ path: path.join(process.env.SHOTS, `d-${w}x${hh}.png`) });
      await h.ctx.close();
    }
  }

  section('9) Dosya boyutları ve yasaklar');
  const hs = fs.statSync(path.join(DIST, 'ray-playable.html')).size, zs = fs.statSync(ZIP).size;
  ok(hs <= 2 * 1024 * 1024, `ray-playable.html ${hs} bayt ≤ 2 MB`);
  ok(zs <= 5 * 1024 * 1024, `ray-playable-google.zip ${zs} bayt ≤ 5 MB`);
  const names = cp.execFileSync('unzip', ['-Z1', ZIP]).toString().trim().split('\n');
  ok(names.length <= 512 && names[0] === 'index.html' && names.length === 1, 'zip: kökte index.html, ' + names.length + ' dosya');
  ok(GHTML.includes('<script type="text/javascript" src="' + EXIT_URL + '"></script>') && !HTML.includes('googlesyndication'), 'exitapi.js yalnız zip sürümünde');
  ok(/<meta name="ad\.size" content="width=\d+,height=\d+">/.test(GHTML), 'zip: ad.size meta etiketi var');
  const ext = s => (s.match(/(?:src|href)=["']https?:[^"']+/g) || []);
  ok(ext(HTML).length === 0 && JSON.stringify(ext(GHTML)) === JSON.stringify(['src="' + EXIT_URL]), 'harici varlık yok (zip: yalnız exitapi.js)');
  for (const [n, t] of [['html', HTML], ['zip', GHTML]]) {
    ok(!/fetch\(|XMLHttpRequest|localStorage|sessionStorage|document\.cookie|AudioContext|WebSocket|sendBeacon|@import|@font-face/.test(t), n + ': fetch/XHR/depolama/ses/harici yazı tipi yok');
  }
  ok(!/apps\.apple\.com|play\.google\.com|window\.open/.test(GHTML), 'zip: sabit mağaza adresi ve window.open gömülü değil');

  await browser.close();
  console.log('\n' + (fail ? fail + ' KONTROL KALDI' : 'TÜM KONTROLLER GEÇTİ'));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });

async function vis2(h, id) { return h.page.evaluate(i => { const e = document.getElementById(i), r = e.getBoundingClientRect(); return getComputedStyle(e).display !== 'none' && r.width > 0; }, id); }

async function layout(page) {
  return page.evaluate(() => {
    const W = innerWidth, H = innerHeight, R = id => { const r = document.getElementById(id).getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: Math.round(r.width), h: Math.round(r.height) }; };
    const vis = id => { const e = document.getElementById(id); return getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; };
    const board = R('board'), cv = R('cv'), card = R('card');
    const els = ['ico', 'ttl', 'tag', 'dl', 'bIos', 'bAnd'].filter(vis), bad = [];
    for (const id of els) { const r = R(id); if (r.l < -0.5 || r.t < -0.5 || r.r > W + 0.5 || r.b > H + 0.5) bad.push(id); }
    const ov = !(card.r <= board.l + 1 || card.l >= board.r - 1 || card.b <= board.t + 1 || card.t >= board.b - 1);
    const de = document.documentElement;
    return { noScroll: de.scrollWidth <= W && de.scrollHeight <= H && document.body.scrollWidth <= W, board: { w: board.w, h: board.h }, canvasOk: cv.r <= W + .5 && cv.b <= H + .5, inside: bad.length === 0, bad, overlap: ov, dl: R('dl') };
  });
}
