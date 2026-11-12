// Süre sınırı ekranda görünen saniyeyle ölçülür (oyuncu bildirimi, 12 Kasım: "0:17 / 0:17" görünürken ⏱ yıldızı sönüyordu ve "+0:01 rötar" yazıyordu)
// hakem.cjs K bölümü çağırır; tek başına: --only=sure-sinir
module.exports = async T => {
  const { browser, URL, open, check, solve, waitModal, starsUpTo } = T;
  const run = async extra => {
    const { ctx, page, errors } = await open(browser, URL, { save: { played: 9, level: 3, stars: starsUpTo(2), remindAsked: true } });
    await page.click('#bPlay'); await page.waitForTimeout(900);
    await page.evaluate(x => { const G = window.__ray.G; G.ms = (G.lim.t + x) * 1000; }, extra);
    await solve(page, 0); await waitModal(page);
    const r = await page.evaluate(() => ({ next: document.getElementById('gNext').textContent, win: document.getElementById('winPanel')?.textContent.replace(/\s+/g, ' ').slice(0, 160), t: window.__ray.G.time, lim: window.__ray.G.lim.t, tOk: window.__ray.G.tOk }));
    await ctx.close(); return { ...r, err: errors.length };
  };
  const a = await run(-.6), b = await run(.4);   // çözüm ~1 sn sürer: a ≈ sınır + 0,4 · b ≈ sınır + 1,4
  const shown = r => Math.floor(r.t / 1000);
  check('sure.sinir', 'Süre sınırı ekrandaki saniyeyle: sınırı küsuratla aşan ama ekranda sınırla aynı saniye görünen süre "Tam vaktinde" ve ⏱ yıldızı yanar; rötarda yazılan fark ekrandaki saniyelerin farkı',
    shown(a) === a.lim && a.t / 1000 > a.lim && a.tOk && /Tam vaktinde/.test(a.next) && !/rötar/.test(a.win)
    && !b.tOk && new RegExp(`\\+0:0${shown(b) - b.lim} rötar`).test(b.next) && new RegExp(`0:${shown(b)} / 0:${b.lim}`).test(b.win) && !a.err && !b.err, JSON.stringify({ a, b }), 'high');
};
