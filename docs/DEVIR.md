# Devir notu: Ray

Bu not, işi yeni bir sohbete taşırken bağlam kaybolmasın diye yazıldı. Yeni oturum işe başlamadan önce bu notu, `docs/BOLUM_TASARIMI.md` dosyasını ve `docs/kurallar/README.md` dosyasını okumalı.

## 1. Proje

**Ray**, tek elle ve internetsiz oynanan sakin bir metro bulmacasıdır. Türü Net/Pipes'tır: karoya dokununca karo 90° döner, bütün duraklar merkeze bağlanınca ve açık uç kalmayınca bölüm biter.

- Teknoloji: vanilla JS PWA (`www/`) ve Capacitor Android (`android/`).
- Depo `osmanadali/mobil-oyun`, dal `main`.
- Bölümler tohumlu ve yordamsal olarak üretilir. Bölüm verisi saklanmaz: `generate()` çözümden bir yayılan ağaç kurar, karıştırır, sonra kuralları uygular.
- Hat boyu 12, 16, 20, 24, sonra hep 28 bölüm (`LINE_MAX`). M3'ten M26'ya her hat bir kural öğretir (24 kural; M26 661. bölümde başlar), M27 ve sonrası sınırsız karmadır (`KARMA = 26`): her bölüm öğrenilmiş kurallardan 1–2 tanesini taşır (`rulesFor`).
  - Sıra (3 Kasım; göze çarpan/kolay önce, gizli bilgili/ince sona; sabit karo kalktı): M3 eşli · M4 ters · M5 kayan sıra · M6 karanlık tünel · M7 sayaçlı · M8 soğuyan karo · M9 iki merkez · M10 makas · M11 🔒 mühürlü karo · M12 döner tabla · M13 köprü · M14 bakım karosu · M15 kapak · M16 tünel ağzı · M17 tabela · M18 halka · M19 silik kol · M20 gizli depo · M21 🌐 sarmal tahta · M22 nehir · M23 kapalı durak · M24 tarife bölgesi · M25 ⏳ son sefer · M26 ↕ kayan sütun.
  - Tablo ve formüller: `docs/BOLUM_TASARIMI.md` §2 ve §5.

## 2. Kullanıcıyla çalışma kuralları (kalıcı)

- **Sohbet dili:** kısa ve öz Türkçe. Kullanıcı `/anthropic-skills:caveman ultra` ile "mağara adamı" üslubunu istedi. Belgeler ise normal Türkçe düzyazıyla yazılır.
- **Ürün kararları:**
  - Grafik kalitesi düşürülmez.
  - Günlük reklam sınırı konmaz.
  - Kural kartları sade tutulur, menüler kalabalıklaşmaz.
- **Ne zaman ne yapılır:**
  - APK yalnız kullanıcı **"APK çıkar"** deyince derlenir.
  - Jüri (hakem iş akışı) yalnız **"tur bitti"** denince çalışır.
  - Yayın hazırlığı en sona bırakılır.
