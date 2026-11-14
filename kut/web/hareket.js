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
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _v4 = new THREE.Vector3();
const _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q3 = new THREE.Quaternion();
const _m1 = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _m3 = new THREE.Matrix4();
const YUKARI = new THREE.Vector3(0, 1, 0);

// ───────────────────────── malzeme yaması: parlama + çözülme ─────────────────────────
// Her birimin malzemeleri BİR KEZ klonlanır (his.hazirla). Program önbellek anahtarı sabit olduğu için
// bütün birimler aynı gölgelendirici programını paylaşır: derleme savaş kurulumunda bir kez olur.
const YAMA_ANAHTAR = 'kutHis1';
function malzemeYamala(m, u) {
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vKutP;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvKutP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vKutP; uniform float uKutFlas; uniform vec3 uKutFlasRenk; uniform float uKutCoz; uniform vec3 uKutCozRenk; uniform vec2 uKutBoy;
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
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
if (uKutFlas > 0.0) { float kutR = 1.0 - abs(dot(normalize(normal), normalize(vViewPosition))); totalEmissiveRadiance += uKutFlasRenk * uKutFlas * (0.45 + 0.9 * kutR * kutR); }
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
const H = {
  kamera: null, sahne: null, kalite: 'yuksek', kul: null, dinleyici: {},
  donma: 0, donmaSoguma: 0,                   // hit-stop
  yavas: { kalan: 0, sure: 0, oran: 1 },       // yavaşlatma
  travma: 0, travmaSonum: 2.5, tekme: { x: 0, v: 0 }, tekmeYon: new THREE.Vector3(), tohum: Math.random() * 100, sarsT: 0,
  zoom: { t: 0, sure: 0, oran: 0, hedef: new THREE.Vector3(), aktif: false, soguma: 0 },
  kayit: { p: new THREE.Vector3(), q: new THREE.Quaternion(), fov: 0, var: false },
  birimler: new Set(), girisSon: 0, girisBekle: true, zaman: 0,
};
function olayYay(ad, veri) { const f = H.dinleyici[ad]; if (f) f(veri); }
function bh(b) {   // birimin his durumu
  if (!b._his) {
    b._his = { geri: { x: 0, v: 0 }, ezil: { x: 0, v: 0 }, egil: { x: 0, v: 0 }, yon: new THREE.Vector3(0, 0, 1), flas: 0, flasRenk: new THREE.Color(1, 1, 1),
      atil: null, giris: null, olum: null, zafer: null, uni: null, bosta: false, donma: 0 };
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
    for (const b of H.birimler) { const s = b._his; if (s) { s.atil = s.giris = s.olum = s.zafer = null; s.geri.x = s.geri.v = s.ezil.x = s.ezil.v = s.egil.x = s.egil.v = 0; s.flas = 0; if (s.uni) { s.uni.uKutFlas.value = 0; s.uni.uKutCoz.value = 0; } } }
    H.birimler.clear(); H.donma = H.donmaSoguma = 0; H.yavas.kalan = 0; H.travma = 0; H.tekme.x = H.tekme.v = 0; H.zoom.aktif = false; H.girisSon = 0; H.zaman = 0;
  },
  /** Birim malzemelerini yamalar (parlama + çözülme). birimKur sonunda bir kez çağır; çağrılmazsa ilk ihtiyaçta kendisi yapar. */
  hazirla(b) {
    const s = bh(b); if (s.uni) return s.uni;
    const u = { uKutFlas: { value: 0 }, uKutFlasRenk: { value: s.flasRenk }, uKutCoz: { value: 0 }, uKutCozRenk: { value: new THREE.Color('#ff9a2e') }, uKutBoy: { value: new THREE.Vector2(0, 1.4) } };
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
    return { dtGorsel, olcek, donuk: H.donma > 0 };
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
    const z = H.zoom; if (z.aktif && z.oran > oran && z.t < z.sure * 0.6) return;
    z.hedef.copy(hedefPos); z.sure = Math.max(0.2, sure); z.t = 0; z.oran = oran; z.aktif = true; z.soguma = sure + 1.2;
  },
  /** Hit-stop: görüntüyü sure sn dondurur (40–90 ms önerilir) */
  durdur(sure = 0.06) { if (H.donmaSoguma > 0) return; H.donma = Math.max(H.donma, Math.min(0.12, sure)); H.donmaSoguma = sure + 0.18; olayYay('donma', { sure }); },
  /** Yavaşlatma (Kut: 0,25 sn %30 hız) */
  yavaslat(sure = 0.25, oran = 0.3) { H.yavas.kalan = sure; H.yavas.sure = sure; H.yavas.oran = oran; },
  /** Kut kısa yolu: yavaşlatma + yakınlaştırma + hafif sarsıntı + altın parlama */
  kut(b) { his.yavaslat(0.25, 0.3); if (b) { b.kok.getWorldPosition(_v3); _v3.y += 0.6; his.yakinlastir(_v3, 1.0, { oran: 0.1 }); const s = bh(b); his.hazirla(b); s.flasRenk.set('#ffd27a'); s.flas = 1.2; } his.sarsinti(0.22, 0.3); },

  /** Darbe tepkisi. yon: dünya Vector3 (saldırgandan hedefe); guc 0..1 (his.hasarGucu ile). Geri savrulma + sıkış-uz + beyaz parlama;
      guc ≥ 0,45'te hit-stop, ≥ 0,6'da kamera sarsıntısı. */
  darbe(b, yon, guc = 0.4, { k = null, kuresel = false } = {}) {
    if (!b) return; const s = bh(b); his.hazirla(b); guc = kirp(guc, 0, 1.3);
    if (s.olum) return;
    if (yon) yerelYon(b, yon, s.yon);
    const o = 1 / kokOlcek(b);
    s.geri.v += (2.2 + 3.0 * guc) * o;        // yerel birim/sn itme (her vuruş görünür savrulma)
    s.ezil.v -= 1.8 + 2.6 * guc;              // sıkış
    s.egil.v += 3.0 + 4.0 * guc;              // tepesi vuruş yönüne savrulur
    s.flasRenk.set(1, 1, 1); s.flas = 0.8 + 0.5 * guc;
    // yerel hit-stop: yalnız vuran ve vurulan donar (sahnenin geri kalanı akar); küresel durdurma yalnız öldüren/kritik vuruşta
    const fr = 0.05 + 0.04 * kirp((guc - 0.3) / 0.7);
    his.donma(b, fr); if (k && k !== b) his.donma(k, fr * 0.9);
    if (kuresel) his.durdur(0.06 + 0.04 * kirp(guc - 0.6));
    if (guc >= 0.65) his.sarsinti(0.1 + 0.22 * guc, 0.26, yon);
  },
  /** Birim başına hit-stop: birimin tepkileri ve (sahne3d'de) animasyonu sure sn donar; parlama ve sarsıntı gerçek zamanda sürer */
  donma(b, sure = 0.06) { if (!b) return; const s = bh(b); s.donma = Math.max(s.donma || 0, Math.min(0.12, sure)); },
  /** birim şu an donuk mu (sahne3d karışıcı/kodlu hareket dt'sini 0'lar) */
  donuk(b) { return !!(b && b._his && b._his.donma > 0); },
  /** hasar sayısını darbe gücüne çevirir: taban 0,3 (her vuruş hissedilir), 220 hasarda tam güç; yetenekte daha güçlü */
  hasarGucu(n, { buyuk = false } = {}) { return (0.3 + 0.7 * kirp((n - 20) / 200)) * (buyuk ? 1.25 : 1); },

  /** Yakın dövüş atılması: darbe karesine kadar hedefe doğru mesafe (hücre) kadar gövde ofseti, sonra geri döner.
      sure: saldırının başından darbeye kadar geçen sn (klip darbe anı / hız). Motor konumuna dokunmaz. */
  atil(b, hedefPos, sure = 0.3, { mesafe = 0.3, donus = 0.28, temas = 0.58 } = {}) {
    if (!b || !hedefPos) return; const s = bh(b); if (s.olum) return;
    b.kok.getWorldPosition(_v1); _v2.copy(hedefPos).sub(_v1);
    const uz = Math.hypot(_v2.x, _v2.z);
    const d = Math.min(mesafe, Math.max(0, uz - temas * 0.95)) / kokOlcek(b);   // hedefin içine girme: iki gövde yarıçapı kadar dur
    s.atil = { t: 0, sure: Math.max(0.08, sure), donus, d, yon: yerelYon(b, _v2, new THREE.Vector3()), vurdu: false };
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
    if (!b) return; const s = bh(b); his.hazirla(b);
    tur = tur || (b.gor && b.gor.tur) || 'iki';
    const z = tur === 'iki' ? { carp: 1.33, coz: 1.75, sure: 0.75 } : tur === 'yilan' ? { carp: 0.5, coz: 1.05, sure: 0.7 } : { carp: 0.6, coz: 1.1, sure: 0.7 };
    s.olum = { t: 0, ...z, toz: false, bitti: false };
    s.atil = null; s.zafer = null;
    b.kok.getWorldPosition(_v1); s.uni.uKutBoy.value.set(_v1.y, 1.35 * kokOlcek(b));
    if (yakinlastir) { _v1.y += 0.5; his.yakinlastir(_v1, 1.4, { oran: 0.1 }); }
  },
  /** Diriliş (Anka): çözülmeyi geri al, görünür yap */
  dirilis(b) { if (!b) return; const s = bh(b); s.olum = null; if (s.uni) s.uni.uKutCoz.value = 0; b.govde.visible = true; s.ezil.v -= 3; s.flasRenk.set('#ffb070'); s.flas = 1.2; },
  /** Zafer: yaşayan birim sevinçle zıplar (iki ayaklıda Dance_Loop ile birlikte) */
  zafer(b) { if (!b) return; const s = bh(b); if (s.olum) return; s.zafer = { t: -((b.uid || 0) * 0.137 % 0.5) }; },
  /** hata ayıklama */
  _durum: H,
};

function birimGuncelle(b, dt, dtR) {
  const s = b._his; if (!s) return;
  if (s.donma > 0) { s.donma -= dtR; dt = 0; }   // yerel hit-stop: yaylar ve atılma donar
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
    else if (a.t < T + 0.06) x = a.d;                                                         // temas
    else x = a.d * (1 - cikis3((a.t - T - 0.06) / a.donus));
    if (!a.vurdu && a.t >= T) { a.vurdu = true; s.ezil.v -= 2.0; }
    ox += a.yon.x * x; oz += a.yon.z * x;
    ileriEgil = 0.2 * x / Math.max(1e-4, a.d);
    if (a.t >= T + 0.06 + a.donus) s.atil = null;
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
    const z = s.zafer; z.t += dt; const P = 0.78, f = ((z.t % P) + P) % P / P;
    if (z.t > 0) {
      if (f < 0.18) ezil += -0.16 * Math.sin(Math.PI * f / 0.18);                       // çömel
      else if (f < 0.72) { const u = (f - 0.18) / 0.54; oy += 4 * 0.32 * o * u * (1 - u); ezil += 0.1 * Math.sin(Math.PI * u); }  // havada uzar
      else ezil += -0.14 * Math.sin(Math.PI * (f - 0.72) / 0.28);                      // iniş
    }
  }
  // parlama (gerçek zaman)
  if (s.flas > 0) { s.flas = Math.max(0, s.flas - dtR / 0.13); }
  if (s.uni) s.uni.uKutFlas.value = s.flas > 0 ? Math.min(1.2, s.flas) : 0;
  // gövdeye yaz (ayak tabanı merkezli ölçek: model tabanı govde başlangıcında)
  const gv = b.govde;
  gv.position.set(ox, oy, oz);
  ezil = kirp(ezil, -0.45, 0.4);
  const sy = 1 + ezil, sxz = 1 / Math.sqrt(Math.max(0.3, sy));
  gv.scale.set(sxz, sy, sxz);
  // eğilme: vuruşta tepe vuruş yönüne, atılmada ileri
  const ex = s.yon, ay = s._ay || ex;
  const ax1 = ex.z, az1 = -ex.x;                       // YUKARI × yon (yatay eksen)
  const ax2 = ay.z, az2 = -ay.x;
  _v1.set(ax1 * egil + ax2 * ileriEgil, 0, az1 * egil + az2 * ileriEgil);
  const aci = _v1.length();
  if (aci > 1e-5) gv.quaternion.setFromAxisAngle(_v1.divideScalar(aci), aci); else gv.quaternion.identity();
}

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
const STIL = { kurt: { saldir: 'isir', yetenek: 'ulu' }, koc: { saldir: 'tosla', yetenek: 'sahlan' }, bulutat: { saldir: 'tosla', yetenek: 'sahlan' },
  kaplumbaga: { saldir: 'isir', yetenek: 'uzan' }, semender: { saldir: 'isir', yetenek: 'don' } };

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
    sal: null, yet: null, vur: null, olum: null, zafer: false, olumYon: ozet(faz * 91) > 0.5 ? 1 : -1, kanal: new Array(8).fill(0),
  };
  return d;
}

