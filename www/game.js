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
const def = { level: 1, stars: {}, hints: DAILY_FREE_HINTS, hintDay: '', streak: 0, lastDaily: '', dailyDone: '', dailyStats: null, runs: {}, crowns: {}, miss: {}, shards: 0, seen: {}, sound: true, music: true, vib: true, theme: 'auto', played: 0, skin: 'metro', dCrowns: 0, newSkin: 0, remind: false, remindAt: 1110, remindAsked: false, noAds: false };
let save;
try { save = Object.assign({}, def, JSON.parse(localStorage.getItem('ray') || '{}')); } catch { save = { ...def }; }
if (!save.runs || typeof save.runs !== 'object') save.runs = {};
if (!save.seen || typeof save.seen !== 'object') save.seen = {};
if (!save.miss || typeof save.miss !== 'object') save.miss = {};
if (!Array.isArray(save.dailyLog)) save.dailyLog = save.lastDaily ? [save.lastDaily] : [];
const persist = () => { try { localStorage.setItem('ray', JSON.stringify(save)); } catch {} };
// gün değişimi: ücretsiz ipucu, kopan seri
function dayTick() {
  const t = today();
  if (save.hintDay !== t) { save.hints = Math.max(save.hints, DAILY_FREE_HINTS); save.hintDay = t; }
  if (save.lost && save.lost.day !== t) save.lost = null;   // kurtarma hakkı yalnızca o gün
  if (save.streak && save.lastDaily !== t && save.lastDaily !== dayBefore(t)) {
    // tek gün kaçtıysa (ve seri ≥ 2) bugün içinde videoyla kurtarılabilir
    if (save.streak >= 2 && save.lastDaily === dayBefore(dayBefore(t))) save.lost = { n: save.streak, day: t, part: 0 };
    save.streak = 0;
  }
  persist();
  $('gHints').textContent = save.hints;
}

// ---------- hatlar ve yıldız kapıları ----------
const lineOf = l => Math.floor((l - 1) / PER_LINE);
const lineName = c => `M${c + 1} · ${(skin().names || LINE_NAMES)[c % 6]} Hat`;
const need = c => Math.round(c * PER_LINE * STAR_AVG);
const totalStars = () => Object.values(save.stars).reduce((a, b) => a + b, 0);
const unlocked = c => totalStars() >= need(c);

