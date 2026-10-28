// Ray — metro hattı bağlama bulmacası. Tek dokunuş: karoyu çevir.
(() => {
'use strict';
const $ = id => document.getElementById(id);
const N = 1, E = 2, S = 4, W = 8;
const DIRS = [[N, 0, -1, S], [E, 1, 0, W], [S, 0, 1, N], [W, -1, 0, E]];
const rot = m => ((m << 1) | (m >> 3)) & 15;          // saat yönü 90°
const unrot = m => ((m >> 1) | (m << 3)) & 15;        // saat yönünün tersi 90° (ters karo)
// hat adları: renk değil yer adı (her renk temasında doğru okunur). 25 ad; sonra "Yeni Liman", "Kuzey Liman"… → hiçbir hat adı tekrar etmez
const LINE_NAMES = ['Liman', 'Çarşı', 'Sahil', 'Kule', 'Bahçe', 'Köprü', 'Fener', 'Vadi', 'Pınar', 'Meydan', 'Tepe', 'Ada', 'Saray', 'Rıhtım', 'Kanal', 'Çınar', 'Yayla', 'Koru', 'Kervan', 'Değirmen', 'Göl', 'Bağ', 'Pazar', 'Kale', 'Gar'];
const NAME_PRE = ['', 'Yeni', 'Eski', 'Kuzey', 'Güney', 'Doğu', 'Batı', 'Yukarı', 'Aşağı', 'Büyük', 'Küçük'];
const LINE0 = 12, LINE_STEP = 4;                        // hat uzunluğu doğrusal artar: M1 12 bölüm, her hat +4 (16, 20, 24…)
const STAR_AVG = 2.2;                                   // yeni hat: önceki bölümlerde ortalama 2,2★
const INTER_EVERY = 4;                                  // her 4 galibiyette 1 geçiş reklamı
const DAILY_FREE_HINTS = 3;
const TEST = !!window.__rayTest;                        // yalnız "her şey açık" test APK'sı (apk.yml → unlocked): bütün hatlar ve bölümler açık
const AD_TIERS = [1, 2, 2, 3];                          // aynı bölümde ipucu için izlenecek video: ~15 sn, ~30, ~30, ~45…
const SHARE_URL = 'https://osmanadali.github.io/mobil-oyun/';
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28];

// ---------- tarih (yerel takvim günü) ----------
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = () => ymd(new Date());
const dayBefore = s => { const [y, m, d] = s.split('-').map(Number); return ymd(new Date(y, m - 1, d - 1)); };

// ---------- kayıt ----------
const def = { level: 1, stars: {}, hints: DAILY_FREE_HINTS, hintDay: '', streak: 0, lastDaily: '', dailyDone: '', dailyStats: null, runs: {}, crowns: {}, miss: {}, shards: 0, seen: {}, sound: true, music: true, vib: true, theme: 'auto', played: 0, skin: 'metro', spent: 0, dCrowns: 0, newSkin: 0, remind: false, remindAt: 1110, remindAsked: false, noAds: false };
let save;
try { save = Object.assign({}, def, JSON.parse(localStorage.getItem('ray') || '{}')); } catch { save = { ...def }; }
if (!save.runs || typeof save.runs !== 'object') save.runs = {};
if (!save.seen || typeof save.seen !== 'object') save.seen = {};
if (!save.miss || typeof save.miss !== 'object') save.miss = {};
if (!save.owned || typeof save.owned !== 'object') save.owned = { metro: 1, ...(save.skin && save.skin !== 'metro' ? { [save.skin]: 1 } : {}) };   // eski kayıtta seçili tema korunur
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
const lineLen = c => LINE0 + LINE_STEP * c;
const lineStart = c => 1 + LINE0 * c + LINE_STEP * c * (c - 1) / 2;   // M1 1 · M2 13 · M3 29 · M4 49 · M5 73 · M6 101 · M10 sonu 300
const lineOf = l => { let c = 0; while (lineStart(c + 1) <= l) c++; return c; };
const lineEnd = c => lineStart(c + 1) - 1;
// zorluk: z(l) = 1 − e^(−l/170). Hiç düşmez; sonsuzda %100 = imkânsız. Ekranda "Zorluk %".
const zOf = l => 1 - Math.exp(-l / 170);
const zPct = l => Math.min(99, Math.round(zOf(l) * 100));
// Günün Hattı: haftalık dalga. Pazartesi en kolay, Pazar en zor (%85–100). Dip ve tepe bir yılda yükselir (oyuncu alışır),
// her hafta ±%8 farklı, hiçbir gün %40'ın altına düşmez. Herkeste aynı bulmaca.
const DAILY_EPOCH = new Date(2026, 9, 1);   // Perşembe
function dailyZ(day) {
  const [y, m, d] = day.split('-').map(Number), dt = new Date(y, m - 1, d);
  const n = Math.max(0, Math.round((dt - DAILY_EPOCH) / 864e5)), w = (dt.getDay() + 6) % 7, wk = Math.floor((n + 3) / 7);
  const tr = Math.min(1, n / 365), lo = .45 + .15 * tr, hi = .85 + .12 * tr;
  const wob = ((hashStr('hafta' + wk) % 1000) / 1000 - .5) * .16;
  return Math.max(.4, Math.min(1, lo + (hi - lo) * Math.pow(w / 6, 1.2) + wob));
}
const dPct = day => Math.round(dailyZ(day) * 100);
function lineTitle(c) {
  const n = LINE_NAMES.length, k = Math.floor(c / n), pre = NAME_PRE[k % NAME_PRE.length], tur = Math.floor(k / NAME_PRE.length);
  return `${pre ? pre + ' ' : ''}${LINE_NAMES[c % n]}${tur ? ' ' + (tur + 1) : ''}`;
}
const lineName = c => `M${c + 1} · ${lineTitle(c)} Hattı`;
const need = c => Math.round((lineStart(c) - 1) * STAR_AVG);
const totalStars = () => Object.values(save.stars).reduce((a, b) => a + b, 0);
const unlocked = c => TEST || totalStars() >= need(c);

// ---------- tema / palet ----------
let pal = {};
const isLight = () => save.theme === 'light' || (save.theme === 'auto' && matchMedia('(prefers-color-scheme: light)').matches);
// ---------- hat temaları: kusursuz bitirilen bölümlerin taçlarıyla (👑) açılır ----------
// Taç (👑) bir para birimidir: tema satın alınınca harcanır. Her tema bir renk ailesidir: 6 temel ton, sonraki hatlarda tonu
// ve parlaklığı kayan çeşitlemeleri (famCol) → 6 hatta bir birebir tekrar yok. 22 taç teması + 3 reklamsız paket teması = 25.
const SKINS = [
  { id: 'metro', name: 'Metro', need: 0 },
  { id: 'sunset', name: 'Gün Batımı', need: 5, lines: ['#ff9e7a', '#ffb36b', '#ff7f6b', '#ffc48a', '#ff8fa3', '#ffa94d'], acc: ['#ffb36b', '#ff7f6b'], glow: ['#ff9e5a', '#ff6f91', '#ffb86b'] },
  { id: 'ocean', name: 'Okyanus', need: 25, lines: ['#5ce1e6', '#4fa3ff', '#7dd3fc', '#38bdf8', '#67e8f9', '#2dd4bf'], acc: ['#5ce1e6', '#4fa3ff'], glow: ['#3fb6d9', '#3a5bff', '#2dd4bf'] },
  { id: 'forest', name: 'Orman', need: 40, lines: ['#7bd88f', '#a3e635', '#4ade80', '#86efac', '#5fd3a1', '#bef264'], acc: ['#7bd88f', '#3fb68b'], glow: ['#4fb477', '#2f7d5b', '#a3e635'] },
  { id: 'desert', name: 'Çöl', need: 55, lines: ['#f2c38b', '#e8935f', '#e0b26f', '#d98a66', '#f5d6a8', '#cf9a63'], acc: ['#f2c38b', '#e8935f'], glow: ['#e8935f', '#a8653f', '#f2c38b'] },
  { id: 'sakura', name: 'Sakura', need: 70, lines: ['#ffb7c5', '#ff8fab', '#f9a8d4', '#ffc2d9', '#f48fb1', '#e7a6ff'], acc: ['#ffb7c5', '#f48fb1'], glow: ['#ff9fb8', '#e48bff', '#ffc2d9'] },
  { id: 'neon', name: 'Neon Gece', need: 90, lines: ['#ff3ddc', '#22e6ff', '#b84dff', '#ff5ea8', '#5b8cff', '#d65cff'], acc: ['#ff3ddc', '#22e6ff'], glow: ['#ff3ddc', '#22e6ff', '#7a2bff'] },
  { id: 'aurora', name: 'Kuzey Işıkları', need: 110, lines: ['#6ef3c5', '#5ee0ff', '#a6ffcb', '#7aa2ff', '#9d8cff', '#63e6be'], acc: ['#6ef3c5', '#7aa2ff'], glow: ['#2ee6a6', '#6b5bff', '#5ee0ff'] },
  { id: 'lava', name: 'Lav', need: 135, lines: ['#ff5a36', '#ff9f1c', '#ff7b54', '#ffb347', '#e63946', '#ff6b6b'], acc: ['#ff7b3a', '#e63946'], glow: ['#ff3d00', '#b5179e', '#ff9f1c'] },
  { id: 'cosmos', name: 'Kozmos', need: 160, lines: ['#9d8cff', '#b5a8ff', '#c084fc', '#818cf8', '#a78bfa', '#e0aaff'], acc: ['#9d8cff', '#c084fc'], glow: ['#5b3df5', '#0ea5e9', '#d946ef'] },
  { id: 'glacier', name: 'Buzul', need: 190, lines: ['#a8e6ff', '#7cc8ff', '#c4f1ff', '#8fb8ff', '#b0d8ff', '#9ee7f0'], acc: ['#a8e6ff', '#7cc8ff'], glow: ['#5fb8ff', '#a8e6ff', '#3a7bd5'] },
  { id: 'spring', name: 'Bahar', need: 220, lines: ['#9be15d', '#ffb3c7', '#7ee0b5', '#ffd36e', '#c7f08a', '#f7a8d8'], acc: ['#9be15d', '#ffb3c7'], glow: ['#6ccf5f', '#ff9ec1', '#ffd36e'] },
  { id: 'autumn', name: 'Sonbahar', need: 250, lines: ['#e8a33d', '#d9824a', '#f0c060', '#c9a24a', '#e6b980', '#d6945a'], acc: ['#e8a33d', '#d9824a'], glow: ['#d9822b', '#8c3b1f', '#f0c060'] },
  { id: 'reef', name: 'Mercan Resifi', need: 280, lines: ['#ff9a8b', '#4fd1c5', '#ffc074', '#5ab8ff', '#ff9ec7', '#7be0a5'], acc: ['#ff9a8b', '#4fd1c5'], glow: ['#ff7e6b', '#22b8cf', '#ffc074'] },
  { id: 'tea', name: 'Çay Bahçesi', need: 310, lines: ['#7fbf7f', '#a7d49b', '#5fae8a', '#c9e4a7', '#8fc9a3', '#b5d98c'], acc: ['#7fbf7f', '#5fae8a'], glow: ['#3f8f5f', '#7fbf7f', '#c9e4a7'] },
  { id: 'tulip', name: 'Lale', need: 340, lines: ['#e86fb0', '#b77cff', '#ff96d0', '#9b7bff', '#f2a0e6', '#c58bff'], acc: ['#e86fb0', '#b77cff'], glow: ['#c2185b', '#7b4bff', '#ff86c8'] },
  { id: 'storm', name: 'Fırtına', need: 370, lines: ['#a9bccf', '#7f9ec0', '#c8d4e0', '#8fb2d2', '#b3c0dc', '#98adc2'], acc: ['#a9bccf', '#7f9ec0'], glow: ['#4a6380', '#8aa1b8', '#2c3e57'] },
  { id: 'midnight', name: 'Gece Yarısı', need: 400, lines: ['#7d8bff', '#9a8cff', '#6aa8ff', '#b09aff', '#8c9dff', '#8080ff'], acc: ['#9a8cff', '#7d8bff'], glow: ['#2b2f8f', '#5b3df5', '#1e3a8a'] },
  { id: 'rainbow', name: 'Gökkuşağı', need: 440, lines: ['#ff9a5c', '#ffd166', '#7bd88f', '#5cc8ff', '#9d8cff', '#ff8fd6'], acc: ['#ffd166', '#5cc8ff'], glow: ['#ff8a5c', '#5cc8ff', '#9d8cff'] },
  { id: 'synth', name: 'Retro Dalga', need: 480, lines: ['#ff71ce', '#01cdfe', '#05ffa1', '#b967ff', '#fffb96', '#ff9cf0'], acc: ['#ff71ce', '#01cdfe'], glow: ['#b967ff', '#ff71ce', '#01cdfe'] },
  { id: 'pastel', name: 'Pastel', need: 520, lines: ['#ffc8d6', '#b9e3b9', '#b6dafe', '#fff0a8', '#ddbcff', '#ffd2b0'], acc: ['#b6dafe', '#ffc8d6'], glow: ['#cdb4db', '#a2d2ff', '#ffc8dd'] },
  { id: 'dawn', name: 'Şafak', need: 560, lines: ['#ffb38a', '#ffd6a5', '#f9a8c4', '#f5c2f2', '#ffe5b4', '#f7a87a'], acc: ['#ffb38a', '#f9a8c4'], glow: ['#ff9a76', '#c38bff', '#ffd6a5'] },
  // 💛 yalnızca Reklamsız paketle (taçla alınmaz)
  { id: 'gold', name: 'Altın', vip: true, lines: ['#ffd36b', '#f5b942', '#ffe7a3', '#e9a93a', '#fff1b8', '#d9a520'], acc: ['#ffd36b', '#e9a23a'], glow: ['#ffcf6b', '#b8862b', '#ffe8a3'] },
  { id: 'diamond', name: 'Elmas', vip: true, lines: ['#d6f1ff', '#bae6fd', '#c7d2fe', '#e9e4ff', '#a5f3fc', '#ddd6fe'], acc: ['#bae6fd', '#c7d2fe'], glow: ['#7dd3fc', '#a78bfa', '#e0f2fe'] },
  { id: 'ruby', name: 'Yakut', vip: true, lines: ['#ff4d6d', '#ff758f', '#e0245e', '#ff8fab', '#f43f5e', '#ff5c8a'], acc: ['#ff4d6d', '#e0245e'], glow: ['#c9184a', '#ff4d6d', '#7b2cbf'] },
];
const crownCount = () => Object.keys(save.crowns).length + (save.dCrowns || 0) + (save.fc || 0) + (save.cc || 0);   // toplam kazanılan (bölüm + günlük + final + seri bonusu)
const crownBal = () => crownCount() - (save.spent || 0);                             // harcanabilir bakiye
const skinOpen = k => !!save.owned[k.id] || !!(k.vip && save.noAds);
const skin = () => { const k = SKINS.find(x => x.id === save.skin); return k && skinOpen(k) ? k : SKINS[0]; };
const shade = (hex, f) => '#' + [16, 8, 0].map(b => Math.round((parseInt(hex.slice(1), 16) >> b & 255) * f).toString(16).padStart(2, '0')).join('');
// ---------- hat renkleri: OKLCH (algısal) uzayda üretilir → bütün hatlar eşit parlaklıkta, koyu/açık zeminde okunur ----------
function oklch(L, C, h) {
  for (; C > 0; C -= .01) {   // renk sRGB'ye sığana dek doygunluk azalır
    const a = C * Math.cos(h * Math.PI / 180), b = C * Math.sin(h * Math.PI / 180);
    const l = (L + .3963377774 * a + .2158037573 * b) ** 3, m = (L - .1055613458 * a - .0638541728 * b) ** 3, s = (L - .0894841775 * a - 1.291485548 * b) ** 3;
    const v = [4.0767416621 * l - 3.3077115913 * m + .2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s, -.0041960863 * l - .7034186147 * m + 1.707614701 * s];
    if (v.every(x => x >= -.001 && x <= 1.001)) return '#' + v.map(x => Math.round(Math.min(1, Math.max(0, x <= .0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - .055)) * 255).toString(16).padStart(2, '0')).join('');
  }
  return oklch(L, 0, h);
}
function okl(hex) {   // hex → [L, C, ton°]
  const n = parseInt(hex.slice(1), 16), f = x => (x /= 255) <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4, r = f(n >> 16), g = f(n >> 8 & 255), b = f(n & 255);
  const l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b), m = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b), s = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b);
  const A = 1.9779984951 * l - 2.428592205 * m + .4505937099 * s, B = .0259040371 * l + .7827717662 * m - .808675766 * s;
  return [.2104542553 * l + .793617785 * m - .0040720468 * s, Math.hypot(A, B), (Math.atan2(B, A) * 180 / Math.PI + 360) % 360];
}
const PHI = .6180339887, WARN_H = 14.5;   // uyarı kırmızısının (#ff7a8a) OKLCH tonu
const hueGap = (a, b) => Math.abs(((a - b) % 360 + 540) % 360 - 180);
// Metro: altın oran adımlı ton dizisi (komşu hatlar ≥115° ayrı), uyarı kırmızısının ±30°'si atlanır; M1 turuncu. Sonsuza dek birebir tekrar yok.
const metroCol = (c, light) => oklch(light ? .6 : .8 - (c % 2) * .04, light ? .15 : .135, WARN_H + 30 + ((.0767 + c * PHI) % 1) * 300);
// renk ailesi: ilk 6 hat temel tonlar; sonraki turlar ton ve parlaklık kayar (parlaklık farkı ≥ .06 → soluk tonlar da ayrışır)
const FAM = [[0, 0], [22, -.08], [-22, .07], [12, .1], [-12, -.07], [32, .06], [-32, -.06]];
const dE = (x, y) => { const [L1, C1, h1] = okl(x), [L2, C2, h2] = okl(y), r = Math.PI / 180; return Math.hypot(L1 - L2, C1 * Math.cos(h1 * r) - C2 * Math.cos(h2 * r), C1 * Math.sin(h1 * r) - C2 * Math.sin(h2 * r)); };
const toLight = v => { const [L, C, h] = okl(v); return oklch(L * .8, C, h); };   // açık zeminde aynı ton, koyulaşmış
// Her hat için birkaç aday denenir; komşu hattan (≥ .035) ve 6 hat öncekinden (≥ .05) ayrışan ilk aday seçilir. Tema başına önbellek.
const famCache = new Map();
function famCol(k, c, light) {
  const key = k.id + (light ? 'L' : ''); let A = famCache.get(key); if (!A) famCache.set(key, A = []);
  for (let i = A.length; i <= c; i++) A.push(famPick(k.lines, i, A, light));
  return A[c];
}
function famPick(lines, c, A, light) {
  const n = lines.length, k = Math.floor(c / n), base = lines[c % n], out = v => light ? toLight(v) : v;
  if (!k) return out(base);
  const [L, C, h] = okl(base), [dh, dl] = FAM[k] || [((k * PHI) % 1 - .5) * 64, ((k * .382) % 1 < .5 ? -1 : 1) * .07];
  let best = out(base), bs = -1;
  for (const [mh, ml] of [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 2], [-1, -2]]) {
    const v = out(oklch(Math.min(.95, Math.max(.58, L + dl * ml)), C, h + dh * mh)), sc = A.includes(v) ? 0 : Math.min(dE(v, A[c - 1]), dE(v, A[c - n]) * .7);
    if (sc >= .035) return v;
    if (sc > bs) { bs = sc; best = v; }
  }
  return best;
}
const lineCol = (c, k = skin()) => k.lines ? famCol(k, c, isLight()) : metroCol(c, isLight());
const skinCols = k => [0, 1, 2].map(c => lineCol(c, k));
// oyun içi uyarı rengi: hat rengi kırmızıya yakınsa (Lav, Yakut…) uyarı kehribar olur → iki hat değince yine seçilir
const warnFor = col => { const [, C, h] = okl(col); return C > .06 && hueGap(h, WARN_H) < 32 ? '#ffc94d' : pal.warn; };
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
  pal = { tile: v('--tile'), pin: v('--pin'), stroke: v('--stroke'), rail: v('--railC'), mut: v('--mut'), bg: v('--bg0'), fg: v('--fg'), warn: v('--warn') || '#ff7a8a', light: isLight() };
  const bar = pal.light ? '#f7f2ec' : '#0d1020';
  document.querySelector('meta[name=theme-color]').content = bar;
  const SB = window.Capacitor?.Plugins?.StatusBar;
  if (SB) { SB.setBackgroundColor?.({ color: bar })?.catch?.(() => {}); SB.setStyle?.({ style: pal.light ? 'LIGHT' : 'DARK' })?.catch?.(() => {}); }
  if (G) { setLineColor(); draw(); }
}
matchMedia('(prefers-color-scheme: light)').addEventListener?.('change', applyTheme);
// renk tonunu döndür (HSL), doygunluğu en az .55: iki merkezli bölümde ikinci hattın rengi
function hueRot(hex, deg) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  let h = 0, sat = 0;
  if (d) { sat = d / (1 - Math.abs(2 * l - 1)); h = 60 * (mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4); }
  h = (h + deg) % 360; sat = Math.max(sat, .55);
  const C = (1 - Math.abs(2 * l - 1)) * sat, X = C * (1 - Math.abs((h / 60) % 2 - 1)), m = l - C / 2;
  const v = h < 60 ? [C, X, 0] : h < 120 ? [X, C, 0] : h < 180 ? [0, C, X] : h < 240 ? [0, X, C] : h < 300 ? [X, 0, C] : [C, 0, X];
  return '#' + v.map(q => Math.round(Math.min(1, Math.max(0, q + m)) * 255).toString(16).padStart(2, '0')).join('');
}
const lum = hex => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * .299 + (n >> 8 & 255) * .587 + (n & 255) * .114) / 255; };   // algılanan parlaklık 0–1
function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; }

