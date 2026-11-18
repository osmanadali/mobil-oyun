// Fiske Arena — arayüz, çizim, dokunma, ses. Oyun kuralları physics.js'de.
import { ARENAS, PR, DT, MAX_STEPS, MAX_TURNS, newGame, shoot, step, endTurn, moving, aliveOf, maxV, arenaById } from './physics.js';
import { botShot, LEVELS } from './bot.js';

const $ = id => document.getElementById(id);
const cv = $('c'), ctx = cv.getContext('2d');
const COL = ['#36c9c0', '#ff7a66'], COL_D = ['#1c8a84', '#c24a39'];
const PULL = 70;                       // tam güç için çekme mesafesi (dünya birimi)
const store = {
  get(k, d) { try { const v = localStorage.getItem('fiske.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('fiske.' + k, JSON.stringify(v)); } catch { } },
};

const cfg = { mode: store.get('mode', 'bot'), lvl: store.get('lvl', 'orta'), arena: store.get('arena', 'rastgele') };
let S = null, aim = null, acc = 0, steps = 0, botTimer = 0, last = 0, sound = store.get('snd', true);
let series = [0, 0], nextFirst = 0, shotFalls = [];
const view = { s: 1, ox: 0, oy: 0, dpr: 1 };
const fx = { parts: [], falls: [], trails: {}, shake: 0, flash: {} };

const names = () => cfg.mode === 'bot' ? ['Sen', 'Bot · ' + LEVELS[cfg.lvl].ad] : ['Turkuaz', 'Mercan'];
const botTurn = () => S && cfg.mode === 'bot' && S.turn === 1;

// ---------- menü ----------
function seg(id, key, onPick) {
  const el = $(id);
  const mark = () => el.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === cfg[key]));
  el.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; cfg[key] = b.dataset.v; store.set(key, cfg[key]); mark(); onPick && onPick(); });
  mark();
}
$('sArena').innerHTML = `<button data-v="rastgele">Rastgele</button>` + ARENAS.map(a => `<button data-v="${a.id}">${a.ad}</button>`).join('');
seg('sMode', 'mode', () => $('gLvl').hidden = cfg.mode !== 'bot');
seg('sLvl', 'lvl'); seg('sArena', 'arena');
$('gLvl').hidden = cfg.mode !== 'bot';
$('bPlay').onclick = () => { series = [0, 0]; nextFirst = 0; start(); };
$('bAgain').onclick = () => start();
$('bHome').onclick = () => { $('over').hidden = true; $('hud').hidden = true; $('menu').hidden = false; S = null; };
$('bMenu').onclick = () => { if (S && S.winner === null && !confirm('Maçtan çıkılsın mı?')) return; clearTimeout(botTimer); S = null; aim = null; $('hud').hidden = true; $('menu').hidden = false; };
const sndIcon = () => $('bSnd').textContent = sound ? '🔊' : '🔈';
$('bSnd').onclick = () => { sound = !sound; store.set('snd', sound); sndIcon(); };
sndIcon();

function start() {
  clearTimeout(botTimer);
  const id = cfg.arena === 'rastgele' ? ARENAS[Math.random() * ARENAS.length | 0].id : cfg.arena;
  S = newGame(id, nextFirst);
  aim = null; acc = 0; steps = 0; fx.parts = []; fx.falls = []; fx.trails = {}; fx.flash = {};
  $('menu').hidden = true; $('over').hidden = true; $('hud').hidden = false;
  const N = names(); $('n0').textContent = N[0]; $('n1').textContent = N[1];
  resize(); hud();
  toast(`${S.arena.ad} · ilk atış yarım güç`);
  if (botTurn()) botPlay();
}

function hud() {
  if (!S) return;
  for (const pl of [0, 1]) {
    const n = aliveOf(S, pl).length;
    $('p' + pl).innerHTML = [0, 1, 2].map(i => `<i class="${i < n ? '' : 'x'}"></i>`).join('');
    $('bar' + pl).classList.toggle('on', S.winner === null && S.turn === pl);
  }
  $('info').textContent = S.winner !== null ? '' : `Atış ${S.n + 1}/${MAX_TURNS}${S.n === 0 ? ' · yarım güç' : ''}`;
}

let toastT = 0;
function toast(msg, ms = 1300) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms); }

