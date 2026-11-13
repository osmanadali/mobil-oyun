(() => {
'use strict';
const $ = s => document.querySelector(s);
const COLORS = ['', '#ff6a3d', '#ff7ad9', '#7dff6a', '#e8d7ff', '#6ab7ff', '#5ff2ff', '#ffae3d', '#ff5a5a', '#fff36a'];
const NAMES = ['', ...T('names')];
const DIFF_TR = { kolay: T('kolay'), orta: T('orta'), zor: T('zor') };
const img = n => `img/c${n}.png`, dig = n => `img/d${n}.png`;
const store = {
  get(k, d) { try { const v = localStorage.getItem('bsudoku_' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('bsudoku_' + k, JSON.stringify(v)); } catch {} }
};

// ---------- SES (WebAudio, dosya yok) ----------
let ac = null, soundOn = store.get('sound', true), musicOn = store.get('music', true);
// Arka plan müziği (ElevenLabs, 60 sn kusursuz döngü) — WebAudio ile boşluksuz döner
let musicBuf = null, musicSrc = null, musicGain = null, musicLoading = false;
function ensureAc() { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); return ac; }
function startMusic() {
  if (!musicOn || !soundOn || musicSrc) return;
  try { ensureAc(); } catch { return; }
  if (!musicBuf) {
    if (musicLoading) return; musicLoading = true;
    fetch('sfx/music.mp3').then(r => r.ok ? r.arrayBuffer() : Promise.reject()).then(b => new Promise((ok, no) => ac.decodeAudioData(b, ok, no)))
      .then(buf => { musicBuf = buf; startMusic(); }).catch(() => {}).finally(() => { musicLoading = false; });
    return;
  }
  musicGain = ac.createGain(); musicGain.gain.setValueAtTime(0, ac.currentTime); musicGain.gain.linearRampToValueAtTime(.32, ac.currentTime + 2.5);
  musicSrc = ac.createBufferSource(); musicSrc.buffer = musicBuf; musicSrc.loop = true;
  musicSrc.connect(musicGain).connect(ac.destination); musicSrc.start();
}
function stopMusic() {
  if (!musicSrc) return;
  const s = musicSrc, g = musicGain; musicSrc = null;
  try { g.gain.setTargetAtTime(0, ac.currentTime, .25); s.stop(ac.currentTime + 1.2); } catch {}
}
const SCALE = [0, 261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784];
const WAVES = ['', 'sawtooth', 'sine', 'square', 'triangle', 'sine', 'triangle', 'sawtooth', 'square', 'sine'];
function tone(f, t0, dur, type = 'sine', vol = .12) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0);
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + .01); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
  o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + dur + .02);
  return o;
}
// ElevenLabs ile üretilmiş efektler (sfx/*.mp3); yüklenmeden önce veya hata olursa sentez sese düşer
const SFX_KEYS = ['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9', 'clear', 'bad', 'line', 'win', 'hint'];
const buffers = {}, VOL = { win: .9, line: .8, bad: .7, clear: .6, hint: .8 };
let sfxLoading = false, lastNum = null;
function loadSfx() {
  if (sfxLoading) return; sfxLoading = true;
  SFX_KEYS.forEach(k => fetch(`sfx/${k}.mp3`).then(r => r.ok ? r.arrayBuffer() : Promise.reject())
    .then(b => new Promise((ok, no) => ac.decodeAudioData(b, ok, no))).then(buf => { buffers[k] = buf; }).catch(() => {}));
}
function playBuf(key, isNum) {
  const buf = buffers[key]; if (!buf) return false;
  if (isNum && lastNum) { try { lastNum.g.gain.setTargetAtTime(0, ac.currentTime, .03); lastNum.s.stop(ac.currentTime + .15); } catch {} }
  const s = ac.createBufferSource(), g = ac.createGain();
  s.buffer = buf; s.playbackRate.value = isNum ? .96 + Math.random() * .08 : 1;
  g.gain.value = VOL[key] || .75;
  s.connect(g).connect(ac.destination); s.start();
  if (isNum) lastNum = { s, g };
  return true;
}
function sfx(kind, n = 1) {
  if (!soundOn) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    loadSfx();
    if (kind !== 'tap' && playBuf(kind === 'num' ? 'n' + n : kind, kind === 'num')) return;
    const t = ac.currentTime;
    if (kind === 'num') {
      const f = SCALE[n];
      const o = tone(f, t, .35, WAVES[n], n === 1 || n === 7 || n === 3 || n === 8 ? .05 : .12);
      if (n === 2 || n === 9) tone(f * 2, t + .06, .3, 'sine', .06);
      if (n === 4) { tone(f * 1.25, t + .05, .3, 'triangle', .07); tone(f * 1.5, t + .1, .3, 'triangle', .07); }
      if (n === 5) o.frequency.exponentialRampToValueAtTime(f * 2, t + .3);
      if (n === 7) o.frequency.exponentialRampToValueAtTime(f * 1.5, t + .25);
      if (n === 3) o.frequency.exponentialRampToValueAtTime(f * .6, t + .3);
      if (n === 6) tone(f * 3, t, .5, 'sine', .04);
    } else if (kind === 'clear') { const o = tone(300, t, .2, 'triangle', .08); o.frequency.exponentialRampToValueAtTime(90, t + .2); }
    else if (kind === 'bad') { tone(140, t, .3, 'sawtooth', .08); tone(110, t + .12, .35, 'sawtooth', .08); }
    else if (kind === 'line') [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * .07, .3, 'triangle', .09));
    else if (kind === 'win') [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * .12, .5, 'triangle', .1));
    else if (kind === 'hint') [880, 1175, 1568].forEach((f, i) => tone(f, t + i * .05, .4, 'sine', .07));
    else if (kind === 'tap') tone(660, t, .06, 'sine', .04);
  } catch {}
}
// Titreşim: iOS'ta navigator.vibrate yok → Capacitor Haptics; web/Android'de vibrate
const buzz = ms => {
  try {
    const H = window.Capacitor?.Plugins?.Haptics;
    if (H) return Array.isArray(ms) ? H.notification({ type: ms.length > 3 ? 'SUCCESS' : 'ERROR' }) : H.impact({ style: ms > 26 ? 'MEDIUM' : 'LIGHT' });
    navigator.vibrate && navigator.vibrate(ms);
  } catch {}
};

