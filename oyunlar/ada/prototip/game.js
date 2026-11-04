// Ada prototipi — 3D sahne ve oynanış (Three.js r160)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { audio } from './audio.js';
import { LEVELS, starTimes, starsFor, mulberry32, dailyLevel, store } from './data.js';
import { ui } from './ui.js';

const V3 = THREE.Vector3;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Ortam ölçüleri (glTF: Y yukarı, parkur -Z yönünde)
const ROW0 = 2.25, ROWD = 2.9, COLX = [-2.5, 0, 2.5], TOP = 0.55, MAXROWS = 8;
const rowZ = r => -(ROW0 + r * ROWD);
const DOCK_SPOT = new V3(0, TOP, 0.75);
const C = { coral: '#E2553F', azure: '#2F7DD1', navy: '#2B3550', sun: '#FFC845', leaf: '#4FB463', turq: '#74D6E3' };
const GOLD = new THREE.Color('#ffd166');
const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const easeOut = t => 1 - (1 - t) ** 3, easeIn = t => t * t * t, easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

// ---------- oyun durumu ----------
const G = {
  screen: 'splash', level: null, type: null, phase: 'idle', paused: false, seed: 0, rows: 5,
  pattern: [], row: -1, col: 1, elapsed: 0, timerOn: false, penaltySec: 0, pen: { wrong: 0, lantern: 0, miss: 0 },
  seq: [], next: 0, wind: 0, skip: false, timeScale: 1, char: store.data.char, ready: false,
};

// ---------- görev saati (duraklatılabilir tween/bekleme) ----------
let clock = 0;
const tasks = [];
function tween(dur, fn, ease) {
  let task;
  const p = new Promise(res => { task = { t0: clock, dur, fn, ease, res }; tasks.push(task); });
  p.cancel = () => { const i = tasks.indexOf(task); if (i >= 0) tasks.splice(i, 1); };
  return p;
}
const wait = d => tween(d, null);
function runTasks() {
  for (let i = tasks.length - 1; i >= 0; i--) {
    const k = tasks[i]; if (!k) continue;
    const t = k.dur > 0 ? Math.min(1, (clock - k.t0) / k.dur) : 1;
    if (k.fn) k.fn(k.ease ? k.ease(t) : t);
    if (t >= 1) { const j = tasks.indexOf(k); if (j >= 0) tasks.splice(j, 1); k.res(); }
  }
}

// ---------- renderer / sahne ----------
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;

const scene = new THREE.Scene();
const FOG = new THREE.Color('#dff3ee');
scene.fog = new THREE.Fog(FOG, 90, 520);
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1500);
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = clamp(THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(21)) / camera.aspect)), 50, 76);
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

