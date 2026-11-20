/* Kut Arena — arena çevresi (yalnız görüntü; motoru etkilemez). sahne3d.js arenaKur'dan çağrılır.
   - zemin: adanın kenar halkası, iki ölçekli + döndürülmüş doku örneklemesi ve gürültüyle toprak/ton lekeleri (tekrar etmez)
   - çimen: örneklenmiş (InstancedMesh) tutamlar; rüzgâr vertex shader'da (katmanlı dalga + yavaş esinti gürültüsü), kökte koyu uçta açık
   - çiçek öbekleri, çakıl taşları, sarmaşık (bordür ve sütun diplerinde), uzak yüzen adalar
   Çizim çağrısı: çimen 1 + çiçek 1 + çakıl 1 (+ gölge) + sarmaşık yaprağı 1 + sarmaşık gövdesi 1.
   Uyarlanır kalite: G.kademeAl() büyüdükçe (zayıf cihaz) çimen/çiçek sayısı azalır, kademe 8'de çimen kapanır; 'hafif'te yarı yoğunluk. */
import * as THREE from 'three';
import { mergeGeometries } from '../vendor/three/addons/utils/BufferGeometryUtils.js';

let S = null, K = null, KOK = '', TL = null, HAFIF = false, kademeAl = () => 0;
let ada = null, rim = null;            // ada üst yüzünün açıya göre dış yarıçapı (köşe tepe noktalarından)
const zaman = { value: 0 };
const kok = new THREE.Group(); kok.name = 'cevre';
const sayili = [];                     // { m: InstancedMesh, n: tam sayı, oran(kd) }
let rs = 12345; const rnd = () => ((rs = (rs * 16807) % 2147483647) / 2147483647);
const ara = (a, b) => a + (b - a) * rnd();

// GLSL: değer gürültüsü (atmosferle aynı aile) + fbm
const GUR = `float cv_h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float cv_g(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(cv_h(i), cv_h(i + vec2(1, 0)), f.x), mix(cv_h(i + vec2(0, 1)), cv_h(i + vec2(1, 1)), f.x), f.y); }
float cv_f(vec2 p){ return cv_g(p) * 0.55 + cv_g(p * 2.1 + 5.3) * 0.3 + cv_g(p * 4.3 + 1.7) * 0.15; }
`;
// JS: aynı gürültünün eşi (yerleşim yoğunluğu için)
const jh = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
const jg = (x, y) => { const ix = Math.floor(x), iy = Math.floor(y); let fx = x - ix, fy = y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  const a = jh(ix, iy), b = jh(ix + 1, iy), c = jh(ix, iy + 1), d = jh(ix + 1, iy + 1); return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy; };
const jf = (x, y) => jg(x, y) * 0.6 + jg(x * 2.3 + 5.1, y * 2.3 + 1.3) * 0.4;

export function kur(o) {
  S = o.sahne; K = o.kamera; KOK = o.kok || ''; TL = o.tl; HAFIF = !!o.hafif; ada = o.ada || null; if (o.kademeAl) kademeAl = o.kademeAl;
  if (!kok.parent) S.add(kok);
  rimOlc();
}
export function kokNesne() { return kok; }
export const IC_R = 5.36;   // bordürün dışı: çimen buradan başlar (avlu ve tahta örtülmez)
export function disR(aci) { if (!rim) return 6.2; const n = rim.length, f = ((aci / (Math.PI * 2)) % 1 + 1) % 1 * n, i = Math.floor(f), t = f - i; return rim[i % n] * (1 - t) + rim[(i + 1) % n] * t; }

// Ada üst yüzü: y > −0,12 olan köşe noktalarının açı dilimlerine göre en büyük yarıçapı (kenardan taşmayalım diye)
function rimOlc() {
  const N = 120; rim = new Float32Array(N).fill(0);
  if (!ada) { rim.fill(6.2); return; }
  ada.updateMatrixWorld(true); const v = new THREE.Vector3();
  ada.traverse(m => { if (!m.isMesh) return; const p = m.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld); if (v.y < -0.12) continue;
      const r = Math.hypot(v.x, v.z), a = Math.atan2(v.x, v.z), k = ((Math.round(a / (Math.PI * 2) * N) % N) + N) % N; if (r > rim[k]) rim[k] = r; } });
  // boş dilimleri komşulardan doldur, sonra yumuşat; sınırla
  for (let g = 0; g < 3; g++) for (let i = 0; i < N; i++) if (rim[i] < 5) rim[i] = Math.max(rim[(i + 1) % N], rim[(i + N - 1) % N]);
  const y = rim.map((_, i) => (rim[(i + N - 1) % N] + 2 * rim[i] + rim[(i + 1) % N]) / 4);
  for (let i = 0; i < N; i++) rim[i] = Math.min(6.6, Math.max(5.8, y[i] || 6.2));
}
export function _rim() { return rim && [...rim].map(x => +x.toFixed(2)); }

