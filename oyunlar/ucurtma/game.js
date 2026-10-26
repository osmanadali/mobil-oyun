'use strict';
// Uçurtma — tek dosyalık Canvas 2D oyunu. Kütüphane yok, dış kaynak yok.
(() => {
  const cv = document.getElementById('c');
  const ctx = cv.getContext('2d', { alpha: false });
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const smooth = (t) => t * t * (3 - 2 * t);
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const TAU = Math.PI * 2;
  const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  const PXM = 10, HILL = 120, TAILMAX = 58, TAIL0 = 12, SEG = 7.5;

  // ---------- kayıt ----------
  const SAVE_KEY = 'ucurtma.v1';
  const save = { best: 0, sound: true, music: true };
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (s && typeof s === 'object') {
      if (Number.isFinite(s.best)) save.best = Math.max(0, Math.floor(s.best));
      if (typeof s.sound === 'boolean') save.sound = s.sound;
      if (typeof s.music === 'boolean') save.music = s.music;
    }
  } catch (e) { /* bozuk kayıt: varsayılanlar */ }
  const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* depolama yok */ } };
  const vibrate = (p) => {
    try {
      if (!save.sound || !navigator.vibrate) return;
      if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
      navigator.vibrate(p);
    } catch (e) { /* yok */ }
  };

  // ---------- ses (Web Audio, dosya yok) ----------
  let ac = null, noiseBuf = null;
  function ensureAC() {
    try {
      if (!ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ac = new AC();
      }
      if (ac.state === 'suspended') { const p = ac.resume(); if (p && p.catch) p.catch(() => {}); }
      if (!noiseBuf) {
        const n = (ac.sampleRate * 1.5) | 0;
        noiseBuf = ac.createBuffer(1, n, ac.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      }
    } catch (e) { return null; }
    return ac;
  }
  const sfxOk = () => !!(ac && save.sound && ac.state === 'running');
  // yumuşak çan tınısı: sinüs + hafif üst oktav, üstel sönüm
  function tone(f, dur = 0.08, vol = 0.05, type = 'sine', at = 0) {
    if (!sfxOk()) return;
    try {
      const t = ac.currentTime + at, o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), g2 = ac.createGain();
      o.type = type; o.frequency.value = f; o2.frequency.value = f * 2; g2.gain.value = 0.18;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, 0.06) * 1.6);
      o.connect(g); o2.connect(g2).connect(g); g.connect(ac.destination);
      const end = t + Math.max(dur, 0.06) * 1.6 + 0.02;
      o.start(t); o2.start(t); o.stop(end); o2.stop(end);
    } catch (e) { /* */ }
  }
  // rüzgâr çanı: uyumsuz kısmi tonlar (1, 2.76, 5.4) uzun sönüm
  const CH_P = [1, 2.76, 5.4], CH_G = [1, 0.3, 0.1], CH_D = [2.6, 1.3, 0.6];
  function chimeAt(m, t, v, dest) {
    const f = hz(m);
    for (let k = 0; k < 3; k++) {
      const o = ac.createOscillator(), g = ac.createGain(), d = CH_D[k];
      o.frequency.value = f * CH_P[k];
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * CH_G[k], t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(dest); o.start(t); o.stop(t + d + 0.05);
    }
  }
  function noise(at, dur, vol, type, f0, q, f1) {
    if (!sfxOk()) return;
    try {
      const t = ac.currentTime + at, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      s.buffer = noiseBuf; f.type = type; f.Q.value = q;
      f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.03, dur * 0.3));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f).connect(g).connect(ac.destination);
      s.start(t, Math.random() * 0.4); s.stop(t + dur + 0.05);
    } catch (e) { /* */ }
  }

  // ambiyans: gökyüzü evresine göre ton/duygu değiştiren yumuşak pad + seyrek çanlar
  const Music = (() => {
    const KEYS = [
      [[48, 55, 62, 64], [45, 52, 60, 67], [41, 53, 57, 64], [43, 50, 59, 64]], // sabah: Do majör
      [[51, 58, 62, 67], [48, 55, 63, 70], [44, 51, 60, 67], [46, 53, 62, 65]], // altın saat: Mi♭
      [[50, 57, 64, 65], [46, 53, 57, 62], [43, 50, 58, 65], [45, 52, 57, 64]], // alacakaranlık: Re dor
      [[45, 52, 59, 60], [41, 48, 57, 64], [50, 57, 60, 65], [40, 47, 55, 62]], // gece: La minör
      [[52, 59, 63, 68], [52, 58, 61, 66], [49, 56, 59, 64], [47, 54, 59, 64]], // kutup ışığı: Mi lidya
    ];
    const PENTA = [[72, 74, 76, 79, 81], [75, 77, 79, 82, 84], [74, 77, 79, 81, 84], [69, 72, 74, 76, 79], [76, 78, 80, 83, 85]];
    const LP = [1500, 1350, 1200, 1050, 1700];
    const VOL = 0.3, SLOT = 6, LEN = 9.5;
    let on = false, master = null, lp = null, timer = 0, next = 0, step = 0, phase = 0;
    function setup() {
      master = ac.createGain(); master.gain.value = 0;
      lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = LP[phase]; lp.Q.value = 0.4;
      master.connect(lp); lp.connect(ac.destination);
    }
    function voice(m, t, v) {
      const f = hz(m), o1 = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain();
      o1.frequency.value = f; o2.type = 'triangle'; o2.frequency.value = f * 1.003;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + LEN * 0.4); g.gain.linearRampToValueAtTime(0, t + LEN);
      o1.connect(g); o2.connect(g); g.connect(master);
      o1.start(t); o2.start(t); o1.stop(t + LEN + 0.1); o2.stop(t + LEN + 0.1);
    }
    function sched() {
      if (!on || !ac) return;
      try {
        while (next < ac.currentTime + 1.5) {
          const ch = KEYS[phase][step % 4], pen = PENTA[phase];
          for (let i = 0; i < 4; i++) voice(ch[i], next, i === 0 ? 0.05 : 0.03);
          const nb = 2 + ((Math.random() * 3) | 0);
          for (let i = 0; i < nb; i++) chimeAt(pen[(Math.random() * 5) | 0] - (Math.random() < 0.3 ? 12 : 0), next + 0.8 + Math.random() * (SLOT - 1), 0.016 + Math.random() * 0.012, master);
          next += SLOT; step++;
        }
      } catch (e) { /* */ }
    }
    return {
      start() {
        if (on || !save.music || !ac) return;
        try {
          if (!master) setup();
          on = true;
          const t = ac.currentTime;
          next = Math.max(next, t + 0.1);
          master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t);
          master.gain.linearRampToValueAtTime(VOL, t + 3);
          sched(); timer = setInterval(sched, 500);
        } catch (e) { on = false; }
      },
      stop() {
        if (!on) return;
        on = false; clearInterval(timer);
        try {
          const t = ac.currentTime;
          master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t);
          master.gain.linearRampToValueAtTime(0, t + 1.2);
        } catch (e) { /* */ }
      },
      setPhase(p) {
        phase = clamp(p, 0, 4);
        if (lp && ac) lp.frequency.setTargetAtTime(LP[phase], ac.currentTime, 2);
      },
      penta: () => PENTA[phase],
    };
  })();

  // sürekli sesler: hıza göre rüzgâr uğultusu + gerginlikte ince ip vınlaması
  const Loops = (() => {
    let on = false, src, bp, wg, o1, o2, hg;
    return {
      start() {
        if (on || !ac || !save.sound) return;
        try {
          const n = ac.sampleRate * 3, buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
          let b = 0;
          for (let i = 0; i < n; i++) { b = b * 0.985 + (Math.random() * 2 - 1) * 0.015; d[i] = b * 6; }
          src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
          bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 0.5;
          wg = ac.createGain(); wg.gain.value = 0;
          src.connect(bp); bp.connect(wg); wg.connect(ac.destination); src.start();
          o1 = ac.createOscillator(); o2 = ac.createOscillator(); hg = ac.createGain(); hg.gain.value = 0;
          o1.frequency.value = 880; o2.frequency.value = 885;
          o1.connect(hg); o2.connect(hg); hg.connect(ac.destination); o1.start(); o2.start();
          on = true;
        } catch (e) { on = false; }
      },
      stop() {
        if (!on) return;
        on = false;
        try {
          const t = ac.currentTime;
          wg.gain.setTargetAtTime(0, t, 0.08); hg.gain.setTargetAtTime(0, t, 0.05);
          src.stop(t + 0.6); o1.stop(t + 0.6); o2.stop(t + 0.6);
        } catch (e) { /* */ }
      },
      set(w, wf, h, hf) {
        if (!on || ac.state !== 'running') return;
        const t = ac.currentTime;
        wg.gain.setTargetAtTime(w, t, 0.3); bp.frequency.setTargetAtTime(wf, t, 0.4);
        hg.gain.setTargetAtTime(h, t, 0.12);
        o1.frequency.setTargetAtTime(hf, t, 0.2); o2.frequency.setTargetAtTime(hf * 1.006, t, 0.2);
      },
    };
  })();

  const sfx = {
    ribbon(i) {
      if (!sfxOk()) return;
      const pen = Music.penta();
      try { chimeAt(pen[i % 5] + 12 * Math.min(1, (i / 5) | 0), ac.currentTime, 0.075, ac.destination); } catch (e) { /* */ }
    },
    star() {
      if (!sfxOk()) return;
      const pen = Music.penta(), t = ac.currentTime;
      try { chimeAt(pen[2] + 12, t, 0.05, ac.destination); chimeAt(pen[4] + 12, t + 0.09, 0.045, ac.destination); } catch (e) { /* */ }
    },
    snap() { // yumuşak "tıng": aşağı kayan üçgen dalga + hafif titreşim
      if (!sfxOk()) return;
      try {
        const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter(), l = ac.createOscillator(), lg = ac.createGain();
        o.type = 'triangle'; o.frequency.setValueAtTime(440, t); o.frequency.exponentialRampToValueAtTime(150, t + 0.65);
        l.frequency.value = 9; lg.gain.value = 10; l.connect(lg); lg.connect(o.frequency);
        lp.type = 'lowpass'; lp.frequency.setValueAtTime(2600, t); lp.frequency.exponentialRampToValueAtTime(450, t + 0.65);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.13, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
        o.connect(lp); lp.connect(g); g.connect(ac.destination);
        o.start(t); l.start(t); o.stop(t + 0.9); l.stop(t + 0.9);
      } catch (e) { /* */ }
      noise(0, 0.07, 0.04, 'highpass', 2400, 0.7);
    },
    thud() { noise(0, 0.4, 0.07, 'lowpass', 1200, 0.7, 300); tone(110, 0.2, 0.05); },
    birds() { for (let k = 0; k < 5; k++) noise(k * 0.045, 0.05, 0.03, 'bandpass', 2400 + k * 220, 1.4); },
    storm() { noise(0, 1.2, 0.08, 'lowpass', 260, 0.8, 110); },
    creak(T) { noise(0, 0.11, 0.015 + 0.03 * T, 'bandpass', 650, 9, 1250); },
    start() { tone(523, 0.1, 0.035); tone(659, 0.1, 0.035, 'sine', 0.08); tone(784, 0.16, 0.035, 'sine', 0.16); },
    over() { tone(392, 0.22, 0.04, 'sine', 0.05); tone(330, 0.32, 0.035, 'sine', 0.26); },
    click() { tone(880, 0.04, 0.022); },
  };
  function unlock() {
    if (!ensureAC()) return;
    Loops.start(); Music.start();
  }
  ['pointerdown', 'pointerup', 'click', 'touchend', 'keydown'].forEach((ev) => window.addEventListener(ev, unlock, { capture: true, passive: true }));

  // ---------- görsel sabitler ----------
  const SKY = [
    { a: 0, top: [70, 146, 220], mid: [128, 192, 238], bot: [212, 236, 250] },     // sabah
    { a: 300, top: [86, 126, 204], mid: [232, 180, 150], bot: [255, 210, 158] },   // altın saat
    { a: 650, top: [58, 56, 124], mid: [156, 94, 158], bot: [244, 146, 118] },     // alacakaranlık
    { a: 1000, top: [14, 18, 48], mid: [30, 36, 82], bot: [60, 56, 106] },          // gece
    { a: 1450, top: [5, 10, 30], mid: [10, 30, 58], bot: [18, 56, 78] },            // kutup ışıkları
  ];
  const PHASES = ['Sabah', 'Altın saat', 'Alacakaranlık', 'Gece', 'Kutup ışıkları'];
  const KITE = ['#ff6b5e', '#ffd166', '#4ecdc4', '#fff4dc'];
  const RIVALS = [
    ['#7c6cf2', '#dcd6ff', '#dcd6ff', '#7c6cf2'], ['#ef476f', '#ffe0e8', '#ffe0e8', '#ef476f'],
    ['#118ab2', '#cdf1ff', '#cdf1ff', '#118ab2'], ['#2a9d8f', '#e3fff8', '#e3fff8', '#2a9d8f'],
  ];
  const BOWS = ['#ff6b5e', '#ffd166', '#4ecdc4', '#a78bfa', '#f78fb3', '#7bd389', '#ffa45b', '#6ec3ff'];
  const REASONS = { snap: 'İp koptu!', cut: 'İpin kesildi!', tree: 'Uçurtma ağaca takıldı!', roof: 'Uçurtma çatıya takıldı!' };
  const mixc = (a, b, t) => 'rgb(' + ((a[0] + (b[0] - a[0]) * t) | 0) + ',' + ((a[1] + (b[1] - a[1]) * t) | 0) + ',' + ((a[2] + (b[2] - a[2]) * t) | 0) + ')';

  // ---------- ekran boyutu ----------
  let W = 390, H = 844, DPR = 1, ready = false;
  function resize() {
    const oldW = W;
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(240, window.innerWidth | 0); H = Math.max(320, window.innerHeight | 0);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    if (ready && oldW !== W) {
      const r = W / oldW;
      kite.x *= r; fingerX *= r; deadX *= r;
      for (let i = 0; i < TAILMAX; i++) { tail[i].x *= r; tail[i].px *= r; }
      for (let i = 0; i < ents.length; i++) { ents[i].x *= r; if (ents[i].rw) ents[i].rw *= r; }
    }
    if (ready) { initClouds(); if (state === 'paused') render(); }
  }

  // ---------- önbellekli sprite'lar ----------
  const SPR = Math.min(2, window.devicePixelRatio || 1);
  const cloudSpr = [], stormSpr = [];
  function mk(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.ceil(w * SPR); c.height = Math.ceil(h * SPR);
    const g = c.getContext('2d'); g.scale(SPR, SPR);
    return { c, g };
  }
  function makeCloud(w, h, dark) {
    const { c, g } = mk(w, h);
    const n = dark ? 14 : 8 + ((Math.random() * 5) | 0);
    for (let i = 0; i < n; i++) {
      const t = (i % 9) / 8, r = h * (0.17 + 0.2 * Math.sin(Math.PI * t)) * rnd(0.85, 1.12);
      const x = w * (0.16 + 0.68 * t) + rnd(-8, 8);
      const y = (dark ? h * 0.55 + rnd(-0.1, 0.1) * h : h * 0.62 - r * 0.3) + rnd(-5, 5);
      const gr = g.createRadialGradient(x, y - r * 0.3, r * 0.1, x, y, r);
      if (dark) { gr.addColorStop(0, 'rgba(112,102,146,0.96)'); gr.addColorStop(0.7, 'rgba(86,78,122,0.88)'); gr.addColorStop(1, 'rgba(70,62,104,0)'); }
      else { gr.addColorStop(0, 'rgba(255,255,255,0.98)'); gr.addColorStop(0.7, 'rgba(250,252,255,0.9)'); gr.addColorStop(1, 'rgba(244,248,255,0)'); }
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }
    g.globalCompositeOperation = 'source-atop';
    const sh = g.createLinearGradient(0, h * 0.3, 0, h);
    sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, dark ? 'rgba(26,20,46,0.6)' : 'rgba(140,165,200,0.5)');
    g.fillStyle = sh; g.fillRect(0, 0, w, h);
    return c;
  }
  function makeGlow(r, gg, b) {
    const { c, g } = mk(64, 64), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, `rgba(${r},${gg},${b},1)`); gr.addColorStop(0.3, `rgba(${r},${gg},${b},0.45)`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return c;
  }
  for (let i = 0; i < 4; i++) cloudSpr.push(makeCloud(260, 120, false));
  for (let i = 0; i < 2; i++) stormSpr.push(makeCloud(240, 170, true));
  const glowW = makeGlow(255, 255, 255), glowWarm = makeGlow(255, 214, 150), glowViolet = makeGlow(196, 160, 255), glowGold = makeGlow(255, 214, 110);
  const moonSpr = (() => {
    const { c, g } = mk(48, 48);
    g.fillStyle = '#f6f1dc'; g.beginPath(); g.arc(24, 24, 15, 0, TAU); g.fill();
    g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(31, 19, 13, 0, TAU); g.fill();
    return c;
  })();

  // ---------- dünya durumu ----------
  let state = 'menu'; // menu | playing | paused | dying | over
  const kite = { x: 195, wy: 400, vx: 0, vy: 0, rot: 0 };
  let camY = 0, camDy = 0, startWy = 400, holding = false, pointerId = null, fingerX = 195, keyHold = false, keyDir = 0;
  let tension = 0, maxAlt = 0, score = 0, ribbons = 0, mult = 1, runTime = 0, time = 0, diffv = 0;
  let wind = 0, windS = 0, windDir = 1, windDirS = 1, windFlipT = 10;
  let invuln = 0, continued = false, overReason = 'snap', stormIn = false, stormV = 0, nearWarned = false, creakT = 0;
  let deadX = 0, deadWy = 0, dieT = 0, slackS = 0.1, curPhase = 0, phaseLabel = '', phaseT = 9, ribColor = 0, audioT = 0;
  const gust = { st: 0, t: 0, dur: 0, dir: 1, max: 0, str: 0, next: 6, first: true };
  const ents = [];
  let nextSpawn = 0;

  const tail = [];
  for (let i = 0; i < TAILMAX; i++) tail.push({ x: 0, y: 0, px: 0, py: 0 });
  let tailN = TAIL0;

  const parts = [];
  for (let i = 0; i < 160; i++) parts.push({ l: 0, m: 1, x: 0, y: 0, vx: 0, vy: 0, s: 2, c: '#fff', k: 0 });
  let partI = 0;
  const pops = [];
  for (let i = 0; i < 4; i++) pops.push({ l: 0, t: '', x: 0, y: 0, c: '#fff' });
  let popI = 0;
  const stars = [];
  for (let i = 0; i < 110; i++) stars.push({ x: Math.random(), y: Math.random(), r: rnd(0.8, 2), b: rnd(0.5, 1), ph: rnd(0, TAU) });
  const streaks = [];
  for (let i = 0; i < 20; i++) streaks.push({ x: rnd(0, 400), y: rnd(0, 800), len: rnd(40, 110), sp: rnd(0.7, 1.3) });
  const LAYERS = [{ p: 0.12, n: 5, s: 0.55, a: 0.5, c: [] }, { p: 0.3, n: 4, s: 0.85, a: 0.72, c: [] }, { p: 0.75, n: 2, s: 1.35, a: 0.34, c: [] }];
  function initClouds() {
    for (const L of LAYERS) {
      L.c.length = 0;
      for (let i = 0; i < L.n; i++) L.c.push({ x: rnd(-120, W - 60), y: rnd(0, H + 320), s: L.s * rnd(0.8, 1.2), sp: i % cloudSpr.length, yy: 0 });
    }
    for (const s of streaks) { s.x = rnd(0, W); s.y = rnd(0, H); }
  }

  const sy = (wy) => H - (wy - camY);
  const ANCHOR_DX = 7, ANCHOR_WY = HILL + 36;

  function emit(x, wy, n, c, sp, k, s) {
    for (let j = 0; j < n; j++) {
      const p = parts[partI]; partI = (partI + 1) % parts.length;
      const a = Math.random() * TAU, v = sp * (0.3 + Math.random() * 0.7);
      p.x = x; p.y = wy; p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v;
      p.l = p.m = rnd(0.6, 1.2); p.c = c; p.k = k; p.s = s * rnd(0.7, 1.3);
    }
  }
  function popup(t, x, wy, c) { const p = pops[popI]; popI = (popI + 1) % pops.length; p.l = 1.2; p.t = t; p.x = x; p.y = wy; p.c = c; }
  const fmtMult = (m) => (Math.round(m * 100) / 100).toString().replace('.', ',');
  const fmtTime = (s) => { s = Math.floor(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  function tailReset() {
    tailN = TAIL0;
    for (let i = 0; i < TAILMAX; i++) { const p = tail[i]; p.x = p.px = kite.x; p.y = p.py = kite.wy - 24 - i * SEG; }
  }
  function growTail(k) {
    for (let j = 0; j < k && tailN < TAILMAX; j++) {
      const p = tail[tailN], q = tail[tailN - 1];
      p.x = p.px = q.x; p.y = p.py = q.y - 2; tailN++;
    }
  }

  function resetRun() {
    kite.x = clamp(kite.x || W / 2, W * 0.35, W * 0.65); kite.wy = HILL + H * 0.45; kite.vx = 0; kite.vy = 40; kite.rot = 0;
    startWy = kite.wy; camY = 0; tension = 0; maxAlt = 0; score = 0; ribbons = 0; mult = 1; runTime = 0; diffv = 0;
    windDir = Math.random() < 0.5 ? -1 : 1; windDirS = windDir; windFlipT = rnd(10, 14);
    gust.st = 0; gust.str = 0; gust.t = 0; gust.next = rnd(4.5, 6.5); gust.first = true;
    ents.length = 0; nextSpawn = startWy + H * 0.5;
    invuln = 0; continued = false; stormIn = false; stormV = 0; holding = false; pointerId = null; keyHold = false;
    nearWarned = false; creakT = 0; dieT = 0; curPhase = 0; phaseT = 9; ribColor = 0;
    for (const p of parts) p.l = 0;
    for (const p of pops) p.l = 0;
    tailReset();
  }

  // ---------- doğum (yükseldikçe yukarıdan inen engeller ve toplanabilirler) ----------
  function addPickup(wy, x, m) {
    const star = Math.random() < (m > 150 ? 0.3 : 0.15);
    ents.push({ k: star ? 'star' : 'rib', x: clamp(x, W * 0.12, W * 0.88), wy, t: 0, ph: rnd(0, TAU), col: BOWS[ribColor++ % BOWS.length], dead: false });
  }
  function spawnAt(wy) {
    const m = (wy - startWy) / PXM, d = clamp(m / 1600, 0, 1);
    if (m < 80 || Math.random() < 0.3 - 0.08 * d) { addPickup(wy, W * rnd(0.18, 0.82), m); return; }
    const wb = 1, wr = m > 180 ? 0.7 + d : 0, ws = m > 320 ? 0.55 + 0.6 * d : 0;
    const r = Math.random() * (wb + wr + ws), side = Math.random() < 0.5 ? -1 : 1;
    if (r < wb) {
      const dir = -side;
      ents.push({ k: 'birds', x: side < 0 ? rnd(-90, W * 0.25) : rnd(W * 0.75, W + 90), wy, dir, vx: dir * (65 + 70 * d + Math.random() * 30), n: 3 + ((Math.random() * (1.5 + d * 4.5)) | 0), sc: 0, t: 0, ph: rnd(0, TAU), dead: false });
    } else if (r < wb + wr) {
      ents.push({ k: 'rival', x: W / 2 + side * W * rnd(0.16, 0.32), wy, dir: side, sl: rnd(0.35, 0.8), col: RIVALS[(Math.random() * RIVALS.length) | 0], t: 0, ph: rnd(0, TAU), dead: false });
    } else {
      ents.push({ k: 'storm', x: W / 2 + side * W * rnd(0.24, 0.32), wy, rw: W * rnd(0.2, 0.28) * (1 + 0.45 * d), rh: rnd(70, 100) * (1 + 0.3 * d), t: 0, ph: rnd(0, TAU), sp: (Math.random() * stormSpr.length) | 0, dead: false });
    }
    if (Math.random() < 0.45) addPickup(wy + 150, W / 2 - side * W * rnd(0.05, 0.28), m);
  }
  function spawnUpdate() {
    while (nextSpawn < camY + H + 180) {
      spawnAt(nextSpawn);
      nextSpawn += lerp(430, 240, diffv) + Math.random() * 170;
    }
  }

  // ---------- yardımcı geometri ----------
  let bpx = 0, bpy = 0;
  function birdPos(e, i) {
    const row = (i + 1) >> 1, side = i & 1 ? 1 : -1, spread = 1 + e.sc * 2.5;
    bpx = e.x - e.dir * row * 20 * spread;
    bpy = e.wy + side * row * 11 * spread + e.sc * e.sc * 90 * (i === 0 ? 1 : side) + Math.sin(e.t * 2 + i) * 3;
  }
  function segDist2(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const t = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    const ex = ax + dx * t - px, ey = ay + dy * t - py;
    return ex * ex + ey * ey;
  }
  const rivalX = (e) => e.x + Math.sin(e.t * 0.9 + e.ph) * 10;

  // ---------- güncelleme ----------
  function updateGust(dt) {
    if (gust.st === 0) {
      gust.next -= dt;
      if (gust.next <= 0) {
        gust.st = 1; gust.t = 0;
        gust.dir = gust.first || Math.random() < 0.65 ? windDir : -windDir; gust.first = false;
        gust.max = 0.55 + 0.45 * diffv + Math.random() * 0.15; gust.dur = rnd(2.2, 3.2);
      }
    } else if (gust.st === 1) {
      gust.t += dt;
      if (gust.t >= 1.3) { gust.st = 2; gust.t = 0; }
    } else {
      gust.t += dt;
      gust.str = gust.max * Math.sin(Math.PI * Math.min(1, gust.t / gust.dur));
      if (gust.t >= gust.dur) { gust.st = 0; gust.str = 0; gust.next = lerp(8.5, 4.2, diffv) + Math.random() * 3; }
    }
  }
  function updateWind(dt, play) {
    if (play) { windFlipT -= dt; if (windFlipT <= 0) { windDir = -windDir; windFlipT = rnd(7, 12); } }
    windDirS += (windDir - windDirS) * Math.min(1, dt * 0.7);
    wind = windDirS * W * (0.085 + 0.035 * diffv) * (0.85 + 0.15 * Math.sin(time * 0.7)) + gust.dir * gust.str * W * 0.42;
    windS = clamp(wind / (W * 0.1), -1.6, 1.6);
  }

  function die(reason) {
    if (state !== 'playing') return;
    state = 'dying'; dieT = 0; holding = false; pointerId = null; keyHold = false;
    deadX = kite.x; deadWy = kite.wy;
    if (reason === 'edge') {
      overReason = kite.x < W / 2 ? 'tree' : 'roof';
      sfx.thud(); vibrate(40);
      emit(kite.x, kite.wy, 14, '#6fbf73', 140, 1, 3);
    } else {
      overReason = reason;
      sfx.snap(); vibrate([30, 40, 60]);
      emit(kite.x, kite.wy, 18, '#ffffff', 160, 0, 2);
    }
  }

  function collect(e) {
    e.dead = true;
    if (e.k === 'rib') {
      ribbons++; mult = 1 + 0.25 * ribbons; growTail(4);
      sfx.ribbon(ribbons - 1); vibrate(8);
      emit(e.x, e.wy, 16, e.col, 150, 0, 2.4);
      popup('×' + fmtMult(mult), e.x, e.wy + 18, e.col);
    } else {
      tension = Math.max(0, tension - 0.4);
      sfx.star(); vibrate(8);
      emit(e.x, e.wy, 18, '#ffe9a0', 170, 0, 2.2);
      popup('Gevşedi!', e.x, e.wy + 18, '#fff3c4');
    }
  }

  function updatePlay(dt) {
    runTime += dt;
    if (invuln > 0) invuln -= dt;
    const d = diffv;
    updateGust(dt);
    if (keyHold && pointerId === null) fingerX = kite.x + keyDir * W * 0.3;
    holding = pointerId !== null || keyHold;

    const tgtVy = holding ? 150 * (1 + 0.45 * d) : lerp(30, -12, d);
    kite.vy += (tgtVy - kite.vy) * Math.min(1, dt * (holding ? 2.4 : 1.5));
    if (holding) {
      const want = clamp((fingerX - kite.x) * 3.4, -W, W) + wind * 0.28;
      kite.vx += (want - kite.vx) * Math.min(1, dt * 5);
    } else {
      kite.vx += (wind - kite.vx) * Math.min(1, dt * 1.3);
    }
    if (stormIn) kite.vx += Math.sin(time * 6.3) * W * 0.9 * dt;
    kite.x += kite.vx * dt;
    kite.wy = Math.max(startWy - 150, kite.wy + kite.vy * dt);

    // gerginlik: çekerken artar, bırakınca gevşer; rüzgâra karşı çekmek ve fırtına sıçratır
    let rate;
    if (holding) {
      rate = 0.3 + 0.2 * d;
      if (gust.st === 2) rate += gust.str * (0.15 + 0.3 * ((fingerX - kite.x) * gust.dir < -12 ? 1 : 0));
    } else rate = -0.66;
    if (stormIn) rate += 0.42;
    tension = clamp(tension + rate * dt, 0, 1);

    // çarpışmalar
    const kx = kite.x, ky = kite.wy - 4;
    let inStorm = false;
    for (let i = 0; i < ents.length; i++) {
      const e = ents[i];
      if (e.dead) continue;
      if (e.k === 'rib' || e.k === 'star') {
        const dx = e.x - kx, dy = e.wy - ky;
        if (dx * dx + dy * dy < 900) collect(e);
      } else if (invuln <= 0) {
        if (e.k === 'birds') {
          if (e.sc) continue;
          for (let j = 0; j < e.n; j++) {
            birdPos(e, j);
            const dx = bpx - kx, dy = bpy - ky;
            if (dx * dx + dy * dy < 324) {
              e.sc = 0.001; tension = Math.min(1, tension + 0.16 + 0.1 * diffv); kite.vx += e.dir * W * 0.35;
              sfx.birds(); vibrate(15); emit(bpx, bpy, 10, '#e9edf5', 90, 1, 3);
              break;
            }
          }
        } else if (e.k === 'rival') {
          const bx = rivalX(e), by = e.wy, dx = bx - kx, dy = by - ky;
          if (dx * dx + dy * dy < 576 || segDist2(kx, ky, bx, by - 18, bx + e.dir * e.sl * 1500, by - 1518) < 100) { die('cut'); return; }
        } else if (e.k === 'storm') {
          const ux = (kx - e.x) / (e.rw * 0.82), uy = (ky - e.wy) / (e.rh * 0.78);
          if (ux * ux + uy * uy < 1) inStorm = true;
        }
      }
    }
    if (inStorm && !stormIn) { tension = Math.min(1, tension + 0.18); sfx.storm(); vibrate(12); }
    stormIn = inStorm;

    // yükseklik ve skor (kurdele çarpanı ile)
    const a = (kite.wy - startWy) / PXM;
    if (a > maxAlt) { score += (a - maxAlt) * mult; maxAlt = a; }
    diffv = clamp(maxAlt / 1600, 0, 1);
    spawnUpdate();

    const i = skyIndex(maxAlt), ph = skyT(maxAlt, i) > 0.5 ? i + 1 : i;
    if (ph !== curPhase) { curPhase = ph; Music.setPhase(ph); phaseLabel = PHASES[ph]; phaseT = 0; }

    if (tension > 0.85 && !nearWarned) { nearWarned = true; vibrate(18); } else if (tension < 0.7) nearWarned = false;
    if (holding && tension > 0.6) { creakT -= dt; if (creakT <= 0) { sfx.creak(tension); creakT = rnd(0.3, 0.8) * (1.5 - tension); } }

    if (kite.x < 16 || kite.x > W - 16) { die('edge'); return; }
    if (tension >= 1) { die('snap'); return; }
  }

  function updateMenu(dt) {
    const tx = W / 2 + Math.sin(time * 0.45) * W * 0.14, twy = HILL + H * 0.45 + Math.sin(time * 0.7) * 16;
    kite.vx += ((tx - kite.x) * 2 - kite.vx) * Math.min(1, dt * 3);
    kite.x += kite.vx * dt;
    kite.wy += (twy - kite.wy) * Math.min(1, dt * 2);
    tension = 0;
  }

  function updateDying(dt) {
    dieT += dt;
    if (overReason === 'tree' || overReason === 'roof') {
      kite.vx = 0; kite.vy = 0; kite.rot = Math.sin(dieT * 18) * 0.25 * Math.max(0, 1 - dieT);
    } else {
      kite.vx += (wind * 1.4 - kite.vx) * Math.min(1, dt * 1.2);
      kite.vy += (70 - kite.vy) * Math.min(1, dt * 1.2);
      kite.x += kite.vx * dt; kite.wy += kite.vy * dt;
      kite.rot += dt * (1.2 + dieT) * (wind >= 0 ? 1 : -1);
    }
    if (state === 'dying' && dieT > 1.15) showOver();
  }

  function updateEnts(dt) {
    for (let i = ents.length - 1; i >= 0; i--) {
      const e = ents[i];
      e.t += dt;
      if (e.k === 'birds') { e.x += e.vx * dt; if (e.sc) e.sc += dt; }
      else if (e.k === 'storm') e.x += wind * 0.05 * dt;
      const s = sy(e.wy);
      if (e.dead || s > H + 420 || (e.k === 'birds' && (e.x < -420 || e.x > W + 420 || e.sc > 1.6))) {
        ents[i] = ents[ents.length - 1]; ents.pop();
      }
    }
  }

  function updateTail(dt) {
    const steps = dt > 0.02 ? 2 : 1, h = dt / steps, h2 = h * h;
    const s = Math.sin(kite.rot), c = Math.cos(kite.rot);
    const ax = kite.x - 24 * s, ay = kite.wy - 24 * c, wf = wind * 2.2;
    for (let k = 0; k < steps; k++) {
      tail[0].x = ax; tail[0].y = ay;
      for (let i = 1; i < tailN; i++) {
        const p = tail[i], vx = (p.x - p.px) * 0.98, vy = (p.y - p.py) * 0.98;
        p.px = p.x; p.py = p.y;
        p.x += vx + (wf + Math.sin(time * 8 + i * 0.55) * 130) * h2;
        p.y += vy - 420 * h2;
      }
      for (let it = 0; it < 4; it++) {
        for (let i = 1; i < tailN; i++) {
          const a = tail[i - 1], b = tail[i], dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.001, df = (dist - SEG) / dist;
          if (i === 1) { b.x -= dx * df; b.y -= dy * df; }
          else { a.x += dx * df * 0.5; a.y += dy * df * 0.5; b.x -= dx * df * 0.5; b.y -= dy * df * 0.5; }
        }
      }
    }
  }

  function updateFx(dt) {
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (p.l <= 0) continue;
      p.l -= dt;
      const f = 1 - Math.min(1, dt * 1.6);
      p.vx *= f; p.vy *= f;
      if (p.k === 1) { p.vy -= 40 * dt; p.vx += Math.sin(time * 5 + i) * 30 * dt; }
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    for (const p of pops) if (p.l > 0) { p.l -= dt; p.y += 42 * dt; }
    // rüzgâr çizgileri
    const v = wind * 2.2 + (wind >= 0 ? 40 : -40);
    for (let i = 0; i < streaks.length; i++) {
      const s = streaks[i];
      s.x += v * s.sp * dt; s.y += camDy * 0.5;
      if (v > 0 && s.x > W + 20) { s.x = -s.len - rnd(0, 80); s.y = rnd(0, H); }
      else if (v < 0 && s.x < -s.len - 20) { s.x = W + rnd(0, 80); s.y = rnd(0, H); }
      if (s.y > H + 20) s.y -= H + 40;
    }
    for (const L of LAYERS) {
      for (const c of L.c) {
        c.x += wind * (0.15 + L.p * 0.35) * dt;
        const w = 260 * c.s;
        if (c.x > W + 40) c.x = -w - 20; else if (c.x < -w - 40) c.x = W + 20;
      }
    }
    if (phaseT < 9) phaseT += dt;
  }

  function updateAudio(dt) {
    audioT -= dt;
    if (audioT > 0) return;
    audioT = 0.1;
    const sp = Math.sqrt(kite.vx * kite.vx + kite.vy * kite.vy);
    if (state === 'playing') {
      const h = holding ? Math.pow(Math.max(0, (tension - 0.5) / 0.5), 2) * 0.03 : 0;
      Loops.set(0.012 + Math.min(1, sp / 260) * 0.05 + gust.str * 0.045, 380 + Math.min(sp, 400) * 1.5 + gust.str * 300, h, 700 + 520 * tension);
    } else Loops.set(state === 'menu' ? 0.014 : 0.008, 420, 0, 880);
  }

  function update(dt) {
    time += dt;
    const play = state === 'playing';
    updateWind(dt, play);
    if (play) updatePlay(dt);
    else if (state === 'menu') updateMenu(dt);
    else if (state === 'dying' || state === 'over') updateDying(dt);
    if (state === 'menu' || state === 'playing') {
      kite.rot += (clamp(kite.vx * 0.0022, -0.5, 0.5) + Math.sin(time * 2.3) * 0.04 - kite.rot) * Math.min(1, dt * 6);
    }
    updateEnts(dt);
    updateTail(dt);
    // kamera: uçurtma ekranın üst-ortasında kalır
    const prev = camY;
    if (state === 'menu' || state === 'playing') {
      const tgt = Math.max(0, kite.wy - H * 0.55);
      camY += (tgt - camY) * Math.min(1, dt * 3);
    }
    camDy = camY - prev;
    slackS += ((state === 'menu' ? 0.09 : holding ? 0.025 : 0.12) - slackS) * Math.min(1, dt * 4);
    stormV += ((stormIn && state === 'playing' ? 1 : 0) - stormV) * Math.min(1, dt * 3);
    updateFx(dt);
    updateAudio(dt);
    if (state === 'playing' || state === 'dying') syncHud();
  }

  // ---------- çizim ----------
  function skyIndex(a) { let i = 0; while (i < SKY.length - 1 && a >= SKY[i + 1].a) i++; return i; }
  function skyT(a, i) {
    if (i >= SKY.length - 1) return 0;
    const A = SKY[i], B = SKY[i + 1];
    return smooth(clamp(((a - A.a) / (B.a - A.a)) * 1.8 - 0.8, 0, 1));
  }
  function tri(ax, ay, bx, by, cx, cy, col) {
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.closePath();
    ctx.fillStyle = col; ctx.fill();
  }
  function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }

  function drawSky(a) {
    const i = skyIndex(a), t = skyT(a, i), A = SKY[i], B = SKY[Math.min(i + 1, SKY.length - 1)];
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, mixc(A.top, B.top, t)); g.addColorStop(0.55, mixc(A.mid, B.mid, t)); g.addColorStop(1, mixc(A.bot, B.bot, t));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    const nightF = clamp((a - 820) / 260, 0, 1), auroraF = clamp((a - 1380) / 320, 0, 1);
    // güneş: yükseldikçe batar
    const st = clamp(a / 900, 0, 1), sunA = 1 - clamp((st - 0.9) / 0.1, 0, 1);
    if (sunA > 0) {
      const sx = W * lerp(0.8, 0.66, st), sY = H * lerp(0.3, 1.02, smooth(st)), sr = lerp(22, 36, st);
      ctx.globalAlpha = 0.55 * sunA; ctx.drawImage(glowWarm, sx - sr * 5, sY - sr * 5, sr * 10, sr * 10);
      ctx.globalAlpha = sunA; ctx.fillStyle = mixc([255, 250, 228], [255, 168, 96], st); circle(sx, sY, sr);
    }
    if (nightF > 0) {
      ctx.fillStyle = '#fff';
      for (let k = 0; k < stars.length; k++) {
        const s = stars[k], y = ((s.y * (H + 40) + camY * 0.02) % (H + 40)) - 20;
        ctx.globalAlpha = nightF * s.b * (0.55 + 0.45 * Math.sin(time * 0.8 + s.ph));
        ctx.fillRect(s.x * W, y, s.r, s.r);
      }
      ctx.globalAlpha = nightF * 0.4; ctx.drawImage(glowW, W * 0.2 - 60, H * 0.13 - 60, 120, 120);
      ctx.globalAlpha = nightF; ctx.drawImage(moonSpr, W * 0.2 - 24, H * 0.13 - 24, 48, 48);
    }
    if (auroraF > 0) drawAurora(auroraF);
    ctx.globalAlpha = 1;
  }
  // kutup ışıkları: önbellekli dikey degrade şeritlerden oluşan yavaş dalgalanan perdeler
  const AUR = [[90, 255, 170], [80, 220, 255], [190, 130, 255]].map((c) => {
    const { c: cv2, g } = mk(4, 128), gr = g.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},0)`);
    gr.addColorStop(0.72, `rgba(${c[0]},${c[1]},${c[2]},0.55)`);
    gr.addColorStop(0.86, `rgba(${c[0]},${c[1]},${c[2]},0.35)`);
    gr.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 4, 128);
    return cv2;
  });
  function drawAurora(f) {
    ctx.globalCompositeOperation = 'lighter';
    const sw = 5;
    for (let b = 0; b < 3; b++) {
      const base = H * (0.2 + b * 0.09), h = 120 + b * 30, spr = AUR[b];
      for (let x = 0; x < W; x += sw) {
        const y = base + Math.sin(x * 0.008 + time * 0.25 + b * 2) * 26 + Math.sin(x * 0.021 - time * 0.4 + b) * 10;
        const hh = h * (0.75 + 0.25 * Math.sin(x * 0.013 + time * 0.3 + b));
        ctx.globalAlpha = f * (0.5 + 0.22 * Math.sin(x * 0.017 + time * 0.5 + b * 1.7) + 0.12 * Math.sin(x * 0.043 - time * 0.3));
        ctx.drawImage(spr, x, y - hh, sw, hh * 1.25);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawClouds(L, alpha) {
    const span = H + 320;
    ctx.globalAlpha = alpha * L.a;
    for (let i = 0; i < L.c.length; i++) {
      const c = L.c[i];
      let yy = (c.y + camY * L.p) % span;
      if (yy < 0) yy += span;
      yy -= 160;
      if (yy < c.yy - span * 0.5) c.x = rnd(-80, W - 60);
      c.yy = yy;
      const w = 260 * c.s, h = 120 * c.s;
      if (yy > H || yy + h < 0) continue;
      ctx.drawImage(cloudSpr[c.sp], c.x, yy, w, h);
    }
    ctx.globalAlpha = 1;
  }

  function hills(base, a1, f1, a2, f2, col) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H + 2);
    for (let x = 0; x <= W + 20; x += 20) ctx.lineTo(x, base - a1 - a1 * Math.sin(x * f1 + 0.8) - a2 * Math.sin(x * f2));
    ctx.lineTo(W + 20, H + 2); ctx.closePath(); ctx.fill();
  }
  function drawGround() {
    const gy = sy(HILL);
    let b = H - (HILL + 70 - camY * 0.5);
    if (b - 80 < H) hills(b, 22, 0.011, 10, 0.029, 'rgba(126,168,200,0.65)');
    b = H - (HILL + 30 - camY * 0.75);
    if (b - 60 < H) hills(b, 16, 0.017, 7, 0.041, 'rgba(104,172,146,0.85)');
    if (gy - 180 > H) return;
    // sol: ağaç, sağ: apartman (kenarlara çarpmak = takılmak)
    ctx.fillStyle = '#6b4f3a'; ctx.fillRect(-2, gy - 30, 10, 64);
    ctx.fillStyle = '#4f9d5d'; circle(-6, gy - 64, 34); circle(18, gy - 44, 24);
    ctx.fillStyle = '#5fb06c'; circle(2, gy - 76, 20);
    ctx.fillStyle = '#c9a98f'; ctx.fillRect(W - 34, gy - 120, 40, 160);
    ctx.fillStyle = '#b08b72'; ctx.fillRect(W - 38, gy - 126, 44, 8);
    ctx.fillStyle = 'rgba(255,240,200,0.85)';
    for (let r = 0; r < 5; r++) ctx.fillRect(W - 24, gy - 108 + r * 26, 12, 15);
    // tepe
    ctx.fillStyle = '#7cc47f'; ctx.beginPath(); ctx.ellipse(W / 2, gy + 160, Math.max(W * 0.78, 260), 160, 0, 0, TAU); ctx.fill();
    ctx.fillRect(0, gy + 150, W, Math.max(0, H - gy));
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.ellipse(W / 2, gy + 14, W * 0.3, 12, 0, 0, TAU); ctx.fill();
    // çocuk (ipi tutan el = çapa noktası)
    const x = W / 2 - 4, lift = holding && state === 'playing' ? 2 : 0;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#3a4660'; ctx.lineWidth = 3; ctx.beginPath();
    ctx.moveTo(x - 3, gy - 1); ctx.lineTo(x - 2, gy - 13); ctx.moveTo(x + 3, gy - 1); ctx.lineTo(x + 2, gy - 13); ctx.stroke();
    ctx.fillStyle = '#ff7a5c'; ctx.beginPath();
    ctx.moveTo(x - 6, gy - 12); ctx.lineTo(x + 6, gy - 12); ctx.lineTo(x + 5, gy - 28); ctx.lineTo(x - 5, gy - 28); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ff7a5c'; ctx.beginPath();
    ctx.moveTo(x + 4, gy - 26); ctx.lineTo(x + 11, gy - 36 + lift); ctx.moveTo(x - 4, gy - 26); ctx.lineTo(x - 8, gy - 17); ctx.stroke();
    ctx.fillStyle = '#f3c9a6'; circle(x, gy - 34, 6);
    ctx.fillStyle = '#4b3527'; ctx.beginPath(); ctx.arc(x, gy - 35, 6.3, Math.PI, 0); ctx.fill();
  }

  function tensionColor(T) {
    let r, g, b;
    if (T < 0.5) { const t = T / 0.5; r = 255; g = 255 - 60 * t; b = 255 - 165 * t; }
    else { const t = (T - 0.5) / 0.5; r = 255 - 10 * t; g = 195 - 115 * t; b = 90 - 15 * t; }
    return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
  }
  // ip: çocuğun elinden uçurtmaya sarkık eğri; kamera yükselse de ekranın altına kadar görünür
  function drawLine(kx, ky, slack, T, alpha) {
    if (alpha <= 0) return;
    let ax = W / 2 + ANCHOR_DX, ay = sy(ANCHOR_WY);
    const lim = H + 140;
    if (ay > lim) { const t = (lim - ky) / (ay - ky); ax = kx + (ax - kx) * t; ay = lim; }
    const dx = ax - kx, dy = ay - ky, len = Math.sqrt(dx * dx + dy * dy) || 1, sag = len * slack;
    const cx = (ax + kx) / 2 + windS * sag * 0.8, cy = (ay + ky) / 2 + sag * 0.45;
    const amp = T > 0.62 ? ((T - 0.62) / 0.38) * 2.8 : 0, nx = -dy / len, ny = dx / len;
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const t = i / 24, u = 1 - t;
      let x = u * u * kx + 2 * u * t * cx + t * t * ax, y = u * u * ky + 2 * u * t * cy + t * t * ay;
      if (amp) { const w = Math.sin(t * Math.PI) * amp * Math.sin(time * 48 + t * 17); x += nx * w; y += ny * w; }
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.globalAlpha = alpha * 0.3; ctx.lineWidth = 3.4; ctx.strokeStyle = 'rgb(28,44,84)'; ctx.stroke();
    ctx.globalAlpha = alpha; ctx.lineWidth = 1.5 + T * 0.8; ctx.strokeStyle = tensionColor(T); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawKite(x, y, rot, s, cols) {
    const c = Math.cos(rot) * s * DPR, si = Math.sin(rot) * s * DPR;
    ctx.setTransform(c, si, -si, c, x * DPR, y * DPR);
    tri(0, -26, -19, -6, 0, -6, cols[0]); tri(0, -26, 19, -6, 0, -6, cols[1]);
    tri(-19, -6, 0, 24, 0, -6, cols[2]); tri(19, -6, 0, 24, 0, -6, cols[3]);
    tri(0, -26, 19, -6, 0, 24, 'rgba(40,20,60,0.08)');
    ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(19, -6); ctx.lineTo(0, 24); ctx.lineTo(-19, -6); ctx.closePath();
    ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(70,45,35,0.55)'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(0, 23); ctx.moveTo(-18, -6); ctx.lineTo(18, -6);
    ctx.lineWidth = 1.7; ctx.strokeStyle = '#6b4a32'; ctx.stroke();
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  function bow(x, y, ang, col, s) {
    const c = Math.cos(ang) * s * DPR, si = Math.sin(ang) * s * DPR;
    ctx.setTransform(c, si, -si, c, x * DPR, y * DPR);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-4, -7); ctx.lineTo(4, -7); ctx.closePath();
    ctx.moveTo(0, 0); ctx.lineTo(-4, 7); ctx.lineTo(4, 7); ctx.closePath();
    ctx.fillStyle = col; ctx.fill();
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  function drawTail() {
    const n = tailN;
    ctx.beginPath(); ctx.moveTo(tail[0].x, sy(tail[0].y));
    for (let i = 1; i < n - 1; i++) {
      const p = tail[i], q = tail[i + 1], py = sy(p.y);
      ctx.quadraticCurveTo(p.x, py, (p.x + q.x) / 2, (py + sy(q.y)) / 2);
    }
    ctx.lineTo(tail[n - 1].x, sy(tail[n - 1].y));
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 2.2; ctx.strokeStyle = '#ff8c7c'; ctx.stroke();
    for (let i = 3; i < n - 1; i += 4) {
      const a = tail[i - 1], b = tail[i + 1];
      bow(tail[i].x, sy(tail[i].y), Math.atan2(sy(b.y) - sy(a.y), b.x - a.x), BOWS[((i - 3) >> 2) % BOWS.length], 1);
    }
  }

  function drawEnts(night) {
    // fırtına bulutları (arkada), yumuşak ve titreşimsiz parıltı
    for (let i = 0; i < ents.length; i++) {
      const e = ents[i];
      if (e.k !== 'storm') continue;
      const y = sy(e.wy);
      if (y < -e.rh * 2 || y > H + e.rh * 2) continue;
      ctx.globalAlpha = 0.92; ctx.drawImage(stormSpr[e.sp], e.x - e.rw * 1.2, y - e.rh * 1.3, e.rw * 2.4, e.rh * 2.6);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.16 + 0.07 * Math.sin(time * 1.3 + e.ph);
      ctx.drawImage(glowViolet, e.x - e.rw * 0.7, y - e.rh * 0.9, e.rw * 1.4, e.rh * 1.8);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
    // rakip uçurtmalar ve çapraz ipleri
    for (let i = 0; i < ents.length; i++) {
      const e = ents[i];
      if (e.k !== 'rival') continue;
      const bx = rivalX(e), y = sy(e.wy);
      if (y < -60 || y > H + 1600) continue;
      const ex = bx + e.dir * e.sl * 1500, ey = y + 18 + 1500;
      ctx.beginPath(); ctx.moveTo(bx, y + 18);
      ctx.quadraticCurveTo((bx + ex) / 2 + e.dir * 10, (y + ey) / 2 + 30, ex, ey);
      ctx.lineWidth = 1.4; ctx.strokeStyle = night ? 'rgba(225,230,255,0.6)' : 'rgba(44,44,66,0.6)'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx, y + 18);
      for (let k = 1; k <= 8; k++) ctx.lineTo(bx + Math.sin(time * 4 + k * 0.8 + e.ph) * k * 1.4 - e.dir * k * 1.5, y + 18 + k * 6);
      ctx.lineWidth = 1.8; ctx.strokeStyle = e.col[0]; ctx.stroke();
      if (night) { ctx.globalAlpha = 0.25; ctx.drawImage(glowW, bx - 30, y - 30, 60, 60); ctx.globalAlpha = 1; }
      drawKite(bx, y, Math.sin(e.t * 1.1 + e.ph) * 0.12 + e.dir * 0.1, 0.75, e.col);
    }
    // kuş sürüleri
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 2.2;
    ctx.strokeStyle = night ? 'rgba(214,222,244,0.92)' : 'rgba(44,56,82,0.9)';
    for (let i = 0; i < ents.length; i++) {
      const e = ents[i];
      if (e.k !== 'birds') continue;
      ctx.globalAlpha = e.sc ? Math.max(0, 1 - e.sc / 1.5) : 1;
      ctx.beginPath();
      for (let j = 0; j < e.n; j++) {
        birdPos(e, j);
        const x = bpx, y = sy(bpy), f = 4 + 5 * Math.sin(time * 11 + j * 0.9 + e.ph);
        ctx.moveTo(x - 11, y); ctx.quadraticCurveTo(x - 5, y - f, x, y + 1); ctx.quadraticCurveTo(x + 5, y - f, x + 11, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // kurdeleler ve rüzgâr yıldızları
    for (let i = 0; i < ents.length; i++) {
      const e = ents[i];
      if (e.k !== 'rib' && e.k !== 'star') continue;
      const x = e.x, y = sy(e.wy) + Math.sin(time * 2 + e.ph) * 4;
      if (y < -30 || y > H + 30) continue;
      if (e.k === 'rib') {
        ctx.globalAlpha = 0.45; ctx.drawImage(glowW, x - 24, y - 24, 48, 48); ctx.globalAlpha = 1;
        const a = Math.sin(time * 1.6 + e.ph) * 0.2;
        bow(x, y, a + Math.PI / 2, e.col, 1.6);
        ctx.beginPath(); ctx.moveTo(x - 2, y + 2); ctx.quadraticCurveTo(x - 7, y + 10, x - 4 + Math.sin(time * 3 + e.ph) * 2, y + 17);
        ctx.moveTo(x + 2, y + 2); ctx.quadraticCurveTo(x + 7, y + 10, x + 4 + Math.sin(time * 3 + e.ph + 1) * 2, y + 17);
        ctx.lineWidth = 2.4; ctx.strokeStyle = e.col; ctx.stroke();
        ctx.fillStyle = '#fff'; circle(x, y, 2.6);
      } else {
        ctx.globalAlpha = 0.6; ctx.drawImage(glowGold, x - 28, y - 28, 56, 56); ctx.globalAlpha = 1;
        const r0 = time * 0.8 + e.ph;
        ctx.beginPath();
        for (let k = 0; k < 8; k++) {
          const r = k & 1 ? 4.2 : 12, a = r0 + (k * Math.PI) / 4;
          if (k) ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); else ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        }
        ctx.closePath(); ctx.fillStyle = '#fff6c8'; ctx.fill();
        ctx.lineWidth = 1.2; ctx.strokeStyle = '#ffc94d'; ctx.stroke();
      }
    }
  }

  function drawStreaks() {
    const a = (state === 'menu' ? 0.08 : 0.07) + 0.3 * gust.str;
    ctx.globalAlpha = a; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < streaks.length; i++) {
      const s = streaks[i];
      ctx.moveTo(s.x, s.y); ctx.quadraticCurveTo(s.x + s.len * 0.5, s.y - 3 - 3 * Math.sin(time * 2 + i), s.x + s.len, s.y);
    }
    ctx.stroke(); ctx.globalAlpha = 1;
    if (state !== 'playing' || gust.st === 0) return;
    // esinti uyarısı: rüzgârın geldiği kenarda yumuşak ok
    const al = gust.st === 1 ? 0.45 + 0.25 * Math.sin(gust.t * 5) : (0.7 * gust.str) / gust.max;
    const d = gust.dir, x0 = d > 0 ? 24 : W - 24, y0 = H * 0.36;
    ctx.globalAlpha = al; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    for (let k = 0; k < 3; k++) { const x = x0 + d * k * 9; ctx.moveTo(x - d * 5, y0 - 9); ctx.lineTo(x + d * 5, y0); ctx.lineTo(x - d * 5, y0 + 9); }
    ctx.stroke();
    ctx.font = '600 11px ' + FONT; ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff';
    ctx.fillText('rüzgâr', x0 + d * 9, y0 + 24);
    ctx.globalAlpha = 1;
  }

  function drawFx() {
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (p.l <= 0) continue;
      const y = sy(p.y);
      if (y < -10 || y > H + 10) continue;
      ctx.globalAlpha = Math.min(1, (p.l / p.m) * 1.4); ctx.fillStyle = p.c;
      ctx.beginPath();
      if (p.k === 1) ctx.ellipse(p.x, y, p.s * 1.4, p.s * 0.6, time * 3 + i, 0, TAU);
      else ctx.arc(p.x, y, p.s * (0.5 + 0.5 * p.l / p.m), 0, TAU);
      ctx.fill();
    }
    ctx.textAlign = 'center'; ctx.font = '800 17px ' + FONT;
    for (const p of pops) {
      if (p.l <= 0) continue;
      const y = sy(p.y);
      ctx.globalAlpha = Math.min(1, p.l * 2) * 0.35; ctx.fillStyle = '#1c2a44'; ctx.fillText(p.t, p.x + 1, y + 1.5);
      ctx.globalAlpha = Math.min(1, p.l * 2); ctx.fillStyle = p.c; ctx.fillText(p.t, p.x, y);
    }
    ctx.globalAlpha = 1;
  }

  function render() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    const a = state === 'menu' ? 0 : maxAlt, night = a > 900;
    drawSky(a);
    const cloudA = 1 - 0.55 * clamp((a - 820) / 260, 0, 1);
    drawClouds(LAYERS[0], cloudA); drawClouds(LAYERS[1], cloudA);
    drawGround();
    drawEnts(night);

    // oyuncunun ipi, kuyruğu ve uçurtması
    const ky = sy(kite.wy), sn = Math.sin(kite.rot), cs = Math.cos(kite.rot);
    const atx = kite.x + 6 * sn, aty = ky - 6 * cs;
    const broke = (state === 'dying' || state === 'over') && (overReason === 'snap' || overReason === 'cut');
    if (broke) {
      drawLine(deadX + windS * 40 * dieT, sy(deadWy - 900 * dieT * dieT), 0.22, 0, 1 - dieT / 1.4);
      ctx.beginPath(); ctx.moveTo(atx, aty);
      for (let k = 1; k <= 8; k++) ctx.lineTo(atx + Math.sin(time * 5 + k) * k * 0.8 - windS * k * 2, aty + k * 6);
      ctx.lineWidth = 1.5; ctx.strokeStyle = '#fff'; ctx.stroke();
    } else drawLine(atx, aty, slackS, tension, 1);
    if (night) { ctx.globalAlpha = 0.3; ctx.drawImage(glowW, kite.x - 44, ky - 44, 88, 88); ctx.globalAlpha = 1; }
    if (invuln > 0 && state === 'playing') {
      ctx.globalAlpha = Math.min(1, invuln) * (0.35 + 0.15 * Math.sin(time * 3));
      ctx.drawImage(glowGold, kite.x - 50, ky - 50, 100, 100); ctx.globalAlpha = 1;
    }
    drawTail();
    drawKite(kite.x, ky, kite.rot, 1, KITE);

    drawClouds(LAYERS[2], cloudA);
    drawStreaks();
    drawFx();

    if (stormV > 0.01) { ctx.fillStyle = 'rgba(36,26,76,' + (0.16 * stormV).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
    if (state === 'playing' && tension > 0.7) {
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, 'rgba(255,90,70,0)'); g.addColorStop(1, 'rgba(255,90,70,' + (((tension - 0.7) / 0.3) * 0.22).toFixed(3) + ')');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    if (phaseT < 3.2 && state === 'playing') {
      const al = phaseT < 0.6 ? phaseT / 0.6 : phaseT > 2.4 ? (3.2 - phaseT) / 0.8 : 1;
      ctx.textAlign = 'center'; ctx.font = '700 22px ' + FONT;
      ctx.globalAlpha = al * 0.3; ctx.fillStyle = '#1c2a44'; ctx.fillText(phaseLabel, W / 2 + 1, H * 0.22 + 2);
      ctx.globalAlpha = al * 0.95; ctx.fillStyle = '#ffffff'; ctx.fillText(phaseLabel, W / 2, H * 0.22);
      ctx.globalAlpha = 1;
    }
  }

  // ---------- arayüz ----------
  const ui = {
    hud: $('hud'), alt: $('hAlt'), best: $('hBest'), mult: $('hMult'),
    menu: $('menu'), pause: $('pause'), over: $('over'), how: $('how'), mBest: $('mBest'),
  };
  const show = (el, v) => el.classList.toggle('hidden', !v);
  let hudScore = -1, hudMult = -1;
  function syncHud() {
    const s = Math.floor(score);
    if (s !== hudScore) { hudScore = s; ui.alt.textContent = s + ' m'; }
    if (mult !== hudMult) { hudMult = mult; ui.mult.textContent = '×' + fmtMult(mult); show(ui.mult, ribbons > 0); }
  }
  function syncToggles() {
    document.querySelectorAll('.tog').forEach((b) => b.setAttribute('aria-pressed', String(!!save[b.dataset.k])));
  }

  function start() {
    resetRun();
    state = 'playing';
    show(ui.menu, false); show(ui.over, false); show(ui.pause, false); show(ui.hud, true);
    ui.best.textContent = 'En iyi ' + save.best + ' m';
    hudScore = -1; hudMult = -1; syncHud();
    Music.setPhase(0); sfx.start();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }
  function pauseGame() {
    if (state !== 'playing') return;
    state = 'paused'; holding = false; pointerId = null; keyHold = false;
    show(ui.pause, true);
    Loops.set(0.006, 400, 0, 880);
    render();
  }
  function resumeGame() {
    if (state !== 'paused') return;
    state = 'playing'; show(ui.pause, false); last = performance.now();
  }
  function toMenu() {
    state = 'menu';
    show(ui.pause, false); show(ui.over, false); show(ui.hud, false); show(ui.menu, true);
    ui.mBest.textContent = save.best;
    resetRun(); Music.setPhase(0);
  }
  function showOver() {
    state = 'over';
    const s = Math.floor(score), rec = s > save.best;
    if (rec) { save.best = s; persist(); }
    $('oReason').textContent = REASONS[overReason] || REASONS.snap;
    $('oScore').textContent = s + ' m';
    $('oDetail').textContent = 'Yükseklik ' + Math.floor(maxAlt) + ' m · Kurdele ×' + fmtMult(mult) + ' · ' + fmtTime(runTime);
    const ob = $('oBest');
    ob.textContent = rec ? 'Yeni rekor!' : 'En iyi: ' + save.best + ' m';
    ob.classList.toggle('rec', rec);
    const ads = !continued && !!(window.Ads && typeof window.Ads.rewarded === 'function');
    show($('bCont'), ads);
    show(ui.hud, false); show(ui.over, true);
    sfx.over();
  }
  function continueRun() {
    if (state !== 'over') return;
    continued = true;
    kite.x = clamp(deadX, W * 0.3, W * 0.7); kite.wy = deadWy; kite.vx = 0; kite.vy = 40; kite.rot = 0;
    tension = 0; invuln = 2.5; stormIn = false; holding = false; pointerId = null;
    gust.st = 0; gust.str = 0; gust.next = rnd(4, 6);
    for (let i = ents.length - 1; i >= 0; i--) {
      const e = ents[i];
      if (e.k !== 'rib' && e.k !== 'star' && e.wy > camY - 400 && e.wy < camY + H + 600) { ents[i] = ents[ents.length - 1]; ents.pop(); }
    }
    nextSpawn = Math.max(nextSpawn, camY + H + 600);
    tailReset();
    state = 'playing';
    show(ui.over, false); show(ui.hud, true);
    sfx.start();
  }

  $('bPlay').addEventListener('click', start);
  $('bAgain').addEventListener('click', start);
  $('bPause').addEventListener('click', pauseGame);
  $('bResume').addEventListener('click', resumeGame);
  $('bQuit').addEventListener('click', toMenu);
  $('bMenu').addEventListener('click', toMenu);
  $('bHow').addEventListener('click', (e) => {
    const open = ui.how.classList.contains('hidden');
    show(ui.how, open); e.currentTarget.setAttribute('aria-expanded', String(open)); sfx.click();
  });
  $('bCont').addEventListener('click', () => {
    let r;
    try { r = window.Ads && window.Ads.rewarded ? window.Ads.rewarded() : false; } catch (e) { r = false; }
    Promise.resolve(r).then((ok) => { if (ok !== false) continueRun(); }).catch(() => {});
  });
  document.querySelectorAll('.tog').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.k;
    save[k] = !save[k]; persist(); syncToggles();
    if (k === 'sound') { if (save.sound) { ensureAC(); Loops.start(); sfx.click(); } else Loops.stop(); }
    else if (save.music) { ensureAC(); Music.start(); } else Music.stop();
  }));

  // dokunma / fare: basılı tut = çek ve yönlendir, bırak = gevşet
  cv.addEventListener('pointerdown', (e) => {
    if (state !== 'playing' || pointerId !== null) return;
    pointerId = e.pointerId; fingerX = e.clientX; holding = true;
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* */ }
    e.preventDefault();
  });
  cv.addEventListener('pointermove', (e) => { if (e.pointerId === pointerId) fingerX = e.clientX; });
  const release = (e) => { if (e.pointerId === pointerId) { pointerId = null; holding = keyHold; } };
  cv.addEventListener('pointerup', release);
  cv.addEventListener('pointercancel', release);
  cv.addEventListener('lostpointercapture', release);
  cv.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' || e.code === 'KeyP') { if (state === 'playing') pauseGame(); else if (state === 'paused') resumeGame(); return; }
    if (state !== 'playing') return;
    if (e.code === 'Space' || e.code === 'ArrowUp') { keyHold = true; e.preventDefault(); }
    else if (e.code === 'ArrowLeft') keyDir = -1;
    else if (e.code === 'ArrowRight') keyDir = 1;
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') keyHold = false;
    else if ((e.code === 'ArrowLeft' && keyDir < 0) || (e.code === 'ArrowRight' && keyDir > 0)) keyDir = 0;
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (state === 'playing') pauseGame();
      if (ac && ac.state === 'running') ac.suspend().catch(() => {});
    } else if (ac && state !== 'paused' && ac.state === 'suspended') ac.resume().catch(() => {});
  });
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 150));

  // ---------- döngü ----------
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    let dt = (now - last) / 1000;
    last = now;
    if (state === 'paused' || !(dt > 0)) return;
    if (dt > 0.05) dt = 0.05;
    update(dt);
    render();
  }

  resize();
  initClouds();
  kite.x = W / 2; kite.wy = HILL + H * 0.45;
  resetRun();
  ready = true;
  syncToggles();
  ui.mBest.textContent = save.best;
  requestAnimationFrame(frame);

  // otomatik test kancaları
  window.__ucurtma = {
    get state() { return state; },
    start, pause: pauseGame, resume: resumeGame, menu: toMenu, continueRun,
    get score() { return Math.floor(score); },
    get alt() { return Math.floor(maxAlt); },
    get tension() { return tension; },
    get time() { return runTime; },
    get reason() { return overReason; },
    get kite() { return { x: kite.x, y: sy(kite.wy) }; },
    get hazards() { return ents.length; },
    warp(m) { if (state !== 'playing') return; kite.wy += m * PXM; camY = Math.max(0, kite.wy - H * 0.55); nextSpawn = camY + H; ents.length = 0; invuln = 3; tailReset(); },
  };
})();
