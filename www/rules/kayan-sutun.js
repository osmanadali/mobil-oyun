// M26 · Kayan sütun (column): raylı sütunun karoları dönmez; sütuna dokununca bütün sütun bir kare aşağı kayar, en alttaki başa geçer.
// Kayan sıranın (M5, slide) dikey karşılığı. Ayrıntı: docs/kurallar/kayan-sutun.md
(window.RAY_RULES = window.RAY_RULES || []).push(api => {
  const T0 = new Map(), calm = matchMedia('(prefers-reduced-motion: reduce)');   // sütun → kayma başlangıcı
  // aşağı bir kare: her karo bir alta, en alttaki başa (yönler değişmez)
  const shift = cells => c => { const v = cells.map(q => c[q]); cells.forEach((q, p) => { c[q] = v[(p + cells.length - 1) % cells.length]; }); };
  return {
    key: 'column', line: 25, ord: 24, boost: 9, scan: 48,
    // kayan sıra: kesişen karo iki birime giremez, sıra × sütun birlikte çok zor (docs/BOLUM_TASARIMI.md §5) · konuma bağlı sayım/kıyı kuralları kayan sıradaki gibi
    clash: ['slide', 'closed', 'river', 'zone', 'depot'],
    card: { name: L('Kayan sütun', 'Sliding column'), tag: L('Yeni: kayan sütun', 'New: sliding column'),
      demo: '<div class="rd-column" aria-hidden="true"><div><i></i><i></i><i></i></div><b>›</b></div>',
      text: L('Raylı sütunun karoları <b>dönmez</b>: sütuna dokununca bütün sütun <b>bir kare aşağı kayar</b>, en alttaki karo başa geçer.',
        'Tiles in a railed column <b>don’t turn</b>: tap the column and the whole column <b>slides one step down</b>; the bottom tile wraps to the top.') },
    css: `.rd-column,.rd-column *{position:absolute;box-sizing:border-box}.rd-column{position:relative;align-self:center;width:56px;height:174px;margin:6px 0 2px}
.rd-column div{left:4px;top:4px;width:48px;height:150px;border-radius:14px;box-shadow:inset 0 0 0 2px var(--mut);overflow:hidden}
.rd-column i{left:3px;top:3px;width:42px;height:42px;border-radius:11px;background:var(--tile);box-shadow:inset 0 0 0 1px var(--stroke);animation:slideD 3s cubic-bezier(.3,1.3,.5,1) infinite}
.rd-column i+i{top:51px;background:linear-gradient(var(--acc),var(--acc)) center/8px 100% no-repeat,var(--tile)}.rd-column i+i+i{top:99px;background:linear-gradient(90deg,var(--acc),var(--acc)) center/100% 8px no-repeat,var(--tile)}
.rd-column b{left:14px;bottom:-6px;font-size:30px;line-height:1;color:var(--acc);transform:rotate(90deg)}
@keyframes slideD{0%,40%{transform:none}55%,100%{transform:translateY(48px)}}
@media (prefers-reduced-motion:reduce){.rd-column i{animation:none}}`,
    amount: (n, intro, z, fin, c) => c < 5 ? 0 : 1,
    // aday sütun: merkez, köprü, tünel ağzı, sabit, eşli ve başka birim yok; kaydırınca kendine hiç benzemez (tek doğru konum)
    shape(C) {
      const { cols: w, rows: h, sol, cur, R } = C, cand = [];
      for (let x = 0; x < w; x++) {
        const cells = Array.from({ length: h }, (_, k) => k * w + x);
        if (!cells.every(q => !C.isHub(q) && !C.keep[q] && !C.busy[q] && !C.pinned[q] && C.link[q] < 0 && !C.br?.includes(q) && !C.mouth?.has?.(q))) continue;
        const f = shift(cells), c = sol.slice(), s0 = cells.map(q => sol[q]) + '';
        let ok = true; for (let t = 1; t < h && ok; t++) { f(c); ok = cells.map(q => c[q]) + '' !== s0; }
        if (ok) cand.push(cells);
      }
      if (!cand.length) return;
      const cells = cand[R() * cand.length | 0], f = shift(cells);
      cells.forEach(q => { cur[q] = sol[q]; });
      for (let t = 1 + (R() * (h - 1) | 0); t--;) f(cur);   // 1…h−1 kayma → oyuncu h − t dokunuşla hizalar
      C.unit(cells, h, f, 'column');
      C.out.column = cells;
    },
    reveal(G, on) { if (G.column.some(q => G.seen[q])) G.column.forEach(on); },
    onTap(G, U, i, now) { if (!calm.matches) T0.set(U.cells, now); api.tone(api.note(1), .1, .03, 'triangle'); },
    // 200 ms: karolar yukarıdan bir kare kayarak gelir (yön dönmesi yok)
    xform(D) {
      const { X, s } = D; let busy = false;
      for (const [cells, t0] of T0) {
        const t = (D.now - t0) / 200;
        if (t >= 1) { T0.delete(cells); continue; }
        const dy = -(1 - api.ease(Math.max(0, t))) * s;
        for (const q of cells) X[q] = [X[q][0], X[q][1] + dy, X[q][2], X[q][3]];
        busy = true;
      }
      return busy;
    },
    // ray yatağı: sütunun arkasında iki ince ray + alt uçta ok (renk dışında biçimle de belli)
    base(D) {
      const { cx, s, X, G, pal } = D, a = G.column[0], b = G.column[G.column.length - 1];
      if (!D.vis(a) && !D.vis(b)) return;
      const [x, y0] = X[a], [, y1] = X[b];
      cx.beginPath(); D.rrp(x - s / 2 + 1, y0 - s / 2 + 1, s - 2, y1 - y0 + s - 2, s * .26); cx.fillStyle = D.rgba(pal.fg, .05); cx.fill();
      cx.lineWidth = 2; cx.strokeStyle = pal.mut; cx.stroke();
      cx.beginPath(); for (const o of [-.44, .44]) { cx.moveTo(x + s * o, y0 - s * .45); cx.lineTo(x + s * o, y1 + s * .45); }
      cx.lineWidth = 1.5; cx.strokeStyle = D.rgba(pal.mut, .6); cx.stroke();
    },
    top(D) {
      const { cx, s, X, G } = D, b = G.column[G.column.length - 1];
      if (!D.vis(b)) return;
      const [x, y] = X[b], ay = y + s * .5, k = s * .1;
      cx.beginPath(); cx.moveTo(x - k, ay - k * .4); cx.lineTo(x, ay + k * .6); cx.lineTo(x + k, ay - k * .4);
      cx.lineWidth = Math.max(2, s * .045); cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.strokeStyle = D.col; cx.stroke();
    },
  };
});
