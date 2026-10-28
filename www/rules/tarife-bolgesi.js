// M20 · Tarife bölgesi (anahtar: zone) — kuralın tamamı bu dosyada. Sözleşme: docs/kurallar/README.md · tasarım: docs/kurallar/tarife-bolgesi.md
// Merkezi saran kesikli kare (Chebyshev yarıçap 1): sınır kenarında ray ya GEÇER (iki yan kollu) ya TAMPONLA biter (tek yan kollu).
// Kazanma: lit (sınır kenarı open → gevşek sayılmaz) + sınırdan tam B geçiş ve tam T tampon (ikisi de rozette yazılı).
(window.RAY_RULES = window.RAY_RULES || []).push(api => {
  const { DIRS, popc } = api, ZD = 1;
  // P.zone.pr: sınır kenarları [i, k, j]: j = i'nin k (D ya da G) geometrik komşusu; her kenar bir kez
  const arm = (P, m, i, b) => !P.void?.[i] && !!(m[i] & b);
  const count = (P, m, see) => {
    const pr = P.zone.pr; let b = 0, t = 0;
    for (let p = 0; p < pr.length; p += 3) { if (see && !(see(pr[p]) && see(pr[p + 2]))) continue; const k = pr[p + 1], u = arm(P, m, pr[p], DIRS[k][0]), v = arm(P, m, pr[p + 2], DIRS[k][3]); if (u && v) b++; else if (u || v) t++; }
    return [b, t];
  };
  const box = P => { const h = P.hub, hx = h % P.cols, hy = h / P.cols | 0; return [Math.max(0, hx - ZD), Math.max(0, hy - ZD), Math.min(P.cols - 1, hx + ZD), Math.min(P.rows - 1, hy + ZD)]; };
  // rozet simgeleri (yalnız çizgi, karttaki ⇄ ve ⊣ ile aynı; yazı tipine güvenilmez): geçiş = iki yönlü ok · tampon = çubukta biten ray
  const iconX = (cx, x, y, r) => { const a = r * .42, h = r * .4; for (const e of [-1, 1]) { const yy = y + e * a, tip = x - e * r; cx.moveTo(x + e * r, yy); cx.lineTo(tip, yy); cx.moveTo(tip + e * h, yy - h); cx.lineTo(tip, yy); cx.lineTo(tip + e * h, yy + h); } };
  const iconT = (cx, x, y, r) => { cx.moveTo(x - r, y); cx.lineTo(x + r * .35, y); cx.moveTo(x + r * .35, y - r * .7); cx.lineTo(x + r * .35, y + r * .7); };
  return {
    key: 'zone', line: 19, boost: 4,
    // iki merkez: bölge yalnız birini sarardı · nehir: aynı mekanizma (yumuşak sınır + sayım), aynı bölümde iki rozet kalabalık.
    // Köprü ve döner tabla prototipte dışlanmıştı; ölçümde ikisiyle de çözüm geçerli ve çözücü sağlam (docs), dışlanmadı.
    clash: ['two', 'river'],
    amount: () => 1,
    // ağaçtan sonra (halka kenarı eklendikten sonra), karıştırmadan önce: tampon kolu ekle, B'yi çözümden say
    tree(C) {
      const { cols, rows, n, sol, R, hub } = C, hx = hub % cols, hy = hub / cols | 0, E = new Uint8Array(n * 4), pr = [], geo = { cols, rows };
      const inZ = i => Math.max(Math.abs(i % cols - hx), Math.abs((i / cols | 0) - hy)) <= ZD;
      for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) {
        const j = api.nb(geo, i, k); if (j < 0 || inZ(i) === inZ(j)) continue;   // geometrik komşu: tünel ağzı kenarı (C.adj) sınır sayılmaz
        E[i * 4 + k] = 1; if (k === 1 || k === 2) pr.push(i, k, j);
      }
      // tampon adayı: sınır kenarında iki yan da kolsuz; karo merkez, köprü, tünel ağzı, halka işareti değil, en çok 2 kollu (sonra ≤ 3)
      const cand = [];
      for (let i = 0; i < n; i++) if (!C.isHub(i) && !C.keep[i] && !C.busy[i] && popc(sol[i]) <= 2) for (let k = 0; k < 4; k++) {
        if (!E[i * 4 + k]) continue; const j = api.nb(geo, i, k);
        if (!(sol[i] & DIRS[k][0]) && !(sol[j] & DIRS[k][3])) cand.push([i, k]);
      }
      const at = [], used = new Set();
      for (let t = 0; t < C.x.zone && cand.length; t++) {
        const Q = cand.filter(([i, k]) => !used.has(i) && !used.has(api.nb(geo, i, k))); if (!Q.length) break;
        const [i, k] = Q[R() * Q.length | 0]; used.add(i); used.add(api.nb(geo, i, k)); sol[i] |= DIRS[k][0]; at.push([i, k]);
      }
      const Z = { E, pr, T: at.length, at };
      Z.B = count({ zone: Z }, sol)[0];
      C.out.zone = Z;
    },
    // adillik (sayaçtan sonra, bütün birimler kurulu): rozetteki iki sayıyla tek çözüm olmalı; yoksa ya da tampon konamadıysa aday reddedilir (pick başka aday seçer).
    // Çözüm sayımı çözücünün yaprağında, 2. çözümde durur. Karanlık ve "çözülmüş gelmesin" yalnız cur'u döndürür: çözüm kümesi değişmez. R() tüketmez.
    mark(C) {
      const Z = C.out.zone; if (!Z) return;
      const P = { ...C, ...C.out }; let k = 0;
      api.difficulty(P, cfg => (api.lit({ ...P, cur: cfg }).solved && k++, k > 1), 600);
      if (k !== 1 || Z.T !== C.x.zone) C.out.reject = true;
    },
    open: (P, i, k) => P.zone.E[i * 4 + k],
    // L.zb / L.zt: sınırdaki geçiş ve tampon (yanan, yanmayan bütün karolar) · L.zNear: geri kalan her şey tamam, yalnız sayılar tutmuyor
    check(P, L) {
      const [b, t] = count(P, P.cur), bad = (b !== P.zone.B) + (t !== P.zone.T);
      L.zb = b; L.zt = t; L.zNear = bad > 0 && L.solved;
      return bad;
    },
    // çözücü: her sınır kenarının durum kümesi {0 yok, 1 tampon, 2 geçiş}; geçiş ve tampon için Σkesin ≤ sayı ≤ Σolası.
    // Σolası = sayı → olabilen her kenar o durumda olmalı · Σkesin = sayı → kesin olmayanlarda o durum yasak. Aynı birimdeki iki karo aynı durumu paylaşır.
    prune(P, C, M, unit) {
      const pr = P.zone.pr, np = pr.length / 3, ch = new Set(), S = new Uint8Array(np);
      const A = (i, b) => P.void?.[i] ? () => false : r => !!(M[i][r] & b), val = (a, b) => a && b ? 2 : a || b ? 1 : 0;
      const states = p => {
        const i = pr[p * 3], k = pr[p * 3 + 1], j = pr[p * 3 + 2], ui = unit[i], uj = unit[j], a = A(i, DIRS[k][0]), b = A(j, DIRS[k][3]);
        let s = 0;
        if (ui === uj) for (const r of C[ui]) s |= 1 << val(a(r), b(r));
        else { let x = 0, y = 0; for (const r of C[ui]) x |= a(r) ? 2 : 1; for (const r of C[uj]) y |= b(r) ? 2 : 1; for (const p of [1, 2]) if (x & p) for (const q of [1, 2]) if (y & q) s |= 1 << val(p > 1, q > 1); }
        return s;
      };
      for (const [q, K] of [[1, P.zone.T], [2, P.zone.B]]) {
        let lo = 0, hi = 0; const f = 1 << q;
        for (let p = 0; p < np; p++) { const s = S[p] = states(p); if (s & f) { hi++; if (s === f) lo++; } }
        if (lo > K || hi < K) return -1;
        if (lo !== K && hi !== K) continue;
        const must = hi === K;
        for (let p = 0; p < np; p++) {
          if (!(S[p] & f) || S[p] === f) continue;
          const i = pr[p * 3], k = pr[p * 3 + 1], j = pr[p * 3 + 2], ui = unit[i], uj = unit[j], a = A(i, DIRS[k][0]), b = A(j, DIRS[k][3]);
          const ok = (r, rj) => (val(a(r), b(rj)) === q) === must;
          if (ui === uj) { const c = C[ui].filter(r => ok(r, r)); if (!c.length) return -1; if (c.length < C[ui].length) { C[ui] = c; ch.add(ui); } continue; }
          const ci = C[ui].filter(r => C[uj].some(rj => ok(r, rj))); if (!ci.length) return -1;
          if (ci.length < C[ui].length) { C[ui] = ci; ch.add(ui); }
          const cj = C[uj].filter(rj => C[ui].some(r => ok(r, rj))); if (!cj.length) return -1;
          if (cj.length < C[uj].length) { C[uj] = cj; ch.add(uj); }
        }
      }
      return [...ch];
    },
    block(G) { G.zNear0 = !!G.L.zNear; G.zt0 = G.L.zt | 0; },
    after(G, i, now) {
      const L = G.L;
      if (L.zNear && !G.zNear0) {   // her şey bağlı ama sayılar tutmuyor: rozet nabız atar, bölümde bir kez bildirim
        G.zPulse = now; api.kick();
        if (!G.zWarn) { G.zWarn = 1; api.haptic('light'); api.toast(`Sınırdan ${G.zone.B} hat geçmeli, ${G.zone.T} tampon olmalı`); }
      } else if ((L.zt | 0) > G.zt0 && !api.save.zoneTold) {   // ilk tampon: ömürde bir kez açıklama
        api.save.zoneTold = 1; api.persist(); api.toast('Sınırda biten ray tampon olur · rozetteki sayıya bak');
      }
    },
    // rozet tahtanın üstünde (karoların üstünde değil): kenar payı
    pad(G, p) { p.t = Math.max(p.t, .62); },
    // kesikli kare: karolar arası boşlukta, tek yol. Karanlık tünelde örtünün üstünde (top) çizilir, yoksa rayların altında
    under(D) { if (!D.G.fog || D.G.won) this.edge(D); },
    edge(D) {
      const { G, s, cx, pal } = D, { ox, oy } = api.vg, [x0, y0, x1, y1] = box(G), ok = G.L.zb === G.zone.B && G.L.zt === G.zone.T;
      cx.beginPath(); cx.rect(ox + x0 * s, oy + y0 * s, (x1 - x0 + 1) * s, (y1 - y0 + 1) * s);
      cx.lineCap = 'butt'; cx.setLineDash([s * .16, s * .1]); cx.lineDashOffset = -s * .05;
      cx.lineWidth = Math.max(1.5, s * .045); cx.strokeStyle = ok ? D.col : pal.mut; cx.stroke();
      cx.setLineDash([]); cx.lineDashOffset = 0; cx.lineCap = 'round';
    },
    // geçitte bilet kapısı (rayın iki yanında iki direk) · tamponda rayın ucunda çubuk ve iki nokta. Yanan hat renginde, sönük gri. Renk başına 1–2 çağrı
    over(D) {
      const { G, s, cx, pal, vis, own, OC, on } = D, pr = G.zone.pr, { ox, oy } = api.vg, m = G.cur, gates = new Map(), bufs = new Map();
      const add = (M, c, f) => { (M.get(c) || M.set(c, []).get(c)).push(f); };
      for (let p = 0; p < pr.length; p += 3) {
        const i = pr[p], k = pr[p + 1], j = pr[p + 2], u = arm(G, m, i, DIRS[k][0]), v = arm(G, m, j, DIRS[k][3]);
        if ((!u && !v) || !vis(i) || !vis(j)) continue;   // karanlık karonun kolunu ele vermesin
        // sınır noktası: i ile j arasındaki kenarın ortası
        const bx = ox + (i % G.cols) * s + s / 2 + DIRS[k][1] * s / 2, by = oy + (i / G.cols | 0) * s + s / 2 + DIRS[k][2] * s / 2, hz = DIRS[k][1] !== 0;
        if (u && v) { add(gates, on(i) ? OC[own(i)] : on(j) ? OC[own(j)] : null, [bx, by, hz]); continue; }
        const t = u ? i : j, sg = u ? 1 : -1;
        add(bufs, on(t) ? OC[own(t)] : null, [bx - (hz ? sg * s * .07 : 0), by - (hz ? 0 : sg * s * .07), hz]);
      }
      const g = s * .17, l = s * .1;
      for (const [c, L] of gates) {
        cx.beginPath();
        for (const [x, y, hz] of L) for (const e of [-1, 1]) hz ? (cx.moveTo(x - l, y + e * g), cx.lineTo(x + l, y + e * g)) : (cx.moveTo(x + e * g, y - l), cx.lineTo(x + e * g, y + l));
        cx.lineWidth = s * .06; cx.strokeStyle = c || pal.mut; cx.stroke();
      }
      const h = s * .19, r = s * .045;
      for (const [c, L] of bufs) {
        cx.beginPath(); for (const [x, y, hz] of L) hz ? (cx.moveTo(x, y - h), cx.lineTo(x, y + h)) : (cx.moveTo(x - h, y), cx.lineTo(x + h, y));
        cx.lineWidth = s * .085; cx.strokeStyle = c || pal.mut; cx.stroke();
        cx.beginPath(); for (const [x, y, hz] of L) for (const e of [-1, 1]) { const px = hz ? x : x + e * h, py = hz ? y + e * h : y; cx.moveTo(px + r, py); cx.arc(px, py, r, 0, 7); }
        cx.fillStyle = pal.bg; cx.fill();
      }
    },
    // rozet: bölgenin üstünde, tahta dışında. İki hap: ⇄ geçiş b/B · ⊣ tampon t/T. Tutan hap dolu (biçim), tutmayan çerçeveli. Tünel ağzı üst sekmesiyle çakışırsa yana kayar.
    top(D) {
      const { G, s, cx, pal, now, col } = D;
      if (G.fog && !G.won) this.edge(D);
      const { ox, oy } = api.vg, [x0, , x1] = box(G), Z = G.zone, L = G.L, pw = s * 1.12, ph = s * .4, gap = s * .14, W = pw * 2 + gap;
      const tabs = (G.portal || []).flatMap(p => [[p.a, p.ka], [p.b, p.kb]]).filter(([, k]) => k === 0).map(([i]) => ox + (i % G.cols) * s + s / 2);
      const hit = c => tabs.some(t => Math.abs(t - c) < W / 2 + s * .3);
      const lo = ox + W / 2, hi = ox + G.cols * s - W / 2, c0 = ox + (x0 + x1 + 1) * s / 2;
      let cxm = c0;
      for (const d of [0, 1, -1, 2, -2, 3, -3, 4, -4]) { const a = Math.min(Math.max(c0 + d * s, lo), hi); if (!hit(a)) { cxm = a; break; } }
      const t = G.zPulse ? (now - G.zPulse) / 900 : 1, sc = t < 1 ? 1 + .12 * Math.sin(Math.min(1, t * 2) * Math.PI) : 1;
      const y = oy - s * .33; G.zBadge = [cxm - W / 2, y - ph / 2, cxm + W / 2, y + ph / 2];   // robot: tahta dışında mı
      // karanlık tünelde yalnız iki yanı görünen kenarlar sayılır (görünmeyen karonun kolu ele verilmez)
      const [vb, vt] = G.fog && !G.won ? count(G, G.cur, D.vis) : [L.zb | 0, L.zt | 0], items = [[vb, Z.B, iconX], [vt, Z.T, iconT]];
      cx.font = `800 ${Math.round(Math.max(10, s * .25))}px Outfit, system-ui`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
      items.forEach(([v, K, ic], q) => {
        const x = cxm - W / 2 + pw / 2 + q * (pw + gap), w = pw * sc, hh = ph * sc, ok = v === K, fg = ok ? (col[0] === '#' && api.lum(col) > .5 ? '#16182a' : '#fff') : pal.fg;
        cx.beginPath(); D.rrp(x - w / 2, y - hh / 2, w, hh, hh / 2);
        if (ok) { cx.fillStyle = col; cx.fill(); } else { cx.fillStyle = pal.bg; cx.fill(); cx.lineWidth = 1.5; cx.strokeStyle = t < 1 ? G.warn : pal.mut; cx.stroke(); }
        cx.beginPath(); ic(cx, x - pw * .27, y, s * .11); cx.lineWidth = Math.max(1.5, s * .045); cx.strokeStyle = fg; cx.stroke();
        cx.fillStyle = fg; cx.fillText(`${v}/${K}`, x + pw * .14, y + 1);
      });
      cx.textBaseline = 'alphabetic';
      return t < 1;
    },
    card: {
      name: 'Tarife bölgesi', tag: 'Yeni: tarife bölgesi',
      demo: '<div class="rd-zone" aria-hidden="true"><svg viewBox="0 0 100 100"><rect class="rd-zone-b" x="20" y="20" width="60" height="60" rx="3"/>' +
        '<path class="rd-zone-r" d="M50 50H100M50 50V20"/><path class="rd-zone-x" pathLength="10" d="M50 50H100"/><path class="rd-zone-y" pathLength="10" d="M50 50V20"/>' +
        '<path class="rd-zone-g" d="M74 41H86M74 59H86"/><path class="rd-zone-t" d="M42 23H58"/><rect class="rd-zone-h" x="43" y="43" width="14" height="14" rx="4"/></svg>' +
        '<i class="rd-zone-c">⇄ 1/1</i><i class="rd-zone-c rd-zone-c2">⊣ 1/1</i></div>',
      text: 'Merkezi saran <b>kesikli karenin</b> sınırında ray ya <b>geçer</b> ya <b>tamponla biter</b>. Geçiş ve tampon sayısı <b>rozettekiyle</b> aynı olmalı.',
    },
    // temel (animasyonsuz) stil bitmiş hâli gösterir → azaltılmış harekette kart boş kalmaz
    css: `.rd-zone{position:relative;align-self:center;width:100px;height:124px;margin:6px 0 2px}
.rd-zone svg{display:block;width:100px;height:100px;fill:none;stroke-linecap:round}
.rd-zone-b{stroke:var(--mut);stroke-width:2.4;stroke-dasharray:6 4}
.rd-zone-r{stroke:var(--railC);stroke-width:8}
.rd-zone-x,.rd-zone-y{stroke:var(--acc);stroke-width:8;stroke-dasharray:10 10}
.rd-zone-x{animation:rd-zone-x 4.4s ease-in-out infinite}.rd-zone-y{animation:rd-zone-y 4.4s ease-in-out infinite}
.rd-zone-g{stroke:var(--acc);stroke-width:3;animation:rd-zone-g 4.4s infinite}
.rd-zone-t{stroke:var(--acc);stroke-width:5;animation:rd-zone-t 4.4s infinite}
.rd-zone-h{fill:var(--acc);stroke:none}
.rd-zone-c{position:absolute;bottom:0;left:0;width:47px;height:20px;border-radius:10px;font:800 11px/20px Outfit,system-ui;font-style:normal;text-align:center;color:var(--onacc);background:var(--acc);animation:rd-zone-c 4.4s infinite}
.rd-zone-c2{left:auto;right:0;animation-name:rd-zone-c2}
@keyframes rd-zone-x{0%,8%{stroke-dashoffset:10}30%,90%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}
@keyframes rd-zone-y{0%,40%{stroke-dashoffset:10}60%,90%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}
@keyframes rd-zone-g{0%,22%{opacity:0}30%,90%{opacity:1}100%{opacity:0}}
@keyframes rd-zone-t{0%,55%{opacity:0}62%,90%{opacity:1}100%{opacity:0}}
@keyframes rd-zone-c{0%,26%{background:var(--tile);color:var(--fg);box-shadow:inset 0 0 0 1.5px var(--mut)}32%,92%{background:var(--acc);color:var(--onacc);box-shadow:none}100%{background:var(--tile);color:var(--fg)}}
@keyframes rd-zone-c2{0%,58%{background:var(--tile);color:var(--fg);box-shadow:inset 0 0 0 1.5px var(--mut)}64%,92%{background:var(--acc);color:var(--onacc);box-shadow:none}100%{background:var(--tile);color:var(--fg)}}
.modal:not(.open) .rd-zone *{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.rd-zone *{animation:none!important}}`,
  };
});
