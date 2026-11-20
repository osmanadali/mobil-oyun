# Ray: Metro Bulmaca · Pazarlama stratejisi (1.2 ve Google Play lansmanı)

Tarih: 20 Kasım 2026 · Kapsam: 21 Kasım 2026 Google Play lansmanı + ilk 4 hafta · Durum: taslak, yönetici (kullanıcı) onayına açık.

Bu belge çatı belgedir. Ayrıntılar ekip dosyalarındadır:

| Dosya | İçerik | Sorumlu rol |
|---|---|---|
| [aso.md](aso.md) | Anahtar kelimeler, başlık/alt başlık, görsel ve A/B testleri | ASO |
| [sosyal-medya-takvimi.md](sosyal-medya-takvimi.md) | Gönderi takvimi, kısa video fikirleri, kanallar | Sosyal medya |
| [reklam-kampanyasi.md](reklam-kampanyasi.md) | Apple Search Ads, Google App Campaigns, Meta, TikTok kurulumu | Performans |
| [topluluk-pr.md](topluluk-pr.md) | Basın bülteni, Reddit/Discord, içerik üreticileri | Topluluk/PR |
| [ilk-48-saat.md](ilk-48-saat.md) | Lansman anının adım adım kontrol listesi | Herkes, yönetici onaylar |

Not: "(tahmin)" yazan sayılar kamuya açık kaynaklardan ya da sektör deneyiminden çıkarılmış yaklaşık değerlerdir; Ray'in kendi verisi geldikçe değiştirilir.

---

## 1. Yönetici özeti

1. **Fırsat:** Ray, iki kanıtlanmış nişin kesiştiği yerde duruyor: "karo döndür, devreyi tamamla" bulmacaları (Infinity Loop, Energy, Flow Free; yüz milyonlarca indirme) ve metro/harita tutkunları (Mini Metro). Bu kesişimde ücretsiz, çok dilli ve kural çeşitliliği yüksek bir rakip yok.
2. **Lansmanın ağırlığı organik:** Google Play lansmanı ve 1.2 güncellemesi (öğretici, haftalık lig, canlı kapışma, 7 yeni hat, şehir haritası) ASO, "Yeni sürüm" sayfaları, sosyal kısa video ve topluluk ile duyurulur. Ücretli kanal ilk hafta yalnız küçük **test** bütçesiyle açılır.
3. **Ücretli kanalda sıra:** önce niyeti yüksek ve ölçümü temiz olan Apple Search Ads ve Google App Campaigns (ucuz test pazarlarında), sonra yaratıcı testi için TikTok ve Meta. Bütçe rakamı yöneticiye sorulacak; burada yalnız oran önerisi var.
4. **Ülke önceliği:** Türkiye (ana pazar, dil ve topluluk avantajı) + İngilizce pazarlar (ABD, BK, Kanada, Avustralya; gelirin ağırlığı) + ucuz test pazarları (Brezilya, Meksika, Filipinler vb.) ile yaratıcı ve tutma testi. Japonya ve Kore 2. dalga.
5. **Ana metrik tutma:** Ücretli büyümeyi açma kararı D1 tutma ≥ %35, D7 ≥ %12 ve `tutorial_complete` oranı ≥ %70 eşiklerine bağlanır. Bunlar tutmazsa para önce ürüne (öğretici, ilk 20 bölüm) gider.
6. **Ölçüm sınırı bilinmeli:** Firebase'e AB/AEA, BK ve İsviçre'den olay gelmiyor (rıza mimarisi, YAYIN §5.4) ve reklam kimliği ölçüme girmiyor. Bu yüzden KPI'lar mağaza konsolları + Firebase birlikte okunur; ROAS ölçümü ilk ayda kaba kalır.
7. **Uyum çizgisi:** 13+ yaş, yanıltıcı reklam yok (oynanışı gerçek ekran kaydıyla göster, "sahte oyun" kurgusu yok), satışta baskı dili yok. Bu hem politika zorunluluğu hem de "sakin" marka vaadinin parçası.

---

## 2. Pazar ve rakip analizi

### 2.1 Pazar özeti

