# 3D sahne gereksinimleri (oynanış işinden gelen)

Bu dosya, oynanış/motor işinin `sahne3d.js`, `vfx.js`, `gorunum.js` ve `hareket.js` tarafında gerektirdiği değişiklikleri madde madde toplar. O dosyaları düzenleyen iş akışı buradan okur. Maddeler eklenir, silinmez; yapılan madde `[x]` ile işaretlenir.

## Adım 1: Tahta 4×3, seviye ve deneyim (OYNANIS_DERINLIK.md bölüm 2 ve 9)

- [x] **Yeni başlangıç konumları.** Motor (`sim.js` / `KutSavas.cs`) artık 4 sütun × 3 sıra tahta kullanıyor. Arena yine 6 × 8.
  - `x = 0,75 + sütun × 1,5` → 0,75 / 2,25 / 3,75 / 5,25 (önce 1 / 3 / 5).
  - Taraf 0 (oyuncu, altta): ön `y = 5`, orta `y = 6`, arka `y = 7` (önce ön 5, arka 6,6).
  - Taraf 1 (rakip, üstte): ön `y = 3`, orta `y = 2`, arka `y = 1` (önce ön 3, arka 1,4).
  - Sahne konumu motordan (`u.x`, `u.y`) okuduğu için kod değişikliği şart değil, ama aşağıdaki maddeler kontrol edilmeli.
  - *Yapıldı:* `test3d.html?takim=sekiz` ile denetlendi; motor 0,75 / 2,25 / 3,75 / 5,25 ve y = 1, 3, 5, 7 veriyor, sahne aynen yerleştiriyor.
- [x] **Arka sıra tahta kenarına yaklaştı.** Arka sıra artık tahtanın kenarından 1 birim içeride (y = 7 ve y = 1). Kamera kadrajı (yatay tablet ve dar ekran, `dar = w / h < 1.45` dalı) iki tarafın arka sırasını, özellikle rakibin y = 1 sırasını ve uzun modellerin başını kesmeden göstermeli. Yetenek yazıları ve can çubukları üst kenarda taşmamalı.
  - *Yapıldı:* `boyutla()` kadrajı (geniş: fov 35, dar: fov 41) ve kadraj kamerası 1280×800, 1024×768 (dar dal) ve 844×390 telefonda 8'e 8 dizilişle denendi. Rakibin y = 1 sırası, başlar ve can çubukları kesilmiyor; balon `by < 8` sınırıyla üstte kalıyor.
- [x] **Birimler daha sık.** Komşu birimler arası yatay aralık 2 → 1,5 birim. Ayak halkaları (`RingGeometry(0.36, 0.45)`, kaynaşma halkası `0.49–0.56`) komşunun halkasıyla çakışmamalı; büyük modellerin ölçeği (`olcekle`) 1,5 aralığa göre gözden geçirilmeli. Gerekirse halka yarıçapı ~0,6'nın altında tutulmalı.
  - *Yapıldı:* taraf diskinin dikenli dış kenarı yıldız ölçeği dahil dünyada en çok 0,62 (`diskS`), kaynaşma halkası en çok ~0,63. Görsel ayrıştırma yarıçapı 0,68 ile sınırlandı: 1,5 aralıklı komşular artık sürekli itişmiyor (iri 3 yıldızlı dört ayaklıda önceden 0,05 kayma oluyordu).
- [x] **Taraf başına 8 birime kadar.** Seviye 8'de iki taraf toplam 16 yaratık. Uid'ler `taraf × 10 + i` (i ≤ 7) olarak kalıyor. Gereken: 16 modelle kare hızı (hafif grafik dahil) ölçülmeli; gölge, bloom ve parçacık bütçesi (`vfx.js` `OLCEK`) buna göre ayarlanmalı. Can çubukları ve hasar sayıları kalabalıkta okunur kalmalı (üst üste binince küçük kaydırma).
  - *Yapıldı:* 16 modelle hafif kalitede SwiftShader'da (yazılım GPU) 1280×800'de kare başına ~27 ms ölçüldü; gerçek GPU'da sorun beklenmez. Parçacık bütçesi zaten öncelikli (`ONCELIK`: havuz dolarken süs doğumları önce düşer) ve hafifte `OLCEK` 0,55; değişiklik gerekmedi. Çubuklar kalabalıkta dikeyde ±13 px, yatayda birkaç px kayıyor (can çubuğu işi).
