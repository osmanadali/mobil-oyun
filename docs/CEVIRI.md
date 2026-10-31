# İngilizce yerelleştirme

Oyun Türkçe ve İngilizce oynanır. Bu belge altyapıyı ve ortak sözlüğü anlatır; iki dildeki metinlerin tutarlı kalması için yeni metin yazan herkes buraya bakar.

## 1. Altyapı (`www/i18n.js`)

- `i18n.js` bütün betiklerden önce yüklenir ve iki küresel ad tanımlar:
  - `RAY_LANG`: `'tr'` ya da `'en'`.
  - `L(tr, en)`: seçili dildeki metni döndürür. Örnek: `L('İpucu', 'Hint')`, `` L(`${n} hamle`, `${n} moves`) ``.
- **Dil seçimi:** kayıtta `save.lang` (`'tr'` | `'en'`) varsa o kullanılır. Yoksa cihaz dili okunur: `tr` ile başlıyorsa Türkçe, öteki her dilde İngilizce.
- **Dil değişince sayfa yenilenir.** Metinler yüklemede bir kez seçilir; bu yüzden kural kartları gibi yükleme anında kurulan nesnelerde `L()` doğrudan kullanılabilir.
- **Durağan HTML** (`index.html`): Türkçe metin yerinde kalır, İngilizcesi özniteliğe yazılır.
  - `data-en="…"` → öğenin yazısı (`textContent`); öğenin içinde başka öğe varsa yazı ayrı bir `<span>`'e alınır.
  - `data-en-label="…"` → `aria-label`, `data-en-title="…"` → `title`.
- **Robot:** `tools/hakem.cjs` bütün tarayıcı bağlamlarını `locale: 'tr-TR'` ile açar, yani testler varsayılan olarak Türkçe koşar. İngilizce testi bağlamı `locale: 'en-US'` ile açar.
- **Bölüm üretimi dile bağlı değildir.** `L()` rastgele sayı tüketmez; çeviri bölümleri bit bit aynı bırakır.

## 2. Yazım ilkeleri

- İngilizce metin Türkçe kadar kısa ve sakin olmalı. Düğme ve çip yazıları dar alanlara sığmalı; uzun gelirse kısaltılır, yazı küçültülmez.
- Sayılı ifadelerde tekil/çoğul ayrılır: `1 move`, `2 moves`. Yardımcı: `n === 1 ? 'move' : 'moves'`.
- Türkçe ekler (`'i`, `'e`, `-si`) İngilizcede kaldırılır; cümle yeniden kurulur, kelime kelime çevrilmez.
- Tarihler `toLocaleDateString(RAY_LANG === 'en' ? 'en-US' : 'tr-TR', …)` ile, büyük harf `toLocaleUpperCase(RAY_LANG)` ile yazılır.
- Simgeler (★, 🎫, ⏱, ↻, 🔥) iki dilde aynıdır.

## 3. Sözlük

### Temel kavramlar

| Türkçe | İngilizce |
|---|---|
| Ray (oyunun adı) | Ray |
| Metro bulmaca | Metro puzzle |
| Hatları bağla · Şehri canlandır | Connect the lines · Light up the city |
| bölüm | level |
| hat | line |
| Günün Hattı | Daily Line |
| karo | tile |
| ray | track |
| durak | station |
| merkez | hub |
| kol (karonun açık yönü) | arm |
| hamle | move |
| hedef (hamle hedefi) | target |
| ipucu | hint |
| yıldız (★) | star |
| bilet (🎫; eski adı taç 👑, kodda `crowns`) | ticket |
| kusursuz | perfect |
| kusursuz seri (✨; günlük seri 🔥 ayrıdır) | perfect streak |
| seri (günlük) | streak |
| seri kalkanı (🛡) | streak shield |
| sefer şeridi | trip bar |
| son durak (hat finali) | last stop |
| renk temaları | color themes |
| tren kaplaması | train livery |
| sürpriz sandık | surprise chest |
| Sıradan · Nadir · Destansı | Common · Rare · Epic |
| sınırsız can (❤️∞) | unlimited lives |
| haftalık görevler (🎯) | weekly quests |
| görev tamam | quest done |
| ipucusuz | without hints |
| güçlendirici | booster |
| geçmiş gün · geçmiş günler | past day · past days |
| Günün Hattı arşivi | Daily Line archive |
| haftanın kuralı | rule of the week |
| Reklamsız paket | Ad-free pack |
| ızgara | grid |
| Oyna | Play |
| Nasıl oynanır? | How to play? |
| Ayarlar | Settings |
| Gizlilik | Privacy |
| Verilerimi sil | Delete my data |

