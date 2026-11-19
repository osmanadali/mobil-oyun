# M30 · Dönüşen karo (`morph`)

Hat M30, ilk bölüm 773 (`line: 29`, `ord: 28`). Dosyalar: `www/rules/donusen-karo.js`, `tools/hakem/donusen-karo.cjs`, çeviri `tools/diller/sozluk-10.txt`.

**Kural.** Kesik çerçeveli karo her dokunuşta **döner ve biçim değiştirir: köşe ↔ düz**. Dört hâl sırayla gelir, 4 dokunuşta başa döner. Sağ alttaki küçük kutu, dokununca gelecek hâli gösterir (çözüm yönünü değil, yalnız bir sonraki hâli). Oyuncuya: "Kesik çerçeveli karo her dokunuşta döner ve biçim değiştirir: köşe ↔ düz. Köşedeki küçük resim bir sonraki hâlini gösterir; 4 dokunuşta başa döner."

## Tanım (kesin)

Maske bitleri `K = 1, D = 2, G = 4, B = 8`. İki döngü (aile) vardır; B, A'nın 90° çevriğidir:

| Aile | 1. hâl | 2. hâl | 3. hâl | 4. hâl |
|---|---|---|---|---|
| A | K·D köşe (3) | D–B düz (10) | G·B köşe (12) | K–G düz (5) |
| B | D·G köşe (6) | K–G düz (5) | B·K köşe (9) | D–B düz (10) |

- Her dokunuş döngüde bir adım ilerler: biçim her seferinde değişir (köşe → düz → köşe → düz), köşe iki dokunuşta 180° döner, düz iki dokunuşta 90° döner.
- Her köşe tek bir aileye düşer (K·D ve G·B → A; D·G ve B·K → B). Düz karo iki ailede de vardır; çözümü düz olan karonun ailesi `R()` ile seçilir. Aile karo başına sabittir: `out.morph[i]` = 1 (A) ya da 2 (B), dönüşen olmayan karoda 0.
- Durum yalnız maskededir (karo başına aile sabit, döngüde aynı maske bir kez geçer). Bu yüzden ↶ geri al, kayıt/sürdürme, ipucu, çözücü ve robot ek bilgi istemez; eklenti `undo` kancası gerekmez.

**Neden 8 değil 4 durum.** İki kollu karonun yalnız 6 farklı maskesi vardır (4 köşe + 2 düz). Her dokunuşta biçim değişen ve 4 köşeyi de dolaşan bir döngü 8 adımlıdır ve her düzü iki kez, farklı devamlarla içerir: sıradaki hâl maskeden okunamaz, karoda gizli bir sayaç gerekir. Bu sayaç çekirdeğin birim sözleşmesini (`tap(cur)` yalnız diziyi değiştirir), geri al'ı ve kaydı bozardı. 4 durumlu aile döngüsü aynı kuralı (her dokunuşta dön + biçim değiştir) bozmadan, maskeyle tam tanımlıdır.

## Üretim (`shape`, `ord: 28`)

Eşliden sonra, ters/sayaçlıdan önce (`shape` aşaması):

1. Aday: `C.free(i)` (merkez, eşli, sabit, başka birim değil), `keep` değil (köprü, tünel ağzı), çözümde **2 kollu** (köşe ya da düz; T ve uç karolar aday değil), iki merkeze de Manhattan uzaklığı ≥ 2 (karanlık tünelin "merkez komşusu bağlı gelmesin" adımı birimi çeviremez; makasla aynı).
2. Aday `R()` ile seçilir; aile köşede maskeden, düzde `R()` ile.
3. Başlangıç: `t = 1 + R()·3` dokunuş geride → `cur[i] = döngü[(çözüm − t) mod 4]`. Başlangıç hiçbir zaman çözüm değildir; çözüme 1–3 dokunuş.
4. Birim: `C.unit([i], 4, c => { c[i] = sonraki(c[i]) }, 'morph')`. Hücre `busy` olur; ters, sayaçlı, soğuyan karo, ekspres durak, bakım karosu vb. ona dokunmaz.

Miktar: tanıtım bölümü 2, sonra `max(3, round(n · 0,065))` (6×8 → 3, 7×9 → 4), hat finali +1. `R()` yalnız dönüşen karolu bölümde tüketilir.

## Çözülebilirlik

- Döngü çözüm maskesini içerir (aile çözüm maskesine göre seçilir) ve başlangıç aynı döngüdedir; `t` dokunuşta karo tam çözüm maskesine oturur. Öteki karolar çekirdeğin karıştırmasıyla aynı kalır (karıştırma yalnız geri alınabilir işlemlerle). Dolayısıyla çözüm dizilimi her zaman ulaşılabilir.
- Kural oyuncuya bilgi vermez, gizli bilgi yoktur (`cands` yok): karo görünür, yalnız ulaşılabilir maskeler değişir.
- Çözücü (`difficulty`) birimin `K = 4` durumunu `tap` ile kendisi çıkarır: karonun aday maskeleri tam olarak döngüdeki dört maskedir. Robot (`__ray.plan` → `unitTaps`) ve ipucu (birimi çözüme oturtur) çekirdekte hazır.
- Doğrulama (336 tohum, 6×8 · 7×9, kuralsız, iki merkez, karanlık+ters+sayaçlı ve uyumlu her eklentiyle): çözüm geçerli 336/336, çözülmüş gelen 0, döngü dışı başlangıç/çözüm 0, çözücünün yapraklarında döngü dışı maske 0, çözücü çözümü 336/336 bölümde bulur.

