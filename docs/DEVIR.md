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
| `www/index.html`, `www/style.css`, `www/sw.js` | Kabuk. Yeni kural dosyası eklenince `index.html`'e `<script>` satırı ve `sw.js` önbellek listesine girdi eklenir. |
| `tools/hakem.cjs` | Test robotu (Playwright). `tools/hakem/*.cjs` kural testlerini K bölümünde yükler. |
| `.claude/workflows/hakem.js` | 4 kişilik yapay zekâ jürisi iş akışı ("tur bitti" deyince) |
| `docs/BOLUM_TASARIMI.md` | Zorluk merdiveni, kurallar, ekonomi, temalar, sandık, sefer şeridi |
| `docs/kurallar/` | Eklenti sözleşmesi (`README.md`) ve her kuralın tasarım belgesi |
| `.github/workflows/apk.yml` | Test APK'sı, yalnız elle çalışır. `gh workflow run apk.yml` normal sürümü, `-f unlocked=true` "her şey açık" sürümü üretir (ayrı uygulama: Ray Test). |
| `.github/workflows/web.yml` | Pages yayını. Pages açık olmadığından şimdilik yalnız elle çalışır; yayın hazırlığında push tetikleyicisi geri açılacak. |
| `.github/workflows/hakem.yml` | Robotu CI'da koşar |

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
- Son kararlı commit `b157a91`, robot 174/174.
- Süre/hamle sınırları kısıldı. Mevcut 6 kurala zorluk payı eklendi:
  - makas 1,5
  - köprü 2
  - tabela 1,5
  - tabla 2
  - halka 1,5
  - tünel 1
- Yeni zorluk merdiveni: M8 12,3 → M9 14,6, M11 16,3, M13 16,8, M15 17,6, M17 17,8, M19 17,6.
- **Süren iş:** çift hatlara (M10, M12, M14, M16, M18, M20) gerçekten zorluk katan 6 yeni kural tasarlanıyor (kullanıcının isteği: "yeni kurallar zorluk katmalı"). Ölçümle en çok zorluk katan adaylar gizli bilgi türünden:
  - kapalı durak (+5,0)
  - gizli depo (+4,3)
  - silik kol (+3,1)
<!-- DURUM:SON -->

## 6. Sıradaki işler

1. Çift hatlar için 6 zor kuralı bitir (eklenti, test, belge). Her biri robotta geçmeli. `docs/BOLUM_TASARIMI.md` §5 güncellenmeli.
2. Kullanıcı "APK çıkar" derse normal ve her şey açık APK'ları derle.
3. Kullanıcı "tur bitti" derse jüriyi çalıştır.
4. Yayın hazırlığı (en son):
   - gerçek AdMob kimlikleri ve UMP onayı
   - gizlilik metni
   - imzalı AAB
   - mağaza sayfası
   - Pages'i açıp `web.yml` push tetikleyicisini geri getirmek
