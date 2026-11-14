/* Kut Arena — görüntü kalitesi modülü (tarayıcı sürümü).
   Amaç: oyundaki Tripo yaratıklarının 3D portreler (../arayuz/portre/*.png) kadar canlı, doygun ve hacimli görünmesi.
   İçerik: gün batımı tonlu çevre ışığı (RoomEnvironment + PMREM, dosyasız), renk koruyan ton eşleme, kalite kademeli
   bloom (EffectComposer), yaratık malzemesi iyileştirme (fresnel kenar ışığı, doygunluk, dokudan parlama maskesi,
   vuruş parlaması), üç noktalı gün batımı ışık düzeni ve paylaşımlı yumuşak temas gölgesi.
   Yalnız görüntüyü etkiler; savaş motoruna (sim.js) dokunmaz.

   Kullanım sırası (sahne3d.js):
     kur(renderer, sahne, kamera, { kalite })   // renderer + sahne + kamera kurulduktan hemen sonra
     isikKur(sahne, { kalite })                  // eski Hemisphere/Directional ışıkların YERİNE
     malzemeIyilestir(model, { renk: 'biz' | 'rakip' })   // her yaratık klonundan sonra
     boyutla(w, h, dpr)                          // her yeniden boyutlamada (renderer.setSize yerine)
     ciz()                                       // her karede renderer.render(sahne, kamera) yerine
*/
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from '../vendor/three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../vendor/three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from '../vendor/three/addons/postprocessing/ShaderPass.js';

// ── Ayarlar (canlı değiştirilebilir; test sayfası ve hata ayıklama için dışa açık) ──
export const AYAR = {
  ton: 'notr',            // 'notr' (NeutralToneMapping, renk/doygunluk korur) | 'agx' | 'aces'
  pozlama: 0.9, 
  ortamYogunluk: 0.32,     // sahne.environmentIntensity (arena, nesneler)
  yaratikOrtam: 0.55,     // yaratık malzemelerinin envMapIntensity'si (kendi envMap'leri ile)
  bloomGuc: 0.5, bloomYaricap: 0.4, bloomEsik: 1.1,   // eşik 1'in üstünde: yalnız HDR efekt çekirdekleri parlar, geniş alanlar değil
  bloomOlcek: 0.5,        // bloom çözünürlüğü (ekranın oranı)
  puruzluluk: 0.58, metallik: 0.0, normalOlcek: 1.25,
  doygunluk: 1.18,        // doku doygunluk çarpanı (1 = değişmez)
  kontrast: 1.18,
  rimGuc: 0.5, rimUs: 2.8,
  vinyet: 0.22,           // yalnız 'yuksek': kenarlar bu oranda kararır (yaratıklar ortada öne çıksın)
  parlama: 1.4,           // dokudaki yerel olarak parlak-doygun ayrıntıların (kristal, göz, desen) kendinden ışıması
  parlamaEsik: 0.1,       // piksel ile çevresinin (bulanık mip) parlaklık farkı eşiği (doğrusal)
  parlamaBulanik: 5.0,    // çevre için mip sapması (büyük = daha geniş çevre)      // doygunluk×parlaklık eşiği (doğrusal uzayda)
};
// Taraf kenar ışığı renkleri: bizimki soğuk mavi-beyaz, rakip çok hafif sıcak kırmızımsı
export const RIM = { biz: new THREE.Color('#6ab8ff'), rakip: new THREE.Color('#ff6a50'), notr: new THREE.Color('#ffe6c8') };
export const RIM_GUC = { biz: 0.5, rakip: 0.6, notr: 0.45 };
// Kahramana özel ince ayar (doku yapısına göre): parlama maskesi çok geniş kalanlar kısılır
export const KAHRAMAN_AYAR = {};

let R = null, S = null, K = null, composer = null, bloom = null, ortamDoku = null, kalite = 'yuksek';
let boyut = { w: 1, h: 1, dpr: 1 };

const TON = { notr: THREE.NeutralToneMapping, agx: THREE.AgXToneMapping, aces: THREE.ACESFilmicToneMapping };

