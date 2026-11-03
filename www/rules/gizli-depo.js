// M20 · Gizli depo (anahtar: depot) — kuralın tamamı bu dosyada. Sözleşme: docs/kurallar/README.md · tasarım: docs/kurallar/gizli-depo.md
// Tahta kenarındaki ayraç (3 karo): altındaki karolardan TAM BİRİ dışarı, depoya kol uzatır; hangisi olduğu gizli. Ayraç dışında kenar duvardır.
// Çekirdek: open() ayraç karolarının dışa bakan kolunu gevşek saymaz (lit + çözücü), check() her ayraçta tam bir çıkış ister, prune() çözücüde aynı sayımı yapar.
(window.RAY_RULES = window.RAY_RULES || []).push(api => {
  const { DIRS, popc } = api, bit = k => DIRS[k][0];
  // ayraç karoları ve dışa bakan yönleri: k (yön) → Set(hücre) · P.depot dizisine bağlı önbellek
  const SIDE = new WeakMap(), side = P => { let S = SIDE.get(P.depot); if (!S) { S = [0, 1, 2, 3].map(k => new Set(P.depot.filter(V => V.k === k).flatMap(V => V.cells))); SIDE.set(P.depot, S); } return S; };
  const count = (P, V, cur = P.cur) => { let c = 0; for (const i of V.cells) if (cur[i] & bit(V.k)) c++; return c; };
  const ICON = '<svg class="rd-depot-i" viewBox="0 0 20 20"><path d="M3 9 10 3l7 6v8H3z"/></svg>';
  return {
    key: 'depot', line: 19, ord: 13, tOrder: 30, boost: 3.5, clash: [],
    card: { name: L('Gizli depo', 'Hidden depot'), tag: L('Yeni: gizli depo', 'New: hidden depot'),
      demo: '<div class="rd-depot" aria-hidden="true"><i class="ft"><b></b></i><i class="ft rd-dm"><b></b><u></u></i><i class="ft"><b></b></i><i class="rd-db"></i><i class="rd-dh"></i></div>',
      text: L(`Kenardaki <b>ayraç</b>: altındaki üç karodan <b>tam biri</b> dışarı, depoya ${ICON} çıkar. Hangisi olduğu <b>gizli</b>; ayraç dışında kenar yine duvardır.`,
        `An edge <b>bracket</b>: <b>exactly one</b> of its three tiles runs out to the depot ${ICON}. Which one is <b>hidden</b>; elsewhere the edge is still a wall.`) },
    // demo: ortadaki karo döner, kolu aşağı (ayraca) bakar, ray yanar ve depo dolar. Hareketi azalt: son hâl (dolu depo) durur.
    css: `.rd-depot{position:relative;align-self:center;display:grid;grid-template-columns:repeat(3,52px);gap:4px;padding-bottom:34px;margin:6px 0 2px}
.rd-depot .ft{width:52px;height:52px;border-radius:15px}.rd-depot .ft b{top:19px;height:14px}
.rd-dm{animation:rd-dm 4s ease-in-out infinite}.rd-dm u{position:absolute;left:19px;top:26px;width:14px;height:30px;border-radius:8px;background:var(--rail)}
.rd-dm b,.rd-dm u{animation:rd-dl 4s infinite}
.rd-db{position:absolute;left:8px;right:8px;bottom:22px;height:8px;border:3px solid var(--mut);border-top:0;border-radius:0 0 3px 3px;animation:rd-dc 4s infinite}
.rd-dh{position:absolute;left:50%;bottom:0;width:22px;height:20px;margin-left:-11px;clip-path:polygon(50% 0,100% 45%,100% 100%,0 100%,0 45%);background:var(--mut);animation:rd-df 4s infinite}
.rd-depot-i{display:inline-block;width:1.05em;height:1.05em;vertical-align:-.16em;fill:none;stroke:var(--fg);stroke-width:2;stroke-linejoin:round}
@keyframes rd-dm{0%,25%{transform:rotate(-90deg)}38%,100%{transform:none}}
@keyframes rd-dl{0%,45%{background:var(--rail);box-shadow:none}52%,88%{background:var(--acc);box-shadow:0 0 10px var(--accGlow)}100%{background:var(--rail)}}
@keyframes rd-dc{0%,45%{border-color:var(--mut)}52%,88%{border-color:var(--acc)}100%{border-color:var(--mut)}}
@keyframes rd-df{0%,45%{background:var(--mut);transform:none}52%{transform:scale(1.18)}58%,88%{background:var(--acc);transform:none}100%{background:var(--mut)}}
@media (prefers-reduced-motion:reduce){.rd-dm,.rd-dm b,.rd-dm u,.rd-db,.rd-dh{animation:none}.rd-dm b,.rd-dm u{background:var(--acc)}.rd-db{border-color:var(--acc)}.rd-dh{background:var(--acc)}}`,
    // tanıtım (469, 6×8): 1 depo · hat finali 3 · sonra 2
    amount: (n, intro, z, fin) => intro ? 1 : fin ? 3 : 2,
    // ağaçtan sonra (halka ve tünelden sonra), karıştırmadan önce: kenar karosuna dışa bakan kol = ağaca tahta dışında bir yaprak.
    // Kenar silinmez → döngü ya da hat karışması olmaz; sol bir çözümdür ve yalnız döndürmeyle ulaşılır.
    tree(C) {
      const { n, cols, rows, R, sol } = C, dep = [], used = new Set(), mouth = i => C.mouth?.has?.(i);
      const cand = []; for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) if (!C.isHub(i) && C.nb(i, k) < 0 && popc(sol[i]) <= 2 && !C.keep[i] && !mouth(i)) cand.push(i * 4 + k);
      // kenar boyunca t. hücre (N/G kenarında sütun, D/B kenarında satır)
      const pos = (i, k) => k % 2 ? [i / cols | 0, rows] : [i % cols, cols], at = (i, k, t) => k % 2 ? t * cols + i % cols : (i / cols | 0) * cols + t;
      for (let c = 0; c < C.x.depot && cand.length;) {
        const e = cand.splice(R() * cand.length | 0, 1)[0], i = e >> 2, k = e & 3, [p, len] = pos(i, k);
        if (used.has(i) || [0, 1, 2, 3].some(q => { const j = C.nb(i, q); return j >= 0 && dep.some(V => V.e >> 2 === j); })) continue;
        // ayraç: i'yi içeren 3 ardışık kenar karosu; merkez ve tünel ağzı olmaz, başka ayraçla ortak karo yok, aynı kenarda bitişik değil
        const near = new Set(dep.filter(V => V.k === k).flatMap(V => V.cells.flatMap(j => { const [q] = pos(j, k); return [q - 1, q, q + 1].filter(t => t >= 0 && t < len).map(t => at(j, k, t)); })));
        const opts = [];
        for (let lo = Math.max(0, p - 2); lo <= Math.min(len - 3, p); lo++) {
          const cs = [0, 1, 2].map(t => at(i, k, lo + t));
          if (cs.every(j => !used.has(j) && !near.has(j) && !C.isHub(j) && !mouth(j))) opts.push(cs);
        }
        if (!opts.length) continue;
        const cells = opts[R() * opts.length | 0];
        sol[i] |= bit(k); dep.push({ e, k, cells, id: dep.length }); c++;
        // ayraç karoları sabit/eşli/tabla olmaz (sabit karo depoyu ele verir; tabla karoları kenar boyunca taşır)
        cells.forEach(j => { used.add(j); C.keep[j] = true; });
      }
      if (dep.length) C.out.depot = dep;
    },
    // adillik: oyuncunun gördüğüyle (depo yeri bilinmeden) bütün çözümler aynı depo yerlerini vermeli. Vermiyorsa:
    // yerleri ayrışan ayraç tek karoya daraltılır (depo görünür olur, bölüm her zaman adil) ve aday reddedilir (seçici gizli kalanı yeğler).
    mark(C) {
      const dep = C.out.depot; if (!dep) return;
      const P = { cols: C.cols, rows: C.rows, cur: C.cur, sol: C.sol, hub: C.hub, hub2: C.hub2, pinned: C.pinned, link: C.link, rev: C.rev, cnt: C.cnt,
        ...(C.units.length ? { units: C.units, unitOf: C.unitOf } : {}), ...(C.adj ? { adj: C.adj, ao: C.ao } : {}), ...C.out };
      const CAP = 3000;
      for (let t = 0; t < dep.length; t++) {
        P.depot = dep.slice();   // yeni dizi → SIDE önbelleği tazelenir
        const keys = new Map();
        const sc = api.difficulty(P, cfg => {
          if (!api.lit({ ...P, cur: cfg }).solved) return false;
          keys.set(dep.map(V => V.cells.find(i => cfg[i] & bit(V.k))).join(), cfg); return keys.size > 1;
        }, CAP);
        if (keys.size === 1 && sc < 3 * CAP) break;
        // belirsiz (ya da arama tavana vurdu): çözümler arasında yeri ayrışan ilk ayraç (yoksa ilk geniş ayraç) daralır
        const K = [...keys.keys()].map(s => s.split(','));
        const V = dep.find((W, j) => W.cells.length > 1 && K.some(a => a[j] !== K[0][j])) || dep.find(W => W.cells.length > 1);
        if (!V) break;
        V.cells = [V.e >> 2]; C.out.reject = true;
      }
      C.out.depot = dep.slice();
    },
    // ayraç karosunun dışa bakan kolu eşsiz bitebilir (yalnız tahta kenarı: iç kenarda hiç doğru dönmez → simetri kendiliğinden)
    open(P, i, k) { return side(P)[k].has(i) && api.nb(P, i, k) < 0; },
    // her ayraçta tam bir çıkış. L.dpN: ayraç başına çıkış sayısı (çizim ve geri bildirim)
    check(P, L) { let bad = 0; L.dpN = P.depot.map(V => { const c = count(P, V); if (c !== 1) bad++; return c; }); return bad; },
    // çözücü: her ayraçta "kesin çıkış ≤ 1 ≤ olası çıkış". Kesin çıkış varsa öbürlerinin dışa kolu elenir; tek olası kalırsa o çıkış olur.
    prune(P, C, M, unit) {
      const hit = [];
      const keep = (i, f) => { const u = unit[i], a = C[u].filter(r => f(M[i][r])); if (a.length < C[u].length) { C[u] = a; hit.push(u); } return a.length; };
      for (const V of P.depot) {
        const b = bit(V.k); let must = -1, may = -1, nMust = 0, nMay = 0;
        for (const i of V.cells) {
          const c = C[unit[i]], e = c.filter(r => M[i][r] & b).length;
          if (e) { nMay++; may = i; if (e === c.length) { nMust++; must = i; } }
        }
        if (nMust > 1 || !nMay) return -1;
        if (nMust === 1) { for (const i of V.cells) if (i !== must && !keep(i, m => !(m & b))) return -1; }
        else if (nMay === 1 && !keep(may, m => m & b)) return -1;
      }
      return hit;
    },
    pad(G, p) { for (const V of G.depot) { const s = 'trbl'[V.k]; p[s] = Math.max(p[s], .46); } },
    // önceki hâl: after() geçişleri buna göre bulur
    block(G) { G.dpWas = (G.L.dpN || []).slice(); G.dpFull0 = G.depot.map(V => full(G, V)); },
    after(G, i) {
      const N = G.L.dpN || [];
      if (!api.save.depotTold && G.depot.some(V => V.cells.includes(i))) { api.save.depotTold = 1; api.persist(); api.toast(L('Depo · ayraçtaki karolardan yalnız biri dışarı çıkar', 'Depot · only one tile at the bracket runs out')); }
      G.depot.forEach((V, j) => {
        if (N[j] > 1 && !(G.dpWas?.[j] > 1)) {   // iki çıkış: ayraç uyarı renginde kesik çizgi + bölümde bir kez bildirim
          api.haptic('light');
          if (!G.dpWarn) { G.dpWarn = 1; api.toast(L('Bir ayraçtan yalnız bir ray çıkar', 'Only one track can leave a bracket')); }
        } else if (full(G, V) && !G.dpFull0?.[j] && !G.L.solved) {
          api.tone(api.note(7), .26, .03, 'sine'); api.tone(api.note(11), .3, .025, 'sine', .08);
        }
      });
      api.kick();
    },
    // tahta dışında: ince köşeli ayraç (⌐ ¬) + ortada depo (çatılı ev). Tünel ağzının yuvarlak sekmesi ve harfinden biçimce ayrı.
    // Boş: ayraç ve depo çizgi (pal.mut). Dolu (tam bir çıkış, karo yanıyor): çıkış rayı, ayraç ve depo hat renginde, depo içi dolu.
    // İki çıkış (oyuncu dokunduktan sonra): ayraç uyarı renginde kesik. Ayraç sayısı ≤ 3 → kare başına birkaç çağrı, animasyon yok.
    top(D) {
      const { G, s, X, own, OC, cx, pal, on, vis } = D, N = G.L.dpN || [], v0 = s * .57;
      for (const V of G.depot) {
        const j = V.id, [, dx, dy] = DIRS[V.k], tx = Math.abs(dy), ty = Math.abs(dx);
        // kenar boyunca sıralı ilk/son karo merkezi; P(u, v) = karo merkezi + u·teğet + v·dışa
        const cs = V.cells.slice().sort((a, b) => (X[a][0] - X[b][0]) * tx + (X[a][1] - X[b][1]) * ty), A = X[cs[0]], B = X[cs[cs.length - 1]];
        const mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], P = (o, u, v) => [o[0] + u * tx + v * dx, o[1] + u * ty + v * dy];
        const ex = V.cells.find(i => G.cur[i] & bit(V.k)), ok = N[j] === 1 && ex !== undefined && on(ex), bad = N[j] > 1 && G.moves > 0;   // uyarı ilk dokunuştan sonra (sakin açılış)
        const c = ok ? OC[own(ex)] : bad ? G.warn : pal.mut;
        // çıkış rayları: karo kenarından ayraca
        for (const i of V.cells) if (G.cur[i] & bit(V.k) && vis(i)) {
          const [a, b] = [P(X[i], 0, s * .5), P(X[i], 0, v0)];
          cx.beginPath(); cx.moveTo(a[0], a[1]); cx.lineTo(b[0], b[1]); cx.lineWidth = s * .17; cx.strokeStyle = on(i) && !bad ? OC[own(i)] : pal.rail; cx.stroke();
        }
        // ayraç
        const m = s * .5 - s * .1, h = s * .1, p = [P(A, -m, v0 - h), P(A, -m, v0), P(B, m, v0), P(B, m, v0 - h)];
        cx.beginPath(); cx.moveTo(p[0][0], p[0][1]); for (const q of p.slice(1)) cx.lineTo(q[0], q[1]);
        if (bad) cx.setLineDash([s * .09, s * .07]);
        cx.lineWidth = s * (ok || bad ? .07 : .05); cx.lineJoin = 'round'; cx.strokeStyle = c; cx.stroke(); cx.setLineDash([]); cx.lineJoin = 'miter';
        // depo: gövde + dışa bakan çatı (beşgen)
        const w = s * .18, b0 = v0 + s * .04, b1 = b0 + s * .17, r1 = b1 + s * .15;
        const H = [P(mid, -w, b0), P(mid, w, b0), P(mid, w, b1), P(mid, 0, r1), P(mid, -w, b1)];
        cx.beginPath(); cx.moveTo(H[0][0], H[0][1]); for (const q of H.slice(1)) cx.lineTo(q[0], q[1]); cx.closePath();
        cx.fillStyle = ok ? c : pal.bg; cx.fill(); cx.lineWidth = s * .045; cx.strokeStyle = c; cx.stroke();
      }
    },
  };
  function full(G, V) { const ex = V.cells.filter(i => G.cur[i] & bit(V.k)); return ex.length === 1 && G.L.d[ex[0]] >= 0; }
});
