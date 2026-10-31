// M22 · Kapalı durak (anahtar: closed) — kuralın tamamı bu dosyada. Sözleşme: docs/kurallar/README.md · tasarım: docs/kurallar/kapali-durak.md
// Bazı duraklar kapalıdır ama sıradan durak gibi görünür; merkezdeki ⊘ rozeti kaç tane olduğunu söyler. Kapalı durağa ray bağlanmaz.
// Kapalı karo çözüm ağacının bir yaprağıdır, kolu ebeveynden silinir (mark); lit onu P.void ile yok sayar. Çözücü her durağı "4 yön ya da kapalı" görür (cands), sayımı prune yapar.
(window.RAY_RULES = window.RAY_RULES || []).push(api => {
  // bildirimler (L burada küresel çeviri; after içinde L = G.L gölgeler)
  const MSG = { block: L('Kapalı durak · ray bağlama', `Closed station · don't connect it`), warn: L('Kapalı durağa ray bağlanmaz', `A closed station can't be connected`),
    told: k => L(`⊘ ${k} durak kapalı · ona ray bağlama`, k === 1 ? `⊘ 1 station is closed · don't connect it` : `⊘ ${k} stations are closed · don't connect them`) };
  const { DIRS, rot, popc, nb, ob } = api, TAU = Math.PI * 2;
  const orbit = m => { const o = []; for (let r = 0, v = m; r < 4; r++, v = rot(v)) if (!o.includes(v)) o.push(v); return o; };
  // oyuncunun gözünde kapalı olabilecek durak: tek kollu, merkez değil, sabit/eşli/birim değil (baştan gösterilen kapalı ayrıca elenir)
  const isSt = (P, i) => i !== P.hub && i !== P.hub2 && popc(P.cur[i]) === 1 && !P.pinned[i] && P.link[i] < 0 && !(P.unitOf?.[i] >= 0);
  const stIdx = new WeakMap(), stations = P => { let a = stIdx.get(P); if (!a) { a = []; for (let i = 0; i < P.cur.length; i++) if (isSt(P, i)) a.push(i); stIdx.set(P, a); } return a; };
  const hidden = P => P.closed - (P.closedShown ? P.closedShown.reduce((a, b) => a + b, 0) : 0);
  // ⊘: daire + çapraz çizgi (yol üzerine)
  const noPath = (cx, x, y, r) => { cx.moveTo(x + r, y); cx.arc(x, y, r, 0, TAU); const d = r * .7071; cx.moveTo(x - d, y + d); cx.lineTo(x + d, y - d); };
  // kapalı hücreye bakan yanan ray var mı (yakın kazanç uyarısı)
  const into = (G, L) => { for (let v = 0; v < G.cur.length; v++) if (G.void[v]) for (let k = 0; k < 4; k++) { const j = nb(G, v, k); if (j >= 0 && L.d[j] >= 0 && (G.cur[j] & ob(G, v, k))) return v; } return -1; };
  const ICON = '<svg class="rd-closed-i" viewBox="0 0 20 20"><circle cx="10" cy="10" r="7"/><path d="M5 15 15 5"/></svg>';
  return {
    key: 'closed', line: 21, ord: 15, boost: 3.5,
    clash: ['cover', 'faint', 'depot'],   // öteki gizli bilgi kuralları: cands kancası karo başına tek eklentiyi dinler, adillik denetimleri birbirini görmez
    // tanıtım ve 6×8: 1 kapalı durak · 7×9 hat finali: 2
    amount: (n, intro, z, fin) => fin && n >= 63 ? 2 : 1,
    // sayaçtan sonra (R() yalnız kapalı duraklı bölümde): çözüm ağacının bir yaprağı (durak) kapatılır, ebeveyninin o kolu silinir.
    // Yaprak kenarı silmek ağacı bölmez (köprü/tünel ağzı komşusu, merkez ve birimler aday değil). Kapalı karo sıradan durak görünür; sol = cur.
    // Seçim: rastgele sıradaki adaylardan (en çok 10) ilk adil olan: oyuncunun gördüğüyle (her durak 4 yön ya da kapalı, tam k kapalı) kapalı küme tek.
    // Hiç adil aday yoksa P.reject işaretlenir ve kapalılar baştan ⊘ ile gösterilir → seçilse bile adil.
    mark(C) {
      const { n, cols, sol, cur, R, hub, hub2 } = C, vd = new Array(n).fill(0), K = C.x.closed;
      const md = (a, b) => b < 0 ? 99 : Math.abs(a % cols - b % cols) + Math.abs((a / cols | 0) - (b / cols | 0));
      const arm = i => { for (let k = 0; k < 4; k++) if (sol[i] & DIRS[k][0]) return [C.nb(i, k), C.ob(i, k)]; return [-1, 0]; };
      const near = (i, f) => { const x = i % cols, y = i / cols | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if ((dx || dy) && X >= 0 && Y >= 0 && X < cols && Y < C.rows && f(Y * cols + X)) return true; } return false; };
      const bare = i => !C.isHub(i) && !C.keep[i] && !C.busy[i] && C.unitOf[i] < 0 && C.link[i] < 0;
      const okLeaf = i => {
        if (vd[i] || popc(sol[i]) !== 1 || !bare(i) || C.pinned[i] || C.rev[i] || C.cnt[i] >= 0 || md(i, hub) < 2 || md(i, hub2) < 2 || near(i, j => C.keep[j] || vd[j])) return false;
        const [p] = arm(i); return p >= 0 && bare(p) && popc(sol[p]) >= 2;
      };
      // ebeveynin kolunu sil: cur[p] aynı dönüşle güncellenir (sabit karoda dönüş 0)
      const cut = i => {
        const [p, o] = arm(i), s0 = sol[p]; let r = 0, v = s0; while (v !== cur[p] && r < 4) { v = rot(v); r++; }
        let c = s0 & ~o; for (let q = 0; q < r % 4; q++) c = rot(c);
        const was = [sol[i], cur[i], s0, cur[p]]; sol[p] = s0 & ~o; cur[p] = c; sol[i] = cur[i]; vd[i] = 1;
        return () => { [sol[i], cur[i], sol[p], cur[p]] = was; vd[i] = 0; };
      };
      const asP = k => ({ cols, rows: C.rows, cur, sol, hub, hub2, pinned: C.pinned, link: C.link, rev: C.rev, cnt: C.cnt,
        units: C.units, unitOf: C.unitOf, ...(C.adj ? { adj: C.adj, ao: C.ao } : {}), ...C.out, void: vd, closed: k });
      const fair = P => {
        const st = stations(P), keys = new Set();
        const sc = api.difficulty(P, cfg => {
          const z = st.filter(j => !cfg[j]); if (z.length !== P.closed) return false;
          if (api.lit({ ...P, cur: cfg, void: cfg.map(m => m ? 0 : 1) }).solved) keys.add(z.join());
          return keys.size > 1;
        }, 3000);
        return keys.size === 1 && sc < 9000;
      };
      const cand = []; for (let i = 0; i < n; i++) if (okLeaf(i)) cand.push(i);
      for (let i = cand.length - 1; i > 0; i--) { const j = R() * (i + 1) | 0; [cand[i], cand[j]] = [cand[j], cand[i]]; }
      let k = 0, unfair = false;
      for (; k < K; k++) {
        let best = -1, first = -1, tried = 0;
        for (const i of cand) {
          if (!okLeaf(i)) continue; if (first < 0) first = i; if (++tried > 10) break;
          const undo = cut(i), ok = fair(asP(k + 1)); undo();
          if (ok) { best = i; break; }
        }
        if (best < 0) { if (first < 0) break; best = first; unfair = true; }
        cut(best);
      }
      if (!k) return;   // yer yok: kural bu bölümde kapalı
      C.out.void = vd; C.out.closed = k;
      if (unfair) { C.out.reject = 1; C.out.closedShown = vd.slice(); }
    },
    // çözücü: her durak 4 yön ya da kapalı (0); gösterilmiş kapalı yalnız 0
    cands: (P, i) => P.closedShown?.[i] ? [0] : isSt(P, i) ? [0, ...orbit(P.cur[i])] : null,
    // küresel sayım: kesin kapalı ≤ k ≤ olası kapalı; eşitlikte kalan duraklar kesinleşir (oyuncunun sayma çıkarımı)
    prune(P, C, M, unit) {
      const st = stations(P), K = hidden(P); let must = 0, may = 0;
      for (const i of st) { if (P.closedShown?.[i]) continue; const a = C[unit[i]], z = a.some(r => !M[i][r]); if (z) { may++; if (a.length === 1) must++; } }
      if (must > K || may < K) return -1;
      if (must === may) return [];
      const out = [];
      if (must === K) for (const i of st) { if (P.closedShown?.[i]) continue; const u = unit[i], a = C[u]; if (a.length > 1 && a.some(r => !M[i][r])) { C[u] = a.filter(r => M[i][r]); out.push(u); } }
      else if (may === K) for (const i of st) { if (P.closedShown?.[i]) continue; const u = unit[i], a = C[u]; if (a.length > 1 && a.some(r => !M[i][r])) { C[u] = a.filter(r => !M[i][r]); out.push(u); } }
      return out;
    },
    // baştan gösterilen kapalı durak dönmez (bilgi zaten açık)
    block: (G, i) => !!G.closedShown?.[i] && MSG.block,
    after(G, i, now) {
      const L = G.L;
      if (L.solved) { G.clWin = G.clWin || now; return; }
      if (!api.save.closedTold) { api.save.closedTold = 1; api.persist(); api.toast(MSG.told(hidden(G))); }
      // hepsi yanıyor ama bir ray kapalı durağa bakıyor: bölümde bir kez söylenir
      if (!G.clWarn && L.n === G.cur.length && into(G, L) >= 0) { G.clWarn = 1; api.haptic('light'); api.toast(MSG.warn); }
    },
    // merkez rozeti "⊘k" (sağ üst, hap) · kazanınca kapalı durakların üstüne ⊘ iner. Kare başına 3–5 çağrı.
    over(D) {
      const { G, s, X, cx, pal, now, n } = D, [hx, hy, , hs] = X[G.hub], r = s * .1;
      let busy = false;
      {
        const w = s * .54, h = s * .3, bx = hx + s * .5 * hs - w * .5 - 2, by = hy - s * .5 * hs + h * .5 + 2;
        cx.beginPath(); D.rrp(bx - w / 2, by - h / 2, w, h, h / 2); cx.fillStyle = pal.bg; cx.fill(); cx.lineWidth = 1.5; cx.strokeStyle = pal.mut; cx.stroke();
        cx.beginPath(); noPath(cx, bx - w * .2, by, r); cx.lineWidth = Math.max(1.5, s * .035); cx.strokeStyle = pal.fg; cx.stroke();
        cx.font = `800 ${Math.round(Math.max(10, s * .23))}px Outfit, system-ui`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = pal.fg;
        cx.fillText(G.closed, bx + w * .2, by + 1); cx.textBaseline = 'alphabetic';
      }
      // gösterilmiş kapalılar baştan, gizliler kazanınca (damga: büyükten oturur)
      const t = G.won && G.clWin ? Math.min(1, (now - G.clWin) / 420) : G.won ? 1 : 0, sc = 1 + .6 * (1 - api.back(t));
      cx.beginPath(); let any = false;
      for (let i = 0; i < n; i++) if (G.void[i] && (G.closedShown?.[i] || t > 0)) { const [x, y, , q] = X[i], R = s * .27 * q * (G.closedShown?.[i] ? 1 : sc); noPath(cx, x, y, R); any = true; }
      if (any) {
        cx.globalAlpha = G.closedShown?.some(Boolean) ? 1 : t;
        cx.lineWidth = s * .12; cx.strokeStyle = pal.bg; cx.stroke(); cx.lineWidth = s * .055; cx.strokeStyle = pal.fg; cx.stroke(); cx.globalAlpha = 1;
        busy = t > 0 && t < 1;
      }
      return busy;
    },
    card: {
      name: L('Kapalı durak', 'Closed station'), tag: L('Yeni: kapalı durak', 'New: closed station'),
      demo: '<div class="rd-closed" aria-hidden="true"><i class="rd-cl-s"><b></b></i><i class="rd-cl-h"><u>' + ICON + '1</u></i><i class="rd-cl-s rd-cl-x"><b></b><s>' + ICON + '</s></i></div>',
      text: L(`Bazı duraklar <b>kapalı</b> ama sıradan görünür; merkezdeki <b>${ICON} sayısı</b> kaç tane olduğunu söyler. Kapalı durağa <b>ray bağlama</b>, açıkların hepsini bağla.`,
        `Some stations are <b>closed</b> but look normal; the <b>${ICON} number</b> on the hub says how many. <b>Don't connect</b> a closed one; connect every open one.`),
    },
    // demo: soldaki durağa ray uzanır ve yanar; sağdakine uzanır, yanmaz, titrer, geri çekilir, ⊘ damgası iner. Azaltılmış harekette son hâl durur.
    css: `.rd-closed{align-self:center;display:flex;align-items:center;gap:6px;margin:6px 0 2px}
.rd-closed>i{position:relative;width:60px;height:60px;border-radius:17px;background:var(--tile);box-shadow:inset 0 0 0 1px var(--stroke)}
.rd-cl-h:before{content:"";position:absolute;left:18px;top:18px;width:24px;height:24px;border-radius:7px;background:var(--acc);box-shadow:0 0 12px var(--accGlow)}
.rd-cl-h u{position:absolute;right:-6px;top:-8px;display:flex;align-items:center;gap:1px;padding:1px 5px;border-radius:9px;background:var(--bg0);box-shadow:inset 0 0 0 1.5px var(--mut);color:var(--fg);font:800 11px Outfit,system-ui;text-decoration:none}
.rd-cl-s:after{content:"";position:absolute;left:21px;top:21px;width:12px;height:12px;border-radius:50%;background:var(--bg0);border:3px solid var(--mut)}
.rd-cl-s b{position:absolute;top:23px;height:14px;width:36px;border-radius:7px;background:var(--acc);transform:scaleX(0)}
.rd-cl-s:first-child b{right:-6px;transform-origin:100% 50%;animation:rd-cl-a 5s ease-in-out infinite}
.rd-cl-s:first-child:after{animation:rd-cl-on 5s infinite}
.rd-cl-x b{left:-6px;transform-origin:0 50%;animation:rd-cl-b 5s ease-in-out infinite}
.rd-cl-x s{position:absolute;inset:12px;opacity:0;animation:rd-cl-d 5s infinite}
.rd-cl-x s svg{width:100%;height:100%}
.rd-closed-i{display:inline-block;width:1.05em;height:1.05em;vertical-align:-.18em;fill:none;stroke:var(--fg);stroke-width:2.2;stroke-linecap:round}
@keyframes rd-cl-a{0%,5%{transform:scaleX(0)}30%,95%{transform:none}100%{transform:scaleX(0)}}
@keyframes rd-cl-on{0%,30%{background:var(--bg0);border-color:var(--mut)}35%,95%{background:#fff;border-color:var(--acc)}100%{background:var(--bg0);border-color:var(--mut)}}
@keyframes rd-cl-b{0%,40%{transform:scaleX(0)}55%{transform:scaleX(.9)}58%{transform:scaleX(.8)}61%{transform:scaleX(.9)}64%{transform:scaleX(.8)}70%{transform:scaleX(.9)}78%,100%{transform:scaleX(0)}}
@keyframes rd-cl-d{0%,76%{opacity:0;transform:scale(1.6)}84%,95%{opacity:1;transform:none}100%{opacity:0}}
.modal:not(.open) .rd-closed *{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.rd-closed *{animation:none!important}.rd-cl-s:first-child b{transform:none}.rd-cl-x s{opacity:1}}`,
  };
});
