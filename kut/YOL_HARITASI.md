# Kut Arena: yol haritası (prototipten asıl oyuna)

Bu belge iki soruyu yanıtlar: tarayıcıdaki **prototip** ile Unity'deki **asıl oyun** arasında ne fark var, ve oraya hangi sırayla gidilir. Kurallar `OYNANIS_DERINLIK.md`'de, ekranlar `ARAYUZ_V2.md`'de, öğretici ve metinler `OGRETICI.md`'dedir. Bu belge yeni kural koymaz, yalnız işi sıraya dizer.

**Değişmeyen üç ilke**

- Savaş motoru belirlenimcidir. Her kural değişikliği `sim.js` ve `unity/Kod/KutSavas.cs` içinde birlikte yapılır, eşdeğerlik testi %100 geçer. JS motoru Unity'ye geçince de atılmaz: sunucudaki doğrulama (Aşama 8) onu Node'da çalıştırır.
- Kural ve denge önce **prototipte** sınanır, çünkü orada değişiklik dakikalar sürer ve 10.000 lobilik benzetim Node'da koşar. Görsel kalite, his ve performans **doğrudan Unity'de** yapılır; prototipte bunlara emek harcanmaz.
- Kopya yok: türün genel mekanikleri kullanılır, hiçbir oyunun adı, sanatı ya da birebir arayüzü alınmaz. İmzalarımız (KUT, KAYNAŞTIRMA, rakibi önceden görme, ALAMET) her aşamada öne çıkar.

---

## 1. Prototip ile asıl oyun arasındaki farklar

Oynanış, arayüz ve açıklayıcılık farkları üç belgenin 0. bölümlerinde tablo hâlinde duruyor (`OYNANIS_DERINLIK.md` §0, `ARAYUZ_V2.md` §0, `OGRETICI.md` §0). Aşağıdaki tablo üretim tarafını özetler.