// ── zemin: kenar halkası ──
export function zeminKur(cimDoku) {
  const mat = new THREE.MeshStandardMaterial({ map: cimDoku, roughness: 1, metalness: 0 });
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = 'varying vec3 cvW;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ncvW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = 'varying vec3 cvW;\n' + GUR + sh.fragmentShader.replace('#include <map_fragment>', `
      vec2 wp = cvW.xz; float rr = length(wp);
      vec3 t1 = texture2D(map, wp * 0.19).rgb, t2 = texture2D(map, mat2(0.8, -0.6, 0.6, 0.8) * wp * 0.071 + 0.37).rgb;
      vec3 c = mix(t1, t2, smoothstep(0.3, 0.7, cv_g(wp * 0.33)));
      float n = cv_f(wp * 0.62 + 3.1);
      // toprak lekeleri (ılık kahve-mor), aralarına serpilmiş açık yeşil-sarı alanlar
      vec3 toprak = vec3(0.30, 0.20, 0.17) * (0.75 + 0.5 * cv_g(wp * 5.0));
      c = mix(c, toprak, smoothstep(0.6, 0.74, n) * 0.85);
      c *= mix(vec3(0.86, 1.0, 0.80), vec3(1.12, 1.03, 0.74), cv_g(wp * 0.45 + 7.0));
      // bordür dibinde ve adanın dış kenarında hafif koyulaşma (temas gölgesi)
      c *= mix(0.55, 1.0, smoothstep(5.32, 5.6, rr));
      diffuseColor.rgb *= c;`);
  };
  const m = new THREE.Mesh(new THREE.RingGeometry(5.3, 6.35, 120, 2), mat);
  m.rotation.x = -Math.PI / 2; m.position.y = 0.006; m.receiveShadow = true; kok.add(m);
  return m;
}

// ── rüzgâr: örneklenmiş nesnelerin vertex shader'ına eklenir. position.y (yerel, 0..1) yükseklik; uç kökten fazla sallanır ──
function ruzgarli(mat, guc, { yukari = 0.7 } = {}) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uZ = zaman;
    sh.vertexShader = 'uniform float uZ;\n' + GUR + sh.vertexShader.replace('#include <project_vertex>', `
      vec4 mvPosition = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        mvPosition = instanceMatrix * mvPosition;
        float boy = length(instanceMatrix[1].xyz);
      #else
        float boy = 1.0;
      #endif
      float hh = clamp(position.y, 0.0, 1.2); hh *= hh;
      vec2 wp = mvPosition.xz;
      float dalga = sin(uZ * 0.85 + dot(wp, vec2(0.55, 0.35))) * 0.55 + sin(uZ * 1.7 + dot(wp, vec2(-1.3, 1.7))) * 0.22 + sin(uZ * 3.1 + wp.x * 3.0) * 0.06;
      float esinti = cv_g(wp * 0.22 + vec2(uZ * 0.16, uZ * 0.05));
      float b = (0.3 + 0.55 * dalga) * (0.35 + esinti * 1.1) * ${guc.toFixed(3)} * hh * (0.5 + boy * 3.0);
      mvPosition.xz += vec2(0.8, 0.5) * b; mvPosition.y -= b * b * 1.6;
      mvPosition = modelViewMatrix * mvPosition;
      gl_Position = projectionMatrix * mvPosition;`);
    if (yukari > 0) sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>
      normal = normalize(mix(normal, normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz), ${yukari.toFixed(2)}));`);
  };
  mat.customProgramCacheKey = () => 'cvRuzgar' + guc + '_' + yukari;
  return mat;
}

