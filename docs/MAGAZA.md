# Ray — Mağaza sayfası, beyanlar ve yayın listesi

Bu belge Google Play ve App Store'a gönderim için gereken her şeyi tek yerde toplar: mağaza metinleri (Türkçe ve İngilizce), görseller, veri güvenliği ve gizlilik beyanları, yaş derecelendirmesi, uygulama içi ürün ve kullanıcının yapması gereken işler.

- Metinler kopyalanıp yapıştırılmak üzere kod bloklarındadır. Karakter sayıları tablolarda, sınırla birlikte verilmiştir (Unicode karakter; Türkçe harfler tek karakter sayılır).
- `[geliştirici adı]` ve `[iletişim e-postası]` yer tutucudur. Gönderimden önce gerçek değerle değiştirilmeli.
- Bütün özellikler `README.md` ve `docs/BOLUM_TASARIMI.md` ile doğrulanmıştır. Oyun değişirse (ör. çift hatlara yeni kurallar gelince) "Bilinen sınırlar" bölümündeki maddeler güncellenmeli.

## 1. Kimlik bilgileri

| Alan | Değer |
|---|---|
| Uygulama adı (cihazda) | Ray |
| Paket / Bundle ID | `com.osmanadali.ray` |
| Uygulama içi ürün | `ray_reklamsiz` (tüketilemez, iki mağazada aynı kimlik) |
| Gizlilik politikası | https://osmanadali.github.io/mobil-oyun/gizlilik.html |
| Destek URL'si (App Store) | https://osmanadali.github.io/mobil-oyun/gizlilik.html (İletişim bölümü) |
| Pazarlama URL'si (isteğe bağlı) | https://osmanadali.github.io/mobil-oyun/ (oyunun web sürümü) |
| Telif (App Store) | © 2026 [geliştirici adı] |
| İletişim e-postası (iki mağaza, herkese açık) | [iletişim e-postası] |
| Dil | Türkçe ve İngilizce (oyun cihaz diline göre açılır: Türkçe cihazda Türkçe, ötekilerde İngilizce; Ayarlar › Dil ile değişir) |
| Cihaz | Android telefon, iPhone (yalnız dikey; iPad yok) |

Gizlilik ve destek adresleri GitHub Pages açılınca yayına girer. Pages kullanıcının onayıyla açılacak (bkz. §11).

## 2. Görseller

Bütün görseller `node tools/store-shots.cjs` ile gerçek oyundan üretilir. Araç oyunu yerel sunucuda Playwright ile açar, oyuncu durumunu kayıtla kurar, karolara gerçekten dokunur, sonra her ekranı başlıklı bir pazarlama çerçevesine koyar. Oyun koduna dokunmaz.

```bash
node tools/store-shots.cjs                 # hepsi (Play, iPhone 6,9", iPhone 6,5", öne çıkan görsel)
node tools/store-shots.cjs play 02 03      # yalnız Play'in 2. ve 3. sahnesi
node tools/store-shots.cjs feature         # yalnız öne çıkan görsel
node tools/store-shots.cjs en              # İngilizce: oyun en-US'de, başlıklar İngilizce → store/screens-en/, store/feature-graphic-en.png
```

| Dosya | Boyut | Nereye |
|---|---|---|
| `store/play-icon-512.png` | 512×512 | Play › Mağaza girişi › Uygulama simgesi |
| `store/feature-graphic.png` | 1024×500 | Play › Öne çıkan grafik |
| `store/screens/play/*.png` | 1080×1920 (9:16) | Play › Telefon ekran görüntüleri (7 adet; Play 2–8 kabul eder) |
| `store/screens/ios-69/*.png` | 1320×2868 | App Store Connect › iPhone 6,9" ekran (zorunlu boy) |
| `store/screens/ios-65/*.png` | 1284×2778 | App Store Connect › iPhone 6,5" (6,9" yüklenince gerekmez; yedek) |
| `store/screens-en/…`, `store/feature-graphic-en.png` | aynı boylar | İngilizce mağaza girişi (Play › İngilizce çeviri, App Store Connect › English (U.S.)) |
| `store/appstore-icon-1024.png` | 1024×1024 | iOS projesinin simgesi (App Store simgesi derlemeden gelir) |

Hepsi 24 bit PNG'dir, saydamlık (alfa) içermez; iki mağazanın kuralına uyar.

**Sahneler** (aynı sıra üç boyda da):

| # | Dosya | Başlık | Alt satır | Ekranda |
|---|---|---|---|---|
| 1 | `01-oyun` | Dokun, döndür, hattı yak | Bütün durakları merkeze bağla, açık uç kalmasın | Bölüm 181 (M8, iki merkez), hat yarıya kadar yanmış. Mağazada ilk bakılan görsel oynanıştır. |
| 2 | `02-ana` | Hatları bağla, şehri canlandır | Tek elle · internetsiz · her gün yeni bir Günün Hattı | Ana ekran: 12 günlük seri, Günün Hattı, M9 |
| 3 | `03-kazan` | Kusursuz bitir, taç kazan | Süre ve hamle hedefini tuttur, üç yıldızı topla | Bölüm 45 kusursuz: 3 yıldız, taç, 5'li seri bonusu |
| 4 | `04-harita` | 20 hat, sonu gelmeyen bölüm | Zorluk dalga dalga artar, arada mola var | Hat haritası: biten M9, süren M10 |
| 5 | `05-kural` | Hat ilerledikçe yeni kurallar | Makas, köprü, tabela, döner tabla, halka, tünel ağzı… | Tünel ağzı kural kartı (M19) |
| 6 | `06-tema` | Taç topla, 25 renk teması aç | Kusursuz bitirdiğin her bölüm bir taç kazandırır | Renk temaları penceresi |
| 7 | `07-sandik` | Sürpriz sandık, yeni trenler | İpucu, seri kalkanı ya da yeni bir tren kaplaması | Sandık açılışı: destansı Lavanta kaplaması |

Öne çıkan görsel: koyu lacivert zemin, uygulama ikonu (Gece Işığı: turuncu L ray, yanan kare merkez), "Ray", "Hatları bağla · Şehri canlandır" ve üç rozet (Tek elle, İnternetsiz, Metro bulmacası).

