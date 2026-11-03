// ❤️ Can sistemi ve 🚉 son süre — hakem.cjs K bölümü çağırır (geliştirirken --only=can)
// Bölüm numarasına sabit bağlı değil: hat sınırları __ray.lineStart'tan okunur. Saat Date.now oynatılarak ilerletilir.
module.exports = async T => {
  const { browser, URL, open, check, solve, shot, getSave } = T;
  const errs = [], MIN = 60e3;
  let LS;
  {
    const { ctx, page } = await open(browser, URL, { save: { played: 1 } });
    LS = await page.evaluate(() => Array.from({ length: 4 }, (_, c) => window.__ray.lineStart(c)));
    await ctx.close();
  }
  const level = LS[1] + 2;
  const stars = Object.fromEntries(Array.from({ length: level - 1 }, (_, k) => [k + 1, 3]));
  const base = { played: 60, level, stars, remindAsked: true, seen: Object.fromEntries(Array.from({ length: 40 }, (_, k) => [k, 1])) };
  const go = async x => {
    const o = await open(browser, URL, { save: { ...base, ...x } });
    await o.page.evaluate(() => { window.__ev = []; window.Olcum = { event: (n, p) => window.__ev.push([n, p || null]) }; });
    return o;
  };
  const st = page => page.evaluate(() => {
    const G = window.__ray.G, m = document.getElementById('modal').classList.contains('open');
    return { game: document.getElementById('game').classList.contains('active'), over: !!G?.over, dl: G?.lim.dl, t: G?.lim.t, modal: m ? document.getElementById('mCard').textContent.replace(/\s+/g, ' ').trim() : '', ev: window.__ev };
  });
  const clock = (page, ms) => page.evaluate(ms => { const r = Date.now.__r || Date.now, off = (Date.now.__o || 0) + ms; Date.now = () => r() + off; Date.now.__r = r; Date.now.__o = off; }, ms);

  // ---------- a) son süre: 2× yıldız süresi (en az +60 sn); son 10 sn sinyal yanıp söner; dolunca başarısız, 1 ❤️ gider ----------
  {
    const { ctx, page, errors } = await go({});
    await page.click('#bPlay'); await page.waitForTimeout(700);
    const s0 = await st(page);
    await page.evaluate(() => { const G = window.__ray.G; G.ms = (G.lim.t + 20) * 1000; }); await page.waitForTimeout(400);
    const late = await page.evaluate(() => ({ cls: document.getElementById('gTrip').className, over: window.__ray.G.over }));
    await page.evaluate(() => { const G = window.__ray.G; G.ms = (G.lim.dl - 6) * 1000; }); await page.waitForTimeout(400);
    const near = await page.evaluate(() => ({ cls: document.getElementById('gTrip').className, next: document.getElementById('gNext').textContent, anim: getComputedStyle(document.querySelector('#gTrip .sig')).animationName }));
    await shot(page, 'can-last-call');
    await page.evaluate(() => { const G = window.__ray.G; G.ms = (G.lim.dl + .2) * 1000; }); await page.waitForTimeout(1200);
    const f = await st(page), s = await getSave(page);
    await shot(page, 'can-fail');
    check('can.deadline', 'Son süre: yıldız süresinin 2 katı, en az +60 sn; rötarda bölüm sürer; son 10 sn kırmızı sinyal yanıp söner (🚉 geri sayım); dolunca "Son tren kaçtı", 1 ❤️ gider, yarım oyun silinir, life_lost ölçülür',
      s0.dl === Math.max(2 * s0.t, s0.t + 60) && /late/.test(late.cls) && !late.over && /last/.test(near.cls) && /🚉/.test(near.next) && near.anim === 'sigBlink' &&
      f.over && /Son tren kaçtı/.test(f.modal) && s.lives === 4 && Math.abs(Date.now() - s.lifeT) < 60e3 && !s.runs?.level && JSON.stringify(f.ev) === JSON.stringify([['life_lost', { lvl: level }]]) && !errors.length,
      JSON.stringify({ s0, late, near, over: f.over, modal: f.modal.slice(0, 80), lives: s.lives, run: !!s.runs?.level, ev: f.ev, errors }));
    // tahta kilitli, Tekrar dene yeni oyun açar
    const moves0 = await page.evaluate(() => window.__ray.G.moves);
    await page.click('#mRetry'); await page.waitForTimeout(700);
    const r = await st(page);
    check('can.retry', 'Başarısızlıkta Tekrar dene (kalan can yazılı) aynı bölümü baştan açar', !r.over && r.game && !r.modal && moves0 === 0 && /4 ❤️ kaldı/.test(f.modal), JSON.stringify({ r, f: f.modal }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- b) ⏱ +15 son süreyi de uzatır; son süreye 10 sn kala da görünür ----------
  {
    const { ctx, page, errors } = await go({ bst: { sure: 1 } });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    const dl0 = await page.evaluate(() => { const G = window.__ray.G; G.ms = (G.lim.dl - 6) * 1000; return G.lim.dl; }); await page.waitForTimeout(400);
    const vis = await page.evaluate(() => !document.getElementById('gPlus').hidden);
    await page.click('#gPlus'); await page.waitForTimeout(600);
    const r = await st(page);
    check('can.plus15', '⏱ +15 sn son süreye 10 sn kala da çıkar; son süre de 15 sn uzar, bölüm sürer', vis && r.dl === dl0 + 15 && !r.over && !errors.length, JSON.stringify({ vis, dl0, r }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- c) dolum: 30 dk'da 1 can (kapalıyken geçen süre de sayılır), en çok 5; ana sayfada Oyna'nın alt satırı ----------
  {
    const now = Date.now();
    const { ctx, page, errors } = await go({ lives: 2, lifeT: now - 65 * MIN });
    const a = { s: await getSave(page), txt: await page.textContent('#hLvl') };
    await clock(page, 31 * MIN); await page.waitForTimeout(1200);
    const b = { s: await getSave(page), txt: await page.textContent('#hLvl') };
    await clock(page, 5 * 60 * MIN); await page.waitForTimeout(1200);
    const c = { s: await getSave(page), txt: await page.textContent('#hLvl') };
    await shot(page, 'can-home');
    check('can.refill', 'Can dolumu zaman damgasından: 65 dk sonra 2→4 (artan 5 dk sayılır), 31 dk sonra 5; 5\'te durur; ana sayfada "❤️ 4 · 25:00" gibi sade satır',
      a.s.lives === 4 && a.s.lifeT === now - 5 * MIN && /❤️ 4 · 2[45]:\d\d/.test(a.txt) && b.s.lives === 5 && c.s.lives === 5 && /❤️ 5/.test(c.txt) && !errors.length,
      JSON.stringify({ a: [a.s.lives, a.s.lifeT - now, a.txt], b: [b.s.lives, b.txt], c: [c.s.lives, c.txt], errors }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- d) 0 can: bölüm başlamaz, pencere (geri sayım · video +1 ❤️ · Oyna) ----------
  {
    const { ctx, page, errors } = await go({ lives: 0, lifeT: Date.now() - 10 * MIN });
    await page.click('#bPlay'); await page.waitForTimeout(600);
    const a = await st(page);
    await shot(page, 'can-empty');
    await page.click('#mVid'); await page.waitForTimeout(900);
    const s = await getSave(page), b = await st(page);
    await page.click('#mGo'); await page.waitForTimeout(700);
    const c = await st(page);
    check('can.empty', '0 canda Oyna bölümü açmaz: "Canın kalmadı" penceresi sıradaki canı sayar (~20 dk); ödüllü video +1 ❤️ (life_refill_ad), sonra Oyna bölümü açar',
      !a.game && /Canın kalmadı/.test(a.modal) && /Sıradaki can 1?[90]:\d\d|Sıradaki can 20:00/.test(a.modal) && s.lives === 1 && JSON.stringify(b.ev) === JSON.stringify([['life_refill_ad', null]]) && /Oyna/.test(b.modal) && c.game && !c.modal && !errors.length,
      JSON.stringify({ a, lives: s.lives, b: b.modal.slice(0, 120), ev: b.ev, c: c.game, errors }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- e) sınırsız can: 0 canda da oynanır, başarısızlıkta can gitmez; ❤️∞ görünür ----------
  {
    const { ctx, page, errors } = await go({ lives: 0, lifeT: Date.now(), infUntil: Date.now() + 15 * MIN });
    const txt = await page.textContent('#hLvl');
    await page.click('#bPlay'); await page.waitForTimeout(700);
    await page.evaluate(() => { const G = window.__ray.G; G.ms = (G.lim.dl + .2) * 1000; }); await page.waitForTimeout(1200);
    const f = await st(page), s = await getSave(page);
    check('can.inf', 'Sınırsız can: ana sayfada "❤️∞ 14:59"; 0 canda bölüm açılır; son süre dolunca bölüm biter ama can gitmez (life_lost yok)',
      /❤️∞ 1[45]:\d\d/.test(txt) && f.over && /can gitmedi/.test(f.modal) && s.lives === 0 && !f.ev.length && !errors.length, JSON.stringify({ txt, f, lives: s.lives, errors }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- f) Günün Hattı ve zen: can harcamaz, son süre başarısızlığı yok ----------
  {
    const { ctx, page, errors } = await go({ lives: 0, lifeT: Date.now() });
    await page.click('#bDaily'); await page.waitForTimeout(900);
    await page.evaluate(() => { const G = window.__ray.G; G.ms = (G.lim.t * 3 + 120) * 1000; }); await page.waitForTimeout(600);
    const d = await st(page);
    await solve(page, 10); await page.waitForTimeout(900);
    const dWon = await page.evaluate(() => !!window.__ray.G.won);
    await page.evaluate(() => document.getElementById('mHome')?.click()); await page.waitForTimeout(500);
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('ray')); s.zen = true; localStorage.setItem('ray', JSON.stringify(s)); }); await page.reload(); await page.waitForTimeout(500);
    await page.evaluate(() => { window.__ev = []; window.Olcum = { event: (n, p) => window.__ev.push([n, p || null]) }; });
    const ztxt = await page.textContent('#hLvl');
    await page.click('#bPlay'); await page.waitForTimeout(700);
    await page.evaluate(() => { const G = window.__ray.G; G.ms = (G.lim.t * 3 + 120) * 1000; }); await page.waitForTimeout(600);
    const z = await st(page), s = await getSave(page);
    check('can.exempt', 'Günün Hattı ve 🍃 zen 0 canda da açılır, son süre yok (çok geç kalsa da bölüm sürer), can harcanmaz; zen\'de ana sayfada can yazmaz',
      d.game && !d.dl && !d.over && dWon && z.game && !z.dl && !z.over && !/❤️/.test(ztxt) && s.lives === 0 && !z.ev.length && !errors.length,
      JSON.stringify({ d, dWon, z, ztxt, lives: s.lives, errors }));
    errs.push(...errors); await ctx.close();
  }
  return errs;
};
