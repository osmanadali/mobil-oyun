# M18 · Nehir (anahtar: `river`)

> **Durum: uygulandı.** Kod `www/rules/nehir.js`, robot testleri `tools/hakem/nehir.cjs`. Çekirdekte değişiklik yok: main'deki `open`, `check`, `prune`, `P.reject` ve `api.difficulty(P, leaf)` kancaları yetti. Tasarım başvurusu: `proto-zor` dalı, `river-nehir` (`proto/zor/tasarimlar.json`, `proto/zor/kisit/nehir.cjs`).

## Kural kartı

- Ad: **Nehir** · etiket: "Yeni: nehir".
- Metin (25 kelime): Ray **nehri** geçitten geçer ya da kıyıda **tamponla** (satır içi simge) biter. Kıyıda tam **rozetteki sayı** kadar tampon olmalı; eksikse bir yerde **döngü** vardır.
- M11 Köprü ile karışmasın diye "köprü" sözcüğü hiç geçmez; nehir üstündeki bağlantının adı **geçit**tir. Köprü karonun içinde kesişmedir, geçit iki karo arasındaki nehir aralığıdır.
- Demo (`.rd-river`, satır içi SVG 100×100): 2×2 karo, ortadan dikey dalgalı mavi nehir. Üstte sağ karo dönüp sol karoya bağlanınca geçit plakası belirir. Altta sol karo nehre dönünce (karşısı boş) tampon çubuğu çıkar, rozet "1/1" olur. 4,4 sn döngü. Temel (animasyonsuz) stil son hâli gösterir; azaltılmış harekette kart boş kalmaz.
- İlk tampon oluşturulunca ömürde bir kez bildirim: "Tampon · ray kıyıda bitti" (`save.riverTold`).

## Mekanik

Tahtayı baştan başa kesen bir nehir çizgisi vardır: dikey ya da yatay, karo aralığında. Nehir kenarındaki her karo çifti için:

- İki karo da nehre kollu → ray **geçitten** geçer (normal bağlantı).
- Yalnız biri kollu → ray kıyıda **tamponla** biter. Açık uç sayılmaz (`open` kancası), `L.open` sayar.
- İkisi de kolsuz → bir şey yok.

Küresel koşul: kıyıda tam **T** tampon (`check`: `L.open === T`). Rozet "⊣ şimdiki/T" nehrin bir ucunda, tahta dışında durur.

**Sayım kanıtı (neden "eksikse döngü"):** karonun kol sayısı dokunuşla değişmez. Çözüm ağaç + T tampon koludur: Σpopc = 2(n − h) + T (h merkez sayısı). Açık uç yoksa her kol ya bir kenarın ucu ya bir tampondur: Σpopc = 2m + t (m kenar, t tampon). Hepsi yanıyor ve karışma yoksa c = h bileşen vardır, döngü sayısı m − n + h = (T − t)/2. Yani:

- t = T ⇔ döngü yok (çözüm bir orman, her merkezin ağacı).
- t = T − 2 ⇔ bir döngü, t = T − 4 ⇔ iki döngü…
- t > T bağlı dizilimde olamaz.

Oyuncunun gördüğü eksik tampon her zaman bir döngü demektir; kart bunu söyler. M17 Halka "bir kez kapan" der, nehir "kapanma" der; ikisi aynı bölümde gelmez (aşağıda çakışma).

**Neden zorlaştırır:** Net türünün en çok kullanılan zincir adımı "komşum bu kenara kollu, ben de kollu olmalıyım"dır. Nehir boyunca bu çıkarım geçersizdir: bir yakadan gelen kesin bilgi öbür yakaya geçmez. İki yarı ayrı çözülür, sonra hangi kenarın geçit, hangisinin tampon olduğu küresel sayımla eşleştirilir. Kenar çapaları (tahta kenarı, merkez) yerinde durur, ilk tur hafiflemez; orta oyunda planlama gerekir.

## Üretim ve çözülebilirlik kanıtı

`tree(C)` aşaması (ağaçtan sonra, karıştırmadan önce; `tOrder` yok, sıra `line` = 17):

