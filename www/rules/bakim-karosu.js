// M14 · Bakım karosu (gear): ⚙ karoya dokunulmaz, her 2 hamlede bir kendiliğinden 90° döner. Ayrıntı: docs/kurallar/bakim-karosu.md
// Dönüş gerçek zamanlı değil, yalnız hamleye bağlı (süre akarken kendi kendine dönmez).
(window.RAY_RULES = window.RAY_RULES || []).push(api => {
  const EVERY = 2;   // her 2 hamlede bir (hamle sayacı 2, 4, 6…)
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  // dişli: dış halka + 8 diş (tek yol)
  const cog = (cx, x, y, r) => {
    cx.moveTo(x + r, y); cx.arc(x, y, r, 0, 7);
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, c = Math.cos(a), s = Math.sin(a); cx.moveTo(x + c * r, y + s * r); cx.lineTo(x + c * r * 1.28, y + s * r * 1.28); }
  };
  return {
    key: 'gear', line: 13, ord: 21, boost: 1,
    card: { name: L('Bakım karosu', 'Gear tile'), tag: L('Yeni: bakım karosu', 'New: gear tile'),
      demo: '<div class="rd-gear" aria-hidden="true"><i></i><b></b><s></s><em></em><em></em></div>',
      text: L('Dişli (⚙) karoya <b>dokunulmaz</b>: <b>her 2 hamlede bir</b> kendiliğinden 90° döner. Hattı, dişli <b>doğru yöne geldiği hamlede</b> tamamla.',
        'You <b>can’t tap</b> a gear (⚙) tile: it turns 90° by itself <b>every 2 moves</b>. Finish the line on the move when the gear <b>points the right way</b>.') },
    css: `.rd-gear,.rd-gear *{position:absolute;box-sizing:border-box}.rd-gear{position:relative;align-self:center;width:72px;height:72px;margin:6px 0 2px}
.rd-gear i{inset:4px;border-radius:16px;background:var(--tile);box-shadow:inset 0 0 0 1px var(--stroke)}
.rd-gear b{left:16px;top:16px;width:40px;height:40px;border-radius:50%;border:3px dashed var(--mut);opacity:.6}
.rd-gear s{left:32px;top:8px;width:8px;height:36px;border-radius:4px;background:var(--acc);transform-origin:4px 28px;animation:gearT 4s steps(1) infinite}
.rd-gear em{right:10px;bottom:10px;width:6px;height:6px;border-radius:50%;background:var(--acc);animation:gearP 2s steps(1) infinite}.rd-gear em+em{right:20px;animation-delay:-1s}
@keyframes gearT{0%{transform:rotate(0)}25%{transform:rotate(90deg)}50%{transform:rotate(180deg)}75%{transform:rotate(270deg)}}@keyframes gearP{50%{opacity:.25}}`,
    amount: (n, intro) => intro ? 1 : n >= 48 ? 2 : 1,
    // aday: dört yönü de farklı görünen sıradan karo (istasyon, dirsek, üçlü). Başlangıç yönü, oyuncu yaklaşık par kadar
    // hamlede bitirince dişli doğru yöne gelecek biçimde seçilir. Dişli, 4 durumlu tek karoluk birimdir: çözücü dört yönü dener.
    mark(C) {
      const { rot, unrot } = api, ok = i => C.free(i) && !C.busy[i] && !C.isHub(i) && !C.pinned[i] && C.link[i] < 0 && C.cnt[i] < 0 && !C.rev[i] && rot(C.sol[i]) !== C.sol[i] && rot(rot(C.sol[i])) !== C.sol[i];
      const cand = []; for (let i = 0; i < C.n; i++) if (ok(i)) cand.push(i);
      const cells = []; for (let k = 0; k < C.x.gear && cand.length; k++) cells.push(cand.splice(C.R() * cand.length | 0, 1)[0]);
      if (!cells.length) return;
      // tahmini par: çevrilmesi gereken karo (eş = 1, birim = 1)
      let par = C.units.length; C.cur.forEach((v, i) => { if (v !== C.sol[i] && C.unitOf[i] < 0 && !cells.includes(i) && !(C.link[i] >= 0 && C.link[i] < i)) par++; });
      const turns = Math.floor(par / EVERY) % 4;
      for (const g of cells) { let v = C.sol[g]; for (let t = 0; t < turns; t++) v = unrot(v); C.cur[g] = v; C.unit([g], 4, c => { c[g] = rot(c[g]); }, 'gear'); }
      C.out.gear = cells;
    },
    block(G, i) { return G.gear.includes(i) && !G.fixed[i] ? L('⚙ Bakım karosu · dokunulmaz, her 2 hamlede bir kendi döner', '⚙ Gear tile · can’t be tapped, it turns by itself every 2 moves') : 0; },
    // yeni hamle 2'nin katına gelince dişliler döner (ipucuyla sabitlenen dönmez); kazanma bundan sonra denetlenir
    after(G, i, now, moved) {
      if (!moved || G.moves % EVERY) return;
      let any = false;
      for (const g of G.gear) if (!G.fixed[g]) { G.cur[g] = api.rot(G.cur[g]); if (!calm.matches) api.anim.set(g, now); any = true; }
      if (!any) return;
      G.L = api.lit(G); api.tone(api.note(2) / 2, .12, .03, 'triangle'); api.haptic('light');
      if (!G.gearTold) { G.gearTold = 1; api.toast(L('⚙ Dişli döndü · her 2 hamlede bir', '⚙ The gear turned · every 2 moves')); }
    },
    // robot (__ray.plan): her şey yerindeyken dişli yanlışsa, dişli doğru yöne gelene dek "boş" hamle: bir karoya 4 kez dokun (yön değişmez), sıradakine geç
    plan(G, out) {
      if (out.length || G.L.solved) return [];
      const live = G.gear.filter(g => !G.fixed[g]); if (!live.length) return [];
      let k = 1;
      for (; k <= 4 * EVERY * 2; k++) { const r = Math.floor((G.moves + k) / EVERY) - Math.floor(G.moves / EVERY); if (live.every(g => { let v = G.cur[g]; for (let t = 0; t < r % 4; t++) v = api.rot(v); return v === G.sol[g]; })) break; }
      const pool = []; for (let i = 0; i < G.cur.length && pool.length < 3; i++) if (!G.fixed[i] && !G.pinned[i] && !(G.unitOf?.[i] >= 0) && !(G.link?.[i] >= 0) && G.cnt[i] < 0 && !G.ice?.[i] && (!G.seen || G.seen[i]) && i !== G.hub) pool.push(i);
      const ab = pool.filter(i => i !== G.lastTile).slice(0, 2); if (ab.length < 2) return [];
      const taps = []; for (let m = 0; m < k; m++) for (let t = 0; t < 4; t++) taps.push(ab[m % 2]);
      return taps;
    },
    // dişli: zeminde soluk çark (raylar üstte okunur), köşede sıradaki dönüşe kalan hamle (● dolu = kalan)
    under(D) {
      const { cx, s, X, G } = D;
      cx.beginPath(); for (const g of G.gear) if (D.vis(g)) { const [x, y, , sc] = X[g]; cog(cx, x, y, s * .3 * sc); }
      cx.lineWidth = Math.max(2, s * .05); cx.strokeStyle = D.rgba(D.pal.mut, .55); cx.stroke();
    },
    over(D) {
      const { cx, s, X, G } = D, left = EVERY - G.moves % EVERY;
      cx.beginPath();
      for (const g of G.gear) if (D.vis(g) && !G.fixed[g]) { const [x, y, , sc] = X[g]; for (let p = 0; p < EVERY; p++) { const px = x + s * (.31 - p * .12) * sc, py = y + s * .31 * sc; cx.moveTo(px + s * .045, py); cx.arc(px, py, s * .045, 0, 7); } }
      cx.fillStyle = D.rgba(D.pal.mut, .35); cx.fill();
      cx.beginPath();
      for (const g of G.gear) if (D.vis(g) && !G.fixed[g]) { const [x, y, , sc] = X[g]; for (let p = 0; p < left; p++) { const px = x + s * (.31 - p * .12) * sc, py = y + s * .31 * sc; cx.moveTo(px + s * .045, py); cx.arc(px, py, s * .045, 0, 7); } }
      cx.fillStyle = D.col; cx.fill();
    },
  };
});
