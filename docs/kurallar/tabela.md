# M17 · Yön tabelası (anahtar: `sign`)

> **Hat düzeni 31 Ekim'de değişti:** bu kural artık **M17** (ilk bölüm 409). Aşağıdaki hat ve bölüm numaraları ve ölçümler eski düzene aittir; güncel tablo `docs/kurallar/README.md`.

> Bu belge tasarım iş akışının çıktısıdır: üç bağımsız tasarımcı, bir seçici ve şüpheci bir doğrulayıcı. Uygulama notlarındaki satır numaraları ve "şu fonksiyonu değiştir" önerileri eklenti iskeletinden ÖNCE yazıldı. Ortak altyapı (birim/val, komşuluk adj, bölünmüş düğüm, tree(), kayıt imzası, kural kartı göçü, çakışma) artık çekirdekte hazır; kural yalnız kendi dosyasında, kancalarla yazılır: docs/kurallar/README.md.

## Uygulama (eklenti, güncel durum)

Kural yazıldı ve robottan geçti. Kod: `www/rules/tabela.js`, testler: `tools/hakem/tabela.cjs`. Çekirdekte değişiklik yok. Aşağıdaki tasarım bölümleri tarihçe olarak duruyor; uygulamayla çelişen yerde bu bölüm geçerlidir.

### Kancalar

| Kanca | Ne yapar |
|---|---|
| `amount(n, intro)` | `max(2, round(n · (intro ? .03 : .05)))`. 409–411: 6×8, 2 tabela. 7×9: 3 tabela |
| `mark(C)` | `api.tree(C)` ile sol ağacı (pd, dep, ow). Aday: `C.free(i) && !rev && cnt < 0 && popc ∈ {2, 3} && düz değil && dep ≥ 2 && köprü (C.br) ya da komşusu değil`. Önce şaşırtıcılar (`pd` yönü · (kendi merkezi − i) ≤ 0), sonra ötekiler. Her grupta tabelalı karoya bitişik olmayan aday öne alınır. `C.out.sign[i] = pd[i]` |
| `check(P, L)` | Her tabela için `j = nb(P, i, k)`: `d[i] ≥ 0 && cur[i] & b && cur[j] & ob(P, i, k) && d[j] = d[i] − 1 && own[j] = own[i]`. Bozuklar `L.signBad`'e yazılır. `L.signBase` = tabelalar dışında her şey tamam mı (çekirdeğin `solved` değeri) |
| `allow(P, i, m)` | Tabelalı karoda ok kenarında kolu olmayan durum elenir |
| `after(G, i, now)` | `signBase && signBad` ise yanlış tabelalar `press` ile nabız atar. Bölüm başına bir kez bildirim çıkar: "Tabela: merkeze giden yol okun kenarından geçmeli". Sayacı biten yanlış karo varsa sonuna " · ↺ baştan ya da 💡" eklenir. Oyuncu tabelalı karoya ilk kez dokununca (kayıtta bir kez, `save.signTip`) "Tabela · karo döner, ok yerinde kalır" bildirimi çıkar |
| `over(D)` | Ok, hücreye sabit üçgendir; `X[i]`'nin açısı kullanılmaz. Tepesi `.43s`, tabanı `.20s`, yarı genişliği `.15s` (s = 54'te ~12×16 px). Sağlanmış ve yanıyorsa hat rengi dolgu ve beyaz 1,5 px kenar. Öteki durumlarda `pal.bg` dolgu ve `pal.fg` 2 px kontur (içi boş). İpucuyla sabitlenmiş doğru ok `.45` soluk, yanlışsa tam opak. `!vis(i)` iken çizilmez. 2–4 yol |
| `clash: ['ring']` | Halka dosyası da tanımlar; simetrik, zararsız tekrar |
| `card` / `css` | `.rd-sign*` demo: merkez ve karo. Köşe ray döner, ok solda sabit. Batı kolu varken (%50–90) ray yanar, ok dolar |

### Tasarımdan sapmalar

- **Kayıt imzası:** Çekirdek zaten `sig = hashStr(sol)` kullanıyor (pv 4 + sig). Tabela aynı tohumdan belirlenimli üretildiği için ayrı imza gerekmedi.
- **`lit()` dönüşü:** `base` alanı yerine eklenti `L.signBase` ve `L.signBad` alanlarını yazar.
- **Ok boyu:** Doğrulayıcı tepe `.44s` önermişti. `.43s` seçildi; `.44s`'de 2 px kontur karo kenarından taşıyor.
- **Ek: yayılma.** Tabelalar birbirine bitişik gelmesin diye her grupta yalnız bitişik olmayan adaylar kalmazsa bitişik aday seçilir. Şaşırtıcı önceliği korunur.
- **Ek: ilk dokunuş bildirimi** (`save.signTip`). Doğrulayıcı planının 7. maddesinde vardı.
- **Atlanan:** İpucu sıralamasında yanlış tabelanın sol yolundaki karoları öne alma. Bu çekirdek değişikliği ister ve isteğe bağlıydı. İpucu `sol`'e oturttuğu için tabela yüzünden çıkmaza girmez.

