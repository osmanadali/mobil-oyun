// M27 · Tek yön (oneway): oklu rayda tren yalnız ok yönünde gider. Ok karonun rayına çizilidir, karoyla birlikte döner;
// okun geldiği kol (giriş) merkeze giden kol olmalı. Ayrıntı ve kanıt: docs/kurallar/tek-yon.md
(window.RAY_RULES = window.RAY_RULES || []).push(api => {
  // bildirimler (L burada küresel çeviri; after içinde L = G.L gölgeler)
  const MSG = {
    path: L('Tek yön: oklu karoya hat okun geldiği koldan girmeli', 'One-way: the line must enter an arrowed tile from the arrow’s tail'),
    tip: L('Tek yön · ok karoyla birlikte döner', 'One-way · the arrow turns with the tile'),
  };
  const { popc, nb, ob, rot } = api, K = { 1: 0, 2: 1, 4: 2, 8: 3 }, V = { 1: [0, -1], 2: [1, 0], 4: [0, 1], 8: [-1, 0] };
  const idx = new WeakMap(), list = g => { let a = idx.get(g); if (!a) idx.set(g, a = g.flatMap((b, i) => b ? [i] : [])); return a; };   // oklu karolar
  // giriş kolu: oneway[i] çözüm yönündeki giriş biti; m = rot^t(sol[i]) ise giriş rot^t(oneway[i]) (oklu karo köşe ya da T: 4 yönü ayrı)
  const entry = (P, i, m) => { let s = P.sol[i], e = P.oneway[i]; for (let t = 0; t < 4; t++, s = rot(s), e = rot(e)) if (s === m) return e; return 0; };
  const isHub = (P, j) => j === P.hub || (P.hub2 >= 0 && j === P.hub2);
  return {
    key: 'oneway', line: 26, ord: 26, boost: 6.5,
    // tabela: iki ayrı ok kuralı aynı tahtada karışır · halka: döngüde akış yönü tanımsız
    clash: ['sign', 'ring'],
    card: { name: L('Tek yön', 'One-way track'), tag: L('Yeni: tek yön', 'New: one-way track'),
      demo: '<div class="rd-oneway" aria-hidden="true"><i class="rd-oneway-h"></i><i class="rd-oneway-t"><b><s></s><s></s><u></u><u></u></b></i></div>',
      text: L('Oklu rayda tren <b>yalnız ok yönünde</b> gider: okun geldiği kol <b>merkeze</b> bakmalı. Ok karoyla birlikte döner.',
        'On an arrowed track trains run <b>only the arrow’s way</b>: the arm the arrow comes from must lead <b>to the hub</b>. The arrow turns with the tile.') },
    // demo: köşe ray (giriş batı, çıkış güney) 90° adımlarla döner. Çıkış merkeze bakınca kırmızı (ters yön), giriş bakınca yanar.
    css: `.rd-oneway{align-self:center;display:flex;align-items:center;margin:6px 0 2px}
.rd-oneway-h{position:relative;width:30px;height:30px;border-radius:9px;background:var(--acc);box-shadow:0 0 12px var(--accGlow)}
.rd-oneway-h:after{content:"";position:absolute;left:24px;top:8px;width:32px;height:14px;background:var(--acc)}
.rd-oneway-t{position:relative;width:76px;height:76px;margin-left:20px;border-radius:22px;background:var(--tile);box-shadow:inset 0 0 0 1px var(--stroke)}
.rd-oneway-t b{position:absolute;inset:0;animation:rdoR 4.4s cubic-bezier(.3,1.4,.5,1) infinite}
.rd-oneway-t s{position:absolute;left:0;top:31px;width:45px;height:14px;border-radius:8px;background:var(--railC);animation:rdoC 4.4s infinite}
.rd-oneway-t s+s{left:31px;width:14px;height:45px}
.rd-oneway-t u{position:absolute;left:10px;top:32px;width:10px;height:10px;border:solid #fff;border-width:3px 3px 0 0;transform:rotate(45deg);filter:drop-shadow(0 0 1.5px var(--bg0))}
.rd-oneway-t u+u{left:33px;top:53px;transform:rotate(135deg)}
@keyframes rdoR{0%,18%{transform:rotate(90deg)}26%,40%{transform:rotate(180deg)}48%,62%{transform:rotate(270deg)}70%,92%{transform:rotate(360deg)}100%{transform:rotate(450deg)}}
@keyframes rdoC{0%,18%{background:var(--warn)}22%,66%{background:var(--railC)}70%,92%{background:var(--acc)}97%,100%{background:var(--warn)}}
@media (prefers-reduced-motion:reduce){.rd-oneway-t b,.rd-oneway-t s{animation:none}.rd-oneway-t s{background:var(--acc)}}`,
    // tanıtımda 2 oklu karo, sonra karo sayısının ~%6'sı (6×8: 3, 7×9: 4)
    amount: (n, intro) => intro ? 2 : Math.max(3, Math.round(n * .06)),
    // sayaçtan sonra, karanlıktan önce (ord 26: mühürlü karo ve tabeladan sonra). R() yalnız tek yönlü bölümde.
    // Aday: çıplak köşe/T (dört yönü ayrı), köprü ve komşusu değil. Giriş = çözümde merkeze giden kol (lit uzaklığıyla: tünel, sarmal, iki merkez dahil).
    // Önce şaşırtıcılar (giriş merkezin yönüne bakmıyor), her grupta oklu karoya bitişik olmayan öne.
    mark(C) {
      const { n, cols, sol, R, cur } = C, o = C.out, near = new Uint8Array(n), A = [], B = [], ow = new Array(n).fill(0);
      for (const b of C.br || []) { near[b] = 1; for (let k = 0; k < 4; k++) { const j = C.nb(b, k); if (j >= 0) near[j] = 1; } }
      // merkezin (ızgarada) komşuları da değil: karanlık tünel onları döndürür, ok çözüm yönüne düşebilir
      for (const h of [C.hub, C.hub2]) if (h >= 0) for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) { const x = h % cols + dx, y = (h / cols | 0) + dy; if (x >= 0 && y >= 0 && x < cols && y < C.rows) near[y * cols + x] = 1; }
      const P = { ...C, ...o, cur: sol }, { d, own } = api.lit(P);
      for (let i = 0; i < n; i++) {
        const p = popc(sol[i]);
        if (!C.free(i) || C.rev[i] || C.cnt[i] >= 0 || p < 2 || p > 3 || C.per(sol[i]) !== 4 || near[i] || o.sign?.[i] || o.void?.[i] || o.self?.[i] || d[i] < 2) continue;
        // giriş kolu: d − 1 uzaklıktaki, aynı merkeze bağlı komşuya bakan kol (orman: tam bir tane)
        const e = [0, 1, 2, 3].filter(k => { const j = C.nb(i, k); return (sol[i] & 1 << k) && j >= 0 && (sol[j] & C.ob(i, k)) && d[j] === d[i] - 1 && own[j] === own[i]; });
        if (e.length !== 1) continue;
        const b = 1 << e[0], [vx, vy] = V[b], h = own[i] === 2 ? C.hub2 : C.hub;
        (vx * (h % cols - i % cols) + vy * ((h / cols | 0) - (i / cols | 0)) <= 0 ? A : B).push([i, b]);
      }
      const lone = i => [0, 1, 2, 3].every(k => { const j = C.nb(i, k); return j < 0 || !ow[j]; });
      for (let k = 0; k < C.x.oneway && (A.length || B.length); k++) {
        const G0 = A.length ? A : B, F = G0.filter(([i]) => lone(i)), Q = F.length ? F : G0, c = Q[R() * Q.length | 0];
        G0.splice(G0.indexOf(c), 1); ow[c[0]] = c[1];
        if (cur[c[0]] === sol[c[0]]) cur[c[0]] = rot(cur[c[0]]);   // yanıltıcı başlangıç: ok çözüm yönünde gelmez
      }
      if (ow.some(Boolean)) C.out.oneway = ow;
    },
    // giriş kolundaki komşu d − 1'de ve aynı merkezde olmalı (kazanma anında çizge orman → tam ebeveyn)
    check(P, L) {
      const { cur } = P, { d, own } = L, bad = [];
      for (const i of list(P.oneway)) {
        const b = entry(P, i, cur[i]), k = K[b], j = k == null ? -1 : nb(P, i, k);
        if (!(d[i] >= 0 && j >= 0 && (cur[j] & ob(P, i, k)) && d[j] === d[i] - 1 && own[j] === own[i])) bad.push(i);
      }
      L.owBad = bad; L.owBase = L.solved;   // owBase: tek yön dışında her şey tamam
      return bad.length;
    },
    // zorluk çözücüsü (yerel, sağlam): giriş tahta dışına ya da merkez olmayan bir durağa (tek kollu karo) bakamaz; çıkış kolu merkeze bakamaz
    allow(P, i, m) {
      if (!P.oneway[i]) return true;
      const e = entry(P, i, m), j = nb(P, i, K[e]);
      if (j < 0) return false;
      if (!isHub(P, j) && popc(P.cur[j]) === 1 && (P.unitOf?.[j] ?? -1) < 0 && !P.self?.[j]) return false;
      for (let k = 0; k < 4; k++) if ((m & 1 << k) && 1 << k !== e && isHub(P, nb(P, i, k))) return false;
      return true;
    },
    // hepsi bağlı ama tek yön yüzünden bitmiyor: yanlışlar nabız atar, bölümde bir kez bildirim · oklu karoya ilk dokunuş: bir kez ipucu
    after(G, i, now) {
      const L = G.L, bad = L.owBad || [];
      if (L.owBase && bad.length) {
        for (const k of bad) api.press.set(k, now);
        if (G.owTold) return;
        G.owTold = 1; api.tone(330, .12, .02, 'sine', .1); api.toast(MSG.path);
      } else if (G.oneway[i] && !api.save.owTip) { api.save.owTip = 1; api.persist(); api.toast(MSG.tip); }
    },
    // ok: rayın üstünde, karoyla dönen açık şeritler (›, koyu kenarlı). Girişte merkeze doğru, çıkışlarda dışa doğru. Bozuksa uyarı renginde.
    rails(D) {
      const { G, s, X, vis, cx, pal } = D, I = list(G.oneway), bad = G.L.owBase ? G.L.owBad || [] : [];
      const chev = (i, set) => {
        const [x, y, a, sc] = X[i], m = G.cur[i], e = entry(G, i, m), c = Math.cos(a), si = Math.sin(a), Lh = s / 2 * sc, h = s * .07 * sc, w = s * .09 * sc;
        for (const [b, dx, dy] of [[1, 0, -1], [2, 1, 0], [4, 0, 1], [8, -1, 0]]) {
          if (!(m & b)) continue;
          const ux = dx * c - dy * si, uy = dx * si + dy * c, f = b === e ? -1 : 1, px = x + ux * Lh * .56, py = y + uy * Lh * .56, tx = ux * f, ty = uy * f;
          set.moveTo(px - tx * h - ty * w, py - ty * h + tx * w); set.lineTo(px + tx * h, py + ty * h); set.lineTo(px - tx * h + ty * w, py - ty * h - tx * w);
        }
      };
      // iki geçiş: koyu kenar + açık iç → hem rayın üstünde hem karo zemininde okunur; bozuksa iç uyarı renginde
      const draw = (Q, col) => { if (!Q.length) return; cx.beginPath(); Q.forEach(i => chev(i, cx)); cx.lineWidth = Math.max(3, s * .1); cx.strokeStyle = pal.bg; cx.stroke(); cx.lineWidth = Math.max(1.5, s * .045); cx.strokeStyle = col; cx.stroke(); };
      cx.save(); cx.lineCap = 'round'; cx.lineJoin = 'round';
      const V0 = I.filter(i => vis(i));
      draw(V0.filter(i => !bad.includes(i)), '#fff');
      draw(V0.filter(i => bad.includes(i)), G.warn);
      cx.restore();
    },
  };
});
