// Mağaza görselleri: gerçek oyunu yerel sunucuda açar, 10 sahneyi çeker (1.2: kapışma, şehir haritası, lig dahil; lig ve kapışma sahte arka uçla, window.__ligFake), pazarlama çerçevesine (başlık + telefon) koyar.
// Ayrıca Play öne çıkan görseli (1024×500) üretir. Oyun koduna dokunmaz; durum yalnız kayıt (localStorage) ve dokunuşla kurulur.
// Kullanım: node tools/store-shots.cjs [all|en|de|es|pt-BR|fr|ko|ja|zh-Hant] [play|ios-69|ios-65|ios-ipad13|feature] [01 02 …]   (boş = Türkçe, hepsi) · metinler ve yükleme yerleri: docs/MAGAZA.md
// Çıktı: store/screens/{play,ios-69,ios-65,ios-ipad13}/NN-ad.png · store/feature-graphic.png (24 bit PNG, saydamlık yok)
'use strict';
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const { rIcon } = require('./ikon.cjs');

const R = path.join(__dirname, '..'), WWW = path.join(R, 'www'), OUT = path.join(R, 'store');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg' };
function serve() {   // tools/hakem.cjs ile aynı: www/ klasörünü önbelleksiz sunar
  return new Promise(res => {
    const s = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(WWW, p);
      if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-cache' });
      fs.createReadStream(f).pipe(r);
    });
    s.listen(0, '127.0.0.1', () => res(s));
  });
}
const b64 = f => fs.readFileSync(path.join(R, f)).toString('base64');
const FONT = `data:font/woff2;base64,${b64('www/fonts/outfit-latin.woff2')}`, FONT_EXT = `data:font/woff2;base64,${b64('www/fonts/outfit-latin-ext.woff2')}`, MAP = `data:image/svg+xml;base64,${b64('www/bg.svg')}`;
const FACE = `@font-face{font-family:Outfit;src:url(${FONT}) format("woff2");font-weight:100 900}@font-face{font-family:Outfit;src:url(${FONT_EXT}) format("woff2");font-weight:100 900;unicode-range:U+0100-02AF}`;

// ---------- cihazlar ----------
// vp: oyunun CSS görüş alanı (gerçek telefon boyu) · safe: üst/alt güvenli alan (durum çubuğu, ev çizgisi)
const DEVICES = {
  play: { W: 1080, H: 1920, vp: [412, 800], safe: [32, 18] },     // Google Play telefon, 9:16
  'ios-69': { W: 1320, H: 2868, vp: [440, 956], safe: [54, 34] }, // iPhone 6,9" (440×956 pt)
  'ios-65': { W: 1284, H: 2778, vp: [428, 926], safe: [47, 34] }, // iPhone 6,5" (428×926 pt)
  'ios-ipad13': { W: 2048, H: 2732, vp: [1024, 1366], safe: [24, 20], rad: .045 }, // iPad 13" (1024×1366 pt); oyun tablette arayüzü büyütür (index.html "tablet")
};
// çerçeve ölçüleri: başlık bloğu üstte, telefon kalan yüksekliğe sığar
function layout(d) {
  const { W, H, vp: [vw, vh] } = d, head = Math.round(H * .195), foot = Math.round(H * .038), bz = Math.round(W * .017);
  let sh = H - head - foot - 2 * bz, sw = Math.round(sh * vw / vh);
  if (sw + 2 * bz > W * .86) { sw = Math.round(W * .86 - 2 * bz); sh = Math.round(sw * vh / vw); }
  return { head, bz, sw, sh, pw: sw + 2 * bz, ph: sh + 2 * bz, x: Math.round((W - sw - 2 * bz) / 2), y: H - foot - sh - 2 * bz, k: sw / vw };
}

// ---------- kayıt (oyuncu durumu) ----------
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const TODAY = ymd(new Date()), YDAY = ymd(new Date(Date.now() - 864e5));
// ilerlemiş, inandırıcı bir oyuncu: level'a kadar çoğu 3 yıldız, taçların çoğu alınmış, 12 günlük seri
function saveAt(level, x = {}) {
  const stars = {}, crowns = {};
  for (let l = 1; l < level; l++) { stars[l] = l % 9 === 4 ? 2 : 3; if (stars[l] === 3 && l % 5) crowns[l] = 1; }
  const log = Array.from({ length: 12 }, (_, k) => ymd(new Date(Date.now() - (k + 1) * 864e5))).reverse();
  return { level, stars, crowns, played: level + 20, streak: 12, best: 12, lastDaily: YDAY, dailyDone: '', dailyLog: log, hints: 6, hintDay: TODAY,
    theme: 'dark', skin: 'metro', owned: { metro: 1, sunset: 1, ocean: 1, forest: 1, desert: 1 }, spent: 125, dCrowns: 9, shards: 1,
    seen: Object.fromEntries(Array.from({ length: 30 }, (_, c) => [c, 1])), testOpen: 1, remindAsked: true, combo: 0, ...x };
}