// ---------- görünüm ----------
function extent(A) { return A.shape === 'circle' ? [A.r, A.r] : [A.w / 2, A.h / 2]; }
function resize() {
  const W = innerWidth, H = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = W * dpr; cv.height = H * dpr; view.dpr = dpr;
  const A = S ? S.arena : ARENAS[0], [ex, ey] = extent(A), top = 104, bot = 64, avail = H - top - bot;
  view.s = Math.min((W - 24) / (2 * ex + 22), avail / (2 * ey + 22));
  view.ox = W / 2; view.oy = top + avail / 2;
}
addEventListener('resize', resize);
const toWorld = (cx, cy) => ({ x: (cx - view.ox) / view.s, y: (cy - view.oy) / view.s });

// ---------- dokunma ----------
cv.addEventListener('pointerdown', e => {
  audio();
  if (!S || S.phase !== 'aim' || botTurn() || aim) return;
  const w = toWorld(e.clientX, e.clientY);
  let best = null, bd = (PR * 2.8) ** 2;
  for (const p of aliveOf(S, S.turn)) { const d = (p.x - w.x) ** 2 + (p.y - w.y) ** 2; if (d < bd) { bd = d; best = p; } }
  if (!best) return;
  aim = { id: best.id, px: w.x, py: w.y, pid: e.pointerId };
  cv.setPointerCapture(e.pointerId);
  buzz(8);
});
cv.addEventListener('pointermove', e => { if (aim && aim.pid === e.pointerId) { const w = toWorld(e.clientX, e.clientY); aim.px = w.x; aim.py = w.y; } });
cv.addEventListener('pointerup', e => {
  if (!aim || aim.pid !== e.pointerId) return;
  const v = aimVel(aim); aim = null;
  if (v && shoot(S, v)) begin();
});
cv.addEventListener('pointercancel', () => { if (aim && !aim.bot) aim = null; });

function aimVel(a) {
  const p = S.pucks[a.id], dx = p.x - a.px, dy = p.y - a.py, len = Math.sqrt(dx * dx + dy * dy);
  if (len < PR * 0.9) return null;           // pula geri bırakıldı: iptal
  const pw = Math.min(len, PULL) / PULL * maxV(S);
  return { id: a.id, vx: dx / len * pw, vy: dy / len * pw };
}

function begin() { acc = 0; steps = 0; shotFalls = []; hud(); $('info').textContent = ''; buzz(15); }

// ---------- bot ----------
function botPlay() {
  botTimer = setTimeout(() => {
    if (!botTurn() || S.phase !== 'aim') return;
    const sh = botShot(S, cfg.lvl), p = S.pucks[sh.id], sp = Math.sqrt(sh.vx ** 2 + sh.vy ** 2), pull = sp / maxV(S) * PULL;
    const t0 = performance.now(), D = 520;
    aim = { id: sh.id, bot: true, px: p.x, py: p.y };
    const grow = () => {
      if (!S || !aim || !aim.bot) return;
      const k = Math.min(1, (performance.now() - t0) / D), e = 1 - (1 - k) ** 3;
      aim.px = p.x - sh.vx / sp * pull * e; aim.py = p.y - sh.vy / sp * pull * e;
      if (k < 1) requestAnimationFrame(grow);
      else setTimeout(() => { if (!S || !aim) return; aim = null; if (shoot(S, sh)) begin(); }, 120);
    };
    grow();
  }, 550);
}

// ---------- döngü ----------
function frame(t) {
  const dt = Math.min((t - last) / 1000, 0.05); last = t;
  if (S && S.phase === 'moving') {
    acc += dt; const ev = [];
    // play() ile birebir aynı: en fazla MAX_STEPS adım, sonra hızlar sıfırlanır.
    while (acc >= DT && moving(S) && steps < MAX_STEPS) { step(S, ev); steps++; acc -= DT; }
    events(ev);
    for (const p of S.pucks) if (p.alive && (p.vx || p.vy)) (fx.trails[p.id] = fx.trails[p.id] || []).push({ x: p.x, y: p.y });
    if (!moving(S) || steps >= MAX_STEPS) {
      for (const p of S.pucks) { p.vx = 0; p.vy = 0; }
      const me = S.turn; endTurn(S); turnOver(me);
    }
  }
  for (const k in fx.trails) { const tr = fx.trails[k]; if (tr.length > 16 || (tr.length && !(S && S.phase === 'moving'))) tr.shift(); }
  draw(t / 1000, dt);
  requestAnimationFrame(frame);
}

