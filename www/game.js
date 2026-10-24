// Ray — metro hattı bağlama bulmacası. Tek dokunuş: karoyu çevir.
(() => {
'use strict';
const $ = id => document.getElementById(id);
const N = 1, E = 2, S = 4, W = 8;
const DIRS = [[N, 0, -1, S], [E, 1, 0, W], [S, 0, 1, N], [W, -1, 0, E]];
const rot = m => ((m << 1) | (m >> 3)) & 15;          // saat yönü 90°
const LINE_COLORS = ['#e0952f', '#3fa776', '#4a8fd1', '#d4605a', '#9a74cf', '#2fa3a0'];
const INTER_EVERY = 4;                                  // her 4 bölümde 1 geçiş reklamı
const DAILY_FREE_HINTS = 3;

// ---------- kayıt ----------
const today = () => new Date().toISOString().slice(0, 10);
const def = { level: 1, stars: {}, hints: DAILY_FREE_HINTS, hintDay: '', streak: 0, lastDaily: '', dailyDone: '', sound: true, vib: true, theme: 'auto', played: 0 };
let save;
try { save = Object.assign({}, def, JSON.parse(localStorage.getItem('ray') || '{}')); } catch { save = { ...def }; }
const persist = () => { try { localStorage.setItem('ray', JSON.stringify(save)); } catch {} };
if (save.hintDay !== today()) { save.hints = Math.max(save.hints, DAILY_FREE_HINTS); save.hintDay = today(); persist(); }
const applyTheme = () => save.theme === 'auto' ? document.documentElement.removeAttribute('data-theme') : document.documentElement.dataset.theme = save.theme;
applyTheme();

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
  return { d, solved: loose === 0 && d.every(v => v >= 0) };
}

// ---------- ses / titreşim ----------
let ac;
function tone(f, dur = .06, vol = .05) {
  if (!save.sound) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + dur);
    o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + dur);
  } catch {}
}
const buzz = ms => { if (save.vib && navigator.vibrate) navigator.vibrate(ms); };

// ---------- UI yardımcıları ----------
let toastT;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800); }
function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id)); if (id === 'home') refreshHome(); else requestAnimationFrame(resize); }
function modal(html, binds = {}) {
  $('mCard').innerHTML = html; $('modal').classList.add('open');
  for (const [id, fn] of Object.entries(binds)) { const el = $(id); if (el) el.onclick = fn; }
}
const closeModal = () => $('modal').classList.remove('open');
$('modal').onclick = e => { if (e.target.id === 'modal' && !G?.won) closeModal(); };
const totalStars = () => Object.values(save.stars).reduce((a, b) => a + b, 0);

function refreshHome() {
  $('sStars').textContent = totalStars();
  $('sStreak').textContent = save.streak;
  $('sHints').textContent = save.hints;
  $('hLevel').textContent = save.level;
  $('dailyState').textContent = save.dailyDone === today() ? '✓' : 'yeni';
}

// ---------- oyun durumu ----------
let G = null, cv = $('cv'), cx = cv.getContext('2d'), geo = { s: 0, ox: 0, oy: 0, dpr: 1 };
const anim = new Map();   // i -> başlangıç zamanı (dönme)
let winT = 0, raf = 0;

function start(mode) {
  const daily = mode === 'daily';
  const lvl = save.level;
  const [c, r] = daily ? [6, 8] : sizeFor(lvl);
  const seed = daily ? hashStr('ray' + today()) : lvl * 7919 + 13;
  G = { ...generate(c, r, seed), daily, lvl, moves: 0, won: false, color: LINE_COLORS[daily ? 2 : (Math.floor((lvl - 1) / 5)) % LINE_COLORS.length] };
  G.L = lit(G); anim.clear(); winT = 0;
  $('gTitle').textContent = daily ? 'Günün Hattı' : 'Bölüm ' + lvl;
  updMoves(); $('gHints').textContent = save.hints;
  show('game');
  if (!daily && lvl === 1) setTimeout(() => toast('Karoya dokun → döner. Tüm durakları bağla.'), 400);
}
function updMoves() { $('gMoves').textContent = `${G.moves} hamle · hedef ${G.par}`; }

function resize() {
  const b = $('board').getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 3);
  cv.width = b.width * dpr; cv.height = b.height * dpr;
  if (!G) return;
  const s = Math.floor(Math.min(b.width / G.cols, b.height / G.rows));
  geo = { s, ox: (b.width - s * G.cols) / 2, oy: (b.height - s * G.rows) / 2, dpr };
  draw();
}
addEventListener('resize', resize);