// ---------- lig kaydı: sahte arka uç (window.__ligFake) · hep bu haftaya katılmış bir oyuncu (1.2 arayüzü: Lig ve Kapış sekmeleri açık) ----------
// Rakipler ve sıralama oyundaki benzetim (lig.js › fake): gerçek kullanıcı, yorum ya da puan gibi sunulmaz; yalnız ekranın nasıl göründüğünü gösterir.
const NICK = { tr: 'Hızlı Martı', en: 'Swift Gull', de: 'Flinke Möwe', es: 'Gaviota Veloz', 'pt-BR': 'Gaivota Veloz', fr: 'Mouette Vive', ko: '날쌘 갈매기', ja: 'はやいカモメ', 'zh-Hant': '迅捷海鷗' };
const weekId = () => { const d = new Date(Date.now() + 3 * 3600e3), wd = (d.getUTCDay() + 6) % 7; return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - wd)).toISOString().slice(0, 10); };
const ligSave = (lg, x = {}) => ({ joined: true, uid: 'u4242', nick: NICK[lg] || NICK.en, tier: 2, wk: weekId(), pts: 180, lastRank: 0, ...x });

// ---------- oyunu sürme ----------
async function tapTile(page, i) {
  const p = await page.evaluate(i => {
    const { G, geo } = window.__ray, r = document.getElementById('cv').getBoundingClientRect();
    return { x: r.left + geo.ox + (i % G.cols) * geo.s + geo.s / 2, y: r.top + geo.oy + (i / G.cols | 0) * geo.s + geo.s / 2 };
  }, i);
  await page.mouse.click(p.x, p.y);
}
// Merkezden çözüm ağacı derinliğine göre karoların ilk "frac" kadarını yerine oturt (hat merkezden yayılarak yanar).
// frac = 1 → bütün bulmaca (eklenti birimleri: plan()). tools/hakem.cjs solve() ile aynı mantık.
async function solveTo(page, frac = 1, gap = 22) {
  for (let round = 0; round < 40; round++) {
    const taps = await page.evaluate(frac => {
      const { G, rot, tree } = window.__ray, T = tree(G), unrot = m => ((m >> 1) | (m << 3)) & 15, out = [];
      if (!G || G.won) return out;
      const order = G.cur.map((_, i) => i).filter(i => T.dep[i] >= 0).sort((a, b) => T.dep[a] - T.dep[b]);
      const maxD = frac >= 1 ? 1e9 : T.dep[order[Math.min(order.length - 1, Math.floor(order.length * frac))]], ok = i => i >= 0 && T.dep[i] <= maxD;
      G.cur.forEach((v, i) => {
        if (G.fixed[i] || G.pinned[i] || G.unitOf?.[i] >= 0 || !ok(i) || (G.seen && !G.seen[i])) return;
        const j = G.link?.[i] ?? -1; if (j >= 0 && (j < i || !ok(j))) return;
        let k = 0, t = v, u = j >= 0 ? G.cur[j] : 0; const step = G.rev?.[i] ? unrot : rot;
        while ((t !== G.sol[i] || (j >= 0 && u !== G.sol[j])) && k < 4) { t = step(t); if (j >= 0) u = rot(u); k++; }
        for (let q = 0; q < k; q++) out.push(i);
      });
      return frac >= 1 ? out.concat(window.__ray.plan()) : out;
    }, frac);
    if (!taps.length) break;
    for (const i of taps) { await tapTile(page, i); await page.waitForTimeout(gap); }
    if (frac < 1) break;
  }
}
// süreyi oyunda geçmiş gibi göster (saat ve sefer şeridi): yalnız test kancasındaki G.ms değişir
const clock = (page, sec) => page.evaluate(sec => { const G = window.__ray.G; G.ms = sec * 1e3 - (G.runAt ? performance.now() - G.runAt : 0); }, sec);
const play = (page, l) => page.evaluate(() => document.getElementById('bMap').click()).then(() => page.waitForTimeout(500)).then(() => page.click(`.lv[data-l="${l}"]`));

