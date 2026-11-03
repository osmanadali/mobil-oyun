// ❄ Soğuyan karo · ⚙ Bakım karosu · ↔ Kayan sıra (hatları RL'den) — hakem.cjs K bölümü çağırır. Ayrıntı: docs/kurallar/{soguyan-karo,bakim-karosu,kayan-sira}.md
module.exports = async T => {
  const { browser, URL, open, check, solve, tapTile, starsUpTo, RL, AT, KR } = T;
  const errs = [], SEEN = Object.fromEntries(Array.from({ length: 30 }, (_, k) => [k, 1]));
  const play = async level => { const o = await open(browser, URL, { save: { played: 99, level, stars: starsUpTo(level), seen: SEEN, remindAsked: true } }); await o.page.click('#bPlay'); await o.page.waitForTimeout(800); return o; };
  const st = page => page.evaluate(() => { const G = window.__ray.G; return { cur: G.cur.join(), moves: G.moves, won: G.won }; });
  const plain = page => page.evaluate(() => { const G = window.__ray.G, out = []; for (let i = 0; i < G.cur.length && out.length < 4; i++) if (!G.pinned[i] && !G.fixed[i] && !(G.unitOf?.[i] >= 0) && !(G.link?.[i] >= 0) && G.cnt[i] < 0 && !G.ice?.[i] && i !== G.hub && (!G.seen || G.seen[i])) out.push(i); return out; });

  // ---------- a) üretim: hat başları, tanıtım miktarları, 3 hattın bütün bölümlerinde çözüm dizilimi geçerli, karma son kuraldan sonra ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 9 } });
    const g = await page.evaluate(KR => {
      const R = window.__ray, o = {};
      for (const k of ['ice', 'gear', 'slide']) {
        const c = R.RULE_LINE[k], a = R.lineStart(c), P = R.puzzleFor(a); let bad = 0, has = 0;
        o[k] = { len: R.lineStart(c + 1) - a };
        for (let l = a; l < a + o[k].len; l++) { const Q = R.puzzleFor(l); if (Q[k]) has++; const S = { ...Q, cur: Q.sol.slice() }; if (!R.lit(S).solved) bad++; }
        Object.assign(o[k], { line: R.MODS.find(m => m.key === k)?.line, own: [...R.rulesFor(a)].join(), n: k === 'ice' ? P.ice?.filter(Boolean).length : P[k]?.length, has, bad });
      }
      o.karma = [...R.rulesFor(R.lineStart(KR))].length;
      return o;
    }, KR);
    check('new.gen', `Yeni kurallar: M${RL.ice + 1} ❄ (ilk bölüm 3 karo), M${RL.gear + 1} ⚙ (1 dişli), M${RL.slide + 1} ↔ (1 sıra); hatlarının her bölümünde var, çözüm dizilimi geçerli; karma M${KR + 1}'den`,
      g.ice.line === RL.ice && g.gear.line === RL.gear && g.slide.line === RL.slide && g.ice.own === 'ice' && g.gear.own === 'gear' && g.slide.own === 'slide' && g.ice.n === 3 && g.gear.n === 1 && g.slide.n >= 5
      && g.ice.has === g.ice.len && g.gear.has === g.gear.len && g.slide.has === g.slide.len && !g.ice.bad && !g.gear.bad && !g.slide.bad && g.karma >= 1, JSON.stringify(g));
    errs.push(...errors); await ctx.close();
  }

  // ---------- b) ❄ soğuyan karo: çevirip başka karoya geçince 2 hamle donar, sonra yine döner; aynı hamlede art arda dokunmak serbest ----------
  {
    const { ctx, page, errors } = await play(AT('ice'));
    const A = await page.evaluate(() => { const G = window.__ray.G; return G.ice.findIndex((v, i) => v && (!G.seen || G.seen[i])); }), [B, C] = await plain(page);
    await tapTile(page, A); await tapTile(page, A); const s1 = await st(page);   // aynı hamle: 2 dokunuş serbest
    await tapTile(page, B); const s2 = await st(page);
    await tapTile(page, A); const s3 = await st(page);                        // donmuş: değişmez
    const frozen = s3.cur === s2.cur && s3.moves === s2.moves;
    await tapTile(page, C); await tapTile(page, A); const s4 = await st(page); // 2 hamle geçti: döner
    check('new.ice', '❄ Soğuyan karo: art arda dokunuş aynı hamle; başka karoya geçince 2 hamle donar (dokunuş yok sayılır), 2 hamle sonra yine döner',
      A >= 0 && s1.moves === 1 && frozen && s4.cur !== s3.cur && s4.moves === 4, JSON.stringify({ A, B, C, m: [s1.moves, s2.moves, s3.moves, s4.moves], frozen }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- c) ⚙ bakım karosu: dokunulmaz; her 2 hamlede bir kendi döner; robot dişliyi bekleyerek çözer ----------
  {
    const { ctx, page, errors } = await play(AT('gear'));
    const g = await page.evaluate(() => window.__ray.G.gear[0]), gv = () => page.evaluate(g => window.__ray.G.cur[g], g), [B, C] = await plain(page);
    const v0 = await gv(); await tapTile(page, g); const v1 = await gv(), m1 = (await st(page)).moves;
    await tapTile(page, B); const v2 = await gv(); await tapTile(page, C); const v3 = await gv();
    await solve(page, 10, 60); await page.waitForTimeout(400);
    const won = (await st(page)).won;
    check('new.gear', '⚙ Bakım karosu: dokununca dönmez, hamle sayılmaz; 1. hamlede durur, 2. hamlede 90° döner; robot doğru hamlede bitirip kazanır',
      v1 === v0 && m1 === 0 && v2 === v0 && v3 !== v0 && won, JSON.stringify({ g, v: [v0, v1, v2, v3], m1, won }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- d) ↔ kayan sıra: sıraya dokununca bütün sıra bir kare sağa kayar (yönler aynı), sıra karosu tek başına dönmez; çözülür ----------
  {
    const { ctx, page, errors } = await play(AT('slide'));
    const row = await page.evaluate(() => window.__ray.G.slide), get = () => page.evaluate(r => r.map(q => window.__ray.G.cur[q]), row);
    const a = await get(); await tapTile(page, row[2]); const b = await get();
    const ok = a.every((v, p) => b[(p + 1) % a.length] === v);
    await solve(page, 10, 60); await page.waitForTimeout(400);
    const won = (await st(page)).won;
    check('new.slide', '↔ Kayan sıra: dokununca bütün sıra bir kare sağa kayar, en sağdaki başa geçer, yönler değişmez; bölüm çözülür',
      row.length >= 5 && ok && won, JSON.stringify({ row, a, b, won }));
    errs.push(...errors); await ctx.close();
  }

  check('new.errors', 'Yeni kural senaryolarında konsol hatası yok', !errs.length, errs.slice(0, 3).join(' | ') || 'hata yok');
};