// ── çimen tutamı: 9 yaprak; her yaprak 4 katlı sivri şerit (kök geniş, uç tek nokta), yükseklik 0..1 ──
const KOK_R = new THREE.Color('#1f300c'), ORTA_R = new THREE.Color('#58852a'), UC_R = new THREE.Color('#b9d863');
function tutamGeo(yaprak = 11) {
  const P = [], C = [], N = [], I = []; const c = new THREE.Color();
  for (let b = 0; b < yaprak; b++) {
    const a = rnd() * Math.PI * 2, d = rnd() * 0.32, bx = Math.sin(a) * d, bz = Math.cos(a) * d;
    const yon = rnd() * Math.PI, w = ara(0.07, 0.11), h = ara(0.5, 1.0), egik = ara(0.15, 0.45) * h, ex = Math.sin(a) * egik, ez = Math.cos(a) * egik;
    const nx = Math.cos(yon), nz = Math.sin(yon), s = P.length / 3;
    const KAT = [0, 0.35, 0.68, 1];
    for (let k = 0; k < KAT.length; k++) {
      const t = KAT[k], x = bx + ex * t * t, z = bz + ez * t * t, y = h * t, ww = w * (1 - t) * (1 - t * 0.2);
      c.copy(t < 0.5 ? KOK_R : ORTA_R).lerp(t < 0.5 ? ORTA_R : UC_R, t < 0.5 ? t * 2 : (t - 0.5) * 2);
      if (k < KAT.length - 1) { P.push(x - nx * ww, y, z - nz * ww, x + nx * ww, y, z + nz * ww); C.push(c.r, c.g, c.b, c.r, c.g, c.b); N.push(0, 1, 0, 0, 1, 0); }
      else { P.push(x, y, z); C.push(c.r, c.g, c.b); N.push(0, 1, 0); }
    }
    for (let k = 0; k < 2; k++) { const o = s + k * 2; I.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
    I.push(s + 4, s + 5, s + 6);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setIndex(I);
  return g;
}
// halka üstünde doğal dağılım: gürültü yoğunluğu ile kabul/ret; öbekler ve boşluklar; dış kenara doğru sıklaşır
function halkaNokta(yogunlukEsik = 0.35, icR = IC_R, disPay = 0.05) {
  for (let deneme = 0; deneme < 60; deneme++) {
    const a = rnd() * Math.PI * 2, R = disR(a) - disPay, r = icR + Math.sqrt(rnd()) * (R - icR);
    const x = Math.sin(a) * r, z = Math.cos(a) * r, n = jf(x * 0.7 + 11, z * 0.7 - 3);
    const kenar = (r - icR) / Math.max(0.1, R - icR);
    if (n + kenar * kenar * 0.32 > yogunlukEsik + rnd() * 0.35) return { x, z, r, a, n, kenar };
  }
  return null;
}
let engeller = [];   // { x, z, r }: büyük nesnelerin dibi (çimen gövdeye girmesin)
export function engelEkle(x, z, r) { engeller.push({ x, z, r }); }
const engelde = (x, z) => engeller.some(e => (x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r);

const TON = [[1, 1, 1], [1, 1, 1], [1.08, 1.02, 0.8], [1.15, 1.0, 0.68], [0.85, 1.04, 0.86], [0.92, 1.0, 0.95]];
export function cimenKur(n = 3400) {
  if (HAFIF) n = Math.round(n * 0.55);
  const geo = tutamGeo(11);
  const mat = ruzgarli(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, side: THREE.DoubleSide }), 0.11);
  const m = new THREE.InstancedMesh(geo, mat, n); m.receiveShadow = true; m.castShadow = false; m.frustumCulled = false;
  const o = new THREE.Object3D(), c = new THREE.Color(); let k = 0;
  while (k < n) {
    const p = halkaNokta(0.4, IC_R, -0.04); if (!p) break; if (engelde(p.x, p.z)) continue;
    const kenarda = p.kenar > 0.86, dis = kenarda ? ara(0.0, 0.07) : 0, ka = Math.atan2(p.x, p.z);
    o.position.set(p.x + Math.sin(ka) * dis, kenarda ? -0.015 - dis * 0.4 : 0.0, p.z + Math.cos(ka) * dis); o.rotation.set(kenarda ? ara(0.25, 0.75) : ara(-0.08, 0.08), rnd() * Math.PI * 2, 0, 'YXZ');
    if (kenarda) { o.rotation.order = 'YXZ'; o.rotation.y = p.a; }   // adanın dışına doğru sarkar
    const boy = ara(0.12, 0.2) * (0.75 + p.n * 0.7) * (p.r < IC_R + 0.15 ? 0.7 : 1), en = ara(0.75, 1.15);
    o.scale.set(boy * en * 1.6, boy, boy * en * 1.6); o.updateMatrix(); m.setMatrixAt(k, o.matrix);
    const t = TON[(rnd() * TON.length) | 0], j = ara(0.9, 1.08); c.setRGB(t[0] * j, t[1] * j, t[2] * j); m.setColorAt(k, c); k++;
  }
  m.count = k; kok.add(m); sayili.push({ m, n: k, oran: (kd) => kd >= 8 ? 0 : kd >= 7 ? 0.3 : kd >= 5 ? 0.5 : kd >= 3 ? 0.65 : kd >= 2 ? 0.82 : 1 });
  return m;
}

// ── çiçek: ince sap + 5 yapraklı taç (eğik) + sarı göbek; yükseklik 0..1 ──
function cicekGeo() {
  const parca = [];
  const sap = new THREE.PlaneGeometry(0.035, 1, 1, 3); sap.translate(0, 0.5, 0); parca.push(boya(sap, '#4d6a1c', '#7f9a34'));
  const sap2 = sap.clone(); sap2.rotateY(Math.PI / 2); parca.push(sap2);
  const sh = new THREE.Shape(); const Y = 5;
  for (let i = 0; i <= Y * 8; i++) { const a = i / (Y * 8) * Math.PI * 2, r = 0.09 + 0.13 * Math.pow(Math.abs(Math.cos(a * Y / 2)), 0.7); const x = Math.sin(a) * r, y = Math.cos(a) * r; i ? sh.lineTo(x, y) : sh.moveTo(x, y); }
  const tac = new THREE.ShapeGeometry(sh, 1); tac.rotateX(-Math.PI / 2 + 0.35); tac.translate(0, 1, 0); parca.push(boya(tac, '#ffffff', '#ffffff'));
  const gobek = new THREE.CircleGeometry(0.06, 8); gobek.rotateX(-Math.PI / 2 + 0.35); gobek.translate(0, 1.012, 0.004); parca.push(boya(gobek, '#ffd23a', '#ffd23a'));
  return mergeGeometries(parca.map(g => { g.deleteAttribute('uv'); const n = g.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0); return g; }));
}
function boya(g, alt, ust) { const a = new THREE.Color(alt), b = new THREE.Color(ust), p = g.attributes.position, C = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { c.copy(a).lerp(b, Math.min(1, Math.max(0, p.getY(i)))); C.set([c.r, c.g, c.b], i * 3); } g.setAttribute('color', new THREE.BufferAttribute(C, 3)); return g; }
const CICEK_R = ['#ffd85a', '#ff9cc4', '#c7a6ff', '#fff2dc', '#ffae5c', '#ff7aa8'];
export function cicekKur(oz = 34) {
  if (HAFIF) oz = Math.round(oz * 0.6);
  const n = oz * 7, m = new THREE.InstancedMesh(cicekGeo(), ruzgarli(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, side: THREE.DoubleSide }), 0.09, { yukari: 0.55 }), n);
  m.receiveShadow = true; m.frustumCulled = false;
  const o = new THREE.Object3D(), c = new THREE.Color(); let k = 0;
  for (let i = 0; i < oz && k < n; i++) {
    const p = halkaNokta(0.5, IC_R + 0.08, 0.12); if (!p || engelde(p.x, p.z)) continue;
    const renk = CICEK_R[(rnd() * CICEK_R.length) | 0], adet = 3 + ((rnd() * 5) | 0);
    for (let j = 0; j < adet && k < n; j++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * 0.28, x = p.x + Math.sin(a) * d, z = p.z + Math.cos(a) * d;
      if (Math.hypot(x, z) < IC_R + 0.04 || Math.hypot(x, z) > disR(Math.atan2(x, z)) - 0.06) continue;
      const s = ara(0.13, 0.24); o.position.set(x, 0, z); o.rotation.set(ara(-0.12, 0.12), rnd() * Math.PI * 2, 0); o.scale.setScalar(s); o.updateMatrix(); m.setMatrixAt(k, o.matrix);
      c.set(renk).multiplyScalar(ara(0.88, 1.1)); m.setColorAt(k, c); k++;
    }
  }
  m.count = k; kok.add(m); sayili.push({ m, n: k, oran: (kd) => kd >= 8 ? 0.4 : kd >= 5 ? 0.7 : 1 });
  return m;
}