// ---------- sahneler ----------
// t: başlık (iki satır; ikinci satır vurgu rengiyle) · s: alt satır · save: kayıt · go: sahneyi kur
// harcanabilir bilet (eski taç) bakiyesini n'ye ayarla (görünmeyen seri bonusuyla)
const bal = (s, n) => Object.assign(s, { cc: n + s.spent - Object.keys(s.crowns).length - s.dCrowns });
const seenTo = c => Object.fromEntries(Array.from({ length: c }, (_, k) => [k, 1]));   // c'den önceki hatların kural kartları görülmüş
// 1.2 sırası: oynanış, kapışma, şehir haritası, lig, 33 hat, kural, kusursuz, Günün Hattı (+ App Store için tema, sandık). Play ilk 8'i alır.
// Şehir, lig, kapışma ve ana sayfa aynı oyuncudur: M20'deydi, ilk 12 hattın hepsi kusursuz (altın semt), 12 günlük seri.
const mid = (goldTo = 330) => { const s = saveAt(520); for (let l = 1; l < 520; l++) { s.stars[l] = 3; if (l < goldTo || l % 5) s.crowns[l] = 1; } return s; };
const SCENES = [
  // ilk görsel oynanış (mağazada ilk bakılan): M9 iki merkez (bölüm 198, yalın), iki renkli hat, yarısı yanmış
  { id: '01-oyun', t: ['Dokun, döndür,', 'hattı yak'], s: 'Bütün durakları merkeze bağla, açık uç kalmasın', te: ['Tap, turn,', 'light the line'], se: 'Link every station to the hub, leave no open ends',
    save: saveAt(200), go: async page => { await play(page, 198); await page.waitForTimeout(900); await clock(page, 47); await solveTo(page, .42); await page.waitForTimeout(1400); } },
  // canlı kapışma: Kapış sayfasından rakip aranır (sahte arka uç), geri sayımdan sonra iki ilerleme çubuğu; ben önde, rakip arkada.
  // Rakip adı oyundaki benzetimden gelir; rastgelelik ve saat kısa süre sabitlenir ki her dilde aynı rakip ve aynı tahta çıksın.
  { id: '02-kapisma', t: ['Canlı kapışmada', 'yarış'], s: 'İlk bitiren kazanır, galibiyet +10 lig puanı', te: ['Race in', 'live duels'], se: 'First to finish wins, a win is +10 league points',
    test: false, save: mid(), go: async page => {
      await page.click('#tabbar [data-tab=vs]'); await page.waitForTimeout(700);
      await page.evaluate(() => { const r = Math.random, n = Date.now; Math.random = () => .31; Date.now = () => 1.78e12; window.__ray.lig.find({ wait: 300, oppT: 24 }); Math.random = r; Date.now = n; });
      await page.waitForFunction(() => window.__ray.G?.duel && !document.getElementById('modal').classList.contains('open'), null, { timeout: 8000 });
      await page.waitForTimeout(3600); await solveTo(page, .5); await page.waitForTimeout(3000);
    } },
  // şehir haritası (Şehir sekmesi): çoğu semt yanık, ilk 12 hat altın
  { id: '03-sehir', t: ['Hatlarınla', 'şehri büyüt'], s: 'Biten her hat bir semti yakar, kusursuzlar altın parlar', te: ['Grow your city', 'metro map'], se: 'Every finished line lights a district, perfect ones glow gold',
    test: false, save: mid(), go: async page => { await page.click('#tabbar [data-tab=city]'); await page.waitForTimeout(2800); } },
  // haftalık lig: ben 4. sıradayım (üst lige çıkış bölgesi içinde), liste en üstte
  { id: '04-lig', t: ['Haftalık ligde', 'yüksel'], s: '30 kişilik grupta yarış, üst lige çık', te: ['Climb the', 'weekly league'], se: 'Compete in a group of 30 and move up a league',
    test: false, save: mid(), go: async page => {
      await page.waitForTimeout(600);
      await page.evaluate(async () => { const b = await window.Lig.board(), rows = b.rows.filter(r => !r.me).sort((a, c) => c.pts - a.pts), me = b.rows.find(r => r.me); await window.Lig.add(rows[3].pts + 7 - me.pts); });
      await page.click('#tabbar [data-tab=league]'); await page.waitForTimeout(1500);
      await page.evaluate(() => { document.getElementById('lgList').scrollTop = 0; }); await page.waitForTimeout(400);
    } },
  // hat haritası gerçek ilerlemeyle (test açık değil): M33 (son kural hattı) sürüyor; ekranın altı satır arasına denk gelir
  { id: '05-harita', t: ['33 hat,', 'sonu gelmeyen bölüm'], s: 'Zorluk dalga dalga artar, arada mola var', te: ['33 lines,', 'endless levels'], se: 'Harder and harder, with breather levels', test: false,
    save: saveAt(862), go: async page => {
      await page.evaluate(() => document.getElementById('bMap').click()); await page.waitForTimeout(700);
      await page.evaluate(() => {
        const ml = document.getElementById('mapList'), r = ml.getBoundingClientRect(), lim = r.bottom - 6;
        ml.scrollTop += ml.querySelector('.lv.cur').closest('.line').getBoundingClientRect().top - r.top - r.height * .28;
        const ys = [...ml.querySelectorAll('.lv')].map(b => b.getBoundingClientRect().bottom), y = ys.reduce((a, b) => Math.abs(b - lim) < Math.abs(a - lim) ? b : a);
        ml.scrollTop += y - lim;
      });
      await page.waitForTimeout(400);
    } },
  // kural kartı: 1.2'deki hatlardan M27 · Ekspres durak (bölüm 689; kuralı gösteren kart)
  { id: '06-kural', t: ['Hat ilerledikçe', 'yeni kurallar'], s: 'Ekspres durak, sinyal, sarsıntı, kumanda, boş peron…', te: ['New rules', 'as the line grows'], se: 'Express stations, signals, quakes, remotes, empty platforms…',
    save: saveAt(689, { seen: seenTo(26) }), go: async page => { await play(page, 689); await page.waitForTimeout(2200); } },
  // kusursuz bitiş: 3 yıldız + bilet + 5'li seri bonusu
  { id: '07-kazan', t: ['Kusursuz bitir,', 'bilet kazan'], s: 'Süre ve hamle hedefini tuttur, üç yıldızı topla', te: ['Finish perfect,', 'earn tickets'], se: 'Beat the time and move targets, collect three stars',
    save: saveAt(46, { combo: 4 }), go: async page => { await play(page, 45); await page.waitForTimeout(900); await clock(page, 38); await solveTo(page, 1); await page.waitForTimeout(3200); } },
  // ana ekran: Günün Hattı, 12 günlük seri, 1.2 sekme çubuğu (Lig, Kapış, Şehir)
  { id: '08-ana', t: ['Her gün yeni', 'Günün Hattı'], s: 'Herkes aynı bulmacayı çözer, serini koru', te: ['A new Daily Line', 'every day'], se: 'Everyone solves the same puzzle, keep your streak',
    save: mid(), go: async page => { await page.waitForTimeout(900); } },
  // temalar (1.2: Mağaza sayfası › Temalar): bakiye ve sandık satırı üstte, "Bilet temaları" ızgarası altta; süreli mevsim teması satırı görünmesin (tarihi geçince eskir)
  { id: '09-tema', t: ['Bilet topla,', '25 renk teması aç'], s: 'Kusursuz bitirdiğin her bölüm bir bilet kazandırır', te: ['Collect tickets,', 'unlock 25 themes'], se: 'Every level you finish perfectly earns a ticket',
    save: bal(saveAt(241, { skin: 'ocean', owned: { metro: 1, sunset: 1, ocean: 1, forest: 1, desert: 1, sakura: 1, neon: 1, aurora: 1 }, spent: 395 }), 38),
    go: async page => {
      await page.evaluate(() => document.getElementById('crownChip').click()); await page.waitForTimeout(800);
      await page.click('#tTh'); await page.waitForTimeout(900);
      await page.evaluate(() => {
        const b = document.getElementById('shopBody'), lab = b.querySelector('.vipk:not(.sea)');
        if (lab) b.scrollTop += lab.getBoundingClientRect().top - b.getBoundingClientRect().top - 10;
      });
      await page.waitForTimeout(400);
    } },
  // sandık açılışı: 7 sandıktır destansı çıkmadı → 8. destansı (şanssızlık koruması); sabit tohumla hep aynı kaplama (Lavanta)
  { id: '10-sandik', t: ['Sürpriz sandık,', 'yeni trenler'], s: 'İpucu, seri kalkanı ya da yeni bir tren kaplaması', te: ['Surprise chest,', 'new trains'], se: 'Hints, a streak shield or a new train livery',
    save: bal(saveAt(241, { skin: 'ocean', seed: 9, chests: 7, dry: 7, trains: { ekspres: 1, gece: 1 } }), 24),
    go: async page => {
      await page.evaluate(() => document.getElementById('crownChip').click()); await page.waitForTimeout(800);
      await page.evaluate(() => document.getElementById('mChest').click()); await page.waitForTimeout(800);
      await page.evaluate(() => document.getElementById('mOpen').click()); await page.waitForTimeout(1500);
      await page.click('#chestScene'); await page.waitForTimeout(2600);
    } },
];

