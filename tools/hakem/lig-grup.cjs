// 🏆 Lig grubu (1.2.1): yeni üye 30’dan az üyesi olan ilk gruba girer (gerçek üye sayısı); eski artan sayaç katıl-çık ile şişip aileyi ayırıyordu. Tek başına: --only=lig-grup
const path = require('path'); const fakeFirebase = require(path.join(__dirname, '..', 'firestore-sahte.cjs'));
module.exports = async T => {
  const { browser, URL, open, check } = T, FB = fakeFirebase(), base = { played: 30, level: 30, remindAsked: true };
  // 35 kez katıl-çık (sayaç şişer), sonra 2 kişi katılır → ikisi de aynı grupta (t0g0)
  const o = await open(browser, URL, { save: base, init: 'window.__ligFake = false;', route: ctx => FB.attach(ctx) });
  for (let i = 0; i < 35; i++) await o.page.evaluate(async i => { await window.Lig.join('Deneme ' + (10 + i)); await window.Lig.board(); await window.Lig.leave(); }, i);
  const a = await o.page.evaluate(async () => { await window.Lig.join('Anne 61'); await window.Lig.board(); return JSON.parse(localStorage.getItem('ray.lig')).grp; });
  const o2 = await open(browser, URL, { save: base, init: 'window.__ligFake = false;', route: ctx => FB.attach(ctx) });
  const b = await o2.page.evaluate(async () => { await window.Lig.join('Osman 1'); const r = await window.Lig.board(); return { grp: JSON.parse(localStorage.getItem('ray.lig')).grp, rows: r.rows.map(x => x.nick) }; });
  check('lig.grup-dolu', 'Lig grubu gerçek üye sayısına göre: 35 kez katıl-çık sonrası yeni gelen iki oyuncu aynı grupta (eski sayaç onları ayırıyordu) ve birbirini görür', a === 't0g0' && b.grp === 't0g0' && b.rows.includes('Anne 61'), JSON.stringify({ a, b }), 'high');
  await o.ctx.close(); await o2.ctx.close();
};