// ---------- rastgele ----------
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hashStr = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

// Yeni kural gelen hatlar (0 tabanlı). M3 (29+): sabit karolar · M4 (49+): eşli karolar.
const RULES = {
  2: { name: 'Sabit karo', tag: 'Yeni: sabit karo', demo: '<div class="rdemo" aria-hidden="true"><i class="rt"><b></b></i><i class="rtap"></i></div>',
    text: 'Koyu, cıvatalı karolar <b>dönmez</b>. Zaten doğru yöndeler: etrafındaki hattı <b>onlara göre</b> bağla. Hamle saymazlar.' },
  5: { name: 'Karanlık tünel', tag: 'Yeni: karanlık tünel', demo: '<div class="rdemo3" aria-hidden="true"><i class="ft on"><b></b></i><i class="ft mid"><b></b></i><i class="ft dk"><b></b><s></s></i></div>',
    text: 'Hattın ulaşmadığı yerler <b>karanlık</b>: rayları görünmez, dokunulmaz. Hat ilerledikçe çevresi <b>aydınlanır</b> ve açık kalır. Işığı takip et!' },
  4: { name: 'Ters karo', tag: 'Yeni: ters karo', demo: '<div class="rdemo2" aria-hidden="true"><i class="pt rv"><b></b><em>↺</em></i><i class="rtap2"></i></div>',
    text: 'Oklu (↺) karolar <b>ters yöne</b>, saat yönünün tersine döner. Parmağının alışkanlığına güvenme!' },
  6: { name: 'Sayaçlı karo', tag: 'Yeni: sayaçlı karo', demo: '<div class="rdemo2" aria-hidden="true"><i class="pt cn"><b></b><em><span>3<br>2<br>1<br>0</span></em></i><i class="rtap2"></i></div>',
    text: 'Sayılı karo en fazla <b>3 kez</b> döner; sayı bitince kilitlenir. <b>Önce düşün, sonra dokun.</b> Takılırsan ↺ baştan ya da 💡 ipucu.' },
  7: { name: 'İki merkez', tag: 'Yeni: iki merkez', demo: '<div class="rdemo5" aria-hidden="true"><i class="hb a"></i><i class="ln a"></i><i class="gap"></i><i class="ln b"></i><i class="hb b"></i></div>',
    text: '<b>İki istasyon, iki renk.</b> Her durak kendi merkezine bağlanmalı. İki hat birbirine değerse <b>kırmızı</b> yanar: ayır!' },
  3: { name: 'Eşli karo', tag: 'Yeni: eşli karo', demo: '<div class="rdemo2" aria-hidden="true"><i class="pt"><b></b><em>1</em></i><i class="pt"><b></b><em>1</em></i><i class="rtap2"></i></div>',
    text: 'Aynı renk ve numaralı iki karo <b>birlikte döner</b>: birine dokununca öteki de çevrilir. İkisinin de oturacağı yönü bul. Tek dokunuş = <b>1 hamle</b>.' },
};
// kural → tanıtıldığı hat. Kendi hattında her bölümde; sonra bölüm bölüm dönüşümlü 1–2 kural (kalabalık olmasın).
// M9'dan sonra yeni kurallar eklenti dosyalarından gelir (www/rules/*.js → loadRules): M9, M11, M13… · aradaki hatlar karma.
const RULE_LINE = { pins: 2, pairs: 3, rev: 4, fog: 5, cnt: 6, two: 7 };
const MODS = [], CLASH = {};   // eklentiler · birlikte gelemeyen kurallar (simetrik)
const clash = (a, b) => !!(CLASH[a]?.includes(b) || CLASH[b]?.includes(a));
function rulesFor(l) {
  const c = lineOf(l), own = Object.keys(RULE_LINE).find(k => RULE_LINE[k] === c), set = new Set(own ? [own] : []);
  const learned = Object.keys(RULE_LINE).filter(k => RULE_LINE[k] < c);
  if (!learned.length || (own && l - lineStart(c) < 3)) return set;   // yeni kuralın ilk 3 bölümü yalın
  const h = hashStr('kural' + l), extra = own ? (h % 100 < 55 ? 1 : 0) : (h % 100 < 65 ? 1 : 2);
  for (let k = 0; k < extra; k++) {
    // M9+: ek kuralın yarısı en yeni 3 kuraldan → yeni öğrenilen kural karma hatlarda sık tekrar eder (M1–M8 aynen)
    const rec = c >= 8 && (hashStr('kip' + h + k) & 3) < 2, pool = rec ? learned.slice(-3) : learned, at = (rec ? hashStr('yeni' + h + k) : h >>> (7 + k * 6)) % pool.length;
    for (let t = 0; t < pool.length; t++) { const r = pool[(at + t) % pool.length]; if (![...set].some(q => clash(q, r))) { set.add(r); break; } }   // çakışan kural sıradaki uyumluyla değişir
  }
  if (!set.size) set.add(learned[h % learned.length]);
  return set;
}
// eklenti dosyaları window.RAY_RULES'a fabrika ekler: api → kural nesnesi (alanlar: docs/kurallar/README.md)
function loadRules(api) {
  for (const f of window.RAY_RULES || []) {
    const m = f(api); if (!m?.key) continue;
    MODS.push(m); RULE_LINE[m.key] = m.line; RULES[m.line] = m.card;
    if (m.clash?.length) CLASH[m.key] = m.clash;
  }
  MODS.sort((a, b) => a.line - b.line);
  const css = MODS.map(m => m.css || '').join('\n');
  if (css) { const st = document.createElement('style'); st.textContent = css; document.head.append(st); }
}
const FOG_R = 2;                                        // yanan hattın bu kadar karo yakını aydınlanır
const PAIR_COLS = ['#ff7ab6', '#4cc9ff', '#ffc94d', '#8fe388', '#c39bff'];
const TIERS = [[3, 3], [4, 4], [4, 5], [5, 6], [5, 7], [6, 8], [7, 9]], CAPS = [3, 8, 15, 25, 40, 60, 1e9];
function sizeFor(l) {
  let k = CAPS.findIndex(m => l <= m);
  // testere dişi: yeni kural gelen hattın ilk 3 bölümü bir küçük ızgara → kural rahat öğrenilir
  if (RULES[lineOf(l)] && l - lineStart(lineOf(l)) < 3) k = Math.max(0, k - 1);
  return TIERS[k];
}

