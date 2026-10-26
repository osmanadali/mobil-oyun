# Damla

Yağmurlu bir gecede pencere camından aşağı süzülen tek bir damlayı yönettiğin, sakin ve sonsuz bir mobil oyun.

- **Oynanış:** Ekranın herhangi bir yerinde parmağını sağa sola sürükle; damla onu yumuşakça izler. Küçük damlaları yutarak büyü (büyük damla daha hızlı akar, daha çok puan getirir ama zor döner).
- **Tehlikeler:** Çıtalara çarpma (boşluktan geç), kuru lekelerde kütle hızla azalır, yapışkan izler seni yavaşlatır. Kütle biterse damla kurur.
- **Puan:** Kat edilen mesafe (cm). En iyi skor tarayıcıda saklanır.
- **Çalıştırma:** Kurulum gerekmez; `index.html` dosyasını tarayıcıda aç ya da klasörü herhangi bir statik sunucuyla yayınla (ör. `npx serve oyunlar/damla`).
- **Teknik:** Saf JavaScript + Canvas 2D, dış kaynak yok; tüm sesler ve müzik Web Audio ile cihazda üretilir.
- **Test kancası:** `window.__damla` (durum, `start()`, `pause()`, `resume()`, `world`).
