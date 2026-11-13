// node kut/test/oyun.test.cjs — tarayıcıda tam maç oynar (basit satın alma), JS hatası arar, ekran görüntüsü alır
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const out = path.join(__dirname, '..', 'test-out'); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const hatalar = []; p.on('pageerror', e => hatalar.push(e.message)); p.on('console', m => m.type() === 'error' && hatalar.push(m.text()));
  await p.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await p.screenshot({ path: out + '/1-ana.png' });
  await p.click('#bOyna'); await p.waitForTimeout(200);
  let tur = 0, kutTest = false, kaynas = false;
  while (tur++ < 15) {
    if (await p.isVisible('#son.aktif')) break;
    await p.waitForSelector('#mac.aktif', { timeout: 15000 });
    for (let k = 0; k < 6; k++) { const n = p.locator('#mDukkan .kart:not(.bos):not(.pahali)'); if (!(await n.count())) break; await n.first().click(); }
    for (let i = 0; i < 4; i++) {
      const y = p.locator('#mYedek .yuva:has(.birim)'), bos = p.locator('#mTahta .yuva:not(:has(.birim))');
      if (!(await y.count()) || !(await bos.count())) break;
      await y.first().click(); await bos.first().click();
      if (await p.locator('#mYedek .yuva:has(.birim.secili)').count()) { await y.first().click(); break; } // takım sınırı
    }
    if (tur === 4) {
      const bs = p.locator('#mTahta .yuva');
      await bs.nth(0).click(); await p.click('#eKay').catch(() => {}); await bs.nth(1).click();
      kaynas = await p.evaluate(() => KUT_OYUN.M().tahta.some(x => x && x.f));
      await p.screenshot({ path: out + '/2-dukkan.png' });
    }
    await p.click('#bSavas'); await p.waitForSelector('#savas.aktif');
    if (!kutTest) {
      await p.waitForTimeout(700);
      const box = await p.$eval('#tuval', e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
      const c = Math.min(box.w / 6, box.h / 8), ox = (box.w - c * 6) / 2, oy = (box.h - c * 8) / 2;
      for (const cx of [3, 1, 5]) await p.mouse.click(box.x + ox + cx * c, box.y + oy + 5 * c);
      await p.waitForTimeout(250); await p.screenshot({ path: out + '/3-savas.png' });
      kutTest = await p.$eval('#sKut', e => e.classList.contains('bitti'));
    }
    await p.click('#bHiz'); await p.click('#bHiz');
    await p.waitForFunction(() => document.querySelector('#sSonuc').classList.contains('acik'), null, { timeout: 40000 });
    await p.waitForTimeout(1600);
  }
  await p.screenshot({ path: out + '/4-son.png' });
  const son = await p.isVisible('#son.aktif');
  console.log('tur', tur, '| maç bitti', son, '| kut', kutTest, '| kaynaşma', kaynas, '| hatalar', hatalar);
  await b.close(); process.exit(son && kutTest && kaynas && !hatalar.length ? 0 : 1);
})();
