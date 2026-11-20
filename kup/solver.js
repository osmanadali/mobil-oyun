/*SOLVER-START*/
// Yeni başlayan yöntemi (katman katman) çözücü. Beyaz/ilk renk altta (D), son renk üstte (U).
// Hamle biçimi oyunla aynı: [eksen 0..2, katman 0..2, çeyrek ±1/2] (+eksen etrafında, sağ el kuralı).
const Solver = (() => {
  const NORM = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const R_ = 0, L_ = 1, U_ = 2, D_ = 3, F_ = 4, B_ = 5;
  const RING = [F_, R_, B_, L_];
  const faceOfN = n => n[0] > .5 ? 0 : n[0] < -.5 ? 1 : n[1] > .5 ? 2 : n[1] < -.5 ? 3 : n[2] > .5 ? 4 : 5;
  const key = (p, f) => p.join(',') + '|' + f;
  const FL = [], IDX = {};
  NORM.forEach((n, f) => {
    const ax = f >> 1, o = [0, 1, 2].filter(i => i !== ax);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const p = [0, 0, 0]; p[ax] = n[ax]; p[o[0]] = a; p[o[1]] = b;
      IDX[key(p, f)] = FL.length; FL.push({ p, f });
    }
  });
  function rot1(v, ax) { const [x, y, z] = v; return ax === 0 ? [x, -z, y] : ax === 1 ? [z, y, -x] : [-y, x, z]; }
  function rot(v, ax, q) { let r = v, k = ((q % 4) + 4) % 4; while (k--) r = rot1(r, ax); return r; }
  const PERM = {};
  const pk = mv => mv[0] * 100 + mv[1] * 10 + (mv[2] + 2);
  for (let ax = 0; ax < 3; ax++) for (let ly = 0; ly < 3; ly++) for (const q of [1, -1, 2, -2]) {
    const perm = new Int8Array(54);
    for (let i = 0; i < 54; i++) perm[i] = i;
    FL.forEach((fl, i) => {
      if (fl.p[ax] !== ly - 1) return;
      const p2 = rot(fl.p, ax, q), n2 = rot(NORM[fl.f], ax, q);
      perm[IDX[key(p2, faceOfN(n2))]] = i;
    });
    PERM[pk([ax, ly, q])] = perm;
  }
  const apply = (s, mv) => { const p = PERM[pk(mv)], o = new Int8Array(54); for (let i = 0; i < 54; i++) o[i] = s[p[i]]; return o; };
  const applyAll = (s, mvs) => { for (const m of mvs) s = apply(s, m); return s; };

  // parçalar
  const POS = [];
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) POS.push([x, y, z]);
  const nz = p => p.filter(v => v !== 0).length;
  const facesOf = p => { const r = []; p.forEach((v, i) => { if (v) r.push(i * 2 + (v > 0 ? 0 : 1)); }); return r; };
  const EDGES = POS.filter(p => nz(p) === 2), CORNERS = POS.filter(p => nz(p) === 3);
  const fIdx = (p, f) => IDX[key(p, f)];
  const colorsAt = (s, p) => facesOf(p).map(f => ({ f, c: s[fIdx(p, f)] }));
  const solvedAt = (s, p) => colorsAt(s, p).every(o => o.c === o.f);
  const sameSet = (a, b) => a.length === b.length && a.every(x => b.includes(x));
  function find(s, cols) {
    const list = cols.length === 2 ? EDGES : CORNERS;
    return list.find(p => sameSet(colorsAt(s, p).map(o => o.c), cols));
  }
  const posWith = (faces, y) => POS.find(p => p[1] === y && nz(p) === faces.length + (y ? 1 : 0) && sameSet(facesOf(p).filter(f => f !== U_ && f !== D_), faces));
  const eqP = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

  // yüz hamlesi → oyun hamlesi; t: 1 saat yönü, -1 ters, 2 çift
  function fm(face, t) { const ax = face >> 1, pos = face % 2 === 0; return [ax, pos ? 2 : 0, t === 2 ? 2 : (pos ? -t : t)]; }
  const LETTER = k => ({ F: RING[k], R: RING[(k + 1) % 4], B: RING[(k + 2) % 4], L: RING[(k + 3) % 4], U: U_, D: D_ });
  function alg(str, k) {
    const m = LETTER(k);
    return str.trim().split(/\s+/).map(tok => {
      const t = tok.includes("'") ? -1 : tok.includes('2') ? 2 : 1;
      return { mv: fm(m[tok[0]], t), lb: tok };
    });
  }
  function label(mv, k) {
    const face = mv[0] * 2 + (mv[1] === 2 ? 0 : 1), pos = face % 2 === 0;
    const t = Math.abs(mv[2]) === 2 ? 2 : (pos ? -mv[2] : mv[2]);
    const m = LETTER(k); const ch = Object.keys(m).find(c => m[c] === face);
    return ch + (t === 2 ? '2' : t === -1 ? "'" : '');
  }
  const ALL = []; for (let f = 0; f < 6; f++) for (const t of [1, -1, 2]) ALL.push(fm(f, t));

  // ara hedefler
  const crossDone = s => RING.every(f => solvedAt(s, posWith([f], -1)));
  const F2L_C = s => [0, 1, 2, 3].every(k => solvedAt(s, posWith([RING[k], RING[(k + 1) % 4]], -1)));
  const MID = s => [0, 1, 2, 3].every(k => solvedAt(s, posWith([RING[k], RING[(k + 1) % 4]], 0)));
  const topEdges = () => RING.map(f => posWith([f], 1));
  const topCorners = () => [0, 1, 2, 3].map(k => posWith([RING[k], RING[(k + 1) % 4]], 1));
  const yCross = s => topEdges().every(p => s[fIdx(p, U_)] === U_);
  const yEdges = s => topEdges().every(p => solvedAt(s, p));
  const yCornPos = s => topCorners().every(p => sameSet(colorsAt(s, p).map(o => o.c), facesOf(p)));
  const solved = s => { for (let i = 0; i < 54; i++) if (s[i] !== FL[i].f) return false; return true; };
  const GOALS = [crossDone, s => crossDone(s) && F2L_C(s), s => crossDone(s) && F2L_C(s) && MID(s),
    s => crossDone(s) && F2L_C(s) && MID(s) && yCross(s), s => crossDone(s) && F2L_C(s) && MID(s) && yEdges(s),
    s => crossDone(s) && F2L_C(s) && MID(s) && yEdges(s) && yCornPos(s), solved];

  function search(s, goal, maxD, moves = ALL) {
    for (let d = 0; d <= maxD; d++) {
      const path = [];
      const rec = (st, depth, lastF) => {
        if (depth === 0) return goal(st);
        for (const m of moves) {
          const f = m[0] * 2 + (m[1] === 2 ? 0 : 1);
          if (f === lastF) continue;
          if (lastF >= 0 && (f >> 1) === (lastF >> 1) && f < lastF) continue;
          path.push(m);
          if (rec(apply(st, m), depth - 1, f)) return true;
          path.pop();
        }
        return false;
      };
      if (rec(s, d, -1)) return path;
    }
    return null;
  }
  // makro arama (BFS): ops = [{moves:[...], ...}]
  function macroSearch(s, goal, ops, maxD) {
    let layer = [{ s, path: [] }];
    if (goal(s)) return [];
    for (let d = 0; d < maxD; d++) {
      const next = [];
      for (const n of layer) for (let i = 0; i < ops.length; i++) {
        const last = n.path[n.path.length - 1];
        if (last != null && ops[last].u && ops[i].u) continue;
        const s2 = applyAll(n.s, ops[i].moves.map(x => x.mv));
        const path = n.path.concat(i);
        if (goal(s2)) return path;
        next.push({ s2, s: s2, path });
      }
      layer = next;
    }
    return null;
  }

  function relabel(raw) {
    const lab = {};
    for (let f = 0; f < 6; f++) lab[raw[fIdx(NORM[f], f)]] = f;
    return Int8Array.from(raw, c => lab[c]);
  }

  // adım listesi: {stage, k, text, moves:[{mv, lb}]}
  function plan(raw) {
    let s = relabel(raw);
    const steps = [];
    const push = (stage, k, text, moves, focus) => { if (!moves.length) return; steps.push({ stage, k, text, moves, focus }); s = applyAll(s, moves.map(x => x.mv)); };
    const mk = (mvs, k) => mvs.map(mv => ({ mv, lb: label(mv, k) }));
    const kOf = f => RING.indexOf(f);
    const uTurnsTo = (pred) => { for (const t of [0, 1, -1, 2]) { const m = t ? [fm(U_, t)] : []; if (pred(applyAll(s, m))) return m; } return []; };

    // 1) alt artı
    for (const side of RING) {
      const k = kOf(side), target = posWith([side], -1), FO = { cols: [D_, side], to: target };
      if (solvedAt(s, target)) continue;
      let p = find(s, [D_, side]);
      if (p[1] === -1) {
        const f = facesOf(p).find(x => x !== D_);
        push(0, kOf(f), 'Bu beyaz kenar altta ama yanlış yerde ya da ters. Önce üste çıkar: üst katmanda serbestçe gezdirebilirsin, alttakiler bozulmaz.', mk([fm(f, 2)], kOf(f)), FO);
      } else if (p[1] === 0) {
        const f = facesOf(p)[0];
        const t = [1, -1].find(t => find(apply(s, fm(f, t)), [D_, side])[1] === 1);
        push(0, kOf(f), 'Kenar orta katmanda sıkışmış. Yüzü çevirip kenarı üste al, üstü çevirip onu kenara çek, sonra yüzü geri çevir. Son hamle alttaki beyazları geri koyar.', mk([fm(f, t), fm(U_, 1), fm(f, -t)], kOf(f)), FO);
      }
      const keep = RING.filter(x => x !== side && solvedAt(s, posWith([x], -1)));
      const goal = st => solvedAt(st, target) && keep.every(x => solvedAt(st, posWith([x], -1)));
      const path = search(s, goal, 6);
      push(0, k, 'Işıklı kenar, çerçeveli yere gidecek. Önce yan rengini aynı renkli merkezin üstüne getir, sonra o yüzü çevirip indir. Beyaz alta, yan rengi kendi merkezine bakmalı.', mk(path, k), FO);
    }
    // 2) alt köşeler
    for (let k = 0; k < 4; k++) {
      const a = RING[k], b = RING[(k + 1) % 4], target = posWith([a, b], -1), FO = { cols: [D_, a, b], to: target };
      if (solvedAt(s, target)) continue;
      let p = find(s, [D_, a, b]);
      if (p[1] === -1) {
        const fs = facesOf(p).filter(f => f !== D_);
        const k2 = [0, 1, 2, 3].find(i => sameSet([RING[i], RING[(i + 1) % 4]], fs));
        push(1, k2, 'Işıklı köşe altta ama yanlış yerde ya da ters dönük. Bir kez R U R\' U\' yap: sağ yüz kalkar, köşe üste çıkar, alttaki diğer parçalar yerine döner.', alg("R U R' U'", k2), FO);
      }
      const top = posWith([a, b], 1);
      push(1, k, 'Işıklı köşeyi, çerçeveli yerin tam üstüne getir. Doğru yer, köşenin üç rengini taşıyan üç merkezin buluştuğu köşedir. Sadece üstü çevir.', mk(uTurnsTo(st => eqP(find(st, [D_, a, b]), top)), k), FO);
      let n = 0;
      while (!solvedAt(s, target) && n < 6) { n++; push(1, k, `R U R' U' (${n}. tur). Her tur köşeyi bir kez döndürür ve alttakileri geri koyar. Beyaz alta bakana dek tekrarla.`, alg("R U R' U'", k), FO); }
    }
    // 3) orta katman
    for (let k = 0; k < 4; k++) {
      const a = RING[k], b = RING[(k + 1) % 4], target = posWith([a, b], 0), FO = { cols: [a, b], to: target };
      if (solvedAt(s, target)) continue;
      let p = find(s, [a, b]);
      if (p[1] === 0) {
        const fs = facesOf(p);
        const k2 = [0, 1, 2, 3].find(i => sameSet([RING[i], RING[(i + 1) % 4]], fs));
        push(2, k2, 'Işıklı kenar orta katmanda ama ters ya da yanlış yerde. Yerleştirme hamlesiyle oraya üstten başka bir kenar koyarsın; böylece bu kenar üste çıkar.', alg("U R U' R' U' F' U F", k2), FO);
      }
      // üstte: yan rengin merkezine getir
      const sideCol = st => { const q = find(st, [a, b]); const o = colorsAt(st, q).find(o => o.f !== U_); return { q, o, top: colorsAt(st, q).find(o => o.f === U_).c }; };
      push(2, k, 'Işıklı kenarın ön rengini aynı renkli merkezin üstüne getir. Kenar ile merkez dik bir çizgi oluşturmalı.', mk(uTurnsTo(st => { const r = sideCol(st); return r.o.c === r.o.f; }), k), FO);
      const r = sideCol(s), kf = kOf(r.o.f);
      if (r.top === RING[(kf + 1) % 4]) push(2, kf, 'Kenarın üst rengi sağdaki merkezle aynı, yani sağa gidecek. İlk dört hamle köşeyi kaldırıp kenarın yanına getirir, son dört hamle ikisini birlikte yerine indirir.', alg("U R U' R' U' F' U F", kf), FO);
      else push(2, kf, 'Kenarın üst rengi soldaki merkezle aynı, yani sola gidecek. Sağa yerleştirmenin aynadaki hali: köşeyi kaldır, kenarı yanına getir, ikisini birlikte indir.', alg("U' L' U L U F U' F'", kf), FO);
    }
    // 4) sarı artı
    {
      const ops = [0, 1, 2, 3].map(k => ({ k, moves: alg("F R U R' U' F'", k) }));
      const path = macroSearch(s, yCross, ops, 3) || [];
      path.forEach(i => push(3, ops[i].k, 'F R U R\' U\' F\' ilk iki katmanı aynen geri bırakır, sadece üstteki kenarların yönünü değiştirir. Nokta, L, çizgi ve artı sırasıyla ilerlersin.', ops[i].moves));
    }
    // 5) sarı kenarlar
    {
      const ops = [{ u: 1, k: 0, moves: alg('U', 0) }, { u: 1, k: 0, moves: alg("U'", 0) }, { u: 1, k: 0, moves: alg('U2', 0) }]
        .concat([0, 1, 2, 3].map(k => ({ k, moves: alg("R U R' U R U2 R'", k) })));
      const path = macroSearch(s, yEdges, ops, 5) || [];
      path.forEach(i => push(4, ops[i].k, ops[i].u ? 'Üstü çevirerek olabildiğince çok sarı kenarın yan rengini kendi merkeziyle eşle.' : 'R U R\' U R U2 R\' üstteki iki kenarın yerini değiştirir, alt katmanlara dokunmaz. Köşeler biraz döner, onlar sonraki adımın işi.', ops[i].moves));
    }
    // 6) sarı köşelerin yeri
    {
      const ops = [0, 1, 2, 3].map(k => ({ k, moves: alg("U R U' L' U R' U' L", k) }));
      const path = macroSearch(s, st => yEdges(st) && yCornPos(st), ops, 3) || [];
      path.forEach(i => push(5, ops[i].k, 'Bu hamle sağ öndeki köşeyi yerinde bırakır, diğer üç köşeyi sırayla döndürür. Bir köşe, üç rengini taşıyan merkezlerin arasındaysa doğru yerdedir, ters dönük olsa bile.', ops[i].moves));
    }
    // 7) sarı köşeleri çevir
    {
      const ufr = [1, 1, 1];
      for (let i = 0; i < 4; i++) {
        let n = 0;
        while (s[fIdx(ufr, U_)] !== U_ && n < 6) { n++; push(6, 0, 'R\' D\' R D sağ ön köşeyi döndürür. Sarı üste bakana dek tekrarla. Alt katman bozulur, bu normal: bütün köşeler bitince hamleler birbirini götürür ve alt kendiliğinden düzelir.', alg("R' D' R D", 0), { cols: colorsAt(s, ufr).map(o => o.c), to: ufr }); }
        if (topCorners().every(p => s[fIdx(p, U_)] === U_)) break;
        push(6, 0, 'Bu köşe tamam. Sıradaki köşeyi sağ öne getirmek için sadece üstü çevir. Alt katmana dokunma; bozuk görünmesi normal.', alg('U', 0));
      }
      push(6, 0, 'Son dokunuş: üstü çevir, bütün renkler yerine oturur.', mk(uTurnsTo(solved), 0));
    }
    return { steps, ok: solved(s), fc: [0, 1, 2, 3, 4, 5].map(f => raw[fIdx(NORM[f], f)]) };
  }
  function stageOf(raw) { const s = relabel(raw); for (let i = 0; i < GOALS.length; i++) if (!GOALS[i](s)) return i; return 7; }
  return { FL, IDX, key, faceOfN, apply, applyAll, plan, stageOf, label, relabel, solvedState: () => Int8Array.from(FL, x => x.f), GOALS };
})();
/*SOLVER-END*/
if (typeof module !== 'undefined') module.exports = Solver;