// öteki diller: sahne başlığı [satır 1, satır 2 (vurgu)] ve alt satır · öne çıkan görsel: [alt yazı, rozetler]
// Başlıklar docs/pazarlama/aso.md §4.2'den (1.2); alt satırlar oyundaki terimlerle (www/lang/*.js)
const TX = {
  de: { '01-oyun': [['Tippen, drehen,', 'Linie erleuchten'], 'Verbinde jede Station mit dem Zentrum, ohne offene Enden'],
    '02-kapisma': [['Live-Duelle', 'spielen'], 'Wer zuerst fertig ist, gewinnt: +10 Ligapunkte'],
    '03-sehir': [['Bau deine', 'Metro-Stadt aus'], 'Jede fertige Linie erhellt ein Viertel, perfekte glänzen golden'],
    '04-lig': [['Steig in der', 'Wochenliga auf'], 'Tritt in einer 30er-Gruppe an und steig eine Liga auf'],
    '05-harita': [['33 Linien,', 'endlose Level'], 'Immer schwerer, mit Verschnaufpausen'],
    '06-kural': [['Neue Regeln', 'mit jeder Linie'], 'Expressstation, Signal, Bebenstation, Fernbedienkachel…'],
    '07-kazan': [['Perfekt spielen,', 'Tickets sammeln'], 'Schaffe Zeit- und Zugziel, hol alle drei Sterne'],
    '08-ana': [['Jeden Tag eine', 'Tageslinie'], 'Alle lösen dasselbe Rätsel, halte deine Serie'],
    '09-tema': [['Tickets sammeln,', '25 Farbthemen'], 'Jedes perfekte Level bringt ein Ticket'],
    '10-sandik': [['Überraschungskiste,', 'neue Züge'], 'Tipps, ein Serienschild oder ein neuer Zuglack'],
    feature: ['Linien verbinden · Stadt beleben', ['Einhändig', 'Offline', 'Metrorätsel']] },
  es: { '01-oyun': [['Toca, gira,', 'enciende la línea'], 'Une cada estación al centro, sin extremos sueltos'],
    '02-kapisma': [['Duelos', 'en vivo'], 'Gana quien termine primero: +10 puntos de liga'],
    '03-sehir': [['Haz crecer', 'tu ciudad'], 'Cada línea terminada ilumina un barrio, las perfectas brillan en oro'],
    '04-lig': [['Sube en la', 'liga semanal'], 'Compite en un grupo de 30 y sube de liga'],
    '05-harita': [['33 líneas,', 'niveles sin fin'], 'Cada vez más difícil, con niveles de respiro'],
    '06-kural': [['Nuevas reglas', 'en cada línea'], 'Estación exprés, señal, estación sísmica, andén vacío…'],
    '07-kazan': [['Termina perfecto,', 'gana billetes'], 'Cumple el tiempo y los movimientos, logra tres estrellas'],
    '08-ana': [['Una Línea del día', 'nueva cada día'], 'Todos resuelven el mismo puzle, mantén tu racha'],
    '09-tema': [['Gana billetes,', 'desbloquea 25 temas'], 'Cada nivel perfecto te da un billete'],
    '10-sandik': [['Cofre sorpresa,', 'trenes nuevos'], 'Pistas, un escudo de racha o un nuevo diseño de tren'],
    feature: ['Conecta las líneas · Da vida a la ciudad', ['A una mano', 'Sin conexión', 'Puzle de metro']] },
  'pt-BR': { '01-oyun': [['Toque, gire,', 'acenda a linha'], 'Ligue cada estação ao centro, sem pontas soltas'],
    '02-kapisma': [['Duelos', 'ao vivo'], 'Quem terminar primeiro vence: +10 pontos de liga'],
    '03-sehir': [['Faça sua cidade', 'crescer'], 'Cada linha concluída acende um bairro, as perfeitas brilham douradas'],
    '04-lig': [['Suba na', 'liga semanal'], 'Dispute num grupo de 30 e suba de liga'],
    '05-harita': [['33 linhas,', 'fases sem fim'], 'Cada vez mais difícil, com fases de descanso'],
    '06-kural': [['Novas regras', 'a cada linha'], 'Estação expressa, sinal, estação sísmica, plataforma vazia…'],
    '07-kazan': [['Termine perfeito,', 'ganhe bilhetes'], 'Bata o tempo e os movimentos, pegue as três estrelas'],
    '08-ana': [['Uma Linha do Dia', 'nova todo dia'], 'Todos resolvem o mesmo desafio, mantenha a sequência'],
    '09-tema': [['Junte bilhetes,', 'libere 25 temas'], 'Cada fase perfeita rende um bilhete'],
    '10-sandik': [['Baú surpresa,', 'trens novos'], 'Dicas, um escudo de sequência ou uma nova pintura de trem'],
    feature: ['Ligue as linhas · Dê vida à cidade', ['Uma mão', 'Offline', 'Metrô']] },
  fr: { '01-oyun': [['Touche, tourne,', 'allume la ligne'], 'Relie chaque station au centre, sans bout libre'],
    '02-kapisma': [['Duels', 'en direct'], 'Le premier à finir gagne : +10 points de ligue'],
    '03-sehir': [['Fais grandir', 'ta ville'], 'Chaque ligne finie allume un quartier, les parfaites brillent en or'],
    '04-lig': [['Grimpe dans', 'la ligue'], 'Joue dans un groupe de 30 et monte de ligue'],
    '05-harita': [['33 lignes,', 'niveaux sans fin'], 'De plus en plus dur, avec des pauses'],
    '06-kural': [['De nouvelles règles', 'à chaque ligne'], 'Station express, signal, station sismique, quai vide…'],
    '07-kazan': [['Finis parfait,', 'gagne des tickets'], 'Tiens le temps et les coups, décroche trois étoiles'],
    '08-ana': [['Une Ligne du jour', 'inédite chaque jour'], 'Tout le monde résout le même puzzle, garde ta série'],
    '09-tema': [['Gagne des tickets,', 'débloque 25 thèmes'], 'Chaque niveau parfait rapporte un ticket'],
    '10-sandik': [['Coffre surprise,', 'nouveaux trains'], 'Des indices, un bouclier de série ou une nouvelle livrée'],
    feature: ['Relie les lignes · Anime la ville', ['À une main', 'Hors ligne', 'Puzzle de métro']] },
  ko: { '01-oyun': [['탭하고 돌려서', '노선을 밝혀요'], '모든 역을 허브에 연결하고, 끊긴 끝은 남기지 마세요'],
    '02-kapisma': [['실시간', '대결'], '먼저 끝내면 승리! 리그 점수 +10'],
    '03-sehir': [['노선으로', '도시를 키우세요'], '노선을 끝낼 때마다 구역이 밝아지고, 퍼펙트는 황금빛으로 빛나요'],
    '04-lig': [['주간 리그에서', '올라가요'], '30명 그룹에서 겨루고 상위 리그로 올라가요'],
    '05-harita': [['33개 노선,', '끝없는 레벨'], '점점 어려워지고, 중간중간 쉬어 가요'],
    '06-kural': [['노선마다', '새로운 규칙'], '급행역, 신호 타일, 지진역, 리모컨 타일, 빈 승강장…'],
    '07-kazan': [['퍼펙트로 깨고,', '티켓을 모아요'], '시간과 이동 목표를 지키고 별 3개를 모으세요'],
    '08-ana': [['매일 새로운', '오늘의 노선'], '모두가 같은 퍼즐을 풀어요, 연속 기록을 지키세요'],
    '09-tema': [['티켓을 모아', '테마 25종 해제'], '퍼펙트로 깬 레벨마다 티켓 1장'],
    '10-sandik': [['깜짝 상자,', '새로운 열차'], '힌트, 연속 기록 보호막 또는 새 열차 도색'],
    feature: ['노선을 잇고 · 도시를 밝혀요', ['한 손으로', '오프라인', '지하철 퍼즐']] },
  ja: { '01-oyun': [['タップで回して', '路線を灯そう'], 'すべての駅をハブにつなぎ、行き止まりをなくそう'],
    '02-kapisma': [['ライブ', '対戦'], '先にクリアした人の勝ち。リーグポイント+10'],
    '03-sehir': [['路線で', '街を育てよう'], '路線をクリアするたびに地区が灯り、パーフェクトは金色に輝く'],
    '04-lig': [['週間リーグで', '上を目指そう'], '30人のグループで競って、上のリーグへ'],
    '05-harita': [['33路線、', '終わらないステージ'], 'だんだん難しく、ひと休みステージも'],
    '06-kural': [['路線ごとに', '新しいルール'], '急行駅、信号タイル、地震駅、リモコンタイル、空きホーム…'],
    '07-kazan': [['パーフェクトで', '切符をゲット'], 'タイムと手数の目標を守って、星を3つ集めよう'],
    '08-ana': [['毎日あたらしい', '今日の路線'], 'みんなが同じパズルに挑戦。連続記録をのばそう'],
    '09-tema': [['切符を集めて', '25のテーマを解放'], 'パーフェクトでクリアするたびに切符1枚'],
    '10-sandik': [['びっくり宝箱、', '新しい列車'], 'ヒント、連続記録シールド、新しい車両カラー'],
    feature: ['路線をつなぎ · 街を照らそう', ['片手で', 'オフライン', 'メトロパズル']] },
  'zh-Hant': { '01-oyun': [['點一下、轉一轉，', '點亮路線'], '把每個車站連到樞紐，不留斷頭'],
    '02-kapisma': [['即時', '對戰'], '先完成的人獲勝，聯賽積分 +10'],
    '03-sehir': [['用路線讓', '城市成長'], '每完成一條路線就點亮一個街區，完美過關的會閃耀金光'],
    '04-lig': [['在每週聯賽', '往上爬'], '在 30 人小組中競爭，晉級上一級聯賽'],
    '05-harita': [['33 條路線，', '無限關卡'], '越來越難，也有休息關卡'],
    '06-kural': [['每條路線', '都有新規則'], '快車站、號誌方塊、地震站、遙控方塊、空月台…'],
    '07-kazan': [['完美過關，', '賺取車票'], '達成時間和步數目標，收集三顆星'],
    '08-ana': [['每天一條新的', '每日路線'], '大家解同一道謎題，保持連續紀錄'],
    '09-tema': [['收集車票，', '解鎖 25 款主題'], '每個完美過關的關卡都能得到一張車票'],
    '10-sandik': [['驚喜寶箱，', '全新列車'], '提示、連續紀錄護盾或新列車塗裝'],
    feature: ['連起路線 · 點亮城市', ['單手', '離線', '地鐵解謎']] },
};
const LOCALE = { tr: 'tr-TR', en: 'en-US', de: 'de-DE', es: 'es-ES', 'pt-BR': 'pt-BR', fr: 'fr-FR', ko: 'ko-KR', ja: 'ja-JP', 'zh-Hant': 'zh-TW' }, LANGS = Object.keys(LOCALE);
// Outfit'te CJK harfi yok: başlıklar dilin yazı tipine düşer (oyundaki style.css ile aynı sıra; Linux'ta Noto Sans CJK kurulu olmalı)
const CJK = { ko: '"Apple SD Gothic Neo","Noto Sans KR","Noto Sans CJK KR",', ja: '"Hiragino Sans","Noto Sans JP","Noto Sans CJK JP",', 'zh-Hant': '"PingFang TC","Noto Sans TC","Noto Sans CJK TC",' };
const FONT_OF = lg => `Outfit,${CJK[lg] || ''}system-ui,sans-serif`;
const words = (sc, lg) => lg === 'tr' ? [sc.t, sc.s] : lg === 'en' ? [sc.te, sc.se] : TX[lg][sc.id];