// ---------- PARÇACIK EFEKTLERİ ----------
const cv = $('#fx'), cx = cv.getContext('2d');
let parts = [], dpr = 1, raf = 0;
function resize() { dpr = Math.min(2, devicePixelRatio || 1); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; }
addEventListener('resize', resize); resize();
const R = (a, b) => a + Math.random() * (b - a);
function add(p) { if (parts.length > 900) parts.shift(); parts.push(Object.assign({ life: 1, decay: .02, g: 0, drag: .98, size: 4, rot: 0, vr: 0, shape: 'dot' }, p)); if (!raf) raf = requestAnimationFrame(loop); }
function star(x, y, r, pts = 5) {
  cx.beginPath();
  for (let i = 0; i < pts * 2; i++) { const a = i * Math.PI / pts - Math.PI / 2, rr = i % 2 ? r * .45 : r; cx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  cx.closePath(); cx.fill();
}
function loop() {
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cx.clearRect(0, 0, innerWidth, innerHeight);
  cx.globalCompositeOperation = 'lighter';
  parts = parts.filter(p => p.life > 0);
  for (const p of parts) {
    p.vx *= p.drag; p.vy = p.vy * p.drag + p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= p.decay;
    if (p.spin) { p.ang += p.spin; p.rad += p.grow; p.x = p.cx0 + Math.cos(p.ang) * p.rad; p.y = p.cy0 + Math.sin(p.ang) * p.rad; }
    if (p.floor && p.y > p.floor) { p.y = p.floor; p.vy *= -.55; }
    const a = Math.max(0, p.life);
    cx.globalAlpha = p.twinkle ? a * (.5 + .5 * Math.sin(p.life * 40)) : a;
    cx.fillStyle = p.hue != null ? `hsl(${p.hue + (1 - p.life) * 200},100%,65%)` : p.col;
    const s = p.size * (p.shrink ? a : 1);
    cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot);
    if (p.shape === 'star') star(0, 0, s);
    else if (p.shape === 'shard') { cx.beginPath(); cx.moveTo(0, -s * 1.8); cx.lineTo(s * .6, 0); cx.lineTo(0, s * 1.8); cx.lineTo(-s * .6, 0); cx.fill(); }
    else if (p.shape === 'ring') { cx.strokeStyle = p.col; cx.lineWidth = 3 * a; cx.beginPath(); cx.arc(0, 0, p.size * (2 - a) * 2, 0, 7); cx.stroke(); }
    else if (p.shape === 'rune') { cx.font = `bold ${s * 3}px serif`; cx.textAlign = 'center'; cx.fillText(p.ch, 0, s); }
    else if (p.shape === 'feather') { cx.beginPath(); cx.ellipse(0, 0, s * .5, s * 1.6, 0, 0, 7); cx.fill(); }
    else { cx.beginPath(); cx.arc(0, 0, s, 0, 7); cx.fill(); }
    cx.restore();
  }
  cx.globalAlpha = 1;
  raf = parts.length ? requestAnimationFrame(loop) : (cx.clearRect(0, 0, innerWidth, innerHeight), 0);
}
// Her rakamın kendi büyüsü
const SPELLS = {
  1(x, y) { for (let i = 0; i < 26; i++) add({ x: x + R(-12, 12), y: y + R(-6, 10), vx: R(-1.5, 1.5), vy: R(-5, -1.5), g: -.04, col: ['#ff3d00', '#ff9a00', '#ffd000'][i % 3], size: R(2, 5), decay: R(.02, .04), shrink: 1 }); },
  2(x, y) { for (let i = 0; i < 22; i++) add({ x, y, vx: R(-3, 3), vy: R(-3, 2), drag: .95, col: i % 2 ? '#ff9aea' : '#fff', size: R(2, 4), shape: 'star', decay: .015, twinkle: 1, vr: .1 }); },
  3(x, y) { for (let i = 0; i < 14; i++) add({ x, y, vx: R(-3.5, 3.5), vy: R(-6, -2), g: .35, floor: y + 22, col: '#6dff5a', size: R(3, 7), decay: .02 }); },
  4(x, y) { for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283; add({ x, y, vx: Math.cos(a) * 4, vy: Math.sin(a) * 4, drag: .93, hue: i * 20, size: 5, shape: 'star', decay: .022, vr: .2 }); } },
  5(x, y) { const runes = 'ᚠᚢᚦᚨᚱᚲᚷᚹ'; for (let i = 0; i < 8; i++) add({ cx0: x, cy0: y, x, y, vx: 0, vy: 0, spin: .15, ang: i * .785, rad: 4, grow: 1.3, col: '#8fd0ff', size: 5, shape: 'rune', ch: runes[i], decay: .02 }); },
  6(x, y) { for (let i = 0; i < 16; i++) { const a = R(0, 6.283), s = R(4, 9); add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, drag: .88, col: i % 2 ? '#5ff2ff' : '#c9fbff', size: R(3, 5), shape: 'shard', rot: a + 1.57, decay: .03 }); } },
  7(x, y) { for (let i = 0; i < 24; i++) add({ x: x + R(-8, 8), y: y + 10, vx: R(-2.5, 2.5), vy: R(-7, -3), g: .05, col: ['#ff4500', '#ffae3d', '#ffe066'][i % 3], size: R(2, 4), shape: i % 3 ? 'dot' : 'feather', rot: R(-.6, .6), vr: R(-.1, .1), decay: .022, shrink: 1 }); },
  8(x, y) { add({ x, y, vx: 0, vy: 0, col: '#ff5a5a', size: 10, shape: 'ring', decay: .035 }); add({ x, y, vx: 0, vy: 0, col: '#fff', size: 6, shape: 'ring', decay: .025 });
    for (let i = 0; i < 18; i++) add({ x, y, vx: R(-2, 2), vy: R(-3, 1), g: -.02, drag: .97, col: i % 2 ? '#fff' : '#ffb3b3', size: R(1.5, 3), decay: .012, twinkle: 1 }); },
  9(x, y) { for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; add({ x, y, vx: Math.cos(a) * 6, vy: Math.sin(a) * 6, drag: .9, col: '#fff36a', size: 7, shape: 'star', decay: .02, vr: .15 }); }
    for (let i = 0; i < 20; i++) add({ x, y, vx: R(-1, 1), vy: R(-1, 1), col: '#fff', size: R(1, 2.5), decay: .01, twinkle: 1 }); },
};
function confetti(n = 160) {
  for (let i = 0; i < n; i++) add({ x: R(0, innerWidth), y: R(-80, -10), vx: R(-2, 2), vy: R(1, 4), g: .05, drag: .99, hue: R(0, 360), size: R(3, 7), shape: i % 3 ? 'shard' : 'star', vr: R(-.2, .2), decay: R(.004, .008) });
}
function firework() {
  const x = R(innerWidth * .15, innerWidth * .85), y = R(innerHeight * .1, innerHeight * .45), h = R(0, 360);
  for (let i = 0; i < 50; i++) { const a = i / 50 * 6.283, s = R(2, 6); add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: .06, drag: .96, col: `hsl(${h},100%,65%)`, size: 2.5, decay: .014, shrink: 1 }); }
}

