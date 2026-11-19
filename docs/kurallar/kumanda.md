# M31 · Kumanda karosu (`remote`)

Hat M31 (`line: 30`, `ord: 30`, `boost: 22`, `scan: 96`), ilk bölüm 801 (19 Kasım). Dosyalar: `www/rules/kumanda.js`, `tools/hakem/kumanda.cjs`, `tools/diller/sozluk-14.txt`. Karma artık M32'den (`KARMA = 31`).

**Kural.** Ortasında düğme (halka + nokta) olan 🎛 **kumanda** karosuna dokununca kumandanın **kendisi dönmez**; kollarla bağlı 2–4 ızgara komşusunun **hepsi birlikte 90° saat yönünde** döner. Kumandanın rayı sabittir: çözüm yönünde durur. Bağlı karolar **kendi başına dönmez** (dokunuş işlemez, ilk seferde "🎛 Bu karo kumandaya bağlı · kumandaya dokun"); yoksa kumanda yalnız bir kısayol olur, kural anlamsızlaşır. Bir karo **iki kumandaya** bağlı olabilir: iki kumandanın basış **toplamı** kadar döner. Kural oyuncuya bilgi vermez, yalnız zorlaştırır: hangi kumandaya kaç kez basacağını ve birini düzeltirken ötekinin bozulduğunu düşünmek gerekir.

- **İşaret (renge bağlı değil):** kumandanın ortasında zemin renginde disk, kalın halka ve nokta (düğme). Her bağlı karoya kenarı aşan kısa bir kol uzanır, bağlı karonun içinde yuvarlak uçla biter. Kol, rayın üstüne binmesin diye merkez çizgisinden karo boyunun %30'u kadar yana kaydırılır. İki kumandaya bağlı karoda iki ayrı yönden iki kol ucu görünür. Hepsi `pal.mut` tonunda, üç yolda (kollar, uçlar, düğme).
- **Hamle:** aynı kumandaya art arda basışlar 1 hamle; başka kumanda (aynı öbekte olsa da) yeni hamle.
- **İpucu:** öbeğin bütün karolarını (kumandalar + kollar) birlikte çözüme oturtup sabitler.

## Tasarım seçimi: çok kumanda modeli

İki model düşünüldü:

1. **Tek kumanda:** her bağlı karo tek kumandaya ait, hepsi aynı basış sayısıyla çözüme gelir. Basit ve adil, ama oyunda tuzak yok: bağlı karolardan biri doğru göründüğü an hepsi doğrudur. Ölçüm de bunu gösterdi: hat ortalaması `boost` ve `scan` ne olursa olsun ≈ 19–22'de kaldı (aşağıda).
2. **Çok kumanda (seçilen):** iki kumanda (aralarında 2 kare: aynı sıra/sütunda ya da çapraz) ortak kola sahip olabilir. Ortak kol `t_A + t_B` (mod 4) kadar döner; birini düzeltirken öteki bozulur. Bir karo en çok iki kumandaya bağlıdır, bir öbek en çok iki kumandadır. Hattın 28 bölümünün 27'sinde en az bir çift öbek vardır (giriş bölümü tek kumanda: kural önce yalın öğrenilir).

**Eşli karodan (M3, `pairs`) farkı:** eşlide iki karo birbirine bağlıdır; hangisine dokunulursa ikisi de döner ve ikisi de görünen, dönen karodur. Kumandada dokunulan karo **dönmez** (rayı çözümde sabit), dönenler ona bağlı 2–4 komşudur ve onlara doğrudan dokunulamaz. Eşlide bir karo tek eşe bağlıdır; kumandada bir karo iki kumandanın toplamıyla döner (mod 4 doğrusal sistem). İki kural aynı tahtada "birlikte dönme"yi karıştırır: `clash: ['pairs', 'quake']` (sarsıntı durağı da komşuları döndürür).

## Üretim (`shape`, `ord: 30`, şekil aşamalarının en sonu)

`R()` yalnız kumandalı bölümde tüketilir → 1–800. bölümler ve Günün Hattı bit bit aynı.