### Kurallar

| Hat | Türkçe | İngilizce |
|---|---|---|
| M3 | Sabit karo | Fixed tile |
| M4 | Eşli karo | Paired tiles |
| M5 | Ters karo | Reverse tile |
| M6 | Karanlık tünel | Dark tunnel |
| M7 | Sayaçlı karo | Counter tile |
| M8 | İki merkez | Two hubs |
| M9 | Makas | Switch |
| M10 | Kapak | Cover |
| M11 | Köprü | Bridge |
| M12 | Silik kol | Faint arm |
| M13 | Yön tabelası | Signpost |
| M14 | Gizli depo | Hidden depot |
| M15 | Döner tabla | Turntable |
| M16 | Kapalı durak | Closed station |
| M17 | Halka hat | Loop line |
| M18 | Nehir | River |
| M19 | Tünel ağzı | Tunnel portal |
| M20 | Tarife bölgesi | Fare zone |

Kart etiketi: `Yeni: kapak` → `New: cover`.

### Hat adları

Hat adları yer adıdır ve çevrilir:

| Türkçe | İngilizce | Türkçe | İngilizce |
|---|---|---|---|
| Liman | Harbor | Rıhtım | Quay |
| Çarşı | Bazaar | Kanal | Canal |
| Sahil | Shore | Çınar | Plane Tree |
| Kule | Tower | Yayla | Highland |
| Bahçe | Garden | Koru | Grove |
| Köprü | Bridge | Kervan | Caravan |
| Fener | Lighthouse | Değirmen | Mill |
| Vadi | Valley | Göl | Lake |
| Pınar | Spring | Bağ | Vineyard |
| Meydan | Square | Pazar | Market |
| Tepe | Hill | Kale | Castle |
| Ada | Island | Gar | Terminal |
| Saray | Palace | | |

Önekler: Yeni New · Eski Old · Kuzey North · Güney South · Doğu East · Batı West · Yukarı Upper · Aşağı Lower · Büyük Great · Küçük Little. "Hat" → "Line" (ör. `M1 · Liman Hattı` → `M1 · Harbor Line`).

### Arayüz

Çekirdek arayüzde (`game.js`, `index.html`) kullanılan terimler. Yeni metin yazarken buradaki karşılıkları kullan.