// ---------- OYUN DURUMU ----------
const board = $('#board');
let S = null, cells = [], sel = -1, timerId = 0;
let view = store.get('view', 'creature');
const pending = new Map(); // hücre -> değerlendirme zamanlayıcısı

let adBusy = false;
async function newGame(diff) {
  if (adBusy) return;
  if (S && S.over && store.get('fin', 0) > 2 && window.Ads) {
    adBusy = true; stopMusic();
    try { await Ads.interstitial(); } catch {}
    adBusy = false; startMusic();
  }
  const { puzzle, solution } = Sudoku.generate(diff);
  S = { diff, puzzle, solution, vals: puzzle.slice(), given: puzzle.map(v => !!v), hist: [], miss: 0, hints: 3, time: 0, judged: puzzle.slice(), over: false };
  save(); startGame(true);
}
function save() { if (S && !S.over) store.set('cur', S); else store.set('cur', null); }

function buildBoard() {
  board.innerHTML = ''; cells = [];
  board.className = 'view-' + view;
  for (let i = 0; i < 81; i++) {
    const r = i / 9 | 0, c = i % 9, d = document.createElement('div');
    d.className = 'cell' + (c % 3 === 2 && c < 8 ? ' br' : '') + (r % 3 === 2 && r < 8 ? ' bb' : '');
    d.style.setProperty('--d', (r + c));
    d.innerHTML = '<div class="v"></div>';
    board.appendChild(d); cells.push(d);
  }
}
function paint(i) {
  const v = S.vals[i], d = cells[i];
  d.classList.toggle('given', S.given[i]);
  d.style.setProperty('--col', COLORS[v] || 'transparent');
  d.firstChild.innerHTML = v ? `<img class="cr" src="${img(v)}" alt=""><img class="dg" src="${dig(v)}" alt="${v}">` : '';
}
function paintAll() { for (let i = 0; i < 81; i++) paint(i); highlight(); legend(); hearts(); $('#hintCount').textContent = S.hints; }
function highlight() {
  const v = sel >= 0 ? S.vals[sel] : 0, sr = sel / 9 | 0, sc = sel % 9;
  cells.forEach((d, i) => {
    const r = i / 9 | 0, c = i % 9;
    const peer = sel >= 0 && (r === sr || c === sc || ((r / 3 | 0) === (sr / 3 | 0) && (c / 3 | 0) === (sc / 3 | 0)));
    d.classList.toggle('sel', i === sel);
    d.classList.toggle('peer', peer && i !== sel);
    d.classList.toggle('same', !!v && S.vals[i] === v && i !== sel);
  });
}
function legend() {
  const L = $('#legend');
  if (!L.children.length) for (let n = 1; n <= 9; n++) L.insertAdjacentHTML('beforeend', `<div class="lg" data-n="${n}"><img src="${img(n)}" alt=""><img class="ld" src="${dig(n)}" alt="${n}"><i></i></div>`);
  for (let n = 1; n <= 9; n++) {
    const left = 9 - S.vals.filter((v, i) => v === n && v === S.solution[i]).length;
    const el = L.children[n - 1]; el.querySelector('i').textContent = left || '';
    el.classList.toggle('done', left === 0);
  }
}
function hearts() { $('#hearts').innerHTML = [0, 1, 2].map(k => `<img src="img/i_heart.png" class="${k < S.miss ? 'lost' : ''}" alt="">`).join(''); }

