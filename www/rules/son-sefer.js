// M25 · Son sefer (last): ⏳ saatli durak, üstündeki sayı kadar hamle içinde merkeze bağlanmalı; yetişmezse ↻ hamle yıldızı söner.
// Oyun bitmez, can gitmez; bağlanınca sayaç kalkar. Ayrıntı ve hamle payı kanıtı: docs/kurallar/son-sefer.md
(window.RAY_RULES = window.RAY_RULES || []).push(api => {
  const { popc, tree, unitTaps } = api;
  const AMB = '#ffb547', AMB_L = '#b86e00';
  const MSG = {
    lost: L('⏳ Son sefer kaçtı · ↻ ★ söndü', '⏳ Timed station missed · ↻ ★ lost'),
    made: L('⏳ Son sefere yetişti', '⏳ Timed station reached'),
  };
  // oyun içi durum (bulmaca verisi önbellekte paylaşılır, ona yazılmaz): at[j] = bağlandığı hamle (null: henüz değil) · miss[j] = kaçtı
  const st = G => {
    if (G.lastS) return G.lastS;
    const { st: S, B } = G.last, on = S.map(s => G.L.d[s] >= 0);
    G.lastS = { at: on.map(v => v ? 0 : null), miss: on.map((v, j) => !v && G.moves > B[j]) };   // yarım oyundan dönüş: yanan durak yetişmiş sayılır
    sync(G); return G.lastS;
  };
  const sync = G => { G.mLost = G.lastS.miss.includes(true) ? MSG.lost : 0; };
  return {
    key: 'last', line: 24, ord: 25, boost: 5.5, scan: 48,
    clash: ['gear'],   // kendiliğinden dönen bakım karosu yolu hamle sayısından bağımsız bozar: hamle payı kanıtı geçmez
    card: { name: L('Son sefer', 'Timed station'), tag: L('Yeni: son sefer', 'New: timed station'),
      demo: '<div class="rd-last" aria-hidden="true"><i class="a"></i><i class="b"><s></s><u></u><b></b><em>3</em><em>2</em><em>1</em></i></div>',
      text: L('⏳ Saatli durak, üstündeki sayı kadar <b>hamle içinde</b> merkeze bağlanmalı. Yetişmezse <b>↻ hamle yıldızı söner</b>; bölüm sürer, can gitmez.',
        'A ⏳ timed station must reach the hub <b>within the moves</b> shown on it. Miss it and the <b>↻ move star goes out</b>; the level goes on, no life lost.') },
    css: `.rd-last,.rd-last *{box-sizing:border-box}.rd-last{position:relative;align-self:center;display:flex;gap:6px;margin:10px 0 2px}
.rd-last i{position:relative;width:64px;height:64px;border-radius:18px;background:var(--tile);box-shadow:inset 0 0 0 1px var(--stroke)}
.rd-last .a::before{content:'';position:absolute;left:-4px;right:-4px;top:25px;height:14px;border-radius:8px;background:var(--acc);box-shadow:0 0 10px var(--accGlow)}
.rd-last s{position:absolute;left:25px;top:-4px;width:14px;height:36px;border-radius:8px;background:var(--rail);transform-origin:7px 29px;animation:rdlR 4s ease-in-out infinite}
.rd-last u{position:absolute;left:20px;top:20px;width:24px;height:24px;border-radius:50%;background:var(--bg);box-shadow:inset 0 0 0 4px var(--mut);animation:rdlD 4s ease-in-out infinite}
.rd-last b{position:absolute;left:11px;top:11px;width:42px;height:42px;border-radius:50%;border:3px solid ${AMB};animation:rdlO 4s linear infinite}
.rd-last em{position:absolute;right:-8px;top:-8px;width:26px;height:26px;border-radius:50%;background:${AMB};color:#16182a;font:800 15px/26px Outfit,system-ui,sans-serif;text-align:center;font-style:normal;opacity:0;animation:rdl1 4s linear infinite}
.rd-last em:nth-of-type(1){animation-name:rdl3}.rd-last em:nth-of-type(2){animation-name:rdl2}
@keyframes rdl3{0%,20%{opacity:1}21%,100%{opacity:0}}@keyframes rdl2{0%,20%{opacity:0}21%,40%{opacity:1}41%,100%{opacity:0}}@keyframes rdl1{0%,40%{opacity:0}41%,60%{opacity:1}61%,100%{opacity:0}}
@keyframes rdlR{0%,56%,100%{transform:none;background:var(--rail)}64%,94%{transform:rotate(-90deg);background:var(--acc)}}
@keyframes rdlD{0%,60%,100%{background:var(--bg);box-shadow:inset 0 0 0 4px var(--mut)}66%,94%{background:#fff;box-shadow:inset 0 0 0 4px var(--acc),0 0 12px var(--accGlow)}}
@keyframes rdlO{0%,60%{opacity:1}64%,96%{opacity:0}100%{opacity:1}}
@media (prefers-reduced-motion:reduce){.rd-last *{animation:none!important}.rd-last em:nth-of-type(1){opacity:1}}`,
    // tanıtım bölümünde 1 saatli durak, sonra 2, hat finalinde 3
    amount: (n, intro, z, fin) => intro ? 1 : fin ? 3 : 2,
    // en son aşama (fin): karanlık tünel ve "çözülmüş gelmesin" başlangıcı değiştirdikten sonra, son dizilimle hamle payı hesaplanır
    fin(C) {
      const { n, R, cur, sol, x } = C, P = { cols: C.cols, rows: C.rows, hub: C.hub, hub2: C.hub2, adj: C.adj, ao: C.ao }, T = tree(P, sol), o = C.out;
      const key = q => C.unitOf[q] >= 0 ? 'u' + C.unitOf[q] : C.link[q] >= 0 ? 'p' + Math.min(q, C.link[q]) : 't' + q;
      const bad = q => { const u = C.unitOf[q]; if (u >= 0) return unitTaps(C.units[u], cur, sol) > 0; const j = C.link[q]; return cur[q] !== sol[q] || (j >= 0 && cur[j] !== sol[j]); };
      const cand = [];
      for (let i = 0; i < n; i++) {
        if (popc(sol[i]) !== 1 || C.isHub(i) || C.unitOf[i] >= 0 || C.busy[i] || C.keep[i] || o.void?.[i] || o.self?.[i] || T.dep[i] <= 0) continue;
        const path = []; for (let q = i; q >= 0; q = T.pa[q]) path.unshift(q);   // merkezden durağa
        if (path.some(q => o.split?.[q] || o.void?.[q])) continue;
        const need = new Set(path.filter(bad).map(key));
        if (need.size) cand.push({ i, path, need });
      }
      if (!cand.length) return;
      // tercih: yolunda en az 3 yanlış birim olan durak (sayaç baskı yapsın); yoksa en çok olanlar
      cand.sort((a, b) => b.need.size - a.need.size);
      const deep = cand.filter(c => c.need.size >= 3), pool = deep.length >= x.last ? deep : cand.slice(0, Math.max(x.last, Math.ceil(cand.length / 3)));
      const pick = []; for (let k = 0; k < x.last && pool.length; k++) pick.push(pool.splice(R() * pool.length | 0, 1)[0]);
      pick.sort((a, b) => a.need.size - b.need.size || a.i - b.i);
      // hamle payı: durakları bu sırayla bağlayan oyuncu j. durağa kadar ∪ yol birimlerini düzeltir (her biri 1 hamle) + pay
      const slack = x.last === 1 ? 3 : 2, U = new Set(), B = [];
      for (const c of pick) { c.need.forEach(k => U.add(k)); B.push(U.size + slack); }
      o.last = { st: pick.map(c => c.i), B, path: pick.map(c => c.path) };
    },
    // robot ve ipucu sırası: bekleyen saatli durakların yolları (en kısa süreli önce, merkezden dışa); birim karoları birlikte
    prio(G) {
      const S = st(G), out = [], seen = new Set();
      const ord = G.last.st.map((s, j) => j).filter(j => S.at[j] == null && G.L.d[G.last.st[j]] < 0).sort((a, b) => S.miss[a] - S.miss[b] || G.last.B[a] - G.last.B[b]);
      for (const j of ord) for (const q of G.last.path[j]) {
        const u = G.unitOf?.[q] ?? -1;
        for (const c of u >= 0 ? G.units[u].cells : [q]) if (!seen.has(c)) { seen.add(c); out.push(c); }
      }
      return out;
    },
    after(G, i, now, moved) {
      const S = st(G), { st: ST, B } = G.last;
      let was = null;   // bu hamleden önceki dizilimde durak yanıyor muydu (ipucuyla bağlanmış olabilir): G.hist'in son kaydı tam o an
      const litBefore = s => { if (!was) { const h = G.hist?.[G.hist.length - 1]; was = h ? api.lit({ ...G, cur: h.cur }).d : G.L.d; } return was[s] >= 0; };
      let made = 0, lost = 0;
      ST.forEach((s, j) => {
        if (S.at[j] != null || S.miss[j]) return;
        if (moved && G.moves > B[j]) { if (litBefore(s)) S.at[j] = G.moves - 1; else { S.miss[j] = true; lost++; } return; }
        if (G.L.d[s] >= 0) { S.at[j] = G.moves; made++; }
      });
      sync(G);
      if (made) { api.tone(api.note(7), .18, .04, 'sine'); api.tone(api.note(11), .22, .03, 'sine', .07); if (!G.zen && !G.mLost) api.toast(MSG.made); }
      if (lost) { api.tone(233, .18, .035, 'triangle'); api.haptic('heavy'); }
    },
    // ↶ geri al: geri alınan hamlelerdeki bağlanma ve kaçırma silinir, yanan durak yeniden yetişmiş sayılır
    undo(G) {
      const S = st(G), { st: ST, B } = G.last;
      ST.forEach((s, j) => {
        if (S.at[j] != null && S.at[j] > G.moves) S.at[j] = null;
        if (S.miss[j] && G.moves <= B[j]) S.miss[j] = false;
        if (S.at[j] == null && !S.miss[j] && G.L.d[s] >= 0) S.at[j] = G.moves;
      });
      sync(G);
    },
    // sayaç: durak çevresinde kalan payı gösteren yay + sağ üstte kalan hamle (karanlık tünelde de görünür: top katmanı).
    // Son hamlede kırmızı nabız; kaçınca kesik gri çember ve "–" (renk dışında biçimle de belli)
    top(D) {
      const { cx, s, X, G, pal, now } = D; if (G.won) return;
      const S = st(G), { st: ST, B } = G.last, amb = pal.light ? AMB_L : AMB; let busy = false;
      cx.save(); cx.textAlign = 'center'; cx.textBaseline = 'middle';
      ST.forEach((q, j) => {
        if (S.at[j] != null || D.on(q)) return;
        const [x, y, , sc] = X[q], left = Math.max(0, B[j] - G.moves), miss = S.miss[j], hot = !miss && left <= 1;
        const pulse = hot ? .5 + .5 * Math.sin(now / 160) : 1; if (hot) busy = true;
        const c = miss ? pal.mut : hot ? G.warn : amb, r = s * .34 * sc;
        cx.lineWidth = Math.max(2, s * .055); cx.lineCap = 'round';
        cx.strokeStyle = D.rgba(c, .25); cx.beginPath(); cx.arc(x, y, r, 0, 7); cx.stroke();
        if (miss) { cx.setLineDash([s * .06, s * .07]); cx.strokeStyle = c; cx.beginPath(); cx.arc(x, y, r, 0, 7); cx.stroke(); cx.setLineDash([]); }
        else { cx.strokeStyle = D.rgba(c, .55 + .45 * pulse); cx.beginPath(); cx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(.04, left / B[j])); cx.stroke(); }
        const bx = x + s * .3 * sc, by = y - s * .3 * sc, br = s * .16 * sc;
        cx.fillStyle = miss ? D.rgba(pal.mut, .9) : c; cx.beginPath(); cx.arc(bx, by, br * (hot ? 1 + .08 * pulse : 1), 0, 7); cx.fill();
        cx.lineWidth = Math.max(1.5, s * .03); cx.strokeStyle = pal.bg; cx.stroke();
        cx.font = `800 ${Math.round(s * .2 * sc)}px Outfit, system-ui`; cx.fillStyle = miss || hot ? '#fff' : '#16182a';
        cx.fillText(miss ? '–' : left, bx, by + 1);
      });
      cx.restore();
      return busy;
    },
  };
});
