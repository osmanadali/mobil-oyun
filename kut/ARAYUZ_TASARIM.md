# Kut Arena: arayüz tasarımı (Unity uygulayıcısı için)

Bu belge son arayüz tasarımını Unity'de UGUI ile yeniden kuracak kişi için yazıldı. Başvuru örneği `tasarim/final/index.html` dosyası. Tek dosya, dış kaynak yok. Ekran `?ekran=ana|mac|savas|son|kodeks` parametresiyle seçilir. Ek durumlar şunlar: `?ekran=savas&durum=kullanildi` (Kut harcanmış), `&durum=zafer` ve `&durum=yenilgi` (sonuç bandı), `?ekran=son&sonuc=yenilgi`. Ekran görüntüleri aynı klasörde `shot_<ekran>_<genişlik>.png` adıyla duruyor. Her ekranın 1280×800 ve 1024×768 görüntüsü var.

Tasarım üç önerinin hakem puanlamasından çıktı. Temel Öneri A "Altın Efsane": altın kenarlı koyu mor paneller ve köşe mücevherleri. Logo ve arena resmiyle en iyi bu dil uyuşuyordu. Üzerine şunlar eklendi:

- B'den bilgi hiyerarşisi ve öğretici kısa metinler.
- C'den Kut madalyonunun sağ alt köşedeki yeri ve maç sonu kutlaması.
- Hakemlerin istediği düzeltmeler: en küçük yazı 11 px, kaynaşık birim için ayrı madalyon, gerçekten parlayan rakip paneli, kalın ve ince panel ayrımı.

## 1. Genel kurallar

- **Canvas**: `CanvasScaler` → *Scale With Screen Size*, başvuru çözünürlüğü 1280×800, *Match* = 1 (yüksekliğe göre). 1024×768 iPad'de mantıksal genişlik yaklaşık 1067 birim olur. Ölçek küçülmez; yalnız orta sütunlar daralır. HTML örneği de böyle davranıyor: 4:3'te yazı küçülmüyor, sütun genişlikleri değişiyor.
- **Güvenli alan**: Bütün kök paneller `SafeArea` bileşeninin içinde durur. Kenar boşluğu 12 px.
- **Dokunma hedefi**: En az 48×48 px. Kut madalyonu 172 px, Savaşa! düğmesi 164–205 × 176–192 px.
- **Yazı**: Sistem fontu yerine projede tek bir yuvarlak sans font kullanılır (TMP SDF, Türkçe karakter seti dahil: ç ğ ı İ ö ş ü â). En küçük boyut 11 px. Büyük harf ve geniş harf aralığı yalnız şu üç yerde var: Kut, sonuç şeritleri (ZAFER, YENİLGİ) ve büyük eylem düğmeleri (DEVAM ET, SAVAŞA!, KAYNAŞTIR). Büyük harfe çevirmek için `ToUpper(new CultureInfo("tr-TR"))` kullanılır, yoksa "i" harfi "I" olur.
- **Uzun metin**: Bütün düğme ve kart adlarında TMP *Auto Size* (min 11, max tasarım boyutu) ve *Ellipsis* açık olur. İkon ile metin aynı `HorizontalLayoutGroup` içinde durur, böylece ikon metnin üstüne binmez.
- **İsimlendirme**: Kahraman adı her yerde tam ad olarak yazılır (Kaya Golemi, Davulcu Kurbağa). Kaynaşık birimin adı "İlk × İkinci" kalıbındadır, ör. "Kaya Golemi × Anka". Kısaltma yok.

## 2. Renk belirteçleri

| Belirteç | Hex | Kullanım |
|---|---|---|
| `mor0` | `#12071F` | En koyu zemin, ekran arkası |
| `mor1` | `#1F0D36` | Panel alt degradesi |
| `mor2` | `#34175A` | Kart zemini |
| `mor3` | `#542A86` | Mor düğme orta tonu |
| `mor4` | `#7A45B8` | Mor düğme üst tonu |
| `panelUst` / `panelAlt` | `#3E1C66` / `#1E0C36` (alfa 0,95–0,97) | Panel dolgusu, yukarıdan aşağı |
| `altin` | `#F2BF4A` | Panel kenarı, vurgu |
| `altinAcik` | `#FFE9A6` | Başlık yazısı, iç parlama |
| `altinKoyu` | `#A8691A` | Düğme alt dudağı |
| `altinKK` | `#3D2106` | Dış kontur (her panelin 2 px dış çizgisi) |
| `yakut` | `#FF3D63` | Rakip paneli, düşman can çubuğu, yenilgi |
| `zumrut` | `#3FD68F` | Kazanılan tur, "★2 olur", çevrimiçi noktası |
| `safir` | `#43A6FF` | Yetenek etiketi, seçili panel mücevheri |
| `ametist` | `#C47BFF` | Pasif etiketi, dükkân mücevheri |
| `pembe` | `#FF6F9A` | Kaynaşma madalyonu halkası |
| `k1` / `k2` / `k3` | `#B9C3CF` / `#43A6FF` / `#FF9E2C` | Kademe: gümüş taş, safir, kor-altın |
| `yazi` | `#FFF4DC` | Ana yazı |
| `yazi2` | `#E2D3F5` | İkincil yazı |
| `soluk` | `#B4A2CC` | Üçüncül yazı (etiket, olasılık) |
| `canDost` | `#9DFFB0 → #2FBF5A` | Dost can çubuğu |
| `canDusman` | `#FF9AA8 → #E0243E` | Düşman can çubuğu |
| `mana` | `#9FD8FF → #2F86FF` | Mana çubuğu, dolunca beyaz ışıma |
| `kalkan` | `#FFFFFF → #B9CCE6` | Kalkan dilimi, can çubuğunun ucunda |