function replay(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
function centerOf(i) { const b = cells[i].getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }

function setVal(i, v, anim = true) {
  const d = cells[i];
  for (let k = 0; k <= 9; k++) d.classList.remove('a' + k);
  if (!v && S.vals[i]) { S.vals[i] = 0; d.classList.add('a0'); sfx('clear'); setTimeout(() => { if (!S.vals[i]) paint(i); }, 330); }
  else { S.vals[i] = v; paint(i); }
  d.classList.remove('bad');
  if (v && anim) {
    void d.offsetWidth; d.classList.add('a' + v); replay(d, 'flash');
    const [x, y] = centerOf(i); SPELLS[v](x, y);
    sfx('num', v); buzz(8 + v * 2);
    toast(NAMES[v], 600);
  }
  highlight();
}

function tapCell(i) {
  if (S.over) return;
  sel = i;
  if (S.given[i]) { highlight(); sfx('tap'); const v = S.vals[i]; replay(cells[i], 'a' + v); const [x, y] = centerOf(i); SPELLS[v](x, y); return; }
  if (!pending.has(i)) S.hist.push({ i, prev: S.vals[i] });
  setVal(i, (S.vals[i] + 1) % 10);
  schedule(i);
}
function schedule(i) {
  clearTimeout(pending.get(i));
  pending.set(i, setTimeout(() => { pending.delete(i); judge(i); }, 1000));
}
function judge(i) {
  const v = S.vals[i];
  save(); legend();
  if (!v || v === S.judged[i]) return;
  S.judged[i] = v;
  if (v !== S.solution[i]) {
    S.miss++; cells[i].classList.add('bad'); sfx('bad'); buzz([40, 40, 60]);
    replay(document.body, 'shake'); hearts(); toast(T('wrong'));
    if (S.miss >= 3) return lose();
    save(); return;
  }
  checkGroups(i);
  if (S.vals.every((x, k) => x === S.solution[k])) win();
}
function groupDone(idx) { return idx.every(k => S.vals[k] === S.solution[k]); }
function checkGroups(i) {
  const r = i / 9 | 0, c = i % 9, br = r - r % 3, bc = c - c % 3;
  const row = [...Array(9)].map((_, k) => r * 9 + k), col = [...Array(9)].map((_, k) => k * 9 + c);
  const box = [...Array(9)].map((_, k) => (br + (k / 3 | 0)) * 9 + bc + k % 3);
  let any = false;
  for (const g of [row, col, box]) if (groupDone(g)) {
    any = true;
    g.forEach(k => { const d = cells[k]; d.style.setProperty('--w', Math.abs((k / 9 | 0) - r) + Math.abs(k % 9 - c)); replay(d, 'wave'); });
    g.forEach((k, j) => setTimeout(() => { const [x, y] = centerOf(k); SPELLS[S.vals[k]](x, y); }, j * 55));
  }
  if (any) { sfx('line'); buzz(30); toast(T('praise')[Math.random() * 4 | 0]); }
  const n = S.vals[i];
  if (S.vals.filter((v, k) => v === n && v === S.solution[k]).length === 9) replay($('#legend').children[n - 1], 'pulse');
}

function undo() {
  const h = S.hist.pop(); if (!h) return toast(T('noUndo'));
  clearTimeout(pending.get(h.i)); pending.delete(h.i);
  sel = h.i; setVal(h.i, h.prev); S.judged[h.i] = h.prev; save(); legend();
}
function clearSel() {
  if (sel < 0 || S.given[sel] || !S.vals[sel]) return;
  S.hist.push({ i: sel, prev: S.vals[sel] }); setVal(sel, 0); S.judged[sel] = 0; save(); legend();
}
function hint() {
  if (!S.hints) return askReward();
  let i = sel >= 0 && !S.given[sel] && S.vals[sel] !== S.solution[sel] ? sel : -1;
  if (i < 0) { const empty = S.vals.map((v, k) => v !== S.solution[k] ? k : -1).filter(k => k >= 0); if (!empty.length) return; i = empty[Math.random() * empty.length | 0]; }
  S.hints--; $('#hintCount').textContent = S.hints;
  clearTimeout(pending.get(i)); pending.delete(i);
  sel = i; S.given[i] = true; S.judged[i] = S.solution[i];
  setVal(i, S.solution[i]); replay(cells[i], 'hinted'); sfx('hint');
  const [x, y] = centerOf(i); SPELLS[4](x, y);
  checkGroups(i); save(); legend();
  if (S.vals.every((x, k) => x === S.solution[k])) win();
}

// ---------- AKIŞ ----------
function show(id) {
  const cur = document.querySelector('.screen.active');
  if (cur && cur.id !== id) { cur.classList.add('leave'); cur.classList.remove('active'); setTimeout(() => cur.classList.remove('leave'), 700); }
  $('#' + id).classList.add('active');
}
function fmt(t) { return String(t / 60 | 0).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); }
function startGame(fresh) {
  buildBoard(); sel = -1; pending.clear();
  $('#diffLabel').textContent = DIFF_TR[S.diff];
  $('#legend').innerHTML = '';
  paintAll(); show('game');
  board.classList.remove('enter'); void board.offsetWidth; board.classList.add('enter');
  setTimeout(() => board.classList.remove('enter'), 2000);
  clearInterval(timerId);
  $('#timer').textContent = fmt(S.time);
  timerId = setInterval(() => { if (!document.hidden && !S.over) { S.time++; $('#timer').textContent = fmt(S.time); if (S.time % 10 === 0) save(); } }, 1000);
}
function finish(won) {
  S.over = true; clearInterval(timerId); save();
  store.set('fin', store.get('fin', 0) + 1);
  window.Ads?.warm();   // sakin an: sonraki reklamı şimdi yükle
  const st = store.get('stats', { won: 0, best: {} });
  if (won) { st.won++; if (!st.best[S.diff] || S.time < st.best[S.diff]) st.best[S.diff] = S.time; store.set('stats', st); }
  const stars = won ? 3 - Math.min(2, S.miss) : 0;
  $('#win h2').textContent = T(won ? 'winT' : 'loseT');
  $('#win .crown').innerHTML = `<img src="${img(won ? 3 : 5)}" alt="">`; $('#win .crown').classList.toggle('sad', !won);
  $('#winText').textContent = won ? T('winTxt', DIFF_TR[S.diff], fmt(S.time), S.miss) : T('loseTxt');
  $('#winStars').innerHTML = [0, 1, 2].map(k => `<img src="img/i_star.png" class="${k < stars ? '' : 'off'}" alt="">`).join('');
  renderStats();
}
function win() {
  finish(true); sfx('win'); buzz([50, 50, 50, 50, 120]);
  // kutucuklar sırayla kutlama
  cells.forEach((d, k) => { d.style.setProperty('--w', (k / 9 | 0) + k % 9); replay(d, 'wave'); });
  for (let k = 0; k < 9; k++) setTimeout(() => { const i = k * 10; const [x, y] = centerOf(i); SPELLS[S.vals[i]](x, y); }, k * 90);
  setTimeout(() => { confetti(); show('win'); }, 1300);
  let f = 0; const fw = setInterval(() => { firework(); if (++f > 8) clearInterval(fw); }, 450);
}
function lose() { finish(false); setTimeout(() => show('win'), 900); }

