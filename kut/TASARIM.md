# Kut Arena: tasarım kararları

Kut Arena bir mobil oto-savaş (auto-battler) oyunu. Kahraman toplanıyor, geliştiriliyor ve çevrimiçi rakiplerle dövüştürülüyor. Bu belge alınmış kararları, nedenlerini ve geriye kalan görsel işleri sıralar. Oynanabilir prototip bu klasörde (`kut/`).

## 1. Araştırma: türün yaraları

TFT, Underlords, Auto Chess, Super Auto Pets ve Battle Legion gibi oyunların inceleme özetlerinde ve oyuncu yorumlarında hep aynı şikâyetler çıkıyor:

| Şikâyet | Kaynakta geçen |
|---|---|
| **Maçlar çok uzun** | Underlords/Auto Chess maçı 35–45 dk; oyuncular yarıda odağını kaybediyor. Mobilde bu çok ağır. |
| **Şans (RNG) belirleyici** | Ortak havuz, "RNG palyaço festivali"; istediğin kahramanı bulamamak. |
| **Savaşta oyuncunun etkisi yok** | "Auto-battling your way to victory is not a good design"; izle-bekle hissi. |
| **Öde-kazan ve haksız eşleşme** | Super Auto Pets ve Draft Showdown incelemelerinde en büyük eksi. |
| **Yeni oyuncu için kapalı kutu** | Soylar ve yetenekler anlaşılmıyor. |
| **Gerçek zamanlı bağlantı sorunları** | 8 kişilik canlı lobide gecikme, kopma, bekleme. |

Öte yandan Super Auto Pets'in başarısı iki şeyden geliyor: **eşzamansız rakip** (beklemek yok, kısa oturum) ve **adil yapı** (bütün birimler herkese açık).

## 2. Vurucu yanlarımız (bizi farklı kılan 6 karar)

1. **✨ Kut dokunuşu: savaşa tek müdahale hakkı.** Savaş kendi kendine oynar, ama oyuncu savaş başına **bir kez** kendi kahramanlarından birine dokunup yeteneğini anında patlatabilir. Doğru anda sersemletmek ya da kalkan atmak bir savaşı çevirebilir. "İzle-bekle" sorununa çözüm bu. Ustalık tavanını yükseltir ama yeni oyuncuyu da korkutmaz. Oyunun adı da buradan geliyor: *kut*, kısa ve her dilde kolay söylenen bir sözcük; eski Türkçede "gökten verilen güç" anlamına gelir. Oyunda yalnız bu güç patlamasının adıdır.
2. **🔥 Kaynaşma: iki farklı kahraman tek kahraman olur.** Bilinen tek yöntem 3 aynı birimi birleştirmek; o yöntem bizde de var (★2, ★3). Bunun yanında 3 altına iki *farklı* kahraman kaynaştırılabilir. İlki yeteneği, ikincisi pasifi verir ve ikisinin soyları birlikte sayılır. 16 kahramanla 240 olası melez çıkıyor. Bu, paylaşılabilir "buldum!" anları yaratır (ör. *Golem×Anka*: kaya fırlatan ve ilk ölümünde küllerinden dirilen taş dev). Şans sorununu da yumuşatır: istediğin kahraman gelmese bile elindekini dönüştürebilirsin.
3. **👁️ Rakibini önceden gör, karşı kur.** Dükkân açılınca sıradaki rakibin kadrosu ve soyları görünür. Eşzamansız yapı sayesinde bu mümkün. Taslak kör tahmin olmaktan çıkar, okuma ve karşılık oyununa döner.
4. **🌕 Alamet: her turun kendi kuralı.** Her tur başında bir kural gelir: Kan Ayı (+%20 hasar), Sis (menzil -1), Tipi, Kut Yağmuru, Tutulma, Yaz Sıcağı, Bereketli Pazar. Böylece aynı takım her tur farklı değerlendirilir ve "tek doğru kadro" ezberi kırılır.
5. **⏱️ 7 dakikalık maç, 15 saniyelik savaş.** 5 can ve 7 zafer koşuluyla bir maç en fazla 11 tur sürer. Savaşların ortanca süresi 15 sn (test ölçümü). Altın her tur 10'a sıfırlanır, faiz yoktur. Geride kalan oyuncu toparlanabilir, öndeki kartopu gibi büyüyemez.
6. **🌐 Sunucusuz çevrimiçi: hayalet rakipler ve düello kodu.**
   - Her turda takımının fotoğrafı havuza bırakılır. Rakibin, aynı turdaki ve benzer kupadaki **gerçek bir oyuncunun** fotoğrafıdır. Gerçek zamanlı sunucu ya da bekleme odası yok, gecikme ve kopma da yok. Çevrimdışıyken bot devreye girer.
   - Savaş motoru **belirlenimci**: aynı takımlar, tohum ve Kut zamanı her seferinde aynı sonucu verir. Bu yüzden savaş cihazda oynar, sunucu yalnız doğrular. Hile önlenir ve tekrar izleme bedavaya gelir.
   - **Düello kodu**: son takım ~80 karakterlik bir koda dönüşür (`KUT1-…`). WhatsApp'tan atılır, arkadaş kendi takımıyla dövüştürür. Viral döngü bu.

