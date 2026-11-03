# M21 · Sarmal tahta (`wrap`)

Hat M21, ilk bölüm 521 (3 Kasım hat düzeni). Dosyalar: `www/rules/sarmal-tahta.js`, `tools/hakem/sarmal-tahta.cjs`. Esin kaynağı: Simon Tatham *Net*, "wrapping" seçeneği.

**Kural.** Tahtanın kenarı yoktur: sağ kenar sola, üst kenar alta bağlıdır (simit yüzeyi). Sağ kenardan dışarı bakan ray, aynı satırın sol kenarındaki karoya bağlanır. Üstten çıkan ray aynı sütunun alt karosuna bağlanır.

**Neden zorlaştırır.** Bilgi eklemez, en güçlü çıkarım kaynağını siler. Normal tahtada kenar ve köşe karoları dışarı bakamaz: oyuncu (ve çözücü) ilk turda kenarları kesinleştirip içeri doğru ilerler. Sarmal tahtada hiçbir karo kenarda değildir, "kenardan başlama" taktiği çöker. Çıkarım yalnız simetrik karolardan ve komşu tutarlılığından başlar.

**Üretim.** `pre` aşamasında (`ord: 7`; köprünün ve öteki `pre` aşamalarının önünde çalışır, onlar sarmal komşuluğu görür) tünel ağzının altyapısı kurulur:

- `C.adj[i·4+k]` = karşı kenar dahil komşu, `C.ao` = karşı bit (`DIRS[k][3]`).
- `C.out.wrap = { cols, rows }`.
- `R()` tüketilmez.

Çekirdek bu komşuluğu her yerde `nb/ob` ile okur: Prim ağacı kenar geçişlerini kendiliğinden kullanır, `lit`, zorluk çözücüsü ve `tree()` (tabela, halka) da öyle. Miktar her zaman 1 (açık/kapalı).

**Çözülebilirlik.** Ağaç, sarmal komşulukla büyütülen yayılan bir ağaçtır. Karıştırma yalnız döndürmedir, çözüm yönü her zaman ulaşılabilir. `lit` aynı komşuluğu okuduğu için çözüm dizilimi çözülmüş sayılır. Tek taraftan kullanılan kenar geçişi (karşı karo karşılamıyorsa) gevşek uç sayılır. Ölçümde her bölümde en az 2 kenar geçişi var (ortalama 6,7), yani kural her bölümde gerçekten işe karışıyor.

**Çakışma.** `clash: ['portal', 'depot', 'river', 'zone']`:

- Tünel ağzı ve gizli depo, tahta dışına bakan kenarlara dayanır; sarmal tahtada böyle kenar kalmaz.
- Nehir ve tarife bölgesi, tahtayı bölen sınırlarla sayım yapar; sarmalda bölünme bozulur.

Kayan sıra uyumludur: sıra zaten sarmal biçimde kayar.

**Oyun.**

- Karanlık tünel (`reveal`): kenardan taşan yanan kol, karşı kenardaki karoyu ve çevresini aydınlatır. Işık kenardan geçer.
- `pad`: dört yanda 0,26 karo pay bırakılır.

**Çizim (`top`).**

- Dört kenarda kesik bir dikiş çizgisi çizilir.
- Kenardan taşan her kolun tahta dışında **yarım rayı** ve ucunda dışarıyı gösteren bir **ok** (›) vardır.
- Karşı karo da karşılayıp ikisi yanınca yarım ray ve ok hat renginde çizilir, yoksa sönük ray renginde.
- Biçim (ok ve dikiş) renge bağlı değildir. Karanlıkta görünmeyen karonun işareti çizilmez.

**Zorluk ölçümü (3 Kasım).**

- Aynı 80 tohumda (7×9) çözücü puanı sarmalsız **14,3**, sarmallı **27,2** (6×8'de 12,5 → 27,2). Puan neredeyse ikiye katlanıyor; artışın çoğu ilk turda elenemeyen karo oranından ve tahmin dallarından geliyor.
- Seçici, hedefe en yakın adayı aldığı için sarmal bölümler hattın hedef puanından seçilir. `boost: 3` ile hat ortalaması M20 18,3 → **M21 18,4** → M22 19,0. Puan aynı ölçekte kaldığından merdiven kesintisiz.
- Seçicinin kaçındığı aşırı adaylar da var: 40 tohumda 3'ünde puan 40'ın üstünde.
- Eklenti çıkarılınca 1–520. bölümler ve Günün Hattı bit bit aynı kalıyor.

**Bilinen sınır.** Sarmal tahta birden çok çözüme daha açıktır (Net'te de böyledir). `lit` her geçerli dizilimi kabul ettiği için oyuncu açısından sorun yoktur. İpucu her zaman üretilen çözüme götürür.

**Test.** `tools/hakem/sarmal-tahta.cjs`: `rule.wrap.gen` (komşuluk simetrik, çözüm çözülü, ≥ 2 geçiş), `.open`, `.mix` (çakışmayan her eklentiyle), `.diff`, `.line` (merdiven), `.old`, `.card`, `.play` (pay ekranda, robot çözer), `.fog` (karanlık + sarmal), `.errors`.
