// 🎁 1.1 güncelleme hediyesi: eski oyuncuya bir kez +3 ipucu ve yenilikler penceresi; ikinci açılışta yok; yeni oyuncuya yok
// hakem.cjs K bölümü çağırır; tek başına: --only=hediye
module.exports = async T => {
  const { browser, URL, open, check } = T;
  const st = page => page.evaluate(() => ({ open: document.getElementById('modal').classList.contains('open'), h: document.querySelector('#mCard h2')?.textContent, hints: JSON.parse(localStorage.getItem('ray') || '{}').hints, g: JSON.parse(localStorage.getItem('ray') || '{}').g11 }));
  const o = await open(browser, URL, { init: 'window.__withGift = true', save: { played: 9, level: 4, stars: { 1: 3, 2: 3, 3: 2 }, remindAsked: true, hints: 3 } });
  await o.page.waitForTimeout(1200); const a = await st(o.page);
  await o.page.click('#mOk'); await o.page.waitForTimeout(500);
  await o.page.reload(); await o.page.waitForTimeout(1200); const b = await st(o.page);
  const err = o.errors.length; await o.ctx.close();
  const n = await open(browser, URL, { init: 'window.__withGift = true' });
  await n.page.waitForTimeout(1500); const c = await st(n.page); await n.ctx.close();
  check('hediye', '1.1 güncelleme hediyesi: eski oyuncuya açılışta pencere + 3 ipucu (bir kez; yeniden açınca yok); yeni oyuncuya hediye yok',
    a.open && /Güncelleme hediyesi/.test(a.h) && a.hints === 6 && a.g === 1 && !b.open && b.hints === 6 && c.hints !== 6 && !(c.open && /hediye/.test(c.h || '')) && !err, JSON.stringify({ a, b, c, err }), 'high');
};
