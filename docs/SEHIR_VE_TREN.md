# Ray — Tren sayacı ve şehir hatları (öneri)

Bu belge, bir arkadaşın iki önerisini oyuna nasıl katabileceğimizi anlatır:

1. Süre sayacı ilerleyen bir metro treni olsun; süre dolarsa tren gecikir, yolcular tepki verir.
2. Yeni hatlar gerçek şehirlerin metrolarından esinlensin: İstanbul, İzmir, New York, Berlin, Paris, Helsinki…

Henüz kod yazılmadı. En sondaki karar listesi netleşince uygulanacak.

## 1. Tren sayacı: "Ray seferi"

### Ana fikir

Bugün oyun ekranının üstünde bir saat ve onun altında "⏱ 0:23 kaldı · ↻ 5 hamle hakkı" yazısı var. Bu yazı satırının yerine ince bir ray şeridi gelir:

- Solda kalkış durağı, sağda varış durağı vardır. Varış, süre hedefidir.
- Küçük bir tren süre boyunca soldan sağa ilerler.
- Hamle bilgisi zaten alttaki "↻ HAMLE HEDEFİ" kutusunda gösteriliyor, bu yüzden üstten çıkması bir şey kaybettirmez.
- "% bağlı" çubuğu olduğu gibi kalır.

Temel kural değişmez: **süre dolunca oyun bitmez, yalnızca ⏱ yıldızı söner.** Tren bu kuralı görünür kılar, ceza mantığı eklemez. İncelenen emsallerin (Train Valley, Mini Motorways, Diner Dash) ortak dersi de bu: gecikme ceza gibi değil, kaçan bir ödül gibi hissettirmeli.

### Durumlar

| An | Görüntü | Ses ve titreşim | Yazı |
|---|---|---|---|
| Başlangıç | Tren kalkış durağında, sinyal yeşil | Kısa kalkış tınısı | Kalkış → varış durağı |
| Sürenin %30'u | Tren yolun üçte birinde | Müzik gerilimi bugünkü gibi kademeli artar | — |
| Son 10 saniye | Sinyal sarıya döner, tren hafifçe hızlanır | Yumuşak bir düdük, hafif titreşim | "⏱ 0:08 · varışa az kaldı" |
| Süre doldu | Tren sinyalde durur, ⏱ yıldızı söner | Bugünkü "yıldız söndü" sesi | "+0:12 rötar" sayacı başlar |
| Rötar sürüyor | Peronda 2–3 yolcu baloncuğu sırayla çıkar | Müzik gerilimi artmayı bırakır, hafifçe yumuşar | Nazik ve esprili yolcu sözleri |
| Bulmaca bitti | Tren perona girer, kapılar açılır (1–1,5 sn) | Kapı çanı | "Tam vaktinde!" ya da "Az rötar, kimse fark etmedi" |

Yolcu sözleri için 20–30 satırlık bir havuz yazılır. 15+ kitleye uygun olur; kaba dil ve suçlama içermez. Örnekler:

- "☕ Bir kahve daha alırım o zaman…"
- "Patron bugün de anlayış gösterir herhalde."
- "Tren gecikti ama manzara güzel."

Kazanma ekranında rötar süresi de gösterilebilir, ileride "en kısa rötar" gibi küçük bir rekor kancası olabilir.

### Sakinliği ve göz konforunu koruyan sınırlar

- Kırmızı yanıp sönme yok. Uyarı tek başına renkle verilmez, ikon, yazı ve titreşim de kullanılır.
- Telefonda "hareketi azalt" ayarı açıksa tren akarak değil, müzikteki gibi 8 kademede atlayarak ilerler.
- Tren, tahta çizimine dokunmadan, hafif bir DOM/CSS katmanı olarak çizilir. Her karede sadece konumu değişir, metin her karede yeniden yazılmaz. Düşük donanımda maliyeti ihmal edilebilir, grafik kalitesi düşmez.

### Ayarlar (öneri)

- **Tren göstergesi:** Açık / Sade. "Sade" seçeneğinde yolcu baloncukları kapanır, yalnızca şerit kalır.
- **Sakin yolculuk (isteğe bağlı):** Süre hedefi tamamen kalkar. ⏱ yıldızı alınamaz, dolayısıyla taç da kazanılamaz. Cook, Serve, Delicious! oyunundaki "rahat mod, ama en yüksek ödül yok" takası gibi. Erişilebilirlik yönergeleri (Xbox XAG 116, WCAG 2.2.1) süre baskısının kapatılabilmesini öneriyor.

