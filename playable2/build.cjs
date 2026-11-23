// Ray oynanabilir reklam 2: asıl oyunun kodu (www/) değiştirilmeden tek HTML'e paketlenir; üstüne reklam yönetmeni (src/ad.js) eklenir.
//   node playable2/build.cjs [--theme=neon,synth,lava] [--google-size=320x480]
// Çıktılar (her tema): dist/ray-reklam-<tema>.html (genel) · dist/ray-reklam-<tema>-google.zip (kökte index.html + ExitApi)
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const HERE = __dirname, SRC = path.join(HERE, 'src'), DIST = path.join(HERE, 'dist'), ROOT = path.join(HERE, '..'), WWW = path.join(ROOT, 'www');
const arg = (k, d) => (process.argv.find(a => a.startsWith(`--${k}=`)) || `--${k}=${d}`).split('=')[1];
const THEMES = arg('theme', 'neon,synth,lava').split(','), GS = arg('google-size', '320x480').split('x');
const URLS = { ios: 'https://apps.apple.com/app/id6831928554?ct=playable2', android: 'https://play.google.com/store/apps/details?id=com.osmanadali.ray&referrer=utm_source%3Dplayable2' };
const LVL = 186;
const b64 = (f, mime) => `data:${mime};base64,${fs.readFileSync(f).toString('base64')}`;
const rd = f => fs.readFileSync(f, 'utf8');

(async () => {
  fs.mkdirSync(DIST, { recursive: true });
  const P = await require('./plan.cjs')(LVL);
  if (P.order.length < 7 || P.key.n < 10 || !P.solvedOk) throw Error('bulmaca planı zayıf: ' + JSON.stringify(P.key));
  // oyun sayfası: <body> içeriği (betiklerden önce) + betik sırası index.html'den
  const idx = rd(path.join(WWW, 'index.html'));
  const ipad = idx.match(/<script>\/\* 📱→iPad[\s\S]*?<\/script>/)[0];
  const body = idx.slice(idx.indexOf('<body>') + 6, idx.indexOf('<script src='));
  const srcs = [...idx.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
  let css = rd(path.join(WWW, 'style.css'));
  css = css.replace(/url\((fonts\/[^)]+\.woff2)\)/g, (_, f) => `url(${b64(path.join(WWW, f), 'font/woff2')})`);
  const game = srcs.map(s => `<script>${rd(path.join(WWW, s))}</script>`).join('\n');
  const skins = await skinTable();
  const icon = b64(path.join(ROOT, 'store', 'play-icon-512.png'), 'image/png');
  const badgeIos = b64(path.join(ROOT, 'store', 'tanitim', 'rozet', 'app-store-tr.svg'), 'image/svg+xml');
  const badgeAnd = b64(path.join(ROOT, 'store', 'tanitim', 'rozet', 'google-play-tr.png'), 'image/png');
  const stars = Object.fromEntries(Array.from({ length: LVL - 1 }, (_, k) => [k + 1, 3]));
  const seen = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [i, 1]));
  for (const th of THEMES) {
    const sk = skins[th]; if (!sk) throw Error('tema yok: ' + th);
    const save = { played: LVL, level: LVL, stars, seen: { ...seen, hex: 1 }, remindAsked: true, g11: 1, lastGift: 0, spent: 1, theme: 'dark', sound: true, music: false, vib: true,
      skin: th, owned: { [th]: 1 }, allThemes: true, runs: { level: { lvl: LVL, cur: P.cur, fixed: P.cur.map(() => false), moves: 0, last: -1, ms: 0, sig: P.sig } } };
    for (const t of ['web', 'google']) {
      const google = t === 'google';
      const ad = { save, order: P.order, demo: P.demo, line: 8, icon, badgeIos, badgeAnd };
      const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<meta name="theme-color" content="#0e1120">
${google ? `<meta name="ad.size" content="width=${GS[0]},height=${GS[1]}">` : ''}<title>Ray: Metro Bulmaca</title>
${ipad}
<style>${css}
${rd(path.join(SRC, 'ad.css'))}
:root{--adg1:${sk.acc[0]};--adg2:${sk.acc[1]}}</style>
${google ? '<script type="text/javascript" src="https://tpc.googlesyndication.com/pagead/gadgets/html5/api/exitapi.js"></script>' : ''}
</head><body>${body}
<script>var RAY_BUILD=${JSON.stringify({ target: t, ios: google ? null : URLS.ios, android: google ? null : URLS.android })};
var RAY_AD=${JSON.stringify(ad)};RAY_AD.save.lastGift=Date.now();
${rd(path.join(SRC, 'pre.js'))}
${rd(path.join(SRC, 'cta.js'))}</script>
${game}
<script>${rd(path.join(SRC, 'ad.js'))}</script>
</body></html>`;
      if (google) fs.writeFileSync(path.join(DIST, `ray-reklam-${th}-google.zip`), zip([['index.html', Buffer.from(html)]]));
      else fs.writeFileSync(path.join(DIST, `ray-reklam-${th}.html`), html);
      console.log(th, t, (Buffer.byteLength(html) / 1024).toFixed(0) + ' KB', google ? `(zip ${(fs.statSync(path.join(DIST, `ray-reklam-${th}-google.zip`)).size / 1024).toFixed(0)} KB)` : '');
    }
  }
})().catch(e => { console.error(e); process.exit(1); });

// tema renkleri oyunun kendi SKINS tablosundan (kopya tutulmaz)
async function skinTable() {
  const { chromium } = require('playwright'); const b = await chromium.launch(), p = await b.newPage();
  await p.addInitScript('window.__noIntro = true; window.__ligFake = true;');
  await p.goto('file://' + path.join(WWW, 'index.html')); await p.waitForTimeout(400);
  const t = await p.evaluate(() => Object.fromEntries(window.__ray.SKINS.filter(k => k.acc).map(k => [k.id, { acc: k.acc }])));
  await b.close(); return t;
}
const crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = crcT[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function zip(files) {
  const parts = [], cen = []; let off = 0;
  for (const [name, data] of files) {
    const nm = Buffer.from(name), def = zlib.deflateRawSync(data, { level: 9 }), crc = crc32(data);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(8, 8);
    lh.writeUInt16LE(0, 10); lh.writeUInt16LE(0x21, 12); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(def.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(nm.length, 26);
    parts.push(lh, nm, def);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(8, 10);
    ch.writeUInt16LE(0, 12); ch.writeUInt16LE(0x21, 14); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(def.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(nm.length, 28); ch.writeUInt32LE(off, 42);
    cen.push(ch, nm); off += 30 + nm.length + def.length;
  }
  const cd = Buffer.concat(cen), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16);
  return Buffer.concat([...parts, cd, end]);
}
