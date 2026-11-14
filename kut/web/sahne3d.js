/* Kut Arena — 3D savaş sahnesi (tarayıcı sürümü). Kurallar: ../ANIMASYON_PLANI.md
   Motor (../sim.js) görüntünün ÖNDE_SN kadar önünde koşar; olaylar zaman damgalı kuyruğa girer,
   saldırı klipleri darbe karesi olay zamanına denk gelecek şekilde önceden başlatılır. */
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from '../vendor/three/addons/utils/SkeletonUtils.js';

const D = window.KUT_DATA;
export const ONDE_SN = 0.4;
const DT = 0.05;
const ARENA_Y = 0;                    // tahta yüzeyi
const dunya = (x, y) => new THREE.Vector3(x - 3, ARENA_Y, y - 4);

// ── Kahraman görsel tanımları (ANIMASYON_PLANI §3–4) ──
const IKI = { tur: 'iki' }, DORT = { tur: 'dort' }, YILAN = { tur: 'yilan' };
export const GORSEL = {
  golem:   { ...IKI, saldir: 'Punch_Cross', yetenek: ['Spell_Simple_Enter', 'Spell_Simple_Shoot'], iri: true },
  kurbaga: { ...IKI, saldir: 'Spell_Simple_Shoot', yetenek: ['Dance_Loop'] },
  yarasa:  { ...IKI, saldir: 'Punch_Jab', yetenek: ['Spell_Simple_Enter', 'Spell_Simple_Idle_Loop'], kanat: true },
  ruzgar:  { ...IKI, saldir: 'Spell_Simple_Shoot', yetenek: ['Spell_Simple_Enter', 'Spell_Simple_Shoot'] },
  kugu:    { ...IKI, saldir: 'Spell_Simple_Shoot', yetenek: ['Spell_Simple_Enter', 'Spell_Simple_Idle_Loop'], kanat: true },
  ayi:     { ...IKI, saldir: 'Punch_Cross', yetenek: ['Sword_Attack'], iri: true },
  anka:    { ...IKI, saldir: 'Spell_Simple_Shoot', yetenek: ['Spell_Simple_Enter', 'Spell_Simple_Shoot'], kanat: true },
  baykus:  { ...IKI, saldir: 'Spell_Simple_Shoot', yetenek: ['Spell_Simple_Enter', 'Spell_Simple_Idle_Loop', 'Spell_Simple_Shoot'] },
  tilki:   { ...IKI, saldir: 'Spell_Simple_Shoot', yetenek: ['Spell_Simple_Enter', 'Spell_Simple_Shoot'] },
  ejder:   { ...IKI, saldir: 'Spell_Simple_Shoot', yetenek: ['Jump_Start', 'Spell_Simple_Shoot'] },
  kurt: { ...DORT }, koc: { ...DORT }, kaplumbaga: { ...DORT }, semender: { ...DORT }, bulutat: { ...DORT, kanat: true },
  yilan: { ...YILAN },
};
// Klip darbe anları (saniye, hız 1'de) — UAL'den ölçüldü
const DARBE = { Punch_Jab: 0.21, Punch_Cross: 0.30, Sword_Attack: 0.43, Spell_Simple_Shoot: 0.0, Spell_Simple_Enter: 0.5 };
const SOY_RENK = { gok: '#bfe6ff', yer: '#c9a46b', ates: '#ff7a2e', su: '#4fb7ff', kis: '#a8e4ff', karanlik: '#a46cff', dev: '#b9a58c', avci: '#ffd76a', bilge: '#c98bff', atli: '#ffe08a' };

// ── UAL → Mixamo kemik eşlemesi (golemde sınandı) ──
const MAP0 = { Hips: 'DEF-hips', Spine: 'DEF-spine.001', Spine1: 'DEF-spine.002', Spine2: 'DEF-spine.003', Neck: 'DEF-neck', Head: 'DEF-head',
  LeftShoulder: 'DEF-shoulder.L', LeftArm: 'DEF-upper_arm.L', LeftForeArm: 'DEF-forearm.L', LeftHand: 'DEF-hand.L',
  RightShoulder: 'DEF-shoulder.R', RightArm: 'DEF-upper_arm.R', RightForeArm: 'DEF-forearm.R', RightHand: 'DEF-hand.R',
  LeftUpLeg: 'DEF-thigh.L', LeftLeg: 'DEF-shin.L', LeftFoot: 'DEF-foot.L', LeftToeBase: 'DEF-toe.L',
  RightUpLeg: 'DEF-thigh.R', RightLeg: 'DEF-shin.R', RightFoot: 'DEF-foot.R', RightToeBase: 'DEF-toe.R' };
const MAP = {}; for (const k in MAP0) MAP[k] = MAP0[k].replace(/\./g, '');
const COCUK = { Hips: 'Spine', Spine: 'Spine1', Spine1: 'Spine2', Spine2: 'Neck', Neck: 'Head', LeftShoulder: 'LeftArm', LeftArm: 'LeftForeArm', LeftForeArm: 'LeftHand',
  RightShoulder: 'RightArm', RightArm: 'RightForeArm', RightForeArm: 'RightHand', LeftUpLeg: 'LeftLeg', LeftLeg: 'LeftFoot', LeftFoot: 'LeftToeBase', RightUpLeg: 'RightLeg', RightLeg: 'RightFoot', RightFoot: 'RightToeBase' };
const SIRA = ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head', 'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand', 'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase', 'RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase'];
const wq = (o) => o.getWorldQuaternion(new THREE.Quaternion()), wp = (o) => o.getWorldPosition(new THREE.Vector3());

let renderer, sahne, kamera, saat, yukleyici, ual = null;
const modelOnbellek = {};
let birimler = new Map();   // uid → görsel birim
let efektler = [], kuyruk = [], yazilar = [];
let sim = null, gorselT = 0, anlik = [], hizKati = 1;
let kaplama, kcx;           // 2D kaplama (çubuklar, sayılar)
let dinleyici = {};

// ── Kurulum ──
export async function hazirla(tuval, kaplamaTuval, kok = '', { hafif = false } = {}) {
  if (renderer) return;
  renderer = new THREE.WebGLRenderer({ canvas: tuval, antialias: !hafif, powerPreference: 'high-performance' });
  renderer.setPixelRatio(hafif ? 1 : Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !hafif; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  kaplama = kaplamaTuval; kcx = kaplama.getContext('2d');
  sahne = new THREE.Scene();
  kamera = new THREE.PerspectiveCamera(38, 16 / 10, 0.1, 200);
  saat = new THREE.Clock();
  yukleyici = new GLTFLoader();
  const tl = new THREE.TextureLoader();
  // gökyüzü: büyük küre iç yüzü
  const gok = tl.load(kok + '../gorsel/gokyuzu.webp'); gok.colorSpace = THREE.SRGBColorSpace;
  const kure = new THREE.Mesh(new THREE.SphereGeometry(90, 64, 32), new THREE.MeshBasicMaterial({ map: gok, side: THREE.BackSide, fog: false }));
  kure.rotation.y = Math.PI; kure.position.y = 6; sahne.add(kure);
  sahne.background = new THREE.Color('#7d4d9e');
  sahne.fog = new THREE.Fog('#8a5aa8', 30, 75);
  // ışık: gün batımı
  sahne.add(new THREE.HemisphereLight('#ffd9f2', '#4a2f5c', 1.15));
  const gunes = new THREE.DirectionalLight('#ffc27a', 2.6); gunes.position.set(-6, 10, -8); gunes.castShadow = true;
  gunes.shadow.mapSize.set(2048, 2048); Object.assign(gunes.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 40 }); gunes.shadow.bias = -0.0005;
  sahne.add(gunes);
  const dolgu = new THREE.DirectionalLight('#9fc4ff', 0.7); dolgu.position.set(5, 6, 8); sahne.add(dolgu);
  await Promise.all([arenaKur(kok, tl), ualYukle(kok)]);
  boyutla();
  window.addEventListener('resize', boyutla);
}