function events(ev) {
  for (const e of ev) {
    if (e.t === 'hit') {
      const s = Math.min(e.s, 230);
      sfx.hit(s); burst(e.x, e.y, s > 90 ? 10 : 5, '#fff3d6', s);
      if (s > 120) { fx.shake = Math.max(fx.shake, s / 60); buzz(12); }
    } else if (e.t === 'bump') {
      sfx.bump(e.s); fx.flash[e.b] = 1; burst(e.x, e.y, 6, '#ffd166', e.s);
    } else if (e.t === 'fall') {
      fx.falls.push({ x: e.x, y: e.y, vx: e.vx, vy: e.vy, p: e.p, t: 0 });
      shotFalls.push(e.p); sfx.fall(); buzz(30);
    }
  }
}

function turnOver(shooter) {
  hud();
  const mine = shotFalls.filter(p => p === shooter).length, theirs = shotFalls.length - mine;
  const N = names();
  if (S.winner !== null) {
    if (S.winner >= 0) series[S.winner]++;
    sfx.win(cfg.mode === 'bot' ? S.winner === 0 : true);
    setTimeout(over, 1000);
    return;
  }
  if (theirs >= 2) toast(theirs === 3 ? 'Üçlü!' : 'Çifte düşüş!');
  else if (mine) toast(mine > 1 ? 'Eyvah, iki kendi pulun!' : 'Kendi pulun düştü!');
  else if (cfg.mode === 'yerel') toast(`Sıra: ${N[S.turn]}`, 900);
  if (botTurn()) botPlay();
}

function over() {
  const N = names(), w = S.winner;
  $('oT').textContent = w < 0 ? 'Berabere' : cfg.mode === 'bot' ? (w === 0 ? 'Kazandın!' : 'Kaybettin') : `${N[w]} kazandı!`;
  $('oT').style.color = w < 0 ? '' : COL[w];
  $('oS').textContent = `${S.arena.ad} · ${S.n} atış`;
  $('oScore').textContent = `Seri  ${N[0]} ${series[0]} – ${series[1]} ${N[1]}`;
  nextFirst = 1 - S.first;     // rövanşta diğeri başlar
  $('over').hidden = false;
}

// ---------- efektler ----------
function burst(x, y, n, c, s) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = 20 + Math.random() * s * 0.5;
    fx.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 0.25 + Math.random() * 0.25, c });
  }
}
const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch { } };

// ---------- çizim ----------
function shapePath(A, grow = 0) {
  ctx.beginPath();
  if (A.shape === 'circle') ctx.arc(0, 0, A.r + grow, 0, Math.PI * 2);
  else ctx.roundRect(-A.w / 2 - grow, -A.h / 2 - grow, A.w + 2 * grow, A.h + 2 * grow, 10 + grow);
}

