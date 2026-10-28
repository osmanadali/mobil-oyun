# Mağaza öncesi kalite denetimi

Dal: `magaza-kalite`. Bu belge, Google Play ve App Store incelemesinden önce oyunun bir oyuncu ve bir inceleme uzmanı gözüyle denetlenmesinin sonucudur. Küçük ve güvenli sorunlar bu dalda düzeltildi; büyük ya da tartışmalı olanlar aşağıda öncelik sırasıyla listelendi.

## 1. Yöntem

- **Araç:** Playwright (Chromium, dokunmatik mobil kip). Reklam, titreşim, paylaşım ve Capacitor `App` eklentisi sahteyle taklit edildi.
- **Ekranlar:** 360×740 ve 412×915, ek olarak en küçük boy için 320×568. Açık ve koyu tema.
- **Oyuncular:** üç tür kayıtla denendi.
  - Yeni oyuncu: açılış animasyonu, anlatıcı, Bölüm 1, ilk kazanma.
  - Deneyimli oyuncu: Bölüm 61, seri, taç, ipucusuz durum.
  - Test sürümü: `__rayTest`, her şey açık.
- **Gezilen yerler (her boyda 35 ekran):** ana ekran, ilk açılış ve anlatıcı, oyun, kazanma paneli ("Hattı gör" dahil), harita, ayarlar, renk temaları, taç avı, tema satın alma, sandık ve sandık açılış sahnesi, ipucu/reklam penceresi, Günün Hattı ve sonucu, seri, seri kurtarma, kural kartı, kilitli hat, reklamsız paket.
- **Her ekranda bakılanlar:**
  - 44 px'ten küçük dokunma hedefi
  - metin taşması ve kesilmesi
  - üst üste binen düğmeler
  - WCAG kontrastı
  - konsol hatası
- **Ek denemeler:**
  - geri tuşu
  - arka plan ↔ ön plan geçişi
  - çok hızlı ve çift dokunuş
  - bildirim (toast) yazılarının genişliği
- **Başarım ölçümü:**
  - 1–1500. bölümlerin tamamının üretim süresi (`puzzleFor`)
  - hat başları M1–M25
  - Günün Hattı
  - kazanma animasyonunda kare süresi
- **Kod tabanı:** denetim, 12 kurallı en son `main` (`cf4fc0c`) üzerinde yapıldı. Dal ise kardeş dallarla aynı taban olan `94e55ba`'dan açıldı. Değişen satırlar iki tabanda da aynı olduğu için birleştirme temiz olur.

Sonuç: hiçbir ekranda konsol hatası yok. İnternetsiz açılış robotun H bölümünde geçiyor.

## 2. Bu dalda düzeltilenler

Önce/sonra görüntüsü: [`docs/kalite/once-sonra.png`](kalite/once-sonra.png). Her düzeltmenin gerileme testi `tools/hakem/magaza-kalite.cjs` dosyasındadır.

