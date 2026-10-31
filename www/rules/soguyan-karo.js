// M9 · Soğuyan karo (ice): ❄ karoyu çevirip başka karoya geçince o karo 2 hamle donar. Ayrıntı: docs/kurallar/soguyan-karo.md
(window.RAY_RULES = window.RAY_RULES || []).push(api => {
  const FREEZE = 2;   // bırakılan karo, sonraki 2 hamle boyunca dönmez
  // donmaya kalan hamle (0 = serbest). left[i]: karonun en son çevrildiği hamle; aynı hamlede (art arda dokunuş) donmaz
  const cold = (G, i) => { const t = G.iceLeft?.[i]; return t == null || G.lastTile === i ? 0 : Math.max(0, FREEZE - (G.moves - t)); };
  const flake = (cx, x, y, r) => { for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3, dx = Math.cos(a) * r, dy = Math.sin(a) * r; cx.moveTo(x - dx, y - dy); cx.lineTo(x + dx, y + dy); } };
  return {
    key: 'ice', line: 8, ord: 20, boost: .5,
    card: { name: L('Soğuyan karo', 'Cooling tile'), tag: L('Yeni: soğuyan karo', 'New: cooling tile'),
      demo: '<div class="rd-ice" aria-hidden="true"><i></i><i></i><b>❄</b><em></em></div>',
      text: L('Kar taneli (❄) karoyu çevirip <b>başka karoya geçince</b> o karo <b>2 hamle donar</b>, dönmez. Bir karoya dönüp durmak yerine <b>önce düşün</b>.',
        'Turn a frosted (❄) tile and <b>move on</b>, and it <b>freezes for 2 moves</b>. Don’t keep coming back to it: <b>think first</b>.') },
    css: `.rd-ice,.rd-ice *{position:absolute;box-sizing:border-box}.rd-ice{position:relative;align-self:center;width:112px;height:56px;margin:6px 0 2px}
.rd-ice i{top:4px;left:4px;width:48px;height:48px;border-radius:13px;background:var(--tile);box-shadow:inset 0 0 0 1px var(--stroke)}.rd-ice i+i{left:60px}
.rd-ice b{left:14px;top:9px;font-size:28px;line-height:1;color:#9bdcff;animation:iceF 3s ease-in-out infinite}
.rd-ice em{left:4px;top:4px;width:48px;height:48px;border-radius:13px;background:rgba(190,232,255,.32);box-shadow:inset 0 0 0 2px #9bdcff;opacity:0;animation:iceO 3s ease-in-out infinite}
@keyframes iceF{0%,30%{transform:rotate(0)}45%,100%{transform:rotate(90deg)}}@keyframes iceO{0%,45%{opacity:0}55%,85%{opacity:1}100%{opacity:0}}`,
    amount: (n, intro, z, fin) => intro ? 3 : Math.max(3, Math.round(n * (fin ? .16 : .12))),
    // çözümde yanlış duran, dönünce değişen sıradan karolar (birim, sabit, eşli, sayaçlı, ters değil)
    mark(C) {
      const cand = [];
      for (let i = 0; i < C.n; i++) if (C.free(i) && !C.busy[i] && !C.isHub(i) && !C.pinned[i] && C.link[i] < 0 && C.cnt[i] < 0 && !C.rev[i] && C.cur[i] !== C.sol[i] && api.rot(C.sol[i]) !== C.sol[i]) cand.push(i);
      const mark = new Array(C.n).fill(0);
      for (let k = 0; k < C.x.ice && cand.length; k++) mark[cand.splice(C.R() * cand.length | 0, 1)[0]] = 1;
      if (mark.includes(1)) C.out.ice = mark;
    },
    block(G, i) {
      const k = G.ice[i] && cold(G, i);
      return k ? L(`❄ Donmuş karo · ${k} hamle sonra döner`, `❄ Frozen tile · turns again in ${k} ${k === 1 ? 'move' : 'moves'}`) : 0;
    },
    after(G, i) { if (G.ice[i]) (G.iceLeft ||= {})[i] = G.moves; },
    undo(G) { G.iceLeft = {}; },   // ↶ geri al: hamle sayacı geri gidince eski donmalar çözülür
    // ❄ işareti köşede; donmuş karo buzlu örtü + ortada büyük kar tanesi (renk dışında biçim de taşır)
    over(D) {
      const { cx, s, X, G } = D;
      cx.beginPath();
      for (let i = 0; i < D.n; i++) if (G.ice[i] && D.vis(i)) { const [x, y, , sc] = X[i]; flake(cx, x - s * .3 * sc, y - s * .3 * sc, s * .08 * sc); }
      cx.lineWidth = Math.max(1.5, s * .03); cx.lineCap = 'round'; cx.strokeStyle = '#9bdcff'; cx.stroke();
      for (let i = 0; i < D.n; i++) if (G.ice[i] && D.vis(i) && cold(G, i)) {
        const [x, y, , sc] = X[i], w = (s - 6) * sc;
        cx.beginPath(); D.rrp(x - w / 2, y - w / 2, w, w, s * .24 * sc); cx.fillStyle = 'rgba(190,232,255,.30)'; cx.fill();
        cx.lineWidth = 2; cx.strokeStyle = '#9bdcff'; cx.stroke();
        cx.beginPath(); flake(cx, x, y, s * .22 * sc); cx.lineWidth = Math.max(2, s * .045); cx.strokeStyle = 'rgba(255,255,255,.85)'; cx.stroke();
      }
    },
  };
});
