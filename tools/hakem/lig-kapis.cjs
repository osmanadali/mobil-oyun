// Canlı kapışma: iki istemci aynı maçta. www/lig.js'in GERÇEK Firebase kodu (window.__ligFake yok) Node içindeki küçük
// Firestore benzetimine (tools/firestore-sahte.cjs) bağlanır; iki sayfa aynı sunucuyu paylaşır, B'nin yerel saati +3 sn kaymış.
// Denetlenen: iki istemci AYNI ANDA ararken eşleşir (ikinci, üçüncü… aramada da: "Tekrar kapış"), geri sayım iki sayfada aynı anda biter
// (< 150 ms), aynı bulmaca, art arda 5 maçta hep farklı bulmaca, iki ekranda aynı kazanan ve aynı puanlar (+10 / +2, her maçta bir kez),
// kuyruk kayıtları temizlenir. Kayıtlı rakip (👻): açıkça yazar, oyuncunun kendi kaydı seçilmez. Sonuç ekranı görüntüleri (sahte arka uç).
// tek başına: --only=lig
const path = require('path');
const fakeFirebase = require(path.join(__dirname, '..', 'firestore-sahte.cjs'));
module.exports = async T => {
  const { browser, URL, open, check, solve, starsUpTo, seenTo, shot } = T;
  const base = { played: 30, level: 30, stars: starsUpTo(29), remindAsked: true, g11: 1, lastGift: Date.now(), seen: seenTo(5), sound: false, music: false };
  const FB = fakeFirebase();
  const SKEW = 'const __n = Date.now; Date.now = () => __n.call(Date) + 3000;';
  const mk = async (init = '') => open(browser, URL, { save: base, init: 'window.__ligFake = false;' + init, route: ctx => FB.attach(ctx) });
  const A = await mk(), B = await mk(SKEW);
  const pages = [A.page, B.page];
  await A.page.evaluate(() => window.Lig.join('Hızlı Martı')); await B.page.evaluate(() => window.Lig.join('Mavi Tren'));
  const uids = await Promise.all(pages.map(p => p.evaluate(() => window.Lig.me().uid)));
  const pts = () => Promise.all(pages.map(p => p.evaluate(() => JSON.parse(localStorage.getItem('ray.lig')).pts || 0)));
  const inGame = p => p.waitForFunction(() => window.__ray.G?.duel && document.getElementById('game').classList.contains('active') && !document.getElementById('modal').classList.contains('open'), null, { timeout: 40000 });
  const result = p => p.waitForFunction(() => document.querySelector('#mCard .vres') && document.getElementById('vrPts')?.classList.contains('done'), null, { timeout: 30000 })
    .then(() => p.evaluate(() => ({ win: document.querySelector('.vres').classList.contains('win'), h: document.querySelector('.vres h2').textContent,
      cards: [...document.querySelectorAll('.vr-p')].map(c => ({ w: c.classList.contains('w'), nick: c.querySelector('b').textContent, pts: c.querySelector('em').textContent })), live: !!document.querySelector('.vres .vstag.live') })));
  const rounds = [];
  let pts0 = await pts();
  // 5 maç; her birinde iki taraf aynı anda arar (ilki: düğmeyle, sonrakiler sonuç ekranındaki "Tekrar kapış" ile)
  for (let i = 0; i < 5; i++) {
    if (i === 0) await Promise.all(pages.map(p => p.evaluate(() => { window.__ray.lig.vs(); window.__ray.lig.find(); })));
    else await Promise.all(pages.map(p => p.evaluate(() => document.getElementById('vAgain').click())));
    const t0 = Date.now();
    let ok = true; try { await Promise.all(pages.map(inGame)); } catch { ok = false; }
    if (!ok) { rounds.push({ i, matched: false, wait: Date.now() - t0 }); break; }
    const info = await Promise.all(pages.map(p => p.evaluate(() => ({ go: window.__ray.vsGo(), sig: window.__ray.G.sig, id: window.__ray.G.duel.id, opp: window.__ray.G.duel.opp.nick, ghost: !!window.__ray.G.duel.opp.ghost, level: window.__ray.G.duel.level }))));
    // kazanan: sırayla A, B, A, B; son maçta ikisi aynı anda bitirir (sonuç yine tek)
    const w = i === 4 ? -1 : i % 2;
    if (w === -1) await Promise.all(pages.map(p => solve(p, 0)));
    else await solve(pages[w], 0);
    const res = await Promise.all(pages.map(result)).catch(e => [{ err: String(e) }, {}]);
    await pages[0].waitForTimeout(1500);   // puan yazılsın
    const p1 = await pts();
    rounds.push({ i, matched: true, wait: Date.now() - t0, goDiff: Math.abs(info[0].go - info[1].go), sameSig: info[0].sig === info[1].sig, sameId: info[0].id === info[1].id, sig: info[0].sig, ghost: info[0].ghost || info[1].ghost,
      w, res, dPts: [p1[0] - pts0[0], p1[1] - pts0[1]] });
    pts0 = p1;
  }
  const q = FB.list('q/'), mem = uids.map(u => FB.list('weeks/').filter(p => p.endsWith('/members/' + u)).map(p => FB.get(p).pts)[0]);
  const skew = await B.page.evaluate(() => window.Lig.duel._skew?.()), fin = await pts();
  const consistent = rounds.every(r => r.matched && r.res[0].win !== r.res[1].win && JSON.stringify(r.res[0].cards.map(c => [c.nick, c.pts, c.w])) === JSON.stringify(r.res[1].cards.slice().reverse().map(c => [c.nick, c.pts, c.w])));
  const rightWinner = rounds.every(r => r.w === -1 || (r.res[r.w].win && !r.res[1 - r.w].win));
  const ptsOk = rounds.every(r => r.dPts.slice().sort((a, b) => a - b).join() === '2,10' && r.dPts[r.res[0].win ? 0 : 1] === 10);
  const timing = rounds.every(r => r.goDiff < 150), same = rounds.every(r => r.sameSig && r.sameId && !r.ghost), distinct = new Set(rounds.map(r => r.sig)).size === rounds.length;

  // 👻 kayıtlı rakip: A tek başına arar; sunucuda başka bir oyuncunun kaydı ve A'nın kendi kaydı var → başkasınınki gelir, açıkça yazar
  const lv = rounds[0] && FB.get(FB.list('matches/')[0])?.level || 25;
  const I = n => ({ integerValue: String(n) }), D = n => ({ doubleValue: n }), S = s => ({ stringValue: s });
  const tl = [[0, 0, 0], [800, .4, 3], [1600, .8, 6], [2400, 1, 9]];
  const gdoc = (by, nick, seed) => ({ fields: { by: S(by), nick: S(nick), tier: I(1), level: I(lv), seed: I(seed), at: I(Date.now()), tl: { arrayValue: { values: tl.map(r => ({ arrayValue: { values: [I(r[0]), D(r[1]), I(r[2])] } })) } } }, createTime: Date.now() * 1000, updateTime: Date.now() * 1000 });
  FB.docs.set('ghosts/zzother', gdoc('someone-else', 'Kuzey 42', 777001));
  FB.docs.set('ghosts/zzmine', gdoc(uids[0], 'Hızlı Martı', 777002));
  await B.ctx.close();
  await A.page.evaluate(() => document.getElementById('vHome')?.click()); await A.page.waitForTimeout(400);
  await A.page.evaluate(() => window.__ray.lig.find());
  await A.page.waitForFunction(() => document.querySelector('#mCard .vstag'), null, { timeout: 40000 }).catch(() => {});
  const gi = await A.page.evaluate(() => ({ tag: document.querySelector('#mCard .vstag')?.className || '', txt: document.querySelector('#mCard .vstag')?.textContent || '' }));
  await inGame(A.page).catch(() => {});
  const gb = await A.page.evaluate(() => ({ bar: document.getElementById('vsOppN').textContent, sub: document.getElementById('gMoves').textContent, seed: window.__ray.G?.duel?.seed }));
  const gr = await result(A.page).catch(() => null);
  const gTag = await A.page.evaluate(() => document.querySelector('.vres .vstag')?.textContent || '');
  await A.page.evaluate(() => window.Lig.leave());
  const left = FB.list('q/').length + FB.list('weeks/').filter(p => p.includes(uids[0])).length + (FB.users.has(uids[0]) ? 1 : 0);
  const errors = [...A.errors, ...B.errors].filter(e => !/net::|Failed to load resource/.test(e));
  await A.ctx.close();
  check('lig.kapis2.eslesme', 'Kapışma (iki istemci): ikisi aynı anda ararken eşleşir, “Tekrar kapış” ile 5 kez art arda; kuyruk kaydı kalmaz', rounds.length === 5 && rounds.every(r => r.matched) && !q.length,
    JSON.stringify({ rounds: rounds.map(r => ({ i: r.i, matched: r.matched, wait: r.wait })), q }), 'high');
  check('lig.kapis2.sonuc', 'Kapışma (iki istemci): iki ekranda aynı kazanan, aynı oyuncu kartları ve puanlar; gerçekten önce bitiren kazanır (aynı anda bitirince de tek kazanan)', consistent && rightWinner,
    JSON.stringify(rounds.map(r => ({ i: r.i, w: r.w, res: r.res }))), 'high');
  check('lig.kapis2.puan', 'Kapışma (iki istemci): kazanan +10, kaybeden +2, her maçta bir kez (yerel ve sunucudaki tablo aynı)', ptsOk && rounds.length === 5 && mem[0] === fin[0] && mem[1] === fin[1],
    JSON.stringify({ d: rounds.map(r => r.dPts), mem, fin }), 'high');
  check('lig.kapis2.saat', 'Kapışma (iki istemci, B’nin saati +3 sn kaymış): geri sayım iki sayfada aynı anda biter (< 150 ms)', timing && rounds.length === 5 && Math.abs((skew?.skew || 0) + 3000) < 400,
    JSON.stringify({ go: rounds.map(r => r.goDiff), skew }), 'high');
  check('lig.kapis2.bulmaca', 'Kapışma: iki tarafta aynı bulmaca; art arda 5 maçta hep farklı bulmaca (maça özel tohum)', same && distinct, JSON.stringify(rounds.map(r => ({ sig: r.sig, same: r.sameSig }))), 'high');
  check('lig.kapis2.hayalet', 'Kayıtlı rakip (👻): girişte, oyunda ve sonuçta açıkça yazar; oyuncunun kendi kaydı seçilmez', /ghost/.test(gi.tag) && /Kuzey 42/.test(gi.txt) && /👻/.test(gb.bar) && /Kuzey 42/.test(gb.bar) && /Kayıtlı/.test(gb.sub) && gb.seed === 777001 && gr && !gr.live && /Kayıtlı/.test(gTag),
    JSON.stringify({ gi, gb, gr, gTag }), 'high');
  check('lig.kapis2.temiz', 'Ligden çık: kuyruk, tablo kaydı ve anonim hesap silinir; konsolda hata yok', !left && !errors.length, JSON.stringify({ left, errors: errors.slice(0, 5) }), 'high');

  // sonuç ekranı görüntüleri (sahte arka uç): kazanma / kaybetme × 390×844 / 320×640 × açık / koyu
  const fit = [];
  for (const [vw, vh] of [[390, 844], [320, 640]]) for (const scheme of ['light', 'dark']) for (const won of [true, false]) {
    const o = await open(browser, URL, { vp: [vw, vh], scheme, save: base, init: 'window.__ligFake = true' });
    await o.page.evaluate(() => window.Lig.join('Hızlı Martı'));
    await o.page.evaluate(w => { window.__ray.lig.vs(); window.__ray.lig.find({ wait: 200, oppT: w ? 120 : 3 }); }, won);
    await inGame(o.page);
    if (won) await solve(o.page, 60);
    await result(o.page).catch(() => {});
    await o.page.waitForTimeout(1800);
    fit.push(await o.page.evaluate(([vw, vh, scheme, won]) => { const c = document.getElementById('mCard'), r = c.getBoundingClientRect();
      return { k: `${won ? 'kazan' : 'kaybet'}-${vw}-${scheme}`, fits: c.scrollHeight <= c.clientHeight + 1 && c.scrollWidth <= c.clientWidth + 1 && r.top >= 0, h: document.querySelector('.vres h2')?.textContent }; }, [vw, vh, scheme, won]));
    await shot(o.page, `kapis-sonuc-${won ? 'kazan' : 'kaybet'}-${vw}-${scheme === 'light' ? 'acik' : 'koyu'}`);
    await o.ctx.close();
  }
  check('lig.kapis.sonuc-ekrani', 'Kapışma sonuç ekranı: “Kazandın!” / “Kaybettin”, iki oyuncu yan yana; 390 ve 320 px’te, açık ve koyu temada kaydırmadan sığar', fit.every(f => f.fits && /Kazandın|Kaybettin/.test(f.h)), JSON.stringify(fit), 'high');
};
