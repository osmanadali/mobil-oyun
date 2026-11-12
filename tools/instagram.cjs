// Instagram ızgara seti: 6 post (2 sıra × 3) ızgarada tek bir büyük görsel olur, tek tek açılınca da her biri kendi mesajını taşır.
// Tek bir yanan metro hattı altı postun içinden kesintisiz geçer (üst sıra → 3. posttan aşağı → alt sıra sola, renk değiştirerek).
// Dikişler karo aralarına denk gelir (karo adımı 180 px: 1080 = 6 karo, 1440 = 8 karo), hiçbir karo ikiye bölünmez.
// Boyut: her post 1080×1440 (3:4, Instagram ızgarasının gösterdiği oran → ızgarada kırpılmaz).
// Kullanım: node tools/instagram.cjs   → store/instagram/{1..6-*.png, tam.png, izgara-onizleme.png}
// Numara = ızgaradaki yer (1 sol üst … 6 sağ alt). Paylaşım sırası tersten: 6, 5, 4, 3, 2, 1 (Instagram en yeniyi sol üste koyar).
// CJK yazılar (dil listesi) tools/fonts/noto-*.woff2 içindeki küçük alt kümelerle çizilir (Noto Sans JP/KR/TC, SIL OFL; yalnız gereken harfler).
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const R = path.join(__dirname, '..'), OUT = path.join(R, 'store', 'instagram');
const b64 = f => fs.readFileSync(path.join(R, f)).toString('base64');
const FONT = `data:font/woff2;base64,${b64('www/fonts/outfit-latin.woff2')}`, FONT_EXT = `data:font/woff2;base64,${b64('www/fonts/outfit-latin-ext.woff2')}`;
const MAP = `data:image/svg+xml;base64,${b64('www/bg.svg')}`, SHOT = `data:image/png;base64,${b64('store/screens/play/01-oyun.png')}`;
const ICON = `data:image/png;base64,${b64('store/appstore-icon-1024.png')}`;
const CJK = fs.readdirSync(path.join(__dirname, 'fonts')).filter(f => /^noto-.*\.woff2$/.test(f)).sort();
const CJKFACES = CJK.map((f, i) => `@font-face{font-family:C${i};src:url(data:font/woff2;base64,${fs.readFileSync(path.join(__dirname, 'fonts', f)).toString('base64')}) format("woff2");font-weight:100 900}`).join('');
const CJKFAM = CJK.map((_, i) => 'C' + i).join(',');

const PW = 1080, PH = 1440, N = 3, W = PW * N, H = PH * 2, P = 180;   // post boyu, tuval (3 × 2 post), karo adımı
const cx = c => P / 2 + c * P, cy = r => P / 2 + r * P;

// ---------- hat: karo merkezlerinden geçen dik açılı yol (sütun, satır) ----------
// A: merkez (1,6) → (3,6) köşe → yukarı → sağa, dikişlerden geçer, telefonun arkasından → (15,5)
// B: 3. postta aşağı, sıra dikişinden geçip 6. posta → (15,13)
// C: alt sıra boyunca sola, tema renklerine dönerek → son durak (1,13) 4. postta
const A = [[1, 6], [3, 6], [3, 5], [15, 5]], B = [[15, 5], [15, 13]], C = [[15, 13], [1, 13]];
const ROUTE = [...A, ...B.slice(1), ...C.slice(1)];
const BANDS = [5, 6, 13, 14];   // oyun tahtası şeritleri (satırlar)
const STOPS = [[9, 5, 'o'], [13, 5, 'o'], [15, 7, 'p'], [13, 13, 'p'], [8, 13, 'v']];   // ara duraklar
const TAP = [3, 6];             // "dokun" vurgusu: köşe karo

// hat üzerindeki karolar
const lit = new Set();
for (let i = 0; i < ROUTE.length - 1; i++) {
  let [c, r] = ROUTE[i]; const [c2, r2] = ROUTE[i + 1], dc = Math.sign(c2 - c), dr = Math.sign(r2 - r);
  lit.add(c + ',' + r); while (c !== c2 || r !== r2) { c += dc; r += dr; lit.add(c + ',' + r); }
}

