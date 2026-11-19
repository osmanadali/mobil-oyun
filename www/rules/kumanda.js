// M31 · Kumanda karosu (remote): 🎛 karoya dokununca kendisi dönmez; kollarla bağlı 2–4 ızgara komşusu birlikte 90° saat yönünde döner.
// Kumandanın rayı sabittir (çözüm yönünde durur). Bağlı komşular tek başına dönmez, yalnız kumandayla döner (yoksa kumanda anlamsızlaşır).
// Çok kumanda modeli: bir karo iki kumandaya bağlı olabilir (iki kumandanın basış toplamı kadar döner). Kolla birbirine değen kumandalar
// (en çok 2) bir öbektir; öbek tek birimdir (C.unit, K = 4^m; U.at dokunulan kumandanın basışı, U.need en az hamleli basışlar).
// Geri al, kayıt, ipucu, robot ve zorluk çözücüsü onu çekirdeğin birim yoluyla bilir.
// Ayrıntı ve çözülebilirlik kanıtı: docs/kurallar/kumanda.md
(window.RAY_RULES = window.RAY_RULES || []).push(api => {
  const { rot, DIRS } = api, calm = matchMedia('(prefers-reduced-motion: reduce)');
  const MSG = {
    tip: L('🎛 Kumanda · bağlı karoların hepsi birlikte 90° döndü', '🎛 Remote · all linked tiles turned 90° together'),
    told: L('🎛 Bu karo kumandaya bağlı · kumandaya dokun', '🎛 This tile is linked to a remote · tap the remote'),
  };
  // ızgara komşuları (tünel/sarmal geçidi sayılmaz: kol fiziksel komşuya uzanır)
  const around = (cols, rows, i) => { const x = i % cols, y = i / cols | 0, o = []; for (const [, dx, dy] of DIRS) { const a = x + dx, b = y + dy; if (a >= 0 && b >= 0 && a < cols && b < rows) o.push(b * cols + a); } return o; };
  // kart demosu: bağlı karo · kumanda · bağlı karo. Kumandaya her dokunuşta iki yan karo 90° döner, kumandanın rayı yerinde kalır
  const demo = '<div class="rd-remote" aria-hidden="true"><i class="a"><b></b><b class="y"></b></i><i class="k"><b></b><u></u></i><i class="c"><b></b></i>' +
    '<s class="l"></s><s class="r"></s><em></em></div>';
  return {
    key: 'remote', line: 30, ord: 30, boost: 22, scan: 96,
    // eşli karo: en yakın kural (birlikte dönen karolar), aynı tahtada iki ayrı "birlikte dönme" karışır · sarsıntı durağı: o da komşuları döndürür
    clash: ['pairs', 'quake'],
    card: { name: L('Kumanda karosu', 'Remote tile'), tag: L('Yeni: kumanda karosu', 'New: remote tile'), demo,
      text: L('🎛 <b>Kumanda</b> kendisi dönmez: dokununca kollarla bağlı <b>komşularının hepsi birlikte 90°</b> döner. Bağlı karolar <b>tek başına dönmez</b>; iki kumandaya bağlı karo <b>ikisiyle de</b> döner. Basışları say: birini düzeltirken ötekini bozma.',
        'A 🎛 <b>remote</b> never turns itself: tap it and <b>all its linked neighbors turn 90° together</b>. Linked tiles <b>don’t turn on their own</b>; a tile linked to two remotes turns <b>with both</b>. Count your presses: don’t break one while fixing another.') },
    css: `.rd-remote,.rd-remote *{box-sizing:border-box}.rd-remote{position:relative;align-self:center;display:flex;gap:10px;margin:8px 0 2px}
.rd-remote i{position:relative;width:56px;height:56px;border-radius:16px;background:var(--tile);box-shadow:inset 0 0 0 1px var(--stroke)}
.rd-remote b{position:absolute;border-radius:6px;background:var(--rail)}
.rd-remote .a,.rd-remote .c{animation:rdrT 4s -.45s steps(1) infinite}
.rd-remote .a b{left:22px;top:-2px;width:12px;height:36px}.rd-remote .a b.y{left:22px;top:22px;width:36px;height:12px}
.rd-remote .c b{left:22px;top:22px;width:36px;height:12px;border-radius:6px 0 0 6px}
.rd-remote .k b{left:22px;top:-2px;width:12px;height:60px}
.rd-remote .k u{position:absolute;left:16px;top:16px;width:24px;height:24px;border-radius:7px;background:var(--tile);box-shadow:inset 0 0 0 2.5px var(--mut)}
.rd-remote .k u::after{content:'';position:absolute;left:8px;top:8px;width:8px;height:8px;border-radius:50%;background:var(--mut)}
.rd-remote s{position:absolute;top:15px;height:4px;width:42px;border-radius:2px;background:var(--mut)}.rd-remote .l{left:40px}.rd-remote .r{left:106px}
.rd-remote s::before{content:'';position:absolute;top:-4px;width:12px;height:12px;border-radius:50%;background:var(--mut);box-shadow:0 0 0 2px var(--bg0)}
.rd-remote .l::before{left:-6px}.rd-remote .r::before{right:-6px}
.rd-remote em{position:absolute;left:79px;top:13px;width:30px;height:30px;border-radius:50%;border:2.5px solid var(--fg);opacity:0;animation:tap2 1s ease-out infinite}
@keyframes rdrT{0%{transform:none}25%{transform:rotate(90deg)}50%{transform:rotate(180deg)}75%{transform:rotate(270deg)}}
@media (prefers-reduced-motion:reduce){.rd-remote *{animation:none!important}}`,
    // tanıtımda 1 kumanda, sonra 6×8 → 2, 7×9 → 3; hat finalinde +1
    amount: (n, intro, z, fin) => intro ? 1 : fin ? 3 : 2,
    // shape (ord 30, şekil aşamalarının en sonu): eşliden sonra, ters/sayaçlıdan önce. R() yalnız kumandalı bölümde tüketilir → eski bölümler aynı.
    // Çok kumanda modeli: iki kumanda (aralarında 2 kare: düz ya da çapraz) ortak kola sahip olabilir; ortak kol iki kumandanın basış TOPLAMI kadar döner.
    // Bir karo en çok iki kumandaya bağlıdır; birbirine kolla değen kumandalar bir öbektir (en çok 2 kumanda), öbek tek birimdir (K = 4^m).
    shape(C) {
      if (C.x.quake) return;   // clash: oyunda birlikte gelmez; doğrudan üretim denemelerinde de (sarsıntı benzetimi öbek sayacını bilmez) kumanda kurulmaz
      const { n, cols, rows, sol, cur, R, hub, hub2 } = C, o = C.out, amt = C.x.remote;
      const md = (a, b) => b < 0 ? 99 : Math.abs(a % cols - b % cols) + Math.abs((a / cols | 0) - (b / cols | 0));
      // sıradan karo: serbest (merkez, eşli, başka birim/işaret değil), köprü/ağız/kapalı/silik değil, merkeze bitişik değil (karanlığın merkez adımı birimi çeviremez)
      const plain = i => C.free(i) && !C.keep[i] && !o.void?.[i] && !o.self?.[i] && !o.split?.[i] && md(i, hub) >= 2 && md(i, hub2) >= 2;
      const cand = []; for (let i = 0; i < n; i++) if (plain(i)) cand.push(i);
      for (let k = cand.length - 1; k > 0; k--) { const j = R() * (k + 1) | 0; [cand[k], cand[j]] = [cand[j], cand[k]]; }
      const st = [], arm = [], comp = [], taken = new Set(), nbs = i => around(cols, rows, i);
      const per4 = t => C.per(sol[t]) === 4, fresh = t => !taken.has(t) && plain(t) && C.per(sol[t]) > 1;
      const okR = r => !taken.has(r) && plain(r) && st.every(q => md(q, r) >= 2);
      const add = (r, A) => { st.push(r); arm.push(A); taken.add(r); A.forEach(t => taken.add(t)); return st.length - 1; };
      // her kumandanın kendine ait (ortak olmayan), 4 yönü ayrı en az bir kolu olur: öbeğin durumu kollardan okunur, başlangıç çözülmüş gelmez
      for (const r of cand) {
        if (st.length >= amt) break;
        if (!okR(r)) continue;
        const A = nbs(r).filter(fresh);
        if (A.length < 2 || !A.some(per4)) continue;
        const g = [add(r, A)];
        if (st.length < amt) for (const b of cand) {   // eş kumanda: 2 kare ötede, ortak kol(lar)
          if (md(b, r) !== 2 || !okR(b)) continue;
          const sh = nbs(b).filter(t => A.includes(t)), pr = nbs(b).filter(fresh);
          if (!sh.length || !pr.some(per4) || !A.some(t => per4(t) && !sh.includes(t))) continue;
          g.push(add(b, [...sh, ...pr])); break;
        }
        comp.push(g);
      }
      if (!st.length) return;
      // karıştırma: her kumanda 1–3 basış geride; kol, bağlı olduğu kumandaların toplamı kadar geride (çözüm her zaman ulaşılabilir)
      const t = st.map(() => 1 + (R() * 3 | 0)), back = new Map();
      st.forEach((r, j) => { cur[r] = sol[r]; arm[j].forEach(a => back.set(a, (back.get(a) || 0) + t[j])); });
      for (const [a, k] of back) { let v = sol[a]; for (let q = 0; q < (16 - k) % 4; q++) v = rot(v); cur[a] = v; }
      const of = new Array(n).fill(0); for (const a of back.keys()) of[a] = arm.reduce((c, A) => c + A.includes(a), 0);
      const press = (c, j) => { for (const a of arm[j]) c[a] = rot(c[a]); };
      const off = (m, b) => { let k = 0; while (b !== m && k < 4) { b = rot(b); k++; } return k; };
      for (const g of comp) {
        const rs = g.map(j => st[j]), cells = [...rs, ...new Set(g.flatMap(j => arm[j]))], K = 4 ** g.length;
        const pa = g.map(j => arm[j].find(a => per4(a) && of[a] === 1)), base = pa.map(a => cur[a]);
        // tap: öbeğin bütün durumlarını sırayla gezen sayaç (zorluk çözücüsü K durumu dener): 1. kumanda bir basış; başa döndüyse 2. kumanda da
        const tap = c => { for (let k = 0; k < g.length; k++) { press(c, g[k]); if (off(c[pa[k]], base[k])) break; } };
        const u = C.unit(cells, K, tap, 'remote'), U = C.units[u];
        // oyunda dokunulan kumandanın kendi basışı (çekirdek: U.at)
        U.at = (c, i) => { const k = rs.indexOf(i); if (k >= 0) press(c, g[k]); };
        // çözüme en az hamle (basılan kumanda sayısı), eşitse en az dokunuş: [dokunuş, hamle, kumanda başına basış] (çekirdek par ve robot)
        U.need = (c0, s) => {
          let best = null;
          for (let code = 0; code < K; code++) {
            const c = c0.slice(), ps = []; let q = code, nz = 0, sum = 0;
            for (const j of g) { const p = q & 3; q >>= 2; ps.push(p); nz += !!p; sum += p; for (let k = 0; k < p; k++) press(c, j); }
            if (cells.every(i => c[i] === s[i]) && (!best || nz < best[1] || (nz === best[1] && sum < best[0]))) best = [sum, nz, ps];
          }
          return best || [0, 0, g.map(() => 0)];
        };
      }
      o.remote = { st, arm, of, comp };
    },
    // bağlı karo kendi başına dönmez (kumandaya dokunuşu çekirdek U.at ile uygular)
    block(G, i) { return G.remote.of[i] ? MSG.told : 0; },
    // karanlık tünel: öbeğin bir karosu görününce bütün öbek görünür (robot ve oyuncu kumandaya erişebilsin)
    reveal(G, on) {
      const { st, arm, comp } = G.remote;
      for (const g of comp) { const cs = g.flatMap(j => [st[j], ...arm[j]]); if (cs.some(i => G.seen[i])) cs.forEach(on); }
    },
    // robot: her öbek için en az hamleli basış dizisi (kumanda başına art arda)
    plan(G) {
      const out = [];
      for (const U of G.units) {
        if (U.kind !== 'remote' || U.cells.some(c => G.fixed[c])) continue;
        const [, , ps] = U.need(G.cur, G.sol);
        U.cells.slice(0, ps.length).forEach((r, k) => { if (G.seen[r]) for (let q = 0; q < ps[k]; q++) out.push(r); });
      }
      return out;
    },
    // çekirdek basışı, hamleyi, dalgayı yaptı: bu kumandanın kolları dönerek gelir, yumuşak ses, ilk dokunuşta bir kez bildirim
    onTap(G, U, i, now) {
      const j = G.remote.st.indexOf(i);
      if (!calm.matches && j >= 0) for (const a of G.remote.arm[j]) api.anim.set(a, now);
      api.tone(api.note(0), .08, .02, 'triangle');
      const sv = api.save; if (!sv.remoteTold) { sv.remoteTold = 1; api.persist(); api.toast(MSG.tip); }
    },
    // işaret: kumandanın ortasında yuvarlatılmış kare düğme (çerçeve + nokta; durak halkasından biçimle ayrı) · düğmenin köşesinden her bağlı karoya
    // kenarı aşan kısa kol, bağlı karoda yuvarlak uç. Kol rayın üstüne binmesin diye merkez çizgisinden yana kaydırılır. Biçim taşır, renge dayanmaz; dört yol.
    over(D) {
      const { cx, s, X, G, pal } = D, { st, arm } = G.remote, ls = [];
      st.forEach((r, k) => { if (!G.fixed[r] && D.vis(r)) ls.push(k); });
      if (!ls.length) return;
      const col = D.rgba(pal.mut, .9);
      cx.save(); cx.lineCap = 'round';
      // kollar
      const ends = [];
      cx.beginPath();
      for (const k of ls) {
        const r = st[k], [x, y, , sc] = X[r];
        for (const a of arm[k]) {
          if (!D.vis(a)) continue;
          const [ax, ay] = X[a], dx = Math.sign(Math.round(ax - x)), dy = Math.sign(Math.round(ay - y)), px = -dy * s * .2 * sc, py = dx * s * .2 * sc;
          const x0 = x + dx * s * .2 * sc + px, y0 = y + dy * s * .2 * sc + py, x1 = x + dx * s * .74 * sc + px, y1 = y + dy * s * .74 * sc + py;
          cx.moveTo(x0, y0); cx.lineTo(x1, y1); ends.push([x1, y1, sc]);
        }
      }
      cx.lineWidth = Math.max(1.5, s * .05); cx.strokeStyle = col; cx.stroke();
      cx.beginPath(); for (const [ex, ey, sc] of ends) { const rr = s * .085 * sc; cx.moveTo(ex + rr, ey); cx.arc(ex, ey, rr, 0, 7); }
      cx.fillStyle = col; cx.fill(); cx.lineWidth = Math.max(1, s * .025); cx.strokeStyle = pal.bg; cx.stroke();
      // düğme: karo renginde yuvarlatılmış kare + çerçeve, ortada nokta
      cx.beginPath(); for (const k of ls) { const [x, y, , sc] = X[st[k]], h = s * .2 * sc; D.rrp(x - h, y - h, 2 * h, 2 * h, h * .45); }
      cx.fillStyle = pal.tile || pal.bg; cx.fill(); cx.lineWidth = Math.max(1.6, s * .055); cx.strokeStyle = col; cx.stroke();
      cx.beginPath(); for (const k of ls) { const [x, y, , sc] = X[st[k]], rr = s * .065 * sc; cx.moveTo(x + rr, y); cx.arc(x, y, rr, 0, 7); }
      cx.fillStyle = col; cx.fill();
      cx.restore();
    },
  };
});
