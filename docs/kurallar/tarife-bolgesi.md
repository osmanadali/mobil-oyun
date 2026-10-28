# M20 · Tarife bölgesi (anahtar: `zone`)

Oyunun son tanıtılan kuralı ve en zor hattı. Tasarım başvurusu: `proto-zor` dalı, `zone-tarife-bolgesi` (`proto/zor/tasarimlar.json`), prototip `proto/zor/kisit/bolge2.cjs`. Prototip eski kanca imzalarıyla yazılmıştı. Bu eklenti main'deki birleşik `open(P, i, k)`, `check`, `prune` kancalarını kullanır; `P.openAny` artık gerekmez.

## Kural kartı metni

Merkezi saran <b>kesikli karenin</b> sınırında ray ya <b>geçer</b> ya <b>tamponla biter</b>. Geçiş ve tampon sayısı <b>rozettekiyle</b> aynı olmalı. (19 kelime)

Demo: kesikli kare, ortada merkez. Önce yatay ray kareyi geçer ve sınırda kapı çentiği belirir, `⇄ 1/1` hapı dolar. Sonra dikey ray sınırda tamponla biter, `⊣ 1/1` hapı dolar. Hareketi azalt açıkken bitmiş hâl görünür.

## Mekanik

- Merkezin çevresinde Chebyshev yarıçapı 1 olan kare bölge vardır (3×3 karo). Sınırı, bir yanı içeride öbür yanı dışarıda olan 12 komşu kenardır.
- Sınır kenarında iki yan da kollu ise ray **geçer**. Yalnız bir yan kollu ise ray orada **tamponla biter**: bu kol gevşek uç sayılmaz.
- Bölümün iki sayısı rozette yazar: sınırdan tam **B** geçiş ve tam **T** tampon. Bütün bölümlerde T = 1. B çözümden sayılır (7×9'da ortalama 7).
- Sınır dışında eşsiz biten kol eskisi gibi gevşek uçtur.
- Değişmeyenler: tek dokunuş ve 90° dönüş. Bölge sabittir. Süre baskısı ya da şans yoktur.

**Neden zorlaştırıyor:** Normalde kenarlardan gelen zincirler merkez çevresinde birleşir ve merkez en son, en kolay çözülen yerdir. Sınır yumuşak olunca kenar bilgisi bölgeye girmez. Oyuncu içeriyi ve dışarıyı ayrı düşünür, sonra iki küresel sayıyla eşleştirir. "Bu kol sınırı geçiyor mu, tampon mu?" sorusu ancak bütün sınır sayılınca yanıtlanır. Karşı deneyde (prototip) yalnız "tam B geçiş" ipucu bulmacayı kolaylaştırıyordu (Δ −1,6). Zorluğu, yumuşak sınır ile sayımın birlikte olması katar.

## Üretim ve çözülebilirlik kanıtı

1. **`tree(C)` aşaması** ağaçtan sonra, karıştırmadan önce çalışır. Halka kenarı (M17, `tOrder` 16) daha önce eklenmiş olur.
2. Sınır kenarları `E` (n·4, simetrik) ve tek sayımlık liste `pr = [i, k, j]` (k = D ya da G) kurulur.
3. **Tampon adayı** sınır kenarındaki (i, k) çiftidir. Şartlar:
   - `sol`'de iki yan da kolsuz;
   - i merkez değil, `keep` değil (köprü, tünel ağzı, halka işareti), `busy` değil;
   - `popc(sol[i]) ≤ 2`.
4. Birbirine değmeyen T aday `sol[i] |= bit` ile eklenir. B, eklemeden sonra `sol`'deki geçiş sayısıdır.
5. **Kanıt:** `sol` bir yayılan ağaç artı T eşsiz koldur. Eşsiz kolların hepsi sınır kenarındadır ve `open` 1 döndürür. Bu yüzden `lit(sol)` gevşeksiz, bağlı ve karışmasızdır. `check(sol)`: geçiş B (tanım gereği), tampon T. Karıştırma yalnız döndürmedir ve geri alınabilir. Kural `R()`'yi yalnız `x.zone` sıfırdan farklıyken tüketir (aday seçimi).
6. **Adillik (`mark`):** sayaçtan sonra çalışır, bütün birimler kuruludur. Çözücünün yaprağı ile çözüm sayılır (`api.difficulty(P, leaf, 600)`, 2. çözümde durur). Tek çözüm yoksa ya da tampon konamadıysa `C.out.reject = true` olur ve `pick` başka aday seçer. Karanlık ve "çözülmüş gelmesin" yalnız `cur`'u döndürür, çözüm kümesini değiştirmez. Rozetteki iki sayı ve sınırın kendisi görünür bilgidir, gizli bilgi yoktur.
   - Ölçüm: kuralsız 7×9'da adayların %92'si tek çözümlü, bölgeyle %76'sı.
   - Reddedilen aday oranı 7×9'da %22, 6×8'de %20. Tampon konamayan aday ~%0,3.
   - Tarama 24–32 aday olduğundan her bölümde reddedilmemiş aday bulundu: M20'nin 88 bölümünde ve karma 300 bölümde reddedilen 0.

## Kazanma

- `lit`: sınır kenarında `open` doğru döndüğü için tek yanlı kol gevşek sayılmaz. Öteki her şey (bağlılık, karışma, sınır dışı gevşek uç) aynıdır.
- `check(P, L)`: geçiş (`L.zb`) ve tampon (`L.zt`) eklentinin kendisi tarafından sayılır, `L.open`'a güvenilmez. Böylece `open` kullanan başka kurallarla karışınca sayım kirlenmez. Bozuk sayısı `(zb ≠ B) + (zt ≠ T)` olur. `P.void` karosu kolsuz sayılır.
- `L.zNear`: geri kalan her şey tamam, yalnız sayılar tutmuyor. `after()` bu duruma ilk geçişte rozeti nabız attırır. Bölümde bir kez "Sınırdan B hat geçmeli, T tampon olmalı" bildirimi çıkar.
- İlk tampon oluştuğunda ömürde bir kez "Sınırda biten ray tampon olur · rozetteki sayıya bak" bildirimi çıkar (`save.zoneTold`).

## Çözücü (`prune`)

- `open` doğru dönen sınır kenarında çekirdek yerel denetimi bırakır. `prune` her turda sınır kenarlarının durum kümesini kurar: {0 yok, 1 tampon, 2 geçiş}.
- Tampon ve geçiş için iki sınır hesaplanır: Σkesin (durumu yalnız o olan kenarlar) ve Σolası (o durumu alabilen kenarlar).
  - Σkesin > sayı ya da Σolası < sayı ise çelişkidir (−1).
  - Σolası = sayı ise o durumu alabilen her kenar o durumda olmalıdır.
  - Σkesin = sayı ise kesin olmayan kenarlarda o durum yasaktır.
- İki yan aynı birimdeyse (eşli karo, döner tabla) aynı durum numarasını paylaşır; kesişim tam hesaplanır.
- Daraltma her zaman sağlamdır: yalnız hiçbir uyumlu eşi olmayan durumlar silinir.
- Robotta doğrulandı: 300 tohumda ve karma her eklentiyle (60'ar tohum, büyük tavan) çözücü her zaman bir çözüm buldu.

## Çizim (kare başına 10–14 çağrı)

- **Sınır** (`under`): karolar arası boşlukta tek yol, kesikli kare. İki sayı tutunca hat renginde, yoksa gri. Karanlık tünelde örtünün üstünde (`top`) çizilir.
- **Bilet kapısı** (`over`): geçiş noktasında rayın iki yanında iki kısa direk. Yanan hatta hat renginde, sönükte gri. Renk başına bir yol.
- **Tampon** (`over`): kolun sınırdaki ucunda dik çubuk ve iki uçta zemin renginde nokta.
- Karanlık tünelde iki yanı da görünmeyen kenara işaret çizilmez. Rozet de yalnız görünen kenarları sayar, böylece karanlık karonun kolu ele verilmez.
- **Rozet** (`top`): karoların üstünde değil, tahtanın üstünde, bölgenin hizasında (`pad`: üstte .62 karo). İki hap var: geçiş için ⇄ `b/B`, tampon için ⊣ `t/T`. Simgeler çizgiyle çizilir, yazı tipine güvenilmez.
  - Tutan hap hat renginde doludur, tutmayan çerçevelidir: ayrım biçimle de yapılır, renk körü dostu.
  - Tünel ağzının üst sekmesiyle çakışırsa hap yana kayar.
- 360 px genişlikte ölçüldü: 6×8'de s = 52, 7×9'da s = 43–45. Rozet tahta dışında, okunur. Ekran görüntüleri: `hakem-out/shots/zone*.png`.

## Çakışma (`clash`)

Liste: `['two', 'river']`.

- **İki merkez:** bölge yalnız birini sarardı.
- **Nehir (M18):** aynı mekanizmadır (yumuşak sınır + sayım). Aynı bölümde iki rozet kalabalık olur ve iki kuralı ayırt etmek zorlaşır. Görsel ayrım: nehir dalgalı çizgi, bölge kesikli kare + bilet kapısı.
- Prototipteki `['bridge', 'table', 'two']` gözden geçirildi.
  - **Köprü:** bölünmüş karo her zaman dört kollu olduğundan sınırda düzgün sayılır. Robotta 60 tohumda çözüm geçerli ve çözücü sağlam: dışlanmadı.
  - **Döner tabla:** aynı birimdeki iki karo sorununu `prune` tam çözüyor. 60 tohumda geçerli: dışlanmadı.
- Karma hatlarda (M21+, `rulesFor` ile 300 bölüm) bölgeyle birlikte gelenler: makas, köprü, tabela, döner tabla, halka, tünel ağzı, sabit, eşli, ters, sayaçlı, karanlık. Hepsi üretildi ve çözüm geçerli.

## Ölçümler (gerçek kod, `__ray.generate`, `difficulty`, `puzzleFor`)

Aynı tohum ve boyut, kural kapalı/açık (`{ zone: 1 }`), 200 tohum:

| Boyut | Kapalı | Açık | Δ | Artan tohum | Yalnız tek çözümlü (reddedilmeyen) adaylarda Δ |
|---|---|---|---|---|---|
| 7×9 | 14,14 | 22,08 | **+7,94** | %88 | +7,2 |
| 6×8 | 11,70 | 17,42 | **+5,72** | %81 | +4,5 |

Robottaki ayrı 160 tohumluk ölçüm: 7×9'da 14,70 → 22,74, 6×8'de 12,12 → 19,23.

Hattın bölümleri (`puzzleFor`, M20 = 913–1000, 88 bölüm), ortalama `P.diff`:

| boost | 0 | 3 | **4** | 5 |
|---|---|---|---|---|
| M20 | 16,7 | 19,5 | **20,4** | 21,3 |

- M19 ortalaması 17,6. Seçilen boost 4: M20 ortalaması **20,4** (+2,8), en yüksek bölüm 24,0.
- Boost 5 sınırı aşılmadı. Hattın ortalaması M19'dan belirgin yüksek ama 25'in altında kalıyor.
- Karma 300 bölümde (M21+) bölgeli bölümlerin ortalaması 20,3.
- Kuralın kendi hattının ilk 3 bölümünde boost uygulanmaz. 913 tanıtımdır (6×8, hedef −2), 913–915 testere dişidir (6×8), 916'dan sonra 7×9.

Süre: bölüm başına üretim ~57 ms (M19'da ~21 ms). Artışın sebebi aday başına bir de çözüm sayımı yapılması. Sonraki bölüm kazanma ekranında önceden hazırlanır.

## Eski bölümler

Parmak izi aynı: `tarife-bolgesi.js` yüklü ve yüksüz sayfada `puzzleFor(1..912)` (sol, cur, diff, par, taps, kurallar) ve 20 Günün Hattı birebir eşit. Robotta `rule.zone.fp`. `{zone: 0}` ile üretim ve zorluk birebir aynı (`R()` tüketilmez).

## Robot (`tools/hakem/tarife-bolgesi.cjs`)

- `rule.zone.gen`, `rule.zone.check`, `rule.zone.solver`: üretim, sınır, tampon, gevşek uç, yakın kazanç, çözücünün sağlamlığı ve tek çözüm.
- `rule.zone.diff`, `rule.zone.line`: zorluk farkı ≥ +1 ve hattın ortalaması ≥ M19 + 1.
- `rule.zone.old`, `rule.zone.fp`: eski bölümler ve Günün Hattı.
- `rule.zone.mix`: rulesFor ile 300 karma bölüm ve her eklentiyle doğrudan üretim.
- `rule.zone.intro`, `rule.zone.card`, `rule.zone.badge`: 913 tanıtım kartı ve 360 px'te rozet konumu.
- `rule.zone.resume`, `rule.zone.hint`, `rule.zone.win`: yarım oyun kaydı, ↺ baştan, ipucu ve kazanma.
- `rule.zone.warn`, `rule.zone.warnwin`: yakın kazanç uyarısı, açık tema.
- `rule.zone.portal`, `rule.zone.fog`: koyu tema, 360 px, tünel sekmesiyle çakışma yok, karanlıkta robot kazanır.

## Bilinen sınırlar

- Yakın kazanç dizilimi (her şey bağlı, sayılar tutmuyor) her bölümde bulunmaz. Bulunmayan bölümde kural yalnız çıkarım aracı olur, oyuncuyu "yanlış kazanca" düşürmez.
- Çözüm sayımı aday başına bir çözücü turu daha ekler. Düşük donanımda ilk bölüm açılışı birkaç yüz ms sürebilir.
- Karma hatlarda boost toplamı sınırlanmaz. Bölge (4) ile tünel ağzı (1) birlikte 5 ekler. Prototip doğrudan üretimde bu ikilinin ortalamasını ~26 ölçtü; `pick` hedefe yakın aday seçtiğinden bölüm puanı hedef civarında kalır.
- `rulesFor` karışımı, paralel oturumlarda yazılan çift hat kuralları (M10–M18) birleşince değişecek. O zaman karma taraması yeniden koşmalı. Testler sabit imza değil, yüklü/yüksüz karşılaştırması kullanır.
