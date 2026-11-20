# Ray: Metro Bulmaca · Topluluk ve PR planı

Bu belge taslaktır. Hiçbir şey gönderilmedi, yayınlanmadı ya da bir mağazaya girilmedi. Metinlerin tamamı şablondur: köşeli parantezli alanları doldurmadan ve geliştiricinin onayı olmadan kullanma.

Hazırlık tarihi: 20 Kasım 2026 (Cuma). Lansman: 21 Kasım 2026 (Cumartesi).

---

## 0. Göndermeden önce çözülmesi gerekenler

Bu maddeler PR metinlerinin doğruluğunu etkiler. Biri açık kalırsa ilgili metni kullanma.

1. **"İnternetsiz" iddiası 1.2 ile çelişiyor.** 1.2'deki haftalık lig ve canlı kapışma, Firebase Firestore ve anonim giriş kullanır (`www/lig.js`, `firestore.rules`). Mağaza metinlerindeki "tek elle, internetsiz" alt başlığı, "internetsiz" geçen açıklama (`docs/MAGAZA.md` §4, §5, anahtar kelimeler), 1.1 sürüm notu ve bu belgedeki basın metni buna göre düzeltilmelidir. Bu taslakta "internetsiz" yerine "internetsiz de oynanır, lig ve kapışmalar için internet gerekir" anlamı kullanıldı. Ayrıca "Hesap gerekmez" ifadesi ile Veri güvenliği (§6) ve App Privacy (§7) beyanları, anonim kimlik ve ölçüm için yeniden kontrol edilmelidir.
2. **Google Play yayın koşulu.** `docs/MAGAZA.md` §12'ye göre kişisel geliştirici hesabında üretime çıkmadan önce en az 12 test kullanıcısıyla 14 gün kapalı test şartı var. 21 Kasım için bu şartın sağlanıp sağlanmadığı doğrulanmalı. Sağlanmadıysa lansman tarihi ertelenmeli ve basın bülteni ile e-postalardaki tarih değiştirilmelidir.
3. **Mağaza durumu.** Bu belge hazırlanırken App Store sayfası açıktı (`https://apps.apple.com/app/ray-metro-bulmaca/id6831928554`); sayfada sürüm 1.1 görünüyordu. Google Play bağlantısı (`https://play.google.com/store/apps/details?id=com.osmanadali.ray`) hâlâ 404 veriyordu, yani henüz yayında değil. "1.2 ne zaman App Store'a çıkıyor?" sorusu geliştiriciye sorulmalı. Basın bülteni iki mağazanın durumunu ayrı ayrı yazmalıdır.
4. **Web ve gizlilik sayfaları çalışıyor.** `https://osmanadali.github.io/mobil-oyun/` ve `.../gizlilik.html` 200 döndü. `docs/MAGAZA.md` §12 hâlâ "GitHub Pages'i aç" maddesini işaretsiz gösteriyor; kontrol listesi güncellenmeli.
5. **Ayarlar'daki buton adı.** Kodda buton "Ray’i değerlendir" (App Store › / Google Play ›) olarak geçiyor, "Mağazada değerlendir" olarak değil. Web sürümünde bu buton gizli (`www/game.js` satır 2345). Bu belgede gerçek etiket kullanıldı.
6. **Onay bekleyen alanlar.** Basın bülteni alıntısı, geliştiricinin şehri, yayın saati ve e-posta imzası geliştiriciye aittir. Bunlar onaylanmadan dışarı çıkmamalı.
7. **Yaş.** Hedef 13+. Yaş derecelendirme anketinin sonucu bu metinlerde varsayılmıştır; anketten sonra teyit edilmelidir.

**Kullanıcı kararları (uygulandı):**

8. **Öncelik Türkiye.** Türk siteleri ve Türk içerik üreticileri ilk sırada. İngilizce gönderimler ikinci dalgadadır.
9. **Kanallar.** Instagram hesabı var ve kullanılacak. TikTok ve Reddit yalnızca bu oyun için yeni açılacak. YouTube ve X kullanılmayacak; bu belgede bu kanallara ait şablonlar yoktur.
10. **Yüz ve ses yok.** Geliştirici kendi yüzünü ya da sesini kullanmayacak. Röportaj ya da video isteyenlere yazılı yanıt (e-posta ya da yazılı SSS) önerilir.
11. **Bütçe.** Yaklaşık 5.000 TL/ay reklam bütçesi. Ücretli tanıtım ve influencer ödemesi önerilmez. Yaklaşım ücretsiz kod, erken erişim ve organik paylaşımdır.
12. **Reddit hesabı yeni.** Yeni hesaplarda karma ve hesap yaşı kuralları geçerli olabilir; birçok topluluk yeni hesabın tanıtım gönderisine izin vermez. Kural: önce 2–4 hafta topluluğa katkı (yorum, geri bildirim, başkalarının işine yanıt), sonra oyun gönderisi. Bu süre dolmadan oyun linki paylaşılmaz. Hesap, oyun dışı konularda değil, ilgili topluluklarda aktif olmalı.

---

## 1. Basın bülteni

### 1a. Türkçe

**Başlık:** Ray: Metro Bulmaca, rayları döndür, şehri aydınlat

**Alt başlık:** Tek elle oynanan, sakin bir metro bulmacası. Ücretsiz, reklamlı; isteğe bağlı reklamsız paket.

**Tarih satırı:** [şehir], 21 Kasım 2026 (yayın tarihi onaylanınca güncellenecek)

**Metin:**

[Şehir] merkezli bağımsız oyun geliştiricisi Osman Adalı, metro temalı yeni bulmaca oyunu Ray: Metro Bulmaca'yı 21 Kasım 2026'da Google Play'de yayımlıyor. Oyun Android ve iPhone için ücretsiz indirilir; web sürümü tarayıcıda da açılır.

Oyunun kuralı basit: karoya dokunursun, ray 90 derece döner. Merkez istasyondan çıkan hat bütün duraklara ulaşana dek karoları döndürürsün, açıkta ray ucu kalmaz. Hat bağlandıkça şehir yanar. Her bölüm bir öncekinden biraz zordur ve oyun sakin bir tempoda ilerler: animasyonlar yalnızca bir şey hareket ederken çalışır, renk temaları koyu ve açık görünümü destekler.

