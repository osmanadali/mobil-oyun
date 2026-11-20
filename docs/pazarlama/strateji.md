# Ray: Metro Bulmaca · Pazarlama stratejisi (1.2 ve Google Play lansmanı)

Tarih: 20 Kasım 2026 · Kapsam: 21 Kasım 2026'dan itibaren iOS + organik hazırlık, Google Play lansmanı (L günü, Google onayına bağlı; tahmini 22-28 Kasım) + ilk 4 hafta · Durum: yöneticinin (kullanıcının) 20 Kasım cevaplarına göre güncellendi; kararlar onaya açık.

**Yöneticinin verdiği çerçeve (20 Kasım):**

- Aylık reklam bütçesi **~5.000 TL** (yaklaşık 100-110 $; kur ~46-49 TL/$). Strateji organik ağırlıklı; ücretli yalnız 1-2 kanalda, Türkiye odaklı.
- Öncelikli ülke **Türkiye** (kesin). Öteki ülkeler ucuz yollarla: ASO yerelleştirmesi (9 dil hazır), organik içerik, gerekirse ucuz test pazarı.
- Sosyal: **Instagram** (var), **TikTok** ve **Reddit** (oyuna özel açılacak). YouTube ve X kullanılmayacak.
- İçerik **yalnız oyun görüntüsü**: yüz yok, ses (seslendirme) yok.
- **Oynanabilir reklam** (playable ad) ileride değerlendirilecek.
- 21 Kasım Play'de yalnız üretime erişim başvurusu; Play sayfası Google onayıyla canlı olur (**L günü**, tahmini 22-28 Kasım). Hazır tanıtım videoları: `store/tanitim/` (dal `origin/tanitim`), 34 sn dikey ve 25 sn kare.

Bu belge çatı belgedir. Ayrıntılar ekip dosyalarındadır:

| Dosya | İçerik | Sorumlu rol |
|---|---|---|
| [aso.md](aso.md) | Anahtar kelimeler, başlık/alt başlık, görsel ve A/B testleri (9 dil) | ASO |
| [sosyal-medya-takvimi.md](sosyal-medya-takvimi.md) | Instagram, TikTok, Reddit gönderi takvimi; oyun görüntüsüyle kısa video fikirleri | Sosyal medya |
| [reklam-kampanyasi.md](reklam-kampanyasi.md) | Google App Campaigns ve Apple Search Ads (TR) kurulumu, bütçe bölüşümü | Performans |
| [topluluk-pr.md](topluluk-pr.md) | Basın bülteni, Reddit topluluğu, içerik üreticileri | Topluluk/PR |
| [ilk-48-saat.md](ilk-48-saat.md) | L günü (Play sayfası canlı) ve sonraki 48 saatin kontrol listesi | Herkes, yönetici onaylar |

Not: "(tahmin)" yazan sayılar kamuya açık kaynaklardan ya da sektör deneyiminden çıkarılmış yaklaşık değerlerdir; Ray'in kendi verisi geldikçe değiştirilir.

---

## 1. Yönetici özeti

1. **Fırsat:** Ray iki kanıtlanmış nişin kesişiminde: "karo döndür, devreyi tamamla" bulmacaları (Infinity Loop, Energy, Flow Free; yüz milyonlarca indirme) ve metro/harita tutkunları (Mini Metro). Bu kesişimde ücretsiz, çok dilli ve kural çeşitliliği yüksek bir rakip yok.
2. **Büyümenin motoru organik:** ~5.000 TL/ay ile ayda yalnız birkaç yüz ücretli yükleme alınabilir (tahmin). Bu yüzden ağırlık ASO (9 dil), Instagram/TikTok kısa oyun videoları, Reddit ve Türk basını üzerindedir. Ücretli kanal, organiği hızlandıran ve ölçüm sağlayan küçük bir destektir. iOS ve organik işler 21 Kasım'da başlar; Android'e özgü işler L gününe (Play sayfası canlı) bağlıdır (§8).
3. **Ücretli kanal: yalnız Türkiye.** Yönetici kararı (20 Kasım, `reklam-kampanyasi.md` ile birleştirildi): 5.000 TL'de **Apple Search Ads TR ~4.100 TL + kazanan organik videoları öne çıkarma ~900 TL**. Google App Campaigns 5.000 TL'ye sığmıyor (öğrenme için günlük bütçe ≈ 50 × hedef CPI, yani tüm bütçe); bütçe ≥ 15.000 TL olursa ya da 2. ayda ASA verisi kötü çıkarsa L gününden sonra açılır. Meta ve TikTok reklam kampanyası yok.

> **Not (yönetici):** Aşağıdaki §7 tablosunda ve K2'de geçen "Google %60 / ASA %40" bölüşümü ilk taslaktır; geçerli bölüşüm yukarıdaki maddedir. Ayrıntı: [reklam-kampanyasi.md](reklam-kampanyasi.md) §3.
4. **Ülke önceliği:** Türkiye tek ücretli pazar. İngilizce pazarlar, Almanca/İspanyolca/Portekizce/Fransızca ve Japonca/Korece/Çince pazarlar ASO yerelleştirmesi ve organik içerikle (İngilizce Reddit/TikTok) beslenir; para harcanmaz.
5. **Gerçekçi hedef:** 4 haftada iki mağazada toplam ~1.500-2.000 yükleme (tahmin), D1 tutma ≥ %32, `tutorial_complete` ≥ %70, puan ≥ 4,5. Bu ilk ayın asıl işi **öğrenmek**: hangi video tutuyor, hangi kelime getiriyor, oyuncu nerede bırakıyor.
6. **Ölçüm sınırı bilinmeli:** Firebase'e AB/AEA, BK ve İsviçre'den olay gelmiyor (rıza mimarisi, YAYIN §5.4) ve reklam kimliği ölçüme girmiyor. Türkiye bundan etkilenmediği için ücretli kanalın TR'de olması ölçümü de kolaylaştırıyor.
7. **Uyum çizgisi:** 13+ yaş (reklam hedefi 18+), yanıltıcı reklam yok (yalnız gerçek oynanış), satışta baskı dili yok. "Yüzsüz/sessiz, yalnız oyun" içerik kuralı bu ilkeyle doğal olarak örtüşür.