1. **Sıradan karo:** `C.free` (merkez, eşli, başka birim/işaret değil), `keep` (köprü, tünel ağzı), kapalı (`void`), silik (`self`), bölünmüş (`split`) değil, merkeze bitişik değil (karanlık tünelin merkez adımı birimi çeviremez).
2. Adaylar `R()` ile karıştırılır. Kumanda: sıradan, kimsenin kolu değil, başka kumandaya bitişik değil. Kolları: ızgara komşularından sıradan, dört yönü aynı olmayan (`per > 1`) ve alınmamış olanlar. En az 2 kol ve **kendine ait, 4 yönü ayrı en az bir kol** (öbeğin durumu bu koldan okunur).
3. Sırada kumanda payı kaldıysa eş kumanda aranır: 2 kare ötede, ortak kolu ilk kumandanın kollarından; ikisinin de kendine ait 4 yönlü kolu kalmalı.
4. **Karıştırma:** her kumanda `t_j ∈ {1, 2, 3}` basış geride. Kol `a`, bağlı olduğu kumandaların toplamı kadar geri çevrilir: `cur[a] = rot^(−Σ t_j)(sol[a])`. Kumanda `cur = sol`.
5. Her öbek tek birim: `C.unit([kumandalar…, kollar…], 4^m, tap, 'remote')`. Birimin iki ek alanı (çekirdek okur): `U.at(c, i)` dokunulan kumandanın kendi basışı; `U.need(c, sol)` en az hamleli basış: `[dokunuş, hamle, kumanda başına basış]`. `tap`, öbeğin 4^m durumunu sırayla gezen bir sayaçtır (1. kumanda bir basış; kendine ait kolu başa döndüyse 2. kumanda da): zorluk çözücüsü bütün durumları dener.
6. Veri: `out.remote = { st: [kumanda], arm: [[kollar], …], of: n uzunlukta (karonun bağlı olduğu kumanda sayısı: 0, 1, 2), comp: [[kumanda sırası], …] }`.

Miktar: hattın ilk bölümü 1 kumanda, sonra 2 (bir çift), hat finali 3. Yer bulunamazsa daha az (ölçümde her bölümde en az 1).

## Çözülebilirlik kanıtı

Kumanda basışları ızgarada mod 4 doğrusal bir sistemdir: kol `a`'nın dönüşü `Σ_{j ∋ a} p_j (mod 4)`. Üretim çözümden başlar ve kolları yalnız kumanda basışının tersiyle (`t_j` kez geri) karıştırır; demek ki `p_j = t_j` basış vektörü başlangıçtan tam çözüme götürür. Kumandalar çözümde ve sabit olduğu, kollar başka hiçbir kuralın birimi/işareti olmadığı için (hepsi `busy`, öteki kurallar dokunmaz) bu basışlar öteki karolardan bağımsızdır: önce kumandalar basılır (ya da en son: sıra önemsizdir, toplam değişmez), sonra kalan karolar çekirdeğin olağan kanıtıyla çözülür. Basış toplamaya dayalı olduğu için sıra ve ara durumlar kilitlenmez; her kumanda 4 basışta başa döner, yanlış basış her zaman düzeltilebilir.

- **Başlangıç çözülmüş değil:** her kumanda en az 1 basış geride ve kendine ait 4 yönlü kolu ancak kendi basışıyla döner → o kol çözümde başlamaz. (Ortak kol `t_A + t_B ≡ 0` ise çözümde başlar: bu bilinçli tuzaktır, iki kumandaya da basmak gerekir ama ortak kol en sonda yine oturur.)
- **Sayaç tam döngü:** kendine ait kol yalnız kendi kumandasıyla döndüğü için sayaç her kumandanın basış sayısını o kolun başlangıca göre açısından okur; `4^m` dokunuşta `4^m` farklı durum gezip başa döner (robot: 552 öbekte bozuk 0).
- **Par:** çekirdek par'ı birim başına 1 sayardı; çift öbekte iki kumanda iki hamledir. `U.need` en az hamleli basışı (önce basılan kumanda sayısı, eşitse dokunuş) bulur; çekirdek par'a bu hamle sayısını, süre hedefine dokunuş sayısını ekler.

## Ölçümler (19 Kasım)

| Ölçüm (400 tohum, 6×8 · 7×9, uyumlu her eklentiyle; `rule.remote.gen/solve/hard`) | Sonuç |
|---|---|
| Çözüm geçerli, çözülmüş gelmez, yerleşim, par | 400 / 400 |
| Öbek (552; 298 çift): sayaç 4^m durum, en az hamleli basış çözüme götürür | 552 / 552 |
| Hedef resmi **bilen** açgözlü oyuncu (her kumandaya sırayla "kendi kollarından en çoğunu düzelten" basış) | 98 / 552 öbekte kaçırır: 23'ünde fazladan hamle, **75'inde 6 turda hiç çözemez** (salınır) |

**Gerçekten zorlaştırır mı?** Tek kumanda modelinde açgözlü oyuncu her zaman en iyi basışı bulur (bütün kollar aynı sayıda basışla oturur). Çok kumandada aynı oyuncu, hedef resmi bilse bile, çift öbeklerin üçte birinde (98/298) yanılır; çoğunda iki kumanda arasında gidip gelir ve hiç çözemez. Doğru yol iki kumandayı birlikte düşünmektir: önce kendine ait kollar iki kumandanın basışını ayrı ayrı söyler, ortak kol sonra kendiliğinden oturur.