Ray'in 1.2 sürümünde yeni oyuncular için adım adım bir öğretici, 7 yeni hat ve haftalık lig geliyor. Lig ve canlı kapışmalar, rastgele bir rakibe ya da arkadaşına karşı oynanır; bu özellikler internet bağlantısı gerektirir. Bölüm oynamak ise internet olmadan da mümkündür.

Oyun ücretsizdir. Bölüm aralarında ara sıra geçiş reklamı çıkar; reklamlar yalnızca internet varken gösterilir. Ödüllü videoları oyuncu kendisi izler. İsteyen oyuncular tek seferlik reklamsız paketi satın alabilir; paket geçiş reklamlarını kaldırır ve ek ipucu ile tema içerir.

**Öne çıkan özellikler**

- Tek elle oynanır; karoya dokun, ray döner.
- 24 metro hattı, her hat yeni bir kural getirir; kurallar bölüm bölüm tanıtılır.
- Her gün yeni bir Günün Hattı; haftanın kuralı pazar günü gelir.
- Kusursuz bitirilen bölümlerden bilet kazanılır; biletlerle renk teması açılır.
- 1.2: yeni oyuncular için öğretici, 7 yeni hat, haftalık lig, canlı kapışma (internet gerekir).
- Sakin tasarım: koyu ve açık görünüm, yumuşak renkler, müzik, ses ve titreşim ayrı ayrı kapatılabilir.
- Oyuncu hesabı ya da kayıt formu yok; ilerleme oyuncunun cihazında kalır. (Hukuki metin, Veri güvenliği beyanı ile tutarlı olmalı; bkz. §0.1.)
- 9 dil: Türkçe, İngilizce, Almanca, İspanyolca, Portekizce (Brezilya), Fransızca, Korece, Japonca, Geleneksel Çince.

**Geliştiriciden alıntı** *(taslak; Osman Adalı onaylamadan kullanılmaz)*

> "Ray'i tek elle, sakin bir tempoda oynanabilsin diye yaptım. Bir bölümü bitirdiğinde şehirde bir hattın yandığını görmek, oyunun bana verdiği en büyük keyif. 1.2 ile yeni oyuncular için bir öğretici ve birlikte oynayabileceğimiz ligler ekledim."
> — Osman Adalı, bağımsız geliştirici

**Bağlantılar**

- Google Play: https://play.google.com/store/apps/details?id=com.osmanadali.ray (21 Kasım'a kadar 404 döner; yayın sonrası aktif olur)
- App Store: https://apps.apple.com/app/ray-metro-bulmaca/id6831928554
- Web sürümü: https://osmanadali.github.io/mobil-oyun/
- Gizlilik politikası: https://osmanadali.github.io/mobil-oyun/gizlilik.html
- Basın ve destek: osmanadali.apps@gmail.com

**Basın kiti (`store/` klasörü)**

| İçerik | Dosya | Not |
|---|---|---|
| Uygulama simgesi (Android) | `store/play-icon-512.png` | 512 × 512 |
| Uygulama simgesi (iOS) | `store/appstore-icon-1024.png` | 1024 × 1024 |
| Öne çıkan görsel (Türkçe) | `store/feature-graphic.png` | 1024 × 500 |
| Öne çıkan görsel (İngilizce) | `store/feature-graphic-en.png` | 1024 × 500 |
| Öne çıkan görsel (diğer diller) | `store/feature-graphic-{de,es,fr,ja,ko,pt-BR,zh-Hant}.png` | Aynı boy |
| Telefon ekran görüntüleri (Türkçe, Play) | `store/screens/play/01-oyun.png` … `07-sandik.png` | 1080 × 1920, 7 sahne |
| Telefon ekran görüntüleri (İngilizce, Play) | `store/screens-en/play/01-oyun.png` … `07-sandik.png` | Aynı sıra |
| iPhone 6,9" ekran görüntüleri | `store/screens/ios-69/` ve `store/screens-en/ios-69/` | 1320 × 2868, App Store için zorunlu boy |
| iPhone 6,5" (yedek) | `store/screens/ios-65/` | 1284 × 2778 |
| App Store başlık görselleri | `store/header/ios-header-tr.png`, `store/header/ios-header-en.png` | Kullanım amacı ayrıca teyit edilmeli |

Görseller saydamlık içermez ve iki mağazanın kuralına uygundur. Oyun arayüzü değişirse `node tools/store-shots.cjs` ile yeniden üretilmeli ve gözle kontrol edilmelidir. Sahne 1'deki "Bölüm 198" gibi bir numara, ekran değişince farklı bir tahta gösterebilir.

### 1b. English

**Headline:** Ray: Metro Line Puzzle, rotate the rails, light up the city

**Subheadline:** A calm, one-handed metro puzzle. Free to play with ads, with an optional ad-free pack.

**Dateline:** [City], November 21, 2026 (to be updated once the release date is confirmed)

**Body:**

[City]-based independent developer Osman Adalı releases Ray: Metro Line Puzzle, a metro-themed puzzle game, on Google Play on November 21, 2026. The game is free on Android and iPhone, and the web version also runs in a browser.

The rule is simple. Tap a tile and its rail turns 90 degrees. Keep rotating tiles until the line from the central station reaches every stop, with no loose rail ends. As the line connects, the city lights up. Each level is a little harder than the last, and the game moves at a calm pace: animations run only when something is moving, and the color themes support dark and light appearance.

Version 1.2 adds a step-by-step tutorial for new players, seven new lines, and a weekly league. Live duels against a random rival or a friend also arrive in 1.2. Duels and the league need an internet connection. Playing levels does not.

Ray is free. Occasional full-screen ads appear between levels, only when the device is online. Rewarded videos are optional and only shown when the player chooses to watch them. Players who want to remove the between-level ads can buy a one-time ad-free pack, which also includes extra hints and a theme.

**Key features**

- One-handed play: tap a tile and the rail turns.
- 24 metro lines, each with a new rule that is introduced step by step.
- A new Daily Line every day, with a weekly rule on Sundays.
- Flawless levels earn tickets; tickets unlock color themes.
- 1.2: tutorial for new players, seven new lines, weekly league, live duels (internet required).
- Calm design: dark and light appearance, soft colors, and separate controls for music, sound and vibration.
- No sign-up form and no personal details requested; progress stays on the device. (Legal wording must match the data-safety declarations; see section 0.1.)
- Nine languages: Turkish, English, German, Spanish, Brazilian Portuguese, French, Korean, Japanese and Traditional Chinese.

**Quote from the developer** *(draft; not to be used before Osman Adalı approves it)*