// Model yükleme. Yayın paketinde modeller gömülü glTF (.json) olarak gelir: data: bağlantısı görüntüleyicide engellenebildiği için
// base64 veriyi burada çözüp bellekte GLB kurar ve öyle ayrıştırırız (ağ isteği yalnız .json dosyasının kendisi).
let yuklenen = 0, yuklenecek = 0; export const yukleme = { olay: null };
// Kısıtlı içerik politikasında (claude.ai) blob: adresine fetch yasak: GLTFLoader dokuları <img> ile okusun (vendor yaması, satır ~2591)
globalThis.KUT_IMG_YUKLEYICI = true;
function jsonDanGlb(json) {
  const b = json.buffers && json.buffers[0]; let bin = new Uint8Array(0);
  if (b && b.uri && b.uri.startsWith('data:')) { const ham = atob(b.uri.slice(b.uri.indexOf(',') + 1)); bin = new Uint8Array(ham.length); for (let i = 0; i < ham.length; i++) bin[i] = ham.charCodeAt(i); delete b.uri; }
  const js = new TextEncoder().encode(JSON.stringify(json)); const jsPad = (4 - js.length % 4) % 4, binPad = (4 - bin.length % 4) % 4;
  const toplam = 12 + 8 + js.length + jsPad + (bin.length ? 8 + bin.length + binPad : 0);
  const out = new ArrayBuffer(toplam), dv = new DataView(out), u8 = new Uint8Array(out); let o = 0;
  dv.setUint32(o, 0x46546c67, true); dv.setUint32(o + 4, 2, true); dv.setUint32(o + 8, toplam, true); o = 12;
  dv.setUint32(o, js.length + jsPad, true); dv.setUint32(o + 4, 0x4e4f534a, true); u8.set(js, o + 8); u8.fill(0x20, o + 8 + js.length, o + 8 + js.length + jsPad); o += 8 + js.length + jsPad;
  if (bin.length) { dv.setUint32(o, bin.length + binPad, true); dv.setUint32(o + 4, 0x004e4942, true); u8.set(bin, o + 8); }
  return out;
}
async function glb(ad, kok) {
  if (!modelOnbellek[ad]) {
    yuklenecek++;
    modelOnbellek[ad] = (async () => {
      const yol = kok + 'modeller/' + ad + '.glb';
      let veri;
      if (yol.endsWith('.json')) { const r = await fetch(yol); if (!r.ok) throw new Error(ad + ' yüklenemedi (' + r.status + ')'); veri = jsonDanGlb(await r.json()); }
      else { const r = await fetch(yol); if (!r.ok) throw new Error(ad + ' yüklenemedi (' + r.status + ')'); veri = await r.arrayBuffer(); }
      const g = await new Promise((tamam, hata) => yukleyici.parse(veri, '', tamam, (e) => hata(new Error(ad + ': ' + (e && e.message || e)))));
      yuklenen++; if (yukleme.olay) yukleme.olay(yuklenen, yuklenecek, ad);
      return g;
    })();
  }
  return modelOnbellek[ad];
}
function golgeAc(o) { o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; if (m.material) m.material.envMapIntensity = 1; } }); }
function olcekle(o, hedefBoy, eksen = 'y') {
  const k = new THREE.Box3().setFromObject(o), s = k.getSize(new THREE.Vector3());
  const boy = eksen === 'max' ? Math.max(s.x, s.y, s.z) : s.y; o.scale.multiplyScalar(hedefBoy / boy);
  const k2 = new THREE.Box3().setFromObject(o); return k2;
}

