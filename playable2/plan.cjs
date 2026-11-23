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
    // diğer merkezin ağında 1–6 karo karartan, birbirinden uzak karolar: 2 gösterim (el kendisi yapar) + 5 oyuncu hamlesi; anahtar karo en son
    const dist = (a, b) => Math.abs(a % P.cols - b % P.cols) + Math.abs((a / P.cols | 0) - (b / P.cols | 0));
    const small = cand.filter(c => c.own !== key.own && c.n >= 1 && c.n <= 6).sort((a, b) => b.n - a.n);
    const pick = [];
    for (const minD of [3, 2, 1]) { for (const c of small) if (pick.length < 7 && !pick.includes(c) && pick.every(x => dist(x.i, c.i) >= minD)) pick.push(c); if (pick.length >= 7) break; }
    // gösterim: tahtanın üstündeki iki karo (göz önce oraya gider); oyuncunun karoları aşağıdan yukarı
    pick.sort((a, b) => a.i - b.i);
    const cur = P.sol.slice(); for (const c of [...pick, key]) cur[c.i] = unrot(P.sol[c.i]);
    // hepsi birlikte de çözülebilir mi (karolar bağımsız: her biri tek dokunuşla yerine gelir)
    const after = cur.slice(); for (const c of [...pick, key]) after[c.i] = P.sol[c.i];
    return { lvl, sig, cur, demo: pick.slice(0, 2).map(c => c.i), order: [...pick.map(c => c.i), key.i], key, pick, darkStart: dark(cur), solvedOk: R.lit({ ...P, cur: after }).solved, total: P.cur.length, cols: P.cols, rows: P.rows, hubs: [P.hub, P.hub2] };
  }, lvl);
  await b.close(); return r;
};
if (require.main === module) module.exports(+(process.argv[2] || 186)).then(r => console.log(JSON.stringify(r)));