### Ölçümler (robot, `tools/hakem/tabela.cjs`)

- **Üretim:** 600 bölüm (6×8 ve 7×9). Karışımlar: yalın, ters, sayaçlı, iki merkez, karanlık, hepsi bir arada (+ sabit, eşli).
  - Çözüm her bölümde kabul ediliyor. Hiçbir bölüm çözülmüş gelmiyor.
  - Her bölümde ≥ 2 tabela var: toplam 1500; 1088 köşe, 412 T, 0 düz.
  - Yerleşim ihlali 0.
- **Ters örnek:** 4500 ok yönü değişikliğinin (çocuğa giden kol ya da kolsuz kenar) hepsi çözümü reddediyor.
- **İki merkez:**
  - 500 tabelanın hepsi kendi merkezinin ağacında ebeveyne bakıyor.
  - Komşunun sahibi öbür merkez yapılınca hepsi reddediliyor.
- **Bit bit aynılık:** 1–408 bölümleri ve 14 Günün Hattı, eklentili ve eklentisiz (route ile `rules/tabela.js` boşaltılarak) aynı: 422 bulmaca, 0 fark. `R()` yalnız `x.sign > 0` iken `mark` içinde tüketilir; sonraki adımlar (karanlık, çözülmüş gelmesin, par) `R()` kullanmaz.
- **Zorluk merdiveni:** M12 14,70 → M13 15,11 → M14 15,39 (hat ortalaması, bütün bölümler). Merdiven korunuyor.
- **Şaşırtıcı oran:** 409–468 arasında yerleşen 177 tabelanın 160'ı şaşırtıcı (115 köşe, 62 T). Burada "yana çıkış" (nokta çarpımı 0) da şaşırtıcı sayılıyor.
- **Süre:** `puzzleFor(409–418)` bölüm başına 14–18 ms; robot başka işlerle yüklüyken 41 ms. Sınır 60 ms.
- **Oyun içi:**
  - 409'da kural kartı açılıyor. Tabelalı karo dönünce ok yerinde kalıyor; `solve()` kazanıyor.
  - Bir ok çocuğa çevrilip her şey bağlanınca bölüm bitmiyor: bildirim çıkıyor, yanlış tabela `signBad`'de. Ok düzelince bölüm bitiyor.
- **Ekran görüntüleri** (`hakem-out/shots/`):
  - `sign-card`, `sign-card-2`: kartın dolu ve boş evresi
  - `sign-start`, `sign-start-light`: başlangıç, içi boş oklar
  - `sign-ok`, `sign-ok-light`: sağlanmış, dolu oklar
  - `sign-bad`: hepsi bağlı ama ok yanlış

### Bilinen sınırlar

- **Küresel kısmın etkisi:** Doğrulayıcı ölçümüne göre bölümlerin ~%2'sinde bağlayıcı. Geri kalanında tabela yerel ipucu gibi çalışır (o kenarda kol var), artı insanın kullanabileceği bir yön bilgisi verir.
- **T karoda yerel bilgi az:** Ok, dört durumdan yalnız birini eler. Köşede ikisini eler.
- **İpucu sonrası bildirim yok:** İpucu sonrasında "hepsi bağlı ama tabela yanlış" durumu oluşursa bildirim çıkmaz; `after` yalnız dokunuşta çağrılır. Ok yine de içi boş görünür.
- **Küçük ızgara:** ≤ 4×4'te aday yetmeyebilir. Oyunda M13 en küçük 6×8 olduğu için görülmez.
- **Web paketi bütçesi:** Robotun `size` denetimi (`bytes < 300e3`, düşük önem) tabelayla geçmiyor.
  - İskelette paket 297.229 bayt; altı kurala kalan pay yalnız 2.771 bayt.
  - `rules/tabela.js` 6,7 KB (CSS demosu dahil). Paket 303.724 bayt oluyor.
  - Çözüm çekirdekte olmalı: `og.jpg` (48 KB; uygulama yüklemez, yalnız paylaşım önizlemesi) bütçe dışı bırakılabilir ya da sınır yükseltilebilir.
  - `tools/hakem.cjs` bu işin kapsamı dışında olduğu için değiştirilmedi.
- **Kayıt imzası:** Tabela seçim algoritması ileride değişirse aynı `sol` farklı tabela taşıyabilir. Çekirdek imzası yalnız `sol`'ü kapsar. Algoritma değişirse imzaya `sign` eklenmeli.

**Neden seçildi:** Hedef türünden ve ucuz bir kural. Oyuncuya yeni bir soru sorduruyor: 'merkeze giden yol bu karodan hangi yönde çıkıyor'. Gizli dolanmayı söylediği için sabit karonun kopyası değil; şaşırtıcı aday oranını ben ölçtüm (%18,3). Getirdiği tree() yardımcısını M17 halka yeniden kullanır. Köprüden (topoloji) sonra ve tabladan (etkileşim) önce geldiği için tür sırası I–Geo–G–I–G–Geo olur. Seçimde değişiklik yaptım: köprü komşusu dışlandı, tünel için adj okuması eklendi, sabitlenen karoda ok soluk çiziliyor, CLASH simetrik.

