// Önerilen EN KÜÇÜK çekirdek kancalarının game.js'e metin yaması olarak uygulanmış hâli (yalnız bellekte; dosya DEĞİŞMEZ).
// H2 lit: P.void (yok sayılan hücre) · H3 lit: P.exit (tahta dışına bakan kol depoya bağlanır).
// H1 difficulty: eklenti cands(P, i) (oyuncunun düşündüğü olası çözüm maskeleri) · H3 difficulty: eklenti edge(P, i, k) (dış kenarda kol olabilir mi).
const fs = require('fs');
let src = fs.readFileSync('/home/user/mobil-oyun/www/game.js', 'utf8');
const rep = (a, b) => { if (!src.includes(a)) throw new Error('yama yeri yok: ' + a.slice(0, 60)); src = src.replace(a, b); };
// --- H2 + H3 · lit ---
rep('const { cur, hub, hub2 = -1, split } = P, n = cur.length,', 'const { hub, hub2 = -1, split } = P, cur = P.void ? P.cur.map((v, i) => P.void[i] ? 0 : v) : P.cur, n = cur.length,');
rep('if (j < 0 || !(cur[j] & o)) { loose++; continue; }', 'if (j < 0) { if (!P.exit?.[i * 4 + k]) loose++; continue; }\n        if (!(cur[j] & o)) { loose++; continue; }');
rep('let ok = loose === 0 && !merged && d.every(v => v >= 0);', 'let ok = loose === 0 && !merged && d.every((v, i) => v >= 0 || P.void?.[i]);');
// --- H1 · difficulty: gizli karo durumları ---
rep("  const allow = MODS.filter(m => m.allow && P[m.key]);   // eklenti yerel süzgeci (ör. tabela: o kenarda kol olmalı)",
    "  const allow = MODS.filter(m => m.allow && P[m.key]);   // eklenti yerel süzgeci (ör. tabela: o kenarda kol olmalı)\n" +
    "  const hid = new Set(), cm = MODS.filter(m => m.cands && P[m.key]);   // H1: gizli bilgi → oyuncunun düşündüğü olası çözüm maskeleri\n" +
    "  if (cm.length) for (let i = 0; i < n; i++) for (const m of cm) { const c = m.cands(P, i); if (c) { M[i] = c; hid.add(unit[i]); break; } }");
rep("  const C0 = units.map(B => {\n    if (B.cells.some(i => pinned[i])) return [0];",
    "  const C0 = units.map((B, u) => {\n    if (hid.has(u)) return M[B.cells[0]].map((_, r) => r);\n    if (B.cells.some(i => pinned[i])) return [0];");
// --- H3 · difficulty: dış kenar ---
rep("  const step = (C, prev) => {", "  const em = MODS.filter(m => m.edge && P[m.key]);   // H3: tahta dışına bakan kenarda kol olabilir mi\n  const step = (C, prev) => {");
rep("const can = v => out ? !v : prev[unit[j]].some(r => !!(M[j][r] & o) === v);", "const can = v => out ? !v || em.some(m => m.edge(P, i, k)) : prev[unit[j]].some(r => !!(M[j][r] & o) === v);");
// --- H4 · difficulty(P, leaf, cap): eklentinin adillik denetimi için yaprak geri çağrısı (çözüm sayımı) + düğüm tavanı; api'ye eklenir ---
rep('function difficulty(P) {', 'function difficulty(P, leaf = null, cap = 200) {');
rep('if (++nodes > 200) return true;', 'if (++nodes > cap) return true;');
rep('if (b < 0) return lit({ ...P, cur: cur.map((v, i) => M[i][D[unit[i]][0]]) }).solved;', 'if (b < 0) { const cfg = cur.map((v, i) => M[i][D[unit[i]][0]]); return leaf ? leaf(cfg) : lit({ ...P, cur: cfg }).solved; }');
// --- H5 (isteğe bağlı) · difficulty: küresel sayım budaması (ör. "1 kapalı durak", "aralıkta tam 1 depo") ---
rep('const copy = C => C.map(a => a.slice()), fix = C => { for (;;) { const c = step(C, copy(C)); if (c < 0) return false; if (!c) return true; } };',
    'const pm = MODS.filter(m => m.prune && P[m.key]), copy = C => C.map(a => a.slice()), fix = C => { for (;;) { const c = step(C, copy(C)); if (c < 0 || !pm.every(m => m.prune(P, i => C[unit[i]].map(r => M[i][r])))) return false; if (!c) return true; } };');
// --- H7 · pick: eklentinin adil bulmadığı aday (P.reject) seçilmez; hepsi reddedilirse eski davranış ---
rep('for (let k = 0; k < K; k++) { const P = generate(cols, rows, seed + k * 104729, pins, pairs, x); P.diff = difficulty(P); if (!best || Math.abs(P.diff - T) < Math.abs(best.diff - T)) best = P; }',
    'for (let k = 0; k < K; k++) { const P = generate(cols, rows, seed + k * 104729, pins, pairs, x); P.diff = difficulty(P); if (!best || (best.reject && !P.reject) || (!P.reject === !best.reject && Math.abs(P.diff - T) < Math.abs(best.diff - T))) best = P; }');
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); return src.slice(i, j); };
const code = [cut('const N = 1, E = 2', '// hat adları'), cut('const LINE0 = 12', 'const STAR_AVG'), cut('const lineLen = c', '// Günün Hattı'), cut('// ---------- rastgele', '// ---------- yıldızlar'),
  'return { DIRS, rot, unrot, rng, hashStr, MODS, CLASH, RULES, RULE_LINE, rulesFor, puzzleFor, pzCache, lineStart, lineEnd, zOf, sizeFor, generate, nb, ob, tree, popc, difficulty, lit, unitTaps, FOG_R, PAIR_COLS, loadRules };'].join('\n');
globalThis.matchMedia = globalThis.matchMedia || (() => ({ matches: false, addEventListener() {} }));
const win = { RAY_RULES: [] }, K = new Function('window', 'document', code)(win, { createElement: () => ({}), head: { append() {} } });
for (const f of fs.readdirSync('/home/user/mobil-oyun/www/rules').filter(f => f.endsWith('.js')).sort()) new Function('window', fs.readFileSync('/home/user/mobil-oyun/www/rules/' + f, 'utf8'))(win);
const noop = () => {};
K.loadRules({ difficulty: (...a) => K.difficulty(...a), lit: (...a) => K.lit(...a), N: 1, E: 2, S: 4, W: 8, DIRS: K.DIRS, FOG_R: K.FOG_R, PAIR_COLS: K.PAIR_COLS, rot: K.rot, unrot: K.unrot, popc: K.popc, nb: K.nb, ob: K.ob, tree: K.tree, hashStr: K.hashStr,
  rgba: noop, shade: noop, lum: noop, hueRot: noop, okl: noop, oklch: noop, toast: noop, tone: noop, note: noop, haptic: noop, persist: noop, kick: noop, burst: noop, rrp: noop, rr: noop, railPath: noop, ease: noop, back: noop,
  anim: new Map(), press: new Map(), lineName: String, G: null, pal: {}, save: {}, geo: {}, vg: {}, cx: {} });
module.exports = K;