// saldırı / yetenek anahtar kareleri: [t, ileri(H), yük(H), eğim(rad,+burun yukarı), boyun, baş, önAyakKopuk(0..1)]
const DA = {
  // hazırlık (geri çekil) → 0,12–0,22 tut → 0,04 sn ani atılma (darbe 0,26) → toparlan
  isir:  [[0, 0, 0, 0, 0, 0, 0], [0.12, -0.1, -0.045, 0.1, 0.36, 0.16, 0], [0.22, -0.11, -0.05, 0.11, 0.4, 0.18, 0], [0.26, 0.17, -0.015, -0.1, -0.36, -0.38, 0], [0.33, 0.14, -0.015, -0.08, -0.3, -0.32, 0], [0.6, 0, 0, 0, 0, 0, 0]],
  tosla: [[0, 0, 0, 0, 0, 0, 0], [0.12, -0.12, -0.055, 0.08, 0.24, -0.22, 0], [0.22, -0.13, -0.06, 0.09, 0.26, -0.24, 0], [0.26, 0.21, -0.02, -0.14, -0.42, -0.32, 0], [0.34, 0.17, -0.02, -0.11, -0.36, -0.27, 0], [0.64, 0, 0, 0, 0, 0, 0]],
  ulu:   [[0, 0, 0, 0, 0, 0, 0], [0.25, -0.05, -0.07, 0.2, 0.7, 0.3, 0], [0.85, -0.05, -0.07, 0.22, 0.78, 0.36, 0], [1.15, 0, 0, 0, 0, 0, 0]],
  sahlan:[[0, 0, 0, 0, 0, 0, 0], [0.12, -0.03, 0, 0.3, -0.05, 0.1, 1], [0.27, -0.05, 0, 0.62, -0.25, 0.25, 1], [0.34, -0.04, 0, 0.6, -0.2, 0.2, 1], [0.4, 0.07, -0.03, -0.07, -0.3, -0.25, 0], [0.72, 0, 0, 0, 0, 0, 0]],
  uzan:  [[0, 0, 0, 0, 0, 0, 0], [0.2, 0.05, -0.02, -0.05, -0.45, 0.3, 0], [0.6, 0.06, -0.02, -0.05, -0.5, 0.34, 0], [0.85, 0, 0, 0, 0, 0, 0]],
  don:   [[0, 0, 0, 0, 0, 0, 0], [0.1, 0, 0.03, 0.05, 0.1, 0, 0], [0.5, 0, 0.03, 0.05, 0.1, 0, 0], [0.62, 0, 0, 0, 0, 0, 0]],
};
export const DA_DARBE = { isir: 0.26, tosla: 0.26 };
export const YILAN_DARBE = 0.28;
const DA_YERVUR = { sahlan: 0.4 };

