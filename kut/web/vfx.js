/* Kut Arena — efekt kütüphanesi (vfx). Kurallar: ../ANIMASYON_PLANI.md
   - Bütün dokular kodla (canvas) bir kez üretilen tek atlasta; dış dosya, WebAssembly, Worker, blob/data fetch YOK.
   - Parçacıklar iki havuzda (additive + normal karışım), her biri TEK InstancedMesh + özel ShaderMaterial:
     yüz kameraya dönük (0), yere yatık (1) ya da bir eksen boyunca uzayan (2: ışın, yıldırım, iz, kıvılcım).
   - Her şey önceden ayrılır: efekt başına yeni Geometry/Material üretilmez.
   - Görsel zaman: guncelle(dt) ne verilirse onu kullanır (hit-stop/yavaşlatma görüntüye aittir, motora dokunmaz).
   Kullanım: import { vfx } from './vfx.js'; vfx.kur(sahne, kamera, { kalite: 'yuksek' }); her karede vfx.guncelle(dt). */
import * as THREE from 'three';

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
  run_kut: 25, run_golge: 26, run_ates: 27, kafatasi: 28, catlakYer: 29 };
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
    g.instanceCount = 0; this.g = g;
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
    for (const a of [this.aPos, this.aDir, this.aCol, this.aSz, this.aHot]) { a.clearUpdateRanges(); if (n) { a.addUpdateRange(0, n * a.itemSize); a.needsUpdate = true; } }
  }
}

// ───────────────────────── durum ─────────────────────────
let sahne = null, kamera = null, kalite = 'yuksek', OLCEK = 1, zeminY = 0;
let atlas = null, sAdd = null, sNrm = null;
let isler = [];               // zamanlanmış işler
let kareNo = 0; const takipOn = new Map();
const kayaHavuz = [], kalkanHavuz = []; let isik = null, isikGuc = 0, isikSure = 0.0001, isikYas = 1;
const durumlar = new Map();   // Object3D → Map(tur → denetleyici)
let sarsGuc = 0, sarsT = 0, flasRenk = [1, 1, 1], flasGuc = 0, flasBas = 0, flasSure = 0.0001, durakBitis = 0, durakOlcek = 1;
let kutKisma = 1, kutBas = -9, kutP = new THREE.Vector3();   // Kut anı: öbür sürekli efektler yarı hızda doğar; ekranda karartma + hız çizgileri
const simdi = () => performance.now() / 1000;
const N = (n) => Math.max(1, Math.round(n * OLCEK));

function takipPoz(o) {
  let c = takipOn.get(o);
  if (!c) { c = { k: -1, p: new THREE.Vector3() }; takipOn.set(o, c); }
  if (c.k !== kareNo) { o.getWorldPosition(c.p); c.k = kareNo; }
  return c.p;
}