| Türkçe | İngilizce |
|---|---|
| Bölüm 12 | Level 12 |
| Hatlar (harita) | Lines |
| Sonraki · Tekrar · Tekrar dene | Next · Retry · Try again |
| Paylaş · Ana sayfa | Share · Home |
| Arkadaşına meydan oku | Challenge a friend |
| Hat açıldı! (bölüm bitti) | Connected! |
| Hattı gör · Sonuç | See line · Results |
| tam vaktinde · rötar | on time · late |
| ↻ HAMLE HEDEFİ · ↻ HEDEF AŞILDI | ↻ MOVE TARGET · ↻ OVER TARGET |
| Kıl payı | So close |
| Kusursuz için: … ve … | For perfect: … and … |
| KUSURSUZ · YENİ HAT AÇILDI · TEMA ALINABİLİR | PERFECT · NEW LINE OPEN · NEW THEME |
| YENİ KURAL · Anladım | NEW RULE · Got it |
| ⚡ zorluk %30 | ⚡ 30% hard |
| ☕ mola · ☕ mola bölümü | ☕ breather · ☕ breather level |
| Sıradaki (tema) | Next up |
| 🎫 3 yeni bilet · +1 ipucu | 🎫 3 new tickets · +1 hint |
| İlerlemeyi taşı · Kodu kopyala · Kodu yükle | Move progress · Copy code · Load code |
| Bize yaz · Öneri · hata | Contact us · Ideas · bugs |
| güçlendirici | booster |
| 🔄 Ek tur · 🔦 Fener · ⏱ +15 sn · ↶ Geri al | 🔄 Extra turn · 🔦 Lantern · ⏱ +15 s · ↶ Undo |
| ★ 11 kaldı → M3 | ★ 11 to go → M3 |
| Tamamlandı ✓ · Hazır | Done ✓ · Ready |
| 5 günlük seri | 5-day streak |
| en iyi seri · toplam gün | best streak · total days |
| Seriyi kurtar | Save streak |
| İpucu parçası 1/3 | Hint piece 1/3 |
| ▶ 2 katı | ▶ Double |
| İzle · +2 ipucu | Watch · +2 hints |
| Vazgeç · Kapat · Tamam | Cancel · Close · Done (OK) |
| Bilet topla | Earn tickets |
| Bakiye · Satın al · Seç · Seçili | Balance · Buy · Select · Selected |
| Temalara dön | Back to themes |
| Trenin · Trenine tak | Your train · Put on your train |
| Hat rengi (kaplama) | Line color |
| seri kalkanı | streak shield |
| Ayarlar: Müzik · Efekt sesleri · Titreşim · Günlük hatırlatma | Music · Sound effects · Vibration · Daily reminder |
| Görünüm: Oto · Koyu · Açık | Theme: Auto · Dark · Light |
| Dil | Language (seçenekler kendi dilinde: Türkçe · English) |
| Gizlilik politikası · Reklam gizlilik seçenekleri | Privacy policy · Ad privacy options |
| Verilerin silinsin mi? · Evet, hepsini sil | Delete your data? · Yes, delete it all |
| Satın alımı geri yükle | Restore purchase |
| Hatırlatayım mı? · Evet, hatırlat · Şimdi değil | Want a reminder? · Yes, remind me · Not now |
| Kaldığın yeri hatırlatayım mı? | Remind you where you left off? |
| Bölüm 12 seni bekliyor · bir dakikalık bulmaca | Level 12 is waiting · a one-minute puzzle |
| Reklamsız oyna · {fiyat} | Play ad-free · {price} |
| Şu an video yok · biraz sonra dene | No video right now · try again soon |
| Nasıl oynanır? · İleri › · ‹ kaydır › · Hadi oynayalım! | How to play? · Next › · ‹ swipe › · Let’s play! |

Renk temaları: Metro · Sunset · Ocean · Forest · Desert · Sakura · Neon Night · Northern Lights · Lava · Cosmos · Glacier · Spring · Autumn · Coral Reef · Tea Garden · Tulip · Storm · Midnight · Rainbow · Retro Wave · Pastel · Dawn · (reklamsız) Gold · Diamond · Ruby.

Tren kaplamaları: Line color · Red Express · Night Train · Mint · Retro · Sunset · Ice · Lavender · Gold Express.

- Kodda yerel `L` adıyla değişken tanımlama: küresel `L()`'yi gölgeler. Metin içeren işlevlerde başka ad kullan (`lim`, `lo`, `list`).
- Durağan HTML'de `data-en` yalnız JS'in sonradan değiştirmediği öğelere konur (çeviri `DOMContentLoaded`'da uygulanır, JS'in yazdığını ezer).

### Kural metinleri

Kural kartlarında, `block()` mesajlarında ve bildirimlerde kullanılan terimler (`www/rules/*.js`):

| Türkçe | İngilizce |
|---|---|
| düz · sapak (makas yolu) | straight · branch |
| kesik çizgi | dashed line |
| kapaklı karo | covered tile |
| silik kol (?) | faint arm (?) |
| tabelalı karo · ok | signpost tile · arrow |
| ayraç (gizli depo) | bracket |
| depo | depot |
| tabla | table |
| halka | loop |
| kesik çemberli karo · çember | dashed-ring tile · ring |
| nehir · kıyı · geçit | river · bank · ford |
| tampon | buffer |
| rozet (sayı rozeti) | badge |
| tünel ağzı · harf | portal · letter |
| kesikli kare · sınır | dashed square · border |
| geçiş (sınırdan geçen hat) | crossing |
| baştan (↺) | restart |
| dönmez | doesn't turn |
| ray bağlama | don't connect |

- Kart etiketi küçük harfle: `Yeni: tünel ağzı` → `New: tunnel portal`.
- Sayılı bildirimler tekil/çoğul ayrılır: `⊘ 1 station is closed` / `⊘ 2 stations are closed`, `1 buffer` / `2 buffers`, `1 crossing` / `2 crossings`.