/** Her kare (aktar yerine). dt: görsel dt (dtGorsel × hizKati).
    ops: hiz (hücre/sn, birimin o anki görsel hızı), saldiri (true: bu karede başlat — darbe 0,15 sn sonra), yetenek (true | stil adı),
         vurul (true | güç 0..1), olum (ölüyken sürekli true; false'a dönerse diriliş), zafer (bool), bakis (rad, hedefe göre baş sapması)
    Döner: {olay: 'darbe' | 'yerVur' | 'devrildi' | null} */
export function dortAyakliGuncelle(d, dt, { hiz = 0, saldiri = false, yetenek = false, vurul = false, olum = false, zafer = false, bakis = 0 } = {}) {
  if (!d) return { olay: null };
  let olay = null; dt = Math.min(0.1, Math.max(0, dt)); d.t += dt;
  const { veri, f, u, n, Hy } = d;
  // tetikleyiciler
  if (olum && !d.olum) { d.olum = { t: 0 }; d.sal = d.yet = null; }
  if (!olum && d.olum) { d.olum = null; }
  if (!d.olum) {
    if (saldiri) d.sal = { t: 0, a: DA[d.stil.saldir] || DA.isir, darbe: DA_DARBE[d.stil.saldir] || 0.26, oldu: false };
    if (yetenek) { const st = typeof yetenek === 'string' ? yetenek : d.stil.yetenek; d.yet = { t: 0, st, a: DA[st] || DA.tosla, oldu: false }; d.sal = null; }
    if (vurul) d.vur = { t: 0, g: typeof vurul === 'number' ? kirp(vurul, 0.2, 1.2) : 0.7 };
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
  if (d.sal) { const s = d.sal; s.t += dt; anahtar(s.a, s.t, k); if (!s.oldu && s.t >= s.darbe) { s.oldu = true; olay = 'darbe'; } if (s.t > s.a[s.a.length - 1][0]) d.sal = null; }
  if (d.yet) {
    const y = d.yet; y.t += dt; anahtar(y.a, y.t, k); pivotArka = y.st === 'sahlan' || y.st === 'ulu';
    if (y.st === 'ulu' && y.t > 0.25 && y.t < 0.85) k[4] += Math.sin(y.t * 38) * 0.035;            // uluma titreşimi
    if (y.st === 'don') donY = PI2 * cikis3((y.t - 0.05) / 0.45) * (y.t > 0.05 ? 1 : 0);
    if (DA_YERVUR[y.st] && !y.oldu && y.t >= DA_YERVUR[y.st]) { y.oldu = true; olay = 'yerVur'; }
    if (y.t > y.a[y.a.length - 1][0]) d.yet = null;
  }
  let ileri = k[0] * Hy, yuk = k[1] * Hy, egim = k[2], boyunA = k[3], basA = k[4], kopuk = k[5], yalpa = 0, yanal = 0;
  // vurulma: geri sarsılma + baş irkilmesi
  if (d.vur) { const v = d.vur; v.t += dt; const e = Math.exp(-v.t * 10) * v.g; ileri -= 0.1 * Hy * e * Math.min(1, v.t * 30); yanal += Math.sin(v.t * 75) * 0.02 * Hy * e; egim += 0.08 * e; boyunA += 0.3 * e; yalpa += Math.sin(v.t * 60) * 0.05 * e; if (v.t > 0.5) d.vur = null; }
  // yürüyüş: inip kalkma (adım başına 2), yalpalama, hafif öne eğilme
  // tırısta gövde basma ortasında en yüksek (ters sarkaç), uçlarda alçak; yürürken hafif çömelir (bacaklara erişim payı)
  const bob = Math.cos(PI2 * 2 * (ph - DUTY / 2)) * (0.022 + 0.03 * dortnal) * Hy * w;
  yuk += bob - d.comel * w; yalpa += Math.sin(PI2 * ph) * 0.045 * w; egim += (-0.03 - 0.06 * dortnal) * w + Math.sin(PI2 * 2 * ph) * (0.015 + 0.04 * dortnal) * w;
  // bekleme: nefes
  const nefes = Math.sin(d.t * PI2 * 0.38); yuk += nefes * 0.006 * Hy * (1 - w); boyunA += nefes * 0.03 * (1 - w);
  // baş dengeleme: gövde eğimine ve inip kalkmaya karşı
  boyunA += -egim * 0.55 - (bob / Hy) * 1.6;
  if (d.zafer) { boyunA += 0.25; basA += 0.1 + Math.sin(d.t * 9) * 0.06; }
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
  _m3.makeTranslation(f.x * ileri + d.lat.x * yanal, yuk, f.z * ileri + d.lat.z * yanal); _m2.premultiply(_m3);
  const Mx = _m3.multiplyMatrices(_m2, d.m0.M);
  Mx.decompose(d.model.position, d.model.quaternion, d.model.scale);
  // 2) eksen kemikleri: dinlenmeye döndür, boyun/baş/kuyruk dönüşleri
  for (const kk of d.kullan) kk.quaternion.copy(veri.get(kk).q);
  const nb = d.boyun.length;
  if (nb) {
    let topW = 0; d.boyun.forEach((b) => (topW += b.w));
    d.boyun.forEach((b, i) => {
      const v = veri.get(b.k), oran = b.w / topW, sonYari = i >= nb / 2;
      const a = boyunA * oran * (sonYari ? 0.6 : 1.4) + (sonYari ? basA * b.w / Math.max(1e-3, d.boyun.slice(Math.ceil(nb / 2)).reduce((s, x) => s + x.w, 0)) : 0);
      b.k.quaternion.multiply(_q1.setFromAxisAngle(v.en, a));
      if (bakis) b.k.quaternion.multiply(_q1.setFromAxisAngle(v.eu, kirp(bakis, -0.6, 0.6) * oran));
      if (d.surungen && w > 0.01) b.k.quaternion.multiply(_q1.setFromAxisAngle(v.eu, Math.sin(PI2 * ph - i * 0.7) * 0.18 * w));
    });
  }
  // kuyruk: gecikmeli salınım + gövde inişine yay tepkisi
  const bobHiz = (bob - d.bobOnce) / Math.max(1e-4, dt); d.bobOnce = bob;
  yay(d.kuyrukYay, kirp(-bobHiz / Hy * 0.5, -0.6, 0.6) + (d.sal ? -0.25 : 0), 90, 9, dt);
  const nk = d.kuyruk.length;
  d.kuyruk.forEach((kk, i) => {
    const v = veri.get(kk), a = (i + 1) / Math.max(1, nk);
    const yalpaK = Math.sin(d.t * PI2 * 0.55 - i * 0.7) * 0.16 * (1 - w) + Math.sin(PI2 * ph - i * 0.9) * 0.22 * w + (d.zafer ? Math.sin(d.t * 16 - i * 0.8) * 0.35 : 0) + (d.surungen ? Math.sin(PI2 * ph + 1.6 - i * 0.7) * 0.25 * w : 0);
    const kalk = (d.kuyrukYay.x + 0.12 * w) * (0.6 + a * 0.4) - (d.olum ? 0.3 : 0);
    kk.quaternion.multiply(_q1.setFromAxisAngle(v.eu, yalpaK * (d.olum ? 0.1 : 1))).multiply(_q2.setFromAxisAngle(v.en, kalk));
  });
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
    if (bag < 1) T.y = Math.max(T.y, b.P0.y - 0.02 * Hy);
    ikCoz(b, T, Zinv, nW, f, u);
  }
  return { olay };
}
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
  return { model, Z, veri, f, u, n, Hy, minY, boyun, kuyruk, t: faz * 10, sal: null, yet: null, vur: null, olum: null, zafer: false, v: 0, olumYon: ozet(faz * 53) > 0.5 ? 1 : -1, k: new Array(6).fill(0),
    m0: { M: model.matrix.clone().compose(model.position, model.quaternion, model.scale) } };
}
// [t, boyunTaban(+geri), boyunUc, baş(+yukarı), ileri(H), yük(H)]
const YA = {
  saldir: [[0, 0, 0, 0, 0, 0], [0.14, 0.46, 0.28, 0.28, -0.06, 0.02], [0.23, 0.5, 0.3, 0.3, -0.07, 0.02], [0.28, -0.6, -0.38, -0.22, 0.14, -0.02], [0.36, -0.52, -0.32, -0.18, 0.12, -0.02], [0.64, 0, 0, 0, 0, 0]],
  tukur:  [[0, 0, 0, 0, 0, 0], [0.3, 0.3, -0.12, 0.35, -0.04, 0.06], [0.42, -0.3, -0.2, -0.05, 0.08, 0.03], [0.55, -0.28, -0.18, -0.03, 0.07, 0.02], [0.85, 0, 0, 0, 0, 0]],
};
/** Her kare. ops: dortAyakliGuncelle ile aynı (saldiri: darbe 0,22 sn sonra; yetenek: tükürme, mermi 0,4 sn'de). Döner {olay} */
export function yilanGuncelle(d, dt, { hiz = 0, saldiri = false, yetenek = false, vurul = false, olum = false, zafer = false, bakis = 0 } = {}) {
  if (!d) return { olay: null };
  let olay = null; dt = Math.min(0.1, Math.max(0, dt)); d.t += dt;
  if (olum && !d.olum) { d.olum = { t: 0 }; d.sal = d.yet = null; } if (!olum && d.olum) d.olum = null;
  if (!d.olum) { if (saldiri) d.sal = { t: 0, oldu: false }; if (yetenek) { d.yet = { t: 0, oldu: false }; d.sal = null; } if (vurul) d.vur = { t: 0, g: typeof vurul === 'number' ? kirp(vurul, 0.2, 1.2) : 0.7 }; }
  d.zafer = zafer;
  const olcek = Math.max(1e-4, _v1.setFromMatrixColumn(d.Z.matrixWorld, 0).length());
  d.v += ((d.olum ? 0 : hiz) - d.v) * Math.min(1, dt * 8); const w = yumusak((d.v - 0.06) / 0.5);
  const k = d.k; k.fill(0);
  if (d.sal) { d.sal.t += dt; anahtar(YA.saldir, d.sal.t, k); if (!d.sal.oldu && d.sal.t >= YILAN_DARBE) { d.sal.oldu = true; olay = 'darbe'; } if (d.sal.t > 0.64) d.sal = null; }
  if (d.yet) { d.yet.t += dt; anahtar(YA.tukur, d.yet.t, k); if (!d.yet.oldu && d.yet.t >= 0.4) { d.yet.oldu = true; olay = 'tukur'; } if (d.yet.t > 0.85) d.yet = null; }
  let taban = k[0], ucA = k[1], bas = k[2], ileri = k[3] * d.Hy, yuk = k[4] * d.Hy, yalpa = 0, yan = 0;
  if (d.vur) { const v = d.vur; v.t += dt; const e = Math.exp(-v.t * 9) * v.g; taban += 0.35 * e; bas += 0.2 * e; yan += Math.sin(v.t * 70) * 0.06 * e; if (v.t > 0.5) d.vur = null; }
  if (d.zafer) { bas += 0.15; yan += Math.sin(d.t * 5) * 0.2; }
  let ser = 0; if (d.olum) { const o = d.olum; o.t += dt; const e = o.t / 0.5; ser = e < 1 ? giris2(e) : 1 - Math.sin(Math.min(1, (o.t - 0.5) / 0.2) * Math.PI) * 0.06 * Math.exp(-(o.t - 0.5) * 4); if (!o.oldu && e >= 1) { o.oldu = true; olay = 'devrildi'; } }
  // model: sürünme — hızla orantılı yanal S salınımı (2,5 Hz) ve ona 90° faz farklı sapma; ilerleme fazı hızla akar
  d.surun = (d.surun || 0) + dt * (2.5 * PI2) * Math.min(1, 0.3 + d.v);
  yalpa = Math.cos(d.surun) * 0.15 * w;
  const yanS = Math.sin(d.surun) * 0.06 * d.Hy * w;
  _m2.identity(); rotAbout(_m3, _v2.set(0, d.minY, 0), d.u, yalpa); _m2.premultiply(_m3);
  _m3.makeTranslation(d.f.x * ileri + d.n.x * yanS, yuk, d.f.z * ileri + d.n.z * yanS); _m2.premultiply(_m3);
  if (w > 0.3) { d.tozT = (d.tozT || 0) + dt; if (d.tozT > 0.3 && !olay) { d.tozT = 0; olay = 'toz'; } }
  _m3.multiplyMatrices(_m2, d.m0.M).decompose(d.model.position, d.model.quaternion, d.model.scale);
  for (const kk of [...d.boyun, ...d.kuyruk]) kk.quaternion.copy(d.veri.get(kk).q);
  const nb = d.boyun.length;
  d.boyun.forEach((kk, i) => {
    const v = d.veri.get(kk), r = nb > 1 ? i / (nb - 1) : 1;
    // S kıvrımı: dalga boyun boyunca ilerler; bekleme salınımı yavaş, hareket hızlı
    const sDalga = Math.sin(d.t * 2.3 - i * 1.15) * (0.07 + 0.05 * w) * (i % 2 ? -1 : 1);
    const yanDalga = Math.sin(d.t * (1.3 + 2.2 * w) - i * 0.8) * (0.08 + 0.12 * w) + yan * (1 - r);
    let a = sDalga + taban * (1 - r) + ucA * r + (i === nb - 1 ? bas : 0);
    a += (d.olum ? -1.7 / nb * ser * (1.3 - r * 0.6) : 0);
    kk.quaternion.multiply(_q1.setFromAxisAngle(v.en, a)).multiply(_q2.setFromAxisAngle(v.eu, yanDalga * (d.olum ? 1 - ser : 1) + (bakis ? kirp(bakis, -0.6, 0.6) / nb : 0)));
    if (ser) kk.quaternion.multiply(_q1.setFromAxisAngle(v.ef, d.olumYon * 1.5 * ser / Math.max(1, nb) * (1.4 - r * 0.8)));
  });
  // kuyruk: ilerleyen dalga (hareket ederken sürünme fazına kilitli)
  d.kuyruk.forEach((kk, i) => { const v = d.veri.get(kk); const dalga = Math.sin(d.t * 1.6 - i * 0.7) * 0.1 * (1 - w) + Math.sin(d.surun - i * 0.9) * 0.32 * w; kk.quaternion.multiply(_q1.setFromAxisAngle(v.eu, dalga * (d.olum ? 0.2 : 1))); });
  return { olay };
}

