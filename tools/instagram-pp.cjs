// @osmanadaliapps profil fotoğrafı seçenekleri: 1080×1080, Instagram daire kırpmasına göre (önemli her şey ortadaki dairenin içinde).
// Kullanım: node tools/instagram-pp.cjs → store/instagram/pp-{a,b,c}.png + pp-onizleme.png (daire, gerçek boylarda)
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '..'), OUT = path.join(R, 'store', 'instagram');
const b64 = f => fs.readFileSync(path.join(R, f)).toString('base64');
const FONT = `data:font/woff2;base64,${b64('www/fonts/outfit-latin.woff2')}`;
const S = 1080;

const BG = `<defs>
  <radialGradient id="bg" cx=".3" cy=".22" r="1"><stop offset="0" stop-color="#2a2d55"/><stop offset=".55" stop-color="#151a36"/><stop offset="1" stop-color="#0b0e1d"/></radialGradient>
  <radialGradient id="warm" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff9f5a" stop-opacity=".38"/><stop offset="1" stop-color="#ff9f5a" stop-opacity="0"/></radialGradient>
  <radialGradient id="cool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#6d7bff" stop-opacity=".32"/><stop offset="1" stop-color="#6d7bff" stop-opacity="0"/></radialGradient>
  <linearGradient id="acc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb35c"/><stop offset="1" stop-color="#ff7a8a"/></linearGradient>
  <linearGradient id="accH" x1="200" x2="900" y1="0" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffb35c"/><stop offset="1" stop-color="#ff7a8a"/></linearGradient>
  <filter id="gl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="22"/></filter>
  <filter id="gl2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>
</defs>
<rect width="${S}" height="${S}" fill="url(#bg)"/>
<circle cx="250" cy="200" r="620" fill="url(#warm)"/><circle cx="880" cy="900" r="620" fill="url(#cool)"/>`;

// A: "oa" yazı monogramı + istasyon noktası (en okunaklı)
const A = `<svg viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">${BG}
  <text x="540" y="650" text-anchor="middle" font-family="Outfit" font-weight="800" font-size="430" letter-spacing="-18" fill="url(#accH)" filter="url(#gl2)" opacity=".55">oa</text>
  <text x="540" y="650" text-anchor="middle" font-family="Outfit" font-weight="800" font-size="430" letter-spacing="-18" fill="url(#accH)">oa</text>
  <path d="M300 790H780" stroke="url(#accH)" stroke-width="22" stroke-linecap="round" opacity=".9"/>
  <circle cx="300" cy="790" r="30" fill="#fff6ec" stroke="#ffb35c" stroke-width="11"/><circle cx="300" cy="790" r="11" fill="#211b33"/>
  <circle cx="780" cy="790" r="30" fill="#fff6ec" stroke="#ff7a8a" stroke-width="11"/><circle cx="780" cy="790" r="11" fill="#211b33"/>
</svg>`;

// B: metro monogramı: O = istasyon halkası, A = raydan (hat halkadan çıkıp A'yı çizer)
const railA = 'M640 760V470Q640 330 760 330Q880 330 880 470V760M640 590H880';
const B = `<svg viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">${BG}
  <g filter="url(#gl)" opacity=".75">
    <circle cx="380" cy="545" r="165" fill="none" stroke="#ffb35c" stroke-width="70"/>
    <path d="M545 545H640" stroke="url(#accH)" stroke-width="70" stroke-linecap="round"/>
    <path d="${railA}" fill="none" stroke="#ff7a8a" stroke-width="70" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <circle cx="380" cy="545" r="165" fill="none" stroke="#fff3e6" stroke-width="58"/>
  <circle cx="380" cy="545" r="165" fill="none" stroke="url(#acc)" stroke-width="40"/>
  <path d="M545 545H640" stroke="url(#accH)" stroke-width="40" stroke-linecap="round"/>
  <path d="${railA}" fill="none" stroke="url(#accH)" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="640" cy="760" r="34" fill="#fff6ec" stroke="#ff9a6b" stroke-width="12"/><circle cx="640" cy="760" r="12" fill="#211b33"/>
  <circle cx="880" cy="760" r="34" fill="#fff6ec" stroke="#ff7a8a" stroke-width="12"/><circle cx="880" cy="760" r="12" fill="#211b33"/>
</svg>`;

// C: oyun karosu: Ray ikonuyla aynı aileden 2×2 karo, yanan hat + "OA"
const C = `<svg viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">${BG}
  <g transform="translate(540 470)">
    <rect x="-300" y="-300" width="290" height="290" rx="64" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.08)" stroke-width="3"/>
    <rect x="10" y="-300" width="290" height="290" rx="64" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.08)" stroke-width="3"/>
    <rect x="-300" y="10" width="290" height="290" rx="64" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.08)" stroke-width="3"/>
    <rect x="10" y="10" width="290" height="290" rx="64" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.08)" stroke-width="3"/>
    <path d="M-155 155V-155H155" stroke="url(#acc)" stroke-width="80" fill="none" stroke-linecap="round" stroke-linejoin="round" filter="url(#gl)" opacity=".8"/>
    <path d="M-155 155V-155H155" stroke="url(#acc)" stroke-width="58" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="70" y="-240" width="170" height="170" rx="44" fill="#ffb35c" filter="url(#gl2)"/>
    <rect x="75" y="-235" width="160" height="160" rx="42" fill="#ffd6a8" stroke="#ffe9cf" stroke-width="5"/>
    <circle cx="155" cy="-155" r="36" fill="#fff"/>
    <circle cx="-155" cy="155" r="62" fill="#fff6ec" stroke="#ff9a6b" stroke-width="20"/><circle cx="-155" cy="155" r="24" fill="#211b33"/>
    <path d="M155 155m-0 0" />
  </g>
  <text x="540" y="935" text-anchor="middle" font-family="Outfit" font-weight="800" font-size="120" letter-spacing="14" fill="#eef0f7">OA</text>
</svg>`;

(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: S, height: S } });
  const opts = { a: A, b: B, c: C };
  for (const [k, svg] of Object.entries(opts)) {
    await page.setContent(`<!doctype html><style>@font-face{font-family:Outfit;src:url(${FONT}) format("woff2");font-weight:100 900}body{margin:0}</style>${svg}`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(OUT, `pp-${k}.png`) });
  }
  // önizleme: her seçenek daire içinde büyük (profil sayfası) ve küçük (yorum/hikâye) boyda
  const im = k => `data:image/png;base64,${fs.readFileSync(path.join(OUT, `pp-${k}.png`)).toString('base64')}`;
  const col = k => `<div style="display:flex;flex-direction:column;align-items:center;gap:24px"><img src="${im(k)}" style="width:300px;height:300px;border-radius:50%">
    <div style="display:flex;gap:20px;align-items:center"><img src="${im(k)}" style="width:86px;border-radius:50%"><img src="${im(k)}" style="width:44px;border-radius:50%"><img src="${im(k)}" style="width:32px;border-radius:50%"></div>
    <div style="font:700 34px Outfit;color:#222">${k.toUpperCase()}</div></div>`;
  await page.setViewportSize({ width: 1140, height: 520 });
  await page.setContent(`<!doctype html><style>@font-face{font-family:Outfit;src:url(${FONT}) format("woff2");font-weight:100 900}</style><body style="margin:0;background:#fff;display:flex;justify-content:space-around;align-items:center;height:520px">${col('a')}${col('b')}${col('c')}</body>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(OUT, 'pp-onizleme.png') });
  await b.close();
  console.log('→ store/instagram/pp-*.png');
})();