// güvenli alan: env(safe-area-inset-*) tarayıcıda 0 → aynı kuralları sabit değerle ez (telefonda olduğu gibi durum çubuğu payı)
const safeCss = ([t, b]) => `:root{--safe-area-inset-bottom:${b}px}.screen{padding-top:${t}px!important}
  .bottom{padding-bottom:${Math.max(18, b)}px!important}.mapList{padding-bottom:${Math.max(24, b)}px!important}
  #game.won .winp{padding-bottom:${Math.max(16, b)}px!important}.sheet{padding-bottom:${Math.max(22, b)}px!important}
  .cscene{padding-top:${Math.max(16, t)}px!important;padding-bottom:${Math.max(16, b)}px!important}
  #toast{top:${t + 128}px!important}body.test .hero p::after{content:none!important}`;

async function capture(browser, url, sc, d, k, lg = 'tr') {
  const ctx = await browser.newContext({ viewport: { width: d.vp[0], height: d.vp[1] }, deviceScaleFactor: k, colorScheme: 'dark', hasTouch: true, isMobile: true, locale: LOCALE[lg] });
  await ctx.addInitScript(`window.__noIntro = true; window.__rayTest = ${sc.test === false ? 0 : 1}; window.__ligFake = true; window.__noRec = true; try { localStorage.setItem('ray', ${JSON.stringify(JSON.stringify(sc.save))}); localStorage.setItem('ray.lig', ${JSON.stringify(JSON.stringify(ligSave(lg, sc.lig)))}); } catch {}
    addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = ${JSON.stringify(safeCss(d.safe))}; document.head.append(s); });`);
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(500);
  await sc.go(page);
  const png = await page.screenshot();
  await ctx.close();
  if (errors.length) throw new Error(`${sc.id}: ${errors.join(' | ')}`);
  return png;
}