İngilizce sahne başlıkları (`en`): 1 Connect the lines, light up the city · 2 Tap, turn, light the line · 3 Finish perfect, earn crowns · 4 20 lines, endless levels · 5 New rules as the line grows · 6 Collect crowns, unlock 25 themes · 7 Surprise chest, new trains. Öne çıkan görselde "Connect the lines · Light up the city" ve One hand, Offline, Metro puzzle rozetleri.

## 3. Karakter sayıları

| Metin | Sınır | TR | EN |
|---|---|---|---|
| Play: uygulama adı | 30 | 18 | 22 |
| Play: kısa açıklama | 80 | 78 | 73 |
| Play: tam açıklama | 4000 | 2530 | 2785 |
| App Store: ad | 30 | 18 | 22 |
| App Store: alt başlık | 30 | 28 | 28 |
| App Store: tanıtım metni | 170 | 152 | 152 |
| App Store: açıklama | 4000 | 2530 | 2785 |
| App Store: anahtar kelimeler | 100 | 87 (94 bayt) | 99 |
| Ürün adı (App Store) | 30 | 15 | 15 |
| Ürün açıklaması (App Store) | 45 | 41 | 41 |
| Ürün açıklaması (Play) | 200 | 130 | 138 |
| Play sürüm notu | 500 | 103 | 109 |

Türkçe anahtar kelimeler bayt olarak da 100'ün altında kalır (bazı araçlar ğ, ı, ş gibi harfleri iki bayt sayar).

## 4. Google Play mağaza girişi

**Uygulama adı** (30)

```text
Ray: Metro Bulmaca
```
```text
Ray: Metro Line Puzzle
```

**Kısa açıklama** (80)

```text
Rayları döndür, durakları bağla. Tek elle, internetsiz, sakin metro bulmacası.
```
```text
Rotate the rails, link every station. A calm, one-handed, offline puzzle.
```

**Tam açıklama** (4000). Aynı metin App Store açıklaması olarak da kullanılır (başka platform adı geçmez).

```text
Ray, tek elle ve internetsiz oynanan sakin bir metro bulmacasıdır. Karoya dokun, ray 90° döner. Merkez istasyondan çıkan hattı bütün duraklara bağla, açıkta ray ucu kalmasın. Hat bağlandıkça şehir ışıl ışıl yanar.

NASIL OYNANIR
• Karoya dokun, ray döner.
• Bütün durakları merkeze bağla, açık uç bırakma.
• Üç yıldız: bölümü bitir, süre hedefini tuttur, hamle hedefini tuttur.
• Süreyi ve hamleyi birlikte tutturursan bölüm kusursuz olur, taç kazanırsın.

20 HAT, SONU GELMEYEN BÖLÜMLER
Her metro hattı bir öncekinden uzundur, her bölüm bir öncekinden biraz daha zordur. İlk 20 hattan sonra oyun karma hatlarla sonsuza dek sürer. Bölümler cihazında üretilir, hepsi çözülebilir ve herkes aynı numaralı bölümde aynı bulmacayı görür.

HAT İLERLEDİKÇE YENİ KURALLAR
Sabit karo, eşli karo, ters karo, karanlık tünel, sayaçlı karo, iki merkez, makas, kapak, köprü, silik kol, yön tabelası, gizli depo, döner tabla, kapalı durak, halka hat, nehir, tünel ağzı ve tarife bölgesi: 18 kural. Her yeni kural kısa, canlandırmalı bir kartla anlatılır. Tahta hiçbir zaman kalabalıklaşmaz.

GÜNÜN HATTI
Her gün herkes aynı bulmacayı çözer. Bulmaca hafta boyunca zorlaşır, Pazar büyük bulmaca günüdür. Gün serini koru, sonucunu paylaş, arkadaşlarına meydan oku.

TAÇLAR, TEMALAR VE SÜRPRİZ SANDIK
Kusursuz bitirdiğin her bölüm bir taç kazandırır. Taçlarla 25 renk temasının 22'sini açabilir ya da sürpriz sandığı açabilirsin: içinden ipucu, seri kalkanı ya da yeni bir tren kaplaması çıkar. Sandık yalnız oyunda kazanılan taçla açılır, olasılıklar sandık ekranında yazılıdır.

SEFER ŞERİDİ VE KUSURSUZ SERİ
Saatin altındaki küçük tren süre hedefine doğru ilerler. Süre dolsa da oyun bitmez; tren yalnız rötar yapar, peronda bekleyen yolcular da nazikçe takılır. Kusursuz bölümleri art arda bitir, seriyi büyüt, bonus taç kazan.

GÖZ DOSTU, PİL DOSTU
Koyu, açık ve otomatik görünüm. Yumuşak renkler. Animasyonlar yalnız hareket olduğunda çalışır. Müzik, ses ve titreşim ayrı ayrı kapatılabilir. İstersen günlük hatırlatma kurabilirsin.

ÜCRETSİZ VE ADİL
Ray ücretsizdir. İpucun her gün en az 3'e tamamlanır, hat sonlarında ek ipucu kazanırsın. Reklamlar yalnız internet varken gösterilir: bölüm aralarında ara sıra bir geçiş reklamı ve yalnız sen istersen izlediğin ödüllü videolar (ek ipucu, ödülü ikiye katlama, kopan seriyi kurtarma). Günün Hattı'nda geçiş reklamı yoktur.

REKLAMSIZ PAKET
Tek seferlik satın alma. Bölüm aralarındaki reklamlar kalkar, 20 ipucu hediye edilir, 3 özel tema (Altın, Elmas, Yakut) açılır. İpucu videoları isteğe bağlı kalır.

Hesap gerekmez, kişisel bilgi istenmez. İlerlemen cihazında kalır.
```

