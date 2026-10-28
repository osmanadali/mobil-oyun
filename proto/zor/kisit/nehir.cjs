// PROTOTİP · Nehir (anahtar: river): tahtayı ortadan kesen çizgi. Ray çizgiden geçebilir (köprü) ya da kıyıda tamponla bitebilir; tam T tampon.
module.exports = (opt = {}) => api => {
  const { DIRS, popc, nb } = api;
  return {
    key: 'river', line: 13, boost: 0,
    amount: () => opt.T ?? 2,
    tree(C) {
      const { cols, rows, n, sol, R } = C, vert = opt.vert ?? (R() < .5);
      // dikey: x = mid-1 | mid arası; yatay: y = mid-1 / mid arası
      const mid = vert ? cols >> 1 : rows >> 1, E = new Uint8Array(n * 4);
      for (let i = 0; i < n; i++) { const x = i % cols, y = i / cols | 0; if (vert) { if (x === mid - 1) E[i * 4 + 1] = 1; if (x === mid) E[i * 4 + 3] = 1; } else { if (y === mid - 1) E[i * 4 + 2] = 1; if (y === mid) E[i * 4 + 0] = 1; } }
      const cand = []; for (let i = 0; i < n; i++) if (!C.isHub(i) && popc(sol[i]) <= 2) for (let k = 0; k < 4; k++) if (E[i * 4 + k] && !(sol[i] & DIRS[k][0]) && !(sol[C.nb(i, k)] & C.ob(i, k))) cand.push([i, k]);
      const at = [], used = new Set();
      for (let t = 0; t < C.x.river && cand.length; t++) { const Q = cand.filter(([i, k]) => !used.has(i) && !used.has(C.nb(i, k))); if (!Q.length) break; const [i, k] = Q[R() * Q.length | 0]; used.add(i); sol[i] |= DIRS[k][0]; at.push([i, k]); }
      C.out.river = { E, T: at.length, at }; C.out.openAny = true;
    },
    open: (P, i, k) => P.river.E[i * 4 + k] ? 1 : 0,
    check(P, L) { return L.open === P.river.T ? 0 : 1; },
    prune(P, C, M, unit, units) {
      // kıyı kenarı: tam bir yanı kollu → 1 tampon. Birim başına kesin sayılamaz (komşuya bağlı) → kenar çifti üzerinden alt/üst sınır
      const E = P.river.E, n = P.cur.length, T = P.river.T; let lo = 0, hi = 0; const pairs = [];
      for (let i = 0; i < n; i++) for (let k = 0; k < 2; k++) { const kk = k === 0 ? 1 : 2; if (!E[i * 4 + kk]) continue; const j = nb(P, i, kk); if (j < 0) continue; pairs.push([i, kk, j]); }
      const can = (i, kk, j) => { const ub = DIRS[kk][0], vb = DIRS[(kk + 2) & 3][0], A = C[unit[i]].map(r => !!(M[i][r] & ub)), B = C[unit[j]].map(r => !!(M[j][r] & vb)); const a1 = A.some(x => x), a0 = A.some(x => !x), b1 = B.some(x => x), b0 = B.some(x => !x); const mism = (a1 && b0) || (a0 && b1), match = (a1 && b1) || (a0 && b0); return [match ? 0 : 1, mism ? 1 : 0]; };
      for (const p of pairs) { const [l, h] = can(...p); lo += l; hi += h; }
      if (lo > T || hi < T) return -1;
      const ch = new Set();
      if (lo === T) for (const [i, kk, j] of pairs) { const [l, h] = can(i, kk, j); if (l === 0 && h === 1) {
        // eşleşme zorunlu: i'nin kolu, j'nin kolunun bir olası değeriyle eşleşmeli
        const ub = DIRS[kk][0], vb = DIRS[(kk + 2) & 3][0], Bv = new Set(C[unit[j]].map(r => !!(M[j][r] & vb))), Av = new Set(C[unit[i]].map(r => !!(M[i][r] & ub)));
        const fi = C[unit[i]].filter(r => Bv.has(!!(M[i][r] & ub))), fj = C[unit[j]].filter(r => Av.has(!!(M[j][r] & vb)));
        if (fi.length < C[unit[i]].length) { C[unit[i]] = fi; ch.add(unit[i]); } if (fj.length < C[unit[j]].length) { C[unit[j]] = fj; ch.add(unit[j]); }
      } }
      return [...ch];
    },
  };
};
