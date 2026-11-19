# M33 · Boş peron (`yard`)

Hat M33, ilk bölüm 857 (`line: 32`, `ord: 32`, `tOrder: 30`). Dosyalar: `www/rules/bos-peron.js`, `tools/hakem/bos-peron.cjs`, çeviri `tools/diller/sozluk-15.txt`.

**Kural.** Tahtanın kenarındaki çerçeveli 3×3 **peronda** bir hücre **boş**. Peron karoları **dönmez**; boşluğa yatay/dikey bitişik bir peron karosuna dokununca o karo **boşluğa kayar** (15 bulmacası gibi). Karonun yönü değişmez, yalnız yeri değişir. Her kaydırma **1 hamle**. Oyuncuya: "Çerçeveli peronda bir yer boş. Peron karoları dönmez: boşluğa bitişik karoya dokun, karo boşluğa kayar. Her kaydırma 1 hamle."

Kayan sıra/sütundan (M5/M26) farkı: orada bir dokunuş bütün sırayı döndürür; burada her karo tek tek ve yalnız boşluk üzerinden hareket eder, karoları doğru yere **sırayla** taşımak gerekir. Kural bilgi vermez, yalnız zorlaştırır.

## Nasıl oynanır

1. Peronun dışındaki karolar her zamanki gibi döner.
2. Peronda boşluğa bitişik (en çok 4) karodan birine dokun: karo boşluğa kayar, eski yeri boşalır.
3. Boşluğun kendisine ya da boşluğa bitişik olmayan peron karosuna dokunmak hiçbir şey yapmaz (hamle sayılmaz; ilk seferde "Peron karoları dönmez · yalnız boşluğa bitişik karo kayar" bildirimi).
4. Bölüm, bütün tahta bağlanınca biter. Çözümde peronda bir hücre gerçekten boştur; boşluğun nerede olacağını oyuncu ağdan çıkarır.

## Tanım ve veri

- `out.yard = { cells, adj, goal, d }`: peronun 9 hücresi (satır satır), `adj[p]` peron içinde p. hücreye bitişik hücrelerin sırası, `goal` çözümdeki peron dizilimi (maskelerin onaltılık dizgisi, boşluk `0`), `d` başlangıcın çözüme en kısa kaydırma uzaklığı.
- `out.hole`: n uzunlukta 0/1; peron hücreleri 1. Çekirdek `lit` bu hücrelerden **maskesi 0 olanı** (o anki boşluk) bağlanması gereken karo saymaz.
- Her peron hücresi **tek karoluk birimdir** (`C.unit([q], 1, tap, 'yard')`). `tap(c)`: q'daki karo bitişik boşluğa kayar (`c[boş] = c[q]; c[q] = 0`), boşluk bitişik değilse bir şey olmaz.
- Durum yalnız maskededir: boşluk, peronda maskesi 0 olan tek hücredir. Geri al (`hist` → `cur`), kayıt/sürdürme (`runs.cur`) ve çözücü ek bilgi istemez.

## Üretim

