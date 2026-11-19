# M28 · Sarsıntı durağı (`quake`)

Hat M28 (`line: 27`), ilk bölüm 717 (19 Kasım). Dosyalar: `www/rules/sarsinti.js`, `tools/hakem/sarsinti.cjs`. Esin kaynağı: zincirleme tepkili bulmacalar; bir hamlenin çevreye yan etkisi.

**Kural.** Bazı durakların sağ üstünde küçük bir 🌋 yanardağ işareti vardır. Böyle bir durak hatta **bağlandığı an** (yanmıyorken yandığında) çevresindeki karolar **90° saat yönünde** sarsılıp döner. Durak kopup yeniden bağlanırsa yine sarsar. Oyuncuya: "Durağı en sona bırak ya da önce bağla, komşularını sonra düzelt." Kural bilgi vermez, yalnız sırayı önemli kılar.

- **Sarsılan karolar (S):** durağın ızgara komşularından (tahta dışı yok; tünel ağzı ve sarmal tahta geçidi sayılmaz, sarsıntı fiziksel çevredir) **sıradan** olanlar: merkez, birim (makas, tabla, kapak, silik kol…), eşli, sayaçlı, ters, köprü, kapalı karo değil; dört yönü aynı görünen (artı) karo değil; başka bir sarsıntı durağı değil; **hiçbir sarsıntı durağının merkeze giden yolunda değil**. Her durakta en az 2 tane. Hangi kenarların sarsılacağı durakta görünür: o kenarlarda iki kısa deprem yayı.
- **İpucuyla sabitlenen karo sarsılmaz.** İpucunun bağladığı durak sarsmaz (sarsıntı yalnız oyuncu dokunuşunun sonucudur).
- **Tetiklenme:** her kopup yeniden bağlanışta. Bir dokunuşta her durak en çok bir kez sarsar. Sarsıntı başka bir sarsıntı durağını bağlarsa o da sarsar (zincir, sonlu).
- **Hamle:** sarsıntı hamle sayılmaz. Art arda aynı karoya dokunuş 1 hamle kuralı aynen geçerlidir.
- **Kazanma:** son dokunuş durağı bağlarsa komşular döner ve kazanma **sarsıntıdan sonraki** durumda denetlenir (çekirdek `after` kancalarından sonra `G.L.solved`'a bakar; eklenti sarsıntıdan sonra `G.L`'yi yeniden hesaplar).

