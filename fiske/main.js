// Fiske Arena — arayüz, çizim, dokunma, ses. Oyun kuralları physics.js'de.
import { ARENAS, PR, DT, MAX_STEPS, MAX_TURNS, newGame, shoot, step, endTurn, moving, aliveOf, maxV, arenaById } from './physics.js';
import { botShot, LEVELS } from './bot.js';

const $ = id => document.getElementById(id);
const cv = $('c'), ctx = cv.getContext('2d');
const COL = ['#36d1c4', '#ff7a66'], COL_D = ['#168a82', '#c4452f'], COL_L = ['#c4fff9', '#ffe0d6'];
const PULL = 70;   // tam güç için çekme mesafesi (dünya birimi)

// Arena temaları: arka plan, platform üstü, yan yüz, kenar, çizgi
const THEMES = {
  yuvarlak: { bg: ['#1c2440', '#0a0d17'], top: ['#4c5a85', '#2a3254'], side: '#141a2e', rim: '#8b9bd4', line: '#ffffff12', dust: '#9fb0ff' },
  halka: { bg: ['#2a1a46', '#0c0816'], top: ['#5d4790', '#2f2352'], side: '#191231', rim: '#b79bff', line: '#ffffff12', dust: '#c9b3ff' },
  buz: { bg: ['#123247', '#06121b'], top: ['#5a88a8', '#2b4d68'], side: '#132a3d', rim: '#aee3ff', line: '#ffffff16', dust: '#d5f3ff' },
  tampon: { bg: ['#103026', '#05130e'], top: ['#33805f', '#1c4c38'], side: '#4a2f1a', rim: '#d29a5c', line: '#ffffff10', dust: '#a8ffd6' },
  camur: { bg: ['#33261a', '#100b06'], top: ['#9a8261', '#62503a'], side: '#2e2316', rim: '#e0c08e', line: '#0000001c', dust: '#ffdcae' },
};
const AR_DESC = { yuvarlak: 'Engelsiz klasik', halka: 'Ortadaki delik yutar', buz: 'Ortası kaygan', tampon: 'Tamponlar geri fırlatır', camur: 'Çamur pulu durdurur' };
const LV_DESC = { kolay: 'Acemi', orta: 'Dengeli', zor: 'Keskin nişancı' };

