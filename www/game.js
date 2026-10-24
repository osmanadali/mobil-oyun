// Ray — metro hattı bağlama bulmacası. Tek dokunuş: karoyu çevir.
(() => {
'use strict';
const $ = id => document.getElementById(id);
const N = 1, E = 2, S = 4, W = 8;
const DIRS = [[N, 0, -1, S], [E, 1, 0, W], [S, 0, 1, N], [W, -1, 0, E]];
const rot = m => ((m << 1) | (m >> 3)) & 15;          // saat yönü 90°
const LINES_DARK = ['#ffb35c', '#4fc3a1', '#7ea6ff', '#ff7a8a', '#b394ff', '#5ccfe6'];
const LINES_LIGHT = ['#f08a24', '#1fa383', '#4a7fe0', '#e8566c', '#8c6ae0', '#1a9fbd'];
const LINE_NAMES = ['Turuncu', 'Yeşil', 'Mavi', 'Kırmızı', 'Mor', 'Turkuaz'];
const PER_LINE = 10;                                    // her hat 10 bölüm
const STAR_AVG = 2.2;                                   // yeni hat: önceki bölümlerde ortalama 2,2★
const INTER_EVERY = 4;                                  // her 4 galibiyette 1 geçiş reklamı
const DAILY_FREE_HINTS = 3;
const AD_TIERS = [1, 2, 2, 3];                          // aynı bölümde ipucu için izlenecek video: ~15 sn, ~30, ~30, ~45…
const SHARE_URL = 'https://osmanadali.github.io/mobil-oyun/';
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28];

// ---------- tarih (yerel takvim günü) ----------
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = () => ymd(new Date());
const dayBefore = s => { const [y, m, d] = s.split('-').map(Number); return ymd(new Date(y, m - 1, d - 1)); };

// ---------- kayıt ----------
const def = { level: 1, stars: {}, hints: DAILY_FREE_HINTS, hintDay: '', streak: 0, lastDaily: '', dailyDone: '', dailyStats: null, runs: {}, crowns: {}, shards: 0, sound: true, music: true, vib: true, theme: 'auto', played: 0 };
let save;
try { save = Object.assign({}, def, JSON.parse(localStorage.getItem('ray') || '{}')); } catch { save = { ...def }; }
if (!save.runs || typeof save.runs !== 'object') save.runs = {};
if (!Array.isArray(save.dailyLog)) save.dailyLog = save.lastDaily ? [save.lastDaily] : [];
const persist = () => { try { localStorage.setItem('ray', JSON.stringify(save)); } catch {} };
// gün değişimi: ücretsiz ipucu, kopan seri
function dayTick() {
  const t = today();
  if (save.hintDay !== t) { save.hints = Math.max(save.hints, DAILY_FREE_HINTS); save.hintDay = t; }
  if (save.streak && save.lastDaily !== t && save.lastDaily !== dayBefore(t)) save.streak = 0;
  persist();
  $('gHints').textContent = save.hints;
}

// ---------- hatlar ve yıldız kapıları ----------
const lineOf = l => Math.floor((l - 1) / PER_LINE);
const lineName = c => `M${c + 1} · ${LINE_NAMES[c % LINE_NAMES.length]} Hat`;
const need = c => Math.round(c * PER_LINE * STAR_AVG);
const totalStars = () => Object.values(save.stars).reduce((a, b) => a + b, 0);
const unlocked = c => totalStars() >= need(c);

// ---------- tema / palet ----------
let pal = {};
const isLight = () => save.theme === 'light' || (save.theme === 'auto' && matchMedia('(prefers-color-scheme: light)').matches);
function applyTheme() {
  if (save.theme === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.dataset.theme = save.theme;
  const cs = getComputedStyle(document.documentElement), v = n => cs.getPropertyValue(n).trim();
  pal = { tile: v('--tile'), stroke: v('--stroke'), rail: v('--railC'), mut: v('--mut'), bg: v('--bg0'), fg: v('--fg'), light: isLight() };
  const bar = pal.light ? '#f7f2ec' : '#0d1020';
  document.querySelector('meta[name=theme-color]').content = bar;
  const SB = window.Capacitor?.Plugins?.StatusBar;
  if (SB) { SB.setBackgroundColor?.({ color: bar })?.catch?.(() => {}); SB.setStyle?.({ style: pal.light ? 'LIGHT' : 'DARK' })?.catch?.(() => {}); }
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
  // par: döndürülmesi gereken karo sayısı · taps: gereken en az dokunuş (süre hedefi için)
  let par = 0, taps = 0;
  cur.forEach((v, i) => { let r = 0, t = v; while (t !== sol[i] && r < 4) { t = rot(t); r++; } taps += r; if (r) par++; });
  return { cols, rows, sol, cur, hub, par, taps, fixed: new Array(n).fill(false) };
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

// ---------- yıldızlar: her yıldız bir hedef ----------
// ★ bitir · ★ ⏱ süre hedefi · ★ ↻ hamle hedefi (aynı karoya art arda dokunuş = 1 hamle). İkisi birden → KUSURSUZ 👑
const MOVE_TOL = .25;                                   // hamle toleransı: hedef + %25 (en az +2)
function limits(P) {
  return { m: P.par + Math.max(2, Math.round(P.par * MOVE_TOL)), t: Math.max(20, Math.round(P.taps * 1.6 + P.cur.length * .7)) };
}
const timeOk = sec => sec <= G.lim.t;
const movesOk = () => G.moves <= G.lim.m;

// ---------- ses / dokunsal ----------
let ac;
function ensureAC() { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); return ac; }
// yumuşak çan tınısı: sinüs + hafif üst oktav, üstel sönüm (sert tık yok)
function tone(f, dur = .08, vol = .05, type = 'sine', at = 0) {
  if (!save.sound) return;
  try {
    ensureAC();
    const t = ac.currentTime + at, o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), g2 = ac.createGain();
    o.type = type; o.frequency.value = f; o2.frequency.value = f * 2; g2.gain.value = .18;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .012);
    g.gain.exponentialRampToValueAtTime(.0001, t + Math.max(dur, .06) * 1.6);
    o.connect(g); o2.connect(g2).connect(g); g.connect(ac.destination);
    const end = t + Math.max(dur, .06) * 1.6 + .02;
    o.start(t); o2.start(t); o.stop(end); o2.stop(end);
  } catch {}
}
// ---------- arka plan müziği: cihazda üretilen sakin ambiyans (dosya yok, internetsiz) ----------
const Music = (() => {
  // Re majör · D – Bm – G – A · her akor: bas + 4 nota. Arpej sabit kalıplarla döner → rastgele uyumsuzluk yok.
  const PROG = [[50, 62, 66, 69, 74], [47, 59, 62, 66, 71], [43, 55, 59, 62, 67], [45, 57, 61, 64, 69]];
  const PAT = [[1, 2, 3, 4, 3, 2, 3, 2], [1, 3, 2, 4, 2, 3, 1, 3]];
  const STEP = .45, VOL = .55, hz = m => 440 * Math.pow(2, (m - 69) / 12);
  let on = false, master, timer = 0, next = 0, step = 0;
  function setup() {
    master = ac.createGain(); master.gain.value = 0;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
    master.connect(lp).connect(ac.destination);
  }
  function bell(m, t, v, len) {
    const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), g2 = ac.createGain();
    o.frequency.value = hz(m); o2.frequency.value = hz(m) * 2; g2.gain.value = .22;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .02); g.gain.exponentialRampToValueAtTime(.0005, t + len);
    o.connect(g); o2.connect(g2).connect(g); g.connect(master);
    o.start(t); o2.start(t); o.stop(t + len + .05); o2.stop(t + len + .05);
  }
  function sched() {
    while (next < ac.currentTime + .8) {
      const bar = step / 8 | 0, beat = step % 8, c = PROG[bar % 4], cycle = (bar / 4 | 0) % 4;
      if (beat === 0) bell(c[0], next, .1, 3.2);                         // bas
      if (cycle !== 3 || beat < 4) bell(c[PAT[cycle % 2][beat]], next, beat % 2 ? .045 : .06, 1.8);   // her 4. turda yarım ölçü nefes
      next += STEP; step++;
    }
  }
  function start() {
    if (on || !save.music) return;
    try {
      ensureAC(); if (!master) setup();
      on = true; next = Math.max(next, ac.currentTime + .1);
      master.gain.cancelScheduledValues(ac.currentTime); master.gain.setValueAtTime(master.gain.value, ac.currentTime);
      master.gain.linearRampToValueAtTime(VOL, ac.currentTime + 2.5);
      clearInterval(timer); timer = setInterval(sched, 300); sched();
    } catch {}
  }
  function stop() {
    if (!on) return; on = false; clearInterval(timer);
    try { master.gain.cancelScheduledValues(ac.currentTime); master.gain.setTargetAtTime(0, ac.currentTime, .3); } catch {}
  }
  return { start, stop };
})();
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
let toastT, mLocked = false;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }
const active = id => $(id).classList.contains('active');
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  document.body.classList.toggle('playing', id === 'game');
  if (id === 'game') resume(); else pause();
  if (id === 'home') refreshHome();
  if (id === 'map') renderMap();
  clearInterval(clockT); if (id === 'home') clockT = setInterval(dailyClock, 1000);
}
const bind = binds => { for (const [id, fn] of Object.entries(binds)) { const el = $(id); if (el) el.onclick = fn; } };
function modal(html, binds = {}, locked = false) {
  mLocked = locked;
  $('mCard').innerHTML = html; $('modal').classList.add('open');
  bind(binds);
}
const closeModal = () => $('modal').classList.remove('open');
const modalOpen = () => $('modal').classList.contains('open');
$('modal').onclick = e => { if (e.target.id === 'modal' && !mLocked) closeModal(); };
const bump = el => { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); };
const fmtT = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return `${s / 60 | 0}:${String(s % 60).padStart(2, '0')}`; };
const STAR = '<svg viewBox="0 0 24 24"><path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"/></svg>';
// st: yıldız sayısı ya da [bitir, süre, hamle] dizisi (hangi hedefin söndüğü görünsün)
const starsHtml = st => { const on = Array.isArray(st) ? st : [0, 1, 2].map(k => k < st); return `<div class="stars">${on.map((o, k) => STAR.replace('<svg', `<svg class="${o ? 'on' : ''}" style="animation-delay:${.1 + k * .14}s"`)).join('')}</div>`; };
const starTxt = st => '★'.repeat(st) + '☆'.repeat(3 - st);

