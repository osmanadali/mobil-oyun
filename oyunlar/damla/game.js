// ===== Damla — yağmurlu bir gecede camdan süzülen tek bir damla =====
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, k) => a + (b - a) * k;
  const rand = (a, b) => a + Math.random() * (b - a);
  const TAU = Math.PI * 2;
  const hash = n => { const s = Math.sin(n) * 43758.5453; return s - Math.floor(s); };
  const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

  // ---------- kayıt ----------
  const KEY = 'damla.v1';
  const save = { best: 0, sound: true, music: true };
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s && typeof s === 'object') {
      if (Number.isFinite(s.best) && s.best > 0) save.best = Math.floor(s.best);
      if (typeof s.sound === 'boolean') save.sound = s.sound;
      if (typeof s.music === 'boolean') save.music = s.music;
    }
  } catch (e) { /* depolama yok */ }
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* yok say */ } };

  // ---------- sabitler ----------
  const PY = 0.34;              // damlanın ekrandaki dikey konumu
  const CM = 20;                // 20 tasarım pikseli = 1 cm
  const MAXM = 4.2, DEADM = 0.1, SENS = 1.15;
  const MAX_DROPS = 46, TRAIL_N = 90, TB_N = 140, PART_N = 110;
  const PAL = [[255, 186, 112], [96, 214, 204], [244, 140, 172], [176, 198, 255], [196, 164, 255]];
  const DS = 64, DR = 22, DCX = 32, DCY = 30, BS = 16, BR = 5;

  // ---------- durum ----------
  let state = 'menu', camY = 0, t = 0, deathT = 0, deathReason = '', usedContinue = false, god = false;
  let genBarY = 0, genDropY = 0, genHazY = 0, runT = 2, dist = 0, inDry = false, inSticky = false;
  let vaporT = 0, tbAcc = 0, lastTrailY = 0, keyL = false, keyR = false, drag = null, mouseX = null;
  const P = { x: 0, tx: 0, y: 0, m: 1, r: 12, vy: 0, wob: 0, wph: 0, lean: 0, inv: 0, col: [190, 200, 230] };
  const bars = [], drops = [], hazards = [], runners = [], bokeh = [], rain = [];
  const trailX = new Float32Array(TRAIL_N), trailY = new Float32Array(TRAIL_N);
  let trailHead = 0, trailCount = 0, tbHead = 0;
  const tb = []; for (let i = 0; i < TB_N; i++) tb.push({ x: 0, y: 0, r: 0, on: false });
  const parts = []; for (let i = 0; i < PART_N; i++) parts.push({ on: false, k: 0, x: 0, y: 0, vx: 0, vy: 0, r: 0, life: 0, max: 1 });

  // ---------- tuval ----------
  const cv = $('game'), ctx = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1, paneX = 0, paneW = 0, S = 1, BT = 22, SH = 18, TH = 640;
  let bgCv, vigCv, beadTiles = [], barTex, stileL, stileR, beadSpr, dropSpr = [];
  const bokehSpr = [], dryTex = [], stickyTex = [];
  const R = m => 12.5 * S * Math.sqrt(Math.max(m, 0));
  const distAt = y => dist + (y - P.y) / S;
  const diffAt = y => clamp(distAt(y) / 30000, 0, 1);

  // ---------- çizim yardımcıları ----------
  const mixw = v => (v + (255 - v) * 0.45) | 0;
  function glow(g, x, y, r, rgb, a) {
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, `rgba(${rgb},${a})`); rg.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function dropPath(c, x, y, rx, ry, tip, lean) {
    const ty = y - ry * (1 + tip * 0.45), tx = x - lean * rx * 0.55, k = 0.5523 * (1 - tip * 0.7), q = 0.5523;
    c.beginPath();
    c.moveTo(tx, ty);
    c.bezierCurveTo(tx + rx * k, ty, x + rx, y - ry * q, x + rx, y);
    c.bezierCurveTo(x + rx, y + ry * q, x + rx * q, y + ry, x, y + ry);
    c.bezierCurveTo(x - rx * q, y + ry, x - rx, y + ry * q, x - rx, y);
    c.bezierCurveTo(x - rx, y - ry * q, tx - rx * k, ty, tx, ty);
    c.closePath();
  }
  // cam damlası: arkadaki bokeh rengini alan gövde, sol üstte parlak yansıma, altta koyu kırılma kenarı
  function paintDrop(c, x, y, rx, ry, col, tip, lean, shadow) {
    const Rm = Math.max(rx, ry), r = col[0] | 0, g = col[1] | 0, b = col[2] | 0;
    if (shadow) {
      c.fillStyle = 'rgba(0,0,0,0.15)';
      c.beginPath(); c.ellipse(x + rx * 0.1, y + ry * 0.3, rx * 1.08, ry * 1.0, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(0,0,0,0.14)';
      c.beginPath(); c.ellipse(x + rx * 0.06, y + ry * 0.18, rx * 0.97, ry * 0.93, 0, 0, TAU); c.fill();
    }
    dropPath(c, x, y, rx, ry, tip, lean);
    const g1 = c.createRadialGradient(x - rx * 0.3, y - ry * 0.38, Rm * 0.05, x, y + ry * 0.1, Rm * 1.12);
    g1.addColorStop(0, `rgba(${mixw(r)},${mixw(g)},${mixw(b)},0.6)`);
    g1.addColorStop(0.45, `rgba(${r * 0.72 | 0},${g * 0.72 | 0},${b * 0.78 | 0},0.42)`);
    g1.addColorStop(0.82, `rgba(${r * 0.3 | 0},${g * 0.3 | 0},${b * 0.38 | 0},0.62)`);
    g1.addColorStop(1, 'rgba(3,5,12,0.8)');
    c.fillStyle = g1; c.fill();
    const g2 = c.createRadialGradient(x, y + ry * 0.5, 0, x, y + ry * 0.5, rx * 0.75);
    g2.addColorStop(0, `rgba(${mixw(r)},${mixw(g)},${mixw(b)},0.7)`);
    g2.addColorStop(1, `rgba(${r},${g},${b},0)`);
    const op = c.globalCompositeOperation; c.globalCompositeOperation = 'lighter';
    c.fillStyle = g2; c.beginPath(); c.ellipse(x, y + ry * 0.48, rx * 0.66, ry * 0.36, 0, 0, TAU); c.fill();
    c.globalCompositeOperation = op;
    c.strokeStyle = 'rgba(0,0,0,0.38)'; c.lineWidth = Math.max(1, Rm * 0.13);
    c.beginPath(); c.ellipse(x, y, rx * 0.9, ry * 0.9, 0, 0.12 * Math.PI, 0.88 * Math.PI); c.stroke();
    dropPath(c, x, y, rx, ry, tip, lean);
    c.strokeStyle = 'rgba(220,235,255,0.16)'; c.lineWidth = Math.max(0.75, Rm * 0.04); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.88)';
    c.beginPath(); c.ellipse(x - rx * 0.36, y - ry * 0.4, rx * 0.2, ry * 0.12, -0.6, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.beginPath(); c.arc(x + rx * 0.34, y + ry * 0.38, Rm * 0.07, 0, TAU); c.fill();
  }
  function paintBead(g, x, y, r, dim) {
    const a = dim ? 0.7 : 1;
    if (r < 1.1) {
      g.fillStyle = `rgba(8,10,24,${0.35 * a})`; g.beginPath(); g.arc(x, y + r * 0.25, r, 0, TAU); g.fill();
      g.fillStyle = `rgba(235,242,255,${0.5 * a})`; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.45, 0, TAU); g.fill();
      return;
    }
    g.fillStyle = `rgba(0,0,0,${0.2 * a})`; g.beginPath(); g.ellipse(x + r * 0.12, y + r * 0.3, r * 1.02, r * 0.95, 0, 0, TAU); g.fill();
    const rg = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
    rg.addColorStop(0, `rgba(225,235,255,${0.3 * a})`); rg.addColorStop(0.6, `rgba(120,140,190,${0.16 * a})`); rg.addColorStop(1, `rgba(8,10,24,${0.55 * a})`);
    g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.fillStyle = `rgba(230,238,255,${0.26 * a})`; g.beginPath(); g.ellipse(x, y + r * 0.5, r * 0.55, r * 0.28, 0, 0, TAU); g.fill();
    g.fillStyle = `rgba(255,255,255,${0.85 * a})`; g.beginPath(); g.arc(x - r * 0.35, y - r * 0.38, Math.max(0.35, r * 0.24), 0, TAU); g.fill();
  }
  function rrPath(c, x, y, w, h, rl, rr) {
    c.moveTo(x + rl, y);
    c.lineTo(x + w - rr, y);
    if (rr > 0) { c.arcTo(x + w, y, x + w, y + rr, rr); c.lineTo(x + w, y + h - rr); c.arcTo(x + w, y + h, x + w - rr, y + h, rr); }
    else { c.lineTo(x + w, y); c.lineTo(x + w, y + h); }
    c.lineTo(x + rl, y + h);
    if (rl > 0) { c.arcTo(x, y + h, x, y + h - rl, rl); c.lineTo(x, y + rl); c.arcTo(x, y, x + rl, y, rl); }
    else { c.lineTo(x, y + h); c.lineTo(x, y); }
    c.closePath();
  }
  const wrapY = (y, r, h, f) => { f(y); if (y < r) f(y + h); if (y > h - r) f(y - h); };

  // ---------- önceden çizilen katmanlar ----------
  function bokehSprite(col, disc) {
    const c = mk(128, 128), g = c.getContext('2d'), rg = g.createRadialGradient(64, 64, 0, 64, 64, 63), s = col.join(',');
    if (disc) {
      rg.addColorStop(0, `rgba(${s},0.5)`); rg.addColorStop(0.72, `rgba(${s},0.58)`); rg.addColorStop(0.88, `rgba(${s},0.8)`);
      rg.addColorStop(0.95, `rgba(${s},0.3)`); rg.addColorStop(1, `rgba(${s},0)`);
    } else {
      rg.addColorStop(0, `rgba(${s},0.85)`); rg.addColorStop(0.3, `rgba(${s},0.5)`); rg.addColorStop(0.65, `rgba(${s},0.14)`); rg.addColorStop(1, `rgba(${s},0)`);
    }
    g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
    return c;
  }
  function buildDry() {   // tozlu, mat leke + kurumuş damla halkaları
    const w = 256, h = 192, c = mk(w, h), g = c.getContext('2d');
    for (let i = 0; i < 9; i++) glow(g, w / 2 + rand(-60, 60), h / 2 + rand(-34, 34), rand(42, 80), '190,178,158', 0.09);
    for (let i = 0; i < 1100; i++) {
      const a = Math.random() * TAU, q = Math.sqrt(Math.random()), s = rand(0.5, 1.5);
      g.fillStyle = `rgba(226,214,192,${((1 - q) * rand(0.12, 0.42)).toFixed(3)})`;
      g.fillRect(w / 2 + Math.cos(a) * q * w * 0.46, h / 2 + Math.sin(a) * q * h * 0.46, s, s);
    }
    g.lineWidth = 1.1;
    for (let i = 0; i < 6; i++) {
      g.strokeStyle = `rgba(232,218,192,${rand(0.08, 0.16).toFixed(3)})`;
      g.beginPath(); g.arc(w / 2 + rand(-70, 70), h / 2 + rand(-45, 45), rand(5, 15), 0, TAU); g.stroke();
    }
    g.strokeStyle = 'rgba(230,220,200,0.1)'; g.lineWidth = 0.7;
    for (let i = 0; i < 7; i++) {
      const x = rand(60, 196), y = rand(50, 142);
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + rand(-20, 20), y + rand(-12, 12), x + rand(-30, 30), y + rand(-14, 14)); g.stroke();
    }
    return c;
  }
  function buildSticky() {   // yağlı parmak izi: yanardöner, kırık halkalar
    const w = 200, h = 240, c = mk(w, h), g = c.getContext('2d'), cx = w / 2 + rand(-8, 8), cy = h * 0.55, ph = rand(0, TAU);
    glow(g, cx, cy, 100, '190,170,255', 0.1);
    g.lineWidth = 2; g.lineCap = 'round';
    for (let k = 5; k < 94; k += 5.4) {
      g.setLineDash([rand(18, 70), rand(3, 9), rand(10, 40), rand(2, 6)]);
      g.strokeStyle = `hsla(${(290 - k * 1.5) | 0},70%,78%,${(0.22 * (1 - k / 100)).toFixed(3)})`;
      g.beginPath();
      for (let a = 0; a <= TAU + 0.05; a += 0.07) {
        const wb = Math.sin(a * 3 + ph + k * 0.21) * 1.8 + Math.sin(a * 5 - k * 0.13) * 1.1, sn = Math.sin(a);
        const x = cx + Math.cos(a) * (k * 0.8 + wb), y = cy + sn * (k + wb) - (sn < 0 ? k * 0.12 : 0);
        if (a === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();
    }
    g.setLineDash([]);
    return c;
  }
  function buildBeadTile() {
    const c = mk(paneW * DPR, TH * DPR), g = c.getContext('2d'), ph = rand(0, 100);
    g.scale(DPR, DPR);
    for (let i = 0; i < 12; i++) {
      const x = rand(0, paneW), r = rand(50, 150) * S, a = rand(0.02, 0.045);
      wrapY(rand(0, TH), r, TH, yy => glow(g, x, yy, r, '205,215,240', a));
    }
    const n = Math.round(paneW * TH / 300);
    for (let i = 0; i < n; i++) {
      const x = rand(0, paneW), y = rand(0, TH);
      const dens = 0.5 + 0.5 * Math.sin(x * 0.021 + ph + Math.sin(y * 0.013 + ph) * 2.2) * Math.cos(y * 0.017 - x * 0.006);
      if (Math.random() > 0.25 + dens * 0.75) continue;
      const u = Math.random(), r = (u < 0.76 ? rand(0.45, 1.25) : u < 0.97 ? rand(1.25, 2.3) : rand(2.3, 3)) * S;
      wrapY(y, r + 2, TH, yy => paintBead(g, x, yy, r, true));
    }
    return c;
  }
  function buildAssets() {
    const q = 0.16;
    let g, lg;
    // gece arka planı + bulanık şehir (düşük çözünürlük → doğal bulanıklık)
    bgCv = mk(W * q, H * q); g = bgCv.getContext('2d'); g.scale(bgCv.width / W, bgCv.height / H);
    lg = g.createLinearGradient(0, 0, 0, H);
    lg.addColorStop(0, '#05070f'); lg.addColorStop(0.45, '#0a0d1d'); lg.addColorStop(1, '#170f1d');
    g.fillStyle = lg; g.fillRect(0, 0, W, H);
    glow(g, W * 0.18, H * 0.98, H * 0.55, '255,150,80', 0.13);
    glow(g, W * 0.9, H * 0.62, H * 0.42, '70,190,190', 0.07);
    glow(g, W * 0.55, H * 0.15, H * 0.4, '230,110,160', 0.05);
    for (let x = -20; x < W;) {
      const bw = rand(40, 110) * S, top = H * rand(0.3, 0.64);
      g.fillStyle = 'rgba(2,3,8,0.38)'; g.fillRect(x, top, bw, H - top);
      for (let wy = top + 10; wy < H; wy += rand(14, 22)) {
        for (let wx = x + 6; wx < x + bw - 6; wx += rand(10, 16)) {
          if (Math.random() < 0.22) { g.fillStyle = Math.random() < 0.7 ? 'rgba(255,190,120,0.2)' : 'rgba(150,220,230,0.16)'; g.fillRect(wx, wy, 4, 5); }
        }
      }
      x += bw + rand(4, 30) * S;
    }
    // vinyet + kenar buğusu
    vigCv = mk(W * q, H * q); g = vigCv.getContext('2d'); g.scale(vigCv.width / W, vigCv.height / H);
    const rg = g.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.3, W / 2, H * 0.45, Math.hypot(W, H) * 0.6);
    rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,0.55)');
    g.fillStyle = rg; g.fillRect(0, 0, W, H);
    lg = g.createLinearGradient(0, 0, 0, H);
    lg.addColorStop(0, 'rgba(200,212,240,0.07)'); lg.addColorStop(0.16, 'rgba(200,212,240,0)');
    lg.addColorStop(0.82, 'rgba(200,212,240,0)'); lg.addColorStop(1, 'rgba(200,212,240,0.08)');
    g.fillStyle = lg; g.fillRect(0, 0, W, H);
    // damla ve boncuk sprite'ları
    dropSpr = [0, 1, 2, 3].map(i => { const c = mk(DS * DPR, DS * DPR), cg = c.getContext('2d'); cg.scale(DPR, DPR); paintDrop(cg, DCX, DCY, DR, DR * 0.94, PAL[i], 0, 0, true); return c; });
    beadSpr = mk(BS * DPR, BS * DPR); g = beadSpr.getContext('2d'); g.scale(DPR, DPR); paintBead(g, BS / 2, BS / 2, BR, false);
    if (!bokehSpr.length) {
      for (let i = 0; i < PAL.length; i++) bokehSpr.push(bokehSprite(PAL[i], false), bokehSprite(PAL[i], true));
      dryTex.push(buildDry(), buildDry()); stickyTex.push(buildSticky(), buildSticky());
    }
    // camdaki buğu boncukları (tek döşeme: kendi içinde dikişsiz sarılır; iki farklı döşeme birleşimde çizgi bırakıyordu)
    TH = 640;
    beadTiles = [buildBeadTile()];
    // pencere çıtası dokusu: koyu ahşap, ince parlaklık, altında cama düşen gölge
    barTex = mk(paneW * DPR, (BT + SH) * DPR); g = barTex.getContext('2d'); g.scale(DPR, DPR);
    lg = g.createLinearGradient(0, BT, 0, BT + SH); lg.addColorStop(0, 'rgba(0,0,0,0.42)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = lg; g.fillRect(0, BT, paneW, SH);
    lg = g.createLinearGradient(0, 0, 0, BT);
    lg.addColorStop(0, '#6d5442'); lg.addColorStop(0.1, '#4d3a2e'); lg.addColorStop(0.5, '#2e231c'); lg.addColorStop(1, '#151010');
    g.fillStyle = lg; g.fillRect(0, 0, paneW, BT);
    for (let i = 0; i < 26; i++) {
      const y0 = rand(2.5, BT - 2.5), a = rand(0.03, 0.08), dark = Math.random() < 0.5;
      g.strokeStyle = dark ? `rgba(0,0,0,${(a * 2).toFixed(3)})` : `rgba(255,214,170,${a.toFixed(3)})`; g.lineWidth = rand(0.5, 1.4);
      g.beginPath(); g.moveTo(0, y0);
      for (let x = 0; x <= paneW + 24; x += 24) g.lineTo(x, y0 + Math.sin(x * 0.013 + i) * 1.2);
      g.stroke();
    }
    g.fillStyle = 'rgba(255,226,192,0.3)'; g.fillRect(0, 0.5, paneW, 1);
    g.fillStyle = 'rgba(255,210,170,0.07)'; g.fillRect(0, BT * 0.16, paneW, BT * 0.14);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, BT - 1, paneW, 1);
    // geniş ekranda yan kasalar
    stileL = ctx.createLinearGradient(0, 0, paneX, 0);
    stileL.addColorStop(0, '#0b0807'); stileL.addColorStop(Math.max(0, 1 - 18 / Math.max(paneX, 1)), '#2a1f19'); stileL.addColorStop(1, '#4a382c');
    stileR = ctx.createLinearGradient(paneX + paneW, 0, W, 0);
    stileR.addColorStop(0, '#4a382c'); stileR.addColorStop(Math.min(1, 18 / Math.max(paneX, 1)), '#2a1f19'); stileR.addColorStop(1, '#0b0807');
    // bokeh noktaları
    bokeh.length = 0;
    const area = clamp(W * H / (390 * 844), 0.7, 2.4), CW = [0.38, 0.27, 0.22, 0.08, 0.05];
    const L = [[15, 8, 24, 0.05, 0.2, 0.38], [11, 22, 50, 0.1, 0.16, 0.3], [6, 55, 105, 0.18, 0.09, 0.17]];
    for (let li = 0; li < 3; li++) {
      const [n, r0, r1, f, a0, a1] = L[li];
      for (let i = 0; i < Math.round(n * area); i++) {
        let u = Math.random(), ci = 0;
        while (ci < 4 && u > CW[ci]) { u -= CW[ci]; ci++; }
        const disc = Math.random() < (li < 2 ? 0.55 : 0.25);
        bokeh.push({ x: rand(0, W), y: rand(0, H + 320), r: rand(r0, r1) * S, f, dr: rand(2, 6) * S * (li + 1) * 0.5, a: rand(a0, a1), spr: ci * 2 + (disc ? 1 : 0), ph: rand(0, TAU), seed: rand(0, 1000) });
      }
    }
    rain.length = 0;
    for (let i = 0; i < 34; i++) rain.push({ x: rand(-30, W), y: rand(-60, H), l: rand(14, 30) * S, v: rand(650, 950) * S });
  }

  function resize() {
    const oldPane = paneW;
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, window.innerWidth); H = Math.max(1, window.innerHeight);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    paneW = Math.min(W, 560); paneX = (W - paneW) / 2;
    S = clamp(paneW / 390, 0.82, 1.25);
    BT = Math.round(22 * S); SH = Math.round(18 * S);
    if (oldPane && Math.abs(oldPane - paneW) > 0.5) {
      const k = paneW / oldPane;
      P.x *= k; P.tx *= k;
      for (const d of drops) { d.x *= k; d.r = R(d.m); }
      for (const b of bars) { for (const gp of b.gaps) { gp[0] *= k; gp[1] *= k; } for (let j = 0; j < b.beads.length; j += 2) b.beads[j] *= k; }
      for (const h of hazards) { h.x *= k; h.w *= k; }
      for (const rn of runners) rn.x *= k;
      for (let i = 0; i < TRAIL_N; i++) trailX[i] *= k;
      for (const b of tb) b.x *= k;
      for (const p of parts) p.x *= k;
    }
    P.r = R(P.m);
    ctx.imageSmoothingEnabled = true;
    buildAssets();
    if (state !== 'menu') camY = P.y - H * PY;
    drawnPaused = false;
  }

  // ---------- ses (Web Audio, tamamen sentez) ----------
  let ac = null, sfx = null, mus = null, noiseBuf = null, hissG = null;
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  function ensureAC() {
    try {
      if (!ac) {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) return null;
        ac = new C();
        const comp = ac.createDynamicsCompressor();
        comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 3; comp.connect(ac.destination);
        sfx = ac.createGain(); sfx.gain.value = 1; sfx.connect(comp);
        mus = ac.createGain(); mus.gain.value = 0;
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2300; lp.Q.value = 0.4;
        mus.connect(lp); lp.connect(comp);
        noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
        const d = noiseBuf.getChannelData(0); let b = 0;
        for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b = 0.985 * b + 0.15 * w; d[i] = (w * 0.55 + b * 0.45) * 0.8; }
      }
      if (ac.state === 'suspended' && !document.hidden) ac.resume().catch(() => {});
    } catch (e) { return null; }
    return ac;
  }
  const canSfx = () => save.sound && ensureAC() && ac.state !== 'closed';
  function blip(f0, f1, t, v, dec, type, dest) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + Math.min(0.06, dec * 0.4));
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
    o.connect(g); g.connect(dest || sfx); o.start(t); o.stop(t + dec + 0.03);
  }
  function noiseHit(t, v, f, q, len, type, dest, f2) {
    const src = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noiseBuf; fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + len * 0.85);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    src.connect(fl); fl.connect(g); g.connect(dest || sfx); src.start(t, Math.random() * 1.5); src.stop(t + len + 0.03);
  }
  const PENT = [86, 84, 81, 79, 77, 74, 72, 69, 67, 65, 62, 60];   // Re minör pentatonik, inen
  let walk = 0;
  function plink(dm) {
    if (!canSfx()) return;
    try {
      const tiny = dm < 0.12, t0 = ac.currentTime + 0.005;
      const idx = clamp(Math.round(1 + P.m * 1.5 + dm * 2.4) + [0, 1, 0, -1][walk++ & 3], 0, PENT.length - 1), f = hz(PENT[idx]);
      blip(f * 0.78, f, t0, tiny ? 0.05 : 0.09 + Math.min(0.05, dm * 0.05), tiny ? 0.16 : 0.4);
      if (!tiny) blip(f * 2, f * 2, t0 + 0.01, 0.018, 0.14);
    } catch (e) { /* ses yok */ }
  }
  function sSplash() {
    if (!canSfx()) return;
    try {
      const t0 = ac.currentTime + 0.005;
      noiseHit(t0, 0.3, 2600, 0.9, 0.5, 'bandpass', sfx, 380);
      blip(140, 55, t0, 0.2, 0.26);
      for (let i = 0; i < 4; i++) { const f = hz(PENT[2 + (Math.random() * 6 | 0)]); blip(f * 0.8, f, t0 + 0.06 + i * 0.07 + Math.random() * 0.03, 0.035, 0.12); }
    } catch (e) { /* yok */ }
  }
  function sDry() {
    if (!canSfx()) return;
    try {
      const t0 = ac.currentTime + 0.005, o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(560, t0); o.frequency.exponentialRampToValueAtTime(170, t0 + 0.9);
      g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(0.08, t0 + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.0);
      o.connect(g); g.connect(sfx); o.start(t0); o.stop(t0 + 1.05);
      noiseHit(t0, 0.05, 3200, 0.5, 0.9, 'highpass');
    } catch (e) { /* yok */ }
  }
  function sPass() {
    if (!canSfx()) return;
    try { const t0 = ac.currentTime + 0.005; blip(hz(81), hz(81), t0, 0.035, 0.5); blip(hz(86), hz(86), t0 + 0.08, 0.03, 0.6); } catch (e) { /* yok */ }
  }
  function sClick() { if (!canSfx()) return; try { blip(620, 700, ac.currentTime + 0.005, 0.03, 0.08); } catch (e) { /* yok */ } }
  function setHiss(on) {   // kuru lekede hafif cızırtı
    if (!ac) return;
    try {
      if (!hissG) {
        if (!on) return;
        const src = ac.createBufferSource(), hp = ac.createBiquadFilter();
        hissG = ac.createGain(); hissG.gain.value = 0;
        src.buffer = noiseBuf; src.loop = true; hp.type = 'highpass'; hp.frequency.value = 2600;
        src.connect(hp); hp.connect(hissG); hissG.connect(sfx); src.start();
      }
      hissG.gain.setTargetAtTime(on && save.sound ? 0.035 : 0, ac.currentTime, 0.08);
    } catch (e) { /* yok */ }
  }
  const buzz = p => {
    if (!save.sound) return;
    try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(p); } catch (e) { /* yok */ }
  };

  // lo-fi müzik: Rhodes benzeri akorlar (Dm9 – G13 – Cmaj9 – Am9) + yağmur
  const Music = (() => {
    const CH = [{ b: 38, n: [53, 57, 60, 64] }, { b: 43, n: [53, 57, 59, 64] }, { b: 36, n: [52, 55, 59, 62] }, { b: 45, n: [55, 59, 60, 64] }];
    const MEL = [62, 65, 67, 69, 72, 74], E8 = 60 / 72 / 2, VOL = 0.75;
    let on = false, timer = 0, next = 0, step = 0, mode = 'menu', rainOn = false;
    function rh(m, t0, v, len) {
      const f = hz(m), g = ac.createGain(), o1 = ac.createOscillator(), o2 = ac.createOscillator(), o3 = ac.createOscillator(), g2 = ac.createGain(), g3 = ac.createGain();
      o1.type = 'sine'; o1.frequency.value = f;
      o2.type = 'triangle'; o2.frequency.value = f * 1.003; g2.gain.value = 0.28;
      o3.type = 'sine'; o3.frequency.value = f * 4.01;
      g3.gain.setValueAtTime(0.0001, t0); g3.gain.linearRampToValueAtTime(0.12, t0 + 0.01); g3.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
      g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(v, t0 + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
      o1.connect(g); o2.connect(g2); g2.connect(g); o3.connect(g3); g3.connect(g); g.connect(mus);
      const e = t0 + len + 0.05; o1.start(t0); o2.start(t0); o3.start(t0); o1.stop(e); o2.stop(e); o3.stop(e);
    }
    function bass(m, t0, v, len) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.value = hz(m);
      g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(v, t0 + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
      o.connect(g); g.connect(mus); o.start(t0); o.stop(t0 + len + 0.05);
    }
    function startRain() {
      if (rainOn) return; rainOn = true;
      const src = ac.createBufferSource(), hp = ac.createBiquadFilter(), lp = ac.createBiquadFilter(), g = ac.createGain();
      src.buffer = noiseBuf; src.loop = true;
      hp.type = 'highpass'; hp.frequency.value = 500; lp.type = 'lowpass'; lp.frequency.value = 2600; g.gain.value = 0.06;
      const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 700; lfo.connect(lg); lg.connect(lp.frequency);
      src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(mus);
      const lp2 = ac.createBiquadFilter(), g2 = ac.createGain(); lp2.type = 'lowpass'; lp2.frequency.value = 320; g2.gain.value = 0.07;
      src.connect(lp2); lp2.connect(g2); g2.connect(mus);
      src.start(); lfo.start();
    }
    function sched() {
      if (!on || !ac) return;
      try {
        if (next < ac.currentTime - 0.1) next = ac.currentTime + 0.05;
        while (next < ac.currentTime + 0.5) {
          const s = step % 8, c = CH[(step >> 3) % 4], t0 = next + (s & 1 ? E8 * 0.18 : 0);
          if (s === 0) { for (let i = 0; i < 4; i++) rh(c.n[i], t0 + i * 0.018, 0.045, 3.4); bass(c.b, t0, 0.12, 3.0); }
          if (s === 5) { rh(c.n[2], t0, 0.024, 1.5); rh(c.n[3], t0 + 0.015, 0.02, 1.5); }
          if ((s === 3 || s === 7) && Math.random() < 0.28) rh(MEL[Math.random() * MEL.length | 0] + 12, t0, 0.02, 1.2);
          if (mode === 'game') {
            if (s === 6) bass(c.b + 12, t0, 0.045, 0.5);
            if (s === 0 || s === 5) blip(120, 42, t0, 0.16, 0.3, 'sine', mus);
            if (s === 2 || s === 6) noiseHit(t0, 0.035, 1900, 0.7, 0.16, 'bandpass', mus);
            if (s & 1) noiseHit(t0, 0.01, 7500, 0.5, 0.04, 'highpass', mus);
          }
          next += E8; step++;
        }
      } catch (e) { /* ses yok */ }
    }
    return {
      start() {
        if (on || !save.music || !ensureAC()) return;
        on = true; startRain();
        next = Math.max(next, ac.currentTime + 0.15);
        const g = mus.gain, n = ac.currentTime;
        g.cancelScheduledValues(n); g.setValueAtTime(g.value, n); g.linearRampToValueAtTime(VOL, n + 2.5);
        clearInterval(timer); timer = setInterval(sched, 100); sched();
      },
      stop() {
        if (!on) return;
        on = false; clearInterval(timer);
        if (ac) { const g = mus.gain, n = ac.currentTime; g.cancelScheduledValues(n); g.setValueAtTime(g.value, n); g.linearRampToValueAtTime(0, n + 0.6); }
      },
      setMode(m) { mode = m; }
    };
  })();

  // ---------- dünya üretimi ----------
  function tintIdx(x, y) {
    const u = x / Math.max(paneW, 1), v = y * 0.0006 / S;
    if (Math.random() < 0.15) return 3;
    const a = Math.sin(u * 3.3 + v * 1.7), b = Math.sin(-u * 2.6 + v * 1.15 + 2.1), c = Math.sin(u * 1.9 - v * 2.3 + 4.2);
    return a >= b && a >= c ? 0 : b >= c ? 1 : 2;
  }
  function nearBar(y, pad) { for (let i = 0; i < bars.length; i++) { const b = bars[i]; if (y > b.y - pad && y < b.y + BT + pad) return true; } return false; }
  function inHaz(h, x, y, pad) { const dx = (x - h.x) / (h.w * 0.42 + pad), dy = (y - h.y) / (h.h * 0.42 + pad); return dx * dx + dy * dy < 1; }
  function inGaps(gaps, x, hw) { for (let i = 0; i < gaps.length; i++) if (x - hw >= gaps[i][0] && x + hw <= gaps[i][1]) return true; return false; }
  function addDrop(x, y, m) {
    if (drops.length >= MAX_DROPS) return;
    const r = R(m);
    x = clamp(x, r + 2, paneW - r - 2);
    if (nearBar(y, r + 6 * S)) return;
    for (let i = 0; i < hazards.length; i++) if (hazards[i].type === 0 && inHaz(hazards[i], x, y, 0)) return;
    if (state === 'play' && Math.abs(y - P.y) < 50 * S && Math.abs(x - P.x) < 40 * S) return;
    drops.push({ x, y, m, r, ti: tintIdx(x, y), ph: rand(0, TAU), wob: 0, vy: m > 0.65 ? rand(14, 30) * S * m : 0, dead: false });
  }
  function spawnDropRow(y) {
    const D = diffAt(y), u = Math.random();
    let m = u < 0.62 ? rand(0.07, 0.26) : u < 0.93 ? rand(0.26, 0.6) : rand(0.7, lerp(1.4, 1.0, D));
    m *= lerp(1, 0.8, D);
    const x = rand(0, paneW), yy = y + rand(-20, 20) * S;
    addDrop(x, yy, m);
    if (Math.random() < 0.3) { const n = 1 + (Math.random() * 3 | 0); for (let k = 0; k < n; k++) addDrop(x + rand(-40, 40) * S, yy + rand(-35, 35) * S, rand(0.05, 0.14)); }
  }
  function spawnBar(y) {
    const D = diffAt(y), minGap = 2 * R(MAXM) * 0.8 + 12 * S, mg = 8 * S;
    let two = paneW > 300 * S && Math.random() < lerp(0.5, 0.3, D);
    const gw = Math.max(minGap, lerp(150, 84, D) * S * (two ? 0.85 : 1) * rand(0.9, 1.1));
    const half = paneW / 2, gaps = [];
    if (two && half - gw / 2 - 6 * S > mg + gw / 2) {
      const c1 = rand(mg + gw / 2, half - gw / 2 - 6 * S), c2 = rand(half + gw / 2 + 6 * S, paneW - mg - gw / 2);
      gaps.push([c1 - gw / 2, c1 + gw / 2], [c2 - gw / 2, c2 + gw / 2]);
    } else {
      two = false;
      const c = rand(mg + gw / 2, paneW - mg - gw / 2);
      gaps.push([c - gw / 2, c + gw / 2]);
    }
    const beads = [];
    for (let x = rand(4, 20) * S; x < paneW; x += rand(14, 40) * S) if (!gaps.some(g => x > g[0] - 6 * S && x < g[1] + 6 * S)) beads.push(x, rand(1.2, 3) * S);
    bars.push({ y, gaps, beads, passed: false });
    if (Math.random() < lerp(0.6, 0.3, D)) {
      const g = gaps[Math.random() * gaps.length | 0];
      addDrop((g[0] + g[1]) / 2 + rand(-0.2, 0.2) * gw, y - rand(70, 160) * S, rand(0.25, 0.55));
    }
  }
  function spawnHaz(y) {
    if (distAt(y) < 2700) return;
    const sticky = distAt(y) > 7000 && Math.random() < 0.38;
    const w = sticky ? paneW * rand(0.26, 0.36) : paneW * rand(0.26, 0.5);
    const h = sticky ? w * 1.2 : rand(90, 190) * S;
    for (let i = 0; i < bars.length; i++) { const b = bars[i]; if (y + h / 2 + 24 * S > b.y && y - h / 2 - 24 * S < b.y + BT) y = b.y + BT + h / 2 + 30 * S; }
    hazards.push({ type: sticky ? 1 : 0, x: rand(w * 0.35, paneW - w * 0.35), y, w, h, v: Math.random() * 2 | 0, rot: rand(-0.3, 0.3) });
  }
  function generate(full) {
    const ahead = camY + H + 200 * S;
    if (full) {
      while (genBarY < ahead + 500 * S) { spawnBar(genBarY); genBarY += lerp(1150, 520, diffAt(genBarY)) * S * rand(0.85, 1.2); }
      while (genHazY < ahead + 300 * S) { spawnHaz(genHazY); genHazY += lerp(1500, 650, diffAt(genHazY)) * S * rand(0.6, 1.3); }
    }
    genDropY = Math.max(genDropY, camY - 50);
    while (genDropY < ahead) { spawnDropRow(genDropY); genDropY += lerp(80, 250, diffAt(genDropY)) * S * rand(0.55, 1.45); }
  }
  function cull() {
    const top = camY - 120 * S;
    let j = 0;
    for (let i = 0; i < drops.length; i++) { const d = drops[i]; if (!d.dead && d.y + d.r > top) drops[j++] = d; }
    drops.length = j; j = 0;
    for (let i = 0; i < bars.length; i++) { const b = bars[i]; if (b.y + BT + SH > top) bars[j++] = b; }
    bars.length = j; j = 0;
    for (let i = 0; i < hazards.length; i++) { const h = hazards[i]; if (h.y + h.h / 2 > top) hazards[j++] = h; }
    hazards.length = j;
  }
  function hitsBar(x, y, r) {
    for (let i = 0; i < bars.length; i++) { const b = bars[i]; if (y + r > b.y && y - r < b.y + BT && !inGaps(b.gaps, x, r)) return true; }
    return false;
  }

  // ---------- parçacıklar ----------
  function emit(k, x, y, vx, vy, r, life) {
    for (let i = 0; i < PART_N; i++) {
      const p = parts[i];
      if (!p.on) { p.on = true; p.k = k; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.r = r; p.life = 0; p.max = life; return; }
    }
  }
  function updParts(dt) {
    const dr = Math.exp(-5 * dt);
    for (let i = 0; i < PART_N; i++) {
      const p = parts[i];
      if (!p.on) continue;
      p.life += dt;
      if (p.life >= p.max) { p.on = false; continue; }
      if (p.k === 0) { p.vx *= dr; p.vy = p.vy * dr + 120 * S * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
      else if (p.k === 2) { p.y -= 22 * S * dt; p.x += p.vx * dt; p.r += 6 * S * dt; }
    }
  }
  function updDrops(dt) {
    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      if (d.wob > 0) d.wob = Math.max(0, d.wob - dt * 0.6);
      if (d.vy > 0) { const ny = d.y + d.vy * dt; if (hitsBar(d.x, ny, d.r)) d.vy = 0; else d.y = ny; }
    }
  }

  // ---------- oyun akışı ----------
  function merge(d) {
    const dm = d.m, tot = P.m + dm, shift = (d.x - P.x) * dm / tot;
    P.x += shift; P.tx += shift * 0.6;
    P.m = Math.min(MAXM, tot);
    if (dm >= 0.12) { P.wob = Math.min(0.35, P.wob + 0.06 + 0.5 * dm / tot); P.wph = 0; emit(1, d.x, d.y, 0, 0, d.r, 0.55); }
    d.dead = true;
    plink(dm);
    if (dm > 0.4) buzz(10);
  }
  function die(reason) {
    state = 'dying'; deathT = 0; deathReason = reason; inDry = false; setHiss(false); drag = null;
    if (reason === 'splash') {
      P.vy = 0;
      for (let i = 0; i < 20; i++) {
        const a = rand(Math.PI * 1.05, Math.PI * 1.95), sp = rand(60, 260) * S;
        emit(0, P.x + Math.cos(a) * P.r * 0.4, P.y + P.r * 0.3, Math.cos(a) * sp, Math.sin(a) * sp * 0.8, rand(1, 2.6) * S * Math.sqrt(Math.max(P.m, 0.3)), rand(1.2, 2.2));
      }
      emit(1, P.x, P.y + P.r * 0.5, 0, 0, P.r, 0.6);
      sSplash(); buzz(45);
    } else {
      for (let i = 0; i < 10; i++) emit(2, P.x + rand(-6, 6) * S, P.y - rand(0, 8) * S, rand(-12, 12) * S, 0, rand(2, 5) * S, rand(0.8, 1.4));
      sDry(); buzz([18, 40, 18]);
    }
    Music.setMode('menu');
  }
  function commitBest() {
    const cm = Math.floor(dist / CM);
    if (cm > save.best) { save.best = cm; persist(); return true; }
    return false;
  }
  function showOver() {
    state = 'over';
    const cm = Math.floor(dist / CM), nb = commitBest();
    $('overTitle').textContent = deathReason === 'splash' ? 'Damla çıtaya çarptı' : 'Damla kurudu';
    $('overDist').textContent = fmt(cm);
    $('overBest').textContent = fmt(save.best);
    $('newBest').hidden = !nb;
    const canAd = !!(window.Ads && typeof window.Ads.rewarded === 'function') && !usedContinue;
    btnRevive.hidden = !canAd; btnRevive.disabled = false;
    hide(hud); hideAll(); show(ovOver);
  }
  function resetRun() {
    bars.length = 0; drops.length = 0; hazards.length = 0; runners.length = 0;
    for (const p of parts) p.on = false;
    for (const b of tb) b.on = false;
    trailCount = 0; trailHead = 0; dist = 0; usedContinue = false; inDry = false; inSticky = false; setHiss(false);
    P.x = P.tx = paneW / 2; P.y = 0; P.m = 1; P.r = R(1); P.vy = 60 * S; P.wob = 0; P.lean = 0; P.inv = 0;
    camY = P.y - H * PY; lastTrailY = P.y; tbAcc = 0; drag = null;
    genBarY = P.y + 1350 * S; genHazY = P.y + 2700 * S; genDropY = camY + 10;
    addDrop(paneW / 2 + 5 * S, P.y + 150 * S, 0.3);
    addDrop(paneW / 2 - 16 * S, P.y + 330 * S, 0.22);
    addDrop(paneW / 2 + 28 * S, P.y + 520 * S, 0.4);
    generate(true);
  }
  function startRun() {
    ensureAC(); Music.start(); Music.setMode('game');
    state = 'play'; resetRun();
    hideAll(); show(hud); hudRec = false; updHUD(true);
    last = performance.now();
  }
  function pauseGame() {
    if (state !== 'play') return;
    state = 'pause'; drag = null; inDry = false; setHiss(false); drawnPaused = false;
    Music.setMode('menu'); hide(hud); hideAll(); show(ovPause);
  }
  function resumeGame() {
    if (state !== 'pause') return;
    state = 'play'; Music.setMode('game'); hideAll(); show(hud); last = performance.now();
  }
  function toMenu() {
    if (state === 'play' || state === 'pause') commitBest();
    state = 'menu'; inDry = false; setHiss(false); drag = null; Music.setMode('menu');
    bars.length = 0; hazards.length = 0; trailCount = 0;
    for (const b of tb) b.on = false;
    $('menuBest').textContent = fmt(save.best);
    hide(hud); hideAll(); show(ovMenu);
  }
  function revive() {
    if (state !== 'over') return;
    usedContinue = true;
    const lo = camY - 60 * S, hi = P.y + H * 0.9;
    let j = 0;
    for (const b of bars) if (b.y + BT < lo || b.y > hi) bars[j++] = b;
    bars.length = j; j = 0;
    for (const h of hazards) if (h.y + h.h / 2 < lo || h.y - h.h / 2 > hi) hazards[j++] = h;
    hazards.length = j;
    P.m = Math.max(P.m, 1.3); P.r = R(P.m); P.inv = 2.2; P.vy = 40 * S; P.wob = 0.3; P.wph = 0;
    P.x = clamp(P.x, P.r, paneW - P.r); P.tx = P.x;
    genBarY = Math.max(genBarY, hi + 200 * S);
    state = 'play'; Music.setMode('game'); hideAll(); show(hud); updHUD(true); last = performance.now();
  }
  function requestRevive() {
    const A = window.Ads;
    if (!A || typeof A.rewarded !== 'function' || usedContinue || state !== 'over') return;
    let done = false;
    const ok = v => { if (done) return; if (v === false) { btnRevive.disabled = false; return; } done = true; revive(); };
    btnRevive.disabled = true;
    try {
      const r = A.rewarded(ok);
      if (r && typeof r.then === 'function') r.then(ok, () => { btnRevive.disabled = false; });
      else if (r === true) ok(true);
    } catch (e) { btnRevive.disabled = false; }
  }

  function update(dt) {
    const D = diffAt(P.y);
    let dry = false, sticky = false;
    for (let i = 0; i < hazards.length; i++) { const h = hazards[i]; if (inHaz(h, P.x, P.y, P.r * 0.4)) { if (h.type === 0) dry = true; else sticky = true; } }
    if (dry !== inDry) { inDry = dry; setHiss(dry); }
    inSticky = sticky;
    // hız: kütle büyüdükçe artar
    const target = (95 + 85 * Math.sqrt(P.m)) * (1 + 0.32 * D) * S * (sticky ? 0.45 : 1);
    P.vy += (target - P.vy) * (1 - Math.exp(-(sticky ? 6 : 2.5) * dt));
    const dy = P.vy * dt;
    P.y += dy; dist += dy / S;
    // yönlendirme: büyük damla daha ağır döner
    if (keyL || keyR) P.tx += ((keyR ? 1 : 0) - (keyL ? 1 : 0)) * 430 * S * dt;
    P.tx = clamp(P.tx, P.r * 0.9, paneW - P.r * 0.9);
    const k = 15 / (0.5 + 0.5 * P.m) * (sticky ? 0.4 : 1), ox = P.x;
    P.x += (P.tx - P.x) * (1 - Math.exp(-k * dt));
    P.lean += (clamp((P.x - ox) / Math.max(dt, 1e-3) / (500 * S), -1, 1) - P.lean) * (1 - Math.exp(-8 * dt));
    // kütle kaybı (arkada boncuk izi bırakır)
    P.m -= (0.04 + 0.032 * P.m + (dry ? 0.6 : 0) + (sticky ? 0.05 : 0)) * dt;
    if (P.inv > 0) P.inv -= dt;
    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      if (d.dead) continue;
      const ddx = d.x - P.x, ddy = d.y - P.y, d2 = ddx * ddx + ddy * ddy, rr = P.r + d.r * 0.75;
      if (d2 < rr * rr) merge(d);
      else {
        const near = P.r + d.r + 9 * S;
        if (d2 < near * near) { const pull = (1 - Math.exp(-6 * dt)) * 0.5; d.x -= ddx * pull; d.y -= ddy * pull; d.wob = 0.12; }
      }
    }
    if (god) P.m = Math.max(P.m, 0.3);
    P.m = Math.min(P.m, MAXM); P.r = R(Math.max(P.m, 0.02));
    // çıtalar
    for (let i = 0; i < bars.length; i++) {
      const b = bars[i];
      if (P.y + P.r * 0.82 > b.y && P.y - P.r * 0.82 < b.y + BT) {
        if (!inGaps(b.gaps, P.x, P.r * 0.78) && P.inv <= 0 && !god) { P.y = Math.min(P.y, b.y - P.r * 0.5); camY = P.y - H * PY; die('splash'); return; }
      } else if (!b.passed && P.y - P.r > b.y + BT) { b.passed = true; sPass(); }
    }
    // iz
    if (P.y - lastTrailY > 6 * S) {
      lastTrailY = P.y; trailX[trailHead] = P.x; trailY[trailHead] = P.y - P.r * 0.5;
      trailHead = (trailHead + 1) % TRAIL_N; if (trailCount < TRAIL_N) trailCount++;
    }
    tbAcc -= dy;
    if (tbAcc <= 0) {
      tbAcc = rand(9, 24) * S;
      const b = tb[tbHead]; tbHead = (tbHead + 1) % TB_N;
      b.on = true; b.x = P.x + rand(-0.35, 0.35) * P.r; b.y = P.y - P.r * rand(0.7, 1.1); b.r = rand(0.6, 1.5) * S * (0.6 + 0.4 * Math.sqrt(P.m));
    }
    if (dry) { vaporT -= dt; if (vaporT <= 0) { vaporT = 0.07; emit(2, P.x + rand(-0.6, 0.6) * P.r, P.y - P.r * 0.3, rand(-10, 10) * S, 0, rand(2, 4) * S, 0.9); } }
    if (P.m <= DEADM && !god) { die('dry'); return; }
    P.wob *= Math.exp(-3.2 * dt); P.wph += dt * 17;
    updColor(dt);
    camY = P.y - H * PY;
    generate(true); cull(); updDrops(dt); updParts(dt); updHUD(false);
  }
  function updateDying(dt) {
    deathT += dt;
    P.vy *= Math.exp(-5 * dt); P.y += P.vy * dt; camY = P.y - H * PY;
    updDrops(dt); updParts(dt);
    if (deathT > 1.05) showOver();
  }
  function idle(dt) {
    camY += 26 * S * dt;
    generate(false); cull(); updDrops(dt); updParts(dt);
  }
  function ambient(dt) {
    for (let i = 0; i < rain.length; i++) {
      const r = rain[i]; r.y += r.v * dt; r.x += r.v * 0.12 * dt;
      if (r.y - r.l > H) { r.y = rand(-60, -10); r.x = rand(-30, W); }
    }
    const camV = state === 'play' || state === 'dying' ? P.vy : state === 'menu' ? 26 * S : 0;
    runT -= dt;
    if (runT <= 0) {
      runT = rand(1.6, 4.5);
      if (runners.length < 3) runners.push({ x: rand(8, paneW - 8), y: camY - 40 * S, v: camV + rand(240, 460) * S, r: rand(2, 3.6) * S, len: rand(90, 200) * S });
    }
    for (let i = runners.length - 1; i >= 0; i--) {
      const rn = runners[i];
      rn.v = Math.max(rn.v, camV + 160 * S); rn.y += rn.v * dt;
      if (rn.y - camY > H + 250 * S || hitsBar(rn.x, rn.y, rn.r)) runners.splice(i, 1);
    }
  }
  function updColor(dt) {
    const u = P.x / paneW, v = P.y * 0.0006 / S + t * 0.015;
    const a = 0.5 + 0.5 * Math.sin(u * 3.3 + v * 1.7), b = 0.5 + 0.5 * Math.sin(-u * 2.6 + v * 1.15 + 2.1), c = 0.5 + 0.5 * Math.sin(u * 1.9 - v * 2.3 + 4.2);
    const wa = a ** 4, wb = b ** 4, wc = c ** 4, s = wa + wb + wc + 1e-6, k = 1 - Math.exp(-2 * dt);
    for (let i = 0; i < 3; i++) {
      const tg = (PAL[0][i] * wa + PAL[1][i] * wb + PAL[2][i] * wc) / s * 0.85 + PAL[3][i] * 0.15;
      P.col[i] += (tg - P.col[i]) * k;
    }
  }

  // ---------- çizim ----------
  function barSeg(c, a, e, sy, capL, capR) {
    const w = e - a, x = paneX + a, rad = Math.min(BT * 0.42, w / 2), rl = capL ? rad : 0, rr = capR ? rad : 0;
    c.save();
    c.beginPath(); rrPath(c, x, sy, w, BT, rl, rr); c.rect(x + rl * 0.6, sy + BT - 1, Math.max(0, w - (rl + rr) * 0.6), SH + 1);
    c.clip();
    c.drawImage(barTex, a * DPR, 0, w * DPR, (BT + SH) * DPR, x, sy, w, BT + SH);
    c.restore();
    c.beginPath(); rrPath(c, x + 0.5, sy + 0.5, w - 1, BT - 1, Math.max(0, rl - 0.5), Math.max(0, rr - 0.5));
    c.strokeStyle = 'rgba(255,226,192,0.14)'; c.lineWidth = 1; c.stroke();
  }
  function render() {
    const c = ctx;
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    c.drawImage(bgCv, 0, 0, W, H);
    // bokeh (arkadaki bulanık şehir ışıkları, paralaks)
    c.globalCompositeOperation = 'lighter';
    const span = H + 320, wspan = W + 320;
    for (let i = 0; i < bokeh.length; i++) {
      const b = bokeh[i];
      let v = b.y - camY * b.f - t * b.dr;
      const k = Math.floor(v / span);
      v = v - k * span - 160;
      let x = b.x + hash(k * 13.7 + b.seed) * W * 0.5 + Math.sin(t * 0.05 + b.ph) * 18 * S;
      x = ((x % wspan) + wspan) % wspan - 160;
      c.globalAlpha = Math.min(1, b.a * 1.25 * (0.82 + 0.18 * Math.sin(t * 0.35 + b.ph)));
      c.drawImage(bokehSpr[b.spr], x - b.r, v - b.r, b.r * 2, b.r * 2);
    }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    // camın dışında yağmur
    c.strokeStyle = 'rgba(190,205,240,0.075)'; c.lineWidth = 1; c.beginPath();
    for (let i = 0; i < rain.length; i++) { const r = rain[i]; c.moveTo(r.x, r.y); c.lineTo(r.x - r.l * 0.12, r.y - r.l); }
    c.stroke();
    // buğu boncukları
    const ti0 = Math.floor(camY / TH);
    for (let n = 0, y = ti0 * TH - camY; y < H; n++, y += TH) c.drawImage(beadTiles[0], paneX, y, paneW, TH);
    // arka plandaki süzülen damlalar
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (let i = 0; i < runners.length; i++) {
      const rn = runners[i], sx = paneX + rn.x, sy = rn.y - camY;
      if (sy < -10 || sy - rn.len > H) continue;
      const g = c.createLinearGradient(0, sy - rn.len, 0, sy);
      g.addColorStop(0, 'rgba(180,200,240,0)'); g.addColorStop(1, 'rgba(180,200,240,0.13)');
      c.strokeStyle = g; c.lineWidth = rn.r * 1.1;
      c.beginPath(); c.moveTo(sx + Math.sin(rn.y * 0.01) * 2, sy - rn.len); c.quadraticCurveTo(sx - Math.sin(rn.y * 0.013) * 2, sy - rn.len * 0.5, sx, sy); c.stroke();
      const s = rn.r / BR * BS; c.globalAlpha = 0.75; c.drawImage(beadSpr, sx - s / 2, sy - s / 2, s, s); c.globalAlpha = 1;
    }
    // kuru lekeler ve yapışkan izler
    for (let i = 0; i < hazards.length; i++) {
      const h = hazards[i], sy = h.y - camY;
      if (sy + h.h < 0 || sy - h.h > H) continue;
      c.save(); c.translate(paneX + h.x, sy); c.rotate(h.rot);
      c.drawImage(h.type === 0 ? dryTex[h.v] : stickyTex[h.v], -h.w / 2, -h.h / 2, h.w, h.h);
      c.restore();
    }
    // damlanın bıraktığı ıslak iz
    const showP = state === 'play' || state === 'pause' || (state === 'dying' && deathReason === 'dry');
    if (trailCount > 1 && state !== 'menu') {
      let idx = (trailHead - trailCount + TRAIL_N) % TRAIL_N;
      c.beginPath(); c.moveTo(paneX + trailX[idx], trailY[idx] - camY);
      for (let i = 1; i < trailCount; i++) { idx = (idx + 1) % TRAIL_N; c.lineTo(paneX + trailX[idx], trailY[idx] - camY); }
      if (showP) c.lineTo(paneX + P.x, P.y - camY - P.r * 0.5);
      const wR = Math.max(P.r, 5 * S);
      c.strokeStyle = 'rgba(3,5,12,0.17)'; c.lineWidth = wR * 1.1; c.stroke();
      c.strokeStyle = 'rgba(200,215,255,0.045)'; c.lineWidth = wR * 0.45; c.stroke();
    }
    for (let i = 0; i < TB_N; i++) {
      const b = tb[i];
      if (!b.on) continue;
      const sy = b.y - camY;
      if (sy < -6 || sy > H + 6) continue;
      const s = b.r / BR * BS; c.drawImage(beadSpr, paneX + b.x - s / 2, sy - s / 2, s, s);
    }
    // camdaki damlalar
    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      if (d.dead) continue;
      const sy = d.y - camY;
      if (sy < -40 || sy > H + 40) continue;
      const sx = paneX + d.x;
      if (d.r < 3.2 * S) { const s = d.r / BR * BS; c.drawImage(beadSpr, sx - s / 2, sy - s / 2, s, s); }
      else {
        const k = d.r / DR, w = Math.sin(t * 14 + d.ph) * d.wob;
        c.drawImage(dropSpr[d.ti], sx - DCX * k * (1 + w), sy - DCY * k * (1 - w), DS * k * (1 + w), DS * k * (1 - w));
      }
    }
    // pencere çıtaları
    for (let i = 0; i < bars.length; i++) {
      const b = bars[i], sy = b.y - camY;
      if (sy > H || sy + BT + SH < 0) continue;
      let a = 0;
      for (let g = 0; g <= b.gaps.length; g++) {
        const e = g < b.gaps.length ? b.gaps[g][0] : paneW;
        if (e - a > 0.5) barSeg(c, a, e, sy, a > 0, e < paneW);
        if (g < b.gaps.length) a = b.gaps[g][1];
      }
      for (let j = 0; j < b.beads.length; j += 2) {
        const r = b.beads[j + 1], s = r / BR * BS;
        c.drawImage(beadSpr, paneX + b.beads[j] - s / 2, sy - r * 0.55 - s / 2, s, s);
      }
    }
    // oyuncu damlası
    if (showP) {
      let r = P.r;
      if (state === 'dying') r *= Math.max(0, 1 - deathT / 0.8);
      if (r > 0.6) {
        const sx = paneX + P.x, sy = P.y - camY, w = P.wob * Math.sin(P.wph), sp = clamp((P.vy / S - 120) / 250, 0, 1);
        const rx = r * (1 + w) * (1 - sp * 0.06), ry = r * (1 - w * 0.8) * (1 + sp * 0.08);
        paintDrop(c, sx, sy, rx, ry, P.col, 0.25 + sp * 0.5, P.lean, true);
        if (P.m < 0.35 && state === 'play') {
          c.strokeStyle = `rgba(244,140,172,${(0.22 + 0.14 * Math.sin(t * 4)).toFixed(3)})`; c.lineWidth = 1.5;
          c.beginPath(); c.ellipse(sx, sy, rx + 3, ry + 3, 0, 0, TAU); c.stroke();
        }
        if (P.inv > 0) {
          c.strokeStyle = `rgba(160,230,220,${(0.22 * Math.min(1, P.inv)).toFixed(3)})`; c.lineWidth = 2;
          c.beginPath(); c.arc(sx, sy, r * 1.7, 0, TAU); c.stroke();
        }
      }
    }
    // parçacıklar
    for (let i = 0; i < PART_N; i++) {
      const p = parts[i];
      if (!p.on) continue;
      const sx = paneX + p.x, sy = p.y - camY, f = p.life / p.max;
      if (p.k === 0) { const s = p.r / BR * BS; c.globalAlpha = 1 - f * f; c.drawImage(beadSpr, sx - s / 2, sy - s / 2, s, s); }
      else if (p.k === 1) { c.globalAlpha = 0.35 * (1 - f); c.strokeStyle = '#dce8ff'; c.lineWidth = 1.2; c.beginPath(); c.arc(sx, sy, p.r + f * 14 * S, 0, TAU); c.stroke(); }
      else { c.globalAlpha = 0.12 * (1 - f); c.fillStyle = '#eef3ff'; c.beginPath(); c.arc(sx, sy, p.r, 0, TAU); c.fill(); }
    }
    c.globalAlpha = 1;
    if (paneX > 0.5) {
      c.fillStyle = stileL; c.fillRect(0, 0, paneX, H);
      c.fillStyle = stileR; c.fillRect(paneX + paneW, 0, W - paneX - paneW, H);
    }
    c.drawImage(vigCv, 0, 0, W, H);
  }

  // ---------- arayüz ----------
  const ovMenu = $('menu'), ovHow = $('howto'), ovPause = $('pause'), ovOver = $('over'), hud = $('hud'), btnRevive = $('btnRevive');
  const distN = $('distN'), hudBest = $('hudBest'), massEl = $('mass'), massFill = $('massFill');
  const show = el => el.classList.remove('hidden'), hide = el => el.classList.add('hidden');
  const hideAll = () => { hide(ovMenu); hide(ovHow); hide(ovPause); hide(ovOver); };
  let hudCm = -1, hudMass = -1, hudLow = null, hudRec = false;
  function updHUD(force) {
    const cm = Math.floor(dist / CM);
    if (force) { hudBest.textContent = `En iyi ${fmt(save.best)} cm`; hudBest.classList.remove('rec'); }
    if (cm !== hudCm || force) {
      hudCm = cm; distN.textContent = fmt(cm);
      if (!hudRec && save.best > 0 && cm > save.best) { hudRec = true; hudBest.textContent = 'Yeni rekor!'; hudBest.classList.add('rec'); }
    }
    const f = Math.round(clamp(P.m / 2.6, 0, 1) * 100);
    if (f !== hudMass || force) { hudMass = f; massFill.style.transform = `scaleX(${f / 100})`; }
    const low = P.m < 0.35;
    if (low !== hudLow) { hudLow = low; massEl.classList.toggle('low', low); }
  }
  function syncToggles() {
    document.querySelectorAll('.tog').forEach(b => {
      const on = !!save[b.dataset.k];
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  const on = (id, f) => $(id).addEventListener('click', () => { ensureAC(); sClick(); f(); });
  on('btnPlay', startRun);
  on('btnHow', () => { hideAll(); show(ovHow); });
  on('btnHowOk', () => { hideAll(); show(ovMenu); });
  on('btnPause', pauseGame);
  on('btnResume', resumeGame);
  on('btnPauseMenu', toMenu);
  on('btnRetry', startRun);
  on('btnOverMenu', toMenu);
  on('btnRevive', requestRevive);
  document.querySelectorAll('.tog').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.k;
    save[k] = !save[k]; persist(); syncToggles();
    ensureAC();
    if (k === 'music') { if (save.music) Music.start(); else Music.stop(); }
    else if (!save.sound) setHiss(false);
    sClick();
  }));
  syncToggles();
  $('menuBest').textContent = fmt(save.best);

  // ---------- giriş ----------
  const unlock = () => { if (ensureAC() && save.music) Music.start(); };
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
  cv.addEventListener('pointerdown', e => {
    if (state !== 'play') return;
    drag = { id: e.pointerId, x: e.clientX };
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* sentetik olay */ }
  });
  cv.addEventListener('pointermove', e => {
    let dx = 0;
    if (drag && e.pointerId === drag.id) { dx = e.clientX - drag.x; drag.x = e.clientX; }
    else if (!drag && e.pointerType === 'mouse') { if (mouseX !== null) dx = e.clientX - mouseX; mouseX = e.clientX; }
    else return;
    if (state === 'play' && dx) P.tx = clamp(P.tx + dx * SENS, P.r * 0.9, paneW - P.r * 0.9);
  });
  const endDrag = e => { if (drag && e.pointerId === drag.id) { drag = null; mouseX = e.pointerType === 'mouse' ? e.clientX : null; } };
  cv.addEventListener('pointerup', endDrag);
  cv.addEventListener('pointercancel', endDrag);
  cv.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') mouseX = null; });
  window.addEventListener('keydown', e => {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') keyL = true;
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') keyR = true;
    else if (k === 'Escape' || k === 'p' || k === 'P') { if (state === 'play') pauseGame(); else if (state === 'pause') resumeGame(); }
  });
  window.addEventListener('keyup', e => {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') keyL = false;
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') keyR = false;
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (state === 'play') pauseGame();
      keyL = keyR = false;
      try { if (ac && ac.state === 'running') ac.suspend(); } catch (e) { /* yok */ }
    } else {
      try { if (ac && ac.state === 'suspended') ac.resume().catch(() => {}); } catch (e) { /* yok */ }
      last = performance.now();
    }
  });
  let needResize = true, drawnPaused = false;
  window.addEventListener('resize', () => { needResize = true; });
  window.addEventListener('orientationchange', () => { needResize = true; });

  // ---------- ana döngü ----------
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    if (needResize) { needResize = false; resize(); }
    let dt = (now - last) / 1000;
    last = now;
    if (!(dt > 0)) dt = 0; else if (dt > 0.05) dt = 0.05;
    if (state === 'pause') { if (!drawnPaused) { render(); drawnPaused = true; } return; }
    t += dt;
    if (state === 'play') update(dt);
    else if (state === 'dying') updateDying(dt);
    else if (state === 'menu') idle(dt);
    else updParts(dt);
    ambient(dt);
    render();
  }
  requestAnimationFrame(frame);

  // ---------- test kancaları ----------
  window.__damla = {
    get state() { return state; },
    start: startRun,
    pause: pauseGame,
    resume: resumeGame,
    menu: toMenu,
    revive,
    get distance() { return Math.floor(dist / CM); },
    get mass() { return P.m; },
    get best() { return save.best; },
    get world() { return { player: P, bars, drops, hazards, paneW, paneX, camY, S, BT, SENS, H, PY }; },
    setGod(v) { god = !!v; }
  };
})();
