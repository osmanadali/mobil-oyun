# Kut Arena: arayüz ve deneyim tasarımı, sürüm 2

Bu belge `ARAYUZ_TASARIM.md`'nin yerine geçer. O belgedeki renk belirteçleri, yazı ailesi, 9-slice payları ve logo aynen geçerlidir. Değişen şey **yapı**: hazırlık ile savaş artık aynı 3D sahnede geçiyor.

**Kural kaynağı.** Bütün oyun kuralları ve sayıları `OYNANIS_DERINLIK.md`'den gelir; bu belge yalnız onların ekranda nasıl görüneceğini ve elle nasıl yapılacağını tanımlar. Bu belgede geçen kural sayıları oradan alındı:

- 8 kişilik hayalet lobi, 100 can;
- 4×3 tahta, en çok 8 kahraman, 7 yedek;
- 10 yerlik eşya rafı;
- seviye 2–8;
- faiz ve seri;
- Kut Armağanı, Kervan, canavar turu;
- hazırlık sayacı 20/25 sn;
- kaynaştırma bedeli `2 + en yüksek kademe`;
- soy eşikleri 2/4/6;
- Gün Batımı.

İki belge çelişirse kuralda `OYNANIS_DERINLIK.md`, ekranda bu belge geçerlidir.

**Görsel karşılığı:** `tasarim/v2/index.html`.

| Adres | Ekran |
|---|---|
| `?ekran=hazirlik` | hazırlık |
| `&durum=bilgi` | basılı tutma kartı |
| `&durum=surukle` | sürükleme, kaynaştırma hedefi, satış alanı |
| `&durum=kaynas` | kaynaştırma onayı |
| `&durum=armagan` | Kut Armağanı seçimi |
| `?ekran=savas` | savaş |
| `?ekran=ana` | ana ekran |
| `?ekran=son` | maç sonu |

Ekran görüntüleri `tasarim/v2/shot_<ekran>_<genişlik>x<yükseklik>.png` adıyla duruyor: 1280×800, 1024×768 ve 960×940.

Makette 3D tahtanın yerinde `gorsel/arena_konsept.webp` duruyor. Yaratıklar ise portre PNG'leri. Unity'de bunların yerini gerçek sahne, modeller ve kamera alır. HUD'daki her öğe ise ekran uzayında Canvas olarak birebir kurulur.

---

## 0. Prototipten asıl oyuna: arayüzde ne değişiyor

Web prototipi kuralları ve motoru sınamak için yapıldı. Asıl oyunda arayüz tarafında değişenler şunlar:

1. **Tek sahne.** Prototipte "maç" ekranı 2D bir panel yığınıydı, savaş da ayrı bir 3D ekrandı. Asıl oyunda dükkân, tahta, yedek, eşya ve savaş aynı yüzen adada geçer. Ekran değişmez. Yalnız HUD katmanları yer değiştirir ve kamera kayar.
2. **Kartlar yerine kahramanlar.** Tahtadaki ve yedekteki her kahraman 3D modeldir. Yerleştirmek için onu tutup sürüklersin. Ayrı bir "Seçili kahraman" paneli artık yok; bilgi, basılı tutunca açılan geçici karttan gelir.
3. **Kaynaştırma ve satış hareketle yapılır.** Kaynaştırmak için bir kahramanı ötekinin üstünde yarım saniye tutarsın. Satmak için dükkân şeridine sürüklersin. Prototipteki iki adımlı "KAYNAŞTIR düğmesi, sonra ikinci kahramana dokun" akışı kalkar.
4. **Rakip önizleme sahnede.** Rakip kartını basılı tutunca rakibin bu turki takımı, tahtanın karşı yarısında yarı saydam hayaletler olarak belirir. "Önceden görme" bir liste olmaktan çıkar, gerçek bir konum okumasına döner.
5. **Lobi ve derin sistemler için yer var.** Oyuncu listesi, bölüm haritası, hazırlık sayacı, seviye ve deneyim, faiz, seri, eşya rafı, Kut Armağanı ve Kervan seçim ekranları bu belgede yerleşimiyle tanımlı.
6. **Menüler ayrı oyun ekranlarıdır.** Ana ekranın alt gezinme çubuğu var; profil, koleksiyon, ayarlar ve maç sonu ayrı ekranlardır. Prototipteki tek sayfalık ana ekran ve açılır pencereler kalkar.
7. **Ses ve titreşim.** Prototip sessizdi. Asıl oyunda her eylemin bir sesi ve dokunsal karşılığı var (§10).
8. **Hızlı Maç** (eski kurallar: 5 can, 7 zafer, her tur 10 altın, 6 kahraman) aynı arayüzü kullanır. Lobi yerine tek rakip, can yerine zafer elmasları görünür ve kullanılmayan öğeler gizlenir (§12).

---

## 1. Eski tasarımda kötü olanlar

`tasarim/final/shot_*.png` incelendi. Kullanıcının ~960×940 pencerede gördüğü sorunlar da bunlarda kaynağını buluyor.

| Ekran | Sorun | v2'de çözüm |
|---|---|---|
| Maç (hazırlık) | Ekran 5 ayrı paneldir (rakip, soylar, takım, seçili, dükkân) ve her birinin çerçevesi, köşe mücevheri, başlık şeridi var. Her şey eşit derecede vurgulu olduğu için göz nereye bakacağını bilemiyor. | Tek odak 3D tahta. HUD yarı saydam cam paneller, mücevhersiz ve ince kenarlı. Yalnız iki öğe parlak: SAVAŞA ve altın. |
| Maç | Tahta 2D kart ızgarası. "Ön sıra / arka sıra" yazıyla anlatılıyor, savaştaki konumla bağı kurulmuyor. | Kahraman, savaşta duracağı karonun üstünde durur. Sıralar mekânsal olarak görünür. |
| Maç | Seçili kahraman paneli ekranın %22'sini sürekli kaplıyor, çoğu zaman boşa. | Panel kalktı. Bilgi kartı yalnız basılı tutunca, yan sütunun üstüne açılır. |
| Maç | Kaynaştırma iki adımlı ve gizli (düğme, sonra ikinci kahramana dokun). İmza mekaniği, sağ alttaki bir düğmenin içinde kayboluyor. | Sürükle ve üstünde tut; pembe halka, "Bırak: Kaynaştır" etiketi ve onay kartı çıkar. Mekanik ilk sürüklemede kendiliğinden keşfedilir. |
| Maç | 1024 ve 960 genişlikte düzen bütünüyle küçülüyor. Soy açıklamaları 12 px'e, dükkân kartı adları 11 px'e iniyor; yetenek metinleri sığmıyor. | Ölçek alt sınırı 0,85. Dar ekranda içerik küçülmez, düzen değişir (§3). En küçük yazı 13 mantıksal px. |
| Maç | Dükkân tam genişlikte kalın bir panel. Yenile ve Kilitle sol kenarda, SAVAŞA sağ kenarda dev bir blok; ekranın alt %25'i dükkâna gidiyor. | Dükkân 128 px'lik yarı saydam bir şerit. Tahta onun arkasından görünmeye devam eder. |
| Maç | Rakip önizleme, sol üstte tahtadan kopuk küçük bir kart. Oyuncu onu kendi tahtasıyla ilişkilendirmiyor. | Kart kaldı, "karşı ipucu" satırı eklendi. Basılı tutunca rakip tahtası sahnede belirir (§4.3). |
| Savaş | Üst skor şeridi, alamet, rakip kartı, alt soldaki mini liste ve hız düğmeleri dağınık: savaşta 6 ayrı öğe var. | Üst ortada skor ve süre, solda etkin soylar, sağda lobi, sağ altta KUT. Başka bir şey yok. |
| Savaş | "KUT HAZIR" açıklaması her savaşta kalıcı ve uzun. | İpucu yalnız ilk 3 maçta çıkar. Sonra yalnız düğmenin nabzı kalır. |
| Ana | Arka plan boş gökyüzü; oyunun kalbi olan ada hiç görünmüyor. 3 eşit mor düğme ana eylemle yarışıyor. "Yeni maç başlat" metin bağlantısı kolay kaçırılıyor. | Arka plan, oyuncunun adası ve seçtiği 4 yaratık. Tek altın OYNA düğmesi ve üstünde mod seçici. Geri kalan her şey alt gezinme çubuğunda. |
| Maç sonu | 8 kutu, iki sütun ve 3 renkte düğme. 80 karakterlik düello kodu ilk bakışta en çok yer kaplayan şey. | Sıra unvanı, takımın podyumu ve 3 bilgi kutusu. Düello kodu "Takımı paylaş"ın içinde. Birincil eylem tek. |
| Kodeks | 4×4 kart ızgarası ve soy listesi iyi, ama tek ekrana 26 öğe sıkışıyor. Metinler 12–13 px, ayrıntı penceresi küçük. | Koleksiyon 4 sekmeye ayrılır: kahramanlar, soylar, eşyalar, alametler. Kahraman ayrıntısı tam ekran ve döndürülebilir 3D model içerir (§8.3). |
| Genel | Dikey ekranda prototip telefon düzenine düşüyor (`test-out/2-dukkan.png`). Tablet oyununun bambaşka ve kötü bir sürümü ortaya çıkıyor. | En/boy oranı 0,8'in altındaysa oyun durur ve "Cihazını yan çevir" der (§3.4). |

---

## 2. Sahne: tek ada, iki kamera

### 2.1 Dünya koordinatları (motorla birebir)

Motor alanı 6 (x) × 8 (y) birimdir. Unity'de **1 birim = 1 m = 1 karo**.

- Dünya konumu: `X = simX − 3`, `Z = 4 − simY`, `Y = 0` (zemin).
- Oyuncu tarafı kameraya yakın yarıdır (`Z < 0`), rakip uzaktaki yarıdır.
- **Tahta hücreleri** `OYNANIS_DERINLIK.md` §9 dizilimidir: 4 sütun × 3 sıra.
  - Sütun `b.x ∈ {0,1,2,3}` → `simX = 0,75 + 1,5·b.x` → `X ∈ {−2,25; −0,75; +0,75; +2,25}`.
  - Oyuncu sıraları ön/orta/arka `simY = 5/6/7` → `Z = −1 / −2 / −3`.
  - Rakip sıraları `simY = 3/2/1` → `Z = +1 / +2 / +3`.
- Her hücrenin zemininde 1,3 m çapında bir **yuva plakası** bulunur (§9). Plakalar yalnız hazırlıkta görünür ve savaş başında 0,3 sn'de söner.
- Tahtada `seviye` kadar kahraman durabilir. Seviye sınırı dolduğunda boş plakalar %40 opaklığa iner ve kahraman kabul etmez.
- **Orta çizgi** `Z = 0`'dadır ve altın ışıklıdır (arena konseptindeki çizgi).
- **Yedek sırası** tahtanın önündeki taş kenarda, `Z = −4,6` hattındadır.
  - 7 kaide, aralarında 0,95 m, `X = 0`'a ortalanır (`X = −2,85…+2,85`).
  - Kaideler 0,85 m çaplı alçak taş disklerdir. Boş kaidede sönük altın elmas, dolu kaidede kademe renginde ince halka bulunur.
