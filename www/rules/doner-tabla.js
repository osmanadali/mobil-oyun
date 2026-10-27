// M15 · Döner tabla (table): 2×2 karo bir tablada birlikte döner. Ayrıntı: docs/kurallar/doner-tabla.md
(window.RAY_RULES = window.RAY_RULES || []).push(api => {
  const T0 = new Map(), calm = matchMedia('(prefers-reduced-motion: reduce)');   // tabla → dönüş başlangıcı
  // saat yönü, Q = [sol-üst, sağ-üst, sağ-alt, sol-alt]: karo sonraki köşeye taşınır ve 90° döner
  const spin = Q => c => { const v = Q.map(q => c[q]); Q.forEach((q, p) => { c[q] = api.rot(v[(p + 3) % 4]); }); };
  const mid = (X, [a, , b]) => [(X[a][0] + X[b][0]) / 2, (X[a][1] + X[b][1]) / 2];
  const disc = (D, r) => { D.cx.beginPath(); for (const Q of D.G.table.plates) if (D.vis(Q[0])) { const [x, y] = mid(D.X, Q); D.cx.moveTo(x + r, y); D.cx.arc(x, y, r, 0, 7); } };
  return {
    key: 'table', line: 14,
    card: { name: 'Döner tabla', tag: 'Yeni: döner tabla', demo: '<div class="rd-table" aria-hidden="true"><div><i></i><i></i><i></i><i></i><b></b></div><s></s><em></em></div>',
      text: 'Yuvarlak <b>döner tabla</b> dört karoyu taşır: birine dokun, tabla bütünüyle <b>90° döner</b>. Karolar yer değiştirir, raylar <b>kopmaz</b>.' },
    css: `.rd-table,.rd-table *{position:absolute;box-sizing:border-box}.rd-table{position:relative;align-self:center;width:104px;height:104px;margin:6px 0 2px}
.rd-table div{inset:0;border-radius:50%;background:var(--pin);box-shadow:inset 0 0 0 2px var(--mut);animation:spin4 4s cubic-bezier(.3,1.4,.5,1) infinite}
.rd-table i{left:6px;top:6px;width:44px;height:44px;border-radius:12px;background:var(--tile);box-shadow:inset 0 0 0 1px var(--stroke)}.rd-table i+i{left:54px}.rd-table i+i+i{top:54px}.rd-table i+i+i+i{left:6px}
.rd-table b{left:24px;top:6px;width:56px;height:74px;border:8px solid var(--acc);border-top:0;border-radius:0 0 14px 14px}
.rd-table s{left:46px;top:46px;width:12px;height:12px;border-radius:50%;background:radial-gradient(var(--bg0) 2px,var(--mut) 2.5px)}
.rd-table em{left:13px;top:13px;width:30px;height:30px;border-radius:50%;border:2.5px solid var(--fg);opacity:0;animation:tap2 1s ease-out infinite}`,
    amount: (n, intro, z, fin, c, r) => c < 4 || r < 4 ? 0 : intro ? 1 : 2,
    // aday: serbest 2×2; merkez, köprü, tünel ağzı ve öbür tablaya bitişik değil; dönünce kendine benzemez
    shape(C) {
      const { cols: w, sol, cur, R } = C, plates = [], plate = Array(C.n).fill(-1);
      const md = (a, b) => Math.abs(a % w - b % w) + Math.abs((a / w | 0) - (b / w | 0));
      const ok = i => C.free(i) && !C.keep[i] && !C.br?.includes(i) && !C.mouth?.has?.(i) && [C.hub, C.hub2, ...plates.flat()].every(h => h < 0 || md(i, h) > 1);
      for (let k = 0; k < C.x.table; k++) {
        const cand = [];
        for (let i = 0; i < C.n - w; i++) {
          const Q = [i, i + 1, i + w + 1, i + w], f = spin(Q), c = sol.slice(), s0 = Q.map(q => sol[q]) + '';
          if ((i + 1) % w && Q.every(ok) && [1, 2, 3].every(() => (f(c), Q.map(q => c[q]) + '' !== s0))) cand.push(Q);
        }
        if (!cand.length) break;
        const Q = cand[R() * cand.length | 0], f = spin(Q);
        Q.forEach(q => { cur[q] = sol[q]; plate[q] = plates.length; });
        for (let t = 1 + (R() * 3 | 0); t--;) f(cur);   // 1–3 dönüş → oyuncu 4 − t dokunuşla döner
        C.unit(Q, 4, f, 'table'); plates.push(Q);
      }
      if (plates.length) C.out.table = { plates, plate };
    },
    reveal(G, on) { for (const Q of G.table.plates) if (Q.some(q => G.seen[q])) Q.forEach(on); },
    onTap(G, U, i, now) { if (!calm.matches) T0.set(U.cells, now); api.tone(196, .14, .03, 'triangle'); },
    // 190 ms, back yumuşatması: karolar tabla merkezi çevresinde döner; ipucu karoyu yerinde döndürmez
    xform(D) {
      const { X, G } = D; let busy = false;
      for (const Q of G.table.plates) for (const q of Q) if (api.anim.delete(q)) X[q][2] = 0;
      for (const [Q, t0] of T0) {
        const t = (D.now - t0) / 190;
        if (t >= 1 || !G.table.plates.includes(Q)) { T0.delete(Q); continue; }
        const a = (api.back(Math.max(0, t)) - 1) * Math.PI / 2, c = Math.cos(a), s = Math.sin(a), [bx, by] = mid(X, Q);
        for (const q of Q) { const [x, y, r, sc] = X[q], dx = x - bx, dy = y - by; X[q] = [bx + dx * c - dy * s, by + dx * s + dy * c, r + a, sc, true]; }
        busy = true;
      }
      return busy;
    },
    // plaka (dolgu + kenar) ve dönen karoların eğik zemini
    base(D) {
      const { cx, s, X, pal } = D;
      disc(D, s * .98); cx.fillStyle = D.rgba(pal.fg, .06); cx.fill(); cx.lineWidth = 2; cx.strokeStyle = pal.mut; cx.stroke();
      cx.lineWidth = 1; cx.strokeStyle = pal.stroke;
      for (const Q of T0.keys()) for (const q of Q) {
        const [x, y, a, sc] = X[q], w = (s - 6) * sc;
        cx.save(); cx.translate(x, y); cx.rotate(a); cx.beginPath(); D.rrp(-w / 2, -w / 2, w, w, s * .24 * sc);
        cx.fillStyle = pal.tile; cx.fill(); cx.stroke();
        if (D.on(q)) { cx.fillStyle = D.rgba(D.OC[D.own(q)], pal.light ? .1 : .07); cx.fill(); }
        cx.restore();
      }
    },
    // pim: dolu disk + mil (durak halkasına benzemez)
    under(D) { disc(D, D.s * .08); D.cx.fillStyle = D.pal.mut; D.cx.fill(); disc(D, D.s * .028); D.cx.fillStyle = D.pal.bg; D.cx.fill(); },
  };
});
