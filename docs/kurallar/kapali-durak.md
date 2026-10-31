# M22 · Kapalı durak (anahtar: `closed`)

> **Hat düzeni 31 Ekim'de değişti:** bu kural artık **M22** (ilk bölüm 549). Aşağıdaki hat ve bölüm numaraları ve ölçümler eski düzene aittir; güncel tablo `docs/kurallar/README.md`.

> Tasarım başvurusu: `proto-zor` dalında `proto/zor/tasarimlar.json` (id `kapali-durak`) ve `proto/zor/gizli/plugins.cjs` (CLOSED). Prototip pre aşamasında delik açıyordu ve adil olmayan adayları reddediyordu. Bu uygulama yerleştirmeyi değiştirdi (aşağıda "Prototipten farklar").

## Kural kartı metni

Bazı duraklar <b>kapalı</b> ama sıradan görünür; merkezdeki <b>⊘ sayısı</b> kaç tane olduğunu söyler. Kapalı durağa <b>ray bağlama</b>, açıkların hepsini bağla.

Demo: solda bir durak, ortada merkez ve köşesinde "⊘1" rozeti, sağda bir durak. Soldaki durağa ray uzanır ve durak yanar. Sağdakine uzanan ray durağı yakmaz: titrer, geri çekilir ve durağın üstüne ⊘ damgası iner. Hareketi azaltma açıksa son hâl durur.

## Mekanik

- Hattın bir durağı (7×9 hat finalinde iki durağı) **kapalıdır**: çözümde hiçbir ray ona bakmaz.
- Kapalı durak sıradan durak gibi görünür (tek kollu karo), döner ve hamle sayar. Bu yüzden görünüşünden bilgi sızmaz.
- Merkez karosunun sağ üst köşesindeki hap rozeti `⊘k`, kapalı durak sayısını verir. Bilgi renkle değil, sayı ve simgeyle verilir.
- Kazanma: kapalı karo yok sayılır (`P.void`). Öteki bütün karolar bağlı olmalı ve açık uç kalmamalıdır. Kapalı durağa bakan her ray açık uçtur.
- Kazanınca kapalı durakların üstüne ⊘ damgası iner (büyükten oturur, 420 ms).
- İlk dokunuşta ömürde bir kez bildirim gelir: "⊘ 1 durak kapalı · ona ray bağlama".
- Her şey yandığı hâlde bir ray kapalı durağa bakıyorsa bölümde bir kez "Kapalı durağa ray bağlanmaz" uyarısı gelir.

Neden zor: duraklar oyuncunun en güvendiği çıpadır ("uç mutlaka bağlanır"). Bu kural o çıpayı şüpheli yapar. Her durak için dört yön ya da kapalı olmak üzere beş olasılık vardır. Hangisinin kapalı olduğu yerel ipucuyla değil, sayım ve bağlantı zinciriyle bulunur (Mayın Tarlası tipi çıkarım).

## Üretim

Miktar: `fin && n >= 63 ? 2 : 1`. Tanıtım (601–603, 6×8) ve hattın geri kalanı 1 kapalı durak, 7×9 hat finali (672) 2 kapalı durak taşır.

`mark` aşamasında (sayaçlı karodan sonra, karanlıktan önce) çalışır. R() yalnız kapalı duraklı bölümde tüketilir.