// ── çakıl taşları: gürültüyle bozulmuş, basık ikosahedronlar (düz gölgeli, alçak poli) ──
function tasGeo() {
  const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = 0.78 + 0.4 * jg(v.x * 1.7 + 3, v.y * 1.7 + v.z * 1.3); v.multiplyScalar(k); v.y *= 0.62; p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g;
}
export function tasKur() {
  const n = 70, m = new THREE.InstancedMesh(tasGeo(), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.92, flatShading: true }), n);
  m.castShadow = true; m.receiveShadow = true;
  const o = new THREE.Object3D(), c = new THREE.Color(), TR = ['#8d7a8a', '#9c8a8c', '#7a6c80', '#a39280', '#6f6476']; let k = 0;
  const koy = (x, z, s) => { if (k >= n) return; o.position.set(x, -s * 0.22, z); o.rotation.set(ara(-0.3, 0.3), rnd() * 6.28, ara(-0.3, 0.3)); o.scale.set(s * ara(0.9, 1.4), s, s * ara(0.8, 1.2)); o.updateMatrix(); m.setMatrixAt(k, o.matrix); c.set(TR[(rnd() * TR.length) | 0]); m.setColorAt(k, c); k++; };
  // bordür dibine yaslanan küçük taş dizileri (öbek öbek) + çimende tek tük + kenarda büyükçeler
  for (let i = 0; i < 9; i++) { const a0 = rnd() * Math.PI * 2; for (let j = 0; j < 3 + (rnd() * 3 | 0); j++) { const a = a0 + ara(-0.07, 0.07), r = ara(5.4, 5.55); koy(Math.sin(a) * r, Math.cos(a) * r, ara(0.04, 0.09)); } }
  while (k < n - 10) { const p = halkaNokta(0.3, IC_R + 0.1, 0.1); if (!p) break; if (!engelde(p.x, p.z)) koy(p.x, p.z, ara(0.035, 0.1)); }
  while (k < n) { const a = rnd() * Math.PI * 2, r = disR(a) - ara(0.08, 0.25); koy(Math.sin(a) * r, Math.cos(a) * r, ara(0.1, 0.18)); }
  m.count = k; kok.add(m); return m;
}