// ---------- tema / palet ----------
let pal = {};
const isLight = () => save.theme === 'light' || (save.theme === 'auto' && matchMedia('(prefers-color-scheme: light)').matches);
// ---------- hat temaları: kusursuz bitirilen bölümlerin taçlarıyla (👑) açılır ----------
const SKINS = [
  { id: 'metro', name: 'Metro', need: 0 },
  { id: 'sunset', name: 'Gün Batımı', need: 3, lines: ['#ff9e7a', '#ffcf6b', '#ff6f91', '#c98bff', '#ffb86b', '#ff8fab'], names: ['Mercan', 'Kehribar', 'Gül', 'Lavanta', 'Şeftali', 'Pembe'], acc: ['#ffb36b', '#ff6f91'], glow: ['#ff9e5a', '#c86bff', '#ff5f7e'] },
  { id: 'ocean', name: 'Okyanus', need: 8, lines: ['#5ce1e6', '#4fa3ff', '#7dd3fc', '#38d9a9', '#a5b4fc', '#2dd4bf'], names: ['Lagün', 'Derin Mavi', 'Gök', 'Yosun', 'Lila', 'Turkuaz'], acc: ['#5ce1e6', '#5b8cff'], glow: ['#3fb6d9', '#3a5bff', '#2dd4bf'] },
  { id: 'neon', name: 'Neon Gece', need: 15, lines: ['#ff3ddc', '#22e6ff', '#39ff88', '#fff23a', '#ff8a1f', '#b84dff'], names: ['Neon Pembe', 'Elektrik', 'Fosfor', 'Limon', 'Lav', 'Ultraviyole'], acc: ['#ff3ddc', '#22e6ff'], glow: ['#ff3ddc', '#22e6ff', '#7a2bff'] },
  { id: 'sakura', name: 'Sakura', need: 25, lines: ['#ffb7c5', '#e7a6ff', '#ff8fab', '#ffd6a5', '#9ee6c0', '#f9a8d4'], names: ['Sakura', 'Leylak', 'Gül', 'Şeftali', 'Nane', 'Pembe'], acc: ['#ffb7c5', '#e48bff'], glow: ['#ff9fb8', '#c58bff', '#ffd1a1'] },
  { id: 'gold', name: 'Altın', need: 40, vip: true, lines: ['#ffd36b', '#f5b942', '#ffe7a3', '#e9a93a', '#fff1b8', '#d9a520'], names: ['Altın', 'Bal', 'Fildişi', 'Kehribar', 'Krem', 'Hardal'], acc: ['#ffd36b', '#e9a23a'], glow: ['#ffcf6b', '#b8862b', '#ffe8a3'] },
];
const crownCount = () => Object.keys(save.crowns).length + (save.dCrowns || 0);
const skinOpen = k => crownCount() >= k.need || (k.vip && save.noAds);
const skin = () => { const k = SKINS.find(x => x.id === save.skin); return k && skinOpen(k) ? k : SKINS[0]; };
const shade = (hex, f) => '#' + [16, 8, 0].map(b => Math.round((parseInt(hex.slice(1), 16) >> b & 255) * f).toString(16).padStart(2, '0')).join('');
const skinCols = k => k.lines ? (isLight() ? k.lines.map(c => shade(c, .78)) : k.lines) : isLight() ? LINES_LIGHT : LINES_DARK;
const lineCols = () => skinCols(skin());
// tema renkleri CSS değişkenlerine yazılır; Metro'da hiçbiri yazılmaz → stil dosyasındaki asıl değerler
function applySkin() {
  const k = skin(), st = document.documentElement.style, L = isLight();
  ['--acc', '--acc2', '--accGlow', '--starGlow', '--g1', '--g1a', '--g2', '--g2a', '--g3', '--g3a', '--ln1', '--ln2', '--ln3'].forEach(v => st.removeProperty(v));
  if (!k.lines) return;
  const [a1, a2] = k.acc.map(c => L ? shade(c, .82) : c);
  st.setProperty('--acc', a1); st.setProperty('--acc2', a2);
  st.setProperty('--accGlow', rgba(a2, L ? .55 : .7)); st.setProperty('--starGlow', rgba(a1, .6));
  k.glow.forEach((c, j) => { st.setProperty(`--g${j + 1}`, c); st.setProperty(`--g${j + 1}a`, rgba(c, .35)); });
  skinCols(k).slice(0, 3).forEach((c, j) => st.setProperty(`--ln${j + 1}`, c));
}
function applyTheme() {
  applySkin();
  if (save.theme === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.dataset.theme = save.theme;
  const cs = getComputedStyle(document.documentElement), v = n => cs.getPropertyValue(n).trim();
  pal = { tile: v('--tile'), pin: v('--pin'), stroke: v('--stroke'), rail: v('--railC'), mut: v('--mut'), bg: v('--bg0'), fg: v('--fg'), light: isLight() };
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

// Yeni kural gelen hatlar (0 tabanlı). M4: sabit karolar · M6: eşli karolar.
const RULES = {
  3: { name: 'Sabit karo', tag: 'Yeni: sabit karo', demo: '<div class="rdemo" aria-hidden="true"><i class="rt"><b></b></i><i class="rtap"></i></div>',
    text: 'Koyu, cıvatalı karolar <b>dönmez</b>. Zaten doğru yöndeler: etrafındaki hattı <b>onlara göre</b> bağla. Hamle saymazlar.' },
  5: { name: 'Eşli karo', tag: 'Yeni: eşli karo', demo: '<div class="rdemo2" aria-hidden="true"><i class="pt"><b></b><em>1</em></i><i class="pt"><b></b><em>1</em></i><i class="rtap2"></i></div>',
    text: 'Aynı renk ve numaralı iki karo <b>birlikte döner</b>: birine dokununca öteki de çevrilir. İkisinin de oturacağı yönü bul. Tek dokunuş = <b>1 hamle</b>.' },
};
const PINS_FROM = 3, PAIRS_FROM = 5;                    // M4+: sabit karolar · M6+: eşli karolar
const PAIR_COLS = ['#ff7ab6', '#4cc9ff', '#ffc94d', '#8fe388', '#c39bff'];
const TIERS = [[3, 3], [4, 4], [4, 5], [5, 6], [5, 7], [6, 8], [7, 9]], CAPS = [3, 8, 15, 25, 40, 60, 1e9];
function sizeFor(l) {
  let k = CAPS.findIndex(m => l <= m);
  // testere dişi: yeni kural gelen hattın ilk 3 bölümü bir küçük ızgara → kural rahat öğrenilir
  if (RULES[lineOf(l)] && (l - 1) % PER_LINE < 3) k = Math.max(0, k - 1);
  return TIERS[k];
}

// ---------- üretim: merkezden rastgele ağaç (her zaman çözülebilir) ----------
function generate(cols, rows, seed, pins = 0, pairs = 0) {
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
  // sabit karolar: doğru yönde, dönmez (merkez ve 4'lü kavşak hariç). pins=0 iken eski bölümler aynen kalır.
  const pinned = new Array(n).fill(false);
  if (pins) {
    const cand = []; for (let i = 0; i < n; i++) if (i !== hub && sol[i] !== 15) cand.push(i);
    for (let k = 0; k < pins && cand.length; k++) { const i = cand.splice(R() * cand.length | 0, 1)[0]; pinned[i] = true; cur[i] = sol[i]; }
  }
  // eşli karolar: iki karo birlikte döner. İkisi de aynı sayıda dokunuşla oturacak şekilde karıştırılır → her zaman çözülebilir.
  const link = new Array(n).fill(-1);
  if (pairs) {
    const cand = []; for (let i = 0; i < n; i++) if (i !== hub && !pinned[i] && sol[i] !== 15) cand.push(i);
    for (let k = 0; k < pairs && cand.length > 1; k++) {
      const a = cand.splice(R() * cand.length | 0, 1)[0], b = cand.splice(R() * cand.length | 0, 1)[0], t = 1 + (R() * 3 | 0);
      for (const i of [a, b]) { let v = sol[i]; for (let q = 0; q < 4 - t; q++) v = rot(v); cur[i] = v; }   // t dokunuşta çözüme döner
      link[a] = b; link[b] = a;
    }
  }
  // çözülmüş hâlde gelmesin
  if (cur.every((v, i) => v === sol[i])) { const i = cur.findIndex((v, j) => !pinned[j] && link[j] < 0 && rot(v) !== v); cur[i] = rot(cur[i]); }
  // par: döndürülmesi gereken karo (eş = 1) sayısı · taps: gereken en az dokunuş (süre hedefi için)
  let par = 0, taps = 0;
  cur.forEach((v, i) => {
    const j = link[i]; if (j >= 0 && j < i) return;
    let r = 0, t = v, u = j >= 0 ? cur[j] : 0;
    while ((t !== sol[i] || (j >= 0 && u !== sol[j])) && r < 4) { t = rot(t); if (j >= 0) u = rot(u); r++; }
    taps += r; if (r) par++;
  });
  return { cols, rows, sol, cur, hub, par, taps, pinned, link, fixed: new Array(n).fill(false) };
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
// hamle toleransı zorlukla büyür: küçük ızgara +%100 → 7×9 +%130 (en az +5). Oyuncu karoları denerken gidip gelir; hedef bunu kaldırmalı.
const moveTol = n => 1 + .3 * Math.min(1, Math.max(0, (n - 9) / 54));
function limits(P) {
  return { m: P.par + Math.max(5, Math.round(P.par * moveTol(P.cur.length))), t: Math.max(20, Math.round(P.taps * 1.6 + P.cur.length * .7)) };
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
  // MENÜ: Re majör müzik kutusu (D – Bm – G – A), sakin.
  const MENU = [[50, 62, 66, 69, 74], [47, 59, 62, 66, 71], [43, 55, 59, 62, 67], [45, 57, 61, 64, 69]];
  const MPAT = [[1, 2, 3, 4, 3, 2, 3, 2], [1, 3, 2, 4, 2, 3, 1, 3]];
  // OYUN: Re minör (Dm – B♭ – F – C). Gerilim (0–1) arttıkça tempo hızlanır, katmanlar eklenir.
  const GAME = [[50, 62, 65, 69, 74], [46, 58, 62, 65, 70], [41, 57, 60, 65, 69], [48, 60, 64, 67, 72]];
  const ALARM = [[50, 62, 65, 69, 74], [45, 61, 64, 67, 73]];   // son saniyeler: Dm ↔ A7
  const GPAT = [1, 2, 3, 2, 4, 2, 3, 2];
  const VOL = .55, hz = m => 440 * Math.pow(2, (m - 69) / 12);
  let on = false, mode = 'menu', tension = 0, alarm = false, barT = 0, barAlarm = false, master, lp, noise, timer = 0, next = 0, step = 0;
  function setup() {
    master = ac.createGain(); master.gain.value = 0;
    lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
    master.connect(lp).connect(ac.destination);
    noise = ac.createBuffer(1, ac.sampleRate * .06, ac.sampleRate);
    const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function bell(m, t, v, len) {
    const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), g2 = ac.createGain();
    o.frequency.value = hz(m); o2.frequency.value = hz(m) * 2; g2.gain.value = .22;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .015); g.gain.exponentialRampToValueAtTime(.0005, t + len);
    o.connect(g); o2.connect(g2).connect(g); g.connect(master);
    o.start(t); o2.start(t); o.stop(t + len + .05); o2.stop(t + len + .05);
  }
  function hat(t, v) {
    const src = ac.createBufferSource(), hp = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noise; hp.type = 'highpass'; hp.frequency.value = 7000;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .05);
    src.connect(hp).connect(g).connect(master); src.start(t); src.stop(t + .06);
  }
  function thump(t, v) {   // kalp atışı
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(45, t + .12);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .22);
    o.connect(g).connect(master); o.start(t); o.stop(t + .25);
  }
  function sched() {
    while (next < ac.currentTime + .6) {
      const beat = step % 8, bar = step / 8 | 0;
      let dt = .45;
      if (mode === 'menu') {
        const c = MENU[bar % 4], cycle = (bar / 4 | 0) % 4;
        if (beat === 0) bell(c[0], next, .1, 3.2);
        if (cycle !== 3 || beat < 4) bell(c[MPAT[cycle % 2][beat]], next, beat % 2 ? .045 : .06, 1.8);
      } else if (mode === 'game') {
        // tempo, akor ve ses rengi yalnızca ölçü başında değişir → geçişler pürüzsüz
        if (beat === 0) { barT = tension; barAlarm = alarm; lp.frequency.setTargetAtTime(1600 + 3200 * barT, next, .6); }
        const T = barT, prog = barAlarm ? ALARM : GAME, c = prog[bar % prog.length];
        dt = .36 - .14 * T;                                                     // 8'lik: ~83 → ~136 bpm
        if (beat === 0) bell(c[0], next, .09, 2.4);                              // bas
        if (T > .2 && (T > .5 || beat % 2 === 0)) bell(c[0] + 12, next, .03 + .05 * T, .3);   // bas nabzı
        bell(c[GPAT[beat]] + (T > .7 ? 12 : 0), next, .035 + .02 * T, .9);       // arpej
        if (T > .45 && beat % 2) hat(next, .012 + .03 * T);                      // tıkırtı
        if (T > .8 && beat % 2 === 0) hat(next, .008 + .012 * T);
        if (barAlarm && beat % 4 === 0) { thump(next, .2); thump(next + .14, .12); }   // son 10 sn: kalp atışı
      }                                                                          // 'rest': sessiz
      next += dt; step++;
    }
  }
  function start() {
    if (on || !save.music) return;
    try {
      ensureAC(); if (!master) setup();
      on = true; next = Math.max(next, ac.currentTime + .1);
      master.gain.cancelScheduledValues(ac.currentTime); master.gain.setValueAtTime(master.gain.value, ac.currentTime);
      master.gain.linearRampToValueAtTime(VOL, ac.currentTime + 2.5);
      clearInterval(timer); timer = setInterval(sched, 250); sched();
    } catch {}
  }
  function stop() {
    if (!on) return; on = false; clearInterval(timer);
    try { master.gain.cancelScheduledValues(ac.currentTime); master.gain.setTargetAtTime(0, ac.currentTime, .3); } catch {}
  }
  function setMode(m) { if (m === mode) return; mode = m; step = 0; if (m !== 'game') { tension = barT = 0; alarm = barAlarm = false; } }
  function setTension(x, a = false) { tension = Math.max(0, Math.min(1, x)); alarm = a; }
  return { start, stop, setMode, setTension, state: () => ({ on, mode, tension, alarm }) };
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
let toastT, mLocked = false, howBack = null, mOnClose = null;   // mOnClose: pencere nasıl kapanırsa kapansın bir kez çalışır   // howBack: anlatıcı açıkken Android geri tuşu
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }
const active = id => $(id).classList.contains('active');
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  document.body.classList.toggle('playing', id === 'game');
  if (id === 'game') resume(); else pause();
  Music.setMode(id === 'game' ? 'game' : 'menu');
  if (id === 'home') { refreshHome(); setTimeout(maybeRescue, 600); if (G && Remind.avail() && !save.remindAsked && (save.dailyDone || save.played >= 6)) setTimeout(() => { if (active('home') && !modalOpen()) remindAsk(); }, 700); }
  if (id === 'map') renderMap();
  clearInterval(clockT); if (id === 'home') clockT = setInterval(dailyClock, 1000);
}
const bind = binds => { for (const [id, fn] of Object.entries(binds)) { const el = $(id); if (el) el.onclick = fn; } };
function modal(html, binds = {}, locked = false) {
  mLocked = locked; howBack = null; mOnClose = null;
  const sh = $('mCard'); sh.innerHTML = html; sh.scrollTop = 0; $('modal').classList.add('open');
  sh.classList.toggle('fit', sh.scrollHeight <= sh.clientHeight + 1);   // sığan pencere: her yerinden aşağı çekilebilir
  bind(binds);
}
const closeModal = () => { howBack = null; const f = mOnClose; mOnClose = null; $('modal').classList.remove('open'); f?.(); };
const modalOpen = () => $('modal').classList.contains('open');
$('modal').onclick = e => { if (e.target.id === 'modal' && !mLocked) closeModal(); };
// alt pencere: aşağı kaydırarak kapat. Kilitli pencere (anlatıcı, kural kartı) hafifçe esneyip geri gelir.
{
  const sh = $('mCard');
  let y0 = null, dy = 0, t0 = 0, pid = 0, dragged = false;
  sh.addEventListener('pointerdown', e => {
    if (e.target.closest('.demobox,.hunt') || sh.scrollTop > 0) return;
    y0 = e.clientY; dy = 0; t0 = performance.now(); pid = e.pointerId; dragged = false;
  });
  sh.addEventListener('pointermove', e => {
    if (y0 == null || e.pointerId !== pid) return;
    dy = e.clientY - y0;
    if (!dragged && dy > 8) { dragged = true; sh.classList.add('drag'); sh.setPointerCapture?.(pid); }
    if (dragged) sh.style.transform = `translateY(${Math.max(0, mLocked ? dy * .15 : dy)}px)`;
  });
  const end = () => {
    if (y0 == null) return; y0 = null;
    if (!dragged) return;
    sh.classList.remove('drag'); sh.style.transform = '';
    const v = dy / Math.max(1, performance.now() - t0);
    if (!mLocked && (dy > 110 || (dy > 40 && v > .6))) { closeModal(); haptic(); }
  };
  sh.addEventListener('pointerup', end); sh.addEventListener('pointercancel', end);
  sh.addEventListener('click', e => { if (dragged) { e.stopPropagation(); e.preventDefault(); dragged = false; } }, true);   // sürükleme sonrası düğmeye basılmış sayılmasın
}
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
  $('sStreak').textContent = save.streak; $('streakChip').classList.toggle('new', rescueOk());
  $('sCrowns').textContent = crownCount(); $('crownChip').classList.toggle('new', !!save.newSkin);
  $('sHints').textContent = save.hints;
  $('hLevel').textContent = save.level;
  const done = save.dailyDone === today();
  $('bDaily').classList.toggle('done', done);
  $('dailyTitle').textContent = done ? 'Tamamlandı ✓' : 'Hazır';
  if (done) dailyClock(); else $('dailyState').textContent = rescueOk() ? `💔 ${save.lost.n} günlük serin koptu · kurtar` : save.streak ? `🔥 ${save.streak} günlük serini koru` : 'Her gün yeni bir hat';
  const c = lineOf(save.level), nx = c + 1, lo = need(c), hi = need(nx);
  $('lineName').textContent = lineName(c);
  $('lineName').style.color = lineCols()[c % 6];
  $('gateTxt').textContent = tot >= hi ? `★ ${tot} · M${nx + 1} açık` : `★ ${tot} / ${hi} → M${nx + 1}`;
  $('progBar').style.width = Math.min(100, Math.max(4, (tot - lo) / Math.max(1, hi - lo) * 100)) + '%';
  const [w, h] = sizeFor(save.level); $('sSize').textContent = `${w}×${h} ızgara`;
  $('bPlay').classList.toggle('locked', !unlocked(c));
}