## Kural kartı metni

<b>Tabelalı</b> karodan merkeze giden yol <b>okun gösterdiği kenardan</b> çıkmalı. Ok yere sabittir: <b>karo döner, ok dönmez</b>.

## Görünüş

Karonun içinde, bir kenara bakan küçük üçgen ok, ray hattının üstünde ve kenara yakın (.26s–.40s). Ok hücreye sabittir, karo dönerken dönmez. Kural sağlanıp hat yanınca dolu (hat rengi + beyaz kenar), sağlanmazsa içi boş kontur. Ayrım dolu/boş biçimle yapılır.

## Mekanik

Bazı 2–3 kollu karoların hücresinde sabit bir ok bulunur. Kazanmak için bitmiş hatta bu karodan merkeze giden tek yol okun kenarından geçmelidir. Bunun iki parçası var:
(a) Yerel: o kenarda kol olmalı.
(b) Küresel: o kol merkeze (ebeveyne) gider, öteki kollar merkezden uzaklaşıp duraklarda biter.
Tabela önce 'şaşırtıcı' karolara konur: merkeze giden yolun merkezin coğrafi yönüne değil, yana ya da geriye çıktığı karolar. Ölçümümde 2–3 kollu ve derinliği ≥2 olan karoların %18,3'ü böyle. Ok tam bu gizli dolanmayı söyler; bu yüzden sabit karonun kopyası değildir. Karo serbestçe döner, ok yalnız yönü bildirir.
Durağa (tek kol) konmaz, çünkü orada ok sabit karoyla aynı şey olurdu. Dört yönlü kavşağa da konmaz, çünkü orada yerel bilgi sıfırdır.

## Üretim ve çözülebilirlik kanıtı

generate() sonunda, cnt'den sonra ve fog'dan önce, yalnız x.sign>0 iken (R() başka durumda tüketilmez).
ORTAK tree(sol) yardımcısı (M17 halka da kullanır): merkez(ler)den çok kaynaklı BFS ile pa (ebeveyn), pd (ebeveyne giden kol biti) ve dep (derinlik) hesaplanır, ~8 satır.
bare(i) = free(i) && !rev[i] && cnt[i]<0. free() makas ve tablayı da dışladığından tabela onlara düşmez.
Aday koşulları: bare && 2≤popc(sol)≤3 && dep≥2 && köprü komşusu değil. Önce 'şaşırtıcı' adaylar seçilir: pd yön vektörü · (kendi merkezi − i) ≤ 0. Yetmezse öteki adaylardan tamamlanır.
Sayı: x.sign = max(2, round(n·(intro ? .03 : .05))), yani 6×8 girişte 2, 7×9'da 3. sign[i] = pd[i], dönüş nesnesine eklenir.
KANIT: Karıştırma işlemleri değişmedi (rot, unrot döngüsü, eşli t, sayaç ≤3, makas involüsyonu, tabla R⁴), dolayısıyla cur→sol oyuncu dokunuşlarıyla erişilebilir. sign[i], sol ağacındaki ebeveyn yönüdür: i'nin o kenarda kolu vardır, komşu j için d[j] = d[i]−1 ve own aynıdır. Ağaçta BFS tam bu yolu bulduğu için lit(sol) yeni denetimi de geçer. Yeni bir karıştırma işlemi eklenmedi, yalnız sol'un zaten sağladığı bir kısıt eklendi.
DOĞRULAMA: tasarımcı 600 bulmacada 0 hata bildirdi; şaşırtıcı aday oranını ben ölçtüm (13.773 adayda %18,3).

## Kazanma koşulu

lit()'e yalnız P.sign varken eklenir. sign[i] = b olan her i için komşu j = P.adj ? adj[i·4+k] : geometrik komşu, o = varış biti. ok = d[i]≥0 && (cur[i]&b) && j≥0 && (cur[j]&o) && d[j]===d[i]−1 && own[j]===own[i].
Bozuk olanlar signBad sayısını artırır ve dönüşte signBad[] dizisi olarak çizime verilir. solved = eski koşul && !signBad.
Ağaçta ebeveyn tektir. Oyun sırasında döngü varsa d−1'deki herhangi bir komşu kabul edilir; anlık geri bildirim titremez.

## Dokunma

Değişmez: tek dokunuş = 90°, ters karoda tersine. Ok hücreye aittir, karoyla dönmez.
Yalnız bilgi eklenir: hepsi bağlı, açık uç yok ama bölüm bitmiyorsa ve neden tabelaysa bir kez toast çıkar: 'Tabela: merkeze giden yol okun yönünden geçmeli' (G.signTold). Yanlış tabelalar press.set ile nabız atar.

## Çizim

