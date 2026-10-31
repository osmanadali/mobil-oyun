// M18 · Halka hat (anahtar: ring) — kuralın tamamı bu dosyada. Sözleşme: docs/kurallar/README.md · tasarım: docs/kurallar/halka.md
// Çözüm ağaç değil: ağaca bir kenar eklenir → tek döngü (halka). Halka kesik çemberli karo(lar)dan geçmeli.
// Kazanma: yanan çizgenin 2-çekirdeği (uçlar soyulunca kalan) işaretleri içermeli. Açık ucu olmayan, karışmamış her dizilimde tam bir döngü vardır.
(window.RAY_RULES = window.RAY_RULES || []).push(api => {
  // bildirimler (L burada küresel çeviri; after içinde L = G.L gölgeler)
  const MSG = { warn: L('Halka kesik çemberli karodan geçmeli', 'The loop must pass the dashed-ring tile'), told: L('Halka çemberli karodan geçti · çember doldu', 'The loop passed the ring tile · the ring fills') };
  const { DIRS, rot, nb, ob, tree, popc } = api, TAU = Math.PI * 2;
  const per = m => rot(m) === m ? 1 : rot(rot(m)) === m ? 2 : 4;
  // i karosunun j komşusuna karşılıklı bağlı kolları (f(j) süzgeci)
  const arms = (P, i, f) => { let m = 0; for (let k = 0; k < 4; k++) { const b = DIRS[k][0], j = b & P.cur[i] ? nb(P, i, k) : -1; if (j >= 0 && f(j) && (P.cur[j] & ob(P, i, k))) m |= b; } return m; };
  const ICON = '<svg class="rd-ring-i" viewBox="0 0 20 20"><circle cx="10" cy="10" r="7"/></svg>';
  return {
    key: 'ring', line: 17, ord: 16, boost: 3.5, clash: ['sign', 'bridge'],
    // 6×8 (M18'in ilk 3 bölümü, testere dişi) → 1 işaret; 7×9 → 2
    amount: (n, intro) => intro || n < 63 ? 1 : 2,
    // ağaçtan sonra, karıştırmadan önce (tünel tOrder 0 ile önce çalışır, C.adj hazır): ağaca bir kenar ekle, işaretleri ayır
    tree(C) {
      const { sol, n, R } = C, T = tree(C, sol), hi = n < 63 ? 12 : 20, all = [], ok = [];
      for (let a = 0; a < n; a++) for (let k = 0; k < 4; k++) {
        const b = C.nb(a, k), bit = DIRS[k][0];
        if (b <= a || (sol[a] & bit) || C.isHub(a) || C.isHub(b) || C.br?.includes(a) || C.br?.includes(b) || !T.ow[a] || T.ow[a] !== T.ow[b]) continue;
        const o = C.ob(a, k); if (sol[b] & o) continue;
        // döngü: a → ortak ata ← b
        let u = a, v = b; const pu = [a], pv = [b];
        while (u !== v) T.dep[u] >= T.dep[v] ? pu.push(u = T.pa[u]) : pv.push(v = T.pa[v]);
        pv.pop(); const e = { a, b, bit, o, cyc: pu.concat(pv.reverse()) };
        all.push(e); if (e.cyc.length >= 8 && e.cyc.length <= hi) ok.push(e);
      }
      const pool = ok.length ? ok : all; if (!pool.length) return;   // halka kurulamaz → out.ring yok, bölüm halkasız
      const e = pool[R() * pool.length | 0], cyc = e.cyc, L = cyc.length;
      sol[e.a] |= e.bit; sol[e.b] |= e.o;
      // işaret burada ayrılır (keep + busy): sabit, eşli, ters, sayaçlı ve birimler dokunmaz → hep çıplak karo. Merkez, tünel ağzı ve 4'lü kavşak olmaz.
      let cand = cyc.filter(i => !C.isHub(i) && !C.keep[i] && per(sol[i]) > 1);
      if (!cand.length) cand = cyc.filter(i => !C.isHub(i));
      const mark = new Array(n).fill(false), at = [];
      for (let k = 0; k < C.x.ring && cand.length; k++) {
        // ikinci işaret halkanın öbür yanından (döngüde en az L/3 uzakta, yoksa herhangi)
        const far = cand.filter(i => at.every(p => { const d = Math.abs(cyc.indexOf(i) - p); return Math.min(d, L - d) * 3 >= L; })), pool2 = far.length ? far : cand;
        const i = pool2[R() * pool2.length | 0]; cand.splice(cand.indexOf(i), 1);
        mark[i] = true; at.push(cyc.indexOf(i)); C.keep[i] = C.busy[i] = true;
      }
      C.out.ring = { mark, cyc };
    },
    // sayaçtan sonra: işaret karosu serbest kalır (karanlık yalnızlaştırma ve "çözülmüş gelmesin" çevirebilir).
    // Karışık başlangıçta işaret bir döngüdeyse (ör. 2×2 küçük halka) karo çevrilir → oyun kesik çemberle başlar. R() tüketmez.
    mark(C) {
      const g = C.out.ring; if (!g) return;
      const P = { ...C, ring: g }, L0 = { d: C.cur.map(() => 0) }, onCyc = i => (this.check(P, L0), L0.core[i]);
      g.mark.forEach((v, i) => {
        if (!v) return; C.busy[i] = false;
        for (let k = 0; k < 3 && onCyc(i); k++) C.cur[i] = rot(C.cur[i]);
      });
    },
    // lit() ve zorluk yaprağı, O(n). L.core: 2-çekirdek · L.rc: işaret taşıyan basit döngülerin karoları · L.rOn: o döngülerdeki işaret sayısı
    // L.ringNear: temel denetim tamam (açık uç yok, hepsi yanıyor, karışma yok) ama halka işaretten geçmiyor
    check(P, L) {
      const { cur } = P, n = cur.length, d = L.d, mk = P.ring.mark, dg = new Uint8Array(n), core = new Uint8Array(n), q = [];
      for (let i = 0; i < n; i++) if (d[i] >= 0) { core[i] = 1; if ((dg[i] = popc(arms(P, i, j => d[j] >= 0))) < 2) q.push(i); }
      while (q.length) {   // derecesi ≤ 1 olanları soy
        const i = q.pop(); if (!core[i]) continue; core[i] = 0;
        for (let k = 0; k < 4; k++) { const j = DIRS[k][0] & cur[i] ? nb(P, i, k) : -1; if (j >= 0 && core[j] && (cur[j] & ob(P, i, k)) && --dg[j] < 2) q.push(j); }
      }
      let bad = 0, on = 0, rc = null, seen = null;
      for (let i = 0; i < n; i++) if (mk[i]) {
        if (!core[i]) { bad++; continue; }
        if (seen?.[i]) { if (rc?.[i]) on++; continue; }
        // işaretin çekirdek bileşeni: her karonun derecesi 2 ise basit döngü
        seen = seen || new Uint8Array(n); const st = [i], cc = [i]; let simple = true; seen[i] = 1;
        while (st.length) { const u = st.pop(); if (dg[u] !== 2) simple = false; for (let k = 0; k < 4; k++) { const j = DIRS[k][0] & cur[u] ? nb(P, u, k) : -1; if (j >= 0 && core[j] && !seen[j] && (cur[j] & ob(P, u, k))) { seen[j] = 1; st.push(j); cc.push(j); } } }
        if (simple) { rc = rc || new Uint8Array(n); for (const u of cc) rc[u] = 1; on++; }
      }
      L.core = core; L.rc = rc; L.rOn = on; L.ringNear = bad > 0 && L.solved;
      return bad;
    },
    // dokunuştan önceki hâl (hiç engellemez): after() geçişi buna göre bulur
    block(G) { G.ringWas = G.L.rOn | 0; G.ringNear0 = !!G.L.ringNear; },
    after(G, i, now) {
      const L = G.L;
      if (L.ringNear && !G.ringNear0) {   // her şey bağlı ama halka işaretten geçmiyor: işaret nabız atar, bölümde bir kez bildirim
        G.ringPulse = now; G.ring.mark.forEach((v, j) => v && !L.rc?.[j] && api.press.set(j, now)); api.kick();
        if (!G.ringWarn) { G.ringWarn = 1; api.haptic('light'); api.toast(MSG.warn); }
      } else if ((L.rOn | 0) > G.ringWas && !L.solved) {
        // işaret halkaya girdi: çember dolar + yumuşak ton. Kutlama yok (asıl halka henüz bu olmayabilir; kutlama kazanınca), açıklama ömürde bir kez.
        api.tone(api.note(10), .3, .026, 'sine', .1);
        if (!api.save.ringTold) { api.save.ringTold = 1; api.persist(); api.toast(MSG.told); }
      }
    },
    // çift ray: işaretli halkanın kollarına ince zemin çizgisi (tek yol)
    rails(D) {
      const { G, s, X, vis, cx, pal, n } = D, rc = G.L.rc; if (!rc) return;
      cx.beginPath();
      for (let i = 0; i < n; i++) if (rc[i] && vis(i)) D.railPath(X[i], arms(G, i, j => rc[j]));
      cx.lineWidth = s * .055; cx.strokeStyle = api.rgba(pal.bg, .6); cx.stroke();
    },
    // işaret: halkada değilken kesik + soluk, halkadayken hat renginde düz çember (zemin halkasıyla raydan ayrışır). Kare başına 3–5 çağrı.
    over(D) {
      const { G, s, X, vis, own, OC, cx, pal, now, n } = D, mk = G.ring.mark, rc = G.L.rc, r = s * .36;
      const path = (f, k = 1) => { cx.beginPath(); let c = 0; for (let i = 0; i < n; i++) if (mk[i] && vis(i) && f(i)) { const [x, y, , sc] = X[i], R = r * sc * k; cx.moveTo(x + R, y); cx.arc(x, y, R, 0, TAU); c++; } return c; };
      const off = i => !rc?.[i];
      let busy = false;
      if (path(off)) {
        cx.lineWidth = s * .085; cx.strokeStyle = api.rgba(pal.bg, .45); cx.stroke();
        const p = TAU * r / 18;   // 18 kesik: çevreye tam oturur
        cx.lineCap = 'butt'; cx.setLineDash([p * .56, p * .44]); cx.lineWidth = s * .045; cx.strokeStyle = pal.mut; cx.stroke();
        cx.setLineDash([]); cx.lineCap = 'round';
        // uyarı nabzı: iki kez dışa açılan halka
        const t = G.ringPulse ? (now - G.ringPulse) / 900 : 1;
        if (t < 1) { const u = t * 2 % 1; path(off, 1 + .32 * api.ease(u)); cx.lineWidth = s * .05; cx.strokeStyle = api.rgba(G.warn, .9 * (1 - u)); cx.stroke(); busy = true; }
      }
      if (rc && path(i => rc[i])) {
        cx.lineWidth = s * .12; cx.strokeStyle = pal.bg; cx.stroke();
        cx.lineWidth = s * .055;
        for (const t of [1, 2, 3]) if (path(i => rc[i] && own(i) === t)) { cx.strokeStyle = OC[t]; cx.stroke(); }
      }
      return busy;
    },
    card: {
      name: L('Halka hat', 'Loop line'), tag: L('Yeni: halka hat', 'New: loop line'),
      demo: '<div class="rd-ring" aria-hidden="true"><svg viewBox="0 0 100 100">' + [[3, 3], [53, 3], [3, 53], [53, 53]].map(([x, y]) => `<rect class="rd-ring-t" x="${x}" y="${y}" width="44" height="44" rx="11"/>`).join('') +
        ['r', 'p', 'in'].map(c => `<path class="rd-ring-${c}"${c === 'p' ? ' pathLength="100"' : ''} d="M50 75H25V25H75V75Z"/>`).join('') +
        ['m0', 'h', 'm1'].map(c => `<circle class="rd-ring-${c}" cx="75" cy="25" r="18"/>`).join('') + '</svg></div>',
      text: L(`Bu hatta raylar <b>bir kez</b> kendi üstüne kapanır ve <b>halka</b> olur. Halka <b>kesik çemberli</b> ${ICON} karodan geçmeli: geçince çember dolar.`,
        `On this line the track closes on itself <b>once</b> and forms a <b>loop</b>. The loop must pass the <b>dashed-ring</b> ${ICON} tile: then the ring fills.`),
    },
    // temel (animasyonsuz) stil KAPALI hâli gösterir → azaltılmış harekette de kart boş kalmaz
    css: `.rd-ring{align-self:center;width:100px;height:100px;margin:6px 0 2px}
.rd-ring svg{display:block;width:100%;height:100%;fill:none;stroke-linecap:round;stroke-linejoin:round}
.rd-ring-t{fill:var(--tile);stroke:var(--stroke)}
.rd-ring-r,.rd-ring-p{stroke:var(--railC);stroke-width:8.5}
.rd-ring-p{stroke:var(--acc);stroke-dasharray:100 100;animation:rd-ring-draw 4s ease-in-out infinite}
.rd-ring-in{stroke:var(--bg0);stroke-opacity:.6;stroke-width:2.6;animation:rd-ring-b 4s infinite}
.rd-ring-m0{stroke:var(--mut);stroke-width:2.4;stroke-linecap:butt;stroke-dasharray:3.52 2.76;opacity:0;animation:rd-ring-a 4s infinite}
.rd-ring-h{stroke:var(--bg0);stroke-width:6;animation:rd-ring-b 4s infinite}
.rd-ring-m1{stroke:var(--acc);stroke-width:2.8;transform-box:fill-box;transform-origin:center;animation:rd-ring-c 4s infinite}
.rd-ring-i{display:inline-block;width:1.05em;height:1.05em;vertical-align:-.18em;fill:none;stroke:var(--fg);stroke-width:2;stroke-dasharray:3 2.5}
@keyframes rd-ring-draw{0%,10%{stroke-dashoffset:100;opacity:1}50%,90%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}
@keyframes rd-ring-a{0%,49%{opacity:1}54%,94%{opacity:0}100%{opacity:1}}
@keyframes rd-ring-b{0%,49%{opacity:0}54%,90%{opacity:1}100%{opacity:0}}
@keyframes rd-ring-c{0%,49%{opacity:0;transform:scale(.7)}57%{opacity:1;transform:scale(1.14)}65%,90%{opacity:1;transform:none}100%{opacity:0;transform:none}}`,
  };
});
