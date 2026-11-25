# Ray — Mağaza sayfası, beyanlar ve yayın listesi

Bu belge Google Play ve App Store'a gönderim için gereken her şeyi tek yerde toplar: mağaza metinleri (Türkçe ve İngilizce), görseller, veri güvenliği ve gizlilik beyanları, yaş derecelendirmesi, uygulama içi ürün ve kullanıcının yapması gereken işler.

- Metinler kopyalanıp yapıştırılmak üzere kod bloklarındadır. Karakter sayıları tablolarda, sınırla birlikte verilmiştir (Unicode karakter; Türkçe harfler tek karakter sayılır).
- Geliştirici adı: Osman Adalı. Destek e-postası: osmanadali.apps@gmail.com (bütün uygulamalar için ortak).
- Bütün özellikler `README.md`, `docs/BOLUM_TASARIMI.md` ve `docs/kurallar/README.md` ile doğrulanmıştır (1.2: 33 hat, canlı kapışma, haftalık lig, şehir haritası). Oyun değişirse (ör. çift hatlara yeni kurallar gelince) "Bilinen sınırlar" bölümündeki maddeler güncellenmeli.

## 1. Kimlik bilgileri

| Alan | Değer |
|---|---|
| Uygulama adı (cihazda) | Ray |
| Paket / Bundle ID | `com.osmanadali.ray` |
| Uygulama içi ürün | `ray_reklamsiz` (tüketilemez, iki mağazada aynı kimlik) |
| Gizlilik politikası | https://osmanadali.github.io/mobil-oyun/gizlilik.html |
| Destek URL'si (App Store) | https://osmanadali.github.io/mobil-oyun/gizlilik.html (İletişim bölümü) |
| Pazarlama URL'si (isteğe bağlı) | https://osmanadali.github.io/mobil-oyun/ (oyunun web sürümü) |
| Telif (App Store) | © 2026 Osman Adalı |
| İletişim e-postası (iki mağaza, herkese açık) | osmanadali.apps@gmail.com |
| Dil | Türkçe, İngilizce, Almanca, İspanyolca, Portekizce (Brezilya), Fransızca; 1.1 ile Korece, Japonca, Geleneksel Çince (oyun cihaz diline göre açılır, desteklenmeyen dilde İngilizce; Ayarlar › Dil ile değişir; mağaza metinleri §4, §5, §5b, §5c) |
| Cihaz | Android telefon, iPhone (yalnız dikey; iPad yok) |

GitHub Pages açıktır (20 Kasım 2026): oyunun web sürümü ve gizlilik sayfası (`gizlilik.html`, 9 dil) çalışıyor; gizlilik ve destek adresleri mağaza formlarına girilebilir. Sayfada §13 "Haftalık lig ve kapışma" bölümü vardır (§6 ve §7 ile aynı beyan).

## 2. Görseller

Bütün görseller `node tools/store-shots.cjs` ile gerçek oyundan üretilir. Araç oyunu yerel sunucuda Playwright ile açar, oyuncu durumunu kayıtla kurar, karolara gerçekten dokunur, sonra her ekranı başlıklı bir pazarlama çerçevesine koyar. Oyun koduna dokunmaz.

```bash
node tools/store-shots.cjs                 # hepsi (Play, iPhone 6,9", iPhone 6,5", öne çıkan görsel)
node tools/store-shots.cjs play 02 03      # yalnız Play'in 2. ve 3. sahnesi
node tools/store-shots.cjs feature         # yalnız öne çıkan görsel
node tools/store-shots.cjs en              # İngilizce: oyun en-US'de, başlıklar İngilizce → store/screens-en/, store/feature-graphic-en.png
node tools/store-shots.cjs all             # 9 dil (tr, en, de, es, pt-BR, fr, ko, ja, zh-Hant) → store/screens[-<dil>]/, store/feature-graphic[-<dil>].png
node tools/store-shots.cjs ja play 02 04   # tek dil, tek boy, seçili sahneler (kapışma, lig)
```

| Dosya | Boyut | Nereye |
|---|---|---|
| `store/play-icon-512.png` | 512×512 | Play › Mağaza girişi › Uygulama simgesi |
| `store/feature-graphic.png` | 1024×500 | Play › Öne çıkan grafik |
| `store/screens/play/*.png` | 1080×1920 (9:16) | Play › Telefon ekran görüntüleri (ilk 8: 01–08; Play 2–8 kabul eder, 09 ve 10 yalnız App Store için) |
| `store/screens/ios-69/*.png` | 1320×2868 | App Store Connect › iPhone 6,9" ekran (zorunlu boy; 10 adede kadar: 01–10) |
| `store/screens/ios-65/*.png` | 1284×2778 | App Store Connect › iPhone 6,5" (6,9" yüklenince gerekmez; yedek) |
| `store/screens-en/…`, `store/feature-graphic-en.png` | aynı boylar | İngilizce mağaza girişi (Play › İngilizce çeviri, App Store Connect › English (U.S.)) |
| `store/screens-{de,es,pt-BR,fr}/…`, `store/feature-graphic-{de,es,pt-BR,fr}.png` | aynı boylar | Almanca, İspanyolca, Portekizce (Brezilya), Fransızca mağaza girişleri (§5b) |
| `store/screens*/ios-ipad13/*.png` | 2048×2732 | Üretilir ama **yüklenmez**: uygulama yalnız iPhone (§1) |
| `store/screens-{ko,ja,zh-Hant}/…`, `store/feature-graphic-{ko,ja,zh-Hant}.png` | aynı boylar | Korece, Japonca, Geleneksel Çince mağaza girişleri (§5c, 1.1) |
| `store/appstore-icon-1024.png` | 1024×1024 | iOS projesinin simgesi (App Store simgesi derlemeden gelir) |

Hepsi 24 bit PNG'dir, saydamlık (alfa) içermez; iki mağazanın kuralına uyar.

