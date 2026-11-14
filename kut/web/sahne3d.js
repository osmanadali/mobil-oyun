/* Kut Arena — 3D savaş sahnesi (tarayıcı sürümü). Kurallar: ../ANIMASYON_PLANI.md
   Motor (../sim.js) görüntünün ÖNDE_SN kadar önünde koşar; olaylar zaman damgalı kuyruğa girer,
   saldırı klipleri darbe karesi olay zamanına denk gelecek şekilde önceden başlatılır. */
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from '../vendor/three/addons/utils/SkeletonUtils.js';
import * as G from './gorunum.js';
import { vfx } from './vfx.js';
import { his, dortAyakliKur, dortAyakliGuncelle, yilanKur, yilanGuncelle, ikiAyakliKur, ikiAyakliGuncelle, onYonAci } from './hareket.js';

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
// menzilli vuruş mermisinin türü (vfx.mermi)
const MERMI_TUR = { golem: 'kaya', kurbaga: 'ses', anka: 'ates', semender: 'ates', ejder: 'ates', baykus: 'buz', kaplumbaga: 'buz', yilan: 'zehir', kugu: 'isik', tilki: 'ok' };
const renkAl = (b) => SOY_RENK[b.u.soy[0]] || '#ffe08a';

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
let hafif = false, kutlu = new Set();   // kutlu: Kut ile dolan (bir sonraki yeteneği büyük oynanacak) birim uid'leri

function hafifOku() { try { return localStorage.getItem('kut.hafif') === '1'; } catch (e) { return false; } }

