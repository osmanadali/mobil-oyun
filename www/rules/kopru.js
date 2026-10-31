// M11 · Köprü (anahtar: bridge) — kuralın tamamı bu dosyada. Sözleşme: docs/kurallar/README.md · tasarım: docs/kurallar/kopru.md
// Köprü dönmez (cur = sol = 15) ama iki ayrı düğümdür: K–G yarısı üstten, D–B yarısı alttan (alt geçit) geçer; iki yarı da bağlanmalı.
// Bölünmüş düğümü çekirdekteki lit() P.split ile okur; bu dosya üretimi, dokunma engelini, çizimi ve kural kartını taşır.
(window.RAY_RULES = window.RAY_RULES || []).push(api => {
  const { DIRS, nb, ob } = api;
  // D–B yarısı: kenardan (±.5s) iç uca (±.31s) iki kısa parça, ortada boşluk. Yuvarlak uç ±.225s'de görünür → K–G rayına ve korkuluğa değmez.
  const ewPath = (cx, T, s) => {
    const [x, y, a, sc] = T, c = Math.cos(a), si = Math.sin(a), L = s / 2 * sc, g = .62 * L;
    for (const k of [1, -1]) { cx.moveTo(x + c * k * L, y + si * k * L); cx.lineTo(x + c * k * g, y + si * k * g); }
  };
  // korkuluk: K–G rayının iki yanında ±.17s, boy .5s
  const guardPath = (cx, T, s) => {
    const [x, y, a, sc] = T, c = Math.cos(a), si = Math.sin(a), o = s * .17 * sc, h = s * .25 * sc;
    for (const k of [1, -1]) { const px = x + c * k * o, py = y + si * k * o; cx.moveTo(px + si * h, py - c * h); cx.lineTo(px - si * h, py + c * h); }
  };
  return {
    key: 'bridge', line: 10, boost: 2,
    clash: ['ring'],   // halka 2-çekirdeği bölünmüş düğümü bilmez (halka dosyası da tanımlar; simetrik)
    card: { name: L('Köprü', 'Bridge'), tag: L('Yeni: köprü', 'New: bridge'),
      demo: '<div class="rd-bridge" aria-hidden="true"><i class="rd-bridge-w"><b></b></i><i class="rd-bridge-e"><b></b></i><i class="rd-bridge-ns"><b></b></i><i class="rd-bridge-g"></i><i class="rd-bridge-g rd-bridge-r"></i></div>',
      text: L('<b>Köprüde</b> iki hat üst üste geçer ama <b>birleşmez</b>: soldan gelen sağa, üstten gelen alta gider. Köprü dönmez; <b>dört ucuna</b> da ray bağla.',
        `On a <b>bridge</b> two lines cross but <b>never join</b>: left goes to right, top goes to bottom. It doesn't turn; connect <b>all four ends</b>.`) },
    // kart demosu: önce alt geçit (D–B) soldan sağa yanar, tren köprünün altından geçer; sonra üst hat (K–G) başka renkte yukarıdan aşağı. İki renk hiç karışmaz.
    // Yalnız transform/opacity canlanır (ucuz). Hareketi azalt: canlanma yok, iki yarı yanık durur.
    css: `.rd-bridge{position:relative;align-self:center;width:96px;height:96px;margin:6px 0 2px;border-radius:24px;background:var(--tile);box-shadow:inset 0 0 0 1px var(--stroke)}
.rd-bridge i{position:absolute;border-radius:7px;background:var(--railC)}
.rd-bridge i b{position:absolute;inset:0;border-radius:inherit;background:var(--acc);box-shadow:0 0 10px var(--accGlow);transform-origin:0 50%;animation:rd-bridge-w 4.2s ease-in-out infinite}
.rd-bridge-w,.rd-bridge-e{top:41px;width:26px;height:14px}.rd-bridge-w{left:0}.rd-bridge-e{right:0}
.rd-bridge .rd-bridge-e b{animation-name:rd-bridge-e}
.rd-bridge-ns{left:41px;top:0;width:14px;height:96px}
.rd-bridge .rd-bridge-ns b{background:#4cc9ff;box-shadow:0 0 10px rgba(76,201,255,.6);transform-origin:50% 0;animation-name:rd-bridge-ns}
.rd-bridge .rd-bridge-g{left:30px;top:24px;width:3.5px;height:48px;border-radius:2px;background:var(--mut)}.rd-bridge .rd-bridge-r{left:62.5px}
@keyframes rd-bridge-w{0%,8%{transform:scaleX(0);opacity:1}22%,88%{transform:none;opacity:1}100%{transform:none;opacity:0}}
@keyframes rd-bridge-e{0%,30%{transform:scaleX(0);opacity:1}44%,88%{transform:none;opacity:1}100%{transform:none;opacity:0}}
@keyframes rd-bridge-ns{0%,50%{transform:scaleY(0);opacity:1}70%,88%{transform:none;opacity:1}100%{transform:none;opacity:0}}
.modal:not(.open) .rd-bridge b{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.rd-bridge i b{animation:none!important}}`,
    amount: (n, intro) => intro ? 1 : 2,   // tanıtım bölümünde 1, sonra (karma hatlarda da) en çok 2
    // köprü hücreleri ağaçtan önce: iç bölgede, merkezlere Manhattan ≥ 2, köprüler arası Chebyshev ≥ 3 (ortak komşu yok). Yer yoksa daha az köprü.
    pre(C) {
      const { cols, rows, n, R, sol, inT, hub, hub2 } = C, want = Math.min(2, C.x.bridge), B = [];
      const far = (bx, by, h) => h < 0 || Math.abs(bx - h % cols) + Math.abs(by - (h / cols | 0)) >= 2;
      for (let t = 0; t < 200 && B.length < want && cols > 2 && rows > 2; t++) {
        const bx = 1 + (R() * (cols - 2) | 0), by = 1 + (R() * (rows - 2) | 0), i = by * cols + bx;
        if (!far(bx, by, hub) || !far(bx, by, hub2) || inT[i] || C.keep[i]) continue;
        if (B.some(j => Math.max(Math.abs(j % cols - bx), Math.abs((j / cols | 0) - by)) < 3)) continue;
        B.push(i);
      }
      C.br = B;
      if (!B.length) return;   // köprüsüz: P.split yok → lit eski yolda, kancalar çalışmaz
      // kol grupları: K kolu ağaca girince G kolu da girer (ve tersi), B ile D de öyle. grp: kol → [karşı kol, koldaki köprüye bakan bit, karşı koldaki bit]
      const split = new Array(n).fill(0), grp = new Map();
      for (const b of B) {
        split[b] = 1; sol[b] = 15; inT[b] = true; C.keep[b] = C.busy[b] = true;   // busy: öteki eklentiler de dokunmasın
        for (let k = 0; k < 4; k++) grp.set(C.nb(b, k), [C.nb(b, (k + 2) % 4), C.ob(b, k), C.ob(b, (k + 2) % 4)]);
      }
      // ilk giren kol karşısını köprü üzerinden ağaca çeker: o an karşı kol ağaçta değil → döngü yok, sol bölünmüş düğümlü çizgede yayılan ağaç
      C.onTake.push(j => { const g = grp.get(j); if (g && !inT[g[0]]) { sol[j] |= g[1]; sol[g[0]] |= g[2]; C.take(g[0]); } });
      C.out.split = split; C.out.bridge = B;
    },
    block: (G, i) => !!G.split[i] && L('Köprü · dönmez', `Bridge · doesn't turn`),   // hamle saymaz, karo dönmez
    // köprü karosu yalnız D–B yarısıyla yanıyorsa zemin o hattın tonunu alır (çekirdek K–G sahibine göre boyar)
    under({ G, OC, cx, pal, rgba, tiles }) {
      const { own, ownB } = G.L;
      for (const t of [1, 2, 3]) if (G.bridge.some(i => !own[i] && ownB[i] === t)) { tiles(i => G.split[i] && !own[i] && ownB[i] === t); cx.fillStyle = rgba(OC[t], pal.light ? .10 : .07); cx.fill(); }
    },
    // raylar (çekirdekteki geçişlerin aynısı, yarı bazında): sönük → ışıma → yanan; sonra korkuluk ve yeni yanan yarıda parlama
    rails({ G, s, X, now, col, vis, OC, cx, pal, railPath, rgba }) {
      const B = G.bridge, L = G.L, own = L.own, ownB = L.ownB;
      const half = f => { cx.beginPath(); for (const i of B) if (vis(i)) { if (f(own[i])) railPath(X[i], 5); if (f(ownB[i])) ewPath(cx, X[i], s); } cx.stroke(); };
      cx.lineWidth = s * .17; cx.strokeStyle = pal.rail; half(t => !t);
      const tags = [1, 2, 3].filter(t => B.some(i => own[i] === t || ownB[i] === t));
      // ışıma yarı saydam: çekirdekte komşunun ışıması tek yolda çizildi, ucu (yarım daire) köprü karosuna taşar. Üst üste binip koyulaşmasın diye
      // köprünün ışıması karosuna kırpılır ve aynı renkte ışıyan komşunun uç yarım dairesi dışarıda bırakılır (evenodd) → birleşim birebir.
      for (const t of tags) {
        cx.save(); cx.beginPath();
        for (const i of B) if (vis(i) && (own[i] === t || ownB[i] === t)) {
          const [x, y] = X[i]; cx.rect(x - s / 2, y - s / 2, s, s);
          for (let k = 0; k < 4; k++) {
            const j = nb(G, i, k);
            if ((k & 1 ? ownB[i] : own[i]) !== t || j < 0 || own[j] !== t || !(G.cur[j] & ob(G, i, k)) || !vis(j)) continue;
            const [, dx, dy] = DIRS[k], bx = x + dx * s / 2, by = y + dy * s / 2, a = Math.atan2(dy, dx);
            cx.moveTo(bx, by); cx.arc(bx, by, s * .19 * X[j][3], a + Math.PI / 2, a + Math.PI * 1.5); cx.closePath();
          }
        }
        cx.clip('evenodd');
        cx.lineWidth = s * .38; cx.strokeStyle = rgba(OC[t], pal.light ? .16 : .22); half(o => o === t);
        cx.restore();
      }
      for (const t of tags) { cx.lineWidth = s * .17; cx.strokeStyle = OC[t]; half(o => o === t); }
      cx.beginPath(); for (const i of B) if (vis(i)) guardPath(cx, X[i], s);
      cx.lineWidth = Math.max(2, s * .045); cx.strokeStyle = pal.mut; cx.stroke();
      // parlama: yarı yeni yandığında (dokunuş, ipucu) ve kazanınca dalgayla. İlk çizimde durum yalnız kaydedilir.
      const F = G.brFx || (G.brFx = { o: B.map(i => [own[i], ownB[i]]), t: B.map(() => [-1e9, -1e9]), won: false });
      B.forEach((i, k) => {
        const o = F.o[k];
        if (own[i] && !o[0]) F.t[k][0] = now + Math.max(0, L.d[i]) * 12;
        if (ownB[i] && !o[1]) F.t[k][1] = now + Math.max(0, L.dB[i]) * 12;
        F.o[k] = [own[i], ownB[i]];
      });
      if (G.won && !F.won) { F.won = true; B.forEach((i, k) => { F.t[k][0] = F.t[k][1] = now + 110 + Math.max(0, L.d[i]) * 45; }); }
      let busy = false;
      B.forEach((i, k) => {
        if (!vis(i)) return;
        for (const h of [0, 1]) {
          const t = (now - F.t[k][h]) / 420, o = h ? ownB[i] : own[i];
          if (t >= 1 || !o) continue;
          busy = true; if (t <= 0) continue;
          const [x, y] = X[i];
          cx.save(); cx.beginPath(); cx.rect(x - s / 2, y - s / 2, s, s); cx.clip();
          cx.strokeStyle = pal.light ? rgba(OC[o] || col, .9 * (1 - t)) : `rgba(255,255,255,${.65 * (1 - t)})`;
          cx.lineWidth = s * (pal.light ? .17 + .12 * (1 - t) : .17);
          cx.beginPath(); if (h) ewPath(cx, X[i], s); else railPath(X[i], 5); cx.stroke(); cx.restore();
        }
      });
      return busy;
    },
  };
});
