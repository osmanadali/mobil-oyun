// M12 · Silik kol (anahtar: faint) — kuralın tamamı bu dosyada. Sözleşme: docs/kurallar/README.md · tasarım: docs/kurallar/silik-kol.md
// Birkaç karonun bir kolu silinmiştir: o kenarda iki nokta ve "?" görünür, altında ray ya vardır ya yoktur. Karo normal döner, "?" onunla döner.
// faint[i] = [c0, q0]: üretimdeki görünen karo (cur) ve "?" biti. Gerçek karo simetrisiz (uç/köşe/T) → anlık "?" = q0'ın c0'dan cur'a dönmüşü.
// Görünen kısım V = cur & ~q her zaman uç ya da köşedir, q ona 90° → gerçek karo "uç ↔ köşe" ya da "köşe ↔ T"; ikisi de gerçekten çıkar (sızıntı yok).
(window.RAY_RULES = window.RAY_RULES || []).push(api => {
  const { DIRS, rot, popc, nb, ob } = api;
  const per4 = m => rot(m) !== m && rot(rot(m)) !== m;
  const orbit = m => { const o = []; for (let r = 0, v = m; r < 4; r++, v = rot(v)) if (!o.includes(v)) o.push(v); return o; };
  const kOf = b => 31 - Math.clz32(b);
  const qNow = (P, i) => { const [c0, q0] = P.faint[i]; let r = 0, v = c0, q = q0; while (v !== P.cur[i] && r < 4) { v = rot(v); q = rot(q); r++; } return q; };
  const IDX = new WeakMap(), list = f => { let a = IDX.get(f); if (!a) IDX.set(f, a = f.flatMap((v, i) => v ? [i] : [])); return a; };
  const md = (c, a, b) => b < 0 ? 99 : Math.abs(a % c - b % c) + Math.abs((a / c | 0) - (b / c | 0));
  // C → bölüm benzeri nesne (mark anında): çekirdek difficulty/lit bununla çalışır
  const asP = C => ({ cols: C.cols, rows: C.rows, cur: C.cur, sol: C.sol, hub: C.hub, hub2: C.hub2, pinned: C.pinned, link: C.link, rev: C.rev, cnt: C.cnt,
    ...(C.units.length ? { units: C.units, unitOf: C.unitOf } : {}), ...(C.adj ? { adj: C.adj, ao: C.ao } : {}), ...C.out });
  // adillik: oyuncunun gördüğüyle (silik kol bilinmeden) bütün çözümlerde silik karoların sınıfı aynı mı · arama tavanı aşılırsa adil sayılmaz
  const CAP = 3000;
  const fair = (P, F) => {
    const keys = new Set(), Q = { ...P, faint: null };
    const sc = api.difficulty(P, cfg => { if (api.lit({ ...Q, cur: cfg }).solved) keys.add(F.map(j => +orbit(P.faint[j][0]).includes(cfg[j])).join('')); return keys.size > 1; }, CAP);
    return keys.size === 1 && sc < 3 * CAP;
  };
  // "?" kolunun gerçekten ışık taşıdığı an (karo yanıyor, kol var, komşu o kola bağlı ve yanıyor): oyuncu zaten görüyor → dolu ray
  const through = (G, i, q) => { if (!(G.cur[i] & q) || G.L.d[i] < 0) return false; const k = kOf(q), j = nb(G, i, k); return j >= 0 && (G.cur[j] & ob(G, i, k)) && G.L.d[j] >= 0; };
  return {
    key: 'faint', line: 11, boost: 2.5,
    clash: ['cover'],   // şekil gizleyen iki kural birlikte fazla ağır (tasarım ölçümü Δ +14,6)
    card: { name: L('Silik kol', 'Faint arm'), tag: L('Yeni: silik kol', 'New: faint arm'),
      demo: '<div class="rd-faint" aria-hidden="true"><i class="rd-fs"></i><i class="rd-ft"><b class="rd-fr"><u class="rd-fv"></u><u class="rd-ff"></u><u class="rd-fx"><u class="rd-fg"></u><em class="rd-fq">?</em></u></b></i></div>',
      text: L('<b>Silik kolun (?)</b> altında ray <b>olabilir de, olmayabilir de</b>. Karo dönünce ? de döner. Kol gerçekte var mı, <b>komşulardan</b> çıkar.',
        'Under a <b>faint arm (?)</b> there <b>may or may not</b> be track. The ? turns with the tile. Read the <b>neighbors</b> to tell if the arm is real.') },
    // demo: tek karo; yukarı dolu kol, sola soluk kol + "?". Karo döner ("?" yukarı bakar). Önce üstten ışık gelir, noktalar dolu raya döner (kol vardı);
    // sonra aynı sahnede ışık geçmez, "?" solar (kol yoktu). Yalnız transform/opacity canlanır. Hareketi azalt: canlanma yok.
    css: `.rd-faint{align-self:center;display:flex;flex-direction:column;align-items:center;margin:6px 0 2px}
.rd-fs{width:14px;height:18px;border-radius:7px 7px 0 0;background:var(--acc);box-shadow:0 0 10px var(--accGlow)}
.rd-ft{position:relative;width:76px;height:76px;border-radius:22px;background:var(--tile);box-shadow:inset 0 0 0 1px var(--stroke)}
.rd-fr{position:absolute;inset:0;animation:rd-fr 7s cubic-bezier(.3,1.4,.5,1) infinite}
.rd-faint u{position:absolute;display:block}
.rd-fv{left:31px;top:0;width:14px;height:45px;border-radius:8px;background:var(--railC)}
.rd-ff{left:0;top:31px;width:45px;height:14px;border-radius:8px;background:var(--acc);opacity:0;animation:rd-ff 7s infinite}
.rd-fx{inset:0;animation:rd-fx 7s infinite}.rd-fg{left:8px;top:31px;width:24px;height:14px;border-radius:7px;background:var(--mut);opacity:.3}
.rd-fq{position:absolute;left:10px;top:28px;width:15px;font:800 20px/20px Outfit,system-ui;font-style:normal;color:var(--fg);text-align:center;animation:rd-fq 7s cubic-bezier(.3,1.4,.5,1) infinite}
@keyframes rd-fr{0%,12%{transform:none}22%,88%{transform:rotate(90deg)}98%,100%{transform:none}}
@keyframes rd-ff{0%,30%{opacity:0}36%,52%{opacity:1}56%,100%{opacity:0}}
@keyframes rd-fx{0%,30%{opacity:1}34%,54%{opacity:0}58%,64%{opacity:1}72%,86%{opacity:.12}94%,100%{opacity:1}}
@keyframes rd-fq{0%,12%{transform:none}22%,88%{transform:rotate(-90deg)}98%,100%{transform:none}}
.modal:not(.open) .rd-faint *{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.rd-faint *{animation:none!important}}`,
    // tanıtım (6×8, ilk bölüm) 2 · 6×8 3 · 7×9 4 · 7×9 hat finali 5
    amount: (n, intro, z, fin) => intro ? 2 : n < 63 ? 3 : fin ? 5 : 4,
    // sayaçtan sonra (tabeladan önce): R() yalnız silikli bölümde tüketilir
    mark(C) {
      const { n, cols, cur, R } = C, faint = new Array(n).fill(0), F = [];
      C.out.faint = faint;
      const cand = [];
      for (let i = 0; i < n; i++) if (C.free(i) && !C.rev[i] && C.cnt[i] < 0 && per4(C.sol[i]) && md(cols, i, C.hub) >= 2 && md(cols, i, C.hub2) >= 2) cand.push(i);
      // önce hepsi yerleşir, adillik tek sayımla denetlenir (çoğu bölüm geçer). Geçmezse aynı sıra tek tek, adil olmayan yerleşim atlanarak yeniden kurulur.
      const want = Math.abs(C.x.faint), pick = [], shape = i => {
        const m = cur[i], has = [], not = [];
        for (let t = 0; t < 4; t++) {
          const b = 1 << t, side = rot(b) | rot(rot(rot(b)));   // b'ye 90° iki kenar
          if (m & b) { const V = m & ~b; if (popc(m) >= 2 && per4(V) && (V & side)) has.push(b); }
          else if (popc(m) <= 2 && (m & side)) not.push(b);
        }
        const pool = R() < .5 ? (has.length ? has : not) : (not.length ? not : has);
        return pool.length ? [m, pool[R() * pool.length | 0]] : 0;
      };
      const near = i => [0, 1, 2, 3].some(d => { const j = C.nb(i, d); return j >= 0 && faint[j]; });   // silik karolar 4-komşu olmaz
      while (pick.length < want && cand.length) {
        const i = cand.splice(R() * cand.length | 0, 1)[0]; if (near(i)) continue;
        const f = shape(i); if (f) { faint[i] = f; pick.push([i, f]); }
      }
      if (pick.length && fair(asP(C), pick.map(p => p[0]))) F.push(...pick.map(p => p[0]));
      else {
        pick.forEach(([i]) => { faint[i] = 0; });
        const add = (i, f) => { faint[i] = f; F.push(i); if (fair(asP(C), F)) return true; faint[i] = 0; F.pop(); return false; };
        for (const [i, f] of pick) add(i, f);
        while (F.length < want && cand.length) { const i = cand.splice(R() * cand.length | 0, 1)[0]; if (near(i)) continue; const f = shape(i); if (f) add(i, f); }
      }
      F.forEach(i => { C.busy[i] = true; });
      if (!F.length) { delete C.out.faint; C.out.reject = true; return; }   // hiç yerleşmedi: seçici başka adayı alır
      C.out.self = faint.map(v => v ? 1 : 0);
    },
    // çözücü: oyuncu silik karo için görünen kısmın ve "? dahil" hâlinin bütün yönlerini düşünür (sıra maske değerine göre: gerçek sınıf sızmasın)
    cands(P, i) { const f = P.faint[i]; if (!f) return null; const q = qNow(P, i), V = P.cur[i] & ~q; return [...new Set([...orbit(V), ...orbit(V | q)])].sort((a, b) => a - b); },
    // oyunda hep 0 (karo yalnız döner); çözücü yaprağında yanlış sınıf inancını eler
    check(P) { let bad = 0; for (const i of list(P.faint)) if (!orbit(P.faint[i][0]).includes(P.cur[i])) bad++; return bad; },
    after(G, i) { if (G.faint[i] && !api.save.faintTold) { api.save.faintTold = 1; api.persist(); api.toast(L('Silik kol · ? altında ray olabilir de olmayabilir de', 'Faint arm · there may or may not be track under ?')); } },
    // çekirdek silik karoyu çizmez (P.self). Görünen kısım çekirdekle aynı stilde (sönük → ışıma → yanan); "?" kolu: soluk şerit + iri "?" (makasın kesik çizgi + boş halkasından ayrı).
    // İpucuyla sabitlenen, kazanılan ya da "?" kolundan gerçekten ışık geçen karoda gerçek karo düz çizilir.
    rails({ G, s, X, vis, own, OC, cx, pal, railPath, rgba }) {
      const I = list(G.faint).filter(vis), S = I.map(i => {
        const q = qNow(G, i), open = G.won || G.fixed[i] || through(G, i, q);
        return [i, open ? G.cur[i] : G.cur[i] & ~q, open ? 0 : q];
      });
      if (!S.length) return;
      const path = f => { cx.beginPath(); for (const [i, m] of S) if (f(i)) railPath(X[i], m); cx.stroke(); };
      const on = i => G.L.d[i] >= 0, tags = [1, 2, 3].filter(t => S.some(([i]) => on(i) && own(i) === t));
      cx.lineWidth = s * .17; cx.strokeStyle = pal.rail; path(i => !on(i));
      for (const t of tags) { cx.lineWidth = s * .38; cx.strokeStyle = rgba(OC[t], pal.light ? .16 : .22); path(i => on(i) && own(i) === t); }
      for (const t of tags) { cx.lineWidth = s * .17; cx.strokeStyle = OC[t]; path(i => on(i) && own(i) === t); }
      // durak noktası (görünen kısım tek kolluysa): çekirdekteki gibi
      const st = S.filter(([, m]) => popc(m) === 1);
      const dot = (f, r) => { cx.beginPath(); for (const [i] of st) if (f(i)) { const [x, y, , sc] = X[i]; cx.moveTo(x + r * sc, y); cx.arc(x, y, r * sc, 0, 7); } };
      if (st.length) {
        for (const t of tags) { dot(i => on(i) && own(i) === t, s * .27); cx.fillStyle = rgba(OC[t], .22); cx.fill(); }
        cx.lineWidth = s * .065;
        for (const t of tags) { dot(i => on(i) && own(i) === t, s * .15); cx.fillStyle = '#fff'; cx.fill(); cx.strokeStyle = OC[t]; cx.stroke(); }
        dot(i => !on(i), s * .15); cx.fillStyle = pal.bg; cx.fill(); cx.strokeStyle = pal.mut; cx.stroke();
      }
      // "?" kolu: ray kalınlığında soluk "aşınmış ray" (.12s → .40s, kenara değmez) + üstünde iri "?" (.27s). Konum karonun açısıyla döner, "?" dik durur.
      const Q = S.filter(([, , q]) => q); if (!Q.length) return;
      const at = ([i, , q], f) => { const [x, y, a, sc] = X[i], [, dx, dy] = DIRS[kOf(q)], c = Math.cos(a), si = Math.sin(a), L = s * sc; return [x + (dx * c - dy * si) * f * L, y + (dx * si + dy * c) * f * L]; };
      cx.beginPath();
      for (const e of Q) { cx.moveTo(...at(e, .12)); cx.lineTo(...at(e, .40)); }
      cx.lineWidth = s * .17; cx.strokeStyle = rgba(pal.mut, pal.light ? .22 : .28); cx.stroke();
      cx.font = `800 ${Math.round(Math.max(12, s * .3))}px Outfit, system-ui`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = pal.fg;
      for (const e of Q) { const [px, py] = at(e, .27); cx.fillText('?', px, py + 1); }
      cx.textBaseline = 'alphabetic';
    },
  };
});
