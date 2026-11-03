# M26 · Kayan sütun (`column`)

Hat M26, ilk bölüm 661 (3 Kasım, `kurallar-3`). Dosyalar: `www/rules/kayan-sutun.js`, `tools/hakem/kayan-sutun.cjs`. Esin kaynağı: Simon Tatham *Netslide*; M5 ↔ kayan sıranın (`slide`) dikey karşılığı.

**Kural.** Raylı sütunun karoları dönmez. Sütunun herhangi bir karosuna dokununca bütün sütun bir kare aşağı kayar, en alttaki karo başa geçer. Karoların yönü değişmez; yalnız yerleri değişir. Art arda kaydırmak tek hamledir.

**Neden zorlaştırır.** Kayan sıradaki gibi yönün yanına konum boyutu ekler; sütun merkezin sağında ya da solunda dikey bir şerit olduğu için hattı yukarıdan aşağı keser. Mekanizma M5'ten tanıdık, bu yüzden son hat olmasına karşın hızlı öğrenilir.

**Üretim (`shape`, `ord: 24`).** Merkez, köprü, tünel ağzı, eşli karo ve başka birim içermeyen sütunlar aday olur. Kaydırılmış hiçbir hâli çözüme benzemeyen sütun seçilir (tek doğru konum). Sütun çözüm yönleriyle konur, 1…h−1 kez kaydırılır. Birim: `C.unit(sütun, h, kaydır, 'column')`. Miktar her zaman 1.

**Çözülebilirlik.** Kaydırma h adımda başa döner; doğru konum h − t dokunuşla bulunur. Zorluk çözücüsü h durumu dener, ipucu sütunu çözüme oturtup sabitler, robot `plan()` ile hizalar.

**Çakışma.** `clash: ['slide', 'closed', 'river', 'zone', 'depot']`:

- **Kayan sıra:** her sıra her sütunu keser; kesişen karo iki birime giremez (çekirdekte birim hücresi tek birime aittir). Kesişimi destekleyen bir "çapraz kayma" ayrı bir çekirdek işi olurdu ve sıra × sütun birlikte bulmacayı Netslide düzeyine, çözücünün ölçemediği ölçüde zorlaştırırdı. Bu yüzden iki kural hiçbir bölümde birlikte gelmez (karma dahil; test 600 bölümde sınar).
- Kapalı durak, nehir, tarife bölgesi, gizli depo: kayan sıradaki gibi konuma bağlı sayım ve kıyı kuralları.

**Oyun ve çizim.** Karanlık tünelde sütunun bir karosu aydınlanınca bütün sütun aydınlanır (`reveal`). Sütunun arkasında ray yatağı (çerçeve ve iki ince dikey ray), alt uçta aşağı ok; kayarken karolar yukarıdan bir kare kayarak gelir (200 ms, hareket azaltılmışsa yok).

**Zorluk ve merdiven (3 Kasım).** Kayan şerit çözücü puanını biraz düşürür (7×9, 60 tohum × 8 aday: kuralsız 14,5 → sütunlu 12,7; kayan sıra 13,1): şeridin h durumundan biri kesin doğrudur ve çözücü bunu birlikte eler. Hat ortalamasını seçici hedefi taşır: `boost: 7.5`. Ölçüm: M25 20,5 < **M26 20,9**; karma M27+ 19,6–21,3.

**Test.** `tools/hakem/kayan-sutun.cjs`: `rule.column.gen` (dikey birim, aşağı kayma, tek doğru konum, uyumlu her eklentiyle), `.clash` (kayan sırayla hiç), `.line` (merdiven, karmada da gelir), `.old`, `.card` (320 px), `.play` (iki dokunuş iki kare, 1 hamle, robot çözer), `.fog`, `.errors`.
