/* KUT ARENA — 3D savaş sahnesi (Three.js). Savaşın kendisi sim.js'te; bu dosya yalnız gösterir.
   Modeller: modeller/modeller.json içinde listelenen GLB'ler (Tripo çıktısı). Listede olmayan kahraman yer tutucu figürle çizilir.
   Animasyon adları esnek eşlenir: bekle/idle, yuru/walk/run, saldir/attack, yetenek/cast/skill, vurul/hit, olum/death/die. */
import * as THREE from 'three';
import { GLTFLoader } from './vendor/three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from './vendor/three/addons/utils/SkeletonUtils.js';

const D = window.KUT_DATA;
const ANIM_ESLE = {
  bekle: /idle|bekle|stand|breath/i, yuru: /walk|run|yuru|kos|move/i, saldir: /attack|atk|saldir|slash|punch|hit_?\d|strike/i,
  yetenek: /cast|skill|spell|yetenek|special|roar|power/i, vurul: /hurt|damage|vurul|react|get_?hit/i, olum: /death|die|dead|olum|fall/i,
};
const AYAK = 1.15; // bir kahramanın dünya birimindeki boyu (★ ile büyür)

let renderer, sahne, kamera, saat, isik;
let manifest = {}, sablon = {}; // id → {sahne, klipler}
const yukleyici = new GLTFLoader();
let figurler = new Map(); // uid → figür
let efektler = [];
let sim = null;

const dunya = (x, y) => new THREE.Vector3(x - 3, 0, y - 4); // sim (6×8) → dünya

function hazirla(tuval) {
  if (renderer) return true;
  try { renderer = new THREE.WebGLRenderer({ canvas: tuval, antialias: true, alpha: false, powerPreference: 'high-performance' }); }
  catch (e) { console.warn('WebGL yok, 2D çizime dönülüyor', e); return false; }
  renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  sahne = new THREE.Scene();
  sahne.background = new THREE.Color('#1b1530'); sahne.fog = new THREE.Fog('#1b1530', 14, 26);
  kamera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
  kamera.position.set(0, 9.2, 8.4); kamera.lookAt(0, 0, 0.6);
  saat = new THREE.Clock();
  sahne.add(new THREE.HemisphereLight('#c9c2ff', '#3a2a20', 1.1));
  isik = new THREE.DirectionalLight('#ffe2b8', 2.2); isik.position.set(4, 10, 5); isik.castShadow = true;
  isik.shadow.mapSize.set(1024, 1024); Object.assign(isik.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 });
  sahne.add(isik);
  zeminKur();
  return true;
}

// Zemin: yer tutucu (sanat gelince zemin modeli/dokusu ile değişir)
function zeminKur() {
  const z = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshStandardMaterial({ color: '#3a3150', roughness: 0.95 }));
  z.rotation.x = -Math.PI / 2; z.receiveShadow = true; sahne.add(z);
  const karo = new THREE.Group();
  for (let i = 0; i < 6; i++) for (let j = 0; j < 8; j++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.94, 0.94), new THREE.MeshStandardMaterial({ color: (i + j) % 2 ? '#4a3f66' : '#433a5c', roughness: 1 }));
    m.rotation.x = -Math.PI / 2; m.position.set(i - 2.5, 0.005, j - 3.5); m.receiveShadow = true; karo.add(m);
  }
  sahne.add(karo);
  const cizgi = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 0.06), new THREE.MeshBasicMaterial({ color: '#f2b53a', transparent: true, opacity: 0.55 }));
  cizgi.rotation.x = -Math.PI / 2; cizgi.position.y = 0.01; sahne.add(cizgi);
}