// ── Kurulum ──
export async function hazirla(tuval, kaplamaTuval, kok = '', ops = {}) {
  if (renderer) return;
  hafif = ops.hafif !== undefined ? !!ops.hafif : hafifOku();
  const kalite = hafif ? 'hafif' : 'yuksek';
  // yüksek kalitede kenar yumuşatma composer'ın MSAA hedefinde yapılır; tuvalin kendi MSAA'sı gereksiz
  renderer = new THREE.WebGLRenderer({ canvas: tuval, antialias: false, powerPreference: 'high-performance' });
  kaplama = kaplamaTuval; kcx = kaplama.getContext('2d');
  sahne = new THREE.Scene();
  kamera = new THREE.PerspectiveCamera(38, 16 / 10, 0.1, 200);
  G.kur(renderer, sahne, kamera, { kalite });   // ton eşleme, gölge, gün batımı çevre ışığı, bloom (yuksek)
  saat = new THREE.Clock();
  yukleyici = new GLTFLoader();
  const tl = new THREE.TextureLoader();
  // gökyüzü: büyük küre iç yüzü
  const gok = tl.load(kok + '../gorsel/gokyuzu.webp'); gok.colorSpace = THREE.SRGBColorSpace;
  const kure = new THREE.Mesh(new THREE.SphereGeometry(90, 64, 32), new THREE.MeshBasicMaterial({ map: gok, side: THREE.BackSide, fog: false }));
  kure.rotation.y = Math.PI; kure.position.y = 6; sahne.add(kure);
  sahne.background = new THREE.Color('#7d4d9e');
  sahne.fog = new THREE.Fog('#8a5aa8', 30, 75);
  // ışık: gün batımı üç nokta düzeni (ana güneş kamera tarafından, arkadan kenar ışığı, gökten dolgu)
  G.isikKur(sahne, { kalite, alan: 7 });
  await Promise.all([arenaKur(kok, tl), ualYukle(kok)]);
  vfx.kur(sahne, kamera, { kalite, zeminY: ARENA_Y, isik: true });
  boyutla();
  his.kur(kamera, { kalite, sahne });
  // gökten giriş yere çarpınca küçük doğuş efekti (ölümdeki yığılma tozunu vfx.olum yapar)
  his.dinle('toz', ({ konum, guc }) => { if (guc >= 1) vfx.spawn(konum); });
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
  const cizgi = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 0.07), new THREE.MeshBasicMaterial({ color: hafif ? new THREE.Color('#ffc94a') : G.parlakRenk('#ffc94a', 1.6), transparent: true, opacity: 0.95 }));
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
  G.boyutla(w, h, hafif ? 1 : Math.min(2, window.devicePixelRatio || 1)); kamera.aspect = w / h;
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
  // malzeme: fresnel kenar ışığı, doygunluk, dokudan parlama (göz, kristal), çevre yansıması (gorunum.js)
  G.malzemeIyilestir(model, { renk: u.taraf === 0 ? 'biz' : 'rakip', kahraman: u.b.h });
  const kok3 = new THREE.Group(); const govde = new THREE.Group(); kok3.add(govde); govde.add(model);
  // yön: iki ayaklılar +Z'ye bakar; dört ayaklı ve yılanın ön yönü kemik geometrisinden bulunur (hareket.js)
  let kemik = {}; model.traverse(o => { if (o.isBone) kemik[o.name.replace('mixamorig', '').replace(':', '')] = o; });
  model.updateMatrixWorld(true);
  if (gor.tur !== 'iki') { model.rotation.y = onYonAci(model, kemik); }
  model.updateMatrixWorld(true);
  const boy = gor.tur === 'iki' ? 1.15 : 1.25;
  const kk = olcekle(model, boy, gor.tur === 'iki' ? 'y' : 'max');
  model.position.y -= kk.min.y; const kk2 = new THREE.Box3().setFromObject(model); model.position.x -= (kk2.min.x + kk2.max.x) / 2; model.position.z -= (kk2.min.z + kk2.max.z) / 2;
  const modelBoy = Math.max(0.4, kk2.max.y - kk2.min.y);
  const yildiz = [1, 1, 1.12, 1.25][u.b.s || 1]; kok3.scale.setScalar(yildiz);
  kok3.userData.vfxBoy = modelBoy * yildiz;   // efektlerin (durum, mermi hedefi) ölçeği
  // taraf halkası + kaynaşma halkası + temas gölgesi
  const halka = new THREE.Mesh(new THREE.RingGeometry(0.36, 0.45, 40), new THREE.MeshBasicMaterial({ color: u.taraf === 0 ? '#59d0ff' : '#ff5a6a', transparent: true, opacity: 0.85, depthWrite: false }));
  halka.rotation.x = -Math.PI / 2; halka.position.y = 0.03; kok3.add(halka);
  const halkalar = [halka];
  if (u.b.f) {
    const f = D.kahraman(u.b.f);
    const h2 = new THREE.Mesh(new THREE.RingGeometry(0.49, 0.56, 40), new THREE.MeshBasicMaterial({ color: f.renk, transparent: true, opacity: 0.95, depthWrite: false }));
    h2.rotation.x = -Math.PI / 2; h2.position.y = 0.035; kok3.add(h2); halkalar.push(h2);
    // malzemeler malzemeIyilestir'de birime özel klonlandı: yeniden klonlamadan ışıma ver (yama korunur)
    model.traverse(m => { if (m.isMesh) for (const mm of [].concat(m.material)) if (mm && mm.emissive) { mm.emissive.set(f.renk); mm.emissiveIntensity = 0.18; } });
  }
  const leke = G.golgeLekesi(gor.tur === 'iki' ? 0.42 : 0.6); kok3.add(leke);
  const p = dunya(u.x, u.y); kok3.position.copy(p); kok3.rotation.y = u.taraf === 0 ? Math.PI : 0;
  sahne.add(kok3);
  const b = { uid: u.uid, u, kok: kok3, govde, model, kemik, gor, halkalar, leke, durum: 'bekle', tekBitis: 0, olumT: -1, oncekiX: u.x, oncekiY: u.y, hizG: 0, hedefAci: kok3.rotation.y, faz: (u.uid * 0.37) % 1,
    bay: { saldiri: null, yetenek: false, vurul: 0 }, vd: {}, zaferMi: false };
  if (gor.tur === 'iki' && ual) { iskeleKur(b); b.ik = ikiAyakliKur(b); }
  else if (gor.tur === 'yilan') b.yilan = yilanKur(model, kemik, { faz: b.faz });
  else if (gor.tur === 'dort') b.dort = dortAyakliKur(model, kemik, { tur: u.b.h, faz: b.faz });
  hisHazirla(b);
  return b;
}
// his.hazirla malzemeleri bir kez daha klonlar ve kendi yamasını (parlama + çözülme) koyar; klonlama gorunum.js yamasını
// düşürdüğü için ikisini zincirle: önce gorunum, sonra his. Uniform nesneleri ortak kalır (parlat/kenar çalışmaya devam eder).
const ZINCIR_ANAHTAR = 'kutGorunum3+kutHis1';
function hisHazirla(b) {
  const eski = new Map(); b.model.traverse(m => { if (m.isMesh) eski.set(m, m.material); });
  his.hazirla(b);
  const yeniler = [];
  const bagla = (n, o) => {
    if (!n || !o || n === o || !o.userData || !o.userData.kut || !o.onBeforeCompile) return n;
    const gFn = o.onBeforeCompile, hFn = n.onBeforeCompile;
    n.userData.kut = o.userData.kut;
    n.onBeforeCompile = (sh, r) => { gFn.call(o, sh, r); hFn.call(n, sh, r); };
    n.customProgramCacheKey = () => ZINCIR_ANAHTAR; n.needsUpdate = true; yeniler.push(n); return n;
  };
  b.model.traverse(m => { if (!m.isMesh) return; const o = eski.get(m), n = m.material;
    m.material = Array.isArray(n) ? n.map((x, i) => bagla(x, Array.isArray(o) ? o[i] : o)) : bagla(n, o); });
  const gr = b.model.userData.gorunum; if (gr && yeniler.length) { gr.malzemeler.length = 0; gr.malzemeler.push(...yeniler); }
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

// ── Savaşı kur ──
export async function savasKur(yeniSim, kok = '') {
  for (const b of birimler.values()) { vfx.durumTemizle(b.kok); sahne.remove(b.kok); if (b.isk) sahne.remove(b.isk.kaynak); }
  for (const e of efektler) if (!e.kalici) sahne.remove(e.o);
  efektler = efektler.filter(e => e.kalici); kuyruk = []; yazilar = []; birimler = new Map(); kutlu = new Set();
  his.sifirla();
  sim = yeniSim; gorselT = 0; anlik = [];
  const liste = await Promise.all(sim.birimler.map(u => birimKur(u, kok)));
  for (const b of liste) birimler.set(b.uid, b);
  // gökten giriş: taraf içinde sırayla, rakip biraz sonra (giriş sürerken görüntü zamanı bekler → motor da bekler)
  const sira = [0, 0];
  for (const b of liste) { const tr = b.u.taraf ? 1 : 0; his.giris(b, sira[tr]++ * 0.08 + (tr ? 0.15 : 0)); if ((b.u.b.s || 1) >= 3) vfx.durum(b.kok, 'yildiz3', true); }
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
    const liste = sim.fx.map(f => ({ ...f, t: tOnce }));
    for (let i = 0; i < liste.length; i++) olayPlanla(liste[i], liste, i);
    const onceki = anlik[anlik.length - 1];
    anlikAl();
    // kalkan kırıldı mı? (motor ayrı olay yaymaz; anlık farkından çıkar)
    const yeni = anlik[anlik.length - 1];
    if (onceki) for (let j = 0; j < yeni.length; j++) if (onceki[j].kalkan > 0 && yeni[j].kalkan <= 0 && !yeni[j].olu) { const u = sim.birimler[j]; kuyruk.push({ t: tOnce, is: () => sesBildir({ tip: 'kalkanKir', u: u.uid }) }); }
  }
}
// Olaya göre görsel eylemleri zamanla
function sesBildir(f) {
  if (!dinleyici.ses) return;
  const bul = (id) => sim && sim.birimler.find(o => o.uid === id);
  dinleyici.ses(f, bul(f.k), bul(f.u));
}
// Aynı motor adımında bir olaydan sonra gelen ve ona ait olaylar (bir sonraki vuruş/yetenek olayına dek)
function ardil(liste, i) { const r = []; for (let j = i + 1; j < liste.length; j++) { const g = liste[j]; if (g.tip === 'vurus' || g.tip === 'yetenek') break; r.push(g); } return r; }
// bir olaydan önceki en yakın vuruş/yetenek olayı (bu olayı doğuran)
function onceki(liste, i) { for (let j = i - 1; j >= 0; j--) { const g = liste[j]; if (g.tip === 'vurus' || g.tip === 'yetenek') return g; } return null; }
// iki ayaklı saldırı klibinin oynatma hızı (saldırı aralığına sığsın)
function klipHiz(b, klip) { if (!klip || !ual || !ual.klip[klip]) return 1; const sure = ual.klip[klip].duration, ara = 1 / (b.u.as * 1.0); return Math.max(1, sure / Math.max(0.35, ara)); }
function olayPlanla(f, liste = [f], i = 0) {
  const ekle = (t, is) => kuyruk.push({ t, is });
  if (f.tip === 'vurus' || f.tip === 'yetenek' || f.tip === 'olum' || f.tip === 'dirilis') ekle(f.t, () => sesBildir(f));
  if (f.tip === 'vurus' && f.menzilli && birimler.get(f.k)) ekle(f.t - mesafeAl(f.k, f.u, f.t) / 12, () => sesBildir({ tip: 'atis', k: f.k, u: f.u }));
  const kaynak = birimler.get(f.k), hedef = birimler.get(f.u);
  if (f.tip === 'vurus' && kaynak) {
    const klip = kaynak.gor.tur === 'iki' ? kaynak.gor.saldir : null;
    const ucus = f.menzilli ? mesafeAl(f.k, f.u, f.t) / 12 : 0;
    const hz = klipHiz(kaynak, klip);
    const darbe = klip ? (DARBE[klip] || 0) / hz : (kaynak.gor.tur === 'yilan' ? 0.22 : 0.15);
    ekle(f.t - ucus - darbe, () => saldiriBaslat(kaynak, klip, { hiz: hz, darbe, menzilli: !!f.menzilli, hedef }));
    if (f.menzilli) ekle(f.t - ucus, () => mermiAt(kaynak, hedef, ucus));
  } else if (f.tip === 'yetenek') {
    const b = birimler.get(f.u); if (!b) return;
    const { hedefler, dostlar } = yetenekHedefleri(f, liste, i, b);
    const kut = kutlu.delete(f.u);
    const on = vfx.onSure(f.ad);
    ekle(f.t - Math.max(0.35, on), () => yetenekBaslat(b, f.ad));
    ekle(f.t - on, () => { if (b.olumT < 0) vfx.yetenek(f.ad, b.kok, hedefler.filter(o => o.olumT < 0 || o === b).map(o => o.kok), { dostlar: dostlar.map(o => o.kok), kut }); });
    ekle(f.t, () => yetenekEfekt(b, f.ad));
    if (f.ad === 'uluma') for (const o of hedefler) { ekle(f.t, () => vfx.durum(o.kok, 'hiz', true)); ekle(f.t + 4, () => vfx.durum(o.kok, 'hiz', false)); }
    if (f.ad === 'deliOfke') { ekle(f.t, () => vfx.durum(b.kok, 'ofke', true)); ekle(f.t + 3, () => vfx.durum(b.kok, 'ofke', false)); }
  } else if (f.tip === 'hasar' || f.tip === 'dot' || f.tip === 'iyi' || f.tip === 'kalkan' || f.tip === 'kac') {
    ekle(f.t, () => sayiGoster(f));
    if (f.tip === 'hasar') {
      const neden = onceki(liste, i);
      const yakin = neden && neden.tip === 'vurus' && !neden.menzilli && neden.k === f.k;
      const buyuk = !!(neden && neden.tip === 'yetenek');
      ekle(f.t, () => darbeGoster(f, { yakin, buyuk }));
      if (f.n > 60) ekle(f.t, () => vuruldu(birimler.get(f.u), his.hasarGucu(f.n, { buyuk })));
    }
  } else if (f.tip === 'olum') ekle(f.t, () => olumBaslat(birimler.get(f.u)));
  else if (f.tip === 'dirilis') ekle(f.t, () => dirilis(birimler.get(f.u)));
  else if (f.tip === 'kut') { kutlu.add(f.u); /* dokunuş anında zaten gösterildi; tekrar oynatmada da göster */ ekle(f.t - ONDE_SN, () => { kutSutun(birimler.get(f.u)); sesBildir(f); }); }
  else if (f.tip === 'simsek') {
    // Yıldırım yeteneğinin şimşeklerini vfx.yetenek('yildirim') zaten çizer; burada yalnız Gök Gürültüsü sıçramaları
    const neden = onceki(liste, i); if (neden && neden.tip === 'yetenek' && neden.ad === 'yildirim') return;
    ekle(f.t, () => { const a = birimler.get(f.k), b = birimler.get(f.u); if (!a || !b) return;
      vfx.zincir(a.kok.position.clone().setY(a.kok.position.y + 1.0 * a.kok.scale.y), b.kok.position.clone().setY(b.kok.position.y + 0.5 * b.kok.scale.y), { renk: '#fff27a', sure: 0.25 }); });
  }
}
// Yeteneğin görsel hedefleri: aynı adımda kaynağın vurduğu birimler; özel durumlarda dostlar
function yetenekHedefleri(f, liste, i, b) {
  const sonra = ardil(liste, i), u = sim.birimler.find(o => o.uid === f.u);
  const tekil = (uidler) => [...new Set(uidler)].map(id => birimler.get(id)).filter(Boolean);
  const canli = (fn) => sim.birimler.filter(o => !o.olu && fn(o)).map(o => o.uid);
  let hedefler = tekil(sonra.filter(g => (g.tip === 'hasar' || g.tip === 'dot') && g.k === f.u).map(g => g.u));
  const dostlar = tekil(sonra.filter(g => g.tip === 'iyi' && g.u !== f.u).map(g => g.u));
  const ad = f.ad;
  if (ad === 'kanat') hedefler = tekil(sonra.filter(g => g.tip === 'kalkan').map(g => g.u).concat(canli(o => o.taraf === u.taraf)));
  else if (ad === 'davul') hedefler = tekil(canli(o => o.taraf === u.taraf));
  else if (ad === 'uluma') hedefler = tekil(canli(o => o.taraf === u.taraf && Math.hypot(o.x - u.x, o.y - u.y) <= 2.1).concat([u.uid]));
  else if (ad === 'ayaz' && !hedefler.length) hedefler = tekil(canli(o => o.taraf !== u.taraf));
  else if (ad === 'yildirim') hedefler = tekil(sonra.filter(g => g.tip === 'simsek' && g.k === f.u).map(g => g.u)).slice(0, 3);
  else if (ad === 'deliOfke') hedefler = [];
  if (!hedefler.length && ad !== 'deliOfke' && u && u.hedef && !u.hedef.olu) hedefler = tekil([u.hedef.uid]);
  return { hedefler, dostlar };
}
function mesafeAl(a, b, t) {
  const i = Math.min(anlik.length - 1, Math.max(0, Math.round(t / DT))); const s = anlik[i]; const ua = sim.birimler.findIndex(u => u.uid === a), ub = sim.birimler.findIndex(u => u.uid === b);
  if (ua < 0 || ub < 0) return 2; return Math.hypot(s[ua].x - s[ub].x, s[ua].y - s[ub].y);
}

