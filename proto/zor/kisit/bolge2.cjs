// PROTOTİP · Tarife bölgesi (anahtar: zone): merkezin çevresinde kare bölge (Chebyshev yarıçap D). Sınır kenarında ray ya GEÇER (iki yan kollu) ya TAMPONLA biter (tek yan).
// Küresel koşul: sınırdan tam B geçiş ve tam T tampon (ikisi de rozet olarak yazılı; showB=false → yalnız T).
module.exports = (opt = {}) => api => {
  const { DIRS, popc, nb } = api, showB = opt.showB ?? true;
  return {
    key: 'zone', line: 13, boost: 0, clash: ['bridge', 'table', 'two'],
    amount: () => opt.T ?? 1,
    tree(C) {
      const { cols, rows, n, sol, R, hub } = C, D = opt.D ?? 1, hx = hub % cols, hy = hub / cols | 0, E = new Uint8Array(n * 4);
      const inZ = i => Math.max(Math.abs(i % cols - hx), Math.abs((i / cols | 0) - hy)) <= D;
      for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) { const j = C.nb(i, k); if (j >= 0 && inZ(i) !== inZ(j)) E[i * 4 + k] = 1; }
      const cand = []; for (let i = 0; i < n; i++) if (!C.isHub(i) && !C.keep[i] && popc(sol[i]) <= 2) for (let k = 0; k < 4; k++) if (E[i * 4 + k] && !(sol[i] & DIRS[k][0]) && !(sol[C.nb(i, k)] & C.ob(i, k))) cand.push([i, k]);
      const at = [], used = new Set();
      for (let t = 0; t < (opt.T === 0 ? 0 : C.x.zone) && cand.length; t++) { const Q = cand.filter(([i, k]) => !used.has(i) && !used.has(C.nb(i, k))); if (!Q.length) break; const [i, k] = Q[R() * Q.length | 0]; used.add(i); used.add(C.nb(i, k)); sol[i] |= DIRS[k][0]; at.push([i, k]); }
      let B = 0; for (let i = 0; i < n; i++) for (const k of [1, 2]) if (E[i * 4 + k]) { const j = C.nb(i, k); if ((sol[i] & DIRS[k][0]) && (sol[j] & DIRS[(k + 2) & 3][0])) B++; }
      C.out.zone = { E, D, T: at.length, B, at }; C.out.openAny = true;
    },
    open: (P, i, k) => P.zone.E[i * 4 + k] ? 1 : 0,
    check(P, L) {
      if (L.open !== P.zone.T) return 1;
      if (!showB) return 0;
      let b = 0; const E = P.zone.E; for (let i = 0; i < P.cur.length; i++) for (const k of [1, 2]) if (E[i * 4 + k]) { const j = nb(P, i, k); if ((P.cur[i] & DIRS[k][0]) && (P.cur[j] & DIRS[(k + 2) & 3][0])) b++; }
      return b === P.zone.B ? 0 : 1;
    },
    prune(P, C, M, unit, units) {
      const E = P.zone.E, n = P.cur.length, pairs = [];
      for (let i = 0; i < n; i++) for (const kk of [1, 2]) if (E[i * 4 + kk]) { const j = nb(P, i, kk); if (j >= 0) pairs.push([i, kk, j]); }
      // durum: 0 yok · 1 tampon · 2 geçiş
      const st = ([i, kk, j]) => { const ub = DIRS[kk][0], vb = DIRS[(kk + 2) & 3][0], A = new Set(C[unit[i]].map(r => !!(M[i][r] & ub))), Bs = new Set(C[unit[j]].map(r => !!(M[j][r] & vb))), s = new Set(); for (const a of A) for (const b of Bs) s.add(a && b ? 2 : a || b ? 1 : 0); return s; };
      const S = pairs.map(st), ch = new Set();
      const bound = (q, K) => { let lo = 0, hi = 0; for (const s of S) { const has = s.has(q), only = s.size === 1 && has; lo += only ? 1 : 0; hi += has ? 1 : 0; } return [lo, hi]; };
      const goals = [[1, P.zone.T]].concat(showB ? [[2, P.zone.B]] : []);
      for (const [q, K] of goals) {
        const [lo, hi] = bound(q); if (lo > K || hi < K) return -1;
        if (lo !== K && hi !== K) continue;
        pairs.forEach(([i, kk, j], p) => {
          const s = S[p]; if (!s.has(q) || s.size === 1) return;
          const keepQ = hi === K;   // hi==K → q zorunlu · lo==K → q yasak
          const ub = DIRS[kk][0], vb = DIRS[(kk + 2) & 3][0], val = (a, b) => (a && b ? 2 : a || b ? 1 : 0);
          const fi = C[unit[i]].filter(r => C[unit[j]].some(rj => (val(!!(M[i][r] & ub), !!(M[j][rj] & vb)) === q) === keepQ));
          const fj = C[unit[j]].filter(rj => C[unit[i]].some(r => (val(!!(M[i][r] & ub), !!(M[j][rj] & vb)) === q) === keepQ));
          if (fi.length < C[unit[i]].length) { C[unit[i]] = fi; ch.add(unit[i]); } if (fj.length < C[unit[j]].length) { C[unit[j]] = fj; ch.add(unit[j]); }
        });
      }
      return [...ch];
    },
  };
};