---

## 2. Pazar ve rakip analizi

### 2.1 Pazar özeti

- Bulmaca, mobil oyunlarda en büyük indirme türlerinden biridir; reklam + IAP karma modeli baskındır. Android'de kurulum maliyeti iOS'tan belirgin düşüktür ([Liftoff 2025 Casual Gaming Report özeti](https://liftoff.ai/?p=35032); [Singular Q4 2025](https://www.singular.net/quarterly-report-2025-q4/)).
- Bulmaca türü tutmada güçlüdür; GameAnalytics Q1 2024 verisinde D7 tutmada türler arasında en üstteydi ([GameAnalytics Q1'24 özeti](https://gamedevreports.substack.com/p/gameanalytics-benchmarks-in-mobile)).
- Türkiye mobil oyun pazarı 2025'te en iyi yılını geçirdi; ama TL'nin değer kaybı (Eylül 2025'te ~41,5, Ekim 2026'da ~49 TL/$) Türkiye'yi dolar bazında düşük ARPU, buna karşılık **ucuz kurulum** pazarı yapıyor ([mobilegamer.biz veri özeti](https://mobilegamer.biz/data-digest-turkiye-us-asia-and-mena-market-stats-pokemon-go-ua-funding-and-more/)). Ray'in fiyatları zaten ABD tabanlı, Türkiye elle (MAGAZA §10.1).

### 2.2 Rakipler

| Oyun | İş modeli / fiyat | İndirme ölçeği | ASO ve büyüme yaklaşımı | Ray'in farkı |
|---|---|---|---|---|
| **Mini Metro** (Dinosaur Polo Club) | Ücretli (mobilde lansmanda ~4 £; PC'de 9,99 $); Apple Arcade / Netflix sürümleri | Tüm platformlarda milyonlarca satış (2017'de 1 milyon+, sonraki haberlerde ~6 milyon); Google Play'de 1-5 milyon+ ([PocketGamer.biz](https://www.pocketgamer.biz/public-transport-puzzler-mini-metro-has-sold-over-a-million-units); [AppGoblin](https://appgoblin.info/apps/nz.co.codepoint.minimetro)) | Ödüller, basın, editör seçkileri, minimal tasarım kimliği; ücretli reklam az (tahmin) | Ray ücretsiz, tek elle ve "çözülebilir bulmaca" (Mini Metro simülasyon/strateji). Metro estetiği ortak; Ray onu rahat bulmaca oyuncusuna taşır. Mini Metro adı Ray'in başlığında ve görselinde kullanılmaz. |
| **Infinity Loop** (Infinity Games) | Ücretsiz; reklam + reklamsız IAP | On milyonlarca (tahmin; doğrulanmadı) | "Relaxing", "anti-stress", "minimal" kelimeleri; sade simge; yan oyunlarla (Energy, Hexa, Shift) çapraz tanıtım | Ray'de 33 kural hattı, ilerleme, şehir haritası, lig ve kapışma var; Infinity Loop saf minimalizm. Ray "sakin ama sıkmayan" konumunda. |
| **Energy: Anti-Stress Loops** (Infinity Games) ve **Net/Pipes** benzerleri (Simon Tatham Puzzles "Net", "Pipe/Plumber" klonları) | Ücretsiz; reklam ağırlıklı; Tatham koleksiyonu reklamsız/açık kaynak | Energy milyonlar düzeyi (tahmin); klonlar dağınık ve küçük | Tür kelimeleri ("pipe", "connect", "loop", "energy"); düşük maliyetli Android UA (tahmin) | Aynı mekanik + metro teması, hat açılış anlatısı, 9 dil. Klonlardan ayrışma: kaliteli görsel, internetsiz, yanıltıcı reklam yok. |
| **Flow Free** (Big Duck Games) | Ücretsiz; reklam + IAP (reklamsız, bölüm paketleri) | Play'de 100 milyon+ ([AppBrain](https://www.appbrain.com/dev/Big+Duck+Games+LLC/)); stüdyo toplamı 300 milyon+ ([Big Duck Games](https://bigduckgames.com)) | Yıllardır üst sıralarda; seri oyunlarla çapraz tanıtım; günlük bulmaca ve zaman modu | Ray'in Günün Hattı + serisi Flow'un günlük bulmacasına denk; ek olarak lig/kapışma ve kural ilerlemesi. Mesaj: "yeni mekanik, aynı rahatlık". |
| **Unblock Me** (Kiragames) | Ücretsiz; reklam + IAP | 2015'te 100 milyon, 2018'de 160 milyon+ (geliştiricinin kendi notu) ([App Store](https://apps.apple.com/app/id315019111)) | Erken App Store avantajı, çok dil, "brain/logic" kelimeleri | Eski ve genel kitle; Ray modern görselli ve temalı. "Beyin oyunu" kelime kümesinde yer almak makul. |

**Çıkarım:** Türün liderleri büyük ölçüde **organik + çapraz tanıtım + uzun ömürlü ASO** ile büyüdü. Ray'in bütçesiyle de en verimli kaldıraç ASO ve oynanış videolarıdır; bu oyunların hiçbiri büyümesini yüz/ses içerikli videoya borçlu değil, oynanışın kendisi "tatmin edici" içeriktir.

---

## 3. Hedef kitle (13+)

| Persona | Kim | Ne arar | Nerede bulunur | Ray'de onu çeken | Ana mesaj |
|---|---|---|---|---|---|
| **A. Sakin bulmacacı Elif** (ana kitle) | 28-45, ofis çalışanı ya da ebeveyn; günde 2-3 kısa seans | Stres atmak, baskısız zorluk | Mağaza aramaları, Instagram Reels | Tek dokunuşla dönen karo, yumuşak ses, zen modu, süre hedefi isteğe bağlı | "Günün sonunda 5 dakika sessizlik." |
| **B. Yolcu Mert** | 22-40, İstanbul/Ankara/İzmir'de metro, Marmaray, metrobüsle işe gider | Tek elle, internetsiz, durakta bırakılıp sürdürülen oyun | Yolda; TikTok, Instagram | İnternetsiz, tek elle, kısa bölümler, Günün Hattı serisi | "Bir durak, bir bölüm." |
| **C. Metro meraklısı Daniel** | 18-45, harita, şehir planlama, tren meraklısı (TR ve yurt dışı) | Metro estetiği, hat mantığı, koleksiyon | Reddit (r/transit, r/TransitDiagrams, r/MiniMetro, r/Turkey), Instagram raylı sistem sayfaları | Şehir metro haritası, hat açılış töreni, tren kaplamaları, ekspres durak/manevra kuralları | "Kendi metro ağını, hat hat kur." |
| **D. Rekabetçi beyin oyuncusu Ayşe** | 16-35, Wordle/Sudoku/Flow oyuncusu, seri tutmayı sever | Günlük meydan okuma, sıralama, arkadaşla kıyas | TikTok, Instagram hikâyeleri, arkadaş önerisi | Günün Hattı + seri, haftalık lig, canlı kapışma, Arkadaşına öner | "Bugünün hattını kaç hamlede bağladın?" |

13+ notu: reklam hedeflemede yaş alt sınırı 18 seçilir (güvenli taraf); içerik 13+ uygun kalır. Çocuklara yönelik dil, karakter ya da kanal kullanılmaz.

---

## 4. Konumlandırma ve mesaj sütunları

**Konumlandırma (tr):** Ray, kısa molalarda zihnini dinlendirmek isteyen yetişkinler için, rayları döndürüp durakları bağladığın tek elle ve internetsiz oynanan sakin bir metro bulmacasıdır; sade döndür-bağla oyunlarından farklı olarak her hat yeni bir kural getirir ve bitirdiğin hatlar şehrini büyütür.

**Positioning (en):** For adults who want a calm break, Ray is a one-handed, offline metro puzzle where you rotate rails to link every station; unlike plain loop puzzles, every line brings a new rule and every finished line grows your city.

| Sütun | Türkçe mesaj | English message | Kanıt (oyun görüntüsünde gösterilir) |
|---|---|---|---|
| 1. Sakinlik | Baskı yok, sadece sen ve raylar. | No pressure. Just you and the rails. | Zen modu, yavaş tempo, yumuşak geçişler |
| 2. Her yerde | Tek elle, internetsiz: metroda, kuyrukta, yatakta. | One hand, no Wi-Fi: on the train, in line, in bed. | Uçak modu simgesi açıkken oynanış kaydı |
| 3. Hep yeni | 33 kural hattı, sonra sonsuz karma. | 33 rule lines, then endless mixes. | Ekspres durak, sinyal, manevra... kural kartları |
| 4. Şehrin büyür | Her hat bitince şehrinde açılış töreni. | Open a new line, light up your city. | Şehir metro haritası, açılış töreni |
| 5. İstersen rekabet | Günün Hattı, haftalık lig, canlı kapışma. | Daily line, weekly league, live duels. | Lig tablosu, kapışma ekranı |

İçerik biçimi: yüz ve seslendirme yok. Videolar = ekran kaydı + kısa metin bindirmesi (9 dilde çevrilebilir) + oyunun kendi sesi ya da telifsiz müzik. Bu, aynı videonun dil değiştirerek bütün pazarlarda kullanılmasını sağlar.

Söylenmeyecekler: "en iyi", "1 numara", oyunda olmayan özellik ya da sahne, "yüzde X oyuncu çözemiyor" türü sahte meydan okuma, sahte indirim.

---

## 5. Ülke önceliği (yöneticinin çerçevesine göre)

Mantık: ücretli bütçe küçük olduğundan yalnız **en ucuz kurulum + en iyi ölçüm + ana dil** üçlüsünün buluştuğu Türkiye'ye harcanır. Öteki pazarlar parasız kaldıraçlarla (ASO, organik, mağaza etkinlikleri) beslenir.

| Tier | Ülkeler | Rol | Neden | Para harcanır mı |
|---|---|---|---|---|
| **Tier 1** | Türkiye | Ana pazar: organik + ücretli | Ana dil, yerli indie hikâyesi, basın erişimi, düşük CPI (tahmin: Android 0,2-0,5 $ ≈ 10-25 TL); Firebase verisi eksiksiz | Evet, bütçenin tamamı |
| **Tier 2** | ABD, BK, Kanada, Avustralya + Almanya, Fransa, İspanya, Brezilya, Meksika | Gelir potansiyeli yüksek ya da dil desteği hazır | İngilizce Reddit/TikTok içeriği ve yerelleştirilmiş ASO buralara doğal erişim sağlar; ABD bulmaca CPI'ı çok yüksek (AppsFlyer: iOS ~9,5 $, Android ~4,8 $) ([AppsFlyer](https://www.appsflyer.com/?p=549948)), bu bütçeyle girilmez | Hayır (yalnız ASO + organik) |
| **Tier 3** | Japonya, Kore, Tayvan/Hong Kong, öteki ülkeler | Uzun vadeli ASO | Dil hazır; yerel topluluk erişimi zor | Hayır |
| **İsteğe bağlı test** | Brezilya, Meksika ya da Filipinler (tek ülke) | Yaratıcı/tutma karşılaştırması | Android CPI çok düşük (tahmin: 0,05-0,2 $); TR sonuçlarını doğrulamak için | 4. haftadan sonra, yönetici isterse bütçenin en çok %15'i |

---

## 6. Ölçülebilir hedefler ve KPI'lar

Hedefler ~5.000 TL/ay bütçeye göre kuruldu. Kaba hesap (tahmin): Google ~3.000 TL ÷ 12-25 TL CPI ≈ 120-250 yükleme; ASA ~2.000 TL ÷ 25-60 TL CPI ≈ 35-80 yükleme. Yani ücretli katkı ayda ~150-330 yükleme (günde ~5-11); geri kalanı organik olmalı.

### 6.1 KPI tablosu

| KPI | Tür ortalaması (tahmin, kaynaklı) | Ray hedefi: lansman haftası (L → L+6) | Ray hedefi: 4. hafta (L+21 → L+27) | Nasıl ölçülür |
|---|---|---|---|---|
| Günlük indirme (iki mağaza toplam) | Takipçisi olmayan yeni indie bulmaca: günde onlarca (tahmin) | Hazırlık evresi (yalnız iOS): ort. 15/gün; L haftası: ort. 40/gün | Ort. 60/gün (L'den 4 haftada toplam ~1.500-2.000) | Play Console › İstatistikler (Kullanıcı edinme); App Store Connect › Analytics › İndirmeler; Firebase `first_open` |
| Mağaza sayfası dönüşümü | Play: ziyaretçi→yükleme ~%25-35; App Store: sayfa görüntüleme→indirme ~%25-40 (tahmin) | Play ≥ %25, App Store ≥ %25 (TR) | Play ≥ %30 (A/B sonrası) | Play Console › Mağaza girişi performansı / Mağaza girişi denemeleri; App Store Connect › Analytics › Dönüşüm oranı |
| CPI (TR) | Casual: iOS ~1,4 $, Android ~0,14 $ ([Liftoff özeti](https://liftoff.ai/?p=35032)); bulmaca ABD çok daha yüksek ([AppsFlyer](https://www.appsflyer.com/?p=549948)) | Google ≤ 25 TL; ASA ≤ 60 TL | Google ≤ 18 TL; ASA ≤ 45 TL | Google Ads ve ASA panoları: harcama ÷ yükleme |
| D1 tutma | Genel medyan ~%22, üst %25 ~%30, üst %10 ~%40 ([GameAnalytics 2025 özeti](https://gamedevreports.substack.com/p/gameanalytics-mobile-gaming-benchmarks)) | ≥ %32 | ≥ %35 | Firebase › Tutma kohortları; Play Console › Kullanıcı tutma; App Store Connect › Analytics › Tutma |
| D7 tutma | Genel medyan ~%3,5-4; üst %10 ~%10 ([GameAnalytics 2025 PDF](https://investgame.net/wp-content/uploads/2025/02/2025-GameAnalytics-Mobile-Gaming-Benchmarks.pdf)); bulmaca ortalamanın üstünde | ≥ %10 (ilk kohort) | ≥ %12 | Aynı |
| D30 tutma | Genel medyan < %1; iyi bulmaca %4-8 (tahmin) | (henüz yok) | ≥ %4 (yalnız lansman kohortu okunabilir) | Aynı |
| `tutorial_complete` oranı | İyi oyunlarda %70-85 (tahmin) | ≥ %70 | ≥ %78 | Firebase › Huniler: `first_open` → `tutorial_begin` → `tutorial_complete` → `level_end` (level=5, 10, 20) |
| ARPDAU (reklam + IAP) | Reklam ağırlıklı bulmaca: Tier 1 Batı 0,08-0,20 $; Türkiye 0,01-0,03 $ (tahmin) | ≥ 0,015 $ | ≥ 0,02 $ | AdMob geliri + Firebase `in_app_purchase` geliri ÷ DAU; Firebase › Gelir; AdMob › Raporlar (ülke kırılımı) |
| ROAS D7 / D30 (yalnız ücretli TR) | Casual'da kâra geçiş 6-12 ay; D7 %8-15, D30 %25-40 sağlıklı (tahmin) | Ölçülmez (örnek çok küçük) | D7 ≥ %5, D30 ≥ %15 (yön göstergesi) | Google Ads (Firebase bağlantılı: `in_app_purchase` + `ad_impression`); ASA panosu + App Store Connect kaynak raporu |

Yardımcı metrikler: puan ortalaması (≥ 4,5), çökmesiz kullanıcı oranı (≥ %99,5), takılma noktaları (`level_quit` hat başına), `offer_shown`→`offer_buy` oranı, ödüllü reklam izleme (`ad_impression` format=rewarded), Günün Hattı serisi (`daily_end.streak`). Organik kanallar için: Instagram/TikTok izlenme ve profil bağlantı tıklaması, Reddit gönderi oy/yorum, mağaza "kaynak" raporunda web yönlendirmeleri.

### 6.2 Ölçüm notları

- **Örnek küçük:** günde ~40-60 yükleme ile haftalık kohort 300-400 kişidir; D1 okunabilir, D7 ve ROAS yalnız yön gösterir. Kararlar en az iki haftalık veriyle verilir.
- **AB/AEA, BK, İsviçre Firebase'de görünmez** (YAYIN §5.4). Bu ülkelerin tutma ve dönüşümü yalnız mağaza konsollarından okunur. Ücretli kanal TR'de olduğu için bu sınır kampanya ölçümünü etkilemez.
- `ad_storage`/`ad_user_data` reddedildiğinden Google Ads'in Firebase üzerinden optimizasyonu sınırlı olabilir; kampanya ilk ayda "yükleme" hedefiyle kurulur (karar K3).
- `purchase` olayında tutar yok; gelir `in_app_purchase` ve mağaza konsollarından okunur.
- Haftalık KPI tablosu her pazartesi doldurulur (Performans rolü); karar yöneticide.

### 6.3 Karar eşikleri

| Durum | Karar |
|---|---|
| D1 ≥ %32, tutorial ≥ %70, CPI hedefte | Bütçe aynı kalır; başarılı yaratıcı/kelimeye kaydırılır. Yönetici isterse 2. ay bütçe artışı ya da tek ucuz test ülkesi |
| D1 %25-32 | Bütçe aynı; ürün tarafında öğretici ve ilk 20 bölüm iyileştirmesi önerilir (oyun kodu ayrı oturumda) |
| D1 < %25 ya da tutorial < %60 | Ücretli durdurulur; para, sorun düzelene kadar biriktirilir |
| CPI hedefin 2 katı (2 hafta üst üste) | Kanalın payı diğerine kaydırılır ya da yaratıcı/kelime değişir |

---

## 7. Kanal karışımı

### 7.1 Organik (ağırlık burada)

1. **ASO (en yüksek öncelik, 9 dil):** Play lansmanına hazır başlık, kısa açıklama, ekran görüntüleri ve tanıtım videosu (`store/tanitim/` 34 sn dikeyden kesilmiş, yalnız oyun görüntüsü). Mağaza metninde "24 hat" geçen yerler 1.2 ile "33 kural hattı" diye güncellenmeli (MAGAZA §4). Play "Mağaza girişi denemeleri" ve App Store "Ürün sayfası optimizasyonu" ile A/B. Türkiye dışı pazarların ana kaldıracı budur. Ayrıntı: [aso.md](aso.md).
2. **Mağaza etkinlikleri (ücretsiz görünürlük):** Play Console "Promosyon içeriği/Etkinlikler" ve App Store "Uygulama İçi Etkinlikler" ile "Haftalık lig" ve "7 yeni hat" etkinlikleri; iki mağazanın editör ekiplerine indie öne çıkarma başvurusu.
3. **Instagram (var olan hesap) ve TikTok (yeni, oyuna özel):** Yüzsüz, sessiz (seslendirmesiz) kısa videolar: "son karo döner, şehir yanar" tatmin anı, kural tanıtımları, Günün Hattı meydan okuması, "çözebilir misin?" (gerçek bölüm), hız çözümü. Haftada 3-4 video, aynı kurgu iki platformda; TR metinli ana seri + EN metinli kopya. Başlangıç malzemesi hazır: `store/tanitim/` 34 sn dikey (Reels/TikTok) ve 25 sn kare (Instagram akışı, Reddit). Ayrıntı: [sosyal-medya-takvimi.md](sosyal-medya-takvimi.md).
4. **Reddit (yeni, oyuna özel hesap):** İngilizce erişimin ücretsiz yolu. r/IndieGaming, r/AndroidGaming, r/iosgaming, r/puzzles, r/transit, r/MiniMetro (kurallarına uygun, kendini tanıtım sınırlarına dikkat), r/Turkey ve r/KGBTR gibi TR alt forumları yalnız kurallar izin veriyorsa. Geliştirici günlüğü dili, satış dili değil.
5. **PR:** Türk teknoloji/oyun basını ve bloglar (tek kişilik yerli indie hikâyesi, Play lansmanı), yabancı mobil oyun siteleri (TouchArcade, Pocket Gamer), oyun görüntüsü kullanan küçük içerik üreticileri. Ayrıntı: [topluluk-pr.md](topluluk-pr.md).
6. **Oyun içi:** 1.2'deki "Arkadaşına öner" ve canlı kapışma davetleri; Günün Hattı sonucunu paylaşma (oyunda varsa).

Kullanılmayanlar: YouTube kanalı ve X hesabı (yönetici kararı). Not: Google App Campaigns reklamları YouTube envanterinde kendiliğinden gösterilebilir; bu bir kanal hesabı değildir, sorun yaratmaz.

### 7.2 Ücretli (~5.000 TL/ay, yalnız Türkiye)

| Öncelik | Kanal | Pay | Aylık (yaklaşık) | Neden | Kurulum özeti |
|---|---|---|---|---|---|
| 1 | **Google App Campaigns (Android)** | ~%60 | ~3.000 TL (~100 TL/gün) | Play lansmanı; Android TR CPI en düşük; Play arama + YouTube + AdMob ağı tek kampanyada; Firebase bağlantısı | Hedef "yükleme" (ilk ay hedef CPI vermeden, ya da gevşek tCPI); varlıklar: `store/tanitim/` dikey ve kare videolar, ekran görüntüleri, TR metinler; **L gününde** yayına alınır |
| 2 | **Apple Search Ads (iOS)** | ~%40 | ~2.000 TL (~65 TL/gün; 21 Kasım'dan) | iOS zaten yayında; arama niyeti yüksek, harcama kontrolü kolay; marka koruması | TR mağazası; marka ("ray", "ray metro") + tür kelimeleri ("metro oyunu", "bulmaca", "zeka oyunu"); Arama sonuçları yerleşimi |

Notlar:
- Günlük ~100 TL Google için düşük bir bütçedir; öğrenme dönemi yavaş geçer. İlk 2 hafta kampanya sık değiştirilmez.
- ASA'nın Türkiye mağazasında açık olduğu kurulumda doğrulanır; değilse pay Google'a kayar.
- Meta ve TikTok **reklamı** bu bütçede açılmaz (bütçe iki kanala bölünürse hiçbirinde öğrenme olmaz). TikTok'ta organik bir video çok iyi giderse 2. ayda Spark Ads denemesi yöneticiye önerilir.
- **Oynanabilir reklam (ileride):** Oyunun web (PWA) sürümünden 15-30 sn'lik tek bölümlük bir HTML5 oynanabilir reklam çıkarılabilir; Google App Campaigns HTML5 varlık kabul eder (AdMob ağında), Unity/AppLovin ağları da kullanır. Gerçek oynanış olduğu için yanıltıcı reklam riski düşüktür. Ayrı bir iş olarak 2. ayda değerlendirilir (karar K6).

Ayrıntılı kampanya yapısı: [reklam-kampanyasi.md](reklam-kampanyasi.md).

---

## 8. Zaman çizelgesi

Roller: **ASO**, **Sosyal** (Instagram/TikTok/Reddit), **Perf** (performans/ücretli), **T/PR** (topluluk/PR), **Yön** (yönetici = kullanıcı; onay ve geliştirici işleri). Tek kişilik ekipte rollerin çoğu aynı kişide toplanır; tablo işin türünü ayırmak içindir.

**Esnek takvim mantığı:** 21 Kasım Google Play'de yalnız **üretime erişim başvurusu** günüdür. Play sayfası Google onayından sonra canlı olur (tahmini 22-28 Kasım). Bu yüzden takvim iki parçadır:

- **Hazırlık evresi (21 Kasım → L-1):** iOS zaten yayında; iOS ücretli (ASA), organik içerik, ASO ve basın hazırlığı **hemen başlar**. "Android'e geldi" duyurusu, Google kampanyası ve Play'e özgü işler bekletilir.
- **L günü = Play sayfasının canlı olduğu gün.** Android'e özgü bütün adımlar L'ye göre kayar (L, L+1, ... L+6). Onay gecikirse hazırlık evresi uzar, başka hiçbir şey değişmez. Onay erken gelirse (ör. 22 Kasım) hazırlık evresinin bitmemiş satırları L haftasıyla birlikte yürür; öncelik L günü satırlarındadır.

Hazır varlıklar: tanıtım videoları `store/tanitim/` (dal `origin/tanitim`): **34 sn dikey** (Reels, TikTok, Google App Campaigns dikey varlık, Play/App Store önizlemesi için kesilebilir) ve **25 sn kare** (Instagram akışı, Reddit, Google kare varlık). İkisi de yalnız oyun görüntüsü olduğundan "yüz/ses yok" kuralına uyar. Kısa kesitler (6-15 sn) bu iki videodan çıkarılır.

### 8.1 Hazırlık evresi (21 Kasım → L-1)

| Gün | Adım | Sorumlu |
|---|---|---|
| **Cum 21 Kas** | Play üretime erişim başvurusu; Play mağaza girişinin 9 dilde ve IAP fiyatlarının (ABD 2,99 $, TR ₺59,99) hazır olduğunu doğrula | Yön, ASO |
| | ASA (TR, iOS) aç: marka + tür kelimeleri, ~65 TL/gün | Perf, Yön onayı |
| | TikTok ve Reddit hesaplarını oyuna özel aç; Instagram profil bağlantısını App Store'a ver (Play bağlantısı L'de eklenir) | Sosyal |
| | 1.2 duyurusu (iOS): 34 sn dikey video, TR metin, Instagram + TikTok | Sosyal |
| **Cmt 22 Kas** | Reddit'te katkı/tanışma (yorumlar, kurallar okunur; tanıtım gönderisi henüz yok) | T/PR |
| | 25 sn kare video Instagram akışına; EN metinli kopya TikTok'a | Sosyal |
| | App Store "Uygulama İçi Etkinlik": Haftalık lig | ASO |
| **Paz 23 Kas → L-1** | Her gün: App Store yorumlarına yanıt, Firebase'de iOS olay akışı (`first_open`, `tutorial_begin/complete`, `level_end`, `ad_impression`) | T/PR, Perf |
| | Gün aşırı bir kısa video (kural tanıtımı #1 Ekspres durak, #2 Manevra, Günün Hattı "çözebilir misin?") | Sosyal |
| | Basın bülteni (TR + EN) son hali, basın listesi; "Android'de" cümlesi tarih olmadan, L günü gönderilmeye hazır | T/PR |
| | Google App Campaign taslağı (TR, Android, ~100 TL/gün): dikey ve kare videolar, ekran görüntüleri, TR metinler yüklenir, **yayına alınmaz** | Perf |
| | App Store ürün sayfası A/B #1 (ilk ekran görüntüsü) başlat | ASO |
| **Pzt 24 Kas** (L henüz gelmediyse) | Haftalık KPI tablosunun ilk doldurulması (yalnız iOS: ASA CPI, D1, tutorial) | Perf |

### 8.2 Lansman haftası (L → L+6)

| Gün | Adım | Sorumlu |
|---|---|---|
| **L** (Play canlı) | Play sayfasını 9 dilde kontrol et, test cihazda indir, IAP ve reklam çalışıyor mu | Yön, ASO |
| | Google App Campaign'i yayına al; Firebase–Google Ads bağlantısını doğrula | Perf, Yön onayı |
| | "Android'e geldi" duyurusu: 34 sn dikey (Instagram + TikTok), Play + App Store bağlantıları; profil bağlantıları güncellenir | Sosyal |
| | Reddit ilk tanıtım gönderisi (r/AndroidGaming ya da r/IndieGaming, geliştirici notu + 25 sn kare video) | T/PR |
| | Basın bültenini TR basına gönder | T/PR |
| | [ilk-48-saat.md](ilk-48-saat.md) kontrol listesini başlat | Herkes |
| **L+1** | Android olay akışı ve çökme raporu (Play Console › Android vitals); Play yorumlarına 24 saat içinde yanıt | Perf, T/PR |
| | Kısa kesit video (6-15 sn, "son karo, şehir yanar") | Sosyal |
| **L+2** | İlk 48 saat değerlendirmesi: çökme, puan, ilk D1, mağaza dönüşümü; "devam / düzelt" kararı | Yön, Perf |
| | Play "Promosyon içeriği/Etkinlik": Haftalık lig | ASO, Yön onayı |
| **L+3** | Play Mağaza girişi denemesi #1 (ilk ekran görüntüsü ya da simge) | ASO |
| | Yabancı mobil oyun sitelerine (EN) kısa tanıtım e-postası | T/PR |
| **L+4** | Video: yeni kural tanıtımı + Günün Hattı meydan okuması | Sosyal |
| | Reddit yorumlarına yanıt; geri bildirim listesi | T/PR |
| **L+5** | Google varlık raporu (zayıf video/görseli değiştir); ASA arama terimi raporundan kelime ekle/çıkar | Perf |
| **L+6** | Hafta değerlendirmesi: KPI'lar §6.3 eşiklerine göre; sonraki hafta planı; anahtar kelime sıralama ilk okuması (TR/EN) | Yön, herkes, ASO |

### 8.3 Sonraki 4 hafta (L'ye göre)

| Hafta | Odak | Adımlar | Sorumlu |
|---|---|---|---|
| **1. hafta (L → L+6)** | Lansman | §8.2 | Herkes |
| **2. hafta (L+7 → L+13)** | Öğren ve düzelt | D7 ilk okuma; öğretici hunisinde düşüş adımını bul, yöneticiye bildir; en iyi giden video türünü 2 kat üret; Reddit'te ikinci alt forum (r/puzzles ya da r/transit, şehir haritası görseli); ASO kelime turu #2 (TR + EN) | Perf, Sosyal, T/PR, ASO, Yön |
| **3. hafta (L+14 → L+20)** | Yerelleştirme ve PR | 9 dilde ASO kelime/ekran metni gözden geçirmesi (DE/ES/pt-BR/FR/JA/KO/zh-Hant); tanıtım videolarının metin bindirmesini dillere uyarlama; içerik üreticisi işbirliği (reklamsız kod karşılığı, küçük TR hesaplar); Play Mağaza girişi denemesi #2 (kısa açıklama); bütçe kaydırma kararı (Google ↔ ASA) | ASO, Sosyal, T/PR, Perf, Yön |
| **4. hafta (L+21 → L+27)** | Yıl sonu ve 2. ay planı | Kış teması/yıl sonu ligi etkinliği (oyunda varsa; yoksa öneri); D30 için ilk kohortu izle; ay sonu raporu; 2. ay kararları: bütçe, tek ucuz test ülkesi, oynanabilir reklam, TikTok Spark Ads | ASO, Sosyal, Perf, Yön |

Not: L 22-28 Kasım arasına düşerse 4. hafta Aralık ortası-sonuna gelir. Bu haftalarda reklam fiyatları tatil sezonu nedeniyle yükselir (tahmin); küçük bütçede CPI hedefi gevşek okunur. Aylık bütçe (5.000 TL) hazırlık evresinde yalnız ASA'ya harcandığından Google payı L'den itibaren 30 güne yayılır.

---

## 9. Riskler ve karar noktaları

### 9.1 Riskler

| Risk | Etki | Önlem |
|---|---|---|
| Bütçe küçük, organik tutmazsa büyüme durur | İndirme hedefi kaçar | Organik içeriği haftalık ritme bağla; ASO'yu her hafta iyileştir; editör/etkinlik başvuruları |
| Düşük tutma (öğretici sonrası terk) | Ücretli para boşa gider | §6.3 eşikleri; huni analizi; ilk 20 bölüm zorluk eğrisi |
| Küçük örnekle yanlış karar | Yanlış kanal/kelime kesilir | En az 2 haftalık veri; konsol + Firebase çapraz kontrol |
| Google'da düşük günlük bütçeyle öğrenme olmaması | Yüksek CPI, dağınık yayın | Kampanyayı 2 hafta değiştirmeden bırak; tek kampanya, az varlık grubu |
| Yeni TikTok/Reddit hesaplarının erişiminin düşük olması | Organik etki gecikir | Reddit'te önce katkı, sonra tanıtım; TikTok'ta tutarlı seri formatı |
| Reddit kendini tanıtma kuralları | Gönderi silinmesi, yasak | Her alt forumun kuralını oku; ayda bir tanıtım; geliştirici günlüğü dili |
| Yüzsüz/sessiz içerikte duygu eksikliği | Düşük izlenme | Güçlü ilk 1 saniye (şehrin yanma anı), metin bindirmesi, ritimli müzik |
| Klon algısı ("bir başka loop oyunu") | Dönüşüm ve basın ilgisi düşer | Metro teması, 33 kural ve şehir haritasını öne çıkar |
| TL kuru ve düşük TR ARPDAU | Ücretli TR geri dönüşü yavaş | Kabul edilen risk: ilk ayın amacı öğrenmek; gelir Tier 2 organikten beklenir |
| Mağaza metninde eski bilgi ("24 hat") | Tutarsızlık, güven kaybı | 1.2 ile mağaza metnini güncelle ([aso.md](aso.md)) |

### 9.2 Mağaza politikalarına uyum

- **Yanıltıcı reklam yok:** Reklam ve mağaza görselleri yalnız gerçek oynanışı gösterir (store-shots aracı gerçek oyundan üretir). Oyunda olmayan mekanik, sahte "başaramazsın" kurgusu, sahte arayüz, sahte ödül vaadi yok (Google Play "Yanıltıcı reklamlar" politikası, Apple İnceleme Kuralları 2.3 "Doğru meta veri"). Oynanabilir reklam da yalnız oyundaki gerçek bir bölümü kullanır.
- **13+ yaş:** Kampanyalarda yaş hedefi en az 18; çocuk kanalı, çocuk karakteri, "çocuk/aile" kelimesi kullanılmaz; Play "Aileler" programına girilmez.
- **Satış dili:** Üstü çizili fiyat, geri sayım, "son şans" yok (MAGAZA §10.3 ile aynı ilke). Reklamda fiyat söylenirse mağaza fiyatıyla aynı olur.
- **Rakip markalar:** Mini Metro, Flow Free gibi adlar başlıkta, alt başlıkta, görselde, reklam metninde kullanılmaz (ASA'da rakip kelimeye teklif: karar K5).
- **Yorum ve puan:** Teşvikli yorum yok; puan isteği yalnız oyunun mevcut in-app review akışıyla. İçerik üreticisine verilen reklamsız kod karşılığında olumlu yorum şartı konmaz; işbirliği gönderisi "iş birliği" diye etiketlenir.
- **Gizlilik:** Reklam kampanyalarına kişisel veri (müşteri listesi) yüklenmez; gizlilik politikası bağlantısı mağazada canlı olmalı.

### 9.3 Karar noktaları (yöneticiye)

| # | Karar | Durum / ne zaman | Seçenekler |
|---|---|---|---|
| K1 | Aylık bütçe | **Verildi:** ~5.000 TL/ay, TR | 2. ayda yeniden bakılır |
| K2 | Bütçe bölüşümü (geçerli: ASA ~4.100 TL + öne çıkarma ~900 TL; Google yalnız bütçe ≥ 15.000 TL'de — ilk taslak Google %60 / ASA %40 idi) | 21 Kas onayı (ASA hemen, Google L'de) | Önerildiği gibi / yalnız Google / yalnız ASA |
| K3 | Google Ads dönüşüm ölçümü için rıza ayarı (`ad_user_data`) gözden geçirilsin mi | 2. hafta | Mevcut haliyle (gizlilik öncelikli) / rıza veren kullanıcıda açmak (oyun kodu değişikliği, ayrı oturum) |
| K4 | Ürün düzeltmesi önceliği (tutma eşiği tutmazsa) | 2. hafta sonu | Öğretici / ilk 20 bölüm / ikisi |
| K5 | ASA'da rakip marka kelimelerine teklif | 2. hafta | Evet (yalnız kelime, metinde ad yok) / hayır |
| K6 | Oynanabilir reklam üretimi | 4. hafta (2. ay planı) | Web sürümünden tek bölüm / bekle |
| K7 | Discord sunucusu (lig/kapışma rakip bulma) | 3. hafta | Aç / Reddit yeter |
| K8 | 2. ay: tek ucuz test ülkesi ya da TikTok Spark Ads | 4. hafta | Brezilya/Meksika testi / Spark Ads / ikisi de hayır |

---

Kaynaklar (seçme): [PocketGamer.biz · Mini Metro](https://www.pocketgamer.biz/public-transport-puzzler-mini-metro-has-sold-over-a-million-units) · [AppGoblin · Mini Metro](https://appgoblin.info/apps/nz.co.codepoint.minimetro) · [Big Duck Games](https://bigduckgames.com) · [AppBrain · Big Duck Games](https://www.appbrain.com/dev/Big+Duck+Games+LLC/) · [App Store · Unblock Me](https://apps.apple.com/app/id315019111) · [GameAnalytics 2025 Benchmarks (PDF)](https://investgame.net/wp-content/uploads/2025/02/2025-GameAnalytics-Mobile-Gaming-Benchmarks.pdf) · [GameAnalytics 2025 özeti](https://gamedevreports.substack.com/p/gameanalytics-mobile-gaming-benchmarks) · [GameAnalytics Q1'24](https://gamedevreports.substack.com/p/gameanalytics-benchmarks-in-mobile) · [Liftoff 2025 Casual Gaming](https://liftoff.ai/?p=35032) · [AppsFlyer oyun benchmarkları](https://www.appsflyer.com/?p=549948) · [Singular Q4 2025](https://www.singular.net/quarterly-report-2025-q4/) · [mobilegamer.biz · Türkiye](https://mobilegamer.biz/data-digest-turkiye-us-asia-and-mena-market-stats-pokemon-go-ua-funding-and-more/)