| Konu | Prototip (tarayıcı, claude.ai görüntüleyicisi) | Asıl oyun (Unity) |
|---|---|---|
| **Görüntüleme hattı** | three.js, tek ışık, hafif bloom; hazırlık 2D panel, savaş ayrı 3D ekran | Unity 6 URP, tek 3D sahne (ada), iki Cinemachine kamerası. HDR, tonemapping (ACES), Bloom, Color Adjustments, Vignette. Her alamet ve Gün Batımı için ayrı **Volume profili**; ağırlık eğriyle karışır (ör. Gün Batımı 1,5 sn'de 0 → 1). |
| **Gölgelendiriciler** | three.js hazır malzemeleri | Shader Graph ile: kahraman (URP Lit + kenar ışığı + Tripo dokusundan emisyon maskesi + ölümde çözülme), **hayalet** (mor fresnel, alfa 0,55: rakip önizleme), seçim dış çizgisi, yuva plakası (kesikli halka, kaynaştırma dolumu 0→360° parametreli), su/şelale (kayan doku), gökyüzü (degrade + alamet rengi), ganimet küresi. |
| **Efektler** | `web/vfx.js`'te basit parçacıklar | Unity **Particle System** (Shuriken) + Shader Graph. VFX Graph kullanılmaz: çoğu Android tablette (GLES3) çalışmaz, iki ayrı yol bakımı istemez. Kut ışık sütunu, Kut Yankısı tınıları, kaynaşma spirali, ★ birleşme, 16 yetenek, 10 soy eşiği, alamet atmosferleri (Tipi karı, Sis zemin sisi). Hız için bir ya da iki **Asset Store efekt paketi** taban alınır ve renkleri bizim palete çekilir (öneri: Cartoon FX Remaster, Epic Toon FX ya da Hovl Studio serisinden biri; satın alma kullanıcıda, standart Asset Store lisansı oyunda kullanıma izin verir). UI animasyonu için DOTween (ücretsiz). |
| **Modeller** | glb, tek LOD | Tripo FBX, 4K kaynak doku; LOD0 (~55 bin üçgen) ve LOD1 (~18 bin, UnityMeshSimplifier). ASTC sıkıştırma. Eksik: 8 canavar, Kervan kaidesi, kürsü. |
| **Animasyon** | UAL glTF (CC0), dört ayaklılar kodla | UAL FBX Humanoid + AnimatorOverrideController (`ANIMASYON_PLANI.md` §6). Dört ayaklı ve yılan kodla (`DortAyakliHareket.cs`). Ek kaynaklar: Tripo'nun kendi animasyonları, Mixamo (insan iskeletli yaratıklar için, oyunda kullanım serbest). Yeni gereken: kaynaşma kalkışı, Kervan yürüyüşü, kürsü sevinci, canavar saldırıları. |
| **Ses ve müzik** | `web/ses/` içinde 34 ElevenLabs efekti, müzik yok | `ARAYUZ_V2.md` §10'daki ~55 olay, her biri 2–3 çeşitleme; OGG, 48 kHz. Müzik 5 katman (ana, hazırlık, savaş, Gün Batımı, final), akışla çalınır. iOS/Android dokunsal geri bildirim yerel eklentiyle. |
| **Arayüz sanatı** | CSS, emoji, portre PNG'leri | UGUI + TextMeshPro. Raster parçalar ChatGPT'den (`ARAYUZ_TASARIM.md` §7'deki 12 parça + aşağıdaki yeni liste), 9-slice, 2×. Tek renk simgeler SVG'den atlas. |
| **Çevrimiçi** | `online.js`: yerel hayalet havuzu + bot; `KUT_UZAK` boş | Firebase: anonim hesap + Apple/Google bağlama, Firestore iz havuzu `iz/{surum}_{kupaKovasi}/maclar/{macId}` (`OYNANIS_DERINLIK.md` §4.7), kupa ve sezon, Remote Config (denge sayıları), Analytics (`OGRETICI.md` §9.2 ölçümleri), Crashlytics. Kupa yalnız Cloud Function'da yazılır. |
| **Hile karşıtı** | yok | Cloud Function maç izini denetler: her turun kadro bedeli o tura kadar kazanılabilecek altını aşamaz, seviye eğrisi aşılamaz, havuz sınırı aşılamaz. Şüpheli iz havuza girmez. Belirlenimci motor sayesinde istenen savaş Node'da yeniden oynatılabilir. |
| **Sezon** | yok | 8 haftalık sezon. Lig: Bronz 0 · Gümüş 400 · Altın 1000 · Gök 1800 · Kut 2800 kupa (öneri). Sezon sonu kupa 1000'in üstündeyse `1000 + (kupa − 1000) / 2`. Ödüller yalnız görünüş. Her sezon 2 kahraman, 1 alamet, 5 armağan (`TASARIM.md` §7). |
| **Performans** | masaüstü tarayıcı, tek kalite | Üç kademe, ilk açılışta 3 sn'lik ölçümle seçilir (aşağıda). |
| **Dağıtım** | claude.ai artifact bağlantısı | Google Play (AAB) ve App Store (IPA). Yalnız yatay, tablet öncelikli. |

### 1.1 Performans kademeleri

| Ayar | Düşük | Orta | Yüksek |
|---|---|---|---|
| Örnek cihaz sınıfı | 3–4 GB RAM Android tablet | iPad 9. nesil, orta Android | iPad Air M1 ve üstü, üst Android |
| Kare hızı | 30 | 60 | 60 |
| Çözünürlük ölçeği | 0,75 | 0,9 | 1,0 |
| Model | LOD1 her yerde | tahtada LOD0, yedekte LOD1 | LOD0 |
| Doku | 1024 | 2048 | 2048 |
| Gölge | damla gölge (decal) | 1 kademe, 1024, sert | 1 kademe, 2048, yumuşak |
| Bloom | kapalı | yarım çözünürlük | tam |
| MSAA | yok | 2× | 4× |
| Parçacık bütçesi (aynı anda) | 300 | 800 | 1 500 |
| Cam panel bulanıklığı | yok, %86 düz dolgu | yok | açık |

Bütçe (Orta, savaş, 16 birim): ≤ 150 çizim çağrısı (SRP Batcher), ≤ 450 bin üçgen ekranda, ≤ 900 MB bellek. "Grafik kalitesi düşürülmez" kuralı Yüksek kademe için geçerlidir; düşük kademeler ayrı kopya (LOD) ile yapılır, orijinal modele dokunulmaz.

### 1.2 Kullanıcıdan gelecek varlıklar (toplu liste)

| Tür | Araç | Adet | Ne zaman |
|---|---|---|---|
| Bileşen simgeleri | ChatGPT | 8 (tek sayfa) | Aşama 4 |
| Tam eşya simgeleri | ChatGPT | 36 (3 sayfa × 12) + 3 özel | Aşama 4 |
| Armağan simgeleri | ChatGPT | 20, çıkışa kadar 45–60 | Aşama 4, sonra sezonla |
| Alamet simgeleri | ChatGPT | 12 (eski 8 + 4 yeni) | Aşama 4 |
| Lig rozetleri, avatar çerçeveleri | ChatGPT | 5 + 6 | Aşama 8 |
| Eski listedeki UI parçaları | ChatGPT | 12 (`ARAYUZ_TASARIM.md` §7) | Aşama 4 |
| Uygulama simgesi, mağaza görselleri | ChatGPT + Unity ekran görüntüsü | 1 + 1 öne çıkan görsel + 6–8 ekran | Aşama 10 |
| Canavar modelleri | ChatGPT konsept → Tripo | 8 | Aşama 4 |
| Sahne nesneleri | Tripo | Kervan kaidesi, kürsü | Aşama 4 |
| Dört ayaklı animasyonlar (varsa) | Tripo | isteğe bağlı | Aşama 5 |
| Ses efektleri | ElevenLabs | ~30 yeni (UI, soy eşikleri, alametler, maç sonu) | Aşama 4 |
| Müzik | müzik üreticisi (ör. ElevenLabs Music; bağlı ElevenLabs bağlayıcısında müzik kapalı, tam sürüm gerekir) | 5 döngü | Aşama 4 |
| Yeni kahramanlar (K4, K5) | ChatGPT → Tripo | ~12 | Aşama 9'a kadar |

Simgelerde kural: yazı gömülmez, saydam PNG, 2×, `GORSEL_REHBERI.md`'deki ortak tarz bloğu her komutun başına eklenir. Kredi harcayan üretimleri kullanıcı yapar; Claude komutları yazar ve sonucu yerleştirir.

---

## 2. Aşamalar

Süreler kabadır: kullanıcının yarı zamanlı katıldığı ve kodu Claude'un yazdığı bir tempo için verilmiştir. Toplam ≈ 6–7 ay.

| # | Aşama | Nerede | Süre | Kullanıcıdan |
|---|---|---|---|---|
| 0 | Tasarım belgeleri | belge | bitti | – |
| 1 | **Motor ve veri çekirdeği**: 4×3 tahta, eşyalar, YG, Kut Yankısı, Kut hakkı, Gün Batımı, canavar yetenekleri, armağanların savaş kancaları, bilgi sayaçları | prototip (JS + C#) | 2 hafta | Yok. İki küçük karar (bölüm 3.5) |
| 2 | **Maç mantığı ve denge**: seviye, birikimli ekonomi, havuz, eşya rafı, canavar turları, ganimet, 8 kişilik lobi, Yansıma, hasar, Kut Armağanı, Kervan, yeni alametler, bot izi; 10.000 lobilik benzetim | prototip | 2 hafta | Yok |
| 3 | **Oynanır prototip v2**: mevcut three.js sahnesinde tek sahne hazırlık ve savaş, sürükle-bırak, kaynaştırma bekletmesi, rakip hayaleti, KUT kipi, bilgi kartları, savaş özeti, Çıraklık Maçı, İlk kez kartları, ipuçları, düzeltilmiş metinler. Görsel sade kalır. | prototip | 3 hafta | Tablette oynayıp yazmak; 3–5 kişiye Çıraklık'ı oynatmak |
| – | **Karar kapısı**: eğlence ve anlaşılırlık | – | – | 5 deneme oyuncusunun en az 4'ü Çıraklık'ı yardımsız bitirir ve bir Arena maçını sonuna kadar oynar. Değilse Aşama 3'e dönülür, Unity'ye geçilmez. |
| 4 | **Varlık üretimi** (Aşama 3 ile paralel başlar) | kullanıcı + Claude | 3–4 hafta | Bölüm 1.2'deki liste |
| 5 | **Unity temeli**: proje, URP, klasör yapısı, motor kodları, `MacYoneticisi`/`KutLobi` C# karşılıkları, sahne, kamera, 16 model + animator, fx olaylarından savaş oynatma | doğrudan Unity | 3 hafta | Unity'nin kurulu olduğu bilgisayarda Claude oturumu; Tripo zip'leri |
| 6 | **Unity arayüzü ve öğretici**: `ARAYUZ_V2.md`'nin bütün ekranları, `KutOlcek`, giriş durum makinesi, menüler, Kodeks, Çıraklık | doğrudan Unity | 4 hafta | Ekran görüntülerine onay |
| 7 | **Grafik ve his**: gölgelendiriciler, son işlem, alamet ışıkları, efekt paketleri, geçiş zaman çizelgeleri, ses ve müzik bağlama, dokunsal | doğrudan Unity | 3 hafta | Efekt paketi satın alma kararı; görsel onaylar |
| 8 | **Çevrimiçi**: Firebase hesap, iz havuzu, Cloud Function doğrulama, kupa, lig, sezon, Remote Config, Analytics, Crashlytics | Unity + Firebase | 3 hafta | Firebase projesi (sahiplik kullanıcıda), Apple ve Google geliştirici hesapları |
| 9 | **Performans, cihaz testi, kadro büyütme**: kademeler, profil, 3 cihazda test; 5 kademe ve ~28 kahraman (`OYNANIS_DERINLIK.md` §2.4) | Unity (kural kısmı önce prototipte) | 3 hafta | 2–3 test cihazı; 12 yeni model |
| 10 | **Yayın**: iç test (TestFlight, Play iç test), kapalı beta, yumuşak çıkış (2–3 ülke), mağaza sayfası, gizlilik politikası, yaş derecelendirme | Unity + mağazalar | 3 hafta + inceleme | Mağaza hesapları (Apple yıllık, Google tek sefer ücret), gizlilik metni onayı, mağaza görselleri |

### 2.1 Hangi iş nerede denenir

- **Prototipte**: bütün kurallar ve sayılar; eşleşme, hasar, ekonomi eğrileri; öğretici adımlarının sırası ve metinleri; bilgi kartı içeriği; ipucu kuralları. Ölçüt test ve benzetimdir.
- **Doğrudan Unity'de**: gölgelendirici, son işlem, efekt, animasyon karıştırma, kamera geçişi ve salınımı, ses ve müzik katmanları, dokunsal, performans, mağaza paketi, hesaplar.
- **İkisinde birden**: motor (eşdeğerlik testi), lobi ve maç mantığı (Unity'de C# karşılığı yazılınca JS ile aynı tohumdan aynı lobiyi kurduğu bir test eklenir).

### 2.2 Aşama sonu ölçütleri

| Aşama | Bitti sayılması için |
|---|---|
| 1 | Eşdeğerlik ≥ 1 000 savaşta %100; her tam eşyanın tek tek tarandığı denge raporu; Hızlı Maç ve mevcut testler bozulmadan geçer |
| 2 | `lobi.test.cjs` `OYNANIS_DERINLIK.md` §11'deki 11 hedefin en az 9'unu tutturur; tutmayanlar için önerilen sayı değişikliği yazılı |
| 3 | `ogretici.test.cjs` geçer; Playwright 13 adımın görüntüsünü alır; karar kapısı |
| 5 | Unity'de iki takım dövüşür ve sonuç JS motoruyla aynıdır |
| 6 | 1280×800, 1024×768, 960×940 ve 2732×2048'de makette ile yan yana karşılaştırma |
| 7 | Orta kademede 60 fps savaş; her olayın sesi var |
| 8 | Yabancı bir cihazdan oynanan maçın izi lobide hayalet olarak görünür; kupa sunucuda yazılır |
| 10 | Yumuşak çıkışta Çıraklık bitirme ≥ %85, çökmesiz oturum ≥ %99,5 |

---

## 3. Aşama 1: ayrıntılı iş listesi (sıradaki adım)

Amaç: savaş motorunu asıl oyunun bütün kurallarına göre **bir kez** genişletmek ve eşdeğerliği bir kez yeniden kurmak. Böylece Aşama 2 ve 3 motora dokunmadan ilerler. Maç mantığı (`web/oyun.js`) bu aşamada yalnız Hızlı Maç'ı çalışır tutacak kadar değişir.

Kaynak bölümler: `OYNANIS_DERINLIK.md` §5, §7, §9, §12.1, §12.2, §12.6; `OGRETICI.md` §7.2, §7.3, §8.1, §8.2.

### 3.1 Veri (`data.js` → `KutVeri.cs`)

1. `KURAL`'a asıl oyun alanlarını ekle (`OYNANIS_DERINLIK.md` §12.1 listesinin tamamı). Bugünkü tura bağlı alanları `KURAL.hizli` altına taşı; Hızlı Maç'ın her okuması oraya bakar.
2. `BILESENLER` (8), `ESYALAR` (36 + Söküm Taşı, Kut Taşı, Soy Mührü), `CANAVARLAR` (8), `PVE_DALGA`, `ARMAGANLAR` (20; `savas: true` olanlar motor kancası alır), 4 yeni alamet ve `w` ağırlık alanı.
3. Açıklayıcılık alanları (`OGRETICI.md` §8.1): yetenek ve pasiflere `sablon`/`olcek`/`sabit`, kahramana `kisa` ve `rol`, soya `kapsam` ve `karsi`, eşyaya `kimIcin`, alamete `kisisel`. Yetenek `ayaz`'ın görünen adı "Kırağı Dalgası".
4. `kahraman(id)` canavarları da bulur (`kademe: 0`, `soy: []`).
5. `tools/csharp_veri.cjs`'i yeni tabloları yazacak şekilde genişlet; `KutVeri.cs`'i yeniden üret.

### 3.2 Motor (`sim.js` → `KutSavas.cs`, aynı gün ikisi birden)

1. **Konum**: 4×3 tahta (`x = 0,75 + 1,5·b.x`; taraf 0 için `y = [5,6,7][b.y]`, taraf 1 için `[3,2,1][b.y]`).
2. **Takım birimi `e`** (0–3 eşya) ve `birimStat`'ın eşya istatistiklerini toplaması; `azalt ≤ 0,4`, yankı dahil ≤ 0,75.
3. **Yetenek gücü**: `c = kc × (1 + yg) × kutCarpan`; süreler ölçeklenmez.
4. **36 eşya kancası** `OYNANIS_DERINLIK.md` §12.2'deki işlev listesine göre: savaş başı, `enYakin`, `hizCarpan`, `hasar`, `vurusEtki`, vuruş manası, `yetenek` sonrası kancalar (`vurulan[]` yeniden düzenlemesiyle), mana eşiği, `olum`, saniyelik.
5. **Yeni durumlar**: `zorla`, `hedefAlinmaz`, `dokunulmaz`, `cosku`, `canRuzgar`, `geceKanat`, `yankiTuy`, `yankiKabuk`, `yankiPul`.
6. **Gün Batımı**: `opt.gunBatimi` (20; Uzun Gölge'de 12), çarpan bütün hasar türlerinde.
7. **Kut**: `kutKalan[]`, `sonKutT[]`, `opt.kutHak`, `opt.kutYok`; Kut Yankısı sabit sırayla; `kutYanki` fx olayı; `kutVar`, `kutKalanSay`; Kut Mirası, Uyanış, Işık Sütunu, Çifte Kut 4 sn kuralı; `kutYZ` puanı ve ikinci hak 12. sn.
8. **Armağan savaş etkileri**: `opt.armagan`, `opt.kaynasCarpan`, `opt.karsiHamle` (Son Direniş, Kızıl Gök Çocuğu, Kusursuz Melez, Karşı Hamle).
9. **Canavar**: `opt.pve`, mana 9999, dört yeni yetenek `case`'i.
10. **`bitir`**: `kalanPuan` ve `kalanSayi`.
11. **Bilgi alanları** (sonucu değiştirmez, `OGRETICI.md` §8.2): zaman içi hasarın kaynağı (`k` yalnız fx ve sayaçta), `hasar` fx'ine `e`/`y`/`k`, `emildi` olayı, `olum`/`kac`/`iyi`/`kalkan` fx'lerine `k`, `yetenek` fx'ine `hedefler`, birim sayaçları `ist`, `kut` fx'ine `mp` ve `sersem`, `hedef` olayı.
12. Belirlenimcilik kuralları: `R()` eklenmez; döngüler birim sırasıyla; `1.25^n` tekrarlı çarpmayla; yuvarlama `floor(x + 0,5)`; C#'ta `OrderBy`.

### 3.3 Prototipi çalışır tutmak (`web/oyun.js`, `online.js`, `web/arayuz.js`)

1. `takim()` 4×3 koordinat üretir; Hızlı Maç'ta sınır 6 kahraman, tahta 12 hücre, yedek 7.
2. `online.js`: `yerlestir` 4×3 kuralına (`OYNANIS_DERINLIK.md` §12.3), `KUT2-` kodu eşyayı taşır, `KUT1-` kodları çözülmeye devam eder.
3. `web/arayuz.js`: mevcut 2D tahta ızgarası 4×3'e genişler; başka arayüz işi yapılmaz (o Aşama 3'te).
4. `OGRETICI.md` §7.1–7.4 metin düzeltmeleri prototipte hemen uygulanır (en ucuz kazanç): soy metinleri kapsamla, yetenek ve pasif metinleri (§7.3), IPUCU tablosu, ad değişiklikleri.

### 3.4 Testler

1. `test/esdeger_uret.cjs`: en az 1 000 savaş; eşyalı, armağanlı, canavarlı, Gün Batımı'na giden, çift Kut'lu, Kut Sessizliği'li ve Uzun Gölge'li savaşlar ayrı kümeler hâlinde. `cd kut/unity/Test && dotnet run` %100. Yeni sayaçların (`ist`) JS ve C# toplamları da karşılaştırılır.
2. `test/sim.test.cjs`: 4×3 tahtaya geçiş; her tam eşyanın taşıyıcı kazanma oranı taraması (hedef ortalamanın ±%5'i, rapor olarak); Gün Batımı ile süre sınırına kalan savaş oranı (< %5); savaş süresi ortanca 16–20 sn.
3. `test/oyun.test.cjs` ve `test/oyun_mantik.test.mjs` Hızlı Maç'ta değişmeden geçer.
4. Kısa `test/metin.test.cjs`: "Yankı" yalnız "Kut Yankısı" içinde, armağan kademesinde "Yıldız" yok, şablon alanları dolu.

### 3.5 Kullanıcı kararları (beklemeden varsayılanla ilerlenir)

- **6. soy eşiği**: varsayılan, Aşama 1'de veriye eklenmez; Aşama 2 benzetimi 8 kişilik takımlarda gerekip gerekmediğini gösterir.
- **Yer bütün takıma, Gök yalnız kendine** (`OGRETICI.md` §7.2): varsayılan, bugünkü davranış korunur ve metinler bunu doğru anlatır.

### 3.6 Aşama 1'de yapılmayanlar

Lobi, ekonomi, seviye, dükkân olasılıkları, havuz, raf, Armağan seçimi ve Kervan ekranları (Aşama 2 ve 3); her türlü görsel cila (Unity).

---

## 4. Belgeler arası düzenleme kaydı

Bu yol haritası yazılırken üç belge arasındaki çelişkiler giderildi:

- **Kural kaynağı ve öncelik**: kuralda `OYNANIS_DERINLIK.md`, ekranda `ARAYUZ_V2.md`, metin ve öğreticide `OGRETICI.md`. Üç belgenin başında aynı cümle var.
- **Öğretici**: `OYNANIS_DERINLIK.md` §10.9 ve `ARAYUZ_V2.md` §11'deki eski 1-1…2-4 sırası kaldırıldı; tek öğretici Çıraklık Maçı ve İlk kez kartları.
- **Öğretici adımları yeni arayüze uyduruldu**: kaynaştırma artık sürükle ve 500 ms tut, rakip önizleme basılı tutma ve kısa dokunuş, Kut "madalyonu" değil KUT düğmesi, eşya rafı ve Deneyim Al'ın yerleri `ARAYUZ_V2.md`'ye göre, ayrı "Seçili kahraman" paneli yok.
- **Satın alınan kahramanın gideceği yer** tanımlandı: birleşme varsa kopyanın yerine, tahtada yer varsa ilk boş ön hücreye, yoksa yedeğe (`ARAYUZ_V2.md` §4.5). Öğreticinin 1. ve 2. adımları buna dayanıyor.
- **Ekonomi ve arayüz**: "+N sonraki tur" tahmininin formülü, sıradaki alametin altını, Kervan turu ve bölüm 1'de faiz olmaması altın bloğuna yazıldı. "Kaybedersen ~N can" için sonucu sızdırmayan belirlenimci formül eklendi (`OYNANIS_DERINLIK.md` §10.7).
- **Adlar**: armağan kademesi Güneş, lobi kopyası Yansıma, düğmenin adı Deneyim Al, eşik 2/4/6 (6 veri gelene kadar koşullu).
- **Kut kipi**: 0,35 hız ve 3 sn zaman aşımı; kestirmeler çift dokunuş ve sürükleme; "Tek dokunuşla Kut" ayarı Ayarlar'a eklendi; Kut ipucu `OGRETICI.md` H10 kuralına bağlandı.
- **Kodeks**: alt çubuğun Koleksiyon ve Rehber düğmeleri aynı 11 sekmeli Kodeks'i farklı sekmede açar. Tarif tablosu 8×8 (başlıklarla 9×9).
- **Okunurluk**: uçan sayı renkleri ve durum simgeleri `OGRETICI.md`'den, boyları `ARAYUZ_V2.md`'den; 3× hız yok; en küçük yazı 13 px.
- Süre hedefleri tek değere çekildi: birinci 18–20 dk, erken elenen 12–15 dk.
- `UNITY_DEVIR.md` §0 bu belgeye ve yeni üç belgeye yönlendiriyor.

Maket (`tasarim/v2/index.html`) Kodeks'i ve armağan rozetlerini çizmiyor, bu yüzden düzenlemeler maketle çelişmiyor. Belge ile maket ayrışırsa Unity'de belge geçerlidir.