6d'nin yanında tek blok, yalnız G.sign varken. X[i]'nin x, y ve sc değerleri kullanılır ama açı (a) KULLANILMAZ; ok dönüş animasyonunda yerinde durur.
Üçgenin tepesi merkez + yön·.40s'de, tabanı merkez + yön·.26s ± dik·.10s'de.
İki yol:
(1) Yanmış ve doğru: OC[own] dolgu + '#fff' 1,5 px kenar. Rayın üstünde 'yön oku' gibi okunur.
(2) Diğerleri: pal.bg dolgu + pal.fg 2 px kenar (içi boş).
Toplam ~3 çağrı. vis(i) karanlıkta gizler; ipucuyla sabitlenen karoda ok soluk çizilir (globalAlpha .45). Ok kenar ortasına yakındır, rozetler köşelerdedir; çakışma olmaz.

## Zorluk çözücüsü ve robot

Robot solve() değişmez: karoları sol'e getirir, sol de tabelaları sağlar.
difficulty(): C0 satırına (313) tek satırlık yerel süzgeç eklenir: if (U.some(i => sign[i] && !(val(i,r) & sign[i]))) continue. Küresel kısmı DFS yaprağındaki lit().solved denetler, çünkü P yayılımı sign'ı taşır.
Tasarımcı ölçümü: puan −0,65 (6×8) ve −0,74 (7×9). pick() daha zor taban seçerek telafi eder.
hakem testleri:
- 600 üretimde lit(sol) çözülü ve cur çözülü olmamalı.
- Bir okun yönü değiştirilince sol reddedilmeli.
- Kart, dokunuş ve kazanma senaryosu çalışmalı.

## İpucu, baştan, kayıt

İpucu: mekanizma değişmez. Yanlış karo sol yönüne oturtulur ve sabitlenir; sol tabelaları sağladığı için ipucu çıkmaza sokmaz. İsteğe bağlı: generate P.solPa'yı saklar ve hint() sıralamasında signBad tabelanın sol yolundaki yanlış karolar öne alınır.
↺ baştan: tabela statiktir (önbellek), ek durum yok.
Kayıt: yeni alan yok, ortak sig kuralı yeterli.

## Öteki kurallarla karışım

Sabit, eşli, ters, sayaçlı, makas ve tabla karosuna konmaz (bare); aynı bölümde birlikte sorunsuzdur.
Karanlık: ok aydınlanınca görünür, keşif hissi verir.
İki merkez: ok kendi merkezine bakar (own[j]===own[i]); BFS çok kaynaklıdır.
Köprü: köprü komşusuna konmaz.
Tünel ağzı: ebeveyn tünelin öbür ucundaysa ok tünel ağzının kenarına bakar; lit adj'den okur, uyumludur.
Halka ile ÇAKIŞIR, çünkü döngüde 'merkeze giden tek yol' yoktur. CLASH = {ring: ['sign', 'bridge']} rulesFor'da simetrik uygulanır: çakışan ek kural, sıradaki uyumlu öğrenilmiş kuralla değiştirilir.

## Kural kartı demosu

.rdemo8: solda küçük merkez karesi (var(--acc)), yanında 76 px .pt karo. T rayı spin4 ile döner. Karonun sol kenarında, dönmeyen dış kutuda (::after, border üçgeni) sabit bir ok durur.
4 saniyelik döngüde kol sola, yani merkeze geldiği karede (keyframe %75–90) ray var(--acc) rengine döner ve ok dolar; öteki karelerde okun içi boştur. Altında 1 cümle: 'Ok, merkeze giden yolun çıkış kenarı.'

## Zorluğa etkisi

Yerel kısım ipucu gibi çalışır (ölçülen −0,7) ve pick() daha zor taban seçerek bunu dengeler. Küresel kısım ('yol burada dolanıyor') insan için aha anları ekler. Hamle hedefi (par) değişmez.

## Riskler

(1) Sabit karoyla akrabadır (kısmi bilgi). Şaşırtıcı yönde öncelik kopya hissini azaltır; aday yetmezse düz adaya düşülür.
(2) Küresel kısıt 'hepsi bağlı ama neden bitmedi' hissi yaratabilir. Dolu/boş ok, toast ve nabız bunu açıklar.
(3) s≈50 px'te üçgen ~10 px; gerekirse .12s'ye büyütülür.
(4) Ok ile ray ucu karışabilir; kontur ve beyaz kenar şart.

## Doğrulayıcının kararı

Çözülebilir: evet · Uygulanabilir: evet · Tutulsun: evet

**Karşı örnek / risk:** Çözülemezlik karşı örneği bulamadım. Bulduğum bozulma senaryoları ise gerçek; aşağıda sırayla.

KANIT (öneridekinden daha sıkı): Karıştırma işlemleri değişmiyor, yani cur→sol hâlâ oyuncu dokunuşlarıyla erişilebilir. sign[i] = pd[i], sol ağacındaki ebeveyn yönü olduğu için sol tabelaları sağlar. Ayrıca kazanma anında denetim kesindir:
- Dönüş kol sayısını korur, dolayısıyla Σpopc(cur) = Σpopc(sol) = 2(n−h). Burada h merkez sayısıdır.
- solved durumunda loose=0 ve her karo ulaşılmış olduğundan kenar sayısı n−h olur.
- Tek merkezde n düğümlü bağlı ve n−1 kenarlı çizge bir ağaçtır. İki merkezde merged=false iken 2 bileşen ve n−2 kenar vardır, yani orman.
- Sonuç: kazanma anında döngü yoktur, BFS ebeveyni tektir ve "d[j]=d[i]−1 ∧ kol eşleşmesi" tam olarak ağaç ebeveynini tanımlar. Döngü belirsizliği yalnız oyun sırasındaki anlık geri bildirimde vardır.