**Sahneler** (1.2; aynı sıra dört boyda da). Şehir, lig, kapışma ve ana sayfa aynı oyuncudur (M20'de, ilk 12 hat kusursuz, 12 günlük seri). Lig ve kapışma `window.__ligFake = true` sahte arka uçla çekilir: ekrandaki rakip adları ve puanlar oyundaki benzetimdir, gerçek kullanıcı ya da yorum değildir. Kapışmada rastgelelik ve saat çekim anında sabitlenir (rakip "Mert", aynı tahta). "Bitime 2g 19s" gibi süreler çekim gününe göredir.

| # | Dosya | Başlık | Alt satır | Ekranda |
|---|---|---|---|---|
| 1 | `01-oyun` | Dokun, döndür, hattı yak | Bütün durakları merkeze bağla, açık uç kalmasın | Bölüm 198 (M9, iki merkez), hat yarıya kadar yanmış. Mağazada ilk bakılan görsel oynanıştır. |
| 2 | `02-kapisma` | Canlı kapışmada yarış | İlk bitiren kazanır, galibiyet +10 lig puanı | Kapış sayfasından rakip aranır; geri sayımdan sonra iki ilerleme çubuğu, ben önde |
| 3 | `03-sehir` | Hatlarınla şehri büyüt | Biten her hat bir semti yakar, kusursuzlar altın parlar | Şehir sekmesi: 19/24 semt, 13 altın, M20 sürüyor |
| 4 | `04-lig` | Haftalık ligde yüksel | 30 kişilik grupta yarış, üst lige çık | Altın Lig, ben 4. sıradayım (üst lige çıkış bölgesi) |
| 5 | `05-harita` | 33 hat, sonu gelmeyen bölüm | Zorluk dalga dalga artar, arada mola var | Hat haritası: M33 (boş peron) sürüyor |
| 6 | `06-kural` | Hat ilerledikçe yeni kurallar | Ekspres durak, sinyal, sarsıntı, kumanda, boş peron… | M27 Ekspres durak kural kartı (bölüm 689) |
| 7 | `07-kazan` | Kusursuz bitir, bilet kazan | Süre ve hamle hedefini tuttur, üç yıldızı topla | Bölüm 45 kusursuz: 3 yıldız, bilet, 5'li seri bonusu |
| 8 | `08-ana` | Her gün yeni Günün Hattı | Herkes aynı bulmacayı çözer, serini koru | Ana ekran: 12 günlük seri, Günün Hattı, 1.2 sekme çubuğu (Lig, Kapış, Şehir) |
| 9 | `09-tema` | Bilet topla, 25 renk teması aç | Kusursuz bitirdiğin her bölüm bir bilet kazandırır | Mağaza sayfası › Temalar (yalnız App Store) |
| 10 | `10-sandik` | Sürpriz sandık, yeni trenler | İpucu, seri kalkanı ya da yeni bir tren kaplaması | Sandık açılışı: destansı Lavanta kaplaması (yalnız App Store) |

1.1'in `02-ana`, `03-kazan`, `04-harita`, `05-kural`, `06-tema`, `07-sandik` dosyaları kalktı (numaralar değişti); mağazaya yeni setin tamamı yüklenmeli.

Öne çıkan görsel: koyu lacivert zemin, uygulama ikonu (Gece Işığı: turuncu L ray, yanan kare merkez), "Ray", "Hatları bağla · Şehri canlandır" ve üç rozet (Tek elle, İnternetsiz, Metro bulmacası).

İngilizce sahne başlıkları (`en`): 1 Tap, turn, light the line · 2 Race in live duels · 3 Grow your city metro map · 4 Climb the weekly league · 5 33 lines, endless levels · 6 New rules as the line grows · 7 Finish perfect, earn tickets · 8 A new Daily Line every day · 9 Collect tickets, unlock 25 themes · 10 Surprise chest, new trains. Öteki dillerin başlıkları `tools/store-shots.cjs` `TX` tablosunda (`docs/pazarlama/aso.md` §4.2'den). Öne çıkan görselde "Connect the lines · Light up the city" ve One hand, Offline, Metro puzzle rozetleri (grafik yalnız Play'de; rozet bölümlerin çevrimdışı oynandığını anlatır).

## 3. Karakter sayıları

| Metin | Sınır | TR | EN |
|---|---|---|---|
| Play: uygulama adı | 30 | 18 | 22 |
| Play: kısa açıklama | 80 | 78 | 79 |
| Play: tam açıklama | 4000 | 3812 | 3967 |
| App Store: ad | 30 | 18 | 22 |
| App Store: alt başlık | 30 | 28 | 28 |
| App Store: tanıtım metni | 170 | 147 | 152 |
| App Store: açıklama | 4000 | 3812 | 3967 |
| App Store: anahtar kelimeler | 100 | 91 (96 bayt) | 98 (98 bayt) |
| Ürün adı (App Store) | 30 | 15 | 15 |
| Ürün açıklaması (App Store) | 45 | 41 | 41 |
| Ürün açıklaması (Play) | 200 | 130 | 138 |
| Play sürüm notu (1.2) | 500 | 160 | 147 |

Anahtar kelimeler bayt olarak da 100'ün altında kalır (bazı araçlar ğ, ı, ş gibi harfleri iki bayt sayar).

**1.2 notu (20 Kasım 2026).** Sayılar `docs/pazarlama/aso.md` §3 metinleriyle ve açıklama gövdesinin 1.2 güncellemesiyle yeniden sayıldı. Denetim: aşağıdaki betik bu belgedeki bütün kod bloklarını okur, her dilde karakter ve (anahtar kelimede) UTF-8 bayt sayar, sınırı aşanı, alt başlıkta "internetsiz/offline" iddiasını ve eski "24" sayısını bildirir; hepsi geçerse `Hepsi sınır içinde` yazar.

**Denetim betiği.** Çalıştırma: `sed -n '/^const fs = require/,/^process.exit/p' docs/MAGAZA.md > /tmp/say.cjs && node /tmp/say.cjs docs/MAGAZA.md --tablo` (`--tablo` her dilin sayılarını yazar; sorun varsa çıkış kodu 1).

```js
// docs/MAGAZA.md metin sayacı: kod bloklarını okur, karakter ve bayt sayar, sınırı aşanı bildirir.
const fs = require('fs'), path = process.argv[2] || 'docs/MAGAZA.md', md = fs.readFileSync(path, 'utf8');
const n = s => [...s].length, b = s => Buffer.byteLength(s);
const sec = (from, to) => md.slice(md.indexOf(from), md.indexOf(to));
const blocks = t => [...t.matchAll(/```text\n([\s\S]*?)\n```/g)].map(m => m[1]);
const notes = t => [...t.matchAll(/\| Sürüm notu[^|]*\|\s*`([^`]+)`/g)].map(m => m[1]);
const L = { tr: {}, en: {}, de: {}, es: {}, 'pt-BR': {}, fr: {}, ko: {}, ja: {}, 'zh-Hant': {} }, KEYS = ['name', 'short', 'sub', 'promo', 'kw', 'desc', 'notes'];
// §4 (Play) ve §5 (App Store): her alan için tr, en ardışık
const p4 = blocks(sec('\n## 4.', '\n## 5.')), p5 = blocks(sec('\n## 5.', '\n## 5b.')), nt = notes(sec('\n## 4.', '\n## 5.'));
[['name', p4[0], p4[1]], ['short', p4[2], p4[3]], ['desc', p4[4], p4[5]], ['notes', nt[0], nt[1]]].forEach(([k, a, c]) => { L.tr[k] = a; L.en[k] = c; });
[['sub', 2], ['promo', 4], ['kw', 6]].forEach(([k, i]) => { L.tr[k] = p5[i]; L.en[k] = p5[i + 1]; });
// §5b ve §5c: her dilde 7 blok (ad, kısa, alt başlık, tanıtım, anahtar, açıklama, sürüm notu)
const rest = sec('\n## 5b.', '\n## 6.'), parts = rest.split(/\n### /).slice(1), order = ['de', 'es', 'pt-BR', 'fr', 'ko', 'ja', 'zh-Hant'];
parts.forEach((t, i) => { const bl = blocks(t); KEYS.forEach((k, j) => { L[order[i]][k] = bl[j]; }); });
const LIM = { name: 30, short: 80, sub: 30, promo: 170, kw: 100, desc: 4000, notes: 500 };
let bad = 0; const rows = {};
for (const [lg, o] of Object.entries(L)) for (const k of KEYS) {
  const s = o[k]; if (s == null) { console.log('EKSİK', lg, k); bad++; continue; }
  const c = n(s), by = b(s), over = c > LIM[k] || (k === 'kw' && by > 100);
  if (over) { bad++; console.log('SINIR AŞILDI', lg, k, c, by); }
  (rows[k] = rows[k] || {})[lg] = k === 'kw' ? `${c} (${by} bayt)` : String(c);
}
if (process.argv[3] === '--tablo') for (const k of KEYS) console.log(k.padEnd(6), Object.entries(rows[k]).map(([lg, v]) => `${lg}=${v}`).join('  '));
// sözcük denetimi: kapalı yer: App Store alt başlığında "internetsiz" karşılığı olmamalı
const NO = /internetsiz|offline|without (an )?internet|ohne Internet|sin (conexión|red)|sem internet|sans connexion|hors ligne|인터넷 없이|オフライン|離線|ネットなし|不用網路/i;
for (const [lg, o] of Object.entries(L)) if (NO.test(o.sub || '')) { bad++; console.log('ALT BAŞLIKTA İNTERNETSİZ İDDİASI', lg, o.sub); }
for (const [lg, o] of Object.entries(L)) if (/\b24\b|24[개の條种種]|24가지|24路線/.test(o.desc + o.promo + o.short)) { bad++; console.log('ESKİ 24 SAYISI', lg); }
console.log(bad ? `${bad} sorun` : 'Hepsi sınır içinde (ad/alt başlık ≤30, tanıtım ≤170, Play kısa ≤80, anahtar ≤100 karakter ve bayt, açıklama ≤4000, sürüm notu ≤500)');
process.exit(bad ? 1 : 0);
```

## 4. Google Play mağaza girişi

**Uygulama adı** (30)

```text
Ray: Metro Bulmaca
```
```text
Ray: Metro Line Puzzle
```

**Kısa açıklama** (80)

```text
Rayları döndür, durakları bağla. Tek elle, internetsiz, sakin metro bulmacası.
```
```text
Rotate the rails, link every station. A calm, one-handed metro puzzle, offline.
```

**Tam açıklama** (4000). Aynı metin App Store açıklaması olarak da kullanılır (başka platform adı geçmez).

```text
Ray, tek elle oynanan sakin bir metro bulmacasıdır. Karoya dokun, ray 90° döner; hattı merkezden bütün duraklara bağla.
YENİ 1.2: canlı kapışma, haftalık lig, şehir metro haritası ve 7 yeni hat (toplam 33 kural hattı + sonsuz karma).
Bölümler internetsiz oynanır; kapışma ve lig için bağlantı gerekir.

Açıkta ray ucu kalmasın. Hat bağlandıkça şehir ışıl ışıl yanar.

NASIL OYNANIR
• Karoya dokun, ray döner.
• Bütün durakları merkeze bağla, açık uç bırakma.
• Üç yıldız: bölümü bitir, süre hedefini tuttur, hamle hedefini tuttur.
• Süreyi ve hamleyi birlikte tutturursan bölüm kusursuz olur, bilet kazanırsın.

CANLI KAPIŞMA VE HAFTALIK LİG
• Kapış: rastgele bir rakiple ya da kodla davet ettiğin bir arkadaşınla aynı bulmacayı yarışarak çöz. İlk bitiren kazanır, galibiyet +10 lig puanı.
• Haftalık lig: 30 kişilik bir grupta yarış. Bölüm yıldızları, Günün Hattı ve kapışma galibiyetleri puan kazandırır. Hafta bitince ilk 7 üst lige çıkar, son 5 bir alt lige düşer; 6 lig var.
• Katılmak isteğe bağlıdır. Kapışma ve lig bağlantı ister; bölümler internetsiz oynanır.

ŞEHİR HARİTASI
Biten her hat şehirde bir semti yakar. Bir hattın bütün bölümlerini kusursuz bitirirsen semt altın parlar. Şehrin büyüyüşünü Şehir sekmesinden izle.

33 HAT, SONU GELMEYEN BÖLÜMLER
Her metro hattı yeni bir kural getirir, her bölüm bir öncekinden biraz daha zordur. 33 hattan sonra oyun karma hatlarla sonsuza dek sürer. Bölümler cihazında üretilir, hepsi çözülebilir ve herkes aynı numaralı bölümde aynı bulmacayı görür.

HAT İLERLEDİKÇE YENİ KURALLAR
Eşli karo, ters karo, kayan sıra, karanlık tünel, sayaçlı karo, soğuyan karo, iki merkez, makas, mühürlü karo, döner tabla, köprü, bakım karosu, kapak, tünel ağzı, yön tabelası, halka hat, silik kol, gizli depo, sarmal tahta, nehir, kapalı durak, tarife bölgesi, son sefer, kayan sütun, ekspres durak, sinyal karosu, sarsıntı durağı, dönüşen karo, kumanda karosu, manevra karosu ve boş peron. Her yeni kural kısa, canlandırmalı bir kartla anlatılır. Tahta hiçbir zaman kalabalıklaşmaz.

GÜNÜN HATTI
Her gün herkes aynı bulmacayı çözer. Cumartesi altıgen tahtada oynanır, pazar haftanın kuralı günüdür. Gün serini koru, günlük ve haftalık görevleri tamamla.

BİLETLER, TEMALAR VE SÜRPRİZ SANDIK
Kusursuz bitirdiğin her bölüm bir bilet kazandırır. Biletlerle 25 renk temasının 22'sini açabilir ya da sürpriz sandığı açabilirsin: içinden ipucu, seri kalkanı ya da yeni bir tren kaplaması çıkar. Sandık yalnız oyunda kazanılan biletle açılır, olasılıklar sandık ekranında yazılıdır.

SEFER ŞERİDİ VE KUSURSUZ SERİ
Saatin altındaki küçük tren süre hedefine doğru ilerler. Süre geçerse oyun hemen bitmez: yalnız süre yıldızı söner ve kısa bir rötar payın olur. Son tren de kaçarsa bir can gider; canlar zamanla kendiliğinden dolar. Kusursuz bölümleri art arda bitir, seriyi büyüt, bonus bilet kazan.

GÖZ DOSTU, PİL DOSTU
Koyu, açık ve otomatik görünüm. Yumuşak renkler. Animasyonlar yalnız hareket olduğunda çalışır. Müzik, ses ve titreşim ayrı ayrı kapatılabilir. İstersen günlük hatırlatma kurabilirsin.

ÜCRETSİZ VE ADİL
Ray ücretsizdir. İpucun her gün en az 3'e tamamlanır, hat sonlarında ek ipucu kazanırsın. Reklamlar yalnız internet varken gösterilir: bölüm aralarında ara sıra bir geçiş reklamı ve yalnız sen istersen izlediğin ödüllü videolar (ek ipucu, ek can, ödülü ikiye katlama, kopan seriyi kurtarma). Günün Hattı'nda geçiş reklamı yoktur.

REKLAMSIZ PAKET
Tek seferlik satın alma. Bölüm aralarındaki reklamlar kalkar, 20 ipucu hediye edilir, 3 özel tema (Altın, Elmas, Yakut) açılır. İpucu videoları isteğe bağlı kalır.

Hesap gerekmez, kişisel bilgi istenmez. İlerlemen cihazında kalır. Lige ya da kapışmaya katılırsan yalnız takma adın, lig puanın ve kapışma ilerlemen anonim bir kimlikle sunucuda tutulur; Ayarlar › Ligden çık · verilerimi sil ile hepsi silinir.
```

```text
Ray is a calm, one-handed metro puzzle. Tap a tile, the rail turns 90°; link the line from the hub to every station.
NEW in 1.2: live duels, a weekly league, a city metro map and 7 new lines (33 rule lines plus endless mixed levels).
Levels play offline; duels and the league need a connection.

HOW TO PLAY
• Tap a tile to rotate the rail.
• Connect every station to the hub, leave no open ends.
• Three stars: finish the level, beat the time target, beat the move target.
• Hit both targets in one go and the level is flawless: you earn a ticket.

LIVE DUELS AND THE WEEKLY LEAGUE
• Duel: solve the same puzzle head to head with a random opponent or a friend you invite with a code. First to finish wins, and a win is +10 league points.
• Weekly league: compete in a group of 30. Level stars, the Daily Line and duel wins earn points; each week the top 7 move up and the bottom 5 drop down one of 6 leagues.
• Joining is optional. Duels and the league need a connection.

CITY MAP
Every finished line lights up a district of your city. Finish every level of a line perfectly and the district glows gold.

33 LINES, ENDLESS LEVELS
Each metro line brings a new rule and every level is a little harder than the one before. After 33 lines the game continues forever with mixed lines. Levels are generated on your device, every one is solvable, and everyone gets the same puzzle on the same level number.

NEW RULES AS YOU TRAVEL
Paired tiles, reverse tiles, sliding rows, dark tunnels, counter tiles, cooling tiles, two hubs, switches, sealed tiles, turntables, bridges, gear tiles, covers, tunnel portals, signposts, loop lines, faint arms, hidden depots, wrap-around boards, rivers, closed stations, fare zones, timed stations, sliding columns, express stations, signal tiles, quake stations, shifting tiles, remote tiles, shunt tiles and an empty platform. Each new rule is introduced with a short animated card, and the board never gets cluttered.

DAILY LINE
Every day everyone solves the same puzzle. Saturday is played on a hexagon board, Sunday is rule-of-the-week day. Keep your daily streak and complete daily and weekly quests.

TICKETS, THEMES AND THE SURPRISE CHEST
Every level you finish flawlessly earns a ticket. Spend tickets on 22 of the 25 color themes or open the surprise chest for a hint, a streak shield or a new train livery. The chest only opens with tickets earned in the game, and its odds are shown on the chest screen.

TRAIN STRIP AND FLAWLESS STREAK
A little train below the clock rolls toward your time target. When the target passes the game does not end at once: only the time star goes out and you get a short delay. If the last train leaves too, you lose a life; lives refill on their own over time. Finish flawless levels in a row, grow your streak and earn bonus tickets.

EASY ON THE EYES AND THE BATTERY
Dark, light and automatic appearance. Soft colors. Animations only run while something is moving. Music, sound effects and vibration can each be turned off. Set a daily reminder if you like.

FREE AND FAIR
Ray is free to play. Your hints are topped up to at least 3 every day, and you earn extra hints at the end of each line. Ads are only shown when you are online: an occasional interstitial between levels, and rewarded videos only when you choose to watch them (extra hints, an extra life, doubling a reward, saving a broken streak). The Daily Line has no interstitials.

AD-FREE PACK
A one-time purchase. Removes the ads between levels, gives you 20 hints and unlocks 3 exclusive themes (Gold, Diamond, Ruby). Hint videos stay optional.

No account needed and no personal details asked. Your progress stays on your device. If you join the league or a duel, only your nickname, league points and duel progress are stored on a server under an anonymous ID; Settings > Leave league · delete my data removes them.

Available in English, German, Spanish, Portuguese, French, Korean, Japanese, Traditional Chinese and Turkish.
```

**Diğer Play alanları**

| Alan | Değer |
|---|---|
| Uygulama mı, oyun mu | Oyun |
| Kategori | Bulmaca (Puzzle) |
| Etiketler (en çok 5, önerilen) | Bulmaca, Mantık, Gündelik, Tek oyunculu, Çok oyunculu (1.2 kapışma; "Çevrimdışı" yalnız bölümler için doğru) |
| Ücretli / ücretsiz | Ücretsiz (yayından sonra ücretliye çevrilemez) |
| İletişim e-postası | osmanadali.apps@gmail.com |
| Web sitesi | https://osmanadali.github.io (app-ads.txt için, bkz. §12) |
| Sürüm notu (1.2) | `1.2: canlı kapışma, haftalık lig ve şehir metro haritası geldi. 7 yeni kurallı hat (toplam 33 hat). Bölümler internetsiz oynanır; kapışma ve lig bağlantı ister.` |
| Sürüm notu (1.2, EN) | `1.2: live duels, a weekly league and a city metro map. 7 new rule lines (33 in total). Levels play offline; duels and the league need a connection.` |

## 5. App Store girişi

**Fiyat:** Ücretsiz (App Store Connect › Fiyatlandırma ve Uygunluk › Fiyat **0,00 $ / Ücretsiz**). Uygulamanın kendisi ücretsiz indirilir; tek ücretli şey isteğe bağlı Reklamsız paket (§10).

**Ad** (30)

```text
Ray: Metro Bulmaca
```
```text
Ray: Metro Line Puzzle
```

**Alt başlık** (30)

```text
Hattı bağla, tek elle, sakin
```
```text
Connect the line, one-handed
```

**Tanıtım metni** (170). Sürüm göndermeden değiştirilebilir; kampanya ve yeni kural duyurusu için kullanılır.

```text
Yeni: canlı kapışma ve haftalık lig! Rayları döndür, durakları bağla, kusursuz bitir. 33 hat, şehir metro haritası ve her gün yeni bir Günün Hattı.
```
```text
New: live duels and a weekly league! Rotate the rails, link every station, finish flawlessly. 33 lines, a city metro map and a new Daily Line every day.
```

**Açıklama** (4000): §4'teki tam açıklamanın aynısı.

**Anahtar kelimeler** (100, virgülle, boşluksuz). Ad ve alt başlıktaki sözcükler (ray, metro, bulmaca, hat, bağla, tek elle, sakin) zaten aranır; burada tekrarlanmaz. "offline" (çevrimdışı arama) anahtar alanında kalır, alt başlıkta "internetsiz" yoktur: 1.2'de lig ve kapışma bağlantı ister.

```text
boru,tren,durak,istasyon,zeka,mantık,beyin,günlük,karo,net,pipes,lig,kapışma,harita,offline
```
```text
pipes,net,subway,train,station,logic,brain,daily,relaxing,rotate,tiles,map,zen,duel,league,offline
```

| Alan | Değer |
|---|---|
| Birincil kategori | Oyunlar › Bulmaca (Games › Puzzle) |
| İkinci oyun alt kategorisi (isteğe bağlı) | Gündelik (Casual) |
| Destek URL'si | https://osmanadali.github.io/mobil-oyun/gizlilik.html |
| Pazarlama URL'si | https://osmanadali.github.io/mobil-oyun/ |
| Gizlilik politikası URL'si | https://osmanadali.github.io/mobil-oyun/gizlilik.html |
| Telif | © 2026 Osman Adalı |
| Şifreleme (export compliance) | Muaf olmayan şifreleme yok (`ITSAppUsesNonExemptEncryption = false`, iOS hazırlık betiği yazar) |
| Üçüncü taraf içerik | "Evet, gerekli haklara sahibim" (Outfit yazı tipi SIL OFL lisanslıdır; reklamlar AdMob'dan gelir) |

## 5b. Almanca, İspanyolca, Portekizce (Brezilya), Fransızca

Oyun bu dillerde de açılır (cihaz dili ya da Ayarlar › Dil). Play Console › Mağaza girişi › Çeviriler'e `de-DE`, `es-ES` (Latin Amerika için `es-419` aynı metinle), `pt-BR`, `fr-FR`; App Store Connect'te German, Spanish (Spain / Mexico), Portuguese (Brazil), French olarak eklenir. Terimler oyundakiyle aynıdır (docs/CEVIRI.md §3). Her dilin kendi ekran görüntüleri ve öne çıkan görseli var (`store/screens-<dil>/`, `store/feature-graphic-<dil>.png`; oyun o dilde açılır, başlıklar o dilde). Başlık metinleri `tools/store-shots.cjs` içindeki `TX` tablosundadır.

| Metin | Sınır | DE | ES | PT-BR | FR |
|---|---|---|---|---|---|
| Uygulama adı / ad | 30 | 23 | 26 | 27 | 21 |
| Play kısa açıklama | 80 | 78 | 79 | 79 | 77 |
| App Store alt başlık | 30 | 27 | 26 | 27 | 28 |
| App Store tanıtım metni | 170 | 156 | 158 | 160 | 164 |
| Anahtar kelimeler | 100 | 96 (97 bayt) | 93 (96 bayt) | 85 (91 bayt) | 94 (95 bayt) |
| Tam açıklama | 4000 | 3953 | 3906 | 3784 | 3963 |
| Sürüm notu (1.2) | 500 | 150 | 174 | 160 | 182 |

### Deutsch (de-DE)

**Name**
```text
Ray: Metro-Linienrätsel
```
**Kurzbeschreibung** (Play)
```text
Dreh die Gleise, verbinde jede Station. Ruhiges Rätsel für eine Hand, offline.
```
**Untertitel** (App Store)
```text
Linien verbinden, einhändig
```
**Werbetext** (App Store)
```text
Neu: Live-Duelle und Wochenliga! Dreh die Gleise, verbinde jede Station, spiel perfekt. 33 Linien, eine Metro-Stadtkarte und jeden Tag eine neue Tageslinie.
```
**Schlüsselwörter** (App Store)
```text
rohre,netz,ubahn,zug,bahnhof,logik,denkspiel,täglich,drehen,kacheln,karte,zen,liga,duell,offline
```
**Beschreibung**
```text
Ray ist ein ruhiges Metro-Rätsel für eine Hand. Tippe eine Kachel an, das Gleis dreht sich um 90°; verbinde die Linie von der Zentrale mit jeder Station.
NEU in 1.2: Live-Duelle, Wochenliga, Metro-Stadtkarte und 7 neue Linien (33 Regel-Linien plus endlose Mischlevel).
Level laufen offline; Duelle und Liga brauchen eine Verbindung.

Lass keine offenen Gleisenden übrig. Mit jeder Verbindung leuchtet die Stadt auf.

SO WIRD GESPIELT
• Tippe eine Kachel an, um das Gleis zu drehen.
• Verbinde jede Station mit dem Zentrum, ohne offene Enden.
• Drei Sterne: Level schaffen, Zeitziel schaffen, Zugziel schaffen.
• Schaffst du beide Ziele auf einmal, ist das Level perfekt: Du bekommst ein Ticket.

LIVE-DUELLE UND WOCHENLIGA
• Duell: Löse dasselbe Rätsel gegen einen zufälligen Gegner oder einen Freund, den du per Code einlädst. Wer zuerst fertig ist, gewinnt: +10 Ligapunkte.
• Wochenliga: Tritt in einer Gruppe von 30 an. Level-Sterne, die Tageslinie und Duellsiege bringen Punkte. Am Ende der Woche steigen die ersten 7 eine Liga auf, die letzten 5 steigen ab; es gibt 6 Ligen.
• Mitmachen ist freiwillig. Duelle und Liga brauchen eine Verbindung; die Level spielst du offline.

STADTKARTE
Jede fertige Linie erhellt ein Viertel deiner Stadt. Schaffst du alle Level einer Linie perfekt, leuchtet das Viertel golden. Sieh zu, wie deine Stadt wächst.

33 LINIEN, ENDLOSE LEVEL
Jede Metrolinie bringt eine neue Regel, jedes Level ist etwas schwerer als das vorige. Nach 33 Linien geht es mit gemischten Linien endlos weiter. Die Level entstehen auf deinem Gerät, jedes ist lösbar, und alle bekommen bei derselben Levelnummer dasselbe Rätsel.

NEUE REGELN UNTERWEGS
Paarkacheln, Umkehrkacheln, Schiebereihen, dunkle Tunnel, Zählkacheln, Frostkacheln, zwei Zentren, Weichen, Siegelkacheln, Drehscheiben, Brücken, Zahnradkacheln, Abdeckungen, Tunnelportale, Wegweiser, Ringlinien, blasse Arme, versteckte Depots, Endlosbretter, Flüsse, geschlossene Stationen, Tarifzonen, Zeitstationen, Schiebespalten, Expressstationen, Signalkacheln, Bebenstationen, Wandelkacheln, Fernbedienkacheln, Rangierkacheln und ein leerer Bahnsteig. Jede neue Regel stellt eine kurze animierte Karte vor, und das Brett wird nie unübersichtlich.

TAGESLINIE
Jeden Tag lösen alle dasselbe Rätsel. Samstags spielst du auf einem Sechseckbrett, sonntags gibt es die Regel der Woche. Halte deine Serie und erfülle tägliche und wöchentliche Aufgaben.

TICKETS, THEMEN UND ÜBERRASCHUNGSKISTE
Jedes perfekte Level bringt ein Ticket. Gib Tickets für 22 der 25 Farbthemen aus oder öffne die Überraschungskiste: Tipps, ein Serienschild oder ein neuer Zuglack. Die Kiste öffnet sich nur mit im Spiel verdienten Tickets, die Chancen stehen im Kistenbildschirm.

ANGENEHM FÜR AUGEN UND AKKU
Dunkles, helles und automatisches Design. Sanfte Farben. Animationen laufen nur, wenn sich etwas bewegt. Musik, Soundeffekte und Vibration lassen sich einzeln abschalten. Auf Wunsch gibt es eine tägliche Erinnerung.

KOSTENLOS UND FAIR
Ray ist kostenlos. Deine Tipps werden jeden Tag auf mindestens 3 aufgefüllt, am Ende jeder Linie gibt es Extratipps. Werbung erscheint nur online: ab und zu zwischen Leveln und als Belohnungsvideo nur, wenn du es willst (Extratipps, ein Extraleben, Belohnung verdoppeln, gerissene Serie retten). Die Tageslinie hat keine Zwischenwerbung.

WERBEFREI-PAKET
Einmaliger Kauf. Entfernt die Werbung zwischen Leveln, schenkt dir 20 Tipps und schaltet 3 exklusive Themen frei (Gold, Diamant, Rubin). Tipp-Videos bleiben freiwillig.

Kein Konto nötig, keine persönlichen Daten. Dein Fortschritt bleibt auf deinem Gerät. Wenn du an Liga oder Duell teilnimmst, werden nur dein Spitzname, deine Ligapunkte und dein Duellfortschritt mit einer anonymen Kennung auf einem Server gespeichert; Einstellungen › Liga verlassen · meine Daten löschen entfernt sie.

Auf Deutsch, Englisch, Spanisch, Portugiesisch, Französisch, Koreanisch, Japanisch, traditionellem Chinesisch und Türkisch.
```
**Versionshinweis**
```text
1.2: Live-Duelle, Wochenliga und Metro-Stadtkarte. 7 neue Regel-Linien (insgesamt 33). Level laufen offline; Duelle und Liga brauchen eine Verbindung.
```

### Español (es-ES · es-419)

**Nombre**
```text
Ray: Puzle de Líneas Metro
```
**Descripción breve** (Play)
```text
Gira las vías y conecta cada estación. Un puzle tranquilo de metro, a una mano.
```
**Subtítulo** (App Store)
```text
Conecta líneas, a una mano
```
**Texto promocional** (App Store)
```text
Novedad: duelos en vivo y liga semanal. Gira las vías, conecta cada estación y termina perfecto. 33 líneas, mapa metro de la ciudad y una Línea del día nueva.
```
**Palabras clave** (App Store)
```text
tuberías,red,subte,tren,estación,lógica,mente,diario,girar,piezas,mapa,zen,liga,duelo,offline
```
**Descripción**
```text
Ray es un puzle de metro tranquilo para jugar con una mano. Toca una pieza y la vía gira 90°; lleva la línea del centro a cada estación.
NOVEDAD 1.2: duelos en vivo, liga semanal, mapa metro de la ciudad y 7 líneas nuevas (33 líneas con reglas y niveles mixtos sin fin).
Los niveles se juegan sin red; los duelos y la liga necesitan conexión.

No dejes extremos sueltos. Con cada conexión, la ciudad se ilumina.

CÓMO SE JUEGA
• Toca una pieza para girar la vía.
• Conecta cada estación con el centro, sin extremos abiertos.
• Tres estrellas: termina el nivel, cumple el objetivo de tiempo y el de jugadas.
• Cumple los dos a la vez y el nivel es perfecto: ganas un billete.

DUELOS EN VIVO Y LIGA SEMANAL
• Duelo: resuelve el mismo puzle contra un rival al azar o un amigo al que invitas con un código. Gana quien termine primero: +10 puntos de liga.
• Liga semanal: compite en un grupo de 30. Las estrellas de los niveles, la Línea del día y las victorias en duelo dan puntos. Al acabar la semana, los 7 primeros suben de liga y los 5 últimos bajan; hay 6 ligas.
• Participar es opcional. Los duelos y la liga necesitan conexión; los niveles se juegan sin red.

MAPA DE LA CIUDAD
Cada línea terminada ilumina un barrio de tu ciudad. Si terminas perfectos todos los niveles de una línea, el barrio brilla en oro. Mira cómo crece tu ciudad.

33 LÍNEAS, NIVELES SIN FIN
Cada línea de metro trae una regla nueva y cada nivel es un poco más difícil que el anterior. Tras 33 líneas, el juego sigue para siempre con líneas mixtas. Los niveles se crean en tu dispositivo, todos tienen solución y todo el mundo juega el mismo puzle en el mismo número de nivel.

REGLAS NUEVAS POR EL CAMINO
Piezas gemelas, piezas inversas, filas deslizantes, túneles oscuros, piezas contador, piezas heladas, dos centros, desvíos, piezas selladas, plataformas giratorias, puentes, piezas engranaje, tapas, bocas de túnel, señales, líneas circulares, brazos tenues, depósitos ocultos, tableros sin bordes, ríos, estaciones cerradas, zonas tarifarias, estaciones con reloj, columnas deslizantes, estaciones exprés, piezas de señal, estaciones sísmicas, piezas cambiantes, piezas mando, piezas de maniobra y un andén vacío. Cada regla nueva se presenta con una tarjeta animada corta y el tablero nunca se satura.

LÍNEA DEL DÍA
Cada día todos resuelven el mismo puzle. El sábado se juega en un tablero hexagonal y el domingo toca la regla de la semana. Mantén tu racha y completa misiones diarias y semanales.

BILLETES, TEMAS Y COFRE SORPRESA
Cada nivel perfecto te da un billete. Gástalos en 22 de los 25 temas de color o abre el cofre sorpresa: pistas, un escudo de racha o un nuevo diseño de tren. El cofre solo se abre con billetes ganados jugando y las probabilidades se ven en su pantalla.

CUIDA TUS OJOS Y TU BATERÍA
Tema oscuro, claro y automático. Colores suaves. Las animaciones solo funcionan cuando algo se mueve. Música, efectos y vibración se apagan por separado. Si quieres, activa un aviso diario.

GRATIS Y JUSTO
Ray es gratis. Tus pistas se recargan cada día hasta al menos 3 y ganas pistas extra al final de cada línea. Los anuncios solo salen con conexión: alguno entre niveles y vídeos con premio solo si tú quieres (pistas extra, una vida extra, doblar un premio, salvar una racha rota). La Línea del día no tiene anuncios intersticiales.

PAQUETE SIN ANUNCIOS
Compra única. Quita los anuncios entre niveles, te regala 20 pistas y desbloquea 3 temas exclusivos (Oro, Diamante, Rubí). Los vídeos de pistas siguen siendo opcionales.

Sin cuenta y sin datos personales. Tu progreso se queda en tu dispositivo. Si juegas en la liga o en un duelo, solo tu apodo, tus puntos de liga y tu avance en el duelo se guardan en un servidor con un identificador anónimo; Ajustes › Salir de la liga · borrar mis datos los elimina.

En español, inglés, alemán, portugués, francés, coreano, japonés, chino tradicional y turco.
```
**Notas de la versión**
```text
1.2: duelos en vivo, liga semanal y mapa metro de la ciudad. 7 líneas nuevas con reglas (33 en total). Los niveles se juegan sin red; los duelos y la liga necesitan conexión.
```

### Português (pt-BR)

**Nome**
```text
Ray: Quebra-Cabeça do Metrô
```
**Descrição curta** (Play)
```text
Gire os trilhos, ligue as estações. Quebra-cabeça calmo de metrô, para uma mão.
```
**Subtítulo** (App Store)
```text
Conecte linhas, com uma mão
```
**Texto promocional** (App Store)
```text
Novo: duelos ao vivo e liga semanal! Gire os trilhos, ligue cada estação, termine perfeito. 33 linhas, mapa do metrô da cidade e uma Linha do Dia nova todo dia.
```
**Palavras-chave** (App Store)
```text
canos,rede,trem,estação,lógica,cérebro,diário,girar,peças,mapa,zen,liga,duelo,offline
```
**Descrição**
```text
Ray é um quebra-cabeça de metrô calmo, para uma mão. Toque numa peça e o trilho gira 90°; ligue a linha do centro a cada estação.
NOVO na 1.2: duelos ao vivo, liga semanal, mapa do metrô da cidade e 7 linhas novas (33 linhas com regras e fases mistas sem fim).
As fases rodam offline; duelos e liga precisam de conexão.

Sem pontas soltas. A cada ligação, a cidade se acende.

COMO JOGAR
• Toque numa peça para girar o trilho.
• Ligue cada estação ao centro, sem pontas abertas.
• Três estrelas: termine a fase, bata a meta de tempo e a meta de jogadas.
• Bata as duas de uma vez e a fase fica perfeita: você ganha um bilhete.

DUELOS AO VIVO E LIGA SEMANAL
• Duelo: resolva o mesmo quebra-cabeça contra um rival aleatório ou um amigo convidado por código. Quem terminar primeiro vence: +10 pontos de liga.
• Liga semanal: dispute num grupo de 30. Estrelas das fases, a Linha do Dia e vitórias em duelos dão pontos. Ao fim da semana, os 7 primeiros sobem de liga e os 5 últimos descem; são 6 ligas.
• Participar é opcional. Duelos e liga precisam de conexão; as fases rodam offline.

MAPA DA CIDADE
Cada linha concluída acende um bairro da sua cidade. Termine todas as fases de uma linha com perfeição e o bairro brilha em dourado. Veja sua cidade crescer.

33 LINHAS, FASES SEM FIM
Cada linha de metrô traz uma regra nova e cada fase é um pouco mais difícil que a anterior. Depois de 33 linhas, o jogo continua para sempre com linhas mistas. As fases são criadas no seu aparelho, todas têm solução e todo mundo recebe o mesmo quebra-cabeça no mesmo número de fase.

REGRAS NOVAS PELO CAMINHO
Peças gêmeas, peças inversas, fileiras deslizantes, túneis escuros, peças contador, peças geladas, dois centros, desvios, peças lacradas, plataformas giratórias, pontes, peças engrenagem, tampas, bocas de túnel, placas, linhas circulares, braços apagados, depósitos ocultos, tabuleiros sem bordas, rios, estações fechadas, zonas tarifárias, estações com relógio, colunas deslizantes, estações expressas, peças de sinal, estações sísmicas, peças mutantes, peças controle, peças de manobra e uma plataforma vazia. Cada regra nova chega com um cartão animado curto, e o tabuleiro nunca fica poluído.

LINHA DO DIA
Todo dia todo mundo resolve o mesmo quebra-cabeça. No sábado se joga num tabuleiro hexagonal e domingo é dia da regra da semana. Mantenha sua sequência e complete missões diárias e semanais.

BILHETES, TEMAS E BAÚ SURPRESA
Cada fase perfeita rende um bilhete. Use bilhetes em 22 dos 25 temas de cores ou abra o baú surpresa: dicas, um escudo de sequência ou uma nova pintura de trem. O baú só abre com bilhetes ganhos no jogo, e as chances aparecem na tela do baú.

BOM PARA OS OLHOS E PARA A BATERIA
Tema escuro, claro e automático. Cores suaves. As animações só rodam quando algo se mexe. Música, efeitos e vibração desligam separadamente. Se quiser, ative um lembrete diário.

GRÁTIS E JUSTO
Ray é grátis. Suas dicas voltam a pelo menos 3 todo dia, e você ganha dicas extras no fim de cada linha. Anúncios só aparecem com internet: um de vez em quando entre fases e vídeos premiados só se você quiser (dicas extras, uma vida extra, dobrar o prêmio, salvar uma sequência perdida). A Linha do Dia não tem anúncios intersticiais.

PACOTE SEM ANÚNCIOS
Compra única. Tira os anúncios entre as fases, dá 20 dicas de presente e libera 3 temas exclusivos (Ouro, Diamante, Rubi). Os vídeos de dicas continuam opcionais.

Sem conta e sem dados pessoais. Seu progresso fica no seu aparelho. Se você entrar na liga ou num duelo, só seu apelido, seus pontos de liga e o andamento do duelo ficam num servidor, com um identificador anônimo; Ajustes › Sair da liga · apagar meus dados remove tudo.

Em português, inglês, espanhol, alemão, francês, coreano, japonês, chinês tradicional e turco.
```
**Notas da versão**
```text
1.2: duelos ao vivo, liga semanal e mapa do metrô da cidade. 7 linhas novas com regras (33 no total). As fases rodam offline; duelos e liga precisam de conexão.
```

### Français (fr-FR)

**Nom**
```text
Ray : Puzzle de Métro
```
**Description courte** (Play)
```text
Tourne les rails, relie chaque station. Un puzzle de métro calme, à une main.
```
**Sous-titre** (App Store)
```text
Relie les lignes, à une main
```
**Texte promotionnel** (App Store)
```text
Nouveau : duels en direct et ligue hebdo ! Tourne les rails, relie chaque station, finis parfait. 33 lignes, plan de métro de la ville et une Ligne du jour inédite.
```
**Mots-clés** (App Store)
```text
tuyaux,réseau,train,gare,logique,cerveau,quotidien,tourner,tuiles,carte,zen,ligue,duel,offline
```
**Description**
```text
Ray est un puzzle de métro calme, à jouer d’une main. Touche une tuile et le rail tourne de 90° ; relie la ligne du centre à chaque station.
NOUVEAU en 1.2 : duels en direct, ligue hebdo, plan de métro de la ville et 7 nouvelles lignes (33 lignes à règles et niveaux mixtes sans fin).
Les niveaux se jouent hors ligne ; duels et ligue demandent une connexion.

COMMENT JOUER
• Touche une tuile pour tourner le rail.
• Relie chaque station au centre, sans bout ouvert.
• Trois étoiles : finis le niveau, tiens l’objectif de temps et l’objectif de coups.
• Tiens les deux à la fois et le niveau est parfait : tu gagnes un ticket.

DUELS EN DIRECT ET LIGUE HEBDO
• Duel : résous le même puzzle face à un adversaire au hasard ou à un ami invité par code. Le premier à finir gagne : +10 points de ligue.
• Ligue hebdo : joue dans un groupe de 30. Les étoiles des niveaux, la Ligne du jour et les victoires en duel rapportent des points. Chaque semaine, 7 joueurs montent et 5 descendent parmi 6 ligues.
• Participer est facultatif. Les duels et la ligue demandent une connexion.

PLAN DE LA VILLE
Chaque ligne finie éclaire un quartier de ta ville. Termine parfaitement tous les niveaux d’une ligne et le quartier brille en or.

33 LIGNES, DES NIVEAUX SANS FIN
Chaque ligne de métro apporte une nouvelle règle et chaque niveau est un peu plus dur que le précédent. Après 33 lignes, le jeu continue à l’infini avec des lignes mixtes. Les niveaux sont créés sur ton appareil, tous ont une solution et tout le monde a le même puzzle au même numéro de niveau.

DE NOUVELLES RÈGLES EN ROUTE
Tuiles jumelles, tuiles inverses, rangées glissantes, tunnels sombres, tuiles compteur, tuiles givrées, deux centres, aiguillages, tuiles scellées, plaques tournantes, ponts, tuiles engrenage, caches, portails de tunnel, panneaux, lignes circulaires, bras pâles, dépôts cachés, plateaux sans bords, rivières, stations fermées, zones tarifaires, stations minutées, colonnes glissantes, stations express, tuiles signal, stations sismiques, tuiles changeantes, tuiles télécommande, tuiles de manœuvre et un quai vide. Chaque nouvelle règle est présentée par une courte carte animée, et le plateau ne devient jamais surchargé.

LIGNE DU JOUR
Chaque jour, tout le monde résout le même puzzle. Le samedi se joue sur un plateau hexagonal, le dimanche c’est la règle de la semaine. Garde ta série et accomplis les quêtes du jour et de la semaine.

TICKETS, THÈMES ET COFFRE SURPRISE
Chaque niveau parfait rapporte un ticket. Dépense-les pour 22 des 25 thèmes de couleur ou ouvre le coffre surprise : des indices, un bouclier de série ou une nouvelle livrée de train. Le coffre ne s’ouvre qu’avec des tickets gagnés en jeu, et ses chances sont affichées sur son écran.

DOUX POUR LES YEUX ET LA BATTERIE
Thème sombre, clair et automatique. Couleurs douces. Les animations ne tournent que quand quelque chose bouge. Musique, effets sonores et vibration se coupent séparément. Un rappel quotidien si tu veux.

GRATUIT ET ÉQUITABLE
Ray est gratuit. Tes indices remontent à au moins 3 chaque jour, et tu gagnes des indices en plus à la fin de chaque ligne. Les pubs n’apparaissent qu’en ligne : de temps en temps entre deux niveaux, et des vidéos récompensées seulement si tu le choisis (indices en plus, une vie en plus, récompense doublée, série brisée sauvée). La Ligne du jour n’a pas de pub interstitielle.

PACK SANS PUB
Achat unique. Supprime les pubs entre les niveaux, offre 20 indices et débloque 3 thèmes exclusifs (Or, Diamant, Rubis). Les vidéos d’indices restent facultatives.

Pas de compte, aucune donnée personnelle. Ta progression reste sur ton appareil. Si tu rejoins la ligue ou un duel, seuls ton pseudo, tes points de ligue et ta progression en duel sont stockés sur un serveur avec un identifiant anonyme ; Réglages › Quitter la ligue · supprimer mes données les efface.

En français, anglais, allemand, espagnol, portugais, coréen, japonais, chinois traditionnel et turc.
```
**Notes de version**
```text
1.2 : duels en direct, ligue hebdo et plan de métro de la ville. 7 nouvelles lignes à règles (33 au total). Les niveaux se jouent hors ligne ; duels et ligue demandent une connexion.
```

## 5c. Korece, Japonca, Geleneksel Çince (1.1)

1.1 sürümüyle gelir (1.0 incelemedeyken eklenmedi). Play Console › Mağaza girişi › Çeviriler'e `ko-KR`, `ja-JP`, `zh-TW`; App Store Connect'te Korean, Japanese, Chinese (Traditional) olarak eklenir. **Basitleştirilmiş Çince (`zh-CN`, Chinese Simplified) eklenmez**: oyun o cihazlarda İngilizce açılır. Hong Kong için Play'de ayrıca `zh-HK` gerekirse aynı Geleneksel Çince metin kullanılır. Terimler oyundakiyle aynıdır (`tools/diller/sozluk-1.txt` başındaki terim listesi, docs/CEVIRI.md §1c). Ekran görüntüleri ve öne çıkan görsel `store/screens-{ko,ja,zh-Hant}/`, `store/feature-graphic-{ko,ja,zh-Hant}.png`; başlıklar `tools/store-shots.cjs` `TX` tablosunda.

Korece metne yayından önce anadili Korece olan biri (kullanıcının Koreli arkadaşı) göz atmalı; Japonca ve Çince için de mümkünse birer okuma iyi olur.

App Store anahtar kelime sınırı 100'dür; bazı araçlar bayt saydığı için (CJK harfi UTF-8'de 3 bayt) üç dilde de 100 baytı aşmaz (ko 99, ja 100, zh 100 bayt; 1.2'de "offline/オフライン/離線", "liga/대결" gibi sözcükler eklendi). Sayılar karakterdir, anahtar kelimelerde parantez içi bayttır.

| Metin | Sınır | KO | JA | ZH-HANT |
|---|---|---|---|---|
| Uygulama adı / ad | 30 | 14 | 13 | 11 |
| Play kısa açıklama | 80 | 48 | 44 | 33 |
| App Store alt başlık | 30 | 15 | 16 | 9 |
| App Store tanıtım metni | 170 | 83 | 69 | 58 |
| Anahtar kelimeler | 100 | 41 (99 bayt) | 40 (100 bayt) | 42 (100 bayt) |
| Tam açıklama | 4000 | 2101 | 1930 | 1428 |
| Sürüm notu (1.2) | 500 | 90 | 75 | 63 |

### 한국어 (ko-KR)

**이름**
```text
Ray: 지하철 노선 퍼즐
```
**간단한 설명** (Play)
```text
선로를 돌려 모든 역을 이어요. 한 손으로 즐기는 차분한 지하철 퍼즐, 오프라인 가능.
```
**부제** (App Store)
```text
한 손으로 노선을 잇는 퍼즐
```
**프로모션 텍스트** (App Store)
```text
신규: 실시간 대결과 주간 리그! 선로를 돌려 모든 역을 잇고 퍼펙트로 깨 보세요. 33개 노선, 도시 노선도, 매일 새로운 오늘의 노선이 기다려요.
```
**키워드** (App Store)
```text
파이프,연결,기차,역,두뇌,논리,힐링,타일,회전,노선도,오프라인,리그,대결
```
**설명**
```text
Ray는 한 손으로 즐기는 차분한 지하철 퍼즐이에요. 타일을 탭하면 선로가 90° 돌아가요. 허브역의 노선을 모든 역까지 이어 주세요.
1.2 신규: 실시간 대결, 주간 리그, 도시 노선도, 새 노선 7개(규칙 노선 33개 + 끝없는 혼합 레벨).
레벨은 오프라인으로 즐기고, 대결과 리그는 인터넷 연결이 필요해요.

끊긴 선로 끝이 남으면 안 돼요. 노선이 이어질수록 도시에 불이 켜져요.

게임 방법
• 타일을 탭해서 선로를 돌려요.
• 모든 역을 허브에 연결하고, 끊긴 끝을 남기지 마세요.
• 별 3개: 레벨 클리어, 시간 목표 달성, 이동 목표 달성.
• 두 목표를 한 번에 달성하면 퍼펙트! 티켓을 받아요.

실시간 대결과 주간 리그
• 대결: 무작위 상대나 코드로 초대한 친구와 같은 퍼즐을 겨뤄요. 먼저 끝내면 승리, 리그 점수 +10점이에요.
• 주간 리그: 30명 그룹에서 겨뤄요. 레벨 별, 오늘의 노선, 대결 승리로 점수를 얻어요. 한 주가 끝나면 상위 7명은 위 리그로 올라가고 하위 5명은 내려가요. 리그는 모두 6개예요.
• 참여는 선택이에요. 대결과 리그는 인터넷 연결이 필요하고, 레벨은 오프라인으로 즐길 수 있어요.

도시 노선도
끝낸 노선마다 도시의 구역이 하나씩 밝아져요. 한 노선의 모든 레벨을 퍼펙트로 깨면 그 구역이 황금빛으로 빛나요. 도시가 자라는 모습을 지켜보세요.

33개 노선, 끝없는 레벨
지하철 노선마다 새로운 규칙이 등장하고, 레벨은 조금씩 어려워져요. 33개 노선이 끝나면 여러 규칙이 섞인 노선이 끝없이 이어져요. 레벨은 기기에서 만들어지고, 모두 풀 수 있으며, 같은 레벨 번호에서는 누구나 같은 퍼즐을 만나요.

여행할수록 새로운 규칙
짝 타일, 역회전 타일, 가로 슬라이드, 어두운 터널, 카운터 타일, 얼음 타일, 두 허브, 전환기, 봉인 타일, 회전대, 다리, 톱니 타일, 덮개, 터널 입구, 표지판, 순환선, 흐릿한 가지, 숨은 차고, 끝없는 보드, 강, 폐쇄역, 요금 구역, 시간제한 역, 세로 슬라이드, 급행역, 신호 타일, 지진역, 변신 타일, 리모컨 타일, 입환 타일, 빈 승강장까지 만나요. 새 규칙은 짧은 애니메이션 카드로 소개되고, 보드는 결코 복잡해지지 않아요.

오늘의 노선
매일 모두가 같은 퍼즐을 풀어요. 토요일은 육각형 보드, 일요일은 이번 주 규칙의 날이에요. 연속 기록을 이어 가고 일일·주간 미션을 완료하세요.

티켓, 테마, 깜짝 상자
퍼펙트로 깬 레벨마다 티켓 1장을 받아요. 티켓으로 색상 테마 25종 중 22종을 열거나 깜짝 상자를 열어 힌트, 연속 기록 보호막, 새 열차 도색을 얻으세요. 상자는 게임에서 모은 티켓으로만 열 수 있고, 확률은 상자 화면에 표시돼요.

운행 바와 퍼펙트 연속 기록
시계 아래의 작은 열차가 시간 목표를 향해 달려요. 목표 시간이 지나도 게임은 바로 끝나지 않아요. 시간 별만 꺼지고 잠깐의 지연 시간이 주어져요. 막차까지 놓치면 하트 1개를 잃지만, 하트는 시간이 지나면 저절로 채워져요. 퍼펙트 레벨을 연달아 깨서 연속 기록을 늘리고 보너스 티켓을 받으세요.

눈과 배터리에 편안하게
다크, 라이트, 자동 화면. 부드러운 색감. 애니메이션은 무언가 움직일 때만 작동해요. 음악, 효과음, 진동은 따로 끌 수 있어요. 원하면 매일 알림을 설정할 수 있어요.

무료이고 공정하게
Ray는 무료예요. 힌트는 매일 최소 3개까지 채워지고, 노선이 끝날 때마다 힌트를 더 받아요. 광고는 온라인일 때만 나와요. 레벨 사이에 가끔 나오는 전면 광고, 그리고 원할 때만 보는 보상형 영상(추가 힌트, 추가 하트, 보상 2배, 끊긴 연속 기록 지키기)이 전부예요. 오늘의 노선에는 전면 광고가 없어요.

광고 제거 팩
한 번만 구매하면 돼요. 레벨 사이 광고가 사라지고, 힌트 20개를 선물로 받으며, 특별 테마 3종(골드, 다이아몬드, 루비)이 열려요. 힌트 영상은 계속 선택 사항이에요.

계정이 필요 없고 개인정보도 묻지 않아요. 진행 상황은 기기에만 저장돼요. 리그나 대결에 참여하면 닉네임, 리그 점수, 대결 진행 상황만 익명 ID로 서버에 저장되며, 설정 › 리그 나가기 · 내 데이터 삭제로 지울 수 있어요.

한국어, 영어, 일본어, 중국어(번체), 독일어, 스페인어, 포르투갈어, 프랑스어, 튀르키예어를 지원해요.
```
**업데이트 내용**
```text
1.2: 실시간 대결, 주간 리그, 도시 노선도가 추가됐어요. 규칙 노선 7개(총 33개)도 늘었어요. 레벨은 오프라인으로, 대결과 리그는 인터넷 연결로 즐겨요.
```

### 日本語 (ja-JP)

**名前**
```text
Ray: メトロ路線パズル
```
**簡単な説明**（Play）
```text
線路を回して、すべての駅をつなごう。片手でオフラインでも遊べる、落ち着いたメトロパズル。
```
**サブタイトル**（App Store）
```text
片手でつなぐ、のんびり路線パズル
```
**プロモーションテキスト**（App Store）
```text
新登場：ライブ対戦と週間リーグ！線路を回して駅をつなぎ、パーフェクトを目指そう。33路線、街のメトロ路線図、毎日あたらしい「今日の路線」。
```
**キーワード**（App Store）
```text
パイプ,電車,駅,脳トレ,ロジック,回転,タイル,癒し,オフライン,対戦,リーグ
```
**説明**
```text
Rayは、片手で遊べる落ち着いたメトロパズルです。タイルをタップすると線路が90°回ります。中央のハブ駅から、すべての駅へ路線をつなぎましょう。
1.2の新機能：ライブ対戦、週間リーグ、街のメトロ路線図、新路線7本（ルール路線33本＋終わらない混合ステージ）。
ステージはオフラインで遊べます。対戦とリーグはネット接続が必要です。

線路の行き止まりを残してはいけません。路線がつながるほど、街に明かりが灯ります。

遊び方
• タイルをタップして線路を回す。
• すべての駅をハブにつなぎ、行き止まりを残さない。
• 星3つ：ステージをクリア、タイム目標を達成、手数目標を達成。
• ふたつの目標を同時に達成するとパーフェクト。切符がもらえます。

ライブ対戦と週間リーグ
• 対戦：ランダムな相手や、コードで招待した友だちと同じパズルを競います。先にクリアした人の勝ちで、リーグポイント+10。
• 週間リーグ：30人のグループで競います。ステージの星、今日の路線、対戦の勝利でポイントがたまります。週の終わりに上位7人は上のリーグへ、下位5人は下のリーグへ。リーグは全部で6つです。
• 参加は任意です。対戦とリーグはネット接続が必要で、ステージはオフラインで遊べます。

街の路線図
クリアした路線ごとに、街の地区がひとつ灯ります。ひとつの路線のステージをすべてパーフェクトでクリアすると、その地区が金色に輝きます。街が育つようすを見守りましょう。

33の路線、終わらないステージ
路線ごとに新しいルールが登場し、ステージは少しずつ難しくなります。33路線のあとは、ルールが混ざった路線がどこまでも続きます。ステージは端末の中で作られ、どれも必ず解けて、同じステージ番号ならだれでも同じパズルです。

旅するほど新しいルール
ペアタイル、逆回転タイル、横スライド、暗いトンネル、カウンタータイル、凍るタイル、ふたつのハブ、分岐器、封印タイル、転車台、橋、歯車タイル、カバー、トンネル口、標識、環状線、淡い枝、隠れ車庫、端のない盤面、川、閉鎖駅、運賃ゾーン、時限駅、縦スライド、急行駅、信号タイル、地震駅、変身タイル、リモコンタイル、入換タイル、空きホーム。新しいルールは短いアニメーションのカードで紹介され、盤面がごちゃごちゃすることはありません。

今日の路線
毎日、みんなが同じパズルに挑みます。土曜日は六角形の盤面、日曜日は今週のルールの日。連続記録をのばして、デイリーとウィークリーのミッションを達成しよう。

切符、テーマ、びっくり宝箱
パーフェクトでクリアしたステージごとに切符が1枚。切符で25のカラーテーマのうち22を解放したり、びっくり宝箱を開けてヒント、連続記録シールド、新しい車両カラーを手に入れたりできます。宝箱はゲーム内で集めた切符でのみ開けられ、確率は宝箱の画面に表示されます。

運行バーとパーフェクト連続記録
時計の下の小さな列車がタイム目標に向かって進みます。目標を過ぎてもすぐには終わりません。タイムの星が消えて、少しの遅延時間がもらえるだけです。終電にも間に合わないとライフが1つ減りますが、ライフは時間がたつと自然に回復します。パーフェクトを続けて連続記録をのばし、ボーナス切符を手に入れよう。

目にもバッテリーにもやさしい
ダーク、ライト、自動の表示。やわらかな色づかい。アニメーションは何かが動いているときだけ。音楽、効果音、振動はそれぞれオフにできます。毎日のお知らせも設定できます。

無料で、フェアに
Rayは無料で遊べます。ヒントは毎日最低3個まで補充され、路線をクリアするたびにヒントが追加でもらえます。広告はオンラインのときだけ表示されます。ステージの間にときどき出るインタースティシャル広告と、自分で選んだときだけ見るリワード動画（ヒント追加、ライフ追加、報酬2倍、途切れた連続記録の救済）だけです。今日の路線にはインタースティシャル広告はありません。

広告なしパック
買い切りです。ステージ間の広告がなくなり、ヒント20個のプレゼントと、特別テーマ3種（ゴールド、ダイヤモンド、ルビー）が解放されます。ヒント動画は引き続き任意です。

アカウント不要、個人情報も入力不要。進行状況はお使いの端末にだけ保存されます。リーグや対戦に参加した場合のみ、ニックネーム、リーグポイント、対戦の進行状況が匿名IDでサーバーに保存され、設定 › リーグを抜ける · データを削除 で消せます。

日本語、英語、韓国語、中国語（繁体字）、ドイツ語、スペイン語、ポルトガル語、フランス語、トルコ語に対応。
```
**このバージョンの新機能**
```text
1.2：ライブ対戦、週間リーグ、街のメトロ路線図が登場。ルール路線が7本増えて全33本に。ステージはオフラインで、対戦とリーグはネット接続で遊べます。
```

### 繁體中文 (zh-TW · Chinese Traditional)

**名稱**
```text
Ray: 地鐵路線解謎
```
**簡短說明**（Play）
```text
轉動軌道，連起每個車站。單手也能玩的療癒地鐵解謎，關卡可離線遊玩。
```
**副標題**（App Store）
```text
單手連線，輕鬆療癒
```
**宣傳文字**（App Store）
```text
全新：即時對戰與每週聯賽！轉動軌道、連起每個車站，挑戰完美過關。33 條路線、城市捷運路線圖，每天都有新的每日路線。
```
**關鍵字**（App Store）
```text
水管,火車,車站,燒腦,邏輯,旋轉,方塊,療癒,捷運,路線圖,離線,益智,聯賽,對戰
```
**描述**
```text
Ray 是一款單手就能玩的輕鬆地鐵解謎遊戲。點一下方塊，軌道就轉 90°；把路線從中央樞紐連到每一個車站。
1.2 新功能：即時對戰、每週聯賽、城市捷運路線圖與 7 條新路線（共 33 條規則路線＋無限混合關卡）。
關卡可離線遊玩；對戰與聯賽需要網路連線。

不能留下沒接上的軌道斷頭。路線越連越多，城市就一盞盞亮起來。

怎麼玩
• 點方塊轉動軌道。
• 把每個車站連到樞紐，不留斷頭。
• 三顆星：過關、達成時間目標、達成步數目標。
• 同時達成兩個目標就是完美過關，還能得到一張車票。

即時對戰與每週聯賽
• 對戰：和隨機對手，或用代碼邀請的朋友，一起挑戰同一道謎題。先完成的人獲勝，聯賽積分 +10。
• 每週聯賽：在 30 人小組中競爭。關卡星星、每日路線與對戰勝利都能得分。每週結束時，前 7 名晉級上一級聯賽，後 5 名降級；聯賽共有 6 級。
• 是否參加由你決定。對戰與聯賽需要網路連線，關卡可離線遊玩。

城市路線圖
每完成一條路線，城市就會點亮一個街區。把一條路線的所有關卡都完美過關，街區就會閃耀金光。看著你的城市慢慢長大。

33 條路線，無限關卡
每條地鐵路線都會帶來新規則，每一關都比上一關難一點。33 條路線之後，混合規則的路線會無限延續。關卡在你的裝置上產生，每一關都有解，而且同一個關卡編號，大家拿到的都是同一道謎題。

一路解鎖新規則
成對方塊、反轉方塊、橫向滑動、黑暗隧道、計數方塊、結冰方塊、雙樞紐、轉轍器、封印方塊、轉車台、橋樑、齒輪方塊、蓋板、隧道口、路標、環狀線、淡色分支、隱藏車庫、無邊盤面、河流、封閉車站、票價區、限時車站、縱向滑動、快車站、號誌方塊、地震站、變形方塊、遙控方塊、調車方塊、空月台。每個新規則都用一張簡短的動畫卡片介紹，盤面永遠不會雜亂。

每日路線
每天大家都解同一道謎題。星期六在六角形盤面上玩，星期日是本週規則日。保持連續紀錄，完成每日和每週任務。

車票、主題與驚喜寶箱
每個完美過關的關卡都能得到一張車票。用車票解鎖 25 款色彩主題中的 22 款，或打開驚喜寶箱，獲得提示、連續紀錄護盾或新的列車塗裝。寶箱只能用遊戲中賺到的車票開啟，機率會顯示在寶箱畫面上。

行車條與完美連續紀錄
時鐘下方的小列車會朝時間目標前進。超過目標時間，遊戲不會馬上結束：只會熄滅時間星，並給你一小段誤點時間。如果連末班車都錯過，就會失去一條生命；生命會隨時間自動恢復。連續完美過關，累積紀錄，賺取額外車票。

護眼又省電
深色、淺色與自動外觀。柔和的配色。只有畫面在動時才會播放動畫。音樂、音效和震動可以分別關閉。也可以設定每日提醒。

免費又公平
Ray 可以免費遊玩。提示每天至少補到 3 個，每完成一條路線還會額外獲得提示。廣告只在連網時出現：關卡之間偶爾一則插頁式廣告，以及只有你願意時才看的獎勵影片（額外提示、額外生命、獎勵加倍、挽救中斷的連續紀錄）。每日路線沒有插頁式廣告。

免廣告包
一次購買。移除關卡之間的廣告，贈送 20 個提示，並解鎖 3 款專屬主題（黃金、鑽石、紅寶石）。提示影片仍可自由選擇觀看。

不需要帳號，也不會要求個人資料。你的進度只會保存在你的裝置上。若參加聯賽或對戰，只有暱稱、聯賽積分與對戰進度會以匿名 ID 儲存在伺服器上，可在設定 › 退出聯賽 · 刪除我的資料 中刪除。

支援繁體中文、英文、日文、韓文、德文、西班牙文、葡萄牙文、法文和土耳其文。
```
**版本更新說明**
```text
1.2：新增即時對戰、每週聯賽與城市捷運路線圖。新增 7 條規則路線（共 33 條）。關卡可離線遊玩，對戰與聯賽需要網路連線。
```

## 6. Google Play "Veri güvenliği" formu

Görünür hesap yok, ayrı çökme raporu aracı yok (hata ve akıcılık bilgisi Firebase olayı olarak gider, aşağıda); ilerleme cihazda (tarayıcı deposu + kalıcı yedek, Capacitor Preferences), **yalnız 1.2'deki isteğe bağlı lig ve kapışma sunucuya yazar**. Formda beyan edilecek veriyi üç kaynak toplar: **Google Mobile Ads SDK (AdMob)**, **Google Analytics for Firebase** (oyun olayları, reklam kimliği olmadan, rıza gereken bölgelerde kapalı; ayrıntı `docs/YAYIN.md` §5) ve **lig/kapışma arka ucu** (`www/lig.js`: Firebase Authentication anonim giriş + Cloud Firestore, REST ile; Avrupa sunucuları; yalnız oyuncu lige katılırsa çalışır; `gizlilik.html` §13). Satın almayı Google Play yürütür; uygulama ödeme bilgisi görmez.

Firebase, geliştirici adına çalışan bir hizmet sağlayıcıdır; Play tanımına göre bu "paylaşma" sayılmaz, "toplama" sayılır. Ölçüm derlemeye yalnız `FIREBASE_ANDROID_JSON` gizli değeri verilince girer; vermeden yayımlarsan **Analytics** satırlarını forma ekleme. Lig/kapışma satırları (aşağıda) bundan bağımsızdır: lig kodu kendi anahtarıyla REST çağırır, bu yüzden lig açık yayımlanan her 1.2 derlemesinde beyan edilir.

| Soru | Yanıt |
|---|---|
| Uygulama gerekli kullanıcı verisi türlerinden birini topluyor ya da paylaşıyor mu? | Evet |
| Toplanan bütün veriler aktarım sırasında şifreleniyor mu? | Evet (SDK HTTPS kullanır) |
| Hesap oluşturma | Uygulamada hesap oluşturma yok (kullanıcıya görünen hesap, e-posta ya da parola yok; lig için arka planda rastgele bir Firebase **anonim kimliği** üretilir) |
| Kullanıcı verilerinin silinmesini isteyebilir mi? | Evet. Lig/kapışma verisi uygulamadan silinir: Ayarlar › Ligden çık · verilerimi sil (ya da Ayarlar › Gizlilik › Verilerimi sil); sunucudaki kayıtlar ve anonim kimlik silinir. Reklam verisini Google işler. Cihazdaki oyun verisi de uygulamadan silinebilir (aşağıda). Silme bağlantısı sorulursa gizlilik sayfasını (§9, §13) ver. |

Beyan edilecek veri türleri (Google'ın AdMob için yayımladığı eşleşmeye göre):

| Play veri türü | AdMob'daki karşılığı | Toplanıyor | Paylaşılıyor | Geçici mi | Zorunlu mu | Amaç |
|---|---|---|---|---|---|---|
| Konum › Yaklaşık konum | IP adresi (genel konum tahmini) | Evet | Evet | Hayır | Zorunlu | Reklam veya pazarlama · Analiz · Dolandırıcılığı önleme, güvenlik ve uyumluluk |
| Uygulama etkinliği › Uygulama etkileşimleri | Reklam gösterimi, dokunma, video izleme | Evet | Evet | Hayır | Zorunlu | aynı |
| Uygulama bilgileri ve performans › Kilitlenme günlükleri, Teşhis | SDK'nın teşhis bilgisi | Evet | Evet | Hayır | Zorunlu | aynı |
| Cihaz veya diğer kimlikler | Android reklam kimliği, uygulama grubu kimliği | Evet | Evet | Hayır | Zorunlu | aynı |
| Uygulama etkinliği › Uygulama etkileşimleri | **Firebase:** bölüm başlama/bitiş/bırakma, Günün Hattı, anlatım, reklam gösterimi, güçlendirici, özel teklif gösterimi/satın alımı, can olayları | Evet | Hayır | Hayır | Zorunlu | Analiz |
| Cihaz veya diğer kimlikler | **Firebase:** uygulama örneği kimliği (reklam kimliği toplanmaz) | Evet | Hayır | Hayır | Zorunlu | Analiz |
| Uygulama bilgileri ve performans › Teşhis | **Firebase:** JavaScript hata iletisi ve yeri (`js_error`, oturumda en çok 5), takılan kare sayısı/süresi (`level_end` `jank`, `perf_session`: çekirdek sayısı, bellek, ekran ölçeği). Kişisel veri, metin girişi yok | Evet | Hayır | Hayır | Zorunlu | Analiz |
| Finansal bilgiler › Satın alma geçmişi | **Firebase:** satın alınan ürünün kimliği (`purchase`, `offer_buy` olayları; tutar yok, Firebase'in kendi `in_app_purchase` olayı tutarı içerir) | Evet | Hayır | Hayır | Zorunlu | Analiz |
| Konum › Yaklaşık konum | **Firebase:** IP'den ülke/şehir tahmini | Evet | Hayır | Hayır | Zorunlu | Analiz |
| Kişisel bilgiler › Kullanıcı kimlikleri | **Lig/kapışma (Firebase Authentication):** rastgele anonim kullanıcı kimliği (UID) ve oyuncunun seçtiği takma ad | Evet | Hayır | Hayır | **İsteğe bağlı** (yalnız lige katılırsa) | Uygulama işlevi |
| Uygulama etkinliği › Diğer kullanıcı içeriği | **Lig/kapışma (Firestore):** takma ad (3–16 karakter, filtreli; bildirme ve engelleme var) | Evet | Hayır | Hayır | **İsteğe bağlı** | Uygulama işlevi |
| Uygulama etkinliği › Uygulama etkileşimleri | **Lig/kapışma (Firestore):** haftalık lig puanı, lig ve grup; kapışmada bölüm ve ilerleme (bağlanan karo oranı, hamle, süre) | Evet | Hayır | Hayır | **İsteğe bağlı** | Uygulama işlevi |

Lig/kapışma satırları: veri reklam, pazarlama ya da izleme için **kullanılmaz**, kişiye (ad, e-posta, konum) bağlanmaz, satılmaz; Google/Firebase hizmet sağlayıcıdır ("paylaşılıyor" Hayır). Aynı gruptaki ve kapıştığın oyuncuların takma adı ve puanı görmesi uygulamanın işlevidir, üçüncü tarafa aktarım değildir. Çevrimiçi rakip yokken kapışmayı bitirenin kaydı başka oyunculara takma adla "kayıtlı rakip" olarak oynatılabilir (`gizlilik.html` §13; oyunda öyle yazar). Kullanıcı Ayarlar'dan hepsini siler. Aynı veri türü iki satırda geçiyorsa formda tek kez işaretlenir; amaçlar ve "paylaşılıyor" yanıtı birleştirilir (AdMob paylaşır → Evet). "Zorunlu": oyuncu ölçümü uygulama içinden ayrıca kapatamaz (rıza bölgelerinde zaten kapalı; Verilerimi sil kapatır).

Toplanmayanlar: kişisel bilgiler (gerçek ad, e-posta, adres, telefon; takma ad serbest yazıdır ama ad, bağlantı, e-posta ve numara filtrelenir), ödeme bilgileri (Google Play yürütür), sağlık, mesajlar, fotoğraf ve video, ses, dosyalar, takvim, kişiler, web tarama, kesin konum.

Gönderimden önce Google'ın güncel tablolarıyla son kez karşılaştır: https://developers.google.com/admob/android/privacy/play-data-disclosure · https://firebase.google.com/docs/android/play-data-disclosure

**Silme yolu** (gizlilik politikasıyla aynı):

- Lig ve kapışma verisi (sunucuda): Ayarlar › Ligden çık · verilerimi sil (ya da Ayarlar › Gizlilik › Verilerimi sil): lig kayıtların, kayıtlı oyunların ve anonim kimliğin sunucudan silinir. Bildirdiğin takma adlar incelenmek üzere saklanır (gizlilik politikası §13).
- Oyun verisi: Ayarlar › Gizlilik › Verilerimi sil (bu düğme `magaza-reklam` dalıyla gelir) ya da uygulamayı kaldırmak. Aynı düğme ölçümü kapatır ve Firebase'in cihazdaki kimliğini sıfırlar (`resetAnalyticsData`).
- Reklam verisi: Android ayarlarından reklam kimliğini sıfırlamak ya da silmek; AB/BK/İsviçre ve ilgili ABD eyaletlerinde rıza seçimini Ayarlar › Gizlilik › Reklam gizlilik seçenekleri ile değiştirmek.

**Reklam kimliği beyanı** (Uygulama içeriği › Reklam kimliği): Evet, kullanıyor. Amaç: Reklam veya pazarlama, Analiz, Dolandırıcılığı önleme. `AD_ID` izni AdMob kitaplığıyla bildirime kendiliğinden eklenir; yayın derlemesinde birleşik bildirimde göründüğünü doğrula.

## 7. Apple "App Privacy" etiketleri

Etiketler AdMob SDK, Firebase Analytics ve 1.2'deki lig/kapışma arka ucu (Firebase Authentication anonim giriş + Firestore) içindir (Firebase yalnız `FIREBASE_IOS_PLIST` verilen derlemede; IDFA'sız `AnalyticsWithoutAdIdSupport` sürümü, IDFV de kapalı). iOS'ta izleme (IDFA) yalnız kullanıcı ATT penceresinde izin verirse olur, bu yüzden izleme beyan edilir ve ATT penceresi gösterilir (`magaza-reklam` dalı).

| Apple veri türü | Amaç | Kimliğe bağlı mı | İzleme için mi |
|---|---|---|---|
| Tanımlayıcılar › Aygıt kimliği (IDFA, IDFV) | Üçüncü taraf reklam · Analiz | Hayır | Evet (IDFA, yalnız ATT izniyle) |
| Kullanım verileri › Reklam verileri | Üçüncü taraf reklam · Analiz | Hayır | Evet |
| Kullanım verileri › Ürün etkileşimi | Üçüncü taraf reklam · Analiz | Hayır | Evet |
| Konum › Yaklaşık konum (IP'den) | Üçüncü taraf reklam · Analiz | Hayır | Hayır |
| Tanılama › Çökme verileri, Performans verileri, Diğer tanılama verileri | Üçüncü taraf reklam · Analiz | Hayır | Hayır |
| Tanımlayıcılar › Aygıt kimliği (Firebase uygulama örneği kimliği) | Analiz | Hayır | Hayır |
| Kullanım verileri › Ürün etkileşimi (Firebase oyun olayları) | Analiz | Hayır | Hayır |
| Satın alımlar › Satın alma geçmişi (Firebase `purchase`/`offer_buy`: ürün kimliği) | Analiz | Hayır | Hayır |
| Konum › Yaklaşık konum (Firebase, IP'den) | Analiz | Hayır | Hayır |
| Tanımlayıcılar › Kullanıcı kimliği (lig: Firebase Authentication anonim UID) | Uygulama işlevleri | Hayır | Hayır |
| Kullanıcı içeriği › Diğer kullanıcı içeriği (lig takma adı) | Uygulama işlevleri | Hayır | Hayır |
| Kullanıcı içeriği › Oyun içeriği (lig puanı, kapışma ilerlemesi: bölüm, bağlanan karo oranı, hamle, süre) | Uygulama işlevleri | Hayır | Hayır |

Lig/kapışma satırları isteğe bağlıdır (yalnız lige katılırsa), reklam ya da izleme için kullanılmaz, başka şirketlerin verisiyle birleştirilmez, kullanıcı Ayarlar › Ligden çık · verilerimi sil ile siler; rastgele anonim kimlik gerçek kimliğe bağlanmaz (`gizlilik.html` §13 ile aynı). Apple takma adı ve kimliği "Sizinle ilişkilendirilen veri" saymak isterse formun sorusuna göre bu üç satırda "Evet" seç; bu izleme beyanını değiştirmez. Aynı tür iki satırda geçerse App Store Connect'te bir kez seçilir, amaçlar birleştirilir. Firebase verisi izleme için kullanılmaz (reklam kimliği yok, başka şirketlerin verisiyle birleştirilmez); "izleme" yanıtı yalnız AdMob satırlarından gelir. Bu yüzden ATT reddi ölçümü değiştirmez.

Ürün sayfasında beklenen görünüm: "Sizi izlemek için kullanılan veriler: Tanımlayıcılar, Kullanım verileri" ve "Sizinle ilişkilendirilmeyen veriler: Konum, Tanılama, Kullanım verileri, Tanımlayıcılar, Satın Alımlar, Kullanıcı içeriği". "Sizinle ilişkilendirilen veri" bölümü çıkmaz.

Google'ın iOS tabloları: https://developers.google.com/admob/ios/privacy/data-disclosure · https://firebase.google.com/docs/ios/app-store-data-collection. Google Mobile Ads SDK kendi gizlilik bildirimini (`PrivacyInfo.xcprivacy`) taşır; Capacitor da öyle.

## 8. Yaş derecelendirmesi

### Google Play (IARC anketi)

| Soru | Yanıt |
|---|---|
| E-posta | osmanadali.apps@gmail.com |
| Kategori | Oyun (Game) |
| Şiddet, kan, korku | Hayır |
| Cinsellik, çıplaklık | Hayır |
| Küfür, kaba dil, kaba mizah | Hayır (yolcu sözleri nazik espridir) |
| Uyuşturucu, alkol, tütün | Hayır |
| Kumar: gerçek para ya da kumar benzetimi (kumarhane oyunu) | Hayır |
| Ayrımcılık, nefret | Hayır |
| Kullanıcılar birbiriyle iletişim kuruyor mu (sohbet, içerik paylaşma) | Sohbet, mesaj, fotoğraf yok. Ama 1.2'de lig ve kapışmada oyuncular birbirinin **takma adını ve puanını** görür (takma ad filtreli; her takma ad için Bildir ve Engelle var). Anketin "kullanıcı etkileşimi / kullanıcı tarafından oluşturulan içerik" sorusu varsa **Evet (yalnız takma ad)**; sohbet sorusuna Hayır. "Paylaş" yalnız sonuç metnini sistemin paylaşma penceresine verir. |
| Kullanıcının konumu paylaşılıyor mu | Hayır |
| Dijital ürün satın alma | Evet (Mağaza: 2 tüketilemez, 5 tüketilebilir ürün; §10) |
| Parayla satın alınan rastgele ödül (ganimet kutusu) | Hayır. Sürpriz sandık yalnız oyunda **kazanılan** biletle açılır. Mağazadaki bilet paketi (`ray_bilet_50`, 🎫; taç para birimi bilet olarak yeniden adlandırıldı) ayrı sayılır ve yalnız renk temasına harcanır, sandıkta kullanılamaz (`chestBal`, robot: `gelir.tac`); sandıktan taç çıkmaz. Bütün paketlerin içeriği sabittir. |
| Sınırsız internet erişimi (uygulama içi tarayıcı) | Hayır |

Beklenen sonuç: PEGI 3, ESRB Everyone, USK 0, IARC 3+ (satın alma nedeniyle "Oyun içi satın alma" notu eklenir).

### App Store (yaş derecelendirmesi formu)

- Bütün içerik soruları (şiddet, korku, cinsellik, küfür, uyuşturucu, kumar, yarışma, tıbbi konular): **Yok**.
- Sınırsız web erişimi: Hayır. Kullanıcı içeriği: yalnız lig takma adı (filtre, Bildir, Engelle var; 1.2). Mesajlaşma: Hayır. Ebeveyn denetimi, yaş doğrulama: Hayır.
- Formda reklam sorusu varsa: **Evet**.
- Hesaplanan derece büyük olasılıkla 4+ çıkar. Reklam içeriği AdMob'da en çok PG'ye ayarlı (`magaza-reklam` dalı, `maxAdContentRating: 'ParentalGuidance'`). Apple reklamların derecelendirmeye uygun olmasını ister. Form izin veriyorsa dereceyi 9+ seç; vermiyorsa AdMob'da iOS uygulaması için en yüksek reklam içeriği derecesini G yap.
- Çocuk kategorisi (Kids): Hayır.

## 9. Hedef kitle, reklam ve diğer Play beyanları

| Play › Uygulama içeriği | Yanıt |
|---|---|
| Gizlilik politikası | https://osmanadali.github.io/mobil-oyun/gizlilik.html |
| Reklamlar | Evet, uygulamada reklam var (AdMob: geçiş ve ödüllü video) |
| Uygulama erişimi | Tüm işlevler özel erişim gerekmeden kullanılabilir (giriş yok) |
| Hedef kitle | 13–15, 16–17, 18 ve üzeri. 13 yaş altı seçilmez; uygulama Aileler programına katılmaz. |
| Çocukların ilgisini çekebilir mi | Hayır. Mağaza görsellerinde çocuklara yönelik karakter ya da dil yok. (Google aksi karar verirse Aileler politikası ve AdMob çocuk ayarları gerekir.) |
| Haber uygulaması | Hayır |
| Devlet uygulaması | Hayır |
| Finansal özellikler | Yok |
| Sağlık | Yok |
| Veri güvenliği | §6 |
| İçerik derecelendirmesi | §8 |
| Reklam kimliği | §6 sonu |

Gizlilik politikası da "13 yaş ve üzeri" der; hedef kitle ve politika uyumludur.

## 10. Uygulama içi ürünler

Oyun iki mağazada da **ücretsiz indirilir**. Aşağıdaki fiyatlar yalnız oyunun içinden isteğe bağlı alınan paketlerin fiyatıdır; uygulamanın kendisine fiyat girilmez. Bütün ürünler tek **Mağaza** penceresindedir (Ayarlar › Mağaza; ipucu bitince açılan pencerede "💡 İpucu paketleri" bağlantısı). Satış sade: rozet ve geri sayım yok; kendiliğinden açılan tek pencere seyrek **özel teklif**tir (§10.3).

### 10.1 Reklamsız paket

| Alan | Google Play | App Store Connect |
|---|---|---|
| Kimlik | `ray_reklamsiz` | `ray_reklamsiz` |
| Tür | Tek seferlik ürün (uygulama içi ürün, tüketilemez) | Non-Consumable (tüketilemez) |
| Ad (TR / EN) | Reklamsız paket / Ad-free Pack | Reklamsız paket / Ad-free Pack (12) |
| Açıklama TR | `Bölüm aralarındaki reklamları kaldırır, 20 ipucu hediye eder ve 3 özel temayı (Altın, Elmas, Yakut) açar. Tek seferlik, ömür boyu.` | `Reklamlar kalkar, 20 ipucu ve 3 özel tema` (45) |
| Açıklama EN | `Removes the ads between levels, gives you 20 hints and unlocks 3 exclusive themes (Gold, Diamond, Ruby). One-time purchase, yours forever.` | `No ads between levels, 20 hints, 3 themes` (45) |
| Fiyat önerisi | Varsayılan ₺59,99; ABD 2,99 $ · AB 2,99 € · BK 2,49 £ elle (ya da USD tabanlı şablon) | Taban ülke **ABD, 2,99 $**; Türkiye elle **₺59,99**; öteki ülkeler ABD'den otomatik |
| İnceleme için | Lisans test hesabıyla dene | İnceleme ekran görüntüsü: Ayarlar › Reklamsız paket penceresi (cihazdan alınır) |

Fiyat gerekçesi: benzer bulmaca oyunlarında reklam kaldırma 2–5 $ arasıdır. Paket yalnız geçiş reklamlarını kaldırır (ödüllü videolar isteğe bağlı kalır), üstüne 20 ipucu ve 3 tema verir; alt uçta bir fiyat ilk satın almayı kolaylaştırır.

Neden taban Türkiye değil: ₺59,99'dan KDV düşülünce kalan yaklaşık 1 $ eder. Taban Türkiye olursa mağazalar öteki ülkeleri bu tutardan çevirir; İngilizce konuşulan ana pazarlarda (ABD, BK, AB) fiyat 2–5 $ bandının altına düşer ve gelir 2–2,5 kat az kalır. Bu yüzden fiyat ABD'ye göre kurulur, Türkiye ayrıca elle girilir.

Fiyat planı:

- **App Store Connect:** Uygulama içi satın alma › `ray_reklamsiz` › Fiyatlandırma › taban ülke **Amerika Birleşik Devletleri**, fiyat **2,99 $**. Öteki ülkeler otomatik gelir. Sonra Türkiye satırını elle **₺59,99** yap.
- **Google Play:** Ürünün varsayılan fiyatı ₺59,99 kalabilir. Ama Play öteki ülkeleri bu tutardan çevirdiği için ABD **2,99 $**, Euro bölgesi **2,99 €** ve Birleşik Krallık **2,49 £** elle girilir. İstersen 2,99 $ tabanlı bir fiyatlandırma şablonu (Ayarlar › Fiyatlandırma şablonları) kurup ürüne bağla, Türkiye'yi orada ₺59,99'a çek.
- Kayıttan sonra iki mağazada ülke listesini gözden geçir: ABD 2,99 $, Türkiye ₺59,99, Almanya 2,99 €, BK 2,49 £ görünmeli.

Geri yükleme: pencerede "Satın alımı geri yükle" düğmesi var (Apple bunu ister).

### 10.2 Öteki ürünler (31 Ekim)

Kimlikler iki mağazada aynıdır (`www/shop.js` › `ITEMS`). Tüketilebilir ürünler Play'de "tüketilebilir uygulama içi ürün" olarak kalır (uygulama her alışta işlemi `finish` ile tüketir), App Store Connect'te **Consumable** seçilir. Tüketilemezler Play'de tek seferlik ürün, App Store'da **Non-Consumable**.

| Kimlik | Tür | Ad TR / EN | İçerik | ABD (taban) | Türkiye (elle) |
|---|---|---|---|---|---|
| `ray_temalar` | Tüketilemez | Tema paketi / Theme Pack | 28 renk temasının hepsi: biletle açılan 22 + 6 mevsim teması (Altın, Elmas, Yakut hariç; onlar Reklamsız pakette) | 3,99 $ | ₺79,99 |
| `ray_ipucu_10` | Tüketilebilir | 10 ipucu / 10 Hints | 10 💡 | 0,99 $ | ₺19,99 |
| `ray_ipucu_30` | Tüketilebilir | 30 ipucu / 30 Hints | 30 💡 | 1,99 $ | ₺39,99 |
| `ray_ipucu_80` | Tüketilebilir | 80 ipucu / 80 Hints | 80 💡 | 3,99 $ | ₺79,99 |
| `ray_guclendirici` | Tüketilebilir | Güçlendirici paketi / Booster Pack | 🔄 ek tur ×3, 🔦 fener ×3, ⏱ +15 sn ×3, ↶ geri al ×3 | 1,99 $ | ₺39,99 |
| `ray_bilet_50` | Tüketilebilir | Bilet paketi / Ticket Pack | 50 🎫 bilet, yalnız renk temasında harcanır (sandıkta kullanılamaz) | 1,99 $ | ₺39,99 |
| `ray_baslangic` | Tüketilebilir | Başlangıç paketi / Starter Pack | 10 💡, her güçlendiriciden 2 (🔄 🔦 ⏱ ↶), ❤️∞ 1 saat sınırsız can, 20 🎫 bilet (yalnız temada) | 2,99 $ | ₺59,99 |

Mağaza açıklamaları (App Store görünen ad ≤ 30, açıklama ≤ 45 karakter):

| Kimlik | Açıklama TR | Açıklama EN |
|---|---|---|
| `ray_temalar` | `28 renk temasının hepsi, tek seferlik` | `All 28 color themes, one-time` |
| `ray_ipucu_10` / `_30` / `_80` | `10 (30, 80) ipucu: takıldığın karo yerine oturur` (Play) · `10 ipucu` (App Store) | `10 (30, 80) hints: puts a tricky tile in place` (Play) · `10 hints` (App Store) |
| `ray_guclendirici` | `Her güçlendiriciden 3: ek tur, fener, +15 sn, geri al` | `3 of each booster: turn, lantern, +15 s, undo` |
| `ray_bilet_50` | `50 bilet, renk temaları için` | `50 tickets to spend on color themes` |
| `ray_baslangic` | `10 ipucu, 8 güçlendirici, 1 saat can, 20 bilet` | `10 hints, 8 boosters, 1 h lives, 20 tickets` |

Fiyat gerekçesi (§10.1 ile aynı mantık): fiyatlar ABD'ye göre kurulur, öteki ülkeler mağazanın ABD'den çevirisiyle gelir, Türkiye elle girilir. Türkiye oranı Reklamsız paketteki gibidir (2,99 $ ↔ ₺59,99, yani 1 $ ≈ ₺20): ₺19,99 / 39,99 / 79,99.

- İpucu üç boyda, büyük paket adet başına ucuzlar (0,099 → 0,066 → 0,050 $). Oyun cömert kalır: her gün 3 ipucu, seri, hat sonu ve sandık ipucu verir, ödüllü video +2; paketler acele edenler için.
- Güçlendirici paketi 12 güçlendirici verir; sandığın sıradan ödülü 1 güçlendirici olduğundan 1,99 $ yaklaşık 10 sandıklık güçlendiriciye denk gelir ama sandığın asıl ödülü (tren kaplaması, kalkan) parayla satılmaz.
- Bilet paketi 50 🎫 ≈ 50 kusursuz bölüm. Temalar 5–560 bilet arasında olduğundan bir paket bir-iki orta tema eder; bütün temaları isteyen için Tema paketi (3,99 $) daha uygundur. Satın alınan bilet ayrı sayılır, sandık açmaz (BOLUM_TASARIMI › Taç ekonomisi).
- Tema paketi (3,99 $) Reklamsız paketten (2,99 $) pahalıdır: 22 temayı biletle toplamak yüzlerce kusursuz bölüm ister.
- Başlangıç paketi (2,99 $) karışık bir paket: ayrı ayrı alınsa 10 ipucu (0,99 $) + 8 güçlendirici (~1,33 $) + 20 bilet (~0,80 $) + 1 saat can eder; bu fark gerçektir ama pencerede "indirim" ya da eski fiyat olarak gösterilmez. Sınırsız can süresi var olan süreye eklenir (`save.infUntil = max(infUntil, şimdi) + 60 dk`). Mağazada her zaman satılır.

Uygulamanın davranışı (robot: `tools/hakem/gelir-olcum.cjs`, özel teklif ve ölçüm `tools/hakem/gelir-2.cjs`):

- Tüketilebilir: mağaza işlemi onaylayınca ödül kayda yazılır, kaydın yazıldığı doğrulanır, **sonra** işlem bitirilir (Play'de consume, iOS'ta finish). Aynı işlem yeniden gelirse (uygulama arada kapandıysa) işlem kimliği kayıtta olduğundan ödül ikinci kez verilmez, işlem yine bitirilir. Kayıt yazılamazsa işlem açık kalır ve sonraki açılışta yeniden gelir.
- Geri yükleme yalnız tüketilemezleri getirir (Reklamsız paket, Tema paketi).
- İlerlemeyi taşı kodu iki tüketilemez paketi taşımaz; satın alınan ipucu/güçlendirici/bilet kayıttaki sayılarla taşınır.
- Web'de ya da mağaza dışı APK'da yalnız Reklamsız paket satırı ve "Paketler mağazadan indirilen sürümde açılır" notu görünür.

### 10.3 Özel teklif penceresi (3 Kasım)

Ürünler seyrek bir **Özel teklif** penceresiyle de önerilir (`game.js` › `offerDue`, `maybeOffer`, `offerSheet`). Pencere yalnız gerçek mağaza ürünü gösterir, fiyat mağazanın verdiği gerçek fiyattır.

Sıklık kuralları (hepsi birden sağlanmalı):

- Yalnız bir bölüm **kazanıldıktan** sonra, sonuç paneli açıldıktan ~1,5 sn sonra; o an başka pencere açıksa ya da puan isteği (in-app review) çıktıysa bu tur yok.
- En çok **48 saatte bir** (`save.offerAt`).
- İlk açılıştan (`save.born`) sonraki **ilk 2 günde** ve **ilk 15 bölümde** hiç (`OFFER_MIN`; kazanılan bölüm 16 ve sonrası, en az 15 bölüm oynanmış).
- **Günün Hattı**, arşiv, pratik ve 🍃 zen bitişlerinde yok.
- Aynı turda **geçiş reklamıyla birlikte değil**: bu turun "Sonraki"sinde geçiş reklamı sırası varsa teklif çıkmaz (sıra ve 48 saat korunur).
- Mağaza hazır değilse (web, mağaza dışı APK, bağlantı yok) çıkmaz ve 48 saatlik süre işlemez.
- Sıra: Başlangıç paketi → Reklamsız paket → Güçlendirici paketi → 30 ipucu (`save.offerN`); **reklamsız sahibine Reklamsız paket gösterilmez**, sıradaki ürün gelir.

Mağaza kuralları gereği: üstü çizili eski fiyat, yüzde indirim, geri sayım, "son şans" dili yok; pencerede "Bu paket Ayarlar › Mağaza'da her zaman var" yazar. "Hayır, teşekkürler" düğmesi satın al düğmesi kadar büyük ve ekranda; pencere aşağı çekilerek ya da dışına dokunarak da kapanır. Ölçüm: `offer_shown`, `offer_buy` (YAYIN §5.4).

Kayıt adımları:

- **Play Console:** Para kazanma › Ürünler › Uygulama içi ürünler › Ürün oluştur. Kimlik, ad, açıklama, varsayılan fiyat; sonra ülke fiyatları (ABD tabanlı şablon kullanıyorsan ürünleri o şablona bağla, Türkiye'yi elle düzelt). Etkinleştir.
- **App Store Connect:** Uygulama › Uygulama İçi Satın Almalar › +. Tür (Consumable / Non-Consumable), Referans adı, Ürün kimliği, Fiyat (taban ABD), Türkiye elle, iki dilde görünen ad ve açıklama, inceleme ekran görüntüsü (Ayarlar › Mağaza penceresi). İlk sürümde ürünleri sürümle birlikte incelemeye gönder.

## 11. İnceleme notları

**App Store › Uygulama inceleme bilgileri**

- Oturum açma gerekli: Hayır.
- Not (İngilizce yaz):

```text
No account or sign-in. All levels work offline; ads (Google AdMob) only load when online. New in 1.2: an optional weekly league and live 1-on-1 duels (tabs League and Duel) need a connection. Joining is optional and asks only for a nickname; the app signs in anonymously with Firebase Authentication and stores the nickname, league points and duel progress in Cloud Firestore (not used for ads or tracking). Nicknames are filtered, can be reported and blocked, and Settings > "Leave league · delete my data" deletes everything. There is no chat. New in 1.2.2: players who duel with a friend code appear in each other's Friends tab (League > Friends) with their weekly points; a player who passes a friend can send a one-tap "poke" once per day, shown to the friend as an in-app message with only the sender's nickname and points (no free text, no push notification; friends can be removed). To see it, tap the League tab and join with any nickname. Levels unlock with stars, so the first levels are enough to review the core loop. All in-app purchases are in Settings (top right on the home screen) > "Shop": Ad-free Pack (ray_reklamsiz) and Theme Pack (ray_temalar) are non-consumable and can be restored with the button in the same sheet; hint packs (ray_ipucu_10/30/80), Booster Pack (ray_guclendirici) and Ticket Pack (ray_bilet_50) and Starter Pack (ray_baslangic) are consumable. After some wins (at most once every 48 hours, never in the first 2 days or first 15 levels) a closable "Special offer" sheet may show one of these same products at its normal store price. Purchased tickets can only be spent on color themes, never on the surprise chest. Gameplay analytics (Firebase, no advertising ID) is off in regions where consent is required. The UI follows the device language (Turkish, English, German, Spanish, Portuguese, French, Korean, Japanese, Traditional Chinese) and can be changed in Settings > Language. Settings also has a "Rate Ray" row that opens the store review page (no reward). The ATT prompt appears on first launch after the consent step.
```

**Google Play › Uygulama erişimi**: "Tüm işlevler herhangi bir özel erişim olmadan kullanılabilir."

## 12. Kullanıcının yapacakları (kontrol listesi)

Hesaplar

- [ ] Google Play Console geliştirici hesabı (25 $ tek seferlik) ve kimlik doğrulama. Kişisel hesapta üretime çıkmadan önce en az 12 test kullanıcısıyla 14 gün kapalı test şartı var; testçi listesini erken hazırla.
- [ ] Apple Developer Program (yıllık 99 $). App Store Connect › Sözleşmeler: ücretli uygulama sözleşmesi, vergi ve banka bilgileri (uygulama içi satın alma bunlarsız çalışmaz).
- [ ] İki mağazada AB Dijital Hizmetler Yasası tacir beyanı. Reklam ve satın almayla gelir elde eden geliştirici genelde "tacir" sayılır; adres, telefon ve e-posta AB'de herkese açık gösterilir.

AdMob

- [ ] AdMob hesabı; Android ve iOS için ayrı uygulama (`com.osmanadali.ray`).
- [ ] Her platformda iki birim: geçiş (interstitial) ve ödüllü (rewarded), toplam dört birim.
- [ ] Kimlikleri GitHub › Settings › Variables'a gir: `ADMOB_APP_ID_ANDROID`, `ADMOB_INTERSTITIAL_ANDROID`, `ADMOB_REWARDED_ANDROID` ve iOS karşılıkları `ADMOB_APP_ID_IOS`, `ADMOB_INTERSTITIAL_IOS`, `ADMOB_REWARDED_IOS` (yayın iş akışları `magaza-yerel` dalında). Derleme bunları `window.RAY_ADS` olarak `index.html`'e yazar; yoksa test reklamı çıkar.
- [ ] AdMob › Gizlilik ve mesajlaşma: AB/BK rıza mesajı (GDPR), ABD eyalet mesajı ve iOS için IDFA açıklama mesajı oluştur ve yayınla.
- [ ] AdMob › Engelleme denetimleri: en yüksek reklam içeriği derecesi PG (uygulamadaki ayarla aynı; iOS için §8'deki nota bak).
- [ ] app-ads.txt: AdMob'un verdiği satırı (`google.com, pub-1478688740631972, DIRECT, f08c47fec0942fa0`) `https://osmanadali.github.io/app-ads.txt` adresine koy (alan adının kökünde olmalı; bunun için `osmanadali.github.io` adlı ayrı bir depo gerekir). Mağaza girişlerinde web sitesi olarak `https://osmanadali.github.io` yaz. Yoksa AdMob uyarı verir ve reklam geliri düşebilir.

Gizlilik ve yayın sayfası

- [x] `www/gizlilik.html` içindeki geliştirici adı ve iletişim e-postası dolduruldu (Osman Adalı, osmanadali.apps@gmail.com; 6 Kasım).
- [x] GitHub Pages açık (20 Kasım): web sürümü ve gizlilik sayfası çalışıyor. Yapılacak: `web.yml` push tetikleyicisinin geri gelip gelmediğini kontrol et; formlara yapıştırmadan önce `https://osmanadali.github.io/mobil-oyun/gizlilik.html` adresinde §13 (lig) bölümünün göründüğünü doğrula.

İmza

- [ ] Play App Signing'i kullan. Yükleme anahtarını (keystore) oluştur, güvenli bir yere **yedekle**, GitHub gizlerine koy: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
- [ ] iOS: dağıtım sertifikası, App Store profili ya da App Store Connect API anahtarı (`ios.yml`, `magaza-yerel` dalı).

Ölçüm (Firebase Analytics, isteğe bağlı; ayrıntı `docs/YAYIN.md` §5)

- [ ] Firebase projesi; Android uygulaması `com.osmanadali.ray` (test APK'ları için ayrıca `com.osmanadali.ray.dev`, `com.osmanadali.ray.test`) ve iOS uygulaması `com.osmanadali.ray`.
- [ ] GitHub gizli değerleri: `FIREBASE_ANDROID_JSON` (google-services.json, base64), `FIREBASE_IOS_PLIST` (GoogleService-Info.plist, base64). Yoksa ölçüm kapalı derlenir, derleme bozulmaz.
- [ ] Veri saklama süresi 14 ay; Google sinyalleri ve reklam bağlantıları kapalı; AdMob–Firebase bağlantısı yapılırsa `ad_impression` olaylarının ikiye katlanmadığını DebugView'da kontrol et.
- [ ] Ölçümle yayımlarsan Veri güvenliği (§6) ve App Privacy (§7) Analytics satırları eklenmeli; ölçümsüz yayımlarsan eklenmez. **Lig/kapışma satırları (Authentication + Firestore) her durumda eklenir** (1.2). `firestore.rules` yayımlanmış olmalı.

Mağaza

- [ ] Play'de ve App Store Connect'te uygulama kaydı (paket `com.osmanadali.ray`, birincil dil Türkçe, ikinci dil İngilizce).
- [ ] Uygulama içi ürünler (§10) iki mağazada oluşturulup etkinleştirilmeli: `ray_reklamsiz`, `ray_temalar` (tüketilemez) ve `ray_ipucu_10`, `ray_ipucu_30`, `ray_ipucu_80`, `ray_guclendirici`, `ray_bilet_50`, `ray_baslangic` (tüketilebilir). Kimlikler iki mağazada aynı yazılmalı.
- [ ] Öteki ürünlerin fiyatları (§10.2): ABD taban 0,99 / 1,99 / 3,99 $, Türkiye elle ₺19,99 / 39,99 / 79,99; Başlangıç paketi 2,99 $ / ₺59,99.
- [ ] Uygulama fiyatı: iki mağazada **Ücretsiz** (Play'de "Ücretsiz", App Store'da 0,00 $).
- [ ] Reklamsız paket fiyatı (§10.1): App Store'da taban ülke ABD 2,99 $, Türkiye elle ₺59,99. Play'de ABD 2,99 $ · AB 2,99 € · BK 2,49 £ elle (ya da USD tabanlı şablon). Taban Türkiye bırakılmaz.
- [ ] Metinleri (§4, §5, §5b, §5c) ve görselleri (§2) yükle. 1.2: 9 dilin hepsinde açıklama, alt başlık, tanıtım metni, anahtar kelime, kısa açıklama ve sürüm notu değişti; ekran görüntüleri yeniden üretildi (10 sahne). Uygulama içi puanlama düğmesi Ayarlar'da "Ray’i değerlendir" (yalnız iOS ve Android; mağaza yorum sayfasını açar, ödül yok).
- [ ] 1.1: Korece (`ko-KR` / Korean), Japonca (`ja-JP` / Japanese), Geleneksel Çince (`zh-TW` / Chinese (Traditional)) çevirilerini iki mağazaya ekle (§5c metinleri, `store/screens-{ko,ja,zh-Hant}/` ve `store/feature-graphic-{ko,ja,zh-Hant}.png`). Basitleştirilmiş Çince ekleme. Oyun içi ürün adları ve açıklamaları (§10) bu dillerde de girilebilir; girilmezse mağaza varsayılan dili gösterir.
- [ ] Formlar: Veri güvenliği (§6), App Privacy (§7), yaş derecelendirmesi (§8), hedef kitle ve öteki beyanlar (§9), inceleme notları (§11).
- [ ] Gerçek cihazda son deneme: rıza penceresi, iOS ATT penceresi, reklam, satın alma ve geri yükleme (Play lisans test hesabı, Apple Sandbox). Tüketilebilir bir paketi iki kez al (ikisi de verilmeli), uygulamayı satın alma sırasında kapatıp aç (ödül bir kez gelmeli); Firebase DebugView'da `level_start`/`level_end` görünmeli; özel teklif (16. bölümden sonra, kayıt 2 günden eski) bir kez çıkmalı.
- [ ] Yayın: Play'de iç test → kapalı test (14 gün) → üretim. iOS'ta TestFlight → incelemeye gönder.

## 13. Bilinen sınırlar

- **Diller.** Oyun 9 dilde açılır (§1); her dilin mağaza girişi kendi ekran görüntüleriyle (`store/screens[-<dil>]/`) yüklenir. Altyapı ve sözlük: `docs/CEVIRI.md`.
- **Hat sayısı.** Açıklama "33 hat + sonsuz karma" der (`KARMA = 33`, M34 ve sonrası karma; hat listesi `docs/kurallar/README.md`) ve kuralları hat sırasıyla sayar; en uzun açıklamalar (EN 3967, FR 3963, DE 3953) 4000 sınırına yakın, yeni kural eklenirse önce §3 betiğiyle say.
- **"İnternetsiz" ayrımı.** Bölümler internetsiz oynanır; lig ve kapışma bağlantı ister. App Store alt başlıklarında "internetsiz" yoktur; Play kısa açıklaması ve açıklamada "bölümler" için geçer ve açıklamada ayrım yazılıdır. Oyunun kendi arkadaşa-öner metni hâlâ "Ücretsiz, internetsiz" der (`game.js`, `recommend`); mağaza metni değildir ama aynı iddiayı taşıdığı için bir sonraki sürümde "bölümler internetsiz" yapılmalı.
- **Sahte arka uç görselleri.** Lig ve kapışma görselleri `window.__ligFake` benzetimiyle çekilir; rakip adları ve puanlar gerçek kullanıcı değildir (§2).
- **Görseller çalışan koda bağlı.** Arayüz değişince `node tools/store-shots.cjs` yeniden çalıştırılmalı. Sahneler bölüm numarasıyla kurulur (180, 45, 829…); üretim değişirse aynı numara farklı bir tahta verebilir, çıktı gözle kontrol edilmeli.
- **Veri ve gizlilik yanıtları** AdMob'un ve Firebase Analytics'in Kasım 2026 itibarıyla bilinen davranışına göredir. Gönderimden önce §6 ve §7'deki Google bağlantılarıyla karşılaştırılmalı.
- **Silme düğmesi ve rıza penceresi** `magaza-reklam` dalında, iOS projesi ve imzalı derleme `magaza-yerel` dalındadır; bu belge o dallar `main`e birleşmiş gibi yazıldı.
