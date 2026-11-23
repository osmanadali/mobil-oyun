// Reklam bulmacasının başlangıç dizilimi: asıl oyunun bölümünden (puzzleFor) türetilir. Çözüme 3 dokunuş kalır:
// 2 dokunuş birinci hatta küçük parçalar yakar, son dokunuş (anahtar karo) ikinci hattın neredeyse tamamını bir anda yakar.
'use strict';
const { chromium } = require('playwright'), path = require('path');
module.exports = async function plan(lvl) {
  const b = await chromium.launch(), p = await b.newPage();
  await p.addInitScript('window.__noIntro = true; window.__ligFake = true; localStorage.clear();');
  await p.goto('file://' + path.join(__dirname, '..', 'www', 'index.html')); await p.waitForTimeout(600);
  const r = await p.evaluate(lvl => {
    const R = window.__ray, P = R.puzzleFor(lvl), rot = R.rot, unrot = m => ((m >> 1) | (m << 3)) & 15;
    const hashStr = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
    const sig = hashStr(P.sol.join() + '|' + P.cur.join());
    const L0 = R.lit({ ...P, cur: P.sol.slice() });
    const own = L0.own || [];
    const dark = cur => R.lit({ ...P, cur }).d.filter(v => v < 0).length;
    const cand = [];
    P.sol.forEach((s, i) => { const u = unrot(s); if (u === s || rot(u) !== s) return; const cur = P.sol.slice(); cur[i] = u; cand.push({ i, n: dark(cur), own: own[i] }); });
    cand.sort((a, b) => b.n - a.n);
    const key = cand[0];
    // diğer merkezin ağında 2–5 karo karartan iki karo (birbirinden uzak)
    const small = cand.filter(c => c.own !== key.own && c.n >= 2 && c.n <= 6);
    const pick = [];
    for (const c of small) if (!pick.some(x => Math.abs(x.i % P.cols - c.i % P.cols) + Math.abs((x.i / P.cols | 0) - (c.i / P.cols | 0)) < 3)) { pick.push(c); if (pick.length === 2) break; }
    const cur = P.sol.slice(); for (const c of [...pick, key]) cur[c.i] = unrot(P.sol[c.i]);
    return { lvl, sig, cur, order: [...pick.map(c => c.i), key.i], key, pick, darkStart: dark(cur), total: P.cur.length, cols: P.cols, rows: P.rows, hubs: [P.hub, P.hub2] };
  }, lvl);
  await b.close(); return r;
};
if (require.main === module) module.exports(+(process.argv[2] || 186)).then(r => console.log(JSON.stringify(r)));