```text
Ray is a calm metro puzzle you can play with one hand and without an internet connection. Tap a tile and the rail turns 90°. Extend the line from the central station to every stop and leave no loose rail ends. As the line connects, the city lights up.

HOW TO PLAY
• Tap a tile to rotate the rail.
• Connect every station to the hub, leave no open ends.
• Three stars: finish the level, beat the time target, beat the move target.
• Hit both targets in one go and the level is flawless: you earn a crown.

20 LINES, ENDLESS LEVELS
Each metro line is longer than the last and every level is a little harder than the one before. After the first 20 lines the game continues forever with mixed lines. Levels are generated on your device, every one is solvable, and everyone gets the same puzzle on the same level number.

NEW RULES AS YOU TRAVEL
Fixed tiles, paired tiles, reverse tiles, dark tunnels, counter tiles, two hubs, switches, manhole covers, bridges, faded arms, direction signs, hidden depots, turntables, closed stations, loop lines, rivers, tunnel portals and fare zones: 18 rules. Each new rule is introduced with a short animated card, and the board never gets cluttered.

DAILY LINE
Every day everyone solves the same puzzle. It gets harder through the week, and Sunday is big puzzle day. Keep your daily streak, share your result and challenge your friends.

CROWNS, THEMES AND THE SURPRISE CHEST
Every level you finish flawlessly earns a crown. Spend crowns on 22 of the 25 color themes or open the surprise chest for a hint, a streak shield or a new train livery. The chest only opens with crowns earned in the game, and its odds are shown on the chest screen.

TRAIN STRIP AND FLAWLESS STREAK
A little train below the clock rolls toward your time target. When time runs out the game does not end; the train is just running late, and the passengers on the platform tease you gently. Finish flawless levels in a row, grow your streak and earn bonus crowns.

EASY ON THE EYES AND THE BATTERY
Dark, light and automatic appearance. Soft colors. Animations only run while something is moving. Music, sound effects and vibration can each be turned off. Set a daily reminder if you like.

FREE AND FAIR
Ray is free to play. Your hints are topped up to at least 3 every day, and you earn extra hints at the end of each line. Ads are only shown when you are online: an occasional interstitial between levels, and rewarded videos only when you choose to watch them (extra hints, doubling a reward, saving a broken streak). The Daily Line has no interstitials.

AD-FREE PACK
A one-time purchase. Removes the ads between levels, gives you 20 hints and unlocks 3 exclusive themes (Gold, Diamond, Ruby). Hint videos stay optional.

No account needed and no personal details asked. Your progress stays on your device.

Available in English and Turkish.
```

**Diğer Play alanları**

| Alan | Değer |
|---|---|
| Uygulama mı, oyun mu | Oyun |
| Kategori | Bulmaca (Puzzle) |
| Etiketler (en çok 5, önerilen) | Bulmaca, Mantık, Çevrimdışı, Tek oyunculu, Gündelik |
| Ücretli / ücretsiz | Ücretsiz (yayından sonra ücretliye çevrilemez) |
| İletişim e-postası | [iletişim e-postası] |
| Web sitesi | https://osmanadali.github.io (app-ads.txt için, bkz. §11) |
| Sürüm notu (ilk sürüm) | `İlk sürüm. Tek elle, internetsiz metro bulmacası: 20 hat, Günün Hattı, renk temaları ve sürpriz sandık.` |
| Sürüm notu (EN) | `First release. A one-handed, offline metro puzzle: 20 lines, a Daily Line, color themes and a surprise chest.` |

## 5. App Store girişi

**Fiyat:** Ücretsiz (App Store Connect › Fiyatlandırma ve Uygunluk › Fiyat **0,00 $ / Ücretsiz**). Uygulamanın kendisi ücretsiz indirilir; tek ücretli şey isteğe bağlı Reklamsız paket (§10).

**Ad** (30)

```text
Ray: Metro Bulmaca
```
```text
Ray: Metro Line Puzzle
```

**Alt başlık** (30)

```text
Tek elle, internetsiz, sakin
```
```text
Calm, one-handed and offline
```

**Tanıtım metni** (170). Sürüm göndermeden değiştirilebilir; kampanya ve yeni kural duyurusu için kullanılır.

```text
Her gün yeni bir Günün Hattı! Rayları döndür, durakları bağla, kusursuz bitir, taç topla. 20 hat, yeni kurallar ve sonu gelmeyen bölümler seni bekliyor.
```
```text
A new Daily Line every day! Rotate the rails, connect every station, finish flawlessly and collect crowns. 20 lines, new rules and endless levels await.
```

**Açıklama** (4000): §4'teki tam açıklamanın aynısı.

**Anahtar kelimeler** (100, virgülle, boşluksuz). Ad ve alt başlıktaki sözcükler (ray, metro, bulmaca, tek elle, internetsiz, sakin) zaten aranır; burada tekrarlanmaz.

```text
boru,tren,hat,durak,istasyon,zeka,mantık,beyin,günlük,çevrimdışı,karo,net,pipes,offline
```
```text
pipes,net,subway,train,station,logic,brain,daily,relaxing,rotate,connect,tiles,rail,map,minimal,zen
```

