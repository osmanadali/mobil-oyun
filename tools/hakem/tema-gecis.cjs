// Tema geçişi: Mağaza › Temalar sayfasında tema seçince sayfa yeniden çizilmez — kaydırma yerinde, sekme çubuğu aynı yerde, seçim işareti taşınır — hakem.cjs K bölümü çağırır
module.exports = async T => {
  const { browser, URL, open, check, getSave } = T;
  const { ctx, page, errors } = await open(browser, URL, { save: { played: 30, level: 40, remindAsked: true, owned: { ocean: 1, forest: 1 }, skin: 'ocean' } });
  await page.click('#crownChip'); await page.waitForTimeout(700);
  const st = () => page.evaluate(() => { const c = document.getElementById('shopBody'), x = document.getElementById('tTh'), r = x?.getBoundingClientRect();   // Temalar ayrı sayfa: gövde kayar, sekme düğmesi yerinde
    return { top: c.scrollTop, x: r ? [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)].join() : null, same: !!x?.__k, on: document.querySelector('#skins .skin.on')?.dataset.k,
      lab: Object.fromEntries([...document.querySelectorAll('#skins .skin:not(.lockd)')].map(b => [b.dataset.k, b.querySelector('small').textContent])), acc: getComputedStyle(document.documentElement).getPropertyValue('--acc').trim() }; });
  await page.evaluate(() => { const c = document.getElementById('shopBody'); c.scrollTop = 220; document.getElementById('tTh').__k = 1; }); await page.waitForTimeout(300);
  const a = await st();
  await page.click('#skins .skin[data-k=forest]'); await page.waitForTimeout(400);
  const b = await st(), s = await getSave(page);
  check('skin.switch', 'Renk temaları (Mağaza › Temalar sayfası): tema seçince sayfa yeniden çizilmez — kaydırma yerinde kalır, sekme düğmesi aynı düğme ve aynı yerde; "Seçili ✓" yeni temaya geçer, tema hemen uygulanır',
    a.top > 100 && b.top === a.top && b.same && b.x === a.x && b.on === 'forest' && /✓/.test(b.lab.forest) && !/✓/.test(b.lab.ocean) && s.skin === 'forest' && b.acc !== a.acc && !errors.length,
    JSON.stringify({ a: { top: a.top, x: a.x, on: a.on }, b: { top: b.top, x: b.x, same: b.same, on: b.on, lab: b.lab }, acc: [a.acc, b.acc], errors }));
  await ctx.close();
};
