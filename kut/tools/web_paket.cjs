// node kut/tools/web_paket.cjs → kut/web/paket/  (yayınlanabilir tek klasör: index.html kökte, bütün yollar ./ ile)
// Geliştirme sürümü (kut/web/) üst klasördeki ortak dosyaları ../ ile kullanır; paket bunları içine kopyalar ve yolları düzeltir.
const fs = require('fs'), path = require('path');
const KUT = path.join(__dirname, '..'), WEB = path.join(KUT, 'web'), OUT = path.join(WEB, 'paket');
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const kopya = (kaynak, hedef) => { fs.mkdirSync(path.dirname(path.join(OUT, hedef)), { recursive: true }); fs.copyFileSync(path.join(KUT, kaynak), path.join(OUT, hedef)); };
const yolDuzelt = (s) => s.replace(/\.\.\/(vendor|arayuz|gorsel|data\.js|sim\.js|online\.js|lobi\.js)/g, './$1');
for (const f of ['index.html', 'arayuz.js', 'oyun.js', 'sahne3d.js', 'ses.js', 'gorunum.js', 'vfx.js', 'hareket.js']) fs.writeFileSync(path.join(OUT, f), yolDuzelt(fs.readFileSync(path.join(WEB, f), 'utf8')).replace("kok + 'modeller/' + ad + '.glb'", "kok + 'modeller/' + ad + '.json'"));
for (const f of ['data.js', 'sim.js', 'online.js', 'lobi.js']) kopya(f, f);
for (const f of ['three.module.min.js', 'LICENSE', 'addons/loaders/GLTFLoader.js', 'addons/utils/SkeletonUtils.js', 'addons/utils/BufferGeometryUtils.js',
  // görüntü kalitesi (gorunum.js): çevre ışığı + son işlem (bloom); hepsi kodla çalışır, WASM/worker/data: yok
  'addons/environments/RoomEnvironment.js', 'addons/postprocessing/EffectComposer.js', 'addons/postprocessing/RenderPass.js', 'addons/postprocessing/UnrealBloomPass.js',
  'addons/postprocessing/OutputPass.js', 'addons/postprocessing/ShaderPass.js', 'addons/postprocessing/Pass.js', 'addons/postprocessing/MaskPass.js',
  'addons/shaders/CopyShader.js', 'addons/shaders/LuminosityHighPassShader.js', 'addons/shaders/OutputShader.js']) kopya('vendor/three/' + f, 'vendor/three/' + f);
// GLB → gömülü glTF (.json): Artifact yalnız bilinen türleri sunar; GLTFLoader içeriğe bakar, uzantıya değil.
function glbJson(kaynak, hedef) {
  const b = fs.readFileSync(kaynak); if (b.readUInt32LE(0) !== 0x46546c67) throw new Error('GLB değil: ' + kaynak);
  let o = 12, json = null, bin = null;
  while (o < b.length) { const uz = b.readUInt32LE(o), tur = b.readUInt32LE(o + 4), veri = b.subarray(o + 8, o + 8 + uz); if (tur === 0x4e4f534a) json = JSON.parse(veri.toString('utf8').replace(/\0+$/, '')); else if (tur === 0x004e4942) bin = veri; o += 8 + uz; }
  if (bin) json.buffers[0].uri = 'data:application/octet-stream;base64,' + bin.toString('base64');
  fs.mkdirSync(path.dirname(hedef), { recursive: true }); fs.writeFileSync(hedef, JSON.stringify(json));
}
for (const f of fs.readdirSync(path.join(WEB, 'modeller'))) if (f.endsWith('.glb')) glbJson(path.join(WEB, 'modeller', f), path.join(OUT, 'modeller', f.replace(/\.glb$/, '.json')));
for (const f of fs.readdirSync(path.join(KUT, 'arayuz'))) if (f.endsWith('.png')) kopya('arayuz/' + f, 'arayuz/' + f);
for (const f of fs.readdirSync(path.join(KUT, 'arayuz', 'portre'))) kopya('arayuz/portre/' + f, 'arayuz/portre/' + f);
for (const f of fs.readdirSync(path.join(WEB, 'ses'))) if (f.endsWith('.mp3')) { fs.mkdirSync(path.join(OUT, 'ses'), { recursive: true }); fs.copyFileSync(path.join(WEB, 'ses', f), path.join(OUT, 'ses', f)); }
for (const f of ['gokyuzu.webp', 'doku_tas.webp', 'doku_cimen.webp']) kopya('gorsel/' + f, 'gorsel/' + f);
// kalan ../ yolu var mı?
const kalan = ['index.html', 'arayuz.js', 'sahne3d.js', 'gorunum.js', 'vfx.js', 'hareket.js'].flatMap(f => fs.readFileSync(path.join(OUT, f), 'utf8').split('\n').filter(l => !/^\s*(\/\*|\/\/|\*)/.test(l) && /['"`]\.\.\//.test(l)).map(l => f + ': ' + l.trim().slice(0, 80)));
let toplam = 0, sayi = 0; (function gez(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) gez(p); else { toplam += fs.statSync(p).size; sayi++; } } })(OUT);
console.log(`paket: ${sayi} dosya, ${(toplam / 1e6).toFixed(1)} MB → ${OUT}`);
if (kalan.length) { console.log('UYARI, düzeltilmemiş yollar:', kalan); process.exit(1); }
// claude.ai Artifact sürümü: platform sayfa iskeletini kendisi ekler; doctype/html/head/body etiketleri ve meta satırları çıkarılır.
{
  const h = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');
  const bas = h.slice(h.indexOf('<head>') + 6, h.indexOf('</head>')), govde = h.slice(h.indexOf('<body>') + 6, h.lastIndexOf('</body>'));
  const temizBas = bas.split('\n').filter(l => !/^\s*<meta\s/i.test(l)).join('\n');
  const title = (temizBas.match(/<title>.*?<\/title>/) || ['<title>Kut Arena</title>'])[0];
  fs.writeFileSync(path.join(OUT, 'artifact.html'), title + '\n' + temizBas.replace(title, '') + '\n' + govde);
  console.log('artifact.html yazıldı');
}
