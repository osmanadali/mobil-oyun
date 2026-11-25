// 👆 Dokunma (1.2.1): dokunmatikte tahta touchstart ile dinlenir (iOS/Android'de karonun ortası "dönmüyordu", kullanıcı videosu 21 Kasım);
// bir dokunuş tam bir kez döndürür (pointer ve touch iki kez işlemez); fare yolu da çalışır; 🩺 dokunma tanısı olayları ve sonucu yazar.
// Tek başına: node tools/hakem.cjs --only=dokunma
module.exports = async T => {
  const { browser, URL, open, check, starsUpTo, seenTo } = T;
  const { ctx, page, errors } = await open(browser, URL, { vp: [393, 852], save: { played: 141, level: 141, stars: starsUpTo(140), remindAsked: true, seen: seenTo(40), sound: true, vib: true }, init: "localStorage.setItem('ray.tapdbg','1')" });
  await page.click('#bPlay').catch(() => {}); await page.waitForTimeout(1500);
  await page.evaluate(() => document.getElementById('mGo')?.click()); await page.waitForTimeout(500);
  const pt = (i, f = .5) => page.evaluate(([i, f]) => { const R = window.__ray, G = R.G, g = R.geo, rc = document.getElementById('cv').getBoundingClientRect(); return [rc.left + g.ox + ((i % G.cols) + f) * g.s, rc.top + g.oy + (((i / G.cols) | 0) + f) * g.s]; }, [i, f]);
  const st = () => page.evaluate(() => { const G = window.__ray.G; return { cur: G.cur.slice(), moves: G.moves }; });
  // düz ya da köşe bir karo seç (dörtlü kavşak dönünce aynı kalır)
  const i = await page.evaluate(() => { const G = window.__ray.G, pc = m => (m & 1) + (m >> 1 & 1) + (m >> 2 & 1) + (m >> 3 & 1); return G.cur.findIndex((v, j) => pc(v) === 2 && !(G.cnt[j] >= 0) && !G.fixed[j]); });
  const s0 = await st(); const [x, y] = await pt(i);
  await page.touchscreen.tap(x, y); await page.waitForTimeout(120);
  const s1 = await st();
  const rot = m => ((m << 1) | (m >> 3)) & 15;
  // aynı karonun ortasına 6 kez daha (insan hızında): her biri bir kez döndürür
  for (let k = 0; k < 6; k++) { await page.touchscreen.tap(x, y); await page.waitForTimeout(130); }
  const s2 = await st();
  let want = s0.cur[i]; for (let k = 0; k < 7; k++) want = rot(want);
  const [x2, y2] = await pt(i + 1); await page.mouse.click(x2, y2); await page.waitForTimeout(120);
  const s3 = await st();
  const log = await page.evaluate(() => document.getElementById('tapDbg')?.textContent || '');
  check('dokunma.touch', 'Dokunmatik: karonun ortasına her dokunuş tam bir kez döndürür (7 dokunuş = 7 × 90°; çift işleme yok); aynı karoya art arda dokunuş 1 hamle; fare yolu da çalışır',
    s1.cur[i] === rot(s0.cur[i]) && s2.cur[i] === want && s2.moves === s0.moves + 1 && s3.cur[i + 1] !== s2.cur[i + 1] && s3.moves === s2.moves + 1, JSON.stringify({ i, s0: s0.cur[i], s1: s1.cur[i], s2: s2.cur[i], want, m: [s0.moves, s1.moves, s2.moves, s3.moves] }), 'high');
  check('dokunma.tani', '🩺 Dokunma tanısı: her olayı, düştüğü karoyu ve sonucu yazar (touch → karo → döndü)', /touch \d+,\d+ → karo \d+ \(s\d+ k\d+\) → döndü/.test(log) && /mouse/.test(log), log.slice(0, 400), 'high');
  // iOS'ta görülen çift olay (1.2.3): aynı dokunuş için 70 ms arayla iki touchstart (aynı ya da farklı parmak kimliği) → tek dönüş
  const dbl = await page.evaluate(async i => { const R = window.__ray, G = R.G, g = R.geo, cv = document.getElementById('cv'), rc = cv.getBoundingClientRect();
    const x = rc.left + g.ox + ((i % G.cols) + .5) * g.s, y = rc.top + g.oy + (((i / G.cols) | 0) + .5) * g.s, out = [];
    const fire = (type, id) => { const t = new Touch({ identifier: id, target: cv, clientX: x, clientY: y }); cv.dispatchEvent(new TouchEvent(type, { touches: type === 'touchstart' ? [t] : [], changedTouches: [t], cancelable: true, bubbles: true })); };
    const w = ms => new Promise(r => setTimeout(r, ms));
    await w(300); let a = G.cur[i]; fire('touchstart', 7); await w(70); fire('touchstart', 7); await w(30); fire('touchend', 7); out.push([a, G.cur[i]]);
    await w(300); a = G.cur[i]; fire('touchstart', 8); await w(70); fire('touchend', 8); fire('touchstart', 9); await w(20); fire('touchend', 9); out.push([a, G.cur[i]]);
    await w(300); a = G.cur[i]; fire('touchstart', 10); await w(20); fire('touchend', 10); await w(160); fire('touchstart', 11); await w(20); fire('touchend', 11); out.push([a, G.cur[i]]);
    return out; }, i + 1);
  const r1 = m => ((m << 1) | (m >> 3)) & 15;
  check('dokunma.cift', 'Dokunmatik çift olay (iOS: aynı dokunuş için 70 ms arayla ikinci touchstart): karo bir kez döner (düz ray 180° dönüp “dönmedi” görünmez); 160 ms arayla iki gerçek dokunuş iki kez döndürür',
    r1(dbl[0][0]) === dbl[0][1] && r1(dbl[1][0]) === dbl[1][1] && r1(r1(dbl[2][0])) === dbl[2][1], JSON.stringify(dbl), 'high');
  // iOS'ta görülen (1.2.3 videosu, 🩺 "dokunuş path 105,294"): dokunuşun hedefi arka plandaki harita çizgisi (.bg path) olunca tuvale hiç gelmiyordu
  const stray = await page.evaluate(async i => { const R = window.__ray, G = R.G, g = R.geo, cv = document.getElementById('cv'), rc = cv.getBoundingClientRect();
    const x = rc.left + g.ox + ((i % G.cols) + .5) * g.s, y = rc.top + g.oy + (((i / G.cols) | 0) + .5) * g.s, path = document.querySelector('.bg .map path');
    const w = ms => new Promise(r => setTimeout(r, ms)); await w(300);
    const a = G.cur[i], t = new Touch({ identifier: 31, target: path, clientX: x, clientY: y });
    path.dispatchEvent(new TouchEvent('touchstart', { touches: [t], changedTouches: [t], cancelable: true, bubbles: true }));
    path.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [t], cancelable: true, bubbles: true }));
    await w(50); return [a, G.cur[i]]; }, i + 2);
  // 1.2.4 (25 Kasım videosu): hedef görünmeyen ana sayfanın SVG çizgisi (şehir silüeti / logo) olunca da karo döner
  const home = await page.evaluate(async i => { const R = window.__ray, G = R.G, g = R.geo, cv = document.getElementById('cv'), rc = cv.getBoundingClientRect();
    const x = rc.left + g.ox + ((i % G.cols) + .5) * g.s, y = rc.top + g.oy + (((i / G.cols) | 0) + .5) * g.s, path = document.querySelector('#home path');
    const w = ms => new Promise(r => setTimeout(r, ms)); await w(300);
    const a = G.cur[i], t = new Touch({ identifier: 41, target: path, clientX: x, clientY: y });
    path.dispatchEvent(new TouchEvent('touchstart', { touches: [t], changedTouches: [t], cancelable: true, bubbles: true }));
    path.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [t], cancelable: true, bubbles: true }));
    await w(50); return [a, G.cur[i], !!path]; }, i + 3);
  // 1.2.4: tahtanın üstünde .bg dışında, görünür ve dokunulabilir (pointer-events açık) bir SVG de karoyu döndürür; gerçek bir düğme ise döndürmez
  const over = await page.evaluate(async i => { const R = window.__ray, G = R.G, g = R.geo, cv = document.getElementById('cv'), rc = cv.getBoundingClientRect();
    const x = rc.left + g.ox + ((i % G.cols) + .5) * g.s, y = rc.top + g.oy + (((i / G.cols) | 0) + .5) * g.s, w = ms => new Promise(r => setTimeout(r, ms));
    const mk = html => { const d = document.createElement('div'); d.style.cssText = `position:fixed;left:${x - 20}px;top:${y - 20}px;width:40px;height:40px;z-index:99;pointer-events:auto`; d.innerHTML = html; document.getElementById('game').appendChild(d); return d; };
    const tap = (el, id) => { const t = new Touch({ identifier: id, target: el, clientX: x, clientY: y }); el.dispatchEvent(new TouchEvent('touchstart', { touches: [t], changedTouches: [t], cancelable: true, bubbles: true })); el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [t], cancelable: true, bubbles: true })); };
    await w(300); const d1 = mk('<svg width="40" height="40"><path d="M0 0L40 40" stroke="red" stroke-width="8"/></svg>'), a = G.cur[i]; tap(d1.querySelector('path'), 51); await w(50); const b = G.cur[i]; d1.remove();
    await w(300); const d2 = mk('<button style="width:40px;height:40px">x</button>'); tap(d2.querySelector('button'), 52); await w(50); const c = G.cur[i]; d2.remove();
    return [a, b, c]; }, i + 4);
  check('dokunma.ust-svg', 'iOS: tahtanın üstündeki görünür, dokunulabilir bir SVG (.bg dışında) dokunuşu yutmaz, karo döner; gerçek bir düğme ise kendi dokunuşunu alır (karo dönmez)', r1(over[0]) === over[1] && over[2] === over[1], JSON.stringify(over), 'high');
  check('dokunma.gizli-ekran', 'iPad/iPhone: dokunuşu görünmeyen ana sayfanın SVG çizgisi kapsa da tahtanın üstündeyse karo döner (1.2.3’te kalan “dokunuş path”)', home[2] && r1(home[0]) === home[1], JSON.stringify(home), 'high');
  check('dokunma.harita', 'iOS: dokunuşu arka plandaki harita çizgisi (SVG path) kapsa da tahtanın üstündeyse karo döner (“ortasına dokununca dönmüyor”)', r1(stray[0]) === stray[1], JSON.stringify(stray), 'high');
  check('dokunma.konsol', 'Dokunma testinde konsolda hata yok', !errors.length, JSON.stringify(errors.slice(0, 3)));
  await ctx.close();
  // 1.2.4 (kullanıcı 25 Kasım: "Görevler'deki 🎯'a basınca görevler açılmıyor"): tahta dışında da dokunuşu yutan ölü öğe (arka plan haritası,
  // gizli ekran) varsa tıklama alttaki gerçek düğmeye gider; düğmeye doğrudan dokunuş da bir kez açar (çift tıklama yok)
  const h = await open(browser, URL, { vp: [820, 1180], save: { played: 30, level: 30, stars: starsUpTo(30), remindAsked: true, seen: seenTo(20), sound: true }, init: "window.__noIntro = 1; localStorage.setItem('ray.tapdbg','1')" });
  await h.page.waitForTimeout(1200);
  const q = await h.page.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), M = document.getElementById('modal'), out = {};
    M.classList.remove('open'); await w(400);
    const b = document.getElementById('bQuest'), i = b.querySelector('i').getBoundingClientRect(), x = i.left + i.width / 2, y = i.top + i.height / 2;
    let n = 0; const keep = b.onclick; b.onclick = e => { n++; keep.call(b, e); };
    const tap = (el, id) => { const t = new Touch({ identifier: id, target: el, clientX: x, clientY: y }); el.dispatchEvent(new TouchEvent('touchstart', { touches: [t], changedTouches: [t], cancelable: true, bubbles: true })); el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [t], cancelable: true, bubbles: true })); };
    for (const [k, el] of [['harita', document.querySelector('.bg .map path')], ['gizli', document.querySelector('#game path, #game svg *, .screen:not(.active) path')]]) {
      n = 0; M.classList.remove('open'); await w(400); tap(el, k === 'harita' ? 61 : 62); await w(300); out[k] = [!!el, n, M.classList.contains('open')]; }
    out.log = (document.getElementById('tapDbg')?.textContent || '').split('\n').slice(-2).join(' | ');
    return out; });
  check('dokunma.ana-dugme', 'iOS: ana sayfada dokunuşu arka plan haritası ya da gizli ekranın SVG’si yutsa da alttaki düğme (Görevler 🎯) bir kez açılır', q.harita[0] && q.harita[1] === 1 && q.harita[2] && q.gizli[0] && q.gizli[1] === 1 && q.gizli[2], JSON.stringify(q), 'high');
  check('dokunma.ana-konsol', 'Ana sayfa dokunma testinde konsolda hata yok', !h.errors.length, JSON.stringify(h.errors.slice(0, 3)));
  await h.ctx.close();
  // 1.2.4 KÖK SEBEP (1.2'den beri): Şehir sekmesi bir kez açılınca haritasının saydam dokunma çizgileri (.sd .hit, pointer-events:stroke)
  // sayfa gizliyken de ana sayfa ve oyun ekranındaki dokunuşları yutuyordu. Gizli sayfanın hiçbir öğesi dokunuş almamalı.
  const c = await open(browser, URL, { vp: [820, 1180], save: { played: 120, level: 120, stars: starsUpTo(120), remindAsked: true, seen: seenTo(110) }, init: 'window.__noIntro = 1' });
  await c.page.waitForTimeout(1200);
  const scan = () => c.page.evaluate(() => { const hit = [], scr = document.querySelector('.screen.active')?.id; for (let y = 40; y < 1180; y += 12) for (let x = 6; x < 820; x += 12) { const e = document.elementFromPoint(x, y); if (e && e.closest('.screen:not(.active)')) hit.push([x, y, e.closest('.screen').id, e.tagName.toLowerCase() + '.' + (e.getAttribute('class') || '')]); } return { scr, n: hit.length, ilk: hit.slice(0, 3) }; });
  const cz = await c.page.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); document.getElementById('modal').classList.remove('open'); document.querySelector('.tabbar [data-tab=city]').click(); await w(900); const n = document.querySelectorAll('#city .sd .hit').length, act = document.querySelector('.screen.active')?.id; document.querySelector('.tabbar [data-tab=home]').click(); await w(900); return [n, act]; });
  const onHome = await scan();
  await c.page.evaluate(() => { window.__ray.G = null; document.getElementById('bPlay').click(); }); await c.page.waitForTimeout(1500);
  await c.page.evaluate(() => document.getElementById('mGo')?.click()); await c.page.waitForTimeout(600);
  const onGame = await scan();
  check('dokunma.gizli-sehir', 'Kök sebep: Şehir sekmesi açılıp kapandıktan sonra gizli Şehir haritası ana sayfada ve oyunda hiçbir dokunuşu yutmaz (1.2’den beri “karo dönmüyor”, “🎯 Görevler açılmıyor”)',
    cz[0] > 0 && cz[1] === 'city' && onHome.scr === 'home' && !onHome.n && onGame.scr === 'game' && !onGame.n, JSON.stringify({ cz, onHome, onGame }), 'high');
  await c.ctx.close();
};