// ---------- üretim: merkezden rastgele ağaç (her zaman çözülebilir) ----------
// x: { rev: ters karo sayısı, cnt: sayaçlı karo sayısı, two: iki merkez, fog: karanlık tünel }
function generate(cols, rows, seed, pins = 0, pairs = 0, x = {}) {
  const R = rng(seed), n = cols * rows, sol = new Array(n).fill(0);
  // iki merkez: çapraz iki köşeye yakın; iki ağaç aynı anda büyür, birbirine hiç bağlanmaz
  const hub = x.two ? Math.floor(rows * .3) * cols + Math.floor(cols * .25) : (rows >> 1) * cols + (cols >> 1);
  const hub2 = x.two ? (rows - 1 - Math.floor(rows * .3)) * cols + (cols - 1 - Math.floor(cols * .25)) : -1;
  const isHub = i => i === hub || i === hub2, inT = new Array(n).fill(false);
  inT[hub] = true; if (hub2 >= 0) inT[hub2] = true;
  // kural eklentileri (www/rules/*.js): yalnız bu bölümde miktarı > 0 olanlar çalışır, R() yalnız onlar varken tüketilir → eski bölümler bit bit aynı.
  // C: eklentilerin ortak çalışma alanı. Aşamalar: pre (ağaçtan önce) · tree (ağaçtan sonra, karıştırmadan önce) · shape (eşliden sonra, ters/sayaçtan önce) · mark (sayaçtan sonra, karanlıktan önce)
  const act = MODS.filter(m => x[m.key]), C = { cols, rows, n, R, x, sol, inT, hub, hub2, isHub, adj: null, ao: null, keep: new Array(n).fill(false), busy: new Array(n).fill(false), units: [], unitOf: new Array(n).fill(-1), onTake: [], out: {} };
  C.nb = (i, k) => nb(C, i, k); C.ob = (i, k) => ob(C, i, k);
  C.unit = (cells, K, tap, kind) => { const u = C.units.push({ cells, K, tap, kind }) - 1; cells.forEach(i => { C.unitOf[i] = u; C.busy[i] = true; }); return u; };
  const stage = (st, ord = m => m.line) => act.filter(m => m[st]).sort((p, q) => ord(p) - ord(q)).forEach(m => m[st](C));
  stage('pre');
  const frontier = [];
  let tries = 0;
  const addF = i => { for (let k = 0; k < 4; k++) { const j = C.nb(i, k); if (j >= 0) frontier.push([i, j, DIRS[k][0], C.ob(i, k)]); } };
  const take = j => { inT[j] = true; addF(j); for (const f of C.onTake) f(j); };
  C.addF = addF; C.take = take;
  addF(hub); if (hub2 >= 0) addF(hub2);
  while (frontier.length) {
    const k = R() * frontier.length | 0, e = frontier.splice(k, 1)[0], [a, b, ba, ob] = e;
    if (inT[b]) continue;
    // kavşakları seyrelt → daha okunur, uzun hatlar
    if (popc(sol[a]) >= 2 && R() < .6 && tries++ < 40) { frontier.push(e); continue; }
    tries = 0;
    sol[a] |= ba; sol[b] |= ob; take(b);
  }
  stage('tree', m => m.tOrder ?? m.line);
  const cur = sol.map(m => { let r = R() * 4 | 0, v = m; while (r--) v = rot(v); return v; });
  C.cur = cur;
  // sabit karolar: doğru yönde, dönmez (merkez ve 4'lü kavşak hariç). pins=0 iken eski bölümler aynen kalır.
  const pinned = new Array(n).fill(false);
  if (pins) {
    const cand = []; for (let i = 0; i < n; i++) if (!isHub(i) && sol[i] !== 15 && !C.keep[i]) cand.push(i);
    for (let k = 0; k < pins && cand.length; k++) { const i = cand.splice(R() * cand.length | 0, 1)[0]; pinned[i] = true; cur[i] = sol[i]; }
  }
  // eşli karolar: iki karo birlikte döner. İkisi de aynı sayıda dokunuşla oturacak şekilde karıştırılır → her zaman çözülebilir.
  const link = new Array(n).fill(-1);
  if (pairs) {
    const cand = []; for (let i = 0; i < n; i++) if (!isHub(i) && !pinned[i] && sol[i] !== 15 && !C.keep[i]) cand.push(i);
    for (let k = 0; k < pairs && cand.length > 1; k++) {
      const a = cand.splice(R() * cand.length | 0, 1)[0], b = cand.splice(R() * cand.length | 0, 1)[0], t = 1 + (R() * 3 | 0);
      for (const i of [a, b]) { let v = sol[i]; for (let q = 0; q < 4 - t; q++) v = rot(v); cur[i] = v; }   // t dokunuşta çözüme döner
      link[a] = b; link[b] = a;
    }
  }
  // ters karo: saat yönünün tersine döner (simetrik karolar hariç) · sayaçlı karo: en fazla 3 kez döner (çözüm her zaman ≤ 3 dokunuş)
  const per = m => rot(m) === m ? 1 : rot(rot(m)) === m ? 2 : 4, free = i => !isHub(i) && !pinned[i] && link[i] < 0 && !C.busy[i];
  const rev = new Array(n).fill(false), cnt = new Array(n).fill(-1);
  Object.assign(C, { pinned, link, rev, cnt, per, free });
  stage('shape');
  if (x.rev) { const cand = []; for (let i = 0; i < n; i++) if (free(i) && per(sol[i]) === 4) cand.push(i); for (let k = 0; k < x.rev && cand.length; k++) rev[cand.splice(R() * cand.length | 0, 1)[0]] = true; }
  if (x.cnt) { const cand = []; for (let i = 0; i < n; i++) if (free(i) && !rev[i] && per(sol[i]) > 1) cand.push(i); for (let k = 0; k < x.cnt && cand.length; k++) cnt[cand.splice(R() * cand.length | 0, 1)[0]] = 3; }
  stage('mark');
  // karanlık tünel: merkez başta komşularına bağlı gelmez → ışık küçük bir alandan doğar
  if (x.fog) for (const h of hub2 >= 0 ? [hub, hub2] : [hub]) {
    const hx = h % cols, hy = h / cols | 0, nbs = DIRS.map(([b, dx, dy, o]) => [b, hy + dy >= 0 && hy + dy < rows && hx + dx >= 0 && hx + dx < cols ? (hy + dy) * cols + hx + dx : -1, o]).filter(([, j]) => j >= 0);
    const conn = () => nbs.filter(([b, j, o]) => (cur[h] & b) && (cur[j] & o)).length;
    let best = cur[h], bc = conn(); for (let k = 0; k < 3; k++) { cur[h] = rot(cur[h]); const c = conn(); if (c < bc) { bc = c; best = cur[h]; } } cur[h] = best;
    for (const [b, j, o] of nbs) for (let k = 0; k < 3 && free(j) && (cur[h] & b) && (cur[j] & o); k++) cur[j] = rot(cur[j]);
  }
  // çözülmüş hâlde gelmesin
  if (cur.every((v, i) => v === sol[i])) { const i = cur.findIndex((v, j) => !pinned[j] && link[j] < 0 && !C.busy[j] && rot(v) !== v); cur[i] = rot(cur[i]); }
  // par: döndürülmesi gereken karo (eş = 1, eklenti birimi = 1) sayısı · taps: gereken en az dokunuş (süre hedefi için)
  let par = 0, taps = 0;
  cur.forEach((v, i) => {
    const j = link[i]; if ((j >= 0 && j < i) || C.unitOf[i] >= 0) return;
    let r = 0, t = v, u = j >= 0 ? cur[j] : 0; const step = rev[i] ? unrot : rot;
    while ((t !== sol[i] || (j >= 0 && u !== sol[j])) && r < 4) { t = step(t); if (j >= 0) u = rot(u); r++; }
    taps += r; if (r) par++;
  });
  for (const U of C.units) { const r = unitTaps(U, cur, sol); taps += r; if (r) par++; }
  return { cols, rows, sol, cur, hub, hub2, par, taps, pinned, link, rev, cnt, fixed: new Array(n).fill(false),
    ...(C.units.length ? { units: C.units, unitOf: C.unitOf } : {}), ...(C.adj ? { adj: C.adj, ao: C.ao } : {}), ...C.out };
}
// eklenti birimi (makas, tabla…): kopya üzerinde dokuna dokuna çözüme kaç dokunuşta varılır (en çok K−1)
function unitTaps(U, cur, sol) {
  const c = cur.slice(); let r = 0;
  while (U.cells.some(i => c[i] !== sol[i]) && r < U.K) { U.tap(c); r++; }
  return r;
}
// komşuluk: geometrik ya da (tünel ağzı) P.adj / P.ao. k = DIRS sırası (K, D, G, B). Dönüş: komşu karo (yoksa −1) · komşudaki karşılık bit
function nb(P, i, k) { if (P.adj) return P.adj[i * 4 + k]; const x = i % P.cols + DIRS[k][1], y = (i / P.cols | 0) + DIRS[k][2]; return x < 0 || y < 0 || x >= P.cols || y >= P.rows ? -1 : y * P.cols + x; }
const ob = (P, i, k) => P.ao ? P.ao[i * 4 + k] : DIRS[k][3];
// çözüm ağacı: merkez(ler)den BFS → pa (ebeveyn), pd (ebeveyne giden kol biti), dep (derinlik), ow (1/2: hangi merkez). Tabela ve halka kullanır.
function tree(P, m = P.sol) {
  const n = m.length, pa = new Array(n).fill(-1), pd = new Array(n).fill(0), dep = new Array(n).fill(-1), ow = new Array(n).fill(0), q = [];
  for (const [h, t] of P.hub2 >= 0 ? [[P.hub, 1], [P.hub2, 2]] : [[P.hub, 1]]) { dep[h] = 0; ow[h] = t; q.push(h); }
  while (q.length) {
    const i = q.shift();
    for (let k = 0; k < 4; k++) {
      const j = nb(P, i, k); if (!(m[i] & DIRS[k][0]) || j < 0 || dep[j] >= 0 || !(m[j] & ob(P, i, k))) continue;
      dep[j] = dep[i] + 1; pa[j] = i; pd[j] = ob(P, i, k); ow[j] = ow[i]; q.push(j);
    }
  }
  return { pa, pd, dep, ow };
}
function popc(m) { return (m & 1) + (m >> 1 & 1) + (m >> 2 & 1) + (m >> 3 & 1); }

// ---------- zorluk puanı: oyuncunun kesin çıkarımlarını taklit eder ----------
// Kenar + komşu tutarlılığıyla aday eleme. puan = çıkarım zinciri (tur) + 3 × tahmin dalı + 10 × ilk turda elenemeyen oran.
// ~7 kolay · ~8 orta (60. bölüm düzeyi) · 12+ zor · 15+ usta
function difficulty(P, leaf = null, cap = 200) {
  const { cur, pinned, link } = P, n = cur.length, unit = new Array(n).fill(-1), units = [];
  for (let i = 0; i < n; i++) if (unit[i] < 0) {
    const u = P.unitOf?.[i] ?? -1, cells = u >= 0 ? P.units[u].cells : link[i] >= 0 ? [i, link[i]] : [i];
    cells.forEach(c => { unit[c] = units.length; }); units.push(u >= 0 ? { cells, K: P.units[u].K, U: P.units[u] } : { cells, K: 4 });
  }
  const rn = (m, k) => { while (k--) m = rot(m); return m; };
  // M[i][r]: i karosunun, biriminin r. durumundaki maskesi (normal karo r kez döner; eklenti birimi r kez kendi dokunuşunu uygular)
  const M = new Array(n);
  for (const B of units) {
    if (!B.U) { for (const i of B.cells) M[i] = [0, 1, 2, 3].map(r => rn(cur[i], r)); continue; }
    const c = cur.slice(); B.cells.forEach(i => { M[i] = []; });
    for (let r = 0; r < B.K; r++) { B.cells.forEach(i => M[i].push(c[i])); B.U.tap(c); }
  }
  const allow = MODS.filter(m => m.allow && P[m.key]);   // eklenti yerel süzgeci (ör. tabela: o kenarda kol olmalı)
  // eklenti gizli bilgisi: cands(P, i) oyuncunun o karo için düşünebileceği maskeler (tek karolu birim; ör. kapak, silik kol)
  const hid = new Set(), cm = MODS.filter(m => m.cands && P[m.key]);
  if (cm.length) for (let i = 0; i < n; i++) for (const m of cm) { const c = m.cands(P, i); if (c) { M[i] = c; hid.add(unit[i]); break; } }
  const opm = MODS.filter(m => m.open && P[m.key]), pm = MODS.filter(m => m.prune && P[m.key]);   // open: o kenarda kol eşsiz bitebilir · prune: küresel sayım süzgeci
  const C0 = units.map((B, u) => {
    if (hid.has(u)) return M[B.cells[0]].map((_, r) => r);
    if (B.cells.some(i => pinned[i])) return [0];
    const seen = new Set(), out = [];
    for (let r = 0; r < B.K; r++) {
      const k = B.cells.map(i => M[i][r]).join();
      if (seen.has(k) || allow.some(m => B.cells.some(i => !m.allow(P, i, M[i][r])))) continue;
      seen.add(k); out.push(r);
    }
    return out.length ? out : [0];
  });
  // bir tur: her karo, komşusunun önceki turdaki kesin rayına göre aday eler. Dönüş: değişen karo sayısı, çelişkide -1
  const step = (C, prev) => {
    const hit = new Set();
    for (let i = 0; i < n; i++) {
      const u = unit[i];
      for (let k = 0; k < 4; k++) {
        const j = nb(P, i, k), out = j < 0, b = DIRS[k][0], o = out ? 0 : ob(P, i, k);
        const can = opm.length && opm.some(m => m.open(P, i, k)) ? () => true : v => out ? !v : prev[unit[j]].some(r => !!(M[j][r] & o) === v);
        const K = C[u].filter(r => can(!!(M[i][r] & b)));
        if (!K.length) return -1;
        if (K.length < C[u].length) { C[u] = K; hit.add(u); }
      }
    }
    for (const m of pm) { const r = m.prune(P, C, M, unit, units); if (r === -1) return -1; for (const u of r) hit.add(u); }
    let c = 0; hit.forEach(u => { c += units[u].cells.length; }); return c;
  };
  const copy = C => C.map(a => a.slice()), fix = C => { for (;;) { const c = step(C, copy(C)); if (c < 0) return false; if (!c) return true; } };
  let waves = 0, first = 0; const C = copy(C0);
  for (;;) { const c = step(C, copy(C)); if (c <= 0) break; if (!waves) first = c; waves++; }
  let nodes = 0;
  const dfs = D => {
    if (++nodes > cap) return true;
    let b = -1; D.forEach((a, k) => { if (a.length > 1 && (b < 0 || a.length < D[b].length)) b = k; });
    if (b < 0) { const cfg = cur.map((v, i) => M[i][D[unit[i]][0]]); return leaf ? leaf(cfg) : lit({ ...P, cur: cfg }).solved; }
    for (const r of D[b]) { const E = copy(D); E[b] = [r]; if (fix(E) && dfs(E)) return true; }
    return false;
  };
  dfs(C);
  return Math.round((waves + 3 * (nodes - 1) + 10 * (1 - first / n)) * 10) / 10;
}
// ---------- zorluk merdiveni ----------
// Her bölüm K aday arasından zorluk puanı hedefe (5 + 11·z) en yakın olan; herkeste aynı. z arttıkça:
// sabit karo azalır (%16 → 0), taranan aday artar (6 → 32), ileri seviyede hamle toleransı daralır (limits).
// Yeni kuralın ilk bölümü 2 puan kolay. Sonraki bölüm, kazanma ekranı açıkken önceden hazırlanır.
const pzCache = new Map();
function pick(cols, rows, seed, pins, pairs, z, T, x = {}, K = 6 + Math.round(26 * z)) {
  let best = null;
  for (let k = 0; k < K; k++) { const P = generate(cols, rows, seed + k * 104729, pins, pairs, x); P.diff = difficulty(P); if (!best || (best.reject && !P.reject) || (!P.reject === !best.reject && Math.abs(P.diff - T) < Math.abs(best.diff - T))) best = P; }
  best.z = z; return best;
}
function cached(key, make) {
  if (!pzCache.has(key)) { pzCache.set(key, make()); if (pzCache.size > 4) pzCache.delete(pzCache.keys().next().value); }
  const P = pzCache.get(key); return { ...P, cur: P.cur.slice(), fixed: P.fixed.slice(), cnt: P.cnt.slice() };   // oyun cur/fixed/cnt'yi değiştirir
}
function puzzleFor(l) {
  return cached('l' + l, () => {
    const [c, r] = sizeFor(l), ln = lineOf(l), n = c * r, intro = !!(l === lineStart(ln) && RULES[ln]), z = zOf(l), U = rulesFor(l), fin = l === lineEnd(ln);
    const pins = U.has('pins') ? Math.round(n * (intro && ln === RULE_LINE.pins ? .22 : Math.max(.05, .16 * (1 - z)))) : 0;
    const pairs = U.has('pairs') ? Math.max(1, Math.round(n * (intro && ln === RULE_LINE.pairs ? .03 : .07))) : 0;
    const x = { rev: U.has('rev') ? Math.max(2, Math.round(n * (intro ? .08 : .15))) : 0, cnt: U.has('cnt') ? Math.max(2, Math.round(n * (intro ? .06 : .12))) : 0, two: U.has('two'), fog: U.has('fog') };
    // eklenti kuralı: bu bölümdeki miktar + zorluk payı (boost). Pay hedefe eklenir: seçici kuralın zorluğunu kolay tabanla silmesin.
    // Kuralın kendi hattındaki ilk 3 öğrenme bölümünde pay yok (testere dişi).
    let boost = 0;
    for (const m of MODS) if (U.has(m.key)) { x[m.key] = m.amount(n, intro && ln === m.line, z, fin, c, r); if (ln !== m.line || l - lineStart(ln) >= 3) boost += m.boost || 0; }
    // hat finali (SON DURAK): hedef +2 puan, en çok aday taranır · zorluk paylı bölümde de geniş tarama
    const P = pick(c, r, l * 7919 + 13, pins, pairs, z, (intro ? 3 : 5) + 11 * z + (fin ? 2 : 0) + boost, x, fin ? 32 : boost ? Math.max(24, 6 + Math.round(26 * z)) : undefined);
    P.fog = U.has('fog'); P.final = fin; P.rules = [...U]; return P;
  });
}
function dailyFor(day) {
  return cached('d' + day, () => {
    const z = dailyZ(day);
    return pick(z < .35 ? 6 : 7, z < .35 ? 8 : 9, hashStr('ray' + day), 0, 0, z, 5 + 11 * z);
  });
}