const store = {
  get(k, d) { try { const v = localStorage.getItem('fiske.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('fiske.' + k, JSON.stringify(v)); } catch { } },
};
const cfg = { mode: store.get('mode', 'bot'), lvl: store.get('lvl', 'orta'), arena: store.get('arena', 'rastgele') };
let sound = store.get('snd', true);
const rec = Object.assign({ kolay: [0, 0], orta: [0, 0], zor: [0, 0] }, store.get('rec', {}));
let ui = 'menu', series = [0, 0], nextFirst = 0, demoIx = Math.random() * ARENAS.length | 0;

// ---------- sahne (oyun veya menü arkasındaki demo maç) ----------
let sc = null;
function makeScene(arenaId, first, bots, demo) {
  return { S: newGame(arenaId, first), bots, demo, aim: null, acc: 0, steps: 0, shotFalls: [], timer: 0,
    fx: { parts: [], falls: [], trails: {}, shake: 0, flash: {} }, view: { s: 1, ox: 0, oy: 0 } };
}
const names = () => cfg.mode === 'bot' ? ['Sen', 'Bot · ' + LEVELS[cfg.lvl].ad] : ['Turkuaz', 'Mercan'];
const humanTurn = () => sc && !sc.demo && ui === 'game' && sc.S.phase === 'aim' && !sc.bots[sc.S.turn];

function startDemo() {
  if (sc) clearTimeout(sc.timer);
  const A = ARENAS[demoIx++ % ARENAS.length];
  sc = makeScene(A.id, Math.random() < .5 ? 0 : 1, ['orta', 'zor'], true);
  layout(); botPlay(sc);
}

function startGame() {
  if (sc) clearTimeout(sc.timer);
  const id = cfg.arena === 'rastgele' ? ARENAS[Math.random() * ARENAS.length | 0].id : cfg.arena;
  sc = makeScene(id, nextFirst, cfg.mode === 'bot' ? [null, cfg.lvl] : [null, null], false);
  show('game');
  const N = names(); $('n0').textContent = N[0]; $('n1').textContent = N[1];
  layout(); hud();
  banner(sc.S.arena.ad, '#fff');
  setTimeout(() => { if (sc && !sc.demo && sc.S.n === 0) turnBanner(); }, 1150);
  botPlay(sc);
}

// ---------- ekranlar ----------
const SCREENS = ['menu', 'setup', 'pause', 'over', 'how'];
function show(name) {
  ui = name;
  for (const s of SCREENS) $(s).hidden = s !== name;
  $('hud').hidden = !(name === 'game' || name === 'pause' || name === 'over');
  if ((name === 'menu' || name === 'setup') && (!sc || !sc.demo)) startDemo();
  else layout();
  if (name === 'menu') recs();
}

function recs() {
  $('recs').innerHTML = ['kolay', 'orta', 'zor'].map(l => `<div class="r"><small>${LEVELS[l].ad} bot</small><b>${rec[l][0]}<i> – </i>${rec[l][1]}</b></div>`).join('');
}

document.querySelectorAll('.mode[data-mode]').forEach(b => b.onclick = () => { audio(); cfg.mode = b.dataset.mode; store.set('mode', cfg.mode); openSetup(); });
$('bHow').onclick = () => show('how');
$('bHowOk').onclick = () => show('menu');
$('bBack').onclick = () => show('menu');
$('bStart').onclick = () => { audio(); series = [0, 0]; nextFirst = 0; startGame(); };
$('bPause').onclick = () => { if (ui === 'game') show('pause'); };
$('bResume').onclick = () => show('game');
$('bRestart').onclick = () => startGame();
$('bQuit').onclick = () => { if (sc) clearTimeout(sc.timer); sc = null; show('menu'); };
$('bAgain').onclick = () => startGame();
$('bArena').onclick = () => { if (sc) clearTimeout(sc.timer); sc = null; openSetup(); };
$('bHome').onclick = () => { sc = null; show('menu'); };
const sndIcon = () => { $('bSnd').textContent = $('bSnd2').textContent = sound ? '🔊' : '🔈'; };
$('bSnd').onclick = $('bSnd2').onclick = () => { sound = !sound; store.set('snd', sound); sndIcon(); audio(); };
sndIcon();

function openSetup() {
  $('suT').textContent = cfg.mode === 'bot' ? 'Bota karşı' : 'Arkadaşınla';
  $('lvlBox').hidden = cfg.mode !== 'bot';
  $('lvls').innerHTML = ['kolay', 'orta', 'zor'].map(l => `<button class="lv${cfg.lvl === l ? ' on' : ''}" data-v="${l}">${face(l)}<b>${LEVELS[l].ad}</b><small>${LV_DESC[l]}</small></button>`).join('');
  $('lvls').querySelectorAll('.lv').forEach(b => b.onclick = () => { cfg.lvl = b.dataset.v; store.set('lvl', cfg.lvl); $('lvls').querySelectorAll('.lv').forEach(x => x.classList.toggle('on', x === b)); });
  const box = $('arenas');
  box.innerHTML = `<button class="ar" data-v="rastgele" style="background:linear-gradient(160deg,#2a3150,#141a2c)"><div class="dice">?</div><b>Rastgele</b><small>Her maç sürpriz</small></button>` +
    ARENAS.map(a => { const T = THEMES[a.id]; return `<button class="ar" data-v="${a.id}" style="background:linear-gradient(160deg,${T.bg[0]},${T.bg[1]})"><canvas width="240" height="192"></canvas><b>${a.ad}</b><small>${AR_DESC[a.id]}</small></button>`; }).join('');
  box.querySelectorAll('.ar').forEach(b => {
    b.classList.toggle('on', b.dataset.v === cfg.arena);
    b.onclick = () => { cfg.arena = b.dataset.v; store.set('arena', cfg.arena); box.querySelectorAll('.ar').forEach(x => x.classList.toggle('on', x === b)); };
    const c = b.querySelector('canvas'); if (c) thumb(c, arenaById(b.dataset.v));
  });
  show('setup');
}

function face(l) {
  const m = l === 'kolay' ? 'M14 25q6 4 12 0' : l === 'orta' ? 'M14 25h12' : 'M14 26q6-4 12 0';
  const e = l === 'zor' ? '<path d="M11 15l6 2M29 15l-6 2" stroke="#ffcc4d" stroke-width="2.4" stroke-linecap="round"/>' : '';
  return `<svg class="face" viewBox="0 0 40 40"><rect x="5" y="7" width="30" height="26" rx="9" fill="#ffcc4d22" stroke="#ffcc4d" stroke-width="2.4"/>${e}<circle cx="15" cy="19" r="2.6" fill="#ffcc4d"/><circle cx="25" cy="19" r="2.6" fill="#ffcc4d"/><path d="${m}" stroke="#ffcc4d" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>`;
}

function thumb(c, A) {
  const g = c.getContext('2d'), [ex, ey] = extent(A), s = Math.min(c.width / (2 * ex + 26), c.height / (2 * ey + 30));
  g.setTransform(s, 0, 0, s, c.width / 2, c.height / 2 - 2 * s);
  drawArena(g, A, 0, {}, 0);
  for (const p of newGame(A.id).pucks) puck(g, p.x, p.y, p.p, 1, 1);
}

// ---------- HUD ----------
function hud() {
  if (!sc || sc.demo) return;
  const S = sc.S;
  for (const pl of [0, 1]) {
    const n = aliveOf(S, pl).length;
    $('p' + pl).innerHTML = [0, 1, 2].map(i => `<i class="${i < n ? '' : 'x'}"></i>`).join('');
    $('pl' + pl).classList.toggle('on', S.winner === null && S.turn === pl);
  }
  $('info').textContent = S.winner !== null || S.phase === 'moving' ? '' : `Atış ${S.n + 1}/${MAX_TURNS}${S.n === 0 ? ' · yarım güç' : ''}`;
}
let banT = 0;
function banner(txt, color) {
  const b = $('banner'); b.textContent = txt; b.style.color = color || '#fff';
  b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
  clearTimeout(banT); banT = setTimeout(() => b.classList.remove('show'), 1300);
}
function turnBanner() {
  const t = sc.S.turn, N = names();
  if (cfg.mode === 'bot') { if (t === 0) banner('Sıra sende', COL[0]); }
  else banner(`Sıra: ${N[t]}`, COL[t]);
}

// ---------- görünüm ----------
function extent(A) { return A.shape === 'circle' ? [A.r, A.r] : [A.w / 2, A.h / 2]; }
let W = 0, H = 0, DPR = 1;
function resize() {
  W = innerWidth; H = innerHeight; DPR = Math.min(devicePixelRatio || 1, 2);
  cv.width = W * DPR; cv.height = H * DPR; layout();
}
function layout() {
  if (!sc) return;
  const [ex, ey] = extent(sc.S.arena), v = sc.view;
  let top, avail;
  if (sc.demo) {   // logo ile mod kartları arasındaki boşluğa sığdır; yer yoksa arkada kalsın
    const lg = document.querySelector('.logo'), sh = document.querySelector('#menu .sheet');   // offsetTop: giriş animasyonundan etkilenmez
    top = lg.offsetTop + lg.offsetHeight + 6; avail = sh.offsetTop - top - 6;
    if (ui !== 'menu' || !lg.offsetHeight || avail < 170) { top = H * 0.06; avail = H * 0.62; }
  }
  else { top = 112; avail = H - top - 72; }
  v.s = Math.min((W - 20) / (2 * ex + 24), avail / (2 * ey + 26));
  v.ox = W / 2; v.oy = top + avail / 2;
}
addEventListener('resize', resize);
const toWorld = (x, y) => ({ x: (x - sc.view.ox) / sc.view.s, y: (y - sc.view.oy) / sc.view.s });

// ---------- dokunma ----------
cv.addEventListener('pointerdown', e => {
  audio();
  if (!humanTurn() || sc.aim) return;
  const S = sc.S, w = toWorld(e.clientX, e.clientY);
  let best = null, bd = (PR * 3) ** 2;
  for (const p of aliveOf(S, S.turn)) { const d = (p.x - w.x) ** 2 + (p.y - w.y) ** 2; if (d < bd) { bd = d; best = p; } }
  if (!best) return;
  sc.aim = { id: best.id, px: w.x, py: w.y, pid: e.pointerId };
  cv.setPointerCapture(e.pointerId); buzz(8); sfx.grab();
});
cv.addEventListener('pointermove', e => { const a = sc && sc.aim; if (a && a.pid === e.pointerId) { const w = toWorld(e.clientX, e.clientY); a.px = w.x; a.py = w.y; } });
cv.addEventListener('pointerup', e => {
  const a = sc && sc.aim; if (!a || a.pid !== e.pointerId) return;
  sc.aim = null;
  const v = aimVel(sc.S, a);
  if (v && shoot(sc.S, v)) begin(sc);
});
cv.addEventListener('pointercancel', () => { if (sc && sc.aim && !sc.aim.bot) sc.aim = null; });

function aimVel(S, a) {
  const p = S.pucks[a.id], dx = p.x - a.px, dy = p.y - a.py, len = Math.sqrt(dx * dx + dy * dy);
  if (len < PR * 0.9) return null;   // pula geri bırakıldı: iptal
  const pw = Math.min(len, PULL) / PULL * maxV(S);
  return { id: a.id, vx: dx / len * pw, vy: dy / len * pw };
}
function begin(s) { s.acc = 0; s.steps = 0; s.shotFalls = []; if (!s.demo) { hud(); buzz(15); sfx.shot(Math.sqrt(s.S.shots.at(-1).vx ** 2 + s.S.shots.at(-1).vy ** 2)); } }

// ---------- bot ----------
function botPlay(s) {
  const lvl = s.bots[s.S.turn];
  if (!lvl || s.S.winner !== null) return;
  s.timer = setTimeout(() => {
    if (sc !== s || s.S.phase !== 'aim' || (!s.demo && ui !== 'game')) { if (sc === s && ui === 'pause') s.timer = setTimeout(() => botPlay(s), 300); return; }
    const S = s.S, sh = botShot(S, lvl), p = S.pucks[sh.id], sp = Math.sqrt(sh.vx ** 2 + sh.vy ** 2), pull = sp / maxV(S) * PULL;
    const t0 = performance.now(), D = s.demo ? 650 : 520;
    s.aim = { id: sh.id, bot: true, px: p.x, py: p.y };
    const grow = () => {
      if (sc !== s || !s.aim) return;
      const k = Math.min(1, (performance.now() - t0) / D), e = 1 - (1 - k) ** 3;
      s.aim.px = p.x - sh.vx / sp * pull * e; s.aim.py = p.y - sh.vy / sp * pull * e;
      if (k < 1) requestAnimationFrame(grow);
      else setTimeout(() => { if (sc !== s || !s.aim) return; s.aim = null; if (shoot(S, sh)) begin(s); }, 120);
    };
    grow();
  }, s.demo ? 900 : 600);
}

// ---------- döngü ----------
let last = 0;
function frame(t) {
  const dt = Math.min((t - last) / 1000, 0.05); last = t;
  const s = sc;
  if (s && s.S.phase === 'moving' && ui !== 'pause') {
    const S = s.S; s.acc += dt; const ev = [];
    // play() ile birebir aynı: en fazla MAX_STEPS adım, sonra hızlar sıfırlanır.
    while (s.acc >= DT && moving(S) && s.steps < MAX_STEPS) { step(S, ev); s.steps++; s.acc -= DT; }
    events(s, ev);
    for (const p of S.pucks) if (p.alive && (p.vx || p.vy)) (s.fx.trails[p.id] = s.fx.trails[p.id] || []).push({ x: p.x, y: p.y });
    if (!moving(S) || s.steps >= MAX_STEPS) {
      for (const p of S.pucks) { p.vx = 0; p.vy = 0; }
      const me = S.turn; endTurn(S); turnOver(s, me);
    }
  }
  if (s) for (const k in s.fx.trails) { const tr = s.fx.trails[k]; if (tr.length > 16 || (tr.length && s.S.phase !== 'moving')) tr.shift(); }
  draw(t / 1000, dt);
  requestAnimationFrame(frame);
}

function events(s, ev) {
  const fx = s.fx, q = s.demo;
  for (const e of ev) {
    if (e.t === 'hit') {
      const v = Math.min(e.s, 230);
      if (!q) sfx.hit(v);
      burst(fx, e.x, e.y, v > 90 ? 12 : 5, '#fff3d6', v);
      if (v > 120 && !q) { fx.shake = Math.max(fx.shake, v / 55); buzz(12); }
    } else if (e.t === 'bump') {
      if (!q) sfx.bump(e.s);
      fx.flash[e.b] = 1; burst(fx, e.x, e.y, 7, '#ffcc4d', e.s);
    } else if (e.t === 'fall') {
      fx.falls.push({ x: e.x, y: e.y, vx: e.vx, vy: e.vy, p: e.p, t: 0 });
      s.shotFalls.push(e.p);
      if (!q) { sfx.fall(); buzz(30); }
    }
  }
}

function turnOver(s, shooter) {
  const S = s.S;
  if (s.demo) {
    if (S.winner !== null) s.timer = setTimeout(() => { if (sc === s) { startDemo(); } }, 1800);
    else botPlay(s);
    return;
  }
  hud();
  const mine = s.shotFalls.filter(p => p === shooter).length, theirs = s.shotFalls.length - mine;
  if (S.winner !== null) {
    if (S.winner >= 0) series[S.winner]++;
    const good = cfg.mode === 'bot' ? S.winner === 0 : S.winner >= 0;
    if (cfg.mode === 'bot' && S.winner >= 0) { rec[cfg.lvl][S.winner === 0 ? 0 : 1]++; store.set('rec', rec); }
    sfx.win(good);
    if (S.winner >= 0 && good) confetti(s, S.winner);
    s.timer = setTimeout(() => { if (sc === s) over(); }, 1100);
    return;
  }
  if (theirs >= 2) banner(theirs === 3 ? 'ÜÇLÜ!' : 'ÇİFTE!', '#ffcc4d');
  else if (theirs === 1 && !mine) banner('Düştü!', COL[shooter]);
  else if (mine) banner(mine > 1 ? 'Eyvah, iki kendi pulun!' : 'Kendi pulun!', '#ff9a8a');
  else turnBanner();
  botPlay(s);
}

function over() {
  const S = sc.S, N = names(), w = S.winner, lose = cfg.mode === 'bot' && w === 1;
  $('oT').textContent = w < 0 ? 'Berabere' : cfg.mode === 'bot' ? (w === 0 ? 'Kazandın!' : 'Kaybettin') : `${N[w]} kazandı!`;
  $('oT').style.color = w < 0 ? '' : COL[w];
  $('oIcon').className = 'trophy' + (lose || w < 0 ? ' lose' : '');
  $('oIcon').innerHTML = lose || w < 0 ? '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="#fff" stroke-width="2.4"/><path d="M8 12h8" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>'
    : '<svg viewBox="0 0 24 24"><path d="M7 4h10v5a5 5 0 0 1-10 0z" fill="#fff"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M12 14v3M8 20h8l-1-3H9z" fill="#fff" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/></svg>';
  $('oS').textContent = `${S.arena.ad} · ${S.n} atış`;
  $('oSeries').innerHTML = `<div class="sn s0"><b>${series[0]}</b>${N[0]}</div><span class="vs">SERİ</span><div class="sn s1"><b>${series[1]}</b>${N[1]}</div>`;
  nextFirst = 1 - S.first;   // rövanşta diğeri başlar
  show('over');
}

// ---------- efektler ----------
function burst(fx, x, y, n, c, v) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = 20 + Math.random() * v * 0.5;
    fx.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, life: 0.25 + Math.random() * 0.25, c, r: 1.2 });
  }
}
function confetti(s, pl) {
  const cols = [COL[pl], COL_L[pl], '#ffcc4d', '#ffffff'];
  for (let i = 0; i < 90; i++) {
    const a = -Math.PI / 2 + (Math.random() - .5) * 2.2, sp = 80 + Math.random() * 170;
    s.fx.parts.push({ x: (Math.random() - .5) * 60, y: 40, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, life: 1.6 + Math.random(), c: cols[i % 4], r: 1.6 + Math.random() * 1.6, g: 160, sq: true, rot: Math.random() * 6 });
  }
}
const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch { } };

