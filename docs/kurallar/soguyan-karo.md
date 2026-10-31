# M21 · Soğuyan karo (`ice`)

**Kural.** Kar taneli (❄) karoyu çevirip başka bir karoya geçince o karo **2 hamle donar**: dokunuş yok sayılır, hamle sayılmaz. Aynı karoya art arda dokunmak tek hamledir ve donmaz.

**Neden zorlaştırır.** Bulmacaya bilgi eklemez, deneme-yanılmayı pahalı kılar. Bir ❄ karoyu çevirip başka yere bakıp geri dönmek isteyen oyuncu iki hamle beklemek zorunda kalır; hamle hedefini tutturmak için karoya **bir kerede doğru yönü vermek** gerekir.

**Üretim.** `mark` aşamasında, çözümde yanlış duran, dönünce değişen sıradan karolar (birim, sabit, eşli, sayaçlı, ters değil) arasından seçilir. Tanıtım bölümünde 3, sonra ızgaranın %12'si (son durakta %16), en az 3.

**Çözülebilirlik.** Donma geçicidir ve yalnız hamle sayısına bağlıdır; her karo en geç 2 hamle sonra yine döner. Çözüm dizilimi her zaman ulaşılabilir. Robot her karoyu tek seferde çevirdiği için donmaya hiç takılmaz.

**Oyun.** `block`: donmuşsa "❄ Donmuş karo · k hamle sonra döner". `after`: ❄ karonun son çevrildiği hamle `G.iceLeft`'e yazılır. `undo` (↶ güçlendiricisi): donmalar çözülür.

**Çizim.** Köşede küçük kar tanesi (her zaman); donmuşken buzlu örtü ve ortada büyük kar tanesi. Renge ek olarak biçim taşır.

**Test.** `tools/hakem/yeni-kurallar.cjs` › `new.ice`.
