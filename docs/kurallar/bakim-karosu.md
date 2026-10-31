# M14 · Bakım karosu (`gear`)

> **Hat düzeni 31 Ekim'de değişti:** bu kural artık **M14** (ilk bölüm 325). Aşağıdaki hat ve bölüm numaraları ve ölçümler eski düzene aittir; güncel tablo `docs/kurallar/README.md`.

**Kural.** Dişli (⚙) karoya dokunulmaz. Hamle sayacı her 2'nin katına geldiğinde (2, 4, 6…) dişli kendiliğinden saat yönünde 90° döner. Hattı, dişli doğru yöne geldiği hamlede tamamlamak gerekir. Köşedeki iki nokta sıradaki dönüşe kalan hamleyi gösterir.

**İlke notu.** Kural ilkelerinde "kendi kendine hareket eden karo yok" yazıyordu; kullanıcı kararıyla (31 Ekim) bu kural için gevşetildi. Dönüş **gerçek zamanlı değildir**, yalnız hamleye bağlıdır: oyuncu düşünürken dişli hiç kıpırdamaz.

**Neden zorlaştırır.** Bilgi eklemez, zamanlama ekler. Fazladan her hamle dişliyi kaydırır; hamle hedefini tutturmak için hamleleri dişliyle aynı ritimde planlamak gerekir.

**Üretim.** `mark` aşamasında dört yönü de farklı görünen sıradan bir karo (durak, dirsek, üçlü) seçilir; tanıtımda 1, 6×8 ve üstünde 2. Dişli 4 durumlu tek karoluk birimdir (`C.unit([g], 4, rot)`): zorluk çözücüsü dört yönü dener, ipucu dişliyi çözüme oturtup sabitler (sabit dişli dönmez). Başlangıç yönü, oyuncu yaklaşık par kadar hamlede bitirirse dişli tam doğru yöne gelecek biçimde seçilir.

**Çözülebilirlik.** Dişli her 8 hamlede başa döner. Bütün öteki karolar doğruyken dişli yanlışsa oyuncu, yön değiştirmeyen "boş" hamlelerle (bir karoya 4 kez dokunup ötekine geçmek) en çok 7 hamlede dişliyi hizalar. Robot bunu `plan` kancasıyla yapar.

**Çekirdek değişikliği.** `after(G, i, now, moved)`: dördüncü değişken bu dokunuşun yeni hamle başlatıp başlatmadığı. `plan(G, out)` kancası: kendi planı olan eklentinin birimleri çekirdek planına girmez, eklenti planı en sonda eklenir.

**Test.** `tools/hakem/yeni-kurallar.cjs` › `new.gear`.
