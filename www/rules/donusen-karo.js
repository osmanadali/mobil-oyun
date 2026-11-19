// M28 · Dönüşen karo (morph): 🔄 karo her dokunuşta döner ve biçim değiştirir: köşe ↔ düz. Dört hâl sırayla gelir, 4 dokunuşta başa döner.
// Döngü (A ailesi): ⌞K·D⌟ köşe → D–B düz → G·B köşe → K–G düz → başa. B ailesi bunun 90° çevriğidir. Her köşe tek aileye düşer; düz karo
// iki ailede de vardır, o yüzden aile karo başına sabittir (P.morph[i]). Durum yalnız maskede: geri al, kayıt ve çözücü ek bilgi istemez.
// Ayrıntı ve kanıt: docs/kurallar/donusen-karo.md
(window.RAY_RULES = window.RAY_RULES || []).push(api => {
  const { DIRS, popc } = api;
  // N=1 E=2 S=4 W=8 · A: KD(3) → DB(10) → GB(12) → KG(5) · B = A'nın 90° çevriği: DG(6) → KG(5) → BK(9) → DB(10)
  const CYC = [null, [3, 10, 12, 5], [6, 5, 9, 10]];
  const next = (f, m) => { const c = CYC[f], k = c.indexOf(m); return c[(k + 1) % 4]; };
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const MSG = {
    tip: L('🔄 Dönüşen karo · her dokunuşta döner ve biçim değiştirir: köşe ↔ düz', '🔄 Shifting tile · each tap turns it and changes its shape: corner ↔ straight'),
  };
  const CELLS = new WeakMap(), cells = G => { let c = CELLS.get(G.morph); if (!c) CELLS.set(G.morph, c = G.morph.reduce((a, f, i) => (f && a.push(i), a), [])); return c; };
  // karonun içinde (merkez x, y, yarı boy h) maske m'in mini rayları
  const mini = (cx, x, y, h, m) => { for (const [b, dx, dy] of DIRS) if (m & b) { cx.moveTo(x, y); cx.lineTo(x + dx * h, y + dy * h); } };
  // kart demosu: kollar (76 px karo; merkez 38, kol 14 px) ve mini önizleme (sağ alt, 20 px kutu)
  const ARM = { 1: 'left:31px;top:0;width:14px;height:45px', 2: 'left:31px;top:31px;width:45px;height:14px', 4: 'left:31px;top:31px;width:14px;height:45px', 8: 'left:0;top:31px;width:45px;height:14px' };
  const MIN = { 1: 'left:58px;top:50px;width:4px;height:12px', 2: 'left:58px;top:58px;width:12px;height:4px', 4: 'left:58px;top:58px;width:4px;height:12px', 8: 'left:50px;top:58px;width:12px;height:4px' };
  const arms = (m, T) => [1, 2, 4, 8].filter(b => m & b).map(b => `<s style="${T[b]}"></s>`).join('');
  const demo = '<div class="rdemo2 rd-morph" aria-hidden="true"><i class="pt"><u class="rd-mf"></u>' +
    CYC[1].map((m, k) => `<u class="rd-mk rd-m${k}">${arms(m, ARM)}<u class="rd-mb">${arms(CYC[1][(k + 1) % 4], MIN)}</u></u>`).join('') +
    '<u class="rd-mx"></u></i><i class="rtap2"></i></div>';
  return {
    key: 'morph', line: 29, ord: 28, boost: 14,
    // makas: o da dokununca biçim değiştirir (düz ↔ sapak, kesik kol) · silik kol: kolun var mı yok mu belirsizliği · ikisi dönüşen karoyla aynı tahtada karışır
    clash: ['sw', 'faint'],
    card: { name: L('Dönüşen karo', 'Shifting tile'), tag: L('Yeni: dönüşen karo', 'New: shifting tile'), demo,
      text: L('Kesik çerçeveli karo her dokunuşta <b>döner ve biçim değiştirir</b>: <b>köşe ↔ düz</b>. Köşedeki küçük resim <b>bir sonraki hâlini</b> gösterir; 4 dokunuşta başa döner.',
        'A tile with a dashed frame <b>turns and changes shape</b> on every tap: <b>corner ↔ straight</b>. The small picture in its corner shows its <b>next state</b>; 4 taps bring it back.') },
    // dört kare: her biri 1 sn görünür (steps), dokunuş halkası geçişte · hareketsiz: ilk hâl
    css: `.rd-morph u,.rd-morph s{position:absolute;display:block}.rd-morph s{border-radius:8px;background:var(--acc)}
.rd-mk{inset:0;opacity:0;animation:rdmF 4s steps(1) infinite}.rd-m1{animation-delay:-3s}.rd-m2{animation-delay:-2s}.rd-m3{animation-delay:-1s}
.rd-mf{inset:5px;border-radius:17px;border:2px dashed var(--mut);opacity:.55}
.rd-mx{left:49px;top:49px;width:22px;height:22px;border-radius:7px;box-shadow:inset 0 0 0 1.5px var(--mut);opacity:.8}
.rd-morph .rd-mb s{border-radius:2px;background:var(--mut)}
.rd-morph .pt{animation:rdmP 1s -.55s ease-out infinite}.rd-morph .rtap2{animation-delay:-.55s}
@keyframes rdmF{0%{opacity:1}25%,100%{opacity:0}}@keyframes rdmP{45%,70%{transform:none}55%{transform:scale(.93)}}
@media (prefers-reduced-motion:reduce){.rd-mk,.rd-morph .pt,.rd-morph .rtap2{animation:none}.rd-m0{opacity:1}}`,
    // tanıtımda 2, sonra 6×8 → 3, 7×9 → 4; hat finalinde +1
    amount: (n, intro, z, fin) => intro ? 2 : Math.max(3, Math.round(n * .065)) + (fin ? 1 : 0),
    // shape: eşliden sonra, ters/sayaçlıdan önce. R() yalnız dönüşen karolu bölümde tüketilir → eski bölümler aynı.
    shape(C) {
      const { n, cols, sol, cur, R, hub, hub2 } = C, mo = new Array(n).fill(0);
      const md = (a, b) => b < 0 ? 99 : Math.abs(a % cols - b % cols) + Math.abs((a / cols | 0) - (b / cols | 0));
      // aday: serbest, çözümde köşe ya da düz (2 kollu), merkeze bitişik değil (karanlığın merkez adımı birimi çeviremez), köprü/ağız değil
      const cand = []; for (let i = 0; i < n; i++) if (C.free(i) && !C.keep[i] && popc(sol[i]) === 2 && md(i, hub) >= 2 && md(i, hub2) >= 2) cand.push(i);
      let k = 0;
      for (; k < C.x.morph && cand.length; k++) {
        const i = cand.splice(R() * cand.length | 0, 1)[0], m = sol[i];
        const f = mo[i] = CYC[1].includes(m) && CYC[2].includes(m) ? 1 + (R() * 2 | 0) : CYC[1].includes(m) ? 1 : 2;   // düz: iki aile de olur
        const c = CYC[f], t = 1 + (R() * 3 | 0);
        cur[i] = c[(c.indexOf(m) + 4 - t) % 4];   // t dokunuşta çözüme varır (1–3), başlangıç hiçbir zaman çözüm değil
        C.unit([i], 4, a => { a[i] = next(f, a[i]); }, 'morph');
      }
      if (k) C.out.morph = mo;
    },
    // çekirdek tap, hamle, basma, dalgayı yaptı: dönüş animasyonu (yeni hâl dönerek gelir), yumuşak ses, ilk dokunuşta bir kez bildirim
    onTap(G, U, i, now) {
      if (!calm.matches) api.anim.set(i, now);
      api.tone(api.note(1), .06, .016, 'triangle');
      const sv = api.save; if (!sv.morphTold) { sv.morphTold = 1; api.persist(); api.toast(MSG.tip); }
    },
    // zemin: kesik çizgili iç çerçeve (renkten bağımsız biçim işareti), tek yol
    under(D) {
      const { cx, s, X, G } = D, ls = cells(G).filter(i => D.vis(i)); if (!ls.length) return;
      cx.save(); cx.beginPath();
      for (const i of ls) { const [x, y, , sc] = X[i], w = (s - 6) * sc - s * .13; D.rrp(x - w / 2, y - w / 2, w, w, s * .17 * sc); }
      cx.setLineDash([s * .07, s * .055]); cx.lineWidth = Math.max(1.2, s * .03); cx.strokeStyle = D.rgba(D.pal.mut, .6); cx.stroke(); cx.restore();
    },
    // sağ altta mini önizleme: dokununca gelecek hâl (çözüm yönünü söylemez). İpucuyla sabitlenen ve kazanılmış bölümde çizilmez.
    over(D) {
      const { cx, s, X, G, pal } = D; if (G.won) return;
      const ls = cells(G).filter(i => D.vis(i) && !G.fixed[i]); if (!ls.length) return;
      const box = (f) => { cx.beginPath(); for (const i of ls) { const [x, y, , sc] = X[i], w = s * .26 * sc; f(x + s * .3 * sc, y + s * .3 * sc, w, sc, i); } };
      cx.save();
      box((bx, by, w) => D.rrp(bx - w / 2, by - w / 2, w, w, w * .3));
      cx.fillStyle = D.rgba(pal.bg, .78); cx.fill(); cx.lineWidth = Math.max(1, s * .022); cx.strokeStyle = D.rgba(pal.mut, .8); cx.stroke();
      box((bx, by, w, sc, i) => mini(cx, bx, by, w * .36, next(G.morph[i], G.cur[i])));
      cx.lineCap = 'round'; cx.lineWidth = Math.max(1.5, s * .045); cx.strokeStyle = pal.mut; cx.stroke();
      cx.restore();
    },
  };
});
