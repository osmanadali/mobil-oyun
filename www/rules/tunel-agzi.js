// M19 · Tünel ağzı (anahtar: portal) — kuralın tamamı bu dosyada. Sözleşme: docs/kurallar/README.md · tasarım: docs/kurallar/tunel-agzi.md
// Kenardaki iki geçit (hücre + dışa bakan yön) birbirinin komşusudur: C.adj/C.ao yalnız tünelli bölümde kurulur, çekirdek nb/ob ile okur.
(window.RAY_RULES = window.RAY_RULES || []).push(api => {
  const { DIRS } = api, ABC = 'ABC', bit = k => DIRS[k][0];
  const md = (c, i, j) => Math.abs(i % c - j % c) + Math.abs((i / c | 0) - (j / c | 0));
  const ends = p => [[p.a, p.ka], [p.b, p.kb]];
  const used = (m, p) => (m[p.a] & bit(p.ka)) && (m[p.b] & bit(p.kb));
  // şekil: A◆ B● C▲ (renge dayanmaz) · (x, y) merkez, r yarıçap
  const shape = (cx, id, x, y, r) => {
    if (id === 1) { cx.moveTo(x + r, y); cx.arc(x, y, r, 0, 7); return; }
    const q = id ? [[0, -1.15], [1.1, .8], [-1.1, .8]] : [[0, -1.3], [1.1, 0], [0, 1.3], [-1.1, 0]];
    q.forEach(([a, b], k) => cx[k ? 'lineTo' : 'moveTo'](x + a * r, y + b * r)); cx.closePath();
  };
  return {
    key: 'portal', line: 18, tOrder: 0,
    card: { name: 'Tünel ağzı', tag: 'Yeni: tünel ağzı',
      demo: '<div class="rd-portal" aria-hidden="true"><i class="rd-pm">A<br>◆</i><i class="ft on"><b></b></i><i class="ft on"><b></b></i><i class="ft on"><b></b></i><i class="rd-pm r">A<br>◆</i><i class="rd-pt"></i></div>',
      text: 'Kenardaki <b>aynı harfli</b> iki tünel ağzı bağlıdır: birine giren ray <b>öbüründen çıkar</b>. Harfsiz kenar <b>kapalıdır</b>.' },
    css: `.rd-portal{position:relative;align-self:center;display:flex;align-items:center;gap:4px;margin:6px 0 2px}.rd-portal .ft{width:56px;height:56px}.rd-portal .ft b{top:21px}
.rd-pm{width:18px;height:44px;border-radius:22px 0 0 22px;background:var(--acc);color:var(--onacc);font-style:normal;font-weight:800;font-size:11px;line-height:13px;display:flex;align-items:center;justify-content:center;text-align:center;padding-left:3px}.rd-pm.r{border-radius:0 22px 22px 0;padding:0 3px 0 0}
.rd-pt{position:absolute;left:0;top:50%;width:12px;height:12px;margin-top:-6px;border-radius:50%;background:#fff;box-shadow:0 0 10px #fff;animation:rdpt 2.8s linear infinite}
@keyframes rdpt{0%{transform:translateX(104px)}40%{transform:translateX(205px);opacity:1}41%,42%{opacity:0}42%{transform:translateX(3px)}43%{opacity:1}100%{transform:translateX(104px)}}`,
    // tanıtım: 1 çift (aynı satırın iki ucu) · hat finali 3 · sonra 2
    amount: (n, intro, z, fin) => intro ? 1 : fin ? 3 : 2,
    pre(C) {
      const { cols, rows, n, R, hub, hub2 } = C, adj = new Int16Array(n * 4), ao = new Uint8Array(n * 4);
      for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) { adj[i * 4 + k] = api.nb(C, i, k); ao[i * 4 + k] = DIRS[k][3]; }
      // aday: kenar hücresi + dışa bakan yön (köşede tek geçit); merkez, merkez komşusu ve köprü (keep) olamaz
      const okc = i => !C.keep[i] && md(cols, i, hub) > 1 && (hub2 < 0 || md(cols, i, hub2) > 1), cand = [], P = [];
      for (let i = 0; i < n; i++) if (okc(i)) { const ks = [0, 1, 2, 3].filter(k => adj[i * 4 + k] < 0); if (ks.length) cand.push([i, ks[R() * ks.length | 0]]); }
      const add = (a, ka, b, kb) => P.push({ a, ka, b, kb, id: P.length });
      const ys = [...Array(rows).keys()].filter(y => okc(y * cols) && okc(y * cols + cols - 1));
      if (C.x.portal === 1 && cols > 2 && ys.length) { const y = ys[R() * ys.length | 0]; add(y * cols + cols - 1, 1, y * cols, 3); }   // sağdan çıkan soldan girer
      else for (let p = 0; p < C.x.portal; p++) for (let t = 0; t < 40 && cand.length > 1; t++) {
        const u = R() * cand.length | 0, v = R() * cand.length | 0, [a, ka] = cand[u], [b, kb] = cand[v];
        if (md(cols, a, b) < 3) continue;   // aynı ya da komşu hücre olmaz (yakın çift de sıkıcı)
        cand.splice(Math.max(u, v), 1); cand.splice(Math.min(u, v), 1); add(a, ka, b, kb); break;
      }
      for (const { a, ka, b, kb } of P) { adj[a * 4 + ka] = b; ao[a * 4 + ka] = bit(kb); adj[b * 4 + kb] = a; ao[b * 4 + kb] = bit(ka); }
      C.mouth = new Set(P.flatMap(p => [p.a, p.b])); C.mouth.forEach(i => { C.keep[i] = true; });
      if (P.length) { C.adj = adj; C.ao = ao; }
      C.out.portal = P;
    },
    // hiçbir tünel kullanılmadıysa döngü değiş tokuşu: a→b ağaç yolundan rastgele bir kenar çıkar, tünel kolunu ekle (kanıt: docs)
    tree(C) {
      const { sol, n, R } = C, P = C.out.portal, sp = C.out.split;
      if (!P.length || P.some(p => used(sol, p))) return;
      for (let t = 0, o = R() * P.length | 0; t < P.length; t++) {
        const p = P[(o + t) % P.length], pv = new Int32Array(2 * n).fill(-1), pe = [], q = [p.a]; pv[p.a] = p.a;
        while (q.length && pv[p.b] < 0) {   // ağaçta BFS (köprü: iki yarı ayrı düğüm, lit ile aynı)
          const u = q.shift(), i = u % n, half = sp?.[i] ? (u < n ? 5 : 10) : 15;
          for (let k = 0; k < 4; k++) {
            const j = C.nb(i, k), o = j < 0 ? 0 : C.ob(i, k); if (!(sol[i] & bit(k) & half) || j < 0 || !(sol[j] & o)) continue;
            const v = sp?.[j] && (o & 10) ? n + j : j; if (pv[v] < 0) { pv[v] = u; pe[v] = [i, bit(k), j, o]; q.push(v); }
          }
        }
        if (pv[p.b] < 0) continue;   // iki merkez: a ile b ayrı ağaçta
        const path = []; for (let v = p.b; v !== p.a; v = pv[v]) if (!sp?.[pe[v][0]] && !sp?.[pe[v][2]]) path.push(pe[v]);
        if (!path.length) continue;
        const [i, bi, j, bj] = path[R() * path.length | 0];
        sol[i] &= ~bi; sol[j] &= ~bj; sol[p.a] |= bit(p.ka); sol[p.b] |= bit(p.kb);
        return;
      }
    },
    // karanlık tünel: yanan ağzın eşi ve eşin çevresi de aydınlanır
    reveal(G, on, area) { for (const p of G.portal) for (const [c, e] of [[p.a, p.b], [p.b, p.a]]) if (G.L.d[c] >= 0) area(e); },
    pad(G, p) { for (const q of G.portal) for (const [, k] of ends(q)) { const s = 'trbl'[k]; p[s] = Math.max(p[s], .22); } },
    after(G) {
      for (const p of G.portal) {
        if (G.ptOk?.[p.id] || G.L.d[p.a] < 0 || !used(G.cur, p)) continue;
        (G.ptOk ||= [])[p.id] = 1; api.tone(api.note(9), .28, .04, 'sine'); api.tone(api.note(11), .3, .03, 'sine', .09);
        api.burst(p.a, 6, 0, api.G.color); api.burst(p.b, 6, 90, api.G.color);
        if (!G.ptTold) { G.ptTold = 1; api.toast(`Tünel ${ABC[p.id]} · bir ağızdan girdi, öbüründen çıktı`); }
      }
    },
    // tahta dışına taşan yarım elips ağızlar: boş olanlar tek yol, bağlı tüneller hat renginde; harf + şekil
    top(D) {
      const { G, s, X, on, own, OC, col, cx, pal } = D, M = [];
      for (const p of G.portal) { const c = used(G.cur, p) && on(p.a) ? OC[own(p.a)] || col : null; for (const [i, k] of ends(p)) M.push([i, k, c, p.id]); }
      const xy = (i, k, o, a) => { const [, dx, dy] = DIRS[k], [x, y] = X[i]; return [x + dx * (s / 2 + o) + Math.abs(dy) * a, y + dy * (s / 2 + o) + Math.abs(dx) * a]; };
      for (const c of new Set(M.map(m => m[2]))) {
        cx.beginPath();
        for (const [i, k, mc] of M) if (mc === c) { const [x, y] = xy(i, k, 0, 0); cx.moveTo(x, y); cx.ellipse(x, y, s * .34, s * .215, k * Math.PI / 2, -Math.PI, 0); cx.closePath(); }
        cx.fillStyle = c || pal.bg; cx.fill(); if (!c) { cx.lineWidth = 1.5; cx.strokeStyle = pal.mut; cx.stroke(); }
      }
      cx.font = `800 ${Math.round(s * .2)}px Outfit, system-ui`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
      for (const dark of [0, 1]) {
        cx.fillStyle = dark ? '#16182a' : pal.fg; cx.beginPath();
        for (const [i, k, c, id] of M) if (!!c === !!dark) { const [x, y] = xy(i, k, s * .09, s * .1); shape(cx, id, x, y, s * .052); cx.fillText(ABC[id], ...xy(i, k, s * .095, -s * .085)); }
        cx.fill();
      }
      cx.textBaseline = 'alphabetic';
    },
  };
});