// ---------- bağlantı ----------
// own: 1 = birinci merkeze bağlı, 2 = ikinci, 3 = ikisine birden (hatlar karıştı → çözülmüş sayılmaz)
// P.split[i] (köprü): karo iki ayrı düğümdür: K–G yarısı (d/own) ve D–B yarısı (dB/ownB); ikisi de bağlanmalı.
// Eklenti denetimi: m.check(P, L) bozuk sayısı döndürür (tabela, halka…); L'ye çizim verisi yazabilir.
function lit(P) {
  const { hub, hub2 = -1, split } = P, cur = P.void ? P.cur.map((v, i) => P.void[i] ? 0 : v) : P.cur, n = cur.length, d = new Array(n).fill(-1), own = new Array(n).fill(0);
  const opm = MODS.filter(m => m.open && P[m.key]);   // eklenti: eşi olmadan bitebilen kol (tampon, depo çıkışı) → gevşek sayılmaz, L.open sayar
  const dB = split ? new Array(n).fill(-1) : null, ownB = split ? new Array(n).fill(0) : null;
  let loose = 0, opn = 0;
  for (const [h, tag] of hub2 >= 0 ? [[hub, 1], [hub2, 2]] : [[hub, 1]]) {
    const dd = new Array(split ? 2 * n : n).fill(-1), q = [h]; dd[h] = 0;
    while (q.length) {
      const u = q.shift(), i = u < n ? u : u - n, half = split?.[i] ? (u < n ? 5 : 10) : 15;
      if (u < n) { own[i] |= tag; if (d[i] < 0 || dd[u] < d[i]) d[i] = dd[u]; }
      else { ownB[i] |= tag; if (dB[i] < 0 || dd[u] < dB[i]) dB[i] = dd[u]; }
      for (let k = 0; k < 4; k++) {
        const b = DIRS[k][0];
        if (!(cur[i] & b & half)) continue;
        const j = nb(P, i, k), o = j < 0 ? 0 : ob(P, i, k);
        if (j < 0 || !(cur[j] & o)) { if (opm.length && opm.some(m => m.open(P, i, k))) opn++; else loose++; continue; }
        const v = split?.[j] && (o & 10) ? n + j : j;
        if (dd[v] < 0) { dd[v] = dd[u] + 1; q.push(v); }
      }
    }
  }
  const merged = own.includes(3) || !!ownB?.includes(3);
  let ok = loose === 0 && !merged && d.every((v, i) => v >= 0 || P.void?.[i]);
  if (split) for (let i = 0; i < n; i++) if (split[i]) { ok = ok && dB[i] >= 0; if (dB[i] >= 0 && (d[i] < 0 || dB[i] < d[i])) d[i] = dB[i]; }   // çizim için: iki yarının yanan küçüğü
  const L = { d, own, merged, open: opn, n: d.filter((v, i) => v >= 0 || P.void?.[i]).length, solved: ok, ...(split ? { dB, ownB } : {}) };
  for (const m of MODS) if (m.check && P[m.key]) { const bad = m.check(P, L); if (bad) L.solved = false; }
  return L;
}

// ---------- yıldızlar: her yıldız bir hedef ----------
// ★ bitir · ★ ⏱ süre hedefi · ★ ↻ hamle hedefi (aynı karoya art arda dokunuş = 1 hamle). İkisi birden → KUSURSUZ 👑
// hamle toleransı ızgarayla büyür: küçük ızgara +%60 → 7×9 +%75 (en az +3). Oyuncu karoları denerken gidip gelir; hedef bunu kaldırmalı.
const moveTol = n => .6 + .15 * Math.min(1, Math.max(0, (n - 9) / 54));
function limits(P) {
  // ↻ hamle payı: par'ın %60'ı (küçük ızgara) – %75'i (7×9); z %30'dan sonra yavaşça %60'ına iner → 1–200 ≈ par × 1,6–1,75, sonsuzda ≈ × 1,45
  // ⏱ süre: dokunuş başına 1,3 sn + karo başına ,5 sn + zor bölüme düşünme payı (puanın 8'i aşan her birimi +3 sn)
  const tight = 1 - .4 * Math.max(0, ((P.z || 0) - .3) / .7);
  return { m: P.par + Math.max(Math.round(3 * tight), Math.round(P.par * moveTol(P.cur.length) * tight)), t: Math.max(15, Math.round(P.taps * 1.3 + P.cur.length * .5 + Math.max(0, (P.diff || 0) - 8) * 3)) };
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
  $('sCrowns').textContent = crownBal(); $('crownChip').classList.toggle('new', !!save.newSkin);
  $('sHints').textContent = save.hints;
  $('hLevel').textContent = save.level;
  const done = save.dailyDone === today();
  $('bDaily').classList.toggle('done', done);
  $('dailyTitle').textContent = done ? 'Tamamlandı ✓' : 'Hazır';
  if (done) dailyClock(); else $('dailyState').textContent = rescueOk() ? `💔 ${save.lost.n} günlük serin koptu · kurtar` : save.streak ? `🔥 ${save.streak} günlük serini koru` : 'Her gün yeni bir hat';
  const c = lineOf(save.level), nx = c + 1, lo = need(c), hi = need(nx);
  $('lineName').textContent = lineName(c);
  $('lineName').style.color = lineCol(c);
  $('gateTxt').textContent = tot >= hi ? `★ ${tot} · M${nx + 1} açık` : `★ ${tot} / ${hi} → M${nx + 1}`;
  $('progBar').style.width = Math.min(100, Math.max(4, (tot - lo) / Math.max(1, hi - lo) * 100)) + '%';
  const [w, h] = sizeFor(save.level); $('sSize').textContent = `${w}×${h} · ⚡ zorluk %${zPct(save.level)}`;
  $('dailyK').textContent = `GÜNÜN HATTI · ⚡%${dPct(today())}`;
  $('bPlay').classList.toggle('locked', !unlocked(c));
}