> "I wanted a puzzle you could play with one hand, at a calm pace. Finishing a level and seeing a line light up across the city is the best part for me. With 1.2, I added a tutorial for new players and leagues we can play together."
> — Osman Adalı, independent developer

**Links**

- Google Play: https://play.google.com/store/apps/details?id=com.osmanadali.ray (returns 404 until the release is live)
- App Store: https://apps.apple.com/app/ray-metro-bulmaca/id6831928554
- Web version: https://osmanadali.github.io/mobil-oyun/
- Privacy policy: https://osmanadali.github.io/mobil-oyun/gizlilik.html
- Press and support: osmanadali.apps@gmail.com

**Press kit:** use the same files as the Turkish kit, with the English versions: `store/feature-graphic-en.png`, `store/screens-en/play/` and `store/screens-en/ios-69/`. The icons are the same in both languages.

---

## 2. E-posta şablonları

Öncelik sırası (Türkiye öncelikli): 2b Türk siteleri, 2c Türk içerik üreticileri (Instagram/TikTok), sonra 2a İngilizce siteler. YouTube ve X kullanılmıyor. Geliştirici yüz ya da ses kullanmıyor; röportaj ya da video yerine yazılı yanıt verilir.

Kurallar:

- Kişiselleştirme alanları köşeli parantez içinde: `[ad]`, `[site]`, `[yazı başlığı]`.
- Hedef sitenin **iletişim adresini uydurma**. Adresi sitenin "İletişim", "Bize ulaşın" ya da "Basın" sayfasından bul. Adres bulunamazsa o siteye e-posta gönderme; sosyal medya hesabındaki mesaj kutusu tercih edilir.
- Her e-posta tek bir siteye gider. Toplu gönderim yapma.
- Gönderimden önce bağlantıları tıklayıp açtığını kontrol et. 21 Kasım'a kadar Play bağlantısı 404 döner; e-postayı ancak yayın sonrası gönder ya da bağlantıyı App Store ve web ile birlikte ver.
- Bir hafta yanıt gelmezse bir kez takip et (bkz. 2e). Üçüncü bir e-posta gönderme.

### 2a. Oyun blogları ve siteleri (İngilizce)

Hedefler (örnek): TouchArcade, Pocket Tactics, Droid Gamers, 148Apps. Her birinin inceleme ve haber için farklı bir iletişim sayfası olabilir; her biri için ayrı kontrol et.

**Konu:** [Oyun adı] for [site] · a calm one-handed metro puzzle, free and offline (basın kiti ekte)

```
Hi [ad],

I'm Osman Adalı, a solo developer in [city]. I'm writing to let you know about Ray: Metro Line Puzzle, a calm rail-rotation puzzle for iPhone, Android and the web.

You tap a tile to turn its rail 90 degrees, and you connect the central station to every stop. The game has 24 rule-lines that each add one new mechanic, a daily puzzle, and a surprise chest. It plays one-handed and needs no internet connection for levels. Version 1.2 adds a tutorial, a weekly league and live duels (these need internet).

Ray is free with optional between-level ads and a one-time ad-free pack.

Links:
- App Store: https://apps.apple.com/app/ray-metro-bulmaca/id6831928554
- Google Play (live from November 21): https://play.google.com/store/apps/details?id=com.osmanadali.ray
- Web version: https://osmanadali.github.io/mobil-oyun/
- Press kit (icons, feature graphic, screenshots): [paylaşım bağlantısı; kit'i ayrıca zip olarak hazırla]

If you'd like a review code or a quick walkthrough, reply here and I'll set it up. [Test erişimi için mağazanın kendi yolu kullanılacak; bkz. not.]

Thank you for your time,
Osman Adalı
Independent developer, Ray
osmanadali.apps@gmail.com
```

Not: Oyun ücretsiz olduğu için inceleme için ekstra kod gerekmez. Reklamsız paketi görmek isteyen olursa, mağazanın test hesabı mekanizmasını (Google Play lisans test hesabı, Apple sandbox) kullan; kod paylaşma.

### 2b. Türk oyun siteleri ve teknoloji siteleri

Hedefler (örnek): ShiftDelete, Webtekno, DonanımHaber, Oyungezer. İletişim adreslerini sitelerin kendi sayfalarından bul.

**Konu:** Yerli bağımsız yapım: Ray: Metro Bulmaca, tek elle oynanan sakin bir metro bulmacası

```
Merhaba [ad],

Ben Osman Adalı, [şehir]'de tek başıma çalışan bir bağımsız oyun geliştiriciyim. Yeni oyunum Ray: Metro Bulmaca'yı [site] okurlarıyla paylaşmak istedim.

Oyunda karoya dokunarak rayı 90 derece döndürüyor ve merkez istasyondan çıkan hattı bütün duraklara bağlıyorsun. 24 metro hattı var; her hat yeni bir kural getiriyor. Tek elle oynanıyor, bölümler internet olmadan açılıyor. 21 Kasım 2026'da Google Play'de, App Store'da ve tarayıcıda ücretsiz olarak yayında olacak. [App Store durumu yayın tarihine göre güncellenecek.]

Oyun ücretsiz; bölüm aralarında ara sıra reklam çıkıyor, isteyen oyuncular tek seferlik reklamsız paketi satın alabiliyor. 1.2 sürümünde yeni oyuncular için öğretici, haftalık lig ve canlı kapışma da var (bunlar internet gerektirir).

Bağlantılar:
- App Store: https://apps.apple.com/app/ray-metro-bulmaca/id6831928554
- Google Play: https://play.google.com/store/apps/details?id=com.osmanadali.ray
- Web: https://osmanadali.github.io/mobil-oyun/
- Basın kiti: [paylaşım bağlantısı]

Haber olarak yazmak ya da kısa bir inceleme yapmak isterseniz, ekran görüntüleri ve tam metin için bu adrese yazabilirsiniz: osmanadali.apps@gmail.com

Teşekkürler,
Osman Adalı
Ray: Metro Bulmaca geliştiricisi
```

### 2c. Türk içerik üreticileri (Instagram ve TikTok; YouTube kullanılmayacak)

Kapsam: Yalnızca Instagram ve TikTok hesabı olan küçük oyun ve bulmaca hesapları. Geliştirici yüz ya da ses kullanmaz; bu yüzden video, canlı yayın ya da röportaj teklif edilmez. Hesap sahibi görsel ya da yazılı içerik isterse, ekran görüntüsü seti ve yazılı yanıt verilir. Ücretli iş birliği önerilmez (bütçe kararı, bkz. §0.11); ücretsiz kod ve erken erişim ile ilerlenir.

