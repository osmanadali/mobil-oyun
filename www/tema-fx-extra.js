// 🎨 Özel gün temaları (taslak · önizleme): 🌙 Ramazan Bayramı · 🐑 Kurban Bayramı · 🎃 Cadılar Bayramı · 🐉 Ay Yeni Yılı
// Her tema: tb (tren rengi), under/over (şerit: trenin altı/üstü), win (bölüm bitince ekran efektleri). tema-fx.js kullanır.
window.FX_EXTRA = (() => {
  const R = (a, b) => a + Math.random() * (b - a), TAU = Math.PI * 2;
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  function glow(c, x, y, r, rgb, a) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }
  const roof = B => B.y - 4.6, nose = B => B.x1 - 1;
  // düşüp dipte yatan nesne (şeker, altın, zarf): yerçekimi + dönme, dibe değince landed'e geçer
  function faller(W, H, draw, o = {}) {
    const q = { x: R(0, W), y: R(-H * .8, H * .5), vy: R(90, 170), vx: R(-15, 15), a: R(0, TAU), va: R(-5, 5), s: R(.8, 1.25), col: o.cols ? o.cols[Math.random() * o.cols.length | 0] : '#fff', ...o };
    const floor = H - 3 - hash(q.x) * 7;
    q.st = (q, dt, c, active) => {
      if (!active && q.y < 0) return false;
      q.vy += 120 * dt; q.y += q.vy * dt; q.x += q.vx * dt; q.a += q.va * dt;
      if (q.y >= floor && !q.hit) { q.hit = 1; q.y = floor; q.vy = -q.vy * R(.3, .42); q.vx *= .6; q.va *= .5; }   // dibe çarpınca bir tık seker
      else if (q.y >= floor) { q.land = { x: q.x, y: floor, a: q.a, s: q.s, col: q.col, col2: q.col2, dr: (c, l) => { c.translate(l.x, l.y); c.rotate(l.a); draw(c, l); } }; return false; }
      c.translate(q.x, q.y); c.rotate(q.a); draw(c, q);
    };
    return q;
  }

  // ---------- 🌙 Ramazan Bayramı · Bayram Fenerleri ----------
  const FEN = ['#ffd36b', '#ff9fb2', '#4fd1c5', '#c39bff', '#7fd0ff'];
  function lantern(c, x, y, col, a, sc = 1) {   // ipte sallanan fener: kapak, gövde, ışık
    c.save(); c.translate(x, y); c.rotate(a); c.scale(sc, sc);
    c.strokeStyle = 'rgba(255,230,170,.55)'; c.lineWidth = .4; c.beginPath(); c.moveTo(0, -2.6); c.lineTo(0, -1.4); c.stroke();
    c.fillStyle = '#c9a24a'; c.fillRect(-1, -1.6, 2, .7);
    c.fillStyle = col; c.beginPath(); c.ellipse(0, .6, 1.5, 1.9, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(-.25, -.6, .5, 2.4);
    c.fillStyle = '#c9a24a'; c.fillRect(-.7, 2.4, 1.4, .5);
    c.restore();
  }
  function crescent(c, x, y, r, col) {
    c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.arc(x + r * .45, y - r * .2, r * .82, 0, TAU, true); c.fill('evenodd');
  }
  function star(c, x, y, r, col) {
    c.fillStyle = col; c.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    c.closePath(); c.fill();
  }
  function candy(c, q) {   // bayram şekeri: renkli ambalaj, iki ucu bükülü
    c.scale(q.s, q.s);
    c.fillStyle = q.col;
    c.beginPath(); c.moveTo(-3.2, 0); c.lineTo(-5.2, -1.9); c.lineTo(-5.2, 1.9); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(3.2, 0); c.lineTo(5.2, -1.9); c.lineTo(5.2, 1.9); c.closePath(); c.fill();
    c.beginPath(); c.ellipse(0, 0, 3.4, 2.3, 0, 0, TAU); c.fill();
    c.fillStyle = q.col2; c.fillRect(-.8, -2.2, 1.6, 4.4);
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-1.4, -.9, 1, .45, -.3, 0, TAU); c.fill();
  }
  const fener = {
    tb: ['#1f3a68', '#2b4f8a', '#ffd98a'], rail: '#ffd36b',
    under(c, B, W, t) {
      glow(c, (B.x0 + B.x1) / 2, B.y, 34, '255,214,120', .22 + Math.sin(t * 2.3) * .03);   // trenin etrafı fener ışığında
      // arkada kalan rayda fener alayı: ipe dizili küçük ışıklar, göz kırpar
      for (let x = 30 + 6; x < B.x0 - 4; x += 11) {
        const k = Math.floor(x / 11), tw = .55 + .45 * Math.sin(t * 3 + k * 1.7), col = FEN[k % FEN.length];
        glow(c, x, B.y - 3, 4.5, col === '#ffd36b' ? '255,211,107' : col === '#ff9fb2' ? '255,159,178' : col === '#4fd1c5' ? '79,209,197' : col === '#c39bff' ? '195,155,255' : '127,208,255', .45 * tw);
        c.fillStyle = col; c.globalAlpha = .6 + .4 * tw; c.beginPath(); c.arc(x, B.y - 3, .9, 0, TAU); c.fill(); c.globalAlpha = 1;
      }
    },
    over(c, B, W, t, speed) {
      const r0 = roof(B), sw = Math.sin(t * 2.6) * (.18 + Math.min(.25, speed * .03));
      // vagonların üstünde ip, ipte 4 fener (her biri kendi ışığını yakar)
      c.strokeStyle = 'rgba(255,230,170,.6)'; c.lineWidth = .5;
      c.beginPath(); c.moveTo(B.x0 + 2, r0 - 2); c.quadraticCurveTo((B.x0 + B.x1) / 2 - 3, r0 + .5, B.x1 - 9, r0 - 2); c.stroke();
      [0.15, .38, .62, .82].forEach((u, i) => {
        const x = B.x0 + 2 + (B.x1 - 11 - B.x0) * u, y = r0 - 1.3 + Math.sin(u * Math.PI) * 1.2, fl = .8 + .2 * Math.sin(t * 9 + i * 2);
        glow(c, x, y + 1, 6, '255,214,120', .5 * fl);
        lantern(c, x, y + 1.6, FEN[i], sw * (i % 2 ? 1 : -1), .85);
      });
      // ön vagonda hilal ve yıldız, ışık saçar
      const hx = B.x1 - 5, hy = r0 - 4.2;
      glow(c, hx, hy, 9, '255,220,140', .55 + Math.sin(t * 2) * .08);
      crescent(c, hx, hy, 2.6, '#ffe08a'); star(c, hx + 2.9, hy - .6, 1.1, '#fff2c4');
    },
    win(W, H) {
      const out = [];
      // tepeden inen fener dizisi (ipte sallanır, ışıldar)
      const N = Math.ceil(W / 46) + 1, t0 = { t: 0 };
      out.push({ st(q, dt, c, active) {
        t0.t += dt; const drop = Math.min(1, t0.t / .9), base = -40 + 92 * (1 - Math.pow(1 - drop, 3)), fade = active ? 1 : Math.max(0, 1 - (t0.t - 4.2) / 1);
        if (fade <= 0) return false;
        c.globalAlpha = fade; c.strokeStyle = 'rgba(255,230,170,.7)'; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(-10, base - 14); c.quadraticCurveTo(W / 2, base + 22, W + 10, base - 14); c.stroke();
        for (let i = 0; i < N; i++) {
          const x = 10 + i * 46, u = x / W, y = base - 14 + 4 * u * (1 - u) * 36 * .5 * 2, a = Math.sin(t0.t * 2 + i) * .22;
          glow(c, x, y + 10, 26, '255,214,120', .35 * fade);
          lantern(c, x, y + 4, FEN[i % FEN.length], a, 3.4);
        }
      } });
      // bayram şekerleri yağar, dipte birikir
      const C = [['#ff5c8a', '#fff'], ['#ffd36b', '#ff7a1a'], ['#4fd1c5', '#fff'], ['#c39bff', '#ffd36b'], ['#7fd0ff', '#ff5c8a']];
      for (let i = 0; i < 70; i++) { const [a, b] = C[Math.random() * C.length | 0]; out.push(faller(W, H, candy, { col: a, col2: b })); }
      // ışıltılar
      for (let i = 0; i < 26; i++) out.push({ x: R(0, W), y: R(80, H * .7), p: R(0, TAU), l: R(1.5, 4.2), st(q, dt, c, act) { q.l -= dt; if (q.l <= 0) return false; q.p += dt * 5; const a = Math.max(0, Math.sin(q.p)) * Math.min(1, q.l); star(c, q.x, q.y, 2.2 + a * 1.6, `rgba(255,236,170,${a})`); } });
      return out;
    },
  };

  // ---------- 🐑 Kurban Bayramı · Bayram Sabahı ----------
  function sheep(c, x, y, s, legT, look = 1) {   // yumak gibi yün, koyu yüz, ince bacaklar
    c.save(); c.translate(x, y); c.scale(s * look, s);
    c.strokeStyle = '#3b3340'; c.lineWidth = .7; c.lineCap = 'round';
    const lg = Math.sin(legT) * .9;
    [[-2.2, lg], [-.8, -lg], [1, lg], [2.2, -lg]].forEach(([lx, d]) => { c.beginPath(); c.moveTo(lx, 1.6); c.lineTo(lx + d * .5, 3.6); c.stroke(); });
    c.fillStyle = '#fbf7ef';
    [[-2.2, 0], [-.7, -.9], [.9, -.8], [2.1, 0], [0, .6], [-1.4, .9], [1.3, .9]].forEach(([px, py]) => { c.beginPath(); c.arc(px, py, 1.7, 0, TAU); c.fill(); });
    c.fillStyle = '#e8e1d4'; c.beginPath(); c.arc(0, .9, 1.6, 0, Math.PI); c.fill();
    c.fillStyle = '#3b3340'; c.beginPath(); c.ellipse(3.7, -.4, 1.25, 1.05, .25, 0, TAU); c.fill();
    c.fillStyle = '#3b3340'; c.beginPath(); c.ellipse(3.1, -1.4, .7, .35, -.6, 0, TAU); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(4.1, -.7, .3, 0, TAU); c.fill();
    c.restore();
  }
  const kurban = {
    tb: ['#3f9f5f', '#3a7bd5', '#fff6dc'], rail: '#ffd6a5',
    under(c, B, W, t) {
      // peronun üstünde doğan güneş (sabahın ışığı)
      const sx = 30 + W - 18, sy = B.y - 6;
      glow(c, sx, sy, 30, '255,200,120', .35); glow(c, sx, sy, 10, '255,226,150', .6);
      c.fillStyle = '#ffd98a'; c.beginPath(); c.arc(sx, sy, 3.6, 0, TAU); c.fill();
      // geçilen rayın kenarında papatyalar
      for (let x = 34; x < B.x0 - 3; x += 7) {
        const h = hash(x * .91); if (h < .55) continue;
        const y = B.y + (h > .8 ? -2.6 : 2.6);
        c.fillStyle = '#fff'; for (let k = 0; k < 5; k++) { const a = k * TAU / 5; c.beginPath(); c.arc(x + Math.cos(a) * .9, y + Math.sin(a) * .9, .55, 0, TAU); c.fill(); }
        c.fillStyle = '#ffd36b'; c.beginPath(); c.arc(x, y, .45, 0, TAU); c.fill();
      }
    },
    over(c, B, W, t, speed) {
      const bob = Math.abs(Math.sin(t * (4 + speed))) * .7;   // tren sallandıkça kuzu hoplar
      sheep(c, B.x0 + 10, roof(B) - 3 - bob, .78, t * 6);
    },
    win(W, H) {
      const out = [], t0 = { t: 0 };
      // tepeden sabah ışığı: yavaş dönen huzmeler
      out.push({ st(q, dt, c, act) {
        t0.t += dt; const a = Math.min(1, t0.t / .8) * (act ? 1 : Math.max(0, 1 - (t0.t - 4.2)));
        if (a <= 0) return false;
        c.translate(W / 2, -30); c.rotate(t0.t * .08);
        for (let i = 0; i < 12; i++) { c.rotate(TAU / 12); const g = c.createLinearGradient(0, 0, 0, H * .7); g.addColorStop(0, `rgba(255,214,140,${.09 * a})`); g.addColorStop(1, 'rgba(255,214,140,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.lineTo(-26, H * .7); c.lineTo(26, H * .7); c.closePath(); c.fill(); }
      } });
      // dipten hoplayarak geçen kuzular (biri durup bakar)
      for (let i = 0; i < 4; i++) {
        const dir = i % 2 ? -1 : 1, sp = R(70, 110), delay = i * .55;
        out.push({ x: dir > 0 ? -30 : W + 30, t: -delay, st(q, dt, c) {
          q.t += dt; if (q.t < 0) return; q.x += dir * sp * dt;
          if (dir > 0 ? q.x > W + 40 : q.x < -40) return false;
          const hop = Math.abs(Math.sin(q.t * 7)) * 14;
          c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(q.x, H - 10, 11 - hop * .3, 2.2, 0, 0, TAU); c.fill();
          sheep(c, q.x, H - 22 - hop, 3.1, q.t * 14, dir);
        } });
      }
      return out;
    },
  };

  // ---------- 🎃 Cadılar Bayramı ----------
  function pumpkin(c, x, y, r, fl) {
    c.fillStyle = '#ff7a1a';
    [-.55, 0, .55].forEach(o => { c.beginPath(); c.ellipse(x + o * r, y, r * .62, r * .9, 0, 0, TAU); c.fill(); });
    c.fillStyle = '#e0600c'; c.fillRect(x - .25, y - r * .85, .5, r * 1.7);
    c.fillStyle = '#3f7a2a'; c.fillRect(x - .4, y - r * 1.25, .8, r * .45);
    c.fillStyle = `rgba(255,230,120,${fl})`;   // içindeki mum titrer
    c.beginPath(); c.moveTo(x - r * .55, y - r * .15); c.lineTo(x - r * .25, y - r * .45); c.lineTo(x - r * .1, y - r * .1); c.fill();
    c.beginPath(); c.moveTo(x + r * .55, y - r * .15); c.lineTo(x + r * .25, y - r * .45); c.lineTo(x + r * .1, y - r * .1); c.fill();
    c.beginPath(); c.moveTo(x - r * .55, y + r * .25); c.lineTo(x - r * .3, y + r * .5); c.lineTo(x, y + r * .3); c.lineTo(x + r * .3, y + r * .5); c.lineTo(x + r * .55, y + r * .25); c.lineTo(x, y + r * .62); c.closePath(); c.fill();
  }
  function bat(c, x, y, s, ph, a = 1) {
    const f = Math.sin(ph) * .8;
    c.fillStyle = `rgba(20,12,30,${a})`; c.strokeStyle = `rgba(150,110,200,${a * .5})`; c.lineWidth = .3;
    c.save(); c.translate(x, y); c.scale(s, s);
    c.beginPath(); c.moveTo(0, 0);
    c.quadraticCurveTo(-2, -1.5 - f * 2, -4.2, -.6 - f * 2.4); c.quadraticCurveTo(-3.2, .2, -2.6, .1); c.quadraticCurveTo(-1.8, .9, -1.2, .4); c.quadraticCurveTo(-.6, 1.1, 0, .6);
    c.quadraticCurveTo(.6, 1.1, 1.2, .4); c.quadraticCurveTo(1.8, .9, 2.6, .1); c.quadraticCurveTo(3.2, .2, 4.2, -.6 - f * 2.4); c.quadraticCurveTo(2, -1.5 - f * 2, 0, 0);
    c.fill(); c.stroke();
    c.fillStyle = `rgba(255,200,80,${a})`; c.fillRect(-.45, -.25, .3, .3); c.fillRect(.15, -.25, .3, .3);
    c.restore();
  }
  function ghost(c, x, y, s, t, a) {
    c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha *= a;
    c.fillStyle = 'rgba(240,240,255,.92)';
    c.beginPath(); c.arc(0, 0, 4, Math.PI, 0); c.lineTo(4, 5);
    for (let i = 0; i <= 4; i++) c.quadraticCurveTo(4 - i * 2 + 1, 6.5 + (i % 2 ? -1 : 1) * Math.sin(t * 6) * .6, 4 - (i + 1) * 2 + 2, 5);
    c.lineTo(-4, 0); c.fill();
    c.fillStyle = '#241634'; c.beginPath(); c.ellipse(-1.4, -.4, .7, 1, 0, 0, TAU); c.ellipse(1.4, -.4, .7, 1, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(0, 1.8, .6, .8, 0, 0, TAU); c.fill();
    c.restore();
  }
  const cadi = {
    tb: ['#3a2350', '#5b2d86', '#ffcf6b'], rail: '#ff9a3d',
    under(c, B, W, t, speed, dt, parts) {
      // geçilen rayda yerde süzülen yeşil sis
      for (let x = 34; x < B.x0 - 2; x += 10) glow(c, x + Math.sin(t + x) * 2, B.y + 2, 9, '120,255,170', .07 + .04 * Math.sin(t * 1.5 + x * .3));
      // tavandan ara sıra yarasa havalanır
      if (Math.random() < (speed > .05 ? 1.6 : .5) * dt) {
        const p = { life: 0, max: R(1.4, 2.2), x: B.x0 + R(4, 30), y: roof(B), vx: -R(10, 30), vy: -R(14, 26), ph: R(0, TAU), s: R(.55, .8) };
        p.st = (p, dt) => { p.x += p.vx * dt; p.y += p.vy * dt + Math.sin(p.life * 9) * .25; p.ph += dt * 22; };
        p.dr = (c, p, f) => bat(c, p.x, p.y, p.s, p.ph, Math.min(1, f * 2.5));
        parts.push(p);
      }
    },
    over(c, B, W, t) {
      const fl = .75 + .25 * Math.sin(t * 17) * Math.sin(t * 7.3);
      glow(c, nose(B) + 1, B.y - 1, 16, '255,140,40', .4 * fl);
      pumpkin(c, nose(B) - 1.5, roof(B) - 2.6, 2.6, fl);
    },
    win(W, H) {
      const out = [];
      // yarasa sürüsü: sağ alttan sol üste dalgalanarak
      for (let i = 0; i < 34; i++) {
        const d = R(0, 1.6), y0 = R(H * .25, H * .95), sp = R(150, 240), amp = R(10, 40), s = R(1.8, 3.4);
        out.push({ t: -d, st(q, dt, c) { q.t += dt; if (q.t < 0) return; const x = W + 20 - sp * q.t, y = y0 - sp * q.t * .45 + Math.sin(q.t * 4 + i) * amp; if (x < -30 || y < -30) return false; bat(c, x, y, s, q.t * 26 + i); } });
      }
      // hayaletler süzülüp kaybolur
      for (let i = 0; i < 4; i++) {
        const x0 = R(W * .15, W * .85), d = i * .6;
        out.push({ t: -d, st(q, dt, c) { q.t += dt; if (q.t < 0) return; if (q.t > 3.2) return false; const a = Math.sin(Math.min(1, q.t / 3.2) * Math.PI); ghost(c, x0 + Math.sin(q.t * 2) * 14, H * .78 - q.t * 70, 3.4, q.t, a * .9); } });
      }
      // dipte bal kabakları belirir (yavaşça büyür)
      // dipte, ekranın biraz içinde bal kabakları (uzaktaki küçük ve yukarıda, yakındaki büyük ve aşağıda) yavaşça belirir
      const pk = Array.from({ length: 6 }, (_, i) => ({ x: W * (.08 + i * .168) + R(-10, 10), z: [.15, .7, .35, .9, .5, .2][i] })).sort((a, b) => a.z - b.z);
      pk.forEach(({ x, z }, i) => {
        const r = 5 + z * 6, y = H - 26 - (1 - z) * 54, d = .4 + i * .2;
        out.push({ t: -d, st(q, dt, c, act) { q.t += dt; if (q.t < 0) return; if (!act && q.t > 6) return false; const g = Math.min(1, q.t / .6), e = 1 - Math.pow(1 - g, 3);
          c.globalAlpha = (.55 + z * .45) * g;
          c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(x, y + r * .85, r * 1.3, r * .3, 0, 0, TAU); c.fill();
          glow(c, x, y, r * 3.2, '255,140,40', .3 * g); pumpkin(c, x, y + (1 - e) * 6, r * (.6 + .4 * e), .85 + .15 * Math.sin(q.t * 15 + i)); } });
      });
      return out;
    },
  };

  // ---------- 🐉 Ay Yeni Yılı ----------
  function coin(c, q) {
    c.scale(q.s, q.s);
    c.fillStyle = '#f4b400'; c.beginPath(); c.arc(0, 0, 3.4, 0, TAU); c.fill();
    c.strokeStyle = '#c98a00'; c.lineWidth = .6; c.beginPath(); c.arc(0, 0, 2.6, 0, TAU); c.stroke();
    c.fillStyle = '#7a1010'; c.fillRect(-.9, -.9, 1.8, 1.8);
    c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(-1.3, -1.3, .7, 0, TAU); c.fill();
  }
  function envelope(c, q) {
    c.scale(q.s, q.s);
    c.fillStyle = '#d62828'; c.fillRect(-2.6, -3.8, 5.2, 7.6);
    c.fillStyle = '#b01e1e'; c.beginPath(); c.moveTo(-2.6, -3.8); c.lineTo(0, -1.4); c.lineTo(2.6, -3.8); c.fill();
    c.fillStyle = '#ffcf4d'; c.beginPath(); c.arc(0, -.6, 1, 0, TAU); c.fill();
  }
  const ayyili = {
    tb: ['#d62828', '#b81d1d', '#ffe08a'], rail: '#ffcf4d',
    under(c, B, W, t, speed, dt, parts) {
      // ejderin arkasından altın kıvılcımlar
      if (Math.random() < (speed > .05 ? 30 : 6) * dt) {
        const p = { life: 0, max: R(.5, 1), x: B.x0 + R(-1, 3), y: B.y + R(-3, 3), vx: -R(10, 35), vy: R(-14, 10), r: R(.35, .8) };
        p.st = (p, dt) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 20 * dt; };
        p.dr = (c, p, f) => { glow(c, p.x, p.y, p.r * 4, '255,200,80', .5 * f); c.fillStyle = `rgba(255,236,170,${f})`; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill(); };
        parts.push(p);
      }
      // geçilen rayın üstünde asılı kırmızı fenerler
      for (let x = 40; x < B.x0 - 4; x += 16) { glow(c, x, B.y - 6, 5, '255,90,60', .35); c.fillStyle = '#e63232'; c.beginPath(); c.ellipse(x, B.y - 6, 1.6, 1.3, 0, 0, TAU); c.fill(); c.fillStyle = '#ffcf4d'; c.fillRect(x - .2, B.y - 4.8, .4, 1.1); }
    },
    over(c, B, W, t, speed) {
      // tren boyunca uçan ejderha: yılan gibi dalgalanan gövde, sırtta altın dikenler, başta boynuz ve bıyık; ara sıra alev püskürtür
      const N = 16, hx = B.x1 + 3, tx = B.x0 - 4, base = roof(B) - 6;
      const pts = Array.from({ length: N }, (_, i) => { const u = i / (N - 1); return [hx + (tx - hx) * u, base + Math.sin(t * 5.5 - i * .62) * (1.2 + u * 2.4) - Math.sin(u * Math.PI) * 1.5]; });
      c.lineCap = 'round'; c.lineJoin = 'round';
      const path = () => { c.beginPath(); c.moveTo(...pts[0]); for (let i = 1; i < N - 1; i++) c.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2); c.lineTo(...pts[N - 1]); };
      glow(c, (hx + tx) / 2, base, 30, '255,90,60', .18);
      for (let i = 2; i < N - 2; i += 2) { const [x, y] = pts[i], w = 1.6 - i / N; c.fillStyle = '#ffcf4d'; c.beginPath(); c.moveTo(x - w, y - 1); c.lineTo(x, y - 2.6 - w); c.lineTo(x + w, y - 1); c.fill(); }   // sırt dikenleri
      c.strokeStyle = '#e63232'; c.lineWidth = 3; path(); c.stroke();
      c.strokeStyle = '#ffcf4d'; c.lineWidth = .8; c.save(); c.translate(0, .9); path(); c.restore(); c.stroke();   // altın karın
      const [tx2, ty2] = pts[N - 1]; c.fillStyle = '#ffcf4d'; c.beginPath(); c.moveTo(tx2, ty2 - 1.5); c.lineTo(tx2 - 3.5, ty2 - .2 + Math.sin(t * 6) * 1.2); c.lineTo(tx2, ty2 + 1.5); c.fill();   // kuyruk püskülü
      // baş
      const [x, y] = pts[0], dy = pts[0][1] - pts[1][1], a = Math.atan2(dy, 3);
      c.save(); c.translate(x, y); c.rotate(a);
      c.fillStyle = '#e63232'; c.beginPath(); c.moveTo(-2, -2.4); c.quadraticCurveTo(3, -3.2, 4.6, -.4); c.lineTo(4.2, .9); c.quadraticCurveTo(2, 2.4, -2, 2.2); c.closePath(); c.fill();
      c.fillStyle = '#ffcf4d'; c.beginPath(); c.moveTo(-.5, -2.3); c.lineTo(-3.3, -4.6); c.lineTo(.8, -2.6); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(1.7, -1, .65, 0, TAU); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(1.9, -1, .32, 0, TAU); c.fill();
      c.strokeStyle = '#ffcf4d'; c.lineWidth = .4;
      for (const k of [-1, 1]) { c.beginPath(); c.moveTo(4, .4 * k); for (let s2 = 1; s2 <= 6; s2++) c.lineTo(4 - s2 * 1.5, .4 * k + k * s2 * .35 + Math.sin(t * 7 + s2 * .9 + k) * .9); c.stroke(); }
      c.restore();
      // alev: her ~1,8 sn'de bir kısa püskürme
      const ph = (t % 1.8) / 1.8;
      if (ph < .32) { const k = ph / .32;
        for (let i = 0; i < 7; i++) { const d = (i / 6) * 14 * Math.sin(k * Math.PI), fx = x + 5 + d, fy = y + .8 + Math.sin(i * 2.1 + t * 30) * d * .12, rr = 1 + d * .18;
          glow(c, fx, fy, rr * 2.6, i < 3 ? '255,230,140' : '255,120,40', .75 * Math.sin(k * Math.PI)); } }
    },
    win(W, H) {
      const out = [], cols = ['255,90,60', '255,207,77', '255,150,60', '255,236,170'];
      // havai fişekler: sırayla patlar, kıvılcımlar düşerek söner
      for (let i = 0; i < 9; i++) {
        const cx0 = R(W * .15, W * .85), cy0 = R(H * .12, H * .45), d = i * .42, col = cols[i % cols.length];
        const sp = Array.from({ length: 46 }, (_, k) => { const a = k / 46 * TAU + R(-.05, .05), v = R(80, 140); return { vx: Math.cos(a) * v, vy: Math.sin(a) * v }; });
        out.push({ t: -d, st(q, dt, c) {
          q.t += dt; if (q.t < 0) return; if (q.t > 2) return false;
          if (q.t < .35) { const y = H - (H - cy0) * (q.t / .35); glow(c, cx0, y, 5, col, .9); return; }   // yükselen fişek
          const u = q.t - .35, a = Math.max(0, 1 - u / 1.6);
          if (u < .12) glow(c, cx0, cy0, 60, col, .35 * (1 - u / .12));
          for (const s of sp) { const k = Math.exp(-u * 1.6), x = cx0 + s.vx * (1 - k) / 1.6, y = cy0 + s.vy * (1 - k) / 1.6 + 30 * u * u; glow(c, x, y, 3.2, col, a * .8); c.fillStyle = `rgba(255,248,220,${a})`; c.fillRect(x - .6, y - .6, 1.2, 1.2); }
        } });
      }
      // altın paralar ve kırmızı zarflar yağar, dipte birikir
      for (let i = 0; i < 46; i++) out.push(faller(W, H, coin));
      for (let i = 0; i < 18; i++) out.push(faller(W, H, envelope, { va: R(-2, 2) }));
      return out;
    },
  };
  return { fener, kurban, cadi, ayyili };
})();