DENEY (game.js mantığı scratch modüle kopyalandı, kod değişmedi):
- 3.360 üretim: 7 boy (3×3 → 7×9) × 8 kural karışımı (sabit, eşli, ters, sayaçlı, iki merkez, karanlık, hepsi bir arada).
  - lit(sol) + tabela denetiminde 0 hata.
  - Başta çözülmüş gelen bölüm 0.
- 6×8 ve 7×9, 480 bulmaca, tam çözüm sayımı:
  - %6,9'unun birden çok çözümü var.
  - 34 alternatif çözümün 9'unu tabela reddediyor. Bu, bulmacaların %1,9'u demek.
  - Yani küresel kısım yalnız ~%2 bölümde bağlayıcı. Geri kalanında tabela pratikte yerel bir ipucu (o kenarda kol var), artı insanın kullanabileceği bir yön bilgisi.

BOZULMA SENARYOLARI:
1) Sabit karonun kopyası: Yerleşen tabelaların %42,9'u düz karoya düşüyor. Düz karoda tek kol bilgisi yönü tamamen belirler; bu karo fiilen 'sabit karo, ama dönebilen bir tuzak' olur. Kopya yasağını ihlal ediyor.
2) Küçük ızgara: 3×3'te üretimlerin %26'sında hiç tabela çıkmıyor (127/480). 4×4'te 2/480. Oyunda M13 6×8 ve 7×9 olduğu için oynanışta görülmez, ama küçük ızgaralı robot testleri ve gelecekte daha küçük bir giriş boyu bu durumu yakalar.
3) Yarım oyun kaydı: Öneri 'ortak sig kuralı yeterli' diyor, ama game.js'de böyle bir kural yok (yalnız pv:4 ve uzunluk denetimi var). Bugün 412. bölümde yarım kalmış bir 7×9 oyun düşünün. Güncellemeden sonra rulesFor ve pick farklı bir aday seçer. Boy aynı olduğu için kayıt kabul edilir ve eski cur yeni ağaca yüklenir. Kol sayıları sol ile uyuşmaz ve bölüm ↺ yapılana dek çözülemez. Aynı risk M9/M11 eklemelerinde 209+ bölümler için de geçerli.
4) Sayaçlı karo ile aynı bölümde (M14+ karma): Oyuncu tabelayı ihlal eden alternatif bir çözüme sayaçları harcayarak ulaşabilir. Bugün bu durum kazanırdı; artık kazanmaz ve 0'lanmış sayaçlar yüzünden ↺ ya da 💡 gerekir. Çıkmaz değil, çünkü hint() sayacı umursamadan sol'e oturtur. Ama toast bunu söylemeli.
5) Demo yanlış:
   - .pt rayı T değil, K+D köşedir.
   - spin4'te Batı kolu 50–65 ve 75–90 aralıklarında, yani iki pencerede var. T olsaydı dört karenin üçünde olurdu.
   - 'Yalnız %75–90'da dolar' ifadesi kuralı yanlış öğretir.
6) Okunurluk: s≈50 px'te önerilen üçgen ~7×10 px. Ray zaten 8,5 px kalınlığında; boş üçgenin iç boşluğu ~3 px kalır ve dolu/boş ayrımı zayıflar.
7) Ölçümler önerideki rakamlardan farklı:
   - Şaşırtıcı aday oranı: düz karolar dahil %10,6, düz karolar hariç %5,5 (bulmaca başına ~1). Önerideki değer %18,3.
   - Zorluk etkisi: −0,92 (düzsüz −0,87). Önerideki değer −0,65/−0,74.
   - Buna rağmen pick() telafi ediyor. Hat ortalamaları: M12 14,70 → M13 15,10 (düzsüz 15,16) → M14 15,35. Merdiven bozulmuyor.
8) Var olmayan kurallara bağımlılık: Öneri makas, tabla, köprü, tünel ağzı (P.adj) ve halka kurallarına dayanıyor; bunlar kodda yok. bare() ve CLASH bu kurallar yokken de doğru çalışmalı. Halka, kenar sayısı argümanını bozar (bilerek konan döngü); CLASH zorunlu.

### Zorunlu düzeltmeler