function draw(t, dt) {
  const W = innerWidth, H = innerHeight;
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const A = S ? S.arena : null;
  if (!A) return;
  fx.shake *= Math.pow(0.002, dt);
  const sh = fx.shake > 0.2 ? fx.shake : 0;
  ctx.translate(view.ox + (Math.random() - 0.5) * sh, view.oy + (Math.random() - 0.5) * sh);
  const s = view.s;
  ctx.scale(s, s);
  ctx.lineWidth = 1 / s;

  // platform: yan yüz + gölge + üst yüz
  ctx.save(); ctx.translate(0, 7); ctx.shadowColor = '#0009'; ctx.shadowBlur = 30 * s; ctx.shadowOffsetY = 14 * s;
  shapePath(A, 2); ctx.fillStyle = '#121729'; ctx.fill(); ctx.restore();
  const g = ctx.createRadialGradient(0, -20, 10, 0, 0, 130);
  g.addColorStop(0, '#3b4669'); g.addColorStop(1, '#262e49');
  shapePath(A); ctx.fillStyle = g; ctx.fill();
  ctx.save(); shapePath(A); ctx.clip();
  ctx.strokeStyle = '#ffffff0c'; ctx.lineWidth = 1.2;
  if (A.shape === 'circle') for (let r = 25; r < A.r; r += 25) { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); }
  else for (let y = -A.h / 2 + 25; y < A.h / 2; y += 25) { ctx.beginPath(); ctx.moveTo(-A.w / 2, y); ctx.lineTo(A.w / 2, y); ctx.stroke(); }
  ctx.strokeStyle = '#ffffff1c'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(-200, 0); ctx.lineTo(200, 0); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
  shapePath(A); ctx.strokeStyle = '#6d7cab'; ctx.lineWidth = 2.2; ctx.stroke();

  for (const z of A.zones || []) {
    ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
    if (z.k === 'buz') {
      const gz = ctx.createRadialGradient(z.x - z.r * .3, z.y - z.r * .3, 2, z.x, z.y, z.r);
      gz.addColorStop(0, '#d8f4ff55'); gz.addColorStop(1, '#8fd3ff22'); ctx.fillStyle = gz; ctx.fill();
      ctx.strokeStyle = '#bfe9ff66'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.strokeStyle = '#ffffff40'; ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) { const a = i * 1.3 + 0.4, r = z.r * (0.3 + (i % 3) * 0.22); ctx.beginPath(); ctx.moveTo(z.x + Math.cos(a) * r - 5, z.y + Math.sin(a) * r); ctx.lineTo(z.x + Math.cos(a) * r + 5, z.y + Math.sin(a) * r - 3); ctx.stroke(); }
    } else {
      ctx.fillStyle = '#5a3f2acc'; ctx.fill(); ctx.strokeStyle = '#8a6440'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = '#7a5838';
      for (let i = 0; i < 9; i++) { const a = i * 2.39, r = z.r * Math.sqrt((i + .5) / 9) * .85; ctx.beginPath(); ctx.arc(z.x + Math.cos(a) * r, z.y + Math.sin(a) * r, 1.6 + (i % 3), 0, Math.PI * 2); ctx.fill(); }
    }
  }
  for (const h of A.holes || []) {
    const gh = ctx.createRadialGradient(h.x, h.y + 4, 2, h.x, h.y, h.r);
    gh.addColorStop(0, '#000'); gh.addColorStop(1, '#0b0e18');
    ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2); ctx.fillStyle = gh; ctx.fill();
    ctx.strokeStyle = '#6d7cab'; ctx.lineWidth = 2; ctx.stroke();
  }
  (A.bumpers || []).forEach((b, i) => {
    const f = fx.flash[i] || 0; fx.flash[i] = f * Math.pow(0.01, dt);
    ctx.beginPath(); ctx.arc(b.x, b.y + 2, b.r, 0, Math.PI * 2); ctx.fillStyle = '#0006'; ctx.fill();
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r * (1 + f * 0.15), 0, Math.PI * 2); ctx.fillStyle = f > .1 ? '#fff1c2' : '#ffd166'; ctx.fill();
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.55, 0, Math.PI * 2); ctx.fillStyle = '#d99a2b'; ctx.fill();
  });

  // izler
  for (const k in fx.trails) {
    const tr = fx.trails[k], p = S.pucks[k]; if (tr.length < 2) continue;
    for (let i = 1; i < tr.length; i++) {
      ctx.strokeStyle = COL[p.p] + Math.round(i / tr.length * 70).toString(16).padStart(2, '0');
      ctx.lineWidth = PR * 1.3 * i / tr.length; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(tr[i - 1].x, tr[i - 1].y); ctx.lineTo(tr[i].x, tr[i].y); ctx.stroke();
    }
  }

  // düşenler
  fx.falls = fx.falls.filter(f => f.t < 0.6);
  for (const f of fx.falls) {
    f.t += dt; f.x += f.vx * dt * 0.5; f.y += f.vy * dt * 0.5 + 40 * f.t * dt;
    const k = Math.max(0, 1 - f.t / 0.6);
    puck(f.x, f.y, f.p, 0.35 + 0.65 * k, k);
  }

  // pullar
  const myAim = S.phase === 'aim' && !botTurn();
  for (const p of S.pucks) if (p.alive) {
    if (myAim && p.p === S.turn && (!aim || aim.id === p.id)) {
      ctx.beginPath(); ctx.arc(p.x, p.y, PR + 3.5 + Math.sin(t * 5) * 1.2, 0, Math.PI * 2);
      ctx.strokeStyle = COL[p.p] + '88'; ctx.lineWidth = 1.6; ctx.stroke();
    }
    puck(p.x, p.y, p.p, 1, 1);
  }

  if (aim && S.phase === 'aim') drawAim();

  // kıvılcımlar
  fx.parts = fx.parts.filter(q => (q.t += dt) < q.life);
  for (const q of fx.parts) {
    q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.9; q.vy *= 0.9;
    ctx.globalAlpha = 1 - q.t / q.life; ctx.fillStyle = q.c;
    ctx.beginPath(); ctx.arc(q.x, q.y, 1.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function puck(x, y, pl, sc, al) {
  const r = PR * sc;
  ctx.globalAlpha = al;
  ctx.beginPath(); ctx.ellipse(x + 1, y + 3 * sc, r, r * 0.9, 0, 0, Math.PI * 2); ctx.fillStyle = '#0007'; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y + 1.6 * sc, r, 0, Math.PI * 2); ctx.fillStyle = COL_D[pl]; ctx.fill();
  const g = ctx.createRadialGradient(x - r * .35, y - r * .45, r * .1, x, y, r);
  g.addColorStop(0, '#ffffffaa'); g.addColorStop(.25, COL[pl]); g.addColorStop(1, COL_D[pl]);
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, Math.PI * 2); ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = r * 0.12; ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawAim() {
  const p = S.pucks[aim.id];
  let dx = p.x - aim.px, dy = p.y - aim.py; const len = Math.sqrt(dx * dx + dy * dy);
  if (len < PR * 0.9) return;
  const k = Math.min(len, PULL) / PULL; dx /= len; dy /= len;
  const fxp = p.x - dx * Math.min(len, PULL), fyp = p.y - dy * Math.min(len, PULL);
  // lastik
  ctx.strokeStyle = '#ffffff30'; ctx.lineWidth = 1.4; ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(fxp, fyp); ctx.stroke(); ctx.setLineDash([]);
  ctx.beginPath(); ctx.arc(fxp, fyp, 3, 0, Math.PI * 2); ctx.fillStyle = '#ffffff40'; ctx.fill();
  // yön oku
  const c = k < 0.5 ? COL[p.p] : k < 0.85 ? '#ffd166' : '#ff5a4e', L = PR + 8 + k * 52;
  const ex = p.x + dx * L, ey = p.y + dy * L;
  ctx.strokeStyle = c; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(p.x + dx * (PR + 3), p.y + dy * (PR + 3)); ctx.lineTo(ex, ey); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ex + dx * 5, ey + dy * 5); ctx.lineTo(ex - dy * 4.5 - dx * 2, ey + dx * 4.5 - dy * 2); ctx.lineTo(ex + dy * 4.5 - dx * 2, ey - dx * 4.5 - dy * 2); ctx.closePath();
  ctx.fillStyle = c; ctx.fill();
  // güç halkası
  ctx.beginPath(); ctx.arc(p.x, p.y, PR + 6, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.stroke();
}

// ---------- ses ----------
let ac = null;
function audio() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { } } else if (ac.state === 'suspended') ac.resume(); }
function tone(type, f0, f1, dur, vol, delay = 0) {
  if (!sound || !ac) return;
  const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(f1, 20), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
}
let lastHit = 0;
const sfx = {
  hit(s) { const n = performance.now(); if (n - lastHit < 25) return; lastHit = n; tone('triangle', 520 + s * 2, 260 + s, 0.09, Math.min(0.05 + s / 900, 0.3)); },
  bump(s) { tone('square', 240, 120, 0.12, Math.min(0.04 + s / 1500, 0.15)); },
  fall() { tone('sine', 620, 70, 0.5, 0.22); },
  win(good) { (good ? [523, 659, 784, 1047] : [392, 330, 262]).forEach((f, i) => tone('triangle', f, f, 0.22, 0.16, i * 0.12)); },
};

// test/debug erişimi
window.__fiske = { get S() { return S; }, cfg, start, shoot: v => { if (S && shoot(S, v)) begin(); } };

resize();
requestAnimationFrame(t => { last = t; frame(t); });
