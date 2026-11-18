// Fiske Arena testleri: determinizm, sunucu yeniden oynatma, bot-bot maçları biter mi.
import { ARENAS, newGame, play, replay, hashState, clone } from '../fiske/physics.js';
import { botShot } from '../fiske/bot.js';
import { rng } from './fiske-rng.mjs';

let fail = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fail++; };
const t0 = Date.now(), stats = {};
for (const A of ARENAS) for (const [l0, l1] of [['zor', 'kolay'], ['orta', 'orta'], ['kolay', 'zor']]) for (let g = 0; g < 4; g++) {
  const R = rng(g * 977 + A.id.length * 31 + l0.length), S = newGame(A.id, g % 2);
  while (S.winner === null) { const L = S.turn === 0 ? l0 : l1; if (!play(S, botShot(S, L, R))) { ok(false, 'geçersiz bot atışı'); break; } }
  const k = `${l0}-${l1}`; stats[k] = stats[k] || { w0: 0, w1: 0, d: 0, n: 0 };
  stats[k][S.winner === 0 ? 'w0' : S.winner === 1 ? 'w1' : 'd']++; stats[k].n += S.n;
  const S2 = replay(A.id, g % 2, S.shots);
  if (!S2 || hashState(S2) !== hashState(S)) { ok(false, `replay farklı: ${A.id} ${k} #${g}`); }
}
ok(fail === 0, 'tüm maçlar biter ve atış listesinden birebir yeniden kurulur (sunucu doğrulaması)');
for (const [k, s] of Object.entries(stats)) console.log(`  ${k}: soldaki ${s.w0} · sağdaki ${s.w1} · berabere ${s.d} · ort. ${(s.n / (s.w0 + s.w1 + s.d)).toFixed(1)} atış`);
ok(stats['zor-kolay'].w0 > stats['zor-kolay'].w1 && stats['kolay-zor'].w1 > stats['kolay-zor'].w0, 'zor bot kolay botu yener');
const S = newGame('yuvarlak'); ok(!play(clone(S), { id: 3, vx: 0, vy: 100 }), 'sırası olmayan pul atılamaz');
ok(!play(clone(S), { id: 0, vx: NaN, vy: 1 }), 'bozuk atış reddedilir');
const T = clone(S); play(T, { id: 0, vx: 0, vy: -1e6 }); ok(Math.abs(T.shots[0].vy) <= 230, 'aşırı hız sınıra çekilir');
console.log(`süre ${Date.now() - t0} ms`); process.exit(fail ? 1 : 0);
