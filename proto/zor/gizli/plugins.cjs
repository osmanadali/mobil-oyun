// Dört gizli bilgi kuralının EKLENTİ SÖZLEŞMESİNE uygun taslağı (üretim + oyun mantığı; çizim yok).
// Yamalı çekirdekle (corepatch.cjs: H1 cands · H2 P.void · H3 P.exit + edge · H4 difficulty(P, leaf, cap)) çalışır.
// Her kural adilliği KENDİ üretim aşamasında denetler: oyuncunun bildikleriyle (gizli kısım bilinmeden) bütün çözümler gizli kısımda aynı olmalı.
const K = require('./corepatch.cjs');
const { DIRS, rot, popc, nb, tree } = K;
const orbit = m => { const o = []; for (let r = 0, v = m; r < 4; r++, v = rot(v)) if (!o.includes(v)) o.push(v); return o; };
const per4 = m => rot(m) !== m && rot(rot(m)) !== m;
const ALL = [...Array(16).keys()].slice(1);
const md = (C, a, b) => b < 0 ? 99 : Math.abs(a % C.cols - b % C.cols) + Math.abs((a / C.cols | 0) - (b / C.cols | 0));
const near4 = (C, i, f) => [0, 1, 2, 3].some(k => { const j = C.nb(i, k); return j >= 0 && f(j); });
// C → bölüm benzeri nesne (aşama 'mark' anında): çekirdek difficulty/lit bununla çalışır
const asP = C => ({ cols: C.cols, rows: C.rows, cur: C.cur, sol: C.sol, hub: C.hub, hub2: C.hub2, pinned: C.pinned, link: C.link, rev: C.rev, cnt: C.cnt,
  ...(C.units.length ? { units: C.units, unitOf: C.unitOf } : {}), ...(C.adj ? { adj: C.adj, ao: C.ao } : {}), ...C.out });
// H4 ile çözüm sayımı: believe(cfg) inanç modelinde çözüm mü · key(cfg) gizli kısmın anahtarı → tek anahtar ve arama tam bitti mi
function fair(P, believe, key, cap = 4000) {
  const keys = new Set(), sc = K.difficulty(P, cfg => { if (believe(cfg)) keys.add(key(cfg)); return keys.size > 1; }, cap);
  return keys.size === 1 && sc < 3 * cap;
}
let stat = { tries: 0, rej: 0 };

