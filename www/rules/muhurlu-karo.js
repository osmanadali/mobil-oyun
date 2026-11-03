// M11 · Mühürlü karo (seal): 🔒 karo, komşularından biri merkeze bağlanana (yanana) dek dönmez; bağlantı kopunca yeniden mühürlenir.
// Merkezden dışa sırayla çözmeyi zorlar. Ayrıntı ve çözülebilirlik kanıtı: docs/kurallar/muhurlu-karo.md
(window.RAY_RULES = window.RAY_RULES || []).push(api => {
  const { nb } = api;
  const BRASS = '#f0b94a', BRASS_L = '#a8730f';
  // mühür açık mı: komşulardan biri (tünel/sarmal komşuluğu dahil) yanıyor
  const open = (G, i) => { for (let k = 0; k < 4; k++) { const j = nb(G, i, k); if (j >= 0 && G.L.d[j] >= 0) return true; } return false; };
  // asma kilit: gövde + kanca. Açıkken kanca yukarı kalkar ve sağ bacağı gövdeden ayrılır (renk dışında biçim farkı)
  const lock = (cx, x, y, u, isOpen) => {
    const bw = u * 1.5, bh = u * 1.15, by = y - u * .05, sr = u * .5, sy = by - (isOpen ? u * .42 : 0);
    cx.moveTo(x - sr, by); cx.lineTo(x - sr, sy); cx.arc(x, sy, sr, Math.PI, 0); cx.lineTo(x + sr, isOpen ? sy + u * .2 : by);
    return [x - bw / 2, by, bw, bh];
  };
  const MSG = { told: L('🔒 Mühürlü karo · komşusu hatta bağlanınca açılır', '🔒 Sealed tile · opens once a neighbour is on the line') };
  return {
    key: 'seal', line: 10, ord: 23, boost: 1.5,
    clash: ['gear'],   // kendiliğinden dönen bakım karosu yolu bozup mührü dokunuş ortasında kapatabilir
    card: { name: L('Mühürlü karo', 'Sealed tile'), tag: L('Yeni: mühürlü karo', 'New: sealed tile'),
      demo: '<div class="rd-seal" aria-hidden="true"><i class="a"><b></b></i><i class="b"><b></b><svg viewBox="0 0 20 20"><path class="sh" d="M6.5 10V7a3.5 3.5 0 0 1 7 0v3"/><rect x="4" y="10" width="12" height="8.5" rx="2"/></svg></i></div>',
      text: L('🔒 <b>Mühürlü</b> karo, komşularından biri <b>hatta bağlanana</b> dek dönmez. Bağlantı kopunca <b>yeniden mühürlenir</b>: merkezden dışa doğru çöz.',
        'A 🔒 <b>sealed</b> tile won’t turn until a neighbour is <b>on the line</b>. Break the link and it <b>seals again</b>: work outward from the hub.') },
    css: `.rd-seal,.rd-seal *{box-sizing:border-box}.rd-seal{position:relative;align-self:center;display:flex;gap:6px;margin:6px 0 2px}
.rd-seal i{position:relative;width:64px;height:64px;border-radius:18px;background:var(--tile);box-shadow:inset 0 0 0 1px var(--stroke);overflow:hidden}
.rd-seal i b{position:absolute;left:-4px;right:-4px;top:25px;height:14px;border-radius:8px;background:var(--rail)}
.rd-seal .a b{animation:rdsA 3.6s ease-in-out infinite}
.rd-seal .b{box-shadow:inset 0 0 0 2px ${BRASS};animation:rdsT 3.6s ease-in-out infinite}
.rd-seal .b b{left:25px;right:auto;top:-4px;width:14px;height:72px;animation:rdsB 3.6s cubic-bezier(.3,1.4,.5,1) infinite}
.rd-seal svg{position:absolute;left:18px;top:16px;width:28px;height:28px;fill:${BRASS};stroke:${BRASS};stroke-width:2.4;stroke-linecap:round;animation:rdsL 3.6s ease-in-out infinite}
.rd-seal svg .sh{fill:none;animation:rdsS 3.6s ease-in-out infinite}
@keyframes rdsA{0%,18%,92%,100%{background:var(--rail);box-shadow:none}26%,86%{background:var(--acc);box-shadow:0 0 12px var(--accGlow)}}
@keyframes rdsS{0%,30%,92%,100%{transform:none}38%,86%{transform:translate(2px,-3px)}}
@keyframes rdsL{0%,44%,92%,100%{opacity:1}54%,86%{opacity:0}}
@keyframes rdsT{0%,30%,92%,100%{box-shadow:inset 0 0 0 2px ${BRASS}}38%,86%{box-shadow:inset 0 0 0 1px var(--stroke)}}
@keyframes rdsB{0%,48%,92%,100%{transform:none;background:var(--rail)}60%,86%{transform:rotate(90deg);background:var(--acc)}}
@media (prefers-reduced-motion:reduce){.rd-seal *{animation:none!important}}`,
    // tanıtım (M11'in ilk 3 bölümü, 6×8): 2 mühür · 7×9 4, hat finali 6
    amount: (n, intro, z, fin) => intro ? 2 : Math.max(3, Math.round(n * (fin ? .09 : .065))),
    // en son işaretlenir (ord 23): çıplak, yanlış duran karo; merkezin komşusu değil (orada mühür hep açık olurdu)
    mark(C) {
      const { n, R, cur, sol } = C, outs = Object.values(C.out).filter(v => Array.isArray(v) && v.length === n), marks = Object.values(C.out).filter(v => v?.mark?.length === n).map(v => v.mark);
      const nearHub = i => { for (let k = 0; k < 4; k++) if (C.isHub(C.nb(i, k))) return true; return false; };
      const cand = [];
      for (let i = 0; i < n; i++) if (C.free(i) && !C.keep[i] && !C.rev[i] && C.cnt[i] < 0 && cur[i] !== sol[i] && !nearHub(i) && !outs.some(a => a[i]) && !marks.some(a => a[i])) cand.push(i);
      const seal = new Array(n).fill(0);
      for (let k = 0; k < C.x.seal && cand.length; k++) seal[cand.splice(R() * cand.length | 0, 1)[0]] = 1;
      if (seal.includes(1)) { C.out.seal = seal; seal.forEach((v, i) => { if (v) C.busy[i] = true; }); }   // busy: "çözülmüş gelmesin" ve karanlık tünel dokunmaz
    },
    block(G, i) { return G.seal[i] && !open(G, i) ? MSG.told : 0; },
    // mühür açılınca kısa bir tık (kapanınca sessiz); durum her dokunuşta G.L'den baştan okunur, saklanmaz
    after(G) {
      let opened = 0; const was = G.sealWas || [];
      G.sealWas = G.seal.map((v, i) => v ? (open(G, i) ? 1 : 0) : 0);
      G.sealWas.forEach((v, i) => { if (v && !was[i] && G.moves) opened++; });
      if (opened) { api.tone(api.note(6), .08, .03, 'triangle'); api.tone(api.note(9), .1, .025, 'triangle', .05); }
    },
    // mühürlü: pirinç kesik çerçeve + ortada kapalı kilit (koyu zeminli) · açık: köşede küçük açık kilit
    over(D) {
      const { cx, s, X, G, pal } = D, col = pal.light ? BRASS_L : BRASS, shut = [], loose = [];
      for (let i = 0; i < D.n; i++) if (G.seal[i] && D.vis(i)) (open(G, i) ? loose : shut).push(i);
      if (shut.length) {
        cx.save(); cx.setLineDash([s * .09, s * .06]); cx.lineWidth = Math.max(1.5, s * .035); cx.strokeStyle = col; cx.beginPath();
        for (const i of shut) { const [x, y, , sc] = X[i], w = (s - 9) * sc; D.rrp(x - w / 2, y - w / 2, w, w, s * .22 * sc); }
        cx.stroke(); cx.restore();
        cx.beginPath(); for (const i of shut) { const [x, y, , sc] = X[i]; cx.moveTo(x + s * .29 * sc, y); cx.arc(x, y, s * .29 * sc, 0, 7); }
        cx.fillStyle = D.rgba(pal.bg, .82); cx.fill();
      }
      for (const [cells, cen] of [[shut, true], [loose, false]]) {
        if (!cells.length) continue;
        const bodies = []; cx.beginPath();
        for (const i of cells) { const [x, y, , sc] = X[i], u = s * (cen ? .17 : .08) * sc; bodies.push(lock(cx, cen ? x : x + s * .3 * sc, cen ? y + s * .02 * sc : y - s * .27 * sc, u, !cen)); }
        cx.lineWidth = Math.max(1.5, s * (cen ? .03 : .022)); cx.lineCap = 'round'; cx.strokeStyle = col; cx.stroke();
        cx.beginPath(); for (const [bx, by, bw, bh] of bodies) D.rrp(bx, by, bw, bh, bw * .18); cx.fillStyle = col; cx.fill();
      }
    },
  };
});