// ═════════════════════════ İKİ AYAKLI KATMAN ═════════════════════════
/** UAL aktarımının üstüne katman kur. b: sahne3d birimi (b.model, b.kemik, b.isk, b.faz kullanılır).
    ops: {kanat (Kuğu/Anka/Yarasa), iri (Golem/Ayı: kollar dışa)} — verilmezse b.gor'dan okunur */
export function ikiAyakliKur(b, { kanat, iri } = {}) {
  const g = b.gor || {}; const faz = b.faz != null ? b.faz : Math.random();
  const d = { b, K: b.kemik, kanat: kanat != null ? kanat : !!g.kanat, iri: iri != null ? iri : !!g.iri, faz, t: faz * 7,
    kolAci: g.kolAci != null ? g.kolAci : (g.iri ? 0.21 : 0.08), egimOfs: g.egim || 0, basOfs: g.bas || 0,
    nefesHz: 0.3 + ozet(faz * 13.7) * 0.16, nefesGenlik: 0.8 + ozet(faz * 7.1) * 0.5, idleHiz: 0.86 + ozet(faz * 3.3) * 0.28,
    sal: null, yet: null, vur: { x: 0, v: 0 }, egilYay: { x: 0, v: 0 }, cirpma: 0, w: 0, agirlik: 1, olum: false, kanal: [0, 0] };
  return d;
}
const _F = new THREE.Vector3(), _R = new THREE.Vector3(), _U = new THREE.Vector3();
/** kemiği dünya ekseni etrafında döndürür (aktar sonrası dünya matrisleri güncel olmalı); altını günceller */
function dunyaDon(k, eksenW, aci) {
  if (!k || !aci) return;
  k.getWorldQuaternion(_q1).invert(); _v1.copy(eksenW).applyQuaternion(_q1).normalize();
  k.quaternion.multiply(_q2.setFromAxisAngle(_v1, aci)); k.updateMatrixWorld(true);
}
// [t, eğilme (+ileri)] — süreler darbe anına göre ölçeklenir
/** Her kare, aktar(b)'den HEMEN SONRA. dt: görsel dt.
    ops: hareket (bool) | hiz, saldiri ({darbe: klip darbe anı sn (hız ölçekli), menzilli}) — yalnız başladığı karede,
         yetenek (true; bu karede başlat — sahne3d yeteneği olaydan 0,35 sn önce başlatır), vurul (true|güç), olum (bool), zafer (bool) */
