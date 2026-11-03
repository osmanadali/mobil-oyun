# M11 · Mühürlü karo (`seal`)

Hat M11, ilk bölüm 241 (3 Kasım hat düzeni). Dosyalar: `www/rules/muhurlu-karo.js`, `tools/hakem/muhurlu-karo.cjs`.

**Kural.** 🔒 Mühürlü karo, komşularından biri **merkeze bağlı (yanan)** olana dek dönmez: dokunuş yok sayılır, hamle sayılmaz. Komşu yanınca mühür açılır ve karo normal döner. Bağlantı kopunca karo **yeniden mühürlenir**. Durum saklanmaz; her dokunuşta `G.L.d`'den baştan okunur. Komşuluk `api.nb` ile okunur, yani tünel ağzı ve sarmal tahta komşuları da sayılır.

**Neden zorlaştırır.** Bulmacaya bilgi eklemez; çözüm kümesi aynıdır. Oyuncunun sırasını kısıtlar: kenardan ya da ortadaki kesin karolardan başlama alışkanlığı mühürlü karoda işe yaramaz. Oyuncu hattı **merkezden dışa** doğru kurmak zorunda kalır. Mühürlü karonun ebeveyn yolunu yanlış kurup sonradan bozan oyuncu, karoyu yeniden kilitler ve hamle kaybeder.

**Üretim.** `mark` aşamasında, en son (`ord: 23`, bütün öteki işaretlerden sonra) seçilir. Aday karo:

- Çıplak bir karodur: birim, eşli, ters, sayaçlı, köprü, tünel ağzı değildir. Başka bir eklentinin n uzunluklu işaret dizisinde (❄, ⚙, tabela, kapak, silik kol, kapalı durak…) ya da `.mark` dizisinde (halka) yer almaz.
- Başlangıçta çözümde yanlış durur (`cur ≠ sol`).
- Merkezin (iki merkezde ikisinin de) komşusu değildir. Merkez hep yanar, orada mühür hep açık olurdu.

Seçilen karolar `C.busy` olur: karanlık tünelin merkez komşusu ayarı ve "çözülmüş gelmesin" onlara dokunmaz. Miktar: tanıtımda (6×8) 2, sonra ızgaranın %6,5'i (7×9'da 4), hat finalinde %9 (6), en az 3. Eklenti `R()`'yi yalnız mühürlü bölümde tüketir.

**Çözülebilirlik kanıtı.** Çözüm `sol` bir ağaçtır (halkada bir kenar fazlası). Karoları merkezden BFS derinliği sırasıyla çözüme getiren oyuncuyu düşünelim (birimler ilk ulaşıldıklarında bir bütün olarak). Mühürlü bir karo t'ye sıra geldiğinde, ağaçtaki ebeveyni p daha sığdır ve merkezden p'ye giden yolun bütün karoları zaten çözüm yönündedir. Yolun her kenarının iki ucu da yol üstündedir. Bu yüzden p yanar; yanması t'nin yönüne bağlı değildir. p, t'nin komşusudur, öyleyse t'nin mührü açıktır ve t çözüme getirilebilir. Tümevarımla her karo çözülür. Mühürlü karolar merkez komşusu olmadığından p her zaman vardır. Yarım köprü yolları ve iki merkez de aynı biçimde işler. Kapalı durak karoları yapraktır, yol üstünde olmaz.

Oyuncu hiçbir zaman kilitli kalmaz: mühürsüz karolar her zaman döner, mühürlü karonun yolu da aynı tümevarımla yeniden kurulabilir. Sayaçlı karonun kilidi ve ↺ baştan ayrı kurallardır.

**Çakışma.** `clash: ['gear']`. Bakım karosu kendiliğinden döner ve mühürlü karonun yolunu dokunuş dizisinin ortasında bozabilir. Bu durumda karo, oyuncunun elinde olmadan yeniden mühürlenirdi.

**Oyun.**

- `block`: mühür kapalıyken ilk seferde "🔒 Mühürlü karo · komşusu hatta bağlanınca açılır" bildirimi çıkar. Çekirdek karoyu bastırma animasyonuyla oynatır.
- `after`: bir mühür açılınca kısa iki notalı tık sesi çalar (kapanınca sessiz).

**Çizim (`over`).**

- Mühürlü karo: pirinç renkli kesik çerçeve ve ortada koyu zeminli **kapalı** asma kilit.
- Açık mühür: köşede küçük **açık** kilit. Kanca yukarı kalkar, sağ bacağı gövdeden ayrılır.

Durum renge ek olarak biçimle de ayrılır (renk körü dostu). Açık temada koyu pirinç kullanılır.

**Robot planı.** Çekirdeğin `solve()` yardımcısı turlarla çalışır. Mühürlü karoya erken dokunuş yok sayılır (hamle sayılmaz), sonraki turda karo açılmış olur. Ek `plan` gerekmez. En kötü durum, mühür zinciri derinliği kadar ek turdur; ölçümde en çok 3 tur.

**Ölçümler (3 Kasım).**

- 432 tohum (6×8 ve 7×9; yalın, iki merkez, karanlık+ters+sayaçlı ve çakışmayan her eklentiyle): mühüre uyan oyuncu hepsini çözüyor, en çok 3 tur sürüyor. Mühürlerin yeri kurallara uygun. Bölümlerin %90'dan fazlasında başta en az bir mühür kapalı.
- Zorluk merdiveni (hat ortalaması): M10 13,7 → **M11 14,1** → M12 14,9. `boost: 1.5`; çözücü puanı sırayı ölçmediği için pay, kurallı bölümün biraz daha zor tabandan seçilmesini sağlar.
- Eklenti çıkarılınca 1–240. bölümler ve Günün Hattı bit bit aynı kalıyor.

**Test.** `tools/hakem/muhurlu-karo.cjs`: `rule.seal.gen`, `.line`, `.ladder`, `.old`, `.card`, `.play` (kilitli dokunuş yok sayılır, robot kazanır, bağlantı kesilince yeniden mühür), `.errors`.
