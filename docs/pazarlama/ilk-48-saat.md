# İlk 48 saat: lansman adımları

Bu liste, 21 Kasım 2026'dan başlayarak **sırayla** yapacağın adımlardır. Her satırda **kim**, **ne** ve **nerede** yazar. Hesaplara giriş, yayınlama ve para harcama işlerini yalnız sen yaparsın; pazarlama ve oyun oturumları metni ve dosyayı hazırlar.

- **Sen:** hesap sahibi. Onay verir, yayınlar, ödeme yaparsın.
- **Oyun oturumu** ("ray-oyun 2"): mağaza metinleri (`docs/MAGAZA.md`), görseller ve sürüm gönderimi. Oyun kodunu yalnız o değiştirir.
- **Pazarlama oturumu** (bu ekip): metinler, takvim, reklam kurgusu ve haftalık değerlendirme.

Ayrıntılar: [strateji.md](strateji.md) · [aso.md](aso.md) · [sosyal-medya-takvimi.md](sosyal-medya-takvimi.md) · [reklam-kampanyasi.md](reklam-kampanyasi.md) · [topluluk-pr.md](topluluk-pr.md)

## 0. Başlamadan önce bilmen gereken 3 şey

1. **21 Kasım, Play'de yayın günü değil, başvuru günüdür.** 14 günlük kapalı test 21 Kasım'da doluyor. O gün Play Console'dan **üretime erişim başvurusu** yapılır. Google onaylayınca (genelde birkaç gün, en çok ~7 gün) üretim sürümü gönderilir ve o da incelenir. Play sayfasının canlı olduğu güne bu belgede **L günü** diyoruz (tahmini 22–28 Kasım). "Android'de yayında" duyuruları ve Play linki **L gününe kadar paylaşılmaz.**
2. **iOS'ta 1.2 yayında mı, kontrol et.** App Store sayfası şu an 1.1 gösteriyor. 1.2 (yapı 15) onaylanmadan lig, kapışma ve yeni hatlar "App Store'da" diye duyurulmaz. Onaya kadar videolarda "yakında / güncelleme yolda" dilini kullan.
3. **Güncel sıra ve bütçe: [izlenme-hedefi.md](izlenme-hedefi.md)** (ASA yalnız 21–27 Kasım, ~950 TL; izlenme sigortası ~1.500 TL; oynanabilir reklam ~2.500 TL). Eski öneri: ayda 5.000 TL = **Apple Search Ads Türkiye ~4.100 TL** (günde ~135 TL tavan) + **kazanan organik videoyu öne çıkarma ~900 TL**. Google App Campaigns bu bütçeye sığmıyor, şimdilik açılmıyor (gerekçesi: [reklam-kampanyasi.md](reklam-kampanyasi.md) §3.3).

---

## 1. Gün: 21 Kasım (Cumartesi)