scene.add(new THREE.HemisphereLight('#dff4ff', '#f2d399', 1.35));
const sun = new THREE.DirectionalLight('#ffe4bd', 2.5);
const SUN_OFF = new V3(-8, 15, 7);
sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 60 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const radialTex = canvasTex(128, 128, x => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); });
const beamTex = canvasTex(4, 128, x => { const g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,1)'); x.fillStyle = g; x.fillRect(0, 0, 4, 128); });
const blobTex = canvasTex(64, 64, x => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(10,40,60,.8)'); g.addColorStop(1, 'rgba(10,40,60,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
const planeGeo = new THREE.PlaneGeometry(1, 1);

// gökyüzü kubbesi
const sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color('#3f9fe0') }, mid: { value: new THREE.Color('#9fd9f2') }, bot: { value: FOG.clone() } },
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform vec3 top, mid, bot; varying vec3 vP;
    void main(){ float h = vP.y; vec3 c = mix(bot, mid, smoothstep(0.0, 0.12, h)); c = mix(c, top, smoothstep(0.12, 0.7, h)); gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
    }`,
}));
sky.renderOrder = -10; scene.add(sky);
// bulutlar
const cloudTex = canvasTex(256, 128, x => {
  const rnd = mulberry32(7);
  for (let i = 0; i < 11; i++) {
    const cx = 40 + rnd() * 176, cy = 76 - Math.abs(cx - 128) * 0.15 + rnd() * 10, r = 22 + rnd() * 26;
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.65, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill();
  }
});
for (let i = 0; i < 9; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, fog: false, depthWrite: false, transparent: true, opacity: 0.9 }));
  const a = -Math.PI * 0.95 + (i / 8) * Math.PI * 1.9 + Math.sin(i * 7) * 0.1, r = 520 + (i % 3) * 120;
  s.position.set(Math.sin(a) * r, 70 + (i % 4) * 22, -Math.cos(a) * r); s.scale.set(240 + (i % 3) * 60, 110, 1); scene.add(s);
}

// su (basit stilize gölge: sığ/derin geçiş, fresnel, güneş parlaması)
const waterMat = new THREE.ShaderMaterial({
  transparent: true, fog: true, depthWrite: true,
  uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uT: { value: 0 }, uShallow: { value: new THREE.Color('#3fd5db') }, uDeep: { value: new THREE.Color('#0f8db8') },
    uSky: { value: new THREE.Color('#c8eef6') }, uSun: { value: SUN_OFF.clone().normalize() },
  }]),
  vertexShader: `varying vec3 vW;
    #include <fog_pars_vertex>
    void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
    }`,
  fragmentShader: `uniform float uT; uniform vec3 uShallow, uDeep, uSky, uSun; varying vec3 vW;
    #include <fog_pars_fragment>
    void main(){
      vec2 p = vW.xz;
      float a1 = p.x * 0.8 + uT * 1.1, a2 = p.y * 1.05 - uT * 0.9, a3 = (p.x * 0.6 + p.y * 0.75) * 1.7 + uT * 1.6;
      vec3 n = normalize(vec3(cos(a1) * 0.07 + cos(a3) * 0.05, 1.0, cos(a2) * 0.07 + cos(a3) * 0.05));
      vec3 V = normalize(cameraPosition - vW);
      float fr = pow(1.0 - max(dot(n, V), 0.0), 4.0);
      float d = length((p - vec2(0.0, -10.0)) * vec2(0.5, 0.28));
      vec3 col = mix(uShallow, uDeep, smoothstep(5.0, 40.0, d));
      col = mix(col, uSky, fr * 0.4);
      float sp = pow(max(dot(n, normalize(uSun + V)), 0.0), 240.0);
      col += vec3(1.0, 0.97, 0.9) * sp * 1.6;
      gl_FragColor = vec4(col, min(1.0, mix(0.76, 0.96, fr) + sp));
      #include <colorspace_fragment>
      #include <fog_fragment>
    }`,
});

// ---------- parçacıklar ----------
const PMAX = 240, _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new V3(), _c = new THREE.Color(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
function makeSys(geo, mat) {
  const im = new THREE.InstancedMesh(geo, mat, PMAX);
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false;
  for (let i = 0; i < PMAX; i++) { im.setMatrixAt(i, ZERO); im.setColorAt(i, _c.set('#fff')); }
  scene.add(im); return { im, list: [], head: 0, dirty: false };
}
const PB = makeSys(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshBasicMaterial({ color: '#fff' }));
const PF = makeSys(new THREE.PlaneGeometry(1, 0.6), new THREE.MeshBasicMaterial({ color: '#fff', side: THREE.DoubleSide }));
function emit(sys, n, f) {
  for (let i = 0; i < n; i++) {
    const idx = sys.head; sys.head = (sys.head + 1) % PMAX;
    const p = sys.list[idx] || (sys.list[idx] = { p: new V3(), v: new V3(), r: new V3(), w: new V3() });
    p.r.set(0, 0, 0); p.w.set(0, 0, 0); p.grow = false; p.drag = 0; p.on = true; f(p, i);
    sys.im.setColorAt(idx, _c.set(p.color));
  }
  sys.im.instanceColor.needsUpdate = true;
}
function updSys(sys, dt) {
  let any = false;
  for (let i = 0; i < sys.list.length; i++) {
    const p = sys.list[i]; if (!p || !p.on) continue;
    any = true; p.life -= dt;
    if (p.life <= 0) { p.on = false; sys.im.setMatrixAt(i, ZERO); continue; }
    p.v.y -= p.g * dt; p.v.multiplyScalar(Math.max(0, 1 - p.drag * dt)); p.p.addScaledVector(p.v, dt); p.r.addScaledVector(p.w, dt);
    const k = p.life / p.max, s = p.size * (p.grow ? (1 + (1 - k) * 1.7) * Math.min(1, k * 3) : Math.min(1, k * 2.5));
    _q.setFromEuler(_e.set(p.r.x, p.r.y, p.r.z));
    sys.im.setMatrixAt(i, _m.compose(p.p, _q, _s.set(s, s, s)));
  }
  if (any || sys.dirty) sys.im.instanceMatrix.needsUpdate = true;
  sys.dirty = any;
}
const R = Math.random;
function fxDust(pos) {
  emit(PB, 14, (p, i) => {
    const a = (i / 14) * Math.PI * 2 + R() * 0.3, sp = 1.3 + R();
    p.p.set(pos.x + Math.cos(a) * 0.25, pos.y + 0.05, pos.z + Math.sin(a) * 0.25); p.v.set(Math.cos(a) * sp, 0.4 + R() * 0.6, Math.sin(a) * sp);
    p.life = p.max = 0.45 + R() * 0.2; p.size = 0.07 + R() * 0.05; p.g = 0.6; p.drag = 4; p.grow = true; p.color = '#f4e6c6';
  });
}
function fxSplash(pos, big = 1) {
  emit(PB, Math.round(28 * big), p => {
    const a = R() * Math.PI * 2, r = R();
    p.p.set(pos.x + Math.cos(a) * r * 0.4, 0.05, pos.z + Math.sin(a) * r * 0.4);
    p.v.set(Math.cos(a) * (0.8 + r * 2) * big, (3 + R() * 3.5) * Math.sqrt(big), Math.sin(a) * (0.8 + r * 2) * big);
    p.life = p.max = 0.7 + R() * 0.4; p.size = (0.06 + R() * 0.07) * Math.sqrt(big); p.g = 11; p.drag = 0.6; p.color = R() < 0.5 ? '#ffffff' : '#c9f3f7';
  });
  ripple(pos, 1.7 * big); ripple(pos, 1.1 * big, 0.18);
}
function fxConfetti(pos, n = 60) {
  const cols = [C.coral, C.azure, C.sun, C.leaf, '#ffffff', C.turq];
  emit(PF, n, (p, i) => {
    const a = R() * Math.PI * 2, sp = 1.5 + R() * 3.5;
    p.p.copy(pos); p.v.set(Math.cos(a) * sp, 3.5 + R() * 4.5, Math.sin(a) * sp);
    p.life = p.max = 1.5 + R() * 0.9; p.size = 0.1 + R() * 0.06; p.g = 6; p.drag = 1.7; p.color = cols[i % cols.length];
    p.r.set(R() * 6, R() * 6, R() * 6); p.w.set((R() - 0.5) * 14, (R() - 0.5) * 14, (R() - 0.5) * 14);
  });
}
function fxSparkle(pos, color = '#fff3b0', n = 10) {
  emit(PB, n, p => {
    p.p.set(pos.x + (R() - 0.5) * 1.1, pos.y + R() * 0.3, pos.z + (R() - 0.5) * 1.1); p.v.set((R() - 0.5) * 0.4, 1.2 + R() * 1.4, (R() - 0.5) * 0.4);
    p.life = p.max = 0.6 + R() * 0.5; p.size = 0.03 + R() * 0.03; p.g = -0.5; p.drag = 1; p.color = color;
  });
}
function fxDebris(pos) {
  emit(PB, 12, p => {
    const a = R() * Math.PI * 2;
    p.p.set(pos.x + (R() - 0.5) * 1.1, TOP, pos.z + (R() - 0.5) * 1.1); p.v.set(Math.cos(a) * 1.2, 1.5 + R() * 2, Math.sin(a) * 1.2);
    p.life = p.max = 0.9; p.size = 0.05 + R() * 0.06; p.g = 10; p.color = R() < 0.5 ? '#c99a62' : '#a87a45';
    p.w.set(R() * 8, R() * 8, R() * 8);
  });
}
const ripples = Array.from({ length: 6 }, () => {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 40), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.visible = false; scene.add(m); return m;
});
let ripI = 0;
async function ripple(pos, size = 1.5, delay = 0) {
  const m = ripples[ripI++ % ripples.length], x = pos.x, z = pos.z;
  if (delay) await wait(delay);
  m.visible = true; m.position.set(x, 0.06, z);
  await tween(0.9, t => { m.scale.setScalar(0.3 + size * easeOut(t)); m.material.opacity = 0.7 * (1 - t); });
  m.visible = false;
}
function vibrate(p) { try { if (store.data.settings.vib && navigator.vibrate) navigator.vibrate(p); } catch (e) { /* yok */ } }

// ---------- karakter ----------
const hero = { root: new THREE.Group(), squash: new THREE.Group(), spin: new THREE.Group(), model: null, P: null, mixer: null, actions: {}, cur: null, state: 'idle', t: 0, yaw: 0, tyaw: 0, flip: false };
hero.spin.position.y = 0.95; hero.root.add(hero.squash); hero.squash.add(hero.spin); scene.add(hero.root);
const charGLB = {}, placeholders = {};
const numberTex = n => canvasTex(128, 104, x => { x.font = '900 82px Nunito, Arial, sans-serif'; x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(n, 64, 56); });
function makePlaceholder(char) {
  const deniz = char === 'deniz', team = deniz ? C.azure : C.coral;
  const M = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.62 });
  const skin = M(deniz ? '#e2a97c' : '#c98d5f'), tm = M(team), navy = M(C.navy), dark = M('#3b3e46'), hair = M(deniz ? '#4a2a18' : '#22160e'), white = M('#ffffff');
  const g = new THREE.Group(); g.position.y = -0.95;
  const P = { g, cur: { aLx: 0, aLz: -0.12, aRx: 0, aRz: 0.12, lL: 0, lR: 0 } };
  const add = (geo, mat, x, y, z, parent = g) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; };
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(0.105 * s, 0.9, 0); g.add(piv);
    add(new THREE.CapsuleGeometry(0.082, 0.6, 4, 10), skin, 0, -0.41, 0, piv);
    add(new THREE.BoxGeometry(0.13, 0.09, 0.25), dark, 0, -0.85, -0.03, piv);
    add(new THREE.BoxGeometry(0.135, 0.025, 0.255), tm, 0, -0.9, -0.03, piv);
    P[s < 0 ? 'legL' : 'legR'] = piv;
  }
  add(new THREE.CylinderGeometry(0.205, 0.225, 0.34, 16), navy, 0, 0.86, 0);
  P.torso = add(new THREE.CapsuleGeometry(0.19, 0.34, 4, 14), tm, 0, 1.25, 0); P.torso.scale.set(1.22, 1, 0.8);
  const num = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.2), new THREE.MeshBasicMaterial({ map: numberTex(deniz ? '07' : '12'), transparent: true, depthWrite: false }));
  num.position.set(0, 1.3, 0.158); g.add(num);
  add(new THREE.CylinderGeometry(0.06, 0.07, 0.12, 10), skin, 0, 1.6, 0);
  add(new THREE.SphereGeometry(0.135, 20, 14), skin, 0, 1.72, 0).scale.set(0.95, 1.08, 1);
  add(new THREE.SphereGeometry(0.142, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), hair, 0, 1.745, 0.012).scale.set(1, 1.05, 1.04);
  add(new THREE.TorusGeometry(0.138, 0.024, 8, 24), tm, 0, 1.77, 0).rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.019, 8, 6), dark, 0.047 * s, 1.725, -0.124);
  if (deniz) add(new THREE.CapsuleGeometry(0.045, 0.28, 4, 8), hair, 0, 1.66, 0.17).rotation.x = 0.35;
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(0.255 * s, 1.5, 0); g.add(piv);
    add(new THREE.CapsuleGeometry(0.058, 0.48, 4, 8), skin, 0, -0.28, 0, piv);
    add(new THREE.CylinderGeometry(0.066, 0.066, 0.07, 10), white, 0, -0.47, 0, piv);
    P[s < 0 ? 'armL' : 'armR'] = piv;
    add(new THREE.SphereGeometry(0.085, 12, 8), tm, 0.235 * s, 1.49, 0);
  }
  g.scale.setScalar(deniz ? 0.925 : 0.985); // 1,70 m / 1,84 m
  return P;
}
// Rigli .glb gelince bu klip adları sürülür
const CLIP = { idle: 'Bekleme', crouch: 'Bekleme', run: 'Kosu', sprint: 'Sprint', air: 'Ziplama', fall: 'Ziplama', swim: 'Yuzme', throw: 'Atis', victory: 'Zafer', flip: 'Takla' };
const ONCE = new Set(['Ziplama', 'Atis', 'Takla']);
function playClip(state) {
  if (!hero.mixer) return;
  const name = CLIP[state] || 'Bekleme', a = hero.actions[name] || hero.actions.Bekleme;
  if (!a) return;
  if (a === hero.cur) { if (ONCE.has(name)) a.reset().play(); return; }
  a.reset(); a.enabled = true; a.setEffectiveWeight(1); a.setEffectiveTimeScale(name === 'Ziplama' ? a.getClip().duration / 0.5 : 1);
  a.setLoop(ONCE.has(name) ? THREE.LoopOnce : THREE.LoopRepeat); a.clampWhenFinished = true; a.play();
  if (hero.cur) hero.cur.crossFadeTo(a, 0.15, false);
  hero.cur = a;
}
function setHeroModel(char) {
  G.char = char;
  if (hero.model) hero.spin.remove(hero.model);
  hero.mixer = null; hero.actions = {}; hero.cur = null; hero.P = null;
  const gl = charGLB[char];
  if (gl) {
    const m = gl.scene; m.position.set(0, 0, 0); m.scale.setScalar(1); m.rotation.set(0, Math.PI, 0); m.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(m), size = box.getSize(new V3()), s = (char === 'deniz' ? 1.7 : 1.84) / (size.y || 1);
    m.scale.setScalar(s); m.position.set(-(box.min.x + box.max.x) / 2 * s, -0.95 - box.min.y * s, -(box.min.z + box.max.z) / 2 * s);
    m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    hero.model = m; hero.mixer = new THREE.AnimationMixer(m);
    for (const clip of gl.animations) hero.actions[clip.name.split('|').pop()] = hero.mixer.clipAction(clip);
    playClip(hero.state);
  } else {
    hero.P = placeholders[char] || (placeholders[char] = makePlaceholder(char));
    hero.model = hero.P.g; hero.P.armR.add(heldBall); heldBall.position.set(0, -0.6, -0.05);
  }
  hero.spin.add(hero.model);
}
async function loadCharModels(loader) {
  let man = null;
  try { const r = await fetch('assets/karakterler.json', { cache: 'no-store' }); if (r.ok) man = await r.json(); } catch (e) { /* manifest yok */ }
  if (!man) return;
  for (const k of ['kerem', 'deniz']) {
    if (!man[k]) continue;
    try { charGLB[k] = await loader.loadAsync('assets/' + man[k]); } catch (e) { console.warn('Karakter yüklenemedi, yer tutucu kullanılıyor:', k); }
  }
  if (charGLB[G.char]) setHeroModel(G.char);
}
function heroState(s) {
  hero.state = s; hero.t = 0;
  if (hero.P) { const c = hero.P.cur; c.aLx = Math.atan2(Math.sin(c.aLx), Math.cos(c.aLx)); c.aRx = Math.atan2(Math.sin(c.aRx), Math.cos(c.aRx)); }
  playClip(s);
}
function setSquash(sy) { const sx = 1 / Math.sqrt(sy); hero.squash.scale.set(sx, sy, sx); }
function face(to) { const h = hero.root.position, dx = to.x - h.x, dz = to.z - h.z; if (dx * dx + dz * dz > 1e-4) hero.tyaw = Math.atan2(-dx, -dz); }
function placeHero(p, yaw = 0) { hero.root.position.copy(p); hero.yaw = hero.tyaw = yaw; hero.root.rotation.y = yaw; setSquash(1); hero.spin.rotation.set(0, 0, 0); hero.squash.position.y = 0; heroState('idle'); }
function poseTarget(s, t) {
  const o = { aLx: 0, aLz: -0.12, aRx: 0, aRz: 0.12, lL: 0, lR: 0 };
  switch (s) {
    case 'idle': o.aLz = -0.12 - Math.sin(t * 2) * 0.04; o.aRz = -o.aLz; break;
    case 'crouch': o.aLx = o.aRx = -0.5; o.lL = o.lR = 0.2; break;
    case 'air': o.aLx = o.aRx = -0.7; o.aLz = -0.7; o.aRz = 0.7; o.lL = 0.55; o.lR = -0.25; break;
    case 'fall': o.aLz = -2.4 + Math.sin(t * 24) * 0.35; o.aRz = 2.4 - Math.sin(t * 24 + 1) * 0.35; o.lL = Math.sin(t * 18) * 0.5; o.lR = -o.lL; break;
    case 'swim': o.aLx = t * 7; o.aRx = t * 7 + Math.PI; o.aLz = -0.25; o.aRz = 0.25; o.lL = Math.sin(t * 15) * 0.35; o.lR = -o.lL; break;
    case 'throw': {
      const k = t / 0.42; o.aLx = 0.7; o.aRz = 0.25;
      o.aRx = k < 0.45 ? lerp(0, -2.5, easeOut(k / 0.45)) : k < 0.75 ? lerp(-2.5, 1.3, easeIn((k - 0.45) / 0.3)) : lerp(1.3, 0, clamp((k - 0.75) / 0.5, 0, 1));
      break;
    }
    case 'victory': o.aLz = -2.55 + Math.sin(t * 7) * 0.18; o.aRz = 2.55 - Math.sin(t * 7) * 0.18; break;
  }
  return o;
}
const blob = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));
blob.rotation.x = -Math.PI / 2; scene.add(blob);
function updateHero(dt) {
  hero.t += dt;
  let d = hero.tyaw - hero.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
  hero.yaw += d * (1 - Math.exp(-dt * 14)); hero.root.rotation.y = hero.yaw;
  if (hero.mixer) hero.mixer.update(dt);
  const P = hero.P;
  if (P) {
    const tg = poseTarget(hero.state, hero.t), a = 1 - Math.exp(-dt * 20), c = P.cur;
    for (const k in tg) c[k] = hero.state === 'swim' && (k === 'aLx' || k === 'aRx') ? tg[k] : lerp(c[k], tg[k], a);
    P.armL.rotation.set(c.aLx, 0, c.aLz); P.armR.rotation.set(c.aRx, 0, c.aRz); P.legL.rotation.x = c.lL; P.legR.rotation.x = c.lR;
    P.torso.scale.y = 1 + Math.sin(hero.t * 2.2) * 0.015;
  }
  if (!hero.flip) hero.spin.rotation.x = lerp(hero.spin.rotation.x, P && hero.state === 'swim' ? -1.3 : 0, 1 - Math.exp(-dt * 10));
  hero.squash.position.y = hero.state === 'victory' && !RM ? Math.abs(Math.sin(hero.t * 5.5)) * 0.22 : hero.squash.position.y * 0.8;
  const h = hero.root.position, over = surfaceAt(h.x, h.z) === 0 && h.y > -0.05;
  blob.visible = over;
  if (over) { const k = clamp(1 - h.y / 4, 0.3, 1); blob.position.set(h.x, 0.05, h.z); blob.scale.setScalar(0.95 * k); blob.material.opacity = 0.45 * k; }
}

// ---------- ortam (glb) ----------
const N = {}, plats = [];
let finishNodes = [], flag = null;
const crack = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), new THREE.MeshBasicMaterial({
  map: canvasTex(256, 256, x => {
    const rnd = mulberry32(3); x.strokeStyle = 'rgba(48,26,10,.92)'; x.lineCap = x.lineJoin = 'round';
    const br = (px, py, a, len, w) => { x.lineWidth = w; x.beginPath(); x.moveTo(px, py); for (let i = 0; i < 6; i++) { a += (rnd() - 0.5) * 0.9; px += Math.cos(a) * len / 6; py += Math.sin(a) * len / 6; x.lineTo(px, py); } x.stroke(); if (w > 3) br(px, py, a + (rnd() - 0.5) * 1.6, len * 0.5, w * 0.55); };
    br(128, 128, -Math.PI / 2, 122, 9); br(128, 128, Math.PI / 2, 122, 9); br(128, 128, 0.3, 80, 6); br(128, 128, Math.PI + 0.4, 74, 6);
  }), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4,
}));
crack.rotation.x = -Math.PI / 2; crack.visible = false; scene.add(crack);
const beamGeo = new THREE.CylinderGeometry(0.72, 0.8, 2.6, 24, 1, true);
function makePlat(g, r, c) {
  const mats = [];
  g.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); if (/Kumtasi/.test(m.material.name)) mats.push(m.material); } });
  const x = COLX[c], z = rowZ(r);
  const add = mat => { const m = new THREE.Mesh(mat === 'halo' ? planeGeo : beamGeo, new THREE.MeshBasicMaterial({ map: mat === 'halo' ? radialTex : beamTex, color: GOLD, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); m.visible = false; scene.add(m); return m; };
  const halo = add('halo'), beam = add('beam');
  halo.rotation.x = -Math.PI / 2; halo.position.set(x, TOP + 0.03, z); halo.scale.setScalar(2.7);
  beam.position.set(x, TOP + 1.3, z);
  return { g, r, c, x, z, mats, halo, beam, base: g.position.clone(), solid: false, broken: false, halves: null };
}
function setGlow(p, v) {
  for (const m of p.mats) { m.emissive.copy(GOLD); m.emissiveIntensity = v * 0.8; }
  p.halo.visible = p.beam.visible = v > 0.01;
  p.halo.material.opacity = v * 0.95; p.beam.material.opacity = v * 0.5;
}
function setupWorld(root) {
  scene.add(root);
  root.traverse(o => { if (o.name && !N[o.name]) N[o.name] = o; if (o.isMesh) { o.castShadow = o.receiveShadow = false; } });
  for (const k of Object.keys(N)) if (/^(Platform_|Baslangic|Bitis|Palmiye|Kayalar|Kumsal|Adacik)/.test(k)) {
    N[k].traverse(m => { if (m.isMesh) { m.receiveShadow = true; m.castShadow = !/^(Kumsal|Adacik)/.test(k); } });
  }
  N.Lagun_Su && N.Lagun_Su.traverse(m => { if (m.isMesh) { m.material = waterMat; m.renderOrder = -1; } });
  root.traverse(m => { if (m.isMesh && m.material !== waterMat && m.material.transparent) m.material.depthWrite = false; });
  for (let r = 0; r < MAXROWS; r++) {
    plats[r] = [];
    for (let c = 0; c < 3; c++) {
      let g;
      if (r < 5) g = N[`Platform_S${r + 1}_K${c + 1}`];
      else { const sr = r % 2 ? 3 : 4; g = N[`Platform_S${sr + 1}_K${c + 1}`].clone(true); g.position.z = rowZ(r) - rowZ(sr); root.add(g); }
      plats[r][c] = makePlat(g, r, c);
    }
  }
  finishNodes = ['Bitis_Platformu', 'Bitis_Bayragi', 'Bitis_Mesaleler', 'Adacik_Bitis', 'Palmiye_7', 'Palmiye_8'].map(n => N[n]).filter(Boolean);
  flag = N.Bitis_Bayragi || null;
}
const finishFront = () => -16.1 - ROWD * (G.rows - 5);
const finishSpot = () => new V3(0, TOP, finishFront() - 1.3);
function surfaceAt(x, z) {
  if (Math.abs(x) < 1.6 && z > 0 && z < 8) return TOP;
  const ff = finishFront(); if (Math.abs(x) < 3.9 && z < ff && z > ff - 4.5) return TOP;
  for (let r = 0; r < G.rows && plats[r]; r++) for (const p of plats[r]) if (!p.broken && Math.abs(x - p.x) < 0.95 && Math.abs(z - p.z) < 0.95) return TOP;
  return 0;
}
// yanlış taş: kırpma düzlemleriyle ikiye bölünüp batar
function splitPlatform(p) {
  p.halves = [-1, 1].map(s => {
    const pivot = new THREE.Group(); pivot.position.set(p.x, TOP, p.z);
    const cl = p.g.clone(true); cl.position.set(p.base.x - p.x, p.base.y - TOP, p.base.z - p.z);
    const local = new THREE.Plane(new V3(s, 0, 0), -s * p.x), plane = new THREE.Plane();
    cl.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.clippingPlanes = [plane]; m.material.clipShadows = true; m.material.side = THREE.DoubleSide; if (m.material.emissive) m.material.emissiveIntensity = 0; } });
    pivot.add(cl); scene.add(pivot);
    return { s, pivot, cl, local, plane };
  });
  p.g.visible = false; updateHalves(p);
}
function updateHalves(p) { for (const h of p.halves) { h.pivot.updateMatrixWorld(true); h.plane.copy(h.local).applyMatrix4(h.cl.matrixWorld); } }
const hintRings = [0, 1, 2].map(() => {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.78, 0.9, 40), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.visible = false; scene.add(m); return m;
});

// ---------- hedefler ----------
const tGroup = new THREE.Group(); scene.add(tGroup);
let targets = [];
const TSLOTS = [[-3.6, -25.5], [0.7, -26.5], [4.1, -29.5], [-1.6, -30.5], [-5.4, -33.5], [1.8, -34.5], [-0.3, -37.5]];
const faceTex = canvasTex(256, 256, x => {
  const cols = [C.coral, '#ffffff', C.coral, '#ffffff', C.coral];
  for (let i = 0; i < 5; i++) { x.fillStyle = cols[i]; x.beginPath(); x.arc(128, 128, 126 - i * 25, 0, Math.PI * 2); x.fill(); x.strokeStyle = 'rgba(43,53,80,.25)'; x.lineWidth = 3; x.stroke(); }
});
const woodMat = new THREE.MeshStandardMaterial({ color: '#8a5a32', roughness: 0.85 }), rimMat = new THREE.MeshStandardMaterial({ color: '#b07a45', roughness: 0.8 });
const discGeo = new THREE.CylinderGeometry(0.62, 0.62, 0.1, 36);
const labelCache = {};
function labelTex(text, bg, fg) {
  const k = text + bg; if (labelCache[k]) return labelCache[k];
  return (labelCache[k] = canvasTex(128, 128, x => {
    x.fillStyle = bg; x.beginPath(); x.arc(64, 64, 56, 0, 7); x.fill(); x.lineWidth = 8; x.strokeStyle = '#ffffff'; x.stroke();
    x.fillStyle = fg; x.font = '800 70px "Baloo 2", Nunito, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 64, 70);
  }));
}
function clearTargets() { for (const t of targets) { if (t.g.parent) t.g.parent.remove(t.g); t.face.dispose(); t.halo.material.dispose(); t.label.material.dispose(); } targets = []; standGroup.clear(); blockers = []; }
function buildTargets(n, rng) {
  clearTargets();
  const slots = TSLOTS.slice();
  for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
  slots.slice(0, n).forEach(([x, z], i) => {
    x += (rng() - 0.5) * 0.8; z += (rng() - 0.5) * 0.8;
    const h = 1.35 + rng() * 0.7, g = new THREE.Group(); g.position.set(x, 0, z);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, h + 1.6, 8), woodMat); post.position.y = (h - 1.6) / 2; post.castShadow = true;
    const board = new THREE.Group(); board.position.y = h;
    const face = new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.6, emissive: new THREE.Color('#ffcc55'), emissiveIntensity: 0 });
    const disc = new THREE.Mesh(discGeo, [rimMat, face, rimMat]); disc.rotation.x = Math.PI / 2; disc.castShadow = true;
    const halo = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: radialTex, color: GOLD, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    halo.scale.setScalar(3.4); halo.position.z = -0.1; halo.visible = false;
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false, fog: false }));
    label.position.y = 1.05; label.scale.setScalar(0.001); label.visible = false; label.renderOrder = 5;
    board.add(disc, halo, label); g.add(post, board); tGroup.add(g);
    targets.push({ i, g, board, face, halo, label, x, z, cy: h, rad: 0.62, done: false, down: false });
  });
}
function showLabel(t, text, kind, dur = 0.25) {
  t.label.material.map = kind === 'done' ? labelTex('✓', C.leaf, '#ffffff') : labelTex(String(text), C.sun, C.navy);
  t.label.material.needsUpdate = true; t.label.visible = true;
  return tween(dur, k => t.label.scale.setScalar(Math.max(0.001, 0.85 * (k < 0.7 ? easeOut(k / 0.7) * 1.15 : lerp(1.15, 1, (k - 0.7) / 0.3)))));
}
function hideLabel(t, dur = 0.2) { return tween(dur, k => t.label.scale.setScalar(Math.max(0.001, 0.85 * (1 - k)))).then(() => { t.label.visible = false; }); }
function setTargetGlow(t, v) { t.face.emissiveIntensity = v * 0.7; t.halo.visible = v > 0.01; t.halo.material.opacity = v * 0.85; }

// top ve atış simülasyonu (sabit adım; önizleme ve test çözücüsüyle aynı)
const GRAV = 9.8, WINDK = 0.85, BALL_R = 0.12, SIM_DT = 1 / 120;
const ball = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 16, 12), new THREE.MeshStandardMaterial({ color: '#fff3e0', roughness: 0.45 }));
ball.castShadow = true; ball.visible = false; scene.add(ball);
const B = { on: false, s: null, acc: 0, spent: false };
function launchState(yaw, power) {
  const h = hero.root.position, dir = new V3(Math.sin(yaw), 0, -Math.cos(yaw)), v = 6.5 + power * 10, el = 0.5;
  const p = new V3(h.x, h.y + 1.95, h.z).addScaledVector(dir, 0.35), vel = dir.clone().multiplyScalar(v * Math.cos(el)); vel.y = v * Math.sin(el);
  return { p, v: vel };
}
function stepSim(s, wind, noHit) {
  const px = s.p.x, py = s.p.y, pz = s.p.z;
  s.v.y -= GRAV * SIM_DT; s.v.x += wind * WINDK * SIM_DT; s.p.addScaledVector(s.v, SIM_DT);
  if (!noHit) {
    for (const t of targets) {
      if (t.down) continue;
      const fz = t.z + 0.05;
      if (pz > fz && s.p.z <= fz) {
        const k = (pz - fz) / (pz - s.p.z), x = lerp(px, s.p.x, k), y = lerp(py, s.p.y, k);
        if (Math.hypot(x - t.x, y - t.cy) < t.rad + BALL_R) return { hit: t, at: new V3(x, y, fz) };
      }
    }
    for (const b of blockers) if (b.containsPoint(s.p)) return { block: true };
  }
  if (s.p.y < 0.05 || s.p.z < -90) return { water: true };
  return null;
}
// nişan yayı: ince, süt beyazı, yumuşak kenarlı şerit + seyrek noktalar; ilk çarpışmada biter
const softTex = canvasTex(4, 64, x => { const g = x.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 4, 64); });
function makeRibbon(n, opacity) {
  const geo = new THREE.BufferGeometry(), uv = new Float32Array(n * 4), idx = [];
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 6), 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 8).fill(1), 4).setUsage(THREE.DynamicDrawUsage));
  for (let i = 0; i < n; i++) uv.set([i / (n - 1), 0, i / (n - 1), 1], i * 4);
  for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: softTex, vertexColors: true, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false }));
  m.frustumCulled = false; m.visible = false; m.renderOrder = 6; m.n = n; scene.add(m); return m;
}
const _rp = new V3(), _rt = new V3(), _rv = new V3(), _rs = new V3();
function setRibbon(m, pts, count, widthFn, alphaFn) {
  if (count < 2) { m.visible = false; return; }
  const n = m.n, P = m.geometry.attributes.position.array, A = m.geometry.attributes.color.array;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1), f = u * (count - 1), i0 = Math.min(count - 2, Math.floor(f));
    _rp.copy(pts[i0]).lerp(pts[i0 + 1], f - i0);
    _rt.subVectors(pts[i0 + 1], pts[i0]); _rv.subVectors(camera.position, _rp);
    _rs.crossVectors(_rt, _rv).normalize().multiplyScalar(widthFn(u) / 2);
    P[i * 6] = _rp.x - _rs.x; P[i * 6 + 1] = _rp.y - _rs.y; P[i * 6 + 2] = _rp.z - _rs.z;
    P[i * 6 + 3] = _rp.x + _rs.x; P[i * 6 + 4] = _rp.y + _rs.y; P[i * 6 + 5] = _rp.z + _rs.z;
    A[i * 8 + 3] = A[i * 8 + 7] = alphaFn(u);
  }
  m.geometry.attributes.position.needsUpdate = true; m.geometry.attributes.color.needsUpdate = true; m.visible = true;
}
const arc = makeRibbon(48, 0.45), ARC_DOTS = 7;
const arcDots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.75, depthWrite: false, fog: false, toneMapped: false }), ARC_DOTS);
arcDots.frustumCulled = false; arcDots.visible = false; arcDots.renderOrder = 7; scene.add(arcDots);
const arcRing = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.2, 32), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85, depthWrite: false, fog: false, toneMapped: false }));
arcRing.visible = false; arcRing.renderOrder = 7; scene.add(arcRing);
const arcPts = Array.from({ length: 520 }, () => new V3());
let aimTok = 0;
function showAim(yaw, power) {
  aimTok++;
  const s = launchState(yaw, power); let n = 0, hit = null;
  arcPts[n++].copy(s.p);
  while (n < arcPts.length) { const r = stepSim(s, 0, false); arcPts[n++].copy(r && r.at ? r.at : s.p); if (r) { hit = r; break; } }
  arc.material.opacity = 0.45; arcDots.material.opacity = 0.75; arcRing.material.opacity = 0.85;
  setRibbon(arc, arcPts, n, () => 0.045, u => Math.min(1, u * 14) * (0.8 + 0.2 * (1 - u)));
  for (let i = 0; i < ARC_DOTS; i++) {
    const f = ((i + 1) / (ARC_DOTS + 1)) * (n - 1), i0 = Math.min(n - 2, Math.floor(f));
    _rp.copy(arcPts[i0]).lerp(arcPts[i0 + 1], f - i0); arcDots.setMatrixAt(i, _m.compose(_rp, _q.identity(), _s.setScalar(1)));
  }
  arcDots.instanceMatrix.needsUpdate = true; arcDots.visible = true;
  const t = hit && hit.hit;
  arcRing.visible = !!t;
  if (t) arcRing.position.set(hit.at.x, hit.at.y, hit.at.z + 0.03);
  hero.tyaw = -yaw;
}
function hideAim(fade = true) {
  const tok = ++aimTok; ui.power(null);
  if (!fade || !arc.visible) { arc.visible = arcDots.visible = arcRing.visible = false; return; }
  const o = [arc.material.opacity, arcDots.material.opacity, arcRing.material.opacity];
  tween(0.12, k => { if (tok !== aimTok) return; arc.material.opacity = o[0] * (1 - k); arcDots.material.opacity = o[1] * (1 - k); arcRing.material.opacity = o[2] * (1 - k); })
    .then(() => { if (tok === aimTok) arc.visible = arcDots.visible = arcRing.visible = false; });
}
// uçan topun kısa beyaz izi
const trail = makeRibbon(12, 0.65), trailPts = [];
function updateTrail() {
  if (ball.visible) { const p = trailPts.length >= 10 ? trailPts.shift() : new V3(); trailPts.push(p.copy(ball.position)); }
  else if (trailPts.length) trailPts.splice(0, 2);
  if (trailPts.length < 2) { trail.visible = false; return; }
  setRibbon(trail, trailPts, trailPts.length, u => 0.02 + 0.17 * u, u => 0.75 * u * u);
}
// isabet parlaması
const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex, color: '#fff1c2', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false }));
flash.visible = false; flash.renderOrder = 8; scene.add(flash);
function hitFlash(p) {
  flash.position.copy(p); flash.visible = true;
  tween(0.2, k => { flash.scale.setScalar(0.4 + 1.8 * easeOut(k)); flash.material.opacity = 1 - k; }).then(() => { flash.visible = false; });
  emit(PB, 12, (q, i) => {
    const a = (i / 12) * Math.PI * 2;
    q.p.copy(p); q.v.set(Math.cos(a) * (1.5 + R()), Math.sin(a) * (1.5 + R()) + 1, 0.8 + R());
    q.life = q.max = 0.4 + R() * 0.25; q.size = 0.035 + R() * 0.03; q.g = 6; q.drag = 2; q.color = i % 2 ? '#ffffff' : '#ffd77a';
  });
}

// ---------- Final Atışı: halat bağlı ahşap çerçeve, taş kaideler, 3 menteşeli hedef ----------
const standGroup = new THREE.Group(); scene.add(standGroup);
let blockers = [];
const STAND_Z = -8.5, FINAL_SPOT = new V3(-0.45, TOP, 1.0);
const stoneM = new THREE.MeshStandardMaterial({ color: '#c9b48f', roughness: 0.95 }), mossM = new THREE.MeshStandardMaterial({ color: '#7eae4c', roughness: 0.95 });
const plankM = new THREE.MeshStandardMaterial({ color: '#b07a45', roughness: 0.85 }), ropeM = new THREE.MeshStandardMaterial({ color: '#dcc48e', roughness: 0.95 });
const metalM = new THREE.MeshStandardMaterial({ color: '#5c636e', roughness: 0.45, metalness: 0.5 });
const heldBall = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 14, 10), ball.material); heldBall.visible = false;
function buildStand() {
  standGroup.clear(); blockers = [];
  const z = STAND_Z;
  const box = (w, h, d, mat, x, y, bz, block = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, bz); m.castShadow = m.receiveShadow = true; standGroup.add(m);
    if (block) blockers.push(new THREE.Box3().setFromCenterAndSize(m.position.clone(), new V3(w, h, d)).expandByScalar(BALL_R));
    return m;
  };
  for (const x of [-2.15, 0, 2.15]) box(1.55, 1.0, 1.15, [stoneM, stoneM, mossM, stoneM, stoneM, stoneM], x, 0.2, z);
  box(6.9, 0.2, 0.95, plankM, 0, 0.8, z);
  for (const s of [-1, 1]) box(0.3, 2.75, 0.3, woodMat, s * 3.2, 2.1, z);
  box(7.2, 0.26, 0.3, woodMat, 0, 3.35, z);
  for (const s of [-1, 1]) for (const y of [3.22, 3.42]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.045, 6, 16), ropeM); r.position.set(s * 3.2, y, z); r.rotation.y = Math.PI / 2; standGroup.add(r); }
  [-2.15, 0, 2.15].forEach((x, i) => {
    const rad = 0.6, hy = 1.08;
    box(0.4, 0.17, 0.26, metalM, x, 0.98, z + 0.05, false);
    const g = new THREE.Group(); g.position.set(x, hy, z + 0.05);
    const face = new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.6, emissive: new THREE.Color('#ffcc55'), emissiveIntensity: 0 });
    const disc = new THREE.Mesh(discGeo, [rimMat, face, rimMat]); disc.rotation.x = Math.PI / 2; disc.position.y = rad; disc.castShadow = true;
    const halo = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: radialTex, color: GOLD, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    halo.visible = false; halo.position.set(0, rad, -0.1); halo.scale.setScalar(3.2);
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false, fog: false })); label.visible = false;
    g.add(disc, halo, label); standGroup.add(g);
    targets.push({ i, g, board: g, face, halo, label, x, z: z + 0.05, cy: hy + rad, rad: 0.62, done: false, down: false });
  });
}

// ---------- kamera ----------
const cam = { mode: 'orbit', pos: new V3(0, 12, 20), look: new V3(0, 0, -6), tp: new V3(), tl: new V3(), ang: 0.6, vang: 0.5, snap: true, shake: 0 };
function updateCamera(dt) {
  const h = hero.root.position, tp = cam.tp, tl = cam.tl; let k = 3;
  switch (cam.mode) {
    case 'orbit': cam.ang += dt * 0.06; tp.set(Math.sin(cam.ang) * 15, 8.2, -3 + Math.cos(cam.ang) * 15); tl.set(0, 0.6, -3); k = 1.6; break;
    case 'overview': { const zc = (rowZ(0) + rowZ(G.rows - 1)) / 2; tp.set(0, 8 + G.rows * 0.9, zc + 9 + G.rows * 0.9); tl.set(0, 0, zc - 1); k = 2.4; break; }
    case 'follow': tp.set(h.x * 0.18, Math.max(h.y, TOP) + 4.6, h.z + 6.2); tl.set(h.x * 0.35, 0.2, h.z - 6.5); k = 3.6; break;
    case 'targets': tp.set(h.x + 0.4, 6.4, h.z + 6); tl.set(-0.4, 0.4, h.z - 11); k = 2.4; break;
    case 'throw': tp.set(h.x + 0.5, 3.8, h.z + 4.8); tl.set(-0.3, 0.9, h.z - 12); k = 3; break;
    case 'final': tp.set(h.x + 0.45, h.y + 2.85, h.z + 2.6); tl.set(h.x + 0.2, 0, h.z - 4.4); k = 3; break;
    case 'victory': cam.vang += dt * 0.22; tp.set(h.x + Math.sin(cam.vang) * 5, h.y + 2.1, h.z - Math.cos(cam.vang) * 5); tl.set(h.x, h.y + 0.15, h.z); k = 2.2; break;
  }
  if (cam.snap) { cam.pos.copy(tp); cam.look.copy(tl); cam.snap = false; }
  const a = 1 - Math.exp(-k * dt); cam.pos.lerp(tp, a); cam.look.lerp(tl, a);
  camera.position.copy(cam.pos);
  if (cam.shake > 0 && !RM) { cam.shake = Math.max(0, cam.shake - dt); const s = cam.shake * 0.25; camera.position.x += (R() - 0.5) * s; camera.position.y += (R() - 0.5) * s; }
  camera.lookAt(cam.look);
}
const _v = new V3();
function toScreen(x, y, z) { _v.set(x, y, z).project(camera); return { x: (_v.x + 1) / 2 * innerWidth, y: (1 - _v.y) / 2 * innerHeight }; }

// ---------- dünya sıfırlama / menü ----------
let busy = false, queued = null, jumpRow = -1;
function resetWorld(rows) {
  tasks.length = 0; busy = false; queued = null; jumpRow = -1;
  Object.assign(G, { rows, phase: 'idle', paused: false, timerOn: false, elapsed: 0, penaltySec: 0, pen: { wrong: 0, lantern: 0, miss: 0 }, row: -1, col: 1, next: 0, seq: [], pattern: [], wind: 0, skip: false });
  for (let r = 0; r < plats.length; r++) for (const p of plats[r]) {
    if (p.halves) { for (const h of p.halves) { scene.remove(h.pivot); h.cl.traverse(m => m.isMesh && m.material.dispose()); } p.halves = null; }
    p.g.visible = r < rows; p.g.position.copy(p.base); p.broken = false; p.solid = false; setGlow(p, 0);
  }
  for (const n of finishNodes) { n.position.z = -ROWD * (rows - 5); n.visible = true; }
  if (flag) { flag.scale.set(1, 1, 1); flag.position.x = 0; }
  crack.visible = false; clearTargets(); B.on = false; ball.visible = false; heldBall.visible = false; hideAim(false);
  trailPts.length = 0; trail.visible = false; flash.visible = false; G.freeze = 0;
  for (const m of ripples) m.visible = false; for (const m of hintRings) m.visible = false;
  hero.flip = false;
}
function toMenu() {
  resetWorld(5); G.type = null; G.level = null;
  placeHero(DOCK_SPOT.clone().setZ(1.6), 0.3); cam.mode = 'orbit';
}

// ---------- Üçlü Köprü ----------
async function startBridge(L, rng) {
  resetWorld(L.rows); G.type = 'kopru';
  G.pattern = Array.from({ length: L.rows }, () => Math.floor(rng() * 3));
  for (let r = 0; r < L.rows; r++) for (const p of plats[r]) p.solid = G.pattern[r] === p.c;
  placeHero(DOCK_SPOT.clone(), 0); cam.mode = 'overview'; cam.snap = true;
  ui.hud({ left: L.rows, unit: 'sıra', wind: null });
  G.phase = 'memorize';
  await wait(0.45);
  await memorizeRows(0, L.glow, 'EZBERLE');
  G.phase = 'play'; cam.mode = 'follow';
  ui.banner('GİT!', null, 750); audio.sfx('go'); ui.lantern(true);
  ui.hint('Sıradaki taşa dokun ya da yukarı kaydır');
}
async function memorizeRows(from, dur, title) {
  const n = G.rows - from; if (n <= 0) return;
  const total = n * dur + 0.3; let last = Math.ceil(total);
  ui.banner(title, last);
  const cd = tween(total, t => { const s = Math.max(1, Math.ceil(total * (1 - t))); if (s !== last) { last = s; ui.bannerSub(s); audio.sfx('tick'); } });
  for (let r = from; r < G.rows && !G.skip; r++) {
    const p = plats[r][G.pattern[r]];
    audio.note(r); fxSparkle(new V3(p.x, TOP, p.z));
    tween(dur * 1.3, t => setGlow(p, Math.sin(Math.PI * t) ** 0.6));
    await wait(dur);
  }
  if (G.skip) cd.cancel(); else await cd;
  for (let r = 0; r < G.rows; r++) for (const p of plats[r]) setGlow(p, 0);
  G.skip = false; ui.banner(null);
}
function requestJump(col) {
  if (G.type !== 'kopru' || G.paused || G.phase !== 'play') return;
  if (busy) { queued = col; return; }
  doJump(col);
}
async function hop(to, dur) {
  const from = hero.root.position.clone();
  face(to); heroState('crouch'); audio.sfx('jump');
  await tween(0.07, t => setSquash(1 - 0.2 * t));
  heroState('air');
  const d = Math.hypot(to.x - from.x, to.z - from.z), hgt = 0.55 + d * 0.16 + Math.max(0, to.y - from.y) * 0.6;
  await tween(dur, t => {
    const P = hero.root.position; P.x = lerp(from.x, to.x, t); P.z = lerp(from.z, to.z, t); P.y = lerp(from.y, to.y, t) + 4 * hgt * t * (1 - t);
    setSquash(t < 0.15 ? lerp(0.8, 1.14, t / 0.15) : 1 + 0.14 * Math.abs(1 - 2 * t));
  });
}
function landFx(p) {
  audio.sfx('land'); vibrate(12); fxDust(hero.root.position); heroState('idle');
  tween(0.26, t => setSquash(1 - 0.22 * Math.cos(t * Math.PI * 1.5) * (1 - t)));
  if (p) tween(0.3, t => { p.g.position.y = p.base.y - 0.07 * Math.sin(t * Math.PI) * (1 - t * 0.5); });
}
async function doJump(col) {
  busy = true; queued = null;
  if (!G.timerOn) G.timerOn = true;
  const nr = G.row + 1; jumpRow = nr;
  if (nr >= G.rows) { await hop(finishSpot(), 0.42); return finishRun(); }
  const p = plats[nr][col];
  if (p.broken) { busy = false; return; }
  await hop(new V3(p.x, TOP, p.z), 0.35);
  if (p.solid) {
    G.row = nr; G.col = col; landFx(p); ui.setLeft(G.rows - nr - 1);
    busy = false; jumpRow = -1;
    if (queued !== null) { const q = queued; queued = null; requestJump(q); }
  } else await fall(p);
}
async function fall(p) {
  G.phase = 'fail'; queued = null; ui.lantern(false);
  audio.sfx('land'); heroState('idle'); setSquash(0.85); tween(0.15, t => setSquash(lerp(0.85, 1, t)));
  await wait(0.1);
  crack.visible = true; crack.position.set(p.x, TOP + 0.015, p.z); audio.sfx('crack'); vibrate([30, 40, 30]); cam.shake = 0.25;
  const hx = hero.root.position.x;
  await tween(0.38, t => { const j = Math.sin(t * 70) * 0.035 * (1 - t * 0.4); p.g.position.x = p.base.x + j; hero.root.position.x = hx + j; crack.position.x = p.x + j; crack.scale.setScalar(0.5 + 0.5 * easeOut(Math.min(1, t * 2))); });
  p.g.position.x = p.base.x; crack.visible = false; hero.root.position.x = hx;
  p.broken = true; splitPlatform(p); fxDebris(new V3(p.x, TOP, p.z));
  addPenalty(4, 'wrong');
  const halves = p.halves;
  tween(1.5, t => { if (p.halves !== halves) return; for (const h of halves) { h.pivot.position.set(p.x + h.s * 0.5 * easeOut(t), TOP - 3.4 * t * t, p.z); h.pivot.rotation.z = h.s * 0.8 * easeOut(t); } })
    .then(() => { if (p.halves === halves) for (const h of halves) h.pivot.visible = false; });
  heroState('fall');
  const y0 = hero.root.position.y;
  await tween(0.42, t => { hero.root.position.y = y0 - 1.9 * t * t; });
  fxSplash(hero.root.position, 1.1); audio.sfx('splash'); vibrate(20);
  heroState('swim');
  const swimY = hero.P ? -0.85 : -1.05, yb = hero.root.position.y;
  await tween(0.4, t => { hero.root.position.y = lerp(yb, swimY, easeOut(t)); });
  const prev = G.row >= 0 ? plats[G.row][G.col] : null;
  const stand = prev ? new V3(prev.x, TOP, prev.z) : DOCK_SPOT.clone();
  const tgt = new V3(stand.x, swimY, prev ? stand.z - 1.15 : -0.55);
  face(tgt);
  const from = hero.root.position.clone(), dur = Math.max(0.6, from.distanceTo(tgt) / 2.6);
  let lastR = 0;
  await tween(dur, t => {
    hero.root.position.lerpVectors(from, tgt, easeInOut(t)); hero.root.position.y = swimY + Math.sin(t * dur * 9) * 0.03;
    if (t - lastR > 0.3) { lastR = t; ripple(hero.root.position, 0.7); }
  });
  face(stand); heroState('crouch'); await wait(0.08);
  heroState('air'); audio.sfx('jump');
  const c0 = hero.root.position.clone();
  await tween(0.42, t => { const P = hero.root.position; P.x = lerp(c0.x, stand.x, t); P.z = lerp(c0.z, stand.z, t); P.y = lerp(c0.y, stand.y, easeOut(t)) + Math.sin(t * Math.PI) * 0.5; });
  landFx(prev); hero.tyaw = 0;
  G.phase = 'play'; busy = false; queued = null; jumpRow = -1; ui.lantern(true);
}

// ---------- Hedef Dizisi ----------
async function startTargets(L, rng) {
  resetWorld(5); G.type = 'hedef';
  G.wind = L.wind ? Math.round((rng() < 0.5 ? -1 : 1) * L.wind * (0.85 + rng() * 0.3) * 10) / 10 : 0;
  buildTargets(L.targets, rng);
  const idx = targets.map(t => t.i);
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  G.seq = idx.slice(0, L.seq);
  placeHero(new V3(-0.8, TOP, -20.0), 0); cam.mode = 'targets'; cam.snap = true;
  ui.hud({ left: L.seq, unit: 'hedef', wind: G.wind });
  G.phase = 'memorize';
  await wait(0.5);
  await showSeq(0, L.show, 'EZBERLE');
  G.phase = 'aim'; cam.mode = 'throw';
  ui.banner('GİT!', null, 750); audio.sfx('go'); ui.lantern(true);
  ui.hint('Aşağıdan yukarı kaydır, nişan al ve bırak');
}
async function showSeq(from, dur, title) {
  const n = G.seq.length - from; if (n <= 0) return;
  const total = n * dur + 0.35; let last = Math.ceil(total);
  ui.banner(title, last);
  const cd = tween(total, t => { const s = Math.max(1, Math.ceil(total * (1 - t))); if (s !== last) { last = s; ui.bannerSub(s); audio.sfx('tick'); } });
  for (let i = from; i < G.seq.length && !G.skip; i++) {
    const t = targets[G.seq[i]];
    audio.note(i + 2); showLabel(t, i + 1, 'num');
    tween(dur * 1.25, k => setTargetGlow(t, Math.sin(Math.PI * k) ** 0.6)).then(() => { if (!t.done) hideLabel(t); });
    await wait(dur);
  }
  if (G.skip) cd.cancel(); else await cd;
  for (const t of targets) { setTargetGlow(t, 0); if (!t.done) { t.label.visible = false; } }
  G.skip = false; ui.banner(null);
}
const isThrow = () => G.type === 'hedef' || G.type === 'final';
async function throwBall(yaw, power) {
  if (!isThrow() || G.phase !== 'aim' || G.paused || B.on) return false;
  G.phase = 'flight'; if (!G.timerOn) G.timerOn = true;
  ui.lantern(false); hero.tyaw = -yaw; heroState('throw');
  if (G.type === 'final' && !store.data.tips.final) { store.data.tips.final = true; store.save(); }
  if (G.type === 'final') ui.hint('');
  await wait(0.17);
  audio.sfx('whoosh'); heldBall.visible = false;
  B.s = launchState(yaw, power); B.on = true; B.spent = false; B.res = null; B.acc = 0; ball.visible = true; ball.position.copy(B.s.p);
  await wait(0.5); if (hero.state === 'throw') heroState('idle');
  return true;
}
function endBall() {
  B.on = false; ball.visible = false;
  if (G.phase === 'flight') { G.phase = 'aim'; if (G.type === 'hedef') ui.lantern(true); wait(0.25).then(() => { if (G.phase === 'aim' && hero.P) heldBall.visible = true; }); }
}
function updateBall(dt) {
  if (!B.on) return;
  B.acc += dt;
  while (B.acc >= SIM_DT && B.on) {
    B.acc -= SIM_DT;
    const r = stepSim(B.s, B.spent ? 0 : G.wind, B.spent);
    if (r && r.water) {
      const p = B.s.p.clone(), miss = B.res !== 'hit';
      endBall(); fxSplash(p, miss ? 0.6 : 0.35); audio.sfx('splash', miss ? 0.6 : 0.4);
      if (miss && G.phase !== 'done') {
        addPenalty(3, 'miss', toScreen(p.x, 0.5, p.z));
        if (G.type === 'final') ui.banner('Tekrar dene', null, 800, 'soft'); else ui.hint('Iska! +3 sn', true);
      }
      return;
    }
    if (r && r.block) { B.spent = true; B.res = 'block'; B.s.v.set(B.s.v.x * 0.3, 1.2, 2.2); audio.sfx('land'); fxDust(B.s.p); }
    if (r && r.hit) onHit(r.hit, r.at);
  }
  ball.position.copy(B.s.p); ball.rotation.x -= dt * 12;
}
function onHit(t, at) {
  B.spent = true; B.res = 'hit'; B.s.p.z = t.z + 0.15; B.s.v.set(B.s.v.x * 0.2, 2.2, 2.4);
  if (G.type === 'final') {
    t.done = t.down = true; G.next++;
    audio.sfx('ding', G.next); vibrate(25); hitFlash(at || new V3(t.x, t.cy, t.z));
    fxConfetti(new V3(t.x, t.cy, t.z + 0.2), 18);
    tween(0.6, k => { t.g.rotation.x = k < 0.38 ? -1.5 * easeIn(k / 0.38) : -1.5 + 0.24 * Math.sin(((k - 0.38) / 0.62) * Math.PI) * (1 - (k - 0.38) / 0.62); });
    ui.setLeft(`${G.next}/3`); ui.setIcon(t.i, true);
    if (G.next >= 3) {
      G.phase = 'done'; G.timerOn = false; G.freeze = 0.04; cam.shake = 0.1;
      ui.banner('İSABET!', null, 700, 'hit'); wait(0.55).then(finishRun);
    } else ui.banner('İSABET!', null, 650, 'hit');
    return;
  }
  const want = targets[G.seq[G.next]];
  if (t === want) {
    t.done = true; G.next++; audio.sfx('thunk', G.next); vibrate(25); hitFlash(at || new V3(t.x, t.cy, t.z));
    fxConfetti(new V3(t.x, t.cy + 0.3, t.z + 0.3), 50);
    tween(0.9, k => { t.board.rotation.y = Math.PI * 4 * easeOut(k); });
    setTargetGlow(t, 0.5); tween(0.6, k => setTargetGlow(t, 0.5 * (1 - k)));
    showLabel(t, G.next, 'done');
    ui.setLeft(G.seq.length - G.next); ui.hint(G.next < G.seq.length ? 'Güzel! Sıradaki hedef' : '');
    if (G.next >= G.seq.length) { G.phase = 'done'; G.timerOn = false; G.freeze = 0.04; cam.shake = 0.1; wait(0.7).then(finishRun); }
  } else {
    audio.sfx('buzz'); vibrate([30, 30, 30]); cam.shake = 0.15;
    addPenalty(3, 'miss', toScreen(t.x, t.cy + 0.8, t.z)); ui.hint(t.done ? 'Bu hedef zaten vuruldu! +3 sn' : 'Yanlış sıra! +3 sn', true);
    tween(0.6, k => { t.board.rotation.z = Math.sin(k * 30) * 0.25 * (1 - k); });
  }
}
async function startFinal() {
  resetWorld(5); G.type = 'final';
  for (const row of plats) for (const p of row) p.g.visible = false;
  for (const n of finishNodes) if (/^Bitis/.test(n.name)) n.visible = false;
  buildStand(); G.seq = [0, 1, 2]; G.next = 0;
  placeHero(FINAL_SPOT.clone(), 0); cam.mode = 'final'; cam.snap = true;
  ui.hud({ label: 'HEDEF', left: '0/3', unit: '', wind: null, icons: 3, lantern: false });
  G.phase = 'intro';
  ui.banner('FİNAL ATIŞI', '3 hedefi devir', 1500); audio.sfx('go');
  await wait(1.25);
  G.phase = 'aim'; if (hero.P) heldBall.visible = true;
  if (!store.data.tips.final) ui.hint('Nişan almak için geri çek');
}

// ---------- ortak: ceza, fener, bitiş ----------
function addPenalty(sec, kind, at) {
  G.penaltySec += sec; G.pen[kind] = (G.pen[kind] || 0) + 1;
  const h = hero.root.position, s = at === 'lantern' ? { x: 'lantern' } : at || toScreen(h.x, Math.max(h.y, 0) + 2, h.z);
  ui.penalty('+' + sec + ' sn', s.x, s.y);
}
async function lantern() {
  if (G.paused || busy || G.type === 'final' || !(G.phase === 'play' || G.phase === 'aim')) return;
  const prev = G.phase; G.phase = 'replay'; ui.lantern(false); ui.hint('');
  addPenalty(6, 'lantern', 'lantern'); audio.sfx('lantern');
  if (G.type === 'kopru') { cam.mode = 'overview'; await wait(0.45); await memorizeRows(G.row + 1, Math.max(0.42, G.level.glow * 0.85), 'FENER'); cam.mode = 'follow'; ui.hint('Sıradaki taşa dokun ya da yukarı kaydır'); }
  else { cam.mode = 'targets'; await wait(0.35); await showSeq(G.next, G.level.show * 0.9, 'FENER'); cam.mode = 'throw'; ui.hint('Aşağıdan yukarı kaydır, nişan al ve bırak'); }
  G.phase = prev; ui.lantern(true);
}
async function finishRun() {
  G.timerOn = false; G.phase = 'done'; busy = true;
  if (G.type === 'kopru') landFx(null);
  ui.lantern(false); ui.hint(''); heldBall.visible = false; if (G.type !== 'final') ui.setLeft(0);
  const L = G.level, total = G.elapsed + G.penaltySec, stars = starsFor(L, total);
  audio.sfx('win'); vibrate([20, 30, 60]);
  hero.tyaw = 0; cam.mode = 'victory'; cam.vang = 0.45;
  fxConfetti(hero.root.position.clone().add(new V3(0, 1.8, 0)), 70);
  await wait(0.3);
  if (stars === 3 && !RM) {
    hero.flip = true; heroState('flip'); const y0 = hero.root.position.y;
    await tween(0.62, t => { hero.spin.rotation.x = Math.PI * 2 * easeInOut(t); hero.root.position.y = y0 + Math.sin(t * Math.PI) * 1.0; });
    hero.spin.rotation.x = 0; hero.flip = false; landFx(null);
  }
  heroState('victory'); fxConfetti(hero.root.position.clone().add(new V3(0, 2, 0)), 40);
  await wait(1.1);
  showResults(total, stars);
}
function showResults(total, stars) {
  const L = G.level, D = store.data, prev = D.best[L.id], record = prev === undefined || total < prev - 1e-6;
  if (record) D.best[L.id] = Math.round(total * 100) / 100;
  D.stars[L.id] = Math.max(D.stars[L.id] || 0, stars);
  if (!L.daily) D.unlocked = Math.max(D.unlocked, Math.min(LEVELS.length, L.n + 1));
  store.save();
  const pens = G.type === 'kopru'
    ? [{ label: 'Yanlış taş', n: G.pen.wrong, sec: 4 }, { label: 'Fener', n: G.pen.lantern, sec: 6 }]
    : G.type === 'final' ? [{ label: 'Iska', n: G.pen.miss, sec: 3 }]
    : [{ label: 'Iska / yanlış hedef', n: G.pen.miss, sec: 3 }, { label: 'Fener', n: G.pen.lantern, sec: 6 }];
  G.result = { total, stars, record };
  ui.results({ final: G.type === 'final', L, raw: G.elapsed, total, pens, stars, record, best: D.best[L.id], times: starTimes(L), hasNext: !L.daily && L.n < LEVELS.length });
}

// ---------- başlatma ----------
function start(L) {
  G.level = L; G.paused = false;
  G.seed = L.daily ? L.seed : (Math.random() * 1e9) | 0;
  const rng = mulberry32(G.seed);
  if (L.type === 'kopru') startBridge(L, rng); else if (L.type === 'final') startFinal(L); else startTargets(L, rng);
}

// ---------- girdi ----------
const ptr = { id: null, x0: 0, y0: 0, t0: 0, aiming: false, a: null };
canvas.addEventListener('pointerdown', e => {
  if (ptr.id !== null) return;
  Object.assign(ptr, { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), a: null });
  // Final: alt güvenli bölgede geri çek (sapan). Hedef Dizisi: alttan yukarı kaydır.
  ptr.aiming = isThrow() && G.phase === 'aim' && !G.paused && !B.on && e.clientY > innerHeight * (G.type === 'final' ? 0.4 : 0.3);
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* yok */ }
});
function aimFrom(dx, dy) {
  if (G.type === 'final') { const pull = -dy; return pull < 14 ? null : { pull, power: clamp(pull / (innerHeight * 0.28), 0, 1), yaw: clamp(Math.atan2(-dx, pull) * 0.6, -0.5, 0.5) }; }
  return dy < 14 ? null : { pull: dy, power: clamp(dy / (innerHeight * 0.42), 0, 1), yaw: clamp(Math.atan2(dx, dy) * 0.55, -0.55, 0.55) };
}
canvas.addEventListener('pointermove', e => {
  if (e.pointerId !== ptr.id || !ptr.aiming || G.phase !== 'aim') return;
  const a = aimFrom(e.clientX - ptr.x0, ptr.y0 - e.clientY);
  if (a) {
    ptr.a = a; showAim(a.yaw, a.power); ui.power(a.power);
    if (G.type === 'final' && !store.data.tips.final) ui.hint('Atmak için bırak');
  } else if (ptr.a) { ptr.a = null; hideAim(); if (G.type === 'final' && !store.data.tips.final) ui.hint('Nişan almak için geri çek'); }
});
function endPtr(e, cancel) {
  if (e.pointerId !== ptr.id) return;
  ptr.id = null; hideAim();
  if (cancel) return;
  const dx = e.clientX - ptr.x0, dy = ptr.y0 - e.clientY, dt = performance.now() - ptr.t0;
  if (isThrow()) {
    if (ptr.aiming && ptr.a && ptr.a.pull > 24 && ptr.a.power > 0.06) throwBall(ptr.a.yaw, ptr.a.power);
    else if (G.phase === 'aim' && Math.hypot(dx, dy) < 20) ui.hint(G.type === 'final' ? 'Nişan almak için geri çek' : 'Aşağıdan yukarı kaydır, nişan al ve bırak', true);
  } else if (G.type === 'kopru') {
    if (Math.hypot(dx, dy) < 24 && dt < 600) tapAt(e.clientX, e.clientY);
    else if (dy > 40 && Math.abs(dx) < dy * 2.4) { const a = Math.atan2(dx, dy); requestJump(a < -0.38 ? 0 : a > 0.38 ? 2 : 1); }
  }
}
canvas.addEventListener('pointerup', e => endPtr(e, false));
canvas.addEventListener('pointercancel', e => endPtr(e, true));
function tapAt(x, y) {
  if (G.phase !== 'play') { if (G.phase === 'memorize') ui.hint('Önce ezberle!', true); return; }
  const nr = busy ? jumpRow + 1 : G.row + 1;
  if (nr >= G.rows) { requestJump(1); return; }
  let best = -1, bd = Infinity;
  for (let c = 0; c < 3; c++) { const p = plats[nr][c]; if (p.broken) continue; const s = toScreen(p.x, TOP, p.z), d = Math.hypot(s.x - x, s.y - y); if (d < bd) { bd = d; best = c; } }
  if (best >= 0 && bd < Math.max(120, innerWidth * 0.32)) requestJump(best);
}
addEventListener('keydown', e => {
  if (G.type !== 'kopru' || ui.screen !== 'game') return;
  const k = { ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2, a: 0, w: 1, d: 2 }[e.key];
  if (k !== undefined) requestJump(k);
});
document.addEventListener('visibilitychange', () => { if (document.hidden && ui.screen === 'game' && G.type && G.phase !== 'done' && !G.paused) { G.paused = true; ui.overlay('pause', true); } });

// ---------- döngü ----------
let last = performance.now(), wt = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const rdt = Math.min((now - last) / 1000, 0.1); last = now;
  let dt = G.paused ? 0 : rdt * G.timeScale;
  if (G.freeze > 0) { G.freeze -= rdt; dt = 0; }
  clock += dt; runTasks();
  if (G.timerOn && !G.paused) G.elapsed += dt;
  if (G.type && ui.screen === 'game') ui.setTime(G.elapsed + G.penaltySec);
  wt += rdt; waterMat.uniforms.uT.value = wt;
  updateHero(dt); updSys(PB, dt); updSys(PF, dt); updateBall(dt); updateTrail();
  for (let r = 0; r < plats.length; r++) for (const p of plats[r]) if (p.halves) updateHalves(p);
  // ipucu halkaları
  const showH = G.type === 'kopru' && G.phase === 'play' && !busy, nr = G.row + 1;
  for (let c = 0; c < 3; c++) {
    const m = hintRings[c]; let p = nr < G.rows && plats[nr] ? plats[nr][c] : null;
    if (nr >= G.rows && c === 1) p = { ...finishSpot(), broken: false, z: finishSpot().z };
    m.visible = !!(showH && p && !p.broken);
    if (m.visible) { const w = Math.sin(wt * 5 + c * 0.7); m.position.set(p.x, TOP + 0.03, p.z); m.material.opacity = 0.35 + 0.25 * w; m.scale.setScalar(1 + 0.05 * w); }
  }
  // rüzgâr bayrağı
  if (flag) { const w = G.type === 'hedef' ? G.wind : 0.6, dir = w < 0 ? -1 : 1, sx = dir * (0.9 + Math.sin(wt * (4 + Math.abs(w) * 2.5)) * (0.04 + Math.abs(w) * 0.02)); flag.scale.x = sx; flag.position.x = 0.06 * (1 - sx); }
  updateCamera(G.paused ? 0 : rdt);
  const f = hero.root.position; sun.target.position.set(f.x, 0, f.z - 3); sun.position.copy(sun.target.position).add(SUN_OFF);
  sky.position.copy(camera.position);
  renderer.render(scene, camera);
}

// ---------- açılış ----------
const api = {
  onScreen(name) { G.screen = name; },
  skipSplash() { if (G.ready && ui.screen === 'splash') ui.show('menu'); },
  setChar(c) { setHeroModel(c); },
  start(L) { start(L); },
  restart() { if (G.level) start(G.level); },
  toMenu() { toMenu(); },
  pause() { if (!G.type || G.phase === 'done') return false; G.paused = true; return true; },
  resume() { G.paused = false; last = performance.now(); },
  lantern() { lantern(); },
};
async function boot() {
  ui.init(api);
  setHeroModel(store.data.char);
  placeHero(DOCK_SPOT.clone().setZ(1.6), 0.3);
  requestAnimationFrame(frame);
  const t0 = performance.now(), loader = new GLTFLoader();
  try {
    const gltf = await loader.loadAsync('assets/ortam_uclu_kopru.glb', e => { if (e.total) ui.setLoad(e.loaded / e.total); });
    setupWorld(gltf.scene);
  } catch (e) {
    ui.setLoad(1, 'Ada yüklenemedi. Sayfayı yenileyin.'); console.warn(e); return;
  }
  loadCharModels(loader);
  toMenu(); cam.snap = true;
  ui.setLoad(1, 'Hazır!'); G.ready = true;
  setTimeout(() => { if (ui.screen === 'splash') ui.show('menu'); }, Math.max(0, 1500 - (performance.now() - t0)));
}
boot();

// ---------- test arayüzü ----------
window.__ada = {
  state: G,
  levels: LEVELS,
  startLevel(n) { const L = n === 'G' ? dailyLevel() : LEVELS[n - 1]; ui.overlay('intro', false); ui.overlay('results', false); return ui.show('game', () => start(L)); },
  skipMemorize() { G.skip = true; },
  speed(k) { G.timeScale = k; },
  pattern: () => G.pattern.slice(),
  platformScreen(r, c) { const p = plats[r][c]; return toScreen(p.x, TOP, p.z); },
  jump(c) { requestJump(c); },
  targets: () => targets.map(t => ({ i: t.i, x: t.x, z: t.z, cy: t.cy, done: t.done })),
  solveThrow(i) {
    const t = targets[i]; let best = null;
    for (let yaw = -0.55; yaw <= 0.55; yaw += 0.01) for (let pw = 0; pw <= 1; pw += 0.01) {
      const s = launchState(yaw, pw); let r = null; for (let k = 0; k < 900 && !r; k++) r = stepSim(s, G.wind);
      if (r && r.hit === t) { const sc = Math.abs(s.p.x - t.x) + Math.abs(s.p.y - t.cy); if (!best || sc < best.sc) best = { yaw, power: pw, sc }; }
    }
    return best;
  },
  throwBall,
  pause: () => api.pause(), resume: () => api.resume(),
};
