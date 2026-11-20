// Ray oynanabilir reklam: bağımsız, bağımlılıksız mini sürüm (www/game.js'e dokunmaz).
// Kural: karoya dokun → 90° saat yönünde döner; merkezden (hub) ray bağlantısıyla ulaşılan karolar yanar;
// her kol karşılıklı eşleşip bütün duraklar yanınca hat tamamdır. Çizim dili oyunun kendi çizimidir (www/game.js, www/style.css).
(function () {
'use strict';
var $ = function (id) { return document.getElementById(id); };
var TR = /^tr/i.test(navigator.language || '');
var T = TR ? {
  c1: 'Karoya dokun: <b>90°</b> döner ↻', c2: 'Ray <b>merkeze</b> bağlanınca ışık yanar', c3: 'Bütün <b>durakları</b> yak',
  c4: 'Daha büyük bir hat: <b>bütün durakları</b> bağla', win: 'Hat bağlandı!', tag: 'Metronu bağla', dl: 'İndir', alt: 'Ray oyun simgesi'
} : {
  c1: 'Tap a tile: it turns <b>90°</b> ↻', c2: 'When a rail <b>reaches the hub</b>, it lights up', c3: 'Light up <b>every station</b>',
  c4: 'A bigger line: connect <b>every station</b>', win: 'Line connected!', tag: 'Connect your metro', dl: 'Download', alt: 'Ray game icon'
};
document.documentElement.lang = TR ? 'tr' : 'en';

// ---------- kural ----------
var N = 1, E = 2, S = 4, W = 8;
var DIRS = [[N, 0, -1, S], [E, 1, 0, W], [S, 0, 1, N], [W, -1, 0, E]];
var rot = function (m) { return ((m << 1) | (m >> 3)) & 15; };       // saat yönü 90°
var unrot = function (m) { return ((m >> 1) | (m << 3)) & 15; };
var popc = function (m) { return (m & 1) + (m >> 1 & 1) + (m >> 2 & 1) + (m >> 3 & 1); };

// Bölüm 1: oyunun öğretici 3×3 tahtası (www/game.js TUT_SOL / TUT_CUR), merkez 4. Hat rengi M1 turuncusu.
var P1 = { cols: 3, rows: 3, hub: 4, color: '#f7ac55', sol: [6, 14, 8, 5, 3, 12, 3, 8, 1], cur: [6, 11, 4, 5, 3, 3, 9, 8, 8], order: [5, 8, 1, 2, 6] };
// Bölüm 2: elle tasarlanmış 4×4 (merkez 5). Kenar listesinden çözüm kurulur; 4 karo bozulur: toplam 5 dokunuş.
function build4() {
  var edges = [[5, 1], [5, 6], [5, 9], [1, 0], [1, 2], [2, 3], [0, 4], [6, 7], [6, 10], [9, 8], [9, 13], [8, 12], [13, 14], [14, 15], [10, 11]];
  var sol = [], i, k;
  for (i = 0; i < 16; i++) sol.push(0);
  edges.forEach(function (e) {
    var a = e[0], b = e[1], dx = b % 4 - a % 4, dy = (b / 4 | 0) - (a / 4 | 0);
    for (k = 0; k < 4; k++) if (DIRS[k][1] === dx && DIRS[k][2] === dy) { sol[a] |= DIRS[k][0]; sol[b] |= DIRS[k][3]; }
  });
  var cur = sol.slice(), need = { 1: 2, 6: 1, 9: 1, 12: 1 };   // karo → gereken dokunuş
  Object.keys(need).forEach(function (t) { for (var j = 0; j < need[t]; j++) cur[t] = unrot(cur[t]); });
  return { cols: 4, rows: 4, hub: 5, color: '#75b5fe', sol: sol, cur: cur, order: [1, 6, 9, 12] };
}
var PUZ = [P1, build4()];

// merkezden yayılan ışık: d = hub'a uzaklık (-1: yanmıyor). solved: boşta kol yok + hepsi yanık
function lit(P, cur) {
  var n = cur.length, d = [], q = [P.hub], loose = 0, i, k;
  for (i = 0; i < n; i++) d.push(-1);
  d[P.hub] = 0;
  while (q.length) {
    var u = q.shift();
    for (k = 0; k < 4; k++) {
      if (!(cur[u] & DIRS[k][0])) continue;
      var x = u % P.cols + DIRS[k][1], y = (u / P.cols | 0) + DIRS[k][2];
      var j = (x < 0 || y < 0 || x >= P.cols || y >= P.rows) ? -1 : y * P.cols + x;
      if (j < 0 || !(cur[j] & DIRS[k][3])) { loose++; continue; }
      if (d[j] < 0) { d[j] = d[u] + 1; q.push(j); }
    }
  }
  return { d: d, solved: loose === 0 && d.every(function (v) { return v >= 0; }) };
}

// ---------- durum ----------
var cv = $('cv'), cx = cv.getContext('2d'), app = $('app');
var LIMIT = 25000;   // ms: bu süre dolunca bitiş kartı
var now = 0, last = null, pi = 0, P, cur, L, litAt, anim, press, ripples, parts, timers, taps, phase, introAt, fadeOutAt, endAt, winAt, lastTap;
anim = new Map(); press = new Map(); ripples = []; parts = []; timers = [];

function later(ms, fn) { timers.push({ at: now + ms, fn: fn }); }
var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
var back = function (t) { var c1 = 1.25, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
function rgba(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }

function setCap(html) { $('cap').innerHTML = html; }
function setDots() { var h = ''; for (var i = 0; i < PUZ.length; i++) h += '<i style="background:' + (i <= pi ? PUZ[i].color : '') + '"></i>'; $('dots').innerHTML = h; }

function start(k) {
  pi = k; P = PUZ[k]; cur = P.cur.slice(); taps = 0; phase = 'play';
  litAt = []; for (var i = 0; i < cur.length; i++) litAt.push(1e12);
  L = lit(P, cur); settle(null);
  introAt = k ? now : -1e9; fadeOutAt = null; lastTap = now;
  setCap(k ? T.c4 : T.c1); setDots();
}
// yeni yanan karolar hub'dan uzaklığa göre sırayla yanar (ışık yayılır); sönenler hemen söner
function settle(prev) {
  var mn = 1e9, i;
  for (i = 0; i < L.d.length; i++) if (L.d[i] >= 0 && (!prev || prev.d[i] < 0)) mn = Math.min(mn, L.d[i]);
  for (i = 0; i < L.d.length; i++) {
    if (L.d[i] < 0) litAt[i] = 1e12;
    else if (!prev || prev.d[i] < 0) litAt[i] = now + (L.d[i] - mn) * 75;
  }
}
function hint() {
  if (phase !== 'play') return -1;
  var i, o = P.order;
  for (i = 0; i < o.length; i++) if (cur[o[i]] !== P.sol[o[i]]) return o[i];
  for (i = 0; i < cur.length; i++) if (i !== P.hub && cur[i] !== P.sol[i]) return i;
  return -1;
}

// ---------- geometri ----------
var W_ = 0, H_ = 0, dpr = 1, geo = { s: 1, ox: 0, oy: 0 };
function fit() {
  var r = cv.parentNode.getBoundingClientRect(), w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
  var d = Math.min(window.devicePixelRatio || 1, 3);
  if (w !== W_ || h !== H_ || d !== dpr) { W_ = w; H_ = h; dpr = d; cv.width = Math.round(w * d); cv.height = Math.round(h * d); cv.style.width = w + 'px'; cv.style.height = h + 'px'; }
  var s = Math.min((W_ - 8) / (P.cols + .6), (H_ - 8) / (P.rows + .6));
  geo = { s: s, ox: (W_ - s * P.cols) / 2, oy: (H_ - s * P.rows) / 2 };
}
function centre(i) { return [geo.ox + (i % P.cols) * geo.s + geo.s / 2, geo.oy + (i / P.cols | 0) * geo.s + geo.s / 2]; }

// ---------- çizim (www/game.js draw ile aynı dil) ----------
function rrp(x, y, w, h, r) { cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
function rr(x, y, w, h, r) { cx.beginPath(); rrp(x, y, w, h, r); }
function railPath(t, m, s) {
  var x = t[0], y = t[1], a = t[2], c = Math.cos(a), si = Math.sin(a), l = s / 2;
  for (var k = 0; k < 4; k++) if (m & DIRS[k][0]) { var dx = DIRS[k][1], dy = DIRS[k][2]; cx.moveTo(x, y); cx.lineTo(x + (dx * c - dy * si) * l, y + (dx * si + dy * c) * l); }
}
function finger(x, y, p, s) {
  // parmak: sağ alttan gelir, karoya dokunur (dalga), geri çekilir
  var down = p > .38 && p < .5, lift = p < .38 ? 1 - ease(p / .38) : p < .5 ? 0 : ease(Math.min(1, (p - .5) / .4)) * .6;
  var fx = x + s * (.2 + .16 * lift), fy = y + s * (.24 + .16 * lift), r = s * (down ? .095 : .11);
  if (p > .38 && p < .9) { var q = (p - .38) / .52; cx.strokeStyle = 'rgba(255,255,255,' + (.75 * (1 - q)) + ')'; cx.lineWidth = 2.5; cx.beginPath(); cx.arc(fx, fy, r + q * s * .36, 0, 7); cx.stroke(); }
  cx.save(); cx.shadowColor = 'rgba(0,0,0,.4)'; cx.shadowBlur = 12; cx.fillStyle = 'rgba(255,255,255,.95)'; cx.strokeStyle = 'rgba(255,255,255,.95)'; cx.lineCap = 'round';
  cx.lineWidth = r * 1.7; cx.beginPath(); cx.moveTo(fx, fy); cx.lineTo(fx + s * .17, fy + s * .27); cx.stroke();   // gövde
  cx.beginPath(); cx.arc(fx, fy, r, 0, 7); cx.fill(); cx.restore();
}
function draw() {
  if (!P) return;
  fit();
  var s = geo.s, ox = geo.ox, oy = geo.oy, n = cur.length, col = P.color, i, k;
  cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W_, H_);
  // bölüm geçişi: eski tahta söner, yenisi büyüyerek gelir
  var alpha = 1, sc0 = 1;
  if (fadeOutAt !== null) { var f = Math.min(1, (now - fadeOutAt) / 320); alpha = 1 - f; sc0 = 1 - .04 * f; }
  else if (now - introAt < 480) { var g = ease((now - introAt) / 480); alpha = g; sc0 = .92 + .08 * g; }
  cx.globalAlpha = alpha; cx.translate(W_ / 2, H_ / 2); cx.scale(sc0, sc0); cx.translate(-W_ / 2, -H_ / 2);
  var X = [], on = [];
  for (i = 0; i < n; i++) {
    var a = 0, sc = 1;
    if (anim.has(i)) { var t = Math.min((now - anim.get(i)) / 190, 1); a = -(1 - back(t)) * Math.PI / 2; if (t >= 1) anim.delete(i); }
    if (press.has(i)) { var u = (now - press.get(i)) / 220; if (u < 1) sc *= 1 - .09 * Math.sin(u * Math.PI); else press.delete(i); }
    if (phase === 'win' || phase === 'end') { var w = (now - winAt - L.d[i] * 45) / 320; if (w > 0 && w < 1) sc *= 1 + Math.sin(w * Math.PI) * .1; }
    X.push([ox + (i % P.cols) * s + s / 2, oy + (i / P.cols | 0) * s + s / 2, a, sc]);
    on.push(L.d[i] >= 0 && now >= litAt[i]);
  }
  // 1) zemin
  cx.beginPath();
  for (i = 0; i < n; i++) { var q = X[i], ww = (s - 6) * q[3]; rrp(q[0] - ww / 2, q[1] - ww / 2, ww, ww, s * .24 * q[3]); }
  cx.fillStyle = 'rgba(255,255,255,.045)'; cx.fill(); cx.lineWidth = 1; cx.strokeStyle = 'rgba(255,255,255,.09)'; cx.stroke();
  cx.beginPath();
  for (i = 0; i < n; i++) if (on[i]) { var q2 = X[i], w2 = (s - 6) * q2[3]; rrp(q2[0] - w2 / 2, q2[1] - w2 / 2, w2, w2, s * .24 * q2[3]); }
  cx.fillStyle = rgba(col, .07); cx.fill();
  // 2) raylar: sönük → ışıma → yanan
  cx.lineCap = 'round';
  function rails(f) { cx.beginPath(); for (var j = 0; j < n; j++) if (f(j)) railPath(X[j], cur[j], s * X[j][3]); cx.stroke(); }
  cx.lineWidth = s * .17; cx.strokeStyle = '#535a7a'; rails(function (j) { return !on[j]; });
  cx.lineWidth = s * .38; cx.strokeStyle = rgba(col, .22); rails(function (j) { return on[j]; });
  cx.lineWidth = s * .17; cx.strokeStyle = col; rails(function (j) { return on[j]; });
  // 3) yeni yanan karoda parlama (karo sınırına kırpılır)
  for (i = 0; i < n; i++) {
    if (!on[i]) continue;
    var tt = (now - litAt[i]) / 420; if (tt >= 1 || tt <= 0) continue;
    cx.save(); cx.beginPath(); cx.rect(X[i][0] - s / 2, X[i][1] - s / 2, s, s); cx.clip();
    cx.strokeStyle = 'rgba(255,255,255,' + (.65 * (1 - tt)) + ')'; cx.lineWidth = s * .17; cx.beginPath(); railPath(X[i], cur[i], s); cx.stroke(); cx.restore();
  }
  // 4) duraklar (tek kollu karolar)
  function dots(f, r) { cx.beginPath(); for (var j = 0; j < n; j++) if (j !== P.hub && popc(cur[j]) === 1 && f(j)) { var q = X[j]; cx.moveTo(q[0] + r * q[3], q[1]); cx.arc(q[0], q[1], r * q[3], 0, 7); } }
  dots(function (j) { return on[j]; }, s * .27); cx.fillStyle = rgba(col, .22); cx.fill();
  cx.lineWidth = s * .065;
  dots(function (j) { return on[j]; }, s * .15); cx.fillStyle = '#fff'; cx.fill(); cx.strokeStyle = col; cx.stroke();
  dots(function (j) { return !on[j]; }, s * .15); cx.fillStyle = '#0d1020'; cx.fill(); cx.strokeStyle = '#8b92ab'; cx.stroke();
  // 5) merkez istasyon
  var hq = X[P.hub], kk = s * hq[3];
  cx.fillStyle = rgba(col, .25); cx.beginPath(); cx.arc(hq[0], hq[1], kk * .36, 0, 7); cx.fill();
  var gr = cx.createLinearGradient(hq[0] - kk * .2, hq[1] - kk * .2, hq[0] + kk * .2, hq[1] + kk * .2); gr.addColorStop(0, rgba(col, 1)); gr.addColorStop(1, rgba(col, .78));
  cx.fillStyle = gr; rr(hq[0] - kk * .22, hq[1] - kk * .22, kk * .44, kk * .44, kk * .12); cx.fill();
  cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(hq[0], hq[1], kk * .075, 0, 7); cx.fill();
  // 6) ipucu: nabız halkası + parmak
  var h = hint();
  if (h >= 0 && now > 0 && fadeOutAt === null && now - introAt > 350) {
    var c = X[h], p = ((now - Math.max(0, introAt, lastTap)) % 1500) / 1500, w3 = s - 6;
    var ring = function (gg, al, lw) { cx.strokeStyle = rgba(col, al); cx.lineWidth = lw; rr(c[0] - gg / 2, c[1] - gg / 2, gg, gg, s * .24 + (gg - w3) * .3); cx.stroke(); };
    ring(w3 + 6, .95, 3); ring(w3 + 6 + ease(p) * s * .26, .6 * (1 - p), 2 + 4 * (1 - p));
    finger(c[0], c[1], p, s);
  }
  // 7) dokunma dalgaları, 8) kıvılcımlar
  cx.lineWidth = 2.5;
  ripples = ripples.filter(function (r) { var t = (now - r.t) / 420; if (t >= 1) return false; cx.strokeStyle = rgba(col, .45 * (1 - t)); cx.beginPath(); cx.arc(r.x, r.y, s * (.2 + .55 * ease(t)), 0, 7); cx.stroke(); return true; });
  parts = parts.filter(function (p) {
    var t = (now - p.t) / p.life; if (t >= 1) return false; if (t < 0) return true;
    var age = (now - p.t) / 1000; cx.fillStyle = rgba(p.c, 1 - t);
    cx.beginPath(); cx.arc(p.x + p.vx * age, p.y + p.vy * age + 260 * age * age, p.r * (1 - t * .6), 0, 7); cx.fill(); return true;
  });
  cx.globalAlpha = 1; cx.setTransform(1, 0, 0, 1, 0, 0);
}
function burst(i, kn, delay) {
  var c = centre(i), t = now + delay;
  for (var j = 0; j < kn; j++) {
    var a = j / kn * Math.PI * 2 + (j * 1.7 % 1) * .5, v = geo.s * (1.2 + (j * .37 % 1) * 1.4);
    parts.push({ x: c[0], y: c[1], vx: Math.cos(a) * v, vy: Math.sin(a) * v - geo.s * .6, t: t, life: 520 + (j * 53 % 300), r: 1.6 + (j * .61 % 1) * 2.4, c: j % 3 === 0 ? '#fff6e6' : P.color });
  }
}

// ---------- oyun akışı ----------
function tap(i) {
  if (phase !== 'play' || i === P.hub) return;
  var prev = L;
  cur[i] = rot(cur[i]); taps++; lastTap = now;
  anim.set(i, now); press.set(i, now);
  var c = centre(i); ripples.push({ t: now, x: c[0], y: c[1] });
  L = lit(P, cur); settle(prev);
  if (pi === 0) setCap(taps >= 3 ? T.c3 : taps >= 1 ? T.c2 : T.c1);
  if (L.solved) win();
}
function win() {
  phase = 'win';
  var mx = 0, i; for (i = 0; i < L.d.length; i++) mx = Math.max(mx, litAt[i] - now);
  winAt = now + mx + 120;
  for (i = 0; i < cur.length; i++) if (i !== P.hub && popc(cur[i]) === 1) burst(i, 12, mx + 120 + L.d[i] * 45);
  later(mx + 60, function () { setCap('<b>' + T.win + '</b> 🎉'); });
  var k = pi;
  if (k + 1 < PUZ.length) {
    later(mx + 1500, function () { fadeOutAt = now; });
    later(mx + 1830, function () { start(k + 1); });
  } else later(mx + 1500, showEnd);
}
function showEnd() { if (phase === 'end') return; phase = 'end'; endAt = now; if (winAt === undefined) winAt = now; }

function tick(ts) {
  if (last === null) last = ts;
  var dt = Math.min(Math.max(ts - last, 0), 60); last = ts; now += dt;
  for (var i = timers.length - 1; i >= 0; i--) if (now >= timers[i].at) { var f = timers[i].fn; timers.splice(i, 1); f(); }
  if (phase !== 'end' && now >= LIMIT) showEnd();
  var e = phase === 'end' ? ease(Math.min(1, (now - endAt) / 700)) : 0;
  app.style.setProperty('--e', e.toFixed(4));
  app.style.setProperty('--p', (Math.sin(now / 260) * .5 + .5).toFixed(3));
  app.classList.toggle('end', e > .5);
  draw();
  requestAnimationFrame(tick);
}

function onResize() {
  var w = window.innerWidth, h = window.innerHeight, u = Math.max(.7, Math.min(3, Math.min(w, h) / 360));
  app.style.setProperty('--u', u.toFixed(3) + 'px');
}

// ---------- bitiş kartı ----------
function platform() { return window.RayCTA.platform(); }
function setupCard() {
  $('tag').textContent = T.tag; $('dlt').textContent = T.dl; $('ico').alt = T.alt;
  var p = platform(), b = $('badges');
  if (!TR) { b.style.display = 'none'; }   // İngilizce rozet yok: Türkçe rozet yabancı cihazda gösterilmez, yalnız düğme
  else {
    $('bIos').style.display = p === 'android' ? 'none' : '';
    $('bAnd').style.display = p === 'ios' ? 'none' : '';
  }
  $('dl').addEventListener('click', function () { window.RayCTA.openStore(); });
  $('bIos').addEventListener('click', function () { window.RayCTA.openStore('ios'); });
  $('bAnd').addEventListener('click', function () { window.RayCTA.openStore('android'); });
}

function begin() {
  onResize(); window.addEventListener('resize', onResize);
  setupCard();
  cv.addEventListener('pointerdown', function (e) {
    if (!P) return;
    var r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    var c = Math.floor((px - geo.ox) / geo.s), w = Math.floor((py - geo.oy) / geo.s);
    if (c < 0 || w < 0 || c >= P.cols || w >= P.rows) return;
    tap(w * P.cols + c);
  });
  start(0);
  if (location.hash === '#test') window.__ray = {
    tiles: function () { var r = cv.getBoundingClientRect(); return cur.map(function (_, i) { var c = centre(i); return { x: r.left + c[0], y: r.top + c[1] }; }); },
    state: function () { return { puz: pi, phase: phase, cur: cur.slice(), sol: P.sol.slice(), hint: hint(), taps: taps, now: now, hub: P.hub, solved: L.solved }; }
  };
  requestAnimationFrame(tick);
}
window.RayCTA.whenReady(begin);
})();
