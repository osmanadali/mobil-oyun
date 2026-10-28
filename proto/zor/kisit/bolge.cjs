// PROTOTİP · Bölge sınırı (anahtar: zone): merkezin çevresinde kare tarife bölgesi (Chebyshev yarıçap D). Ray sınırdan geçer ya da sınırda tamponla biter; tam T tampon.
const N = require('./nehir.cjs');
module.exports = (opt = {}) => api => {
  const base = N({ T: opt.T })(api), { DIRS, popc } = api;
  return { ...base, key: 'zone', prune: base.prune,
    amount: () => opt.T ?? 2,
    tree(C) {
      const { cols, n, sol, R, hub } = C, D = opt.D ?? 2, hx = hub % cols, hy = hub / cols | 0, E = new Uint8Array(n * 4);
      const inZ = i => Math.max(Math.abs(i % cols - hx), Math.abs((i / cols | 0) - hy)) <= D;
      for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) { const j = C.nb(i, k); if (j >= 0 && inZ(i) !== inZ(j)) E[i * 4 + k] = 1; }
      const cand = []; for (let i = 0; i < n; i++) if (!C.isHub(i) && popc(sol[i]) <= 2) for (let k = 0; k < 4; k++) if (E[i * 4 + k] && !(sol[i] & DIRS[k][0]) && !(sol[C.nb(i, k)] & C.ob(i, k))) cand.push([i, k]);
      const at = [], used = new Set();
      for (let t = 0; t < C.x.zone && cand.length; t++) { const Q = cand.filter(([i, k]) => !used.has(i) && !used.has(C.nb(i, k))); if (!Q.length) break; const [i, k] = Q[R() * Q.length | 0]; used.add(i); sol[i] |= DIRS[k][0]; at.push([i, k]); }
      C.out.zone = { E, T: at.length, at }; C.out.river = C.out.zone; C.out.openAny = true;
    },
  };
};