- [x] **Kut dokunuşu isabeti.** `dokun(x, y)` sık dizilişte yanlış birimi seçmemeli: en yakın birim ekranda ölçülen mesafeyle seçilmeli, isabet yarıçapı birim aralığının (1,5) yarısını aşmamalı.
  - *Yapıldı:* `dokun()` artık birimin gövde ortasını ekrana yansıtıp en yakını seçiyor; isabet yarıçapı birimin ekrandaki 0,72 birimlik yatay ölçüsü (18–80 px arası). Dikey mesafe 0,7 ile basılıyor, böylece baş ve ayak da isabet sayılıyor. Dokunuş haritasıyla denetlendi.
- [x] **Tahta dokusu ve çizgiler.** Tahta (6 × 8 taş karo) aynı kalabilir. Hücre işareti, ışık lekesi ya da diziliş ızgarası çiziliyorsa 4 sütunluk yeni konumlara (x = 0,75 + 1,5k) ve 3 sıraya göre güncellenmeli.
  - *Denetlendi:* sahnede hücre işareti ya da diziliş ızgarası çizilmiyor (yalnız 6×8 taş karo dokusu ve orta çizgi); değişiklik gerekmedi.
- [x] **Bilgi (değişiklik gerektirmez):** savaş sonucu `sonuc` nesnesine `kalanPuan` (kazanan taraftaki sağ birimlerin yıldız toplamı) ve `kalanSayi` alanları eklendi. Sonuç gösteriminde ileride "kaybedersen ~N can" için kullanılacak.

## Adım 2: Birikimli ekonomi, 100 can ve kaybedince alınan hasar (OYNANIS_DERINLIK.md bölüm 3 ve 4.4)

- [x] **Savaş sonu hasar anı.** Seviyeli maçta yenilgide can `bölüm tabanı + kalanPuan` kadar düşer (2-x'te 2, 3-x'te 5, 4-x'te 8, 5-x'te 12; bölüm 1'de 0). `oyun.savasBitti()` dönüşü artık `{ hasar, can, ganimet }` taşıyor. Sahne, rakibin sağ kalan birimlerinden oyuncunun tarafına doğru kısa bir "hasar kıvılcımı" (her sağ birimden bir ışık, yıldızı kadar parlak) uçurabilir; sayı (−N) sonuç bandında arayüzde yazıyor, sahnede tekrar yazılmasın.
  - *Yapıldı:* `S3.hasarKivilcim(taraf)` rakibin sağ kalan her biriminden oyuncu tarafına (kameranın önündeki kenar) bir ışık uçuruyor; boyu ve parlaklığı yıldızla artıyor, sonunda küçük sarsıntı var, sayı yazmıyor. `arayuz.js` `sonucGoster` yenilgide `r.hasar > 0` ise çağırıyor.
- [x] **Ganimet altını.** 1-2, 1-3 ve 3-7 sonunda `ganimet` > 0 gelir (2, 2, 3 altın). Canavar turları (adım 4) gelene kadar bu turlar bota karşı oynanıyor. Kazanan tarafta düşen birimlerden "ganimet küresi" düşmesi adım 4'te istenecek; şimdilik gerek yok, yalnız `zafer()` anında hafif altın parıltısı yeterli.
  - *Yapıldı:* `zafer()` kazanan her birimin başının üstünden birkaç altın yıldız saçıyor (hafifte daha az).
- [x] **Savaş HUD'u (arayüz değil, sahne üstü yazılar).** "Rakip · Tur 2-3" gibi tur adı artık bölüm-tur biçiminde (`oyun.turAd()`); sahnede tur sayısı yazdırılan yer varsa aynı biçim kullanılmalı.
  - *Denetlendi:* `sahne3d.js` tur yazmıyor; savaş HUD'undaki rakip kartı zaten `'Rakip · Tur ' + oyun.turAd()` kullanıyor.
- [x] **Son Üç / Son İki için hazırlık (lobi, adım 5).** Final turlarında hasar tabanı +3 / +5 olur; ileride sahnede "Son Üç" ışık değişimi ve gökyüzü tonu istenebilir. Şimdilik işlem yok.
  - *Not alındı:* istendiğinde `G.isikKur` ve gök küresi rengi üzerinden yapılacak; şimdilik dokunulmadı.
- [x] **Bilgi (değişiklik gerektirmez):** motorda (`sim.js`, `KutSavas.cs`) bu adımda değişiklik yok; ekonomi tamamen `lobi.js` / `KutLobi.cs` içinde.
