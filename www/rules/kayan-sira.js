// M6 · Kayan sıra (slide): raylı sıranın karoları dönmez; sıraya dokununca bütün sıra bir kare sağa kayar. Ayrıntı: docs/kurallar/kayan-sira.md
(window.RAY_RULES = window.RAY_RULES || []).push(api => {
  const T0 = new Map(), calm = matchMedia('(prefers-reduced-motion: reduce)');   // sıra → kayma başlangıcı
  // sağa bir kare: her karo bir sağa, en sağdaki başa (yönler değişmez)
  const shift = cells => c => { const v = cells.map(q => c[q]); cells.forEach((q, p) => { c[q] = v[(p + cells.length - 1) % cells.length]; }); };
  return {
    key: 'slide', line: 5, ord: 22, boost: 1,
    clash: ['closed', 'river', 'zone', 'depot'],   // konuma bağlı sayım/kıyı kurallarıyla aynı bölümde gelmez
    card: { name: L('Kayan sıra', 'Sliding row'), tag: L('Yeni: kayan sıra', 'New: sliding row'),
      demo: '<div class="rd-slide" aria-hidden="true"><div><i></i><i></i><i></i></div><b>›</b></div>',
      text: L('Raylı sıranın karoları <b>dönmez</b>: sıraya dokununca bütün sıra <b>bir kare sağa kayar</b>, en sağdaki karo başa geçer.',
        'Tiles in a railed row <b>don’t turn</b>: tap the row and the whole row <b>slides one step right</b>; the last tile wraps to the front.') },
    css: `.rd-slide,.rd-slide *{position:absolute;box-sizing:border-box}.rd-slide{position:relative;align-self:center;width:170px;height:56px;margin:6px 0 2px}
.rd-slide div{left:4px;top:4px;width:150px;height:48px;border-radius:14px;box-shadow:inset 0 0 0 2px var(--mut);overflow:hidden}
.rd-slide i{top:3px;left:3px;width:42px;height:42px;border-radius:11px;background:var(--tile);box-shadow:inset 0 0 0 1px var(--stroke);animation:slideR 3s cubic-bezier(.3,1.3,.5,1) infinite}
.rd-slide i+i{left:51px;background:linear-gradient(var(--acc),var(--acc)) center/8px 100% no-repeat,var(--tile)}.rd-slide i+i+i{left:99px;background:linear-gradient(90deg,var(--acc),var(--acc)) center/100% 8px no-repeat,var(--tile)}
.rd-slide b{right:0;top:8px;font-size:30px;line-height:1;color:var(--acc)}
@keyframes slideR{0%,40%{transform:none}55%,100%{transform:translateX(48px)}}`,
    amount: (n, intro, z, fin, c) => c < 5 ? 0 : 1,
    // aday sıra: merkez, köprü, tünel ağzı, sabit, eşli ve başka birim yok; kaydırınca kendine hiç benzemez (tek doğru konum)
    shape(C) {
      const { cols: w, rows: h, sol, cur, R } = C, cand = [];
      for (let r = 0; r < h; r++) {
        const cells = Array.from({ length: w }, (_, k) => r * w + k);
        if (!cells.every(q => !C.isHub(q) && !C.keep[q] && !C.busy[q] && !C.pinned[q] && C.link[q] < 0 && !C.br?.includes(q) && !C.mouth?.has?.(q))) continue;
        const f = shift(cells), c = sol.slice(), s0 = cells.map(q => sol[q]) + '';
        let ok = true; for (let t = 1; t < w && ok; t++) { f(c); ok = cells.map(q => c[q]) + '' !== s0; }
        if (ok) cand.push(cells);
      }
      if (!cand.length) return;
      const cells = cand[R() * cand.length | 0], f = shift(cells);
      cells.forEach(q => { cur[q] = sol[q]; });
      for (let t = 1 + (R() * (w - 1) | 0); t--;) f(cur);   // 1…w−1 kayma → oyuncu w − t dokunuşla hizalar
      C.unit(cells, w, f, 'slide');
      C.out.slide = cells;
    },
    reveal(G, on) { if (G.slide.some(q => G.seen[q])) G.slide.forEach(on); },
    onTap(G, U, i, now) { if (!calm.matches) T0.set(U.cells, now); api.tone(api.note(1), .1, .03, 'triangle'); },
    // 200 ms: karolar soldan bir kare kayarak gelir (yön dönmesi yok)
    xform(D) {
      const { X, s } = D; let busy = false;
      for (const [cells, t0] of T0) {
        const t = (D.now - t0) / 200;
        if (t >= 1) { T0.delete(cells); continue; }
        const dx = -(1 - api.ease(Math.max(0, t))) * s;
        for (const q of cells) X[q] = [X[q][0] + dx, X[q][1], X[q][2], X[q][3]];
        busy = true;
      }
      return busy;
    },
    // ray yatağı: sıranın arkasında iki ince ray + sağ uçta ok (renk dışında biçimle de belli)
    base(D) {
      const { cx, s, X, G, pal } = D, a = G.slide[0], b = G.slide[G.slide.length - 1];
      if (!D.vis(a) && !D.vis(b)) return;
      const [x0, y] = X[a], [x1] = X[b];
      cx.beginPath(); D.rrp(x0 - s / 2 + 1, y - s / 2 + 1, x1 - x0 + s - 2, s - 2, s * .26); cx.fillStyle = D.rgba(pal.fg, .05); cx.fill();
      cx.lineWidth = 2; cx.strokeStyle = pal.mut; cx.stroke();
      cx.beginPath(); for (const o of [-.44, .44]) { cx.moveTo(x0 - s * .45, y + s * o); cx.lineTo(x1 + s * .45, y + s * o); }
      cx.lineWidth = 1.5; cx.strokeStyle = D.rgba(pal.mut, .6); cx.stroke();
    },
    top(D) {
      const { cx, s, X, G } = D, b = G.slide[G.slide.length - 1];
      if (!D.vis(b)) return;
      const [x, y] = X[b], ax = x + s * .5, k = s * .1;
      cx.beginPath(); cx.moveTo(ax - k * .4, y - k); cx.lineTo(ax + k * .6, y); cx.lineTo(ax - k * .4, y + k);
      cx.lineWidth = Math.max(2, s * .045); cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.strokeStyle = D.col; cx.stroke();
    },
  };
});
