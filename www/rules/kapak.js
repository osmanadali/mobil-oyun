// M15 · Kapak (anahtar: cover) — kuralın tamamı bu dosyada. Sözleşme: docs/kurallar/README.md · tasarım: docs/kurallar/kapak.md
// Kapaklı karo sabit ve çözüm yönündedir ama şekli görünmez (P.self: çekirdek rayını çizmez). Çözücü onu 15 maskeden biri sayar (cands).
// Üretimde adillik: oyuncunun gördüğü bilgiyle bütün çözümlerde kapakların maskesi aynı değilse kapak oraya konmaz.
(window.RAY_RULES = window.RAY_RULES || []).push(api => {
  const { DIRS, popc } = api, ALL = [...Array(16).keys()].slice(1);
  const md = (c, i, j) => j < 0 ? 99 : Math.abs(i % c - j % c) + Math.abs((i / c | 0) - (j / c | 0));
  const idx = new WeakMap(), list = g => { let a = idx.get(g); if (!a) idx.set(g, a = g.flatMap((v, i) => v ? [i] : [])); return a; };   // kapaklı karolar
  // üretim anındaki C → çekirdek difficulty/lit'in okuduğu bölüm nesnesi
  const asP = C => ({ cols: C.cols, rows: C.rows, cur: C.cur, sol: C.sol, hub: C.hub, hub2: C.hub2, pinned: C.pinned, link: C.link, rev: C.rev, cnt: C.cnt,
    ...(C.units.length ? { units: C.units, unitOf: C.unitOf } : {}), ...(C.adj ? { adj: C.adj, ao: C.ao } : {}), ...C.out });
  // adil mi: kapak bilinmeden (15 maskeden biri) bulunan bütün çözümlerde kapakların maskesi tek, arama tavana vurmadan bitti
  const fair = (P, cells, cap = 3000) => {
    const keys = new Set(), Q = { ...P, cover: null };
    const sc = api.difficulty(P, cfg => { if (api.lit({ ...Q, cur: cfg }).solved) keys.add(cells.map(j => cfg[j]).join()); return keys.size > 1; }, cap);
    return keys.size === 1 && sc < 3 * cap;
  };
  return {
    key: 'cover', line: 14, ord: 9, boost: 2.5, clash: ['fog', 'faint'],
    card: { name: L('Kapak', 'Cover'), tag: L('Yeni: kapak', 'New: cover'),
      demo: '<div class="rd-cover" aria-hidden="true"><i class="ft"><b></b></i><i class="rd-cv"><em class="w"></em><em class="e"></em><s></s></i><i class="rd-cvs"><b></b><u></u></i></div>',
      text: L('<b>Kapaklı</b> karonun rayı görünmez ve <b>dönmez</b>; altındaki ray zaten doğru yönde. Komşulara bakıp <b>hangi yönlere açıldığını</b> çıkar.',
        `A <b>covered</b> tile hides its track and <b>won't turn</b>; the track below already faces right. Use the neighbors to find <b>which ways it opens</b>.`) },
    // demo: sol ray yanar → kapağın sol yarığı → sağ yarık ve durak (ışık kapağın altından geçti) → söner
    css: `.rd-cover{align-self:center;display:flex;align-items:center;gap:4px;margin:6px 0 2px}.rd-cover .ft{width:56px;height:56px}.rd-cover .ft b{top:21px;animation:rdcv1 4s infinite}
.rd-cv{position:relative;width:56px;height:56px;border-radius:16px;background:var(--tile);box-shadow:inset 0 0 0 1px var(--stroke)}
.rd-cv em{position:absolute;top:21px;width:12px;height:14px;background:var(--acc);box-shadow:0 0 10px var(--accGlow);opacity:0}.rd-cv .w{left:-2px;border-radius:0 4px 4px 0;animation:rdcv2 4s infinite}.rd-cv .e{right:-2px;border-radius:4px 0 0 4px;animation:rdcv3 4s infinite}
.rd-cv s{position:absolute;left:9px;top:9px;width:38px;height:38px;box-sizing:border-box;border-radius:50%;background:var(--pin);border:3px solid var(--mut)}
.rd-cv s:after{content:"";position:absolute;left:8px;top:14.5px;width:16px;height:3px;border-radius:2px;background:var(--mut);box-shadow:-2px -7px 0 -.5px var(--mut),2px -7px 0 -.5px var(--mut),-2px 7px 0 -.5px var(--mut),2px 7px 0 -.5px var(--mut)}
.rd-cvs{position:relative;width:56px;height:56px;border-radius:16px;background:var(--tile);box-shadow:inset 0 0 0 1px var(--stroke)}.rd-cvs b{position:absolute;left:-4px;width:32px;top:21px;height:14px;border-radius:8px;background:var(--rail);animation:rdcv3b 4s infinite}
.rd-cvs u{position:absolute;left:16px;top:16px;width:24px;height:24px;box-sizing:border-box;border-radius:50%;background:var(--bg0);border:4px solid var(--mut);animation:rdcv4 4s infinite}
@keyframes rdcv1{0%,8%,88%,100%{background:var(--rail);box-shadow:none}18%,80%{background:var(--acc);box-shadow:0 0 12px var(--accGlow)}}
@keyframes rdcv2{0%,28%,88%,100%{opacity:0}35%,80%{opacity:1}}@keyframes rdcv3{0%,44%,88%,100%{opacity:0}50%,80%{opacity:1}}
@keyframes rdcv3b{0%,44%,88%,100%{background:var(--rail)}50%,80%{background:var(--acc)}}@keyframes rdcv4{0%,46%,88%,100%{background:var(--bg0);border-color:var(--mut)}52%,80%{background:#fff;border-color:var(--acc)}}
@media (prefers-reduced-motion:reduce){.rd-cover *{animation:none!important}}`,
    // tanıtım (M15'in ilk 3 bölümü, 6×8): 1 kapak · 7×9 hat finali 3 · diğerleri 2 (karma hatlarda kapak hep 7×9'da gelir)
    amount: (n, intro, z, fin) => intro || n < 63 ? 1 : fin ? 3 : 2,
    // sayaçlıdan sonra, karanlıktan önce; R() yalnız kapaklı bölümde. Aday: çıplak 2–3 kollu karo, merkezden ≥ 2, köprü/tünel ağzı değil, kapağa bitişik değil.
    mark(C) {
      const { n, cols, sol, R } = C, cover = C.out.cover = new Array(n).fill(0), self = C.out.self ||= new Array(n).fill(0), cand = [];
      for (let i = 0; i < n; i++) if (C.free(i) && !C.keep[i] && !C.rev[i] && C.cnt[i] < 0 && popc(sol[i]) >= 2 && popc(sol[i]) <= 3 && md(cols, i, C.hub) >= 2 && md(cols, i, C.hub2) >= 2) cand.push(i);
      const placed = [];
      for (let k = 0; k < C.x.cover && cand.length;) {
        const i = cand.splice(R() * cand.length | 0, 1)[0];
        if ([0, 1, 2, 3].some(q => { const j = C.nb(i, q); return j >= 0 && cover[j]; })) continue;
        const cur0 = C.cur[i]; cover[i] = sol[i]; C.cur[i] = sol[i]; placed.push(i);
        if (!fair(asP(C), placed)) { cover[i] = 0; C.cur[i] = cur0; placed.pop(); continue; }
        C.busy[i] = true; self[i] = 1; k++;
      }
      if (!placed.length) { delete C.out.cover; if (!self.some(Boolean)) delete C.out.self; }   // yer yok: kural bu bölümde kapalı
    },
    cands: (P, i) => P.cover[i] ? ALL : null,   // oyuncu kapağın altını bilmez: 15 maskeden biri
    check: (P) => { let b = 0; for (const i of list(P.cover)) if (P.cur[i] !== P.cover[i]) b++; return b; },   // oyunda hep 0 (dönmez); çözücü yaprağında yanlış inancı eler
    block: (G, i) => !!G.cover[i] && L('Kapak · altındaki ray sabit ve doğru yönde, dönmez', 'Cover · the track below is fixed and already right'),
    after(G, i, now) {
      if (G.L.solved && !G.cvWin) G.cvWin = now;   // kazanınca kapak açılır (rails)
      if (!api.save.coverTip && list(G.cover).some(j => G.L.d[j] >= 0)) { api.save.coverTip = 1; api.persist(); api.toast(L('Kapak · ışık altından geçti, parlayan kollar açık', 'Cover · light passed under it, glowing arms are open')); }
    },
    // kapak: hücreye sabit daire + 3 yatay yarık (biçim). Işığın geçtiği kol: daireden karo kenarına hat renginde kısa ray (biçim + renk).
    // Kazanınca kapak 420 ms'de solar, altındaki ray görünür.
    rails(D) {
      const { G, s, X, on, vis, own, OC, cx, pal, now } = D, I = list(G.cover).filter(vis);
      if (!I.length) return false;
      const t = G.cvWin ? Math.min(1, (now - G.cvWin) / 420) : 0;
      if (t > 0) for (const c of [1, 2, 3]) {
        const Q = I.filter(i => on(i) && own(i) === c); if (!Q.length) continue;
        cx.globalAlpha = t; cx.lineWidth = s * .17; cx.strokeStyle = OC[c]; cx.beginPath(); for (const i of Q) D.railPath(X[i], G.cur[i]); cx.stroke();
      }
      cx.globalAlpha = 1 - t;
      if (t < 1) {
        const stub = (i, k) => { const [x, y, , sc] = X[i], [, dx, dy] = DIRS[k], a = s * sc; cx.moveTo(x + dx * .3 * a, y + dy * .3 * a); cx.lineTo(x + dx * .5 * a, y + dy * .5 * a); };
        cx.lineCap = 'butt';
        for (const c of [1, 2, 3]) {
          cx.beginPath(); let any = false;
          for (const i of I) if (on(i) && own(i) === c) for (let k = 0; k < 4; k++) {
            const j = api.nb(G, i, k); if (!(G.cur[i] & DIRS[k][0]) || j < 0 || !on(j) || !(G.cur[j] & api.ob(G, i, k))) continue;
            stub(i, k); any = true;
          }
          if (any) { cx.lineWidth = s * .17; cx.strokeStyle = OC[c]; cx.stroke(); }
        }
        cx.lineCap = 'round';
        cx.beginPath(); for (const i of I) { const [x, y, , sc] = X[i], r = s * .33 * sc; cx.moveTo(x + r, y); cx.arc(x, y, r, 0, 7); }
        cx.fillStyle = pal.pin; cx.fill(); cx.lineWidth = s * .055; cx.strokeStyle = pal.mut; cx.stroke();
        cx.beginPath(); for (const i of I) { const [x, y, , sc] = X[i], a = s * sc; for (const [w, dy] of [[.12, -.12], [.17, 0], [.12, .12]]) { cx.moveTo(x - w * a, y + dy * a); cx.lineTo(x + w * a, y + dy * a); } }
        cx.lineWidth = s * .045; cx.stroke();
      }
      cx.globalAlpha = 1;
      return t > 0 && t < 1;
    },
  };
});
