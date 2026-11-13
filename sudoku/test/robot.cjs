// Büyülü Sudoku test robotu: node sudoku/test/robot.cjs
// Üretici doğruluğu + gerçek tarayıcıda oynanış, ekran boyutları, kayıt, performans.
const path = require('path'), fs = require('fs'), http = require('http');
const { chromium, devices } = require('playwright');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'test', 'out');
fs.mkdirSync(OUT, { recursive: true });
const results = []; const ok = (name, pass, info = '') => { results.push({ name, pass, info }); console.log(`${pass ? '✅' : '❌'} ${name}${info ? ' — ' + info : ''}`); };

// --- 1) Üretici (Node içinde) ---
function generatorTests() {
  const src = fs.readFileSync(path.join(ROOT, 'sudoku.js'), 'utf8');
  const Sudoku = new Function(src + '; return Sudoku;')();
  const valid = g => { for (let i = 0; i < 9; i++) { const r = new Set(), c = new Set(), b = new Set();
    for (let k = 0; k < 9; k++) { r.add(g[i * 9 + k]); c.add(g[k * 9 + i]); b.add(g[(3 * (i / 3 | 0) + (k / 3 | 0)) * 9 + 3 * (i % 3) + k % 3]); }
    if (r.size !== 9 || c.size !== 9 || b.size !== 9 || r.has(0)) return false; } return true; };
  const count = (g, lim = 2) => { const i = g.indexOf(0); if (i < 0) return 1; let n = 0;
    for (let v = 1; v <= 9 && n < lim; v++) if (Sudoku.canPlace(g, i, v)) { g[i] = v; n += count(g, lim - n); g[i] = 0; } return n; };
  for (const d of ['kolay', 'orta', 'zor']) {
    let bad = 0, nonUnique = 0, mismatch = 0, max = 0, clues = [];
    const N = d === 'zor' ? 60 : 100;
    for (let t = 0; t < N; t++) {
      const t0 = performance.now(); const { puzzle, solution } = Sudoku.generate(d); max = Math.max(max, performance.now() - t0);
      if (!valid(solution)) bad++;
      if (puzzle.some((v, i) => v && v !== solution[i])) mismatch++;
      if (count(puzzle.slice()) !== 1) nonUnique++;
      clues.push(puzzle.filter(Boolean).length);
    }
    const avg = (clues.reduce((a, b) => a + b) / clues.length).toFixed(1);
    ok(`Üretici ${d}: ${N} bulmaca geçerli, tek çözümlü`, !bad && !nonUnique && !mismatch, `ipucu ort. ${avg} (min ${Math.min(...clues)}, max ${Math.max(...clues)}), en yavaş ${max.toFixed(0)} ms`);
    ok(`Üretici ${d}: hızlı (< 1500 ms)`, max < 1500, `${max.toFixed(0)} ms`);
  }
}

// --- 2) Tarayıcı ---
function serve() {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };
  return new Promise(res => { const s = http.createServer((q, r) => {
    const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]).replace(/\/$/, '/index.html'));
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
  }).listen(0, () => res(s)); });
}