**Türkçe**

**Konu:** Ray: Metro Bulmaca, hesabın için ücretsiz bir bulmaca oyunu

```
Merhaba [ad],

[hesap adı] üzerinde [somut bir paylaşım] gördüm, [somut bir detay] kısmı hoşuma gitti. Ben Osman Adalı, Ray: Metro Bulmaca'nın geliştiricisiyim. Oyun raylarını döndürüp durakları bağladığın, sakin ve tek elle oynanan bir metro bulmacası.

21 Kasım'dan itibaren ücretsiz. İstersen oyunun ekran görüntülerini ve kısa bir açıklamayı hesabında paylaşabilirsin. Ücretsiz erken erişim kodu ya da reklamsız paketin test erişimi gerekirse yazabilirsin. Oyunu tanıtman için ücret ödemiyorum; bu bir öneri, zorunluluk değil. Sorularını yazılı olarak yanıtlayabilirim.

Oyun linki: https://apps.apple.com/app/ray-metro-bulmaca/id6831928554 (App Store) ve https://osmanadali.github.io/mobil-oyun/ (web).

Basın kiti ve ekran görüntüleri: [paylaşım bağlantısı].

Teşekkürler,
Osman Adalı
```

Not: Paylaşım karşılığında ödeme, ürün ya da başka bir menfaat verilirse, paylaşımda "işbirliği" ya da "reklam" etiketi kullanılması gerekir (Türkiye'deki reklam düzenlemeleri ve platform kuralları). Bu şablondaki "ücret ödemiyorum" cümlesi yalnızca ücretsiz paylaşım içindir; bir teklif yapılırsa metni değiştir ve hukuki kontrolünü yaptır.

**English** *(yalnızca İngilizce yayın yapan hesaplar için; ikinci dalga)*

**Subject:** A calm metro puzzle, free, with a free early code if useful (Ray: Metro Line Puzzle)

```
Hi [name],

I liked your [post title] and [specific detail]. I'm Osman Adalı, the developer of Ray: Metro Line Puzzle, a calm one-handed puzzle about rotating rails and connecting stations.

It's free and launches on November 21. If you'd like to share it with your followers, screenshots and a short written description are ready in the press kit. If you need a free early code, tell me and I'll arrange it. There's no payment attached; it's an offer, not an obligation. I'm happy to answer questions in writing.

Links:
- App Store: https://apps.apple.com/app/ray-metro-bulmaca/id6831928554
- Google Play (live from November 21): https://play.google.com/store/apps/details?id=com.osmanadali.ray
- Web: https://osmanadali.github.io/mobil-oyun/

Press kit and screenshots: [share link]

Thanks,
Osman Adalı
```

### 2d. Kısa bir ilk yanıt (reddit, Discord ya da sosyal medya DM'i)

Kullanım: birisi oyunu sorduğunda ya da bir içerik üreticisi kısa cevap verdiğinde.

```
Thanks for the interest! Ray is a free, one-handed metro puzzle (rotate rails, connect stations). Links: [App Store / Google Play / web]. Happy to answer anything.
```

### 2e. Takip e-postası (bir hafta sonra, yalnızca bir kez)

**Türkçe**

```
Merhaba [ad],

Bir hafta önce yazmıştım; yoğun bir dönemde olduğunuzu tahmin ediyorum. Bu yüzden sadece bir kez hatırlatmak istedim: Ray: Metro Bulmaca'nın basın kiti hâlâ [paylaşım bağlantısı] adresinde. Yanıtınız yoksa bu konuyu bir daha açmayacağım.

Teşekkürler,
Osman Adalı
```

**English**

```
Hi [name],

Following up once on my note from last week about Ray: Metro Line Puzzle. The press kit is still available at [share link]. If it isn't a fit, no need to reply; I won't follow up again.

Thanks,
Osman Adalı
```

---

## 3. Reddit planı

### 3a. Önce kural kontrolü (zorunlu)

- **Hesap yeni.** Reddit hesabı oyun için yeni açılacak. Yeni hesapların karma ve hesap yaşı şartlarını birçok topluluk uygular; bazıları yeni hesaptan tanıtım gönderisine hiç izin vermez. Kural: hesap açıldıktan sonra **en az 2–4 hafta** ilgili topluluklarda katkı yap (yorum, sorulara yanıt, geri bildirim, başkalarının oyununa yorum). Bu süre ve katkı tamamlanmadan oyun gönderisi paylaşılmaz. Hesap ve profil oyun tanıtımı için değil, gerçek bir katılımcı gibi görünmeli; profil açıklamasında geliştirici olduğu açıkça yazılabilir.
- Her subreddit'in **kenar çubuğunu ve kurallar sayfasını** paylaşımdan önce oku. Self-promo oranı, bayrak (flair) zorunluluğu, hesap yaşı ve karma şartları değişebilir. Bu belgede kural özetleri yazılmadı; eski olabilir.
- Hangi gönderinin hangi kurala tabi olduğunu kontrol et. Başlığında "geliştiriciyim" ya da "ben yaptım" gibi bir ifade açıkça yer alsın.
- Hesap, paylaşımdan önce normal etkileşimde bulunsun (yorumlar, başkalarının oyunlarına geri bildirim). Sadece kendi linkini paylaşan bir hesap görünmemeli.
- Aynı günde birden fazla subreddit'e gönderi atma; her subreddit için ayrı başlık ve metin yaz. Aynı metni kopyalama.
- Bağlantıyı gönderinin ana gövdesine koy; bağlantı yorum olarak ekle yalnızca kural buna izin veriyorsa.

### 3b. Subreddit planı

| Subreddit | Ne zaman | Gönderi tipi | Not |
|---|---|---|---|
| r/puzzles | Hesap yaşı ve katkı şartı sağlandıktan sonra; ilk tercih | Geliştirici gönderisi, tek bölüm GIF ya da ekran görüntüsü | Bulmaca odaklı; mekanik tanıtımı öne çıkar |
| r/WebGames | Hesap şartı sağlandıktan sonra | Web sürümü bağlantısı | Yalnızca web sürümü için; mobil mağaza bağlantısı burada ana bağlantı değil |
| r/AndroidGaming | Google Play yayınlandıktan ve hesap şartı sağlandıktan sonra | Play bağlantısı, kısa açıklama | Play linki 404'ten çıkmadan paylaşma |
| r/iosgaming | Hesap şartı sağlandıktan sonra | App Store bağlantısı | Kural ve bayrak kontrolü zorunlu |
| r/indiegaming | Yeni hesap için en son; lansmandan 1–2 hafta sonra | "Solo dev, feedback" gönderisi | Geri bildirim sorusu sor, sadece link koyma |
| r/playmygame | Yeni hesap için en son; lansmandan 1–2 hafta sonra | Geri bildirim isteği, spesifik soru | Bu subreddit'in format kuralını önce oku |

Not: Lansman gününde yeni hesapla gönderi planlanmıyor. §8'deki Reddit adımları, hesap şartını sağlamış bir hesap varsayar; sağlanmadıysa o adımlar atlanır.

Dikkat: r/WebGames ve r/indiegaming gibi topluluklar kendi kurallarına göre hareket eder. Sık sık kendi kural paylaşımlarını bulunduran topluluklarda ilk gönderi için mod mesajı gerekebilir; bu durumda yalnızca mod onayıyla paylaş.

### 3c. Gönderi taslakları (İngilizce)

**r/puzzles**

Title: `I made a calm one-handed metro puzzle: rotate the rails, connect every station (free, offline levels)`

```
Hi r/puzzles, I'm a solo developer and I just released Ray: Metro Line Puzzle.

You tap a tile and its rail turns 90 degrees. Your goal is to connect the central station to every stop, leaving no loose rail ends. Each metro line introduces one new rule (paired tiles, reverse tiles, sliding rows, tunnels, bridges, and more), and there are 24 of them before the game moves into mixed lines.

It's free, the levels work offline, and there's a new Daily Line every day.

I'd really like feedback on difficulty. Which level felt too hard, and did any new rule feel unclear? I'm happy to answer questions about how the levels are generated.

[App Store / Google Play link]
```

**r/WebGames**

Title: `Ray: a free browser rail-rotation puzzle, connect every metro stop`

```
Free browser version of Ray, a calm metro puzzle. Tap a tile to rotate its rail, and connect the central station to every stop without loose ends. Works without an account. The mobile versions are on the App Store and Google Play; this link is the web build.

[https://osmanadali.github.io/mobil-oyun/]
```

**r/AndroidGaming**

Title: `[Dev] Ray: Metro Line Puzzle, a calm one-handed puzzle on Google Play`

```
Hi, I'm the solo developer of Ray. It's a one-handed rail-rotation puzzle, free to play, with ads only between levels when you're online. There's a one-time ad-free pack, and nothing else is paid.

I'd appreciate feedback from Android players, especially on performance on different devices and on the new tutorial added in 1.2.

[Google Play link]
```

**r/iosgaming**

Title: `[Dev] Ray: Metro Line Puzzle, a calm one-handed puzzle on the App Store`

```
Hi, I'm the solo developer of Ray. It's a one-handed rail-rotation puzzle that works offline for levels; the league and live duels need internet. It's free with optional ads and an ad-free purchase.

I'd appreciate feedback on the controls and on the difficulty curve.

[App Store link]
```

**r/indiegaming**

Title: `Solo dev: Ray, a calm metro puzzle with 24 rule-lines. Feedback welcome`

```
I'm a solo developer and I'd like honest feedback on Ray, a metro puzzle I've been building.

The core loop: tap a tile to rotate its rail, connect every station. Each metro line adds a rule, from paired tiles to bridges and remote-controlled tiles. The levels are generated on the device, so the game works offline.

What I'd like to know: is the first hour clear? Does the tutorial in 1.2 explain the rules well enough?

[App Store / Google Play / web links]
```

**r/playmygame**

Title: `[Feedback] Ray, a calm one-handed metro puzzle. Is the first 12 levels clear?`

```
Looking for playtesters. Ray is a rail-rotation puzzle: tap a tile to turn the rail, connect the central station to every stop.

Specific questions:
1. Does the first line teach the rules clearly?
2. Did any level feel unfair?
3. Would you come back for the Daily Line?

[web link: https://osmanadali.github.io/mobil-oyun/]
```

### 3d. En iyi zaman

Bu bölüm bir başlangıç hipotezidir; gerçek veriyle değiştir.

- Hafta içi, ABD Doğu saatiyle sabah 9–11 arası (Türkiye saatiyle yaklaşık 16:00–18:00). Hafta sonu için lansman günü ayrı bir istisnadır; lansman 21 Kasım Cumartesi olduğu için ilk paylaşımları cumartesi öğleden sonra yap, pazar sabahı ikinci dalgayı planla.
- Her paylaşımdan sonra ilk iki saat yorumlara yanıt ver. Bu sürede etkileşim, gönderinin görünürlüğünü belirler.

### 3e. Yorumlara tavır

- Eleştiriye savunmacı yanıt verme. "Teşekkürler, not aldım" ve gerekiyorsa somut bir soru yeter.
- Hata bildirimi gelirse cihaz, işletim sistemi, uygulama sürümü ve dili iste. Gerekirse bunu e-postaya taşı.
- Spoiler ve çözüm paylaşımı konusunda dikkatli ol: bulmacanın çözümünü yorumda açıklama, yalnızca "bu bölümde hangi kural var" ya da "ipucu kullan" de.
- Reklam ya da satın alma şikayetine kısa, açıklayıcı yanıt ver (bkz. §5).
- Bir subreddit'in kuralı yorumda ticari bağlantıyı yasaklıyorsa, ek bağlantı vermeden yorumla.
- Bir yorum tekrar tekrar aynı sorunu söylüyorsa bunu not defterine al; haftada bir gözden geçir.

---

## 4. Discord

### 4a. Kendi sunucunu kurmalı mısın?

Öneri: **Lansman haftasında kurma.** Gerekçe:

- Lansman haftasında gelen geri bildirimin büyük kısmı e-posta ve mağaza yorumlarından gelir; bunları tek bir yerde takip etmek yeterli.
- Boş bir sunucu, aktif olmayan kanallar ve boş odalar yeni oyuncuda güven yaratmaz.
- Bir ya da iki haftalık veri ile (indirme, günlük aktif oyuncu, sık sorulan sorular) karar daha sağlıklı verilir.

Lansmandan iki hafta sonra şu ölçütlerden birini karşılıyorsa kur: düzenli olarak gelen soru ya da hata bildirimi sayısı gösteriyor ki bir sohbet yeri ihtiyaç; ya da birden fazla kişi sunucu sorduysa.

### 4b. Kurulursa basit kanal yapısı

- **#duyurular** (yalnızca geliştirici yazar): sürüm notları, bakım, yeni hatlar.
- **#geri-bildirim**: hata ve öneri için; hata bildirirken cihaz ve sürüm bilgisi istenir.
- **#bulmaca-yardimi**: çözümü gizli tutan yardım alanı; spoiler etiketi zorunlu.
- **#ekran-goruntuleri**: oyuncuların paylaşımı; kendi bölüm ekran görüntüleri.
- **#sohbet**: serbest sohbet.

Sunucu kuralları (kısa): saygı, spam yok, mağaza puanı için pazarlık yok, çözüm paylaşımında spoiler etiketi.

### 4c. Mevcut bulmaca ve indie sunucuları

Mevcut sunucuları Discord içinde arama ya da Disboard gibi dizinler üzerinden araştır. Bu belge belirli bir sunucu adresi vermez; bağlantıları uydurmamak için listeyi sen doldur. Bir sunucuya katılırken:

- Sunucunun tanıtım kuralına bak; çoğu sunucuda tanıtım yalnızca belirli bir kanalda ve kurallar dahilinde yapılır.
- Önce birkaç gün sohbete katıl, sonra tanıt.
- Tanıtımı "[oyun adı] · [bağlantı] · [kısa açıklama, bir cümle]" biçiminde tut.

---

## 5. Kullanıcı yorumlarına yanıt şablonları

Kurallar (her iki mağaza için geçerli olan genel ilkeler; güncel kılavuzu her seferinde kontrol et):

- Puan ya da yorum değiştirmek için ödül, indirim, oyun içi para ya da başka bir karşılık **teklif etme ve ima etme**.
- "Lütfen puanını artır" ya da "5 yıldız verirsen..." gibi ifadeler kullanma.
- Yanıtlarda kişisel bilgi (e-posta dışında) isteme; hata raporu için gerekirse osmanadali.apps@gmail.com adresini ver.
- Yanıtlar herkese açıktır; tonu sakin tut, kişisel tartışmaya girme.

Oyun içinde karşılığı olan yolları yanıtta doğru anlat:
- Reklamlar yalnızca internet bağlantısı varken gösterilir.
- Reklamsız paket: Ayarlar › Mağaza. Paket satın alındıysa "Satın alımı geri yükle" düğmesi aynı pencerededir.
- Günün Hattı'nda geçiş reklamı yoktur.
- İpucu: her gün en az 3, hat sonlarında ek ipucu.

### 5a. 5 yıldız: teşekkür

**Türkçe**
```
Çok teşekkür ederim! Rayları döndürüp şehri aydınlatmak sizin için keyifli olduysa, bu oyunu yapmak için yeterli sebep. Yeni hatlar ve 1.2'deki öğretici için yakında haberler olacak.
```

**English**
```
Thank you so much! I'm glad you're enjoying lighting up the city. More lines and the new tutorial are on the way.
```

### 5b. Hata bildirimi

**Türkçe**
```
Bildirdiğiniz sorun için teşekkürler, üzgünüm. Bunu inceleyebilmem için lütfen cihaz modelinizi, işletim sisteminizin sürümünü, oyun sürümünü (Ayarlar'da görünür) ve sorunun hangi bölümde ya da ekranda ortaya çıktığını yazar mısınız? Ekran görüntüsünü osmanadali.apps@gmail.com adresine gönderebilirsiniz.
```

**English**
```
Thanks for reporting this, and I'm sorry it happened. To look into it, could you share your device model, OS version, game version (shown in Settings) and the level or screen where it happened? You can email a screenshot to osmanadali.apps@gmail.com.
```

### 5c. Zorluk şikayeti

**Türkçe**
```
Zorlandığınızı anlıyorum. Her gün en az 3 ipucu alıyorsunuz ve hat sonlarında ek ipucu kazanıyorsunuz. Bölümlerin zorluğu hat hat artıyor; yeni bir kuralla karşılaştığınız bölümde takıldıysanız, hangi bölüm olduğunu yazarsanız bakabilirim.
```

**English**
```
I understand it can be tough. You get at least 3 hints every day and extra hints at the end of each line. Difficulty rises line by line; if you got stuck on a level after a new rule appeared, let me know which level and I'll take a look.
```

### 5d. Reklam şikayeti

**Türkçe**
```
Reklamları azaltmak istediğinizi anlıyorum. Oyunda reklamlar yalnızca internet bağlantısı varken ve bölüm aralarında ara sıra gösterilir; ödüllü videoları siz seçerek izlersiniz. Reklamları tamamen kaldırmak isterseniz Ayarlar › Mağaza bölümünde tek seferlik reklamsız paket var.
```

**English**
```
I hear you. Ads only show when you're online, and only between some levels. Rewarded videos are optional. If you'd like them gone entirely, the one-time ad-free pack is in Settings › Shop.
```

### 5e. Satın alma sorunu

**Türkçe**
```
Üzgünüm, satın alma sorun yarattıysa. Önce Ayarlar › Mağaza bölümünde "Satın alımı geri yükle" düğmesini deneyin. Hâlâ çözülmediyse, lütfen sipariş e-postanızı ve cihaz işletim sistemini osmanadali.apps@gmail.com adresine yazın. İade talepleri mağazanın kendi süreciyle yapılır (App Store için Apple'ın sorun bildirme sayfası, Google Play için sipariş geçmişi).
```

**English**
```
Sorry the purchase caused trouble. Please try "Restore purchases" under Settings › Shop first. If that doesn't work, email osmanadali.apps@gmail.com with your order email and your OS version. Refunds go through the store itself: Apple's report-a-problem page for the App Store, or your order history for Google Play.
```

### 5f. Özellik isteği

**Türkçe**
```
Öneriniz için teşekkürler, not aldım. Yeni özellikleri hangi sırayla ekleyeceğimi şu an söz veremem; ama bu öneri yapılacaklar listemde. Daha fazla ayrıntı isterseniz osmanadali.apps@gmail.com adresine yazabilirsiniz.
```

**English**
```
Thanks for the suggestion, I've noted it. I can't promise when it'll arrive, but it's on my list. If you have more detail, feel free to email osmanadali.apps@gmail.com.
```

### 5g. 1 yıldız, öfkeli yorum

Kural: kısa, sakin, özür dilerken koşullu olmayan; tartışma yok. Yorumda hata varsa somut yanıt ver; yoksa sadece saygılı bir not bırak. Yanıtı yazdıktan sonra 24 saat bekleme yok, ama aynı gün ikinci yanıt verme.

**Türkçe**
```
Deneyiminiz kötü geçtiyse üzgünüm. Oyunun neresinin sizi rahatsız ettiğini anlamak isterim. Eğer bir hata gördüyseniz osmanadali.apps@gmail.com adresine yazabilirsiniz; cihaz ve sürüm bilgisi yardımcı olur.
```

**English**
```
I'm sorry your experience was frustrating. I'd like to understand what went wrong. If it was a bug, email osmanadali.apps@gmail.com with your device and version details, and I'll look into it.
```

---

## 6. Mağaza puanı stratejisi

### 6a. Mevcut uygulamanın değerlendirmesi (kod: `www/game.js`)

Ne doğru çalışıyor:

- **Sistem penceresi.** `maybeReview` (satır 1613) yalnızca `@capacitor-community/in-app-review` eklentisinin `requestReview` çağrısını yapar; oyun puan istemez, puan için oyuncuya bir ödül teklif etmez. Kod incelemesinde ödül veya teşvik ifadesi bulunmadı.
- **Tetikleyici ana akışta.** Yalnızca normal bölüm bittiğinde, 3 yıldızla ve Günün Hattı ya da pratik modda değilken çalışır (`www/game.js` satır 1471). Olumlu bir an olarak seçilmiş.
- **Hız sınırı.** İlk istekten sonra en erken 60 gün ve 40 bölüm sonra tekrar; ayrıca aynı günde öneri penceresi açılmaz (satır 1667). Muhafazakâr ve iki mağazanın sınırlarıyla uyumlu.
- **Kullanıcı başlatmalı buton.** "Ray’i değerlendir" (Ayarlar, yalnızca mobilde, satır 2345) mağaza yorum sayfasını doğrudan açar. App Store için `itms-apps://…?action=write-review`, Google Play için `market://details?id=com.osmanadali.ray`.

Dikkat edilmesi gerekenler (geliştiriciye öneri, kod değiştirilmedi):

1. **Ayarlar etiketi belgede "Mağazada değerlendir" diye geçiyor; gerçek metin "Ray’i değerlendir".** Hangi ad istendiğine geliştirici karar versin; mağaza metinlerinde bu buton adı kullanılmaz, yalnızca karar kaydı içindir.
2. **Yalnızca ilk 3 yıldızda değil, 1. hattan sonraki her 3 yıldızda tetiklenir.** `save.rv` henüz yokken bir önceki hattaki bölüm tekrar oynanıp 3 yıldız alınırsa da istek gidebilir. Pratikte sorun değildir; ama "ilk kez" niyeti için kod yorumuna "tekrar oynanan bölümler de sayılır" notu eklenebilir.
3. **Web dalı ölü kod.** `rateApp` içindeki `web` dalı, Ayarlar butonu web'de gösterilmediği için hiç çalışmaz. Temizlik gerekmez; ama bu bilgi, ileride web için buton eklenirse hatırlanmalı.
4. **Yorum tetikleme kapısının bağlantısı.** `rv` durumu, lig ve kapışma (1.2) bölümleri için de sayılacaksa, kapışma galibiyeti ayrı bir tetikleyici olmamalı: rakibe karşı kazanılan bir maç, ödül gibi algılanabilir.

### 6b. Öneriler (kurallara uygun)

- **Ön soru yok.** "Oyunu seviyor musun?" gibi bir ön soru sorup yalnızca memnun görünen oyunculara puan penceresini göstermek, iki mağazanın da yasakladığı bir filtreleme sayılabilir. Geri bildirim bağlantısı varsa ayrı ve koşulsuz olsun (ör. Ayarlar › Destek), puan penceresiyle bağlantılı olmasın.
- **Yalnızca sistem penceresi.** Ana sayfada kalıcı "bizi değerlendir" banner'ı ya da popup eklenmesin.
- **Ödül yok.** Yorum, puan ya da paylaşım karşılığında oyun içi para, bilet, ipucu ya da başka bir ödül eklenmesin. Tavsiye ve paylaşım (`recommend`) penceresi de ödülsüz kalmalı; bu kod şu an böyle.
- **Yanıt sürdürülebilirliği.** Mağaza yorumlarına 24 saat içinde yanıt vermek hem sorunları çözer hem de yorum ortamını sağlıklı tutar.
- **Ölçüm.** Puan penceresinin kaç kez gösterildiğini ölçmek için Firebase'e yeni bir olay eklenirse, Veri güvenliği ve App Privacy beyanları buna göre güncellenmelidir (`docs/MAGAZA.md` §6, §7).
- **Sürüm notu.** 1.2 sürüm notu (`docs/yenilikler-1.2.md`) yorumları tetikleyen bir içerik olarak kullanılabilir; ama "lütfen puan ver" tarzı bir cümle eklenmesin.
- **Puanı izleme.** App Store Connect ve Google Play Console'daki puan trendi her hafta kontrol edilsin. Ani düşüş olursa önce hata olup olmadığına bak; düşüşü yorumlarla değil, sorunla ilgilen.

---

## 7. Ek mecralar (kısa not)

- **Kapsam notu.** Bütçe ve kanal kararına göre bu mecralar isteğe bağlıdır; ücretli öne çıkarma önerilmez, ilk öncelik Türk siteleri ve Instagram/TikTok'tur. Ek mecralar ancak ilk iki hafta sonunda ihtiyaç görülürse düşünülür.
- **Product Hunt.** Lansman için tagline ve açıklama hazır olmalı; tagline kısa tutulur (yaklaşık 60 karakter sınırını kontrol et). Lansman cumartesi olduğu için Product Hunt'ı hafta içine (ör. 2–4 gün sonraya) almak daha iyi olabilir. Lansman için geliştirici yorumu (maker comment) ve ekran görüntüsü gerekir.
- **IndieDB.** Ücretsiz bir sayfa açılabilir; ekran görüntüleri, kısa tanıtım ve iki üç geliştirici güncellemesi (devlog) ile düzenli tutulur.
- **itch.io.** Web sürümü HTML5 olarak yüklenebilir. Platformun kurallarını ve oyun ayarlarını (ücretsiz, tarayıcıda oynanır) kontrol et. Mobil mağaza bağlantısını sayfanın açıklamasında ver; web sürümünün mobil reklamlarını ve Firebase kullanımını ayrıca belirt.

Bu üç mecra için de ayrı bir hesap, kısa bir açıklama ve tek bir yayın tarihi yeterli; aynı gün hepsine yüklemek gerekmez.

---

## 8. Lansman günü kontrol listesi (21 Kasım 2026, Cumartesi)

Saatler Türkiye saatidir (UTC+3). Yayın saati mağazanın onayına bağlıdır; sapma olursa saatleri kaydır, sırayı koru.

### 20 Kasım (Cuma), lansman öncesi

- [ ] 09:00 Google Play Console'da sürümün durumunu ve inceleme sonucunu kontrol et. Kapalı test şartı (kişisel hesapta 12 test kullanıcısı, 14 gün) sağlandı mı doğrula; sağlanmadıysa tarih ertelemesi kararı al.
- [ ] 10:00 Mağaza metinlerinde "internetsiz" ifadelerini düzelt (bkz. §0.1). Lig ve kapışmanın internet gerektirdiğini belirten metin son hâline getir.
- [ ] 11:00 Ekran görüntüleri ve öne çıkan görseller doğru dildedir (TR Play, EN Play, iOS 6,9"); 1.2 sahneleri ile 1.1 sahneleri karışmamış.
- [ ] 12:00 Gizlilik politikası ve Veri güvenliği / App Privacy beyanlarını anonim kimlik ve ölçüm için yeniden kontrol et.
- [ ] 13:00 Web sürümünü ve gizlilik sayfasını iki cihazda aç (telefon, masaüstü). Bağlantılar 200 dönüyor mu?
- [ ] 14:00 Destek e-postası (osmanadali.apps@gmail.com): kendinden kendine bir test e-postası gönder ve yanıtın geldiğini kontrol et.
- [ ] 15:00 Reklamsız paket fiyatı ve ürün kimliği (`ray_reklamsiz`) iki mağazada da aktif; satın alma testi lisans test hesabıyla yapıldı.
- [ ] 16:00 Basın bülteni TR ve EN geliştiriciye gönderildi; alıntı ve şehir onayı alındı.
- [ ] 17:00 Basın kiti (zip) hazır ve bağlantısı çalışıyor.
- [ ] 18:00 Gönderim listesi hazır: site e-postaları (TR ve EN), içerik üreticileri, Reddit gönderi taslakları.
- [ ] 19:00 Yorum yanıt şablonları (§5) kopyalanabilir biçimde hazır.
- [ ] 21:00 Hazırlık son onayı; geliştirici yayını onayladı.

### 21 Kasım (Cumartesi), lansman günü

- [ ] 08:00 Google Play yayını canlı mı? Play bağlantısını aç; 404 yerine sayfa dönüyor mu?
- [ ] 08:30 Üç cihazda (Android telefon, iPhone, masaüstü tarayıcı) yükleme ve ilk açılış testi: öğretici, bir bölüm, reklam (online), satın alma sayfası.
- [ ] 09:00 Basın bülteni TR ve EN gönder (yalnızca onaylı alıcılara).
- [ ] 09:30 Türk oyun ve teknoloji siteleri için e-postalar (§2b) gönder. Adres yoksa sosyal medya mesaj kutusu.
- [ ] 10:00 Oyun blogları ve siteleri için İngilizce e-postalar (§2a) gönder.
- [ ] 11:00 Reddit: yalnızca hesap şartını (§3a) sağlamış hesapla r/puzzles ve r/WebGames; sağlanmadıysa bu adım ertelenir.
- [ ] 12:00 Türk içerik üreticilerine Instagram ya da TikTok üzerinden kısa mesajlar (§2c). En fazla beş kişi; her biri için kişisel bir cümle.
- [ ] 13:00 Yorumlar ve e-postalar: ilk yanıtları ver (§5). Hata bildirimi varsa önceliklendir.
- [ ] 15:00 Play Console ve App Store Connect'te çökme (crash) ve yükleme hatası raporlarını kontrol et.
- [ ] 16:00 Ekip içi (kendi) kayıt: ilk saatlerdeki indirme ve yorum sayısı; sorunlar listesi.
- [ ] 18:00 r/AndroidGaming ve r/iosgaming (Play ve App Store canlıysa, hesap şartı sağlanmışsa, kurallar yeniden kontrol edildi).
- [ ] 20:00 İlk yorum ve e-posta özeti; acil hata varsa düzeltme sırası belirlendi.
- [ ] 22:00 Gün sonu: ertesi gün planı (pazar: r/indiegaming, takip e-postaları, yorum yanıtları).

### 22 Kasım (Pazar)

- [ ] 10:00 Tüm yorumlara yanıt; yanıtsızları bitir.
- [ ] 11:00 Hata listesi ve öncelikler; 1.2.1 düzeltme sürümü gerekiyorsa karar.
- [ ] 14:00 Bu adım yalnızca yeni hesap şartı sağlandıysa ve lansmandan sonra yapılır: r/indiegaming ve r/playmygame. Aksi hâlde pazartesi ya da sonrasına ertele.
- [ ] 18:00 Takip e-postası (§2e) yalnızca yanıt gelmeyen ilk gruba, bir kez.

---

## 9. Açık sorular (geliştiriciye)

1. Google Play yayın tarihi 21 Kasım 2026 kesin mi? Kişisel hesapta kapalı test şartı (12 test kullanıcısı, 14 gün) sağlandı mı?
2. 1.2 ne zaman App Store'a çıkıyor? Basın bülteni App Store'da 1.1 yerine 1.2'yi mi anlatacak?
3. "İnternetsiz" iddiasını 1.2 ile birlikte düzeltmeyi kabul ediyor musun? (Mağaza metinleri, basın bülteni ve Veri güvenliği buna bağlı.)
4. Basın bülteni alıntısı ve şehir alanı için onay.
5. Ayarlar'daki etiket "Ray’i değerlendir" kalsın mı, yoksa "Mağazada değerlendir" olarak mı değişsin? (Kod değişikliği gerekirse ayrı bir iş olarak planlanır.)
6. Discord kurulacak mı, yoksa lansmandan iki hafta sonra karar mı verilecek?
7. Reklamsız paket ve test erişimi için hangi kanal kullanılacak? (İnceleme için kod paylaşılmamalı; mağazanın test mekanizması kullanılmalı.)
