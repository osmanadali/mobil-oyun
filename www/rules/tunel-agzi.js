// M19 · Tünel ağzı (anahtar: portal) — kuralın tamamı bu dosyada. Sözleşme: docs/kurallar/README.md · tasarım: docs/kurallar/tunel-agzi.md
// Kenardaki iki geçit (hücre + dışa bakan yön) birbirinin komşusudur: C.adj/C.ao yalnız tünelli bölümde kurulur, çekirdek nb/ob ile okur.
(window.RAY_RULES = window.RAY_RULES || []).push(api => {
  const { DIRS } = api, ABC = 'ABC', bit = k => DIRS[k][0];
  const md = (c, i, j) => Math.abs(i % c - j % c) + Math.abs((i / c | 0) - (j / c | 0));
  const ends = p => [[p.a, p.ka], [p.b, p.kb]];
  const used = (m, p) => (m[p.a] & bit(p.ka)) && (m[p.b] & bit(p.kb)), lit2 = (G, p) => used(G.cur, p) && G.L.d[p.a] >= 0 && G.L.d[p.b] >= 0;
  return {
    key: 'portal', line: 18,
    card: { name: 'Tünel ağzı', tag: 'Yeni: tünel ağzı',
      demo: '<div class="rd-portal" aria-hidden="true"><i class="rd-pm">A</i><i class="ft on"><b></b></i><i class="ft on"><b></b></i><i class="ft on"><b></b></i><i class="rd-pm r">A</i><i class="rd-pt"></i></div>',
      text: 'Kenardaki <b>aynı harfli</b> iki tünel ağzı bağlıdır: birine giren ray <b>öbüründen çıkar</b>. Tüneli kullanmak zorunlu değil; harfsiz kenar <b>kapalıdır</b>.' },
    css: `.rd-portal{position:relative;align-self:center;display:flex;align-items:center;gap:4px;margin:6px 0 2px}.rd-portal .ft{width:56px;height:56px}.rd-portal .ft b{top:21px}
.rd-pm{width:18px;height:44px;border-radius:22px 0 0 22px;background:var(--acc);color:var(--onacc);font-style:normal;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center;text-align:center;padding-left:3px}.rd-pm.r{border-radius:0 22px 22px 0;padding:0 3px 0 0}
.rd-pt{position:absolute;left:0;top:50%;width:12px;height:12px;margin-top:-6px;border-radius:50%;background:#fff;box-shadow:0 0 10px #fff;animation:rdpt 2.8s linear infinite}
@keyframes rdpt{0%{transform:translateX(104px)}40%{transform:translateX(205px);opacity:1}41%,42%{opacity:0}42%{transform:translateX(3px)}43%{opacity:1}100%{transform:translateX(104px)}}
@media (prefers-reduced-motion:reduce){.rd-pt{display:none}}`,
    // tanıtım: −1 → 1 çift, merkez satırının bir üstünde ya da altında satırın iki ucu · hat finali 3 · sonra 2
    amount: (n, intro, z, fin) => intro ? -1 : fin ? 3 : 2,
    pre(C) {
      const { cols, rows, n, R, hub, hub2 } = C, adj = new Int16Array(n * 4), ao = new Uint8Array(n * 4);
      for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) { adj[i * 4 + k] = api.nb(C, i, k); ao[i * 4 + k] = DIRS[k][3]; }
      // aday: kenar hücresi + dışa bakan yön (köşede tek geçit); merkez, merkez komşusu ve köprü (keep) olamaz
      const okc = i => !C.keep[i] && md(cols, i, hub) > 1 && (hub2 < 0 || md(cols, i, hub2) > 1), cand = [], P = [];
      for (let i = 0; i < n; i++) if (okc(i)) { const ks = [0, 1, 2, 3].filter(k => adj[i * 4 + k] < 0); if (ks.length) cand.push([i, ks[R() * ks.length | 0]]); }
      const add = (a, ka, b, kb) => P.push({ a, ka, b, kb, id: P.length });
      const ys = [...Array(rows).keys()].filter(y => okc(y * cols) && okc(y * cols + cols - 1)), hy = ys.filter(y => Math.abs(y - (hub / cols | 0)) === 1);
      if (C.x.portal < 0 && cols > 2 && ys.length) { const Y = hy.length ? hy : ys, y = Y[R() * Y.length | 0]; add(y * cols + cols - 1, 1, y * cols, 3); }   // sağdan çıkan soldan girer
      else for (let p = 0; p < Math.abs(C.x.portal); p++) for (let t = 0; t < 40 && cand.length > 1; t++) {
        const u = R() * cand.length | 0, v = R() * cand.length | 0, [a, ka] = cand[u], [b, kb] = cand[v];
        if (md(cols, a, b) < 3) continue;   // aynı ya da komşu hücre olmaz (yakın çift de sıkıcı)
        cand.splice(Math.max(u, v), 1); cand.splice(Math.min(u, v), 1); add(a, ka, b, kb); break;
      }
      for (const { a, ka, b, kb } of P) { adj[a * 4 + ka] = b; ao[a * 4 + ka] = bit(kb); adj[b * 4 + kb] = a; ao[b * 4 + kb] = bit(ka); }
      if (!P.length) return;   // yer yok: kural bu bölümde kapalı
      C.mouth = new Set(P.flatMap(p => [p.a, p.b])); C.mouth.forEach(i => { C.keep[i] = true; });
      C.adj = adj; C.ao = ao; C.out.portal = P;
      // ağaca ilk giren ağzın eşi henüz ağaçta değilse tünelden o da alınır (kanıt: docs). İlk değen çift her zaman, sonrakiler yarı yarıya.
      const pm = new Map(P.flatMap(p => [[p.a, [p.ka, p.b, p.kb, p]], [p.b, [p.kb, p.a, p.ka, p]]])), seen = new Set();
      C.onTake.push(j => {
        const e = pm.get(j); if (!e || seen.has(e[3])) return;
        const [kj, o, ko, p] = e, first = !seen.size; seen.add(p);
        if (C.inT[o] || (!first && R() >= .5)) return;
        C.sol[j] |= bit(kj); C.sol[o] |= bit(ko); C.take(o);
      });
    },
    // karanlık tünel: yanan ağzın eşi ve eşin çevresi de aydınlanır
    reveal(G, on, area) { for (const p of G.portal) for (const [c, e] of [[p.a, p.b], [p.b, p.a]]) if (G.L.d[c] >= 0) { on(e); area(e); } },
    pad(G, p) { for (const q of G.portal) for (const [, k] of ends(q)) { const s = 'trbl'[k]; p[s] = Math.max(p[s], .3); } },
    after(G) {
      for (const p of G.portal) {
        if (G.ptOk?.[p.id] || !lit2(G, p)) continue;
        (G.ptOk ||= [])[p.id] = 1; api.tone(api.note(9), .28, .04, 'sine'); api.tone(api.note(11), .3, .03, 'sine', .09);
        api.burst(p.a, 6, 0, api.G.color); api.burst(p.b, 6, 90, api.G.color);
        if (!G.ptTold) { G.ptTold = 1; api.toast(`Tünel ${ABC[p.id]} · bir ağızdan girdi, öbüründen çıktı`); }
      }
    },
    // tahta dışına taşan yuvarlak köşeli sekme + tek harf. Boşlar tek yol; bağlı tünel (iki kol + iki uç yanıyor) hat renginde
    top(D) {
      const { G, s, X, own, OC, cx, pal } = D, M = [], w = s * .54, h = s * .27;
      for (const p of G.portal) { const c = lit2(G, p) ? OC[own(p.a)] : null; for (const [i, k] of ends(p)) M.push([i, k, c, p.id]); }
      const at = (i, k) => { const [, dx, dy] = DIRS[k], [x, y] = X[i]; return [x + dx * (s / 2 + h / 2 - 1.5), y + dy * (s / 2 + h / 2 - 1.5), dx]; };
      for (const c of new Set(M.map(m => m[2]))) {
        cx.beginPath();
        for (const [i, k, mc] of M) if (mc === c) { const [x, y, dx] = at(i, k), W = dx ? h + 3 : w, H = dx ? w : h + 3; D.rrp(x - W / 2, y - H / 2, W, H, s * .1); }
        cx.fillStyle = c || pal.bg; cx.fill(); if (!c) { cx.lineWidth = 1.5; cx.strokeStyle = pal.mut; cx.stroke(); }
      }
      cx.font = `800 ${Math.round(Math.max(10, s * .26))}px Outfit, system-ui`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
      for (const [i, k, c, id] of M) { const [x, y] = at(i, k); cx.fillStyle = !c ? pal.fg : c[0] === '#' && api.lum(c) > .5 ? '#16182a' : '#fff'; cx.fillText(ABC[id], x, y + 1); }
      cx.textBaseline = 'alphabetic';
    },
  };
});