| # | Saat (TR) | Kim | Ne | Nerede |
|---|---|---|---|---|
| 1 | 09:00 | Sen | **Üretime erişim başvurusu.** Formdaki sorulara kapalı testten gerçek notlarla kısa yanıt ver: kaç testçi, ne geri bildirim geldi, neler düzeltildi (1.2: öğretici, ses, reklam düzeltmesi). | Play Console › Kontrol paneli › "Üretime erişim için başvur" (hafta sonu olduğu için Google incelemesi pazartesi başlayabilir) |
| 2 | 09:30 | Sen + oyun oturumu | **iOS 1.2 durumu:** App Store Connect'te 1.2 (yapı 15) hangi aşamada? İncelemeye gönderilmediyse oyun oturumundan gönderim hazırlığını iste, onayı sen ver. **Anahtar kelime alanı ve alt başlık** ancak yeni sürümle değişir; aso.md §3 (tr) önerilerini bu gönderime ekletmek için oyun oturumuna söyle. | App Store Connect › Uygulamam › 1.2 |
| 3 | 10:00 | Sen | **Promosyon metnini güncelle** (sürüm gerektirmez, hemen yayında). Türkçe ve İngilizce metin: aso.md §3. "İnternetsiz" iddiası yalnız bölümler için geçerli; lig ve kapışma bağlantı ister. | App Store Connect › Uygulama bilgileri › Promosyon metni |
| 4 | 10:30 | Sen | **Instagram profilini düzenle:** biyografi tr/en, App Store linki. Play linki L gününde eklenecek. | Instagram › Profili düzenle (metinler: sosyal-medya-takvimi.md Bölüm 0) |
| 5 | 11:00 | Sen | **TikTok hesabını aç** (oyuna özel, işletme hesabı). Kullanıcı adı, biyografi ve link Bölüm 0'da. Profil fotoğrafı: `store/appstore-icon-1024.png`. | TikTok uygulaması |
| 6 | 11:30 | Sen | **Reddit hesabını aç.** **Tanıtım gönderisi YOK.** Yeni hesapla tanıtım yapılırsa silinir ya da ban yenir. 2–4 hafta boyunca r/puzzles, r/iosgaming ve r/AndroidGaming'de gerçek yorumlarla katkı ver. | reddit.com (kurallar: topluluk-pr.md §3) |
| 7 | 12:00 | Sen | **Apple Search Ads hesabı:** Advanced hesap aç, ödeme yöntemini ekle, **günlük ve aylık tavan koy** (önerimiz günde 135 TL, ayda 4.100 TL). Kampanya kurgusu: reklam-kampanyasi.md §2.1. Yalnız Türkiye ve 18+; marka, kategori ve keşif reklam grupları; negatif kelimeler hazır. **Başlatmadan önce bütçeyi onayla.** | ads.apple.com |
| 8 | 13:00 | Sen | **Firebase kontrolü:** Türkiye'den gelen olaylar akıyor mu? Kontrol edilecekler: `tutorial_begin`, `tutorial_complete`, `level_end`. Not: AB, BK ve İsviçre'den olay gelmez, bu normal. | console.firebase.google.com › Analytics › Gerçek zamanlı |
| 9 | 18:00–20:00 | Sen | **İlk organik video (V02, "Bu bölüm çözülür mü?").** Reels ve TikTok'a aynı video, Türkçe yazılı. Kanca, senaryo, açıklama ve etiketler hazır. "Google Play'de" diyen V01 L gününe kalır. | sosyal-medya-takvimi.md (V02) |
| 10 | 21:00 | Sen | **İlk ölçüm notu:** App Store gösterim/indirme, ASA harcama ve dokunma, video izlenme sayısı. Tabloya yaz. | reklam-kampanyasi.md §5.4 şablonu |

## 2. Gün: 22 Kasım (Pazar)

| # | Saat | Kim | Ne | Nerede |
|---|---|---|---|---|
| 11 | 09:00 | Sen | **Play başvurusunun durumuna bak** (akşam bir kez daha). Onay geldiyse oyun oturumuna yaz: üretim sürümünü göndersin ve mağaza girişini son kez denetlesin. | Play Console › Kontrol paneli |
| 12 | 10:00 | Sen | **ASA ilk veri:** dokunma ve dönüşüm. **24 saatte ayar değiştirme**, en az 3–4 gün bekle. Yalnız alakasız bir arama terimi varsa negatife ekle. | ads.apple.com › Arama terimleri |
| 13 | 12:00 | Sen | **App Store yorumlarına yanıt** ver (şablonlar tr/en). Ödül karşılığı puan değişikliği isteme. | App Store Connect › Puanlar ve yorumlar (şablon: topluluk-pr.md §5) |
| 14 | 14:00 | Pazarlama + sen | **Basın listesi:** Türk siteleri önce, sonra İngilizce siteler; 10–15 alıcı. E-posta adreslerini sitelerin iletişim sayfasından sen bul. Bülteni (tr/en) kişiselleştir, **L gününe kadar gönderme.** | topluluk-pr.md §1–2 |
| 15 | 18:00–20:00 | Sen | **2. video** (takvimdeki sıradaki) Reels ve TikTok'a. İlk videonun yorumlarına yanıt ver. | sosyal-medya-takvimi.md |
| 16 | 21:00 | Sen | **Günlük not** (tablo). 1. videonun 24 saatlik izlenmesi takvimdeki "ölçekle" eşiğini geçtiyse öne çıkarma adayıdır. Para harcamadan önce bize sor. | sosyal-medya-takvimi.md §7 |

Onay 22 Kasım'da gelmezse 23 Kasım ve sonrasında aynı ritim sürer: günde 1 video, yorumlara yanıt, akşam ölçüm notu ve Play'e günde 2 kez bakış.

---

## 3. L günü: Play sayfası canlı olduğu ilk 48 saat