- Düz karoları aday dışı bırak: per(sol[i])===2 ise tabela konmaz (ölçüm: aday yetersizliği 0/1600; yerleşenlerin 2853'ü köşe, 1147'si T). Aksi hâlde tabelaların %43'ü sabit karonun kopyası olur.
- Yarım oyun kaydına imza ekle: puzzleFor P.sig = hashStr(sol.join('') + '|' + (sign ? sign.join('') : '')) üretir, saveRun run.sig yazar, start() run.sig === G.sig değilse kaydı atar. Geçiş için pv 4→5. game.js'de 'ortak sig kuralı' yok; bu olmadan 209+ bölümlerde boyu aynı kalan eski kayıt farklı bir ağaca yüklenir ve bölüm ↺ yapılana dek çözülemez.
- lit() dönüşüne base (eski solved) ve signBad eklensin; solved = base && !signBad.length. Denetim yalnız P.sign varken çalışsın (günlük ve eski bölümlerde maliyet sıfır).
- pointerdown: base && !solved && signBad.length olunca bir kez toast ('Tabela: merkeze giden yol okun kenarından geçmeli') ve yanlış tabelalara press nabzı. Kilitli (cnt=0) ve sol dışı karo varsa toast sonuna ' · ↺ baştan ya da 💡' eklensin.
- Ok büyütülsün: tepe .44s, taban .22s, yarı genişlik .14s (s=50'de ~11×14 px). Boş hâli pal.bg dolgu + pal.fg 2 px kontur; dolu hâli OC[own] dolgu + #fff 1,5 px kenar. Çizim 6d'den sonra, 6c karanlık örtüsünden önce olmalı.
- İpucuyla sabitlenen karoda ok yalnız signBad'de değilse soluk (.45) çizilsin; yanlışsa tam opak boş çizilsin ki hata gizlenmesin.
- Demo düzeltmesi: .pt köşe rayıyla (K+D) Batı kolu spin4'ün %50–92 aralığında var; ok dolumu ve ray rengi bu aralıkta açılsın. Tek pencere (%75–90) kuralı yanlış öğretir.
- bare() açıkça tanımlansın: !isHub && !pinned && link<0 && !rev && cnt<0 && popc∈{2,3} && !düz && dep≥2. Gelecekte gelecek makas/tabla/köprü dizileri için ortak bir special[i] bayrağı dışlansın. CLASH ancak halka kuralı gerçekten eklenince devreye girsin; rulesFor değişimi hash ile belirlenimli kalsın.
- Tabela sayısı alttan güvenceli olsun: x.sign>0 ama aday <1 ise (yalnız ≤4×4'te görülür) robot testi bunu yakalasın. Giriş boyu 6×8'in altına inmesin.
- hakem: difficulty.ladder döngüsü c<9'dan c<14'e (örneklemeli) genişletilsin; M13 ortalaması M12'den büyük olmalı. puzzleFor(409–418) ortalaması 60 ms'nin altında kalmalı.

### Doğrulayıcının uygulama planı

ÖN BİLGİ: Doğrulama scratch kodu /tmp/claude-0/-home-user-mobil-oyun/bb21aa69-f6d1-52e7-9b31-ec2477378b24/scratchpad/sign/ altında:
- core.cjs: game.js'den çıkarılan saf mantık.
- sign.cjs: addSigns, litS, difficultyS, tam çözüm sayıcı enumerate.
- bind.cjs, ladder.cjs, ns.cjs: ölçümler.
Robot testlerine kaynak olarak kullanılabilir.

1) Sabitler ve kayıt defteri
- RULE_LINE = { pins:2, pairs:3, rev:4, fog:5, cnt:6, two:7, sign:12 } (M9 ve M11 kuralları 8 ve 10'a gelir).
- RULES[12] = {
    name: 'Yön tabelası',
    tag: 'Yeni: yön tabelası',
    demo: '<div class="rdemo8" aria-hidden="true"><i class="hb"></i><i class="pt sg"><b></b></i></div>',
    text: '<b>Oklu</b> karodan merkeze giden yol <b>okun gösterdiği kenardan</b> çıkmalı. Ok yere sabittir: <b>karo döner, ok dönmez</b>.'
  }
- sizeFor ve ruleCard değişmez: RULES[12] olduğu için 409–411 otomatik 6×8 olur, kart ilk girişte çıkar.
- İsteğe bağlı CLASH = { ring: ['sign'] }, yalnız halka eklenince. rulesFor'da set kurulduktan sonra çakışan ek kural, learned listesinde hash sırasıyla bir sonraki uyumlu kuralla değiştirilir.

2) Ortak yardımcı
function tree(sol, cols, rows, hub, hub2) {
  pa = Array(n).fill(-1); pd = Array(n).fill(0); dep = Array(n).fill(-1); root = Array(n).fill(-1)
  q = [hub]; dep[hub] = 0; root[hub] = hub
  if (hub2 >= 0) { q.push(hub2); dep[hub2] = 0; root[hub2] = hub2 }
  while (q.length) {
    i = q.shift()
    for (const [b, dx, dy, o] of DIRS) {
      j = komşu(i, dx, dy)
      if (j < 0 || !(sol[i] & b) || !(sol[j] & o) || dep[j] >= 0) continue
      dep[j] = dep[i] + 1; pa[j] = i; pd[j] = o; root[j] = root[i]; q.push(j)
    }
  }
  return { pa, pd, dep, root }
}
(pd[j] = o, yani j'den ebeveynine bakan bit.)

3) generate(cols, rows, seed, pins, pairs, x)
Yer: cnt bloğundan sonra, fog bloğundan önce. R() yalnız x.sign>0 iken tüketilir, dolayısıyla eski bölümler aynen kalır. Fog ve 'çözülmüş gelmesin' adımları R() kullanmadığı için cur da değişmez.
let sign = null, solPa = null;
if (x.sign) {
  const { pa, pd, dep, root } = tree(sol, cols, rows, hub, hub2);
  solPa = pa; sign = new Array(n).fill(0);
  const bare = i => free(i) && !rev[i] && cnt[i] < 0;   // + ileride special[i]
  const A = [], B = [];   // A: şaşırtıcı, B: düz aday
  for (let i = 0; i < n; i++) {
    const p = popc(sol[i]);
    if (!bare(i) || p < 2 || p > 3 || per(sol[i]) === 2 || dep[i] < 2) continue;
    const [vx, vy] = VEC[pd[i]], h = root[i];
    const dot = vx * (h % cols - i % cols) + vy * ((h / cols | 0) - (i / cols | 0));
    (dot <= 0 ? A : B).push(i);
  }
  for (let k = 0; k < x.sign && (A.length || B.length); k++) {
    const L = A.length ? A : B, i = L.splice(R() * L.length | 0, 1)[0];
    sign[i] = pd[i];
  }
}
Dönüş nesnesine sign ve solPa eklenir. cached() bunları kopyalamaz (statik).

4) puzzleFor(l)
- x.sign = U.has('sign') ? Math.max(2, Math.round(n * (intro ? .03 : .05))) : 0
- P.sig = hashStr(P.sol.join('') + '|' + (P.sign ? P.sign.join('') : '') + '|' + P.pinned.map(Number).join(''))
- dailyFor da P.sig üretir.

