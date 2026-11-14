# Kut Arena: öğretici ve açıklayıcılık tasarımı

Kullanıcının şikâyeti şu: yeni oyuncu neyi neden yapacağını bilmiyor. Bu belge o sorunu beş katmanda çözer:

1. İlk maç için yönlendirmeli öğretici.
2. Her öğede bilgi kartı.
3. Savaşın okunur olması.
4. Bağlamsal ipuçları.
5. Kodeks ve sözlük.

Sonda mevcut metinlerin düzeltilmiş hâlleri, veri ve motor değişiklikleri ile kabul ölçütleri var.

Okuma sırası: `TASARIM.md`, `OYNANIS_DERINLIK.md` (asıl oyunun kuralları: seviye, birikimli altın, eşya, 8 kişilik hayalet lobi, Kut Armağanı, Kervan, canavar turları), `ARAYUZ_TASARIM.md` (renk, yazı ve yerleşim belirteçleri). Bu belge o üçünün üstüne kurulur. Çelişki olursa **açıklayıcılık konusunda bu belge geçerlidir**. `OYNANIS_DERINLIK.md` bölüm 10.9'daki öğretici sırasının yerini bu belgenin 2. bölümü alır.

**İlkeler**

- **Bir adım, bir kavram.** Öğretici hiçbir adımda iki yeni şey anlatmaz.
- **Önce yaptır, sonra anlat.** Metin eylemden önce en çok iki kısa cümledir. Asıl açıklama, eylemin sonucu ekranda görünürken gelir ("İşte ★2 oldu: canı ve saldırısı 1,8 katı").
- **Kademeli açılma.** Arayüz öğeleri anlatıldıkları anda açılır. Öğreticinin ilk turunda ekranda yalnız dükkân, tahta, altın ve SAVAŞA! vardır.
- **Her sayı açıklanır.** Ekranda görünen her sayı ya da simge, uzun basınca ne olduğunu söyler. Açıklamasız sayı yoktur.
- **Metin kuralı.** Türkçe, ikinci tekil şahıs, etken çatı. Bir cümle en çok 90 karakter. Rehber balonunda en çok 2 cümle. Oyun içi terimler her yerde aynı sözcükle geçer (bkz. bölüm 6.3 sözlük); eş anlamlı kullanılmaz.
- **Kopya yok.** Türün genel kalıpları (adım adım öğretici, uzun basınca bilgi, hasar tablosu) kullanılır. Hiçbir oyunun metni, simgesi ya da ekran düzeni birebir alınmaz.

---

## 0. Prototipten asıl oyuna: açıklayıcılıkta ne değişiyor

Kullanıcının sorusu ("asıl oyuna çevirince neler farklı olacak") açıklayıcılık açısından şöyle yanıtlanır:

| Konu | Web prototipi (şimdi) | Asıl oyun (Unity) |
|---|---|---|
| Öğretici | Yok. Ana ekranda 7 maddelik "Nasıl oynanır" penceresi var. | 7 turluk yönlendirmeli **Çıraklık Maçı** (bölüm 2). İlk açılışta zorunlu, sonra Kodeks'ten tekrar oynanır. |
| Yeni sistemler | Seviye, eşya, faiz, seri, armağan, Kervan ve lobi yok. | Hepsi var. Öğretici çekirdeği öğretir, geri kalanlar ilk karşılaşmada **İlk kez kartı** ile anlatılır (bölüm 2.6). |
| Bilgi | Dükkân kartına basılı tutunca kısa pencere açılır. Sayılar ★1 değeridir, yıldıza göre değişmez. | Her öğede aynı şablonlu bilgi kartı (bölüm 3). Yetenek sayıları ★1 / ★2 / ★3 olarak gösterilir, şu anki yıldız vurgulanır. |
| Soy metni | Bonusun kime işlediği yazmıyor. Yer soyu aslında **bütün takıma** can veriyor, Gök ise yalnız Gök kahramanlarına hız. Oyuncu bunu bilemiyor. | Her soy satırı kapsamını söyler: "Bütün takım" ya da "Gök kahramanları" (bölüm 7.2). |
| Savaşta okunurluk | Can ve mana çubuğu, uçan sayılar, tek durum hapı. Yetenek adı yok, kimin kime vurduğu görünmüyor. | Yetenek balonu, hedef çizgisi, olay şeridi, durum simgeleri sözlüğü (bölüm 4). |
| Savaş sonu | Yalnız ZAFER / YENİLGİ bandı. | **Savaş özeti**: kahraman başına verilen ve alınan hasar grafiği, Kut'un etkisi ve "Neden?" satırları (bölüm 4.6). |
| İpucu | Rakip panelinde tek satır soy ipucu var, bazıları yanlış. | Kurallı, sıklığı sınırlı bağlamsal ipuçları (bölüm 5). |
| Kodeks | Kahraman ızgarası ve soy listesi. | Sekmeli Kodeks: Temeller, Kahramanlar, Soylar, Eşyalar, Alametler, Armağanlar, Durumlar, Canavarlar, Sözlük, Kısa dersler (bölüm 6). |

---

## 1. Ortak öğretici bileşenleri

Bütün öğretici adımları, İlk kez kartları ve ipuçları aynı dört bileşenle kurulur. Unity'de `OgreticiKatmani` adlı tek bir Canvas (sort order en üstte) içinde durur.

### 1.1 Rehber balonu

- **Konuşan**: Rehber. Portresi Ayaz Baykuşu (`arayuz/portre/baykus.png`), 72 px yuvarlak madalyon, altın halka. Adı balonda yazmaz, yalnız portre görünür.
- **Balon**: ince panel (`ARAYUZ_TASARIM.md` panel ince), en çok 420 px geniş. Metin 17 px Bold, satır yüksekliği 1,35, renk `yazi`. Anahtar sözcük (kavramın adı) `altinAcik` renkte ve Black kalınlıkta yazılır. Bir balonda en çok bir anahtar sözcük vurgulanır.
- **Yerleşim**: Balon hedef öğeyi asla örtmez. Sıra şöyle denenir: hedefin üstü, solu, sağı, altı. Hedefle balon arasında en az 24 px boşluk kalır, kuyruk hedefe bakar. Ekran kenarına 16 px'ten yakın olmaz.
- **Düğme**: Yalnız okuma adımlarında sağ altta "Tamam" (mor düğme, 120×48) bulunur. Eylem adımlarında düğme yoktur; eylem yapılınca adım kendiliğinden geçer.
- **Giriş ve çıkış**: Balon 180 ms'de %92'den %100'e büyüyerek ve saydamlıktan gelir. 120 ms'de söner. Her yeni balonda kısa bir "tın" sesi çalar.

### 1.2 Spot ışığı

- Ekranın geri kalanı `#12071F` alfa 0,65 ile kararır. Hedefin çevresinde 12 px pay bırakılır, köşe yarıçapı hedefinkiyle aynıdır.
- Hedefin çevresinde 3 px `altinAcik` çerçeve, 1,2 sn'lik nabız atar (%100 → %104 ölçek, ışıma 0 → 18 px).
- **Giriş engeli**: Spot ışığı açıkken yalnız hedef dokunulabilir. Başka bir yere dokununca hedef çerçevesi 2 kez titrer (4 px, 80 ms) ve balon bir kez sallanır. Hata sesi çalmaz; yanlış yapmak cezalandırılmaz.
- Sürükleme adımında iki hedef birlikte aydınlanır: kaynak ve bırakılacak yer.

### 1.3 Parmak işareti

- Beyaz eldiven-el simgesi (`#i-el`), 64 px, koyu kontur.
- **Dokun**: hedefin ortasına iner, %90'a basılır, kalkar. Döngü 1,1 sn.
- **Sürükle**: kaynaktan hedefe 1,2 sn'de *ease-in-out* eğrisiyle gider, arkasında altın noktalı iz bırakır, hedefte 300 ms bekler, söner. Döngü 2 sn.
- **Bekleme kuralı**: Adım başlayınca parmak 2 döngü oynar ve gizlenir. Oyuncu 8 sn bir şey yapmazsa parmak yeniden gelir. 20 sn yapmazsa balon "takıldıysan" metnine geçer (her adımda ayrıca yazılı).

### 1.4 Açılma (yeni arayüz öğesi)

Öğreticide gizli bir öğe anlatılacağı an şöyle açılır:

1. Öğe %0 saydamlık ve %90 ölçekten 300 ms'de *back-out* eğrisiyle gelir.
2. Altın bir ışık süpürmesi soldan sağa bir kez geçer (250 ms).
3. Sağ üst köşesine "YENİ" etiketi (yeşil `zumrut` hap, 11 px Black) yapışır. Etiket, öğe ilk kullanılınca ya da 2 tur sonra kalkar.

Öğreticiden sonra açılan her yeni sistem (Armağan, Kervan, Gözcü…) de ilk göründüğünde aynı açılmayı kullanır.

---

## 2. Çıraklık Maçı: ilk maçın yönlendirmeli öğreticisi

### 2.1 Genel kurallar

- **Ne zaman**: İlk açılışta, logo ve dil seçiminden sonra doğrudan başlar. Ana ekrana uğramaz. Öğretici bitmeden Arena'ya girilmez. Hızlı Maç ve Düello da kilitlidir, kilit üstünde "Önce Çıraklık Maçı" yazar.
- **Atlama**: Ayarlar'da "Öğreticiyi atla" seçeneği 3. adımdan sonra görünür. Onay penceresinde "Atlarsan ilk 5 maçta ipuçları sık gelir." yazar. Atlayan oyuncu için ipucu sıklığı `Çok` kipinde başlar (bölüm 5.3).
- **Biçim**: 7 tur, her tur tek rakip. Rakipler açıkça "Alıştırma" etiketlidir: tasarlanmış bot ve canavarlar. Hayalet ya da gerçek oyuncu gibi gösterilmezler.
- **Kurallar**: Asıl oyunun kuralları geçerlidir: Seviye 2 ile başlanır, altın birikir, 4×3 tahta, eşya rafı. Şu farklar vardır:
  - Hazırlık sayacı yoktur.
  - Dükkân, alamet, ganimet ve rakipler senaryodan gelir (bölüm 2.3).
  - Can 100'dür ama **50'nin altına inmez**. Maç kaybedilemez; yedinci turdan sonra her durumda biter.
  - **Altın güvencesi**: Hazırlık başında altın `max(gelir + kalan, adımın ihtiyacı + 1)` olur. Oyuncu altını başka yere harcayıp adımı yapamaz duruma düşmez.
  - Yenile ve Kilitle tur 7'ye kadar kapalıdır.
  - Savaş hızı tur 1–2'de 1×'e sabittir, sonra serbesttir.
- **Süre hedefi**: Ortanca 9 dk, en çok 13 dk.
- **Kayıt**: Her adımın bitişi profile yazılır (`ogretici.adim = n`). Uygulama kapanırsa öğretici o turun hazırlık başından sürer.
- **Belirlenimcilik**: Bütün öğretici savaşları sabit tohumla (`OGR_TOHUM = 20261114 + tur`) oynar. Rakip takımları ve senaryo, oyuncunun yapabileceği her yasal dizilişte planlanan sonucu verecek biçimde testle doğrulanır (bölüm 9).

### 2.2 Tur ve adım planı (özet)

| Tur | Rakip | Alamet | Adımlar (her biri tek kavram) | Açılan öğeler |
|---|---|---|---|---|
| 1 | Canavar: 2 Çakıl Kıpırı | Durgun Gök (gizli) | 1 Satın al · 2 Yerleştir · 3 Savaş | Dükkân, tahta, altın, SAVAŞA! |
| 2 | Canavar: 3 Çakıl Kıpırı | Durgun Gök (gizli) | 4 Üçlü birleştirme · 5 KUT | Yedek, Kut madalyonu |
| 3 | Alıştırma: Taşçı | Durgun Gök (gizli) | 6 Soy · 7 Rakibi önceden görme · 8 Savaş özeti | Soy paneli, rakip paneli, Özet düğmesi |
| 4 | Alıştırma: Kor | Kan Ayı | 9 Eşya · 10 Alamet | Eşya rafı, alamet şeridi |
| 5 | Alıştırma: Gölge | Bereketli Pazar | 11 Seviye | Seviye rozeti, Deneyim Al, faiz göstergesi |
| 6 | Alıştırma: Sürü | Durgun Gök | 12 KAYNAŞTIR | KAYNAŞTIR düğmesi |
| 7 | Alıştırma Ustası | Tipi | 13 Kendi başına | Yenile, Kilitle, Sat; ipuçları açık |

Kut tur 2'ye konur, çünkü oyunun imzasıdır ve "izle-bekle" hissini ilk savaşın hemen ardından kırar. Kaynaştırma tur 6'ya konur, çünkü yetenek, pasif ve soy anlaşılmadan kaynaşma anlaşılmaz.

### 2.3 Senaryo verisi

Öğretici senaryosu tek bir veri tablosudur (`OGRETICI` → `KutOgretici.cs`). Kod adımları bu tablodan okur; metin kodun içine gömülmez.

**Dükkânlar** (soldan sağa 5 kart; yenilenmez):

