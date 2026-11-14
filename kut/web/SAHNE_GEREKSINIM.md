# 3D sahne gereksinimleri (oynanış işinden gelen)

Bu dosya, oynanış/motor işinin `sahne3d.js`, `vfx.js`, `gorunum.js` ve `hareket.js` tarafında gerektirdiği değişiklikleri madde madde toplar. O dosyaları düzenleyen iş akışı buradan okur. Maddeler eklenir, silinmez; yapılan madde `[x]` ile işaretlenir.

## Adım 1: Tahta 4×3, seviye ve deneyim (OYNANIS_DERINLIK.md bölüm 2 ve 9)

- [ ] **Yeni başlangıç konumları.** Motor (`sim.js` / `KutSavas.cs`) artık 4 sütun × 3 sıra tahta kullanıyor. Arena yine 6 × 8.
  - `x = 0,75 + sütun × 1,5` → 0,75 / 2,25 / 3,75 / 5,25 (önce 1 / 3 / 5).
  - Taraf 0 (oyuncu, altta): ön `y = 5`, orta `y = 6`, arka `y = 7` (önce ön 5, arka 6,6).
  - Taraf 1 (rakip, üstte): ön `y = 3`, orta `y = 2`, arka `y = 1` (önce ön 3, arka 1,4).
  - Sahne konumu motordan (`u.x`, `u.y`) okuduğu için kod değişikliği şart değil, ama aşağıdaki maddeler kontrol edilmeli.
- [ ] **Arka sıra tahta kenarına yaklaştı.** Arka sıra artık tahtanın kenarından 1 birim içeride (y = 7 ve y = 1). Kamera kadrajı (yatay tablet ve dar ekran, `dar = w / h < 1.45` dalı) iki tarafın arka sırasını, özellikle rakibin y = 1 sırasını ve uzun modellerin başını kesmeden göstermeli. Yetenek yazıları ve can çubukları üst kenarda taşmamalı.
- [ ] **Birimler daha sık.** Komşu birimler arası yatay aralık 2 → 1,5 birim. Ayak halkaları (`RingGeometry(0.36, 0.45)`, kaynaşma halkası `0.49–0.56`) komşunun halkasıyla çakışmamalı; büyük modellerin ölçeği (`olcekle`) 1,5 aralığa göre gözden geçirilmeli. Gerekirse halka yarıçapı ~0,6'nın altında tutulmalı.
- [ ] **Taraf başına 8 birime kadar.** Seviye 8'de iki taraf toplam 16 yaratık. Uid'ler `taraf × 10 + i` (i ≤ 7) olarak kalıyor. Gereken: 16 modelle kare hızı (hafif grafik dahil) ölçülmeli; gölge, bloom ve parçacık bütçesi (`vfx.js` `OLCEK`) buna göre ayarlanmalı. Can çubukları ve hasar sayıları kalabalıkta okunur kalmalı (üst üste binince küçük kaydırma).
- [ ] **Kut dokunuşu isabeti.** `dokun(x, y)` sık dizilişte yanlış birimi seçmemeli: en yakın birim ekranda ölçülen mesafeyle seçilmeli, isabet yarıçapı birim aralığının (1,5) yarısını aşmamalı.
- [ ] **Tahta dokusu ve çizgiler.** Tahta (6 × 8 taş karo) aynı kalabilir. Hücre işareti, ışık lekesi ya da diziliş ızgarası çiziliyorsa 4 sütunluk yeni konumlara (x = 0,75 + 1,5k) ve 3 sıraya göre güncellenmeli.
- [ ] **Bilgi (değişiklik gerektirmez):** savaş sonucu `sonuc` nesnesine `kalanPuan` (kazanan taraftaki sağ birimlerin yıldız toplamı) ve `kalanSayi` alanları eklendi. Sonuç gösteriminde ileride "kaybedersen ~N can" için kullanılacak.