5) lit(P)
Mevcut BFS aynı kalır. Sonuna:
const base = loose === 0 && !merged && d.every(v => v >= 0);
let signBad = [];
if (P.sign) for (let i = 0; i < n; i++) {
  const b = P.sign[i]; if (!b) continue;
  const k = BIT[b];   // BIT = {1:0, 2:1, 4:2, 8:3}
  const [, dx, dy, o] = DIRS[k];
  const j = P.adj ? P.adj[i * 4 + k] : komşu(i, dx, dy);
  const ok = d[i] >= 0 && (cur[i] & b) && j >= 0 && (cur[j] & o) && d[j] === d[i] - 1 && own[j] === own[i];
  if (!ok) signBad.push(i);
}
return { d, own, merged, n: ..., base, signBad, solved: base && !signBad.length };
Kanıt notu kod yorumuna: kazanma anında çizge ormandır (kenar = n − h), d−1 komşusu ağaç ebeveynidir.

6) difficulty(P)
C0 satırında, r döngüsünün başına:
if (P.sign && U.some(i => P.sign[i] && !(rn(cur[i], r) & P.sign[i]))) continue;
DFS yaprağındaki lit({...P, cur}) zaten P.sign'ı taşır; küresel kısım orada denetlenir. Başka değişiklik yok.

7) pointerdown işleyicisi
Yeni girdi yok; tabela karosu normal döner (rev ve cnt zaten aday dışı). İlk dokunuşta bir kez: if (G.sign?.[i] && !save.signTold) { save.signTold = 1; persist(); toast('Yön tabelası · karo döner, ok dönmez') }.
G.L = lit(G); reveal(); satırından sonra:
if (G.sign && G.L.base && !G.L.solved) {
  G.L.signBad.forEach(k => press.set(k, now));
  if (!G.signTold) {
    G.signTold = true;
    const stuck = G.cnt.some((c, k) => c === 0 && G.cur[k] !== G.sol[k]);
    toast('Tabela: merkeze giden yol okun kenarından geçmeli' + (stuck ? ' · ↺ baştan ya da 💡' : ''));
  }
  haptic('heavy');
}

8) draw()
Yer: 6d'den sonra, 6c (karanlık) öncesi. Çizim yalnız if (G.sign) iken. X[i]'den x, y, sc alınır; açı (a) kullanılmaz.
const V = {1:[0,-1], 2:[1,0], 4:[0,1], 8:[-1,0]}, bad = new Set(G.L.signBad);
const tri = i => {
  const [x, y, , sc] = X[i], [vx, vy] = V[G.sign[i]], k = s * sc;
  cx.moveTo(x + vx*.44*k, y + vy*.44*k);
  cx.lineTo(x + vx*.22*k - vy*.14*k, y + vy*.22*k + vx*.14*k);
  cx.lineTo(x + vx*.22*k + vy*.14*k, y + vy*.22*k - vx*.14*k);
  cx.closePath();
};
Dolu geçiş (hat başına, tags ≤ 2):
for (const t of tags) {
  cx.beginPath();
  for (i) if (G.sign[i] && vis(i) && on(i) && !bad.has(i) && own(i) === t) tri(i);
  cx.fillStyle = OC[t]; cx.fill(); cx.lineWidth = 1.5; cx.strokeStyle = '#fff'; cx.stroke();
}
Boş geçiş:
cx.beginPath();
for (i) if (G.sign[i] && vis(i) && (!on(i) || bad.has(i))) tri(i);
cx.fillStyle = pal.bg; cx.fill(); cx.lineWidth = 2; cx.strokeStyle = pal.fg; cx.stroke();
Sabitlenmiş ve doğru tabela dolu geçişte globalAlpha .45 ile çizilir (ayrı tek yol). Toplam 4–6 çağrı.
Çakışma kontrolü: ok kenar ortası ±.14s'de; eşli rozet (−.27,−.27), sayaç (−.28,+.28), ↺ (+.29,+.27) ve ipucu kilidi (+.3,−.3) köşelerde. Tabela eşli, sayaçlı ve ters karoya konmadığı için o rozetler zaten aynı karoda olmaz.