## Zorluk

Çözücü puanı (7×9, aynı 40 tohum: ağaç ve öteki karoların karışıklığı aynı, yalnız dönüşen karolar farklı; `shape` aşamasında `R()` tüketimi ağaçtan sonradır):

| Ölçüm | Puan |
|---|---|
| Kuralsız | 13,7 |
| 4 dönüşen karo | 14,2 |
| 6 dönüşen karo | 15,1 |

Etki: düz çözümlü karonun aday maskesi 2'den 4'e çıkar; köşe çözümlü karoda adaylar iki köşe + iki düzdür (her yönde kol 2/4, ama biçim belirsiz). Komşu kenar çıkarımı bu yüzden daha geç kesinleşir. Ayrıca köşeyi tersine çevirmek 2 dokunuştur.

Merdiven (`boost: 14`, ekspres durağın ölçüm yöntemiyle: hattın 28 bölümünün `puzzleFor(l).diff` ortalaması):

| Hat | Ortalama |
|---|---|
| M26 kayan sütun | 20,9 |
| M27 ekspres durak | 23,6 |
| **M28 dönüşen karo** | **25,3** |
| M29 karma | 21,2 |

`boost` denemeleri: 7 → 21,7 · 9 → 22,7 · 11 → 23,7 · 13 → 24,2 · 14 → 25,3 · 15 → 27,1. M27'nin üstünde, sıçramasız ilk değer 14 seçildi. (Not: `KARMA` 27 → 28 olduğundan M28 artık karma payı +3,5'i almaz; M28 eskiden karma iken ölçülen ~21,6 değeri yerine ekspres hattının bugünkü ortalaması 23,6'dır.)

## Çakışma

`clash: ['sw', 'faint']`:

- **Makas** dokununca düz ↔ sapak değişir ve kesik kol çizer; dönüşen karo da biçim değiştirir ve kesik çerçeve taşır. İkisi aynı tahtada karışır.
- **Silik kol**: kolun var olup olmadığı belirsizdir; biçim değiştiren karoyla aynı tahtada "bu karoda kaç kol var" sorusu iki ayrı anlam taşır.

Ters (`rev`), sayaçlı (`cnt`) ve eşli (`pairs`) karolarla hücre düzeyinde çakışma yoktur: dönüşen karo birimdir (`busy`), eşli adaylar `free` ile, ters/sayaçlı adaylar `free` ile dışlanır. Bu yüzden onlarla aynı bölümde gelebilir; işaretleri de farklı köşelerde ve biçimdedir (↺ sağ alt yalnız ters karoda, sayaç sol alt).

## Oyun ve çizim

- Dokunuş: çekirdek birim dokunuşu (`tap`), art arda aynı karo 1 hamle. `onTap`: yeni hâl 90° dönerek gelir (`anim`; azaltılmış harekette yok), kısa yumuşak ses, oyuncu başına bir kez bildirim "🔄 Dönüşen karo · her dokunuşta döner ve biçim değiştirir: köşe ↔ düz".
- `under`: karonun içinde kesik çizgili iç çerçeve (renkten bağımsız biçim işareti), bütün dönüşen karolar tek yolda.
- `over`: sağ altta küçük kutu ve içinde **sıradaki hâlin** mini rayları (soluk, nötr renk). İpucuyla sabitlenen karoda ve kazanınca çizilmez. Ray kolları kutuya değmez (kol genişliği ±0,085 s, kutu 0,17–0,43 s).
- Karanlık tünelde karo görünmeden çerçeve ve kutu çizilmez (`vis`).
- 4× yavaş CPU, 7×9 hat finali (5 dönüşen karo): kare çizimi ortanca 1,6 ms (p95 4,4), dönüşen karo kancaları ortanca 0,1 ms.

## Bilinen sınırlar

- Karo dört hâlden yalnız ikisinde köşedir (ailesinin iki karşı köşesi); "her köşeye dönebilir" değildir. Kartta "4 dokunuşta başa döner" diye söylenir, mini önizleme bir sonraki hâli gösterir.
- Kural çözücü puanını az artırır (karo başına ~0,15–0,25); merdivenin geri kalanını `boost` taşır.

## Test

`tools/hakem/donusen-karo.cjs`: `rule.morph.gen` (336 tohum), `.solver` (yaprak dizilimleri döngüde, çözüm bulunur, zorluk önce/sonra), `.clash` (900 bölüm), `.line` (M27'den önce yok, hattın her bölümünde, giriş 2, final 5, merdiven M26 < M27 < M28), `.old` (eklenti çıkarılınca 1–716 ve Günün Hattı aynı), `.card` (9 dil, 320×568), `.tap` (dokunuş dizisi döngüyle aynı, her dokunuşta biçim değişir, 4 dokunuş = 1 hamle, bildirim), `.play`, `.mid` (7×9), `.fog`, `.perf` (4× yavaş CPU), `.errors`.