async function arenaKur(kok, tl) {
  const [ada, kemer, kristal, mantar, mangal, kayalar, yuzen] = await Promise.all(['ada', 'kemer', 'kristal', 'mantar', 'mangal', 'kayalar', 'yuzen_kaya'].map(a => glb(a, kok)));
  // ada platformu: üst yüzü tahtayı (6×8) rahatça taşısın
  const a = ada.scene.clone(); golgeAc(a);
  const k0 = new THREE.Box3().setFromObject(a), s0 = k0.getSize(new THREE.Vector3());
  a.scale.multiplyScalar(12.5 / Math.max(s0.x, s0.z));
  let k = new THREE.Box3().setFromObject(a); a.position.y -= k.max.y - 0.02; a.position.x -= (k.min.x + k.max.x) / 2; a.position.z -= (k.min.z + k.max.z) / 2;
  sahne.add(a);
  // tahta: taş karolar (doku 6×6 karo içerir → 1 doku = 6 hücre)
  const tas = tl.load(kok + '../gorsel/doku_tas.webp'); tas.colorSpace = THREE.SRGBColorSpace; tas.wrapS = tas.wrapT = THREE.RepeatWrapping; tas.repeat.set(1, 8 / 6); tas.anisotropy = 8;
  const tahta = new THREE.Mesh(new THREE.PlaneGeometry(6, 8), new THREE.MeshStandardMaterial({ map: tas, roughness: 0.9 }));
  tahta.rotation.x = -Math.PI / 2; tahta.position.y = 0.014; tahta.receiveShadow = true; sahne.add(tahta);
  // çimen kenar halkası
  const cim = tl.load(kok + '../gorsel/doku_cimen.webp'); cim.colorSpace = THREE.SRGBColorSpace; cim.wrapS = cim.wrapT = THREE.RepeatWrapping; cim.repeat.set(4, 4);
  const kenar = new THREE.Mesh(new THREE.RingGeometry(5.32, 6.3, 72), new THREE.MeshStandardMaterial({ map: cim, roughness: 1 }));
  kenar.rotation.x = -Math.PI / 2; kenar.position.y = 0.006; kenar.receiveShadow = true; sahne.add(kenar);
  // tahtanın çevresi: yuvarlak taş döşeme (tahta ile çimen arasındaki boşluğu kapatır; konseptteki taş avlu)
  const tas2 = tas.clone(); tas2.needsUpdate = true; tas2.repeat.set(10 / 6 * 0.75, 10 / 6 * 0.75); tas2.offset.set(0.37, 0.21);
  const avlu = new THREE.Mesh(new THREE.CircleGeometry(5.06, 72), new THREE.MeshStandardMaterial({ map: tas2, color: '#b9a49a', roughness: 0.95 }));
  avlu.rotation.x = -Math.PI / 2; avlu.position.y = 0.008; avlu.receiveShadow = true; sahne.add(avlu);
  // avlu ile çimen arası: hafif yükseltilmiş taş kenar (bordür) ve altın şerit
  const bordurMat = new THREE.MeshStandardMaterial({ color: '#8a7480', roughness: 0.85 });
  const bordur = new THREE.Mesh(new THREE.RingGeometry(5.04, 5.34, 72), bordurMat); bordur.rotation.x = -Math.PI / 2; bordur.position.y = 0.05; bordur.receiveShadow = true; sahne.add(bordur);
  const duvar = new THREE.Mesh(new THREE.CylinderGeometry(5.34, 5.34, 0.05, 72, 1, true), bordurMat); duvar.position.y = 0.025; sahne.add(duvar);
  const icDuvar = new THREE.Mesh(new THREE.CylinderGeometry(5.04, 5.04, 0.045, 72, 1, true), new THREE.MeshStandardMaterial({ color: '#5e4a5c', roughness: 0.9, side: THREE.BackSide })); icDuvar.position.y = 0.03; sahne.add(icDuvar);
  const serit = new THREE.Mesh(new THREE.RingGeometry(5.12, 5.17, 96), new THREE.MeshBasicMaterial({ color: '#e8b54a', transparent: true, opacity: 0.8 })); serit.rotation.x = -Math.PI / 2; serit.position.y = 0.052; sahne.add(serit);
  // tahta çerçevesi: oyun alanını avludan ayıran ince taş kenar
  const cerceveMat = new THREE.MeshStandardMaterial({ color: '#6b5566', roughness: 0.8 });
  for (const [w, d, x, z] of [[6.16, 0.08, 0, -4.04], [6.16, 0.08, 0, 4.04], [0.08, 8.16, -3.04, 0], [0.08, 8.16, 3.04, 0]]) { const c = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), cerceveMat); c.position.set(x, 0.02, z); c.receiveShadow = true; sahne.add(c); }
  // orta çizgi (altın, parlak)
  const cizgi = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 0.07), new THREE.MeshBasicMaterial({ color: '#ffc94a', transparent: true, opacity: 0.95 }));
  cizgi.rotation.x = -Math.PI / 2; cizgi.position.y = 0.02; sahne.add(cizgi);
  { const c = document.createElement('canvas'); c.width = 8; c.height = 64; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, 'rgba(255,190,70,0)'); g.addColorStop(0.5, 'rgba(255,190,70,0.55)'); g.addColorStop(1, 'rgba(255,190,70,0)'); x.fillStyle = g; x.fillRect(0, 0, 8, 64);
    const parilti = new THREE.Mesh(new THREE.PlaneGeometry(6.1, 0.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    parilti.rotation.x = -Math.PI / 2; parilti.position.y = 0.021; sahne.add(parilti);
    efektler.push({ kalici: true, o: parilti, guncelle: (t) => { parilti.material.opacity = 0.75 + Math.sin(t * 2.2) * 0.25; } }); }
  // çevre nesneleri
  const koy = (g, x, z, boy, ry = 0, eksen = 'y') => { const o = g.scene.clone(); golgeAc(o); olcekle(o, boy, eksen); const kk = new THREE.Box3().setFromObject(o); o.position.set(x, -kk.min.y, z); o.rotation.y = ry; sahne.add(o); return o; };
  // çevre nesneleri adanın üst yüzünde, çimen halkasında dizilir; açı +z'den (oyuncu tarafı) ölçülür, nesne merkeze bakar
  const kutup = (derece, r) => { const a = derece * Math.PI / 180; return [Math.sin(a) * r, Math.cos(a) * r, a + Math.PI]; };
  const halkaya = (g, derece, r, boy, eksen) => { const [x, z, ry] = kutup(derece, r); return koy(g, x, z, boy, ry, eksen); };
  halkaya(kemer, 180, 5.5, 2.6); halkaya(kemer, 146, 5.55, 2.0); halkaya(kemer, 214, 5.55, 2.0);
  for (const d of [55, 305, 118, 242]) halkaya(kristal, d, 5.65, 1.0);
  halkaya(mantar, 88, 5.7, 1.4); halkaya(mantar, 272, 5.7, 1.25);
  for (const d of [28, 332]) { const m = halkaya(mangal, d, 5.5, 0.85); atesEkle(m.position.clone().add(new THREE.Vector3(0, 0.9, 0))); }
  halkaya(kayalar, 163, 5.8, 0.55); halkaya(kayalar, 197, 5.8, 0.5);
  for (const [x, y, z, s] of [[-11, 2.5, -9, 3.5], [12, 4, -12, 4.5], [-14, -1, 4, 3], [13, 0.5, 6, 2.6]]) { const o = yuzen.scene.clone(); olcekle(o, s, 'max'); o.position.set(x, y, z); sahne.add(o); efektler.push({ kalici: true, o, faz: x, guncelle: (t) => { o.position.y = y + Math.sin(t * 0.5 + x) * 0.25; } }); }
}
function atesEkle(p) {
  const g = new THREE.Group(); g.position.copy(p); sahne.add(g);
  const isik = new THREE.PointLight('#ff8a3a', 4, 4, 1.8); g.add(isik);
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(0.16 - i * 0.04, 0.5 - i * 0.1, 8), new THREE.MeshBasicMaterial({ color: ['#ff5a1f', '#ff9a2e', '#ffe07a'][i], transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.position.y = 0.2; g.add(m);
  }
  efektler.push({ kalici: true, o: g, guncelle: (t) => { g.children.forEach((c, i) => { if (c.isMesh) { c.scale.set(1 + Math.sin(t * 9 + i) * 0.12, 1 + Math.sin(t * 13 + i * 2) * 0.2, 1); } }); isik.intensity = 3.5 + Math.sin(t * 17) * 0.6; } });
}

async function ualYukle(kok) {
  const g = await glb('ual', kok);
  ual = { sahne: g.scene, klip: Object.fromEntries(g.animations.map(c => [c.name, c])) };
}

export function boyutla() {
  if (!renderer) return;
  const c = renderer.domElement, w = c.clientWidth, h = c.clientHeight; if (!w || !h) return;
  renderer.setSize(w, h, false); kamera.aspect = w / h;
  // tahtanın tamamı görünsün: yatay tablette kamera oyuncu tarafının arkasında, ~52° eğik
  const dar = w / h < 1.45;
  kamera.fov = dar ? 40 : 34;
  kamera.position.set(0, dar ? 9.8 : 8.9, dar ? 8.4 : 7.6); kamera.lookAt(0, 0, 0.35);
  kamera.updateProjectionMatrix();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  kaplama.width = w * dpr; kaplama.height = h * dpr; kcx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// ── Birimler ──
async function birimKur(u, kok) {
  const h = D.kahraman(u.b.h), gor = GORSEL[u.b.h];
  const g = await glb(u.b.h, kok);
  const model = SkeletonUtils.clone(g.scene); golgeAc(model);
  const kok3 = new THREE.Group(); const govde = new THREE.Group(); kok3.add(govde); govde.add(model);
  // yön: iki ayaklılar +Z'ye bakar; dört ayaklı ve yılanın ön yönü kemiklerden bulunur
  let kemik = {}; model.traverse(o => { if (o.isBone) kemik[o.name.replace('mixamorig', '').replace(':', '')] = o; });
  model.updateMatrixWorld(true);
  if (gor.tur !== 'iki') {
    const bas = kemik.tripoHead_0 || kemik.tripoHead_1, arka = kemik.tripoSpine_0 || kemik.tripoRoot;
    if (bas && arka) { const v = wp(bas).sub(wp(arka)); v.y = 0; if (v.lengthSq() > 1e-6) model.rotation.y = -Math.atan2(v.x, v.z); }
  }
  model.updateMatrixWorld(true);
  const boy = gor.tur === 'iki' ? 1.15 : 1.25;
  const kk = olcekle(model, boy, gor.tur === 'iki' ? 'y' : 'max');
  model.position.y -= kk.min.y; const kk2 = new THREE.Box3().setFromObject(model); model.position.x -= (kk2.min.x + kk2.max.x) / 2; model.position.z -= (kk2.min.z + kk2.max.z) / 2;
  const yildiz = [1, 1, 1.12, 1.25][u.b.s || 1]; kok3.scale.setScalar(yildiz);
  // taraf halkası + kaynaşma halkası + ★3 parıltısı
  const halka = new THREE.Mesh(new THREE.RingGeometry(0.36, 0.45, 40), new THREE.MeshBasicMaterial({ color: u.taraf === 0 ? '#59d0ff' : '#ff5a6a', transparent: true, opacity: 0.85, depthWrite: false }));
  halka.rotation.x = -Math.PI / 2; halka.position.y = 0.03; kok3.add(halka);
  if (u.b.f) {
    const f = D.kahraman(u.b.f);
    const h2 = new THREE.Mesh(new THREE.RingGeometry(0.49, 0.56, 40), new THREE.MeshBasicMaterial({ color: f.renk, transparent: true, opacity: 0.95, depthWrite: false }));
    h2.rotation.x = -Math.PI / 2; h2.position.y = 0.035; kok3.add(h2);
    model.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.emissive = new THREE.Color(f.renk); m.material.emissiveIntensity = 0.18; } });
  }
  const p = dunya(u.x, u.y); kok3.position.copy(p); kok3.rotation.y = u.taraf === 0 ? Math.PI : 0;
  sahne.add(kok3);
  const b = { uid: u.uid, u, kok: kok3, govde, model, kemik, gor, durum: 'bekle', tekBitis: 0, olumT: -1, oncekiX: u.x, oncekiY: u.y, hedefAci: kok3.rotation.y, faz: (u.uid * 0.37) % 1 };
  if (gor.tur === 'iki' && ual) iskeleKur(b);
  if (gor.tur !== 'iki') dortKur(b);
  return b;
}

