// Duraklat: oyunda sol üst ‖ → pencere (müzik / efekt / titreşim, Devam et, Ana sayfa); süre durur, tahta bulanır; sonuçta ‹ ana sayfa — hakem.cjs K bölümü çağırır
module.exports = async T => {
  const { browser, URL, open, check, solve, waitModal, getSave, starsUpTo, shot } = T;
  const errs = [], SEEN = Object.fromEntries(Array.from({ length: 40 }, (_, k) => [k, 1]));
  const icon = page => page.evaluate(() => ['.i-pz', '.i-bk'].map(c => getComputedStyle(document.querySelector('#bBack ' + c)).display !== 'none'));

  // ---------- a) oyunda ‖: süre durur, tahta bulanır, ses anahtarları çalışır; Devam et → süre akar ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { vp: [320, 568], save: { played: 20, level: 20, stars: starsUpTo(20), seen: SEEN, remindAsked: true, sound: true } });
    await page.click('#bPlay'); await page.waitForTimeout(900);
    const ic0 = await icon(page);
    await page.click('#bBack'); await page.waitForTimeout(400);
    const m = await page.evaluate(() => { const c = document.getElementById('mCard'); return { open: document.getElementById('modal').classList.contains('open'), h: c.querySelector('h2')?.textContent, ids: ['oM', 'oS', 'oV', 'pGo', 'pHome'].filter(i => document.getElementById(i)), fit: c.scrollHeight <= c.clientHeight + 1, box: (r => [r.left, innerWidth - r.right, r.top, innerHeight - r.bottom].map(Math.round))(c.getBoundingClientRect()), blur: getComputedStyle(document.querySelector('#board canvas')).filter, ms: window.__ray.G.ms, run: window.__ray.G.runAt }; });
    await shot(page, 'pause-320');
    await page.waitForTimeout(1300);
    const ms2 = await page.evaluate(() => window.__ray.G.ms);
    await page.click('#oS'); await page.waitForTimeout(150);
    const snd = (await getSave(page)).sound;
    await page.click('#pGo'); await page.waitForTimeout(700);
    const r = await page.evaluate(() => ({ open: document.getElementById('modal').classList.contains('open'), paused: document.getElementById('game').classList.contains('paused'), run: window.__ray.G.runAt > 0, home: document.getElementById('home').classList.contains('active') }));
    check('pause.sheet', 'Duraklat: oyunda sol üstte ‖; basınca "Duraklatıldı" penceresi (müzik / efekt / titreşim, Devam et, Ana sayfa) ekranın ortasında küçük pencere (kenarlara ≥ 16 px), 320×568\'e kaydırmasız sığar; süre durur, tahta bulanır; anahtar ayarı kaydeder; Devam et ile süre akar',
      ic0[0] && !ic0[1] && m.open && m.h === 'Duraklatıldı' && m.ids.length === 5 && m.fit && m.box.every(v => v >= 16) && Math.abs(m.box[2] - m.box[3]) <= 4 && /blur/.test(m.blur) && !m.run && ms2 === m.ms && snd === false && !r.open && !r.paused && r.run && !r.home,
      JSON.stringify({ ic0, ...m, ms2, snd, r }));
    // dışarı dokununca da kapanır ve oyun sürer; Ana sayfa → yarım oyun kayıtta
    await page.click('#bBack'); await page.waitForTimeout(300);
    await page.mouse.click(160, 20); await page.waitForTimeout(500);
    const r2 = await page.evaluate(() => ({ open: document.getElementById('modal').classList.contains('open'), run: window.__ray.G.runAt > 0, paused: document.getElementById('game').classList.contains('paused') }));
    await page.click('#bBack'); await page.waitForTimeout(300); await page.click('#pHome'); await page.waitForTimeout(500);
    const s = await getSave(page), home = await page.evaluate(() => document.getElementById('home').classList.contains('active') && !document.getElementById('modal').classList.contains('open'));
    check('pause.leave', 'Duraklat: pencere dışına dokununca kapanır, oyun sürer; Ana sayfa yarım oyunu kaydeder (can gitmez)',
      !r2.open && r2.run && !r2.paused && home && !!s.runs?.level && s.lives !== 4, JSON.stringify({ r2, home, run: !!s.runs?.level, lives: s.lives }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- b) sonuç ekranında sol üst ‹ ana sayfa (duraklat değil); İngilizce ----------
  {
    const { ctx, page, errors } = await open(browser, URL, { locale: 'en-US', save: { played: 20, level: 20, stars: starsUpTo(20), seen: SEEN, remindAsked: true } });
    await page.click('#bPlay'); await page.waitForTimeout(700);
    await page.click('#bBack'); await page.waitForTimeout(300);
    const en = await page.evaluate(() => document.getElementById('mCard').innerText);
    await page.click('#pGo'); await page.waitForTimeout(300);
    await solve(page, 15); await waitModal(page);
    const ic = await icon(page), lab = await page.evaluate(() => document.getElementById('bBack').getAttribute('aria-label'));
    await page.click('#bBack'); await page.waitForTimeout(500);
    const home = await page.evaluate(() => document.getElementById('home').classList.contains('active') && !document.getElementById('modal').classList.contains('open'));
    check('pause.win', 'Sonuç ekranında sol üst ‹ (ana sayfa) — duraklat açılmaz; İngilizce pencere "Paused / Resume / Home"',
      !ic[0] && ic[1] && lab === 'Home' && home && /Paused/.test(en) && /Resume/.test(en) && /Home/.test(en) && !/[ğışçöü]/i.test(en), JSON.stringify({ ic, lab, home, en: en.replace(/\n/g, ' | ') }));
    errs.push(...errors); await ctx.close();
  }
  check('pause.errors', 'Duraklat senaryolarında konsol hatası yok', !errs.length, errs.slice(0, 3).join(' | ') || 'hata yok');
};