| # | Önem | Sorun (kanıt) | Çözüm | Robot |
|---|---|---|---|---|
| 1 | Yüksek | Geçiş reklamının geldiği turda "Sonraki"ye çift dokunuş bir bölüm atlatıyordu. Bölüm 5'ten 7'ye geçiliyor, 6 hiç oynanmamış kalıyordu. İkinci basış reklam yüklenirken bölümü bir kez daha başlatıyordu. | `next()` tek geçişe kilitlendi: aynı oyun için ikinci çağrı yok sayılır, reklamdan sonra oyun değişmişse başlatılmaz. | `kalite.nextDouble` |
| 2 | Yüksek | Süre yalnız `visibilitychange` olayıyla duruyordu. Capacitor WebView'de (özellikle iOS) uygulama arka plana gidince bu olay gelmeyebilir, süre akmaya devam eder ve ⏱ yıldızı haksız yere kaçar. Ayrıca kural kartı açıkken arka plandan dönülünce süre kendiliğinden akmaya başlıyordu. | Arka plan ↔ ön plan işi tek işleve (`front`) toplandı. Hem `visibilitychange` hem Capacitor `appStateChange` dinleniyor; iki olayın birden gelmesi zararsız. Kilitli pencere (kural kartı) açıkken dönüşte süre durgun kalır, "Anladım"la akar. | `kalite.background` |
| 3 | Orta | Sonuç panelinde "Günün hattı tamam!" başlığı 360–412 px'te "Günün ha…" diye kesiliyordu, yani her Günün Hattı bitişinde. 360 px'te "TEMA ALINABİLİR", "YENİ HAT AÇILDI" rozetleri "Hattı gör" düğmesinin altına giriyordu. | Başlık gerekirse iki satıra iner. 380 px ve altında yıldızlar ve düğme biraz küçülür, 340 px ve altında düğmede yalnız ok kalır. Rozet hiçbir zaman düğmeye taşmaz. 320, 360 ve 412 px'te en uzun başlık × rozet × düğme yazısı birleşimleri sığıyor. | `kalite.winHead` |
| 4 | Orta | Hat haritasında kural rozeti satır ortasında ikiye bölünüyordu ("Yeni:" bir satırda, "sabit karo" alttaki satırda, arka planı kopuk). Hem 360 hem 412 px'te oluyordu. | Rozet tek parça (`inline-block`, `nowrap`). Sığmazsa bütün olarak alt satıra iner. | `kalite.mapTag` |
| 5 | Orta | Bildirimler tek satıra zorlanıyordu. 360 px'te 5, 320 px'te 12 yazı ekrandan taşıp iki yandan kesiliyordu. Örnek: "Reklamsız paket aktif 💛 +20 ipucu · 3 özel tema açıldı". | Uzun yazı ekran genişliğinde iki satıra iner. Tek satırlık bildirimin görünüşü aynı kaldı. | `kalite.toast` |
| 6 | Orta | Bazı dokunma hedefleri 44 px'in altındaydı: ana ekrandaki 🔥 ★ 👑 çipleri 38 px, "▶ 2 katı" 23 px, "Nasıl oynanır?" 43 px. | Çiplere saydam kenar verildi: görünüş 38 px, dokunma alanı 44 px. "▶ 2 katı" görünmez bir dokunma alanıyla 45 px oldu. Metin bağlantılarına en az 44 px yükseklik verildi. Görünüşte değişiklik yok. | `kalite.chips`, `kalite.dblHit` |
| 7 | Orta | Açık temada küçük vurgu yazılarının kontrastı düşüktü: "Seçili ✓", tema fiyatları, sandık fiyatı ve taç avı yıldızları 1,97:1; "Destansı" 2,75:1, "Nadir" 3,69:1. | Açık temada bu yazılar vurgu renginin koyusuyla yazılıyor (`color-mix`), oranlar 4,7:1 oldu. Koyu temada değişiklik yok. | `kalite.lightContrast` |
| 8 | Düşük | Metin hataları vardı: <ul><li>Taç avında bakiye yetiyorken "Gün Batımı için **0** 👑 daha gerekli" yazıyordu.</li><li>Yeni oyuncu temalar penceresinde "0 bölüm kusursuz bitmeyi bekliyor" ve hiç oynamamışken "Oynadığın her bölüm kusursuz! 🎉" görüyordu.</li><li>"Sende ★ / 200" ve "kalan 👑 / 18" satır sonunda kopuyordu.</li><li>"Günün hattı" iki yerde küçük harfle yazılmıştı; özel ad olarak her yerde "Günün Hattı" olmalı.</li></ul> | <ul><li>Bakiye yetiyorsa eksik sayı yazılmıyor.</li><li>Yeni oyuncu yol gösteren bir yazı görüyor.</li><li>★ ve 👑 sayısından kopmuyor (`.nw`).</li><li>"Günün Hattı" yazımı birleştirildi.</li></ul> | `kalite.texts`, `kalite.huntNew` |

Ek olarak geri tuşu davranışı (aşağıda §4) gerileme testine bağlandı: `kalite.back`.

## 3. Kalan sorunlar (öncelik sırasıyla)

Kanıt görüntüsü: [`docs/kalite/kalanlar.png`](kalite/kalanlar.png).