function toast(t, ms = 1100) {
  const el = $('#toast'); el.textContent = t; el.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), ms);
}
function renderStats() {
  const st = store.get('stats', { won: 0, best: {} });
  const b = Object.entries(st.best).map(([k, v]) => `${DIFF_TR[k]} ${fmt(v)}`).join(' · ');
  $('#stats').innerHTML = st.won ? T('won', st.won) + (b ? '<br>' + T('best') + b : '') : '';
  $('#privacyBtn').hidden = !window.Ads?.privacy();
  const cur = store.get('cur', null);
  $('#continueBtn').hidden = !(cur && !cur.over);
}

// ---------- GİRDİ ----------
let pressT = 0, longFired = false;
board.addEventListener('pointerdown', e => {
  const d = e.target.closest('.cell'); if (!d) return;
  const i = cells.indexOf(d); longFired = false;
  clearTimeout(pressT);
  pressT = setTimeout(() => { if (!S.given[i] && S.vals[i]) { longFired = true; sel = i; clearSel(); buzz(25); } }, 480);
});
board.addEventListener('pointerup', e => {
  clearTimeout(pressT);
  const d = e.target.closest('.cell'); if (!d || longFired) return;
  tapCell(cells.indexOf(d));
});
board.addEventListener('pointerleave', () => clearTimeout(pressT));
board.addEventListener('contextmenu', e => e.preventDefault());
addEventListener('keydown', e => {
  if (!$('#game').classList.contains('active') || sel < 0 || S.given[sel] || S.over) return;
  const n = +e.key;
  if (n >= 1 && n <= 9) { if (!pending.has(sel)) S.hist.push({ i: sel, prev: S.vals[sel] }); setVal(sel, n); schedule(sel); }
  else if (e.key === 'Backspace' || e.key === 'Delete') clearSel();
});

