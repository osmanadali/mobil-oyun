/* Kut Arena — 3D savaş sahnesi (tarayıcı sürümü). Kurallar: ../ANIMASYON_PLANI.md
   Motor (../sim.js) görüntünün ÖNDE_SN kadar önünde koşar; olaylar zaman damgalı kuyruğa girer,
   saldırı klipleri darbe karesi olay zamanına denk gelecek şekilde önceden başlatılır. */
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from '../vendor/three/addons/utils/SkeletonUtils.js';
import * as G from './gorunum.js';
import { vfx } from './vfx.js';
import { his, dortAyakliKur, dortAyakliGuncelle, yilanKur, yilanGuncelle, ikiAyakliKur, ikiAyakliGuncelle, onYonAci, DA_DARBE, YILAN_DARBE, yetPozVar, yetPozSondur } from './hareket.js';

const D = window.KUT_DATA;
export const ONDE_SN = 0.4;
const DT = 0.05;
const ARENA_Y = 0;                    // tahta yüzeyi
const dunya = (x, y) => new THREE.Vector3(x - 3, ARENA_Y, y - 4);

// ── Kahraman kişilik tablosu (ANIMASYON_PLANI §3–4) ──
// bekle/yuru: döngü klipleri; saldir: sırayla dönen vuruş klipleri; hazir: menzilli atışın kurulma klibi (atış klibinin bırakma karesi
// olay zamanına denk gelir); yetenek: klip dizisi (yetOn: olaydan kaç sn önce başlar; yetSure: taban klip + yordamsal poz, süre pozdan;
// yetHazir: [kurulma, atış] zamanlı klip çifti, atış karesi patlama anında); vurul: üste eklenen (additive) tepki klipleri;
// zafer; ara: beklerken 4–7 sn'de bir oynayan kısa hareket; kolAci: tombul gövdede kolları dışa açma (rad); egim/bas: duruş ofsetleri;
// boy: hedef boy çarpanı (tanklar iri); yuruHiz: yürüme klibi hız çarpanı (ağır yaratık yavaş adımlar).
const IKI = { tur: 'iki' }, DORT = { tur: 'dort' }, YILAN = { tur: 'yilan' };
const ATIS = { hazir: 'Spell_Simple_Enter', saldir: ['Spell_Simple_Shoot'] };
export const GORSEL = {
  golem:   { ...IKI, bekle: 'Idle_FoldArms_Loop', saldir: ['Punch_Cross', 'Melee_Hook'], yetenek: ['OverhandThrow'], yetOn: 0.4, zafer: 'Yes', ara: ['Idle_No_Loop'], iri: true, kolAci: 0.26, egim: 0.06, boy: 1.1, yuruHiz: 0.8, fidget: ['omuz', 'bak'] },
  // Kurbağa: menzilli vuruş büyü klibi değil, iki tokmakla göbek davulu (Davul_Vur taban klibi + hareket.js 'davul' saldırı stili).
  // Spell_Simple klipleri sağ kolu tek pozda tutuyordu: sürekli saldıran kurbağanın sağ kolu donuk görünüyordu.
  kurbaga: { ...IKI, saldir: ['Davul_Vur'], salStil: 'davul', yetenek: ['Idle_Loop'], yetOn: 0.36, yetSure: 1.0, zafer: 'Yes', ara: ['Idle_Talking_Loop'], kolAci: 0.45, onKolAci: 1.4, egim: 0.05, bas: -0.08, fidget: ['davul', 'bak', 'gerin'], bosStil: 'tempo' },
  ruzgar:  { ...IKI, ...ATIS, yetenek: ['Spell_Simple_Enter', 'Spell_Simple_Shoot'], yetOn: 0.4, zafer: 'Yes', ara: ['Idle_Talking_Loop'], idleHiz: 1.25, kolAci: 0.12 },
  kugu:    { ...IKI, ...ATIS, yetenek: ['Idle_Loop'], yetOn: 0.4, yetSure: 0.9, zafer: 'Yes', kanat: true, kolAci: 0.24, bas: 0.06, fidget: ['kanat', 'bak'] },
  ayi:     { ...IKI, bekle: 'Idle_Loop', saldir: ['Melee_Hook', 'Sword_Regular_A', 'Sword_Regular_B'], yetenek: ['Agir_Ezme'], yetOn: 0.5, zafer: 'Yes', ara: ['Idle_FoldArms_Loop'], iri: true, kolAci: 0.24, egim: 0.1, boy: 1.12, yuruHiz: 0.85, fidget: ['omuz', 'bak'] },
  anka:    { ...IKI, ...ATIS, yetenek: ['Idle_Loop'], yetOn: 0.4, yetSure: 0.85, dogus: 'NinjaJump_Land', zafer: 'Yes', kanat: true, kolAci: 0.14, fidget: ['kanat', 'bak'] },
  baykus:  { ...IKI, ...ATIS, yetenek: ['Idle_Loop'], yetOn: 0.5, yetSure: 0.6, zafer: 'Yes', ara: ['Idle_Talking_Loop'], kolAci: 0.32, bas: -0.06, idleHiz: 0.85, bosStil: 'asa' },
  tilki:   { ...IKI, hazir: 'Pistol_Aim_Neutral', saldir: ['Pistol_Shoot'], yetenek: ['Pistol_Aim_Neutral', 'Pistol_Shoot'], yetHazir: true, yetOn: 0.45, zafer: 'Yes', ara: ['Idle_Talking_Loop'], kolAci: 0.14, egim: 0.04, fidget: ['silah', 'bak'] },
  ejder:   { ...IKI, ...ATIS, yetenek: ['Idle_Loop'], yetOn: 0.45, yetSure: 0.65, zafer: 'Yes', ara: ['Idle_FoldArms_Loop'], kolAci: 0.26 },
  kurt: { ...DORT, yetOn: 0.32 }, koc: { ...DORT, yetOn: 0.36 }, kaplumbaga: { ...DORT, boy: 1.1 }, semender: { ...DORT }, bulutat: { ...DORT, kanat: true },
  yilan: { ...YILAN },
  yarasa: { ...DORT, ozgun: true, yetOn: 0.3 },
  // canavarlar (kendi Tripo modelleri). sabit: iskeletsiz model, gövde yordamsal salınır (sabitSalin)
  cakil: { ...IKI, ozgun: true, saldir: ['Punch_Cross', 'Melee_Hook'], yetenek: ['Punch_Cross'], zafer: 'Yes', iri: true, kolAci: 0.3, boy: 0.85, yuruHiz: 1.1 },
  kadimBekci: { ...IKI, ozgun: true, bekle: 'Idle_FoldArms_Loop', saldir: ['Punch_Cross', 'Melee_Hook'], yetenek: ['Agir_Ezme'], yetOn: 0.5, zafer: 'Yes', iri: true, kolAci: 0.28, egim: 0.06, boy: 1.3, yuruHiz: 0.75 },
  kirpi: { ...DORT, ozgun: true, boy: 0.95 }, tasKabuk: { ...DORT, ozgun: true, boy: 1.15 }, yildizYiyen: { ...DORT, ozgun: true, boy: 1.35, yetOn: 0.4 },
  kumAkrebi: { tur: 'sabit', ozgun: true, boy: 0.95, salin: 'yengec' }, anaAkrep: { tur: 'sabit', ozgun: true, boy: 1.3, salin: 'yengec' },
  gokBalinasi: { tur: 'sabit', ozgun: true, boy: 0.8, salin: 'yuz', havada: 0.3 },
};
// Vuruş ağırlığı (tempo): ağır yaratık uzun ve görünür kurulur, ağır toparlanır, darbede kısa durur; çevik kısa kurulup seri vurur.
// hazir: darbeden önceki kurulma (sn; motorun önden gelişini aşan kısmı vuruş tahminiyle önden başlar), sonra: toparlanma klip hızı çarpanı,
// atil: yakın vuruşta hedefe atılma (birim), durak: darbe karesinde yerel duraklama (sn; hafif kipte de ucuz)
const AGIRLIK = {
  agir:  { hazir: 0.7, dortHazir: 0.6, sonra: 0.85, atil: 0.12, atilSure: 0.25, durak: 0.06 },
  orta:  { hazir: 0.45, dortHazir: 0.4, sonra: 1.0, atil: 0.2, atilSure: 0.12, durak: 0 },
  cevik: { hazir: 0.25, dortHazir: 0.25, sonra: 1.0, atil: 0.2, atilSure: 0.1, durak: 0.03 },
};
const AGIRLIK_SINIF = { kadimBekci: 'agir', tasKabuk: 'agir', anaAkrep: 'agir', gokBalinasi: 'agir', yildizYiyen: 'agir', kirpi: 'cevik', kumAkrebi: 'cevik', golem: 'agir', ayi: 'agir', kaplumbaga: 'agir', koc: 'agir', kurt: 'cevik', bulutat: 'cevik', yarasa: 'cevik', tilki: 'cevik' };
for (const id in GORSEL) GORSEL[id].agirlik = AGIRLIK_SINIF[id] || 'orta';
const KLIP_HIZ_TAVAN = 1.3;   // saldırı klibi aralığa sığsın diye en çok bu kadar hızlanır; yetmezse klibin sonu kırpılır
// Klip darbe anları (saniye, hız 1'de). Menzilli atışta bırakma karesi; yakın vuruşta elin en ileri gittiği kare (UAL'den ölçüldü)
// UAL2 klipleri aktarımdan sonra UAL iskeletinde ölçüldü (60 kare/sn: elin kalçaya göre en ileri gittiği kare ve el hızının tepesi):
//   Melee_Hook 0,28 · Sword_Regular_A 0,24 · Sword_Regular_B 0,25 · Sword_Regular_C 0,64 (geniş savuruş) · Zombie_Scratch 0,58 (çift pençe)
//   OverhandThrow 0,36 (el başın üstünden öne geçer) · Agir_Ezme 0,62 (Sword_Heavy_Combo 2,0 sn'den kesit; iki elle tepeden ezme) ·
//   Sword_Dash 0,30 · NinjaJump_Land 0,18 (çömelme dibi). NinjaJump_Start anahtar karesi klip sonu (sıçrama anı), tabloda yok.
const DARBE = { Davul_Vur: 0.35, Punch_Jab: 0.22, Punch_Cross: 0.30, Sword_Attack: 0.43, Spell_Simple_Shoot: 0.04, Spell_Simple_Enter: 0.5,
  Melee_Hook: 0.28, Sword_Regular_A: 0.24, Sword_Regular_B: 0.25, Sword_Regular_C: 0.64, Zombie_Scratch: 0.58, Agir_Ezme: 0.62, Sword_Dash: 0.30,
  Pistol_Shoot: 0.03, OverhandThrow: 0.36, NinjaJump_Land: 0.18 };
// yakın vuruşun türü (vfx.vurus): pençe, boynuz, yumruk, ısırık
const YAKIN_TUR = { cakil: 'yumruk', kadimBekci: 'yumruk', kirpi: 'isirik', tasKabuk: 'isirik', yildizYiyen: 'isirik', kumAkrebi: 'pence', anaAkrep: 'pence', golem: 'yumruk', ayi: 'pence', yarasa: 'pence', kurt: 'isirik', kaplumbaga: 'isirik', koc: 'boynuz', bulutat: 'boynuz' };
// kahramanın elementi (sayı rengi, vuruş alt katmanı)
const ELEMENT_H = { anka: 'ates', semender: 'ates', ejder: 'isik', baykus: 'buz', kaplumbaga: 'buz', kurt: 'kristal', yilan: 'zehir', ayi: 'golge', tilki: 'golge', yarasa: 'kan',
  kurbaga: 'ses', cakil: 'toprak', kadimBekci: 'toprak', kirpi: 'toprak', tasKabuk: 'buz', kumAkrebi: 'ates', anaAkrep: 'ates', gokBalinasi: 'isik', yildizYiyen: 'golge', golem: 'toprak', koc: 'toprak', kugu: 'isik', ruzgar: 'ruzgar', bulutat: 'isik' };
const SAYI_RENK = { ates: '#ff8a3a', buz: '#8fd6ff', kristal: '#8fd6ff', zehir: '#8dff5a', golge: '#c98bff', kan: '#ff7a8e', ses: '#ffb35a', toprak: '#f0c88a', isik: '#fff08a', ruzgar: '#9ff0e0' };
// UAL2 (Unreal manken iskeleti) → UAL iskeletine yükleme anında aktarılan klipler
const UAL2_KLIP = ['Melee_Hook', 'Sword_Regular_A', 'Sword_Regular_C', 'OverhandThrow', 'Idle_FoldArms_Loop', 'Idle_No_Loop', 'NinjaJump_Start', 'NinjaJump_Land', 'Yes', 'Shield_Dash',
  'Zombie_Scratch', 'Sword_Heavy_Combo', 'Sword_Regular_B', 'Sword_Dash', 'Hit_Knockback', 'Shield_OneShot'];
const MAP2 = { Hips: 'pelvis', Spine: 'spine_01', Spine1: 'spine_02', Spine2: 'spine_03', Neck: 'neck_01', Head: 'Head',
  LeftShoulder: 'clavicle_l', LeftArm: 'upperarm_l', LeftForeArm: 'lowerarm_l', LeftHand: 'hand_l', RightShoulder: 'clavicle_r', RightArm: 'upperarm_r', RightForeArm: 'lowerarm_r', RightHand: 'hand_r',
  LeftUpLeg: 'thigh_l', LeftLeg: 'calf_l', LeftFoot: 'foot_l', LeftToeBase: 'ball_l', RightUpLeg: 'thigh_r', RightLeg: 'calf_r', RightFoot: 'foot_r', RightToeBase: 'ball_r' };