async function browserTests() {
  const srv = await serve(); const URL = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const state = p => p.evaluate(() => JSON.parse(localStorage.getItem('bsudoku_cur')));
  const fresh = async (dev, opts = {}) => {
    const c = await b.newContext({ ...dev, ...opts }); const p = await c.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
    p.on('requestfailed', r => errs.push('istek: ' + r.url()));
    await p.goto(URL); await p.waitForTimeout(400);
    if (await p.isVisible('#howModal')) await p.click('#howClose');
    return { c, p, errs };
  };

  // 2a) Oynanış: dokunma döngüsü, geri al, sil, uzun basış, ipucu, kayıt/devam
  {
    const { c, p, errs } = await fresh(devices['iPhone 13']);
    await p.click('[data-diff="kolay"]'); await p.waitForTimeout(1200);
    let s = await state(p); const cells = await p.$$('.cell');
    const empty = s.puzzle.map((v, i) => v ? -1 : i).filter(i => i >= 0);
    const i0 = empty[0];
    const seen = [];
    for (let k = 1; k <= 10; k++) { await cells[i0].tap(); if (k === 10) await p.waitForTimeout(450); seen.push(await p.$eval(`.cell:nth-child(${i0 + 1}) .dg`, e => +e.alt).catch(() => 0)); }
    ok('Dokunma döngüsü 1→9→boş', seen.join() === '1,2,3,4,5,6,7,8,9,0', seen.join());
    const classes = [];
    for (let k = 1; k <= 9; k++) { await cells[empty[1]].tap(); classes.push(await cells[empty[1]].evaluate(e => [...e.classList].find(x => /^a\d$/.test(x)))); }
    ok('Her rakamda farklı animasyon', new Set(classes).size === 9, classes.join(' '));
    await cells[empty[1]].tap(); // 10. dokunuş: boşa döner, ceza olmamalı
    await p.waitForTimeout(1200);
    // doğru değeri yaz, geri al
    s = await state(p); const i2 = empty[2], v2 = s.solution[i2];
    for (let k = 0; k < v2; k++) await cells[i2].tap();
    await p.waitForTimeout(1200);
    s = await state(p); ok('Doğru rakam ceza vermez', s.miss === (await state(p)).miss && s.vals[i2] === v2);
    const missBefore = s.miss;
    await p.click('#undoBtn'); await p.waitForTimeout(200);
    s = await state(p); ok('Geri al çalışır', s.vals[i2] === 0);
    // Ara rakamlardan geçerken ceza yok (hızlı dokunuşta 1 sn bekleme)
    ok('Ara rakamlardan geçerken ceza yok', s.miss === 0, `hata: ${s.miss}`);
    // uzun basış siler
    for (let k = 0; k < 3; k++) await cells[i2].tap();
    const box = await cells[i2].boundingBox();
    await p.mouse.move(box.x + 5, box.y + 5); await p.mouse.down(); await p.waitForTimeout(650); await p.mouse.up(); await p.waitForTimeout(500);
    s = await state(p); ok('Uzun basış siler', s.vals[i2] === 0);
    // ipucu
    await cells[empty[3]].tap(); await p.waitForTimeout(100);
    await p.click('#hintBtn'); await p.waitForTimeout(300);
    s = await state(p); ok('İpucu doğru rakamı koyar ve sabitler', s.vals[empty[3]] === s.solution[empty[3]] && s.given[empty[3]] && s.hints === 2);
    // kayıt/devam
    const before = JSON.stringify((await state(p)).vals);
    await p.reload(); await p.waitForTimeout(600);
    ok('Menüde "Devam Et" görünür', await p.isVisible('#continueBtn'));
    await p.click('#continueBtn'); await p.waitForTimeout(1500);
    const after = await p.$$eval('.cell', cs => cs.map(c => +(c.querySelector('.dg')?.alt || 0)));
    ok('Yeniden açınca tahta aynen gelir', JSON.stringify(after) === before);
    // görünüm değiştir
    await p.click('#viewBtn'); ok('Görünüm düğmesi', await p.$eval('#board', e => e.className.includes('view-number')));
    await p.click('#viewBtn');
    ok('Oynanışta hata yok', !errs.length, errs.slice(0, 3).join(' | '));
    await c.close();
  }

  // 2b) Kaybetme: 3 yanlış
  {
    const { c, p, errs } = await fresh(devices['iPhone 13']);
    await p.click('[data-diff="orta"]'); await p.waitForTimeout(1200);
    const s = await state(p); const cells = await p.$$('.cell');
    const wrongs = s.puzzle.map((v, i) => v ? -1 : i).filter(i => i >= 0).slice(0, 3);
    for (const i of wrongs) { const w = s.solution[i] === 1 ? 2 : 1; for (let k = 0; k < w; k++) await cells[i].tap(); await p.waitForTimeout(1300); }
    await p.waitForTimeout(1200);
    ok('3 hatada oyun biter', await p.$eval('#win', e => e.classList.contains('active')) && (await p.textContent('#win h2')).includes('Bozuldu'));
    await p.reload(); await p.waitForTimeout(500); ok('Bitince "Devam Et" gizli', !(await p.isVisible('#continueBtn')));
    ok('Kaybetmede hata yok', !errs.length, errs.slice(0, 3).join(' | '));
    await c.close();
  }

  // 2c) Ekran boyutları + kazanma + performans
  const sizes = [
    ['iPhone SE (375, en küçük destekli)', { viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
    ['iPhone 13', devices['iPhone 13']],
    ['iPhone 15 Pro Max', { viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }],
    ['iPad', devices['iPad (gen 7)']],
  ];
  for (const [name, dev] of sizes) {
    const { c, p, errs } = await fresh(dev);
    await p.screenshot({ path: `${OUT}/${name}-menu.png` });
    const menuFits = await p.evaluate(() => { const r = document.querySelector('.menu-buttons').getBoundingClientRect(); return r.bottom <= innerHeight && document.documentElement.scrollWidth <= innerWidth; });
    await p.click('[data-diff="zor"]'); await p.waitForTimeout(1500);
    const lay = await p.evaluate(() => {
      const q = s => document.querySelector(s).getBoundingClientRect();
      const bar = q('.bar'), fr = q('.frame'), lg = q('.legend'), tl = q('.tools'), cell = q('.cell');
      return { overflowX: document.documentElement.scrollWidth > innerWidth, toolsBottom: tl.bottom, h: innerHeight,
        overlap: bar.bottom > fr.top + 2 || fr.bottom > lg.top + 2 || lg.bottom > tl.top + 2, cell: Math.round(cell.width) };
    });
    await p.screenshot({ path: `${OUT}/${name}-oyun.png` });
    ok(`${name}: menü sığar`, menuFits);
    ok(`${name}: oyun ekranı sığar, çakışma yok`, !lay.overflowX && lay.toolsBottom <= lay.h + 1 && !lay.overlap, `kutucuk ${lay.cell}px`);
    ok(`${name}: kutucuk dokunmaya uygun (≥ 30px)`, lay.cell >= 30, `${lay.cell}px`);
    if (name === 'iPhone 13') {
      // FPS: hızlı dokunuş fırtınası sırasında
      await p.evaluate(() => { window.__f = []; let l = performance.now(); const t = n => { window.__f.push(n - l); l = n; if (window.__f.length < 240) requestAnimationFrame(t); }; requestAnimationFrame(t); });
      const s = await state(p); const cells = await p.$$('.cell');
      const em = s.puzzle.map((v, i) => v ? -1 : i).filter(i => i >= 0);
      for (let k = 0; k < 40; k++) await cells[em[(k / 10) | 0]].tap(); // 4 kutu × 10 dokunuş → hepsi boşa döner, ceza yok
      await p.waitForTimeout(1500);
      const fr = await p.evaluate(() => window.__f.slice(5));
      const slow = fr.filter(x => x > 50).length, avg = fr.reduce((a, b) => a + b, 0) / fr.length;
      ok('Akıcılık: dokunma fırtınasında ort. kare < 25 ms', avg < 25, `ort ${avg.toFixed(1)} ms, 50ms+ kare: ${slow}`);
      // Kazanma (dokunma fırtınası 3 hata yapmış olabilir → yeni oyun)
      if (await p.$eval('#win', e => e.classList.contains('active'))) await p.click('#againBtn');
      else { await p.click('#backBtn'); await p.waitForTimeout(700); await p.click('[data-diff="kolay"]'); }
      await p.waitForTimeout(1500);
      const cells2 = await p.$$('.cell'); const st = await state(p);
      for (let i = 0; i < 81; i++) if (st.vals[i] !== st.solution[i] && !st.given[i]) { await cells2[i].tap(); await p.keyboard.press(String(st.solution[i])); }
      await p.waitForTimeout(3000);
      ok('Çözünce kazanma ekranı', await p.$eval('#win', e => e.classList.contains('active')));
      await p.waitForTimeout(3500);
      await p.screenshot({ path: `${OUT}/${name}-kazanma.png` });
      // boşta CPU: parçacık döngüsü durmalı
      await p.waitForTimeout(6000);
      const lit = await p.evaluate(() => { const c = document.getElementById('fx'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; });
      ok('Kazanmadan sonra parçacıklar temizlenir (boşta çizim yok)', lit === 0, `boyalı piksel: ${lit}`);
    }
    ok(`${name}: hata yok`, !errs.length, errs.slice(0, 3).join(' | '));
    await c.close();
  }

  // 2d) Varlıklar: tüm dosyalar yükleniyor mu
  {
    const { c, p } = await fresh(devices['iPhone 13']); const bad = [];
    for (const f of ['img/bg.webp', 'img/banner.png', 'img/frame.png', 'img/btn_gold.png', 'img/btn_purple.png', 'sfx/music.mp3',
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap(n => [`img/c${n}.png`, `img/d${n}.png`, `sfx/n${n}.mp3`]),
      ...['undo', 'erase', 'hint', 'view', 'sound', 'mute', 'back', 'heart', 'star'].map(n => `img/i_${n}.png`),
      ...['clear', 'bad', 'line', 'win', 'hint'].map(n => `sfx/${n}.mp3`)]) {
      const r = await p.request.get(URL + f); if (!r.ok()) bad.push(f);
    }
    ok('Tüm görsel/ses dosyaları mevcut', !bad.length, bad.join(', '));
    await c.close();
  }
  await b.close(); srv.close();
}

(async () => {
  generatorTests();
  await browserTests();
  const pass = results.filter(r => r.pass).length;
  const md = `# Büyülü Sudoku — Test Robotu\n\n**${pass}/${results.length} geçti** · ${new Date().toISOString().slice(0, 16).replace('T', ' ')}\n\n` +
    results.map(r => `- ${r.pass ? '✅' : '❌'} ${r.name}${r.info ? ` — ${r.info}` : ''}`).join('\n') + '\n';
  fs.writeFileSync(path.join(OUT, 'ozet.md'), md);
  console.log(`\n${pass}/${results.length} geçti`);
  process.exit(pass === results.length ? 0 : 1);
})();