1. **Aday:** çözüm ağacının bir yaprağı (sol'de tek kollu karo). Aşağıdaki karolar aday olamaz:
   - merkez, sabit, eşli, ters ya da sayaçlı karo, birim (makas, tabla) ve `keep`/`busy` karolar (köprü, tünel ağzı, halka işareti);
   - merkezlere Manhattan uzaklığı 2'den küçük olanlar;
   - köprü ya da tünel ağzına ve başka bir kapalı durağa 8-komşu olanlar.

   Yaprağın ebeveyni de çıplak olmalı (merkez, `keep`, `busy`, birim ya da eşli değil) ve en az 2 kolu bulunmalı.
2. **Kesme:** ebeveynin yaprağa bakan kolu silinir: `sol[p] &= ~o`. Ebeveynin `cur` değeri aynı dönüş sayısıyla güncellenir; sabit karoda dönüş 0'dır. Kapalı karonun kendi rastgele dönüşü `sol` kabul edilir (`sol = cur`). Böylece par, ipucu ve robot ona hiç dokunmaz.
3. **Adillik:** adaylar R() ile karıştırılır ve sırayla (en çok 10 aday) denenir. İlk adil aday seçilir.
   - Adillik `api.difficulty(P, leaf, 3000)` ile ölçülür. İnanç modeli şudur: her durak dört yönden biri ya da kapalı (0), tam k kapalı. Yaprak, kapalı kümesini anahtar olarak toplar.
   - Anahtar tek ve arama tavana takılmadan bittiyse aday adildir.
   - Hiç adil aday yoksa ilk aday kesilir, `P.reject = 1` olur ve kapalılar baştan ⊘ ile gösterilir (`closedShown`; dönmezler). Seçici reddedilmiş adayı ancak hepsi reddedilmişse alır, aldığında da bölüm adildir.
   - Ölçülen 600 üretimde ve 392 hat bölümünde hiç ret çıkmadı.

**Çözülebilirlik kanıtı:** Yaprak kenarını silmek ağacı bölmez. Kalan kenarlar, kapalı karo dışındaki bütün karoları kapsayan bir ağaçtır (iki merkezde iki ağaç). Ebeveynin en az bir kolu kalır. Köprü ve tünel ağzı kenarları yaprak kenarı olamaz, çünkü komşuları aday dışıdır. Halka döngüsündeki karolar yaprak değildir. Karıştırma yalnız döndürmedir ve ebeveynin yeni maskesi aynı dönüşle döndürülür. Sayaçlı ebeveynde gereken dokunuş ≤ 3 kalır, ters karoda yön değişmez. Bu yüzden `sol` her zaman ulaşılabilirdir. `lit` kapalı karoyu 0 maske sayar ve onun yanmasını beklemez (`P.void`), dolayısıyla `lit(sol)` çözülüdür.

## Çözücü kancaları

- **`cands(P, i)`:** her görünür durak (merkez, sabit, eşli ya da birim değil) için `[0, ...yörünge(cur[i])]` döner, yani kapalı ya da dört yön. Baştan gösterilen kapalı durak için `[0]` döner.
- **`prune(P, C, M, unit)`:** küresel sayım yapar.
  - Kesin kapalı sayısı k'yı aşarsa ya da olası kapalı sayısı k'nın altına düşerse −1 döner.
  - Kesin kapalı sayısı k'ya eşitse, öteki durakların "kapalı" seçeneği silinir.
  - Olası kapalı sayısı k'ya eşitse, olası durakların hepsi kapalı kesinleşir.
  - Bu, oyuncunun "tek kapalı buldum, gerisi açık" sayma çıkarımıdır. Prototipteki H5 yalnız çelişkiyi yakalıyordu (bool). Daraltma eklenince zorluk puanı gerçekçi düzeyine iner.
- **`P.void`:** `lit` kapalı karoyu 0 maske sayar. İpucu ona verilmez (çekirdek filtresi).
- **`P.reject`:** yukarıda anlatıldı.
- **`block`:** yalnız baştan gösterilen kapalı durağı engeller. Gizli kapalı durak normal döner.

## Ölçümler (gerçek kod, `__ray.generate(cols, rows, tohum, 0, 0, { closed: k })`)

**(a) Aynı tohumda kural açık/kapalı `difficulty()` farkı.** Tohumlar `s·7919+13`, s = 1…150 ya da 1…160.

| Izgara | k | Kapalı | Açık | Δ ortalama | Δ medyan | Δ p90 | Artan bölüm |
|---|---|---|---|---|---|---|---|
| 7×9 | 1 | 13,56 | 16,33 | **+2,8** | +1,0 | +7 | %51 |
| 6×8 | 1 | 12,82 | 15,31 | **+2,5** | +1,0 | +7 | %53 |
| 7×9 | 2 | 13,56 | 18,02 | **+4,5** | +1,0 | +14 | %63 |
| 6×8 | 2 | 12,82 | 17,83 | **+5,0** | +1,0 | +13 | %67 |

Robot testi 150 tohumla aynı ölçümü yapar: 7×9 +2,89, 6×8 +2,62.

**(b) Hat (puzzleFor 601–672).** M15 ortalaması 17,63'tür.

| boost | M16 ortalaması | Medyan | p90 | En yüksek |
|---|---|---|---|---|
| 0 | 16,32 | 15,9 | 17,8 | 19,8 |
| 2 | 18,30 | 18,1 | 19,8 | 21,8 |
| 2,5 | 18,64 | 18,4 | 20,3 | 21,8 |
| **3 (seçilen)** | **19,04** | 18,8 | 20,7 | 21,8 |

Seçilen pay 3'tür. 2,5 ile hedef (M15 + 1 = 18,63) yalnız 0,01 farkla geçiliyordu. İlk 3 tanıtım bölümünde pay uygulanmaz. Üretim süresi masaüstünde bölüm başına ortalama 40–70 ms'dir (24–32 aday, adaylık başına ~2,4 ms).

**Karışım** (7×9, 60 tohum, 1 kapalı, aynı tohumla karışım tek başına karşılaştırıldı):

| Kural | Δ | Kural | Δ | Kural | Δ |
|---|---|---|---|---|---|
| makas | +1,45 | tabela | +3,44 | iki merkez | +2,54 |
| köprü | +1,36 | tabla | +2,54 | karanlık | +1,60 |
| halka | +1,54 | tünel ağzı | +4,34 | ters | +1,91 |
| sabit | +1,37 | eşli | +0,93 | sayaçlı | +1,72 |

Hepsi 60/60 çözülebilir, ret yok.

**Eski bölümler.** Kural dosyası yüklüyken ve yüksüzken `puzzleFor(1…600)` ve 60 Günün Hattı (2026 boyunca haftalık) özetleri birebir aynıdır: `113dsf5` / `130ajvo`. Robot testi ayrıca şunları denetler:

- 1–600'de kanca çağrısı yoktur;
- `{closed: 0}` ile `{}` aynı sonucu verir;
- eklentisiz taban özeti (`BASE`) tutar.

## Prototipten farklar

- **Yerleştirme `pre` → `mark`.** Prototip deliği ağaçtan önce açıyordu ve sonra adilliği sınıyordu. Adil değilse tek çare reddetmek ya da kapalıyı baştan göstermekti. Gösterilen kapalı puanı tabanın altına düşürüyordu (ret alan adaylarda Δ −1,4). Ayrıca bütün adayların ~%24'ü reddediliyordu.
  - Burada ağaç önce kurulur, sonra adil bir yaprak seçilir. Ret 0'a indi, ortalama Δ prototiptekine göre gerçekçi düzeye geldi.
  - "En zor yaprağı seç" seçeneği de ölçüldü: 4 aday arasından en zorunu seçmek Δ'yı +5'e çıkarıyordu. Ama hat ortalamasını değiştirmiyordu (seçici zaten hedefe yakın adayı alıyor) ve üretimi 3 kat yavaşlatıyordu. İlk adil yaprak seçildi.
- **`prune` daraltma yapıyor** (README imzası: daralan birimler ya da −1). Prototipteki bool H5 ile ortalama Δ 7×9'da +6,0 görünüyordu, ancak bu oyuncunun yaptığı sayma çıkarımını saymadığı için şişkindi.
- **Çakışma.** Prototip `['portal', 'two', 'ring']` öneriyordu. Ölçümde üçü de sorunsuz çıktı: 60/60 çözülebilir, ret yok, 320 bölümlük taramada 28 halka, 28 tünel ağzı ve 5 iki merkez karışımı vardı. Bu yüzden kaldırıldı.
  - Bunun yerine öteki gizli bilgi kurallarıyla çakışma tanımlandı: `['cover', 'faint', 'depot']`. Gerekçesi: `cands` kancası karo başına tek eklentiyi dinler ve her eklentinin adillik denetimi yalnız kendi gizli bilgisini bilir.
  - O kurallar main'e girip birlikte ölçülürse bu çakışma kaldırılabilir.
- **Merkez rozeti ve ⊘ damgası** canvas yoluyla çizilir (yazı tipine güvenilmez). Kare başına 4–6 çağrı yapılır.

## Robot testleri (`tools/hakem/kapali-durak.cjs`)

| Kimlik | İçerik |
|---|---|
| `rule.closed.gen` | 7×9/6×8 × k = 1, 2 × 150 tohum (600 üretim). Denetlenenler: miktar, kapalı karo tek kollu ve `sol = cur`, yerleşim kısıtları, çözümde ona bakan ray yok, `lit(sol)` çözülü, hazır çözülü yok, ret yok. Ayrıca 120 bölümde prune KAPALI çapraz sayımla kapalı küme tek ve gerçek küme. |
| `rule.closed.diff` | Δ difficulty ≥ +1 (7×9 ve 6×8). |
| `rule.closed.old` | 1–600 ve Günün Hattı bit bit aynı. |
| `rule.closed.line` | M16'nın her bölümünde kural var; tanıtım 6×8/1, final 7×9/2; ortalama ≥ M15 + 1. |
| `rule.closed.card` | Kural kartı (demo, satır içi ⊘ simgesi, ≤ 30 kelime). |
| `rule.closed.play` | Kapalı duraka dokunmak döner, hamle sayar, yanmaz; ilk dokunuş bildirimi; yarım kayıt; ↺ baştan; robotla kazanma; ⊘ damgası. |
| `rule.closed.hint` | İpucu açık karoyu düzeltir, kapalıya dokunmaz. |
| `rule.closed.warn` | Yakın kazanç uyarısı bir kez; gösterilmiş kapalı dönmez. |
| `rule.closed.mix` | 601 sonrası 320 rulesFor bölümü: hepsi üretiliyor, çözüm geçerli, çakışan kural yok, ≥ 8 başka kuralla karışım. |
| `rule.closed.fog` | Kapalı durak + karanlık tünel bölümünü ışığı izleyen robot kazanır. |

## Bilinen sınırlar

- **Yoklama bilgi verir.** Bir durağa ray çevirip yanmadığını görmek bilgi verir, ama hamle yıldızına mal olur. Bu, Net türündeki ışık geri bildiriminin doğal hâlidir; zorluk puanı bunu saymaz.
- **Yerleşim kısıtları sızabilir.** Kapalı durak merkez yanında, sabit/eşli/ters/sayaçlı karoda ve başka bir kapalıya bitişik olmaz. Dikkatli bir oyuncu bunları çıkarım için kullanabilir. Puan modeli bu kısıtları bilmez, yani zorluğu biraz fazla sayar.
- **Aday modeli.** Çözücü sabit karolu durakları kapalı adayı saymaz (sabit karo doğru yöndedir). Ters ve sayaçlı durakları ise aday sayar. Oyuncu bunların hiç kapalı olmadığını bilmez.
- **Karanlık tünelde adillik** tam görünürlükle ölçülür. Karanlık, bilgiyi yalnız geciktirir.
- **Uzun kuyruk.** Δ p90 tek kapalıda +7, ikide +14'tür. Seçici hedefe en yakın adayı aldığı için hatta en yüksek değer 21,8'dir.
- **Karma hatlara etkisi (`rulesFor`).** Karma hatlarda ek kuralın yarısı en yeni 3 öğrenilmiş kuraldan gelir. M16 gelince bu üçlü "tabla, halka, tünel ağzı"ndan "kapalı durak, halka, tünel ağzı"na döner. Ölçümde karanlık tünel yalnız bu havuzdaki kurallarla eşleşti; bu yüzden 536–20000 arasında artık hiç "döner tabla + karanlık" bölümü yok (önce: 204). Aynı kayma, hat 15 ve sonrasına eklenen her kuralla olacak. Döner tabla testine (`tools/hakem/doner-tabla.cjs`, 4. bölüm) bunun için en küçük geri dönüş eklendi: böyle bölüm bulunamazsa M15'in tablalı bir bölümünde (540) karanlık açılır. Başlangıç ışığı çekirdekteki `reveal` ile aynı kuralla hesaplanır.
