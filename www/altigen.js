// ⬡ Altıgen gün: cumartesi Günün Hattı sivri tepeli altıgen karolu, büyük altıgen tahtada (3 halka 37 karo · 4 halka 61 karo).
// Her dokunuş 60° döndürür (6 duruş). Kural aynı: bütün durakları merkeze bağla, açık uç kalmasın.
// game.js yalnız dallanır (G.hex varsa buradaki işlevler): üretim, zorluk çözücüsü, bağlantı (lit), döndürme, yerleşim, çizim, dokunma isabeti, robot planı.
// Ayrıntı: docs/kurallar/altigen.md
window.RAY_HEX = api => {
  const SQ3 = Math.sqrt(3), TAU = Math.PI * 2;
  // yön k (0–5): ekranda k·60°, saat yönünde (y aşağı): 0 doğu · 1 güneydoğu · 2 güneybatı · 3 batı · 4 kuzeybatı · 5 kuzeydoğu. Bit = 1 << k.
  const HD = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];   // eksenel (q, r) komşu farkı
  const rot = m => ((m << 1) | (m >> 5)) & 63;                     // saat yönünde 60°
  const popc = m => { let c = 0; for (; m; m &= m - 1) c++; return c; };
  const rn = (m, k) => { while (k-- > 0) m = rot(m); return m; };
  const isDay = d => { const [y, m, dd] = d.split('-').map(Number); return new Date(y, m - 1, dd).getDay() === 6; };   // cumartesi
  const ringsFor = z => z < .8 ? 3 : 4;                            // zorluk dalgası (cumartesi z ≈ ,7–,95): kolay hafta 3 halka (37 karo), zor hafta 4 halka (61 karo)

  // ---------- tahta: R halkalı büyük altıgen ----------
  const BOARDS = {};
  function board(R) {
    if (BOARDS[R]) return BOARDS[R];
    const cells = [], at = new Map();
    for (let r = -R; r <= R; r++) for (let q = -R; q <= R; q++) if (Math.abs(q + r) <= R) { at.set(q + ',' + r, cells.length); cells.push([q, r]); }
    const n = cells.length, adj = new Array(n * 6).fill(-1);
    cells.forEach(([q, r], i) => HD.forEach(([dq, dr], k) => { const j = at.get((q + dq) + ',' + (r + dr)); if (j != null) adj[i * 6 + k] = j; }));
    return (BOARDS[R] = { R, n, cells, at, adj, hub: at.get('0,0') });
  }

  // ---------- üretim: merkezden rastgele kapsayan ağaç (her zaman çözülebilir) ----------
  function generate(R, seed) {
    const B = board(R), X = api.rng(seed), { n, adj, hub } = B, sol = new Array(n).fill(0), inT = new Array(n).fill(false), fr = [];
    const addF = i => { for (let k = 0; k < 6; k++) { const j = adj[i * 6 + k]; if (j >= 0) fr.push([i, j, k]); } };
    inT[hub] = true; addF(hub);
    let tries = 0;
    while (fr.length) {
      const e = fr.splice(X() * fr.length | 0, 1)[0], [a, b, k] = e;
      if (inT[b]) continue;
      // kavşakları seyrelt (okunur, uzun hatlar); beş-altı kollu karo neredeyse hiç çıkmaz
      const d = popc(sol[a]);
      if (((d >= 2 && X() < .62) || d >= 4) && tries++ < 60) { fr.push(e); continue; }
      tries = 0;
      sol[a] |= 1 << k; sol[b] |= 1 << (k + 3) % 6; inT[b] = true; addF(b);
    }
    const cur = sol.map(m => rn(m, X() * 6 | 0));
    if (cur.every((v, i) => v === sol[i])) { const i = cur.findIndex(v => rot(v) !== v); cur[i] = rot(cur[i]); }
    // par: döndürülmesi gereken karo sayısı · taps: gereken en az dokunuş (süre hedefi)
    let par = 0, taps = 0;
    cur.forEach((v, i) => { const r = steps(v, sol[i]); taps += r; if (r) par++; });
    return { hex: true, R, cols: 2 * R + 1, rows: 2 * R + 1, adj, sol, cur, hub, hub2: -1, par, taps,
      pinned: new Array(n).fill(false), link: new Array(n).fill(-1), rev: new Array(n).fill(false), cnt: new Array(n).fill(-1), fixed: new Array(n).fill(false) };
  }
  const steps = (v, s) => { let r = 0; while (v !== s && r < 6) { v = rot(v); r++; } return r; };

  // ---------- bağlantı: merkezden BFS · d derinlik, own 1 = bağlı, loose = eşsiz kol ----------
  function lit(P) {
    const { cur, adj, hub } = P, n = cur.length, d = new Array(n).fill(-1), own = new Array(n).fill(0), q = [hub];
    let loose = 0; d[hub] = 0;
    for (let h = 0; h < q.length; h++) {
      const i = q[h]; own[i] = 1;
      for (let k = 0; k < 6; k++) {
        if (!(cur[i] >> k & 1)) continue;
        const j = adj[i * 6 + k];
        if (j < 0 || !(cur[j] >> (k + 3) % 6 & 1)) { loose++; continue; }
        if (d[j] < 0) { d[j] = d[i] + 1; q.push(j); }
      }
    }
    return { d, own, merged: false, open: 0, openBy: {}, n: q.length, solved: !loose && q.length === n };
  }

  // ---------- zorluk puanı: kare çözücüsüyle aynı ölçek (game.js difficulty) ----------
  // puan = çıkarım turu + 3 × tahmin dalı + 10 × ilk turda elenemeyen oran
  function difficulty(P, cap = 200) {
    const { cur, adj } = P, n = cur.length, M = cur.map(m => [0, 1, 2, 3, 4, 5].map(r => rn(m, r)));
    const C0 = M.map((a, i) => {
      if (P.fixed?.[i]) return [steps(cur[i], P.sol[i])];
      const seen = new Set(), out = []; a.forEach((v, r) => { if (!seen.has(v)) { seen.add(v); out.push(r); } }); return out;
    });
    const step = (C, prev) => {
      let hit = 0;
      for (let i = 0; i < n; i++) {
        let ch = false;
        for (let k = 0; k < 6; k++) {
          const j = adj[i * 6 + k], b = 1 << k, o = 1 << (k + 3) % 6;
          const can = v => j < 0 ? !v : prev[j].some(r => !!(M[j][r] & o) === v);
          const K = C[i].filter(r => can(!!(M[i][r] & b)));
          if (!K.length) return -1;
          if (K.length < C[i].length) { C[i] = K; ch = true; }
        }
        if (ch) hit++;
      }
      return hit;
    };
    const copy = C => C.map(a => a.slice()), fix = C => { for (;;) { const c = step(C, copy(C)); if (c < 0) return false; if (!c) return true; } };
    let waves = 0, first = 0; const C = copy(C0);
    for (;;) { const c = step(C, copy(C)); if (c <= 0) break; if (!waves) first = c; waves++; }
    let nodes = 0;
    const dfs = D => {
      if (++nodes > cap) return true;
      let b = -1; D.forEach((a, k) => { if (a.length > 1 && (b < 0 || a.length < D[b].length)) b = k; });
      if (b < 0) return lit({ ...P, cur: cur.map((v, i) => M[i][D[i][0]]) }).solved;
      for (const r of D[b]) { const E = copy(D); E[b] = [r]; if (fix(E) && dfs(E)) return true; }
      return false;
    };
    dfs(C);
    return Math.round((waves + 3 * (nodes - 1) + 10 * (1 - first / n)) * 10) / 10;
  }
  // K aday arasından zorluk puanı hedefe en yakın olan (herkeste aynı)
  function pick(R, seed, z, T, K) {
    let best = null;
    for (let k = 0; k < K; k++) { const P = generate(R, seed + k * 104729); P.diff = difficulty(P); if (!best || Math.abs(P.diff - T) < Math.abs(best.diff - T)) best = P; }
    best.z = z; return best;
  }
  // cumartesi Günün Hattı: hedef kare Günün Hattı'yla aynı (5 + 11z), tohum güne bağlı
  const daily = (day, z) => pick(ringsFor(z), api.hashStr('altigen' + day), z, 5 + 11 * z, 6 + Math.round(6 * z));

  // ---------- yerleşim: geo.s = karonun düz kenarlar arası genişliği (kare karo s'siyle aynı ölçek), ox/oy = tahta merkezi ----------
  function fit(G, Wd, Hd, dpr) {
    const R = G.R, wu = (2 * R + 1) * SQ3, hu = 3 * R + 2;           // köşe yarıçapı birimiyle tahta genişliği / yüksekliği
    const s = Math.floor(Math.min(96, Math.min((Wd - 8) / wu, (Hd - 8) / hu) * SQ3));
    return { s, ox: Wd / 2, oy: Hd / 2, dpr };
  }
  const xy = (G, i, g) => { const [q, r] = board(G.R).cells[i]; return [g.ox + g.s * (q + r / 2), g.oy + g.s * SQ3 / 2 * r]; };
  // dokunma isabeti: piksel → kesirli eksenel → küp yuvarlama (altıgenin içi tam olarak o karo) · tahta dışı −1
  function hit(G, g, px, py) {
    const fr = (py - g.oy) / (g.s * SQ3 / 2), fq = (px - g.ox) / g.s - fr / 2, fs = -fq - fr;
    let q = Math.round(fq), r = Math.round(fr), s = Math.round(fs);
    const dq = Math.abs(q - fq), dr = Math.abs(r - fr), ds = Math.abs(s - fs);
    if (dq > dr && dq > ds) q = -r - s; else if (dr > ds) r = -q - s;
    return board(G.R).at.get(q + ',' + r) ?? -1;
  }
  const nearLit = (G, i) => { let c = 0; for (let k = 0; k < 6; k++) { const j = G.adj[i * 6 + k]; if (j >= 0 && G.L.d[j] >= 0) c++; } return c; };
  // robot / test: her karoyu çözüme getiren dokunuşlar (aynı karoya art arda → par hamle)
  function plan(G) {
    const out = [];
    G.cur.forEach((v, i) => { if (G.fixed[i]) return; for (let k = steps(v, G.sol[i]); k > 0; k--) out.push(i); });
    return out;
  }

  // ---------- çizim: kare karoyla aynı dil (zemin, sönük/ışıyan/yanan ray, parlama, duraklar, merkez, dalga, kıvılcım, bitiş nabzı) ----------
  // köşeleri yuvarlatılmış sivri tepeli altıgen yolu (mevcut yola ekler)
  function hexPath(cx, x, y, rad, rc) {
    const P = []; for (let k = 0; k < 6; k++) { const a = (k * 60 - 90) * Math.PI / 180; P.push([x + rad * Math.cos(a), y + rad * Math.sin(a)]); }
    cx.moveTo((P[5][0] + P[0][0]) / 2, (P[5][1] + P[0][1]) / 2);
    for (let k = 0; k < 6; k++) { const a = P[k], b = P[(k + 1) % 6]; cx.arcTo(a[0], a[1], b[0], b[1], rc); }
    cx.closePath();
  }
  function railPath(cx, T, m, L) {
    const [x, y, a, sc] = T, l = L * sc;
    for (let k = 0; k < 6; k++) if (m >> k & 1) { const t = k * Math.PI / 3 + a; cx.moveTo(x, y); cx.lineTo(x + Math.cos(t) * l, y + Math.sin(t) * l); }
  }
  function draw(D) {
    const { G, vg, now, cx, pal, litAt, anim, press, winT, ripples, parts } = D, { rgba, ease, back } = api, s = vg.s, n = G.cur.length, col = G.color;
    let busy = false; const X = [];
    for (let i = 0; i < n; i++) {
      let a = 0, sc = 1;
      if (anim.has(i)) { const t = Math.min((now - anim.get(i)) / 190, 1); a = -(1 - back(t)) * Math.PI / 3; if (t < 1) busy = true; else anim.delete(i); }
      if (press.has(i)) { const t = (now - press.get(i)) / 220; if (t < 1) { sc *= 1 - .09 * Math.sin(t * Math.PI); busy = true; } else press.delete(i); }
      if (winT) { const t = (now - winT - G.L.d[i] * 45) / 320; if (t > 0 && t < 1) sc *= 1 + Math.sin(t * Math.PI) * .1; if (t < 1) busy = true; }
      const [x, y] = xy(G, i, vg); X.push([x, y, a, sc]);
    }
    const on = i => G.L.d[i] >= 0, rad = s / SQ3, L = s / 2;
    cx.lineCap = 'round'; cx.lineJoin = 'round';
    // 1) zemin: karolar arası ~3 px boşluk (kare karonun s−6'sı gibi)
    const tiles = f => { cx.beginPath(); for (let i = 0; i < n; i++) if (f(i)) { const [x, y, , sc] = X[i]; hexPath(cx, x, y, (rad - 3.2) * sc, s * .14 * sc); } };
    tiles(() => true); cx.fillStyle = pal.tile; cx.fill(); cx.lineWidth = 1; cx.strokeStyle = pal.stroke; cx.stroke();
    tiles(on); cx.fillStyle = rgba(col, pal.light ? .10 : .07); cx.fill();
    const anyFixed = G.fixed.includes(true);
    if (anyFixed) { tiles(i => G.fixed[i]); cx.lineWidth = 2.5; cx.strokeStyle = rgba(col, .85); cx.stroke(); }
    // 2) raylar: sönük → ışıma → yanan
    const rails = f => { cx.beginPath(); for (let i = 0; i < n; i++) if (f(i)) railPath(cx, X[i], G.cur[i], L); cx.stroke(); };
    cx.lineWidth = s * .17; cx.strokeStyle = pal.rail; rails(i => !on(i));
    cx.lineWidth = s * .38; cx.strokeStyle = rgba(col, pal.light ? .16 : .22); rails(on);
    cx.lineWidth = s * .17; cx.strokeStyle = col; rails(on);
    // 3) yeni yanan karoda parlama (karo sınırına kırpılır)
    for (let i = 0; i < n; i++) {
      if (!on(i)) continue;
      const t = (now - litAt[i]) / 420; if (t >= 1) continue;
      busy = true; if (t <= 0) continue;
      const [x, y] = X[i];
      cx.save(); cx.beginPath(); hexPath(cx, x, y, rad, 0); cx.clip();
      cx.strokeStyle = pal.light ? rgba(col, .9 * (1 - t)) : `rgba(255,255,255,${.65 * (1 - t)})`;
      cx.lineWidth = s * (pal.light ? .17 + .12 * (1 - t) : .17);
      cx.beginPath(); railPath(cx, X[i], G.cur[i], L); cx.stroke(); cx.restore();
    }
    // 4) duraklar (tek kollu karo)
    const dots = (f, r) => { cx.beginPath(); for (let i = 0; i < n; i++) if (i !== G.hub && popc(G.cur[i]) === 1 && f(i)) { const [x, y, , sc] = X[i]; cx.moveTo(x + r * sc, y); cx.arc(x, y, r * sc, 0, TAU); } };
    dots(on, s * .27); cx.fillStyle = rgba(col, .22); cx.fill();
    cx.lineWidth = s * .065;
    dots(on, s * .15); cx.fillStyle = '#fff'; cx.fill(); cx.strokeStyle = col; cx.stroke();
    dots(i => !on(i), s * .15); cx.fillStyle = pal.bg; cx.fill(); cx.strokeStyle = pal.mut; cx.stroke();
    // 5) merkez istasyon (kare oyundaki simge)
    { const [x, y, , sc] = X[G.hub], k = s * sc;
      cx.fillStyle = rgba(col, .25); cx.beginPath(); cx.arc(x, y, k * .36, 0, TAU); cx.fill();
      const g = cx.createLinearGradient(x - k * .2, y - k * .2, x + k * .2, y + k * .2); g.addColorStop(0, rgba(col, 1)); g.addColorStop(1, rgba(col, .78));
      cx.fillStyle = g; api.rr(x - k * .22, y - k * .22, k * .44, k * .44, k * .12); cx.fill();
      cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(x, y, k * .075, 0, TAU); cx.fill(); }
    // 6) ipucu kilidi rozeti (sağ üst, karonun içinde)
    if (anyFixed) { cx.fillStyle = col; cx.beginPath(); for (let i = 0; i < n; i++) if (G.fixed[i]) { const [x, y] = X[i]; cx.moveTo(x + s * .24 + s * .055, y - s * .3); cx.arc(x + s * .24, y - s * .3, s * .055, 0, TAU); } cx.fill(); }
    // 7) dokunma dalgaları · 8) kıvılcımlar (game.js dizileri yerinde süzülür)
    cx.lineWidth = 2.5;
    keep(ripples, r => {
      const t = (now - r.t) / 420; if (t >= 1) return false;
      cx.strokeStyle = rgba(col, .45 * (1 - t)); cx.beginPath(); cx.arc(r.x, r.y, s * (.2 + .55 * ease(t)), 0, TAU); cx.stroke();
      return busy = true;
    });
    keep(parts, p => {
      const t = (now - p.t) / p.life; if (t >= 1) return false; if (t < 0) return busy = true;
      const age = (now - p.t) / 1000;
      cx.fillStyle = rgba(p.c, 1 - t); cx.beginPath(); cx.arc(p.x + p.vx * age, p.y + p.vy * age + 260 * age * age, p.r * (1 - t * .6), 0, TAU); cx.fill();
      return busy = true;
    });
    return busy;
  }
  const keep = (a, f) => { let w = 0; for (let k = 0; k < a.length; k++) if (f(a[k])) a[w++] = a[k]; a.length = w; };

  // ---------- ilk karşılaşmada kısa kural kartı (kart açıkken süre durur) ----------
  const DEMO = `<div class="rd-hex" aria-hidden="true"><svg viewBox="-50 -50 100 100"><path class="hx" d="${(() => { const p = []; for (let k = 0; k < 6; k++) { const a = (k * 60 - 90) * Math.PI / 180; p.push(`${(44 * Math.cos(a)).toFixed(1)} ${(44 * Math.sin(a)).toFixed(1)}`); } return 'M' + p.join('L') + 'Z'; })()}"/><g class="rl"><path d="M0 0L38.1 0M0 0L-19 33"/><circle r="6"/></g></svg><em>60°</em></div>`;
  function card() {
    api.pause();
    api.modal(`<span class="badge">${L('CUMARTESİ · ALTIGEN GÜN', 'SATURDAY · HEX DAY')}</span>
      ${DEMO}
      <h2>${L('⬡ Altıgen gün', '⬡ Hex day')}</h2>
      <p>${L('Bugün karolar <b>altıgen</b>: her dokunuş <b>60°</b> döndürür, altı duruş var. Kural aynı: bütün durakları merkeze bağla, <b>açık uç</b> kalmasın.', 'Today the tiles are <b>hexagons</b>: each tap turns <b>60°</b>, six positions. Same rule: link every station to the hub, leave no <b>loose ends</b>.')}</p>
      <button id="mGo" class="btn primary"><span>${L('Anladım', 'Got it')}</span></button>`,
      { mGo: () => { api.save.seen.hex = 1; api.persist(); api.closeModal(); if (api.active('game')) api.resume(); } }, true);
  }
  const st = document.createElement('style');
  st.textContent = `.rd-hex{position:relative;align-self:center;width:96px;height:96px;margin:6px 0 2px}.rd-hex svg{width:100%;height:100%;overflow:visible}
.rd-hex .hx{fill:var(--tile,rgba(255,255,255,.06));stroke:var(--line,var(--acc));stroke-opacity:.35;stroke-width:2;stroke-linejoin:round}
.rd-hex .rl path{stroke:var(--line,var(--acc));stroke-width:13;stroke-linecap:round;fill:none}.rd-hex .rl circle{fill:#fff}
.rd-hex .rl{animation:rdhx 4.8s cubic-bezier(.3,1.4,.5,1) infinite}
.rd-hex em{position:absolute;right:-30px;top:2px;font:800 13px Outfit,system-ui;font-style:normal;color:var(--acc)}
@keyframes rdhx{0%,12%{transform:rotate(0)}17%,29%{transform:rotate(60deg)}34%,46%{transform:rotate(120deg)}51%,63%{transform:rotate(180deg)}68%,80%{transform:rotate(240deg)}85%,95%{transform:rotate(300deg)}100%{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.rd-hex .rl{animation:none}}
.arch button.hex b:after{content:"⬡";margin-left:1px;font-size:.7em;opacity:.7}`;
  document.head.append(st);

  return { isDay, ringsFor, board, generate, lit, difficulty, pick, daily, rot, steps, fit, xy, hit, nearLit, plan, draw, card };
};