### Şehir hatlarıyla birleşirse

- Trenin rengi hattın rengi olur.
- Varış durağının adı sıradaki gerçek istasyondur: "Tren Şişhane'ye 0:23'te varıyor."
- Yolcu sözlerine şehre özgü bir tat katılabilir.

## 2. Şehir hatları

### Seçenekler

| Seçenek | Nasıl | Artısı | Eksisi |
|---|---|---|---|
| a) Her hat bir şehir | M1 İstanbul, M2 İzmir… | Yolculuk hissi, herkes görür | Tema renkleriyle çakışma, şehirler biter ama bölümler bitmez |
| b) Şehir = taçla alınan tema | Yeni tema paketleri | En az kod | Öneriyi karşılamaz, şehir sadece renk olur |
| c) Ayrı "Dünya Turu" modu | Ayrı harita sekmesi | Ana merdiven hiç değişmez | İki ayrı ilerleme sistemi, en çok iş |
| **d) Karma (önerilen)** | Her hat bir şehir, ama şehir yalnızca sunum katmanı | Öneriyi tam karşılar, hiçbir sistem bozulmaz | Renk önceliği kuralı ve istasyon verisi gerekir |

### Önerilen yapı: karma

- Bulmaca üretimi, kurallar, yıldız kapıları ve kayıt **değişmez**. 57. bölüm herkes için yine aynı haritadır, kimsenin yıldızları kaybolmaz.
- Şehir bölüm numarasından hesaplanır, kayda yeni bir şey yazılmaz. Kayıt dönüşümü gerekmez.
- Şehir şunları belirler:
  - hat adı ("M4 · Berlin");
  - varsayılan temadaki hat rengi;
  - arka plan motifi;
  - bölüm alt başlığı (istasyon adı);
  - hat finalinin adı;
  - kural kartına eklenen bir cümlelik şehir hikâyesi.
- **Renk önceliği:** Varsayılan "Metro" teması "Şehir renkleri" olur. Taçla alınmış bir tema seçiliyse yalnızca renkler o temadan gelir; şehir adı, istasyonlar ve motif kalır. Böylece satın alınmış temaların değeri korunur.
- **Günün Hattı:** "Haftanın şehri" olur. Pazartesiden Pazara bir hattın 7 istasyonunda ilerlenir, Pazar son duraktır. Bu, zaten var olan "Pazar en zor gün" dalgasıyla örtüşür. Bulmaca aynı kalır, yalnızca etiket ve renk değişir.
- **Şehirler bitince:** Liste yalnızca sona eklenerek büyür. Liste bitince karma hatların şehirleri "2. tur · gece seferi" olarak, daha koyu bir arka planla geri gelir. Güncellemelerle yeni şehirler eklenir.
- **Mevcut oyuncular:** Bir kez "Hatlar artık şehir!" duyuru kartı görürler. Geçtikleri hatlar için tanıtım kartı açılmaz.

### Hat → şehir eşleşmesi (öneri)

Arkadaşının saydığı altı şehrin hepsi listede. Kuralı şehrin hikâyesine bağlamaya çalıştım.

| Hat | Bölümler | Şehir | Kural ve şehirle bağı |
|---|---|---|---|
| M1 | 1–12 | İstanbul · Boğaz | Temel; ev şehri, tanıdık isimler |
| M2 | 13–28 | İzmir · Körfez | Temel; banliyö ve metro hattı |
| M3 | 29–48 | Paris | 🔩 Sabit karo: yerinden oynamayan döküm demir metro girişleri |
| M4 | 49–72 | Berlin | 🔗 Eşli karo: yan yana işleyen iki raylı sistem (U-Bahn ve S-Bahn) |
| M5 | 73–100 | Stockholm | ↺ Ters karo: metronun soldan işlemesi (doğrulanacak), "sanat galerisi" istasyonlar |
| M6 | 101–132 | Helsinki | 🌑 Karanlık tünel: kutup gecesi, derin tüneller; final: Helsinki Merkez Garı |
| M7 | 133–168 | Tokyo | 🔢 Sayaçlı karo: dakiklik, "önce düşün, sonra dokun" |
| M8 | 169–208 | İstanbul · İki Yaka | 🚉 İki merkez: Avrupa ve Asya yakası; ev şehrine dönüş |
| M9 | 209–252 | Ankara | Karma |
| M10 | 253–300 | New York | Karma; hukuki risk nedeniyle en soyut hâliyle |
| M11 | 301–352 | Lizbon ya da Londra | Karma; Londra'da marka riski yüksek |
| M12 | 353–408 | Seul | Karma |