**`tree` (tOrder 30, ağaç aşamalarının en sonu).** Aday blok: tahta kenarına değen 3×3; merkez, `keep` (köprü, tünel ağzı, halka işareti), `busy` ve halka döngüsü hücresi içermez. Blokta bir **yaprak durak** q seçilir: ebeveyni p (kolunun gösterdiği komşu) `keep`/köprü değil ve en az 2 kollu. Yaprak çıkarılır: `sol[p]`'den q'ya giden kol silinir, `sol[q] = 0`. p en az 2 kollu olduğu için bağlı kalır (en kötü durak olur); bir yaprağın çıkması ağacın geri kalanını bölmez, iki merkezin ayrılığını ve köprü yarılarını bozmaz (README'deki "ağaçtan kenar silme" yasağı bu yüzden yaprak için geçerli değildir: silinen kenar köprü/tünel/halka kenarı olamaz). Blok hücreleri `keep` ve `busy` olur: eşli, ters, sayaçlı, öteki birimler ve işaretler (tabela, mühür, soğuyan, sinyal, sarsıntı, ekspres…) perona girmez.

**`shape` (ord 30, shape aşamalarının en sonu).** Peron karoları çözüm yönüne konur (çekirdeğin rastgele döndürmesi geri alınır), sonra **çözümden başlayarak geçerli kaydırmalarla** karıştırılır: geri dönüşsüz rastgele yürüyüş (bir önceki kaydırmayı hemen geri almaz), en az `want` adım ve en kısa uzaklık `want`'a ulaşana dek (en çok `8·want` adım). Miktar `want` = hedef uzaklık: tanıtımda 4, 6×8 → 7, 7×9 → 9, hat finali +2. `R()` yalnız peronlu bölümde tüketilir → eski bölümler aynı.

**Par ve dokunuş.** Peronun ilk birimi `cost(cur)` = en kısa kaydırma sayısı, ötekiler 0 döndürür; çekirdek bunu hem `taps`'a hem `par`'a ekler (her kaydırma ayrı hamle). Böylece ↻ hamle hedefi kaydırmaları içerir (ör. 808. bölüm: 9 kaydırma, par 45, hedef 56).

**En kısa yol.** İki yönlü BFS (katman katman; aynı katmandaki buluşmaların en kısası seçilir → tam en kısa yol). Peron 3×3: durum uzayı ≤ 9!/2, en uzak durum 31 kaydırma; iki yönlü aramada her yan ~15 katman. Aynı maskeli karolar aynı sayılır (durum maskelerin dizgisi), bu yüzden yol ancak kısalır.

## Çözülebilirlik

- Başlangıç, çözüm diziliminden **geçerli kaydırmalarla** elde edilir; her kaydırma tersine çevrilebilir (karo geri kayar). Dolayısıyla çözüm dizilimi her zaman ulaşılabilir; 15 bulmacasının parite sorunu (permütasyonun yarısına ulaşılamaması) doğmaz, çünkü rastgele bir permütasyon değil, ulaşılabilir bir durum karıştırılır.
- Peron dışındaki karolar çekirdeğin karıştırmasıyla aynı (yalnız dönüş). Peron karoları dönmez ve çözümde de dönmemiş hâldedir (karıştırma yalnız yer değiştirir).
- Kazanma `lit` ile: peronun o anki boşluğu (maske 0) bağlanmak zorunda değildir; çözüm diziliminde bütün karolar yanar. Peron başka bir dizilimde de ağı tamamlıyorsa o da geçerli bir kazanmadır.
- Başlangıç çözülmüş değildir: en kısa uzaklık ≥ `want` ≥ 4 (bağımsız BFS ile doğrulanır) ve peron dışı karolar da karışıktır.
- Doğrulama (320 tohum, 6×8 · 7×9; kuralsız, iki merkez, karanlık+ters+sayaçlı+eşli ve uyumlu her eklentiyle): çözüm geçerli 320/320, çözülmüş gelen 0, peron kenarda 3×3 ve merkezsiz, çözümde tahtada tek boş hücre ve peronda, peron maskelerinin çoklu kümesi başlangıçla aynı (yalnız yer değişir), başlangıç çözüme 4–9 kaydırma (bağımsız BFS = eklentinin uzaklığı), par/dokunuş kaydırmaları içerir, başka eklentinin işareti peron hücresinde 0.

## Çözücü (`difficulty`): yaklaşım

Peronun tam durum uzayı büyük (≤ 181 440) olduğundan çözücü kaydırma sırasını aramaz; oyuncunun yaptığı çıkarımı taklit eder: **"bu yere hangi karo gelir?"**

- `cands(P, i)`: peron hücresi için aday maskeler = peron karolarının farklı maskeleri (boşluk 0 dahil), **döndürülmeden**. Her peron hücresi tek karoluk birim olduğundan çekirdeğin gizli karo yolu (`hid`) uygulanır.
- `prune`: sayım. Her maske peronda kaç kez varsa o kadar hücreye konabilir: sabitlenen hücre sayısı aşılırsa çelişki (−1); bir maskenin kotası dolunca öteki hücrelerden silinir; bir maske tam kotası kadar hücrede kalmışsa o hücreler o maskeye sabitlenir. Böylece yaprak dizilimi peron karolarının bir **permütasyonudur** (robot: 320/320'de yaprak dışı dizilim 0).
- Kaydırmanın ulaşılabilirliği (parite) çözücüde yok sayılır: puan yalnız "hangi karo nereye" çıkarımını ölçer, kaydırma sırası `par`/hamle hedefine ve süre hedefine (`taps`) yansır.
- İpucu ve robot gerçek yolu kullanır: ipucu en kısa yolun **ilk kaydırmasını** yapar (uzaklık 1 azalır, karo sabitlenmez, hamle sayılmaz), robot (`plan`) bütün yolu dokunur.

## Zorluk ölçümü

- Çözücü puanı, 7×9, aynı 40 tohum: kuralsız **13,7** → peronlu (uzaklık 9) **23,4**. Peron her bölüme 9 hücrelik bir "hangi karo nereye" bulmacası ekler; bunun üstüne 4–11 kaydırma gerekir (par ve süre hedefi büyür).
- Hat ortalaması `boost`'a göre (28 bölüm): 0 → 20,5 · 10 → 27,0 · 13 → **30,4** · 16 → 32,2 · 21 → 35,1 · 26 → 36,1 · 32 → 39,8. Seçici tavanı yok (21'den sonra artış yavaşlıyor ama sürüyor). Seçilen `boost: 13`.
- Merdiven: M29 sarsıntı 24,8 < M30 dönüşen 26,6 < **M31 boş peron 30,4**; karma M32 22,4.
- Robot: 801. bölüm 60 dokunuş, 808. bölüm (7×9, 9 kaydırma) 78 dokunuş.

## Oyun ve çizim

- `block`: boşluk ve boşluğa bitişik olmayan peron karosu dokunuşu reddeder (hamle, geçmiş, ses yok; ilk seferde bildirim).
- Çekirdek birim yolu: farklı hücreye her dokunuş yeni birim → her kaydırma 1 hamle ve ↶ geri al için ayrı adım (bir karo kaydıktan sonra eski yeri boşluktur, aynı hücreye art arda geçerli dokunuş olmaz). İpucu kaydırmasından sonra `G.lastTile` sıfırlanır.
- `onTap`: 170 ms yumuşak kayma (çıkış hücresinden varışa, `ease`), yumuşak üçgen ses, ilk dokunuşta bir kez bildirim (`save.yardTold`). Hareket azaltılmışsa kayma canlandırması yok.
- `xform`: peron karolarının dönüş canlandırması silinir (geri al/ipucu karoyu döndürmez), boşluğun zemini çizilmez, kayan karo konumu ara değerlenir.
- `base`: peron hafif dolgu + düz kenar + dışta kesik çizgi; boşluk kesik kenarlı, çapraz taralı yuva. Renk dışında biçimle ayrılır (kesik dış çizgi, tarama). Kare başına sabit sayıda yol.
- `reveal`: karanlık tünelde peronun bir hücresi görününce peronun tamamı aydınlanır (yeri değişen karolar karanlıkta kalmasın).
- Kural kartı: 2×2 çerçeveli peron demosu, sağ üstteki karo soldaki taralı boşluğa kayar ve geri gelir; dokunuş halkası. 320×568 px'te 9 dilde taşmaz.
- 4× yavaş CPU, 7×9 hat finali, 24 kaydırma: kare çizimi ortanca ~2 ms (p95 ~6–7), peron kancaları ortanca 0,1–0,2 ms; 7×9 bölüm üretimi (24–32 aday + çözücü) 4× yavaşta 160–390 ms (masaüstünde ~40–100 ms).

## Çakışmalar (`clash`)

`slide`, `column` (sıra/sütun kayması peronu keser), `table` (tabla da karoların yerini değiştirir), `wrap` (sarmal komşuluk ile peron kenarı karışır), `closed` (kapalı durak da yaprağı boşaltır, `void` ile `hole` aynı tahtada anlam karıştırır), `river`, `zone`, `depot` (konuma bağlı sayım/kıyı kuralları; kayan sıra/sütundaki gerekçe), `last` ve `gear` (hamle sayısına bağlı: son seferin saati ve bakım karosunun "her 2 hamlede bir" dönüşü kaydırmalarla değişir).

## Çekirdek değişiklikleri (en küçük hâl)

- `generate` par döngüsü: `U.cost` varsa birimin dokunuş sayısını o verir ve her dokunuş ayrı hamle sayılır (`par += r`).
- `lit`: `P.hole[i]` olan hücre maskesi 0 iken bağlanması gereken karo sayılmaz (`skip`). `P.hole` yalnız peronlu bölümde var → eski bölümler aynı.
- `hint`: ipucu karosu bir eklenti birimindeyse ve eklentinin `hint(G, now)` kancası varsa ipucunu o verir ve sabitlenecek karoları döndürür (boş peron: bir kaydırma, sabitleme yok).
- `KARMA` 30 → 31.

## Bilinen sınırlar

- Peron hep 3×3; 5×5'ten küçük tahtada kural gelmez (`amount` 0). Hat ve karma bölümleri 6×8/7×9 olduğu için pratikte hep vardır.
- Çözücü paritesiz permütasyon arar (kaydırmayla ulaşılamayan bir dizilim de "çözüm" görünebilir); bu yalnız puanı etkiler, oyuncunun bölümü her zaman çözülebilir.
- Aynı maskeli iki peron karosu birbirinin yerine geçebilir (ikisi de geçerli çözüm).

## Test

`tools/hakem/bos-peron.cjs`: `rule.yard.gen` (320 tohum), `.solver` (yaprak dizilimleri permütasyon, çözüm bulunur, zorluk önce/sonra), `.clash` (900 bölüm), `.line` (M30'dan önce yok, hattın her bölümünde, giriş 4 kaydırma, final 11, merdiven M29 < M30 < M31), `.old` (eklenti çıkarılınca 1–800 ve Günün Hattı aynı), `.card` (9 dil, 320×568), `.tap` (bitişik olmayan/boşluk reddedilir, bitişik kayar, dönmez, 1 hamle, ikinci kaydırma ayrı hamle), `.undo` (geri al, kayıt, ipucu bir kaydırma), `.play`, `.mid` (7×9), `.fog`, `.perf` (4× yavaş CPU: çizim ve üretim), `.errors`.
