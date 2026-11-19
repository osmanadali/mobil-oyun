// M31 · Manevra karosu (shunt): ⇄ işaretli karolar dönmez. Birine dokununca seçilir, başka bir ⇄ karoya dokununca ikisi yer değiştirir
// (yönleri aynı kalır); aynı karoya yeniden dokunmak seçimi bırakır. Bir takas = 1 hamle, seçim hamle sayılmaz.
// Bütün ⇄ karolar tek grup (tek birim): durum yalnız maskede (G.cur), seçim G.shSel'de (kaydedilmez; geri al ve ipucu bırakır).
// Birim sözleşmesi: tap(c) = grubun SIRADAKİ dizilimi (sözlük sırası, döngüsel; K = farklı dizilim sayısı) → çözücü ve unitTaps
// bütün dizilimleri bilir. Oyunda tap, block'un hazırladığı takası (pend) uygular. U.moves = en az takas, U.hint = bir takas.
// Ayrıntı ve kanıt: docs/kurallar/manevra.md
(window.RAY_RULES = window.RAY_RULES || []).push(api => {
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const MSG = { tip: L('⇄ Manevra · başka bir ⇄ karoya dokun, yer değiştirsinler', '⇄ Shunt · tap another ⇄ tile to swap them') };
  let pend = null, act = '', swA = -1, SW = null;   // pend: oyundaki dokunuşun işi ({ c: G.cur, a, b }; a = −1: yalnız seçim) · act: son dokunuşun türü (swA: takasın ilk karosu) · SW: kayma animasyonu
  // grubun sıradaki dizilimi (sözlük sırası; sonuncudan sonra baştaki). Aynı biçimli karolar tekrar sayılmaz.
  const next = cells => c => {
    const v = cells.map(q => c[q]); let k = v.length - 2;
    while (k >= 0 && v[k] >= v[k + 1]) k--;
    if (k < 0) v.reverse();
    else { let l = v.length - 1; while (v[l] <= v[k]) l--; [v[k], v[l]] = [v[l], v[k]]; for (let a = k + 1, b = v.length - 1; a < b; a++, b--) [v[a], v[b]] = [v[b], v[a]]; }
    cells.forEach((q, p) => { c[q] = v[p]; });
  };
  const fact = k => k < 2 ? 1 : k * fact(k - 1);
  const arrs = v => { const m = new Map(); v.forEach(x => m.set(x, (m.get(x) || 0) + 1)); let r = fact(v.length); m.forEach(c => { r /= fact(c); }); return r; };
  // i karosuna çözüm biçimini getirecek takas eşi: yanlış duran, i'nin istediği biçimi taşıyan; tercihen i'nin biçimini isteyen (ikisi birden yerine oturur)
  const mate = (cells, c, sol, i, fx) => {
    let best = -1;
    for (const j of cells) if (j !== i && !fx?.[j] && c[j] !== sol[j] && c[j] === sol[i]) { if (sol[j] === c[i]) return j; if (best < 0) best = j; }
    return best;
  };
  // en az takas dizisi (açgözlü döngü ayrıştırma; biçimler farklıysa en kısa: k − döngü sayısı)
  const swaps = (cells, cur, sol, fx) => {
    const c = cur.slice(), out = [];
    for (const i of cells) if (!fx?.[i] && c[i] !== sol[i]) { const j = mate(cells, c, sol, i, fx); if (j < 0) break; [c[i], c[j]] = [c[j], c[i]]; out.push([i, j]); }
    return out;
  };
  const has = (G, i) => G.shunt.includes(i);
  const sel = G => { const s = G.shSel ?? -1; return s >= 0 && !G.fixed[s] && has(G, s) ? s : -1; };
  // ⇄ rozeti: sağ üst köşede küçük kutu, içinde iki zıt ok (renkten bağımsız biçim işareti)
  const arrows = (cx, x, y, w) => {
    const h = w * .3, d = w * .17, e = w * .13;
    cx.moveTo(x - h, y - d); cx.lineTo(x + h, y - d); cx.moveTo(x + h - e, y - d - e); cx.lineTo(x + h, y - d); cx.lineTo(x + h - e, y - d + e);
    cx.moveTo(x + h, y + d); cx.lineTo(x - h, y + d); cx.moveTo(x - h + e, y + d - e); cx.lineTo(x - h, y + d); cx.lineTo(x - h + e, y + d + e);
  };
  return {
    key: 'shunt', line: 30, ord: 29, boost: 20, scan: 48,   // scan: çözücü puanı kuralla artmaz (ortak durum çıkarımı), seçici geniş tarasın; boost 20'den sonra tavan
    // kayan sıra, kayan sütun, döner tabla: onlar da karoların yerini değiştirir ama sabit düzenle; serbest takasla aynı tahtada karışır
    clash: ['slide', 'column', 'table'],
    card: { name: L('Manevra karosu', 'Shunt tile'), tag: L('Yeni: manevra karosu', 'New: shunt tile'),
      demo: '<div class="rd-shunt" aria-hidden="true"><i class="ra"><b class="h1"></b><b class="v1"></b><u>⇄</u></i><i class="rm"><b class="h"></b></i><i class="rc"><b class="h"></b><u>⇄</u></i><em class="t1"></em><em class="t2"></em></div>',
      text: L('⇄ işaretli <b>manevra</b> karoları <b>dönmez</b>. Birine dokun, sonra başka bir ⇄ karoya: ikisi <b>yer değiştirir</b>, yönleri aynı kalır. Her biçim doğru yönde ama <b>yanlış yerde</b>; hangisinin nereye ait olduğunu bul.',
        '⇄ <b>Shunt</b> tiles <b>don’t turn</b>. Tap one, then another ⇄ tile: the two <b>swap places</b> and keep their direction. Each piece faces the right way but sits in the <b>wrong spot</b>; work out where each one belongs.') },
    // demo: soldaki ⇄ karo seçilir (halka + kalkma), sağdakine dokunulur, ikisi kayarak yer değiştirir → hat birleşir ve yanar
    css: `.rd-shunt,.rd-shunt *{position:absolute;box-sizing:border-box}.rd-shunt{position:relative;align-self:center;width:180px;height:64px;margin:8px 0 2px}
.rd-shunt i{top:4px;width:56px;height:56px;border-radius:15px;background:linear-gradient(var(--tile),var(--tile)),var(--bg0);box-shadow:inset 0 0 0 1px var(--stroke);overflow:hidden}
.rd-shunt .ra{left:0;z-index:3;overflow:visible;animation:rdsA 5s ease-in-out infinite}.rd-shunt .rm{left:62px}.rd-shunt .rc{left:124px;z-index:2;animation:rdsC 5s ease-in-out infinite}
.rd-shunt b{border-radius:6px;background:var(--rail);animation:rdsL 5s infinite}.rd-shunt .h{left:-4px;right:-4px;top:22px;height:12px}
.rd-shunt .h1{left:-4px;top:22px;width:38px;height:12px}.rd-shunt .v1{left:22px;top:-4px;width:12px;height:38px}
.rd-shunt .ra b{clip-path:inset(4px 0 0 4px)}
.rd-shunt u{right:3px;top:2px;font:700 12px/14px system-ui,sans-serif;text-decoration:none;color:var(--mut)}
.rd-shunt em{top:18px;width:28px;height:28px;border-radius:50%;border:2.5px solid var(--fg);opacity:0}.rd-shunt .t1{left:14px;animation:rdsT1 5s infinite}.rd-shunt .t2{left:138px;animation:rdsT2 5s infinite}
@keyframes rdsA{0%,10%,96%,100%{transform:none;box-shadow:inset 0 0 0 1px var(--stroke)}14%,36%{transform:translateY(-4px) scale(1.05);box-shadow:inset 0 0 0 1px var(--stroke),0 0 0 3px var(--fg)}45%{transform:translate(62px,-14px) scale(1.05)}52%,90%{transform:translateX(124px);box-shadow:inset 0 0 0 1px var(--stroke)}}
@keyframes rdsC{0%,38%,96%,100%{transform:none}45%{transform:translate(-62px,10px) scale(.96)}52%,90%{transform:translateX(-124px)}}
@keyframes rdsL{0%,54%,92%,100%{background:var(--rail)}60%,88%{background:var(--acc)}}
@keyframes rdsT1{0%,6%,22%,100%{opacity:0;transform:scale(.6)}10%{opacity:.8;transform:scale(1)}18%{opacity:0;transform:scale(1.5)}}
@keyframes rdsT2{0%,30%,46%,100%{opacity:0;transform:scale(.6)}34%{opacity:.8;transform:scale(1)}42%{opacity:0;transform:scale(1.5)}}
@media (prefers-reduced-motion:reduce){.rd-shunt *{animation:none!important}.rd-shunt .ra{box-shadow:inset 0 0 0 1px var(--stroke),0 0 0 3px var(--fg)}}`,
    // tanıtım (hattın ilk bölümü) 3 karo · sonra 6×8 4, 7×9 ve hat finali 5
    amount: (n, intro, z, fin) => intro ? 3 : fin || n >= 63 ? 5 : 4,
    // shape (ord 29, dönüşen karodan sonra): serbest, köprü/ağız olmayan karolar; biçimler olabildiğince farklı (tek doğru yerleşim).
    // Başlangıç: çözüm biçimlerinin karışık dağılımı, hiçbiri yerinde değil (düzensizlik). R() yalnız manevralı bölümde tüketilir.
    shape(C) {
      const { n, sol, cur, R } = C, k = C.x.shunt;
      const cand = []; for (let i = 0; i < n; i++) if (C.free(i) && !C.keep[i] && !C.br?.includes(i) && !C.mouth?.has?.(i)) cand.push(i);
      // küme: rastgele bir aday çevresindeki en yakın 2,5·k aday (takaslar yerel bir bulmaca olur, ⇄ karolar birbirine bakar)
      if (!cand.length) return;
      const c0 = cand[R() * cand.length | 0], md = q => Math.abs(q % C.cols - c0 % C.cols) + Math.abs((q / C.cols | 0) - (c0 / C.cols | 0));
      cand.sort((a, b) => md(a) - md(b) || a - b); cand.length = Math.min(cand.length, Math.round(2.5 * k));
      const cells = [], used = new Set();
      for (const pass of [0, 1]) for (let t = cand.length; t > 0 && cells.length < k; t--) {
        const p = R() * cand.length | 0, i = cand[p];
        if (pass === 0 && used.has(sol[i])) continue;   // önce farklı biçimler; yetmezse aynı biçim de olur
        cand.splice(p, 1); cells.push(i); used.add(sol[i]);
      }
      if (cells.length < 3 || used.size < 2) return;
      cells.sort((a, b) => a - b);
      const v = cells.map(q => sol[q]);
      let p = null;
      for (let t = 0; t < 60; t++) {   // düzensiz karıştırma: hiçbir karo kendi biçimini taşımaz (aynı biçimlilerde olabildiğince)
        const q = cells.map((_, j) => j); for (let j = q.length - 1; j > 0; j--) { const r = R() * (j + 1) | 0; [q[j], q[r]] = [q[r], q[j]]; }
        const bad = q.filter((s, j) => v[s] === v[j]).length;
        if (!p || bad < p.bad) p = { q, bad }; if (!bad) break;
      }
      cells.forEach((c, j) => { cur[c] = v[p.q[j]]; });
      const u = C.unit(cells, arrs(v), c => {
        if (pend && pend.c === c) { const { a, b } = pend; pend = null; if (a >= 0) [c[a], c[b]] = [c[b], c[a]]; return; }   // oyundaki dokunuş: seçim ya da takas
        next(cells)(c);
      }, 'shunt');
      const U = C.units[u];
      U.moves = (cur, sol) => swaps(cells, cur, sol).length;
      // ipucu: i karosuna doğru biçimi bir takasla getirir; yerine oturan karolar sabitlenir
      U.hint = (cur, sol, i, fx) => {
        const j = mate(cells, cur, sol, i, fx); if (j < 0) return [i];
        [cur[i], cur[j]] = [cur[j], cur[i]];
        const G = api.G; if (G && cur === G.cur) { G.shSel = -1; if (!calm.matches) SW = { a: i, b: j, t0: performance.now() }; }
        return cur[j] === sol[j] ? [i, j] : [i];
      };
      C.out.shunt = cells;
    },
    // dokunuş: seçim / bırakma / takas. Hepsi çekirdeğin birim dokunuşundan geçer (tap → pend); seçim ve bırakma hamle değildir
    block(G, i) {
      if (!has(G, i)) return 0;
      const s = sel(G), u = 'u' + G.unitOf[i];
      if (s < 0) { G.shSel = i; pend = { c: G.cur, a: -1 }; act = 'sel'; G.lastTile = u; }
      else if (s === i) { G.shSel = -1; pend = { c: G.cur, a: -1 }; act = 'off'; G.lastTile = u; }
      else { G.shSel = -1; pend = { c: G.cur, a: s, b: i }; act = 'swap'; swA = s; G.lastTile = -1; }   // -1: çekirdek yeni hamle sayar, geri al için durum saklar
      return 0;
    },
    onTap(G, U, i, now) {
      if (act === 'swap') {
        if (!calm.matches) SW = { a: swA, b: i, t0: now };
        api.tone(api.note(2), .12, .03, 'triangle'); api.tone(api.note(4), .14, .02, 'sine', .07); api.haptic('light');
      } else if (act === 'sel') {
        api.tone(api.note(3), .07, .02, 'sine');
        const sv = api.save; if (!sv.shuntTold) { sv.shuntTold = 1; api.persist(); api.toast(MSG.tip); }
      } else api.tone(api.note(1), .06, .015, 'sine');
    },
    after(G, i) {
      pend = null; act = '';
      if (!has(G, i)) G.shSel = -1;   // başka karoya dokunmak seçimi bırakır
    },
    undo(G) { G.shSel = -1; SW = null; },
    // robot: seçili karo varsa önce bırakılır, sonra en az takas (görünen, sabitlenmemiş karolarla)
    plan(G) {
      const fx = G.fixed, cells = G.shunt.filter(c => !fx[c]);
      if (cells.some(c => !G.seen[c])) return [];
      const out = [], s = sel(G); if (s >= 0) out.push(s);
      for (const [a, b] of swaps(cells, G.cur, G.sol, fx)) out.push(a, b);
      return out;
    },
    // karanlık tünelde: bir ⇄ karo görününce grubun hepsi görünür (takas eşi seçilebilsin; yalnız karolar, çevreleri değil)
    reveal(G, on) { if (G.shunt.some(q => G.seen[q])) G.shunt.forEach(on); },
    // 240 ms: takas edilen iki karo birbirinin yerinden kayarak gelir, ortada hafifçe kalkar · seçili karo kalkık durur (ölçek)
    xform(D) {
      const { X, G } = D; let busy = false;
      for (const q of G.shunt) if (api.anim.delete(q)) X[q][2] = 0;   // ipucunun dönüş animasyonu yerine kayma
      if (SW) {
        const t = (D.now - SW.t0) / 240;
        if (t >= 1 || SW.b == null || SW.b < 0) SW = null;
        else {
          const e = api.ease(Math.max(0, t)), up = 1 + .08 * Math.sin(Math.PI * Math.max(0, t)), A = X[SW.a].slice(), B = X[SW.b].slice();
          X[SW.a] = [B[0] + (A[0] - B[0]) * e, B[1] + (A[1] - B[1]) * e, 0, A[3] * up];
          X[SW.b] = [A[0] + (B[0] - A[0]) * e, A[1] + (B[1] - A[1]) * e, 0, B[3] * up];
          busy = true;
        }
      }
      const s = sel(G); if (s >= 0 && !G.won) X[s] = [X[s][0], X[s][1] - D.s * .04, X[s][2], X[s][3] * 1.06];
      return busy;
    },
    // zemin: düz (kesiksiz) iç çerçeve; dönüşen karonun kesik çerçevesinden ayrı. Tek yol.
    under(D) {
      const { cx, s, X, G } = D, ls = G.shunt.filter(i => D.vis(i) && !G.fixed[i]); if (!ls.length || G.won) return;
      cx.beginPath();
      for (const i of ls) { const [x, y, , sc] = X[i], w = (s - 6) * sc - s * .13; D.rrp(x - w / 2, y - w / 2, w, w, s * .17 * sc); }
      cx.lineWidth = Math.max(1.2, s * .028); cx.strokeStyle = D.rgba(D.pal.mut, .45); cx.stroke();
    },
    // ⇄ rozeti (bütün manevra karoları, tek yol) ve seçim: kalın çerçeve + dolu rozet (renkten bağımsız: biçim ve kalkma)
    over(D) {
      const { cx, s, X, G, pal } = D, ls = G.shunt.filter(i => D.vis(i) && !G.fixed[i]); if (!ls.length || G.won) return;
      const s0 = sel(G), bw = s * .26, at = i => { const [x, y, , sc] = X[i]; return [x + s * .3 * sc, y - s * .3 * sc, bw * sc]; };
      cx.save(); cx.lineCap = 'round'; cx.lineJoin = 'round';
      if (s0 >= 0) {
        const [x, y, , sc] = X[s0], w = (s - 6) * sc + s * .06;
        cx.beginPath(); D.rrp(x - w / 2, y - w / 2, w, w, s * .27 * sc);
        cx.lineWidth = Math.max(3, s * .075); cx.strokeStyle = pal.fg; cx.stroke();
        cx.lineWidth = Math.max(1.5, s * .03); cx.strokeStyle = D.col; cx.stroke();
      }
      cx.beginPath(); for (const i of ls) { const [bx, by, w] = at(i); D.rrp(bx - w / 2, by - w / 2, w, w, w * .3); }
      cx.fillStyle = D.rgba(pal.bg, .82); cx.fill(); cx.lineWidth = Math.max(1, s * .022); cx.strokeStyle = D.rgba(pal.mut, .85); cx.stroke();
      if (s0 >= 0 && ls.includes(s0)) { const [bx, by, w] = at(s0); cx.beginPath(); D.rrp(bx - w / 2, by - w / 2, w, w, w * .3); cx.fillStyle = pal.fg; cx.fill(); }
      cx.beginPath(); for (const i of ls) if (i !== s0) { const [bx, by, w] = at(i); arrows(cx, bx, by, w); }
      cx.lineWidth = Math.max(1.2, s * .03); cx.strokeStyle = pal.mut; cx.stroke();
      if (s0 >= 0 && ls.includes(s0)) { const [bx, by, w] = at(s0); cx.beginPath(); arrows(cx, bx, by, w); cx.strokeStyle = pal.bg; cx.stroke(); }
      cx.restore();
    },
  };
});
