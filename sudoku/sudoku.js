// Sudoku üretici + çözücü (tek çözümlü bulmaca garantili)
const Sudoku = (() => {
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

  const canPlace = (g, i, v) => {
    const r = i / 9 | 0, c = i % 9, br = r - r % 3, bc = c - c % 3;
    for (let k = 0; k < 9; k++) {
      if (g[r * 9 + k] === v || g[k * 9 + c] === v) return false;
      if (g[(br + (k / 3 | 0)) * 9 + bc + k % 3] === v) return false;
    }
    return true;
  };

  function fill(g) {
    const i = g.indexOf(0);
    if (i < 0) return true;
    for (const v of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
      if (canPlace(g, i, v)) { g[i] = v; if (fill(g)) return true; g[i] = 0; }
    }
    return false;
  }

  // En az aday olan hücreyi seçerek çözüm say (limit'e kadar)
  function count(g, limit = 2) {
    let best = -1, bestCands = null;
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue;
      const cands = [];
      for (let v = 1; v <= 9; v++) if (canPlace(g, i, v)) cands.push(v);
      if (!cands.length) return 0;
      if (!bestCands || cands.length < bestCands.length) { best = i; bestCands = cands; if (cands.length === 1) break; }
    }
    if (best < 0) return 1;
    let n = 0;
    for (const v of bestCands) {
      g[best] = v; n += count(g, limit - n); g[best] = 0;
      if (n >= limit) break;
    }
    return n;
  }

  const CLUES = { kolay: 40, orta: 32, zor: 26 };

  function generate(diff = 'kolay') {
    const sol = new Array(81).fill(0);
    fill(sol);
    const puz = sol.slice();
    const target = CLUES[diff] || 36;
    let filled = 81;
    for (const i of shuffle([...Array(81).keys()])) {
      if (filled <= target) break;
      const keep = puz[i]; puz[i] = 0;
      if (count(puz.slice()) !== 1) puz[i] = keep; else filled--;
    }
    return { puzzle: puz, solution: sol };
  }

  return { generate, canPlace };
})();