const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
function draw() {
  if (!G) return;
  const now = performance.now(), { s, ox, oy, dpr } = geo;
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cx.clearRect(0, 0, cv.width, cv.height);
  const off = css('--rail'), bg = css('--card'), fg = css('--fg');
  let busy = false;
  for (let i = 0; i < G.cur.length; i++) {
    const x = ox + (i % G.cols) * s + s / 2, y = oy + (i / G.cols | 0) * s + s / 2;
    // dönme animasyonu: -90° → 0
    let a = 0, sc = 1;
    if (anim.has(i)) { const t = Math.min((now - anim.get(i)) / 140, 1); a = -(1 - ease(t)) * Math.PI / 2; if (t < 1) busy = true; else anim.delete(i); }
    if (winT) { const t = (now - winT - G.L.d[i] * 45) / 260; if (t > 0 && t < 1) { sc = 1 + Math.sin(t * Math.PI) * .12; } if (t < 1) busy = true; }
    const on = G.L.d[i] >= 0, col = on ? G.color : off;
    cx.save(); cx.translate(x, y); cx.rotate(a); cx.scale(sc, sc);
    // karo zemini
    cx.fillStyle = bg; roundRect(-s / 2 + 2, -s / 2 + 2, s - 4, s - 4, s * .18); cx.fill();
    if (G.fixed[i]) { cx.strokeStyle = G.color + '55'; cx.lineWidth = 1.5; cx.stroke(); }
    // ray
    const m = G.cur[i];
    cx.strokeStyle = col; cx.lineWidth = s * .16; cx.lineCap = 'round';
    cx.beginPath();
    if (m & N) { cx.moveTo(0, 0); cx.lineTo(0, -s / 2); }
    if (m & E) { cx.moveTo(0, 0); cx.lineTo(s / 2, 0); }
    if (m & S) { cx.moveTo(0, 0); cx.lineTo(0, s / 2); }
    if (m & W) { cx.moveTo(0, 0); cx.lineTo(-s / 2, 0); }
    cx.stroke();
    // durak / merkez
    if (i === G.hub) { cx.fillStyle = G.color; roundRect(-s * .22, -s * .22, s * .44, s * .44, s * .1); cx.fill(); cx.fillStyle = bg; cx.beginPath(); cx.arc(0, 0, s * .07, 0, 7); cx.fill(); }
    else if (popc(m) === 1) { cx.fillStyle = on ? fg : bg; cx.strokeStyle = col; cx.lineWidth = s * .07; cx.beginPath(); cx.arc(0, 0, s * .16, 0, 7); cx.fill(); cx.stroke(); }
    cx.restore();
  }
  raf = busy ? requestAnimationFrame(draw) : 0;
}
const ease = t => 1 - Math.pow(1 - t, 3);
function roundRect(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
const kick = () => { if (!raf) raf = requestAnimationFrame(draw); };

cv.addEventListener('pointerdown', e => {
  if (!G || G.won) return;
  const r = cv.getBoundingClientRect(), { s, ox, oy } = geo;
  const c = Math.floor((e.clientX - r.left - ox) / s), w = Math.floor((e.clientY - r.top - oy) / s);
  if (c < 0 || w < 0 || c >= G.cols || w >= G.rows) return;
  const i = w * G.cols + c;
  if (G.fixed[i]) { buzz(20); toast('Bu karo ipucuyla kilitli'); return; }
  G.cur[i] = rot(G.cur[i]); G.moves++; anim.set(i, performance.now());
  const before = G.L.d.filter(v => v >= 0).length;
  G.L = lit(G);
  const after = G.L.d.filter(v => v >= 0).length;
  tone(after > before ? 520 + after * 6 : 320); buzz(8);
  updMoves(); kick();
  if (G.L.solved) win();
});

function stars() { return G.moves <= G.par ? 3 : G.moves <= Math.ceil(G.par * 1.6) ? 2 : 1; }
function win() {
  G.won = true; winT = performance.now() + 150; kick();
  [523, 659, 784, 1046].forEach((f, k) => setTimeout(() => tone(f, .18, .06), 150 + k * 110)); buzz([20, 40, 20]);
  const st = stars();
  save.played++;
  let extra = '';
  if (G.daily) {
    if (save.dailyDone !== today()) {
      const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      save.streak = save.lastDaily === y ? save.streak + 1 : 1; save.lastDaily = save.dailyDone = today();
      save.hints++; extra = `🔥 ${save.streak} gün seri · +1 ipucu`;
    }
  } else {
    save.stars[G.lvl] = Math.max(save.stars[G.lvl] || 0, st);
    save.level = G.lvl + 1;
    if (G.lvl % 10 === 0) { save.hints += 2; extra = '10 bölüm! +2 ipucu'; }
  }
  persist();
  const dur = 150 + Math.max(...G.L.d) * 45 + 300;
  setTimeout(() => {
    modal(`<div class="stars">${[0, 1, 2].map(k => `<i class="${k < st ? 'on' : ''}" style="animation-delay:${k * .12}s">★</i>`).join('')}</div>
      <h2>${G.daily ? 'Günün hattı tamam' : 'Hat açıldı!'}</h2>
      <p>${G.moves} hamle · hedef ${G.par}${extra ? '<br>' + extra : ''}</p>
      ${G.daily ? '<button id="mHome" class="btn primary">Ana sayfa</button>' : '<button id="mNext" class="btn primary">Sonraki bölüm</button><button id="mHome" class="btn ghost">Ana sayfa</button>'}`,
      { mNext: () => next(), mHome: () => { closeModal(); show('home'); } });
  }, dur);
}
async function next() {
  closeModal();
  if (!G.daily && G.lvl >= 5 && G.lvl % INTER_EVERY === 0) await Ads.interstitial();
  start('level');
}

async function hint() {
  if (!G || G.won) return;
  if (save.hints <= 0) {
    if (!Ads.online()) { toast('İpucu kalmadı · yarın +3'); return; }
    modal(`<h2>İpucu bitti</h2><p>Kısa bir reklam izle, 2 ipucu kazan.</p>
      <button id="mAd" class="btn primary">Reklam izle (+2)</button><button id="mNo" class="btn ghost">Vazgeç</button>`, {
      mAd: async () => { closeModal(); if (await Ads.rewarded()) { save.hints += 2; persist(); $('gHints').textContent = save.hints; toast('+2 ipucu'); } else toast('Reklam yüklenemedi'); },
      mNo: closeModal });
    return;
  }
  const wrong = [];
  G.cur.forEach((v, i) => { if (!G.fixed[i] && v !== G.sol[i]) wrong.push(i); });
  if (!wrong.length) return;
  // önce ışıklı bölgeye komşu olanı seç → daha anlamlı ipucu
  wrong.sort((a, b) => nearLit(b) - nearLit(a));
  const i = wrong[0];
  G.cur[i] = G.sol[i]; G.fixed[i] = true; anim.set(i, performance.now());
  save.hints--; persist(); $('gHints').textContent = save.hints;
  G.L = lit(G); tone(880, .12); kick();
  if (G.L.solved) win();
}
function nearLit(i) { const x = i % G.cols, y = i / G.cols | 0; let n = 0; for (const [, dx, dy] of DIRS) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < G.cols && ny < G.rows && G.L.d[ny * G.cols + nx] >= 0) n++; } return n; }