1. **Aday çizgiler:** dikey sınır `a` (sütun a−1 | a) ve yatay sınır `a` (satır a−1 / a), `2 ≤ a ≤ L−2` (kenara yapışık değil) ve merkez(ler)in sütunu/satırı `a−1` ya da `a` değil (merkeze değmez). Sıra R() ile karıştırılır (Fisher–Yates).
2. **Tampon adayı:** çizgideki kenar çiftinde `sol`'de iki yan da kolsuz; tamponu taşıyacak karo merkez değil, `C.keep` değil (tünel ağzı, köprü), en çok 2 kollu.
3. Farklı kenarlarda ve farklı karolarda `T` tampon seçilebilen ilk çizgi alınır: `sol[c] |= bit`. Hiçbir çizgide yer yoksa `out.river` yazılmaz, bölüm nehirsiz gelir (6×8 ve 7×9'da ölçümde hiç olmadı).
4. `C.out.river = { cols, rows, vert, a, T, at }`. `at`: `[karo, kol yönü]` tamponlar. Kıyı çiftleri (`pairs`) ilk kullanımda hesaplanıp bu nesnede saklanır.

**KANIT:** `sol` = ağaç + T dış kol. Geçitler ağaç kenarıdır, tamponların karşısı kolsuzdur. `lit(sol)` her karoya ulaşır, nehir dışında açık uç yoktur, `L.open = T`, `check` 0. Karıştırma yalnız döndürmedir (geri alınabilir), `cur → sol` erişilebilir. Eklenen kol karonun kol sayısını değiştirir ama sonraki aşamalar (sabit, eşli, ters, sayaçlı, makas, karanlık) yalnız yön değiştirir.

**Eski bölümler:** kancalar yalnız `x.river ≠ 0` iken çalışır, R() yalnız o zaman tüketilir. `rulesFor` nehri ancak M18'den (749) sonra verir.

### Adillik: tek çözüm (`mark` + `P.reject`)

Kıyı kenarları serbest olunca bir bölümün birden çok çözümü olabilir (hangi kenar tampon?). Kazanma denetimi her geçerli dizilimi kabul ettiği için oyuncu takılmaz, ama ipucu yalnız `sol`'ü bilir ve çok çözümlü bölüm "çıkarım" değil "tahmin" ister. Bu yüzden `mark(C)` aşamasında çözücünün yaprağında çözüm sayılır (`api.difficulty(P, leaf)`, ikinci çözümde durur). İkinci çözüm varsa `C.out.reject = true`; `pick` reddedilmemiş adaylar arasından seçer.

- Sayım `mark`'ta yapılabilir: aday kümeleri başlangıç yönüne bağlı değildir; karanlık ve "çözülmüş gelmesin" yalnız yön değiştirir.
- Ölçüm (T = 2, 200 tohum): 7×9'da adayların %28'i, 6×8'de %20'si reddedilir. Eklentisiz tabanda çok çözüm oranı %3,5. M18'in 80 bölümünün ve karma hatlardaki 300 nehirli bölümün hiçbiri reddedilmiş aday değil.
- Çok çözümlü adayların zorluk puanı yapay olarak yüksektir (7×9: 26,9 ↔ tek çözümlü 17,3): çözücü dalları gezer. Ret, puanı da dürüst kılar.

## Kazanma (`check`) ve çözücü (`prune`)

- `open(P, i, k)`: i karosunun k kolu nehre bakıyorsa doğru. İç kenarda simetriktir (`open(i, D) = open(i+1, B)`). Tahta kenarına bakan kol açık uç kalır.
- `check(P, L)`: `L.open === T` değilse 1. `L.rvNear = bozuk && L.solved` (temel denetim tamam: hepsi bağlı, açık uç yok, karışma yok, ama tampon eksik → döngü).
- `prune(P, C, M, unit)`: her kıyı çifti için olası durumlar (eşleşir / tampon) adaylardan okunur. Σzorunlu tampon > T ya da Σolası tampon < T ise çelişki (−1). Σzorunlu = T ise olası tamponlar eşleşmeye zorlanır; Σolası = T ise olası tamponların hepsi tampon olur. Eşli karo iki yakada aynı birimse süzülmez (güvenli taraf).
- **Sağlamlık:** robot 192 bulmacada süzgeçli ve süzgeçsiz çözüm sayısını karşılaştırır: hep eşit (süzgeç çözüm silmez).

## Dokunma ve geri bildirim

Dokunma değişmez (tek dokunuş, 90°). Nehir sabittir, akmaz.

- `block` (engellemez) dokunuştan önceki tampon sayısını ve yakın kazanç hâlini saklar; `after` geçişleri bulur.
- **Yakın kazanç (döngü):** `L.rvNear` yeni doğduysa rozet 900 ms içinde iki kez uyarı renginde dışa açılır. Bölümde bir kez bildirim: "Kıyıda T tampon olmalı · eksikse bir yerde döngü var" + hafif titreşim. Kazanma yok.
- **Yeni tampon:** tampon sayısı arttıysa yumuşak bir ton; ömürde bir kez "Tampon · ray kıyıda bitti".

## Görünüş

- **Nehir** (`under`, raylardan önce): karo aralığında dalgalı çizgi (genlik .045s, dalga boyu .5s), altında .2s geniş yarı saydam şerit. Tahtanın iki ucundan .32s taşar, rozete uzanır. Mavi (`#4cc9ff`, açık temada `#1f7fd6`), ama ayırt edici olan **dalga biçimidir** (renk körü dostu): öteki hiçbir öğe dalgalı değil.
- **Geçit plakası:** iki kollu kenarda nehrin üstünde küçük yuvarlak köşeli plaka (karo rengi, ince kenar). Ray plakanın üstünden geçer. Tek yol.
- **Tampon** (`over`): kolun kıyıdaki ucunda (merkezden .4s) dik çubuk (.075s, düz uç) ve iki ucunda cıvata noktası. Yanan tampon ön plan rengi + hat rengi cıvata, sönük tampon soluk gri. Karanlıkta görünmeyen karonun tamponu çizilmez.
- **Rozet:** dikey nehirde tahtanın üstünde, yatay nehirde solunda (`pad`: .5 karo). "⊣" simgesi + "görünen tampon/T". Sayı T'ye eşitken hat renginde dolu, değilken zemin renginde ve gri kenarlı. Kazanırken hepsi yanar, görünen tampon `L.open`'a eşittir.
- Maliyet: kare başına 6–9 çizim çağrısı (şerit, dalga, plakalar, iki tampon yolu ×2, rozet). 4× yavaş CPU'da nehir kancaları ortanca 0,3 ms, kare çizimi ortanca 2 ms.
- 360 px genişlikte 7×9 okunur (ekran görüntüleri: `hakem-out/shots/river*.png`).

## Miktar, zorluk payı, çakışma

- `amount = (n, intro) => intro ? 1 : 2`: tanıtım bölümü (749, 6×8) T = 1; sonra T = 2 (testere dişi 750–751 6×8, sonra 7×9; karma hatlarda da 2).
- `boost: 3.5` (kuralın kendi hattının ilk 3 bölümünde uygulanmaz).
- `clash: ['bridge', 'table', 'zone', 'ring']`:
  - Köprü: bölünmüş düğüm kıyıda belirsiz (bir yarı geçit, öbürü tampon olabilir).
  - Döner tabla: karoları iki yaka arasında taşır, kıyı çiftleri birim içi olur.
  - Tarife bölgesi (M20, `zone`, henüz eklentisi yok): aynı mekanizma (yumuşak sınır + sayım). CLASH simetrik olduğu için burada tanımlamak yeter.
  - Halka: ölçümde zorluk aşırı değil (aşağıda), ama iki kartın mesajı çelişir: halka "raylar bir kez kapanır" der, nehir "eksik tampon = döngü" der. Aynı bölümde oyuncuya iki zıt sezgi verilmez.

## Ölçümler (gerçek kod, `__ray.generate`)

Aynı tohum ve boyut (`s · 7919 + 13`), kural kapalı `{}` ↔ açık `{ river: T }`:

| | Kapalı | Açık (bütün adaylar) | Δ | Açık (yalnız tek çözümlü) | Δ |
|---|---|---|---|---|---|
| 7×9, T = 2, 150 tohum | 13,63 | 18,24 | **+4,61** (%78 tohumda arttı) | 16,92 | **+3,30** |
| 6×8, T = 2, 150 tohum | 12,78 | 16,52 | **+3,74** (%72) | 14,94 | **+2,53** |
| 7×9, T = 1 | 13,63 | 16,34 | +2,71 | | |
| 6×8, T = 1 | 12,78 | 15,43 | +2,65 | | |

Oyunda `pick` yalnız tek çözümlü adayları seçtiği için asıl ölçü sağdaki sütundur; ikisi de ≥ +1.

Hat ortalaması (`puzzleFor`, `P.diff`):

| Hat | Ortalama |
|---|---|
| M17 Halka (673–748) | 17,87 |
| **M18 Nehir (749–828), boost 3,5** | **19,67** (+1,80) |
| M18, boost 2,5 | 18,73 (+0,86, yetmez) |
| M18, boost 4,5 | 20,73 |

Seçilen pay 3,5: hat M17'den +1,8 yüksek, tasarım önerisiyle aynı. Bölüm hazırlama ortalama 48 ms (en çok ~260 ms, ilk JIT ısınmasında; sonraki bölüm kazanma ekranında önceden hazırlanır).

Karışım (7×9, 150 tohum, tek çözümlü adayların ortalaması): `{}` 13,63 · river 16,92 · ring 14,10 · ring + river 18,19 · sign 12,55 · sign + river 15,65 · portal 16,13 · portal + river 19,18 · sw 14,20 · sw + river 17,64. Katkı toplanır gibi davranır; hiçbir karışım aşırı sert değil (prototipteki "halka ile 26,3" çok çözümlü adaylardan geliyordu).

## Robot testleri (`tools/hakem/nehir.cjs`)

| Kimlik | Ne sınar |
|---|---|
| `rule.river.gen` | 600 üretim (6×8 ve 7×9; sabit, eşli, ters, sayaçlı, iki merkez, karanlık, makas, tabela, tünel ağzı karışımları): lit(sol) çözülü, `L.open = T`, tampon ve çizgi yerinde, hazır çözülü yok; reddedilmeyende tam 1 çözüm, reddedilende ≥ 2 |
| `rule.river.prune` | süzgeçli/süzgeçsiz çözüm sayısı eşit (192 bulmaca) |
| `rule.river.delta` | 150 tohum, 7×9 ve 6×8, Δ ≥ +1 |
| `rule.river.old` | 1–748 ve 30 Günün Hattı: nehir dosyası yüklü/yüksüz özet eşit; kanca hiç çağrılmıyor; `{river:0} ≡ {}` |
| `rule.river.line` | M18'in 80 bölümünde nehir, tek çözümlü; 749 6×8 T=1, 750–751 6×8 T=2, 752 7×9; ortalama ≥ M17 + 1 |
| `rule.river.clash` | 749–20000 `rulesFor`: köprü, tabla, halka, tarife bölgesi (kukla) ile hiç birlikte değil |
| `rule.river.card`, `rule.river.play` | 749'da kart (geçit sözcüğü, demo, simge); ilk tampon bildirimi; yarım oyun kaydı/sürdürme; ↺ baştan; robot (solve) kazanır |
| `rule.river.hint` | yalnız tampon karosu yanlışken ipucu onu oturtur, bölüm biter |
| `rule.river.loop` | döngülü (tampon eksik) dizilimde kazanılmaz, rozet nabız atar, bildirim bir kez |
| `rule.river.mix`, `rule.river.fog` | 829+ karma hatlarda 300 nehirli bölüm: üretiliyor, çözüm geçerli, çakışma yok; nehir + karanlık tünel robotla kazanılıyor |
| `rule.river.perf` | 4× yavaş CPU'da çizim süresi |

## Bilinen sınırlar

- Merkeze değen ve kenara yapışık çizgiler dışlandığı için 6×8'de 4, 7×9'da 6 aday çizgi var; nehrin yeri bölümden bölüme az değişir (dikey nehir 7×9'da yalnız 2. ya da 5. sınırda).
- İki merkezli bölümde çizgi iki merkeze de değmemeli; aday azalır ama ölçümde hep kuruldu.
- Tohum başına varyans yüksek: aynı tohumda %22–28 bölüm kural açıkken kolaylaşıyor. Pay (boost) seçicide bunu telafi ediyor.
- Rozetteki sayı görünen tamponları sayar (yanmayan karonunkiler dahil, karanlıkta görünmeyenler hariç); kazanma denetimi yalnız yananları sayar. Kazanma anında ikisi eşittir.
- Tek çözüm denetimi çözücünün düğüm tavanına (200) bağlıdır; tavana çarpan adayda ikinci çözüm bulunamazsa aday tek çözümlü sayılır. Ölçümde M18 ve karma hatlarda bu durum görülmedi (robot 600 üretimde sayımı ayrıca doğruluyor).
- **Karma dağılımı değişir (beklenen):** nehir öğrenilmiş kurallar havuzuna girince `rulesFor`'un "en yeni 3 kural" havuzu `tabla, halka, tünel` yerine `halka, nehir, tünel` olur. M19 sonrasında tabla daha seyrek gelir ve 829–40000 arasında karanlık + tabla ikilisi hiç çıkmaz. Bu yüzden `tools/hakem/doner-tabla.cjs` 4. senaryosu ikiliyi bulamazsa çift hat kurallarını (M10–M20) yüklemeden arayıp oynar (en küçük test değişikliği; çekirdek ve tabla kodu aynı). Öteki çift hat kuralları birleşince dağılım yine değişecek.