const SOY_RENK = { gok: '#bfe6ff', yer: '#c9a46b', ates: '#ff7a2e', su: '#4fb7ff', kis: '#a8e4ff', karanlik: '#a46cff', dev: '#b9a58c', avci: '#ffd76a', bilge: '#c98bff', atli: '#ffe08a' };
// menzilli vuruş mermisinin türü (vfx.mermi)
const MERMI_TUR = { golem: 'kaya', kurbaga: 'ses', anka: 'ates', semender: 'ates', ejder: 'ates', baykus: 'buz', kaplumbaga: 'buz', yilan: 'zehir', kugu: 'isik', tilki: 'ok' };
const renkAl = (b) => SOY_RENK[b.u.soy[0]] || '#ffe08a';
// ── İmza yetenek tablosu (ANIMASYON_PLANI §3–4 kahraman notları) ──
// parla: hazırlık boyunca gövde element renginde ışır, patlama anında tepe [renk, güç]; soket: VFX'in çıktığı kemik
// (el / ağız / iki el; dört ayaklıda 'bas' = boyun zincirinin ucu). Patlama anı = vfx.onSure çıkışı (yetenekBaslat 'an').
const YET_IMZA = {
  tasFirlat: { parla: ['#ffb060', 0.32], soket: 'RightHand' },
  uluma:     { parla: ['#6fc8ff', 0.5], soket: 'bas' },
  davul:     { parla: ['#ff9a2e', 0.3] },
  ruhEmme:   { parla: ['#ff3d5a', 0.32], soket: 'Head' },
  kasirga:   { parla: ['#7fe8cf', 0.35], soket: 'eller' },
  deliOfke:  { parla: ['#ff3d1a', 0.36], soket: 'bas' },
  zehir:     { parla: ['#6dff4a', 0.32], soket: 'bas' },
  buzNefes:  { parla: ['#7fd0ff', 0.26], soket: 'bas' },
  ocak:      { parla: ['#ff7a1f', 0.45], soket: 'kuyruk' },
  dortnal:   { parla: ['#ffd76a', 0.2] },
  kanat:     { parla: ['#ffd76a', 0.4], soket: 'Spine2', eller: true },
  // grup 3 — bak: hazırlık boyunca yetenek hedefine döner (hedef birimin o anki hedefi olmayabilir); eller: VFX iki el kemiğinden de çıkar
  karaGolge: { parla: ['#9a4dff', 0.18], soket: 'Head', bak: true },
  kulDogus:  { parla: ['#ff6a1f', 0.26], soket: 'eller', eller: true, bak: true },
  ayaz:      { parla: ['#8fd6ff', 0.32], soket: 'Head', eller: true },
  golgeOk:   { parla: ['#9a4dff', 0.26], soket: 'eller', bak: true },
  yildirim:  { parla: ['#fff27a', 0.2], soket: 'Head' },
};
const _soketV = new THREE.Vector3(), _soketV2 = new THREE.Vector3(), _ileriV = new THREE.Vector3();
// soket kemiğinin dünya konumu (modül düzeyinde tek vektör; vfx kopyalar). Kemik yoksa null (vfx gövde oranına düşer)
function soketKemik(b, ad) {
  const s = YET_IMZA[ad] && YET_IMZA[ad].soket; if (!s) return null;
  if (s === 'bas') return (b.dort && b.dort.basKemik) || (b.yilan && b.yilan.boyun.length && b.yilan.boyun[b.yilan.boyun.length - 1]) || null;
  if (s === 'kuyruk') { const q = b.dort && b.dort.kuyruk; return q && q.length ? q[q.length - 1] : null; }
  if (s === 'eller') return b.kemik.RightHand || null;
  return b.kemik[s] || null;
}
function soketAl(b, ad) {
  const k = soketKemik(b, ad); if (!k) return null;
  k.getWorldPosition(_soketV);
  if (YET_IMZA[ad].soket === 'eller' && b.kemik.LeftHand) _soketV.add(b.kemik.LeftHand.getWorldPosition(_soketV2)).multiplyScalar(0.5);
  return _soketV;
}
// iki elin dünya konumu (Işık Kanadı: tüy dalgası kanat uçlarından çıkar)
const _elL = new THREE.Vector3(), _elR = new THREE.Vector3();
function elAl(b, ad, v) { const k = b.kemik && b.kemik[ad]; return k ? k.getWorldPosition(v) : null; }
function ileriAl(b) { const a = b.kok.rotation.y; return _ileriV.set(Math.sin(a), 0, Math.cos(a)); }
// Boynuz Öfkesi: güçlenmiş vuruş sayacı (uid → kalan); motorun u.ofke'siyle her vuruşta eşlenir
const ofkeSay = new Map();
const SAYAC_OPS = { onc: 3, tur: 'sayac', n: 0, olcek: 0.8, buyuk: false, kritik: false, kenar: '#7a1a08', alfa: 1 };

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
let sim = null, gorselT = 0, hizKati = 1;
// Motor anlıkları: her motor adımında (0,05 sn) birim başına ALAN sayı; tek büyüyen Float64Array (adım başına nesne yok).
// Alanlar: x y hp mx mp mana kalkan olu hedef(uid|-1) sersem yavas yanik zehir lanet davul cd (saldırı bekleme süresi; vuruş tahmini)
const ALAN = 16;
let anlikVeri = new Float64Array(0), anlikSay = 0, anlikN = 0;
// Karenin görsel anlığı (iki motor adımı arası ara değer): karede BİR kez hesaplanır, birim başına kalıcı nesneye yazılır
let gorunum = [], gorunumVar = false;
let birimDizi = [];          // birimler'in dizi kopyası (sim.birimler sırasıyla; b.si = o dizideki indeks)
let uidIndeks = new Map();   // uid → sim.birimler indeksi
let kuyrukKirli = false;
function kuyrukEkle(t, is) { kuyruk.push({ t, is }); kuyrukKirli = true; }
const kuyrukSira = (a, b) => a.t - b.t;
let kaplama, kcx;           // 2D kaplama (çubuklar, sayılar)
let dinleyici = {};
let hafif = false, kutlu = new Set(), kokYol = '';
const kam = { tabanP: new THREE.Vector3(), tabanH: new THREE.Vector3(), olcek: 1, merkez: new THREE.Vector3(), ilk: true, zoom: 1, zoomH: 1, kayX: 0, kayZ: 0, kayHX: 0, kayHZ: 0, yaw: 0, yawH: 0, egim: 0, egimH: 0 };   // kutlu: Kut ile dolan (bir sonraki yeteneği büyük oynanacak) birim uid'leri

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
  zoomKur();
  vfx.kur(sahne, kamera, { kalite, zeminY: ARENA_Y, isik: true });
  boyutla();
  his.kur(kamera, { kalite, sahne });
  // gökten giriş yere çarpınca küçük doğuş efekti (ölümdeki yığılma tozunu vfx.olum yapar)
  his.dinle('toz', ({ konum, guc }) => { if (guc >= 1) vfx.spawn(konum); });
  window.addEventListener('resize', boyutla);
  // kare ölçümü ve uyarlanır kalite: ?fps=1 / kut.fps=1 gösterge; kut.uyarla=0 kapatır; ?kademe=N sabitler (deneme)
  const q = new URLSearchParams(location.search);
  if (q.get('fps') === '1' || ayarOku('kut.fps') === '1') olcer(true);
  UY.acik = ayarOku('kut.uyarla') !== '0';
  if (q.get('kademe') !== null) kademe(+q.get('kademe'));
  else if (UY.acik) { const k = +ayarOku('kut.kademe'); if (k > 0) { G.kademeUygula(k); UY.ilk = false; } }
  document.addEventListener('visibilitychange', () => { sonKareZ = 0; uyarlaSifirla(); });
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
// İskeletli ağlar gölge geçişinde kendi (paylaşılan) derinlik malzemesini kullanır: three.js'in tek ortak derinlik malzemesi iskeletli
// ve iskeletsiz ağlar arasında her karede gidip gelince program parametreleri her seferinde baştan kurulur (kare başına ayırma ve
// işlemci). Malzeme three.js'inkiyle aynı (RGBA derinlik), görüntü değişmez.
let iskeletDerinlik = null;
function golgeAc(o) { o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; if (m.material) m.material.envMapIntensity = 1;
  if (m.isSkinnedMesh && !m.customDepthMaterial) m.customDepthMaterial = iskeletDerinlik || (iskeletDerinlik = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking })); } }); }
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
  // yeni arena parçaları: kırık sütunlar kemerlerin iki yanında, amblem oyuncu tarafı kenarında, rune taşları yan kenarlarda
  // (yüksek çözünürlüklü dokular: açılışı bekletmesin diye arka planda yüklenir)
  Promise.all(['sutun', 'amblem', 'rune_tasi'].map(a => glb(a, kok).catch(() => null))).then(([sutun, amblem, rune]) => {
    if (sutun) for (const [d, boy] of [[128, 1.9], [232, 1.7], [70, 1.5], [290, 1.6]]) halkaya(sutun, d, 5.75, boy);
    if (amblem) { const o = halkaya(amblem, 0, 5.2, 0.42); o.rotation.y = Math.PI; }
    if (rune) for (const d of [100, 260]) halkaya(rune, d, 5.6, 0.18);
  });
  atmosferKur();
  for (const [x, y, z, s] of [[-11, 2.5, -9, 3.5], [12, 4, -12, 4.5], [-14, -1, 4, 3], [13, 0.5, 6, 2.6]]) { const o = yuzen.scene.clone(); olcekle(o, s, 'max'); o.position.set(x, y, z); sahne.add(o); efektler.push({ kalici: true, o, faz: x, guncelle: (t) => { o.position.y = y + Math.sin(t * 0.5 + x) * 0.25; } }); }
}
// ── ATMOSFER (yalnız görüntü; REFERANS_ANIMASYON §3, hepsi [UYGUN] bütçe) ──
// (1) alçak yükseklik sisi: adanın kenarından dışarı ve aşağı taşan yumuşak sis halkası + ada eteğinde dikey sis perdesi (tahtanın üstüne çıkmaz)
// (2) havada yavaş süzülen ışık zerreleri (tek Points çağrısı, kayma vertex shader'da; CPU güncellemesi yok)
// (Kemer huzmeleri denendi: 360° kamerada yandan bakınca gökyüzüne uzanan çizgi gibi görünüyordu; çıkarıldı.)
// Uyarlanır kalite: zerreler kademe ≥ 5'te (bloom kapalı), sis kademe ≥ 7'de (son işlem kapalı) gizlenir; 'hafif'te zerre yok.
const ATM_GURULTU = 'float h_(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); } float g_(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h_(i), h_(i + vec2(1, 0)), f.x), mix(h_(i + vec2(0, 1)), h_(i + vec2(1, 1)), f.x), f.y); }';
let atmNesne = null;
export function _atmosfer() { return atmNesne; }   // hata ayıklama: { halka, etek, zerre }
function atmosferKur() {
  const zaman = { value: 0 }, sisRenk = new THREE.Color('#c99ab8');
  const vs = 'varying vec2 vUv; varying vec3 vP; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }';
  // (1a) yatay sis halkası: r 6,0 → 17, adanın üst yüzünün biraz altında; içte yumuşak başlar, dışta söner, gürültüyle yavaşça kayar
  const halka = new THREE.Mesh(new THREE.RingGeometry(5.9, 17, 96, 1), new THREE.ShaderMaterial({
    uniforms: { uZ: zaman, uRenk: { value: sisRenk } }, vertexShader: vs,
    fragmentShader: `uniform float uZ; uniform vec3 uRenk; varying vec3 vP; ${ATM_GURULTU}
      void main(){ float r = length(vP.xz); float a = smoothstep(5.9, 7.6, r) * (1.0 - smoothstep(11.0, 17.0, r));
        float n = g_(vP.xz * 0.35 + vec2(uZ * 0.05, uZ * 0.03)) * 0.6 + g_(vP.xz * 0.9 - vec2(uZ * 0.04, 0.0)) * 0.4;
        gl_FragColor = vec4(uRenk, a * (0.28 + 0.4 * n));
        #include <colorspace_fragment>
      }`, transparent: true, depthWrite: false, fog: false, toneMapped: false }));
  halka.rotation.x = -Math.PI / 2; halka.position.y = -0.45; halka.renderOrder = 1; sahne.add(halka);
  // (1b) ada eteği: açık silindir (r 6,5; y −3 … +0,25), altta yoğun, üstte söner
  const etek = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 7.4, 3.25, 64, 1, true), new THREE.ShaderMaterial({
    uniforms: { uZ: zaman, uRenk: { value: sisRenk } }, vertexShader: vs,
    fragmentShader: `uniform float uZ; uniform vec3 uRenk; varying vec2 vUv; varying vec3 vP; ${ATM_GURULTU}
      void main(){ float a = smoothstep(0.0, 0.4, vUv.y) * (1.0 - smoothstep(0.5, 1.0, vUv.y));
        // eğik bakılan kısım yoğun; tam karşıdan (perde gibi) ve silüette (düz kenar çizgisi) söner → hacim gibi okunur
        vec3 N = normalize(vec3(vP.x, 0.0, vP.z)), V = normalize(cameraPosition - vP); float f = 1.0 - abs(dot(N, V)), s = 4.0 * f * (1.0 - f);
        float n = g_(vec2(vUv.x * 40.0 + uZ * 0.08, vP.y * 0.8 - uZ * 0.05));
        gl_FragColor = vec4(uRenk, a * s * (0.24 + 0.32 * n));
        #include <colorspace_fragment>
      }`, transparent: true, depthWrite: false, fog: false, toneMapped: false, side: THREE.DoubleSide }));
  etek.position.y = -1.37; etek.renderOrder = 1; sahne.add(etek);
  // (2) ışık zerreleri: adanın üstünde silindir hacmi (r < 8, y 0,3–4,5); her zerre kendi fazıyla yavaş süzülür, hafifçe yanıp söner
  const N = 140, pos = new Float32Array(N * 3), tohum = new Float32Array(N);
  let rs = 7; const rnd = () => ((rs = (rs * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < N; i++) { const a = rnd() * Math.PI * 2, r = 1.5 + Math.sqrt(rnd()) * 6.5; pos[i * 3] = Math.sin(a) * r; pos[i * 3 + 1] = 0.3 + rnd() * 4.2; pos[i * 3 + 2] = Math.cos(a) * r; tohum[i] = rnd(); }
  const zg = new THREE.BufferGeometry(); zg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); zg.setAttribute('aT', new THREE.BufferAttribute(tohum, 1));
  zg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2.4, 0), 10);
  const zerre = new THREE.Points(zg, new THREE.ShaderMaterial({
    uniforms: { uZ: zaman, uOlcek: { value: 300 }, uRenk: { value: new THREE.Color('#ffd9a0').multiplyScalar(1.3) } },
    vertexShader: `uniform float uZ; uniform float uOlcek; attribute float aT; varying float vA;
      void main(){ vec3 p = position; float t = uZ * (0.05 + 0.05 * aT) + aT * 6.283;
        p.x += sin(t * 1.3) * 0.6; p.z += cos(t * 1.1) * 0.6; p.y += mod(uZ * (0.04 + 0.05 * aT) + aT * 4.5, 4.5) - 2.25 + sin(t * 2.0) * 0.15;
        p.y = 0.3 + mod(p.y - 0.3 + 4.5, 4.5);
        vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
        float boy = 0.035 + 0.04 * fract(aT * 7.31);
        gl_PointSize = clamp(boy * uOlcek / -mv.z, 1.0, 9.0);
        float y = (p.y - 0.3) / 4.5; vA = smoothstep(0.0, 0.15, y) * (1.0 - smoothstep(0.75, 1.0, y)) * (0.45 + 0.55 * sin(uZ * (0.8 + aT) + aT * 30.0) * 0.5 + 0.275); }`,
    fragmentShader: `uniform vec3 uRenk; varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.0, length(d)); gl_FragColor = vec4(uRenk, a * a * vA * 0.7); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }));
  zerre.renderOrder = 6; sahne.add(zerre);
  atmNesne = { halka, etek, zerre };
  const pikselOlcek = () => renderer.getPixelRatio() * renderer.domElement.clientHeight / (2 * Math.tan(THREE.MathUtils.degToRad(kamera.fov) / 2));
  efektler.push({ kalici: true, o: zerre, guncelle: (t) => {
    zaman.value = t % 1000;
    const kd = G.kademeAl(), ince = hafif || kd >= 5;
    zerre.visible = !ince; halka.visible = etek.visible = kd < 7;
    if (!ince) zerre.material.uniforms.uOlcek.value = pikselOlcek();
  } });
}
function atesEkle(p) {
  const g = new THREE.Group(); g.position.copy(p); sahne.add(g);
  const isik = new THREE.PointLight('#ff8a3a', 4, 4, 1.8); g.add(isik);
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(0.16 - i * 0.04, 0.5 - i * 0.1, 8), new THREE.MeshBasicMaterial({ color: ['#ff5a1f', '#ff9a2e', '#ffe07a'][i], transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.position.y = 0.2; g.add(m);
  }
  efektler.push({ kalici: true, o: g, guncelle: (t) => { const C = g.children; for (let i = 0; i < C.length; i++) { const c = C[i]; if (c.isMesh) { c.scale.set(1 + Math.sin(t * 9 + i) * 0.12, 1 + Math.sin(t * 13 + i * 2) * 0.2, 1); } } isik.intensity = 3.5 + Math.sin(t * 17) * 0.6; } });
}

async function ualYukle(kok) {
  const [g, g2] = await Promise.all([glb('ual', kok), glb('ual2', kok).catch(() => null)]);
  ual = { sahne: g.scene, klip: Object.fromEntries(g.animations.map(c => [c.name, c])) };
  if (g2) { try { ual2Aktar(g2); } catch (e) { console.warn('ual2 aktarılamadı', e); } }
  // üste eklenen vurulma tepkileri (additive): saldırı klibi kesilmeden üst gövde sarsılır
  // Davul_Vur: Kurbağa'nın menzilli vuruşunun taban klibi (Idle_Loop'un ilk 0,8 sn'si; tokmak vuruşlarını hareket.js 'davul' stili ekler)
  if (ual.klip.Idle_Loop) ual.klip.Davul_Vur = THREE.AnimationUtils.subclip(ual.klip.Idle_Loop, 'Davul_Vur', 0, 24, 30);
  for (const ad of ['Hit_Chest', 'Hit_Head']) if (ual.klip[ad]) ual.klip[ad + '_Ek'] = ustGovdeEk(THREE.AnimationUtils.makeClipAdditive(ual.klip[ad].clone()), ad + '_Ek', 0.8);
  ual.adim = adimOlc();
}
// Vurulma tepkisi için üste eklenen (additive) klibi sadeleştirir: yalnız üst gövde (omurga üstü, boyun, baş, omuz/kollar) kalır — kalça,
// bacak ve parmak izleri atılır (ayaklar yerinde, eller kasılmaz); genlik 'kazanc' ile küçültülür ve son %55'te sıfıra iner (klip bittiğinde
// ya da yeniden tetiklendiğinde poz atlamaz; ham UAL klipleri baş/omurgada 13–14°, kalçada 10° açık bitiyordu).
const UST_GOVDE_RE = /DEF-(spine00[1-9]|neck|head|shoulder|upper_arm|forearm|hand[LR]?\.)/;
function ustGovdeEk(c, ad, kazanc = 1) {
  const D = c.duration, a = D * 0.45, _q = new THREE.Quaternion(), _i = new THREE.Quaternion();
  const izler = c.tracks.filter(iz => iz.name.endsWith('.quaternion') && UST_GOVDE_RE.test(iz.name)).map(iz => {
    const t = iz.times, v = Float32Array.from(iz.values);
    for (let j = 0; j < t.length; j++) { const u = t[j] <= a ? 0 : Math.min(1, (t[j] - a) / Math.max(1e-4, D - a)), w = kazanc * (1 - u * u * (3 - 2 * u));
      _q.fromArray(v, j * 4); _i.identity().slerp(_q, w); _i.toArray(v, j * 4); }
    return new THREE.QuaternionKeyframeTrack(iz.name, t, v);
  });
  const k = new THREE.AnimationClip(ad, D, izler); k.blendMode = THREE.AdditiveAnimationBlendMode; return k;
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
    const e = mixS.clipAction(klip); e.setLoop(THREE.LoopOnce, 1); e.clampWhenFinished = true; e.reset().play(); const FPS = 30, n = Math.max(2, Math.ceil(klip.duration * FPS) + 1);
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
  // türetilmiş klipler (30 kare/sn örnekli aktarımdan kesit)
  const H = ual.klip.Sword_Heavy_Combo;
  if (H) ual.klip.Agir_Ezme = THREE.AnimationUtils.subclip(H, 'Agir_Ezme', 60, 108, 30);        // kombonun son, iki elle tepeden ezme vuruşu (2,0–3,6 sn)
  const K = ual.klip.Hit_Knockback;
  if (K) {
    // geri savrulma: klip 0,3 sn'den sonra yere düşer; yalnız ilk 0,2 sn'lik savrulma alınır, 0,25 sn'de geri döner (ileri-geri). Kalça konumu
    // alınmaz (yer değiştirme his.darbe'nin işi). Üste eklenir (additive): yürüme/saldırı kesilmez.
    const izler = []; const ileri = [0, 1, 2, 3, 4, 5, 6], zaman = [0, 0.033, 0.067, 0.1, 0.133, 0.167, 0.2, 0.28, 0.36, 0.45];
    for (const iz of K.tracks) { if (!iz.name.endsWith('.quaternion')) continue; const v = iz.values, n = 4, d = new Float32Array(zaman.length * n);
      const kare = ileri.concat([4, 2, 0]); kare.forEach((f, j) => { for (let c = 0; c < n; c++) d[j * n + c] = v[f * n + c]; });
      izler.push(new THREE.QuaternionKeyframeTrack(iz.name, Float32Array.from(zaman), d)); }
    const savr = new THREE.AnimationClip('Hit_Knockback_Kisa', 0.45, izler);
    // ham savrulma kalçada ~100°, ayak/baldırda ~80° döner: yalnız üst gövdesi, %40 genlikle alınır (gövde devrilmez, ayaklar yerde)
    ual.klip.Hit_Knockback_Ek = ustGovdeEk(THREE.AnimationUtils.makeClipAdditive(savr), 'Hit_Knockback_Ek', 0.4);
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
  // 4×3 tahta: rakibin arka sırası (z ≈ −3) ve can çubukları üst kenarda kesilmesin
  kamera.fov = dar ? 41 : 35;
  kam.tabanP.set(0, dar ? 9.6 : 8.5, dar ? 8.0 : 7.3); kam.tabanH.set(0, 0, dar ? 0.1 : -0.2);
  kamera.updateProjectionMatrix();
  tahtaKadrajla(w, h);   // arayüzün bıraktığı güvenli alana göre: iki takımın bütün sıraları görünür, tahta o alanda olabildiğince büyük ve ortada
  kamera.position.copy(kam.tabanP); kamera.lookAt(kam.tabanH); kam.ilk = true; kam.serbest = false;
  kamera.updateMatrixWorld(true);   // görüş alanı denetimi ilk karede de doğru olsun
  kaplamaBoyutla();
}
// ── Tahta kadrajı ──
// Güvenli alan: arayüzün (skor paneli, yan düğmeler) kapladığı kenar payları, tuval px (arayuz.js verir: guvenliAlan(f), f(w, h) → {ust, alt, sol, sag}).
// Bakış yönü taban ayardan kalır; uzaklık ve bakış noktası birkaç adımda çözülür: tahtanın sınır kutusu (iki takımın bütün sıraları, birim boyu ve
// can çubuğu payı) ekrana izdüşürülür, kutu güvenli alana sığacak kadar uzaklaşılır/yaklaşılır ve kutunun merkezi alanın merkezine kaydırılır.
let guvenliF = null;
const KADRAJ_PAY = 1.15;   // taban kadrajın genişliği (1: tahta güvenli alanı tam doldurur; 1,15: tahta ekranda ~%13 küçük, görüş ~%15 geniş)
export function guvenliAlan(f) { guvenliF = f; if (renderer) boyutla(); }
const _tkN = [], _tkV = new THREE.Vector3(), _tkY = new THREE.Vector3();
for (const x of [-2.95, 2.95]) for (const z of [-3.6, 3.55]) for (const y of [0, z < 0 ? 2.3 : 1.6]) _tkN.push(new THREE.Vector3(x, ARENA_Y + y, z));
// engel denetimi için tahta çevresi (yan kenarlar ve ön/arka kenar boyunca; zemin ve can çubuğu yüksekliği): köşedeki arayüz öğeleri (Kut, ayakta paneli) bunlara binmemeli
const _tkC = [];
for (let i = 0; i <= 14; i++) { const z = -3.6 + 7.15 * i / 14; for (const x of [-2.95, 2.95]) for (const y of [0, z < 0 ? 2.3 : 1.6]) _tkC.push(new THREE.Vector3(x, ARENA_Y + y, z)); }
for (let i = 1; i < 8; i++) { const x = -2.95 + 5.9 * i / 8; for (const z of [-3.6, 3.55]) for (const y of [0, z < 0 ? 2.3 : 1.6]) _tkC.push(new THREE.Vector3(x, ARENA_Y + y, z)); }
const _tkE = _tkC.map(() => ({ x: 0, y: 0 }));
// hazırlık kadrajı: rakibin ön iki sırası, oyuncunun bütün tahtası ve önündeki yedek sırası (oyuncu tarafına biraz daha yakın)
const _tkNH = [];
for (const x of [-2.95, 2.95]) for (const z of [-2.3, 5.0]) for (const y of [0, z < 0 ? 1.4 : 0.9]) _tkNH.push(new THREE.Vector3(x, ARENA_Y + y, z));
// engel: {x0,y0,x1,y1} dikdörtgen ya da {cx,cy,r} daire (tuval px)
const engelde = (x, y, E) => { for (const e of E) { if (e.r != null ? (x - e.cx) ** 2 + (y - e.cy) ** 2 < e.r * e.r : x > e.x0 && x < e.x1 && y > e.y0 && y < e.y1) return true; } return false; };
// tahtanın (izdüşüm noktaları P) merkez c etrafında 1/k oranında küçülünce hiçbir engele binmediği en küçük k (0,6…2,5; ikiye bölme)
function engelK(P, cx, cy, E) {
  const carp = (k) => { for (const n of P) if (engelde(cx + (n.x - cx) / k, cy + (n.y - cy) / k, E)) return true; return false; };
  if (!carp(0.6)) return 0.6; if (carp(2.5)) return 2.5;
  let a = 0.6, b = 2.5; for (let i = 0; i < 18; i++) { const m = (a + b) / 2; if (carp(m)) a = m; else b = m; } return b;
}
function tahtaKadrajla(w, h) {
  let p = null; try { p = guvenliF && guvenliF(w, h); } catch (e) { p = null; }
  p = p || { ust: 0, alt: 0, sol: 0, sag: 0 }; const E = hzr.acik ? [] : (p.engel || []); const NK = hzr.acik ? _tkNH : _tkN;
  // alan çok daralırsa (çok alçak ekran) payları kıs: tahta en az ekranın %55'i kadar yer bulsun
  let x0 = p.sol, x1 = w - p.sag, y0 = p.ust, y1 = h - p.alt;
  if (x1 - x0 < w * 0.55) { const k = (w * 0.55) / Math.max(1, x1 - x0); const c = (x0 + x1) / 2; x0 = Math.max(0, c - (c - x0) * k); x1 = Math.min(w, c + (x1 - c) * k); }
  if (y1 - y0 < h * 0.55) { const k = (h * 0.55) / Math.max(1, y1 - y0); const c = (y0 + y1) / 2; y0 = Math.max(0, c - (c - y0) * k); y1 = Math.min(h, c + (y1 - c) * k); }
  const yon = _tkY.copy(kam.tabanP).sub(kam.tabanH); let R = yon.length(); yon.divideScalar(R);
  const sinE = Math.max(0.3, yon.y), T = kam.tabanH.clone(), th = Math.tan(THREE.MathUtils.degToRad(kamera.fov) / 2);
  for (let it = 0; it < 14; it++) {
    kamera.position.copy(T).addScaledVector(yon, R); kamera.lookAt(T); kamera.updateMatrixWorld(true);
    let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
    for (const n of NK) { _tkV.copy(n).project(kamera); const sx = (_tkV.x + 1) / 2 * w, sy = (1 - _tkV.y) / 2 * h; a0 = Math.min(a0, sx); a1 = Math.max(a1, sx); b0 = Math.min(b0, sy); b1 = Math.max(b1, sy); }
    let k = Math.max((a1 - a0) / (x1 - x0), (b1 - b0) / (y1 - y0)); const birim = 2 * R * th / h;
    if (E.length) {   // köşe engelleri: tahta (kutu merkezi alanın merkezine kayacağı için oraya göre) gerekirse biraz daha küçülür
      const ox = (x0 + x1) / 2 - (a0 + a1) / 2, oy = (y0 + y1) / 2 - (b0 + b1) / 2;
      _tkC.forEach((n, i) => { _tkV.copy(n).project(kamera); _tkE[i].x = (_tkV.x + 1) / 2 * w + ox; _tkE[i].y = (1 - _tkV.y) / 2 * h + oy; });
      k = Math.max(k, engelK(_tkE, (x0 + x1) / 2, (y0 + y1) / 2, E));
    }
    const dx = (a0 + a1) / 2 - (x0 + x1) / 2, dy = (b0 + b1) / 2 - (y0 + y1) / 2;
    T.x += dx * birim; T.z += dy * birim / sinE;
    R *= 0.35 + 0.65 * k;   // izdüşüm boyu ~ 1/uzaklık; yumuşak adım (yakın kenar perspektifi doğrusal değil)
  }
  // geniş kadraj: tahta güvenli alana tam sığdırıldıktan sonra kamera KADRAJ_PAY kadar geri çekilir (bakış noktası aynı: tahta alanın
  // ortasında kalır, yalnız küçülür); çevredeki avlu, kemerler ve kristaller de görünür. Tahta küçüldüğü için HUD'a binmez.
  R *= hzr.acik ? 1.04 : KADRAJ_PAY;
  kam.tabanH.copy(T); kam.tabanP.copy(T).addScaledVector(yon, R);
}
// test: taban kadrajda tahta sınır kutusunun ekran noktaları (tuval px)
export function tabanKutu() {
  if (!kamera) return [];
  const p = kamera.position.clone(), q = kamera.quaternion.clone();
  kamera.position.copy(kam.tabanP); kamera.lookAt(kam.tabanH); kamera.updateMatrixWorld(true);
  const r = _tkN.map(n => { const v = n.clone().project(kamera); return { x: (v.x + 1) / 2 * kapW, y: (1 - v.y) / 2 * kapH }; });
  kamera.position.copy(p); kamera.quaternion.copy(q); kamera.updateMatrixWorld(true);
  return r;
}
// 2D kaplama (sayılar, çubuklar): Tam ve 120 Hz kademesinde bugünkü gibi en çok 2 piksel oranı; daha düşük kademede en çok 1,5
// (tam ekran tuval her karede baştan çizilir; yetişemeyen cihazda bant genişliği kazanılır)
let kapKademe = -1;
function kaplamaBoyutla() {
  if (!kaplama || !renderer) return;
  const c = renderer.domElement, w = c.clientWidth, h = c.clientHeight; if (!w || !h) return;
  kapKademe = G.kademeAl();
  const dpr = Math.min(kapKademe <= 1 ? 2 : 1.5, window.devicePixelRatio || 1);
  kapW = kaplama.clientWidth || w; kapH = kaplama.clientHeight || h; kapDpr = dpr;
  kaplama.width = Math.round(w * dpr); kaplama.height = Math.round(h * dpr); kcx.setTransform(dpr, 0, 0, dpr, 0, 0);
  canGrad.hh = -1; _balonGrad = null; hudT = -1;
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
  G.malzemeIyilestir(model, { renk: u.taraf === 0 ? 'biz' : 'rakip', kahraman: u.b.h, pbrKoru: !!gor.ozgun });
  const kok3 = new THREE.Group(); const govde = new THREE.Group(); kok3.add(govde); govde.add(model);
  // yön: iki ayaklılar +Z'ye bakar; dört ayaklı ve yılanın ön yönü kemik geometrisinden bulunur (hareket.js)
  let kemik = {}; model.traverse(o => { if (o.isBone) kemik[o.name.replace('mixamorig', '').replace(':', '')] = o; });
  model.updateMatrixWorld(true);
  if (gor.tur !== 'iki') { model.rotation.y = gor.tur === 'sabit' ? (gor.yon || 0) : onYonAci(model, kemik); }
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
  { const s3 = kk2.getSize(new THREE.Vector3()); kok3.userData.yaricap = Math.min(0.68, 0.5 * Math.min(Math.max(s3.x, s3.z), gor.tur === 'iki' ? 1.0 : 1.4) * yildiz); }
  // taraf diski (paylaşımlı doku + taraf başına 2 malzeme; rakipte dışa bakan dikenler: renk körü oyuncu da ayırt eder) + kaynaşma halkası + temas gölgesi
  // 4×3 tahtada komşular 1,5 aralıkta: diskin dikenli dış kenarı (birim ölçekte 0,58) dünyada ≤ 0,62 kalır (yıldız ölçeği dahil)
  const diskS = Math.min(gor.tur === 'iki' ? 1 : 1.15, 0.62 / (0.58 * yildiz));
  const halka = new THREE.Mesh(DISK_GEO, tarafMalzeme(u.taraf)); halka.scale.setScalar(diskS); halka.userData.s = diskS;
  halka.position.y = 0.03; halka.renderOrder = -1; kok3.add(halka);
  const halkalar = [halka];
  if (u.b.f) {
    const f = D.kahraman(u.b.f);
    const h2 = new THREE.Mesh(new THREE.RingGeometry(0.49 * Math.min(1, 1.12 / yildiz), 0.56 * Math.min(1, 1.12 / yildiz), 40), new THREE.MeshBasicMaterial({ color: f.renk, transparent: true, opacity: 0.95, depthWrite: false }));
    h2.rotation.x = -Math.PI / 2; h2.position.y = 0.035; kok3.add(h2); halkalar.push(h2);
    // malzemeler malzemeIyilestir'de birime özel klonlandı: yeniden klonlamadan ışıma ver (yama korunur)
    model.traverse(m => { if (m.isMesh) for (const mm of [].concat(m.material)) if (mm && mm.emissive) { mm.emissive.set(f.renk); mm.emissiveIntensity = 0.18; } });
  }
  const leke = G.golgeLekesi(gor.tur === 'iki' ? 0.48 : 0.66); kok3.add(leke);
  const p = dunya(u.x, u.y); kok3.position.copy(p); kok3.rotation.y = u.taraf === 0 ? Math.PI : 0;
  sahne.add(kok3);
  const b = { uid: u.uid, u, kok: kok3, govde, model, kemik, gor, halkalar, leke, durum: 'bekle', tekBitis: 0, olumT: -1, oncekiX: u.x, oncekiY: u.y, hizG: 0, hizS: 0, hedefAci: kok3.rotation.y, faz: (u.uid * 0.37) % 1,
    bay: { saldiri: null, yetenek: false, vurul: 0 }, vd: {}, zaferMi: false, yerelT: 0, zk: null, zkSira: [], salSira: 0, araT: 4 + ((u.uid * 1.7) % 3), ayir: new THREE.Vector2(), sonKut: -9, yaziSon: -9,
    yaricap: kok3.userData.yaricap || 0.4, modelOlcek: model.scale.y * yildiz,
    ag: AGIRLIK[gor.agirlik] || AGIRLIK.orta,
    // vuruş tahmini (önden kurulma): motorun önden gelişinden uzun kurulma için; birim başına kalıcı nesneler (karede ayırma yok)
    onk: { var: false, darbeT: 0, son: 0, hedef: -1 }, dortSal: { darbe: 0, on: false, onay: false, iptal: false } };
  if (gor.tur === 'iki' && ual) { iskeleKur(b); b.ik = ikiAyakliKur(b); }
  else if (gor.tur === 'yilan') b.yilan = yilanKur(model, kemik, { faz: b.faz });
  else if (gor.tur === 'dort') b.dort = dortAyakliKur(model, kemik, { tur: u.b.h, faz: b.faz });
  hisHazirla(b);
  return b;
}
// İskeletsiz model (akrep, balina): gövde yordamsal salınır. yengeç: alçak, yana sallanan, vuruşta öne dalan; yuz: havada süzülen, yavaş dalgalanan
function sabitSalin(b, dt, d) {
  const m = b.model, s = b.sab || (b.sab = { y0: m.position.y + (b.gor.havada || 0), rx: m.rotation.x, rz: m.rotation.z, ry: m.rotation.y, t: b.faz * 7, vur: 0, yet: 0, vurul: 0 });
  s.t += dt * (d.hareket ? 2.2 : 1);
  if (d.saldiri) s.vur = 1; if (d.yetenek) s.yet = 1; if (d.vurul) s.vurul = 1;
  s.vur = Math.max(0, s.vur - dt * 2.6); s.yet = Math.max(0, s.yet - dt * 1.4); s.vurul = Math.max(0, s.vurul - dt * 4);
  // vurulma: anlık sıçrama yerine yumuşak yükseliş (yön bağımlı yatmayı his.darbe verir; bu yalnız küçük bir irkilme)
  s.vurulH = (s.vurulH || 0) + (s.vurul - (s.vurulH || 0)) * Math.min(1, dt * 25);
  const dal = Math.sin(Math.min(1, (1 - s.vur) * 1.25) * Math.PI) * (s.vur > 0 ? 1 : 0), yet = Math.sin((1 - s.yet) * Math.PI) * (s.yet > 0 ? 1 : 0);
  if (d.olu) { m.rotation.z = s.rz + Math.min(1.2, (m.rotation.z - s.rz) + dt * 2); m.position.y = Math.max(s.y0 - (b.gor.havada || 0), m.position.y - dt * 1.5); return; }
  if (b.gor.salin === 'yuz') {
    m.position.y = s.y0 + Math.sin(s.t * 1.1) * 0.08 + yet * 0.25;
    m.rotation.z = s.rz + Math.sin(s.t * 0.9) * 0.06; m.rotation.x = s.rx + Math.sin(s.t * 1.1 + 1) * 0.05 - dal * 0.12 + s.vurulH * 0.04;
  } else {
    m.position.y = s.y0 + Math.abs(Math.sin(s.t * (d.hareket ? 6 : 1.6))) * (d.hareket ? 0.03 : 0.012) + yet * 0.08;
    m.rotation.z = s.rz + Math.sin(s.t * (d.hareket ? 6 : 1.3)) * (d.hareket ? 0.05 : 0.025);
    m.rotation.x = s.rx + dal * 0.22 - yet * 0.18 + s.vurulH * 0.05;
  }
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
  const sRefTers = {}; for (const k in sRef) sRefTers[k] = sRef[k].clone().invert();
  b.isk = { kaynak, SB, mix, eylem, sRef, sRefTers, sRefP, al, tRelP, hipS, aktif: null, beklemeAd: bekleAd, borc: 0, duz: duzZincirMi(b.kemik) };
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
// Kare başına yeni nesne üretmeden: dünya dönüşleri güncel matrixWorld'den okunur (getWorldQuaternion üst zinciri her kemikte
// yeniden hesaplar ve her çağrıda yeni Quaternion gerekir). Önce kökten modele kadar zincir ve kaynak iskelet tazelenir.
const _aqM = new THREE.Quaternion(), _aq1 = new THREE.Quaternion(), _aq2 = new THREE.Quaternion(), _ap1 = new THREE.Vector3(), _ap2 = new THREE.Vector3(), _apS = new THREE.Vector3(), _apT = new THREE.Vector3();
const dunyaQ = (o, q) => { o.matrixWorld.decompose(_apT, q, _apS); return q; };
function aktar(b) {
  const i = b.isk; if (!i) return;
  i.kaynak.updateMatrixWorld(true); b.model.updateWorldMatrix(true, true);
  const M = dunyaQ(b.model, _aqM);
  for (let n = 0; n < SIRA.length; n++) {
    const k = SIRA[n], t = b.kemik[k], s = i.SB[MAP[k]]; if (!t || !s || !i.al[k]) continue;
    const delta = dunyaQ(s, _aq1).multiply(i.sRefTers[k]);            // kaynakta (köke göre) yön değişimi
    const istenen = _aq2.copy(M).multiply(delta).multiply(i.al[k]);   // hedef gövde düzleminde aynı değişim
    t.quaternion.copy(dunyaQ(t.parent, _aq1).invert().multiply(istenen));
    if (k === 'Hips') {
      const off = _ap1.setFromMatrixPosition(s.matrixWorld).sub(i.kaynak.position).sub(i.sRefP.Hips).multiplyScalar(i.hipS);
      const yerel = _ap2.copy(i.tRelP.Hips).add(off);
      t.position.copy(t.parent.worldToLocal(b.model.localToWorld(yerel)));
    }
    // düz zincirde (her eşlenen kemiğin ebeveyni ya eşlenen kemik ya da eşlenenlerin üstünde) yalnız bu kemiğin dünya matrisi
    // tazelenir; alt dallar (parmak, kuyruk) çizimde sahne güncellemesiyle zaten hesaplanır. Değilse eski yol: alt ağaçla birlikte.
    if (i.duz) { t.updateMatrix(); t.matrixWorld.multiplyMatrices(t.parent.matrixWorld, t.matrix); }
    else t.updateMatrixWorld(true);
  }
}
// eşlenen kemiklerin arasına eşlenmeyen kemik giriyor mu (giriyorsa onun dünya matrisi bayatlar; tam güncelleme gerekir)
function duzZincirMi(kemik) {
  const esli = new Set(); for (const k of SIRA) if (kemik[k]) esli.add(kemik[k]);
  for (const t of esli) {
    let p = t.parent, araGirdi = false;
    while (p && !esli.has(p)) { if (p.isBone) araGirdi = true; p = p.parent; }
    if (p && araGirdi) return false;   // eşlenen bir ataya eşlenmeyen kemikten geçerek ulaşıldı
  }
  return true;
}

// ── Savaşı kur ──
export async function savasKur(yeniSim, kok = '', { yerinde = false } = {}) {
  for (const b of birimler.values()) { vfx.durumTemizle(b.kok); sahne.remove(b.kok); if (b.isk) sahne.remove(b.isk.kaynak); }
  for (const e of efektler) if (!e.kalici) sahne.remove(e.o);
  efektler = efektler.filter(e => e.kalici); kuyruk = []; kuyrukKirli = false; yazilar = []; bantlar.length = 0; balonSira.length = 0; kutKart = null; birimler = new Map(); birimDizi = []; kutlu = new Set(); ofkeSay.clear(); kam.ilk = true;
  his.sifirla(); mvpSifirla();
  sim = yeniSim; gorselT = 0;
  anlikN = sim.birimler.length; anlikSay = 0;
  if (anlikVeri.length < anlikN * ALAN * 940) anlikVeri = new Float64Array(anlikN * ALAN * 940);   // ~47 sn (45 sn süre sınırı); gerekirse büyür
  gorunum = sim.birimler.map(() => ({ x: 0, y: 0, hp: 0, mx: 1, mp: 0, mana: 0, kalkan: 0, olu: false, hedef: -1, sersem: false, yavas: false, yanik: false, zehir: false, lanet: false, davul: false }));
  gorunumVar = false;
  uidIndeks = new Map(); sim.birimler.forEach((u, i) => uidIndeks.set(u.uid, i));
  istatSifirla();
  const liste = await Promise.all(sim.birimler.map(u => birimKur(u, kok)));
  for (const b of liste) birimler.set(b.uid, b);
  birimDizi = liste; liste.forEach((b, i) => { b.si = i; });
  // gölgelendiricileri yükleme ekranındayken derle: MVP yakın planı kameranın daha önce görmediği arka planı (kemerler vb.) ve ışını
  // kadraja sokar; ilk çizimde derlenmeleri bitişte takılma yapıyordu. compile() görünür her nesneyi görüş alanından bağımsız işler.
  if (!mvpIsin) mvpIsin = mvpIsinKur();
  mvpIsin.grup.visible = mvpIsin.arka.visible = true; try { renderer.compile(sahne, kamera); } catch (e) { /* derleme ön ısıtması isteğe bağlı */ } mvpIsin.grup.visible = mvpIsin.arka.visible = false;
  kotuKare = 0; G.golgeYenile(); uyarlaSifirla(1000);   // kurulumdan sonraki ilk saniye (gölgelendirici derleme) ölçülmez
  // gökten giriş: taraf içinde sırayla, rakip biraz sonra (giriş sürerken görüntü zamanı bekler → motor da bekler)
  const sira = [0, 0];
  if (hzr.birimG) {
    hzr.birimG.visible = false;
    // hazırlıktaki duruşla aynı yönden başla (yüz kameraya dönükken savaşa döner)
    if (yerinde) for (const b of liste) { if (b.u.taraf) continue; for (const h of hzr.birim.values()) if (h.kok.position.distanceTo(b.kok.position) < 0.2) { b.kok.rotation.y = h.kok.rotation.y; break; } }
  }
  for (const b of liste) { const tr = b.u.taraf ? 1 : 0; if (!(yerinde && tr === 0)) his.giris(b, sira[tr]++ * 0.08 + (tr ? 0.15 : 0)); if ((b.u.b.s || 1) >= 3) vfx.durum(b.kok, 'yildiz3', true); }
  anlikAl(); // t=0
  saat.getDelta();
}
function anlikAl() {
  const L = sim.birimler, n = anlikN, o = anlikSay * n * ALAN;
  if (o + n * ALAN > anlikVeri.length) { const yeni = new Float64Array(Math.max(1024, (o + n * ALAN) * 2)); yeni.set(anlikVeri.subarray(0, o)); anlikVeri = yeni; }
  const V = anlikVeri;
  for (let j = 0; j < n; j++) {
    const u = L[j], d = u.durum || {}, k = o + j * ALAN;
    V[k] = u.x; V[k + 1] = u.y; V[k + 2] = u.hp; V[k + 3] = u.mx; V[k + 4] = u.mp || 0; V[k + 5] = u.mana || 0; V[k + 6] = u.kalkan || 0;
    V[k + 7] = u.olu ? 1 : 0; V[k + 8] = u.hedef ? u.hedef.uid : -1;
    V[k + 9] = d.sersem ? 1 : 0; V[k + 10] = d.yavas ? 1 : 0; V[k + 11] = d.yanik ? 1 : 0; V[k + 12] = d.zehir ? 1 : 0; V[k + 13] = d.lanet ? 1 : 0; V[k + 14] = d.davul ? 1 : 0;
    V[k + 15] = u.cd || 0;
  }
  anlikSay++;
}
// adım i, birim j, alan a
const anlikDeger = (i, j, a) => anlikVeri[(i * anlikN + j) * ALAN + a];
function simIlerlet() {
  // motor görüntünün ONDE_SN önünde kalsın
  while (!sim.bitti && sim.t < gorselT + ONDE_SN) {
    const tOnce = sim.t; sim.adim();
    const liste = sim.fx.map(f => ({ ...f, t: tOnce }));
    for (let i = 0; i < liste.length; i++) olayPlanla(liste[i], liste, i);
    istatTopla(liste);
    const onceki = anlikSay - 1;
    anlikAl();
    // kalkan kırıldı mı? (motor ayrı olay yaymaz; anlık farkından çıkar)
    const yeni = anlikSay - 1;
    if (onceki >= 0) for (let j = 0; j < anlikN; j++) if (anlikDeger(onceki, j, 6) > 0 && anlikDeger(yeni, j, 6) <= 0 && !anlikDeger(yeni, j, 7)) { const u = sim.birimler[j]; kuyrukEkle(tOnce, () => sesBildir({ tip: 'kalkanKir', u: u.uid })); }
  }
}
// ── Savaş sonu hasar özeti: motorun fx olaylarından birim başına verilen/alınan hasar ve iyileştirme ──
// hasar: k kaynak uid · dot: k yok (−1) → yanığı/zehiri en son bulaştıran düşmana yazılır ·
// iyi/kalkan: kaynak uid yok → aynı adımda önündeki yetenek/vuruş olayının sahibine, yoksa (Ana pasifi) yakındaki Ana'ya ya da kendisine
let istat = new Map(), dotKaynak = new Map();
const DOT_YETENEK = { zehir: 'hedef', ocak: 2.2, kulDogus: 'hasar' };
function istatSifirla() {
  istat = new Map(); dotKaynak = new Map();
  for (const u of sim.birimler) istat.set(u.uid, { uid: u.uid, taraf: u.taraf ? 1 : 0, b: u.b, verilen: 0, alinan: 0, iyi: 0, kalkan: 0, olu: false });
}
function istatTopla(liste) {
  const kay = (id) => istat.get(id), bul = (id) => sim.birimler.find(o => o.uid === id);
  for (let i = 0; i < liste.length; i++) {
    const f = liste[i];
    if (f.tip === 'vurus') { const a = bul(f.k); if (a && (a.pasif === 'zehirDis' || (a.soy || []).includes('ates'))) dotKaynak.set(f.u, f.k); }
    else if (f.tip === 'yetenek' && DOT_YETENEK[f.ad]) {
      const a = bul(f.u), yol = DOT_YETENEK[f.ad]; if (!a) continue;
      if (yol === 'hedef') { if (a.hedef) dotKaynak.set(a.hedef.uid, a.uid); }
      else if (yol === 'hasar') { for (const g of ardil(liste, i)) if (g.tip === 'hasar' && g.k === a.uid) dotKaynak.set(g.u, a.uid); }
      else for (const o of sim.birimler) if (o.taraf !== a.taraf && !o.olu && Math.hypot(o.x - a.x, o.y - a.y) <= yol + 0.3) dotKaynak.set(o.uid, a.uid);
    }
    else if (f.tip === 'hasar' || f.tip === 'dot') {
      const h = kay(f.u); if (h) h.alinan += f.n;
      const kid = f.tip === 'dot' ? dotKaynak.get(f.u) : f.k, k = kid != null && kid >= 0 ? kay(kid) : null;
      if (k && h && k.taraf !== h.taraf) k.verilen += f.n;
    }
    else if (f.tip === 'iyi' || f.tip === 'kalkan') {
      const o = onceki(liste, i); let kid = o ? (o.tip === 'yetenek' ? o.u : o.k) : -1;
      if (kid < 0 || !kay(kid)) { const h = bul(f.u); const ana = h && sim.birimler.filter(d => d.taraf === h.taraf && d !== h && d.pasif === 'ana').sort((p, q) => Math.hypot(p.x - h.x, p.y - h.y) - Math.hypot(q.x - h.x, q.y - h.y))[0]; kid = ana ? ana.uid : f.u; }
      const k = kay(kid); if (k) k[f.tip === 'iyi' ? 'iyi' : 'kalkan'] += f.n;
    }
    else if (f.tip === 'olum') { const h = kay(f.u); if (h) h.olu = true; }
    else if (f.tip === 'dirilis') { const h = kay(f.u); if (h) h.olu = false; }
  }
}
// dışa aktarım: [{ uid, taraf (0 oyuncu, 1 rakip), b, verilen, alinan, iyi, kalkan, olu }] (taraf, sonra verilen hasara göre sıralı)
export function istatistik() { return [...istat.values()].map(o => ({ ...o })).sort((a, b) => a.taraf - b.taraf || b.verilen - a.verilen); }

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
// (en çok KLIP_HIZ_TAVAN; aralık yetmezse sıradaki vuruş klibin sonunu keser, klip aşırı hızlanmaz)
function klipHiz(b, klip) { if (!klip || !ual || !ual.klip[klip]) return 1; const sure = ual.klip[klip].duration, ara = 1 / (b.u.as * 1.0); return Math.min(KLIP_HIZ_TAVAN, Math.max(1, sure / Math.max(0.35, ara))); }
// birimin vuruş kurulma süresi (ağırlık sınıfı; yılan kendi anahtar karesiyle)
function hazirSure(b) { const tur = b.gor.tur; return tur === 'iki' ? b.ag.hazir : tur === 'yilan' ? YILAN_DARBE : b.ag.dortHazir; }
function olayPlanla(f, liste = [f], i = 0) {
  const ekle = kuyrukEkle;
  if (f.tip === 'vurus' || f.tip === 'yetenek' || f.tip === 'olum' || f.tip === 'dirilis') ekle(f.t, () => sesBildir(f));
  if (f.tip === 'vurus' && f.menzilli && birimler.get(f.k)) ekle(f.t - mesafeAl(f.k, f.u, f.t) / 12, () => sesBildir({ tip: 'atis', k: f.k, u: f.u }));
  const kaynak = birimler.get(f.k), hedef = birimler.get(f.u);
  if (f.tip === 'vurus' && kaynak && ofkeSay.get(f.k) > 0) {
    // Boynuz Öfkesi: güçlenmiş vuruş (2 kat) → kızıl boynuz kesiği, kısa hit-stop, kalan sayaç
    const su = sim.birimler.find(o => o.uid === f.k), kalan = su ? su.ofke : ofkeSay.get(f.k) - 1; ofkeSay.set(f.k, kalan);
    ekle(f.t, () => { if (!hedef || hedef.olumT >= 0 || kaynak.olumT >= 0) return; const yon = hedef.kok.position.clone().sub(kaynak.kok.position);
      vfx.vurus(hedef.kok.position.clone().setY(hedef.kok.position.y + 0.55 * (hedef.kok.userData.vfxBoy || 1)), { renk: '#ff3d1a', guc: 1.6, yon, tur: 'boynuz', element: 'ates' });
      his.donma(hedef, 0.05); his.donma(kaynak, 0.05); if (kalan > 0) sayacGoster(kaynak, kalan); });
  }
  if (f.tip === 'vurus' && kaynak) {
    // kurulma: ağırlık sınıfına göre (ağır 0,7 · orta 0,45 · çevik 0,25 sn). Motor yalnız ONDE_SN önde olduğu için bütçeyi aşan kısım
    // vuruş tahminiyle (onKurulmaTahmin) önden başlar; olay gelince saldiriBaslat kurulmayı kaldığı yerden darbeye bağlar
    const ucus = f.menzilli ? mesafeAl(f.k, f.u, f.t) / 12 : 0, darbeT = f.t - ucus;
    ekle(darbeT - hazirSure(kaynak), () => saldiriBaslat(kaynak, { darbeT, menzilli: !!f.menzilli, hedef }));
    if (f.menzilli) ekle(f.t - ucus, () => mermiAt(kaynak, hedef, ucus));
    // darbe karesinde yerel duraklama: ağır vuruş iri, çevik vuruş seri hissettirsin (yakın vuruş; yalnız görüntü)
    else if (kaynak.ag.durak > 0) ekle(f.t, () => { if (kaynak.olumT >= 0) return; his.donma(kaynak, kaynak.ag.durak); if (hedef && hedef.olumT < 0) his.donma(hedef, kaynak.ag.durak * 0.7); });
  } else if (f.tip === 'yetenek') {
    const b = birimler.get(f.u); if (!b) return;
    const { hedefler, dostlar } = yetenekHedefleri(f, liste, i, b);
    const kut = kutlu.delete(f.u); f._kut = kut;   // ardıl hasar sayıları Kut önceliği alsın
    const on = vfx.onSure(f.ad);
    ekle(f.t - Math.max(b.gor.yetOn || 0.35, on), () => yetenekBaslat(b, f.ad, f.t - on, hedefler[0]));
    ekle(f.t - on, () => { if (b.olumT >= 0) return;
      if (f.ad === 'dortnal') kaymaBaslat(b, f.t);
      vfx.yetenek(f.ad, b.kok, hedefler.filter(o => o.olumT < 0 || o === b).map(o => o.kok), { dostlar: dostlar.map(o => o.kok), kut, soket: soketAl(b, f.ad), ileri: ileriAl(b),
        elL: YET_IMZA[f.ad] && YET_IMZA[f.ad].eller ? elAl(b, 'LeftHand', _elL) : null, elR: YET_IMZA[f.ad] && YET_IMZA[f.ad].eller ? elAl(b, 'RightHand', _elR) : null }); });
    ekle(f.t, () => yetenekEfekt(b, f.ad, kut));
    yetenekHis(f, b, hedefler, ekle, liste, i);
    if (f.ad === 'uluma') for (const o of hedefler) { ekle(f.t, () => vfx.durum(o.kok, 'hiz', true)); ekle(f.t + 4, () => vfx.durum(o.kok, 'hiz', false)); }
    if (f.ad === 'deliOfke') { ekle(f.t, () => vfx.durum(b.kok, 'ofke', true)); ekle(f.t + 3, () => vfx.durum(b.kok, 'ofke', false)); }
    // Buz Nefesi: dondurulan her hedefi 1,2 sn yarı saydam buz kabuğu sarar (motorun 'sersem'i bu sürede yıldız göstermez), bitince kırılır
    if (f.ad === 'buzNefes') for (const o of hedefler) { ekle(f.t, () => { if (o.olumT >= 0) return; o.buzKadar = f.t + 1.2; vfx.durum(o.kok, 'donKabuk', true); });
      ekle(f.t + 1.2, () => vfx.durum(o.kok, 'donKabuk', false)); }
  } else if (f.tip === 'hasar' || f.tip === 'dot' || f.tip === 'iyi' || f.tip === 'kalkan' || f.tip === 'kac') {
    if (f.tip !== 'hasar') ekle(f.t, () => sayiGoster(f, null));
    else {
      const neden = onceki(liste, i);
      const yakin = neden && neden.tip === 'vurus' && !neden.menzilli && neden.k === f.k;
      const buyuk = !!(neden && neden.tip === 'yetenek');
      let olumcul = false; for (let j = i + 1; j < liste.length; j++) if (liste[j].tip === 'olum' && liste[j].u === f.u) { olumcul = true; break; }
      const so = { buyuk, olumcul, kut: !!(buyuk && neden._kut) };
      ekle(f.t, () => sayiGoster(f, so));
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
  const i = Math.min(anlikSay - 1, Math.max(0, Math.round(t / DT))), ua = uidIndeks.get(a), ub = uidIndeks.get(b);
  if (i < 0 || ua === undefined || ub === undefined) return 2; return Math.hypot(anlikDeger(i, ua, 0) - anlikDeger(i, ub, 0), anlikDeger(i, ua, 1) - anlikDeger(i, ub, 1));
}

// ── Görsel eylemler ──
// Kodlu hareket (hareket.js) bayrakları: saldırı/yetenek/vurulma, tetiklendiği karede okunup sıfırlanır (b.bay)
// Zamanlı klip: klip zamanı doğrudan yazılır (timeScale 0). Darbeye kadar yavaş kurulma → kısa tutma → ani vuruş (darbe karesi tam darbe
// anında), sonra hızlı toparlanma. Saatler birimin yerel saatiyle (hit-stop'ta donar).
// on: önden kurulma (vuruş tahmini; olay henüz gelmedi) → kurulma tutma pozunda bekler, darbeye geçmez (zkOnayla bağlar)
const ZK_ON_X = { vurus: 0.7, dogrusal: 0.85 };
function zkBaslat(b, ad, { bas, darbe, D, sonra = 1.3, egri = 'vurus', on = false }) {
  const i = b.isk; if (!i || !i.eylem[ad]) return false;
  oyna(b, ad, { gecis: 0.08 }); i.aktif.timeScale = 0; i.aktif.time = 0;
  b.zk = { ad, bas, darbe: Math.max(bas + 0.02, darbe), D, sonra, egri, sure: ual.klip[ad].duration, on, atisAd: null, bitir: 0 };
  b.durum = 'saldir'; b.tekBitis = Infinity; return true;
}
// önden kurulan klibi gerçek darbe anına bağlar: kurulma oranı (x) korunarak başlangıç yeniden hesaplanır (poz sıçramaz)
function zkOnayla(z, t, darbe) {
  const x = Math.min(ZK_ON_X[z.egri] || 0.7, Math.max(0, (t - z.bas) / (z.darbe - z.bas)));
  z.on = false; z.darbe = Math.max(t + 0.02, darbe); z.bas = x < 0.999 ? (t - x * z.darbe) / (1 - x) : t;
}
function zkGuncelle(b) {
  const z = b.zk, i = b.isk; if (!z || !i) return;
  if (i.aktifAd !== z.ad) { b.zk = null; return; }
  const t = b.yerelT; let ct;
  if (t < z.darbe || z.on) { let x = Math.max(0, (t - z.bas) / (z.darbe - z.bas)); if (z.on) x = Math.min(x, ZK_ON_X[z.egri] || 0.7);
    if (z.egri === 'dogrusal') ct = z.D * x;
    else { const u = Math.min(1, x / 0.6); ct = z.D * (x < 0.6 ? 0.62 * u * u * (3 - 2 * u) : x < 0.76 ? 0.62 : 0.62 + 0.38 * ((x - 0.76) / 0.24)); } }
  else ct = z.D + (t - z.darbe) * z.sonra;
  i.aktif.time = Math.min(ct, z.sure);
  if (ct >= z.sure || (z.bitir && t >= z.bitir)) { b.zk = null; const n = b.zkSira.shift(); if (n) n(); else { b.durum = ''; b.tekBitis = 0; } }
}
// on: vuruş tahminiyle önden kurulma (onKurulmaTahmin): olay gelmeden kurulma pozuna geçer ve tutar; gerçek olay (aynı hedef) gelince
// kaldığı yerden darbeye bağlanır, gelmezse onKurulmaIptal bekleme pozuna döndürür. Motor değişmez (yalnız görüntü).
function saldiriBaslat(b, { darbeT, menzilli = false, hedef = null, on = false } = {}) {
  if (!b || b.olumT >= 0) return;
  const kalan = Math.max(0, darbeT - gorselT), darbeY = b.yerelT + kalan, tur = b.gor.tur, ok = b.onk;
  if (!on && ok.var) { ok.var = false; if (hedef && ok.hedef === hedef.uid && onKurulmaOnayla(b, kalan, darbeY, menzilli, hedef)) return; }
  if (b.isk) {
    const liste = b.gor.saldir || ['Punch_Jab']; const ad = liste[b.salSira++ % liste.length];
    const D = DARBE[ad] || 0, hz = klipHiz(b, ad); b.zkSira = [];
    if (menzilli && b.gor.hazir && (kalan > 0.16 || on)) {
      // kurulma klibi (büyü hazırlığı / yay germe) darbeden 0,05 sn önce biter ve tutulur, atış klibinin bırakma karesi darbe anında
      const atisBas = darbeY - D / (1.2 * hz);
      zkBaslat(b, b.gor.hazir, { bas: b.yerelT, darbe: atisBas - 0.05, D: ual.klip[b.gor.hazir] ? ual.klip[b.gor.hazir].duration : 0.5, sonra: 0.01, egri: 'dogrusal', on });
      if (on) { if (b.zk) b.zk.atisAd = ad; }
      else b.zkSira.push(() => zkBaslat(b, ad, { bas: atisBas, darbe: darbeY, D, sonra: b.ag.sonra * hz, egri: 'dogrusal' }));
    } else zkBaslat(b, ad, { bas: b.yerelT, darbe: darbeY, D, sonra: b.ag.sonra * hz, egri: menzilli ? 'dogrusal' : 'vurus', on });
    if (!on) b.bay.saldiri = { darbe: kalan, menzilli };
  } else if (b.dort) { const o = b.dortSal; o.darbe = kalan; o.on = on; o.onay = false; o.iptal = false; o.sonra = b.ag.sonra; b.bay.saldiri = o; }
  else b.bay.saldiri = true;
  if (on) { ok.var = true; ok.darbeT = darbeT; ok.hedef = hedef ? hedef.uid : -1; ok.son = darbeT + 0.3; return; }
  atilBaslat(b, hedef, kalan, menzilli);
}
// yakın dövüşte hedefe atılma: iki gövde yarıçapı kadar yaklaşır, içine girmez (motor konumu değişmez). Ağır sınıf kısa atılır (öne eğilip
// ağırlık aktarır), çevik ve orta 0,2 birim
function atilBaslat(b, hedef, kalan, menzilli) {
  if (menzilli || !hedef || hedef.olumT >= 0) return;
  const temas = (b.yaricap || 0.4) + (hedef.yaricap || 0.4), tur = b.gor.tur, ag = b.ag;
  if (tur === 'iki') his.atil(b, hedef.kok.position, Math.max(ag.atilSure, kalan), { temas, mesafe: ag.atil });
  else his.atil(b, hedef.kok.position, Math.max(ag.atilSure, kalan), { mesafe: tur === 'yilan' ? 0.2 : ag.atil * 0.75, temas });
}
// önden kurulma onayı: klip/anahtar kare kurulması gerçek darbe anına bağlanır
function onKurulmaOnayla(b, kalan, darbeY, menzilli, hedef) {
  if (b.isk) {
    const z = b.zk; if (!z || !z.on) return false;
    if (z.atisAd) {
      const ad = z.atisAd, D = DARBE[ad] || 0, hz = klipHiz(b, ad), atisBas = darbeY - D / (1.2 * hz);
      zkOnayla(z, b.yerelT, atisBas - 0.05); z.darbe = Math.min(z.darbe, Math.max(b.yerelT + 0.02, atisBas));
      b.zkSira.length = 0; b.zkSira.push(() => zkBaslat(b, ad, { bas: Math.max(b.yerelT, atisBas), darbe: darbeY, D, sonra: b.ag.sonra * hz, egri: 'dogrusal' }));
    } else zkOnayla(z, b.yerelT, darbeY);
    b.bay.saldiri = { darbe: kalan, menzilli };
  } else if (b.dort) { const o = b.dortSal; o.darbe = kalan; o.on = false; o.onay = true; o.iptal = false; b.bay.saldiri = o; }
  else return false;
  atilBaslat(b, hedef, kalan, menzilli);
  return true;
}
function onKurulmaIptal(b) {
  const ok = b.onk; ok.var = false;
  if (b.isk) { if (b.zk && b.zk.on) { b.zk = null; b.zkSira.length = 0; b.durum = ''; b.tekBitis = 0; } }
  else if (b.dort && b.olumT < 0) { const o = b.dortSal; o.on = false; o.onay = false; o.iptal = true; b.bay.saldiri = o; }
}
// Vuruş tahmini (her kare, yalnız sayı işlemi): motorun son anlığında birim menzilde bekliyorsa (cd her adımda azalıyor) bir sonraki vuruş
// anı cd / azalma hızından bulunur. Kurulma süresi motorun önden gelişini aşıyorsa kurulma o kadar önce başlar.
function onKurulmaTahmin() {
  const L = anlikSay - 1; if (L < 1 || !sim || sim.bitti) return;
  const V = anlikVeri, n = anlikN, tMotor = L * DT;
  for (let j = 0; j < birimDizi.length; j++) {
    const b = birimDizi[j], ok = b.onk;
    if (ok.var) {
      const g = gorunum[b.si];
      if (b.olumT >= 0 || gorselT > ok.son || (g && g.sersem) || b.durum === 'yetenek' || b.kay || (b.isk && (!b.zk || !b.zk.on))) onKurulmaIptal(b);
      continue;
    }
    if (b.olumT >= 0 || b.kay || (!b.isk && !b.dort) || b.durum === 'saldir' || b.durum === 'yetenek' || (b.dort && b.dort.sal)) continue;
    { const g = gorunum[b.si]; if (g && g.sersem) continue; }   // görüntüde hâlâ sersem: iptal koşuluyla aynı (başlat-iptal-başlat titremesi olmasın)
    const H = hazirSure(b), oL = (L * n + b.si) * ALAN, oP = oL - n * ALAN;
    if (V[oL + 7] || V[oL + 9] || V[oL + 4] >= V[oL + 5]) continue;          // ölü, sersem ya da mana dolu (sıradaki eylem yetenek)
    const cL = V[oL + 15], r = (V[oP + 15] - cL) / DT; if (!(r > 0.05) || !(cL > 0)) continue;   // menzilde değil (yürüyor) ya da yeni vurdu
    const Tp = (L + Math.ceil(cL / (r * DT) - 1e-9) - 1) * DT; if (Tp <= tMotor) continue;   // olay zaten motorda (kuyrukta)
    const hu = V[oL + 8], hb = hu >= 0 ? birimler.get(hu) : null; if (!hb || hb.olumT >= 0) continue;
    const menzilli = b.u.menzil > 1, rel = Tp - (menzilli ? mesafeAl(b.uid, hu, tMotor) / 12 : 0), on = rel - gorselT;
    if (on > H || on < 0.05) continue;   // erken (kurulma süresinden uzak) ya da çok geç
    saldiriBaslat(b, { darbeT: rel, menzilli, hedef: hb, on: true });
  }
}
// Bulut Hücumu: motor atı etki anında ışınlar; görüntü hücum başında (f.t − onSure) A'dan B'ye çıkış3 eğrisiyle kayar (yalnız görüntü)
function kaymaBaslat(b, tEtki) {
  const ub = uidIndeks.get(b.uid); if (ub === undefined) return;
  // ışınlanmış konum etki adımının ARDINDAKİ anlıkta (görüntü o anlığa DT sonra ulaşır: o ana dek B'de tutulur)
  const i = Math.min(anlikSay - 1, Math.max(0, Math.round(tEtki / DT) + 1));
  const bx = anlikDeger(i, ub, 0) - 3, bz = anlikDeger(i, ub, 1) - 4, ax = b.kok.position.x - b.ayir.x, az = b.kok.position.z - b.ayir.y;
  if (Math.hypot(bx - ax, bz - az) < 0.3) return;
  b.kay = { ax, az, bx, bz, t0: gorselT, t1: Math.max(gorselT + 0.05, tEtki), son: Math.max(gorselT + 0.05, tEtki) + DT, aci: Math.atan2(bx - ax, bz - az) };
}
const YET_YURU_PAY = 0.12;   // patlamadan sonra yürümeye geçmeden önce yetenek pozunun en az tutulduğu süre (sn)
function yetenekBaslat(b, ad, olayT, hedef = null) {
  if (!b || b.olumT >= 0) return;
  b.onk.var = false;   // önden kurulma (tahmin edilen vuruş) yeteneğe yol verir
  const an = Math.max(0.05, (olayT != null ? olayT : gorselT + 0.35) - gorselT), imza = YET_IMZA[ad];
  // hazırlık: element renginde gövde parlaması (tepesi patlama anında) + yeteneğe özgü hazırlık efekti (kemiğe bağlı)
  if (imza && imza.parla) his.parla(b, imza.parla[0], imza.parla[1], an + 0.35, an);
  vfx.hazirlik(ad, b.kok, { sure: an, kemik: soketKemik(b, ad), kemik2: imza && imza.soket === 'eller' ? b.kemik.LeftHand || null : null, ileri: ileriAl(b).clone(),
    hedef: hedef && hedef !== b && hedef.olumT < 0 ? hedef.kok : null });
  // yetenek hedefine dön (Kara Gölge en güçlü düşmana, Gölge Oku en zayıfa vurur; birimin o anki hedefi başka olabilir)
  if (imza && imza.bak && hedef && hedef !== b && hedef.olumT < 0) { b.yetBak = hedef; b.yetBakSon = gorselT + an + 0.3; }
  if (ad === 'ruhEmme' && hedef && hedef.olumT < 0) his.atil(b, hedef.kok.position, an, { mesafe: 0.35, temas: (b.yaricap || 0.4) + (hedef.yaricap || 0.4), tut: 0.55, donus: 0.3, egil: 0.04 });
  if (b.isk && b.gor.yetSure && yetPozVar(ad)) {
    // sabit süreli yetenek: taban klip (döngü olabilir) + yordamsal poz (hareket.js YET_POZ); süre pozla belirlenir
    const ilk = (b.gor.yetenek || [])[0]; b.zk = null; b.zkSira = [];
    if (ilk && ual.klip[ilk]) oyna(b, ilk, { gecis: 0.12, dongu: ilk.endsWith('_Loop') });
    b.dizi = []; b.tekBitis = gorselT + an + b.gor.yetSure; b.durum = 'yetenek';
  } else if (b.isk && b.gor.yetTut && zkBaslat(b, b.gor.yetenek[0], { bas: b.yerelT, darbe: b.yerelT + an, D: DARBE[b.gor.yetenek[0]] || 0.5, sonra: b.gor.yetTut[0], egri: 'dogrusal' })) {
    // Can Emme: kavrama karesi patlamaya kilitli; ardından klip yavaşlar (yetTut[0] hız) ve tutma bitince (yetTut[1] sn) beklemeye döner.
    // Zombie_Scratch'in kavramadan sonraki yataya iniş kısmı (0,8–1,2 sn) hiç oynamaz; emme dik ve okunur kalır.
    b.zkSira = []; b.zk.bitir = b.yerelT + an + b.gor.yetTut[1]; b.durum = 'yetenek';
  } else if (b.isk && b.gor.yetHazir) {
    // Gölge Oku: kurulma klibi (yay germe) patlamadan 0,04 sn önce biter ve tutulur, atış klibinin bırakma karesi tam patlama anında
    const [kur, at] = b.gor.yetenek, D = DARBE[at] || 0.03, darbeY = b.yerelT + an, atisBas = darbeY - D;
    b.zk = null; b.zkSira = [];
    if (ual.klip[kur] && ual.klip[at] && zkBaslat(b, kur, { bas: b.yerelT, darbe: Math.max(b.yerelT + 0.03, atisBas - 0.04), D: ual.klip[kur].duration, sonra: 0.01, egri: 'dogrusal' }))
      b.zkSira.push(() => zkBaslat(b, at, { bas: atisBas, darbe: darbeY, D, sonra: 1.2, egri: 'dogrusal' }));
  } else if (b.isk) {
    const dizi = ((!b.gor.yetSure && b.gor.yetenek) || ['Spell_Simple_Enter', 'Spell_Simple_Shoot']).filter(x => ual.klip[x]); if (!dizi.length) dizi.push('Spell_Simple_Enter');
    b.zk = null; b.zkSira = [];
    // kişilik tablosunda yetOn varsa: ilk klibin anahtar karesi (bırakma / iniş; yoksa sonu) efektin çıkış anına denk gelecek hızda oynar
    const ilk = ual.klip[dizi[0]].duration, anahtarK = DARBE[dizi[0]] != null ? DARBE[dizi[0]] : ilk, kalan = Math.max(0.15, (olayT || gorselT + 0.35) - gorselT);
    const hiz = b.gor.yetOn ? Math.min(2.2, Math.max(0.7, anahtarK / kalan)) : 1;
    oyna(b, dizi[0], { gecis: 0.08, hiz }); b.dizi = dizi.slice(1); b.tekBitis = gorselT + ilk / hiz; b.durum = 'yetenek';
  }
  b.yetAn = gorselT + an;   // patlama anı (görsel saat); sonrasında yürürse yetenek klibi bırakılır
  b.bay.yetenek = { ad, an };   // hareket.js: kişiye özel poz patlama karesine (an sn sonra) kilitlenir
}
// Patlama anının hissi (yeteneğe özgü): hit-stop, kamera itmesi, ekran vinyeti, çok vuruşlu yeteneklerde alt ses olayları
function yetenekHis(f, b, hedefler, ekle, liste = null, i = 0) {
  const h0 = hedefler[0];
  if (f.ad === 'davul') {
    for (let j = 1; j < 4; j++) ekle(f.t + 0.2 * j, () => sesBildir({ tip: 'yetenekAlt', ad: 'davul', n: j, k: f.u, u: f.u }));
    ekle(f.t + 0.6, () => { if (b.olumT < 0) { his.donma(b, 0.05); his.sarsinti(0.12, 0.2); } });
  } else if (f.ad === 'uluma') ekle(f.t, () => { if (b.olumT < 0) his.yakinlastir(_soketV2.copy(b.kok.position).setY(0.7), 0.55, { oran: 0.04 }); });
  else if (f.ad === 'ruhEmme') { ekle(f.t, () => { if (b.olumT < 0) vfx.ekranFlas('#ff3d5a', 0.16, 0.45); });
    ekle(f.t + 0.04, () => { if (b.olumT >= 0) return; his.donma(b, 0.06); if (h0) his.donma(h0, 0.06); }); }   // kavrama pozu oturunca dur
  else if (f.ad === 'kasirga') ekle(f.t - vfx.onSure('kasirga'), () => { if (b.olumT < 0 && h0) his.sarsinti(0.1, 0.2, _soketV2.copy(h0.kok.position).sub(b.kok.position)); });
  else if (f.ad === 'tasFirlat') ekle(f.t, () => { if (h0) his.donma(h0, 0.07); });
  else if (f.ad === 'deliOfke') { ofkeSay.set(f.u, 3); ekle(f.t, () => sayacGoster(b, 3)); }
  // Kor Halkası: halka dönüşün son çeyreğinden çıkarken kısa hit-stop + sarsıntı
  else if (f.ad === 'ocak') ekle(f.t, () => { if (b.olumT < 0) { his.donma(b, 0.05); his.sarsinti(0.1, 0.2); } });
  // Buz Nefesi: koni çıkarken hafif kamera titremesi
  else if (f.ad === 'buzNefes') ekle(f.t - vfx.onSure('buzNefes'), () => { if (b.olumT < 0) his.sarsinti(0.08, 0.15); });
  // Bulut Hücumu: varışta boynuz öne savrulur → beyaz-altın boynuz kesiği, 0,08 sn duraklama, sarsıntı, kamera hücum yönünde hafif kayar
  else if (f.ad === 'dortnal') ekle(f.t, () => { if (b.olumT >= 0) return; his.donma(b, 0.08);
    if (h0 && h0.olumT < 0) { his.donma(h0, 0.08); const yon = _soketV2.copy(h0.kok.position).sub(b.kok.position);
      vfx.vurus(_ileriV.copy(h0.kok.position).setY(h0.kok.position.y + 0.55 * (h0.kok.userData.vfxBoy || 1)), { renk: '#fff0c0', guc: 1.7, yon, tur: 'boynuz', element: 'isik' });
      his.sarsinti(0.2, 0.25, yon); his.yakinlastir(_soketV2.copy(h0.kok.position).setY(0.6), 0.5, { oran: 0.035 }); } });
  // ── grup 3 ──
  // Kara Gölge: ezme karesinde (gölge şeridi yola çıkarken) ayıda 0,07 sn duraklama + sarsıntı; pençe yükselince hedefte duraklama
  else if (f.ad === 'karaGolge') { ekle(f.t - vfx.onSure('karaGolge'), () => { if (b.olumT >= 0) return; his.donma(b, 0.07); his.sarsinti(0.22, 0.26); });
    ekle(f.t, () => { if (h0 && h0.olumT < 0) his.donma(h0, 0.07); }); }
  // Kül Yağmuru: kanat vuruşundan yağmurun sonuna dek kamera hedefin üstüne hafifçe bakar
  else if (f.ad === 'kulDogus') ekle(f.t - vfx.onSure('kulDogus'), () => { if (b.olumT < 0 && h0) his.yakinlastir(_soketV2.copy(h0.kok.position).setY(2.4), 0.9, { oran: 0.025 }); });
  // Ayaz: dalga ayak altından çıkarken 0,05 sn tam ekran duraklama, 0,5 sn buzlu kenar vinyeti
  else if (f.ad === 'ayaz') ekle(f.t, () => { if (b.olumT >= 0) return; his.durdur(0.05); vfx.ekranFlas('#d8f3ff', hafif ? 0.24 : 0.34, 0.5, '#6fb8ff'); });
  // Gölge Oku: varışta hedefte 0,08 sn duraklama; ok öldürürse 0,15 sn %60 zaman yavaşlaması (yalnız görüntü)
  else if (f.ad === 'golgeOk') {
    let olumcul = false; if (liste && h0) for (let j = i + 1; j < liste.length; j++) { const g = liste[j]; if (g.tip === 'vurus' || g.tip === 'yetenek') break; if (g.tip === 'olum' && g.u === h0.uid) { olumcul = true; break; } }
    ekle(f.t, () => { if (h0 && h0.olumT < 0) his.donma(h0, 0.08); if (olumcul) his.yavaslat(0.15, 0.6); });
  }
  // Yıldırım: ilk şimşekte 0,06 sn tam ekran duraklama ve kısa beyaz kenar parlaması (hafifte soluk)
  else if (f.ad === 'yildirim') ekle(f.t, () => { if (b.olumT >= 0) return; his.durdur(0.06); vfx.ekranFlas('#ffffff', hafif ? 0.16 : 0.3, 0.1, '#fff6c0'); });
}
// küçük sayaç (Boynuz Öfkesi: kalan güçlenmiş vuruş)
function sayacGoster(b, n) { if (!b || b.olumT >= 0) return; const y = yaziEkle(b, '×' + n, '#ff6a3a', SAYAC_OPS); if (y) y.p.y += 0.25 * (b.kok.userData.vfxBoy || 1); }
function yetenekEfekt(b, ad, kut = false) {
  if (!b || !D.YETENEK[ad]) return;
  bantEkle(b, D.YETENEK[ad].ad + '!', { kut });
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
    // üste eklenen tepki (additive): saldırı ya da yürüme kesilmez, yalnız üst gövde esner (ustGovdeEk). Güçlü darbede (yetenek, büyük
    // vuruş) Hit_Knockback'in kısa savrulması; yoksa göğüs/baş sırayla. Sık vuruşta birikmez: süren tepki ilk %60'ındaysa yeniden
    // başlatılmaz (yalnız ağırlığı gerekirse yükselir); daha geçse eskisi 0,1 sn'de söner, yenisi 0,05 sn'de açılır (seğirme yok).
    const agir = guc >= 0.7 && i.eylem.Hit_Knockback_Ek;
    const ag = agir ? Math.min(0.8, 0.5 + 0.3 * guc) : Math.min(0.7, 0.45 + 0.35 * guc);
    const suren = b.vurEylem && b.vurEylem.isRunning() ? b.vurEylem : null;
    if (suren && ((agir && suren === i.eylem.Hit_Knockback_Ek) || (!agir && suren.time < suren.getClip().duration * 0.6))) {
      if (ag > suren.getEffectiveWeight()) suren.setEffectiveWeight(ag);
    } else {
      const ad = agir ? 'Hit_Knockback_Ek' : ((b.vurSira = (b.vurSira || 0) + 1) % 2 ? 'Hit_Chest_Ek' : 'Hit_Head_Ek'), e = i.eylem[ad];
      if (e) {
        if (suren && suren !== e) suren.fadeOut(0.1);
        e.reset(); e.setLoop(THREE.LoopOnce, 1); e.clampWhenFinished = false; e.timeScale = agir ? 1.25 : 1.3; e.setEffectiveWeight(ag); e.fadeIn(0.05); e.play();
        b.vurEylem = e;
      }
    }
  }
  b.bay.vurul = Math.max(b.bay.vurul || 0, guc);
}
function olumBaslat(b) {
  if (!b || b.olumT >= 0) return; b.olumT = gorselT;
  if (b.isk) { b.zk = null; b.zkSira = []; oyna(b, 'Death01', { gecis: b.durum === 'vurul' ? 0.25 : 0.1, tut: true }); }
  const sonMu = ![...birimler.values()].some(o => o !== b && o.u.taraf === b.u.taraf && o.olumT < 0);
  his.olum(b, { tur: b.gor.tur, yakinlastir: sonMu });
  // son öldürme (bir taraf tükendi): 0,45 sn gerçek zaman ~0,25 hızla ağır çekim (yalnız görüntü; Maçın Yıldızı "Selam" girişi)
  if (sonMu) his.yavaslat(0.45, 0.25);
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
  if (b.isk) { const ad = (b.gor.dogus && ual.klip[b.gor.dogus]) ? b.gor.dogus : 'Jump_Land'; oyna(b, ad, { gecis: 0.05 }); b.tekBitis = gorselT + Math.min(1.1, ual.klip[ad].duration); b.durum = 'yetenek'; }
  bantEkle(b, 'Yeniden Doğuş', { renk: '#ffb070' });
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
function portreAl(id) { id = (D.canavar && D.canavar(id) || {}).gorunum || id;   // canavarın kendi portresi yok: yerine gösterilen kahramanınki
  if (!portreler[id]) { const im = new Image(); im.src = kokYol + '../arayuz/portre/' + id + '.png'; portreler[id] = im; } return portreler[id]; }
let kutKart = null;
function kutSutun(b) {
  if (!b || gorselT - b.sonKut < 1.0) return; b.sonKut = gorselT;
  vfx.kut(b.kok);                                   // toplanma, Kut mührü, 0,25 sn'de sütun + şok; ekranda karartma + hız çizgileri
  his.kut(b);                                      // 0,25 sn yavaşlatma + yakınlaştırma + sarsıntı + altın parlama
  const gr = b.model.userData.gorunum;
  if (gr) { gr.kenar('#ffd27a', 1.2); kuyrukEkle(gorselT + 1.2, () => gr.kenar(b.u.taraf === 0 ? G.RIM.biz : G.RIM.rakip, b.u.taraf === 0 ? G.RIM_GUC.biz : G.RIM_GUC.rakip)); }
  kutKart = { t0: performance.now() / 1000, img: portreAl(b.u.b.h), ad: D.kahraman(b.u.b.h).ad, taraf: b.u.taraf };
  bantEkle(b, 'KUT', { kut: true });
  if (dinleyici.kut) dinleyici.kut(b.u);
}

// ── 2D kaplama: çubuklar, durumlar, sayılar ──
// dünya → kaplama koordinatı. out verilmezse modül düzeyindeki tek nesne döner (bir sonraki çağrıda üzerine yazılır).
const _ekV = new THREE.Vector3(), _ekO = { x: 0, y: 0, z: 0 }, _ekP = new THREE.Vector3();
let kapW = 1, kapH = 1, kapDpr = 1;   // kaplama tuvalinin CSS boyu ve piksel oranı (boyutla'da)
function ekran(p, out = _ekO) { const v = _ekV.copy(p).project(kamera); out.x = (v.x + 1) / 2 * kapW; out.y = (1 - v.y) / 2 * kapH; out.z = v.z; return out; }
// birimin can çubuğu / balon çapası (başın biraz üstü)
function basUstu(b) { return _ekP.set(b.kok.position.x, b.kok.position.y + 1.12 * (b.kok.userData.vfxBoy || 1) + 0.12, b.kok.position.z); }
// sayılar aynı birimde en az 0,12 sn arayla çıkar (zaman kuyruğu); yetenek adı ayrı bant yuvasında (sayılarla çakışmaz)
// Ekranda aynı anda en çok YAZI_EN_COK sayı (sıradakiler dahil). Dolunca en düşük öncelikli ve en eski sayı düşer;
// yeni sayı hepsinden düşük öncelikliyse hiç eklenmez. Öncelik: 3 kritik/yetenek/Kut · 2 ölüm vuruşu · 1 normal · 0 süreli hasar (DOT).
// tempo: ekranda daha seyrek sayı (18 → 10, hafif kipte 8); aynı hedefe 0,5 sn içinde gelen sıradan vuruşlar tek sayıda toplanır
const YAZI_EN_COK = 10, YAZI_EN_COK_HAFIF = 8, BIRLES_SN = 0.5, BIRLES_DOT_SN = 1.0;   // motor DOT'u her 0,05 sn'de yayıyor: 1 sn'de bir tek sayı
function yaziEkle(b, metin, renk, o) {
  if (yazilar.length >= (hafif ? YAZI_EN_COK_HAFIF : YAZI_EN_COK)) {
    let v = -1, vp = Infinity;
    for (let i = 0; i < yazilar.length; i++) { const y = yazilar[i], p = y.onc * 100 - y.yas; if (p < vp) { vp = p; v = i; } }
    if (v < 0 || yazilar[v].onc > o.onc) return null;
    for (let i = v + 1; i < yazilar.length; i++) yazilar[i - 1] = yazilar[i]; yazilar.length--;   // sıra korunur
  }
  const gec = Math.max(0, b.yaziSon + 0.12 - gorselT); b.yaziSon = gorselT + gec;
  const yon = ((b.yaziSira = (b.yaziSira || 0) + 1) % 2 ? 1 : -1);
  const p = b.kok.position.clone(); p.y += 1.25 * (b.kok.userData.vfxBoy || 1);
  const y = { uid: b.uid, b, p, metin, renk, yas: -gec, t0: gorselT, olcek: o.olcek, olcek0: o.olcek, buyuk: o.buyuk, kritik: o.kritik, kenar: o.kenar, yon,
    onc: o.onc, tur: o.tur, n: o.n, alfa: o.alfa, bir: 0, nabiz: 0 };
  yazilar.push(y); return y;
}
// Yetenek balonu (OGRETICI §4.3): aynı anda en çok 2; üçüncüsü sıraya girer, 0,6 sn'de açılamazsa düşer; Kut balonu öne geçer.
// Süre: motor zamanında 1,2 sn ve gerçek zamanda en az 0,9 sn (2× hızda da okunur).
const bantlar = [], balonSira = [];
const BALON_SURE = 1.2, BALON_GERCEK = 0.9;
function bantEkle(b, metin, { renk = null, kut = false } = {}) {
  if (!metin || !b) return;
  for (const l of [bantlar, balonSira]) for (let i = l.length - 1; i >= 0; i--) if (l[i].uid === b.uid) l.splice(i, 1);
  const bt = { uid: b.uid, b, metin, renk, kut, dost: b.u.taraf === 0, yas: 0, gercek: 0, bekle: 0, kapan: 0 };
  if (bantlar.length < 2) { bantlar.push(bt); return; }
  if (kut) { const eski = bantlar.find(x => !x.kut && !x.kapan); if (eski) eski.kapan = 1; balonSira.unshift(bt); }
  else if (bt.dost) { const i = balonSira.findIndex(x => !x.kut && !x.dost); if (i < 0) balonSira.push(bt); else balonSira.splice(i, 0, bt); }   // oyuncunun yaratıkları sırada öne geçer
  else balonSira.push(bt);
}
function balonGuncelle(dt, dtG) {
  for (const bt of bantlar) { bt.yas += dt; bt.gercek += dtG; if (bt.kapan) bt.kapan += dtG; }
  for (let i = bantlar.length - 1; i >= 0; i--) { const bt = bantlar[i]; if ((bt.yas >= BALON_SURE && bt.gercek >= BALON_GERCEK) || bt.kapan > 0.13 || bt.b.olumT >= 0 && bt.gercek > 0.5) bantlar.splice(i, 1); }
  for (const q of balonSira) q.bekle += dtG;
  for (let i = balonSira.length - 1; i >= 0; i--) if (balonSira[i].bekle > 0.6) balonSira.splice(i, 1);
  while (bantlar.length < 2 && balonSira.length) bantlar.push(balonSira.shift());
}
// o: { buyuk (yetenek hasarı), olumcul, kut } (yalnız hasar olayında)
// Kritik (altın, KRİTİK etiketi) yalnız yetenek ya da Kut ile 200+ hasarda. Aynı hedefe BIRLES_SN içinde gelen küçük sayılar
// (normal vuruş, DOT, iyileşme) tek sayıda toplanır ve her eklemede biraz büyüyüp nabız atar.
// DOT sayıları küçük ve soluk; rakibin bizim birimlere vurduğu normal sayılar da biraz küçük ve soluk.
const SAYI_OPS = { onc: 1, tur: '', n: 0, olcek: 1, buyuk: false, kritik: false, kenar: null, alfa: 1 };
function sayiGoster(f, o) {
  const b = birimler.get(f.u); if (!b) return;
  if (f.tip !== 'kac' && !(f.n >= 5 || (f.tip === 'dot' && f.n >= 1))) return;
  const k = birimler.get(f.k), el = k ? ELEMENT_H[k.u.b.h] : null, yet = !!(o && (o.buyuk || o.kut));
  const kritik = f.tip === 'hasar' && f.n >= 200 && yet, iri = f.tip === 'hasar' && f.n >= 200;
  const onc = f.tip === 'dot' ? 0 : yet ? 3 : (o && o.olumcul) ? 2 : 1;
  const renk = kritik ? '#ffd84a' : f.tip === 'dot' ? (SAYI_RENK[el] || '#ffb36a') : f.tip === 'hasar' ? '#ffffff' : f.tip === 'iyi' ? '#7dffa0' : f.tip === 'kalkan' ? '#dfe9ff' : '#cfcfcf';
  // birleştirme: aynı hedef, aynı tür ve renk, öncelik ≤ 1, ilk sayıdan bu yana BIRLES_SN'den az
  if (onc <= 1 && (f.tip === 'hasar' || f.tip === 'dot' || f.tip === 'iyi')) {
    for (let i = yazilar.length - 1; i >= 0; i--) {
      const y = yazilar[i]; if (gorselT - y.t0 >= BIRLES_DOT_SN) break; if (gorselT - y.t0 >= (f.tip === 'dot' ? BIRLES_DOT_SN : BIRLES_SN)) continue;
      if (y.uid !== f.u || y.tur !== f.tip || y.onc !== onc || y.renk !== renk) continue;
      y.n += f.n; y.bir++; y.metin = (f.tip === 'iyi' ? '+' : '-') + y.n;
      y.olcek = y.olcek0 * Math.min(1.45, 1 + 0.1 * y.bir + (y.n >= 200 ? 0.12 : 0)); y.nabiz = 0.14; if (y.n >= 200 && f.tip === 'hasar') y.buyuk = true;
      return;
    }
  }
  const dusman = k && k.u.taraf === 1 && b.u.taraf === 0;
  const s = SAYI_OPS; s.onc = onc; s.tur = f.tip; s.n = f.n; s.kritik = kritik; s.buyuk = kritik || iri;
  s.olcek = kritik ? 1.25 : f.tip === 'dot' ? 0.78 : (onc === 1 && dusman && f.tip === 'hasar') ? 0.8 : 1;
  s.alfa = f.tip === 'dot' ? 0.62 : (onc === 1 && dusman && f.tip === 'hasar') ? 0.72 : 1;
  s.kenar = (f.tip === 'hasar' && !kritik && el) ? SAYI_RENK[el] : null;
  yaziEkle(b, f.tip === 'kac' ? 'kaçtı' : f.tip === 'kalkan' ? '🛡' + f.n : (f.tip === 'iyi' ? '+' : '-') + f.n, renk, s);
}
const YAZI_FONT = '"Trebuchet MS","Segoe UI",system-ui,sans-serif';
// ── Birim üstü çubuk (TFT düzeyi) ──
// can (takım rengi) + gecikmeli beyaz hasar izi (0,35 sn bekler, kayarak iner) + sağa uzanan kalkan dilimi + 100'lük ince / 500'lük kalın çentik;
// altında mana (dolunca nabız parıltısı); üstte yıldız rozeti; çerçeve takım renginde. Kalabalıkta üst üste binen çubuklar birkaç px kayar.
const YILDIZ_RENK = [null, '#e0a46a', '#e8f0fa', '#ffd24a'];
function yildizCiz(cx, cy, r, renk) {
  kcx.beginPath();
  for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; kcx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  kcx.closePath(); kcx.lineWidth = 2; kcx.strokeStyle = 'rgba(12,6,26,.95)'; kcx.stroke(); kcx.fillStyle = renk; kcx.fill();
}
function gunesCiz(cx, cy, r) {
  kcx.save(); kcx.strokeStyle = '#ff9a2a'; kcx.lineWidth = Math.max(1.5, r * 0.28); kcx.lineCap = 'round';
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + gorselT * 1.5; kcx.beginPath(); kcx.moveTo(cx + Math.cos(a) * r * 0.75, cy + Math.sin(a) * r * 0.75); kcx.lineTo(cx + Math.cos(a) * r * 1.2, cy + Math.sin(a) * r * 1.2); kcx.stroke(); }
  const g = kcx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, 0, cx, cy, r * 0.6); g.addColorStop(0, '#fff6c0'); g.addColorStop(1, '#ffb22a');
  kcx.fillStyle = g; kcx.beginPath(); kcx.arc(cx, cy, r * 0.55, 0, Math.PI * 2); kcx.fill(); kcx.restore();
}
let cubukDesen = null;
function kalkanDesen() {
  if (cubukDesen) return cubukDesen;
  const c = document.createElement('canvas'); c.width = c.height = 6; const x = c.getContext('2d');
  x.fillStyle = '#f6f9ff'; x.fillRect(0, 0, 6, 6); x.strokeStyle = 'rgba(150,170,205,.75)'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(-1, 7); x.lineTo(7, -1); x.moveTo(5, 7); x.lineTo(7, 5); x.moveTo(-1, 1); x.lineTo(1, -1); x.stroke();
  return (cubukDesen = kcx.createPattern(c, 'repeat'));
}
const _olcu = { w: -1, h: -1, o: 1, gw: 56, hh: 8, mh: 3 };
function cubukOlcu(w, h) {
  if (_olcu.w === w && _olcu.h === h) return _olcu;
  const o = Math.max(0.8, Math.min(1.3, Math.min(w * 0.8, h) / 800));
  _olcu.w = w; _olcu.h = h; _olcu.o = o; _olcu.gw = Math.round(56 * o); _olcu.hh = Math.max(6, Math.round(8 * o)); _olcu.mh = Math.max(2, Math.round(3 * o));
  return _olcu;
}
// can degradesi: çubuk yüksekliği başına bir kez (0..hh); çizimde translate ile yerine taşınır
let canGrad = { hh: -1, dost: null, rakip: null };
function canDegrade(hh, dost) {
  if (canGrad.hh !== hh) {
    const d = kcx.createLinearGradient(0, 0, 0, hh); d.addColorStop(0, '#9dfbb0'); d.addColorStop(0.45, '#45d46e'); d.addColorStop(1, '#1f9a48');
    const r = kcx.createLinearGradient(0, 0, 0, hh); r.addColorStop(0, '#ff9aa4'); r.addColorStop(0.45, '#f23a50'); r.addColorStop(1, '#a8182c');
    canGrad = { hh, dost: d, rakip: r };
  }
  return dost ? canGrad.dost : canGrad.rakip;
}
// dolu mana nabzı: 21 basamaklı hazır renk dizgeleri (kare başına dizge üretilmesin)
const MANA_DOLGU = [], MANA_KENAR = [];
for (let i = 0; i <= 20; i++) { const n = i / 20; MANA_DOLGU.push(`rgb(${150 + 100 * n | 0},${215 + 35 * n | 0},255)`); MANA_KENAR.push(`rgba(190,235,255,${(0.45 + 0.5 * n).toFixed(3)})`); }
function cubukCiz(b, a, x, y, O, dost) {
  const o = O.o, gw = O.gw, hh = O.hh, mh = O.mh, tr = dost ? '#59d0ff' : '#ff5a6a';
  const mx = Math.max(1, a.mx), hp = Math.max(0, a.hp), kal = Math.max(0, a.kalkan || 0), tot = Math.max(mx, hp + kal);
  const H = hh + 1 + mh;
  // çerçeve: koyu zemin, dışta ince siyah, içte takım rengi
  kcx.fillStyle = 'rgba(8,5,20,.86)'; yuvarlak(x - 2, y - 2, gw + 4, H + 4, 3); kcx.fill();
  kcx.lineWidth = 3; kcx.strokeStyle = 'rgba(0,0,0,.55)'; kcx.stroke();
  kcx.lineWidth = 1.4; kcx.strokeStyle = tr; kcx.stroke();
  // hasar izi (can + kalkan toplamı üzerinden)
  const iz = gw * Math.min(1, b.izCan / tot), hpw = gw * Math.min(1, hp / tot), kw = gw * Math.min(1, (hp + kal) / tot) - hpw;
  if (iz > hpw + kw + 0.3) { kcx.fillStyle = 'rgba(255,244,228,.92)'; kcx.fillRect(x + hpw + kw, y, iz - hpw - kw, hh); }
  // can
  if (hpw > 0.3) {
    kcx.translate(x, y); kcx.fillStyle = canDegrade(hh, dost); kcx.fillRect(0, 0, hpw, hh); kcx.translate(-x, -y);
    kcx.fillStyle = 'rgba(255,255,255,.28)'; kcx.fillRect(x, y, hpw, Math.max(1, hh * 0.22));
  }
  // kalkan: canın sağına beyaz uzanır
  if (kw > 0.3) { kcx.fillStyle = kalkanDesen(); kcx.fillRect(x + hpw, y, kw, hh); kcx.fillStyle = '#ffffff'; kcx.fillRect(x + hpw, y, kw, 1); kcx.fillRect(x + hpw + kw - 1, y, 1, hh); }
  // çentikler: her 100 can ince (sığarsa), çok canlıda her 500 kalın
  const adim = gw * 100 / tot, kalin = mx >= 1000;
  if (adim >= 3) { kcx.fillStyle = 'rgba(8,5,20,.55)'; for (let v = 100; v < tot - 1; v += 100) { if (kalin && v % 500 === 0) continue; kcx.fillRect(Math.round(x + gw * v / tot), y, 1, Math.ceil(hh * 0.5)); } }
  if (kalin) { kcx.fillStyle = 'rgba(8,5,20,.9)'; for (let v = 500; v < tot - 1; v += 500) kcx.fillRect(Math.round(x + gw * v / tot) - 0.5, y, 2, hh); }
  // mana: koyu oluk, mavi dolgu; dolunca nabız
  const my = y + hh + 1, dolu = a.mana > 0 && a.mp >= a.mana - 1e-6;
  kcx.fillStyle = 'rgba(20,30,60,.9)'; kcx.fillRect(x, my, gw, mh);
  if (a.mana > 0 && a.mp > 0) {
    const mw = gw * Math.min(1, a.mp / a.mana);
    if (dolu) {
      const n = 0.5 + 0.5 * Math.sin(performance.now() / 1000 * Math.PI * 2 * 2.2), ni = Math.round(n * 20);
      kcx.save(); kcx.shadowColor = '#8fdcff'; kcx.shadowBlur = (4 + 6 * n) * o; kcx.fillStyle = MANA_DOLGU[ni]; kcx.fillRect(x, my, mw, mh); kcx.restore();
      kcx.strokeStyle = MANA_KENAR[ni]; kcx.lineWidth = 1; kcx.strokeRect(x - 0.5, my - 0.5, gw + 1, mh + 1);
    } else { kcx.fillStyle = '#4aa6ff'; kcx.fillRect(x, my, mw, mh); kcx.fillStyle = 'rgba(200,235,255,.5)'; kcx.fillRect(x, my, mw, 1); }
  }
  // yıldız rozeti: çubuğun üst ortasında koyu hap, seviye renginde yıldızlar
  const yl = Math.max(1, Math.min(3, b.u.b.s || 1)), r = 4.3 * o, ara = r * 2.15, rw = yl * ara + 5 * o, rh = r * 2 + 3 * o;
  const rx = x + gw / 2 - rw / 2, ry = y - 2 - rh + 2.5 * o;
  kcx.fillStyle = 'rgba(8,5,20,.86)'; yuvarlak(rx, ry, rw, rh, rh / 2); kcx.fill();
  kcx.lineWidth = 1.2; kcx.strokeStyle = yl === 3 ? 'rgba(255,210,74,.9)' : tr; kcx.stroke();
  if (yl === 3) { kcx.save(); kcx.shadowColor = '#ffcf4a'; kcx.shadowBlur = 6 * o; }
  for (let k = 0; k < yl; k++) yildizCiz(rx + 2.5 * o + ara * (k + 0.5), ry + rh / 2 + 0.3, r, YILDIZ_RENK[yl]);
  if (yl === 3) kcx.restore();
  return ry;
}
function izGuncelle(b, a, dt) {
  const v = Math.max(0, a.hp) + Math.max(0, a.kalkan || 0);
  if (b.izCan === undefined || v >= b.izCan) { b.izCan = v; b.izBek = 0; b.izSon = v; return; }
  if (v < b.izSon - 0.5 && b.izCan - b.izSon < a.mx * 0.01) b.izBek = 0.35;   // yeni hasar: iz yetişmişse bekleme yeniden başlar
  b.izSon = v;
  if (b.izBek > 0) { b.izBek -= dt; return; }
  const f = b.izCan - v; b.izCan -= Math.min(f, Math.max(f * dt * 5, a.mx * 0.3 * dt));
}
let _balonGrad = null;
function balonDegrade() {
  if (!_balonGrad) { const g = kcx.createLinearGradient(0, 0, 0, 1); g.addColorStop(0, '#fff0a8'); g.addColorStop(0.5, '#ffc94a'); g.addColorStop(1, '#e8902a'); _balonGrad = g; }
  return _balonGrad;
}
function balonCiz(w, O) {
  // yetenek balonu (OGRETICI §4.3): dost altın zemin + koyu yazı; düşman koyu zemin + yakut kenar + beyaz yazı; Kut'ta 1,4 kat + güneş
  for (const bt of bantlar) {
    const b = bt.b; let ax, ay;
    if (b._cubuk) { ax = b._cubuk.x; ay = b._cubuk.y - 3; }
    else { const p = ekran(basUstu(b)); ax = p.x; ay = p.y - 12; }
    const e = Math.min(bt.yas / BALON_SURE, bt.gercek / BALON_GERCEK), g = bt.gercek;
    const giris = Math.min(1, g / 0.18), sc0 = g < 0.18 ? 0.92 + 0.08 * (1 - Math.pow(1 - giris, 3)) + Math.sin(giris * Math.PI) * 0.06 : 1;
    let al = Math.min(1, giris * 1.6); if (e > 0.85) al *= Math.max(0, (1 - e) / 0.15); if (bt.kapan) al *= Math.max(0, 1 - bt.kapan / 0.13);
    if (al <= 0.01) continue;
    const kat = (bt.kut ? 1.4 : 1) * O.o * sc0, fs = Math.round(15 * kat);
    kcx.save(); kcx.globalAlpha = al;
    // yazı tipi dizgesi ve metin genişliği balon başına önbellekte (yalnız giriş büyümesinde boy değişir)
    if (bt._fs !== fs) { bt._fs = fs; bt._font = `900 ${fs}px ${YAZI_FONT}`; kcx.font = bt._font; bt._tw = kcx.measureText(bt.metin).width; }
    kcx.font = bt._font; kcx.textAlign = 'center'; kcx.textBaseline = 'middle';
    const gun = bt.kut ? fs * 1.05 : 0, tw = bt._tw, bw = tw + 18 * kat + gun, bh = fs + 9 * kat, kuyruk = 6 * kat;
    const yuk = e * 6 * O.o;
    let cx = Math.max(16 + bw / 2, Math.min(w - 16 - bw / 2, ax)), by = ay - kuyruk - bh - yuk;
    if (by < 8) by = 8;
    // gövde + kuyruk tek yol
    const bx = cx - bw / 2, r = bh / 2, tx = Math.max(bx + r, Math.min(bx + bw - r, ax));
    kcx.beginPath(); kcx.moveTo(bx + r, by); kcx.arcTo(bx + bw, by, bx + bw, by + bh, r); kcx.arcTo(bx + bw, by + bh, bx, by + bh, r);
    kcx.lineTo(tx + kuyruk * 0.8, by + bh); kcx.lineTo(tx, by + bh + kuyruk); kcx.lineTo(tx - kuyruk * 0.8, by + bh);
    kcx.arcTo(bx, by + bh, bx, by, r); kcx.arcTo(bx, by, bx + bw, by, r); kcx.closePath();
    let yazi, golge;
    if (bt.dost) {
      kcx.shadowColor = bt.kut ? 'rgba(255,190,60,.9)' : 'rgba(0,0,0,.45)'; kcx.shadowBlur = (bt.kut ? 14 : 6) * O.o; kcx.shadowOffsetY = bt.kut ? 0 : 2;
      // 0..1 birim degrade, dolguda balonun dikey aralığına ölçeklenir (yol önceden kurulduğu için dönüşüm yolu bozmaz)
      kcx.save(); kcx.translate(0, by); kcx.scale(1, bh); kcx.fillStyle = balonDegrade(); kcx.fill(); kcx.restore(); kcx.shadowColor = 'transparent';
      kcx.lineWidth = 2; kcx.strokeStyle = '#6a3a08'; kcx.stroke(); yazi = bt.renk || '#2a1404'; golge = null;
    } else {
      kcx.shadowColor = bt.kut ? 'rgba(255,120,90,.85)' : 'rgba(0,0,0,.5)'; kcx.shadowBlur = (bt.kut ? 14 : 6) * O.o; kcx.shadowOffsetY = bt.kut ? 0 : 2;
      kcx.fillStyle = 'rgba(28,10,24,.93)'; kcx.fill(); kcx.shadowColor = 'transparent';
      kcx.lineWidth = 2; kcx.strokeStyle = '#ff3d63'; kcx.stroke(); yazi = bt.renk || '#ffffff'; golge = 'rgba(0,0,0,.6)';
    }
    // üst parlama
    kcx.fillStyle = 'rgba(255,255,255,.22)'; yuvarlak(bx + 4 * kat, by + 2, bw - 8 * kat, bh * 0.36, bh * 0.18); kcx.fill();
    if (bt.kut) gunesCiz(bx + 9 * kat + gun / 2, by + bh / 2, fs * 0.5);
    const yx = cx + gun / 2, yy = by + bh / 2 + 1;
    if (golge) { kcx.lineWidth = 3; kcx.lineJoin = 'round'; kcx.strokeStyle = golge; kcx.strokeText(bt.metin, yx, yy); }
    kcx.fillStyle = yazi; kcx.fillText(bt.metin, yx, yy);
    kcx.restore();
  }
  kcx.textBaseline = 'alphabetic';
}
// üst HUD (skor paneli) sınırı: getBoundingClientRect yerleşim hesaplatır ve nesne üretir; yarım saniyede bir okunur
let hudEl, hudT = -1, hudVar = false, hudX0 = 0, hudX1 = 0, hudY = 0;
function hudOlc(O) {
  const z = performance.now(); if (z - hudT < 500) return; hudT = z;
  if (hudEl === undefined) hudEl = document.querySelector('.savasUst .skor');
  hudVar = !!(hudEl && hudEl.offsetParent);
  if (hudVar) { const r = hudEl.getBoundingClientRect(), k = kaplama.getBoundingClientRect(); hudX0 = r.left - k.left - O.gw / 2; hudX1 = r.right - k.left + O.gw / 2; hudY = r.bottom - k.top + 13 * O.o + 3; }
}
// çubuk listesi: birim başına kalıcı yuva nesneleri (kare başına nesne yok)
const cubukHavuz = [], cubukListe = [];
function cubukYuva(i) { return cubukHavuz[i] || (cubukHavuz[i] = { b: null, a: null, x: 0, y: 0, ox: 0, oy: 0 }); }
// sayı yazı tipleri: üç boy grubu, boyut animasyonu ölçekle (font dizgesi her yazıda yeniden kurulmaz)
const SAYI_FONT = { 17: `900 17px ${YAZI_FONT}`, 20: `900 20px ${YAZI_FONT}`, 26: `900 26px ${YAZI_FONT}` }, KRITIK_FONT = `900 11px ${YAZI_FONT}`;
function kaplamaCiz(dt = 0, dtG = dt) {
  const w = kapW, h = kapH;
  const s = anlikGorsel(), O = cubukOlcu(w, h), BH = O.hh + O.mh + 5, liste = cubukListe;
  liste.length = 0;
  // üst HUD (skor paneli) altında kalan çubuk okunmaz: panelin yatay aralığındaysa çubuk panelin hemen altına iner (sonra kalabalık ayrımı)
  hudOlc(O);
  if (s) for (let j = 0; j < birimDizi.length; j++) {
    const b = birimDizi[j], a = s[b.si]; b._cubuk = null; if (!a || a.olu) continue;
    izGuncelle(b, a, dt);
    const p = ekran(basUstu(b));
    if (p.z > 1) continue;
    if (hudVar && p.x > hudX0 && p.x < hudX1 && p.y < hudY) p.y = hudY;
    const L = cubukYuva(liste.length); L.b = b; L.a = a; L.x = p.x; L.y = p.y; L.ox = 0; L.oy = 0; liste.push(L);
  }
  // kalabalık: çakışan çubukları dikeyde (aynı sıradalarsa yatayda da) birkaç px ayır; hedef ofset yumuşatılır
  const lim = 13 * O.o, gx = O.gw + 6, gy = BH + 3;
  for (let it = 0; it < 4; it++) for (let m = 0; m < liste.length; m++) for (let n = m + 1; n < liste.length; n++) {
    const A = liste[m], B = liste[n], dx = (B.x + B.ox) - (A.x + A.ox), dy = (B.y + B.oy) - (A.y + A.oy);
    if (Math.abs(dx) >= gx || Math.abs(dy) >= gy) continue;
    const py = (gy - Math.abs(dy)) / 2, sy = dy >= 0 ? 1 : -1;
    A.oy = Math.max(-lim, Math.min(lim, A.oy - sy * py)); B.oy = Math.max(-lim, Math.min(lim, B.oy + sy * py));
    if (Math.abs(dy) < gy * 0.5) { const px2 = Math.min(4 * O.o, (gx - Math.abs(dx)) / 4), sx = dx >= 0 ? 1 : -1; A.ox -= sx * px2; B.ox += sx * px2; }
  }
  const kz = Math.min(1, dtG * 10);
  for (let m = 0; m < liste.length; m++) {
    const L = liste[m], b = L.b; b._cox = b._cox === undefined ? L.ox : b._cox + (L.ox - b._cox) * kz; b._coy = b._coy === undefined ? L.oy : b._coy + (L.oy - b._coy) * kz;
  }
  // uzaktakiler önce, yakındakiler üstte (en çok 16 öğe: araya sokma sıralaması, geçici dizi yok)
  for (let m = 1; m < liste.length; m++) { const L = liste[m]; let n = m - 1; while (n >= 0 && liste[n].y > L.y) { liste[n + 1] = liste[n]; n--; } liste[n + 1] = L; }
  for (let m = 0; m < liste.length; m++) {
    const L = liste[m], b = L.b, x = Math.round(L.x + b._cox - O.gw / 2), y = Math.round(L.y + b._coy);
    const ust = cubukCiz(b, L.a, x, y, O, b.u.taraf === 0);
    const c = b._cubukO || (b._cubukO = { x: 0, y: 0 }); c.x = x + O.gw / 2; c.y = ust; b._cubuk = c;
  }
  kcx.globalAlpha = 1;
  // sayılar: patlayarak büyür, sonra parabolik yayla yan-yukarı süzülür; kritikte büyük + altın kenar + KRİTİK.
  // Boy üç font grubundan ölçekle verilir (font ayrıştırma yalnız grup değişince); çizgi kalınlığı ölçeğe bölünür, görünür kalınlık aynı.
  let sonFont = ''; kcx.textAlign = 'center'; kcx.lineJoin = 'round';
  for (let i = 0; i < yazilar.length; i++) {
    const y = yazilar[i];
    if (y.yas < 0) continue;
    const p = ekran(y.p); const e = y.yas / 0.95; kcx.globalAlpha = y.alfa * Math.max(0, 1 - Math.pow(Math.max(0, e - 0.35) / 0.65, 2));
    const taban = y.kritik ? 26 : y.buyuk ? 20 : 17, sc = (e < 0.12 ? 1.7 - 5.8 * e : 1) * (1 + y.nabiz * 2.2), ol = y.olcek * sc, boy = taban * ol;
    const xx = p.x + y.yon * e * 18, yy = p.y - (50 * e - 40 * e * e) - 8;
    const f = SAYI_FONT[taban]; if (f !== sonFont) { kcx.font = f; sonFont = f; }
    kcx.setTransform(kapDpr * ol, 0, 0, kapDpr * ol, kapDpr * xx, kapDpr * yy);
    kcx.lineWidth = (y.kritik ? 6 : 4.5) / ol; kcx.strokeStyle = y.kritik ? '#7a3a00' : 'rgba(20,8,40,.9)'; kcx.strokeText(y.metin, 0, 0);
    if (y.kenar) { kcx.lineWidth = 2 / ol; kcx.strokeStyle = y.kenar; kcx.strokeText(y.metin, 0, 0); }
    kcx.fillStyle = y.renk; kcx.fillText(y.metin, 0, 0);
    kcx.setTransform(kapDpr, 0, 0, kapDpr, 0, 0);
    if (y.kritik) { kcx.font = KRITIK_FONT; sonFont = KRITIK_FONT; kcx.lineWidth = 3; kcx.strokeStyle = '#3a1800'; kcx.strokeText('KRİTİK', xx, yy - boy * 0.9); kcx.fillStyle = '#ffe9a0'; kcx.fillText('KRİTİK', xx, yy - boy * 0.9); }
  }
  kcx.globalAlpha = 1;
  balonCiz(w, O);
  // Kut portre kartı: soldan kayar, 1,1 sn kalır
  if (kutKart) {
    const t = performance.now() / 1000 - kutKart.t0; if (t > 1.5) kutKart = null;
    else { const gir = Math.min(1, t / 0.25), cik = t > 1.2 ? (t - 1.2) / 0.3 : 0, ox = -260 * (1 - gir) * (1 - gir) * (1 - gir) - 260 * cik * cik;
      const ks = Math.max(0.62, Math.min(1.25, h / 800));   // kart boyu ekran yüksekliğiyle (arayüzün tek ölçeği gibi): telefonda küçülür
      const X = 16 / ks + ox, Y = h * 0.3 / ks, W2 = 230, H2 = 86; kcx.save(); kcx.setTransform(kapDpr * ks, 0, 0, kapDpr * ks, 0, 0); kcx.globalAlpha = 1 - cik;
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
// görsel anlık: iki motor adımı arası ara değer (x, y, can); mana ve kalkan sonraki adımdan, gerisi önceki adımdan.
// Karede bir kez (kare() içinde) hesaplanır; kaplamaCiz aynı sonucu kullanır.
function anlikGorselHesapla() {
  gorunumVar = false; if (!anlikSay) return null;
  const i = gorselT / DT, a = Math.floor(i), i0 = Math.min(a, anlikSay - 1), i1 = Math.min(a + 1, anlikSay - 1), k = Math.min(1, i - a), V = anlikVeri, n = anlikN;
  for (let j = 0; j < n; j++) {
    const o0 = (i0 * n + j) * ALAN, o1 = (i1 * n + j) * ALAN, g = gorunum[j];
    g.x = V[o0] + (V[o1] - V[o0]) * k; g.y = V[o0 + 1] + (V[o1 + 1] - V[o0 + 1]) * k; g.hp = V[o0 + 2] + (V[o1 + 2] - V[o0 + 2]) * k;
    g.mx = V[o0 + 3]; g.mp = V[o1 + 4]; g.mana = V[o0 + 5]; g.kalkan = V[o1 + 6]; g.olu = V[o0 + 7] === 1; g.hedef = V[o0 + 8];
    g.sersem = V[o0 + 9] === 1; g.yavas = V[o0 + 10] === 1; g.yanik = V[o0 + 11] === 1; g.zehir = V[o0 + 12] === 1; g.lanet = V[o0 + 13] === 1; g.davul = V[o0 + 14] === 1;
  }
  gorunumVar = true; return gorunum;
}
function anlikGorsel() { return gorunumVar ? gorunum : null; }

// ── Kare döngüsü ──
const _ka = new THREE.Vector3(), _kb = new THREE.Vector3();
const acıFark = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
// Kadraj kamerası (yalnız görüntü): yaşayan birimlerin XZ sınır kutusuna 1 hücre pay ile yaklaşır; 1,5 sn yumuşatma
function kadraj(dtR) {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, n = 0;
  if (sim && !sim.bitti) for (let j = 0; j < birimDizi.length; j++) { const b = birimDizi[j]; if (b.olumT >= 0) continue; const p = b.kok.position; x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); n++; }
  let olcek = 1, mx = kam.tabanH.x, mz = kam.tabanH.z;
  if (n >= 2) {
    const gen = x1 - x0 + 2.2, der = z1 - z0 + 3.2;
    olcek = Math.min(1, Math.max(0.9, Math.max(gen / 7.2, der / 8.6)));   // tempo: yığılmada kamera dalıp kaosu büyütmesin (0,66 → 0,8 → 0,9: 0,9 × KADRAJ_PAY 1,15 ≈ 1,04, en yakın kadrajda da tahta güvenli alanda kalır)
    mx = kam.tabanH.x + ((x0 + x1) / 2 - kam.tabanH.x) * 0.5; mz = (z0 + z1) / 2 + 0.25;
  }
  if (kam.serbest) return;
  const k = kam.ilk ? 1 : 1 - Math.exp(-dtR / 1.0); kam.ilk = false;   // yaklaşma hızı yarıya (0,5 → 1 sn)
  kam.olcek += (olcek - kam.olcek) * k;
  kam.merkez.x += (mx - kam.merkez.x) * k; kam.merkez.z += (mz - kam.merkez.z) * k;
  // kamera: taban yönünde kalır, bakış noktası yakınlaştıkça savaşın merkezine kayar
  const zf = (1 - kam.olcek) / 0.34;
  // oyuncu yakınlaştırması (iki parmak / tekerlek): yumuşak izler; yakınken iki parmakla kaydırılır
  const kz = 1 - Math.exp(-dtR / 0.12); kam.zoom += (kam.zoomH - kam.zoom) * kz; kam.kayX += (kam.kayHX - kam.kayX) * kz; kam.kayZ += (kam.kayHZ - kam.kayZ) * kz;
  _ka.copy(kam.tabanP).sub(kam.tabanH).multiplyScalar(kam.olcek * kam.zoom);
  // 360° yörünge: bakış noktası etrafında yatay dönüş (yaw) ve eğim (egim); eğim yere girmeyecek ve tepeden bakışı aşmayacak şekilde sınırlı
  kam.yaw += (kam.yawH - kam.yaw) * kz; kam.egim += (kam.egimH - kam.egim) * kz;
  if (kam.yaw || kam.egim) { _kSph.setFromVector3(_ka); _kSph.theta += kam.yaw; _kSph.phi = Math.min(1.38, Math.max(0.08, _kSph.phi + kam.egim)); _ka.setFromSpherical(_kSph); }
  _kb.set(kam.tabanH.x + (kam.merkez.x - kam.tabanH.x) * zf + kam.kayX, kam.tabanH.y, kam.tabanH.z + (kam.merkez.z - kam.tabanH.z) * zf + kam.kayZ);
  kamera.position.copy(_kb).add(_ka);
  if (kam.mvp) _kb.copy(mvpKarisim(dtR, _kb));   // Maçın yıldızı: kadraj kamerasından yakın plana yumuşak geçiş (ve geri)
  if (kam.gecis) {   // hazırlık kadrajından savaş kadrajına yumuşak geçiş
    const g = kam.gecis; g.t += dtR; const e = Math.min(1, g.t / g.sure), c = e * e * (3 - 2 * e);
    kamera.position.lerpVectors(g.p, kamera.position, c); _kb.lerpVectors(g.h, _kb, c); if (e >= 1) kam.gecis = null;
  }
  kam.bak = (kam.bak || new THREE.Vector3()).copy(_kb);
  kamera.lookAt(_kb); kamera.updateMatrixWorld(true);
  if (kam.mvp) mvpArkaGuncelle();
}
const DURUM_TUR = ['sersem', 'buz', 'yanik', 'zehir', 'lanet', 'davul'], DURUM_ALAN = ['sersem', 'yavas', 'yanik', 'zehir', 'lanet', 'davul'];
// kodlu hareket katmanlarına giden seçenekler: birim başına her karede yeniden doldurulan tek nesne
const OPS_IKI = { hareket: false, hiz: 0, saldiri: null, yetenek: false, vurul: false, olum: false, zafer: false };
const OPS_DORT = { hiz: 0, saldiri: false, yetenek: false, vurul: false, olum: false, zafer: false };
const KARE_SONUC = { bitti: false, sonuc: null, t: 0 }, HIS_OPS = { hizKati: 1 };
const _gorM = new THREE.Matrix4(), _gorF = new THREE.Frustum(), _gorK = new THREE.Sphere();
// birim kameranın görüş alanında mı (gövde boyu + pay; gölgesi kadrajda kalabilir diye geniş)
function ekranda(b) { const h = b.kok.userData.vfxBoy || 1; _gorK.center.set(b.kok.position.x, b.kok.position.y + h * 0.5, b.kok.position.z); _gorK.radius = h + 0.9; return _gorF.intersectsSphere(_gorK); }
export function kare(dtSabit) {
  if (!renderer) { KARE_SONUC.bitti = false; return KARE_SONUC; }
  let kareBas = performance.now();
  if (dtSabit === undefined) {
    hamOlc(kareBas);
    if (kareAtla(kareBas)) return KARE_SONUC;   // 60/120 sınırı: yüksek yenilemeli ekranda bu rAF çizilmez (sonuç bir önceki karenin)
    kareOlc(kareBas);
  }
  const dtGercek = dtSabit !== undefined ? dtSabit : Math.min(0.05, saat.getDelta());
  const t = kareBas / 1000;
  for (let j = 0; j < efektler.length; j++) { const e = efektler[j]; if (e.kalici) e.guncelle(t); }
  // görsel zaman: hit-stop / Kut yavaşlaması / giriş beklemesi YALNIZ görüntüyü ve motorun ne kadar ilerletileceğini etkiler;
  // motor her zaman sabit DT adımıyla ve aynı olay sırasıyla koşar (belirlenimci)
  HIS_OPS.hizKati = hizKati; const H = his.guncelle(dtGercek, HIS_OPS);
  const vOlcek = vfx.zamanOlcek();
  const dt = H.dtGorsel * hizKati * vOlcek;                 // gorselT, karışıcılar, kodlu hareket
  const dtEfekt = dtGercek * H.olcek * hizKati * vOlcek;     // efektler girişte de oynasın
  if (sim) {
    const son = sim.bitti ? (anlikSay - 1) * DT + 1.6 : Infinity;
    gorselT = Math.min(gorselT + dt, son);
    simIlerlet();
    // olay kuyruğu: yalnız yeni olay eklendiyse sıralanır; zamanı gelenler baştan işlenir, dizi yerinde kaydırılır
    if (kuyrukKirli) { kuyruk.sort(kuyrukSira); kuyrukKirli = false; }
    let kb = 0; while (kb < kuyruk.length && kuyruk[kb].t <= gorselT) kuyruk[kb++].is();
    if (kb) { kuyruk.copyWithin(0, kb); kuyruk.length -= kb; }
    const s = anlikGorselHesapla();
    onKurulmaTahmin();   // ağır vuruşun uzun kurulması motorun önden gelişinden önce başlasın (yalnız görüntü)
    const liste = birimDizi;
    // görüş alanı (bir önceki karenin kamerası): ekran dışı birimin iskeleti güncellenmez
    _gorM.multiplyMatrices(kamera.projectionMatrix, kamera.matrixWorldInverse); _gorF.setFromProjectionMatrix(_gorM);
    // görsel ayrıştırma: birbirine gövde yarıçaplarından yakın iki birim yumuşakça itilir (yalnız görüntü; motor konumu değişmez)
    for (let x = 0; x < liste.length; x++) { const b = liste[x]; if (!b._it) b._it = new THREE.Vector2(); b._it.set(0, 0); }
    for (let x = 0; x < liste.length; x++) for (let y = x + 1; y < liste.length; y++) {
      const A = liste[x], B = liste[y]; if (A.olumT >= 0 || B.olumT >= 0) continue;
      const a1 = s[A.si], b1 = s[B.si]; if (!a1 || !b1) continue;
      let dx = a1.x - b1.x, dz = a1.y - b1.y; const d = Math.hypot(dx, dz), en = (A.yaricap + B.yaricap) * 0.92;
      if (d < en) { if (d < 1e-4) { dx = A.u.taraf ? 1 : -1; dz = 0; } const L = Math.hypot(dx, dz) || 1, it = Math.min(0.3, (en - d) * 0.5); A._it.x += dx / L * it; A._it.y += dz / L * it; B._it.x -= dx / L * it; B._it.y -= dz / L * it; }
    }
    for (let bi = 0; bi < liste.length; bi++) {
      const b = liste[bi], a = s[b.si];
      const hx = a.x - 3, hz = a.y - 4;   // dunya(a.x, a.y)
      const ddx = a.x - b.oncekiX, ddz = a.y - b.oncekiY, yol = Math.hypot(ddx, ddz);
      if (dt > 1e-5) { b.hizG = yol / dt; b.hizS += (b.hizG - b.hizS) * Math.min(1, dt * 8); }
      const hareket = yol > 0.002 * Math.max(1, hizKati) || (dt <= 1e-5 && b.hizG > 0.05); b.oncekiX = a.x; b.oncekiY = a.y;
      const kz = Math.min(1, dt * 8); b.ayir.x += (b._it.x - b.ayir.x) * kz; b.ayir.y += (b._it.y - b.ayir.y) * kz;
      b.kok.position.x = hx + b.ayir.x; b.kok.position.z = hz + b.ayir.y; b.kok.position.y = ARENA_Y;
      if (b.kay) { const ky = b.kay; if (gorselT >= ky.son || b.olumT >= 0) { b.kay = null; b.hizS = 0; }
        else { const e = Math.max(0, Math.min(1, (gorselT - ky.t0) / (ky.t1 - ky.t0))), c = 1 - (1 - e) * (1 - e) * (1 - e);
          b.kok.position.x = ky.ax + (ky.bx - ky.ax) * c + b.ayir.x; b.kok.position.z = ky.az + (ky.bz - ky.az) * c + b.ayir.y; } }
      const olu = b.olumT >= 0, bay = b.bay;
      const donuk = his.donuk(b) && !(b.kay && gorselT < b.kay.t1), dtB = donuk ? 0 : dt;   // hücumda gövde pozu kaymayla eş kalsın     // yerel hit-stop: bu birimin animasyonu donar
      b.yerelT += dtB;
      // bakış: yürürken hareket yönüne (yan/geri yürüme yok), dururken hedefe; bizim taraf beklerken yüzünü kameraya 25–30° çevirir
      if (!olu) {
        let aci = null;
        if (hareket && yol > 1e-4 && b.durum !== 'saldir' && b.durum !== 'yetenek') aci = Math.atan2(ddx, ddz);
        else if (a.hedef >= 0) { const hb = birimler.get(a.hedef); if (hb) aci = Math.atan2(hb.kok.position.x - b.kok.position.x, hb.kok.position.z - b.kok.position.z); }
        if (b.yetBak) { if (gorselT < b.yetBakSon && b.yetBak.olumT < 0) aci = Math.atan2(b.yetBak.kok.position.x - b.kok.position.x, b.yetBak.kok.position.z - b.kok.position.z); else b.yetBak = null; }
        if (b.zaferMi) aci = Math.atan2(kamera.position.x - b.kok.position.x, kamera.position.z - b.kok.position.z);
        if (b.kay) aci = b.kay.aci;
        if (aci !== null) b.hedefAci = aci;
        let ofs = 0;
        if (b.u.taraf === 0 && !b.zaferMi && !b.kay && b.durum !== 'saldir' && b.durum !== 'yetenek') {
          let f = acıFark(Math.atan2(kamera.position.x - b.kok.position.x, kamera.position.z - b.kok.position.z), b.hedefAci);
          if (Math.abs(f) > 2.8) f = (b.kok.position.x < 0 ? -1 : 1) * Math.PI;
          ofs = Math.max(-0.5, Math.min(0.5, f));
        }
        b.yuzOfs = (b.yuzOfs || 0) + (ofs - (b.yuzOfs || 0)) * Math.min(1, dt * (ofs ? 4 : 9));
        const fark = acıFark(b.hedefAci + b.yuzOfs, b.kok.rotation.y); b.kok.rotation.y += fark * Math.min(1, dt * (b.kay ? 22 : 8));
      }
      // görünmeyen birim (çözülmüş ölü, gizli kök) hiç güncellenmez; ekran dışındaki birim iskeletini erteler (süre birikir, görününce uygulanır)
      const gizli = !b.kok.visible || (olu && !b.govde.visible), gorunur = !gizli && ekranda(b);
      // animasyon durumu
      if (b.isk && !gizli) {
        const i2 = b.isk;
        if (!olu) {
          // yetenek patlaması geçtikten sonra motor birimi yürütüyorsa yetenek klibi bırakılır (yerinde kayarak poz tutmasın; yürüyüşe karışır)
          if (hareket && b.durum === 'yetenek' && !b.kay && gorselT > b.yetAn + YET_YURU_PAY) { b.tekBitis = gorselT; if (b.dizi) b.dizi.length = 0; if (b.zk) { b.zk = null; b.zkSira.length = 0; } yetPozSondur(b.ik); }
          if (b.durum === 'zafer' && b.yerelT >= (b.zaferBit || 0)) { oyna(b, i2.beklemeAd, { dongu: true, gecis: 0.45 }); b.durum = 'bekle'; b.araT = 3 + (b.uid % 3); }
          if ((b.durum === 'yetenek' || b.durum === 'vurul' || b.durum === 'ara' || (b.durum === 'saldir' && !b.zk)) && gorselT >= b.tekBitis) {
            if (b.dizi && b.dizi.length) { const n = b.dizi.shift(); const loop = n.endsWith('_Loop'); oyna(b, n, { gecis: 0.06 }); b.tekBitis = gorselT + (loop ? 0.6 : ual.klip[n].duration); }
            else b.durum = '';
          }
          if (b.durum === '' || b.durum === 'bekle' || b.durum === 'yuru') {
            // yürüme: adım uzunluğu hıza eşlenir (ayak kaymaz); 1,8 katı aşınca koşuya geçer
            let istek = i2.beklemeAd, ts = null;
            if (hareket) {
              const yH = (b.adimHiz && b.adimHiz.Walk_Loop) || 1.2, jH = (b.adimHiz && b.adimHiz.Jog_Fwd_Loop) || 2.4, kH = b.gor.yuruHiz || 1;
              const jog = b.u.soy.includes('atli') || b.hizS / yH > (i2.aktifAd === 'Jog_Fwd_Loop' ? 1.5 : 1.8);   // eşikte yürü-koş gidip gelmesin (histerezis)
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
        if (gorunur) {
          const gec = dtB + i2.borc; i2.borc = 0; i2.mix.update(gec); aktar(b);
          const o = OPS_IKI; o.hareket = hareket && !olu; o.hiz = olu ? 0 : (hareket ? b.hizS : 0); o.saldiri = bay.saldiri && typeof bay.saldiri === 'object' ? bay.saldiri : null;
          o.yetenek = bay.yetenek; o.vurul = bay.vurul || false; o.olum = olu; o.zafer = b.zaferMi && b.durum === 'zafer';
          ikiAyakliGuncelle(b.ik, gec, o);
        } else i2.borc = Math.min(1, i2.borc + dtB);
      } else if ((b.dort || b.yilan) && gorunur) {
        const o = OPS_DORT; o.hiz = olu ? 0 : (hareket ? b.hizS : 0); o.saldiri = bay.saldiri || false; o.yetenek = bay.yetenek;   // dört ayaklı: {darbe, on, onay, iptal, sonra} (kurulma süresi, önden kurulma)
        o.vurul = bay.vurul || false; o.olum = olu; o.zafer = b.zaferMi && b.yerelT < (b.zaferBit || 0);   // (yorumun içinde kalmıştı: dört ayaklı ve yılan hiç devrilmiyor, sevinmiyor, vurulunca sarsılmıyordu)
        if (b.dort) {
          const r = dortAyakliGuncelle(b.dort, dtB, o);
          // şahlanıp yere vurma: toz + şok + sarsıntı, yakındaki düşmanlar sarsılır (yalnız görüntü)
          if (r && r.olay === 'yerVur') { vfx.yapi.sok(b.kok.position, { renk: '#e8d2b0', r: 0.9, toz: true, tozRenk: '#b49a7a', tozN: 10, sure: 0.45 }); his.sarsinti(0.3, 0.25);
            for (const o2 of birimler.values()) if (o2.u.taraf !== b.u.taraf && o2.olumT < 0 && o2.kok.position.distanceTo(b.kok.position) < 1.6) his.darbe(o2, o2.kok.position.clone().sub(b.kok.position), 0.5); }
        } else {
          const r = yilanGuncelle(b.yilan, dtB, o);
          if (r && r.olay === 'toz' && !hafif) vfx.yapi.parca({ p: _ka.set(b.kok.position.x, ARENA_Y + 0.05, b.kok.position.z), v: _kb.set(0, 0.3, 0), drag: 2, omur: 0.6, boy: 0.16, boy2: 0.4, renk: '#c9b090', kare: 'toz', normal: true, rot: 'r', a: 0.45, hot: 0, on: 0 });
        }
      }
      if (b.gor.tur === 'sabit' && gorunur) sabitSalin(b, dtB, { olu, hareket, saldiri: !!bay.saldiri, yetenek: !!bay.yetenek, vurul: !!bay.vurul });
      bay.saldiri = null; bay.yetenek = false; bay.vurul = 0;
      // taraf diski: vuruşta kısa nabız
      if (b.halkalar[0]) { b.diskNabiz = Math.max(0, (b.diskNabiz || 0) - dtGercek); b.halkalar[0].material.opacity = 0.5; b.halkalar[0].scale.setScalar((b.halkalar[0].userData.s || 1) * (1 + b.diskNabiz * 0.6)); }
      // çözülme bitince kök (taraf halkası, temas gölgesi) de gizlenir
      if (olu && !b.govde.visible && gorselT - b.olumT > 0.5) b.kok.visible = false;
      // sürekli durum efektleri (yalnız değişimde)
      if (!olu && a && !a.olu) {
        for (let k = 0; k < DURUM_TUR.length; k++) { const tur = DURUM_TUR[k], v = a[DURUM_ALAN[k]] && !(k === 0 && b.buzKadar > gorselT); if (b.vd[tur] !== v) { b.vd[tur] = v; vfx.durum(b.kok, tur, v); } }
        const kal = a.kalkan > 0; if (b.vd.kalkan !== kal) { b.vd.kalkan = kal; vfx.durum(b.kok, 'kalkan', kal); }
      }
    }
    // yüzen sayılar: süresi dolan yerinde atılır (yeni dizi yok). Yer değiştirerek silme (swap-remove) çizim sırasını bozup eski
    // sayıyı yenisinin üstüne çıkarıyordu (büyük KRİTİK sayısı küçük sayının altında kalıyordu); sıra koruyan sıkıştırma da O(n) ve ayırmasız.
    { let k = 0; for (let i = 0; i < yazilar.length; i++) { const y = yazilar[i]; y.yas += dt; if (y.nabiz > 0) y.nabiz = Math.max(0, y.nabiz - dt); if (y.yas < 0.95) yazilar[k++] = y; } yazilar.length = k; }
    balonGuncelle(dt, dtGercek);
    let ky = 0;
    for (let j = 0; j < efektler.length; j++) { const e = efektler[j]; let kal = true;
      if (!e.kalici) { e.yas += dt; const k = Math.min(1, e.yas / e.sure); e.guncelle(t, k, dt); if (k >= 1) { sahne.remove(e.o); if (e.bitis) e.bitis(); kal = false; } }
      if (kal) efektler[ky++] = e; }
    efektler.length = ky;
  } else if (hzr.acik) hzrGuncelle(dtGercek);
  hzrSondur(dtGercek);
  kadraj(dtGercek);
  vfx.guncelle(dtEfekt);
  // kamera: his (sarsıntı + yakınlaştırma) ve vfx sarsıntısı yalnız bu kare için uygulanır, sonra taban duruşa döner
  his.kameraUygula();
  const so = vfx.sarsintiOfset(); if (so.lengthSq() > 0) { kamera.position.add(so); kamera.updateMatrixWorld(true); }
  if (kapKademe !== G.kademeAl()) kaplamaBoyutla();   // uyarlanır kalite kademe değiştirdi
  const cizBas = performance.now();
  G.ciz(undefined, undefined, dtGercek);   // gölge haritası kademenin sınırıyla (Tam kademede her karede)
  const cizSon = performance.now();
  kcx.clearRect(0, 0, kapW, kapH);
  if (sim && !(kam.mvp && kam.mvp.e > 0.05)) kaplamaCiz(dt, dtGercek);
  else if (!sim && hzr.acik) hzrKaplama();   // yakın planda can çubukları ve yazılar gizli
  vfx.ekranCiz(kcx, kapW, kapH);
  his.kameraGeriAl();
  const kareSon = performance.now();
  _olc.js = cizBas - kareBas; _olc.ciz = cizSon - cizBas; _olc.kap = kareSon - cizSon; _olc.toplam = kareSon - kareBas;
  if (olcerAcik) olcerYaz(kareSon);
  KARE_SONUC.bitti = !!(sim && sim.bitti && gorselT >= (anlikSay - 1) * DT + ONDE_SN); KARE_SONUC.sonuc = sim && sim.sonuc; KARE_SONUC.t = gorselT;
  return KARE_SONUC;
}

// ── Kare süresi ölçümü (?fps=1 ya da localStorage kut.fps=1) ve uyarlanır kalite ──
// Ölçüm halkası: son 512 karenin aralığı (ms) ve zamanı. Kapalı göstergede yalnız birkaç sayı yazılır, DOM'a dokunulmaz.
export const _olc = { js: 0, ciz: 0, kap: 0, toplam: 0 };
const OLC_N = 512, olcAra = new Float32Array(OLC_N), olcZ = new Float64Array(OLC_N), olcJs = new Float32Array(OLC_N);
let olcI = 0, sonKareZ = 0, kotuKare = 0, olcerAcik = false, olcerEl = null, olcerT = 0;
// uyarlanır kalite durumu: 0,5 sn'lik kovalar; son 6 kova (3 sn) kötüyse kademe iner, art arda 20 kova (10 sn) rahatsa çıkar
const UY = { acik: true, sabit: -1, kovaBas: 0, kovaN: 0, kovaTop: 0, kotu: 0, kotuYumusak: 0, rahat: 0, rahat120: 0, bekle: 0,
  ilk: true, ilkN: 0, ilkTop: 0, yuksekYenileme: false, basarisiz: new Uint8Array(16), son: '',
  kova: new Float32Array(6), kovaI: 0, denetle: null, inisYasak: 0 };
const HEDEF_ARA = 1000 / 55, RAHAT_ARA = 1000 / 57.5;
function ayarOku(ad) { try { return localStorage.getItem(ad); } catch (e) { return null; } }
function ayarYaz(ad, d) { try { localStorage.setItem(ad, d); } catch (e) {} }
// ── Kare hızı hedefi (kut.fps_hedef: '60' | '120' | 'oto') ve ekran yenileme hızı ──
// Ekran yenileme hızı her rAF çağrısının (çizilmeyenler dahil) aralığından ölçülür: 32 aralığın alt çeyreği; oturum boyunca görülen en yüksek
// değer tutulur (yük altında yavaşlayan kare, ekranı 60 Hz sanmasın). 75 Hz altı 60 sayılır.
// Otomatik: hedef ekranın hızı. 120: en çok 120. 60: 60'ta sabit; yüksek yenilemeli ekranda rAF çağrıları atlanarak.
// Uyarlanır kalite hedefe göre çalışır: hedef 100 fps ve üstüyse "120 Hz bütçesi" kademesi devreye girer.
let fpsHedefAyar = (() => { const v = ayarOku('kut.fps_hedef'); return v === '60' || v === '120' ? v : 'oto'; })();
let ekranHz = 60, hamZ = 0, hamI = 0, sonCizZ = 0;
const hamAra = new Float32Array(32), hamSira = new Float32Array(32);
function hamOlc(z) {
  if (hamZ && !(typeof document !== 'undefined' && document.hidden)) {
    const d = z - hamZ;
    if (d > 2 && d < 100) { hamAra[hamI++] = d; if (hamI === 32) { hamI = 0; hamSira.set(hamAra); hamSira.sort(); const hz = 1000 / hamSira[8]; if (hz >= 75 && hz > ekranHz + 3) ekranHz = Math.min(360, Math.round(hz)); } }
  }
  hamZ = z;
}
function kapHz() { return fpsHedefAyar === '60' ? 60 : fpsHedefAyar === '120' ? 120 : 0; }
function hedefHz() { const k = kapHz(); return k ? Math.min(k, ekranHz) : ekranHz; }
function kareAtla(z) {
  const k = kapHz();
  if (!k || ekranHz < k * 1.1) { sonCizZ = z; return false; }
  const ara = 1000 / k, gecen = z - sonCizZ;
  if (sonCizZ && gecen < ara - Math.min(2, ara * 0.12)) return true;
  sonCizZ = sonCizZ && gecen < 2 * ara ? sonCizZ + ara : z;   // faz kaymadan: 144 Hz ekranda da ortalama 60
  return false;
}
function kareOlc(z) {
  if (typeof document !== 'undefined' && document.hidden) { sonKareZ = 0; return; }
  if (sonKareZ) {
    const ara = z - sonKareZ;
    if (ara < 5000) {   // 5 sn'den uzun boşluk: hata ayıklayıcı / sistem uykusu; ölçüme katılmaz (sekme gizliyken zaten ölçülmez)
      olcAra[olcI] = ara; olcZ[olcI] = z; olcJs[olcI] = _olc.toplam; olcI = (olcI + 1) % OLC_N;
      if (ara > 33.4) kotuKare++;
      if (sim) uyarla(z, ara);
    }
  }
  sonKareZ = z;
}
function uyarlaSifirla(bekleMs = 600) { UY.kovaN = 0; UY.kovaTop = 0; UY.kovaBas = 0; UY.kotu = 0; UY.kotuYumusak = 0; UY.rahat = 0; UY.rahat120 = 0; UY.bekle = performance.now() + bekleMs; }
// son 6 kovanın (3 sn) ortalama kare aralığı
function kova3() { let t = 0; for (let i = 0; i < 6; i++) t += UY.kova[i]; return t / 6; }
function kademeGec(n, neden) {
  const once = G.kademeAl(); if (n === once) return;
  // iniş işe yaradı mı: 3 sn sonra kare süresi en az %8 kısalmadıysa darboğaz grafik değildir (pil tasarrufu 30 Hz kilidi,
  // işlemci yükü): eski kademeye dönülür ve bir dakika yeniden inilmez
  UY.denetle = n > once ? { eski: once, ort: kova3(), n: 0 } : null;
  G.kademeUygula(n); UY.son = neden; ayarYaz('kut.kademe', String(n));
  uyarlaSifirla(800);   // yeni hedefler ve gölge/bloom yeniden kurulurken ilk kareler ölçülmez
}
function uyarla(z, ara) {
  if (!UY.acik || UY.sabit >= 0 || z < UY.bekle) return;
  if (!UY.kovaBas) UY.kovaBas = z;
  UY.kovaN++; UY.kovaTop += ara;
  if (z - UY.kovaBas < 500) return;
  const ort = UY.kovaTop / UY.kovaN; UY.kovaN = 0; UY.kovaTop = 0; UY.kovaBas = z;
  UY.kova[UY.kovaI] = ort; UY.kovaI = (UY.kovaI + 1) % 6;
  const k = G.kademeAl();
  if (UY.denetle && ++UY.denetle.n >= 6) {
    const d = UY.denetle; UY.denetle = null;
    if (kova3() > d.ort * 0.92) { UY.inisYasak = z + 60000; kademeGec(d.eski, 'iniş kare süresini kısaltmadı'); UY.denetle = null; return; }
  }
  // açılış: ilk 3 sn sessiz ölçüm → ekran yenileme sınıfı ve başlangıç kademesi
  if (UY.ilk) {
    UY.ilkN++; UY.ilkTop += ort; if (UY.ilkN < 6) return;
    UY.ilk = false;
    const fps = 1000 / (UY.ilkTop / UY.ilkN); let adim = fps < 22 ? 4 : fps < 35 ? 2 : fps < 50 ? 1 : 0, n = k;
    while (adim-- > 0) n = G.kademeKomsu(+1, n);
    if (n !== k) kademeGec(n, 'açılış ölçümü ' + fps.toFixed(0) + ' fps');
    return;
  }
  // iniş: 3 sn boyunca 55 fps altı → bir kademe; hedef 100 fps ve üstüyse (120 Hz) hedefin %87,5'i altı → yalnız "120 Hz bütçesi" kademesine
  const hh = hedefHz(), yuksek = hh >= 100; UY.yuksekYenileme = yuksek;
  UY.kotu = ort > HEDEF_ARA ? UY.kotu + 1 : 0;
  UY.kotuYumusak = yuksek && ort > 1000 / (hh * 0.875) ? UY.kotuYumusak + 1 : 0;
  if (z < UY.inisYasak) { UY.kotu = 0; UY.kotuYumusak = 0; }
  if (UY.kotu >= 6) { const n = G.kademeKomsu(+1); if (n !== k) { UY.basarisiz[k] = Math.min(9, UY.basarisiz[k] + 1); kademeGec(n, (1000 / ort).toFixed(0) + ' fps, 3 sn'); } else UY.kotu = 0; return; }
  if (UY.kotuYumusak >= 6 && k === 0) { UY.basarisiz[0] = Math.min(9, UY.basarisiz[0] + 1); kademeGec(1, '120 Hz bütçesi'); return; }
  // çıkış: 10 sn rahat (her başarısızlıkta bekleme iki katı, üç başarısızlıktan sonra o kademeye dönülmez)
  if (k === 0) return;
  const ust = G.kademeKomsu(-1); if (ust === k) return;
  const rahat = yuksek && ust === 0 ? ort <= 1000 / (hh * 0.95) : ort <= RAHAT_ARA;
  UY.rahat = rahat ? UY.rahat + 1 : 0;
  const b = UY.basarisiz[ust]; if (b >= 3) return;
  if (UY.rahat >= 20 * (1 << b)) kademeGec(ust, 'rahat ' + (10 << b) + ' sn');
}
function olcerKur() {
  if (olcerEl || typeof document === 'undefined') return;
  olcerEl = document.createElement('div'); olcerEl.id = 'kutOlcer';
  olcerEl.style.cssText = 'position:fixed;left:6px;bottom:6px;z-index:9999;pointer-events:none;font:600 11px/1.35 ui-monospace,Menlo,Consolas,monospace;color:#e8f6ff;background:rgba(10,6,24,.72);padding:5px 7px;border-radius:7px;white-space:pre';
  olcerEl.textContent = 'Kare hızı savaşta ölçülür';
  document.body.appendChild(olcerEl);
}
function olcerYaz(z) {
  if (z - olcerT < 500) return; olcerT = z;
  // son 2 sn: ortalama fps ve en kötü kare
  // (çok yavaş cihazda 2 sn'de 3'ten az kare varsa son 3 kare)
  let n = 0, top = 0, enKotu = 0, js = 0;
  for (let j = 1; j <= OLC_N; j++) { const i = (olcI - j + OLC_N) % OLC_N; if (!olcZ[i] || (z - olcZ[i] > 2000 && n >= 3)) break; n++; top += olcAra[i]; js += olcJs[i]; if (olcAra[i] > enKotu) enKotu = olcAra[i]; }
  const ci = G.cizimBilgi(), fps = n ? 1000 / (top / n) : 0, v = (x) => x.toFixed(1).replace('.', ',');
  olcerEl.textContent = `${fps.toFixed(0)} fps · en kötü ${v(enKotu)} ms (2 sn)\n33 ms üstü: ${kotuKare} · çizim ${ci ? ci.calls : 0} · üçgen ${ci ? Math.round(ci.triangles / 1000) : 0} bin\n` +
    `JS ${v(n ? js / n : _olc.toplam)} ms (çizim ${v(_olc.ciz)}) · kademe ${G.kademeAl()} ${G.kademeAd()}${UY.sabit >= 0 ? ' (sabit)' : UY.acik ? '' : ' (elle)'}\n` +
    `hedef ${fpsHedefAyar === 'oto' ? 'otomatik' : fpsHedefAyar} → ${hedefHz()} fps · ekran ${ekranHz} Hz`;
}
/** Kare hızı göstergesi aç/kapat (ayar kalıcı: kut.fps) */
export function olcer(acik) {
  olcerAcik = !!acik; ayarYaz('kut.fps', acik ? '1' : '0');
  if (acik) olcerKur(); else if (olcerEl) { olcerEl.remove(); olcerEl = null; }
}
/** Uyarlanır kalite aç/kapat (kut.uyarla). Kapatınca tam kaliteye döner. */
export function uyarlanir(acik) {
  UY.acik = !!acik; ayarYaz('kut.uyarla', acik ? '1' : '0');
  if (!acik && renderer) { G.kademeUygula(0); ayarYaz('kut.kademe', '0'); }
  uyarlaSifirla();
}
export function kaliteBilgi() { return { uyarlanir: UY.acik, kademe: G.kademeAl(), ad: G.kademeAd(), olcer: olcerAcik, son: UY.son, fpsHedef: fpsHedefAyar, ekranHz, hedefHz: hedefHz() }; }
/** Kare hızı hedefi: '60' | '120' | 'oto' (kalıcı: kut.fps_hedef). 60'a inince "120 Hz bütçesi" kademesinden tam kaliteye döner. */
export function fpsHedef(v) {
  if (v === undefined) return fpsHedefAyar;
  fpsHedefAyar = v === '60' || v === '120' ? v : 'oto'; ayarYaz('kut.fps_hedef', fpsHedefAyar); sonCizZ = 0;
  UY.basarisiz.fill(0); UY.inisYasak = 0; UY.denetle = null;
  if (renderer && UY.sabit < 0 && hedefHz() < 100 && G.kademeAl() === 1) kademeGec(0, 'kare hızı hedefi 60');
  uyarlaSifirla(800);
  return fpsHedefAyar;
}
/** hata ayıklama: kademeyi elle ver (uyarlama durur); −1 uyarlamaya döner */
export function kademe(n) { UY.sabit = n; if (renderer) G.kademeUygula(n >= 0 ? n : 0); }

// ── Dışa açık ──
export function hiz(k) { hizKati = k; }
export function dinle(olay, fn) { dinleyici[olay] = fn; }
/** Oyuncu dokunuşu: ekran koordinatı → kendi yaratığı; Kut uygulanırsa true */
export function dokun(x, y) {
  if (!sim || sim.bitti || !sim.kutVar(0)) return false;
  // sık diziliş (komşular 1,5 birim arada): en yakın birim ekranda ölçülür; isabet yarıçapı, birimin ekrandaki 0,72 birimlik
  // (aralığın yarısından az) yatay ölçüsünü aşmaz → iki komşunun arasına dokunmak yanlış birimi seçmez
  let en = null, m = Infinity;
  for (const [uid, b] of birimler) {
    if (b.u.taraf !== 0 || b.olumT >= 0) continue;
    const c = b.kok.position.clone().setY(ARENA_Y + 0.5 * (b.kok.userData.vfxBoy || 1)), p = ekran(c, {}), p2 = ekran(c.clone().setX(c.x + 0.72), {});
    const r = Math.min(80, Math.max(18, Math.hypot(p2.x - p.x, p2.y - p.y)));
    // gövde dikeyde daha uzun: ayak ile baş arası da isabet sayılır (y ekseni hafif basık mesafe)
    const d = Math.hypot(p.x - x, (p.y - y) * 0.7); if (d <= r && d < m) { m = d; en = b; }
  }
  if (!en) return false;
  const u = sim.birimler.find(o => o.uid === en.uid); if (!u || u.olu) return false;
  if (sim.kut(0, u.i)) { kutlu.add(u.uid); kutSutun(en); return u; }
  return false;
}
// Zafer: kısa sevinç (sevinç klibi BİR KEZ, en çok ZAFER_SURE sn; his.zafer iki zıplama), ardından bekleme döngüsüne dönülür ve duruş
// kameraya dönük tutulur (REFERANS_ANIMASYON §1: dans/zıplama döngüsü yok). Birimler arası 0–0,3 sn faz farkı.
const ZAFER_SURE = 2.2;
function zaferBasla(b, gecis, zipla = true) {
  if (b.isk) {
    b.zk = null; b.zkSira = []; b.dizi = null;
    const z = (b.gor.zafer && ual.klip[b.gor.zafer]) ? b.gor.zafer : 'Yes';
    oyna(b, z, { gecis, tut: true }); b.durum = 'zafer';
    if (b.isk.aktif) b.isk.aktif.startAt(b.isk.mix.time + (b.uid * 0.137) % 0.3);   // faz farkı: birimler aynı anda başlamaz
    b.zaferBit = b.yerelT + Math.min(ZAFER_SURE, ual.klip[z].duration);
  } else b.zaferBit = b.yerelT + ZAFER_SURE + 0.4;   // dört ayaklı / yılan: kodlu sevinç (baş kalkar, kuyruk sallanır) kısa sürer
  b.zaferMi = true; if (zipla) his.zafer(b);
}
// sade: Maçın Yıldızı sinematiği oynayacak (yıldız saçılması yok); haric: o birim sevinmez (imza hareketini yakın planda yapar)
export function zafer(taraf, { haric = -1, sade = false } = {}) {
  for (const b of birimler.values()) if (b.u.taraf === taraf && b.olumT < 0 && b.uid !== haric) {
    zaferBasla(b, 0.2);
    if (sade) continue;
    // hafif altın parıltısı (ganimet hazırlığı, SAHNE_GEREKSINIM adım 2): başın üstünden birkaç altın yıldız saçılır
    const h = b.kok.userData.vfxBoy || 1, bas = b.kok.position.clone().setY(ARENA_Y + h * 0.95);
    vfx.yapi.patlama(bas, { renk: '#ffd76a', n: hafif ? 5 : 8, hiz: 1.6, g: 1.5, yildiz: true });
  }
}
/** Yenilgide can hasarı anı: rakibin sağ kalan her biriminden oyuncunun tarafına bir ışık uçar (yıldızı kadar parlak).
    Sayı (−N) sonuç bandında arayüzde yazar; sahnede tekrar yazılmaz. */
export function hasarKivilcim(taraf = 1) {
  if (!sim) return 0;
  const kalan = [...birimler.values()].filter(b => b.u.taraf === taraf && b.olumT < 0);
  const hedef = new THREE.Vector3(0, ARENA_Y + 0.5, taraf === 1 ? 4.7 : -4.7);
  kalan.forEach((b, i) => {
    const s = Math.max(1, Math.min(3, b.u.b.s || 1)), bas = b.kok.position.clone().setY(ARENA_Y + (b.kok.userData.vfxBoy || 1) * 0.8);
    const son = hedef.clone().setX((i - (kalan.length - 1) / 2) * 0.5), sure = 0.6 + i * 0.09;
    vfx.mermi(bas, son, sure, { tur: 'isik', renk: taraf === 1 ? '#ff6a5a' : '#6ab8ff', guc: 0.55 + 0.25 * s, yay: 1.1,
      bitis: () => { vfx.yapi.flas(son, { renk: '#ff8a6a', boy: 0.7 + 0.25 * s, sure: 0.25 }); if (i === kalan.length - 1) his.sarsinti(0.12, 0.2); } });
  });
  return kalan.length;
}
/** Sonuca geç: motor savaşı sona kadar koşar (istatistik dolar, anlıklar alınır, görsel olay planlanmaz → ses ve efekt seli yok),
    görüntü son anlığa sarılır: ölüler gizlenir, sağ kalanlar son konumlarına geçer, bekleyen olaylar, yazılar ve balonlar atılır.
    Sonraki kare() bitti döner; sonuç bandı, zafer sesi ve zafer dansı her zamanki yoldan çalışır. Dönen: sarıldıysa true. */
export function sonaSar() {
  if (!sim || !anlikSay) return false;
  let n = 0;
  while (!sim.bitti && n++ < 20000) {
    const tOnce = sim.t; sim.adim();
    const fx = sim.fx, liste = new Array(fx.length);
    for (let i = 0; i < fx.length; i++) liste[i] = { ...fx[i], t: tOnce };
    istatTopla(liste); anlikAl();
  }
  const sonT = (anlikSay - 1) * DT + ONDE_SN;
  if (gorselT < sonT) gorselT = sonT;
  kuyruk.length = 0; kuyrukKirli = false; yazilar.length = 0; bantlar.length = 0; balonSira.length = 0; kutKart = null; kutlu.clear();
  for (const e of efektler) if (!e.kalici) { sahne.remove(e.o); if (e.bitis) e.bitis(); }
  efektler = efektler.filter(e => e.kalici);
  his.sifirla();   // hit-stop, Kut yavaşlaması, yakınlaşma, giriş düşüşü biter
  const son = anlikSay - 1;
  for (const b of birimDizi) {
    const olu = anlikDeger(son, b.si, 7) === 1;
    vfx.durumTemizle(b.kok); b.vd = {}; b.zk = null; b.zkSira = []; b.dizi = null; b.yetBak = null; b.onk.var = false;
    const gr = b.model.userData.gorunum; if (gr) gr.kenar(b.u.taraf === 0 ? G.RIM.biz : G.RIM.rakip, b.u.taraf === 0 ? G.RIM_GUC.biz : G.RIM_GUC.rakip);
    if (olu) { if (b.olumT < 0) b.olumT = gorselT - 5; b.govde.visible = false; b.kok.visible = false; for (const hl of b.halkalar) hl.visible = false; continue; }
    if (b.olumT >= 0) { b.olumT = -1; b.kok.visible = true; b.leke.visible = true; for (const hl of b.halkalar) hl.visible = true; }
    b.govde.visible = true; b.govde.position.set(0, 0, 0);
    his.donma(b, 0);   // his durumunu yeniden kaydet (gövde yere oturur)
    b.durum = ''; b.tekBitis = 0;
    if (b.isk) oyna(b, b.isk.beklemeAd, { dongu: true, gecis: 0.15 });
    if ((b.u.b.s || 1) >= 3) vfx.durum(b.kok, 'yildiz3', true);
  }
  kam.ilk = true;
  return true;
}
/** Hafif ekran sarsıntısı (arayüz anları: sonuç bandında kılıç çarpışması). guc 0..1, sure sn */
export function sarsinti(guc = 0.2, sure = 0.25) { his.sarsinti(guc, sure); }

// ── MAÇIN YILDIZI yakın planı, "Selam" (yalnız görüntü; REFERANS_ANIMASYON.md Öneri A, ANIMASYON_PLANI.md "Bitiş ekranları") ──
// 0–1,2 sn: kadraj kamerasından kahramana ease-in-out dolly, hafif alçak açı; sonra yavaş itme (+%7) ve 4° yörünge, kamera nefesi.
// Kahramanın arkasında: sahne düzlemi (mvp_arka.webp, koyu mor boşluk + üstten altın spot; derinlik sınamalı, önündeki zemin örter)
// ve ince, az doygun altın ışık huzmesi. Kahramana sıcak kenar ışığı (uRimRenk/uRimGuc). İmza hareketi kamera gelirken (0,8 sn) bir kez.
let mvpIsin = null;
const _mvP = new THREE.Vector3(), _mvH = new THREE.Vector3(), _mvS = new THREE.Vector3(), _mvC = new THREE.Color(), _mvD = new THREE.Vector3();
const yumusakAdim = (e) => e * e * (3 - 2 * e);
const kubikGirCik = (e) => (e < 0.5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2);
const MVP_ALTIN = '#d9b46a', _mvRim = new THREE.Color('#ffc98a');
function mvpIsinKur() {
  // huzme: kahramanın biraz arkasında kameraya dönük dikey düzlem; yatayda yumuşak (Gauss) düşüş, yukarıdan aşağı söner.
  const m = new THREE.ShaderMaterial({
    uniforms: { uRenk: { value: new THREE.Color(MVP_ALTIN) }, uGuc: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 uRenk; uniform float uGuc; varying vec2 vUv; void main(){ float x = vUv.x - 0.5 + (vUv.y - 0.5) * 0.12; float yan = exp(-x * x * 26.0); float boy = smoothstep(0.0, 0.25, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y) * 0.6); gl_FragColor = vec4(uRenk, min(1.0, yan * boy * uGuc)); }',
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false });
  const ag = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 7), m); ag.position.y = 3.5;
  const grup = new THREE.Group(); grup.add(ag); grup.visible = false; ag.renderOrder = 5; sahne.add(grup);
  // arka plan düzlemi: ekrana paralel, kahramanın arkasında; görselin üst %62'si (kemerler, spot) kırpılır, alt kenar sahneye karışır
  const doku = new THREE.TextureLoader().load(kokYol + 'arayuz/menu/mvp_arka.webp'); doku.colorSpace = THREE.SRGBColorSpace;
  const am = new THREE.ShaderMaterial({
    uniforms: { map: { value: doku }, uOp: { value: 0 }, uSu: { value: 1 }, uKay: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform sampler2D map; uniform float uOp, uSu, uKay; varying vec2 vUv; void main(){ vec2 u = vec2(clamp(0.5 + (vUv.x - 0.5 - uKay) * uSu, 0.0, 1.0), 0.38 + vUv.y * 0.62); vec4 c = texture2D(map, u); float a = uOp * smoothstep(0.02, 0.3, vUv.y); gl_FragColor = vec4(c.rgb * 0.92, a);\n#include <colorspace_fragment>\n}',
    transparent: true, depthWrite: false, toneMapped: false, fog: false });
  const arka = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), am); arka.visible = false; arka.renderOrder = -1; arka.frustumCulled = false; sahne.add(arka);
  return { grup, ag, arka };
}
function mvpSifirla() {
  const m = kam.mvp; kam.mvp = null;
  if (mvpIsin) { mvpIsin.grup.visible = false; mvpIsin.arka.visible = false; }
  if (m) { const gr = m.b.model.userData.gorunum; if (gr) gr.kenar(G.RIM.biz, G.RIM_GUC.biz); if (m.gizli) for (const o of m.gizli) o.kok.visible = true; }
}
/** uid: oyuncunun kahramanı. anlik: geçiş yok (Animasyonları azalt). Dönen: yakın plan kurulduysa true.
    renk parametresi geriye uyum için durur; ışık tek, az doygun altın (REFERANS_ANIMASYON: doygun element rengi yok). */
export function mvpGoster(uid, renk = MVP_ALTIN, { anlik = false } = {}) {
  const b = birimler.get(uid); if (!b || !sim || b.olumT >= 0 || !b.kok.visible) return false;
  if (!mvpIsin) mvpIsin = mvpIsinKur();
  b.zaferMi = true;   // kameraya döner; imza hareketi kamera gelirken (mvpKarisim)
  vfx.durumTemizle(b.kok);   // savaş bitti: başın üstündeki durum simgeleri (zehir vb.) yakın planda kalmasın
  mvpIsin.grup.position.set(b.kok.position.x, ARENA_Y, b.kok.position.z); mvpIsin.grup.visible = true;
  const boy = b.kok.userData.vfxBoy || 1; mvpIsin.grup.scale.set(0.8 + 0.4 * boy, 1, 0.8 + 0.4 * boy);
  mvpIsin.arka.visible = G.kademeAl() < 7;   // en düşük iki kademede arka plan düzlemi yok
  kam.mvp = { b, t: anlik ? 9 : 0, e: anlik ? 1 : 0, yon: 1, sure: 1.2, boy, aci: mvpAciSec(b, boy), imza: false };
  return true;
}
/** Yakın plandan kadraja dönüş (anlik: hemen) */
export function mvpBitir(anlik = false) { if (!kam.mvp) return; if (anlik) mvpSifirla(); else { kam.mvp.yon = -1; kam.mvp.sure = 0.6; } }
// telefon yatay (en/boy > 1,9): üstteki skor şeridi kadrajın ~%25'ini kaplar; biraz geri çekilir, bakış yükselir (kahraman aşağı iner, başı kesilmez)
const mvpUzak = (boy) => (kamera.aspect < 1.45 ? 4.0 : kamera.aspect > 1.9 ? 3.9 : 3.5) * (0.55 + 0.45 * boy);
// kamera açısı: önden (merkeze doğru hafif yan) başlayıp ±0,4 / ±0,8 / ±1,1 rad denenir. Her aday açı için yakın plan kadrajı
// (mvpKarisim'deki kamera konumu + sola kaydırılmış bakış noktası) kurulur ve diğer sağ birimler ekran düzleminde değerlendirilir:
// kahramanın ekrandaki bölgesine binen ya da kahramandan kameraya yakın durup kadrajın sağ (görünen, kartsız) kısmını dolduran
// birim, ekranda kapladığı genişlikle orantılı ceza alır; kahramanın arkasındakiler yalnız kahramanın üstüne binerse az ceza alır.
// En az cezalı ve öne en yakın açı seçilir (kurulumda bir kez; konumlar savaş bitince sabit)
const mvpKay = (uzak) => uzak * (kamera.aspect < 1.45 ? 0.13 : 0.17);
function mvpAciSec(b, boy, kayit = null) {
  const p = b.kok.position, taban = Math.max(-0.45, Math.min(0.45, -p.x * 0.12)), uzak = mvpUzak(boy), kay = mvpKay(uzak);
  const tanH = Math.tan(THREE.MathUtils.degToRad(kamera.fov) / 2) * kamera.aspect, kR = (b.yaricap || 0.45) * 1.25;
  let en = taban, enC = Infinity;
  for (const d of [0, 0.4, -0.4, 0.8, -0.8, 1.1, -1.1]) {
    const a = Math.max(-1.1, Math.min(1.1, taban + d)), sa = Math.sin(a), ca = Math.cos(a);
    const cx = p.x + sa * uzak, cz = p.z + ca * uzak;                       // kamera
    let fx = (p.x - ca * kay) - cx, fz = (p.z + sa * kay) - cz; const fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl;   // bakış yönü
    const rx = -fz, rz = fx;                                                  // ekranın sağı
    const hd = (p.x - cx) * fx + (p.z - cz) * fz, hs = ((p.x - cx) * rx + (p.z - cz) * rz) / hd, hr = kR / hd;   // kahraman: derinlik, ekran x (tan), yarı genişlik
    let c = Math.abs(d) * 0.05;
    for (const o of birimDizi) {
      if (o === b || o.olumT >= 0 || !o.kok.visible) continue;
      const ox = o.kok.position.x - cx, oz = o.kok.position.z - cz, od = ox * fx + oz * fz, ol = ox * rx + oz * rz, or = (o.yaricap || 0.45) * 1.15;
      if (od < 0.15) { if (od > -or && Math.abs(ol) < or + 0.25) c += 4; continue; }   // kameranın içinde / hemen yanında
      const os = ol / od, w = or / od;                                        // ekran x ve yarı genişlik (tan birimi)
      if (os - w > tanH || os + w < -tanH) continue;                          // kadraj dışında
      const ust = Math.max(0, Math.min(os + w, hs + hr) - Math.max(os - w, hs - hr)) / (2 * hr);   // kahramanın üstüne binme oranı
      if (od < hd + 0.3) {
        // önde: kahramana binerse ağır ceza; kadrajın sağ yarısında (kart solda) büyük görünüyorsa da ceza
        const sag = Math.max(0, Math.min(os + w, tanH) - Math.max(os - w, -tanH * 0.1)) / tanH;
        c += ust * 3 + sag * (w / hr) * 1.8;
      } else c += ust * 0.5;
    }
    if (kayit) kayit.push([+a.toFixed(2), +c.toFixed(3)]);
    if (c < enC - 1e-6) { enC = c; en = a; }
  }
  return en;
}
// test: MVP yakın planını t saniyesinde dondurur (kare dizisi çekmek için; null çözer)
export function _mvpZaman(t) { const m = kam.mvp; if (!m) return null; if (t == null) { m.don = false; return m.t; } m.don = true; m.t = t; return m.t; }
// hata ayıklama: MVP açı adaylarının cezaları
export function _mvpAci(uid) { const b = birimler.get(uid); if (!b) return null; const k = []; const a = mvpAciSec(b, b.kok.userData.vfxBoy || 1, k); return { secilen: +a.toFixed(2), adaylar: k, birimler: birimDizi.filter(o => o.olumT < 0 && o.kok.visible).map(o => [o.uid, o.u.taraf, +o.kok.position.x.toFixed(2), +o.kok.position.z.toFixed(2), +(o.yaricap || 0).toFixed(2)]) }; }
// kadraj(): bakış noktası (h) ve kamera konumu yakın plana karıştırılır
function mvpKarisim(dtR, h) {
  const m = kam.mvp; m.e = Math.max(0, Math.min(1, m.e + m.yon * dtR / m.sure));
  if (m.e <= 0 && m.yon < 0) { mvpSifirla(); return h; }
  if (m.yon > 0 && !m.don) m.t += dtR;
  if (m.don) m.e = Math.min(1, m.t / m.sure);
  const b = m.b, p = b.kok.position, boy = m.boy;
  // imza hareketi: kamera varmadan hemen önce, bir kez (iki ayaklı: zafer klibi 'Yes'; dört ayaklı / yılan: kodlu sakin baş kaldırma). Zıplama yok.
  if (!m.imza && m.t >= 0.8) { m.imza = true; zaferBasla(b, 0.3, false); }
  // yavaş itme + küçük yörünge (varıştan sonra 2,5 sn'de yumuşakça) ve kamera nefesi (0,2–0,3 Hz, birkaç cm)
  const it = yumusakAdim(Math.min(1, Math.max(0, (m.t - 1.0) / 2.5))), zs = performance.now() / 1000;
  const aci = m.aci + it * 0.07, uzak = mvpUzak(boy) * (1 - 0.07 * it);
  const nx = Math.sin(zs * 1.4) * 0.015 + Math.sin(zs * 2.3 + 1) * 0.008, ny = Math.sin(zs * 1.1 + 2) * 0.012;
  // alçak açı: kamera kahramanın göğüs hizasında, bakış biraz yukarıda (kahraman kadrajda heybetli durur)
  _mvP.set(p.x + Math.sin(aci) * uzak + nx, ARENA_Y + 0.3 + 0.55 * boy + ny, p.z + Math.cos(aci) * uzak);
  // kahraman sağ üçte birde (yazı solda): bakış noktası kameranın sol yönüne kayar
  const kay = mvpKay(uzak);
  _mvH.set(p.x - Math.cos(aci) * kay, ARENA_Y + (kamera.aspect > 1.9 ? 0.72 : 0.6) * boy, p.z + Math.sin(aci) * kay);
  const k = m.yon > 0 ? kubikGirCik(m.e) : yumusakAdim(m.e);
  // kameraya kahramandan yakın duran (önde kalan) birimler yakın planda gizlenir: kahramanı ve soldaki yazıyı örtmesinler; dönüşte geri gelir
  if (!m.gizli && k > 0.35) {
    m.gizli = []; _mvD.copy(_mvH).sub(_mvP).setY(0).normalize(); const hd = (p.x - _mvP.x) * _mvD.x + (p.z - _mvP.z) * _mvD.z;
    for (const o of birimDizi) if (o !== b && o.kok.visible && ((o.kok.position.x - _mvP.x) * _mvD.x + (o.kok.position.z - _mvP.z) * _mvD.z) < hd - 0.25) { o.kok.visible = false; m.gizli.push(o); }
  }
  if (m.gizli && m.yon < 0 && k < 0.35) { for (const o of m.gizli) o.kok.visible = true; m.gizli = null; }
  kamera.position.lerp(_mvP, k);
  _mvS.copy(h).lerp(_mvH, k);
  // sıcak kenar ışığı (rim) ve arkadaki altın huzme kamera ile birlikte açılır
  const gr = b.model.userData.gorunum; if (gr) { _mvC.copy(G.RIM.biz).lerp(_mvRim, k); gr.kenar(_mvC, G.RIM_GUC.biz + 0.75 * k); }
  if (mvpIsin) { mvpIsin.ag.material.uniforms.uGuc.value = 0.55 * k * (0.92 + 0.08 * Math.sin(zs * 1.3)); mvpIsin.grup.position.set(p.x, ARENA_Y, p.z);
    const yon = Math.atan2(kamera.position.x - p.x, kamera.position.z - p.z); mvpIsin.ag.rotation.y = yon; mvpIsin.ag.position.x = -Math.sin(yon) * 0.6; mvpIsin.ag.position.z = -Math.cos(yon) * 0.6; }
  return _mvS;
}
// arka plan düzlemi: kamera son hâlini aldıktan sonra (kadraj sonu) ekrana paralel, kahramanın 4 birim arkasına yerleşir; kadrajı biraz taşar
function mvpArkaGuncelle() {
  const m = kam.mvp; if (!m || !mvpIsin || !mvpIsin.arka.visible) return;
  const a = mvpIsin.arka, p = m.b.kok.position, k = m.yon > 0 ? kubikGirCik(m.e) : yumusakAdim(m.e);
  kamera.getWorldDirection(_mvD);
  const d = Math.max(3, _mvD.x * (p.x - kamera.position.x) + _mvD.y * (ARENA_Y + 0.6 * m.boy - kamera.position.y) + _mvD.z * (p.z - kamera.position.z)) + 4.0;
  const yuk = 2 * d * Math.tan(THREE.MathUtils.degToRad(kamera.fov) / 2) * 1.12, gen = yuk * kamera.aspect;
  a.position.copy(kamera.position).addScaledVector(_mvD, d); a.quaternion.copy(kamera.quaternion); a.scale.set(gen, yuk, 1);
  const u = a.material.uniforms; u.uOp.value = 0.96 * yumusakAdim(Math.max(0, (k - 0.55) / 0.45));   // kamera yaklaşınca belirir (uzaktan yarı saydam perde görünmesin)
  u.uSu.value = Math.min(1, (gen / yuk) / (1672 / (941 * 0.62)));   // kırpılan bölgenin en/boyu ≈ 2,87: geniş ekranda tam, dar ekranda ortası
  _mvS.copy(p).setY(ARENA_Y + 0.5 * m.boy).project(kamera); u.uKay.value = _mvS.x * 0.5 / 1.12 * 0.8;   // altın spot kahramanın arkasına kayar
}
export function temizle() { mvpSifirla(); sim = null; for (const b of birimler.values()) vfx.durumTemizle(b.kok); }
// hata ayıklama / ölçüm
export function _ual() { return ual; }
// hata ayıklama: kamerayı yerleştir
// ── Serbest kamera: tekerlek / iki parmak sıkıştırma ile imlecin-parmakların olduğu noktaya yakınlaşma, iki parmakla (masaüstünde sağ ya da
// orta tuşla) kaydırma, çift tık/dokunuşla eski kadraja dönüş. Tek parmak birim sürüklemeye kalır. ──
const ZOOM_MIN = 0.32, ZOOM_MAX = 1.6, KAY_MAX = 7.5;
const _kSph = new THREE.Spherical();
// ekran sürüklemesini (px) dünyada kaydırmaya çevir: kamera döndükçe kaydırma yönü de döner
function kaydir(dx, dy, o) { const c = Math.cos(kam.yaw), sn = Math.sin(kam.yaw), x = -dx * o, z = -dy * o * 1.4; kam.kayHX += x * c + z * sn; kam.kayHZ += -x * sn + z * c; zoomSinirla(); }
const _zRay = new THREE.Raycaster(), _zV2 = new THREE.Vector2(), _zDuz = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), _zP = new THREE.Vector3();
function zoomSinirla() {
  kam.zoomH = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, kam.zoomH));
  kam.kayHX = Math.min(KAY_MAX, Math.max(-KAY_MAX, kam.kayHX)); kam.kayHZ = Math.min(KAY_MAX, Math.max(-KAY_MAX, kam.kayHZ));
}
function zeminNoktasi(cx, cy) {   // ekran noktasının altındaki zemin noktası (dünya)
  if (!renderer) return null; const r = renderer.domElement.getBoundingClientRect();
  _zV2.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); _zRay.setFromCamera(_zV2, kamera);
  return _zRay.ray.intersectPlane(_zDuz, _zP) ? _zP.clone() : null;
}
// yakınlaşma oranı z0 → z1 iken P noktası ekranda yerinde kalsın: bakış noktası P'ye (1 − z1/z0) oranında yaklaşır
function noktayaZoom(P, z0, z1) { if (!P || !kam.bak) return; const f = 1 - z1 / z0; kam.kayHX += (P.x - kam.bak.x) * f; kam.kayHZ += (P.z - kam.bak.z) * f; }
export function zoomSifirla() { kam.zoomH = 1; kam.kayHX = kam.kayHZ = 0; kam.yawH = 0; kam.egimH = 0; }
function olcekPx() { const h = (renderer && renderer.domElement.clientHeight) || 800; return 2 * kamera.position.distanceTo(kam.bak || _zP) * Math.tan(THREE.MathUtils.degToRad(kamera.fov) / 2) / h; }
let _zoomKuruldu = false;
function zoomKur() {
  if (_zoomKuruldu || typeof window === 'undefined') return; _zoomKuruldu = true;
  const arayuzde = (e) => e.target && e.target.closest && e.target.closest('.panel,.pencere,dialog,[data-kaydir],.kaydir');
  window.addEventListener('wheel', (e) => { if (arayuzde(e)) return; const z0 = kam.zoomH;
    kam.zoomH *= Math.exp(e.deltaY * 0.0007); zoomSinirla(); noktayaZoom(zeminNoktasi(e.clientX, e.clientY), z0, kam.zoomH); zoomSinirla(); }, { passive: true });
  // masaüstü: sağ/orta tuşla sürükleyerek kaydır
  let fare = null;
  window.addEventListener('contextmenu', (e) => { if (e.target === renderer?.domElement) e.preventDefault(); });
  // tuvalde tek parmak / sol tuş: yörünge (360° dönüş + eğim); sağ/orta tuş: kaydırma
  let yor = null;
  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && (e.button === 1 || e.button === 2)) { fare = { x: e.clientX, y: e.clientY }; return; }
    if (renderer && e.target === renderer.domElement && e.isPrimary && !iki && !hzr.acik) yor = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener('pointermove', (e) => {
    if (fare) { kaydir(e.clientX - fare.x, e.clientY - fare.y, olcekPx()); fare.x = e.clientX; fare.y = e.clientY; return; }
    if (yor && e.isPrimary && !iki) { kam.yawH -= (e.clientX - yor.x) * 0.006; kam.egimH = Math.min(0.9, Math.max(-0.75, kam.egimH - (e.clientY - yor.y) * 0.004)); yor.x = e.clientX; yor.y = e.clientY; }
  });
  window.addEventListener('pointerup', () => { fare = null; yor = null; }); window.addEventListener('pointercancel', () => { fare = null; yor = null; });
  // dokunmatik: iki parmak sıkıştır (parmakların ortasına doğru) + kaydır
  let iki = null;
  const ort = (t) => ({ x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2, d: Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY) });
  window.addEventListener('touchstart', (e) => { if (e.touches.length === 2) { yor = null; const o = ort(e.touches); iki = { ...o, z: kam.zoomH, sx: o.x, sy: o.y }; } }, { passive: true });
  window.addEventListener('touchmove', (e) => { if (!iki || e.touches.length !== 2) return; const o = ort(e.touches);
    const zYeni = iki.z * iki.d / Math.max(20, o.d), z0 = kam.zoomH; kam.zoomH = zYeni; zoomSinirla();
    noktayaZoom(zeminNoktasi(o.x, o.y), z0, kam.zoomH);
    kaydir(o.x - iki.sx, o.y - iki.sy, olcekPx()); iki.sx = o.x; iki.sy = o.y; zoomSinirla(); }, { passive: true });
  window.addEventListener('touchend', (e) => { if (e.touches.length < 2) iki = null; }, { passive: true });
  window.addEventListener('dblclick', (e) => { if (!arayuzde(e)) zoomSifirla(); });
}
export function kameraYerlestir(y, z) { kam.serbest = true; kamera.position.set(0, y, z); kamera.lookAt(0, 0, 0); kamera.fov = 50; kamera.updateProjectionMatrix(); }
// hata ayıklama: yakın kamera
export function yakinKamera(uid, uzak = 2.4, aci = 0.5, y = 1.4, bakY = 0.6) { const b = birimler.get(uid); if (!b) return; kam.serbest = true; const p = b.kok.position; kamera.position.set(p.x + Math.sin(aci) * uzak, y, p.z + Math.cos(aci) * uzak); kamera.lookAt(p.x, bakY, p.z); }
// hata ayıklama: iki ayaklıyı bir klibin belirli anında dondur (klip ve darbe karesi denetimi) ve birim listesi
export function _birimler() { return [...birimler.values()].map(b => ({ uid: b.uid, h: b.u.b.h, tur: b.gor.tur, taraf: b.u.taraf, rot: b.kok.rotation.y, x: +b.kok.position.x.toFixed(2), z: +b.kok.position.z.toFixed(2), kay: !!b.kay, tp: b.dort && b.dort.yet ? +b.dort.yet.tp.toFixed(3) : null })); }
export function _poz(uid, ad, t, yalniz = false) {
  const b = birimler.get(uid); if (!b || !b.isk || !b.isk.eylem[ad]) return false;
  if (yalniz) for (const o of birimler.values()) { o.kok.visible = o === b; if (o === b) vfx.durumTemizle(o.kok); }
  const i = b.isk; i.mix.stopAllAction(); b.zk = null; b.zkSira = []; b.dizi = [];
  const e = i.eylem[ad]; e.reset(); e.setLoop(THREE.LoopOnce, 1); e.clampWhenFinished = true; e.timeScale = 0; e.setEffectiveWeight(1); e.play(); e.time = Math.min(t, ual.klip[ad].duration);
  i.aktif = e; i.aktifAd = ad; i.mix.update(0); aktar(b); return true;
}
export function _ciz() { G.ciz(); }
// test: iki ayaklı birimin tek karesi savaş akışı dışında (karışıcı + aktarım + hareket.js katmanı); ops ikiAyakliGuncelle seçenekleri
export function _ikiKare(uid, dt, ops = {}) { const b = birimler.get(uid); if (!b || !b.isk) return false; b.isk.mix.update(dt); aktar(b); ikiAyakliGuncelle(b.ik, dt, { ...OPS_IKI, ...ops }); return true; }
export function _yazilar() { return yazilar.map(y => ({ m: y.metin, onc: y.onc, tur: y.tur, yas: +y.yas.toFixed(2), bir: y.bir })); }
export function _yet(uid) { const b = birimler.get(uid); const y = b && b.ik && b.ik.yet; return { g: +gorselT.toFixed(3), yt: y ? +y.t.toFixed(3) : null, an: y ? +y.an.toFixed(3) : null, olc: y ? +y.olc.toFixed(2) : null, durum: b && b.durum, klip: b && b.isk && b.isk.aktifAd }; }
// hata ayıklama: vuruş kurulması (durum, klip, önden kurulma, dört ayaklı anahtar kare saati)
export function _sal(uid) { const b = birimler.get(uid); if (!b) return null; const z = b.zk, s = b.dort && b.dort.sal;
  return { g: +gorselT.toFixed(2), durum: b.durum, klip: z ? z.ad : null, on: !!(z && z.on) || !!(s && s.on), onk: b.onk.var, kt: b.isk && b.isk.aktif ? +b.isk.aktif.time.toFixed(2) : s ? +s.t.toFixed(3) : null }; }
export function _balonlar() { return { acik: bantlar.map(b => b.metin), sira: balonSira.map(b => b.metin) }; }
export function _bTMP(uid) { return birimler.get(uid); }

// ══ HAZIRLIK (planlama) SAHNESİ ══
// Savaşla aynı arena ve kamera: oyuncunun kahramanları kendi hücrelerinde boşta durur, yedek tahtanın oyuncuya yakın kenarındaki sırada
// küçük ölçekte bekler. Motor yok (sim = null): konum, sürükleme ve boşta animasyonu burada sürülür. Oyun kuralı yok: arayuz.js oyun.js
// işlemlerini çağırır, burası yalnız görüntü ve ekran → hücre/kahraman eşlemesi.
const YEDEK_Z = 4.22, YEDEK_ARA = 0.68, YEDEK_OLCEK = 0.62, SUR_YUK = 0.55;
const hzr = { acik: false, grup: null, zemin: null, birimG: null, karo: [], yKaro: [], sira: null, karart: null, secHalka: null, birim: new Map(), bekleyen: new Map(),
  istek: new Map(), uid: 5000, sur: null, surP: new THREE.Vector3(), yedekN: 7, vurgu: { hedef: null, gecerli: true, acik: false, secili: null, kaynas: null }, sol: 0, gecis: null, kok: '' };
// motor hücresi → dünya: tahta i (sıra*4 + sütun; sıra 0 ön), yedek i
function hzrHucreP(yer, i, out = new THREE.Vector3()) {
  if (yer === 'tahta') return out.set(0.75 + (i % 4) * 1.5 - 3, ARENA_Y, 5 + Math.floor(i / 4) - 4);
  return out.set((i - (hzr.yedekN - 1) / 2) * YEDEK_ARA, ARENA_Y, YEDEK_Z);
}
function karoDoku() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const yol = (p, r) => { x.beginPath(); x.moveTo(p + r, p); x.arcTo(128 - p, p, 128 - p, 128 - p, r); x.arcTo(128 - p, 128 - p, p, 128 - p, r); x.arcTo(p, 128 - p, p, p, r); x.arcTo(p, p, 128 - p, p, r); x.closePath(); };
  const g = x.createRadialGradient(64, 64, 10, 64, 64, 90); g.addColorStop(0, 'rgba(255,255,255,0.05)'); g.addColorStop(1, 'rgba(255,255,255,0.22)');
  yol(6, 18); x.fillStyle = g; x.fill(); x.lineWidth = 5; x.strokeStyle = 'rgba(255,255,255,0.95)'; x.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function hzrSahneKur() {
  if (hzr.grup) return;
  hzr.grup = new THREE.Group(); hzr.zemin = new THREE.Group(); hzr.birimG = new THREE.Group(); hzr.grup.add(hzr.zemin, hzr.birimG); sahne.add(hzr.grup);
  const doku = karoDoku();
  const karoMat = () => new THREE.MeshBasicMaterial({ map: doku, color: '#d9ccff', transparent: true, opacity: 0.3, depthWrite: false, toneMapped: false });
  const gT = new THREE.PlaneGeometry(1.38, 0.9).rotateX(-Math.PI / 2), gY = new THREE.PlaneGeometry(0.7, 0.7).rotateX(-Math.PI / 2);
  for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(gT, karoMat()); hzrHucreP('tahta', i, m.position); m.position.y = 0.026; m.renderOrder = -2; hzr.zemin.add(m); hzr.karo.push(m); }
  for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(gY, karoMat()); m.position.y = 0.046; m.renderOrder = -2; hzr.zemin.add(m); hzr.yKaro.push(m); }
  // yedek sırası: koyu taş şerit (tahta çerçevesinin önünde)
  hzr.sira = new THREE.Mesh(new THREE.BoxGeometry(1, 0.04, 0.86), new THREE.MeshStandardMaterial({ color: '#2b2140', roughness: 0.9, transparent: true, opacity: 0.88 }));
  hzr.sira.position.set(0, 0.02, YEDEK_Z); hzr.sira.receiveShadow = true; hzr.zemin.add(hzr.sira);
  // rakip yarısı boş ve hafif karartılmış
  hzr.karart = new THREE.Mesh(new THREE.PlaneGeometry(6.1, 4.05).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#0a0614', transparent: true, opacity: 0.5, depthWrite: false }));
  hzr.karart.position.set(0, 0.024, -2.02); hzr.karart.renderOrder = -1; hzr.zemin.add(hzr.karart);
  // seçili kahramanın altında parlayan halka
  hzr.secHalka = new THREE.Mesh(new THREE.RingGeometry(0.46, 0.56, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffe48a', transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false }));
  hzr.secHalka.position.y = 0.05; hzr.secHalka.visible = false; hzr.zemin.add(hzr.secHalka);
}
function hzrYedekDiz() {
  const n = hzr.yedekN; hzr.yKaro.forEach((m, i) => { m.visible = i < n; if (i < n) { hzrHucreP('yedek', i, m.position); m.position.y = 0.046; } });
  hzr.sira.scale.x = n * YEDEK_ARA + 0.16;
}
function birimSok(b) {
  if (!b) return; vfx.durumTemizle(b.kok); if (b.kok.parent) b.kok.parent.remove(b.kok); if (b.isk) sahne.remove(b.isk.kaynak);
}
// savaş birimlerini (savaş sonu ya da karşılama vitrini) sahneden kaldır
function savasBirimKaldir() {
  for (const b of birimler.values()) birimSok(b);
  for (const e of efektler) if (!e.kalici) sahne.remove(e.o);
  efektler = efektler.filter(e => e.kalici); kuyruk = []; yazilar = []; bantlar.length = 0; balonSira.length = 0; kutKart = null;
  birimler = new Map(); birimDizi = []; sim = null; mvpSifirla();
}
/** Hazırlığı aç: savaş/vitrin birimleri kalkar, hücreler ve yedek sırası görünür, kamera hazırlık kadrajına geçer. */
export function hazirlikAc({ yedekN = 7, kok = '' } = {}) {
  if (!renderer) return false;
  hzrSahneKur(); savasBirimKaldir(); his.sifirla();
  hzr.kok = kok; hzr.yedekN = yedekN; hzrYedekDiz();
  hzr.acik = true; hzr.sol = 1; hzr.grup.visible = true; hzr.birimG.visible = true; hzr.zemin.visible = true; hzr.sur = null;
  for (const b of hzr.birim.values()) { b.kok.position.copy(b.hedefP); b.dogT = 1; hzrHisKaydet(b); }
  kam.gecis = null; zoomSifirla(); boyutla(); uyarlaSifirla(600); saat.getDelta();
  return true;
}
// savaşa geçerken his.sifirla birim listesini boşaltır; hazırlığa dönünce yeniden kaydet (malzeme yaması korunur)
function hzrHisKaydet(b) { try { his.hazirla(b); } catch (e) { /* isteğe bağlı */ } }
/** Hazırlıktan çık. gecis: savaşa geçiş (kamera mevcut duruştan yumuşakça savaş kadrajına kayar, hücreler söner). */
export function hazirlikKapat({ gecis = false } = {}) {
  if (!hzr.grup) return;
  hzr.acik = false; hzr.sur = null; hzr.secHalka.visible = false;
  hzr.solZ = 0;
  if (gecis && kamera) { kam.gecis = { p: kamera.position.clone(), h: (kam.bak || new THREE.Vector3()).clone(), t: 0, sure: 0.9 }; }
  else { hzr.grup.visible = false; hzr.sol = 0; }
}
const imza = (b) => `${b.h}|${b.s || 1}|${b.f || ''}|${b.f2 || ''}`;
/** Kahraman listesini sahneyle eşle. liste: [{ ref (oyun nesnesi), b: {h,s,f,f2}, yer: 'tahta'|'yedek', i }]. Aynı ref yerinde kayar; yeni ref kurulur. */
export function hazirlikEsitle(liste) {
  if (!hzr.grup) return Promise.resolve();
  const isimler = new Set(); hzr.istek = new Map();
  const isler = [];
  for (const o of liste) {
    if (!o || !o.ref || !o.b) continue; const im = imza(o.b); hzr.istek.set(o.ref, { ...o, im }); isimler.add(o.ref);
    const b = hzr.birim.get(o.ref);
    if (b && b.imza === im) { b.yer = o.yer; b.i = o.i; hzrHucreP(o.yer, o.i, b.hedefP); continue; }
    if (hzr.bekleyen.has(o.ref) && hzr.bekleyen.get(o.ref).im === im) { isler.push(hzr.bekleyen.get(o.ref).p); continue; }
    const p = hzrBirimKur(o, im); hzr.bekleyen.set(o.ref, { im, p }); isler.push(p);
  }
  for (const [ref, b] of hzr.birim) if (!isimler.has(ref) || b.imza !== hzr.istek.get(ref).im) { birimSok(b); hzr.birim.delete(ref); }
  return Promise.all(isler);
}
async function hzrBirimKur(o, im) {
  const u = { uid: hzr.uid++, taraf: 0, b: { h: o.b.h, s: o.b.s || 1, ...(o.b.f ? { f: o.b.f } : {}), ...(o.b.f2 ? { f2: o.b.f2 } : {}) }, x: 0, y: 0, soy: [] };
  let b = null;
  try { b = await birimKur(u, hzr.kok); } catch (e) { console.warn('hazırlık birimi kurulamadı', o.b.h, e); }
  const bek = hzr.bekleyen.get(o.ref); if (bek && bek.im === im) hzr.bekleyen.delete(o.ref);
  if (!b) return;
  const ist = hzr.istek.get(o.ref);
  if (!ist || ist.im !== im || hzr.birim.has(o.ref)) { birimSok(b); return; }   // bu arada satıldı/birleşti
  b.imza = im; b.ref = o.ref; b.yer = ist.yer; b.i = ist.i; b.hedefP = hzrHucreP(ist.yer, ist.i); b.tabanOlcek = b.kok.scale.x; b.dogT = 0;
  b.olcekS = (ist.yer === 'yedek' ? YEDEK_OLCEK : 1); b.kok.position.copy(b.hedefP);
  b.kok.rotation.y = 0; b.hedefAci = 0; b.hzrYildiz = u.b.s;
  hzr.birimG.add(b.kok); hzr.birim.set(o.ref, b);
}
/** Vurgu: hedef hücre (sürüklerken), geçerli mi, bütün hücreler belirgin mi (seçim/sürükleme), seçili ve kaynaşma adayları (ref). */
export function hazirlikVurgu(v) { Object.assign(hzr.vurgu, v); }
/** Sürükleme: ref (null bırakır) ve imlecin ekran noktası (istemci px). */
export function hazirlikSurukle(ref, cx, cy) {
  hzr.sur = ref || null;
  if (ref && cx != null) { const p = zeminNoktasi(cx, cy); if (p) hzr.surP.copy(p); }
}
/** Ekran noktasının (istemci px) altındaki hücre: {yer, i} ya da null. */
export function hazirlikHucre(cx, cy) {
  const p = zeminNoktasi(cx, cy); if (!p) return null;
  if (p.z > 0.5 && p.z < 3.5 && Math.abs(p.x) < 3.02) return { yer: 'tahta', i: Math.floor(p.z - 0.5) * 4 + Math.max(0, Math.min(3, Math.floor((p.x + 3) / 1.5))) };
  const n = hzr.yedekN, yi = Math.round(p.x / YEDEK_ARA + (n - 1) / 2);
  if (p.z > YEDEK_Z - 0.62 && p.z < YEDEK_Z + 0.75 && yi >= 0 && yi < n && Math.abs(p.x - (yi - (n - 1) / 2) * YEDEK_ARA) < 0.5) return { yer: 'yedek', i: yi };
  return null;
}
const _hzE = { x: 0, y: 0, z: 0 }, _hzV = new THREE.Vector3();
/** Ekran noktasına (istemci px) en yakın kahraman: ref ya da null. Gövde boyunca (ayak–baş) isabet sayılır. */
export function hazirlikSec(cx, cy) {
  if (!renderer) return null; const r = renderer.domElement.getBoundingClientRect(), x = cx - r.left, y = cy - r.top;
  let en = null, m = Infinity;
  for (const [ref, b] of hzr.birim) {
    if (!b.kok.visible) continue; const s = b.kok.scale.x, boy = (b.kok.userData.vfxBoy || 1) / (b.tabanOlcek || 1) * s;
    const a = ekran(_hzV.copy(b.kok.position), _hzE), ax = a.x, ay = a.y;
    const u = ekran(_hzV.set(b.kok.position.x, b.kok.position.y + boy, b.kok.position.z), _hzE), ux = u.x, uy = u.y;
    const yan = ekran(_hzV.set(b.kok.position.x + 0.42 * s, b.kok.position.y, b.kok.position.z), _hzE), rr = Math.max(16, Math.abs(yan.x - ax));
    // ayak–baş doğru parçasına uzaklık
    const dx = ux - ax, dy = uy - ay, L2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L2));
    const d = Math.hypot(x - (ax + dx * t), y - (ay + dy * t));
    if (d < rr && d < m) { m = d; en = ref; }
  }
  return en;
}
/** Kahramanın ekran kutusu (istemci px): baş üstü ve ayak. */
export function hazirlikEkran(ref) {
  const b = hzr.birim.get(ref); if (!b || !renderer) return null; const r = renderer.domElement.getBoundingClientRect();
  const s = b.kok.scale.x, boy = (b.kok.userData.vfxBoy || 1) / (b.tabanOlcek || 1) * s;
  const a = ekran(_hzV.copy(b.kok.position), _hzE), ax = a.x + r.left, ay = a.y + r.top;
  const u = ekran(_hzV.set(b.kok.position.x, b.kok.position.y + boy, b.kok.position.z), _hzE);
  const yan = ekran(_hzV.set(b.kok.position.x + 0.5 * s, b.kok.position.y, b.kok.position.z), _hzE);
  return { x: ax, y: ay, ustY: u.y + r.top, yari: Math.abs(yan.x - a.x) };
}
/** Tahta + yedek sırasının ekran kutusu (istemci px; öğretici çerçevesi için). */
export function hazirlikAlan() {
  if (!renderer) return null; const r = renderer.domElement.getBoundingClientRect(); let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, z] of [[-3, 0.5], [3, 0.5], [-3, YEDEK_Z + 0.45], [3, YEDEK_Z + 0.45]]) { const e = ekran(_hzV.set(x, ARENA_Y, z), _hzE); x0 = Math.min(x0, e.x); x1 = Math.max(x1, e.x); y0 = Math.min(y0, e.y); y1 = Math.max(y1, e.y); }
  return { left: x0 + r.left, top: y0 + r.top, right: x1 + r.left, bottom: y1 + r.top };
}
const OPS_HZR_IKI = { hareket: false, hiz: 0, saldiri: null, yetenek: false, vurul: false, olum: false, zafer: false };
const OPS_HZR_DORT = { hiz: 0, saldiri: false, yetenek: false, vurul: false, olum: false, zafer: false };
const HZR_SABIT = { olu: false, hareket: false, saldiri: false, yetenek: false, vurul: false };
const _hzH = new THREE.Vector3();
function hzrGuncelle(dt) {
  const v = hzr.vurgu, t = performance.now() / 1000;
  _gorM.multiplyMatrices(kamera.projectionMatrix, kamera.matrixWorldInverse); _gorF.setFromProjectionMatrix(_gorM);
  let secB = null;
  for (const [ref, b] of hzr.birim) {
    const surulen = hzr.sur === ref;
    if (surulen) _hzH.set(hzr.surP.x, ARENA_Y + SUR_YUK, hzr.surP.z + 0.15); else _hzH.copy(b.hedefP);
    const k = 1 - Math.exp(-dt * (surulen ? 28 : 14)); b.kok.position.lerp(_hzH, k);
    const hedefS = surulen ? 0.9 : (b.yer === 'yedek' ? YEDEK_OLCEK : 1); b.olcekS += (hedefS - b.olcekS) * Math.min(1, dt * 12);
    b.dogT = Math.min(1, (b.dogT || 0) + dt / 0.28); const dog = 1 - Math.pow(1 - b.dogT, 3) * (1 - 0.3 * Math.sin(b.dogT * Math.PI));
    b.kok.scale.setScalar(b.tabanOlcek * b.olcekS * dog);
    // yüzü kameraya (oyuncuya) dönük; sürüklenirken hafif sallanır
    const aci = Math.atan2(kamera.position.x - b.kok.position.x, kamera.position.z - b.kok.position.z) * 0.85 + (surulen ? Math.sin(t * 9) * 0.12 : 0);
    b.kok.rotation.y += acıFark(aci, b.kok.rotation.y) * Math.min(1, dt * 8);
    const sec = v.secili === ref, aday = v.kaynas && v.kaynas.includes(ref);
    if (sec) secB = b;
    if (b.halkalar[0]) { b.halkalar[0].material.opacity = aday ? 0.55 + 0.4 * Math.sin(t * 6) : 0.5; }
    if (!ekranda(b)) continue;
    if (b.isk) {
      const i2 = b.isk; if (i2.aktifAd !== i2.beklemeAd) oyna(b, i2.beklemeAd, { dongu: true, gecis: 0.25 });
      i2.mix.update(dt); aktar(b); ikiAyakliGuncelle(b.ik, dt, OPS_HZR_IKI);
    } else if (b.dort) dortAyakliGuncelle(b.dort, dt, OPS_HZR_DORT);
    else if (b.yilan) yilanGuncelle(b.yilan, dt, OPS_HZR_DORT);
    if (b.gor.tur === 'sabit') sabitSalin(b, dt, HZR_SABIT);
  }
  // seçim halkası
  if (secB) { hzr.secHalka.visible = true; hzr.secHalka.position.x = secB.kok.position.x; hzr.secHalka.position.z = secB.kok.position.z; hzr.secHalka.scale.setScalar(secB.olcekS * (1 + 0.05 * Math.sin(t * 5))); }
  else hzr.secHalka.visible = false;
  // hücreler: soluk; seçim/sürüklemede belirgin; imlecin altındaki hedef parlak (geçersizse kırmızı)
  const taban = v.acik ? 0.42 : 0.24;
  const boya = (m, yer, i) => { const h = v.hedef && v.hedef.yer === yer && v.hedef.i === i;
    m.material.opacity = h ? 0.95 : taban; m.material.color.set(h ? (v.gecerli ? '#8dffc0' : '#ff7a8a') : '#d9ccff'); };
  hzr.karo.forEach((m, i) => boya(m, 'tahta', i)); for (let i = 0; i < hzr.yedekN; i++) boya(hzr.yKaro[i], 'yedek', i);
}
// savaşa geçişte hücreler, sıra ve karartma söner
function hzrSondur(dt) {
  if (hzr.acik || !hzr.grup || !hzr.grup.visible || hzr.sol <= 0) return;
  const simdi = performance.now(); if (!hzr.solZ) hzr.solZ = simdi;   // duvar saatiyle (yavaş karede de 0,45 sn)
  hzr.sol = Math.max(0, 1 - (simdi - hzr.solZ) / 450);
  for (const m of [...hzr.karo, ...hzr.yKaro]) m.material.opacity = Math.min(m.material.opacity, 0.24 * hzr.sol);
  hzr.karart.material.opacity = 0.5 * hzr.sol; hzr.sira.material.opacity = 0.88 * hzr.sol;
  if (hzr.sol <= 0) hzr.grup.visible = false;
}
// kaplama: kahramanların üstünde yıldızlar (savaştaki rozetle aynı renkler)
function hzrKaplama() {
  for (const b of hzr.birim.values()) {
    const s = b.hzrYildiz || 1; if (!b.kok.visible) continue;
    const boy = (b.kok.userData.vfxBoy || 1) / (b.tabanOlcek || 1) * b.kok.scale.x;
    const e = ekran(_hzV.set(b.kok.position.x, b.kok.position.y + boy + 0.12, b.kok.position.z), _hzE); if (e.z > 1) continue;
    const r = b.yer === 'yedek' && hzr.sur !== b.ref ? 5.5 : 7.5, ara = r * 2.1;
    for (let k = 0; k < s; k++) yildizCiz(e.x + (k - (s - 1) / 2) * ara, e.y - r, r, YILDIZ_RENK[s] || '#ffd24a');
  }
}
export function _hucreEkran(yer, i) { const r = renderer.domElement.getBoundingClientRect(), e = ekran(hzrHucreP(yer, i, _hzV), _hzE); return { x: e.x + r.left, y: e.y + r.top }; }
export function _hazirlik() { return { acik: hzr.acik, n: hzr.birim.size, bekleyen: hzr.bekleyen.size, birim: [...hzr.birim.values()].map(b => ({ h: b.u.b.h, yer: b.yer, i: b.i, x: +b.kok.position.x.toFixed(2), z: +b.kok.position.z.toFixed(2) })) }; }
