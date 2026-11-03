// Almanca, İspanyolca, Portekizce (Brezilya), Fransızca — robot testleri (hakem.cjs K bölümü çağırır). Altyapı: docs/CEVIRI.md
// 1) sözlükler kaynakla eşit: her L() anahtarının 4 dilde çevirisi var, www/lang/*.js sözlük kaynağından üretilmiş hâliyle aynı
// 2) cihaz dili: de-AT → de, es-MX → es, pt-PT → pt-BR, fr-CA → fr, it-IT → en; Ayarlar › Dil seçicide 6 dil kendi adıyla, seçim kalıcı
// 3) her dilde 320 px: açılış (nasıl oynanır), ana sayfa, oyun, kazanma paneli, ayarlar, mağaza, görevler, renk temaları, Hatlar —
//    duraklat penceresi; Türkçe harf (ğ ı ş İ) yok, çevrilmemiş İngilizce yok (sözlükte bulunamayan L() metni + ekranda İngilizce sözcük), taşma ve
//    iki satıra bölünen düğme yok, konsol hatası yok; tarih, yüzde ve büyük harf dile göre
const path = require('path'), fs = require('fs');
const D = require(path.join(__dirname, '..', 'diller.cjs'));
const LANGS = [['de', 'de-DE'], ['es', 'es-ES'], ['pt-BR', 'pt-BR'], ['fr', 'fr-FR']];
const TR_ONLY = /\S*[ğışĞİŞ]\S*/g;   // Türkçeye özgü harfler (ç ö ü öteki dillerde de var)
// iki dilde aynı yazılan ya da özel ad olan İngilizce sözcükler: ekranda görünmesi çeviri eksiği sayılmaz
const SAME = new Set(['ray', 'metro', 'zen', 'neon', 'sakura', 'pastel', 'retro', 'google', 'admob', 'firebase', 'play', 'store', 'auto', 'english', 'video', 'videos', 'level', 'levels', 'booster', 'boosters', 'ticket', 'tickets', 'shop', 'badge', 'badges', 'tunnel', 'portal', 'express', 'terminal', 'canal', 'lava', 'cosmos', 'glacier', 'rare', 'mint', 'gold', 'demo', 'power', 'bonus', 'total', 'final', 'normal', 'start', 'stop', 'online', 'chips', 'quiz']);