9) hint()
Mekanizma aynı (sol'e oturt ve sabitle). Sıralamaya ek: if (G.L.signBad?.length && G.solPa) { yol kümesi = her yanlış tabeladan solPa ile merkeze yürü }; wrong.sort'ta yol kümesindeki karolar öne. Sayaç 0 olsa bile hint cur'u sol'e koyar, yani kurtarıcıdır.

10) reset()
Değişmez. sign statiktir, G.signTold start()'ta yeni G ile sıfırlanır.

11) saveRun() ve start()
- saveRun: { ..., pv: 5, sig: G.sig }
- start: if (run && ... && run.pv === 5 && run.sig === G.sig) ise yükle.
Tabela için ek alan gerekmez.

12) style.css
.rdemo8 { align-self:center; display:flex; align-items:center; margin:6px 0 2px }
.rdemo8 .hb { width:30px; height:30px; border-radius:9px; background:var(--acc); box-shadow:0 0 12px var(--accGlow); margin-right:4px }
.rdemo8 .pt b:before, .rdemo8 .pt b:after { background:var(--rail); animation:sgRail 4s infinite }
.pt.sg:after (dönmeyen ok, dış kontur) { content:""; position:absolute; left:4px; top:27px; width:16px; height:22px; background:var(--fg); clip-path:polygon(0 50%,100% 0,100% 100%); z-index:2 }
.pt.sg:before (iç dolgu) { content:""; position:absolute; left:7px; top:31px; width:10px; height:14px; clip-path:polygon(0 50%,100% 0,100% 100%); z-index:3; background:var(--tile); animation:sgFill 4s infinite }
@keyframes sgFill { 0%,45% {background:var(--tile)} 50%,92% {background:var(--acc)} 97%,100% {background:var(--tile)} }
@keyframes sgRail { 0%,45% {background:var(--rail)} 50%,92% {background:var(--acc)} 97%,100% {background:var(--rail)} }
Gerekçe: spin4 ile köşe ray (K+D) 180°'de G+B, 270°'de B+K olur; Batı kolu %50–92 aralığında merkeze bakar.

13) Robot (tools/hakem.cjs), yeni blok E11 ya da E9'a ek
a) Üretim (page.evaluate, window.__ray.generate/lit):
   - Kapsam: [6,8], [7,9] × 300 tohum × karışımlar {}, {rev}, {cnt}, {two}, {fog}, {pins+pairs+rev+cnt+two+fog}; x.sign = 2–3.
   - Her biri için: tabela sayısı ≥ 2.
   - Her tabela: !pinned, link<0, !rev, cnt<0, hub değil, popc ∈ {2,3}, düz değil, (sol[i] & sign[i]).
   - lit({...P, cur: sol}).solved && !lit(P).solved.
   - Negatif test: sign[i] sol[i]'nin başka bir koluna çevrilince lit(sol).solved false olmalı (o kol çocuğa gider).
   - check('sign.solvable', bad===0 && neg===tabela sayısı).
b) Kural kartı: ruleIntro(409, 12) → kart /Yön tabelası/, .rdemo8 var.
   sizeFor 408, 409, 411, 412 → '7x9 6x8 6x8 7x9'.
c) Dokunuş: i = G.sign.findIndex(Boolean); s0 = G.sign[i]; tapTile(i) → G.cur[i] === rot(eski), G.sign[i] === s0.
d) Kazanmayan tam hat:
   - G.sign[i] = sol[i]'nin ebeveyn olmayan bir kolu; G.cur = sol (biri hariç); son karoya dokun.
   - Beklenen: G.L.base && !G.L.solved, toast metni /Tabela/, modal açılmaz.
   - Sonra G.sign[i] geri yazılır, solve() → waitModal true.
e) Kayıt:
   - Yarıda bırak, sayfayı yenile → G.moves korunur.
   - save.runs.level.sig bozulup yenilenince → G.moves === 0.
f) Merdiven: difficulty.ladder döngüsünü c<14'e çıkar (9–13 için her 3. bölüm örneklenir); M13 > M12 olmalı.
   Simülasyonda: M11 14,36 → M12 14,70 → M13 15,10–15,16 → M14 15,35–15,40.
g) Performans: puzzleFor(409..418) ortalaması < 60 ms.
h) Konsol hatası yok.
