// Fiske Arena — bot rakip. Aday atışları fizik motoruyla dener, en iyisini seçer.
// Zorluk = denenen aday sayısı + atışa eklenen el titremesi.
import { maxV, clone, play, aliveOf, edgeDist } from './physics.js';

export const LEVELS = {
  kolay: { ad: 'Kolay', n: 18, aim: 0.16, pow: 0.15 },
  orta: { ad: 'Orta', n: 70, aim: 0.05, pow: 0.07 },
  zor: { ad: 'Zor', n: 220, aim: 0.012, pow: 0.02 },
};

function score(S, me, before) {
  const op = 1 - me, A = S.arena;
  const mine = aliveOf(S, me), theirs = aliveOf(S, op);
  if (S.winner === me) return 1e4;
  if (S.winner === op) return -1e4;
  let s = (before.op - theirs.length) * 100 - (before.me - mine.length) * 140;
  for (const p of mine) s += Math.min(edgeDist(A, p.x, p.y), 40) * 0.6;
  for (const p of theirs) s -= Math.min(edgeDist(A, p.x, p.y), 40) * 0.4;
  return s;
}

export function botShot(S, level = 'orta', rand = Math.random) {
  const L = LEVELS[level] || LEVELS.orta, me = S.turn;
  const own = aliveOf(S, me), foe = aliveOf(S, 1 - me);
  const before = { me: own.length, op: foe.length };
  const cands = [];
  for (const o of own) for (const f of foe) {
    const a0 = Math.atan2(f.y - o.y, f.x - o.x);
    for (const da of [0, -0.05, 0.05, -0.11, 0.11, -0.18, 0.18]) for (const pw of [1, 0.82, 0.62, 0.45])
      cands.push({ o, a: a0 + da, pw });
  }
  for (let i = 0; i < 12; i++) { const o = own[rand() * own.length | 0]; cands.push({ o, a: rand() * Math.PI * 2, pw: 0.25 + rand() * 0.5 }); }
  // karıştır, ilk n tanesini dene
  for (let i = cands.length - 1; i > 0; i--) { const j = rand() * (i + 1) | 0; [cands[i], cands[j]] = [cands[j], cands[i]]; }
  let best = null, bestS = -Infinity;
  for (const c of cands.slice(0, L.n)) {
    const T = clone(S), shot = { id: c.o.id, vx: Math.cos(c.a) * c.pw * maxV(S), vy: Math.sin(c.a) * c.pw * maxV(S) };
    play(T, shot);
    const sc = score(T, me, before) + rand() * 0.5;
    if (sc > bestS) { bestS = sc; best = c; }
  }
  const a = best.a + (rand() * 2 - 1) * L.aim, pw = Math.max(0.15, Math.min(1, best.pw * (1 + (rand() * 2 - 1) * L.pow)));
  return { id: best.o.id, vx: Math.cos(a) * pw * maxV(S), vy: Math.sin(a) * pw * maxV(S) };
}
