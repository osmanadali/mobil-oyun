/* Kut Arena — 3D savaş sahnesi (tarayıcı sürümü). Kurallar: ../ANIMASYON_PLANI.md
   Motor (../sim.js) görüntünün ÖNDE_SN kadar önünde koşar; olaylar zaman damgalı kuyruğa girer,
   saldırı klipleri darbe karesi olay zamanına denk gelecek şekilde önceden başlatılır. */
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from '../vendor/three/addons/utils/SkeletonUtils.js';
import * as G from './gorunum.js';
import { vfx } from './vfx.js';
import { his, dortAyakliKur, dortAyakliGuncelle, yilanKur, yilanGuncelle, ikiAyakliKur, ikiAyakliGuncelle, onYonAci, DA_DARBE, YILAN_DARBE } from './hareket.js';

const D = window.KUT_DATA;
export const ONDE_SN = 0.4;
const DT = 0.05;
const ARENA_Y = 0;                    // tahta yüzeyi
const dunya = (x, y) => new THREE.Vector3(x - 3, ARENA_Y, y - 4);

// ── Kahraman kişilik tablosu (ANIMASYON_PLANI §3–4) ──
// bekle/yuru: döngü klipleri; saldir: sırayla dönen vuruş klipleri; hazir: menzilli atışın kurulma klibi (atış klibinin bırakma karesi
// olay zamanına denk gelir); yetenek: klip dizisi (yetOn: olaydan kaç sn önce başlar); vurul: üste eklenen (additive) tepki klipleri;
// zafer; ara: beklerken 4–7 sn'de bir oynayan kısa hareket; kolAci: tombul gövdede kolları dışa açma (rad); egim/bas: duruş ofsetleri;
// boy: hedef boy çarpanı (tanklar iri); yuruHiz: yürüme klibi hız çarpanı (ağır yaratık yavaş adımlar).
const IKI = { tur: 'iki' }, DORT = { tur: 'dort' }, YILAN = { tur: 'yilan' };
const ATIS = { hazir: 'Spell_Simple_Enter', saldir: ['Spell_Simple_Shoot'] };
export const GORSEL = {
  golem:   { ...IKI, bekle: 'Idle_FoldArms_Loop', saldir: ['Punch_Cross', 'Melee_Hook'], yetenek: ['OverhandThrow'], yetOn: 0.85, zafer: 'Yes', ara: ['Idle_No_Loop'], iri: true, kolAci: 0.26, egim: 0.06, boy: 1.1, yuruHiz: 0.8 },
  kurbaga: { ...IKI, ...ATIS, yetenek: ['NinjaJump_Start', 'NinjaJump_Land'], yetOn: 0.62, zafer: 'Dance_Loop', ara: ['Idle_Talking_Loop'], kolAci: 0.36, egim: 0.05, bas: -0.08 },
  yarasa:  { ...IKI, saldir: ['Sword_Regular_A', 'Punch_Jab'], yetenek: ['Spell_Simple_Enter', 'Spell_Simple_Idle_Loop'], zafer: 'Yes', kanat: true, kolAci: 0.1, egim: 0.12 },
  ruzgar:  { ...IKI, ...ATIS, yetenek: ['Spell_Simple_Enter', 'Spell_Simple_Shoot'], zafer: 'Dance_Loop', ara: ['Idle_Talking_Loop'], idleHiz: 1.25, kolAci: 0.12 },
  kugu:    { ...IKI, ...ATIS, yetenek: ['Spell_Simple_Enter', 'Spell_Simple_Idle_Loop'], zafer: 'Yes', kanat: true, kolAci: 0.16, bas: 0.06 },
  ayi:     { ...IKI, bekle: 'Idle_Loop', saldir: ['Melee_Hook', 'Sword_Regular_A', 'Punch_Cross'], yetenek: ['Sword_Regular_C'], yetOn: 0.5, zafer: 'Yes', ara: ['Idle_FoldArms_Loop'], iri: true, kolAci: 0.24, egim: 0.1, boy: 1.12, yuruHiz: 0.85 },
  anka:    { ...IKI, ...ATIS, yetenek: ['Spell_Simple_Enter', 'Spell_Simple_Shoot'], zafer: 'Dance_Loop', kanat: true, kolAci: 0.14 },
  baykus:  { ...IKI, ...ATIS, yetenek: ['Spell_Simple_Enter', 'Spell_Simple_Idle_Loop', 'Spell_Simple_Shoot'], zafer: 'Yes', ara: ['Idle_Talking_Loop'], kolAci: 0.32, bas: -0.06, idleHiz: 0.85 },
  tilki:   { ...IKI, hazir: 'Pistol_Aim_Neutral', saldir: ['Pistol_Shoot'], yetenek: ['Spell_Simple_Enter', 'Pistol_Shoot'], zafer: 'Yes', ara: ['Idle_Talking_Loop'], kolAci: 0.14, egim: 0.04 },
  ejder:   { ...IKI, ...ATIS, yetenek: ['Jump_Start', 'Spell_Simple_Shoot'], zafer: 'Dance_Loop', ara: ['Idle_FoldArms_Loop'], kolAci: 0.26 },
  kurt: { ...DORT }, koc: { ...DORT }, kaplumbaga: { ...DORT, boy: 1.1 }, semender: { ...DORT }, bulutat: { ...DORT, kanat: true },
  yilan: { ...YILAN },
};
// Klip darbe anları (saniye, hız 1'de). Menzilli atışta bırakma karesi; yakın vuruşta elin en ileri gittiği kare (UAL'den ölçüldü)
const DARBE = { Punch_Jab: 0.22, Punch_Cross: 0.30, Sword_Attack: 0.43, Spell_Simple_Shoot: 0.04, Spell_Simple_Enter: 0.5,
  Melee_Hook: 0.27, Sword_Regular_A: 0.23, Sword_Regular_C: 0.5, Pistol_Shoot: 0.03, OverhandThrow: 0.38, NinjaJump_Land: 0.0 };
// yakın vuruşun türü (vfx.vurus): pençe, boynuz, yumruk, ısırık
const YAKIN_TUR = { golem: 'yumruk', ayi: 'pence', yarasa: 'pence', kurt: 'isirik', kaplumbaga: 'isirik', koc: 'boynuz', bulutat: 'boynuz' };
// kahramanın elementi (sayı rengi, vuruş alt katmanı)
const ELEMENT_H = { anka: 'ates', semender: 'ates', ejder: 'isik', baykus: 'buz', kaplumbaga: 'buz', kurt: 'kristal', yilan: 'zehir', ayi: 'golge', tilki: 'golge', yarasa: 'kan',
  kurbaga: 'ses', golem: 'toprak', koc: 'toprak', kugu: 'isik', ruzgar: 'ruzgar', bulutat: 'isik' };
