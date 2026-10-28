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
| 1 | `01-ana` | Hatları bağla, şehri canlandır | Tek elle · internetsiz · her gün yeni bir Günün Hattı | Ana ekran: 12 günlük seri, Günün Hattı, M9 |
| 2 | `02-oyun` | Dokun, döndür, hattı yak | Bütün durakları merkeze bağla, açık uç kalmasın | Bölüm 180 (M8, iki merkez), hat yarıya kadar yanmış |
| 3 | `03-kazan` | Kusursuz bitir, taç kazan | Süre ve hamle hedefini tuttur, üç yıldızı topla | Bölüm 45 kusursuz: 3 yıldız, taç, 5'li seri bonusu |
| 4 | `04-harita` | 20 hat, sonu gelmeyen bölüm | Her bölüm bir öncekinden biraz daha zor | Hat haritası: biten M9, süren M10 |
| 5 | `05-kural` | Hat ilerledikçe yeni kurallar | Makas, köprü, tabela, döner tabla, halka, tünel ağzı… | Tünel ağzı kural kartı (M19) |
| 6 | `06-tema` | Taç topla, 25 renk teması aç | Kusursuz bitirdiğin her bölüm bir taç kazandırır | Renk temaları penceresi |
| 7 | `07-sandik` | Sürpriz sandık, yeni trenler | İpucu, seri kalkanı ya da yeni bir tren kaplaması | Sandık açılışı: destansı Lavanta kaplaması |

Öne çıkan görsel: koyu lacivert zemin, yeni R simgesi, "Ray", "Hatları bağla · Şehri canlandır" ve üç rozet (Tek elle, İnternetsiz, Metro bulmacası).

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

Uygulamanın kendisi hiçbir veriyi sunucuya göndermez: hesap yok, analitik yok, çökme raporu aracı yok, ilerleme yalnız cihazdaki depoda. Formda beyan edilecek veriyi yalnız **Google Mobile Ads SDK (AdMob)** toplar. Satın almayı Google Play yürütür; uygulama ödeme bilgisi görmez.

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

Toplanmayanlar: kişisel bilgiler (ad, e-posta, adres, telefon), finansal bilgiler ve satın alma geçmişi (Google Play yürütür), sağlık, mesajlar, fotoğraf ve video, ses, dosyalar, takvim, kişiler, web tarama, kesin konum.

Gönderimden önce Google'ın güncel tablosuyla son kez karşılaştır: https://developers.google.com/admob/android/privacy/play-data-disclosure

**Silme yolu** (gizlilik politikasıyla aynı):

- Oyun verisi: Ayarlar › Gizlilik › Verilerimi sil (bu düğme `magaza-reklam` dalıyla gelir) ya da uygulamayı kaldırmak.
- Reklam verisi: Android ayarlarından reklam kimliğini sıfırlamak ya da silmek; AB/BK/İsviçre ve ilgili ABD eyaletlerinde rıza seçimini Ayarlar › Gizlilik › Reklam gizlilik seçenekleri ile değiştirmek.

**Reklam kimliği beyanı** (Uygulama içeriği › Reklam kimliği): Evet, kullanıyor. Amaç: Reklam veya pazarlama, Analiz, Dolandırıcılığı önleme. `AD_ID` izni AdMob kitaplığıyla bildirime kendiliğinden eklenir; yayın derlemesinde birleşik bildirimde göründüğünü doğrula.

## 7. Apple "App Privacy" etiketleri

Geliştirici veri toplamaz; etiketler AdMob SDK içindir. iOS'ta izleme (IDFA) yalnız kullanıcı ATT penceresinde izin verirse olur, bu yüzden izleme beyan edilir ve ATT penceresi gösterilir (`magaza-reklam` dalı).

