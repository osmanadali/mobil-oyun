// Ray — metro hattı bağlama bulmacası. Tek dokunuş: karoyu çevir.
(() => {
'use strict';
const $ = id => document.getElementById(id);
const N = 1, E = 2, S = 4, W = 8;
const DIRS = [[N, 0, -1, S], [E, 1, 0, W], [S, 0, 1, N], [W, -1, 0, E]];
const rot = m => ((m << 1) | (m >> 3)) & 15;          // saat yönü 90°
const LINES_DARK = ['#ffb35c', '#4fc3a1', '#7ea6ff', '#ff7a8a', '#b394ff', '#5ccfe6'];
const LINES_LIGHT = ['#f08a24', '#1fa383', '#4a7fe0', '#e8566c', '#8c6ae0', '#1a9fbd'];
const INTER_EVERY = 4;                                  // her 4 bölümde 1 geçiş reklamı
const DAILY_FREE_HINTS = 3;
const SHARE_URL = 'https://osmanadali.github.io/mobil-oyun/';
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28];

// ---------- kayıt ----------
const today = () => new Date().toISOString().slice(0, 10);
const def = { level: 1, stars: {}, hints: DAILY_FREE_HINTS, hintDay: '', streak: 0, lastDaily: '', dailyDone: '', dailyStats: null, sound: true, vib: true, theme: 'auto', played: 0 };
let save;
try { save = Object.assign({}, def, JSON.parse(localStorage.getItem('ray') || '{}')); } catch { save = { ...def }; }
const persist = () => { try { localStorage.setItem('ray', JSON.stringify(save)); } catch {} };
if (save.hintDay !== today()) { save.hints = Math.max(save.hints, DAILY_FREE_HINTS); save.hintDay = today(); persist(); }

// ---------- tema / palet ----------
let pal = {};
const isLight = () => save.theme === 'light' || (save.theme === 'auto' && matchMedia('(prefers-color-scheme: light)').matches);
function applyTheme() {
  if (save.theme === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.dataset.theme = save.theme;
  const cs = getComputedStyle(document.documentElement), v = n => cs.getPropertyValue(n).trim();
  pal = { tile: v('--tile'), stroke: v('--stroke'), rail: v('--rail'), mut: v('--mut'), bg: v('--bg0'), fg: v('--fg'), light: isLight() };
  document.querySelector('meta[name=theme-color]').content = pal.light ? '#f7f2ec' : '#0e1120';
  if (G) { setLineColor(); draw(); }
}
matchMedia('(prefers-color-scheme: light)').addEventListener?.('change', applyTheme);
function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; }

// ---------- rastgele ----------
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hashStr = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

function sizeFor(l) {
  const t = [[3, 3, 3], [8, 4, 4], [15, 4, 5], [25, 5, 6], [40, 5, 7], [60, 6, 8], [1e9, 7, 9]];
  for (const [max, c, r] of t) if (l <= max) return [c, r];
}

// ---------- üretim: merkezden rastgele ağaç (her zaman çözülebilir) ----------
function generate(cols, rows, seed) {
  const R = rng(seed), n = cols * rows, sol = new Array(n).fill(0);
  const hub = (rows >> 1) * cols + (cols >> 1), inT = new Array(n).fill(false);
  inT[hub] = true;
  const frontier = [];
  let tries = 0;
  const addF = i => { const x = i % cols, y = i / cols | 0; for (const [b, dx, dy, o] of DIRS) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < cols && ny < rows) frontier.push([i, ny * cols + nx, b, o]); } };
  addF(hub);
  while (frontier.length) {
    const k = R() * frontier.length | 0, e = frontier.splice(k, 1)[0], [a, b, ba, ob] = e;
    if (inT[b]) continue;
    // kavşakları seyrelt → daha okunur, uzun hatlar
    if (popc(sol[a]) >= 2 && R() < .6 && tries++ < 40) { frontier.push(e); continue; }
    tries = 0;
    sol[a] |= ba; sol[b] |= ob; inT[b] = true; addF(b);
  }
  const cur = sol.map(m => { let r = R() * 4 | 0, v = m; while (r--) v = rot(v); return v; });
  // çözülmüş hâlde gelmesin
  if (cur.every((v, i) => v === sol[i])) cur[hub === 0 ? 1 : 0] = rot(cur[hub === 0 ? 1 : 0]);
  let par = 0;
  cur.forEach((v, i) => { let r = 0, t = v; while (t !== sol[i] && r < 4) { t = rot(t); r++; } par += r; });
  return { cols, rows, sol, cur, hub, par, fixed: new Array(n).fill(false) };
}
function popc(m) { return (m & 1) + (m >> 1 & 1) + (m >> 2 & 1) + (m >> 3 & 1); }

