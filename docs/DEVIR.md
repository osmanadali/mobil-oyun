# Devir notu: Ray

Bu not, işi yeni bir sohbete taşırken bağlam kaybolmasın diye yazıldı. Yeni oturum işe başlamadan önce bu notu, `docs/BOLUM_TASARIMI.md` dosyasını ve `docs/kurallar/README.md` dosyasını okumalı.

## 1. Proje

**Ray**, tek elle ve internetsiz oynanan sakin bir metro bulmacasıdır. Türü Net/Pipes'tır: karoya dokununca karo 90° döner, bütün duraklar merkeze bağlanınca ve açık uç kalmayınca bölüm biter.

- Teknoloji: vanilla JS PWA (`www/`) ve Capacitor Android (`android/`).
- Depo `osmanadali/mobil-oyun`, dal `main`.
- Bölümler tohumlu ve yordamsal olarak üretilir. Bölüm verisi saklanmaz: `generate()` çözümden bir yayılan ağaç kurar, karıştırır, sonra kuralları uygular.
- Hatlar M1'den M20'ye kadar gider, sonrası sınırsız karma hattır. Her tek hat bir kural öğretir.
  - M3 sabit, M4 eşli, M5 ters, M6 karanlık tünel, M7 sayaçlı, M8 iki merkez.
  - M9 makas, M11 köprü, M13 yön tabelası, M15 döner tabla, M17 halka, M19 tünel ağzı.
- Çift hatlar (M10, M12, …, M20) şu an karmadır. Her bölüm, öğrenilmiş kurallardan 1–2 tanesini taşır (`rulesFor`).

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
| `www/rules/*.js` | M9 sonrası kural eklentileri (`window.RAY_RULES`) |
| `www/i18n.js`, `docs/CEVIRI.md` | Türkçe/İngilizce: `L(tr, en)`, cihaz diline göre seçim, Ayarlar › Dil; sözlük ve yazım ilkeleri |
| `www/ads.js`, `www/shop.js`, `www/gizlilik.html` | Reklam (UMP rızası, ATT), reklamsız paket (Play + App Store), gizlilik politikası |
| `www/index.html`, `www/style.css`, `www/sw.js` | Kabuk. Yeni kural dosyası eklenince `index.html`'e `<script>` satırı ve `sw.js` önbellek listesine girdi eklenir. |
| `tools/hakem.cjs` | Test robotu (Playwright). `tools/hakem/*.cjs` kural testlerini K bölümünde yükler. |
| `.claude/workflows/hakem.js` | 4 kişilik yapay zekâ jürisi iş akışı ("tur bitti" deyince) |
| `docs/BOLUM_TASARIMI.md` | Zorluk merdiveni, kurallar, ekonomi, temalar, sandık, sefer şeridi |
| `docs/kurallar/` | Eklenti sözleşmesi (`README.md`) ve her kuralın tasarım belgesi |
| `.github/workflows/apk.yml` | Test APK'sı, yalnız elle çalışır. `gh workflow run apk.yml` normal sürümü, `-f unlocked=true` "her şey açık" sürümü üretir (ayrı uygulama: Ray Test). |
| `.github/workflows/web.yml` | Pages yayını. Pages açık olmadığından şimdilik yalnız elle çalışır; yayın hazırlığında push tetikleyicisi geri açılacak. |
| `.github/workflows/hakem.yml` | Robotu CI'da koşar |
| `.github/workflows/release.yml` | İmzalı AAB + APK (yalnız elle; imza gizli değerleri ve AdMob değişkenleri gerekir) |
| `.github/workflows/ios.yml` | iOS simülatör derlemesi (imzasız, elle) |
| `tools/ikon.cjs`, `tools/make-assets.cjs` | Uygulama ikonu ("Gece Işığı"; eski "R" `rIconR` olarak durur) ve bütün ikon/açılış/mağaza görselleri |
| `tools/store-shots.cjs`, `store/` | Mağaza ekran görüntüleri, öne çıkan görsel, mağaza ikonları |
| `docs/MAGAZA.md`, `docs/YAYIN.md`, `docs/KALITE.md` | Mağaza metinleri ve formlar · yayın adımları · kalite raporu |