- Yedekteki yaratıklar tahtadakilerin **0,75 katı** ölçekte durur. Böylece kamera açısından tahtanın arka sırasıyla karışmazlar.

Motorda değişiklik gerekmez. Konum, mevcut `x, y` alanlarından türetilen bir görünüm dönüşümüdür.

### 2.2 Kamera

Kamera sabittir: oyuncu döndüremez ve eğemez. Hafif yakınlaştırma serbesttir (§4.7).

| Ayar | Hazırlık | Savaş |
|---|---|---|
| Hedef nokta | (0, 0, −1,6) | (0, 0, 0) |
| Eğim (aşağı bakış) | 50° | 56° |
| Uzaklık | 13,5 m | 14,5 m |
| Yatay görüş açısı | 46° (sabit) | 44° |
| Sapma (yaw) | 0° | 0° (geçişte +4° salınır, §6) |

- **Görüş açısı yatay sabitlenir.** Unity dikey FOV kullanır; her ekran değişiminde şu hesaplanır: `dikeyFOV = 2·atan(tan(46°/2) / (ekranEn/ekranBoy))`. Böylece:
  - 16:10'da ada kenardan kenara oturur;
  - 4:3'te ve kareye yakın pencerede ada aynı genişlikte kalır, üstte ve altta gökyüzü açılır. Bu boşluğu §3'teki kompakt düzen kullanır.
- **Görüntü alanının kaydırılması:** dükkân şeridi altta 128 px yer kaplar. Hazırlık kamerasında `Camera.lensShift.y = +0,06` (fiziksel kamera) kullanılır, böylece yedek sırası şeridin hemen üstünde kalır. Savaşta şerit kalkar ve kayma 0'a döner.
- Eğim 50°'nin altına inmez. Daha yatay bakışta arka sıradaki rakipler öndekilerin arkasında kalıyor ve dokunma hedefleri üst üste biniyor.

### 2.3 Işık ve atmosfer

`GORSEL_REHBERI.md` ve `UNITY_DEVIR.md` §4'teki gibi: gün batımı yön ışığı, mor ortam ışığı, hafif bloom. Ek olarak:

- **Hazırlıkta** oyuncu yarısına yumuşak, sıcak bir sahne ışığı düşer (spot, 18°, yoğunluk 0,6). Rakip yarısı %20 karanlık kalır; göz kendi tahtasına gider.
- **Savaşta** iki yarı eşit aydınlanır; rakip yarısının karartması 0,6 sn'de kalkar.
- **Alamet** arenanın rengini değiştirir: Kan Ayı kızıl dolgu ışığı, Tipi kar parçacıkları, Sis zemin sisi, Tutulma güneş diskine gölge verir.
- **Gün Batımı** (savaşın 20. saniyesi; Uzun Gölge alametinde 12.): gökyüzü 1,5 sn'de kızıla döner, güneş ufka iner ve orta çizgi kırmızı-turuncu yanar (§7).

---

## 3. Ölçek ve yerleşim kuralları

### 3.1 Mantıksal ekran

Bütün HUD ölçüleri **1280×800 mantıksal piksel** üzerinden verilir.

- **Ölçek:** `s = clamp(min(W/1280, H/800), 0.85, 1.5)`. `W, H` güvenli alanın fiziksel pikselidir.
- **Tuval:** mantıksal tuval `W/s × H/s` olur. Düzen bu tuvale kurulur ve kenarlara yapıştırılır.
- **Unity'de:** CanvasScaler'ın hazır modları bu sınırlamayı yapamaz. CanvasScaler **Constant Pixel Size** modunda kalır; `KutOlcek.cs` her çözünürlük değişiminde `scaleFactor = s` atar ve düzen sınıfını seçer.
- **Neden alt sınır 0,85?** Eski tasarım 960 genişlikte 0,75'e iniyordu ve 14 px'lik yazı 10,5 px oluyordu. Alt sınır ölçeği korur; sığmayan şeyi düzen değişikliği çözer.
- **Düzen sınıfı:**
  - **geniş:** `W/H ≥ 1,45` (16:10, 16:9, 3:2 tabletler, geniş pencere);
  - **kompakt:** `0,8 ≤ W/H < 1,45` (4:3 iPad, ~960×940 masaüstü penceresi);
  - **dikey uyarı:** `W/H < 0,8` (§3.4).
- **Güvenli alan:** `Screen.safeArea` dışına dokunma hedefi konmaz. Arka plan ve sahne tam ekrandır.

| Ekran | s | Mantıksal tuval | Düzen |
|---|---|---|---|
| 1280×800 (16:10) | 1,00 | 1280×800 | geniş |
| 2560×1600 tablet | 1,50 (sınır) | 1707×1067 | geniş |
| 1024×768 (4:3) | 0,85 (sınır) | 1205×904 | kompakt |
| 2048×1536 iPad | 1,50 (sınır) | 1365×1024 | kompakt |
| 960×940 pencere | 0,85 (sınır) | 1129×1106 | kompakt |

### 3.2 Yazı, dokunma, renk

- **Yazı boyları** (mantıksal px):
  - büyük sayı 32–40 (altın, KUT, süre);
  - başlık 19–22;
  - gövde 15;
  - ikincil 13. **Hiçbir yazı 13'ün altına inmez**; 0,85 ölçekte bu ≈11 fiziksel px'tir.
  - Panel başlıkları BÜYÜK HARF, 13 px, harf aralığı %6.
- **Dokunma hedefi:** en az 44×44 (10 inçlik tablette ≈7,5 mm).
  - Sık kullanılan düğmeler (Yenile, Deneyim, dükkân kartı) en az 46.
  - Ana eylemler (SAVAŞA, KUT) en az 84.