| Alan | Değer |
|---|---|
| Birincil kategori | Oyunlar › Bulmaca (Games › Puzzle) |
| İkinci oyun alt kategorisi (isteğe bağlı) | Gündelik (Casual) |
| Destek URL'si | https://osmanadali.github.io/mobil-oyun/gizlilik.html |
| Pazarlama URL'si | https://osmanadali.github.io/mobil-oyun/ |
| Gizlilik politikası URL'si | https://osmanadali.github.io/mobil-oyun/gizlilik.html |
| Telif | © 2026 [geliştirici adı] |
| Şifreleme (export compliance) | Muaf olmayan şifreleme yok (`ITSAppUsesNonExemptEncryption = false`, iOS hazırlık betiği yazar) |
| Üçüncü taraf içerik | "Evet, gerekli haklara sahibim" (Outfit yazı tipi SIL OFL lisanslıdır; reklamlar AdMob'dan gelir) |

## 6. Google Play "Veri güvenliği" formu

Hesap yok, çökme raporu aracı yok, ilerleme yalnız cihazdaki depoda. Formda beyan edilecek veriyi iki SDK toplar: **Google Mobile Ads SDK (AdMob)** ve **Google Analytics for Firebase** (31 Ekim'den beri; oyun olayları, reklam kimliği olmadan, rıza gereken bölgelerde kapalı; ayrıntı `docs/YAYIN.md` §5). Satın almayı Google Play yürütür; uygulama ödeme bilgisi görmez.

Firebase, geliştirici adına çalışan bir hizmet sağlayıcıdır; Play tanımına göre bu "paylaşma" sayılmaz, "toplama" sayılır. Ölçüm derlemeye yalnız `FIREBASE_ANDROID_JSON` gizli değeri verilince girer; vermeden yayımlarsan Firebase satırlarını forma ekleme.

| Soru | Yanıt |
|---|---|
| Uygulama gerekli kullanıcı verisi türlerinden birini topluyor ya da paylaşıyor mu? | Evet |
| Toplanan bütün veriler aktarım sırasında şifreleniyor mu? | Evet (SDK HTTPS kullanır) |
| Hesap oluşturma | Uygulamada hesap oluşturma yok |
| Kullanıcı verilerinin silinmesini isteyebilir mi? | Hayır. Geliştirici kullanıcı adına veri tutmaz; reklam verisini Google işler. Cihazdaki oyun verisi uygulamadan silinebilir (aşağıda). |

Beyan edilecek veri türleri (Google'ın AdMob için yayımladığı eşleşmeye göre):

| Play veri türü | AdMob'daki karşılığı | Toplanıyor | Paylaşılıyor | Geçici mi | Zorunlu mu | Amaç |
|---|---|---|---|---|---|---|
| Konum › Yaklaşık konum | IP adresi (genel konum tahmini) | Evet | Evet | Hayır | Zorunlu | Reklam veya pazarlama · Analiz · Dolandırıcılığı önleme, güvenlik ve uyumluluk |
| Uygulama etkinliği › Uygulama etkileşimleri | Reklam gösterimi, dokunma, video izleme | Evet | Evet | Hayır | Zorunlu | aynı |
| Uygulama bilgileri ve performans › Kilitlenme günlükleri, Teşhis | SDK'nın teşhis bilgisi | Evet | Evet | Hayır | Zorunlu | aynı |
| Cihaz veya diğer kimlikler | Android reklam kimliği, uygulama grubu kimliği | Evet | Evet | Hayır | Zorunlu | aynı |
| Uygulama etkinliği › Uygulama etkileşimleri | **Firebase:** bölüm başlama/bitiş/bırakma, Günün Hattı, anlatım, reklam gösterimi, güçlendirici olayları | Evet | Hayır | Hayır | Zorunlu | Analiz |
| Cihaz veya diğer kimlikler | **Firebase:** uygulama örneği kimliği (reklam kimliği toplanmaz) | Evet | Hayır | Hayır | Zorunlu | Analiz |
| Finansal bilgiler › Satın alma geçmişi | **Firebase:** satın alınan ürünün kimliği (`purchase` olayı, tutar yok) | Evet | Hayır | Hayır | Zorunlu | Analiz |
| Konum › Yaklaşık konum | **Firebase:** IP'den ülke/şehir tahmini | Evet | Hayır | Hayır | Zorunlu | Analiz |

Aynı veri türü iki satırda geçiyorsa formda tek kez işaretlenir; amaçlar ve "paylaşılıyor" yanıtı birleştirilir (AdMob paylaşır → Evet). "Zorunlu": oyuncu ölçümü uygulama içinden ayrıca kapatamaz (rıza bölgelerinde zaten kapalı; Verilerimi sil kapatır).

Toplanmayanlar: kişisel bilgiler (ad, e-posta, adres, telefon), ödeme bilgileri (Google Play yürütür), sağlık, mesajlar, fotoğraf ve video, ses, dosyalar, takvim, kişiler, web tarama, kesin konum.

Gönderimden önce Google'ın güncel tablolarıyla son kez karşılaştır: https://developers.google.com/admob/android/privacy/play-data-disclosure · https://firebase.google.com/docs/android/play-data-disclosure

**Silme yolu** (gizlilik politikasıyla aynı):

- Oyun verisi: Ayarlar › Gizlilik › Verilerimi sil (bu düğme `magaza-reklam` dalıyla gelir) ya da uygulamayı kaldırmak. Aynı düğme ölçümü kapatır ve Firebase'in cihazdaki kimliğini sıfırlar (`resetAnalyticsData`).
- Reklam verisi: Android ayarlarından reklam kimliğini sıfırlamak ya da silmek; AB/BK/İsviçre ve ilgili ABD eyaletlerinde rıza seçimini Ayarlar › Gizlilik › Reklam gizlilik seçenekleri ile değiştirmek.

**Reklam kimliği beyanı** (Uygulama içeriği › Reklam kimliği): Evet, kullanıyor. Amaç: Reklam veya pazarlama, Analiz, Dolandırıcılığı önleme. `AD_ID` izni AdMob kitaplığıyla bildirime kendiliğinden eklenir; yayın derlemesinde birleşik bildirimde göründüğünü doğrula.

## 7. Apple "App Privacy" etiketleri

Etiketler AdMob SDK ve Firebase Analytics içindir (Firebase yalnız `FIREBASE_IOS_PLIST` verilen derlemede; IDFA'sız `AnalyticsWithoutAdIdSupport` sürümü, IDFV de kapalı). iOS'ta izleme (IDFA) yalnız kullanıcı ATT penceresinde izin verirse olur, bu yüzden izleme beyan edilir ve ATT penceresi gösterilir (`magaza-reklam` dalı).

| Apple veri türü | Amaç | Kimliğe bağlı mı | İzleme için mi |
|---|---|---|---|
| Tanımlayıcılar › Aygıt kimliği (IDFA, IDFV) | Üçüncü taraf reklam · Analiz | Hayır | Evet (IDFA, yalnız ATT izniyle) |
| Kullanım verileri › Reklam verileri | Üçüncü taraf reklam · Analiz | Hayır | Evet |
| Kullanım verileri › Ürün etkileşimi | Üçüncü taraf reklam · Analiz | Hayır | Evet |
| Konum › Yaklaşık konum (IP'den) | Üçüncü taraf reklam · Analiz | Hayır | Hayır |
| Tanılama › Çökme verileri, Performans verileri, Diğer tanılama verileri | Üçüncü taraf reklam · Analiz | Hayır | Hayır |
| Tanımlayıcılar › Aygıt kimliği (Firebase uygulama örneği kimliği) | Analiz | Hayır | Hayır |
| Kullanım verileri › Ürün etkileşimi (Firebase oyun olayları) | Analiz | Hayır | Hayır |
| Satın alımlar › Satın alma geçmişi (Firebase `purchase`: ürün kimliği) | Analiz | Hayır | Hayır |
| Konum › Yaklaşık konum (Firebase, IP'den) | Analiz | Hayır | Hayır |

Aynı tür iki satırda geçerse App Store Connect'te bir kez seçilir, amaçlar birleştirilir. Firebase verisi izleme için kullanılmaz (reklam kimliği yok, başka şirketlerin verisiyle birleştirilmez); "izleme" yanıtı yalnız AdMob satırlarından gelir.

Ürün sayfasında beklenen görünüm: "Sizi izlemek için kullanılan veriler: Tanımlayıcılar, Kullanım verileri" ve "Sizinle ilişkilendirilmeyen veriler: Konum, Tanılama, Kullanım verileri, Tanımlayıcılar, Satın Alımlar". "Sizinle ilişkilendirilen veri" bölümü çıkmaz.

Google'ın iOS tabloları: https://developers.google.com/admob/ios/privacy/data-disclosure · https://firebase.google.com/docs/ios/app-store-data-collection. Google Mobile Ads SDK kendi gizlilik bildirimini (`PrivacyInfo.xcprivacy`) taşır; Capacitor da öyle.

## 8. Yaş derecelendirmesi

### Google Play (IARC anketi)

| Soru | Yanıt |
|---|---|
| E-posta | [iletişim e-postası] |
| Kategori | Oyun (Game) |
| Şiddet, kan, korku | Hayır |
| Cinsellik, çıplaklık | Hayır |
| Küfür, kaba dil, kaba mizah | Hayır (yolcu sözleri nazik espridir) |
| Uyuşturucu, alkol, tütün | Hayır |
| Kumar: gerçek para ya da kumar benzetimi (kumarhane oyunu) | Hayır |
| Ayrımcılık, nefret | Hayır |
| Kullanıcılar birbiriyle iletişim kuruyor mu (sohbet, içerik paylaşma) | Hayır. "Paylaş" yalnız sonuç metnini sistemin paylaşma penceresine verir. |
| Kullanıcının konumu paylaşılıyor mu | Hayır |
| Dijital ürün satın alma | Evet (Mağaza: 2 tüketilemez, 5 tüketilebilir ürün; §10) |
| Parayla satın alınan rastgele ödül (ganimet kutusu) | Hayır. Sürpriz sandık yalnız oyunda **kazanılan** taçla açılır. Mağazadaki taç paketi (`ray_tac_50`) ayrı sayılır ve yalnız renk temasına harcanır, sandıkta kullanılamaz (`chestBal`, robot: `gelir.tac`); sandıktan taç çıkmaz. Bütün paketlerin içeriği sabittir. |
| Sınırsız internet erişimi (uygulama içi tarayıcı) | Hayır |

Beklenen sonuç: PEGI 3, ESRB Everyone, USK 0, IARC 3+ (satın alma nedeniyle "Oyun içi satın alma" notu eklenir).

### App Store (yaş derecelendirmesi formu)

- Bütün içerik soruları (şiddet, korku, cinsellik, küfür, uyuşturucu, kumar, yarışma, tıbbi konular): **Yok**.
- Sınırsız web erişimi: Hayır. Kullanıcı içeriği: Hayır. Mesajlaşma: Hayır. Ebeveyn denetimi, yaş doğrulama: Hayır.
- Formda reklam sorusu varsa: **Evet**.
- Hesaplanan derece büyük olasılıkla 4+ çıkar. Reklam içeriği AdMob'da en çok PG'ye ayarlı (`magaza-reklam` dalı, `maxAdContentRating: 'ParentalGuidance'`). Apple reklamların derecelendirmeye uygun olmasını ister. Form izin veriyorsa dereceyi 9+ seç; vermiyorsa AdMob'da iOS uygulaması için en yüksek reklam içeriği derecesini G yap.
- Çocuk kategorisi (Kids): Hayır.

## 9. Hedef kitle, reklam ve diğer Play beyanları

| Play › Uygulama içeriği | Yanıt |
|---|---|
| Gizlilik politikası | https://osmanadali.github.io/mobil-oyun/gizlilik.html |
| Reklamlar | Evet, uygulamada reklam var (AdMob: geçiş ve ödüllü video) |
| Uygulama erişimi | Tüm işlevler özel erişim gerekmeden kullanılabilir (giriş yok) |
| Hedef kitle | 13–15, 16–17, 18 ve üzeri. 13 yaş altı seçilmez; uygulama Aileler programına katılmaz. |
| Çocukların ilgisini çekebilir mi | Hayır. Mağaza görsellerinde çocuklara yönelik karakter ya da dil yok. (Google aksi karar verirse Aileler politikası ve AdMob çocuk ayarları gerekir.) |
| Haber uygulaması | Hayır |
| Devlet uygulaması | Hayır |
| Finansal özellikler | Yok |
| Sağlık | Yok |
| Veri güvenliği | §6 |
| İçerik derecelendirmesi | §8 |
| Reklam kimliği | §6 sonu |

Gizlilik politikası da "13 yaş ve üzeri" der; hedef kitle ve politika uyumludur.

## 10. Uygulama içi ürünler

Oyun iki mağazada da **ücretsiz indirilir**. Aşağıdaki fiyatlar yalnız oyunun içinden isteğe bağlı alınan paketlerin fiyatıdır; uygulamanın kendisine fiyat girilmez. Bütün ürünler tek **Mağaza** penceresindedir (Ayarlar › Mağaza; ipucu bitince açılan pencerede "💡 İpucu paketleri" bağlantısı). Satış sade: rozet, geri sayım, kendiliğinden açılan teklif yok.

### 10.1 Reklamsız paket

| Alan | Google Play | App Store Connect |
|---|---|---|
| Kimlik | `ray_reklamsiz` | `ray_reklamsiz` |
| Tür | Tek seferlik ürün (uygulama içi ürün, tüketilemez) | Non-Consumable (tüketilemez) |
| Ad (TR / EN) | Reklamsız paket / Ad-free Pack | Reklamsız paket / Ad-free Pack (12) |
| Açıklama TR | `Bölüm aralarındaki reklamları kaldırır, 20 ipucu hediye eder ve 3 özel temayı (Altın, Elmas, Yakut) açar. Tek seferlik, ömür boyu.` | `Reklamlar kalkar, 20 ipucu ve 3 özel tema` (45) |
| Açıklama EN | `Removes the ads between levels, gives you 20 hints and unlocks 3 exclusive themes (Gold, Diamond, Ruby). One-time purchase, yours forever.` | `No ads between levels, 20 hints, 3 themes` (45) |
| Fiyat önerisi | Varsayılan ₺59,99; ABD 2,99 $ · AB 2,99 € · BK 2,49 £ elle (ya da USD tabanlı şablon) | Taban ülke **ABD, 2,99 $**; Türkiye elle **₺59,99**; öteki ülkeler ABD'den otomatik |
| İnceleme için | Lisans test hesabıyla dene | İnceleme ekran görüntüsü: Ayarlar › Reklamsız paket penceresi (cihazdan alınır) |

Fiyat gerekçesi: benzer bulmaca oyunlarında reklam kaldırma 2–5 $ arasıdır. Paket yalnız geçiş reklamlarını kaldırır (ödüllü videolar isteğe bağlı kalır), üstüne 20 ipucu ve 3 tema verir; alt uçta bir fiyat ilk satın almayı kolaylaştırır.

Neden taban Türkiye değil: ₺59,99'dan KDV düşülünce kalan yaklaşık 1 $ eder. Taban Türkiye olursa mağazalar öteki ülkeleri bu tutardan çevirir; İngilizce konuşulan ana pazarlarda (ABD, BK, AB) fiyat 2–5 $ bandının altına düşer ve gelir 2–2,5 kat az kalır. Bu yüzden fiyat ABD'ye göre kurulur, Türkiye ayrıca elle girilir.

Fiyat planı:

- **App Store Connect:** Uygulama içi satın alma › `ray_reklamsiz` › Fiyatlandırma › taban ülke **Amerika Birleşik Devletleri**, fiyat **2,99 $**. Öteki ülkeler otomatik gelir. Sonra Türkiye satırını elle **₺59,99** yap.
- **Google Play:** Ürünün varsayılan fiyatı ₺59,99 kalabilir. Ama Play öteki ülkeleri bu tutardan çevirdiği için ABD **2,99 $**, Euro bölgesi **2,99 €** ve Birleşik Krallık **2,49 £** elle girilir. İstersen 2,99 $ tabanlı bir fiyatlandırma şablonu (Ayarlar › Fiyatlandırma şablonları) kurup ürüne bağla, Türkiye'yi orada ₺59,99'a çek.
- Kayıttan sonra iki mağazada ülke listesini gözden geçir: ABD 2,99 $, Türkiye ₺59,99, Almanya 2,99 €, BK 2,49 £ görünmeli.

Geri yükleme: pencerede "Satın alımı geri yükle" düğmesi var (Apple bunu ister).

### 10.2 Öteki ürünler (31 Ekim)

Kimlikler iki mağazada aynıdır (`www/shop.js` › `ITEMS`). Tüketilebilir ürünler Play'de "tüketilebilir uygulama içi ürün" olarak kalır (uygulama her alışta işlemi `finish` ile tüketir), App Store Connect'te **Consumable** seçilir. Tüketilemezler Play'de tek seferlik ürün, App Store'da **Non-Consumable**.

| Kimlik | Tür | Ad TR / EN | İçerik | ABD (taban) | Türkiye (elle) |
|---|---|---|---|---|---|
| `ray_temalar` | Tüketilemez | Tema paketi / Theme Pack | Taçla açılan 22 renk temasının hepsi (Altın, Elmas, Yakut hariç; onlar Reklamsız pakette) | 3,99 $ | ₺79,99 |
| `ray_ipucu_10` | Tüketilebilir | 10 ipucu / 10 Hints | 10 💡 | 0,99 $ | ₺19,99 |
| `ray_ipucu_30` | Tüketilebilir | 30 ipucu / 30 Hints | 30 💡 | 1,99 $ | ₺39,99 |
| `ray_ipucu_80` | Tüketilebilir | 80 ipucu / 80 Hints | 80 💡 | 3,99 $ | ₺79,99 |
| `ray_guclendirici` | Tüketilebilir | Güçlendirici paketi / Booster Pack | 🔄 ek tur ×3, 🔦 fener ×3, ⏱ +15 sn ×3, ↶ geri al ×3 | 1,99 $ | ₺39,99 |
| `ray_tac_50` | Tüketilebilir | 50 taç / 50 Crowns | 50 👑, yalnız renk temasında harcanır (sandıkta kullanılamaz) | 1,99 $ | ₺39,99 |

Mağaza açıklamaları (App Store görünen ad ≤ 30, açıklama ≤ 45 karakter):

| Kimlik | Açıklama TR | Açıklama EN |
|---|---|---|
| `ray_temalar` | `Taçla açılan 22 renk temasının hepsi` | `All 22 crown color themes, one-time` |
| `ray_ipucu_10` / `_30` / `_80` | `10 (30, 80) ipucu: takıldığın karo yerine oturur` (Play) · `10 ipucu` (App Store) | `10 (30, 80) hints: puts a tricky tile in place` (Play) · `10 hints` (App Store) |
| `ray_guclendirici` | `Her güçlendiriciden 3: ek tur, fener, +15 sn, geri al` | `3 of each booster: turn, lantern, +15 s, undo` |
| `ray_tac_50` | `50 taç, renk temaları için` | `50 crowns to spend on color themes` |

Fiyat gerekçesi (§10.1 ile aynı mantık): fiyatlar ABD'ye göre kurulur, öteki ülkeler mağazanın ABD'den çevirisiyle gelir, Türkiye elle girilir. Türkiye oranı Reklamsız paketteki gibidir (2,99 $ ↔ ₺59,99, yani 1 $ ≈ ₺20): ₺19,99 / 39,99 / 79,99.

- İpucu üç boyda, büyük paket adet başına ucuzlar (0,099 → 0,066 → 0,050 $). Oyun cömert kalır: her gün 3 ipucu, seri, hat sonu ve sandık ipucu verir, ödüllü video +2; paketler acele edenler için.
- Güçlendirici paketi 12 güçlendirici verir; sandığın sıradan ödülü 1 güçlendirici olduğundan 1,99 $ yaklaşık 10 sandıklık güçlendiriciye denk gelir ama sandığın asıl ödülü (tren kaplaması, kalkan) parayla satılmaz.
- Taç paketi 50 👑 ≈ 50 kusursuz bölüm. Temalar 5–560 👑 arasında olduğundan bir paket bir-iki orta tema eder; bütün temaları isteyen için Tema paketi (3,99 $) daha uygundur. Satın alınan taç ayrı sayılır, sandık açmaz (BOLUM_TASARIMI › Taç ekonomisi).
- Tema paketi (3,99 $) Reklamsız paketten (2,99 $) pahalıdır: 22 temayı taçla toplamak yüzlerce kusursuz bölüm ister.

Uygulamanın davranışı (robot: `tools/hakem/gelir-olcum.cjs`):

- Tüketilebilir: mağaza işlemi onaylayınca ödül kayda yazılır, kaydın yazıldığı doğrulanır, **sonra** işlem bitirilir (Play'de consume, iOS'ta finish). Aynı işlem yeniden gelirse (uygulama arada kapandıysa) işlem kimliği kayıtta olduğundan ödül ikinci kez verilmez, işlem yine bitirilir. Kayıt yazılamazsa işlem açık kalır ve sonraki açılışta yeniden gelir.
- Geri yükleme yalnız tüketilemezleri getirir (Reklamsız paket, Tema paketi).
- İlerlemeyi taşı kodu iki tüketilemez paketi taşımaz; satın alınan ipucu/güçlendirici/taç kayıttaki sayılarla taşınır.
- Web'de ya da mağaza dışı APK'da yalnız Reklamsız paket satırı ve "Paketler mağazadan indirilen sürümde açılır" notu görünür.

Kayıt adımları:

- **Play Console:** Para kazanma › Ürünler › Uygulama içi ürünler › Ürün oluştur. Kimlik, ad, açıklama, varsayılan fiyat; sonra ülke fiyatları (ABD tabanlı şablon kullanıyorsan ürünleri o şablona bağla, Türkiye'yi elle düzelt). Etkinleştir.
- **App Store Connect:** Uygulama › Uygulama İçi Satın Almalar › +. Tür (Consumable / Non-Consumable), Referans adı, Ürün kimliği, Fiyat (taban ABD), Türkiye elle, iki dilde görünen ad ve açıklama, inceleme ekran görüntüsü (Ayarlar › Mağaza penceresi). İlk sürümde ürünleri sürümle birlikte incelemeye gönder.

## 11. İnceleme notları

**App Store › Uygulama inceleme bilgileri**

- Oturum açma gerekli: Hayır.
- Not (İngilizce yaz):

```text
No account or sign-in. The game works fully offline; ads (Google AdMob) only load when online. Levels unlock with stars, so the first levels are enough to review the core loop. All in-app purchases are in Settings (top right on the home screen) > "Shop": Ad-free Pack (ray_reklamsiz) and Theme Pack (ray_temalar) are non-consumable and can be restored with the button in the same sheet; hint packs (ray_ipucu_10/30/80), Booster Pack (ray_guclendirici) and 50 Crowns (ray_tac_50) are consumable. Purchased crowns can only be spent on color themes, never on the surprise chest. Gameplay analytics (Firebase, no advertising ID) is off in regions where consent is required. The UI follows the device language (English or Turkish) and can be changed in Settings > Language. The ATT prompt appears on first launch after the consent step.
```

**Google Play › Uygulama erişimi**: "Tüm işlevler herhangi bir özel erişim olmadan kullanılabilir."

## 12. Kullanıcının yapacakları (kontrol listesi)

Hesaplar

- [ ] Google Play Console geliştirici hesabı (25 $ tek seferlik) ve kimlik doğrulama. Kişisel hesapta üretime çıkmadan önce en az 12 test kullanıcısıyla 14 gün kapalı test şartı var; testçi listesini erken hazırla.
- [ ] Apple Developer Program (yıllık 99 $). App Store Connect › Sözleşmeler: ücretli uygulama sözleşmesi, vergi ve banka bilgileri (uygulama içi satın alma bunlarsız çalışmaz).
- [ ] İki mağazada AB Dijital Hizmetler Yasası tacir beyanı. Reklam ve satın almayla gelir elde eden geliştirici genelde "tacir" sayılır; adres, telefon ve e-posta AB'de herkese açık gösterilir.

AdMob

- [ ] AdMob hesabı; Android ve iOS için ayrı uygulama (`com.osmanadali.ray`).
- [ ] Her platformda iki birim: geçiş (interstitial) ve ödüllü (rewarded), toplam dört birim.
- [ ] Kimlikleri GitHub › Settings › Variables'a gir: `ADMOB_APP_ID_ANDROID`, `ADMOB_INTERSTITIAL_ANDROID`, `ADMOB_REWARDED_ANDROID` ve iOS karşılıkları `ADMOB_APP_ID_IOS`, `ADMOB_INTERSTITIAL_IOS`, `ADMOB_REWARDED_IOS` (yayın iş akışları `magaza-yerel` dalında). Derleme bunları `window.RAY_ADS` olarak `index.html`'e yazar; yoksa test reklamı çıkar.
- [ ] AdMob › Gizlilik ve mesajlaşma: AB/BK rıza mesajı (GDPR), ABD eyalet mesajı ve iOS için IDFA açıklama mesajı oluştur ve yayınla.
- [ ] AdMob › Engelleme denetimleri: en yüksek reklam içeriği derecesi PG (uygulamadaki ayarla aynı; iOS için §8'deki nota bak).
- [ ] app-ads.txt: AdMob'un verdiği satırı (`google.com, pub-1478688740631972, DIRECT, f08c47fec0942fa0`) `https://osmanadali.github.io/app-ads.txt` adresine koy (alan adının kökünde olmalı; bunun için `osmanadali.github.io` adlı ayrı bir depo gerekir). Mağaza girişlerinde web sitesi olarak `https://osmanadali.github.io` yaz. Yoksa AdMob uyarı verir ve reklam geliri düşebilir.

Ölçüm (Firebase Analytics, isteğe bağlı; ayrıntı `docs/YAYIN.md` §5)

- [ ] Firebase projesi; Android uygulaması `com.osmanadali.ray` (test APK'ları için ayrıca `com.osmanadali.ray.dev`, `com.osmanadali.ray.test`) ve iOS uygulaması `com.osmanadali.ray`.
- [ ] GitHub gizli değerleri: `FIREBASE_ANDROID_JSON` (google-services.json, base64), `FIREBASE_IOS_PLIST` (GoogleService-Info.plist, base64). Yoksa ölçüm kapalı derlenir.
- [ ] Veri saklama süresi 14 ay; Google sinyalleri ve reklam bağlantıları kapalı; AdMob–Firebase bağlantısı yapılırsa `ad_impression` olaylarının ikiye katlanmadığını DebugView'da kontrol et.
- [ ] Ölçümle yayımlarsan Veri güvenliği (§6) ve App Privacy (§7) Firebase satırları eklenmeli; ölçümsüz yayımlarsan eklenmez.

Gizlilik ve yayın sayfası

- [ ] `www/gizlilik.html` içindeki `[geliştirici adı]` ve `[iletişim e-postası]` yer tutucularını doldur (`magaza-reklam` dalı).
- [ ] GitHub Pages'i aç (onayınla) ve `web.yml` push tetikleyicisini geri getir; gizlilik adresinin açıldığını tarayıcıda doğrula.

İmza

- [ ] Play App Signing'i kullan. Yükleme anahtarını (keystore) oluştur, güvenli bir yere **yedekle**, GitHub gizlerine koy: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
- [ ] iOS: dağıtım sertifikası, App Store profili ya da App Store Connect API anahtarı (`ios.yml`, `magaza-yerel` dalı).

Mağaza

- [ ] Play'de ve App Store Connect'te uygulama kaydı (paket `com.osmanadali.ray`, birincil dil Türkçe, ikinci dil İngilizce).
- [ ] Uygulama içi ürünler (§10) iki mağazada oluşturulup etkinleştirilmeli: `ray_reklamsiz`, `ray_temalar` (tüketilemez) ve `ray_ipucu_10`, `ray_ipucu_30`, `ray_ipucu_80`, `ray_guclendirici`, `ray_tac_50` (tüketilebilir). Kimlikler iki mağazada aynı yazılmalı.
- [ ] Öteki ürünlerin fiyatları (§10.2): ABD taban 0,99 / 1,99 / 3,99 $, Türkiye elle ₺19,99 / 39,99 / 79,99.
- [ ] Uygulama fiyatı: iki mağazada **Ücretsiz** (Play'de "Ücretsiz", App Store'da 0,00 $).
- [ ] Reklamsız paket fiyatı (§10.1): App Store'da taban ülke ABD 2,99 $, Türkiye elle ₺59,99. Play'de ABD 2,99 $ · AB 2,99 € · BK 2,49 £ elle (ya da USD tabanlı şablon). Taban Türkiye bırakılmaz.
- [ ] Metinleri (§4, §5) ve görselleri (§2) yükle.
- [ ] Formlar: Veri güvenliği (§6), App Privacy (§7), yaş derecelendirmesi (§8), hedef kitle ve öteki beyanlar (§9), inceleme notları (§11).
- [ ] Gerçek cihazda son deneme: rıza penceresi, iOS ATT penceresi, reklam, satın alma ve geri yükleme (Play lisans test hesabı, Apple Sandbox). Tüketilebilir bir paketi iki kez al (ikisi de verilmeli), uygulamayı satın alma sırasında kapatıp aç (ödül bir kez gelmeli); Firebase DebugView'da `level_start`/`level_end` görünmeli.
- [ ] Yayın: Play'de iç test → kapalı test (14 gün) → üretim. iOS'ta TestFlight → incelemeye gönder.

## 13. Bilinen sınırlar

- **İki dil.** Oyun Türkçe ve İngilizcedir (28 Ekim 2026). İngilizce mağaza girişi İngilizce ekran görüntüleriyle (`store/screens-en/`) yüklenir. Altyapı ve sözlük: `docs/CEVIRI.md`.
- **Kural sayısı.** Açıklama 18 kuralın hepsini sayar (çift hatların zor kuralları 28 Ekim'de eklendi; tam açıklama ~90 karakter uzadı, 4000 sınırının yine altında). 5. ekran görüntüsünün alt satırı eski 12 kurallı listeyi gösterir; istenirse `tools/store-shots.cjs` ile yeniden üretilir.
- **Görseller çalışan koda bağlı.** Arayüz değişince `node tools/store-shots.cjs` yeniden çalıştırılmalı. Sahneler bölüm numarasıyla kurulur (180, 45, 829…); üretim değişirse aynı numara farklı bir tahta verebilir, çıktı gözle kontrol edilmeli.
- **Veri ve gizlilik yanıtları** AdMob'un ve Firebase Analytics'in Ekim 2026 itibarıyla bilinen davranışına göredir. Gönderimden önce §6 ve §7'deki Google bağlantılarıyla karşılaştırılmalı.
- **Silme düğmesi ve rıza penceresi** `magaza-reklam` dalında, iOS projesi ve imzalı derleme `magaza-yerel` dalındadır; bu belge o dallar `main`e birleşmiş gibi yazıldı.