// ---------- M10 · KAPAK (cover) ----------
const COVER = {
  key: 'cover', line: 9, boost: 2.5, clash: ['fog'],
  amount: (n, intro, z, fin) => intro ? 1 : fin && n >= 63 ? 3 : 2,
  mark(C) {
    const { n, sol, R } = C, cover = C.out.cover = new Array(n).fill(0);
    const cand = []; for (let i = 0; i < n; i++) if (C.free(i) && !C.rev[i] && C.cnt[i] < 0 && popc(sol[i]) >= 2 && popc(sol[i]) <= 3 && md(C, i, C.hub) >= 2 && md(C, i, C.hub2) >= 2) cand.push(i);
    for (let k = 0; k < C.x.cover && cand.length;) {
      const i = cand.splice(R() * cand.length | 0, 1)[0]; if (near4(C, i, j => cover[j])) continue;
      cover[i] = sol[i]; const cur0 = C.cur[i]; C.cur[i] = sol[i]; stat.tries++;
      const P = asP(C), placed = cover.flatMap((v, j) => v ? [j] : []);
      if (!fair(P, cfg => K.lit({ ...P, cover: null, cur: cfg }).solved, cfg => placed.map(j => cfg[j]).join())) { cover[i] = 0; C.cur[i] = cur0; stat.rej++; continue; }
      C.busy[i] = true; k++;
    }
  },
  cands: (P, i) => P.cover[i] ? ALL : null,                              // H1: kapak altı = 15 maskeden biri (oyuncu bilmiyor)
  check: (P, L) => P.cover.reduce((a, v, i) => a + (v && P.cur[i] !== v ? 1 : 0), 0),   // oyunda hep 0 (sabit); çözücü yaprağında yanlış inancı eler
  block: G => 'Kapak · altındaki ray sabit ve doğru yönde',
};
// ---------- M12 · SİLİK KOL (faint) ----------
// faint[i] = [c0, q0]: üretimdeki görünen karo (cur) ve "?" biti. Simetrisiz gerçek karo (uç/köşe/T) → anlık "?" = q0'ın cur'a göre dönmüşü.
const qNow = (P, i) => { const [c0, q0] = P.faint[i]; let r = 0, v = c0, q = q0; while (v !== P.cur[i] && r < 4) { v = rot(v); q = rot(q); r++; } return q; };
const FAINT = {
  key: 'faint', line: 11, boost: 2,
  amount: (n, intro) => intro ? 2 : n < 63 ? 3 : 4,
  mark(C) {
    const { n, sol, R } = C, faint = C.out.faint = new Array(n).fill(0);
    const cand = []; for (let i = 0; i < n; i++) if (C.free(i) && !C.rev[i] && C.cnt[i] < 0 && per4(sol[i]) && md(C, i, C.hub) >= 2 && md(C, i, C.hub2) >= 2) cand.push(i);
    for (let k = 0; k < C.x.faint && cand.length;) {
      const i = cand.splice(R() * cand.length | 0, 1)[0]; if (near4(C, i, j => faint[j])) continue;
      const m = C.cur[i], has = [], not = [];
      for (let t = 0; t < 4; t++) { const b = 1 << t, side = rot(b) | rot(rot(rot(b)));   // sızıntısız: V uç/köşe, "?" görünen bir kola 90°
        if (m & b) { const V = m & ~b; if (popc(m) >= 2 && per4(V) && (V & side)) has.push(b); } else if (popc(m) <= 2 && (m & side)) not.push(b); }
      const pool = R() < .5 ? (has.length ? has : not) : (not.length ? not : has); if (!pool.length) continue;
      faint[i] = [m, pool[R() * pool.length | 0]]; stat.tries++;
      const P = asP(C), placed = faint.flatMap((v, j) => v ? [j] : []);
      if (!fair(P, cfg => K.lit({ ...P, faint: null, cur: cfg }).solved, cfg => placed.map(j => +orbit(P.faint[j][0]).includes(cfg[j])).join())) { faint[i] = 0; stat.rej++; continue; }
      C.busy[i] = true; k++;
    }
  },
  cands: (P, i) => { const f = P.faint[i]; if (!f) return null; const q = qNow(P, i), V = P.cur[i] & ~q; return [...new Set([...orbit(V), ...orbit(V | q)])].sort((a, b) => a - b); },
  check: (P, L) => P.faint.reduce((a, f, i) => a + (f && !orbit(f[0]).includes(P.cur[i]) ? 1 : 0), 0),
};
// ---------- M14 · KAPALI DURAK (closed) ----------
// pre: k hücre ağaca hiç alınmaz (inT = true) → ağaç çevresinden dolaşır. Kapalı hücre P.void (H2): lit onu yok sayar.
// mark: kapalı hücre sıradan durak gibi görünür (rastgele tek kol), sol = cur → par/ipucu/robot dokunmaz.
// Adillik (mark): oyuncunun bildikleriyle kapalı küme tek değilse kapalı durak AÇIKÇA gösterilir (⊘ baştan çizilir, gizli sayıdan düşer).
const isSt = (P, i) => i !== P.hub && i !== P.hub2 && popc(P.cur[i]) === 1 && !P.pinned[i] && P.link[i] < 0 && !(P.unitOf?.[i] >= 0);
const CLOSED = {
  key: 'closed', line: 13, boost: 2.5, clash: ['portal', 'two', 'ring'],
  amount: (n, intro, z, fin) => fin && n >= 63 ? 2 : 1,
  pre(C) {
    const { n, cols, rows, R, inT } = C, vd = C.out.void = new Array(n).fill(0);
    const cand = []; for (let i = 0; i < n; i++) if (!C.isHub(i) && !C.keep[i] && !near4(C, i, j => C.keep[j]) && md(C, i, C.hub) >= 2 && md(C, i, C.hub2) >= 2) cand.push(i);   // köprü/tünel ağzı komşusu olmaz
    const ring8 = i => { const x = i % cols, y = i / cols | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if ((dx || dy) && X >= 0 && Y >= 0 && X < cols && Y < rows && vd[Y * cols + X]) return true; } return false; };
    const conn = () => { const seen = new Uint8Array(n), q = [C.hub]; seen[C.hub] = 1; let c = 1; while (q.length) { const i = q.pop(); for (let k = 0; k < 4; k++) { const j = C.nb(i, k); if (j >= 0 && !seen[j] && !vd[j]) { seen[j] = 1; c++; q.push(j); } } } return c === n - vd.reduce((a, b) => a + b, 0); };
    for (let k = 0; k < C.x.closed && cand.length;) { const i = cand.splice(R() * cand.length | 0, 1)[0]; if (ring8(i)) continue; vd[i] = 1; if (!conn()) { vd[i] = 0; continue; } k++; }
    vd.forEach((v, i) => { if (v) { inT[i] = true; C.keep[i] = true; C.busy[i] = true; } });
  },
  mark(C) {
    const vd = C.out.void, shown = C.out.closedShown = vd.map(() => 0);
    vd.forEach((v, i) => { if (v) { C.cur[i] = DIRS[C.R() * 4 | 0][0]; C.sol[i] = C.cur[i]; } });
    C.out.closed = vd.reduce((a, b) => a + b, 0); stat.tries++;
    const P = asP(C), st = []; for (let j = 0; j < C.n; j++) if (isSt(P, j) && !shown[j]) st.push(j);
    const hidN = () => C.out.closed - shown.reduce((a, b) => a + b, 0);
    const believe = cfg => st.filter(j => !cfg[j]).length === hidN() && K.lit({ ...P, void: cfg.map((m, j) => m ? 0 : 1), cur: cfg }).solved;
    if (!fair(P, believe, cfg => st.filter(j => !cfg[j]).join())) { C.out.reject = 1; stat.rej++; }   // H7: seçici bu adayı almaz
  },
  cands: (P, i) => P.closedShown[i] ? [0] : isSt(P, i) ? [0, ...orbit(P.cur[i])].sort((a, b) => a - b) : null,   // her durak: 4 yön ya da kapalı (0)
  prune(P, Mof) {   // H5: gizli kapalı sayısı (oyuncu sayıyı görür)
    const hid = P.closed - P.closedShown.reduce((a, b) => a + b, 0); let must = 0, may = 0;
    for (let i = 0; i < P.cur.length; i++) if (!P.closedShown[i] && isSt(P, i)) { const m = Mof(i); if (m.includes(0)) { may++; if (m.length === 1) must++; } }
    return must <= hid && may >= hid;
  },
};
// ---------- M16 · GİZLİ DEPO (depot) ----------
// tree (tOrder 30: halkadan sonra): k kenar karosuna dışa bakan kol (depo yaprağı). Her depo için 3 karoluk ayraç (aralık) — tam yeri gizli.
// mark: adillik; belirsizse o deponun aralığı tek karoya daraltılır (depo görünür olur) → her zaman adil.
const DEPOT = {
  key: 'depot', line: 15, tOrder: 30, boost: 3, clash: ['portal', 'sw', 'table'],
  amount: (n, intro) => intro ? 1 : 2,
  tree(C) {
    const { n, cols, rows, R, sol } = C, ex = C.out.exit = new Uint8Array(n * 4), win = C.out.depot = [];
    const cand = []; for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) if (!C.isHub(i) && C.nb(i, k) < 0 && popc(sol[i]) <= 2 && !C.keep[i]) cand.push(i * 4 + k);
    const pos = (i, k) => k % 2 ? [i / cols | 0, rows] : [i % cols, cols], at = (i, k, t) => k % 2 ? t * cols + i % cols : (i / cols | 0) * cols + t;
    for (let c = 0; c < C.x.depot && cand.length;) {
      const e = cand.splice(R() * cand.length | 0, 1)[0], i = e >> 2, k = e & 3, [p, len] = pos(i, k);
      if (win.some(W => W.cells.includes(i)) || near4(C, i, j => win.some(W => W.e >> 2 === j))) continue;
      const taken = new Set(win.filter(W => W.k === k).flatMap(W => W.cells)), opts = [];
      for (let lo = Math.max(0, p - 2); lo <= Math.min(len - 3, p); lo++) { const cs = [0, 1, 2].map(t => at(i, k, lo + t)); if (!cs.some(x => taken.has(x))) opts.push(cs); }
      if (!opts.length) continue;
      sol[i] |= DIRS[k][0]; ex[e] = 1; win.push({ e, k, cells: opts[R() * opts.length | 0] }); c++;
    }
  },
  mark(C) {
    for (const W of C.out.depot) {
      stat.tries++;
      const P = asP(C);
      // inanç modelinde: aralıktaki her dış kol "depo" sayılır (lit'e geçici exit dizisi)
      const exAny = new Uint8Array(P.cur.length * 4); for (const V of P.depot) for (const i of V.cells) exAny[i * 4 + V.k] = 1;
      const bel = cfg => P.depot.every(V => V.cells.filter(i => cfg[i] & DIRS[V.k][0]).length === 1) && K.lit({ ...P, exit: exAny, cur: cfg }).solved;
      const key = cfg => P.depot.map(V => V.cells.find(i => cfg[i] & DIRS[V.k][0])).join();
      if (!fair(P, bel, key)) { W.cells = [W.e >> 2]; stat.rej++; }   // belirsiz → bu depo görünür (aralık tek karo)
    }
  },
  edge: (P, i, k) => P.depot.some(V => V.k === k && V.cells.includes(i)),   // H3: aralıktaki kenar karosu dışa kol taşıyabilir
  prune: (P, Mof) => P.depot.every(V => { let must = 0, may = 0; for (const i of V.cells) { const m = Mof(i), c = m.filter(v => v & DIRS[V.k][0]).length; if (c) { may++; if (c === m.length) must++; } } return must <= 1 && may >= 1; }),   // H5
};
for (const m of [COVER, FAINT, CLOSED, DEPOT]) K.MODS.push(m);
K.MODS.sort((a, b) => a.line - b.line);
module.exports = { K, stat, orbit, COVER, FAINT, CLOSED, DEPOT, qNow };
