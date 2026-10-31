# M18 · Halka hat (anahtar: `ring`)

> **Hat düzeni 31 Ekim'de değişti:** bu kural artık **M18** (ilk bölüm 437). Aşağıdaki hat ve bölüm numaraları ve ölçümler eski düzene aittir; güncel tablo `docs/kurallar/README.md`.

> **Durum: uygulandı.** Kod `www/rules/halka.js`, robot testleri `tools/hakem/halka.cjs`. Çekirdekte değişiklik yok. Aşağıdaki bölümler uygulanan hâli anlatır. Tasarım iş akışının (üç tasarımcı, seçici, şüpheci doğrulayıcı) kaydı en altta korunur; doğrulayıcının zorunlu düzeltmelerinin her biri orada işaretlidir.

**Neden seçildi:** Hedef türünde en derin kural: Net türünün temel sezgisini (döngü yok) bir kez tersine çeviriyor. Sayım kanıtı tüm kurallarla birlikte geçerli: makas, tabla, köprü ve tünel kol sayısını korur. Kavramsal olarak tabladan zor, tünel ağzından kolay. M13'ün `tree()` yardımcısını yeniden kullanıyor. Türü: hedef (tabla gibi bir etkileşim kuralından sonra, tünel gibi bir geometri kuralından önce).

## Kural kartı

- Ad: **Halka hat** · etiket: "Yeni: halka hat".
- Metin: Bu hatta raylar **bir kez** kendi üstüne kapanır ve **halka** olur. Halka **kesik çemberli** (satır içi SVG simgesi) karodan geçmeli: geçince çember dolar.
- ◯ (U+25EF) karakteri kullanılmaz; Android yazı tipinde boş kutu çıkabilir. Simge satır içi SVG'dir (`.rd-ring-i`).
- Demo (`.rd-ring`, satır içi SVG, 100×100): 2×2 karo, gri halka rayı, sağ üst karoda kesik çember. Hat rengi halkayı alttan başlayıp dolaşarak çizer (`stroke-dashoffset`, `pathLength=100`). Halka kapanınca kesik çember söner, hat renginde düz çember zemin halkasıyla belirir (küçük bir sıçrama), halkada ince "çift ray" çizgisi çıkar. 4 sn döngü.
- Temel (animasyonsuz) stil **kapalı** hâli gösterir. Azaltılmış harekette (genel kural: animasyon .01 sn, tek tur) kart boş kalmaz, kapanmış halkayı gösterir.
- Keyframe adları: `rd-ring-draw`, `rd-ring-a`, `rd-ring-b`, `rd-ring-c`.

## Görünüş (oyun içi)

