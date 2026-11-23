/* Kut Arena — hareket ve oyun hissi (game feel) katmanı. Kurallar: ../ANIMASYON_PLANI.md
   Yalnız GÖRÜNTÜYÜ etkiler; savaş motoruna (sim.js) hiçbir şey yazmaz.
   İçerik:
     his                 → hit-stop / yavaşlatma (görsel dt), kamera sarsıntısı ve yakınlaştırma, birim gövde tepkileri
                           (geri savrulma, sıkış-uz, beyaz parlama, atılma, gökten giriş, çözülerek ölüm, zafer zıplaması)
     dortAyakliKur/Guncelle → Tripo dört ayaklı iskeleti için kodlu hareket (tırıs + ayak IK'sı, saldırı, yetenek, vurulma, ölüm)
     yilanKur/Guncelle   → yılan boyun zinciri (S kıvrımı, geri çekilip atılma, tükürme, yere serilme)
     ikiAyakliKur/Guncelle → UAL klipleri üstüne katman (nefes çeşitliliği, hazırlık eğilmesi, vuruş itişi, kanat çırpma, yürüme salınımı)
     onYonAci            → dört ayaklı/yılan modelinin ön yönünü kemiklerden sağlam biçimde bulur
   Sahiplik (çakışma olmasın):  kok (birim kökü) → sahne3d (konum, bakış yönü);  govde → his;
   model dönüşümü + kemikler → dortAyakli/yilan (iki ayaklıda kemikler: aktar() sonra ikiAyakliGuncelle). */
import * as THREE from 'three';

// ───────────────────────── ortak yardımcılar ─────────────────────────
const PI2 = Math.PI * 2;
const kirp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const yumusak = (x) => { x = kirp(x); return x * x * (3 - 2 * x); };
const cikis3 = (x) => { x = kirp(x); const y = 1 - x; return 1 - y * y * y; };
const giris2 = (x) => { x = kirp(x); return x * x; };
const karis = (a, b, k) => a + (b - a) * k;
function ozet(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
/** 1B pürüzsüz değer gürültüsü, −1..1 */
function gurultu(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return (ozet(i) * (1 - u) + ozet(i + 1) * u) * 2 - 1; }
/** Anahtar kare dizisi: [[t, k1, k2, ...], ...] — kanallar yumuşak geçişle aradeğerlenir; çıktı dizisine yazar */
function anahtar(dizi, t, cikti) {
  const n = dizi[0].length - 1;
  if (t <= dizi[0][0]) { for (let j = 0; j < n; j++) cikti[j] = dizi[0][j + 1]; return cikti; }
  for (let i = 1; i < dizi.length; i++) {
    const b = dizi[i];
    if (t <= b[0]) { const a = dizi[i - 1], k = yumusak((t - a[0]) / Math.max(1e-6, b[0] - a[0])); for (let j = 0; j < n; j++) cikti[j] = karis(a[j + 1], b[j + 1], k); return cikti; }
  }
  const s = dizi[dizi.length - 1]; for (let j = 0; j < n; j++) cikti[j] = s[j + 1]; return cikti;
}
/** Sönümlü yay (yarı örtük Euler, alt adımlı): s = {x, v} */
function yay(s, hedef, k, c, dt) {
  const n = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / n;
  for (let i = 0; i < n; i++) { s.v += (-k * (s.x - hedef) - c * s.v) * h; s.x += s.v * h; }
}
/** Frekans/sönüm oranıyla yay (REFERANS_ANIMASYON 2.2; örtük Euler, büyük dt'de kararlı): s = {x, v}, f Hz, z = ζ */
function yayFZ(s, hedef, f, z, dt) {
  const w = PI2 * f, a = 1 + 2 * dt * z * w, b = dt * dt * w * w, dd = 1 / (a + b);
  const x = (a * s.x + dt * s.v + b * hedef) * dd;
  s.v = (s.v + dt * w * w * (hedef - s.x)) * dd; s.x = x;
}
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _v4 = new THREE.Vector3();
const _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q3 = new THREE.Quaternion();
const _m1 = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _m3 = new THREE.Matrix4();
const YUKARI = new THREE.Vector3(0, 1, 0);

// ───────────────────────── malzeme yaması: parlama + çözülme ─────────────────────────
// Her birimin malzemeleri BİR KEZ klonlanır (his.hazirla). Program önbellek anahtarı sabit olduğu için
// bütün birimler aynı gölgelendirici programını paylaşır: derleme savaş kurulumunda bir kez olur.
const YAMA_ANAHTAR = 'kutHis3';
function malzemeYamala(m, u) {
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vKutP;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvKutP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vKutP; uniform float uKutFlas; uniform vec3 uKutFlasRenk; uniform float uKutKenar; uniform float uKutCoz; uniform vec3 uKutCozRenk; uniform vec2 uKutBoy; uniform float uKutBoya; uniform vec3 uKutBoyaRenk;
float kutH(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float kutG(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(kutH(i), kutH(i + vec3(1,0,0)), f.x), mix(kutH(i + vec3(0,1,0)), kutH(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(kutH(i + vec3(0,0,1)), kutH(i + vec3(1,0,1)), f.x), mix(kutH(i + vec3(0,1,1)), kutH(i + vec3(1,1,1)), f.x), f.y), f.z); }`)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
float kutN = 2.0;
if (uKutCoz > 0.0) {
  float kutY = clamp((vKutP.y - uKutBoy.x) / max(0.001, uKutBoy.y), 0.0, 1.0);
  kutN = (kutG(vKutP * 9.0) * 0.65 + kutG(vKutP * 23.0) * 0.35) * 0.62 + (1.0 - kutY) * 0.38;
  if (kutN < uKutCoz * 1.08) discard;
}`)
      // süreli gövde boyası (zehir yeşili, buz mavisi, lanet moru): ışığa eklenen parıltı turuncu gövdeyi sarıya çeviriyordu; artık albedo
      // parlaklığı korunarak boyanın rengine çekilir (turuncu kurbağa gerçekten yeşillenir)
      .replace('#include <color_fragment>', `#include <color_fragment>
if (uKutBoya > 0.0) { float kutL = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114)); diffuseColor.rgb = mix(diffuseColor.rgb, uKutBoyaRenk * (0.22 + 1.55 * kutL), uKutBoya); }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
if (uKutFlas > 0.0) { float kutR = 1.0 - abs(dot(normalize(normal), normalize(vViewPosition))); totalEmissiveRadiance += uKutFlasRenk * uKutFlas * mix(0.45 + 0.9 * kutR * kutR, 0.08 + 1.1 * kutR * kutR, uKutKenar); }
if (uKutCoz > 0.0) { float kutK = 1.0 - smoothstep(0.0, 0.075, kutN - uKutCoz * 1.08); totalEmissiveRadiance += uKutCozRenk * kutK * 4.0; }`);
  };
  m.customProgramCacheKey = () => YAMA_ANAHTAR;
  m.needsUpdate = true;
}