// ---------- bağlantı ----------
function lit(P) {
  const { cols, rows, cur, hub } = P, d = new Array(cur.length).fill(-1), q = [hub];
  d[hub] = 0;
  let loose = 0;
  while (q.length) {
    const i = q.shift(), x = i % cols, y = i / cols | 0;
    for (const [b, dx, dy, o] of DIRS) {
      if (!(cur[i] & b)) continue;
      const nx = x + dx, ny = y + dy, j = ny * cols + nx;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || !(cur[j] & o)) { loose++; continue; }
      if (d[j] < 0) { d[j] = d[i] + 1; q.push(j); }
    }
  }
  return { d, n: d.filter(v => v >= 0).length, solved: loose === 0 && d.every(v => v >= 0) };
}

// ---------- ses / dokunsal ----------
let ac;
function tone(f, dur = .08, vol = .05, type = 'sine', at = 0) {
  if (!save.sound) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    const t = ac.currentTime + at, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .008);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + .02);
  } catch {}
}
const note = k => 392 * Math.pow(2, PENTA[Math.max(0, Math.min(PENTA.length - 1, k))] / 12);
function haptic(kind) {
  if (!save.vib) return;
  try {
    const H = window.Capacitor?.Plugins?.Haptics;
    if (H) { kind === 'win' ? H.notification({ type: 'SUCCESS' }) : H.impact({ style: kind === 'heavy' ? 'MEDIUM' : 'LIGHT' }); return; }
    navigator.vibrate?.(kind === 'win' ? [15, 50, 25] : kind === 'heavy' ? 16 : 7);
  } catch {}
}

// ---------- UI yardımcıları ----------
let toastT;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2000); }
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  document.body.classList.toggle('playing', id === 'game');
  if (id === 'home') refreshHome(); else requestAnimationFrame(resize);
  clearInterval(clockT); if (id === 'home') clockT = setInterval(dailyClock, 1000);
}
function modal(html, binds = {}) {
  $('mCard').innerHTML = html; $('modal').classList.add('open');
  for (const [id, fn] of Object.entries(binds)) { const el = $(id); if (el) el.onclick = fn; }
}
const closeModal = () => $('modal').classList.remove('open');
$('modal').onclick = e => { if (e.target.id === 'modal' && !G?.won) closeModal(); };
const bump = el => { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); };
const totalStars = () => Object.values(save.stars).reduce((a, b) => a + b, 0);
const fmtT = ms => { const s = Math.round(ms / 1000); return `${s / 60 | 0}:${String(s % 60).padStart(2, '0')}`; };
const STAR = '<svg viewBox="0 0 24 24"><path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"/></svg>';

// her düğmede dokunma dalgası
document.addEventListener('pointerdown', e => {
  const b = e.target.closest('.btn,.ic'); if (!b) return;
  const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2.2, sp = document.createElement('i');
  sp.className = 'rip'; sp.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
  if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
  b.style.overflow = 'hidden'; b.appendChild(sp); setTimeout(() => sp.remove(), 600);
  haptic(); tone(1400, .03, .02, 'triangle');
}, { passive: true });