// ---------- pazarlama çerçevesi ----------
const ICONS = `<svg viewBox="0 0 74 14" fill="#eef0f7"><rect x="0" y="9" width="3" height="5" rx="1"/><rect x="5" y="6.5" width="3" height="7.5" rx="1"/><rect x="10" y="4" width="3" height="10" rx="1"/><rect x="15" y="1.5" width="3" height="12.5" rx="1"/>
  <path d="M31.5 3.2a12 12 0 0 1 8.6 3.5l1.3-1.4a14 14 0 0 0-19.8 0l1.3 1.4a12 12 0 0 1 8.6-3.5zm0 4a8 8 0 0 1 5.7 2.3l1.4-1.4a10 10 0 0 0-14.2 0l1.4 1.4a8 8 0 0 1 5.7-2.3zm0 4a4 4 0 0 1 2.9 1.2l-2.9 2.9-2.9-2.9a4 4 0 0 1 2.9-1.2z"/>
  <rect x="47" y="1.5" width="23" height="11" rx="3.2" fill="none" stroke="#eef0f7" stroke-opacity=".45" stroke-width="1.1"/><rect x="49" y="3.5" width="16" height="7" rx="1.8"/><path d="M71.6 5.5v3.2c.8-.3 1.3-.9 1.3-1.6s-.5-1.3-1.3-1.6z" fill-opacity=".45"/></svg>`;