// ── Görsel eylemler ──
// Kodlu hareket (hareket.js) bayrakları: saldırı/yetenek/vurulma, tetiklendiği karede okunup sıfırlanır (b.bay)
function saldiriBaslat(b, klip, { hiz = 1, darbe = 0.15, menzilli = false, hedef = null } = {}) {
  if (!b || b.olumT >= 0) return;
  if (b.isk && klip) { const sure = ual.klip[klip].duration; oyna(b, klip, { hiz, gecis: 0.08 }); b.tekBitis = gorselT + sure / hiz; b.durum = 'saldir'; b.bay.saldiri = { darbe, menzilli }; }
  else b.bay.saldiri = true;
  // yakın dövüşte hedefe atılma (motor konumu değişmez)
  if (!menzilli && hedef && hedef.olumT < 0) {
    const tur = b.gor.tur;
    if (tur === 'iki') his.atil(b, hedef.kok.position, Math.max(0.1, darbe));
    else his.atil(b, hedef.kok.position, tur === 'yilan' ? 0.22 : 0.15, { mesafe: tur === 'yilan' ? 0.3 : 0.22 });
  }
}
function yetenekBaslat(b, ad) {
  if (!b || b.olumT >= 0) return;
  if (b.isk) { const dizi = b.gor.yetenek || ['Spell_Simple_Enter', 'Spell_Simple_Shoot']; oyna(b, dizi[0], { gecis: 0.08 }); b.dizi = dizi.slice(1); b.tekBitis = gorselT + ual.klip[dizi[0]].duration; b.durum = 'yetenek'; }
  b.bay.yetenek = true;
}
function yetenekEfekt(b, ad) {
  if (!b) return;
  yaziEkle(b, D.YETENEK[ad] ? D.YETENEK[ad].ad : '', '#ffe28a', 1.25, true);
}
// her hasar olayında: gövde tepkisi (geri savrulma, sıkış-uz, beyaz parlama, büyükte hit-stop) + yakın vuruşta darbe efekti
function darbeGoster(f, { yakin = false, buyuk = false } = {}) {
  const h = birimler.get(f.u), k = birimler.get(f.k); if (!h) return;
  const yon = k ? h.kok.position.clone().sub(k.kok.position) : null;
  his.darbe(h, yon, his.hasarGucu(f.n, { buyuk }));
  if (yakin && k) vfx.vurus(h.kok.position.clone().setY(h.kok.position.y + 0.55 * h.kok.scale.y), { renk: renkAl(k), guc: f.n >= 200 ? 1.8 : f.n > 60 ? 1.2 : 0.8, yon });
}
function vuruldu(b, guc = 0.7) {
  if (!b || b.olumT >= 0) return;
  if (b.isk && b.durum !== 'saldir' && b.durum !== 'yetenek') { oyna(b, 'Hit_Chest', { gecis: 0.05 }); b.tekBitis = gorselT + 0.33; b.durum = 'vurul'; }
  b.bay.vurul = Math.max(b.bay.vurul || 0, guc);
}
function olumBaslat(b) {
  if (!b || b.olumT >= 0) return; b.olumT = gorselT;
  if (b.isk) { oyna(b, 'Death01', { gecis: 0.1, tut: true }); }
  const sonMu = ![...birimler.values()].some(o => o !== b && o.u.taraf === b.u.taraf && o.olumT < 0);
  his.olum(b, { tur: b.gor.tur, yakinlastir: sonMu });
  vfx.durumTemizle(b.kok);
  vfx.olum(b.kok, { renk: renkAl(b), gecikme: b.isk ? 1.33 : b.gor.tur === 'yilan' ? 0.5 : 0.6 });
  for (const hl of b.halkalar) hl.visible = false;
}
function dirilis(b) {
  if (!b) return; b.olumT = -1;
  b.kok.visible = true; b.leke.visible = true; for (const hl of b.halkalar) hl.visible = true;
  his.dirilis(b); vfx.dirilis(b.kok);
  if ((b.u.b.s || 1) >= 3) vfx.durum(b.kok, 'yildiz3', true);
  b.vd = {};
  if (b.isk) { oyna(b, 'Jump_Land', { gecis: 0.05 }); b.tekBitis = gorselT + 1.0; b.durum = 'yetenek'; }
  yaziEkle(b, 'Yeniden Doğuş', '#ffb070', 1.3, true);
}

