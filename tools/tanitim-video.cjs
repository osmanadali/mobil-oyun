// Ray tanıtım videosu ve duyuru görselleri: oyunun kendi web sürümünü Playwright ile kaydeder, ffmpeg ile kurgular. Ücretli servis yok.
// Kullanım: node tools/tanitim-video.cjs [--ses=dis-ses.wav] [--sadece=klip,kare,birlestir,gorsel,onizleme]
//   --ses=<wav|mp3>  Türkçe dış ses: müziğin üstüne eklenir, konuşurken müzik kısılır (yoksa yalnız müzik).
//   --sadece=...     yalnız belirtilen adımlar (varsayılan hepsi). Ara dosyalar: $TANITIM_WORK (varsayılan /tmp/ray-tanitim)
// Çıktı: store/tanitim/{ray-play-tanitim-dikey.mp4, ray-play-tanitim-kare.mp4, ray-play-duyuru-dikey.png, ray-play-duyuru-yatay.png, kareler/}
// Sahneler: açılış 3 · oyun+drone 6 · öğretici 3,5 · lig+kapışma 4 · yedi hat (1,5'er) 10,5 · tören 3,5 · kapanış 4 = 34,5 sn (kare kesim ~25 sn). Müzik + sentez ses efektleri; konuşma yok.
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const { rIcon } = require('./ikon.cjs');
const { saveAt, solveTo, play, clock } = require('./store-shots.cjs');
const { synth } = require('./tanitim-muzik.cjs');

const R = path.join(__dirname, '..'), WWW = path.join(R, 'www'), OUT = path.join(R, 'store', 'tanitim'), WORK = process.env.TANITIM_WORK || path.join(os.tmpdir(), 'ray-tanitim');
const ARGS = process.argv.slice(2), arg = k => (ARGS.find(a => a.startsWith(`--${k}=`)) || '').slice(k.length + 3);
const SES = arg('ses') ? path.resolve(arg('ses')) : '', ONLY = arg('sadece') ? arg('sadece').split(',') : null, step = s => !ONLY || ONLY.includes(s);
const sh = (cmd, a) => { const r = cp.spawnSync(cmd, a, { stdio: ['ignore', 'ignore', 'pipe'], maxBuffer: 1 << 28 }); if (r.status) throw new Error(`${cmd} ${a.slice(0, 6).join(' ')}…\n${r.stderr}`); };
const ff = a => sh('ffmpeg', ['-v', 'error', '-y', ...a]);
const mk = d => fs.mkdirSync(d, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg' };
function serve() {
  return new Promise(res => {
    const s = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(WWW, p);
      if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-cache' }); fs.createReadStream(f).pipe(r);
    });
    s.listen(0, '127.0.0.1', () => res(s));
  });
}
const b64 = f => fs.readFileSync(path.join(R, f)).toString('base64');
const FACE = `@font-face{font-family:Outfit;src:url(data:font/woff2;base64,${b64('www/fonts/outfit-latin.woff2')}) format("woff2");font-weight:100 900}@font-face{font-family:Outfit;src:url(data:font/woff2;base64,${b64('www/fonts/outfit-latin-ext.woff2')}) format("woff2");font-weight:100 900;unicode-range:U+0100-02AF}`;
const MAP = `data:image/svg+xml;base64,${b64('www/bg.svg')}`;
const BADGE_G = `data:image/png;base64,${b64('store/tanitim/rozet/google-play-tr.png')}`, BADGE_A = `data:image/svg+xml;base64,${b64('store/tanitim/rozet/app-store-tr.svg')}`;
const BG = `background:radial-gradient(60% 40% at 12% 6%,rgba(255,159,90,.30),transparent 70%),radial-gradient(70% 45% at 92% 96%,rgba(109,123,255,.32),transparent 70%),radial-gradient(45% 30% at 85% 30%,rgba(255,111,145,.14),transparent 70%),linear-gradient(165deg,#161b33,#0d1020 62%)`;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------- oyunu açma ----------
async function openGame(browser, url, save, o = {}) {
  const vp = o.vp || [390, 844];
  const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] }, deviceScaleFactor: o.dsf || 2, colorScheme: 'dark', hasTouch: true, isMobile: true, locale: 'tr-TR' });
  await ctx.addInitScript(`window.__noIntro=true;window.__noFest=true;window.__noRec=true;window.__ligFake=true;window.__rayTest=${o.test ? 1 : 0};
    ${save ? `try{localStorage.setItem('ray',${JSON.stringify(JSON.stringify(save))})}catch{}` : ''}`);
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(900);
  return { ctx, page, errors };
}
const tab = async (page, t) => { await page.evaluate(t => document.querySelector(`[data-tab=${t}]`).click(), t); await page.waitForTimeout(900); };
const seenTo = c => Object.fromEntries(Array.from({ length: c }, (_, k) => [k, 1]));

