// 👥 Arkadaşlar ve 👉 dürtme (1.3): kodla kapışan iki oyuncu birbirinin arkadaş listesine girer; lig ekranında haftalık puanlar
// (grup ayrımı yok); geçtiğin arkadaşa haftada bir dürtme; alıcı ana sayfada pencereyle görür, belge silinir; ligden çıkınca dürtmeler de silinir.
// Gerçek lig.js Firebase kodu + tools/firestore-sahte.cjs. Tek başına: node tools/hakem.cjs --only=arkadas
const path = require('path');
const fakeFirebase = require(path.join(__dirname, '..', 'firestore-sahte.cjs'));
module.exports = async T => {
  const { browser, URL, open, check, starsUpTo, seenTo, shot } = T;
  const base = { played: 30, level: 30, stars: starsUpTo(29), remindAsked: true, g11: 1, lastGift: Date.now(), seen: seenTo(5), sound: false, music: false };
  const FB = fakeFirebase();
  const mk = () => open(browser, URL, { save: base, init: 'window.__ligFake = false;', route: ctx => FB.attach(ctx) });
  const A = await mk(), B = await mk();
  await A.page.evaluate(() => window.Lig.join('Hızlı Martı')); await B.page.evaluate(() => window.Lig.join('Anne 61'));
  const uids = await Promise.all([A, B].map(o => o.page.evaluate(() => window.Lig.me().uid)));

  // a) kodla eşleşme → iki taraf da arkadaş
  const code = await A.page.evaluate(async () => { const h = await window.Lig.duel.host({ levels: [20, 21] }); window.__w = h.wait(); return h.code; });
  await B.page.evaluate(c => window.Lig.duel.join(c, { levels: [20, 21] }), code);
  await A.page.evaluate(() => window.__w);
  await Promise.all([A, B].map(o => o.page.evaluate(() => window.Lig.duel.leave())));
  // yerel listeden okunur (Lig.friends() puanları dakikada bir tazeler; burada okursa b'deki puanlar önbellekte eski kalır)
  const fr0 = await Promise.all([A, B].map(o => o.page.evaluate(() => Object.entries(JSON.parse(localStorage.getItem('ray.lig')).fr || {}).map(([u, f]) => f.n + ':' + u))));
  check('arkadas.ekle', 'Kodla kapışınca iki oyuncu birbirinin arkadaş listesine girer', fr0[0].join() === 'Anne 61:' + uids[1] && fr0[1].join() === 'Hızlı Martı:' + uids[0], JSON.stringify(fr0), 'high');

  // b) A puan alır → lig ekranında Arkadaşlar: B'nin puanı ve 👉 Dürt; dürtünce düğme ✓, ikinci dürtme yazılmaz
  await A.page.evaluate(() => window.Lig.add(25)); await B.page.evaluate(() => window.Lig.add(10));
  await A.page.evaluate(() => window.__ray.lig.open()); await A.page.waitForFunction(() => document.querySelector('#lgFr .lgf'), null, { timeout: 15000 }).catch(() => {});
  const ui = await A.page.evaluate(() => ({ rows: [...document.querySelectorAll('#lgFr .lgf')].map(r => r.querySelector('span').textContent + '=' + r.querySelector('small').textContent), poke: !!document.querySelector('#lgFr .poke[data-p]') }));
  await A.page.evaluate(() => document.querySelector('#lgFr .lgf:not(.me)')?.scrollIntoView({ block: 'center' })); await A.page.waitForTimeout(900);
  await shot(A.page, 'arkadas-lig');
  await A.page.evaluate(() => document.querySelector('#lgFr .poke[data-p]')?.click()); await A.page.waitForTimeout(1200);
  const again = await A.page.evaluate(async uid => ({ btn: !!document.querySelector('#lgFr .poke[data-p]'), done: !!document.querySelector('#lgFr .poke.done'), second: await window.Lig.poke(uid) }), uids[1]);
  const docs = FB.list('pokes/');
  check('arkadas.dürt', 'Lig ekranında Arkadaşlar: haftalık puanlar (grup ayrımı yok), geçtiğin arkadaşta 👉 Dürt; dürtünce ✓ ve aynı hafta ikinci dürtme yazılmaz',
    ui.rows.join() === 'Hızlı Martı sen=25,Anne 61=10' && ui.poke && !again.btn && again.done && !again.second && docs.length === 1 && docs[0] === `pokes/${uids[1]}_${uids[0]}_${FB.get(docs[0]).wk}`,
    JSON.stringify({ ui, again, docs }), 'high');

  // c) B ana sayfayı açınca pencere: "Hızlı Martı seni dürttü!" + puanlar; belge silinir
  await B.page.evaluate(() => { document.querySelector('[data-tab=home]')?.click(); });
  await B.page.evaluate(() => window.__ray.lig.home()); await B.page.waitForFunction(() => /dürttü/.test(document.querySelector('#mCard h2')?.textContent || ''), null, { timeout: 15000 }).catch(() => {});
  const got = await B.page.evaluate(() => ({ h: document.querySelector('#mCard h2')?.textContent || '', p: document.querySelector('#mCard p')?.textContent || '' }));
  await B.page.waitForTimeout(900); await shot(B.page, 'arkadas-durtme');
  check('arkadas.al', 'Dürtülen oyuncu ana sayfada pencereyi görür (kim, kaç puan · sen kaç) ve belge sunucudan silinir', /Hızlı Martı seni dürttü/.test(got.h) && /25/.test(got.p) && /10/.test(got.p) && !FB.list('pokes/').length, JSON.stringify({ got, left: FB.list('pokes/') }), 'high');

  // d) arkadaşlardan çıkar: liste boşalır; sonra gelen dürtme gösterilmez. Ligden çıkınca gönderdiğim dürtmeler de silinir
  await B.page.evaluate(uid => window.Lig.dropFriend(uid), uids[0]);
  const fr1 = await B.page.evaluate(async () => (await window.Lig.friends()).length);
  await B.page.evaluate(() => window.Lig.add(40));
  const bp = await B.page.evaluate(uid => window.Lig.poke(uid), uids[0]);
  const before = FB.list('pokes/').length;
  await B.page.evaluate(() => window.Lig.leave());
  const after = FB.list('pokes/').length;
  check('arkadas.cikar', 'Arkadaşlardan çıkar: liste boşalır; ligden çıkınca gönderdiğin dürtmeler sunucudan silinir', fr1 === 0 && bp && before === 1 && after === 0, JSON.stringify({ fr1, bp, before, after }), 'high');

  const errors = [...A.errors, ...B.errors].filter(e => !/net::|Failed to load resource/.test(e));
  check('arkadas.konsol', 'Arkadaşlar ve dürtme testlerinde konsolda hata yok', !errors.length, JSON.stringify(errors.slice(0, 5)));
  await A.ctx.close(); await B.ctx.close();
};