// ── Kurulum ──
export function kur(renderer, sahne, kamera, { kalite: k = 'yuksek', ton, pozlama } = {}) {
  R = renderer; S = sahne; K = kamera; kalite = k === 'hafif' ? 'hafif' : 'yuksek';
  if (ton) AYAR.ton = ton; if (pozlama != null) AYAR.pozlama = pozlama;
  R.outputColorSpace = THREE.SRGBColorSpace;
  tonUygula();
  // yumuşak gölge: PCF + yarıçap (PCFSoft yarıçapı yok saydığı için düz PCF daha yumuşak sonuç verir)
  R.shadowMap.enabled = true;
  R.shadowMap.type = THREE.PCFShadowMap;
  // çevre ışığı: RoomEnvironment'ı gün batımı renklerine boya, PMREM ile ön-süz
  if (!ortamDoku) {
    const pm = new THREE.PMREMGenerator(R);
    const oda = gunBatimiOdasi();
    ortamDoku = pm.fromScene(oda, 0.04).texture;
    oda.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
    pm.dispose();
  }
  S.environment = ortamDoku;
  S.environmentIntensity = AYAR.ortamYogunluk;
  // son işlem (yalnız 'yuksek')
  composer = null; bloom = null;
  if (kalite === 'yuksek') {
    const c = R.domElement, w = Math.max(1, c.width), h = Math.max(1, c.height);
    const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4 });
    composer = new EffectComposer(R, rt);
    composer.addPass(new RenderPass(S, K));
    bloom = new UnrealBloomPass(new THREE.Vector2(w * AYAR.bloomOlcek, h * AYAR.bloomOlcek), AYAR.bloomGuc, AYAR.bloomYaricap, AYAR.bloomEsik);
    composer.addPass(bloom);
    // ucuz vinyet + hafif doygunluk (6 satır): kenarlar kararır, yaratıklar ortada öne çıkar
    composer.addPass(new ShaderPass({ uniforms: { tDiffuse: { value: null }, uVin: { value: AYAR.vinyet } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform sampler2D tDiffuse; uniform float uVin; varying vec2 vUv;
        void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = vUv - 0.5; float v = 1.0 - uVin * smoothstep(0.18, 0.62, dot(d, d) * 1.6);
          float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722)); c.rgb = max(mix(vec3(l), c.rgb, 1.06), 0.0) * v; gl_FragColor = c; }` }));
    composer.addPass(new OutputPass());   // ton eşleme + sRGB burada
  }
  return { composer, ortamDoku };
}

export function tonUygula() {
  if (!R) return;
  R.toneMapping = TON[AYAR.ton] ?? THREE.NeutralToneMapping;
  R.toneMappingExposure = AYAR.pozlama;
  if (bloom) { bloom.strength = AYAR.bloomGuc; bloom.radius = AYAR.bloomYaricap; bloom.threshold = AYAR.bloomEsik; }
  if (S) S.environmentIntensity = AYAR.ortamYogunluk;
}

function gunBatimiOdasi() {
  const oda = new RoomEnvironment();
  const tint = (o) => {
    const p = o.position;
    if (p.x < -10) return '#ffb46e';           // sol: güneş tarafı, altın-turuncu
    if (p.x > 10) return '#b7a2ff';            // sağ: mor gök
    if (p.z > 10) return '#ffe2f2';            // ön (kamera tarafı): pembe-beyaz
    if (p.z < -10) return '#ff9358';           // arka: batan güneş
    return '#efe0ff';
  };
  oda.traverse(o => {
    if (!o.isMesh) return;
    const m = o.material;
    if (m.isMeshBasicMaterial) { o.material = m.clone(); o.material.color.multiply(new THREE.Color(tint(o))); }
    else if (m.side === THREE.BackSide) { o.material = m.clone(); o.material.color.set('#b9a6d6'); }   // duvarlar: lavanta
  });
  return oda;
}

// ── Çizim ve boyut ──
export function ciz(sahne = S, kamera = K) {
  if (composer && sahne === S && kamera === K) composer.render();
  else R.render(sahne, kamera);
}

export function boyutla(w, h, dpr = 1) {
  if (!R || !w || !h) return;
  boyut = { w, h, dpr };
  R.setPixelRatio(dpr); R.setSize(w, h, false);
  if (composer) {
    composer.setPixelRatio(dpr); composer.setSize(w, h);
    // bloom ekranın bir kesrinde çalışsın (tablet bant genişliği)
    bloom.setSize(Math.max(2, Math.round(w * dpr * AYAR.bloomOlcek)), Math.max(2, Math.round(h * dpr * AYAR.bloomOlcek)));
  }
}

export function kaliteDegistir(k) {
  if (!R) return;
  kur(R, S, K, { kalite: k });
  boyutla(boyut.w, boyut.h, boyut.dpr);
  if (isiklar) isiklar.gunes.shadow.mapSize.setScalar(k === 'hafif' ? 1024 : 2048), isiklar.gunes.shadow.map?.dispose(), isiklar.gunes.shadow.map = null;
}

// ── Işık düzeni: gün batımı ana ışık + gökten dolgu + arkadan kenar ışığı ──
let isiklar = null;
export function isikKur(sahne = S, { kalite: k = kalite, alan = 7 } = {}) {
  if (isiklar) for (const l of Object.values(isiklar)) l.parent?.remove(l);
  // gökten dolgu: üst lavanta-mavi, alt sıcak mor (yansıyan ada ışığı)
  const gok = new THREE.HemisphereLight('#d9ccff', '#4a2a48', 0.38);
  // ana ışık: sol-önden alçak altın güneş (rakiplerin yüzü ve bizimkilerin sırtı okunsun), yumuşak gölge
  // alçak ve yandan: yaratıklarda koyu-açık form ayrımı (portrelerdeki hacim) belirginleşir
  const gunes = new THREE.DirectionalLight('#ffe2c0', 3.0);
  gunes.position.set(-8, 6, 2);
  gunes.castShadow = true;
  gunes.shadow.mapSize.setScalar(k === 'hafif' ? 1024 : 2048);
  Object.assign(gunes.shadow.camera, { left: -alan, right: alan, top: alan, bottom: -alan, near: 1, far: 40 });
  gunes.shadow.bias = -0.0004; gunes.shadow.normalBias = 0.025; gunes.shadow.radius = k === 'hafif' ? 2 : 4;
  // kenar ışığı: arkadan (batan güneş yönü, -Z) turuncu-pembe, gölgesiz — siluetleri gökten ayırır
  // yukarıdan bakan kameradan da görünsün diye daha yüksekte
  const kenar = new THREE.DirectionalLight('#ff9a6a', 2.8);
  kenar.position.set(2, 7, -6);
  // soğuk karşı dolgu: sağ-önden çok hafif mavi (gölge tarafı ölü siyah kalmasın)
  const dolgu = new THREE.DirectionalLight('#9ab8ff', 0.45);
  dolgu.position.set(6, 5, 7);
  for (const l of [gok, gunes, kenar, dolgu]) sahne.add(l);
  sahne.add(gunes.target, kenar.target, dolgu.target);
  isiklar = { gok, gunes, kenar, dolgu };
  return isiklar;
}

// ── Yaratık malzemesi ──
const SHADER_ANAHTAR = 'kutGorunum3';
function yamala(m) {
  const u = m.userData.kut;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
uniform vec3 uRimRenk; uniform float uRimGuc; uniform float uRimUs;
uniform float uDoy; uniform float uKontrast; uniform float uParla; uniform float uParlaEsik; uniform float uParlaBias;
uniform vec3 uVurusRenk; uniform float uVurus;`)
      .replace('#include <map_fragment>', `#include <map_fragment>
{ float l_ = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  diffuseColor.rgb = max(mix(vec3(l_), diffuseColor.rgb, uDoy), 0.0);
  diffuseColor.rgb = max((diffuseColor.rgb - 0.18) * uKontrast + 0.18, 0.0); }
vec3 kutTaban = diffuseColor.rgb;`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{
#ifdef USE_MAP
  // parlama maskesi: dokunun kendi bulanık mip'ine göre YEREL olarak belirgin parlak + doygun ayrıntılar (göz, kristal, desen).
  // Gövdenin tamamı açık/doygun renkli olsa bile (kuğu, kurbağa) geniş alanlar parlamaz.
  vec3 ham_ = texture2D(map, vMapUv).rgb, bul_ = texture2D(map, vMapUv, uParlaBias).rgb;
  float mx_ = max(ham_.r, max(ham_.g, ham_.b)), mn_ = min(ham_.r, min(ham_.g, ham_.b));
  float sat_ = (mx_ - mn_) / max(mx_, 1e-4);
  float fark_ = mx_ - max(bul_.r, max(bul_.g, bul_.b));
  float maske_ = smoothstep(uParlaEsik, uParlaEsik + 0.2, fark_) * smoothstep(0.25, 0.6, sat_);
  totalEmissiveRadiance += kutTaban * maske_ * uParla;
#endif
  vec3 v_ = normalize(vViewPosition);
  float f_ = pow(1.0 - saturate(dot(normal, v_)), uRimUs);
  totalEmissiveRadiance += uRimRenk * (f_ * uRimGuc * (0.55 + 0.45 * saturate(normal.y + 0.5)));
  totalEmissiveRadiance += uVurusRenk * uVurus; }`);
  };
  m.customProgramCacheKey = () => SHADER_ANAHTAR;
}

/** Bir yaratık modelinin (SkeletonUtils.clone sonucu) malzemelerini iyileştirir.
 *  Malzemeleri KLONLAR (aynı kahraman iki tarafta da olabilir; kenar rengi taraf başına).
 *  renk: 'biz' | 'rakip' | 'notr' | THREE.Color | css dizgesi.  kahraman: id (KAHRAMAN_AYAR için, isteğe bağlı).
 *  Dönen nesne: { malzemeler, parlat(miktar, renk?) } — vuruş parlaması için. */
export function malzemeIyilestir(model, { renk = 'biz', kahraman = null, parlama, doygunluk, rimGuc, golge = true } = {}) {
  const ozel = (kahraman && KAHRAMAN_AYAR[kahraman]) || {};
  const rim = renk instanceof THREE.Color ? renk : (RIM[renk] || new THREE.Color(renk));
  const onbellek = new Map(), malzemeler = [];
  model.traverse(o => {
    if (!o.isMesh) return;
    if (golge) { o.castShadow = true; o.receiveShadow = true; }
    const tek = (m) => {
      if (!m || !m.isMeshStandardMaterial) return m;
      if (onbellek.has(m)) return onbellek.get(m);
      const y = m.clone();
      y.roughness = AYAR.puruzluluk; y.metalness = AYAR.metallik;
      if (ortamDoku) { y.envMap = ortamDoku; y.envMapIntensity = AYAR.yaratikOrtam; }
      if (y.normalMap) y.normalScale.setScalar(AYAR.normalOlcek);
      y.userData.kut = {
        uRimRenk: { value: rim.clone() }, uRimGuc: { value: rimGuc ?? ((typeof renk === 'string' && RIM_GUC[renk]) || AYAR.rimGuc) }, uRimUs: { value: AYAR.rimUs },
        uDoy: { value: doygunluk ?? AYAR.doygunluk }, uKontrast: { value: AYAR.kontrast },
        uParla: { value: parlama ?? ozel.parlama ?? AYAR.parlama }, uParlaEsik: { value: AYAR.parlamaEsik }, uParlaBias: { value: AYAR.parlamaBulanik },
        uVurusRenk: { value: new THREE.Color('#ffffff') }, uVurus: { value: 0 },
      };
      yamala(y);
      onbellek.set(m, y); malzemeler.push(y);
      return y;
    };
    o.material = Array.isArray(o.material) ? o.material.map(tek) : tek(o.material);
  });
  const sonuc = {
    malzemeler,
    /** Vuruş/iyileşme parlaması: miktar 0..1 (her karede azaltın), renk isteğe bağlı. */
    parlat(miktar, r) { for (const m of malzemeler) { m.userData.kut.uVurus.value = miktar; if (r) m.userData.kut.uVurusRenk.value.set(r); } },
    /** Kenar ışığı rengini/gücünü değiştir (ör. seçili birim, Kut dokunuşu). */
    kenar(r, guc) { for (const m of malzemeler) { if (r) m.userData.kut.uRimRenk.value.set(r); if (guc != null) m.userData.kut.uRimGuc.value = guc; } },
  };
  model.userData.gorunum = sonuc;
  return sonuc;
}

/** Arena/çevre nesneleri için hafif ayar (ortam ışığından pay alsın, fazla mat kalmasın). */
export function cevreIyilestir(o, { puruzluluk = 0.8 } = {}) {
  o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true;
    const mm = m.material; if (mm && mm.isMeshStandardMaterial) { mm.roughness = Math.min(mm.roughness, puruzluluk); mm.metalness = 0; } } });
}

/** Bloom'a girecek efekt rengi: >1 değerler eşiği aşar ve parlar. Ör. new MeshBasicMaterial({ color: parlakRenk('#ffd27a', 2.2) }). */
export function parlakRenk(css, kat = 2) { return new THREE.Color(css).multiplyScalar(kat); }

// ── Yumuşak temas gölgesi (paylaşımlı geometri + malzeme; ayak altına) ──
let lekeGeo = null, lekeMat = null;
export function golgeLekesi(yaricap = 0.5, koyuluk = 0.45) {
  if (!lekeGeo) {
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(30,10,40,1)'); g.addColorStop(0.5, 'rgba(30,10,40,0.55)'); g.addColorStop(1, 'rgba(30,10,40,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    lekeGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    lekeMat = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, opacity: 0.45, toneMapped: false, fog: false });
  }
  // koyuluk varsayılan değilse malzeme bir kez klonlanır (çağıran tarafta önbelleklenmeli; varsayılan paylaşımlıdır)
  const m = new THREE.Mesh(lekeGeo, koyuluk === 0.45 ? lekeMat : Object.assign(lekeMat.clone(), { opacity: koyuluk }));
  m.scale.set(yaricap * 2, 1, yaricap * 2); m.position.y = 0.015; m.renderOrder = -1;
  return m;
}

export function durum() { return { kalite, composer: !!composer, ton: AYAR.ton, ortam: !!ortamDoku }; }