| Apple veri türü | Amaç | Kimliğe bağlı mı | İzleme için mi |
|---|---|---|---|
| Tanımlayıcılar › Aygıt kimliği (IDFA, IDFV) | Üçüncü taraf reklam · Analiz | Hayır | Evet (IDFA, yalnız ATT izniyle) |
| Kullanım verileri › Reklam verileri | Üçüncü taraf reklam · Analiz | Hayır | Evet |
| Kullanım verileri › Ürün etkileşimi | Üçüncü taraf reklam · Analiz | Hayır | Evet |
| Konum › Yaklaşık konum (IP'den) | Üçüncü taraf reklam · Analiz | Hayır | Hayır |
| Tanılama › Çökme verileri, Performans verileri, Diğer tanılama verileri | Üçüncü taraf reklam · Analiz | Hayır | Hayır |

Ürün sayfasında beklenen görünüm: "Sizi izlemek için kullanılan veriler: Tanımlayıcılar, Kullanım verileri" ve "Sizinle ilişkilendirilmeyen veriler: Konum, Tanılama, Kullanım verileri, Tanımlayıcılar". "Sizinle ilişkilendirilen veri" bölümü çıkmaz.

Google'ın iOS tablosu: https://developers.google.com/admob/ios/privacy/data-disclosure. Google Mobile Ads SDK kendi gizlilik bildirimini (`PrivacyInfo.xcprivacy`) taşır; Capacitor da öyle.

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
| Dijital ürün satın alma | Evet (Reklamsız paket) |
| Parayla satın alınan rastgele ödül (ganimet kutusu) | Hayır. Sürpriz sandık yalnız oyunda kazanılan taçla açılır; taç gerçek parayla satılmaz, sandıktan taç çıkmaz. |
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

## 10. Uygulama içi ürün: Reklamsız paket

| Alan | Google Play | App Store Connect |
|---|---|---|
| Kimlik | `ray_reklamsiz` | `ray_reklamsiz` |
| Tür | Tek seferlik ürün (uygulama içi ürün, tüketilemez) | Non-Consumable (tüketilemez) |
| Ad (TR / EN) | Reklamsız paket / Ad-free Pack | Reklamsız paket / Ad-free Pack (12) |
| Açıklama TR | `Bölüm aralarındaki reklamları kaldırır, 20 ipucu hediye eder ve 3 özel temayı (Altın, Elmas, Yakut) açar. Tek seferlik, ömür boyu.` | `Reklamlar kalkar, 20 ipucu ve 3 özel tema` (45) |
| Açıklama EN | `Removes the ads between levels, gives you 20 hints and unlocks 3 exclusive themes (Gold, Diamond, Ruby). One-time purchase, yours forever.` | `No ads between levels, 20 hints, 3 themes` (45) |
| Fiyat önerisi | ₺59,99 · 2,99 $ (öteki ülkeler otomatik) | Taban ülke Türkiye, ₺59,99'a en yakın fiyat noktası; öteki ülkeler otomatik |
| İnceleme için | Lisans test hesabıyla dene | İnceleme ekran görüntüsü: Ayarlar › Reklamsız paket penceresi (cihazdan alınır) |

Fiyat gerekçesi: benzer bulmaca oyunlarında reklam kaldırma 2–5 $ arasıdır. Paket yalnız geçiş reklamlarını kaldırır (ödüllü videolar isteğe bağlı kalır), üstüne 20 ipucu ve 3 tema verir; alt uçta bir fiyat ilk satın almayı kolaylaştırır.

Geri yükleme: pencerede "Satın alımı geri yükle" düğmesi var (Apple bunu ister).

## 11. İnceleme notları

**App Store › Uygulama inceleme bilgileri**

- Oturum açma gerekli: Hayır.
- Not (İngilizce yaz):

```text
No account or sign-in. The game works fully offline; ads (Google AdMob) only load when online. Levels unlock with stars, so the first levels are enough to review the core loop. The Ad-free Pack in-app purchase (ray_reklamsiz) is in Settings (top right on the home screen) > "Ad-free pack", with a restore button in the same sheet. The UI follows the device language (English or Turkish) and can be changed in Settings > Language.
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
- [ ] app-ads.txt: AdMob'un verdiği satırı `https://osmanadali.github.io/app-ads.txt` adresine koy (alan adının kökünde olmalı; bunun için `osmanadali.github.io` adlı ayrı bir depo gerekir). Mağaza girişlerinde web sitesi olarak `https://osmanadali.github.io` yaz. Yoksa AdMob uyarı verir ve reklam geliri düşebilir.

Gizlilik ve yayın sayfası

- [ ] `www/gizlilik.html` içindeki `[geliştirici adı]` ve `[iletişim e-postası]` yer tutucularını doldur (`magaza-reklam` dalı).
- [ ] GitHub Pages'i aç (onayınla) ve `web.yml` push tetikleyicisini geri getir; gizlilik adresinin açıldığını tarayıcıda doğrula.

İmza

- [ ] Play App Signing'i kullan. Yükleme anahtarını (keystore) oluştur, güvenli bir yere **yedekle**, GitHub gizlerine koy: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
- [ ] iOS: dağıtım sertifikası, App Store profili ya da App Store Connect API anahtarı (`ios.yml`, `magaza-yerel` dalı).

Mağaza

- [ ] Play'de ve App Store Connect'te uygulama kaydı (paket `com.osmanadali.ray`, birincil dil Türkçe, ikinci dil İngilizce).
- [ ] Uygulama içi ürün `ray_reklamsiz` (§10) iki mağazada oluşturulup etkinleştirilmeli.
- [ ] Metinleri (§4, §5) ve görselleri (§2) yükle.
- [ ] Formlar: Veri güvenliği (§6), App Privacy (§7), yaş derecelendirmesi (§8), hedef kitle ve öteki beyanlar (§9), inceleme notları (§11).
- [ ] Gerçek cihazda son deneme: rıza penceresi, iOS ATT penceresi, reklam, satın alma ve geri yükleme (Play lisans test hesabı, Apple Sandbox).
- [ ] Yayın: Play'de iç test → kapalı test (14 gün) → üretim. iOS'ta TestFlight → incelemeye gönder.

## 13. Bilinen sınırlar

- **İki dil.** Oyun Türkçe ve İngilizcedir (28 Ekim 2026). İngilizce mağaza girişi İngilizce ekran görüntüleriyle (`store/screens-en/`) yüklenir. Altyapı ve sözlük: `docs/CEVIRI.md`.
- **Kural sayısı.** Açıklama 18 kuralın hepsini sayar (çift hatların zor kuralları 28 Ekim'de eklendi; tam açıklama ~90 karakter uzadı, 4000 sınırının yine altında). 5. ekran görüntüsünün alt satırı eski 12 kurallı listeyi gösterir; istenirse `tools/store-shots.cjs` ile yeniden üretilir.
- **Görseller çalışan koda bağlı.** Arayüz değişince `node tools/store-shots.cjs` yeniden çalıştırılmalı. Sahneler bölüm numarasıyla kurulur (180, 45, 829…); üretim değişirse aynı numara farklı bir tahta verebilir, çıktı gözle kontrol edilmeli.
- **Veri ve gizlilik yanıtları** AdMob'un Ekim 2026 itibarıyla bilinen davranışına göredir. Gönderimden önce §6 ve §7'deki Google bağlantılarıyla karşılaştırılmalı.
- **Silme düğmesi ve rıza penceresi** `magaza-reklam` dalında, iOS projesi ve imzalı derleme `magaza-yerel` dalındadır; bu belge o dallar `main`e birleşmiş gibi yazıldı.