let clockT;
function dailyClock() {
  if (save.dailyDone !== today()) return;
  const n = new Date(), m = new Date(n); m.setHours(24, 0, 0, 0);
  const s = (m - n) / 1000 | 0;
  $('dailyState').textContent = `Yeni hat ${String(s / 3600 | 0).padStart(2, '0')}:${String(s / 60 % 60 | 0).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
function refreshHome() {
  $('sStars').textContent = totalStars();
  $('sStreak').textContent = save.streak;
  $('sHints').textContent = save.hints;
  $('hLevel').textContent = save.level;
  const done = save.dailyDone === today();
  $('bDaily').classList.toggle('done', done);
  $('dailyTitle').textContent = done ? 'Tamamlandı ✓' : 'Hazır';
  if (done) dailyClock(); else $('dailyState').textContent = save.streak ? `🔥 ${save.streak} günlük serini koru` : 'Her gün yeni bir hat';
  const nextR = Math.ceil(save.level / 10) * 10 || 10;
  $('nextReward').textContent = `+2 ipucu → Bölüm ${nextR}`;
  $('progBar').style.width = (((save.level - 1) % 10) / 10 * 100 + 4) + '%';
  const [c, r] = sizeFor(save.level); $('sSize').textContent = `${c}×${r} ızgara`;
}

// ---------- oyun durumu ----------
let G = null;
const cv = $('cv'), cx = cv.getContext('2d');
let geo = { s: 0, ox: 0, oy: 0, dpr: 1 };
const anim = new Map(), press = new Map();   // i -> başlangıç zamanı
let litAt = [], ripples = [], parts = [], winT = 0, raf = 0;

function setLineColor() {
  const k = G.daily ? 2 : Math.floor((G.lvl - 1) / 5) % LINES_DARK.length;
  G.color = (pal.light ? LINES_LIGHT : LINES_DARK)[k];
  $('game').style.setProperty('--line', G.color);
}
function start(mode) {
  const daily = mode === 'daily', lvl = save.level;
  const [c, r] = daily ? [6, 8] : sizeFor(lvl);
  const seed = daily ? hashStr('ray' + today()) : lvl * 7919 + 13;
  G = { ...generate(c, r, seed), daily, lvl, moves: 0, won: false, t0: performance.now() };
  setLineColor();
  G.L = lit(G); anim.clear(); press.clear(); ripples = []; parts = []; winT = 0;
  litAt = G.L.d.map(v => v >= 0 ? -1e9 : 0);
  $('gTitle').textContent = daily ? 'Günün Hattı' : 'Bölüm ' + lvl;
  $('gHints').textContent = save.hints;
  hud(); show('game');
  if (!daily && lvl === 1) setTimeout(() => toast('Karoya dokun → döner'), 500);
}
function hud() {
  $('gMoves').textContent = `${G.cols}×${G.rows} ızgara${G.daily ? ' · ' + new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) : ''}`;
  const p = $('gPar'); p.textContent = `${G.moves} / ${G.par}`; p.style.color = G.moves > G.par ? 'var(--mut)' : '';
  const pct = Math.round(G.L.n / G.cur.length * 100);
  $('gBar').style.width = pct + '%'; $('gPct').textContent = pct + '%';
}

function resize() {
  const b = $('board').getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 3);
  cv.width = b.width * dpr; cv.height = b.height * dpr;
  if (!G) return;
  const s = Math.floor(Math.min((b.width - 8) / G.cols, (b.height - 8) / G.rows, 96));
  geo = { s, ox: (b.width - s * G.cols) / 2, oy: (b.height - s * G.rows) / 2, dpr };
  draw();
}
addEventListener('resize', resize);

const ease = t => 1 - Math.pow(1 - t, 3);
const back = t => { const c1 = 1.25, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
function rrp(x, y, w, h, r) { cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
function rr(x, y, w, h, r) { cx.beginPath(); rrp(x, y, w, h, r); }
const DV = [[N, 0, -1], [E, 1, 0], [S, 0, 1], [W, -1, 0]];
// karonun raylarını mevcut yola ekler (ekran koordinatında; save/restore yok)
function railPath(T, m) {
  const [x, y, a, sc] = T, c = Math.cos(a), si = Math.sin(a), L = geo.s / 2 * sc;
  for (const [b, dx, dy] of DV) if (m & b) { cx.moveTo(x, y); cx.lineTo(x + (dx * c - dy * si) * L, y + (dx * si + dy * c) * L); }
}

// Aynı stildeki her şey tek yolda toplanır → kare başına ~15 çizim çağrısı (düşük donanımda akıcı).
function draw() {
  raf = 0;
  if (!G) return;
  const now = performance.now(), { s, ox, oy, dpr } = geo, n = G.cur.length, col = G.color;
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cx.clearRect(0, 0, cv.width / dpr, cv.height / dpr);
  let busy = false;
  // karo dönüşümleri
  const X = [];
  for (let i = 0; i < n; i++) {
    let a = 0, sc = 1;
    if (anim.has(i)) { const t = Math.min((now - anim.get(i)) / 190, 1); a = -(1 - back(t)) * Math.PI / 2; if (t < 1) busy = true; else anim.delete(i); }
    if (press.has(i)) { const t = (now - press.get(i)) / 220; if (t < 1) { sc *= 1 - .09 * Math.sin(t * Math.PI); busy = true; } else press.delete(i); }
    if (winT) { const t = (now - winT - G.L.d[i] * 45) / 320; if (t > 0 && t < 1) sc *= 1 + Math.sin(t * Math.PI) * .1; if (t < 1) busy = true; }
    X.push([ox + (i % G.cols) * s + s / 2, oy + (i / G.cols | 0) * s + s / 2, a, sc]);
  }
  const on = i => G.L.d[i] >= 0;
  cx.lineCap = 'round';
  // 1) zemin
  const tiles = f => { cx.beginPath(); for (let i = 0; i < n; i++) if (f(i)) { const [x, y, , sc] = X[i], w = (s - 6) * sc; rrp(x - w / 2, y - w / 2, w, w, s * .24 * sc); } };
  tiles(() => true); cx.fillStyle = pal.tile; cx.fill(); cx.lineWidth = 1; cx.strokeStyle = pal.stroke; cx.stroke();
  tiles(on); cx.fillStyle = rgba(col, pal.light ? .10 : .07); cx.fill();
  if (G.fixed.includes(true)) { tiles(i => G.fixed[i]); cx.lineWidth = 1.5; cx.strokeStyle = rgba(col, .6); cx.stroke(); }
  // 2) raylar: sönük → ışıma → yanan
  const rails = f => { cx.beginPath(); for (let i = 0; i < n; i++) if (f(i)) railPath(X[i], G.cur[i]); cx.stroke(); };
  cx.lineWidth = s * .17; cx.strokeStyle = pal.rail; rails(i => !on(i));
  cx.lineWidth = s * .38; cx.strokeStyle = rgba(col, pal.light ? .16 : .22); rails(on);
  cx.lineWidth = s * .17; cx.strokeStyle = col; rails(on);
  // 3) yeni yanan karoda parlama
  for (let i = 0; i < n; i++) {
    if (!on(i)) continue;
    const t = (now - litAt[i]) / 420;
    if (t < 1) { busy = true; if (t > 0) { cx.strokeStyle = `rgba(255,255,255,${.65 * (1 - t)})`; cx.beginPath(); railPath(X[i], G.cur[i]); cx.stroke(); } }
  }
  // 4) duraklar
  const dots = (f, r) => { cx.beginPath(); for (let i = 0; i < n; i++) if (i !== G.hub && popc(G.cur[i]) === 1 && f(i)) { const [x, y, , sc] = X[i]; cx.moveTo(x + r * sc, y); cx.arc(x, y, r * sc, 0, 7); } };
  dots(on, s * .27); cx.fillStyle = rgba(col, .22); cx.fill();
  cx.lineWidth = s * .065;
  dots(on, s * .15); cx.fillStyle = '#fff'; cx.fill(); cx.strokeStyle = col; cx.stroke();
  dots(i => !on(i), s * .15); cx.fillStyle = pal.bg; cx.fill(); cx.strokeStyle = pal.mut; cx.stroke();
  // 5) merkez istasyon
  {
    const [x, y, , sc] = X[G.hub], k = s * sc;
    cx.fillStyle = rgba(col, .25); cx.beginPath(); cx.arc(x, y, k * .36, 0, 7); cx.fill();
    const g = cx.createLinearGradient(x - k * .2, y - k * .2, x + k * .2, y + k * .2); g.addColorStop(0, rgba(col, 1)); g.addColorStop(1, rgba(col, .78));
    cx.fillStyle = g; rr(x - k * .22, y - k * .22, k * .44, k * .44, k * .12); cx.fill();
    cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(x, y, k * .075, 0, 7); cx.fill();
  }
  // 6) dokunma dalgaları
  cx.lineWidth = 2.5;
  ripples = ripples.filter(r => {
    const t = (now - r.t) / 420; if (t >= 1) return false;
    cx.strokeStyle = rgba(col, .45 * (1 - t));
    cx.beginPath(); cx.arc(r.x, r.y, s * (.2 + .55 * ease(t)), 0, 7); cx.stroke();
    return busy = true;
  });
  // 7) kıvılcımlar
  parts = parts.filter(p => {
    const t = (now - p.t) / p.life; if (t >= 1) return false; if (t < 0) return busy = true;
    const age = (now - p.t) / 1000;
    cx.fillStyle = rgba(p.c, 1 - t);
    cx.beginPath(); cx.arc(p.x + p.vx * age, p.y + p.vy * age + 260 * age * age, p.r * (1 - t * .6), 0, 7); cx.fill();
    return busy = true;
  });
  if (busy) raf = requestAnimationFrame(draw);
}
const kick = () => { if (!raf) raf = requestAnimationFrame(draw); };
function burst(i, k = 9, delay = 0, color = G.color) {
  const { s, ox, oy } = geo, x = ox + (i % G.cols) * s + s / 2, y = oy + (i / G.cols | 0) * s + s / 2, t = performance.now() + delay;
  for (let j = 0; j < k; j++) {
    const a = j / k * Math.PI * 2 + Math.random() * .5, v = s * (1.2 + Math.random() * 1.4);
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - s * .6, t, life: 520 + Math.random() * 300, r: 1.6 + Math.random() * 2.4, c: Math.random() < .3 ? (pal.light ? '#ffffff' : '#fff6e6') : color });
  }
}

cv.addEventListener('pointerdown', e => {
  if (!G || G.won) return;
  const r = cv.getBoundingClientRect(), { s, ox, oy } = geo, px = e.clientX - r.left, py = e.clientY - r.top;
  const c = Math.floor((px - ox) / s), w = Math.floor((py - oy) / s);
  if (c < 0 || w < 0 || c >= G.cols || w >= G.rows) return;
  const i = w * G.cols + c, now = performance.now();
  if (G.fixed[i]) { haptic('heavy'); tone(180, .12, .04, 'triangle'); toast('Bu karo ipucuyla sabitlendi'); press.set(i, now); kick(); return; }
  G.cur[i] = rot(G.cur[i]); G.moves++;
  anim.set(i, now); press.set(i, now); ripples.push({ x: px, y: py, t: now });
  const prev = G.L.d;
  G.L = lit(G);
  let gained = 0, stations = 0;
  G.L.d.forEach((v, j) => { if (v >= 0 && prev[j] < 0) { litAt[j] = now + v * 12; gained++; if (popc(G.cur[j]) === 1) { stations++; burst(j, 7, v * 12); } } });
  const k = Math.round(G.L.n / G.cur.length * (PENTA.length - 1));
  if (gained) { tone(note(k), .22, .05); if (stations) tone(note(k + 2), .3, .035, 'sine', .06); haptic(stations ? 'heavy' : 'light'); }
  else { tone(G.L.n < prev.filter(v => v >= 0).length ? 330 : 900, .05, .03, 'triangle'); haptic('light'); }
  hud(); kick();
  if (gained) bump($('gPct'));
  if (G.L.solved) win();
});

function starsFor() { return G.moves <= G.par ? 3 : G.moves <= Math.ceil(G.par * 1.6) ? 2 : 1; }
function win() {
  G.won = true; G.time = performance.now() - G.t0;
  winT = performance.now() + 120;
  G.L.d.forEach((v, i) => { litAt[i] = winT + v * 45; if (popc(G.cur[i]) === 1) burst(i, 12, 120 + v * 45); });
  kick();
  [0, 2, 4, 5, 7].forEach((k, j) => tone(note(k + 3), .4, .05, 'sine', .12 + j * .09));
  haptic('win');
  const st = starsFor();
  save.played++;
  let extra = '';
  if (G.daily) {
    if (save.dailyDone !== today()) {
      const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      save.streak = save.lastDaily === y ? save.streak + 1 : 1; save.lastDaily = save.dailyDone = today();
      save.hints++; extra = `🔥 ${save.streak} gün seri · +1 ipucu`;
      save.dailyStats = { moves: G.moves, par: G.par, time: G.time, st };
    }
  } else {
    save.stars[G.lvl] = Math.max(save.stars[G.lvl] || 0, st);
    save.level = G.lvl + 1;
    if (G.lvl % 10 === 0) { save.hints += 2; extra = '🎁 10 bölüm · +2 ipucu'; }
  }
  persist();
  const wait = 120 + Math.max(...G.L.d) * 45 + 650;
  setTimeout(() => {
    modal(`<div class="stars">${[0, 1, 2].map(k => STAR.replace('<svg', `<svg class="${k < st ? 'on' : ''}" style="animation-delay:${.1 + k * .14}s"`)).join('')}</div>
      ${st === 3 ? '<span class="badge">MÜKEMMEL ROTA</span>' : ''}
      <h2>${G.daily ? 'Günün hattı tamam!' : 'Hat açıldı!'}</h2>
      <div class="statrow"><div><b>${G.moves}</b><span>hamle</span></div><div><b>${G.par}</b><span>hedef</span></div><div><b>${fmtT(G.time)}</b><span>süre</span></div></div>
      ${extra ? `<p>${extra}</p>` : ''}
      ${G.daily ? '<button id="mShare" class="btn primary"><span>Paylaş</span><small>Arkadaşına meydan oku</small></button><button id="mHome" class="btn glassbtn">Ana sayfa</button>'
        : '<button id="mNext" class="btn primary"><span>Sonraki</span><small>Bölüm ' + (G.lvl + 1) + '</small></button><div style="display:flex;gap:10px"><button id="mShare" class="btn glassbtn" style="flex:1">Paylaş</button><button id="mHome" class="btn glassbtn" style="flex:1">Ana sayfa</button></div>'}`,
      { mNext: next, mHome: () => { closeModal(); show('home'); }, mShare: () => share(st) });
  }, wait);
}
async function next() {
  closeModal();
  if (!G.daily && G.lvl >= 5 && G.lvl % INTER_EVERY === 0) await Ads.interstitial();
  start('level');
}
async function share(st) {
  const d = new Date(), dd = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
  const head = G.daily ? `Ray 🚇 Günün Hattı ${dd}` : `Ray 🚇 Bölüm ${G.lvl}`;
  const text = `${head}\n${'⭐'.repeat(st)}${'☆'.repeat(3 - st)} ${G.moves} hamle · ${fmtT(G.time)}${G.daily && save.streak > 1 ? `\n🔥 ${save.streak} gün seri` : ''}\nSen kaç hamlede bağlarsın?\n${SHARE_URL}`;
  try {
    const P = window.Capacitor?.Plugins?.Share;
    if (P) return await P.share({ text });
    if (navigator.share) return await navigator.share({ text });
    await navigator.clipboard.writeText(text); toast('Panoya kopyalandı');
  } catch {}
}

async function hint() {
  if (!G || G.won) return;
  if (save.hints <= 0) {
    if (!Ads.online()) { toast('İpucu kalmadı · yarın +3 hediye'); return; }
    modal(`<h2>İpucun bitti</h2><p>Kısa bir video izle, <b>2 ipucu</b> kazan.</p>
      <button id="mAd" class="btn primary"><span>İzle · +2</span><small>~30 sn</small></button><button id="mNo" class="btn glassbtn">Vazgeç</button>`, {
      mAd: async () => { closeModal(); if (await Ads.rewarded()) { save.hints += 2; persist(); $('gHints').textContent = save.hints; bump($('gHints')); toast('+2 ipucu kazandın'); } else toast('Reklam yüklenemedi, sonra dene'); },
      mNo: closeModal });
    return;
  }
  const wrong = [];
  G.cur.forEach((v, i) => { if (!G.fixed[i] && v !== G.sol[i]) wrong.push(i); });
  if (!wrong.length) return;
  // ışıklı bölgeye komşu olanı seç → daha anlamlı ipucu
  wrong.sort((a, b) => nearLit(b) - nearLit(a));
  const i = wrong[0], now = performance.now(), prev = G.L.d;
  G.cur[i] = G.sol[i]; G.fixed[i] = true; anim.set(i, now); press.set(i, now);
  save.hints--; persist(); $('gHints').textContent = save.hints; bump($('gHints'));
  G.L = lit(G);
  G.L.d.forEach((v, j) => { if (v >= 0 && prev[j] < 0) litAt[j] = now + v * 12; });
  burst(i, 10, 0, '#ffffff'); tone(note(9), .35, .05); tone(note(12), .35, .04, 'sine', .08); haptic('heavy');
  hud(); kick();
  if (G.L.solved) win();
}
function nearLit(i) { const x = i % G.cols, y = i / G.cols | 0; let n = 0; for (const [, dx, dy] of DIRS) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < G.cols && ny < G.rows && G.L.d[ny * G.cols + nx] >= 0) n++; } return n; }

function settings() {
  const seg = ['auto', 'dark', 'light'].map(t => `<button data-t="${t}" class="${save.theme === t ? 'on' : ''}">${{ auto: 'Oto', dark: 'Koyu', light: 'Açık' }[t]}</button>`).join('');
  modal(`<h2>Ayarlar</h2>
    <div class="opt">Ses <button id="oS" class="tog ${save.sound ? 'on' : ''}" aria-label="Ses"></button></div>
    <div class="opt">Titreşim <button id="oV" class="tog ${save.vib ? 'on' : ''}" aria-label="Titreşim"></button></div>
    <div class="opt">Tema <div class="seg" id="oT">${seg}</div></div>
    <button id="mClose" class="btn glassbtn">Tamam</button>`, {
    oS: () => { save.sound = !save.sound; persist(); $('oS').classList.toggle('on', save.sound); },
    oV: () => { save.vib = !save.vib; persist(); $('oV').classList.toggle('on', save.vib); haptic(); },
    mClose: closeModal });
  $('oT').onclick = e => { const t = e.target.dataset.t; if (!t) return; save.theme = t; persist(); applyTheme(); $('oT').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.t === t)); };
}
function how() {
  modal(`<h2>Nasıl oynanır?</h2>
    <div class="how"><i>1</i><span>Karoya dokun → ray 90° döner.</span><i>2</i><span>Merkez istasyondan çıkan hattı <b>tüm duraklara</b> ulaştır.</span><i>3</i><span>Açıkta ray ucu kalmasın. Hedef hamlede bitir → <b>3 yıldız</b>.</span><i>🔥</i><span>Her gün yeni <b>Günün Hattı</b>. Seriyi bozma!</span></div>
    <button id="mClose" class="btn primary"><span>Başla</span></button>`, { mClose: () => { closeModal(); if (save.played === 0) start('level'); } });
}

$('bPlay').onclick = () => start('level');
$('bDaily').onclick = () => start('daily');
$('bBack').onclick = () => show('home');
$('bReset').onclick = () => { if (G && !G.won) { start(G.daily ? 'daily' : 'level'); toast('Baştan başladı'); } };
$('bHint').onclick = hint;
$('bSettings').onclick = settings;
$('bHow').onclick = how;
document.addEventListener('visibilitychange', () => { if (document.hidden) ac?.suspend?.(); else ac?.resume?.(); });

applyTheme();
show('home');
Ads.init();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
if (save.played === 0) setTimeout(how, 1700);
// test kancası
window.__ray = { generate, lit, rot, get G() { return G; }, get geo() { return geo; } };
})();