// sönük karolar: tohumlu rastgele parçalar (düz, köşe, T, uç)
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const PIECES = [5, 3, 7, 1], rot = m => ((m << 1) | (m >> 3)) & 15;
function pieceD(x, y, m, half) {   // bit: 1 yukarı, 2 sağ, 4 aşağı, 8 sol
  const d = [];
  if (m & 1) d.push(`M${x} ${y}V${y - half}`); if (m & 2) d.push(`M${x} ${y}H${x + half}`);
  if (m & 4) d.push(`M${x} ${y}V${y + half}`); if (m & 8) d.push(`M${x} ${y}H${x - half}`);
  return d.join('');
}
const pathD = pts => 'M' + pts.map(([c, r]) => `${cx(c)} ${cy(r)}`).join('L');

function board() {
  let tiles = '', dim = '', dimEnds = '';
  const T = 156, rr = 34;
  const cells = new Set([...lit]); for (const r of BANDS) for (let c = 0; c < W / P; c++) cells.add(c + ',' + r);
  for (const k of cells) {
    const [c, r] = k.split(',').map(Number), x = cx(c), y = cy(r), on = lit.has(k);
    tiles += `<rect x="${x - T / 2}" y="${y - T / 2}" width="${T}" height="${T}" rx="${rr}" class="${on ? 'tile on' : 'tile'}"/>`;
    if (on) continue;
    let m = PIECES[Math.floor(rnd() * 4)]; for (let q = Math.floor(rnd() * 4); q--;) m = rot(m);
    dim += `<path d="${pieceD(x, y, m, 62)}"/>`;
    if (m === 1 || m === 2 || m === 4 || m === 8) dimEnds += `<circle cx="${x}" cy="${y}" r="21"/>`;
  }
  const seg = (pts, g) => `<path d="${pathD(pts)}" class="railglow" stroke="url(#${g})" filter="url(#glow)"/>`;
  const segs = [[A, 'gA'], [B, 'gB'], [C, 'gC']];
  const glow = segs.map(([p, g]) => seg(p, g)).join('');
  const rail = segs.map(([p, g]) => `<path d="${pathD(p)}" class="rail" stroke="url(#${g})"/>`).join('');
  const core = `<path d="${pathD(ROUTE)}" class="railcore"/>`;
  const stops = STOPS.map(([c, r, k]) => `<g class="stop ${k}"><circle cx="${cx(c)}" cy="${cy(r)}" r="30"/><circle cx="${cx(c)}" cy="${cy(r)}" r="13" class="hole"/></g>`).join('');
  const [hc, hr] = ROUTE[0], [ec, er] = ROUTE[ROUTE.length - 1];
  const [tc, tr] = TAP, tx = cx(tc), ty = cy(tr), ar = 118;
  const a0 = -150 * Math.PI / 180, a1 = -30 * Math.PI / 180;
  const p0 = [tx + ar * Math.cos(a0), ty + ar * Math.sin(a0)], p1 = [tx + ar * Math.cos(a1), ty + ar * Math.sin(a1)];
  return `
  <svg class="board" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="gA" x1="0" x2="${PW * 2.8}" y1="0" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffb35c"/><stop offset="1" stop-color="#ff7a8a"/></linearGradient>
      <linearGradient id="gB" x1="0" x2="0" y1="${cy(5)}" y2="${cy(13)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ff7a8a"/><stop offset="1" stop-color="#ff6fae"/></linearGradient>
      <linearGradient id="gC" x1="${cx(15)}" x2="${cx(1)}" y1="0" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#ff6fae"/><stop offset=".38" stop-color="#b98cff"/><stop offset=".62" stop-color="#7aa2ff"/><stop offset="1" stop-color="#5ce1e6"/>
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="16"/></filter>
      <filter id="glow2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>
    </defs>
    <g class="tiles">${tiles}</g>
    <g class="dim">${dim}</g><g class="dimEnd">${dimEnds}</g>
    <rect x="${tx - 78}" y="${ty - 78}" width="156" height="156" rx="34" class="tapring"/>
    <rect x="${tx - 92}" y="${ty - 92}" width="184" height="184" rx="44" class="tapring2"/>
    ${glow}${rail}${core}${stops}
    <g>
      <rect x="${cx(hc) - 66}" y="${cy(hr) - 66}" width="132" height="132" rx="34" filter="url(#glow2)" class="hubglow"/>
      <rect x="${cx(hc) - 62}" y="${cy(hr) - 62}" width="124" height="124" rx="32" class="hubbox"/>
      <circle cx="${cx(hc)}" cy="${cy(hr)}" r="26" class="hubdot"/>
    </g>
    <g>
      <circle cx="${cx(ec)}" cy="${cy(er)}" r="72" filter="url(#glow2)" class="endglow"/>
      <circle cx="${cx(ec)}" cy="${cy(er)}" r="46" class="endring"/>
      <circle cx="${cx(ec)}" cy="${cy(er)}" r="20" class="hole"/>
    </g>
    <g class="arrow" transform="rotate(-90 ${tx} ${ty})">
      <path d="M${p0[0]} ${p0[1]}A${ar} ${ar} 0 0 1 ${p1[0]} ${p1[1]}"/>
      <path d="M${p1[0] - 30} ${p1[1] - 16}L${p1[0]} ${p1[1]}L${p1[0] - 6} ${p1[1] - 34}"/>
    </g>
  </svg>`;
}