async function modelleriYukle() {
  try { const r = await fetch('modeller/modeller.json', { cache: 'no-cache' }); if (r.ok) manifest = await r.json(); } catch (e) { manifest = {}; }
  const isler = Object.entries(manifest).filter(([k]) => !k.startsWith('_')).map(async ([id, m]) => {
    try {
      const ana = await yukleyici.loadAsync('modeller/' + m.dosya);
      let klipler = [...ana.animations];
      for (const [, dosya] of Object.entries(m.anim || {})) {
        try { const a = await yukleyici.loadAsync('modeller/' + dosya); klipler.push(...a.animations.map(c => { c.name = c.name || dosya; return c; })); } catch (e) { console.warn('animasyon yüklenemedi', dosya); }
      }
      // ayrı dosyadan gelen klibin adı dosyadaki anahtar olsun (tepegoz@idle.glb → bekle)
      for (const [ad, dosya] of Object.entries(m.anim || {})) { const c = klipler.find(k => k.__dosya === dosya); if (c) c.name = ad; }
      const s = ana.scene; s.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } });
      const kutu = new THREE.Box3().setFromObject(s), boy = kutu.max.y - kutu.min.y || 1;
      sablon[id] = { sahne: s, klipler, olcek: (m.olcek || 1) * AYAK / boy, taban: kutu.min.y, yon: (m.yon || 0) * Math.PI / 180, animAd: m.anim || {} };
    } catch (e) { console.warn('model yüklenemedi', id, e); }
  });
  await Promise.all(isler);
}
const modelHazir = modelleriYukle();

// Yer tutucu figür: renkli kapsül + kafa + üstünde emoji levhası
function yerTutucu(h) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: h.renk, roughness: 0.6 });
  const govde = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.45, 4, 12), mat); govde.position.y = 0.5; govde.castShadow = true;
  const kafa = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), mat); kafa.position.y = 1.0; kafa.castShadow = true;
  g.add(govde, kafa);
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.font = '96px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(h.emoji, 64, 70);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  sp.scale.set(0.55, 0.55, 1); sp.position.y = 1.45; g.add(sp);
  g.userData.yerTutucu = true;
  return g;
}

function figurKur(u) {
  const h = D.kahraman(u.b.h), s = sablon[u.b.h];
  const kok = new THREE.Group();
  let model, karistir = null, eylemler = {};
  if (s) {
    model = SkeletonUtils.clone(s.sahne); model.scale.setScalar(s.olcek); model.position.y = -s.taban * s.olcek; model.rotation.y = s.yon;
    karistir = new THREE.AnimationMixer(model);
    for (const durum of Object.keys(ANIM_ESLE)) {
      const klip = s.klipler.find(c => c.name === durum) || s.klipler.find(c => ANIM_ESLE[durum].test(c.name));
      if (klip) { const e = karistir.clipAction(klip); if (durum === 'olum' || durum === 'saldir' || durum === 'yetenek' || durum === 'vurul') { e.setLoop(THREE.LoopOnce); e.clampWhenFinished = durum === 'olum'; } eylemler[durum] = e; }
    }
    if (!eylemler.bekle && s.klipler[0]) eylemler.bekle = karistir.clipAction(s.klipler[0]);
    eylemler.bekle && eylemler.bekle.play();
  } else model = yerTutucu(h);
  kok.add(model);
  const yildizOlcek = [1, 1, 1.12, 1.25][u.b.s || 1]; kok.scale.setScalar(yildizOlcek);
  // taraf halkası (mavi biz / kırmızı rakip) + kaynaşma halkası
  const halka = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.42, 32), new THREE.MeshBasicMaterial({ color: u.taraf === 0 ? '#5fc8ff' : '#ff5f5f', transparent: true, opacity: 0.8 }));
  halka.rotation.x = -Math.PI / 2; halka.position.y = 0.02; kok.add(halka);
  if (u.b.f) { const f = D.kahraman(u.b.f); const k2 = new THREE.Mesh(new THREE.RingGeometry(0.46, 0.52, 32), new THREE.MeshBasicMaterial({ color: f.renk, transparent: true, opacity: 0.9 })); k2.rotation.x = -Math.PI / 2; k2.position.y = 0.025; kok.add(k2); }
  const p = dunya(u.x, u.y); kok.position.copy(p);
  kok.rotation.y = u.taraf === 0 ? Math.PI : 0; // biz -Z'ye (rakibe) bakarız
  sahne.add(kok);
  return { kok, model, karistir, eylemler, aktif: 'bekle', tek: 0, hamle: 0, ziplama: 0, olum: 0, oncekiX: u.x, oncekiY: u.y };
}