document.querySelectorAll('[data-diff]').forEach(b => b.onclick = () => { sfx('hint'); newGame(b.dataset.diff); });
$('#continueBtn').onclick = () => { S = store.get('cur'); sfx('hint'); startGame(false); };
$('#backBtn').onclick = () => { save(); clearInterval(timerId); renderStats(); show('menu'); };
$('#againBtn').onclick = () => newGame(S.diff);
$('#menuBtn').onclick = () => { renderStats(); show('menu'); };
$('#undoBtn').onclick = undo;
$('#clearBtn').onclick = clearSel;
$('#hintBtn').onclick = hint;
$('#viewBtn').onclick = () => { view = view === 'creature' ? 'number' : 'creature'; store.set('view', view); board.className = 'view-' + view; toast(T(view === 'creature' ? 'viewC' : 'viewN')); };
// Ses düğmesi: Ses+Müzik → Efekt → Kapalı
const soundIcon = () => {
  $('#soundImg').src = soundOn ? 'img/i_sound.png' : 'img/i_mute.png';
  $('#soundBtn span').textContent = T(!soundOn ? 'off' : musicOn ? 'music' : 'sfx');
};
$('#soundBtn').onclick = () => {
  if (soundOn && musicOn) { musicOn = false; stopMusic(); toast(T('sfxOnly')); }
  else if (soundOn) { soundOn = false; toast(T('soundOff')); }
  else { soundOn = true; musicOn = true; startMusic(); toast(T('musicOn')); }
  store.set('sound', soundOn); store.set('music', musicOn); soundIcon();
};
$('#howBtn').onclick = () => $('#howModal').hidden = false;
$('#howClose').onclick = () => $('#howModal').hidden = true;
soundIcon();
// iOS sesi yalnızca kullanıcı hareketinde açar: ilk dokunuş/tıklamada kilidi aç
function warm() {
  if (!soundOn) return;
  try { ensureAc(); loadSfx(); startMusic(); } catch {}
  if (ac && ac.state === 'running') ['pointerdown', 'touchend', 'click'].forEach(e => removeEventListener(e, warm, true));
}
['pointerdown', 'touchend', 'click'].forEach(e => addEventListener(e, warm, true));
document.addEventListener('visibilitychange', () => { if (!ac) return; document.hidden ? ac.suspend() : ac.resume(); });