// ---------- 4. post: tema kartları (renkler www/game.js SKINS listesinden) ----------
const THEMES = [
  ['Gün Batımı', '#ffb36b', '#ff7f6b'], ['Okyanus', '#5ce1e6', '#4fa3ff'], ['Orman', '#7bd88f', '#3fb68b'], ['Sakura', '#ffb7c5', '#f48fb1'],
  ['Neon Gece', '#ff3ddc', '#22e6ff'], ['Kuzey Işıkları', '#6ef3c5', '#7aa2ff'], ['Lav', '#ff7b3a', '#e63946'], ['Altın', '#ffd36b', '#e9a23a'],
];
const themeCards = THEMES.map(([n, a, b], i) => `
  <div class="tcard"><svg viewBox="0 0 200 74"><defs><linearGradient id="t${i}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <path d="M22 54H86V20H178" stroke="url(#t${i})" stroke-width="13" fill="none" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 7px ${a})"/>
    <circle cx="22" cy="54" r="10" fill="#fff" stroke="${a}" stroke-width="5"/><circle cx="178" cy="20" r="10" fill="#fff" stroke="${b}" stroke-width="5"/></svg><b>${n}</b></div>`).join('');

// ---------- 5. post: dil listesi (oyunun kendi çevirileri: www/lang/*.js "Connect the lines") ----------
const LANGS = [['TR', 'Hatları bağla'], ['EN', 'Connect the lines'], ['DE', 'Verbinde die Linien'], ['ES', 'Conecta las líneas'], ['FR', 'Relie les lignes'],
  ['PT', 'Ligue as linhas'], ['日本語', '路線をつなぎ'], ['한국어', '노선을 잇고'], ['繁體中文', '連起路線']];
const LCOL = ['#ffb35c', '#ff9a6b', '#ff7a8a', '#ff6fae', '#e07ad6', '#b98cff', '#9a8cff', '#7aa2ff', '#5ce1e6'];
const langList = LANGS.map(([c, t], i) => `<div class="lg"><i style="background:${LCOL[i]};box-shadow:0 0 14px ${LCOL[i]}"></i><span class="code">${c}</span><span class="tx">${t}</span></div>`).join('');

