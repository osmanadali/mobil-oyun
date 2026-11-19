// M28 · Ekspres durak (express): 🚄 durağın üstündeki sayı, merkezden o durağa giden yolun en çok kaç karo olabileceğidir.
// Sayı çözümdeki uzaklığın kendisidir (her zaman geçerli). Sayılar seçilirken çözücü ikinci çözümleri arar: sayılar onları eler;
// sayılarla birlikte tek çözüme inmeyen aday reddedilir. Ayrıntı ve kanıt: docs/kurallar/ekspres-durak.md
(window.RAY_RULES = window.RAY_RULES || []).push(api => {
  const MSG = {
    long: n => L(`🚄 Ekspres durağa yol uzun · en çok ${n} karo`, `🚄 Too long a route to the express station · ${n} tiles at most`),
    tip: L('🚄 Ekspres durak · sayı, merkeze en çok kaç karo olduğunu söyler', '🚄 Express station · the number is the most tiles to the hub'),
  };
  const { popc } = api, EXP = '#5ad1ff', EXP_L = '#0a7fb0', CAP = 360, ALT = 24;
  return {
    key: 'express', line: 27, ord: 27, boost: 9,
    clash: ['last'],   // son sefer: iki ayrı sayılı durak rozeti aynı tahtada karışır
    card: { name: L('Ekspres durak', 'Express station'), tag: L('Yeni: ekspres durak', 'New: express station'),
      demo: '<div class="rd-express" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><s class="l"></s><s class="l"></s><s class="l"></s><s class="q"></s><b></b><u></u><em>2</em></div>',
      text: L('🚄 Ekspres durağa merkezden giden yol <b>en çok üstündeki sayı kadar karo</b> olabilir. Uzun yoldan bağlanırsa bölüm bitmez: <b>kısa yolu bul</b>.',
        'The route from the hub to an 🚄 express station may be <b>at most as many tiles as its number</b>. A longer route won’t finish the level: <b>find the short way</b>.') },
    // demo: 3×2 tahta; önce uzun yol (4 karo) yanar, rozet kırmızı; sonra kısa yol (2 karo) yanar, rozet hat renginde
    css: `.rd-express,.rd-express *{box-sizing:border-box}.rd-express{position:relative;align-self:center;width:132px;height:86px;margin:10px 0 2px}
.rd-express i{position:absolute;width:40px;height:40px;border-radius:12px;background:var(--tile);box-shadow:inset 0 0 0 1px var(--stroke)}
.rd-express i:nth-of-type(2){left:46px}.rd-express i:nth-of-type(3){left:92px}.rd-express i:nth-of-type(n+4){top:46px}.rd-express i:nth-of-type(5){left:46px}.rd-express i:nth-of-type(6){left:92px}
.rd-express s{position:absolute;border-radius:5px;background:var(--railC)}
.rd-express .l{left:15px;top:15px;width:10px;height:56px;animation:rdeL 4s infinite}.rd-express .l+.l{width:102px;height:10px}.rd-express .l+.l+.l{left:107px;width:10px;height:56px}
.rd-express .q{left:15px;top:61px;width:102px;height:10px;animation:rdeS 4s infinite}
.rd-express b{position:absolute;left:9px;top:55px;width:22px;height:22px;border-radius:7px;background:var(--acc);box-shadow:0 0 10px var(--accGlow)}
.rd-express u{position:absolute;left:103px;top:57px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:inset 0 0 0 4px var(--acc)}
.rd-express em{position:absolute;left:112px;top:36px;min-width:24px;height:20px;padding:0 5px;border-radius:7px;background:var(--warn);color:#fff;font:800 14px/20px Outfit,system-ui,sans-serif;text-align:center;font-style:normal;animation:rdeB 4s infinite}
@keyframes rdeL{0%,44%{background:var(--acc);opacity:1}50%,94%{background:var(--railC);opacity:.35}100%{background:var(--acc);opacity:1}}
@keyframes rdeS{0%,44%{opacity:.25}50%,94%{background:var(--acc);opacity:1}100%{opacity:.25}}
@keyframes rdeB{0%,44%{background:var(--warn);color:#fff}50%,94%{background:${EXP};color:#16182a}100%{background:var(--warn);color:#fff}}
@media (prefers-reduced-motion:reduce){.rd-express s,.rd-express em{animation:none}.rd-express .l{opacity:.35}.rd-express .q{background:var(--acc)}.rd-express em{background:${EXP};color:#16182a}}`,
    // tanıtımda 2 ekspres durak, sonra 3, hat finalinde 4
    amount: (n, intro, z, fin) => intro ? 2 : fin ? 4 : 3,
    // en son işaret (ord 27; kapak, silik kol, kapalı durak, mühürlü karodan sonra): çözücünün gördüğü bilgiyle seçilir.
    // 1) çözümdeki uzaklık d (lit: tünel, sarmal, köprü, iki merkez dahil) · 2) çözücü en çok ALT çözüm toplar (sayısız)
    // 3) ikinci çözümü eleyen (bağlayıcı) duraklar önce · 4) sayılarla birlikte ikinci çözüm kalıyorsa aday reddedilir (pick başkasını seçer)
    mark(C) {
      const { n, sol, R } = C, o = C.out, P = { ...C, ...o, cur: C.cur.slice() }, d = api.lit({ ...P, cur: sol }).d, norm = m => m.map((v, i) => o.void?.[i] ? 0 : v).join(), key = norm(sol);   // kapalı durak: lit onu yok sayar
      const cand = [];
      for (let i = 0; i < n; i++) if (!C.isHub(i) && popc(sol[i]) === 1 && !C.busy[i] && !C.keep[i] && C.link[i] < 0 && C.cnt[i] < 0 && !o.void?.[i] && !o.self?.[i] && !o.split?.[i] && d[i] >= 3) cand.push(i);
      if (!cand.length) return;
      const alts = [];
      api.difficulty(P, cfg => { if (norm(cfg) !== key) { const L2 = api.lit({ ...P, cur: cfg }); if (L2.solved) alts.push(L2.d); } return alts.length >= ALT; }, CAP);
      const cut = i => alts.filter(a => a[i] < 0 || a[i] > d[i]).length;
      // karıştır (R), sonra bağlayıcılar önce, uzun yollar önce
      for (let k = cand.length - 1; k > 0; k--) { const j = R() * (k + 1) | 0; [cand[k], cand[j]] = [cand[j], cand[k]]; }
      const sc = new Map(cand.map(i => [i, cut(i)]));
      cand.sort((a, b) => (sc.get(b) > 0) - (sc.get(a) > 0) || d[b] - d[a]);
      const st = [];
      // açgözlü: her adımda kalan ikinci çözümlerden en çoğunu eleyen durak; hiçbiri elemiyorsa sıradaki
      let left = alts.slice();
      while (st.length < C.x.express && cand.length) {
        let bi = 0, bv = -1;
        cand.forEach((i, k) => { const v = left.filter(a => a[i] < 0 || a[i] > d[i]).length; if (v > bv) { bv = v; bi = k; } });
        const i = cand.splice(bi, 1)[0]; st.push(i); left = left.filter(a => !(a[i] < 0 || a[i] > d[i]));
      }
      st.sort((a, b) => a - b);
      o.express = { st, B: st.map(i => d[i]) };
      if (left.length) o.reject = true;   // sayılarla da tek çözüme inmedi
    },
    // her ekspres durak bağlı ve uzaklığı ≤ sayı
    check(P, L) {
      const { st, B } = P.express, bad = [];
      st.forEach((s, j) => { if (!(L.d[s] >= 0 && L.d[s] <= B[j])) bad.push(s); });
      L.exBad = bad; L.exBase = L.solved;
      return bad.length;
    },
    after(G, i, now) {
      const L = G.L, bad = L.exBad || [], { st, B } = G.express;
      if (L.exBase && bad.length) {
        for (const k of bad) api.press.set(k, now);
        if (G.exTold) return;
        G.exTold = 1; api.tone(330, .12, .02, 'sine', .1); api.toast(MSG.long(B[st.indexOf(bad[0])]));
      } else if (st.includes(i) && !api.save.exTip) { api.save.exTip = 1; api.persist(); api.toast(MSG.tip); }
    },
    // rozet: durağın sağ üstünde yuvarlak köşeli plaka (yuvarlak eş/sayaç rozetlerinden biçimle ayrı) + iki hız çizgisi.
    // Yanan ve yolu yeterince kısa: hat renginde · yanan ama uzun: uyarı rengi ve nabız · yanmıyor: açık mavi
    over(D) {
      const { cx, s, X, G, pal, now, vis, on, own, OC } = D, { st, B } = G.express, L = G.L, ex = pal.light ? EXP_L : EXP;
      let busy = false;
      cx.save(); cx.textAlign = 'center'; cx.textBaseline = 'middle';
      st.forEach((q, j) => {
        if (!vis(q)) return;
        const [x, y, , sc] = X[q], lit = on(q), long = lit && L.d[q] > B[j], pulse = long ? .5 + .5 * Math.sin(now / 170) : 0; if (long) busy = true;
        const w = s * .4 * sc, h = s * .27 * sc, bx = x + s * .25 * sc, by = y - s * .29 * sc;
        cx.fillStyle = long ? G.warn : lit ? OC[own(q)] || D.col : ex;
        cx.beginPath(); D.rrp(bx - w / 2, by - h / 2, w, h, h * .32); cx.fill();
        cx.lineWidth = Math.max(1.5, s * .03 * (1 + pulse)); cx.strokeStyle = pal.bg; cx.stroke();
        // hız çizgileri: plakanın solunda iki kısa yatay çizgi
        cx.beginPath(); for (const k of [-.18, .18]) { cx.moveTo(bx - w / 2 - s * .03 * sc, by + h * k); cx.lineTo(bx - w / 2 - s * .11 * sc, by + h * k); }
        cx.lineWidth = Math.max(1.2, s * .03); cx.strokeStyle = long ? G.warn : ex; cx.stroke();
        cx.font = `800 ${Math.round(s * .22 * sc)}px Outfit, system-ui`; cx.fillStyle = long || lit ? '#fff' : '#16182a';
        cx.fillText(B[j], bx, by + 1);
      });
      cx.restore();
      return busy;
    },
  };
});
