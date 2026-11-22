// ⚔️ Kapışma maç türü (1.3): seçilen bölüm 150+ ise ⬡ altıgen (~%25) ya da 🧩 kurallı kare (bölümün kuralları + bir kural daha).
// Sürüm uyumu: rakip 1.2 (dv yok) ise hep kuralsız kare; türlü kayıtlı oyunlar eksi bölüm numarasıyla (1.2 sorgusunda görünmez).
// Tek başına: node tools/hakem.cjs --only=kapis-tur
const path = require('path');
const fakeFirebase = require(path.join(__dirname, '..', 'firestore-sahte.cjs'));
module.exports = async T => {
  const { browser, URL, open, check, solve, starsUpTo, seenTo, shot } = T;
  const base = { played: 230, level: 230, stars: starsUpTo(229), remindAsked: true, g11: 1, lastGift: Date.now(), seen: { ...seenTo(40), hex: 1 }, sound: false, music: false };
  const errs = [];

  // ---------- a) üretim: tür → tahta; çözülebilir, iki tarafta aynı (tohumdan), eski tür bit bit aynı; tür seçimi ve sürüm uyumu ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { save: base });
    const r = await page.evaluate(() => {
      const R = window.__ray, D = R.lig.duelFor, K = window.__ligKind, o = { hex: 0, mix: 0, bad: [], rules: {}, nr: [], kinds: { hex: 0, mix: 0, '': 0 }, old: 0, low: 0 };
      const sig = P => P.cur.join(',') + '|' + P.sol.join(',') + '|' + (P.rules || []).join(',');
      for (let i = 1; i <= 24; i++) {
        const lv = 150 + i * 17, seed = 9001 + i * 7919;
        const H = D({ seed, level: lv, k: 'hex' }), M = D({ seed, level: lv, k: 'mix' }), P = D({ seed, level: lv, k: '' }), Q = D({ seed, level: lv });
        if (!H.hex || ![37, 61].includes(H.cur.length) || H.rules.length || !R.HX.lit({ ...H, cur: H.sol }).solved || H.cur.every((v, j) => v === H.sol[j])) o.bad.push('hex' + i); else o.hex++;
        if (M.hex || M.rules.length < 2 || M.cur.every((v, j) => v === M.sol[j])) o.bad.push('mix' + i + ':' + M.rules); else o.mix++;
        o.nr.push(M.rules.length); M.rules.forEach(k => o.rules[k] = (o.rules[k] || 0) + 1);
        if (M.rules.some(k => R.RULE_LINE[k] > R.lineOf(lv))) o.bad.push('bilinmeyen kural ' + i);
        if (P.hex || P.rules.length || sig(P) !== sig(Q)) o.bad.push('düz' + i);
      }
      for (let i = 0; i < 400; i++) o.kinds[K(150 + i % 300, 2)]++;
      for (let i = 0; i < 100; i++) { if (K(200 + i, undefined)) o.old++; if (K(149 - (i % 140), 2)) o.low++; }
      return o;
    });
    check('kapis.tur.uretim', `Kapışma türü: ⬡ altıgen (${r.hex}/24) 37/61 karo, kuralsız, çözülebilir; 🧩 kurallı (${r.mix}/24) en az 2 kural (ort. ${(r.nr.reduce((a, b) => a + b, 0) / r.nr.length).toFixed(1)}), yalnız öğrenilmiş kurallar; türsüz maç eskisi gibi`,
      !r.bad.length && r.hex === 24 && r.mix === 24 && Object.keys(r.rules).length >= 8, JSON.stringify({ bad: r.bad, rules: r.rules }), 'high');
    check('kapis.tur.oran', `Tür seçimi: 150+ bölümde ~%25 altıgen (${r.kinds.hex}/400), kalanı kurallı; 150 altında ve rakip 1.2'deyse (dv yok) hep kuralsız kare`,
      r.kinds[''] === 0 && r.kinds.hex > 60 && r.kinds.hex < 140 && r.old === 0 && r.low === 0, JSON.stringify(r.kinds) + ` old ${r.old} low ${r.low}`, 'high');
    errs.push(...errors); await ctx.close();
  }

  // ---------- b) oyun (sahte arka uç): altıgen ve kurallı kapışma baştan sona; giriş ekranı türü söyler, maç ortasında kart açılmaz ----------
  const play = [];
  for (const k of ['hex', 'mix']) {
    const { ctx, page, errors } = await open(browser, URL, { save: { ...base, seen: { ...seenTo(40) } }, init: 'window.__ligFake = true' });   // seen.hex yok: tanıtım kartı kapışmada açılmamalı
    await page.evaluate(() => window.Lig.join('Hızlı Martı'));
    await page.evaluate(k => { window.__ray.lig.vs(); window.__ray.lig.find({ wait: 200, oppT: 200, k }); }, k);
    await page.waitForFunction(() => document.querySelector('#mCard .vskind'), null, { timeout: 20000 }).catch(() => {});
    const intro = await page.evaluate(() => document.querySelector('#mCard .vskind')?.textContent || '');
    if (k === 'hex') await shot(page, 'kapis-tur-giris-altigen'); else await shot(page, 'kapis-tur-giris-kurali');
    await page.waitForFunction(() => window.__ray.G?.duel && document.getElementById('game').classList.contains('active') && !document.getElementById('modal').classList.contains('open'), null, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(600);
    const g = await page.evaluate(() => { const G = window.__ray.G; return { hex: !!G?.hex, rules: G?.rules || [], k: G?.duel?.k, modal: document.getElementById('modal').classList.contains('open') }; });
    await shot(page, `kapis-tur-oyun-${k}`);
    await solve(page, 20, 60);
    const won = await page.waitForFunction(() => document.querySelector('#mCard .vres'), null, { timeout: 20000 }).then(() => page.evaluate(() => document.querySelector('.vres').classList.contains('win')), () => false);
    play.push({ k, intro, ...g, won });
    errs.push(...errors); await ctx.close();
  }
  check('kapis.tur.oyun', 'Kapışma: altıgen ve kurallı maç oynanır ve kazanılır; giriş ekranı türü yazar (⬡ Altıgen tahta / 🧩 Kurallı tahta + kural adları); maç ortasında tanıtım kartı açılmaz',
    play.length === 2 && play.every(p => p.won && !p.modal && p.k) && play[0].hex && /Altıgen/.test(play[0].intro) && !play[1].hex && play[1].rules.length >= 2 && /Kurallı/.test(play[1].intro) && play[1].intro.length > 16,
    JSON.stringify(play), 'high');

  // ---------- c) gerçek arka uç (Firestore benzetimi), iki 1.3 istemcisi, bölüm 230 civarı: maç belgesinde tür, iki tarafta aynı tahta; kayıt eksi bölümle ----------
  {
    const FB = fakeFirebase();
    const mk = () => open(browser, URL, { save: base, init: 'window.__ligFake = false;', route: ctx => FB.attach(ctx) });
    const A = await mk(), B = await mk(), pages = [A.page, B.page];
    await A.page.evaluate(() => window.Lig.join('Hızlı Martı')); await B.page.evaluate(() => window.Lig.join('Mavi Tren'));
    const inGame = p => p.waitForFunction(() => window.__ray.G?.duel && document.getElementById('game').classList.contains('active') && !document.getElementById('modal').classList.contains('open'), null, { timeout: 40000 });
    const rounds = [];
    for (let i = 0; i < 3; i++) {
      if (i === 0) await Promise.all(pages.map(p => p.evaluate(() => { window.__ray.lig.vs(); window.__ray.lig.find(); })));
      else await Promise.all(pages.map(p => p.evaluate(() => document.getElementById('vAgain').click())));
      let ok = true; try { await Promise.all(pages.map(inGame)); } catch { ok = false; }
      if (!ok) { rounds.push({ i, matched: false }); break; }
      const info = await Promise.all(pages.map(p => p.evaluate(() => { const G = window.__ray.G; return { k: G.duel.k, hex: !!G.hex, rules: (G.rules || []).join(), sig: G.cur.join(',') + '|' + G.sol.join(','), level: G.duel.level }; })));
      await solve(pages[i % 2], 80, 60);
      await Promise.all(pages.map(p => p.waitForFunction(() => document.querySelector('#mCard .vres') && document.getElementById('vrPts')?.classList.contains('done'), null, { timeout: 30000 }).catch(() => {})));
      await pages[0].waitForTimeout(1200);
      rounds.push({ i, matched: true, a: info[0], b: info[1] });
    }
    const ms = FB.list('matches/').map(p => FB.get(p)), gs = FB.list('ghosts/').map(p => FB.get(p));
    check('kapis.tur.iki-istemci', 'Kapışma (iki 1.3 istemcisi, bölüm 220+): maç belgesinde tür (hex/mix) yazılı, iki tarafta aynı tür ve aynı tahta; kayıtlı oyun türüyle ve eksi bölüm numarasıyla saklanır (1.2 sorgusu görmez)',
      rounds.length === 3 && rounds.every(r => r.matched && r.a.k && r.a.k === r.b.k && r.a.sig === r.b.sig && r.a.hex === (r.a.k === 'hex') && r.a.level >= 150) && ms.length === 3 && ms.every(m => ['hex', 'mix'].includes(m.k))
        && gs.length >= 3 && gs.every(g => g.k && g.level < 0),
      JSON.stringify({ rounds, ms: ms.map(m => ({ k: m.k, level: m.level })), gs: gs.map(g => ({ k: g.k, level: g.level })) }), 'high');
    errs.push(...A.errors, ...B.errors); await A.ctx.close(); await B.ctx.close();
  }
  const bad = errs.filter(e => !/net::|Failed to load resource/.test(e));
  check('kapis.tur.konsol', 'Kapışma türü testlerinde konsolda hata yok', !bad.length, JSON.stringify(bad.slice(0, 5)));
};
