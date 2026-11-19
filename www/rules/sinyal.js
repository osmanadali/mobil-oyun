// M28 · Sinyal karosu (signal): 🚦 karo yalnız hiçbir komşusu yanmıyorken döner; hat yanına ulaşınca (bir komşusu yanınca) kırmızıya
// döner ve kilitlenir, hat kopunca yeniden açılır. Mühürlü karonun (M11, seal) tersi: dıştan içe, sinyali hat gelmeden ayarlatır.
// Kilit tanımı tek: "bir komşusu yanıyor". Sinyalin kendisi hattaysa onu besleyen komşusu da yanar, yani o da kilitlidir.
// Ayrıntı ve çözülebilirlik kanıtı: docs/kurallar/sinyal.md
(window.RAY_RULES = window.RAY_RULES || []).push(api => {
  const { nb } = api;
  // kilitli mi: komşulardan biri (tünel/sarmal komşuluğu dahil) yanıyor. Durum saklanmaz, her an G.L'den okunur
  const shut = (G, i) => { for (let k = 0; k < 4; k++) { const j = nb(G, i, k); if (j >= 0 && G.L.d[j] >= 0) return true; } return false; };
  const RED = '#ff6166', RED_L = '#d63a40', GRN = '#5be38f', GRN_L = '#178a48';
  const MSG = { told: L('🚦 Sinyal kırmızı · hat yanına ulaştı, karo dönmez', '🚦 Signal at red · the line has reached it, the tile won’t turn') };
  return {
    key: 'signal', line: 27, ord: 26, boost: 16,
    // mühürlü: tam tersi kural, aynı tahtada çelişir · bakım karosu: hamleyle kendiliğinden döner, sinyal ayarlanırken hattı sinyale getirebilir ·
    // son sefer: hamle payı merkezden dışa sırayla hesaplanır, sinyali önce ayarlamak payı yer
    clash: ['seal', 'gear', 'last'],
    card: { name: L('Sinyal karosu', 'Signal tile'), tag: L('Yeni: sinyal karosu', 'New: signal tile'),
      demo: '<div class="rd-signal" aria-hidden="true"><i class="a"><b></b></i><i class="b"><b></b><s><em class="r"></em><em class="g"></em></s></i><u></u></div>',
      text: L('🚦 <b>Sinyalli</b> karo yalnız hat ona <b>ulaşmadan</b> döner. Komşularından biri yanınca (kendisi hatta bağlanınca da) <b>kırmızı</b> yanar ve kilitlenir; hat kopunca açılır. Sinyali <b>önce</b> ayarla, dıştan içe çöz.',
        'A 🚦 <b>signal</b> tile turns only <b>before</b> the line reaches it. Once a neighbour lights up (or the tile joins the line) it shows <b>red</b> and locks; break the line and it opens. Set signals <b>first</b>, working inward.') },
    // demo: sinyalli karo önce döner (yeşil, alt lamba), sonra yandaki karo yanar → üst lamba kırmızı; dokunuş yok sayılır (karo yalnız kıpırdar)
    css: `.rd-signal,.rd-signal *{box-sizing:border-box}.rd-signal{position:relative;align-self:center;display:flex;gap:6px;margin:6px 0 2px}
.rd-signal i{position:relative;width:64px;height:64px;border-radius:18px;background:var(--tile);box-shadow:inset 0 0 0 1px var(--stroke);overflow:hidden}
.rd-signal i b{position:absolute;left:-4px;right:-4px;top:25px;height:14px;border-radius:8px;background:var(--rail)}
.rd-signal .a b{animation:rdgA 4.4s ease-in-out infinite}
.rd-signal .b{animation:rdgK 4.4s ease-in-out infinite}
.rd-signal .b b{left:25px;right:auto;top:-4px;width:14px;height:72px;animation:rdgB 4.4s cubic-bezier(.3,1.4,.5,1) infinite}
.rd-signal s{position:absolute;left:6px;top:6px;width:13px;height:22px;border-radius:5px;background:#16182a;box-shadow:0 0 0 1.5px var(--stroke)}
.rd-signal em{position:absolute;left:3px;width:7px;height:7px;border-radius:50%;background:#3a3f55}
.rd-signal em.r{top:3px;animation:rdgR 4.4s infinite}.rd-signal em.g{top:12px;animation:rdgG 4.4s infinite}
.rd-signal u{position:absolute;left:96px;top:30px;width:22px;height:22px;border-radius:50%;border:2px solid var(--fg);opacity:0;animation:rdgT 4.4s infinite}
@keyframes rdgB{0%,14%,94%,100%{transform:none;background:var(--rail)}26%,40%{transform:rotate(90deg);background:var(--rail)}48%,88%{transform:rotate(90deg);background:var(--acc)}}
@keyframes rdgA{0%,40%,94%,100%{background:var(--rail);box-shadow:none}48%,88%{background:var(--acc);box-shadow:0 0 12px var(--accGlow)}}
@keyframes rdgG{0%,44%,94%,100%{background:${GRN};box-shadow:0 0 6px ${GRN}}48%,90%{background:#3a3f55;box-shadow:none}}
@keyframes rdgR{0%,44%,94%,100%{background:#3a3f55;box-shadow:none}48%,90%{background:${RED};box-shadow:0 0 6px ${RED}}}
@keyframes rdgT{0%,60%,76%,100%{opacity:0;transform:scale(.6)}64%{opacity:.8;transform:scale(1)}72%{opacity:0;transform:scale(1.5)}}
@keyframes rdgK{0%,64%,72%,100%{transform:none}66%{transform:translateX(-2px)}68%{transform:translateX(2px)}70%{transform:translateX(-1px)}}
@media (prefers-reduced-motion:reduce){.rd-signal *,.rd-signal i{animation:none!important}.rd-signal .b b{transform:rotate(90deg);background:var(--acc)}.rd-signal .a b{background:var(--acc)}.rd-signal em.r{background:${RED}}}`,
    // tanıtım (M28'in ilk 3 bölümü, 6×8): 2 sinyal · sonra ızgaranın ~%6'sı (6×8 3, 7×9 4), hat finalinde ~%8 (7×9 5)
    amount: (n, intro, z, fin) => intro ? 2 : Math.max(3, Math.round(n * (fin ? .08 : .06))),
    // mühürlüden (23) ve kayan sütundan (24) sonra, ekspres duraktan (27) önce: çıplak, yanlış duran, başta kilitsiz karo; merkez komşusu değil
    mark(C) {
      const { n, R, cur, sol } = C, o = C.out, outs = Object.values(o).filter(v => Array.isArray(v) && v.length === n), marks = Object.values(o).filter(v => v?.mark?.length === n).map(v => v.mark);
      const d = api.lit({ ...C, ...o, cur: cur.slice() }).d, near = i => { for (let k = 0; k < 4; k++) { const j = C.nb(i, k); if (j >= 0 && (C.isHub(j) || d[j] >= 0)) return true; } return false; };
      const cand = [];
      for (let i = 0; i < n; i++) if (C.free(i) && !C.keep[i] && !C.rev[i] && C.cnt[i] < 0 && C.per(sol[i]) > 1 && cur[i] !== sol[i] && !near(i) && !outs.some(a => a[i]) && !marks.some(a => a[i])) cand.push(i);
      const sig = new Array(n).fill(0);
      for (let k = 0; k < C.x.signal && cand.length; k++) sig[cand.splice(R() * cand.length | 0, 1)[0]] = 1;
      if (sig.includes(1)) { o.signal = sig; sig.forEach((v, i) => { if (v) C.busy[i] = true; }); }   // busy: karanlık tünel ve "çözülmüş gelmesin" dokunmaz
    },
    // başlangıç dizilimi kesinleşti (karanlık tünelin merkez ayarından sonra): başta kilitli ya da çözüm yönünde duran sinyal kalmaz
    fin(C) {
      const o = C.out; if (!o.signal) return;
      const P = { ...C, ...o, cur: C.cur }, L = api.lit(P);
      o.signal.forEach((v, i) => { if (v && (C.cur[i] === C.sol[i] || shut({ ...P, L }, i))) o.signal[i] = 0; });
      if (!o.signal.includes(1)) { o.signal = null; o.reject = true; }   // pick başka adayı seçer
    },
    block(G, i) { return G.signal[i] && shut(G, i) ? MSG.told : 0; },
    // ipucu ve robot: önce yanlış duran sinyaller (hat onlara ulaşmadan)
    prio(G) { const out = []; G.signal.forEach((v, i) => { if (v && !G.fixed[i] && G.cur[i] !== G.sol[i]) out.push(i); }); return out; },
    // karanlık tünelde sinyal lambası görünür: oyuncu sinyali hat yaklaşmadan ayarlayabilsin (yalnız karonun kendisi, çevresi değil)
    reveal(G, on) { G.signal.forEach((v, i) => { if (v) on(i); }); },
    // kırmızıya dönünce kısa, alçak bir tık (doğru ya da yanlış ayarlanmış olsun: aynı ses, bilgi vermez)
    after(G) {
      const was = G.sigWas || [];
      G.sigWas = G.signal.map((v, i) => v ? (shut(G, i) ? 1 : 0) : 0);
      if (G.moves && G.sigWas.some((v, i) => v && !was[i])) api.tone(api.note(2), .08, .02, 'triangle');
    },
    // sinyal başı: karonun sol üstünde koyu dikey kutu, iki lamba. Açık: ALT lamba yeşil · kilitli: ÜST lamba kırmızı + içinde yatay çizgi (dur).
    // Renk dışında konum ve biçim de farklı (renk körü dostu). Lambalar tek yolda toplanır.
    over(D) {
      const { cx, s, X, G, pal } = D, red = pal.light ? RED_L : RED, grn = pal.light ? GRN_L : GRN, on = [], off = [];
      for (let i = 0; i < D.n; i++) if (G.signal[i] && D.vis(i)) (shut(G, i) ? on : off).push(i);
      const all = on.concat(off); if (!all.length) return;
      const w = s * .19, h = s * .32, r = s * .055;
      const head = i => { const [x, y, , sc] = X[i]; return [x - s * .28 * sc, y - s * .24 * sc, sc]; };
      cx.save();
      cx.beginPath(); for (const i of all) { const [hx, hy, sc] = head(i); D.rrp(hx - w * sc / 2, hy - h * sc / 2, w * sc, h * sc, w * sc * .38); }
      cx.fillStyle = pal.light ? '#2a2e40' : '#16182a'; cx.fill(); cx.lineWidth = Math.max(1, s * .02); cx.strokeStyle = D.rgba(pal.light ? '#ffffff' : '#8b92a8', .7); cx.stroke();
      // sönük lambalar
      cx.beginPath(); for (const i of all) { const [hx, hy, sc] = head(i), dy = shut(G, i) ? h * .24 : -h * .24; cx.moveTo(hx + r * sc, hy + dy * sc); cx.arc(hx, hy + dy * sc, r * sc, 0, 7); }
      cx.fillStyle = '#3a3f55'; cx.fill();
      // yanan lambalar (hafif hale)
      for (const [cells, col, dy] of [[on, red, -h * .24], [off, grn, h * .24]]) {
        if (!cells.length) continue;
        cx.beginPath(); for (const i of cells) { const [hx, hy, sc] = head(i); cx.moveTo(hx + r * 1.9 * sc, hy + dy * sc); cx.arc(hx, hy + dy * sc, r * 1.9 * sc, 0, 7); }
        cx.fillStyle = D.rgba(col, .22); cx.fill();
        cx.beginPath(); for (const i of cells) { const [hx, hy, sc] = head(i); cx.moveTo(hx + r * sc, hy + dy * sc); cx.arc(hx, hy + dy * sc, r * sc, 0, 7); }
        cx.fillStyle = col; cx.fill();
      }
      // kilitli: kırmızı lambanın içinde yatay "dur" çizgisi
      if (on.length) {
        cx.beginPath(); for (const i of on) { const [hx, hy, sc] = head(i), yy = hy - h * .24 * sc; cx.moveTo(hx - r * .65 * sc, yy); cx.lineTo(hx + r * .65 * sc, yy); }
        cx.lineWidth = Math.max(1, s * .018); cx.lineCap = 'round'; cx.strokeStyle = '#16182a'; cx.stroke();
      }
      cx.restore();
    },
  };
});