**Gün batımı degradesi** (`#FFD27A → #FF8A4C → #FF5D86 → #B03FD0`, yukarıdan aşağı) yalnız KAYNAŞTIR, Paylaş ve kaynaşık yuvanın çerçevesinde kullanılır. Kaynaşma ve paylaşma böylece bir renk ailesinde buluşur. Kut ise tek başına altın güneş olarak kalır. Altın düğme (`#FFF2B0 → #FFD45C → #F0A92A → #C4740F`) birincil eylem içindir: DEVAM ET, SAVAŞA!, Yeniden oyna, Devam.

**Mücevher rengi panelin işini anlatır**: rakip yakut, dükkân ametist, seçili kahraman safir, tahta ve kodeks kor-altın (`k3`), soylar altın, maç sonu zümrüt. Mücevher tek bir gri tonlu sprite'tır; renk `Image.color` ile verilir.

## 3. Yazı belirteçleri

| Rol | Boyut | Kalınlık | Not |
|---|---|---|---|
| Dev başlık (ZAFER, KUT) | 40–70 px | Black (900) | Harf aralığı 0,12–0,14 em, 2 katmanlı alt gölge |
| Eylem düğmesi | 26–36 px | Black | DEVAM ET 36, SAVAŞA! 30 (4:3'te 26), KAYNAŞTIR 21 |
| Rozet değeri (altın, kupa) | 19–26 px | Black | Altın sayısı 26 |
| Panel başlığı | 14–15 px | Black | Altın açık renk, harf aralığı 0,03 em, büyük harf yok |
| Kahraman adı (seçili) | 19 px | Black | |
| Kart / yuva adı | 13 px | Black | Kaynaşık yuvada 12 px |
| Gövde, açıklama | 12–13 px | Bold (700) | Satır yüksekliği 1,3 |
| Etiket (stat adı, "kalan", "Eksik") | 11–12 px | Bold | Hiçbir yazı 11 px'in altına inmez |

Bütün yazılarda 1–2 px koyu alt gölge (`#000`, alfa 1) vardır. UGUI'de TMP *Underlay* ile yapılır; `Shadow` bileşeni kullanılmaz, köşe sayısını artırır.

## 4. Ekranlar

Ölçüler px cinsinden, önce 1280×800, parantez içinde 1024×768 değeri var. Çapa (anchor) sözcükleri Unity RectTransform anlamındadır.

### 4.1 Ana ekran (`ana`)

- **Arka plan**: `gokyuzu.webp`, tam ekran *cover*. Üstüne yukarıdan aşağı koyulaşan mor perde biner (alfa 0,2 → 0,82).
- **Üst şerit** (üst-uzat, y=16, h=56): oyuncu rozeti (avatar + ad + sezon), Kupa rozeti, Ustalık rozeti. Ayarlar düğmesi sağ üste çapalı, 56 px yuvarlak.
- **Orta sütun** (orta-çapa, genişlik 560): logo (520 × en çok %30 ekran yüksekliği), slogan (16 px), **DEVAM ET** (560×112, altın, maç durumu ve 7 elmaslı ilerleme), üçlü satır (Düello Kodu, Kahramanlar, Nasıl Oynanır; her biri yaklaşık 179×76, mor), en altta **Yeni maç başlat (~7 dk)**. Yeni maç yalnız altı çizili bir yazı düğmesidir: hedefi 208×48, onay penceresi açar. Süren maçı kazara silmemek için DEVAM ET açık ara baskın tutuldu.
- **Köşe yaratıkları** (alt-sol ve alt-sağ çapa, z-sırası orta sütunun altında): solda Kaya Golemi büyük, önünde Kristal Kurt küçük (%62). Sağda Gece Ayısı büyük, önünde Anka küçük. Kutu yüksekliği min(%50 ekran, 400). 4:3'te küçük olanlar gizlenir ve yükseklik %40 ekrana iner, böylece yaratıklar düğmelerin arkasına girmez.
- **Alt şerit**: solda "Çevrimiçi hayalet havuzu bağlı" (yeşil nokta), sağda "Güç satılmaz · bütün kahramanlar herkese açık".

### 4.2 Maç ekranı (`mac`): dükkân ve tahta

Oyunun %80'i burada geçer. Izgara yukarıdan aşağı üç satırdır: üst çubuk (56), orta alan (esnek) ve dükkân şeridi (192 (176)). Satır arası 10, kenar boşluğu 12.

- **Üst çubuk** (soldan sağa): canlar (5 kalp, boşalan kalp `#3A2550`), Zafer x/7 (7 elmaslı iz), Tur, **alamet şeridi** (esnek genişlik, kızıl degrade, ay simgesi, "Kan Ayı — herkes +%20 hasar"; 4:3'te üstteki "Bu turun alameti" etiketi gizlenir, açıklama ikinci satıra iner), altın rozeti (26 px sayı), ayarlar.
- **Orta alan**: üç sütun. Sol sütun clamp(240, %22, 288), sağ sütun clamp(256, %24, 300), orta sütun kalan alan. Sonuç 1280'de 282 / 650 / 300, 1024'te 240 / 480 / 256.
  - **Sıradaki rakip** (sol üst, h≈270): ekranın en parlak paneli. Yakut degrade zemin, üstte yakut ışıma, dışta 26 px pembe-kırmızı hale, yakut mücevherler. İçerik sırası şöyle:
    - Başlık: göz ikonu, "Sıradaki rakip", "Tur 6".
    - Kim satırı: avatar, ad, "Gerçek" etiketi, kupa ve can.
    - **2×3 mini tahta**: solda dikey "Ön" ve "Arka" etiketleri. Hücreler yaklaşık 64×48, kademe renkli çerçeveli, yıldızlı. Kilitli 6. yuva kilit simgesiyle gösterilir. Boş kutu yok, çünkü A'daki "5 kahraman ama boş kutu" kafa karışıklığı böyle çözüldü.
    - Adı yazılı aktif soy çipleri (Karanlık 3, Bilge 2).
    - Tek satırlık karşı kurma ipucu, ampul ikonlu ve kesikli çerçeveli.
  - **Soyların** (sol alt, kalan yükseklik): her aktif soy iki satırlık bir kutudur. Üst satırda simge (28), ad, sayı ve eşik kutuları `[2][4]`; ulaşılan eşik altın yanar. Alt satırda bonus metni (12 px, 4:3'te de görünür). "Biri eksik" soylar başlığın sağında küçük soluk simgeler olarak durur ("Eksik" + 4 simge); dokununca açıklama penceresi açılır.
  - **Takımın** (orta, kalın panel): üstte "Düşman bu yönde" oku. Solda dikey "Ön sıra" (yakut tonlu) ve "Arka sıra" (altın tonlu) etiketleri. 2×3 yuva, her yuva yaklaşık 190×155 (133×148). Altta "Yedek 3/4" başlığı ve yanında "Taşımak için boş yuvaya dokun" yazısı, ardından 4 yedek yuvası (142×96 (99×92)). Bir kahraman seçiliyken boş yedek yuvası kesikli altın çerçeveyle "Koç'u buraya taşı" der. Açılmamış yuva kesikli çerçeve, kilit ve "Tur 7'de açılır" yazısı gösterir.
  - **Seçili kahraman** (sağ, safir mücevher):
    - Portre (70–84) ve ad.
    - Yıldız, kademe etiketi `K2` ve sağda **Sat +2** düğmesi. Sat koyu bordo ve sade; KAYNAŞTIR'dan uzakta durur, ikisi karışmaz.
    - Soy çipleri ve "Ustalık Sv.1".
    - **6 stat**: 2 satır × 3 kutu (Can, Saldırı, Hız, Menzil, Mana, Sıra). Etiketler 11 px, değerler 15 px.
    - Yetenek kutusu (safir sol çizgi) ve pasif kutusu (ametist sol çizgi).
    - Panelin dibinde, başparmağa yakın: **KAYNAŞTIR** (tam genişlik, 62 yüksek, gün batımı degradesi; alt satırı "3 altın · sonra 2. kahramana dokun").
    - En altta kaynaşma şeması: `[Koç] + [?]` ve "Yetenek Koç'tan, pasif ikinciden gelir."
- **Dükkân şeridi**:
  - Solda **Yenile** (1 altın) ve **Kilitle** üst üste (124×91 (104×83)). Sol başparmak bölgesinde durur.
  - Ortada dükkân paneli (kalın, ametist). Başlıkta "Dükkân" ve ikincil ağırlıkta, soluk renkte "Şans: K1 %45 · K2 %40 · K3 %15".
  - 5 kart (167×138 (128×122)). Kartın içeriği:
    - Sol üstte açık kademe etiketi `K1/K2/K3` (yalnız renge bırakılmadı, renk körlüğü için) ve altında soy simgeleri.
    - Sağ üstte altın fiyat hapı.
    - Altta ad plakası.
    - Elde kopyası olan kartta sağ altta "Elinde 1/3" rozeti.
    - Alınca birleşip yükselecek kartta zümrüt kenar ve ışıma, altta "↑ ★2 olur · 2/3" rozeti.
    - K3 kartlarında hafif turuncu dış ışıma.
  - Sağda **SAVAŞA!** (205×192 (164×176)). Ekranın en büyük hedefi, altın, sağ başparmak bölgesinde. Altında "SisAvcısı'na karşı" yazar.

**Kaynaşık birim tahtada şöyle görünür**:

- Çerçeve gün batımı degradesidir (tek bir 9-slice sprite).
- Zeminde turuncu ve mor iki yumuşak ışık lekesi var.
- Sağ üstte "KAYNAŞIK" kurdelesi durur. Yıldızlarla çakışmasın diye sağa çapalı.
- Ana gövde ilk kahramandır (yeteneği veren).
- **Sağ altta ikinci kahramanın yuvarlak madalyonu** var: yuva genişliğinin %32'si, krem iç çizgi, pembe dış halka, pembe ışıma.
- Birleşik 4 soy simgesi sol kenarda dikey sıralanır.
- Plakada "Kaya Golemi × Anka" yazar.

Aynı madalyon dili rakip önizlemede, savaşta (birimin sağ alt yanında) ve maç sonu takım portresinde tekrar eder. A'daki üst üste bindirilmiş ikinci silüet savaş ölçeğinde okunmadığı için bırakıldı.

### 4.3 Savaş ekranı (`savas`)

- **Arka plan**: `arena_konsept.webp`, genişliği max(%100 ekran genişliği, %150 ekran yüksekliği), en-boy 3:2, ortalı ve %4 yukarı kaydırılmış. Unity'de bu katmanın yerini 3D sahne alır; HUD aynı kalır.
- **Birim üstü** (birim genişliğinin %100'ü kadar): üstte yıldızlar, kaynaşıksa sağda "Kaynaşık" etiketi. Altında koyu kutu içinde can çubuğu (10 px; kalkan beyaz dilim olarak canın ucuna eklenir) ve mana çubuğu (6 px; dolunca beyaz ışır). Durum etiketi (ör. "Sersem") birimin göğsünde 13 px, açık mavi hap ve ikonla gösterilir. Yetenek çıkınca birimin üstünde altın konuşma balonu belirir ("Kaya Fırlat!").
- **Uçan sayılar**: hasar 27 px beyaz, kritik 38 px altın, yanık 21 px turuncu, iyileşme yeşil. Hepsinde 2 px koyu kontur var. Hareket notu bölüm 6'da.
- **Üst şerit** (üst-uzat, kenar boşluğu 14):
  - Sol üst: rakip kartı (yakut panel; avatar, "Rakip · Tur 6", ad, kupa).
  - Üst orta: **skor bileşeni**. "Sen %72" yeşil çubuk + süre kutusu (84×62, "0:18 kalan") + "Rakip %41" kırmızı çubuk. Çubuk genişliği clamp(130, %16, 190).
  - Sağ üst: alamet çipi (ay simgesi, "Kan Ayı", "herkes +%20 hasar").
- **Duraklat**: sol kenar, dikey ortada, 58×58.
- **Hız seçici**: sağ kenar, yukarıdan %24'te, dikey 1× / 2× / 3× (58×54), altında "Hız" yazar. Seçili olan altın ve beyaz dış çizgilidir. Kut'tan yukarıda ve ayrı durur, duraklatla yan yana değildir.
- **Ayakta kalanlar** (sol alt): iki satır, "Sen" ve "Rakip". Her satırda 5 küçük yuvarlak portre (30 px); ölenler gri. Sonda "4/5" yazar.
- **KUT** (sağ alt, sağ başparmağın altı): imza mekaniği ve ekranın en belirgin öğesi.
  - **Hazır**: 172 px altın güneş diski (beyaz-sıcak çekirdek, turuncu kenar, 4 px altın halka, dışta 40 ve 90 px sıcak ışıma). Arkasında 12 sn'de bir dönen ışın halkası. Ortada "KUT", altında "1/1" yazar. Sol altta beyaz "dokun" eli var. Ekranın sağ alt köşesine hafif altın parıltı düşer. Solda esnek genişlikli bilgi bandı: "KUT HAZIR / Bir kahramanına dokun, yeteneği hemen patlasın. Savaşta 1 kez." Bandın genişliği en çok 380 (4:3'te 300). Sabit kol yok, metin uzarsa bant büyür. Dost birimlerin ayağında **altın halka nabız atar** (1,2 sn).
  - **Kullanıldı**: disk grileşir (`#5A4A70`), içinde Kut'u kullanan kahramanın portresi, sağ altta zümrüt onay rozeti, üstte "0/1" görünür. Band "Kut kullanıldı / Kaya Golemi × Anka · 9. sn / Sonraki savaşta yenilenir" der. Dost halkalar söner. Seçilen kahramanın üstüne ışık sütunu iner.
- **Sonuç bandı** (`durum=zafer|yenilgi`): ekranın %44 yüksekliğinde tam genişlik koyu mor bant. Üst ve alt kenarda 4 px altın çizgi (yenilgide yakut). "ZAFER" 70 px altın, alt satırda "+1 zafer · 5/7 · Maçın yıldızı: …". Ortada **Devam ▶** (220×58, altın). Bant açıkken ayakta kalanlar paneli gizlenir.

### 4.4 Maç sonu (`son`)

- **Arka plan**: gökyüzü, logonun arkasından çıkan geniş ışın halkası (dönmeyen, alfa 0,12) ve kart dışında kalan alana serpilmiş konfeti. Yenilgide ışın ve konfeti yok.
- **Kart**: kalın panel, zümrüt mücevher, genişlik min(980, %96 ekran). Üst kenara taşan **altın şerit** (560×84) var: "ZAFER!" 44 px, alt satırı "Arena senin · 7 zafer". İki ucunda kuyruklu kurdele ve yıldızlı altın madalyon durur. Yenilgide şerit kırmızı olur ve "MAÇ BİTTİ" yazar.
- **İki sütun** (sol 1 : sağ 1,15):
  - Sol sütun:
    - Özet: 7 zafer / 3 can kaldı / 9 tur.
    - **Tur geçmişi**: yalnız oynanan turlar, yeşil ve kırmızı kutular, başlıkta "7 kazanıldı · 2 kaybedildi", altında renk açıklaması. A'daki anlamsız boş kutular kaldırıldı.
    - **Kupa**: 1 240 → 1 280, +40 hapı, lig ilerleme çubuğu, ustalık açılımı (portre ile "Dağ Koçu Sv.2 · yeni çerçeve açıldı").
  - Sağ sütun:
    - **Son takımın**: 6 portre, kaynaşık olanda madalyon.
    - **Maçın yıldızı** kutusu.
    - Düello kodu tam genişlik satırda, altında Kopyala (mor) ve **Paylaş** (gün batımı) yan yana.
    - **Sırada**: eşleşme aralığı ve haftalık görev, ilerleme çubuğuyla.
- **Eylemler**: Ana ekran (mor, 180×56) ve **Yeniden oyna** (altın, 280×70). Birincil eylem açıkça daha büyük.

### 4.5 Kodeks (`kodeks`)

- **Üst çubuk**: Geri (56×52), "Kahramanlar ve soylar" başlığı, sağda kısa not ve Ustalık rozeti. Not 4:3'te gizlenir.
- **Sol panel** (esnek 1,45 pay; kalın, k3 mücevher):
  - Filtre satırı: Hepsi / Kademe 1 / 2 / 3, 48 yüksek. Seçili olan altın.
  - **4×4 kahraman ızgarası**: kart 172×144 (134×136). Kademe renkli çerçeve, sol üstte soy simgeleri, sağ üstte `K1–K3`, altta ad, mavi noktalı yetenek adı ve mor noktalı pasif adı.
  - Seçili kart altın çerçeveli ve ışımalı. Dokununca ayrıntı penceresi açılır (statlar ve tam metinler).
- **Sağ panel** (en az 330): 10 soy satırı, eşit yükseklikte (61 (58)). Her satırda simge (38), ad, sağda o soyu taşıyan kahramanların 22 px portreleri, altında iki eşik satırı "2 · +%15 saldırı hızı" ve "4 · +%35 saldırı hızı".

## 5. Bileşen listesi

Kenar payları 1× çözünürlük içindir. Sprite'lar 2× üretilir, payı da 2 ile çarpın.

| Bileşen | Amaç | Durumlar | 9-slice payı |
|---|---|---|---|
| **Panel ince** | Yan paneller (rakip, soylar, seçili, kutular) | normal; vurgulu (rakip: yakut dolgu ve dış ışıma, ayrı Image) | 16 (köşe 14 px yarıçap + 2 px kenar) |
| **Panel kalın** | Tahta, dükkân, maç sonu kartı, kodeks | normal | 18 (14 yarıçap + 3 kenar + 1 iç çizgi) |
| **Panel başlık şeridi** | 30 px başlık bandı, alt kenarında altın çizgi | normal | sol/sağ 24, üst/alt 0 (yatay esner) |
| **Köşe mücevheri** | Panelin iki üst köşesine taşan elmas | renk = rol (tint) | yok (14×14 sprite) |
| **Düğme altın** | Birincil eylem | normal; basılı (3 px aşağı, alt dudak 1 px, renk %8 koyu); pasif (%40 doygunluk, %60 opak, ışıma yok) | üst 14, sol/sağ 16, alt 20 (dudak dahil) |
| **Düğme mor** | İkincil (Yenile, Kilitle, üçlü menü, hız) | normal; basılı; seçili (hız: altın düğmeye geçer + 3 px açık altın dış çizgi); pasif | aynı |
| **Düğme gün batımı** | KAYNAŞTIR, Paylaş | normal (dış pembe ışıma); basılı; pasif (altın yetmiyorsa: gri, alt satır "3 altın gerekli") | aynı |
| **Düğme sat** | Sat | normal (bordo, sade); basılı; onay (ikinci dokunuşta "Emin misin?" 2 sn) | 12 |
| **Düğme sade** | Filtre, metin düğmesi | normal; seçili (altın dolgu) | 12 |
| **Rozet** | Üst çubuk sayaçları (can, zafer, tur, altın, kupa) | normal; değişim anı (bkz. 6) | sol/sağ 26 (hap), üst/alt 0 |
| **Yuva** | Tahta ve yedek | boş (ortada sönük elmas); dolu (kademe renkli kenar); ★2 (iç buz-beyaz ışıma); seçili (açık altın kenar + 22 px altın ışıma + "Seçili" etiketi); hedef (kesikli açık altın, "buraya taşı"); kilitli (kesikli, kilit + "Tur 7'de açılır"); kaynaşık (gün batımı çerçeve) | 18 |
| **Kaynaşma madalyonu** | İkinci kahraman portresi | tek durum; savaşta 2 katman ışıma | yok (daire, Mask) |
| **Dükkân kartı** | Satın alma | normal; yükselir (zümrüt kenar ve ışıma + rozet); elde var ("Elinde 1/3"); kilitli (kesikli altın iç çizgi); alınamaz (altın yetmiyor: fiyat hapı kırmızı, kart %70 opak); satıldı (boş zemin, sönük elmas) | 16; çerçeve gri tonlu, renk = kademe |
| **Soy satırı** | Aktif soy | eşikte (altın zemin); eşik 4'te (zemin daha parlak + simgeye hale) | 12 |
| **Eşik kutusu** | `[2][4]` | sönük; yanık (altın degrade) | 6 |
| **Can/mana çubuğu** | Birim üstü | dost (yeşil); düşman (kırmızı); kalkan dilimi; mana dolu (beyaz ışıma) | çerçeve 6 |
| **Kut madalyonu** | Savaş başına 1 dokunuş | hazır (nabız + dönen ışın); basılıyken (%92 ölçek); kullanıldı (gri + portre + onay); kilitli (savaş başlamadan: gri, "Hazırlanıyor") | yok |
| **Kut bandı** | Kut açıklaması | hazır (altın-kahve degrade); kullanıldı (gri-mor) | sol 38 (yarım daire), sağ 0 |
| **Sonuç şeridi** | ZAFER / MAÇ BİTTİ | zafer (altın); yenilgi (kırmızı) | sol/sağ 40 (kuyruklar dahil) |

## 6. Animasyon ve geri bildirim

- **Düğme basma**: Basınca 60 ms'de 3 px aşağı iner, alt dudak incelir, hafif "tık" sesi çalar. Bırakınca 120 ms'de *back-out* eğrisiyle geri gelir. Pasif düğmeye basınca 4 px yatay titreme olur ve nedeni küçük bir baloncukta yazar ("Altın yetmiyor").
- **Kart satın alma**: Kart 80 ms'de %105'e büyür, sonra 260 ms'de *ease-in* eğrisiyle boş yedek yuvasına uçar ve yolda %60'a küçülür. Yuvaya inince 150 ms beyaz parlar. Altın rozeti eksi değeri gösterip 1 kez sallanır, düşen altın "-2" olarak yukarı süzülür. Kartın yeri sönük elmaslı boş zemine döner.
- **Birleşme (3 aynı → ★2)**: Üç kopya 300 ms'de ortadaki yuvaya çekilir. Beyaz ışık patlaması (250 ms), yeni yıldız yukarıdan düşüp yerine oturur (*bounce*). Yuva 600 ms buz-beyaz ışır. "★2!" yazısı yukarı süzülür.
- **Kaynaşma anı** (oyunun imzası, en uzun ve en doyurucu animasyon, toplam ~1,4 sn):
  1. KAYNAŞTIR'a basılınca bütün uygun yuvalar pembe kesikli halkayla nabız atar, uygun olmayanlar %50 kararır.
  2. İkinci kahramana dokunulunca iki portre ekranın ortasına çekilir ve birbirinin çevresinde 2 tur döner. Arkada gün batımı renginde iki halka iç içe geçer (KAYNAŞTIR ikonunun büyüğü).
  3. Beyaz patlama, ekran 80 ms beyaza yakın parlar.
  4. Yeni birim, madalyonuyla birlikte yuvaya iner. "Kaya Golemi × Anka" adı ve "Yetenek: Kaya Fırlat · Pasif: Yeniden Doğuş" kartı 2 sn görünür. Birleşen 4 soy simgesi tek tek (60 ms arayla) yuvanın sol kenarına diziliyor.
  5. Bu birleşim ilk kez bulunduysa "Yeni kaynaşma!" rozeti ve paylaş kısayolu görünür.
- **Kut hazır nabzı**: Madalyon 1,2 sn'lik döngüde %100 → %104 ölçeklenir ve ışıması yoğunlaşır. Işın halkası 12 sn'de bir tam döner. Dost halkalar aynı ritimde nabız atar. Savaşın ilk 3 saniyesinde bant "KUT HAZIR" yazısıyla bir kez yatayda parlar (soldan sağa ışık geçişi).
- **Kut kullanımı**: Kahramana dokunulunca zaman 250 ms %30 hıza düşer. Madalyondan kahramana altın bir iz uçar, kahramanın üstüne ışık sütunu iner (400 ms), ekran kenarına altın vinyet düşer, ardından yetenek patlar. Madalyon griye döner ve içinde kahraman portresi belirir. Onay rozeti *pop* eğrisiyle gelir.
- **Uçan hasar sayıları**: 600 ms'de 40 px yükselir. İlk 100 ms'de %130'dan %100'e iner, son 200 ms'de söner. Kritik vuruşta 1 kez sallanır.
- **Rakip önizleme**: Dükkân açıldığında panel 300 ms'de soldan kayar ve yakut ışıma bir kez parlar. Yeni tur geldiğinde mini tahtadaki portreler 40 ms arayla belirir.
- **Sonuç bandı**: Ekranın iki yanından 300 ms'de kapanır. "ZAFER" yazısı %140'tan %100'e iner, ardından altın parıltı süzülür. Devam düğmesi 400 ms sonra belirir; böylece yanlışlıkla geçilmez.
- **Maç sonu**: Şerit yukarıdan düşer ve oturur. Konfeti 1,5 sn yağar, sonra birikmiş olarak kalır. Kupa sayısı 800 ms'de sayarak artar. Tur kutuları 50 ms arayla yanar.

## 7. ChatGPT (GPT Image) ile çizdirilecek raster parçalar

Yalnız CSS'in ya da UGUI'nin düz şekil, degrade ve gölgeyle yapamadığı parçalar istendi. Tahta taşı (`gorsel/doku_tas.webp`), soy simgeleri, portreler, logo ve arena zaten hazır. Konfeti UGUI parçacık sistemiyle düz renkli dikdörtgenlerden yapılır. Kurallar:

- Hiçbir parçaya yazı gömülmez.
- Hepsi 2× çözünürlükte ve saydam PNG olarak istenir.
- 9-slice parçaların kenarları üretimden sonra elle düzleştirilir: kenar kalınlığı ve köşe yarıçapı sabitlenir, ortası düz renge çekilir.
- Gri tonlu istenenler Unity'de `Image.color` ile renklendirilir.

★ işaretliler önemlidir, önce onlar üretilir.

| # | Dosya adı | Amaç | Saydam | İngilizce komut |
|---|---|---|---|---|
| 1 ★ | `panel_altin_9s.png` | Bütün panellerin çerçevesi (ince ve kalın aynı sprite; kalın için kenar payı büyütülür) | Evet | `Game UI 9-slice panel frame, flat front view, rounded rectangle with 28px corner radius at 1024px size, polished gold border of even thickness (about 3% of width) with a thin dark bronze outer outline and a thin pale-gold inner bevel line, NO corner ornaments, perfectly straight uniform border segments so it can stretch, inner area a flat deep purple (#3E1C66 top to #1E0C36 bottom) with a very subtle soft top inner glow, hand-painted fantasy mobile game style matching a golden sun logo, no text, no characters, centered, fully transparent background, PNG, 1024x1024.` |
| 2 ★ | `mucevher_gri.png` | Panel köşe mücevheri (renk tint ile: yakut, ametist, safir, zümrüt, kor-altın) | Evet | `Single faceted diamond-shaped gemstone set in a thin gold bezel, game UI icon, top-down view, the gem itself in neutral light grey / white tones only (so it can be color-tinted in engine) with crisp facets and a bright white specular highlight, gold bezel keeps its gold color, hand-painted fantasy mobile game style, centered, transparent background, no text, PNG, 256x256.` |
| 3 ★ | `dugme_taban_gri_9s.png` | Düğme tabanı: parlama bandı, alt dudak ve kontur (altın, mor, sat bu sprite'ın tint'i) | Evet | `Two game UI button sprites side by side, normal and pressed states, 9-slice friendly rounded rectangle with 24px corner radius at 512px width, neutral greyscale glossy surface (light grey top to mid grey bottom) so it can be tinted, bright white highlight strip along the top inner edge, thicker darker bottom lip for 3D depth (pressed version has the lip compressed to one third), thick dark outline of even width, plain stretchable middle, no ornaments, hand-painted soft 3D mobile game style, no text, transparent background, PNG, 1024x384.` |
| 4 ★ | `dugme_gunbatimi_9s.png` | KAYNAŞTIR ve Paylaş düğmesi | Evet | `Game UI call-to-action button, 9-slice rounded rectangle with 24px corner radius at 512px width, sunset gradient surface from warm golden yellow at the top through orange and coral pink to magenta-violet at the bottom, a few faint ember sparkles inside, glossy white highlight strip on top, darker plum bottom lip for 3D depth, thin pale-gold rim and dark outline, soft pink outer glow, plain stretchable middle, hand-painted fantasy mobile game style, no text, transparent background, PNG, 1024x384.` |
| 5 ★ | `kut_madalyon.png` | Kut düğmesi: hazır ve kullanıldı durumları yan yana | Evet | `Two circular game UI medallions side by side, empty center for overlay text. Left "ready": a radiant golden sun disc with a white-hot glowing core fading to orange at the edge, ornate thick gold ring rim with small engraved sun runes, a dark bronze outer outline, warm bloom and tiny sparkles, magical and powerful but cute. Right "used": the exact same medallion drained of power, desaturated slate-lavender stone face with dull gold rim, no glow, no sparkles. Hand-painted fantasy mobile game style matching a golden "sun disc" game logo, no text, no letters, transparent background, PNG, 1536x768.` |
| 6 ★ | `kut_isin_halkasi.png` | Kut madalyonunun arkasında dönen ışın halkası (ayrı sprite, dönme ve radial fill için) | Evet | `Circular ring of sharp golden sun rays radiating outward from an empty transparent center (center hole about 60% of diameter), 24 evenly spaced tapered rays alternating long and short, warm white-gold glow, rotationally symmetric so it can spin seamlessly, soft additive-friendly edges, hand-painted fantasy style, no text, transparent background, PNG, 1024x1024.` |
| 7 | `isik_sutunu.png` | Kut kullanılınca kahramanın üstüne inen ışık ve yerdeki rün halkası | Evet (additive karışım) | `VFX sprite: vertical beam of heavenly golden light descending from the top, soft feathered edges, bright white-gold core fading to fully transparent at the top, a glowing golden rune circle ellipse on the ground at its base, a few floating light motes, additive-blend friendly, hand-painted fantasy style, no text, transparent background, PNG, 512x1024.` |
| 8 ★ | `kart_cerceve_gri_9s.png` | Dükkân ve kodeks kartı çerçevesi; renk = kademe tint'i (gümüş, safir, kor-altın) | Evet | `Vertical collectible card frame for a mobile auto-battler shop, 9-slice friendly, rounded corners (20px radius at 512px width), neutral light-grey metallic border of even thickness with a thin dark outer outline and thin white inner bevel, small ornate filigree only at the four corners, empty fully transparent inside window, flat front view, greyscale so it can be tinted in engine, hand-painted fantasy style, no text, no characters, transparent background, PNG, 512x640.` |
| 9 | `kaynasma_cerceve_9s.png` | Kaynaşık yuvanın gün batımı çerçevesi ve ikinci kahraman madalyon halkası (aynı dosyada iki parça) | Evet | `Two game UI pieces side by side on a transparent background. Left: an empty square tile frame with rounded corners (20px radius at 512px), border of even thickness filled with a smooth diagonal gradient from golden yellow to hot pink to violet, thin cream inner line and dark outer outline, a few tiny warm sparkles only at the corners, straight edges for 9-slice. Right: a small round medallion ring, cream-white inner rim and hot-pink outer ring with a soft pink glow, empty transparent center for a portrait. Hand-painted fantasy mobile game style, no text, PNG, 1024x512.` |
| 10 ★ | `alamet_ikonlari.png` | 8 alamet simgesi (Durgun Gök, Kan Ayı, Sis, Tipi, Kut Yağmuru, Bereketli Pazar, Tutulma, Yaz Sıcağı) | Evet | `Sprite sheet of 8 round game icons in a 4x2 grid, each in a matching thin gold rim with a deep purple background, consistent with existing round faction icons: 1 calm sun half behind a small cloud, 2 huge blood-red full moon, 3 drifting pale lilac fog swirls, 4 blizzard snowflakes and wind streaks, 5 rain of golden sparkles of light, 6 small pile of gold coins with a sparkle, 7 dark eclipse with a glowing violet-gold corona, 8 blazing summer sun with heat waves. Hand-painted soft 3D fantasy style, sunset palette, no text, no cultural or religious symbols, transparent background, PNG, 2048x1024.` |
| 11 | `sonuc_serit.png` | Maç sonu şeridi ve savaş sonucu kurdelesi (gri tonlu; altın ve kırmızı tint) | Evet | `Wide horizontal ceremonial ribbon banner for a game result screen, front view, empty flat center for a title, folded ribbon tails on both ends, neutral light-grey glossy metal-like surface (so it can be tinted gold or red), white highlight strip along the top, darker bottom edge for depth, thick dark outline, small round medallion sockets at both ends, hand-painted fantasy mobile game style, no text, no letters, transparent background, PNG, 2048x512.` |
| 12 | `hud_ikonlar.png` | Altın para, kalp (dolu/boş), kupa, ustalık tacı, yıldız (bronz/gümüş/altın), zafer elması (dolu/boş) | Evet | `Sprite sheet of 12 game HUD icons in a 4x3 grid, consistent hand-painted fantasy style with gold accents and dark outlines, readable at 24 px: shiny gold coin with a small diamond emblem (no letters), glossy red heart, empty dark translucent heart, golden trophy cup, small golden crown, five-point star in bronze, star in polished silver with blue sheen, star in radiant gold, diamond-shaped victory gem lit gold, the same gem as an empty dark socket, small round emerald gem, small round ruby gem. Each centered in its own cell, transparent background, no text, PNG, 2048x1536.` |

Bu listede olmayan her şey UGUI'de düz şekil, degrade ve gölgeyle kurulur: yuvarlak hap rozetler, can ve mana çubukları, eşik kutuları, uçan sayılar, alamet şeridinin kızıl zemini, rakip panelinin yakut ışıması, kodeks satırları. SVG ikonlar (göz, yenile, kilit, kılıç, kaynaşma halkaları, paylaş, kitap, soru, zincir, ayar, ev, oyna, durdur, el, onay, geri, ampul, sersem) HTML'deki `<symbol>` tanımlarından tek renkli sprite olarak dışa aktarılabilir. Unity'de *Vector Graphics* paketiyle ya da 64 px PNG atlası olarak kullanılır.
