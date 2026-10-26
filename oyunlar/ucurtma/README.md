# Uçurtma

Tek parmakla oynanan bir mobil web oyunu: uçurtmanı olabildiğince yükseğe çıkar, skor metre cinsindendir.
Basılı tut: uçurtma parmağına doğru döner ve hızla yükselir ama ip gerilir (ip beyazdan kehribara, sonra kırmızıya döner).
Bırak: ip gevşer, uçurtma rüzgârla süzülür. İp koparsa, başka bir ipe değersen ya da kenara çarparsan oyun biter.
Kurdeleler kuyruğu uzatır ve skor çarpanını artırır; rüzgâr yıldızları gerginliği azaltır. Gökyüzü sabahtan kutup ışıklarına değişir.

Çalıştırma: `index.html` dosyasını tarayıcıda açman yeterli (kurulum, internet veya derleme gerekmez).
İstersen yerel sunucuyla: `npx serve oyunlar/ucurtma` veya `python3 -m http.server -d oyunlar/ucurtma`.
Dosyalar: `index.html`, `style.css`, `game.js` — saf JavaScript, Canvas 2D ve Web Audio (tüm sesler cihazda üretilir).
Test kancaları: `window.__ucurtma` (state, start(), score, tension ...). Ödüllü video için `window.Ads.rewarded()` varsa "Devam et" görünür.