// ── sarmaşık: kıvrımlı ince gövde (tüp, tek birleşik geometri) + boyunca yapraklar (örneklenmiş) ──
function yaprakGeo() {
  const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.bezierCurveTo(0.55, 0.25, 0.5, 0.85, 0, 1.0); sh.bezierCurveTo(-0.5, 0.85, -0.55, 0.25, 0, 0);
  const g = new THREE.ShapeGeometry(sh, 3); g.deleteAttribute('uv'); boya(g, '#2f4f1a', '#6fa03a'); return g;
}
export function sarmasikKur(yollar) {
  // yollar: [[Vector3...], ...] dünyada kontrol noktaları
  const tupler = [], yap = [];
  for (const y of yollar) {
    const e = new THREE.CatmullRomCurve3(y); tupler.push(boya(new THREE.TubeGeometry(e, Math.max(8, y.length * 6), 0.009, 4, false), '#3d4a1c', '#56702a'));
    const L = e.getLength(), adet = Math.floor(L * 46);
    for (let i = 0; i < adet; i++) { const t = (i + rnd() * 0.6) / adet; yap.push({ p: e.getPointAt(t), tg: e.getTangentAt(t), s: ara(0.055, 0.1) * (1 - t * 0.3) }); }
  }
  if (!tupler.length) return;
  const g = mergeGeometries(tupler.map(t => { t.deleteAttribute('uv'); return t; }));
  const gov = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 })); gov.castShadow = true; gov.receiveShadow = true; kok.add(gov);
  const m = new THREE.InstancedMesh(yaprakGeo(), ruzgarli(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide }), 0.02, { yukari: 0.35 }), yap.length);
  m.castShadow = true; m.receiveShadow = true;
  const o = new THREE.Object3D(), c = new THREE.Color(), up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion(); let k = 0;
  for (const y of yap) {
    o.position.copy(y.p); o.quaternion.setFromUnitVectors(up, y.tg); o.rotateY((k % 2 ? 1 : -1) * 1.2 + ara(-0.3, 0.3)); o.rotateX(ara(0.6, 1.2)); o.rotateZ((k % 2 ? 1 : -1) * ara(0.5, 1.0));
    o.scale.setScalar(y.s); o.updateMatrix(); m.setMatrixAt(k, o.matrix); c.setHSL(ara(0.22, 0.3), ara(0.45, 0.7), ara(0.45, 0.62)); m.setColorAt(k, c); k++;
  }
  kok.add(m);
}
// bordür üstünden dışa sarkan ve avlu kenarı boyunca uzanan sarmaşık kolları (kontrol noktaları gürültüyle kıvrılır)
export function bordurSarmasik(acilar) {
  const yollar = [];
  for (const [a0, uz] of acilar) {
    const y = [], adim = 7;
    for (let i = 0; i <= adim; i++) {
      const t = i / adim, a = (a0 + uz * t) * Math.PI / 180;
      // dış çimenden başlar (r 5,55, y 0), bordürün üstüne tırmanır (r 5,2, y 0,055) ve yine dışa iner: dalga
      const dal = Math.sin(t * Math.PI * 1.5 + a0) * 0.5 + 0.5, r = 5.58 - dal * 0.36 + ara(-0.02, 0.02), yy = r < 5.34 ? 0.058 : r < 5.4 ? 0.035 : 0.012;
      y.push(new THREE.Vector3(Math.sin(a) * r, yy, Math.cos(a) * r));
    }
    yollar.push(y);
  }
  return yollar;
}
// nesnenin gövdesine sarılan sarmal (sütun gibi): taban merkezi, yarıçap, yükseklik
export function sarmalYol(x, z, r, h, tur = 1.3, bas = 0) {
  const y = [], n = 14; for (let i = 0; i <= n; i++) { const t = i / n, a = bas + t * tur * Math.PI * 2, rr = r * (1 + 0.08 * Math.sin(t * 9)); y.push(new THREE.Vector3(x + Math.sin(a) * rr, 0.02 + t * h, z + Math.cos(a) * rr)); } return y;
}

