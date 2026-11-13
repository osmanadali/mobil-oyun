# Büyülü Sudoku — Kalite Kontrolü

Test robotu: `node sudoku/test/robot.cjs` (gerçek Chromium tarayıcıda oynar; ekran görüntüleri ve özet `sudoku/test/out/`).

**Son sonuç: 40/40 geçti.**

## Neler test ediliyor
| Alan | Kontrol |
|---|---|
| Üretici | Kolay/Orta/Zor için 260 bulmaca: çözüm geçerli, **tek çözümlü**, ipucu sayısı (40/32/26), en yavaşı 25 ms |
| Oynanış | 1→9→boş dokunma döngüsü, 9 farklı animasyon, ara rakamlarda ceza yok, geri al, uzun basışla silme, ipucu |
| Kayıt | Uygulama kapanıp açılınca tahta aynen geri gelir, oyun bitince "Devam Et" gizlenir |
| Kural | 3 yanlışta oyun biter, tahta çözülünce kazanma ekranı |
| Ekranlar | iPhone SE (375), iPhone 13, iPhone 15 Pro Max, iPad: taşma/çakışma yok, kutucuk ≥ 30 px (33–68 px) |
| Performans | Hızlı dokunma fırtınasında ortalama kare 16,7 ms (60 fps), 50 ms+ takılma yok; kazandıktan sonra boşta çizim yok |
| Varlıklar | 50 görsel/ses dosyasının hepsi yükleniyor, konsol hatası yok |

## Bu turda düzeltilenler
- **iOS çift dokunuş yakınlaştırması:** Bir kutuya hızlı hızlı dokununca Safari sayfayı büyütebiliyordu → `touch-action: manipulation`.
- **iOS uzun basış menüsü:** Silmek için basılı tutunca "Resmi Kaydet" menüsü çıkabiliyordu → `-webkit-touch-callout: none`.
- **iOS ses kilidi:** Ses yalnızca `touchend`/`click` ile açılabiliyor; ilk dokunuşta güvenle açılıyor, açılana kadar denemeye devam ediyor.
- **iOS adres çubuğu:** Tahta boyutu `100dvh` ile hesaplanıyor (Safari'de alt çubuk tahtayı kesmesin).
- **iPad:** Tahta 580 → 760 px'e kadar büyüyor, butonlar/kalpler/süre ölçekleniyor.

## Bilinen sınırlar (bilerek)
- 320 px genişlikli ilk nesil iPhone SE'de kutucuk 28 px kalıyor; bu cihaz iOS 16+ almadığı için hedef dışı.
- Zorluk ipucu sayısına göre (40/32/26); çözüm tekniği zorluğu ölçülmüyor. "Zor" bazen orta hissettirebilir.
- Yatay (landscape) ekran için ayrı düzen yok → uygulamada dikey kilitlenmeli.
