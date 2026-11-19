# M27 · Tek yön (`oneway`)

Hat M27, ilk bölüm 689 (19 Kasım, `kurallar-4`). Dosyalar: `www/rules/tek-yon.js`, `tools/hakem/tek-yon.cjs`. Esin kaynağı: gerçek raylardaki tek yönlü hat işaretleri ve yön oklu boru bulmacaları.

**Kural.** Bazı karoların rayında oklar (›) vardır: tren o rayda **yalnız ok yönünde** gider. Okun geldiği kol (giriş) merkeze giden kol olmalıdır; öteki kollardaki oklar dışa bakar. Ok raya çizilidir, **karoyla birlikte döner**. Oyuncuya: "Oklu rayda tren yalnız ok yönünde gider."

**Tabeladan (M17) farkı.** Tabelanın oku hücreye sabittir, karo onun altında döner: oyuncuya "merkez hangi kenarda" bilgisini verir ve o kenarda kolu olmayan dönüşleri yerelde eler. Tek yönün oku karonun kendi koludur: her dönüşte giriş başka bir kenara bakar, yerelde hiçbir dönüş elenmez. Doğru dönüşü ancak hattın akışı (merkez hangi taraftan geliyor) belirler. İki ok kuralı aynı tahtada karışacağı için birlikte gelmez (`clash`).

**Neden zorlaştırır.** Oklu karo başta hep yanlış dönüşte gelir (ok çözüm yönünde başlamaz). Oyuncu "bu köşe nereye bakıyor" yerine "merkez bu karoya hangi kolundan ulaşıyor" diye düşünmek zorundadır: karo çoğu zaman yerel olarak iki üç dönüşe uyar, okun yönü bunlardan yalnız birini bırakır ama bunu görmek için hattın geri kalanını izlemek gerekir. Önce **şaşırtıcı** karolar seçilir: girişi merkezin yönüne değil, yana ya da geriye bakan karolar (yol dolanıyor).

**Üretim (`mark`, `ord: 26`).**

1. Çözüm dizilimi `lit` ile yakılır (`d`: merkezden uzaklık, `own`: hangi merkez). Tünel ağzı, sarmal tahta, köprü ve iki merkez `lit` içinde zaten doğru sayılır.
2. Aday karo: köşe ya da T (dört dönüşü ayrı maske: `per = 4`, 2–3 kol), `free` (merkez, eşli, birim, mühürlü değil), ters ya da sayaçlı değil, tabela/kapalı/silik değil, köprünün ve merkezin (ızgarada) komşusu değil, `d ≥ 2`.
3. Giriş kolu: `d − 1` uzaklıktaki, aynı merkeze bağlı komşuya bakan kol. Ağaçta tam bir tane vardır; bir taneden fazla ya da hiç yoksa karo aday olmaz.
4. Şaşırtıcılar (giriş vektörü merkezin yönüyle ≤ 0 çarpım) önce; her grupta oklu karoya bitişik olmayan önce. `R()` ile `x.oneway` tane seçilir.
5. Oklu karo çözüm yönünde duruyorsa bir kez döndürülür (yanıltıcı başlangıç). Merkezin komşuları aday olmadığı için karanlık tünelin "merkez başta yalnız" döndürmesi oku çözüm yönüne geri getiremez.
6. Veri: `out.oneway` (n uzunlukta; çözüm yönündeki giriş biti ya da 0). Oyunda giriş `entry(P, i, cur[i])`: `cur[i] = rot^t(sol[i])` ise giriş `rot^t(oneway[i])` (oklu karo dört yönü ayrı olduğu için `t` tektir).

Miktar: hattın ilk bölümü 2 oklu karo, sonra karo sayısının ~%6'sı (6×8: 3, 7×9: 4).

