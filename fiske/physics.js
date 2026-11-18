// Fiske Arena — deterministik fizik.
// Tarayıcı ve ileride sunucu (maç doğrulama) AYNI dosyayı kullanır.
// Kural: simülasyonda yalnızca + - * / ve Math.sqrt (IEEE-754'te her cihazda aynı sonuç).
// Atış girdisi (vx, vy) 0.01'e yuvarlanır; aynı atış listesi her yerde aynı maçı üretir.

export const PR = 7;            // pul yarıçapı
export const DT = 1 / 120;      // sabit adım
export const MAX_V = 230;       // en güçlü atış hızı
export const MAX_TURNS = 40;    // toplam atış sınırı
const FR = 155;                 // sürtünme (birim/sn²)
const E = 0.78;                  // pul-pul esneklik
const EB = 1.15;                // tampon esnekliği (>1: ittirir)
export const MAX_STEPS = 120 * 20;     // tek atış en fazla 20 sn

const BASE_STARTS = [[0, 52], [-22, 72], [22, 72]];

export const ARENAS = [
  { id: 'yuvarlak', ad: 'Yuvarlak', shape: 'circle', r: 100 },
  { id: 'halka', ad: 'Halka', shape: 'circle', r: 100, holes: [{ x: 0, y: 0, r: 20 }] },
  { id: 'buz', ad: 'Buz Pisti', shape: 'circle', r: 100, zones: [{ x: 0, y: 0, r: 46, f: 0.28, k: 'buz' }] },
  { id: 'tampon', ad: 'Tamponlu', shape: 'rect', w: 170, h: 200, bumpers: [{ x: -50, y: 0, r: 11 }, { x: 50, y: 0, r: 11 }] },
  { id: 'camur', ad: 'Çamurlu', shape: 'circle', r: 104, zones: [{ x: -54, y: 0, r: 26, f: 3.2, k: 'camur' }, { x: 54, y: 0, r: 26, f: 3.2, k: 'camur' }] },
];
export const arenaById = id => ARENAS.find(a => a.id === id) || ARENAS[0];

export function newGame(arenaId, first = 0) {
  const arena = arenaById(arenaId), pucks = [];
  for (let p = 0; p < 2; p++) for (const [x, y] of BASE_STARTS)
    pucks.push({ id: pucks.length, p, x, y: p === 0 ? y : -y, vx: 0, vy: 0, alive: true });
  return { arena, pucks, turn: first, first, n: 0, phase: 'aim', winner: null, shots: [] };
}

export const clone = S => ({ ...S, pucks: S.pucks.map(p => ({ ...p })), shots: S.shots.slice() });

export function onPlatform(A, x, y) {
  if (A.shape === 'circle' ? x * x + y * y > A.r * A.r : (x < -A.w / 2 || x > A.w / 2 || y < -A.h / 2 || y > A.h / 2)) return false;
  for (const h of A.holes || []) { const dx = x - h.x, dy = y - h.y; if (dx * dx + dy * dy < h.r * h.r) return false; }
  return true;
}

// Kenara (veya deliğe) uzaklık — bot değerlendirmesi için.
export function edgeDist(A, x, y) {
  let d = A.shape === 'circle' ? A.r - Math.sqrt(x * x + y * y) : Math.min(A.w / 2 - Math.abs(x), A.h / 2 - Math.abs(y));
  for (const h of A.holes || []) { const dx = x - h.x, dy = y - h.y; d = Math.min(d, Math.sqrt(dx * dx + dy * dy) - h.r); }
  return d;
}

export const moving = S => S.pucks.some(p => p.alive && (p.vx !== 0 || p.vy !== 0));
export const aliveOf = (S, pl) => S.pucks.filter(p => p.alive && p.p === pl);

// Maçın ilk atışı kısık güçle (ilk başlayanın avantajını dengeler).
export const FIRST_POW = 0.5;
export const maxV = S => S.n === 0 ? MAX_V * FIRST_POW : MAX_V;

// Atışı doğrula + normalize et. Geçersizse null.
export function normShot(S, shot) {
  const p = S.pucks[shot && shot.id];
  if (!p || !p.alive || p.p !== S.turn || S.phase !== 'aim' || S.winner !== null) return null;
  let vx = +shot.vx, vy = +shot.vy;
  if (!isFinite(vx) || !isFinite(vy)) return null;
  const s = Math.sqrt(vx * vx + vy * vy), M = maxV(S);
  if (s < 1) return null;
  if (s > M) { vx = vx * M / s; vy = vy * M / s; }
  // 0.01'e yuvarla; sınırı aşıyorsa 0.01 adımlarla küçült. Normalleştirilmiş atış tekrar verilirse değişmez.
  let ix = Math.round(vx * 100), iy = Math.round(vy * 100);
  const M2 = Math.round(M * 100) ** 2;
  while (ix * ix + iy * iy > M2) { ix -= Math.sign(ix); iy -= Math.sign(iy); }
  return { id: p.id, vx: ix / 100, vy: iy / 100 };
}