// ---------- çizim ----------
function shapePath(g, A, grow = 0) {
  g.beginPath();
  if (A.shape === 'circle') g.arc(0, 0, A.r + grow, 0, Math.PI * 2);
  else g.roundRect(-A.w / 2 - grow, -A.h / 2 - grow, A.w + 2 * grow, A.h + 2 * grow, 12 + grow);
}

// Uçuşan toz zerreleri (arka plan)
const DUST = Array.from({ length: 46 }, (_, i) => ({ x: (i * 0.6180339 % 1), y: (i * 0.4142 % 1), r: .6 + (i * 7 % 5) * .35, sp: .004 + (i % 7) * .002, ph: i * 1.7 }));
function drawBg(T, t) {
  const g = ctx.createRadialGradient(W / 2, H * 0.42, 10, W / 2, H * 0.45, Math.max(W, H) * 0.8);
  g.addColorStop(0, T.bg[0]); g.addColorStop(1, T.bg[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = T.dust;
  for (const d of DUST) {
    const y = ((d.y - t * d.sp) % 1 + 1) % 1, x = d.x + Math.sin(t * .3 + d.ph) * .01;
    ctx.globalAlpha = .12 + .1 * Math.sin(t + d.ph);
    ctx.beginPath(); ctx.arc(x * W, y * H, d.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawArena(g, A, t, flash, dt) {
  const T = THEMES[A.id] || THEMES.yuvarlak;
  // gölge + yan yüz (kalınlık)
  g.save(); g.shadowColor = '#000b'; g.shadowBlur = 40; g.shadowOffsetY = 26;
  g.translate(0, 9); shapePath(g, A, 1); g.fillStyle = T.side; g.fill(); g.restore();
  g.save(); g.translate(0, 4.5); shapePath(g, A, 1); g.fillStyle = T.side; g.fill(); g.restore();
  // üst yüz
  const gr = g.createLinearGradient(0, -120, 0, 120);
  gr.addColorStop(0, T.top[0]); gr.addColorStop(1, T.top[1]);
  shapePath(g, A); g.fillStyle = gr; g.fill();
  g.save(); shapePath(g, A); g.clip();
  // malzeme deseni
  g.strokeStyle = T.line; g.lineWidth = 1.2;
  if (A.id === 'tampon') {   // keçe: ince çapraz dokular
    for (let i = -220; i < 220; i += 7) { g.beginPath(); g.moveTo(i, -110); g.lineTo(i + 60, 110); g.stroke(); }
  } else if (A.id === 'camur') {   // kum: noktalar
    g.fillStyle = '#00000014';
    for (let i = 0; i < 160; i++) { const a = i * 2.39996, r = 104 * Math.sqrt((i + .5) / 160); g.beginPath(); g.arc(Math.cos(a) * r, Math.sin(a) * r, 1.1, 0, Math.PI * 2); g.fill(); }
  } else {
    for (let r = 25; r < (A.r || 100); r += 25) { g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); }
  }
  // spot ışığı
  const sp = g.createRadialGradient(-30, -60, 5, -10, -30, 150);
  sp.addColorStop(0, '#ffffff1e'); sp.addColorStop(1, '#ffffff00');
  g.fillStyle = sp; g.fillRect(-200, -200, 400, 400);
  // orta çizgi
  g.strokeStyle = '#ffffff22'; g.setLineDash([5, 5]); g.lineWidth = 1.2; g.beginPath(); g.moveTo(-200, 0); g.lineTo(200, 0); g.stroke(); g.setLineDash([]);
  g.restore();
  // kenar: dış parlak + iç koyu
  shapePath(g, A); g.strokeStyle = T.rim; g.lineWidth = 2.6; g.stroke();
  shapePath(g, A, -2.2); g.strokeStyle = '#00000030'; g.lineWidth = 1.6; g.stroke();

  for (const z of A.zones || []) {
    g.beginPath(); g.arc(z.x, z.y, z.r, 0, Math.PI * 2);
    if (z.k === 'buz') {
      const gz = g.createRadialGradient(z.x - z.r * .35, z.y - z.r * .35, 2, z.x, z.y, z.r);
      gz.addColorStop(0, '#f0fbffa0'); gz.addColorStop(.6, '#bfe8ff55'); gz.addColorStop(1, '#8fd3ff30'); g.fillStyle = gz; g.fill();
      g.strokeStyle = '#e2f6ffaa'; g.lineWidth = 1.6; g.stroke();
      g.strokeStyle = '#ffffff70'; g.lineWidth = 1; g.lineCap = 'round';
      for (let i = 0; i < 7; i++) { const a = i * 0.9 + 0.4, r = z.r * (0.25 + (i % 3) * 0.22), x = z.x + Math.cos(a) * r, y = z.y + Math.sin(a) * r; g.beginPath(); g.moveTo(x - 6, y + 2); g.lineTo(x + 6, y - 3); g.stroke(); }
      // parıltı
      const k = (Math.sin(t * 1.4) + 1) / 2;
      g.fillStyle = `rgba(255,255,255,${.25 + .5 * k})`; g.beginPath(); g.arc(z.x - z.r * .4, z.y - z.r * .45, 1.8, 0, Math.PI * 2); g.fill();
    } else {
      const gm = g.createRadialGradient(z.x, z.y, 2, z.x, z.y, z.r);
      gm.addColorStop(0, '#4a321f'); gm.addColorStop(1, '#6b4a2e'); g.fillStyle = gm; g.fill();
      g.strokeStyle = '#3a2717'; g.lineWidth = 2; g.stroke();
      g.fillStyle = '#7e5a38';
      for (let i = 0; i < 10; i++) { const a = i * 2.39 + t * .05, r = z.r * Math.sqrt((i + .5) / 10) * .82; g.beginPath(); g.ellipse(z.x + Math.cos(a) * r, z.y + Math.sin(a) * r, 2.6 + (i % 3), 1.8 + (i % 2), a, 0, Math.PI * 2); g.fill(); }
    }
  }
  for (const h of A.holes || []) {
    g.beginPath(); g.arc(h.x, h.y, h.r + 3, 0, Math.PI * 2); g.fillStyle = '#00000040'; g.fill();
    const gh = g.createRadialGradient(h.x, h.y + 5, 1, h.x, h.y, h.r);
    gh.addColorStop(0, '#000'); gh.addColorStop(.8, '#05030c'); gh.addColorStop(1, '#2a2050');
    g.beginPath(); g.arc(h.x, h.y, h.r, 0, Math.PI * 2); g.fillStyle = gh; g.fill();
    g.strokeStyle = THEMES[A.id].rim; g.lineWidth = 2; g.stroke();
    // girdap
    g.strokeStyle = '#b79bff30'; g.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(h.x, h.y, h.r * (.35 + i * .2), t * (1 + i * .3) + i * 2, t * (1 + i * .3) + i * 2 + 1.6); g.stroke(); }
  }
  (A.bumpers || []).forEach((b, i) => {
    const f = flash[i] || 0; if (dt) flash[i] = f * Math.pow(0.01, dt);
    g.beginPath(); g.arc(b.x, b.y + 3, b.r + 1, 0, Math.PI * 2); g.fillStyle = '#0008'; g.fill();
    const R = b.r * (1 + f * 0.18);
    if (f > .05) { g.beginPath(); g.arc(b.x, b.y, R + 6 * f, 0, Math.PI * 2); g.fillStyle = `rgba(255,214,110,${.35 * f})`; g.fill(); }
    const gb = g.createRadialGradient(b.x - R * .35, b.y - R * .4, 1, b.x, b.y, R);
    gb.addColorStop(0, '#fff6d6'); gb.addColorStop(.35, f > .1 ? '#fff0b8' : '#ffcc4d'); gb.addColorStop(1, '#c98a0e');
    g.beginPath(); g.arc(b.x, b.y, R, 0, Math.PI * 2); g.fillStyle = gb; g.fill();
    g.beginPath(); g.arc(b.x, b.y, R * .5, 0, Math.PI * 2); g.strokeStyle = '#a8700a'; g.lineWidth = 1.6; g.stroke();
  });
}

function puck(g, x, y, pl, sc_, al) {
  const r = PR * sc_;
  g.globalAlpha = al;
  g.beginPath(); g.ellipse(x + 1.2, y + 3.4 * sc_, r * 1.02, r * .9, 0, 0, Math.PI * 2); g.fillStyle = '#0008'; g.fill();
  g.beginPath(); g.arc(x, y + 1.8 * sc_, r, 0, Math.PI * 2); g.fillStyle = COL_D[pl]; g.fill();
  const gr = g.createRadialGradient(x - r * .35, y - r * .45, r * .08, x, y, r);
  gr.addColorStop(0, COL_L[pl]); gr.addColorStop(.32, COL[pl]); gr.addColorStop(1, COL_D[pl]);
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = gr; g.fill();
  // amblem: 0 = halka, 1 = elmas (renk körü dostu)
  g.strokeStyle = '#ffffffb0'; g.lineWidth = r * .16;
  if (pl === 0) { g.beginPath(); g.arc(x, y, r * .42, 0, Math.PI * 2); g.stroke(); }
  else { const d = r * .48; g.beginPath(); g.moveTo(x, y - d); g.lineTo(x + d, y); g.lineTo(x, y + d); g.lineTo(x - d, y); g.closePath(); g.stroke(); }
  g.globalAlpha = 1;
}

function draw(t, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (!sc) { ctx.fillStyle = '#0c0f1a'; ctx.fillRect(0, 0, W, H); return; }
  const S = sc.S, A = S.arena, fx = sc.fx, v = sc.view;
  drawBg(THEMES[A.id], t);
  fx.shake *= Math.pow(0.002, dt);
  const sh = fx.shake > 0.2 ? fx.shake : 0;
  ctx.translate(v.ox + (Math.random() - .5) * sh, v.oy + (Math.random() - .5) * sh);
  ctx.scale(v.s, v.s);
  drawArena(ctx, A, t, fx.flash, dt);

  for (const k in fx.trails) {
    const tr = fx.trails[k], p = S.pucks[k]; if (tr.length < 2) continue;
    ctx.lineCap = 'round';
    for (let i = 1; i < tr.length; i++) {
      ctx.strokeStyle = COL[p.p] + Math.round(i / tr.length * 80).toString(16).padStart(2, '0');
      ctx.lineWidth = PR * 1.4 * i / tr.length;
      ctx.beginPath(); ctx.moveTo(tr[i - 1].x, tr[i - 1].y); ctx.lineTo(tr[i].x, tr[i].y); ctx.stroke();
    }
  }
  fx.falls = fx.falls.filter(f => f.t < 0.7);
  for (const f of fx.falls) {
    f.t += dt; f.x += f.vx * dt * 0.45; f.y += f.vy * dt * 0.45 + 60 * f.t * dt;
    const k = Math.max(0, 1 - f.t / 0.7);
    puck(ctx, f.x, f.y, f.p, 0.3 + 0.7 * k, k);
  }
  const mine = humanTurn();
  for (const p of S.pucks) if (p.alive) {
    if (mine && p.p === S.turn && (!sc.aim || sc.aim.id === p.id)) {
      const k = (Math.sin(t * 4.5) + 1) / 2;
      ctx.beginPath(); ctx.arc(p.x, p.y + 1, PR + 3 + k * 2, 0, Math.PI * 2);
      ctx.strokeStyle = COL[p.p]; ctx.globalAlpha = .35 + .4 * (1 - k); ctx.lineWidth = 1.6; ctx.stroke(); ctx.globalAlpha = 1;
    }
    puck(ctx, p.x, p.y, p.p, 1, 1);
  }
  if (sc.aim && S.phase === 'aim') drawAim(S, sc.aim);

  fx.parts = fx.parts.filter(q => (q.t += dt) < q.life);
  for (const q of fx.parts) {
    if (q.g) { q.vy += q.g * dt; q.vx *= .99; q.rot += dt * 6; } else { q.vx *= .9; q.vy *= .9; }
    q.x += q.vx * dt; q.y += q.vy * dt;
    ctx.globalAlpha = Math.min(1, (1 - q.t / q.life) * 1.6); ctx.fillStyle = q.c;
    if (q.sq) { ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot); ctx.fillRect(-q.r, -q.r * .5, q.r * 2, q.r); ctx.restore(); }
    else { ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
}

function drawAim(S, a) {
  const p = S.pucks[a.id];
  let dx = p.x - a.px, dy = p.y - a.py; const len = Math.sqrt(dx * dx + dy * dy);
  if (len < PR * 0.9) return;
  const L0 = Math.min(len, PULL), k = L0 / PULL; dx /= len; dy /= len;
  const bx = p.x - dx * L0, by = p.y - dy * L0;
  // lastik bant
  ctx.strokeStyle = '#ffffff40'; ctx.lineWidth = 1.6; ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(bx, by); ctx.stroke(); ctx.setLineDash([]);
  ctx.beginPath(); ctx.arc(bx, by, 3.4, 0, Math.PI * 2); ctx.fillStyle = '#ffffff55'; ctx.fill();
  // yön oku (güçle uzar, renk değişir)
  const c = k < 0.5 ? COL[p.p] : k < 0.85 ? '#ffcc4d' : '#ff5a4e', L = PR + 10 + k * 54;
  const ex = p.x + dx * L, ey = p.y + dy * L;
  ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.globalAlpha = .9;
  ctx.beginPath(); ctx.moveTo(p.x + dx * (PR + 4), p.y + dy * (PR + 4)); ctx.lineTo(ex, ey); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ex + dx * 6, ey + dy * 6); ctx.lineTo(ex - dy * 5 - dx * 2, ey + dx * 5 - dy * 2); ctx.lineTo(ex + dy * 5 - dx * 2, ey - dx * 5 - dy * 2); ctx.closePath();
  ctx.fillStyle = c; ctx.fill(); ctx.globalAlpha = 1;
  // güç halkası
  ctx.beginPath(); ctx.arc(p.x, p.y, PR + 6, 0, Math.PI * 2); ctx.strokeStyle = '#ffffff18'; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.beginPath(); ctx.arc(p.x, p.y, PR + 6, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.strokeStyle = c; ctx.stroke();
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
  grab() { tone('sine', 300, 420, 0.06, 0.06); },
  shot(v) { tone('triangle', 200 + v, 90, 0.12, 0.08 + v / 2500); },
  hit(s) { const n = performance.now(); if (n - lastHit < 25) return; lastHit = n; tone('triangle', 520 + s * 2, 260 + s, 0.09, Math.min(0.05 + s / 900, 0.3)); },
  bump(s) { tone('square', 260, 130, 0.12, Math.min(0.04 + s / 1500, 0.15)); },
  fall() { tone('sine', 620, 70, 0.5, 0.22); },
  win(good) { (good ? [523, 659, 784, 1047] : [392, 330, 262]).forEach((f, i) => tone('triangle', f, f, 0.22, 0.16, i * 0.12)); },
};

// test/debug erişimi
window.__fiske = { get S() { return sc && sc.S; }, get sc() { return sc; }, get ui() { return ui; }, cfg, startGame, openSetup, shoot: v => { if (sc && shoot(sc.S, v)) begin(sc); } };

resize();
show('menu');
requestAnimationFrame(t => { last = t; frame(t); });