**Neden "her yeniden bağlanışta"?** Basit ve tutarlı: oyuncu ne görürse onu yaşar (bağlandı → sarstı), "bu durak artık sarsmaz" gibi gizli bir durum tutulmaz, geri al (↶) da kendiliğinden doğru çalışır (dokunuştan önceki yanma durumu her dokunuşta `G.L`'den okunur). Döngüye kilitlenme yapı gereği yoktur (aşağıdaki kanıt): sarsılan karolar durağın yolunda olmadığı için durak bağlıyken komşular düzeltilir, durak yanık kalır, yeni sarsıntı olmaz.

## Üretim (`mark`, `ord: 28`, işaretlerin en sonu)

1. Çözüm uzaklığı `d` (`lit`; tünel, sarmal, köprü, iki merkez, kapalı durak dahil).
2. Aday durak: çözümde tek kollu (uç), sıradan karo (`free`, `keep`/sayaçlı/ters/kapalı/silik/köprü değil), ekspres durak değil, `d ≥ 2`. Adaylar `R()` ile karıştırılır.
3. Her aday için S = ızgara komşularından sıradan, simetrik olmayan, durak olmayan ve **yol koşulunu** bozmayan karolar. **Yol koşulu:** çözümde şimdiye dek seçilen bütün S karoları boşaltılınca (maske 0) da seçilen her durak merkeze bağlıdır. `lit` bağlantısı kol eklemekle tekdüze arttığından (BFS: kol eklemek yalnız kenar ekler) S karoları hangi yönde olursa olsun durakların bağlantısını bozamaz.
4. `|S| ≥ 2` olan aday seçilir; iki durak yan yana gelmez, durak hiçbir S'de olmaz.
5. Başlangıç: sarsılan karo ve durak çözümde başlamaz (eşitse bir tık çevrilir); durak başta yanıksa yanmaz bir yöne çevrilir. Durak ve S `busy` olur (karanlık tünelin merkez komşusu düzeltmesi ve "çözülmüş gelmesin" dokunmaz).
6. Veri: `out.quake = { st: [durak], nb: [[S karoları], …] }`.

Miktar: hattın ilk bölümü 1 durak, sonra 2, hat finali 3 (yer bulunamazsa daha az; ölçümlerde her bölümde en az 1).

## Çözülebilirlik kanıtı

Q = sarsıntı durakları, S = sarsılan karoların birleşimi, Y = geri kalan karolar (Q dahil). Sarsıntı yalnız S karolarını döndürür.

1. **Evre 1:** her durak için, çözümde S boşaltılmışken merkezden durağa giden bir yol vardır (yol koşulu); bu yolun karoları merkezden dışa, sonra durağın kendisi çözüme getirilir. Bu sırada sarsıntılar olabilir; yalnız S'yi değiştirirler, yol karolarına dokunmazlar, bu yüzden evre 1 sonlu dokunuşla biter. Sonunda yollar çözümdedir ve S nasıl dönmüş olursa olsun **her durak yanar** (`lit` kol eklemekle tekdüze).
2. **Evre 2:** kalan bütün yanlış karolar (S ve Y'nin geri kalanı) merkezden dışa çözüme getirilir. Yol karolarına dokunulmaz, durak yanık kalır → yanmıyor→yanıyor geçişi olmaz → **hiç sarsıntı olmaz**. Sonunda her karo çözümdedir: bölüm biter.

Öteki kuralların kısıtları bu sırayla uyumludur: mühürlü karo merkezden dışa açılır (evre 1'de yolun önceki karosu yanık; evre 2'de sarsıntı olmadığı için kuralın kendi kanıtı aynen geçer), soğuyan karo yalnız bekletir, birimler (makas, tabla) Y'dedir ve sarsılmaz. Kendiliğinden dönen/kayan kurallar (bakım karosu, kayan sıra, kayan sütun) yolu sarsıntıdan bağımsız bozabileceği için, son sefer de hamle payı kanıtı sarsıntıyı bilmediği için `clash`.

**Par.** Çekirdek par'ı (yanlış karo sayısı) evre sırasıyla her zaman yetişir: Y'nin her yanlış karosu 1 hamle; S'nin her karosu en çok 1 hamle ve üretim S'yi çözümde başlatmadığı için çekirdek her S karosunu zaten 1 sayar. Benzetim (öteki kuralların engelleri olmadan, "önce bütün Y merkezden dışa, sonra S" sırası; evre 1'in genişletilmiş hâli, aynı kanıtla): 304/304 bölümde par içinde kazanır.

**Robot.** Çekirdek robotu (`solve`, turlar hâlinde okuma sırası) ek plan gerektirmez: Y karolarını yalnız dokunuş değiştirir; turlar Y'yi çözüme oturtunca duraklar kalıcı yanar, sonraki tur sarsılmış S karolarını düzeltir.

**Durak en sona.** Komşular çözümden bir tık geride, durak son dokunuşla bağlanırsa sarsıntı komşuları çözüme oturtur ve bölüm o dokunuşta biter (robot testi `rule.quake.last`). Bu sıra genelde de çalışır ama her bölümde garanti değildir (durak, bir tık gerideki komşu üzerinden erken yanabilir); garanti olan evre sırasıdır.

## Ölçümler (19 Kasım)

| Ölçüm (304 tohum, 6×8 · 7×9, uyumlu her eklentiyle; `rule.quake.gen/solve/hard`) | Sonuç |
|---|---|
| Çözüm geçerli, çözülmüş gelmez, yerleşim ve yol koşulu | 304 / 304 |
| Evre sırası kazanır / par içinde | 304 / 304 · 304 / 304 |
| Okuma sırasıyla oynayan saf oyuncu kilitlenmeden kazanır | 304 / 304 |
| Saf oyuncu par'ı aşar | 281 / 304 (%92), ortalama **+2,7 hamle**, 790 sarsıntı |
| M28 hattının 28 bölümünde saf oyuncu | ortalama **+2,9 hamle** |

**Gerçekten zorlaştırır mı?** Kuralsız aynı bölümde okuma sırasıyla oynayan saf oyuncu tam par kadar hamle yapar (her yanlış karo bir kez). Sarsıntıyla aynı oyuncu bölümlerin %92'sinde par'ı aşar, düzelttiği komşuları yeniden düzeltmek zorunda kalır. Bu fazlalık ↻ hamle hedefinin toleransı (par'ın %20–40'ı) içinde kalır, yani yıldız kaybettirmez, ama sırayı düşünmeyen oyuncuyu geri adım atmaya zorlar; sırayı düşünen oyuncu par'ı tutturur.

**Zorluk merdiveni.** Statik çözücü puanı sarsıntıyı bilmez; hat ortalamasını seçici hedefi taşır: `boost: 12`. Ölçüm (ekspres durak ölçümüyle aynı yöntem, `avg(c)` = hattın bütün bölümlerinin `diff` ortalaması): M26 20,9 · M27 23,6 < **M28 24,3** (boost 10: 23,5; 11: 23,9; 12: 24,3; 13: 24,4). Karma M29+ (`KARMA = 28`) ≈ 20,8. Üretim süresi: aday başına birkaç `lit` çağrısı; 304 tohum ~1 sn.

## Oyun ve çizim

- `block`: dokunuştan önce durakların yanma durumunu kaydeder (her zaman 0 döndürür, dokunuşu engellemez).
- `after`: yanmıyorken yanan durağın S karolarını `rot` ile çevirir, `G.L`'yi yeniden hesaplar (zincir için tekrar), hafif üçgen dalga sesi (`note(0)/2`), hafif titreşim; oyuncu başına ilk sarsıntıda bir kez "🌋 Sarsıntı · durak bağlanınca çevresi 90° döndü".
- `xform`: sarsılan karo 140 ms gecikmeyle (oyuncunun dokunuşu önce otursun) 520 ms'de eski yönünden yumuşakça döner, ilk yarıda hafif yatay titrer. Hareket azaltılmışsa titreme yok, dönüş 200 ms.
- `over`: durağın sağ üstünde kraterli üçgen (yanardağ; eş/sayaç rozetleri yuvarlak, ekspres plaka dikdörtgen: biçimle ayrı), sarsılacak kenarlarda iki kısa yay (yanmıyorken magma rengi, yanıkken soluk), sarsıntı anında durakta yayılan halka. Tek yol, kare başına birkaç çağrı. Karanlık tünelde görünmeyen durağın işareti çizilmez.
- `undo`: animasyonları temizler; yanma durumu her dokunuşta `G.L`'den okunduğu için başka düzeltme gerekmez.

**Bilinen sınırlar.** Sarsıntı ızgara komşularına bakar; sarmal tahtada kenarın öbür yüzündeki karo sarsılmaz. Saf oyuncunun fazladan hamlesi ↻ hedef toleransı içinde kalır: kural yıldız kaybettirmekten çok düşünme ister.

**Test.** `tools/hakem/sarsinti.cjs`: `rule.quake.gen` (304 tohum), `.solve` (benzetim: evre sırası par içinde, saf oyuncu kilitlenmez), `.hard` (saf oyuncunun fazladan hamlesi), `.clash`, `.line` (merdiven M27 < M28, giriş 1, final 3), `.old` (eklenti çıkarılınca 1–716 ve Günün Hattı aynı), `.card` (9 dil, 320×568), `.shake` (90°, hamle sayacı, kazanma sarsıntıdan sonra, yeniden bağlanınca yine), `.last` (durak en sona), `.play`/`.mid`/`.fin` (robot kazanır), `.fog`, `.perf` (4× yavaş CPU), `.errors`.
