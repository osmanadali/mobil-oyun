// Yön tabelası (RL.sign hattı) — robot testleri (hakem.cjs K bölümü çağırır). Sözleşme: docs/kurallar/README.md · tasarım: docs/kurallar/tabela.md
module.exports = async T => {
  const { browser, URL, open, check, solve, shot, tapTile, waitModal, modalOpen, starsUpTo, RL, AT, seenTo } = T;
  const S = RL.sign, A = AT('sign'), seen = seenTo(S);
  const errs = [];

  // ---------- a) üretim: 600 bölüm × kural karışımları ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 1 } });
    const g = await page.evaluate(() => {
      const R = window.__ray, M = R.MODS.find(m => m.key === 'sign'), K = { 1: 0, 2: 1, 4: 2, 8: 3 };
      const popc = m => (m & 1) + (m >> 1 & 1) + (m >> 2 & 1) + (m >> 3 & 1), rot = R.rot;
      const o = { gens: 0, signs: 0, few: 0, bad: 0, pre: 0, place: 0, parent: 0, flips: 0, flipBad: 0, two: 0, twoBad: 0, ownBad: 0, allowBad: 0, t: 0, c: 0 };
      const mixes = [{}, { rev: 4 }, { cnt: 4 }, { two: true }, { fog: true }, { rev: 4, cnt: 4, two: true, fog: true }];
      for (const [c, r] of [[6, 8], [7, 9]]) for (let s = 1; s <= 300; s++) {
        const mx = mixes[s % mixes.length], all = s % 6 === 5;
        const P = R.generate(c, r, s * 7919 + 29, all ? 5 : 0, all ? 2 : 0, { ...mx, sign: c === 6 ? 2 : 3 });
        const I = P.sign.map((b, i) => b ? i : -1).filter(i => i >= 0), Tr = R.tree(P), S = { ...P, cur: P.sol }, L = R.lit(S);
        o.gens++; o.signs += I.length; if (I.length < 2) o.few++;
        if (!L.solved) o.bad++;
        if (R.lit(P).solved) o.pre++;
        for (const i of I) {
          const b = P.sign[i], p = popc(P.sol[i]), j = R.nb(P, i, K[b]);
          // çıplak karo, köşe ya da T (düz değil), merkezden ≥ 2 adım, okun kenarında kol var
          if (P.pinned[i] || P.link[i] >= 0 || P.rev[i] || P.cnt[i] >= 0 || i === P.hub || i === P.hub2 || p < 2 || p > 3 || rot(rot(P.sol[i])) === P.sol[i] || Tr.dep[i] < 2 || !(P.sol[i] & b) || P.unitOf?.[i] >= 0) o.place++;
          p === 3 ? o.t++ : o.c++;
          // ok ağaçtaki ebeveyne bakar (iki merkezde: kendi merkezinin ağacı)
          if (Tr.pa[i] !== j || Tr.ow[j] !== Tr.ow[i] || L.d[j] !== L.d[i] - 1 || L.own[j] !== L.own[i]) o.parent++;
          if (P.hub2 >= 0) { o.two++; if (L.own[i] !== Tr.ow[i] || L.own[j] !== L.own[i]) o.twoBad++; }
          // okun yönü değişince çözüm reddedilir (çocuğa giden kol ya da kolsuz kenar)
          for (const nb of [1, 2, 4, 8]) if (nb !== b) { const sg = P.sign.slice(); sg[i] = nb; o.flips++; if (R.lit({ ...S, sign: sg }).solved) o.flipBad++; }
          // komşu öbür merkezin hattına aitse reddedilir (aynı merkez şartı)
          if (P.hub2 >= 0) { const L2 = { ...L, own: L.own.slice() }; L2.own[j] = 3 - L.own[i]; if (!M.check(S, L2)) o.ownBad++; }
          // zorluk süzgeci: çözüm durumu elenmez, okun kenarında kolu olmayan durum elenir
          let m = P.sol[i]; for (let r = 0; r < 4; r++, m = rot(m)) if (M.allow(P, i, m) !== !!(m & b)) o.allowBad++;
        }
      }
      // tabela çakışan kural: halka ile birlikte gelmez
      o.clash = M.clash?.includes('ring');
      return o;
    });
    check('sign.solvable', 'Tabela: 600 üretimde (6×8, 7×9; ters, sayaçlı, iki merkez, karanlık, sabit, eşli karışımları) çözüm kabul, başlangıç çözülü değil, her bölümde ≥ 2 tabela, tabela yalnız çıplak köşe/T karoda',
      g.bad === 0 && g.pre === 0 && g.few === 0 && g.place === 0 && g.signs >= 1300, JSON.stringify({ gens: g.gens, signs: g.signs, köşe: g.c, T: g.t, bad: g.bad, pre: g.pre, few: g.few, place: g.place }));
    check('sign.flip', 'Tabela: ok ağaçtaki ebeveyne bakar; okun yönü değişince çözüm reddedilir; zorluk süzgeci kolu olmayan durumu eler',
      g.parent === 0 && g.flipBad === 0 && g.flips === g.signs * 3 && g.allowBad === 0, JSON.stringify({ parent: g.parent, flips: g.flips, flipBad: g.flipBad, allowBad: g.allowBad }));
    check('sign.two', 'Tabela + iki merkez: ok kendi merkezinin hattına bakar; komşu öbür hatta ise reddedilir; halka ile çakışır',
      g.two > 100 && g.twoBad === 0 && g.ownBad === 0 && g.clash, JSON.stringify({ two: g.two, twoBad: g.twoBad, ownBad: g.ownBad, clash: g.clash }));
    // zorluk merdiveni (iki önceki hat → tabela hattı → sonraki hat) ve üretim süresi
    const lad = await page.evaluate(([S, A]) => {
      const R = window.__ray, avg = c => { const a = R.lineStart(c), z = R.lineStart(c + 1) - 1; let d = 0; for (let l = a; l <= z; l++) d += R.puzzleFor(l).diff; return Math.round(d / (z - a + 1) * 100) / 100; };
      const t0 = performance.now(); for (let l = A; l <= A + 9; l++) R.puzzleFor(l); const ms = Math.round((performance.now() - t0) / 10);
      const sz = [A - 1, A, A + 2, A + 3].map(l => R.sizeFor(l).join('x')).join(' ');
      const rules = [A, A + 1, A + 2].map(l => R.puzzleFor(l).rules.join('+')).join(' ');
      return { m11: avg(S - 2), m12: avg(S - 1), m13: avg(S), m14: avg(S + 1), ms, sz, rules };
    }, [S, A]);
    check('sign.ladder', `Tabela: M${S + 1} ortalama zorluğu önceki hattan (M${S}) yüksek, sonraki hattan (M${S + 2}) düşük; ${A}–${A + 2} 6×8 yalın tabela; puzzleFor(${A}–${A + 9}) < 60 ms`,
      lad.m13 > lad.m12 && lad.m14 > lad.m13 && lad.ms < 60 && lad.sz === '7x9 6x8 6x8 7x9' && lad.rules === 'sign sign sign', JSON.stringify(lad), 'medium');
    errs.push(...errors);
    await ctx.close();
  }

  // ---------- b) eski bölümler bit bit aynı: tabela hattından öncesi ve Günün Hattı, tabela eklentisi varken ve yokken ----------
  {
    const run = async block => {
      const ctx = await browser.newContext({ serviceWorkers: 'block' });
      if (block) await ctx.route('**/rules/tabela.js', r => r.fulfill({ contentType: 'text/javascript', body: '' }));
      const page = await ctx.newPage(); await page.goto(URL); await page.waitForTimeout(200);
      const r = await page.evaluate(A => {
        const R = window.__ray, H = [], h = P => JSON.stringify([P.cols, P.rows, P.sol, P.cur, P.pinned, P.link, P.rev, P.cnt, P.hub, P.hub2, P.par, P.taps, P.diff, P.rules, 'sign' in P]);
        for (let l = 1; l < A; l++) H.push(h(R.puzzleFor(l)));
        const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        for (let k = 0; k < 14; k++) H.push(h(R.dailyFor(ymd(new Date(2026, 9, 1 + k * 9)))));
        return { H, sign: R.MODS.some(m => m.key === 'sign') };
      }, A);
      await ctx.close(); return r;
    };
    const a = await run(false), b = await run(true), diff = a.H.map((x, i) => x === b.H[i] ? 0 : i + 1).filter(Boolean);
    check('sign.identical', `Tabela eklentisi 1–${A - 1}. bölümleri ve Günün Hattını değiştirmiyor (eklentili/eklentisiz bit bit aynı)`, a.sign && !b.sign && a.H.length === A - 1 + 14 && !diff.length, `${a.H.length} bulmaca · ${diff.length} fark${diff.length ? ' · ' + diff.slice(0, 8).join(',') : ''}`);
  }

  // ---------- c) tabela hattının ilk bölümü: kural kartı, dokunuş, solve() ile kazanma ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: A - 1, level: A, stars: starsUpTo(A), seen, remindAsked: true } });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    const card = await page.evaluate(() => ({ open: document.getElementById('modal').classList.contains('open'), h: document.querySelector('.sheet h2')?.textContent, demo: !!document.querySelector('.sheet .rd-sign .rd-sign-a'), badge: document.querySelector('.sheet .badge')?.textContent }));
    await page.waitForTimeout(1500); await shot(page, 'sign-card');   // ok dolu evre (%50–90)
    await page.waitForTimeout(1600); await shot(page, 'sign-card-2');  // ok boş evre
    if (card.open) await page.click('#mGo'); await page.waitForTimeout(400);
    const g0 = await page.evaluate(() => { const G = window.__ray.G, I = G.sign.map((b, i) => b ? i : -1).filter(i => i >= 0); return { size: G.cols + 'x' + G.rows, I, sign: I.map(i => G.sign[i]), cur: I.map(i => G.cur[i]), seen: JSON.parse(localStorage.getItem('ray')).seen?.[window.__ray.RULE_LINE.sign] }; });
    await shot(page, 'sign-start');
    await page.emulateMedia({ colorScheme: 'light' }); await page.waitForTimeout(250); await shot(page, 'sign-start-light'); await page.emulateMedia({ colorScheme: 'dark' }); await page.waitForTimeout(150);
    const i0 = g0.I[0];
    await tapTile(page, i0); await page.waitForTimeout(300);
    const g1 = await page.evaluate(i => { const G = window.__ray.G; return { cur: G.cur[i], sign: G.sign[i], toast: document.getElementById('toast').textContent }; }, i0);
    const rotd = (((g0.cur[0] << 1) | (g0.cur[0] >> 3)) & 15);
    await solve(page, 8); const won = await waitModal(page);
    const g2 = await page.evaluate(() => { const G = window.__ray.G; return { won: G.won, bad: G.L.signBad.length, solved: G.L.solved }; });
    check('sign.card', `M${S + 1} bölüm ${A}: "Yön tabelası" kural kartı (canlı demo), 6×8, ≥ 2 tabela; dokununca karo döner, ok yerinde kalır; solve() ile bölüm biter`,
      card.open && /Yön tabelası/.test(card.h || '') && card.demo && g0.seen === 1 && g0.size === '6x8' && g0.I.length >= 2 && g1.cur === rotd && g1.sign === g0.sign[0] && won && g2.won && !g2.bad,
      JSON.stringify({ ...card, size: g0.size, signs: g0.I.length, tap: [g0.cur[0], g1.cur, g1.sign === g0.sign[0]], toast: g1.toast, won, ...g2 }));
    errs.push(...errors);
    await ctx.close();
  }

  // ---------- d) hepsi bağlı ama tabela yanlış: bitmez, bildirim + nabız; sağlanmış ok dolu çizilir ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: A, level: A + 1, stars: starsUpTo(A + 1), seen: { ...seen, [S]: 1 }, remindAsked: true, signTip: 1 } });
    await page.click('#bPlay'); await page.waitForTimeout(600);
    // durak karosu k: çözüm dışında 2 dokunuş uzak (tabelaların yolunu kesmez), geri kalan her şey çözümde
    const k = await page.evaluate(() => {
      const { G, rot } = window.__ray, popc = m => (m & 1) + (m >> 1 & 1) + (m >> 2 & 1) + (m >> 3 & 1);
      const near = new Set(); G.sign.forEach((b, i) => { if (b) [i, i - 1, i + 1, i - G.cols, i + G.cols].forEach(j => near.add(j)); });
      const k = G.cur.findIndex((v, i) => popc(G.sol[i]) === 1 && i !== G.hub && !G.pinned[i] && G.link[i] < 0 && !G.rev[i] && G.cnt[i] < 0 && !near.has(i));
      G.sol.forEach((m, i) => { G.cur[i] = m; }); G.cur[k] = rot(rot(G.sol[k]));
      return k;
    });
    await tapTile(page, k); await page.waitForTimeout(450);   // k hâlâ yanlış → tabelalar yanar, dolu
    const ok = await page.evaluate(() => { const G = window.__ray.G; return { bad: G.L.signBad.length, lit: G.sign.every((b, i) => !b || G.L.d[i] >= 0), solved: G.L.solved }; });
    await shot(page, 'sign-ok');
    await page.emulateMedia({ colorScheme: 'light' }); await page.waitForTimeout(250); await shot(page, 'sign-ok-light'); await page.emulateMedia({ colorScheme: 'dark' }); await page.waitForTimeout(150);
    // bir tabelanın okunu çocuğa giden kola çevir → her şey bağlı ama bölüm bitmez
    const w = await page.evaluate(() => { const G = window.__ray.G, i = G.sign.findIndex(Boolean), b = G.sign[i], alt = [1, 2, 4, 8].find(x => x !== b && (G.sol[i] & x)); G.sign[i] = alt; return { i, b, alt }; });
    await tapTile(page, k); await page.waitForTimeout(120);
    const bad = await page.evaluate(i => { const G = window.__ray.G; return { base: G.L.signBase, solved: G.L.solved, bad: G.L.signBad, won: G.won, toast: document.getElementById('toast').textContent, press: true }; }, w.i);
    const mOpen = await modalOpen(page);
    await page.waitForTimeout(400); await shot(page, 'sign-bad');
    // ok geri → aynı durum kazanır (k'yı tam tur çevir)
    await page.evaluate(w => { window.__ray.G.sign[w.i] = w.b; }, w);
    for (let q = 0; q < 4; q++) { await tapTile(page, k); await page.waitForTimeout(60); }
    const won = await waitModal(page);
    check('sign.wrong', 'Tabela: sağlanmış ok dolu; hepsi bağlı ama ok yanlışsa bölüm bitmez, "Tabela: …" bildirimi çıkar, yanlış tabela işaretlenir; ok düzelince biter',
      !ok.bad && ok.lit && !ok.solved && bad.base && !bad.solved && bad.bad.length === 1 && bad.bad[0] === w.i && !bad.won && !mOpen && /Tabela: merkeze giden yol/.test(bad.toast) && won,
      JSON.stringify({ k, ok, w, bad, mOpen, won }));
    errs.push(...errors);
    await ctx.close();
  }
  check('sign.errors', 'Tabela senaryolarında konsol hatası yok', !errs.length, errs.join(' | '));
};