APK indirme linkleri (sabit):

- `https://github.com/osmanadali/mobil-oyun/releases/download/test/ray-test.apk`
- `https://github.com/osmanadali/mobil-oyun/releases/download/test-acik/ray-test-acik.apk`

## 4. Önemli ilkeler

- **Eski bölümler bit bit aynı kalır.** 1–208. bölümlerin ve Günün Hattı'nın üretimi değişmemeli. Bir eklenti rastgele sayıyı yalnız kendi miktarı sıfırdan farklıyken tüketir.
- **Zorluk puanı:** `difficulty()` = dalga + 3·(düğüm−1) + 10·(1−ilk/n). `pick()` hedef puana en yakın adayı seçer: hedef = (tanıtım?3:5) + 11z + (final?2:0) + Σboost.
- **Kural zorluk payı (`boost`):** Her eklentide bir `boost` alanı vardır. Kuralın kendi hattındaki ilk 3 bölüm dışında hedefe eklenir. Böylece kurallı bölümler gerçekten daha zor tabanlardan seçilir.
- **Süre ve hamle sınırları (`limits()`):**
  - Hamle sınırı = par + par·(0,6…0,75)·sıkılık.
  - Süre sınırı = dokunuş·1,3 + n·0,5 + 3·max(0, zorluk−8) saniye.
- **Yarım oyun imzası:** hash(çözüm + başlangıç dizilimi). Üretim değişirse eski yarım oyunlar kendiliğinden düşer.

## 5. Durum

<!-- DURUM:BAŞ -->
Durum 28 Ekim 2026 sabahı itibarıyla:

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

**Kullanıcının yapacakları (mağaza):** ayrıntı `docs/MAGAZA.md` §12 ve `docs/YAYIN.md` içinde.

1. **Hesaplar:** Play Console (25 $) ve Apple Developer (99 $/yıl).
   - Kişisel Play hesabında üretimden önce 12 testçiyle 14 gün kapalı test şartı var.
2. **AdMob:** Android ve iOS uygulamaları, 4 reklam birimi, AB/BK ve ABD rıza mesajları.
   - Kimlikler GitHub değişkenlerine girilir: `ADMOB_APP_ID_ANDROID`, `ADMOB_INTERSTITIAL_ANDROID`, `ADMOB_REWARDED_ANDROID`; iOS karşılıkları `ADMOB_APP_ID_IOS`, `ADMOB_INTERSTITIAL_IOS`, `ADMOB_REWARDED_IOS` **iOS yayınında zorunlu** (`ios-release.yml` eksik ya da test kimliği görürse durur).
3. **İmza anahtarı:** `keytool` ile üretilir ve yedeklenir. Dört gizli değer GitHub'a girilir: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
4. **Gizlilik politikası:** `www/gizlilik.html` içindeki `[iletişim e-postası]` ve `[geliştirici adı]` doldurulur.
5. **GitHub Pages:** açılmalı (gizlilik adresi bunu bekliyor). `web.yml` push tetikleyicisi geri getirilir.
6. **Mağaza ürünü ve formlar:** `ray_reklamsiz` ürünü iki mağazada tanımlanır, formlar doldurulur, metin ve görseller yüklenir.

**Geliştirme (öneriler, `docs/KALITE.md` §3):**

- Birkaç 7×9 karma bölümün üretimi telefonda 1–2 sn sürebiliyor (nehir/bölge + kapak/kapalı durak). Ana ekranda sıradaki bölüm boşta önceden hazırlanıyor; kalıcı çözüm üretimi Web Worker'a taşımak.
- 320 px ekranda karolar 39 px kalıyor.
- Ekran okuyucu desteği sınırlı.
- Anlatıcıya "Geç" bağlantısı eklenebilir.
- `index.html` meta/og açıklamaları ve `manifest.json` adı yalnız Türkçe (web paylaşım önizlemesi; mağazayı etkilemez).

**Kalıcı kurallar geçerli:**

- APK yalnız "APK çıkar" denince derlenir.
- Jüri yalnız "tur bitti" denince çalışır.
