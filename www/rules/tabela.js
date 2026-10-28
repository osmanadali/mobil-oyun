// M13 · Yön tabelası (sign): tabelalı karodan merkeze giden yol okun kenarından çıkmalı. Ok hücrede sabit, karo döner. Ayrıntı: docs/kurallar/tabela.md
(window.RAY_RULES = window.RAY_RULES || []).push(api => {
  const { popc, nb, ob } = api, K = { 1: 0, 2: 1, 4: 2, 8: 3 }, V = { 1: [0, -1], 2: [1, 0], 4: [0, 1], 8: [-1, 0] };
  const idx = new WeakMap(), list = g => { let a = idx.get(g); if (!a) idx.set(g, a = g.flatMap((b, i) => b ? [i] : [])); return a; };   // tabelalı karolar
  return {
    key: 'sign', line: 12, boost: 1.5, clash: ['ring'],
    card: { name: 'Yön tabelası', tag: 'Yeni: yön tabelası',
      demo: '<div class="rd-sign" aria-hidden="true"><i class="rd-sign-h"></i><i class="rd-sign-t"><b></b><svg class="rd-sign-a" viewBox="0 0 76 76"><path d="M6 38 22.8 26.6v22.8z"/></svg><i class="rd-sign-p"></i></i></div>',
      text: '<b>Tabelalı</b> karodan merkeze giden yol <b>okun gösterdiği kenardan</b> çıkmalı. Ok yere sabittir: <b>karo döner, ok dönmez</b>.' },
    // demo: köşe ray döner; batı kolu merkeze değerken (%50–90) ray yanar, ok dolar
    css: `.rd-sign{align-self:center;display:flex;align-items:center;margin:6px 0 2px}
.rd-sign-h{position:relative;width:30px;height:30px;border-radius:9px;background:var(--acc);box-shadow:0 0 12px var(--accGlow)}
.rd-sign-h:after{content:"";position:absolute;left:24px;top:8px;width:32px;height:14px;background:var(--acc)}
.rd-sign-t{position:relative;width:76px;height:76px;margin-left:20px;border-radius:22px;background:var(--tile);box-shadow:inset 0 0 0 1px var(--stroke)}
.rd-sign-t b{position:absolute;inset:0;animation:rd-sign-r 4s cubic-bezier(.3,1.4,.5,1) infinite}
.rd-sign-t b:before,.rd-sign-t b:after{content:"";position:absolute;left:31px;top:0;width:14px;height:45px;border-radius:8px;background:var(--railC);animation:rd-sign-l 4s infinite}
.rd-sign-t b:after{top:31px;width:45px;height:14px}
.rd-sign-a{position:absolute;inset:0;overflow:visible}
.rd-sign-a path{fill:var(--bg0);stroke:var(--fg);stroke-width:2.5;stroke-linejoin:round;animation:rd-sign-f 4s infinite}
.rd-sign-p{position:absolute;left:23px;top:23px;width:30px;height:30px;border-radius:50%;border:2.5px solid var(--fg);opacity:0;animation:rd-sign-p 1s ease-out infinite}
@keyframes rd-sign-r{0%,15%{transform:none}25%,40%{transform:rotate(90deg)}50%,65%{transform:rotate(180deg)}75%,90%{transform:rotate(270deg)}100%{transform:rotate(360deg)}}
@keyframes rd-sign-l{0%,46%,94%,100%{background:var(--railC)}50%,90%{background:var(--acc)}}
@keyframes rd-sign-f{0%,46%,94%,100%{fill:var(--bg0);stroke:var(--fg)}50%,90%{fill:var(--acc);stroke:#fff}}
@keyframes rd-sign-p{0%,45%{opacity:0;transform:scale(.6)}55%{opacity:.9;transform:scale(1)}80%,100%{opacity:0;transform:scale(1.8)}}`,
    amount: (n, intro) => Math.max(2, Math.round(n * (intro ? .03 : .05))),
    // sayaçtan sonra, karanlıktan önce; R() yalnız tabelalı bölümde. Aday: çıplak köşe/T, merkezden ≥ 2 adım, köprü komşusu değil.
    // Önce şaşırtıcılar (yol merkezin yönüne değil, yana/geriye çıkar), her grupta tabelaya bitişik olmayan öne. sign[i] = sol ağacında ebeveyn kolu.
    mark(C) {
      const { n, cols, sol, R } = C, T = api.tree(C), near = new Uint8Array(n), A = [], B = [], sign = new Array(n).fill(0);
      for (const b of C.br || []) { near[b] = 1; for (let k = 0; k < 4; k++) { const j = C.nb(b, k); if (j >= 0) near[j] = 1; } }
      for (let i = 0; i < n; i++) {
        const p = popc(sol[i]);
        if (!C.free(i) || C.rev[i] || C.cnt[i] >= 0 || p < 2 || p > 3 || C.per(sol[i]) === 2 || T.dep[i] < 2 || near[i]) continue;
        const [vx, vy] = V[T.pd[i]], h = T.ow[i] === 2 ? C.hub2 : C.hub;
        (vx * (h % cols - i % cols) + vy * ((h / cols | 0) - (i / cols | 0)) <= 0 ? A : B).push(i);
      }
      const lone = i => [0, 1, 2, 3].every(k => { const j = C.nb(i, k); return j < 0 || !sign[j]; });
      for (let k = 0; k < C.x.sign && (A.length || B.length); k++) {
        const L = A.length ? A : B, F = L.filter(lone), Q = F.length ? F : L, i = Q[R() * Q.length | 0];
        L.splice(L.indexOf(i), 1); sign[i] = T.pd[i];
      }
      C.out.sign = sign;
    },
    // okun kenarındaki komşu d−1'de ve aynı merkezde olmalı. Kazanma anında çizge orman (dönüş kol sayısını korur) → d−1 komşusu tam ebeveyn.
    check(P, L) {
      const { sign, cur } = P, { d, own } = L, bad = [];
      for (const i of list(sign)) {
        const b = sign[i], k = K[b], j = nb(P, i, k);
        if (!(d[i] >= 0 && (cur[i] & b) && j >= 0 && (cur[j] & ob(P, i, k)) && d[j] === d[i] - 1 && own[j] === own[i])) bad.push(i);
      }
      L.signBad = bad; L.signBase = L.solved;   // signBase: tabela dışında her şey tamam
      return bad.length;
    },
    allow: (P, i, m) => !P.sign[i] || !!(m & P.sign[i]),   // zorluk: ok kenarında kolu olmayan durum elenir
    // hepsi bağlı ama tabela yüzünden bitmiyor: yanlışlar nabız atar, bölümde bir kez bildirim · tabelalı karoya ilk dokunuş: bir kez ipucu
    after(G, i, now) {
      const L = G.L, bad = L.signBad || [];
      if (L.signBase && bad.length) {
        for (const k of bad) api.press.set(k, now);
        if (G.signTold) return;
        G.signTold = 1; api.tone(330, .12, .02, 'sine', .1);
        api.toast('Tabela: merkeze giden yol okun kenarından geçmeli' + (G.cnt.some((c, k) => c === 0 && G.cur[k] !== G.sol[k]) ? ' · ↺ baştan ya da 💡' : ''));
      } else if (G.sign[i] && !api.save.signTip) { api.save.signTip = 1; api.persist(); api.toast('Tabela · karo döner, ok yerinde kalır'); }
    },
    // hücreye sabit üçgen (açı kullanılmaz). Sağlanmış ve yanan: hat rengi + beyaz kenar; diğerleri içi boş. İpucuyla sabitlenen doğru ok soluk.
    over(D) {
      const { G, s, X, on, vis, own, OC, cx, pal } = D, I = list(G.sign), bad = G.L.signBad || [];
      const tri = i => {
        const [x, y, , sc] = X[i], [vx, vy] = V[G.sign[i]], k = s * sc, bx = x + vx * .2 * k, by = y + vy * .2 * k, w = .15 * k;
        cx.moveTo(x + vx * .43 * k, y + vy * .43 * k); cx.lineTo(bx - vy * w, by + vx * w); cx.lineTo(bx + vy * w, by - vx * w); cx.closePath();
      };
      const ok = i => vis(i) && on(i) && !bad.includes(i), path = (Q, a, f, w, c) => { if (!Q.length) return; cx.beginPath(); Q.forEach(tri); cx.globalAlpha = a; cx.fillStyle = f; cx.fill(); cx.lineWidth = w; cx.strokeStyle = c; cx.stroke(); };
      cx.lineJoin = 'round';
      for (const t of [1, 2, 3]) for (const f of [0, 1]) path(I.filter(i => ok(i) && own(i) === t && +!!G.fixed[i] === f), f ? .45 : 1, OC[t], 1.5, '#fff');
      path(I.filter(i => vis(i) && !ok(i)), 1, pal.bg, 2, pal.fg);
      cx.globalAlpha = 1; cx.lineJoin = 'miter';
    },
  };
});
