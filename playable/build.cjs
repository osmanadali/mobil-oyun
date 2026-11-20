// Ray playable derleyicisi: playable/src → playable/dist
//   node playable/build.cjs [--google-size=320x480]
// Çıktılar: ray-playable.html (tek dosya, genel/AppLovin/Unity/Meta için temel sürüm)
//           ray-playable-google.zip (kökte index.html + Google exitapi.js kabuğu + ad.size meta)
// Yeni ağ eklemek için TARGETS'e bir giriş ekleyin: meta (başlık etiketleri), external (yalnız o ağın kabuk betiği),
// urls (mağaza bağlantıları; null = gömülmez), out (çıktı dosyası), zip (true: kökte index.html olan zip).
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const SRC = path.join(__dirname, 'src'), DIST = path.join(__dirname, 'dist'), ROOT = path.join(__dirname, '..');
const URLS = {
  ios: 'https://apps.apple.com/app/id6831928554?ct=playable',
  android: 'https://play.google.com/store/apps/details?id=com.osmanadali.ray&referrer=utm_source%3Dplayable',
};
const gs = (process.argv.find(a => a.startsWith('--google-size=')) || '--google-size=320x480').split('=')[1].split('x');
const EXITAPI = '<script type="text/javascript" src="https://tpc.googlesyndication.com/pagead/gadgets/html5/api/exitapi.js"></script>';
const TARGETS = {
  web: { meta: '', external: '', urls: URLS, out: 'ray-playable.html', zip: false },
  // Google: tıklama adresi Google Ads'ten gelir (ExitApi.exit); sayfada mağaza bağlantısı, yönlendirme ya da window.open yolu çalışmaz
  google: { meta: `<meta name="ad.size" content="width=${gs[0]},height=${gs[1]}">`, external: EXITAPI, urls: {}, out: 'ray-playable-google.zip', zip: true },
  // örnek (ileride): applovin: { meta: '', external: '', urls: URLS, out: 'ray-playable-applovin.html', zip: false },
};

const read = f => fs.readFileSync(path.join(SRC, f), 'utf8');
const b64 = (f, mime) => `data:${mime};base64,${fs.readFileSync(f).toString('base64')}`;
const ASSETS = {
  ICON: b64(path.join(SRC, 'assets', 'icon-192.png'), 'image/png'),
  // resmi rozetler orijinal hâliyle (değiştirilmeden) gömülür
  BADGE_IOS: b64(path.join(ROOT, 'store', 'tanitim', 'rozet', 'app-store-tr.svg'), 'image/svg+xml'),
  BADGE_AND: b64(path.join(ROOT, 'store', 'tanitim', 'rozet', 'google-play-tr.png'), 'image/png'),
};

// yalnız yorumları atar (tam satır yorumu ve koda eklenmiş sonda yorum); dize içinde // bulunmaz (denetlenir)
const strip = s => s.split('\n').map(l => l.replace(/^\s*\/\/.*$/, '').replace(/(\S)\s+\/\/[^'"\n]*$/, '$1')).filter(l => l.trim()).join('\n');
function page(t) {
  const js = `var RAY_BUILD=${JSON.stringify({ target: t.zip ? 'google' : 'web', ios: t.urls.ios || null, android: t.urls.android || null })};\n` + strip(read('cta.js')) + '\n' + strip(read('game.js'));
  let h = read('index.html');
  const sub = { META: t.meta, CSS: read('style.css'), SCRIPTS_EXTERNAL: t.external, JS: js, ...ASSETS };
  for (const k in sub) h = h.split(`{{${k}}}`).join(sub[k]);   // split/join: değer içindeki $ özel anlam taşımaz
  return h;
}

// küçük zip yazıcı (bağımlılıksız): deflate, tek dosya yeter ama çoklu dosyayı da destekler
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
    cen.push(ch, nm);
    off += 30 + nm.length + def.length;
  }
  const cd = Buffer.concat(cen), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16);
  return Buffer.concat([...parts, cd, end]);
}

fs.mkdirSync(DIST, { recursive: true });
for (const [name, t] of Object.entries(TARGETS)) {
  const html = Buffer.from(page(t), 'utf8');
  const out = path.join(DIST, t.out);
  fs.writeFileSync(out, t.zip ? zip([['index.html', html]]) : html);
  console.log(`${name}: ${path.relative(ROOT, out)} ${fs.statSync(out).size} bayt`);
}
