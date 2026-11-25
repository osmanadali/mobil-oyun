// 🔊 iOS ses kilidi (1.2.3, kullanıcı 22 Kasım: "oyunu açınca ses çalmıyor, üst menüyü indirince açılıyor"). iOS'u taklit eder: ses bağlamı
// açılıştan hemen sonra 'interrupted' olur ve yalnız dokunuş içinde çağrılan resume() ile açılır. Eskiden kısık (hushed) kalınca tone()
// hiç resume denemiyordu → ses ancak bildirim perdesiyle geliyordu. Tek başına: node tools/hakem.cjs --only=ses-kilidi
module.exports = async T => {
  const { browser, URL, open, check, starsUpTo, seenTo } = T;
  const MOCK = `(() => { const R = window.AudioContext; window.__tones = 0;
    class A extends R { constructor(...a) { super(...a); this._st = 'running'; window.__ac = this; setTimeout(() => { this._st = 'interrupted'; this.onstatechange?.(); }, 300); }
      get state() { return this._st; }
      resume() { if (navigator.userActivation?.isActive && this._st !== 'running') { this._st = 'running'; setTimeout(() => this.onstatechange?.(), 0); } return Promise.resolve(); }
      suspend() { this._st = 'suspended'; setTimeout(() => this.onstatechange?.(), 0); return Promise.resolve(); }
      createOscillator() { window.__tones++; return super.createOscillator(); } }
    window.AudioContext = A; window.webkitAudioContext = A; })();`;
  const { ctx, page, errors } = await open(browser, URL, { save: { played: 30, level: 30, stars: starsUpTo(29), remindAsked: true, seen: seenTo(5), g11: 1, lastGift: Date.now(), sound: true, music: false }, init: MOCK });
  await page.waitForTimeout(400);
  await page.evaluate(() => window.__ray?.tone?.(523) ?? null);
  await page.mouse.click(5, 5); await page.waitForTimeout(150);   // kullanıcı ekrana dokunur (iOS: dokunuş içinde ses açılabilir)
  await page.waitForTimeout(1200);
  const before = await page.evaluate(() => ({ st: window.__ac?.state, n: window.__tones }));
  await page.click('#bPlay').catch(() => {}); await page.waitForTimeout(1500);
  await page.evaluate(() => document.getElementById('mGo')?.click()); await page.waitForTimeout(400);
  const n0 = await page.evaluate(() => window.__tones);
  const p = await page.evaluate(() => { const R = window.__ray, G = R.G, g = R.geo, rc = document.getElementById('cv').getBoundingClientRect(); return [rc.left + g.ox + 1.5 * g.s, rc.top + g.oy + 1.5 * g.s]; });
  await page.mouse.click(p[0], p[1]); await page.waitForTimeout(300);
  const after = await page.evaluate(() => ({ st: window.__ac?.state, n: window.__tones }));
  check('ses.kilit', 'iOS ses kilidi: açılışta kesintiye uğrayan ses ilk dokunuşta açılır; karoya dokununca ses çalar (bildirim perdesi gerekmez)',
    after.st === 'running' && after.n > n0, JSON.stringify({ before, n0, after }), 'high');
  check('ses.kilit-konsol', 'Ses kilidi testinde konsolda hata yok', !errors.length, JSON.stringify(errors.slice(0, 3)));
  await ctx.close();
};