// ───────────────────────── kül / kıvılcım havuzu ─────────────────────────
let kulDoku = null;
function yumusakDoku() {
  if (kulDoku) return kulDoku;
  const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d');
  const g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.65)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 32, 32); kulDoku = new THREE.CanvasTexture(c); return kulDoku;
}
function kulHavuzu(sahne, n) {
  const geo = new THREE.BufferGeometry();
  const poz = new Float32Array(n * 3), renk = new Float32Array(n * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(poz, 3)); geo.setAttribute('color', new THREE.BufferAttribute(renk, 3));
  const mat = new THREE.PointsMaterial({ size: 0.075, map: yumusakDoku(), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
  const nokta = new THREE.Points(geo, mat); nokta.frustumCulled = false; nokta.renderOrder = 5; sahne.add(nokta);
  const P = { nokta, n, poz, renk, hiz: new Float32Array(n * 3), yas: new Float32Array(n).fill(9), omur: new Float32Array(n).fill(1), r0: new Float32Array(n * 3), sira: 0, canli: 0 };
  return P;
}
function kulAt(P, x, y, z, r, g, b) {
  if (!P) return; const i = P.sira; P.sira = (P.sira + 1) % P.n;
  P.poz[i * 3] = x; P.poz[i * 3 + 1] = y; P.poz[i * 3 + 2] = z;
  P.hiz[i * 3] = (Math.random() - 0.5) * 0.5; P.hiz[i * 3 + 1] = 0.55 + Math.random() * 0.8; P.hiz[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
  P.yas[i] = 0; P.omur[i] = 0.7 + Math.random() * 0.7; P.r0[i * 3] = r; P.r0[i * 3 + 1] = g; P.r0[i * 3 + 2] = b;
}
function kulGuncelle(P, dt, t) {
  if (!P) return; let canli = 0;
  for (let i = 0; i < P.n; i++) {
    if (P.yas[i] >= P.omur[i]) { if (P.renk[i * 3] !== 0) { P.renk[i * 3] = P.renk[i * 3 + 1] = P.renk[i * 3 + 2] = 0; canli++; } continue; }
    P.yas[i] += dt; canli++;
    const e = P.yas[i] / P.omur[i], k = (1 - e) * (1 - e) * Math.min(1, P.yas[i] * 12);
    P.poz[i * 3] += (P.hiz[i * 3] + Math.sin(t * 3 + i) * 0.25) * dt; P.poz[i * 3 + 1] += P.hiz[i * 3 + 1] * dt; P.poz[i * 3 + 2] += (P.hiz[i * 3 + 2] + Math.cos(t * 2.6 + i) * 0.25) * dt;
    P.hiz[i * 3 + 1] *= 1 - dt * 0.6;
    // altın → turuncu → kızıl
    P.renk[i * 3] = P.r0[i * 3] * k; P.renk[i * 3 + 1] = P.r0[i * 3 + 1] * k * (1 - e * 0.6); P.renk[i * 3 + 2] = P.r0[i * 3 + 2] * k * (1 - e);
  }
  if (canli || P.canli) { P.nokta.geometry.attributes.position.needsUpdate = true; P.nokta.geometry.attributes.color.needsUpdate = true; }
  P.canli = canli;
}

// ═════════════════════════ HİS (game feel) ═════════════════════════
const YAKIN_KAT = 0.85;   // savaş içi yakınlaştırmalar geniş taban kadrajla orantılı hafifler (sahne3d KADRAJ_PAY)
const H = {
  kamera: null, sahne: null, kalite: 'yuksek', kul: null, dinleyici: {},
  donma: 0, donmaSoguma: 0,                   // hit-stop
  yavas: { kalan: 0, sure: 0, oran: 1 },       // yavaşlatma
  travma: 0, travmaSonum: 2.5, tekme: { x: 0, v: 0 }, tekmeYon: new THREE.Vector3(), tohum: Math.random() * 100, sarsT: 0,
  zoom: { t: 0, sure: 0, oran: 0, hedef: new THREE.Vector3(), aktif: false, soguma: 0 },
  kayit: { p: new THREE.Vector3(), q: new THREE.Quaternion(), fov: 0, var: false },
  birimler: new Set(), girisSon: 0, girisBekle: true, zaman: 0, sonuc: { dtGorsel: 0, olcek: 1, donuk: false },
};
function olayYay(ad, veri) { const f = H.dinleyici[ad]; if (f) f(veri); }
function bh(b) {   // birimin his durumu
  if (!b._his) {
    b._his = { geri: { x: 0, v: 0 }, ezil: { x: 0, v: 0 }, egil: { x: 0, v: 0 }, yon: new THREE.Vector3(0, 0, 1), flas: 0, flasSure: 0.13, flasRenk: new THREE.Color(1, 1, 1),
      atil: null, giris: null, olum: null, zafer: null, uni: null, bosta: false, donma: 0,
      yp: { renk: new THREE.Color(1, 1, 1), guc: 0, t: 0, sure: 0, tepe: 0 },     // yetenek hazırlık parlaması (element rengi)
      yb: { renk: new THREE.Color(1, 1, 1), guc: 0, t: 0, sure: 0 },             // süreli gövde boyası (zehir yeşili, buz mavisi, lanet moru…)
      sis: { oran: 0, t: 0, sure: 0 }, buz: 0 };                                 // gövde şişmesi (Boynuz Öfkesi) · buz donması (Buz Nefesi, sn)
  }
  H.birimler.add(b); return b._his;
}
/** dünya yönünü birimin kök (kok) yerel yatay yönüne çevirir (birim uzunlukta) */
function yerelYon(b, dunyaYon, cikti) {
  b.kok.getWorldQuaternion(_q1).invert(); cikti.copy(dunyaYon).applyQuaternion(_q1); cikti.y = 0;
  if (cikti.lengthSq() < 1e-8) cikti.set(0, 0, 1); return cikti.normalize();
}
function kokOlcek(b) { return b.kok.scale.x || 1; }

export const his = {
  /** Kurulum. kamera: THREE.PerspectiveCamera. ops: {kalite:'hafif'|'yuksek', sahne (kül parçacıkları için), girisBekle (giriş sürerken dtGorsel=0)} */
  kur(kamera, { kalite = 'yuksek', sahne = null, girisBekle = true } = {}) {
    H.kamera = kamera; H.kalite = kalite; H.girisBekle = girisBekle;
    if (sahne && !H.kul) { H.sahne = sahne; H.kul = kulHavuzu(sahne, kalite === 'hafif' ? 40 : 110); }
    H.zoom.hedef.set(0, 0, 0);
  },
  /** Olay dinle: 'toz' ({birim, konum: Vector3, guc}) — giriş yere çarpma, ölümde yere yığılma; 'donma' ({sure}) */
  dinle(ad, fn) { H.dinleyici[ad] = fn; },
  /** Yeni savaş: bütün birim durumlarını unut (savasKur başında çağır) */
  sifirla() {
    for (const b of H.birimler) { const s = b._his; if (s) { s.atil = s.giris = s.olum = s.zafer = null; s.geri.x = s.geri.v = s.ezil.x = s.ezil.v = s.egil.x = s.egil.v = 0; s.flas = 0; s.yb.guc = 0; s.sis.oran = 0; s.buz = 0; if (s.uni) { s.uni.uKutFlas.value = 0; s.uni.uKutCoz.value = 0; s.uni.uKutBoya.value = 0; } } }
    H.birimler.clear(); H.donma = H.donmaSoguma = 0; H.yavas.kalan = 0; H.travma = 0; H.tekme.x = H.tekme.v = 0; H.zoom.aktif = false; H.girisSon = 0; H.zaman = 0;
  },
  /** Birim malzemelerini yamalar (parlama + çözülme). birimKur sonunda bir kez çağır; çağrılmazsa ilk ihtiyaçta kendisi yapar. */
  hazirla(b) {
    const s = bh(b); if (s.uni) return s.uni;
    const u = { uKutFlas: { value: 0 }, uKutFlasRenk: { value: s.flasRenk }, uKutKenar: { value: 0 }, uKutCoz: { value: 0 }, uKutCozRenk: { value: new THREE.Color('#ff9a2e') }, uKutBoy: { value: new THREE.Vector2(0, 1.4) }, uKutBoya: { value: 0 }, uKutBoyaRenk: { value: s.yb.renk } };
    b.model.traverse((m) => {
      if (!m.isMesh || !m.material) return;
      const yap = (mat) => { if (!mat || !(mat.isMeshStandardMaterial || mat.isMeshPhongMaterial || mat.isMeshLambertMaterial)) return mat; const c = mat.clone(); malzemeYamala(c, u); return c; };
      m.material = Array.isArray(m.material) ? m.material.map(yap) : yap(m.material);
    });
    s.uni = u; return u;
  },

  /** Her karede BİR KEZ, olaylar işlenmeden önce. dtGercek: gerçek saniye. ops.hizKati: oyun hız düğmesi.
      Döner: {dtGorsel, olcek, donuk} — gorselT ve bütün animasyonlar dtGorsel × hizKati ile ilerlemeli. */
  guncelle(dtGercek, { hizKati = 1 } = {}) {
    dtGercek = Math.min(0.1, Math.max(0, dtGercek || 0));
    H.zaman += dtGercek;
    let olcek = 1;
    if (H.donma > 0) { H.donma -= dtGercek; olcek = 0; }
    else if (H.yavas.kalan > 0) {
      H.yavas.kalan -= dtGercek; const e = kirp(H.yavas.kalan / Math.max(1e-4, H.yavas.sure));
      olcek = e > 0.35 ? H.yavas.oran : karis(1, H.yavas.oran, yumusak(e / 0.35));
    }
    H.donmaSoguma = Math.max(0, H.donmaSoguma - dtGercek); H.zoom.soguma = Math.max(0, H.zoom.soguma - dtGercek);
    const girisSurer = H.girisSon > 0;
    if (girisSurer) H.girisSon = Math.max(0, H.girisSon - dtGercek * hizKati);
    const dtGorsel = dtGercek * olcek * (girisSurer && H.girisBekle ? 0 : 1);
    // kamera durumları gerçek zamanla akar (donmada da sarsıntı sürer)
    H.travma = Math.max(0, H.travma - H.travmaSonum * dtGercek); H.sarsT += dtGercek;
    yay(H.tekme, 0, 420, 22, dtGercek);
    if (H.zoom.aktif) { H.zoom.t += dtGercek; if (H.zoom.t >= H.zoom.sure) H.zoom.aktif = false; }
    // birimler: tepkiler görsel zamanla (hit-stop'ta donar), parlama ve giriş gerçek zamanla
    const dtB = dtGercek * olcek * hizKati, dtR = dtGercek * hizKati;
    for (const b of H.birimler) birimGuncelle(b, dtB, dtR);
    kulGuncelle(H.kul, dtR, H.zaman);
    const r = H.sonuc; r.dtGorsel = dtGorsel; r.olcek = olcek; r.donuk = H.donma > 0; return r;   // her karede aynı nesne (ayırma yok)
  },
  /** renderer.render'dan HEMEN ÖNCE: sarsıntı ve yakınlaştırmayı kameraya uygular (taban duruşu saklar) */
  kameraUygula() {
    const k = H.kamera; if (!k) return;
    const R = H.kayit; R.p.copy(k.position); R.q.copy(k.quaternion); R.fov = k.fov; R.var = true;
    // yakınlaştırma: kamerayı hedefe doğru kaydır, bakışı hafif hedefe çevir, fov daralt
    if (H.zoom.aktif) {
      const z = H.zoom, e = z.t / z.sure, zarf = e < 0.22 ? cikis3(e / 0.22) : e > 0.62 ? 1 - yumusak((e - 0.62) / 0.38) : 1;
      k.position.lerp(z.hedef, z.oran * zarf);
      _m1.lookAt(k.position, z.hedef, YUKARI); _q1.setFromRotationMatrix(_m1);
      k.quaternion.slerp(_q1, 0.3 * zarf);
      k.fov = R.fov * (1 - 0.06 * zarf); k.updateProjectionMatrix();
    }
    // sarsıntı: travma² ölçekli gürültü + yönlü tekme
    const sars = H.travma * H.travma, t = H.sarsT * 24;
    if (sars > 1e-4 || Math.abs(H.tekme.x) > 1e-4) {
      const g = 0.16 * sars;
      _v1.set(gurultu(t + H.tohum) * g, gurultu(t + H.tohum + 37) * g, 0).applyQuaternion(k.quaternion);
      _v1.addScaledVector(H.tekmeYon, H.tekme.x);
      k.position.add(_v1);
      _q1.setFromAxisAngle(_v2.set(0, 0, 1), gurultu(t * 0.8 + H.tohum + 71) * 0.022 * sars); k.quaternion.multiply(_q1);
    }
    k.updateMatrixWorld(true);
  },
  /** Karenin SONUNDA (2D kaplama çizildikten sonra): kamerayı taban duruşuna döndürür */
  kameraGeriAl() {
    const k = H.kamera, R = H.kayit; if (!k || !R.var) return;
    k.position.copy(R.p); k.quaternion.copy(R.q); if (k.fov !== R.fov) { k.fov = R.fov; k.updateProjectionMatrix(); } k.updateMatrixWorld(true); R.var = false;
  },
  /** Kamera sarsıntısı. guc 0..1 (0,15 hafif vuruş, 0,4 ağır, 0,8 Kut/ölüm), sure sn. yon: dünya Vector3 (vuruş yönü) → ilk itme o yöne */
  sarsinti(guc = 0.3, sure = 0.35, yon = null) {
    H.travma = Math.min(1, H.travma + guc); H.travmaSonum = Math.max(H.travma / Math.max(0.05, sure), 0.8);
    if (yon && H.kamera) { H.tekmeYon.copy(yon).setY(0).normalize(); H.tekme.v += 1.6 * guc; }
  },
  /** Hafif yakınlaştırma (Kut, son ölüm). hedefPos: dünya Vector3. ops.oran: yaklaşma oranı (0,12 varsayılan) */
  yakinlastir(hedefPos, sure = 0.9, { oran = 0.12 } = {}) {
    const z = H.zoom; if (z.aktif && z.oran > oran * YAKIN_KAT && z.t < z.sure * 0.6) return;
    z.hedef.copy(hedefPos); z.sure = Math.max(0.2, sure); z.t = 0; z.oran = oran * YAKIN_KAT; z.aktif = true; z.soguma = sure + 1.2;
  },
  /** Hit-stop: görüntüyü sure sn dondurur (40–90 ms önerilir) */
  durdur(sure = 0.06) { if (H.donmaSoguma > 0) return; H.donma = Math.max(H.donma, Math.min(0.12, sure)); H.donmaSoguma = sure + 0.18; olayYay('donma', { sure }); },
  /** Yavaşlatma (Kut: 0,25 sn %30 hız) */
  yavaslat(sure = 0.25, oran = 0.3) { H.yavas.kalan = sure; H.yavas.sure = sure; H.yavas.oran = oran; },
  /** Kut kısa yolu: yavaşlatma + yakınlaştırma + hafif sarsıntı + altın parlama */
  kut(b) { his.yavaslat(0.25, 0.3); if (b) { b.kok.getWorldPosition(_v3); _v3.y += 0.6; his.yakinlastir(_v3, 1.0, { oran: 0.1 }); const s = bh(b); his.hazirla(b); s.flasRenk.set('#ffd27a'); s.flas = 1.2; s.flasSure = 0.13; s.uni.uKutKenar.value = 0; } his.sarsinti(0.22, 0.3); },

  /** Darbe tepkisi. yon: dünya Vector3 (saldırgandan hedefe); guc 0..1 (his.hasarGucu ile). Geri savrulma + sıkış-uz + beyaz parlama;
      guc ≥ 0,45'te hit-stop, ≥ 0,6'da kamera sarsıntısı. */
  darbe(b, yon, guc = 0.4, { k = null, kuresel = false } = {}) {
    if (!b) return; const s = bh(b); his.hazirla(b); guc = kirp(guc, 0, 1.3);
    if (s.olum) return;
    if (yon) yerelYon(b, yon, s.yon);
    const o = 1 / kokOlcek(b);
    // küçük ve sakin (REFERANS_ANIMASYON 2.5): vurandan uzağa 2–5° yatma, %2–5 sıkış (ayak tabanı pivotlu), sıcak-beyaz KENAR parlaması.
    // Sık vuruşta birikmez: yaylara verilen hız, o anki sapmaya göre azalır (üst sınır); iki ayaklıda üst gövde tepkisi klipte (sahne3d).
    const az = (x, sinir) => Math.max(0, 1 - Math.abs(x) / sinir);
    const iki = b.isk ? 0.45 : 1;                                   // iki ayaklı (UAL iskeletli): üst gövde esnemesi klipte, gövde kayması/yatması az
    s.geri.v += (0.7 + 1.0 * guc) * o * iki * az(s.geri.x, 0.06 * o);   // yerel birim/sn itme (en çok ~5 cm; ayaklar neredeyse yerinde)
    s.ezil.v -= (0.6 + 0.8 * guc) * az(s.ezil.x, 0.06);             // sıkış (≤ %5)
    s.egil.v += (1.6 + 2.4 * guc) * (0.4 + 0.6 * iki) * az(s.egil.x, 0.2);   // tepesi vurandan uzağa savrulur
    s.flasRenk.set(1, 0.92, 0.8); s.flas = Math.max(s.flas, 0.42 + 0.2 * guc); s.flasSure = 0.2; s.uni.uKutKenar.value = 1;
    // yerel hit-stop: yalnız vuran ve vurulan donar (sahnenin geri kalanı akar); küresel durdurma yalnız öldüren/kritik vuruşta
    const fr = 0.05 + 0.04 * kirp((guc - 0.3) / 0.7);
    his.donma(b, fr); if (k && k !== b) his.donma(k, fr * 0.9);
    if (kuresel) his.durdur(0.06 + 0.04 * kirp(guc - 0.6));
    if (guc >= 0.65) his.sarsinti(0.1 + 0.22 * guc, 0.26, yon);
  },
  /** Yetenek hazırlık parlaması: gövde element renginde ışır, tepe sn'de en parlak (patlama anı), sure sonunda söner.
      Vuruş parlaması (beyaz) ve Kut parlaması öncelikli; aynı malzeme yaması (uKutFlas) kullanılır, yeni malzeme yok. */
  parla(b, renk, guc = 0.4, sure = 0.6, tepe = 0.3) { if (!b) return; const s = bh(b); his.hazirla(b); const y = s.yp; y.renk.set(renk); y.guc = guc; y.t = 0; y.sure = Math.max(0.05, sure); y.tepe = kirp(tepe, 0.01, y.sure); },
  /** Birim başına hit-stop: birimin tepkileri ve (sahne3d'de) animasyonu sure sn donar; parlama ve sarsıntı gerçek zamanda sürer */
  donma(b, sure = 0.06) { if (!b) return; const s = bh(b); s.donma = Math.max(s.donma || 0, Math.min(0.12, sure)); },
  /** birim şu an donuk mu (sahne3d karışıcı/kodlu hareket dt'sini 0'lar) */
  donuk(b) { return !!(b && b._his && (b._his.donma > 0 || b._his.buz > 0)); },
  /** Süreli gövde boyası (yetenek etkisi): 0,12 sn'de açılır, hafif nabızla tutulur, son 0,4 sn'de söner. Vuruş parlaması öncelikli,
      hazırlık parlamasıyla güçlü olan görünür (aynı malzeme yaması; yeni malzeme yok). */
  /** süreli gövde boyası. o.kenar: albedo boyanmaz, yalnız nabız atan kenar ışıması (kızıl koçta kızıl boya seçilmez: Boynuz Öfkesi) */
  boya(b, renk, guc = 0.3, sure = 2, o = null) { if (!b) return; const s = bh(b); his.hazirla(b); const y = s.yb; y.renk.set(renk); y.guc = guc; y.t = 0; y.sure = Math.max(0.2, sure); y.kenar = !!(o && o.kenar); },
  /** Gövde şişmesi: oran (0,08 = %8), sure sn (0,15 sn'de şişer, son 0,3 sn'de iner; ayak tabanı merkezli) */
  sis(b, oran = 0.08, sure = 1) { if (!b) return; const s = bh(b); s.sis.oran = oran; s.sis.t = 0; s.sis.sure = Math.max(0.3, sure); },
  /** Buz donması: birimin animasyonu sure sn durur (hit-stop'tan ayrı, uzun; ölünce çözülür) */
  dondur(b, sure = 1) { if (!b) return; const s = bh(b); s.buz = Math.max(s.buz || 0, sure); },
  /** hasar sayısını darbe gücüne çevirir: taban 0,3 (her vuruş hissedilir), 220 hasarda tam güç; yetenekte daha güçlü */
  hasarGucu(n, { buyuk = false } = {}) { return (0.3 + 0.7 * kirp((n - 20) / 200)) * (buyuk ? 1.25 : 1); },

  /** Yakın dövüş atılması: darbe karesine kadar hedefe doğru mesafe (hücre) kadar gövde ofseti, sonra geri döner.
      sure: saldırının başından darbeye kadar geçen sn (klip darbe anı / hız). Motor konumuna dokunmaz. */
  atil(b, hedefPos, sure = 0.3, { mesafe = 0.3, donus = 0.28, temas = 0.58, tut = 0.06, egil = 0.2 } = {}) {
    if (!b || !hedefPos) return; const s = bh(b); if (s.olum) return;
    b.kok.getWorldPosition(_v1); _v2.copy(hedefPos).sub(_v1);
    const uz = Math.hypot(_v2.x, _v2.z);
    const d = Math.min(mesafe, Math.max(0, uz - temas * 0.95)) / kokOlcek(b);   // hedefin içine girme: iki gövde yarıçapı kadar dur
    s.atil = { t: 0, sure: Math.max(0.08, sure), donus, tut: Math.max(0.02, tut), egil, d, yon: yerelYon(b, _v2, new THREE.Vector3()), vurdu: false };
  },
  /** Savaş başı girişi: gecikme sn sonra gökten düşer, yere çarpar ('toz' olayı + küçük sarsıntı). */
  giris(b, gecikme = 0, { yukseklik = 6.5 } = {}) {
    if (!b) return; const s = bh(b);
    const g = 34, yuk = yukseklik / kokOlcek(b), sure = Math.sqrt(2 * yukseklik / g);
    s.giris = { t: -gecikme, g: g / kokOlcek(b), yuk, sure, carpti: false, son: 0 };
    s.ezil.x = 0; s.ezil.v = 0; b.govde.visible = gecikme <= 0;
    H.girisSon = Math.max(H.girisSon, gecikme + sure + 0.3);
  },
  /** Ölüm: yere yığılma (iki ayaklıda Death01, dört ayaklıda dortAyakliGuncelle({olum})) zamanlamasıyla toz, sonra
      kenarı kor gibi parlayan gölgelendirici çözülmesi + yükselen küller. ops.yakinlastir: son ölüm için true. */
  olum(b, { tur, yakinlastir = false } = {}) {
    if (!b) return; const s = bh(b); his.hazirla(b); s.buz = 0; s.yb.guc = 0;
    tur = tur || (b.gor && b.gor.tur) || 'iki';
    const z = tur === 'iki' ? { carp: 1.33, coz: 1.75, sure: 0.75 } : tur === 'yilan' ? { carp: 0.5, coz: 1.05, sure: 0.7 } : { carp: 0.6, coz: 1.1, sure: 0.7 };
    s.olum = { t: 0, ...z, toz: false, bitti: false };
    s.atil = null; s.zafer = null;
    b.kok.getWorldPosition(_v1); s.uni.uKutBoy.value.set(_v1.y, 1.35 * kokOlcek(b));
    if (yakinlastir) { _v1.y += 0.5; his.yakinlastir(_v1, 1.4, { oran: 0.1 }); }
  },
  /** Diriliş (Anka): çözülmeyi geri al, görünür yap */
  dirilis(b) { if (!b) return; const s = bh(b); s.olum = null; if (s.uni) s.uni.uKutCoz.value = 0; b.govde.visible = true; s.ezil.v -= 3; s.flasRenk.set('#ffb070'); s.flas = 1.2; s.flasSure = 0.13; if (s.uni) s.uni.uKutKenar.value = 0; },
  /** Zafer: yaşayan birim kısa sevinç (iki zıplama; iki ayaklıda tek seferlik sevinç klibiyle), sonra duruş */
  zafer(b) { if (!b) return; const s = bh(b); if (s.olum) return; s.zafer = { t: -((b.uid || 0) * 0.137 % 0.5) }; },
  /** hata ayıklama */
  _durum: H,
};

function birimGuncelle(b, dt, dtR) {
  const s = b._his; if (!s) return;
  if (s.donma > 0) { s.donma -= dtR; dt = 0; }   // yerel hit-stop: yaylar ve atılma donar
  if (s.buz > 0) { s.buz -= dtR; dt = 0; }       // buz donması (uzun): tepkiler de durur
  const o = 1 / kokOlcek(b);
  // yaylar
  yay(s.geri, 0, 210, 19, dt); yay(s.ezil, 0, 330, 15, dt); yay(s.egil, 0, 230, 17, dt);
  let ox = s.yon.x * s.geri.x, oz = s.yon.z * s.geri.x, oy = 0, ezil = s.ezil.x, egil = s.egil.x * 0.5;
  let ileriEgil = 0;
  // atılma
  if (s.atil) {
    const a = s.atil; a.t += dt; const T = a.sure;
    let x;
    if (a.t < T * 0.32) x = -0.13 * a.d * yumusak(a.t / (T * 0.32));                     // hazırlık: hafif geri
    else if (a.t < T) { const u = (a.t - T * 0.32) / (T * 0.68); x = karis(-0.13 * a.d, a.d, u * u * (1.6 - 0.6 * u)); } // hızlanarak ileri
    else if (a.t < T + a.tut) x = a.d;                                                        // temas (yetenekte tutma: emme, kavrama)
    else x = a.d * (1 - cikis3((a.t - T - a.tut) / a.donus));
    if (!a.vurdu && a.t >= T) { a.vurdu = true; s.ezil.v -= 2.0; }
    ox += a.yon.x * x; oz += a.yon.z * x;
    ileriEgil = a.egil * x / Math.max(1e-4, a.d);
    if (a.t >= T + a.tut + a.donus) s.atil = null;
    s._ay = a.yon;
  }
  // giriş: düşme → çarpma
  if (s.giris) {
    const g = s.giris; g.t += dtR;
    if (g.t < 0) { b.govde.visible = false; }
    else {
      b.govde.visible = true;
      if (!g.carpti) {
        oy = Math.max(0, g.yuk - 0.5 * g.g * g.t * g.t);
        ezil = 0.18 * kirp(g.t / g.sure);                   // düşerken uzar
        if (oy <= 0) { g.carpti = true; s.ezil.x = -0.38; s.ezil.v = 0; b.kok.getWorldPosition(_v1); olayYay('toz', { birim: b, konum: _v1.clone(), guc: 1 }); his.sarsinti(0.1, 0.2); ezil = s.ezil.x; }
      } else { g.son += dtR; if (g.son > 0.8) s.giris = null; }
    }
  }
  // ölüm: toz + çözülme + kül
  if (s.olum && !s.olum.bitti) {
    const m = s.olum; m.t += dt;
    if (!m.toz && m.t >= m.carp) { m.toz = true; b.kok.getWorldPosition(_v1); olayYay('toz', { birim: b, konum: _v1.clone(), guc: 0.7 }); s.ezil.v -= 1.5; his.sarsinti(0.06, 0.18); }
    if (m.t >= m.coz) {
      const e = kirp((m.t - m.coz) / m.sure); s.uni.uKutCoz.value = Math.max(0.001, e);
      if (H.kul && e < 0.95) {
        const adet = (H.kalite === 'hafif' ? 22 : 60) * dt * (1 - e * 0.5); let n = Math.floor(adet) + (Math.random() < adet % 1 ? 1 : 0);
        b.kok.getWorldPosition(_v1); const boy = s.uni.uKutBoy.value.y;
        while (n-- > 0) kulAt(H.kul, _v1.x + (Math.random() - 0.5) * 0.6, _v1.y + 0.05 + Math.random() * boy * 0.45 * (1 - e * 0.6), _v1.z + (Math.random() - 0.5) * 0.6, 1.0, 0.78, 0.35);
      }
      if (e >= 1) { m.bitti = true; b.govde.visible = false; }
    }
  }
  // zafer zıplaması
  if (s.zafer) {
    // kısa sevinç: iki zıplama (ikincisi alçak), sonra duruş tutulur (REFERANS_ANIMASYON: zıplama döngüsü yok; tek hareket + tutma)
    const z = s.zafer; z.t += dt; const P = 0.78, f = ((z.t % P) + P) % P / P, n = Math.floor(z.t / P), yuk = n === 0 ? 0.24 : 0.14;
    if (z.t > 0 && n < 2) {
      if (f < 0.18) ezil += -0.07 * Math.sin(Math.PI * f / 0.18);                       // çömel
      else if (f < 0.72) { const u = (f - 0.18) / 0.54; oy += 4 * yuk * o * u * (1 - u); ezil += 0.05 * Math.sin(Math.PI * u); }  // havada uzar
      else ezil += -0.06 * Math.sin(Math.PI * (f - 0.72) / 0.28);                      // iniş
    } else if (n >= 2) s.zafer = null;
  }
  // parlama (gerçek zaman)
  if (s.flas > 0) { s.flas = Math.max(0, s.flas - dtR / s.flasSure); }
  const yp = s.yp; let ypG = 0;
  if (yp.guc > 0) { yp.t += dt; const e = yp.t < yp.tepe ? yp.t / yp.tepe : 1 - (yp.t - yp.tepe) / Math.max(1e-3, yp.sure - yp.tepe); ypG = yp.guc * yumusak(e); if (yp.t >= yp.sure) yp.guc = 0; }
  const yb = s.yb; let ybG = 0;
  if (yb.guc > 0) { yb.t += dtR; const e = Math.min(1, yb.t / 0.12) * (yb.t > yb.sure - 0.4 ? Math.max(0, (yb.sure - yb.t) / 0.4) : 1); ybG = yb.guc * e * (0.85 + 0.15 * Math.sin(yb.t * 7)); if (yb.t >= yb.sure) yb.guc = 0; }
  if (s.uni) {
    // boya: albedo boyanın rengine çekilir (gücün ~2,8 katı, en çok 0,82: turuncu kurbağa sarımsı değil gerçekten yeşil) + hafif kenar ışıması; kenar kipinde yalnız nabızlı kenar ışıması
    const kenarK = yb.kenar && ybG > 0.002;
    s.uni.uKutBoya.value = ybG > 0.002 && !kenarK ? Math.min(0.82, ybG * 2.8) : 0;
    if (s.flas > 0) s.uni.uKutFlas.value = Math.min(1.2, s.flas); else if (ypG > 0.002 && ypG >= ybG) { s.flasRenk.copy(yp.renk); s.uni.uKutFlas.value = ypG; s.uni.uKutKenar.value = 0; }
    else if (kenarK) { s.flasRenk.copy(yb.renk); s.uni.uKutFlas.value = ybG * (1.6 + 1.4 * Math.sin(yb.t * 9) ** 2); s.uni.uKutKenar.value = 1; }
    else if (ybG > 0.002) { s.flasRenk.copy(yb.renk); s.uni.uKutFlas.value = ybG * 0.55; s.uni.uKutKenar.value = 0.7; } else s.uni.uKutFlas.value = 0; }
  // gövdeye yaz (ayak tabanı merkezli ölçek: model tabanı govde başlangıcında)
  const gv = b.govde;
  gv.position.set(ox, oy, oz);
  ezil = kirp(ezil, -0.45, 0.4);
  const sy = 1 + ezil, sxz = 1 / Math.sqrt(Math.max(0.3, sy));
  gv.scale.set(sxz, sy, sxz);
  const ss = s.sis; if (ss.oran) { ss.t += dtR; const e = Math.min(1, ss.t / 0.15) * (ss.t > ss.sure - 0.3 ? Math.max(0, (ss.sure - ss.t) / 0.3) : 1); gv.scale.multiplyScalar(1 + ss.oran * e); if (ss.t >= ss.sure) ss.oran = 0; }
  // eğilme: vuruşta tepe vuruş yönüne, atılmada ileri
  const ex = s.yon, ay = s._ay || ex;
  const ax1 = ex.z, az1 = -ex.x;                       // YUKARI × yon (yatay eksen)
  const ax2 = ay.z, az2 = -ay.x;
  _v1.set(ax1 * egil + ax2 * ileriEgil, 0, az1 * egil + az2 * ileriEgil);
  const aci = _v1.length();
  if (aci > 1e-5) gv.quaternion.setFromAxisAngle(_v1.divideScalar(aci), aci); else gv.quaternion.identity();
}

// Vurulma zarfı (dört ayaklı, yılan): 0,05 sn'de yumuşak yükselir, ~0,35 sn'de söner; titreşim yok. Sık vuruşta birikmez:
// yeni tepki o anki değerden başlar, tepe değeri = max(yeni, süren + 0,4·yeni), en çok 1.
function vurTepki(v, vurul) {
  const g = typeof vurul === 'number' ? kirp(vurul, 0.2, 1.2) : 0.7, c = v ? vurZarf(v) : 0;
  return { t: 0, c0: c, g: Math.min(1, Math.max(g, c + 0.4 * g)) };
}
function vurZarf(v) { const Y = 0.05; return v.t < Y ? karis(v.c0 || 0, v.g, Math.sin(0.5 * Math.PI * v.t / Y)) : v.g * Math.exp(-(v.t - Y) * 9); }

// ═════════════════════════ DÖRT AYAKLI ═════════════════════════
function kemikHaritasi(model, kemikler) {
  if (kemikler) return kemikler;
  const K = {}; model.traverse((o) => { if (o.isBone) K[o.name.replace('mixamorig', '').replace(':', '')] = o; }); return K;
}
/** Kemiklerin dinlenme verisi: Z (model.parent) çerçevesinde konum, yerel dönüş, Z'ye göre dönüş */
function dinlenme(model, K) {
  const Z = model.parent || model; Z.updateWorldMatrix(true, false); model.updateMatrixWorld(true);
  const Zinv = _m1.copy(Z.matrixWorld).invert(), Zq = Z.getWorldQuaternion(new THREE.Quaternion()).invert();
  const veri = new Map(), adlar = {};
  for (const ad in K) {
    const k = K[ad]; adlar[k.uuid] = ad;
    veri.set(k, { ad, q: k.quaternion.clone(), p: k.position.clone(), P: k.getWorldPosition(new THREE.Vector3()).applyMatrix4(Zinv), rel: Zq.clone().multiply(k.getWorldQuaternion(new THREE.Quaternion())), cocuk: [] });
  }
  for (const [k, v] of veri) { for (const c of k.children) if (veri.has(c)) v.cocuk.push(c); v.ebeveyn = veri.has(k.parent) ? k.parent : null; }
  return { Z, veri };
}
/** Ön yön (Z çerçevesinde yatay birim vektör): baş kemiklerinin ortalaması − bütün kemiklerin ağırlık merkezi */
function onYonBul(veri) {
  const C = new THREE.Vector3(), B = new THREE.Vector3(); let n = 0, nb = 0;
  for (const [, v] of veri) { C.add(v.P); n++; if (/Head/i.test(v.ad)) { B.add(v.P); nb++; } }
  if (!n || !nb) return new THREE.Vector3(0, 0, 1);
  C.divideScalar(n); B.divideScalar(nb); const f = B.sub(C); f.y = 0;
  return f.lengthSq() < 1e-8 ? new THREE.Vector3(0, 0, 1) : f.normalize();
}
/** sahne3d birimKur için: model.rotation.y'ye verilecek açı (baş +Z'ye bakar). Model govde'ye eklenmiş, dönüşü sıfırken çağır. */
export function onYonAci(model, kemikler) {
  const K = kemikHaritasi(model, kemikler); const { veri } = dinlenme(model, K); const f = onYonBul(veri);
  return -Math.atan2(f.x, f.z) + model.rotation.y;
}
function ataMi(a, b) { for (let o = b.parent; o; o = o.parent) if (o === a) return true; return false; }
function yol(kok, uc) { const y = []; for (let o = uc; o; o = o.parent) { y.unshift(o); if (o === kok) break; } return y; }
function eksenler(v, f, u, n) {   // Z ekseninin kemik dinlenme yerel uzayındaki karşılıkları
  const ri = v.rel.clone().invert();
  v.ef = f.clone().applyQuaternion(ri).normalize(); v.eu = u.clone().applyQuaternion(ri).normalize(); v.en = n.clone().applyQuaternion(ri).normalize();
}
const STIL = { kurt: { saldir: 'isir', yetenek: 'ulu' }, koc: { saldir: 'tosla', yetenek: 'ofke' }, bulutat: { saldir: 'tosla', yetenek: 'sahlan' },
  kaplumbaga: { saldir: 'isir', yetenek: 'uzan' }, semender: { saldir: 'isir', yetenek: 'don' },
  yarasa: { saldir: 'isir', yetenek: 'don' }, kirpi: { saldir: 'tosla', yetenek: 'don' }, tasKabuk: { saldir: 'isir', yetenek: 'uzan' }, yildizYiyen: { saldir: 'isir', yetenek: 'ulu' } };

/** Dört ayaklıyı kur. model: govde içine yerleşmiş, ölçeklenmiş ve döndürülmüş model (birimKur'un SONUNDA çağır);
    kemikler: ad → Bone (sahne3d b.kemik). ops.tur: 'kurt'|'koc'|... (saldırı/yetenek stili). Döner: durum (dortAyakliGuncelle'ye ver) */
export function dortAyakliKur(model, kemikler, { tur = '', faz = Math.random() } = {}) {
  const K = kemikHaritasi(model, kemikler);
  const { Z, veri } = dinlenme(model, K);
  const f = onYonBul(veri), u = new THREE.Vector3(0, 1, 0), n = new THREE.Vector3().crossVectors(f, u).normalize(); // n: +açı burnu kaldırır
  let minY = Infinity, maxY = -Infinity; const C = new THREE.Vector3();
  for (const [, v] of veri) { minY = Math.min(minY, v.P.y); maxY = Math.max(maxY, v.P.y); C.add(v.P); }
  C.divideScalar(Math.max(1, veri.size)); const Hy = Math.max(1e-3, maxY - minY);
  // 1) bacaklar: yere yakın yaprak kemikten yukarı, dallanmaya dek
  const bacaklar = [], bacakKemik = new Set();
  const alcak = (k) => veri.get(k).P.y - minY <= 0.3 * Hy && veri.get(k).cocuk.every(alcak);   // alt ağacı tümüyle yerde (parmaklar)
  const adaylar = new Map();   // zincir tepesi → en alçak uç
  for (const [k, v] of veri) {
    if (v.cocuk.length || v.P.y - minY > 0.3 * Hy) continue;
    const zincir = [k]; let c = v.ebeveyn;
    // yukarı yürü: tek çocuklu ya da öbür dalları da yerde kalan (ayak bileği → parmak dallanması) kemiklerden geç
    while (c && zincir.length < 8 && (veri.get(c).cocuk.length === 1 || veri.get(c).cocuk.every((x) => zincir.includes(x) || alcak(x)))) { zincir.unshift(c); c = veri.get(c).ebeveyn; }
    const onceki = adaylar.get(zincir[0]);
    if (!onceki || v.P.y < veri.get(onceki[onceki.length - 1]).P.y - 1e-4 || (Math.abs(v.P.y - veri.get(onceki[onceki.length - 1]).P.y) < 1e-4 && zincir.length > onceki.length)) adaylar.set(zincir[0], zincir);
  }
  for (const [, zincir] of adaylar) {
    const k = zincir[zincir.length - 1];
    // kalça: zincirde aşağı inen ilk parça
    let i0 = 0;
    for (; i0 < zincir.length - 1; i0++) { const a = veri.get(zincir[i0]).P, b = veri.get(zincir[i0 + 1]).P; const d = _v1.subVectors(b, a); const L = d.length(); if (L > 1e-4 && d.y < -0.35 * L) break; }
    const z = zincir.slice(Math.min(i0, zincir.length - 2)); if (z.length < 2) continue;
    // diz: toplam uzunluğun ~%45'ine en yakın ara kemik
    let top = 0; const kum = [0]; for (let i = 1; i < z.length; i++) { top += veri.get(z[i]).P.distanceTo(veri.get(z[i - 1]).P); kum.push(top); }
    let diz = null, enY = Infinity; for (let i = 1; i < z.length - 1; i++) { const d = Math.abs(kum[i] / top - 0.45); if (d < enY) { enY = d; diz = z[i]; } }
    const kalca = z[0], uc = z[z.length - 1];
    z.forEach((b) => bacakKemik.add(b));
    // sagital düzlemde boylar (erişim hesabı)
    const pH = veri.get(kalca).P, pT = veri.get(uc).P, pK = diz ? veri.get(diz).P : null;
    const sg = (a, b2) => Math.hypot(_v1.subVectors(b2, a).dot(f), _v1.y);
    const Ls = pK ? sg(pH, pK) + sg(pK, pT) : sg(pH, pT);
    bacaklar.push({ kalca, diz, uc, zincir: z, uzun: top, P0: pT.clone(), kalcaY: pH.y - pT.y, Ls, dx0: _v1.subVectors(pT, pH).dot(f) });
  }
  // ön/arka, sol/sağ, tırıs fazı (çapraz çiftler)
  if (bacaklar.length) {
    const ileri = bacaklar.map((b) => veri.get(b.kalca).P.dot(f)); const orta = (Math.min(...ileri) + Math.max(...ileri)) / 2;
    const lat = new THREE.Vector3().crossVectors(u, f);
    bacaklar.forEach((b, i) => { b.on = bacaklar.length === 1 ? true : ileri[i] >= orta; b.sol = veri.get(b.kalca).P.clone().sub(C).dot(lat) > 0; b.faz = (b.on === b.sol) ? 0 : 0.5; });
  }
  // 2) eksen zinciri: baş ucu ve kuyruk ucu
  const bacakAtasi = (k) => bacaklar.some((b) => ataMi(k, b.kalca));
  let basUc = null, kuyrukUc = null, bS = -Infinity, kS = -Infinity;
  for (const [k, v] of veri) {
    if (bacakKemik.has(k)) continue; const r = _v1.subVectors(v.P, C);
    const sb = r.dot(f) + 0.25 * (v.P.y - minY) + (/Head/.test(v.ad) ? 0.05 * Hy : 0); if (sb > bS) { bS = sb; basUc = k; }
    const sk = -r.dot(f) + 0.05 * (v.P.y - minY); if (sk > kS) { kS = sk; kuyrukUc = k; }
  }
  const kokKemik = [...veri.keys()].find((k) => !veri.get(k).ebeveyn) || null;
  const onKalca = bacaklar.filter((b) => b.on), arkaKalca = bacaklar.filter((b) => !b.on);
  const ort = (l) => { const p = new THREE.Vector3(); l.forEach((b) => p.add(veri.get(b.kalca).P)); return l.length ? p.divideScalar(l.length) : C.clone(); };
  const onP = ort(onKalca), arkaP = ort(arkaKalca.length ? arkaKalca : bacaklar);
  // boyun: baş yolunda, ön kalçaların önünde (veya hizasında) kalan kemikler; bacak atası olanlar düşük ağırlıkla
  const basYol = basUc ? yol(kokKemik, basUc) : [];
  let boyunK = basYol.filter((k) => k !== kokKemik && veri.get(k).P.dot(f) >= onP.dot(f) - 0.06 * Hy);
  if (!boyunK.length && basYol.length > 1) boyunK = basYol.slice(-2).filter((k) => k !== kokKemik);
  const boyun = boyunK.map((k) => ({ k, w: bacakAtasi(k) ? 0.3 : 1 }));
  // kuyruk: arka kalçaların gerisinde, bacak atası olmayanlar
  let kuyruk = [];
  if (kuyrukUc && veri.get(kuyrukUc).P.dot(f) < arkaP.dot(f) - 0.04 * Hy) kuyruk = yol(kokKemik, kuyrukUc).filter((k) => k !== kokKemik && !bacakAtasi(k) && !basYol.includes(k));
  const surungen = bacaklar.length < 4;
  // yürüyüş çömelmesi ve adım boyu: her bacağın ileri/geri erişiminden
  const comel = 0.1 * Hy; let yariAdim = Infinity, ortL = 0;
  for (const b of bacaklar) { ortL += b.uzun; const dy = Math.max(0, b.kalcaY - comel); yariAdim = Math.min(yariAdim, Math.sqrt(Math.max(0, (0.95 * b.Ls) ** 2 - dy * dy)) - Math.abs(b.dx0)); }
  ortL = bacaklar.length ? ortL / bacaklar.length : 0.3 * Hy;
  const adimMax = kirp(2 * yariAdim * 0.9, 0.14 * ortL, 0.8 * ortL);
  // eksen dönüşleri için yerel eksenler
  const kullan = new Set([...boyun.map((b) => b.k), ...kuyruk]); bacaklar.forEach((b) => { kullan.add(b.kalca); if (b.diz) kullan.add(b.diz); });
  for (const k of kullan) eksenler(veri.get(k), f, u, n);
  // gövde pivotları
  let yari = 0; for (const b of bacaklar) yari = Math.max(yari, Math.abs(_v1.subVectors(veri.get(b.kalca).P, C).dot(_v2.crossVectors(u, f))));
  const d = {
    model, Z, veri, f, u, n, lat: new THREE.Vector3().crossVectors(u, f), C, minY, Hy, bacaklar, boyun, kuyruk, surungen, kullan: [...kullan],
    yari: Math.max(yari * 1.15, 0.12 * Hy), comel, adimMax, onP, arkaP, stil: STIL[tur] || { saldir: 'isir', yetenek: 'tosla' },
    m0: { p: model.position.clone(), q: model.quaternion.clone(), s: model.scale.clone(), M: model.matrix.clone().compose(model.position, model.quaternion, model.scale) },
    adim: faz, v: 0, w: 0, t: faz * 10, kuyrukYay: { x: 0, v: 0 }, bobOnce: 0,
    // kuyruk yana salınımı: fazı gecikmeli yay zinciri (her kemik bir öncekini izler; REFERANS_ANIMASYON 2.3). Kalın kuyruk (sürüngen,
    // kaplumbağa) daha ağır: 2,0→1,2 Hz, ζ 0,55→0,40; ince (kurt, koç, bulut atı) 3,0→1,8 Hz, ζ 0,45→0,30
    kZin: kuyruk.map(() => ({ x: 0, v: 0 })), kKalin: surungen || /semender|kaplumbaga/.test(tur), yonOnce: null, yonHiz: 0, faz, bosW: 0, fidT: 4 + ozet(faz * 23.1) * 7, fid: null, fidSira: Math.floor(ozet(faz * 5.7) * 3),
    sal: null, yet: null, vur: null, olum: null, zafer: false, olumYon: ozet(faz * 91) > 0.5 ? 1 : -1, kanal: new Array(12).fill(0),
    basKemik: boyun.length ? boyun[boyun.length - 1].k : null, basOlcek: false, basS0: boyun.length ? boyun[boyun.length - 1].k.scale.x : 1,
  };
  return d;
}

// saldırı / yetenek anahtar kareleri: [t, ileri(H), yük(H), eğim(rad,+burun yukarı), boyun, baş, önAyakKopuk(0..1), eşele, başNabız]
//   eşele: yalnız sağ ön ayak; +1 ayak kalkıp öne, −1 yerde geriye sürtülür (toynakla yeri eşeleme). başNabız: baş kemiği ölçek nabzı
//   (çene kemiği olmayan Tripo modelinde ağız açılması yerine). Yetenek stillerinde patlama karesi = motorun etki anı (sahne3d yetOn).
const DA = {
  // hazırlık (geri çekil) → 0,12–0,22 tut → 0,04 sn ani atılma (darbe 0,26) → toparlan
  isir:  [[0, 0, 0, 0, 0, 0, 0], [0.12, -0.1, -0.045, 0.1, 0.36, 0.16, 0], [0.22, -0.11, -0.05, 0.11, 0.4, 0.18, 0], [0.26, 0.17, -0.015, -0.1, -0.36, -0.38, 0], [0.33, 0.14, -0.015, -0.08, -0.3, -0.32, 0], [0.6, 0, 0, 0, 0, 0, 0]],
  tosla: [[0, 0, 0, 0, 0, 0, 0], [0.12, -0.12, -0.055, 0.08, 0.24, -0.22, 0], [0.22, -0.13, -0.06, 0.09, 0.26, -0.24, 0], [0.26, 0.21, -0.02, -0.14, -0.42, -0.32, 0], [0.34, 0.17, -0.02, -0.11, -0.36, -0.27, 0], [0.64, 0, 0, 0, 0, 0, 0]],
  // Uluma (Kristal Kurt, yetOn 0,32): 0–0,22 nefes al (baş ve göğüs aşağı) → 0,32 patlama: arkaya yaslan, ön ayaklar gerilir, baş ~45° göğe,
  // baş nabzı (ağız) → 0,9'a dek titreyerek tut → 1,2 toparlan
  ulu:   [[0, 0, 0, 0, 0, 0, 0, 0, 0], [0.22, 0.02, -0.065, -0.1, -0.4, -0.22, 0, 0, 0], [0.32, -0.07, -0.02, 0.2, 0.8, 0.42, 0, 0, 0.12],
          [0.9, -0.07, -0.025, 0.23, 0.85, 0.46, 0, 0, 0.07], [1.2, 0, 0, 0, 0, 0, 0, 0, 0]],
  // Boynuz Öfkesi (Dağ Koçu, yetOn 0,36): baş aşağı, sağ ön toynakla iki kez eşele (0,05–0,2) → kısa şahlanma, baş yukarı savrulur (0,29)
  // → 0,36 yere vurma (yerVur, motorun etki anı) → 0,68 toparlan
  ofke:  [[0, 0, 0, 0, 0, 0, 0, 0, 0], [0.05, -0.02, -0.025, -0.1, -0.32, -0.28, 0, 1, 0], [0.1, -0.03, -0.025, -0.1, -0.32, -0.28, 0, -0.7, 0],
          [0.15, -0.03, -0.025, -0.1, -0.32, -0.28, 0, 1, 0], [0.2, -0.03, -0.025, -0.1, -0.32, -0.28, 0, -0.7, 0],
          [0.29, -0.04, 0, 0.45, -0.12, 0.38, 0.85, 0, 0], [0.36, 0.09, -0.04, -0.09, -0.34, -0.32, 0, 0, 0], [0.44, 0.08, -0.035, -0.07, -0.3, -0.27, 0, 0, 0],
          [0.68, 0, 0, 0, 0, 0, 0, 0, 0]],
  sahlan:[[0, 0, 0, 0, 0, 0, 0], [0.12, -0.03, 0, 0.3, -0.05, 0.1, 1], [0.27, -0.05, 0, 0.62, -0.25, 0.25, 1], [0.34, -0.04, 0, 0.6, -0.2, 0.2, 1], [0.4, 0.07, -0.03, -0.07, -0.3, -0.25, 0], [0.72, 0, 0, 0, 0, 0, 0]],
  uzan:  [[0, 0, 0, 0, 0, 0, 0], [0.2, 0.05, -0.02, -0.05, -0.45, 0.3, 0], [0.6, 0.06, -0.02, -0.05, -0.5, 0.34, 0], [0.85, 0, 0, 0, 0, 0, 0]],
  don:   [[0, 0, 0, 0, 0, 0, 0], [0.1, 0, 0.03, 0.05, 0.1, 0, 0], [0.5, 0, 0.03, 0.05, 0.1, 0, 0], [0.62, 0, 0, 0, 0, 0, 0]],
  // ── grup 2 imza stilleri: kanallar [t, ileri, yük, eğim, boyun, baş, önKopuk, eşele, başNabız, uz, şiş, dönüş, kuyruk]
  //   uz: gövde ileri yönde uzar / dikeyde basılır (+oran) · şiş: gövde (kabuk) bütünüyle şişer (+oran, zemin pivotu)
  //   dönüş: gövdenin dikey eksende dönüşü (rad) · kuyruk: kuyruğun yana kıvrılması (rad). Patlama karesi DA_AN'da.
  // Buz Nefesi (Kaplumbağa, patlama 0,3 = koninin çıkışı): baş kabuğa çekilir (boyun kıvrılır, baş küçülür), kabuk 1,06 şişer →
  // baş ileri fırlar, ağız açılır (baş nabzı) → 0,45 sn nefes (titreyerek tut) → toparlan
  nefes: [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0.2, -0.04, -0.01, 0.04, 0.55, -0.45, 0, 0, -0.16, 0, 0.06, 0, 0], [0.26, -0.045, -0.012, 0.05, 0.6, -0.5, 0, 0, -0.18, 0, 0.065, 0, 0],
          [0.32, 0.07, -0.01, -0.05, -0.6, 0.38, 0, 0, 0.16, 0, 0.02, 0, 0], [0.72, 0.06, -0.01, -0.04, -0.52, 0.34, 0, 0, 0.1, 0, 0.01, 0, 0], [1.02, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
  // Kor Halkası (Semender, patlama 0,25 = halkanın çıkışı): yere yapış, kuyruk kıvrılır, ters yöne kurulma → kuyruk önde, hızlanan
  // dönüş (son çeyreği patlamada) → küçük taşma, ağzı yukarı açıp kor püskürtür → toparlan
  ocak:  [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0.12, -0.02, -0.04, 0, -0.15, -0.05, 0, 0, 0, 0, 0, -0.45, 0.55], [0.14, -0.02, -0.04, 0, -0.15, -0.05, 0, 0, 0, 0, 0, -0.45, 0.55],
          [0.21, 0, -0.03, 0, -0.1, 0, 0, 0, 0, 0, 0, 0.58 * PI2, -0.6], [0.25, 0, -0.02, 0, -0.05, 0, 0, 0, 0, 0, 0, PI2 - 0.2, -0.7],
          [0.31, 0, -0.01, 0, 0, 0, 0, 0, 0, 0, 0, PI2 + 0.35, -0.4], [0.42, 0, 0, 0.08, 0.5, 0.3, 0, 0, 0.12, 0, 0, PI2 + 0.1, 0.1], [0.55, 0, 0, 0.07, 0.45, 0.28, 0, 0, 0.08, 0, 0, PI2, 0],
          [0.85, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, PI2, 0]],
  // Bulut Hücumu (Bulut Atı, patlama 0,17 = hücumun başlangıcı, varış 0,37): kısa şahlanma → gövde uzayıp basılır, ön bacaklar
  // dörtnal pozunda toplanır (görüntü A→B kayar, sahne3d) → varışta boynuz öne savrulur (tosla) → toparlan
  hucum: [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0.1, -0.03, 0, 0.4, -0.08, 0.2, 1, 0, 0, 0, 0, 0, 0], [0.17, 0, -0.01, -0.06, -0.25, -0.1, 0.7, 0, 0, 0.15, 0, 0, 0],
          [0.33, 0.02, -0.02, -0.1, -0.3, -0.12, 0.7, 0, 0, 0.15, 0, 0, 0], [0.37, 0.13, -0.025, -0.14, -0.46, -0.36, 0, 0, 0, 0.04, 0, 0, 0],
          [0.45, 0.1, -0.02, -0.1, -0.36, -0.27, 0, 0, 0, 0, 0, 0, 0], [0.75, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
  // Can Emme (Sis Yarasası, patlama 0,3 = kavrama; his.atil hedefe atar): geri kabarır → başla öne dalıp ısırır (baş nabzı: ağız) → yutkunarak
  // tutar, can küresi ağza vardıkça (0,8) gövde %11 şişer → geri çekilir, söner
  sar:   [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0.15, -0.06, 0.03, 0.2, 0.25, 0.2, 0, 0, 0, 0, 0.02, 0, 0], [0.3, 0.12, -0.02, -0.25, -0.45, -0.35, 0, 0, 0.1, 0.06, 0, 0, 0],
          [0.4, 0.1, -0.02, -0.2, -0.4, -0.3, 0, 0, -0.05, 0.03, 0.03, 0, 0], [0.55, 0.1, -0.02, -0.2, -0.4, -0.3, 0, 0, 0.08, 0.03, 0.05, 0, 0],
          [0.7, 0.08, -0.01, -0.16, -0.35, -0.25, 0, 0, -0.04, 0.02, 0.08, 0, 0], [0.85, 0.02, 0, 0.05, 0.1, 0.1, 0, 0, 0.06, 0, 0.11, 0, 0],
          [1.05, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.04, 0, 0], [1.25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
};
// yetenek adı → stil (kahramanın imza yeteneği; aynı görünümü kullanan canavarların yetenekleri eski stilde kalır)
const YET_STIL = { buzNefes: 'nefes', ocak: 'ocak', dortnal: 'hucum', ruhEmme: 'sar' };
// stilin patlama karesi (sn): sahne3d'nin verdiği 'an' (patlamaya kalan sn) bu kareye kilitlenir (yetZaman)
const DA_AN = { ulu: 0.32, ofke: 0.36, nefes: 0.3, ocak: 0.25, hucum: 0.17, tukur: 0.36, sar: 0.3 };
/** yetenek saatini stil saatine çevirir: patlama karesi (P) tam 'an' sn sonra gelir. Kalan süre hazırlıktan kısaysa hazırlık sıkışır,
    uzunsa poz dinlenmede bekler; patlamadan sonra gerçek hızla akar. */
function yetZaman(t, an, P) {
  if (P == null || an == null) return t;
  if (t >= an) return P + (t - an);
  const kalan = an - t; return an < P ? P - kalan * P / Math.max(0.05, an) : Math.max(0, P - kalan);
}
// gövdeyi ileri eksende uzatır / dikeyde basar ya da bütünüyle şişirir (P pivotu çevresinde): S = I + (sf−1)ffᵀ + (su−1)uuᵀ + (sn−1)nnᵀ
function olcekAbout(m, P, f, u, n, sf, su, sn) {
  const a = sf - 1, b = su - 1, c = sn - 1;
  const xx = 1 + a * f.x * f.x + b * u.x * u.x + c * n.x * n.x, xy = a * f.x * f.y + b * u.x * u.y + c * n.x * n.y, xz = a * f.x * f.z + b * u.x * u.z + c * n.x * n.z;
  const yy = 1 + a * f.y * f.y + b * u.y * u.y + c * n.y * n.y, yz = a * f.y * f.z + b * u.y * u.z + c * n.y * n.z, zz = 1 + a * f.z * f.z + b * u.z * u.z + c * n.z * n.z;
  m.set(xx, xy, xz, P.x - (xx * P.x + xy * P.y + xz * P.z), xy, yy, yz, P.y - (xy * P.x + yy * P.y + yz * P.z), xz, yz, zz, P.z - (xz * P.x + yz * P.y + zz * P.z), 0, 0, 0, 1);
  return m;
}
export const DA_DARBE = { isir: 0.26, tosla: 0.26 };
export const YILAN_DARBE = 0.28;
const DA_YERVUR = { sahlan: 0.4, ofke: 0.36 };
const DA_FID = ['kokla', 'silkin', 'kuyruk'];

/** Her kare (aktar yerine). dt: görsel dt (dtGorsel × hizKati).
    ops: hiz (hücre/sn, birimin o anki görsel hızı), saldiri (true: bu karede başlat — darbe DA_DARBE sn sonra; ya da {darbe: kurulma sn,
         sonra: toparlanma hız çarpanı, on: önden kurulma (darbeden önce tutma pozunda bekler), onay: önden kurulmayı darbe sn sonraya bağla,
         iptal: önden kurulmayı geri sar}), yetenek (true | stil adı),
         vurul (true | güç 0..1), olum (ölüyken sürekli true; false'a dönerse diriliş), zafer (bool), bakis (rad, hedefe göre baş sapması)
    Döner: {olay: 'darbe' | 'yerVur' | 'devrildi' | null} */
export function dortAyakliGuncelle(d, dt, { hiz = 0, saldiri = false, yetenek = false, vurul = false, olum = false, zafer = false, bakis = 0 } = {}) {
  if (!d) return DA_SONUC_BOS;
  let olay = null; dt = Math.min(0.1, Math.max(0, dt)); d.t += dt;
  const { veri, f, u, n, Hy } = d;
  // tetikleyiciler
  if (olum && !d.olum) { d.olum = { t: 0 }; d.sal = d.yet = null; }
  if (!olum && d.olum) { d.olum = null; }
  if (!d.olum) {
    if (saldiri) {
      const o = typeof saldiri === 'object' ? saldiri : null, s0 = d.sal;
      if (o && o.iptal) { if (s0 && s0.on) { s0.on = false; s0.geri = true; } }
      else if (o && o.onay && s0 && s0.on) { s0.on = false; s0.hiz = Math.max(0, s0.darbe - s0.t) / Math.max(0.05, o.darbe); }
      else { const dr = DA_DARBE[d.stil.saldir] || 0.26, h = o && o.darbe > 0 ? o.darbe : dr;
        // kurulma (darbeye dek) ağırlık sınıfının süresine ölçeklenir; toparlanma 'sonra' hızıyla
        d.sal = { t: 0, a: DA[d.stil.saldir] || DA.isir, darbe: dr, hiz: dr / Math.max(0.08, h), sonra: (o && o.sonra) || 1, on: !!(o && o.on), geri: false, oldu: false }; }
    }
    if (yetenek) {
      const ad = typeof yetenek === 'object' ? yetenek.ad : null, st = typeof yetenek === 'string' ? yetenek : (ad && YET_STIL[ad]) || d.stil.yetenek;
      const an = typeof yetenek === 'object' && yetenek.an != null ? yetenek.an : null;
      d.yet = { t: 0, tp: 0, st, a: DA[st] || DA.tosla, oldu: false, P: DA_AN[st], an }; d.sal = null;
    }
    if (vurul) d.vur = vurTepki(d.vur, vurul);
  }
  d.zafer = zafer;
  // hız ve yürüyüş ağırlığı
  const olcek = Math.max(1e-4, _v1.setFromMatrixColumn(d.Z.matrixWorld, 0).length());
  const vZ = (d.olum ? 0 : hiz) / olcek;
  d.v += (vZ - d.v) * Math.min(1, dt * 9);
  const w = yumusak((d.v * olcek - 0.06) / 0.5) * (d.yet ? 0.3 : 1);
  d.w = w;
  const DUTY = 0.5, Lmax = d.adimMax;
  const fcHam = d.v * DUTY / Math.max(1e-4, Lmax);
  const fc = kirp(fcHam, 1.7, 4.5);   // çok kısa bacakta frekans tavanı
  const adimL = d.v * DUTY / fc;
  const dortnal = kirp((fcHam - 3.2) / 1.6);   // adım sınırına yaklaşınca dörtnala geçiş hissi (bob + öne eğim artar)
  d.adim += fc * dt * (w > 0.01 ? 1 : 0.25);
  const ph = d.adim % 1;
  // kanallar: ileri, yük, eğim, boyun, baş, önKopuk
  const k = d.kanal; k.fill(0);
  let pivotArka = false, donY = 0;
  if (d.sal) { const s = d.sal;
    if (s.geri) { s.t -= dt * 1.5; if (s.t <= 0) d.sal = null; else anahtar(s.a, s.t, k); }   // önden kurulma boşa çıktı: bekleme pozuna dön
    else { s.t += dt * (s.t < s.darbe ? s.hiz : s.sonra); if (s.on) s.t = Math.min(s.t, s.darbe * 0.6);   // önden kurulmada tutma pozu
      anahtar(s.a, s.t, k); if (!s.oldu && s.t >= s.darbe) { s.oldu = true; olay = 'darbe'; } if (s.t > s.a[s.a.length - 1][0]) d.sal = null; } }
  if (d.yet) {
    const y = d.yet; y.t += dt; const tp = y.tp = yetZaman(y.t, y.an, y.P); anahtar(y.a, tp, k); pivotArka = y.st === 'sahlan' || y.st === 'ulu' || y.st === 'ofke' || y.st === 'hucum';
    if (y.st === 'ulu' && tp > 0.32 && tp < 0.9) { k[4] += Math.sin(tp * 38) * 0.035; k[7] *= 0.55 + 0.45 * Math.sin(tp * 31); }   // uluma titreşimi + ağız nabzı
    else if (y.st === 'nefes' && tp > 0.32 && tp < 0.74) { k[3] += Math.sin(tp * 41) * 0.03; k[7] += Math.sin(tp * 29) * 0.03; }   // nefes titreşimi
    if (y.st === 'don') donY = PI2 * cikis3((y.t - 0.05) / 0.45) * (y.t > 0.05 ? 1 : 0);
    if (DA_YERVUR[y.st] && !y.oldu && tp >= DA_YERVUR[y.st]) { y.oldu = true; olay = 'yerVur'; }
    if (tp > y.a[y.a.length - 1][0]) d.yet = null;
  }
  let ileri = k[0] * Hy, yuk = k[1] * Hy, egim = k[2], boyunA = k[3], basA = k[4], kopuk = k[5], esele = k[6], yalpa = 0, yanal = 0;
  const uzK = k[8], sisK = k[9], kuyrukK = k[11]; donY += k[10];
  // vurulma: geri sarsılma + baş irkilmesi
  if (d.vur) { const v = d.vur; v.t += dt; const e = vurZarf(v); ileri -= 0.05 * Hy * e; egim += 0.06 * e; boyunA += 0.16 * e; if (v.t > 0.45) d.vur = null; }
  // yürüyüş: inip kalkma (adım başına 2), yalpalama, hafif öne eğilme
  // tırısta gövde basma ortasında en yüksek (ters sarkaç), uçlarda alçak; yürürken hafif çömelir (bacaklara erişim payı)
  const bob = Math.cos(PI2 * 2 * (ph - DUTY / 2)) * (0.022 + 0.03 * dortnal) * Hy * w;
  yuk += bob - d.comel * w; yalpa += Math.sin(PI2 * ph) * 0.045 * w; egim += (-0.03 - 0.06 * dortnal) * w + Math.sin(PI2 * 2 * ph) * (0.015 + 0.04 * dortnal) * w;
  // bekleme: nefes
  const nefes = Math.sin(d.t * PI2 * 0.38); yuk += nefes * 0.006 * Hy * (1 - w); boyunA += nefes * 0.03 * (1 - w);
  // canlılık (boşta): ağırlık aktarma (gövde yavaşça yana yatar; ayaklar IK ile yerde kalır), etrafa bakınma, 7–12 sn'de bir kişilik fidget'ı
  // (silkinme, yeri koklama, kuyruk sallama). Birimler arası faz farkı d.faz ile.
  d.bosW += ((d.sal || d.yet || d.vur || d.olum || d.zafer ? 0 : 1 - w) - d.bosW) * Math.min(1, dt * 3);
  let bakIdle = 0, kuyrukHiz = 0;
  if (d.bosW > 0.01) {
    const B = d.bosW;
    yalpa += Math.sin(d.t * PI2 * (0.12 + 0.05 * ozet(d.faz * 3.3)) + d.faz * 6) * 0.03 * B;
    bakIdle = (gurultu(d.t * 0.2 + d.faz * 29) * 0.38 + gurultu(d.t * 0.8 + d.faz * 7) * 0.05) * B;
    basA += gurultu(d.t * 0.16 + d.faz * 17) * 0.06 * B;
    if (!d.fid && B > 0.9) { d.fidT -= dt; if (d.fidT <= 0) d.fid = { t: 0, tur: DA_FID[d.fidSira++ % DA_FID.length] }; }
  }
  if (d.fid) {
    const fd = d.fid; fd.t += dt; const B = d.bosW, e = fd.t;
    if (fd.tur === 'silkin') { const z = e < 0.7 ? Math.sin(e * 34) * Math.sin(Math.PI * e / 0.7) : 0; yalpa += z * 0.07 * B; boyunA += z * 0.12 * B; if (e > 0.8) d.fid = null; }
    else if (fd.tur === 'kokla') { const z = e < 0.35 ? yumusak(e / 0.35) : e < 1.3 ? 1 : 1 - yumusak((e - 1.3) / 0.4); boyunA -= 0.55 * z * B; basA -= 0.25 * z * B + Math.sin(e * 22) * 0.03 * z * B; egim -= 0.05 * z * B; bakIdle *= 1 - z; if (e > 1.7) d.fid = null; }
    else { kuyrukHiz = (e < 1.4 ? Math.sin(Math.PI * e / 1.4) : 0) * B; boyunA += 0.1 * kuyrukHiz; if (e > 1.4) d.fid = null; }
    if (!d.fid || B < 0.3) { d.fid = null; d.fidT = 7 + ozet(d.faz * 11 + d.fidSira * 1.7) * 5; }
  }
  bakis += bakIdle;
  // baş dengeleme: gövde eğimine ve inip kalkmaya karşı
  boyunA += -egim * 0.55 - (bob / Hy) * 1.6;
  if (d.zafer) { boyunA += 0.25; basA += 0.1 + Math.sin(d.t * 2.4) * 0.04; }
  // ölüm: yana devrilme
  let devril = 0;
  if (d.olum) {
    const o = d.olum; o.t += dt; const e = o.t / 0.6;
    devril = e < 1 ? (Math.PI / 2) * giris2(e) : (Math.PI / 2) - Math.sin(Math.min(1, (o.t - 0.6) / 0.25) * Math.PI) * 0.09 * Math.exp(-(o.t - 0.6) * 4);
    if (!o.oldu && e >= 1) { o.oldu = true; olay = 'devrildi'; }
    boyunA += -0.35 * kirp(e); basA += -0.2 * kirp(e); kopuk = 1;
  }
  // 1) model dönüşümü (Z çerçevesinde): M = T(öteleme) · Rdön(merkez) · Rdevril(yan pivot) · Reğim(pivot) · Mrest
  const piv = pivotArka ? d.arkaP : d.C;
  _m2.identity();
  // eğim (n ekseni etrafında)
  rotAbout(_m3, piv, n, egim); _m2.premultiply(_m3);
  // yalpalama (f ekseni, gövde merkezi)
  rotAbout(_m3, d.C, f, yalpa); _m2.premultiply(_m3);
  if (devril) { _v4.copy(d.C).addScaledVector(n, d.olumYon * d.yari); _v4.y = d.minY; rotAbout(_m3, _v4, _v2.copy(f).multiplyScalar(d.olumYon), devril); _m2.premultiply(_m3); }
  if (donY) { rotAbout(_m3, d.C, u, donY); _m2.premultiply(_m3); }
  // uzama (hücum: ileri uzar, dikeyde basılır) ve şişme (kabuk): zemin hizasındaki gövde merkezi çevresinde
  if (uzK || sisK) { _v4.copy(d.C); _v4.y = d.minY; olcekAbout(_m3, _v4, f, u, n, 1 + uzK + sisK, 1 - 0.53 * uzK + sisK, 1 - 0.2 * uzK + sisK); _m2.premultiply(_m3); }
  _m3.makeTranslation(f.x * ileri + d.lat.x * yanal, yuk, f.z * ileri + d.lat.z * yanal); _m2.premultiply(_m3);
  const Mx = _m3.multiplyMatrices(_m2, d.m0.M);
  Mx.decompose(d.model.position, d.model.quaternion, d.model.scale);
  // 2) eksen kemikleri: dinlenmeye döndür, boyun/baş/kuyruk dönüşleri
  for (const kk of d.kullan) kk.quaternion.copy(veri.get(kk).q);
  const nb = d.boyun.length;
  if (nb) {
    // ağırlık toplamları (döngüyle; kare başına dizi/kapanış üretmeden)
    let topW = 0, sonW = 0; const yari = Math.ceil(nb / 2);
    for (let i = 0; i < nb; i++) { topW += d.boyun[i].w; if (i >= yari) sonW += d.boyun[i].w; }
    for (let i = 0; i < nb; i++) {
      const b = d.boyun[i], v = veri.get(b.k), oran = b.w / topW, sonYari = i >= nb / 2;
      const a = boyunA * oran * (sonYari ? 0.6 : 1.4) + (sonYari ? basA * b.w / Math.max(1e-3, sonW) : 0);
      b.k.quaternion.multiply(_q1.setFromAxisAngle(v.en, a));
      if (bakis) b.k.quaternion.multiply(_q1.setFromAxisAngle(v.eu, kirp(bakis, -0.6, 0.6) * oran));
      if (d.surungen && w > 0.01) b.k.quaternion.multiply(_q1.setFromAxisAngle(v.eu, Math.sin(PI2 * ph - i * 0.7) * 0.18 * w));
    }
  }
  // baş nabzı (yalnız yetenekte; değiştiyse bir kez 1'e döner)
  if (d.basKemik) { const nb2 = k[7]; if (Math.abs(nb2) > 1e-4) { d.basKemik.scale.setScalar(d.basS0 * (1 + nb2)); d.basOlcek = true; } else if (d.basOlcek) { d.basKemik.scale.setScalar(d.basS0); d.basOlcek = false; } }
  // kuyruk: gecikmeli salınım + gövde inişine yay tepkisi
  const bobHiz = (bob - d.bobOnce) / Math.max(1e-4, dt); d.bobOnce = bob;
  yay(d.kuyrukYay, kirp(-bobHiz / Hy * 0.5, -0.6, 0.6) + (d.sal ? -0.25 : 0), 90, 9, dt);
  const nk = d.kuyruk.length;
  if (nk) {
    // girdi: kökün yaw hızı (dönünce kuyruk terse savrulur, −ω·0,12), boşta yavaş temel salınım (0,4 Hz; sakin, titreme değil),
    // kuyruk fidget'ı ve zafer (≈1 Hz, ağır), yürüme adımı ve sürüngen S'si (adım fazına kilitli), yetenek kanalı. Uçlar zincirle gecikir.
    const fx = d.Z.matrixWorld.elements[8], fz = d.Z.matrixWorld.elements[10], yon = Math.atan2(fx, fz);
    if (d.yonOnce != null && dt > 0) { let dy = yon - d.yonOnce; dy -= Math.round(dy / PI2) * PI2; d.yonHiz += (dy / dt - d.yonHiz) * Math.min(1, dt * 10); }
    d.yonOnce = yon;
    const girdi = d.olum ? 0 : kirp(kuyrukK + Math.sin(d.t * PI2 * (0.36 + 0.08 * ozet(d.faz * 4.1)) + d.faz * 5) * 0.13 * (1 - w) * (1 - kuyrukHiz)
      + Math.sin(d.t * PI2 * 1.05) * 0.3 * kuyrukHiz + (d.zafer ? Math.sin(d.t * PI2 * 0.95) * 0.24 : 0) + Math.sin(PI2 * ph) * 0.16 * w
      + (d.surungen ? Math.sin(PI2 * ph + 1.6) * 0.2 * w : 0) - d.yonHiz * 0.12, -0.6, 0.6);
    const fK = d.kKalin ? 2.0 : 3.0, fU = d.kKalin ? 1.2 : 1.8, zK = d.olum ? 0.8 : d.kKalin ? 0.55 : 0.45, zU = d.olum ? 0.8 : d.kKalin ? 0.4 : 0.3;
    for (let i = 0; i < nk; i++) {
      const kk = d.kuyruk[i], v = veri.get(kk), a = (i + 1) / nk, a0 = nk > 1 ? i / (nk - 1) : 0;
      yayFZ(d.kZin[i], i === 0 ? girdi : d.kZin[i - 1].x, karis(fK, fU, a0), karis(zK, zU, a0), dt);
      const kalk = (d.kuyrukYay.x + 0.12 * w) * (0.6 + a * 0.4) - (d.olum ? 0.3 : 0);
      kk.quaternion.multiply(_q1.setFromAxisAngle(v.eu, kirp(d.kZin[i].x * (0.5 + a), -0.6, 0.6))).multiply(_q2.setFromAxisAngle(v.en, kalk));
    }
  }
  // 3) bacaklar: dinlenmede dünya konumlarını oku, hedefe 2 kemik IK
  d.Z.updateWorldMatrix(true, false); d.model.updateMatrixWorld(true);
  const Zinv = _m1.copy(d.Z.matrixWorld).invert();
  const Zq = d.Z.getWorldQuaternion(_q3);
  const nW = _v4.copy(n).applyQuaternion(Zq).normalize();
  for (const b of d.bacaklar) {
    // hedef: zemine basan ayak (Z çerçevesi)
    const p = (ph + b.faz) % 1;
    let x, y;
    if (p < DUTY) { x = adimL * (0.5 - p / DUTY); y = 0; }
    else { const s = (p - DUTY) / (1 - DUTY); x = adimL * (-0.5 + yumusak(s)); y = Math.sin(Math.PI * s) * 0.2 * b.kalcaY * Math.min(1, d.v * olcek / 0.8); }
    const T = _v1.copy(b.P0).addScaledVector(f, x * w).addScaledVector(u, y * w);
    // gövdeye bağlı ayak (şahlanma, devrilme): dinlenme ucu gövde dönüşümüyle taşınır + toplama
    const bag = d.olum ? 1 : (b.on ? kopuk : 0);
    if (bag > 0) {
      _v2.copy(b.P0);
      if (!d.olum) _v2.addScaledVector(u, 0.32 * b.kalcaY).addScaledVector(f, -0.1 * b.kalcaY);
      else _v2.addScaledVector(f, (b.on ? 0.12 : -0.12) * b.kalcaY);
      _v2.applyMatrix4(_m2); T.lerp(_v2, bag);
    }
    // eşeleme: sağ ön ayak kalkıp öne gider, sonra yerde geriye sürtülür
    if (esele && b.on && !b.sol && !d.olum) T.addScaledVector(f, 0.16 * b.kalcaY * esele).addScaledVector(u, Math.max(0, esele) * 0.3 * b.kalcaY);
    if (bag < 1) T.y = Math.max(T.y, b.P0.y - 0.02 * Hy);
    ikCoz(b, T, Zinv, nW, f, u);
  }
  DA_SONUC.olay = olay; return DA_SONUC;
}
// dönüş nesneleri her karede yeniden kullanılır (çağıran yalnız .olay'ı aynı karede okur)
const DA_SONUC = { olay: null }, DA_SONUC_BOS = { olay: null }, YL_SONUC = { olay: null };
function rotAbout(m, P, eksen, aci) {
  if (!aci) return m.identity();
  m.makeRotationAxis(_v3.copy(eksen).normalize(), aci);
  const px = P.x, py = P.y, pz = P.z; const e = m.elements;
  // T(P) R T(−P)
  e[12] = px - (e[0] * px + e[4] * py + e[8] * pz); e[13] = py - (e[1] * px + e[5] * py + e[9] * pz); e[14] = pz - (e[2] * px + e[6] * py + e[10] * pz);
  return m;
}
const _ikH = new THREE.Vector3(), _ikK = new THREE.Vector3(), _ikT = new THREE.Vector3(), _ikQ = new THREE.Quaternion(), _ikQ2 = new THREE.Quaternion(), _ikA = new THREE.Vector3();
/** Sagital düzlemde (f,u) iki kemik IK; dönüşler dünya n ekseni etrafında uygulanır */
function ikCoz(b, T, Zinv, nW, f, u) {
  const H0 = b.kalca.getWorldPosition(_ikH).applyMatrix4(Zinv);
  const U0 = b.uc.getWorldPosition(_ikT).applyMatrix4(Zinv);
  const hx = H0.dot(f), hy = H0.dot(u);
  const dx = T.dot(f) - hx, dy = T.dot(u) - hy;
  const tx = U0.dot(f) - hx, ty = U0.dot(u) - hy;
  if (!b.diz) {   // tek parça: uca doğru çevir
    const a = Math.atan2(dy, dx) - Math.atan2(ty, tx);
    b.kalca.getWorldQuaternion(_ikQ).invert(); _ikA.copy(nW).applyQuaternion(_ikQ);
    b.kalca.quaternion.multiply(_ikQ2.setFromAxisAngle(_ikA, a)); return;
  }
  const K0 = b.diz.getWorldPosition(_ikK).applyMatrix4(Zinv);
  const ax = K0.dot(f) - hx, ay = K0.dot(u) - hy, bx = tx - ax, by = ty - ay;
  const L1 = Math.hypot(ax, ay), L2 = Math.hypot(bx, by); if (L1 < 1e-5 || L2 < 1e-5) return;
  // erişim dışı hedef: ayağı yerde tut, yatayda kısalt (havaya kalkmasın)
  const R = (L1 + L2) * 0.985; let ddx = dx;
  if (dx * dx + dy * dy > R * R) ddx = Math.sign(dx || 1) * Math.sqrt(Math.max(0, R * R - dy * dy));
  let D = Math.hypot(ddx, dy); D = kirp(D, Math.abs(L1 - L2) + 1e-4, (L1 + L2) * 0.999);
  const isaret = ax * by - ay * bx >= 0 ? 1 : -1;
  const al = Math.acos(kirp((L1 * L1 + D * D - L2 * L2) / (2 * L1 * D), -1, 1));
  const thD = Math.atan2(dy, ddx), thA = thD - isaret * al;
  const fi1 = thA - Math.atan2(ay, ax);
  const a2x = Math.cos(thA) * L1, a2y = Math.sin(thA) * L1;
  const fi2 = Math.atan2(Math.sin(thD) * D - a2y, Math.cos(thD) * D - a2x) - Math.atan2(by, bx) - fi1;
  // diz yerel ekseni (kalça dönmeden önceki dünya yönelimine göre; n ekseni kalça dönüşünden etkilenmez)
  b.diz.getWorldQuaternion(_ikQ).invert(); const dizEk = _v2.copy(nW).applyQuaternion(_ikQ);
  b.diz.quaternion.multiply(_ikQ2.setFromAxisAngle(dizEk, fi2));
  b.kalca.getWorldQuaternion(_ikQ).invert(); _ikA.copy(nW).applyQuaternion(_ikQ);
  b.kalca.quaternion.multiply(_ikQ2.setFromAxisAngle(_ikA, fi1));
}

// ═════════════════════════ YILAN ═════════════════════════
/** Yılanı kur (birimKur sonunda). Boyun zinciri: kökten baş ucuna giden yolun yüksekte kalan kemikleri; kıvrık alt gövde sabit. */
export function yilanKur(model, kemikler, { faz = Math.random() } = {}) {
  const K = kemikHaritasi(model, kemikler);
  const { Z, veri } = dinlenme(model, K);
  const f = onYonBul(veri), u = new THREE.Vector3(0, 1, 0), n = new THREE.Vector3().crossVectors(f, u).normalize();
  let minY = Infinity, maxY = -Infinity; for (const [, v] of veri) { minY = Math.min(minY, v.P.y); maxY = Math.max(maxY, v.P.y); }
  const Hy = Math.max(1e-3, maxY - minY);
  let uc = null, en = -Infinity;
  for (const [k, v] of veri) { if (!/Head/.test(v.ad)) continue; const s = v.P.y + 0.1 * v.P.dot(f); if (v.cocuk.length && s > en) { en = s; uc = k; } }
  if (!uc) for (const [k, v] of veri) { if (v.P.y > en) { en = v.P.y; uc = k; } }
  const kok = [...veri.keys()].find((k) => !veri.get(k).ebeveyn);
  const boyun = yol(kok, uc).filter((k) => k !== kok && veri.get(k).P.y - minY > 0.28 * Hy);
  const kuyruk = []; for (const [k, v] of veri) if (/Tail/.test(v.ad) && !boyun.includes(k) && v.cocuk.length && !boyun.some((b) => ataMi(k, b))) kuyruk.push(k);
  for (const k of [...boyun, ...kuyruk]) eksenler(veri.get(k), f, u, n);
  return { model, Z, veri, f, u, n, Hy, minY, boyun, kuyruk, t: faz * 10, ozf: faz, sal: null, yet: null, vur: null, olum: null, zafer: false, v: 0, olumYon: ozet(faz * 53) > 0.5 ? 1 : -1, k: new Array(7).fill(0),
    m0: { M: model.matrix.clone().compose(model.position, model.quaternion, model.scale) } };
}
// [t, boyunTaban(+geri), boyunUc, baş(+yukarı), ileri(H), yük(H)]
const YA = {
  saldir: [[0, 0, 0, 0, 0, 0], [0.14, 0.46, 0.28, 0.28, -0.06, 0.02], [0.23, 0.5, 0.3, 0.3, -0.07, 0.02], [0.28, -0.6, -0.38, -0.22, 0.14, -0.02], [0.36, -0.52, -0.32, -0.18, 0.12, -0.02], [0.64, 0, 0, 0, 0, 0]],
  // Zümrüt Zehri (patlama 0,36 = mermi çıkışı, DA_AN.tukur): boyun S'ye kıvrılıp yükselir, baş geri çekilir (ağızda damla birikir) →
  // baş ileri atılır, mermi ağızdan çıkar → baş yana sallanır → toparlan. Son sütun: yan sallanma (rad)
  tukur:  [[0, 0, 0, 0, 0, 0, 0], [0.24, 0.62, -0.42, 0.46, -0.08, 0.11, 0], [0.3, 0.66, -0.46, 0.5, -0.09, 0.12, 0], [0.36, -0.62, -0.28, -0.12, 0.15, 0.02, 0],
           [0.44, -0.52, -0.22, -0.06, 0.12, 0.02, 0.22], [0.54, -0.4, -0.16, -0.04, 0.09, 0.01, -0.2], [0.64, -0.28, -0.1, -0.02, 0.06, 0, 0.12], [0.9, 0, 0, 0, 0, 0, 0]],
};
/** Her kare. ops: dortAyakliGuncelle ile aynı (saldiri: darbe 0,22 sn sonra; yetenek: tükürme, mermi 0,4 sn'de). Döner {olay} */
export function yilanGuncelle(d, dt, { hiz = 0, saldiri = false, yetenek = false, vurul = false, olum = false, zafer = false, bakis = 0 } = {}) {
  if (!d) return DA_SONUC_BOS;
  let olay = null; dt = Math.min(0.1, Math.max(0, dt)); d.t += dt;
  if (olum && !d.olum) { d.olum = { t: 0 }; d.sal = d.yet = null; } if (!olum && d.olum) d.olum = null;
  if (!d.olum) { if (saldiri) d.sal = { t: 0, oldu: false }; if (yetenek) { d.yet = { t: 0, oldu: false, an: typeof yetenek === 'object' && yetenek.an != null ? yetenek.an : null }; d.sal = null; } if (vurul) d.vur = vurTepki(d.vur, vurul); }
  d.zafer = zafer;
  const olcek = Math.max(1e-4, _v1.setFromMatrixColumn(d.Z.matrixWorld, 0).length());
  d.v += ((d.olum ? 0 : hiz) - d.v) * Math.min(1, dt * 8); const w = yumusak((d.v - 0.06) / 0.5);
  const k = d.k; k.fill(0); let yanY = 0;
  if (d.sal) { d.sal.t += dt; anahtar(YA.saldir, d.sal.t, k); if (!d.sal.oldu && d.sal.t >= YILAN_DARBE) { d.sal.oldu = true; olay = 'darbe'; } if (d.sal.t > 0.64) d.sal = null; }
  if (d.yet) { const y = d.yet; y.t += dt; const tp = yetZaman(y.t, y.an, DA_AN.tukur); anahtar(YA.tukur, tp, k); yanY = k[5];
    if (!y.oldu && tp >= DA_AN.tukur) { y.oldu = true; olay = 'tukur'; } if (tp > 0.9) d.yet = null; }
  let taban = k[0], ucA = k[1], bas = k[2], ileri = k[3] * d.Hy, yuk = k[4] * d.Hy, yalpa = 0, yan = 0;
  if (d.vur) { const v = d.vur; v.t += dt; const e = vurZarf(v); taban += 0.22 * e; bas += 0.14 * e; if (v.t > 0.45) d.vur = null; }
  if (d.zafer) { bas += 0.15; yan += Math.sin(d.t * 2.2) * 0.1; }
  // canlılık (boşta): baş yavaşça etrafa bakar ve ara sıra yükselip kokluyormuş gibi tıslar (fazı birime özgü)
  { const B = (d.sal || d.yet || d.olum || d.zafer ? 0 : 1) * (1 - w); d.bosW = (d.bosW || 0) + (B - (d.bosW || 0)) * Math.min(1, dt * 3);
    if (d.bosW > 0.01) { bakis += gurultu(d.t * 0.22 + d.ozf * 29) * 0.45 * d.bosW; const y = Math.max(0, gurultu(d.t * 0.11 + d.ozf * 7)); ucA -= y * y * 0.35 * d.bosW; bas += y * y * 0.2 * d.bosW + Math.sin(d.t * 19) * 0.02 * y * d.bosW; } }
  let ser = 0; if (d.olum) { const o = d.olum; o.t += dt; const e = o.t / 0.5; ser = e < 1 ? giris2(e) : 1 - Math.sin(Math.min(1, (o.t - 0.5) / 0.2) * Math.PI) * 0.06 * Math.exp(-(o.t - 0.5) * 4); if (!o.oldu && e >= 1) { o.oldu = true; olay = 'devrildi'; } }
  // model: sürünme — hızla orantılı yanal S salınımı (2,5 Hz) ve ona 90° faz farklı sapma; ilerleme fazı hızla akar
  d.surun = (d.surun || 0) + dt * (2.5 * PI2) * Math.min(1, 0.3 + d.v);
  yalpa = Math.cos(d.surun) * 0.15 * w;
  const yanS = Math.sin(d.surun) * 0.06 * d.Hy * w;
  _m2.identity(); rotAbout(_m3, _v2.set(0, d.minY, 0), d.u, yalpa); _m2.premultiply(_m3);
  _m3.makeTranslation(d.f.x * ileri + d.n.x * yanS, yuk, d.f.z * ileri + d.n.z * yanS); _m2.premultiply(_m3);
  if (w > 0.3) { d.tozT = (d.tozT || 0) + dt; if (d.tozT > 0.3 && !olay) { d.tozT = 0; olay = 'toz'; } }
  _m3.multiplyMatrices(_m2, d.m0.M).decompose(d.model.position, d.model.quaternion, d.model.scale);
  for (let i = 0; i < d.boyun.length; i++) { const kk = d.boyun[i]; kk.quaternion.copy(d.veri.get(kk).q); }
  for (let i = 0; i < d.kuyruk.length; i++) { const kk = d.kuyruk[i]; kk.quaternion.copy(d.veri.get(kk).q); }
  const nb = d.boyun.length;
  for (let i = 0; i < nb; i++) {
    const kk = d.boyun[i], v = d.veri.get(kk), r = nb > 1 ? i / (nb - 1) : 1;
    // S kıvrımı: dalga boyun boyunca ilerler; bekleme salınımı yavaş, hareket hızlı
    const sDalga = Math.sin(d.t * 2.3 - i * 1.15) * (0.07 + 0.05 * w) * (i % 2 ? -1 : 1);
    const yanDalga = Math.sin(d.t * (1.3 + 2.2 * w) - i * 0.8) * (0.08 + 0.12 * w) + yan * (1 - r) + yanY * (0.3 + r);
    let a = sDalga + taban * (1 - r) + ucA * r + (i === nb - 1 ? bas : 0);
    a += (d.olum ? -1.7 / nb * ser * (1.3 - r * 0.6) : 0);
    kk.quaternion.multiply(_q1.setFromAxisAngle(v.en, a)).multiply(_q2.setFromAxisAngle(v.eu, yanDalga * (d.olum ? 1 - ser : 1) + (bakis ? kirp(bakis, -0.6, 0.6) / nb : 0)));
    if (ser) kk.quaternion.multiply(_q1.setFromAxisAngle(v.ef, d.olumYon * 1.5 * ser / Math.max(1, nb) * (1.4 - r * 0.8)));
  }
  // kuyruk: ilerleyen dalga (hareket ederken sürünme fazına kilitli)
  for (let i = 0; i < d.kuyruk.length; i++) { const kk = d.kuyruk[i], v = d.veri.get(kk); const dalga = Math.sin(d.t * 1.6 - i * 0.7) * 0.1 * (1 - w) + Math.sin(d.surun - i * 0.9) * 0.32 * w; kk.quaternion.multiply(_q1.setFromAxisAngle(v.eu, dalga * (d.olum ? 0.2 : 1))); }
  YL_SONUC.olay = olay; return YL_SONUC;
}

// ═════════════════════════ İKİ AYAKLI KATMAN ═════════════════════════
/** UAL aktarımının üstüne katman kur. b: sahne3d birimi (b.model, b.kemik, b.isk, b.faz kullanılır).
    ops: {kanat (Kuğu/Anka/Yarasa), iri (Golem/Ayı: kollar dışa)} — verilmezse b.gor'dan okunur */
export function ikiAyakliKur(b, { kanat, iri } = {}) {
  const g = b.gor || {}; const faz = b.faz != null ? b.faz : Math.random();
  const d = { b, K: b.kemik, kanat: kanat != null ? kanat : !!g.kanat, iri: iri != null ? iri : !!g.iri, faz, t: faz * 7,
    kolAci: g.kolAci != null ? g.kolAci : (g.iri ? 0.21 : 0.08), onKolAci: g.onKolAci != null ? g.onKolAci : 0.4, egimOfs: g.egim || 0, basOfs: g.bas || 0,
    nefesHz: 0.3 + ozet(faz * 13.7) * 0.16, nefesGenlik: 0.8 + ozet(faz * 7.1) * 0.5, idleHiz: 0.86 + ozet(faz * 3.3) * 0.28,
    sal: null, yet: null, bacakL: 0, vur: { x: 0, v: 0 }, egilYay: { x: 0, v: 0 }, cirpma: 0, w: 0, agirlik: 1, olum: false, kanal: [0, 0],
    // canlılık katmanı: saldırı stili (davul: iki tokmakla göbek davulu), tek kollu büyü klibinde tutan kol, boşta ağırlık aktarma hızı,
    // kişilik fidget'ı (6–12 sn'de bir; birimler arası faz farkı ozet(faz) ile), boşta ağırlığı (yumuşak)
    salStil: g.salStil || null, tekKol: !g.salStil && !(kanat != null ? kanat : g.kanat) && /^Spell_Simple/.test(g.hazir || ''),
    agirlikHz: 0.13 + ozet(faz * 5.3) * 0.07, fidTur: g.fidget || FID_VARSAYILAN, fidT: 2 + ozet(faz * 17.9) * 5, fid: null, bosStil: g.bosStil || null, dirsekYay: [{ x: 0, v: 0 }, { x: 0, v: 0 }], fidSira: Math.floor(ozet(faz * 3.1) * 7), bosW: 0, bakSap: 0 };
  // omurga kemikleri bir kez süzülür (kare başına dizi üretilmesin)
  d.om = [b.kemik.Spine, b.kemik.Spine1, b.kemik.Spine2].filter(Boolean);
  d.uyluk = [b.kemik.LeftUpLeg, b.kemik.RightUpLeg].filter(Boolean);
  return d;
}
const _F = new THREE.Vector3(), _R = new THREE.Vector3(), _U = new THREE.Vector3();
// ── İki ayaklı imza yetenek pozları (klibin ÜSTÜNE yordamsal katman) ──
// Zaman patlama anına göredir (u = 0: patlama karesi; motorun etki anı ya da mermi çıkışı, sahne3d yetenekBaslat 'an' verir).
// Kanallar: [u, eğilme (rad, +öne), çömelme (boyun oranı; − ise sıçrama), ölçek nabzı (+oran), dönüş (rad, kök Y), kolYan (+dışa/yukarı),
//            kolÖn (+ileri), sağKol (+ileri/yukarı, yalnız sağ), baş (+yukarı)]. Modül düzeyinde sabit diziler; kare başına ayırma yok.
// cirp: kanatlıda yetenek boyunca çırpma (false: kanat pozu kanallardan gelir)
const T2 = Math.PI * 2;
const YET_POZ = {
  // Kaya Fırlat (Golem; taban Idle_Loop): öne eğilip çömel, iki el yere (kaya yerden kopar) → iki elle kaldır, kaya başın üstünde, geri
  //   esne, gövde şişer → u=0 iki kol başın üstünden öne savrulur, kaya bırakılır → öne eğik izleme → toparlan
  tasFirlat: { cirp: true, k: [[-0.36, 0, 0, 0, 0, 0, 0, 0, 0], [-0.27, 0.55, 0.15, 0, 0, 0.18, 0.45, 0, -0.18], [-0.2, 0.5, 0.15, 0, 0, 0.2, 0.55, 0, -0.12],
    [-0.12, 0.08, 0.07, 0.02, 0, 0.26, 1.75, 0, 0.12], [-0.05, -0.3, 0.03, 0.05, 0, 0.3, 2.4, 0, 0.22], [0, -0.2, 0.02, 0.04, 0, 0.26, 2.2, 0, 0.12],
    [0.06, 0.48, 0.08, 0.02, 0, 0.12, 1.05, 0, -0.14], [0.16, 0.42, 0.07, 0, 0, 0.08, 0.6, 0, -0.1], [0.55, 0, 0, 0, 0, 0, 0, 0, 0]] },
  // Savaş Davulu (Kurbağa): dört göbek vuruşu u = 0 / 0,2 / 0,4 / 0,6 (her biri bir dalga); son vuruştan önce küçük sıçrama, inişte büyük halka
  davul: { cirp: true, k: [[-0.36, 0, 0, 0, 0, 0, 0, 0, 0], [-0.1, -0.1, 0, 0, 0, 0.95, 0.3, 0, 0.15],
    [0, 0.18, 0.06, 0.07, 0, -0.1, 0.75, 0, -0.1], [0.05, 0.12, 0.05, 0.03, 0, 0, 0.6, 0, -0.05],
    [0.12, -0.06, 0.01, 0, 0, 0.9, 0.3, 0, 0.12], [0.2, 0.18, 0.06, 0.07, 0, -0.1, 0.75, 0, -0.1], [0.25, 0.12, 0.05, 0.03, 0, 0, 0.6, 0, -0.05],
    [0.32, -0.06, 0.01, 0, 0, 0.9, 0.3, 0, 0.12], [0.4, 0.18, 0.06, 0.07, 0, -0.1, 0.75, 0, -0.1], [0.45, 0.05, 0.04, 0.02, 0, 0.3, 0.5, 0, 0],
    [0.52, -0.12, -0.13, 0, 0, 1.1, 0.25, 0, 0.25], [0.6, 0.24, 0.1, 0.1, 0, -0.15, 0.8, 0, -0.15], [0.7, 0.16, 0.07, 0.04, 0, 0, 0.6, 0, -0.08], [0.98, 0, 0, 0, 0, 0, 0, 0, 0]] },
  // Can Emme (Yarasa): kanatlar arkaya açılır, geri yaslan → u=0 atıl ve kavra → kanatlar öne kapanıp sarar, gövde şişip nefes alır → geri sıçra
  //   (taban klip kavrama karesinde yavaşlayıp tutulur: sahne3d GORSEL.yarasa.yetTut; klibin yataya iniş kısmı oynamaz)
  ruhEmme: { cirp: false, k: [[-0.45, 0, 0, 0, 0, 0, 0, 0, 0], [-0.2, -0.22, 0.02, 0, 0, 0.8, -0.45, 0, 0.12], [-0.06, -0.12, 0.01, 0, 0, 0.6, -0.2, 0, 0.05],
    [0, 0.28, 0.03, 0.02, 0, 0.05, 0.55, 0, -0.08], [0.12, 0.1, 0.04, 0.05, 0, -0.15, 0.75, 0, 0], [0.3, 0.02, 0.04, 0.09, 0, -0.2, 0.8, 0, 0.04],
    [0.45, 0.04, 0.03, 0.05, 0, -0.15, 0.75, 0, 0.04], [0.55, 0.0, 0.03, 0.06, 0, -0.1, 0.7, 0, 0.04], [0.66, -0.1, 0, 0, 0, 0.4, 0, 0, 0.1], [0.92, 0, 0, 0, 0, 0, 0, 0, 0]] },
  // Kasırga (Rüzgâr Ruhu): kollar yana, hızlanan tam tur → u=0 (mermi çıkışı) iki kol ileri itilir, gövde öne → toparlan
  kasirga: { cirp: true, k: [[-0.4, 0, 0, 0, 0, 0, 0, 0, 0], [-0.24, -0.05, 0.02, 0, 1.1, 0.75, 0, 0, 0.05], [-0.06, -0.12, 0.03, 0.02, T2, 1.0, -0.1, 0, 0.12],
    [0, 0.26, 0.02, 0.04, T2, -0.1, 0.95, 0, -0.05], [0.1, 0.24, 0.02, 0.02, T2, -0.05, 0.85, 0, -0.05], [0.45, 0, 0, 0, T2, 0, 0, 0, 0]] },
  // Işık Kanadı (Kuğu): kanatlar gövdenin önünde kapanır, baş eğilir, hafif çömel (göğüste altın ışık birikir) → u=0 çevresinde kanatlar
  // iki yana tam açılır, gövde yükselir (kanat uçlarından tüy dalgası) → 0,4 sn açık kanatla süzül → toparlan
  kanat: { cirp: false, k: [[-0.38, 0, 0, 0, 0, 0, 0, 0, 0], [-0.16, 0.18, 0.05, 0, 0, -0.18, 0.95, 0, -0.26], [-0.05, 0.22, 0.06, 0, 0, -0.22, 1.05, 0, -0.32],
    [0.07, -0.16, -0.08, 0.05, 0, 1.2, -0.25, 0, 0.24], [0.16, -0.12, -0.1, 0.03, 0, 1.12, -0.2, 0, 0.2], [0.34, -0.1, -0.11, 0.01, 0, 1.08, -0.18, 0, 0.17],
    [0.52, -0.08, -0.09, 0, 0, 1.0, -0.12, 0, 0.12], [0.85, 0, 0, 0, 0, 0, 0, 0, 0]] },
  // ── grup 3 ──
  // Kara Gölge (Ayı; taban Agir_Ezme, ezme karesi u=0): geri yaslan, gövde şişer, kollar başın üstünde → u=0 yere ezme (öne +0,36, çömel)
  //   → kısa tutma → toparlan. Klip iki elle ezmeyi zaten yapar; katman yalnız ağırlığı ve kalkışı büyütür
  karaGolge: { cirp: true, k: [[-0.5, 0, 0, 0, 0, 0, 0, 0, 0], [-0.3, -0.16, 0, 0.05, 0, 0.1, 0.3, 0, 0.18], [-0.08, -0.22, -0.03, 0.07, 0, 0.12, 0.45, 0, 0.22],
    [0, 0.36, 0.11, 0.02, 0, 0, -0.15, 0, -0.16], [0.1, 0.32, 0.1, 0, 0, 0, -0.1, 0, -0.12], [0.5, 0, 0, 0, 0, 0, 0, 0, 0]] },
  // Kül Yağmuru (Anka; taban Idle_Loop): çömel, kanatlar arkaya gerilir → kanatlar yukarı açılır → u=0..0,04 güçlü aşağı vuruş, gövde 0,24 boy
  //   havalanır (kor dalgası göğe) → kanatlar açık süzülür → yavaşça iner
  kulDogus: { cirp: false, k: [[-0.34, 0, 0, 0, 0, 0, 0, 0, 0], [-0.14, 0.22, 0.12, 0.03, 0, 0.45, -0.75, 0, -0.12], [-0.05, 0.1, 0.06, 0.05, 0, 1.3, -0.35, 0, 0.12],
    [0.04, -0.16, -0.24, 0.03, 0, -0.2, 0.3, 0, 0.32], [0.14, -0.1, -0.25, 0.01, 0, 0.65, -0.05, 0, 0.22], [0.36, -0.06, -0.2, 0, 0, 0.8, -0.1, 0, 0.14],
    [0.6, -0.02, -0.07, 0, 0, 0.45, 0, 0, 0.05], [0.85, 0, 0, 0, 0, 0, 0, 0, 0]] },
  // Ayaz (Baykuş; taban Idle_Loop): tüyler kabarır (ölçek +%10), kanatlar yavaşça yana açılır, baş kalkar → u=0 kanatlar sertçe aşağı,
  //   gövde 0,1 boy kalkar (dalga bu karede ayak altından çıkar) → kanatlar katlanır, tüyler iner
  ayaz: { cirp: false, k: [[-0.5, 0, 0, 0, 0, 0, 0, 0, 0], [-0.26, -0.08, 0.02, 0.06, 0, 0.7, 0, 0, 0.12], [-0.08, -0.16, 0.05, 0.11, 0, 1.35, -0.2, 0, 0.24],
    [0, 0.24, -0.1, 0.07, 0, -0.35, 0.35, 0, -0.1], [0.08, 0.14, -0.08, 0.05, 0, 0.05, 0.15, 0, -0.04], [0.3, 0.04, -0.02, 0.02, 0, 0.12, 0, 0, 0], [0.55, 0, 0, 0, 0, 0, 0, 0, 0]] },
  // Gölge Oku (Tilki; taban Pistol_Aim → Pistol_Shoot, bırakma u=0): derin nişan, gövde 0,15 rad geri, hafif çömel → u=0..0,03 güçlü geri
  //   tepme (−0,3, kök küçük dönüş) → toparlan
  golgeOk: { cirp: true, k: [[-0.45, 0, 0, 0, 0, 0, 0, 0, 0], [-0.22, -0.12, 0.05, 0, 0, 0, 0, 0.12, 0.05], [-0.03, -0.15, 0.06, 0.02, 0, 0, 0, 0.18, 0.06],
    [0.03, -0.3, 0.02, 0, -0.12, 0, 0, -0.15, 0.12], [0.12, -0.18, 0.02, 0, -0.06, 0, 0, 0, 0.05], [0.4, 0, 0, 0, 0, 0, 0, 0, 0]] },
  // Yıldırım (Ejder; taban Idle_Loop): kollar ve baş göğe kalkar, geri yaslan → u=0 baştan göğe şimşek → u=0,05/0,14/0,23 her düşüşte
  //   omuzlar sarsılır (kısa öne çöküş + nabız) → kollar iner
  yildirim: { cirp: true, k: [[-0.45, 0, 0, 0, 0, 0, 0, 0, 0], [-0.25, -0.1, 0.02, 0.03, 0, 0.5, 1.2, 0, 0.25], [-0.07, -0.22, 0, 0.06, 0, 0.45, 2.3, 0, 0.45],
    [0, -0.26, -0.03, 0.08, 0, 0.5, 2.5, 0, 0.5], [0.05, -0.1, 0.04, 0.02, 0, 0.35, 2.0, 0, 0.32], [0.1, -0.2, 0.01, 0.06, 0, 0.45, 2.3, 0, 0.45],
    [0.14, -0.1, 0.04, 0.02, 0, 0.35, 2.0, 0, 0.32], [0.19, -0.2, 0.01, 0.06, 0, 0.45, 2.3, 0, 0.45], [0.23, -0.1, 0.04, 0.02, 0, 0.35, 2.0, 0, 0.32],
    [0.42, -0.05, 0.01, 0, 0, 0.2, 0.6, 0, 0.1], [0.62, 0, 0, 0, 0, 0, 0, 0, 0]] },
};
const YET_K = new Array(8).fill(0);   // yetenek kanalları (kare başına tek dizi)
const OM_PAY = [0.4, 0.33, 0.27], YURU_RE = /Walk|Jog/;
/** kemiği dünya ekseni etrafında döndürür (aktar sonrası dünya matrisleri güncel olmalı); altını günceller */
function dunyaDon(k, eksenW, aci) {
  if (!k || !aci) return;
  k.getWorldQuaternion(_q1).invert(); _v1.copy(eksenW).applyQuaternion(_q1).normalize();
  k.quaternion.multiply(_q2.setFromAxisAngle(_v1, aci)); k.updateMatrixWorld(true);
}
/** dünya eksenlerinde (_R, _F, _U) üç küçük dönüşü TEK seferde uygular: alt ağaç bir kez güncellenir (canlılık katmanı, kare başına ucuz) */
const _qD = new THREE.Quaternion(), _qW = new THREE.Quaternion();
function dunyaDon3(k, aR, aF, aU) {
  if (!k || (!aR && !aF && !aU)) return;
  _qD.identity();
  if (aR) _qD.multiply(_q2.setFromAxisAngle(_R, aR));
  if (aF) _qD.multiply(_q2.setFromAxisAngle(_F, aF));
  if (aU) _qD.multiply(_q2.setFromAxisAngle(_U, aU));
  k.getWorldQuaternion(_qW);                                   // yerel fark = W⁻¹ · D · W
  _q1.copy(_qW).invert().multiply(_qD).multiply(_qW);
  k.quaternion.multiply(_q1); k.updateMatrixWorld(true);
}
// [t, eğilme (+ileri)] — süreler darbe anına göre ölçeklenir
/** Her kare, aktar(b)'den HEMEN SONRA. dt: görsel dt.
    ops: hareket (bool) | hiz, saldiri ({darbe: klip darbe anı sn (hız ölçekli), menzilli}) — yalnız başladığı karede,
         yetenek (true; bu karede başlat — sahne3d yeteneği olaydan 0,35 sn önce başlatır), vurul (true|güç), olum (bool), zafer (bool) */
export function ikiAyakliGuncelle(d, dt, { hareket = false, hiz = 0, saldiri = null, yetenek = false, vurul = false, olum = false, zafer = false } = {}) {
  if (!d) return; dt = Math.min(0.1, Math.max(0, dt)); d.t += dt;
  const b = d.b, K = d.K;
  if (saldiri) { const dr = typeof saldiri === 'object' ? (saldiri.darbe || 0) : 0.25; d.sal = { t: 0, darbe: dr, menzilli: !!(saldiri && saldiri.menzilli) || dr < 0.08 }; }
  if (yetenek) {
    // hazırlık bütçesi motorun önden gelişiyle sınırlı (ONDE_SN ≈ 0,35–0,4 sn): kalan süre pozun hazırlığından kısaysa hazırlık sıkıştırılır,
    // patlama karesi yine tam patlama anına düşer (poz atlamaz)
    const ad = typeof yetenek === 'object' ? yetenek.ad : null, poz = (ad && YET_POZ[ad]) || null, an = typeof yetenek === 'object' && yetenek.an != null ? yetenek.an : 0.35;
    d.yet = { t: 0, poz, an, olc: poz ? Math.max(1, -poz.k[0][0] / Math.max(0.05, an)) : 1, son: -1 };
  }
  if (vurul) d.vur.v += -14 * (typeof vurul === 'number' ? kirp(vurul, 0.3, 1.3) : 0.8);
  d.agirlik += ((olum ? 0 : 1) - d.agirlik) * Math.min(1, dt * 6);
  const W = d.agirlik; if (W < 0.01) return;
  const yur = hareket || hiz > 0.05 ? 1 : 0; d.w += (yur - d.w) * Math.min(1, dt * 6);
  // Idle klibine hız çeşitliliği (sahne3d oyna() timeScale'i sıfırlıyor, her kare yeniden ver)
  const i = b.isk;
  if (i && i.aktif && i.aktifAd === i.beklemeAd) i.aktif.timeScale = d.idleHiz;
  // gövde eksenleri (dünya)
  b.model.getWorldQuaternion(_q3);
  _F.set(0, 0, 1).applyQuaternion(_q3); _U.set(0, 1, 0); _R.crossVectors(_U, _F).normalize();   // _R: +açı öne eğer
  // eğilme kanalı
  let egil = 0, cirp = 0;
  if (d.sal) {
    const s = d.sal; s.t += dt; const T = s.darbe;
    if (!s.menzilli && T >= 0.1) {
      // hazırlık (geri) → vuruş (ileri) → toparlanma
      if (s.t < T * 0.62) egil = -0.16 * yumusak(s.t / (T * 0.62));
      else if (s.t < T) egil = karis(-0.16, 0.24, cikis3((s.t - T * 0.62) / (T * 0.38)));
      else if (s.t < T + 0.07) egil = 0.24;
      else egil = 0.24 * (1 - yumusak((s.t - T - 0.07) / 0.32));
      if (s.t > T + 0.4) d.sal = null;
    } else {
      // menzilli: atışta küçük geri tepme, ardından öne toparlanma
      const u = s.t - T; egil = u < 0 ? -0.05 * yumusak((s.t) / Math.max(0.05, T)) : -0.12 * Math.exp(-u * 7) * Math.min(1, u * 40) + 0.04 * Math.exp(-u * 4) * (1 - Math.exp(-u * 20));
      if (s.t > T + 0.5) d.sal = null;
    }
    cirp = d.kanat ? 1 : 0;
  }
  const YK = YET_K; let yetVar = false;
  if (d.yet) {
    const y = d.yet; y.t += dt;
    if (y.poz) {
      // kişiye özel poz: patlama karesine göre zaman (u = 0 patlama)
      const u = y.t - y.an, kk = y.poz.k; anahtar(kk, u < 0 ? u * y.olc : u, YK); yetVar = true;
      if (y.son >= 0) { y.son -= dt; const f = yumusak(Math.max(0, y.son) / YET_SON_SURE); for (let j = 0; j < YK.length; j++) YK[j] *= f; if (y.son <= 0) d.yet = null; }   // yürüyüşe geçişte söner
      egil += YK[0]; cirp = d.kanat && y.poz.cirp ? 1 : 0; if (u > kk[kk.length - 1][0]) d.yet = null;
    } else {
      egil += y.t < 0.33 ? -0.14 * yumusak(y.t / 0.33) : y.t < 0.45 ? karis(-0.14, 0.18, cikis3((y.t - 0.33) / 0.12)) : 0.18 * (1 - yumusak((y.t - 0.45) / 0.4));
      cirp = d.kanat ? 1 : 0; if (y.t > 0.9) d.yet = null;
    }
  }
  yay(d.vur, 0, 260, 18, dt); egil += d.vur.x * 0.06;
  // nefes (faz ve hız çeşitliliği)
  const nefes = Math.sin(d.t * PI2 * d.nefesHz) * d.nefesGenlik * (1 - d.w);
  // yürüme salınımı: Walk/Jog klibinin zamanına kilitli (adım başına yalpalama)
  let yurFaz = d.t * 1.5;
  if (i && i.aktif && YURU_RE.test(i.aktifAd || '')) yurFaz = i.aktif.time / i.aktif.getClip().duration;
  const sal = Math.sin(yurFaz * PI2) * d.w;
  // uygula: omurga (eğilme dağıtılır), kalça yalpası, baş dengesi
  const om = d.om, pay = OM_PAY;
  for (let j = 0; j < om.length; j++) dunyaDon(om[j], _R, (egil * pay[j] - nefes * 0.012 + d.egimOfs * pay[j]) * W);
  // kalça yalpası (yuvarlanma + sapma) yalnız gövdeye: uyluklar aynı dünya dönüşüyle geri çevrilir, bacak klipteki gibi kalır ve basan
  // ayak kaymaz (eskiden kalça yuvarlanması 0,6 boyluk bacağın ucunu adım başına ~3 cm yana süründürüyordu)
  if (K.Hips && d.w > 0.01) { const yr = sal * 0.05 * W, ys = sal * 0.06 * W; dunyaDon(K.Hips, _F, yr); dunyaDon(K.Hips, _U, ys);
    for (const k of d.uyluk) { dunyaDon(k, _U, -ys); dunyaDon(k, _F, -yr); } }
  if (K.Spine1 && d.w > 0.01) dunyaDon(K.Spine1, _U, -sal * 0.08 * W);
  if (K.Head) dunyaDon(K.Head, _R, (-egil * 0.35 + nefes * 0.01 + d.basOfs) * W);
  if (yetVar) yetPozUygula(d, YK, W);
  // omuzlar nefesle kalkar
  if (K.LeftShoulder) dunyaDon(K.LeftShoulder, _F, nefes * 0.02 * W);
  if (K.RightShoulder) dunyaDon(K.RightShoulder, _F, -nefes * 0.02 * W);
  // tombul gövdeler: kollar gövde genişliğine göre dışa açılır (kolAci, kişilik tablosundan); ön kol da biraz dışa.
  // İşaret: _F etrafında +açı SOL kolu dışa kaldırır, sağ kolda tersi (yetPozUygula ile aynı). Eski işaret kolları gövdeye gömüyordu:
  // en tombul Kurbağa'da (kolAci 0,36) iki kol ve tokmaklar göbeğin içinde kalıyor, sağ kol sırtta kıpırtısız görünüyordu.
  if (d.kolAci > 0) { const a = d.kolAci * W; if (K.LeftArm) dunyaDon(K.LeftArm, _F, a); if (K.RightArm) dunyaDon(K.RightArm, _F, -a);
    const fa = d.onKolAci; if (K.LeftForeArm) dunyaDon(K.LeftForeArm, _F, fa * a); if (K.RightForeArm) dunyaDon(K.RightForeArm, _F, -fa * a); }
  // kanat çırpma: bekleme ±8° 1,6 Hz, yürüme 2,4 Hz, saldırı/yetenekte geniş ve hızlı; ön kol gecikmeli (dalga)
  if (d.kanat) {
    d.cirpma += (cirp - d.cirpma) * Math.min(1, dt * 5);
    // boşta katlı kanat yalnız nefesle hafifçe açılıp kapanır (0,35 Hz, ±3°); yürümede 1,8 Hz ±10°, çırpışta 2,8 Hz geniş (REFERANS_ANIMASYON
    // 2.3). Kanat ucu (ön kol) kökü yayla izler (3,5 Hz, ζ 0,6): sinüs fazı yerine gerçek gecikme, ağır ve doğal.
    const hz = karis(karis(0.35, 1.8, d.w), 2.8, d.cirpma), gen = karis(karis(0.05, 0.18, d.w), 0.5, d.cirpma);
    d.kFaz = (d.kFaz || d.faz * 9) + dt * hz * PI2;
    const kol = Math.sin(d.kFaz) * gen;
    if (!d.kanatYay) d.kanatYay = { x: 0, v: 0 };
    yayFZ(d.kanatYay, kol * 0.6, karis(2.2, 3.5, Math.max(d.w, d.cirpma)), 0.6, dt); const on = d.kanatYay.x;
    if (K.LeftArm) dunyaDon(K.LeftArm, _F, -kol * W); if (K.RightArm) dunyaDon(K.RightArm, _F, kol * W);
    if (K.LeftForeArm) dunyaDon(K.LeftForeArm, _F, -on * W); if (K.RightForeArm) dunyaDon(K.RightForeArm, _F, on * W);
    // çırpışta gövde hafif kalkar
    if (K.Hips) { K.Hips.position.y += Math.max(0, -Math.cos(d.kFaz)) * 0.006 * d.cirpma * W; K.Hips.updateMatrixWorld(true); }
  }
  canlilik(d, dt, W, zafer);
  d.zafer = zafer;
}
// ── Canlılık katmanı (iki ayaklı; klibin ÜSTÜNE, dünya eksenli küçük dönüşler; kare başına nesne üretmez) ──
// Fidget anahtar kareleri: [t, eğilme(+öne), kolYan(+dışa), kolÖn(+ileri), sağKol(+ileri/yukarı), solKol(+ileri/yukarı), baş(+yukarı), başYaw, gövdeYaw, ön kol bükme]
// Kalça döndürülmez (ayak kaymasın); bakınma baş, boyun ve göğüsle yapılır.
const FID = {
  // etrafa bakma: önce bir yana, sonra öbür yana, gövde de biraz eşlik eder
  bak:   [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0.45, 0, 0, 0, 0, 0, 0.06, 0.55, 0.16, 0], [1.2, 0, 0, 0, 0, 0, 0.02, 0.5, 0.15, 0], [1.6, 0, 0, 0, 0, 0, -0.04, -0.5, -0.14, 0],
          [2.3, 0, 0, 0, 0, 0, -0.02, -0.45, -0.13, 0], [2.8, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
  // gerinme: kollar yukarı-yana açılır, gövde geriye yaslanır, baş kalkar
  gerin: [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0.55, -0.14, 0.75, 0.25, 0.55, 0.55, 0.22, 0, 0, -0.3], [1.25, -0.16, 0.8, 0.3, 0.6, 0.6, 0.25, 0, 0, -0.3],
          [1.7, 0.04, 0.1, 0, 0, 0, -0.05, 0, 0, 0], [2.2, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
  // omuz silkme / güç gösterisi: kollar dışa ve öne pompalanır, gövde öne
  omuz:  [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0.3, 0.1, 0.35, 0.3, 0, 0, -0.06, 0, 0, 0.5], [0.55, 0.02, 0.15, 0.1, 0, 0, 0.05, 0, 0, 0.2], [0.85, 0.12, 0.4, 0.35, 0, 0, -0.06, 0, 0, 0.55],
          [1.3, 0.04, 0.1, 0.05, 0, 0, 0.02, 0, 0, 0.1], [1.7, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
  // kanat germe: iki kanat iki yana tam açılır, iki kez silkelenir
  kanat: [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0.45, -0.08, 1.15, -0.1, 0, 0, 0.12, 0, 0, 0], [0.6, -0.08, 0.9, -0.1, 0, 0, 0.12, 0, 0, 0], [0.75, -0.08, 1.2, -0.1, 0, 0, 0.12, 0, 0, 0],
          [0.9, -0.08, 0.95, -0.1, 0, 0, 0.12, 0, 0, 0], [1.4, 0, 0.1, 0, 0, 0, 0, 0, 0, 0], [1.7, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
  // havada davul (Kurbağa): iki tokmak sırayla göbeğe dört kez iner, baş tempo tutar
  davul: [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0.25, 0.04, 0.1, 0, 0.75, 0.25, 0.06, 0, 0, 1.0], [0.4, 0.06, 0.1, 0, 0.3, 0.75, -0.04, 0, 0, 0.7],
          [0.55, 0.04, 0.1, 0, 0.75, 0.3, 0.06, 0, 0, 1.0], [0.7, 0.06, 0.1, 0, 0.3, 0.75, -0.04, 0, 0, 0.7], [0.85, 0.04, 0.1, 0, 0.8, 0.3, 0.08, 0.2, 0.06, 1.0],
          [1.0, 0.08, 0.1, 0, 0.25, 0.8, -0.06, 0.2, 0.06, 0.7], [1.5, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
  // silah çevirme (Tilki): sağ el öne kalkar, bilek çevrilir (ön kol bükme salınımı), göğüs hafif döner
  silah: [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0.35, 0, 0, 0, 0.8, 0, 0.04, -0.2, -0.1, 0.9], [0.55, 0, 0, 0, 0.85, 0, 0.04, -0.2, -0.1, 0.3], [0.75, 0, 0, 0, 0.8, 0, 0.04, -0.2, -0.1, 0.9],
          [0.95, 0, 0, 0, 0.85, 0, 0.04, -0.2, -0.1, 0.3], [1.5, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
};
const FID_VARSAYILAN = ['bak', 'gerin'];
// davul saldırısı: [hazır kol öne, vuruşta kol öne, hazır dirsek, vuruşta dirsek, sol kol içe, sağ kol içe (davul solda: sağ el gövdeyi çaprazlar), ön kol içe]
const DAVUL_P = [0.36, 0.5, 0.85, 0.6, 0.35, 0.6, 0.5];
const FID_K = new Array(9).fill(0);
// tokmak eğrisi (x: vuruş anına göre sn): 0,15 sn kalkış (1) → 0,05 sn hızla iniş, davula çarpıp geçer (−0,35) → 0,22 sn'de hazır duruşa
function davulVur(x) { return x < -0.2 ? 0 : x < -0.05 ? yumusak((x + 0.2) / 0.15) : x < 0 ? karis(1, -0.35, cikis3(x / 0.05 + 1)) : -0.35 * (1 - yumusak(x / 0.22)); }
function canlilik(d, dt, W, zafer) {
  const b = d.b, K = d.K, i = b.isk, ad = (i && i.aktifAd) || '';
  // boşta ağırlığı: yürüme, saldırı, yetenek ve zaferde söner
  const bosHedef = (d.sal || d.yet || zafer) ? 0 : 1 - d.w;
  d.bosW += (bosHedef - d.bosW) * Math.min(1, dt * 3); const B = d.bosW * W;
  let solOn = 0, sagOn = 0, solYan = 0, sagYan = 0, solDirsek = 0, sagDirsek = 0, basYaw = 0, basPit = 0, gYaw = 0, gYan = 0, egil = 0, sagIc = 0, solIc = 0, solOnIc = 0, sagOnIc = 0;
  if (B > 0.01) {
    // ağırlık aktarma: üst gövde yavaşça iki yana salınır (kalça sabit: ayak kaymaz), baş ters yönde dengeler
    const s = Math.sin(d.t * PI2 * d.agirlikHz + d.faz * 6.1);
    gYan += s * 0.035 * B;
    // bakınma: yavaş gürültü + ara sıra kısa bakış (her birimin kendi fazı)
    basYaw += (gurultu(d.t * 0.19 + d.faz * 37) * 0.3 + gurultu(d.t * 0.7 + d.faz * 13) * 0.05) * B;
    basPit += gurultu(d.t * 0.15 + d.faz * 11) * 0.07 * B;
    // kollar nefesle hafifçe ileri-geri ve dışa (sol/sağ farklı fazda): klip kolları kıpırtısız tutsa da uzuv donuk durmaz
    const n1 = Math.sin(d.t * PI2 * d.nefesHz + 0.7), n2 = Math.sin(d.t * PI2 * d.nefesHz * 0.93 + 2.3);
    solOn += n1 * 0.1 * B; sagOn += n2 * 0.105 * B; solYan += (0.5 + 0.5 * n1) * 0.06 * B; sagYan += (0.5 + 0.5 * n2) * 0.065 * B;
    // ön kol üst kolu yay-sönümleyiciyle gecikerek izler (0,9 Hz, ζ 0,55: ağır, sarkaç gibi; eşzamanlı sinüs değil)
    const DY = d.dirsekYay; yayFZ(DY[0], n1 * 0.13, 0.9, 0.55, dt); yayFZ(DY[1], n2 * 0.14, 0.9, 0.55, dt);
    solDirsek += DY[0].x * B; sagDirsek += DY[1].x * B;
    // kişiye özel boşta el hareketi: 'tempo' (Kurbağa) — sağ tokmak 1,9 sn'de bir uyluğa tempo vurur, sol tokmak yarım vuruş sonra
    // davula hafifçe dokunur; vuruşta baş tempo tutar. Uzun beklemede (vitrin) tokmaklı kollar hiç donuk kalmaz.
    if (d.bosStil === 'tempo') {
      const P = 1.9, x = (d.t + d.faz * 3) % P, v1 = davulVur(x - 0.6), v2 = davulVur(x - 1.15) * 0.75;
      sagDirsek += 0.34 * v1 * B; sagOn += 0.1 * v1 * B; solDirsek += 0.24 * v2 * B; solOn += 0.06 * v2 * B;
      basPit += (Math.min(0, v1) * 0.06 + Math.min(0, v2) * 0.04) * B;
    } else if (d.bosStil === 'asa') {
      // 'asa' (Baykuş): sağ elde tutulan asa 3,4 sn'de bir yavaşça kalkar (0,7 sn), kısa tutulur ve yere hafifçe vurulur; baş vuruşa eğilir
      const P = 3.4, x = (d.t + d.faz * 5) % P;
      const v = x < 0.7 ? yumusak(x / 0.7) : x < 1.0 ? 1 : x < 1.12 ? karis(1, -0.25, cikis3((x - 1.0) / 0.12)) : x < 1.6 ? -0.25 * (1 - yumusak((x - 1.12) / 0.48)) : 0;
      sagOn += 0.12 * v * B; sagDirsek += 0.2 * v * B; sagYan += 0.04 * v * B; basPit += Math.min(0, v) * 0.12 * B;
    }
    // kişilik fidget'ı: yalnız sakin beklemede (sahne3d 'ara' klibi oynarken değil)
    if (!d.fid) { if (d.bosW > 0.9 && b.durum === 'bekle') { d.fidT -= dt; if (d.fidT <= 0) { const l = d.fidTur; d.fid = { t: 0, k: FID[l[d.fidSira++ % l.length]] || FID.bak }; } } }
  }
  if (d.fid) {
    const f = d.fid; f.t += dt; anahtar(f.k, f.t, FID_K); const fw = W * Math.min(1, d.bosW * 1.2);
    egil += FID_K[0] * fw; solYan += FID_K[1] * fw; sagYan += FID_K[1] * fw; solOn += (FID_K[2] + FID_K[4]) * fw; sagOn += (FID_K[2] + FID_K[3]) * fw;
    basPit += FID_K[5] * fw; basYaw += FID_K[6] * fw; gYaw += FID_K[7] * fw;
    // ön kol bükme yalnız o kol kalkıyorsa (Tilki'nin silah çevirmesinde sol kol sakin kalır)
    if (FID_K[2] + FID_K[4] > 0.05 || FID_K[1] > 0.05) solDirsek += FID_K[8] * fw; if (FID_K[2] + FID_K[3] > 0.05 || FID_K[1] > 0.05) sagDirsek += FID_K[8] * fw;
    if (f.t > f.k[f.k.length - 1][0] || d.bosW < 0.3) { d.fid = null; d.fidT = 6 + ozet(d.faz * 7 + d.fidSira * 1.37) * 6; }
  }
  // saldırı: gövde dönüşü (yakın dövüş) — hazırlıkta sağ omuz geri, vuruşta öne; menzilli tek kollu büyüde tutan kol bırakmada ileri itilir
  if (d.sal) {
    const s = d.sal, T = s.darbe;
    if (d.salStil === 'davul') {
      // Davulcu Kurbağa: iki tokmakla göbek davulu — sol tokmak ön vuruş (T − 0,2), sağ tokmak asıl vuruş (T, mermi çıkışı);
      // kollar 'hazır' duruşuna gelir (tokmaklar davul hizasında), her vuruşta tokmak kalkar ve hızla iner
      const hz = yumusak(s.t / Math.max(0.08, Math.min(0.3, T))) * (1 - yumusak((s.t - T - 0.3) / 0.25));
      const vL = davulVur(s.t - (T - 0.2)), vR = davulVur(s.t - T);
      const P = DAVUL_P;
      solOn += (P[0] + P[1] * vL) * hz; sagOn += (P[0] + P[1] * vR) * hz; solDirsek += (P[2] + P[3] * vL) * hz; sagDirsek += (P[2] + P[3] * vR) * hz;
      solIc += P[4] * hz; sagIc += P[5] * hz; solOnIc += P[6] * hz; sagOnIc += P[6] * hz; basPit += (-0.04 * vR - 0.03 * vL) * hz; egil += 0.04 * hz;
    } else if (!s.menzilli && T >= 0.1) {
      gYaw += s.t < T * 0.62 ? -0.2 * yumusak(s.t / (T * 0.62)) : s.t < T ? karis(-0.2, 0.16, cikis3((s.t - T * 0.62) / (T * 0.38))) : 0.16 * (1 - yumusak((s.t - T) / 0.35));
    } else if (d.tekKol) {
      const x = s.t - T;
      const it = x < 0 ? -0.1 * yumusak(s.t / Math.max(0.05, T)) : 0.42 * Math.exp(-x * 8) * Math.min(1, x * 30);
      sagOn += it; sagDirsek -= it * 0.6; gYaw += x < 0 ? -0.05 * yumusak(s.t / Math.max(0.05, T)) : 0.08 * Math.exp(-x * 6);
      if (x < 0) { sagYan += Math.sin(d.t * 23) * 0.025; }   // büyüyü tutarken elde enerji titremesi
    }
  }
  // tek kollu büyü kliplerinde (Spell_Simple_*) tutan kol hazırlıkta da tam donmasın: küçük kavis
  if (d.tekKol && !d.sal && /^Spell_Simple/.test(ad)) sagOn += Math.sin(d.t * 5.5) * 0.05 * W;
  // zafer: Yes klibi yalnız sol kolu pompalar; sağ kol da zıplamayla aynı tempoda havaya kalkar
  if (zafer && ad === 'Yes') { const P = 0.78, f = (d.t % P) / P; const p = 0.5 + 0.5 * Math.sin(PI2 * f - 1.2); sagOn += (1.5 + 0.45 * p) * W; sagYan += 0.25 * W; sagDirsek += (0.6 + 0.4 * p) * W; }
  // uygula: omurga (eğilme, yan salınım, dönüş), baş, kollar
  const om = d.om;
  if (egil || gYan || gYaw) for (let j = 0; j < om.length; j++) { const p = OM_PAY[j]; dunyaDon3(om[j], egil * p * W, gYan * p * (j === 0 ? 1 : 0.5), gYaw * p); }
  if (K.Neck && basYaw) dunyaDon(K.Neck, _U, basYaw * 0.4);
  if (K.Head) dunyaDon3(K.Head, -basPit, -gYan * 0.8, basYaw * 0.6);
  // kollar: _R etrafında −açı öne kaldırır (yetPozUygula ile aynı işaret); _F etrafında sol için + dışa, sağ için − dışa
  if (K.LeftArm) dunyaDon3(K.LeftArm, -solOn, solYan - solIc, 0);
  if (K.RightArm) dunyaDon3(K.RightArm, -sagOn, -(sagYan - sagIc), 0);
  if (K.LeftForeArm) dunyaDon3(K.LeftForeArm, -solDirsek, -solOnIc * d.kolAci * d.onKolAci, 0);
  if (K.RightForeArm) dunyaDon3(K.RightForeArm, -sagDirsek, sagOnIc * d.kolAci * d.onKolAci, 0);
}
// yetenek pozunun omurga dışı kanalları: dönüş, çömelme (diz bükülür, ayak yerde kalır), ölçek nabzı, kollar, baş
function yetPozUygula(d, YK, W) {
  const b = d.b, K = d.K, cok = YK[1] * W, nabiz = YK[2] * W, don = YK[3] * W, kolYan = YK[4] * W, kolOn = YK[5] * W, sag = YK[6] * W, bas = YK[7] * W;
  if (don && K.Hips) dunyaDon(K.Hips, _U, don);
  // çömelme: gövde boy × cok kadar iner; kalça-diz-ayak bileği, ayak kalçanın altında kalacak açıyla bükülür (2L(1−cos a) = iniş)
  if (Math.abs(cok) > 1e-4) {
    const boy = b.kok.userData.vfxBoy || 1.3, s = b.kok.scale.y || 1, inis = cok * boy;
    if (!d.bacakL && K.LeftUpLeg && K.LeftLeg) { K.LeftUpLeg.getWorldPosition(_v1); K.LeftLeg.getWorldPosition(_v2); d.bacakL = Math.max(0.05, _v1.distanceTo(_v2) / s); }
    b.govde.position.y -= inis / s;
    if (inis > 0 && d.bacakL) {
      const a = Math.acos(kirp(1 - inis / s / (2 * d.bacakL), -1, 1));
      dunyaDon(K.LeftUpLeg, _R, -a); dunyaDon(K.RightUpLeg, _R, -a); dunyaDon(K.LeftLeg, _R, 2 * a); dunyaDon(K.RightLeg, _R, 2 * a);
      dunyaDon(K.LeftFoot, _R, -a); dunyaDon(K.RightFoot, _R, -a);
    }
  }
  if (nabiz) b.govde.scale.multiplyScalar(1 + nabiz);
  // _R gövdenin SOL yanıdır (U×F); ileri eksende +açı sol kolu dışa kaldırır, sağ kolda tersi (eski işaret kolları gövdeye çaprazlıyordu)
  if (kolYan) { if (K.LeftArm) dunyaDon(K.LeftArm, _F, kolYan); if (K.RightArm) dunyaDon(K.RightArm, _F, -kolYan); }
  if (kolOn) { if (K.LeftArm) dunyaDon(K.LeftArm, _R, -kolOn); if (K.RightArm) dunyaDon(K.RightArm, _R, -kolOn);
    if (K.LeftForeArm) dunyaDon(K.LeftForeArm, _R, -0.35 * kolOn); if (K.RightForeArm) dunyaDon(K.RightForeArm, _R, -0.35 * kolOn); }
  if (sag && K.RightArm) { dunyaDon(K.RightArm, _R, -sag); if (K.RightForeArm) dunyaDon(K.RightForeArm, _R, -0.3 * sag); }
  if (bas && K.Head) dunyaDon(K.Head, _R, -bas);
}
const YET_SON_SURE = 0.15;
/** iki ayaklının kişiye özel yetenek pozunu YET_SON_SURE içinde söndürür (sahne3d: patlamadan sonra birim yürümeye başladı) */
export function yetPozSondur(d) { if (d && d.yet && d.yet.poz && d.yet.son < 0) d.yet.son = YET_SON_SURE; }
/** yetenek pozu var mı (sahne3d: yetenek dizisinin uzunluğu bu pozla belirlenir) */
export function yetPozVar(ad) { return !!YET_POZ[ad]; }