// ── Efektler ──
function mermiAt(a, h, sure) {
  if (!a || !h || a.olumT >= 0) return;
  const bas = a.kok.position.clone(); bas.y += (a.kok.userData.vfxBoy || 1) * 0.62;
  vfx.mermi(bas, h.kok, sure, { renk: renkAl(a), tur: MERMI_TUR[a.u.b.h] || 'buyu' });
}
function kutSutun(b) {
  if (!b) return;
  vfx.kut(b.kok.position, { otomatik: false });   // ışık sütunu, rün çemberleri, toplanan zerreler
  vfx.ekranFlas('#ffe6a0', 0.5, 0.4);
  his.kut(b);                                      // 0,25 sn yavaşlatma + yakınlaştırma + sarsıntı + altın parlama
  const gr = b.model.userData.gorunum;
  if (gr) { gr.kenar('#ffd27a', 1.2); kuyruk.push({ t: gorselT + 1.2, is: () => gr.kenar(b.u.taraf === 0 ? G.RIM.biz : G.RIM.rakip, G.AYAR.rimGuc) }); }
  yaziEkle(b, '✨ KUT', '#e6c2ff', 1.35, true);
  if (dinleyici.kut) dinleyici.kut(b.u);
}

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
  const w = kaplama.clientWidth, h = kaplama.clientHeight;
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
    // durum simgeleri artık 3B (vfx.durum: sersem yıldızları, buz kristalleri, alev, zehir, lanet gözü, davul halkası, kalkan)
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
const DURUM_ESLE = [['sersem', 'sersem'], ['buz', 'yavas'], ['yanik', 'yanik'], ['zehir', 'zehir'], ['lanet', 'lanet'], ['davul', 'davul']];
export function kare(dtSabit) {
  if (!renderer) return { bitti: false };
  const dtGercek = dtSabit !== undefined ? dtSabit : Math.min(0.05, saat.getDelta());
  const t = performance.now() / 1000;
  for (const e of efektler) if (e.kalici) e.guncelle(t);
  // görsel zaman: hit-stop / Kut yavaşlaması / giriş beklemesi YALNIZ görüntüyü ve motorun ne kadar ilerletileceğini etkiler;
  // motor her zaman sabit DT adımıyla ve aynı olay sırasıyla koşar (belirlenimci)
  const H = his.guncelle(dtGercek, { hizKati });
  const vOlcek = vfx.zamanOlcek();
  const dt = H.dtGorsel * hizKati * vOlcek;                 // gorselT, karışıcılar, kodlu hareket
  const dtEfekt = dtGercek * H.olcek * hizKati * vOlcek;     // efektler girişte de oynasın
  if (sim) {
    const son = sim.bitti ? (anlik.length - 1) * DT + 1.6 : Infinity;
    gorselT = Math.min(gorselT + dt, son);
    simIlerlet();
    kuyruk.sort((a, b) => a.t - b.t);
    while (kuyruk.length && kuyruk[0].t <= gorselT) kuyruk.shift().is();
    const s = anlikGorsel();
    for (const [uid, b] of birimler) {
      const i = sim.birimler.findIndex(u => u.uid === uid), a = s[i];
      const hedef = dunya(a.x, a.y);
      const yol = Math.hypot(a.x - b.oncekiX, a.y - b.oncekiY);
      if (dt > 1e-5) b.hizG = yol / dt;
      const hareket = yol > 0.002 * Math.max(1, hizKati) || (dt <= 1e-5 && b.hizG > 0.05); b.oncekiX = a.x; b.oncekiY = a.y;
      b.kok.position.x = hedef.x; b.kok.position.z = hedef.z; b.kok.position.y = ARENA_Y;
      // hedefe dön
      if (a.hedef >= 0 && b.olumT < 0) { const hb = birimler.get(a.hedef); if (hb) { const v = hb.kok.position.clone().sub(b.kok.position); const aci = Math.atan2(v.x, v.z); let fark = aci - b.kok.rotation.y; fark = Math.atan2(Math.sin(fark), Math.cos(fark)); b.kok.rotation.y += fark * Math.min(1, dt * 10); } }
      const olu = b.olumT >= 0, bay = b.bay;
      const ops = { hiz: olu ? 0 : (hareket ? b.hizG : 0), saldiri: bay.saldiri, yetenek: bay.yetenek, vurul: bay.vurul || false, olum: olu, zafer: b.zaferMi };
      // animasyon durumu
      if (b.isk) {
        if (!olu) {
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
        ikiAyakliGuncelle(b.ik, dt, { ...ops, hareket: hareket && !olu, saldiri: bay.saldiri && typeof bay.saldiri === 'object' ? bay.saldiri : null });
      } else if (b.dort) dortAyakliGuncelle(b.dort, dt, { ...ops, saldiri: !!bay.saldiri });
      else if (b.yilan) yilanGuncelle(b.yilan, dt, { ...ops, saldiri: !!bay.saldiri });
      bay.saldiri = null; bay.yetenek = false; bay.vurul = 0;
      // çözülme bitince kök (taraf halkası, temas gölgesi) de gizlenir
      if (olu && !b.govde.visible && gorselT - b.olumT > 0.5) b.kok.visible = false;
      // sürekli durum efektleri (yalnız değişimde)
      if (!olu && a && !a.olu) {
        for (const [tur, alan] of DURUM_ESLE) if (b.vd[tur] !== a[alan]) { b.vd[tur] = a[alan]; vfx.durum(b.kok, tur, a[alan]); }
        const kal = a.kalkan > 0; if (b.vd.kalkan !== kal) { b.vd.kalkan = kal; vfx.durum(b.kok, 'kalkan', kal); }
      }
    }
    for (const y of yazilar) y.yas += dt; yazilar = yazilar.filter(y => y.yas < 0.95);
    efektler = efektler.filter(e => { if (e.kalici) return true; e.yas += dt; const k = Math.min(1, e.yas / e.sure); e.guncelle(t, k, dt); if (k >= 1) { sahne.remove(e.o); if (e.bitis) e.bitis(); return false; } return true; });
  }
  vfx.guncelle(dtEfekt);
  // kamera: his (sarsıntı + yakınlaştırma) ve vfx sarsıntısı yalnız bu kare için uygulanır, sonra taban duruşa döner
  his.kameraUygula();
  const so = vfx.sarsintiOfset(); if (so.lengthSq() > 0) { kamera.position.add(so); kamera.updateMatrixWorld(true); }
  G.ciz();
  const kw = kaplama.clientWidth, kh = kaplama.clientHeight; kcx.clearRect(0, 0, kw, kh);
  if (sim) kaplamaCiz();
  vfx.ekranCiz(kcx, kw, kh);
  his.kameraGeriAl();
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
  if (sim.kut(0, u.i)) { kutlu.add(u.uid); kutSutun(en); return u; }
  return false;
}
export function zafer(taraf) {
  for (const b of birimler.values()) if (b.u.taraf === taraf && b.olumT < 0) {
    if (b.isk) { oyna(b, 'Dance_Loop', { dongu: true, gecis: 0.2 }); b.durum = 'zafer'; }
    b.zaferMi = true; his.zafer(b);
  }
}
export function temizle() { sim = null; for (const b of birimler.values()) vfx.durumTemizle(b.kok); }
// hata ayıklama: kamerayı yerleştir
export function kameraYerlestir(y, z) { kamera.position.set(0, y, z); kamera.lookAt(0, 0, 0); kamera.fov = 50; kamera.updateProjectionMatrix(); }
// hata ayıklama: yakın kamera
export function yakinKamera(uid, uzak = 2.4, aci = 0.5) { const b = birimler.get(uid); if (!b) return; const p = b.kok.position; kamera.position.set(p.x + Math.sin(aci) * uzak, 1.4, p.z + Math.cos(aci) * uzak); kamera.lookAt(p.x, 0.6, p.z); }
