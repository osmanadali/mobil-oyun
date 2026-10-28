// Kural eklentilerinin İngilizcesi — robot testleri (hakem.cjs K bölümü çağırır). Altyapı ve sözlük: docs/CEVIRI.md
// 1) kaynak taraması: Türkçe harfli her dizgi L(tr, en)'in ilk argümanı, İngilizcesi Türkçe harfsiz;
//    en-US bağlamında kartlar (ad, etiket, metin) ve block() mesajları İngilizce.
// 2) her kuralın tanıtım bölümünde kural kartı 320 ve 360 px'te taşmıyor (en-US).
// 3) tr-TR ve en-US bağlamlarında kurallı bölümlerin tahtaları (çözüm + başlangıç) aynı: L() rastgele sayı tüketmez.
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..', '..', 'www', 'rules');
const TRCH = /[ğüşıöçĞÜŞİÖÇ]/;
const SEEN = Object.fromEntries(Array.from({ length: 30 }, (_, k) => [k + 2, 1]));   // bütün kural kartları görülmüş

// JS kaynağında yorumları atlayıp dizgileri ('…', "…", `…`) konumlarıyla çıkarır; şablon içi ${…} ham kalır (kaba ama bu dosyalara yeter)
function strings(src) {
  const out = []; let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); if (i < 0) break; continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i) + 2; continue; }
    if (c === "'" || c === '"' || c === '`') {
      let j = i + 1, depth = 0;
      while (j < src.length) {
        if (src[j] === '\\') { j += 2; continue; }
        if (c === '`' && src[j] === '$' && src[j + 1] === '{') { depth++; j += 2; continue; }
        if (c === '`' && depth && src[j] === '}') { depth--; j++; continue; }
        if (src[j] === c && !depth) break;
        j++;
      }
      out.push({ at: i, end: j + 1, v: src.slice(i + 1, j) }); i = j + 1; continue;
    }
    i++;
  }
  return out;
}
function scan() {
  const bad = [], files = {};
  for (const f of fs.readdirSync(DIR).filter(f => f.endsWith('.js')).sort()) {
    const src = fs.readFileSync(path.join(DIR, f), 'utf8'), S = strings(src), byAt = new Map(S.map(s => [s.at, s]));
    const first = new Set(); let calls = 0;
    // L( çağrıları: ilk argüman Türkçe dizgi, ardından İngilizce; İngilizcede Türkçe harf yok
    const re = /\bL\(\s*/g; let m;
    while ((m = re.exec(src))) {
      if (S.some(s => s.at < m.index && m.index < s.end)) continue;   // dizginin içindeki "L(" sayılmaz
      const a = byAt.get(m.index + m[0].length); if (!a) continue;
      // ikinci argüman: kapanan paranteze kadar bütün dizgiler (düz dizgi ya da tekil/çoğul üçlüsü)
      let j = a.end, d = 0; const B = [];
      for (; j < src.length; j++) { const t = byAt.get(j); if (t) { B.push(t); j = t.end - 1; continue; } if (src[j] === '(') d++; else if (src[j] === ')' && !d--) break; }
      if (!B.length) { bad.push(`${f}: L() ikinci argüman yok @${a.at}`); continue; }
      calls++; first.add(a.at); for (const t of B) first.add(t.at);
      const b = { v: B.map(t => t.v).join(' ') };
      if (B.some(t => TRCH.test(t.v.replace(/\$\{[^}]*\}/g, '')))) bad.push(`${f}: İngilizcede Türkçe harf: ${b.v.slice(0, 60)}`);
      if (a.v === b.v) bad.push(`${f}: çevrilmemiş: ${a.v.slice(0, 60)}`);
    }
    for (const s of S) if (TRCH.test(s.v) && !first.has(s.at) && !S.some(t => first.has(t.at) && t.at < s.at && s.end <= t.end)) bad.push(`${f}: L() dışında Türkçe dizgi: ${s.v.slice(0, 60)}`);
    files[f] = calls;
  }
  return { bad, files };
}