export function shoot(S, shot) {
  const q = normShot(S, shot);
  if (!q) return false;
  const p = S.pucks[q.id];
  p.vx = q.vx; p.vy = q.vy;
  S.shots.push(q); S.phase = 'moving';
  return true;
}

// Tek fizik adımı. ev: olay listesi (ses/efekt için), isteğe bağlı.
export function step(S, ev) {
  const A = S.arena, P = S.pucks;
  for (const p of P) {
    if (!p.alive || (p.vx === 0 && p.vy === 0)) continue;
    let f = FR;
    if (A.zones) for (const z of A.zones) { const dx = p.x - z.x, dy = p.y - z.y; if (dx * dx + dy * dy < z.r * z.r) f *= z.f; }
    const s = Math.sqrt(p.vx * p.vx + p.vy * p.vy), dec = f * DT;
    if (s <= dec) { p.vx = 0; p.vy = 0; continue; }
    const k = (s - dec) / s; p.vx *= k; p.vy *= k;
    p.x += p.vx * DT; p.y += p.vy * DT;
  }
  const D = 2 * PR;
  for (let i = 0; i < P.length; i++) {
    const a = P[i]; if (!a.alive) continue;
    for (let j = i + 1; j < P.length; j++) {
      const b = P[j]; if (!b.alive) continue;
      let dx = b.x - a.x, dy = b.y - a.y; const d2 = dx * dx + dy * dy;
      if (d2 >= D * D) continue;
      let d = Math.sqrt(d2);
      if (d === 0) { dx = 0; dy = 1; d = 1; }
      const nx = dx / d, ny = dy / d, o = (D - d) / 2;
      a.x -= nx * o; a.y -= ny * o; b.x += nx * o; b.y += ny * o;
      const vr = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (vr < 0) {
        const J = -(1 + E) * vr / 2;
        a.vx -= J * nx; a.vy -= J * ny; b.vx += J * nx; b.vy += J * ny;
        if (ev) ev.push({ t: 'hit', a: a.id, b: b.id, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, s: -vr });
      }
    }
    if (A.bumpers) for (let bi = 0; bi < A.bumpers.length; bi++) {
      const B = A.bumpers[bi], R = PR + B.r;
      const dx = a.x - B.x, dy = a.y - B.y, d2 = dx * dx + dy * dy;
      if (d2 >= R * R) continue;
      const d = Math.sqrt(d2) || 1, nx = dx / d, ny = dy / d;
      a.x = B.x + nx * R; a.y = B.y + ny * R;
      const vn = a.vx * nx + a.vy * ny;
      if (vn < 0) {
        a.vx -= (1 + EB) * vn * nx; a.vy -= (1 + EB) * vn * ny;
        const s = Math.sqrt(a.vx * a.vx + a.vy * a.vy), cap = MAX_V * 1.1;
        if (s > cap) { a.vx = a.vx * cap / s; a.vy = a.vy * cap / s; }
        if (ev) ev.push({ t: 'bump', a: a.id, b: bi, x: a.x - nx * PR, y: a.y - ny * PR, s: -vn });
      }
    }
  }
  for (const p of P) if (p.alive && !onPlatform(A, p.x, p.y)) {
    p.alive = false;
    if (ev) ev.push({ t: 'fall', a: p.id, x: p.x, y: p.y, vx: p.vx, vy: p.vy, p: p.p });
  }
}

// Atış bitti (her şey durdu): sırayı ilerlet, kazananı belirle.
// Kurallar: rakibin tüm pulları düşerse kazanırsın. Aynı atışta son pulun da düşerse kaybedersin.
// 40 atış dolarsa çok pulu kalan kazanır; eşitse berabere (winner = -1).
export function endTurn(S) {
  for (const p of S.pucks) if (!p.alive) { p.vx = 0; p.vy = 0; }
  const me = S.turn, op = 1 - me, a = aliveOf(S, me).length, b = aliveOf(S, op).length;
  S.n++;
  if (a === 0) S.winner = op;
  else if (b === 0) S.winner = me;
  else if (S.n >= MAX_TURNS) S.winner = a === b ? -1 : (a > b ? me : op);
  S.phase = S.winner === null ? 'aim' : 'over';
  if (S.winner === null) S.turn = op;
  return S.winner;
}

// Atışı sonuna kadar oynat (bot, test ve sunucu için).
export function play(S, shot, ev) {
  if (!shoot(S, shot)) return false;
  let k = 0;
  while (moving(S) && k++ < MAX_STEPS) step(S, ev);
  for (const p of S.pucks) { p.vx = 0; p.vy = 0; }
  endTurn(S);
  return true;
}

// Sunucu doğrulaması: atış listesinden maçı yeniden kur.
export function replay(arenaId, first, shots) {
  const S = newGame(arenaId, first);
  for (const s of shots) if (S.winner !== null || !play(S, s)) return null;
  return S;
}

export const hashState = S => S.pucks.map(p => `${p.id}:${p.alive ? 1 : 0}:${p.x.toFixed(6)},${p.y.toFixed(6)}`).join('|') + `#${S.turn}/${S.n}/${S.winner}`;
