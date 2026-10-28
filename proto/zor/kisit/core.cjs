// game.js'ten üretim/çözücü çekirdeğini Node'a çıkarır (kod DEĞİŞMEZ; satır dilimleri okunur)
const fs = require('fs'), vm = require('vm');
const ROOT = '/home/user/mobil-oyun/www';
const src = fs.readFileSync(ROOT + '/game.js', 'utf8').split('\n');
const sl = (a, b) => src.slice(a - 1, b).join('\n');
const find = re => src.findIndex(l => re.test(l)) + 1;
const L = {
  dirs: [find(/^const N = 1, E = 2/), find(/^const unrot =/)],
  line: [find(/^const LINE0 = 12/), find(/^const LINE0 = 12/)],
  lineFns: [find(/^const lineLen =/), find(/^const zPct =/)],
  rng: [find(/^function rng\(seed\)/), find(/^const hashStr =/)],
  rules: [find(/^const RULES = \{/), find(/^function sizeFor/) + 6],
  gen: [find(/^function generate\(/), find(/^function cached\(/) - 1],
  cached: [find(/^function cached\(/), find(/^function dailyFor/) - 1],
  lit: [find(/^function lit\(P\)/), find(/^\/\/ ---------- yıldızlar/) - 1],
};
const BASE = Object.values(L).map(([a, b]) => sl(a, b)).join('\n');
// ÖNERİLEN ÇEKİRDEK KANCALARI (yalnız prototipte; game.js'e dokunulmaz):
//  1) open(P,i,k): i karosunun k yönündeki kolu açık uç (tampon) olabilir mi. lit: L.open sayar (loose sayılmaz); difficulty: can() buna izin verir.
//  2) prune(P,C,M,unit,units): zorluk çözücüsünde her turun sonunda küresel süzgeç (sayım vb.). Dönüş: daralan birimler ya da -1 (çelişki).
const HOOKS = [
  // lit: sanal düğüm VN (ana hat). open()=2 olan kenar VN'ye bağlanır; VN'den P.joins listesindeki bütün çıkışlara geçilir
  ['const dd = new Array(split ? 2 * n : n).fill(-1), q = [h]; dd[h] = 0;',
   'const VN = split ? 2 * n : n, dd = new Array(VN + 1).fill(-1), q = [h]; dd[h] = 0;'],
  ['const u = q.shift(), i = u < n ? u : u - n, half',
   'const u = q.shift(); if (u === VN) { for (const [a, kk] of P.joins || []) if ((cur[a] & DIRS[kk][0]) && dd[a] < 0) { dd[a] = dd[u] + 1; q.push(a); } continue; } const i = u < n ? u : u - n, half'],
  ['if (j < 0 || !(cur[j] & o)) { loose++; continue; }',
   'const op_ = (j < 0 || !(cur[j] & o)) ? OPEN(P, i, k) : 0; if (op_ === 2) { opn++; if (dd[VN] < 0) { dd[VN] = dd[u] + 1; q.push(VN); } continue; } if (op_) { opn++; continue; } if (j < 0 || !(cur[j] & o)) { loose++; continue; }'],
  ['let loose = 0;', 'let loose = 0, opn = 0;'],
  ['const L = { d, own, merged, n: d.filter(v => v >= 0).length, solved: ok,', 'const L = { d, own, merged, open: opn, n: d.filter(v => v >= 0).length, solved: ok,'],
  ['const can = v => out ? !v : prev[unit[j]].some(r => !!(M[j][r] & o) === v);',
   'const op = OPEN(P, i, k), can = v => out ? (!v || !!op) : prev[unit[j]].some(r => !!(M[j][r] & o) === v || (!!op && v) || (!v && !!OPEN(P, j, KO(o))));'],
  ['    let c = 0; hit.forEach(u => { c += units[u].cells.length; }); return c;',
   '    for (const m of MODS) if (m.prune && P[m.key]) { const r = m.prune(P, C, M, unit, units); if (r === -1) return -1; for (const u of r) hit.add(u); }\n    let c = 0; hit.forEach(u => { c += units[u].cells.length; }); return c;'],
];
function build(hooks) {
  let code = BASE;
  if (hooks) {
    for (const [a, b] of HOOKS) { if (!code.includes(a)) throw new Error('yama yok: ' + a); code = code.replace(a, b); }
    code = 'const OPEN = (P, i, k) => { if (!P.openAny) return 0; for (const m of MODS) if (m.open && P[m.key]) { const v = m.open(P, i, k); if (v) return v; } return 0; }; const KO = o => o === 1 ? 0 : o === 2 ? 1 : o === 4 ? 2 : 3;\n' + code;
  }
  return code + '\n;({ N, E, S, W, DIRS, rot, unrot, rng, hashStr, generate, unitTaps, nb, ob, tree, popc, difficulty, pick, lit, MODS, CLASH, RULE_LINE, RULES, rulesFor, loadRules, sizeFor, lineOf, lineStart, lineEnd, zOf, puzzleFor, FOG_R, PAIR_COLS });';
}
function load({ withRules = false, extra = [], hooks = true } = {}) {
  const win = { RAY_RULES: [] };
  const ctx = { matchMedia: () => ({ matches: false, addEventListener() {} }), performance: { now: () => 0 }, window: win, document: { createElement: () => ({}), head: { append() {} } }, TEST: false, console, Math, Set, Map, Array, Int16Array, Uint8Array, Int32Array, Float64Array, Object, WeakMap, JSON, Number, String, Infinity };
  vm.createContext(ctx);
  const K = vm.runInContext(build(hooks), ctx, { filename: 'game-core.js' });
  if (withRules) for (const f of fs.readdirSync(ROOT + '/rules')) vm.runInContext(fs.readFileSync(ROOT + '/rules/' + f, 'utf8'), ctx, { filename: f });
  for (const f of extra) win.RAY_RULES.push(f);
  const api = { N: 1, E: 2, S: 4, W: 8, DIRS: K.DIRS, FOG_R: K.FOG_R, PAIR_COLS: K.PAIR_COLS, rot: K.rot, unrot: K.unrot, popc: K.popc, nb: K.nb, ob: K.ob, tree: K.tree, hashStr: K.hashStr,
    rgba() {}, shade() {}, lum() {}, hueRot() {}, okl() {}, oklch() {}, toast() {}, tone() {}, note() {}, haptic() {}, persist() {}, kick() {}, burst() {}, rrp() {}, rr() {}, railPath() {}, ease: t => t, back: t => t, anim: new Map(), press: new Map(), lineName: c => 'M' + (c + 1), G: null, pal: {}, save: {}, geo: {}, vg: {}, cx: {} };
  K.loadRules(api);
  K.api = api;
  return K;
}
module.exports = { load, L };
if (require.main === module) {
  const K0 = load({ hooks: false }), K1 = load({ hooks: true, withRules: true });
  let same = 0; for (let s = 0; s < 60; s++) { const a = K0.generate(7, 9, s * 31 + 5), b = K1.generate(7, 9, s * 31 + 5); if (K0.difficulty(a) === K1.difficulty(b) && K0.lit({ ...a, cur: a.sol }).solved && K1.lit({ ...b, cur: b.sol }).solved) same++; }
  console.log(L, K1.MODS.map(m => m.key), 'kancalı çekirdek = asıl çekirdek (kuralsız):', same + '/60');
}