// ---------- hat haritası (bölüm seçimi) ----------
function renderMap() {
  const tot = totalStars(), last = Math.max(TEST ? 19 : 0, lineOf(save.level) + 1);
  $('pStars').textContent = tot;
  $('pSub').textContent = 'Yıldız topla → yeni hat aç';
  let html = '';
  for (let c = 0; c <= Math.max(1, last); c++) {
    const open = unlocked(c), first = lineStart(c), len = lineLen(c);
    const got = Array.from({ length: len }, (_, k) => save.stars[first + k] || 0).reduce((a, b) => a + b, 0);
    html += `<div class="line ${open ? '' : 'lockd'}" style="--lc:${lineCol(c)}">
      <div class="lh"><i class="dot"></i><b>${lineName(c)}${RULES[c] ? `<em>${RULES[c].tag}</em>` : ''}</b><small>${open ? `★ ${got} / ${len * 3} · ⚡%${zPct(first)}` : `🔒 ★ ${tot} / ${need(c)}`}</small></div>
      <div class="lvs">${Array.from({ length: len }, (_, k) => {
        const l = first + k, st = save.stars[l] || 0, can = open && (TEST || l <= save.level);
        return `<button class="lv ${can ? '' : 'off'} ${l === save.level && can ? 'cur' : ''} ${l === lineEnd(c) ? 'fin' : ''}" data-l="${l}" ${can ? '' : 'disabled'}><b>${l}</b><i>${can ? (save.crowns[l] ? '👑' : starTxt(st)) : ''}</i></button>`;
      }).join('')}</div></div>`;
  }
  $('mapList').innerHTML = html;
}
$('mapList').onclick = e => { const b = e.target.closest('.lv'); if (b && !b.disabled) start('level', +b.dataset.l); };
function lockedSheet(c) {
  const tot = totalStars();
  modal(`<h2>${lineName(c)} kilitli</h2>
    <p>Bu hattı açmak için <b class="nw">★ ${need(c)}</b> gerekli. Sende <b class="nw">★ ${tot}</b> var.<br>Önceki bölümleri daha <b>hızlı</b> ve <b>az hamleyle</b> tekrar oyna, yıldızlarını artır.</p>
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
  G.color = lineCol(G.daily ? 2 : lineOf(G.lvl)); G.warn = warnFor(G.color);
  G.color2 = hueRot(G.color, 150);   // iki merkez: ikinci hat tamamlayıcı renkte (uyarı rengine düşmesin)
  if (hueGap(okl(G.color2)[2], okl(G.warn)[2]) < 30) G.color2 = hueRot(G.color, 210);
  const st = $('game').style;
  st.setProperty('--line', G.color);
  // oyun ekranında vurgu = hattın rengi: tahta, düğmeler, yıldızlar, rozetler aynı renk
  st.setProperty('--acc', G.color); st.setProperty('--acc2', shade(G.color, .8)); st.setProperty('--onacc', lum(G.color) > .5 ? '#16182a' : '#ffffff');
  st.setProperty('--accGlow', rgba(G.color, .55)); st.setProperty('--starGlow', rgba(G.color, .6)); st.setProperty('--warn', G.warn);
}
const runKey = () => G.daily ? 'daily' : 'level';
function saveRun() {
  if (!G || G.won) return;
  save.runs[runKey()] = { lvl: G.lvl, day: G.day, cur: G.cur, fixed: G.fixed, moves: G.moves, last: G.lastTile, ms: elapsed(), pv: 4, sig: G.sig, ...(G.fog ? { seen: G.seen } : {}), ...(G.cnt.some(v => v >= 0) ? { cnt: G.cnt } : {}) };
  persist();
}
function start(mode, lvl = save.level) {
  clearTimeout(howT); clearTimeout(winTimer); closeModal(); closePanel();
  const daily = mode === 'daily', day = today();
  if (!daily && !unlocked(lineOf(lvl))) { lockedSheet(lineOf(lvl)); return; }
  G = { ...(daily ? dailyFor(day) : puzzleFor(lvl)), daily, lvl: daily ? 0 : lvl, day: daily ? day : null, practice: daily && save.dailyDone === day, moves: 0, lastTile: -1, won: false, ms: 0, runAt: 0, bub: 0 };
  G.lim = limits(G);
  // yarım kalan oyunu sürdür
  const run = save.runs[daily ? 'daily' : 'level'];
  // yarım oyun yalnız aynı bulmacaya: imza = çözüm + başlangıç dizilimi (makas/tabla çözümü değil başlangıcı değiştirir);
  // imzasız eski kayıt yalnız eklentilerden etkilenmeyen bölümlerde (M9 öncesi, Günün Hattı)
  G.sig = hashStr(G.sol.join() + '|' + G.cur.join());
  if (run && (daily ? run.day === day : run.lvl === lvl) && run.cur?.length === G.cur.length && (run.sig ? run.sig === G.sig : run.pv === 4 && (daily || lvl < lineStart(8)))) {
    G.cur = run.cur.slice(); G.fixed = run.fixed.slice(); G.moves = run.moves; G.lastTile = run.last ?? -1; G.ms = run.ms || 0;
    if (run.seen?.length === G.cur.length) G.seen = run.seen.slice();
    if (run.cnt?.length === G.cur.length) G.cnt = run.cnt.slice();
  }
  setLineColor();
  G.L = lit(G); anim.clear(); press.clear(); ripples = []; parts = []; links = []; winT = 0;
  litAt = G.L.d.map(v => v >= 0 ? -1e9 : 0);
  if (!G.seen) G.seen = G.cur.map(() => !G.fog);
  seenAt = G.seen.map(() => -1e9); reveal(true);
  G.tOk = timeOk(G.ms / 1000); G.mOk = movesOk();
  $('gTitle').textContent = daily ? (G.practice ? 'Günün Hattı · pratik' : 'Günün Hattı') : `Bölüm ${lvl}${G.final ? ' · 🏁 Son durak' : ''}`;
  $('game').classList.toggle('final', !!G.final);
  $('gMoves').textContent = `${daily ? new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) : lineName(lineOf(lvl))} · ⚡%${daily ? dPct(day) : zPct(lvl)}`;
  $('gHints').textContent = save.hints;
  clearTimeout(bubT); $('gBub').classList.remove('show');
  const stake = comboStake(); $('gCombo').hidden = stake < 2; $('gCombo').textContent = `🔥${stake}`;
  show('game'); resize(); hud(); tick();
  const rc = daily ? null : (G.rules || []).map(k => RULE_LINE[k]).filter(c => RULES[c] && !save.seen[c]).sort((a, b) => a - b)[0];
  if (rc != null) ruleCard(rc);
  if (save.played === 0) setTimeout(() => toast('Karoya dokun → döner'), 500);
  else if (save.comboLost?.lvl === lvl && !daily && !G.moves) setTimeout(() => toast(`🔥 Kusursuz bitir → ${save.comboLost.n} seri geri gelir`), 600);
  else if (G.final && !save.crowns[lvl] && !G.moves) setTimeout(() => toast('🏁 Son durak · kusursuz bitir → +1 bonus 👑'), 600);
  else if (!daily && save.miss[lvl] && !save.crowns[lvl] && !G.moves) setTimeout(() => toast(`Geçen sefer: ${missTxt(lvl)}`), 600);
}
// karanlık tünel: yanan karoların FOG_R yakını (ve ipucuyla sabitlenen) aydınlanır; aydınlanan bir daha kararmaz
let seenAt = [];
function reveal(quiet) {
  if (!G.fog) return;
  const now = performance.now(), { cols, rows } = G;
  const on = i => { if (!G.seen[i]) { G.seen[i] = true; seenAt[i] = quiet ? -1e9 : now; } };
  G.L.d.forEach((v, i) => {
    if (v < 0) return;
    const x = i % cols, y = i / cols | 0;
    for (let dy = -FOG_R; dy <= FOG_R; dy++) for (let dx = -FOG_R; dx <= FOG_R; dx++) { const nx = x + dx, ny = y + dy; if (Math.abs(dx) + Math.abs(dy) <= FOG_R && nx >= 0 && ny >= 0 && nx < cols && ny < rows) on(ny * cols + nx); }
  });
  G.fixed.forEach((f, i) => f && on(i));
  // eklenti: tünelin öbür ağzı, tablanın dört karosu… (area: bir karonun FOG_R çevresi)
  const area = i => { const x = i % cols, y = i / cols | 0; for (let dy = -FOG_R; dy <= FOG_R; dy++) for (let dx = -FOG_R; dx <= FOG_R; dx++) { const nx = x + dx, ny = y + dy; if (Math.abs(dx) + Math.abs(dy) <= FOG_R && nx >= 0 && ny >= 0 && nx < cols && ny < rows) on(ny * cols + nx); } };
  for (const m of MODS) if (m.reveal && G[m.key]) m.reveal(G, on, area);
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
  if (!G.won) setNext(tOk ? `⏱ ${fmtT(left * 1000 + 999)}` : `<span class="miss">+${fmtT(-left * 1000)} rötar</span>`);
  $('gPill').classList.toggle('warn', tOk && left <= 10 && !G.won);
  $('gCombo').classList.toggle('off', !(tOk && mOk));
  trip(sec, tOk, left);
  if (!G.won) {
    // kusursuz seri bu bölümde tehlikede → baştan başlamak seriyi korur (↺ süreyi de sıfırlar)
    const s = comboStake(), keep = s >= 2 ? ` · ↺ baştan → 🔥${s} sürer` : '';
    if (G.tOk && !tOk) lose('⏱ Tren rötarda · ★ söndü' + keep);
    if (G.mOk && !mOk) lose('↻ Hamle hedefi aşıldı · ★ söndü' + keep);
  }
  G.tOk = tOk; G.mOk = mOk;
  // gerilim: süre hedefinin %30'undan sonra 8 kademede artar; hedef geçince de 2 katına kadar artmaya devam eder
  if (!G.won) { const r = sec / G.lim.t, T = r < .3 ? 0 : r <= 1 ? (r - .3) / .7 * .8 : .8 + Math.min(1, r - 1) * .2; Music.setTension(Math.round(T * 8) / 8, tOk && left <= 10); }
}
function lose(msg) { bump($('gPill')); tone(294, .2, .012); haptic('light'); toast(msg); }
const setNext = h => { if (h !== G.nxHtml) { $('gNext').innerHTML = h; G.nxHtml = h; } };

// ---------- sefer şeridi: tren süre boyunca sinyale ilerler; bulmaca bitince perona girer ----------
// Süre dolunca oyun bitmez: tren sinyalde bekler, rötar sayar, peronda yolcular arada bir laf atar (en çok 3 kez).
const SIG = .84, PAX_AT = [3, 15, 30], calmMotion = matchMedia('(prefers-reduced-motion: reduce)');
const PAX = ['☕ Bir kahve daha alırım o zaman…', 'Patron bugün de anlayış gösterir herhalde.', 'Kitabın bir bölümü daha bitti 📖', 'Sinyal arızası mı var acaba?',
  'Yürüsem daha erken varırdım 🚶', 'Neyse, manzara güzel.', 'Annem "neredesin" diye yazdı 📱', 'Kulaklıkta bir albüm bitti 🎧', 'Sabır, sabır… 🧘',
  'Tren gelince alkışlayacağım 👏', '"Yoldayım" demiştim, inanmışlardı 😅', 'Kahvem soğudu ☕', 'Bu rötar da tarihe geçer.', 'Az kaldı galiba, ışık yandı 💡'];
let bubT = 0;
function pax(msg) {
  const b = $('gBub'); b.textContent = msg || PAX[Math.random() * PAX.length | 0]; b.classList.add('show');
  clearTimeout(bubT); bubT = setTimeout(() => b.classList.remove('show'), 3400);
}
function trip(sec, tOk, left) {
  let p = G.won ? 1 : tOk ? Math.min(1, sec / G.lim.t) * SIG : SIG;
  if (calmMotion.matches && !G.won) p = Math.floor(p / SIG * 8) / 8 * SIG;   // hareketi azalt: 8 kademe (müzik gerilimiyle aynı)
  const el = $('gTrip'); el.style.setProperty('--p', p.toFixed(4));
  el.classList.toggle('soon', !G.won && tOk && left <= 10); el.classList.toggle('late', !G.won && !tOk); el.classList.toggle('arr', G.won);
  // yarım kalan oyun rötardayken açılırsa geçmiş eşikler sessizce atlanır
  if (!G.won && !tOk) for (const late = -left; G.bub < PAX_AT.length && late >= PAX_AT[G.bub]; G.bub++) if (late - PAX_AT[G.bub] < 2) pax();
}

function resize() {
  const bd = $('board'), Wd = bd.clientWidth, Hd = bd.clientHeight, dpr = Math.min(devicePixelRatio || 1, 2);   // 3x ekranda 2x yeterli, yük ~%55 az
  if (!Wd || !Hd) return;
  cv.width = Math.round(Wd * dpr); cv.height = Math.round(Hd * dpr);
  if (!G) return;
  const p = { l: 0, r: 0, t: 0, b: 0 };   // eklenti kenar payı (karo cinsinden), ör. tünel ağızları
  for (const m of MODS) if (m.pad && G[m.key]) m.pad(G, p);
  const s = Math.floor(Math.min((Wd - 8) / (G.cols + p.l + p.r), (Hd - 8) / (G.rows + p.t + p.b), 96));
  const ng = { s, ox: (Wd - s * (G.cols + p.l + p.r)) / 2 + p.l * s, oy: (Hd - s * (G.rows + p.t + p.b)) / 2 + p.t * s, dpr };
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
    if (anim.has(i)) { const t = Math.min((now - anim.get(i)) / 190, 1); a = (G.rev[i] ? 1 : -1) * (1 - back(t)) * Math.PI / 2; if (t < 1) busy = true; else anim.delete(i); }   // ters karo ters yönden gelir
    if (press.has(i)) { const t = (now - press.get(i)) / 220; if (t < 1) { sc *= 1 - .09 * Math.sin(t * Math.PI); busy = true; } else press.delete(i); }
    if (winT) { const t = (now - winT - G.L.d[i] * 45) / 320; if (t > 0 && t < 1) sc *= 1 + Math.sin(t * Math.PI) * .1; if (t < 1) busy = true; }
    X.push([ox + (i % G.cols) * s + s / 2, oy + (i / G.cols | 0) * s + s / 2, a, sc]);
  }
  const on = i => G.L.d[i] >= 0, vis = i => !G.fog || G.won || G.seen[i];   // vis: karanlık karonun rayı/durağı hiç çizilmez (uçlar taşmasın)
  // iki merkez: her hat kendi renginde, karışan hat kırmızı (OC[3])
  const own = i => G.L.own[i], OC = [null, col, G.color2 || col, G.warn], tags = [1, 2, 3].filter(t => G.L.own.includes(t));
  // eklenti çizim kancaları: xform (karo konum/açısı; X[i][4] = zemin çizilmesin) · base (zeminden önce) · under (raydan önce)
  // · rails (bölünmüş karonun rayları) · over (rozetlerden sonra, karanlık örtüden önce) · top (en üstte). true dönerse animasyon sürer.
  const D = { G, s, n, X, now, col, on, vis, own, OC, cx, pal, railPath, rrp, rr, rgba };
  const hook = k => { for (const m of MODS) if (m[k] && G[m.key] && m[k](D)) busy = true; };
  hook('xform');
  cx.lineCap = 'round';
  hook('base');
  // 1) zemin
  const tiles = f => { cx.beginPath(); for (let i = 0; i < n; i++) if (f(i) && !X[i][4]) { const [x, y, , sc] = X[i], w = (s - 6) * sc; rrp(x - w / 2, y - w / 2, w, w, s * .24 * sc); } };
  D.tiles = tiles;
  tiles(() => true); cx.fillStyle = pal.tile; cx.fill(); cx.lineWidth = 1; cx.strokeStyle = pal.stroke; cx.stroke();
  for (const t of tags) { tiles(i => own(i) === t); cx.fillStyle = rgba(OC[t], pal.light ? .10 : .07); cx.fill(); }
  // sabit karo: koyu beton zemin + köşelerde cıvata
  if (G.pinned.includes(true)) {
    tiles(i => G.pinned[i]); cx.fillStyle = pal.pin; cx.fill();
    cx.fillStyle = pal.mut; cx.beginPath();
    for (let i = 0; i < n; i++) if (G.pinned[i] && vis(i)) { const [x, y, , sc] = X[i], o = s * .31 * sc, r = s * .038; for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { cx.moveTo(x + dx * o + r, y + dy * o); cx.arc(x + dx * o, y + dy * o, r, 0, 7); } }
    cx.fill();
  }
  const anyFixed = G.fixed.includes(true);
  if (anyFixed) { tiles(i => G.fixed[i]); cx.lineWidth = 2.5; cx.strokeStyle = rgba(col, .85); cx.stroke(); }
  hook('under');
  // 2) raylar: sönük → ışıma → yanan (bölünmüş karo, ör. köprü, ve P.self karosu kendi kancasında çizilir)
  const rails = f => { cx.beginPath(); for (let i = 0; i < n; i++) if (f(i) && vis(i) && !G.split?.[i] && !G.self?.[i]) railPath(X[i], G.cur[i]); cx.stroke(); };
  cx.lineWidth = s * .17; cx.strokeStyle = pal.rail; rails(i => !on(i));
  for (const t of tags) { cx.lineWidth = s * .38; cx.strokeStyle = rgba(OC[t], pal.light ? .16 : .22); rails(i => own(i) === t); }
  for (const t of tags) { cx.lineWidth = s * .17; cx.strokeStyle = OC[t]; rails(i => own(i) === t); }
  hook('rails');
  // 3) yeni yanan karoda parlama (karo sınırına kırpılır → komşuya taşmaz)
  for (let i = 0; i < n; i++) {
    if (!on(i) || G.split?.[i] || G.self?.[i]) continue;
    const t = (now - litAt[i]) / 420;
    if (t >= 1) continue;
    busy = true; if (t <= 0) continue;
    const [x, y] = X[i];
    cx.save(); cx.beginPath(); cx.rect(x - s / 2, y - s / 2, s, s); cx.clip();
    cx.strokeStyle = pal.light ? rgba(OC[own(i)] || col, .9 * (1 - t)) : `rgba(255,255,255,${.65 * (1 - t)})`;
    cx.lineWidth = s * (pal.light ? .17 + .12 * (1 - t) : .17);
    cx.beginPath(); railPath(X[i], G.cur[i]); cx.stroke(); cx.restore();
  }
  // 4) duraklar
  const dots = (f, r) => { cx.beginPath(); for (let i = 0; i < n; i++) if (i !== G.hub && i !== G.hub2 && popc(G.cur[i]) === 1 && f(i) && vis(i) && !G.self?.[i]) { const [x, y, , sc] = X[i]; cx.moveTo(x + r * sc, y); cx.arc(x, y, r * sc, 0, 7); } };
  for (const t of tags) { dots(i => own(i) === t, s * .27); cx.fillStyle = rgba(OC[t], .22); cx.fill(); }
  cx.lineWidth = s * .065;
  for (const t of tags) { dots(i => own(i) === t, s * .15); cx.fillStyle = '#fff'; cx.fill(); cx.strokeStyle = OC[t]; cx.stroke(); }
  dots(i => !on(i), s * .15); cx.fillStyle = pal.bg; cx.fill(); cx.strokeStyle = pal.mut; cx.stroke();
  // 5) merkez istasyon(lar)
  for (const h of G.hub2 >= 0 ? [G.hub, G.hub2] : [G.hub]) {
    const [x, y, , sc] = X[h], k = s * sc, col = OC[own(h)] || (h === G.hub ? OC[1] : OC[2]);
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
  // 6d) ters karo ↺ (sağ alt) · sayaçlı karo kalan dönüş (sol alt)
  if (G.rev.includes(true) || G.cnt.some(v => v >= 0)) {
    cx.textAlign = 'center'; cx.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      if (!vis(i) || G.fixed[i]) continue;
      const [x, y, , sc] = X[i];
      if (G.rev[i]) { cx.font = `700 ${Math.round(s * .26)}px system-ui, sans-serif`; cx.fillStyle = on(i) ? OC[own(i)] : pal.mut; cx.fillText('↺', x + s * .29 * sc, y + s * .27 * sc); }
      if (G.cnt[i] >= 0) {
        const bx = x - s * .28 * sc, by = y + s * .28 * sc, z0 = G.cnt[i] === 0;
        cx.fillStyle = z0 ? G.warn : rgba(pal.light ? '#25283a' : '#eef0f7', .9); cx.beginPath(); cx.arc(bx, by, s * .13, 0, 7); cx.fill();
        cx.font = `800 ${Math.round(s * .18)}px Outfit, system-ui`; cx.fillStyle = z0 ? '#fff' : pal.light ? '#fff' : '#16182a'; cx.fillText(G.cnt[i], bx, by + 1);
      }
    }
    cx.textBaseline = 'alphabetic';
  }
  hook('over');
  // 6c) karanlık tünel: aydınlanmamış karonun üstü örtülür; aydınlanınca örtü yavaşça kalkar
  if (G.fog && !G.won) {
    // örtü tüm hücreyi kaplar (karolar arası boşluktan ray sızmasın); üstte silik karo çizgisi
    const cell = (i, f) => { const [x, y] = X[i]; f(x - s / 2 - .5, y - s / 2 - .5, s + 1, s + 1, s * .2); };
    const dark = pal.light ? 'rgba(46,48,70,' : 'rgba(8,10,20,', A = pal.light ? .93 : .97;
    cx.beginPath(); let fading = [], any = false;
    for (let i = 0; i < n; i++) {
      if (!G.seen[i]) { cell(i, rrp); any = true; }
      else if (now - seenAt[i] < 420) fading.push(i);
    }
    cx.fillStyle = dark + A + ')'; cx.fill();
    if (any) { cx.beginPath(); for (let i = 0; i < n; i++) if (!G.seen[i]) { const [x, y] = X[i], w = s - 8; rrp(x - w / 2, y - w / 2, w, w, s * .22); } cx.lineWidth = 1; cx.strokeStyle = 'rgba(255,255,255,.06)'; cx.stroke(); }
    for (const i of fading) { const t = (now - seenAt[i]) / 420; cx.fillStyle = dark + (A * (1 - ease(t))) + ')'; cx.beginPath(); cell(i, rrp); cx.fill(); busy = true; }
  }
  hook('top');
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
  if (G.fog && !G.seen[i]) { haptic('light'); tone(196, .05, .012); press.set(i, now); kick(); if (!G.fogTold) { toast('Karanlık tünel · hat yaklaşınca aydınlanır'); G.fogTold = true; } return; }
  if (G.pinned[i]) { haptic('light'); tone(220, .05, .015); press.set(i, now); kick(); if (!G.pinTold) { toast('Sabit karo · dönmez'); G.pinTold = true; } return; }
  if (G.cnt[i] === 0) { haptic('light'); tone(196, .05, .012); press.set(i, now); kick(); toast(G.cur[i] === G.sol[i] ? 'Sayaç bitti · bu karo yerinde' : 'Sayaç bitti · ↺ baştan ya da 💡 ipucu'); return; }
  // eklenti engeli (ör. köprü dönmez): m.block(G, i) → bildirim metni ya da true
  for (const m of MODS) {
    const msg = m.block && G[m.key] && m.block(G, i); if (!msg) continue;
    haptic('light'); tone(220, .05, .015); press.set(i, now); kick();
    if (msg !== true && !G['told' + m.key]) { toast(msg); G['told' + m.key] = 1; }
    return;
  }
  const u = G.unitOf?.[i] ?? -1;
  if (u >= 0) {   // eklenti birimi (makas, tabla…): birimin kendi dokunuşu; art arda aynı birim = 1 hamle
    const U = G.units[u];
    U.tap(G.cur);
    if (G.lastTile !== 'u' + u) { G.moves++; G.lastTile = 'u' + u; }
    press.set(i, now); ripples.push({ x: px, y: py, t: now });
    MODS.find(m => m.key === U.kind)?.onTap?.(G, U, i, now);   // animasyon, ilk dokunuş bildirimi
  } else {
  const j = G.link[i], key = j >= 0 ? Math.min(i, j) : i;
  G.cur[i] = G.rev[i] ? unrot(G.cur[i]) : rot(G.cur[i]);   // ters karo: saat yönünün tersine
  if (G.cnt[i] > 0) G.cnt[i]--;
  if (G.lastTile !== key) { G.moves++; G.lastTile = key; }   // aynı karoya (ya da eşine) art arda dokunuş = 1 hamle
  anim.set(i, now); press.set(i, now); ripples.push({ x: px, y: py, t: now });
  if (j >= 0) {   // eşi de döner
    G.cur[j] = rot(G.cur[j]); anim.set(j, now); press.set(j, now); links.push({ a: i, b: j, t: now });
    if (!save.pairTold) { save.pairTold = 1; persist(); toast('Eşli karo · ikisi birlikte döner'); }
  }
  }
  const prev = G.L.d, wasMerged = G.L.merged;
  G.L = lit(G); reveal();
  let gained = 0, stations = 0;
  G.L.d.forEach((v, j) => { if (v >= 0 && prev[j] < 0) { litAt[j] = now + v * 12; gained++; if (popc(G.cur[j]) === 1) { stations++; burst(j, 7, v * 12, ownCol(j)); } } });
  if (G.L.merged && !wasMerged) { haptic('heavy'); toast('İki hat birbirine değdi · ayır!'); }
  for (const m of MODS) if (m.after && G[m.key]) m.after(G, i, now);   // eklenti geri bildirimi (halka kapandı, tabela…)
  const k = Math.round(G.L.n / G.cur.length * (PENTA.length - 1));
  if (gained) { tone(note(k), .22, .05); if (stations) tone(note(k + 2), .3, .035, 'sine', .06); haptic(stations ? 'heavy' : 'light'); }
  else { tone(G.L.n < prev.filter(v => v >= 0).length ? 294 : 523, .05, .022); haptic('light'); }
  hud(); tick(); kick();
  if (gained) bump($('gPct'));
  if (G.L.solved) win(); else saveRun();
});

// kusursuz seri: tacı olmayan bölümü kusursuz bitirmek seriyi +1 yapar, kusursuzsuz bitirmek sıfırlar; taçlı bölüm seriyi etkilemez.
// Seri kırılınca aynı bölümü kusursuz bitiren oyuncu seriyi kaldığı yerden sürdürür (comboLost).
function comboStake() {
  if (!G || G.daily || save.crowns[G.lvl]) return 0;
  return save.comboLost?.lvl === G.lvl ? save.comboLost.n : save.combo || 0;
}
const ownCol = i => G.L.own?.[i] === 2 ? G.color2 : G.L.own?.[i] === 3 ? G.warn : G.color;
function win() {
  pause();
  G.won = true; G.time = elapsed();
  delete save.runs[runKey()];
  winT = performance.now() + 120;
  G.L.d.forEach((v, i) => { litAt[i] = winT + v * 45; if (popc(G.cur[i]) === 1) burst(i, 12, 120 + v * 45, ownCol(i)); });
  kick();
  [0, 2, 4, 5, 7].forEach((k, j) => tone(note(k + 3), .4, .05, 'sine', .12 + j * .09));
  haptic('win');
  Music.setMode('rest'); setTimeout(() => { if (G?.won) Music.setMode('menu'); }, 1600);
  const tOk = timeOk(G.time / 1000), mOk = movesOk(), st = 1 + tOk + mOk, perfect = tOk && mOk;
  save.played++;
  const cr0 = crownBal();
  let extra = '', unlockedNow = null, shard = false, dbl = 0;   // dbl: videoyla ikiye katlanabilecek ipucu
  let cmsg = '', combo = 0, broke = 0, near = false;               // kusursuz seri · kıl payı (tekrar öne çıkar)
  const late = Math.ceil(G.time / 1000 - G.lim.t);
  setNext(tOk ? 'Tam vaktinde' : `<span class="miss">+${fmtT(late * 1000)} rötar</span>`); trip(G.time / 1000, tOk, 0);
  if (!tOk) setTimeout(() => { if (G?.won) pax('Nihayet! 👏'); }, 700);
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
    if (!save.crowns[G.lvl]) {
      const lost = save.comboLost; delete save.comboLost;
      if (perfect) {
        combo = save.combo = (lost?.lvl === G.lvl ? lost.n : save.combo || 0) + 1; save.comboBest = Math.max(save.comboBest || 0, combo);
        if (combo % 5 === 0) { save.cc = (save.cc || 0) + 1; cmsg = `🔥 ${combo} kusursuz seri · +1 bonus 👑`; }
        else if (combo === 3) { save.hints++; cmsg = '🔥 3 kusursuz seri · +1 ipucu'; }
        else if (lost?.lvl === G.lvl) cmsg = `🔥 Seri geri geldi · ${combo}`;
      } else {
        if ((save.combo || 0) >= 2 && save.shield > 0) { save.shield--; combo = save.combo; cmsg = `🛡 Kalkan seriyi korudu · 🔥${combo}`; }   // sandıktan
        else { if ((save.combo || 0) >= 2) save.comboLost = { n: broke = save.combo, lvl: G.lvl }; save.combo = 0; }
        near = (tOk || late <= 5) && (mOk || G.moves - G.lim.m <= 2);
      }
    }
    // hangi hedef ne kadar kaçtı: [⏱ sn geç, ↻ hamle fazla]. Taç topla listesi ve tekrar oynarken gösterilir.
    if (perfect) delete save.miss[G.lvl]; else if (st >= old) save.miss[G.lvl] = [tOk ? 0 : Math.ceil(G.time / 1000 - G.lim.t), mOk ? 0 : G.moves - G.lim.m];
    if (st > old && old) extra = `Yeni rekor: ${starTxt(st)}`;
    save.level = Math.max(save.level, G.lvl + 1);
    if (G.lvl === lineEnd(lineOf(G.lvl)) && firstClear) { save.hints += 2; dbl = 2; extra = '🎁 Hat tamam · +2 ipucu'; }
    if (perfect && G.final && !save.crowns[G.lvl]) { save.fc = (save.fc || 0) + 1; extra = [extra, '🏁 Son durak kusursuz · +1 bonus 👑'].filter(Boolean).join(' · '); }
    if (perfect && !save.crowns[G.lvl]) { save.crowns[G.lvl] = 1; shard = true; }   // parça bölüm başına bir kez
    for (let c = 1; c <= lineOf(save.level) + 1; c++) if (need(c) > before && unlocked(c)) unlockedNow = c;
  }
  let shardMsg = '';
  if (shard) {
    save.shards = (save.shards || 0) + 1;
    if (save.shards >= 3) { save.shards -= 3; save.hints++; shardMsg = '💎 3 parça birleşti · +1 ipucu'; } else shardMsg = `💎 İpucu parçası ${save.shards}/3`;
  }
  const ns = SKINS.find(k => !k.vip && !skinOpen(k) && k.need > cr0 && k.need <= crownBal());   // bakiye bir temaya yetti
  if (ns) { save.newSkin = 1; extra = [extra, `🎨 ${ns.name} alınabilir (👑 ${ns.need})`].filter(Boolean).join(' · '); }
  persist();
  $('gCombo').hidden = combo < 2; $('gCombo').textContent = `🔥${combo}`; $('gCombo').classList.remove('off');
  const g = G, wait = 120 + Math.max(...G.L.d) * 45 + 650, info = { st, tOk, mOk, perfect, extra: [cmsg, shardMsg, extra].filter(Boolean).join(' · '), unlockedNow, ns, dbl, combo, broke, near };
  winTimer = setTimeout(() => { if (G === g && active('game')) winSheet(g, info); }, wait);
  if (!g.daily) setTimeout(() => puzzleFor(g.lvl + 1), wait + 900);   // sonraki bölüm hazır olsun (geçişte takılma olmasın)
}
// Sonuç paneli tahtanın altına yerleşir; tahta küçülüp üstte görünür kalır.
// Kıl payı ya da kırılan seri → "Tekrar dene" büyük düğmeye geçer, Sonraki küçük sıraya iner (düğme sayısı aynı kalır).
function winSheet(g, { st, tOk, mOk, perfect, extra, unlockedNow, ns, dbl, combo, broke, near }) {
  const L = g.lim, nx = g.lvl + 1, nxLocked = !g.daily && !unlocked(lineOf(nx)), again = !g.daily && (near || broke >= 2);
  const badge = unlockedNow ? `<span class="badge">YENİ HAT AÇILDI · M${unlockedNow + 1}</span>` : ns ? '<span class="badge">TEMA ALINABİLİR 🎨</span>' : perfect ? `<span class="badge">KUSURSUZ 👑${combo >= 2 ? ` · 🔥${combo}` : ''}</span>` : '';
  const miss = [tOk ? '' : `⏱ ${Math.ceil(g.time / 1000 - L.t)} sn`, mOk ? '' : `↻ ${g.moves - L.m} hamle`].filter(Boolean).join(' · ');
  const tip = perfect ? '' : `<p class="tip">Kusursuz için: ${[tOk ? '' : `⏱ ≤ ${fmtT(L.t * 1000)}`, mOk ? '' : `↻ ≤ ${L.m} hamle`].filter(Boolean).join(' ve ')}</p>`;
  const primary = g.daily
    ? '<button id="mShare" class="btn primary"><span>Paylaş</span><small>Arkadaşına meydan oku</small></button><button id="mHome" class="btn glassbtn">Ana sayfa</button>'
    : again
      ? `<button id="mRetry" class="btn primary"><span>Tekrar dene</span><small>${broke >= 2 ? `${near ? 'Kıl payı · ' : ''}🔥 ${broke} seri geri gelsin` : `Kıl payı · ${miss}`}</small></button>
       <div class="row2">${nxLocked ? '<button id="mMap" class="btn glassbtn">Hatlar</button>' : '<button id="mNext" class="btn glassbtn">Sonraki</button>'}<button id="mShare" class="btn glassbtn">Paylaş</button><button id="mHome" class="btn glassbtn">Ana sayfa</button></div>`
      : `${nxLocked ? `<button id="mMap" class="btn primary"><span>Yeni hat kilitli</span><small>★ ${totalStars()} / ${need(lineOf(nx))} · yıldız topla</small></button>` : `<button id="mNext" class="btn primary"><span>Sonraki</span><small>Bölüm ${nx}</small></button>`}
       <div class="row2"><button id="mRetry" class="btn glassbtn">Tekrar</button><button id="mShare" class="btn glassbtn">Paylaş</button><button id="mHome" class="btn glassbtn">Ana sayfa</button></div>`;
  $('winPanel').innerHTML = `<div class="wp-top"><div class="wp-sum">${starsHtml([true, tOk, mOk])}<div class="wp-t"><h2>${g.practice ? 'Pratik tamam!' : g.daily ? 'Günün Hattı tamam!' : 'Hat açıldı!'}</h2>${badge}</div></div>
      <button id="wTog" class="wp-tog" aria-label="Hattı gör"><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg><span>Hattı gör</span></button></div>
    <div class="wp-more"><div class="statrow"><div><b class="${tOk ? 'ok' : 'miss'}">${fmtT(g.time)}<small> / ${fmtT(L.t * 1000)}</small></b><span>${tOk ? '⏱ tam vaktinde ★' : '⏱ rötar ✗'}</span></div><div><b class="${mOk ? 'ok' : 'miss'}">${g.moves}<small> / ${L.m}</small></b><span>↻ hamle ${mOk ? '★' : '✗'}</span></div></div>${tip}${extra ? `<p class="tip">${extra}${dbl && Ads.online() ? ` <button id="mDbl" class="dbl">▶ 2 katı</button>` : ''}</p>` : ''}</div>
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
  const g = G; if (g.going) return; g.going = 1;   // çift dokunuş tek geçiş: reklam sürerken ikinci basış bölüm atlatmasın
  if (!g.daily && !save.noAds && save.played >= 5 && sessionWins % INTER_EVERY === 0) {
    Music.stop(); const shown = await Ads.interstitial(); Music.start();
    if (shown && (save.interN = (save.interN || 0) + 1) % 3 === 0) { persist(); setTimeout(() => toast('Reklamsız oyna → Ayarlar · Reklamsız paket'), 900); }
  }
  if (G === g) start('level', g.lvl + 1);
}
function dailyResult() {
  const d = save.dailyStats;
  modal(`${starsHtml(d.st)}<h2>Günün Hattı tamam</h2>
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
    <div class="perks"><div><i>🚫</i><span>Bölüm aralarındaki reklamlar kalkar</span></div><div><i>💡</i><span><b>+20 ipucu</b> hediye</span></div><div><i>🎨</i><span><b>3 özel tema:</b> Altın, Elmas, Yakut</span></div><div><i>🚇</i><span>Tek seferlik · ömür boyu</span></div></div>
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
  save.noAds = true; SKINS.forEach(k => { if (k.vip) save.owned[k.id] = 1; }); save.hints += 20; persist();
  $('gHints').textContent = save.hints; refreshHome();
  haptic('win'); toast('Reklamsız paket aktif 💛 +20 ipucu · 3 özel tema açıldı');
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
  G.cur.forEach((v, i) => { if (!G.fixed[i] && !G.void?.[i] && v !== G.sol[i]) wrong.push(i); });
  if (!wrong.length) return;
  // ışıklı bölgeye komşu olanı seç → daha anlamlı ipucu
  const usz = i => G.units?.[G.unitOf[i]]?.cells.length || 1;   // eklenti birimi (tabla: 4 karo) sona
  wrong.sort((a, b) => (G.seen[b] - G.seen[a]) || usz(a) - usz(b) || nearLit(b) - nearLit(a));
  const i = wrong[0], now = performance.now(), prev = G.L.d, ui = G.unitOf?.[i] ?? -1;
  for (const k of ui >= 0 ? G.units[ui].cells : G.link[i] >= 0 ? [i, G.link[i]] : [i]) { G.cur[k] = G.sol[k]; G.fixed[k] = true; anim.set(k, now); press.set(k, now); }   // eşli karo / eklenti birimi: hepsi birden
  save.hints--; persist(); $('gHints').textContent = save.hints; bump($('gHints'));
  G.L = lit(G); reveal();
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
  G.L = lit(G); litAt = G.L.d.map(v => v >= 0 ? -1e9 : 0); reveal(true);
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
    <button class="opt row" id="oSkin"><span>Renk temaları</span><small>${skin().name} · 👑 ${crownBal()} ›</small></button>
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
const skinSvg = '<svg viewBox="0 0 120 60"><path d="M10 46H40L60 28H110"/><path d="M60 6V28L80 46H110"/><path d="M10 14H36L60 28"/><rect x="52" y="20" width="16" height="16" rx="5"/></svg>';
const skinVars = k => { const c = skinCols(k); return `--s1:${c[0]};--s2:${c[1]};--s3:${c[2]}`; };
function skinSheet() {
  const bal = crownBal(), cur = skin().id;
  if (save.newSkin) { save.newSkin = 0; persist(); refreshHome(); }
  const card = k => {
    const own = skinOpen(k), can = !own && bal >= k.need;
    return `<button class="skin ${own ? '' : 'lockd'} ${can ? 'can' : ''} ${k.id === cur ? 'on' : ''}" data-k="${k.id}" style="${skinVars(k)}">${skinSvg}
      <b>${k.name}</b><small>${k.id === cur ? 'Seçili ✓' : own ? 'Seç' : k.vip ? '💛 Reklamsız' : `👑 ${k.need}`}</small></button>`;
  };
  const nx = SKINS.filter(k => !k.vip && !skinOpen(k)).sort((a, b) => a.need - b.need)[0], hn = huntList().length;   // en ucuz alınmamış tema · taç bekleyen bölüm
  modal(`<h2>Renk temaları</h2><p>Bölümleri <b>kusursuz</b> bitir (⏱ ve ↻ hedefi), 👑 kazan, temayı <b>satın al</b>. Harcanan 👑 geri gelmez, seçimini iyi yap!</p>
    <div class="nexts"><small>Bakiye</small><b class="bal">👑 ${bal}</b></div>
    <button id="mChest" class="chestrow ${bal >= CHEST ? 'can' : ''}"><i>${CHEST_SVG}</i><span><b>Sürpriz sandık</b><small>İpucu · 🛡 seri kalkanı · 🚆 tren kaplaması</small></span><em>👑 ${CHEST}</em></button>
    <div class="skins" id="skins">${SKINS.filter(k => !k.vip).map(card).join('')}
      <small class="vipk">💛 Reklamsız pakete özel</small>${SKINS.filter(k => k.vip).map(card).join('')}</div>
    ${nx ? `<div class="nexts"><small>Sonraki: <b>${nx.name}</b></small><small>👑 ${Math.min(bal, nx.need)} / ${nx.need}</small></div><div class="pb"><i style="width:${Math.max(4, Math.min(100, bal / nx.need * 100))}%"></i></div>
    <button id="mHunt" class="btn primary"><span>Taç topla 👑</span><small>${hn ? `${hn} bölüm kusursuz bitmeyi bekliyor` : 'Yeni bölümleri ⏱ ve ↻ hedefiyle bitir'}</small></button>` : ''}
    <button id="mClose" class="btn glassbtn">Tamam</button>`, { mClose: closeModal, mHunt: () => crownHunt(nx), mChest: chestSheet });
  $('skins').onclick = e => {
    const b = e.target.closest('.skin'); if (!b) return;
    const k = SKINS.find(x => x.id === b.dataset.k);
    if (!skinOpen(k)) { haptic('light'); k.vip ? shopSheet() : bal >= k.need ? buySheet(k) : crownHunt(k); return; }
    if (k.id === cur) return;
    save.skin = k.id; persist(); applyTheme(); refreshHome(); haptic('heavy'); tone(note(7), .25, .045); tone(note(9), .3, .035, 'sine', .07);
    skinSheet();
  };
}
// satın alma onayı: kalan bakiye açıkça gösterilir
function buySheet(k) {
  const bal = crownBal(), left = bal - k.need, nx = SKINS.filter(x => !x.vip && !skinOpen(x) && x !== k).sort((a, b) => a.need - b.need)[0];
  modal(`<div class="skin big" style="${skinVars(k)}">${skinSvg}</div><h2>${k.name}</h2>
    <p><b class="nw">👑 ${k.need}</b> harcanacak. Sende <span class="nw">👑 ${bal}</span> → kalan <b class="nw">👑 ${left}</b>.${nx && left < nx.need ? `<br>Sonra ${nx.name} için ${nx.need - left} 👑 daha toplaman gerekecek.` : ''}</p>
    <button id="mBuy" class="btn primary"><span>Satın al · 👑 ${k.need}</span><small>Temayı hemen kullan</small></button>
    <button id="mBack" class="btn glassbtn">Vazgeç</button>`, {
    mBuy: () => {
      if (crownBal() < k.need || skinOpen(k)) return skinSheet();
      save.spent = (save.spent || 0) + k.need; save.owned[k.id] = 1; save.skin = k.id; persist();
      applyTheme(); refreshHome(); haptic('win'); [0, 4, 7, 12].forEach((q, j) => tone(note(q + 3), .35, .045, 'sine', j * .08));
      toast(`🎨 ${k.name} senin!`); skinSheet();
    },
    mBack: skinSheet });
}
// Taç avı: kusursuz bitmemiş bölümler, yıldızlarıyla. En çok yıldızlı (kusursuza en yakın) önce; dokun → oyna.
const missTxt = l => { const [t, m] = save.miss[l] || [0, 0]; return [t ? `⏱ ${t} sn geç` : '', m ? `↻ ${m} hamle fazla` : ''].filter(Boolean).join(' · '); };
const huntList = () => { const L = []; for (let l = 1; l < save.level; l++) if (!save.crowns[l] && unlocked(lineOf(l))) L.push(l); return L.sort((a, b) => (save.stars[b] || 0) - (save.stars[a] || 0) || a - b); };
function crownHunt(k) {
  const n = crownBal(), L = huntList();
  modal(`<h2>Taç topla 👑</h2>
    <p>${k && k.need > n ? `<b>${k.name}</b> için <b>${k.need - n} 👑</b> daha gerekli. ` : ''}${L.length ? 'Aşağıdaki bölümleri' : 'Bölümleri'} <b>⏱ süre</b> ve <b>↻ hamle</b> hedefiyle bitir: her biri 1 👑.</p>
    ${L.length ? `<div class="hunt" id="hunt">${L.map(l => `<button class="hrow" data-l="${l}"><b>${l}</b><span>${starTxt(save.stars[l] || 0)}</span><small>${missTxt(l)}</small></button>`).join('')}</div>
    <p class="tip">★★☆ olanlar kusursuza en yakın · Günün Hattı'nı kusursuz bitirmek de 1 👑</p>`
    : `<p class="tip">${save.level > 1 ? 'Oynadığın her bölüm kusursuz! 🎉 ' : ''}Yeni bölümler ve Günün Hattı yeni 👑 getirir.</p><button id="mPlay" class="btn primary"><span>Oyna</span><small>Bölüm ${save.level}</small></button>`}
    <button id="mBack" class="btn glassbtn">Temalara dön</button>`, { mBack: skinSheet, mPlay: () => start('level') });
  if ($('hunt')) $('hunt').onclick = e => { const b = e.target.closest('.hrow'); if (b) start('level', +b.dataset.l); };
}

// ---------- sürpriz sandık: 👑 ile açılır (temaya alternatif harcama). İçinden asla 👑 çıkmaz → taçla taç kumarı yok ----------
// Algoritma: oyuncuya özel tohum (ilk sandıkta bir kez) + sandık sırası → ağırlıklı çekiliş. Sonuç taç harcandığı an
// kaydedilir; uygulamayı kapatıp açmak sonucu değiştirmez. Şanssızlık koruması: 7 sandık destansısız → 8. destansı.
const CHEST = 10, PITY = 8, SHIELD_MAX = 3;
const RARITY = { c: ['Sıradan', .60], r: ['Nadir', .28], e: ['Destansı', .12] };
// tren kaplamaları: sefer şeridindeki trenin görünüşü. 'hat' = trenin rengi hattın rengi (herkeste var)
const LIVERIES = [
  { id: 'hat', name: 'Hat rengi' },
  { id: 'ekspres', name: 'Kırmızı Ekspres', b: ['#e8475b', '#e8475b'], w: '#fff' },
  { id: 'gece', name: 'Gece Treni', b: ['#34449a', '#34449a'], w: '#ffd36b' },
  { id: 'nane', name: 'Nane', b: ['#5fd6b0', '#5fd6b0'], w: '#0f3b30' },
  { id: 'retro', name: 'Retro', b: ['#f3e3c3', '#c8423b'], w: '#3a2a20' },
  { id: 'gunbatimi', name: 'Gün Batımı', b: ['#ff8a5c', '#ffcf5c'], w: '#fff' },
  { id: 'buz', name: 'Buz', b: ['#bfe9ff', '#bfe9ff'], w: '#2b6e99' },
  { id: 'lavanta', name: 'Lavanta', b: ['#b394ff', '#ff9ad5'], w: '#fff' },
  { id: 'altin', name: 'Altın Ekspres', b: ['#e9b949', '#e9b949'], w: '#fff6d6' },
];
const TRAIN = '<svg class="trn" viewBox="0 0 40 14"><path class="tb1" d="M3 3h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path class="tb2" d="M22 3h10c4 0 7 3 7 6v1a2 2 0 0 1-2 2H22a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path class="tw" d="M4 5h12v2.6H4zm19 0h9.5c1.6 0 3 1 3.6 2.6H23z"/><circle class="tl" cx="36.6" cy="9.8" r="1.1"/></svg>';
const livVars = v => v?.b ? `--tb1:${v.b[0]};--tb2:${v.b[1]};--tw:${v.w}` : '';
const ownsLiv = id => id === 'hat' || !!save.trains?.[id];
function applyLivery() { const v = LIVERIES.find(x => x.id === save.train), s = $('gTrip').style; ['--tb1', '--tb2', '--tw'].forEach((k, i) => v?.b ? s.setProperty(k, i < 2 ? v.b[i] : v.w) : s.removeProperty(k)); }
$('gTrain').innerHTML = TRAIN; applyLivery();

function chestRoll() {
  if (!save.seed) save.seed = (Math.random() * 2147483646 | 0) + 1;
  const R = rng(save.seed + (save.chests || 0) * 7919);
  let x = R(), tier = 'e';
  for (const t of ['c', 'r']) { if (x < RARITY[t][1]) { tier = t; break; } x -= RARITY[t][1]; }
  if ((save.dry || 0) >= PITY - 1) tier = 'e';
  const y = R(), free = LIVERIES.filter(v => !ownsLiv(v.id));
  if (tier === 'c') return { tier, kind: 'hint', n: 2 };
  if (tier === 'r') return y < .5 || (save.shield || 0) >= SHIELD_MAX ? { tier, kind: 'hint', n: 4 } : { tier, kind: 'shield' };
  return free.length ? { tier, kind: 'liv', id: free[y * free.length | 0].id } : { tier, kind: 'hint', n: 6 };
}
// çizilmiş sandık, üç katman: arkada açık kapağın içi, ortada gövde, önde kapalı kapak. Menteşe arkada: açılırken dış kapak
// yukarı kalkıp incelir, iç yüzü menteşeden büyür. Yalnız transform (SVG yeniden çizilmez) → düşük donanımda da akıcı.
// Renk geçişleri belgeye bir kez eklenir (aynı id her sandıkta tekrar etmesin)
const CH_BODY = 'M12 57h96v33a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6z', CH_LID = 'M12 58V40C12 27 32 20 60 20S108 27 108 40v18z', CH_O = 'stroke="#3a1c0c"';
document.body.insertAdjacentHTML('beforeend', `<svg class="cdefs" aria-hidden="true"><defs>
<linearGradient id="cgW" x2="0" y2="1"><stop offset="0" stop-color="#bd7442"/><stop offset="1" stop-color="#6a3518"/></linearGradient>
<linearGradient id="cgL" x2="0" y2="1"><stop offset="0" stop-color="#94502a"/><stop offset=".3" stop-color="#dc975d"/><stop offset=".62" stop-color="#b0683a"/><stop offset="1" stop-color="#7a3f1f"/></linearGradient>
<linearGradient id="cgI" x2="0" y2="1"><stop offset="0" stop-color="#2a1309"/><stop offset="1" stop-color="#7a4520"/></linearGradient>
<linearGradient id="cgE"><stop offset="0" stop-opacity=".3"/><stop offset=".14" stop-opacity="0"/><stop offset=".86" stop-opacity="0"/><stop offset="1" stop-opacity=".34"/></linearGradient>
<linearGradient id="cgG"><stop offset="0" stop-color="#fff2bd"/><stop offset=".45" stop-color="#f4c24f"/><stop offset="1" stop-color="#b5741d"/></linearGradient>
<linearGradient id="cgP" x2="0" y2="1"><stop offset="0" stop-color="#ffeaa3"/><stop offset="1" stop-color="#d6962b"/></linearGradient>
<linearGradient id="cgM" x2="0" y2="1"><stop offset="0" stop-color="#fffbe6"/><stop offset=".55" stop-color="#ffd76e"/><stop offset="1" stop-color="#ff9f43"/></linearGradient>
<radialGradient id="cgB" cy=".42" r=".62"><stop offset="0" stop-color="#fffbe0"/><stop offset="1" stop-color="#ffc93c"/></radialGradient>
<linearGradient id="cgS" x2="0" y2="1"><stop offset="0" stop-color="#a9c6ff"/><stop offset="1" stop-color="#4a68d6"/></linearGradient>
<linearGradient id="cgF" x2="0" y2="1"><stop offset="0" stop-color="#ffd36b"/><stop offset="1" stop-color="#ff6f61"/></linearGradient>
<clipPath id="cgC"><path d="${CH_LID}"/></clipPath></defs></svg>`);
const chStrap = (y, h) => `<rect x="26" y="${y}" width="10" height="${h}" fill="url(#cgG)"/><rect x="84" y="${y}" width="10" height="${h}" fill="url(#cgG)"/><path d="M26 ${y}v${h}M36 ${y}v${h}M84 ${y}v${h}M94 ${y}v${h}" ${CH_O} stroke-opacity=".5"/>`;
const CHEST_SVG = `<div class="chx"><svg class="chi" viewBox="0 0 120 104"><path d="M14 58V41C14 29 33 23 60 23S106 29 106 41v17z" fill="url(#cgI)" ${CH_O} stroke-width="2"/><path d="M20 57V42C20 33 37 28 60 28S100 33 100 42v15" fill="none" stroke="url(#cgP)" stroke-width="2.6" stroke-opacity=".8"/></svg>`
  + `<svg class="chb" viewBox="0 0 120 104"><rect x="15" y="49" width="90" height="11" rx="5.5" fill="url(#cgM)"/><path d="${CH_BODY}" fill="url(#cgW)"/><path d="M13 70h94M13 83h94" ${CH_O} stroke-opacity=".4" stroke-width="1.4"/><path d="M13 71.6h94M13 84.6h94" stroke="#fff" stroke-opacity=".12"/>${chStrap(57, 39)}<path d="${CH_BODY}" fill="url(#cgE)"/><g fill="#fff6d0"><circle cx="31" cy="64" r="1.6"/><circle cx="31" cy="89" r="1.6"/><circle cx="89" cy="64" r="1.6"/><circle cx="89" cy="89" r="1.6"/></g><rect x="49" y="58" width="22" height="20" rx="5" fill="url(#cgP)" ${CH_O} stroke-width="1.6"/><path d="M60 63a2.6 2.6 0 0 0-1.4 4.8l-.8 4.2h4.4l-.8-4.2A2.6 2.6 0 0 0 60 63z" fill="#3a1c0c"/><path d="${CH_BODY}" fill="none" ${CH_O} stroke-width="2"/></svg>`
  + `<svg class="chl" viewBox="0 0 120 104"><path d="${CH_LID}" fill="url(#cgL)"/><path d="M13 44h94" ${CH_O} stroke-opacity=".35" stroke-width="1.4"/><path d="M27 31c9-4 20-5.5 33-5.5s24 1.5 33 5.5" fill="none" stroke="#fff" stroke-opacity=".32" stroke-width="2.4" stroke-linecap="round"/><g clip-path="url(#cgC)">${chStrap(16, 42)}</g><path d="${CH_LID}" fill="url(#cgE)"/><rect x="12" y="51" width="96" height="7" fill="url(#cgP)"/><path d="M12 51h96" ${CH_O} stroke-opacity=".45"/><g fill="#fff6d0"><circle cx="31" cy="33" r="1.6"/><circle cx="89" cy="33" r="1.6"/></g><path d="M52 48h16v9a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4z" fill="url(#cgP)" ${CH_O} stroke-width="1.6"/><path d="${CH_LID}" fill="none" ${CH_O} stroke-width="2"/></svg></div>`;
// ödül simgeleri (oyunun çizgi simgeleriyle aynı dil): ampul = #bHint yolu + ışık çizgileri, kalkanın içinde seri alevi
const RW_ICON = {
  hint: '<svg class="rwi" viewBox="-1 -3 26 26"><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1.1 1.2 1.1 2.2h5c0-1 .5-1.7 1.1-2.2A6 6 0 0 0 12 3z" fill="url(#cgB)"/><path d="M9 18h6M10 21h4"/><path class="ry" d="M12 .6v-2M17.9 3.1l1.4-1.4M6.1 3.1 4.7 1.7M20.4 9h2M3.6 9h-2"/></svg>',
  shield: '<svg class="rwi" viewBox="0 0 24 24"><path d="M12 2.6 19.4 5.4v5.4c0 4.7-3 8.6-7.4 10.6-4.4-2-7.4-5.9-7.4-10.6V5.4z" fill="url(#cgS)"/><path d="M12 8.2c.5 2 2.5 2.75 2.5 5.5a2.5 2.5 0 0 1-5 0c0-1.25.6-2 1.25-2.5.1.9.5 1.5 1.1 1.65C11.5 11.5 11.65 9.7 12 8.2z" fill="url(#cgF)" stroke="none"/></svg>',
};
const LOOT = [['c', '💡 ipucu ×2'], ['r', '💡 ipucu ×4 <i>ya da</i> 🛡 seri kalkanı ×1'], ['e', '🚆 yeni tren kaplaması']];
function chestSheet() {
  const bal = crownBal(), can = bal >= CHEST, own = LIVERIES.filter(v => ownsLiv(v.id)).length, cur = save.train || 'hat';
  modal(`<h2>Sürpriz sandık</h2>
    <div class="cbox ${can ? 'can' : ''}" id="chestBox">${CHEST_SVG}<div class="loot">${LOOT.map(([t, s]) => `<b class="tier-${t}">${RARITY[t][0]}</b><span>${s}</span>`).join('')}<small>${PITY} sandıkta destansı çıkmazsa ${PITY}.si garanti</small></div></div>
    <div class="odds">${Object.entries(RARITY).map(([t, [n, p]]) => `<b class="tier-${t}">${n} %${Math.round(p * 100)}</b>`).join('<i>·</i>')}<button id="mOdds" class="qm" aria-label="Sandıktan ne çıkar?">?</button></div>
    <button id="mOpen" class="btn primary cbtn">${can ? `<span>Aç · 👑 ${CHEST}</span>` : `<span>Taç topla</span><small>👑 ${CHEST} gerekli</small>`}</button>
    <div class="nexts"><small>Trenin</small><small>🚆 ${own} / ${LIVERIES.length}</small></div>
    <div class="trains" id="trains">${LIVERIES.map(v => `<button data-v="${v.id}" class="${ownsLiv(v.id) ? '' : 'lockd'} ${v.id === cur ? 'on' : ''}" style="${livVars(v)}">${TRAIN}<span>${ownsLiv(v.id) ? v.name : '?'}</span></button>`).join('')}</div>
    <button id="mBack" class="btn glassbtn">Temalara dön</button>`, { mOpen: () => can ? openChest() : crownHunt(), mBack: skinSheet });
  // "?": sandık çiziminin yerinde içindekiler; tekrar "?" ya da kartın kendisi → geri
  const box = $('chestBox'), info = () => {
    const on = box.classList.toggle('info'), sh = $('mCard'); $('mOdds').classList.toggle('on', on); haptic();
    sh.classList.toggle('fit', sh.scrollHeight <= sh.clientHeight + 1);
  };
  $('mOdds').onclick = info; box.onclick = () => box.classList.contains('info') && info();
  $('trains').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (!ownsLiv(b.dataset.v)) { haptic('light'); toast('Sandıktan destansı olarak çıkar'); return; }
    save.train = b.dataset.v; persist(); applyLivery(); haptic(); tone(note(7), .2, .04); chestSheet();
  };
}
function openChest() {
  if (crownBal() < CHEST) return chestSheet();
  const r = chestRoll();
  // sonuç ödülle birlikte hemen kaydedilir (animasyon yarıda kesilse de)
  save.spent = (save.spent || 0) + CHEST; save.chests = (save.chests || 0) + 1; save.dry = r.tier === 'e' ? 0 : (save.dry || 0) + 1;
  if (r.kind === 'hint') save.hints += r.n;
  else if (r.kind === 'shield') save.shield = (save.shield || 0) + 1;
  else save.trains = { ...save.trains, [r.id]: 1 };
  persist(); refreshHome(); chestScene(r);
}
// açılış sahnesi (tam ekran): sandık düşer ve sallanır → dokun → kapak açılır, ışık patlar, ödül sandıktan fırlar → dokun → pencereye dön
function chestScene(r) {
  const calm = calmMotion.matches, v = LIVERIES.find(x => x.id === r.id), n = r.kind === 'hint' ? r.n : r.kind === 'shield' ? 1 : 0;
  const [name, sub] = r.kind === 'hint' ? ['İpucu', `Şimdi ${save.hints} ipucun var`] : r.kind === 'shield' ? ['Seri kalkanı', `Kırılan seriyi bir kez korur · sende ${save.shield}/${SHIELD_MAX}`] : [v.name, 'Yeni tren kaplaması'];
  const el = document.createElement('div');
  el.id = 'chestScene'; el.className = `cscene t-${r.tier}${calm ? ' calm' : ''}`; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Sürpriz sandık');
  el.innerHTML = `<div class="cs-col"><span class="badge tier-${r.tier} cs-tier">${RARITY[r.tier][0].toLocaleUpperCase('tr')}</span>
    <div class="cs-rw"><i class="cs-glow"></i><i class="cs-rays"></i><div class="cs-ic rw-${r.kind}" style="${livVars(v)}">${v ? TRAIN : RW_ICON[r.kind]}${n ? `<b class="cs-n">${n}</b>` : ''}</div></div>
    <div class="cs-name"><h2>${name}</h2><p>${sub}</p></div>
    <div class="cs-box"><div class="cs-ch"><i class="cs-sh"></i><div class="cs-chest">${CHEST_SVG}<i class="cs-flash"></i><i class="cs-sp">${[...Array(8)].map((_, k) => `<i style="--a:${k * 45 + 22}deg"></i>`).join('')}</i></div></div><small class="cs-tap">Dokun → aç</small></div>
    <div class="cs-foot">${v ? '<button id="csUse" class="btn primary cbtn"><span>Trenine tak</span></button>' : ''}<small class="cs-go">Devam için dokun</small></div></div>`;
  $('app').appendChild(el);
  // kapalı sandık ekranın ortasında durur, açılınca yerine iner; ödül sandığın ağzından kendi yerine uçar
  const col = el.firstChild, box = el.querySelector('.cs-box'), rw = el.querySelector('.cs-rw');
  el.style.setProperty('--fly', `${box.offsetTop + box.offsetHeight * .52 - rw.offsetTop - rw.offsetHeight / 2}px`);
  if (!calm) el.style.setProperty('--up', `${col.offsetHeight / 2 - box.offsetTop - box.offsetHeight / 2}px`);
  requestAnimationFrame(() => el.classList.add('in'));
  let st = 0;   // 0 kapalı · 1 açılıyor · 2 ödül göründü
  const t0 = performance.now();
  if (!calm) setTimeout(() => { if (!st) { tone(note(0) / 2, .12, .05, 'triangle'); haptic(); } }, 380);   // yere iniş
  const open = () => {
    st = 1; el.classList.add('tap'); haptic();
    if (!calm) [0, 2, 4].forEach((k, j) => tone(note(k), .12, .03, 'sine', j * .1));
    setTimeout(() => {
      el.classList.add('open'); haptic(r.tier === 'e' ? 'win' : 'heavy');
      (r.tier === 'e' ? [0, 4, 7, 12] : r.tier === 'r' ? [0, 4, 7] : [0, 4]).forEach((q, j) => tone(note(q + 3), .35, .045, 'sine', .06 + j * .08));
      setTimeout(() => { st = 2; el.classList.add('done'); }, calm ? 450 : 1300);
    }, calm ? 0 : 360);
  };
  const close = () => { st = 3; el.id = ''; el.classList.remove('in'); setTimeout(() => el.remove(), 320); chestSheet(); };
  el.onclick = e => {
    if (e.target.closest('#csUse')) { save.train = r.id; persist(); applyLivery(); haptic('heavy'); tone(note(7), .25, .045); return close(); }
    if (!st && performance.now() - t0 > (calm ? 250 : 420)) open(); else if (st === 2) close();
  };
  howBack = () => !st ? open() : st === 2 && close();   // Android geri tuşu: dokunmakla aynı
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
  const col = lineCol(0);
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
// arka plan ↔ ön plan: süre ve ses durur. İki kaynak (ikisi birden gelebilir, iş tekrarı zararsız): visibilitychange ve Capacitor appStateChange
function front(on) {
  if (!on) { pause(); ac?.suspend?.(); Remind.plan(); return; }
  ac?.resume?.(); dayTick();
  if (active('game') && !(modalOpen() && mLocked)) resume();   // kural kartı açıkken süre durgun kalır (Anladım'la akar)
  if (active('home')) { refreshHome(); setTimeout(maybeRescue, 600); }
}
document.addEventListener('visibilitychange', () => front(!document.hidden));
// Android geri tuşu: pencere → kapat, oyun/harita → ana sayfa, ana sayfa → arka plana al
const App = window.Capacitor?.Plugins?.App;
App?.addListener?.('appStateChange', s => front(!!s?.isActive));
App?.addListener?.('backButton', () => {
  if (modalOpen() && howBack) howBack();
  else if (modalOpen()) { if (mLocked) show('home'); closeModal(); }
  else if (G?.won && active('game')) show('home');
  else if (!active('home')) show('home');
  else App.minimizeApp?.();
});

// ---------- kural eklentileri: www/rules/*.js (M9+ yeni kurallar). Ayrıntı: docs/kurallar/README.md ----------
const API = {
  N, E, S, W, DIRS, FOG_R, PAIR_COLS, rot, unrot, popc, nb, ob, tree, hashStr, rgba, shade, lum, hueRot, okl, oklch,
  toast, tone, note, haptic, persist, kick, burst, rrp, rr, railPath, ease, back, anim, press, lineName, difficulty, lit,
  get G() { return G; }, get pal() { return pal; }, get save() { return save; }, get geo() { return geo; }, get vg() { return vg; }, get cx() { return cx; },
};
loadRules(API);
// robot için: eklenti birimlerini çözüme getiren dokunuşlar (birimin görünen, sabitlenmemiş ilk karosuna)
function plan() {
  const out = [];
  (G?.units || []).forEach(U => {
    const i = U.cells.find(c => G.seen[c] && !G.fixed[c]); if (i == null) return;
    for (let k = unitTaps(U, G.cur, G.sol); k > 0; k--) out.push(i);
  });
  return out;
}
// "her şey açık" test sürümü: bütün temalar ve tren kaplamaları sende; bol 👑 (sandık için), 💡 ve 🛡 (bir kez verilir)
if (TEST && !save.testOpen) {
  save.testOpen = 1; SKINS.forEach(k => { save.owned[k.id] = 1; }); save.trains = Object.fromEntries(LIVERIES.map(v => [v.id, 1]));
  save.cc = (save.cc || 0) + 999; save.hints = Math.max(save.hints, 99); save.shield = SHIELD_MAX; persist();
}
document.body.classList.toggle('test', TEST);
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
window.__ray = { plan, MODS, rulesFor, nb, tree, unitTaps, generate, lit, rot, limits, sizeFor, puzzleFor, dailyFor, difficulty, lineStart, zPct, dPct, lineCol, lineName, warnFor, okl, SKINS, music: () => Music.state(), get G() { return G; }, get geo() { return geo; } };
})();
