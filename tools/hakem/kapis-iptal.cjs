// ⚔️ Kapış iptali ve pencere geçişi (1.2.3, kullanıcı videosu 23 Kasım):
// a) "Rakip aranıyor"da Vazgeç → arama bitince "Şu an rakip yok" ÇIKMAZ (yalnız gerçekten rakip bulunamayınca çıkar)
// b) orta pencereden (Rakip aranıyor) hemen sonra alt pencere (Arkadaşını davet et) açılınca kutu ortadaki dar halinden genişlemez
// Tek başına: node tools/hakem.cjs --only=kapis-iptal
const path = require('path'); const fakeFirebase = require(path.join(__dirname, '..', 'firestore-sahte.cjs'));
module.exports = async T => {
  const { browser, URL, open, check, starsUpTo, seenTo } = T;
  const FB = fakeFirebase();
  const { ctx, page, errors } = await open(browser, URL, { vp: [820, 1180], save: { played: 30, level: 30, stars: starsUpTo(29), remindAsked: true, seen: seenTo(5), g11: 1, lastGift: Date.now(), sound: false, music: false }, init: 'window.__ligFake = false;', route: c => FB.attach(c) });
  await page.evaluate(() => window.Lig.join('Hızlı Martı'));
  await page.evaluate(() => window.__ray.lig.vs()); await page.waitForTimeout(600);
  // a) ara → 1,5 sn sonra Vazgeç → 24 sn bekle (arama süresi 20 sn): pencere açılmamalı
  await page.evaluate(() => { window.__ray.lig.find(); }); await page.waitForTimeout(1500);
  await page.evaluate(() => document.getElementById('vwX')?.click());
  await page.waitForTimeout(24000);
  const a = await page.evaluate(() => ({ open: document.getElementById('modal').classList.contains('open'), h: document.querySelector('#mCard h2')?.textContent || '' }));
  // gerçek "rakip yok": iptalsiz arama 20 sn sonra pencereyi açar (kayıtlı oyun yok)
  await page.evaluate(() => { window.__ray.lig.find(); });
  await page.waitForFunction(() => /rakip yok/i.test(document.querySelector('#mCard h2')?.textContent || ''), null, { timeout: 40000 }).catch(() => {});
  const b = await page.evaluate(() => document.querySelector('#mCard h2')?.textContent || '');
  check('kapis.iptal', 'Kapış: aramada Vazgeç’e basınca sonradan “Şu an rakip yok” çıkmaz; iptal edilmeyen aramada rakip bulunamazsa çıkar', !a.open && /rakip yok/i.test(b), JSON.stringify({ a, b }), 'high');
  await page.evaluate(() => document.getElementById('mClose')?.click()); await page.waitForTimeout(500);
  // b) orta pencere açıkken (Rakip aranıyor) Vazgeç ve hemen Arkadaşını davet et: kutunun genişliği açılış boyunca hep tam (daralıp genişlemez)
  await page.evaluate(() => { window.__ray.lig.find(); }); await page.waitForTimeout(800);
  const ws = await page.evaluate(async () => { document.getElementById('vwX').click(); window.__ray.lig.host(); const out = [];
    for (let i = 0; i < 14; i++) { await new Promise(r => setTimeout(r, 40)); const c = document.getElementById('mCard'); if (document.querySelector('#mCard h2')?.textContent.includes('davet')) out.push(Math.round(c.getBoundingClientRect().width)); }
    return { out, W: Math.round(document.getElementById('app').getBoundingClientRect().width) }; });
  check('kapis.pencere-gecis', 'Orta pencereden (Rakip aranıyor) hemen sonra alt pencere (Arkadaşını davet et): kutu ortadaki dar halinden genişlemez (tablette “sağdan soldan daralma”)',
    ws.out.length > 3 && ws.out.every(w => w >= ws.W - 2), JSON.stringify(ws), 'high');
  await page.evaluate(() => window.Lig.duel.leave());
  const bad = errors.filter(e => !/net::|Failed to load resource/.test(e));
  check('kapis.iptal-konsol', 'Kapış iptal testinde konsolda hata yok', !bad.length, JSON.stringify(bad.slice(0, 3)));
  await ctx.close();
};
