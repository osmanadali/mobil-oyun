/* Kut Arena — efekt kütüphanesi (vfx). Kurallar: ../ANIMASYON_PLANI.md
   - Bütün dokular kodla (canvas) bir kez üretilen tek atlasta; dış dosya, WebAssembly, Worker, blob/data fetch YOK.
   - Parçacıklar iki havuzda (additive + normal karışım), her biri TEK InstancedMesh + özel ShaderMaterial:
     yüz kameraya dönük (0), yere yatık (1) ya da bir eksen boyunca uzayan (2: ışın, yıldırım, iz, kıvılcım).
   - Her şey önceden ayrılır: efekt başına yeni Geometry/Material üretilmez.
   - Görsel zaman: guncelle(dt) ne verilirse onu kullanır (hit-stop/yavaşlatma görüntüye aittir, motora dokunmaz).
   Kullanım: import { vfx } from './vfx.js'; vfx.kur(sahne, kamera, { kalite: 'yuksek' }); her karede vfx.guncelle(dt). */
import * as THREE from 'three';
import { mergeGeometries } from '../vendor/three/addons/utils/BufferGeometryUtils.js';

// ───────────────────────── yardımcılar ─────────────────────────
const RND = Math.random;
const rr = (a, b) => a + (b - a) * RND();
const TAU = Math.PI * 2;
const RENK_ON = new Map();
function rgb(c) { // sRGB 0..1 dizi (efekt renkleri gama uzayında karışır: doygun, mobil oyun görünümü)
  if (Array.isArray(c)) return c;
  if (c && c.isColor) { const t = {}; c.getRGB(t, THREE.SRGBColorSpace); return [t.r, t.g, t.b]; }
  if (typeof c === 'number') return [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255];
  let v = RENK_ON.get(c); if (v) return v;
  let s = String(c || '#ffffff').trim(); if (s[0] === '#') s = s.slice(1); if (s.length === 3) s = s.split('').map(h => h + h).join('');
  const n = parseInt(s, 16) || 0xffffff; v = [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; RENK_ON.set(c, v); return v;
}
function karis(a, b, k) { const x = rgb(a), y = rgb(b); return [x[0] + (y[0] - x[0]) * k, x[1] + (y[1] - x[1]) * k, x[2] + (y[2] - x[2]) * k]; }
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _v4 = new THREE.Vector3();
function konum(p, out = new THREE.Vector3()) { // Vector3 | Object3D | {x,y,z}
  if (!p) return out.set(0, 0, 0);
  if (p.isObject3D) return p.getWorldPosition(out);
  return out.set(p.x || 0, p.y || 0, p.z || 0);
}

// ───────────────────────── doku atlası ─────────────────────────
const IZGARA = 6;
const KARE = { parilti: 0, yildiz4: 1, yildiz6: 2, halka: 3, duman: 4, kesik: 5, run: 6, alev: 7, buz: 8, yaprak: 9, damla: 10, isin: 11, tuy: 12, goz: 13, catlak: 14,
  kabarcik: 15, tas: 16, kivilcim: 17, sok: 18, kar: 19, pence: 20, arti: 21, dalga: 22, girdap: 23, toz: 24,
  run_kut: 25, run_golge: 26, run_ates: 27, kafatasi: 28, catlakYer: 29, nota: 30, kalp: 31 };
function mulberry(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function atlasUret(C) {
  const G = IZGARA, cv = document.createElement('canvas'); cv.width = cv.height = C * G;
  const x = cv.getContext('2d'); const R = mulberry(11);
  const g = (v, a) => `rgba(${v | 0},${v | 0},${v | 0},${a})`;
  const radyal = (r, st, ox = 0, oy = 0, cx = 0, cy = 0) => { const gr = x.createRadialGradient(ox, oy, 0, cx, cy, r); for (const [o, v, a] of st) gr.addColorStop(o, g(v, a)); return gr; };
  const dogrusal = (x0, y0, x1, y1, st) => { const gr = x.createLinearGradient(x0, y0, x1, y1); for (const [o, v, a] of st) gr.addColorStop(o, g(v, a)); return gr; };
  const parla = (b = 0.06, a = 0.85) => { x.shadowColor = g(255, a); x.shadowBlur = C * b; };
  const sondur = () => { x.shadowBlur = 0; x.shadowColor = 'rgba(0,0,0,0)'; };
  const ciz = (i, fn) => { const cx = (i % G) * C, cy = Math.floor(i / G) * C; x.save(); x.beginPath(); x.rect(cx, cy, C, C); x.clip(); x.translate(cx + C / 2, cy + C / 2); fn(C / 2 * 0.92); x.restore(); };
  const hilal = (Rr, kal, a0, a1, adim = 28) => { // ucları incelen hilal (kesik izi)
    x.beginPath();
    for (let i = 0; i <= adim; i++) { const t = i / adim, a = a0 + (a1 - a0) * t; i ? x.lineTo(Math.cos(a) * Rr, Math.sin(a) * Rr) : x.moveTo(Math.cos(a) * Rr, Math.sin(a) * Rr); }
    for (let i = adim; i >= 0; i--) { const t = i / adim, a = a0 + (a1 - a0) * t, r2 = Rr - kal * Math.pow(Math.sin(Math.PI * t), 0.8); x.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); }
    x.closePath();
  };
  const yildizYol = (uclar, ri, faz = -Math.PI / 2) => { // içbükey kenarlı yıldız
    const n = uclar.length; x.beginPath();
    for (let k = 0; k < n; k++) { const a = faz + k * TAU / n, b = a + TAU / n, m = a + Math.PI / n;
      if (!k) x.moveTo(Math.cos(a) * uclar[k], Math.sin(a) * uclar[k]);
      x.quadraticCurveTo(Math.cos(m) * ri, Math.sin(m) * ri, Math.cos(b) * uclar[(k + 1) % n], Math.sin(b) * uclar[(k + 1) % n]); }
    x.closePath();
  };
  const bulut = (r, koyu, opak) => { // üst üste boyanmış topaklar: el boyaması duman/toz
    const t = []; for (let i = 0; i < 11; i++) { const a = R() * TAU, d = R() * r * 0.42; t.push([Math.cos(a) * d, Math.sin(a) * d * 0.8 + r * 0.05, r * (0.3 + R() * 0.24)]); }
    t.sort((a, b) => b[1] - a[1]); // alttakiler önce (koyu), üsttekiler sonra (açık)
    for (const [cx, cy, rad] of t) { const alt = (cy / r + 0.5); const v0 = 255, v1 = 255 - koyu * Math.min(1, Math.max(0, alt));
      x.fillStyle = radyal(rad, [[0, v0, opak], [0.55, (v0 + v1) / 2, opak * 0.85], [1, v1, 0]], cx - rad * 0.3, cy - rad * 0.35, cx, cy);
      x.beginPath(); x.arc(cx, cy, rad, 0, TAU); x.fill(); }
  };
  // 0 parıltı
  ciz(KARE.parilti, r => { x.fillStyle = radyal(r, [[0, 255, 1], [0.1, 255, 0.95], [0.28, 225, 0.5], [0.55, 190, 0.16], [0.8, 170, 0.04], [1, 160, 0]]); x.fillRect(-r * 1.1, -r * 1.1, r * 2.2, r * 2.2); });
  // 1 dört köşeli yıldız (kıvılcım parıltısı)
  ciz(KARE.yildiz4, r => {
    x.fillStyle = radyal(r * 0.55, [[0, 255, 0.7], [0.4, 220, 0.25], [1, 200, 0]]); x.fillRect(-r, -r, r * 2, r * 2);
    parla(0.05, 0.9); yildizYol([r, r * 0.95, r, r * 0.95], r * 0.1); x.fillStyle = radyal(r, [[0, 255, 1], [0.3, 245, 1], [1, 190, 0.9]]); x.fill();
    x.rotate(Math.PI / 4); yildizYol([r * 0.42, r * 0.42, r * 0.42, r * 0.42], r * 0.07); x.fill(); sondur();
  });
  // 2 altı köşeli yıldız
  ciz(KARE.yildiz6, r => {
    x.fillStyle = radyal(r * 0.6, [[0, 255, 0.75], [0.5, 220, 0.2], [1, 200, 0]]); x.fillRect(-r, -r, r * 2, r * 2);
    parla(0.05, 0.9); const u = []; for (let k = 0; k < 12; k++) u.push(k % 2 ? r * 0.5 : r); yildizYol(u, r * 0.13);
    x.fillStyle = radyal(r, [[0, 255, 1], [0.35, 240, 1], [1, 185, 0.85]]); x.fill(); sondur();
    x.fillStyle = g(255, 1); x.beginPath(); x.arc(0, 0, r * 0.12, 0, TAU); x.fill();
  });
  // 3 halka (yumuşak)
  ciz(KARE.halka, r => { x.fillStyle = radyal(r, [[0, 200, 0], [0.58, 200, 0], [0.76, 230, 0.5], [0.87, 255, 1], [0.93, 235, 0.6], [1, 200, 0]]); x.fillRect(-r * 1.1, -r * 1.1, r * 2.2, r * 2.2); });
  // 4 duman bulutu
  ciz(KARE.duman, r => bulut(r, 85, 0.8));
  // 5 yay kesik izi
  ciz(KARE.kesik, r => {
    x.translate(0, r * 0.48); parla(0.05, 0.7);
    hilal(r, r * 0.36, Math.PI * 1.1, Math.PI * 1.9); x.fillStyle = dogrusal(0, -r, 0, -r * 0.3, [[0, 255, 1], [0.5, 230, 0.9], [1, 190, 0.35]]); x.fill(); sondur();
    hilal(r, r * 0.1, Math.PI * 1.13, Math.PI * 1.87); x.fillStyle = g(255, 1); x.fill();
  });
  // 6 rün çemberi
  ciz(KARE.run, r => {
    parla(0.035, 0.9); x.strokeStyle = g(255, 1); x.lineCap = 'round';
    x.lineWidth = C * 0.02; x.beginPath(); x.arc(0, 0, r * 0.97, 0, TAU); x.stroke();
    x.lineWidth = C * 0.012; x.beginPath(); x.arc(0, 0, r * 0.8, 0, TAU); x.stroke();
    x.beginPath(); x.arc(0, 0, r * 0.4, 0, TAU); x.stroke();
    // altıgram
    x.lineWidth = C * 0.011; for (const f of [0, Math.PI]) { x.beginPath(); for (let k = 0; k <= 3; k++) { const a = f - Math.PI / 2 + k * TAU / 3; k ? x.lineTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8) : x.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8); } x.stroke(); }
    // rünler (Göktürk havasında çentikler)
    x.lineWidth = C * 0.012; const n = 14;
    for (let k = 0; k < n; k++) { x.save(); x.rotate(k * TAU / n); x.translate(0, -r * 0.885); const w = r * 0.06; x.beginPath();
      const tip = k % 4; if (tip === 0) { x.moveTo(-w, -w); x.lineTo(0, w); x.lineTo(w, -w); } else if (tip === 1) { x.moveTo(0, -w); x.lineTo(0, w); x.moveTo(-w, 0); x.lineTo(w * 0.6, -w * 0.8); }
      else if (tip === 2) { x.moveTo(-w, w); x.lineTo(-w, -w); x.lineTo(w, w); x.lineTo(w, -w); } else { x.moveTo(-w * 0.7, -w); x.lineTo(w * 0.7, 0); x.lineTo(-w * 0.7, w); }
      x.stroke(); x.restore(); }
    // iç noktalar
    for (let k = 0; k < 6; k++) { const a = k * TAU / 6; x.fillStyle = g(255, 1); x.beginPath(); x.arc(Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4, C * 0.012, 0, TAU); x.fill(); }
    sondur(); x.fillStyle = radyal(r * 0.4, [[0, 255, 0.35], [1, 220, 0]]); x.beginPath(); x.arc(0, 0, r * 0.4, 0, TAU); x.fill();
  });
  // 7 alev dili
  ciz(KARE.alev, r => {
    const dil = (s, oy) => { x.beginPath(); x.moveTo(r * 0.1 * s, -r * 0.95 * s + oy);
      x.bezierCurveTo(r * 0.3 * s, -r * 0.5 * s + oy, r * 0.62 * s, -r * 0.1 * s + oy, r * 0.52 * s, r * 0.38 * s + oy);
      x.bezierCurveTo(r * 0.42 * s, r * 0.86 * s + oy, -r * 0.42 * s, r * 0.86 * s + oy, -r * 0.52 * s, r * 0.38 * s + oy);
      x.bezierCurveTo(-r * 0.62 * s, -r * 0.05 * s + oy, -r * 0.2 * s, -r * 0.42 * s + oy, r * 0.1 * s, -r * 0.95 * s + oy); x.closePath(); };
    parla(0.05, 0.6); dil(1, 0); x.fillStyle = dogrusal(0, r * 0.8, 0, -r, [[0, 240, 1], [0.45, 215, 0.95], [1, 175, 0.55]]); x.fill(); sondur();
    dil(0.55, r * 0.33); x.fillStyle = dogrusal(0, r * 0.8, 0, -r * 0.3, [[0, 255, 1], [1, 250, 0.9]]); x.fill();
  });
  // 8 buz kristali (yönlü parlak/koyu yüzeyler)
  ciz(KARE.buz, r => {
    const kiymik = (aci, L, w) => { x.save(); x.translate(0, r * 0.72); x.rotate(aci);
      const yol = () => { x.beginPath(); x.moveTo(0, -L); x.lineTo(w, -L + w * 1.3); x.lineTo(w, 0); x.lineTo(0, w * 0.7); x.lineTo(-w, 0); x.lineTo(-w, -L + w * 1.3); x.closePath(); };
      parla(0.04, 0.7); yol(); x.fillStyle = g(175, 0.92); x.fill(); sondur();
      x.beginPath(); x.moveTo(0, -L); x.lineTo(-w, -L + w * 1.3); x.lineTo(-w, 0); x.lineTo(0, w * 0.7); x.closePath(); x.fillStyle = g(245, 0.95); x.fill();
      yol(); x.strokeStyle = g(255, 1); x.lineWidth = C * 0.01; x.stroke(); x.restore(); };
    kiymik(-0.55, r * 1.05, r * 0.17); kiymik(0.6, r * 0.95, r * 0.15); kiymik(0.05, r * 1.6, r * 0.22);
  });
  // 9 yaprak
  ciz(KARE.yaprak, r => {
    x.rotate(0.35); x.beginPath(); x.moveTo(0, -r * 0.95); x.quadraticCurveTo(r * 0.78, -r * 0.3, 0, r * 0.78); x.quadraticCurveTo(-r * 0.78, -r * 0.3, 0, -r * 0.95); x.closePath();
    x.fillStyle = dogrusal(-r * 0.5, 0, r * 0.5, 0, [[0, 250, 1], [1, 175, 1]]); x.fill();
    x.strokeStyle = g(120, 0.9); x.lineWidth = C * 0.014; x.beginPath(); x.moveTo(0, -r * 0.85); x.lineTo(0, r * 0.98); x.stroke();
    x.lineWidth = C * 0.008; for (let k = 1; k <= 4; k++) { const y = -r * 0.6 + k * r * 0.28; x.beginPath(); x.moveTo(0, y); x.lineTo(r * 0.3, y - r * 0.2); x.moveTo(0, y); x.lineTo(-r * 0.3, y - r * 0.2); x.stroke(); }
  });
  // 10 damla (sivri ucu altta: hız yönünde uzatıldığında arkada kalır)
  ciz(KARE.damla, r => {
    x.beginPath(); x.moveTo(0, r * 0.95); x.bezierCurveTo(r * 0.22, r * 0.5, r * 0.55, r * 0.1, r * 0.55, -r * 0.25); x.arc(0, -r * 0.25, r * 0.55, 0, Math.PI, true);
    x.bezierCurveTo(-r * 0.55, r * 0.1, -r * 0.22, r * 0.5, 0, r * 0.95); x.closePath();
    x.fillStyle = radyal(r * 0.7, [[0, 200, 0.95], [0.7, 230, 0.95], [1, 255, 1]], 0, -r * 0.25, 0, -r * 0.25); x.fill();
    x.fillStyle = g(255, 1); x.beginPath(); x.ellipse(-r * 0.2, -r * 0.45, r * 0.12, r * 0.18, -0.5, 0, TAU); x.fill();
  });
  // 11 ışın (dikey: eksen boyunca uzatılır)
  ciz(KARE.isin, r => {
    x.fillStyle = dogrusal(-r, 0, r, 0, [[0, 180, 0], [0.25, 190, 0.12], [0.4, 230, 0.6], [0.47, 255, 1], [0.53, 255, 1], [0.6, 230, 0.6], [0.75, 190, 0.12], [1, 180, 0]]);
    x.fillRect(-r * 1.1, -r * 1.1, r * 2.2, r * 2.2);
    x.globalCompositeOperation = 'destination-in'; x.fillStyle = dogrusal(0, -r * 1.08, 0, r * 1.08, [[0, 255, 0], [0.14, 255, 1], [0.86, 255, 1], [1, 255, 0]]); x.fillRect(-r * 1.1, -r * 1.1, r * 2.2, r * 2.2);
    x.globalCompositeOperation = 'source-over';
  });
  // 12 tüy
  ciz(KARE.tuy, r => {
    x.rotate(-0.25); const q = (t) => { const y = r * 0.95 - t * r * 1.9; return [Math.sin(t * Math.PI) * r * 0.12, y]; };
    x.beginPath(); for (let i = 0; i <= 20; i++) { const t = i / 20, [qx, qy] = q(t), w = Math.sin(Math.min(1, t * 1.15) * Math.PI) * r * 0.36 * (t > 0.1 ? 1 : t * 10); i ? x.lineTo(qx + w, qy) : x.moveTo(qx + w, qy); }
    for (let i = 20; i >= 0; i--) { const t = i / 20, [qx, qy] = q(t), w = Math.sin(Math.min(1, t * 1.15) * Math.PI) * r * 0.32 * (t > 0.1 ? 1 : t * 10); x.lineTo(qx - w, qy); }
    x.closePath(); x.fillStyle = dogrusal(-r * 0.4, 0, r * 0.4, 0, [[0, 205, 0.85], [0.5, 250, 0.95], [1, 205, 0.85]]); x.fill();
    x.strokeStyle = g(255, 0.6); x.lineWidth = C * 0.005; for (let i = 3; i < 19; i++) { const t = i / 20, [qx, qy] = q(t), w = Math.sin(t * Math.PI) * r * 0.32; x.beginPath(); x.moveTo(qx, qy); x.lineTo(qx + w, qy - r * 0.12); x.moveTo(qx, qy); x.lineTo(qx - w, qy - r * 0.12); x.stroke(); }
    x.strokeStyle = g(255, 1); x.lineWidth = C * 0.014; x.beginPath(); for (let i = 0; i <= 20; i++) { const [qx, qy] = q(i / 20); i ? x.lineTo(qx, qy) : x.moveTo(qx, qy); } x.stroke();
  });
  // 13 lanet gözü
  ciz(KARE.goz, r => {
    x.fillStyle = radyal(r, [[0, 220, 0.5], [0.6, 200, 0.15], [1, 200, 0]]); x.fillRect(-r, -r, r * 2, r * 2);
    parla(0.06, 0.9); x.strokeStyle = g(255, 1); x.lineWidth = C * 0.03; x.lineCap = 'round';
    for (let k = 0; k < 7; k++) { const a = Math.PI * (1.15 + k * 0.7 / 6); x.beginPath(); x.moveTo(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62); x.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9); x.stroke(); }
    x.beginPath(); x.moveTo(-r * 0.92, 0); x.quadraticCurveTo(0, -r * 0.8, r * 0.92, 0); x.quadraticCurveTo(0, r * 0.8, -r * 0.92, 0); x.closePath();
    x.fillStyle = g(95, 0.95); x.fill(); x.stroke(); sondur();
    x.fillStyle = radyal(r * 0.34, [[0, 255, 1], [0.7, 225, 1], [1, 170, 1]]); x.beginPath(); x.arc(0, 0, r * 0.33, 0, TAU); x.fill();
    x.fillStyle = g(15, 1); x.beginPath(); x.ellipse(0, 0, r * 0.08, r * 0.27, 0, 0, TAU); x.fill();
    x.fillStyle = g(255, 1); x.beginPath(); x.arc(-r * 0.12, -r * 0.12, r * 0.06, 0, TAU); x.fill();
  });
  // 14 çatlak / yanık izi
  ciz(KARE.catlak, r => {
    x.fillStyle = radyal(r, [[0, 255, 0.55], [0.45, 255, 0.35], [0.8, 255, 0.1], [1, 255, 0]]); x.fillRect(-r, -r, r * 2, r * 2);
    x.strokeStyle = g(255, 1); x.lineCap = 'round'; x.lineJoin = 'round';
    const dal = (px, py, a, L, w, d) => { let cx = px, cy = py; x.lineWidth = w; x.beginPath(); x.moveTo(cx, cy);
      const n = 5; for (let i = 0; i < n; i++) { a += (R() - 0.5) * 0.9; cx += Math.cos(a) * L / n; cy += Math.sin(a) * L / n; x.lineTo(cx, cy); if (d > 0 && R() < 0.35) { x.stroke(); dal(cx, cy, a + (R() < 0.5 ? 0.8 : -0.8), L * 0.45, w * 0.6, d - 1); x.lineWidth = w; x.beginPath(); x.moveTo(cx, cy); } }
      x.stroke(); };
    for (let k = 0; k < 7; k++) dal(0, 0, k * TAU / 7 + R() * 0.4, r * (0.6 + R() * 0.35), C * 0.03, 2);
    x.fillStyle = g(255, 1); x.beginPath(); x.arc(0, 0, r * 0.12, 0, TAU); x.fill();
  });
  // 15 kabarcık
  ciz(KARE.kabarcik, r => {
    x.fillStyle = radyal(r, [[0, 255, 0.06], [0.7, 255, 0.14], [0.88, 255, 0.65], [0.95, 255, 0.95], [1, 255, 0]]); x.beginPath(); x.arc(0, 0, r, 0, TAU); x.fill();
    x.fillStyle = g(255, 1); x.beginPath(); x.ellipse(-r * 0.38, -r * 0.4, r * 0.18, r * 0.1, -0.7, 0, TAU); x.fill();
    x.fillStyle = g(255, 0.5); x.beginPath(); x.arc(r * 0.4, r * 0.38, r * 0.07, 0, TAU); x.fill();
  });
  // 16 kaya parçası
  ciz(KARE.tas, r => {
    const n = 7, p = []; for (let k = 0; k < n; k++) { const a = k * TAU / n + R() * 0.4, d = r * (0.68 + R() * 0.28); p.push([Math.cos(a) * d, Math.sin(a) * d]); }
    const yol = (l) => { x.beginPath(); l.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); };
    yol(p); x.fillStyle = g(165, 1); x.fill();
    yol([[0, -r * 0.05], ...p.filter(([a, b]) => a + b < r * 0.25)]); x.fillStyle = g(240, 1); x.fill();
    yol([[r * 0.05, r * 0.05], ...p.filter(([a, b]) => a + b > r * 0.55)]); x.fillStyle = g(105, 1); x.fill();
    yol(p); x.strokeStyle = g(60, 1); x.lineWidth = C * 0.03; x.stroke();
  });
  // 17 kıvılcım çizgisi (baş yukarıda)
  ciz(KARE.kivilcim, r => {
    x.fillStyle = dogrusal(-r * 0.3, 0, r * 0.3, 0, [[0, 200, 0], [0.38, 230, 0.5], [0.5, 255, 1], [0.62, 230, 0.5], [1, 200, 0]]); x.fillRect(-r, -r * 1.1, r * 2, r * 2.2);
    x.globalCompositeOperation = 'destination-in'; x.fillStyle = dogrusal(0, -r * 1.05, 0, r * 1.05, [[0, 255, 0], [0.07, 255, 1], [0.4, 255, 0.75], [1, 255, 0]]); x.fillRect(-r, -r * 1.1, r * 2, r * 2.2);
    x.globalCompositeOperation = 'source-over';
  });
  // 18 şok halkası (fırça darbeli, sert kenar)
  ciz(KARE.sok, r => {
    x.fillStyle = radyal(r, [[0, 200, 0], [0.42, 200, 0], [0.68, 215, 0.22], [0.85, 250, 0.9], [0.91, 255, 1], [0.96, 230, 0.45], [1, 200, 0]]); x.fillRect(-r * 1.1, -r * 1.1, r * 2.2, r * 2.2);
    x.lineCap = 'round'; for (let k = 0; k < 14; k++) { const a = R() * TAU, b = a + 0.3 + R() * 0.6, rad = r * (0.74 + R() * 0.16); x.strokeStyle = g(255, 0.35 + R() * 0.4); x.lineWidth = C * (0.008 + R() * 0.02); x.beginPath(); x.arc(0, 0, rad, a, b); x.stroke(); }
  });
  // 19 kar tanesi
  ciz(KARE.kar, r => {
    parla(0.04, 0.9); x.strokeStyle = g(255, 1); x.lineCap = 'round'; x.lineWidth = C * 0.032;
    for (let k = 0; k < 6; k++) { x.save(); x.rotate(k * TAU / 6); x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -r * 0.95);
      for (const [d, l] of [[0.42, 0.28], [0.68, 0.2]]) { x.moveTo(0, -r * d); x.lineTo(r * l, -r * (d + l)); x.moveTo(0, -r * d); x.lineTo(-r * l, -r * (d + l)); } x.stroke(); x.restore(); }
    sondur(); x.fillStyle = g(255, 1); x.beginPath(); for (let k = 0; k < 6; k++) { const a = k * TAU / 6; k ? x.lineTo(Math.cos(a) * r * 0.16, Math.sin(a) * r * 0.16) : x.moveTo(Math.cos(a) * r * 0.16, Math.sin(a) * r * 0.16); } x.closePath(); x.fill();
  });
  // 20 pençe izi (üç paralel kesik)
  ciz(KARE.pence, r => {
    x.rotate(-0.55); parla(0.05, 0.8);
    for (const oy of [-0.34, 0, 0.34]) { x.save(); x.translate(r * oy * 0.25, r * (0.62 + oy)); hilal(r * 0.9, r * 0.17, Math.PI * 1.2, Math.PI * 1.8);
      x.fillStyle = dogrusal(0, -r * 0.9, 0, -r * 0.4, [[0, 255, 1], [1, 215, 0.85]]); x.fill(); x.restore(); }
    sondur();
  });
  // 21 artı (iyileşme)
  ciz(KARE.arti, r => {
    parla(0.08, 0.9); x.fillStyle = g(240, 1); const w = r * 0.34, L = r * 0.8;
    const yk = (a, b, c, d, rad) => { x.beginPath(); x.roundRect(a, b, c, d, rad); x.fill(); };
    yk(-w / 2, -L, w, L * 2, w * 0.3); yk(-L, -w / 2, L * 2, w, w * 0.3); sondur();
    x.fillStyle = g(255, 1); yk(-w * 0.28, -L * 0.85, w * 0.56, L * 1.7, w * 0.2); yk(-L * 0.85, -w * 0.28, L * 1.7, w * 0.56, w * 0.2);
  });
  // 22 ses dalgası (üç yay, yukarı açılır)
  ciz(KARE.dalga, r => {
    parla(0.05, 0.9); x.strokeStyle = g(255, 1); x.lineCap = 'round';
    [[0.4, 0.06], [0.66, 0.05], [0.92, 0.04]].forEach(([d, w]) => { x.lineWidth = C * w; x.beginPath(); x.arc(0, r * 0.75, r * d * 1.5, Math.PI * 1.27, Math.PI * 1.73); x.stroke(); });
  });
  // 23 girdap (rüzgâr)
  ciz(KARE.girdap, r => {
    x.lineCap = 'round'; parla(0.03, 0.7);
    for (let j = 0; j < 3; j++) { let px = 0, py = 0; for (let i = 1; i <= 30; i++) { const t = i / 30, a = j * TAU / 3 + t * 3.4, d = t * r * 0.95; const nx = Math.cos(a) * d, ny = Math.sin(a) * d;
      x.strokeStyle = g(255, Math.sin(Math.PI * t) * 0.95); x.lineWidth = C * 0.05 * Math.sin(Math.PI * t) + 1; x.beginPath(); x.moveTo(px, py); x.lineTo(nx, ny); x.stroke(); px = nx; py = ny; } }
    sondur();
  });
  // 24 toz (yoğun, altı koyu)
  ciz(KARE.toz, r => bulut(r, 120, 0.95));
  // 25 Kut rünü: sekiz köşeli güneş mührü (altın; yalnız Kut)
  ciz(KARE.run_kut, r => {
    parla(0.04, 0.9); x.strokeStyle = g(255, 1); x.lineCap = 'round'; x.lineJoin = 'round';
    x.lineWidth = C * 0.022; x.beginPath(); x.arc(0, 0, r * 0.96, 0, TAU); x.stroke();
    x.lineWidth = C * 0.01; x.beginPath(); x.arc(0, 0, r * 0.84, 0, TAU); x.stroke();
    const u = []; for (let k = 0; k < 16; k++) u.push(k % 2 ? r * 0.36 : r * 0.8); x.lineWidth = C * 0.016; yildizYol(u, r * 0.3); x.stroke();
    for (let k = 0; k < 8; k++) { x.save(); x.rotate(k * TAU / 8 + TAU / 16); x.beginPath(); x.moveTo(0, -r * 0.86); x.lineTo(0, -r * 0.94); x.stroke(); x.restore(); }
    sondur(); x.fillStyle = radyal(r * 0.34, [[0, 255, 0.9], [0.5, 240, 0.5], [1, 220, 0]]); x.beginPath(); x.arc(0, 0, r * 0.34, 0, TAU); x.fill();
  });
  // 26 gölge rünü: kırık halka + göz biçimi (mor)
  ciz(KARE.run_golge, r => {
    parla(0.04, 0.8); x.strokeStyle = g(255, 1); x.lineCap = 'round';
    x.lineWidth = C * 0.02; for (let k = 0; k < 7; k++) { const a = k * TAU / 7; x.beginPath(); x.arc(0, 0, r * 0.94, a + 0.12, a + TAU / 7 - 0.12); x.stroke(); }
    x.lineWidth = C * 0.016; x.beginPath(); x.moveTo(-r * 0.72, 0); x.quadraticCurveTo(0, -r * 0.55, r * 0.72, 0); x.quadraticCurveTo(0, r * 0.55, -r * 0.72, 0); x.stroke();
    x.beginPath(); x.arc(0, 0, r * 0.18, 0, TAU); x.stroke();
    for (let k = 0; k < 10; k++) { x.save(); x.rotate(k * TAU / 10); x.beginPath(); x.moveTo(0, -r * 0.62); x.lineTo(r * 0.05, -r * 0.8); x.stroke(); x.restore(); }
    sondur();
  });
  // 27 ateş rünü: alev dişli halka (turuncu)
  ciz(KARE.run_ates, r => {
    parla(0.04, 0.8); x.strokeStyle = g(255, 1); x.lineWidth = C * 0.018; x.lineJoin = 'round';
    x.beginPath(); for (let k = 0; k <= 48; k++) { const a = k * TAU / 48, rr2 = r * (k % 2 ? 0.8 : 0.96); k ? x.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2) : x.moveTo(Math.cos(a) * rr2, Math.sin(a) * rr2); } x.stroke();
    x.beginPath(); x.arc(0, 0, r * 0.6, 0, TAU); x.stroke(); sondur();
  });
  // 28 kafatası/zehir damlası simgesi (zehir durumu)
  ciz(KARE.kafatasi, r => {
    x.fillStyle = g(250, 1); x.beginPath(); x.ellipse(0, -r * 0.12, r * 0.62, r * 0.56, 0, 0, TAU); x.fill(); x.beginPath(); x.roundRect(-r * 0.36, r * 0.2, r * 0.72, r * 0.42, r * 0.1); x.fill();
    x.fillStyle = g(30, 1); x.beginPath(); x.ellipse(-r * 0.24, -r * 0.1, r * 0.15, r * 0.18, 0, 0, TAU); x.fill(); x.beginPath(); x.ellipse(r * 0.24, -r * 0.1, r * 0.15, r * 0.18, 0, 0, TAU); x.fill();
    x.fillRect(-r * 0.2, r * 0.36, r * 0.06, r * 0.22); x.fillRect(-r * 0.03, r * 0.36, r * 0.06, r * 0.22); x.fillRect(r * 0.14, r * 0.36, r * 0.06, r * 0.22);
    x.strokeStyle = g(40, 1); x.lineWidth = C * 0.02; x.beginPath(); x.ellipse(0, -r * 0.12, r * 0.62, r * 0.56, 0, 0, TAU); x.stroke();
  });
  // 29 yer çatlağı (koyu, keskin; boynuz/toynak vuruşu)
  ciz(KARE.catlakYer, r => {
    x.strokeStyle = g(255, 1); x.lineCap = 'round'; x.lineJoin = 'round';
    const dal = (px, py, a, L, w, d) => { let cx = px, cy = py; x.lineWidth = w; x.beginPath(); x.moveTo(cx, cy);
      for (let i = 0; i < 4; i++) { a += (R() - 0.5) * 0.8; cx += Math.cos(a) * L / 4; cy += Math.sin(a) * L / 4; x.lineTo(cx, cy); if (d > 0 && R() < 0.4) { x.stroke(); dal(cx, cy, a + (R() < 0.5 ? 0.7 : -0.7), L * 0.5, w * 0.6, d - 1); x.lineWidth = w; x.beginPath(); x.moveTo(cx, cy); } }
      x.stroke(); };
    for (let k = 0; k < 6; k++) dal(0, 0, k * TAU / 6 + R() * 0.5, r * (0.7 + R() * 0.25), C * 0.026, 2);
  });
  // 30 müzik notası (Savaş Davulu: dalga değen dosttan yükselir)
  ciz(KARE.nota, r => {
    parla(0.05, 0.9); x.fillStyle = g(255, 1); x.strokeStyle = g(255, 1); x.lineCap = 'round';
    x.save(); x.translate(-r * 0.22, r * 0.52); x.rotate(-0.4); x.beginPath(); x.ellipse(0, 0, r * 0.32, r * 0.22, 0, 0, TAU); x.fill(); x.restore();
    x.lineWidth = C * 0.05; x.beginPath(); x.moveTo(r * 0.06, r * 0.48); x.lineTo(r * 0.06, -r * 0.86); x.stroke();
    x.lineWidth = C * 0.045; x.beginPath(); x.moveTo(r * 0.06, -r * 0.86); x.quadraticCurveTo(r * 0.62, -r * 0.62, r * 0.5, -r * 0.08); x.stroke(); sondur();
  });
  // 31 kalp (Can Emme: hedefin göğsünden sökülen can)
  ciz(KARE.kalp, r => {
    x.fillStyle = radyal(r, [[0, 255, 0.45], [0.6, 230, 0.18], [1, 200, 0]]); x.fillRect(-r, -r, r * 2, r * 2);
    parla(0.06, 0.9); x.beginPath(); x.moveTo(0, r * 0.72);
    x.bezierCurveTo(-r * 0.98, r * 0.02, -r * 0.62, -r * 0.8, 0, -r * 0.3);
    x.bezierCurveTo(r * 0.62, -r * 0.8, r * 0.98, r * 0.02, 0, r * 0.72); x.closePath();
    x.fillStyle = radyal(r * 0.85, [[0, 255, 1], [0.55, 232, 1], [1, 185, 1]], -r * 0.2, -r * 0.3, 0, 0); x.fill(); sondur();
    x.fillStyle = g(255, 1); x.beginPath(); x.ellipse(-r * 0.32, -r * 0.28, r * 0.13, r * 0.08, -0.6, 0, TAU); x.fill();
  });
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = 4;
  return { tex, cv };
}

// ───────────────────────── parçacık sistemi ─────────────────────────
const VS = `
attribute vec3 iPos; attribute vec4 iDir; attribute vec4 iCol; attribute vec4 iSz; attribute float iHot;
uniform float uG; uniform float uPad;
varying vec2 vUv; varying vec4 vCol; varying float vHot;
void main(){
  vec2 c = position.xy;
  vec2 s = c * iSz.xy;
  float cr = cos(iSz.z), sr = sin(iSz.z);
  vec2 q = vec2(s.x*cr - s.y*sr, s.x*sr + s.y*cr);
  float mode = iDir.w;
  if (mode < 0.5) {
    vec4 mv = viewMatrix * vec4(iPos, 1.0); mv.xy += q; gl_Position = projectionMatrix * mv;
  } else if (mode < 1.5) {
    gl_Position = projectionMatrix * viewMatrix * vec4(iPos + vec3(q.x, 0.0, -q.y), 1.0);
  } else {
    vec3 A = normalize(iDir.xyz + vec3(0.0, 1e-5, 0.0));
    vec3 V = normalize(cameraPosition - iPos);
    vec3 S = cross(A, V); float l = length(S); S = l > 1e-4 ? S / l : vec3(1.0, 0.0, 0.0);
    gl_Position = projectionMatrix * viewMatrix * vec4(iPos + S * s.x + A * s.y, 1.0);
  }
  float f = iSz.w; float col = mod(f, uG); float row = floor(f / uG + 0.001);
  vec2 u = uv * (1.0 - 2.0 * uPad) + uPad;
  vUv = vec2((col + u.x) / uG, 1.0 - (row + 1.0 - u.y) / uG);
  vCol = iCol; vHot = iHot;
}`;
const FS = `
uniform sampler2D uMap; uniform float uYogun;
varying vec2 vUv; varying vec4 vCol; varying float vHot;
void main(){
  vec4 t = texture2D(uMap, vUv);
  float a = t.a * vCol.a; if (a < 0.004) discard;
  float L = t.r;
  // renk dokunun parlaklığıyla gölgelenir (beyaza boğulmaz); yalnız en parlak çekirdek beyaza çıkar ve (yüksekte) HDR olur → yalnız o bloom alır
  vec3 c = vCol.rgb * (0.25 + 0.75 * L) * uYogun;
  c += vec3(smoothstep(0.85, 1.0, L) * vHot * 0.6 * uYogun);
  gl_FragColor = vec4(c, a);
}`;
// parçacık alanları (tek Float32Array, adım S)
const PX = 0, PY = 1, PZ = 2, VX = 3, VY = 4, VZ = 5, GR = 6, DRAG = 7, AGE = 8, LIFE = 9, S0 = 10, S1 = 11, EN = 12, UZ = 13,
  R0 = 14, G0 = 15, B0 = 16, R1 = 17, G1 = 18, B1 = 19, AL = 20, ROT = 21, ROTV = 22, FR = 23, MOD = 24, HOT = 25, UZAT = 26, DX = 27, DY = 28, DZ = 29,
  FI = 30, FO = 31, ORB = 32, OCX = 33, OCY = 34, OCZ = 35, ORAD = 36, OANG = 37, OW = 38, ORV = 39, SAL = 40, FAZ = 41, SEK = 42, TX = 43, TY = 44, TZ = 45, HOM = 46, HIZ = 47, YONR = 48, S = 49;

class Sistem {
  constructor(max, karisim, sira, harita, yogun = 1) {
    this.max = max; this.n = 0; this.d = new Float32Array(max * S); this.tk = new Array(max).fill(null);
    const g = new THREE.InstancedBufferGeometry(); const pl = new THREE.PlaneGeometry(1, 1);
    g.index = pl.index; g.setAttribute('position', pl.attributes.position); g.setAttribute('uv', pl.attributes.uv);
    const at = (ad, k) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(max * k), k); a.setUsage(THREE.DynamicDrawUsage); g.setAttribute(ad, a); return a; };
    this.aPos = at('iPos', 3); this.aDir = at('iDir', 4); this.aCol = at('iCol', 4); this.aSz = at('iSz', 4); this.aHot = at('iHot', 1);
    g.instanceCount = 0; this.g = g; this.attrlar = [this.aPos, this.aDir, this.aCol, this.aSz, this.aHot];
    this.mat = new THREE.ShaderMaterial({ uniforms: { uMap: { value: harita }, uG: { value: IZGARA }, uPad: { value: 0.015 }, uYogun: { value: yogun } }, vertexShader: VS, fragmentShader: FS,
      transparent: true, depthWrite: false, depthTest: true, blending: karisim, side: THREE.DoubleSide, fog: false });
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = sira; this.mesh.name = 'vfx_parcacik';
  }
  ekle(on = 1) { if (this.n >= this.max) return -1; if (on < 2 && this.n > this.max * (on ? 0.95 : 0.85)) return -1; const i = this.n++; this.d.fill(0, i * S, i * S + S); this.tk[i] = null; return i; }
  sil(i) { const son = this.n - 1; if (i !== son) { this.d.copyWithin(i * S, son * S, son * S + S); this.tk[i] = this.tk[son]; } this.tk[son] = null; this.n--; }
  guncelle(dt) {
    const d = this.d; let i = 0;
    while (i < this.n) {
      const o = i * S;
      if (d[o + LIFE] < 0) { this.sil(i); continue; }          // tek karelik parçacık
      d[o + AGE] += dt; if (d[o + AGE] >= d[o + LIFE]) { this.sil(i); continue; }
      if (d[o + ORB]) {
        d[o + OANG] += d[o + OW] * dt; d[o + ORAD] = Math.max(0, d[o + ORAD] + d[o + ORV] * dt); d[o + OCY] += d[o + VY] * dt;
        const a = d[o + OANG], r = d[o + ORAD];
        d[o + PX] = d[o + OCX] + Math.cos(a) * r; d[o + PY] = d[o + OCY]; d[o + PZ] = d[o + OCZ] + Math.sin(a) * r;
        d[o + VX] = -Math.sin(a) * r * d[o + OW]; d[o + VZ] = Math.cos(a) * r * d[o + OW];
      } else {
        if (d[o + HOM] > 0) {
          const dx = d[o + TX] - d[o + PX], dy = d[o + TY] - d[o + PY], dz = d[o + TZ] - d[o + PZ], l = Math.hypot(dx, dy, dz);
          if (l < 0.12) { d[o + AGE] = Math.max(d[o + AGE], d[o + LIFE] - 0.06); }
          const h = Math.min(1, d[o + HOM] * dt), sp = d[o + HIZ] / Math.max(l, 1e-3);
          d[o + VX] += (dx * sp - d[o + VX]) * h; d[o + VY] += (dy * sp - d[o + VY]) * h; d[o + VZ] += (dz * sp - d[o + VZ]) * h;
        }
        d[o + VY] -= d[o + GR] * dt;
        const f = Math.max(0, 1 - d[o + DRAG] * dt); d[o + VX] *= f; d[o + VY] *= f; d[o + VZ] *= f;
        d[o + PX] += d[o + VX] * dt; d[o + PY] += d[o + VY] * dt; d[o + PZ] += d[o + VZ] * dt;
        if (d[o + SEK] && d[o + PY] < d[o + SEK]) { d[o + PY] = d[o + SEK]; d[o + VY] = -d[o + VY] * 0.32; d[o + VX] *= 0.55; d[o + VZ] *= 0.55; d[o + ROTV] *= 0.5; }
      }
      d[o + ROT] += d[o + ROTV] * dt;
      i++;
    }
  }
  yaz(takipPoz) {
    const d = this.d, n = this.n, P = this.aPos.array, Dr = this.aDir.array, Cl = this.aCol.array, Sz = this.aSz.array, H = this.aHot.array;
    for (let i = 0; i < n; i++) {
      const o = i * S, life = d[o + LIFE], k = life > 0 ? Math.min(1, d[o + AGE] / life) : 0;
      let px = d[o + PX], py = d[o + PY], pz = d[o + PZ];
      const tk = this.tk[i]; if (tk) { const t = takipPoz(tk); px += t.x; py += t.y; pz += t.z; }
      if (d[o + SAL]) { const w = d[o + AGE] * 3.1 + d[o + FAZ]; px += Math.sin(w) * d[o + SAL]; pz += Math.cos(w * 0.8) * d[o + SAL]; }
      P[i * 3] = px; P[i * 3 + 1] = py; P[i * 3 + 2] = pz;
      const e = 1 - (1 - k) * (1 - k);
      const s = d[o + S0] + (d[o + S1] - d[o + S0]) * e;
      const fi = d[o + FI], fo = d[o + FO];
      let a = d[o + AL]; if (life > 0) { if (fi > 0) a *= Math.min(1, k / fi); if (k > fo) a *= Math.max(0, 1 - (k - fo) / (1 - fo + 1e-5)); } // tek karelik: tam opak
      Cl[i * 4] = d[o + R0] + (d[o + R1] - d[o + R0]) * k; Cl[i * 4 + 1] = d[o + G0] + (d[o + G1] - d[o + G0]) * k; Cl[i * 4 + 2] = d[o + B0] + (d[o + B1] - d[o + B0]) * k; Cl[i * 4 + 3] = a;
      let w = s * d[o + EN], h = s * d[o + UZ];
      const mod = d[o + MOD];
      if (mod === 2) {
        if (d[o + UZAT] > 0) { const vx = d[o + VX], vy = d[o + VY], vz = d[o + VZ], sp = Math.hypot(vx, vy, vz); h *= 1 + sp * d[o + UZAT];
          if (sp > 1e-4) { Dr[i * 4] = vx; Dr[i * 4 + 1] = vy; Dr[i * 4 + 2] = vz; } else { Dr[i * 4] = d[o + DX]; Dr[i * 4 + 1] = d[o + DY] || 1; Dr[i * 4 + 2] = d[o + DZ]; } }
        else { Dr[i * 4] = d[o + DX]; Dr[i * 4 + 1] = d[o + DY]; Dr[i * 4 + 2] = d[o + DZ]; }
      } else { Dr[i * 4] = 0; Dr[i * 4 + 1] = 1; Dr[i * 4 + 2] = 0; }
      Dr[i * 4 + 3] = mod;
      let rot = d[o + ROT]; if (d[o + YONR]) rot += Math.atan2(d[o + VY], Math.hypot(d[o + VX], d[o + VZ]) * (d[o + VX] < 0 ? -1 : 1)) - Math.PI / 2;
      Sz[i * 4] = w; Sz[i * 4 + 1] = h; Sz[i * 4 + 2] = rot; Sz[i * 4 + 3] = d[o + FR];
      H[i] = d[o + HOT];
    }
    this.g.instanceCount = n;
    const L = this.attrlar; for (let j = 0; j < L.length; j++) { const a = L[j]; a.clearUpdateRanges(); if (n) { a.addUpdateRange(0, n * a.itemSize); a.needsUpdate = true; } }
  }
}

// ───────────────────────── durum ─────────────────────────
let sahne = null, kamera = null, kalite = 'yuksek', OLCEK = 1, zeminY = 0;
let atlas = null, sAdd = null, sNrm = null;
let isler = [], islerYedek = [];   // zamanlanmış işler (iki dizi dönüşümlü kullanılır: kare başına yeni dizi yok)
let kareNo = 0; const takipOn = new Map();
const kayaHavuz = [], kalkanHavuz = []; let isik = null, isikGuc = 0, isikSure = 0.0001, isikYas = 1;
let parcaKaya = null, parcaBuz = null, kristalH = null, dikenH = null; const okHavuz = [], hortumHavuz = [], davulHavuz = [], kalpHavuz = [], zumrutHavuz = [], penceHavuz = [], isitma = [];   // 3B yetenek nesneleri (isitma: ilk karede çizilip gölgelendiricisi derlenir)
let hortumT = 0;
const durumlar = new Map();   // Object3D → Map(tur → denetleyici)
let sarsGuc = 0, sarsT = 0, flasRenk = [1, 1, 1], flasGuc = 0, flasBas = 0, flasSure = 0.0001, durakBitis = 0, durakOlcek = 1;
let kutKisma = 1, kutBas = -9, kutP = new THREE.Vector3();   // Kut anı: öbür sürekli efektler yarı hızda doğar; ekranda karartma + hız çizgileri
const simdi = () => performance.now() / 1000;
const N = (n) => Math.max(1, Math.round(n * OLCEK));
// Ekran odakları: yeteneğin ana nesnesi (uçan kaya, can kalbi, ok, hortum, nefes, buz kafesi…) bu karede nerede. sahne3d 2B kaplamayı
// (can çubukları, yetenek balonu) bu dairelerin üstünden çeker (soldurur): iPad oyun kamerasında kaya çubukların altında kalmasın.
// Her guncelle başında sıfırlanır; yetenek süreçleri her karede odak() ile yeniden yazar. En çok 8, kare başına ayırma yok.
const odaklar = []; let odakN = 0;
function odak(p, r = 0.5) { if (odakN >= 8) return; let o = odaklar[odakN]; if (!o) o = odaklar[odakN] = { p: new THREE.Vector3(), r: 0 }; o.p.copy(p); o.r = r; odakN++; }

function takipPoz(o) {
  let c = takipOn.get(o);
  if (!c) { c = { k: -1, p: new THREE.Vector3() }; takipOn.set(o, c); }
  if (c.k !== kareNo) { o.getWorldPosition(c.p); c.k = kareNo; }
  return c.p;
}

// Tek parçacık. p: konum (Object3D 'takip' verilirse ona göre göreli). Diğer alanlar isteğe bağlı.
let ONCELIK = 1;   // 0 süs (aura, durum, iz), 1 normal, 2 darbe/Kut — havuz dolarken düşük öncelikli doğumlar düşer
// sürekli durum efektlerinin (yanık, zehir, sersem, lanet…) parçacık opaklık çarpanı: savaşta üst üste binince curcuna olmasın
const DURUM_ALFA = 0.75; let ALFA_KAT = 1;
function P(o) {
  const sys = o.normal ? sNrm : sAdd; const i = sys.ekle(o.on === undefined ? ONCELIK : o.on); if (i < 0) return -1;
  const d = sys.d, b = i * S, p = o.p || _v1;
  d[b + PX] = p.x; d[b + PY] = p.y; d[b + PZ] = p.z;
  if (o.v) { d[b + VX] = o.v.x; d[b + VY] = o.v.y; d[b + VZ] = o.v.z; }
  d[b + GR] = o.g || 0; d[b + DRAG] = o.drag || 0; d[b + LIFE] = o.omur === undefined ? 0.6 : o.omur;
  const b0 = o.boy === undefined ? 0.3 : o.boy; d[b + S0] = b0; d[b + S1] = o.boy2 === undefined ? b0 : o.boy2;
  d[b + EN] = o.en || 1; d[b + UZ] = o.uz || 1;
  const c0 = rgb(o.renk || '#ffffff'), c1 = o.renk2 ? rgb(o.renk2) : c0;
  d[b + R0] = c0[0]; d[b + G0] = c0[1]; d[b + B0] = c0[2]; d[b + R1] = c1[0]; d[b + G1] = c1[1]; d[b + B1] = c1[2];
  d[b + AL] = (o.a === undefined ? 1 : o.a) * ALFA_KAT; d[b + ROT] = o.rot === 'r' ? RND() * TAU : (o.rot || 0); d[b + ROTV] = o.rotHiz || 0;
  d[b + FR] = KARE[o.kare || 'parilti']; d[b + MOD] = o.mod || 0; let hot = o.hot === undefined ? 0.4 : o.hot;
  if ((!o.kare || o.kare === 'parilti') && Math.max(b0, d[b + S1]) > 0.22) hot = Math.min(hot, 0.45);   // geniş parıltılar beyaz leke olmasın
  d[b + HOT] = hot; d[b + UZAT] = o.uzat || 0;
  const ek = o.eksen; if (ek) { d[b + DX] = ek.x; d[b + DY] = ek.y; d[b + DZ] = ek.z; } else { d[b + DY] = 1; }
  d[b + FI] = o.fi === undefined ? 0.08 : o.fi; d[b + FO] = o.fo === undefined ? 0.45 : o.fo;
  if (o.yorunge) { const y = o.yorunge; d[b + ORB] = 1; d[b + OCX] = p.x; d[b + OCY] = p.y; d[b + OCZ] = p.z; d[b + ORAD] = y.r || 0.5; d[b + OANG] = y.aci === undefined ? RND() * TAU : y.aci; d[b + OW] = y.w || 3; d[b + ORV] = y.rv || 0; d[b + VY] = y.vy || 0;
    const a = d[b + OANG]; d[b + PX] = p.x + Math.cos(a) * d[b + ORAD]; d[b + PZ] = p.z + Math.sin(a) * d[b + ORAD]; }
  d[b + SAL] = o.salin || 0; d[b + FAZ] = RND() * TAU; d[b + SEK] = o.sek ? zeminY + o.sek : 0;
  if (o.hedef) { d[b + TX] = o.hedef.x; d[b + TY] = o.hedef.y; d[b + TZ] = o.hedef.z; d[b + HOM] = o.hom || 4; d[b + HIZ] = o.hiz || 4; }
  d[b + YONR] = o.yonDon ? 1 : 0;
  if (o.takip) sys.tk[i] = o.takip;
  return i;
}
// rastgele birim vektör (küre / yatay)
function kureY(out, yukari = 0) { const u = RND() * 2 - 1 + yukari, a = RND() * TAU, s = Math.sqrt(Math.max(0, 1 - Math.min(1, u) ** 2)); return out.set(Math.cos(a) * s, Math.min(1, u), Math.sin(a) * s).normalize(); }

function zamanla(gecikme, fn) { isler.push({ g: gecikme, tek: true, fn }); }
function surec(sure, fn, gecikme = 0) { const is = { g: gecikme, s: sure, yas: 0, fn, acik: true }; isler.push(is); return is; }

// ───────────────────────── element renkleri (ana, çekirdek, koyu) ─────────────────────────
// Altın yalnız Kut, ★3, birleşme ve ışık içindir; diğer efektler kendi element renginden gelir.
export const ELEMENT = {
  ates: ['#ff6a1f', '#ffd36a', '#5a1206'], buz: ['#6fd0ff', '#e9fbff', '#1b3f8a'], zehir: ['#5fdc2a', '#c8ff8a', '#1f4a10'],
  golge: ['#9a4dff', '#e0c2ff', '#2a0f4a'], ses: ['#ff9a2e', '#ffe1a0', '#5a2a06'], isik: ['#ffe45a', '#fff9e0', '#7a5a10'],
  toprak: ['#c98a4a', '#f0d2a0', '#3a2414'], ruzgar: ['#7fe8cf', '#e6fff8', '#12493f'], kan: ['#ff3d5a', '#ffd0da', '#4a0a1a'], kristal: ['#7fc8ff', '#e9fbff', '#1b3f8a'],
};
// ───────────────────────── yapı taşları ─────────────────────────
const Z = () => zeminY;
// koyu, doygun zemin alt katmanı (normal karışım): parlak taş zeminde efekti ayırır
function altKatman(p, renk, r = 0.7, sure = 0.7) {
  _v3.set(p.x, Z() + 0.025, p.z);
  P({ p: _v3, mod: 1, normal: true, omur: sure, boy: r * 1.2, boy2: r * 1.7, renk, kare: 'duman', rot: 'r', hot: 0, a: 0.6, fi: 0.05, fo: 0.4 });
}
// patlama: kıvılcım çizgileri + parıltılar + isteğe bağlı yıldızlar
function patlama(p, o = {}) {
  const renk = o.renk || '#ffd76a', renk2 = o.renk2 || renk, guc = o.guc || 1, n = N((o.n || 14) * guc), hiz = (o.hiz || 3) * Math.sqrt(guc), yon = o.yon;
  for (let i = 0; i < n; i++) {
    kureY(_v2, o.yukari === undefined ? 0.35 : o.yukari); if (yon) _v2.addScaledVector(yon, 1.2).normalize();
    _v2.multiplyScalar(hiz * rr(0.45, 1));
    P({ p, v: _v2, g: o.g === undefined ? 5 : o.g, drag: 2.2, omur: rr(0.28, 0.55) * (o.omur || 1), boy: (o.boy || 0.09) * rr(0.8, 1.3), boy2: 0.02, renk: '#ffffff', renk2: renk2, uz: 1.6, en: 0.55,
      kare: 'kivilcim', mod: 2, uzat: 0.11, hot: 1, fo: 0.3 });
  }
  if (o.yildiz !== false) for (let i = 0, m = N((o.yildizN || 4) * guc); i < m; i++) { kureY(_v2, 0.6).multiplyScalar(hiz * rr(0.25, 0.6));
    P({ p, v: _v2, g: 1.5, drag: 3, omur: rr(0.35, 0.6), boy: rr(0.16, 0.26) * guc, boy2: 0.04, renk, kare: 'yildiz4', rot: 'r', rotHiz: rr(-4, 4), hot: 1, fo: 0.4 }); }
}
// darbe parlaması: kameraya dönük kısa, parlak disk + yıldız
function flas(p, o = {}) {
  const renk = o.renk || '#ffffff', b = o.boy || 0.9, s = o.sure || 0.18; const onceki = ONCELIK; ONCELIK = 2;
  P({ p, omur: s, boy: b * 0.5, boy2: b, renk, kare: 'parilti', hot: 0.7, a: (o.a || 1) * 0.75, fi: 0, fo: 0.15 });
  P({ p, omur: s * 0.8, boy: b * 0.7, boy2: b * 1.1, renk, kare: 'yildiz4', rot: o.rot === undefined ? rr(-0.3, 0.3) : o.rot, hot: 0.9, a: 0.9, fi: 0, fo: 0.1 });
  if (o.halka !== false) P({ p, omur: s * 1.5, boy: b * 0.3, boy2: b * 1.4, renk, kare: 'halka', normal: true, hot: 0.3, a: 0.75, fi: 0, fo: 0.2 });
  if (o.isik !== false) isikYak(p, renk, (o.isikGuc || 6) * (b / 0.9), s * 1.6);
  ONCELIK = onceki;
}
// şok dalgası: yerde genişleyen halka + yükselen toz
function sok(p, o = {}) {
  const renk = o.renk || '#ffe0a0', r = o.r || 1.5, s = o.sure || 0.5, y = Z() + 0.04;
  _v3.set(p.x, y, p.z);
  P({ p: _v3, mod: 1, omur: s, boy: r * 0.25, boy2: r * 2.1, renk, kare: 'sok', normal: true, hot: 0.25, a: (o.a || 1) * 0.9, fi: 0, fo: 0.3, rot: 'r' });
  P({ p: _v3, mod: 1, omur: s * 0.6, boy: r * 0.2, boy2: r * 1.4, renk, kare: 'halka', hot: 0.5, a: (o.a || 1) * 0.5, fi: 0, fo: 0.1 });
  if (o.toz) {
    const tr = o.tozRenk || '#c9a982', m = N(o.tozN || 12);
    for (let i = 0; i < m; i++) { const a = i / m * TAU + rr(0, 0.4); _v4.set(p.x + Math.cos(a) * r * 0.25, y + 0.08, p.z + Math.sin(a) * r * 0.25);
      _v2.set(Math.cos(a) * r * rr(1.6, 2.4), rr(0.3, 0.9), Math.sin(a) * r * rr(1.6, 2.4));
      P({ p: _v4, v: _v2, drag: 3.4, g: -0.3, omur: rr(0.55, 0.9), boy: rr(0.3, 0.45) * Math.sqrt(r), boy2: rr(0.6, 0.9) * Math.sqrt(r), renk: tr, renk2: karis(tr, '#ffffff', 0.25), kare: 'toz', normal: true, rot: 'r', rotHiz: rr(-1, 1), a: 0.85, hot: 0, fi: 0.05, fo: 0.35 }); }
  }
}
// yerde rün çemberi
function run(p, o = {}) {
  const renk = o.renk || '#c98bff', r = o.r || 1.2, s = o.sure || 1.0, kr = o.kare || 'run', al = o.a || 0.95; _v3.set(p.x, Z() + 0.05, p.z);
  P({ p: _v3, mod: 1, omur: s, boy: r * 1.6, boy2: r * 2, renk, renk2: o.renk2 || renk, kare: kr, normal: true, rot: 'r', rotHiz: o.donus === undefined ? 1.2 : o.donus, hot: 0.2, a: al, fi: 0.18, fo: 0.6 });
  P({ p: _v3, mod: 1, omur: s, boy: r * 1.75, boy2: r * 2.15, renk: o.renk2 || renk, kare: kr, rot: 'r', rotHiz: o.donus === undefined ? 1.2 : o.donus, hot: 0.5, a: 0.45 * al, fi: 0.18, fo: 0.6 });
  P({ p: _v3, mod: 1, omur: s, boy: r * 2.6, boy2: r * 2.8, renk: o.renk2 || renk, kare: 'parilti', hot: 0.1, a: 0.2 * al, fi: 0.2, fo: 0.5 });
}
// yükselen ışık sütunu
function sutun(p, o = {}) {
  const renk = o.renk || '#d7a6ff', ic = o.ic || '#fff2c4', h = o.h || 8, en = o.en || 1.1, s = o.sure || 1.0, al = o.a || 1;
  _v3.set(p.x, Z() + h / 2, p.z); _v4.set(0, 1, 0);
  P({ p: _v3, mod: 2, eksen: _v4, omur: s, boy: 1, en: en * 0.6, uz: h, boy2: 1.25, renk, kare: 'isin', hot: 0.4, a: 0.8 * al, fi: 0.08, fo: 0.45 });
  P({ p: _v3, mod: 2, eksen: _v4, omur: s * 0.9, boy: 1, en: en * 0.28, uz: h, boy2: 1.1, renk: ic, kare: 'isin', hot: 1, a: al, fi: 0.05, fo: 0.4 });
  _v3.set(p.x, Z() + 0.15, p.z);
  P({ p: _v3, omur: s * 0.8, boy: en * 1.4, boy2: en * 2.2, renk, kare: 'parilti', hot: 0.8, a: 0.9 * al, fi: 0.05, fo: 0.3 });
  if (o.zerre !== false) surec(s * 0.85, (k, dt, yas, is) => { is.acc = (is.acc || 0) + dt * 40 * OLCEK; while (is.acc >= 1) { is.acc--;
    _v3.set(p.x, Z() + rr(0, 0.6), p.z); P({ p: _v3, yorunge: { r: rr(0.15, en * 0.55), w: rr(2, 5) * (RND() < 0.5 ? 1 : -1), vy: rr(2, 5) }, omur: rr(0.6, 1.1), boy: rr(0.07, 0.14), boy2: 0.03, renk: RND() < 0.5 ? renk : ic, kare: RND() < 0.3 ? 'yildiz4' : 'parilti', hot: 1, fo: 0.5 }); } });
}
// ışın: a'dan b'ye titreşen düz demet (süre boyunca)
function isin(a, b, o = {}) {
  const renk = o.renk || '#ffe08a', en = o.en || 0.3, s = o.sure || 0.4;
  const A = konum(a, new THREE.Vector3()), B = konum(b, new THREE.Vector3());
  surec(s, (k) => { const m = _v3.copy(A).add(B).multiplyScalar(0.5), ek = _v4.copy(B).sub(A); const L = ek.length(); const sol = 1 - k * k, tit = 1 + Math.sin(k * 60) * 0.15;
    P({ p: m, mod: 2, eksen: ek, omur: -1, boy: 1, en: en * 1.8 * tit * sol, uz: L * 1.06, renk, kare: 'isin', hot: 0.4, a: 0.75 * sol });
    P({ p: m, mod: 2, eksen: ek, omur: -1, boy: 1, en: en * 0.6 * tit * sol, uz: L, renk: '#ffffff', kare: 'isin', hot: 1, a: sol });
    P({ p: B, omur: -1, boy: en * 3 * tit, renk, kare: 'parilti', hot: 1, a: sol });
    P({ p: A, omur: -1, boy: en * 2, renk, kare: 'parilti', hot: 1, a: sol }); });
}
// zincir yıldırım: dallanan, titreyen kırık çizgi (her ~45 ms yeniden şekillenir)
function zincir(a, b, o = {}) {
  const renk = o.renk || '#fff27a', s = o.sure || 0.3, kal = o.kalin || 0.2, dal = o.dal === undefined ? 2 : o.dal, kontur = !!o.kontur, sap0 = o.sap || 0.22;
  const A = konum(a, new THREE.Vector3()), B = konum(b, new THREE.Vector3());
  const nok = []; for (let i = 0; i < 18; i++) nok.push(new THREE.Vector3());
  const kir = (p0, p1, n, sap, out) => { out[0].copy(p0); out[n].copy(p1); const ek = _v2.copy(p1).sub(p0), L = ek.length();
    const yan1 = _v3.set(-ek.z, 0, ek.x).normalize(); if (yan1.lengthSq() < 0.1) yan1.set(1, 0, 0); const yan2 = _v4.crossVectors(ek, yan1).normalize();
    for (let i = 1; i < n; i++) { const t = i / n, z = Math.sin(t * Math.PI) * L * sap; out[i].copy(p0).addScaledVector(ek, t).addScaledVector(yan1, (RND() - 0.5) * z).addScaledVector(yan2, (RND() - 0.5) * z); } };
  const ciz = (pts, n, w, al) => { for (let i = 0; i < n; i++) { const p0 = pts[i], p1 = pts[i + 1]; const m = _v1.copy(p0).add(p1).multiplyScalar(0.5); const e = _v2.copy(p1).sub(p0); const L = e.length() * 1.15;
    // kontur: koyu mor-lacivert dış hat (normal karışım) — sarı gökyüzü önünde şimşek soluk beyaz sütun gibi kalmasın, zikzak seçilsin
    if (kontur) P({ p: m, mod: 2, eksen: e, omur: 0.07, boy: 1, en: w * 2.6, uz: L * 1.05, renk: '#1a1040', kare: 'isin', normal: true, hot: 0, a: al * 0.75, fi: 0, fo: 0.2 });
    P({ p: m, mod: 2, eksen: e, omur: 0.07, boy: 1, en: w * 3.2, uz: L, renk, kare: 'isin', hot: 0.3, a: al * 0.7, fi: 0, fo: 0.2 });
    P({ p: m, mod: 2, eksen: e, omur: 0.07, boy: 1, en: w, uz: L, renk: '#ffffff', kare: 'isin', hot: 1, a: al, fi: 0, fo: 0.2 }); } };
  surec(s, (k, dt, yas, is) => {
    is.acc = (is.acc || 0) + dt; if (is.ilk && is.acc < 0.045) return; is.ilk = true; is.acc = 0;
    const al = 1 - k * 0.6, nn = OLCEK < 1 ? 7 : 10;
    kir(A, B, nn, sap0, nok); ciz(nok, nn, kal * al, al);
    for (let d = 0; d < dal; d++) { const j = 2 + Math.floor(RND() * (nn - 3)); const bas = nok[j].clone(); const uc = _v1.copy(B).sub(A).multiplyScalar(rr(0.15, 0.3)).add(bas); kureY(_v2, 0).multiplyScalar(rr(0.3, 0.7)); uc.add(_v2);
      const dn = []; for (let i = 0; i <= 4; i++) dn.push(new THREE.Vector3()); kir(bas, uc.clone(), 4, 0.35, dn); ciz(dn, 4, kal * 0.45 * al, al * 0.8); }
    P({ p: B, omur: 0.07, boy: kal * 9, renk, kare: 'parilti', hot: 1, a: al, fi: 0 });
  });
}
// yer izi (çatlak, yanık, kırağı, zehir gölü)
function dekal(p, o = {}) {
  _v3.set(p.x, Z() + 0.03 + RND() * 0.01, p.z);
  P({ p: _v3, mod: 1, normal: o.additive ? false : true, omur: o.sure || 2.2, boy: (o.r || 0.8) * 1.6, boy2: (o.r || 0.8) * 1.75, renk: o.renk || '#2a1a12', kare: o.kare || 'catlak', rot: 'r', hot: 0, a: o.a || 0.75, fi: 0.03, fo: 0.55 });
}
// iz: a→b şerit parçası (mermi arkası); her kare çağrılır
function izParca(a, b, o) {
  const e = _v2.copy(b).sub(a), L = e.length(); if (L < 1e-4) return;
  const m = _v1.copy(a).add(b).multiplyScalar(0.5);
  const en = (o.en || 0.16) * 1.8;
  P({ p: m, mod: 2, eksen: e, omur: Math.max(0.35, (o.omur || 0.22) * 1.5), boy: en, boy2: 0.01, en: 1, uz: (L / en) * 1.35, renk: o.renk, renk2: o.renk2, kare: 'isin', hot: o.hot === undefined ? 0.5 : o.hot, a: o.a || 0.9, fi: 0, fo: 0.05, normal: o.normal, on: 0 });
}
// aura: nesne çevresinde dönen parçacıklar (sure boyunca)
function aura(nesne, o = {}) {
  const renk = o.renk || '#ffd76a', s = o.sure || 1.5, h = boyAl(nesne, o.boy);
  const obj = !!(nesne && nesne.isObject3D), sabit = obj ? null : konum(nesne, new THREE.Vector3());
  return surec(s, (k, dt, yas, is) => { if (obj && !nesne.visible) return; is.acc = (is.acc || 0) + dt * (o.oran || 20) * OLCEK * kutKisma;
    while (is.acc >= 1) { is.acc--; _v3.set(0, rr(0.02, 0.2) * h, 0); if (sabit) _v3.add(sabit);
      P({ p: _v3, takip: obj ? nesne : null, yorunge: { r: rr(0.35, 0.5) * h, w: rr(2.5, 4) * (o.ters ? -1 : 1), vy: rr(0.5, 1.2) * h }, omur: rr(0.6, 1), boy: rr(0.08, 0.15), boy2: 0.02, renk, renk2: o.renk2, kare: o.kare || 'parilti', hot: 1, fo: 0.5, on: 0 }); } });
}
function boyAl(nesne, ver) {
  if (ver) return ver; if (!nesne || !nesne.isObject3D) return 1;
  if (nesne.userData.vfxBoy) return nesne.userData.vfxBoy;
  const k = new THREE.Box3().setFromObject(nesne); const h = isFinite(k.max.y) ? Math.max(0.4, Math.min(2.5, k.max.y - k.min.y)) : 1; nesne.userData.vfxBoy = h; return h;
}
// nokta ışığı parlaması (yalnız yuksek kalitede tek, kalıcı ışık; ışık sayısı değişmez → shader yeniden derlenmez)
function isikYak(p, renk, guc, sure) { if (!isik || guc * 0.6 < isikGuc * Math.max(0, 1 - isikYas / isikSure)) return; isik.position.set(p.x, Math.max(p.y, Z() + 0.6), p.z); const c = rgb(renk); isik.color.setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace); isikGuc = guc; isikSure = sure; isikYas = 0; }

// kaya ağı havuzu (hazırlıkta ayrılan kaya — yerden koparılıp elde taşınan — başkasına verilmez)
function kayaAl() { for (const k of kayaHavuz) if (!k.visible && !k.userData.ayrildi) { k.visible = true; return k; } return null; }
const KAYA_R = 0.17, KAYA_BUYUK = 2.3;   // kaya ağının yarıçapı · Kaya Fırlat'ın iri kayası (çap ~0,8: golemin göğsü kadar)
const kayaElde = new Map();               // kaynak Object3D → { kaya, atildi } (hazırlıkta kaldırılan kaya fırlatmaya devredilir)
const davulElde = new Map();              // kaynak Object3D → davul nesnesi (Savaş Davulu vuruşları derisini parlatır)

// ───────────────────────── 3B parça / kristal / sahne nesnesi havuzları (yetenek efektleri) ─────────────────────────
// Kırıklar (kaya, buz) ve buz kristalleri: her havuz TEK InstancedMesh (bir çizim çağrısı, malzeme paylaşımlı). Fizik CPU'da, nesneler
// kur()'da bir kez ayrılır; kare başına ayırma yok. Ok, hortum ve davul küçük nesne havuzları (yalnız yetenek sürerken görünür).
const _pm = new THREE.Matrix4(), _pq = new THREE.Quaternion(), _ps = new THREE.Vector3(), _pe = new THREE.Euler(), _pY = new THREE.Vector3(0, 1, 0);
class ParcaHavuz {
  constructor(geo, mat, max, yari, golge) {
    this.m = new THREE.InstancedMesh(geo, mat, max); this.m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.m.count = 0;
    this.m.frustumCulled = false; this.m.castShadow = !!golge; this.m.name = 'vfx_parca'; this.max = max; this.n = 0; this.yari = yari;
    this.L = []; for (let i = 0; i < max; i++) this.L.push({ p: new THREE.Vector3(), v: new THREE.Vector3(), q: new THREE.Quaternion(), w: new THREE.Vector3(), s: new THREE.Vector3(1, 1, 1), yas: 0, omur: 1, g: 9.8 });
  }
  // p konum, v hız, s ölçek (ağ yarıçapı × s), omur sn; o.uz: boyuna uzama, o.don: dönme hızı (rad/sn), o.g: yerçekimi
  ekle(p, v, s, omur, o = {}) {
    if (this.n >= this.max) return null; const e = this.L[this.n++];
    e.p.copy(p); e.v.copy(v); e.s.set(s, s * (o.uz || 1), s); e.yas = 0; e.omur = omur; e.g = o.g === undefined ? 9.8 : o.g;
    e.q.setFromEuler(_pe.set(RND() * TAU, RND() * TAU, RND() * TAU)); e.w.set(rr(-1, 1), rr(-1, 1), rr(-1, 1)).multiplyScalar(o.don || 9); return e;
  }
  guncelle(dt) {
    let i = 0;
    while (i < this.n) {
      const e = this.L[i]; e.yas += dt;
      if (e.yas >= e.omur) { const son = this.n - 1; this.L[i] = this.L[son]; this.L[son] = e; this.n--; continue; }
      e.v.y -= e.g * dt; e.p.addScaledVector(e.v, dt);
      const yer = zeminY + this.yari * e.s.x * 0.75;   // yerde seker, sürtünür
      if (e.p.y < yer) { e.p.y = yer; if (e.v.y < 0) e.v.y *= -0.3; e.v.x *= 0.55; e.v.z *= 0.55; e.w.multiplyScalar(0.5); }
      e.q.multiply(_pq.setFromEuler(_pe.set(e.w.x * dt, e.w.y * dt, e.w.z * dt)));
      const k = e.yas / e.omur, sol = k > 0.72 ? Math.max(0.01, 1 - (k - 0.72) / 0.28) : 1;   // sonda küçülerek söner
      _ps.copy(e.s).multiplyScalar(sol); _pm.compose(e.p, e.q, _ps); this.m.setMatrixAt(i, _pm); i++;
    }
    this.m.count = this.n; if (this.n) this.m.instanceMatrix.needsUpdate = true;
  }
  temizle() { this.n = 0; this.m.count = 0; }
}
// buz kristali: yerden fışkırır (aşma payıyla büyür), tutulur, süresi dolunca 3B buz kırıklarına ayrılır
class KristalHavuz {
  constructor(geo, mat, max) {
    this.m = new THREE.InstancedMesh(geo, mat, max); this.m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.m.count = 0;
    this.m.frustumCulled = false; this.m.castShadow = false; this.m.name = 'vfx_kristal'; this.max = max; this.n = 0;
    this.L = []; for (let i = 0; i < max; i++) this.L.push({ p: new THREE.Vector3(), q: new THREE.Quaternion(), ek: new THREE.Vector3(), sx: 1, sy: 1, yas: 0, gec: 0, buyu: 0.12, omur: 1, kir: true });
  }
  // p taban (yerde), eksen kristalin yönü, sx kalınlık, sy boy (ağ 2 birim boyunda), o: buyu (sn), omur (sn), gecikme, kir (bitince kırılır)
  ekle(p, eksen, sx, sy, o = {}) {
    if (this.n >= this.max) return null; const e = this.L[this.n++];
    e.p.copy(p); e.ek.copy(eksen).normalize(); e.q.setFromUnitVectors(_pY, e.ek).multiply(_pq.setFromAxisAngle(_pY, RND() * TAU));
    e.sx = sx; e.sy = sy; e.yas = 0; e.gec = o.gecikme || 0; e.buyu = o.buyu || 0.12; e.omur = o.omur || 1.2; e.kir = o.kir !== false; return e;
  }
  guncelle(dt) {
    let i = 0;
    while (i < this.n) {
      const e = this.L[i]; e.yas += dt; const t = e.yas - e.gec;
      if (t >= e.omur) { if (e.kir) kristalKir(e); const son = this.n - 1; this.L[i] = this.L[son]; this.L[son] = e; this.n--; continue; }
      let g = 0; if (t > 0) g = t < e.buyu ? cikisK(t / e.buyu) * (1 + 0.18 * Math.sin(Math.PI * t / e.buyu)) : 1;
      if (t > e.omur - 0.1 && !e.kir) g *= Math.max(0, (e.omur - t) / 0.1);
      _ps.set(e.sx * Math.max(0.001, g), e.sy * Math.max(0.001, g), e.sx * Math.max(0.001, g)); _pm.compose(e.p, e.q, _ps); this.m.setMatrixAt(i, _pm); i++;
    }
    this.m.count = this.n; if (this.n) this.m.instanceMatrix.needsUpdate = true;
  }
  temizle() { this.n = 0; this.m.count = 0; }
}
function kristalKir(e) {
  _v3.copy(e.p).addScaledVector(e.ek, e.sy);   // kristalin ortası
  if (parcaBuz) for (let i = 0, n = OLCEK < 1 ? 1 : 2; i < n; i++) { kureY(_v2, 0.5).multiplyScalar(rr(1, 2.2)); _v2.y += 1.2; parcaBuz.ekle(_v3, _v2, e.sx * rr(5, 7.5), rr(0.6, 0.85), { uz: 1.6, don: 8 }); }
  if (RND() < 0.7) P({ p: _v3, v: kureY(_v2, 0.6).multiplyScalar(rr(1, 2)), g: 7, omur: rr(0.4, 0.6), boy: rr(0.12, 0.2), renk: '#f2fdff', renk2: '#8fd6ff', kare: 'buz', rot: 'r', rotHiz: rr(-6, 6), hot: 0.6, on: 0 });
  if (RND() < 0.35) P({ p: _v3, omur: 0.14, boy: 0.2, boy2: 0.45, renk: '#dff6ff', kare: 'parilti', hot: 0.8, a: 0.8, fi: 0, on: 0 });
}
// Dağ Koçu boynuz kıvrımlarının baş kemiğine (tripoHead) göre yerel konumu (model ölçümü: kıvrım merkezi ile tepesinin ortası)
const BOYNUZ = [new THREE.Vector3(0.006, 0.06, 0.13), new THREE.Vector3(0.05, -0.23, -0.19)];
// buz kristali kümesi: merkez çevresinde n kristal, dışa eğik (o: n, r halka yarıçapı, boy en uzunun boyu, kal kalınlık, omur, gecikme, buyu, kir, orta)
function buzKume(merkez, o = {}) {
  if (!kristalH) return; const n = Math.max(3, Math.round((o.n || 7) * (OLCEK < 1 ? 0.7 : 1))), r = o.r || 0.3, boy = o.boy || 0.8, kal = o.kal || 1;
  for (let i = 0; i < n; i++) { const a = i / n * TAU + rr(-0.25, 0.25), rj = r * rr(0.8, 1.15), eg = rr(0.25, 0.6);
    _v3.set(merkez.x + Math.cos(a) * rj, zeminY - 0.04, merkez.z + Math.sin(a) * rj); _v2.set(Math.cos(a) * eg, 1, Math.sin(a) * eg);
    kristalH.ekle(_v3, _v2, rr(0.06, 0.1) * kal, boy * rr(0.5, 1.0) * 0.5, { buyu: o.buyu || 0.14, omur: o.omur || 1.2, gecikme: (o.gecikme || 0) + i * 0.015, kir: o.kir !== false }); }
  if (o.orta) for (let i = 0; i < 2; i++) { _v3.set(merkez.x + rr(-0.06, 0.06), zeminY - 0.04, merkez.z + rr(-0.06, 0.06)); _v2.set(rr(-0.15, 0.15), 1, rr(-0.15, 0.15));
    kristalH.ekle(_v3, _v2, 0.12 * kal, boy * rr(0.4, 0.5), { buyu: o.buyu || 0.14, omur: o.omur || 1.2, gecikme: o.gecikme || 0, kir: o.kir !== false }); }
}
// gölge oku (3B): ince gövde, parlak uç, tüy; küçük havuz
function okAl() { for (const k of okHavuz) if (!k.visible) { k.visible = true; return k; } return null; }
// hortum (3B): yukarı genişleyen açık koni, kayan şeritli saydam gölgelendirici
function hortumAl() { for (const k of hortumHavuz) if (!k.visible) { k.visible = true; k.material.uniforms.uA.value = 0; return k; } return null; }
// can kalbi (3B, Can Emme), zümrüt (3B, Zümrüt Zehri), gölge pençesi (3B, Kara Gölge): küçük havuzlar
function kalpAl() { for (const k of kalpHavuz) if (!k.visible) { k.visible = true; return k; } return null; }
function zumrutAl() { for (const k of zumrutHavuz) if (!k.visible) { k.visible = true; return k; } return null; }
function penceAl() { for (const k of penceHavuz) if (!k.visible) { k.visible = true; return k; } return null; }
// savaş davulu (3B): gövde, deri, iki çember
function davulAl() { for (const k of davulHavuz) if (!k.visible) { k.visible = true; return k; } return null; }
const HORTUM_VS = `uniform float uT; varying vec2 vUv; varying float vY;
void main(){ vUv = uv; vec3 p = position; float y = uv.y; p.x += sin(y * 5.0 + uT * 6.0) * 0.12 * y; p.z += cos(y * 4.0 + uT * 5.0) * 0.12 * y; vY = y;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`;
const HORTUM_FS = `uniform float uT; uniform float uA; uniform vec3 uRenk; uniform vec3 uRenk2; varying vec2 vUv; varying float vY;
void main(){ float s = fract(vUv.x * 3.0 + vUv.y * 1.7 - uT * 2.6); float b = smoothstep(0.0, 0.22, s) * (1.0 - smoothstep(0.42, 0.85, s));
  float s2 = fract(vUv.x * 5.0 + vUv.y * 2.6 - uT * 3.8 + 0.37); float b2 = smoothstep(0.0, 0.15, s2) * (1.0 - smoothstep(0.25, 0.5, s2));
  float kenar = smoothstep(0.0, 0.1, vY) * (1.0 - smoothstep(0.72, 1.0, vY));
  float a = (0.17 + 0.62 * b + 0.32 * b2) * kenar * uA; if (a < 0.01) discard;
  gl_FragColor = vec4(mix(uRenk2, uRenk, clamp(b + b2 * 0.6, 0.0, 1.0)), a); }`;

// ───────────────────────── mermiler ─────────────────────────
const KOYU_MERMI = { ates: '#5a1206', buz: '#1b3f8a', zehir: '#1f4a10', isik: '#7a5a10', ok: '#2a0f4a', ses: '#5a2a06', buyu: '#2a0f4a' };
const MERMI = {
  buyu: { yay: 0.35 }, ok: { yay: 0.08 }, kaya: { yay: 1.3 }, ates: { yay: 0.4 }, buz: { yay: 0.2 }, zehir: { yay: 0.9 }, isik: { yay: 0.25 }, ses: { yay: 0.0 },
};
function mermi(bas, son, sure, o = {}) {
  const tur = o.tur || 'buyu', renk = o.renk || ({ ates: '#ff7a2e', buz: '#a8e4ff', zehir: '#7be35a', isik: '#fff1a8', kaya: '#c9a46b', ok: '#ffd76a', ses: '#ffb347' }[tur] || '#c98bff');
  const guc = o.guc || 1, yay = o.yay === undefined ? (MERMI[tur] || MERMI.buyu).yay : o.yay;
  const A = konum(bas, new THREE.Vector3()), Bt = new THREE.Vector3(), onceki = A.clone(), cur = new THREE.Vector3(), yon = new THREE.Vector3();
  const hedefAl = () => { konum(son, Bt); if (son && son.isObject3D) Bt.y += boyAl(son) * 0.5; return Bt; };
  const kaya = tur === 'kaya' ? kayaAl() : null; if (kaya) { kaya.scale.setScalar(guc * (o.kayaBoy || 1)); kaya.position.copy(A); }
  sure = Math.max(0.05, sure);
  surec(sure, (k, dt) => {
    const B = hedefAl(); cur.lerpVectors(A, B, k); cur.y += Math.sin(k * Math.PI) * yay * Math.max(0.5, A.distanceTo(B) * 0.35);
    yon.copy(cur).sub(onceki); const L = yon.length(); if (L > 1e-5) yon.divideScalar(L); else yon.copy(B).sub(A).normalize();
    const BB = 1.6 * guc, koyu = KOYU_MERMI[tur] || '#2a0f4a';
    // koyu dış çizgi (normal karışım, bir boy büyük): mermi açık zeminde ve gökte okunsun
    if (tur !== 'kaya') P({ p: cur, omur: -1, boy: (tur === 'ok' ? 0.42 : 0.5) * BB * 1.25, renk: koyu, kare: 'parilti', normal: true, hot: 0, a: 0.6 });
    switch (tur) {
      case 'ok':
        P({ p: cur, mod: 2, eksen: yon, omur: -1, boy: 1, en: 0.16 * BB, uz: 1.1 * BB, renk: '#ffffff', kare: 'kivilcim', hot: 1 });
        P({ p: cur, mod: 2, eksen: yon, omur: -1, boy: 1, en: 0.45 * BB, uz: 1.4 * BB, renk, kare: 'isin', hot: 0.5, a: 0.85 });
        P({ p: cur, omur: -1, boy: 0.35 * BB, renk, kare: 'parilti', hot: 0.6, a: 0.8 });
        izParca(onceki, cur, { renk, en: (o.izEn || 0.08) * guc, omur: o.izOmur || 0.2 }); break;
      case 'kaya':
        if (kaya) { kaya.position.copy(cur); kaya.rotation.x += dt * 9; kaya.rotation.z += dt * 6; kaya.children[0].material.emissiveIntensity = 1.2 + Math.sin(k * 30) * 0.6; }
        else P({ p: cur, omur: -1, boy: 0.32 * guc, renk: '#a3775a', kare: 'tas', normal: true, rot: k * 12, hot: 0 });
        if (RND() < 0.7 * OLCEK) P({ p: cur, v: kureY(_v2, 0.2).multiplyScalar(0.3), drag: 2, omur: rr(0.35, 0.55), boy: 0.18 * guc, boy2: 0.4 * guc, renk: '#b99772', renk2: '#e6d4b8', kare: 'toz', normal: true, rot: 'r', a: 0.6, hot: 0, on: 0 });
        break;
      case 'ates':
        P({ p: cur, omur: -1, boy: 0.5 * BB, renk: '#ff6a1f', kare: 'parilti', hot: 1 });
        P({ p: cur, mod: 2, eksen: _v3.copy(yon).negate(), omur: -1, boy: 0.42 * BB, uz: 1.3, renk: '#ffb347', kare: 'alev', normal: true, hot: 0.45 });
        for (let i = 0; i < 2; i++) if (RND() < OLCEK) P({ p: cur, v: kureY(_v2, 0.8).multiplyScalar(0.6), g: -1.5, drag: 1.5, omur: rr(0.25, 0.4), boy: rr(0.16, 0.26) * BB, boy2: 0.04, renk: '#ffd36a', renk2: '#ff3d1a', kare: 'alev', normal: true, hot: 0.45, rot: rr(-0.4, 0.4), on: 0 });
        izParca(onceki, cur, { renk: '#ff7a2e', renk2: '#ff2a00', en: 0.16 * guc, omur: 0.25 }); break;
      case 'buz':
        P({ p: cur, mod: 2, eksen: yon, omur: -1, boy: 0.42 * BB, en: 0.7, renk: '#dff6ff', kare: 'buz', hot: 0.6 });
        P({ p: cur, omur: -1, boy: 0.45 * BB, renk, kare: 'parilti', hot: 0.8, a: 0.7 });
        if (RND() < 0.6 * OLCEK) P({ p: cur, v: kureY(_v2, 0).multiplyScalar(0.4), g: 0.6, drag: 1, omur: rr(0.4, 0.7), boy: rr(0.07, 0.12) * 1.4, renk: '#ffffff', renk2: renk, kare: 'kar', rot: 'r', rotHiz: rr(-3, 3), hot: 1, on: 0 });
        izParca(onceki, cur, { renk, en: 0.12 * guc, omur: 0.28 }); break;
      case 'zehir':
        if (o.govde !== false) { P({ p: cur, omur: -1, boy: 0.5 * BB, renk: '#3fbf2a', kare: 'parilti', normal: true, hot: 0.5, a: 1 });
          P({ p: cur, omur: -1, boy: 0.36 * BB, renk: '#c8ff8a', kare: 'kabarcik', hot: 0.6, a: 1 }); }
        if (RND() < 0.5 * OLCEK) P({ p: cur, v: _v2.set(rr(-0.2, 0.2), -0.3, rr(-0.2, 0.2)), g: 6, omur: rr(0.3, 0.45), boy: rr(0.07, 0.11) * 1.4, renk: '#a6ff6a', kare: 'damla', mod: 2, uzat: 0.12, hot: 0.4, on: 0 });
        izParca(onceki, cur, { renk: '#6fdc3a', en: 0.14 * guc, omur: 0.3, a: 0.7 }); break;
      case 'isik':
        P({ p: cur, omur: -1, boy: 0.42 * BB, renk: '#fff6c8', kare: 'yildiz6', rot: k * 8, hot: 1 });
        P({ p: cur, omur: -1, boy: 0.7 * BB, renk, kare: 'parilti', hot: 0.8, a: 0.8 });
        if (RND() < 0.5 * OLCEK) P({ p: cur, v: kureY(_v2, 0.3).multiplyScalar(0.3), drag: 1, omur: rr(0.4, 0.6), boy: rr(0.06, 0.1) * 1.4, renk: '#fff1a8', kare: 'yildiz4', rot: 'r', hot: 1, on: 0 });
        izParca(onceki, cur, { renk, en: 0.14 * guc, omur: 0.3 }); break;
      case 'ses': {
        P({ p: cur, omur: -1, boy: 0.3 * BB, renk, kare: 'parilti', hot: 1, a: 0.9 });
        const ii = (o._i = (o._i || 0) + dt); if (ii > 0.05) { o._i = 0; P({ p: cur, omur: 0.3, boy: 0.12 * BB, boy2: 0.55 * BB, renk, kare: 'halka', hot: 0.8, a: 0.9, fi: 0, fo: 0.2 }); }
        break; }
      default:
        P({ p: cur, omur: -1, boy: 0.34 * BB, renk, kare: 'yildiz4', rot: k * 10, hot: 0.9 });
        P({ p: cur, omur: -1, boy: 0.42 * BB, renk, kare: 'parilti', normal: true, hot: 0.6, a: 0.85 });
        P({ p: cur, omur: -1, boy: 0.7 * BB, renk, kare: 'parilti', hot: 0.5, a: 0.7 });
        if (RND() < 0.6 * OLCEK) P({ p: cur, v: kureY(_v2, 0).multiplyScalar(0.35), drag: 1.5, omur: rr(0.25, 0.45), boy: rr(0.06, 0.12) * 1.4, boy2: 0.02, renk, kare: 'parilti', hot: 1, on: 0 });
        izParca(onceki, cur, { renk, en: 0.12 * guc, omur: 0.24 });
    }
    onceki.copy(cur);
    if (k >= 1) {
      if (kaya) kaya.visible = false;
      const B2 = hedefAl().clone(); const y = _v4.copy(B2).sub(A).setY(0).normalize().clone(), sd = !!(o.sade && o.sade());
      // sade: hedef o an yetenek hazırlığında (ör. golem kayayı kaldırırken) — sıradan vuruşun beyaz balonu yeteneğin önüne geçmesin
      vurus(B2, { renk, guc: guc * (o.varisGuc || 1) * (sd ? 0.55 : 1), yon: y, tur, sade: sd });
      if (o.bitis) o.bitis(B2);
    }
  });
  return { sure };
}

// ───────────────────────── vuruş (darbe) ─────────────────────────
function ekranAci(p, yon) { // yön vektörünün ekrandaki açısı (kesik izini ona göre çevir)
  if (!kamera || !yon) return rr(-0.6, 0.6);
  const a = _v3.copy(p).project(kamera), b = _v4.copy(p).add(yon).project(kamera);
  return Math.atan2(b.y - a.y, (b.x - a.x) * (kamera.aspect || 1.6));
}
const ELEMENT_TUR = { ates: 'ates', buz: 'buz', zehir: 'zehir', isik: 'isik', ses: 'ses', kaya: 'toprak' };
function vurus(pos, o = {}) {
  const p = konum(pos, new THREE.Vector3()), renk = o.renk || '#ffffff', guc = Math.max(0.3, o.guc || 1), yon = o.yon ? _v1.copy(o.yon).normalize().clone() : null, tur = o.tur;
  const onceki = ONCELIK; ONCELIK = 2;
  // savaş okunurluğu (iPad: "curcuna"): parlama diski ~%12 küçük, kıvılcım 10 → 7, yıldız 4 → 2 (vuruş başına)
  flas(p, { renk, boy: (0.48 + 0.31 * guc) * (o.sade ? 0.7 : 1), sure: 0.12 + 0.05 * guc, isikGuc: 3 * guc, a: o.sade ? 0.45 : 1, halka: !o.sade });
  patlama(p, { renk, guc: guc * 0.8, n: 7, hiz: 3, yon, boy: 0.07, yildizN: 2 });
  const el = ELEMENT[o.element || ELEMENT_TUR[tur]]; if (el) altKatman(p, el[2], 0.45 + 0.2 * guc, 0.55);
  const r = ekranAci(p, yon);
  // ekran düzleminde kesik açısına dik kaydırma (pençe izlerini yan yana dizmek için)
  const dik = (d) => { if (!kamera) return _v4.set(d, 0, 0); const a = r + Math.PI / 2; _v2.setFromMatrixColumn(kamera.matrixWorld, 0).multiplyScalar(Math.cos(a) * d); _v3.setFromMatrixColumn(kamera.matrixWorld, 1).multiplyScalar(Math.sin(a) * d); return _v4.copy(_v2).add(_v3); };
  if (!tur || tur === 'yakin') { // yakın dövüş: hız yönünde yay kesiği
    P({ p, omur: 0.18, boy: 0.5 * guc, boy2: 0.85 * guc, en: 1.4, renk: '#ffffff', renk2: renk, kare: 'kesik', rot: r + rr(-0.35, 0.35), hot: 1, fi: 0, fo: 0.25 });
  } else if (tur === 'pence') { // üç paralel pençe izi, 0,06 sn arayla
    for (let j = 0; j < 3; j++) { const q = p.clone().add(dik((j - 1) * 0.13 * guc)); zamanla(j * 0.06, () => { const on2 = ONCELIK; ONCELIK = 2;
      P({ p: q, omur: 0.2, boy: 0.45 * guc, boy2: 0.75 * guc, en: 1.5, renk: '#ffffff', renk2: renk, kare: 'kesik', rot: r + 0.5, hot: 1, fi: 0, fo: 0.3 }); ONCELIK = on2; }); }
  } else if (tur === 'boynuz') { // toslama: yerde şok, toz, çatlak, hafif sarsıntı
    sok(p, { renk, r: 0.7 * guc, toz: true, tozRenk: '#b49a7a', tozN: 8, sure: 0.4 });
    _v3.set(p.x, Z() + 0.03, p.z); P({ p: _v3, mod: 1, normal: true, omur: 1.2, boy: 0.9 * guc, boy2: 1.0 * guc, renk: '#3a2414', kare: 'catlakYer', rot: 'r', hot: 0, a: 0.8, fi: 0.02, fo: 0.55 });
    sars(0.05 * guc);
  } else if (tur === 'yumruk') { // ağır yumruk: kameraya dönük büyük halka + taş kırıntısı
    P({ p, omur: 0.26, boy: 0.25, boy2: 1.25 * guc, renk, kare: 'sok', normal: true, rot: 'r', hot: 0.2, a: 0.9, fi: 0, fo: 0.25 });
    for (let i = 0, n = N(6 * guc); i < n; i++) { kureY(_v2, 0.6).multiplyScalar(rr(1.5, 3)); if (yon) _v2.addScaledVector(yon, 1.5); P({ p, v: _v2, g: 9, drag: 0.6, omur: rr(0.5, 0.8), boy: rr(0.08, 0.15), renk: '#9a7656', kare: 'tas', normal: true, rot: 'r', rotHiz: rr(-8, 8), hot: 0, sek: 0.05, fo: 0.7 }); }
  } else if (tur === 'isirik') { // ısırık: üstten ve alttan kapanan iki kesik + damlacık
    const ust = p.clone().setY(p.y + 0.16 * guc), alt = p.clone().setY(p.y - 0.16 * guc);
    P({ p: ust, v: _v2.set(0, -1.4, 0), drag: 6, omur: 0.2, boy: 0.5 * guc, boy2: 0.7 * guc, en: 1.4, renk: '#ffffff', renk2: renk, kare: 'kesik', rot: Math.PI, hot: 1, fi: 0, fo: 0.3 });
    P({ p: alt, v: _v2.set(0, 1.4, 0), drag: 6, omur: 0.2, boy: 0.5 * guc, boy2: 0.7 * guc, en: 1.4, renk: '#ffffff', renk2: renk, kare: 'kesik', rot: 0, hot: 1, fi: 0, fo: 0.3 });
    for (let i = 0, n = N(6); i < n; i++) { kureY(_v2, 0.7).multiplyScalar(rr(1, 2.2)); P({ p, v: _v2, g: 8, omur: rr(0.3, 0.5), boy: rr(0.07, 0.11), renk, kare: 'damla', mod: 2, uzat: 0.1, hot: 0.3 }); }
  }
  if (tur === 'kaya') { for (let i = 0, n = N(8 * guc); i < n; i++) { kureY(_v2, 0.7).multiplyScalar(rr(1.5, 3.2)); P({ p, v: _v2, g: 9, drag: 0.6, omur: rr(0.6, 0.9), boy: rr(0.1, 0.2), renk: '#a3775a', kare: 'tas', normal: true, rot: 'r', rotHiz: rr(-8, 8), hot: 0, sek: 0.05, fo: 0.7 }); }
    sok(p, { renk: '#e9c48f', r: 0.8 * guc, toz: true, tozRenk: '#b49272', tozN: 8 }); }
  if (tur === 'ates') for (let i = 0, n = N(6 * guc); i < n; i++) { kureY(_v2, 0.9).multiplyScalar(rr(0.6, 1.5)); P({ p, v: _v2, g: -2, drag: 2, omur: rr(0.3, 0.55), boy: rr(0.2, 0.32), boy2: 0.05, renk: '#ffd36a', renk2: '#ff3d1a', kare: 'alev', normal: true, hot: 0.45 }); }
  if (tur === 'buz') for (let i = 0, n = N(6 * guc); i < n; i++) { kureY(_v2, 0.6).multiplyScalar(rr(1, 2.4)); P({ p, v: _v2, g: 7, drag: 1, omur: rr(0.4, 0.6), boy: rr(0.14, 0.24), renk: '#e9fbff', renk2: '#8fd6ff', kare: 'buz', rot: 'r', rotHiz: rr(-6, 6), hot: 0.6, sek: 0.04 }); }
  if (tur === 'zehir') { for (let i = 0, n = N(9 * guc); i < n; i++) { kureY(_v2, 0.8).multiplyScalar(rr(1, 2.4)); P({ p, v: _v2, g: 8, omur: rr(0.35, 0.55), boy: rr(0.08, 0.14), renk: '#a6ff6a', renk2: '#3c9a22', kare: 'damla', mod: 2, uzat: 0.1, hot: 0.4 }); }
    for (let i = 0, n = N(4); i < n; i++) { _v3.set(p.x + rr(-0.2, 0.2), p.y + rr(-0.1, 0.2), p.z + rr(-0.2, 0.2)); P({ p: _v3, v: _v2.set(0, rr(0.3, 0.6), 0), omur: rr(0.5, 0.8), boy: rr(0.12, 0.2), renk: '#3f9a2a', kare: 'kabarcik', normal: true, hot: 0.3, a: 0.9, salin: 0.05 }); } }
  if (tur === 'isik') for (let i = 0, n = N(5); i < n; i++) { kureY(_v2, 0.5).multiplyScalar(rr(0.5, 1.4)); P({ p, v: _v2, g: -0.5, drag: 2, omur: rr(0.5, 0.8), boy: rr(0.12, 0.2), boy2: 0.03, renk: '#fff1a8', kare: 'yildiz4', rot: 'r', rotHiz: rr(-3, 3), hot: 1 }); }
  if (tur === 'ses') { P({ p, omur: 0.35, boy: 0.2, boy2: 1.4 * guc, renk, kare: 'halka', hot: 0.8, fi: 0, fo: 0.2 }); P({ p, omur: 0.45, boy: 0.2, boy2: 1.0 * guc, renk, kare: 'halka', hot: 0.8, fi: 0.2, fo: 0.3 }); }
  if (guc >= 1.5) sars(0.06 * guc);
  ONCELIK = onceki;
  return { sure: 0.3 };
}

// ───────────────────────── 16 yetenek ─────────────────────────
// Zamanlama (sn). ON_SURE: patlama (mermi çıkışı, hücum başlangıcı, kanat vuruşu…) motorun etki anından bu kadar ÖNCE (vfx.yetenek bu
// anda çağrılır). GEC: etkinin görüntüde motordan bu kadar SONRA varması; sahne3d hasar sayısını, darbe tepkisini, ölümü, durum
// efektlerini ve can çubuğunu bu kadar erteler (yalnız görüntü: motor ve olay sırası değişmez). Mermi uçuşu = ON_SURE + GEC.
// Motorun önden gelişi (ONDE_SN 0,4) ve kurulum (0,3–0,5 sn) hazırlığı sınırlar; okunur bir uçuş (Kaya Fırlat 0,42 sn, yüksek yay;
// Gölge Oku 0,3; Zümrüt Zehri 0,34) etkiyi motordan biraz sonraya taşıyarak elde edilir.
const ON_SURE = { tasFirlat: 0.06, uluma: 0, davul: 0, ruhEmme: 0, kasirga: 0.12, deliOfke: 0, zehir: 0.14, buzNefes: 0.12, ocak: 0, dortnal: 0.3, kanat: 0, karaGolge: 0.2, kulDogus: 0.24, ayaz: 0, golgeOk: 0.2, yildirim: 0.05 };
const GEC = { tasFirlat: 0.46, dortnal: 0.12, kasirga: 0.28, zehir: 0.2, buzNefes: 0.1, karaGolge: 0.12, kulDogus: 0.1, golgeOk: 0.1 };
const AYAZ_HIZ = 8.5, KANAT_HIZ = 7, DAVUL_HIZ = 8, OCAK_HIZ = 9;
// hedef başına görsel gecikme (sn, motorun etki anından sonra). o: { tip: 'hasar' | 'iyi' | 'kalkan' | 'durum', sira: hedefin sırası,
// mesafe: kaynağa uzaklık (hücre) } — dalga yayılan yeteneklerde (Ayaz, Işık Kanadı, Savaş Davulu) her hedef dalga değdiğinde tepki verir
function gecikme(ad, o = {}) {
  const tip = o.tip || 'hasar', m = o.mesafe || 0;
  switch (ad) {
    case 'ayaz': return m / AYAZ_HIZ;
    case 'yildirim': return Math.min(2, o.sira || 0) * 0.09;
    case 'kanat': return tip === 'kalkan' || tip === 'durum' ? Math.max(0.3, m / KANAT_HIZ + 0.08) : 0;
    case 'davul': return tip === 'durum' ? 0.6 + m / DAVUL_HIZ : 0;
    case 'ruhEmme': return tip === 'iyi' ? 0.5 : 0;
    case 'zehir': return tip === 'iyi' ? 0.55 : GEC.zehir;
    case 'ocak': return tip === 'iyi' ? 0.3 : Math.min(0.3, m / OCAK_HIZ);
    case 'deliOfke': return tip === 'iyi' ? 0.15 : 0;
    default: return GEC[ad] || 0;
  }
}
const yukari = (p, h) => _v1.copy(p).setY(p.y + h);
// atış doğrultusu kameranın bakışıyla çakışıyorsa (oyun kamerası birimi arkadan görür: uçuş ekranda kısa, dikey bir çizgi ve çubukların
// altında) ekranın sağına kavis vektörü (yatay, büyüklük = guc × hizalılık); hizalı değilse sıfır. out'a yazar
function yanKavis(A, B, guc, out) {
  out.set(0, 0, 0); if (!kamera) return out;
  const kd = _v2.setFromMatrixColumn(kamera.matrixWorld, 2).setY(0), at = _v3.copy(B).sub(A).setY(0);
  if (kd.lengthSq() < 1e-6 || at.lengthSq() < 1e-6) return out; kd.normalize(); at.normalize();
  const hiza = Math.abs(kd.dot(at)); out.set(-at.z, 0, at.x); const sag = _v4.setFromMatrixColumn(kamera.matrixWorld, 0); if (out.dot(sag) < 0) out.negate();
  return out.multiplyScalar(guc * Math.max(0, hiza - 0.35) / 0.65);
}
// kadraj: yay tepesi (A–B ortası + yuk) ekranın üst kenarından taşacaksa yay alçaltılır (alçak önizleme kamerasında kaya kadrajdan çıkmasın;
// kuşbakışı oyun kamerasında yüksek yay korunur). r: nesnenin yarıçapı, en az: alt sınır
function kadrajYuk(A, B, yuk, r, enAz) {
  if (!kamera) return yuk;
  for (let i = 0; i < 8 && yuk > enAz; i++) { _v1.copy(A).add(B).multiplyScalar(0.5); _v1.y += yuk + r; _v1.project(kamera); if (_v1.y < 0.9) break; yuk = Math.max(enAz, yuk * 0.85); }
  return yuk;
}
// iri, doygun nota + koyu kontur (aynı yol: aynı hız, sürtünme, dönüş) — orta mesafeden ve açık gökte okunur
function nota(p, v, boy, omur) { const rot = rr(-0.3, 0.3), rh = rr(-1.2, 1.2);
  P({ p, v, drag: 1.2, omur, boy: boy * 1.3, renk: '#3a1200', kare: 'nota', normal: true, rot, rotHiz: rh, hot: 0, a: 0.75, salin: 0.05, fo: 0.6 });
  P({ p, v, drag: 1.2, omur, boy, renk: '#ffd36a', renk2: '#ff7a1f', kare: 'nota', rot, rotHiz: rh, hot: 0.35, salin: 0.05, fo: 0.6 }); }
const _okZ = new THREE.Vector3(0, 0, 1);
// Kaya Fırlat çarpması: kaya 3B parçalara ayrılır (yerçekimi, sekme, dönme; küçülerek söner), toz halkası ve toz sütunu, yer çatlağı,
// turuncu ışık, sarsıntı. C çarpma noktası, R kayanın yarıçapı, yon atış yönü (yatay)
function kayaKir(C, R, yon, g = 1) {
  const onceki = ONCELIK; ONCELIK = 2;
  flas(C, { renk: '#ffd08a', boy: 1.15 * g, sure: 0.2, isikGuc: 8 });
  if (parcaKaya) for (let i = 0, n = OLCEK < 1 ? 6 : 8; i < n; i++) { const a = i / n * TAU + rr(-0.3, 0.3);
    _v2.set(Math.cos(a), 0, Math.sin(a)).multiplyScalar(rr(0.45, 0.95)).addScaledVector(yon, rr(0.15, 0.45)); _v2.y = rr(3.0, 4.6);   // dar alan, yukarı: komşu birimin gövdesinden geçmesin, gövdelerin üstünden görünsün
    _v3.copy(C).addScaledVector(_v2, 0.05); parcaKaya.ekle(_v3, _v2, (R / KAYA_R) * rr(0.3, 0.46), rr(0.95, 1.3), { don: 10 }); }
  for (let i = 0, n = N(10); i < n; i++) { kureY(_v2, 0.7).multiplyScalar(rr(1.5, 3.4)); _v2.addScaledVector(yon, 1); P({ p: C, v: _v2, g: 9, drag: 0.6, omur: rr(0.6, 0.9), boy: rr(0.1, 0.18), renk: '#8e6a4c', kare: 'tas', normal: true, rot: 'r', rotHiz: rr(-8, 8), hot: 0, sek: 0.05, fo: 0.7 }); }
  sok(new THREE.Vector3(C.x, Z(), C.z), { renk: '#e8b878', r: 1.25 * g, toz: true, tozRenk: '#a98361', tozN: 12, a: 0.6 });
  // toz sütunu: hedefi örtmesin (seyrek, kısa ömürlü, gövdenin arkasına ve yanlarına)
  for (let i = 0, n = N(5); i < n; i++) { const a = i / 5 * TAU + rr(-0.3, 0.3); _v3.set(C.x + Math.cos(a) * 0.4, Z() + 0.1, C.z + Math.sin(a) * 0.4);
    P({ p: _v3, v: _v2.set(Math.cos(a) * 0.5, rr(1.4, 2.4), Math.sin(a) * 0.5), drag: 2.8, omur: rr(0.5, 0.75), boy: 0.3, boy2: 0.75, renk: '#a98361', renk2: '#e2d2b8', kare: 'toz', normal: true, rot: 'r', rotHiz: rr(-1, 1), a: 0.62, hot: 0, fo: 0.55 }); }
  _v3.set(C.x, Z() + 0.03, C.z);
  P({ p: _v3, mod: 1, normal: true, omur: 2.2, boy: 1.5 * g, boy2: 1.6 * g, renk: '#2b1c10', kare: 'catlakYer', rot: 'r', hot: 0, a: 0.85, fi: 0.02, fo: 0.6 });
  dekal(_v3, { r: 0.9 * g, renk: '#3a2614', kare: 'toz', a: 0.55, sure: 1.8 });
  sars(0.22 * g); ONCELIK = onceki;
}

const YETENEK = {
  // Kaya Golemi: hazırlıkta yerden koparılıp başın üstüne kaldırılan iri kaya (aynı ağ, HAZIR.tasFirlat) yüksek bir yay çizerek fırlar,
  // döner; arkasında toz ve dökülen çakıl, yerde hedefe doğru büyüyen gölgesi → çarpınca 3B parçalara kırılır (kayaKir)
  tasFirlat(k, hs, o) {
    const h = hs[0]; if (!h) return; const g = o.guc, U = Math.max(0.2, o.ucus || 0.42);
    let kaya = null; const elde = k.o ? kayaElde.get(k.o) : null;
    if (elde) { kayaElde.delete(k.o); elde.atildi = true; if (elde.kaya.visible) kaya = elde.kaya; else elde.kaya.userData.ayrildi = false; }
    const A = new THREE.Vector3();
    if (kaya) A.copy(kaya.position);
    else { A.copy(o.soket || yukari(k.p, 1.15 * k.h)); kaya = kayaAl(); if (kaya) { kaya.position.copy(A); kaya.scale.setScalar(KAYA_BUYUK); } }
    const R = kaya ? KAYA_R * kaya.scale.x : KAYA_R * KAYA_BUYUK;
    // bırakma: ellerden toz savrulur
    for (let i = 0, n = N(8); i < n; i++) { kureY(_v2, 0.1).multiplyScalar(rr(0.6, 1.4)); P({ p: A, v: _v2, drag: 2.4, g: 1.5, omur: rr(0.4, 0.65), boy: rr(0.18, 0.3), boy2: rr(0.45, 0.7), renk: '#b99772', renk2: '#e6d4b8', kare: 'toz', normal: true, rot: 'r', a: 0.7, hot: 0 }); }
    const B = new THREE.Vector3(), cur = new THREE.Vector3(), hedefAl = () => { konum(h.o || h.p, B); B.y += (h.h || 1) * 0.42; return B; };
    // yüksek yay (yakın dövüşte hedef bitişik: alçak yay gövdenin ve can çubuklarının arkasında kalıyordu) ve atış doğrultusu kameranın
    // bakışıyla çakışıyorsa (oyun kamerası birimi arkadan görür: uçuş ekranda dikey bir çizgi olur) ekranın sağına hafif kavis
    hedefAl(); let yuk = Math.max(1.15, 0.45 * A.distanceTo(B)) * (o.kut ? 1.12 : 1); const yan = new THREE.Vector3();
    yuk = kadrajYuk(A, B, yuk, R, 0.55);
    yanKavis(A, B, 0.6, yan);
    surec(U, (kk, dt) => {
      hedefAl(); cur.lerpVectors(A, B, kk); cur.y += 4 * yuk * kk * (1 - kk);   // yatayda doğrusal, dikeyde parabol: önce yükselir, hızlanarak iner
      cur.addScaledVector(yan, Math.sin(Math.PI * kk)); odak(cur, R * 1.7);
      if (kaya) { kaya.position.copy(cur); kaya.rotation.x += dt * 8; kaya.rotation.z += dt * 5; kaya.children[0].material.emissiveIntensity = 1.4 + Math.sin(kk * 40) * 0.6; }
      else P({ p: cur, omur: -1, boy: R * 2, renk: '#a3775a', kare: 'tas', normal: true, rot: kk * 12, hot: 0 });
      // yerdeki gölge: kaya alçaldıkça koyulaşır ve toplanır (nereye düşeceği okunur)
      const gk = Math.min(1, Math.max(0, cur.y - Z()) / 2.2);
      _v3.set(cur.x, Z() + 0.03, cur.z); P({ p: _v3, mod: 1, omur: -1, boy: R * (2.4 + 1.8 * gk), renk: '#140c06', kare: 'parilti', normal: true, hot: 0, a: 0.6 - 0.32 * gk });
      // iz: toz bulutçukları ve dökülen çakıl
      if (RND() < 0.7 * OLCEK) { kureY(_v2, 0); _v4.copy(cur).addScaledVector(_v2, R * 0.7); P({ p: _v4, v: _v2.multiplyScalar(0.3), drag: 2, omur: rr(0.3, 0.45), boy: R * 0.4, boy2: R * 0.85, renk: '#a3825e', renk2: '#d8c4a4', kare: 'toz', normal: true, rot: 'r', a: 0.45, hot: 0, on: 0 }); }
      if (RND() < 0.35 * OLCEK) P({ p: cur, v: _v2.set(rr(-0.4, 0.4), rr(-0.5, 0.5), rr(-0.4, 0.4)), g: 9, omur: 0.6, boy: rr(0.06, 0.1), renk: '#7a5a3e', kare: 'tas', normal: true, rot: 'r', rotHiz: rr(-8, 8), hot: 0, sek: 0.04, on: 0 });
      if (kk >= 1) {
        if (kaya) { kaya.visible = false; kaya.userData.ayrildi = false; }
        const C = B.clone(), yon = _v4.copy(B).sub(A).setY(0); if (yon.lengthSq() < 1e-6) yon.set(0, 0, 1);
        kayaKir(C, R, yon.normalize().clone(), g);
      }
    });
  },
  // Kristal Kurt: ağızdan göğe ses konisi ve ışın; yerde alanın sınırına (2 hücre) yayılan ses halkaları ve sınırda parlayan kristal rün
  // çemberi; dostlara yerden akan mavi zerre dalgası, değince flaş ve yükselen kristal kıvılcımlar (4 sn hız izi: DURUM.hiz)
  uluma(k, hs, o) {
    const bas = o.soket ? new THREE.Vector3().copy(o.soket) : new THREE.Vector3().copy(k.p).setY(k.p.y + 0.75 * k.h), g = o.guc, R = 2.1;
    // ses konileri başın ÜSTÜNDEN göğe (gövdeyi beyaza boğmasın: kısık, başın 0,25 üstünden çıkar)
    const basU = bas.clone().setY(bas.y + 0.25 * k.h);
    for (let d = 0; d < 3; d++) zamanla(d * 0.13, () => {
      for (let j = 0; j < 3; j++) P({ p: basU, mod: 1, v: _v2.set(0, 2.2 + j * 0.9, 0), drag: 1.2, omur: 0.55, boy: 0.18 + j * 0.08, boy2: (0.9 + j * 0.45) * g, renk: '#bff0ff', renk2: '#3d7bff', kare: 'halka', hot: 0.45, a: 0.7 - j * 0.15, fi: 0, fo: 0.35 });
      P({ p: basU, omur: 0.45, boy: 0.2, boy2: 1.0 * g, renk: '#4fa8ff', kare: 'halka', normal: true, hot: 0.2, a: 0.45, fi: 0, fo: 0.2 });
    });
    surec(0.6, () => odak(_v3.copy(bas).setY(bas.y + 0.1 * k.h), 0.45 * k.h));   // uluyan baş can çubuğunun ve balonun altında kalmasın
    // göğe ışın başın ÜSTÜNDEN başlar (kurdu beyaz bir camın içine almasın)
    _v3.copy(basU).setY(basU.y + 1.25); P({ p: _v3, mod: 2, eksen: _v4.set(0, 1, 0), omur: 0.5, boy: 1, en: 0.3 * g, uz: 2.2, boy2: 1.3, renk: '#5fb8ff', kare: 'isin', hot: 0.35, a: 0.4, fi: 0.05, fo: 0.5 });
    const c0 = new THREE.Vector3(k.p.x, Z() + 0.05, k.p.z);
    for (let d = 0; d < 3; d++) zamanla(d * 0.12, () => {
      P({ p: c0, mod: 1, omur: 0.5, boy: 0.5, boy2: R * 2.05, renk: '#5fb0ff', renk2: '#2a5fd0', kare: 'sok', normal: true, rot: 'r', hot: 0.2, a: 0.5 - d * 0.1, fi: 0, fo: 0.4 });
      P({ p: c0, mod: 1, omur: 0.4, boy: 0.4, boy2: R * 1.9, renk: '#6fc8ff', kare: 'halka', hot: 0.5, a: 0.4, fi: 0, fo: 0.25 }); });
    zamanla(0.3, () => run(c0, { renk: '#2f6bff', renk2: '#8fd0ff', r: R, a: 0.26, sure: 0.45, donus: 0.5 }));
    flas(basU, { renk: '#5fb8ff', boy: 0.42, sure: 0.16, a: 0.7, isik: false });
    for (let i = 0, n = N(12 * g); i < n; i++) { kureY(_v2, 0.9).multiplyScalar(rr(1.5, 3)); P({ p: bas, v: _v2, g: 5, drag: 1.2, omur: rr(0.5, 0.8), boy: rr(0.16, 0.28), renk: '#e9fbff', renk2: '#6fb8ff', kare: 'buz', rot: 'r', rotHiz: rr(-5, 5), hot: 0.7, sek: 0.05 }); }
    for (const h of hs) {
      const ben = !!(h.o && h.o === k.o), hp = new THREE.Vector3().copy(h.p).setY(h.p.y + 0.5 * h.h), hz = new THREE.Vector3(h.p.x, Z(), h.p.z), d = Math.hypot(h.p.x - k.p.x, h.p.z - k.p.z), varis = ben ? 0.05 : 0.06 + d / 7;
      if (!ben) { const A = c0.clone(); surec(varis, (kk, dt, yas, is) => { const e = cikisK(kk); _v3.lerpVectors(A, hz, e).setY(Z() + 0.12);
        P({ p: _v3, omur: -1, boy: 0.5, renk: '#6fc8ff', kare: 'parilti', hot: 0.8, a: 0.85 });
        is.acc = (is.acc || 0) + dt * 70 * OLCEK; while (is.acc >= 1) { is.acc--; _v4.set(_v3.x + rr(-0.12, 0.12), Z() + rr(0.04, 0.2), _v3.z + rr(-0.12, 0.12));
          P({ p: _v4, v: _v2.set(rr(-0.2, 0.2), rr(0.6, 1.4), rr(-0.2, 0.2)), drag: 2, omur: rr(0.3, 0.5), boy: rr(0.08, 0.14), boy2: 0.03, renk: '#bfefff', renk2: '#3d7bff', kare: RND() < 0.4 ? 'yildiz4' : 'parilti', hot: 1 }); } }); }
      zamanla(varis, () => {
        if (!ben) flas(hp, { renk: '#8fdcff', boy: 0.6, sure: 0.18, halka: false, isik: false });
        for (let i = 0, n = N(10); i < n; i++) { const a = RND() * TAU; _v3.set(hz.x + Math.cos(a) * 0.32, Z() + rr(0, 0.3), hz.z + Math.sin(a) * 0.32); P({ p: _v3, v: _v2.set(0, rr(2.8, 4.4), 0), drag: 2, omur: rr(0.45, 0.65), boy: rr(0.17, 0.24), uz: 1.6, en: 0.6, renk: '#dff6ff', renk2: '#2f7bff', kare: 'kivilcim', mod: 2, uzat: 0.25, hot: 0.8 }); }
        // hız işareti: başın üstünde yükselen iri mavi yıldız ve iki ok başı (^) — orta mesafeden de seçilir
        const hb = hp.clone().setY(hz.y + (h.h || 1) * 1.05);
        P({ p: hb, v: _v2.set(0, 0.9, 0), drag: 1.5, omur: 0.7, boy: 0.42, boy2: 0.2, renk: '#9fe4ff', renk2: '#2f6bff', kare: 'yildiz4', rot: 0.785, hot: 0.6, fi: 0.05, fo: 0.5 });
        if (kamera) for (let j = 0; j < 2; j++) for (const sg of [-1, 1]) { const sag = _v1.setFromMatrixColumn(kamera.matrixWorld, 0);
          _v4.copy(hb).setY(hb.y - 0.14 - j * 0.17).addScaledVector(sag, sg * 0.075);
          P({ p: _v4, v: _v2.set(0, 1.1, 0), drag: 1.2, omur: 0.6, boy: 1, en: 0.09, uz: 0.24, renk: '#e6f8ff', renk2: '#3d7bff', kare: 'isin', mod: 2, eksen: _v3.copy(sag).multiplyScalar(-sg).addScaledVector(_pY, 1.1), hot: 0.7, a: 0.95, fi: 0.08 + j * 0.06, fo: 0.4 }); }
        sok(hz, { renk: '#8fdcff', r: 0.55, sure: 0.4, a: 0.7 });
      });
    }
  },
  // Davulcu Kurbağa: göbeğin önünde beliren 3B savaş davuluna dört vuruş (deri her vuruşta parlar, kameraya dönük şok, nota); yerde her
  // vuruşta büyüyen halka, dördüncüde bütün sahaya yayılan dalga → dalga değen dostta turuncu flaş, notalar, güç sütunu
  davul(k, hs, o) {
    const g = o.guc, il = o.ileri || _v4.set(0, 0, 1), ilx = il.x, ilz = il.z, dv = k.o ? davulElde.get(k.o) : null;
    const c0 = new THREE.Vector3(k.p.x, Z() + 0.05, k.p.z), R = 10, m = new THREE.Vector3();
    for (let d = 0; d < 4; d++) zamanla(d * 0.2, () => {
      if (dv && dv.visible) { m.copy(dv.position); dv.userData.vur = 1; } else m.set(k.p.x + ilx * 0.32 * k.h, k.p.y + 0.42 * k.h, k.p.z + ilz * 0.32 * k.h);
      const son = d === 3;
      // vuruş: deride turuncu-beyaz patlama yıldızı + kameraya dönük kalın şok halkası (darbe hissi), nota
      // (parlamalar kısık ve kısa: 3B davulun derisi ve çemberi vuruşlar arasında görünür kalsın; asıl vuruş derinin ışıması ve ezilmesi)
      flas(m, { renk: '#ffb347', boy: son ? 0.8 : 0.5, sure: 0.12, halka: false, isik: son || d === 0, a: 0.75 });
      P({ p: m, omur: 0.13, boy: 0.4, boy2: 0.62, renk: '#fff0c0', renk2: '#ff8a2e', kare: 'yildiz4', rot: rr(-0.4, 0.4), hot: 0.6, a: 0.9, fi: 0, fo: 0.2 });
      P({ p: m, omur: 0.3, boy: 0.25, boy2: (0.9 + 0.25 * d) * g, renk: '#ffd08a', renk2: '#ff7a1f', kare: 'sok', normal: true, rot: 'r', hot: 0.3, a: 0.95, fi: 0, fo: 0.25 });
      P({ p: m, omur: 0.35, boy: 0.3, boy2: 1.3 + 0.2 * d, renk: '#ff9a2e', kare: 'dalga', normal: true, hot: 0.3, fi: 0, fo: 0.3 });
      for (let j = 0, nj = son ? 3 : 1; j < nj; j++) { _v3.set(m.x + rr(-0.15, 0.15), m.y + 0.15, m.z + rr(-0.15, 0.15)); nota(_v3, _v2.set(rr(-0.4, 0.4), rr(1.0, 1.6), rr(-0.4, 0.4)), rr(0.3, 0.38), rr(0.7, 0.9)); }
      if (!son) { sok(c0, { renk: d % 2 ? '#ffb347' : '#ff7a2e', r: (0.9 + 0.45 * d) * g, sure: 0.5 });
        const mN = N(8); for (let i = 0; i < mN; i++) { const a = i / mN * TAU + d * 0.3; _v3.set(c0.x + Math.cos(a) * 0.35, Z() + 0.06, c0.z + Math.sin(a) * 0.35);
          P({ p: _v3, mod: 1, v: _v2.set(Math.cos(a) * (2.4 + d) * g, 0, Math.sin(a) * (2.4 + d) * g), drag: 1.2, omur: 0.55, boy: 0.42, boy2: 0.75, renk: '#ffb02e', renk2: '#ff5a1f', kare: 'dalga', normal: true, rot: -a - Math.PI / 2, hot: 0.2, fi: 0, fo: 0.4 }); } }
      else { sars(0.12 * g); sok(c0, { renk: '#ff7a2e', r: 2.0 * g, sure: 0.5, toz: true, tozRenk: '#c9a982', tozN: 6 });
        // bütün sahaya yayılan ses dalgası: ince turuncu halka (geniş alanı örtmesin: düşük opaklık, sertçe söner)
        // (ölçeklenen halka doku 20 birimde kalın bir bant oluyordu → sabit boylu ses yaylarından halka: cephe ince kalır) + çok soluk iz halkası
        const nA = N(30), om = Math.min(1.1, R / DAVUL_HIZ);
        for (let i = 0; i < nA; i++) { const a = i / nA * TAU; _v3.set(c0.x + Math.cos(a) * 0.7, Z() + 0.06, c0.z + Math.sin(a) * 0.7);
          P({ p: _v3, mod: 1, v: _v2.set(Math.cos(a) * DAVUL_HIZ, 0, Math.sin(a) * DAVUL_HIZ), omur: om, boy: 0.5, boy2: 0.95, renk: '#ffc46a', renk2: '#ff6a1f', kare: 'dalga', normal: true, rot: -a - Math.PI / 2, hot: 0.25, a: 0.9, fi: 0, fo: 0.35 }); }
        P({ p: c0, mod: 1, omur: om * 0.8, boy: 0.6, boy2: R * 1.6, renk: '#ffb347', kare: 'halka', hot: 0.3, a: 0.16, fi: 0, fo: 0.3 }); }
    });
    for (const h of hs) { if (h.o && h.o === k.o) continue; const d = Math.hypot(h.p.x - k.p.x, h.p.z - k.p.z), hp = new THREE.Vector3().copy(h.p), hh = h.h;
      zamanla(0.6 + d / DAVUL_HIZ, () => { if (h.o) konum(h.o, hp); _v3.copy(hp).setY(hp.y + 0.55 * hh); flas(_v3, { renk: '#ffb347', boy: 0.65, sure: 0.18, halka: false, isik: false });
        sutun(hp, { renk: '#ff8a2e', ic: '#ffe1a0', h: 1.6, en: 0.6, sure: 0.5, zerre: false, a: 0.8 });
        for (let i = 0, n = N(3); i < n; i++) { _v4.set(hp.x + rr(-0.25, 0.25), hp.y + hh * rr(0.75, 1.0), hp.z + rr(-0.25, 0.25)); nota(_v4, _v2.set(rr(-0.3, 0.3), rr(0.8, 1.3), rr(-0.3, 0.3)), rr(0.28, 0.34), rr(0.75, 1.0)); }
        for (let i = 0, n = N(8); i < n; i++) { _v3.set(hp.x, Z() + 0.1, hp.z); P({ p: _v3, yorunge: { r: rr(0.3, 0.45), w: rr(3, 5), vy: rr(1, 2) }, omur: rr(0.5, 0.8), boy: rr(0.08, 0.14), boy2: 0.02, renk: '#ffcf6a', kare: RND() < 0.4 ? 'yildiz4' : 'parilti', hot: 1 }); } }); }
  },
  // Sis Yarasası: kavrama → hedefin göğsünden kızıl can küresi (kalp) sökülür, sarmal çizerek yarasanın ağzına akar (0,5 sn); ardında
  // kızıl kıvılcım akışı. Varışta yarasada kızıl flaş, iyileşme ve aura (gövde şişmesi pozdan, parlama sahne3d'den)
  ruhEmme(k, hs, o) {
    const h = hs[0]; if (!h) return; const g = o.guc;
    const hp = new THREE.Vector3().copy(h.p).setY(h.p.y + 0.5 * h.h), kp = o.soket ? new THREE.Vector3().copy(o.soket) : new THREE.Vector3().copy(k.p).setY(k.p.y + 0.55 * k.h);
    flas(hp, { renk: '#ff3d5a', boy: 0.8, sure: 0.2 });
    _v4.copy(hp).sub(kp).setY(0); if (_v4.lengthSq() < 1e-6) _v4.set(0, 0, 1);
    P({ p: hp, mod: 2, eksen: _v2.set(-_v4.z, 0.6, _v4.x).normalize(), omur: 0.3, boy: 1, en: 0.16, uz: 0.9, boy2: 1.2, renk: '#ff2d4d', kare: 'kesik', hot: 0.8, a: 1, fi: 0, fo: 0.4 });
    for (let i = 0, n = N(8); i < n; i++) { kureY(_v2, 0.3).multiplyScalar(rr(1, 2.2)); P({ p: hp, v: _v2, drag: 2, g: -0.5, omur: rr(0.5, 0.8), boy: rr(0.28, 0.45), boy2: 0.7, renk: '#5a0f2a', renk2: '#2a0a1a', kare: 'duman', normal: true, rot: 'r', a: 0.55, hot: 0 }); }
    const yer = new THREE.Vector3(), dis = new THREE.Vector3().copy(kp).sub(hp).setY(0); if (dis.lengthSq() < 1e-6) dis.set(0, 0, 1); dis.normalize();
    const VAR = 0.5, kalp = kalpAl(), cik = 0.14, ucY = kadrajYuk(hp, kp, Math.max(0.75, 0.5 * hp.distanceTo(kp)), 0.2, 0.4), kYan = yanKavis(hp, kp, 0.4, new THREE.Vector3());
    // 3B can kalbi: hedefin göğsünden sökülür (büyüyerek dışarı çıkar), yüksek bir yay çizerek (yakın dövüşte iki gövde bitişik: alçak yol
    // kafaların ve çubukların arkasında kalıyordu) yarasanın ağzına akar; nabız atar, kameraya döner, arkasında kızıl kıvılcım şeridi
    surec(VAR, (kk, dt, yas, is) => {
      let olc = 1;
      if (yas < cik) { const e = yas / cik; yer.copy(hp).addScaledVector(dis, 0.18 * e); yer.y += 0.1 * e; olc = cikisK(e); }
      else { const e = (yas - cik) / (VAR - cik), ee = e * e * (3 - 2 * e); _v4.copy(hp).addScaledVector(dis, 0.18).setY(hp.y + 0.1); yer.lerpVectors(_v4, kp, ee); yer.y += Math.sin(Math.PI * ee) * ucY; yer.addScaledVector(kYan, Math.sin(Math.PI * ee)); olc = 1 - 0.35 * Math.max(0, (e - 0.75) / 0.25); }
      const nab = 1 + 0.16 * Math.max(0, Math.sin(yas * 26)), bo = 0.42 * g * olc * nab;
      if (kalp) { kalp.position.copy(yer); if (kamera) kalp.quaternion.copy(kamera.quaternion); kalp.rotateY(Math.sin(yas * 9) * 0.55); kalp.scale.setScalar(bo); kalp.material.emissiveIntensity = 0.7 + 0.6 * (nab - 1) / 0.16; if (kk >= 1) kalp.visible = false; }
      else P({ p: yer, omur: -1, boy: 0.5 * g * olc, renk: '#ff5a72', renk2: '#ff1a3d', kare: 'kalp', hot: 0.5, a: 1 });
      P({ p: yer, omur: -1, boy: 0.9 * g * olc, renk: '#5a0418', kare: 'parilti', normal: true, hot: 0, a: 0.45 });   // koyu hâle: açık zeminde kalp seçilsin
      P({ p: yer, omur: -1, boy: 0.62 * nab * g * olc, renk: '#ff2d4d', kare: 'parilti', hot: 0.3, a: 0.5 });
      odak(yer, 0.32);
      is.acc = (is.acc || 0) + dt * 70 * OLCEK; while (is.acc >= 1) { is.acc--; _v3.copy(yer).add(kureY(_v2, 0).multiplyScalar(0.08));
        P({ p: _v3, v: kureY(_v2, 0.2).multiplyScalar(rr(0.15, 0.4)), drag: 2, omur: rr(0.3, 0.5), boy: rr(0.09, 0.15), boy2: 0.02, renk: '#ff8aa0', renk2: '#c0103a', kare: RND() < 0.3 ? 'kalp' : 'parilti', hot: 0.6, fo: 0.5 }); }
    });
    surec(0.75, (kk, dt, yas, is) => { is.acc = (is.acc || 0) + dt * 42 * OLCEK * g; while (is.acc >= 1) { is.acc--;
      kureY(_v2, 0.5).multiplyScalar(rr(1.5, 3)); _v3.copy(hp).add(_v4.set(rr(-0.15, 0.15), rr(-0.1, 0.2), rr(-0.15, 0.15))); const t = RND();
      if (t < 0.5) P({ p: _v3, v: _v2, hedef: kp, hom: rr(3, 5), hiz: rr(3.5, 5), omur: 1.4, boy: rr(0.14, 0.22), uz: 2.2, en: 0.7, renk: '#ffd0da', renk2: '#ff2d4d', kare: 'kivilcim', mod: 2, uzat: 0.08, hot: 0.7, fo: 0.85 });
      else if (t < 0.82) P({ p: _v3, v: _v2, hedef: kp, hom: rr(3, 5), hiz: rr(3.5, 5), omur: 1.4, boy: rr(0.3, 0.45), boy2: 0.16, renk: '#ff2d4d', renk2: '#c0103a', kare: 'parilti', hot: 0.5, fo: 0.85 });
      else P({ p: _v3, v: _v2, hedef: kp, hom: rr(3, 5), hiz: rr(3.2, 4.5), omur: 1.4, boy: rr(0.28, 0.4), boy2: 0.14, renk: '#9a0f30', renk2: '#5a0820', kare: 'duman', normal: true, rot: 'r', rotHiz: 3, a: 0.75, hot: 0, fo: 0.8 }); } }, 0.12);
    // varış: ağızda kızıl kalp patlaması (küçük kalpler saçılır), iyileşme; gövde parlaması kısık (yarasanın ayrıntısı kaybolmasın)
    zamanla(VAR, () => { flas(kp, { renk: '#ff3d5a', boy: 0.62, sure: 0.22, a: 0.8 }); iyiles(k, '#ff6a85', { sutun: 0.45 });
      for (let i = 0, n = N(7); i < n; i++) { kureY(_v2, 0.5).multiplyScalar(rr(0.8, 1.6)); P({ p: kp, v: _v2, drag: 2.4, g: -0.4, omur: rr(0.45, 0.7), boy: rr(0.14, 0.2), renk: '#ff5a72', renk2: '#ff1a3d', kare: 'kalp', hot: 0.4, fo: 0.5 }); }
      _v3.set(k.p.x, Z() + 0.05, k.p.z); P({ p: _v3, mod: 1, omur: 0.5, boy: 0.4, boy2: 1.6, renk: '#ff3d5a', kare: 'sok', normal: true, rot: 'r', hot: 0.3, a: 0.8, fi: 0, fo: 0.3 });
      aura(k.o || k.p, { renk: '#ff4d6d', renk2: '#ffd0da', sure: 0.5, oran: 12, boy: k.h }); });
  },
  // Rüzgâr Ruhu: avuçtan yere inen küçük 3B hortum yerde kayarak hedefe ilerler (toz, yaprak, kıvrımlı iz) → hedefte büyür: dönen,
  // yukarı genişleyen koni + yörüngeli yaprak ve kıvılcım; itilenler havalanıp savrulur (sahne3d)
  kasirga(k, hs, o) {
    const h = hs[0]; if (!h) return; const g = o.guc, U = Math.max(0.15, o.ucus || 0.4), c = new THREE.Vector3().copy(h.p).setY(Z());
    const avuc = o.soket ? new THREE.Vector3().copy(o.soket) : new THREE.Vector3().copy(k.p).setY(k.p.y + 0.7 * k.h);
    flas(avuc, { renk: '#bff7ea', boy: 0.6, sure: 0.15, halka: false });
    for (let i = 0, n = N(8); i < n; i++) { kureY(_v2, 0).multiplyScalar(rr(1, 2)); P({ p: avuc, v: _v2, drag: 2, omur: rr(0.3, 0.5), boy: rr(0.14, 0.2), renk: RND() < 0.5 ? '#7dd35a' : '#c9e85a', kare: 'yaprak', normal: true, rot: 'r', rotHiz: rr(-8, 8), hot: 0 }); }
    const il = o.ileri || _v4.set(0, 0, 1), A = new THREE.Vector3(k.p.x + il.x * 0.45 * k.h, Z(), k.p.z + il.z * 0.45 * k.h), hm = hortumAl(), cur = new THREE.Vector3();
    // avuçtan yere inen girdap çizgileri
    for (let i = 0, n = N(6); i < n; i++) { _v2.copy(A).sub(avuc).multiplyScalar(rr(4, 6)); P({ p: avuc, v: _v2, drag: 3, omur: 0.25, boy: 0.12, uz: 2, en: 0.5, renk: '#e8fff9', renk2: '#7fc8c0', kare: 'kivilcim', mod: 2, uzat: 0.1, hot: 0.9 }); }
    surec(U, (kk, dt, yas, is) => { const e = kk < 0.5 ? 2 * kk * kk : 1 - 2 * (1 - kk) * (1 - kk); cur.lerpVectors(A, c, e); cur.x += Math.sin(kk * 9) * 0.07; cur.z += Math.cos(kk * 7) * 0.07;
      // yerde kayan hortum: oyun kamerasında gövdenin ve çubukların arkasında kaybolmasın diye iri ve daha opak (odak: kaplama çekilir)
      if (hm) { hm.position.copy(cur); const s0 = (0.5 + 0.14 * kk) * g; hm.scale.set(s0, (0.62 + 0.16 * kk) * g, s0); hm.material.uniforms.uA.value = Math.min(1, yas / 0.06); }
      odak(_v1.copy(cur).setY(Z() + 0.65 * g), 0.55 * g);
      is.acc = (is.acc || 0) + dt * 50 * OLCEK; while (is.acc >= 1) { is.acc--; _v3.set(cur.x, Z() + rr(0.02, 0.15), cur.z);
        if (RND() < 0.4) P({ p: _v3, yorunge: { r: rr(0.12, 0.22), w: rr(9, 12), vy: rr(1.2, 2.0), rv: 0.2 }, omur: rr(0.3, 0.45), boy: rr(0.12, 0.18), renk: RND() < 0.5 ? '#7dd35a' : '#c9e85a', renk2: '#4a9a3a', kare: 'yaprak', normal: true, rot: 'r', rotHiz: rr(-8, 8), hot: 0 });
        else P({ p: _v3, v: _v2.set(rr(-0.4, 0.4), rr(0.3, 0.8), rr(-0.4, 0.4)), drag: 2.5, omur: rr(0.45, 0.7), boy: 0.18, boy2: 0.5, renk: '#cdbb9a', renk2: '#efe6d6', kare: 'toz', normal: true, rot: 'r', a: 0.65, hot: 0 }); }
      is.iz = (is.iz || 0) + dt; if (is.iz > 0.05) { is.iz = 0; _v3.set(cur.x, Z() + 0.03, cur.z); P({ p: _v3, mod: 1, omur: 0.55, boy: 0.5, boy2: 0.65, renk: '#cfffee', kare: 'girdap', rot: yas * 10, rotHiz: -8, hot: 0.4, a: 0.5, fi: 0.1, fo: 0.4, on: 0 }); }
    });
    zamanla(U, () => {
      for (const t of hs) if (t.o) surec(0.45, (kk, dt, yas, is) => { is.acc = (is.acc || 0) + dt * 34 * OLCEK; const tp = takipPoz(t.o);
        while (is.acc >= 1) { is.acc--; _v3.set(tp.x + rr(-0.15, 0.15), Z() + 0.06, tp.z + rr(-0.15, 0.15)); P({ p: _v3, v: _v2.set(rr(-0.3, 0.3), rr(0.3, 0.7), rr(-0.3, 0.3)), drag: 2.5, omur: rr(0.4, 0.6), boy: 0.16, boy2: 0.42, renk: '#cdbb9a', renk2: '#efe6d6', kare: 'toz', normal: true, rot: 'r', a: 0.7 * (1 - kk), hot: 0, on: 0 }); } });
      sok(c, { renk: '#bff7ea', r: 1.0 * g, toz: true, tozRenk: '#cfe3c8', tozN: 8, a: 0.75 }); sars(0.1);
      const kat = hm ? 3 : 7;
      // hedefte büyüyen hortum hedefi izler (savrulan hedef hortumun içinde havalanır), hedef inince söner: boş yerde dönmez
      surec(0.85, (kk, dt, yas, is) => { const sol = kk > 0.7 ? (1 - kk) / 0.3 : 1; if (h.o && h.o.parent && h.o.visible) { const tp = takipPoz(h.o); c.set(tp.x, Z(), tp.z); }
        odak(_v1.copy(c).setY(Z() + 0.8 * g), 0.7 * g);
        if (hm) { const b2 = cikisK(Math.min(1, yas / 0.2)); hm.position.set(c.x + Math.sin(yas * 7) * 0.05, Z(), c.z + Math.cos(yas * 6) * 0.05);
          const sx = (0.42 + 0.48 * b2) * g * (0.8 + 0.2 * sol); hm.scale.set(sx, (0.5 + 0.5 * b2) * g * (0.9 + 0.1 * sol), sx); hm.material.uniforms.uA.value = sol; if (kk >= 1) hm.visible = false; }
        is.acc = (is.acc || 0) + dt * 70 * OLCEK * g;
        while (is.acc >= 1) { is.acc--; const r0 = rr(0.12, 0.3), yap = RND() < 0.4;
          _v3.set(c.x, Z() + rr(0, 0.15), c.z);
          P({ p: _v3, yorunge: { r: r0, w: rr(8, 11), vy: rr(1.6, 2.6), rv: rr(0.35, 0.6) }, omur: rr(0.7, 1.0), boy: yap ? rr(0.18, 0.26) : rr(0.2, 0.3), boy2: yap ? 0.16 : 0.08,
            renk: yap ? (RND() < 0.5 ? '#7dd35a' : '#c9e85a') : '#e8fff9', renk2: yap ? '#4a9a3a' : '#7fc8c0', kare: yap ? 'yaprak' : 'kivilcim', mod: yap ? 0 : 2, uzat: yap ? 0 : 0.09, en: yap ? 1 : 0.5,
            rot: 'r', rotHiz: rr(-8, 8), normal: yap, hot: yap ? 0 : 0.9, a: (yap ? 1 : 0.7) * sol, fo: 0.6 }); }
        is.acc2 = (is.acc2 || 0) + dt * 24 * OLCEK; while (is.acc2 >= 1) { is.acc2--; _v3.set(c.x, Z() + 0.05, c.z);
          P({ p: _v3, yorunge: { r: 0.08, w: rr(6, 8), vy: rr(2.0, 2.6), rv: rr(0.45, 0.6) }, omur: rr(0.9, 1.1), boy: 0.3, boy2: 0.7, renk: '#e6fff8', renk2: '#8fd8c8', kare: 'duman', normal: true, rot: 'r', rotHiz: 4, a: 0.55 * sol, hot: 0, fi: 0.1, fo: 0.55 }); }
        for (let i = 0; i < kat; i++) { const y = 0.12 + i * (hm ? 0.62 : 0.28), w = (0.45 + i * (hm ? 0.5 : 0.24)) * g, sal = Math.sin(yas * 7 + i) * 0.06 * i; _v3.set(c.x + sal, Z() + y, c.z);
          P({ p: _v3, omur: -1, boy: w, en: 1, uz: 0.55, renk: '#c8fff0', kare: 'girdap', normal: true, rot: -yas * 14 + i * 1.3, hot: 0.4, a: (hm ? 0.45 : 0.75) * sol });
          if (!hm) P({ p: _v3, omur: -1, boy: w * 1.1, en: 1, uz: 0.6, renk: '#3fbfa8', kare: 'girdap', rot: -yas * 11 + i * 2.1, hot: 0.3, a: 0.5 * sol }); }
        if (RND() < 0.5 * OLCEK) { _v3.set(c.x, Z() + 0.05, c.z); P({ p: _v3, mod: 1, omur: 0.3, boy: 0.7, boy2: 1.05, renk: '#cfffee', kare: 'girdap', rot: yas * 10, rotHiz: -10, hot: 0.4, a: 0.35 * sol, fi: 0.2 }); }
      });
      hs.forEach(t => patlama(_v4.copy(t.p).setY(t.p.y + 0.5 * t.h), { renk: '#bff7ea', n: 6, yildiz: false }));
    });
  },
  // Dağ Koçu: yere vurma: kızıl flaş, şok ve toz, kızgın çatlak, burundan buhar jetleri, kor patlaması; canının %20'si: kızıl-yeşil
  // iyileşme; 3 sn öfke (DURUM.ofke: boynuz uçlarında alev dilleri, gövde kızıl; güçlenmiş vuruşlar sahne3d'de)
  deliOfke(k, hs, o) {
    const g = o.guc, bas = o.soket ? new THREE.Vector3().copy(o.soket) : new THREE.Vector3().copy(k.p).setY(k.p.y + 0.8 * k.h), il = new THREE.Vector3().copy(o.ileri || _v4.set(0, 0, 1));
    // patlama kısık: koçun üstünü pembe-beyaz bir lekeye çevirmesin (öfke kimliği boynuz alevleri ve kızgın çatlakta)
    flas(bas, { renk: '#ff5a1f', boy: 0.5, sure: 0.18, a: 0.75 });
    sok(k.p, { renk: '#ff4a2a', r: 1.2 * g, toz: true, tozRenk: '#a07a60', tozN: 4, a: 0.8 }); sars(0.12);
    dekal(k.p, { r: 0.8, renk: '#ff5a1f', additive: true, a: 0.5, sure: 1.2 });
    _v3.set(k.p.x + il.x * 0.4 * k.h, Z() + 0.03, k.p.z + il.z * 0.4 * k.h); P({ p: _v3, mod: 1, normal: true, omur: 1.6, boy: 1.1, boy2: 1.2, renk: '#2b1408', kare: 'catlakYer', rot: 'r', hot: 0, a: 0.85, fi: 0.02, fo: 0.6 });
    P({ p: _v3, mod: 1, omur: 1.0, boy: 1.0, boy2: 1.1, renk: '#ff5a1f', kare: 'catlakYer', rot: 'r', hot: 0.4, a: 0.7, fi: 0.02, fo: 0.4 });
    for (let i = 0, n = N(5 * g); i < n; i++) { const yan = i % 2 ? 0.06 : -0.06; _v3.set(bas.x + il.z * yan, bas.y - 0.03, bas.z - il.x * yan);
      P({ p: _v3, v: _v2.set(il.x * rr(1.4, 2.2) + il.z * yan * 6, rr(-0.2, 0.3), il.z * rr(1.4, 2.2) - il.x * yan * 6), drag: 2.4, g: -0.6, omur: rr(0.45, 0.7), boy: rr(0.1, 0.16), boy2: rr(0.32, 0.45), renk: '#ffffff', renk2: '#d9cfd8', kare: 'duman', normal: true, rot: 'r', rotHiz: rr(-1, 1), a: 0.65, hot: 0 }); }
    patlama(bas, { renk: '#ff5a2a', renk2: '#ff2a10', n: 8, hiz: 3.5, guc: g, yildizN: 2 });
    zamanla(0.15, () => iyiles(k, '#ff7a4a', { sutun: 0.3 }));
    aura(k.o || k.p, { renk: '#ff3d2a', renk2: '#ffb347', sure: 0.6, oran: 8, boy: k.h });
  },
  // Zümrüt Yılan: parlak zümrüt küre (beyaz-yeşil çekirdek, koyu kontur) yay çizerek uçar, ardında damlayan iz → çarpınca sıçrama tacı,
  // zehir gölü, kabarcıklar (hedef 4 sn yeşile boyanır: sahne3d); en yaralı dosta yılandan yay çizen şifa akışı
  zehir(k, hs, o) {
    const h = hs[0]; if (!h) return; const g = o.guc, U = Math.max(0.12, o.ucus || 0.34);
    const il = o.ileri || _v4.set(0, 0, 1), agiz = o.soket ? new THREE.Vector3().copy(o.soket).addScaledVector(il, 0.12 * k.h) : new THREE.Vector3().copy(k.p).setY(k.p.y + 0.7 * k.h);
    flas(agiz, { renk: '#8dff5a', boy: 0.55, sure: 0.14, halka: false });
    for (let i = 0, n = N(7); i < n; i++) { _v2.copy(il).multiplyScalar(rr(1.2, 2.4)).add(kureY(_v3, 0.3).multiplyScalar(0.8));
      P({ p: agiz, v: _v2, g: 6, drag: 1, omur: rr(0.25, 0.4), boy: rr(0.06, 0.1), renk: '#b4ff7a', renk2: '#3c9a22', kare: 'damla', mod: 2, uzat: 0.08, hot: 0.5 }); }
    const zB = new THREE.Vector3(), zC = new THREE.Vector3(), zH = h, yy = 0.45, zm = zumrutAl();
    // 3B zümrüt: dolu, kesme yüzlü, iç ışıklı yeşil taş döne döne uçar (yarı saydam parıltı 'sabun köpüğü' gibi duruyordu)
    surec(U, (kk, dt, yas, is) => { konum(zH.o || zH.p, zB); zB.y += (zH.h || 1) * 0.5; zC.lerpVectors(agiz, zB, kk); zC.y += Math.sin(kk * Math.PI) * yy * Math.max(0.5, agiz.distanceTo(zB) * 0.35);
      if (zm) { zm.position.copy(zC); zm.rotation.set(yas * 7, yas * 11, 0.4); zm.scale.setScalar(0.3 * g * Math.min(1, 0.4 + yas / 0.06)); if (kk >= 1) zm.visible = false; }
      odak(zC, 0.25);
      P({ p: zC, omur: -1, boy: 0.42 * g, renk: '#3fdc5a', kare: 'parilti', hot: 0.4, a: 0.4 });
      is.acc = (is.acc || 0) + dt * 110 * OLCEK; while (is.acc >= 1) { is.acc--; _v3.copy(zC).add(kureY(_v2, 0).multiplyScalar(0.08));
        if (RND() < 0.55) P({ p: _v3, v: _v2.set(rr(-0.2, 0.2), rr(-0.6, -0.2), rr(-0.2, 0.2)), g: 7, omur: rr(0.3, 0.5), boy: rr(0.07, 0.12), renk: '#8dff5a', renk2: '#2f8a1a', kare: 'damla', normal: true, mod: 2, uzat: 0.08, hot: 0.4 });
        else P({ p: _v3, v: kureY(_v2, 0).multiplyScalar(0.4), omur: rr(0.25, 0.4), boy: rr(0.12, 0.2), boy2: 0.03, renk: '#c8ff8a', renk2: '#3fdc5a', kare: 'yildiz4', rot: 'r', hot: 1 }); } });
    mermi(agiz, h.o || h.p, U, { tur: 'zehir', guc: 1.12 * g, yay: yy, varisGuc: 1.25, govde: !zm, bitis: (B0) => {
      // sıçrama tacı hedefin yılana bakan yüzünde (gövdenin arkasında kalmasın)
      const Bk = new THREE.Vector3().copy(agiz).sub(B0).setY(0); if (Bk.lengthSq() < 1e-6) Bk.set(0, 0, 1); Bk.normalize().multiplyScalar(0.3 * (zH.h || 1)).add(B0);
      for (let i = 0, n = N(12); i < n; i++) { const a = i / n * TAU + rr(-0.2, 0.2); P({ p: Bk, v: _v2.set(Math.cos(a) * rr(1, 1.8), rr(2.4, 3.6), Math.sin(a) * rr(1, 1.8)), g: 9, omur: rr(0.5, 0.7), boy: rr(0.12, 0.17), renk: '#c8ff8a', renk2: '#2f8a1a', kare: 'damla', mod: 2, uzat: 0.1, hot: 0.35 }); }
      P({ p: Bk, omur: 0.3, boy: 0.3, boy2: 1.3, renk: '#8dff5a', kare: 'halka', hot: 0.6, a: 0.8, fi: 0, fo: 0.25 });
      const B = B0;
      _v3.copy(B).setY(Z()); dekal(_v3, { r: 1.0 * g, renk: '#3cbf2a', kare: 'duman', a: 0.7, sure: 1.8 });
      sok(_v3, { renk: '#8dff5a', r: 0.9 * g, sure: 0.4 });
      surec(1.6, (kk, dt, yas, is) => { is.acc = (is.acc || 0) + dt * 30 * OLCEK; while (is.acc >= 1) { is.acc--; const a = RND() * TAU, r = rr(0, 0.55) * g;
        _v3.set(B.x + Math.cos(a) * r, Z() + rr(0.05, 0.5), B.z + Math.sin(a) * r);
        if (RND() < 0.6) P({ p: _v3, v: _v2.set(0, rr(0.4, 0.9), 0), omur: rr(0.5, 0.9), boy: rr(0.12, 0.22), boy2: rr(0.24, 0.34), renk: '#b4ff7a', renk2: '#5fd03a', kare: 'kabarcik', hot: 0.6, salin: 0.06, fo: 0.85 });
        else P({ p: _v3, v: _v2.set(0, rr(0.2, 0.5), 0), drag: 1, omur: rr(0.7, 1.0), boy: rr(0.4, 0.55), boy2: 0.95, renk: '#5fcf3a', renk2: '#2a7a2a', kare: 'duman', normal: true, rot: 'r', a: 0.55, hot: 0 }); } });
    } });
    for (const d of (o.dostlar || [])) zamanla(ON_SURE.zehir + 0.2, () => sifaYay(agiz, d, '#7dff8a', 0.35, () => iyiles(d, '#7dff8a')));
  },
  // Buz Kaplumbağası: ağızdan buz konisi (sis + kristal + kar), yerde kırağı izi → hedefte flaş, buz kıymıkları ve yerden fışkıran 3B buz
  // kristali kümesi (dondurma süresince durur, sonra 3B kırıklara ayrılır); gövde buz mavisine boyanır, animasyon donar (sahne3d)
  buzNefes(k, hs, o) {
    const h = hs[0]; if (!h) return; const g = o.guc, U = (o.ucus || 0.22);
    const agiz = o.soket ? new THREE.Vector3().copy(o.soket) : new THREE.Vector3().copy(k.p).setY(k.p.y + 0.4 * k.h), hp = new THREE.Vector3().copy(h.p).setY(h.p.y + 0.35 * h.h);
    const yon = hp.clone().sub(agiz); const L = yon.length(); yon.normalize(); agiz.addScaledVector(yon, o.soket ? 0.12 * k.h : 0.3);
    for (let j = 1, n = 4; j <= n; j++) zamanla(j * 0.035, () => { _v3.copy(agiz).lerp(hp, j / (n + 0.5)); dekal(_v3, { r: 0.42 + 0.1 * j, renk: '#cfefff', kare: 'kar', additive: true, a: 0.55, sure: 1.4 });
      _v3.y = Z() + 0.05; for (let i = 0; i < 2; i++) P({ p: _v3, mod: 2, eksen: _v2.set(rr(-0.4, 0.4), 1, rr(-0.4, 0.4)), omur: 0.8, boy: 0.12, boy2: 0.3, en: 1, uz: 1.2, renk: '#e9fbff', renk2: '#6fb8ff', kare: 'buz', normal: true, hot: 0.4, fi: 0.05, fo: 0.6 }); });
    const yan = new THREE.Vector3(-yon.z, 0, yon.x).normalize(), ust = new THREE.Vector3().crossVectors(yan, yon), orta = new THREE.Vector3();
    // nefes: 0,5 sn süren, ağızdan hedefe genişleyen buz akışı. Yakın dövüşte mesafe kısa (0,5–0,8): zerreler hedefe varınca ölüyordu
    // (0,1 sn'lik beyaz leke) → yavaş, hedefi aşıp çevresine yayılan, büyüyen sis + kristal + kar; ortada titreyen mavi-beyaz koni ışını
    surec(0.5, (kk, dt, yas, is) => { const sol = kk < 0.12 ? kk / 0.12 : kk > 0.8 ? (1 - kk) / 0.2 : 1;
      for (let j = 0; j < 3; j++) { const f = 0.25 + j * 0.3; orta.copy(agiz).lerp(hp, f); P({ p: orta, mod: 2, eksen: yon, omur: -1, boy: 1, en: (0.18 + 0.32 * f) * sol * (1 + 0.1 * Math.sin(yas * 40 + j)), uz: L * 0.5, renk: '#7fc8ff', kare: 'isin', hot: 0.3, a: 0.5 * sol }); }
      orta.copy(agiz).lerp(hp, 0.5); P({ p: orta, mod: 2, eksen: yon, omur: -1, boy: 1, en: 0.12 * sol, uz: L * 1.05, renk: '#effbff', kare: 'isin', hot: 0.7, a: 0.85 * sol });
      odak(orta, Math.max(0.35, L * 0.55));
      is.acc = (is.acc || 0) + dt * 120 * OLCEK; while (is.acc >= 1) { is.acc--;
      const hiz = rr(3.2, 4.6), ac = rr(-0.5, 0.5), ac2 = rr(-0.25, 0.35); _v2.copy(yon).addScaledVector(yan, ac).addScaledVector(ust, ac2).normalize().multiplyScalar(hiz);
      const omur = L / hiz + rr(0.18, 0.32), t = RND();
      if (t < 0.42) P({ p: agiz, v: _v2, drag: 1.6, omur, boy: 0.18, boy2: 1.0, renk: '#f2fcff', renk2: '#6fbaff', kare: 'duman', normal: true, rot: 'r', a: 0.7, hot: 0, fo: 0.5 });
      else if (t < 0.66) P({ p: agiz, v: _v2, drag: 1.2, omur, boy: rr(0.16, 0.26), boy2: rr(0.28, 0.42), renk: '#e9fbff', renk2: '#4fa8ff', kare: 'buz', normal: true, rot: 'r', rotHiz: rr(-6, 6), hot: 0.4 });
      else if (t < 0.86) P({ p: agiz, v: _v2, drag: 1.2, omur, boy: rr(0.12, 0.18), renk: '#dff6ff', renk2: '#6fc8ff', kare: 'kar', rot: 'r', rotHiz: rr(-4, 4), hot: 0.5 });
      else P({ p: agiz, v: _v2, drag: 1.0, omur: omur * 0.8, boy: 0.11, uz: 1.5, en: 0.5, renk: '#ffffff', renk2: '#7fd4ff', kare: 'kivilcim', mod: 2, uzat: 0.1, hot: 0.9 }); } });
    flas(agiz, { renk: '#9fdcff', boy: 0.5, sure: 0.2, a: 0.8 });
    hs.forEach((t, j) => zamanla(U + j * 0.04, () => {
      const tp = _v4.copy(t.p).setY(t.p.y + 0.35 * t.h).clone(), th = Math.max(0.8, t.h);
      flas(tp, { renk: '#bfeaff', boy: 1.0 * g, sure: 0.2 });
      for (let i = 0, n = N(12 * g); i < n; i++) { const a = RND() * TAU; _v3.set(tp.x + Math.cos(a) * 0.15, Z() + 0.05, tp.z + Math.sin(a) * 0.15);
        P({ p: _v3, v: _v2.set(Math.cos(a) * rr(0.6, 1.8), rr(2.5, 4.5), Math.sin(a) * rr(0.6, 1.8)), g: 9, drag: 0.5, omur: rr(0.6, 0.9), boy: rr(0.24, 0.4), renk: '#e9fbff', renk2: '#4fa8ff', kare: 'buz', normal: true, rot: rr(-0.4, 0.4), rotHiz: rr(-5, 5), hot: 0.4, sek: 0.06, fo: 0.7 }); }
      // buz kafesi: iri, uzun kristaller (oyun kamerasında saldıranın kabuğunun üstünden görünür), ortada iki uzun sivri
      if (kristalH) buzKume(t.p, { n: 9, r: 0.34 * th, boy: 1.3 * th, kal: 1.25 * Math.sqrt(th), omur: 1.2 - j * 0.04, buyu: 0.13, orta: true });
      if (t.o) surec(1.1, () => { if (t.o.visible) { const tq = takipPoz(t.o); odak(_v1.set(tq.x, tq.y + 0.6 * th, tq.z), 0.55 * th); } });
      else for (let i = 0, n = N(5); i < n; i++) { const a = i / 5 * TAU; _v3.set(t.p.x + Math.cos(a) * 0.28, Z() + 0.2, t.p.z + Math.sin(a) * 0.28); _v2.set(Math.cos(a) * 0.5, 1, Math.sin(a) * 0.5);
        P({ p: _v3, mod: 2, eksen: _v2, omur: 0.9, boy: 0.2, boy2: 0.55, en: 1, uz: 1.3, renk: '#e9fbff', renk2: '#6fb8ff', kare: 'buz', normal: true, hot: 0.4, fi: 0.05, fo: 0.6 }); }
      dekal(t.p, { r: 0.85, renk: '#cfefff', kare: 'kar', additive: true, a: 0.6, sure: 1.6 });
      sok(t.p, { renk: '#bfeaff', r: 0.9, toz: false });
    }));
  },
  // Kor Semenderi: dönen kuyruğun alev izinden büyüyen ateş halkası; dalga cephesinde yüksek alev duvarı → 4 sn yerde soluk kızgın kor
  // alanı (seyrek kıvılcım, süs önceliği); dostlara sıcak altın iyileşme; ağızdan kor püskürmesi
  ocak(k, hs, o) {
    const g = o.guc, R = 2.25 * g, c = new THREE.Vector3().copy(k.p).setY(Z());   // görsel yarıçap motorun 2,2 menzilinden biraz geniş: sınırdaki hedef halkanın içinde görünür
    flas(_v3.copy(c).setY(Z() + 0.4), { renk: '#ff8a3a', boy: 1.0, sure: 0.25 });
    sok(c, { renk: '#ff8a3a', r: R, sure: 0.45 });
    _v3.set(c.x, Z() + 0.04, c.z); P({ p: _v3, mod: 1, omur: 1.4, boy: R * 1.2, boy2: R * 2.15, renk: '#ff6a10', kare: 'halka', normal: true, hot: 0.2, a: 0.5, fi: 0.1, fo: 0.7 });
    P({ p: _v3, mod: 1, omur: 1.4, boy: R * 1.6, boy2: R * 2.0, renk: '#ff9a2e', renk2: '#ff4a1a', kare: 'run_ates', normal: true, rot: 'r', rotHiz: 1.5, hot: 0.25, a: 0.8, fi: 0.15, fo: 0.6 });
    P({ p: _v3, mod: 1, omur: 1.4, boy: R * 2.2, boy2: R * 2.4, renk: '#ff4a10', kare: 'parilti', hot: 0.05, a: 0.12, fi: 0.15, fo: 0.6 });
    P({ p: _v3, mod: 1, normal: true, omur: 1.2, boy: R * 1.9, boy2: R * 2.2, renk: '#2a0a02', kare: 'halka', hot: 0, a: 0.45, fi: 0.1, fo: 0.5 });   // yanık halka: alevler açık zeminde okunsun
    const r0 = Math.min(R, 0.55 * k.h);
    surec(1.35, (kk, dt, yas, is) => { const yay = Math.min(1, yas / 0.3), r = r0 + (R - r0) * cikisK(yay), cephe = yas < 0.42; const sol = kk > 0.75 ? (1 - kk) / 0.25 : 1;
      is.acc = (is.acc || 0) + dt * (cephe ? 170 : 100) * OLCEK;
      while (is.acc >= 1) { is.acc--; const a = RND() * TAU, rj = r * rr(0.92, 1.05); _v3.set(c.x + Math.cos(a) * rj, Z() + 0.05, c.z + Math.sin(a) * rj);
        // kameraya yakın alevler küçülür, çok yakında hiç doğmaz (önizlemede ön plandaki iri alev dokuları karenin altını turuncu bir pusa boğuyordu)
        const kd = kamera ? _v3.distanceTo(kamera.position) : 9; if (kd < 2.2) continue; const ko = Math.max(0.35, Math.min(1, (kd - 1.8) / 3));
        // alev duvarı: kızıl-turuncu geçişli (kökte koyu kızıl, uçta sarı); ışıklı olanlar az ve kısık (krem/şeftali lekeye dönmesin)
        const ad = RND() < 0.35 * ko;
        if (RND() < 0.8) P({ p: _v3, v: _v2.set(0, rr(1, 2) * (cephe ? 1.4 : 1) * ko, 0), g: -1, drag: 1, omur: rr(0.35, 0.55), boy: (cephe ? rr(0.6, 0.85) : rr(0.4, 0.56)) * ko, boy2: 0.1, en: 0.8, uz: cephe ? 1.8 : 1.4, renk: ad ? '#ffc23a' : '#ff5a00', renk2: ad ? '#ff3a00' : '#8a0c00', kare: 'alev', normal: !ad, rot: rr(-0.25, 0.25), hot: ad ? 0.3 : 0.12, a: sol, fo: 0.4 });
        else P({ p: _v3, v: _v2.set(rr(-0.4, 0.4), rr(2, 3.5), rr(-0.4, 0.4)), g: 1, omur: rr(0.5, 0.8), boy: 0.05, uz: 2, en: 0.6, renk: '#ffd36a', renk2: '#ff4a1a', kare: 'kivilcim', mod: 2, uzat: 0.1, hot: 1, a: sol }); } });
    // 4 sn kalıcı kor alanı: yerde soluk kızgın halka ve dönen ateş rünü, seyrek kıvılcım ve alev dilleri (süs önceliği: havuz dolunca ilk düşer)
    zamanla(0.32, () => { _v3.set(c.x, Z() + 0.032, c.z);
      P({ p: _v3, mod: 1, normal: true, omur: 4, boy: R * 2.05, boy2: R * 2.1, renk: '#3a1206', kare: 'duman', rot: 'r', hot: 0, a: 0.3, fi: 0.06, fo: 0.8, on: 0 });
      P({ p: _v3, mod: 1, omur: 4, boy: R * 1.95, boy2: R * 2.0, renk: '#ff5a1f', renk2: '#c0200a', kare: 'run_ates', rot: 'r', rotHiz: 0.3, hot: 0.12, a: 0.42, fi: 0.05, fo: 0.75, on: 0 });
      P({ p: _v3, mod: 1, omur: 4, boy: R * 2.1, boy2: R * 2.12, renk: '#ff6a1f', kare: 'halka', hot: 0.12, a: 0.25, fi: 0.05, fo: 0.75, on: 0 });
      surec(3.8, (kk, dt, yas, is) => { is.acc = (is.acc || 0) + dt * 14 * OLCEK; while (is.acc >= 1) { is.acc--; const a = RND() * TAU, rj = R * Math.sqrt(RND()) * 0.98; _v3.set(c.x + Math.cos(a) * rj, Z() + 0.05, c.z + Math.sin(a) * rj);
        if (RND() < 0.6) P({ p: _v3, v: _v2.set(rr(-0.2, 0.2), rr(0.6, 1.4), rr(-0.2, 0.2)), g: -0.5, omur: rr(0.4, 0.7), boy: 0.05, uz: 1.8, en: 0.6, renk: '#ffd36a', renk2: '#ff4a1a', kare: 'kivilcim', mod: 2, uzat: 0.08, hot: 1, on: 0, a: 1 - kk * 0.5 });
        else P({ p: _v3, v: _v2.set(0, rr(0.4, 0.8), 0), omur: rr(0.35, 0.5), boy: rr(0.22, 0.32), boy2: 0.05, renk: '#ffb02e', renk2: '#ff2a10', kare: 'alev', normal: true, hot: 0.3, a: 0.7 * (1 - kk * 0.6), on: 0 }); } }); });
    for (const d of (o.dostlar.length ? o.dostlar : [k])) zamanla(0.3, () => iyiles(d, '#ffd36a', { sutun: 0.4 }));
    const il = o.ileri || _v4.set(0, 0, 1), agiz = new THREE.Vector3().copy(k.p).addScaledVector(il, 0.34 * k.h).setY(k.p.y + 0.42 * k.h);
    zamanla(0.17, () => { for (let i = 0, n = N(10); i < n; i++) { _v2.set(il.x * 0.4 + rr(-0.5, 0.5), rr(2.2, 3.4), il.z * 0.4 + rr(-0.5, 0.5));
      P({ p: agiz, v: _v2, g: 4, drag: 0.8, omur: rr(0.45, 0.7), boy: 0.06, uz: 2, en: 0.6, renk: '#ffe08a', renk2: '#ff4a1a', kare: 'kivilcim', mod: 2, uzat: 0.1, hot: 1 }); }
      flas(agiz, { renk: '#ff9a3a', boy: 0.45, sure: 0.15, halka: false, isik: false }); });
  },
  // Bulut Atı: şahlanma → havalanarak hücum (sahne3d yörüngeye yay ekler): ayak altında taşınan kabarık bulut, arkasında beyaz-altın bulut
  // şeridi ve hız çizgileri; başlangıçta 0,5 sn kalan bulut hayaleti → varışta şok, toz, altın yıldız patlaması
  dortnal(k, hs, o) {
    const h = hs[0]; if (!h) return; const g = o.guc, A = new THREE.Vector3().copy(k.p), B = new THREE.Vector3().copy(h.p), cur = new THREE.Vector3();
    const yon = new THREE.Vector3().subVectors(B, A).setY(0); if (yon.lengthSq() < 1e-6) yon.set(0, 0, 1); yon.normalize(); const yanV = new THREE.Vector3(-yon.z, 0, yon.x);
    sok(A, { renk: '#ffe9b0', r: 0.8, toz: true, tozRenk: '#efe6d6', tozN: 6, a: 0.7 });
    // kalkış: küçük, sıcak beyaz bulut puf'ları (iri gri topaklar karenin yarısını kaplıyordu)
    for (let i = 0, n = N(6); i < n; i++) { _v3.set(A.x + rr(-0.3, 0.3), Z() + rr(0.15, 0.5) * k.h, A.z + rr(-0.3, 0.3));
      P({ p: _v3, v: _v2.set(rr(-0.15, 0.15), rr(0.05, 0.2), rr(-0.15, 0.15)), drag: 2, omur: rr(0.35, 0.5), boy: rr(0.22, 0.3), boy2: rr(0.34, 0.46), renk: '#fffaf0', renk2: '#fff0d0', kare: 'duman', normal: true, rot: 'r', a: 0.5, hot: 0 }); }
    const UC = ON_SURE.dortnal + (GEC.dortnal || 0);   // hücum süresi: varış = motorun etki anı + GEC (sahne3d kaymayı buna göre uzatır)
    surec(UC + 0.04, (kk, dt, yas, is) => { if (k.o && k.o.parent) cur.copy(takipPoz(k.o)); else cur.lerpVectors(A, B, kk * kk * (3 - 2 * kk)); is.acc = (is.acc || 0) + dt * 34 * OLCEK;
      while (is.acc >= 1) { is.acc--; _v3.set(cur.x + rr(-0.18, 0.18), cur.y + rr(0.05, 0.35) * k.h, cur.z + rr(-0.18, 0.18));
        if (RND() < 0.5) P({ p: _v3, v: _v2.copy(yon).multiplyScalar(-rr(0.2, 0.5)).add(_v4.set(0, rr(0.1, 0.3), 0)), drag: 2.4, omur: rr(0.25, 0.4), boy: rr(0.16, 0.22), boy2: rr(0.26, 0.36), renk: '#fffaf0', renk2: '#ffe9b8', kare: 'duman', normal: true, rot: 'r', rotHiz: rr(-0.5, 0.5), a: 0.5, hot: 0, fo: 0.35 });
        else P({ p: _v3, v: _v2.set(0, rr(0.2, 0.6), 0), omur: rr(0.4, 0.7), boy: rr(0.12, 0.18), renk: '#ffd34a', kare: 'yildiz4', rot: 'r', hot: 0.8 }); }
      // ayak altında taşınan bulut kümesi (at havalandıkça altında görünür)
      if (RND() < 0.6) { _v3.set(cur.x + rr(-0.2, 0.2), cur.y + rr(-0.02, 0.1) * k.h, cur.z + rr(-0.2, 0.2)); P({ p: _v3, v: _v2.copy(yon).multiplyScalar(-0.6), drag: 3, omur: 0.22, boy: 0.3, boy2: 0.38, renk: '#ffffff', renk2: '#ffe9b8', kare: 'duman', normal: true, rot: 'r', a: 0.75, hot: 0 }); }
      // hız çizgileri: hücum yönünde uzun, kalın, altın-beyaz şeritler
      for (let i = 0, n = OLCEK < 1 ? 2 : 3; i < n; i++) { const yk = rr(-0.5, 0.5); _v3.copy(cur).addScaledVector(yanV, yk).addScaledVector(yon, rr(-0.7, 0)); _v3.y = cur.y + rr(0.2, 1.0) * k.h;
        P({ p: _v3, mod: 2, eksen: yon, omur: 0.18, boy: 1, en: 0.09, uz: rr(1.1, 1.7), renk: RND() < 0.5 ? '#fff6d8' : '#ffd34a', kare: 'kivilcim', hot: 0.9, a: 0.95, fi: 0, fo: 0.25 }); } });
    // varış: altın yıldız patlaması (iri altıgen yıldız + altın halka + yıldız saçılması), şok, toz
    zamanla(UC, () => { const V = _v3.copy(B).setY(B.y + 0.5 * h.h).clone();
      flas(V, { renk: '#ffd76a', boy: 0.9 * g, sure: 0.2, a: 0.75 }); sok(B, { renk: '#ffe08a', r: 1.1 * g, toz: true, tozRenk: '#e8dccb', tozN: 8, a: 0.7 });
      P({ p: V, omur: 0.3, boy: 0.4, boy2: 1.15 * g, renk: '#ffe45a', renk2: '#ffa010', kare: 'yildiz6', rot: rr(-0.3, 0.3), rotHiz: 2, hot: 0.45, a: 1, fi: 0, fo: 0.35 });
      P({ p: V, omur: 0.32, boy: 0.3, boy2: 1.35 * g, renk: '#ffc83a', kare: 'halka', hot: 0.4, a: 0.7, fi: 0, fo: 0.3 });
      for (let i = 0, n = N(12); i < n; i++) { kureY(_v2, 0.5).multiplyScalar(rr(1.6, 3.2)); P({ p: V, v: _v2, drag: 2.6, g: 1, omur: rr(0.45, 0.75), boy: rr(0.16, 0.26), renk: '#ffe45a', renk2: '#ff9a1a', kare: 'yildiz4', rot: 'r', rotHiz: rr(-5, 5), hot: 0.7 }); }
      patlama(V, { renk: '#ffd34a', n: 12, guc: g, yildizN: 3 }); sars(0.18 * g); });
    zamanla(UC + 0.06, () => { const p0 = k.o ? takipPoz(k.o) : B; for (let j = -1; j <= 1; j += 2) { _v3.set(p0.x + yon.x * 0.3 * k.h - yon.z * 0.14 * j, Z() + 0.06, p0.z + yon.z * 0.3 * k.h + yon.x * 0.14 * j);
      for (let i = 0, n = N(6); i < n; i++) P({ p: _v3, v: _v2.set(yon.x * rr(1, 2) + rr(-0.4, 0.4), rr(0.3, 0.8), yon.z * rr(1, 2) + rr(-0.4, 0.4)), drag: 2.6, omur: rr(0.45, 0.7), boy: 0.16, boy2: 0.42, renk: '#d8c8a8', renk2: '#f3ead8', kare: 'toz', normal: true, rot: 'r', a: 0.8, hot: 0 }); } });
  },
  // Işık Kuğusu: göğüs flaşı, arkada ince sütun, kanat uçlarından tüy dalgası; yerde bütün sahaya yayılan altın ışık halkası → halka değen
  // her dosta üstten altın tüy süzülür, kalkan kabarcığı açılır (DURUM.kalkan 1,2x'ten oturur)
  kanat(k, hs, o) {
    const g = o.guc, il = o.ileri || _v4.set(0, 0, 1), gov = o.soket ? new THREE.Vector3().copy(o.soket) : new THREE.Vector3().copy(k.p).setY(k.p.y + 0.6 * k.h);
    flas(_v3.copy(gov).addScaledVector(il, 0.12), { renk: '#ffd76a', boy: 0.55 * g, sure: 0.2, halka: false, a: 0.75 });
    sutun(_v3.copy(k.p).addScaledVector(il, -0.45), { renk: '#ffd76a', ic: '#fff6d0', h: 2.6, en: 0.3, sure: 0.5, a: 0.3, zerre: false });   // kuğuyu beyaza boğmasın
    const yan = _v1.set(il.z, 0, -il.x);
    const uclar = [o.elL, o.elR];
    for (let e = 0; e < 2; e++) { const uc = uclar[e] ? _v3.copy(uclar[e]) : _v3.copy(gov).addScaledVector(yan, e ? -0.4 : 0.4); const sx = e ? -1 : 1;
      const ucV = uc.clone(), dis = _v4.copy(ucV).sub(gov).setY(0); if (dis.lengthSq() < 1e-4) dis.copy(yan).multiplyScalar(sx); dis.normalize(); const dx = dis.x, dz = dis.z;
      for (let i = 0, n = N(9 * g); i < n; i++) { const a = (i / Math.max(1, n - 1)) * 1.3 - 0.2, hz = rr(1.4, 2.4);
        P({ p: ucV, v: _v2.set(dx * Math.cos(a) * hz - il.x * 0.3, Math.sin(a) * hz + 0.4, dz * Math.cos(a) * hz - il.z * 0.3), drag: 2.4, g: 0.35, omur: rr(0.9, 1.3), boy: rr(0.24, 0.34), renk: '#fff6d8', renk2: '#ffc83a', kare: 'tuy', normal: true, rot: 'r', rotHiz: rr(-2, 2), salin: 0.12, hot: 0.35, fo: 0.6 }); }
      P({ p: ucV, omur: 0.22, boy: 0.2, boy2: 0.6, renk: '#fff1a8', kare: 'parilti', hot: 1, a: 0.8, fi: 0 }); }
    // altın halka yalnız en uzak dosta kadar yayılır (10 birimlik halka arenadan taşıp gökyüzünde soluk bir yay çiziyordu)
    let R = 1.5; for (const h of hs) R = Math.max(R, Math.hypot(h.p.x - k.p.x, h.p.z - k.p.z) + 0.7); R = Math.min(R, 6.5);
    const c0 = new THREE.Vector3(k.p.x, Z() + 0.05, k.p.z);
    P({ p: c0, mod: 1, omur: R / KANAT_HIZ, boy: 0.6, boy2: R * 2, renk: '#ffe27a', renk2: '#ffb020', kare: 'halka', hot: 0.6, a: 0.6, fi: 0, fo: 0.25 });
    P({ p: c0, mod: 1, omur: R / KANAT_HIZ * 0.9, boy: 0.6, boy2: R * 1.9, renk: '#ffc84a', kare: 'sok', normal: true, rot: 'r', hot: 0.2, a: 0.28, fi: 0, fo: 0.2 });
    run(c0, { renk: '#e0a020', renk2: '#fff0b0', r: 1.0, a: 0.55, sure: 0.75, donus: 1 });
    hs.forEach((h) => { if (h.o && k.o && h.o === k.o) return; const d = Math.hypot(h.p.x - k.p.x, h.p.z - k.p.z), varis = Math.max(0.3, d / KANAT_HIZ + 0.08);
      zamanla(varis - 0.3, () => sifaYay(gov, h, '#ffe08a', 0.3, () => kalkanAc(h), 'tuy'));
      zamanla(Math.max(0, d / KANAT_HIZ - 0.02), () => { if (h.o) konum(h.o, _v3); else _v3.copy(h.p); _v3.y = Z() + 0.05; P({ p: _v3, mod: 1, omur: 0.45, boy: 0.4, boy2: 1.4, renk: '#fff1a8', kare: 'halka', hot: 0.6, a: 0.85, fi: 0, fo: 0.3 }); }); });
  },
  // Gece Ayısı: ezme (mor şok, toz) → kendi gölgesi yerde kara bir şerit olarak hedefe akar (yolda yerden kara dikenler) → hedefin altında
  // kara yarık açılır, içinden iki katmanlı dev gölge pençesi yükselir, üç kesik, kara duman, lanet gözü; 5 sn mor kontur (sahne3d) ve
  // ayak altında yavaş dönen gölge zinciri (DURUM.lanet)
  karaGolge(k, hs, o) {
    const h = hs[0]; if (!h) return; const g = o.guc, U = Math.max(0.15, o.ucus || 0.32), hp = new THREE.Vector3().copy(h.p).setY(h.p.y + 0.55 * h.h);
    const il = o.ileri || _v4.set(0, 0, 1), vur = new THREE.Vector3(k.p.x + il.x * 0.38 * k.h, Z(), k.p.z + il.z * 0.38 * k.h), B = new THREE.Vector3(h.p.x, Z(), h.p.z);
    sok(vur, { renk: '#9a4dff', r: 0.85 * g, toz: true, tozRenk: '#3a2a4a', tozN: 10 });
    flas(_v3.copy(vur).setY(Z() + 0.15), { renk: '#b46cff', boy: 0.75, sure: 0.14, halka: false, isikGuc: 4 });
    dekal(vur, { r: 0.6, renk: '#1a0c2a', a: 0.85, sure: 1.6 });
    for (let i = 0, n = N(8); i < n; i++) { const a = RND() * TAU; _v3.set(vur.x + Math.cos(a) * 0.15, Z() + 0.05, vur.z + Math.sin(a) * 0.15);
      P({ p: _v3, v: _v2.set(Math.cos(a) * 0.5, rr(1.2, 2.2), Math.sin(a) * 0.5), g: 8, omur: 0.5, boy: rr(0.08, 0.14), renk: '#3a2a4a', kare: 'tas', normal: true, rot: 'r', rotHiz: rr(-6, 6), hot: 0, sek: 0.05 }); }
    const L = vur.distanceTo(B), adim = OLCEK < 1 ? 0.42 : 0.28, uc = new THREE.Vector3();
    // gölge şeridi: yerde kalın kara bir yol akar; ucunda koyu leke + mor çekirdek; yol boyunca yerden 3B kara dikenler fışkırır (her kamerada
    // gövdelerin üstünden görünür), birkaç adımda bir mor kıvılcım
    surec(U, (kk, dt, yas, is) => { const e = 1 - (1 - kk) * (1 - kk); uc.lerpVectors(vur, B, e).setY(Z() + 0.04);
      P({ p: uc, mod: 1, omur: -1, boy: 1.1, renk: '#0c0416', kare: 'duman', normal: true, hot: 0, a: 0.9 });
      P({ p: uc, mod: 1, omur: -1, boy: 0.7, renk: '#7a2cff', kare: 'parilti', hot: 0.4, a: 0.55 });
      is.d = is.d || 0; while (is.d <= e * L) { _v3.lerpVectors(vur, B, L > 1e-3 ? is.d / L : 1); is.d += adim;
        dekal(_v3, { r: 0.5, renk: '#0e0418', kare: 'duman', a: 0.92, sure: 1.0 });
        if (dikenH) for (let j = 0; j < 2; j++) { _v4.set(_v3.x + rr(-0.16, 0.16), Z() - 0.03, _v3.z + rr(-0.16, 0.16));
          dikenH.ekle(_v4, _v2.set(rr(-0.4, 0.4), 1, rr(-0.4, 0.4)), rr(0.075, 0.1), rr(0.2, 0.32), { buyu: 0.08, omur: rr(0.5, 0.65), kir: false }); }
        else for (let j = 0; j < 2; j++) { _v4.set(_v3.x + rr(-0.15, 0.15), Z() + 0.02, _v3.z + rr(-0.15, 0.15));
          P({ p: _v4, mod: 2, eksen: _v2.set(rr(-0.35, 0.35), 1, rr(-0.35, 0.35)), omur: rr(0.4, 0.55), boy: 0.12, boy2: rr(0.42, 0.6), en: 0.6, uz: 1.4, renk: '#2a1040', renk2: '#6a2ae0', kare: 'buz', normal: true, hot: 0.1, a: 0.95, fi: 0.05, fo: 0.5 }); }
        P({ p: _v3.setY(Z() + 0.1), v: _v2.set(rr(-0.2, 0.2), rr(0.4, 0.9), rr(-0.2, 0.2)), drag: 2, omur: rr(0.45, 0.7), boy: 0.25, boy2: 0.55, renk: '#2a1442', renk2: '#100818', kare: 'duman', normal: true, rot: 'r', a: 0.7, hot: 0 }); } });
    // DEV GÖLGE PENÇESİ (3B): beş kavisli kara tırnak hedefin arkasında yarıktan yükselir (hedefin iki katı boy), öne kapanıp hedefin
      // üstüne iner, tutar ve yarığa geri batar. Arkasında koyu pençe gölgesi (sprite), kesikler mor
    zamanla(Math.max(0.04, U - 0.16), () => { const pn = penceAl(); if (!pn) return; const th = h.h || 1, hz = h.o ? konum(h.o, new THREE.Vector3()) : h.p.clone();
      { const kx = k.p.x - hz.x, kz = k.p.z - hz.z, kl = Math.hypot(kx, kz) || 1, ux = kx / kl, uz = kz / kl, PB = 1.3 * th * Math.min(1.2, g), taban = new THREE.Vector3(hz.x - ux * 0.4 * th, Z(), hz.z - uz * 0.4 * th);
        surec(0.85, (k2, dt2, yas) => { let sy, ac, bat = 0;
          if (yas < 0.14) { const e = yas / 0.14; sy = cikisK(e) * (1 + 0.15 * Math.sin(Math.PI * e)); ac = -0.25; }
          else if (yas < 0.3) { const e = (yas - 0.14) / 0.16; sy = 1; ac = -0.25 + 0.72 * e * e; }
          else if (yas < 0.55) { sy = 1; ac = 0.47 + 0.03 * Math.sin(yas * 30); }
          else { const e = (yas - 0.55) / 0.3; sy = 1 - e * 0.5; ac = 0.47 - 0.25 * e; bat = e * e; }
          pn.position.set(taban.x, Z() - 0.06 - bat * 1.2 * PB, taban.z); pn.rotation.set(ac, Math.atan2(ux, uz), 0, 'YXZ'); pn.scale.set(PB * 0.9, PB * sy, PB * 0.9);
          odak(_v1.set(hz.x, Z() + 0.9 * th, hz.z), 0.75 * th);
          if (k2 >= 1) pn.visible = false; }); } });
    zamanla(U, () => {
      const hz = h.o ? konum(h.o, new THREE.Vector3()) : h.p.clone(); hp.set(hz.x, hz.y + 0.55 * h.h, hz.z);
      // kara yarık (gövdeden geniş: altında kalmasın) + çevresinde dışa eğik 3B dikenler
      const th = h.h || 1;
      _v3.set(hz.x, Z() + 0.034, hz.z); P({ p: _v3, mod: 1, normal: true, omur: 1.4, boy: 1.5 * g, boy2: 2.3 * g, renk: '#08020e', kare: 'duman', rot: 'r', hot: 0, a: 0.95, fi: 0.03, fo: 0.6 });
      P({ p: _v3, mod: 1, omur: 0.9, boy: 1.3 * g, boy2: 2.1 * g, renk: '#7a2cff', kare: 'halka', hot: 0.4, a: 0.75, fi: 0, fo: 0.4 });
      for (let i = 0, n = N(8); i < n; i++) { const a = i / n * TAU + rr(-0.2, 0.2); _v4.set(hz.x + Math.cos(a) * 0.55 * th, Z() - 0.03, hz.z + Math.sin(a) * 0.55 * th);
        if (dikenH) dikenH.ekle(_v4, _v2.set(Math.cos(a) * 0.7, 1, Math.sin(a) * 0.7), rr(0.08, 0.11), rr(0.24, 0.36) * th, { buyu: 0.1, omur: rr(0.7, 0.9), kir: false });
        else P({ p: _v4, mod: 2, eksen: _v2.set(Math.cos(a) * 0.6, 1, Math.sin(a) * 0.6), omur: 0.6, boy: 0.15, boy2: rr(0.6, 0.8), en: 0.6, uz: 1.5, renk: '#1e0a30', renk2: '#7a2cff', kare: 'buz', normal: true, hot: 0.1, a: 0.95, fi: 0.04, fo: 0.5 }); }
      _v3.copy(hz).setY(hz.y + 0.1);
      P({ p: _v3, v: _v2.set(0, 3.0, 0), drag: 4, omur: 0.55, boy: 1.4 * g, boy2: 2.6 * g, renk: '#2a0f4a', renk2: '#4a1a80', kare: 'pence', normal: true, rot: -0.35, hot: 0, a: 0.7, fi: 0.08, fo: 0.45 });
      for (let i = 0, n = N(10); i < n; i++) { const a = RND() * TAU; _v3.set(hz.x + Math.cos(a) * 0.25, Z() + 0.08, hz.z + Math.sin(a) * 0.25);
        P({ p: _v3, v: _v2.set(Math.cos(a) * 0.3, rr(2, 3.5), Math.sin(a) * 0.3), drag: 2.5, omur: rr(0.4, 0.6), boy: 0.3, boy2: 0.7, renk: '#2a1442', renk2: '#0c0614', kare: 'duman', normal: true, rot: 'r', a: 0.75, hot: 0 }); }
      const hpK = hp.clone();
      // pençe kapanınca üç mor kesik (beyaz değil: kara gölge kimliği)
      for (let j = 0; j < 3; j++) zamanla(0.03 + j * 0.05, () => P({ p: _v3.copy(hpK).add(_v4.set((j - 1) * 0.18, 0, 0)), omur: 0.25, boy: 0.75 * g, boy2: 1.15 * g, en: 1.5, renk: '#e8d4ff', renk2: '#7a2cff', kare: 'kesik', rot: 0.9 - j * 0.08, hot: 0.6, fi: 0, fo: 0.3 }));
      flas(hp, { renk: '#9a4dff', boy: 0.8 * g, sure: 0.2, a: 0.8 }); sars(0.12 * g);
      for (let i = 0, n = N(12 * g); i < n; i++) { kureY(_v2, 0.4).multiplyScalar(rr(0.8, 2.2)); P({ p: hp, v: _v2, drag: 2.4, g: -0.4, omur: rr(0.6, 1.0), boy: rr(0.3, 0.45), boy2: rr(0.7, 1.0), renk: '#3a1a5a', renk2: '#140a22', kare: 'duman', normal: true, rot: 'r', rotHiz: rr(-1, 1), a: 0.75, hot: 0 }); }
      patlama(hp, { renk: '#c98bff', renk2: '#7a2cff', n: 14, guc: g, yukari: 0.8 });
      dekal(hz, { r: 0.85, renk: '#24103a', a: 0.85 });
      run(hz, { kare: 'run_golge', renk: '#9a4dff', renk2: '#e0c2ff', r: 0.6, a: 0.75, sure: 1.0, donus: -1.5 });
      const goz = _v4.copy(hz).setY(hz.y + h.h + 0.45).clone();
      zamanla(0.15, () => { P({ p: goz, omur: 1.0, boy: 0.3, boy2: 0.95, renk: '#c48cff', renk2: '#8a3cff', kare: 'goz', normal: true, hot: 0.6, fi: 0.1, fo: 0.65 }); P({ p: goz, omur: 0.6, boy: 0.4, boy2: 1.2, renk: '#7a2cff', kare: 'parilti', hot: 0.4, a: 0.8 }); });
    });
  },
  // Anka: güçlü kanat vuruşu → iki kanat ucundan göğe kor dalgası → hedefin üstünde (2,2 yükseklik: oyun kamerasında görünür) kor bulutu →
  // 0,7 sn boyunca ~20 kor iner (ilki motorun etki anından GEC sn sonra merkeze) → yerde alev öbekleri; bölge sınırında 3 sn sönen kızgın halka
  kulDogus(k, hs, o) {
    const h = hs[0]; if (!h) return; const g = o.guc, c = new THREE.Vector3().copy(h.p).setY(Z()), Rr = 1.3 * g;
    // kor bulutu hedefin başının hemen üstünde (2,2 yükseklik önizlemede kadrajın üstünde kalıyordu), kadraj taşarsa biraz daha alçalır
    const yuk = 0.09, dus = 0.24, ilk = (o.ucus || 0.34), YAG = 0.7, hh0 = h.h || 1, bulut = new THREE.Vector3(c.x, Z() + Math.max(1.35, hh0 + 0.55), c.z);
    if (kamera) for (let i = 0; i < 4; i++) { _v1.copy(bulut).setY(bulut.y + 0.45).project(kamera); if (_v1.y < 0.92 || bulut.y < hh0 + 0.3) break; bulut.y -= 0.12; }
    const gov = o.soket ? new THREE.Vector3().copy(o.soket) : new THREE.Vector3().copy(k.p).setY(k.p.y + 0.6 * k.h);
    sok(k.p, { renk: '#ff8a3a', r: 0.7, toz: true, tozRenk: '#b08a6a', tozN: 8, a: 0.7 });
    const uclar = [o.elL, o.elR];
    for (let e = 0; e < 2; e++) { const u0 = uclar[e] ? new THREE.Vector3().copy(uclar[e]) : gov.clone();
      flas(u0, { renk: '#ffb347', boy: 0.5, sure: 0.14, halka: false, isik: e === 0 });
      for (let i = 0, n = N(10 * g); i < n; i++) { _v3.set(bulut.x + rr(-0.7, 0.7), bulut.y + rr(-0.2, 0.3), bulut.z + rr(-0.7, 0.7)); const om = yuk * rr(0.9, 1.25);
        P({ p: u0, v: _v2.copy(_v3).sub(u0).divideScalar(om), omur: om, boy: rr(0.08, 0.12), boy2: 0.05, en: 0.6, renk: '#ffe08a', renk2: '#ff4a1a', kare: 'kivilcim', mod: 2, uzat: 0.07, hot: 1, fi: 0, fo: 0.2 }); } }
    zamanla(yuk, () => {
      flas(bulut, { renk: '#ff6a1f', boy: 0.9, sure: 0.2, halka: false, isikGuc: 5, a: 0.8 });
      // kor bulutu: koyu kızıl-kahve is, altı kızgın turuncu ışır (koyu zeminde de, açık gökte de seçilir), içinde kor çakmaları
      surec(ilk + YAG - yuk + 0.15, (kk, dt, yas, is) => { const sol = kk > 0.8 ? (1 - kk) / 0.2 : Math.min(1, yas / 0.08);
        _v3.copy(bulut).setY(bulut.y - 0.16); P({ p: _v3, omur: -1, boy: Rr * 1.5, renk: '#ff4a08', kare: 'parilti', hot: 0.1, a: 0.3 * sol * (0.85 + 0.15 * Math.sin(yas * 23)) });
        odak(bulut, 0.9 * Rr);
        is.acc = (is.acc || 0) + dt * 52 * OLCEK; while (is.acc >= 1) { is.acc--;
        _v3.set(bulut.x + rr(-0.85, 0.85) * Rr, bulut.y + rr(-0.08, 0.2), bulut.z + rr(-0.85, 0.85) * Rr * 0.75);
        if (RND() < 0.68) P({ p: _v3, v: _v2.set(rr(-0.2, 0.2), rr(0, 0.12), rr(-0.2, 0.2)), drag: 1.5, omur: rr(0.5, 0.75), boy: rr(0.5, 0.7), boy2: rr(0.85, 1.1), renk: '#4a1206', renk2: '#1c0804', kare: 'duman', normal: true, rot: 'r', a: 0.92 * sol, hot: 0, on: 0 });
        else P({ p: _v3.setY(bulut.y - rr(0.05, 0.18)), omur: rr(0.12, 0.25), boy: rr(0.26, 0.42), renk: '#ff7a1a', kare: 'parilti', hot: 0.35, a: 0.85, on: 0 }); } });
    });
    const adet = N(20 * g), nok = [];
    for (let i = 0; i < adet; i++) { const a = RND() * TAU, r = i === 0 ? 0 : Math.sqrt(RND()) * Rr; nok.push(new THREE.Vector3(c.x + Math.cos(a) * r, Z() + 0.05, c.z + Math.sin(a) * r)); }
    nok.forEach((n, i) => {
      const gec = ilk - dus + (i / adet) * YAG, bas = new THREE.Vector3(bulut.x + (n.x - c.x) * 0.45, bulut.y - 0.1, bulut.z + (n.z - c.z) * 0.45), v = n.clone().sub(bas).divideScalar(dus);
      zamanla(Math.max(yuk, gec), () => {
        // düşen kor: koyu kızıl kabuk + doygun turuncu-sarı alev çekirdeği (bloom'da kreme dönmesin: kısık sıcaklık) + kısa is izi
        P({ p: bas, v, omur: dus, boy: 0.44, en: 0.9, uz: 1.6, renk: '#a01800', renk2: '#4a0800', kare: 'alev', normal: true, mod: 2, uzat: 0.05, hot: 0, a: 0.85, fi: 0.05, fo: 0.95, eksen: v });
        P({ p: bas, v, omur: dus, boy: 0.34, en: 0.85, uz: 1.4, renk: '#ffb02a', renk2: '#ff3a00', kare: 'alev', mod: 2, uzat: 0.05, hot: 0.3, fi: 0.05, fo: 0.95, eksen: v });
        P({ p: bas, v, omur: dus, boy: 0.32, renk: '#ff5a10', kare: 'parilti', hot: 0.25, a: 0.7, fi: 0.05, fo: 0.95 });
        P({ p: bas, v: _v2.copy(v).multiplyScalar(0.55), omur: dus * 1.4, boy: 0.16, boy2: 0.36, renk: '#3a1408', renk2: '#140806', kare: 'duman', normal: true, rot: 'r', a: 0.55, hot: 0, fi: 0.1, fo: 0.6, on: 0 });
        zamanla(dus, () => {
          if (i % 3 === 0) flas(_v3.copy(n).setY(Z() + 0.2), { renk: '#ff6a1a', boy: 0.32, sure: 0.1, halka: false, isik: i % 6 === 0, a: 0.7 });
          for (let j = 0, m = N(4); j < m; j++) { kureY(_v2, 0.9).multiplyScalar(rr(1, 2.5)); P({ p: n, v: _v2, g: 6, omur: rr(0.3, 0.5), boy: 0.06, uz: 2, en: 0.6, renk: '#ffd36a', renk2: '#ff3d1a', kare: 'kivilcim', mod: 2, uzat: 0.1, hot: 1 }); }
          // yerdeki alev öbekleri: çoğu normal karışım (kızıl-turuncu), azı kısık ışıklı (20 öbeğin ışığı şeftali bir diske dönüşüyordu)
          surec(0.6, (kk, dt, yas, is) => { is.acc = (is.acc || 0) + dt * 10 * OLCEK; while (is.acc >= 1) { is.acc--; _v3.set(n.x + rr(-0.12, 0.12), Z() + 0.05, n.z + rr(-0.12, 0.12));
            const ad = RND() < 0.28; P({ p: _v3, v: _v2.set(0, rr(0.8, 1.5), 0), g: -0.5, omur: rr(0.35, 0.5), boy: rr(0.28, 0.4) * (1 - kk * 0.6), boy2: 0.06, renk: ad ? '#ffc02a' : '#ff6a0a', renk2: ad ? '#ff3a00' : '#8a1000', kare: 'alev', normal: !ad, rot: rr(-0.3, 0.3), hot: ad ? 0.3 : 0.1 }); } });
          dekal(n, { r: 0.32, renk: '#1e120c', a: 0.7, sure: 1.8 });   // yanık izi (koyu: üst üste binen ışık lekeleri sahneyi beyazlatıyordu)
        });
      });
    });
    // bölge sınırı: 3 sn sönerek kalan kızgın halka
    zamanla(ilk, () => { _v3.set(c.x, Z() + 0.036, c.z);
      P({ p: _v3, mod: 1, omur: 3, boy: Rr * 2.2, boy2: Rr * 2.25, renk: '#ff5a10', renk2: '#d0200a', kare: 'halka', hot: 0.1, a: 0.36, fi: 0.04, fo: 0.45, on: 0 });
      P({ p: _v3, mod: 1, omur: 3, boy: Rr * 2.1, boy2: Rr * 2.15, renk: '#ff6a1e', kare: 'run_ates', rot: 'r', rotHiz: 0.4, hot: 0.06, a: 0.3, fi: 0.04, fo: 0.45, on: 0 });
      P({ p: _v3, mod: 1, normal: true, omur: 3, boy: Rr * 2.1, boy2: Rr * 2.15, renk: '#3a0e04', kare: 'duman', rot: 'r', hot: 0, a: 0.42, fi: 0.04, fo: 0.6, on: 0 }); });
    zamanla(ilk + 0.2, () => { sok(c, { renk: '#ff7a2a', r: Rr * 1.05, toz: true, tozRenk: '#7a5a4a', tozN: 6, a: 0.55 }); sars(0.15 * g); });
  },
  // Ayaz Baykuşu: kanatlar aşağı → bütün sahaya yayılan kırağı dalgası; geçtiği yerde zemin 1,6 sn kırağıyla kaplanır; değdiği düşmanda flaş,
  // buz parçaları, ayak altında yerden fışkıran 3B buz kristali halkası (kırılır), 3 sn buz mavisi gövde (sahne3d) ve DURUM.buz
  ayaz(k, hs, o) {
    const g = o.guc, c = new THREE.Vector3().copy(k.p).setY(Z()), HIZ = AYAZ_HIZ, MAX = 10;
    flas(_v3.copy(k.p).setY(k.p.y + 0.7 * k.h), { renk: '#8fd0ff', boy: 0.75, sure: 0.22, a: 0.7 });   // baykuşu beyaz bir balona boğmasın
    for (const uc of [o.elL, o.elR]) { if (!uc) continue; const dx = uc.x - k.p.x, dz = uc.z - k.p.z, dl = Math.hypot(dx, dz) || 1;
      for (let i = 0, n = N(10); i < n; i++) P({ p: uc, v: _v2.set(dx / dl * rr(1.2, 2.4), rr(-2.4, -1.2), dz / dl * rr(1.2, 2.4)), drag: 2.6, omur: rr(0.4, 0.6), boy: rr(0.12, 0.2), boy2: 0.35, renk: '#ffffff', renk2: '#bfe6ff', kare: RND() < 0.5 ? 'kar' : 'duman', rot: 'r', rotHiz: rr(-3, 3), hot: 0.6, a: 0.8 }); }
    _v3.copy(k.p).setY(k.p.y + 0.7 * k.h);
    for (let i = 0, n = N(16); i < n; i++) { kureY(_v2, 0.6).multiplyScalar(rr(1.4, 2.8)); P({ p: _v3, v: _v2, drag: 1.5, g: 0.5, omur: rr(0.8, 1.2), boy: rr(0.12, 0.2), renk: '#e9fbff', renk2: '#6fc8ff', kare: 'kar', rot: 'r', rotHiz: rr(-3, 3), hot: 0.55 }); }
    _v3.set(c.x, Z() + 0.05, c.z);
    P({ p: _v3, mod: 1, omur: 0.75, boy: 0.5, boy2: 13, renk: '#dff6ff', renk2: '#6fb8ff', kare: 'halka', normal: true, hot: 0.3, a: 0.6, fi: 0, fo: 0.35, rot: 'r' });
    P({ p: _v3, mod: 1, omur: 0.6, boy: 0.5, boy2: 10, renk: '#6fb8ff', kare: 'halka', hot: 0.4, a: 0.3, fi: 0, fo: 0.3 });
    P({ p: _v3, mod: 1, omur: 1.2, boy: 0.5, boy2: 5.5, renk: '#dff6ff', kare: 'kar', normal: true, rot: 'r', rotHiz: 0.6, hot: 0.2, a: 0.4, fi: 0.1, fo: 0.5 });
    surec(MAX / HIZ, (kk, dt, yas, is) => { const r = HIZ * yas * 0.95; is.acc = (is.acc || 0) + dt * 150 * OLCEK;
      while (is.acc >= 1) { is.acc--; const a = RND() * TAU; const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r; if (Math.abs(x) > 3.6 || Math.abs(z) > 4.6) continue;
        _v3.set(x, Z() + 0.08, z);
        if (RND() < 0.55) P({ p: _v3, v: _v2.set(Math.cos(a) * 0.6, rr(0.2, 0.6), Math.sin(a) * 0.6), drag: 1.5, omur: rr(0.7, 1.1), boy: rr(0.25, 0.4), boy2: rr(0.6, 0.85), renk: '#f4fcff', renk2: '#bfe6ff', kare: 'duman', normal: true, rot: 'r', a: 0.5, hot: 0 });
        else P({ p: _v3, v: _v2.set(0, rr(0.3, 1.0), 0), omur: rr(0.6, 1.0), boy: rr(0.07, 0.13), renk: '#ffffff', renk2: '#a8e4ff', kare: RND() < 0.5 ? 'kar' : 'yildiz4', rot: 'r', rotHiz: rr(-2, 2), hot: 1 }); }
      // zemin donar: dalganın geçtiği yerde kırağı lekeleri (süs önceliği)
      is.dk = (is.dk || 0) + dt * 26 * OLCEK; while (is.dk >= 1) { is.dk--; const a = RND() * TAU, rr0 = r * rr(0.82, 1.0); const x = c.x + Math.cos(a) * rr0, z = c.z + Math.sin(a) * rr0; if (Math.abs(x) > 3.6 || Math.abs(z) > 4.6) continue;
        // kırağı: buz mavisi ışıyan yer lekeleri ve kar tanesi izleri (beyaz normal karışım koyu zeminde gri duman/taş öbeği gibi duruyordu)
        const kr = RND() < 0.3; _v3.set(x, Z() + 0.03, z);
        if (kr) P({ p: _v3, mod: 1, omur: 1.6, boy: rr(0.3, 0.42), boy2: rr(0.34, 0.46), renk: '#cfefff', renk2: '#8fd0ff', kare: 'kar', rot: 'r', hot: 0.2, a: 0.42, fi: 0.05, fo: 0.55, on: 0 });
        else P({ p: _v3, mod: 1, omur: 1.6, boy: rr(0.6, 0.95), boy2: rr(0.7, 1.05), renk: '#5fb8ff', kare: 'parilti', hot: 0.12, a: 0.28, fi: 0.05, fo: 0.55, on: 0 }); } });
    hs.forEach(t => { const d = Math.hypot(t.p.x - c.x, t.p.z - c.z); zamanla(d / HIZ, () => {
      const tz = t.o ? konum(t.o, new THREE.Vector3()) : t.p.clone(), tp = tz.clone().setY(tz.y + 0.4 * t.h);
      flas(tp, { renk: '#cfefff', boy: 0.8, sure: 0.18, isik: false });
      for (let i = 0, n = N(8 * g); i < n; i++) { kureY(_v2, 0.8).multiplyScalar(rr(1, 2.2)); P({ p: tp, v: _v2, g: 7, omur: rr(0.5, 0.75), boy: rr(0.16, 0.28), renk: '#f2fdff', renk2: '#8fd6ff', kare: 'buz', rot: 'r', rotHiz: rr(-5, 5), hot: 0.6, sek: 0.05 }); }
      if (kristalH) buzKume(tz, { n: 6, r: 0.36 * Math.max(0.8, t.h), boy: 0.92 * Math.max(0.8, t.h), kal: 1.25, omur: 0.85, buyu: 0.1 });   // kalın, iri sivri kristaller
      dekal(tz, { r: 0.6, renk: '#dff6ff', kare: 'kar', additive: true, a: 0.55, sure: 1.6 }); }); });
  },
  // Gölge Tilki: nişanda iki el arasında mor enerji yayı (HAZIR) → 3B gölge oku (parlak uç, mor tüy) uçar, ardında kalın mor iz ve kara
  // duman → hedefe saplanır (0,3 sn kalır, hedefi izler) → mor patlama: çapraz kesik, kara duman, sarsıntı
  golgeOk(k, hs, o) {
    const h = hs[0]; if (!h) return; const g = o.guc, U = Math.max(0.12, o.ucus || 0.3), el = o.soket ? new THREE.Vector3().copy(o.soket) : new THREE.Vector3().copy(k.p).setY(k.p.y + 0.65 * k.h);
    _v4.set(0, 1, 0); P({ p: el, mod: 2, eksen: _v4, omur: 0.18, boy: 1, en: 0.1, uz: 0.7, renk: '#e9d2ff', kare: 'isin', hot: 1, fi: 0, fo: 0.5 });
    flas(el, { renk: '#9a4dff', boy: 0.45, sure: 0.16, halka: false, a: 0.8 });
    P({ p: el, omur: 0.22, boy: 0.12, boy2: 0.65, renk: '#a46cff', kare: 'halka', hot: 0.5, a: 0.7, fi: 0, fo: 0.3 });
    const ok = okAl(), A = el.clone(), B = new THREE.Vector3(), cur = new THREE.Vector3(), onceki = A.clone(), yon = new THREE.Vector3();
    const hedefAl = () => { konum(h.o || h.p, B); B.y += (h.h || 1) * 0.5; return B; };
    // iri ok (oyun kamerasında hedef tam karşıdayken atış ekranda dikey ve kısa: ok küçükken çubuğun altında kayboluyordu); odak: kaplama çekilir
    if (ok) { ok.scale.setScalar(1.5 * g); hedefAl(); yon.copy(B).sub(A).normalize(); ok.position.copy(A); ok.quaternion.setFromUnitVectors(_okZ, yon); }
    hedefAl(); const okYan = yanKavis(A, B, 0.45, new THREE.Vector3()), okYuk = 0.09 + 0.12 * Math.min(1, okYan.length() / 0.45);   // kameraya hizalı atışta yay ve yan kavis
    surec(U, (kk, dt) => {
      hedefAl(); cur.lerpVectors(A, B, kk); cur.y += Math.sin(kk * Math.PI) * okYuk * A.distanceTo(B); cur.addScaledVector(okYan, Math.sin(kk * Math.PI)); odak(cur, 0.4);
      yon.copy(cur).sub(onceki); if (yon.lengthSq() < 1e-8) yon.copy(B).sub(A); yon.normalize();
      if (ok) { ok.position.copy(cur); ok.quaternion.setFromUnitVectors(_okZ, yon); }
      P({ p: cur, omur: -1, boy: 0.6, renk: '#2a0f4a', kare: 'parilti', normal: true, hot: 0, a: 0.5 });
      P({ p: cur, omur: -1, boy: 0.55, renk: '#a46cff', kare: 'parilti', hot: 0.7, a: 0.8 });
      P({ p: _v3.copy(cur).addScaledVector(yon, 0.42 * g), omur: -1, boy: 0.3, renk: '#f0e0ff', kare: 'parilti', hot: 1, a: 1 });
      if (!ok) P({ p: cur, mod: 2, eksen: yon, omur: -1, boy: 1, en: 0.16, uz: 1.2, renk: '#ffffff', kare: 'kivilcim', hot: 1 });
      izParca(onceki, cur, { renk: '#a46cff', renk2: '#4a1a8a', en: 0.3 * g, omur: 0.42 });
      for (let i = 0, n = OLCEK < 1 ? 2 : 3; i < n; i++) { _v4.copy(cur).addScaledVector(kureY(_v2, 0), 0.05); P({ p: _v4, v: kureY(_v2, 0).multiplyScalar(0.25), drag: 2, omur: rr(0.45, 0.65), boy: 0.24, boy2: 0.5, renk: '#3a1a5a', renk2: '#140a22', kare: 'duman', normal: true, rot: 'r', a: 0.65, hot: 0 }); }
      onceki.copy(cur);
      if (kk >= 1) {
        const yS = yon.clone(), ofs = new THREE.Vector3().copy(yS).multiplyScalar(-0.3 * g);
        vurus(B, { renk: '#a46cff', guc: 1.2 * g, yon: yS, tur: 'ok' }); sars(0.06);
        surec(0.3, (k2) => { if (!ok) return; hedefAl(); ok.position.copy(B).add(ofs); ok.position.addScaledVector(yS, 0.06 * cikisK(Math.min(1, k2 * 5))); ok.quaternion.setFromUnitVectors(_okZ, yS);
          P({ p: B, omur: -1, boy: 0.45 + 0.15 * Math.sin(k2 * 30), renk: '#a46cff', kare: 'parilti', hot: 0.7, a: 0.7 });
          if (k2 >= 1) ok.visible = false; });
        // mor patlama: koyu mor-kara duman bulutu önce (zemin), üstünde mor çapraz kesik ve kısık mor parlama (bloom'da beyaz X olmasın)
        zamanla(0.3, () => { const C = hedefAl().clone(), on2 = ONCELIK; ONCELIK = 2;
          for (let i = 0, n = N(14); i < n; i++) { kureY(_v2, 0.3).multiplyScalar(rr(0.8, 2.2)); P({ p: C, v: _v2, drag: 2.5, omur: rr(0.5, 0.85), boy: rr(0.28, 0.42), boy2: 0.9, renk: i % 3 ? '#3a1466' : '#5a24a0', renk2: '#120620', kare: 'duman', normal: true, rot: 'r', a: 0.85, hot: 0 }); }
          for (const r of [-0.8, 0.8]) P({ p: C, omur: 0.3, boy: 0.85 * g, boy2: 1.3 * g, en: 1.6, renk: '#d8b8ff', renk2: '#7a2cff', kare: 'kesik', rot: r + Math.PI / 2, hot: 0.55, fi: 0, fo: 0.3 });
          flas(C, { renk: '#8a3cff', boy: 0.8 * g, sure: 0.2, a: 0.75 }); patlama(C, { renk: '#b07cff', renk2: '#5a1aa8', n: 10, guc: g, yildizN: 2 });
          sars(0.12 * g); ONCELIK = on2; });
      }
    });
  },
  // Fırtına Ejderi: baştan göğe şimşek → her hedefin üstünde kara bulut toplanır, yerde gölge → 0,09 sn arayla gökten yıldırım (flaş, şok,
  // kıvılcım, yanık); çarpılan hedefte 0,6 sn sarı elektrik kıvılcımları
  yildirim(k, hs, o) {
    const g = o.guc, on = ON_SURE.yildirim, bas = o.soket ? new THREE.Vector3().copy(o.soket) : new THREE.Vector3().copy(k.p).setY(k.p.y + 0.9 * k.h);
    zincir(bas, _v3.copy(bas).add(_v2.set(rr(-0.3, 0.3), 7, rr(-0.3, 0.3))), { renk: '#fff27a', sure: 0.2, kalin: 0.13 * g, dal: 2 });
    flas(bas, { renk: '#fff27a', boy: 0.55, sure: 0.18, isikGuc: 5, a: 0.75 });   // ejderi beyaza boğmasın
    _v3.copy(bas).setY(bas.y + 1.2); P({ p: _v3, omur: 0.3, boy: 0.8, boy2: 1.4, renk: '#fff27a', kare: 'parilti', hot: 0.35, a: 0.55, fi: 0 });
    hs.slice(0, 3).forEach((h, i) => {
      const tS = on + i * 0.09, hz = new THREE.Vector3().copy(h.p), hh0 = h.h || 1;
      // gök bulutu (hedefin başının ~1 birim üstünde; kadraja sığmazsa alçalır) ve yerde gölge: yıldırımdan hemen önce
      let BY = Math.max(1.7, hh0 + 1.0);
      if (kamera) for (let j = 0; j < 5; j++) { _v1.set(hz.x, Z() + BY + 0.4, hz.z).project(kamera); if (_v1.y < 0.92 || BY < hh0 + 0.55) break; BY -= 0.15; }
      zamanla(Math.max(0, tS - 0.16), () => { if (h.o) konum(h.o, hz);
        for (let j = 0, n = N(8); j < n; j++) { _v3.set(hz.x + rr(-0.55, 0.55), Z() + BY + rr(-0.1, 0.2), hz.z + rr(-0.45, 0.45)); P({ p: _v3, v: _v2.set(rr(-0.2, 0.2), 0, rr(-0.2, 0.2)), drag: 1.5, omur: rr(0.55, 0.75), boy: rr(0.55, 0.8), boy2: rr(0.85, 1.1), renk: '#2a2e44', renk2: '#14161f', kare: 'duman', normal: true, rot: 'r', a: 0.88, hot: 0 }); }
        _v3.set(hz.x, Z() + BY, hz.z); P({ p: _v3, omur: 0.2, boy: 0.7, boy2: 1.1, renk: '#fff6a0', kare: 'parilti', hot: 0.4, a: 0.5, fi: 0.3 });
        dekal(hz, { r: 1.1, renk: '#06060c', kare: 'duman', a: 0.4, sure: 0.6 }); });
      zamanla(tS, () => {
        if (h.o) konum(h.o, hz); const alt = new THREE.Vector3().copy(hz).setY(hz.y + 0.15), ust = alt.clone().add(_v2.set(rr(-0.35, 0.35), BY + 0.1 - 0.15 - hz.y + Z(), rr(-0.35, 0.35)));
        zincir(ust, alt, { renk: '#fff27a', sure: 0.32, kalin: 0.17 * g, dal: 3, kontur: true, sap: 0.32 });
        flas(_v3.copy(alt).setY(alt.y + 0.3), { renk: '#fff27a', boy: 0.95 * g, sure: 0.2, isikGuc: 6, a: 0.8 });
        sok(alt, { renk: '#fff27a', r: 1.0 * g, toz: true, tozRenk: '#8a7a6a', tozN: 8 });
        patlama(_v3.copy(alt).setY(alt.y + 0.2), { renk: '#fff27a', n: 10, hiz: 4, guc: g, yildizN: 2 });
        dekal(alt, { r: 0.6, renk: '#1a1410', a: 0.8 }); sars(0.2 * g);
        const hh = h.h || 1; surec(0.6, (kk, dt, yas, is) => { const tp = h.o ? takipPoz(h.o) : hz; is.acc = (is.acc || 0) + dt * 22 * OLCEK; while (is.acc >= 1) { is.acc--;
          _v3.set(tp.x + rr(-0.25, 0.25), tp.y + rr(0.15, 0.9) * hh, tp.z + rr(-0.25, 0.25));
          P({ p: _v3, v: kureY(_v2, 0.2).multiplyScalar(rr(1, 2.2)), drag: 5, omur: rr(0.07, 0.13), boy: 0.08, uz: 1.8, en: 0.5, renk: '#ffffff', renk2: '#fff27a', kare: 'kivilcim', mod: 2, uzat: 0.06, hot: 1, a: 1 - kk * 0.5 }); } });
      });
    });
  },
};
// ───────────────────────── yetenek hazırlıkları (yetenekBaslat'ta; o.sure: patlamaya kalan sn, o.kemik: soket kemiği) ─────────────────────────
const HAZIR = {
  // Yılan: boyun kıvrılıp baş geri çekilirken ağızda yeşil damla birikir (büyüyen parıltı, damlayan zehir); tükürmede mermi devralır
  zehir(k, o) {
    const kem = o.kemik, s = Math.max(0.08, o.sure), il = o.ileri || _v4.set(0, 0, 1), ilx = il.x, ilz = il.z;
    surec(s, (kk, dt, yas, is) => { if (k.o && !k.o.visible) return;
      const b = kem && kem.parent ? takipPoz(kem) : k.p; _v3.set(b.x + ilx * 0.12 * k.h, (kem ? b.y : b.y + 0.7 * k.h), b.z + ilz * 0.12 * k.h);
      const e = kk * kk; P({ p: _v3, omur: -1, boy: 0.12 + 0.34 * e, renk: '#8dff5a', kare: 'parilti', hot: 0.8, a: 0.6 + 0.4 * e });
      P({ p: _v3, omur: -1, boy: 0.06 + 0.16 * e, renk: '#3f9a2a', kare: 'damla', normal: true, hot: 0.3, a: 0.9 });
      is.acc = (is.acc || 0) + dt * 14 * OLCEK; while (is.acc >= 1) { is.acc--; P({ p: _v3, v: _v2.set(rr(-0.1, 0.1), -0.4, rr(-0.1, 0.1)), g: 6, omur: 0.35, boy: 0.06, renk: '#5fd03a', kare: 'damla', normal: true, mod: 2, uzat: 0.08, hot: 0.4 }); } });
  },
  // Kaplumbağa: baş kabuğa çekilirken ağızdan kırağı buharı tüter, kabuğun üstünde kar taneleri belirip parlar
  buzNefes(k, o) {
    const kem = o.kemik, s = Math.max(0.1, o.sure), il = o.ileri || _v4.set(0, 0, 1), ilx = il.x, ilz = il.z;
    surec(s, (kk, dt, yas, is) => { if (k.o && !k.o.visible) return; is.acc = (is.acc || 0) + dt * 26 * OLCEK;
      while (is.acc >= 1) { is.acc--;
        if (kem && kem.parent && RND() < 0.55) { const b = takipPoz(kem); _v3.set(b.x + ilx * 0.1 * k.h, b.y, b.z + ilz * 0.1 * k.h);
          P({ p: _v3, v: _v2.set(ilx * 0.3 + rr(-0.1, 0.1), rr(0.25, 0.5), ilz * 0.3 + rr(-0.1, 0.1)), drag: 1.5, omur: rr(0.4, 0.6), boy: 0.08, boy2: 0.26, renk: '#eefaff', renk2: '#a8dcff', kare: 'duman', normal: true, rot: 'r', a: 0.55, hot: 0 }); }
        else { const a = RND() * TAU, r = rr(0.05, 0.3) * k.h; _v3.set(k.p.x + Math.cos(a) * r, k.p.y + rr(0.55, 0.75) * k.h, k.p.z + Math.sin(a) * r);
          P({ p: _v3, v: _v2.set(0, 0.15, 0), omur: rr(0.3, 0.45), boy: rr(0.1, 0.16), boy2: 0.04, renk: '#bfeaff', renk2: '#4fa8ff', kare: 'kar', rot: 'r', rotHiz: 2, hot: 0.9, fi: 0.3 }); } } });
  },
  // Semender: sırttan korlar yükselir (kor kimliği); dönüşte kuyruk ucundan halka biçiminde alev izi (halka bu izden büyür)
  ocak(k, o) {
    const kem = o.kemik, s = Math.max(0.12, o.sure), donBas = Math.max(0, s - 0.16);
    surec(s + 0.08, (kk, dt, yas, is) => { if (k.o && !k.o.visible) return;
      is.acc = (is.acc || 0) + dt * (yas < donBas ? 18 : 6) * OLCEK;
      while (is.acc >= 1) { is.acc--; const a = RND() * TAU, r = rr(0, 0.22) * k.h; _v3.set(k.p.x + Math.cos(a) * r, k.p.y + rr(0.3, 0.45) * k.h, k.p.z + Math.sin(a) * r);
        P({ p: _v3, v: _v2.set(rr(-0.15, 0.15), rr(0.6, 1.2), rr(-0.15, 0.15)), g: -0.3, omur: rr(0.35, 0.6), boy: 0.05, uz: 1.8, en: 0.6, renk: '#ffd36a', renk2: '#ff4a1a', kare: 'kivilcim', mod: 2, uzat: 0.06, hot: 1 }); }
      if (yas >= donBas && kem && kem.parent) { const b = takipPoz(kem); is.ia = (is.ia || 0) + dt * 90 * OLCEK;
        while (is.ia >= 1) { is.ia--; _v3.set(b.x + rr(-0.05, 0.05), Z() + rr(0.05, 0.2), b.z + rr(-0.05, 0.05));
          P({ p: _v3, v: _v2.set(0, rr(0.8, 1.6), 0), g: -1, drag: 1, omur: rr(0.3, 0.45), boy: rr(0.3, 0.45), boy2: 0.08, en: 0.85, uz: 1.25, renk: '#ffb02e', renk2: '#ff2a10', kare: 'alev', normal: true, rot: rr(-0.25, 0.25), hot: 0.35, fo: 0.4 }); } } });
  },
  // Bulut Atı: şahlanırken yeleden ve kanatlardan bulut buharı, ayak altında altın toz
  dortnal(k, o) {
    for (let i = 0, n = N(12); i < n; i++) { const a = RND() * TAU; _v3.set(k.p.x + Math.cos(a) * 0.3 * k.h, k.p.y + rr(0.55, 0.95) * k.h, k.p.z + Math.sin(a) * 0.3 * k.h);
      P({ p: _v3, v: _v2.set(Math.cos(a) * rr(0.3, 0.7), rr(0.2, 0.6), Math.sin(a) * rr(0.3, 0.7)), drag: 2, omur: rr(0.5, 0.8), boy: rr(0.16, 0.26), boy2: rr(0.4, 0.6), renk: '#ffffff', renk2: '#f3e8ff', kare: 'duman', normal: true, rot: 'r', a: 0.7, hot: 0 }); }
    for (let i = 0, n = N(6); i < n; i++) { _v3.set(k.p.x + rr(-0.3, 0.3), Z() + 0.08, k.p.z + rr(-0.3, 0.3)); P({ p: _v3, v: _v2.set(0, rr(0.3, 0.7), 0), omur: rr(0.35, 0.6), boy: rr(0.08, 0.13), renk: '#ffe08a', kare: 'yildiz4', rot: 'r', hot: 1 }); }
  },
  // Kuğu: kanatlar kapanırken göğüste altın ışık birikir (zerreler göğüse akar, çekirdek büyür)
  kanat(k, o) {
    const kem = o.kemik, s = Math.max(0.1, o.sure), hedef = new THREE.Vector3();
    surec(s, (kk, dt, yas, is) => { if (k.o && !k.o.visible) return;
      if (kem && kem.parent) hedef.copy(takipPoz(kem)); else hedef.copy(k.p).setY(k.p.y + 0.6 * k.h);
      P({ p: hedef, omur: -1, boy: 0.14 + 0.36 * kk * kk, renk: '#ffc83a', kare: 'parilti', hot: 0.5, a: 0.6 });
      is.acc = (is.acc || 0) + dt * 40 * OLCEK; while (is.acc >= 1) { is.acc--; kureY(_v2, 0.2).multiplyScalar(rr(0.5, 0.8) * k.h); _v3.copy(hedef).add(_v2);
        P({ p: _v3, hedef, hom: 9, hiz: 3.2, omur: 0.3, boy: rr(0.07, 0.12), boy2: 0.03, renk: RND() < 0.5 ? '#ffe9a8' : '#fff6d8', kare: RND() < 0.3 ? 'yildiz4' : 'parilti', hot: 1, fo: 0.7 }); } });
  },
  // Golem: iki el yere iner → yer çatlar, toz → iri kaya (aynı ağ, kristal damarları ışıyarak) yerden sarsılarak yükselir, toprak fışkırır →
  // ellere çıkar ve başın üstünde taşınır (altından toz dökülür). Bırakmada YETENEK.tasFirlat aynı kayayı devralır (kayaElde)
  tasFirlat(k, o) {
    const kem = o.kemik, kem2 = o.kemik2, kaya = kayaAl(); if (!kaya) return;
    const s = Math.max(0.15, o.sure), il = o.ileri || _v4.set(0, 0, 1), ilx = il.x, ilz = il.z, B = KAYA_BUYUK * (o.kut ? 1.12 : 1), R = KAYA_R * B;
    // kaya golemin önünde ama hafif yanda (kameranın sağına) yerden kopar: bitişik hedefin gövdesinin ve vuruş parlamasının arkasında kalmasın
    let ys = 1; if (kamera) { const sx = kamera.matrixWorld.elements[0], sz = kamera.matrixWorld.elements[2]; ys = (ilz * sx - ilx * sz) >= 0 ? 1 : -1; }
    const zemin = new THREE.Vector3(k.p.x + (ilx * 0.38 + ilz * 0.3 * ys) * k.h, Z(), k.p.z + (ilz * 0.38 - ilx * 0.3 * ys) * k.h), el = new THREE.Vector3();
    const kay = { kaya, atildi: false }; if (k.o) kayaElde.set(k.o, kay);
    kaya.visible = false; kaya.userData.ayrildi = true; kaya.scale.setScalar(B * 0.8); let catladi = false, koptu = false;
    surec(s + 0.3, (kk0, dt, yas) => {
      if (kay.atildi) return;   // fırlatma devraldı
      if ((k.o && (!k.o.visible || !k.o.parent)) || yas > s + 0.26) { kaya.visible = false; kaya.userData.ayrildi = false; if (k.o && kayaElde.get(k.o) === kay) kayaElde.delete(k.o); kay.atildi = true; return; }
      const kk = Math.min(1, yas / s);
      if (kem && kem.parent) { el.copy(takipPoz(kem)); if (kem2 && kem2.parent) el.add(takipPoz(kem2)).multiplyScalar(0.5); } else el.copy(k.p).setY(k.p.y + 1.1 * k.h);
      if (!catladi && kk >= 0.1) { catladi = true;
        _v3.set(zemin.x, Z() + 0.03, zemin.z); P({ p: _v3, mod: 1, normal: true, omur: 1.6, boy: 1.15, boy2: 1.3, renk: '#2b1c10', kare: 'catlakYer', rot: 'r', hot: 0, a: 0.85, fi: 0.02, fo: 0.6 });
        P({ p: _v3, mod: 1, omur: 0.5, boy: 0.9, boy2: 1.1, renk: '#ff9a3a', kare: 'catlakYer', rot: 'r', hot: 0.5, a: 0.6, fi: 0, fo: 0.3 });
        sok(zemin, { renk: '#e9c48f', r: 0.6, toz: true, tozRenk: '#a98361', tozN: 10, sure: 0.4 }); }
      if (kk < 0.18) return;
      kaya.visible = true;
      if (kk < 0.5) { const e = (kk - 0.18) / 0.32; kaya.position.set(zemin.x + rr(-0.02, 0.02), Z() - R + e * R * 1.75, zemin.z + rr(-0.02, 0.02)); kaya.scale.setScalar(B * (0.85 + 0.15 * e));
        if (!koptu) { koptu = true; for (let i = 0, n = N(10); i < n; i++) { const a = RND() * TAU; _v3.set(zemin.x + Math.cos(a) * R, Z() + 0.05, zemin.z + Math.sin(a) * R);
          P({ p: _v3, v: _v2.set(Math.cos(a) * rr(0.5, 1.2), rr(1.8, 3.2), Math.sin(a) * rr(0.5, 1.2)), g: 9, omur: 0.7, boy: rr(0.1, 0.2), renk: '#8e6a4c', kare: 'tas', normal: true, rot: 'r', rotHiz: rr(-6, 6), hot: 0, sek: 0.05, fo: 0.7 }); } }
        if (RND() < dt * 40 * OLCEK) { _v3.set(zemin.x + rr(-R, R), Z() + 0.08, zemin.z + rr(-R, R)); P({ p: _v3, v: _v2.set(rr(-0.4, 0.4), rr(0.6, 1.4), rr(-0.4, 0.4)), drag: 2, omur: 0.6, boy: 0.25, boy2: 0.6, renk: '#a98361', renk2: '#d8c4a4', kare: 'toz', normal: true, rot: 'r', a: 0.7, hot: 0 }); } }
      else { const e = Math.min(1, (kk - 0.5) / 0.22), y = e * e * (3 - 2 * e); _v3.copy(el); _v3.y += R * 0.32;
        kaya.position.set(zemin.x, Z() + R * 0.75, zemin.z).lerp(_v3, y); kaya.scale.setScalar(B);
        if (RND() < dt * 16 * OLCEK) { _v2.copy(kaya.position); _v2.y -= R * 0.8; P({ p: _v2, v: _v4.set(rr(-0.2, 0.2), -0.3, rr(-0.2, 0.2)), g: 3, omur: 0.6, boy: 0.14, boy2: 0.34, renk: '#b99772', renk2: '#e6d4b8', kare: 'toz', normal: true, rot: 'r', a: 0.6, hot: 0 }); } }
      kaya.rotation.y += dt * 0.6; kaya.children[0].material.emissiveIntensity = 0.9 + 1.8 * kk + Math.sin(yas * 18) * 0.3 * kk;
      if (kk >= 0.4) odak(kaya.position, R * 1.5);   // başın üstünde taşınan kaya çubuğun/balonun altında kalmasın
    });
  },
  // Davulcu Kurbağa: göbeğin önünde 3B savaş davulu belirir (aşma payıyla büyür), derisi ışır; vuruşlarda YETENEK.davul derisini parlatır
  davul(k, o) {
    const dv = davulAl(); if (!dv) return; const s = Math.max(0.15, o.sure), il = o.ileri || _v4.set(0, 0, 1), ilx = il.x, ilz = il.z, B = 1.05 * k.h;
    if (k.o) davulElde.set(k.o, dv); dv.userData.vur = 0; const deri = dv.userData.deri.material;
    surec(s + 1.0, (kk, dt, yas) => {
      const p = k.o && k.o.parent ? takipPoz(k.o) : k.p, ra = k.o ? k.o.rotation.y : Math.atan2(ilx, ilz), ix = Math.sin(ra), iz = Math.cos(ra);
      // kamera kurbağayı arkadan görüyorsa (oyun kamerası, oyuncunun kendi birimi) davul göğüs hizasında gövdenin arkasında kalıyordu:
      // davul öne ve başın hizasına çıkar, derisi kuşbakışı oyuncuya döner (trampet gibi), biraz büyür. Önden bakışta göbekte kalır.
      let arka = 0; if (kamera) { const kx = -kamera.matrixWorld.elements[8], kz = -kamera.matrixWorld.elements[10], kl = Math.hypot(kx, kz) || 1; arka = Math.max(0, Math.min(1, (kx * ix + kz * iz) / kl * 1.4)); }
      dv.position.set(p.x + ix * (0.36 + 0.3 * arka) * k.h, p.y + (0.4 + 0.34 * arka) * k.h, p.z + iz * (0.36 + 0.3 * arka) * k.h); dv.rotation.set(0.9 - 1.2 * arka, ra, 0, 'YXZ');
      const ac = Math.min(1, yas / 0.15), acK = ac < 1 ? cikisK(ac) * (1 + 0.25 * Math.sin(Math.PI * ac)) : 1, kap = yas > s + 0.8 ? Math.max(0, 1 - (yas - s - 0.8) / 0.2) : 1;
      dv.userData.vur = Math.max(0, dv.userData.vur - dt * 9);
      const sc = B * acK * kap * (1 + 0.28 * arka); dv.scale.set(sc * (1 + 0.1 * dv.userData.vur), sc * (1 - 0.2 * dv.userData.vur), sc * (1 + 0.1 * dv.userData.vur));
      deri.emissiveIntensity = 0.12 + 0.25 * Math.min(1, yas / s) + 2.6 * dv.userData.vur;   // vuruşlar arası deri sönük: vuruş parlaması seçilsin
      if (dv.visible && kap > 0.3) odak(dv.position, 0.3 * sc);   // davul çubuğun/balonun altında kalmasın
      if (kk >= 1 || (k.o && !k.o.visible)) { dv.visible = false; if (k.o && davulElde.get(k.o) === dv) davulElde.delete(k.o); }
    });
  },
  // Kurt: nefes alırken sırttaki kristal zerreleri başa akar
  uluma(k, o) {
    const s = Math.max(0.15, o.sure), hedef = o.kemik ? new THREE.Vector3().copy(takipPoz(o.kemik)) : new THREE.Vector3().copy(k.p).setY(k.p.y + 0.75 * k.h);
    for (let i = 0, n = N(14); i < n; i++) { _v3.set(k.p.x + rr(-0.4, 0.4), k.p.y + rr(0.5, 0.9) * k.h, k.p.z + rr(-0.4, 0.4));
      P({ p: _v3, hedef, hom: 5, hiz: 2.2, v: _v2.set(0, 0.4, 0), omur: s + 0.1, boy: rr(0.08, 0.14), boy2: 0.04, renk: '#bfefff', renk2: '#4f8bff', kare: RND() < 0.4 ? 'yildiz4' : 'parilti', hot: 1, fi: 0.2 }); }
  },
  // Yarasa: kanatlar açılırken kızıl sis sızar
  ruhEmme(k, o) {
    for (let i = 0, n = N(8); i < n; i++) { _v3.set(k.p.x + rr(-0.35, 0.35), k.p.y + rr(0.4, 0.8) * k.h, k.p.z + rr(-0.35, 0.35));
      P({ p: _v3, v: _v2.set(rr(-0.4, 0.4), rr(0.1, 0.4), rr(-0.4, 0.4)), drag: 2, omur: rr(0.4, 0.6), boy: rr(0.14, 0.22), boy2: 0.4, renk: '#5a0f2a', renk2: '#2a0a1a', kare: 'duman', normal: true, rot: 'r', a: 0.5, hot: 0 }); }
  },
  // Rüzgâr Ruhu: dönerken çevresinde yapraklar ve rüzgâr çizgileri toplanır (yarıçap daralır); iki avuç arasında küçük girdap döner, büyür
  kasirga(k, o) {
    const s = Math.max(0.15, o.sure), p = k.p, k1 = o.kemik, k2 = o.kemik2, el = new THREE.Vector3();
    surec(s, (kk, dt, yas, is) => { if (k.o && !k.o.visible) return; is.acc = (is.acc || 0) + dt * 60 * OLCEK;
      while (is.acc >= 1) { is.acc--; const yap = RND() < 0.55; _v3.set(p.x, Z() + rr(0.1, 0.4) * k.h, p.z);
        P({ p: _v3, yorunge: { r: rr(0.6, 0.85), w: rr(7, 10), vy: rr(0.4, 0.9), rv: -rr(1.0, 1.5) }, omur: rr(0.35, 0.5), boy: yap ? rr(0.14, 0.2) : 0.16, boy2: yap ? 0.12 : 0.05,
          renk: yap ? (RND() < 0.5 ? '#7dd35a' : '#c9e85a') : '#e8fff9', renk2: yap ? '#4a9a3a' : '#7fc8c0', kare: yap ? 'yaprak' : 'kivilcim', mod: yap ? 0 : 2, uzat: yap ? 0 : 0.08, en: yap ? 1 : 0.5,
          rot: 'r', rotHiz: rr(-8, 8), normal: yap, hot: yap ? 0 : 0.9, a: yap ? 1 : 0.7, fo: 0.4 }); }
      if (k1 && k1.parent) { el.copy(takipPoz(k1)); if (k2 && k2.parent) el.add(takipPoz(k2)).multiplyScalar(0.5);
        const e = kk * kk; P({ p: el, omur: -1, boy: 0.15 + 0.4 * e, renk: '#c8fff0', kare: 'girdap', rot: -yas * 18, hot: 0.6, a: 0.85 }); P({ p: el, omur: -1, boy: 0.1 + 0.25 * e, renk: '#7fe8cf', kare: 'parilti', hot: 0.8, a: 0.7 }); } });
  },
  // Koç: ön toynakla iki eşeleme (toz), burundan iki buhar
  deliOfke(k, o) {
    const il = o.ileri || _v4.set(0, 0, 1), s = Math.max(0.2, o.sure), kem = o.kemik, ilx = il.x, ilz = il.z;
    for (let j = 0; j < 2; j++) zamanla(s * (0.3 + 0.3 * j), () => {
      _v3.set(k.p.x + ilx * 0.32 * k.h + ilz * 0.1, Z() + 0.05, k.p.z + ilz * 0.32 * k.h - ilx * 0.1);
      for (let i = 0, n = N(5); i < n; i++) P({ p: _v3, v: _v2.set(-ilx * rr(0.8, 1.4) + rr(-0.3, 0.3), rr(0.3, 0.8), -ilz * rr(0.8, 1.4) + rr(-0.3, 0.3)), drag: 2.5, omur: rr(0.4, 0.6), boy: 0.14, boy2: 0.38, renk: '#b49a7a', renk2: '#e8d8c0', kare: 'toz', normal: true, rot: 'r', a: 0.8, hot: 0 });
      if (kem && kem.parent) { const b = takipPoz(kem); for (let i = 0; i < 2; i++) { _v3.set(b.x + ilz * (i ? 0.05 : -0.05), b.y - 0.04, b.z - ilx * (i ? 0.05 : -0.05));
        P({ p: _v3, v: _v2.set(ilx * 0.9, -0.15, ilz * 0.9), drag: 2.5, g: -0.4, omur: 0.5, boy: 0.08, boy2: 0.3, renk: '#ffffff', renk2: '#d9cfd8', kare: 'duman', normal: true, rot: 'r', a: 0.65, hot: 0 }); } }
    });
  },
  // ── grup 3 ──
  // Ayı: ayak altındaki gölge büyüyüp morlaşır, kenarından kara tüller yükselir; gözlerde mor parıltı (baş kemiği, ön yöne canlı bakar)
  karaGolge(k, o) {
    const kem = o.kemik, s = Math.max(0.1, o.sure);
    surec(s + 0.04, (kk, dt, yas, is) => { if (k.o && !k.o.visible) return; const p = k.o ? takipPoz(k.o) : k.p, e = kk * kk * (3 - 2 * kk);
      _v3.set(p.x, Z() + 0.03, p.z);
      P({ p: _v3, mod: 1, normal: true, omur: -1, boy: (0.9 + 1.0 * e) * k.h, renk: '#12061f', kare: 'duman', hot: 0, a: 0.45 + 0.35 * e });
      P({ p: _v3, mod: 1, omur: -1, boy: (0.8 + 1.1 * e) * k.h, renk: '#7a2cff', kare: 'parilti', hot: 0.3, a: 0.15 + 0.45 * e });
      is.acc = (is.acc || 0) + dt * 22 * OLCEK; while (is.acc >= 1) { is.acc--; const a = RND() * TAU, r = (0.35 + 0.45 * e) * k.h; _v3.set(p.x + Math.cos(a) * r, Z() + 0.06, p.z + Math.sin(a) * r);
        P({ p: _v3, v: _v2.set(-Math.cos(a) * 0.3, rr(0.6, 1.2), -Math.sin(a) * 0.3), drag: 1.5, omur: rr(0.4, 0.6), boy: 0.16, boy2: 0.42, renk: '#2a1442', renk2: '#0c0614', kare: 'duman', normal: true, rot: 'r', a: 0.65, hot: 0 }); }
      if (kem && kem.parent && k.o) { const b = takipPoz(kem), ra = k.o.rotation.y, ix = Math.sin(ra), iz = Math.cos(ra);
        for (let j = -1; j <= 1; j += 2) { _v3.set(b.x + ix * 0.16 * k.h + iz * 0.06 * j, b.y + 0.03 * k.h, b.z + iz * 0.16 * k.h - ix * 0.06 * j);
          P({ p: _v3, omur: -1, boy: 0.06 + 0.1 * e, renk: '#e0c2ff', kare: 'parilti', hot: 1, a: 0.95 }); P({ p: _v3, omur: -1, boy: 0.16 + 0.2 * e, renk: '#9a4dff', kare: 'parilti', hot: 0.5, a: 0.6 }); } } });
  },
  // Anka: kanatlar gerilirken tüyler alev rengine geçer: iki kanat ucundan (el kemikleri) ve sırttan yükselen küçük alevler, korlar
  kulDogus(k, o) {
    const s = Math.max(0.08, o.sure), uc = [o.kemik, o.kemik2];
    surec(s, (kk, dt, yas, is) => { if (k.o && !k.o.visible) return; is.acc = (is.acc || 0) + dt * (34 + 44 * kk) * OLCEK;
      while (is.acc >= 1) { is.acc--; const ke = uc[RND() < 0.5 ? 0 : 1];
        if (ke && ke.parent && RND() < 0.7) { const b = takipPoz(ke); _v3.set(b.x + rr(-0.06, 0.06), b.y + rr(-0.04, 0.06), b.z + rr(-0.06, 0.06)); }
        else { const p = k.o ? takipPoz(k.o) : k.p; _v3.set(p.x + rr(-0.18, 0.18) * k.h, p.y + rr(0.45, 0.8) * k.h, p.z + rr(-0.18, 0.18) * k.h); }
        // kanat ucu ve sırt alevleri: iri, kökte koyu kızıl (normal) + içte turuncu-sarı (kısık ışık): tüyler alev rengine geçer
        const kr = RND() < 0.4; P({ p: _v3, v: _v2.set(rr(-0.15, 0.15), rr(0.7, 1.3), rr(-0.15, 0.15)), g: -0.6, omur: rr(0.25, 0.4), boy: rr(0.22, 0.32), boy2: 0.05, renk: kr ? '#d02000' : '#ffc02a', renk2: kr ? '#4a0600' : '#ff3a00', kare: 'alev', normal: kr, rot: rr(-0.3, 0.3), hot: kr ? 0 : 0.4, a: kr ? 0.85 : 1, fo: 0.5 }); } });
  },
  // Baykuş: tüyler kabarırken çevresinde kar döner (yarıçap daralır), gözler buz mavisi parlar
  ayaz(k, o) {
    const kem = o.kemik, s = Math.max(0.1, o.sure);
    surec(s, (kk, dt, yas, is) => { if (k.o && !k.o.visible) return; const p = k.o ? takipPoz(k.o) : k.p; is.acc = (is.acc || 0) + dt * 50 * OLCEK;
      while (is.acc >= 1) { is.acc--; _v3.set(p.x, p.y + rr(0.1, 0.8) * k.h, p.z);
        P({ p: _v3, yorunge: { r: rr(0.45, 0.7) * (1 - 0.35 * kk), w: rr(5, 8), vy: rr(0.1, 0.5), rv: -0.5 }, omur: rr(0.35, 0.55), boy: rr(0.08, 0.13), boy2: 0.03, renk: '#e9fbff', renk2: '#6fc8ff', kare: RND() < 0.6 ? 'kar' : 'parilti', rot: 'r', rotHiz: rr(-3, 3), hot: 0.55, fo: 0.5 }); }
      if (kem && kem.parent && k.o) { const b = takipPoz(kem), ra = k.o.rotation.y, ix = Math.sin(ra), iz = Math.cos(ra);
        for (let j = -1; j <= 1; j += 2) { _v3.set(b.x + ix * 0.15 * k.h + iz * 0.07 * j, b.y + 0.02 * k.h, b.z + iz * 0.15 * k.h - ix * 0.07 * j);
          P({ p: _v3, omur: -1, boy: 0.07 + 0.1 * kk, renk: '#e9fbff', kare: 'parilti', hot: 1, a: 1 }); P({ p: _v3, omur: -1, boy: 0.18 + 0.2 * kk, renk: '#6fd0ff', kare: 'parilti', hot: 0.5, a: 0.6 }); } } });
  },
  // Tilki: nişanda iki elin önünde mor enerji yayı belirir (dikey yay, geri çekilen kiriş), yayda mor gölge toplanır — büyüyen parıltı, ele
  // akan kara zerreler; hedefin üstünde mor nişan işareti
  golgeOk(k, o) {
    const s = Math.max(0.1, o.sure), k1 = o.kemik, k2 = o.kemik2, el = new THREE.Vector3(), hd = o.hedef, uc1 = new THREE.Vector3(), uc2 = new THREE.Vector3(), cek = new THREE.Vector3();
    surec(s, (kk, dt, yas, is) => { if (k.o && !k.o.visible) return;
      if (k1 && k1.parent) { el.copy(takipPoz(k1)); if (k2 && k2.parent) el.add(takipPoz(k2)).multiplyScalar(0.5); } else el.copy(k.o ? takipPoz(k.o) : k.p).setY(k.p.y + 0.65 * k.h);
      const e = kk * kk; P({ p: el, omur: -1, boy: 0.1 + 0.32 * e, renk: '#a46cff', kare: 'parilti', hot: 0.8, a: 0.75 }); P({ p: el, omur: -1, boy: 0.05 + 0.12 * e, renk: '#f0e0ff', kare: 'parilti', hot: 1, a: 0.9 });
      // enerji yayı: el ortasının önünde dikey yay (uçları ışıklı), kiriş el ortasına doğru gerilir
      const ra = k.o ? k.o.rotation.y : 0, ix = Math.sin(ra), iz = Math.cos(ra), H = 0.5 * k.h * Math.min(1, yas / 0.12), on = 0.18 * k.h, gr = 0.14 * k.h * kk;
      uc1.set(el.x + ix * on * 0.2, el.y + H, el.z + iz * on * 0.2); uc2.set(el.x + ix * on * 0.2, el.y - H, el.z + iz * on * 0.2);
      for (let i = 0; i <= 8; i++) { const t = i / 8, bk = Math.sin(t * Math.PI); _v3.set(el.x + ix * (on * 0.2 + on * bk), el.y + H * (1 - 2 * t), el.z + iz * (on * 0.2 + on * bk));
        P({ p: _v3, omur: -1, boy: 0.2 + 0.04 * bk, renk: '#2a0a4a', kare: 'parilti', normal: true, hot: 0, a: 0.55 });
        P({ p: _v3, omur: -1, boy: 0.13 + 0.04 * bk, renk: '#a45cff', kare: 'parilti', hot: 0.55, a: 1 }); }
      cek.set(el.x - ix * gr, el.y, el.z - iz * gr);
      _v3.copy(uc1).add(cek).multiplyScalar(0.5); _v2.copy(cek).sub(uc1); P({ p: _v3, mod: 2, eksen: _v2, omur: -1, boy: 1, en: 0.055, uz: _v2.length(), renk: '#e8d4ff', kare: 'isin', hot: 0.8, a: 0.95 });
      _v3.copy(uc2).add(cek).multiplyScalar(0.5); _v2.copy(cek).sub(uc2); P({ p: _v3, mod: 2, eksen: _v2, omur: -1, boy: 1, en: 0.055, uz: _v2.length(), renk: '#e8d4ff', kare: 'isin', hot: 0.8, a: 0.95 });
      is.acc = (is.acc || 0) + dt * 36 * OLCEK; while (is.acc >= 1) { is.acc--; kureY(_v2, 0).multiplyScalar(rr(0.35, 0.55)); _v3.copy(el).add(_v2);
        P({ p: _v3, hedef: el, hom: 10, hiz: 2.6, omur: 0.22, boy: rr(0.08, 0.14), boy2: 0.03, renk: RND() < 0.5 ? '#3a1a5a' : '#7a2cff', kare: 'parilti', normal: RND() < 0.5, hot: 0.5, fo: 0.6 }); } });
    if (hd) surec(s + 0.22, (kk, dt, yas, is) => { if (!hd.parent || !hd.visible) return; const p = takipPoz(hd), hh = boyAl(hd), e = 1 - (1 - kk) * (1 - kk);
      _v3.set(p.x, p.y + hh + 0.38, p.z);
      P({ p: _v3, omur: -1, boy: 0.75 - 0.33 * e, renk: '#b07cff', kare: 'halka', hot: 0.7, a: 0.9 });
      P({ p: _v3, omur: -1, boy: 0.3, renk: '#e0c2ff', kare: 'yildiz4', rot: 0.785 + kk * 1.6, hot: 1, a: 0.9 });
      _v4.set(p.x, Z() + 0.04, p.z); P({ p: _v4, mod: 1, omur: -1, boy: 1.3 - 0.5 * e, renk: '#9a4dff', kare: 'halka', hot: 0.4, a: 0.7 }); });
  },
  // Ejder: üstünde dönen kara fırtına bulutu (içinde sarı çakmalar), gövdede ve başta sarı elektrik kıvılcımları
  yildirim(k, o) {
    const kem = o.kemik, s = Math.max(0.1, o.sure);
    surec(s + 0.3, (kk, dt, yas, is) => { if (k.o && !k.o.visible) return; const p = k.o ? takipPoz(k.o) : k.p, by = p.y + k.h + 0.45, hz = yas < s ? 1 : 0.35;
      is.acc = (is.acc || 0) + dt * 30 * OLCEK * hz; while (is.acc >= 1) { is.acc--; _v3.set(p.x, by + rr(-0.1, 0.15), p.z);
        if (RND() < 0.78) P({ p: _v3, yorunge: { r: rr(0.25, 0.75), w: rr(2.2, 3.2), vy: 0 }, omur: rr(0.5, 0.75), boy: rr(0.4, 0.55), boy2: rr(0.6, 0.85), renk: '#2e3248', renk2: '#12141e', kare: 'duman', normal: true, rot: 'r', a: 0.88, hot: 0, on: 0 });
        else P({ p: _v3, yorunge: { r: rr(0.1, 0.5), w: 3 }, omur: rr(0.06, 0.12), boy: rr(0.4, 0.7), renk: '#fff27a', kare: 'parilti', hot: 0.8, a: 0.8, on: 0 }); }
      if (yas < s) { is.ak = (is.ak || 0) + dt * 26 * OLCEK; while (is.ak >= 1) { is.ak--; const a = RND() * TAU, r = rr(0.12, 0.3) * k.h; _v3.set(p.x + Math.cos(a) * r, p.y + rr(0.25, 0.95) * k.h, p.z + Math.sin(a) * r);
        P({ p: _v3, v: kureY(_v2, 0.3).multiplyScalar(rr(0.8, 1.8)), drag: 4, omur: rr(0.08, 0.16), boy: 0.07, en: 0.5, renk: '#ffffff', renk2: '#fff27a', kare: 'kivilcim', mod: 2, uzat: 0.06, hot: 1 }); }
        if (kem && kem.parent) P({ p: takipPoz(kem), omur: -1, boy: 0.12 + 0.22 * kk * kk, renk: '#fff27a', kare: 'parilti', hot: 0.9, a: 0.7 }); } });
  },
};
// Işık Kanadı: tüy değince dostun üstünde kalkan kabarcığı açılır, yıldızlar saçılır, yukarıdan tek tüy süzülür
function kalkanAc(h) {
  const p = konum(h.o || h.p, new THREE.Vector3()), hh = h.h || 1, hp = p.setY(p.y + 0.58 * hh);
  // açılan kabarcık: gövde boyunda (zeminin altına taşmaz: zemin derinliği alt kısmını düz kesiyordu), kısık altın (opak beyaz değil)
  P({ p: hp, omur: 0.45, boy: 0.3, boy2: 1.12 * hh, renk: '#ffe9a8', renk2: '#ffc83a', kare: 'kabarcik', hot: 0.35, a: 0.65, fi: 0, fo: 0.45 });
  _v4.set(hp.x, Z() + 0.05, hp.z); P({ p: _v4, mod: 1, omur: 0.5, boy: 0.5, boy2: 1.3 * hh, renk: '#ffe08a', kare: 'halka', hot: 0.6, a: 0.8, fi: 0, fo: 0.3 });
  P({ p: hp, omur: 0.25, boy: 0.2, boy2: 0.8, renk: '#fff1c0', kare: 'parilti', hot: 0.6, a: 0.5, fi: 0 });
  for (let i = 0, n = N(6); i < n; i++) { kureY(_v2, 0.5).multiplyScalar(rr(0.6, 1.4)); P({ p: hp, v: _v2, drag: 2, omur: rr(0.5, 0.8), boy: rr(0.1, 0.16), renk: '#fff1a8', kare: 'yildiz4', rot: 'r', hot: 1 }); }
  _v3.copy(hp).setY(hp.y + 1.2); P({ p: _v3, v: _v2.set(0, -0.5, 0), omur: 1.2, boy: 0.28, renk: '#fffbe8', kare: 'tuy', rot: 'r', rotHiz: 1.5, salin: 0.2, hot: 0.6, fo: 0.6 });
}
const cikisK = (x) => 1 - (1 - x) * (1 - x) * (1 - x);
// kaynaktan dosta yumuşak yay çizen parçacık akışı (iyileşme / tüy): sure sn sonra 'bitis'. Uç noktası dost hareket etse de izler.
// kare: 'tuy' → başta tek büyük tüy uçar (arkasında ışık izi); yoksa parıltı + artı akışı
function sifaYay(bas, d, renk, sure, bitis, kare) {
  const A = konum(bas, new THREE.Vector3()), B = new THREE.Vector3(), cur = new THREE.Vector3(), tuy = kare === 'tuy';
  surec(sure, (kk, dt, yas, is) => {
    konum(d.o || d.p || d, B); B.y += 0.55 * (d.h || 1);
    const e = tuy ? cikisK(kk) : kk, yuk = Math.sin(e * Math.PI) * Math.max(0.5, 0.35 * A.distanceTo(B));
    cur.lerpVectors(A, B, e); cur.y += yuk;
    if (tuy) P({ p: cur, omur: -1, boy: 0.34, renk: '#fffbe8', renk2: '#ffd76a', kare: 'tuy', rot: kk * 6, hot: 0.7 });
    P({ p: cur, omur: -1, boy: tuy ? 0.38 : 0.3, renk, kare: 'parilti', hot: 0.9, a: 0.8 });
    is.acc = (is.acc || 0) + dt * 50 * OLCEK;
    while (is.acc >= 1) { is.acc--; _v3.copy(cur).add(kureY(_v2, 0).multiplyScalar(0.06));
      P({ p: _v3, v: _v2.set(rr(-0.2, 0.2), rr(0.1, 0.4), rr(-0.2, 0.2)), drag: 2, omur: rr(0.3, 0.5), boy: rr(0.08, 0.13), boy2: 0.02, renk, renk2: '#ffffff', kare: !tuy && RND() < 0.35 ? 'arti' : 'parilti', hot: 1, fo: 0.6 }); }
    if (kk >= 1 && bitis) bitis();
  });
}
function iyiles(d, renk, o = null) {
  const p = konum(d.o || d.p || d, new THREE.Vector3()), h = d.h || 1;
  // halka biçiminde yükselen artılar + yerden yumuşak ışık sütunu (kabarcık yok: iyileşme tek bakışta okunsun)
  for (let i = 0, n = N(8); i < n; i++) { const a = i / n * TAU + rr(0, 0.3); _v3.set(p.x + Math.cos(a) * 0.34, p.y + rr(0.05, 0.3) * h, p.z + Math.sin(a) * 0.34);
    P({ p: _v3, v: _v2.set(0, rr(0.8, 1.3), 0), drag: 0.6, omur: rr(0.7, 0.95), boy: rr(0.14, 0.2), renk, renk2: '#ffffff', kare: 'arti', hot: 0.6, fo: 0.6 }); }
  const sa = o && o.sutun !== undefined ? o.sutun : 1;   // ışık sütunu opaklığı (0: yok) — kızıl/turuncu gövdeyi beyaza boğmasın
  if (sa > 0) sutun(p, { renk, ic: '#efffe8', h: 1.5 * h, en: 0.55, sure: 0.55, zerre: false, a: sa });
  _v3.set(p.x, Z() + 0.05, p.z); P({ p: _v3, mod: 1, omur: 0.6, boy: 0.5, boy2: 1.1, renk, kare: 'halka', hot: 0.5, a: 0.8, fi: 0, fo: 0.3 });
}

// ───────────────────────── durum (sürekli) efektleri ─────────────────────────
function kalkanAl() { for (const k of kalkanHavuz) if (!k.userData.dolu) { k.userData.dolu = true; return k; } return null; }
// Sürekli durum efektleri her karede çalışır: parçacık tanımları kare başına nesne üretmesin diye modül düzeyinde bir kez kurulur,
// her çağrıda yalnız değişen alanlar (dönüş, boy, rastgele değerler) yazılır. Konum _v3/_v4, hız _v2 üzerinden verilir (P kopyalar).
const DP = {
  sersemY: { p: _v3, omur: -1, boy: 0.42, renk: '#ffd23a', kare: 'yildiz4', normal: true, rot: 0, hot: 0.55 },
  sersemK2: { p: _v3, omur: -1, boy: 0.56, renk: '#4a2a00', kare: 'yildiz4', normal: true, rot: 0, hot: 0, a: 0.85 },   // koyu kontur: açık gökte de seçilsin
  sersemP: { p: _v3, omur: -1, boy: 0.5, renk: '#ffb02e', kare: 'parilti', hot: 0.5, a: 0.7 },
  sersemK: { p: _v3, omur: 0.3, boy: 0.1, boy2: 0.02, renk: '#fff1a8', kare: 'parilti', hot: 1 },
  buzS: { p: _v3, mod: 2, eksen: _v2, omur: -1, boy: 0.42, en: 0.9, uz: 1.3, renk: '#d6f3ff', kare: 'buz', normal: true, hot: 0.4, a: 0.95 },
  buzKar: { p: _v3, mod: 1, omur: -1, boy: 1.15, renk: '#bfe9ff', kare: 'kar', normal: true, rot: 0.3, hot: 0.3, a: 0.55 },
  buzPar: { p: _v3, mod: 1, omur: -1, boy: 1.4, renk: '#4fa8ff', kare: 'parilti', hot: 0.2, a: 0.45 },
  donS: { p: _v3, mod: 2, eksen: _v2, omur: -1, boy: 0.6, en: 0.75, uz: 1.5, renk: '#e3f6ff', renk2: '#9fd6ff', kare: 'buz', normal: true, hot: 0.35, a: 0.72 },
  donPar: { p: _v3, omur: -1, boy: 1.3, renk: '#bfe6ff', kare: 'parilti', normal: true, hot: 0.15, a: 0.32 },
  donCek: { p: _v3, mod: 0, omur: -1, boy: 0.8, renk: '#8fd0ff', kare: 'kar', rot: 0, hot: 0.5, a: 0.35 },
  buzTane: { p: _v3, v: _v2, omur: 0.8, boy: 0.12, renk: '#9fdcff', kare: 'kar', rot: 'r', rotHiz: 2, hot: 0.6 },
  yanikAlev: { p: _v3, v: _v2, omur: 0.4, boy: 0.3, boy2: 0.06, renk: '#ffc02a', renk2: '#ff3000', kare: 'alev', normal: true, rot: 0, hot: 0.35 },
  yanikTaban: { p: _v3, v: _v2, omur: 0.4, boy: 0.36, boy2: 0.08, renk: '#d82000', renk2: '#4a0600', kare: 'alev', normal: true, rot: 0, hot: 0, a: 0.85 },
  yanikKiv: { p: _v3, v: _v2, omur: 0.5, boy: 0.07, uz: 2, en: 0.6, renk: '#ffd36a', renk2: '#ff6a1f', kare: 'kivilcim', mod: 2, uzat: 0.12, hot: 1 },
  yanikPar: { p: _v3, omur: -1, boy: 1, renk: '#ff6a1f', kare: 'parilti', hot: 0.2, a: 0.35 },
  zehirKab: { p: _v3, v: _v2, omur: 0.6, boy: 0.15, boy2: 0.22, renk: '#3f9a2a', renk2: '#1f5a14', kare: 'kabarcik', normal: true, hot: 0.3, a: 0.92, salin: 0.04, fo: 0.85 },
  zehirDamla: { p: _v3, v: _v2, g: 4, omur: 0.4, boy: 0.12, renk: '#5fd03a', kare: 'damla', normal: true, mod: 2, uzat: 0.1, hot: 0.4 },
  zehirKafa: { p: _v3, v: _v2, omur: 0.9, boy: 0.18, boy2: 0.32, renk: '#9cff5a', kare: 'kafatasi', normal: true, hot: 0, a: 0.95, fi: 0.15, fo: 0.6 },
  zehirDuman: { p: _v3, mod: 1, omur: -1, boy: 1.0, renk: '#2f8a1a', kare: 'duman', normal: true, rot: 0, hot: 0, a: 0.45 },
  lanetPar: { p: _v3, omur: -1, boy: 0.95, renk: '#7a2cff', kare: 'parilti', hot: 0.2, a: 0.55 },
  lanetGoz: { p: _v3, omur: -1, boy: 0.6, renk: '#c48cff', kare: 'goz', normal: true, hot: 0.6 },
  lanetDuman: { p: _v4, v: _v2, omur: 0.8, boy: 0.27, boy2: 0.45, renk: '#4a2270', renk2: '#1a0a2a', kare: 'duman', normal: true, rot: 'r', a: 0.55, hot: 0 },
  kalkanY: { p: _v3, omur: 0.4, boy: 0.12, boy2: 0.02, renk: '#fff6d0', kare: 'yildiz4', rot: 'r', hot: 1 },
  davulSok: { p: _v3, mod: 1, omur: -1, boy: 1.15, renk: '#ff8a1f', kare: 'sok', normal: true, rot: 0, hot: 0.3, a: 0.7 },
  davulYor: { r: 0.4, w: 3, vy: 1 },
  davulKiv: { p: _v3, takip: null, yorunge: null, omur: 0.7, boy: 0.15, boy2: 0.03, renk: '#ff9a1f', kare: 'parilti', hot: 0.7 },
  hizKiv: { p: _v3, v: _v2, drag: 1.5, omur: 0.4, boy: 0.13, uz: 1.6, en: 0.5, renk: '#9fe4ff', renk2: '#2f6bff', kare: 'kivilcim', mod: 2, uzat: 0.25, hot: 0.7 },
  hizHalka: { p: _v3, mod: 1, omur: -1, boy: 1.05, renk: '#4f9bff', kare: 'halka', normal: true, hot: 0.3, a: 0.6 },
  ofkeDuman: { p: _v3, v: _v2, drag: 1.8, omur: 0.75, boy: 0.16, boy2: 0.42, renk: '#7a3020', renk2: '#2a1410', kare: 'duman', normal: true, rot: 'r', a: 0.55, hot: 0 },
  ofkeAlevK: { p: _v3, v: _v2, g: -0.8, omur: 0.32, boy: 0.3, boy2: 0.06, renk: '#e02a00', renk2: '#5a0800', kare: 'alev', normal: true, rot: 0, hot: 0, a: 0.85, fo: 0.45 },
  ofkeSok: { p: _v3, mod: 1, omur: -1, boy: 1.1, renk: '#ff3d2a', kare: 'sok', normal: true, rot: 0, hot: 0.3, a: 0.7 },
  ofkePar: { p: _v3, omur: -1, boy: 1.2, renk: '#ff2a10', kare: 'parilti', hot: 0.1, a: 0.3 },
  ofkeKiv: { p: _v3, v: _v2, omur: 0.5, boy: 0.07, uz: 2, en: 0.6, renk: '#ff6a2a', kare: 'kivilcim', mod: 2, uzat: 0.12, hot: 1 },
  ofkeAlev: { p: _v3, v: _v2, g: -0.8, omur: 0.3, boy: 0.24, boy2: 0.05, renk: '#ffd040', renk2: '#ff3a00', kare: 'alev', rot: 0, hot: 0.4, fo: 0.45 },
  ofkeKor: { p: _v3, omur: -1, boy: 0.3, renk: '#ff7a1a', kare: 'parilti', hot: 0.5, a: 0.85, on: 1 },
  hizRun: { p: _v3, mod: 1, omur: -1, boy: 1.2, renk: '#3d8bff', kare: 'run', rot: 0, hot: 0.4, a: 0.4 },
  hizIz: { p: _v3, mod: 1, omur: 0.55, boy: 0.22, boy2: 0.1, renk: '#bfefff', renk2: '#3d7bff', kare: 'yildiz4', rot: 0, hot: 0.9, a: 0.85, fi: 0, fo: 0.3 },
  lanetRun: { p: _v3, mod: 1, omur: -1, boy: 1.2, renk: '#7a2cff', kare: 'run_golge', normal: true, rot: 0, hot: 0.2, a: 0.55 },
  y3Halka: { p: _v3, mod: 1, omur: -1, boy: 1.15, renk: '#ffc83a', kare: 'halka', normal: true, hot: 0.4, a: 0.75 },
  y3Run: { p: _v3, mod: 1, omur: -1, boy: 1.2, renk: '#ffd76a', kare: 'run', rot: 0, hot: 0.4, a: 0.45 },
  y3Yildiz: { p: _v3, v: _v2, omur: 0.6, boy: 0.12, renk: '#ffe45a', kare: 'yildiz4', rot: 'r', hot: 0.8 },
};
const DURUM = {
  sersem(c, dt, t, p, h) { const y = p.y + h + 0.26; for (let i = 0; i < 3; i++) { const a = t * 4.5 + i * TAU / 3; _v3.set(p.x + Math.cos(a) * 0.4, y + Math.sin(a * 2) * 0.05, p.z + Math.sin(a) * 0.4);
      DP.sersemK2.rot = DP.sersemY.rot = t * 3 + i; P(DP.sersemK2); P(DP.sersemY); P(DP.sersemP);
      if (RND() < dt * 10 * OLCEK) P(DP.sersemK); } },
  buz(c, dt, t, p, h) { for (let i = 0; i < 5; i++) { const a = i * TAU / 5 + 0.4; _v3.set(p.x + Math.cos(a) * 0.32, Z() + 0.2, p.z + Math.sin(a) * 0.32); _v2.set(Math.cos(a) * 0.5, 1, Math.sin(a) * 0.5);
      DP.buzS.boy = 0.42 + (i % 2) * 0.1; P(DP.buzS); }
    _v3.set(p.x, Z() + 0.04, p.z); P(DP.buzKar);
    P(DP.buzPar);
    if (RND() < dt * 8 * OLCEK) { _v3.set(p.x + rr(-0.3, 0.3), p.y + rr(0.2, 0.9) * h, p.z + rr(-0.3, 0.3)); _v2.set(0, -0.2, 0); P(DP.buzTane); } },
  yanik(c, dt, t, p, h) { c.acc += dt * 30 * OLCEK; while (c.acc >= 1) { c.acc--; _v3.set(p.x + rr(-0.26, 0.26), p.y + rr(0.15, 0.8) * h, p.z + rr(-0.26, 0.26));
      if (RND() < 0.35) { const o = DP.yanikTaban; _v2.set(0, rr(0.9, 1.4), 0); o.omur = rr(0.3, 0.42); o.boy = rr(0.34, 0.44); o.rot = rr(-0.3, 0.3); P(o); }
      else if (RND() < 0.85) { const o = DP.yanikAlev; _v2.set(0, rr(0.9, 1.5), 0); o.omur = rr(0.35, 0.5); o.boy = rr(0.3, 0.42); o.rot = rr(-0.3, 0.3); P(o); }
      else { _v2.set(rr(-0.3, 0.3), rr(1, 2), rr(-0.3, 0.3)); P(DP.yanikKiv); } }
    _v3.set(p.x, p.y + 0.45 * h, p.z); DP.yanikPar.boy = 1.1 * h; DP.yanikPar.a = 0.35 + Math.sin(t * 17) * 0.08; P(DP.yanikPar); },
  zehir(c, dt, t, p, h) { c.acc += dt * 13 * OLCEK; while (c.acc >= 1) { c.acc--; _v3.set(p.x + rr(-0.3, 0.3), p.y + rr(0.3, 0.95) * h, p.z + rr(-0.3, 0.3));
      if (RND() < 0.75) { const o = DP.zehirKab; _v2.set(0, rr(0.3, 0.6), 0); o.omur = rr(0.5, 0.8); o.boy = rr(0.12, 0.2); o.boy2 = rr(0.2, 0.26); P(o); }
      else { _v2.set(0, -0.3, 0); P(DP.zehirDamla); } }
    c.kf = (c.kf || 0) + dt; if (c.kf > 1.3) { c.kf = 0; _v3.set(p.x, p.y + h + 0.25, p.z); _v2.set(0, 0.35, 0); P(DP.zehirKafa); }
    _v3.set(p.x, Z() + 0.04, p.z); DP.zehirDuman.rot = t * 0.3; P(DP.zehirDuman); },
  lanet(c, dt, t, p, h) { _v3.set(p.x, p.y + h + 0.38 + Math.sin(t * 3) * 0.05, p.z); const n = 1 + Math.sin(t * 6) * 0.08;
    DP.lanetPar.boy = 0.95 * n; P(DP.lanetPar); DP.lanetGoz.boy = 0.6 * n; P(DP.lanetGoz);
    c.acc += dt * 8 * OLCEK; while (c.acc >= 1) { c.acc--; _v4.set(p.x + rr(-0.3, 0.3), p.y + rr(0.1, 0.6) * h, p.z + rr(-0.3, 0.3)); const o = DP.lanetDuman; _v2.set(0, rr(0.3, 0.6), 0); o.omur = rr(0.7, 1); o.boy = rr(0.22, 0.32); P(o); }
    _v3.set(p.x, Z() + 0.045, p.z); DP.lanetRun.rot = -t * 0.6; DP.lanetRun.boy = 1.0 + 0.2 * h; P(DP.lanetRun); },
  // kalkan: birimi saran ince kabuk (gövdeye göre elips: yatayda gövde yarıçapı, dikeyde boy), içi neredeyse saydam, kenarı parlar
  kalkan(c, dt, t, p, h) {
    const m = c.mesh; if (!m) return; c.yas += dt; m.position.set(p.x, p.y + h * 0.5, p.z);
    const pop = c.kapan >= 0 ? Math.max(0, 1 - c.kapan / 0.2) : Math.min(1, c.yas / 0.12);
    const k = c.kapan >= 0 ? 1 + (1 - pop) * 0.25 : (1.22 - 0.22 * cikisK(Math.min(1, c.yas / 0.18)));
    const yr = (c.nesne && c.nesne.userData.yaricap) || h * 0.3, rx = Math.max(h * 0.28, Math.min(h * 0.52, yr * 1.05)) * 2, ry = h * 1.0;
    m.scale.set(rx * k, ry * k, rx * k);
    m.material.uniforms.uA.value = 0.8 * pop + (c.kapan >= 0 ? 0 : 0.2 * Math.max(0, 1 - c.yas / 0.3)); m.material.uniforms.uT.value = t;
    if (RND() < dt * 2 * OLCEK) { kureY(_v2, 0.2).multiplyScalar(rx * 0.5); _v3.set(p.x, p.y + h * 0.5, p.z).add(_v2); P(DP.kalkanY); } },
  davul(c, dt, t, p, h) { _v3.set(p.x, Z() + 0.05, p.z); const s = DP.davulSok; s.boy = 1.15 + Math.sin(t * 8) * 0.08; s.rot = t; P(s);
    c.acc += dt * 14 * OLCEK; while (c.acc >= 1) { c.acc--; _v3.set(0, rr(0, 0.2) * h, 0); const y = DP.davulYor, o = DP.davulKiv; y.r = rr(0.32, 0.45); y.w = rr(2.5, 4); y.vy = rr(0.6, 1.2) * h;
      o.takip = c.nesne; o.yorunge = y; o.omur = rr(0.6, 0.9); o.boy = rr(0.12, 0.18); o.kare = RND() < 0.4 ? 'yildiz4' : 'parilti'; P(o); o.takip = null; } },
  hiz(c, dt, t, p, h) { c.acc += dt * 14 * OLCEK; while (c.acc >= 1) { c.acc--; const a = RND() * TAU; _v3.set(p.x + Math.cos(a) * 0.34, p.y + rr(0, 0.5) * h, p.z + Math.sin(a) * 0.34);
      _v2.set(0, rr(1.5, 2.5), 0); DP.hizKiv.omur = rr(0.3, 0.45); P(DP.hizKiv); }
    _v3.set(p.x, Z() + 0.05, p.z); P(DP.hizHalka); DP.hizRun.rot = t * 2.2; DP.hizRun.boy = 1.0 + 0.25 * h; P(DP.hizRun);
    if (RND() < dt * 9 * OLCEK) { const a = RND() * TAU; _v3.set(p.x + Math.cos(a) * 0.25, Z() + 0.05, p.z + Math.sin(a) * 0.25); DP.hizIz.rot = RND() * TAU; P(DP.hizIz); } },
  ofke(c, dt, t, p, h) { c.acc += dt * 4 * OLCEK; while (c.acc >= 1) { c.acc--; _v3.set(p.x + rr(-0.15, 0.15), p.y + h * 0.85, p.z + rr(-0.15, 0.15));
      _v2.set(rr(-0.3, 0.3), rr(0.8, 1.3), rr(-0.3, 0.3)); DP.ofkeDuman.omur = rr(0.6, 0.9); P(DP.ofkeDuman); }
    _v3.set(p.x, Z() + 0.05, p.z); DP.ofkeSok.boy = 1.1 + Math.sin(t * 10) * 0.06; DP.ofkeSok.rot = -t; P(DP.ofkeSok);
    _v3.set(p.x, p.y + 0.5 * h, p.z); DP.ofkePar.boy = 1.2 * h; DP.ofkePar.a = 0.15 + Math.sin(t * 12) * 0.05; P(DP.ofkePar);
    if (RND() < dt * 10 * OLCEK) { _v3.set(p.x + rr(-0.3, 0.3), p.y + rr(0.1, 0.6) * h, p.z + rr(-0.3, 0.3)); _v2.set(0, rr(1, 2), 0); P(DP.ofkeKiv); }
    if (c.kemik && c.kemik.parent && c.nesne) {
      // boynuz kıvrımları baş kemiğinin yerel uzayında (koç modelinden ölçüldü: iki kıvrımın orta-üstü). Alev kökü boynuza yapışık,
      // diller yukarı yükselir (arkadan bakan oyun kamerasında da başın üstünden görünür); kökte koyu kızıl, içte sarı-turuncu
      for (let j = 0; j < 2; j++) { c.kemik.localToWorld(_v4.copy(BOYNUZ[j])); _v3.copy(_v4); DP.ofkeKor.boy = (0.34 + 0.06 * Math.sin(t * 17 + j * 2)) * h; P(DP.ofkeKor); }
      c.al = (c.al || 0) + dt * 56 * OLCEK; while (c.al >= 1) { c.al--; c.kemik.localToWorld(_v4.copy(BOYNUZ[RND() < 0.5 ? 0 : 1]));
        _v3.set(_v4.x + rr(-0.04, 0.04), _v4.y + rr(0, 0.04), _v4.z + rr(-0.04, 0.04)); _v2.set(rr(-0.12, 0.12), rr(1.1, 1.7), rr(-0.12, 0.12));
        const rt = rr(-0.3, 0.3), om = rr(0.24, 0.36);
        if (RND() < 0.45) { const o = DP.ofkeAlevK; o.omur = om; o.boy = rr(0.4, 0.52) * h; o.rot = rt; P(o); }
        else { const o = DP.ofkeAlev; o.omur = om; o.boy = rr(0.34, 0.46) * h; o.rot = rt; P(o); } } } },
  // Buz Nefesi dondurması: gövdeyi saran yarı saydam kristal kabuk (dikey kristaller + soluk buz pusu); kapanırken kırılır
  donKabuk(c, dt, t, p, h) { c.yas += dt; const g = Math.min(1, c.yas / 0.12);
    const nk = kristalH ? 3 : 7;
    for (let i = 0; i < nk; i++) { const a = i * TAU / nk + 0.35, r = (0.24 + (i % 2) * 0.06) * Math.max(0.8, h); _v3.set(p.x + Math.cos(a) * r, Z() + (0.32 + (i % 3) * 0.22) * h, p.z + Math.sin(a) * r);
      _v2.set(Math.cos(a) * 0.3, 1, Math.sin(a) * 0.3); DP.donS.boy = (0.45 + (i % 3) * 0.12) * h * g; P(DP.donS); }
    _v3.set(p.x, p.y + 0.5 * h, p.z); DP.donPar.boy = 1.25 * h * g; DP.donPar.a = 0.32 + Math.sin(t * 5) * 0.04; P(DP.donPar);
    _v3.set(p.x, p.y + 0.6 * h, p.z); DP.donCek.boy = 0.8 * h * g; DP.donCek.rot = t * 0.4; P(DP.donCek);
    if (RND() < dt * 6 * OLCEK) { _v3.set(p.x + rr(-0.3, 0.3), p.y + rr(0.2, 1.0) * h, p.z + rr(-0.3, 0.3)); _v2.set(0, -0.2, 0); P(DP.buzTane); } },
  yildiz3(c, dt, t, p, h) { // ★3: ayak altında altın parıltı halkası
    _v3.set(p.x, Z() + 0.035, p.z); P(DP.y3Halka); DP.y3Run.rot = t * 0.5; P(DP.y3Run);
    if (RND() < dt * 6 * OLCEK) { const a = RND() * TAU; _v3.set(p.x + Math.cos(a) * 0.5, Z() + 0.1, p.z + Math.sin(a) * 0.5); _v2.set(0, 0.6, 0); P(DP.y3Yildiz); } },
};

// ───────────────────────── dışa açık API ─────────────────────────
function kur(sahne_, kamera_, o = {}) {
  if (sahne) birak();
  sahne = sahne_; kamera = kamera_; kalite = o.kalite === 'hafif' ? 'hafif' : 'yuksek'; OLCEK = kalite === 'hafif' ? 0.55 : 1; zeminY = o.zeminY || 0;
  atlas = atlasUret(kalite === 'hafif' ? 128 : 224);
  const maxAdd = kalite === 'hafif' ? 560 : 1100, maxNrm = kalite === 'hafif' ? 220 : 450; // toplam ≈1550 / ≈780
  sNrm = new Sistem(maxNrm, THREE.NormalBlending, 30, atlas.tex, 1.0);
  sAdd = new Sistem(maxAdd, THREE.AdditiveBlending, 31, atlas.tex, kalite === 'hafif' ? 1.1 : 1.6);   // yüksekte çekirdekler HDR → yalnız onlar bloom alır
  sahne.add(sNrm.mesh); sahne.add(sAdd.mesh);
  // kaya havuzu (paylaşımlı geometri + malzeme)
  // kaya: gürültüyle bozulmuş yumuşak gölgeli taş; köşe renkleri açık/koyu kahve lekeler + üstte yosun (el boyaması yaratıklarla uyumlu)
  const kg = new THREE.DodecahedronGeometry(0.17, 1); { const pa = kg.attributes.position, R2 = mulberry(7), renk = new Float32Array(pa.count * 3), tmp = new THREE.Vector3(), ana = new Map();
    for (let i = 0; i < pa.count; i++) { tmp.fromBufferAttribute(pa, i); const key = tmp.x.toFixed(3) + ',' + tmp.y.toFixed(3) + ',' + tmp.z.toFixed(3); let d = ana.get(key); if (d === undefined) { d = (R2() - 0.5) * 0.05; ana.set(key, d); }
      const L = tmp.length(); tmp.multiplyScalar((L + d) / L); pa.setXYZ(i, tmp.x, tmp.y, tmp.z);
      const lek = Math.sin(tmp.x * 40) * Math.sin(tmp.z * 37) * 0.5 + 0.5, yosun = THREE.MathUtils.smoothstep(tmp.y, 0.07, 0.13);
      const c = karis(karis('#6a4a34', '#b08a62', lek), '#7a9a3a', yosun); renk.set(c, i * 3); }
    kg.setAttribute('color', new THREE.BufferAttribute(renk, 3)); kg.computeVertexNormals(); }
  const km = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 });
  const kristal = new THREE.MeshStandardMaterial({ color: '#ffcf8a', emissive: '#ff9a3a', emissiveIntensity: 1.2 }), kgk = new THREE.OctahedronGeometry(0.06, 0);
  for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(kg, km); const kk = new THREE.Mesh(kgk, kristal.clone()); kk.position.set(0.1, 0.08, 0.06); m.add(kk); m.visible = false; m.castShadow = kalite !== 'hafif'; m.name = 'vfx_kaya'; sahne.add(m); kayaHavuz.push(m); }
  // kalkan kabarcıkları (paylaşımlı küre; havuz başına bir kez malzeme)
  const kureG = new THREE.SphereGeometry(0.5, kalite === 'hafif' ? 18 : 28, kalite === 'hafif' ? 12 : 18);
  for (let i = 0; i < 12; i++) {
    const mat = new THREE.ShaderMaterial({ uniforms: { uA: { value: 0 }, uT: { value: 0 }, uR: { value: new THREE.Vector3(...rgb('#ffe9a8')) } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      // elips ölçekte doğru normal: köşegen ölçek için normal / ölçek² (bu ağlar döndürülmez)
      vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vec3 sc = vec3(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz), length(modelMatrix[2].xyz));
        vN = normalize(mat3(modelMatrix) * (normal / max(sc * sc, vec3(1e-4)))); vV = normalize(cameraPosition - w.xyz); vP = position; gl_Position = projectionMatrix * viewMatrix * w; }`,
      // ince kabuk: iç yüzey neredeyse saydam, kenar (fresnel) dar ve parlak; altıgen desen yalnız kenara yakın, çok hafif
      fragmentShader: `uniform float uA; uniform float uT; uniform vec3 uR; varying vec3 vN; varying vec3 vV; varying vec3 vP;
        void main(){ float f = pow(1.0 - abs(dot(normalize(vN), vV)), 3.2); float bant = smoothstep(0.88, 1.0, sin(vP.y * 22.0 - uT * 4.0) * 0.5 + 0.5);
          float alt = smoothstep(-0.5, -0.2, vP.y);
          vec2 hq = vec2(atan(vP.z, vP.x) * 1.9, vP.y * 7.0); vec2 hr = vec2(1.0, 1.732); vec2 ha = mod(hq, hr) - hr * 0.5, hb = mod(hq - hr * 0.5, hr) - hr * 0.5;
          vec2 hg = dot(ha, ha) < dot(hb, hb) ? ha : hb; float hk = max(abs(hg.x) * 0.866 + abs(hg.y) * 0.5, abs(hg.y)); float hex = smoothstep(0.42, 0.47, hk);
          float a = uA * (0.008 + f * 0.75 + bant * 0.08 * f + hex * (0.025 + 0.12 * f)) * alt; gl_FragColor = vec4(mix(uR, vec3(1.0), f * 0.7), a); }` });
    const m = new THREE.Mesh(kureG, mat); m.visible = false; m.renderOrder = 32; m.name = 'vfx_kalkan'; sahne.add(m); kalkanHavuz.push(m);
  }
  yetenekNesneKur(kg, km);
  if (kalite === 'yuksek' && o.isik !== false) { isik = new THREE.PointLight('#ffd08a', 0, 5.5, 1.6); isik.position.set(0, -50, 0); sahne.add(isik); }
  return vfx;
}
// 3B yetenek nesneleri: kırık havuzları (kaya: aynı taş ağı ve malzeme; buz), buz kristalleri, gölge oku, hortum, savaş davulu.
// Hepsi bir kez ayrılır; ilk karede ekranın altında bir kez çizilir (gölgelendirici o an derlenir, yetenek sırasında takılma olmasın)
function yetenekNesneKur(kg, km) {
  const hafifK = kalite === 'hafif';
  parcaKaya = new ParcaHavuz(kg, km, hafifK ? 16 : 28, KAYA_R, !hafifK); sahne.add(parcaKaya.m);
  const buzMat = new THREE.MeshStandardMaterial({ color: '#d4f1ff', emissive: '#2f7fd8', emissiveIntensity: 0.45, roughness: 0.14, metalness: 0.05, transparent: true, opacity: 0.88, flatShading: true });
  // kenar (fresnel) ışıması: buz yüzeyleri kenarda beyaz-mavi parlar
  buzMat.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(0.6, 0.88, 1.0) * pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.2) * 1.3;'); };
  buzMat.customProgramCacheKey = () => 'vfxBuz1';
  parcaBuz = new ParcaHavuz(new THREE.OctahedronGeometry(0.1, 0), buzMat, hafifK ? 20 : 36, 0.1, false); sahne.add(parcaBuz.m);
  const ka = new THREE.CylinderGeometry(0.72, 1, 1.25, 6, 1); ka.translate(0, 0.625, 0);
  const kb = new THREE.ConeGeometry(0.72, 0.75, 6, 1); kb.translate(0, 1.625, 0);
  kristalH = new KristalHavuz(mergeGeometries([ka, kb]), buzMat, hafifK ? 28 : 48); sahne.add(kristalH.m);
  // gölge oku: gövde (+Z boyunca), parlak uç, çapraz tüyler
  const okGovdeG = new THREE.CylinderGeometry(0.02, 0.02, 0.64, 6).rotateX(Math.PI / 2), okUcG = new THREE.ConeGeometry(0.06, 0.2, 6).rotateX(Math.PI / 2).translate(0, 0, 0.41);
  const tuyA = new THREE.PlaneGeometry(0.11, 0.17).rotateX(Math.PI / 2).translate(0, 0, -0.27), tuyB = tuyA.clone().rotateZ(Math.PI / 2);
  const okGovdeM = new THREE.MeshBasicMaterial({ color: '#2a1240' }), okUcM = new THREE.MeshBasicMaterial({ color: '#f2e2ff' }), okTuyM = new THREE.MeshBasicMaterial({ color: '#a46cff', side: THREE.DoubleSide });
  const okTuyG = mergeGeometries([tuyA, tuyB]);
  for (let i = 0; i < 2; i++) { const g = new THREE.Group(); g.add(new THREE.Mesh(okGovdeG, okGovdeM), new THREE.Mesh(okUcG, okUcM), new THREE.Mesh(okTuyG, okTuyM)); g.name = 'vfx_ok'; sahne.add(g); okHavuz.push(g); }
  // hortum: yukarı genişleyen açık koni (taban orijinde, 1,9 boy)
  const hG = new THREE.CylinderGeometry(0.62, 0.1, 1.9, hafifK ? 14 : 22, 6, true); hG.translate(0, 0.95, 0);
  for (let i = 0; i < 2; i++) {
    const mat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uA: { value: 0 }, uRenk: { value: new THREE.Vector3(...rgb('#f4fffb')) }, uRenk2: { value: new THREE.Vector3(...rgb('#1f8f7a')) } },
      vertexShader: HORTUM_VS, fragmentShader: HORTUM_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false });
    const m = new THREE.Mesh(hG, mat); m.renderOrder = 29; m.name = 'vfx_hortum'; m.frustumCulled = false; sahne.add(m); hortumHavuz.push(m);
  }
  // savaş davulu: ahşap gövde, deri (vuruşta turuncu parlar), iki altın çember
  const dGovde = new THREE.CylinderGeometry(0.2, 0.18, 0.2, 18, 1, true), dDeri = new THREE.CircleGeometry(0.2, 18).rotateX(-Math.PI / 2).translate(0, 0.1, 0);
  const dC1 = new THREE.TorusGeometry(0.2, 0.024, 6, 22).rotateX(Math.PI / 2).translate(0, 0.1, 0), dC2 = new THREE.TorusGeometry(0.18, 0.02, 6, 22).rotateX(Math.PI / 2).translate(0, -0.1, 0);
  const dGovdeM = new THREE.MeshStandardMaterial({ color: '#9a4a1e', roughness: 0.6, side: THREE.DoubleSide }), dCemberM = new THREE.MeshStandardMaterial({ color: '#e3b040', roughness: 0.35, metalness: 0.5 });
  const dCG = mergeGeometries([dC1, dC2]);
  for (let i = 0; i < 2; i++) { const g = new THREE.Group(), deri = new THREE.Mesh(dDeri, new THREE.MeshStandardMaterial({ color: '#f3e2bf', emissive: '#ff8a2e', emissiveIntensity: 0, roughness: 0.7 }));
    g.add(new THREE.Mesh(dGovde, dGovdeM), deri, new THREE.Mesh(dCG, dCemberM)); g.userData.deri = deri; g.name = 'vfx_davul'; sahne.add(g); davulHavuz.push(g); }
  // can kalbi: kabarık 3B kalp (kızıl, ışıyan); ön yüzü +Z (kameraya döndürülür)
  const ks = new THREE.Shape(); ks.moveTo(0, -0.45); ks.bezierCurveTo(-0.1, -0.33, -0.5, -0.08, -0.5, 0.17); ks.bezierCurveTo(-0.5, 0.4, -0.32, 0.52, -0.2, 0.5);
  ks.bezierCurveTo(-0.08, 0.5, 0, 0.4, 0, 0.3); ks.bezierCurveTo(0, 0.4, 0.08, 0.5, 0.2, 0.5); ks.bezierCurveTo(0.32, 0.52, 0.5, 0.4, 0.5, 0.17); ks.bezierCurveTo(0.5, -0.08, 0.1, -0.33, 0, -0.45);
  const kalpG = new THREE.ExtrudeGeometry(ks, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.1, bevelSegments: hafifK ? 2 : 4, curveSegments: hafifK ? 6 : 10 }); kalpG.center();
  const kalpM = new THREE.MeshStandardMaterial({ color: '#ff2448', emissive: '#d0103a', emissiveIntensity: 0.85, roughness: 0.28, metalness: 0.05 });
  for (let i = 0; i < 2; i++) { const m = new THREE.Mesh(kalpG, kalpM); m.name = 'vfx_kalp'; m.renderOrder = 33; sahne.add(m); kalpHavuz.push(m); }
  // zümrüt: kesme taş (yassı sekizyüzlü, düz gölgeli, iç ışıklı yeşil)
  const zG = new THREE.OctahedronGeometry(0.5, 0); zG.scale(1, 1.35, 1);
  const zM = new THREE.MeshStandardMaterial({ color: '#2fe060', emissive: '#18a83a', emissiveIntensity: 0.9, roughness: 0.12, metalness: 0.2, flatShading: true });
  zM.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(0.75, 1.0, 0.6) * pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.5) * 1.4;'); };
  zM.customProgramCacheKey = () => 'vfxZumrut1';
  for (let i = 0; i < 2; i++) { const m = new THREE.Mesh(zG, zM); m.name = 'vfx_zumrut'; sahne.add(m); zumrutHavuz.push(m); }
  // kara diken (Kara Gölge yolu) ve gölge pençesi tırnakları: kavisli koni; koyu mor, kenarı mor ışır
  const dikenMat = new THREE.MeshStandardMaterial({ color: '#12061f', emissive: '#2a0a52', emissiveIntensity: 0.4, roughness: 0.4, metalness: 0.1, flatShading: true });
  dikenMat.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(0.55, 0.22, 1.0) * pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.6) * 0.95;'); };
  dikenMat.customProgramCacheKey = () => 'vfxDiken1';
  const dG = new THREE.ConeGeometry(0.5, 2, 5, 3); dG.translate(0, 1, 0);
  { const pa = dG.attributes.position; for (let i = 0; i < pa.count; i++) { const y = pa.getY(i) / 2; pa.setX(i, pa.getX(i) + 0.35 * y * y); } dG.computeVertexNormals(); }   // uca doğru kıvrılır
  dikenH = new KristalHavuz(dG, dikenMat, hafifK ? 24 : 40); dikenH.m.name = 'vfx_diken'; sahne.add(dikenH.m);
  // gölge pençesi: beş kavisli tırnak bir avuç gibi dizili (+Z öne); hedefin arkasından yükselip üstüne kapanır
  const tG = new THREE.ConeGeometry(0.15, 1, 6, 6); tG.translate(0, 0.5, 0);
  { const pa = tG.attributes.position; for (let i = 0; i < pa.count; i++) { const y = pa.getY(i); pa.setZ(i, pa.getZ(i) + 0.42 * y * y); } tG.computeVertexNormals(); }
  for (let i = 0; i < 1; i++) { const g = new THREE.Group(); for (let j = 0; j < 5; j++) { const t = new THREE.Mesh(tG, dikenMat), a = (j - 2) * 0.42;
      t.position.set(Math.sin(a) * 0.32, 0, -Math.cos(a) * 0.1); t.rotation.set(0, a * 0.6, -a * 0.35); t.scale.set(1, j === 2 ? 1.15 : (j === 0 || j === 4 ? 0.8 : 1), 1); g.add(t); }
    g.name = 'vfx_pence'; sahne.add(g); penceHavuz.push(g); }
  for (const g of [...okHavuz, ...davulHavuz]) g.traverse(m => { if (m.isMesh) m.castShadow = !hafifK; });
  // ısıtma: ilk karede ekranın altında görünür (gölgelendirici derlenir), sonra gizlenir
  for (const m of [...okHavuz, ...hortumHavuz, ...davulHavuz, ...kayaHavuz, ...kalpHavuz, ...zumrutHavuz, ...penceHavuz]) { m.visible = true; m.position.set(0, -60, 0); isitma.push(m); }
  for (const m of kalkanHavuz) { m.visible = true; m.position.set(0, -60, 0); isitma.push(m); }
  // örnekli ağlar: ilk karelerde görünmeyecek kadar küçük birer örnek (örnekleme gölgelendiricisi de önceden derlensin)
  _v3.set(0, -60, 0); _v2.set(0, 0, 0);
  parcaKaya.ekle(_v3, _v2, 0.001, 0.08, { g: 0 }); parcaBuz.ekle(_v3, _v2, 0.001, 0.08, { g: 0 }); kristalH.ekle(_v3, _v2.set(0, 1, 0), 0.001, 0.001, { omur: 0.08, kir: false });
  dikenH.ekle(_v3, _v2.set(0, 1, 0), 0.001, 0.001, { omur: 0.08, kir: false });
}
function birak() {
  if (!sahne) return;
  for (const s of [sAdd, sNrm]) if (s) { sahne.remove(s.mesh); s.g.dispose(); s.mat.dispose(); }
  for (const m of kayaHavuz) sahne.remove(m); for (const m of kalkanHavuz) { sahne.remove(m); m.material.dispose(); }
  for (const h of [parcaKaya, parcaBuz, kristalH, dikenH]) if (h) sahne.remove(h.m);
  for (const m of [...okHavuz, ...hortumHavuz, ...davulHavuz, ...kalpHavuz, ...zumrutHavuz, ...penceHavuz]) sahne.remove(m);
  parcaKaya = parcaBuz = kristalH = dikenH = null; okHavuz.length = hortumHavuz.length = davulHavuz.length = kalpHavuz.length = zumrutHavuz.length = penceHavuz.length = isitma.length = 0; kayaElde.clear(); davulElde.clear();
  if (isik) sahne.remove(isik); if (atlas) atlas.tex.dispose();
  kayaHavuz.length = 0; kalkanHavuz.length = 0; isik = null; isler = []; durumlar.clear(); takipOn.clear(); sahne = null;
}
function guncelle(dt) {
  if (!sahne) return;
  dt = Math.max(0, Math.min(0.1, dt || 0)); kareNo++; odakN = 0;
  kutKisma = simdi() - kutBas < 1.2 ? 0.5 : 1;
  // 1) yaşlandır / öldür
  sAdd.guncelle(dt); sNrm.guncelle(dt);
  // 2) zamanlanmış işler (yeni parçacık doğurur)
  const liste = isler; isler = islerYedek; islerYedek = liste;
  for (let j = 0; j < liste.length; j++) {
    const is = liste[j];
    if (is.g > 0) { is.g -= dt; if (is.g > 0) { isler.push(is); continue; } }
    if (is.tek) { is.fn(); continue; }
    if (!is.acik) continue;
    is.yas += dt; const k = Math.min(1, is.yas / is.s); is.fn(k, dt, is.yas, is); if (k < 1) isler.push(is);
  }
  liste.length = 0;
  // 3) durum efektleri (ekran dışındaki birimin sürekli efekti parçacık üretmez; kalkan kabarcığı yine izler)
  durumT = performance.now() / 1000; durumDt = dt;
  if (kamera) { _gorM.multiplyMatrices(kamera.projectionMatrix, kamera.matrixWorldInverse); _gorF.setFromProjectionMatrix(_gorM); }
  durumlar.forEach(durumNesne);
  // 4) ışık
  if (isik) { isikYas += dt; isik.intensity = isikGuc * Math.max(0, 1 - isikYas / isikSure) ** 2; }
  // 3B yetenek nesneleri: kırıklar, kristaller, hortum saati; ısıtma nesneleri ilk iki kareden sonra gizlenir
  if (isitma.length && kareNo > 2) { for (const m of isitma) m.visible = false; isitma.length = 0; }
  parcaKaya.guncelle(dt); parcaBuz.guncelle(dt); kristalH.guncelle(dt); dikenH.guncelle(dt);
  hortumT += dt; for (const m of hortumHavuz) if (m.visible) m.material.uniforms.uT.value = hortumT;
  // 5) GPU'ya yaz
  sAdd.yaz(takipPoz); sNrm.yaz(takipPoz);
}
// durum döngüsü: Map.forEach ile, geri çağrılar modül düzeyinde (kare başına kapanış ya da [anahtar, değer] dizisi üretilmez)
let durumT = 0, durumDt = 0, durumP = null, durumH = 1, durumGor = false, durumHarita = null;
const _gorM = new THREE.Matrix4(), _gorF = new THREE.Frustum(), _gorK = new THREE.Sphere();
function durumNesne(harita, nesne) {
  durumP = takipPoz(nesne); durumH = boyAl(nesne); durumHarita = harita;
  durumGor = nesne.visible !== false && !!nesne.parent;
  if (durumGor && kamera) { _gorK.center.copy(durumP); _gorK.center.y += durumH * 0.5; _gorK.radius = durumH + 0.8; durumGor = _gorF.intersectsSphere(_gorK); }
  harita.forEach(durumTur);
  if (!harita.size) durumlar.delete(nesne);
}
function durumTur(c, tur) {
  const dt = durumDt, t = durumT, p = durumP, h = durumH;
  if (c.kapan >= 0) { c.kapan += dt; if (tur === 'kalkan') DURUM.kalkan(c, dt, t, p, h); if (c.kapan > 0.2 || tur !== 'kalkan') { if (c.mesh) { c.mesh.visible = false; c.mesh.userData.dolu = false; } durumHarita.delete(tur); } return; }
  if ((durumGor || tur === 'kalkan') && DURUM[tur]) { ONCELIK = 0; ALFA_KAT = tur === 'sersem' || tur === 'yanik' || tur === 'ofke' ? 1 : DURUM_ALFA; DURUM[tur](c, dt, t, p, h); ALFA_KAT = 1; ONCELIK = 1; }
}
function sars(g) { sarsGuc = Math.min(0.35, Math.max(sarsGuc * Math.exp(-(simdi() - sarsT) * 9), 0) + g); sarsT = simdi(); }
const _sars = new THREE.Vector3();
function sarsintiOfset() { const e = sarsGuc * Math.exp(-(simdi() - sarsT) * 9); if (e < 0.002) return _sars.set(0, 0, 0); const t = simdi() * 60; return _sars.set(Math.sin(t * 1.3) * e, Math.sin(t * 1.7 + 1) * e * 0.6, Math.cos(t * 1.1) * e * 0.5); }
let flasCss = '255,255,255';
let flasOrta = '164,108,255';
// orta: vinyetin iç halkasının rengi (verilmezse Kut'un moru)
function ekranFlas(renk = '#ffe6a0', guc = 0.5, sure = 0.35, orta = null) { flasRenk = rgb(renk); flasCss = flasRenk.map(v => Math.round(v * 255)).join(','); flasOrta = orta ? rgb(orta).map(v => Math.round(v * 255)).join(',') : '164,108,255'; flasGuc = guc; flasBas = simdi(); flasSure = sure; }
function ekranCiz(ctx, w, h) {
  const t = simdi();
  // Kut anı: sahneyi kahraman dışında karart (spot ışığı), 0,25 sn'de patlama ile ışınsal hız çizgileri
  const kt = t - kutBas;
  if (kt >= 0 && kt < 1.25) {
    let sx = w / 2, sy = h / 2; if (kamera) { const v = _v3.copy(kutP).project(kamera); sx = (v.x + 1) / 2 * w; sy = (1 - v.y) / 2 * h; }
    const env = kt < 0.25 ? kt / 0.25 : kt < 0.85 ? 1 : Math.max(0, 1 - (kt - 0.85) / 0.4);
    const R = Math.min(w, h) * 0.17;
    ctx.save(); const g = ctx.createRadialGradient(sx, sy, R * 0.55, sx, sy, Math.max(w, h) * 0.75);
    g.addColorStop(0, 'rgba(18,6,36,0)'); g.addColorStop(0.18, `rgba(18,6,36,${0.42 * env})`); g.addColorStop(1, `rgba(12,4,26,${0.62 * env})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    if (kt >= 0.22 && kt < 0.75) {
      const e = (kt - 0.22) / 0.53, al = 0.38 * (e < 0.15 ? e / 0.15 : 1 - (e - 0.15) / 0.85), L = Math.max(w, h);
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(164,108,255,${al})`;
      for (let i = 0; i < 24; i++) { const a = i / 24 * TAU + kt * 0.4 + (i % 3) * 0.07, r0 = R * (1.1 + (i % 4) * 0.25) + e * R * 1.5, gen = 0.012 + (i % 2) * 0.008;
        ctx.beginPath(); ctx.moveTo(sx + Math.cos(a) * r0, sy + Math.sin(a) * r0); ctx.lineTo(sx + Math.cos(a - gen) * L, sy + Math.sin(a - gen) * L); ctx.lineTo(sx + Math.cos(a + gen) * L, sy + Math.sin(a + gen) * L); ctx.closePath(); ctx.fill(); }
    }
    ctx.restore();
  }
  // ekran parlaması: ortası şeffaf, yalnız kenarlarda renkli vinyet (sahne beyaza boğulmaz)
  const k = (t - flasBas) / flasSure; if (k >= 1 || flasGuc <= 0) return; const a = flasGuc * (1 - k) * (1 - k);
  const c = flasCss;
  ctx.save(); const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.72);
  g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(0.6, `rgba(${flasOrta},${a * 0.6})`); g.addColorStop(1, `rgba(${c},${Math.min(0.35, a * 1.4)})`); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); ctx.restore();
}
function durak(sure = 0.06, olcek = 0.05) { durakBitis = Math.max(durakBitis, simdi() + sure); durakOlcek = Math.min(olcek, simdi() < durakBitis ? durakOlcek : 1); }
function zamanOlcek() { if (simdi() < durakBitis) return durakOlcek; durakOlcek = 1; return 1; }

// birim girdisini normalleştir: Vector3 | Object3D | {p|pos, o|nesne, h|boy}
function birim(x) {
  if (!x) return null;
  if (x.isObject3D) return { o: x, p: x.getWorldPosition(new THREE.Vector3()), h: boyAl(x) };
  if (x.isVector3) return { o: null, p: x.clone(), h: 1 };
  const o = x.o || x.nesne || null, p = x.p || x.pos ? (x.p || x.pos).clone() : (o ? o.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3(x.x || 0, x.y || 0, x.z || 0));
  return { o, p, h: x.h || x.boy || (o ? boyAl(o) : 1) };
}

export const vfx = {
  kur, birak, guncelle,
  // ── hazır efektler ──
  vurus(pos, o = {}) { if (!sahne) return; return vurus(pos, o); },
  mermi(bas, son, sure, o = {}) { if (!sahne) return; return mermi(bas, son, sure, o); },
  yetenek(ad, kaynak, hedefler = [], o = {}) {
    if (!sahne || !YETENEK[ad]) return { sure: 0 };
    const k = birim(kaynak) || { p: new THREE.Vector3(), h: 1 }, hs = (hedefler || []).map(birim).filter(Boolean);
    const op = { ...o, guc: (o.guc || 1) * (o.kut ? 1.35 : 1), dostlar: (o.dostlar || []).map(birim).filter(Boolean), ucus: (ON_SURE[ad] || 0) + (GEC[ad] || 0) };
    YETENEK[ad](k, hs, op);
    return { sure: ON_SURE[ad] || 0 };
  },
  onSure(ad) { return ON_SURE[ad] || 0; },
  // etkinin görsel varışı motorun etki anından kaç sn sonra (o: { tip: 'hasar'|'iyi'|'kalkan'|'durum', sira, mesafe }); sahne3d erteler
  gecikme(ad, o) { return gecikme(ad, o); },
  // güçlendirilmiş birimin vuruşunda küçük ek: 'hiz' (Uluma: mavi hız kıvılcımları) · 'davul' (Savaş Davulu: turuncu kor ve nota)
  buffVurus(pos, tur) {
    if (!sahne) return; const p = konum(pos, new THREE.Vector3()), onceki = ONCELIK; ONCELIK = 1;
    if (tur === 'hiz') { for (let i = 0, n = N(5); i < n; i++) { kureY(_v2, 0.3).multiplyScalar(rr(2, 3.5)); P({ p, v: _v2, drag: 4, omur: rr(0.15, 0.25), boy: 0.1, uz: 2.2, en: 0.5, renk: '#e9fbff', renk2: '#3d8bff', kare: 'kivilcim', mod: 2, uzat: 0.12, hot: 1 }); }
      P({ p, omur: 0.2, boy: 0.15, boy2: 0.6, renk: '#6fc8ff', kare: 'halka', hot: 0.8, a: 0.8, fi: 0, fo: 0.3 }); }
    else if (tur === 'davul') { for (let i = 0, n = N(5); i < n; i++) { kureY(_v2, 0.6).multiplyScalar(rr(0.8, 1.6)); P({ p, v: _v2, g: -1, drag: 2, omur: rr(0.3, 0.5), boy: rr(0.18, 0.26), boy2: 0.05, renk: '#ffd36a', renk2: '#ff5a1f', kare: 'alev', hot: 0.6 }); }
      P({ p, omur: 0.22, boy: 0.15, boy2: 0.7, renk: '#ff9a2e', kare: 'halka', hot: 0.7, a: 0.8, fi: 0, fo: 0.3 }); }
    ONCELIK = onceki;
  },
  // yetenek ön uyarısı (yetenekBaslat anında, patlamadan ~0,35–0,5 sn önce): ayak altında element renginde ışıma + toplanan ince halka,
  // ayaktan bele yükselen yatay halka(lar). Sakin: sarsıntı / ekran flaşı / ışık yok. o.sure: patlamaya kalan sn · o.renk/o.renk2 · o.ince: düşük kademe (tek halka, zerre yok)
  onUyari(kaynak, o = {}) {
    if (!sahne) return; const k = birim(kaynak); if (!k) return;
    const s = Math.max(0.2, Math.min(0.6, o.sure || 0.4)), renk = o.renk || '#ffe08a', renk2 = o.renk2 || '#ffffff', h = k.h || 1, r = 0.55 * Math.sqrt(h), p = k.p;
    _v3.set(p.x, Z() + 0.035, p.z);
    P({ p: _v3, mod: 1, omur: s + 0.15, boy: r * 1.5, boy2: r * 1.9, renk, kare: 'parilti', hot: 0.15, a: 0.3, fi: 0.45, fo: 0.3, on: 1 });   // zemin ışıması
    P({ p: _v3, mod: 1, omur: s + 0.1, boy: r * 2.1, boy2: r * 1.05, renk, renk2, kare: 'halka', hot: 0.55, a: 0.8, fi: 0.35, fo: 0.25, on: 1 });          // toplanan halka
    const vy = (0.75 * h) / s, nh = o.ince ? 1 : 2;
    for (let j = 0; j < nh; j++) zamanla(j * s * 0.4, () => { if (k.o && !k.o.visible) return; _v3.set(k.p.x, Z() + 0.06, k.p.z);
      P({ p: _v3, mod: 1, v: _v2.set(0, vy, 0), drag: 0.6, omur: s * 0.85, boy: r * 1.35, boy2: r * 0.85, renk: renk2, renk2: renk, kare: 'halka', hot: 0.8, a: 0.85 - j * 0.25, fi: 0.15, fo: 0.45, on: 1 }); });
    if (!o.ince) for (let i = 0, n = N(6); i < n; i++) { const a = i / n * TAU + RND() * 0.6, rr0 = r * rr(0.7, 1.0); _v3.set(p.x + Math.cos(a) * rr0, Z() + rr(0.03, 0.15), p.z + Math.sin(a) * rr0);
      P({ p: _v3, v: _v2.set(0, rr(1.2, 2.0) * Math.sqrt(h), 0), drag: 1.4, omur: rr(0.45, 0.65), boy: rr(0.06, 0.1), boy2: 0.02, renk: renk2, renk2: renk, kare: 'parilti', hot: 0.9, fi: 0.2, fo: 0.5, on: 1 }); }
  },
  // yetenek hazırlığı (yetenekBaslat anında): o.sure patlamaya kalan sn, o.kemik soket kemiği (Object3D), o.ileri birimin ön yönü
  hazirlik(ad, kaynak, o = {}) { if (!sahne || !HAZIR[ad]) return; const k = birim(kaynak); if (k) HAZIR[ad](k, o); },
  kut(pos, o = {}) {
    if (!sahne) return null; const p = konum(pos, new THREE.Vector3()).setY(Z());
    const h = (pos && pos.isObject3D && boyAl(pos)) || 1.2; kutBas = simdi(); kutP.copy(p).setY(Z() + 0.6 * h);
    const onceki = ONCELIK; ONCELIK = 2;
    // (a) 0–0,25 sn toplanma: mor-altın zerreler kahramana akar, ayak altında Kut mührü belirir
    surec(0.3, (k, dt, yas, is) => { is.acc = (is.acc || 0) + dt * 90 * OLCEK; while (is.acc >= 1) { is.acc--; const a = RND() * TAU, r = rr(1.0, 1.8);
      _v3.set(p.x + Math.cos(a) * r, Z() + rr(0.1, 1.4), p.z + Math.sin(a) * r); _v4.set(p.x, Z() + 0.6 * h, p.z);
      P({ p: _v3, hedef: _v4, hom: 8, hiz: 5.5, omur: 0.4, boy: rr(0.08, 0.14), boy2: 0.04, renk: RND() < 0.5 ? '#ffd76a' : '#b27bff', kare: RND() < 0.35 ? 'yildiz4' : 'parilti', hot: 1, fo: 0.8, on: 2 }); } });
    run(p, { kare: 'run_kut', renk: '#ffd76a', renk2: '#b27bff', r: 0.9, a: 0.45, sure: 1.4, donus: 1.6 });
    // (b) 0,25 sn patlama: ışık sütunu (yalnız sıcak çekirdek), şok dalgası, kısa ışık
    zamanla(0.25, () => { const o2 = ONCELIK; ONCELIK = 2;
      sutun(p, { renk: '#b27bff', ic: '#ffe9a8', h: 9, en: 1.1, sure: 1.0 });
      sok(p, { renk: '#ffd76a', r: 1.5, toz: true, tozRenk: '#c9b0e8', tozN: 12 });
      flas(_v3.copy(p).setY(Z() + 0.6 * h), { renk: '#ffe6a0', boy: 1.3, sure: 0.3, isikGuc: 8, halka: false });
      ekranFlas('#ffd76a', 0.2, 0.4); sars(0.12); ONCELIK = o2; });
    ONCELIK = onceki;
    const tetik = { flas: { renk: '#ffd76a', guc: 0.2, sure: 0.4 }, yavas: { olcek: 0.35, sure: 0.15 }, sars: 0.1 };
    return tetik;
  },
  olum(pos, o = {}) {
    if (!sahne) return; const b = birim(pos), p = b.p, renk = o.renk || '#d8c8b0';
    const yap = () => {
      sok(p, { renk: '#fff3e0', r: 1.0, toz: true, tozRenk: '#c8b8a8', tozN: 14, a: 0.6 });
      _v3.copy(p).setY(Z() + 0.4); for (let i = 0, n = N(10); i < n; i++) { kureY(_v2, 0.8).multiplyScalar(rr(0.5, 1.2)); P({ p: _v3, v: _v2, g: -0.6, drag: 1.5, omur: rr(0.7, 1.1), boy: rr(0.1, 0.18), boy2: 0.03, renk, renk2: '#ffffff', kare: RND() < 0.4 ? 'yildiz4' : 'parilti', hot: 1, salin: 0.05 }); }
      _v3.copy(p).setY(Z() + 0.5); P({ p: _v3, v: _v2.set(0, 1.1, 0), omur: 1.4, boy: 0.7, boy2: 0.3, renk, renk2: '#ffffff', kare: 'parilti', hot: 0.8, salin: 0.1, fo: 0.5 }); P({ p: _v3, v: _v2.set(0, 1.1, 0), omur: 1.4, boy: 0.35, boy2: 0.15, renk, kare: 'parilti', normal: true, hot: 0.6, a: 0.8, salin: 0.1, fo: 0.5 });
    };
    if (o.gecikme) zamanla(o.gecikme, yap); else yap();
  },
  dirilis(pos) {
    if (!sahne) return; const b = birim(pos), p = b.p.clone().setY(Z());
    for (let i = 0, n = N(12); i < n; i++) { _v3.set(p.x + rr(-0.3, 0.3), Z() + rr(0.05, 0.3), p.z + rr(-0.3, 0.3)); P({ p: _v3, v: _v2.set(rr(-0.4, 0.4), rr(0.5, 1.2), rr(-0.4, 0.4)), drag: 1.5, omur: rr(0.6, 0.9), boy: 0.25, boy2: 0.7, renk: '#3a2e2a', renk2: '#6a5a52', kare: 'duman', normal: true, rot: 'r', a: 0.75, hot: 0 }); }
    zamanla(0.2, () => {
      flas(_v3.copy(p).setY(Z() + 0.6), { renk: '#ff8a3a', boy: 2.0, sure: 0.35, isikGuc: 10 }); sars(0.15); ekranFlas('#ff9a4a', 0.3, 0.3);
      sutun(p, { renk: '#ff6a1f', ic: '#ffe08a', h: 4, en: 1.2, sure: 0.9 }); sok(p, { renk: '#ff8a3a', r: 1.6, toz: false });
      for (let i = 0, n = N(24); i < n; i++) { const a = i / n * TAU; _v3.set(p.x + Math.cos(a) * 0.4, Z() + 0.05, p.z + Math.sin(a) * 0.4);
        P({ p: _v3, v: _v2.set(Math.cos(a) * 0.8, rr(2.5, 4), Math.sin(a) * 0.8), g: 1, drag: 1.2, omur: rr(0.5, 0.8), boy: rr(0.35, 0.5), boy2: 0.08, en: 0.8, uz: 1.3, renk: '#ffe08a', renk2: '#ff2a10', kare: 'alev', normal: true, hot: 0.45 }); }
      for (let i = 0, n = N(14); i < n; i++) { kureY(_v2, 0.9).multiplyScalar(rr(1.5, 3)); _v3.copy(p).setY(Z() + 0.6); P({ p: _v3, v: _v2, drag: 2, g: 0.3, omur: rr(0.9, 1.3), boy: rr(0.2, 0.3), renk: '#ffd36a', renk2: '#ff4a1a', kare: 'tuy', rot: 'r', rotHiz: rr(-3, 3), salin: 0.1, hot: 0.8 }); }
      patlama(_v3.copy(p).setY(Z() + 0.6), { renk: '#ffb347', renk2: '#ff3d1a', n: 20, hiz: 4 });
    });
  },
  birlesme(pos) {
    if (!sahne) return; const b = birim(pos), p = b.p.clone().setY(Z()), m = new THREE.Vector3(p.x, Z() + 0.6 * b.h, p.z);
    for (let i = 0, n = N(24); i < n; i++) { const a = i / n * TAU; _v3.set(p.x + Math.cos(a) * 1.6, Z() + rr(1.2, 2.2), p.z + Math.sin(a) * 1.6);
      P({ p: _v3, v: _v2.set(-Math.sin(a) * 3, 0, Math.cos(a) * 3), hedef: m, hom: 3.5, hiz: 4.5, omur: 0.5, boy: rr(0.14, 0.24), boy2: 0.1, renk: '#ffe45a', kare: 'yildiz4', rot: 'r', rotHiz: 6, hot: 1, fo: 0.9 }); }
    zamanla(0.42, () => { flas(m, { renk: '#fff1a8', boy: 1.6, sure: 0.3 }); sok(p, { renk: '#ffd76a', r: 1.3, toz: true, tozRenk: '#efe2c8', tozN: 10 }); patlama(m, { renk: '#ffe45a', n: 20, hiz: 3.5, guc: 1.2 }); run(p, { renk: '#ffd76a', r: 0.8, sure: 0.8, donus: 3 }); });
  },
  spawn(pos) {
    if (!sahne) return; const b = birim(pos), p = b.p.clone().setY(Z());
    sutun(p, { renk: '#d7a6ff', ic: '#fff2c4', h: 1.8, en: 0.5, sure: 0.45, zerre: false });
    patlama(_v3.copy(p).setY(Z() + 0.4), { renk: '#ffe08a', n: 10, hiz: 2.5 });
    sok(p, { renk: '#ffe0a0', r: 0.7, toz: true, tozRenk: '#d8c8b0', tozN: 8 });
  },
  // Sürekli durum efekti: birimi (Object3D) izler. tur: sersem|buz|yanik|zehir|lanet|kalkan|davul|hiz|ofke|donKabuk|yildiz3
  durum(nesne, tur, acik = true, o = {}) {
    if (!sahne || !nesne || !DURUM[tur]) return;
    if (o.boy) nesne.userData.vfxBoy = o.boy;
    let h = durumlar.get(nesne);
    if (acik) {
      if (!h) { h = new Map(); durumlar.set(nesne, h); }
      const c = h.get(tur); if (c && c.kapan < 0) return; if (c) { c.kapan = -1; return; }
      const yeni = { acc: 0, yas: 0, kapan: -1, nesne, mesh: null, kemik: o.kemik || null };
      if (tur === 'kalkan') { yeni.mesh = kalkanAl(); if (yeni.mesh) { yeni.mesh.visible = true; yeni.mesh.material.uniforms.uR.value.set(...rgb(o.renk || '#ffe9a8')); } }
      h.set(tur, yeni);
    } else if (h && h.get(tur)) { const c = h.get(tur); if (c.kapan < 0) { c.kapan = 0;
      if (tur === 'donKabuk') { const p = takipPoz(nesne), hh = boyAl(nesne); for (let i = 0, n = N(14); i < n; i++) { const a = RND() * TAU; _v3.set(p.x + Math.cos(a) * 0.25, p.y + rr(0.15, 0.9) * hh, p.z + Math.sin(a) * 0.25);
        P({ p: _v3, v: _v2.set(Math.cos(a) * rr(1, 2.2), rr(1.2, 3), Math.sin(a) * rr(1, 2.2)), g: 9, drag: 0.5, omur: rr(0.5, 0.8), boy: rr(0.14, 0.26), renk: '#e9fbff', renk2: '#4fa8ff', kare: 'buz', normal: true, rot: 'r', rotHiz: rr(-8, 8), hot: 0.4, sek: 0.05, fo: 0.6 }); }
        flas(_v3.set(p.x, p.y + 0.5 * hh, p.z), { renk: '#cfefff', boy: 0.7, sure: 0.15, isik: false }); }
      if (tur === 'kalkan') { const p = takipPoz(nesne), hh = boyAl(nesne); _v3.set(p.x, p.y + hh * 0.5, p.z); patlama(_v3, { renk: '#fff1a8', n: 10, hiz: 2, g: 2, yildiz: true }); } } }
  },
  durumTemizle(nesne) { const h = durumlar.get(nesne); if (!h) return; for (const [t] of h) this.durum(nesne, t, false); },
  // ── yapı taşları (doğrudan kullanılabilir) ──
  yapi: {
    patlama: (p, o) => patlama(konum(p, new THREE.Vector3()), o), flas: (p, o) => flas(konum(p, new THREE.Vector3()), o), sok: (p, o) => sok(konum(p, new THREE.Vector3()), o),
    run: (p, o) => run(konum(p, new THREE.Vector3()), o), sutun: (p, o) => sutun(konum(p, new THREE.Vector3()), o), isin, zincir,
    dekal: (p, o) => dekal(konum(p, new THREE.Vector3()), o), aura: (n, o) => aura(n, o), iyiles: (p, renk = '#7dff8a') => iyiles(birim(p), renk), parca: P,
  },
  zincir(a, b, o) { if (sahne) zincir(a, b, o); },
  // ── ekran / kamera / zaman yardımcıları (gerçek zamanla söner; hit-stop sırasında da çalışır) ──
  sars, sarsintiOfset, ekranFlas, ekranCiz, durak, zamanOlcek,
  // ── 2B kaplama odakları (bu karede; sahne3d okur): odakAl(i) → {p: Vector3 dünya, r: dünya yarıçapı}, i < odakSay() ──
  odakSay() { return odakN; }, odakAl(i) { return odaklar[i]; },
  // ── tanı ──
  get sayac() { return sAdd ? { additive: sAdd.n, normal: sNrm.n, is: isler.length, durum: durumlar.size } : null; },
  get atlasTuval() { return atlas && atlas.cv; },
  get _nesneler() { return { kaya: kayaHavuz.map(k => (k.visible ? 'G' : '-') + (k.userData.ayrildi ? 'A' : '') + k.position.y.toFixed(2) + '/s' + k.scale.x.toFixed(2)), parca: parcaKaya && parcaKaya.n, buz: parcaBuz && parcaBuz.n, kristal: kristalH && kristalH.n,
    ok: okHavuz.map(k => k.visible), hortum: hortumHavuz.map(k => k.visible), davul: davulHavuz.map(k => k.visible), elde: kayaElde.size }; },
  KARE, YETENEKLER: Object.keys(YETENEK),
};
export default vfx;