- **Robot tam geçmeli:** `node tools/hakem.cjs` komutu her birleştirmeden önce bütün testleri geçmeli.
- **Onay gerekenler:**
  - Dışa dönük işlemler (Pages'i açmak gibi) önce sorulur.
  - ElevenLabs gibi kredi harcayan üretimler önce sorulur.
- **Commit ve PR:** kullanıcı istemedikçe PR açılmaz. Commit mesajlarına model adı yazılmaz.
- **Kişisel bilgi:** kullanıcının e-postası ilgisiz servislere gönderilmez.
- **Paralel çalışma:** kullanıcı, işi paralel ilerletmek için iç içe oturumları (`create_session`) sever. Her hattın işi ayrı oturumda, ayrı dalda yürür, sonra sırayla `main`e birleştirilir.

## 3. Depo düzeni

| Yol | İçerik |
|---|---|
| `www/game.js` | Çekirdek: üretim, çözücü (`difficulty`), çizim, ekonomi, sandık, temalar, sefer şeridi |
| `www/rules/*.js` | Çekirdek dışındaki kural eklentileri (`window.RAY_RULES`; hattı `line`, kanca sırası `ord`) |
| `www/i18n.js`, `docs/CEVIRI.md` | Türkçe/İngilizce: `L(tr, en)`, cihaz diline göre seçim, Ayarlar › Dil; sözlük ve yazım ilkeleri |
| `www/ads.js`, `www/shop.js`, `www/gizlilik.html` | Reklam (UMP rızası, ATT), mağaza ürünleri (Play + App Store), gizlilik politikası |
| `www/index.html`, `www/style.css`, `www/sw.js` | Kabuk. Yeni kural dosyası eklenince `index.html`'e `<script>` satırı ve `sw.js` önbellek listesine girdi eklenir. |
| `tools/hakem.cjs` | Test robotu (Playwright). `tools/hakem/*.cjs` kural testlerini K bölümünde yükler. |
| `.claude/workflows/hakem.js` | 4 kişilik yapay zekâ jürisi iş akışı ("tur bitti" deyince) |
| `docs/BOLUM_TASARIMI.md` | Zorluk merdiveni, kurallar, ekonomi, temalar, sandık, sefer şeridi |
| `docs/kurallar/` | Eklenti sözleşmesi (`README.md`) ve her kuralın tasarım belgesi |
| `.github/workflows/apk.yml` | Test APK'sı, yalnız elle çalışır. `gh workflow run apk.yml` normal sürümü (ayrı uygulama: Ray Dev, `com.osmanadali.ray.dev`), `-f unlocked=true` "her şey açık" sürümü üretir (ayrı uygulama: Ray Test). Mağaza sürümüyle aynı paket adını taşımaz. |
| `.github/workflows/web.yml` | Pages yayını. Pages açık olmadığından şimdilik yalnız elle çalışır; yayın hazırlığında push tetikleyicisi geri açılacak. |
| `.github/workflows/hakem.yml` | Robotu CI'da koşar |
| `.github/workflows/release.yml` | İmzalı AAB + APK (yalnız elle; imza gizli değerleri ve AdMob değişkenleri gerekir) |
| `.github/workflows/ios.yml` | iOS simülatör derlemesi (imzasız, elle); 6 dilin paketlerini denetler |
| `.github/workflows/ios-release.yml` | İmzalı iOS arşivi + App Store Connect yüklemesi (yalnız elle; Apple gizli değerleri ve iOS AdMob değişkenleri gerekir, test reklam kimliği görürse durur) |
| `tools/ikon.cjs`, `tools/make-assets.cjs` | Uygulama ikonu ("Gece Işığı"; eski "R" `rIconR` olarak durur) ve bütün ikon/açılış/mağaza görselleri |
| `tools/store-shots.cjs`, `store/` | Mağaza ekran görüntüleri, öne çıkan görsel, mağaza ikonları |
| `docs/MAGAZA.md`, `docs/YAYIN.md`, `docs/KALITE.md` | Mağaza metinleri ve formlar · yayın adımları · kalite raporu |

APK indirme linkleri (sabit):

- `https://github.com/osmanadali/mobil-oyun/releases/download/test/ray-test.apk`
- `https://github.com/osmanadali/mobil-oyun/releases/download/test-acik/ray-test-acik.apk`

## 4. Önemli ilkeler

- **Eski bölümler bit bit aynı kalır.** Bir kural eklenince ondan önceki hatların ve Günün Hattı'nın üretimi değişmemeli (31 Ekim hat düzeniyle 101+ bilerek yeniden üretildi; 1–100 aynı). Bir eklenti rastgele sayıyı yalnız kendi miktarı sıfırdan farklıyken tüketir.
- **Zorluk puanı:** `difficulty()` = dalga + 3·(düğüm−1) + 10·(1−ilk/n). `pick()` hedef puana en yakın adayı seçer: hedef = (tanıtım?3:5) + 11z + (final?2:0) + Σboost.
- **Kural zorluk payı (`boost`):** Her eklentide bir `boost` alanı vardır. Kuralın kendi hattındaki ilk 3 bölüm dışında hedefe eklenir. Böylece kurallı bölümler gerçekten daha zor tabanlardan seçilir.
- **Süre ve hamle sınırları (`limits()`):**
  - Hamle sınırı = par + max(2, par·(0,3…0,4)·sıkılık) → par × 1,3–1,4 (31 Ekim'de %25 sıkılaştı).
  - Süre sınırı = max(11, ¾·(dokunuş·1,3 + n·0,5 + 3·max(0, zorluk−8))) saniye. Kıl payı: en çok 4 sn rötar, 2 hamle.
- **Yarım oyun imzası:** hash(çözüm + başlangıç dizilimi). Üretim değişirse eski yarım oyunlar kendiliğinden düşer.

## 5. Durum

<!-- DURUM:BAŞ -->
- **Kullanıcı testi (3 Kasım):** açılış animasyonu uygulama ikonunun işaretiyle (L ray + yanan kare merkez); uzun pencerelerde köşede ✕ ve en üstteyken aşağı çekme kaydırmayla karışmıyor (touchmove); görev penceresi ☀️ günlük (3 görev: ör. 5 bölüm, 3 kusursuz, 3 ipucusuz; her biri +1 💡, üçü +1 🎫) ve 📅 haftalık (15–40 bölüm, 6–20 kusursuz…; her biri +1 🎫 + ödül, üçü +2 🎫); turuncu düğmede bilet bakiyesi yok.
Durum 3 Kasım 2026 itibarıyla (en yeni madde başta):

- **Ana sayfa: can çipi ve can penceresi (3 Kasım, `altigen` dalı, kullanıcı isteği):** 🔥 seri Günün Hattı kartının içine (sağda, ayrı dokunulur); sol üst çipte ❤️ can + dolarken geri sayım (Oyna'nın alt satırındaki can kalktı). 0 canda ya da son can gidince ekranın ortasında pencere (duraklatma menüsü gibi): ❤️‍🩹 "Canın bitti", büyük "Yenilenmesine mm:ss", ▶ video +1 ❤️, 🛒 mağaza, can gelince Oyna (`lifePop`; eski `lifeSheet` kalktı). Robot `--only=can`.
- **⬡ Altıgen gün denemesi (3 Kasım, `altigen` dalı):** cumartesi Günün Hattı sivri tepeli altıgen karolu büyük altıgen tahtada (zorluk dalgasına göre 3 halka 37 karo / 4 halka 61 karo), her dokunuş 60°; kural aynı, kuralsız gün. Motor `www/altigen.js` (`window.RAY_HEX`: üretim, zorluk çözücüsü, lit, çizim, dokunma isabeti, `plan`), `game.js`'te yalnız `G.hex` dallanmaları. İlk karşılaşmada kısa kart (`save.seen.hex`), ana sayfa/arşiv/paylaşımda ⬡. Seri, 🎫, görev, ipucu, yarım oyun, hedefler aynı. Pazartesi–cuma ve pazar bit bit aynı; eski kare cumartesi `dailyBase`'te. Beğenilirse hatlara yayılacak. Ayrıntı `docs/kurallar/altigen.md`, BOLUM_TASARIMI §6; robot `--only=altigen`. Bilinen sınır: 320 px'te 4 halkada karo 30 px.
- **Özel teklif + Firebase Analytics (3 Kasım, `gelir-2` dalı):** kazanma sonrası seyrek "Özel teklif" penceresi (48 saatte bir; ilk 2 gün ve ilk 15 bölüm yok; Günün Hattı/zen yok; geçiş reklamıyla aynı turda yok; reklamsız sahibine reklamsız teklifi yok), yeni tüketilebilir ürün 🎁 Başlangıç paketi `ray_baslangic` (10 💡, 2'şer güçlendirici, ❤️∞ 1 saat, 20 🎫; 2,99 $). Ölçüm `www/olcum.js` (`window.Olcum.event`), `@capacitor-firebase/analytics` 8.5.2, CI gizli değerleri `FIREBASE_ANDROID_JSON`/`FIREBASE_IOS_PLIST` (yoksa eklenti çıkarılır, ölçüm kapalı), rıza "temel" mod (UMP rıza gerektirmiyorsa açık; AEA/BK/ABD eyalet mesajında kapalı), olay tablosu YAYIN §5.4. Robot `--only=gelir-2`.
- **❤️ Can sistemi (3 Kasım, `can` dalı):** yıldız süresi aynı; üstüne son süre = yıldız süresi + 20 sn (4 Kasım; önce max(2×, +60 sn)). Dolunca "🚉 Son tren kaçtı", 1 ❤️ gider (en çok 5, 6 dk'da 1 dolar (7 Kasım; önce 30 dk), zaman damgasıyla). 0 canda bölüm başlamaz: geri sayım + ödüllü video +1 ❤️. ❤️∞ (`save.infUntil`) varken can gitmez. Günün Hattı, arşiv, zen muaf. ⏱ +15 son süreyi de uzatır. Ana sayfada yalnız Oyna alt satırı. Ölçüm `life_lost`, `life_refill_ad`. Ayrıntı BOLUM_TASARIMI §9; robot `--only=can`.
- **Mağaza (31 Ekim, `gelir-olcum` dalı):** Ayarlar › **Mağaza** tek pencere: Reklamsız paket, Tema paketi (`ray_temalar`, tüketilemez), 10/30/80 ipucu, Güçlendirici paketi (her birinden 3), Bilet paketi (`ray_bilet_50`, 50 🎫; tüketilebilir; ürünler ve fiyatlar MAGAZA §10). Tüketilebilirde ödül kayda yazılır, sonra işlem bitirilir; işlem kimliğiyle tekrar ödül yok. Satın alınan bilet ayrı sayılır (`bCrowns`/`bSpent`), yalnız temaya; sandık yalnız kazanılanla (`chestBal`). Robot: `--only=gelir-olcum`. **Salıya kalanlar:** Firebase Analytics (hazır kod `0536e22` commit'inde duruyor: `git show 0536e22 --stat`; `www/olcum.js`, `tools/olcum-hazirla.cjs`, `@capacitor-firebase/analytics` 8.5.2, ads.js/game.js/shop.js olay çağrıları, CI gizli değerleri `FIREBASE_ANDROID_JSON`/`FIREBASE_IOS_PLIST`, YAYIN §5 rıza kararı ve olay tablosu, gizlilik ve MAGAZA §6–§7 Firebase metinleri, robot ölçüm testleri; eklenecek olaylar: life_lost, life_refill_ad, offer_shown, offer_buy) ve özel teklif penceresi.
- **Meta katmanı (31 Ekim, `meta` dalı):** Ayarlar › 🍃 Zen modu (`save.zen`; hedefler gizli, bitiş 3 ★, 🎫 ve ✨ yok; Günün Hattı etkilenmez) ve 6 mevsim teması (kış, erguvan, yaz, hazan, iki bayram; mevsiminde ücretsiz, sonra sahibinde kalır; bayram tablosu 2026–2035). Şehir haritası ve rozetler salıya kaldı (tasarım BOLUM_TASARIMI §10 sonunda, kod `564893d`). Robot `--only=meta`.
- **🎫 Bilet, haftalık görev, arşiv, haftanın kuralı (31 Ekim):** 👑 taç para birimi 🎫 bilet olarak yeniden adlandırıldı (kayıtta `crowns`/`crownBal` adları kaldı; haritada kusursuz bölüm 🎫). Her pazartesi 3 haftalık görev (basamağa göre miktar, herkeste aynı tohum), ödül 🎫 + 💡/❤️∞ sınırsız can; Günün Hattı'nı bitirmek +1 🎫 (kusursuzsa +1 daha); seri penceresinden son 30 günün Günün Hattı arşivi (gün başına 3 🎫, seriyi etkilemez); sandığa ❤️∞ 15/30 dk eklendi (`save.infUntil`, can sistemi `can` dalında); pazar Günün Hattı haftanın kuralını taşır (öteki günler bit bit aynı). Ana sayfada yalnız Günün Hattı kartının altında ince bir görev satırı. Ayrıntı BOLUM_TASARIMI §6, §8; robot `--only=gunluk-gorev`. Robotun `solve()` yardımcısı açık kural kartını önce kapatır. Mağaza görselleri yeni metinle yeniden üretilmeli (birleştirmede).
- **Hedefler %25 sıkı (31 Ekim, `hat-yapisi`):** ↻ hamle hedefi par × 1,3–1,4 (en az +2), ⏱ süre hedefi × ¾ (en az 11 sn), kıl payı 4 sn. Hat boyu tavanı (28) ve yeni kural sırası hazırlandı, salıya (3 Kasım) bırakıldı: hazır hâli `hat-yapisi` geçmişinde 8a88d20 commit'inde (testler kurala göre yazılmış: `AT('fog')`, `RL`, `seenTo`; boost ayarı; eklentilerde `ord`).
- **Kurallar 3 (3 Kasım, `kurallar-3`):** ⏳ **son sefer** (`last`, M25, `www/rules/son-sefer.js`): saatli durak sayılı hamlede bağlanmazsa ↻ yıldızı söner, oyun sürer. ↕ **kayan sütun** (`column`, M26, `www/rules/kayan-sutun.js`): kayan sıranın dikeyi, onunla aynı bölümde gelmez. İkisi de sona eklendi (1–632 bit bit aynı, karma 689'dan; `KARMA = 26`, karma payı +3 → +3,5). Çekirdeğe küçük kancalar: `fin` üretim aşaması, `prio` (ipucu ve robot sırası), `scan` (kendi hattında aday sayısı), `G.mLost` (↻ yıldızını eklenti söndürür; `miss[l][1] = −1`). Merdiven M24 20,1 < M25 20,5 < M26 20,9. Gerekçe BOLUM_TASARIMI §2.
- **Hat yapısı 2 (3 Kasım, `hat-yapisi-2`):** 8a88d20'deki hazır iş uyarlandı ve genişletildi. Hat boyu 28'de durur (`lineLen = min(12 + 4c, 28)`). 🔩 **Sabit karo kuralı tamamen kalktı** (oyunu kolaylaştırıyordu): kart, `RULE_LINE.pins`, haftanın kuralı listesi ve robot testi çıktı; `pinned` çekirdekte hep boş durur. İki yeni kural geldi: 🔒 **mühürlü karo** (`seal`, M11, `www/rules/muhurlu-karo.js`) ve 🌐 **sarmal tahta** (`wrap`, M21, `www/rules/sarmal-tahta.js`; tünel ağzının `C.adj/C.ao` altyapısıyla). Kural sırası README tablosunda (22 kural, `KARMA = 24`). Merdiven kesintisiz kalsın diye boost'lar ayarlandı: sarmal 3,5, silik kol 3,5, nehir ve kapalı durak 4, tarife bölgesi 5 (M1 5,6 → M24 20,1). Testler kurala göre yazılı (`AT`, `RL`, `seenTo`); 29. bölümden sonraki bütün parmak izleri kasıtlı olarak yenilendi. Hedefler %25 sıkı kaldı (↻ par × 1,3–1,4, ⏱ × ¾, kıl payı 4 sn).
- **Mağaza (31 Ekim, `gelir-olcum` dalı):** Ayarlar › **Mağaza** tek pencere: Reklamsız paket, Tema paketi (`ray_temalar`, tüketilemez), 10/30/80 ipucu, Güçlendirici paketi (her birinden 3), Bilet paketi (`ray_bilet_50`, 50 🎫; tüketilebilir; ürünler ve fiyatlar MAGAZA §10). Tüketilebilirde ödül kayda yazılır, sonra işlem bitirilir; işlem kimliğiyle tekrar ödül yok. Satın alınan bilet ayrı sayılır (`bCrowns`/`bSpent`), yalnız temaya; sandık yalnız kazanılanla (`chestBal`). Robot: `--only=gelir-olcum`. **Salıya kalanlar:** Firebase Analytics (hazır kod `0536e22` commit'inde duruyor: `git show 0536e22 --stat`; `www/olcum.js`, `tools/olcum-hazirla.cjs`, `@capacitor-firebase/analytics` 8.5.2, ads.js/game.js/shop.js olay çağrıları, CI gizli değerleri `FIREBASE_ANDROID_JSON`/`FIREBASE_IOS_PLIST`, YAYIN §5 rıza kararı ve olay tablosu, gizlilik ve MAGAZA §6–§7 Firebase metinleri, robot ölçüm testleri; eklenecek olaylar: life_lost, life_refill_ad, offer_shown, offer_buy) ve özel teklif penceresi.
- **Meta katmanı (31 Ekim, `meta` dalı):** Ayarlar › 🍃 Zen modu (`save.zen`; hedefler gizli, bitiş 3 ★, 🎫 ve ✨ yok; Günün Hattı etkilenmez) ve 6 mevsim teması (kış, erguvan, yaz, hazan, iki bayram; mevsiminde ücretsiz, sonra sahibinde kalır; bayram tablosu 2026–2035). Robot `--only=meta`.
- **Şehir haritası ve rozetler (3 Kasım, `meta-2` dalı):** ana sayfa logosu ya da Hatlar başlığındaki simge → Şehir · Rozetler. Biten hat semt yakar (ad `lineName`, renk `lineCol`), hepsi kusursuzsa altın; 24 semtlik halkalı şehirler, sonra yeni şehir sayfası; hat sınırları yalnız `lineStart/lineEnd/lineOf`. 15 yerel rozet (ödülsüz, küçük bildirim; kural ustası `RULE_LINE`'dan). Ayrıntı BOLUM_TASARIMI §10; robot `--only=meta-2`.
- **🎫 Bilet, haftalık görev, arşiv, haftanın kuralı (31 Ekim):** 👑 taç para birimi 🎫 bilet olarak yeniden adlandırıldı (kayıtta `crowns`/`crownBal` adları kaldı; haritada kusursuz bölüm 🎫). Her pazartesi 3 haftalık görev (basamağa göre miktar, herkeste aynı tohum), ödül 🎫 + 💡/❤️∞ sınırsız can; Günün Hattı'nı bitirmek +1 🎫 (kusursuzsa +1 daha); seri penceresinden son 30 günün Günün Hattı arşivi (gün başına 3 🎫, seriyi etkilemez); sandığa ❤️∞ 15/30 dk eklendi (`save.infUntil`, can sistemi hat-yapisi'nde); pazar Günün Hattı haftanın kuralını taşır (öteki günler bit bit aynı). Ana sayfada yalnız Günün Hattı kartının altında ince bir görev satırı. Ayrıntı BOLUM_TASARIMI §6, §8; robot `--only=gunluk-gorev`. Robotun `solve()` yardımcısı açık kural kartını önce kapatır. Mağaza görselleri yeni metinle yeniden üretilmeli (birleştirmede).

- **Yeni kurallar M21–M23 (31 Ekim):** ❄ soğuyan karo (`ice`), ⚙ bakım karosu (`gear`, her 2 hamlede bir kendi döner; ilke 4 kullanıcı kararıyla gevşetildi), ↔ kayan sıra (`slide`). Karma hatlar artık M24'ten (`KARMA = 23`). Çekirdeğe üç küçük kanca: `after(…, moved)`, `undo`, `plan`. Belgeler: `docs/kurallar/`.
- **Güçlendiriciler (31 Ekim):** sandıktan 🔄 ek tur, 🔦 fener, ⏱ +15 sn, ↶ geri al çıkar; yalnız işe yaradığı an alt çubukta belirir (BOLUM_TASARIMI › Sürpriz sandık). Sandıkta ipucu payı %60'tan %38'e indi. Robotta tek dosya: `node tools/hakem.cjs --only=guclendirici` (birleştirmeden önce tam koşu yine şart).
- **Tasarım turu 2 (31 Ekim):** oyunda tek süre (kalan süre şeritte, çipte yalnız yıldızlar), oyun başlığında ⚡% yok; 💎 parça birimi kalktı (3 yeni taçta +1 ipucu, sayaç gösterilmez); "Nasıl oynanır?" Ayarlar'a taşındı; ana sayfa logosu uygulama ikonunun işareti; renk temalarında sıradaki tema renkli ve ilerleme çubuğu ızgaranın üstünde; mağaza puanı (`@capacitor-community/in-app-review` 8.0.0, 12. bölümden sonra 3 ★'lı bir bitişte bir kez, sonra 60 gün + 40 bölüm); Ayarlar › İlerlemeyi taşı (RAY1 kodu; reklamsız paket kodla taşınmaz); "Bize yaz" satırı `SUPPORT_MAIL` doldurulunca görünür (gizlilik.html İletişim'deki yer tutucularla birlikte doldurulmalı); ikinci merkezin hattı kesik açık çizgili, merkezi halkalı (renk körlüğü); 7×9 hatlarında kısa bölüm (`short`).
- **Eleştiri turu (28 Ekim gecesi):** mola bölümleri (`breath`, her hattın 6./12./18.… bölümü kısa ve kolay); oyun ekranında ayrı "%" çubuğu kalktı, sefer şeridinin rayı bağlantıyla yanar; bölüm bitince arkaplan şehir haritası parlar ve bir tren geçer (`cityUp`); ana sayfa hat kartında toplam ★ yerine sıradaki hatta kalan ★, ızgara boyu kalktı; mağaza görsellerinde ilk sıra oynanış (`01-oyun`).

- **18 kural, 20 hat tamam.** Çift hatların zor kuralları eklendi:

  | Hat | Kural | Anahtar |
  |---|---|---|
  | M10 | Kapak | `cover` |
  | M12 | Silik kol | `faint` |
  | M14 | Gizli depo | `depot` |
  | M16 | Kapalı durak | `closed` |
  | M18 | Nehir | `river` |
  | M20 | Tarife bölgesi | `zone` |

  - Hepsi gizli bilgi ya da küresel sayım üzerine kurulu ve ölçümle zorluk katıyor: 7×9'da +3 ile +8 arası.
  - Çekirdek kancaları: `cands`, `open` (+ `L.openBy`), `prune`, `P.void`, `P.self`, `P.reject`, `api.difficulty(P, leaf, cap)`.
- **Zorluk merdiveni (hat ortalaması):** M8 12,3 · M10 16,3 · M12 17,8 · M14 19,0 · M16 19,5 · M18 20,8 · M20 20,5 · M21+ ~19,6–20.
  - M21 ve sonrasında kurallar eşit sıklıkta gelir ve hedefe +2 pay eklenir.
  - 1–252. bölümler ve Günün Hattı değişmedi.
- **Uygulama ikonu "Gece Işığı" (28 Ekim):** halkalı duraktan çıkan turuncu L ray, içinden yanan kare merkeze varıyor. 5 konsept + 3 hakemle seçildi, kullanıcı onayladı. Kaynak `tools/ikon.cjs` (`rIcon`); `node tools/make-assets.cjs` Android adaptif ikonu (ön plan ölçeği 0,70, bütün maskelerde güvenli), açılış ekranı, PWA ve mağaza ikonlarını, `node tools/store-shots.cjs feature` / `en feature` öne çıkan görselleri üretir. Kullanıcının ilk "R" tasarımı `rIconR` olarak duruyor (mağazada ikon A/B testi için).
- **Mağaza hazırlığı:**
  - Capacitor 8, hedef API 36, kenardan kenara ekran.
  - UMP rızası, iOS izleme izni (ATT), gizlilik politikası (`www/gizlilik.html`) ve "Verilerimi sil".
  - İmzalı AAB iş akışı (`release.yml`) ve iOS simülatör derlemesi (`ios.yml`); satın alma iOS'ta da çalışıyor.
  - Mağaza metinleri ve formlar (`docs/MAGAZA.md`), ekran görüntüleri ve öne çıkan görsel (`store/`), yayın adımları (`docs/YAYIN.md`), kalite raporu (`docs/KALITE.md`).
- **İngilizce (28 Ekim):** oyunun tamamı Türkçe ve İngilizce. Cihaz dili Türkçe ise Türkçe, değilse İngilizce açılır; Ayarlar › Dil ile değişir (sayfa yenilenir).
  - Yeni metin her zaman `L('Türkçe', 'English')` ile yazılır; terimler `docs/CEVIRI.md` sözlüğünden.
  - Robot varsayılan olarak `tr-TR` koşar; İngilizce testleri (`en.*`, `i18n.rules.*`) metin, taşma (320/360 px), dil değiştirme ve iki dilde aynı bölümü denetler.
  - İngilizce mağaza görselleri: `node tools/store-shots.cjs en` → `store/screens-en/`, `store/feature-graphic-en.png`.
- **Karanlık tünel geri kararır (28 Ekim):** görünürlük her hamlede baştan hesaplanır; bağlantı kopunca bölge 420 ms'de yeniden kararır, geri bağlanınca açılır. Bölüm üretimi değişmedi. Eklenti `reveal` kancası saf olmalı (`docs/kurallar/README.md`).
- **Hız eşiği testleri bulut makinesinde oynak:** halka/nehir üretim süresi ve nehir çizim kancası (`rule.ring.line`, `rule.river.line`, nehir 4× CPU) makine yüklüyken main'de de kalabiliyor; değişiklik üretime dokunmuyorsa önce main'le aynı makinede karşılaştır.
- Robot hepsi birlikte geçiyor (sonuç commit mesajında). APK linkleri bölüm 3'te.
<!-- DURUM:SON -->

## 6. Sıradaki işler

**Önerilen kurallar** (31 Ekim, piyasa incelemesinden; hepsi bilgi eklemez, zorlaştırır). 1 ve 2, 3 Kasım'da yapıldı (`hat-yapisi-2`); 3 ve 4 de 3 Kasım'da (`kurallar-3`); 5 yalnız not.

1. ✅ **🌐 Sarmal tahta** → M21 (`wrap`).
2. ✅ **🔒 Mühürlü karo** → M11 (`seal`).
3. ✅ **⏳ Son sefer** → M25 (`last`, 633. bölüm).
4. ✅ **↕ Kayan sütun** → M26 (`column`, 661. bölüm); kayan sırayla aynı bölümde gelmez.
5. **⬡ Altıgen bölümler** (Flow Free Hexes, Infinity Loop): 6 yönlü karo; büyük iş, ayrı sezon.

**Kullanıcının yapacakları (mağaza):** ayrıntı `docs/MAGAZA.md` §12 ve `docs/YAYIN.md` içinde.

1. **Hesaplar:** Play Console (25 $) ve Apple Developer (99 $/yıl).
   - Kişisel Play hesabında üretimden önce 12 testçiyle 14 gün kapalı test şartı var.
2. **AdMob:** Android ve iOS uygulamaları, 4 reklam birimi, AB/BK ve ABD rıza mesajları.
   - Kimlikler GitHub değişkenlerine girilir: `ADMOB_APP_ID_ANDROID`, `ADMOB_INTERSTITIAL_ANDROID`, `ADMOB_REWARDED_ANDROID`; iOS karşılıkları `ADMOB_APP_ID_IOS`, `ADMOB_INTERSTITIAL_IOS`, `ADMOB_REWARDED_IOS` **iOS yayınında zorunlu** (`ios-release.yml` eksik ya da test kimliği görürse durur). iOS kimlikleri AdMob'da açıldı ve `ios-release.yml`'de varsayılan olarak yazılı (YAYIN §3); Android kimlikleri de açıldı, `release.yml`'de varsayılan.
3. **İmza anahtarı:** `keytool` ile üretilir ve yedeklenir. Dört gizli değer GitHub'a girilir: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
4. **Gizlilik politikası:** geliştirici adı (Osman Adalı) ve destek e-postası (osmanadali.apps@gmail.com) dolduruldu (6 Kasım).
5. **GitHub Pages:** açılmalı (gizlilik adresi bunu bekliyor). `web.yml` push tetikleyicisi geri getirilir.
6. **Mağaza ürünleri ve formlar:** yedi ürün (MAGAZA §10: `ray_reklamsiz`, `ray_temalar`, `ray_ipucu_10/30/80`, `ray_guclendirici`, `ray_bilet_50`) iki mağazada tanımlanır, formlar doldurulur, metin ve görseller yüklenir.

**Geliştirme (öneriler, `docs/KALITE.md` §3):**

- Birkaç 7×9 karma bölümün üretimi telefonda 1–2 sn sürebiliyor (nehir/bölge + kapak/kapalı durak). Ana ekranda sıradaki bölüm boşta önceden hazırlanıyor; kalıcı çözüm üretimi Web Worker'a taşımak.
- 320 px ekranda karolar 39 px kalıyor.
- Ekran okuyucu desteği sınırlı.
- Anlatıcıya "Geç" bağlantısı eklenebilir.
- `index.html` meta/og açıklamaları ve `manifest.json` adı yalnız Türkçe (web paylaşım önizlemesi; mağazayı etkilemez).

**Kalıcı kurallar geçerli:**

- APK yalnız "APK çıkar" denince derlenir.
- Jüri yalnız "tur bitti" denince çalışır.