// ---------- ekran kaydı (CDP screencast; kare kare zaman damgalı → 30 fps MP4) ----------
async function recordClip(browser, url, name, save, scn, o = {}) {
  const { ctx, page, errors } = await openGame(browser, url, save, o), dsf = o.dsf || 2, cdp = await ctx.newCDPSession(page), frames = [];
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => { frames.push({ t: metadata.timestamp, b: Buffer.from(data, 'base64') }); cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {}); });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 390 * dsf, maxHeight: 844 * dsf, everyNthFrame: 1 });
  let t0 = 0, t1 = 0;
  await scn({ page, start: () => { t0 = Date.now() / 1000; }, stop: () => { t1 = Date.now() / 1000; }, snap: async n => { mk(path.join(WORK, 'shots')); await page.screenshot({ path: path.join(WORK, 'shots', n + '.png') }); } });
  await sleep(150); await cdp.send('Page.stopScreencast'); await ctx.close();
  if (errors.length) throw new Error(`${name}: ${errors.join(' | ')}`);
  if (!t0 || !t1) throw new Error(`${name}: start/stop çağrılmadı`);
  frames.sort((a, b) => a.t - b.t);
  const dir = path.join(WORK, 'klip-' + name); fs.rmSync(dir, { recursive: true, force: true }); mk(dir);
  let i0 = 0; frames.forEach((f, i) => { if (f.t <= t0) i0 = i; });
  const use = frames.slice(i0).filter((f, i) => i === 0 || f.t < t1), lines = [];
  use.forEach((f, i) => {
    const a = i === 0 ? t0 : f.t, b = i + 1 < use.length ? use[i + 1].t : t1, file = path.join(dir, `f${String(i).padStart(5, '0')}.jpg`);
    fs.writeFileSync(file, f.b); lines.push(`file '${file}'`, `duration ${Math.max(.001, b - a).toFixed(4)}`);
  });
  lines.push(lines[lines.length - 2]);
  fs.writeFileSync(path.join(dir, 'list.txt'), lines.join('\n'));
  const out = path.join(WORK, `klip-${name}.mp4`);
  ff(['-f', 'concat', '-safe', '0', '-i', path.join(dir, 'list.txt'), '-vf', `fps=30,scale=${390 * dsf}:${844 * dsf}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-crf', '12', '-preset', 'fast', out]);
  console.log(`klip ${name}: ${use.length} kare / ${(t1 - t0).toFixed(2)} sn`);
  return out;
}

// ---------- senaryolar (hepsi gerçek oyun üstünde) ----------
const RULE_START = [689, 717, 745, 773, 801, 829, 857], RULE_C = RULE_START.map((_, i) => 26 + i);   // express, signal, quake, morph, remote, shunt, yard
const CLIPS = {
  // 🎓 yeni oyuncu öğreticisi: boş kayıt → oyun kendiliğinden öğretici bölümü açar
  ogretici: { save: null, scn: async ({ page, start, stop, snap }) => { await page.waitForTimeout(1800); start();
    const run = solveTo(page, 1, 520).catch(() => {}); await page.waitForTimeout(4600); await snap('ogretici'); stop(); await run; } },
  lig: { save: saveAt(633), scn: async ({ page, start, stop, snap }) => {
    await tab(page, 'league'); await page.evaluate(() => document.getElementById('mJoin')?.click()); await page.waitForTimeout(1500);
    await page.evaluate(() => { const d = document.createElement('div'); d.style.display = 'none'; document.body.append(d); return window.__ray.lig.score(235, d); }); await page.waitForTimeout(300);
    await page.evaluate(() => { window.__ray.lig.open(); }); await page.waitForTimeout(1300);
    await page.evaluate(() => { [...document.querySelectorAll('.screen.active *')].filter(e => e.scrollHeight > e.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(e).overflowY)).forEach(e => { e.scrollTop = 0; }); });
    await page.waitForTimeout(300); await snap('lig'); start(); await page.waitForTimeout(2300); stop(); } },
  kapisma: { save: saveAt(633), scn: async ({ page, start, stop, snap }) => {
    await tab(page, 'league'); await page.evaluate(() => document.getElementById('mJoin')?.click()); await page.waitForTimeout(1200);
    await tab(page, 'vs'); await page.waitForTimeout(400); await snap('kapisma'); await page.waitForTimeout(300);
    await page.evaluate(() => document.getElementById('vpR')?.click());
    await page.waitForTimeout(3300); start(); await page.waitForTimeout(3800); stop(); } },
  oyun: { save: saveAt((+process.env.LV || 6) + 1, { combo: 4 }), scn: async ({ page, start, stop, snap }) => {
    const LV = +process.env.LV || 6; await play(page, LV); await page.waitForTimeout(900); await clock(page, 6); start(); await page.waitForTimeout(250);
    await solveTo(page, 1, +process.env.GAP || 90); await page.waitForTimeout(1500); await snap('oyun'); await page.waitForTimeout(300); stop(); } },
  tören: { save: saveAt(395), scn: async ({ page, start, stop }) => {
    await page.waitForTimeout(500); await page.evaluate(() => window.__ray.fest(14)); await page.waitForTimeout(250); start(); await page.waitForTimeout(4600); stop(); } },
  harita: { save: saveAt(633), scn: async ({ page, snap, start, stop }) => { start(); await tab(page, 'city'); await page.evaluate(() => document.getElementById('cPrev')?.click()); await page.waitForTimeout(1500); await snap('harita'); stop(); } },
};
RULE_START.forEach((L, i) => {
  CLIPS['hat' + (i + 1)] = { test: 1, save: saveAt(L, { seen: seenTo(RULE_C[i]) }), scn: async ({ page, start, stop }) => {
    await play(page, L); await page.waitForTimeout(400); start(); await page.waitForTimeout(650);
    await page.evaluate(() => document.getElementById('mGo')?.click()); await page.waitForTimeout(150);
    await solveTo(page, .4, 20); await page.waitForTimeout(250); stop(); } };
});

// ---------- tasarım katmanları (başlık, çip, telefon çerçevesi) ----------
const FMT = {
  V: { W: 1080, H: 1920, sw: 640, bz: 14, x: 206, y: 350, h1: 80, sub: 38, chip: 40 },
  S: { W: 1080, H: 1080, sw: 444, bz: 12, x: 548, y: 45, h1: 60, sub: 30, chip: 32 },
};
for (const f of Object.values(FMT)) { f.sh = Math.round(f.sw * 844 / 390); f.pw = f.sw + 2 * f.bz; f.ph = f.sh + 2 * f.bz; f.rad = Math.round(f.sw * .12); }
const hdRules = f => `.zhd{position:absolute;inset:0;pointer-events:none;font-family:Outfit,system-ui,sans-serif;color:#eef0f7}
.zhd::before{content:'';position:absolute;${f === FMT.V ? 'left:0;right:0;top:0;height:380px;background:linear-gradient(180deg,#0d1020 55%,transparent)' : 'left:0;top:0;bottom:0;width:600px;background:linear-gradient(90deg,#0d1020 55%,transparent)'}}
.zht{position:absolute;${f === FMT.V ? 'left:0;right:0;top:64px;text-align:center;padding:0 50px' : 'left:64px;top:0;bottom:0;width:470px;display:flex;flex-direction:column;justify-content:center;text-align:left'}}
.zht h1{font-size:${f.h1}px;line-height:1.06;font-weight:800;letter-spacing:-.025em;margin:0;color:#eef0f7}
.zht h1 em{display:block;font-style:normal;background:linear-gradient(100deg,#ffb35c 10%,#ff7a8a 90%);-webkit-background-clip:text;background-clip:text;color:transparent;padding-bottom:.06em}
.zht p{margin:${Math.round(f.sub * .4)}px 0 0;font-size:${f.sub}px;font-weight:500;color:#aab1cc}
.zchip{${f === FMT.V ? 'position:absolute;left:0;right:0;top:1790px;text-align:center' : 'position:absolute;left:64px;bottom:90px;width:470px'}}
.zchip b{display:inline-block;font-size:${f.chip}px;font-weight:600;color:#eef0f7;padding:${Math.round(f.chip * .3)}px ${Math.round(f.chip * .8)}px;border-radius:99px;background:rgba(40,46,82,.72);box-shadow:inset 0 0 0 2px rgba(255,255,255,.1)}`;
const hdCss = f => `${FACE}
*{margin:0;box-sizing:border-box}html,body{width:${f.W}px;height:${f.H}px;overflow:hidden}
body{font-family:Outfit,system-ui,sans-serif;color:#eef0f7;position:relative}${hdRules(f)}`;
const hdHtml = (f, t, sub, chip) => `<div class="zhd"><div class="zht"><h1>${t[0]}<em>${t[1]}</em></h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="zchip">${chip ? `<b>${chip}</b>` : ''}</div></div>`;
const bgCss = f => `body{${BG}}.map{position:absolute;inset:-4%;background:url(${MAP}) center/cover;opacity:.07;-webkit-mask:radial-gradient(ellipse at 50% 40%,#000 25%,transparent 75%)}`;
async function shotHtml(browser, html, w, h, file, omit) {
  const p = await browser.newPage({ viewport: { width: w, height: h } });
  await p.setContent(html, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(80);
  mk(path.dirname(file)); await p.screenshot({ path: file, omitBackground: !!omit }); await p.close();
}
// arka katman: zemin + başlık + telefon gövdesi (ekran deliği koyu); ön katman: yalnız çerçeve (ekran köşeleri yuvarlak, ortası saydam)
async function phoneLayers(browser, fk, key, t, sub, chip) {
  const f = FMT[fk], back = path.join(WORK, `back-${fk}-${key}.png`);
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${hdCss(f)}${bgCss(f)}
.ph{position:absolute;left:${f.x}px;top:${f.y}px;width:${f.pw}px;height:${f.ph}px;border-radius:${f.rad + f.bz}px;background:linear-gradient(150deg,#3a4170,#141831 30%,#0a0c18 65%,#262c4f);
 box-shadow:0 40px 90px -20px rgba(0,0,0,.75),0 0 80px rgba(109,123,255,.2),inset 0 0 0 2px rgba(255,255,255,.08)}.ph i{position:absolute;inset:${f.bz}px;border-radius:${f.rad}px;background:#0d1020}</style></head>
<body><div class="map"></div><div class="ph"><i></i></div>${hdHtml(f, t, sub, chip)}</body></html>`;
  await shotHtml(browser, html, f.W, f.H, back);
  const front = path.join(WORK, `front-${fk}.png`);
  if (!fs.existsSync(front)) {
    const o = f.rad + f.bz, rr = (x, y, w, h, r) => `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
    await shotHtml(browser, `<!doctype html><body style="margin:0;background:transparent"><svg width="${f.W}" height="${f.H}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a3058"/><stop offset=".3" stop-color="#10142a"/><stop offset=".65" stop-color="#090b16"/><stop offset="1" stop-color="#1e2342"/></linearGradient></defs>
      <path fill-rule="evenodd" fill="url(#g)" d="${rr(f.x, f.y, f.pw, f.ph, o)}${rr(f.x + f.bz, f.y + f.bz, f.sw, f.sh, f.rad)}"/>
      <path fill="none" stroke="rgba(255,255,255,.1)" stroke-width="2" d="${rr(f.x + 1, f.y + 1, f.pw - 2, f.ph - 2, o)}"/></svg></body>`, f.W, f.H, front, true);
  }
  return { back, front };
}

// ---------- kare kare sahneler (opening, closing, drone): window.T(t) belirlenimli; her kare ekran görüntüsü ----------
const ICON = (sz, round) => rIcon({ size: 1000, round }).replace('<svg ', `<svg style="width:${sz}px;height:${sz}px;display:block" `);
const PAL = ['#ffb35c', '#ff7a8a', '#7ea6ff', '#5ec5aa'];
const ez = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x), seg = (t, a, b) => ez((t - a) / (b - a));
function pageHtml(kind, fk) {
  const f = FMT[fk], V = fk === 'V', u = V ? 1 : .72;
  const lines = V ? [['M-80 1480 L330 1480 L560 1250 L1160 1250', 0], ['M-80 380 L260 380 L420 540 L1160 540', 1], ['M1160 1620 L700 1620 L520 1800 L-80 1800', 2], ['M-80 1100 L200 1100 L380 920 L380 -80', 3]]
    : [['M-80 880 L260 880 L420 720 L1160 720', 0], ['M-80 230 L200 230 L340 370 L1160 370', 1], ['M1160 960 L800 960 L700 1160', 2], ['M200 1160 L200 640 L300 540 L300 -80', 3]];
  const svg = `<svg width="${f.W}" height="${f.H}" style="position:absolute;inset:0">${lines.map(([d, i]) => `<path class="ln" d="${d}" fill="none" stroke="${PAL[i]}" stroke-width="${V ? 22 : 16}" stroke-linecap="round" stroke-linejoin="round" opacity=".55" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>`).join('')}</svg>`;
  const css = `${FACE}*{margin:0;box-sizing:border-box}html,body{width:${f.W}px;height:${f.H}px;overflow:hidden}body{${BG};font-family:Outfit,system-ui,sans-serif;color:#eef0f7;position:relative}${bgCss(f).replace(/^body\{[^}]*\}/, '')}
.c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.ic{border-radius:${Math.round(230 * u * .6)}px;box-shadow:0 40px 80px -20px rgba(0,0,0,.75),0 0 0 2px rgba(255,255,255,.07),0 0 120px rgba(255,159,90,.25);overflow:hidden}.ic svg{border-radius:inherit}
.w{font-size:${Math.round(250 * u)}px;line-height:.95;font-weight:800;letter-spacing:-.04em;background:linear-gradient(115deg,#eef0f7 35%,#ffb35c 72%,#ff7a8a);-webkit-background-clip:text;background-clip:text;color:transparent;padding:0 .06em .08em}
.s{font-size:${Math.round(58 * u)}px;font-weight:600;color:#c3c8dd;letter-spacing:.01em}.s b{color:#ffb35c;font-weight:700}
.pill{display:inline-block;font-size:${Math.round(52 * u)}px;font-weight:800;color:#2a1405;padding:${Math.round(22 * u)}px ${Math.round(56 * u)}px;border-radius:99px;background:linear-gradient(100deg,#ffb35c,#ff7a8a);box-shadow:0 20px 60px -10px rgba(255,122,138,.55)}
.bd{display:flex;flex-direction:${V ? 'column' : 'row'};align-items:center;gap:${Math.round(44 * u)}px}.bd>div{position:relative;overflow:hidden;flex:none}.bd img{position:absolute;display:block}
.c>*{will-change:transform,opacity}`;
  const BH = V ? 150 : 110, gw = BH * 646 / 192, aw = BH * 151.29018 / 40;
  const badges = `<div class="bd"><div id="b1" style="height:${BH}px;width:${gw}px"><img src="${BADGE_G}" style="height:${BH * 250 / 192}px;top:${-BH * 29 / 192}px;left:0"></div><div id="b2" style="height:${BH}px;width:${aw}px"><img src="${BADGE_A}" style="height:${BH}px;left:0;top:0"></div></div>`;
  if (kind === 'open') return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="map"></div>${svg}
<div class="c" style="gap:${Math.round(34 * u)}px"><div class="ic" id="ic">${ICON(Math.round(330 * u), 229)}</div><div class="w" id="w">Ray</div><div class="s" id="s">Metro Bulmaca</div><div id="pw" style="margin-top:${Math.round(40 * u)}px"><span class="pill">Şimdi Google Play'de</span></div></div>
<script>const E=x=>x<0?0:x>1?1:x*x*(3-2*x),G=(t,a,b)=>E((t-a)/(b-a)),$=i=>document.getElementById(i),L=[...document.querySelectorAll('.ln')];
window.T=t=>{L.forEach((l,i)=>{l.style.strokeDashoffset=1-G(t,i*.06,.7+i*.06)});
 const a=G(t,.05,.5),b=1+.12*Math.sin(a*Math.PI)*(1-G(t,.5,.55));$('ic').style.transform='scale('+(.4+.6*a)*b+')';$('ic').style.opacity=a;
 const w=G(t,.3,.7);$('w').style.opacity=w;$('w').style.transform='translateY('+(1-w)*40+'px)';
 const s=G(t,.55,.95);$('s').style.opacity=s;$('s').style.transform='translateY('+(1-s)*30+'px)';
 const p=G(t,.85,1.3);$('pw').style.opacity=p;$('pw').style.transform='translateY('+(1-p)*50+'px) scale('+(.9+.1*p)+')'};</script></body></html>`;
  if (kind === 'close') return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="map"></div>${svg}
<div class="c" style="gap:${Math.round(30 * u)}px"><div class="ic" id="ic">${ICON(Math.round(250 * u), 229)}</div><div class="s" id="s" style="font-size:${Math.round(64 * u)}px;color:#eef0f7;font-weight:800">Ray · <b>Metro Bulmaca</b></div>
<div class="s" id="s2" style="font-size:${Math.round(46 * u)}px">Şimdi Google Play'de · App Store'da</div><div id="bd" style="margin-top:${Math.round(30 * u)}px">${badges}</div></div>
<script>const E=x=>x<0?0:x>1?1:x*x*(3-2*x),G=(t,a,b)=>E((t-a)/(b-a)),$=i=>document.getElementById(i),L=[...document.querySelectorAll('.ln')];
window.T=t=>{L.forEach((l,i)=>{l.style.strokeDashoffset=1-G(t,i*.1,.9+i*.1)});
 const a=G(t,.1,.6);$('ic').style.transform='scale('+(.6+.4*a)+')';$('ic').style.opacity=a;
 [['s',.5,.95],['s2',.8,1.25],['b1',1.1,1.55],['b2',1.3,1.75]].forEach(([i,x,y])=>{const g=G(t,x,y);$(i).style.opacity=g;$(i).style.transform='translateY('+(1-g)*36+'px)'})};</script></body></html>`;
  return '';
}
// "drone kamera": gerçek oyunun şehir sekmesi (haritanın SVG'si) üzerinde belirlenimli kamera ve tren; başlık katmanı ayrı
async function droneFrames(browser, url, fk, dir, nameTxt) {
  const f = FMT[fk], V = fk === 'V', vw = f.W / 2, vh = f.H / 2;
  const { ctx, page } = await openGame(browser, url, saveAt(633), { vp: [vw, vh], dsf: 2 });
  await tab(page, 'city'); await page.evaluate(() => document.getElementById('cPrev')?.click()); await page.waitForTimeout(1200);
  const stops = await page.evaluate(({ css, ov, V, vw, vh }) => {
    const cm = document.querySelector('.cmap'), svg = cm.querySelector('svg'); document.body.append(cm);
    [...document.body.children].forEach(e => { if (e !== cm && !e.classList.contains('cdefs')) e.style.display = 'none'; });
    document.body.style.cssText += ';background:linear-gradient(165deg,#161b33,#0d1020 62%)!important';
    cm.setAttribute('style', 'position:fixed;left:0;top:0;width:344px;height:344px;margin:0;padding:0;border:0;transform-origin:0 0;z-index:5;background:none;box-shadow:none;aspect-ratio:auto;max-width:none');
    svg.setAttribute('style', 'width:344px;height:344px;display:block;overflow:visible');
    const st = document.createElement('style'); st.textContent = css; document.head.append(st);
    const o = document.createElement('div'); o.id = 'ov'; o.innerHTML = ov; o.setAttribute('style', `position:fixed;left:0;top:0;width:${V ? 1080 : 1080}px;height:${V ? 1920 : 1080}px;transform:scale(.5);transform-origin:0 0;z-index:50;pointer-events:none`); document.body.append(o);
    const g = svg.querySelector('.mls'), ns = 'http://www.w3.org/2000/svg', tr = document.createElementNS(ns, 'g'); tr.id = 'trn';
    tr.innerHTML = '<circle r="9" fill="#fff" opacity=".25"/><circle r="5.2" fill="#fff" stroke="#ffb35c" stroke-width="2"/>'; g.append(tr);
    window.__lines = [1, 4, 7].map(k => { const p = svg.querySelector(`.sd[data-c="${k}"] .ln`); return { p, n: p.getTotalLength(), name: window.__ray.lineName(k), col: getComputedStyle(svg.querySelector(`.sd[data-c="${k}"]`)).getPropertyValue('--lc') }; });
    return window.__lines.map(l => l.name);
  }, { css: hdRules(f), ov: hdHtml(f, ['Hatları bağla,', 'şehrini ışıklandır'], V ? 'Her hat, şehre yeni bir ışık' : '', ''), V, vw, vh });
  // kamera: ekranda (cx, cy) noktası dünya (x, y) birimine oturur; z: yakınlık
  const cam = V ? { cx: vw / 2, cy: (165 + vh) / 2, S0: 1.4 } : { cx: 395, cy: vh / 2, S0: .87 }, N = Math.round(3.9 * 30);
  mk(dir); for (const x of fs.readdirSync(dir)) fs.rmSync(path.join(dir, x));
  for (let i = 0; i < N; i++) {
    const t = i / 30;
    await page.evaluate(({ t, cam, V }) => {
      const E = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x), G = (a, b) => E((t - a) / (b - a)), L = window.__lines;
      // tren: iki hat boyunca (M2 kuzey, M5 kuzeydoğu); ikisinde de merkezden uca, ara duraklarda yavaşlayarak
      const leg = t < 2.0 ? 0 : 1, a = leg ? 2.0 : .35, b = leg ? 3.3 : 1.95, q = G(a, b), l = L[leg], pt = l.p.getPointAtLength(l.n * (q * .88 + .12 * Math.sin(q * 6 * Math.PI) / 6 + .0)), pt0 = l.p.getPointAtLength(0);
      const P = t < a ? l.p.getPointAtLength(0) : pt; const trn = document.getElementById('trn'); trn.setAttribute('transform', `translate(${P.x} ${P.y})`); trn.style.opacity = G(.1, .4) * (1 - G(3.4, 3.7));
      const wx = P.x, wy = P.y, z = 1 + .95 * Math.sin(Math.PI * Math.min(1, t / 3.9)) ** 1.5, ox = (1 - Math.min(1, z - 1)) , fx = z > 1.05 ? wx : 0, fy = z > 1.05 ? wy : 0, w = Math.min(1, (z - 1) / .35);
      const X = wx * w, Y = wy * w, S = cam.S0 * z;
      const cm = document.querySelector('.cmap'); cm.style.transform = `translate(${cam.cx - (X + 172) * S}px,${cam.cy - (Y + 172) * S}px) scale(${S})`;
      const ch = document.querySelector('#ov .zchip'); const show = t > .5 && t < 3.0 ? 0 : t >= 3.0 ? 1 : -1;
      ch.innerHTML = show === 0 ? `<b>${(leg ? L[1] : L[0]).name}</b>` : show === 1 ? '<b>Işık Kent · 24 semt aydınlık</b>' : '';
      ch.style.opacity = show < 0 ? 0 : 1;
    }, { t, cam, V });
    await page.screenshot({ path: path.join(dir, `f${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 93 });
  }
  await ctx.close();
}
async function renderFrames(browser, html, fk, dur, dir) {
  const f = FMT[fk], p = await browser.newPage({ viewport: { width: f.W, height: f.H } });
  await p.setContent(html, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); mk(dir); for (const x of fs.readdirSync(dir)) fs.rmSync(path.join(dir, x));
  const N = Math.round(dur * 30);
  for (let i = 0; i < N; i++) { await p.evaluate(t => window.T(t), i / 30); await p.screenshot({ path: path.join(dir, `f${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 93 }); }
  await p.close();
}
const framesToMp4 = (dir, out, len) => ff(['-framerate', '30', '-i', path.join(dir, 'f%04d.jpg'), '-vf', `tpad=stop_mode=clone:stop_duration=3,trim=duration=${len},format=yuv420p`, '-c:v', 'libx264', '-crf', '15', '-preset', 'fast', '-r', '30', out]);

// ---------- kurgu ----------
// birim: { name, kind: 'frames'|'phone', dur (ekranda "kendi" süresi), tr (öncekinden geçiş), clip, ss (klipte başlangıç), speed, t, sub, chip }
const TR = .25, HARD = .04;
const HAT = [['🚄', 'Ekspres durak'], ['🚦', 'Sinyal karosu'], ['🌋', 'Sarsıntı durağı'], ['🔄', 'Dönüşen karo'], ['🎛', 'Kumanda'], ['⇄', 'Manevra'], ['🅿️', 'Boş peron']];
function plan(fk) {
  const V = fk === 'V', T2 = ['Hatları bağla,', 'şehrini ışıklandır'];
  if (V) return [
    { name: 'acilis', kind: 'frames', dur: 3, tr: 0 },
    { name: 'oyun', kind: 'phone', dur: 2.5, tr: TR, clip: 'oyun', ss: .35, speed: 1.55, t: T2, sub: 'Dokun, döndür, hattı yak', chip: '🚇 Metro bulmacası' },
    { name: 'drone', kind: 'frames', dur: 3.5, tr: TR },
    { name: 'ogretici', kind: 'phone', dur: 3.5, tr: TR, clip: 'ogretici', ss: 0, speed: 1, t: ['Yeni başlayanlara', 'adım adım öğretici'], sub: 'İlk bölümde seni elinden tutar', chip: '🎓 Öğretici' },
    { name: 'lig', kind: 'phone', dur: 2, tr: TR, clip: 'lig', ss: 0, speed: 1, t: ['Ligde yüksel,', 'kapışmada geç'], sub: 'Her hafta yeni bir lig, canlı rakipler', chip: '🏆 Haftalık lig' },
    { name: 'kapisma', kind: 'phone', dur: 2, tr: .2, clip: 'kapisma', ss: 0, speed: 1.85, t: ['Ligde yüksel,', 'kapışmada geç'], sub: 'Her hafta yeni bir lig, canlı rakipler', chip: '⚔️ Canlı kapışma' },
    ...HAT.map(([e, n], i) => ({ name: 'hat' + (i + 1), kind: 'phone', dur: 1.5, tr: i ? HARD : TR, clip: 'hat' + (i + 1), ss: 0, speed: 1.3, t: ['7 yeni hat,', '7 yeni kural'], sub: 'Her hat bambaşka bir bulmaca', chip: `${e} ${n}` })),
    { name: 'toren', kind: 'phone', dur: 3.5, tr: TR, clip: 'tören', ss: 0, speed: 1.1, t: ['Her biten hat', 'yeni bir semt yakar'], sub: 'Şehrin gece gece büyür', chip: '🌃 Şehrini ışıklandır' },
    { name: 'kapanis', kind: 'frames', dur: 4, tr: TR },
  ];
  return [
    { name: 'acilis', kind: 'frames', dur: 2.4, tr: 0 },
    { name: 'drone', kind: 'frames', dur: 3.4, tr: TR },
    { name: 'lig', kind: 'phone', dur: 2.6, tr: TR, clip: 'lig', ss: 0, speed: .95, t: ['Haftalık lig', 've canlı kapışma'], sub: 'Rakiplerini geç', chip: '🏆 Haftalık lig' },
    { name: 'kapisma', kind: 'phone', dur: 2.6, tr: .2, clip: 'kapisma', ss: 0, speed: 1.45, t: ['Haftalık lig', 've canlı kapışma'], sub: 'Rakiplerini geç', chip: '⚔️ Canlı kapışma' },
    ...HAT.map(([e, n], i) => ({ name: 'hat' + (i + 1), kind: 'phone', dur: 1.5, tr: i ? HARD : TR, clip: 'hat' + (i + 1), ss: 0, speed: 1.3, t: ['7 yeni hat,', '7 yeni kural'], sub: 'Her hat bambaşka bir bulmaca', chip: `${e} ${n}` })),
    { name: 'kapanis', kind: 'frames', dur: 4, tr: TR },
  ];
}
async function buildUnits(browser, url, fk) {
  const f = FMT[fk], U = plan(fk), W = path.join(WORK, 'unit-' + fk); mk(W);
  for (let k = 0; k < U.length; k++) {
    const u = U[k], len = u.dur + u.tr, out = path.join(W, `${String(k).padStart(2, '0')}-${u.name}.mp4`); u.file = out; u.len = len;
    if (arg('hazir') && fs.existsSync(out)) continue;   // --hazir=1: daha önce üretilen birimleri yeniden kullan
    if (u.kind === 'phone') {
      const { back, front } = await phoneLayers(browser, fk, u.name, u.t, u.sub, u.chip);
      const x = f.x + f.bz, y = f.y + f.bz;
      ff(['-loop', '1', '-framerate', '30', '-t', String(len), '-i', back, '-ss', String(u.ss), '-i', path.join(WORK, `klip-${u.clip}.mp4`), '-loop', '1', '-framerate', '30', '-t', String(len), '-i', front,
        '-filter_complex', `[1:v]setpts=(PTS-STARTPTS)/${u.speed},tpad=stop_mode=clone:stop_duration=3,scale=${f.sw}:${f.sh}:flags=lanczos,fps=30[c];[0:v][c]overlay=${x}:${y}:shortest=1[a];[a][2:v]overlay=0:0,format=yuv420p`,
        '-t', String(len), '-c:v', 'libx264', '-crf', '15', '-preset', 'fast', out]);
    } else if (u.name === 'drone') {
      const d = path.join(WORK, `kare-drone-${fk}`); await droneFrames(browser, url, fk, d); framesToMp4(d, out, len);
    } else {
      const d = path.join(WORK, `kare-${u.name}-${fk}`); await renderFrames(browser, pageHtml(u.name === 'acilis' ? 'open' : 'close', fk), fk, Math.min(len, u.name === 'acilis' ? 3.4 : 5.6), d); framesToMp4(d, out, len);
    }
    console.log(`birim ${fk}/${u.name} ${len.toFixed(2)} sn`);
  }
  return U;
}
const SES_IN = () => ['-i', SES];
// birimleri xfade ile birleştir; müzik (ve varsa dış ses) ekle
function assemble(U, fk, out, bellAt, endAt) {
  const total = U.reduce((a, u) => a + u.dur, 0), wav = path.join(WORK, `muzik-${fk}.wav`);
  const beat = 60 / 104, snap = t => Math.max(0, Math.round(t / (beat / 2)) * (beat / 2)), fx = [], pent = [1174.66, 1318.5, 1480, 1760, 1975.5, 2349.3, 2637];
  let S0 = 0, hi = 0;
  U.forEach((u, k) => {
    const t0 = S0 - (k ? u.tr : 0) + (k ? u.tr : 0), start = S0;   // birimin ekranda "kendi" başlangıcı
    if (k && u.tr > .1) fx.push({ type: 'whoosh', t: snap(start - u.tr - .05), d: u.tr > .1 ? .75 : .3, up: k % 2 === 0, g: u.tr > .1 ? 1 : .35, pan: k % 2 ? .3 : -.3 });
    if (u.name === 'acilis') { fx.push({ type: 'whoosh', t: 0, d: .6 }, { type: 'ding', t: snap(.5), f: 1174.66 }, { type: 'ding', t: snap(.9), f: 1760, g: 1.1 }); }
    else if (u.name === 'drone') for (let q = 0; q < 9; q++) { fx.push({ type: 'clack', t: snap(start + .5) + q * beat / 2, g: q % 2 ? .6 : 1, pan: q % 2 ? .25 : -.25 }); }
    else if (u.name === 'oyun') { for (let q = 0; q < 6; q++) fx.push({ type: 'tick', t: snap(start + .3) + q * beat / 2, f: 900 + (q % 3) * 180 }); fx.push({ type: 'ding', t: snap(start + 1.7), f: 1318.5 }); }
    else if (u.name === 'ogretici') { [.4, 1.2, 2.1].forEach(x => fx.push({ type: 'tick', t: snap(start + x), f: 1000 })); fx.push({ type: 'ding', t: snap(start + .1), f: 1480 }); }
    else if (u.name === 'lig') { fx.push({ type: 'ding', t: snap(start + .1), f: 1318.5 }); }
    else if (u.name === 'kapisma') { fx.push({ type: 'ding', t: snap(start + .1), f: 1760 }, { type: 'tick', t: snap(start + 1.2), f: 700, g: 1.3 }); }
    else if (/^hat\d$/.test(u.name)) { fx.push({ type: 'ding', t: start + .02, f: pent[hi % pent.length], g: .9 }); [.55, .75, .95].forEach((x, q) => fx.push({ type: 'tick', t: start + x, f: 950 + q * 150 })); hi++; }
    else if (u.name === 'toren') fx.push({ type: 'boom', t: start + .15, g: .35 });
    else if (u.name === 'kapanis') { fx.push({ type: 'boom', t: start + .1 }, { type: 'ding', t: start + .15, f: 1174.66 }, { type: 'ding', t: start + .15, f: 1760, g: .8 }, { type: 'ding', t: start + .15, f: 2349.3, g: .7 }); }
    S0 += u.dur;
  });
  const startOf = n => { let a = 0; for (const u of U) { if (u.name === n) return a; a += u.dur; } return -1; };
  bellAt = startOf('toren') >= 0 ? startOf('toren') + .3 : startOf('kapanis') - 1.2; endAt = startOf('kapanis');
  fs.writeFileSync(wav, synth(total, bellAt, endAt, fx));
  const inputs = U.flatMap(u => ['-i', u.file]); let chain = '', S = U[0].dur, prev = '[0:v]';
  U.slice(1).forEach((u, i) => { const k = i + 1, lab = k === U.length - 1 ? '[v]' : `[x${k}]`; chain += `${prev}[${k}:v]xfade=transition=fade:duration=${u.tr}:offset=${(S - u.tr).toFixed(3)}${lab};`; prev = lab; S += u.dur; });
  const ai = U.length, fade = `afade=t=out:st=${(total - 1.5).toFixed(2)}:d=1.5`;
  let audio, aIn = ['-i', wav];
  if (SES) {
    let vo = SES;
    if (fk === 'S') {   // kare kesimde cümleler kendi sahnelerine yerleşir (ilk, şehir, lig+kapışma, hatlar, kapanış)
      vo = path.join(WORK, 'ses-kare.wav'); const SN = [[0, 1.9, .2], [3.3, 2.3, 2.6], [13.2, 3.8, 6.0], [17.3, 4.3, 11.2], [28.3, 3.6, 17.4]];
      ff([...SES_IN(SN), '-filter_complex', SN.map(([a, d, at], i) => `[0:a]atrim=${a}:${a + d},asetpts=PTS-STARTPTS,adelay=${Math.round(at * 1000)}|${Math.round(at * 1000)}[s${i}]`).join(';') + ';' + SN.map((_, i) => `[s${i}]`).join('') + `amix=inputs=${SN.length}:normalize=0:duration=longest[o]`, '-map', '[o]', '-ar', '48000', vo]);
    }
    aIn = ['-i', wav, '-i', vo];
    audio = `[${ai}:a]volume=1[m];[${ai + 1}:a]aresample=44100,asplit=2[vo][sc];[m][sc]sidechaincompress=threshold=0.015:ratio=6:attack=40:release=500:makeup=1[md];[md]volume=.9[md2];[md2][vo]amix=inputs=2:normalize=0:duration=longest,${fade}[a]`;
  } else audio = `[${ai}:a]${fade},loudnorm=I=-14:TP=-1.2:LRA=7[a]`;
  ff([...inputs, ...aIn, '-filter_complex', chain.slice(0, -1) + ';' + audio, '-map', '[v]', '-map', '[a]', '-t', total.toFixed(2), '-c:v', 'libx264', '-crf', '20', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '160k', '-ar', '44100', out]);
  return total;
}

// ---------- duyuru görselleri ----------
async function posters(browser) {
  const img = n => `data:image/png;base64,${fs.readFileSync(path.join(WORK, 'shots', n + '.png')).toString('base64')}`;
  const BH = 112, gw = BH * 646 / 192, aw = BH * 151.29018 / 40;
  const badges = `<div class="bd"><div style="height:${BH}px;width:${gw}px"><img src="${BADGE_G}" style="height:${BH * 250 / 192}px;top:${-BH * 29 / 192}px;left:0"></div><div style="height:${BH}px;width:${aw}px"><img src="${BADGE_A}" style="height:${BH}px;left:0;top:0"></div></div>`;
  const feats = [['🎓', 'Adım adım öğretici'], ['🏆', 'Haftalık lig'], ['⚔️', 'Canlı kapışma'], ['🚇', '7 yeni hat'], ['🌃', 'Şehrini ışıklandır']];
  const phone = (n, w, cls, st) => { const h = Math.round(w * 844 / 390), bz = Math.round(w * .022); return `<div class="p ${cls}" style="width:${w + 2 * bz}px;height:${h + 2 * bz}px;padding:${bz}px;border-radius:${Math.round(w * .12) + bz}px;${st}"><img src="${img(n)}" style="width:${w}px;height:${h}px;border-radius:${Math.round(w * .12)}px"></div>`; };
  const css = (W, H) => `${FACE}*{margin:0;box-sizing:border-box}html,body{width:${W}px;height:${H}px;overflow:hidden}body{${BG};font-family:Outfit,system-ui,sans-serif;color:#eef0f7;position:relative}
.map{position:absolute;inset:-4%;background:url(${MAP}) center/cover;opacity:.07;-webkit-mask:radial-gradient(ellipse at 50% 40%,#000 25%,transparent 75%)}
h1{font-weight:800;letter-spacing:-.03em;line-height:1}h1 em{display:block;font-style:normal;background:linear-gradient(100deg,#ffb35c 10%,#ff7a8a 90%);-webkit-background-clip:text;background-clip:text;color:transparent;padding-bottom:.06em}
.s{color:#b7bdd6;font-weight:500}.p{position:absolute;background:linear-gradient(150deg,#3a4170,#141831 30%,#0a0c18 65%,#262c4f);box-shadow:0 40px 90px -20px rgba(0,0,0,.8),0 0 80px rgba(109,123,255,.18),inset 0 0 0 2px rgba(255,255,255,.08)}.p img{display:block}
.f{display:flex;flex-wrap:wrap;gap:14px}.f b{font-size:inherit;font-size:30px;font-weight:600;padding:12px 26px;border-radius:99px;background:rgba(40,46,82,.72);box-shadow:inset 0 0 0 2px rgba(255,255,255,.1)}
.bd{display:flex;align-items:center;gap:40px}.bd>div{position:relative;overflow:hidden;flex:none}.bd img{position:absolute;display:block}.ic svg{display:block;border-radius:22%;box-shadow:0 20px 50px -12px rgba(0,0,0,.7)}.note{font-size:30px;color:#b7bdd6;font-weight:600}`;
  const icon = sz => `<div class="ic">${ICON(sz, 229)}</div>`;
  const V = `<!doctype html><html><head><meta charset="utf-8"><style>${css(1080, 1920)}</style></head><body><div class="map"></div>
<div style="position:absolute;left:0;right:0;top:70px;text-align:center"><div style="display:flex;justify-content:center">${icon(150)}</div><h1 style="font-size:124px;margin-top:30px">Ray şimdi<em>Google Play'de</em></h1><p class="s" style="font-size:42px;margin-top:22px">Hatları bağla · Şehrini ışıklandır</p></div>
${phone('lig', 290, '', 'left:90px;top:700px;transform:rotate(-6deg)')}${phone('kapisma', 290, '', 'right:90px;top:700px;transform:rotate(6deg)')}${phone('harita', 350, '', 'left:344px;top:650px')}
<div style="position:absolute;left:0;right:0;top:1490px;padding:0 40px"><div class="f" style="justify-content:center;gap:12px;font-size:30px">${feats.map(([e, t]) => `<b>${e} ${t}</b>`).join('')}</div></div>
<div style="position:absolute;left:0;right:0;top:1700px;text-align:center"><div style="display:flex;justify-content:center">${badges}</div><p class="note" style="margin-top:22px">App Store'da da seni bekliyor</p></div></body></html>`;
  const H = `<!doctype html><html><head><meta charset="utf-8"><style>${css(1920, 1080)}</style></head><body><div class="map"></div>
<div style="position:absolute;left:100px;top:0;bottom:0;width:900px;display:flex;flex-direction:column;justify-content:center"><div style="display:flex">${icon(140)}</div><h1 style="font-size:128px;margin-top:34px">Ray şimdi<em>Google Play'de</em></h1><p class="s" style="font-size:42px;margin:22px 0 38px">Hatları bağla · Şehrini ışıklandır</p>
<div class="f" style="max-width:860px">${feats.map(([e, t]) => `<b>${e} ${t}</b>`).join('')}</div><div style="margin-top:50px">${badges}</div><p class="note" style="margin-top:20px">App Store'da da seni bekliyor</p></div>
${phone('lig', 300, '', 'left:1060px;top:230px;transform:rotate(-6deg)')}${phone('kapisma', 300, '', 'left:1540px;top:230px;transform:rotate(6deg)')}${phone('harita', 400, '', 'left:1260px;top:150px')}</body></html>`;
  await shotHtml(browser, V, 1080, 1920, path.join(OUT, 'ray-play-duyuru-dikey.png'));
  await shotHtml(browser, H, 1920, 1080, path.join(OUT, 'ray-play-duyuru-yatay.png'));
}

async function main() {
  mk(WORK); mk(OUT);
  const srv = await serve(), url = `http://127.0.0.1:${srv.address().port}/index.html`, browser = await chromium.launch();
  try {
    if (step('klip')) {
      const want = arg('klip') ? arg('klip').split(',') : Object.keys(CLIPS);
      for (const n of want) await recordClip(browser, url, n, CLIPS[n].save, CLIPS[n].scn, { test: CLIPS[n].test });
    }
    if (step('birlestir')) {
      const sfx = SES ? '-sesli' : '';
      for (const [fk, name, bell, end] of [['V', `ray-play-tanitim-dikey${sfx}.mp4`, 0, 0], ['S', `ray-play-tanitim-kare${sfx}.mp4`, 0, 0]]) {
        if (arg('bicim') && arg('bicim') !== fk) continue;
        const U = await buildUnits(browser, url, fk), out = path.join(OUT, name), total = assemble(U, fk, out, bell, end);
        console.log(`${name}: ${total.toFixed(1)} sn, ${(fs.statSync(out).size / 1e6).toFixed(1)} MB`);
      }
    }
    if (step('gorsel')) await posters(browser);
    if (step('onizleme') && !SES) {
      mk(path.join(OUT, 'kareler'));
      for (const [name, pre, ts] of [['ray-play-tanitim-dikey.mp4', 'dikey', [1.6, 7.5, 21, 33]], ['ray-play-tanitim-kare.mp4', 'kare', [1.4, 4.6, 9.5, 23.5]]])
        ts.forEach((t, i) => ff(['-ss', String(t), '-i', path.join(OUT, name), '-frames:v', '1', path.join(OUT, 'kareler', `${pre}-${i + 1}.png`)]));
    }
  } finally { await browser.close(); srv.close(); }
}
main().catch(e => { console.error(e); process.exit(1); });
