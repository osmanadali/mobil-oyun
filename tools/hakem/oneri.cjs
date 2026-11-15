// Arkadaşına öner (ödülsüz): ana sayfada yeni hat bitince ya da 7 günlük seride bir kez; en fazla 3 kez, aralarında 30 gün; aynı gün mağaza puan penceresiyle çakışmaz.
// Ayarlar'da "Arkadaşına öner" (paylaşım menüsü) ve uygulamada "Ray'i değerlendir" (mağazanın yorum sayfası) satırları. Paylaşınca hiçbir ödül verilmez.
// hakem.cjs K bölümü çağırır; tek başına: --only=oneri
module.exports = async T => {
  const { browser, URL, open, check } = T;
  const base = { played: 30, level: 30, stars: {}, remindAsked: true, g11: 1, seen: Object.fromEntries(Array.from({ length: 30 }, (_, c) => [c, 1])) };
  // 1) 2. hat bitmiş: pencere çıkar, paylaşım metni bağlantıyı içerir, ödül verilmez
  let o = await open(browser, URL, { save: base });
  await o.page.evaluate(() => { window.__shared = []; window.Capacitor = { getPlatform: () => 'ios', Plugins: { Share: { share: async x => { window.__shared.push(x.text); } } } }; });
  await o.page.evaluate(() => window.__ray.rec.show());
  await o.page.waitForTimeout(400);
  const before = await o.page.evaluate(() => { const s = JSON.parse(localStorage.getItem('ray')); return { hints: s.hints, crowns: JSON.stringify(s.crowns || {}), rec: s.rec }; });
  const shown = await o.page.evaluate(() => !!document.getElementById('mRec'));
  await o.page.click('#mRec'); await o.page.waitForTimeout(400);
  const after = await o.page.evaluate(() => { const s = JSON.parse(localStorage.getItem('ray')); return { hints: s.hints, crowns: JSON.stringify(s.crowns || {}), text: window.__shared[0] || '' }; });
  const again = await o.page.evaluate(() => window.__ray.rec.due());
  await o.ctx.close();
  // 2) yeni hat yok, seri kısa → çıkmaz; 3) 7 günlük seri → çıkar; 4) 3 kez gösterildiyse ya da 30 gün geçmediyse çıkmaz; 5) aynı gün puan penceresi çıktıysa çıkmaz
  const due = async save => { const x = await open(browser, URL, { save: { ...base, ...save } }); const d = await x.page.evaluate(() => window.__ray.rec.due()); await x.ctx.close(); return d; };
  const cases = {
    ilkHat: await due({ level: 5, played: 6 }),
    seri7: await due({ level: 5, played: 6, streak: 7, lastDaily: (d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'))(new Date()) }),
    ucKez: await due({ rec: { n: 3, at: 0, line: 1 } }),
    otuzGun: await due({ rec: { n: 1, at: Date.now() - 5 * 864e5, line: 1 } }),
    puanAyniGun: await due({ rv: { at: Date.now() - 3600e3, lvl: 30 } }),
  };
  // Ayarlar satırları (iOS'ta değerlendir satırı, web'de yalnız öner)
  o = await open(browser, URL, { save: base });
  await o.page.evaluate(() => document.getElementById('mClose')?.click()); await o.page.waitForTimeout(300);
  await o.page.click('#bSettings'); await o.page.waitForTimeout(500);
  const rows = await o.page.evaluate(() => ({ rec: !!document.getElementById('oRec'), rate: !!document.getElementById('oRate') }));
  await o.ctx.close();
  const ok = shown && before.rec?.n === 1 && after.hints === before.hints && after.crowns === before.crowns && /osmanadali\.github\.io\/mobil-oyun/.test(after.text) && again === false
    && cases.ilkHat === false && cases.seri7 === true && cases.ucKez === false && cases.otuzGun === false && cases.puanAyniGun === false && rows.rec && !rows.rate;
  check('oneri', 'Arkadaşına öner: yeni hatta ya da 7 günlük seride bir kez, en fazla 3 kez / 30 gün arayla, puan penceresiyle aynı gün değil, ödülsüz; Ayarlar satırı', ok, JSON.stringify({ shown, before, after: { ...after, text: after.text.slice(0, 60) }, again, cases, rows }), 'high');
};