| Tur | Kartlar |
|---|---|
| 1 | Kaya Golemi, Rüzgâr Ruhu, Kaya Golemi, Kristal Kurt, Davulcu Kurbağa |
| 2 | Kaya Golemi, Kaya Golemi, Sis Yarasası, Davulcu Kurbağa, Kristal Kurt |
| 3 | Davulcu Kurbağa, Kristal Kurt, Bulut Atı, Rüzgâr Ruhu, Sis Yarasası |
| 4 | Kor Semenderi, Davulcu Kurbağa, Zümrüt Yılan, Rüzgâr Ruhu, Bulut Atı |
| 5 | Kristal Kurt, Dağ Koçu, Kaya Golemi, Zümrüt Yılan, Buz Kaplumbağası |
| 6 | Kristal Kurt, Sis Yarasası, Davulcu Kurbağa, Bulut Atı, Rüzgâr Ruhu |
| 7 | Işık Kuğusu, Gölge Tilki, Kristal Kurt, Kaya Golemi, Rüzgâr Ruhu (Yenile açıksa sonrakiler Sv'ye göre normal zarla gelir) |

**Gelir** (hazırlık başında, altın güvencesinden önce): tur 1: 3, tur 2: 3, tur 3: 4, tur 4–7: 5 + faiz + seri + galibiyet. Tur 5'te Bereketli Pazar +2. Faiz, bölüm 1'deki gibi tur 1–3'te yoktur.

**Deneyim**: Tur 1 sonunda gelmez. Tur 2'den itibaren her savaş sonunda +2. Sv 3'e tur 2 sonunda kendiliğinden çıkılır. Tur 5'te oyuncu bir kez Deneyim Al'a basar ve Sv 4 olur (bölüm 2.4 adım 11).

**Ganimet**: Tur 1 sonu 2 altın. Tur 2 sonu 2 altın. Tur 4 hazırlık başı **Yürek + Kabuk** (ganimet küresi tahtaya düşer, dokununca rafa iner). Diğer turlar yok.

**Rakipler** (motor birimi `{h, s, x, y}`; `y` 0 ön, 1 orta, 2 arka):

| Tur | Ad | Takım |
|---|---|---|
| 1 | Çakıl Kıpırları | 2 Çakıl Kıpırı (ön, x=1 ve 2) |
| 2 | Çakıl Kıpırları | 3 Çakıl Kıpırı (ön, x=0, 1, 2) |
| 3 | Alıştırma: Taşçı | Kaya Golemi ★1 (ön, x=1), Kristal Kurt ★1 (ön, x=2), Davulcu Kurbağa ★1 (arka, x=1) |
| 4 | Alıştırma: Kor | Kor Semenderi ★1 (ön, x=1), Kristal Kurt ★1 (ön, x=2), Rüzgâr Ruhu ★1 (arka, x=1) |
| 5 | Alıştırma: Gölge | Sis Yarasası ★2 (ön, x=1), Kaya Golemi ★1 (ön, x=2), Davulcu Kurbağa ★1 (arka, x=1), Kristal Kurt ★1 (ön, x=0) |
| 6 | Alıştırma: Sürü | Kristal Kurt ★2 (ön, x=1), Dağ Koçu ★1 (ön, x=2), Rüzgâr Ruhu ★1 (arka, x=0), Zümrüt Yılan ★1 (arka, x=2) |
| 7 | Alıştırma Ustası | Kaya Golemi ★2 (ön, x=1), Gece Ayısı ★1 (ön, x=2), Sis Yarasası ★1 (ön, x=0), Gölge Tilki ★1 (arka, x=1) |

Rakip takımlarına eşya verilmez. Bot Kut'u 5. saniyede yapay zekâ kuralıyla kullanır (`OYNANIS_DERINLIK.md` 7.4), tur 1–2'de canavarların Kut'u yoktur. Rakip sayıları, bölüm 9'daki "her yasal dizilişte kazanır" testini geçmezse yalnız rakipteki yıldızlar düşürülerek ayarlanır.

### 2.4 Adımlar

Her adım şu alanları taşır: **metin** (rehber balonu), **vurgu** (spot ışığı ve parmak), **eylem**, **geçiş koşulu**, **takıldıysan** (20 sn metni), **sonra** (eylemden hemen sonra çıkan kısa onay balonu; düğmesiz, 2,5 sn).

#### Tur 1

**Adım 0: Karşılama (okuma)**
- Metin: "Arena'ya hoş geldin! Takımını kur, savaşı izle, doğru anda **Kut** ile müdahale et."
- Vurgu yok, ekran hafif kararır. Düğme: "Başlayalım".

**Adım 1: Satın al**
- Açılan: dükkân, altın rozeti (3), tahta (yalnız Sv 2 kadar hücre aydınlık, diğerleri soluk ve kilitli).
- Metin: "Bu senin altının. Kahraman almak için karta dokun: **Kaya Golemi** 1 altın."
- Vurgu: dükkân kart 1 (Kaya Golemi) ve altın rozeti. Parmak: kart 1'e dokun.
- Eylem: kart 1'e dokun. Ardından ikinci balon: "Şimdi **Rüzgâr Ruhu**'nu da al." Vurgu kart 2.
- Geçiş: tahtada Kaya Golemi ve Rüzgâr Ruhu var.
- Takıldıysan: "Parlayan karta bir kez dokunman yeterli."
- Sonra: "Satın aldığın kahraman tahtaya iner. Altının 1 kaldı."
- Not: Diğer kartlar bu adımda karartılmıştır. Adımdan sonra oyuncu kalan 1 altınla istediği kartı alabilir; alınan yedeğe iner.

**Adım 2: Yerleştir**
- Rüzgâr Ruhu satın alınınca ilk boş hücreye, yani ön sıraya iner. Bu bilerek böyle bırakılır.
- Metin: "Rüzgâr Ruhu **uzaktan** vurur. Onu arka sıraya sürükle, önde Golem korusun."
- Vurgu: Rüzgâr Ruhu yuvası ve arka sıranın ortadaki hücresi. Parmak: sürükle. Tahtanın ön sıra etiketi "Ön sıra · önce bunlar vurulur", arka sıra etiketi "Arka sıra · güvende" olarak bu adımda bir kez belirir.
- Eylem: Rüzgâr Ruhu'nu arka sıradaki herhangi bir hücreye taşı.
- Geçiş: Rüzgâr Ruhu `y = 2`.
- Takıldıysan: "Rüzgâr Ruhu'na basılı tut ve parmağını arka sıraya kaydır."
- Sonra: "Güzel. Menzil 3 olanlar arkada, menzil 1 olanlar önde durur."

**Adım 3: Savaş**
- Açılan: SAVAŞA! düğmesi.
- Metin: "Hazırsın. **SAVAŞA!**'ya dokun; savaş kendi kendine oynar."
- Vurgu: SAVAŞA!. Eylem: dokun. Geçiş: savaş ekranı açıldı.
- Savaş içinde iki **bant** çıkar. Bant, düğmesiz ve savaşı durdurmayan bir balondur; ekranın üst ortasında, skorun altında durur ve 3 sn kalır:
  - 1. sn: "Kahramanlar en yakın düşmana kendileri yürür ve vurur."
  - Oyuncu tarafında ilk `yetenek` olayında (beklenen Kaya Golemi, ~6. sn): zaman 600 ms boyunca %35 hıza iner. Golem'in mana çubuğu bir kez parlar, yetenek balonu "Kaya Fırlat!" büyük görünür ve bant şunu der: "**Mavi çubuk** dolunca kahraman yeteneğini kullanır."
- Savaş sonu bandında: "Kazandın! Canavarlar bu turda can almaz." Devam'dan sonra tur 2'ye geçilir.

#### Tur 2

**Adım 4: Üçlü birleştirme**
- Açılan: yedek sırası (önceden alınan kahraman varsa zaten görünür).
- Metin: "Aynı kahramandan **3 tane** toplarsan birleşir ve ★2 olur. İki Kaya Golemi daha al."
- Vurgu: dükkân kart 1 ve 2 (iki Golem) ve tahtadaki Golem. Kartlarda zaten "Elinde 1/3" ve sonra "↑ ★2 olur · 2/3" rozetleri görünür; balonun kuyruğu bu rozete bakar.
- Eylem: iki Golem kartını al. Oyuncu tur 1'de ikinci Golem'i almışsa metin "Bir Kaya Golemi daha al." olur ve tek kart vurgulanır.
- Geçiş: tahtada Kaya Golemi ★2 var.
- Birleşme animasyonu (`ARAYUZ_TASARIM.md` 6) bittikten sonra Golem'in bilgi kartı 2,5 sn kendiliğinden açılır. Kartta can ve saldırı eski ve yeni değerle görünür: "Can 820 → 1 476 · Saldırı 48 → 86".
- Sonra: "★2 kahraman 1,8 kat güçlüdür. Üç ★2 de ★3 yapar (3 kat)."
- Takıldıysan: "Parlayan iki Golem kartına sırayla dokun."

**Adım 5: KUT**
- Savaş öncesi okuma yok. Oyuncu SAVAŞA!'ya kendisi basar; vurgu yalnız düğmede.
- Açılan: Kut madalyonu (savaş ekranı sağ alt). İlk 3 sn madalyon gri ve kilitlidir.
- **3,0. sn**: öğretici **motoru ve görüntüyü durdurur**. Motor görüntüden 0,4 sn önde koştuğu için (`ANIMASYON_PLANI.md`) durdurma motordan yapılır; Kut dokunuşu motorun o anki `t` değerine yazılır. Madalyon açılır (bölüm 1.4).
- Metin: "Bu senin **Kut** gücün: her savaşta bir kez, bir kahramanının manasını anında doldurur. KUT'a dokun."
- Vurgu: Kut madalyonu. Eylem: dokun → Kut seçim kipi açılır (bölüm 4.4).
- İkinci metin: "Şimdi **Kaya Golemi**'ne dokun. Kaya Fırlat hemen patlayacak."
- Vurgu: Golem'in ayağındaki altın halka. Eylem: Golem'e dokun.
- Geçiş: motorda `kut` olayı oluştu. Savaş 1× hızla sürer.
- Kut animasyonu biter bitmez bant çıkar: "Kut, mana dolmasını beklemeden yeteneği açar. Sersemlemiş düşmana bak."
- Savaş sonunda: "Kut'u **doğru anda** kullanmak savaşı çevirir. Kalabalığa sersemletme, ölmek üzere olana kalkan gibi."
- Takıldıysan: "Önce sağ alttaki büyük altın KUT düğmesine, sonra Golem'e dokun."
- Not: Oyuncu Kut'u Golem yerine başka bir kahramana verirse adım yine geçer; metin "Kut'u Rüzgâr Ruhu'na verdin: Kasırga hemen esti." biçiminde o kahramanın yetenek adıyla yazılır.

**Tur 2 sonu (adım değil, bildirim)**: +2 deneyim gelir ve Sv 3 olunur. Tahtada üçüncü hücre açılma animasyonuyla aydınlanır. Bant: "Seviye 3: takımına 1 kahraman daha koyabilirsin." Seviye kavramı tur 5'te ayrıca anlatılır; burada yalnız sonucu gösterilir.

#### Tur 3

**Adım 6: Soy**
- Açılan: soy paneli (sol alt).
- Metin: "Her kahramanın iki **soyu** var. Aynı soydan 2 kahraman koyarsan soy gücü açılır."
- Vurgu: Rüzgâr Ruhu'nun Gök simgesi ve soy panelindeki "Gök 1/2" satırı. Okuma için kısa bir "Tamam".
- İkinci metin: "**Davulcu Kurbağa** da Gök. Onu al ve takıma koy: Gök kahramanları %15 hızlı vurur."
- Vurgu: dükkân kart 1 (Kurbağa). Kartın Gök simgesi bu adımda altın halkalıdır. Parmak: dokun.
- Eylem: Kurbağa'yı al. Tahtada boş hücre (Sv 3) olduğu için tahtaya iner. Ön sıraya inerse adım 2'deki kural için kısa bir ek balon çıkar: "Kurbağa da uzaktan vurur: arkaya al." Bu adımın parçasıdır, ayrı adım sayılmaz.
- Geçiş: `soySay(takim).gok.seviye ≥ 1`.
- Soy satırı altın yanar, eşik kutusu `[2]` dolar, satırın altında "Gök kahramanları +%15 saldırı hızı" yazısı belirir.
- Sonra: "Eşikler 2 ve 4. Panel hangi soyun kaç kahramanı olduğunu hep gösterir."
- Takıldıysan: "Sol üst köşesinde bulut simgesi olan karta dokun."

**Adım 7: Rakibi önceden görme**
- Açılan: rakip paneli (sol üst). Panel soldan kayarak gelir, yakut ışıma bir kez parlar.
- Metin: "Sıradaki **rakibini** savaştan önce görürsün. Paneline dokun, ne kurduğuna bak."
- Vurgu: rakip paneli. Eylem: dokun → rakip bilgi kartı açılır (bölüm 3.5).
- Kartın "Tehdit" ve "Karşı fikir" satırları bu adımda altın çerçevelidir. Örnek metin: "Tehdit: önde Kaya Golemi, %20 az hasar alır. Karşı fikir: arkadan vuranlar onu uzun sürede indirir; önce Kurt'a yüklen."
- Geçiş: oyuncu kartı kapattı.
- Sonra: "Her tur rakibine göre dizilişini değiştirebilirsin."
- Takıldıysan: "Sol üstteki kırmızı panele dokun."

**Adım 8: Savaş özeti**
- Savaş sonu bandında "Devam"ın solunda **Özet** düğmesi (mor, 140×58) açılır.
- Metin: "Savaşta kim ne yaptı? **Özet**'e dokun."
- Vurgu: Özet. Eylem: dokun → savaş özeti açılır (bölüm 4.6).
- Özette en çok hasar veren dost birimin çubuğu vurgulanır. Okuma balonu: "Çubuklar her kahramanın verdiği hasarı gösterir. **Alınan** sekmesi kimin ne kadar dayandığını söyler." Düğme: "Tamam".
- Geçiş: özet kapandı.

#### Tur 4

**Adım 9: Eşya**
- Hazırlık başında tahtanın ortasına ganimet küresi düşer.
- Metin: "Bir **ganimet**! Dokun, içindeki eşya parçaları rafa insin."
- Vurgu: küre. Eylem: dokun. Açılan: eşya rafı (tahtanın solunda dikey, `OYNANIS_DERINLIK.md` 9).
- İkinci metin: "Bunlar **bileşen**. Yürek'i Kaya Golemi'nin üstüne sürükle."
- Vurgu: raftaki Yürek ve Golem. Parmak: sürükle. Sürükleme sırasında Golem'in üstünde baloncuk: "Yürek · +180 can".
- Üçüncü metin: "Şimdi **Kabuk**'u da Golem'e ver. İki bileşen birleşip tam eşya olur."
- Sürükleme sırasında baloncuk birleşimi önceden gösterir: "Yürek + Kabuk = **Dev Kükremesi**: savaş başında yakındaki düşmanlar 3 sn yalnız onu hedef alır."
- Geçiş: Golem'de Dev Kükremesi var.
- Sonra: "Her kahraman en çok 3 eşya taşır. Eşyalar canavar turlarında ve Kervan'da gelir."
- Takıldıysan: "Raftaki parçaya basılı tut, Golem'in üstüne bırak."

**Adım 10: Alamet**
- Açılan: alamet şeridi (üst çubuk). Şerit kızıl degradeyle açılır, ay simgesi bir kez dolar.
- Metin: "Her turun bir **alameti** var: o turun kuralı. Bu tur Kan Ayı. Şeride dokun."
- Vurgu: alamet şeridi. Eylem: dokun → alamet kartı açılır (bölüm 3.4). Kartın "Senin takımına" satırı vurgulanır: "Herkes %20 fazla vurur: sen de, rakip de. Savaş kısa ve sert geçer."
- Geçiş: kart kapandı.
- Sonra: "Sağdaki soluk simge sıradaki turun alameti. Ona göre hazırlan."

#### Tur 5

**Adım 11: Seviye**
- Açılan: seviye rozeti ("Sv 3 · 4/6"), Deneyim Al düğmesi (Yenile'nin üstünde), altın rozetinin faiz göstergesi.
- Metin: "Bu senin **seviyen**. Seviye kadar kahraman koyabilirsin. Deneyim Al'a dokun: 4 altın = 4 deneyim."
- Vurgu: Deneyim Al ve seviye rozeti. Eylem: bir kez dokun.
- Geçiş: Sv 4.
- Seviye atlayınca: tahtada dördüncü hücre açılır, seviye rozeti altın parlar, dükkân başlığındaki olasılık satırı değişim animasyonuyla güncellenir ("K1 %75 → %55 · K2 %25 → %40 · K3 %0 → %5").
- Sonra: "Seviye yükseldikçe takımın büyür ve dükkâna güçlü kahramanlar daha sık gelir. Boş yere bir kahraman koy."
- Ardından (adımın parçası, ayrı kavram sayılmaz): boş hücre kesikli altın çerçeveyle "Buraya bir kahraman" der; oyuncu yedekten ya da dükkândan bir kahraman koyunca adım biter.
- Takıldıysan: "Dükkânın solundaki yukarı oklu düğmeye dokun."
- Not: Faiz bu adımda **anlatılmaz**. Faiz göstergesi görünür ama ilk açıklaması tur 6 hazırlığında İpucu H03 olarak gelir (bölüm 5.4). Böylece adım tek kavramda kalır.

#### Tur 6

**Adım 12: KAYNAŞTIR**
- Metin: "Şimdi oyunun en güzel hilesi. Dükkândan **Kristal Kurt** ve **Sis Yarasası**'nı al."
- Vurgu: kart 1 ve 2. Eylem: ikisini al (oyuncuda zaten varsa o kart atlanır).
- İkinci metin: "Kristal Kurt'a dokun, sonra **KAYNAŞTIR**'a bas."
- Açılan: seçili kahraman panelindeki KAYNAŞTIR düğmesi. Vurgu: önce Kurt, sonra düğme.
- Üçüncü metin: "Şimdi Sis Yarasası'na dokun. İlki **yeteneğini**, ikincisi **pasifini** verir."
- Uygun yuvalar pembe kesikli halkayla nabız atar. Kaynaşma şeması önizlemesi büyür: `[Kurt] + [Yarasa] = Uluma + Can Emici · Çevik, Avcı, Karanlık, Su`.
- Geçiş: kaynaşmış birim oluştu.
- Kaynaşma animasyonundan sonra kart 3 sn açık kalır: "Kristal Kurt × Sis Yarasası · Yetenek: Uluma · Pasif: Can Emici · 4 soy". Ardından ilk melez rozeti "Yeni kaynaşma!" çıkar.
- Sonra: "İki farklı kahraman tek kahraman oldu ve dört soyu birden sayılır. Bedeli 2 + en yüksek kademe."
- Takıldıysan: "Önce Kurt, sonra pembe düğme, sonra Yarasa."
- Not: Oyuncu sırayı ters yaparsa (önce Yarasa) kaynaşma yine geçerlidir; metin sonuçta "Yarasa × Kurt: yetenek Can Emme, pasif Sürü" diye doğru adları yazar.

#### Tur 7

**Adım 13: Kendi başına**
- Açılan: Yenile, Kilitle, Sat düğmeleri. Bağlamsal ipuçları (bölüm 5) açılır.
- Metin: "Artık her şey açık. Bu son alıştırma: rakip Karanlık kurmuş, ona göre diz ve kazan!"
- Düğme: "Tamam". Vurgu yok.
- Bu turda öğretici hiçbir eylemi zorlamaz. Bağlamsal ipuçları **Çok** kipinde çalışır.
- Savaş sonu (kazanılsın ya da kaybedilsin) Çıraklık sonu ekranına geçilir.

### 2.5 Çıraklık sonu ekranı

- Maç sonu kartının (`ARAYUZ_TASARIM.md` 4.4) öğretici sürümüdür. Şeritte "ÇIRAKLIK TAMAM" yazar.
- Sol sütunda **öğrendiklerin** listesi yer alır. Her satır simge ve tek cümledir; 13 adımın kavramları 7 satırda toplanır:
  1. Kahraman al, önde dayananlar, arkada uzaktan vuranlar.
  2. 3 aynı kahraman → ★2, 3 tane ★2 → ★3.
  3. Aynı soydan 2 ve 4 kahraman soy gücünü açar.
  4. Kut: savaşta bir kez, bir kahramanın yeteneğini hemen patlatır.
  5. Kaynaştır: iki farklı kahraman, bir yetenek, bir pasif, bütün soylar.
  6. Rakibini ve alameti savaştan önce oku.
  7. Bileşenleri birleştir, seviye atla, altını biriktir.
- Sağ sütunda ödül yer alır: "Çırak Işığı" Kut efekti. Yalnız görünüştür. Ayrıca iki büyük düğme:
  - **Arena'ya gir** (altın): 8 kişilik hayalet lobi.
  - **Hızlı Maç** (mor, ~7 dk): eski 1'e 1 biçim.
- Arena'nın ilk 3 maçında hazırlık sayacı %50 uzun olur. İpuçları `Çok` kipinde kalır.

### 2.6 İlk kez kartları (öğreticiden sonra)

Öğretici çekirdeği öğretir. Lobi sistemleri ilk karşılaşıldıkları anda bir **İlk kez kartı** ile anlatılır. Kart, rehber balonunun büyük hâlidir: 520 px geniş, solda 120 px resim, en çok 3 kısa cümle ve "Anladım" düğmesi. Kart açılınca hazırlık sayacı durur, kapanınca sürer. Her kart hesap başına **bir kez** gösterilir. Kodeks → Kısa dersler'de tekrar okunur.

| Kimlik | Tetik | Metin | Vurgu |
|---|---|---|---|
| IK1 Lobi | İlk Arena maçı, 1-1 hazırlığı | "Bu lobide sen ve 7 hayalet var. **Hayalet**, başka bir oyuncunun gerçek maç kaydıdır. Herkes 100 canla başlar; son kalan kazanır." | Lobi şeridi (sağ kenar) |
| IK2 Bölüm haritası | İlk Arena maçı, 1-1 | "Üstteki iz bu bölümün turlarını gösterir: kılıç savaş, pençe canavar, deve Kervan, güneş Armağan." | Bölüm haritası |
| IK3 Faiz | İlk kez altın ≥ 10 olunca | "Her 10 altın için turda +1 faiz gelir, en çok +5. Harcamadan önce sikkelere bak." | Altın rozetinin 5 sikke yuvası |
| IK4 Seri | İlk kez 2 PvP üst üste aynı sonuç | "Üst üste kazanmak da kaybetmek de **seri** altını getirir: 2'de +1, 3–4'te +2, 5+'ta +3." | Seri simgesi |
| IK5 Kut Armağanı | İlk 2-1 | "**Kut Armağanı**: üç karttan birini seç. Bu maç boyunca seninle kalır. Her aşamada 1 kez yenileyebilirsin." | Armağan kartları |
| IK6 Kervan | İlk 2-4 | "**Kervan**: üstünde eşya olan kahramanlardan birini seç. Sıralamada gerideysen daha çok seçeneğin olur." | Kervan seçenekleri |
| IK7 Gözcü | İlk 2-2 hazırlığı | "Rakip panelini kaydır: lobideki diğer 6 hayaletin geçen turki takımı **Gözcü**'de." | Rakip paneli kaydırma tutamağı |
| IK8 Havuz | İlk kez bir kartta "Havuzda ≤ 6" | "Her kahramanın sınırlı kopyası var; hayaletler de aynı havuzdan alır. Az kalan kahramanı ★3 yapmak zordur." | Kart altındaki havuz yazısı |
| IK9 Gün Batımı | İlk kez bir savaş 20. sn'yi geçince | "**Gün Batımı**: 20. saniyeden sonra bütün hasar her saniye %10 artar." | Skor bileşenindeki süre kutusu |
| IK10 Kut Yankısı | İlk kez eşyalı bir birim varken Kut seçim kipi | "Eşyalı kahramana verilen Kut **yankı** yapar: her bileşen ek bir etki katar. Simgeler neyi kazanacağını gösterir." | Birimlerin üstündeki yankı simgeleri |
| IK11 Hasar | İlk PvP yenilgisi | "Kaybedince bölüm tabanı + rakibin ayakta kalan kahramanları kadar can gider. Savaşa! altında tahmini yazar." | Can çubuğu ve Savaşa! altı |
| IK12 Söküm Taşı | İlk kez rafa gelince | "**Söküm Taşı** bir kahramanın bütün eşyalarını rafa geri indirir." | Taş |

---

## 3. Bilgi kartları

### 3.1 Ortak davranış

- **Açılma**:
  - Dükkân kartı: uzun bas (350 ms). Dokunmak satın alır.
  - Tahta ve yedek birimi: dokun. Seçer ve sağdaki Seçili kahraman panelini doldurur; bu panel kahraman kartının kendisidir.
  - Rakip mini tahtası, soy satırı, alamet şeridi, eşya, armağan, durum simgesi ve lobi şeridi portresi: dokun.
  - Savaşta birim: dokun. Kut seçim kipi açıksa dokunuş Kut verir, değilse kart açar (bölüm 4.4).
- **Yerleşim**: Kart, açan öğenin yanında açılır ve onu örtmez. Yüzen kartlar en çok 440×520 px boyutundadır, ince panel kullanır ve kuyruğu öğeye bakar. Dışarı dokununca kapanır. Savaşta yüzen kart savaşı durdurmaz; birim ölürse kart "Düştü" etiketiyle gri kalır.
- **Yazı**: Başlık 19 px Black. Gövde 14 px Bold (tablet okunurluğu için `ARAYUZ_TASARIM.md`'deki 12–13 px gövde, kartlarda 14 px'e çıkar). Sayılar Black kalınlıktadır. Etiketler 12 px `soluk` renktedir.
- **Sayı biçimi**: Türkçe biçim kullanılır: binlik ayraç boşluk (1 476), ondalık virgül (0,85), yüzde işareti önde (%20). Süre "1,5 sn".
- **Renk dili**: Yetenek `safir` sol çizgi. Pasif `ametist`. Soy altın. Eşya `kor-altın` (`k3`). Durum kategorisinin rengi bölüm 4.3'te.
- **Kart içi bağlantı**: Kart metnindeki terimler (soy adı, durum adı, "yetenek gücü") altı noktalı çizilir. Dokununca o terimin kartı ikinci katman olarak açılır. En çok 2 katman açılır, üçüncüsü ikincinin yerini alır.

### 3.2 Kahraman kartı

**Şablon** (yukarıdan aşağı):

```
[Portre 96 px]  {ad}                                 K{kademe} · {kademe} altın
                {yıldız göstergesi: ★★★, şu anki dolu, diğerleri boş}
                [soy çipi] [soy çipi] (+ kaynaşmışsa [soy] [soy])
──────────────────────────────────────────────────────────────
Can {can}   Saldırı {atk}   Saldırı hızı {as}/sn   Menzil {menzil} ({yakın|uzak})
Mana {mp}/{mana}  ·  Yetenek gücü +%{YG}  (yalnız YG > 0 ise)
──────────────────────────────────────────────────────────────
YETENEK · {yetenek adı} · {mana} mana
{yetenek metni; ölçeklenen sayılar "★1 / ★2 / ★3" üçlüsüyle}
PASİF · {pasif adı}
{pasif metni; ölçeklenen sayı varsa üçlüyle}
──────────────────────────────────────────────────────────────
Soyların: {soy}: takımında {n}/{sonraki eşik} {✓ ya da "1 eksik"} …
Eşyalar: [simge] {eşya adı} · [simge] … (yoksa "3 boş yuva")
Kaynaşırsa: İlk seçilirse {yetenek}, ikinci seçilirse {pasif} verir.
Ustalık {sv} · Havuzda {kalan}/{toplam}
[Sat +{değer} altın]                          [KAYNAŞTIR {bedel} altın]
```

**Kurallar**

- Can ve Saldırı şu anki yıldızın ve eşyaların sonucudur. Eşya katkısı varsa değerin yanında küçük yeşil "+180" yazar.
- Yetenek ve pasif metinlerindeki ölçeklenen sayılar `200 / 360 / 600` biçiminde yazılır. Şu anki yıldızın değeri `altinAcik` renkte ve Black, diğerleri `soluk` renktedir. Yetenek gücü varsa üçlünün sonuna parantez içinde gerçek değer eklenir: "(YG ile 432)".
- **Süreler ve yüzdeler yıldızla ölçeklenmez** ve tek değer yazılır ("1,5 sn sersemletir", "+%45 saldırı hızı"). Kural motorla aynıdır (`sim.js`: `× c` alanlar).
- Menzil 1 için "yakın", 2 ve üstü için "uzak" yazar.
- Dükkândaki kartta yıldız ★1 olarak gösterilir. Elde 1 ya da 2 kopya varsa başlığın altında "Elinde 2/3: bunu alırsan ★2" satırı çıkar.
- Kaynaşmış birimde başlık "Kristal Kurt × Sis Yarasası" olur. Altında "Yetenek Kristal Kurt'tan · Pasif Sis Yarasası'ndan" satırı yer alır. Ek sözcüğü kısa addan değil tam addan ve doğru ünlü uyumuyla üretilir (bölüm 7.1, `ekAyrilma`).
- Rakip biriminin kartında Sat ve KAYNAŞTIR yoktur. Yerlerinde "Rakibin · ön sıra" yazar.

**Yetenek sayıları** (★1 / ★2 / ★3, `kc` = 1 / 1,8 / 3, gösterimde yuvarlanır):

| Kahraman | Yetenek | Ölçeklenen değerler | Ölçeklenmeyen |
|---|---|---|---|
| Kaya Golemi | Kaya Fırlat | hasar 200 / 360 / 600 | 1,5 sn sersem |
| Kristal Kurt | Uluma | – | +%45 saldırı hızı, 4 sn, 2 hücre |
| Davulcu Kurbağa | Savaş Davulu | – | bütün dostlar +%30 hasar, 4 sn |
| Sis Yarasası | Can Emme | hasar 170 / 306 / 510 (o kadar iyileşir) | – |
| Rüzgâr Ruhu | Kasırga | hasar 110 / 198 / 330 | 1,5 hücre itme |
| Dağ Koçu | Boynuz Öfkesi | – | sonraki 3 vuruş 2 kat, azami canın %20'si iyileşme |
| Zümrüt Yılan | Zümrüt Zehri | zehir 55 / 99 / 165 /sn; iyileştirme 160 / 288 / 480 | 4 sn |
| Buz Kaplumbağası | Buz Nefesi | hasar 120 / 216 / 360 | 1,2 sn sersem |
| Kor Semenderi | Kor Halkası | yanık 40 / 72 / 120 /sn; iyileştirme 110 / 198 / 330 | 4 sn, 2 hücre |
| Bulut Atı | Bulut Hücumu | hasar 190 / 342 / 570 | – |
| Işık Kuğusu | Işık Kanadı | kalkan 140 / 252 / 420 | savaş boyunca kalır |
| Gece Ayısı | Kara Gölge | hasar 140 / 252 / 420 | −%45 hasar, 5 sn |
| Anka | Kül Yağmuru | hasar 170 / 306 / 510; yanık 25 / 45 / 75 /sn | 3 sn |
| Ayaz Baykuşu | Kırağı Dalgası (eski adı "Ayaz", bkz. 7.3) | hasar 70 / 126 / 210 | −%40 saldırı hızı, 3 sn |
| Gölge Tilki | Gölge Oku | hasar 320 / 576 / 960 | – |
| Fırtına Ejderi | Yıldırım | hasar 150 / 270 / 450 | 0,6 sn sersem, 3 hedef |

Ölçeklenen pasifler: Koruyucu Tüy kalkanı 90 / 162 / 270, Zehirli Diş 18 / 32 / 54 /sn. Diğer pasifler ölçeklenmez.

### 3.3 Soy kartı

```
[Simge 56]  {soy adı}                         {n} kahraman · Seviye {0|1|2}
            Kime işler: {Bütün takım | {soy} kahramanları | Bütün düşmanlar}
──────────────────────────────────────────────────────────────
[2] {eşik 1 metni}                                   (ulaşıldıysa altın zemin)
[4] {eşik 2 metni}
(asıl oyunda [6] satırı da)
──────────────────────────────────────────────────────────────
Şu an: {n}/{sonraki eşik}. {durum cümlesi}
Taşıyanlar: [portre]… (elinde: tam renk + ✓ · dükkânda: altın halka · diğer: soluk)
Not: Aynı kahraman iki kez sayılmaz. Kaynaşmış kahramanın bütün soyları sayılır.
```

**Durum cümlesi kuralı**:
- `n = 0`: "Bu soydan kahramanın yok."
- `0 < n < eşik1`: "{eşik1 − n} {soy} kahramanı daha: ilk güç açılır."
- `eşik1 ≤ n < eşik2`: "Açık. {eşik2 − n} kahraman daha: güç büyür."
- `n ≥ son eşik`: "En yüksek güç açık."
- Elde aynı kahramanın ikinci kopyası varsa ek satır çıkar: "İkinci Kaya Golemi soyu artırmaz."

Soy panelindeki satır bu kartın özetidir. Satırda simge, ad, `n` ve eşik kutuları, altında **şu anki** (yoksa ilk) eşiğin metni yer alır. Kapsam sözcüğü satırda kısaltılmaz.

### 3.4 Eşya kartları

**Bileşen kartı**

```
[Simge 56]  {bileşen adı}                                   Bileşen
            {istatistik}   ·  Tema: {soy}
Kut Yankısı: {yankı metni}
──────────────────────────────────────────────────────────────
Birleşince (8 tarif):  [bu + Diş] Yırtıcı Pençe   [bu + Tüy] Av Coşkusu … 
(elindeki bileşenlerle yapılabilenler altın çerçeveli, en üstte)
```

- Raftaki bileşene uzun basınca bu kart **tarif çarkı** düzeninde açılır: ortada bileşen, çevresinde 8 dilimde öteki bileşenler ve sonuç eşyalar. Dilime dokununca o tam eşyanın kartı ikinci katman olarak açılır.

**Tam eşya kartı**

```
[Simge 56]  {eşya adı}                       [bileşen A] + [bileşen B]
            {istatistik toplamı}
Etki: {etki metni}
Kut Yankısı: {A yankısı} · {B yankısı}       (aynı bileşen ise toplanmış değer)
Kime uygun: {kimIcin}
```

- `kimIcin` her eşyaya elle yazılan tek cümlelik öneridir. Örnekler:
  - Dev Kükremesi: "Ön sıradaki dayanıklı kahramana; arkadakileri korur."
  - Kut Ocağı: "Kut'u vereceğin, hasarlı yeteneği olan kahramana."
  - Yel Kanadı: "Hızlı vuran yakın dövüşçüye."
  - Işık Kalkanı: "Takımın ortasındaki kahramana; çevresine kalkan dağıtır."
- 36 eşyanın 36 cümlesi veri tablosuna yazılır (bölüm 8).
- Bir bileşen bir kahramanın üstüne sürüklenirken kart açılmaz. Kahramanın üstünde **önizleme baloncuğu** çıkar: "+180 can" ya da "Yürek + Kabuk = Dev Kükremesi" ve tek satır etki. Kahraman doluysa ve takılamıyorsa kırmızı baloncuk çıkar: "3 yuva dolu".

### 3.5 Alamet kartı

```
[Simge 64]  {alamet adı}                                    Bu tur
{etki metni}
Senin takımına: {kişisel satır}
Rakibine: {kişisel satır, rakip takımına göre}
──────────────────────────────────────────────────────────────
Sıradaki tur: [simge] {ad}: {etki}           (asıl oyunda)
```

**Kişisel satır kuralları** (takımdaki soy sayımına göre; hiçbiri uymazsa "Doğrudan etkilemiyor."):

| Alamet | Koşul → metin |
|---|---|
| Kan Ayı | her zaman → "Herkes %20 fazla vurur. Savaş kısa sürer; dayanıklı ön sıra önemli." |
| Sis | menzili ≥ 2 kahraman sayısı k > 0 → "{k} uzak kahramanının menzili 1 kısalır." |
| Tipi | Ayaz kahramanı yok → "Bütün kahramanların %20 yavaş vurur." · var → "{k} Ayaz kahramanın etkilenmez, diğerleri %20 yavaş." |
| Kut Yağmuru | her zaman → "Herkes savaşa %40 manayla başlar: yetenekler erken gelir. Kut'u boş manalıya ver." |
| Bereketli Pazar | her zaman → "Bu tur +2 altın." |
| Tutulma | Karanlık kahramanı k > 0 → "{k} Karanlık kahramanın %30 fazla canla başlar." |
| Yaz Sıcağı | Od k > 0 → "{k} Od kahramanının yakması 2 kat." · Ayaz k > 0 → "{k} Ayaz kahramanın %15 az canla başlar." |
| Durgun Gök | → "Özel kural yok." |
| Demirci Ateşi | → "Bu savaşı kazanırsan 1 bileşen." |
| Göç Mevsimi | → "İlk 2 yenileme bedava." |
| Kut Sessizliği | → "Bu tur Kut yok. Herkes %25 manayla başlar." |
| Uzun Gölge | → "Gün Batımı 12. saniyede başlar: uzun savaş istemeyen takım kazanır." |

### 3.6 Rakip kartı

```
[Avatar 72]  {ad}   [Hayalet | Alıştırma | Yansıma]       Sıra {sıra}/8
             Can {can} · Sv {seviye} · Seri {+3 ateş | −2 buz | yok}
             (Hayalet etiketine dokun: "Başka bir oyuncunun bu turdaki gerçek kaydı.")
──────────────────────────────────────────────────────────────
[Mini tahta 4×3: portre, yıldız, kaynaşma madalyonu, eşya noktaları]
Aktif soylar: [Karanlık 3] [Bilge 2] …
Armağanlar: [simge] {ad} …
──────────────────────────────────────────────────────────────
Tehdit: {tehdit cümlesi}
Karşı fikir: {karşı cümlesi}
Son karşılaşma: {Tur 3-2: kazandın | kaybettin | ilk kez}
```

- **Tehdit birimi**: puanı en yüksek rakip birimidir. `puan = kademe × yıldızÇarpanı × (1 + 0,25 × tamEşyaSayısı)`; kaynaşmışsa ×1,15. Tehdit cümlesi şöyle kurulur: "{birim adı} ({konum}): {yetenek adı} {yeteneğin tek cümlelik özeti}."
- **Karşı fikir**: rakibin en kalabalık aktif soyuna göre bölüm 7.4 tablosundan gelir. Aktif soy yoksa: "Rakip dağınık. Kendi en güçlü soyunu tamamla, birleştirmeye odaklan."
- **Kural**: Kart hiçbir zaman **kazanma olasılığı** göstermez. Motor belirlenimci olduğu için sonuç hesaplanabilir, ama gösterilirse karar oyundan çıkar.
- "Yansıma" etiketi: lobide tek sayıda oyuncu kalınca dövüşülen kopyadır. `OYNANIS_DERINLIK.md` 4.2'de "Yankı" diye geçen kopya, "Kut Yankısı" ile karışmasın diye **Yansıma** olarak adlandırılır (bölüm 7.3).

### 3.7 Armağan ve canavar kartları

- **Armağan**: başlık, kademe (Kıvılcım / Alev / Güneş, bkz. 7.3), tek cümle etki ve "Neden seç?" satırı (`OYNANIS_DERINLIK.md` 6.1). Alınmış armağanlar oyuncunun avatarının altında simge sırası olarak durur; dokununca bu kart açılır.
- **Canavar**: ad, can, saldırı, hız, menzil, yetenek ya da pasif, ve "Ganimet: {bu turun ganimeti}". Soy satırı yerine "Canavarların soyu yok" yazar.

---

## 4. Savaş sırasında okunurluk

### 4.1 Birim üstü düzeni

`ARAYUZ_TASARIM.md` 4.3 geçerlidir. Ek kurallar:

- **Takım halkası**: her birimin ayağında 4 px elips halka. Dost `#3FD68F` alfa 0,55, düşman `#FF3D63` alfa 0,55. Kut seçim kipinde dost halkası altın olur ve nabız atar.
- **Uçan sayı rengi**:
  - Düşmanın aldığı hasar beyaz.
  - Dostun aldığı hasar `#FF9AA8`.
  - Yetenek hasarı beyaz yerine `#9FD8FF` ve 1,2 kat büyük.
  - Yanık turuncu.
  - Zehir `#B6E34A` ve önünde damla simgesi.
  - İyileşme yeşil ve "+" işaretli.
  - Kalkan emişi gri ve "(80)" parantezli.
  - Kaçınma "Iska" yazısı.
  
  Zaman içi hasar (yanık, zehir) her tik için değil **0,5 sn'de bir toplanarak** yazılır, ekran dolmasın.
- **Yığın sınırı**: aynı birimin üstünde aynı anda en çok 3 uçan sayı. Fazlası bir sonrakine eklenir.

### 4.2 Kim kime vuruyor

1. **Hedef değişimi izi**: Bir birim yeni hedef seçince (motorda `u.hedef` değişince) saldırgandan hedefe 300 ms'lik ince bir iz çizilir. İz 2 px, takım rengi, saldırgandan hedefe doğru söner. Yalnız 1× ve 2× hızda gösterilir.
2. **Mermi**: Menzilli vuruşlarda mermi zaten hedefe gider (`ANIMASYON_PLANI.md`). Mermi rengi saldırganın soy rengidir.
3. **Seçili birim**: Savaşta bir birime dokununca kartı açılır (bölüm 3). Kart açıkken o birimden hedefine kalıcı kesikli çizgi çizilir ve hedefin ayağına beyaz nişan halkası konur. Birim hedef değiştirdikçe çizgi güncellenir.
4. **Olay şeridi**: Sol kenarda, ayakta kalanlar panelinin üstünde en çok 3 satır. Satırlar 4 sn kalır, yenisi üstten iter. Yalnız şu olaylar yazılır:
   - **Ölüm**: `[saldırgan portresi] → [ölen portresi, çarpı]`. Zaman içi hasar ile öldüyse saldırgan portresinin köşesinde alev ya da damla simgesi bulunur.
   - **Kut**: `[portre] KUT · {yetenek adı}`, altın zemin.
   - **Diriliş**: `[Anka] Küllerinden doğdu`.
   
   3× hızda şerit gizlenir.

### 4.3 Yetenek balonu

- Bir birim yeteneğini kullanınca (`fx tip: 'yetenek'`) başının üstünde balon çıkar: "{yetenek adı}!" 15 px Black.
  - Dost balonu altın zemin ve koyu yazıdır. Düşman balonu yakut kenar, koyu zemin ve beyaz yazıdır.
  - Kut ile patlayan yetenekte balon 1,4 kat büyür, solunda küçük güneş simgesi olur.
- **Süre**: gerçek zamanda en az 0,9 sn (hız 3× olsa bile). Motor zamanında 1,2 sn.
- **Eşzamanlılık**: Aynı anda en çok 2 balon. Üçüncüsü sıraya girer. Sıradaki 0,6 sn içinde açılamazsa düşer. Kut balonu her zaman öne geçer.
- **Etkilenenler**: Balon açılırken yeteneğin isabet ettiği birimler (bölüm 8.2'deki `hedefler` alanı) 200 ms beyaz parlar.

### 4.4 Kut etkileşimi

Prototipte tuvale dokunmak Kut'u hemen harcar. Bu yanlışlıkla Kut harcamaya ve "birime dokunup bilgi alamama" sorununa yol açar. Asıl oyunda:

- **Varsayılan, iki dokunuş**: Önce KUT madalyonuna dokunulur ve seçim kipi açılır: dost halkalar altın nabız atar, zaman %60 hıza iner. Sonra kendi kahramanına dokunulur ve Kut verilir. Kip açıkken madalyona yeniden dokunmak ya da 4 sn hiçbir şey yapmamak kipi kapatır.
- **Sürükle**: Madalyondan kahramana sürüklemek tek hareketle Kut verir.
- **Ayar**: "Tek dokunuşla Kut" (kip açmadan kahramana dokununca Kut). Varsayılan kapalıdır. İlk 10 maçtan sonra bir kez önerilir.
- **Seçim kipinde birim üstü önizleme**: her dost birimin üstünde şunlar görünür:
  - Yeteneğinin adı.
  - Mana yüzdesi.
  - Eşyası varsa Kut Yankısı simgeleri (`OYNANIS_DERINLIK.md` 7.1).
  - Birim sersemse uyarı rozeti "Sersem: sersemlik bitince patlar" (motorda sersem birim yetenek kullanamaz, Kut'un doldurduğu mana sersemlik bitince harcanır).
  - Manası zaten doluysa "Zaten dolu" rozeti; dokunulabilir ama soluk görünür.

### 4.5 Durum simgeleri sözlüğü

Birimin can çubuğunun hemen altında 20 px simgeler sıralanır. En çok 3 simge görünür, fazlası "+2" hapıyla gösterilir.

**Kategori renkleri**:
- Kontrol: buz mavisi `#7FDCFF`.
- Zarar: turuncu `#FF8A4C`.
- Zayıflatma: mor `#C47BFF`.
- Güçlendirme: altın `#FFD45C`.
- Koruma: beyaz `#EEF3FF`.

Gösterim önceliği bu sıradır: kontrol, zarar, zayıflatma, güçlendirme, koruma. Kalan süresi olan simgenin çevresinde saat yönünde boşalan halka vardır.

| Motor anahtarı | Ad | Simge | Kategori | Kart metni |
|---|---|---|---|---|
| `sersem` | Sersem | başın çevresinde dönen 3 yıldız | Kontrol | "Hareket edemez, vuramaz, yetenek kullanamaz." |
| `yavas` | Yavaş | kum saati | Zayıflatma | "Saldırı hızı %{değer} düşük." |
| `lanet` | Zayıf | kırık kılıç | Zayıflatma | "Verdiği hasar %45 düşük." |
| `yanik` | Yanık | alev | Zarar | "Saniyede {değer} hasar alır." |
| `zehir` | Zehir | damla | Zarar | "Saniyede {değer} hasar alır." |
| `uluma` | Coşku | iki ok yukarı | Güçlendirme | "+%45 saldırı hızı." |
| `davul` | Davul | davul | Güçlendirme | "+%30 hasar." |
| `ofke` (sayaç) | Öfke {n} | boynuz | Güçlendirme | "Sonraki {n} vuruşu 2 kat." |
| `payYigin` (sayaç) | Karanlık Pay {n} | hilal | Güçlendirme | "+%{12×n} hasar." |
| `kalkan` (değer) | Kalkan | can çubuğundaki beyaz dilim (simge değil) | Koruma | "Önce kalkan erir, sonra can." |
| `dirildi = false` ve pasif Yeniden Doğuş | Diriliş hazır | küçük kül tüyü | Koruma | "İlk ölümde %40 canla dirilir." |
| Kut verildi | Kut | ayakta kalıcı altın halka | Güçlendirme | "Bu savaşta Kut bu kahramana verildi." |
| (asıl oyun) hedef alınamaz | Görünmez | kapalı göz, birim %50 saydam | Koruma | "Düşmanlar onu hedef alamaz." |
| (asıl oyun) kükreme | Kükreme | ünlem halkası, hedef olanın üstünde | Kontrol | "Yakındaki düşmanlar yalnız onu hedef alır." |
| (asıl oyun) yankı | Yankı | bileşen simgeleri, 3 sn | Güçlendirme | Kut Yankısı'nın etkisi. |

Soy bonusları birim üstünde **gösterilmez**; savaş öncesi soy panelinde ve özette görünür. Gün Batımı birime değil HUD'a yazılır: 20. sn'de süre kutusu kızıla döner ve altına "Hasar +%{10×n}" satırı eklenir.

### 4.6 Savaş özeti

**Açılış**: Sonuç bandındaki **Özet** düğmesi. Asıl oyunda hazırlık ekranında üst çubuktaki "Son savaş" simgesi de aynı ekranı açar; maçın bütün savaşları buradan geriye doğru seçilebilir.

**Yerleşim** (tam ekran perde üstünde kalın panel, 1 040×640):

- **Başlık**: "Savaş özeti · Tur 3-2 · {rakip adı}". Sağda sonuç hapı (ZAFER yeşil, YENİLGİ kırmızı) ve süre ("18 sn").
- **Sekmeler**: **Verilen** · **Alınan** · **İyileştirme ve kalkan**. Varsayılan Verilen'dir.
- **İki sütun**: sol "Sen", sağ "Rakip". Her sütunda birimler değere göre azalan sıradadır.
- **Satır**: portre (40 px, yıldız ve kaynaşma madalyonu) · ad (13 px) · yatay çubuk · sayı (Black, sağa yaslı, binlik boşluklu). Ölen birimin portresi gri, köşesinde ölüm saniyesi yazar ("9 sn").
- **Çubuk ölçeği**: iki sütunun en büyük değeri %100'dür, böylece iki taraf karşılaştırılabilir.
- **Çubuk dilimleri**:
  - Verilen: vuruş (beyaz), yetenek (`safir`), zaman içi (turuncu).
  - Alınan: candan (`#FF6A86`), kalkanla emilen (gri-beyaz), sağ uçta Iska sayısı ("3 ıska").
  - İyileştirme ve kalkan: iyileştirme (yeşil), verilen kalkan (beyaz).
  
  Dilime dokununca değeri balonda yazar.
- **Kut satırı**: Kut'un verildiği birimin satırında soldan altın şerit ve güneş simgesi. Sekmenin altında tek cümle: "Kut · 9. sn · Kaya Golemi: Kaya Fırlat 360 hasar, 2 düşman sersem." Cümle, Kut'tan sonraki ilk `yetenek` olayının hedeflerinden kurulur. Kut kullanılmadıysa: "Kut kullanılmadı."
- **Maçın yıldızı**: dost birimler içinde `verilen + 0,5 × alınan + iyileştirme + verilenKalkan` puanı en yüksek olan. Satırında altın yıldız rozeti bulunur.
- **Neden? satırları**: panelin altında en çok 3 satır, ampul simgeli. Kurallar aşağıdaki tabloda; uyan kurallar öncelik sırasıyla seçilir.

| Öncelik | Koşul | Metin |
|---|---|---|
| 1 | Kut, manası dolu birime verildi (`kut` olayında `mp == mana`) | "Kut'u manası zaten dolu {ad}'a verdin; yetenek zaten gelecekti." |
| 2 | Kut, sersem birime verildi ve sersemlik ≥ 1 sn sürdü | "Kut verdiğin {ad} sersemdi; yeteneği {x} sn gecikti." |
| 3 | Kut kullanılmadı ve savaş kaybedildi | "Kut'u kullanmadın. Bir sonraki savaşta dene." |
| 4 | Rakipte eşik 2 (ya da üstü) soy var ve bu soy ona en çok hasarı kazandırdı | "Rakibin {soy} {n}: {soy metni}. Bu, {x} hasar fark yarattı." |
| 5 | Menzili ≥ 2 bir dost birim ön sırada başladı ve ilk 5 sn'de öldü | "{ad} uzaktan vurur ama önde başladı, {x}. sn'de düştü." |
| 6 | Takımda kullanılmamış boş yuva vardı | "Takımında {k} boş yer vardı." |
| 7 | Dostun aldığı toplam hasarın %40'ından fazlası zaman içi hasar | "Hasarın çoğu yanık ve zehirden geldi: Su soyu ya da kalkan işe yarar." |
| 8 | Savaş kazanıldı ve hiçbir dost ölmedi | "Kusursuz zafer: kimse düşmedi." |

Kural 4'teki "hasar fark" şöyle hesaplanır: o soy bonusunun çarpanından gelen ek hasarın toplamı. Motor bunu ayrı sayaçta tutar (bölüm 8.2). Yalnız Avcı, Karanlık, Od (yanık) ve Dev (azaltılan hasar) için hesaplanır. Diğer soylar için kural 4 "fark" cümlesi olmadan yazılır.

- **Eylemler**: "Tekrar izle" (aynı tohum ve Kut kaydıyla baştan oynatır; motor belirlenimci olduğu için bedavadır) ve "Kapat".

---

## 5. Bağlamsal ipuçları

### 5.1 Biçim

- İpucu, ilgili öğenin yanında açılan küçük bir banttır: en çok 360 px, 14 px Bold yazı, solda ampul simgesi, sağda küçük "×".
- İpucu oyunu durdurmaz ve giriş engellemez. Öğenin kendisi 1 kez 600 ms altın parlar.
- **Ömür**: 6 sn ya da önerilen eylem yapılana dek (hangisi önce olursa). "×" ile kapatılırsa **reddedildi** sayılır.

### 5.2 Sıklık kuralları

1. Ekranda aynı anda **en çok 1** ipucu bulunur.
2. Bir hazırlık evresinde **en çok 1** yeni ipucu. `Çok` kipinde en çok 2, aralarında en az 8 sn olur.
3. Savaş sırasında yalnız H10 (Kut) gösterilir.
4. Hazırlık sayacının son 5 sn'sinde ipucu çıkmaz. Seçim kipinde, sürükleme sırasında ve bir pencere açıkken de çıkmaz.
5. Aynı ipucu en az **3 tur** arayla tekrar eder ve hesap boyunca **en çok 3 kez** gösterilir.
6. **Öğrenildi**: Oyuncu önerilen eylemi ipucu görmeden **2 kez** kendisi yaptıysa o ipucu kalıcı olarak susar. Her ipucunun "kendiliğinden yapma" algılayıcısı tabloda yazılı.
7. **Reddedildi**: aynı ipucu 2 kez "×" ile kapatılırsa kalıcı olarak susar.
8. Uyan birden fazla ipucu varsa öncelik numarası küçük olan seçilir. Eşitlikte en uzun süredir gösterilmeyen seçilir.
9. Bir maçta 5'ten fazla ipucu gösterilmez.

### 5.3 Ayar: İpucu sıklığı

- **Çok**: öğreticiyi atlayanlarda ilk 5 maç, öğreticiyi bitirenlerde ilk 3 maç.
- **Az**: varsayılan. Kural 5.2'deki sınırlar geçerlidir, ama yalnız öncelik 1–8 arasındaki ipuçları çıkar.
- **Kapalı**: hiç ipucu çıkmaz. İlk kez kartları yine çıkar, çünkü onlar kural öğretir.

Kodeks → Kısa dersler'de "Susturulmuş ipuçlarını sıfırla" düğmesi bulunur.

### 5.4 İpucu listesi

`{}` içindeki değerler o anki durumdan doldurulur. Altın sayıları asıl oyun kuralına göredir (`OYNANIS_DERINLIK.md` 3).

| Kimlik | Öncelik | Koşul | Metin | Vurgu | "Kendiliğinden yaptı" algılayıcısı |
|---|---|---|---|---|---|
| H01 Boş yuva | 1 | Hazırlıkta tahtadaki kahraman < seviye ve yedekte kahraman var | "Takımında {k} boş yer var: yedekten kahraman taşı." | Boş tahta hücresi | İpucusuz, savaştan önce boş yuvayı doldurdu |
| H02 Menzilli önde | 2 | Menzili ≥ 2 bir birim ön sırada, aynı takımda menzili 1 bir birim arka sırada | "{ad} uzaktan vurur: arka sıraya al, daha uzun yaşar." | İki birim | Menzilliyi arkaya taşıdı |
| H03 Faiz eşiği | 3 | Altın `10k−1` ile `10k−2` arasında (k ≤ 5), bu tur yapılacak alım yok ve bölüm ≥ 2 | "{1|2} altın daha biriktirirsen sonraki tur +1 faiz gelir." | Faiz sikkeleri | Tur sonunu 10'un katında bitirdi (2 kez) |
| H04 ★2 yakın | 4 | Dükkânda, elde 1 kopyası olan bir kahraman kartı var ve altın ≥ 2 × kademe | "Bu kahramandan 2 tane daha alırsan ★2 olur." | O kart | İkinci kopyayı aldı |
| H05 ★2 tek adım | 4 | Dükkânda, elde 2 kopyası olan kart var ve altın ≥ kademe | "Bunu alırsan üçü birleşir: {ad} ★2." | O kart (zümrüt ışıma) | Üçüncü kopyayı aldı |
| H06 Deneyim | 5 | Altın ≥ 4, sonraki seviyeye ≤ 4 deneyim kaldı, alım faiz eşiğinin altına düşürmüyor (`altin − 4 ≥ 10 × floor(altin/10)` ya da altın ≥ 54) | "Altının yetiyor: deneyim al, Sv {s+1} olursun ve {s+1} kahraman koyarsın." | Deneyim Al | Deneyim aldı |
| H07 Soy bir eksik | 6 | Bir soy `n = eşik − 1` ve dükkânda o soyu taşıyan, elde olmayan bir kart var | "{soy} 1 eksik: bu kart {soy} {eşik}'yi açar." | Kart ve soy satırı | O soyun eşiğini tamamladı |
| H08 Raf boşta | 7 | Rafta 2 tur boyunca takılmamış bileşen var | "Raftaki {bileşen} boşta duruyor: bir kahramanın üstüne sürükle." | Raftaki bileşen | Bileşen taktı |
| H09 Kaynaştırma fırsatı | 8 | İlk 5 maç, yedekte iki farklı ★1 kaynaşmamış kahraman ve altın ≥ bedel | "Yedekteki {A} ve {B}'yi kaynaştırabilirsin: {A} yeteneği + {B} pasifi." | İki yuva | Kaynaştırma yaptı |
| H10 Kut bekliyor | 9 | Savaşta 8. sn geçti, Kut kullanılmadı, ilk 10 maç; savaş başına 1 kez | "Kut hâlâ hazır: manası boş bir kahramanına ver." | Kut madalyonu | İlk 8 sn içinde Kut kullandı |
| H11 Yedek dolu | 10 | Yedek dolu ve oyuncu bir karta dokundu ama yer yok | "Yedek dolu: birini sat ya da kaynaştır." | Sat ve KAYNAŞTIR | Yedeği boşalttı |
| H12 Rakip soyu | 11 | Rakipte eşik ≥ 4 bir soy var | "Rakipte {soy} {n}: {soy metni}. {karşı fikir}" | Rakip paneli | Rakip kartını açtı |
| H13 Alamet seni etkiliyor | 12 | Alamet kişisel satırı "Doğrudan etkilemiyor" değil | "{alamet}: {kişisel satır}" | Alamet şeridi | Alamet kartını açtı |
| H14 Can düşük | 13 | Can < 30 ve altın ≥ 30 | "Canın az: altını şimdi harca, takımını güçlendir." | Altın rozeti | Bu durumda altını 20'nin altına indirdi |
| H15 Kilitle | 14 | Dükkânda elde kopyası olan kart var, altın yetmiyor, tur sonuna 10 sn | "Kart kalsın istiyorsan dükkânı kilitle." | Kilitle | Kilitledi |
| H16 Seri | 15 | 3'lük kaybetme serisi | "Kaybetme serisi de altın getirir: +2." | Seri simgesi | (bilgi; 1 kez) |
| H17 Kut Ocağı | 16 | Kut Ocağı takılı birim var ve Kut başka birime verildi (savaş sonrası) | "Kut Ocağı taşıyan {ad}'a verilen Kut 1,5 kat güçlü olur." | O birim | Kut'u Kut Ocağı taşıyana verdi |
| H18 Kaynaşmış yıldız | 17 | Kaynaşmış A×B birimi var ve dükkânda A kartı var | "{A} kopyaları kaynaşmış {A}×{B}'yi ★2 yapar." | Kart | Kaynaşmış birimi yükseltti |
| H19 Sat | 18 | Yedekte 3+ tur hiç kullanılmamış birim ve altın < 2 | "{ad} uzun süredir yedekte: satarsan {değer} altın." | Birim | Sattı |

### 5.5 Savaşa! düğmesinin uyarıları

Bunlar ipucu sayılmaz, her zaman çalışır:
- Tahtada hiç kahraman yoksa düğme pasiftir. Basınca titrer ve "Tahtaya en az 1 kahraman koy" der.
- Boş yuva varken ve yedekte kahraman varken basılırsa düğme altında 2 sn "Boş yer var: yine de savaş?" sorusu çıkar; ikinci dokunuş onaylar. Dereceli maçta sayaç bitince boş yuvalar yedekten en yüksek değerli birimle kendiliğinden dolar ve bant bunu söyler: "Boş yerine {ad} kondu."
- Asıl oyunda düğmenin altında "Kaybedersen ~{x} can" satırı bulunur (`OYNANIS_DERINLIK.md` 10.7).

---

## 6. Kodeks (sözlük) ekranı

### 6.1 Yapı

- **Giriş**: ana ekrandaki "Kahramanlar" düğmesi **Kodeks** adını alır. Ayrıca her bilgi kartının sağ üstünde küçük kitap simgesi vardır; dokununca Kodeks o maddede açılır. Maç içinde açılırsa sayaç durmaz; Kodeks yarı saydam perde olarak açılır ve sol üstte kalan süre görünür.
- **Üst çubuk**: Geri, başlık "Kodeks", **arama kutusu** (ad, soy, eşya, durum ve sözlük terimlerinde arar; Türkçe büyük-küçük harf ve şapka duyarsızdır: "ruzgar" Rüzgâr'ı bulur), Ustalık rozeti.
- **Sol sekme sütunu** (180 px, dikey): Temeller · Kahramanlar · Soylar · Eşyalar · Alametler · Armağanlar · Durumlar · Canavarlar · Melezler · Sözlük · Kısa dersler. Yeni içerik (sezonla gelen kahraman, ilk kez görülen eşya) sekmede yeşil nokta ile işaretlenir.
- **İçerik alanı**: her sekmede sol liste ya da ızgara, sağda seçili maddenin kartı. Kart bölüm 3 şablonlarının **genişletilmiş** hâlidir: aynı alanlar, ayrıca aşağıdaki ek bilgiler.

### 6.2 Sekmelerin içeriği

**Temeller**: beş kartlık dikey akış. Her kart bir resim (oyun içi ekran görüntüsünden kırpma, işaretli) ve en çok 3 cümledir. Prototipteki "Nasıl oynanır" penceresinin yerini alır.
1. *Maçın akışı*: "Her tur önce hazırlık, sonra savaş. Hazırlıkta kahraman al, diz, geliştir. Savaş kendi kendine oynar; sen yalnız bir kez Kut ile müdahale edersin."
2. *Altın ve seviye*: "Her tur gelir alırsın; harcamadığın altın kalır ve her 10 altın +1 faiz getirir. Altını kahramana, yenilemeye ya da deneyime harca. Seviye kadar kahraman koyarsın."
3. *Güçlenmenin üç yolu*: "3 aynı kahraman ★2 olur. Aynı soydan 2 ve 4 kahraman soy gücünü açar. Bileşenler birleşip tam eşya olur."
4. *Bize özgü dört şey*: Kut, Kaynaştırma, rakibi önceden görme, Alamet. Her biri tek cümle ve simgeyle.
5. *Kazanmak*: "Herkes 100 canla başlar. Kaybedince can gider; son kalan birincidir. İlk 4'e girmek kupa getirir." Hızlı Maç'ta bu kart "5 can, 7 zafer" metniyle gösterilir.

**Kahramanlar**: mevcut 4×4 ızgara (`ARAYUZ_TASARIM.md` 4.5) kalır. Ekler:
- Filtreler: Kademe, Soy (10 simge, çoklu seçim), Menzil (yakın/uzak), Rol (Ön cephe / Vurucu / Büyücü / Destek). Rol, veriye eklenen `rol` alanıdır (bölüm 8.1).
- Kahraman kartı (genişletilmiş):
  - 3D modelin döndürülebilir önizlemesi (yalnız bekleme animasyonu).
  - Stat tablosu ★1 / ★2 / ★3 sütunlarıyla (can, saldırı; hız ve menzil tek değer).
  - Yetenek tablosu (bölüm 3.2).
  - "İyi anlaştığı soylar" (iki soyu ve onları tamamlayan 3 kahraman).
  - "Kaynaşma önerileri": elle yazılmış 2 melez ve birer cümlelik nedeni. Örnek: "Golem × Anka: Kaya Fırlat atan ve ilk ölümünde dirilen ön cephe."
  - Ustalık ilerlemesi.

**Soylar**: mevcut 10 satırlık liste. Satıra dokununca soy kartı (bölüm 3.3) açılır. Ekler: kapsam satırı, "Karşısında ne işe yarar" (bölüm 7.4 tablosu) ve "Bu soyla iyi giden eşyalar" (o soyun tema bileşeni ve 2 tam eşya).

**Eşyalar**: 9×9 **tarif tablosu**. Başlık satırı ve sütunu 8 bileşen; hücrelerde tam eşya simgesi. Simetrik olduğu için üst üçgen soluk gösterilir. Hücreye dokununca tam eşya kartı açılır. Tablonun altında özel eşyalar (Söküm Taşı, Kut Taşı, Soy Mührü) ve "Kut Yankısı" açıklaması (8 bileşenin yankı tablosu) yer alır.

**Alametler**: 12 kart ızgarası. Kartta simge, ad, etki ve "Kimi sever / kimi zorlar" satırı. Örnek, Tipi: "Ayaz takımını sever, hızlı vuran Gök takımını zorlar."

**Armağanlar**: kademe başlıklarıyla (Kıvılcım / Alev / Güneş) liste. Türe göre filtre: Kut, Kaynaştırma, Önceden görme, Alamet, Ekonomi, Seviye, Eşya, Geri dönüş. Hiç seçilmemiş armağanlar da görünür; gizli içerik yoktur.

**Durumlar**: bölüm 4.5 tablosu kart olarak. Her kartta simgenin büyük hâli, kategori rengi, metin ve "Hangi yetenekler verir" listesi (portrelerle). Altta uçan sayı renklerinin açıklaması.

**Canavarlar**: 8 canavar, hangi turda çıktıkları ve ganimetleri.

**Melezler**: 240 olası kaynaşmanın koleksiyonu. Bulunanlar portre çiftiyle, bulunmayanlar "?" ile gösterilir. Bulunan melezin kartında yetenek, pasif, birleşik soylar ve "ilk bulduğun maç" tarihi bulunur. Yalnız görünüş ödülüdür (`OYNANIS_DERINLIK.md` 7.3.7). Bulunmayanların adı da gizlenmez; yalnız kart kilitlidir, çünkü bilgi saklamak açıklayıcılığa ters düşer. "Keşif" duygusu, kartın ilk bulunuşta açılmasından gelir.

**Sözlük**: A'dan Z'ye terimler (bölüm 6.3). Her terim tek cümledir ve ilgili sekmeye bağlantı verir.

**Kısa dersler**: öğreticinin parçaları, her biri 30–60 sn'lik, kaybedilmez, sabit tohumlu mini sahnelerdir:
- Çıraklık Maçı'nı baştan oyna.
- Kut: doğru an (aynı savaşı Kut'suz ve Kut'lu oynatır, farkı özet ekranında gösterir).
- Kaynaştırma.
- Eşya ve tarif.
- Ekonomi: faiz ve seri.
- Rakibi okumak.
- Bütün İlk kez kartları (IK1–IK12) tekrar okunabilir.
- Altta "Susturulmuş ipuçlarını sıfırla" düğmesi.

### 6.3 Sözlük terimleri (oyunun tek dili)

Arayüzün her yerinde bu sözcükler, bu anlamlarla kullanılır.

| Terim | Tanım |
|---|---|
| Alamet | Bir turun özel kuralı. Lobideki herkes için aynıdır. |
| Armağan (Kut Armağanı) | Üç aşamada üç karttan seçilen, maç boyu süren güç. Kademeleri Kıvılcım, Alev, Güneş. |
| Ayakta kalanlar | Savaşta henüz düşmemiş kahramanlar. |
| Bileşen | Sekiz temel eşya parçası. İkisi birleşip tam eşya olur. |
| Bölüm | Maçın 7 turluk dilimi. "3-2" bölüm 3, tur 2 demektir. |
| Canavar turu | Hayalete değil canavara karşı savaş. Ganimet verir. |
| Deneyim | Seviye atlamak için toplanan puan. Her savaş +2; 4 altın = 4 deneyim. |
| Eşik | Soy gücünün açıldığı kahraman sayısı (2, 4, asıl oyunda 6). |
| Faiz | Her 10 altın için tur başında gelen +1 altın; en çok +5. |
| Ganimet | Canavar ve Kervan'dan gelen altın, kahraman ya da bileşen. |
| Gün Batımı | 20. saniyeden sonra hasarın her saniye %10 arttığı dönem. |
| Hayalet | Başka bir oyuncunun gerçek maç kaydı; lobideki rakiplerin. |
| Havuz | Bir kahramanın lobide kalan kopya sayısı. |
| Kademe | Kahramanın gücü ve fiyatı (K1–K3, ileride K5). |
| Kalkan | Candan önce eriyen ek koruma. |
| Kaynaştırma | İki farklı kahramanı tek kahraman yapmak: ilkinin yeteneği, ikincinin pasifi, ikisinin soyları. |
| Kervan | Her bölümün 4. turunda eşyalı kahramanlar arasından seçim. |
| Kut | Savaş başına bir kez, kendi kahramanının manasını anında doldurma gücü. |
| Kut Yankısı | Eşyalı kahramana verilen Kut'un, her bileşen için kattığı ek etki. |
| Mana | Yetenek için dolan güç. Vuruş başına +10, alınan hasarın %5'i kadar. |
| Menzil | Kahramanın kaç hücre öteden vurduğu: 1 yakın, 2 ve üstü uzak. |
| Pasif | Hep açık olan özellik. Kaynaşmada ikinci kahramandan gelir. |
| Rakip paneli | Sıradaki rakibin bu turki takımını savaştan önce gösteren panel. |
| Seri | Üst üste kazanma ya da kaybetme; altın getirir. |
| Seviye (Sv) | Oyuncunun düzeyi. Takımdaki kahraman sınırı ve dükkân şansı ona bağlıdır. |
| Soy | Kahramanın ailesi. Aynı soydan kahramanlar eşiğe ulaşınca güç açılır. |
| Ustalık | Kahramanın oyuncuya özel deneyimi. Yalnız görünüş ödülü verir. "Sv" kısaltması ustalıkta kullanılmaz. |
| Yansıma | Lobide tek sayıda oyuncu kalınca dövüşülen kopya takım. |
| Yetenek | Mana dolunca kullanılan güç. Kaynaşmada ilk kahramandan gelir. |
| Yetenek gücü (YG) | Yetenek hasarını, iyileştirmesini ve kalkanını büyüten yüzde. |
| Yıldız (★) | Birleşme düzeyi. ★2 1,8 kat, ★3 3 kat güçlüdür. |

---

## 7. Mevcut metinlerin düzeltilmesi

Kaynak: `web/arayuz.js`, `web/oyun.js`, `data.js`. Unity'de bütün metinler tek bir yerelleştirme tablosuna (`Metin.tr.json`, anahtar → metin) alınır; kod içinde metin bulunmaz.

### 7.1 Arayüz metinleri

| Yer | Şimdiki | Sorun | Yeni |
|---|---|---|---|
| Ana ekran, alt şerit | "Rakipler: hayalet botlar (çevrimiçi havuz yakında)" | Geliştirici notu, oyuncuya bir şey anlatmıyor | Çevrimiçi: "Çevrimiçi · rakiplerin gerçek oyuncu kayıtları". Çevrimdışı: "Çevrimdışı · alıştırma rakipleri" |
| Ana ekran, Oyna alt satırı | "~7 dk · 5 can · 7 zafer" | Asıl oyunda Arena farklı | Arena: "8 kişilik lobi · ~18 dk". Hızlı Maç: "~7 dk · 5 can · 7 zafer" |
| Nasıl oynanır penceresi | 7 madde, "Altın biriktirilmez" dahil | Asıl oyunda yanlış; duvar metin | Kaldırılır. Yerine Kodeks → Temeller (6.2) |
| Düello penceresi | "… Sunucu gerekmez." | Teknik ayrıntı | "Son maçtaki takımın bir koda dönüşür. Kodu arkadaşına gönder; o da kendi takımıyla seninkini dövüştürsün." |
| Düello, kod yok | "Önce bir maç oyna: son takımın kaydedilir." | İyi | Aynen kalır |
| Rakip etiketi | "Bot" / "Gerçek" | "Gerçek" yanıltıcı (canlı değil, kayıt) | "Alıştırma" / "Hayalet" (dokununca açıklama, 3.6) |
| Rakip ipucu (IPUCU tablosu) | Bkz. 7.4 | Bazıları kurala aykırı | 7.4'teki tablo |
| Dükkân başlığı | "Şans: K1 %45 · K2 %40 · K3 %15" | "Şans" belirsiz; neye bağlı olduğu yazmıyor | "Sv 5 dükkânı: K1 %40 · K2 %45 · K3 %15" (dokununca tablo) |
| Seçili panel, boş | "Tahtadaki ya da yedekteki bir kahramana dokun…" | İyi ama üç cümle | "Bir kahramana dokun: bilgi, sat, kaynaştır. Dükkân kartına basılı tut: bilgi." |
| Seçili panel, stat etiketi "Hız" | "Hız 0,85" | Neyin hızı belirsiz (hareket mi, saldırı mı) | "Saldırı hızı 0,85/sn" (dar yerde "Sal. hızı") |
| Seçili panel, "Mana 90" | Yalın sayı | Ne işe yaradığı belirsiz | "Yetenek 90 mana"; dokununca "Vuruş başına +10, aldığı hasarın %5'i kadar dolar." |
| Seçili panel, "Yer: Ön/Arka" stat kutusu | "Yer" | Yer **soyu** ile karışıyor | "Sıra: Ön / Orta / Arka / Yedek" |
| Seçili panel, "Ustalık Sv.1" | "Sv." | Asıl oyunda "Sv" oyuncu seviyesi | "Ustalık 1" (taç simgesi) |
| Kaynaşma şeması | "Yetenek {ilk sözcük}'dan, pasif ikinciden gelir." | Ek ünlü uyumu bozuk ("Kristal'dan", "Gölge'dan"); ilk sözcük ad değil ("Sis", "Kaya") | "Yetenek: {yetenek adı} ({tam ad}) · Pasif: ikinci kahramandan". Ek gerekiyorsa `ekAyrilma(ad)` işlevi son heceye göre -dan/-den/-tan/-ten seçer |
| Kaynaşık plaka | "Kaya × Anka", "Sis × Gece" | İlk sözcük anlamsız kalabiliyor | Kısa ad alanıyla: "Golem × Anka", "Yarasa × Ayı" (8.1 `kisa`) |
| KAYNAŞTIR alt satırı | "3 altın · sonra 2. kahramana dokun" | Asıl oyunda bedel değişken | "{bedel} altın · sonra ikinci kahramana dokun" |
| Kart bilgi penceresi | "Hız 0.65" | Nokta ondalık, ★ ölçeği yok | Bölüm 3.2 şablonu |
| Bildirim "Yer yok: sat ya da kaynaştır" | | Yer soyu ile karışabilir | "Yedek dolu: sat ya da kaynaştır" |
| Bildirim "Bu tur en fazla N kahraman" | | Neden ve çözüm yok | "Takım dolu ({n}/{n}). Seviye atla ya da birini yedeğe al." |
| Bildirim "Aynı kahraman kaynaşmaz: üç tanesi zaten ★ olur" | | Uzun | "Aynı kahraman kaynaşmaz; 3 tanesi ★2 olur." |
| Bildirim "Tahtaya en az 1 kahraman koy" | | İyi | Aynen |
| Bildirim "🔥 {ad} doğdu!" | Emoji | Simge dili tutarsız | "{ad} doğdu!" + kaynaşma simgesi |
| Bildirim "⭐ {ad} ★2!" | Çift yıldız | Gereksiz | "{ad} ★2!" |
| Kut bandı, hazır | "Bir kahramanına dokun, yeteneği hemen patlasın. Savaşta 1 kez." | İki dokunuşlu akışa uymuyor | "KUT'a dokun, sonra kahramanına: yeteneği hemen patlar. Savaşta 1 kez." |
| Kut bandı, kullanıldı | "Sonraki savaşta yenilenir" | İyi | Aynen; üstüne "{ad} · {sn}. sn" |
| Kut seçimi bildirimi | "Kut için kendi kahramanına dokun" | İyi | Aynen |
| Sonuç bandı | "+1 zafer · 5/7" | Asıl oyunda biçim farklı | Arena zafer: "Rakip {x} can kaybetti". Arena yenilgi: "−{x} can · {kalan} can kaldı". Hızlı Maç: eski metin |
| Maç sonu yenilgi | "iyi dövüştün" | Boş teselli | "{sıra}. oldun · {tur} tur dayandın" |
| Maç sonu "ustalık ilerliyor" | | Belirsiz | "{ad} Ustalık {sv} · sonraki ödüle {k} zafer" |
| Ayarlar, grafik | "Hafif (gölge yok, düşük çözünürlük)" | İyi | Aynen |
| Arena yüklenemedi | Hata metni ham gösteriliyor | Oyuncuya teknik yazı | "Arena yüklenemedi. Tekrar dene ya da hafif grafiğe geç." (ham hata yalnız günlüğe yazılır) |

### 7.2 Soy metinleri (kapsam eklendi)

Motor davranışı `sim.js`'ten okundu. Kapsamı **bütün takım** olan soylar (Yer, Karanlık) ve **düşman** olan soy (Ayaz) önceki metinlerde ayırt edilmiyordu.

| Soy | Kapsam (motor) | Eşik 2 | Eşik 4 |
|---|---|---|---|
| Gök | Yalnız Gök kahramanları | "Gök kahramanları +%15 saldırı hızı." | "Gök kahramanları +%35 saldırı hızı." |
| Yer | **Bütün takım** | "Bütün takım +150 can." | "Bütün takım +400 can." |
| Od | Yalnız Od kahramanlarının vuruşları | "Od kahramanlarının vuruşları 2 sn yakar: saniyede 12." | "… 3 sn yakar: saniyede 28." |
| Su | Yalnız Su kahramanları | "Su kahramanları saniyede canının %2'sini yeniler." | "… %5'ini yeniler." |
| Ayaz | **Bütün düşmanlar** | "Bütün düşmanlar −%15 saldırı hızı." | "Bütün düşmanlar −%30 saldırı hızı." |
| Karanlık | **Bütün takım** | "Bütün takım, canı yarının altındaki düşmana +%20 hasar verir." | "… +%50 hasar verir." |
| Dev | Yalnız Dev kahramanları | "Dev kahramanları %12 az hasar alır." | "… %28 az hasar alır." |
| Avcı | Yalnız Avcı kahramanları | "Avcı kahramanları +%20 hasar verir." | "… +%45 hasar verir." |
| Bilge | Yalnız Bilge kahramanları, yalnız vuruştan gelen mana | "Bilge kahramanları vuruşta %30 fazla mana kazanır." | "… %70 fazla mana kazanır." |
| Çevik | Yalnız Çevik kahramanları | "Çevik kahramanları ilk 4 sn +%40 saldırı hızı." | "… +%90 saldırı hızı." |

Ek olarak Çevik soy kartına sabit not girer: "Çevik kahramanlar her zaman %40 daha hızlı koşar." Bu, motordaki `atli ? 2.4 : 1.7` hareket hızıdır ve eşikten bağımsızdır; bugün hiçbir yerde yazmıyor.

Tasarım notu: Yer'in bütün takıma, Gök'ün yalnız kendine işlemesi bilinçli bir karar mı, gözden mi kaçtı, denge işinde netleştirilmeli. Bu belge yalnız **mevcut davranışı doğru anlatır**; davranış değişirse bu tablo da değişir.

### 7.3 Yetenek, pasif ve ad düzeltmeleri

| Kimlik | Şimdiki metin | Sorun | Yeni |
|---|---|---|---|
| `kulDogus` | "Hedef çevresine 170 hasar ve 3 sn yanık." | Yanık değeri yok (motorda 25/sn ×★) | "Hedef ve çevresine {170} hasar; 3 sn yakar (saniyede {25})." |
| `dortnal` | "En arka düşmana atılır, 190 hasar." | Motor **kendisine en uzak** düşmanı seçer | "En uzaktaki düşmanın yanına atılır, {190} hasar." |
| `karaGolge` | "En güçlü düşmana 140 hasar…" | "Güçlü" belirsiz; motor **saldırısı en yüksek** olanı seçer | "Saldırısı en yüksek düşmana {140} hasar; 5 sn %45 az hasar verir." |
| `zehir` | "…en yaralı dosta 160 can." | Motor **can yüzdesi** en düşük dostu seçer | "…can yüzdesi en düşük dosta {160} iyileştirme." |
| `deliOfke` | "Sonraki 3 vuruşu 2 kat, canının %20'sini yeniler." | "Canının" belirsiz | "Sonraki 3 vuruşu 2 kat hasar verir; azami canının %20'sini yeniler." |
| `kanat` | "Bütün dostlara 140 kalkan." | Süresi yazmıyor | "Bütün dostlara {140} kalkan; savaş boyunca kalır." |
| `kacis` (Yel Gibi) | "Vuruşların %25'inden kaçar." | Yeteneklerden kaçamadığı yazmıyor | "Vuruşların %25'inden kaçar (yeteneklerden kaçamaz)." |
| `canEmici` | "Verdiği hasarın %20'si kadar can kazanır." | Yanık ve zehirde işlemediği yazmıyor | "Vuruş ve yetenek hasarının %20'si kadar iyileşir." |
| `ruhBagi` | "Bir dost ölünce 35 mana kazanır." | İyi | Aynen |
| Yetenek `ayaz` | "Ayaz" | Soy adıyla aynı; "Ayaz 2" ile karışıyor | Ad: **Kırağı Dalgası**. Kimlik `ayaz` kodda kalır; yalnız görünen ad değişir |
| Armağan kademesi "Yıldız" | `OYNANIS_DERINLIK.md` 6.1 | ★ yıldızıyla karışıyor | **Güneş** (Kıvılcım / Alev / Güneş) |
| Lobi kopyası "Yankı" | `OYNANIS_DERINLIK.md` 4.2 | "Kut Yankısı" ile karışıyor | **Yansıma** |
| Soy anahtarları `kis`, `atli`, `ates` | Kod içi | Görünen adla farklı (Ayaz, Çevik, Od) | Kod aynı kalır; görünen ad her yerde `SOYLAR[k].ad`'dan okunur, elle yazılmaz |

`{}` içindeki sayılar şablon alanıdır. Kart onları yıldıza göre üçlü olarak doldurur (bölüm 8.1).

### 7.4 Rakip karşı fikirleri (IPUCU tablosunun yerine)

Eski tablodaki yanlışlar:
- Avcı için "uzaktan çok vurur" yazıyordu. Avcı bir hasar soyudur ve Kristal Kurt yakın dövüşçüdür.
- "Çevik ile arkalarına dal" yazıyordu. Çevik soyu dalmaz, yalnız Bulut Atı'nın yeteneği dalar.
- Bilge için "Kut'u erken kullan" yazıyordu. Bunun gerekçesi yoktu.

| Rakibin soyu | Tehdit cümlesi (kısa) | Karşı fikir |
|---|---|---|
| Gök | "Gök kahramanları hızlı vurur." | "Ayaz soyu ya da Tipi alameti hızlarını keser; Dev ön cephe vuruşları emer." |
| Yer | "Bütün takımı fazladan canlı." | "Uzun savaş bekle: Od yanığı ve zehir can yüzdesinden bağımsız işler." |
| Od | "Vuruşları yakar." | "Su soyu iyileşmesi ve kalkan yanığı karşılar; savaşı kısa tut." |
| Su | "Su kahramanları kendini iyileştirir." | "Hasarı tek hedefte topla: Gölge Oku, Kaya Fırlat gibi tek hedefli yetenekler." |
| Ayaz | "Senin bütün takımını yavaşlatır." | "Yetenek ağırlıklı kur: yavaşlama vuruşu keser, yeteneği değil. Bilge mana kazanımı işe yarar." |
| Karanlık | "Yarı canın altındaki kahramanlarını bitirir." | "Ön cepheye kalkan ve iyileştirme koy; Işık Kuğusu ve Zümrüt Yılan yaralıyı yarının üstünde tutar." |
| Dev | "Dev kahramanları az hasar alır." | "Devlerin yanından geç: arkadakileri hedefleyen Bulut Hücumu ve Gölge Oku." |
| Avcı | "Avcı kahramanları çok hasar verir." | "Önce onları düşür: Kut'u sersemleten yeteneğe (Kaya Fırlat, Buz Nefesi) sakla." |
| Bilge | "Bilge kahramanları yeteneğini erken açar." | "Erken patlamaya dayanacak ön cephe kur; Kara Gölge onların hasarını keser." |
| Çevik | "Çevik kahramanları ilk 4 sn çok hızlıdır." | "İlk saniyeleri kalkanla atlat: Işık Kanadı, Koruyucu Tüy, Buz eşyaları." |

---

## 8. Veri ve motor değişiklikleri

Bu bölüm açıklayıcılığın gerektirdiği değişiklikleri listeler. Savaş **sonucunu değiştiren hiçbir şey yoktur**. Değişikliklerin hepsi ek bilgi alanı ya da sayaçtır. Yine de `sim.js` ve `unity/Kod/KutSavas.cs` iki tarafta da aynı yapılır. Bit bit eşdeğerlik testi (496 savaş) sonuç alanlarında aynen geçmeli. Yeni sayaçlar için de ayrı bir eşdeğerlik denetimi eklenir.

### 8.1 `data.js` → `KutVeri.cs`

1. **Şablonlu yetenek ve pasif metni**: `YETENEK[id] = { ad, sablon: 'Hedefe {h} hasar, {s} sn sersemletir.', olcek: { h: 200 }, sabit: { s: 1.5 } }`. `olcek` alanları `× kc × (1 + YG)` ile, `sabit` alanlar olduğu gibi doldurulur. Kart üçlüyü bu alanlardan üretir. Eski `m` alanı geçiş süresince `sablon`'dan üretilir. 16 yetenek ve 16 pasifin alanları bölüm 3.2 tablosundan ve 7.3'ten yazılır.
2. **Kahramana `kisa` alanı**: Golem, Kurt, Kurbağa, Yarasa, Ruh, Koç, Yılan, Kaplumbağa, Semender, Bulut Atı, Kuğu, Ayı, Anka, Baykuş, Tilki, Ejder.
3. **Kahramana `rol` alanı**:
   - Ön cephe: golem, kaplumbaga, ayi, koc.
   - Vurucu: kurt, bulutat, tilki, yarasa.
   - Büyücü: ruzgar, semender, anka, ejder, baykus.
   - Destek: kurbaga, yilan, kugu.
4. **Soya `kapsam` alanı**: `'takim' | 'soy' | 'dusman'` (7.2) ve `karsi` metni (7.4). Eşik metinleri dizi olarak kalır, 6. eşik geldiğinde uzar.
5. **Eşyaya `kimIcin` alanı** (3.4), 36 cümle.
6. **Alamete `kisisel` kuralı**: koşul türü (`her`, `soyVar`, `soyYok`, `menzilli`) ve metin şablonu (3.5).
7. **`OGRETICI` tablosu**: turlar (dükkân, gelir, alamet, ganimet, rakip), adımlar (kimlik, metin anahtarı, vurgu hedefi, eylem türü, geçiş koşulu, takıldıysan anahtarı, sonra anahtarı, açılan öğeler). Vurgu hedefleri arayüz öğe kimlikleriyle verilir (`dukkan.kart[0]`, `tahta.hucre[1,2]`, `kut.madalyon` …).
8. **`IPUCU_KURALLARI`** (5.4) ve **`ILK_KEZ`** (2.6) tabloları. Koşullar kod tarafında adlandırılmış işlevlerdir; tablo yalnız kimlik, öncelik, metin anahtarı ve vurgu hedefini taşır.
9. `tools/csharp_veri.cjs` üreticisi yeni alanları da `KutVeri.cs`'e yazacak şekilde genişletilir.

### 8.2 `sim.js` → `KutSavas.cs`

Hepsi yalnız bilgi amaçlıdır. Hiçbiri `R()` çağırmaz ve hiçbir karar dalını değiştirmez.

1. **Zaman içi hasarın kaynağı**: `durumVer(u, ad, sure, deger, kaynakUid)`. Durum nesnesi `{sure, deger, k}` olur. Durum üzerine yazıldığında `k` de yeni verenin kimliği olur. Mevcut üzerine yazma koşulu aynen kalır. `adim()` içindeki yanık ve zehir tikinde `hasar(null, u, …, 'dot', u.durum.yanik.k)` çağrılır. Yeni beşinci parametre **yalnız fx ve sayaç** için kullanılır. `kaynak` yine `null` geçer, böylece Avcı, Karanlık, Kan Ayı ve Can Emici çarpanları eskisi gibi uygulanmaz. Bu ayrım kritiktir: kaynağı `kaynak` parametresine vermek sonucu değiştirir.
2. **`hasar` fx'ine alanlar**: `e` (kalkanın emdiği miktar), `y` (`'vurus' | 'yetenek' | 'dot'`), `k` (kaynak uid; zaman içi hasarda durumdaki `k`). Kalkan hasarı tamamen emerse (`m < 1`) bugün fx yayılmıyor. Yeni kural: `e ≥ 1` ise `{tip: 'emildi', u, n: e, k}` yayılır.
3. **`olum` fx'ine `k`** (öldüren uid; zaman içi hasarda durumun kaynağı, yoksa −1).
4. **`kac` fx'ine `k`** (saldıran uid).
5. **`iyi` ve `kalkan` fx'lerine `k`** (iyileştiren ya da kalkan veren uid). `iyiles(u, n, k)` ve `kalkanVer(u, n, k)` imzaları buna göre genişler. Su soyu ve Sıcak Kalp sessiz iyileşmesi fx yaymaz, ama sayaca yazılır (madde 7).
6. **`yetenek` fx'ine `hedefler`**: yeteneğin isabet ettiği uid listesi. Her `case` içinde hasar ya da durum alan birimler sırayla eklenir.
7. **Birim sayaçları**: her birimde `ist = { vurus, yetenek, dot, alinan, emilen, iska, iyilestirme, kalkanVerilen, oldurme, soyEk: { avci, karanlik, ates, dev } }`.
   - `hasar()` içinde şunlar toplanır:
     - Kaynağın `vurus | yetenek | dot` alanı (zaman içi hasarda durumun `k` birimine).
     - Hedefin `alinan` ve `emilen` alanları.
     - **Soy farkı**: Avcı ve Karanlık çarpanı uygulandığında, uygulanmasaydı oluşacak miktarla farkı (`m_sonra − m_önce`) kaynağın `soyEk` alanına; Dev azaltmasında azaltılan miktar hedefin `soyEk.dev` alanına; Od yanığından gelen bütün tik hasarı kaynağın `soyEk.ates` alanına.
   
   Sayaçlar `sonuc` nesnesine `ist: [{uid, ...}]` olarak eklenir. Kayan nokta toplama sırası JS ile C#'ta aynı kalmalıdır; toplamalar `hasar()` içindeki mevcut sıraya eklenir. Yuvarlama yalnız gösterimde yapılır.
8. **`kut` fx'ine `mp` ve `sersem`**: Kut anındaki mana ve birimin sersem olup olmadığı (özetin "Neden?" kural 1 ve 2'si için).
9. **Hedef değişimi**: `u.hedef` değiştiğinde `{tip: 'hedef', k: u.uid, u: yeni.uid}` fx'i yayılır (bölüm 4.2.1).
10. **Öğretici duraklatması** motor değişikliği değildir: arayüz `adim()` çağırmayı keser. Ama prototipte ve Unity'de motor görüntüden 0,4 sn önde koştuğu için duraklatma anının **motor zamanı** kullanılır ve Kut dokunuşu o `t`'ye yazılır. Kayıt (`opt.kayit`) bu sayede tekrar izlemede aynı sonucu verir.

### 8.3 Arayüz ve oyun durumu

- `web/oyun.js` (Unity'de `MacYoneticisi`): `ogretici` alt durumu (`adim`, `acilan` kümesi, `ipucuSayac{id: {gosterim, red, kendiliginden, sonTur}}`, `ilkKez{}`). Profilde kalıcıdır.
- Arayüzdeki her öğenin dizgi kimliği vardır (vurgu hedefi için). Unity'de `OgeKimligi` bileşeni.
- Bütün metinler `Metin.tr.json` tablosundadır. Bu belgedeki metinler oraya anahtarla girer (`ogr.a1.metin`, `ipucu.h04`, `ik.ik5` …).

---

## 9. Testler ve kabul ölçütleri

### 9.1 Otomatik testler

- **`test/ogretici.test.cjs`**: her öğretici turu için oyuncunun o turda sahip olabileceği bütün yasal takımları ve dizilişleri üretir. Kapsam:
  - Adım eylemleri zorunlu, diğer alımlar serbest.
  - Tur 1–6'da en çok yaklaşık 5 000 bileşim, budanarak.
  
  Her bileşimi sabit tohumla motorda oynatır. Hedefler:
  - Tur 1–6: zorunlu adımları yapan **her** dizilişte oyuncu kazanır.
  - Tur 2: Kut 3,0. sn'de Golem'e verilince kazanır; başka birime verilince de kazanır.
  - Tur 7: "önerilen diziliş" (öğreticinin ipuçlarına uyan) kazanır. Rastgele dizilişlerin en az %70'i kazanır.
  - Bütün turlarda savaş süresi 6–25 sn.
- **Eşdeğerlik**: `sim.test.cjs`'e yeni sayaçların JS ve C# toplamlarının eşitliği eklenir. Sonuç alanları 496/496 aynen geçmeli.
- **Metin denetimi** (`test/metin.test.cjs`):
  - Bütün metin anahtarları tabloda tanımlıdır.
  - Balon metinleri 2 cümleyi ve cümle başına 90 karakteri aşmaz.
  - Sözlükteki yasak eşleşmeler geçmez: görünen metinde "Yankı" yalnız "Kut Yankısı" içinde geçer; "Sv" yalnız oyuncu seviyesinde geçer.
- **Tarayıcı testi** (`test/oyun.test.cjs` genişletilir): Playwright öğreticiyi baştan sona parmak hedeflerine dokunarak oynar, her adımın ekran görüntüsünü `test-out/ogretici_<adim>.png` olarak kaydeder.

### 9.2 Ölçüm (yayından sonra)

Her adımın başlama ve bitme zamanı, takıldıysan metninin gösterilip gösterilmediği ve atlama olayları kaydedilir.

| Ölçüt | Hedef |
|---|---|
| Öğreticiyi bitiren oran | ≥ %85 |
| Öğretici ortanca süresi | 8–10 dk |
| Herhangi bir adımda "takıldıysan" metnine düşen oran | ≤ %15 (aşan adımın metni yeniden yazılır) |
| İlk 3 Arena maçında Kut kullanma oranı | ≥ %80 savaş |
| İlk 5 maçta en az 1 kaynaştırma yapan oyuncu | ≥ %60 |
| İlk 5 maçta savaş özetini en az 1 kez açan | ≥ %50 |
| İpucu red oranı (×) | ≤ %30; aşan ipucu yeniden yazılır ya da kaldırılır |

### 9.3 Uygulama sırası (öneri)

1. Metin tablosu ve 7. bölüm düzeltmeleri. Prototipte de hemen uygulanabilir, en ucuz kazanç.
2. Motor bilgi alanları ve sayaçları (8.2), iki tarafta, eşdeğerlik testiyle.
3. Bilgi kartı şablonları (3) ve şablonlu yetenek verisi (8.1.1).
4. Savaş okunurluğu (4.1–4.5) ve savaş özeti (4.6).
5. Öğretici bileşenleri (1), Çıraklık Maçı (2) ve öğretici testi.
6. Bağlamsal ipuçları (5) ve İlk kez kartları (2.6). Bunlar lobi sistemleri geldikçe eklenir.
7. Kodeks (6).