const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>
@font-face{font-family:Outfit;src:url(${FONT}) format("woff2");font-weight:100 900}
@font-face{font-family:Outfit;src:url(${FONT_EXT}) format("woff2");font-weight:100 900;unicode-range:U+0100-02AF}
${CJKFACES}
*{margin:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden}
body{position:relative;font-family:Outfit,${CJKFAM},"Noto Color Emoji",sans-serif;color:#eef0f7;background:linear-gradient(172deg,#1a2040 0%,#121732 40%,#0d1124 70%,#151a38 100%)}
.map{position:absolute;inset:0;background:url(${MAP}) 0 0/${W * .5}px auto repeat;opacity:.06}
.glow{position:absolute;border-radius:50%;filter:blur(40px)}
.g1{width:1500px;height:1500px;left:-600px;top:-700px;background:radial-gradient(circle,rgba(255,159,90,.42),rgba(255,159,90,0) 62%)}
.g2{width:1500px;height:1200px;left:${W / 2 - 750}px;top:${PH - 600}px;background:radial-gradient(circle,rgba(109,123,255,.30),rgba(109,123,255,0) 62%)}
.g3{width:1500px;height:1500px;left:${W - 900}px;top:-650px;background:radial-gradient(circle,rgba(255,111,145,.32),rgba(255,111,145,0) 62%)}
.g4{width:900px;height:900px;left:${PW * 1.5 - 450}px;top:150px;background:radial-gradient(circle,rgba(255,170,100,.16),rgba(255,170,100,0) 65%)}
.g5{width:1400px;height:1400px;left:-500px;top:${H - 1100}px;background:radial-gradient(circle,rgba(70,200,220,.26),rgba(70,200,220,0) 62%)}
.g6{width:1300px;height:1300px;left:${PW * 1.5 - 650}px;top:${PH + 100}px;background:radial-gradient(circle,rgba(170,120,255,.22),rgba(170,120,255,0) 62%)}
.g7{width:1300px;height:1300px;left:${W - 800}px;top:${H - 1000}px;background:radial-gradient(circle,rgba(255,111,174,.24),rgba(255,111,174,0) 62%)}
.board{position:absolute;inset:0}
.tile{fill:rgba(255,255,255,.04);stroke:rgba(255,255,255,.06);stroke-width:2}
.tile.on{fill:rgba(255,190,150,.08);stroke:rgba(255,210,170,.13)}
.dim path{stroke:#4b5274;stroke-width:30;stroke-linecap:round;fill:none}
.dimEnd circle{fill:#121732;stroke:#4b5274;stroke-width:12}
.railglow{stroke-width:64;fill:none;stroke-linejoin:round;stroke-linecap:round;opacity:.7}
.rail{stroke-width:36;fill:none;stroke-linejoin:round;stroke-linecap:round}
.railcore{stroke:rgba(255,245,235,.5);stroke-width:8;fill:none;stroke-linejoin:round;stroke-linecap:round}
.stop circle{fill:#fff6ec;stroke-width:8}.stop.o circle{stroke:#ffa070}.stop.p circle{stroke:#ff6fae}.stop.v circle{stroke:#a596ff}
.hole{fill:#211b33;stroke:none!important}
.hubglow{fill:#ffb35c;opacity:.9}.hubbox{fill:#ffd6a8;stroke:#ffe9cf;stroke-width:4}.hubdot{fill:#fff}
.endglow{fill:#5ce1e6;opacity:.85}.endring{fill:#f0fdff;stroke:#5ce1e6;stroke-width:10}
.tapring{fill:none;stroke:rgba(255,255,255,.55);stroke-width:5}.tapring2{fill:none;stroke:rgba(255,255,255,.22);stroke-width:4}
.arrow path{fill:none;stroke:#fff;stroke-width:12;stroke-linecap:round;stroke-linejoin:round}

.post{position:absolute;width:${PW}px;height:${PH}px}
.p1,.p4{left:0}.p2,.p5{left:${PW}px}.p3,.p6{left:${PW * 2}px}.p1,.p2,.p3{top:0}.p4,.p5,.p6{top:${PH}px}
.k{position:absolute;left:96px;top:150px;font-size:30px;font-weight:700;letter-spacing:7px;color:#a3aac4;text-transform:uppercase}
.k i{display:inline-block;width:14px;height:14px;border-radius:50%;background:var(--c,#ffb35c);margin-right:16px;vertical-align:3px;box-shadow:0 0 18px var(--c,#ffb35c)}
.h{position:absolute;left:90px;top:220px;font-weight:800;line-height:.95;letter-spacing:-4px;font-size:200px}
.grad{background:linear-gradient(90deg,var(--a,#ffb35c),var(--b,#ff7a8a));-webkit-background-clip:text;background-clip:text;color:transparent;padding-right:8px}
.sub{position:absolute;left:96px;font-size:44px;font-weight:500;color:#b9bfd6;line-height:1.3}
.sub b{color:#fff;font-weight:700}
.foot{position:absolute;left:96px;top:1300px;font-size:36px;color:#9aa1bb;font-weight:600}
.foot b{color:#e6e9f5}
.chips{position:absolute;left:96px;display:flex;flex-wrap:wrap;gap:20px}
.chip{font-size:38px;font-weight:600;padding:16px 32px;border-radius:99px;background:rgba(40,46,82,.62);border:2px solid rgba(255,255,255,.1);color:#e6e9f5}

/* 1 */
.p1 .sub{top:660px}
.deg{position:absolute;left:${cx(3) + 112}px;top:${cy(6) - 170}px;font-size:46px;font-weight:800;color:#fff;background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.18);padding:4px 20px;border-radius:99px}

/* 2 */
.brand{position:absolute;left:0;right:0;top:120px;display:flex;align-items:center;justify-content:center;gap:34px}
.brand img{width:150px;height:150px;border-radius:36px;box-shadow:0 18px 50px rgba(0,0,0,.45),0 0 60px rgba(255,150,90,.25)}
.brand .h{position:static;font-size:190px;letter-spacing:-6px;line-height:1}
.p2 .tag{position:absolute;left:0;right:0;top:330px;text-align:center;font-size:42px;font-weight:600;color:#c9cee2}
.phone{position:absolute;left:${(PW - 500) / 2}px;top:425px;width:500px;height:${Math.round(500 * 1473 / 777)}px;border-radius:${Math.round(118 * 500 / 777)}px;overflow:hidden;
  box-shadow:0 40px 90px rgba(0,0,0,.6),0 0 0 2px rgba(255,255,255,.08),0 0 120px rgba(255,140,100,.22)}
.phone img{position:absolute;left:${-152 * 500 / 777}px;top:${-374 * 500 / 777}px;width:${1080 * 500 / 777}px}

/* 3 */
.p3 .h{font-size:118px;letter-spacing:-3px}
.p3 .chips{top:600px;width:900px}

/* 4 */
.p4{--c:#5ce1e6;--a:#5ce1e6;--b:#7aa2ff}
.p4 .sub{top:430px}
.tgrid{position:absolute;left:96px;top:560px;display:grid;grid-template-columns:repeat(4,206px);gap:18px}
.tcard{height:142px;border-radius:26px;background:rgba(40,46,82,.62);border:2px solid rgba(255,255,255,.09);padding:16px 14px 0;display:flex;flex-direction:column;align-items:center;gap:6px}
.tcard svg{width:170px;height:63px}
.tcard b{font-size:25px;font-weight:600;color:#dfe3f2;white-space:nowrap}

/* 5 */
.p5{--c:#b98cff;--a:#ff8fb8;--b:#9a8cff}
.p5 .h{font-size:180px}
.langs{position:absolute;left:96px;top:420px;display:grid;grid-template-columns:1fr 1fr;column-gap:30px;row-gap:14px;width:900px}
.lg{display:flex;align-items:center;gap:14px;height:76px;padding:0 20px;border-radius:22px;background:rgba(40,46,82,.55);border:2px solid rgba(255,255,255,.07)}
.lg i{flex:none;width:16px;height:16px;border-radius:50%}
.lg .code{flex:none;font-size:22px;font-weight:800;letter-spacing:1px;color:#0f1326;background:#dfe3f2;border-radius:9px;padding:3px 9px}
.lg .tx{font-size:31px;font-weight:600;color:#eef0f7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lg:last-child{grid-column:span 2;justify-self:start;width:435px}

/* 6 */
.p6{--c:#ff6fae;--a:#ff8f8a;--b:#ff6fae}
.p6 .h{font-size:160px}
.p6 .sub{top:560px;width:600px}
.p6 .chips{top:760px;width:680px;flex-wrap:nowrap;gap:14px}.p6 .chip{white-space:nowrap;font-size:34px;padding:14px 26px}
.cta{position:absolute;left:96px;top:1290px;display:flex;align-items:center;gap:24px}
.cta .btn{font-size:42px;font-weight:800;color:#2a1406;background:linear-gradient(90deg,#ffb35c,#ff7a8a);padding:20px 44px;border-radius:99px;box-shadow:0 12px 40px rgba(255,122,138,.4)}
.cta .note{font-size:36px;font-weight:600;color:#c3c8dc}
</style></head><body>
<div class="map"></div>
<div class="glow g1"></div><div class="glow g2"></div><div class="glow g3"></div><div class="glow g4"></div><div class="glow g5"></div><div class="glow g6"></div><div class="glow g7"></div>
${board()}

<section class="post p1">
  <div class="k"><i></i>Metro bulmacası</div>
  <div class="h">Dokun.<br><span class="grad">Döndür.</span></div>
  <div class="sub">Her dokunuşta ray <b>90°</b> döner.<br>Hattı merkezden bütün duraklara bağla.</div>
  <div class="deg">90°</div>
  <div class="foot">Tek elle oynanır · <b>reklamsız seçeneği var</b></div>
</section>

<section class="post p2">
  <div class="brand"><img src="${ICON}"><div class="h"><span>R</span><span class="grad">ay</span></div></div>
  <div class="tag">Hatları bağla · Şehri canlandır</div>
  <div class="phone"><img src="${SHOT}"></div>
</section>

<section class="post p3">
  <div class="k"><i></i>Açık uç kalmasın</div>
  <div class="h">Hattı yak,<br><span class="grad">şehri canlandır</span></div>
  <div class="chips"><span class="chip">📴 İnternetsiz</span><span class="chip">♾️ Sonsuz bölüm</span><span class="chip">⭐ 3 yıldız</span><span class="chip">🧩 24 kural</span></div>
  <div class="foot" style="width:640px">Zorluk dalga dalga artar,<br>arada mola var.</div>
</section>

<section class="post p4">
  <div class="k"><i></i>Renk temaları</div>
  <div class="h"><span class="grad">30+</span> tema</div>
  <div class="sub">Hattını istediğin renge boya.</div>
  <div class="tgrid">${themeCards}</div>
  <div class="foot">Mevsim temaları: <b>Kar Feneri · Erguvan · Hazan</b></div>
</section>

<section class="post p5">
  <div class="k"><i></i>Dil desteği</div>
  <div class="h"><span class="grad">9</span> dil</div>
  <div class="langs">${langList}</div>
  <div class="foot">Telefonunun dilinde açılır.</div>
</section>

<section class="post p6">
  <div class="k"><i></i>Her gün yeni</div>
  <div class="h">Günün<br><span class="grad">Hattı</span></div>
  <div class="sub">Her gün tek bir<br>özel bulmaca.<br><b>Serini büyüt.</b></div>
  <div class="chips"><span class="chip">🔥 Gün serisi</span><span class="chip">💡 Günde 3 ipucu</span></div>
  <div class="cta"><span class="btn">Ücretsiz indir</span><span class="note">App Store · link profilde</span></div>
</section>
</body></html>`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, 'tam.png') });
  const names = ['1-dokun', '2-ray', '3-hatti-yak', '4-temalar', '5-diller', '6-gunun-hatti'];
  for (let i = 0; i < 6; i++)
    await page.screenshot({ path: path.join(OUT, names[i] + '.png'), clip: { x: (i % 3) * PW, y: Math.floor(i / 3) * PH, width: PW, height: PH } });
  // ızgara önizlemesi: Instagram'daki gibi aralarında ince boşluk
  const gap = 4, pv = `<!doctype html><body style="margin:0;background:#000;display:grid;grid-template-columns:repeat(3,360px);gap:${gap}px">` +
    names.map(n => `<img style="width:360px;height:480px;display:block" src="data:image/png;base64,${fs.readFileSync(path.join(OUT, n + '.png')).toString('base64')}">`).join('') + '</body>';
  const p2 = await b.newPage({ viewport: { width: 360 * 3 + gap * 2, height: 480 * 2 + gap }, deviceScaleFactor: 2 });
  await p2.setContent(pv, { waitUntil: 'load' });
  await p2.screenshot({ path: path.join(OUT, 'izgara-onizleme.png') });
  await b.close();
  console.log('→', path.relative(R, OUT));
})();