**Tema kararı:** Kahramanlar **yaratık**: element yaratıkları ve büyülü hayvanlar (Kaya Golemi, Kristal Kurt, Davulcu Kurbağa, Sis Yarasası, Rüzgâr Ruhu, Dağ Koçu, Zümrüt Yılan, Buz Kaplumbağası, Kor Semenderi, Bulut Atı, Işık Kuğusu, Gece Ayısı, Anka, Ayaz Baykuşu, Gölge Tilki, Fırtına Ejderi). İnsan yok: cinsiyet, ırk ya da milliyet çağrıştırmazlar, gerçek bir kültürün kıyafetini ya da sembolünü taşımazlar. Her ülkeden ve yaştan oyuncuya aynı mesafede dururlar. Hayvan ve element tanıdık olduğu için soylar da sezgiyle anlaşılır (kaplumbağa sağlam, tilki sinsi). Arena gökte yüzen bir adadaki harabeler; o da hiçbir kültüre ait değil. Çizim kuralları: `GORSEL_REHBERI.md`.

## 3. Kurallar (prototipte uygulandı)

| Konu | Karar |
|---|---|
| Altın | Her tur 10 🪙 (Bereketli Pazar'da 12). Kahraman fiyatı kademesine eşit (1–3). Yenileme 1 🪙, kaynaştırma 3 🪙. |
| Satış | ★1 tam iade, ★2 için 3×kademe-1, ★3 için 9×kademe-1. |
| Takım sınırı | Tur 1–2: 3, tur 3–4: 4, tur 5–6: 5, sonrası 6. Yedekte 4 yer. |
| Yıldız | 3 aynı ★1 otomatik ★2 olur (×1,8). 3 ★2 de ★3 olur (×3). |
| Kaynaşma | İki farklı ve henüz kaynaşmamış kahraman. Statlar ortalama ×1,15. Yetenek ve menzil ilk kahramandan, pasif ikinciden gelir; soylar birleşir. Yıldız, ikisinden düşük olanınki olur. Kaynaşmış kahraman tekrar kaynaşamaz. |
| Soylar | 10 soy, eşikleri 2/4: Gök, Yer, Od, Su, Ayaz, Karanlık, Dev, Avcı, Bilge, Çevik. Aynı kahraman iki kez sayılmaz. |
| Dükkân olasılıkları | Kademe 1/2/3 oranları: tur 1–2'de 100/0/0, tur 9 ve sonrasında 20/35/45 (`KURAL.kademeOlasilik`). |
| Savaş | 6×8 arena, 30 sn sınır. Süre biterse kalan can yüzdesi karar verir. Kaybeden 1 can yitirir. |
| Kut | Savaş başına 1 kez. Kendi kahramanına dokununca manası anında dolar. Bot rakip Kut'u 5. saniyede kullanır. |
| Kupa | Maç kazanılırsa +40. Kaybedilirse zafer×8-30 (0'ın altına inmez). Eşleşme ±150 kupa. |
| Geliştirme (meta) | **Kahraman ustalığı**: kazanılan her turda takımdaki kahraman 1 puan alır, her 5 puan 1 seviye eder. Ödüller **yalnız görünüştür**: Sv.2 çerçeve, Sv.5 ikinci görünüm, Sv.10 efsane görünüm. Güç satılmaz, bütün kahramanlar herkese baştan açıktır. |
| Gelir modeli (öneri) | Görünüm, arena teması, Kut efekti ve "Sezon Yolu". Reklam yalnız isteğe bağlı (ör. maç sonu ödül ikiye katlama). Hiçbir zaman güç satılmaz; bu, rakiplere karşı pazarlama cümlemiz. |

## 4. Denge ölçümü (`node test/sim.test.cjs`)

- Savaş süresi: ortanca 15 sn, %90'lık dilim 26 sn. 300 savaşta beraberlik 1.
- Takımda yer alan kahramanın kazanma oranı en düşük %43 (Davulcu Kurbağa, destek), en yüksek %61 (Ayaz Baykuşu, 3. kademe). Hedef ±%10 bant. Kurbağa düşük çıkıyor çünkü test onu ön sıraya koyuyor; gerçek oyunda arka sıraya konur.
- Belirlenimcilik: aynı girdi aynı sonucu veriyor; Kut kaydıyla yeniden oynatma da birebir aynı çıkıyor.

## 5. Dosyalar

| Dosya | İş |
|---|---|
| `data.js` | Kahramanlar, soylar, yetenek ve pasif metinleri, alametler, ekonomi sabitleri (`KURAL`) |
| `sim.js` | Belirlenimci savaş motoru (tarayıcı + node) |
| `online.js` | Hayalet havuzu, bot takım üretimi, düello kodu. Uzak havuz için `window.KUT_UZAK = { yaz(kayit), bul({tur,kupa,oyuncu}) }` bağdaştırıcısı takılır. |
| `game.js` | Arayüz ve maç akışı: dükkân, tahta, kaynaşma, savaş çizimi, Kut, maç sonu |
| `test/sim.test.cjs` | Motor testleri ve denge taraması |
| `test/oyun.test.cjs` | Tarayıcıda baştan sona bir maç (Playwright). Ekran görüntüleri `test-out/` içine düşer. |

Çalıştırmak için `kut/index.html` dosyasını tarayıcıda açmak yeterli; derleme gerekmez.

## 6. Senin kısmın: görseller

Prototipte her şey yer tutucu (emoji + renkli daire). Görseller gelince değişecek yerler:

1. **16 kahraman portresi ve savaş figürü**: `data.js` → `emoji`/`renk` alanlarının yanına `gorsel`. Savaş figürü için bekleme, vuruş ve yetenek kareleri (3 kare yeter).
2. **Kaynaşma görünümü**: iki kahramanın melezi. Öneri: ana gövde ilk kahraman, renk tonu ve aksesuar ikinciden; 240 ayrı çizim gerekmesin.
3. **Soy simgeleri** (10 adet), **alamet kartları** (8 adet), **Kut efekti** (ekran parlaması ve kahraman üzerinde ışık sütunu).
4. **Arena zemini**: bozkır, gece gökyüzü, ortada ateş çizgisi. Alamete göre renk değiştirebilir (Kan Ayı'nda kızıl, Tipi'de kar).
5. **Logo ve uygulama ikonu**, ana ekran, dükkân kartı çerçeveleri (kademe 1/2/3).
6. **Ustalık görünümleri**: çerçeve, ikinci görünüm, efsane görünüm.

## 7. Sıradaki teknik işler (öneri sırası)

1. `KUT_UZAK` için Firebase Firestore bağdaştırıcısı. Ray'de Firebase zaten kurulu. Tek koleksiyon `hayalet/{tur}_{kupaKovasi}/kayitlar`.
2. Capacitor paketlemesi (Ray'deki yapı aynen kullanılır).
3. İlk maç için yönlendirmeli öğretici: Kut'u ve kaynaşmayı ilk iki turda zorla göster.
4. Sezon: her sezon 2 yeni kahraman ve 1 yeni alamet.
5. Haftalık "Efsane Kaynaşma" görevi, ör. "Bu hafta Anka'yı pasif olarak kullanarak 10 tur kazan".

## Kaynaklar

- [Auto-Battling your Way to Victory is not a Good Design (Medium)](https://medium.com/ggdigest/auto-battling-your-way-to-victory-is-not-a-good-design-109937a1f236)
- [Teamfight Tactics … despite frustrating RNG (PC Gamer)](https://www.pcgamer.com/teamfight-tactics-basic-overview/)
- [Dota Underlords meta is in an awkward spot (Kotaku)](https://kotaku.com/dota-underlords-meta-is-in-an-awkward-spot-1836467713)
- [Super Auto Pets inceleme özeti (VaporLens)](https://vaporlens.app/app/1714040/super_auto_pets)
- [Super Auto Pets: The Basics (wiki)](https://superautopets.wiki.gg/wiki/The_Basics)
- [Legionbound inceleme özeti (VaporLens)](https://vaporlens.app/app/4283360/legionbound)
- [Draft Showdown raporu (marlvel.ai)](https://marlvel.ai/intel-report/strategy/draft-showdown)
- [r/AutoChess soru başlığı](https://axebps-redlib.hf.space/r/AutoChess/comments/dq1ok6/weekly_question_help_and_suggestion_thread)
