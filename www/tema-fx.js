// 🎨 Tema efektleri (taslak · önizleme): sefer şeridindeki trene temaya göre süs + parçacık, bölüm bitince ekrana yağan parçacık.
// Şerit yandan görünüştür: ray zemin, yerçekimi aşağı. Tahtaya dokunmaz; yağan parçacıklar ekranın dibinde birikir.
// Dışarıdan: FX.set(id) · FX.step(dt) (önizlemede elle) · FX.win() · FX.auto(true) (gerçek oyunda rAF ile)
const FX = (() => {
  const PAD_X = 34, PAD_Y = 30;
  let meltA = 1, fxs = [], melting = false, lastX = null, id = null, cv = null, cx = null, parts = [], rain = [], rcv = null, rcx = null, rainT = 0, t = 0, lastP = 0, raf = 0, dpr = 2;
  let pile = null, landed = [];   // ekran dibi: kar yığını yükseklik haritası (2 px sütun) · yere düşen yapraklar
  const rnd = (a, b) => a + Math.random() * (b - a);
  const THEMES = {
    kis: { rail: '#e9f6ff', tb: ['#c2405a', '#3d7bd9', '#fff6dc'] },
    erguvan: { rail: null, tb: ['#b04fae', '#7b5bd6', '#ffe3f4'], petals: ['#e07ad6', '#ff9fc8', '#f3b4ff', '#c86bd0', '#ffd0ea'] },
  };
  // yumuşak değer gürültüsü (sabit tohum): şerit koordinatına bağlı → tren yürürken kar yığını kıpırdamaz
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const noise = x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash(i) * (1 - u) + hash(i + 1) * u; };
  function mount() {
    const trip = document.getElementById('gTrip');
    if (!trip || cv) return;
    cv = document.createElement('canvas'); cv.className = 'fxc';
    Object.assign(cv.style, { position: 'absolute', pointerEvents: 'none', zIndex: 4 });
    trip.appendChild(cv); cx = cv.getContext('2d');
    rcv = document.createElement('canvas'); rcv.className = 'fxr';
    Object.assign(rcv.style, { position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 60 });
    document.body.appendChild(rcv); rcx = rcv.getContext('2d');
  }
  function size() {
    const trk = document.querySelector('#gTrip .trk'), r = trk.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 3);
    const w = r.width + PAD_X * 2, h = r.height + PAD_Y * 2;
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px'; }
    const trip = document.getElementById('gTrip').getBoundingClientRect();
    cv.style.left = (r.left - trip.left - PAD_X) + 'px'; cv.style.top = (r.top - trip.top - PAD_Y) + 'px';
    if (rcv.width !== Math.round(innerWidth * dpr)) { rcv.width = Math.round(innerWidth * dpr); rcv.height = Math.round(innerHeight * dpr); }
    return { W: r.width };
  }
  function trainBox() {
    const trk = document.querySelector('#gTrip .trk').getBoundingClientRect(), mv = document.querySelector('#gTrip .trn').getBoundingClientRect();
    return { x0: mv.left - trk.left + PAD_X, x1: mv.right - trk.left + PAD_X, y: PAD_Y + 9, top: PAD_Y + 3, bot: PAD_Y + 15 };
  }
  function set(n) {
    const T = THEMES[n] || window.FX_EXTRA?.[n];
    id = T ? n : null; parts = []; rain = []; landed = []; fxs = []; pile = null; lastX = null; mount();
    const trip = document.getElementById('gTrip');
    if (T?.rail) trip.style.setProperty('--line', T.rail); else trip.style.removeProperty('--line');
    ['--tb1', '--tb2', '--tw'].forEach((k, i) => T ? trip.style.setProperty(k, T.tb[i]) : trip.style.removeProperty(k));
  }

  // ---------- ❄️ Kar Feneri: rayın üstünde kar örtüsü; tren küreği karı yukarı-ileri savurur, kar tozu bulutu kalkar ----------
  const bankH = x => 3.2 + noise(x / 9) * 2.6 + noise(x / 2.7 + 40) * .8;   // kar örtüsü kalınlığı (px), şerit x'ine bağlı
  function snowBank(c, B, W) {
    const x0 = B.x1 + 1, x1 = PAD_X + W;   // peron dahil sonuna dek
    if (x1 <= x0 + 2) return;
    const g = c.createLinearGradient(0, B.y - 7, 0, B.y + 3);
    g.addColorStop(0, '#ffffff'); g.addColorStop(.55, '#e6f1fb'); g.addColorStop(1, '#b9cde3');
    c.fillStyle = g; c.beginPath(); c.moveTo(x0, B.y + 2.2);
    // trenin önünde küreğin ittiği kabarık dalga: önce yükselir, sonra normal örtüye iner
    for (let x = Math.ceil(x0); x <= x1; x += 1) { const d = x - x0, push = Math.max(0, 1 - d / 9) * 3.4; c.lineTo(x, B.y + .5 - bankH(x) - push * Math.sin(Math.min(1, d / 3) * Math.PI / 2)); }
    c.lineTo(x1, B.y + 2.2); c.closePath(); c.fill();
    // üst kenarda ince parıltı (sabit noktalar)
    c.fillStyle = 'rgba(255,255,255,.95)';
    for (let x = Math.ceil(x0 + 6); x < x1; x++) if (hash(x * 3.1) > .9) c.fillRect(x, B.y + .5 - bankH(x) + .4, .8, .8);
  }
  function plow(c, B) {
    const x = B.x1 - 1;
    c.fillStyle = '#d8434a';
    c.beginPath(); c.moveTo(x - 1, B.top + 2); c.quadraticCurveTo(x + 5.5, B.y + 1, x + 2, B.bot + 1.5); c.lineTo(x - 1, B.bot + 1.5); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(x, B.top + 4, .8, 7);
    // far: karın üstüne düşen sıcak ışık
    const g = c.createRadialGradient(x + 3, B.y - 1, .5, x + 14, B.y - 1, 22);
    g.addColorStop(0, 'rgba(255,230,160,.45)'); g.addColorStop(1, 'rgba(255,230,160,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(x + 3, B.y - 1); c.lineTo(x + 34, B.y - 9); c.lineTo(x + 34, B.y + 4); c.closePath(); c.fill();
  }
  function emitSnow(B, speed, dt) {
    const rate = speed > .02 ? 36 + speed * 11 : 0;   // tren durunca savrulma da durur
    let n = rate * dt; while (n > 0) { if (n < 1 && Math.random() > n) break; n--;
      const big = Math.random() < .25;
      parts.push({ k: 'snow', x: B.x1 + rnd(1, 4), y: B.y - rnd(2, 7), vx: rnd(55, 115), vy: -rnd(28, 70), r: big ? rnd(.9, 1.5) : rnd(.35, .8), life: 0, max: rnd(.9, 1.6) });
    }
    if (speed > .02 && Math.random() < 14 * dt) parts.push({ k: 'mist', x: B.x1 + rnd(2, 6), y: B.y - rnd(3, 8), vx: rnd(8, 22), vy: -rnd(6, 16), r: rnd(2, 3.5), life: 0, max: rnd(.7, 1.2) });
  }
  // ---------- 🌸 Erguvan: tavandan kopan yapraklar rüzgârla geriye savrulur, takla atar, bir kısmı raya düşer ----------
  function emitPetal(B, speed) {
    const n = speed > .2 ? (Math.random() < .55 + speed * .08 ? 1 + (Math.random() < speed * .1 ? 1 : 0) : 0) : (Math.random() < .08 ? 1 : 0);
    const P = THEMES.erguvan.petals;
    for (let i = 0; i < n; i++) parts.push({ k: 'petal', x: rnd(B.x0 + 2, B.x1 - 6), y: B.top + rnd(-1, 3), vx: -rnd(18, 45) - speed * 3, vy: rnd(-22, 14), w: rnd(2.2, 3.4), h: rnd(1.3, 2), a: rnd(0, 6.28), va: rnd(-6, 6), flip: rnd(0, 6.28), vf: rnd(4, 9), sw: rnd(0, 6.28), col: P[Math.random() * P.length | 0], life: 0, max: rnd(1.4, 2.4) });
  }
  function stepParts(dt, B) {
    for (const p of parts) {
      p.life += dt;
      if (p.st) p.st(p, dt);
      else if (p.k === 'snow') {
        p.vy += 260 * dt; p.vx *= Math.pow(.5, dt); p.x += p.vx * dt; p.y += p.vy * dt;
        const ground = B.y + .5 - bankH(p.x);   // örtüye düşen tane örtüye karışır
        if (p.vy > 0 && p.y >= ground && p.x > B.x1) p.life = p.max;
        if (p.y > B.y + 1) p.life = p.max;
      } else if (p.k === 'mist') {
        p.x += p.vx * dt; p.y += p.vy * dt; p.r += 6 * dt; p.vx *= Math.pow(.4, dt);
      } else {
        p.sw += dt * 3; p.x += (p.vx + Math.sin(p.sw) * 10) * dt; p.y += (p.vy + Math.cos(p.sw * .8) * 12) * dt;
        p.vx *= Math.pow(.55, dt); p.vy += 6 * dt; p.a += p.va * dt; p.flip += p.vf * dt;
      }
    }
    parts = parts.filter(p => p.life < p.max);
  }
  function drawParts(c) {
    for (const p of parts) {
      const f = 1 - p.life / p.max;
      if (p.dr) { c.save(); p.dr(c, p, f); c.restore(); }
      else if (p.k === 'mist') {
        const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, `rgba(240,248,255,${.28 * f})`); g.addColorStop(1, 'rgba(240,248,255,0)');
        c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.283); c.fill();
      } else if (p.k === 'snow') {
        c.globalAlpha = Math.min(1, f * 3) * .95; c.fillStyle = '#f7fbff';
        c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.283); c.fill();
      } else {
        c.save(); c.translate(p.x, p.y); c.rotate(p.a); c.scale(1, Math.max(.15, Math.abs(Math.cos(p.flip))));
        c.globalAlpha = Math.min(1, f * 2.2); c.fillStyle = p.col;
        c.beginPath(); c.moveTo(-p.w, 0); c.quadraticCurveTo(0, -p.h * 1.6, p.w, 0); c.quadraticCurveTo(0, p.h * 1.1, -p.w, 0); c.fill();
        c.restore();
      }
    }
    c.globalAlpha = 1;
  }
  function railPetals(c, B) {
    const P = THEMES.erguvan.petals;
    for (let x = PAD_X + 4; x < B.x0 - 3; x += 9) {
      const s = hash(x * .37); if (s < .45) continue;
      c.save(); c.translate(x, B.y + (s - .7) * 8); c.rotate(s * 6); c.globalAlpha = .85; c.fillStyle = P[(s * 100 | 0) % P.length];
      c.beginPath(); c.ellipse(0, 0, 2.2, 1.1, 0, 0, 6.283); c.fill(); c.restore();
    }
  }
  function render(dt) {
    if (!id || !cv) return;
    t += dt;
    const { W } = size(), c = cx, B = trainBox();
    const speed = lastX == null ? 0 : Math.max(0, (B.x1 - lastX) / Math.max(dt, 1e-3) / 4); lastX = B.x1;   // ~px/sn ÷ 4
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
    if (id === 'kis') { snowBank(c, B, W); emitSnow(B, speed, dt); }
    if (id === 'erguvan') { railPetals(c, B); emitPetal(B, speed); }
    const X = window.FX_EXTRA?.[id];
    if (X) X.under?.(c, B, W, t, speed, dt, parts);
    stepParts(dt, B); drawParts(c);
    if (id === 'kis') plow(c, B);
    if (X) X.over?.(c, B, W, t, speed);
    renderRain(dt);
  }

  // ---------- bölüm bitince: ekrana yağar, dipte birikir (kar yığılır, yapraklar halı olur) ----------
  function win() {
    if (!id) return; mount(); size(); rainT = 4.2; rain = []; melting = false;
    if (!pile) pile = new Float32Array(Math.ceil(innerWidth / 2) + 2);
    const X = window.FX_EXTRA?.[id]; if (X) { fxs = X.win(innerWidth, innerHeight) || []; return; }
    const P = THEMES.erguvan?.petals;
    const n = id === 'kis' ? 234 : 110;
    for (let i = 0; i < n; i++) {
      const z = Math.random();   // derinlik: 0 uzak (küçük, yavaş, soluk) · 1 yakın
      rain.push(id === 'kis'
        ? { k: 'flake', z, x: rnd(0, innerWidth), y: rnd(-innerHeight * .9, innerHeight * .75), vy: 45 + z * 85, r: .7 + z * z * 2.6, sw: rnd(0, 6.28), sf: rnd(.6, 1.4) }
        : { k: 'petal', z, x: rnd(-60, innerWidth), y: rnd(-innerHeight * .7, innerHeight * .6), vy: rnd(60, 125), vx: rnd(20, 60), w: rnd(4, 7), h: rnd(2.4, 3.8), a: rnd(0, 6.28), va: rnd(-4, 4), flip: rnd(0, 6.28), vf: rnd(3, 7), sw: rnd(0, 6.28), col: P[Math.random() * P.length | 0] });
    }
  }
  const PILE_MAX = 22;
  function addPile(x, amt) {
    const i = Math.max(0, Math.min(pile.length - 1, Math.round(x / 2)));
    for (let k = -4; k <= 4; k++) { const j = i + k; if (j < 0 || j >= pile.length) continue; pile[j] = Math.min(PILE_MAX, pile[j] + amt * Math.exp(-k * k / 6)); }
  }
  function drawPile(c) {
    if (!pile) return;
    const H = innerHeight;
    // sütunları yumuşat (kar kendi açısıyla yayılır)
    for (let s = 0; s < 2; s++) for (let i = 1; i < pile.length - 1; i++) pile[i] = pile[i] * .9 + (pile[i - 1] + pile[i + 1]) * .05;
    if (pile.every(v => v < .3)) return;
    const g = c.createLinearGradient(0, H - PILE_MAX - 2, 0, H);
    g.addColorStop(0, '#ffffff'); g.addColorStop(.5, '#e4eef9'); g.addColorStop(1, '#a9bed8');
    c.fillStyle = g; c.beginPath(); c.moveTo(0, H);
    for (let i = 0; i < pile.length; i++) c.lineTo(i * 2, H - pile[i] - noise(i * .35) * Math.min(1.2, pile[i] * .2));
    c.lineTo(innerWidth, H); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.9)';
    for (let i = 0; i < pile.length; i += 1) if (pile[i] > 3 && hash(i * 7.7) > .93) c.fillRect(i * 2, H - pile[i] + 1, 1, 1);
  }
  function renderRain(dt) {
    if (!rcx) return;
    const c = rcx, H = innerHeight; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, innerWidth, H);
    if (rainT > 0) rainT -= dt;
    const fall = rainT > 0;
    for (const q of rain) {
      if (q.done) continue;
      if (!fall && q.y < 0) { q.done = 1; continue; }
      q.sw += dt * (q.sf || 1) * (q.k === 'flake' ? 1.3 : 1.6); q.y += q.vy * dt;
      if (q.k === 'flake') {
        q.x += Math.sin(q.sw) * (8 + q.z * 14) * dt;
        const floor = H - (pile[Math.max(0, Math.min(pile.length - 1, Math.round(q.x / 2)))] || 0);
        if (q.y + q.r >= floor) { if (q.z > .25) addPile(q.x, 1.6 + q.r * .7); q.done = 1; continue; }
        const g = c.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r * 1.6);
        const a = .35 + q.z * .6;
        g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(.45, `rgba(240,247,255,${a * .8})`); g.addColorStop(1, 'rgba(240,247,255,0)');
        c.fillStyle = g; c.beginPath(); c.arc(q.x, q.y, q.r * 1.6, 0, 6.283); c.fill();
      } else {
        q.x += (q.vx + Math.sin(q.sw) * 30) * dt; q.a += q.va * dt; q.flip += q.vf * dt;
        if (q.y >= H - 4 - hash(q.x) * 6) { landed.push({ x: q.x, y: q.y, a: q.a, w: q.w, h: q.h, col: q.col }); q.done = 1; continue; }
        c.save(); c.translate(q.x, q.y); c.rotate(q.a); c.scale(1, Math.max(.15, Math.abs(Math.cos(q.flip))));
        c.fillStyle = q.col;
        c.beginPath(); c.moveTo(-q.w, 0); c.quadraticCurveTo(0, -q.h * 1.6, q.w, 0); c.quadraticCurveTo(0, q.h * 1.1, -q.w, 0); c.fill();
        c.restore();
      }
    }
    for (const q of fxs) { if (q.done) continue; c.save(); if (q.st(q, dt, c, rainT > 0) === false) q.done = 1; c.restore(); }
    for (const q of fxs) if (q.done === 1 && q.land) { landed.push(q.land); q.done = 2; }
    if (melting) { if (pile) for (let i = 0; i < pile.length; i++) pile[i] *= Math.pow(.3, dt); meltA = Math.max(0, meltA - dt / 2.5); if (meltA <= 0) { landed = []; pile = null; melting = false; } }
    c.globalAlpha = melting ? meltA : 1;
    drawPile(c);
    for (const l of landed) {   // dipte yatan yapraklar (yassı, üst üste)
      if (l.dr) { c.save(); l.dr(c, l); c.restore(); continue; }
      c.save(); c.translate(l.x, l.y); c.rotate(l.a); c.scale(1, .55); c.globalAlpha *= .92; c.fillStyle = l.col;
      c.beginPath(); c.moveTo(-l.w, 0); c.quadraticCurveTo(0, -l.h * 1.6, l.w, 0); c.quadraticCurveTo(0, l.h * 1.1, -l.w, 0); c.fill();
      c.restore();
    }
    c.globalAlpha = 1;
  }
  function auto(on) {
    cancelAnimationFrame(raf); if (!on) return;
    let last = performance.now();
    const loop = now => { render(Math.min(.05, (now - last) / 1000)); last = now; raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
  }
  // sonraki bölüm başlarken: dipteki kar/yaprak/şeker 2,5 sn'de yavaşça erir
  function melt() { if (pile || landed.length) { melting = true; meltA = 1; } rainT = 0; rain = []; fxs = []; }
  return { set, step: render, win, auto, melt, rnd, hash, noise, glow: null };
})();
