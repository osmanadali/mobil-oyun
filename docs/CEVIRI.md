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
- Simgeler (★, 👑, ⏱, ↻, 🔥) iki dilde aynıdır.

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
| taç (👑) | crown |
| kusursuz | perfect |
| kusursuz seri | perfect streak |
| seri (günlük) | streak |
| seri kalkanı (🛡) | streak shield |
| sefer şeridi | trip bar |
| son durak (hat finali) | last stop |
| renk temaları | color themes |
| tren kaplaması | train livery |
| sürpriz sandık | surprise chest |
| Sıradan · Nadir · Destansı | Common · Rare · Epic |
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