// ---------- hat haritası (bölüm seçimi) ----------
function renderMap() {
  const tot = totalStars(), last = lineOf(save.level) + 1, col = lineCols();
  $('pStars').textContent = tot;
  $('pSub').textContent = 'Yıldız topla → yeni hat aç';
  let html = '';
  for (let c = 0; c <= Math.max(1, last); c++) {
    const open = unlocked(c), first = c * PER_LINE + 1;
    const got = Array.from({ length: PER_LINE }, (_, k) => save.stars[first + k] || 0).reduce((a, b) => a + b, 0);
    html += `<div class="line ${open ? '' : 'lockd'}" style="--lc:${col[c % 6]}">
      <div class="lh"><i class="dot"></i><b>${lineName(c)}${RULES[c] ? `<em>${RULES[c].tag}</em>` : ''}</b><small>${open ? `★ ${got} / ${PER_LINE * 3}` : `🔒 ★ ${tot} / ${need(c)}`}</small></div>
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
let litAt = [], ripples = [], parts = [], links = [], winT = 0, raf = 0, winTimer = 0, tickT = 0, howT = 0, sessionWins = 0;

// süre yalnızca oyun ekranı açıkken ve uygulama öndeyken akar
const elapsed = () => G ? G.ms + (G.runAt ? performance.now() - G.runAt : 0) : 0;
function pause() { if (G?.runAt) { G.ms += performance.now() - G.runAt; G.runAt = 0; saveRun(); } clearInterval(tickT); }
function resume() { if (G && !G.won && !G.runAt && !document.hidden) { G.runAt = performance.now(); clearInterval(tickT); tickT = setInterval(tick, 250); } }

function setLineColor() {
  const k = G.daily ? 2 : lineOf(G.lvl) % 6;
  G.color = lineCols()[k];
  $('game').style.setProperty('--line', G.color);
}
const runKey = () => G.daily ? 'daily' : 'level';
function saveRun() {
  if (!G || G.won) return;
  save.runs[runKey()] = { lvl: G.lvl, day: G.day, cur: G.cur, fixed: G.fixed, moves: G.moves, last: G.lastTile, ms: elapsed(), lk: 1 };
  persist();
}
function start(mode, lvl = save.level) {
  clearTimeout(howT); clearTimeout(winTimer); closeModal(); closePanel();
  const daily = mode === 'daily', day = today();
  if (!daily && !unlocked(lineOf(lvl))) { lockedSheet(lineOf(lvl)); return; }
  const [c, r] = daily ? [6, 8] : sizeFor(lvl);
  const seed = daily ? hashStr('ray' + day) : lvl * 7919 + 13, ln = lineOf(lvl);
  const intro = lvl === ln * PER_LINE + 1;   // yeni kuralın ilk bölümü: kolay
  const pins = daily || ln < PINS_FROM ? 0 : Math.round(c * r * (intro && ln === PINS_FROM ? .22 : .14));
  const pairs = daily || ln < PAIRS_FROM ? 0 : Math.max(1, Math.round(c * r * (intro && ln === PAIRS_FROM ? .03 : .07)));
  G = { ...generate(c, r, seed, pins, pairs), daily, lvl: daily ? 0 : lvl, day: daily ? day : null, practice: daily && save.dailyDone === day, moves: 0, lastTile: -1, won: false, ms: 0, runAt: 0 };
  G.lim = limits(G);
  // yarım kalan oyunu sürdür
  const run = save.runs[daily ? 'daily' : 'level'];
  if (run && (daily ? run.day === day : run.lvl === lvl) && run.cur?.length === G.cur.length && (!pairs || run.lk)) {   // eşli karo öncesi yarım kayıt geçersiz
    G.cur = run.cur.slice(); G.fixed = run.fixed.slice(); G.moves = run.moves; G.lastTile = run.last ?? -1; G.ms = run.ms || 0;
  }
  setLineColor();
  G.L = lit(G); anim.clear(); press.clear(); ripples = []; parts = []; links = []; winT = 0;
  litAt = G.L.d.map(v => v >= 0 ? -1e9 : 0);
  G.tOk = timeOk(G.ms / 1000); G.mOk = movesOk();
  $('gTitle').textContent = daily ? (G.practice ? 'Günün Hattı · pratik' : 'Günün Hattı') : 'Bölüm ' + lvl;
  $('gMoves').textContent = daily ? new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) : lineName(lineOf(lvl));
  $('gHints').textContent = save.hints;
  show('game'); resize(); hud(); tick();
  if (!daily && RULES[ln] && !save.seen[ln]) ruleCard(ln);
  if (save.played === 0) setTimeout(() => toast('Karoya dokun → döner'), 500);
  else if (!daily && save.miss[lvl] && !save.crowns[lvl] && !G.moves) setTimeout(() => toast(`Geçen sefer: ${missTxt(lvl)}`), 600);
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
  // gerilim: süre hedefinin %30'undan sonra 8 kademede artar; hedef geçince de 2 katına kadar artmaya devam eder
  if (!G.won) { const r = sec / G.lim.t, T = r < .3 ? 0 : r <= 1 ? (r - .3) / .7 * .8 : .8 + Math.min(1, r - 1) * .2; Music.setTension(Math.round(T * 8) / 8, tOk && left <= 10); }
}
function lose(msg) { bump($('gPill')); tone(294, .2, .012); haptic('light'); toast(msg); }

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
  // sabit karo: koyu beton zemin + köşelerde cıvata
  if (G.pinned.includes(true)) {
    tiles(i => G.pinned[i]); cx.fillStyle = pal.pin; cx.fill();
    cx.fillStyle = pal.mut; cx.beginPath();
    for (let i = 0; i < n; i++) if (G.pinned[i]) { const [x, y, , sc] = X[i], o = s * .31 * sc, r = s * .038; for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { cx.moveTo(x + dx * o + r, y + dy * o); cx.arc(x + dx * o, y + dy * o, r, 0, 7); } }
    cx.fill();
  }
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
  // 6b) eşli karolar: aynı renk + numara rozeti (sol üst); dokununca eşler arasında kesik çizgi
  if (G.link.some(v => v >= 0)) {
    const ids = {}; let k = 0; for (let i = 0; i < n; i++) if (G.link[i] > i) ids[i] = ids[G.link[i]] = k++;
    const r = s * .145;
    cx.font = `800 ${Math.round(s * .19)}px Outfit, system-ui`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.lineWidth = 2;
    for (const i in ids) {
      const [x, y, , sc] = X[i], bx = x - s * .27 * sc, by = y - s * .27 * sc, pc = PAIR_COLS[ids[i] % PAIR_COLS.length], w = (s - 6) * sc;
      cx.globalAlpha = G.fixed[i] ? .45 : 1;
      cx.strokeStyle = rgba(pc, .55); rr(x - w / 2, y - w / 2, w, w, s * .24 * sc); cx.stroke();   // karo kenarı eşin renginde
      cx.fillStyle = pc; cx.beginPath(); cx.arc(bx, by, r, 0, 7); cx.fill();
      cx.fillStyle = '#16182a'; cx.fillText(ids[i] + 1, bx, by + 1);
    }
    cx.globalAlpha = 1; cx.textBaseline = 'alphabetic';
    cx.lineWidth = 3; cx.setLineDash([6, 7]);
    links = links.filter(L => {
      const t = (now - L.t) / 650; if (t >= 1) return false;
      const [x1, y1] = X[L.a], [x2, y2] = X[L.b];
      cx.strokeStyle = rgba(PAIR_COLS[ids[L.a] % PAIR_COLS.length], .8 * (1 - t)); cx.beginPath(); cx.moveTo(x1, y1); cx.lineTo(x2, y2); cx.stroke();
      return busy = true;
    });
    cx.setLineDash([]);
  }
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
  if (G.pinned[i]) { haptic('light'); tone(220, .05, .015); press.set(i, now); kick(); if (!G.pinTold) { toast('Sabit karo · dönmez'); G.pinTold = true; } return; }
  const j = G.link[i], key = j >= 0 ? Math.min(i, j) : i;
  G.cur[i] = rot(G.cur[i]);
  if (G.lastTile !== key) { G.moves++; G.lastTile = key; }   // aynı karoya (ya da eşine) art arda dokunuş = 1 hamle
  anim.set(i, now); press.set(i, now); ripples.push({ x: px, y: py, t: now });
  if (j >= 0) {   // eşi de döner
    G.cur[j] = rot(G.cur[j]); anim.set(j, now); press.set(j, now); links.push({ a: i, b: j, t: now });
    if (!save.pairTold) { save.pairTold = 1; persist(); toast('Eşli karo · ikisi birlikte döner'); }
  }
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
  Music.setMode('rest'); setTimeout(() => { if (G?.won) Music.setMode('menu'); }, 1600);
  const tOk = timeOk(G.time / 1000), mOk = movesOk(), st = 1 + tOk + mOk, perfect = tOk && mOk;
  save.played++;
  const cr0 = crownCount();
  let extra = '', unlockedNow = null, shard = false, dbl = 0;   // dbl: videoyla ikiye katlanabilecek ipucu
  if (G.daily) {
    if (save.dailyDone !== G.day) {
      save.streak = save.lastDaily === dayBefore(G.day) ? save.streak + 1 : 1; save.lastDaily = save.dailyDone = G.day;
      save.dailyLog = [...save.dailyLog.filter(d => d !== G.day), G.day].slice(-90); save.best = Math.max(save.best || 0, save.streak);
      save.hints++; dbl = 1; extra = `🔥 ${save.streak} gün seri · +1 ipucu`; Remind.habit(); Remind.plan();
      save.dailyStats = { day: G.day, moves: G.moves, time: G.time, st, perfect };
      shard = perfect; if (perfect) save.dCrowns = (save.dCrowns || 0) + 1;
    }
  } else {
    sessionWins++;
    const before = totalStars(), old = save.stars[G.lvl] || 0, firstClear = G.lvl >= save.level;
    save.stars[G.lvl] = Math.max(old, st);
    // hangi hedef ne kadar kaçtı: [⏱ sn geç, ↻ hamle fazla]. Taç topla listesi ve tekrar oynarken gösterilir.
    if (perfect) delete save.miss[G.lvl]; else if (st >= old) save.miss[G.lvl] = [tOk ? 0 : Math.ceil(G.time / 1000 - G.lim.t), mOk ? 0 : G.moves - G.lim.m];
    if (st > old && old) extra = `Yeni rekor: ${starTxt(st)}`;
    save.level = Math.max(save.level, G.lvl + 1);
    if (G.lvl % 10 === 0 && firstClear) { save.hints += 2; dbl = 2; extra = '🎁 Hat tamam · +2 ipucu'; }
    if (perfect && !save.crowns[G.lvl]) { save.crowns[G.lvl] = 1; shard = true; }   // parça bölüm başına bir kez
    for (let c = 1; c <= lineOf(save.level) + 1; c++) if (need(c) > before && unlocked(c)) unlockedNow = c;
  }
  let shardMsg = '';
  if (shard) {
    save.shards = (save.shards || 0) + 1;
    if (save.shards >= 3) { save.shards -= 3; save.hints++; shardMsg = '💎 3 parça birleşti · +1 ipucu'; } else shardMsg = `💎 İpucu parçası ${save.shards}/3`;
  }
  const ns = SKINS.find(k => k.need > cr0 && k.need <= crownCount() && !(k.vip && save.noAds));
  if (ns) { save.newSkin = 1; extra = [extra, `🎨 Yeni tema: ${ns.name}`].filter(Boolean).join(' · '); }
  persist();
  const g = G, wait = 120 + Math.max(...G.L.d) * 45 + 650, info = { st, tOk, mOk, perfect, extra: [shardMsg, extra].filter(Boolean).join(' · '), unlockedNow, ns, dbl };
  winTimer = setTimeout(() => { if (G === g && active('game')) winSheet(g, info); }, wait);
}
// Sonuç paneli tahtanın altına yerleşir; tahta küçülüp üstte görünür kalır.
function winSheet(g, { st, tOk, mOk, perfect, extra, unlockedNow, ns, dbl }) {
  const L = g.lim, nx = g.lvl + 1, nxLocked = !g.daily && !unlocked(lineOf(nx));
  const badge = unlockedNow ? `<span class="badge">YENİ HAT AÇILDI · M${unlockedNow + 1}</span>` : ns ? '<span class="badge">YENİ TEMA 🎨</span>' : perfect ? '<span class="badge">KUSURSUZ 👑</span>' : '';
  const tip = perfect ? '' : `<p class="tip">Kusursuz için: ${[tOk ? '' : `⏱ ≤ ${fmtT(L.t * 1000)}`, mOk ? '' : `↻ ≤ ${L.m} hamle`].filter(Boolean).join(' ve ')}</p>`;
  const primary = g.daily
    ? '<button id="mShare" class="btn primary"><span>Paylaş</span><small>Arkadaşına meydan oku</small></button><button id="mHome" class="btn glassbtn">Ana sayfa</button>'
    : `${nxLocked ? `<button id="mMap" class="btn primary"><span>Yeni hat kilitli</span><small>★ ${totalStars()} / ${need(lineOf(nx))} · yıldız topla</small></button>` : `<button id="mNext" class="btn primary"><span>Sonraki</span><small>Bölüm ${nx}</small></button>`}
       <div class="row2"><button id="mRetry" class="btn glassbtn">Tekrar</button><button id="mShare" class="btn glassbtn">Paylaş</button><button id="mHome" class="btn glassbtn">Ana sayfa</button></div>`;
  $('winPanel').innerHTML = `<div class="wp-top"><div class="wp-sum">${starsHtml([true, tOk, mOk])}<div class="wp-t"><h2>${g.practice ? 'Pratik tamam!' : g.daily ? 'Günün hattı tamam!' : 'Hat açıldı!'}</h2>${badge}</div></div>
      <button id="wTog" class="wp-tog" aria-label="Hattı gör"><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg><span>Hattı gör</span></button></div>
    <div class="wp-more"><div class="statrow"><div><b class="${tOk ? 'ok' : 'miss'}">${fmtT(g.time)}<small> / ${fmtT(L.t * 1000)}</small></b><span>⏱ süre ${tOk ? '★' : '✗'}</span></div><div><b class="${mOk ? 'ok' : 'miss'}">${g.moves}<small> / ${L.m}</small></b><span>↻ hamle ${mOk ? '★' : '✗'}</span></div></div>${tip}${extra ? `<p class="tip">${extra}${dbl && Ads.online() ? ` <button id="mDbl" class="dbl">▶ 2 katı</button>` : ''}</p>` : ''}</div>
    ${primary}`;
  $('game').classList.add('won');
  bind({ wTog: toggleMini, mNext: next, mDbl: () => doubleReward(dbl), mMap: () => show('map'), mRetry: () => start('level', g.lvl), mHome: () => show('home'),
    // pratikte paylaşılan, günün resmî (ilk) sonucudur
    mShare: () => share(g.practice && save.dailyStats ? { ...save.dailyStats, daily: true } : { daily: g.daily, lvl: g.lvl, day: g.day, moves: g.moves, time: g.time, st, perfect }) });
}
// hat sonu / Günün Hattı ödülü: isteğe bağlı bir video → ödül bir kez daha
async function doubleReward(n) {
  const b = $('mDbl'); if (!b || Ads.busy()) return;
  b.disabled = true; b.textContent = 'Yükleniyor…'; Music.stop();
  const ok = await Ads.rewarded(); Music.start();
  if (!ok) { b.disabled = false; b.textContent = '▶ 2 katı'; toast(Ads.online() ? 'Ödül alınamadı · video sonuna kadar izlenmeli' : 'Bağlantı yok · sonra dene'); return; }
  save.hints += n; persist(); $('gHints').textContent = save.hints;
  b.outerHTML = `<b class="dblok">✓ +${n}</b>`; haptic('heavy'); tone(note(9), .3, .045); toast(`+${n} ipucu daha 🎁`);
}
function toggleMini() {
  const mini = $('game').classList.toggle('mini');
  $('wTog').querySelector('span').textContent = mini ? 'Sonuç' : 'Hattı gör';
  haptic(); tone(mini ? 440 : 587, .06, .02);
}
function closePanel() { $('game').classList.remove('won', 'mini'); $('winPanel').innerHTML = ''; }
async function next() {
  if (!G.daily && !save.noAds && save.played >= 5 && sessionWins % INTER_EVERY === 0) {
    Music.stop(); const shown = await Ads.interstitial(); Music.start();
    if (shown && (save.interN = (save.interN || 0) + 1) % 3 === 0) { persist(); setTimeout(() => toast('Reklamsız oyna → Ayarlar · Reklamsız paket'), 900); }
  }
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

// ---------- günlük hatırlatma: cihazda planlanan bildirim (internet gerekmez) ----------
// Uygulama her arka plana geçtiğinde yeniden planlanır: bugün (Günün Hattı bitmediyse), yarın, 3. ve 7. gün.
const Remind = (() => {
  const LN = () => window.Capacitor?.Plugins?.LocalNotifications;
  // saat sorulmaz: oyuncunun Günün Hattı'nı bitirdiği saat (15 dk'ya yuvarlı, 08:00–21:30 arası)
  const habit = () => { const d = new Date(); save.remindAt = Math.min(1290, Math.max(480, Math.round((d.getHours() * 60 + d.getMinutes()) / 15) * 15)); };
  async function perm() {
    const P = LN(); if (!P) return false;
    try { let r = await P.checkPermissions(); if (r.display !== 'granted') r = await P.requestPermissions(); return r.display === 'granted'; } catch { return false; }
  }
  async function plan() {
    const P = LN(); if (!P) return;
    try {
      await P.cancel({ notifications: [1, 2, 3, 4].map(id => ({ id })) });
      if (!save.remind) return;
      const h = (save.remindAt ?? 1110) / 60 | 0, m = (save.remindAt ?? 1110) % 60, now = new Date();
      const at = d => { const x = new Date(now); x.setDate(x.getDate() + d); x.setHours(h, m, 0, 0); return x; };
      const done = save.dailyDone === today(), sk = save.streak, list = [];
      if (!done && at(0) - now > 20 * 60e3) list.push([1, at(0), save.lost?.day === today() ? 'Serin kopmak üzere 💔' : 'Günün Hattı seni bekliyor 🚇', save.lost?.day === today() ? `${save.lost.n} günlük serini bugün hâlâ kurtarabilirsin` : sk ? `🔥 ${sk} günlük serin bugün sönmesin` : 'Bir dakikalık bulmaca · hattı bağla, şehri canlandır']);
      list.push([2, at(1), 'Yeni Günün Hattı açıldı 🚇', done && sk ? `🔥 Serin ${sk} gün · bugün bir gün daha ekle` : 'Bugünün bulmacası hazır · yolculuğa bir hat bağla']);
      list.push([3, at(3), 'Şehir seni özledi 🌃', `Bölüm ${save.level} seni bekliyor · ★ topla, yeni hat aç`]);
      list.push([4, at(7), 'Hatlar durdu 🚦', 'Bir dakikanı ayır, şehri yeniden canlandır']);
      await P.schedule({ notifications: list.map(([id, when, title, body]) => ({ id, title, body, schedule: { at: when, allowWhileIdle: true }, smallIcon: 'ic_stat_ray', iconColor: '#ffb35c', extra: { go: 'daily' } })) });
    } catch {}
  }
  // izin istenip verilirse açılır
  async function enable() {
    if (!await perm()) { save.remind = false; persist(); return false; }
    if (!save.dailyDone) habit();
    save.remind = true; persist(); plan(); return true;
  }
  LN()?.addListener?.('localNotificationActionPerformed', a => { if (a?.notification?.extra?.go === 'daily' && save.dailyDone !== today()) setTimeout(() => start('daily'), 400); });
  return { avail: () => !!LN(), plan, enable, habit };
})();
// ilk Günün Hattı'ndan (ya da birkaç bölümden) sonra ana sayfada bir kez, kibarca sorulur
function remindAsk() {
  save.remindAsked = true; persist();
  modal(`<div class="bell">🔔</div><h2>Hatırlatayım mı?</h2>
    <p>Her gün yeni bir <b>Günün Hattı</b> geliyor. Serin bozulmasın diye günde bir kez, kısa bir hatırlatma.</p>
    <button id="mYes" class="btn primary"><span>Evet, hatırlat</span><small>Ayarlardan kapatabilirsin</small></button>
    <button id="mClose" class="btn glassbtn">Şimdi değil</button>`, {
    mYes: async () => { closeModal(); toast(await Remind.enable() ? 'Tamam! Oynadığın saatte hatırlatacağım 🔔' : 'Bildirim izni verilmedi'); },
    mClose: closeModal });
}

// ---------- reklamsız paket ----------
function shopSheet() {
  const owned = save.noAds, price = Shop.price();
  modal(`<div class="bell">💛</div><h2>Reklamsız paket</h2>
    <div class="perks"><div><i>🚫</i><span>Bölüm aralarındaki reklamlar kalkar</span></div><div><i>💡</i><span><b>+20 ipucu</b> hediye</span></div><div><i>🎨</i><span>Özel <b>Altın</b> tema</span></div><div><i>🚇</i><span>Tek seferlik · ömür boyu</span></div></div>
    ${owned ? '<span class="badge">AKTİF ✓ · Teşekkürler!</span>' : `<button id="mBuy" class="btn primary"><span>${price ? `Satın al · ${price}` : 'Satın al'}</span><small>${Shop.ready() ? 'Google Play ile güvenli ödeme' : 'Mağazaya bağlanılıyor…'}</small></button>`}
    <p class="tip">İpucu videoları isteğe bağlı kalır.</p>
    ${owned ? '' : '<button id="mRestore" class="link">Satın alımı geri yükle</button>'}
    <button id="mClose" class="btn glassbtn">Kapat</button>`, {
    mBuy: async () => {
      if (!Shop.ready()) { toast(Shop.avail() ? 'Mağaza şu an kullanılamıyor · sonra dene' : 'Satın alma Play Store sürümünde açılır'); return; }
      const r = await Shop.buy();
      if (r === 'hata') toast('Satın alma tamamlanamadı');
    },
    mRestore: async () => { toast('Kontrol ediliyor…'); await Shop.restore(); setTimeout(() => { if (!save.noAds) toast('Bu hesapta satın alım bulunamadı'); }, 2500); },
    mClose: closeModal });
}
function grantNoAds() {
  if (save.noAds) return;
  save.noAds = true; save.hints += 20; persist();
  $('gHints').textContent = save.hints; refreshHome();
  haptic('win'); toast('Reklamsız paket aktif 💛 +20 ipucu · Altın tema açıldı');
  if (modalOpen() && $('mBuy')) shopSheet();
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
  for (const k of G.link[i] >= 0 ? [i, G.link[i]] : [i]) { G.cur[k] = G.sol[k]; G.fixed[k] = true; anim.set(k, now); press.set(k, now); }   // eşli karo: ikisi birden
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
// Yeni kural kartı: hattın ilk girişinde bir kez, kart açıkken süre durur
function ruleCard(c) {
  pause();
  modal(`<span class="badge">YENİ KURAL · ${lineName(c)}</span>
    ${RULES[c].demo}
    <h2>${RULES[c].name}</h2>
    <p>${RULES[c].text}</p>
    <button id="mGo" class="btn primary"><span>Anladım</span></button>`,
    { mGo: () => { save.seen[c] = 1; persist(); closeModal(); if (active('game')) resume(); } }, true);
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
// ---------- seriyi kurtar: dün kaçan Günün Hattı → bugün isteğe bağlı video (7+ gün seride 2 video) ----------
const rescueOk = () => save.lost?.day === today();
function rescueSheet() {
  const L = save.lost; if (!rescueOk()) return streakSheet();
  const need = L.n >= 7 ? 2 : 1, dots = need > 1 ? `<div class="vids">${Array.from({ length: need }, (_, k) => `<i class="${k < L.part ? 'on' : ''}"></i>`).join('')}</div>` : '';
  modal(`${FLAME.replace('class="flame"', 'class="flame cold"')}<h2>${L.n} günlük serin koptu</h2>
    <p>Dün Günün Hattı'nı kaçırdın. ${need === 1 ? 'Kısa bir video' : `${need} kısa video`} izle, serin <b>${L.n} günden</b> devam etsin.<br>Bu hak yalnızca <b>bugün</b> geçerli.</p>${dots}
    <button id="mSave" class="btn primary"><span>${L.part ? `Devam · ${L.part + 1}. video` : '▶ Seriyi kurtar'}</span><small>~${need * 15} sn${need > 1 ? ` · ${need} video` : ''}</small></button>
    <button id="mClose" class="btn glassbtn">Vazgeç</button>`, {
    mSave: async () => {
      if (Ads.busy()) return;
      if (!Ads.online()) { toast('İnternete bağlan · bugün içinde kurtarabilirsin'); return; }
      closeModal(); toast('Reklam yükleniyor…'); Music.stop();
      const ok = await Ads.rewarded(); Music.start();
      if (!ok || !rescueOk()) { toast('Ödül alınamadı · video sonuna kadar izlenmeli'); return; }
      if (++L.part < need) { persist(); rescueSheet(); return; }
      const t = today(), y = dayBefore(t), done = save.dailyDone === t;
      save.streak = L.n + (done ? 1 : 0); save.lastDaily = done ? t : y;
      save.dailyLog = [...save.dailyLog.filter(d => d !== y), y].sort().slice(-90);
      save.rescued = [...(save.rescued || []), y].slice(-30);
      save.best = Math.max(save.best || 0, save.streak); save.lost = null; persist();
      refreshHome(); bump($('streakChip')); haptic('win'); [0, 4, 7].forEach((k, j) => tone(note(k + 5), .35, .045, 'sine', j * .09));
      toast(`🔥 Serin kurtarıldı · ${save.streak} gün`);
    },
    mClose: closeModal });
}
// ana sayfada bir kez kendiliğinden sorulur (sonra 🔥 çipinden)
function maybeRescue() {
  if (!rescueOk() || save.lost.seen || !active('home') || modalOpen() || introOn) return;
  save.lost.seen = 1; persist(); rescueSheet();
}
function streakSheet() {
  dayTick();
  const log = new Set(save.dailyLog), names = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'], done = save.dailyDone === today();
  let week = '';
  for (let k = 6; k >= 0; k--) {
    const d = new Date(); d.setDate(d.getDate() - k); const on = log.has(ymd(d)), ice = on && save.rescued?.includes(ymd(d));
    week += `<div><i class="${on ? 'on' : ''} ${ice ? 'ice' : ''} ${k ? '' : 'today'}">${ice ? '❄' : on ? '✓' : ''}</i>${k ? names[(d.getDay() + 6) % 7] : 'Bugün'}</div>`;
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
    ${Remind.avail() ? `<div class="opt">Günlük hatırlatma <button id="oR" class="tog ${save.remind ? 'on' : ''}" aria-label="Günlük hatırlatma"></button></div>
` : ''}
    <div class="opt">Görünüm <div class="seg" id="oT">${seg}</div></div>
    <button class="opt row" id="oSkin"><span>Renk temaları</span><small>${skin().name} · 👑 ${crownCount()} ›</small></button>
    <button class="opt row" id="oShop"><span>Reklamsız paket</span><small>${save.noAds ? 'Aktif ✓' : (Shop.price() || '💛') + ' ›'}</small></button>
    <button id="mClose" class="btn glassbtn">Tamam</button>`, {
    oR: async () => {
      if (save.remind) { save.remind = false; persist(); Remind.plan(); }
      else if (!await Remind.enable()) toast('Bildirim izni verilmedi');
      $('oR').classList.toggle('on', save.remind);
    },
    oSkin: skinSheet, oShop: shopSheet,
    oM: () => { save.music = !save.music; persist(); $('oM').classList.toggle('on', save.music); save.music ? Music.start() : Music.stop(); },
    oS: () => { save.sound = !save.sound; persist(); $('oS').classList.toggle('on', save.sound); },
    oV: () => { save.vib = !save.vib; persist(); $('oV').classList.toggle('on', save.vib); haptic(); },
    mClose: closeModal });
  $('oT').onclick = e => { const t = e.target.dataset.t; if (!t) return; save.theme = t; persist(); applyTheme(); refreshHome(); $('oT').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.t === t)); };
}
// ---------- renk temaları ----------
function skinSheet() {
  const n = crownCount(), cur = skin().id;
  if (save.newSkin) { save.newSkin = 0; persist(); refreshHome(); }
  const card = k => {
    const open = skinOpen(k), c = skinCols(k);
    return `<button class="skin ${open ? '' : 'lockd'} ${k.id === cur ? 'on' : ''}" data-k="${k.id}" style="--s1:${c[0]};--s2:${c[1]};--s3:${c[2]}">
      <svg viewBox="0 0 120 60"><path d="M10 46H40L60 28H110"/><path d="M60 6V28L80 46H110"/><path d="M10 14H36L60 28"/><rect x="52" y="20" width="16" height="16" rx="5"/></svg>
      <b>${k.name}</b><small>${k.id === cur ? 'Seçili ✓' : open ? 'Seç' : `🔒 ${k.need} 👑${k.vip ? ' · ya da 💛' : ''}`}</small></button>`;
  };
  const nx = SKINS.find(k => !skinOpen(k)), prev = nx ? [...SKINS].reverse().find(k => k.need < nx.need)?.need || 0 : 0;
  modal(`<h2>Renk temaları</h2><p>Bölümleri <b>kusursuz</b> bitir (⏱ ve ↻ hedefi), 👑 topla, yeni renkler aç. Sende <b>${n} 👑</b></p>
    <div class="skins" id="skins">${SKINS.map(card).join('')}</div>
    ${nx ? `<div class="nexts"><small>Sonraki: <b>${nx.name}</b></small><small>👑 ${n} / ${nx.need}</small></div><div class="pb"><i style="width:${Math.max(4, Math.min(100, (n - prev) / (nx.need - prev) * 100))}%"></i></div>
    <button id="mHunt" class="btn primary"><span>Taç topla 👑</span><small>${huntList().length} bölüm kusursuz bitmeyi bekliyor</small></button>` : ''}
    <button id="mClose" class="btn glassbtn">Tamam</button>`, { mClose: closeModal, mHunt: () => crownHunt(nx) });
  $('skins').onclick = e => {
    const b = e.target.closest('.skin'); if (!b) return;
    const k = SKINS.find(x => x.id === b.dataset.k);
    if (!skinOpen(k)) { haptic('light'); crownHunt(k); return; }
    if (k.id === cur) return;
    save.skin = k.id; persist(); applyTheme(); refreshHome(); haptic('heavy'); tone(note(7), .25, .045); tone(note(9), .3, .035, 'sine', .07);
    skinSheet();
  };
}
// Taç avı: kusursuz bitmemiş bölümler, yıldızlarıyla. En çok yıldızlı (kusursuza en yakın) önce; dokun → oyna.
const missTxt = l => { const [t, m] = save.miss[l] || [0, 0]; return [t ? `⏱ ${t} sn geç` : '', m ? `↻ ${m} hamle fazla` : ''].filter(Boolean).join(' · '); };
const huntList = () => { const L = []; for (let l = 1; l < save.level; l++) if (!save.crowns[l] && unlocked(lineOf(l))) L.push(l); return L.sort((a, b) => (save.stars[b] || 0) - (save.stars[a] || 0) || a - b); };
function crownHunt(k) {
  const n = crownCount(), L = huntList();
  modal(`<h2>Taç topla 👑</h2>
    <p>${k ? `<b>${k.name}</b> için <b>${k.need - n} 👑</b> daha gerekli${k.vip ? ' (ya da Reklamsız paket)' : ''}. ` : ''}Aşağıdaki bölümleri <b>⏱ süre</b> ve <b>↻ hamle</b> hedefiyle bitir: her biri 1 👑.</p>
    ${L.length ? `<div class="hunt" id="hunt">${L.map(l => `<button class="hrow" data-l="${l}"><b>${l}</b><span>${starTxt(save.stars[l] || 0)}</span><small>${missTxt(l)}</small></button>`).join('')}</div>
    <p class="tip">★★☆ olanlar kusursuza en yakın · Günün Hattı'nı kusursuz bitirmek de 1 👑</p>`
    : `<p class="tip">Oynadığın her bölüm kusursuz! 🎉 Yeni bölümler ve Günün Hattı yeni 👑 getirir.</p><button id="mPlay" class="btn primary"><span>Oyna</span><small>Bölüm ${save.level}</small></button>`}
    <button id="mBack" class="btn glassbtn">Temalara dön</button>`, { mBack: skinSheet, mPlay: () => start('level') });
  if ($('hunt')) $('hunt').onclick = e => { const b = e.target.closest('.hrow'); if (b) start('level', +b.dataset.l); };
}
// ---------- nasıl oynanır: sayfalı, kendi kendine oynayan demo (video yerine: keskin, birkaç KB, internetsiz) ----------
// [sahne başlangıcı (sn), yazı]. Her sayfa kendi sahnesini oynar (+0,5 sn okuma payı), sonra kendiliğinden geçer; parmakla kaydırılır.
const DEMO_STEPS = [
  [0, 'Karoya dokun → <b>döner</b>'],
  [2.6, 'Ortadaki istasyondan çıkan <b>hattı uzat</b>'],
  [4.4, 'Bütün <b>durakları yak</b>'],
  [7.2, 'Hepsi bağlandı → <b>kazandın!</b> 🎉'],
  [9.4, '<b>Hızlı</b> bitir + <b>az</b> dokun = ★★★'],
  [12, 'Bölümler gittikçe <b>büyür ve zorlaşır</b>'],
  [15, 'Her gün yeni <b>Günün Hattı</b> 🔥'],
];
const DEMO_END = 18, DEMO_PAD = .5;
function demo(cv2, onPage) {
  const c2 = cv2.getContext('2d'), D = 240, dpr = Math.min(devicePixelRatio || 1, 2), last = DEMO_STEPS.length - 1;
  cv2.width = cv2.height = D * dpr;
  // 3×3 örnek: merkez 4; 3, 1, 5, 7 birer dokunuşta yerine oturur
  const SOL = [6, 8, 4, 3, 14, 9, 2, 11, 8], WRONG = [3, 1, 5, 7], TAPS = [[1.2, 3], [3.2, 1], [5, 5], [6.4, 7]];
  const unrot = m => ((m >> 1) | (m << 3)) & 15;
  const big = [generate(4, 4, 77), generate(5, 5, 78), generate(5, 5, 79)];
  const col = lineCols()[0];
  const span = k => [DEMO_STEPS[k][0], (DEMO_STEPS[k + 1] || [DEMO_END])[0]];
  let pg = 0, pt0 = performance.now();
  const bars = [...document.querySelectorAll('#demoDots b')];
  function go(k, dir = 1) {
    k = Math.max(0, Math.min(last, k)); if (k === pg && dir) return;
    pg = k; pt0 = performance.now();
    const el = $('demoTxt');
    if (el) { el.classList.add('fade'); setTimeout(() => { el.innerHTML = DEMO_STEPS[k][1]; el.classList.remove('fade'); }, 160); }
    bars.forEach((b, j) => { b.style.width = j < k ? '100%' : '0'; });
    cv2.classList.remove('inL', 'inR'); void cv2.offsetWidth; if (dir) cv2.classList.add(dir > 0 ? 'inL' : 'inR');
    onPage(k);
  }
  function grid(cols, cur, opt = {}) {
    const n = cur.length, rows = n / cols, s = Math.min(D / cols, D / rows) * (opt.scale ?? 1), ox = (D - s * cols) / 2, oy = (D - s * rows) / 2;
    const L = opt.lit ? { d: cur.map(() => 0) } : lit({ cols, rows, cur, hub: (rows >> 1) * cols + (cols >> 1) });
    c2.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const x = ox + (i % cols) * s + s / 2, y = oy + (i / cols | 0) * s + s / 2, on = L.d[i] >= 0, hub = i === (rows >> 1) * cols + (cols >> 1);
      let sc = 1; if (opt.wave != null) { const k = opt.wave - L.d[i] * .06; if (k > 0 && k < .35) sc = 1 + Math.sin(k / .35 * Math.PI) * .12; }
      c2.save(); c2.translate(x, y); c2.scale(sc, sc);
      c2.beginPath(); c2.roundRect ? c2.roundRect(-s / 2 + 2, -s / 2 + 2, s - 4, s - 4, s * .22) : c2.rect(-s / 2 + 2, -s / 2 + 2, s - 4, s - 4);
      c2.fillStyle = pal.tile; c2.fill(); if (on) { c2.fillStyle = rgba(col, .08); c2.fill(); }
      c2.rotate(opt.rot?.[i] || 0);
      const m = cur[i];
      for (const [w, st] of on ? [[s * .36, rgba(col, .22)], [s * .16, col]] : [[s * .16, pal.rail]]) {
        c2.lineWidth = w; c2.strokeStyle = st; c2.beginPath();
        for (const [b, dx, dy] of DV) if (m & b) { c2.moveTo(0, 0); c2.lineTo(dx * s / 2, dy * s / 2); }
        c2.stroke();
      }
      if (hub) { c2.fillStyle = col; c2.fillRect(-s * .2, -s * .2, s * .4, s * .4); c2.fillStyle = '#fff'; c2.beginPath(); c2.arc(0, 0, s * .07, 0, 7); c2.fill(); }
      else if (popc(m) === 1) { c2.fillStyle = on ? '#fff' : pal.bg; c2.strokeStyle = on ? col : pal.mut; c2.lineWidth = s * .06; c2.beginPath(); c2.arc(0, 0, s * .14, 0, 7); c2.fill(); c2.stroke(); }
      c2.restore();
    }
    return { s, ox, oy };
  }
  function finger(x, y, tap) {
    if (tap > 0 && tap < .5) { c2.strokeStyle = `rgba(255,255,255,${.8 * (1 - tap / .5)})`; c2.lineWidth = 3; c2.beginPath(); c2.arc(x, y, 14 + tap * 50, 0, 7); c2.stroke(); }
    c2.fillStyle = 'rgba(255,255,255,.88)'; c2.shadowColor = 'rgba(0,0,0,.35)'; c2.shadowBlur = 10;
    c2.beginPath(); c2.arc(x + 4, y + 6, tap > 0 && tap < .15 ? 11 : 14, 0, 7); c2.fill(); c2.shadowBlur = 0;
  }
  function frame(now) {
    if (!cv2.isConnected || !modalOpen()) return;   // pencere kapanınca demo durur (pil)
    const [st, en] = span(pg), len = en - st, dur = len + DEMO_PAD, tau = (now - pt0) / 1000;
    if (tau >= dur) { if (pg < last) go(pg + 1); else pt0 = now; }   // son sayfa kendi içinde döner
    const t = st + Math.min(tau, dur) * len / dur;
    if (bars[pg]) bars[pg].style.width = Math.min(100, tau / dur * 100) + '%';
    c2.setTransform(dpr, 0, 0, dpr, 0, 0); c2.clearRect(0, 0, D, D);
    if (t < 9.4) {
      const cur = SOL.slice(), rot = {}; WRONG.forEach(i => { cur[i] = unrot(SOL[i]); });
      for (const [tt, i] of TAPS) if (t >= tt) { cur[i] = SOL[i]; const q = (t - tt) / .19; if (q < 1) rot[i] = -(1 - back(q)) * Math.PI / 2; }
      const g = grid(3, cur, { rot, wave: t > 7.3 ? (t - 7.3) % 1.1 : null });   // kazanma dalgası kendi sayfasında
      // parmak: bir sonraki dokunuşa kayar
      const nxt = TAPS.findIndex(([tt]) => t < tt + .5);
      if (nxt >= 0) {
        const [tt, i] = TAPS[nxt], [, pi] = TAPS[Math.max(0, nxt - 1)], P = j => [g.ox + (j % 3) * g.s + g.s / 2, g.oy + (j / 3 | 0) * g.s + g.s / 2];
        const a = P(nxt ? pi : 4), b = P(i), f = Math.min(1, Math.max(0, (t - (tt - .7)) / .6)), e = ease(f);
        finger(a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, t - tt);
      }
    } else if (t < 12) {
      c2.globalAlpha = .35; grid(3, SOL, { lit: true }); c2.globalAlpha = 1;
      [0, 1, 2].forEach(j => {
        const q = Math.min(1, Math.max(0, (t - 9.7 - j * .35) / .3)), sz = (j === 1 ? 46 : 38) * back(q);
        if (q <= 0) return;
        c2.save(); c2.translate(D / 2 + (j - 1) * 62, D / 2 - (j === 1 ? 8 : 0)); c2.scale(sz / 24, sz / 24); c2.translate(-12, -12);
        c2.fillStyle = col; c2.shadowColor = col; c2.shadowBlur = 12; c2.fill(new Path2D('m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z')); c2.restore();
      });
      c2.fillStyle = pal.fg; c2.font = '600 13px Outfit, system-ui'; c2.textAlign = 'center';
      c2.fillText('bitir  ·  ⏱ süre  ·  ↻ hamle', D / 2, D / 2 + 52);
    } else if (t < 15) {
      const k2 = t < 13.5 ? 0 : 1, P = big[k2], q = Math.min(1, (t - (k2 ? 13.5 : 12)) / .35);
      grid(P.cols, P.cur, { scale: (.6 + .4 * back(q)) * .84 });
      c2.fillStyle = pal.fg; c2.font = '700 14px Outfit, system-ui'; c2.textAlign = 'center';
      c2.fillText(`${P.cols}×${P.rows}`, D / 2, 14);
    } else grid(5, big[2].sol, { lit: true, wave: (t - 15) % 1.2, scale: .9 });
    requestAnimationFrame(frame);
  }
  // kaydırma: sola → sonraki, sağa → önceki. Sürüklerken tuval parmağı izler.
  const box = cv2.parentElement;
  let x0 = null, dx = 0;
  box.addEventListener('pointerdown', e => { x0 = e.clientX; dx = 0; box.setPointerCapture?.(e.pointerId); cv2.style.transition = 'none'; });
  box.addEventListener('pointermove', e => { if (x0 == null) return; dx = e.clientX - x0; cv2.style.transform = `translateX(${dx * .45}px) rotate(${dx * .012}deg)`; });
  const up = () => {
    if (x0 == null) return; x0 = null; cv2.style.transition = ''; cv2.style.transform = '';
    if (dx < -36 && pg < last) { go(pg + 1, 1); haptic(); }
    else if (dx > 36 && pg > 0) { go(pg - 1, -1); haptic(); }
  };
  box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
  requestAnimationFrame(frame);
  return { next: () => go(pg + 1, 1), prev: () => go(pg - 1, -1), get page() { return pg; } };
}
// Anlatıcı: son sayfaya gelmeden kapanmaz (dışarı dokunma ve geri tuşu da kapatmaz).
function how() {
  const last = DEMO_STEPS.length - 1, endTxt = save.played ? 'Tamam' : 'Hadi oynayalım!';
  let done = false;
  modal(`<h2>Nasıl oynanır?</h2>
    <div class="pgs" id="demoDots">${'<i><b></b></i>'.repeat(DEMO_STEPS.length)}</div>
    <div class="demobox"><canvas id="demoCv" class="demo" aria-label="Oynanış demosu"></canvas></div>
    <p id="demoTxt" class="demotxt">${DEMO_STEPS[0][1]}</p>
    <small class="swipe" id="demoSwipe">‹ kaydır ›</small>
    <button id="mClose" class="btn primary"><span>İleri ›</span><small>1 / ${DEMO_STEPS.length}</small></button>`, {}, true);
  const btn = $('mClose'), close = closeModal;
  mOnClose = () => { if (save.played === 0 && !G) start('level'); };
  const D = demo($('demoCv'), k => {
    if (k === last && !done) { done = true; mLocked = false; $('demoSwipe').style.visibility = 'hidden'; }
    btn.classList.toggle('fin', done && k === last);
    btn.innerHTML = k === last ? `<span>${endTxt}</span>` : `<span>İleri ›</span><small>${k + 1} / ${DEMO_STEPS.length}</small>`;
  });
  btn.onclick = () => D.page === last ? close() : D.next();
  howBack = () => { if (done) close(); else if (D.page > 0) D.prev(); };
}

$('bPlay').onclick = () => start('level');
$('bDaily').onclick = () => (save.dailyDone === today() && save.dailyStats?.day === today()) ? dailyResult() : start('daily');
$('bMap').onclick = () => show('map');
$('pBack').onclick = () => show('home');
$('bBack').onclick = () => show('home');
$('bReset').onclick = reset;
$('bHint').onclick = hint;
$('bSettings').onclick = settings;
$('streakChip').onclick = () => rescueOk() ? rescueSheet() : streakSheet();
$('starsChip').onclick = () => show('map');
$('crownChip').onclick = skinSheet;
$('bHow').onclick = how;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { pause(); ac?.suspend?.(); Remind.plan(); }
  else { ac?.resume?.(); dayTick(); if (active('game')) resume(); if (active('home')) { refreshHome(); setTimeout(maybeRescue, 600); } }
});
// Android geri tuşu: pencere → kapat, oyun/harita → ana sayfa, ana sayfa → arka plana al
const App = window.Capacitor?.Plugins?.App;
App?.addListener?.('backButton', () => {
  if (modalOpen() && howBack) howBack();
  else if (modalOpen()) { if (mLocked) show('home'); closeModal(); }
  else if (G?.won && active('game')) show('home');
  else if (!active('home')) show('home');
  else App.minimizeApp?.();
});

applyTheme();
show('home');
Ads.init();
Shop.init(grantNoAds);
Remind.plan();
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
else setTimeout(maybeRescue, introOn ? 2700 : 700);
// test kancası
window.__ray = { generate, lit, rot, limits, sizeFor, music: () => Music.state(), get G() { return G; }, get geo() { return geo; } };
})();
