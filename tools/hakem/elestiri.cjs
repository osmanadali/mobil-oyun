// Eleştiri turu: mola bölümleri, tek şerit gösterge (ray bağlantıyla yanar), bölüm sonunda şehrin canlanması, sade hat kartı — hakem.cjs K bölümü çağırır
module.exports = async T => {
  const { browser, URL, open, check, solve, starsUpTo } = T;
  const errs = [];
  const rail = page => page.evaluate(() => +getComputedStyle(document.getElementById('gTrip')).getPropertyValue('--b') || 0);
  const city = page => page.evaluate(() => document.querySelector('.bg').className);

  // ---------- a) üretim: mola bölümleri hattın 6., 12.… bölümü, bir boy küçük ve hat ortalamasından kolay; hat ortalamaları yine artar ----------
  {
    const { ctx, page, errors } = await open(browser, URL);
    const g = await page.evaluate(() => {
      const R = window.__ray, bad = [], avgs = []; let n = 0;
      for (let c = 0; c < 9; c++) {
        const a = R.lineStart(c), z = R.lineStart(c + 1) - 1; let d = 0, dn = 0, bd = 0, bn = 0;
        for (let l = a; l <= z; l++) {
          const P = R.puzzleFor(l), o = l - a, want = c > 0 && o >= 3 && o % 6 === 5 && l !== z;
          if (R.breath(l) !== want || !!P.breath !== want) bad.push(`${l}:işaret`);
          if (want) { n++; bd += P.diff; bn++; const [w, h] = R.sizeFor(l), [w2, h2] = R.sizeFor(l + 1); if (w * h >= w2 * h2 && w2 * h2 > 9) bad.push(`${l}:boy ${w}×${h}`); }
          else { d += P.diff; dn++; }
        }
        avgs.push(Math.round((d + bd) / (dn + bn) * 10) / 10);
        if (bn && bd / bn >= d / dn) bad.push(`M${c + 1}: mola ${(bd / bn).toFixed(1)} ≥ hat ${(d / dn).toFixed(1)}`);
      }
      const up = avgs.every((v, i) => !i || v > avgs[i - 1]);
      return { n, bad, avgs, up };
    });
    check('mola.gen', 'Mola bölümleri: M2–M9 her hattın 6., 12.… bölümü, bir boy küçük ızgara, hat ortalamasından kolay; hat ortalamaları yine her hatta artar',
      g.n >= 20 && !g.bad.length && g.up, `${g.n} mola · ortalamalar ${g.avgs.join(' → ')}${g.bad.length ? ' · ' + g.bad.slice(0, 4).join(', ') : ''}`);
    errs.push(...errors); await ctx.close();
  }

  // ---------- b) arayüz: mola başlığı ve ana sayfa; hat kartında toplam ★ tekrar edilmez ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 30, level: 18, stars: starsUpTo(18), seen: { 2: 1 }, remindAsked: true } });
    const home = await page.evaluate(() => ({ size: document.getElementById('sSize').textContent, gate: document.getElementById('gateTxt').textContent, tot: document.getElementById('sStars').textContent }));
    await page.click('#bPlay'); await page.waitForTimeout(700);
    const t18 = await page.evaluate(() => document.getElementById('gMoves').textContent);
    const meter = await page.evaluate(() => !!document.querySelector('.meter, #gPct, #gBar'));
    const b0 = await rail(page), want0 = await page.evaluate(() => { const G = window.__ray.G; return G.L.n / G.cur.length; });
    check('mola.ui', 'Mola: oyunda başlık "☕ mola", ana sayfada "☕ mola bölümü"; hat kartı toplam ★ yerine sıradaki hatta kalanı yazar',
      /☕ mola/.test(t18) && !/⚡/.test(t18) && home.size === '☕ mola bölümü' && /kaldı → M3/.test(home.gate) && !home.gate.includes(home.tot),
      `oyun "${t18}" · ana "${home.size}" · kart "${home.gate}" (çip ★ ${home.tot})`);

    // ---------- c) tek şerit: ayrı % çubuğu yok; rayın yanan kısmı = yanan karo oranı, bitince 1 ----------
    await solve(page, 15);
    await page.waitForTimeout(400);
    const b1 = await rail(page), c1 = await city(page);
    check('hud.rail', 'Gösterge: ayrı "%" çubuğu yok; sefer şeridinin rayı bağlantı oranıyla yanar, bölüm bitince tam yanar',
      !meter && Math.abs(b0 - want0) < .01 && b0 > 0 && b0 < 1 && b1 === 1, `ilk --b ${b0.toFixed(3)} (beklenen ${want0.toFixed(3)}) · bitiş ${b1}`);

    // ---------- d) şehir canlanır: bitişte harita parlar ve tren geçer; ana sayfaya dönünce söner ----------
    const op = await page.evaluate(() => +getComputedStyle(document.querySelector('.map')).opacity);
    await page.waitForSelector('#mHome', { timeout: 5000 }).catch(() => {}); await page.click('#mHome').catch(() => {}); await page.waitForTimeout(300);
    const c2 = await city(page);
    errs.push(...errors); await ctx.close();
    const r = await open(browser, URL, { rm: true, save: { played: 30, level: 19, stars: starsUpTo(19), seen: { 2: 1 }, remindAsked: true } });
    await r.page.click('#bPlay'); await r.page.waitForTimeout(700); await solve(r.page, 15); await r.page.waitForTimeout(300);
    const c3 = await city(r.page);
    errs.push(...r.errors); await r.ctx.close();
    check('city.win', 'Bölüm sonu: arkaplan şehir haritası parlar ve bir tren geçer (hareket azaltılmışsa yalnız ışık); menüye dönünce söner',
      /\bcity\b/.test(c1) && /\brun\b/.test(c1) && op > .2 && !/\bcity\b/.test(c2) && /\bcity\b/.test(c3) && !/\brun\b/.test(c3),
      `bitiş "${c1}" (saydamlık ${op.toFixed(2)}) · ana sayfa "${c2}" · hareket azaltılmış "${c3}"`);
  }

  check('elestiri.errors', 'Eleştiri turu senaryolarında konsol hatası yok', !errs.length, errs.slice(0, 3).join(' | ') || 'hata yok');
};
