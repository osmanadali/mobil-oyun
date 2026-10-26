// Boğaz — gece İstanbul Boğazı'nda rota çizme oyunu (Canvas 2D, kütüphanesiz, dosyasız ses)
'use strict';
(() => {
  const cv = document.getElementById('c');
  const ctx = cv.getContext('2d', { alpha: false });
  const $ = id => document.getElementById(id);
  const TAU = Math.PI * 2;
  const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  // ---------- kayıt ----------
  const KEY = 'bogaz.v1';
  const save = { best: 0, sound: true, music: true };
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s && typeof s === 'object') {
      if (Number.isFinite(s.best)) save.best = s.best;
      if (typeof s.sound === 'boolean') save.sound = s.sound;
      if (typeof s.music === 'boolean') save.music = s.music;
    }
  } catch {}
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch {} }
  function buzz(p) { try { if (save.sound && navigator.vibrate) navigator.vibrate(p); } catch {} }

  // ---------- ses (Web Audio, tamamen sentez) ----------
  let ac = null;
  function ensureAC() {
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume().catch(() => {});
    } catch {}
    return ac;
  }
  // yumuşak çan tınısı: sinüs + hafif üst oktav, üstel sönüm
  function tone(f, dur = .08, vol = .05, type = 'sine', at = 0) {
    if (!save.sound || !ac) return;
    try {
      const t = ac.currentTime + at, o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), g2 = ac.createGain();
      o.type = type; o.frequency.value = f; o2.frequency.value = f * 2; g2.gain.value = .18;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .012);
      g.gain.exponentialRampToValueAtTime(.0001, t + Math.max(dur, .06) * 1.6);
      o.connect(g); o2.connect(g2).connect(g); g.connect(ac.destination);
      const end = t + Math.max(dur, .06) * 1.6 + .02;
      o.start(t); o2.start(t); o.stop(end); o2.stop(end);
    } catch {}
  }
  // vapur düdüğü: alçak, filtreli testere + beşli, yumuşak giriş
  function horn(vol = .035, at = 0, f = 150, len = .42) {
    if (!save.sound || !ac) return;
    try {
      const t = ac.currentTime + at, g = ac.createGain(), lp = ac.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 650; lp.Q.value = .6;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .09);
      g.gain.setValueAtTime(vol, t + len); g.gain.exponentialRampToValueAtTime(.0001, t + len + .45);
      lp.connect(g).connect(ac.destination);
      const parts = [[1, 'sawtooth'], [1.006, 'sawtooth'], [1.5, 'triangle']];
      for (let i = 0; i < parts.length; i++) {
        const o = ac.createOscillator(); o.type = parts[i][1];
        o.frequency.setValueAtTime(f * parts[i][0] * .97, t); o.frequency.linearRampToValueAtTime(f * parts[i][0], t + .1);
        o.connect(lp); o.start(t); o.stop(t + len + .5);
      }
    } catch {}
  }
  const PENT = [0, 2, 4, 7, 9];
  const sfx = {
    dock(n) { const m = 64 + PENT[n % 5] + 12 * ((n / 5 | 0) % 2); tone(hz(m), .3, .07); tone(hz(m + 7), .22, .022, 'sine', .07); horn(.03, .16, 150); },
    transit() { tone(hz(71), .22, .05); tone(hz(76), .3, .05, 'sine', .1); horn(.035, .04, 104, .5); },
    warn() { tone(104, .14, .085); tone(104, .14, .06, 'sine', .26); },
    fail() { tone(hz(64), .45, .06, 'triangle'); tone(hz(60), .45, .055, 'triangle', .22); tone(hz(55), .9, .055, 'triangle', .44); horn(.03, .1, 98, .6); },
    snap() { tone(hz(76), .12, .04); },
    pick() { tone(hz(69), .06, .025); },
    unlock() { tone(hz(72), .2, .04); tone(hz(76), .2, .04, 'sine', .1); tone(hz(79), .32, .04, 'sine', .2); },
    click() { tone(hz(72), .05, .03); },
  };

  // sakin ambiyans: yavaş pad akorları + seyrek pentatonik çanlar + yankı + deniz uğultusu
  const Music = (() => {
    const CH = [[40, 47, 55, 59, 62], [36, 43, 52, 55, 59], [43, 50, 54, 59, 62], [38, 45, 54, 57, 62]];
    const SC = [64, 67, 69, 71, 74, 76, 79, 81];
    const BAR = 7.2, VOL = .5;
    let on = false, master, lp, wet, timer = 0, next = 0, bar = 0, noiseBuf, noiseSrc = null, tension = 0;
    function setup() {
      master = ac.createGain(); master.gain.value = 0;
      lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1300;
      master.connect(lp).connect(ac.destination);
      const dl = ac.createDelay(1.5), fb = ac.createGain(); wet = ac.createGain();
      dl.delayTime.value = .46; fb.gain.value = .32; wet.gain.value = .45;
      wet.connect(dl); dl.connect(fb).connect(dl); dl.connect(master);
      const len = ac.sampleRate * 3 | 0; noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
      const d = noiseBuf.getChannelData(0); let v = 0;
      for (let i = 0; i < len; i++) { v = (v + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = v * 3.5; }
      const N = 4000; for (let i = 0; i < N; i++) { const k = i / N; d[len - N + i] = d[len - N + i] * (1 - k) + d[i] * k; }
    }
    function pad(m, t, v) {
      const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain();
      o.type = 'triangle'; o.frequency.value = hz(m); o2.frequency.value = hz(m) * 1.004;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 2.4);
      g.gain.setValueAtTime(v, t + BAR - .6); g.gain.linearRampToValueAtTime(0, t + BAR + 2.2);
      o.connect(g); o2.connect(g); g.connect(master);
      o.start(t); o2.start(t); o.stop(t + BAR + 2.3); o2.stop(t + BAR + 2.3);
    }
    function bell(m, t, v) {
      const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), g2 = ac.createGain();
      o.frequency.value = hz(m); o2.frequency.value = hz(m) * 3.01; g2.gain.value = .1;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .02); g.gain.exponentialRampToValueAtTime(.0005, t + 2.6);
      o.connect(g); o2.connect(g2).connect(g); g.connect(master); g.connect(wet);
      o.start(t); o2.start(t); o.stop(t + 2.7); o2.stop(t + 2.7);
    }
    function sched() {
      if (!on) return;
      try {
        while (next < ac.currentTime + 1.2) {
          const c = CH[bar % 4];
          for (let i = 0; i < c.length; i++) pad(c[i], next, i === 0 ? .05 : .026);
          const n = 2 + (Math.random() * (2 + tension * 3) | 0);
          for (let k = 0; k < n; k++) bell(SC[(Math.random() * SC.length) | 0], next + .4 + ((Math.random() * 8) | 0) * .8, .03 + Math.random() * .02);
          next += BAR; bar++;
        }
      } catch {}
    }
    function start() {
      if (on || !save.music || !ac) return;
      try {
        if (!master) setup();
        on = true;
        const t = ac.currentTime;
        master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(VOL, t + 3);
        next = Math.max(next, t + .1);
        noiseSrc = ac.createBufferSource(); noiseSrc.buffer = noiseBuf; noiseSrc.loop = true;
        const nf = ac.createBiquadFilter(), ng = ac.createGain(); nf.type = 'lowpass'; nf.frequency.value = 420; ng.gain.value = .08;
        noiseSrc.connect(nf).connect(ng).connect(master); noiseSrc.start();
        sched(); timer = setInterval(sched, 400);
      } catch {}
    }
    function stop() {
      if (!on) return;
      on = false; clearInterval(timer);
      try {
        const t = ac.currentTime, n = noiseSrc; noiseSrc = null;
        master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(0, t + .8);
        setTimeout(() => { try { n && n.stop(); } catch {} }, 900);
      } catch {}
    }
    function setTension(x) {
      tension = x;
      try { if (lp) lp.frequency.setTargetAtTime(1300 + 1400 * x, ac.currentTime, 1.5); } catch {}
    }
    return { start, stop, setTension };
  })();

  function unlockAudio() { ensureAC(); if (save.music) Music.start(); }
  window.addEventListener('pointerdown', unlockAudio, true);
  window.addEventListener('keydown', unlockAudio, true);

  // ---------- renkler, sprite'lar ----------
  const PAL = ['#ff8a73', '#4fd6bd', '#ffcc5c', '#b39dff', '#64b2ff', '#ff8ccf', '#e6edf7', '#ff6b6b'];
  const WHITE = 6, RED = 7;
  function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
  function sprite(size, stops) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d'), gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    for (const [o, col] of stops) gr.addColorStop(o, col);
    g.fillStyle = gr; g.fillRect(0, 0, size, size); return c;
  }
  const HALO = PAL.map(c => sprite(64, [[0, rgba(c, .55)], [.45, rgba(c, .18)], [1, rgba(c, 0)]]));
  const GLOW_W = sprite(32, [[0, 'rgba(255,226,180,1)'], [.25, 'rgba(255,200,140,.45)'], [1, 'rgba(255,190,120,0)']]);
  const GLOW_C = sprite(32, [[0, 'rgba(225,235,255,1)'], [.25, 'rgba(180,205,255,.4)'], [1, 'rgba(170,200,255,0)']]);
  function streak(dir) {
    const c = document.createElement('canvas'); c.width = 64; c.height = 8;
    const g = c.getContext('2d'), gr = g.createLinearGradient(dir > 0 ? 0 : 64, 0, dir > 0 ? 64 : 0, 0);
    gr.addColorStop(0, 'rgba(255,205,140,.9)'); gr.addColorStop(1, 'rgba(255,205,140,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 8);
    g.globalCompositeOperation = 'destination-in';
    const v = g.createLinearGradient(0, 0, 0, 8); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(.5, 'rgba(0,0,0,1)'); v.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = v; g.fillRect(0, 0, 64, 8); return c;
  }
  const STREAK_L = streak(1), STREAK_R = streak(-1);
  function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function rr(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h);
    g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
  }

  // ---------- iskeleler (kuzey yukarıda: Avrupa solda, Asya sağda) ----------
  const PIER_DEF = [
    { name: 'Beşiktaş', side: 0, u: .70, c: 0 },
    { name: 'Üsküdar', side: 1, u: .80, c: 1 },
    { name: 'Bebek', side: 0, u: .21, c: 2 },
    { name: 'Çengelköy', side: 1, u: .29, c: 3 },
    { name: 'Ortaköy', side: 0, u: .51, c: 4 },
    { name: 'Kuzguncuk', side: 1, u: .60, c: 5 },
  ];
  const piers = PIER_DEF.map(d => Object.assign({ active: false, on: 0, hl: false, y: 0, bx: 0, dir: 1, dx: 0, dy: 0 }, d));
  const BRIDGE_U = .40;

  // ---------- yerleşim ----------
  let W = 0, H = 0, dpr = 1, FX = 0, FW = 0, SPD = 1, SAFE_T = 0, SAFE_B = 0;
  const STEP = 4;
  let SL = new Float32Array(2), SR = new Float32Array(2);
  function shoreAt(arr, y) {
    let f = y / STEP; if (f < 0) f = 0;
    const n = arr.length - 1; if (f >= n) return arr[n];
    const i = f | 0; return arr[i] + (arr[i + 1] - arr[i]) * (f - i);
  }
  let bg = null, bridgeC = null, BRY = 0, BX0 = 0, BX1 = 0, TW0 = 0, TW1 = 0;
  const BH = 64;
  let refl = [];
  const NG = 52, glints = new Float32Array(NG * 4);
  const NCAR = 8, cars = new Float32Array(NCAR * 2);
  for (let i = 0; i < NCAR; i++) { cars[i * 2] = Math.random(); cars[i * 2 + 1] = rnd(.035, .06); }

  function layoutPiers() {
    for (const p of piers) {
      p.y = p.u * H; p.dir = p.side ? -1 : 1;
      p.bx = shoreAt(p.side ? SR : SL, p.y);
      p.dx = p.bx + p.dir * 38; p.dy = p.y;
    }
  }

  function resize() {
    const ow = W, oh = H;
    W = Math.max(1, window.innerWidth); H = Math.max(1, window.innerHeight);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    FW = Math.min(W, H * .72); FX = (W - FW) / 2; SPD = clamp(H / 800, .8, 1.3);
    try { const cs = getComputedStyle($('safe')); SAFE_T = parseFloat(cs.paddingTop) || 0; SAFE_B = parseFloat(cs.paddingBottom) || 0; } catch {}
    const n = Math.ceil(H / STEP) + 2;
    SL = new Float32Array(n); SR = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const u = i * STEP / H;
      SL[i] = FX + FW * (.17 + .045 * Math.sin(u * 5.3 + .7) + .02 * Math.sin(u * 12.7 + 1.9));
      SR[i] = FX + FW * (.83 + .045 * Math.sin(u * 4.4 + 2.3) + .02 * Math.sin(u * 11.3 + .2));
    }
    BRY = BRIDGE_U * H;
    layoutPiers(); buildBg(); buildBridge(); initGlints();
    if (ow && oh && (ow !== W || oh !== H)) {
      const sx = W / ow, sy = H / oh;
      for (const s of ships) {
        s.x *= sx; s.y *= sy;
        for (const p of s.path) { p.x *= sx; p.y *= sy; }
        for (let i = 0; i < s.wk.length; i += 3) { s.wk[i] *= sx; s.wk[i + 1] *= sy; }
      }
    }
    drawnPaused = false;
  }

  function landPoly(g, arr, edge) {
    g.beginPath(); g.moveTo(edge, -4); g.lineTo(arr[0], -4);
    for (let i = 0; i < arr.length; i++) g.lineTo(arr[i], i * STEP);
    g.lineTo(arr[arr.length - 1], H + 4); g.lineTo(edge, H + 4); g.closePath();
  }
  function shorePath(g, arr) { g.beginPath(); for (let i = 0; i < arr.length; i++) i ? g.lineTo(arr[i], i * STEP) : g.moveTo(arr[i], 0); }

  function buildBg() {
    bg = bg || document.createElement('canvas');
    bg.width = cv.width; bg.height = cv.height;
    const g = bg.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const R = mulberry(7);
    // su
    let gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#11295a'); gr.addColorStop(.5, '#0b1d42'); gr.addColorStop(1, '#0d2350');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    gr = g.createRadialGradient(FX + FW * .6, H * .1, 0, FX + FW * .6, H * .1, Math.max(W, H) * .6);
    gr.addColorStop(0, 'rgba(170,195,255,.12)'); gr.addColorStop(1, 'rgba(170,195,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.lineJoin = 'round';
    for (const arr of [SL, SR]) {
      shorePath(g, arr);
      g.strokeStyle = 'rgba(90,140,210,.09)'; g.lineWidth = 30; g.stroke();
      g.strokeStyle = 'rgba(120,165,235,.10)'; g.lineWidth = 10; g.stroke();
    }
    // kara
    gr = g.createLinearGradient(0, 0, FX + FW * .22, 0); gr.addColorStop(0, '#04070f'); gr.addColorStop(1, '#101a2c');
    landPoly(g, SL, -4); g.fillStyle = gr; g.fill();
    gr = g.createLinearGradient(W, 0, FX + FW * .78, 0); gr.addColorStop(0, '#04070f'); gr.addColorStop(1, '#101a2c');
    landPoly(g, SR, W + 4); g.fillStyle = gr; g.fill();
    // koruluklar (daha karanlık lekeler)
    for (let k = 0; k < 6; k++) {
      const side = k % 2, y = R() * H, x = side ? shoreAt(SR, y) + 20 + R() * 50 : shoreAt(SL, y) - 20 - R() * 50, r = 24 + R() * 30;
      gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(0,0,0,.4)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // rıhtım çizgisi
    for (const arr of [SL, SR]) { shorePath(g, arr); g.strokeStyle = 'rgba(255,214,160,.2)'; g.lineWidth = 1.2; g.stroke(); }
    // sahil yolu lambaları + şehir ışıkları + sokaklar
    for (let side = 0; side < 2; side++) {
      const arr = side ? SR : SL, dir = side ? 1 : -1;
      for (let y = 2; y < H; y += 6) {
        const x = shoreAt(arr, y) + dir * 3.5, a = .35 + R() * .35;
        if (R() < .3) { g.globalAlpha = a * .5; g.drawImage(GLOW_W, x - 4, y - 4, 8, 8); }
        g.globalAlpha = a; g.fillStyle = '#ffcf8a'; g.fillRect(x - .5, y - .5, 1.1, 1.1);
      }
      for (let k = 0; k < 6; k++) {
        let y = R() * H, x = shoreAt(arr, y) + dir * 4, ang = (side ? 0 : Math.PI) + rnd(-.6, .6) * (R() + .3);
        const len = 40 + R() * 110;
        for (let s = 0; s < len; s += 5) {
          ang += (R() - .5) * .12; x += Math.cos(ang) * 5; y += Math.sin(ang) * 5;
          if (x < 0 || x > W) break;
          g.globalAlpha = .28 + R() * .25; g.fillStyle = '#ffb35c'; g.fillRect(x - .45, y - .45, .9, .9);
        }
      }
      const landW = side ? W - (FX + FW * .83) : FX + FW * .17;
      const count = Math.round(landW * H / 140);
      for (let k = 0; k < count; k++) {
        const y = R() * H, d = 6 + (-Math.log(1 - R() * .999)) * 26, x = shoreAt(arr, y) + dir * d;
        if (x < -2 || x > W + 2) continue;
        const warm = R() < .82, sz = .5 + R() * R() * 1.7, a = .4 + R() * .5;
        if (sz > .9) { g.globalAlpha = a * .45; const gs = sz * 7; g.drawImage(warm ? GLOW_W : GLOW_C, x - gs / 2, y - gs / 2, gs, gs); }
        g.globalAlpha = a; g.fillStyle = warm ? (R() < .5 ? '#ffd79a' : '#ffc070') : '#e6eeff';
        g.fillRect(x - sz / 2, y - sz / 2, sz, sz);
      }
    }
    g.globalAlpha = 1;
    // Beylerbeyi Sarayı (Asya kıyısı, köprünün hemen güneyi)
    {
      const py = H * .45, px = shoreAt(SR, py) + 6;
      g.globalAlpha = .7; g.drawImage(GLOW_W, px - 10, py - 22, 24, 44); g.globalAlpha = 1;
      g.fillStyle = 'rgba(255,225,180,.22)'; g.fillRect(px, py - 13, 6, 26);
      g.strokeStyle = 'rgba(255,225,180,.55)'; g.lineWidth = 1; g.strokeRect(px, py - 13, 6, 26);
    }
    // ışık yansımaları (kıyıdan suya uzanan titrek çizgiler)
    refl = [];
    for (let side = 0; side < 2; side++) for (let k = 0; k < 14; k++) {
      const y = 20 + R() * (H - 40);
      refl.push({ side, y, x: shoreAt(side ? SR : SL, y), len: 16 + R() * 34, h: 2 + R() * 2.5, ph: R() * TAU, sp: .5 + R() * .7 });
    }
    // vinyet
    gr = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .78);
    gr.addColorStop(0, 'rgba(0,0,10,0)'); gr.addColorStop(1, 'rgba(0,0,10,.45)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }

  function buildBridge() {
    bridgeC = bridgeC || document.createElement('canvas');
    bridgeC.width = cv.width; bridgeC.height = Math.round(BH * dpr);
    const g = bridgeC.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, BH);
    const cy = BH / 2, l = shoreAt(SL, BRY), r = shoreAt(SR, BRY);
    BX0 = l - 26; BX1 = r + 26; TW0 = l - 8; TW1 = r + 8;
    g.fillStyle = 'rgba(0,0,10,.28)'; g.fillRect(l, cy + 4, r - l, 9);
    g.fillStyle = '#151c2b'; g.fillRect(0, cy - 3.5, BX0 + 2, 7); g.fillRect(BX1 - 2, cy - 3.5, W - BX1 + 2, 7);
    g.fillStyle = 'rgba(34,43,62,.8)'; g.fillRect(BX0, cy - 6, BX1 - BX0, 12);
    g.strokeStyle = 'rgba(255,255,255,.10)'; g.lineWidth = 1; g.setLineDash([4, 5]);
    g.beginPath(); g.moveTo(BX0, cy); g.lineTo(BX1, cy); g.stroke(); g.setLineDash([]);
    g.strokeStyle = 'rgba(170,185,225,.55)'; g.lineWidth = 1.3;
    g.beginPath(); g.moveTo(BX0, cy - 6); g.lineTo(BX1, cy - 6); g.moveTo(BX0, cy + 6); g.lineTo(BX1, cy + 6); g.stroke();
    for (const tx of [TW0, TW1]) {
      g.fillStyle = '#2b3550'; g.fillRect(tx - 3, cy - 10, 6, 20);
      g.fillStyle = '#46527a'; g.fillRect(tx - 3, cy - 10, 6, 3); g.fillRect(tx - 3, cy + 7, 6, 3);
    }
    for (let x = BX0 + 3; x < BX1 - 2; x += 8) {
      const a = x > l && x < r ? .9 : .6, spr = ((x / 8) | 0) % 2 ? GLOW_C : GLOW_W;
      for (const yy of [cy - 6, cy + 6]) {
        g.globalAlpha = a * .5; g.drawImage(spr, x - 5, yy - 5, 10, 10);
        g.globalAlpha = a; g.fillStyle = '#fff4dc'; g.fillRect(x - .7, yy - .7, 1.4, 1.4);
      }
    }
    for (let x = 4; x < W; x += 10) {
      if (x > BX0 - 2 && x < BX1 + 2) continue;
      g.globalAlpha = .5; g.fillStyle = '#ffb35c'; g.fillRect(x - .6, cy - 4.6, 1.2, 1.2); g.fillRect(x - .6, cy + 3.4, 1.2, 1.2);
    }
    g.globalAlpha = 1;
  }

  function seedGlint(i, y) {
    const l = shoreAt(SL, y) + 8, r = shoreAt(SR, y) - 8;
    glints[i * 4] = l + Math.random() * Math.max(1, r - l - 14); glints[i * 4 + 1] = y;
    glints[i * 4 + 2] = 4 + Math.random() * 12; glints[i * 4 + 3] = Math.random() * TAU;
  }
  function initGlints() { for (let i = 0; i < NG; i++) seedGlint(i, Math.random() * H); }

  // ---------- efekt havuzları (kare başına bellek ayırmadan) ----------
  const NP = 160, PX = new Float32Array(NP * 6), PCOL = new Uint8Array(NP); let pHead = 0;
  function burst(x, y, c, n, spd = 40) {
    for (let k = 0; k < n; k++) {
      const i = pHead, a = Math.random() * TAU, sp = rnd(.3, 1) * spd; pHead = (pHead + 1) % NP;
      PX[i * 6] = x; PX[i * 6 + 1] = y; PX[i * 6 + 2] = Math.cos(a) * sp; PX[i * 6 + 3] = Math.sin(a) * sp;
      PX[i * 6 + 4] = PX[i * 6 + 5] = rnd(.6, 1.2); PCOL[i] = c;
    }
  }
  const NR = 16, RP = new Float32Array(NR * 5), RCOL = new Uint8Array(NR); let rHead = 0;
  function ripple(x, y, c, maxR = 34, dur = 1.1) {
    const i = rHead; rHead = (rHead + 1) % NR;
    RP[i * 5] = x; RP[i * 5 + 1] = y; RP[i * 5 + 2] = 0; RP[i * 5 + 3] = dur; RP[i * 5 + 4] = maxR; RCOL[i] = c;
  }
  const TX = []; for (let i = 0; i < 8; i++) TX.push({ on: false, x: 0, y: 0, t: 0, s: '', c: 0 });
  let tHead = 0;
  function floatText(s, x, y, c) { const o = TX[tHead]; tHead = (tHead + 1) % TX.length; o.on = true; o.x = x; o.y = y; o.t = 0; o.s = s; o.c = c; }
  function clearFx() { PX.fill(0); RP.fill(0); for (const o of TX) o.on = false; }
  let toastTimer = 0;
  function toast(msg) {
    const el = $('toast'); el.textContent = msg; el.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), 2200);
  }

  // ---------- gemiler ----------
  const TYPES = {
    vapur: { len: 36, wid: 12, r: 13, v: 27, turn: 1.9 },
    tanker: { len: 52, wid: 14, r: 17, v: 17, turn: 1.25 },
    balikci: { len: 25, wid: 9.5, r: 10, v: 22, turn: 2.6 },
  };
  const WN = 16;
  let ships = [], nextId = 1;
  let state = 'menu', score = 0, elapsed = 0, spawnT = 0, docks = 0, revived = false, crash = null, crashT = 0;
  let warnCd = 0, time = 0, lastUnlockT = -99, demoT = 1, tensionT = 0, drawnPaused = false, noSpawn = false;
  const pointers = new Map();

  function makeShip(type, c, x, y, a, fast) {
    const T = TYPES[type], mul = (1 + Math.min(.22, elapsed / 650)) * SPD;
    return {
      id: nextId++, type, c: type === 'tanker' ? WHITE : c, fast: !!fast, x, y, a,
      v: T.v * (fast ? 1.55 : 1) * mul, len: T.len + (fast ? 2 : 0), wid: T.wid - (fast ? 1 : 0), r: T.r, turn: T.turn * (fast ? 1.25 : 1),
      path: [], pi: 0, pdock: null, pexit: false, drawing: false, entered: false, fromTop: y < H / 2,
      dock: null, alpha: 1, warn: false, dead: false, demo: false,
      wk: new Float32Array(WN * 3), wi: 0, wn: 0, wt: 0,
    };
  }
  function activePiers() { return piers.filter(p => p.active); }

  function trySpawn(demo) {
    const act = activePiers();
    let tankers = 0; for (const s of ships) if (s.type === 'tanker') tankers++;
    const r = Math.random();
    let type = 'vapur', fast = false;
    if ((demo || elapsed > 22) && r < .18 && tankers < 2) type = 'tanker';
    else if (r < .55) type = 'balikci';
    else if (!demo && elapsed > 45 && Math.random() < .2) fast = true;
    let c = demo ? (Math.random() * 4) | 0 : act[(Math.random() * act.length) | 0].c;
    if (!demo && elapsed - lastUnlockT < 20 && Math.random() < .4) c = act[act.length - 1].c;
    for (let k = 0; k < 6; k++) {
      const top = Math.random() < .5, ey = top ? 0 : H;
      const l = shoreAt(SL, ey) + 34, rgt = shoreAt(SR, ey) - 34;
      const x = l + Math.random() * Math.max(1, rgt - l), y = top ? -34 : H + 34;
      let ok = true;
      for (const s of ships) { const dx = s.x - x, dy = s.y - ey; if (dx * dx + dy * dy < 120 * 120) { ok = false; break; } }
      if (!ok) continue;
      const a = (top ? Math.PI / 2 : -Math.PI / 2) + rnd(-.18, .18) + (top ? -1 : 1) * (W / 2 - x) / W * .3;
      const s = makeShip(type, c, x, y, a, fast); s.fromTop = top; s.demo = !!demo;
      ships.push(s); return true;
    }
    return false;
  }

  function updShip(s, dt) {
    if (s.dock) { dockStep(s, dt); return; }
    let des = s.a, tr = s.turn, follow = false;
    const P = s.path;
    while (s.pi < P.length) {
      const p = P[s.pi], dx = p.x - s.x, dy = p.y - s.y, d2 = dx * dx + dy * dy;
      if (d2 < 100 || (d2 < 576 && dx * Math.cos(s.a) + dy * Math.sin(s.a) < 0)) s.pi++; else break;
    }
    if (s.pi < P.length) { const p = P[s.pi]; des = Math.atan2(p.y - s.y, p.x - s.x); tr *= 1.6; follow = true; }
    else {
      if (s.pi > 0 && !s.drawing) { s.path = []; s.pi = 0; s.pdock = null; s.pexit = false; }
      if (!s.demo && s.entered && s.type !== 'tanker') {
        const mid = (shoreAt(SL, s.y) + shoreAt(SR, s.y)) / 2, right = s.x < mid;
        if (s.y < 30 && Math.sin(s.a) < .35) {
          const d = angDiff(s.a, Math.PI / 2); des = Math.abs(d) > 2.6 ? s.a + (right ? 1 : -1) : Math.PI / 2;
        } else if (s.y > H - 30 && Math.sin(s.a) > -.35) {
          const d = angDiff(s.a, -Math.PI / 2); des = Math.abs(d) > 2.6 ? s.a + (right ? -1 : 1) : -Math.PI / 2;
        }
      }
    }
    // kıyıya yaklaşınca nazikçe kıyı boyunca dön (anında kaybetme yok)
    if (!follow) {
      const la = 18 + s.len * .5, lx = s.x + Math.cos(s.a) * la, ly = s.y + Math.sin(s.a) * la, m = s.wid * .5 + 8;
      const lft = shoreAt(SL, ly) + m, rgt = shoreAt(SR, ly) - m;
      if (lx < lft || lx > rgt) {
        const left = lx < lft, arr = left ? SL : SR, nx = left ? 1 : -1;
        let ta = Math.atan2(20, shoreAt(arr, ly + 10) - shoreAt(arr, ly - 10));
        if (Math.cos(ta - s.a) < 0) ta += Math.PI;
        const c1 = ta + .35, c2 = ta - .35;
        des = Math.cos(c1) * nx > Math.cos(c2) * nx ? c1 : c2; tr = s.turn * 1.3;
      }
    }
    const d = angDiff(s.a, des), mx = tr * dt;
    s.a += d > mx ? mx : d < -mx ? -mx : d;
    s.x += Math.cos(s.a) * s.v * dt; s.y += Math.sin(s.a) * s.v * dt;
    const mn = shoreAt(SL, s.y) + s.wid * .5 + 2, mxx = shoreAt(SR, s.y) - s.wid * .5 - 2;
    if (s.x < mn) s.x = mn; else if (s.x > mxx) s.x = mxx;
    if (!s.entered) { if (s.y > s.r && s.y < H - s.r) s.entered = true; }
    else if (s.type !== 'tanker' && !s.demo) s.y = clamp(s.y, s.r * .6, H - s.r * .6);
    // iz (dümen suyu) örnekleri
    s.wt -= dt;
    if (s.wt <= 0) {
      s.wt = .1; const i = s.wi * 3;
      s.wk[i] = s.x - Math.cos(s.a) * s.len * .45; s.wk[i + 1] = s.y - Math.sin(s.a) * s.len * .45; s.wk[i + 2] = s.a;
      s.wi = (s.wi + 1) % WN; if (s.wn < WN) s.wn++;
    }
    if (s.entered && (s.y < -s.len || s.y > H + s.len)) {
      s.dead = true;
      if (!s.demo && s.type === 'tanker') {
        if (s.fromTop ? s.y > H : s.y < 0) transitScore(s);
        else floatText('Yanlış yön', clamp(s.x, 50, W - 50), s.y < 0 ? 60 + SAFE_T : H - 50, WHITE);
      }
      return;
    }
    if (!s.demo && s.type !== 'tanker') {
      for (const p of piers) {
        if (!p.active || p.c !== s.c || p.on < .6) continue;
        const dx = p.dx - s.x, dy = p.dy - s.y;
        if (dx * dx + dy * dy < 484) { beginDock(s, p); break; }
      }
    }
  }

  function releaseShip(s) { for (const [id, o] of pointers) if (o === s) pointers.delete(id); s.drawing = false; }

  function beginDock(s, p) {
    s.dock = { p, t: 0, x0: s.x, y0: s.y, a0: s.a, a1: s.a + angDiff(s.a, Math.abs(angDiff(s.a, Math.PI / 2)) < Math.PI / 2 ? Math.PI / 2 : -Math.PI / 2) };
    s.path = []; s.pi = 0; releaseShip(s);
    score++; docks++; hudScore();
    sfx.dock(docks - 1); buzz(18);
    ripple(p.dx, p.dy, p.c, 36, 1.2); burst(p.dx, p.dy, p.c, 16);
    floatText('+1', p.dx, p.dy - 20, p.c);
  }
  function dockStep(s, dt) {
    const D = s.dock, p = D.p; D.t += dt;
    const k = Math.min(1, D.t / .9), e = 1 - Math.pow(1 - k, 3);
    const tx = p.bx + p.dir * 32, ty = p.y;
    s.x = D.x0 + (tx - D.x0) * e; s.y = D.y0 + (ty - D.y0) * e; s.a = D.a0 + (D.a1 - D.a0) * e;
    s.alpha = 1 - Math.max(0, (k - .3) / .7);
    if (k >= 1) { s.dead = true; ripple(tx, ty, p.c, 22, .9); }
  }
  function transitScore(s) {
    score++; hudScore(); sfx.transit(); buzz(14);
    const y = s.fromTop ? H - 46 - SAFE_B : 64 + SAFE_T, x = clamp(s.x, 60, W - 60);
    floatText('+1 Transit', x, y, WHITE); ripple(x, s.fromTop ? H : 0, WHITE, 40, 1.2);
  }

  function vis(s) { return s.y > -s.r * .5 && s.y < H + s.r * .5; }
  function collide() {
    let any = false;
    for (const s of ships) s.warn = false;
    for (let i = 0; i < ships.length; i++) {
      const a = ships[i]; if (a.dock || !vis(a)) continue;
      for (let j = i + 1; j < ships.length; j++) {
        const b = ships[j]; if (b.dock || !vis(b)) continue;
        const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy, rr2 = a.r + b.r;
        if (d2 < rr2 * rr2) { crashNow(a, b); return; }
        const wr = rr2 + 30; if (d2 < wr * wr) { a.warn = b.warn = true; any = true; }
      }
    }
    if (any && warnCd <= 0) { sfx.warn(); buzz(12); warnCd = 1.5; }
  }
  function crashNow(a, b) {
    state = 'crash'; crashT = 0; a.warn = b.warn = true;
    crash = { a, b, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    for (const s of ships) s.drawing = false;
    pointers.clear();
    sfx.fail(); buzz([50, 40, 80]);
    ripple(crash.x, crash.y, RED, 60, 1.4); burst(crash.x, crash.y, RED, 20, 50);
  }

  function pierTarget() {
    const s = score, t = elapsed;
    return 2 + (s >= 3 || t > 35) + (s >= 7 || t > 70) + (s >= 12 || t > 105) + (s >= 18 || t > 140);
  }
  function unlock(i, silent) {
    const p = piers[i]; if (p.active) return;
    p.active = true; p.on = silent ? 1 : 0;
    if (!silent) { lastUnlockT = elapsed; toast('Yeni iskele: ' + p.name); sfx.unlock(); ripple(p.dx, p.dy, p.c, 44, 1.6); }
  }

  // ---------- giriş: parmakla rota çizme ----------
  function pick(x, y) {
    let best = null, bd = 1e9;
    for (const s of ships) {
      if (s.dock || s.dead || s.demo) continue;
      const d = Math.hypot(s.x - x, s.y - y) - s.len * .2;
      if (d < 36 && d < bd) { bd = d; best = s; }
    }
    return best;
  }
  function addPoint(s, x, y) {
    if (s.pdock || s.pexit || !s.drawing) return;
    const P = s.path, n = P.length;
    const lx = n > s.pi ? P[n - 1].x : s.x, ly = n > s.pi ? P[n - 1].y : s.y;
    const dx = x - lx, dy = y - ly, d = Math.hypot(dx, dy);
    if (d < 8 || n > 700) return;
    const k = Math.min(30, Math.ceil(d / 10));
    for (let i = 1; i <= k; i++) {
      let py = ly + dy * i / k;
      if (s.type !== 'tanker') py = clamp(py, 16, H - 16);
      const px = clamp(lx + dx * i / k, shoreAt(SL, py) + 14, shoreAt(SR, py) - 14);
      P.push({ x: px, y: py });
    }
    if (s.type === 'tanker') {
      if ((s.fromTop && y > H - 36) || (!s.fromTop && y < 36)) {
        P.push({ x: P[P.length - 1].x, y: s.fromTop ? H + 90 : -90 }); s.pexit = true; sfx.snap(); buzz(8); releaseShip(s);
      }
    } else {
      for (const p of piers) {
        if (!p.active || p.c !== s.c) continue;
        if ((p.dx - x) ** 2 + (p.dy - y) ** 2 < 34 * 34) { P.push({ x: p.dx, y: p.dy }); s.pdock = p; sfx.snap(); buzz(8); releaseShip(s); break; }
      }
    }
  }
  cv.addEventListener('pointerdown', e => {
    if (state !== 'playing') return;
    const s = pick(e.clientX, e.clientY); if (!s) return;
    e.preventDefault();
    try { cv.setPointerCapture(e.pointerId); } catch {}
    releaseShip(s);
    s.path = []; s.pi = 0; s.pdock = null; s.pexit = false; s.drawing = true;
    pointers.set(e.pointerId, s); sfx.pick();
  });
  cv.addEventListener('pointermove', e => {
    const s = pointers.get(e.pointerId); if (!s) return;
    if (s.dead || s.dock || state !== 'playing') { releaseShip(s); return; }
    const list = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
    if (list && list.length) for (const ev of list) addPoint(s, ev.clientX, ev.clientY);
    else addPoint(s, e.clientX, e.clientY);
  });
  function endPtr(e) { const s = pointers.get(e.pointerId); if (s) s.drawing = false; pointers.delete(e.pointerId); }
  cv.addEventListener('pointerup', endPtr);
  cv.addEventListener('pointercancel', endPtr);
  cv.addEventListener('contextmenu', e => e.preventDefault());

  // ---------- güncelleme ----------
  function spawnInterval() { return Math.max(2.5, 6.6 - elapsed * .028); }
  function maxShips() { return Math.min(11, 3 + Math.floor(elapsed / 18)); }

  function updatePlaying(dt) {
    elapsed += dt; warnCd -= dt;
    const tgt = pierTarget();
    for (let i = 0; i < tgt && i < piers.length; i++) if (!piers[i].active) unlock(i, false);
    if (!noSpawn) {
      spawnT -= dt;
      if (spawnT <= 0) spawnT = ships.length < maxShips() && trySpawn(false) ? spawnInterval() * rnd(.85, 1.15) : .6;
    }
    for (let i = ships.length - 1; i >= 0; i--) {
      const s = ships[i]; updShip(s, dt);
      if (s.dead) { releaseShip(s); ships.splice(i, 1); }
      if (state !== 'playing') return;
    }
    collide();
    tensionT -= dt;
    if (tensionT <= 0) { tensionT = 1; Music.setTension(clamp((ships.length - 2) / 8, 0, 1)); }
  }
  function updateDemo(dt) {
    demoT -= dt;
    if (demoT <= 0) { demoT = rnd(3.5, 6); if (ships.length < 4) trySpawn(true); }
    for (let i = ships.length - 1; i >= 0; i--) { updShip(ships[i], dt); if (ships[i].dead) ships.splice(i, 1); }
  }
  function updateFx(dt) {
    for (const p of piers) if (p.active && p.on < 1) p.on = Math.min(1, p.on + dt / 1.2);
    for (let i = 0; i < NP; i++) {
      const o = i * 6; if (PX[o + 4] <= 0) continue;
      PX[o + 4] -= dt; PX[o] += PX[o + 2] * dt; PX[o + 1] += PX[o + 3] * dt;
      const f = 1 - 2.2 * dt; PX[o + 2] *= f; PX[o + 3] *= f;
    }
    for (let i = 0; i < NR; i++) if (RP[i * 5 + 3] > 0) { RP[i * 5 + 2] += dt; if (RP[i * 5 + 2] >= RP[i * 5 + 3]) RP[i * 5 + 3] = 0; }
    for (const o of TX) if (o.on) { o.t += dt; if (o.t > 1.3) o.on = false; }
    for (let i = 0; i < NG; i++) { glints[i * 4 + 1] += 7 * dt; if (glints[i * 4 + 1] > H + 2) seedGlint(i, -2); }
    for (let i = 0; i < NCAR; i++) { cars[i * 2] += cars[i * 2 + 1] * dt; if (cars[i * 2] > 1) cars[i * 2] -= 1; }
  }
  function update(dt) {
    if (state === 'playing') updatePlaying(dt);
    else if (state === 'menu') updateDemo(dt);
    else if (state === 'crash') { crashT += dt; if (crashT > 1.2) gameOver(); }
    updateFx(dt);
  }

  // ---------- çizim ----------
  const DASH = [.1, 8], NODASH = [];
  function drawWater() {
    ctx.fillStyle = '#c4d8ff';
    for (let i = 0; i < NG; i++) {
      const o = i * 4;
      ctx.globalAlpha = .03 + .09 * (.5 + .5 * Math.sin(time * 1.2 + glints[o + 3]));
      ctx.fillRect(glints[o], glints[o + 1], glints[o + 2], 1);
    }
    for (let i = 0; i < refl.length; i++) {
      const r = refl[i];
      ctx.globalAlpha = .17 + .12 * Math.sin(time * r.sp + r.ph);
      const l = r.len * (.85 + .15 * Math.sin(time * r.sp * 1.7 + r.ph * 2));
      if (r.side) ctx.drawImage(STREAK_R, r.x - l, r.y - r.h / 2, l, r.h);
      else ctx.drawImage(STREAK_L, r.x, r.y - r.h / 2, l, r.h);
    }
    ctx.globalAlpha = 1;
  }
  function drawPiers() {
    for (const p of piers) p.hl = false;
    for (const s of ships) if (s.drawing || s.pdock) for (const p of piers) if (p.c === s.c) p.hl = true;
    ctx.font = '600 10px ' + FONT; ctx.textBaseline = 'middle';
    for (const p of piers) {
      if (!p.active || p.on <= 0) continue;
      const a = p.on, d = p.dir, x = p.bx, y = p.y, col = PAL[p.c];
      ctx.globalAlpha = a * .5; ctx.drawImage(HALO[p.c], x - d * 16 - 22, y - 22, 44, 44);
      ctx.globalAlpha = a;
      ctx.fillStyle = '#3a4052'; ctx.fillRect(d > 0 ? x - 4 : x - 28, y - 3.5, 32, 7);
      ctx.fillStyle = col; ctx.fillRect(d > 0 ? x + 22 : x - 28, y - 3.5, 6, 7);
      const bx = d > 0 ? x - 26 : x + 6;
      ctx.fillStyle = '#1c2436'; rr(ctx, bx, y - 8, 20, 16, 3); ctx.fill();
      ctx.fillStyle = col; ctx.fillRect(bx + 2, y - 8, 16, 3);
      ctx.fillStyle = '#ffd88a'; ctx.fillRect(bx + 4, y - 1, 2, 2); ctx.fillRect(bx + 9, y - 1, 2, 2); ctx.fillRect(bx + 14, y - 1, 2, 2);
      if (!p.tw) p.tw = ctx.measureText(p.name).width;
      let lx = d > 0 ? x - 2 - p.tw : x + 2;
      lx = clamp(lx, 4, W - 4 - p.tw);
      ctx.fillStyle = 'rgba(236,240,248,.8)'; ctx.textAlign = 'left';
      ctx.fillText(p.name, lx, y - 17);
      const pulse = 1 + .07 * Math.sin(time * 2.2 + p.c);
      ctx.beginPath(); ctx.arc(p.dx, p.dy, 13 * pulse, 0, TAU);
      ctx.globalAlpha = a * (p.hl ? .28 : .12); ctx.fillStyle = col; ctx.fill();
      ctx.globalAlpha = a * (p.hl ? 1 : .55); ctx.strokeStyle = col; ctx.lineWidth = p.hl ? 2.5 : 2; ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function drawWake(s) {
    const n = s.wn; if (n < 2) return;
    const W3 = s.wk;
    ctx.strokeStyle = '#e8f0ff'; ctx.lineCap = 'round';
    for (let b = 0; b < 4; b++) {
      const k0 = (b * (n - 1) / 4) | 0, k1 = Math.min(n - 1, (((b + 1) * (n - 1) / 4) | 0) + 1);
      if (k1 <= k0) continue;
      ctx.globalAlpha = s.alpha * (s.fast ? .4 : .3) * (1 - b * .26);
      ctx.lineWidth = 1.5 - b * .25;
      ctx.beginPath();
      for (let side = -1; side <= 1; side += 2) {
        for (let k = k0; k <= k1; k++) {
          const i = ((s.wi - 1 - k + WN * 2) % WN) * 3, a = W3[i + 2], sp = (s.wid * .4 + k * .75) * side;
          const x = W3[i] - Math.sin(a) * sp, y = W3[i + 1] + Math.cos(a) * sp;
          if (k === k0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
    const i0 = ((s.wi - 1 + WN) % WN) * 3, j = ((s.wi - Math.min(n, 5) + WN) % WN) * 3;
    ctx.globalAlpha = s.alpha * .16; ctx.lineWidth = s.wid * .6;
    ctx.beginPath(); ctx.moveTo(s.x - Math.cos(s.a) * s.len * .45, s.y - Math.sin(s.a) * s.len * .45); ctx.lineTo(W3[i0], W3[i0 + 1]); ctx.lineTo(W3[j], W3[j + 1]); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  function hullRound(L, h) {
    ctx.beginPath(); ctx.moveTo(-L / 2 + 5, -h); ctx.lineTo(L / 2 - 7, -h);
    ctx.quadraticCurveTo(L / 2, -h, L / 2, 0); ctx.quadraticCurveTo(L / 2, h, L / 2 - 7, h);
    ctx.lineTo(-L / 2 + 5, h); ctx.quadraticCurveTo(-L / 2, h, -L / 2, 0); ctx.quadraticCurveTo(-L / 2, -h, -L / 2 + 5, -h); ctx.closePath();
  }
  function drawShip(s) {
    const col = PAL[s.c], L = s.len, w = s.wid, h = w / 2;
    ctx.save(); ctx.translate(s.x, s.y);
    const R = L * .8;
    ctx.globalAlpha = s.alpha * (s.drawing ? .95 : .55); ctx.drawImage(HALO[s.c], -R, -R, R * 2, R * 2);
    ctx.rotate(s.a);
    if (s.dock) { const sc = 1 - .15 * Math.min(1, s.dock.t / .9); ctx.scale(sc, sc); }
    ctx.globalAlpha = s.alpha; ctx.lineWidth = 1;
    if (s.type === 'vapur') {
      hullRound(L, h); ctx.fillStyle = '#e9edf3'; ctx.fill(); ctx.strokeStyle = 'rgba(8,14,28,.6)'; ctx.stroke();
      ctx.fillStyle = '#c1c9d6'; rr(ctx, -L / 2 + 3, -h + 1.6, L - 6, w - 3.2, (w - 3.2) / 2); ctx.fill();
      ctx.fillStyle = col; rr(ctx, -L / 2 + 6, -h + 2.4, L - 13, w - 4.8, 2); ctx.fill();
      ctx.fillStyle = '#1b2232'; ctx.beginPath(); ctx.arc(-1, 0, 2.3, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#f3f5f8'; ctx.lineWidth = .8; ctx.stroke();
      ctx.fillStyle = '#ffd88a';
      for (let i = 0; i < 5; i++) { const x = -L / 2 + 7 + i * ((L - 14) / 4); ctx.fillRect(x - .8, -h + .3, 1.6, 1.1); ctx.fillRect(x - .8, h - 1.4, 1.6, 1.1); }
      ctx.fillStyle = '#fffbe8'; ctx.fillRect(L / 2 - 3, -.8, 1.6, 1.6);
      if (s.fast) {
        ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.2; ctx.beginPath();
        ctx.moveTo(-L / 2 - 3, -h * .5); ctx.lineTo(-L / 2 - 9, -h * .5); ctx.moveTo(-L / 2 - 3, h * .5); ctx.lineTo(-L / 2 - 9, h * .5); ctx.stroke();
      }
    } else if (s.type === 'tanker') {
      ctx.beginPath(); ctx.moveTo(-L / 2, -h); ctx.lineTo(L / 2 - 11, -h); ctx.quadraticCurveTo(L / 2 - 1, -h * .7, L / 2, 0);
      ctx.quadraticCurveTo(L / 2 - 1, h * .7, L / 2 - 11, h); ctx.lineTo(-L / 2, h); ctx.closePath();
      ctx.fillStyle = '#7a4a45'; ctx.fill(); ctx.strokeStyle = 'rgba(8,14,28,.7)'; ctx.stroke();
      ctx.fillStyle = '#556178'; rr(ctx, -L / 2 + 1.5, -h + 1.6, L - 10, w - 3.2, 1.5); ctx.fill();
      ctx.fillStyle = '#6b7891'; for (let i = 0; i < 4; i++) ctx.fillRect(-L / 2 + 13 + i * 7, -h + 2.8, 4.5, w - 5.6);
      ctx.strokeStyle = '#aab6cb'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-L / 2 + 11, 0); ctx.lineTo(L / 2 - 8, 0); ctx.stroke();
      ctx.fillStyle = '#eef1f6'; rr(ctx, -L / 2 + 1.5, -h + 1.2, 8.5, w - 2.4, 1.5); ctx.fill();
      ctx.fillStyle = '#ffd88a'; ctx.fillRect(-L / 2 + 8, -h + 2.2, 1.3, w - 4.4);
      ctx.fillStyle = '#2a3142'; ctx.fillRect(-L / 2 + 3, -1.5, 2.6, 3);
      ctx.fillStyle = '#ff7b7b'; ctx.fillRect(L / 2 - 12, -h - .2, 1.6, 1.4);
      ctx.fillStyle = '#7dffb0'; ctx.fillRect(L / 2 - 12, h - 1.2, 1.6, 1.4);
      ctx.fillStyle = '#fffbe8'; ctx.fillRect(L / 2 - 4, -.8, 1.6, 1.6);
    } else {
      ctx.beginPath(); ctx.moveTo(-L / 2, -h + 1.5); ctx.quadraticCurveTo(-L / 2, -h, -L / 2 + 2, -h); ctx.lineTo(L / 2 - 7, -h);
      ctx.quadraticCurveTo(L / 2 - 1, -h + 1, L / 2, 0); ctx.quadraticCurveTo(L / 2 - 1, h - 1, L / 2 - 7, h);
      ctx.lineTo(-L / 2 + 2, h); ctx.quadraticCurveTo(-L / 2, h, -L / 2, h - 1.5); ctx.closePath();
      ctx.fillStyle = '#9a6d43'; ctx.fill(); ctx.strokeStyle = 'rgba(8,14,28,.65)'; ctx.stroke();
      ctx.fillStyle = '#c4935f'; rr(ctx, -L / 2 + 1.6, -h + 1.4, L - 7, w - 2.8, 1.2); ctx.fill();
      ctx.fillStyle = col; rr(ctx, -L / 2 + 3, -h + .8, 9.5, w - 1.6, 1.5); ctx.fill();
      ctx.globalAlpha = s.alpha * (.55 + .1 * Math.sin(time * 2 + s.id)); ctx.drawImage(GLOW_W, -3, -8, 16, 16);
      ctx.globalAlpha = s.alpha; ctx.fillStyle = '#fff2c4'; ctx.beginPath(); ctx.arc(5, 0, 1.3, 0, TAU); ctx.fill();
    }
    ctx.restore();
    if (s.warn && !s.dock) {
      ctx.globalAlpha = .4 + .25 * Math.sin(time * 6);
      ctx.strokeStyle = PAL[RED]; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r + 12, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  function drawBridge() {
    ctx.drawImage(bridgeC, 0, BRY - BH / 2, W, BH);
    const cy = BRY;
    for (let i = 0; i < NCAR; i++) {
      const p = cars[i * 2], right = i % 2 === 0, x = BX0 + (right ? p : 1 - p) * (BX1 - BX0);
      ctx.globalAlpha = .75; ctx.fillStyle = right ? '#fff6e0' : '#ff7a6a';
      ctx.fillRect(x - 1.5, right ? cy - 3.3 : cy + 2, 3, 1.3);
    }
    ctx.globalAlpha = .55 + .35 * Math.sin(time * 1.4);
    for (const tx of [TW0, TW1]) for (const ty of [cy - 9, cy + 9]) ctx.drawImage(HALO[RED], tx - 6, ty - 6, 12, 12);
    ctx.globalAlpha = 1;
  }
  function drawPath(s) {
    const P = s.path; if (s.pi >= P.length) return;
    ctx.beginPath(); ctx.moveTo(s.x, s.y);
    for (let i = s.pi; i < P.length; i++) ctx.lineTo(P[i].x, P[i].y);
    ctx.strokeStyle = PAL[s.c]; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.globalAlpha = .14; ctx.lineWidth = 10; ctx.stroke();
    ctx.setLineDash(DASH); ctx.lineDashOffset = -time * 14;
    ctx.globalAlpha = .95; ctx.lineWidth = 3.4; ctx.stroke();
    ctx.setLineDash(NODASH);
    if (!s.pdock && !s.pexit) {
      const e = P[P.length - 1]; ctx.fillStyle = PAL[s.c]; ctx.globalAlpha = .85;
      ctx.beginPath(); ctx.arc(e.x, e.y, 4, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function drawFx() {
    for (let i = 0; i < NR; i++) {
      const o = i * 5, dur = RP[o + 3]; if (dur <= 0) continue;
      const k = RP[o + 2] / dur, e = 1 - Math.pow(1 - k, 2);
      ctx.globalAlpha = (1 - k) * .6; ctx.strokeStyle = PAL[RCOL[i]]; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(RP[o], RP[o + 1], 4 + RP[o + 4] * e, 0, TAU); ctx.stroke();
    }
    for (let i = 0; i < NP; i++) {
      const o = i * 6; if (PX[o + 4] <= 0) continue;
      const f = PX[o + 4] / PX[o + 5];
      ctx.globalAlpha = f * .9; ctx.fillStyle = PAL[PCOL[i]];
      ctx.beginPath(); ctx.arc(PX[o], PX[o + 1], .6 + 1.4 * f, 0, TAU); ctx.fill();
    }
    ctx.font = '700 16px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const o of TX) {
      if (!o.on) continue;
      const k = o.t / 1.3; ctx.globalAlpha = k < .15 ? k / .15 : 1 - (k - .15) / .85;
      ctx.fillStyle = PAL[o.c]; ctx.fillText(o.s, o.x, o.y - 26 * k);
    }
    ctx.globalAlpha = 1;
  }
  function drawIndicators() {
    for (const s of ships) {
      if (s.entered || s.dock || s.demo || (s.y >= 0 && s.y <= H)) continue;
      const top = s.y < 0, y = top ? SAFE_T + 6 : H - SAFE_B - 6, x = s.x;
      ctx.globalAlpha = .55 + .3 * Math.sin(time * 4); ctx.fillStyle = PAL[s.c];
      ctx.beginPath();
      if (top) { ctx.moveTo(x - 8, y - 3); ctx.lineTo(x + 8, y - 3); ctx.lineTo(x, y + 6); }
      else { ctx.moveTo(x - 8, y + 3); ctx.lineTo(x + 8, y + 3); ctx.lineTo(x, y - 6); }
      ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(bg, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawWater();
    drawPiers();
    for (const s of ships) drawWake(s);
    for (const s of ships) drawShip(s);
    drawBridge();
    for (const s of ships) drawPath(s);
    drawFx();
    if (crash) {
      ctx.globalAlpha = .5 + .3 * Math.sin(time * 5); ctx.strokeStyle = PAL[RED]; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(crash.x, crash.y, 30 + 4 * Math.sin(time * 5), 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
    }
    drawIndicators();
  }

  // ---------- ekranlar ve durum ----------
  const SCREENS = ['menu', 'how', 'pause', 'over'];
  function showScreen(id) { for (const k of SCREENS) $(k).classList.toggle('hidden', k !== id); }
  function setHud(on) { $('hud').classList.toggle('hidden', !on); }
  let shownScore = -1, shownBest = -1;
  function hudScore() {
    if (score !== shownScore) { shownScore = score; $('score').textContent = score; }
    const b = Math.max(save.best, score); if (b !== shownBest) { shownBest = b; $('hudBest').textContent = b; }
  }
  function reset() {
    ships.length = 0; pointers.clear();
    score = 0; elapsed = 0; spawnT = .8; docks = 0; revived = false; crash = null; crashT = 0; warnCd = 0; lastUnlockT = -99;
    for (const p of piers) { p.active = false; p.on = 0; }
    unlock(0, true); unlock(1, true);
    clearFx(); hudScore();
  }
  function start() {
    reset(); state = 'playing'; showScreen(null); setHud(true);
    Music.setTension(0);
  }
  function pause() {
    if (state !== 'playing') return;
    state = 'paused'; drawnPaused = false;
    for (const s of ships) s.drawing = false;
    pointers.clear(); showScreen('pause');
  }
  function resume() { if (state !== 'paused') return; state = 'playing'; showScreen(null); }
  function toMenu() {
    state = 'menu'; ships.length = 0; pointers.clear(); crash = null; clearFx();
    for (const p of piers) { p.active = false; p.on = 0; }
    unlock(0, true); unlock(1, true); unlock(2, true); unlock(3, true);
    $('menuBest').textContent = save.best; setHud(false); showScreen('menu'); demoT = .5;
  }
  function adsAvailable() { return !!(window.Ads && typeof window.Ads.rewarded === 'function'); }
  function gameOver() {
    state = 'over';
    const nb = score > save.best;
    if (nb) { save.best = score; persist(); }
    $('overScore').textContent = score; $('overBest').textContent = save.best;
    $('newBest').classList.toggle('hidden', !nb || score === 0);
    const rv = $('btnRevive'); rv.disabled = false; rv.classList.toggle('hidden', revived || !adsAvailable());
    setHud(false); showScreen('over'); Music.setTension(0);
  }
  function revive() {
    if (!crash) return;
    const cx = crash.x, cy = crash.y;
    ships = ships.filter(s => s !== crash.a && s !== crash.b && Math.hypot(s.x - cx, s.y - cy) > 80);
    for (const s of ships) s.warn = false;
    revived = true; crash = null; state = 'playing'; spawnT = 2.5; warnCd = 1;
    showScreen(null); setHud(true); hudScore(); toast('Devam!');
  }

  function bind(id, fn) { $(id).addEventListener('click', () => { sfx.click(); fn(); }); }
  bind('btnPlay', start);
  bind('btnHow', () => showScreen('how'));
  bind('btnHowBack', () => showScreen('menu'));
  bind('btnResume', resume);
  bind('btnRestart', start);
  bind('btnPauseMenu', toMenu);
  bind('btnAgain', start);
  bind('btnOverMenu', toMenu);
  $('btnPause').addEventListener('click', () => { sfx.click(); pause(); });
  $('btnRevive').addEventListener('click', () => {
    const btn = $('btnRevive');
    if (revived || !adsAvailable() || btn.disabled) return;
    btn.disabled = true;
    let res;
    try { res = window.Ads.rewarded(); } catch { res = false; }
    Promise.resolve(res).then(ok => { if (ok === false) { btn.disabled = false; return; } if (state === 'over') revive(); }, () => { btn.disabled = false; });
  });
  function syncToggles() {
    document.querySelectorAll('.tgl').forEach(b => {
      const on = !!save[b.dataset.k];
      b.setAttribute('aria-pressed', String(on)); b.querySelector('span').textContent = on ? 'Açık' : 'Kapalı';
    });
  }
  document.querySelectorAll('.tgl').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.k; save[k] = !save[k]; persist(); syncToggles();
    if (k === 'music') { if (save.music) { ensureAC(); Music.start(); } else Music.stop(); } else sfx.click();
  }));
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { if (state === 'playing') pause(); else if (state === 'paused') resume(); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { pause(); try { if (ac) ac.suspend(); } catch {} }
    else { try { if (ac && ac.state === 'suspended') ac.resume().catch(() => {}); } catch {} }
  });
  let rzPending = false;
  function onResize() { if (rzPending) return; rzPending = true; requestAnimationFrame(() => { rzPending = false; resize(); }); }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 250));

  // ---------- ana döngü ----------
  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    let dt = (now - last) / 1000; last = now;
    if (!(dt > 0)) dt = 0; else if (dt > .05) dt = .05;
    if (state === 'paused') { if (!drawnPaused) { render(); drawnPaused = true; } return; }
    time += dt;
    update(dt); render();
  }

  resize(); syncToggles(); toMenu();
  requestAnimationFrame(t => { last = t; frame(t); });

  // ---------- otomatik test kancaları ----------
  window.__bogaz = {
    get state() { return state; },
    get score() { return score; },
    get best() { return save.best; },
    get elapsed() { return elapsed; },
    start, pause, resume, menu: toMenu, revive,
    ships: () => ships.map(s => ({ id: s.id, type: s.type, color: s.c, x: s.x, y: s.y, a: s.a, docking: !!s.dock, path: s.path.length - s.pi, entered: s.entered })),
    piers: () => activePiers().map(p => ({ name: p.name, color: p.c, x: p.dx, y: p.dy })),
    spawn(o = {}) {
      const s = makeShip(o.type || 'vapur', o.color ?? 0, o.x ?? W / 2, o.y ?? H / 2, o.a ?? Math.PI / 2, o.fast);
      s.entered = true; s.fromTop = o.fromTop ?? Math.sin(s.a) > 0; ships.push(s); return s.id;
    },
    setSpawning(on) { noSpawn = !on; },
  };
})();