| # | Ne zaman | Kim | Ne | Nerede |
|---|---|---|---|---|
| L1 | Saat 0 | Sen | **Play sayfasını telefondan aç ve kontrol et:** başlık, kısa açıklama, ekran görüntüleri, indirme. Bir **satın alma testi** yap (iade edilebilir test kartı ya da lisanslı test hesabı). | play.google.com/store/apps/details?id=com.osmanadali.ray |
| L2 | +1 sa | Sen | **Play linkini her yere koy:** Instagram ve TikTok biyografisi, `[PLAY_LINK]` yer tutucuları (sosyal-medya-takvimi.md, topluluk-pr.md). | Profiller |
| L3 | +2 sa | Sen | **Duyuru videosu (V01):** "Ray artık Android'de". `store/tanitim/ray-play-tanitim-dikey.mp4` Reels ve TikTok'a, `ray-play-duyuru-dikey.png` Instagram hikâyesine (link çıkartmasıyla). Resmi "Google Play'den edinin" rozeti yalnız `store/tanitim/rozet/` içindeki orijinal hâliyle, oranı bozulmadan kullanılır. | Dosyalar `origin/tanitim` dalında |
| L4 | +3 sa | Sen | **Basın e-postaları:** 14. adımda hazırlanan listeye kişiselleştirilmiş gönderim. Toplu, kopyalı gönderim yapma; tek tek gönder. 5 gün sonra tek bir takip e-postası. | Kendi e-posta hesabın (şablon: topluluk-pr.md §2) |
| L5 | +4 sa | Sen | **Reddit:** hesap henüz yeniyse ya da az karması varsa **tanıtım gönderisi atma**. Hesap hazırsa (topluluk-pr.md §3 eşikleri) yalnız kendi kendini tanıtmaya izin veren yerlere ve kuralına uygun gönder (r/AndroidGaming'in self-promo günü/başlığı vb.). | reddit.com |
| L6 | +6 sa | Sen | **Play yorumlarına yanıt:** ilk günlerde her yoruma 24 saat içinde. Hata bildirimlerini oyun oturumuna ilet. | Play Console › Puanlar ve yorumlar |
| L7 | +24 sa | Sen | **Teknik sağlık:** çökme ve ANR oranları. Çökme ≥ %1 ya da ANR ≥ %0,47 ise oyun oturumuna hemen bildir ve öne çıkarma harcamasını durdur. | Play Console › Android vitals |
| L8 | +24 sa | Sen | **Mağaza dönüşümü:** mağaza girişi ziyaretçisi → yükleyen. Hedef ≥ %25 (strateji.md §6). %15'in altındaysa ASO ekibinden ilk A/B testini (aso.md §5, P1) iste. | Play Console › İstatistikler › Mağaza girişi performansı |
| L9 | +36 sa | Sen | **L+1 videosu** (takvimdeki "Android" videosu) ve yorumlara yanıt. | sosyal-medya-takvimi.md |
| L10 | +48 sa | Sen + pazarlama | **48 saat değerlendirmesi:** günlük indirme (iki mağaza), `tutorial_complete` oranı, D1 tutma (ilk kohort), ASA CPI, videoların izlenmesi. Bu rakamları bu oturuma yaz; karar kurallarına göre (strateji.md §6, reklam-kampanyasi.md §5.3) "sürdür / değiştir / durdur" önerisini çıkaralım. | Bu sohbet |

## 4. Bu 48 saatte yapma

- Takipçi, yorum ya da indirme **satın alma**; arkadaşlardan toplu 5 yıldız isteme. Mağaza ve platform kurallarına aykırıdır, hesap kapanabilir.
- Puan karşılığında ipucu, bilet ya da hediye verme. Oyundaki puan penceresi zaten kurallara uygun (sistem penceresi, ödülsüz).
- Oyunda olmayan bir şeyi gösteren ya da abartan reklam ("fake gameplay", "1 numara", "en iyi").
- L gününden önce "Play'de" yazan görsel ya da Play linki paylaşmak.
- ASA ayarlarını her gün değiştirmek. Veri az; en erken 3–4 günde bir bak.
- 18 yaş altını reklamla hedeflemek (oyun 13+, reklam hedefi 18+).

## 5. Takılırsan

- **Play başvurusu reddedilirse:** Google gerekçe yazar (genelde "testçi katılımı yetersiz" ya da "test süreci yanıtları yetersiz"). Gerekçeyi oyun oturumuna ilet; kapalı test uzatılır ve yeniden başvurulur. Pazarlama takvimi yalnız kayar; iOS ve organik işler sürer.
- **iOS 1.2 reddedilirse:** organik videolarda lig ve kapışma yerine bölüm, kural ve tema içerikleri öne alınır (takvimde bu içerikler var).
- **ASA bütçeyi harcayamazsa** (Türkiye'de arama hacmi düşük): zorlama. Artan para ayın sonuna ya da öne çıkarma payına kalır.