1. **Yüksek · Ayarlarda küçük dokunma hedefleri.**
   - **Sorun:** ölçülen boyutlar şöyle:
     - Müzik, Efekt sesleri ve Titreşim anahtarları 56×32 px.
     - Oto / Koyu / Açık düğmeleri 44–52 × 33 px.
     - "Renk temaları" ve "Reklamsız paket" satırları 42 px.
   - **Neden önemli:** Play Console ön inceleme raporu 48 dp altını erişilebilirlik uyarısı olarak gösterir. Apple'ın önerisi 44 pt.
   - **Neden bu dalda düzeltilmedi:** ayarlar başka dalın alanı. `magaza-reklam` dalı ayarlara "Gizlilik" satırı ekliyor.
   - **Önerilen çözüm:** birleştirmeden sonra şu üç kural eklenir. Görünüş değişmez.
     - `.tog{position:relative}.tog:after{content:"";position:absolute;inset:-6px -2px}`
     - `.seg button{min-height:44px}`
     - `.opt.row{min-height:48px}`
2. **Orta · Bazı bölümlerin üretimi yavaş.**
   - **Ölçüm:**
     - 1500 bölümün ortalaması 44 ms. 48 bölüm 150 ms'yi, **9 bölüm 300 ms'yi aşıyor** (masaüstü).
     - Yavaş bölümlerin hepsi 7×9 boyutunda ve nehir ya da tarife bölgesi kuralı kapak ya da kapalı durakla aynı bölümde: 1295, 1003, 818, 1433, 999, 1143, 760, 794, 790.
     - En kötüleri 1295 (≈ 0,44–0,52 sn) ve 1003 (≈ 0,37–0,42 sn). 4 kat yavaşlatılmış CPU'da 1,0–1,8 sn.
     - M18 Nehir hattının ortalaması 129 ms, en çok 385 ms.
     - Ölçüm, makinede başka oturumlar çalışırken yapıldı; sayılar ±%20 oynayabilir.
   - **Etki:** oyuncu bir sonraki bölümü sırayla açtığında fark etmez, çünkü sonraki bölüm kazanma ekranında önceden hazırlanıyor. Haritadan ya da ana sayfadan soğuk açılışta ise "Oyna"ya basınca telefonda 1–2 sn donma olur.
   - **Önerilen çözüm:** bölüm çıktısı üç seçenekte de bit bit aynı kalır.
     - (a) Ana sayfa açılınca `requestIdleCallback` ile `puzzleFor(save.level)` önceden hazırlanır.
     - (b) Kalıcı çözüm: üretim bir Web Worker'a taşınır.
     - (c) Nehir ve tarife bölgesi eklentilerinde aday eleme maliyeti ölçülür. Bu seçenek kural oturumlarının alanı.
3. **Orta · 320 px genişlikte karolar küçük.**
   - **Sorun:** iPhone SE (1. nesil) ve küçük Android'lerde 7×9 ızgarada karo 39 px, yani 44 px'in altında. 360 px ve üstünde 45 px ve üzeri.
   - **Önerilen çözüm:** 340 px ve altında `.screen` yan boşluğu 18 → 10 px yapılır ve sefer şeridi ile ilerleme çubuğu tek sıraya alınır. Bu yapılmazsa bilinen sınır olarak kabul edilir.
4. **Orta · Ekran okuyucu erişilebilirliği.**
   - **Sorun:** oyun tahtası bir `<canvas>` ve ekran okuyucuya hiçbir şey söylemiyor. Düğmeler ve pencereler okunuyor, çiplerde `aria-label` var.
   - **Önerilen çözüm:** `#cv` için `aria-label` ("Oyun tahtası, 7×9") ve her hamleden sonra `role="status"` ile kısa durum ("%45 bağlı · 12 hamle").
   - **Mağaza etkisi:** yayını engellemez, ama Play ön inceleme raporunda uyarı çıkabilir.
5. **Düşük · "Hat açıldı!" başlığı karışabilir.**
   - **Sorun:** her bölüm sonunda "Hat açıldı!" yazıyor. Aynı panelde "YENİ HAT AÇILDI · M5" rozeti çıkınca oyuncu iki şeyi karıştırabilir.
   - **Öneri:** "Bağlandı!" ya da "Bölüm tamam!".
6. **Düşük · Günün Hattı başlığı iki satır kaplıyor.**
   - **Sorun:** "Günün Hattı tamam!" artık kesilmiyor, ama çoğu telefonda iki satıra iniyor. Panel yaklaşık 23 px uzuyor, tahta biraz küçülüyor.
   - **Öneri:** daha kısa bir başlık, örneğin "Günün Hattı ✓".