function settings() {
  const lab = { auto: 'Otomatik', dark: 'Koyu', light: 'Açık' };
  modal(`<h2>Ayarlar</h2>
    <div class="opt">Ses <button id="oS" class="btn ghost sm">${save.sound ? 'Açık' : 'Kapalı'}</button></div>
    <div class="opt">Titreşim <button id="oV" class="btn ghost sm">${save.vib ? 'Açık' : 'Kapalı'}</button></div>
    <div class="opt">Tema <button id="oT" class="btn ghost sm">${lab[save.theme]}</button></div>
    <button id="mClose" class="btn primary">Tamam</button>`, {
    oS: () => { save.sound = !save.sound; persist(); settings(); },
    oV: () => { save.vib = !save.vib; persist(); settings(); },
    oT: () => { save.theme = { auto: 'dark', dark: 'light', light: 'auto' }[save.theme]; persist(); applyTheme(); settings(); },
    mClose: closeModal });
}
function how() {
  modal(`<h2>Nasıl oynanır?</h2>
    <p>Karoya dokun → 90° döner.<br>Merkez istasyondan çıkan hattı tüm duraklara ulaştır.<br>Açıkta ray ucu kalmasın.<br><br>Hedef hamlede bitir → 3 ★<br>Her gün yeni bir "Günün Hattı" → seriyi koru.</p>
    <button id="mClose" class="btn primary">Anladım</button>`, { mClose: closeModal });
}

$('bPlay').onclick = () => start('level');
$('bDaily').onclick = () => start('daily');
$('bBack').onclick = () => show('home');
$('bReset').onclick = () => { if (G && !G.won) { const keepDaily = G.daily; start(keepDaily ? 'daily' : 'level'); } };
$('bHint').onclick = hint;
$('bSettings').onclick = settings;
$('bHow').onclick = how;
addEventListener('popstate', () => show('home'));
document.addEventListener('visibilitychange', () => { if (document.hidden && ac) ac.suspend?.(); else ac?.resume?.(); });

refreshHome();
Ads.init();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
if (save.played === 0) setTimeout(how, 500);
// test kancası
window.__ray = { generate, lit, rot, get G() { return G; } };
})();