- **3D dokunma alanı:** her yaratığın çarpıştırıcısı, görsel boyundan bağımsız, 1,25 m çaplı ve 2 m yüksek bir silindirdir; yedekte 0,9 m. Komşu hücre merkezleri 1,5 m arayla durduğu için silindirler çakışmaz. Küçük yaratıklar (kurbağa, yılan) da rahat tutulur.
- **Satır yüksekliği:** liste satırı 35–42; bilgi kartında satır aralığı 1,35.
- **Kontrast:** cam panel üstündeki gövde yazısı en az 7:1 (`--yazi` #fff4dc, zemin ~#1a0b2e); ikincil yazı (`--soluk`) en az 4,5:1.
- **Renk asla tek ipucu değildir.**
  - Kademe rengi her kartta fiyat ya da `K1–K3` yazısıyla birlikte gelir.
  - Soyun simgesi ve adı vardır.
  - Yıldızlar biçimle de ayrılır: ★2 gümüş ve 2 yıldız, ★3 altın, 3 yıldız ve taç.

### 3.3 Hazırlık yerleşimi

**Geniş düzen** (1280×800 mantıksal; `shot_hazirlik_1280x800.png`):

| Bölge | Konum ve boyut | İçerik |
|---|---|---|
| Üst orta şerit | üstten 10, ortalı, yükseklik 44, öğeler arası 8 | Can (kalp + sayı, 100 üzerinden) · **Bölüm haritası** ("3-3" + bölümün 7 turu simgeyle) · **Alamet** (yakut zemin, simge, ad, kısa etki) · **Sıradaki alamet** (soluk hap, "Sonra: Sis") |
| Hazırlık sayacı | üstten 60, ortalı | "Hazırlık" yazısı, 300×8 altın çubuk ve kalan saniye |
| Menü | sağ üst köşe, 44×44 daire | Ayarlar, maçtan çık |
| Sol sütun | sol 12, üst 64, genişlik 216 | **Rakip önizleme** (≈320 yük.), 10 boşluk, **Soy izleyici** (başlık + satır başı 35) |
| Sağ sütun | sağ 12, üst 64, genişlik 200 | **Lobi** (başlık + 8 satır × 42 ≈ 376 yük.) |
| Eşya rafı | sağ 12, üst 448, 200×≈110 | 10 yuva, 5×2, her biri 34 |
| SAVAŞA | sağ 12, alt 142, 200×96 | Altın düğme, 3 satır |
| Dükkân şeridi | alt 0, tam genişlik, yükseklik 128 | Soldan sağa: seviye bloğu 150 · Yenile/Kilitle 96 · 5 kart (esnek, aralık 8, yükseklik 112) · altın bloğu 126. Öğeler arası 10, kenar payı 14. |
| Tahta | ekranın geri kalanı | 3D sahne. Ada iki yan sütun arasında kalır; karo alanı hiçbir panelin altına girmez. |

**Kompakt düzen** (4:3 ve ~960×940; `shot_hazirlik_1024x768.png`, `shot_hazirlik_960x940.png`):

- **Lobi daralır.** Sağ 12, genişlik 76; satırlar 50 yüksek ve yalnız 40 px avatar taşır.
  - Avatarın sağ altında can rozeti (kırmızı hap, sayı), sıradaki rakipte göz rozeti bulunur.
  - Ad ve seviye gizlenir. Avatara dokununca 220 px'lik bir açılır kart gösterir.
- **Eşya rafı sol alta iner:** sol 12, alt 140, genişlik 216. Kompakt düzende tuval yüksekliği 904–1106 olduğu için sol sütunun altında yer var.
- **SAVAŞA** sağdan 100'e kayar (daralan lobinin yanına), boyut 180×96.
- **Dükkân şeridi** aynı kalır.
  - Seviye bloğu 132'ye, altın bloğu 112'ye daralır.
  - 1129 genişlikte her kart ≈124 px olur.
  - Uzun adlar ("Buz Kaplumbağası") 14 px'te sığmazsa 13 px'e iner, gerekirse "…" ile kısalır. Tam ad bilgi kartında görünür.
- **Ada genişliğe göre yerleşir** (yatay FOV sabit). Kare pencerede üstte ve altta ≈100 px gökyüzü kalır. Bu bilinçli bir boşluktur; tahta onu doldurmak için büyütülmez, çünkü büyütülürse karo alanı yan sütunların altına girer.

**Çakışma kuralı:** karo alanının (`X ∈ [−3, 3]`, `Z ∈ [−4, 4]`) ekran izdüşümü hiçbir HUD panelinin altına girmez. `KutOlcek.cs` bunu her düzen değişiminde denetler. Çakışma varsa yatay FOV'u 1°'lik adımlarla, en çok 52°'ye kadar artırır.

### 3.4 Dikey ekran

- `W/H < 0,8` olunca (telefon ya da dikey tablet) oyun duraklar. Mor zemin üstünde dönen bir telefon çizimi ve "Kut Arena yatay oynanır. Cihazını yan çevir." yazısı görünür.
  - Savaş sürüyorsa motor da durur ve kaldığı yerden devam eder.
  - Hazırlık sayacı dereceli maçta **durmaz**; uyarı ekranında sayaç görünmeye devam eder.
- Unity'de `Screen.orientation` yatay kipe kilitlenir. Uyarı yalnız masaüstü ya da web penceresinde görünür.
- Telefonda yatay oyun desteklenir (19,5:9 → geniş düzen). Telefonun kısa kenarı 360–430 mantıksal px olduğu için HUD orada `s = H/800` ile serbest bırakılır ve en küçük yazı 15 mantıksal px'e çıkar. Telefon kipini `Screen.dpi` belirler: kısa kenar 5 inçten küçükse telefon sayılır. Bu, tablet sonrası ayrı bir iştir.

---

## 4. Hazırlık: öğeler ve etkileşimler

### 4.1 Tahtadaki yaratık

- **Görünüm:**
  - model ve ayağının altında yuva plakası;
  - başının üstünde yıldızlar: ★1 bronz, ★2 gümüş iki yıldız, ★3 altın üç yıldız ve taç;
  - ayağının önünde **eşya şeridi**: en çok 3 kare (0,22 m, kameraya dönük), bileşen rengi ve simgesi.
  - Hazırlıkta can ve mana çubuğu **yoktur**; yalnız savaşta görünür.
- **Kaynaşmış kahraman:**
  - Madalyon (ikinci kahramanın portresi, gün batımı çerçeve, 0,4 m) modelin sağ alt yanında billboard olarak durur.
  - Ayaklarında pembe-altın bir halka döner (8 sn/tur).
- **Boşta davranış:** `bekle` döngüsü, her 6–10 sn'de rastgele küçük bir hareket (`UNITY_DEVIR.md` §3).
- **Yükselme sinyali:** ★2 ya da ★3 olacak kopyalar elde varken dükkânda sonuncusu çıkarsa, eldekilerin üstünde 0,8 sn aralıkla zümrüt bir ok yanıp söner. Dükkân kartı zümrüt çerçeve alır ve "★2 olur" rozetini gösterir.
  - Kaynaşmış A×B birimi de A'nın yıldız birleşmesine katılır (`OYNANIS_DERINLIK.md` §7.3). Bu durumda ok, kaynaşmış birimin madalyonunun üstünde yanar.

### 4.2 Sürükle ve bırak

Tek parmak her şeyi yapar:

| Hareket | Eşik | Sonuç |
|---|---|---|
| Kısa dokunuş | < 300 ms ve < 12 px | Bilgi kartını aç. Aynı yaratığa yeniden dokunulursa kapat. |
| Basılı tutma | ≥ 300 ms, < 12 px | Bilgi kartı parmak kalkana kadar açık kalır. Fareyle: üstünde 400 ms durmak aynı kartı açar. |
| Sürükleme | ≥ 12 px hareket (hangi anda olursa) | Sürükleme başlar; açık bilgi kartı kapanır. |

**Sürükleme boyunca:**

- **Konum:** yaratık parmağın **70 px üstünde** ve 1,12 kat büyük durur, böylece parmak onu örtmez. Altında zemine düşen gölge halkası parmağın gerçek hedefini gösterir. Zemin düzlemine ışın atılır; en yakın geçerli yuvaya 0,75 m içinde yapışır.
- **Satış alanı:** sürükleme başladığı anda dükkân şeridinin kart alanı **Satış alanı**na döner (§9).
  - Üstünde "Satmak için buraya bırak" ve satış fiyatı yazar.
  - Seviye ve altın blokları görünür kalır; oyuncu altınının ne olacağını görür.
- **Hedef vurguları:**
  - Boş tahta yuvası açık altın kenar alır ("taşı").
  - Dolu yuva beyaz çift ok gösterir ("yer değiştir").
  - Tahta seviye sınırındaysa ve sürüklenen yedekten geliyorsa boş yuvalar vurgulanmaz. Tahta sayacı kırmızı yanıp söner: "6/6 · seviye atla".
- **Kaynaştırma bekletmesi:**
  - Dolu bir yuvanın üstünde (tahta ya da yedek) **500 ms** hareketsiz durulursa (6 px tolerans), hedef halkası 500 ms'lik **pembe dolumla** çevrelenir, sonra pembe yanar.
  - Etiket "Bırak: Kaynaştır · A × B · N altın" olur. N = `2 + en yüksek kademe`.
  - Bırakmak kaynaştırma onay kartını açar (§4.4). Parmak hareket ederse halka "yer değiştir"e döner.
  - Kaynaştırma uygun değilse dolum başlamaz; etiket nedenini yazar:
    - "Aynı kahramanlar birleşerek yıldız atlar";
    - "Kaynaşmış kahraman tekrar kaynaşamaz" (Üçlü Kaynaşma armağanında bir kez izin verilir);
    - "N altın gerekli".
  - **Rol kuralı:** hedefteki kahraman (üstüne bırakılan) **birinci kahramandır**: gövde, yetenek ve menzil ondan gelir. Sürüklenen **ikinci kahramandır**: pasifi verir. Akılda tutması kolay: "üstüne koyduğun şey ona güç katar". Onay kartı rolleri çevirmeye izin verir.
- **Bırakma sonuçları:**
  - Boş yuvaya: taşınır.
  - Dolu yuvaya (500 ms dolmadan): iki yaratık yer değiştirir; hedefteki 0,25 sn'lik bir sıçrayışla sürüklenenin eski yerine gider.
  - Satış alanına: **anında satılır**, onay sorulmaz. Ekranın alt ortasında 4 sn'lik "Geri al" hapı çıkar. Geri alma yalnız aynı hazırlıkta ve dükkân yenilenmeden önce geçerlidir. Satılan kahramanın eşyaları rafa döner.
  - Geçersiz bir yere (gökyüzü, rakip yarısı): yaratık 0,2 sn'de eski yerine kayar.
- **Çoklu dokunuş:** sürükleme sürerken ikinci parmak yok sayılır; yakınlaştırma kilitlidir.
- **Sayaç biterse** sürükleme o anki en yakın geçerli yuvaya bırakılır. Geçerli yuva yoksa yaratık eski yerine döner. Açık onay kartı iptal sayılır.

### 4.3 Rakip önizleme (imza)

Sol üstteki kartın içeriği:

- **Başlık:** "SIRADAKİ RAKİP", göz simgesi, yakut kenar.
- **Kimlik:** rakibin avatarı, adı, "58 can · Sv 6".
- **Mini kadro:** 4×3 ızgara, hücre ≈46 px, `OYNANIS_DERINLIK.md` §4.3'e göre **bu turki** kadro. Satırlar yukarıdan aşağı ön, orta, arka sıradır; ızgara, oyuncunun kendi tahtasına bakışının aynasıdır. Her hücrede portre, yıldız ve kademe rengi kenar bulunur; eşyalar burada gösterilmez, sahnede görünür.
- **Soylar:** rakibin etkin ilk iki soyu, haplar hâlinde.
- **Karşı ipucu:** tek satırlık öneri (`arayuz.js` → `IPUCU`, rakibin en kalabalık soyuna göre).

Kartın davranışı:

- **Basılı tutma** (ya da üstünde durma): rakibin tahtası, rakip yarısında **yarı saydam mor hayaletler** olarak belirir.
  - Hayaletler eşyalarıyla birlikte görünür: mor fresnel shader, alfa 0,55, 0,25 sn'de içeriden beliren modeller. Parmak kalkınca 0,15 sn'de sönerler.
  - Oyuncu konumları kendi diziliminin karşısında görür. Örneğin: "Gölge Tilki arkada ve sağda; benim en sağdaki ön kahramanım ona en yakın."
- **Kısa dokunuş:** kart sağa doğru 420 px'lik **Gözcü paneli**ne genişler. Panelde iki bölüm var:
  - sıradaki rakibin tam bilgisi (kadro, eşyalar, armağanlar, soy eşik açıklamaları);
  - diğer 6 hayaletin **geçen turki** kadrosu, canı, seviyesi ve seri durumu, satır başı 56 px.
  - Panel kartın sağ kenarından yatay kaydırarak da açılır.
- **Canavar turunda** kart "SIRADAKİ DALGA" olur. Canavarlar hayalet olarak gösterilir; basılı tutunca yetenek metinleri çıkar.
- **Değişim:** rakip tur başında belirlenir. Kart o anda 0,4 sn'lik yakut bir ışıltıyla güncellenir.

### 4.4 Kaynaştırma onay kartı

Ekranın ortasında 620×≈380 bir kart açılır, arkası %55 karartılır (`shot_hazirlik-kaynas_*.png`).

- **Formül satırı:** `[A, yetenek + gövde] + [B, pasif] = [sonuç, madalyonlu]`. Portreler 96 px, sonuç 120 px ve pembe ışımalı.
- **Yetenek ve pasif kutuları:** mavi ve mor kenarlı, tam metin.
- **Değişim hapları:**
  - can, saldırı ve hız, `sim.birimStat` ile hesaplanır, tahmin değildir;
  - **soy değişimi:** takımdaki soy sayacının nasıl değişeceği. Bir eşik açılıyorsa hap zümrüttür: "Ayaz 1 → 2 · eşik açılır". Bir eşik kaybediliyorsa yakuttur (iki kahraman artık tek kişi sayılır);
  - **bedel:** "Bedel 2 + en yüksek kademe (K3) = 5";
  - **eşya:** iki birimin eşyaları toplanır; 3'ü aşan rafa döner ve hapı "1 eşya rafa döner" der.
- **Düğmeler:**
  - İptal (sade, 150): yaratıklar yerine döner.
  - "⇄ Rolleri çevir" (mor, 170): A ile B yer değiştirir, bütün değerler yeniden hesaplanır.
  - **KAYNAŞTIR · N altın** (gün batımı, esnek, 54 yüksek).
- KAYNAŞTIR'a basınca kart kapanır ve kaynaşma sahnesi oynar (§6.3).

### 4.5 Dükkân şeridi

- **Seviye bloğu:**
  - Mor daire içinde seviye (44 px, sayı 20 px), yanında "Sv 6 · 12/20" ve mavi çubuk.
  - Altında **Deneyim** düğmesi (mor, 40 yüksek, "+4 · 4 altın").
  - Daireye dokununca bu ve sonraki seviyenin kademe olasılıkları küçük bir tabloda açılır (`OYNANIS_DERINLIK.md` §10.1).
  - Seviye atlanınca daire 0,5 sn altın parlar, tahtada bir hücre daha kullanılabilir olur ve tahta sayacı "6/7"ye döner (§6.4).
  - Sv 8'de düğme pasifleşir ve "En üst" yazar.
- **Yenile ve Kilitle** üst üste durur, ikisi de 46 yüksek.
  - Yenile'nin fiyatı alt satırdadır. Bedava yenileme varsa (Göç Mevsimi, Pazar Dostu) fiyat yerine "Bedava" yazar ve düğme zümrüt kenar alır.
  - Kilitle açıkken düğme altına döner, simge kapalı kilit olur. Kilitliyken bütün kartların iç kenarında kesikli altın çizgi bulunur.
- **Dükkân kartı** (en çok 152×112):
  - ortada portre (%78 yükseklik);
  - sol üstte dikey soy simgeleri (20 px);
  - sağ üstte fiyat hapı;
  - altta ad şeridi (28 yüksek, 14 px);
  - kademe renginde kenar (K4 ve K5 eklenirse: K4 ametist `#c47bff`, K5 gün batımı degrade).
  - Durumları §9'da.
- **Kart etkileşimleri:**
  - Dokunmak **satın alır**: kahraman yedekteki ilk boş kaideye uçar (0,35 sn yay).
  - Yedek doluysa ve alım yıldız birleşmesi yaratmıyorsa kart sallanır ve "Yedek dolu" etiketi çıkar.
  - Karttan sürüklemek kahramanı doğrudan istenen tahta yuvasına koyar.
  - Basılı tutmak bilgi kartını açar, satın almaz.
- **Altın bloğu:**
  - Üstte **seri hapı**: kazanma serisinde turuncu-kırmızı ve yukarı ok ("Seri 3 · +2"), kaybetme serisinde buz mavisi ve aşağı ok. Seri yoksa hap gizlidir. Dokununca seri tablosu açılır.
  - Büyük altın sayısı (32 px, sikke 30 px).
  - **Faiz boncukları:** 5 adet; her 10 altın için biri dolar. Bereket Küpü armağanıyla 7'ye çıkar.
  - Alt satırda **"+11 sonraki tur"**: taban + faiz + seri + galibiyet. Galibiyet payı "kazanırsan" varsayımıyla eklenir; dokununca dökümü açılır.
  - Altın değişince sayı 0,3 sn'de sayarak değişir; azalınca kısa bir yakut, artınca zümrüt parlama olur.

### 4.6 Eşya rafı ve eşya takma

- **Raf:** 10 yuva (5×2, her biri 34). Dolu yuvada bileşen rengi ve simgesi bulunur. Bileşen renkleri:

  | Bileşen | Renk |
  |---|---|
  | Diş | turuncu |
  | Tüy | gök mavisi |
  | Kor | kor |
  | Çiy | safir |
  | Kabuk | gümüş |
  | Yürek | yakut |
  | Pul | ametist |
  | Buz | buz beyazı |

  - Tam eşyada iki rengin çapraz bölünmüş zemini ve altın bir kenar bulunur.
  - Raf doluyken düşen ganimet rafın üstünde "taşan" rozetiyle bekler.
- **Takma:**
  - Bileşen bir yaratığın üstüne sürüklenir. Hedef yaratığın eşya şeridinin yanında **sonuç baloncuğu** açılır: oluşacak tam eşyanın adı, simgesi ve etkisi, ya da "Diş takılır: +%15 saldırı". Kaynaştırma bekletmesi eşyada yoktur; bırakmak hemen takar.
  - Dolu (3 eşyalı) yaratık geçersiz hedeftir, yalnız tamamlanacak bir bileşen varsa kabul eder.
- **Rafta birleştirme:** iki bileşen üst üste bırakılırsa birleşir.
- **Tarif çarkı:** rafta bir bileşene basılı tutmak 8 tarifi gösteren bir çark açar. Çark 280 px çapındadır; bileşen ortada, 8 eşi çevrede, her eşin yanında sonuç eşyasının adı yazar.
- **Kut Yankısı önizlemesi** (savaşta, §7): eşya şeridi Kut kipinde yankı simgelerine döner.

### 4.7 Kamera ile oynama

- Döndürme ve eğme yoktur; iki parmakla çevirme hareketleri yok sayılır.
- **Hafif yakınlaştırma:** iki parmak kıstırma ya da fare tekerleği ile 1,0–1,15 arası. Odak, parmakların orta noktasına göre en çok ±1,5 m kayar.
- Boş zemine çift dokunmak yakınlaştırmayı 1,0'a döndürür.
- Savaş başında yakınlaştırma 0,4 sn'de 1,0'a döner.

### 4.8 Soy izleyici

- **Satır** (35 yüksek):
  - Altıgen simge (30 px). Rengi seviyeyi gösterir: etkin değilse gri, ilk eşik altın, ikinci eşik beyaz-altın, üçüncü eşik gün batımı degrade.
  - Ad (15 px).
  - Sağda eşik kutuları `[2][4][6]`: ulaşılan altın dolgulu, ulaşılmayan sönük. İlk eşiğe ulaşılmamışsa ilk kutuda "1/2" yazar.
- **Sıralama:** önce etkin soylar (yüksek seviye, sonra sayı), sonra eşiğe 1 eksik olanlar. En çok 6 satır görünür; gerisi başlıktaki "+N" ile belirtilir ve başlığa dokununca liste açılır.
- **Açıklama:**
  - Satıra basılı tutmak ya da üstünde durmak satırı altın çerçeveyle vurgular. Altında üç eşiğin açıklaması ve o soyu taşıyan kahramanların adları açılır.
  - **Aynı anda** tahtada o soyu taşıyan yaratıkların yuva plakası soyun rengiyle yanar.
  - Tersi de geçerli: dükkân kartına basılı tutunca kartın soyları sol sütunda vurgulanır.
- **Değişim:** bir eşik açıldığında satır 0,4 sn büyüyüp küçülür ve simge parlar (§10).

### 4.9 Lobi (oyuncu listesi)

- **Satır** (42 yüksek; kompaktta 50):
  - sıra numarası, avatar (32), ad (14);
  - can çubuğu (can/100 genişliğinde, kırmızı) ve yanında can sayısı;
  - sağda seviye ("Sv6").
- **Sıralama:** can (çoktan aza). Eşitlikte önce son tur sonucu, sonra seviye. Sıra değişince satırlar 0,4 sn'de kayar.
- **Durumlar:**
  - kendi satırın altın çerçeveli;
  - **sıradaki rakip** yakut çerçeveli ve sağ üstünde göz rozeti;
  - **Yankı** ile eşleşilen turda rakip satırında ince bir "yankı" simgesi;
  - elenenler %40 opak, gri avatarlı, elenme sırasıyla en altta.
- **Dokunma:** o oyuncunun son bilinen takımı rakip yarısında hayalet olarak gösterilir (§4.3'teki görsel). Yalnız bilgi amaçlıdır.
- **Son İki ve Son Üç:** lobide 3 kişi kalınca başlık "SON ÜÇ · taban +3" olur. 2 kişi kalınca "FİNAL DÜELLOSU" olur ve iki satır altın kenar alır.

### 4.10 Üst şerit: bölüm haritası, alamet, sayaç

- **Bölüm haritası:** "3-3" yazısı ve bölümün 7 turu için 22 px kare simgeler.
  - Simgeler: savaş çapraz kılıç, armağan yıldız, Kervan bayrak, canavar kafatası.
  - Geçmiş turlar soluk, şimdiki altın dolgulu ve parlayan. Kazanılan geçmiş savaşın altında 3 px'lik zümrüt, kaybedilenin altında yakut çizgi bulunur.
  - Dokununca bölümün tam planı açılır.
- **Alamet hapı:** yakut zemin, alamet simgesi, ad ve kısa etki. Dokununca tam metin açılır.
- **Sıradaki alamet:** sağında soluk ve küçük bir hap ("Sonra: Sis").
  - Alamet Bilgesi armağanında 3 turun alameti görünür.
  - O armağanın "Durgun Gök yap" hakkı, alamet hapına basılı tutunca açılan küçük bir düğmedir.
- **Hazırlık sayacı:** 300×8 çubuk ve saniye. Bölüm 1'de 20 sn, sonra 25 sn.
  - Son 5 saniyede çubuk yakuta döner, saniye yazısı 1,15 kat büyür ve her saniye tıklar (§10).
  - Süre bitince savaş kendiliğinden başlar, aynı SAVAŞA geçişiyle.
  - **Rahat** ve **Hızlı Maç**'ta sayaç durdurulabilir; çubuğun solunda 32 px'lik bir duraklat düğmesi çıkar.

### 4.11 SAVAŞA

- Altın düğme, 200×96, üç satır:
  - "SAVAŞA" (26 px) ve çapraz kılıç simgesi;
  - "‹Rakip›'na karşı" (13 px);
  - **hasar önizlemesi**: "Kaybedersen ~11 can" (13 px, koyu turuncu).
- SAVAŞA'ya basmak hazırlığı erken bitirir; dereceli maçta bu yalnız oyuncunun kendi bekleme süresini kısaltır (hayaletler beklemez).
- **Tahtada boş yer varken ve yedekte yaratık dururken basılırsa** düğme "Tahtada 1 boş yer var · yine de başla" der ve 2 sn içinde ikinci basış ister. Eğitimden sonra bu uyarı Ayarlar'dan kapatılabilir.
- **KUT düğmesi aynı noktada belirir** (§7); oyuncunun eli savaş boyunca aynı yerde kalır.

### 4.12 Kut Armağanı seçimi (2-1, 3-2, 4-3)

`shot_hazirlik-armagan_*.png`

- Tur başında hazırlıktan önce açılır. Sahne %55 kararır, HUD görünür kalır ama dokunulamaz.
- **Başlık:** "KUT ARMAĞANI · ALEV" (26 px). Kademe adı rengiyle yazılır: Kıvılcım gümüş, Alev turuncu, Yıldız altın-pembe.
- **Alt satır:** "Üçünden birini seç · 0:12" (15 sn sayaç).
- **3 kart** (260×≈220, aralarında 16):
  - 56 px'lik simge yuvarlağı;
  - ad (19 px) ve tür hapı (Kut, Kaynaştırma, Önceden görme, Eşya, Ekonomi, Seviye, Alamet, Geri dönüş);
  - tek cümle etki (15 px);
  - çizgiyle ayrılmış "Neden seç?" ipucu (13 px, altın).
  - Kart kenarı kademe rengindedir.
- **Seçme:** bir karta dokunmak onu seçer: kart 6 px yükselir, beyaz-altın kenar ve ışıma alır. Alt düğme "Seç: ‹ad›" olur. Seçili karta ikinci kez dokunmak da onaylar.
- **Yenile (1):** üç kartın hepsini değiştirir, aşama başına bir kez.
- **Süre biterse:** seçili kart, seçim yoksa ilk kart alınır.
- **Seçimden sonra:** kart sol üstteki rakip kartının altına küçük bir **armağan rozeti** (32 px) olarak uçar. Seçilen armağanlar orada yan yana durur; basılı tutunca açıklama gösterilir.

### 4.13 Kervan (x-4) ve canavar turu (x-7)

- **Kervan:**
  - Tahtanın ortasında yarım daire biçiminde 3–5 kaide belirir; sayı sıralamaya göre değişir.
  - Her kaidede bir kahraman ve önünde eşyası durur.
  - Dokunmak seçimi işaretler ve altta "Seç: Dağ Koçu + Diş" düğmesi çıkar. Basılı tutmak bilgi kartını açar.
  - 15 sn sayaç vardır; dükkân şeridi bu turda gizlidir.
  - Seçilen kahraman yedeğe yürür, eşya rafa uçar. Yedek doluysa kahraman sikkeye dönüşür ve altın bloğuna akar.
  - 3-4 Kervan'ındaki hazır kaynaşmış birim, madalyonu ve pembe halkasıyla gösterilir.
- **Canavar turu:**
  - Rakip yarısında canavarlar gerçek modelleriyle durur.
  - Rakip kartı "SIRADAKİ DALGA" olur; lobi satırlarında göz rozeti yoktur.
  - Ölen canavardan **ganimet küresi** düşer (bileşen rengi, 0,5 m). Savaş bitince küreler 0,4 sn arayla rafa uçar. Seçmeli ganimette (1-3, 4-7) savaş sonunda iki ya da üç seçenekli küçük bir seçim kartı açılır.

---

## 5. Bilgi kartı (basılı tutma)

`shot_hazirlik-bilgi_*.png`

- **Boyut:** 300×≈330, cam zemin, altın kenar.
- **Konum kuralı:** kart her zaman kahramanın **karşı yarısındaki** yan sütunun üstüne açılır. Kahraman ekranın sağ yarısındaysa kart sol sütunu örter (sol 12, üst 64); sol yarısındaysa sağ sütunu örter. Kart, tahtayı ve kahramanı asla örtmez.
- **İçerik:**
  - portre (62), ad (19), kademe hapı, yıldız, soy hapları;
  - 6 stat (3×2 ızgara): can, saldırı, hız, menzil, mana, yetenek gücü;
  - yetenek ve pasif kutuları (13,5 px, tam metin);
  - eşyalar (her biri adı ve tek satır etkiyle);
  - en altta 13 px'lik ipucu satırı: "Sürükle: taşı · Başka kahramanın üstüne tut: kaynaştır · Dükkâna sürükle: sat (+2)".
- **Seçili vurgusu:** kart açıkken kahramanın yuva plakası parlak açık altın yanar.
- **Dükkân kartı ve rakip hayaleti için** aynı kart kullanılır. Rakipte ipucu satırı yerine "Rakip · bu turki kadro" yazar.

---

## 6. Geçişler

### 6.1 Hazırlıktan savaşa (toplam 1,6 sn)

| Zaman (sn) | Olay |
|---|---|
| 0,00 | SAVAŞA basıldı ya da sayaç bitti. Düğme 3 px iner. Ses `savas_basla`, dokunsal orta. |
| 0,00–0,30 | Dükkân şeridi 128 px aşağı kayar (ease-in). Sol sütun 240 px sola, eşya rafı ve SAVAŞA dışarı kayar, sayaç söner. Yuva plakaları söner. Yedekteki yaratıklar %60 opaklığa iner ve oturur. |
| 0,10–0,70 | **Rakip tahtası belirir.** Rakip yarısındaki dolu hücrelerde altın ışık sütunları yükselir; 0,08 sn arayla, ön sıradan arkaya. Her sütunun içinden rakip yaratığı 0,25 sn'de ölçek 0→1 (overshoot 1,08) ile çıkar. Rakip yarısının karartması kalkar. |
| 0,20–1,10 | **Kamera** hazırlık ayarından savaş ayarına geçer (ease-in-out, 0,9 sn). Hedef öne gelir, eğim 50°→56° olur. Yol boyunca sapma 0 → +4° → 0 salınır: "döndü" hissi verir ama oyuncu yönünü kaybetmez. |
| 0,70–1,10 | Üst orta skor şeridi yukarıdan iner; bölüm haritası ve alamet hapı sağ üste toplanır. Lobi sütunu 54 px aşağı kayar. Solda etkin soylar mini listesi belirir. KUT düğmesi sağ altta 0,3 sn'de ölçek 0,6→1 ile belirir. |
| 1,10–1,60 | Ortada **"SAVAŞ!"** yazısı (64 px, altın) 0,3 sn büyür, 0,2 sn'de söner. Orta çizgi soldan sağa yanar. |
| 1,60 | Motor `t = 0`'dan başlar. Görüntü motoru 0,4 sn geriden izler (`ANIMASYON_PLANI.md` §1). |

### 6.2 Savaştan hazırlığa (toplam 2,4 sn, sonuç bandıyla)

- **Sonuç bandı:** motor bitince sahne 0,3 sn yavaşlar (zaman ölçeği 0,3) ve ortada bant açılır.
  - "ZAFER" ya da "YENİLGİ" yazar.
  - Altında yenilgide "−11 can · 53 kaldı" yazar ve hasarın dökümü küçük harfle verilir: "taban 5 + 6 sağ birim".
  - Zaferde "+1 altın · Seri 4" yazar.
- **Kazananlar:** sağ kalan yaratıklar `zafer` animasyonunu oynar.
- **Yenilgide:**
  - ekran kenarında 0,6 sn'lik yakut bir nabız atar;
  - kaybedilen can, rakibin sağ kalan yaratıklarından çıkan küçük ışık okları olarak lobideki kendi satırına uçar ve çubuk azalır.
- **Rakibin gidişi:** 1,4 sn sonra rakip yaratıklar ışık sütunlarıyla yukarı çekilir.
- **Yerine dönüş:** oyuncunun yaratıkları 0,5 sn'de hazırlık hücrelerine yürür; savaştaki son konumlarından değil, hazırlık konumlarından başlarlar.
- **Hazırlığa dönüş:** kamera ters yolla döner ve dükkân şeridi yükselir. Gelir, altın bloğuna sikke akışıyla eklenir: taban, faiz, seri ve galibiyet sırayla, her biri 0,15 sn.
- **Yeni tur:**
  - Bölüm haritasındaki işaret bir sonraki kareye kayar.
  - **Alamet kartı** ortadan açılır (§6.5).
  - Dükkân kartları soldan sağa 0,06 sn arayla çevrilerek gelir.
- **Atlama:** sonuç bandında ekrana dokunmak geçişi 0,8 sn'ye indirir.

### 6.3 Kaynaşma sahnesi (1,4 sn)

1. İki yaratık yerden 0,5 m kalkar ve birbirine doğru spiral çizerek döner (0,6 sn). Arka plan %40 kararır.
2. Gün batımı renginde bir ışık patlaması olur: 0,08 sn beyaz flaş, `kaynasma` sesi, güçlü dokunsal.
3. Ana gövdeli yeni kahraman yere iner. Madalyon yanında dönerek yerine oturur, eşyalar şeride diziliş sırasıyla uçar.
4. Üstünde "Dağ Koçu × Ayaz Baykuşu" yazısı 1,2 sn durur. Bu, oyuncunun ilk kez yaptığı bir kaynaşmaysa yazı "YENİ KAYNAŞMA!" olur ve kaynaşma koleksiyondaki melez defterine kaydedilir (§8.3).

### 6.4 Yıldız atlama (0,9 sn)

- Kopyalar ışık şeritleriyle hedefe çekilir (0,4 sn).
- Hedef 1,25 kat şişip iner. Yıldızlar başının üstünde tek tek belirir: ★2'de 2 vuruş, ★3'te 3 vuruş sesi.
- Eşyalar toplanır; 3'ü aşanlar rafa uçar.
- ★3'te ek olarak taç belirir ve ekranda altın kıvılcımlar düşer.

### 6.5 Alamet açılışı (tur başı, 1,2 sn, atlanabilir)

- Sahnenin ortasında 360×200 bir kart açılır: alamet simgesi, ad (28 px), etki (16 px). Aynı anda arena rengi alamete göre değişir.
- 1,2 sn sonra kart küçülerek üst şeritteki alamet hapına uçar.
- İlk 3 maçta kart 2,5 sn kalır ve altında "Bu kural bu tur bütün lobi için geçerli" yazar.

---

## 7. Savaş HUD'u

`shot_savas_*.png`

- **Skor şeridi** (üst orta, cam, 56 yüksek):
  - solda "Sen %72" ve yeşil can çubuğu (200 genişlik);
  - ortada süre (26 px), altında "kalan";
  - sağda "%41 ‹rakip›" ve sağdan sola dolan kırmızı çubuk.
  - Yüzdeler takımların toplam kalan canıdır.
- **Gün Batımı:** 20. saniyede (Uzun Gölge'de 12.) süre kutusunun altında turuncu bir hap belirir: "GÜN BATIMI ×1,3". Çarpan her saniye güncellenir: `1 + 0,1 × floor(t − 20)`. Gökyüzü kızıllaşır ve hasar sayıları turuncuya kayar. Son 5 saniyede süre yakut olur ve her saniye tıklar.
- **Sağ üst:** alamet hapı (kısa ad) ve bölüm haritası (yalnız "3-3"). Menü düğmesi duraklat simgesini taşır.
  - **Dereceli maçta** duraklatma yoktur; düğme yalnız ses ve ayarlar kartını açar, motor sürer.
  - **Rahat ve Hızlı Maç'ta** motor durur.
- **Etkin soylar:** solda dikey, 44 yüksek haplar (simge, ad, sayı). Yalnız eşiğe ulaşanlar görünür.
- **Lobi:** sağda, skor şeridinin altında (üst 118). Diğer eşleşmelerin sonuçları savaş sırasında satırlarda küçük bir kılıç simgesiyle "sürüyor" görünür. Sonuç gelince can çubukları güncellenir.
- **Yaratıkların üstünde:**
  - can çubuğu (oyuncu yeşil, rakip kırmızı; 0,9 m × 9 px) ve altında mavi mana çubuğu;
  - kalkan, can çubuğunun sağında beyaz bir bindirme;
  - yıldızlar çubuğun üstünde, eşya şeridi ayakta.
- **Durum etiketleri** (Sersem, Donmuş, Zehir): çubuğun üstünde 1 sn görünür, sonra yalnız simgesi kalır.
- **Hasar sayıları:**
  - normal vuruş beyaz, 26 px;
  - kritik ya da yetenek altın, 34 px ve "!" ekli;
  - iyileşme yeşil "+".
  - Sayılar 0,7 sn'de 40 px yükselip söner. Aynı yaratık 0,15 sn içinde birden çok sayı alırsa sayılar toplanır.
  - Ayarlar'dan azaltılabilir (§8.4).
- **KUT düğmesi** (sağ alt, 156 px daire):
  - Altın-turuncu degrade, ortada "KUT" (40 px), altında hak sayısı "1/1" (Çifte Kut ve Final Düellosu'nda "2/2").
  - Hazırken 1,2 sn'lik bir nabız atar.
  - **Kut kipi:**
    - Düğmeye dokunmak kipi açar. Dost yaratıkların ayağında altın halkalar yanar.
    - Her dostun üstünde, Kut verilirse alacağı **yankı simgeleri** görünür (eşya şeridinden yükselir).
    - Görüntü 0,35 hıza yavaşlar; kip en çok 3 sn sürer.
    - Bir dost yaratığa dokunmak Kut'u ona verir.
    - Boşluğa dokunmak ya da 3 sn beklemek kipi iptal eder.
  - **Yavaşlama ve belirlenimcilik:** yavaşlama yalnız görüntü saatine ve motorun adımlama temposuna uygulanır. Motorun `t` değeri ve 0,05 sn'lik adımı değişmez; Kut motora dokunuş anının `t`'si artı 0,4 sn olarak yazılır (`ANIMASYON_PLANI.md` §1). Belirlenimcilik ve tekrar izleme bozulmaz.
  - **Kestirme:** düğmeye basmadan bir dost yaratığa **çift dokunmak** Kut'u hemen verir.
  - **Kullanıldıktan sonra** düğme grileşir; içinde Kut'u alan yaratığın portresi ve zümrüt onay işareti görünür.
  - **Kut Sessizliği** alametinde düğme kilitli durur ve "Bu tur Kut yok" yazar.
- **Kut ipucu kartı:** KUT'un solunda. Yalnız ilk 3 maçta ve Kut kullanılmamışken görünür; 4. saniyede açılır ve 4 sn durur.
- **Hız düğmeleri:** KUT'un üstünde, 1× ve 2×. Yalnız tekrar izlemede ve Rahat/Hızlı Maç'ta görünür. Dereceli maçta savaş hızı herkes için 1×'tir; 2× hayaletlerle süre eşitliğini bozardı.
- **Oyuncu elendiyse:** ekranın ortasında "ELENDİN · 6. sıra" bandı çıkar. Altında iki düğme bulunur: "Maç sonu" ve "İzlemeye devam et". İzlemede kalan hayaletlerin savaşları bir sonraki eşleşmeye atlayarak gösterilir.

---

## 8. Menüler

### 8.1 Ana ekran (`shot_ana_*.png`)

- **Arka plan:** oyuncunun **kendi adası**, gerçek 3D sahne.
  - Kamera hazırlık kamerasından uzak ve 8° sağa sapmış durur, 40 sn'lik yavaş bir yay çizer.
  - Adanın önünde oyuncunun vitrin için seçtiği 4 yaratık, seçtiği görünümlerle bekleme animasyonunda durur.
  - Kompakt düzende ada alta yaslanır, logo gökyüzüne düşer.
- **Sol üst:** Profil hapı (avatar 46, ad 16, ustalık seviyesi). Dokununca Profil açılır.
- **Üst orta:** lig hapı. Kupa simgesi, "Gümüş Lig · 1 240", ilerleme çubuğu, "Altın Lig'e 220 kupa".
- **Sağ üst:** Ayarlar (44 daire). Altında **Günlük görevler** kartı (250 genişlik, 3 görev, yeşil çubuklar).
- **Logo:** üst orta, 420 genişlik.
- **Oyna bloğu** (alt orta):
  - **Mod seçici:** cam hap, 4 düğme. Seçili olan altın çerçeveli.
    - Dereceli (8 kişi, sayaç zorunlu);
    - Rahat (8 kişi, sayaç durur, kupa yok);
    - Hızlı Maç (eski kurallar, ~7 dk);
    - Öğretici.
  - **OYNA:** 380×92, altın. "OYNA" 36 px; alt satırda moda göre süre ("~18 dk · 8 kişilik hayalet lobi").
  - Altında yarım kalan maç satırı: "Yarım kalan maç: 3-3 · 64 can · 2. sırada — Devam et ›". Yarım maç varsa OYNA'nın yazısı DEVAM ET olur, satır "Yeni maç başlat ›"a döner.
- **Alt gezinme çubuğu** (alt orta, 5 × 104×64):
  - Arena, Koleksiyon, Profil, Düello, Rehber; simge 24 px, yazı 13 px.
  - Yeni içerik varsa yakut nokta görünür.

**Düzeltilen sorunlar:**

- Tek birincil eylem var.
- Ada ve yaratıklar oyunu satıyor.
- 3 eşit ikincil düğme alt çubuğa indi.
- "Güç satılmaz", "hayalet havuzu bağlı" gibi geliştirici notları kalktı. Bağlantı durumu yalnız bağlantı yoksa görünür.

### 8.2 Profil

Ana ekran sahnesi bulanıklaşır (8 px). Soldan 380 px'lik, tam yükseklikte bir panel kayar; sağdaki 3D sahnede vitrin yaratıkları durmaya devam eder.

- **Kimlik:** avatar (96), ad (değiştirilebilir, 3–16 karakter, kalem simgesi), oyuncu kodu (kopyalanabilir).
- **Lig:** lig rozeti (Bronz, Gümüş, Altın, Gök, Kut), kupa, en yüksek kupa, sezon sonu ödülü.
- **İstatistikler** (2×3 ızgara, her biri 112×72):
  - maç sayısı, ilk 4 oranı, ortalama sıra;
  - en sık kullanılan kahraman;
  - en sık kaynaşma;
  - en iyi Kut anı (ör. "Anka · 9. sn · 2 düşman").
- **Son 10 maç:** her satırda sıra rozeti (1–8, ilk 4 altın tonlu), son takımın 8 mini portresi ve kupa değişimi. Satıra dokunmak o maçın son savaşının **tekrarını** oynatır. Motor belirlenimci olduğu için tekrar bedavadır: takımlar, tohum ve Kut kaydı yeter.
- **Vitrin:** 4 yuva. Dokununca koleksiyondan yaratık ve görünüm seçilir.
- **Avatar ve çerçeve:** ustalık ve Kürsü sayacıyla açılır.

### 8.3 Koleksiyon (eski Kodeks)

Tam ekran. Üstte geri düğmesi (56×52), başlık ve **4 sekme**: Kahramanlar, Soylar, Eşyalar, Alametler. Sağda ustalık rozeti.

- **Kahramanlar:**
  - Solda dikey **filtre şeridi** (180): Hepsi, K1…K5 ve 10 soy simgesi (çoklu seçim).
  - Ortada ızgara: 4:3'te 4 sütun, 16:10'da 5 sütun.
  - Kart 176×196 (kompaktta 160×180): büyük portre, ad (16), kademe hapı, soy simgeleri, ustalık çubuğu. Uzun metinler kartta değil, ayrıntıda.
- **Kahraman ayrıntısı** (tam ekran):
  - Solda **3D model**; parmakla döndürülür (oyunda döndürmenin olduğu tek yer). Altında görünüm seçici.
  - Sağda ad, kademe, soylar, 6 stat; yetenek ve pasif kutuları (15 px, tam metin).
  - **Melez defteri:** bu kahramanın 15 olası eşi. Açılmışlar renkli ve adlı, açılmamışlar silüet. Üstte "Bu kahramanla 4/30 melez" yazar; iki rol ayrı sayılır.
  - Ustalık yolu: Sv 2 çerçeve, Sv 5 ikinci görünüm, Sv 10 efsane görünüm.
- **Soylar:** soy başına bir satır (72 yüksek): simge, ad, üç eşiğin açıklaması, o soyu taşıyan kahramanların portreleri (32 px). Portreye dokunmak kahraman ayrıntısını açar.
- **Eşyalar:**
  - Üstte 8 bileşen, altında **8×8 tarif tablosu**. Satır ve sütun bileşenlerdir; kesişimde tam eşyanın simgesi durur.
  - Bir hücreye dokununca sağda ayrıntı açılır: ad, istatistik, etki, Kut Yankısı.
  - Özel eşyalar (Kut Taşı, Söküm Taşı, Soy Mühürleri) ayrı satırdadır.
- **Alametler:** kartlar (görsel, ad, etki), altında "Hangi soyu güçlendirir/zayıflatır" satırı.

**Düzeltilen sorunlar:** 26 öğe tek ekrandan sekmelere bölündü; metin boyu 15'e çıktı; kaynaşma artık bir koleksiyon öğesi ve keşif ödüllendiriliyor.

### 8.4 Ayarlar

Ortada 560 genişlikte bir kart ve dört sekme. Değişiklikler anında uygulanır; "Kaydet" düğmesi yoktur.

- **Ses:** Ana ses, Müzik, Efekt, Arayüz kaydırıcıları (0–100, 44 yüksek). "Titreşim" anahtarı yalnız donanımda titreşim varsa görünür.
- **Görüntü:**
  - Kalite: Otomatik, Yüksek, Orta, Düşük (LOD, gölge, bloom).
  - Kare hızı: 30 ya da 60.
  - "Hasar sayıları": Hepsi, Yalnız büyükler, Kapalı.
  - "Ekran sarsıntısı" anahtarı.
  - "Renk körü kipi": kademe ve takım renklerine biçim eklenir, kırmızı/yeşil çubuklar turuncu/mavi olur.
- **Oynanış:**
  - "Kaynaştırma bekletmesi": 300, 500 ya da 800 ms.
  - "Satışta onay iste" (varsayılan kapalı, geri al var).
  - "Boş yuva uyarısı".
  - "Savaş hızı varsayılanı" (Rahat ve Hızlı Maç için).
  - "İpuçlarını sıfırla".
- **Hesap:** dil, oyuncu adı, bağlantı (anonim ya da bağlı hesap), veri silme.

### 8.5 Maç sonu (`shot_son_*.png`)

- **Arka plan:** ada bulanık ve karartılmış.
  - İlk 3'te **Kürsü**: üç takım 3D kürsüde dizilir, kamera onları 3 sn'de gezer, sonra kart açılır.
  - Birincide ek olarak dönen ışın halkası ve konfeti.
- **Kart** (760 genişlik, ortalı, cam ve altın kenar). Yukarıdan aşağı:
  1. **Unvan:** "1. SIRA" (56 px, altın degrade). 2–4 gümüş, 5–8 sade beyaz. Altında "Arena senin · 64 can kaldı · 5-4" ya da "5-1'de elendin".
  2. **Podyum:** son takımın yaratıkları yan yana; maçın yıldızı ortada ve 1,25 kat büyük. Bu, ana ekrandaki 3D vitrin sahnesidir; makette portre kullanıldı.
  3. Altında "Maçın yıldızı: Kaya Golemi × Anka · 1 840 hasar".
  4. **3 bilgi kutusu:**
     - **Kupa:** "1 240 → 1 280 +40" ve lig çubuğu; sayı 1 sn'de sayarak artar.
     - **Turlar:** tur başına bir şerit; kazanılan zümrüt, kaybedilen yakut, canavar turu mor.
     - **Açıldı:** ustalık, görev ödülü ya da "Bu maçta keşfettiğin melezler" (portre çiftleri). Hiçbiri yoksa "Haftalık görev 6/10" ilerlemesi.
- **Eylemler:**
  - Ana ekran (mor, 60 yüksek);
  - **Takımı paylaş** (gün batımı): sistemin paylaşım menüsünü açar. İçinde takım görseli (otomatik üretilen 1200×630 kart) ve düello kodu bulunur; birincide kart altın çerçevelidir;
  - **Yeniden oyna** (altın, 280×68, birincil).
- **Düzeltilen sorunlar:** 8 kutu 3'e indi; düello kodu dizgisi ekrandan kalktı (paylaşımın içinde ve Düello sekmesinde); birincil eylem tek ve en büyük.

### 8.6 Düello (alt çubuk sekmesi)

- İki büyük kart:
  - **Kod gir:** 6 parçalı giriş alanı (`KUT1-` ön eki sabit) ve Yapıştır düğmesi.
  - **Kodumu paylaş:** son takımın görseli ve paylaş düğmesi.
- Kod girilince arkadaşın takımı rakip yarısında hayalet olarak belirir. Oyuncu kendi son takımıyla ya da hazırlık evresinde kurduğu takımla dövüştürür.

---

## 9. Bileşen listesi ve durumları

Ölçüler mantıksal pikseldir; sprite'lar 2× üretilir.

"Cam" zemin:

- dolgu `rgba(24,10,44,.78)`;
- 1,5 px kenar `rgba(242,191,74,.55)`;
- köşe yarıçapı 14;
- arkada 6 px bulanıklaştırma. URP'de ekran bulanıklığı pahalıysa düz, %86 opak dolgu kullanılır.

| Bileşen | Boyut | Durumlar |
|---|---|---|
| **Cam panel** | esnek | normal; vurgulu (rakip: yakut kenar ve degrade); daralmış (kompakt lobi) |
| **Hap (üst şerit)** | 44 yük. | normal; değişim (0,4 sn 1,1 büyüme + renk parlaması); uyarı (can 20'nin altında: yakut nabız) |
| **Bölüm haritası karesi** | 22×22 | geçti (soluk + zümrüt/yakut alt çizgi); şimdi (altın, ışıma); gelecek; tür simgesi (savaş, armağan, Kervan, canavar) |
| **Alamet hapı** | 44 yük. | 12 alamet rengi; tur başında karttan uçarak gelir; sıradaki (soluk, 34 yük.) |
| **Hazırlık sayacı** | 300×8 | normal (altın); son 5 sn (yakut, büyüyen saniye); durdurulmuş (gri + oynat düğmesi) |
| **Düğme altın** | ana eylem | normal; basılı (3 px iner, %8 koyu); pasif (%40 doygunluk); onay bekliyor (yazı değişir, kenar nabız atar) |
| **Düğme mor** | ikincil | normal; basılı; seçili (altına döner); bedava (zümrüt kenar); pasif (altın yetmiyor: fiyat yakut, %60 opak) |
| **Düğme gün batımı** | KAYNAŞTIR, Paylaş | normal (pembe ışıma); basılı; pasif |
| **Düğme sade** | İptal, filtre | normal; seçili |
| **KUT düğmesi** | 156 daire | hazır (nabız); kip açık (halka döner, yazı "HEDEF SEÇ"); kullanıldı (gri + portre + onay); ikinci hak hazır ("1/2", 4 sn bekleme halkası); kilitli (Kut Sessizliği, eğitimin ilk savaşı) |
| **Yuva plakası (3D)** | 1,3 m disk | boş (kesikli altın); dolu (düz altın); seviye sınırı (boşlar %40); hedef (parlak açık altın + ışıma); yer değiştir (beyaz çift ok); kaynaştır dolumu (pembe yay 0→360°); kaynaştır hazır (pembe ışıma); soy vurgusu (soy rengi); seçili (parlak altın) |
| **Yedek kaidesi (3D)** | 0,85 m disk | boş; dolu (kademe halkası); hedef; kaynaştır |
| **Yaratık (3D)** | model | bekle; seçili; sürükleniyor (1,12 ölçek, 70 px yukarıda, gölge halkası); hayalet (mor fresnel, alfa 0,55); yükselebilir (zümrüt ok); kaynaşık (madalyon + pembe halka); savaş (çubuklar açık); Kut kipi (altın halka + yankı simgeleri); ölü (çözülme) |
| **Madalyon** | 0,4 m billboard | tek durum; savaşta 2 katman ışıma |
| **Eşya şeridi (3D)** | 3 × 0,22 m | boş (gizli); bileşen; tam eşya (çift renk + altın kenar); yankı (Kut kipinde parlar) |
| **Dükkân kartı** | ≤152×112 | normal; yükselir (zümrüt çerçeve + "★2 olur"); elde var ("Elinde 1/3" alt rozet); alınamaz (fiyat yakut, %60 opak); kilitli (kesikli iç çizgi); satıldı/boş (kesikli, sönük); basılı (2 px iner) |
| **Satış alanı** | dükkân kart alanı | gizli; görünür (yakut kesikli kenar, çizgili zemin); hedef üstünde (zemin %40 daha parlak, fiyat 1,15 büyür) |
| **Soy satırı** | 216×35 | etkin değil (sönük); eşik 1/2/3 (altın / beyaz-altın / gün batımı altıgen); açık (altın çerçeve + açıklama); vurgulu (dükkân kartından) |
| **Rakip kartı** | 216×≈320 | normal; basılı (hayalet tahta açık, kart kenarı parlar); Gözcü paneli (420 genişlik); canavar dalgası (mor kenar); güncellendi (yakut ışıltı) |
| **Armağan rozeti** | 32 daire | kademe rengi; basılı (açıklama) |
| **Lobi satırı** | 200×42 / 76×50 | ben; sıradaki rakip; yankı; normal; elenmiş; savaşta (kılıç simgesi); Son Üç / Final (altın kenar) |
| **Seviye bloğu** | 150×100 | normal; seviye atladı (altın parlama); en üst (düğme pasif) |
| **Altın bloğu** | 126×112 | normal; artış (zümrüt); azalış (yakut); faiz boncuğu doldu (boncuk parlar); seri (kazanma turuncu / kaybetme buz) |
| **Eşya rafı yuvası** | 34×34 | boş; bileşen; tam eşya; sürükleniyor; birleşebilir (iki parça üst üste: altın halka); taşan (rafın üstünde rozet) |
| **Tarif çarkı** | 280 daire | 8 dilim; sahip olunan eş bileşen parlak |
| **Bilgi kartı** | 300×≈330 | açık (karşı yarıdaki sütunun üstünde); basılı tutma (parmak kalkınca kapanır); kısa dokunuş (dışarı dokununca kapanır) |
| **Sürükleme etiketi** | otomatik | taşı (gizli); yer değiştir (beyaz); kaynaştır (gün batımı); eşya sonucu (bileşen rengi); geçersiz (yakut, nedeni yazar) |
| **Kaynaştırma onay kartı** | 620×≈380 | normal; roller çevrildi (formül 0,25 sn'de çevrilir); altın yetmiyor (düğme pasif) |
| **Armağan kartı** | 260×≈220 | normal (kademe kenarı); seçili (6 px yukarı, beyaz-altın kenar + ışıma); süre azaldı (sayaç yakut) |
| **Kervan kaidesi (3D)** | 1,0 m | normal; seçili (altın sütun); alınamaz (yedek dolu: "sikkeye döner" etiketi) |
| **Sonuç bandı** | tam gen. × %30 | zafer (altın kenar); yenilgi (yakut kenar + hasar dökümü); beraberlik (gümüş); elendin (gri, iki düğme) |
| **Bildirim hapı** | alt orta, 40 yük. | bilgi; iyi (zümrüt); hata (yakut); geri al (düğmeli, 4 sn) |
| **Alt gezinme düğmesi** | 104×64 | normal; seçili; yeni (yakut nokta) |
| **Dikey uyarı** | tam ekran | tek durum |

Sahne içindeki yazılar (yaratık adları, kaynaşma adı, "SAVAŞ!") dünya uzayında değil, ekran uzayında bir Canvas'ta çizilir; konumları her kare dünyadan ekrana çevrilir. Böylece yakınlaştırmada yazı boyu değişmez.

---

## 10. Ses ve dokunsal geri bildirim

**Ses kanalları:** Müzik, Efekt, Arayüz.

**Dokunsal düzeyler** (iOS `UIImpactFeedbackGenerator` / Android `HapticFeedbackConstants` karşılıkları):

| Düzey | iOS | Android |
|---|---|---|
| hafif | light | CLOCK_TICK |
| orta | medium | VIRTUAL_KEY |
| güçlü | heavy | LONG_PRESS |
| başarı | notificationSuccess | CONFIRM |
| hata | notificationError | REJECT |

**Sınırlar:** aynı ses 60 ms içinde bir kez çalar. Savaşta aynı anda en çok 6 vuruş sesi çalar; fazlası düşürülür.

| Olay | Ses (dosya adı: tanım) | Dokunsal |
|---|---|---|
| Düğmeye basma (genel) | `ui_tik`: kısa tahta tıkı | hafif |
| Pasif düğmeye basma | `ui_red`: boğuk "tuk" | hata |
| Dükkân kartı satın alma | `al_sikke` (sikke şıngırtısı) + `al_uc` (hafif rüzgâr) | orta |
| Yaratık kaideye/hücreye konma | `kon_tas`: taşa yumuşak basış | hafif |
| Yenile | `yenile_kart`: 5 kartın hızlı çevrilişi | hafif |
| Kilitle / kilidi aç | `kilit_kapa` / `kilit_ac` | hafif |
| Deneyim al | `deneyim`: yükselen kristal çınlaması | hafif |
| Seviye atlama | `seviye`: 3 notalık yükselen akor + hücre açılma sesi | başarı |
| Sürükleme başı | `tut`: kısa "fıs" | hafif |
| Yuvaya yapışma | `yapis`: çok kısa tık | hafif |
| Kaynaştır dolumu başladı | `kaynas_dolum`: 0,5 sn yükselen parıltı | — |
| Kaynaştır hazır | `kaynas_hazir`: tek çan | orta |
| Bırak: taşı / yer değiştir | `kon_tas` / `degis` | hafif |
| Geçersiz bırakma | `geri_kay`: aşağı kayan ses | hata |
| Satış | `sat`: sikkeler avuca dökülür | orta |
| Geri al | `geri_al`: ters ses | hafif |
| Kaynaşma onayı | `kaynasma`: alçalan uğultu + patlama + koro "ah" | güçlü |
| Yeni melez keşfi | `kesif`: kısa fanfar | başarı |
| ★2 birleşme | `yildiz2`: 2 vuruş + parıltı | başarı |
| ★3 birleşme | `yildiz3`: 3 vuruş + taç fanfarı | güçlü + başarı |
| Soy eşiği açıldı | `soy_<id>`: soyun element sesi (Od alev, Su damla, Ayaz buz kırılması, Gök rüzgâr, Yer taş, Karanlık derin vuruş, Dev gümbürtü, Avcı yay teli, Bilge çan, Çevik pençe); 3. eşikte aynı ses + yankı | hafif (3. eşik: orta) |
| Soy eşiği kaybedildi | `soy_kayip`: aynı sesin boğuk hâli | — |
| Bileşen takma | `esya_tak`: metal tık | hafif |
| Tam eşya oluştu | `esya_tam`: örs vuruşu + parıltı | orta |
| Ganimet küresi rafa iner | `ganimet`: cam çınlaması | hafif |
| Rakip önizleme basılı tut | `hayalet_ac`: mor fısıltı | hafif |
| Bilgi kartı aç | `kart_ac`: kâğıt hışırtısı | — |
| Hazırlık son 5 sn | `sure_tik` (her saniye, perdesi giderek yükselir) | son saniyede hafif |
| Kut Armağanı açılışı | `armagan_ac`: 3 kartın çan dizisi (kademeye göre: Kıvılcım tek, Alev iki, Yıldız üç çan) | orta |
| Armağan seçimi | `armagan_sec`: sıcak "vuuş" + parıltı | başarı |
| Kervan açılışı | `kervan`: uzak çanlar ve tekerlek | hafif |
| Alamet açılışı | `alamet_<id>` (12 ayrı; ör. Kan Ayı derin davul, Sis rüzgâr, Tipi uğultu, Kut Yağmuru çanlar, Pazar sikke, Tutulma alçak drone, Yaz ağustos böceği, Durgun Gök kuş, Kut Sessizliği sessizlik + tek nefes) | orta |
| SAVAŞA / sayaç bitti | `savas_basla`: kısa savaş borusu (0,6 sn) | orta |
| Rakip tahtası beliriyor | `isik_sutun` (sütun başına, perdesi yükselir) | hafif × birim sayısı |
| "SAVAŞ!" yazısı | `savas_gong`: gong | güçlü |
| Vuruş (yakın) | `vur_<boy>`: hafif, orta, ağır (yaratık boyuna göre) | — |
| Vuruş (menzilli) | `atis_<tür>`: ok, büyü, taş | — |
| Yetenek | `yetenek_<id>` (16 ayrı) | — |
| Kritik / büyük sayı | `kritik`: keskin çınlama | — |
| Ölüm | `olum_<boy>` | rakip ölünce hafif |
| Anka dirilişi | `dirilis`: alev patlaması + kuş çığlığı | orta |
| Gün Batımı başladı | `gun_batimi`: alçalan korna + müzikte tempo artışı | orta |
| KUT kipi aç | `kut_mod`: zaman yavaşlama "vuuum"; müzik alçak geçiren süzgece girer | orta |
| KUT ver | `kut`: gökten inen çan + ışık sütunu | güçlü |
| Kut Yankısı | `yanki_<bilesen>`: kısa, bileşene özgü tını, sırayla | hafif × yankı |
| Zafer (tur) | `tur_zafer`: kısa fanfar | başarı |
| Yenilgi (tur) | `tur_yenilgi`: alçalan iki nota | hata |
| Can kaybı (oklar satıra varınca) | `can_kayip`: kalp vuruşu | güçlü |
| Lobide sıra değişimi | `sira`: kısa kaydırma | — |
| Başka oyuncu elendi | `elendi`: uzak çan | — |
| Son Üç / Final Düellosu | `son_uc` / `final`: davul rulosu | güçlü |
| Oyuncu elendi | `ben_elendim`: yumuşak kapanış akoru | hata |
| Maç sonu: 1. sıra | `mac_birinci`: 4 sn zafer marşı | başarı |
| Maç sonu: 2–4 (Kürsü) | `mac_kursu`: kısa marş | başarı |
| Maç sonu: 5–8 | `mac_bitti`: sakin kapanış | — |
| Kupa sayacı | `sayac`: her artışta tık, 1 sn | — |

**Müzik:**

| An | Müzik |
|---|---|
| Ana ekran | sakin gün batımı teması, 90 BPM |
| Hazırlık | aynı temanın düşünceli düzenlemesi, yalnız telliler ve rüzgâr |
| Savaş | vurmalılar eklenir, 120 BPM; geçiş 1,6 sn'lik SAVAŞA geçişiyle eş zamanlı |
| Gün Batımı | tempo +%8 ve alçak bir dron |
| Final Düellosu | gerilim katmanı |

Müzik kültürden bağımsızdır: belli bir ülkenin çalgısı ya da makamı öne çıkmaz.

---

## 11. Öğretici bağlantıları

Sıra `OYNANIS_DERINLIK.md` §10.9'dan gelir. Her adım tek bir parlayan hedef ve tek cümlelik bir bantla anlatılır; ekranın geri kalanı %60 kararır.

1. **1-1:** "Bir kahramana dokun: satın al" → "Tahtaya sürükle" → savaş. 4. saniyede zaman durur: "KUT'a bas, sonra kahramanına dokun".
2. **1-2:** yıldız birleşmesi. Dükkânda üçüncü kopya çıkar: "★2 olur" rozetine işaret.
3. **1-3:** "Bu bileşeni bir kahramanın üstüne sürükle". Sonuç baloncuğu gösterilir.
4. **2-1:** Kut Armağanı kartlarında "Neden seç?" satırına işaret.
5. **2-2:** "Sıradaki rakibi görmek için bu kartı basılı tut". Hayalet tahta belirir.
6. **2-4:** Kervan.
7. **İlk fırsatta kaynaştırma:** "Birini ötekinin üstünde tut". Onay kartı açılır; bu ilk kaynaştırma ücretsizdir.

Satış, faiz, seri ve seviye yazıyla değil, ilk karşılaşıldıklarında çıkan tek seferlik baloncuklarla anlatılır.

---

## 12. Motor, oynanış belgesi ve Hızlı Maç

- **Hiçbir arayüz kararı motoru değiştirmez.** Sürükleme, hücre, Kut zamanı, Kut kipi yavaşlaması ve tekrar izleme, mevcut motor girdileriyle yapılır:
  - takım dizisi `{h, s, f, x, y}`;
  - tohum ve alamet;
  - Kut kaydı `(taraf, i, t)`.
- **Kural değişiklikleri** (4×3 tahta koordinatı, eşyalar, Kut Yankısı, armağanlar, Gün Batımı, 2 Kut hakkı) `OYNANIS_DERINLIK.md` §12'de tanımlıdır. Hepsi `sim.js` ile `kut/unity/Kod/KutSavas.cs`'e aynı anda yapılmalı, ardından eşdeğerlik testi (`test/esdeger_uret.cjs`) yeniden geçmelidir.
- **Arayüzün motordan beklediği ek bilgiler** (yeni Fx olayları; hepsi oynanış belgesinde var):
  - `kutYanki`: eşya simgelerini sırayla parlatmak için;
  - Gün Batımı çarpanı: süre kutusundaki hap için. Arayüz `t`'den kendisi de hesaplayabilir.
- **Hızlı Maç'ta gizlenen ya da değişen öğeler:**
  - lobi yerine sağda tek rakip kartı ve kendi canın (5 kalp) görünür;
  - üst şeritteki bölüm haritasının yerini "Tur 6" ve zafer elmasları (7) alır;
  - seviye bloğu "Takım sınırı 5 · Tur 7'de 6" bilgisine döner ve Deneyim düğmesi gizlenir;
  - faiz boncukları, seri hapı ve eşya rafı gizlenir;
  - tahta 4×3 kalır, sınır 6 kahramandır.
  - Gizlenen bloğun yerini kartlar esneyerek doldurur; yerleşim kaymaz.

---

## 13. Unity uygulama notları

- **Canvas'lar:**

  | Canvas | Kip | Sıralama | İçerik |
  |---|---|---|---|
  | `HUD` | Screen Space – Camera | 10 | ekran HUD'u |
  | `SahneYazilari` | Screen Space – Overlay | 5 | dünya noktalarına bağlı yazılar |
  | `Pencereler` | Overlay | 20 | bilgi kartı, onay kartı, armağan, duraklatma |
  | `Uyari` | Overlay | 100 | dikey uyarı |

- **Giriş:** Input System, `EnhancedTouch`.
  - `SurukleYoneticisi` tek parmak durum makinesini yürütür (§4.2).
  - 3D seçim `Physics.Raycast` ile yapılır (yaratık, hücre, kaide ve ganimet katmanları).
  - UI'ya düşen dokunuş önce `EventSystem.IsPointerOverGameObject` ile ayıklanır.
- **Ölçek:** `KutOlcek.cs`, §3.1 formülünü her `Screen.width/height` ya da `safeArea` değişiminde uygular. `genis` ve `kompakt` için iki `RectTransform` önayarı (anchor, pivot, boyut) tutar ve geçişte uygular. Hesap yalnız değişimde yapılır, her karede değil.
- **Kamera:** iki `CinemachineCamera` (Hazirlik, Savas). Geçişte 0,9 sn'lik EaseInOut blend kullanılır; sapma salınımı blend sırasında elle eklenen bir eğridir. Yatay FOV kuralı (§2.2) iki kameraya bir eklentiyle uygulanır.
- **Yaratık üstü çubuklar:** 16 birime kadar tek bir UGUI Canvas yeter. Birim başına ayrı Canvas açılmaz (yeniden çizim maliyeti). Eşya şeridi ve madalyon dünya uzayında sprite billboard'dur.
- **Sesler:** `KutSes.cs`, olay adını `AudioClip[]` dizisine eşler (çeşitleme için 2–3 sürüm); §10'daki adlar anahtardır. Dokunsal: iOS'ta yerel eklenti, Android'de `VibrationEffect.createPredefined`.
- **Doğrulama:** Game görünümünde 1280×800, 1024×768, 960×940 ve 2732×2048 ön ayarları kurulur. Her biri maketteki `shot_*.png` ile yan yana karşılaştırılır.

---

## 14. Maket ve görüntüler

- `tasarim/v2/index.html`: tek dosya, bağımlılıksız. Ölçek ve düzen kuralları (§3) JavaScript'te aynen uygulanmıştır; pencere boyunu değiştirince geniş/kompakt geçişi ve dikey uyarı görülür.
- Tahta konumları `OYNANIS_DERINLIK.md` §9 koordinatlarından hesaplanır (`poz()` işlevi).
- Görüntüler `tasarim/v2/shot_*.png`: 8 ekran durumu × 3 boy.
  - Durumlar: `hazirlik`, `hazirlik-bilgi`, `hazirlik-surukle`, `hazirlik-kaynas`, `hazirlik-armagan`, `savas`, `ana`, `son`.
  - Boylar: `1280x800`, `1024x768`, `960x940`.
- **Maketin sınırları:**
  - Tahta düz bir görsel. Kamera geçişi, hayalet rakip, yaratık animasyonları ve ses yok; bunlar §2, §6 ve §10'daki sayılarla tanımlı.
  - Gözcü paneli, Kervan, tarif çarkı, profil, koleksiyon ve ayarlar yalnız metinle tanımlı.