7. **Düşük · İpucu teklifi açıkken süre akıyor.**
   - **Durum:** "İpucun bitti" (ödüllü video teklifi) penceresi açıkken süre akmaya devam ediyor. Tahta görünür kaldığı için bilinçli bir tercih olabilir: süre dursa oyuncu pencereyi açıp düşünebilirdi.
   - **Karar:** dokunulmadı.
8. **Düşük · Anlatıcı atlanamıyor.**
   - **Durum:** ilk açılışta 7 sayfa ve son sayfaya gelmeden kapanmıyor. Sayfalar kendiliğinden geçiyor ve kaydırılabiliyor, bu yüzden mağaza sorunu değil.
   - **Öneri:** ilk izlenimi hızlandırmak için 3. sayfadan sonra küçük bir "Geç" bağlantısı.
9. **Bilgi · Birleştirme ve yayın notları.**
   - **Yakınlaştırma:** `index.html` yakınlaştırmayı kapatıyor (`user-scalable=no`). Oyunlarda olağan; Lighthouse uyarı verir.
   - **iOS'ta ödeme yazısı:** reklamsız paket penceresindeki "Google Play ile güvenli ödeme" ve "Play Store sürümünde açılır" yazıları iOS'ta yanlış olurdu. `magaza-yerel` dalında `Shop.name()` ile düzeltilmiş; birleştirmede korunmalı.
   - **Robot:** `main` (`cf4fc0c`) üzerinde koşulduğunda 9 kural testi kırmızıydı: gizli depo, halka, kapalı durak ve nehir karma senaryoları. Bu dalla ilgisiz; kural birleştirmelerinden kalıyor.

## 4. Ölçümler

**Hat başı bölümlerinin üretim süresi (masaüstü, ms):**

| Hat | Bölüm | ms |
|---|---|---|
| M1–M9 | ilk bölüm | ≤ 16 |
| M10 Kapak | 253 | 35 |
| M14 Gizli depo | 469 | 102 |
| M16 Kapalı durak | 601 | 81 |
| M18 Nehir | 749 | 49 |
| M20 Tarife bölgesi | 913 | 82 |
| M21 | 1001 | 143 |
| M22 | 1093 | 141 |
| M23 | 1189 | 32 |
| M24 | 1289 | 108 |
| M25 | 1393 | 97 |

- **300 ms eşiği:** hiçbir hat başı 300 ms'yi aşmıyor. Aşan 9 bölüm hat ortasında (bkz. §3.2).
- **Günün Hattı:** 7 günün her biri 11–29 ms.
- **Kare süresi, kazanma animasyonu:** Bölüm 61 (7×9), 2,5 sn boyunca 148 kare. p50 16,7 ms, p95 16,7 ms, en kötü 16,8 ms; 33 ms'yi aşan kare yok. Robotun G bölümü 4 kat yavaş CPU'da da p95 < 34 ms bekliyor ve geçiyor.
- **Geri tuşu:** mantık doğru. Her durumda ne yaptığı:
  - pencere açıksa → pencere kapanır
  - anlatıcıda → bir önceki sayfa (son sayfaya gelmeden kapanmaz)
  - sandık sahnesinde → dokunmakla aynı iş
  - kural kartında → ana sayfa (kart sonra yine gelir)
  - oyunda ve haritada → ana sayfa
  - ana sayfada → uygulama arka plana alınır
- **Konsol hatası:** 4 boy × 2 tema × 3 oyuncu türünde hiç yok.
- **Çift dokunuş:**
  - "Tekrar"a çift dokunuş zararsız: hamle 0, ipucu harcanmıyor.
  - "Ana sayfa"ya çift dokunuş zararsız: ikinci dokunuş ana ekranda bir şey açmıyor.
  - "Sonraki"ye çift dokunuş bölüm atlatıyordu; düzeltildi (§2.1).

## 5. Yeniden denetim

- `node tools/hakem.cjs` komutu bütün robotu koşar. Bu dalın testleri `kalite.*` adıyla geçer (12 kontrol).
- Görüntüler `hakem-out/shots/kalite-*.png` dosyalarına yazılır.
