// M21 · Sarmal tahta (wrap): tahtanın sağ kenarı sola, üst kenarı alta bağlıdır (torus). Kenardan başlama taktiği çöker.
// Tünel ağzının C.adj/C.ao altyapısı: her kenar hücresinin dışa bakan yönü karşı kenardaki hücreye bağlanır; çekirdek nb/ob ile okur
// (ağaç, lit, zorluk çözücüsü, tabela/halka ağacı). Ayrıntı ve kanıt: docs/kurallar/sarmal-tahta.md
(window.RAY_RULES = window.RAY_RULES || []).push(api => {
  const { DIRS } = api;
  // i karosunun k yönü kenardan taşıyor mu (sarmal geçiş)
  const seam = (G, i, k) => { const x = i % G.cols + DIRS[k][1], y = (i / G.cols | 0) + DIRS[k][2]; return x < 0 || y < 0 || x >= G.cols || y >= G.rows; };
  const EDGE = new WeakMap(), edges = G => {   // [hücre, yön] geçişleri (P.adj'e bağlı önbellek)
    let E = EDGE.get(G.adj); if (!E) { E = []; for (let i = 0; i < G.cur.length; i++) for (let k = 0; k < 4; k++) if (seam(G, i, k)) E.push([i, k]); EDGE.set(G.adj, E); }
    return E;
  };
  return {
    key: 'wrap', line: 20, ord: 7, boost: 3.5,
    clash: ['portal', 'depot', 'river', 'zone'],   // kenar geçidi/kenar çıkışı ve kıyı/bölge sayımı sınır ister
    card: { name: L('Sarmal tahta', 'Wrap-around board'), tag: L('Yeni: sarmal tahta', 'New: wrap-around board'),
      demo: '<div class="rd-wrap" aria-hidden="true"><u class="l"></u><i class="ft on"><b></b></i><i class="ft on"><b></b></i><i class="ft on"><b></b></i><u class="r"></u><em></em></div>',
      text: L('Tahtanın <b>kenarı yok</b>: sağdan çıkan ray <b>soldan</b>, üstten çıkan <b>alttan</b> girer. Kenardaki oklar geçişi gösterir; köşeye güvenme!',
        'The board has <b>no edges</b>: track leaving the right comes back on the <b>left</b>, off the top it returns at the <b>bottom</b>. Edge arrows mark the crossings; corners won’t save you!') },
    css: `.rd-wrap{position:relative;align-self:center;display:flex;align-items:center;gap:4px;margin:6px 0 2px;padding:0 14px}.rd-wrap .ft{width:56px;height:56px}.rd-wrap .ft b{top:21px}
.rd-wrap u{position:absolute;top:2px;bottom:2px;width:10px;border:2px dashed var(--mut);border-width:0 2px}.rd-wrap u.l{left:0;border-left:0}.rd-wrap u.r{right:0;border-right:0}
.rd-wrap u:after{content:"";position:absolute;top:50%;width:7px;height:7px;margin-top:-5px;border:solid var(--acc);border-width:2.5px 2.5px 0 0}
.rd-wrap u.l:after{left:-1px;transform:rotate(-135deg)}.rd-wrap u.r:after{right:-1px;transform:rotate(45deg)}
.rd-wrap em{position:absolute;left:0;top:50%;width:12px;height:12px;margin-top:-6px;border-radius:50%;background:#fff;box-shadow:0 0 10px #fff;animation:rdwp 2.6s linear infinite}
@keyframes rdwp{0%{transform:translateX(70px)}50%{transform:translateX(198px);opacity:1}51%,52%{opacity:0}52%{transform:translateX(-2px)}53%{opacity:1}100%{transform:translateX(70px)}}
@media (prefers-reduced-motion:reduce){.rd-wrap em{display:none}}`,
    amount: () => 1,
    // ağaçtan önce (ord 7: köprü vb. pre aşamaları sarmal komşuluğu görür): kenarlar karşı kenara bağlanır, R() tüketilmez
    pre(C) {
      const { cols, rows, n } = C, adj = new Int16Array(n * 4), ao = new Uint8Array(n * 4);
      for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) {
        const x = (i % cols + DIRS[k][1] + cols) % cols, y = ((i / cols | 0) + DIRS[k][2] + rows) % rows;
        adj[i * 4 + k] = y * cols + x; ao[i * 4 + k] = DIRS[k][3];
      }
      C.adj = adj; C.ao = ao; C.out.wrap = { cols, rows };
    },
    // karanlık tünel: kenardan taşan yanan kol, karşı kenardaki karoyu ve çevresini de aydınlatır
    reveal(G, on, area) { for (const [i, k] of edges(G)) if (G.L.d[i] >= 0 && (G.cur[i] & DIRS[k][0])) { const j = G.adj[i * 4 + k]; on(j); area(j); } },
    pad(G, p) { for (const s of 'trbl') p[s] = Math.max(p[s], .26); },
    // kenarda: kesik dikiş çizgisi + her taşan kolun dışarıdaki yarım rayı ve ucunda ok (bağlıysa hat renginde)
    top(D) {
      const { G, s, X, cx, pal, own, OC } = D, n = G.cur.length, a = X[0], z = X[n - 1];
      const L0 = a[0] - s / 2, T0 = a[1] - s / 2, R0 = z[0] + s / 2, B0 = z[1] + s / 2, g = s * .07;
      cx.save(); cx.setLineDash([s * .12, s * .1]); cx.lineWidth = Math.max(1.2, s * .025); cx.strokeStyle = D.rgba(pal.mut, .7);
      cx.beginPath(); cx.moveTo(L0 - g, T0); cx.lineTo(L0 - g, B0); cx.moveTo(R0 + g, T0); cx.lineTo(R0 + g, B0); cx.moveTo(L0, T0 - g); cx.lineTo(R0, T0 - g); cx.moveTo(L0, B0 + g); cx.lineTo(R0, B0 + g); cx.stroke();
      cx.restore();
      const stubs = new Map();   // renk → [x, y, dx, dy]
      for (const [i, k] of edges(G)) {
        if (!(G.cur[i] & DIRS[k][0]) || !D.vis(i)) continue;
        const j = G.adj[i * 4 + k], ok = D.on(i) && D.on(j) && (G.cur[j] & G.ao[i * 4 + k]), c = ok ? OC[own(i)] || D.col : pal.rail, [x, y] = X[i], [, dx, dy] = DIRS[k];
        (stubs.get(c) || stubs.set(c, []).get(c)).push([x + dx * s / 2, y + dy * s / 2, dx, dy]);
      }
      cx.lineCap = 'round'; cx.lineJoin = 'round';
      for (const [c, S] of stubs) {
        cx.beginPath(); for (const [x, y, dx, dy] of S) { cx.moveTo(x, y); cx.lineTo(x + dx * s * .13, y + dy * s * .13); }
        cx.lineWidth = s * .13; cx.strokeStyle = c; cx.stroke();
        cx.beginPath();
        for (const [x, y, dx, dy] of S) { const tx = x + dx * s * .23, ty = y + dy * s * .23, k = s * .07; cx.moveTo(tx - dx * k - dy * k, ty - dy * k - dx * k); cx.lineTo(tx, ty); cx.lineTo(tx - dx * k + dy * k, ty - dy * k + dx * k); }
        cx.lineWidth = Math.max(1.8, s * .04); cx.stroke();
      }
    },
  };
});
