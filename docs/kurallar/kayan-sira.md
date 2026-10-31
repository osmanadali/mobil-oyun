# M23 · Kayan sıra (`slide`)

**Kural.** Raylı sıranın karoları dönmez. Sıranın herhangi bir karosuna dokununca bütün sıra bir kare sağa kayar, en sağdaki karo başa geçer. Karoların yönü değişmez; yalnız yerleri değişir. Art arda kaydırmak tek hamledir.

**Neden zorlaştırır.** Oyuna ikinci bir boyut ekler: yönün yanında konum. Sıradaki doğru kaymayı, sıranın üst ve alt komşularıyla birlikte düşünmek gerekir. Döner tablanın (2×2) bir satıra yayılmış hâlidir.

**Üretim.** `shape` aşamasında merkez, köprü, tünel ağzı, sabit ve eşli karo ve başka birim içermeyen bir satır seçilir. Satırın kaydırılmış hiçbir hâli çözüme benzemez (tek doğru konum). Satır çözüm yönleriyle konur, 1…w−1 kez kaydırılır. Birim: `C.unit(sıra, w, kaydır, 'slide')`.

**Çözülebilirlik.** Kaydırma w adımda başa döner; doğru konum w − t dokunuşla bulunur. Zorluk çözücüsü w durumu dener, ipucu sırayı çözüme oturtup sabitler.

**Çakışma.** Konuma bağlı sayım ve kıyı kurallarıyla aynı bölümde gelmez: `clash: ['closed', 'river', 'zone', 'depot']`.

**Çizim.** Sıranın arkasında ray yatağı (çerçeve ve iki ince ray), sağ uçta ok; kayarken karolar soldan bir kare kayarak gelir (200 ms).

**Test.** `tools/hakem/yeni-kurallar.cjs` › `new.slide`.
