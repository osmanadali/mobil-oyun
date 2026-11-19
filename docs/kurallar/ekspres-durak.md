# M28 · Ekspres durak (`express`)

Hat M28, ilk bölüm 717 (19 Kasım, `kurallar-4`). Dosyalar: `www/rules/ekspres-durak.js`, `tools/hakem/ekspres-durak.cjs`. Esin kaynağı: metro haritalarında ekspres seferin "en çok N durak" vaadi; uzaklık ipuçlu bulmacalar.

**Kural.** Bazı durakların sağ üstünde 🚄 sayılı bir plaka vardır: merkezden o durağa giden yol **en çok o kadar karo** olabilir (yol, merkezden sonraki karoları ve durağın kendisini sayar; merkezin komşusu 1). Uzun yoldan bağlanan ekspres durak bölümü bitirmez. Oyuncuya: "Ekspres durağa merkezden giden yol en çok üstündeki sayı kadar karo olabilir: kısa yolu bul."

**Sayı nereden gelir.** Sayı, çözüm dizilimindeki uzaklığın **kendisidir** (`lit` ile: tünel ağzı, sarmal tahta, köprü, iki merkez dahil). Çözüm her zaman geçerlidir; sayı sıkıdır, yani daha uzun bir yol hiçbir zaman kabul edilmez.

**Neden zorlaştırır (ve ne zaman anlamlı).** Kuralın iki etkisi vardır:

1. **İkinci çözümü eler.** Tahtada uzun bir dolambaçla da her şeyi bağlayan bir dizilim varsa, sayı onu reddeder. Oyuncu "hepsi yandı ama bitmedi" durumunda kısa yolu aramak zorundadır.
2. **Uzaklık bilgisi.** Sayı, durağa ulaşan yolun boyunu söyler; sayının ızgara uzaklığından büyük olduğu durakta yol dolanmak zorundadır ve oyuncu nerede dolandığını bulmalıdır.

Kural, ancak bulmaca sayılarla birlikte **tek çözüme iniyorsa** anlamlı ve adildir. Bunu üretim çözücüyle doğrular (aşağıda); inmeyen aday reddedilir.

**Üretim (`mark`, `ord: 27`, işaretlerin en sonu).** Kapak, silik kol, kapalı durak, mühürlü karo ve tek yön işaretlerini koyduktan sonra, oyuncunun göreceği bilgiyle çalışır:

1. Çözüm uzaklığı `d` (`lit`, kapalı durak yok sayılarak).
2. Aday durak: çözümde tek kollu, merkez değil, birimde/eşli/sayaçlı/köprülü değil, `busy`/`keep` değil, kapalı ya da silik değil, `d ≥ 3`.
3. Çözücü (`difficulty`, yaprakta `lit`; düğüm tavanı 360) **sayılar olmadan** en çok 24 ikinci çözüm toplar (çözüm dizilimi dışındaki, `lit` ile çözülmüş dizilimler).
4. Adaylar `R()` ile karıştırılır; ikinci çözümü eleyen (bağlayıcı) duraklar önce, uzun yollar önce. Açgözlü seçim: her adımda kalan ikinci çözümlerin en çoğunu eleyen durak.
5. `x.express` durak seçildikten sonra hâlâ eleyemediği ikinci çözüm kalıyorsa aday **reddedilir** (`P.reject`; `pick` başka adayı seçer).
6. Veri: `out.express = { st: [durak], B: [sayı] }`.

Miktar: hattın ilk bölümü 2 ekspres durak, sonra 3, hat finali 4.

**Çözülebilirlik ve adillik kanıtı.** Sayı çözüm uzaklığıdır, çözüm denetimi geçer (`check`: her ekspres durak bağlı ve `d ≤ sayı`). Kural yalnız kabul edilen dizilimleri azaltır; gizli bilgi yoktur. Adillik bağımsız sayımla denetlenir: robot, reddedilmeyen her adayda çözücüyle (tavan 600) çözümleri sayar.

| Ölçüm (352 tohum, 6×8 · 7×9, uyumlu her eklentiyle) | Sonuç |
|---|---|
| Reddedilmeyen aday sayılarla tek çözüm | 336 / 336 |
| Sayılar olmadan ikinci çözümü olan taban | 7 (hepsinde sayılar tek çözüme indirdi) |
| Reddedilen aday | 16 (%4,5) |

Ayrıca 7×9'da sayısız ikinci çözümün ekspres denetiminden kaldığı (uzun yol) doğrudan sınanır (`rule.express.fair`).

**Çakışma.** `clash: ['last']`: ⏳ son sefer de durağın sağ üstüne sayı koyar; iki sayılı durak aynı tahtada karışır.

**Oyun ve çizim (`over`).**

- Plaka: durağın sağ üstünde köşeli dikdörtgen (eş ve sayaç rozetleri yuvarlak: biçimle ayrı), solunda iki hız çizgisi, içinde sayı. Yanmıyorsa açık mavi; yanan ve yolu yeterince kısa: hat renginde; yanan ama yolu uzun: uyarı renginde ve nabız.
- Hepsi bağlı ama bir ekspres durağın yolu uzun: durak nabız atar, bölümde bir kez "🚄 Ekspres durağa yol uzun · en çok N karo".
- Ekspres durağa ilk dokunuşta (oyuncu başına bir kez) "🚄 Ekspres durak · sayı, merkeze en çok kaç karo olduğunu söyler".
- Karanlık tünelde plaka karanlık örtünün altında kalır (durak görünmeden sayısı da görünmez).

**Zorluk ve merdiven (19 Kasım).** Çözücü puanı biraz artar (7×9, 40 tohum: 16,1 → 16,5). Hat ortalamasını seçici hedefi taşır: `boost: 9`. Ölçüm: M27 21,2 < **M28 21,6**; karma M29+ 20,1–22,2. Üretim süresi: ikinci çözüm araması aday başına bir çözücü turu (tavan 360 düğüm); masaüstünde 7×9 karma bölüm ortalama 40–110 ms, en çok ~0,5 sn.

**Bilinen sınırlar.**

- Tabanın çoğu bulmaca zaten tek çözümlüdür; orada sayı ikinci çözüm elemez, yalnız uzaklık bilgisi verir (sayı sıkı olduğu için yine doğru ve bağlayıcıdır).
- Çözücünün düğüm tavanı nedeniyle çok geniş arama ağaçlarında ikinci çözüm gözden kaçabilir (öteki gizli bilgi kurallarıyla aynı sınır); bağımsız sayım 336 adayda hiç kaçırmadı.

**Test.** `tools/hakem/ekspres-durak.cjs`: `rule.express.gen` (352 tohum), `.fair` (bağımsız sayım, ikinci çözümü eleme), `.clash` (son sefer), `.line` (merdiven M26 < M27 < M28, final 4 durak), `.old`, `.card` (320 px), `.play` (sayılar = çözüm uzaklığı, ilk dokunuş ipucu, robot çözer), `.mid` (7×9), `.fog`, `.errors`.