const SAYI_RENK = { ates: '#ff8a3a', buz: '#8fd6ff', kristal: '#8fd6ff', zehir: '#8dff5a', golge: '#c98bff', kan: '#ff7a8e', ses: '#ffb35a', toprak: '#f0c88a', isik: '#fff08a', ruzgar: '#9ff0e0' };
// UAL2 (Unreal manken iskeleti) → UAL iskeletine yükleme anında aktarılan klipler
const UAL2_KLIP = ['Melee_Hook', 'Sword_Regular_A', 'Sword_Regular_C', 'OverhandThrow', 'Idle_FoldArms_Loop', 'Idle_No_Loop', 'NinjaJump_Start', 'NinjaJump_Land', 'Yes', 'Shield_Dash'];
const MAP2 = { Hips: 'pelvis', Spine: 'spine_01', Spine1: 'spine_02', Spine2: 'spine_03', Neck: 'neck_01', Head: 'Head',
  LeftShoulder: 'clavicle_l', LeftArm: 'upperarm_l', LeftForeArm: 'lowerarm_l', LeftHand: 'hand_l', RightShoulder: 'clavicle_r', RightArm: 'upperarm_r', RightForeArm: 'lowerarm_r', RightHand: 'hand_r',
  LeftUpLeg: 'thigh_l', LeftLeg: 'calf_l', LeftFoot: 'foot_l', LeftToeBase: 'ball_l', RightUpLeg: 'thigh_r', RightLeg: 'calf_r', RightFoot: 'foot_r', RightToeBase: 'ball_r' };
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
let hafif = false, kutlu = new Set(), kokYol = '';
const kam = { tabanP: new THREE.Vector3(), tabanH: new THREE.Vector3(), olcek: 1, merkez: new THREE.Vector3(), ilk: true };   // kutlu: Kut ile dolan (bir sonraki yeteneği büyük oynanacak) birim uid'leri

function hafifOku() { try { return localStorage.getItem('kut.hafif') === '1'; } catch (e) { return false; } }

// ── Kurulum ──
export async function hazirla(tuval, kaplamaTuval, kok = '', ops = {}) {
  if (renderer) return;
  hafif = ops.hafif !== undefined ? !!ops.hafif : hafifOku(); kokYol = kok;
  const kalite = hafif ? 'hafif' : 'yuksek';
  // yüksek kalitede kenar yumuşatma composer'ın MSAA hedefinde yapılır; hafifte tuvalin kendi MSAA'sı (siluetler tırtıklı kalmasın)
  renderer = new THREE.WebGLRenderer({ canvas: tuval, antialias: hafif, powerPreference: 'high-performance' });
  kaplama = kaplamaTuval; kcx = kaplama.getContext('2d');
  sahne = new THREE.Scene();
  kamera = new THREE.PerspectiveCamera(38, 16 / 10, 0.1, 200);
  G.kur(renderer, sahne, kamera, { kalite });   // ton eşleme, gölge, gün batımı çevre ışığı, bloom (yuksek)
  saat = new THREE.Clock();
  yukleyici = new GLTFLoader();
  const tl = new THREE.TextureLoader();
  // gökyüzü: büyük küre iç yüzü
  const gok = tl.load(kok + '../gorsel/gokyuzu.webp'); gok.colorSpace = THREE.SRGBColorSpace;
  // gök ton eşlemeden geçmez: gün batımı pembe-turuncusu soluklaşmasın
  const kure = new THREE.Mesh(new THREE.SphereGeometry(90, 64, 32), new THREE.MeshBasicMaterial({ map: gok, side: THREE.BackSide, fog: false, toneMapped: false, color: new THREE.Color(1.02, 1.02, 1.02) }));
  kure.rotation.y = Math.PI; kure.position.y = 6; sahne.add(kure);
  sahne.background = new THREE.Color('#7d4d9e');
  sahne.fog = new THREE.Fog('#c86a8e', 40, 90);
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
  // zemin yaratıklardan ~1 durak koyu ve hafif soğuk: turuncu/mor yaratıklar zeminle kaynaşmasın
  const tahta = new THREE.Mesh(new THREE.PlaneGeometry(6, 8), new THREE.MeshStandardMaterial({ map: tas, color: '#9a8aa2', roughness: 1 }));
  tahta.rotation.x = -Math.PI / 2; tahta.position.y = 0.014; tahta.receiveShadow = true; sahne.add(tahta);
  // çimen kenar halkası
  const cim = tl.load(kok + '../gorsel/doku_cimen.webp'); cim.colorSpace = THREE.SRGBColorSpace; cim.wrapS = cim.wrapT = THREE.RepeatWrapping; cim.repeat.set(4, 4);
  const kenar = new THREE.Mesh(new THREE.RingGeometry(5.32, 6.3, 72), new THREE.MeshStandardMaterial({ map: cim, roughness: 1 }));
  kenar.rotation.x = -Math.PI / 2; kenar.position.y = 0.006; kenar.receiveShadow = true; sahne.add(kenar);
  // tahtanın çevresi: yuvarlak taş döşeme (tahta ile çimen arasındaki boşluğu kapatır; konseptteki taş avlu)
  const tas2 = tas.clone(); tas2.needsUpdate = true; tas2.repeat.set(10 / 6 * 0.75, 10 / 6 * 0.75); tas2.offset.set(0.37, 0.21);
  const avlu = new THREE.Mesh(new THREE.CircleGeometry(5.06, 72), new THREE.MeshStandardMaterial({ map: tas2, color: '#8e7c8c', roughness: 1 }));
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
  const cizgi = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 0.07), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffc94a'), transparent: true, opacity: 0.5 }));
  cizgi.rotation.x = -Math.PI / 2; cizgi.position.y = 0.02; sahne.add(cizgi);
  { const c = document.createElement('canvas'); c.width = 8; c.height = 64; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, 'rgba(255,190,70,0)'); g.addColorStop(0.5, 'rgba(255,190,70,0.55)'); g.addColorStop(1, 'rgba(255,190,70,0)'); x.fillStyle = g; x.fillRect(0, 0, 8, 64);
    const parilti = new THREE.Mesh(new THREE.PlaneGeometry(6.1, 0.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    parilti.rotation.x = -Math.PI / 2; parilti.position.y = 0.021; sahne.add(parilti);
    efektler.push({ kalici: true, o: parilti, guncelle: (t) => { parilti.material.opacity = 0.4 + Math.sin(t * 2.2) * 0.15; } }); }
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
  const [g, g2] = await Promise.all([glb('ual', kok), glb('ual2', kok).catch(() => null)]);
  ual = { sahne: g.scene, klip: Object.fromEntries(g.animations.map(c => [c.name, c])) };
  if (g2) { try { ual2Aktar(g2); } catch (e) { console.warn('ual2 aktarılamadı', e); } }
  // üste eklenen vurulma tepkileri (additive): saldırı klibi kesilmeden üst gövde sarsılır
  for (const ad of ['Hit_Chest', 'Hit_Head']) if (ual.klip[ad]) { const c = THREE.AnimationUtils.makeClipAdditive(ual.klip[ad].clone()); c.name = ad + '_Ek'; ual.klip[c.name] = c; }
  ual.adim = adimOlc();
}
// UAL2 kliplerini yükleme anında UAL iskeletine çevir: iki iskelet de A duruşundan, kemik yönleri hizalanarak (aktar() ile aynı yöntem)
function ual2Aktar(g2) {
  const hedef = SkeletonUtils.clone(ual.sahne), kaynak = g2.scene;
  const TB = {}, SB = {}; hedef.traverse(m => { if (m.isBone) TB[m.name.replace(/\./g, '')] = m; }); kaynak.traverse(m => { if (m.isBone) SB[m.name] = m; });
  const mixT = new THREE.AnimationMixer(hedef), mixS = new THREE.AnimationMixer(kaynak);
  const tp1 = ual.klip.A_TPose, tp2 = g2.animations.find(c => c.name === 'A_TPose'); if (!tp1 || !tp2) return;
  const e1 = mixT.clipAction(tp1).play(), e2 = mixS.clipAction(tp2).play(); mixT.setTime(0); mixS.setTime(0); hedef.updateMatrixWorld(true); kaynak.updateMatrixWorld(true);
  const sRef = {}, sRefP = {}, tRel = {}, tRelP = {}, al = {};
  for (const k in MAP2) { const s2 = SB[MAP2[k]], t2 = TB[MAP[k]]; if (!s2 || !t2) continue; sRef[k] = wq(s2); sRefP[k] = wp(s2); tRel[k] = wq(t2); tRelP[k] = wp(t2); }
  for (const k in sRef) { const c = COCUK[k], A = new THREE.Quaternion();
    if (c && tRelP[c] && sRefP[c]) A.setFromUnitVectors(tRelP[c].clone().sub(tRelP[k]).normalize(), sRefP[c].clone().sub(sRefP[k]).normalize());
    al[k] = A.multiply(tRel[k].clone()); }
  const hipS = tRelP.Hips.y / Math.max(1e-4, sRefP.Hips.y);
  e1.stop(); e2.stop();
  for (const ad of UAL2_KLIP) {
    const klip = g2.animations.find(c => c.name === ad); if (!klip) continue;
    const e = mixS.clipAction(klip); e.reset().play(); const FPS = 30, n = Math.max(2, Math.ceil(klip.duration * FPS) + 1);
    const zaman = new Float32Array(n), q = {}, pos = new Float32Array(n * 3); for (const k of SIRA) if (al[k]) q[k] = new Float32Array(n * 4);
    for (let f = 0; f < n; f++) {
      const t = Math.min(klip.duration, f / FPS); zaman[f] = t; mixS.setTime(t); kaynak.updateMatrixWorld(true);
      for (const k of SIRA) { if (!al[k]) continue; const s2 = SB[MAP2[k]], t2 = TB[MAP[k]];
        const delta = wq(s2).multiply(sRef[k].clone().invert()), istenen = delta.multiply(al[k]);
        t2.quaternion.copy(wq(t2.parent).invert().multiply(istenen)); t2.quaternion.toArray(q[k], f * 4);
        if (k === 'Hips') { const off = wp(s2).sub(sRefP.Hips).multiplyScalar(hipS); off.x *= 0.5; off.z *= 0.5; t2.position.copy(t2.parent.worldToLocal(tRelP.Hips.clone().add(off))); t2.position.toArray(pos, f * 3); }
        t2.updateMatrixWorld(true); }
    }
    e.stop();
    const izler = []; for (const k in q) izler.push(new THREE.QuaternionKeyframeTrack(TB[MAP[k]].name + '.quaternion', zaman, q[k]));
    izler.push(new THREE.VectorKeyframeTrack(TB.Hips ? TB[MAP.Hips].name + '.position' : 'DEF-hips.position', zaman, pos));
    ual.klip[ad] = new THREE.AnimationClip(ad, klip.duration, izler);
  }
}
// Walk/Jog döngüsünde ayağın ileri-geri genliğinden (UAL biriminde) hız 1'deki yürüme hızı: ayak kaymasın diye timeScale buna göre
function adimOlc() {
  const o = SkeletonUtils.clone(ual.sahne), B = {}; o.traverse(m => { if (m.isBone) B[m.name.replace(/\./g, '')] = m; });
  const mix = new THREE.AnimationMixer(o), sonuc = {};
  for (const ad of ['Walk_Loop', 'Jog_Fwd_Loop']) { const c = ual.klip[ad]; if (!c) continue; const e = mix.clipAction(c).play(); let mn = Infinity, mx = -Infinity;
    for (let f = 0; f <= 30; f++) { mix.setTime(c.duration * f / 30); o.updateMatrixWorld(true); const z = wp(B[MAP.LeftFoot]).z - wp(B[MAP.Hips]).z; mn = Math.min(mn, z); mx = Math.max(mx, z); }
    e.stop(); sonuc[ad] = 2 * (mx - mn) / c.duration; }
  return sonuc;
}