- **İşaret:** karonun içinde büyük çember, r = .36s.
  - Halkada değilken: kesik, `pal.mut`, kalınlık .045s. 18 kesik çevreye tam oturur (dikiş yok). Kesik uç `lineCap = 'butt'` ile çizilir, sonra `'round'` geri yüklenir (round uçta boşluk ~0,7 px'e iniyordu). Altında yarı saydam zemin halkası vardır, raydan ayrışır.
  - Halkadayken: düz, hattın rengi (iki merkezde sahibinin rengi), kalınlık .055s. Altında .12s zemin rengi halka vardır. Raylarla birleşip ağır bir "⊕" gibi görünmez, aktarma istasyonu gibi okunur.
- **Çift ray:** işaret taşıyan basit döngünün karolarında, yalnız döngü komşusuna giden kollara ince bir zemin çizgisi çizilir (.055s, `pal.bg` %60). Ray çift hatlı görünür. `rails` kancasında, duraklardan ve merkezden önce çizilir.
- **Uyarı nabzı:** yakın kazançta halkada olmayan işaret 900 ms içinde iki kez dışa açılan, uyarı renginde bir halka atar. Karo da `press` ile küçülüp büyür.
- Ayrım biçimle yapılır (kesik / düz), yalnız renge dayanmaz. Karanlıkta `vis(i)` gizler.
- Maliyet: kare başına 3–5 çizim çağrısı. Nabız dışında animasyon yoktur, boşta kare çizilmez.

## Mekanik ve sayım kanıtı

Çözüm artık ağaç değil, tek döngülü bir çizgedir. Kural "bir yerde kapatman gerekir, ama işaretli karodan geçerek" der. Net oyuncusunun en güçlü sezgisi (döngü kapatma) bu hatta bir kez tersine döner. Metro teması: çevre hattı.

**Sayım:** her karonun kol sayısı dokunuşla değişmez (döndürme, makas, tabla, tünel kol toplamını korur). Çözümde ağaç n − h kenar taşır (h = merkez sayısı); halka kenarı bir kenar ekler. Kol toplamı Σpopc = 2(n − h + 1).

- Açık uç yoksa her kol karşılıklıdır: kenar sayısı m = n − h + 1.
- **Tek merkez** (h = 1): her şey yanıyorsa çizge bağlıdır (c = 1), m = n. Döngü sayısı m − n + c = **1**.
- **İki merkez** (h = 2): karışma yoksa iki bileşen vardır (c = 2), m = n − 1. Döngü sayısı (n − 1) − n + 2 = **1**.

Yani açık ucu olmayan, hepsi yanan, karışmamış her dizilimde **tam olarak bir döngü** vardır. Tek döngülü çizgenin 2-çekirdeği (dereceleri ≤ 1 olan düğümler soyulunca kalan) tam o döngüdür. Kazanma denetimi bu yüzden yalnız "işaretler 2-çekirdekte mi?" diye bakar.

## Üretim ve çözülebilirlik kanıtı

`tree(C)` aşaması: Prim ağacından sonra, karıştırmadan önce. Tünel (`tOrder: 0`) önce çalışır, `C.adj` hazırdır.

1. `tree(C, sol)` ile `pa`, `dep`, `ow` bulunur.
2. **Aday kenar (a, b):**
   - `b = C.nb(a, k)` komşudur; tünel kenarı da olabilir.
   - `b > a` (tekil).
   - İki kol da `sol`'de boştur.
   - İki uç da merkez ya da köprü (`C.br`) değildir.
   - `ow[a] = ow[b] > 0`: aynı hat, karışma olmaz.
3. **Döngü:** a → ortak ata ← b ağaç yolu + yeni kenar. Uzunluk L = dep[a] + dep[b] − 2·dep[lca] + 1.
   - Koşul 8 ≤ L ≤ hi. `hi = n < 63 ? 12 : 20`: 6×8 yalnız M17'nin ilk 3 bölümüdür (testere dişi), karma hatlar hep 7×9'dur. `amount()` bölüm sırasını almadığı için sınır boyuttan okunur.
   - Aralıkta aday yoksa bütün adaylara düşülür. Hiç aday yoksa `out.ring` yazılmaz, bölüm halkasız gelir.
4. Rastgele bir aday seçilir: `sol[a] |= bit`, `sol[b] |= karşı bit`.
5. **İşaret burada, ağaç aşamasında ayrılır.**
   - Adaylar döngü karolarıdır: merkez değil, `C.keep` değil (tünel ağzı, köprü), dört yollu kavşak değil (`per > 1`). İkinci işaret döngüde en az L/3 uzaktan seçilir.
   - İşaret karosuna `C.keep` ve `C.busy` yazılır. Böylece sabit, eşli, ters, sayaçlı ve birimler (makas, tabla) dokunmaz; işaret hep çıplak karodur.
   - Sayaçtan sonra çıplak karo arayan sürüm karma bölümlerde 32 kez boş kalıyordu; bu sürümde 0.
6. `mark(C)` aşaması (sayaçtan sonra):
   - İşaretin `busy` bayrağı geri alınır. Karanlık yalnızlaştırma ve "çözülmüş gelmesin" bu karoyu çevirebilir.
   - Karıştırılmış başlangıçta işaret bir döngüdeyse (ör. rastgele 2×2 halka) karo 1–3 kez çevrilir. Oyun her zaman kesik çemberle başlar. R() tüketmez.
7. `out.ring = { mark: bool[n], cyc: [döngü karoları] }`. Miktar `amount = (n, intro) => intro || n < 63 ? 1 : 2` (işaret sayısı).

**KANIT:** Karıştırma yalnız geri alınabilir işlemlerden oluşur (döndürme; işaret karosunun ek döndürmesi de öyle), dolayısıyla cur → sol erişilebilir. Eklenen kenar iki uçta da kol eklediği için sol'de açık uç yoktur. Bağlılık değişmez. a ve b aynı sahipte olduğundan karışma olmaz. İşaretler sol'ün döngüsündedir, dolayısıyla `lit(sol).solved`.

**Eski bölümler:** Kancalar yalnız `x.ring > 0` iken çalışır, R() yalnız o zaman tüketilir. 1–672 (halka hattından önce) ve Günün Hattı (`x = {}`) bit bit aynıdır.

## Kazanma koşulu (`check`)

Her `lit()` çağrısında ve zorluk çözücüsünün yaprağında çalışır, O(n).

1. Yanan alt çizgede karşılıklı kollarla derece bulunur (komşuluk `nb/ob`, tünel geçerli). Derecesi ≤ 1 olanlar kuyrukla soyulur. Kalanlar `L.core`'dur.
2. `bad` = çekirdekte olmayan işaret sayısıdır. Dönüş değeri `bad`'dir; sıfırdan büyükse `L.solved = false` olur.
3. Her işaretin çekirdek bileşenine bakılır. Bileşendeki her karonun çekirdek derecesi 2 ise bileşen basit bir döngüdür. Bu karolar `L.rc`'ye (çizim) yazılır. `L.rOn` = böyle döngüdeki işaret sayısıdır.
   - Bu ayrım, iki döngü arasındaki yolda duran işaretin "halkada" sayılmasını önler. Rastgele 89 400 durumda 125 kez görüldü; çember kesik kalır.
4. `L.ringNear = bad > 0 && L.solved`. Buradaki `L.solved` temel sonuçtur: açık uç yok, hepsi yanıyor, karışma yok. "Her şey bağlı ama halka işaretten geçmiyor" anlamına gelir. Sayım kanıtı gereği o anda tek döngü vardır ve işaret onun dışındadır.

Kazanma anında çizge tek döngülüdür, çekirdek tam halkadır, `rOn` işaret sayısına eşittir.

## Dokunma ve geri bildirim

Dokunma değişmez. İki geçiş izlenir:

- **Dokunuştan önceki hâl:** `block(G)` her geçerli dokunuştan önce çağrılır ve hiç engellemez. `G.ringWas` (rOn) ve `G.ringNear0` buraya yazılır. Böylece çekirdekte `after(G, i, now, prevL)` değişikliğine gerek kalmadı. Başlangıçta zaten kapalı olan durum da kapanma sayılmaz. İpucu ve ↺ baştan bu bayrakları doğal olarak yeniler.
- **Yakın kazanç** (`ringNear` yükselir):
  - İşaret nabız atar.
  - Bölümde bir kez hafif titreşim ve "Halka kesik çemberli karodan geçmeli" bildirimi.
  - Kazanma olmaz.
  - Doğru çözen oyuncu bu uyarıyı hiç görmez (200 bölümde 0).
- **İşaret halkaya girdi** (`rOn` artar, bölüm bitmemiş):
  - Çember dolar ve kısa, yumuşak bir ton (`note(10)`, düşük ses) çalar.
  - Kutlama, bildirim ve ek titreşim yoktur. Kapanan döngü henüz asıl halka olmayabilir; kutlama `win()` ile gelir.
  - Oyuncunun hayatında bir kez açıklama gösterilir: "Halka çemberli karodan geçti · çember doldu" (`save.ringTold`).
- Uyarı kapanma geri bildiriminden önceliklidir: aynı dokunuşta ikisi birden gelmez.

## Zorluk, ipucu, baştan, kayıt

- `difficulty()`: değişmez. Yerel eleme döngüsüzlüğü kullanmıyordu, kısıtı yaprakta `lit` + `check` uygular. Merdiven: M16 ortalaması 15,70, M17 15,62, M18 (ilk 31 bölüm) 15,73.
- İşaret pratikte kısıt değil, bilgi ve geri bildirim noktasıdır (doğrulayıcının sayımı: 6×8'de çok çözümlü pay 6/60 → 5/60, 7×9'da 4/50 → 4/50). Kuralın asıl etkisi topoloji değişimidir: tek döngü, 1–2 durak eksik.
- **İpucu:** değişmez. `sol` işaretli halkayı içerdiği için ipucu asla yanlış halkaya itmez.
- **↺ baştan:** yeni `G` kurulur; halka ve işaret statiktir, `ringWarn` sıfırlanır.
- **Kayıt:** yeni alan yok. Ortak imza (`sig = hash(sol)`) halka kenarını içerir. `save.ringTold` yalnız bir kerelik açıklama içindir.

## Öteki kurallarla karışım

- **Sabit, eşli, ters, sayaçlı:** karıştırma yeni `sol`'e göre yapılır, aynen geçerli. İşaret bunlara konmaz (`keep` + `busy`).
- **Makas, tabla:** kol sayısı korunur, sayım kanıtı geçerli. İşaret bu birimlere konmaz (birimler `busy`'ye saygı gösterir).
- **Karanlık:** merkez yalnızlaştırma işaret karosunu da çevirebilir. Halka karanlıkta keşfedilir, karanlıktaki işaret çizilmez.
- **İki merkez:** halka tek hattın içindedir (a ve b aynı sahipte). Düz çember sahibinin renginde çizilir.
- **Tünel ağzı:** halka kenarı tünelden geçebilir. `check` ve çift ray komşuluğu `nb/ob` ile okur. İşaret ağız hücresine konmaz.
- **Tabela ve köprüyle ÇAKIŞIR:** `clash: ['sign', 'bridge']`.
  - Tabela, oku ağaçtaki ebeveyne göre koyar; halka kenarı bu varsayımı bozar.
  - Köprüde bölünmüş düğüm 2-çekirdek ve `tree()` ile uyuşmaz.
  - Köprüde 2-çekirdek bölünmüş düğümle hesaplanırsa köprü yasağı kaldırılabilir.

## Ölçümler

- **Üretim (Node, gerçek `generate/lit`):** 6×8 ve 7×9 × 10 karışım × 150 tohum = 3000 bulmaca.
  - Hata 0, hazır çözülü 0, "çekirdek ≠ döngü" 0, yanlış başlangıç (işaret döngüde) 0.
  - Aday tükenmesi 0, aralık dışına düşme 0.
  - Ortalama halka 10,2 karo (8–20). İki işaret döngüde ortalama 0,41 L uzakta.
- **Kayan işaret:** işaret döngü dışına taşınınca sol 3000/3000 reddedildi, hepsinde `ringNear`.
- **Hat:** 673–1400'de halkalı 181 bölümün hepsinde halka var ve hepsi çözülür. İki merkezli 15, karanlıklı 13 bölüm.
  - 673–675: 6×8, halka 8 / 10 / 8 karo, 1 işaret. 676+: 7×9, 2 işaret.
  - Ortalama üretim 17 ms (Node), tarayıcıda 24 ms.
- **Eski bölümler:** eklentili ve eklentisiz yükleme 1–672 arasında (her 3. bölüm) birebir aynı. Robot erken bölümlerin ve Günün Hattı'nın eklentisiz özetini sabit olarak denetler.
- **Geri bildirim (doğru çözen oyuncu, merkezden dışa, 200 bölüm):**
  - Yanlış uyarı 0. Başlangıçta dolu çember 0.
  - Çember son dokunuştan önce 197 bölümde dolar: halka tahtanın geri kalanından önce kapanır.
  - 49 bölümde geçici bir döngü yüzünden dolup yeniden kesikleşir. Geri bildirim yalnız olgusal olduğu için (çember + yumuşak ton) yanıltıcı kutlama yoktur.
- **Çizim maliyeti (4× yavaş CPU, kapalı halka, 7×9):** halka kancaları kare başına ortanca ~0,1 ms. Bütün kare çizimi ortanca ~2 ms, çekirdeğin 61. bölümüyle aynı.
- **Boyut:** `halka.js` ~10 KB (kart SVG'si ve CSS dahil).

## Robot testleri (`tools/hakem/halka.cjs`)

1. `rule.ring.gen`: 600 üretim (2 boy × 10 karışım; birleşik sürümde makas, tabla ve tünel karışımları kendiliğinden eklenir).
   - `lit(sol)` çözülü.
   - 2-çekirdek tam tek döngü; `rc` = çekirdek; `rOn` = işaret sayısı.
   - İşaret döngüde, çıplak, merkez değil, kavşak değil.
   - Uzunluk sınırı tutuyor; hazır çözülü yok.
2. `rule.ring.move`: işaret döngü dışına kayınca sol reddedilir, `ringNear` olur.
3. `rule.ring.old`: 1–672 ve Günün Hattı bit bit aynı.
   - Halka kancaları hiç çağrılmaz.
   - `{ring: 0} ≡ {}`.
   - Eklentisiz özet (FNV) tutar.
4. `rule.ring.line`: M17'nin 76 bölümünde de halka var; ilk 3 bölüm 6×8, ≤ 12 karo, 1 işaret; sonra 7×9, 2 işaret; üretim < 60 ms.
5. `rule.ring.clash`: 673–20000'de halka tabela ya da köprüyle hiç birlikte gelmez. Tabela/köprü eklentisi henüz yoksa miktarı 0 olan kukla kural konur, böylece test boşa geçmez.
6. `rule.ring.card`: 673'te "YENİ KURAL · Halka hat" kartı, demo SVG ve satır içi simge.
7. `rule.ring.play`:
   - 673: 6×8, kesik başlar.
   - Halka işaretten kapanınca çember dolar ve bir kerelik açıklama çıkar; bölüm kazanılmaz.
   - Kalan karo çözülünce kazanılır.
8. `rule.ring.warn` (açık tema, 7×9, 2 işaret):
   - Yakın kazançta kazanılmaz.
   - Uyarı bir kez söylenir; aynı duruma dönülünce yeniden söylenmez, yalnız nabız atar.
9. `rule.ring.mix`: halka + karanlık tünel; ışığı izleyen çözüm kazanır.
10. `rule.ring.perf`: 4× yavaş CPU'da çizim süresi ölçülür (kare temposu değil). Böylece aynı makinede koşan öteki işler sonucu bozmaz.
11. `rule.ring.errors`: konsol hatası yok.

Ekran görüntüleri: `rule-ring`, `ring-open`, `ring-closed`, `ring-win`, `ring-warn` (açık tema), `ring-fog`.

## Bilinen sınırlar

- **İki merkezli küçük ızgara** (3×3'te 68/400): aynı sahipte ağaç dışı kenar olmayabilir. O zaman `out.ring` yazılmaz ve bölüm halkasız gelir. Gerçek halka boyutlarında (6×8, 7×9) hiç görülmedi (0/3000, 673–1400'de 0). Bu yüzden doğrulayıcının önerdiği `pick()` süzgeci (Ç2) eklenmedi.
- **İşaret pratikte bilgi verir,** çözüm sayısını azaltmaz (bkz. Zorluk).
- **Geçici döngü:** çember doğru çözen oyuncuda bile geçici bir döngü yüzünden dolup yeniden kesikleşebilir (200 bölümde 49). Bu bilerek kabul edildi: geri bildirim olgusaldır, kutlama yoktur.
- **Merkez halkada olabilir:** ortak ata merkez olduğunda halka merkezden geçer. Merkez çift rayın üstüne çizilir, sorun değil.
- **Web paketi bütçesi:** hakemin "< 300 KB" denetimi eklentisiz hâlde yalnız ~2,7 KB pay bırakıyordu. Bu eklentiyle paket ~307 KB olur, düşük önemli `size` denetimi geçmez. Her kural eklentisi bu sınırı aşar; sınırın ortak olarak yükseltilmesi ya da çalışma zamanında yüklenmeyen `og.jpg`'nin (48 KB, service worker listesinde yok) sayımdan çıkarılması gerekir.
- **`docs/BOLUM_TASARIMI.md` §5:** tabloya M17 satırı bu dalda eklenmedi (izinli dosyalar dışında).

## Çekirdek değişikliği: yok

- **Ç1 (`after(G, i, now, prevL)`) gerekmedi.** Dokunuştan önceki hâl `block(G)` kancasında saklanır. Bu kanca her geçerli dokunuştan önce çağrılır ve hiç engellemez.
- **Ç2 (`pick()` halkasız adayı atlasın) gerekmedi.** Gerçek boyutlarda aday hiç tükenmiyor.
- **Ç3 (ipucu önceliği) gerekmedi.** İpucu karoyu `sol`'e oturtur, `sol` işaretli halkayı içerir.

---

## Tasarım kaydı: doğrulayıcının kararı

Çözülebilir: evet · Uygulanabilir: evet · Tutulsun: evet

**Karşı örnek / risk:** Çözülemezlik için karşı örnek bulunamadı. Kanıt doğru: rot, makas (iki durumu da 2 kollu), tabla (karo taşır) ve tünel kol toplamını (Σpopc) değiştirmez. Halkalı sol'de bu toplam 2n'dir; açık uç yoksa kenar sayısı n olur. Tek merkezde bağlı n düğüm ve n kenar, iki merkezde karışmamış 2 bileşen ve n−1 kenar demektir. Her iki durumda döngü sayısı (m−n+c) tam 1'dir, kazanma anında 2-çekirdek tam o döngüdür. Köprüde bölünmüş düğüm tree() ile uyuşmaz; tabela da ağaç aşamasında halkadan önce çalışıp eski ağaca göre ok koyar. Bu yüzden CLASH ['sign','bridge'] haklı. rulesFor ile 673–20000 arasındaki 2079 halkalı bölümde 0 çakışma çıktı.

**Deney (doğrulayıcı):** game.js'in gerçek generate/lit/difficulty/tree/rulesFor/puzzleFor kodu Node'a çıkarılıp öneri eklenti olarak yazıldı.
- 7 boy (3×3–7×9) × 9 karışım × 150 tohum × 2 işaret aşaması = 18 900 bulmaca. lit(sol) hatası 0, hazır çözülü 0, "core ≠ döngü" 0. İşaret döngü dışına taşınınca sol 1050/1050 reddedildi.
- puzzleFor 673–1300: 166 halkalı bölüm, hepsinde halka var, hepsi çözülür. Ortalama 16 ms/bölüm.
- Merdiven: M16 ortalaması 15,58, M17 15,64. difficulty 7×9'da 13,85 → 13,40, 6×8'de 11,61 → 11,53. Aday sayısı 6×8'de 13,1, 7×9'da 19,6; halka 10,8 / 11,3 karo.

**Bulunan bozulmalar ve yanlış iddialar** (çözülebilirliği bozmuyordu):
1. Yanlış uyarı: "core boş değil ama işaret core'da değil" koşulu doğru çözende 200 bölümün 39'unda uyarı veriyordu.
2. Erken "Halka kapandı": doğru çözende 42/200 bölümde asıl halka bitmeden çalıyor, 16/200'de kapanıp açılıyordu. 2-çekirdekte olup hiçbir döngüde olmayan işaret de vardı (80 000 rastgele durumda 10).
3. "İşaret çok çözümlülüğü tekleştirir" iddiası yanlıştı: 6×8'de 6/60 → 5/60, 7×9'da 4/50 → 4/50.
4. Miktar hatası: gerçek boyutlar yalnız 6×8 ve 7×9 olduğu için "n<48 ise 1" hiç tutmuyordu; "ilk 3 bölümde L≤12" amount() ile uygulanamıyordu.
5. İşaret aşaması: sayaçtan sonra çıplak karo arayınca karma bölümlerde 32 bulmacada döngüde çıplak karo kalmıyordu.
6. Aday tükenmesi: iki merkezli 3×3'te 68/400 tohumda aynı sahipte ağaç dışı kenar yok.
7. Sözleşme uyumsuzluğu: P.ringMark/P.ringCyc yerine out.ring = { mark, cyc }; .rdemo10 yerine .rd-ring.
8. Çizim: round uçla kesik boşluk ~0,7 px; hat renginde düz çember raylarla "⊕" gibi ağır görünüyordu.
9. Azaltılmış hareket: temel stil kapalı halkayı göstermezse kart boş kalıyordu.

### Zorunlu düzeltmeler ve uygulanışı

- ✅ Uyarı yalnız yakın kazançta: `L.ringNear = bad > 0 && L.solved`, bölümde bir kez (`G.ringWarn`) bildirim ve nabız. Doğru çözende 0 yanlış uyarı.
- ✅ "Halka kapandı" kutlaması kaldırıldı: çember dolar, yumuşak ton; bildirim ve ek titreşim yok, açıklama ömürde bir kez (`save.ringTold`).
- ✅ Döngü göstergesi doğru: `L.rc` / `L.rOn` yalnız basit döngüdeki işaretler için. Çift ray yalnız o döngünün kollarına.
- ✅ Veri sözleşmeye uygun: `out.ring = { mark, cyc }`, `x.ring` = işaret sayısı. Oyun bayrakları `G`'ye yazılır, `G.ring`'e yazılmaz (önbellek paylaşıyor).
- ✅ `amount = (n, intro) => intro || n < 63 ? 1 : 2`, `hi = n < 63 ? 12 : 20`.
- ✅ İşaret ağaç aşamasında ayrılır (`keep` + `busy`), `mark(C)`'de `busy` geri alınır.
- ✅ Aday koşulları: `b > a`, iki kol boş, merkez ve köprü değil, aynı sahip; aralık dışına ve hiç aday yoksa halkasıza düşme. Tünel kenarı serbest; işaret ağız hücresine konmaz.
- ✅ Kesik çember `butt` uçla; düz çember zemin halkasıyla raydan ayrışır.
- ✅ Kartta ◯ yerine satır içi SVG; bildirimde "kesik çemberli karo".
- ✅ Demo `.rd-ring`, kendi keyframe adları, temel stil kapalı hâl.
- ✅ Çekirdek değişikliği Ç1 gerekmedi (`block` kancası), Ç2 gerekmedi (aday tükenmiyor).
- ✅ Belge ölçümle düzeltildi. ⏳ `BOLUM_TASARIMI §5` satırı bu dalın dışında.
- ➕ Ek: karışık başlangıçta işaret rastgele bir döngüdeyse karo çevrilir. 673'ün kendisinde 2×2'lik bir halka tanıtım bölümünü "çözülmüş gibi" gösteriyordu.