// İki ayaklı: görünmez UAL iskeleti oynar; her karede kemik yön farkları yaratığın KENDİ gövde düzleminde hedefe aktarılır
function iskeleKur(b) {
  const kaynak = SkeletonUtils.clone(ual.sahne); kaynak.traverse(m => { if (m.isMesh || m.isSkinnedMesh) m.visible = false; });
  const SB = {}; kaynak.traverse(m => { if (m.isBone) SB[m.name.replace(/\./g, '')] = m; });
  sahne.add(kaynak); kaynak.position.set(0, -50, 0);
  const mix = new THREE.AnimationMixer(kaynak);
  const eylem = {}; for (const ad in ual.klip) eylem[ad] = mix.clipAction(ual.klip[ad]);
  eylem.A_TPose.play(); mix.setTime(0); kaynak.updateMatrixWorld(true);
  const sRef = {}, sRefP = {};
  for (const k in MAP) if (SB[MAP[k]]) { sRef[k] = wq(SB[MAP[k]]); sRefP[k] = wp(SB[MAP[k]]).sub(kaynak.position); }
  eylem.A_TPose.stop();
  b.model.updateMatrixWorld(true);
  const TB = b.kemik, G0inv = wq(b.model).invert(), tRel = {}, tRelP = {}, al = {};
  for (const k in MAP) if (TB[k]) { tRel[k] = G0inv.clone().multiply(wq(TB[k])); tRelP[k] = b.model.worldToLocal(wp(TB[k])); }
  for (const k in MAP) {
    if (!TB[k] || !sRef[k]) continue; const c = COCUK[k]; const A = new THREE.Quaternion();
    if (c && tRelP[c] && sRefP[c]) { const dt = tRelP[c].clone().sub(tRelP[k]).normalize(), ds = sRefP[c].clone().sub(sRefP[k]).normalize(); A.setFromUnitVectors(dt, ds); }
    al[k] = A.multiply(tRel[k].clone());
  }
  const kutu = new THREE.Box3().setFromObject(b.model); const tabanYerel = b.model.worldToLocal(kutu.min.clone()).y;
  const hipS = TB.Hips && sRefP.Hips ? (tRelP.Hips.y - tabanYerel) / Math.max(1e-4, sRefP.Hips.y) : 1;
  b.isk = { kaynak, SB, mix, eylem, sRef, sRefP, al, tRelP, hipS, aktif: null };
  oyna(b, 'Idle_Loop', { dongu: true, gecis: 0 }); b.isk.mix.setTime(b.faz * 2.5);
}
function oyna(b, ad, { dongu = false, gecis = 0.15, hiz = 1, tut = false } = {}) {
  const i = b.isk; if (!i) return; const e = i.eylem[ad]; if (!e) return;
  e.reset(); e.setLoop(dongu ? THREE.LoopRepeat : THREE.LoopOnce, Infinity); e.clampWhenFinished = !dongu || tut; e.timeScale = hiz; e.enabled = true; e.setEffectiveWeight(1);
  if (i.aktif && i.aktif !== e) { e.crossFadeFrom(i.aktif, gecis, false); }
  e.play(); i.aktif = e; i.aktifAd = ad;
}
function aktar(b) {
  const i = b.isk; if (!i) return;
  i.kaynak.updateMatrixWorld(true); b.model.updateMatrixWorld(true);
  const M = wq(b.model);
  for (const k of SIRA) {
    const t = b.kemik[k], s = i.SB[MAP[k]]; if (!t || !s || !i.al[k]) continue;
    const delta = wq(s).multiply(i.sRef[k].clone().invert());          // kaynakta (köke göre) yön değişimi
    const istenen = M.clone().multiply(delta).multiply(i.al[k]);       // hedef gövde düzleminde aynı değişim
    t.quaternion.copy(wq(t.parent).invert().multiply(istenen));
    if (k === 'Hips') {
      const off = wp(s).sub(i.kaynak.position).sub(i.sRefP.Hips).multiplyScalar(i.hipS);
      const yerel = i.tRelP.Hips.clone().add(off);
      t.position.copy(t.parent.worldToLocal(b.model.localToWorld(yerel)));
    }
    t.updateMatrixWorld(true);
  }
}

