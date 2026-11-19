// M31 · Boş peron (yard): tahtanın kenarındaki 3×3 peronun bir hücresi boş. Peron karoları dönmez; boşluğa bitişik karoya dokununca
// o karo boşluğa kayar (15 bulmacası gibi), yönü değişmez. Her kaydırma 1 hamle.
// Çözümde boş hücre gerçekten boştur (maske 0): ağaç kurulduktan sonra peronun bir yaprak durağı çıkarılır (tree). Başlangıç çözümden
// geriye geçerli kaydırmalarla karıştırılır (shape) → çözüm her zaman ulaşılabilir. Durum yalnız maskede (boşluk = peronda maskesi 0 olan hücre):
// geri al, kayıt ve çözücü ek bilgi istemez. Ayrıntı ve kanıt: docs/kurallar/bos-peron.md
(window.RAY_RULES = window.RAY_RULES || []).push(api => {
  const { popc } = api, PW = 3, PH = 3;
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const MSG = {
    tip: L('🅿️ Boş peron · boşluğa bitişik karo boşluğa kayar, dönmez', '🅿️ Empty platform · a tile next to the gap slides into it and doesn’t turn'),
    no: L('Peron karoları dönmez · yalnız boşluğa bitişik karo kayar', 'Platform tiles don’t turn · only a tile next to the gap slides'),
  };
  // peron durumu: hücre sırasıyla maskelerin onaltılık dizgisi; boşluk '0' (peronda tek)
  const key = (Y, c) => { let s = ''; for (const q of Y.cells) s += c[q].toString(16); return s; };
  const swap = (s, a, b) => { const t = s.split(''); t[a] = s[b]; t[b] = s[a]; return t.join(''); };
  // en kısa kaydırma dizisi (iki yönlü BFS, katman katman; aynı katmandaki buluşmaların en kısası → tam en kısa yol).
  // Dönüş: dokunulacak peron konumları (0…8) ya da null. Peron 3×3: durum uzayı ≤ 9!/2, yol ≤ 31.
  function route(Y, a, b) {
    if (a === b) return [];
    const A = new Map([[a, null]]), B = new Map([[b, null]]), dA = new Map([[a, 0]]), dB = new Map([[b, 0]]);
    let fa = [a], fb = [b];
    while (fa.length && fb.length) {
      const fwd = fa.length <= fb.length, F = fwd ? A : B, O = fwd ? B : A, dF = fwd ? dA : dB, dO = fwd ? dB : dA, nx = [];
      let best = null, bl = 1e9;
      for (const s of fwd ? fa : fb) {
        const p = s.indexOf('0'), d = dF.get(s) + 1;
        for (const q of Y.adj[p]) {
          const t = swap(s, p, q); if (F.has(t)) continue;
          F.set(t, [s, fwd ? q : p]); dF.set(t, d); nx.push(t);   // ileri: s'de q'ya dokun → t · geri: t'de p'ye dokun → s
          if (O.has(t) && d + dO.get(t) < bl) { bl = d + dO.get(t); best = t; }
        }
      }
      if (best) {
        const out = []; for (let s = best; A.get(s); s = A.get(s)[0]) out.push(A.get(s)[1]); out.reverse();
        for (let s = best; B.get(s); s = B.get(s)[0]) out.push(B.get(s)[1]);
        return out;
      }
      if (fwd) fa = nx; else fb = nx;
    }
    return null;
  }
  const goalOf = Y => Y.goal;
  // dokunuş: q hücresindeki karo bitişik boşluğa kayar (boşluk bitişik değilse bir şey olmaz). LAST: son kaydırma (canlandırma için)
  const LAST = new WeakMap();
  const slide = (Y, p) => c => {
    const q = Y.cells[p], b = Y.adj[p].find(r => !c[Y.cells[r]]); if (b == null) return;
    const h = Y.cells[b]; c[h] = c[q]; c[q] = 0; LAST.set(c, [q, h]);
  };
  const posOf = (Y, i) => Y.cells.indexOf(i);
  const hole = (G) => G.yard.cells.find(q => !G.cur[q]);
  const T0 = new Map();   // varış hücresi → [çıkış hücresi, başlangıç zamanı]
  // kart demosu: 2×2 peron, sağ üstteki karo soldaki boşluğa kayar ve geri gelir
  const demo = '<div class="rd-yard" aria-hidden="true"><u></u><s></s><s class="b"></s><i class="m"></i><i class="c"></i><i class="d"></i><em></em></div>';
  return {
    key: 'yard', line: 30, ord: 30, tOrder: 30, boost: 13,
    // karoların yerini değiştiren kurallar (kayan sıra/sütun, döner tabla, sarmal tahta) ve konuma bağlı sayım/kıyı kuralları peronla
    // aynı tahtada karışır; kapalı durak da yaprağı boşaltır (P.void) · son sefer ve bakım karosu hamle sayısına bağlı (kaydırma = hamle)
    clash: ['slide', 'column', 'table', 'wrap', 'closed', 'river', 'zone', 'depot', 'last', 'gear'],
    card: { name: L('Boş peron', 'Empty platform'), tag: L('Yeni: boş peron', 'New: empty platform'), demo,
      text: L('Çerçeveli <b>peronda</b> bir yer <b>boş</b>. Peron karoları <b>dönmez</b>: boşluğa bitişik karoya dokun, karo <b>boşluğa kayar</b>. Her kaydırma <b>1 hamle</b>.',
        'One spot on the framed <b>platform</b> is <b>empty</b>. Platform tiles <b>don’t turn</b>: tap a tile next to the gap and it <b>slides into the gap</b>. Each slide is <b>1 move</b>.') },
    css: `.rd-yard,.rd-yard *{position:absolute;box-sizing:border-box}.rd-yard{position:relative;align-self:center;width:112px;height:112px;margin:6px 0 2px}
.rd-yard u{inset:0;border-radius:18px;background:rgba(127,127,127,.08);box-shadow:inset 0 0 0 2px var(--mut);outline:2px dashed var(--mut);outline-offset:3px}
.rd-yard s{left:8px;top:8px;width:46px;height:46px;border-radius:12px;border:2px dashed var(--mut);opacity:.7;background:repeating-linear-gradient(45deg,transparent 0 6px,var(--mut) 6px 7.5px)}.rd-yard s.b{left:58px}
.rd-yard i{left:58px;top:8px;width:46px;height:46px;border-radius:12px;background:linear-gradient(var(--tile),var(--tile)) var(--bg0);box-shadow:inset 0 0 0 1px var(--stroke)}
.rd-yard .m{background:linear-gradient(90deg,var(--acc),var(--acc)) 0 19px/100% 8px no-repeat,linear-gradient(var(--tile),var(--tile)) var(--bg0);animation:rdyS 4s cubic-bezier(.3,1.1,.5,1) infinite}
.rd-yard .c{left:8px;top:58px;background:linear-gradient(var(--acc),var(--acc)) 19px 0/8px 27px no-repeat,linear-gradient(90deg,var(--acc),var(--acc)) 19px 19px/27px 8px no-repeat,linear-gradient(var(--tile),var(--tile)) var(--bg0)}
.rd-yard .d{top:58px;background:linear-gradient(90deg,var(--acc),var(--acc)) 0 19px/27px 8px no-repeat,linear-gradient(var(--tile),var(--tile)) var(--bg0)}
.rd-yard em{left:65px;top:15px;width:32px;height:32px;border-radius:50%;border:2.5px solid var(--fg);opacity:0;animation:rdyT 4s ease-out infinite}
@keyframes rdyS{0%,30%{transform:none}45%,80%{transform:translateX(-50px)}95%,100%{transform:none}}
@keyframes rdyT{0%,22%{opacity:0;transform:scale(1.3)}28%{opacity:.8;transform:scale(1)}38%,100%{opacity:0;transform:scale(.8)}}
@media (prefers-reduced-motion:reduce){.rd-yard .m,.rd-yard em{animation:none}}`,
    // miktar = başlangıcın çözüme en kısa kaydırma uzaklığı: tanıtımda 4, 6×8 → 7, 7×9 → 9; hat finalinde +2
    amount: (n, intro, z, fin, c, r) => c < 5 || r < 5 ? 0 : intro ? 4 : (n >= 63 ? 9 : 7) + (fin ? 2 : 0),
    // ağaçtan sonra (en son): kenara değen, merkez/köprü/tünel ağzı/halka içermeyen 3×3 blok ve içinde bir yaprak durak seçilir;
    // yaprak çıkarılır (ebeveynin o kolu silinir; ebeveyn en az 2 kollu → bağlı kalır, hiçbir hat bölünmez) → çözümde gerçek boşluk.
    // R() yalnız peronlu bölümde tüketilir → eski bölümler aynı.
    tree(C) {
      const { cols: w, rows: h, sol, R } = C, ring = C.out.ring?.cyc || [], blocks = [];
      for (let y0 = 0; y0 + PH <= h; y0++) for (let x0 = 0; x0 + PW <= w; x0++) {
        if (x0 && y0 && x0 + PW < w && y0 + PH < h) continue;   // kenara değmeli
        const cells = []; for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) cells.push((y0 + y) * w + x0 + x);
        if (!cells.every(q => !C.isHub(q) && !C.keep[q] && !C.busy[q] && !ring.includes(q) && popc(sol[q]) >= 1)) continue;
        const leaves = [];
        for (const q of cells) {
          if (popc(sol[q]) !== 1) continue;
          const k = [0, 1, 2, 3].find(k => sol[q] & api.DIRS[k][0]), p = C.nb(q, k);
          if (p < 0 || C.keep[p] || C.br?.includes(p) || popc(sol[p]) < 2 || !(sol[p] & C.ob(q, k))) continue;
          leaves.push([q, p, C.ob(q, k)]);
        }
        if (leaves.length) blocks.push([cells, leaves]);
      }
      if (!blocks.length) return;
      const [cells, leaves] = blocks[R() * blocks.length | 0], [q, p, o] = leaves[R() * leaves.length | 0];
      sol[p] &= ~o; sol[q] = 0;
      cells.forEach(c => { C.keep[c] = C.busy[c] = true; });
      const adj = cells.map(a => cells.map((b, j) => Math.abs(a % w - b % w) + Math.abs((a / w | 0) - (b / w | 0)) === 1 ? j : -1).filter(j => j >= 0));
      C.yardY = { cells, adj };
    },
    // shape (en son): peron karoları çözüm yönünde, sonra geri alınabilir kaydırmalarla karıştırılır (geri dönüşsüz rastgele yürüyüş),
    // ta ki en kısa uzaklık hedefe varana dek. Her hücre tek karoluk birimdir; dokunuşu o karoyu boşluğa kaydırır.
    shape(C) {
      const Y = C.yardY; if (!Y) return;
      const { sol, cur, R, n } = C, want = C.x.yard;
      Y.cells.forEach(q => { cur[q] = sol[q]; });
      Y.goal = key(Y, sol);
      let s = Y.goal, back = -1, d = 0;
      for (let t = 0; t < want * 8; t++) {
        const p = s.indexOf('0'), opt = Y.adj[p].filter(r => r !== back), r = opt[R() * opt.length | 0];
        s = swap(s, p, r); back = p;
        if (t + 1 >= want && (d = route(Y, s, Y.goal).length) >= want) break;
      }
      Y.cells.forEach((q, k) => { cur[q] = parseInt(s[k], 16); });
      Y.d = d;
      Y.cells.forEach((q, k) => { const u = C.unit([q], 1, slide(Y, k), 'yard'); C.units[u].cost = k ? () => 0 : c => route(Y, key(Y, c), Y.goal).length; });
      const hl = new Array(n).fill(0); Y.cells.forEach(q => { hl[q] = 1; });
      C.out.yard = Y; C.out.hole = hl;
    },
    // ipucu ve robot: en kısa yolun ilk kaydırması / bütün kaydırmalar
    hint(G, now) {
      const Y = G.yard, r = route(Y, key(Y, G.cur), goalOf(Y)); if (!r?.length) return [];
      slide(Y, r[0])(G.cur); const m = LAST.get(G.cur); if (m && !calm.matches) T0.set(m[1], [m[0], now]);
      G.lastTile = null;   // sonraki dokunuş yeni hamle
      return [];
    },
    plan(G) {
      const Y = G.yard; if (G.won || !Y.cells.some(q => G.seen[q])) return [];
      return (route(Y, key(Y, G.cur), goalOf(Y)) || []).map(p => Y.cells[p]);
    },
    // boşluğun kendisi ve boşluğa bitişik olmayan peron karosu dokunuşu reddeder (hamle sayılmaz)
    block(G, i) {
      const Y = G.yard, p = posOf(Y, i); if (p < 0) return false;
      const b = posOf(Y, hole(G));
      return p === b || !Y.adj[p].includes(b) ? MSG.no : false;
    },
    onTap(G, U, i, now) {
      const m = LAST.get(G.cur); if (m && !calm.matches) T0.set(m[1], [m[0], now]);
      api.tone(api.note(2), .08, .02, 'triangle');
      const sv = api.save; if (!sv.yardTold) { sv.yardTold = 1; api.persist(); api.toast(MSG.tip); }
    },
    undo() { T0.clear(); },
    reveal(G, on) { if (G.yard.cells.some(q => G.seen[q])) G.yard.cells.forEach(on); },
    // çözücü: oyuncu peronun her hücresine peron karolarından herhangi birinin (ya da boşluğun) gelebileceğini düşünür (dönmeden).
    // Karoların sayısı prune ile tutulur (her karo bir kez). Kaydırmanın ulaşılabilirliği (parite) çözücüde yok sayılır.
    cands(P, i) {
      if (!P.hole[i]) return null;
      return [...new Set(P.yard.cells.map(q => P.cur[q]))].sort((a, b) => a - b);
    },
    prune(P, C, M, unit) {
      const cells = P.yard.cells, V = M[cells[0]], need = V.map(v => cells.filter(q => P.cur[q] === v).length), fx = V.map(() => 0), out = [];
      for (const q of cells) { const a = C[unit[q]]; if (a.length === 1) fx[a[0]]++; }
      for (let r = 0; r < V.length; r++) if (fx[r] > need[r]) return -1;
      for (const q of cells) {
        const u = unit[q], a = C[u]; if (a.length < 2) continue;
        const b = a.filter(r => fx[r] < need[r]); if (!b.length) return -1;
        if (b.length < a.length) { C[u] = b; out.push(u); }
      }
      for (let r = 0; r < V.length; r++) {
        const hs = cells.filter(q => C[unit[q]].includes(r)); if (hs.length < need[r]) return -1;
        if (hs.length === need[r]) for (const q of hs) { const u = unit[q]; if (C[u].length > 1) { C[u] = [r]; out.push(u); } }
      }
      return out;
    },
    // kayma: 170 ms, karo çıkış hücresinden varış hücresine yumuşak kayar (yön dönmesi yok). Boşluğun zemini çizilmez.
    xform(D) {
      const { X, G } = D; let busy = false;
      for (const q of G.yard.cells) { if (api.anim.delete(q)) X[q][2] = 0; if (!G.cur[q]) X[q][4] = true; }
      for (const [b, [a, t0]] of T0) {
        const t = (D.now - t0) / 170;
        if (t >= 1 || !G.cur[b]) { T0.delete(b); continue; }
        const e = 1 - api.ease(Math.max(0, t)), [x, y, r, sc, f] = X[b];
        X[b] = [x + (X[a][0] - x) * e, y + (X[a][1] - y) * e, r, sc, f];
        busy = true;
      }
      return busy;
    },
    // peron: hafif dolgu + düz kenar + dışta kesik çizgi (renkten bağımsız biçim) · boşluk: kesik kenarlı, çapraz taralı yuva
    base(D) {
      const { cx, s, X, G, pal } = D, Y = G.yard; if (!Y.cells.some(q => D.vis(q))) return;
      const ctr = i => [api.vg.ox + (i % G.cols + .5) * s, api.vg.oy + ((i / G.cols | 0) + .5) * s];   // ızgara konumu (kayan karodan bağımsız)
      const a = ctr(Y.cells[0]), z = ctr(Y.cells[Y.cells.length - 1]), g = s * .04;
      const x0 = a[0] - s / 2 + g, y0 = a[1] - s / 2 + g, w = z[0] - a[0] + s - 2 * g, h = z[1] - a[1] + s - 2 * g;
      cx.save();
      cx.beginPath(); D.rrp(x0, y0, w, h, s * .26); cx.fillStyle = D.rgba(pal.fg, .05); cx.fill(); cx.lineWidth = 2; cx.strokeStyle = pal.mut; cx.stroke();
      cx.beginPath(); D.rrp(x0 - s * .07, y0 - s * .07, w + s * .14, h + s * .14, s * .32); cx.setLineDash([s * .09, s * .07]); cx.lineWidth = Math.max(1.2, s * .03); cx.strokeStyle = D.rgba(pal.mut, .75); cx.stroke();
      const b = hole(G);
      if (b != null && D.vis(b)) {
        const [bx, by] = ctr(b), k = (s - 6) / 2;
        cx.beginPath(); D.rrp(bx - k, by - k, 2 * k, 2 * k, s * .24); cx.fillStyle = D.rgba(pal.bg, .55); cx.fill();
        cx.save(); cx.clip(); cx.beginPath();
        for (let t = -2 * k; t < 2 * k; t += s * .16) { cx.moveTo(bx - k + t, by + k); cx.lineTo(bx + k + t, by - k); }
        cx.setLineDash([]); cx.lineWidth = Math.max(1, s * .025); cx.strokeStyle = D.rgba(pal.mut, .45); cx.stroke(); cx.restore();
        cx.beginPath(); D.rrp(bx - k + 1, by - k + 1, 2 * k - 2, 2 * k - 2, s * .22); cx.setLineDash([s * .08, s * .06]); cx.lineWidth = Math.max(1.2, s * .03); cx.strokeStyle = pal.mut; cx.stroke();
      }
      cx.restore();
    },
  };
});