// Tek parçacık. p: konum (Object3D 'takip' verilirse ona göre göreli). Diğer alanlar isteğe bağlı.
let ONCELIK = 1;   // 0 süs (aura, durum, iz), 1 normal, 2 darbe/Kut — havuz dolarken düşük öncelikli doğumlar düşer
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
  d[b + AL] = o.a === undefined ? 1 : o.a; d[b + ROT] = o.rot === 'r' ? RND() * TAU : (o.rot || 0); d[b + ROTV] = o.rotHiz || 0;
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
  if (o.yildiz !== false) for (let i = 0, m = N(4 * guc); i < m; i++) { kureY(_v2, 0.6).multiplyScalar(hiz * rr(0.25, 0.6));
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
  const renk = o.renk || '#d7a6ff', ic = o.ic || '#fff2c4', h = o.h || 8, en = o.en || 1.1, s = o.sure || 1.0;
  _v3.set(p.x, Z() + h / 2, p.z); _v4.set(0, 1, 0);
  P({ p: _v3, mod: 2, eksen: _v4, omur: s, boy: 1, en: en * 0.6, uz: h, boy2: 1.25, renk, kare: 'isin', hot: 0.4, a: 0.8, fi: 0.08, fo: 0.45 });
  P({ p: _v3, mod: 2, eksen: _v4, omur: s * 0.9, boy: 1, en: en * 0.28, uz: h, boy2: 1.1, renk: ic, kare: 'isin', hot: 1, a: 1, fi: 0.05, fo: 0.4 });
  _v3.set(p.x, Z() + 0.15, p.z);
  P({ p: _v3, omur: s * 0.8, boy: en * 1.4, boy2: en * 2.2, renk, kare: 'parilti', hot: 0.8, a: 0.9, fi: 0.05, fo: 0.3 });
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
  const renk = o.renk || '#fff27a', s = o.sure || 0.3, kal = o.kalin || 0.2, dal = o.dal === undefined ? 2 : o.dal;
  const A = konum(a, new THREE.Vector3()), B = konum(b, new THREE.Vector3());
  const nok = []; for (let i = 0; i < 18; i++) nok.push(new THREE.Vector3());
  const kir = (p0, p1, n, sap, out) => { out[0].copy(p0); out[n].copy(p1); const ek = _v2.copy(p1).sub(p0), L = ek.length();
    const yan1 = _v3.set(-ek.z, 0, ek.x).normalize(); if (yan1.lengthSq() < 0.1) yan1.set(1, 0, 0); const yan2 = _v4.crossVectors(ek, yan1).normalize();
    for (let i = 1; i < n; i++) { const t = i / n, z = Math.sin(t * Math.PI) * L * sap; out[i].copy(p0).addScaledVector(ek, t).addScaledVector(yan1, (RND() - 0.5) * z).addScaledVector(yan2, (RND() - 0.5) * z); } };
  const ciz = (pts, n, w, al) => { for (let i = 0; i < n; i++) { const p0 = pts[i], p1 = pts[i + 1]; const m = _v1.copy(p0).add(p1).multiplyScalar(0.5); const e = _v2.copy(p1).sub(p0); const L = e.length() * 1.15;
    P({ p: m, mod: 2, eksen: e, omur: 0.07, boy: 1, en: w * 3.2, uz: L, renk, kare: 'isin', hot: 0.3, a: al * 0.7, fi: 0, fo: 0.2 });
    P({ p: m, mod: 2, eksen: e, omur: 0.07, boy: 1, en: w, uz: L, renk: '#ffffff', kare: 'isin', hot: 1, a: al, fi: 0, fo: 0.2 }); } };
  surec(s, (k, dt, yas, is) => {
    is.acc = (is.acc || 0) + dt; if (is.ilk && is.acc < 0.045) return; is.ilk = true; is.acc = 0;
    const al = 1 - k * 0.6, nn = OLCEK < 1 ? 7 : 10;
    kir(A, B, nn, 0.22, nok); ciz(nok, nn, kal * al, al);
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

// kaya ağı havuzu
function kayaAl() { for (const k of kayaHavuz) if (!k.visible) { k.visible = true; return k; } return null; }

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
        izParca(onceki, cur, { renk, en: 0.08 * guc, omur: 0.2 }); break;
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
        P({ p: cur, omur: -1, boy: 0.5 * BB, renk: '#3fbf2a', kare: 'parilti', normal: true, hot: 0.5, a: 1 });
        P({ p: cur, omur: -1, boy: 0.36 * BB, renk: '#c8ff8a', kare: 'kabarcik', hot: 0.6, a: 1 });
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
      const B2 = hedefAl().clone(); const y = _v4.copy(B2).sub(A).setY(0).normalize().clone();
      vurus(B2, { renk, guc: guc * (o.varisGuc || 1), yon: y, tur });
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
  flas(p, { renk, boy: 0.55 + 0.35 * guc, sure: 0.12 + 0.05 * guc, isikGuc: 3 * guc });
  patlama(p, { renk, guc: guc * 0.8, n: 10, hiz: 3, yon, boy: 0.08 });
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
// Önden başlatma (sn): darbe olay zamanına denk gelsin diye yetenek bu kadar ÖNCE çağrılmalı (mermi uçuşu, düşen kor vb.)
const ON_SURE = { tasFirlat: 0.45, uluma: 0, davul: 0, ruhEmme: 0, kasirga: 0.22, deliOfke: 0, zehir: 0.36, buzNefes: 0.22, ocak: 0, dortnal: 0.25, kanat: 0, karaGolge: 0.08, kulDogus: 0.42, ayaz: 0, golgeOk: 0.2, yildirim: 0 };
const yukari = (p, h) => _v1.copy(p).setY(p.y + h);

const YETENEK = {
  // Kaya Golemi: göğüste kristal parıltısı → yay çizen kaya → toz şoku, kaya kırıntısı, çatlak
  tasFirlat(k, hs, o) {
    const h = hs[0]; if (!h) return; const g = o.guc;
    const el = new THREE.Vector3().copy(k.p).setY(k.p.y + 0.95 * k.h);
    flas(el, { renk: '#ffcf8a', boy: 0.6, sure: 0.2 });
    for (let i = 0, n = N(10); i < n; i++) { _v3.set(el.x + rr(-0.5, 0.5), Z() + 0.05, el.z + rr(-0.5, 0.5)); P({ p: _v3, hedef: el, hom: 6, hiz: 2.5, v: _v2.set(0, 1, 0), omur: 0.4, boy: 0.18, boy2: 0.05, renk: '#ffd9a0', kare: 'parilti', hot: 1 }); }
    mermi(el, h.o || h.p, ON_SURE.tasFirlat, { tur: 'kaya', guc: 1.5 * g, kayaBoy: 0.8, varisGuc: 1.2, bitis: (B) => {
      sok(B, { renk: '#ffd08a', r: 1.5 * g, toz: true, tozRenk: '#a98361', tozN: 16 }); dekal(B, { r: 0.9 * g, renk: '#2b1c10', a: 0.8 }); sars(0.22 * g);
      for (let i = 0, n = N(6); i < n; i++) { const a = RND() * TAU; _v3.set(B.x + Math.cos(a) * 0.3, Z() + 0.05, B.z + Math.sin(a) * 0.3); P({ p: _v3, v: _v2.set(Math.cos(a) * 0.5, rr(2, 3.5), Math.sin(a) * 0.5), g: 9, omur: 0.7, boy: rr(0.22, 0.32), renk: '#8e6a4c', kare: 'tas', normal: true, rot: 'r', rotHiz: rr(-6, 6), hot: 0, sek: 0.06, fo: 0.75 }); }
    } });
  },
  // Kristal Kurt: başından mavi kristal ses halkaları, kristal kıymıkları; dostlarda hız çizgileri
  uluma(k, hs, o) {
    const bas = new THREE.Vector3().copy(k.p).setY(k.p.y + 0.75 * k.h), g = o.guc;
    for (let d = 0; d < 3; d++) zamanla(d * 0.13, () => {
      P({ p: bas, omur: 0.55, boy: 0.3, boy2: 2.4 * g, renk: '#9fe4ff', renk2: '#3d7bff', kare: 'sok', normal: true, hot: 0.3, a: 0.9, fi: 0, fo: 0.3, rot: 'r' });
      P({ p: bas, omur: 0.4, boy: 0.2, boy2: 1.6 * g, renk: '#4fa8ff', kare: 'halka', hot: 0.6, a: 0.6, fi: 0, fo: 0.2 });
      sok(k.p, { renk: '#5fb8ff', r: 1.1 + d * 0.5, sure: 0.5, a: 0.8 });
    });
    flas(bas, { renk: '#5fb8ff', boy: 0.8, sure: 0.22 });
    for (let i = 0, n = N(12 * g); i < n; i++) { kureY(_v2, 0.9).multiplyScalar(rr(1.5, 3)); P({ p: bas, v: _v2, g: 5, drag: 1.2, omur: rr(0.5, 0.8), boy: rr(0.16, 0.28), renk: '#e9fbff', renk2: '#6fb8ff', kare: 'buz', rot: 'r', rotHiz: rr(-5, 5), hot: 0.7, sek: 0.05 }); }
    hs.forEach((h, j) => zamanla(0.12 + j * 0.05, () => {
      for (let i = 0, n = N(8); i < n; i++) { const a = RND() * TAU; _v3.set(h.p.x + Math.cos(a) * 0.32, Z() + rr(0, 0.3), h.p.z + Math.sin(a) * 0.32); P({ p: _v3, v: _v2.set(0, rr(2.5, 4), 0), drag: 2, omur: rr(0.35, 0.55), boy: rr(0.1, 0.14), uz: 1.5, en: 0.5, renk: '#bfefff', renk2: '#4f8bff', kare: 'kivilcim', mod: 2, uzat: 0.25, hot: 1 }); }
      sok(h.p, { renk: '#8fdcff', r: 0.55, sure: 0.4, a: 0.7 });
    }));
  },
  // Davulcu Kurbağa: dört vuruşluk turuncu ses dalgaları; dostlarda güç parlaması
  davul(k, hs, o) {
    const g = o.guc, merkez = new THREE.Vector3().copy(k.p).setY(k.p.y + 0.45 * k.h);
    for (let d = 0; d < 4; d++) zamanla(d * 0.2, () => {
      const r = (d === 3 ? 2.6 : 1.8) * g;
      sok(k.p, { renk: d % 2 ? '#ffb347' : '#ff7a2e', r, sure: 0.55 });
      flas(merkez, { renk: '#ff8a2e', boy: d === 3 ? 0.9 : 0.6, sure: 0.15, halka: false });
      const m = N(10); for (let i = 0; i < m; i++) { const a = i / m * TAU + d * 0.3; _v3.set(k.p.x + Math.cos(a) * 0.35, Z() + 0.06, k.p.z + Math.sin(a) * 0.35);
        P({ p: _v3, mod: 1, v: _v2.set(Math.cos(a) * 3.2 * g, 0, Math.sin(a) * 3.2 * g), drag: 1.2, omur: 0.6, boy: 0.42, boy2: 0.75, renk: '#ffb02e', renk2: '#ff5a1f', kare: 'dalga', normal: true, rot: -a - Math.PI / 2, hot: 0.2, fi: 0, fo: 0.4 }); }
      P({ p: merkez, omur: 0.35, boy: 0.3, boy2: 1.3, renk: '#ff9a2e', kare: 'dalga', normal: true, hot: 0.3, fi: 0, fo: 0.3 });
    });
    hs.forEach((h, j) => zamanla(0.25 + j * 0.04, () => {
      sutun(h.p, { renk: '#ff8a2e', ic: '#ffe1a0', h: 1.8, en: 0.75, sure: 0.6, zerre: false });
      for (let i = 0, n = N(8); i < n; i++) { _v3.set(h.p.x, Z() + 0.1, h.p.z); P({ p: _v3, yorunge: { r: rr(0.3, 0.45), w: rr(3, 5), vy: rr(1, 2) }, omur: rr(0.5, 0.8), boy: rr(0.08, 0.14), boy2: 0.02, renk: '#ffcf6a', kare: RND() < 0.4 ? 'yildiz4' : 'parilti', hot: 1 }); }
    }));
  },
  // Sis Yarasası: hedeften kaynağa kızıl ruh akışı (kıvrılan parçacıklar), kaynakta kan parıltısı
  ruhEmme(k, hs, o) {
    const h = hs[0]; if (!h) return; const g = o.guc;
    const hp = new THREE.Vector3().copy(h.p).setY(h.p.y + 0.5 * h.h), kp = new THREE.Vector3().copy(k.p).setY(k.p.y + 0.55 * k.h);
    flas(hp, { renk: '#ff3d5a', boy: 0.8, sure: 0.2 });
    for (let i = 0, n = N(10); i < n; i++) { kureY(_v2, 0.3).multiplyScalar(rr(1, 2.2)); P({ p: hp, v: _v2, drag: 2, g: -0.5, omur: rr(0.5, 0.8), boy: rr(0.28, 0.45), boy2: 0.7, renk: '#5a0f2a', renk2: '#2a0a1a', kare: 'duman', normal: true, rot: 'r', a: 0.55, hot: 0 }); }
    surec(0.8, (kk, dt, yas, is) => { is.acc = (is.acc || 0) + dt * 75 * OLCEK * g; while (is.acc >= 1) { is.acc--;
      kureY(_v2, 0.5).multiplyScalar(rr(1.5, 3)); _v3.copy(hp).add(_v4.set(rr(-0.15, 0.15), rr(-0.1, 0.2), rr(-0.15, 0.15))); const t = RND();
      if (t < 0.45) P({ p: _v3, v: _v2, hedef: kp, hom: rr(3, 5), hiz: rr(3.5, 5), omur: 1.4, boy: rr(0.14, 0.22), uz: 2.2, en: 0.7, renk: '#ffd0da', renk2: '#ff2d4d', kare: 'kivilcim', mod: 2, uzat: 0.08, hot: 0.7, fo: 0.85 });
      else if (t < 0.8) P({ p: _v3, v: _v2, hedef: kp, hom: rr(3, 5), hiz: rr(3.5, 5), omur: 1.4, boy: rr(0.3, 0.45), boy2: 0.16, renk: '#ff2d4d', renk2: '#c0103a', kare: 'parilti', hot: 0.5, fo: 0.85 });
      else P({ p: _v3, v: _v2, hedef: kp, hom: rr(3, 5), hiz: rr(3.2, 4.5), omur: 1.4, boy: rr(0.28, 0.4), boy2: 0.14, renk: '#9a0f30', renk2: '#5a0820', kare: 'duman', normal: true, rot: 'r', rotHiz: 3, a: 0.75, hot: 0, fo: 0.8 }); } });
    zamanla(0.45, () => { flas(kp, { renk: '#ff5a7a', boy: 0.9, sure: 0.3 }); aura(k.o || k.p, { renk: '#ff4d6d', renk2: '#ffd0da', sure: 0.6, oran: 30, boy: k.h }); });
  },
  // Rüzgâr Ruhu: rüzgâr mermisi → hedefte yapraklı dönen hortum, yerde toz halkası
  kasirga(k, hs, o) {
    const h = hs[0]; if (!h) return; const g = o.guc, c = new THREE.Vector3().copy(h.p).setY(Z());
    mermi(new THREE.Vector3().copy(k.p).setY(k.p.y + 0.7 * k.h), c.clone().setY(Z() + 0.5), ON_SURE.kasirga, { renk: '#9ff0e0', guc: 1.2, tur: 'buyu' });
    zamanla(ON_SURE.kasirga, () => {
      sok(c, { renk: '#bff7ea', r: 1.6 * g, toz: true, tozRenk: '#cfe3c8', tozN: 14 }); sars(0.08);
      surec(1.15, (kk, dt, yas, is) => { is.acc = (is.acc || 0) + dt * 90 * OLCEK * g; const sol = kk > 0.8 ? (1 - kk) / 0.2 : 1;
        while (is.acc >= 1) { is.acc--; const r0 = rr(0.12, 0.3), yap = RND() < 0.35;
          _v3.set(c.x, Z() + rr(0, 0.15), c.z);
          P({ p: _v3, yorunge: { r: r0, w: rr(8, 11), vy: rr(1.6, 2.6), rv: rr(0.35, 0.6) }, omur: rr(0.7, 1.0), boy: yap ? rr(0.18, 0.26) : rr(0.2, 0.3), boy2: yap ? 0.16 : 0.08,
            renk: yap ? (RND() < 0.5 ? '#7dd35a' : '#c9e85a') : '#e8fff9', renk2: yap ? '#4a9a3a' : '#7fc8c0', kare: yap ? 'yaprak' : 'kivilcim', mod: yap ? 0 : 2, uzat: yap ? 0 : 0.09, en: yap ? 1 : 0.5,
            rot: 'r', rotHiz: rr(-8, 8), normal: yap, hot: yap ? 0 : 0.9, a: (yap ? 1 : 0.7) * sol, fo: 0.6 }); }
        is.acc2 = (is.acc2 || 0) + dt * 34 * OLCEK; while (is.acc2 >= 1) { is.acc2--; _v3.set(c.x, Z() + 0.05, c.z);
          P({ p: _v3, yorunge: { r: 0.08, w: rr(6, 8), vy: rr(2.0, 2.6), rv: rr(0.45, 0.6) }, omur: rr(0.9, 1.1), boy: 0.3, boy2: 0.7, renk: '#e6fff8', renk2: '#8fd8c8', kare: 'duman', normal: true, rot: 'r', rotHiz: 4, a: 0.6 * sol, hot: 0, fi: 0.1, fo: 0.55 }); }
        for (let i = 0; i < 7; i++) { const y = 0.12 + i * 0.28, w = (0.45 + i * 0.24) * g, sal = Math.sin(yas * 7 + i) * 0.06 * i; _v3.set(c.x + sal, Z() + y, c.z);
          P({ p: _v3, omur: -1, boy: w, en: 1, uz: 0.55, renk: '#c8fff0', kare: 'girdap', normal: true, rot: -yas * 14 + i * 1.3, hot: 0.4, a: 0.75 * sol });
          P({ p: _v3, omur: -1, boy: w * 1.1, en: 1, uz: 0.6, renk: '#3fbfa8', kare: 'girdap', rot: -yas * 11 + i * 2.1, hot: 0.3, a: 0.5 * sol }); }
        if (RND() < 0.5 * OLCEK) { _v3.set(c.x, Z() + 0.05, c.z); P({ p: _v3, mod: 1, omur: 0.3, boy: 0.8, boy2: 1.4, renk: '#cfffee', kare: 'girdap', rot: yas * 10, rotHiz: -10, hot: 0.6, a: 0.5 * sol, fi: 0.2 }); }
      });
      hs.slice(1).concat([h]).forEach(t => patlama(_v4.copy(t.p).setY(t.p.y + 0.5 * t.h), { renk: '#bff7ea', n: 6, yildiz: false }));
    });
  },
  // Dağ Koçu: buhar bulutları, kızıl alev halkası, kor kıvılcımları, yerde kızgın çatlak
  deliOfke(k, hs, o) {
    const g = o.guc, bas = new THREE.Vector3().copy(k.p).setY(k.p.y + 0.8 * k.h);
    flas(bas, { renk: '#ff3d2a', boy: 1.0, sure: 0.25 });
    sok(k.p, { renk: '#ff4a2a', r: 1.3 * g, toz: true, tozRenk: '#a07a60', tozN: 10 }); sars(0.12);
    dekal(k.p, { r: 0.8, renk: '#ff5a1f', additive: true, a: 0.9, sure: 1.2 });
    for (let i = 0, n = N(14 * g); i < n; i++) { _v3.set(bas.x + rr(-0.2, 0.2), bas.y + rr(-0.1, 0.1), bas.z + rr(-0.2, 0.2)); P({ p: _v3, v: _v2.set(rr(-0.8, 0.8), rr(1.2, 2.4), rr(-0.8, 0.8)), drag: 2.2, g: -0.3, omur: rr(0.7, 1.1), boy: rr(0.18, 0.3), boy2: rr(0.6, 0.9), renk: '#ffffff', renk2: '#d9cfd8', kare: 'duman', normal: true, rot: 'r', rotHiz: rr(-1, 1), a: 0.8, hot: 0 }); }
    patlama(bas, { renk: '#ff5a2a', renk2: '#ff2a10', n: 16, hiz: 3.5, guc: g });
    aura(k.o || k.p, { renk: '#ff3d2a', renk2: '#ffb347', sure: 0.9, oran: 40, boy: k.h });
  },
  // Zümrüt Yılan: yeşil zehir topu → sıçrama, kabarcık bulutu, zehir gölü; en yaralı dosta iyileşme
  zehir(k, hs, o) {
    const h = hs[0]; if (!h) return; const g = o.guc;
    mermi(new THREE.Vector3().copy(k.p).setY(k.p.y + 0.7 * k.h), h.o || h.p, ON_SURE.zehir, { tur: 'zehir', guc: 1.4 * g, bitis: (B) => {
      _v3.copy(B).setY(Z()); dekal(_v3, { r: 1.0 * g, renk: '#3cbf2a', kare: 'duman', a: 0.7, sure: 1.8 });
      surec(1.6, (kk, dt, yas, is) => { is.acc = (is.acc || 0) + dt * 30 * OLCEK; while (is.acc >= 1) { is.acc--; const a = RND() * TAU, r = rr(0, 0.55) * g;
        _v3.set(B.x + Math.cos(a) * r, Z() + rr(0.05, 0.5), B.z + Math.sin(a) * r);
        if (RND() < 0.6) P({ p: _v3, v: _v2.set(0, rr(0.4, 0.9), 0), omur: rr(0.5, 0.9), boy: rr(0.12, 0.22), boy2: rr(0.24, 0.34), renk: '#b4ff7a', renk2: '#5fd03a', kare: 'kabarcik', hot: 0.6, salin: 0.06, fo: 0.85 });
        else P({ p: _v3, v: _v2.set(0, rr(0.2, 0.5), 0), drag: 1, omur: rr(0.7, 1.0), boy: rr(0.4, 0.55), boy2: 0.95, renk: '#5fcf3a', renk2: '#2a7a2a', kare: 'duman', normal: true, rot: 'r', a: 0.55, hot: 0 }); } });
    } });
    for (const d of (o.dostlar || [])) zamanla(ON_SURE.zehir + 0.1, () => iyiles(d, '#7dff8a'));
  },
  // Buz Kaplumbağası: ağızdan buz konisi (sis + kristal + kar) → hedefte kristal patlaması, kırağı izi
  buzNefes(k, hs, o) {
    const h = hs[0]; if (!h) return; const g = o.guc;
    const agiz = new THREE.Vector3().copy(k.p).setY(k.p.y + 0.4 * k.h), hp = new THREE.Vector3().copy(h.p).setY(h.p.y + 0.4 * h.h);
    const yon = hp.clone().sub(agiz); const L = yon.length(); yon.normalize(); agiz.addScaledVector(yon, 0.3);
    const yan = new THREE.Vector3(-yon.z, 0, yon.x).normalize(), ust = new THREE.Vector3().crossVectors(yan, yon);
    surec(0.42, (kk, dt, yas, is) => { is.acc = (is.acc || 0) + dt * 130 * OLCEK; while (is.acc >= 1) { is.acc--;
      const hiz = rr(5, 7), ac = rr(-0.34, 0.34), ac2 = rr(-0.2, 0.26); _v2.copy(yon).addScaledVector(yan, ac).addScaledVector(ust, ac2).normalize().multiplyScalar(hiz);
      const omur = L / hiz * rr(0.9, 1.2), t = RND();
      if (t < 0.4) P({ p: agiz, v: _v2, drag: 0.6, omur, boy: 0.2, boy2: 0.9, renk: '#f2fcff', renk2: '#8fd0ff', kare: 'duman', normal: true, rot: 'r', a: 0.6, hot: 0, fo: 0.5 });
      else if (t < 0.65) P({ p: agiz, v: _v2, drag: 0.5, omur, boy: rr(0.16, 0.26), boy2: rr(0.26, 0.4), renk: '#e9fbff', renk2: '#4fa8ff', kare: 'buz', normal: true, rot: 'r', rotHiz: rr(-6, 6), hot: 0.4 });
      else if (t < 0.85) P({ p: agiz, v: _v2, drag: 0.5, omur, boy: rr(0.1, 0.16), renk: '#bfeaff', kare: 'kar', rot: 'r', rotHiz: rr(-4, 4), hot: 0.6 });
      else P({ p: agiz, v: _v2, drag: 0.5, omur: omur * 0.8, boy: 0.1, uz: 1.4, en: 0.5, renk: '#ffffff', renk2: '#7fd4ff', kare: 'kivilcim', mod: 2, uzat: 0.08, hot: 1 }); } });
    flas(agiz, { renk: '#bfeaff', boy: 0.6, sure: 0.2 });
    hs.forEach((t, j) => zamanla(ON_SURE.buzNefes + j * 0.04, () => {
      const tp = _v4.copy(t.p).setY(t.p.y + 0.35 * t.h).clone();
      flas(tp, { renk: '#bfeaff', boy: 1.0 * g, sure: 0.2 });
      for (let i = 0, n = N(14 * g); i < n; i++) { const a = RND() * TAU; _v3.set(tp.x + Math.cos(a) * 0.15, Z() + 0.05, tp.z + Math.sin(a) * 0.15);
        P({ p: _v3, v: _v2.set(Math.cos(a) * rr(0.6, 1.8), rr(2.5, 4.5), Math.sin(a) * rr(0.6, 1.8)), g: 9, drag: 0.5, omur: rr(0.6, 0.9), boy: rr(0.24, 0.4), renk: '#e9fbff', renk2: '#4fa8ff', kare: 'buz', normal: true, rot: rr(-0.4, 0.4), rotHiz: rr(-5, 5), hot: 0.4, sek: 0.06, fo: 0.7 }); }
      // yerden fışkıran kristal kümesi (eksenli, yukarı)
      for (let i = 0, n = N(5); i < n; i++) { const a = i / 5 * TAU; _v3.set(t.p.x + Math.cos(a) * 0.28, Z() + 0.2, t.p.z + Math.sin(a) * 0.28); _v2.set(Math.cos(a) * 0.5, 1, Math.sin(a) * 0.5);
        P({ p: _v3, mod: 2, eksen: _v2, omur: 0.9, boy: 0.2, boy2: 0.55, en: 1, uz: 1.3, renk: '#e9fbff', renk2: '#6fb8ff', kare: 'buz', normal: true, hot: 0.4, fi: 0.05, fo: 0.6 }); }
      dekal(t.p, { r: 0.8, renk: '#cfefff', kare: 'kar', additive: true, a: 0.6, sure: 1.6 });
      sok(t.p, { renk: '#bfeaff', r: 0.9, toz: false });
    }));
  },
  // Kor Semenderi: çevresinde genişleyen ateş halkası (yerde alev dilleri); dostlara iyileşme
  ocak(k, hs, o) {
    const g = o.guc, R = 2 * g, c = new THREE.Vector3().copy(k.p).setY(Z());
    flas(_v3.copy(c).setY(Z() + 0.4), { renk: '#ff8a3a', boy: 1.0, sure: 0.25 });
    sok(c, { renk: '#ff8a3a', r: R, sure: 0.45 });
    _v3.set(c.x, Z() + 0.04, c.z); P({ p: _v3, mod: 1, omur: 1.4, boy: R * 1.2, boy2: R * 2.15, renk: '#ff7a1f', kare: 'halka', normal: true, hot: 0.3, a: 0.75, fi: 0.1, fo: 0.7 });
    P({ p: _v3, mod: 1, omur: 1.4, boy: R * 1.6, boy2: R * 2.0, renk: '#ff9a2e', renk2: '#ff4a1a', kare: 'run_ates', normal: true, rot: 'r', rotHiz: 1.5, hot: 0.25, a: 0.8, fi: 0.15, fo: 0.6 });
    P({ p: _v3, mod: 1, omur: 1.4, boy: R * 2.2, boy2: R * 2.4, renk: '#ff5a1f', kare: 'parilti', hot: 0.1, a: 0.45, fi: 0.15, fo: 0.6 });
    surec(1.35, (kk, dt, yas, is) => { const r = R * Math.min(1, yas / 0.3); is.acc = (is.acc || 0) + dt * 110 * OLCEK; const sol = kk > 0.75 ? (1 - kk) / 0.25 : 1;
      while (is.acc >= 1) { is.acc--; const a = RND() * TAU, rj = r * rr(0.9, 1.05); _v3.set(c.x + Math.cos(a) * rj, Z() + 0.05, c.z + Math.sin(a) * rj);
        if (RND() < 0.8) P({ p: _v3, v: _v2.set(0, rr(1, 2), 0), g: -1, drag: 1, omur: rr(0.35, 0.55), boy: rr(0.42, 0.6), boy2: 0.1, en: 0.85, uz: 1.25, renk: '#ffb02e', renk2: '#ff2a10', kare: 'alev', normal: true, rot: rr(-0.25, 0.25), hot: 0.3, a: sol, fo: 0.4 });
        else P({ p: _v3, v: _v2.set(rr(-0.4, 0.4), rr(2, 3.5), rr(-0.4, 0.4)), g: 1, omur: rr(0.5, 0.8), boy: 0.05, uz: 2, en: 0.6, renk: '#ffd36a', renk2: '#ff4a1a', kare: 'kivilcim', mod: 2, uzat: 0.1, hot: 1, a: sol }); } });
    for (const d of (o.dostlar.length ? o.dostlar : [k])) zamanla(0.3, () => iyiles(d, '#ffd36a'));
  },
  // Bulut Atı: arkasında kabarık bulut izi → varışta şok, toz, parlama
  dortnal(k, hs, o) {
    const h = hs[0]; if (!h) return; const g = o.guc, A = new THREE.Vector3().copy(k.p), B = new THREE.Vector3().copy(h.p), cur = new THREE.Vector3();
    sok(A, { renk: '#fff3d0', r: 0.9, toz: true, tozRenk: '#efe6d6', tozN: 8 });
    surec(ON_SURE.dortnal, (kk, dt, yas, is) => { cur.lerpVectors(A, B, 1 - (1 - kk) * (1 - kk)); is.acc = (is.acc || 0) + dt * 90 * OLCEK;
      while (is.acc >= 1) { is.acc--; _v3.set(cur.x + rr(-0.2, 0.2), Z() + rr(0.15, 0.6), cur.z + rr(-0.2, 0.2));
        if (RND() < 0.75) P({ p: _v3, v: _v2.set(rr(-0.3, 0.3), rr(0.1, 0.4), rr(-0.3, 0.3)), drag: 2, omur: rr(0.8, 1.2), boy: rr(0.3, 0.45), boy2: rr(0.6, 0.85), renk: '#ffffff', renk2: '#f3e8ff', kare: 'duman', normal: true, rot: 'r', rotHiz: rr(-0.5, 0.5), a: 0.85, hot: 0, fo: 0.4 });
        else P({ p: _v3, v: _v2.set(0, rr(0.2, 0.6), 0), omur: rr(0.4, 0.7), boy: rr(0.1, 0.16), renk: '#ffe08a', kare: 'yildiz4', rot: 'r', hot: 1 }); } });
    zamanla(ON_SURE.dortnal, () => { flas(_v3.copy(B).setY(B.y + 0.5 * h.h), { renk: '#fff0c0', boy: 1.2 * g, sure: 0.22 }); sok(B, { renk: '#fff0c0', r: 1.4 * g, toz: true, tozRenk: '#e8dccb', tozN: 14 });
      patlama(_v3.copy(B).setY(B.y + 0.5 * h.h), { renk: '#ffe08a', n: 16, guc: g }); sars(0.18 * g); });
  },
  // Işık Kuğusu: kanatlardan yükselen ışık tüyleri, ışınım; dostlarda kalkan kabarcığı patlaması
  kanat(k, hs, o) {
    const g = o.guc, gov = new THREE.Vector3().copy(k.p).setY(k.p.y + 0.6 * k.h);
    flas(gov, { renk: '#fff1a8', boy: 1.3 * g, sure: 0.3 });
    sutun(k.p, { renk: '#fff1a8', ic: '#ffffff', h: 3, en: 0.8, sure: 0.8 });
    for (let i = 0, n = N(20 * g); i < n; i++) { const a = RND() * TAU; _v3.set(gov.x + Math.cos(a) * 0.3, gov.y + rr(-0.1, 0.3), gov.z + Math.sin(a) * 0.3);
      P({ p: _v3, v: _v2.set(Math.cos(a) * rr(0.8, 1.8), rr(1.5, 3), Math.sin(a) * rr(0.8, 1.8)), drag: 2.2, g: 0.4, omur: rr(1.0, 1.5), boy: rr(0.26, 0.38), renk: '#fff6d8', renk2: '#ffc83a', kare: 'tuy', normal: true, rot: 'r', rotHiz: rr(-2, 2), salin: 0.12, hot: 0.35, fo: 0.6 }); }
    hs.forEach((h, j) => zamanla(0.2 + j * 0.06, () => {
      const hp = _v4.copy(h.p).setY(h.p.y + 0.5 * h.h).clone();
      P({ p: hp, omur: 0.5, boy: 0.3, boy2: 1.5 * h.h, renk: '#fff6d0', renk2: '#ffe08a', kare: 'kabarcik', hot: 0.8, a: 1, fi: 0, fo: 0.4 });
      P({ p: hp, omur: 0.3, boy: 0.2, boy2: 1.2, renk: '#ffffff', kare: 'parilti', hot: 1, a: 0.7, fi: 0 });
      for (let i = 0, n = N(6); i < n; i++) { kureY(_v2, 0.5).multiplyScalar(rr(0.6, 1.4)); P({ p: hp, v: _v2, drag: 2, omur: rr(0.5, 0.8), boy: rr(0.1, 0.16), renk: '#fff1a8', kare: 'yildiz4', rot: 'r', hot: 1 }); }
      _v3.copy(hp).setY(hp.y + 1.2); P({ p: _v3, v: _v2.set(0, -0.5, 0), omur: 1.2, boy: 0.28, renk: '#fffbe8', kare: 'tuy', rot: 'r', rotHiz: 1.5, salin: 0.2, hot: 0.6, fo: 0.6 });
    }));
  },
  // Gece Ayısı: mor gölge pençesi + üç kesik, kara duman, hedefte lanet gözü, gölge çatlağı
  karaGolge(k, hs, o) {
    const h = hs[0]; if (!h) return; const g = o.guc, hp = new THREE.Vector3().copy(h.p).setY(h.p.y + 0.55 * h.h);
    _v3.copy(hp).setY(hp.y + 0.5); P({ p: _v3, v: _v2.set(0, -3, 0), drag: 4, omur: 0.5, boy: 1.5 * g, boy2: 2.3 * g, renk: '#b46cff', renk2: '#5a1aa8', kare: 'pence', normal: true, rot: -0.15, hot: 0.6, a: 0.95, fi: 0.15, fo: 0.45 });
    P({ p: _v3, v: _v2.set(0, -3, 0), drag: 4, omur: 0.45, boy: 1.6 * g, boy2: 2.4 * g, renk: '#a46cff', kare: 'pence', rot: -0.15, hot: 0.5, a: 0.6, fi: 0.15, fo: 0.4 });
    zamanla(ON_SURE.karaGolge, () => {
      for (let j = 0; j < 3; j++) zamanla(j * 0.05, () => P({ p: _v3.copy(hp).add(_v4.set((j - 1) * 0.18, 0, 0)), omur: 0.25, boy: 0.7 * g, boy2: 1.1 * g, en: 1.5, renk: '#ffffff', renk2: '#a46cff', kare: 'kesik', rot: -0.9 + j * 0.08, hot: 1, fi: 0, fo: 0.3 }));
      flas(hp, { renk: '#b46cff', boy: 1.1 * g, sure: 0.22 }); sars(0.16 * g);
      for (let i = 0, n = N(14 * g); i < n; i++) { kureY(_v2, 0.4).multiplyScalar(rr(0.8, 2.2)); P({ p: hp, v: _v2, drag: 2.4, g: -0.4, omur: rr(0.6, 1.0), boy: rr(0.3, 0.45), boy2: rr(0.7, 1.0), renk: '#3a1a5a', renk2: '#140a22', kare: 'duman', normal: true, rot: 'r', rotHiz: rr(-1, 1), a: 0.75, hot: 0 }); }
      patlama(hp, { renk: '#c98bff', renk2: '#7a2cff', n: 14, guc: g });
      dekal(h.p, { r: 0.85, renk: '#24103a', a: 0.85 });
      dekal(h.p, { r: 0.7, renk: '#a46cff', additive: true, a: 0.6, sure: 1.0 });
      run(h.p, { kare: 'run_golge', renk: '#9a4dff', renk2: '#e0c2ff', r: 0.55, a: 0.7, sure: 0.9, donus: -1.5 });
      const goz = _v4.copy(h.p).setY(h.p.y + h.h + 0.45).clone();
      zamanla(0.15, () => { P({ p: goz, omur: 1.0, boy: 0.3, boy2: 0.95, renk: '#c48cff', renk2: '#8a3cff', kare: 'goz', normal: true, hot: 0.6, fi: 0.1, fo: 0.65 }); P({ p: goz, omur: 0.6, boy: 0.4, boy2: 1.2, renk: '#7a2cff', kare: 'parilti', hot: 0.4, a: 0.8 }); });
    });
  },
  // Anka: gökten kor yağmuru → yerde alev öbekleri, yanık izi
  kulDogus(k, hs, o) {
    const h = hs[0]; if (!h) return; const g = o.guc, c = new THREE.Vector3().copy(h.p).setY(Z()), Rr = 1.3 * g, dus = ON_SURE.kulDogus;
    const nok = []; const adet = N(12 * g);
    for (let i = 0; i < adet; i++) { const a = RND() * TAU, r = i === 0 ? 0 : Math.sqrt(RND()) * Rr; nok.push(new THREE.Vector3(c.x + Math.cos(a) * r, Z() + 0.05, c.z + Math.sin(a) * r)); }
    nok.forEach((n, i) => {
      const gec = (i / adet) * 0.45, bas = n.clone().add(_v2.set(0.9, 6, -0.6)), hiz = bas.distanceTo(n) / dus, v = n.clone().sub(bas).normalize().multiplyScalar(hiz);
      zamanla(gec, () => {
        P({ p: bas, v, omur: dus, boy: 0.35, en: 0.9, uz: 1.2, renk: '#ffe08a', renk2: '#ff4a1a', kare: 'alev', normal: true, mod: 2, uzat: 0.06, hot: 0.45, fi: 0.05, fo: 0.95, eksen: v });
        P({ p: bas, v, omur: dus, boy: 0.5, renk: '#ff6a1f', kare: 'parilti', hot: 0.8, a: 0.8, fi: 0.05, fo: 0.95 });
        zamanla(dus, () => {
          flas(_v3.copy(n).setY(Z() + 0.2), { renk: '#ff8a3a', boy: 0.7, sure: 0.15, halka: false, isik: i % 3 === 0 });
          for (let j = 0, m = N(5); j < m; j++) { kureY(_v2, 0.9).multiplyScalar(rr(1, 2.5)); P({ p: n, v: _v2, g: 6, omur: rr(0.3, 0.5), boy: 0.06, uz: 2, en: 0.6, renk: '#ffd36a', renk2: '#ff3d1a', kare: 'kivilcim', mod: 2, uzat: 0.1, hot: 1 }); }
          surec(0.9, (kk, dt, yas, is) => { is.acc = (is.acc || 0) + dt * 20 * OLCEK; while (is.acc >= 1) { is.acc--; _v3.set(n.x + rr(-0.12, 0.12), Z() + 0.05, n.z + rr(-0.12, 0.12));
            P({ p: _v3, v: _v2.set(0, rr(0.8, 1.5), 0), g: -0.5, omur: rr(0.35, 0.5), boy: rr(0.32, 0.46) * (1 - kk * 0.6), boy2: 0.06, renk: '#ffb02e', renk2: '#ff2a10', kare: 'alev', normal: true, rot: rr(-0.3, 0.3), hot: 0.3 }); } });
          dekal(n, { r: 0.4, renk: '#ff5a1f', kare: 'parilti', additive: true, a: 0.7, sure: 0.9 });
          if (i % 2 === 0) dekal(n, { r: 0.35, renk: '#1e120c', a: 0.7, sure: 1.8 });
        });
      });
    });
    zamanla(dus + 0.2, () => { sok(c, { renk: '#ff8a3a', r: Rr * 1.1, toz: true, tozRenk: '#9a7a6a', tozN: 8 }); sars(0.15 * g); });
  },
  // Ayaz Baykuşu: bütün sahaya yayılan kırağı dalgası; düşmanlarda buz patlaması
  ayaz(k, hs, o) {
    const g = o.guc, c = new THREE.Vector3().copy(k.p).setY(Z()), HIZ = 8.5, MAX = 10;
    flas(_v3.copy(k.p).setY(k.p.y + 0.7 * k.h), { renk: '#cfefff', boy: 1.4, sure: 0.3 });
    for (let i = 0, n = N(16); i < n; i++) { kureY(_v2, 0.6).multiplyScalar(rr(1, 2.5)); P({ p: _v3, v: _v2, drag: 1.5, g: 0.5, omur: rr(0.8, 1.2), boy: rr(0.1, 0.18), renk: '#ffffff', renk2: '#9fdcff', kare: 'kar', rot: 'r', rotHiz: rr(-3, 3), hot: 1 }); }
    _v3.set(c.x, Z() + 0.05, c.z);
    P({ p: _v3, mod: 1, omur: 0.75, boy: 0.5, boy2: 13, renk: '#dff6ff', renk2: '#6fb8ff', kare: 'halka', normal: true, hot: 0.3, a: 0.6, fi: 0, fo: 0.35, rot: 'r' });
    P({ p: _v3, mod: 1, omur: 0.6, boy: 0.5, boy2: 10, renk: '#6fb8ff', kare: 'halka', hot: 0.4, a: 0.3, fi: 0, fo: 0.3 });
    P({ p: _v3, mod: 1, omur: 1.2, boy: 0.5, boy2: 5.5, renk: '#dff6ff', kare: 'kar', normal: true, rot: 'r', rotHiz: 0.6, hot: 0.2, a: 0.4, fi: 0.1, fo: 0.5 });
    surec(MAX / HIZ, (kk, dt, yas, is) => { const r = HIZ * yas * 0.95; is.acc = (is.acc || 0) + dt * 160 * OLCEK;
      while (is.acc >= 1) { is.acc--; const a = RND() * TAU; const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r; if (Math.abs(x) > 3.6 || Math.abs(z) > 4.6) continue;
        _v3.set(x, Z() + 0.08, z);
        if (RND() < 0.55) P({ p: _v3, v: _v2.set(Math.cos(a) * 0.6, rr(0.2, 0.6), Math.sin(a) * 0.6), drag: 1.5, omur: rr(0.7, 1.1), boy: rr(0.25, 0.4), boy2: rr(0.6, 0.85), renk: '#f4fcff', renk2: '#bfe6ff', kare: 'duman', normal: true, rot: 'r', a: 0.5, hot: 0 });
        else P({ p: _v3, v: _v2.set(0, rr(0.3, 1.0), 0), omur: rr(0.6, 1.0), boy: rr(0.07, 0.13), renk: '#ffffff', renk2: '#a8e4ff', kare: RND() < 0.5 ? 'kar' : 'yildiz4', rot: 'r', rotHiz: rr(-2, 2), hot: 1 }); } });
    hs.forEach(t => { const d = Math.hypot(t.p.x - c.x, t.p.z - c.z); zamanla(d / HIZ, () => {
      const tp = _v4.copy(t.p).setY(t.p.y + 0.4 * t.h).clone();
      flas(tp, { renk: '#cfefff', boy: 0.8, sure: 0.18, isik: false });
      for (let i = 0, n = N(8 * g); i < n; i++) { kureY(_v2, 0.8).multiplyScalar(rr(1, 2.2)); P({ p: tp, v: _v2, g: 7, omur: rr(0.5, 0.75), boy: rr(0.16, 0.28), renk: '#f2fdff', renk2: '#8fd6ff', kare: 'buz', rot: 'r', rotHiz: rr(-5, 5), hot: 0.6, sek: 0.05 }); }
      dekal(t.p, { r: 0.6, renk: '#dff6ff', kare: 'kar', additive: true, a: 0.55, sure: 1.6 }); }); });
  },
  // Gölge Tilki: yay ipinde ışık, gölge oku + mor iz → çapraz kesik, kara patlama
  golgeOk(k, hs, o) {
    const h = hs[0]; if (!h) return; const g = o.guc, el = new THREE.Vector3().copy(k.p).setY(k.p.y + 0.65 * k.h);
    _v4.set(0, 1, 0); P({ p: el, mod: 2, eksen: _v4, omur: 0.3, boy: 1, en: 0.12, uz: 0.9, renk: '#e9d2ff', kare: 'isin', hot: 1, fi: 0.2 });
    flas(el, { renk: '#b07cff', boy: 0.5, sure: 0.2, halka: false });
    mermi(el, h.o || h.p, ON_SURE.golgeOk, { tur: 'ok', renk: '#a46cff', guc: 1.6 * g, varisGuc: 1.4, bitis: (B) => {
      for (const r of [-0.8, 0.8]) P({ p: B, omur: 0.3, boy: 0.8 * g, boy2: 1.2 * g, en: 1.6, renk: '#ffffff', renk2: '#a46cff', kare: 'kesik', rot: r + Math.PI / 2, hot: 1, fi: 0, fo: 0.3 });
      for (let i = 0, n = N(10); i < n; i++) { kureY(_v2, 0.3).multiplyScalar(rr(0.8, 2)); P({ p: B, v: _v2, drag: 2.5, omur: rr(0.5, 0.8), boy: rr(0.25, 0.4), boy2: 0.8, renk: '#2a1442', renk2: '#100818', kare: 'duman', normal: true, rot: 'r', a: 0.7, hot: 0 }); }
      sars(0.12 * g);
    } });
    // gölge izi: okun ardında kara duman
    surec(ON_SURE.golgeOk, (kk, dt, yas, is) => { _v3.lerpVectors(el, _v4.copy(h.p).setY(h.p.y + 0.5 * h.h), kk); for (let i = 0; i < 3; i++) { _v4.copy(_v3).addScaledVector(kureY(_v2, 0), 0.05); P({ p: _v4, v: kureY(_v2, 0).multiplyScalar(0.25), drag: 2, omur: rr(0.45, 0.65), boy: 0.24, boy2: 0.5, renk: '#3a1a5a', renk2: '#140a22', kare: 'duman', normal: true, rot: 'r', a: 0.65, hot: 0 }); } });
  },
  // Fırtına Ejderi: gökten 3 yıldırım; yerde şok, kıvılcım, yanık
  yildirim(k, hs, o) {
    const g = o.guc;
    flas(_v3.copy(k.p).setY(k.p.y + 0.9 * k.h), { renk: '#fff27a', boy: 0.8, sure: 0.2 });
    hs.slice(0, 3).forEach((h, i) => zamanla(i * 0.09, () => {
      const alt = new THREE.Vector3().copy(h.p).setY(h.p.y + 0.15), ust = alt.clone().add(_v2.set(rr(-0.8, 0.8), 7.5, rr(-0.8, 0.8)));
      zincir(ust, alt, { renk: '#fff27a', sure: 0.32, kalin: 0.16 * g, dal: 3 });
      flas(_v3.copy(alt).setY(alt.y + 0.3), { renk: '#fff6a0', boy: 1.5 * g, sure: 0.25, isikGuc: 10 });
      sok(alt, { renk: '#fff27a', r: 1.0 * g, toz: true, tozRenk: '#8a7a6a', tozN: 8 });
      patlama(_v3.copy(alt).setY(alt.y + 0.2), { renk: '#fff27a', n: 16, hiz: 4, guc: g });
      dekal(alt, { r: 0.6, renk: '#1a1410', a: 0.8 }); sars(0.2 * g);
    }));
  },
};
function iyiles(d, renk) {
  const p = konum(d.o || d.p || d, new THREE.Vector3()), h = d.h || 1;
  // halka biçiminde yükselen artılar + yerden yumuşak ışık sütunu (kabarcık yok: iyileşme tek bakışta okunsun)
  for (let i = 0, n = N(8); i < n; i++) { const a = i / n * TAU + rr(0, 0.3); _v3.set(p.x + Math.cos(a) * 0.34, p.y + rr(0.05, 0.3) * h, p.z + Math.sin(a) * 0.34);
    P({ p: _v3, v: _v2.set(0, rr(0.8, 1.3), 0), drag: 0.6, omur: rr(0.7, 0.95), boy: rr(0.14, 0.2), renk, renk2: '#ffffff', kare: 'arti', hot: 0.6, fo: 0.6 }); }
  sutun(p, { renk, ic: '#efffe8', h: 1.5 * h, en: 0.55, sure: 0.55, zerre: false });
  _v3.set(p.x, Z() + 0.05, p.z); P({ p: _v3, mod: 1, omur: 0.6, boy: 0.5, boy2: 1.1, renk, kare: 'halka', hot: 0.5, a: 0.8, fi: 0, fo: 0.3 });
}

// ───────────────────────── durum (sürekli) efektleri ─────────────────────────
function kalkanAl() { for (const k of kalkanHavuz) if (!k.userData.dolu) { k.userData.dolu = true; return k; } return null; }
const DURUM = {
  sersem(c, dt, t, p, h) { const y = p.y + h + 0.22; for (let i = 0; i < 3; i++) { const a = t * 4.5 + i * TAU / 3; _v3.set(p.x + Math.cos(a) * 0.34, y + Math.sin(a * 2) * 0.05, p.z + Math.sin(a) * 0.34);
      P({ p: _v3, omur: -1, boy: 0.3, renk: '#ffd23a', kare: 'yildiz4', normal: true, rot: t * 3 + i, hot: 0.55 }); P({ p: _v3, omur: -1, boy: 0.42, renk: '#ffb02e', kare: 'parilti', hot: 0.4, a: 0.6 });
      if (RND() < dt * 10 * OLCEK) P({ p: _v3, omur: 0.3, boy: 0.1, boy2: 0.02, renk: '#fff1a8', kare: 'parilti', hot: 1 }); } },
  buz(c, dt, t, p, h) { for (let i = 0; i < 5; i++) { const a = i * TAU / 5 + 0.4; _v3.set(p.x + Math.cos(a) * 0.32, Z() + 0.2, p.z + Math.sin(a) * 0.32); _v2.set(Math.cos(a) * 0.5, 1, Math.sin(a) * 0.5);
      P({ p: _v3, mod: 2, eksen: _v2, omur: -1, boy: 0.42 + (i % 2) * 0.1, en: 0.9, uz: 1.3, renk: '#d6f3ff', kare: 'buz', normal: true, hot: 0.4, a: 0.95 }); }
    _v3.set(p.x, Z() + 0.04, p.z); P({ p: _v3, mod: 1, omur: -1, boy: 1.15, renk: '#bfe9ff', kare: 'kar', normal: true, rot: 0.3, hot: 0.3, a: 0.55 });
    P({ p: _v3, mod: 1, omur: -1, boy: 1.4, renk: '#4fa8ff', kare: 'parilti', hot: 0.2, a: 0.45 });
    if (RND() < dt * 8 * OLCEK) { _v3.set(p.x + rr(-0.3, 0.3), p.y + rr(0.2, 0.9) * h, p.z + rr(-0.3, 0.3)); P({ p: _v3, v: _v2.set(0, -0.2, 0), omur: 0.8, boy: 0.12, renk: '#9fdcff', kare: 'kar', rot: 'r', rotHiz: 2, hot: 0.6 }); } },
  yanik(c, dt, t, p, h) { c.acc += dt * 24 * OLCEK; while (c.acc >= 1) { c.acc--; _v3.set(p.x + rr(-0.26, 0.26), p.y + rr(0.15, 0.8) * h, p.z + rr(-0.26, 0.26));
      if (RND() < 0.8) P({ p: _v3, v: _v2.set(0, rr(0.9, 1.5), 0), omur: rr(0.35, 0.5), boy: rr(0.26, 0.38), boy2: 0.06, renk: '#ffd23a', renk2: '#ff3d1a', kare: 'alev', normal: true, rot: rr(-0.3, 0.3), hot: 0.45 });
      else P({ p: _v3, v: _v2.set(rr(-0.3, 0.3), rr(1, 2), rr(-0.3, 0.3)), omur: 0.5, boy: 0.07, uz: 2, en: 0.6, renk: '#ffd36a', renk2: '#ff6a1f', kare: 'kivilcim', mod: 2, uzat: 0.12, hot: 1 }); }
    _v3.set(p.x, p.y + 0.45 * h, p.z); P({ p: _v3, omur: -1, boy: 1.1 * h, renk: '#ff6a1f', kare: 'parilti', hot: 0.2, a: 0.35 + Math.sin(t * 17) * 0.08 }); },
  zehir(c, dt, t, p, h) { c.acc += dt * 13 * OLCEK; while (c.acc >= 1) { c.acc--; _v3.set(p.x + rr(-0.3, 0.3), p.y + rr(0.3, 0.95) * h, p.z + rr(-0.3, 0.3));
      if (RND() < 0.75) P({ p: _v3, v: _v2.set(0, rr(0.3, 0.6), 0), omur: rr(0.5, 0.8), boy: rr(0.12, 0.2), boy2: rr(0.2, 0.26), renk: '#3f9a2a', renk2: '#1f5a14', kare: 'kabarcik', normal: true, hot: 0.3, a: 0.92, salin: 0.04, fo: 0.85 });
      else P({ p: _v3, v: _v2.set(0, -0.3, 0), g: 4, omur: 0.4, boy: 0.12, renk: '#5fd03a', kare: 'damla', normal: true, mod: 2, uzat: 0.1, hot: 0.4 }); }
    c.kf = (c.kf || 0) + dt; if (c.kf > 1.3) { c.kf = 0; _v3.set(p.x, p.y + h + 0.25, p.z); P({ p: _v3, v: _v2.set(0, 0.35, 0), omur: 0.9, boy: 0.18, boy2: 0.32, renk: '#9cff5a', kare: 'kafatasi', normal: true, hot: 0, a: 0.95, fi: 0.15, fo: 0.6 }); }
    _v3.set(p.x, Z() + 0.04, p.z); P({ p: _v3, mod: 1, omur: -1, boy: 1.0, renk: '#2f8a1a', kare: 'duman', normal: true, rot: t * 0.3, hot: 0, a: 0.45 }); },
  lanet(c, dt, t, p, h) { _v3.set(p.x, p.y + h + 0.38 + Math.sin(t * 3) * 0.05, p.z); const n = 1 + Math.sin(t * 6) * 0.08;
    P({ p: _v3, omur: -1, boy: 0.95 * n, renk: '#7a2cff', kare: 'parilti', hot: 0.2, a: 0.55 }); P({ p: _v3, omur: -1, boy: 0.6 * n, renk: '#c48cff', kare: 'goz', normal: true, hot: 0.6 });
    c.acc += dt * 8 * OLCEK; while (c.acc >= 1) { c.acc--; _v4.set(p.x + rr(-0.3, 0.3), p.y + rr(0.1, 0.6) * h, p.z + rr(-0.3, 0.3)); P({ p: _v4, v: _v2.set(0, rr(0.3, 0.6), 0), omur: rr(0.7, 1), boy: rr(0.22, 0.32), boy2: 0.45, renk: '#4a2270', renk2: '#1a0a2a', kare: 'duman', normal: true, rot: 'r', a: 0.55, hot: 0 }); } },
  kalkan(c, dt, t, p, h) {
    const m = c.mesh; if (!m) return; c.yas += dt; m.position.set(p.x, p.y + h * 0.5, p.z);
    const pop = c.kapan >= 0 ? Math.max(0, 1 - c.kapan / 0.2) : Math.min(1, c.yas / 0.18);
    const s = h * 1.25 * (c.kapan >= 0 ? 1 + (1 - pop) * 0.3 : (0.6 + 0.4 * pop + Math.sin(Math.min(1, c.yas / 0.35) * Math.PI) * 0.12)); m.scale.setScalar(s);
    m.material.uniforms.uA.value = 0.9 * pop; m.material.uniforms.uT.value = t;
    if (RND() < dt * 4 * OLCEK) { kureY(_v2, 0.2).multiplyScalar(s * 0.5); _v3.set(p.x, p.y + h * 0.5, p.z).add(_v2); P({ p: _v3, omur: 0.4, boy: 0.12, boy2: 0.02, renk: '#fff6d0', kare: 'yildiz4', rot: 'r', hot: 1 }); } },
  davul(c, dt, t, p, h) { _v3.set(p.x, Z() + 0.05, p.z); P({ p: _v3, mod: 1, omur: -1, boy: 1.15 + Math.sin(t * 8) * 0.08, renk: '#ff8a1f', kare: 'sok', normal: true, rot: t, hot: 0.3, a: 0.7 });
    c.acc += dt * 14 * OLCEK; while (c.acc >= 1) { c.acc--; _v3.set(0, rr(0, 0.2) * h, 0); P({ p: _v3, takip: c.nesne, yorunge: { r: rr(0.32, 0.45), w: rr(2.5, 4), vy: rr(0.6, 1.2) * h }, omur: rr(0.6, 0.9), boy: rr(0.12, 0.18), boy2: 0.03, renk: '#ff9a1f', kare: RND() < 0.4 ? 'yildiz4' : 'parilti', hot: 0.7 }); } },
  hiz(c, dt, t, p, h) { c.acc += dt * 14 * OLCEK; while (c.acc >= 1) { c.acc--; const a = RND() * TAU; _v3.set(p.x + Math.cos(a) * 0.34, p.y + rr(0, 0.5) * h, p.z + Math.sin(a) * 0.34);
      P({ p: _v3, v: _v2.set(0, rr(1.5, 2.5), 0), drag: 1.5, omur: rr(0.3, 0.45), boy: 0.13, uz: 1.6, en: 0.5, renk: '#9fe4ff', renk2: '#2f6bff', kare: 'kivilcim', mod: 2, uzat: 0.25, hot: 0.7 }); }
    _v3.set(p.x, Z() + 0.05, p.z); P({ p: _v3, mod: 1, omur: -1, boy: 1.05, renk: '#4f9bff', kare: 'halka', normal: true, hot: 0.3, a: 0.6 }); },
  ofke(c, dt, t, p, h) { c.acc += dt * 7 * OLCEK; while (c.acc >= 1) { c.acc--; _v3.set(p.x + rr(-0.15, 0.15), p.y + h * 0.85, p.z + rr(-0.15, 0.15));
      P({ p: _v3, v: _v2.set(rr(-0.3, 0.3), rr(0.8, 1.3), rr(-0.3, 0.3)), drag: 1.8, omur: rr(0.6, 0.9), boy: 0.2, boy2: 0.55, renk: '#ffffff', renk2: '#e0d6dc', kare: 'duman', normal: true, rot: 'r', a: 0.7, hot: 0 }); }
    _v3.set(p.x, Z() + 0.05, p.z); P({ p: _v3, mod: 1, omur: -1, boy: 1.1 + Math.sin(t * 10) * 0.06, renk: '#ff3d2a', kare: 'sok', normal: true, rot: -t, hot: 0.3, a: 0.7 });
    _v3.set(p.x, p.y + 0.5 * h, p.z); P({ p: _v3, omur: -1, boy: 1.2 * h, renk: '#ff2a10', kare: 'parilti', hot: 0.1, a: 0.3 + Math.sin(t * 12) * 0.08 });
    if (RND() < dt * 10 * OLCEK) { _v3.set(p.x + rr(-0.3, 0.3), p.y + rr(0.1, 0.6) * h, p.z + rr(-0.3, 0.3)); P({ p: _v3, v: _v2.set(0, rr(1, 2), 0), omur: 0.5, boy: 0.07, uz: 2, en: 0.6, renk: '#ff6a2a', kare: 'kivilcim', mod: 2, uzat: 0.12, hot: 1 }); } },
  yildiz3(c, dt, t, p, h) { // ★3: ayak altında altın parıltı halkası
    _v3.set(p.x, Z() + 0.035, p.z); P({ p: _v3, mod: 1, omur: -1, boy: 1.15, renk: '#ffc83a', kare: 'halka', normal: true, hot: 0.4, a: 0.75 }); P({ p: _v3, mod: 1, omur: -1, boy: 1.2, renk: '#ffd76a', kare: 'run', rot: t * 0.5, hot: 0.4, a: 0.45 });
    if (RND() < dt * 6 * OLCEK) { const a = RND() * TAU; _v3.set(p.x + Math.cos(a) * 0.5, Z() + 0.1, p.z + Math.sin(a) * 0.5); P({ p: _v3, v: _v2.set(0, 0.6, 0), omur: 0.6, boy: 0.12, renk: '#ffe45a', kare: 'yildiz4', rot: 'r', hot: 0.8 }); } },
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
      vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); vP = position; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform float uA; uniform float uT; uniform vec3 uR; varying vec3 vN; varying vec3 vV; varying vec3 vP;
        void main(){ float f = pow(1.0 - abs(dot(normalize(vN), vV)), 2.2); float bant = smoothstep(0.85, 1.0, sin(vP.y * 22.0 - uT * 4.0) * 0.5 + 0.5);
          float alt = smoothstep(-0.5, -0.1, vP.y);
          vec2 hq = vec2(atan(vP.z, vP.x) * 1.9, vP.y * 7.0); vec2 hr = vec2(1.0, 1.732); vec2 ha = mod(hq, hr) - hr * 0.5, hb = mod(hq - hr * 0.5, hr) - hr * 0.5;
          vec2 hg = dot(ha, ha) < dot(hb, hb) ? ha : hb; float hk = max(abs(hg.x) * 0.866 + abs(hg.y) * 0.5, abs(hg.y)); float hex = smoothstep(0.4, 0.47, hk);
          float a = uA * (0.03 + f * 0.8 + bant * 0.1 * f + hex * 0.22) * alt; gl_FragColor = vec4(mix(uR, vec3(1.0), f * 0.6), a); }` });
    const m = new THREE.Mesh(kureG, mat); m.visible = false; m.renderOrder = 32; m.name = 'vfx_kalkan'; sahne.add(m); kalkanHavuz.push(m);
  }
  if (kalite === 'yuksek' && o.isik !== false) { isik = new THREE.PointLight('#ffd08a', 0, 5.5, 1.6); isik.position.set(0, -50, 0); sahne.add(isik); }
  return vfx;
}
function birak() {
  if (!sahne) return;
  for (const s of [sAdd, sNrm]) if (s) { sahne.remove(s.mesh); s.g.dispose(); s.mat.dispose(); }
  for (const m of kayaHavuz) sahne.remove(m); for (const m of kalkanHavuz) { sahne.remove(m); m.material.dispose(); }
  if (isik) sahne.remove(isik); if (atlas) atlas.tex.dispose();
  kayaHavuz.length = 0; kalkanHavuz.length = 0; isik = null; isler = []; durumlar.clear(); takipOn.clear(); sahne = null;
}
function guncelle(dt) {
  if (!sahne) return;
  dt = Math.max(0, Math.min(0.1, dt || 0)); kareNo++;
  kutKisma = simdi() - kutBas < 1.2 ? 0.5 : 1;
  // 1) yaşlandır / öldür
  sAdd.guncelle(dt); sNrm.guncelle(dt);
  // 2) zamanlanmış işler (yeni parçacık doğurur)
  const liste = isler; isler = [];
  for (const is of liste) {
    if (is.g > 0) { is.g -= dt; if (is.g > 0) { isler.push(is); continue; } }
    if (is.tek) { is.fn(); continue; }
    if (!is.acik) continue;
    is.yas += dt; const k = Math.min(1, is.yas / is.s); is.fn(k, dt, is.yas, is); if (k < 1) isler.push(is);
  }
  // 3) durum efektleri
  const t = performance.now() / 1000;
  for (const [nesne, harita] of durumlar) {
    const p = takipPoz(nesne), h = boyAl(nesne), gor = nesne.visible !== false && !!nesne.parent;
    for (const [tur, c] of harita) {
      if (c.kapan >= 0) { c.kapan += dt; if (tur === 'kalkan') DURUM.kalkan(c, dt, t, p, h); if (c.kapan > 0.2 || tur !== 'kalkan') { if (c.mesh) { c.mesh.visible = false; c.mesh.userData.dolu = false; } harita.delete(tur); } continue; }
      if (gor && DURUM[tur]) { ONCELIK = 0; DURUM[tur](c, dt, t, p, h); ONCELIK = 1; }
    }
    if (!harita.size) durumlar.delete(nesne);
  }
  // 4) ışık
  if (isik) { isikYas += dt; isik.intensity = isikGuc * Math.max(0, 1 - isikYas / isikSure) ** 2; }
  // 5) GPU'ya yaz
  sAdd.yaz(takipPoz); sNrm.yaz(takipPoz);
}
function sars(g) { sarsGuc = Math.min(0.35, Math.max(sarsGuc * Math.exp(-(simdi() - sarsT) * 9), 0) + g); sarsT = simdi(); }
const _sars = new THREE.Vector3();
function sarsintiOfset() { const e = sarsGuc * Math.exp(-(simdi() - sarsT) * 9); if (e < 0.002) return _sars.set(0, 0, 0); const t = simdi() * 60; return _sars.set(Math.sin(t * 1.3) * e, Math.sin(t * 1.7 + 1) * e * 0.6, Math.cos(t * 1.1) * e * 0.5); }
function ekranFlas(renk = '#ffe6a0', guc = 0.5, sure = 0.35) { flasRenk = rgb(renk); flasGuc = guc; flasBas = simdi(); flasSure = sure; }
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
  const c = flasRenk.map(v => Math.round(v * 255)).join(',');
  ctx.save(); const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.72);
  g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(0.6, `rgba(164,108,255,${a * 0.6})`); g.addColorStop(1, `rgba(${c},${Math.min(0.35, a * 1.4)})`); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); ctx.restore();
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
    const op = { ...o, guc: (o.guc || 1) * (o.kut ? 1.35 : 1), dostlar: (o.dostlar || []).map(birim).filter(Boolean) };
    YETENEK[ad](k, hs, op);
    return { sure: ON_SURE[ad] || 0 };
  },
  onSure(ad) { return ON_SURE[ad] || 0; },
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
  // Sürekli durum efekti: birimi (Object3D) izler. tur: sersem|buz|yanik|zehir|lanet|kalkan|davul|hiz|ofke|yildiz3
  durum(nesne, tur, acik = true, o = {}) {
    if (!sahne || !nesne || !DURUM[tur]) return;
    if (o.boy) nesne.userData.vfxBoy = o.boy;
    let h = durumlar.get(nesne);
    if (acik) {
      if (!h) { h = new Map(); durumlar.set(nesne, h); }
      const c = h.get(tur); if (c && c.kapan < 0) return; if (c) { c.kapan = -1; return; }
      const yeni = { acc: 0, yas: 0, kapan: -1, nesne, mesh: null };
      if (tur === 'kalkan') { yeni.mesh = kalkanAl(); if (yeni.mesh) { yeni.mesh.visible = true; yeni.mesh.material.uniforms.uR.value.set(...rgb(o.renk || '#ffe9a8')); } }
      h.set(tur, yeni);
    } else if (h && h.get(tur)) { const c = h.get(tur); if (c.kapan < 0) { c.kapan = 0; if (tur === 'kalkan') { const p = takipPoz(nesne), hh = boyAl(nesne); _v3.set(p.x, p.y + hh * 0.5, p.z); patlama(_v3, { renk: '#fff1a8', n: 10, hiz: 2, g: 2, yildiz: true }); } } }
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
  // ── tanı ──
  get sayac() { return sAdd ? { additive: sAdd.n, normal: sNrm.n, is: isler.length, durum: durumlar.size } : null; },
  get atlasTuval() { return atlas && atlas.cv; },
  KARE, YETENEKLER: Object.keys(YETENEK),
};
export default vfx;