// Dört ayaklı / yılan: kemikleri dünya eksenine göre döndüren yardımcı
function dortKur(b) {
  const K = b.kemik; b.model.updateMatrixWorld(true);
  b.govde.updateMatrixWorld(true); const G0inv = wq(b.govde).invert();
  const rest = {}; for (const n in K) rest[n] = { q: K[n].quaternion.clone(), rel: G0inv.clone().multiply(wq(K[n])) };
  const grup = (on) => Object.keys(K).filter(n => n.startsWith(on)).sort();
  const bacak = (oz) => grup(oz);
  b.dort = { rest,
    onSol: bacak('tripo0_Left_Limb'), onSag: bacak('tripo0_Right_Limb'), arkaSol: bacak('tripo1_Left_Limb'), arkaSag: bacak('tripo1_Right_Limb'),
    omurga: grup('tripoSpine'), bas: grup('tripoHead'), kuyruk: grup('tripoTail'), adim: 0, hamle: 0, sahlan: 0, devril: 0, sars: 0, donus: 0, uzan: 0 };
}
// kemiği dünya eksenine göre (gövdenin yerel ekseninde) açıyla döndür; rest'e göre mutlak
function kemikDon(b, ad, eksen, aci) {
  const K = b.kemik[ad]; if (!K) return; const r = b.dort.rest[ad];
  const yerel = eksen.clone().applyQuaternion(r.rel.clone().invert()).normalize();   // gövde eksenini kemiğin dinlenme uzayına çevir
  K.quaternion.copy(r.q).multiply(new THREE.Quaternion().setFromAxisAngle(yerel, aci));
}
const YANAL = new THREE.Vector3(1, 0, 0), DIKEY = new THREE.Vector3(0, 1, 0), ILERI = new THREE.Vector3(0, 0, 1);
function dortGuncelle(b, dt, t, hareket, hiz) {
  const d = b.dort; if (!d) return;
  for (const n in d.rest) b.kemik[n].quaternion.copy(d.rest[n].q);
  b.model.updateMatrixWorld(true);
  if (b.gor.tur === 'yilan') {
    d.bas.forEach((n, i) => kemikDon(b, n, YANAL, Math.sin(t * 2.2 - i * 0.6) * 0.06 - d.hamle * 0.35 * (i < 2 ? 1 : -0.5) - d.uzan * 0.2));
    d.bas.forEach((n, i) => kemikDon(b, n, DIKEY, Math.sin(t * 1.3 - i * 0.5) * 0.12));
    d.kuyruk.forEach((n, i) => kemikDon(b, n, DIKEY, Math.sin(t * 1.6 - i * 0.7) * 0.15));
  } else {
    if (hareket) d.adim += dt * hiz * 2.2 * Math.PI * 2;
    const genlik = hareket ? 0.38 : 0;
    const sal = (liste, faz) => liste.forEach((n, i) => { if (i === 0) kemikDon(b, n, YANAL, Math.sin(d.adim + faz) * genlik - d.sahlan * 0.6 * (liste === d.onSol || liste === d.onSag ? 1 : 0)); if (i === 1) kemikDon(b, n, YANAL, Math.max(0, Math.sin(d.adim + faz + 1.2)) * genlik * 0.9); });
    sal(d.onSol, 0); sal(d.arkaSag, 0); sal(d.onSag, Math.PI); sal(d.arkaSol, Math.PI);
    d.omurga.forEach((n, i) => kemikDon(b, n, YANAL, (i === 0 ? -d.sahlan * 0.5 : 0) + Math.sin(t * 2.5) * 0.015));
    d.bas.forEach((n, i) => kemikDon(b, n, YANAL, i === 0 ? d.hamle * 0.35 - d.uzan * 0.6 + d.sahlan * 0.3 : 0));
    d.kuyruk.forEach((n, i) => kemikDon(b, n, DIKEY, Math.sin(t * 3 + i * 0.8) * 0.18));
    b.govde.position.y = hareket ? Math.abs(Math.sin(d.adim)) * 0.035 : 0;
  }
  b.govde.position.z = d.hamle * 0.3;
  b.govde.rotation.y = d.donus;
  b.govde.rotation.z = d.devril * Math.PI / 2;
  b.govde.position.x = Math.sin(t * 60) * d.sars * 0.04;
  // sönümler
  d.hamle = Math.max(0, d.hamle - dt * 2.2); d.sahlan = Math.max(0, d.sahlan - dt * 1.4); d.sars = Math.max(0, d.sars - dt * 6); d.uzan = Math.max(0, d.uzan - dt * 1.6);
  if (d.donusHiz) { d.donus += d.donusHiz * dt; if (Math.abs(d.donus) >= Math.PI * 2) { d.donus = 0; d.donusHiz = 0; } }
}

// ── Savaşı kur ──
export async function savasKur(yeniSim, kok = '') {
  for (const b of birimler.values()) { sahne.remove(b.kok); if (b.isk) sahne.remove(b.isk.kaynak); }
  for (const e of efektler) if (!e.kalici) sahne.remove(e.o);
  efektler = efektler.filter(e => e.kalici); kuyruk = []; yazilar = []; birimler = new Map();
  sim = yeniSim; gorselT = 0; anlik = [];
  const liste = await Promise.all(sim.birimler.map(u => birimKur(u, kok)));
  for (const b of liste) birimler.set(b.uid, b);
  anlikAl(); // t=0
  saat.getDelta();
}
function anlikAl() {
  anlik.push(sim.birimler.map(u => ({ x: u.x, y: u.y, hp: u.hp, mx: u.mx, mp: u.mp, mana: u.mana, kalkan: u.kalkan, olu: u.olu, hedef: u.hedef ? u.hedef.uid : -1,
    sersem: !!u.durum.sersem, yavas: !!u.durum.yavas, yanik: !!u.durum.yanik, zehir: !!u.durum.zehir, lanet: !!u.durum.lanet, davul: !!u.durum.davul })));
}
function simIlerlet() {
  // motor görüntünün ONDE_SN önünde kalsın
  while (!sim.bitti && sim.t < gorselT + ONDE_SN) {
    const tOnce = sim.t; sim.adim();
    for (const f of sim.fx) olayPlanla({ ...f, t: tOnce });
    anlikAl();
  }
}
// Olaya göre görsel eylemleri zamanla
function olayPlanla(f) {
  const ekle = (t, is) => kuyruk.push({ t, is });
  const kaynak = birimler.get(f.k), hedef = birimler.get(f.u);
  if (f.tip === 'vurus' && kaynak) {
    const klip = kaynak.gor.tur === 'iki' ? kaynak.gor.saldir : null;
    const ucus = f.menzilli ? mesafeAl(f.k, f.u, f.t) / 12 : 0;
    const darbe = klip ? (DARBE[klip] || 0) : (kaynak.gor.tur === 'yilan' ? 0.22 : 0.15);
    ekle(f.t - ucus - darbe, () => saldiriBaslat(kaynak, klip));
    if (f.menzilli) ekle(f.t - ucus, () => mermiAt(kaynak, hedef, ucus));
  } else if (f.tip === 'yetenek') {
    const b = birimler.get(f.u); if (!b) return;
    ekle(f.t - 0.35, () => yetenekBaslat(b, f.ad));
    ekle(f.t, () => yetenekEfekt(b, f.ad));
  } else if (f.tip === 'hasar' || f.tip === 'dot' || f.tip === 'iyi' || f.tip === 'kalkan' || f.tip === 'kac') {
    ekle(f.t, () => sayiGoster(f));
    if (f.tip === 'hasar' && f.n > 60) ekle(f.t, () => vuruldu(birimler.get(f.u)));
  } else if (f.tip === 'olum') ekle(f.t, () => olumBaslat(birimler.get(f.u)));
  else if (f.tip === 'dirilis') ekle(f.t, () => dirilis(birimler.get(f.u)));
  else if (f.tip === 'kut') { /* dokunuş anında zaten gösterildi; tekrar oynatmada da göster */ ekle(f.t - ONDE_SN, () => kutSutun(birimler.get(f.u))); }
  else if (f.tip === 'simsek') ekle(f.t, () => simsekCiz(f.k, f.u));
}
function mesafeAl(a, b, t) {
  const i = Math.min(anlik.length - 1, Math.max(0, Math.round(t / DT))); const s = anlik[i]; const ua = sim.birimler.findIndex(u => u.uid === a), ub = sim.birimler.findIndex(u => u.uid === b);
  if (ua < 0 || ub < 0) return 2; return Math.hypot(s[ua].x - s[ub].x, s[ua].y - s[ub].y);
}