// ── uzak yüzen adalar: üç derinlik katmanı; uzaklar büyük ve sisli (gökyüzü derinliği), yakınlar küçük ──
export function adalarKur(yuzen, olcekle, efektler) {
  const L = [   // [x, y, z, boy, faz]
    [-11, 2.5, -9, 3.5], [12, 4, -12, 4.5], [-14, -1, 4, 3], [13, 0.5, 6, 2.6],
    [-9.5, -3.2, 12, 2.0], [8.5, 6.5, -6.5, 1.4], [-6, 5.5, -13, 1.8], [16, -3.5, -2, 2.2],
    [-30, 3, -26, 9], [34, 7, -30, 11], [-40, -6, 6, 10], [38, -2, 14, 8], [4, 12, -44, 13], [-18, 9, -40, 7],
  ];
  for (const [x, y, z, s] of L) {
    const o = yuzen.scene.clone(); olcekle(o, s, 'max'); o.position.set(x, y, z); o.rotation.y = jh(x, z) * 6.28; kok.add(o);
    if (s < 5) o.traverse(m => { if (m.isMesh) m.castShadow = false; });
    const genlik = s > 6 ? 0.5 : 0.25, hiz = s > 6 ? 0.18 : 0.5;
    efektler.push({ kalici: true, o, guncelle: (t) => { o.position.y = y + Math.sin(t * hiz + x) * genlik; o.rotation.y += 0.00004 * s; } });
  }
}

let sonKd = -1;
export function guncelle(t) {
  zaman.value = t % 1000;
  const kd = HAFIF ? Math.max(3, kademeAl()) : kademeAl();
  if (kd !== sonKd) { sonKd = kd; for (const s of sayili) { const o = s.oran(kd); s.m.count = Math.round(s.n * o); s.m.visible = s.m.count > 0; } }
}
// hata ayıklama: serbest kamera (önce sahne3d.kameraYerlestir ile kam.serbest açılır)
export function _bak(p, l) { if (!K) return; K.position.set(...p); K.lookAt(...l); K.fov = 38; K.updateProjectionMatrix(); }
export function _bilgi() { return { cocuk: kok.children.length, sayili: sayili.map(s => [s.m.count, s.n]) }; }
