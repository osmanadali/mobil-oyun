// 🎨 Tema efektleri (taslak · önizleme): sefer şeridindeki trene temaya göre süs + parçacık, bölüm bitince ekrana yağan parçacık.
// Tahtaya dokunmaz: yalnız şeridin çevresinde ve kazanma anında, pointer-events yok. Hareketi azalt açıksa parçacık yok.
// Dışarıdan: FX.set(id) · FX.step(dt) (önizlemede elle) · FX.win() · FX.auto(true) (gerçek oyunda rAF ile)
const FX = (() => {
  const PAD_X = 34, PAD_Y = 30;
  let id = null, cv = null, cx = null, parts = [], rain = [], rcv = null, rcx = null, rainT = 0, t = 0, lastP = 0, raf = 0, dpr = 2;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const THEMES = {
    kis: { rail: '#e9f6ff', tb: ['#c2405a', '#3d7bd9', '#fff6dc'], petals: null },
    erguvan: { rail: null, tb: ['#b04fae', '#7b5bd6', '#ffe3f4'], petals: ['#e07ad6', '#ff9fc8', '#f3b4ff', '#c86bd0', '#ffd0ea'] },
  };
  function mount() {
    const trip = document.getElementById('gTrip');
    if (!trip || cv) return;
    cv = document.createElement('canvas'); cv.className = 'fxc';
    Object.assign(cv.style, { position: 'absolute', left: -PAD_X + 'px', top: -PAD_Y + 'px', pointerEvents: 'none', zIndex: 4 });
    trip.appendChild(cv); cx = cv.getContext('2d');
    rcv = document.createElement('canvas'); rcv.className = 'fxr';
    Object.assign(rcv.style, { position: 'fixed', inset: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 60 });
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
    return { W: r.width, H: r.height };
  }
  // trenin şeritteki yeri (tuval koordinatı): .mv kutusu
  function trainBox() {
    const trk = document.querySelector('#gTrip .trk').getBoundingClientRect(), mv = document.querySelector('#gTrip .trn').getBoundingClientRect();
    return { x0: mv.left - trk.left + PAD_X, x1: mv.right - trk.left + PAD_X, y: PAD_Y + 9, top: PAD_Y + 3, bot: PAD_Y + 15 };
  }
  function set(n) {
    id = THEMES[n] ? n : null; parts = []; mount();
    const trip = document.getElementById('gTrip');
    trip.dataset.fx = id || '';
    if (id && THEMES[id].rail) trip.style.setProperty('--line', THEMES[id].rail); else trip.style.removeProperty('--line');
    ['--tb1', '--tb2', '--tw'].forEach((k, i) => id ? trip.style.setProperty(k, THEMES[id].tb[i]) : trip.style.removeProperty(k));
  }
  // --- ❄️ kar küreyici: önde kar yığını (ray boyunca), küreğe çarpan kar iki yana savrulur, arkada temiz buzlu ray ---
  function snowBank(c, B, W) {
    const x0 = B.x1 + 3, x1 = PAD_X + W - 44;   // peronun önüne dek
    if (x1 <= x0) return;
    c.fillStyle = 'rgba(226,240,255,.78)';
    c.beginPath(); c.moveTo(x0, B.y + 3);
    for (let x = x0; x <= x1; x += 3) { const h = 2.6 + Math.sin(x * .9) * .7 + Math.sin(x * .31 + 1) * .9; c.lineTo(x, B.y - h); }
    for (let x = x1; x >= x0; x -= 3) { const h = 2.2 + Math.cos(x * .7) * .6 + Math.sin(x * .23) * .8; c.lineTo(x, B.y + 1.5 + h); }
    c.closePath(); c.fill();
    // yığının kar tozu parıltısı
    c.fillStyle = 'rgba(255,255,255,.9)';
    for (let x = x0 + 2; x < x1; x += 7) { const s = (Math.sin(x * 12.9898) * 43758.5453) % 1; if (Math.abs(s) > .55) c.fillRect(x, B.y - 2.5 + Math.abs(s) * 3, 1, 1); }
    // trenin önündeki küreme kabarması
    c.beginPath(); c.ellipse(x0 + 2, B.y, 4.5, 6.5, 0, -Math.PI / 2, Math.PI / 2); c.fill();
  }
  function plow(c, B) {
    const x = B.x1 - 1;
    c.fillStyle = '#ff6b5a'; c.strokeStyle = '#ffd0c8'; c.lineWidth = .8;
    c.beginPath(); c.moveTo(x - 1, B.top - 2.5); c.lineTo(x + 5, B.y); c.lineTo(x - 1, B.bot + 2.5); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = .7;
    c.beginPath(); c.moveTo(x + .5, B.top); c.lineTo(x + 3.6, B.y - 1.2); c.moveTo(x + .5, B.bot); c.lineTo(x + 3.6, B.y + 1.2); c.stroke();
    // far: ileriye sıcak ışık konisi karın üstüne düşer
    const g = c.createRadialGradient(x + 4, B.y, 1, x + 30, B.y, 34);
    g.addColorStop(0, 'rgba(255,226,150,.35)'); g.addColorStop(1, 'rgba(255,226,150,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(x + 4, B.y); c.lineTo(x + 46, B.y - 9); c.lineTo(x + 46, B.y + 9); c.closePath(); c.fill();
  }
  function emitSnow(B, speed) {
    const n = Math.random() < .5 ? 1 : Math.min(4, 1 + speed * .5);
    for (let i = 0; i < n; i++) {
      const side = Math.random() < .5 ? -1 : 1;
      parts.push({ k: 'snow', x: B.x1 + rnd(2, 6), y: B.y + side * rnd(0, 3), vx: rnd(25, 60) + speed * 3, vy: side * rnd(45, 95), z: 0, vz: rnd(30, 70), r: rnd(.5, 1.4), life: 0, max: rnd(.6, 1.1) });
    }
  }
  // --- 🌸 erguvan: tavandan kopan yapraklar rüzgârla geriye savrulur, takla atar, bir kısmı raya düşer ---
  function emitPetal(B, speed) {
    const n = speed > .2 ? (Math.random() < .55 + speed * .08 ? 1 + (Math.random() < speed * .1 ? 1 : 0) : 0) : (Math.random() < .08 ? 1 : 0);
    const P = THEMES.erguvan.petals;
    for (let i = 0; i < n; i++) parts.push({ k: 'petal', x: rnd(B.x0 + 2, B.x1 - 6), y: B.top + rnd(-1, 3), vx: -rnd(18, 45) - speed * 3, vy: rnd(-22, 14), w: rnd(2.2, 3.4), h: rnd(1.3, 2), a: rnd(0, 6.28), va: rnd(-6, 6), flip: rnd(0, 6.28), vf: rnd(4, 9), sw: rnd(0, 6.28), col: P[Math.random() * P.length | 0], life: 0, max: rnd(1.4, 2.4) });
  }
  function stepParts(dt) {
    for (const p of parts) {
      p.life += dt;
      if (p.k === 'snow') {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(.18, dt); p.vy *= Math.pow(.12, dt);
        p.z += p.vz * dt; p.vz -= 160 * dt; if (p.z < 0) { p.z = 0; p.vz *= -.2; p.vx *= .5; p.vy *= .5; }
      } else {
        p.sw += dt * 3; p.x += (p.vx + Math.sin(p.sw) * 10) * dt; p.y += (p.vy + Math.cos(p.sw * .8) * 12) * dt;
        p.vx *= Math.pow(.55, dt); p.vy += 6 * dt; p.a += p.va * dt; p.flip += p.vf * dt;
      }
    }
    parts = parts.filter(p => p.life < p.max);
  }
  function drawParts(c) {
    for (const p of parts) {
      const f = 1 - p.life / p.max, al = Math.min(1, f * 2.2);
      if (p.k === 'snow') {
        c.globalAlpha = al; c.fillStyle = '#f4faff';
        c.beginPath(); c.arc(p.x, p.y - p.z * .25, p.r * (1 + p.z * .02), 0, 6.283); c.fill();
      } else {
        c.save(); c.translate(p.x, p.y); c.rotate(p.a); c.scale(1, Math.max(.15, Math.abs(Math.cos(p.flip))));
        c.globalAlpha = al; c.fillStyle = p.col;
        c.beginPath(); c.moveTo(-p.w, 0); c.quadraticCurveTo(0, -p.h * 1.6, p.w, 0); c.quadraticCurveTo(0, p.h * 1.1, -p.w, 0); c.fill();
        c.restore();
      }
    }
    c.globalAlpha = 1;
  }
  // arkada kalan rayın üstünde düşmüş yapraklar (sabit desen, tren geçtikçe görünür)
  function railPetals(c, B) {
    const P = THEMES.erguvan.petals;
    for (let x = PAD_X + 4; x < B.x0 - 3; x += 9) {
      const s = Math.abs(Math.sin(x * 78.233) * 43758.5453) % 1; if (s < .45) continue;
      c.save(); c.translate(x, B.y + (s - .7) * 8); c.rotate(s * 6); c.globalAlpha = .85; c.fillStyle = P[(s * 100 | 0) % P.length];
      c.beginPath(); c.ellipse(0, 0, 2.2, 1.1, 0, 0, 6.283); c.fill(); c.restore();
    }
  }
  function render(dt) {
    if (!id || !cv) return;
    t += dt;
    const { W } = size(), c = cx, B = trainBox();
    const p = parseFloat(getComputedStyle(document.getElementById('gTrip')).getPropertyValue('--p')) || 0;
    const speed = Math.max(0, (p - lastP) / Math.max(dt, 1e-3) * 60); lastP = p;   // şerit başına hız (yaklaşık)
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
    if (id === 'kis') { snowBank(c, B, W); if (speed > .05 || Math.random() < .25) emitSnow(B, speed); }
    if (id === 'erguvan') { railPetals(c, B); emitPetal(B, speed); }
    stepParts(dt); drawParts(c);
    if (id === 'kis') plow(c, B);
    renderRain(dt);
  }
  // --- bölüm bitince yağan parçacıklar (3,5 sn) ---
  function win() {
    if (!id) return; mount(); size(); rainT = 3.6; rain = [];
    const n = id === 'kis' ? 130 : 90, P = THEMES.erguvan.petals;
    for (let i = 0; i < n; i++) rain.push(id === 'kis'
      ? { k: 'flake', x: rnd(0, innerWidth), y: rnd(-innerHeight * .9, -10), vy: rnd(40, 110), r: rnd(1.2, 4.2), sw: rnd(0, 6.28), a: rnd(0, 6.28), six: Math.random() < .35 }
      : { k: 'petal', x: rnd(-60, innerWidth), y: rnd(-innerHeight * .9, -10), vy: rnd(55, 120), vx: rnd(20, 60), w: rnd(4, 7), h: rnd(2.4, 3.8), a: rnd(0, 6.28), va: rnd(-4, 4), flip: rnd(0, 6.28), vf: rnd(3, 7), sw: rnd(0, 6.28), col: P[Math.random() * P.length | 0] });
  }
  function renderRain(dt) {
    if (!rcx) return;
    const c = rcx; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, innerWidth, innerHeight);
    if (rainT <= 0) return;
    rainT -= dt; const fade = Math.min(1, rainT / .9);
    for (const q of rain) {
      q.sw += dt * 1.6; q.y += q.vy * dt;
      if (q.k === 'flake') {
        q.x += Math.sin(q.sw) * 18 * dt; q.a += dt * .8;
        c.globalAlpha = .9 * fade; c.fillStyle = '#f4faff'; c.strokeStyle = '#f4faff';
        if (q.six) { c.save(); c.translate(q.x, q.y); c.rotate(q.a); c.lineWidth = .9; c.beginPath(); for (let k = 0; k < 6; k++) { const an = k * Math.PI / 3; c.moveTo(0, 0); c.lineTo(Math.cos(an) * q.r * 1.6, Math.sin(an) * q.r * 1.6); } c.stroke(); c.restore(); }
        else { c.beginPath(); c.arc(q.x, q.y, q.r * .7, 0, 6.283); c.fill(); }
      } else {
        q.x += (q.vx + Math.sin(q.sw) * 30) * dt; q.a += q.va * dt; q.flip += q.vf * dt;
        c.save(); c.translate(q.x, q.y); c.rotate(q.a); c.scale(1, Math.max(.15, Math.abs(Math.cos(q.flip))));
        c.globalAlpha = fade; c.fillStyle = q.col;
        c.beginPath(); c.moveTo(-q.w, 0); c.quadraticCurveTo(0, -q.h * 1.6, q.w, 0); c.quadraticCurveTo(0, q.h * 1.1, -q.w, 0); c.fill();
        c.restore();
      }
    }
    c.globalAlpha = 1;
  }
  function auto(on) {
    cancelAnimationFrame(raf); if (!on) return;
    let last = performance.now();
    const loop = now => { render(Math.min(.05, (now - last) / 1000)); last = now; raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
  }
  return { set, step: render, win, auto };
})();
