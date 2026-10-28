// M18 · Nehir (anahtar: river) — kuralın tamamı bu dosyada. Sözleşme: docs/kurallar/README.md · tasarım: docs/kurallar/nehir.md
// Tahtayı baştan başa kesen bir nehir çizgisi (karo aralığı). Nehir kenarında iki karo da kollu → ray GEÇİTTEN geçer;
// yalnız biri kollu → ray kıyıda TAMPONLA biter (açık uç sayılmaz, open kancası). Kıyıda tam T tampon olmalı (check).
// Sayım: kol toplamı = 2(n − h) + T. Açık uç yok, hepsi bağlı ve karışmamışsa tampon sayısı T − 2·(döngü sayısı) olur → eksik tampon = döngü.
(window.RAY_RULES = window.RAY_RULES || []).push(api => {
  const { DIRS, popc, nb } = api, TAU = Math.PI * 2;
  const bit = k => DIRS[k][0];
  // nehir kenarı çiftleri [i, k, j]: i solda/üstte, k = D (1) ya da G (2), j karşı kıyı. P.river.a: sınır (dikeyde sütun, yatayda satır)
  const pairsOf = R => R.pairs || (R.pairs = (() => {
    const out = [], { cols, rows, vert, a } = R;
    if (vert) for (let y = 0; y < rows; y++) out.push([y * cols + a - 1, 1, y * cols + a]);
    else for (let x = 0; x < cols; x++) out.push([(a - 1) * cols + x, 2, a * cols + x]);
    return out;
  })());
  // i karosunun k kolu nehre mi bakıyor (iki yönde de)
  const onRiver = (R, i, k) => {
    const x = i % R.cols, y = i / R.cols | 0;
    return R.vert ? (k === 1 && x === R.a - 1) || (k === 3 && x === R.a) : (k === 2 && y === R.a - 1) || (k === 0 && y === R.a);
  };
  // o anki kıyı durumu: geçit (iki kol), tampon (tek kol) sayısı ve tampon uçları
  const shore = (P, m = P.cur) => {
    const g = [], t = [];
    for (const [i, k, j] of pairsOf(P.river)) {
      const u = !!(m[i] & bit(k)), v = !!(m[j] & bit(k ^ 2));
      if (u && v) g.push([i, k, j]); else if (u) t.push([i, k]); else if (v) t.push([j, k ^ 2]);
    }
    return { g, t };
  };
  const ICON = '<svg class="rd-river-i" viewBox="0 0 20 20"><path d="M3 4v12M3 10h9M16 3c-3 3 3 4 0 7s3 4 0 7"/></svg>';
  return {
    key: 'river', line: 17, boost: 3.5,
    // köprü: bölünmüş düğüm kıyıda belirsiz · tabla: karoları iki yaka arasında taşır · tarife bölgesi: aynı mekanizma (yumuşak sınır + sayım) · halka: iki kart zıt sezgi verir ("bir kez kapan" ↔ "eksik tampon = döngü")
    clash: ['bridge', 'table', 'zone', 'ring'],
    // tanıtım (749, 6×8): 1 tampon · sonra 2
    amount: (n, intro) => intro ? 1 : 2,
    // ağaçtan sonra, karıştırmadan önce: çizgiyi seç, T tampon kolu ekle
    tree(C) {
      const { cols, rows, n, sol, R, hub, hub2 } = C;
      // aday çizgiler: kenara yapışık değil (a ∈ 2..L−2), merkez(ler)e değmez (merkez sütunu/satırı a−1 ya da a değil)
      const hx = [hub, hub2].filter(h => h >= 0).map(h => [h % cols, h / cols | 0]), lines = [];
      for (let a = 2; a <= cols - 2; a++) if (hx.every(([x]) => x !== a - 1 && x !== a)) lines.push([true, a]);
      for (let a = 2; a <= rows - 2; a++) if (hx.every(([, y]) => y !== a - 1 && y !== a)) lines.push([false, a]);
      for (let k = lines.length - 1; k > 0; k--) { const j = R() * (k + 1) | 0; [lines[k], lines[j]] = [lines[j], lines[k]]; }
      const want = Math.max(1, C.x.river);
      for (const [vert, a] of lines) {
        const Rv = { cols, rows, vert, a }, cand = [];
        // tampon adayı: sol'de iki yan da kolsuz kenarın bir ucu; merkez, keep (tünel ağzı, köprü) ve 3+ kollu karo olmaz
        for (const [i, k, j] of pairsOf(Rv)) if (!(sol[i] & bit(k)) && !(sol[j] & bit(k ^ 2))) for (const [c, kk] of [[i, k], [j, k ^ 2]]) if (!C.isHub(c) && !C.keep[c] && popc(sol[c]) <= 2) cand.push([c, kk, i]);
        if (new Set(cand.map(e => e[2])).size < want) continue;
        // want tampon: her biri ayrı kenarda ve ayrı karoda
        const at = [], used = new Set();
        for (let t = 0; t < want; t++) {
          const Q = cand.filter(([c, , e]) => !used.has(e) && !at.some(([q]) => q === c));
          if (!Q.length) break;
          const [c, kk, e] = Q[R() * Q.length | 0]; at.push([c, kk]); used.add(e);
        }
        if (at.length < want) continue;
        for (const [c, kk] of at) sol[c] |= bit(kk);
        C.out.river = { cols, rows, vert, a, T: at.length, at };
        return;
      }
      // çizgi kurulamadı (küçük ızgara / iki merkez): out.river yok, bölüm nehirsiz
    },
    // sayaçtan sonra: oyuncunun gördüğüyle tek çözüm mü? (çözücünün yaprağında çözüm say; aday kümeleri başlangıç yönüne bağlı değil,
    // karanlık ve "çözülmüş gelmesin" yalnız yön değiştirir → burada saymak yeterli). İkinci çözüm varsa aday reddedilir (pick başkasını seçer). R() tüketmez.
    mark(C) {
      if (!C.out.river) return;
      const P = { ...C, ...C.out, cur: C.cur.slice() }; let k = 0;
      api.difficulty(P, cfg => (api.lit({ ...P, cur: cfg }).solved && k++, k > 1));
      if (k > 1) C.out.reject = true;
    },
    open: (P, i, k) => onRiver(P.river, i, k),
    // L.rvNear: temel denetim tamam (hepsi bağlı, açık uç yok, karışma yok) ama tampon sayısı tutmuyor → döngü var
    check(P, L) { const bad = L.open === P.river.T ? 0 : 1; L.rvNear = !!bad && L.solved; return bad; },
    // çözücü: her kıyı kenarı ya geçit/boş (eşleşir) ya tampon (eşleşmez). Σ zorunlu tampon ≤ T ≤ Σ olası tampon;
    // alt sınır T'ye eşitse olası tamponlar eşleşmeli, üst sınır T'ye eşitse olası tamponların hepsi tampon olmalı.
    prune(P, C, M, unit) {
      const T = P.river.T, pr = pairsOf(P.river), st = [];
      let lo = 0, hi = 0;
      for (const [i, k, j] of pr) {
        const ub = bit(k), vb = bit(k ^ 2), A = C[unit[i]].map(r => !!(M[i][r] & ub)), B = C[unit[j]].map(r => !!(M[j][r] & vb));
        const a1 = A.includes(true), a0 = A.includes(false), b1 = B.includes(true), b0 = B.includes(false);
        const mis = (a1 && b0) || (a0 && b1), mat = (a1 && b1) || (a0 && b0);
        if (!mat) lo++; if (mis) hi++;
        st.push(mis && mat);
      }
      if (lo > T || hi < T) return -1;
      if (lo < T && hi > T) return [];
      const ch = new Set(), want = lo === T ? 'match' : 'mis';
      pr.forEach(([i, k, j], e) => {
        if (!st[e]) return;
        const ub = bit(k), vb = bit(k ^ 2), ui = unit[i], uj = unit[j];
        if (ui === uj) return;   // eşli karo iki yakada: birim içi ilişki, süzme (güvenli taraf)
        const Av = new Set(C[ui].map(r => !!(M[i][r] & ub))), Bv = new Set(C[uj].map(r => !!(M[j][r] & vb)));
        // eşleş: kolum karşının olası değerlerinden biri · eşleşme: karşının olası tersinden biri
        const ok = (v, S) => want === 'match' ? S.has(v) : S.has(!v);
        const fi = C[ui].filter(r => ok(!!(M[i][r] & ub), Bv)), fj = C[uj].filter(r => ok(!!(M[j][r] & vb), Av));
        if (fi.length < C[ui].length) { C[ui] = fi; ch.add(ui); }
        if (fj.length < C[uj].length) { C[uj] = fj; ch.add(uj); }
      });
      return [...ch];
    },
    // dokunuştan önceki hâl (engellemez): after() geçişleri buna göre bulur
    block(G) { G.rvWas = shore(G).t.length; G.rvNear0 = !!G.L.rvNear; },
    after(G, i, now) {
      const L = G.L, T = G.river.T;
      // her şey bağlı, açık uç yok ama tampon eksik → döngü var. Rozet nabız atar, bölümde bir kez bildirim.
      if (L.rvNear && !G.rvNear0) {
        G.rvPulse = now; api.kick();
        if (!G.rvWarn) { G.rvWarn = 1; api.haptic('light'); api.toast(`Kıyıda ${T} tampon olmalı · eksikse bir yerde döngü var`); }
      } else if (shore(G).t.length > G.rvWas && !L.solved) {
        api.tone(api.note(5), .22, .022, 'triangle');
        if (!api.save.riverTold) { api.save.riverTold = 1; api.persist(); api.toast('Tampon · ray kıyıda bitti'); }
      }
    },
    // rozet nehrin bir ucunda, tahta dışında
    pad(G, p) { if (G.river.vert) p.t = Math.max(p.t, .5); else p.l = Math.max(p.l, .5); },
    // nehir: karo aralığında dalgalı çizgi (biçim renk körü için belirleyici) + geçitte tabliye. Raylardan önce.
    under(D) {
      const { G, s, X, cx, pal } = D, R = G.river, c = G.cols, r = G.rows;
      // sınırın başı ve sonu (karo merkezlerinden; animasyon merkezi kaydırmaz)
      const p0 = R.vert ? [X[R.a][0] - s / 2, X[R.a][1] - s / 2 - s * .32] : [X[(R.a) * c][0] - s / 2 - s * .32, X[R.a * c][1] - s / 2];
      const len = (R.vert ? r : c) * s + s * .32, amp = s * .045, wl = s * .5, steps = Math.ceil(len / (s * .0625));
      const wave = (off = 0) => { cx.beginPath(); for (let q = 0; q <= steps; q++) { const t = q / steps * len, w = Math.sin(t / wl * TAU + off) * amp; R.vert ? (q ? cx.lineTo : cx.moveTo).call(cx, p0[0] + w, p0[1] + t) : (q ? cx.lineTo : cx.moveTo).call(cx, p0[0] + t, p0[1] + w); } };
      const blue = pal.light ? '#1f7fd6' : '#4cc9ff';
      wave(); cx.lineWidth = s * .2; cx.strokeStyle = api.rgba(blue, pal.light ? .16 : .14); cx.stroke();
      cx.lineWidth = s * .055; cx.strokeStyle = blue; cx.stroke();
      // geçit tabliyesi: iki kollu kenarda, nehrin üstünde küçük plaka (rayın altında kalır)
      const S = shore(G); G.rvS = S;
      if (S.g.length) {
        cx.beginPath();
        for (const [i] of S.g) { const [x, y] = X[i], bx = R.vert ? x + s / 2 : x, by = R.vert ? y : y + s / 2, w = s * (R.vert ? .3 : .42), h = s * (R.vert ? .42 : .3); D.rrp(bx - w / 2, by - h / 2, w, h, s * .06); }
        cx.fillStyle = pal.tile; cx.fill(); cx.lineWidth = Math.max(1, s * .03); cx.strokeStyle = pal.mut; cx.stroke();
      }
    },
    // tampon: kolun kıyıdaki ucunda dik çubuk + iki cıvata (rayın üstünde). Rozet: ⊣ görünen tampon / T (kazanınca hepsi yanar, sayı L.open'a eşit).
    over(D) {
      const { G, s, X, cx, pal, vis, on, own, OC, now } = D, R = G.river, S = G.rvS || shore(G), T = R.T;
      let busy = false;
      const ends = S.t.filter(([i]) => vis(i)), at = ([i, k]) => { const [x, y] = X[i], [, dx, dy] = DIRS[k], o = s * .4; return [x + dx * o, y + dy * o, dx]; };
      for (const lit of [false, true]) {
        const E = ends.filter(([i]) => on(i) === lit); if (!E.length) continue;
        cx.beginPath();
        for (const e of E) { const [x, y, dx] = at(e), h = s * .17; dx ? (cx.moveTo(x, y - h), cx.lineTo(x, y + h)) : (cx.moveTo(x - h, y), cx.lineTo(x + h, y)); }
        cx.lineWidth = s * .075; cx.lineCap = 'butt'; cx.strokeStyle = lit ? pal.fg : pal.mut; cx.stroke(); cx.lineCap = 'round';
        cx.beginPath();
        for (const e of E) { const [x, y, dx] = at(e), h = s * .17, rr = s * .045; for (const q of [-1, 1]) { const px = dx ? x : x + q * h, py = dx ? y + q * h : y; cx.moveTo(px + rr, py); cx.arc(px, py, rr, 0, TAU); } }
        cx.fillStyle = lit ? OC[own(E[0][0])] || G.color : pal.mut; cx.fill();
      }
      // rozet
      const n = ends.length, okc = n === T, x0 = R.vert ? X[R.a][0] - s / 2 : X[R.a * G.cols][0] - s / 2 - s * .3, y0 = R.vert ? X[R.a][1] - s / 2 - s * .3 : X[R.a * G.cols][1] - s / 2;
      const w = R.vert ? s * .78 : s * .5, h = R.vert ? s * .42 : s * .78, bx = x0 - w / 2, by = y0 - h / 2;
      const t = G.rvPulse ? (now - G.rvPulse) / 900 : 1;
      if (t < 1) { const u = t * 2 % 1, k = 1 + .35 * api.ease(u); cx.beginPath(); D.rrp(x0 - w * k / 2, y0 - h * k / 2, w * k, h * k, s * .2); cx.lineWidth = s * .05; cx.strokeStyle = api.rgba(G.warn, .9 * (1 - u)); cx.stroke(); busy = true; }
      cx.beginPath(); D.rrp(bx, by, w, h, s * .2); cx.fillStyle = okc ? G.color : pal.bg; cx.fill(); cx.lineWidth = 1.5; cx.strokeStyle = okc ? G.color : pal.mut; cx.stroke();
      const fg = okc ? (api.lum(G.color) > .5 ? '#16182a' : '#fff') : pal.fg;
      // simge: dik çubuk + kısa ray (⊣)
      const ix = R.vert ? bx + s * .16 : x0, iy = R.vert ? y0 : by + s * .17, g = s * .09;
      cx.beginPath(); cx.moveTo(ix - g, iy); cx.lineTo(ix + g * .6, iy); cx.moveTo(ix + g * .6, iy - g); cx.lineTo(ix + g * .6, iy + g);
      cx.lineWidth = s * .045; cx.strokeStyle = fg; cx.stroke();
      cx.font = `800 ${Math.round(Math.max(10, s * .22))}px Outfit, system-ui`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = fg;
      cx.fillText(`${n}/${T}`, R.vert ? bx + w * .62 : x0, R.vert ? y0 + 1 : by + h * .66);
      cx.textBaseline = 'alphabetic';
      return busy;
    },
    card: {
      name: 'Nehir', tag: 'Yeni: nehir',
      demo: '<div class="rd-river" aria-hidden="true"><svg viewBox="0 0 100 100">' + [[3, 3], [53, 3], [3, 53], [53, 53]].map(([x, y]) => `<rect class="rd-river-t" x="${x}" y="${y}" width="44" height="44" rx="11"/>`).join('') +
        '<path class="rd-river-w" d="M50 -2c-4 6 4 10 0 16s4 10 0 16s4 10 0 16s4 10 0 16s4 10 0 16s4 10 0 16s4 10 0 16"/>' +
        '<rect class="rd-river-g" x="43" y="18" width="14" height="14" rx="3"/>' +
        '<path class="rd-river-r" d="M25 25H50"/><path class="rd-river-r rd-river-a" d="M50 25H75"/>' +
        '<path class="rd-river-r rd-river-b" d="M25 75H46"/><path class="rd-river-s" d="M44 66v18"/></svg><b class="rd-river-c">1/1</b></div>',
      text: `Ray <b>nehri</b> geçitten geçer ya da kıyıda <b>tamponla</b> ${ICON} biter. Kıyıda tam <b>rozetteki sayı</b> kadar tampon olmalı; eksikse bir yerde <b>döngü</b> vardır.`,
    },
    // temel (animasyonsuz) stil son hâli gösterir: geçit kurulmuş, tampon yerinde, rozet 1/1
    css: `.rd-river{position:relative;align-self:center;width:100px;height:100px;margin:6px 0 2px}
.rd-river svg{display:block;width:100%;height:100%;fill:none;stroke-linecap:round;stroke-linejoin:round;overflow:visible}
.rd-river-t{fill:var(--tile);stroke:var(--stroke)}
.rd-river-w{stroke:#4cc9ff;stroke-width:3.2}
.rd-river-g{fill:var(--tile);stroke:var(--mut);stroke-width:1.5;animation:rd-river-a 4.4s infinite}
.rd-river-r{stroke:var(--acc);stroke-width:8.5}
.rd-river-a{transform-box:fill-box;transform-origin:100% 50%;animation:rd-river-a 4.4s infinite}
.rd-river-b{transform-box:view-box;transform-origin:25px 75px;animation:rd-river-b 4.4s infinite}
.rd-river-s{stroke:var(--fg);stroke-width:4;stroke-linecap:butt;animation:rd-river-c 4.4s infinite}
.rd-river-c{position:absolute;right:-30px;top:-4px;padding:1px 6px;border-radius:9px;font-size:12px;font-weight:800;background:var(--acc);color:var(--onacc);animation:rd-river-c 4.4s infinite}
.rd-river-i{display:inline-block;width:1.1em;height:1.1em;vertical-align:-.2em;fill:none;stroke:var(--fg);stroke-width:2;stroke-linecap:round}
@keyframes rd-river-a{0%,12%{opacity:0;transform:rotate(-90deg)}28%,100%{opacity:1;transform:none}}
@keyframes rd-river-b{0%,40%{transform:rotate(90deg)}56%,100%{transform:none}}
@keyframes rd-river-c{0%,56%{opacity:0}64%,100%{opacity:1}}
.modal:not(.open) .rd-river *{animation-play-state:paused}`,
  };
});
