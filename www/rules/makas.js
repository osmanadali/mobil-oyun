// M9 · Makas (sw). Sözleşme: docs/kurallar/README.md · tasarım ve kanıt: docs/kurallar/makas.md
// Karo dönmez: gövde sabit, öbür uç düz ↔ sapak. sw[i] = iki kolun maskesi, dokunuş cur ^= sw (kendi tersi → bölüm kilitlenemez).
(window.RAY_RULES = window.RAY_RULES || []).push(api => {
  const { DIRS, rot, unrot, popc } = api;
  const kOf = b => 31 - Math.clz32(b);   // tek bit → DIRS sırası
  const CELLS = new WeakMap(), cells = sw => { let L = CELLS.get(sw); if (!L) CELLS.set(sw, L = sw.reduce((a, m, i) => (m && a.push(i), a), [])); return L; };
  return {
    key: 'sw', line: 8, boost: 1.5,   // zorluk payı: hedef puana eklenir (docs/kurallar/README.md)
    card: { name: 'Makas', tag: 'Yeni: makas',
      // .pt içinde <b> yok (.pt b döner): karo durur, yalnız kollar değişir
      demo: '<div class="rdemo2 rd-sw" aria-hidden="true"><i class="pt"><u class="rd-swa"><u class="rd-swo"></u><u class="rd-swl"></u><u class="rd-swr"></u></u><u class="rd-swa rd-sw2"><u class="rd-swo"></u><u class="rd-swl"></u><u class="rd-swr"></u></u><u class="rd-swt"></u></i><i class="rtap2"></i></div>',
      text: '<b>Makas</b> dönmez: dokununca yol <b>düz</b> ile <b>sapak</b> arasında değişir. <b>Kesik çizgi</b> öbür yolu gösterir.' },
    // düz kol (yukarı) ve sapak (aynı kol 90° çevrik) sırayla dolu ↔ kesik, dokunuş halkası geçişte · hareketsiz: düz dolu, sapak kesik
    css: `.rd-sw u{position:absolute;display:block}.rd-swa{inset:0}.rd-sw2{transform:rotate(90deg)}
.rd-swt,.rd-swo{left:31px;width:14px;height:45px;border-radius:8px;background:var(--acc)}.rd-swt{top:31px}.rd-swo{top:0}
.rd-swl{left:35.5px;top:16px;width:5px;height:15px;background:repeating-linear-gradient(var(--mut) 0 4.5px,transparent 0 8px)}
.rd-swr{left:32px;top:5px;width:12px;height:12px;border-radius:50%;box-shadow:inset 0 0 0 2.5px var(--mut)}
.rd-swl,.rd-swr,.rd-sw2 .rd-swo{opacity:0}.rd-sw2 .rd-swl,.rd-sw2 .rd-swr{opacity:.85}
.rd-swo{animation:rdswO 2s steps(1) infinite}.rd-swl,.rd-swr{animation:rdswX 2s steps(1) infinite}.rd-sw2 u{animation-delay:-1s}
.rd-sw .pt{animation:rdswP 1s -.55s ease-out infinite}.rd-sw .rtap2{animation-delay:-.55s}
@keyframes rdswO{0%{opacity:1}50%,to{opacity:0}}@keyframes rdswX{0%{opacity:0}50%,to{opacity:.85}}@keyframes rdswP{45%,70%{transform:none}55%{transform:scale(.93)}}`,
    // giriş 6×8 → 2, sonra 6×8 → 4, 7×9 → 5
    amount: (n, intro) => Math.max(2, Math.round(n * (intro ? .05 : .08))),
    // R() yalnız makaslı bölümde tüketilir → eski bölümler aynı
    shape(C) {
      const { n, cols, sol, cur, R, hub, hub2 } = C, sw = C.out.sw = new Array(n).fill(0);
      const md = (a, b) => b < 0 ? 99 : Math.abs(a % cols - b % cols) + Math.abs((a / cols | 0) - (b / cols | 0));
      // aday: serbest, 2 kollu, merkeze bitişik değil (karanlığın merkez adımı makası çeviremez)
      const cand = []; for (let i = 0; i < n; i++) if (C.free(i) && popc(sol[i]) === 2 && md(i, hub) >= 2 && md(i, hub2) >= 2) cand.push(i);
      let first = -1, wrong = false;
      for (let k = 0; k < C.x.sw && cand.length;) {
        const i = cand.splice(R() * cand.length | 0, 1)[0], m = sol[i], opt = [];
        // gövde t, açık kol a; a düzse öbür kol b sapak, değilse düz. b tahtanın içine bakar.
        for (const [t] of DIRS) if (m & t) {
          const a = m & ~t;
          for (const b of a === rot(rot(t)) ? [rot(t), unrot(t)] : [rot(rot(t))]) if (C.nb(i, kOf(b)) >= 0) opt.push(a | b);
        }
        if (!opt.length) continue;
        const s = sw[i] = opt[R() * opt.length | 0];
        if (R() < .75) { cur[i] = m ^ s; wrong = true; } else cur[i] = m;   // yörünge {sol, sol ^ sw}
        C.unit([i], 2, c => { c[i] ^= s; }, 'sw');
        if (first < 0) first = i;
        k++;
      }
      if (first >= 0 && !wrong) cur[first] ^= sw[first];   // en az bir makas ters başlar (R() tüketmez)
    },
    // çekirdek tap, hamle, basma, dalgayı yaptı; dönme yok. Kısa tık + ilk bildirim.
    onTap() {
      api.tone(1480, .03, .014, 'triangle');
      const sv = api.save; if (!sv.swTold) { sv.swTold = 1; api.persist(); api.toast('Makas · düz ↔ sapak'); }
    },
    // ipucunun başlattığı dönme animasyonu makasta silinir
    xform({ G, X }) { const A = api.anim; if (A.size) for (const i of A.keys()) if (G.sw[i]) { A.delete(i); X[i][2] = 0; } },
    // kullanılmayan kol: kesik çizgi (.10s → .29s, butt: yuvarlak uçta kesikler birleşir) + karonun içinde boş halka (.355s)
    over({ G, s, X, vis, cx, pal }) {
      if (G.won) return;
      const L = cells(G.sw).filter(i => vis(i) && !G.fixed[i]); if (!L.length) return;
      const arm = f => { for (const i of L) { const [x, y, , sc] = X[i], u = G.sw[i] & ~G.cur[i]; for (const [b, dx, dy] of DIRS) if (u & b) f(x, y, dx * s * sc, dy * s * sc, sc); } };
      cx.save(); cx.lineCap = 'butt'; cx.globalAlpha = .85; cx.strokeStyle = pal.mut;
      cx.setLineDash([s * .06, s * .045]); cx.lineWidth = s * .065; cx.beginPath();
      arm((x, y, dx, dy) => { cx.moveTo(x + dx * .10, y + dy * .10); cx.lineTo(x + dx * .29, y + dy * .29); });
      cx.stroke(); cx.setLineDash([]); cx.beginPath();
      arm((x, y, dx, dy, sc) => { const r = s * .06 * sc, rx = x + dx * .355, ry = y + dy * .355; cx.moveTo(rx + r, ry); cx.arc(rx, ry, r, 0, 7); });
      cx.lineWidth = s * .035; cx.stroke(); cx.restore();
    },
  };
});