- Bulmaca, mobil oyunlarda en büyük indirme türlerinden biridir; reklam + IAP karma modeli baskındır. Android'de kurulum maliyeti iOS'tan belirgin düşüktür ([Liftoff 2025 Casual Gaming Report özeti](https://liftoff.ai/?p=35032); [Singular Q4 2025](https://www.singular.net/quarterly-report-2025-q4/)).
- Bulmaca türü, tutma açısından güçlü türlerden biridir; GameAnalytics Q1 2024 verisinde D7 tutmada türler arasında en üstteydi ([GameAnalytics Q1'24 özeti](https://gamedevreports.substack.com/p/gameanalytics-benchmarks-in-mobile)).
- Türkiye mobil oyun pazarı 2025'te en iyi yılını geçirdi, ama TL'nin değer kaybı dolar bazlı gelirde Türkiye'yi düşük ARPU pazarı yapıyor ([mobilegamer.biz veri özeti](https://mobilegamer.biz/data-digest-turkiye-us-asia-and-mena-market-stats-pokemon-go-ua-funding-and-more/)). Ray'in fiyatlandırması bu yüzden zaten ABD tabanlı (MAGAZA §10.1).

### 2.2 Rakipler

| Oyun | İş modeli / fiyat | İndirme ölçeği | ASO ve büyüme yaklaşımı | Ray'in farkı |
|---|---|---|---|---|
| **Mini Metro** (Dinosaur Polo Club) | Ücretli (mobilde lansmanda ~4 £; PC'de 9,99 $) ve Apple Arcade / Netflix sürümleri | Tüm platformlarda milyonlarca satış (1 milyon+ 2017; sonraki haberlerde ~6 milyon); Google Play'de 1-5 milyon+ ([PocketGamer.biz](https://www.pocketgamer.biz/public-transport-puzzler-mini-metro-has-sold-over-a-million-units); [AppGoblin](https://appgoblin.info/apps/nz.co.codepoint.minimetro)) | Ödüller, basın, editör seçkileri, minimal tasarım kimliği; ücretli reklam az (tahmin) | Ray ücretsiz, tek elle ve "çözülebilir bulmaca" (Mini Metro simülasyon/strateji). Metro estetiği ortak; Ray onu "rahat bulmaca" oyuncusuna taşır. Mini Metro arama hacmi ASO'da yan anahtar kelime olarak kullanılabilir, ama ad/marka kopyalanmaz. |
| **Infinity Loop** (Infinity Games) | Ücretsiz; reklam + reklamsız IAP | On milyonlarca (tahmin; Play'de 10 milyon+ düzeyi, doğrulanmadı) | "Relaxing", "anti-stress", "minimal" anahtar kelimeleri; sade simge; çok sayıda yan oyun (Energy, Hexa, Shift) ile çapraz tanıtım | Ray'de kural çeşitliliği (33 kural hattı), ilerleme, şehir haritası, lig ve kapışma var; Infinity Loop ise saf minimalizm. Ray "sakin ama sıkmayan" konumunda. |
| **Energy: Anti-Stress Loops** (Infinity Games) ve **Net/Pipes türü** benzerleri (Simon Tatham Puzzles "Net", çeşitli "Pipe/Plumber" klonları) | Ücretsiz; reklam ağırlıklı; Tatham koleksiyonu reklamsız/açık kaynak | Energy milyonlar düzeyi (tahmin); klonlar dağınık, tek tek küçük | Tür adı anahtar kelimeleri ("pipe", "connect", "loop", "energy"); düşük maliyetli Android UA (tahmin) | Ray aynı mekaniği tema (metro), anlatı (hat açılışı, şehir) ve 9 dil ile paketliyor. Klonlardan ayrışma: kaliteli görsel, internetsiz, yanıltıcı reklam yok. |
| **Flow Free** (Big Duck Games) | Ücretsiz; reklam + IAP (reklamsız, bölüm paketleri) | Play'de 100 milyon+ ([AppBrain](https://www.appbrain.com/dev/Big+Duck+Games+LLC/)); stüdyo toplamı 300 milyon+ ([Big Duck Games](https://bigduckgames.com)) | Yıllardır üst sıralarda; seri (Bridges, Hexes, Warps) ile çapraz tanıtım; "günlük bulmaca" ve zaman modu ile tutma | Ray'in Günün Hattı + seri sistemi Flow'un günlük bulmacasına denk; Ray'de ek olarak lig/kapışma ve kural ilerlemesi var. Hedef: Flow oyuncusuna "yeni mekanik, aynı rahatlık". |
| **Unblock Me** (Kiragames) | Ücretsiz; reklam + IAP | 2015'te 100 milyon, 2018'de 160 milyon+ (geliştiricinin kendi notu) ([App Store](https://apps.apple.com/app/id315019111)) | Erken App Store dönemi avantajı, çok dil, "brain/logic" anahtar kelimeleri | Eski ve genel kitle; Ray daha modern görsel ve temalı. "Beyin oyunu" kelime kümesinde Ray'in yer alması makul. |

**Çıkarım:** Türün liderleri büyük ölçüde **organik + çapraz tanıtım + uzun ömürlü ASO** ile büyüdü. Tek geliştiricili Ray'in en verimli kaldıracı da ASO ve yaratıcı kısa videodur; ücretli UA ancak tutma kanıtlanınca ölçeklenir.

---

## 3. Hedef kitle (13+)

| Persona | Kim | Ne arar | Nerede bulunur | Ray'de onu çeken | Ana mesaj |
|---|---|---|---|---|---|
| **A. Sakin bulmacacı Elif** (ana kitle) | 28-45, ofis çalışanı ya da ebeveyn; günde 2-3 kısa seans | Stres atmak, zihni dinlendirmek, baskısız zorluk | App Store/Play aramaları, Instagram Reels, Pinterest | Tek dokunuşla dönen karo, yumuşak ses, zen modu, süre baskısı isteğe bağlı | "Günün sonunda 5 dakika sessizlik." |
| **B. Yolcu Mert** | 22-40, toplu taşımayla işe gider (İstanbul, Londra, New York, São Paulo) | Tek elle, internetsiz oynanan, durakta bırakılıp kaldığı yerden sürdürülen oyun | Metro/otobüste; TikTok, YouTube Shorts | İnternetsiz, tek elle, kısa bölümler, Günün Hattı serisi | "Bir durak, bir bölüm." |
| **C. Metro meraklısı Daniel** | 18-45, harita, şehir planlama, tren meraklısı | Gerçekçi metro estetiği, hat mantığı, koleksiyon | Reddit (r/transit, r/TransitDiagrams, r/MiniMetro), YouTube | Şehir metro haritası, hat açılış töreni, tren kaplamaları, ekspres durak/manevra gibi demiryolu kuralları | "Kendi metro ağını, hat hat kur." |
| **D. Rekabetçi beyin oyuncusu Ayşe** | 16-35, Wordle/Sudoku/Flow oyuncusu, seri tutmayı sever | Günlük meydan okuma, sıralama, arkadaşla kıyas | Twitter/X, Discord, arkadaş önerisi | Günün Hattı + seri, haftalık lig, canlı kapışma | "Bugünün hattını kaç hamlede bağladın?" |

13+ notu: reklam hedeflemede yaş alt sınırı 18 seçilir (ücretli kanallarda güvenli taraf); içerik 13+ uygun kalır. Çocuklara yönelik dil, karakter ya da kanal kullanılmaz.

---

## 4. Konumlandırma ve mesaj sütunları

**Konumlandırma (tr):** Ray, kısa molalarda zihnini dinlendirmek isteyen yetişkinler için, rayları döndürüp durakları bağladığın tek elle ve internetsiz oynanan sakin bir metro bulmacasıdır; sade döndür-bağla oyunlarından farklı olarak her hat yeni bir kural getirir ve bitirdiğin hatlar şehrini büyütür.

**Positioning (en):** For adults who want a calm break, Ray is a one-handed, offline metro puzzle where you rotate rails to link every station; unlike plain loop puzzles, every line brings a new rule and every finished line grows your city.

| Sütun | Türkçe mesaj | English message | Kanıt (oyunda) |
|---|---|---|---|
| 1. Sakinlik | Baskı yok, sadece sen ve raylar. | No pressure. Just you and the rails. | Zen modu, yumuşak ses, süre hedefi isteğe bağlı |
| 2. Her yerde | Tek elle, internetsiz: metroda, kuyrukta, yatakta. | One hand, no Wi-Fi: on the train, in line, in bed. | Çevrimdışı oyun, dikey tek el düzeni |
| 3. Hep yeni | 33 kural hattı, sonra sonsuz karma. | 33 rule lines, then endless mixes. | Ekspres durak, sinyal, manevra... |
| 4. Şehrin büyür | Her hat bitince şehrinde açılış töreni. | Open a new line, light up your city. | Şehir metro haritası |
| 5. İstersen rekabet | Günün Hattı, haftalık lig, canlı kapışma. | Daily line, weekly league, live duels. | 1.2 sosyal özellikleri |

Söylenmeyecekler: "en iyi", "1 numara", gerçekte olmayan özellik, oyunda olmayan sahne, "yüzde X oyuncu çözemiyor" türü sahte meydan okuma, sahte indirim.

---

## 5. Ülke önceliği önerisi (yöneticinin seçimine açık)

Mantık: gelir ≈ (oyuncu sayısı) × (ARPDAU), maliyet ≈ CPI. Yüksek CPI'lı ülkede ancak tutma ve ARPDAU kanıtlanınca ödeme yapılır; ucuz ülkeler yaratıcı ve tutma testi içindir. Türkiye ana pazar: dil, topluluk ve basın erişimi bizde.

| Tier | Ülkeler | Rol | Neden | Ücretli kanal ne zaman |
|---|---|---|---|---|
| **Tier 1 (ana)** | Türkiye | Organik çekirdek, topluluk, basın | Ana dil, yerli indie hikâyesi, düşük-orta CPI (tahmin: Android 0,2-0,6 $); ARPDAU düşük | 1. haftadan, küçük ölçekte |
| **Tier 1 (gelir)** | ABD, BK, Kanada, Avustralya | Gelirin ana kaynağı | Yüksek ARPDAU ve IAP; ama bulmaca iOS CPI ABD'de çok yüksek olabilir (AppsFlyer ~9 $ iOS, ~5 $ Android) ([AppsFlyer benchmark](https://www.appsflyer.com/?p=549948)) | Apple Search Ads hemen (marka + dar kelime); geniş UA 3-4. haftada eşikler tutarsa |
| **Tier 2** | Almanya, Fransa, İspanya, Japonya, Kore, Tayvan/Hong Kong | Yerelleştirilmiş ikinci dalga | Dil desteği var; ARPDAU iyi; AB'de Firebase verisi gelmediğinden ölçüm zayıf | 3-4. hafta, mağaza konsolu verisine göre |
| **Tier 3 (test)** | Brezilya, Meksika, Arjantin, Filipinler, Endonezya | Ucuz yaratıcı ve tutma testi | Düşük CPI (tahmin: Android 0,05-0,3 $); pt-BR ve es var | 1-2. hafta, yalnız test amaçlı |

Karar yöneticide: Tier 1 gelir pazarına ne zaman ve ne ölçüde girileceği, Japonya/Kore'nin Tier 2'den önce alınıp alınmayacağı.

---

## 6. Ölçülebilir hedefler ve KPI'lar

### 6.1 KPI tablosu

| KPI | Tür ortalaması (tahmin, kaynaklı) | Ray hedefi: lansman haftası | Ray hedefi: 4. hafta | Nasıl ölçülür |
|---|---|---|---|---|
| Günlük indirme (iki mağaza toplam) | Yeni indie bulmaca: günde onlarca-yüzlerce (tahmin) | Ort. 150/gün (organik + test) | Ort. 400/gün | Play Console › İstatistikler (Kullanıcı edinme); App Store Connect › Analytics › İndirmeler; Firebase `first_open` |
| Mağaza sayfası dönüşümü | Play: ziyaretçi→yükleme ~%25-35; App Store: sayfa görüntüleme→indirme ~%3-5 gösterim bazlı, ~%25-40 sayfa bazlı (tahmin) | Play ≥ %25, App Store sayfa ≥ %25 | Play ≥ %30 (A/B sonrası) | Play Console › Mağaza girişi performansı / Mağaza girişi denemeleri; App Store Connect › Analytics › Dönüşüm oranı |
| CPI (Android / iOS) | Casual: iOS ~1,4 $, Android ~0,14 $ ([Liftoff özeti](https://liftoff.ai/?p=35032)); bulmaca ABD: iOS ~9,5 $, Android ~4,8 $ ([AppsFlyer](https://www.appsflyer.com/?p=549948)) | TR/Tier 3 Android ≤ 0,30 $; ASA marka ≤ 1,5 $ | Harmanlanmış ≤ 0,60 $ (Tier 1 gelir hariç) | Reklam konsolları (Google Ads, ASA, Meta, TikTok) harcama ÷ yükleme; Firebase'e bağlı Google Ads dönüşümü |
| D1 tutma | Genel medyan ~%22, üst %25 ~%30, üst %10 ~%40 ([GameAnalytics 2025 özeti](https://gamedevreports.substack.com/p/gameanalytics-mobile-gaming-benchmarks)) | ≥ %35 | ≥ %38 | Firebase › Tutma (Retention) kohortları; Play Console › Kullanıcı tutma; App Store Connect › Analytics › Tutma |
| D7 tutma | Genel medyan ~%3,5-4; üst %10 ~%10 ([GameAnalytics 2025](https://investgame.net/wp-content/uploads/2025/02/2025-GameAnalytics-Mobile-Gaming-Benchmarks.pdf)); bulmaca türü ortalamanın üstünde | ≥ %12 (ilk kohort) | ≥ %14 | Aynı |
| D30 tutma | Genel medyan < %1; iyi bulmaca %4-8 (tahmin) | (henüz yok) | ≥ %5 (lansman kohortu, 4. hafta sonunda yalnız erken kohortlar ölçülür) | Aynı |
| `tutorial_complete` oranı | İyi oyunlarda %70-85 (tahmin) | ≥ %70 | ≥ %80 | Firebase › Hunilere: `first_open` → `tutorial_begin` → `tutorial_complete`; ayrıca `level_end` (level=5, 10, 20) adımları |
| ARPDAU (reklam + IAP) | Reklam ağırlıklı bulmaca: 0,03-0,10 $; Tier 1'de 0,10-0,20 $ (tahmin) | ≥ 0,03 $ (Türkiye ağırlıklı) | ≥ 0,05 $ harmanlanmış | AdMob geliri ÷ DAU + Firebase `in_app_purchase` geliri ÷ DAU; Firebase › Gelir raporu; AdMob › Raporlar |
| ROAS D7 / D30 | Bulmaca/casual'da kâra geçiş genelde 6-12 ay; D7 %8-15, D30 %25-40 sağlıklı sayılır (tahmin) | Ölçülmez (test bütçesi) | D7 ≥ %10, D30 ≥ %30 (Tier 3/TR kampanyaları) | Google Ads (Firebase bağlantılı, `in_app_purchase` + AdMob geliri), kampanya kohort geliri ÷ harcama; iOS'ta ASA panosu + App Store Connect kaynak raporu |

Yardımcı metrikler: bölüm başı süre (`level_end.time_s`), takılma noktaları (`level_quit` sayısı hat başına), ipucu kullanımı, `offer_shown`→`offer_buy` oranı, ödüllü reklam izleme (`ad_impression` format=rewarded), Günün Hattı serisi (`daily_end.streak`), puan ortalaması (hedef ≥ 4,5).

### 6.2 Ölçüm notları

- **AB/AEA, BK, İsviçre Firebase'de görünmez** (rıza mesajı gösterilen bölgelerde toplama kapalı; YAYIN §5.4). Bu ülkelerin tutma ve dönüşümü yalnız Play Console ve App Store Connect'ten okunur. Firebase sayıları "AB dışı" diye etiketlenir.
- `ad_storage`/`ad_user_data` reddedildiğinden Google Ads'in Firebase üzerinden dönüşüm optimizasyonu sınırlı olabilir. Karar noktası §9'da.
- `purchase` olayında tutar yok; gelir `in_app_purchase` (Firebase'in kendi olayı) ve mağaza konsollarından okunur.
- Haftalık KPI tablosu her pazartesi doldurulur (Performans rolü), yönetici onayıyla eşik kararları verilir.

### 6.3 Karar eşikleri (ücretli büyüme kapısı)

| Durum | Karar |
|---|---|
| D1 ≥ %35, D7 ≥ %12, tutorial ≥ %70 | Tier 3 ve TR'de ücretli bütçeyi kademeli artır; Tier 1 gelir pazarında test aç |
| D1 %25-35 | Ücretli bütçeyi sabit tut; öğretici ve ilk 20 bölüm iyileştirmesine öncelik |
| D1 < %25 ya da tutorial < %60 | Ücretli kampanyaları durdur; ürün düzeltmesi (oyun kodu ayrı oturumda) |
| ROAS D7 4. haftada < %5 | Kanal/ülke bazında kes, yaratıcıyı değiştir |

---

## 7. Kanal karışımı

### 7.1 Organik (öncelik sırası)

1. **ASO (en yüksek):** Play lansmanına hazır başlık, kısa açıklama, ekran görüntüleri ve tanıtım videosu; iki mağazada 9 dilde anahtar kelime. Mağaza metninde "24 hat" geçen yerler 1.2 ile "33 kural hattı" diye güncellenmeli (MAGAZA §4 tam açıklama). Play'de Mağaza girişi denemeleri, App Store'da Ürün sayfası optimizasyonu ile A/B. Ayrıntı: [aso.md](aso.md).
2. **Mağaza öne çıkarmaları:** Play Console "Etkinlikler" (LiveOps / Promosyon içeriği) ile "Haftalık lig başladı" etkinliği; App Store "Uygulama İçi Etkinlikler" ile lig/kapışma etkinliği; App Store ve Play editör ekiplerine indie öne çıkarma başvurusu (ücretsiz, gecikmeli etki).
3. **Sosyal kısa video:** TikTok, Instagram Reels, YouTube Shorts. Gerçek oynanış: "son karoyu döndür, şehir yanar" tatmin anı, 7 yeni kural tanıtımı, Günün Hattı meydan okuması. Ayrıntı: [sosyal-medya-takvimi.md](sosyal-medya-takvimi.md).
4. **Topluluk:** Reddit (r/IndieGaming, r/AndroidGaming, r/iosgaming, r/puzzles, r/transit), Türk indie toplulukları, Discord sunucusu (lig/kapışma rakibi bulma). Arkadaşına öner (1.2) bağlantısı.
5. **PR:** Türk teknoloji/oyun basını (indie geliştirici hikâyesi), yabancı mobil oyun siteleri (TouchArcade, Pocket Gamer), küçük-orta içerik üreticileri. Ayrıntı: [topluluk-pr.md](topluluk-pr.md).

### 7.2 Ücretli (öncelik ve gerekçe)

| Öncelik | Kanal | Neden | Ne zaman | Oransal pay fikri (ücretli bütçe içinde) |
|---|---|---|---|---|
| 1 | **Google App Campaigns (Android)** | Play lansmanı; Android CPI düşük; Play + YouTube + AdMob ağı; Firebase ile bağlantı | 1. gün, TR + Tier 3, "yükleme" hedefli | ~%40 |
| 2 | **Apple Search Ads** | Yüksek niyet (arama), iOS zaten yayında; marka koruması + "metro puzzle", "loop puzzle" kelimeleri | 1. gün, TR + ABD/BK dar kelime | ~%25 |
| 3 | **TikTok Ads** | Kısa video ile yaratıcı testi; organik içerikten en iyiyi Spark Ads ile büyütme | 2. hafta, organik içerik kanıtlanınca | ~%20 |
| 4 | **Meta (Instagram/Facebook)** | 25-45 yetişkin ana kitleye erişim; Reels yaratıcıları yeniden kullanılır | 3. hafta, tutma eşiği tutarsa | ~%15 |

Bütçe: rakam yöneticiye sorulacak (günlük/aylık tavan ve 4 haftalık toplam). Bütçe çok küçükse (ör. yalnız deneme düzeyi) pay ASA + Google'a toplanır, TikTok/Meta organikle sınırlı kalır. Ayrıntılı kampanya yapısı: [reklam-kampanyasi.md](reklam-kampanyasi.md).

Organik/ücretli genel oran fikri: ilk 2 hafta emeğin ~%80'i organik (ASO, içerik, topluluk), ~%20'si ücretli test; 3-4. hafta eşikler tutarsa ücretli payı artar.

---

## 8. Zaman çizelgesi

Roller: **ASO**, **Sosyal** (sosyal medya), **Perf** (performans/ücretli), **T/PR** (topluluk/PR), **Yön** (yönetici = kullanıcı, onay ve geliştirici işleri).

### 8.1 Lansman haftası (21-27 Kasım 2026)

| Gün | Adım | Sorumlu |
|---|---|---|
| **Cum 21 Kas** (Play yayını) | Play sürümünün canlı olduğunu ve mağaza sayfasının 9 dilde doğru göründüğünü doğrula; IAP fiyatları (ABD 2,99 $, TR ₺59,99) kontrol | Yön, ASO |
| | Lansman duyurusu: TR ve EN kısa video + görsel (Play ve App Store bağlantılarıyla) | Sosyal |
| | Basın bültenini TR basına ve listeye gönder; Reddit/indie toplulukta "Android'e geldi" gönderisi | T/PR |
| | Google App Campaign (TR + 1-2 Tier 3 ülke) ve ASA (marka + dar kelime) test bütçesiyle aç; Firebase–Google Ads bağlantısını doğrula | Perf, Yön onayı |
| | [ilk-48-saat.md](ilk-48-saat.md) kontrol listesini başlat (çökme, yorum, olay akışı) | Herkes |
| **Cmt 22 Kas** | Firebase DebugView/gerçek zamanlı olaylar: `first_open`, `tutorial_begin/complete`, `level_end`, `ad_impression` akıyor mu | Perf |
| | Mağaza yorumlarına 24 saat içinde yanıt (TR/EN) | T/PR |
| | Kural tanıtım videosu #1 (Ekspres durak) | Sosyal |
| **Paz 23 Kas** | İlk 48 saat değerlendirmesi: çökme oranı, puan, ilk D1 kohortu, mağaza dönüşümü; yönetici "devam / düzelt" kararı | Yön, Perf |
| | Topluluk: Discord açılışı ya da lig rakibi kanalı | T/PR |
| **Pzt 24 Kas** | Haftalık KPI tablosunun ilk doldurulması; CPI ve D1 ülke bazında | Perf |
| | Play Mağaza girişi denemesi #1 (simge ya da ilk ekran görüntüsü) başlat; App Store ürün sayfası A/B #1 | ASO |
| **Sal 25 Kas** | Yabancı basın ve içerik üreticilerine (EN) e-posta dalgası | T/PR |
| | Kural tanıtım videosu #2 (Manevra) + Günün Hattı meydan okuması | Sosyal |
| **Çar 26 Kas** | Yaratıcı rapor: hangi video/afiş en iyi IPM; zayıfları kapat | Perf |
| | Play "Etkinlik" ve App Store "Uygulama İçi Etkinlik": Haftalık lig | ASO, Yön onayı |
| **Per 27 Kas** | Hafta sonu değerlendirmesi: KPI'lar eşiklere göre; 2. hafta planı ve bütçe kararı | Yön, herkes |
| | Anahtar kelime sıralama ilk okuması (TR/EN) | ASO |

### 8.2 Sonraki 4 hafta

| Hafta | Odak | Adımlar | Sorumlu |
|---|---|---|---|
| **1. hafta (21-27 Kas)** | Lansman | §8.1 | Herkes |
| **2. hafta (28 Kas-4 Ara)** | Öğren ve düzelt | D7 ilk okuma; öğretici hunisinde düşüş adımını bul ve yöneticiye bildir; TikTok Spark Ads testi (en iyi organik video); anahtar kelime turu #2; yorumlardan SSS | Perf, ASO, Sosyal, Yön |
| **3. hafta (5-11 Ara)** | Ölçek kapısı | §6.3 eşiklerine göre karar; tutarsa Meta testi ve ABD/BK Android testi; içerik üreticisi işbirliği (küçük/orta); Play Mağaza girişi denemesi #2 (kısa açıklama) | Yön, Perf, T/PR, ASO |
| **4. hafta (12-18 Ara)** | Tatil sezonu hazırlığı | Kış/yeni yıl teması ve "yıl sonu ligi" etkinliği (oyunda varsa; yoksa önerisi yöneticiye); D30 için ilk kohortu izle; ay sonu raporu ve 2. ay planı (Tier 2 açılışı) | ASO, Sosyal, Perf, Yön |

Not: Aralık ortası-sonu reklam fiyatları (CPM/CPI) tatil sezonu nedeniyle yükselir (tahmin); ücretli ölçek bu yüzden 3. haftada ya da Ocak başında daha verimli olabilir.

---

## 9. Riskler ve karar noktaları

### 9.1 Riskler

| Risk | Etki | Önlem |
|---|---|---|
| Düşük tutma (öğretici sonrası terk) | Ücretli büyüme kârsız | Ücretliyi eşiğe bağla (§6.3); huni analizi; ilk 20 bölüm zorluk eğrisi |
| Ölçüm boşluğu (AB/BK Firebase'de yok; reklam kimliği yok) | Yanlış ROAS, yanlış ülke kararı | Konsol verisiyle çapraz kontrol; kararları AB dışı kohortlara dayandır |
| Tek kişilik ekip, iş yükü | Yorum yanıtları ve içerik aksar | Haftalık sabit ritim; şablon yanıtlar; içerik toplu üretimi |
| Düşük mağaza dönüşümü | Her kanal pahalılaşır | Önce ASO A/B; ilk 3 ekran görüntüsünde "döndür-bağla" anı |
| Klon algısı ("bir başka loop oyunu") | Dönüşüm ve basın ilgisi düşer | Metro teması, kural çeşitliliği ve şehir haritasını öne çıkar |
| TL kuru ve düşük Türkiye ARPDAU | Türkiye'de ücretli UA zor geri döner | Türkiye organik ağırlıklı; ücretli gelir testi Tier 1 İngilizce pazarda |
| Tatil sezonu reklam maliyeti | CPI artar | Aralık ortasından sonra ücretliyi sınırla |
| Mağaza metninde eski bilgi ("24 hat") | Tutarsızlık, güven kaybı | 1.2 ile mağaza metnini güncelle (aso.md) |

### 9.2 Mağaza politikalarına uyum

- **Yanıltıcı reklam yok:** Reklam ve mağaza görselleri yalnız gerçek oynanışı gösterir (store-shots aracı gerçek oyundan üretir). Oyunda olmayan mekanik, sahte "başaramazsın" kurgusu, sahte arayüz, sahte ödül vaadi yok (Google Play "Yanıltıcı reklamlar" ve Apple 2.3 "Doğru meta veri" kuralları).
- **13+ yaş:** Kampanyalarda yaş hedefi en az 18 (güvenli taraf); çocuk kanalı, çocuk karakteri, "aile/çocuk" anahtar kelimesi kullanılmaz; Play "Aileler" programına girilmez.
- **Satış dili:** Üstü çizili fiyat, geri sayım, "son şans" yok (MAGAZA §10.3 ile aynı ilke). Reklamlarda fiyat söylenirse mağaza fiyatıyla aynı olur.
- **Rakip markalar:** Mini Metro, Flow Free gibi adlar başlıkta, alt başlıkta, görselde kullanılmaz; ASA'da rakip marka kelimesine teklif hukuken mümkün olsa da reklam metninde rakip adı geçmez (karar yöneticide).
- **Yorum ve puan:** Teşvikli yorum yok; puan isteği yalnız oyunun mevcut in-app review akışıyla.
- **Gizlilik:** Reklam kampanyalarında kişisel veri yüklemesi (müşteri listesi) yapılmaz; gizlilik politikası bağlantısı mağazada canlı olmalı.

### 9.3 Karar noktaları (yöneticiye)

| # | Karar | Ne zaman | Seçenekler |
|---|---|---|---|
| K1 | Pazarlama bütçesi (günlük tavan + 4 haftalık toplam) | Lansmandan önce (20-21 Kas) | Yalnız organik / küçük test / test + ölçek payı |
| K2 | Ülke önceliği onayı (§5) | 21 Kas | Önerildiği gibi / Japonya-Kore öne / İngilizce pazarlara erken giriş |
| K3 | Google Ads dönüşüm ölçümü için rıza ayarı (`ad_user_data` vb.) gözden geçirilsin mi | 1. hafta sonu | Mevcut haliyle devam (gizlilik öncelikli) / rıza veren kullanıcılar için açmak (oyun kodu değişikliği, ayrı oturum) |
| K4 | Ücretli ölçek kapısı (§6.3) | 3. hafta başı | Artır / sabit / durdur |
| K5 | Rakip marka kelimelerine ASA teklifi | 2. hafta | Evet (yalnız kelime, metinde ad yok) / hayır |
| K6 | İçerik üreticisi işbirliği (ücretli mi, kod/hediye mi) | 2-3. hafta | Ücretsiz erişim + reklamsız kod / küçük ücret |
| K7 | Tatil sezonu etkinliği (oyun içi) | 3. hafta | Var olan temalarla / yeni içerik (geliştirme) / yok |

---

Kaynaklar (seçme): [PocketGamer.biz · Mini Metro](https://www.pocketgamer.biz/public-transport-puzzler-mini-metro-has-sold-over-a-million-units) · [AppGoblin · Mini Metro](https://appgoblin.info/apps/nz.co.codepoint.minimetro) · [Big Duck Games](https://bigduckgames.com) · [AppBrain · Big Duck Games](https://www.appbrain.com/dev/Big+Duck+Games+LLC/) · [App Store · Unblock Me](https://apps.apple.com/app/id315019111) · [GameAnalytics 2025 Benchmarks (PDF)](https://investgame.net/wp-content/uploads/2025/02/2025-GameAnalytics-Mobile-Gaming-Benchmarks.pdf) · [GameAnalytics 2025 özeti](https://gamedevreports.substack.com/p/gameanalytics-mobile-gaming-benchmarks) · [GameAnalytics Q1'24](https://gamedevreports.substack.com/p/gameanalytics-benchmarks-in-mobile) · [Liftoff 2025 Casual Gaming](https://liftoff.ai/?p=35032) · [AppsFlyer oyun benchmarkları](https://www.appsflyer.com/?p=549948) · [Singular Q4 2025](https://www.singular.net/quarterly-report-2025-q4/) · [mobilegamer.biz · Türkiye](https://mobilegamer.biz/data-digest-turkiye-us-asia-and-mena-market-stats-pokemon-go-ua-funding-and-more/)
