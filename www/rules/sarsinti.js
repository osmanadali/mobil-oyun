// M28 · Sarsıntı durağı (quake): 🌋 durak hatta bağlandığı an (yanmıyorken yanınca) çevresindeki karolar 90° saat yönünde sarsılıp döner.
// Her kopup yeniden bağlanışta yine sarsar. Sarsılan karolar durağın merkeze giden yolunda olmaz: durak bağlıyken komşular düzeltilir,
// durak yanık kalır, yeniden sarsıntı olmaz (çözülebilirlik). Ayrıntı ve kanıt: docs/kurallar/sarsinti.md
(window.RAY_RULES = window.RAY_RULES || []).push(api => {
  const MSG = {
    first: L('🌋 Sarsıntı · durak bağlanınca çevresi 90° döndü', '🌋 Quake · the station connected and its neighbors turned 90°'),
  };
  const { popc, rot } = api, MAG = '#ff7a45', MAG_L = '#c2410c', DUR = 520, LAG = 140;
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  // ızgara komşuları (tahta dışı yok; tünel/sarmal geçidi sayılmaz: sarsıntı fiziksel çevredir)
  const around = (cols, rows, i) => { const x = i % cols, y = i / cols | 0, o = []; for (const [, dx, dy] of api.DIRS) { const a = x + dx, b = y + dy; if (a >= 0 && b >= 0 && a < cols && b < rows) o.push(b * cols + a); } return o; };
  const on = (L, q) => L.d[q] >= 0;
  return {
    key: 'quake', line: 27, ord: 28, boost: 12,
    // kendiliğinden dönen/kayan karolar (bakım karosu, kayan sıra/sütun) durağın yolunu sarsıntıdan bağımsız bozar; son sefer hamle payını sarsıntı bilmez
    clash: ['gear', 'slide', 'column', 'last'],
    card: { name: L('Sarsıntı durağı', 'Quake station'), tag: L('Yeni: sarsıntı durağı', 'New: quake station'),
      demo: '<div class="rd-quake" aria-hidden="true"><i></i><i></i><i></i><i></i><s class="p"></s><b class="h"></b><u></u><q></q><s class="n"></s><s class="n"></s><em></em></div>',
      text: L('🌋 durak hatta <b>bağlandığı an</b> çevresindeki karolar <b>90° saat yönünde</b> sarsılır; her yeniden bağlanışta yine. Durağı <b>en sona bırak</b> ya da önce bağla, <b>komşularını sonra</b> düzelt.',
        'The moment a 🌋 station <b>joins the line</b>, the tiles around it shake <b>90° clockwise</b>, again on every reconnect. <b>Leave it for last</b>, or connect it first and <b>fix its neighbors after</b>.') },
    // demo: 3×2 tahtanın dört karosu; hat durağa ulaşınca halka yayılır, üstteki ve sağdaki karo sarsılıp 90° döner
    css: `.rd-quake,.rd-quake *{box-sizing:border-box}.rd-quake{position:relative;align-self:center;width:132px;height:86px;margin:10px 0 2px}
.rd-quake i{position:absolute;width:40px;height:40px;border-radius:12px;background:var(--tile);box-shadow:inset 0 0 0 1px var(--stroke)}
.rd-quake i:nth-of-type(1){left:46px}.rd-quake i:nth-of-type(2){top:46px}.rd-quake i:nth-of-type(3){left:46px;top:46px}.rd-quake i:nth-of-type(4){left:92px;top:46px}
.rd-quake s{position:absolute;border-radius:5px;background:var(--railC)}
.rd-quake .p{left:16px;top:61px;width:54px;height:10px;animation:rdqP 4.4s infinite}
.rd-quake .n{left:50px;top:15px;width:32px;height:10px;animation:rdqN 4.4s infinite}.rd-quake .n+.n{left:107px;top:50px;width:10px;height:32px}
.rd-quake .h{position:absolute;left:9px;top:55px;width:22px;height:22px;border-radius:7px;background:var(--acc);box-shadow:0 0 10px var(--accGlow)}
.rd-quake u{position:absolute;left:57px;top:57px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:inset 0 0 0 4px var(--railC);animation:rdqD 4.4s infinite}
.rd-quake q{position:absolute;left:46px;top:46px;width:40px;height:40px;border-radius:50%;border:2px solid ${MAG};opacity:0;animation:rdqR 4.4s infinite}
.rd-quake em{position:absolute;left:70px;top:49px;width:14px;height:11px;background:${MAG};clip-path:polygon(0 100%,32% 8%,50% 34%,68% 8%,100% 100%)}
@keyframes rdqP{0%,30%{background:var(--railC);opacity:.45}36%,94%{background:var(--acc);opacity:1}100%{background:var(--railC);opacity:.45}}
@keyframes rdqD{0%,34%,100%{box-shadow:inset 0 0 0 4px var(--railC)}38%,94%{box-shadow:inset 0 0 0 4px var(--acc),0 0 10px var(--accGlow)}}
@keyframes rdqR{0%,36%{opacity:0;transform:scale(.5)}40%{opacity:.8}58%,100%{opacity:0;transform:scale(1.7)}}
@keyframes rdqN{0%,38%{transform:none}42%{transform:translateX(-1.5px) rotate(-4deg)}46%{transform:translateX(1.5px) rotate(22deg)}54%{transform:rotate(84deg)}58%,92%{transform:rotate(90deg);opacity:1}97%{transform:rotate(90deg);opacity:0}100%{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.rd-quake *{animation:none!important}.rd-quake .p{background:var(--acc);opacity:1}.rd-quake .n{transform:rotate(90deg)}}`,
    // tanıtımda 1 sarsıntı durağı, sonra 2, hat finalinde 3
    amount: (n, intro, z, fin) => intro ? 1 : fin ? 3 : 2,
    // en son işaret (ord 28; ekspres duraktan sonra). Durak: çözümde uç (tek kollu), sıradan karo. Sarsılan karolar (S): ızgara komşularından
    // sıradan, simetrik olmayan karolar; durakların hiçbiri ve hiçbir durağın merkeze giden yolu S'de değildir. Sınama: çözümde bütün S karoları
    // boşaltılınca (maske 0) da her durak yanar → S hangi yönde olursa olsun durakların bağlantısı bozulmaz (lit bağlantısı kol eklemekle tekdüze artar).
    mark(C) {
      const { n, sol, cur, R, cols, rows } = C, o = C.out, ex = new Set(o.express?.st || []);
      const base = cfg => api.lit({ ...C, ...o, cur: cfg });
      const d0 = base(sol).d;
      const plain = i => C.free(i) && !C.keep[i] && C.cnt[i] < 0 && !C.rev[i] && !o.void?.[i] && !o.self?.[i] && !o.split?.[i];
      const cand = [];
      for (let i = 0; i < n; i++) if (plain(i) && popc(sol[i]) === 1 && !ex.has(i) && d0[i] >= 2) cand.push(i);
      for (let k = cand.length - 1; k > 0; k--) { const j = R() * (k + 1) | 0; [cand[k], cand[j]] = [cand[j], cand[k]]; }
      const st = [], nb = [], all = new Set();
      const holds = (qs, zero) => { const c = sol.slice(); for (const t of zero) c[t] = 0; const d = base(c).d; return qs.every(q => d[q] >= 0); };
      for (const q of cand) {
        if (st.length >= C.x.quake) break;
        if (all.has(q) || st.some(p => around(cols, rows, p).includes(q))) continue;   // durak sarsılmaz; iki durak yan yana gelmez
        const qs = [...st, q];
        const S = around(cols, rows, q).filter(t => plain(t) && C.per(sol[t]) > 1 && !qs.includes(t) && holds(qs, [...all, t]));
        if (S.length < 2 || !holds(qs, [...all, ...S])) continue;
        st.push(q); nb.push(S); S.forEach(t => all.add(t));
      }
      if (!st.length) return;
      // sarsılan karo çözümde başlamaz (par = yanlış karo sayısı her sırada yetişir); durak da çözümde ve yanık başlamaz
      for (const t of all) { if (cur[t] === sol[t]) cur[t] = rot(cur[t]); C.busy[t] = true; }
      for (const q of st) {
        C.busy[q] = true;
        if (cur[q] === sol[q]) cur[q] = rot(cur[q]);
        for (let k = 0; k < 3 && base(cur).d[q] >= 0; k++) { cur[q] = rot(cur[q]); if (cur[q] === sol[q]) cur[q] = rot(cur[q]); }
      }
      o.quake = { st, nb };
    },
    // dokunuştan önce: durakların yanma durumu (ipucu, geri al sonrası da doğru: G.L her zaman günceldir)
    block(G) { G.qkWas = G.quake.st.map(q => on(G.L, q)); return 0; },
    // dokunuştan sonra: yanmıyorken yanan her durak çevresini bir kez sarsar (zincir: sarsıntı başka durağı bağlarsa o da sarsar; durak başına dokunuşta en çok bir kez).
    // Kazanma, sarsıntıdan sonraki durumda denetlenir (çekirdek after kancalarından sonra G.L.solved'a bakar).
    after(G, i, now) {
      const { st, nb } = G.quake, was = G.qkWas; if (!was) return;
      const done = new Set(); let hit = false;
      for (let pass = 0; pass < st.length; pass++) {
        let any = false;
        st.forEach((q, j) => {
          if (done.has(j) || was[j] || !on(G.L, q)) return;
          done.add(j); any = true;
          for (const t of nb[j]) if (!G.fixed[t]) { G.cur[t] = rot(G.cur[t]); (G.qkT ||= new Map()).set(t, now + LAG); }
          (G.qkR ||= []).push({ q, t: now + LAG });
        });
        if (!any) break;
        hit = true; G.L = api.lit(G);
      }
      G.qkWas = null;
      if (!hit) return;
      api.tone(api.note(0) / 2, .22, .03, 'triangle', LAG / 1000); api.haptic('light');
      if (!api.save.qkTip) { api.save.qkTip = 1; api.persist(); api.toast(MSG.first); }
    },
    undo(G) { G.qkT?.clear(); G.qkR = []; },
    // sarsıntı animasyonu: karo eski yönünden yumuşakça 90° döner, başta hafif titrer (hareket azaltılmışsa titreme yok, kısa dönüş)
    xform(D) {
      const { G, X, s, now } = D, T = G.qkT; if (!T?.size) return false;
      const dur = calm.matches ? 200 : DUR;
      for (const [t, t0] of T) {
        const k = (now - t0) / dur; if (k >= 1) { T.delete(t); continue; }
        const e = k <= 0 ? 0 : api.ease(k);
        X[t][2] += -(1 - e) * Math.PI / 2;
        if (!calm.matches && k > 0 && k < .5) X[t][0] += s * .03 * Math.sin(k * Math.PI * 10) * (1 - 2 * k);
      }
      return true;
    },
    // durak işareti: sağ üstte küçük yanardağ (biçim: kraterli üçgen) + sarsılacak komşulara bakan kenarlarda iki kısa deprem yayı.
    // Yanmıyor: magma rengi · yanık: soluk (sarsıntı oldu). Sarsıntı anında durakta yayılan halka.
    over(D) {
      const { cx, s, X, G, pal, now, vis } = D, { st, nb } = G.quake, mag = pal.light ? MAG_L : MAG, cols = G.cols;
      let busy = false;
      cx.save(); cx.lineCap = 'round';
      for (const lit of [false, true]) {
        cx.beginPath();
        st.forEach((q, j) => {
          if (!vis(q) || on(G.L, q) !== lit) return;
          const [x, y, , sc] = X[q];
          for (const t of nb[j]) {
            if (G.fixed[t]) continue;
            const a = Math.atan2((t / cols | 0) - (q / cols | 0), t % cols - q % cols);
            for (const r of [.3, .39]) { const R = s * r * sc; cx.moveTo(x + Math.cos(a - .38) * R, y + Math.sin(a - .38) * R); cx.arc(x, y, R, a - .38, a + .38); }
          }
        });
        cx.lineWidth = Math.max(1.4, s * .035); cx.strokeStyle = lit ? D.rgba(pal.mut, .45) : D.rgba(mag, .85); cx.stroke();
      }
      // yanardağ rozeti (tek yol)
      cx.beginPath();
      for (const q of st) {
        if (!vis(q)) continue;
        const [x, y, , sc] = X[q], w = s * .3 * sc, h = s * .22 * sc, bx = x + s * .27 * sc, by = y - s * .27 * sc;
        cx.moveTo(bx - w / 2, by + h / 2); cx.lineTo(bx - w * .18, by - h / 2); cx.lineTo(bx, by - h * .14); cx.lineTo(bx + w * .18, by - h / 2); cx.lineTo(bx + w / 2, by + h / 2); cx.closePath();
      }
      cx.fillStyle = mag; cx.fill(); cx.lineWidth = Math.max(1.2, s * .025); cx.strokeStyle = pal.bg; cx.stroke();
      // sarsıntı halkası
      if (G.qkR?.length) {
        G.qkR = G.qkR.filter(r => now - r.t < 600);
        for (const r of G.qkR) {
          const k = (now - r.t) / 600; busy = true; if (k < 0 || !vis(r.q) || calm.matches) continue;
          const [x, y] = X[r.q];
          cx.beginPath(); cx.arc(x, y, s * (.3 + .55 * api.ease(k)), 0, 7); cx.lineWidth = Math.max(1.5, s * .04 * (1 - k)); cx.strokeStyle = D.rgba(mag, .55 * (1 - k)); cx.stroke();
        }
      }
      cx.restore();
      return busy;
    },
  };
});