const BG = `background:radial-gradient(60% 40% at 12% 6%,rgba(255,159,90,.30),transparent 70%),radial-gradient(70% 45% at 92% 96%,rgba(109,123,255,.32),transparent 70%),radial-gradient(45% 30% at 85% 30%,rgba(255,111,145,.14),transparent 70%),linear-gradient(165deg,#161b33,#0d1020 62%)`;
function frameHtml(d, sc, png, lg = 'tr') {
  const [t, sub] = words(sc, lg);
  const L = layout(d), f = Math.round(d.W * .074), k = L.k, rad = Math.round(L.sw * (d.rad || .12)), [st, sb] = d.safe;
  return `<!doctype html><html lang="${lg}"><head><meta charset="utf-8"><style>${FACE}
*{margin:0;box-sizing:border-box}html,body{width:${d.W}px;height:${d.H}px;overflow:hidden}
body{${BG};font-family:${FONT_OF(lg)};color:#eef0f7;position:relative}${CJK[lg] ? 'h1{letter-spacing:0;line-height:1.15}' : ''}
.map{position:absolute;inset:-4%;background:url(${MAP}) center/cover;opacity:.07;-webkit-mask:radial-gradient(ellipse at 50% 40%,#000 25%,transparent 75%)}
header{position:absolute;left:0;right:0;top:0;height:${L.y}px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 ${Math.round(d.W * .06)}px}
h1{font-size:${f}px;line-height:1.04;font-weight:800;letter-spacing:-.025em}
h1 em{display:block;font-style:normal;background:linear-gradient(100deg,#ffb35c 10%,#ff7a8a 90%);-webkit-background-clip:text;background-clip:text;color:transparent;padding-bottom:.06em}
header p{margin-top:${Math.round(f * .34)}px;font-size:${Math.round(f * .4)}px;font-weight:500;color:#aab1cc;letter-spacing:.005em}
.ph{position:absolute;left:${L.x}px;top:${L.y}px;width:${L.pw}px;height:${L.ph}px;padding:${L.bz}px;border-radius:${rad + L.bz}px;
  background:linear-gradient(150deg,#3a4170,#141831 30%,#0a0c18 65%,#262c4f);box-shadow:0 ${Math.round(f * .7)}px ${Math.round(f * 1.4)}px -${Math.round(f * .3)}px rgba(0,0,0,.7),0 0 ${Math.round(f * 1.6)}px rgba(109,123,255,.18),inset 0 0 0 2px rgba(255,255,255,.08)}
.sc{position:relative;width:${L.sw}px;height:${L.sh}px;border-radius:${rad}px;overflow:hidden;background:#0d1020}
.sc img{display:block;width:100%;height:100%}
.sb{position:absolute;left:0;right:0;top:0;height:${Math.round(st * k)}px;display:flex;align-items:center;justify-content:space-between;padding:${Math.round(4 * k)}px ${Math.round(30 * k)}px 0 ${Math.round(34 * k)}px;font-size:${Math.round(15.5 * k)}px;font-weight:600;letter-spacing:.01em}
.sb svg{height:${Math.round(11.5 * k)}px}
.hb{position:absolute;left:50%;bottom:${Math.round(Math.max(6, sb * .24) * k)}px;width:${Math.round(128 * k)}px;height:${Math.round(4.6 * k)}px;margin-left:-${Math.round(64 * k)}px;border-radius:99px;background:rgba(238,240,247,.6)}
</style></head><body><div class="map"></div>
<header><h1>${t[0]}<em>${t[1]}</em></h1><p>${sub}</p></header>
<div class="ph"><div class="sc"><img src="data:image/png;base64,${png.toString('base64')}"><div class="sb"><span>9:41</span>${ICONS}</div><i class="hb"></i></div></div>
</body></html>`;
}