module.exports = async T => {
  const { browser, URL, check, starsUpTo } = T;
  // open() bağlamı hakem.cjs'teki sarmalayıcıyla tr-TR açar; burada newContext çağrısı (open'ın ilk, eşzamanlı adımı) locale ile sarılır
  const open = (b, u, o, locale = 'en-US') => { const nc = b.newContext; b.newContext = x => nc({ ...x, locale }); try { return T.open(b, u, o); } finally { b.newContext = nc; } };
  const errs = [];

  // ---------- 1. Kaynak taraması + en-US'de kart ve block metinleri ----------
  {
    const s = scan();
    const none = Object.entries(s.files).filter(([, n]) => n < 3).map(([f]) => f);
    check('i18n.rules.src', `Kural eklentileri: Türkçe harfli her dizgi L(tr, en) içinde, İngilizcesi Türkçe harfsiz (${Object.keys(s.files).length} dosya, ${Object.values(s.files).reduce((a, b) => a + b, 0)} çeviri)`,
      !s.bad.length && !none.length && Object.keys(s.files).length >= 12, JSON.stringify({ bad: s.bad.slice(0, 8), none }));

    const { ctx, page, errors } = await open(browser, URL, { save: { played: 1 } });
    const r = await page.evaluate(() => {
      const R = window.__ray, strip = h => { const d = document.createElement('div'); d.innerHTML = h; return d.textContent; };
      const cards = R.MODS.map(m => ({ key: m.key, name: m.card?.name, tag: m.card?.tag, text: strip(m.card?.text || '') }));
      const on = [1], B = { cover: { cover: on }, bridge: { split: on }, closed: { closedShown: on } };
      const blocks = R.MODS.filter(m => typeof m.block === 'function' && B[m.key]).map(m => ({ key: m.key, msg: m.block(B[m.key], 0) }));
      return { lang: window.RAY_LANG, html: document.documentElement.lang, cards, blocks };
    });
    const tr = /[ğüşıöçĞÜŞİÖÇ]/;
    const badCard = r.cards.filter(c => !c.name || !c.text || tr.test(c.name + c.tag + c.text) || !/^New: [a-z]/.test(c.tag || '') || c.tag.slice(5) !== c.name.toLowerCase());
    const badBlock = r.blocks.filter(b => typeof b.msg !== 'string' || tr.test(b.msg));
    check('i18n.rules.card', `en-US: ${r.cards.length} kural kartı (ad, "New: …" etiketi, metin) ve ${r.blocks.length} block() mesajı İngilizce, Türkçe harf yok`,
      r.lang === 'en' && r.html === 'en' && r.cards.length >= 12 && r.blocks.length === 3 && !badCard.length && !badBlock.length && !errors.length,
      JSON.stringify({ lang: r.lang, badCard, badBlock, errors, names: r.cards.map(c => c.name) }));
    errs.push(...errors); await ctx.close();
  }

  // ---------- 2. Tanıtım bölümünde kural kartı 320 ve 360 px'te taşmıyor (en-US) ----------
  {
    const { ctx, page } = await open(browser, URL, { save: { played: 1 } });
    const rules = await page.evaluate(() => window.__ray.MODS.map(m => ({ key: m.key, line: m.line, lvl: window.__ray.lineStart(m.line) })));
    await ctx.close();
    const bad = [], seen = [];
    for (const vp of [[320, 568], [360, 640]]) for (const q of rules) {
      const { ctx, page, errors } = await open(browser, URL, { vp, save: { played: q.lvl - 1, level: q.lvl, stars: starsUpTo(q.lvl), seen: { ...SEEN, [q.line]: 0 }, remindAsked: true } });
      await page.click('#bPlay'); await page.waitForTimeout(1100);
      const c = await page.evaluate(() => {
        const sh = document.querySelector('#modal.open .sheet'); if (!sh) return { open: false };
        const box = sh.getBoundingClientRect(), wide = [...sh.querySelectorAll('*')].filter(e => { const b = e.getBoundingClientRect(); return b.width && (b.left < box.left - 1 || b.right > box.right + 1); }).map(e => e.tagName + '.' + e.className);
        const h2 = sh.querySelector('h2'), lh = parseFloat(getComputedStyle(h2).lineHeight) || parseFloat(getComputedStyle(h2).fontSize) * 1.3, go = document.getElementById('mGo').getBoundingClientRect();
        return { open: true, h2: h2.textContent, lines: Math.round(h2.getBoundingClientRect().height / lh), scrollY: sh.scrollHeight - sh.clientHeight, scrollX: sh.scrollWidth - sh.clientWidth, wide, go: go.bottom <= innerHeight + 1 && go.top >= 0, page: document.documentElement.scrollWidth - innerWidth };
      });
      const ok = c.open && c.lines <= 1 && c.scrollY <= 1 && c.scrollX <= 0 && !c.wide.length && c.go && c.page <= 0 && !errors.length;
      seen.push(`${vp[0]}:${q.key}`);
      if (!ok) bad.push({ vp: vp[0], key: q.key, ...c, errors });
      errs.push(...errors); await ctx.close();
    }
    check('i18n.rules.fit', `en-US: ${rules.length} kuralın tanıtım kartı 320×568 ve 360×640'ta taşmıyor (başlık tek satır, kaydırma yok, "Anladım" ekranda)`, seen.length === rules.length * 2 && !bad.length, JSON.stringify(bad.slice(0, 4)));
  }

  // ---------- 3. tr-TR ve en-US: kurallı bölümlerin tahtaları aynı ----------
  {
    const boards = async loc => {
      const { ctx, page, errors } = await open(browser, URL, { save: { played: 1 } }, loc);
      const r = await page.evaluate(() => {
        const R = window.__ray, H = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0).toString(36); };
        const lv = []; for (const m of R.MODS) { const a = R.lineStart(m.line); for (let k = 0; k < 5; k++) lv.push(a + k * 7); }
        for (let l = 1000; l < 1040; l += 3) lv.push(l);
        const out = {}; for (const l of lv) { const P = R.puzzleFor(l); out[l] = H(JSON.stringify([P.sol, P.cur, P.rules])); }
        return { lang: window.RAY_LANG, out };
      });
      errs.push(...errors); await ctx.close(); return r;
    };
    const a = await boards('tr-TR'), b = await boards('en-US');
    const ks = Object.keys(a.out), diff = ks.filter(k => a.out[k] !== b.out[k]);
    check('i18n.rules.same', `tr ve en tahtaları aynı: ${ks.length} kurallı bölümde (her kuralın hattından 5, karma 13) çözüm + başlangıç bit bit eşit`, a.lang === 'tr' && b.lang === 'en' && ks.length >= 70 && !diff.length, JSON.stringify({ langs: [a.lang, b.lang], n: ks.length, diff: diff.slice(0, 8) }));
  }

  check('i18n.rules.errors', 'İngilizce kural testlerinde konsol/sayfa hatası yok', !errs.length, errs.slice(0, 3).join(' | '), 'medium');
};