module.exports = async T => {
  const { browser, URL, check, solve, waitModal, starsUpTo, shot } = T;
  const open = (b, u, o, locale) => { const nc = b.newContext; b.newContext = x => nc({ ...x, locale }); try { return T.open(b, u, o); } finally { b.newContext = nc; } };
  const errs = [];

  // ---------- 1. Sözlükler kaynakla eşit ----------
  const { keys } = D.extract(), { D: dict } = D.readDict();
  {
    const miss = {}, stale = [];
    for (const l of D.LANGS) {
      miss[l] = [...keys.keys()].filter(k => dict[l][k] == null).slice(0, 5);
      const src = fs.readFileSync(path.join(__dirname, '..', '..', 'www', 'lang', l + '.js'), 'utf8');
      const ctx = { window: {} }; new Function('window', src)(ctx.window);
      const got = ctx.window.RAY_DICT || {};
      if (Object.keys(got).length !== Object.keys(dict[l]).length || Object.entries(dict[l]).some(([k, v]) => got[k] !== v)) stale.push(l);
    }
    check('lang.dict', `Sözlükler: ${keys.size} İngilizce anahtarın de/es/pt-BR/fr çevirisi var; www/lang/*.js tools/diller/sozluk-*.txt'ten güncel üretilmiş`,
      Object.values(miss).every(m => !m.length) && !stale.length && keys.size > 500, JSON.stringify({ miss, stale }));
  }
  // dile göre İngilizce sözcük listesi: anahtarlarda geçen, o dilin hiçbir çevirisinde geçmeyen sözcükler
  const words = s => (s.replace(/<[^>]*>|\{\d+\}/g, ' ').toLowerCase().match(/[\p{L}’']{4,}/gu) || []).filter(w => /^[a-z’']+$/.test(w)).map(w => w.replace(/[’']s$/, ''));
  const EN = {};
  for (const l of D.LANGS) {
    const has = new Set(Object.values(dict[l]).flatMap(v => (v.toLowerCase().match(/\p{L}{4,}/gu) || [])));
    EN[l] = new Set([...keys.keys()].flatMap(words).filter(w => !has.has(w) && !SAME.has(w)));
  }

  // ---------- 2. Cihaz dili ve dil seçici ----------
  {
    const dev = {};
    for (const loc of ['de-AT', 'es-MX', 'pt-PT', 'pt-BR', 'fr-CA', 'it-IT', 'tr-TR']) {
      const o = await open(browser, URL, { save: { played: 3 } }, loc);
      dev[loc] = await o.page.evaluate(() => [window.RAY_LANG, document.documentElement.lang, document.querySelector('#bPlay span').textContent].join('|'));
      errs.push(...o.errors); await o.ctx.close();
    }
    const want = { 'de-AT': 'de|de|Spielen', 'es-MX': 'es|es|Jugar', 'pt-PT': 'pt-BR|pt-BR|Jogar', 'pt-BR': 'pt-BR|pt-BR|Jogar', 'fr-CA': 'fr|fr|Jouer', 'it-IT': 'en|en|Play', 'tr-TR': 'tr|tr|Oyna' };
    const { ctx, page, errors } = await open(browser, URL, { vp: [320, 568], save: { played: 3 } }, 'tr-TR');
    await page.click('#bSettings'); await page.waitForTimeout(500);
    const sel = await page.evaluate(() => {
      const bs = [...document.querySelectorAll('#oL button')], box = document.getElementById('mCard').getBoundingClientRect();
      return { names: bs.map(b => b.textContent).join(','), fit: bs.every(b => { const r = b.getBoundingClientRect(); return r.left >= box.left - 1 && r.right <= box.right + 1 && r.height < 52; }) };
    });
    await Promise.all([page.waitForNavigation(), page.click('#oL [data-g=fr]')]); await page.waitForTimeout(500);
    const fr = await page.evaluate(() => [window.RAY_LANG, document.querySelector('#bPlay span').textContent, JSON.parse(localStorage.getItem('ray')).lang].join('|'));
    await page.reload(); await page.waitForTimeout(400);
    const fr2 = await page.evaluate(() => window.RAY_LANG);
    await page.click('#bSettings'); await page.waitForTimeout(500);
    await Promise.all([page.waitForNavigation(), page.click('#oL [data-g=tr]')]); await page.waitForTimeout(500);
    const back = await page.evaluate(() => [window.RAY_LANG, document.querySelector('#bPlay span').textContent].join('|'));
    errs.push(...errors); await ctx.close();
    check('lang.device', 'Cihaz dili: de-AT → Almanca, es-MX → İspanyolca, pt-PT ve pt-BR → Portekizce (Brezilya), fr-CA → Fransızca, it-IT → İngilizce, tr-TR → Türkçe; Ayarlar › Dil: 6 dil kendi adıyla, 320 px\'te sığar; Français seçilir, kalıcı, Türkçeye dönülür',
      Object.entries(want).every(([k, v]) => dev[k] === v) && sel.names === 'Türkçe,English,Deutsch,Español,Português,Français' && sel.fit && fr === 'fr|Jouer|fr' && fr2 === 'fr' && back === 'tr|Oyna',
      JSON.stringify({ dev, sel, fr, fr2, back }));
  }

  // ---------- 3. Her dilde ekranlar (320 px) ----------
  // görünen yazı + aria-label; taşma: sayfa yatay kayıyor mu, yazılı öğe ekrandan ya da kesen atasından taşıyor mu;
  // düğme yazısı tek satır mı (.btn > span, .seg düğmesi, çip, .opt.row ana yazısı)
  const probe = (page, sel) => page.evaluate(sel => {
    const roots = sel.split(',').map(q => document.querySelector(q)).filter(Boolean), W = innerWidth;
    const text = roots.map(r => r.innerText + ' ' + [...r.querySelectorAll('[aria-label]')].map(e => e.getAttribute('aria-label')).join(' ')).join(' ').replace(/Türkçe/g, '');
    const cut = [], wrap = [];
    const lines = el => { const rg = document.createRange(); rg.selectNodeContents(el); const tops = new Set([...rg.getClientRects()].filter(r => r.width > 1).map(r => Math.round(r.top / 4))); return tops.size; };
    for (const r of roots) for (const el of r.querySelectorAll('*')) {
      if (el.closest('[lang]:not(html)') || ![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
      const b = el.getBoundingClientRect(), cs = getComputedStyle(el); if (!b.width || cs.visibility === 'hidden' || cs.opacity === '0') continue;
      const clip = cs.overflowX !== 'visible' && !/auto|scroll/.test(cs.overflowX);
      let a = el.parentElement; while (a && a !== document.body && getComputedStyle(a).overflowX === 'visible') a = a.parentElement;
      const ab = a && a !== document.body && !/auto|scroll/.test(getComputedStyle(a).overflowX) ? a.getBoundingClientRect() : null;
      if (b.right > W + 1 || b.left < -1 || (clip && el.scrollWidth > el.clientWidth + 1) || (ab && (b.right > ab.right + 1 || b.left < ab.left - 1))) cut.push(`${el.id || el.className || el.tagName}:${el.textContent.trim().slice(0, 24)}`);
      if (el.matches('.btn > span, .seg button, .chip, .qrow > span, .wp-tog span, .bst') && lines(el) > 1) wrap.push(`${el.id || el.className || el.tagName}:${el.textContent.trim().slice(0, 24)}`);
    }
    return { text, tr: (text.match(/\S*[ğışĞİŞ]\S*/g) || []).slice(0, 4), ov: document.documentElement.scrollWidth > W || document.body.scrollWidth > W, cut, wrap };
  }, sel);
  const SEEN = Object.fromEntries(Array.from({ length: 30 }, (_, c) => [c, 1]));
  const YDAY = (() => { const d = new Date(Date.now() - 864e5); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
  const SAVE = { played: 9, level: 61, stars: starsUpTo(61), streak: 2, lastDaily: YDAY, seen: SEEN, remindAsked: true, hints: 3, crowns: { 3: 1, 5: 1 } };
  const res = {};
  for (const [lang, locale] of LANGS) {
    const R = res[lang] = { scr: {} }, gap = () => page.waitForTimeout(600), sheet = '#mCard';
    // açılış: ilk kez açan oyuncu (nasıl oynanır öğreticisi kendiliğinden açılır)
    let o = await open(browser, URL, { vp: [320, 568] }, locale);
    await o.page.waitForTimeout(1600);
    R.scr.intro = await probe(o.page, '#home,#mCard'); R.lang = await o.page.evaluate(() => [window.RAY_LANG, document.documentElement.lang, document.title].join('|'));
    R.miss = await o.page.evaluate(() => [...(window.__L_MISS || [])]); errs.push(...o.errors.map(e => `${lang}: ${e}`)); await o.ctx.close();
    o = await open(browser, URL, { vp: [320, 568], save: SAVE }, locale);
    const page = o.page;
    await page.waitForTimeout(900);
    R.scr.home = await probe(page, '#home');
    await page.click('#bSettings'); await gap(); R.scr.settings = await probe(page, sheet); await shot(page, `${lang}-settings-320`);
    await page.click('#oShop'); await gap(); R.scr.shop = await probe(page, sheet); await shot(page, `${lang}-shop-320`);
    await page.click('#mClose'); await gap();
    await page.click('#bQuest'); await gap(); R.scr.quests = await probe(page, sheet); await shot(page, `${lang}-quests-320`);
    await page.click('#mClose').catch(() => {}); await gap();
    await page.click('#crownChip'); await gap(); R.scr.themes = await probe(page, sheet);
    await page.click('#mClose').catch(() => {}); await gap();
    await page.click('#bMap'); await gap(); R.scr.lines = await probe(page, '#map'); await page.click('#pBack').catch(() => {}); await gap();
    await page.click('#bPlay'); await page.waitForTimeout(800); R.scr.game = await probe(page, '#game,#toast'); await shot(page, `${lang}-game-320`);
    await page.click('#bBack'); await page.waitForTimeout(500); R.scr.pause = await probe(page, sheet); await shot(page, `${lang}-pause-320`); await page.click('#pGo'); await page.waitForTimeout(700);
    await solve(page, 10); await waitModal(page); await page.waitForTimeout(500); R.scr.win = await probe(page, '#game'); await shot(page, `${lang}-win-320`);
    R.fmt = await page.evaluate(() => ({ loc: window.RAY_LOCALE, pct: window.LP(30), up: 'i'.toLocaleUpperCase(window.RAY_LANG), date: new Date(2026, 0, 5).toLocaleDateString(window.RAY_LOCALE, { day: 'numeric', month: 'long' }), line: window.__ray.lineName(0), line30: window.__ray.lineName(30) }));
    R.miss.push(...await page.evaluate(() => [...(window.__L_MISS || [])]));
    errs.push(...o.errors.map(e => `${lang}: ${e}`)); await o.ctx.close();
  }
  const SCR = ['intro', 'home', 'settings', 'shop', 'quests', 'themes', 'lines', 'game', 'pause', 'win'];
  const bad = { tr: [], miss: [], en: [], fit: [], wrap: [] };
  for (const [lang] of LANGS) {
    const R = res[lang];
    for (const k of SCR) {
      const p = R.scr[k]; if (!p) { bad.fit.push(`${lang}/${k}: açılmadı`); continue; }
      if (p.tr.length) bad.tr.push(`${lang}/${k}: ${p.tr.join(' ')}`);
      const en = [...new Set(words(p.text).filter(w => EN[lang].has(w)))];
      if (en.length) bad.en.push(`${lang}/${k}: ${en.slice(0, 5).join(' ')}`);
      if (p.ov || p.cut.length) bad.fit.push(`${lang}/${k}: ${p.ov ? 'yatay taşma ' : ''}${p.cut.slice(0, 3).join(', ')}`);
      if (p.wrap.length) bad.wrap.push(`${lang}/${k}: ${p.wrap.slice(0, 3).join(', ')}`);
    }
    if (R.miss.length) bad.miss.push(`${lang}: ${[...new Set(R.miss)].slice(0, 4).map(s => s.slice(0, 50)).join(' | ')}`);
  }
  const lg = LANGS.map(([l]) => res[l].lang.split('|').slice(0, 2).join('/')).join(' ');
  check('lang.text', `4 dilde açılış, ana sayfa, ayarlar, mağaza, görevler, renk temaları, Hatlar, oyun, duraklat penceresi ve kazanma paneli: Türkçe harf yok, sözlükte bulunamayan metin yok, ekranda çevrilmemiş İngilizce sözcük yok (${lg})`,
    LANGS.every(([l]) => res[l].lang.startsWith(`${l}|${l}|`)) && !bad.tr.length && !bad.miss.length && !bad.en.length, [...bad.tr, ...bad.miss, ...bad.en].join(' · ').slice(0, 900) || lg);
  check('lang.fit', '4 dilde 320 px: yatay taşma, kesilen yazı ve iki satıra bölünen düğme yok', !bad.fit.length && !bad.wrap.length, [...bad.fit, ...bad.wrap].join(' · ').slice(0, 900), 'medium');
  const f = Object.fromEntries(LANGS.map(([l]) => [l, res[l].fmt]));
  check('lang.format', 'Tarih, yüzde ve hat adı dile göre: de "5. Januar" · "30 %" · "M1 · Linie Hafen", es "5 de enero" · "M1 · Línea Puerto", pt-BR "5 de janeiro" · "M1 · Linha Porto", fr "5 janvier" · "M1 · Ligne Port"; büyük harf toLocaleUpperCase(dil)',
    f.de.date === '5. Januar' && /^30\s%$/.test(f.de.pct) && f.de.line === 'M1 · Linie Hafen' && f.es.date === '5 de enero' && f.es.line === 'M1 · Línea Puerto' && f['pt-BR'].date === '5 de janeiro' && f['pt-BR'].pct === '30%' && f['pt-BR'].line === 'M1 · Linha Porto' && f.fr.date === '5 janvier' && /^30\s%$/.test(f.fr.pct) && f.fr.line === 'M1 · Ligne Port' && LANGS.every(([l]) => f[l].up === 'I'),
    JSON.stringify(f));
  // ---------- 4. Kural kartları: her dilde 320×568'de tanıtım kartı sığar (başlık tek satır, kaydırma yok, düğme ekranda) ----------
  {
    let o = await open(browser, URL, { save: { played: 1 } }, 'de-DE');
    const rules = await o.page.evaluate(() => [...['pairs', 'rev', 'fog', 'cnt', 'two'].map(k => ({ key: k, line: window.__ray.RULE_LINE[k] })), ...window.__ray.MODS.map(m => ({ key: m.key, line: m.line }))].map(q => ({ ...q, lvl: window.__ray.lineStart(q.line) })));
    await o.ctx.close();
    const badR = []; let n = 0;
    for (const [lang, locale] of LANGS) for (const q of rules) {
      const { ctx, page, errors } = await open(browser, URL, { vp: [320, 568], save: { played: q.lvl - 1, level: q.lvl, stars: starsUpTo(q.lvl), seen: { ...SEEN, [q.line]: 0 }, remindAsked: true } }, locale);
      await page.click('#bPlay'); await page.waitForTimeout(1100);
      const c = await page.evaluate(() => {
        const sh = document.querySelector('#modal.open .sheet'); if (!sh) return { open: false };
        const box = sh.getBoundingClientRect(), wide = [...sh.querySelectorAll('*')].filter(e => { const b = e.getBoundingClientRect(); return b.width && (b.left < box.left - 1 || b.right > box.right + 1); }).map(e => e.tagName + '.' + e.className);
        const h2 = sh.querySelector('h2'), lh = parseFloat(getComputedStyle(h2).lineHeight) || parseFloat(getComputedStyle(h2).fontSize) * 1.3, go = document.getElementById('mGo').getBoundingClientRect();
        return { open: true, tr: (sh.innerText.match(/\S*[ğışĞİŞ]\S*/g) || []).slice(0, 3), h2: h2.textContent, lines: Math.round(h2.getBoundingClientRect().height / lh), scrollY: sh.scrollHeight - sh.clientHeight, wide, go: go.bottom <= innerHeight + 1 && go.top >= 0, page: document.documentElement.scrollWidth - innerWidth, miss: [...(window.__L_MISS || [])] };
      });
      n++;
      if (!(c.open && !c.tr.length && c.lines <= 1 && c.scrollY <= 1 && !c.wide.length && c.go && c.page <= 0 && !c.miss.length && !errors.length)) badR.push({ lang, key: q.key, ...c, errors });
      errs.push(...errors.map(e => `${lang}: ${e}`)); await ctx.close();
    }
    check('lang.rules', `4 dilde ${rules.length} kuralın tanıtım kartı 320×568'de sığar: başlık tek satır, kaydırma yok, düğme ekranda, Türkçe harf ve çevrilmemiş metin yok`, n === rules.length * 4 && !badR.length, JSON.stringify(badR.slice(0, 4)).slice(0, 900), 'medium');
  }
  check('lang.errors', '4 dil testlerinde konsol/sayfa hatası yok', !errs.length, errs.slice(0, 3).join(' | '), 'medium');
};