// her düğmede dokunma dalgası
document.addEventListener('pointerdown', e => {
  Music.start();
  const b = e.target.closest('.btn,.ic,.lv,.chip'); if (!b) return;
  const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2.2, sp = document.createElement('i');
  sp.className = 'rip'; sp.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
  b.appendChild(sp); setTimeout(() => sp.remove(), 600);
  haptic(); tone(587, .05, .012);
}, { passive: true });

let clockT;
function countdown() {
  const n = new Date(), m = new Date(n); m.setHours(24, 0, 0, 0);
  const s = (m - n) / 1000 | 0;
  return `${String(s / 3600 | 0).padStart(2, '0')}:${String(s / 60 % 60 | 0).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
function dailyClock() {
  if (save.dailyDone !== today()) { if ($('bDaily').classList.contains('done')) refreshHome(); return; }
  $('dailyState').textContent = `Yeni hat ${countdown()}`;
  if ($('mClock')) $('mClock').textContent = `Yeni Günün Hattı: ${countdown()}`;
}
function refreshHome() {
  dayTick();
  const tot = totalStars();
  $('sStars').textContent = tot;
  $('sStreak').textContent = save.streak;
  $('sHints').textContent = save.hints;
  $('hLevel').textContent = save.level;
  const done = save.dailyDone === today();
  $('bDaily').classList.toggle('done', done);
  $('dailyTitle').textContent = done ? 'Tamamlandı ✓' : 'Hazır';
  if (done) dailyClock(); else $('dailyState').textContent = save.streak ? `🔥 ${save.streak} günlük serini koru` : 'Her gün yeni bir hat';
  const c = lineOf(save.level), nx = c + 1, lo = need(c), hi = need(nx);
  $('lineName').textContent = lineName(c);
  $('lineName').style.color = (pal.light ? LINES_LIGHT : LINES_DARK)[c % 6];
  $('gateTxt').textContent = tot >= hi ? `★ ${tot} · M${nx + 1} açık` : `★ ${tot} / ${hi} → M${nx + 1}`;
  $('progBar').style.width = Math.min(100, Math.max(4, (tot - lo) / Math.max(1, hi - lo) * 100)) + '%';
  const [w, h] = sizeFor(save.level); $('sSize').textContent = `${w}×${h} ızgara`;
  $('bPlay').classList.toggle('locked', !unlocked(c));
}

// ---------- hat haritası (bölüm seçimi) ----------
function renderMap() {
  const tot = totalStars(), last = lineOf(save.level) + 1, col = pal.light ? LINES_LIGHT : LINES_DARK;
  $('pStars').textContent = tot;
  $('pSub').textContent = 'Yıldız topla → yeni hat aç';
  let html = '';
  for (let c = 0; c <= Math.max(1, last); c++) {
    const open = unlocked(c), first = c * PER_LINE + 1;
    const got = Array.from({ length: PER_LINE }, (_, k) => save.stars[first + k] || 0).reduce((a, b) => a + b, 0);
    html += `<div class="line ${open ? '' : 'lockd'}" style="--lc:${col[c % 6]}">
      <div class="lh"><i class="dot"></i><b>${lineName(c)}</b><small>${open ? `★ ${got} / ${PER_LINE * 3}` : `🔒 ★ ${tot} / ${need(c)}`}</small></div>
      <div class="lvs">${Array.from({ length: PER_LINE }, (_, k) => {
        const l = first + k, st = save.stars[l] || 0, can = open && l <= save.level;
        return `<button class="lv ${can ? '' : 'off'} ${l === save.level && can ? 'cur' : ''}" data-l="${l}" ${can ? '' : 'disabled'}><b>${l}</b><i>${can ? (save.crowns[l] ? '👑' : starTxt(st)) : ''}</i></button>`;
      }).join('')}</div></div>`;
  }
  $('mapList').innerHTML = html;
}
$('mapList').onclick = e => { const b = e.target.closest('.lv'); if (b && !b.disabled) start('level', +b.dataset.l); };
function lockedSheet(c) {
  const tot = totalStars();
  modal(`<h2>${lineName(c)} kilitli</h2>
    <p>Bu hattı açmak için <b>★ ${need(c)}</b> gerekli. Sende <b>★ ${tot}</b> var.<br>Önceki bölümleri daha <b>hızlı</b> ve <b>az hamleyle</b> tekrar oyna, yıldızlarını artır.</p>
    <div class="pb big"><i style="width:${Math.min(100, tot / need(c) * 100)}%"></i></div>
    <button id="mMap" class="btn primary"><span>Hatlara git</span><small>${need(c) - tot} yıldız eksik</small></button><button id="mClose" class="btn glassbtn">Kapat</button>`,
    { mMap: () => { closeModal(); show('map'); }, mClose: closeModal });
}

// ---------- oyun durumu ----------
let G = null;
const cv = $('cv'), cx = cv.getContext('2d');
let geo = { s: 0, ox: 0, oy: 0, dpr: 1 }, vg = geo, geoFrom = null, geoT0 = 0;
const anim = new Map(), press = new Map();   // i -> başlangıç zamanı
let litAt = [], ripples = [], parts = [], winT = 0, raf = 0, winTimer = 0, tickT = 0, howT = 0, sessionWins = 0;

// süre yalnızca oyun ekranı açıkken ve uygulama öndeyken akar
const elapsed = () => G ? G.ms + (G.runAt ? performance.now() - G.runAt : 0) : 0;
function pause() { if (G?.runAt) { G.ms += performance.now() - G.runAt; G.runAt = 0; saveRun(); } clearInterval(tickT); }
function resume() { if (G && !G.won && !G.runAt && !document.hidden) { G.runAt = performance.now(); clearInterval(tickT); tickT = setInterval(tick, 250); } }

function setLineColor() {
  const k = G.daily ? 2 : lineOf(G.lvl) % 6;
  G.color = (pal.light ? LINES_LIGHT : LINES_DARK)[k];
  $('game').style.setProperty('--line', G.color);
}
const runKey = () => G.daily ? 'daily' : 'level';
function saveRun() {
  if (!G || G.won) return;
  save.runs[runKey()] = { lvl: G.lvl, day: G.day, cur: G.cur, fixed: G.fixed, moves: G.moves, last: G.lastTile, ms: elapsed() };
  persist();
}
function start(mode, lvl = save.level) {
  clearTimeout(howT); clearTimeout(winTimer); closeModal(); closePanel();
  const daily = mode === 'daily', day = today();
  if (!daily && !unlocked(lineOf(lvl))) { lockedSheet(lineOf(lvl)); return; }
  const [c, r] = daily ? [6, 8] : sizeFor(lvl);
  const seed = daily ? hashStr('ray' + day) : lvl * 7919 + 13;
  G = { ...generate(c, r, seed), daily, lvl: daily ? 0 : lvl, day: daily ? day : null, practice: daily && save.dailyDone === day, moves: 0, lastTile: -1, won: false, ms: 0, runAt: 0 };
  G.lim = limits(G);
  // yarım kalan oyunu sürdür
  const run = save.runs[daily ? 'daily' : 'level'];
  if (run && (daily ? run.day === day : run.lvl === lvl) && run.cur?.length === G.cur.length) {
    G.cur = run.cur.slice(); G.fixed = run.fixed.slice(); G.moves = run.moves; G.lastTile = run.last ?? -1; G.ms = run.ms || 0;
  }
  setLineColor();
  G.L = lit(G); anim.clear(); press.clear(); ripples = []; parts = []; winT = 0;
  litAt = G.L.d.map(v => v >= 0 ? -1e9 : 0);
  G.tOk = timeOk(G.ms / 1000); G.mOk = movesOk();
  $('gTitle').textContent = daily ? (G.practice ? 'Günün Hattı · pratik' : 'Günün Hattı') : 'Bölüm ' + lvl;
  $('gMoves').textContent = daily ? new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) : lineName(lineOf(lvl));
  $('gHints').textContent = save.hints;
  show('game'); resize(); hud(); tick();
  if (save.played === 0) setTimeout(() => toast('Karoya dokun → döner'), 500);
}
function hud() {
  const ok = movesOk();
  $('gPar').innerHTML = `${G.moves}<small> / ${G.lim.m}</small>`;
  $('gPar').classList.toggle('miss', !ok);
  $('gParLbl').textContent = ok ? '↻ HAMLE HEDEFİ' : '↻ HEDEF AŞILDI';
  const pct = Math.round(G.L.n / G.cur.length * 100);
  $('gBar').style.width = pct + '%'; $('gPct').textContent = pct + '%';
}
// üst gösterge: süre + üç yıldız (bitir · ⏱ süre · ↻ hamle)
function tick() {
  if (!G) return;
  const ms = elapsed(), sec = ms / 1000, tOk = timeOk(sec), mOk = movesOk(), left = G.lim.t - sec;
  $('gTime').textContent = fmtT(ms);
  const [s1, s2, s3] = $('gStars').children;
  s1.classList.add('on'); s2.classList.toggle('on', tOk); s3.classList.toggle('on', mOk);
  const nx = `<span class="${tOk ? '' : 'miss'}">⏱ ${tOk ? fmtT(left * 1000 + 999) + ' kaldı' : 'süre kaçtı'}</span> · <span class="${mOk ? '' : 'miss'}">↻ ${mOk ? `${G.lim.m - G.moves} hamle hakkı` : 'hamle aşıldı'}</span>`;
  if (nx !== G.nxHtml) { $('gNext').innerHTML = nx; G.nxHtml = nx; }
  $('gPill').classList.toggle('warn', tOk && left <= 10 && !G.won);
  if (!G.won) {
    if (G.tOk && !tOk) lose('⏱ Süre hedefi kaçtı · ★ söndü');
    if (G.mOk && !mOk) lose('↻ Hamle hedefi aşıldı · ★ söndü');
  }
  G.tOk = tOk; G.mOk = mOk;
}
function lose(msg) { bump($('gPill')); tone(294, .2, .04); haptic('heavy'); toast(msg); }

function resize() {
  const bd = $('board'), Wd = bd.clientWidth, Hd = bd.clientHeight, dpr = Math.min(devicePixelRatio || 1, 2);   // 3x ekranda 2x yeterli, yük ~%55 az
  if (!Wd || !Hd) return;
  cv.width = Math.round(Wd * dpr); cv.height = Math.round(Hd * dpr);
  if (!G) return;
  const s = Math.floor(Math.min((Wd - 8) / G.cols, (Hd - 8) / G.rows, 96));
  const ng = { s, ox: (Wd - s * G.cols) / 2, oy: (Hd - s * G.rows) / 2, dpr };
  if (G.won && vg.s && (ng.s !== vg.s || ng.oy !== vg.oy)) { geoFrom = vg; geoT0 = performance.now(); }
  geo = ng; draw();
}
new ResizeObserver(() => resize()).observe($('board'));

const ease = t => 1 - Math.pow(1 - t, 3);
const back = t => { const c1 = 1.25, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
function rrp(x, y, w, h, r) { cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
function rr(x, y, w, h, r) { cx.beginPath(); rrp(x, y, w, h, r); }
const DV = [[N, 0, -1], [E, 1, 0], [S, 0, 1], [W, -1, 0]];
// karonun raylarını mevcut yola ekler (ekran koordinatında; save/restore yok)
function railPath(T, m) {
  const [x, y, a, sc] = T, c = Math.cos(a), si = Math.sin(a), L = vg.s / 2 * sc;
  for (const [b, dx, dy] of DV) if (m & b) { cx.moveTo(x, y); cx.lineTo(x + (dx * c - dy * si) * L, y + (dx * si + dy * c) * L); }
}

// Aynı stildeki her şey tek yolda toplanır → kare başına ~15 çizim çağrısı (düşük donanımda akıcı).
function draw() {
  raf = 0;
  if (!G || !geo.s) return;
  const now = performance.now();
  let busy = false;
  if (geoFrom) {
    const t = Math.min((now - geoT0) / 420, 1), e = ease(t), f = k => geoFrom[k] + (geo[k] - geoFrom[k]) * e;
    vg = { s: f('s'), ox: f('ox'), oy: f('oy'), dpr: geo.dpr };
    if (t < 1) busy = true; else geoFrom = null;
  } else vg = geo;
  const { s, ox, oy, dpr } = vg, n = G.cur.length, col = G.color;
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cx.clearRect(0, 0, cv.width / dpr, cv.height / dpr);
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
  const anyFixed = G.fixed.includes(true);
  if (anyFixed) { tiles(i => G.fixed[i]); cx.lineWidth = 2.5; cx.strokeStyle = rgba(col, .85); cx.stroke(); }
  // 2) raylar: sönük → ışıma → yanan
  const rails = f => { cx.beginPath(); for (let i = 0; i < n; i++) if (f(i)) railPath(X[i], G.cur[i]); cx.stroke(); };
  cx.lineWidth = s * .17; cx.strokeStyle = pal.rail; rails(i => !on(i));
  cx.lineWidth = s * .38; cx.strokeStyle = rgba(col, pal.light ? .16 : .22); rails(on);
  cx.lineWidth = s * .17; cx.strokeStyle = col; rails(on);
  // 3) yeni yanan karoda parlama (karo sınırına kırpılır → komşuya taşmaz)
  for (let i = 0; i < n; i++) {
    if (!on(i)) continue;
    const t = (now - litAt[i]) / 420;
    if (t >= 1) continue;
    busy = true; if (t <= 0) continue;
    const [x, y] = X[i];
    cx.save(); cx.beginPath(); cx.rect(x - s / 2, y - s / 2, s, s); cx.clip();
    cx.strokeStyle = pal.light ? rgba(col, .9 * (1 - t)) : `rgba(255,255,255,${.65 * (1 - t)})`;
    cx.lineWidth = s * (pal.light ? .17 + .12 * (1 - t) : .17);
    cx.beginPath(); railPath(X[i], G.cur[i]); cx.stroke(); cx.restore();
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
  // 6) ipucu kilidi rozeti
  if (anyFixed) { cx.fillStyle = col; cx.beginPath(); for (let i = 0; i < n; i++) if (G.fixed[i]) { const [x, y] = X[i]; cx.moveTo(x + s * .3 + s * .055, y - s * .3); cx.arc(x + s * .3, y - s * .3, s * .055, 0, 7); } cx.fill(); }
  // 7) dokunma dalgaları
  cx.lineWidth = 2.5;
  ripples = ripples.filter(r => {
    const t = (now - r.t) / 420; if (t >= 1) return false;
    cx.strokeStyle = rgba(col, .45 * (1 - t));
    cx.beginPath(); cx.arc(r.x, r.y, s * (.2 + .55 * ease(t)), 0, 7); cx.stroke();
    return busy = true;
  });
  // 8) kıvılcımlar
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
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - s * .6, t, life: 520 + Math.random() * 300, r: 1.6 + Math.random() * 2.4, c: Math.random() < .3 ? (pal.light ? '#ffc56b' : '#fff6e6') : color });
  }
}

cv.addEventListener('pointerdown', e => {
  if (G?.won) { if ($('game').classList.contains('won')) toggleMini(); return; }
  if (!G) return;
  const { s, ox, oy } = geo, px = e.offsetX, py = e.offsetY;   // offsetX: CSS dönüşümlerinden bağımsız
  const c = Math.floor((px - ox) / s), w = Math.floor((py - oy) / s);
  if (c < 0 || w < 0 || c >= G.cols || w >= G.rows) return;
  const i = w * G.cols + c, now = performance.now();
  if (G.fixed[i]) { haptic('light'); tone(440, .06, .02); toast('Bu karo ipucuyla sabitlendi'); press.set(i, now); kick(); return; }
  G.cur[i] = rot(G.cur[i]);
  if (G.lastTile !== i) { G.moves++; G.lastTile = i; }   // aynı karoya art arda dokunuş = 1 hamle
  anim.set(i, now); press.set(i, now); ripples.push({ x: px, y: py, t: now });
  const prev = G.L.d;
  G.L = lit(G);
  let gained = 0, stations = 0;
  G.L.d.forEach((v, j) => { if (v >= 0 && prev[j] < 0) { litAt[j] = now + v * 12; gained++; if (popc(G.cur[j]) === 1) { stations++; burst(j, 7, v * 12); } } });
  const k = Math.round(G.L.n / G.cur.length * (PENTA.length - 1));
  if (gained) { tone(note(k), .22, .05); if (stations) tone(note(k + 2), .3, .035, 'sine', .06); haptic(stations ? 'heavy' : 'light'); }
  else { tone(G.L.n < prev.filter(v => v >= 0).length ? 294 : 523, .05, .022); haptic('light'); }
  hud(); tick(); kick();
  if (gained) bump($('gPct'));
  if (G.L.solved) win(); else saveRun();
});

function win() {
  pause();
  G.won = true; G.time = elapsed();
  delete save.runs[runKey()];
  winT = performance.now() + 120;
  G.L.d.forEach((v, i) => { litAt[i] = winT + v * 45; if (popc(G.cur[i]) === 1) burst(i, 12, 120 + v * 45); });
  kick();
  [0, 2, 4, 5, 7].forEach((k, j) => tone(note(k + 3), .4, .05, 'sine', .12 + j * .09));
  haptic('win');
  const tOk = timeOk(G.time / 1000), mOk = movesOk(), st = 1 + tOk + mOk, perfect = tOk && mOk;
  save.played++;
  let extra = '', unlockedNow = null, shard = false;
  if (G.daily) {
    if (save.dailyDone !== G.day) {
      save.streak = save.lastDaily === dayBefore(G.day) ? save.streak + 1 : 1; save.lastDaily = save.dailyDone = G.day;
      save.dailyLog = [...save.dailyLog.filter(d => d !== G.day), G.day].slice(-90); save.best = Math.max(save.best || 0, save.streak);
      save.hints++; extra = `🔥 ${save.streak} gün seri · +1 ipucu`;
      save.dailyStats = { day: G.day, moves: G.moves, time: G.time, st, perfect };
      shard = perfect;
    }
  } else {
    sessionWins++;
    const before = totalStars(), old = save.stars[G.lvl] || 0, firstClear = G.lvl >= save.level;
    save.stars[G.lvl] = Math.max(old, st);
    if (st > old && old) extra = `Yeni rekor: ${starTxt(st)}`;
    save.level = Math.max(save.level, G.lvl + 1);
    if (G.lvl % 10 === 0 && firstClear) { save.hints += 2; extra = '🎁 Hat tamam · +2 ipucu'; }
    if (perfect && !save.crowns[G.lvl]) { save.crowns[G.lvl] = 1; shard = true; }   // parça bölüm başına bir kez
    for (let c = 1; c <= lineOf(save.level) + 1; c++) if (need(c) > before && unlocked(c)) unlockedNow = c;
  }
  let shardMsg = '';
  if (shard) {
    save.shards = (save.shards || 0) + 1;
    if (save.shards >= 3) { save.shards -= 3; save.hints++; shardMsg = '💎 3 parça birleşti · +1 ipucu'; } else shardMsg = `💎 İpucu parçası ${save.shards}/3`;
  }
  persist();
  const g = G, wait = 120 + Math.max(...G.L.d) * 45 + 650, info = { st, tOk, mOk, perfect, extra: [shardMsg, extra].filter(Boolean).join(' · '), unlockedNow };
  winTimer = setTimeout(() => { if (G === g && active('game')) winSheet(g, info); }, wait);
}
// Sonuç paneli tahtanın altına yerleşir; tahta küçülüp üstte görünür kalır.
function winSheet(g, { st, tOk, mOk, perfect, extra, unlockedNow }) {
  const L = g.lim, nx = g.lvl + 1, nxLocked = !g.daily && !unlocked(lineOf(nx));
  const badge = unlockedNow ? `<span class="badge">YENİ HAT AÇILDI · M${unlockedNow + 1}</span>` : perfect ? '<span class="badge">KUSURSUZ 👑</span>' : '';
  const tip = perfect ? '' : `<p class="tip">Kusursuz için: ${[tOk ? '' : `⏱ ≤ ${fmtT(L.t * 1000)}`, mOk ? '' : `↻ ≤ ${L.m} hamle`].filter(Boolean).join(' ve ')}</p>`;
  const primary = g.daily
    ? '<button id="mShare" class="btn primary"><span>Paylaş</span><small>Arkadaşına meydan oku</small></button><button id="mHome" class="btn glassbtn">Ana sayfa</button>'
    : `${nxLocked ? `<button id="mMap" class="btn primary"><span>Yeni hat kilitli</span><small>★ ${totalStars()} / ${need(lineOf(nx))} · yıldız topla</small></button>` : `<button id="mNext" class="btn primary"><span>Sonraki</span><small>Bölüm ${nx}</small></button>`}
       <div class="row2"><button id="mRetry" class="btn glassbtn">Tekrar</button><button id="mShare" class="btn glassbtn">Paylaş</button><button id="mHome" class="btn glassbtn">Ana sayfa</button></div>`;
  $('winPanel').innerHTML = `<div class="wp-top"><div class="wp-sum">${starsHtml([true, tOk, mOk])}<div class="wp-t"><h2>${g.practice ? 'Pratik tamam!' : g.daily ? 'Günün hattı tamam!' : 'Hat açıldı!'}</h2>${badge}</div></div>
      <button id="wTog" class="wp-tog" aria-label="Hattı gör"><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg><span>Hattı gör</span></button></div>
    <div class="wp-more"><div class="statrow"><div><b class="${tOk ? 'ok' : 'miss'}">${fmtT(g.time)}<small> / ${fmtT(L.t * 1000)}</small></b><span>⏱ süre ${tOk ? '★' : '✗'}</span></div><div><b class="${mOk ? 'ok' : 'miss'}">${g.moves}<small> / ${L.m}</small></b><span>↻ hamle ${mOk ? '★' : '✗'}</span></div></div>${tip}${extra ? `<p class="tip">${extra}</p>` : ''}</div>
    ${primary}`;
  $('game').classList.add('won');
  bind({ wTog: toggleMini, mNext: next, mMap: () => show('map'), mRetry: () => start('level', g.lvl), mHome: () => show('home'),
    // pratikte paylaşılan, günün resmî (ilk) sonucudur
    mShare: () => share(g.practice && save.dailyStats ? { ...save.dailyStats, daily: true } : { daily: g.daily, lvl: g.lvl, day: g.day, moves: g.moves, time: g.time, st, perfect }) });
}
function toggleMini() {
  const mini = $('game').classList.toggle('mini');
  $('wTog').querySelector('span').textContent = mini ? 'Sonuç' : 'Hattı gör';
  haptic(); tone(mini ? 440 : 587, .06, .02);
}
function closePanel() { $('game').classList.remove('won', 'mini'); $('winPanel').innerHTML = ''; }
async function next() {
  if (!G.daily && save.played >= 5 && sessionWins % INTER_EVERY === 0) { Music.stop(); await Ads.interstitial(); Music.start(); }
  start('level', G.lvl + 1);
}
function dailyResult() {
  const d = save.dailyStats;
  modal(`${starsHtml(d.st)}<h2>Günün hattı tamam</h2>
    <div class="statrow"><div><b>${d.moves}</b><span>hamle</span></div><div><b>${fmtT(d.time)}</b><span>süre</span></div><div><b>${save.streak}</b><span>gün seri</span></div></div>
    <p id="mClock"></p>
    <button id="mShare" class="btn primary"><span>Paylaş</span><small>Arkadaşına meydan oku</small></button><button id="mReplay" class="btn glassbtn">Tekrar oyna · pratik</button><p class="tip">Pratikte sonucun ve serin değişmez</p>`,
    { mShare: () => share({ ...d, daily: true }), mReplay: () => start('daily') });
  dailyClock();
}
async function share(r) {
  const [, m, d] = (r.day || today()).split('-');
  const head = r.daily ? `Ray 🚇 Günün Hattı ${d}.${m}` : `Ray 🚇 Bölüm ${r.lvl}`;
  const url = r.daily ? `${SHARE_URL}?d=${r.day}&m=${r.moves}` : SHARE_URL;
  const text = `${head}\n${'⭐'.repeat(r.st)}${'☆'.repeat(3 - r.st)}${r.perfect ? ' 👑' : ''} ${r.moves} hamle · ${fmtT(r.time)}${r.daily && save.streak > 1 ? `\n🔥 ${save.streak} gün seri` : ''}\nSen kaç hamlede bağlarsın?\n${url}`;
  try {
    const P = window.Capacitor?.Plugins?.Share;
    if (P) return await P.share({ text });
    if (navigator.share) return await navigator.share({ text });
    await navigator.clipboard.writeText(text); toast('Panoya kopyalandı');
  } catch {}
}

async function hint() {
  if (!G || G.won) return;
  dayTick();
  if (save.hints <= 0) {
    if (!Ads.online()) { toast('İpucu kalmadı · yarın +3 hediye'); return; }
    if (Ads.busy()) { toast('Reklam yükleniyor…'); return; }
    adSheet();
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
  burst(i, 10, 0, pal.light ? '#ffc56b' : '#ffffff'); tone(note(9), .35, .05); tone(note(12), .35, .04, 'sine', .08); haptic('heavy');
  hud(); kick();
  if (G.L.solved) win(); else saveRun();
}
// Ödüllü reklam: aynı bölümde ipucu istedikçe izlenecek video sayısı artar. Her video oyuncunun basışıyla açılır.
function adSheet() {
  const key = G.daily ? 'd' + G.day : 'l' + G.lvl;
  if (save.adProg?.key !== key) save.adProg = { key, n: 0, part: 0 };
  const P = save.adProg, need = AD_TIERS[Math.min(P.n, AD_TIERS.length - 1)], sec = need * 15;
  const dots = need > 1 ? `<div class="vids">${Array.from({ length: need }, (_, k) => `<i class="${k < P.part ? 'on' : ''}"></i>`).join('')}</div>` : '';
  modal(`<h2>${P.part ? 'Bir video kaldı' + (need - P.part > 1 ? '' : '!') : 'İpucun bitti'}</h2>
    <p>${need === 1 ? 'Kısa bir video izle' : `${need} kısa video izle`} (~${sec} sn), <b>2 ipucu</b> kazan.${P.part ? `<br>${P.part}/${need} izlendi.` : ''}</p>${dots}
    <button id="mAd" class="btn primary"><span>${P.part ? `Devam · ${P.part + 1}. video` : 'İzle · +2 ipucu'}</span><small>~${sec} sn${need > 1 ? ` · ${need} video` : ''}</small></button>
    <button id="mNo" class="btn glassbtn">Vazgeç</button>`, {
    mAd: async () => {
      if (Ads.busy()) return;
      closeModal(); pause(); toast('Reklam yükleniyor…'); Music.stop();
      const ok = await Ads.rewarded();
      Music.start(); if (active('game')) resume();
      if (!ok) { toast(Ads.online() ? 'Ödül alınamadı · video sonuna kadar izlenmeli' : 'Bağlantı yok · sonra dene'); return; }
      P.part++;
      if (P.part < need) { persist(); adSheet(); return; }
      P.n++; P.part = 0; save.hints += 2; persist();
      $('gHints').textContent = save.hints; bump($('gHints')); haptic('heavy'); toast('+2 ipucu kazandın');
    },
    mNo: closeModal });
}
function nearLit(i) { const x = i % G.cols, y = i / G.cols | 0; let n = 0; for (const [, dx, dy] of DIRS) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < G.cols && ny < G.rows && G.L.d[ny * G.cols + nx] >= 0) n++; } return n; }
// baştan: süre ve hamle sıfırlanır, ipucuyla açılan karolar korunur
function reset() {
  if (!G || G.won) return;
  const keep = G.fixed.map((f, i) => f ? i : -1).filter(i => i >= 0), mode = G.daily ? 'daily' : 'level', lvl = G.lvl;
  delete save.runs[runKey()];
  start(mode, lvl || save.level);
  if (!G) return;
  keep.forEach(i => { G.cur[i] = G.sol[i]; G.fixed[i] = true; });
  G.L = lit(G); litAt = G.L.d.map(v => v >= 0 ? -1e9 : 0);
  hud(); draw(); saveRun();
  toast('Baştan başladı');
}

const FLAME = '<svg class="flame" viewBox="0 0 24 24"><path d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-2.5 1.2-4 2.5-5 .2 1.8 1 3 2.2 3.3C11 8.6 11.3 5 12 2z"/></svg>';
function streakSheet() {
  dayTick();
  const log = new Set(save.dailyLog), names = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'], done = save.dailyDone === today();
  let week = '';
  for (let k = 6; k >= 0; k--) {
    const d = new Date(); d.setDate(d.getDate() - k); const on = log.has(ymd(d));
    week += `<div><i class="${on ? 'on' : ''} ${k ? '' : 'today'}">${on ? '✓' : ''}</i>${k ? names[(d.getDay() + 6) % 7] : 'Bugün'}</div>`;
  }
  modal(`${FLAME}<h2>${save.streak} gün seri</h2>
    <p>${done ? 'Bugünün hattı tamam.' : save.streak ? 'Bugünün hattını bitir, serini koru!' : 'Günün Hattı\'nı bitir, serini başlat!'}</p>
    <div class="week">${week}</div>
    <div class="statrow"><div><b>${Math.max(save.best || 0, save.streak)}</b><span>en iyi seri</span></div><div><b>${save.dailyLog.length}</b><span>toplam gün</span></div></div>
    ${done ? '<p id="mClock"></p><button id="mClose" class="btn glassbtn">Tamam</button>' : '<button id="mPlayD" class="btn primary"><span>Günün Hattı</span><small>Seriyi koru</small></button>'}`,
    { mClose: closeModal, mPlayD: () => start('daily') });
  dailyClock();
}
function settings() {
  const seg = ['auto', 'dark', 'light'].map(t => `<button data-t="${t}" class="${save.theme === t ? 'on' : ''}">${{ auto: 'Oto', dark: 'Koyu', light: 'Açık' }[t]}</button>`).join('');
  modal(`<h2>Ayarlar</h2>
    <div class="opt">Müzik <button id="oM" class="tog ${save.music ? 'on' : ''}" aria-label="Müzik"></button></div>
    <div class="opt">Efekt sesleri <button id="oS" class="tog ${save.sound ? 'on' : ''}" aria-label="Efekt sesleri"></button></div>
    <div class="opt">Titreşim <button id="oV" class="tog ${save.vib ? 'on' : ''}" aria-label="Titreşim"></button></div>
    <div class="opt">Tema <div class="seg" id="oT">${seg}</div></div>
    <button id="mClose" class="btn glassbtn">Tamam</button>`, {
    oM: () => { save.music = !save.music; persist(); $('oM').classList.toggle('on', save.music); save.music ? Music.start() : Music.stop(); },
    oS: () => { save.sound = !save.sound; persist(); $('oS').classList.toggle('on', save.sound); },
    oV: () => { save.vib = !save.vib; persist(); $('oV').classList.toggle('on', save.vib); haptic(); },
    mClose: closeModal });
  $('oT').onclick = e => { const t = e.target.dataset.t; if (!t) return; save.theme = t; persist(); applyTheme(); refreshHome(); $('oT').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.t === t)); };
}
function how() {
  modal(`<h2>Nasıl oynanır?</h2>
    <div class="how"><i>1</i><span>Karoya dokun → ray 90° döner.</span><i>2</i><span>Merkez istasyondan çıkan hattı <b>tüm duraklara</b> ulaştır. Açıkta ray ucu kalmasın.</span><i>★</i><span>Her yıldız bir hedef: <b>bitir</b> · <b>⏱ süre</b> · <b>↻ hamle</b>. İkisini birden tutturursan <b>KUSURSUZ 👑</b> + ipucu parçası.</span><i>↻</i><span>Aynı karoya art arda dokunmak <b>tek hamle</b> sayılır.</span><i>M2</i><span>Yıldız topla → <b>yeni hatlar</b> aç.</span><i>🔥</i><span>Her gün yeni <b>Günün Hattı</b>. Seriyi bozma!</span></div>
    <button id="mClose" class="btn primary"><span>Başla</span></button>`, { mClose: () => { closeModal(); if (save.played === 0 && !G) start('level'); } });
}

$('bPlay').onclick = () => start('level');
$('bDaily').onclick = () => (save.dailyDone === today() && save.dailyStats?.day === today()) ? dailyResult() : start('daily');
$('bMap').onclick = () => show('map');
$('pBack').onclick = () => show('home');
$('bBack').onclick = () => show('home');
$('bReset').onclick = reset;
$('bHint').onclick = hint;
$('bSettings').onclick = settings;
$('streakChip').onclick = streakSheet;
$('starsChip').onclick = () => show('map');
$('bHow').onclick = how;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { pause(); ac?.suspend?.(); }
  else { ac?.resume?.(); dayTick(); if (active('game')) resume(); if (active('home')) refreshHome(); }
});
// Android geri tuşu: pencere → kapat, oyun/harita → ana sayfa, ana sayfa → arka plana al
const App = window.Capacitor?.Plugins?.App;
App?.addListener?.('backButton', () => {
  if (modalOpen()) { if (mLocked) show('home'); closeModal(); }
  else if (G?.won && active('game')) show('home');
  else if (!active('home')) show('home');
  else App.minimizeApp?.();
});

applyTheme();
show('home');
Ads.init();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
// paylaşılan Günün Hattı bağlantısı: ?d=YYYY-MM-DD&m=hamle
const q = new URLSearchParams(location.search), qd = q.get('d'), qm = +q.get('m');
if (qd) {
  history.replaceState(null, '', location.pathname);
  if (qd === today()) {
    if (save.dailyDone === today()) toast(qm ? `Arkadaşın ${qm} hamlede bitirdi · sen ${save.dailyStats?.moves ?? '?'}` : 'Bugünün hattını zaten bitirdin');
    else { start('daily'); if (qm) setTimeout(() => toast(`Arkadaşın ${qm} hamlede bitirdi · geçebilir misin?`), 700); }
  } else toast('Bu meydan okuma eski · bugünün hattı seni bekliyor');
}
const intro = $('intro');
let introOn = !(window.__noIntro || qd || matchMedia('(prefers-reduced-motion: reduce)').matches);
function endIntro() {
  if (!introOn) return; introOn = false;
  intro.classList.add('out'); document.body.classList.remove('introing');
  setTimeout(() => intro.classList.add('gone'), 600);
}
if (introOn) { document.body.classList.add('introing'); intro.onclick = endIntro; setTimeout(endIntro, 2300); } else intro.classList.add('gone');
if (save.played === 0 && !G) howT = setTimeout(() => { if (!G) how(); }, introOn ? 2900 : 1700);
// test kancası
window.__ray = { generate, lit, rot, limits, get G() { return G; }, get geo() { return geo; } };
})();