Siyasi açıdan hassas olabilecek şehirler (örneğin Moskova) bilerek listeye alınmadı. Berlin'in Doğu/Batı hikâyesi de bu yüzden iki merkez kuralı yerine eşli karoya bağlandı. İki merkez kuralı İstanbul'un iki yakasına daha iyi oturuyor.

### Bölüm adları: gerçek istasyonlar

- Bölümün kimliği yine numara olarak kalır. İstasyon adı yalnızca alt başlıktır: "Bölüm 57 · Alexanderplatz".
- Bir şehirde istasyonlar tek bir gerçek hattın sırasını izler, böylece oyuncu gerçekten o hatta ilerliyormuş gibi hisseder. Hat yetmezse aktarma yapılır ("Halkapınar aktarma").
- Hat finali, şehrin simge istasyonu olur.
- M1–M12 için yaklaşık 408 istasyon adının derlenip doğrulanması gerekir. Uzun adlar başlığa sığacak şekilde kırpılır.
- New York ve Londra'da işletmelerin lisans programları istasyon adlarını da kapsıyor. Bu iki şehirde istasyon yerine semt adları (Brooklyn, Harlem gibi coğrafi adlar) daha güvenli.

### Görsel kimlik

- Her şehre özgün çizilmiş, tek katmanlı ve statik bir SVG arka plan motifi gelir: Boğaz ve kubbe silüeti, İzmir Körfezi ve Saat Kulesi, genel bir Art Nouveau kıvrımı, Helsinki Garı'nın fener taşıyan heykelleri gibi. Çizim maliyeti kare başına değişmez.
- Palet şehrin doğasından ve mimarisinden türetilir. Resmi hat renkleri birebir kopyalanmaz, esinlenilir.
- Uyarı rengiyle (kırmızı) karışmaması, komşu hatların tonlarının birbirinden ayrışması ve yazı kontrastı test robotuyla kontrol edilir.

## 3. Hukuki çerçeve

Bu bölüm hukuki tavsiye değildir; kamuya açık kaynaklara dayalı bir risk taramasıdır. Yayından önce, özellikle New York ve Londra eklenecekse, bir fikri mülkiyet avukatına danışılmalıdır.