**Çözülebilirlik kanıtı.** Ok çözümden okunur: çözüm diziliminde her oklu karonun girişi ebeveynine bakar. Denetim (`check`): giriş kolundaki komşu bağlı, `d − 1` uzaklıkta ve aynı merkezde olmalı. Kazanma anında çizge ormandır (halkayla `clash`), `d − 1` komşusu tam ebeveyndir; çözüm dizilimi denetimi geçer. Karıştırma yalnız döndürmedir, oyuncu her karoyu çözüme döndürebilir. Robot 336 tohumda (her uyumlu eklentiyle) sınar: çözüm geçerli, ok çözüm yönünde başlamaz, giriş tam ebeveyn.

**Çözücü süzgeci (`allow`, yerel ve sağlam).** Bir dönüş elenir, eğer:

- giriş tahta dışına bakıyorsa,
- giriş merkez olmayan bir **durağa** (tek kollu, birimsiz, gizlisiz karo) bakıyorsa: durağın tek kolu ebeveynine gider, başka karonun ebeveyni olamaz,
- bir çıkış kolu merkeze bakıyorsa: merkez kimsenin çocuğu olamaz.

Robot çözümün hiçbir oklu karoda süzgeçten elenmediğini 336 tohumda denetler (`rule.oneway.gen`). Halka dışı her karmada geçerlidir; kapalı durakta tek kollu karo kapalı (0 maske) olsa da ebeveyn olamaz.

**Çakışma.** `clash: ['sign', 'ring']`:

- Tabela: iki ayrı ok kuralı (sabit ok / dönen ok) aynı tahtada birbirine karışır.
- Halka: döngüde akış yönü tanımsızdır ("merkeze giden kol" iki tane olabilir).

**Oyun ve çizim.**

- Oklar `rails` katmanında, rayın üstünde: her kolda bir şerit (›), girişte merkeze doğru, çıkışlarda dışa doğru. Koyu kenarlı açık çizgi: hem yanan/sönük rayın üstünde hem karo zemininde okunur; karo dönerken oklar da döner. Biçim renge bağlı değildir.
- Hepsi bağlı ama bir ok ters: o karolar nabız atar, oklar uyarı renginde; bölümde bir kez "Tek yön: oklu karoya hat okun geldiği koldan girmeli".
- Oklu karoya ilk dokunuşta (oyuncu başına bir kez) "Tek yön · ok karoyla birlikte döner".
- Karanlık tünelde ok yalnız görünen karoda çizilir. İpucu karoyu çözüme oturtur (ok doğru yönde). Robot `solve` çözüme getirir.

**Zorluk ve merdiven (19 Kasım).** Çözücü puanını kendisi pek değiştirmez (7×9, 40 tohum: 16,1 → 16,0; süzgeç birkaç dalı keser, yaprak denetimi birkaçını ekler). Hat ortalamasını seçici hedefi taşır: `boost: 6.5`. Ölçüm: M26 20,9 < **M27 21,2** < M28 21,6.

**Bilinen sınırlar.**

- Tabanın çoğu bulmaca zaten tek çözümlüdür (7×9'da ~%96); ok çoğunlukla ikinci çözümü elemekten çok yönü sınar. İkinci çözümü olan tabanda okların bir kısmını eler (120 tohumda 5 ikinci çözümlü tabanın 1'i oklarla tek çözüme indi). Ok gizli bilgi değildir: kazanma denetimi her geçerli dizilimi kabul eder, adillik sayımı gerekmez.
- 320 px'te karo 39 px, ok şeridi ~4 px; kenarlı çizim yine okunur.

**Test.** `tools/hakem/tek-yon.cjs`: `rule.oneway.gen` (336 tohum), `.dir` (elle kurulmuş 2×2 tahtada denetimin yönü), `.clash` (tabela, halka), `.line` (merdiven, karmada da gelir), `.old`, `.card` (320 px), `.play` (ok karoyla döner, ilk dokunuş ipucu, robot çözer), `.mid` (7×9, 4 ok), `.fog`, `.errors`.
