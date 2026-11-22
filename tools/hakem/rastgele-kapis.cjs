// 🎲 Rastgele rakip (1.2.3, 22 Kasım: "oyun bir tarafta başlıyor, diğerinde rakip aranıyorda kalıyor, sonra rakip ayrıldı diyor"):
// bekleyeni kapan telefonun maç kurma isteği sunucuya yazılıyor ama yanıt gelmiyor (zayıf ağ, 10 sn zaman aşımı). Eskiden kapan taraf
// "olmadı" sayıp aramaya devam ediyordu; şimdi maç belgesine bakıp o maça girer. Tek başına: node tools/hakem.cjs --only=rastgele-kapis
const path = require('path');
const fakeFirebase = require(path.join(__dirname, '..', 'firestore-sahte.cjs'));
module.exports = async T => {
  const { browser, URL, open, check, starsUpTo, seenTo } = T;
  const base = { played: 30, level: 30, stars: starsUpTo(29), remindAsked: true, g11: 1, lastGift: Date.now(), seen: seenTo(5), sound: false, music: false };
  const FB = fakeFirebase();
  let lost = 0;
  FB.lose = (uid, writes) => !lost && writes.some(x => /\/matches\//.test(x.update?.name || '')) && ++lost;   // ilk maç kurma yanıtı kaybolur
  const mk = () => open(browser, URL, { save: base, init: 'window.__ligFake = false;', route: ctx => FB.attach(ctx) });
  const A = await mk(), B = await mk(), P = [A.page, B.page];
  await A.page.evaluate(() => window.Lig.join('Hızlı Martı')); await B.page.evaluate(() => window.Lig.join('Anne 61'));
  const inGame = p => p.waitForFunction(() => window.__ray.G?.duel && !window.__ray.G.duel.ghost && document.getElementById('game').classList.contains('active') && !document.getElementById('modal').classList.contains('open'), null, { timeout: 40000 });
  await A.page.evaluate(() => { window.__ray.lig.vs(); window.__ray.lig.find(); });
  await A.page.waitForTimeout(2500);   // A kuyrukta bekliyor
  await B.page.evaluate(() => { window.__ray.lig.vs(); window.__ray.lig.find(); });
  let ok = true; try { await Promise.all(P.map(inGame)); } catch { ok = false; }
  const ids = await Promise.all(P.map(p => p.evaluate(() => window.__ray.G?.duel?.id || document.querySelector('#mCard h2')?.textContent || '')));
  check('rastgele.yanit-kayip', '🎲 Rastgele rakip: maç kurma isteğinin yanıtı kaybolsa da (zayıf ağ) iki taraf aynı maça girer; biri “rakip aranıyor”da kalmaz',
    lost === 1 && ok && ids[0] && ids[0] === ids[1], JSON.stringify({ lost, ok, ids }), 'high');
  const errors = [...A.errors, ...B.errors].filter(e => !/net::|Failed to load resource/.test(e));
  check('rastgele.konsol', 'Rastgele rakip testinde konsolda hata yok', !errors.length, JSON.stringify(errors.slice(0, 5)));
  await A.ctx.close(); await B.ctx.close();
};
