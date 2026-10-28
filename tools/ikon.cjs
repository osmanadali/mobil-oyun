// Uygulama ikonu. rIcon: "Gece Işığı" (28 Ekim 2026'dan beri) · rIconR: kullanıcının ilk "R" metro harfi (A/B testi için korunur).
// İkisi de aynı seçenekleri alır: rIcon({ bg, dots, mark, round, size }) → SVG metni.
//   bg: zemin katmanı · dots: karo dokusu · mark: işaretin ölçeği (1 = özgün kompozisyon, 0 = işaret yok) · round: köşe yarıçapı (tuval birimi)
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
function rIconR({ bg = true, dots = true, mark = 1, round = 0, size = 2000 } = {}) {
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
// ---------- "Gece Işığı": halkalı duraktan çıkan turuncu hat dik bir L çizip kare merkeze varıyor; merkez içinden yanıyor ----------
// Oyunun geometrisi: 2×2 karo, ray karo merkezinden geçer. 1024 birimlik tuval, yazısız, saydamsız (bg: false → yalnız işaret, saydam).
// Tuvalin rengi gece laciverti; ışık kaynağı merkez. Ölçek (mark) işaretin kendi merkezi etrafında, tuvalin ortasına alınarak uygulanır.
const G = { P: 350, dx: -8, dy: 8, W: 192, Ro: 124, S: 54, H: 320, Hr: 84, dot: .16,
  g1: 9, g1Op: .75, g1C: '#ffa457', g2: 42, g2Op: .18, g2C: '#ff7f62', hubGlow: 16, hubGlowOp: .75, bloomR: 520, bloomOp: .30,
  tiles: .05, litTile: .035, tileR: 620, tStroke: .10, rim: .16, bg: ['#1f285c', '#121735', '#0a0c1d'], rail: ['#ff833f', '#ffa654'], railL: .85, railLR: 620,
  gold: [['0', '#fff8ea'], ['.35', '#ffe1a6'], ['.75', '#ffc777'], ['1', '#ffb15c']], hubEdge: ['#fff1d6', 10, .9] };
function rIcon({ bg = true, dots = true, mark = 1, round = 0, size = 1024 } = {}) {
  const V = G, P = V.P, a = 512 - P / 2 + V.dx, a2 = 512 - P / 2 + V.dy, b = a + P, b2 = a2 + P;
  const W = V.W, H = V.H, hr = H / 2, sx = a, sy = b2, hx = b, hy = a2, ringR = V.Ro - V.S / 2, cr = H * V.dot;
  const railD = `M ${sx} ${sy} L ${sx} ${hy} L ${hx} ${hy}`;
  // işaretin sınır kutusu (ışımalar hariç): durak halkasının solu/altı → merkez karenin sağı/üstü
  const mx = (sx - V.Ro + hx + hr) / 2, my = (hy - hr + sy + V.Ro) / 2;
  const tf = mark === 1 ? '' : `transform="translate(512 512) scale(${mark}) translate(${-mx} ${-my})"`;
  const TS = P - 24, TR = TS * .24, tile = (cx, cy, fill, op) => `<rect x="${cx - TS / 2}" y="${cy - TS / 2}" width="${TS}" height="${TS}" rx="${TR}" fill="${fill}" fill-opacity="${op}" stroke="#ffd6a0" stroke-opacity="${V.tStroke}" stroke-width="3"/>`;
  const grid = []; for (let j = -2; j <= 3; j++) for (let i = -2; i <= 3; i++) grid.push(tile(a + i * P, a2 + j * P, '#ffffff', V.tiles));
  const lit = [[sx, sy], [sx, hy], [hx, hy]].map(([x, y]) => tile(x, y, '#ffe0b8', V.litTile)).join('');
  const full = 'maskUnits="userSpaceOnUse" x="-2048" y="-2048" width="5120" height="5120"';
  const body = mark ? `<g ${tf}>
${dots ? `<g mask="url(#tm)">${grid.join('')}${lit}</g>` : ''}
<circle cx="${hx}" cy="${hy}" r="${V.bloomR}" fill="url(#bloom)"/>
<g fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path d="${railD}" stroke="${V.g2C}" stroke-width="${W + 110}" stroke-opacity="${V.g2Op}" filter="url(#g2)"/>
  <path d="${railD}" stroke="${V.g1C}" stroke-width="${W + 24}" stroke-opacity="${V.g1Op}" filter="url(#g1)"/>
  <path d="${railD}" stroke="url(#railG)" stroke-width="${W}"/>
  <path d="${railD}" stroke="url(#railL)" stroke-width="${W}"/>
</g>
<circle cx="${sx}" cy="${sy}" r="${V.Ro + 20}" fill="#ffa24f" opacity=".32" filter="url(#gS)"/>
<circle cx="${sx}" cy="${sy}" r="${ringR}" fill="url(#holeG)" stroke="url(#ringG)" stroke-width="${V.S}" filter="url(#sh)"/>
<rect x="${hx - hr - 22}" y="${hy - hr - 22}" width="${H + 44}" height="${H + 44}" rx="${V.Hr + 20}" fill="#ffc37a" opacity="${V.hubGlowOp}" filter="url(#gH)"/>
<rect x="${hx - hr}" y="${hy - hr}" width="${H}" height="${H}" rx="${V.Hr}" fill="url(#hubG)"/>
<rect x="${hx - hr + V.hubEdge[1] / 2}" y="${hy - hr + V.hubEdge[1] / 2}" width="${H - V.hubEdge[1]}" height="${H - V.hubEdge[1]}" rx="${V.Hr - V.hubEdge[1] / 2}" fill="none" stroke="${V.hubEdge[0]}" stroke-width="${V.hubEdge[1]}" stroke-opacity="${V.hubEdge[2]}"/>
<circle cx="${hx}" cy="${hy}" r="${cr * 2}" fill="#fff8ec" opacity=".8" filter="url(#gS)"/>
<circle cx="${hx}" cy="${hy}" r="${cr}" fill="#ffffff"/>
</g>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="${size}" height="${size}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${V.bg[0]}"/><stop offset=".55" stop-color="${V.bg[1]}"/><stop offset="1" stop-color="${V.bg[2]}"/></linearGradient>
  <radialGradient id="rimG" cx="512" cy="512" r="724" gradientUnits="userSpaceOnUse"><stop offset=".55" stop-color="#8f7dff" stop-opacity="0"/><stop offset="1" stop-color="#8f7dff" stop-opacity="${V.rim}"/></radialGradient>
  <radialGradient id="bloom" cx="${hx}" cy="${hy}" r="${V.bloomR}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffc77a" stop-opacity="${V.bloomOp}"/><stop offset=".3" stop-color="#ff9a6a" stop-opacity="${V.bloomOp * .45}"/><stop offset=".65" stop-color="#ff6f8a" stop-opacity="${V.bloomOp * .12}"/><stop offset="1" stop-color="#ff6f8a" stop-opacity="0"/></radialGradient>
  <radialGradient id="tf" cx="${hx}" cy="${hy}" r="${V.tileR}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity=".12"/></radialGradient>
  <mask id="tm" ${full}><rect x="-2048" y="-2048" width="5120" height="5120" fill="url(#tf)"/></mask>
  <linearGradient id="railG" x1="${sx}" y1="${sy}" x2="${hx}" y2="${hy}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${V.rail[0]}"/><stop offset="1" stop-color="${V.rail[1]}"/></linearGradient>
  <radialGradient id="railL" cx="${hx}" cy="${hy}" r="${V.railLR}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff2d6" stop-opacity="${V.railL}"/><stop offset=".45" stop-color="#ffd59a" stop-opacity="${V.railL * .35}"/><stop offset="1" stop-color="#ffd59a" stop-opacity="0"/></radialGradient>
  <radialGradient id="hubG" cx="${hx}" cy="${hy}" r="${hr * 1.38}" gradientUnits="userSpaceOnUse">${V.gold.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</radialGradient>
  <linearGradient id="ringG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf8"/><stop offset=".6" stop-color="#fbf8f1"/><stop offset="1" stop-color="#ecdfc8"/></linearGradient>
  <radialGradient id="holeG" cx=".5" cy=".3" r=".75"><stop offset="0" stop-color="#232a52"/><stop offset="1" stop-color="#0f132a"/></radialGradient>
  <filter id="g1" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${V.g1}"/></filter>
  <filter id="g2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${V.g2}"/></filter>
  <filter id="gH" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${V.hubGlow}"/></filter>
  <filter id="gS" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
  <filter id="sh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#05060f" flood-opacity=".5"/></filter>
  ${round ? `<clipPath id="rc"><rect width="1024" height="1024" rx="${round}"/></clipPath>` : ''}
</defs>
<g ${round ? 'clip-path="url(#rc)"' : ''}>
${bg ? `<rect width="1024" height="1024" fill="url(#bg)"/><rect width="1024" height="1024" fill="url(#rimG)"/>` : ''}
${body}
</g></svg>`;
}

// Adaptif ikon (Android): ön plan, maske ne olursa olsun (daire dahil) güvenli bölgede (çap %61 → yarıçap 312/1024) kalır.
// Gece Işığı'nda işaretin kendi merkezine en uzak noktası (merkez karenin yuvarlak köşesi) ~414 birim → 312/414 ≈ 0,75; ışıma için pay: 0,70.
// PWA maskable güvenli daire yarıçapı %40 (410 birim) → 0,92. (rIconR için eski değerler: 0,62 ve 0,84.)
const ADAPTIVE = 0.70, MASKABLE = 0.92, FULL = 1;
module.exports = { rIcon, rIconR, ADAPTIVE, MASKABLE, FULL };