**Zorluk çözücüsü ve merdiven.** Statik çözücü son dizilimi bulmayı ölçer, basış planını saymaz; kumanda kolları birbirine bağladığı için çözücüye **bilgi** verir ve puanı düşürür (aynı 60 tohum, 7×9: kumandasız 14,3 · 1 kumanda 13,2 · 2 kumanda 12,3). Bu yüzden hat ortalamasını seçici taşır ve bir tavanı vardır:

| Ayar (`avg(c)` = hattın 28 bölümünün `diff` ortalaması) | M31 |
|---|---|
| Tek kumanda modeli, `boost: 16` (varsayılan tarama) | 19,2 |
| Tek kumanda, `boost: 45`, `scan: 64` | 21,7 |
| Çok kumanda, `boost: 16` | 20,2 |
| Çok kumanda, `boost: 30`, `scan: 64` | 24,5 |
| Çok kumanda, `boost: 16`, `scan: 96` | 24,8 |
| Çok kumanda, `boost: 22 / 30 / 40`, `scan: 96` (**seçilen: 22**) | **27,0** (tavan) |

Merdiven: M30 dönüşen 26,6 < **M31 kumanda 27,0**; karma M32+ 22,4. **Seçici tavanı:** `scan: 96` ile `boost ≥ 22` hedefi bütün adayların üstüne çıkarır, seçici en zor adayı alır; daha fazla boost etki etmez. Tavanı yükseltmenin tek yolu taramayı büyütmek: bölüm üretimi masaüstünde ~46–53 ms (M30: ~32–38 ms); kazanma ekranı açıkken önceden hazırlandığı için oyuncu beklemez.

## Oyun ve çizim

- `block`: bağlı karoya dokunuşu reddeder (bildirim ilk seferde).
- Çekirdek dokunuşta `U.at(G.cur, i)` ile yalnız dokunulan kumandanın kollarını çevirir; hamle anahtarı kumanda başınadır.
- `onTap`: o kumandanın kolları çekirdeğin dönüş animasyonuyla (190 ms, saat yönü) gelir, yumuşak üçgen dalga sesi, oyuncu başına ilk basışta bir kez "🎛 Kumanda · bağlı karoların hepsi birlikte 90° döndü". Hareket azaltılmışsa animasyon yok.
- `reveal`: karanlık tünelde öbeğin bir karosu görününce bütün öbek görünür (kumandaya her zaman erişilir).
- `plan`: robot her öbek için `U.need`'in basışlarını kumanda başına art arda dokunur.
- `over`: kollar, uçlar, düğme; ipucuyla sabitlenen öbek ve karanlıkta görünmeyen karo çizilmez. Geri al (↶) ve kayıt ek durum gerektirmez: bütün durum karo maskelerindedir.

## Çekirdek değişiklikleri (en küçük hâl)

`www/game.js`:
- `KARMA = 31` (yorum: M32+ karma, son kural M31 kumanda) ve `boost += 3.5` satırının yorumu (M32+).
- `generate` par satırı: birim `U.need` taşıyorsa par'a `U.need(...)[1]` (basılan kumanda sayısı) eklenir, yoksa eskisi gibi 1.
- `unitTaps`: `U.need` varsa dokunuş sayısını ondan okur.
- Dokunuş: birim `U.at` taşıyorsa `U.at(G.cur, i)` (yoksa `U.tap(G.cur)`); hamle ve geri al anahtarı `'u' + u + '.' + i` (yoksa eskisi gibi `'u' + u`).

Bu alanları taşımayan bütün eski birimler (makas, tabla, kayan sıra/sütun, dönüşen, kapak, silik…) birebir eski yoldan geçer. Ayrıca `www/index.html` script satırı, `www/sw.js` önbellek listesi ve sürüm `ray-v40`.

**Bilinen sınırlar.** Kol ızgara komşusudur; sarmal tahtada kenarın öbür yüzüne ve tünel ağzından geçmez. Öbek en çok 2 kumanda (K = 16); üçlü zincir sayacı 64 duruma çıkarırdı. Çözücü puanı basış planını ölçmediği için zorluk merdiveni taramayla (seçici tavanı) taşınır.

**Test.** `tools/hakem/kumanda.cjs`: `rule.remote.gen` (400 tohum), `.solve` (sayaç, en az hamleli basış), `.hard` (açgözlü oyuncu, merdiven M30 < M31, çözücü karşılaştırması), `.clash`, `.line` (801'den, giriş 1, final 3, ilk 3 bölüm 6×8, karma), `.old` (eklenti çıkarılınca 1–800 ve Günün Hattı aynı), `.card` (9 dil, 320×568), `.tap` (bağlı komşular 90°, kumanda dönmez, art arda = 1 hamle, bağlı karoya dokunuş işlemez, geri al), `.play` (giriş bölümü), `.pair` (ortak kol iki kumandayla, 2 hamle), `.pairplay`, `.hint` (öbek birlikte sabitlenir), `.mid` (7×9), `.fog`, `.perf` (4× yavaş CPU), `.errors`.