function animOyna(f, durum, tek) {
  if (!f.karistir) { if (durum === 'saldir') f.hamle = 1; if (durum === 'yetenek') f.ziplama = 1; return; }
  const e = f.eylemler[durum]; if (!e) { if (durum === 'saldir') f.hamle = 1; if (durum === 'yetenek') f.ziplama = 1; return; }
  if (f.aktif === durum && !tek) return;
  const onceki = f.eylemler[f.aktif];
  e.reset(); e.fadeIn(0.12); e.play(); if (onceki && onceki !== e) onceki.fadeOut(0.12);
  f.aktif = durum; f.tek = tek ? e.getClip().duration : 0;
}

// ── Efektler ──
function mermi(k, h, renk) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: renk }));
  const a = dunya(k.x, k.y).setY(0.8), b = dunya(h.x, h.y).setY(0.7); m.position.copy(a); sahne.add(m);
  efektler.push({ o: m, sure: 0.18, yas: 0, guncelle: (t) => m.position.lerpVectors(a, b, t) });
}
function halkaEfekt(u, renk, r = 1.6) {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.18, 40), new THREE.MeshBasicMaterial({ color: renk, transparent: true, side: THREE.DoubleSide }));
  m.rotation.x = -Math.PI / 2; m.position.copy(dunya(u.x, u.y)).setY(0.05); sahne.add(m);
  efektler.push({ o: m, sure: 0.5, yas: 0, guncelle: (t) => { m.scale.setScalar(1 + t * r * 6); m.material.opacity = 1 - t; } });
}
function sutun(u, renk) { // Kut: ışık sütunu
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 6, 24, 1, true), new THREE.MeshBasicMaterial({ color: renk, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
  m.position.copy(dunya(u.x, u.y)).setY(3); sahne.add(m);
  efektler.push({ o: m, sure: 0.8, yas: 0, guncelle: (t) => { m.material.opacity = 0.6 * (1 - t); m.scale.set(1 - t * 0.6, 1, 1 - t * 0.6); } });
}
function simsek(k, h) {
  const a = dunya(k.x, k.y).setY(1), b = dunya(h.x, h.y).setY(0.7), noktalar = [];
  for (let i = 0; i <= 6; i++) { const p = a.clone().lerp(b, i / 6); if (i && i < 6) p.add(new THREE.Vector3((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, 0)); noktalar.push(p); }
  const m = new THREE.Line(new THREE.BufferGeometry().setFromPoints(noktalar), new THREE.LineBasicMaterial({ color: '#fff27a', transparent: true }));
  sahne.add(m); efektler.push({ o: m, sure: 0.2, yas: 0, guncelle: (t) => { m.material.opacity = 1 - t; } });
}

// ── Dışa açık arayüz ──
const api = {
  hazir: modelHazir,
  baslat(tuval, yeniSim) {
    if (!hazirla(tuval)) return false;
    for (const f of figurler.values()) sahne.remove(f.kok);
    for (const e of efektler) sahne.remove(e.o);
    figurler = new Map(); efektler = []; sim = yeniSim;
    for (const u of sim.birimler) figurler.set(u.uid, figurKur(u));
    api.boyutla(); saat.getDelta();
    return true;
  },
  boyutla() {
    if (!renderer) return;
    const c = renderer.domElement, w = c.clientWidth, h = c.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); kamera.aspect = w / h;
    // dar ekranda bütün arena sığsın
    kamera.fov = w / h < 0.62 ? 52 : 42; kamera.position.set(0, w / h < 0.62 ? 10.5 : 9.2, w / h < 0.62 ? 9.4 : 8.4); kamera.lookAt(0, 0, 0.5);
    kamera.updateProjectionMatrix();
  },
  // sim'in o adımdaki fx listesi
  fx(liste) {
    const bul = (uid) => sim.birimler.find(o => o.uid === uid);
    for (const f of liste) {
      const u = bul(f.u), fg = figurler.get(f.u); if (!u) continue;
      if (f.tip === 'vurus') { const k = bul(f.k), kf = figurler.get(f.k); if (kf) animOyna(kf, 'saldir', true); if (f.menzilli && k) mermi(k, u, D.kahraman(k.b.h).renk); }
      else if (f.tip === 'yetenek') { if (fg) animOyna(fg, 'yetenek', true); halkaEfekt(u, '#ffe08a'); }
      else if (f.tip === 'kut') sutun(u, '#d9a8ff');
      else if (f.tip === 'simsek') { const k = bul(f.k); if (k) simsek(k, u); }
      else if (f.tip === 'kalkan') halkaEfekt(u, '#e8f0ff', 0.4);
      else if (f.tip === 'dirilis') { halkaEfekt(u, '#ff8a3d', 1); if (fg) { fg.olum = 0; fg.kok.visible = true; animOyna(fg, 'bekle', true); } }
      else if (f.tip === 'olum' && fg) { animOyna(fg, 'olum', true); fg.olum = 0.0001; }
      else if (f.tip === 'hasar' && fg && fg.aktif === 'bekle' && f.n > 60) animOyna(fg, 'vurul', true);
    }
  },
  ciz() {
    if (!renderer || !sim) return;
    const dt = Math.min(0.05, saat.getDelta());
    for (const u of sim.birimler) {
      const f = figurler.get(u.uid); if (!f) continue;
      const hedef = dunya(u.x, u.y);
      const hareket = Math.hypot(u.x - f.oncekiX, u.y - f.oncekiY) > 0.004; f.oncekiX = u.x; f.oncekiY = u.y;
      f.kok.position.x += (hedef.x - f.kok.position.x) * Math.min(1, dt * 18);
      f.kok.position.z += (hedef.z - f.kok.position.z) * Math.min(1, dt * 18);
      // hedefe dön
      const h = u.hedef && !u.hedef.olu ? u.hedef : null;
      if (h && !u.olu) { const p = dunya(h.x, h.y); const aci = Math.atan2(p.x - f.kok.position.x, p.z - f.kok.position.z); f.kok.rotation.y += (((aci - f.kok.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * Math.min(1, dt * 10); }
      if (f.tek > 0) { f.tek -= dt; if (f.tek <= 0 && !u.olu) animOyna(f, hareket ? 'yuru' : 'bekle'); }
      else if (!u.olu) animOyna(f, hareket && f.eylemler.yuru ? 'yuru' : 'bekle');
      if (f.karistir) f.karistir.update(dt);
      // yer tutucu hareketleri: soluk alma, saldırıda öne atılma, yetenekte zıplama
      if (!f.karistir) {
        f.hamle = Math.max(0, f.hamle - dt * 6); f.ziplama = Math.max(0, f.ziplama - dt * 2.5);
        f.model.position.y = Math.sin(performance.now() / 300 + u.uid) * 0.03 + Math.sin(f.ziplama * Math.PI) * 0.5;
        f.model.position.z = Math.sin(f.hamle * Math.PI) * 0.35;
        f.model.rotation.y = 0;
      }
      if (u.durum.sersem && !u.olu) f.kok.rotation.z = Math.sin(performance.now() / 80) * 0.08; else f.kok.rotation.z = 0;
      if (f.olum > 0) { f.olum += dt; if (!f.karistir) f.model.rotation.x = Math.min(1.4, f.olum * 4); if (f.olum > 1.1) f.kok.position.y -= dt * 0.8; if (f.olum > 2) f.kok.visible = false; }
    }
    efektler = efektler.filter(e => { e.yas += dt; const t = Math.min(1, e.yas / e.sure); e.guncelle(t); if (t >= 1) { sahne.remove(e.o); return false; } return true; });
    renderer.render(sahne, kamera);
  },
  // sim koordinatı → ekran (2D kaplama çubukları, yazılar ve dokunma için)
  ekran(x, y, yukseklik = 1.55) {
    const c = renderer.domElement, v = dunya(x, y).setY(yukseklik).project(kamera);
    return { x: (v.x + 1) / 2 * c.clientWidth, y: (1 - v.y) / 2 * c.clientHeight };
  },
  birimBoyu(u) { return [1, 1, 1.12, 1.25][u.b.s || 1] * 1.55; },
  durdur() { sim = null; },
  modelSayisi: () => Object.keys(sablon).length,
};
window.KUT_3D = api;
