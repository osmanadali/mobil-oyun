// İkon, açılış ekranı ve paylaşım görselini üretir (Playwright ile SVG/HTML → PNG).
// Kullanım: node tools/make-assets.cjs
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '..');
const BG = '#0d1020', FG = '#eef0f7';
const b64 = f => fs.readFileSync(path.join(R, f)).toString('base64');
const FONT = `data:font/woff2;base64,${b64('www/fonts/outfit-latin.woff2')}`, FONT_EXT = `data:font/woff2;base64,${b64('www/fonts/outfit-latin-ext.woff2')}`, MAP = `data:image/svg+xml;base64,${b64('www/bg.svg')}`;
const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 216 136">
  <g fill="none" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 92H62L98 56H186" stroke="#ffb35c"/><path d="M98 10V56L134 92H186" stroke="#4fc3a1"/><path d="M14 30H54L98 56" stroke="#7ea6ff"/></g>
  <rect x="85" y="43" width="26" height="26" rx="8" fill="${FG}"/><circle cx="98" cy="56" r="4.5" fill="${BG}"/>
  <g fill="${BG}" stroke="${FG}" stroke-width="5"><circle cx="14" cy="92" r="8"/><circle cx="186" cy="56" r="8"/><circle cx="98" cy="10" r="8"/><circle cx="186" cy="92" r="8"/><circle cx="14" cy="30" r="8"/></g></svg>`;
const GRAD = `background:radial-gradient(circle at 18% 12%,rgba(255,159,90,.28),transparent 45%),radial-gradient(circle at 85% 90%,rgba(109,123,255,.28),transparent 50%),linear-gradient(165deg,#161b33,${BG} 60%)`;
const page = (w, h, body, bg = GRAD) => `<!doctype html><html><head><style>
@font-face{font-family:Outfit;src:url(${FONT})}@font-face{font-family:Outfit;src:url(${FONT_EXT});unicode-range:U+0100-02AF}
*{margin:0}html,body{width:${w}px;height:${h}px;overflow:hidden}body{${bg};display:flex;align-items:center;justify-content:center;font-family:Outfit;color:${FG}}
svg{display:block}</style></head><body>${body}</body></html>`;

(async () => {
  const b = await chromium.launch(), out = [];
  async function render(file, w, h, html, transparent = false) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.setContent(html, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(R, file), omitBackground: transparent, ...(file.endsWith('.jpg') ? { type: 'jpeg', quality: 86 } : {}) });
    await p.close(); out.push(file);
  }
  const logo = pct => LOGO.replace('<svg ', `<svg style="width:${pct}%" `);
  // ikon: küçük boyutta seçilsin diye daha kalın hat ve büyük istasyon. Adaptif ikonda en uç istasyon güvenli dairenin (%61) içinde kalır.
  const ICON = LOGO.replace('stroke-width="10"', 'stroke-width="14"').replace(/ r="8"/g, ' r="10.5"').replace('stroke-width="5"', 'stroke-width="6"')
    .replace('x="85" y="43" width="26" height="26" rx="8"', 'x="82" y="40" width="32" height="32" rx="9"').replace('r="4.5"', 'r="5.5"');
  const icon = pct => ICON.replace('<svg ', `<svg style="width:${pct}%" `);
  await render('assets/icon-only.png', 1024, 1024, page(1024, 1024, icon(84)));
  await render('assets/icon-foreground.png', 1024, 1024, page(1024, 1024, icon(60), 'background:transparent'), true);
  await render('assets/icon-background.png', 1024, 1024, page(1024, 1024, '', GRAD));
  for (const f of ['splash', 'splash-dark']) await render(`assets/${f}.png`, 2732, 2732, page(2732, 2732, logo(26)));
  await render('www/og.jpg', 1200, 630, page(1200, 630, `
    <div style="position:absolute;inset:0;background:url(${MAP}) center/cover;opacity:.09"></div>
    <div style="display:flex;align-items:center;gap:56px;position:relative">
      <div style="width:400px">${logo(100)}</div>
      <div><div style="font-size:150px;font-weight:800;letter-spacing:-5px;line-height:1;background:linear-gradient(120deg,${FG} 30%,#ffb35c 75%,#ff7a8a);-webkit-background-clip:text;color:transparent">Ray</div>
      <div style="font-size:38px;color:#b9bfd6;margin-top:10px">Hatları bağla · Şehri canlandır</div>
      <div style="font-size:30px;margin-top:28px;padding:12px 26px;border-radius:99px;background:linear-gradient(120deg,#ffb35c,#ff7a8a);color:#2a1406;font-weight:700;display:inline-block">Günün Hattı'nı kaç hamlede bitirirsin?</div></div>
    </div>`));
  // favicon / manifest ikonu
  fs.writeFileSync(path.join(R, 'www/icon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#161b33"/><stop offset="1" stop-color="${BG}"/></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#g)"/><svg x="26" y="96" width="460" height="320" ${ICON.slice(ICON.indexOf('viewBox'))}</svg>`);
  await b.close();
  console.log('üretildi:', out.join(', '), '+ www/icon.svg');
})();
