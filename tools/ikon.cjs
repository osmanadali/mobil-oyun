// Uygulama ikonu: "R" metro hattı (kullanıcının tasarımı, vektöre çevrildi). 2000 birimlik tuval.
// rIcon({ bg, dots, mark, round }) → SVG metni. mark: R işaretinin ölçeği (1 = özgün kompozisyon), 0 = işaret yok.
'use strict';
const BG0 = '#171e3a', BG1 = '#11162d', BG2 = '#0c0f20';
const ORANGE = '#fead54', BLUE = '#7da2fd', GREEN = '#5ec5aa', HOLE = '#141a2c';
// işaretin sınır kutusu (özgün kompozisyonda): x 507–1751, y 250–1740 → merkez
const MC = [1129, 995];
function station(x, y) {
  return `<circle cx="${x}" cy="${y}" r="115" fill="url(#cream)"/>` +
    `<circle cx="${x}" cy="${y}" r="74" fill="#d9d0c2"/>` +
    `<circle cx="${x}" cy="${y + 3}" r="66" fill="${HOLE}"/>`;
}
function hub(x, y) {
  const w = 282, h = 278, t = [[0, -87, 25, 17], [0, 87, 25, 17], [-87, 0, 17, 25], [87, 0, 17, 25]];
  return `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="54" fill="url(#cream)"/>` +
    `<circle cx="${x}" cy="${y}" r="72" fill="#d9d0c2"/><circle cx="${x}" cy="${y + 3}" r="63" fill="${HOLE}"/>` +
    t.map(([dx, dy, tw, th]) => `<rect x="${x + dx - tw / 2}" y="${y + dy - th / 2}" width="${tw}" height="${th}" rx="5" fill="${HOLE}"/>`).join('');
}
const MARK = `<g filter="url(#sh)" fill="none" stroke-linecap="butt" stroke-linejoin="round">
  <path d="M1020 1004 L1636 1620" stroke="${GREEN}" stroke-width="107"/>
  <path d="M622 365 V1625" stroke="${BLUE}" stroke-width="110"/>
  <path d="M640 375 H1130 A314.5 314.5 0 0 1 1130 1004 H640" stroke="${ORANGE}" stroke-width="104"/>
</g>
<g filter="url(#sh2)">${station(622, 365)}${station(622, 1625)}${station(1636, 1620)}${hub(623, 996)}</g>`;
function rIcon({ bg = true, dots = true, mark = 1, round = 0, size = 2000 } = {}) {
  const k = mark, tx = 1000 - MC[0] * k, ty = 1000 - MC[1] * k;
  // özgün kompozisyon (mark = 1) olduğu gibi kalır; küçültülünce işaret tuvalin ortasına gelir
  const tf = k === 1 ? '' : `transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${k})"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 2000" width="${size}" height="${size}">
<defs>
  <radialGradient id="bgg" cx="50%" cy="36%" r="72%"><stop offset="0" stop-color="${BG0}"/><stop offset=".55" stop-color="${BG1}"/><stop offset="1" stop-color="${BG2}"/></radialGradient>
  <pattern id="dots" width="46" height="46" patternUnits="userSpaceOnUse" x="14" y="12"><circle cx="23" cy="23" r="3.4" fill="#2b3254"/></pattern>
  <radialGradient id="fade" cx="50%" cy="45%" r="62%"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <mask id="dm"><rect width="2000" height="2000" fill="url(#fade)"/></mask>
  <linearGradient id="cream" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf8f1"/><stop offset=".6" stop-color="#f1ece2"/><stop offset="1" stop-color="#ddd5c7"/></linearGradient>
  <filter id="sh" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#03050d" flood-opacity=".55"/></filter>
  <filter id="sh2" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#03050d" flood-opacity=".6"/></filter>
  ${round ? `<clipPath id="rc"><rect width="2000" height="2000" rx="${round}"/></clipPath>` : ''}
</defs>
<g ${round ? 'clip-path="url(#rc)"' : ''}>
${bg ? `<rect width="2000" height="2000" fill="url(#bgg)"/>` : ''}
${bg && dots ? `<rect width="2000" height="2000" fill="url(#dots)" mask="url(#dm)"/>` : ''}
${k ? `<g ${tf}>${MARK}</g>` : ''}
</g></svg>`;
}
// Adaptif ikon (Android): ön plan, maske ne olursa olsun (daire dahil) güvenli bölgede (çap %61) kalır.
// İşaretin merkeze en uzak noktası özgün ölçekte ~925 birim → 0,305·2000 / 925 ≈ 0,66; biraz pay için 0,62
const ADAPTIVE = 0.62, MASKABLE = 0.84, FULL = 1;
module.exports = { rIcon, ADAPTIVE, MASKABLE, FULL };