export function ikiAyakliGuncelle(d, dt, { hareket = false, hiz = 0, saldiri = null, yetenek = false, vurul = false, olum = false, zafer = false } = {}) {
  if (!d) return; dt = Math.min(0.1, Math.max(0, dt)); d.t += dt;
  const b = d.b, K = d.K;
  if (saldiri) { const dr = typeof saldiri === 'object' ? (saldiri.darbe || 0) : 0.25; d.sal = { t: 0, darbe: dr, menzilli: !!(saldiri && saldiri.menzilli) || dr < 0.08 }; }
  if (yetenek) d.yet = { t: 0 };
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
  if (d.yet) {
    const y = d.yet; y.t += dt;
    egil += y.t < 0.33 ? -0.14 * yumusak(y.t / 0.33) : y.t < 0.45 ? karis(-0.14, 0.18, cikis3((y.t - 0.33) / 0.12)) : 0.18 * (1 - yumusak((y.t - 0.45) / 0.4));
    cirp = d.kanat ? 1 : 0; if (y.t > 0.9) d.yet = null;
  }
  yay(d.vur, 0, 260, 18, dt); egil += d.vur.x * 0.06;
  // nefes (faz ve hız çeşitliliği)
  const nefes = Math.sin(d.t * PI2 * d.nefesHz) * d.nefesGenlik * (1 - d.w);
  // yürüme salınımı: Walk/Jog klibinin zamanına kilitli (adım başına yalpalama)
  let yurFaz = d.t * 1.5;
  if (i && i.aktif && /Walk|Jog/.test(i.aktifAd || '')) yurFaz = i.aktif.time / i.aktif.getClip().duration;
  const sal = Math.sin(yurFaz * PI2) * d.w;
  // uygula: omurga (eğilme dağıtılır), kalça yalpası, baş dengesi
  const om = [K.Spine, K.Spine1, K.Spine2].filter(Boolean), pay = [0.4, 0.33, 0.27];
  om.forEach((k, j) => { dunyaDon(k, _R, (egil * pay[j] - nefes * 0.012 + d.egimOfs * pay[j]) * W); });
  if (K.Hips && d.w > 0.01) { dunyaDon(K.Hips, _F, sal * 0.05 * W); dunyaDon(K.Hips, _U, sal * 0.06 * W); }
  if (K.Spine1 && d.w > 0.01) dunyaDon(K.Spine1, _U, -sal * 0.08 * W);
  if (K.Head) dunyaDon(K.Head, _R, (-egil * 0.35 + nefes * 0.01 + d.basOfs) * W);
  // omuzlar nefesle kalkar
  for (const [ad, s] of [['LeftShoulder', 1], ['RightShoulder', -1]]) if (K[ad]) dunyaDon(K[ad], _F, s * nefes * 0.02 * W);
  // tombul gövdeler: kollar gövde genişliğine göre dışa açılır (kolAci, kişilik tablosundan); ön kol da biraz dışa
  if (d.kolAci > 0) { const a = d.kolAci * W; if (K.LeftArm) dunyaDon(K.LeftArm, _F, -a); if (K.RightArm) dunyaDon(K.RightArm, _F, a);
    if (K.LeftForeArm) dunyaDon(K.LeftForeArm, _F, -0.4 * a); if (K.RightForeArm) dunyaDon(K.RightForeArm, _F, 0.4 * a); }
  // kanat çırpma: bekleme ±8° 1,6 Hz, yürüme 2,4 Hz, saldırı/yetenekte geniş ve hızlı; ön kol gecikmeli (dalga)
  if (d.kanat) {
    d.cirpma += (cirp - d.cirpma) * Math.min(1, dt * 5);
    const hz = karis(karis(1.6, 2.4, d.w), 3.4, d.cirpma), gen = karis(karis(0.14, 0.24, d.w), 0.5, d.cirpma);
    d.kFaz = (d.kFaz || 0) + dt * hz * PI2;
    const kol = Math.sin(d.kFaz) * gen, on = Math.sin(d.kFaz - 0.9) * gen * 0.6;
    if (K.LeftArm) dunyaDon(K.LeftArm, _F, -kol * W); if (K.RightArm) dunyaDon(K.RightArm, _F, kol * W);
    if (K.LeftForeArm) dunyaDon(K.LeftForeArm, _F, -on * W); if (K.RightForeArm) dunyaDon(K.RightForeArm, _F, on * W);
    // çırpışta gövde hafif kalkar
    if (K.Hips) { K.Hips.position.y += Math.max(0, -Math.cos(d.kFaz)) * 0.006 * d.cirpma * W; K.Hips.updateMatrixWorld(true); }
  }
  d.zafer = zafer;
}