// ---------- Play öne çıkan görsel (1024×500) ----------
function featureHtml(lg = 'tr') {
  const en = lg !== 'tr', [sub, chips] = lg === 'en' ? ['Connect the lines · Light up the city', ['One hand', 'Offline', 'Metro puzzle']] : lg === 'tr' ? ['Hatları bağla · Şehri canlandır', ['Tek elle', 'İnternetsiz', 'Metro bulmacası']] : TX[lg].feature;
  const icon = rIcon({ size: 1000, round: 229 }).replace('<svg ', '<svg style="width:300px;height:300px" ');
  return `<!doctype html><html lang="${lg}"><head><meta charset="utf-8"><style>${FACE}
*{margin:0;box-sizing:border-box}html,body{width:1024px;height:500px;overflow:hidden}
body{background:radial-gradient(55% 75% at 20% 45%,rgba(125,162,253,.20),transparent 70%),radial-gradient(50% 70% at 95% 100%,rgba(255,159,90,.20),transparent 70%),linear-gradient(160deg,#171e3a,#0e1226 55%,#0b0e1d);
  font-family:${FONT_OF(lg)};color:#eef0f7;position:relative;display:flex;align-items:center;gap:56px;padding:0 0 0 104px}
.map{position:absolute;inset:-10% -4%;background:url(${MAP}) center/cover;opacity:.06;-webkit-mask:linear-gradient(90deg,transparent,#000 30%,#000 80%,transparent)}
.ic{position:relative;flex:none;border-radius:66px;box-shadow:0 30px 60px -18px rgba(0,0,0,.75),0 0 0 2px rgba(255,255,255,.06)}
.ic svg{display:block;border-radius:66px}
.tx{position:relative}
h1{display:inline-block;font-size:150px;line-height:.9;font-weight:800;letter-spacing:-.04em;background:linear-gradient(115deg,#eef0f7 35%,#ffb35c 72%,#ff7a8a);-webkit-background-clip:text;background-clip:text;color:transparent;padding-bottom:.08em}
p{font-size:${en ? 30 : 36}px;font-weight:600;color:#c3c8dd;margin-top:6px;letter-spacing:.005em}
small{display:flex;gap:12px;margin-top:26px}
small b{font-size:21px;font-weight:600;color:#dfe3f2;padding:9px 18px;border-radius:99px;background:rgba(40,46,82,.55);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.09)}
</style></head><body><div class="map"></div><div class="ic">${icon}</div>
<div class="tx"><h1>Ray</h1><p>${sub}</p><small>${chips.map(c => `<b>${c}</b>`).join('')}</small></div></body></html>`;
}

async function main(args, scenes = SCENES, dir = OUT) {
  // dil: 'en', 'de', 'es', 'pt-BR', 'fr', 'ko', 'ja', 'zh-Hant' ya da 'all' (9 dil) · boş = Türkçe. tr → store/screens/, öteki → store/screens-<dil>/, store/feature-graphic-<dil>.png
  const lgs = args.includes('all') ? LANGS : LANGS.filter(l => l !== 'tr' && args.includes(l)); if (!lgs.length) lgs.push('tr');
  const devs = args.filter(a => DEVICES[a] || a === 'feature'), only = args.filter(a => /^\d\d$/.test(a));
  const want = id => !devs.length || devs.includes(id), wantSc = sc => !only.length || only.includes(sc.id.slice(0, 2));
  const srv = await serve(), url = `http://127.0.0.1:${srv.address().port}/index.html`, browser = await chromium.launch(), out = [];
  async function render(file, w, h, html) {
    const p = await browser.newPage({ viewport: { width: w, height: h } });
    await p.setContent(html, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(100);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await p.screenshot({ path: file }); await p.close(); out.push(file.startsWith(R + path.sep) ? path.relative(R, file) : file);
  }
  try {
    for (const lg of lgs) {
      const sfx = lg === 'tr' ? '' : '-' + lg;
      for (const [id, d] of Object.entries(DEVICES)) {
        if (!want(id)) continue;
        const L = layout(d);
        for (const sc of scenes.filter(wantSc)) {
          const png = await capture(browser, url, sc, d, L.k, lg);
          await render(path.join(dir, 'screens' + sfx, id, sc.id + '.png'), d.W, d.H, frameHtml(d, sc, png, lg));
        }
      }
      if (want('feature')) await render(path.join(dir, `feature-graphic${sfx}.png`), 1024, 500, featureHtml(lg));
    }
  } finally { await browser.close(); srv.close(); }
  return out;
}
module.exports = { DEVICES, SCENES, saveAt, solveTo, play, clock, capture, frameHtml, main };
if (require.main === module) main(process.argv.slice(2)).then(o => console.log('üretildi:\n  ' + o.join('\n  ')), e => { console.error(e); process.exit(1); });