// menü süsleri
$('#logoCreatures').innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<img src="${img(n)}" style="animation-delay:${n * .12}s" alt="">`).join('');
$('#logoCreatures').onclick = e => { const im = e.target.closest('img'); if (!im) return; const n = [...im.parentNode.children].indexOf(im) + 1; const b = im.getBoundingClientRect(); SPELLS[n](b.left + b.width / 2, b.top + b.height / 2); sfx('num', n); };
// --- Ödüllü reklam: ipucu bitince +2 ---
function askReward() {
  if (!window.Ads?.online()) return toast(T('noHint'));
  $('#adModal').hidden = false;
}
$('#adCancel').onclick = () => { $('#adModal').hidden = true; };
$('#adWatch').onclick = async () => {
  $('#adModal').hidden = true; stopMusic();
  const r = await Ads.rewarded();
  startMusic();
  if (r === 'earned') { S.hints += 2; $('#hintCount').textContent = S.hints; save(); sfx('hint'); toast(T('gotHints')); }
  else if (r === 'nofill') toast(T('noAd'));
};
$('#privacyBtn').onclick = () => Ads.privacyForm().then(renderStats);
// --- Dil seçici ---
const langSel = $('#langSel');
langSel.innerHTML = LANGS.map(([k, n]) => `<option value="${k}"${k === LANG ? ' selected' : ''}>${n}</option>`).join('');
langSel.onchange = () => setLang(langSel.value);
window.__rayCalm = () => !$('#game').classList.contains('active');   // ads.js: oyun oynanırken reklam yüklenmesin
applyI18n(); soundIcon();
renderStats();
setTimeout(() => window.Ads?.init().then(renderStats), 400);   // rıza + (iOS) izleme izni + reklam başlatma
if (!store.get('seenHow', false)) { $('#howModal').hidden = false; store.set('seenHow', true); }
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
})();