// ── Görsel eylemler ──
function saldiriBaslat(b, klip) {
  if (!b || b.olumT >= 0) return;
  if (b.isk && klip) { const u = b.u, sure = ual.klip[klip].duration, ara = 1 / (u.as * 1.0); const hiz = Math.max(1, sure / Math.max(0.35, ara)); oyna(b, klip, { hiz, gecis: 0.08 }); b.tekBitis = gorselT + sure / hiz; b.durum = 'saldir'; }
  else if (b.dort) { b.dort.hamle = 1; }
}
function yetenekBaslat(b, ad) {
  if (!b || b.olumT >= 0) return;
  if (b.isk) { const dizi = b.gor.yetenek || ['Spell_Simple_Enter', 'Spell_Simple_Shoot']; oyna(b, dizi[0], { gecis: 0.08 }); b.dizi = dizi.slice(1); b.tekBitis = gorselT + ual.klip[dizi[0]].duration; b.durum = 'yetenek'; }
  else if (b.dort) {
    const d = b.dort; const id = b.u.b.h;
    if (id === 'kurt') d.uzan = 1; else if (id === 'koc' || id === 'bulutat') d.sahlan = 1; else if (id === 'semender') d.donusHiz = Math.PI * 4; else if (id === 'kaplumbaga') d.hamle = 1; else if (id === 'yilan') d.uzan = 1;
  }
  halkaEfekt(b, SOY_RENK[b.u.soy[0]] || '#ffe08a', 1.2);
}
function yetenekEfekt(b, ad) {
  if (!b) return; const renk = SOY_RENK[b.u.soy[0]] || '#ffe08a';
  yaziEkle(b, D.YETENEK[ad] ? D.YETENEK[ad].ad : '', '#ffe28a', 1.25, true);
  parcacikPatlat(b.kok.position.clone().add(new THREE.Vector3(0, 0.6, 0)), renk, 26, 2.2);
  if (ad === 'kanat') for (const o of birimler.values()) if (o.u.taraf === b.u.taraf && o.olumT < 0) halkaEfekt(o, '#fff3c0', 0.7);
  if (ad === 'ayaz') for (const o of birimler.values()) if (o.u.taraf !== b.u.taraf && o.olumT < 0) parcacikPatlat(o.kok.position.clone().add(new THREE.Vector3(0, 0.4, 0)), '#bfeaff', 12, 1.2);
}
function vuruldu(b) {
  if (!b || b.olumT >= 0) return;
  if (b.isk && b.durum !== 'saldir' && b.durum !== 'yetenek') { oyna(b, 'Hit_Chest', { gecis: 0.05 }); b.tekBitis = gorselT + 0.33; b.durum = 'vurul'; }
  if (b.dort) b.dort.sars = 1;
  flas(b);
}
function olumBaslat(b) {
  if (!b) return; b.olumT = gorselT;
  if (b.isk) { oyna(b, 'Death01', { gecis: 0.1, tut: true }); }
  else if (b.dort) { b.dort.olum = true; }
  parcacikPatlat(b.kok.position.clone().add(new THREE.Vector3(0, 0.3, 0)), '#d8c8b0', 18, 1.4);
}
function dirilis(b) {
  if (!b) return; b.olumT = -1; parcacikPatlat(b.kok.position.clone().add(new THREE.Vector3(0, 0.5, 0)), '#ff7a2e', 50, 3); halkaEfekt(b, '#ff9a3a', 2);
  b.kok.visible = true; b.govde.rotation.z = 0; if (b.isk) { oyna(b, 'Jump_Land', { gecis: 0.05 }); b.tekBitis = gorselT + 1.0; b.durum = 'yetenek'; }
  yaziEkle(b, 'Yeniden Doğuş', '#ffb070', 1.3, true);
}

