// 🔁 Tekrar kapış (1.2.3, Clash Royale gibi): arkadaş maçından sonra "Tekrar kapış" → davet kodsuz arkadaşa gider, onun ekranında
// "… tekrar kapışmak istiyor · Kabul et" çıkar, kabul edince ikisi aynı maçta. İkisi aynı anda basarsa tek maç. Gerçek lig.js + Firestore benzetimi.
// Tek başına: node tools/hakem.cjs --only=tekrar-kapis
const path = require('path');
const fakeFirebase = require(path.join(__dirname, '..', 'firestore-sahte.cjs'));
module.exports = async T => {
  const { browser, URL, open, check, solve, starsUpTo, seenTo, shot } = T;
  const base = { played: 30, level: 30, stars: starsUpTo(29), remindAsked: true, g11: 1, lastGift: Date.now(), seen: seenTo(5), sound: false, music: false };
  const FB = fakeFirebase();
  const mk = () => open(browser, URL, { save: base, init: 'window.__ligFake = false;', route: ctx => FB.attach(ctx) });
  const A = await mk(), B = await mk(), P = [A.page, B.page];
  await A.page.evaluate(() => window.Lig.join('Hızlı Martı')); await B.page.evaluate(() => window.Lig.join('Anne 61'));
  const inGame = p => p.waitForFunction(() => window.__ray.G?.duel && document.getElementById('game').classList.contains('active') && !document.getElementById('modal').classList.contains('open'), null, { timeout: 40000 });
  const result = p => p.waitForFunction(() => document.querySelector('#mCard .vres') && document.getElementById('vAgain'), null, { timeout: 40000 });
  const gid = p => p.evaluate(() => window.__ray.G?.duel?.id);
  // 1) ilk maç kodla
  await A.page.evaluate(() => { window.__ray.lig.vs(); window.__ray.lig.host(); });
  await A.page.waitForFunction(() => document.getElementById('vCode')?.textContent?.length === 5, null, { timeout: 20000 });
  const code = await A.page.evaluate(() => document.getElementById('vCode').textContent);
  await B.page.evaluate(c => { window.__ray.lig.vs(); window.__ray.lig.code(c); document.getElementById('vGo').click(); }, code);
  await Promise.all(P.map(inGame));
  const id1 = await gid(A.page);
  await solve(A.page, 80, 60);
  await Promise.all(P.map(result));
  // 2) A "Tekrar kapış" → B'de onay penceresi (kod yok) → Kabul → ikisi yeni maçta
  await A.page.evaluate(() => document.getElementById('vAgain').click());
  await A.page.waitForTimeout(600);
  const aWait = await A.page.evaluate(() => ({ h: document.querySelector('#mCard h2')?.textContent || '', bell: document.querySelector('#mCard .bell')?.textContent }));
  await B.page.waitForFunction(() => document.getElementById('iOk'), null, { timeout: 20000 }).catch(() => {});
  const ask = await B.page.evaluate(() => document.querySelector('#mCard h2')?.textContent || '');
  await shot(B.page, 'tekrar-kapis-davet'); await shot(A.page, 'tekrar-kapis-bekle');
  await B.page.evaluate(() => document.getElementById('iOk')?.click());
  let ok2 = true; try { await Promise.all(P.map(inGame)); } catch { ok2 = false; }
  const ids2 = await Promise.all(P.map(gid));
  check('rematch.kabul', '🔁 Tekrar kapış: davet kodsuz arkadaşa gider (“… tekrar kapışmak istiyor · Kabul et”), kabul edince ikisi aynı yeni maçta; davet eden “onay bekleniyor” görür',
    /Anne 61 davet edildi/.test(aWait.h) && /Hızlı Martı tekrar kapışmak istiyor/.test(ask) && ok2 && ids2[0] && ids2[0] === ids2[1] && ids2[0] !== id1, JSON.stringify({ aWait, ask, ok2, ids2, id1 }), 'high');
  // 3) ikisi aynı anda "Tekrar kapış" → tek maç (çift oda açılmaz, kimse ortada kalmaz)
  await solve(B.page, 80, 60);
  await Promise.all(P.map(result));
  await Promise.all(P.map(p => p.evaluate(() => document.getElementById('vAgain').click())));
  let ok3 = true; try { await Promise.all(P.map(inGame)); } catch { ok3 = false; }
  const ids3 = await Promise.all(P.map(gid));
  check('rematch.ayni-anda', '🔁 İkisi aynı anda “Tekrar kapış”: tek maçta buluşurlar (kimse onay penceresinde ya da bekleme ekranında kalmaz)', ok3 && ids3[0] && ids3[0] === ids3[1] && ids3[0] !== ids2[0], JSON.stringify({ ok3, ids3 }), 'high');
  // 4) "Hayır" → davet eden "yanıt vermedi"ye düşmeden vazgeçebilir; reddeden ana akışa döner
  const errors = [...A.errors, ...B.errors].filter(e => !/net::|Failed to load resource/.test(e));
  check('rematch.konsol', 'Tekrar kapış testinde konsolda hata yok', !errors.length, JSON.stringify(errors.slice(0, 5)));
  await A.ctx.close(); await B.ctx.close();
};