| Konu | Risk | Ne yapılmalı |
|---|---|---|
| Şehir ve semt adları, coğrafya (Boğaz, Körfez, Spree, Seine) | Düşük | Serbestçe kullanılabilir; coğrafi adlar betimleyicidir |
| Mimari esinli özgün çizimler | Düşük | Stilize edilerek çizilir. Helsinki Garı en güvenli aday: Saarinen'in eserlerinin telif süresi 2021'de doldu |
| Hat renkleri | Orta | Tek renk genelde korunmaz; ama renk, hat kodu, yuvarlak simge ve şema bir araya gelince taklide dönüşür. Esinlenilir, kopyalanmaz |
| Gerçek istasyon adları | Orta | Coğrafi bilgidir; New York ve Londra'da semt adı tercih edilir |
| İşletme adları (Metro İstanbul, İZBAN, Marmaray, MTA, TfL, RATP, BVG, HSL, Tokyo Metro) | Yüksek | Oyunda, ikonda, mağaza başlığında, ekran görüntülerinde ve mağaza anahtar kelimelerinde kullanılmaz. Türkiye'de SMK m.7/3-d, başkasının markasını anahtar sözcük olarak kullanmayı da yasaklayabiliyor |
| Logolar ve hat simgeleri (Londra'nın yuvarlak amblemi, New York'un renkli harf yuvarlakları, İstanbul'un "M" çemberi) | Yüksek | Hiçbiri, benzeri de dahil, kullanılmaz. Ray kendi hat rozetini kullanır |
| Resmi metro haritaları | Yüksek | Kopyalanmaz, üzerinden çizilmez. Bulmaca ızgarası zaten soyut, şehir harita olarak değil, arka plan ve renk olarak verilir |
| Kurumsal yazı tipleri (Johnston, Parisine) | Yüksek | Kullanılmaz; oyunun kendi yazı tipi kalır |
| Anons kayıtları, kapı sesleri, kalkış melodileri, sloganlar ("Mind the Gap" tescilli) | Yüksek | Kullanılmaz; sesleri biz üretiriz |
| Google Play mağaza girişi | Yüksek | Taklit politikası: hiçbir işletmeyle resmi bağ izlenimi verilmez |

**Emsal:** Mini Metro (34 şehir) ve Mini Motorways (2026'da İstanbul eklendi) tam olarak bu modeli kullanıyor: gerçek şehir adı ve coğrafya var; işletme logosu, resmi harita ve gerçek istasyon dizisi yok.

**Feragat metni:** Hakkında ekranına ve mağaza açıklamasının sonuna şu metin eklenir: "Ray bağımsız bir oyundur; hatlar gerçek şehirlerden esinlenilerek kurgulanmıştır ve hiçbir ulaşım işletmesiyle bağlantılı değildir."

**Önerilen sıra (düşük riskten yükseğe):** Helsinki → İzmir → İstanbul → Berlin → Paris → Tokyo → New York.

## 4. İş planı

| Aşama | İçerik |
|---|---|
| 1 | Tren sayacı (şehirden bağımsız da yapılabilir) |
| 2 | Şehir çekirdeği: ad, renk önceliği, tanıtım kartı, duyuru kartı, robot testleri |
| 3 | Seçilen şehirlerin ayrıntılı araştırması ve doğrulaması, istasyon listeleri |
| 4 | Şehir arka plan motifleri (özgün SVG) |
| 5 | Haftanın şehri, paylaşım metni, trenle birleşme (istasyon adı, şehre özgü yolcu sözleri) |

## 5. Karar listesi

1. **Tren sayacı yapılsın mı?** Varsayılan "Açık" mı olsun, "Sakin yolculuk" ayarı eklensin mi?
2. **Şehir yapısı:** karma (her hat bir şehir, şehir yalnızca sunum) uygun mu?
3. **Şehir listesi ve sırası:** yukarıdaki tablo uygun mu? Çıkarılacak ya da eklenecek şehir var mı (Bakü, Madrid…)?
4. **Hat renkleri:** varsayılan temada şehir renklerine geçilsin mi? Bu, mevcut oyuncuların hat renklerini değiştirir.
5. **İstasyon adları:** bölüm alt başlığı olsun mu?
6. **Londra ve New York:** alınsın mı? Alınırsa en soyut hâliyle, semt adlarıyla.
7. **Şehirler bitince:** "2. tur · gece seferi" döngüsü mü, yalnızca güncellemeyle yeni şehir mi?

## Kaynaklar

- [Google Play taklit politikası](https://support.google.com/googleplay/android-developer/answer/9888374)
- [Google Play fikri mülkiyet politikası](https://support.google.com/googleplay/android-developer/answer/9888072)
- [6769 sayılı Sınai Mülkiyet Kanunu](https://www.mevzuat.gov.tr/mevzuatmetin/1.5.6769.pdf)
- [5846 sayılı Fikir ve Sanat Eserleri Kanunu](https://www.mevzuat.gov.tr/mevzuatmetin/1.3.5846.pdf)
- [MTA lisans programı](https://www.mta.info/doing-business-with-us/licensing-program)
- [TfL roundel](https://tfl.gov.uk/corporate/about-tfl/culture-and-heritage/art-and-design/the-roundel)
- [Mini Metro](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- [Mini Motorways İstanbul](https://dinopoloclub.com/2026/06/09/cruise-the-turkish-coast-in-istanbul-then-continue-in-creative-mode/)
- [Xbox XAG 116 — süre sınırları](https://devdocs.xbox.com/build/game-principles/accessibility/xag-deep-dives/xag-116-time-limits)
- [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/?p=3210)
- [Eliel Saarinen telif durumu](https://mfa.finna.fi/Content/elielsaarinen?lng=en-gb)
- [Helsinki Merkez Garı](https://en.wikipedia.org/wiki/Helsinki_Central_railway_station)
