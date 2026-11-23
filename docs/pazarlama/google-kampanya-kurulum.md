# Google App Campaign kurulumu (oynanabilir reklamla)

Bu sayfa, Google reklamını **senin** kuracağın adımlardır. Hiçbir adım bu ekip tarafından yapılmaz. Kampanya **Android 1.2.3 Play'de yayına girince** açılır; o zamana kadar taslak olarak hazırlanabilir.

**Bütçe:** ~4.000 TL, ~14 gün, günde ~285 TL. Ülke bölüşümü henüz kararlaştırılmadı (iki seçenek aşağıda).

## 0. Hazırlık (bir kez)

1. **Google Ads hesabı aç:** ads.google.com. "Uzman moduna geç" seçeneğini seç (akıllı kampanya sihirbazı uygulama kampanyası için uygun değil). Ülke Türkiye, para birimi **TRY**. Para birimi sonradan değiştirilemez.
2. **Ödeme yöntemi ekle** ve hesap düzeyinde **bütçe sınırı** koy: Faturalandırma › Ayarlar. Hesap bütçesi: 4.000 TL, bitiş tarihi kampanya sonu. Bu tutar asla aşılmaz.
3. **Play Console ile bağla:** Play Console › Ayarlar › Bağlı hizmetler › Google Ads › bağla. Böylece Google, Play'den gelen yüklemeleri kendisi sayar.
4. **Firebase bağlama YOK.** Bilerek bağlamıyoruz, çünkü gizlilik beyanlarını değiştirir (reklam-kampanyasi.md §6.1). Dönüşüm olarak Google Play'in kendi "yükleme" sayımı kullanılır.

## 1. Kampanyayı oluştur

Google Ads › **+ Yeni kampanya** › Hedef: **Uygulama tanıtımı** › Kampanya türü: **Uygulama yüklemeleri** › Platform: **Android** › Uygulama: "Ray" (com.osmanadali.ray).

| Ayar | Değer |
|---|---|
| Kampanya adı | `Ray-UAC-TR-Playable` (ikinci kampanya varsa `Ray-UAC-LATAM-Playable`) |
| Konumlar | Seçenek A: yalnız **Türkiye**. Seçenek B: kampanya 1 **Türkiye**; kampanya 2 **Brezilya + Meksika**. |
| Diller | TR kampanyası: Türkçe. LATAM kampanyası: Portekizce + İspanyolca. |
| Günlük bütçe | A: **285 TL**. B: TR **180 TL** + LATAM **105 TL**. |
| Teklif | Odak: **Yüklemeler**. "Hedef yükleme başına maliyet" **boş bırakılır** (ilk 7 gün Google öğrensin). 7. günden sonra gerçekleşen maliyetin ~%110'u girilebilir. |
| Başlangıç / bitiş | Başlangıç: 1.2.3 yayına girdiği gün. Bitiş: başlangıç + 14 gün. |
| Yaş / çocuk | Uygulama kampanyasında yaş hedefi yoktur. Uygulama Play'de 13+ derecelendirmeli ve "çocuklara yönelik değil" beyanlı olduğu için Google bunu kendisi uygular. |

## 2. Reklam öğeleri (varlıklar)

**Başlıklar** (en çok 30 karakter, 5 tane; Türkçe):
1. `Metronu bağla, şehri canlandır`
2. `Dokun, döndür, hattı yak`
3. `Sakin bir metro bulmacası`
4. `Tek elle, her gün yeni hat`
5. `33 kural, sonsuz bölüm`

**Açıklamalar** (en çok 90 karakter, 5 tane):
1. `Karoya dokun, rayı çevir. Bütün durakları merkeze bağla, hattın yandığını izle.`
2. `Bölümler internetsiz oynanır. Haftalık lig ve canlı kapışmada arkadaşınla yarış.`
3. `Her hat yeni bir kural öğretir: makas, köprü, tünel, ekspres durak ve dahası.`
4. `Her gün yeni bir Günün Hattı. Serini koru, şehrinin semtlerini aydınlat.`
5. `Ücretsiz indir. Sakin, şık, tek elle oynanan bir zekâ oyunu.`

Brezilya ve Meksika kampanyası için aynı metinler Portekizce ve İspanyolca istenecek (ASO ekibi, aso.md'deki pt-BR/es metinlerinden).

**HTML5 (oynanabilir reklam):** dal `oynanabilir-2`, `playable2/dist/` klasörü:
- `ray-reklam-neon-google.zip`
- `ray-reklam-synth-google.zip`
- `ray-reklam-lava-google.zip`

Üçü de yüklenir; Google kazananı kendisi seçer. Yüklemeden önce her zip'i Google'ın **HTML5 doğrulayıcısında** (Google Ads yardım sayfasındaki "HTML5 Validator") dene. Uyarı çıkarsa bu oturuma yaz.

**Videolar** (YouTube'a "liste dışı" olarak yüklenip linki eklenir):
- `playable2/dist/ray-reklam-{neon,synth,lava}-kayit.mp4` (dikey, 24 sn)
- `store/tanitim/ray-play-tanitim-dikey.mp4` ve `ray-play-tanitim-kare.mp4` (dal `tanitim`)

**Görseller:** mağaza ekran görüntüleri (`store/screens/play/`) ve öne çıkan görsel (`store/feature-graphic.png`). Google ayrıca uygulamanın Play sayfasından da görsel alır.

## 3. Yayından sonra

| Ne zaman | Ne bakılır | Karar |
|---|---|---|
| 1–3. gün | Gösterim, tıklama, yükleme var mı | Hiçbir ayara dokunma (öğrenme dönemi). |
| 7. gün | Yükleme başına maliyet; Play Console'da yeni kullanıcıların 1. gün tutması | Maliyet ≤ 25 TL ise sürdür. > 40 TL ise bu oturuma yaz, birlikte bakalım. |
| 7. gün | Varlık raporu (Öğeler › "En iyi / İyi / Düşük") | "Düşük" etiketli metin ya da tema yerine yenisi. |
| 14. gün | Toplam yükleme, maliyet, tutma | Rakamları bu oturuma yapıştır. Sonraki ayın planını çıkaralım. |

**Acil durdurma:** Play Console › Android vitals'te çökme oranı %1'i geçerse ya da yorumlarda "oynanmıyor / dönmüyor" şikâyeti artarsa kampanyayı **duraklat** ve oyun oturumuna bildir.