// ── Efektler ──
function mermiAt(a, h, sure) {
  if (!a || !h) return; const renk = SOY_RENK[a.u.soy[0]] || '#fff';
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), new THREE.MeshBasicMaterial({ color: renk }));
  const iz = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), new THREE.MeshBasicMaterial({ color: renk, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.add(iz); sahne.add(m);
  const bas = a.kok.position.clone().add(new THREE.Vector3(0, 0.75 * a.kok.scale.y, 0));
  efektler.push({ o: m, sure: Math.max(0.05, sure), yas: 0, guncelle: (t, e) => { const son = h.kok.position.clone().add(new THREE.Vector3(0, 0.55, 0)); m.position.lerpVectors(bas, son, e); m.position.y += Math.sin(e * Math.PI) * 0.4; },
    bitis: () => parcacikPatlat(h.kok.position.clone().add(new THREE.Vector3(0, 0.55, 0)), renk, 8, 1) });
}
function halkaEfekt(b, renk, r = 1) {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.2, 48), new THREE.MeshBasicMaterial({ color: renk, transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.copy(b.kok.position).setY(0.06); sahne.add(m);
  efektler.push({ o: m, sure: 0.6, yas: 0, guncelle: (t, e) => { m.scale.setScalar(1 + e * r * 7); m.material.opacity = 1 - e; } });
}
function kutSutun(b) {
  if (!b) return;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 9, 32, 1, true), new THREE.MeshBasicMaterial({ color: '#d7a6ff', transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
  m.position.copy(b.kok.position).setY(4.5); sahne.add(m);
  const ic = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 9, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#fff2c4', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })); m.add(ic);
  efektler.push({ o: m, sure: 1.0, yas: 0, guncelle: (t, e) => { m.material.opacity = 0.7 * (1 - e); ic.material.opacity = 0.9 * (1 - e); m.scale.set(1 + e * 0.6, 1, 1 + e * 0.6); } });
  parcacikPatlat(b.kok.position.clone().add(new THREE.Vector3(0, 0.4, 0)), '#ffd76a', 40, 2.5);
  yaziEkle(b, '✨ KUT', '#e6c2ff', 1.35, true);
  if (dinleyici.kut) dinleyici.kut(b.u);
}
function parcacikPatlat(p, renk, n = 16, hiz = 1.5) {
  const geo = new THREE.BufferGeometry(); const poz = new Float32Array(n * 3); const v = [];
  for (let i = 0; i < n; i++) { poz.set([p.x, p.y, p.z], i * 3); const a = (i / n) * Math.PI * 2 + Math.random(), y = Math.random(); v.push(new THREE.Vector3(Math.cos(a) * (0.5 + Math.random()), y * 1.4 + 0.3, Math.sin(a) * (0.5 + Math.random())).multiplyScalar(hiz)); }
  geo.setAttribute('position', new THREE.BufferAttribute(poz, 3));
  const m = new THREE.Points(geo, new THREE.PointsMaterial({ color: renk, size: 0.12, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  sahne.add(m);
  efektler.push({ o: m, sure: 0.7, yas: 0, guncelle: (t, e, dt) => { const a = geo.attributes.position; for (let i = 0; i < n; i++) { v[i].y -= 4 * dt; a.setXYZ(i, a.getX(i) + v[i].x * dt, Math.max(0.02, a.getY(i) + v[i].y * dt), a.getZ(i) + v[i].z * dt); } a.needsUpdate = true; m.material.opacity = 1 - e; } });
}
function simsekCiz(ku, uu) {
  const a = birimler.get(ku), b = birimler.get(uu); if (!a || !b) return;
  const p0 = a.kok.position.clone().add(new THREE.Vector3(0, 1.0, 0)), p1 = b.kok.position.clone().add(new THREE.Vector3(0, 0.5, 0));
  const nok = []; for (let i = 0; i <= 8; i++) { const p = p0.clone().lerp(p1, i / 8); if (i && i < 8) p.add(new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4)); nok.push(p); }
  const m = new THREE.Line(new THREE.BufferGeometry().setFromPoints(nok), new THREE.LineBasicMaterial({ color: '#fff27a', transparent: true }));
  sahne.add(m); efektler.push({ o: m, sure: 0.25, yas: 0, guncelle: (t, e) => { m.material.opacity = 1 - e; } });
}
function flas(b) {
  b.model.traverse(m => { if (m.isMesh && m.material) { if (!m.userData.flas) { m.material = m.material.clone(); m.userData.flas = true; m.userData.e0 = (m.material.emissive || new THREE.Color(0)).clone(); m.userData.ei = m.material.emissiveIntensity || 0; } m.material.emissive = new THREE.Color('#ffffff'); m.material.emissiveIntensity = 0.55; } });
  b.flasBitis = gorselT + 0.08;
}
function flasBitir(b) { b.model.traverse(m => { if (m.isMesh && m.userData.flas) { m.material.emissive.copy(m.userData.e0); m.material.emissiveIntensity = m.userData.ei; } }); b.flasBitis = 0; }

// ── 2D kaplama: çubuklar, durumlar, sayılar ──
function ekran(p) { const v = p.clone().project(kamera), c = kaplama; const w = c.clientWidth, h = c.clientHeight; return { x: (v.x + 1) / 2 * w, y: (1 - v.y) / 2 * h, z: v.z }; }
function yaziEkle(b, metin, renk, olcek = 1, buyuk = false) {
  const ayni = yazilar.filter(y => y.uid === b.uid && y.yas < 0.35).length;
  yazilar.push({ uid: b.uid, p: b.kok.position.clone().add(new THREE.Vector3(((ayni % 3) - 1) * 0.32, 1.5 * b.kok.scale.y + Math.floor(ayni / 3) * 0.22, 0)), metin, renk, yas: 0, olcek, buyuk });
}
function sayiGoster(f) {
  const b = birimler.get(f.u); if (!b) return;
  const m = { hasar: ['-' + f.n, f.n >= 200 ? '#ffd84a' : '#ffffff'], dot: ['-' + f.n, '#ffb36a'], iyi: ['+' + f.n, '#7dffa0'], kalkan: ['🛡' + f.n, '#dfe9ff'], kac: ['kaçtı', '#cfcfcf'] }[f.tip];
  if (!m || (f.tip !== 'kac' && f.n < 5)) return;
  yaziEkle(b, m[0], m[1], f.tip === 'hasar' && f.n >= 200 ? 1.35 : 1, f.tip === 'hasar' && f.n >= 200);
}
function kaplamaCiz() {
  const w = kaplama.clientWidth, h = kaplama.clientHeight; kcx.clearRect(0, 0, w, h);
  const s = anlikGorsel();
  if (s) for (const [uid, b] of birimler) {
    const i = sim.birimler.findIndex(u => u.uid === uid), a = s[i]; if (!a || a.olu) continue;
    const p = ekran(b.kok.position.clone().add(new THREE.Vector3(0, 1.38 * b.kok.scale.y, 0)));
    const gw = 58, x = p.x - gw / 2, y = p.y;
    kcx.fillStyle = 'rgba(10,6,24,.72)'; yuvarlak(x - 2, y - 2, gw + 4, 13, 4); kcx.fill();
    kcx.fillStyle = b.u.taraf === 0 ? '#5be37f' : '#ff5a6a'; yuvarlak(x, y, gw * Math.max(0, a.hp / a.mx), 6, 3); kcx.fill();
    if (a.kalkan > 0) { kcx.fillStyle = '#eef3ff'; kcx.fillRect(x, y, Math.min(gw, gw * a.kalkan / a.mx), 2); }
    kcx.fillStyle = '#6fb8ff'; yuvarlak(x, y + 7.5, gw * a.mp / a.mana, 2.5, 1.2); kcx.fill();
    const yl = b.u.b.s || 1; if (yl > 1) { kcx.font = 'bold 11px system-ui'; kcx.fillStyle = '#ffd36a'; kcx.textAlign = 'center'; kcx.fillText('★'.repeat(yl), p.x, y - 5); }
    const ik = []; if (a.sersem) ik.push('💫'); if (a.yavas) ik.push('❄️'); if (a.yanik) ik.push('🔥'); if (a.zehir) ik.push('🧪'); if (a.lanet) ik.push('👁'); if (a.davul) ik.push('🥁');
    if (ik.length) { kcx.font = '13px system-ui'; kcx.textAlign = 'center'; kcx.fillText(ik.join(''), p.x, y - (yl > 1 ? 18 : 6)); }
  }
  for (const y of yazilar) {
    const p = ekran(y.p); const e = y.yas / 0.95; kcx.globalAlpha = Math.max(0, 1 - e * e);
    kcx.font = `900 ${Math.round((y.buyuk ? 22 : 16) * y.olcek)}px system-ui`; kcx.textAlign = 'center'; kcx.lineWidth = 4; kcx.strokeStyle = 'rgba(20,8,40,.85)';
    const yy = p.y - e * 38; kcx.strokeText(y.metin, p.x, yy); kcx.fillStyle = y.renk; kcx.fillText(y.metin, p.x, yy);
  }
  kcx.globalAlpha = 1;
}
function yuvarlak(x, y, w, h, r) { r = Math.min(r, h / 2, Math.max(0, w) / 2); kcx.beginPath(); kcx.moveTo(x + r, y); kcx.arcTo(x + w, y, x + w, y + h, r); kcx.arcTo(x + w, y + h, x, y + h, r); kcx.arcTo(x, y + h, x, y, r); kcx.arcTo(x, y, x + w, y, r); kcx.closePath(); }
function anlikGorsel() { const i = gorselT / DT; const a = Math.floor(i); const s0 = anlik[Math.min(a, anlik.length - 1)], s1 = anlik[Math.min(a + 1, anlik.length - 1)]; if (!s0) return null; const k = Math.min(1, i - a);
  return s0.map((x, j) => ({ ...x, x: x.x + (s1[j].x - x.x) * k, y: x.y + (s1[j].y - x.y) * k, hp: x.hp + (s1[j].hp - x.hp) * k, mp: s1[j].mp, kalkan: s1[j].kalkan })); }

// ── Kare döngüsü ──
export function kare(dtSabit) {
  if (!renderer) return { bitti: false };
  const dtGercek = dtSabit !== undefined ? dtSabit : Math.min(0.05, saat.getDelta());
  const t = performance.now() / 1000;
  for (const e of efektler) if (e.kalici) e.guncelle(t);
  if (sim) {
    const dt = dtGercek * hizKati;
    const son = sim.bitti ? (anlik.length - 1) * DT + 1.6 : Infinity;
    gorselT = Math.min(gorselT + dt, son);
    simIlerlet();
    kuyruk.sort((a, b) => a.t - b.t);
    while (kuyruk.length && kuyruk[0].t <= gorselT) kuyruk.shift().is();
    const s = anlikGorsel();
    for (const [uid, b] of birimler) {
      const i = sim.birimler.findIndex(u => u.uid === uid), a = s[i];
      const hedef = dunya(a.x, a.y);
      const hareket = Math.hypot(a.x - b.oncekiX, a.y - b.oncekiY) > 0.002 * Math.max(1, hizKati); b.oncekiX = a.x; b.oncekiY = a.y;
      b.kok.position.x = hedef.x; b.kok.position.z = hedef.z;
      // hedefe dön
      if (a.hedef >= 0 && b.olumT < 0) { const hb = birimler.get(a.hedef); if (hb) { const v = hb.kok.position.clone().sub(b.kok.position); const aci = Math.atan2(v.x, v.z); let fark = aci - b.kok.rotation.y; fark = Math.atan2(Math.sin(fark), Math.cos(fark)); b.kok.rotation.y += fark * Math.min(1, dt * 10); } }
      // animasyon durumu
      if (b.isk) {
        if (b.olumT < 0) {
          if ((b.durum === 'saldir' || b.durum === 'yetenek' || b.durum === 'vurul') && gorselT >= b.tekBitis) {
            if (b.dizi && b.dizi.length) { const n = b.dizi.shift(); const loop = n.endsWith('_Loop'); oyna(b, n, { gecis: 0.06 }); b.tekBitis = gorselT + (loop ? 0.6 : ual.klip[n].duration); }
            else b.durum = '';
          }
          if (b.durum === '' || b.durum === 'bekle' || b.durum === 'yuru') {
            const istek = hareket ? (b.u.soy.includes('atli') ? 'Jog_Fwd_Loop' : 'Walk_Loop') : 'Idle_Loop';
            if (b.isk.aktifAd !== istek) oyna(b, istek, { dongu: true, gecis: 0.2 }); b.durum = hareket ? 'yuru' : 'bekle';
          }
        }
        b.isk.mix.update(dt); aktar(b);
        if (b.gor.kanat && b.olumT < 0) { for (const k of ['LeftArm', 'RightArm']) { const kk = b.kemik[k]; if (kk) kk.rotateZ(Math.sin(t * 10) * 0.05 * (k === 'LeftArm' ? 1 : -1)); } }
      } else if (b.dort) {
        if (b.dort.olum) b.dort.devril = Math.min(1, b.dort.devril + dt * 1.7);
        dortGuncelle(b, dt, t + b.faz * 10, hareket && b.olumT < 0, Math.max(1, hizKati));
      }
      if (b.flasBitis && gorselT >= b.flasBitis) flasBitir(b);
      // ölüm sonrası erime
      if (b.olumT >= 0 && gorselT - b.olumT > 1.8) { const e = Math.min(1, (gorselT - b.olumT - 1.8) / 0.6); b.kok.position.y = -e * 0.6; if (e >= 1) b.kok.visible = false; }
      else b.kok.position.y = 0;
    }
    for (const y of yazilar) y.yas += dt; yazilar = yazilar.filter(y => y.yas < 0.95);
    efektler = efektler.filter(e => { if (e.kalici) return true; e.yas += dt; const k = Math.min(1, e.yas / e.sure); e.guncelle(t, k, dt); if (k >= 1) { sahne.remove(e.o); if (e.bitis) e.bitis(); return false; } return true; });
  }
  renderer.render(sahne, kamera);
  if (sim) kaplamaCiz();
  return { bitti: !!(sim && sim.bitti && gorselT >= (anlik.length - 1) * DT + ONDE_SN), sonuc: sim && sim.sonuc, t: gorselT };
}

// ── Dışa açık ──
export function hiz(k) { hizKati = k; }
export function dinle(olay, fn) { dinleyici[olay] = fn; }
/** Oyuncu dokunuşu: ekran koordinatı → kendi yaratığı; Kut uygulanırsa true */
export function dokun(x, y) {
  if (!sim || sim.bitti || !sim.kutVar(0)) return false;
  let en = null, m = 70;
  for (const [uid, b] of birimler) { if (b.u.taraf !== 0 || b.olumT >= 0) continue; const p = ekran(b.kok.position.clone().add(new THREE.Vector3(0, 0.6, 0))); const d = Math.hypot(p.x - x, p.y - y); if (d < m) { m = d; en = b; } }
  if (!en) return false;
  const u = sim.birimler.find(o => o.uid === en.uid); if (!u || u.olu) return false;
  if (sim.kut(0, u.i)) { kutSutun(en); return u; }
  return false;
}
export function zafer(taraf) { for (const b of birimler.values()) if (b.u.taraf === taraf && b.olumT < 0 && b.isk) { oyna(b, 'Dance_Loop', { dongu: true, gecis: 0.2 }); b.durum = 'zafer'; } }
export function temizle() { sim = null; }
// hata ayıklama: kamerayı yerleştir
export function kameraYerlestir(y, z) { kamera.position.set(0, y, z); kamera.lookAt(0, 0, 0); kamera.fov = 50; kamera.updateProjectionMatrix(); }
// hata ayıklama: yakın kamera
export function yakinKamera(uid, uzak = 2.4, aci = 0.5) { const b = birimler.get(uid); if (!b) return; const p = b.kok.position; kamera.position.set(p.x + Math.sin(aci) * uzak, 1.4, p.z + Math.cos(aci) * uzak); kamera.lookAt(p.x, 0.6, p.z); }