export function boyutla() {
  if (!renderer) return;
  const c = renderer.domElement, w = c.clientWidth, h = c.clientHeight; if (!w || !h) return;
  // tablette 2560×1600 HalfFloat ağır: DPR 1,5 sınırı (hafifte de 1,5; tuval MSAA'sı ile)
  G.boyutla(w, h, Math.min(1.5, window.devicePixelRatio || 1)); kamera.aspect = w / h;
  // taban kadraj: tahtanın tamamı (savaş öncesi/sonu); savaşta kadraj kamerası yaşayanların sınır kutusuna yaklaşır (kare())
  const dar = w / h < 1.45;
  kamera.fov = dar ? 38 : 32;
  kam.tabanP.set(0, dar ? 9.6 : 8.5, dar ? 8.2 : 7.3); kam.tabanH.set(0, 0, dar ? 0.3 : 0.2);
  kamera.position.copy(kam.tabanP); kamera.lookAt(kam.tabanH); kam.ilk = true; kam.serbest = false;
  kamera.updateProjectionMatrix();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  kaplama.width = w * dpr; kaplama.height = h * dpr; kcx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// ── Taraf diski: radyal degrade (iç %25, belirgin kenar), rakipte 3 dışa bakan diken ──
const DISK_GEO = new THREE.PlaneGeometry(1.2, 1.2).rotateX(-Math.PI / 2); let DISK_MAT = null;
function tarafMalzeme(taraf) {
  if (!DISK_MAT) {
    const yap = (renk, diken) => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.translate(64, 64);
      const g = x.createRadialGradient(0, 0, 0, 0, 0, 50); g.addColorStop(0, 'rgba(255,255,255,0.12)'); g.addColorStop(0.62, 'rgba(255,255,255,0.22)'); g.addColorStop(0.8, 'rgba(255,255,255,0.9)'); g.addColorStop(0.9, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.beginPath(); x.arc(0, 0, 50, 0, Math.PI * 2); x.fill();
      if (diken) { x.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { x.save(); x.rotate(i * Math.PI * 2 / 3 + Math.PI / 6); x.beginPath(); x.moveTo(-7, -47); x.lineTo(0, -62); x.lineTo(7, -47); x.closePath(); x.fill(); x.restore(); } }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      return new THREE.MeshBasicMaterial({ map: t, color: renk, transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false, fog: false }); };
    DISK_MAT = [yap('#59d0ff', false), yap('#ff5a6a', true)];
  }
  return DISK_MAT[taraf ? 1 : 0];
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
  // boy: iki ayaklı yüksekliğe göre; dört ayaklı/yılan da yüksekliğe göre (uzun gövdeliler cüce kalmasın), en büyük boyut sınırlı
  const boy = (gor.tur === 'iki' ? 1.32 : 1.02) * (gor.boy || 1);
  let kk = olcekle(model, boy, 'y');
  if (gor.tur !== 'iki') { const s3 = kk.getSize(new THREE.Vector3()), en = Math.max(s3.x, s3.z); if (en > 1.75 * (gor.boy || 1)) kk = olcekle(model, 1.75 * (gor.boy || 1), 'max'); }
  model.position.y -= kk.min.y; const kk2 = new THREE.Box3().setFromObject(model); model.position.x -= (kk2.min.x + kk2.max.x) / 2; model.position.z -= (kk2.min.z + kk2.max.z) / 2;
  const modelBoy = Math.max(0.4, kk2.max.y - kk2.min.y);
  const yildiz = [1, 1, 1.12, 1.25][u.b.s || 1]; kok3.scale.setScalar(yildiz);
  kok3.userData.vfxBoy = modelBoy * yildiz;   // efektlerin (durum, mermi hedefi) ölçeği
  // gövde yatay yarıçapı (yakın dövüş teması ve görsel ayrıştırma için)
  { const s3 = kk2.getSize(new THREE.Vector3()); kok3.userData.yaricap = 0.5 * Math.min(Math.max(s3.x, s3.z), gor.tur === 'iki' ? 1.0 : 1.4) * yildiz; }
  // taraf diski (paylaşımlı doku + taraf başına 2 malzeme; rakipte dışa bakan dikenler: renk körü oyuncu da ayırt eder) + kaynaşma halkası + temas gölgesi
  const halka = new THREE.Mesh(DISK_GEO, tarafMalzeme(u.taraf)); halka.scale.setScalar(gor.tur === 'iki' ? 1 : 1.15);
  halka.position.y = 0.03; halka.renderOrder = -1; kok3.add(halka);
  const halkalar = [halka];
  if (u.b.f) {
    const f = D.kahraman(u.b.f);
    const h2 = new THREE.Mesh(new THREE.RingGeometry(0.49, 0.56, 40), new THREE.MeshBasicMaterial({ color: f.renk, transparent: true, opacity: 0.95, depthWrite: false }));
    h2.rotation.x = -Math.PI / 2; h2.position.y = 0.035; kok3.add(h2); halkalar.push(h2);
    // malzemeler malzemeIyilestir'de birime özel klonlandı: yeniden klonlamadan ışıma ver (yama korunur)
    model.traverse(m => { if (m.isMesh) for (const mm of [].concat(m.material)) if (mm && mm.emissive) { mm.emissive.set(f.renk); mm.emissiveIntensity = 0.18; } });
  }
  const leke = G.golgeLekesi(gor.tur === 'iki' ? 0.48 : 0.66); kok3.add(leke);
  const p = dunya(u.x, u.y); kok3.position.copy(p); kok3.rotation.y = u.taraf === 0 ? Math.PI : 0;
  sahne.add(kok3);
  const b = { uid: u.uid, u, kok: kok3, govde, model, kemik, gor, halkalar, leke, durum: 'bekle', tekBitis: 0, olumT: -1, oncekiX: u.x, oncekiY: u.y, hizG: 0, hizS: 0, hedefAci: kok3.rotation.y, faz: (u.uid * 0.37) % 1,
    bay: { saldiri: null, yetenek: false, vurul: 0 }, vd: {}, zaferMi: false, yerelT: 0, zk: null, zkSira: [], salSira: 0, araT: 4 + ((u.uid * 1.7) % 3), ayir: new THREE.Vector2(), sonKut: -9, yaziSon: -9,
    yaricap: kok3.userData.yaricap || 0.4, modelOlcek: model.scale.y * yildiz };
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
  const bekleAd = (b.gor.bekle && eylem[b.gor.bekle]) ? b.gor.bekle : 'Idle_Loop';
  b.isk = { kaynak, SB, mix, eylem, sRef, sRefP, al, tRelP, hipS, aktif: null, beklemeAd: bekleAd };
  // yürüme hızı eşlemesi: UAL adım hızı × kalça oranı × model ölçeği (dünya birimi/sn, timeScale 1'de)
  b.adimHiz = {}; for (const ad in (ual.adim || {})) b.adimHiz[ad] = ual.adim[ad] * hipS * b.model.scale.y * b.kok.scale.y;
  oyna(b, bekleAd, { dongu: true, gecis: 0 }); b.isk.mix.setTime(b.faz * 2.5);
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
  efektler = efektler.filter(e => e.kalici); kuyruk = []; yazilar = []; bantlar.length = 0; kutKart = null; birimler = new Map(); kutlu = new Set(); kam.ilk = true;
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
    // hazırlık bütçesi: motor 0,4 sn önde → saldırı klibi darbeden ~0,32 sn önce kurulmaya başlar (saldırı aralığına sığdırılır)
    const ucus = f.menzilli ? mesafeAl(f.k, f.u, f.t) / 12 : 0, darbeT = f.t - ucus, tur = kaynak.gor.tur;
    const hazir = tur === 'iki' ? Math.min(0.34, 0.45 / Math.max(0.3, kaynak.u.as)) : tur === 'yilan' ? YILAN_DARBE : (DA_DARBE[(kaynak.dort && kaynak.dort.stil.saldir) || 'isir'] || 0.26);
    ekle(darbeT - hazir, () => saldiriBaslat(kaynak, { darbeT, menzilli: !!f.menzilli, hedef }));
    if (f.menzilli) ekle(f.t - ucus, () => mermiAt(kaynak, hedef, ucus));
  } else if (f.tip === 'yetenek') {
    const b = birimler.get(f.u); if (!b) return;
    const { hedefler, dostlar } = yetenekHedefleri(f, liste, i, b);
    const kut = kutlu.delete(f.u);
    const on = vfx.onSure(f.ad);
    ekle(f.t - Math.max(b.gor.yetOn || 0.35, on), () => yetenekBaslat(b, f.ad, f.t - on));
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
      let olumcul = false; for (let j = i + 1; j < liste.length; j++) if (liste[j].tip === 'olum' && liste[j].u === f.u) { olumcul = true; break; }
      ekle(f.t, () => darbeGoster(f, { yakin, buyuk, olumcul }));
      ekle(f.t, () => vuruldu(birimler.get(f.u), his.hasarGucu(f.n, { buyuk }), olumcul));
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
// Zamanlı klip: klip zamanı doğrudan yazılır (timeScale 0). Darbeye kadar yavaş kurulma → kısa tutma → ani vuruş (darbe karesi tam darbe
// anında), sonra hızlı toparlanma. Saatler birimin yerel saatiyle (hit-stop'ta donar).
function zkBaslat(b, ad, { bas, darbe, D, sonra = 1.3, egri = 'vurus' }) {
  const i = b.isk; if (!i || !i.eylem[ad]) return false;
  oyna(b, ad, { gecis: 0.08 }); i.aktif.timeScale = 0; i.aktif.time = 0;
  b.zk = { ad, bas, darbe: Math.max(bas + 0.02, darbe), D, sonra, egri, sure: ual.klip[ad].duration };
  b.durum = 'saldir'; b.tekBitis = Infinity; return true;
}
function zkGuncelle(b) {
  const z = b.zk, i = b.isk; if (!z || !i) return;
  if (i.aktifAd !== z.ad) { b.zk = null; return; }
  const t = b.yerelT; let ct;
  if (t < z.darbe) { const x = Math.max(0, (t - z.bas) / (z.darbe - z.bas));
    if (z.egri === 'dogrusal') ct = z.D * x;
    else { const u = Math.min(1, x / 0.6); ct = z.D * (x < 0.6 ? 0.62 * u * u * (3 - 2 * u) : x < 0.76 ? 0.62 : 0.62 + 0.38 * ((x - 0.76) / 0.24)); } }
  else ct = z.D + (t - z.darbe) * z.sonra;
  i.aktif.time = Math.min(ct, z.sure);
  if (ct >= z.sure) { b.zk = null; const n = b.zkSira.shift(); if (n) n(); else { b.durum = ''; b.tekBitis = 0; } }
}
function saldiriBaslat(b, { darbeT, menzilli = false, hedef = null } = {}) {
  if (!b || b.olumT >= 0) return;
  const kalan = Math.max(0, darbeT - gorselT), darbeY = b.yerelT + kalan, tur = b.gor.tur;
  if (b.isk) {
    const liste = b.gor.saldir || ['Punch_Jab']; const ad = liste[b.salSira++ % liste.length];
    const D = DARBE[ad] || 0, hz = klipHiz(b, ad); b.zkSira = [];
    if (menzilli && b.gor.hazir && kalan > 0.16) {
      // kurulma klibi (büyü hazırlığı / yay germe) darbeden 0,05 sn önce biter ve tutulur, atış klibinin bırakma karesi darbe anında
      const atisBas = darbeY - D / (1.2 * hz);
      zkBaslat(b, b.gor.hazir, { bas: b.yerelT, darbe: atisBas - 0.05, D: ual.klip[b.gor.hazir] ? ual.klip[b.gor.hazir].duration : 0.5, sonra: 0.01, egri: 'dogrusal' });
      b.zkSira.push(() => zkBaslat(b, ad, { bas: atisBas, darbe: darbeY, D, sonra: 1.3 * hz, egri: 'dogrusal' }));
    } else zkBaslat(b, ad, { bas: b.yerelT, darbe: darbeY, D, sonra: 1.4 * hz, egri: menzilli ? 'dogrusal' : 'vurus' });
    b.bay.saldiri = { darbe: kalan, menzilli };
  } else b.bay.saldiri = true;
  // yakın dövüşte hedefe atılma: iki gövde yarıçapı kadar yaklaşır, içine girmez (motor konumu değişmez)
  if (!menzilli && hedef && hedef.olumT < 0) {
    const temas = (b.yaricap || 0.4) + (hedef.yaricap || 0.4);
    if (tur === 'iki') his.atil(b, hedef.kok.position, Math.max(0.1, kalan), { temas, mesafe: 0.4 });
    else his.atil(b, hedef.kok.position, Math.max(0.12, kalan), { mesafe: tur === 'yilan' ? 0.3 : 0.26, temas });
  }
}
function yetenekBaslat(b, ad, olayT) {
  if (!b || b.olumT >= 0) return;
  if (b.isk) {
    const dizi = (b.gor.yetenek || ['Spell_Simple_Enter', 'Spell_Simple_Shoot']).filter(x => ual.klip[x]); if (!dizi.length) dizi.push('Spell_Simple_Enter');
    b.zk = null; b.zkSira = [];
    // kişilik tablosunda yetOn varsa: ilk klibin anahtar karesi (bırakma / iniş; yoksa sonu) efektin çıkış anına denk gelecek hızda oynar
    const ilk = ual.klip[dizi[0]].duration, anahtarK = DARBE[dizi[0]] != null ? DARBE[dizi[0]] : ilk, kalan = Math.max(0.15, (olayT || gorselT + 0.35) - gorselT);
    const hiz = b.gor.yetOn ? Math.min(2.2, Math.max(0.7, anahtarK / kalan)) : 1;
    oyna(b, dizi[0], { gecis: 0.08, hiz }); b.dizi = dizi.slice(1); b.tekBitis = gorselT + ilk / hiz; b.durum = 'yetenek';
  }
  b.bay.yetenek = true;
}
function yetenekEfekt(b, ad) {
  if (!b) return;
  bantEkle(b, D.YETENEK[ad] ? D.YETENEK[ad].ad : '');
}
// her hasar olayında: gövde tepkisi (geri savrulma, sıkış-uz, beyaz parlama, yerel hit-stop) + yakın vuruşta türüne göre darbe efekti
function darbeGoster(f, { yakin = false, buyuk = false, olumcul = false } = {}) {
  const h = birimler.get(f.u), k = birimler.get(f.k); if (!h) return;
  const yon = k ? h.kok.position.clone().sub(k.kok.position) : null;
  const guc = his.hasarGucu(f.n, { buyuk });
  his.darbe(h, yon, guc, { k: yakin ? k : null, kuresel: olumcul || f.n >= 200 });
  // taraf diski vuruşta kısa nabız
  if (h.halkalar[0]) h.diskNabiz = 0.15;
  if (yakin && k) vfx.vurus(h.kok.position.clone().setY(h.kok.position.y + 0.55 * (h.kok.userData.vfxBoy || 1)), { renk: renkAl(k), guc: f.n >= 200 ? 1.8 : 0.8 + 0.8 * Math.min(1, f.n / 120), yon, tur: YAKIN_TUR[k.u.b.h] || 'yakin', element: ELEMENT_H[k.u.b.h] });
}
function vuruldu(b, guc = 0.7, olumcul = false) {
  if (!b || b.olumT >= 0) return;
  const i = b.isk;
  if (i) {
    // üste eklenen tepki (additive): saldırı ya da yürüme kesilmez, üst gövde sarsılır
    const ad = (b.vurSira = (b.vurSira || 0) + 1) % 2 ? 'Hit_Chest_Ek' : 'Hit_Head_Ek', e = i.eylem[ad];
    if (e) { e.reset(); e.setLoop(THREE.LoopOnce, 1); e.clampWhenFinished = false; e.timeScale = 1.25; e.setEffectiveWeight(Math.min(1, 0.55 + 0.6 * guc)); e.play(); }
  }
  b.bay.vurul = Math.max(b.bay.vurul || 0, guc);
}
function olumBaslat(b) {
  if (!b || b.olumT >= 0) return; b.olumT = gorselT;
  if (b.isk) { b.zk = null; b.zkSira = []; oyna(b, 'Death01', { gecis: b.durum === 'vurul' ? 0.25 : 0.1, tut: true }); }
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
  bantEkle(b, 'Yeniden Doğuş', '#ffb070');
}

// ── Efektler ──
function mermiAt(a, h, sure) {
  if (!a || !h || a.olumT >= 0) return;
  const bas = a.kok.position.clone(); bas.y += (a.kok.userData.vfxBoy || 1) * 0.62;
  vfx.mermi(bas, h.kok, sure, { renk: renkAl(a), tur: MERMI_TUR[a.u.b.h] || 'buyu' });
}
// Kut: (a) toplanma + sahne kararır (spot ışığı kahramanda), (b) 0,25 sn'de sütun + şok + hız çizgileri, (c) ışık 0,4 sn'de döner.
// Soldan kayan portre kartı kimin Kut kullandığını söyler (hafifte de; ucuz).
const portreler = {};
function portreAl(id) { if (!portreler[id]) { const im = new Image(); im.src = kokYol + '../arayuz/portre/' + id + '.png'; portreler[id] = im; } return portreler[id]; }
let kutKart = null;
function kutSutun(b) {
  if (!b || gorselT - b.sonKut < 1.0) return; b.sonKut = gorselT;
  vfx.kut(b.kok);                                   // toplanma, Kut mührü, 0,25 sn'de sütun + şok; ekranda karartma + hız çizgileri
  his.kut(b);                                      // 0,25 sn yavaşlatma + yakınlaştırma + sarsıntı + altın parlama
  const gr = b.model.userData.gorunum;
  if (gr) { gr.kenar('#ffd27a', 1.2); kuyruk.push({ t: gorselT + 1.2, is: () => gr.kenar(b.u.taraf === 0 ? G.RIM.biz : G.RIM.rakip, b.u.taraf === 0 ? G.RIM_GUC.biz : G.RIM_GUC.rakip) }); }
  kutKart = { t0: performance.now() / 1000, img: portreAl(b.u.b.h), ad: D.kahraman(b.u.b.h).ad, taraf: b.u.taraf };
  bantEkle(b, '✨ KUT', '#ffe08a');
  if (dinleyici.kut) dinleyici.kut(b.u);
}

// ── 2D kaplama: çubuklar, durumlar, sayılar ──
function ekran(p) { const v = p.clone().project(kamera), c = kaplama; const w = c.clientWidth, h = c.clientHeight; return { x: (v.x + 1) / 2 * w, y: (1 - v.y) / 2 * h, z: v.z }; }
// sayılar aynı birimde en az 0,12 sn arayla çıkar (zaman kuyruğu); yetenek adı ayrı bant yuvasında (sayılarla çakışmaz)
function yaziEkle(b, metin, renk, olcek = 1, buyuk = false, ek = {}) {
  const gec = Math.max(0, b.yaziSon + 0.12 - gorselT); b.yaziSon = gorselT + gec;
  const yon = ((b.yaziSira = (b.yaziSira || 0) + 1) % 2 ? 1 : -1);
  yazilar.push({ uid: b.uid, b, p: b.kok.position.clone().add(new THREE.Vector3(0, 1.25 * (b.kok.userData.vfxBoy || 1), 0)), metin, renk, yas: -gec, olcek, buyuk, yon, ...ek });
}
const bantlar = [];
function bantEkle(b, metin, renk = '#ffe9b0') { if (!metin) return; for (let i = bantlar.length - 1; i >= 0; i--) if (bantlar[i].uid === b.uid) bantlar.splice(i, 1); bantlar.push({ uid: b.uid, b, metin, renk, yas: 0 }); }
function sayiGoster(f) {
  const b = birimler.get(f.u); if (!b) return;
  const k = birimler.get(f.k), el = k ? ELEMENT_H[k.u.b.h] : null, kritik = f.tip === 'hasar' && f.n >= 200;
  const hasarRenk = kritik ? '#ffd84a' : (f.tip === 'dot' ? (SAYI_RENK[el] || '#ffb36a') : '#ffffff');
  const m = { hasar: ['-' + f.n, hasarRenk], dot: ['-' + f.n, hasarRenk], iyi: ['+' + f.n, '#7dffa0'], kalkan: ['🛡' + f.n, '#dfe9ff'], kac: ['kaçtı', '#cfcfcf'] }[f.tip];
  if (!m || (f.tip !== 'kac' && f.n < 5)) return;
  yaziEkle(b, m[0], m[1], kritik ? 1.25 : 1, kritik, { kritik, kenar: (f.tip === 'hasar' && !kritik && el) ? SAYI_RENK[el] : null });
}
const YAZI_FONT = '"Trebuchet MS","Segoe UI",system-ui,sans-serif';
function kaplamaCiz() {
  const w = kaplama.clientWidth, h = kaplama.clientHeight;
  const s = anlikGorsel();
  if (s) for (const [uid, b] of birimler) {
    const i = sim.birimler.findIndex(u => u.uid === uid), a = s[i]; if (!a || a.olu) continue;
    const p = ekran(b.kok.position.clone().add(new THREE.Vector3(0, 1.12 * (b.kok.userData.vfxBoy || 1) + 0.12, 0)));
    const gw = 44, x = p.x - gw / 2, y = p.y, tr = b.u.taraf === 0 ? '#59d0ff' : '#ff5a6a';
    kcx.fillStyle = 'rgba(10,6,24,.78)'; yuvarlak(x - 2, y - 2, gw + 4, 12, 4); kcx.fill();
    kcx.strokeStyle = tr; kcx.lineWidth = 1.5; yuvarlak(x - 2, y - 2, gw + 4, 12, 4); kcx.stroke();
    kcx.fillStyle = b.u.taraf === 0 ? '#5be37f' : '#ff5a6a'; yuvarlak(x, y, gw * Math.max(0, a.hp / a.mx), 5, 2.5); kcx.fill();
    if (a.kalkan > 0) { kcx.fillStyle = '#eef3ff'; kcx.fillRect(x, y, Math.min(gw, gw * a.kalkan / a.mx), 2); }
    kcx.fillStyle = '#6fb8ff'; yuvarlak(x, y + 6.5, gw * a.mp / a.mana, 2.5, 1.2); kcx.fill();
    const yl = b.u.b.s || 1; if (yl > 1) { kcx.font = `bold 11px ${YAZI_FONT}`; kcx.fillStyle = '#ffd36a'; kcx.textAlign = 'center'; kcx.fillText('★'.repeat(yl), p.x, y - 5); }
  }
  // yetenek adı bandı: can çubuğunun üstünde, mor hap zemin
  for (const bt of bantlar) {
    const e = bt.yas / 1.3, b = bt.b; const p = ekran(b.kok.position.clone().add(new THREE.Vector3(0, 1.12 * (b.kok.userData.vfxBoy || 1) + 0.12, 0)));
    const sc = e < 0.08 ? 0.7 + 0.3 * (e / 0.08) * 1.15 : 1, al = e > 0.8 ? (1 - e) / 0.2 : 1; kcx.globalAlpha = Math.max(0, al);
    kcx.font = `900 ${Math.round(14 * sc)}px ${YAZI_FONT}`; kcx.textAlign = 'center'; const tw = kcx.measureText(bt.metin).width + 16, yy = p.y - 30 - e * 6;
    kcx.fillStyle = 'rgba(40,16,70,.85)'; yuvarlak(p.x - tw / 2, yy - 14, tw, 20, 10); kcx.fill(); kcx.strokeStyle = 'rgba(255,214,120,.8)'; kcx.lineWidth = 1.5; kcx.stroke();
    kcx.fillStyle = bt.renk; kcx.fillText(bt.metin, p.x, yy + 1);
  }
  kcx.globalAlpha = 1;
  // sayılar: patlayarak büyür, sonra parabolik yayla yan-yukarı süzülür; kritikte büyük + altın kenar + KRİTİK
  for (const y of yazilar) {
    if (y.yas < 0) continue;
    const p = ekran(y.p); const e = y.yas / 0.95; kcx.globalAlpha = Math.max(0, 1 - Math.pow(Math.max(0, e - 0.35) / 0.65, 2));
    const sc = e < 0.12 ? 1.7 - 5.8 * e : 1, boy = Math.round((y.kritik ? 26 : y.buyuk ? 20 : 17) * y.olcek * sc);
    const xx = p.x + y.yon * e * 18, yy = p.y - (50 * e - 40 * e * e) - 8;
    kcx.font = `900 ${boy}px ${YAZI_FONT}`; kcx.textAlign = 'center'; kcx.lineJoin = 'round';
    kcx.lineWidth = y.kritik ? 6 : 4.5; kcx.strokeStyle = y.kritik ? '#7a3a00' : 'rgba(20,8,40,.9)'; kcx.strokeText(y.metin, xx, yy);
    if (y.kenar) { kcx.lineWidth = 2; kcx.strokeStyle = y.kenar; kcx.strokeText(y.metin, xx, yy); }
    kcx.fillStyle = y.renk; kcx.fillText(y.metin, xx, yy);
    if (y.kritik) { kcx.font = `900 11px ${YAZI_FONT}`; kcx.lineWidth = 3; kcx.strokeStyle = '#3a1800'; kcx.strokeText('KRİTİK', xx, yy - boy * 0.9); kcx.fillStyle = '#ffe9a0'; kcx.fillText('KRİTİK', xx, yy - boy * 0.9); }
  }
  kcx.globalAlpha = 1;
  // Kut portre kartı: soldan kayar, 1,1 sn kalır
  if (kutKart) {
    const t = performance.now() / 1000 - kutKart.t0; if (t > 1.5) kutKart = null;
    else { const gir = Math.min(1, t / 0.25), cik = t > 1.2 ? (t - 1.2) / 0.3 : 0, ox = -260 * (1 - gir) * (1 - gir) * (1 - gir) - 260 * cik * cik;
      const X = 16 + ox, Y = h * 0.3, W2 = 230, H2 = 86; kcx.save(); kcx.globalAlpha = 1 - cik;
      const g = kcx.createLinearGradient(X, 0, X + W2, 0); g.addColorStop(0, 'rgba(70,28,120,.95)'); g.addColorStop(1, 'rgba(70,28,120,0)');
      kcx.fillStyle = g; yuvarlak(X, Y, W2, H2, 16); kcx.fill(); kcx.strokeStyle = '#ffd76a'; kcx.lineWidth = 2; kcx.beginPath(); kcx.moveTo(X + 8, Y + H2); kcx.lineTo(X + W2 * 0.8, Y + H2); kcx.stroke();
      if (kutKart.img.complete && kutKart.img.naturalWidth) { kcx.save(); kcx.beginPath(); kcx.arc(X + 44, Y + H2 / 2, 36, 0, Math.PI * 2); kcx.clip(); kcx.drawImage(kutKart.img, X + 8, Y + H2 / 2 - 36, 72, 72); kcx.restore();
        kcx.strokeStyle = '#ffd76a'; kcx.lineWidth = 3; kcx.beginPath(); kcx.arc(X + 44, Y + H2 / 2, 36, 0, Math.PI * 2); kcx.stroke(); }
      kcx.textAlign = 'left'; kcx.font = `900 13px ${YAZI_FONT}`; kcx.fillStyle = '#e6c2ff'; kcx.fillText('KUT', X + 90, Y + 34);
      kcx.font = `900 18px ${YAZI_FONT}`; kcx.fillStyle = '#ffe9b0'; kcx.lineWidth = 3; kcx.strokeStyle = 'rgba(20,8,40,.9)'; kcx.strokeText(kutKart.ad, X + 90, Y + 56); kcx.fillText(kutKart.ad, X + 90, Y + 56);
      kcx.restore(); }
  }
}
function yuvarlak(x, y, w, h, r) { r = Math.min(r, h / 2, Math.max(0, w) / 2); kcx.beginPath(); kcx.moveTo(x + r, y); kcx.arcTo(x + w, y, x + w, y + h, r); kcx.arcTo(x + w, y + h, x, y + h, r); kcx.arcTo(x, y + h, x, y, r); kcx.arcTo(x, y, x + w, y, r); kcx.closePath(); }
function anlikGorsel() { const i = gorselT / DT; const a = Math.floor(i); const s0 = anlik[Math.min(a, anlik.length - 1)], s1 = anlik[Math.min(a + 1, anlik.length - 1)]; if (!s0) return null; const k = Math.min(1, i - a);
  return s0.map((x, j) => ({ ...x, x: x.x + (s1[j].x - x.x) * k, y: x.y + (s1[j].y - x.y) * k, hp: x.hp + (s1[j].hp - x.hp) * k, mp: s1[j].mp, kalkan: s1[j].kalkan })); }

// ── Kare döngüsü ──
const _ka = new THREE.Vector3(), _kb = new THREE.Vector3();
const acıFark = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
// Kadraj kamerası (yalnız görüntü): yaşayan birimlerin XZ sınır kutusuna 1 hücre pay ile yaklaşır; 1,5 sn yumuşatma
function kadraj(dtR) {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, n = 0;
  if (sim && !sim.bitti) for (const b of birimler.values()) { if (b.olumT >= 0) continue; const p = b.kok.position; x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); n++; }
  let olcek = 1, mx = 0, mz = kam.tabanH.z;
  if (n >= 2) {
    const gen = x1 - x0 + 2.2, der = z1 - z0 + 2.4;
    olcek = Math.min(1, Math.max(0.66, Math.max(gen / 7.2, der / 8.6)));
    mx = (x0 + x1) / 2 * 0.5; mz = (z0 + z1) / 2 + 0.25;
  }
  if (kam.serbest) return;
  const k = kam.ilk ? 1 : 1 - Math.exp(-dtR / 0.5); kam.ilk = false;
  kam.olcek += (olcek - kam.olcek) * k;
  kam.merkez.x += (mx - kam.merkez.x) * k; kam.merkez.z += (mz - kam.merkez.z) * k;
  // kamera: taban yönünde kalır, bakış noktası yakınlaştıkça savaşın merkezine kayar
  const zf = (1 - kam.olcek) / 0.34;
  _ka.copy(kam.tabanP).sub(kam.tabanH).multiplyScalar(kam.olcek);
  _kb.set(kam.merkez.x * zf, 0, kam.tabanH.z + (kam.merkez.z - kam.tabanH.z) * zf);
  kamera.position.copy(_kb).add(_ka); kamera.lookAt(_kb); kamera.updateMatrixWorld(true);
}
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
    const liste = [...birimler.values()];
    // görsel ayrıştırma: birbirine gövde yarıçaplarından yakın iki birim yumuşakça itilir (yalnız görüntü; motor konumu değişmez)
    for (const b of liste) b._it = b._it || new THREE.Vector2(), b._it.set(0, 0);
    for (let x = 0; x < liste.length; x++) for (let y = x + 1; y < liste.length; y++) {
      const A = liste[x], B = liste[y]; if (A.olumT >= 0 || B.olumT >= 0) continue;
      const ia = sim.birimler.findIndex(u => u.uid === A.uid), ib = sim.birimler.findIndex(u => u.uid === B.uid); const a1 = s[ia], b1 = s[ib]; if (!a1 || !b1) continue;
      let dx = a1.x - b1.x, dz = a1.y - b1.y; const d = Math.hypot(dx, dz), en = (A.yaricap + B.yaricap) * 0.92;
      if (d < en) { if (d < 1e-4) { dx = A.u.taraf ? 1 : -1; dz = 0; } const L = Math.hypot(dx, dz) || 1, it = Math.min(0.3, (en - d) * 0.5); A._it.x += dx / L * it; A._it.y += dz / L * it; B._it.x -= dx / L * it; B._it.y -= dz / L * it; }
    }
    for (const [uid, b] of birimler) {
      const i = sim.birimler.findIndex(u => u.uid === uid), a = s[i];
      const hedef = dunya(a.x, a.y);
      const ddx = a.x - b.oncekiX, ddz = a.y - b.oncekiY, yol = Math.hypot(ddx, ddz);
      if (dt > 1e-5) { b.hizG = yol / dt; b.hizS += (b.hizG - b.hizS) * Math.min(1, dt * 8); }
      const hareket = yol > 0.002 * Math.max(1, hizKati) || (dt <= 1e-5 && b.hizG > 0.05); b.oncekiX = a.x; b.oncekiY = a.y;
      const kz = Math.min(1, dt * 8); b.ayir.x += (b._it.x - b.ayir.x) * kz; b.ayir.y += (b._it.y - b.ayir.y) * kz;
      b.kok.position.x = hedef.x + b.ayir.x; b.kok.position.z = hedef.z + b.ayir.y; b.kok.position.y = ARENA_Y;
      const olu = b.olumT >= 0, bay = b.bay;
      const donuk = his.donuk(b), dtB = donuk ? 0 : dt;     // yerel hit-stop: bu birimin animasyonu donar
      b.yerelT += dtB;
      // bakış: yürürken hareket yönüne (yan/geri yürüme yok), dururken hedefe; bizim taraf beklerken yüzünü kameraya 25–30° çevirir
      if (!olu) {
        let aci = null;
        if (hareket && yol > 1e-4 && b.durum !== 'saldir' && b.durum !== 'yetenek') aci = Math.atan2(ddx, ddz);
        else if (a.hedef >= 0) { const hb = birimler.get(a.hedef); if (hb) { const v = hb.kok.position.clone().sub(b.kok.position); aci = Math.atan2(v.x, v.z); } }
        if (b.zaferMi) aci = Math.atan2(kamera.position.x - b.kok.position.x, kamera.position.z - b.kok.position.z);
        if (aci !== null) b.hedefAci = aci;
        let ofs = 0;
        if (b.u.taraf === 0 && !b.zaferMi && b.durum !== 'saldir' && b.durum !== 'yetenek') {
          let f = acıFark(Math.atan2(kamera.position.x - b.kok.position.x, kamera.position.z - b.kok.position.z), b.hedefAci);
          if (Math.abs(f) > 2.8) f = (b.kok.position.x < 0 ? -1 : 1) * Math.PI;
          ofs = Math.max(-0.5, Math.min(0.5, f));
        }
        b.yuzOfs = (b.yuzOfs || 0) + (ofs - (b.yuzOfs || 0)) * Math.min(1, dt * (ofs ? 4 : 9));
        const fark = acıFark(b.hedefAci + b.yuzOfs, b.kok.rotation.y); b.kok.rotation.y += fark * Math.min(1, dt * 8);
      }
      const ops = { hiz: olu ? 0 : (hareket ? b.hizS : 0), saldiri: bay.saldiri, yetenek: bay.yetenek, vurul: bay.vurul || false, olum: olu, zafer: b.zaferMi };
      // animasyon durumu
      if (b.isk) {
        const i2 = b.isk;
        if (!olu) {
          if ((b.durum === 'yetenek' || b.durum === 'vurul' || b.durum === 'ara' || (b.durum === 'saldir' && !b.zk)) && gorselT >= b.tekBitis) {
            if (b.dizi && b.dizi.length) { const n = b.dizi.shift(); const loop = n.endsWith('_Loop'); oyna(b, n, { gecis: 0.06 }); b.tekBitis = gorselT + (loop ? 0.6 : ual.klip[n].duration); }
            else b.durum = '';
          }
          if (b.durum === '' || b.durum === 'bekle' || b.durum === 'yuru') {
            // yürüme: adım uzunluğu hıza eşlenir (ayak kaymaz); 1,8 katı aşınca koşuya geçer
            let istek = i2.beklemeAd, ts = null;
            if (hareket) {
              const yH = (b.adimHiz && b.adimHiz.Walk_Loop) || 1.2, jH = (b.adimHiz && b.adimHiz.Jog_Fwd_Loop) || 2.4, kH = b.gor.yuruHiz || 1;
              const jog = b.u.soy.includes('atli') || b.hizS / yH > 1.8;
              istek = jog ? 'Jog_Fwd_Loop' : 'Walk_Loop'; ts = Math.min(1.8, Math.max(0.6, b.hizS / (jog ? jH : yH))) * (jog ? 1 : kH);
            }
            if (i2.aktifAd !== istek) oyna(b, istek, { dongu: true, gecis: 0.2 }); if (ts !== null && i2.aktif) i2.aktif.timeScale = ts;
            b.durum = hareket ? 'yuru' : 'bekle';
            // bekleme çeşitliliği: 4–7 sn'de bir kısa hareket
            if (!hareket) { b.araT -= dtB; if (b.araT <= 0 && b.gor.ara && b.gor.ara.length) { const ad = b.gor.ara[(b.salSira + b.uid) % b.gor.ara.length]; b.araT = 4 + Math.random() * 3;
              if (ual.klip[ad]) { oyna(b, ad, { gecis: 0.25 }); b.tekBitis = gorselT + Math.min(1.6, ual.klip[ad].duration); b.durum = 'ara'; } } }
          }
        }
        zkGuncelle(b);
        i2.mix.update(dtB); aktar(b);
        ikiAyakliGuncelle(b.ik, dtB, { ...ops, hareket: hareket && !olu, saldiri: bay.saldiri && typeof bay.saldiri === 'object' ? bay.saldiri : null });
      } else if (b.dort) {
        const r = dortAyakliGuncelle(b.dort, dtB, { ...ops, saldiri: !!bay.saldiri });
        // şahlanıp yere vurma: toz + şok + sarsıntı, yakındaki düşmanlar sarsılır (yalnız görüntü)
        if (r && r.olay === 'yerVur') { vfx.yapi.sok(b.kok.position, { renk: '#e8d2b0', r: 0.9, toz: true, tozRenk: '#b49a7a', tozN: 10, sure: 0.45 }); his.sarsinti(0.3, 0.25);
          for (const o of birimler.values()) if (o.u.taraf !== b.u.taraf && o.olumT < 0 && o.kok.position.distanceTo(b.kok.position) < 1.6) his.darbe(o, o.kok.position.clone().sub(b.kok.position), 0.5); }
      } else if (b.yilan) {
        const r = yilanGuncelle(b.yilan, dtB, { ...ops, saldiri: !!bay.saldiri });
        if (r && r.olay === 'toz' && !hafif) vfx.yapi.parca({ p: _ka.set(b.kok.position.x, ARENA_Y + 0.05, b.kok.position.z), v: _kb.set(0, 0.3, 0), drag: 2, omur: 0.6, boy: 0.16, boy2: 0.4, renk: '#c9b090', kare: 'toz', normal: true, rot: 'r', a: 0.45, hot: 0, on: 0 });
      }
      bay.saldiri = null; bay.yetenek = false; bay.vurul = 0;
      // taraf diski: vuruşta kısa nabız
      if (b.halkalar[0]) { b.diskNabiz = Math.max(0, (b.diskNabiz || 0) - dtGercek); b.halkalar[0].material.opacity = 0.5; b.halkalar[0].scale.setScalar((b.gor.tur === 'iki' ? 1 : 1.15) * (1 + b.diskNabiz * 0.6)); }
      // çözülme bitince kök (taraf halkası, temas gölgesi) de gizlenir
      if (olu && !b.govde.visible && gorselT - b.olumT > 0.5) b.kok.visible = false;
      // sürekli durum efektleri (yalnız değişimde)
      if (!olu && a && !a.olu) {
        for (const [tur, alan] of DURUM_ESLE) if (b.vd[tur] !== a[alan]) { b.vd[tur] = a[alan]; vfx.durum(b.kok, tur, a[alan]); }
        const kal = a.kalkan > 0; if (b.vd.kalkan !== kal) { b.vd.kalkan = kal; vfx.durum(b.kok, 'kalkan', kal); }
      }
    }
    for (const y of yazilar) y.yas += dt; yazilar = yazilar.filter(y => y.yas < 0.95);
    for (const bt of bantlar) bt.yas += dt; for (let i = bantlar.length - 1; i >= 0; i--) if (bantlar[i].yas >= 1.3) bantlar.splice(i, 1);
    efektler = efektler.filter(e => { if (e.kalici) return true; e.yas += dt; const k = Math.min(1, e.yas / e.sure); e.guncelle(t, k, dt); if (k >= 1) { sahne.remove(e.o); if (e.bitis) e.bitis(); return false; } return true; });
  }
  kadraj(dtGercek);
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
    if (b.isk) { b.zk = null; b.zkSira = []; const z = (b.gor.zafer && ual.klip[b.gor.zafer]) ? b.gor.zafer : 'Dance_Loop'; oyna(b, z, { dongu: true, gecis: 0.2 }); b.durum = 'zafer'; }
    b.zaferMi = true; his.zafer(b);
  }
}
export function temizle() { sim = null; for (const b of birimler.values()) vfx.durumTemizle(b.kok); }
// hata ayıklama / ölçüm
export function _ual() { return ual; }
// hata ayıklama: kamerayı yerleştir
export function kameraYerlestir(y, z) { kam.serbest = true; kamera.position.set(0, y, z); kamera.lookAt(0, 0, 0); kamera.fov = 50; kamera.updateProjectionMatrix(); }
// hata ayıklama: yakın kamera
export function yakinKamera(uid, uzak = 2.4, aci = 0.5) { const b = birimler.get(uid); if (!b) return; kam.serbest = true; const p = b.kok.position; kamera.position.set(p.x + Math.sin(aci) * uzak, 1.4, p.z + Math.cos(aci) * uzak); kamera.lookAt(p.x, 0.6, p.z); }
