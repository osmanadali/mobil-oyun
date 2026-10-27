# M19 · Tünel ağzı (anahtar: `portal`)

> Bu belge tasarım iş akışının çıktısıdır: üç bağımsız tasarımcı, bir seçici ve şüpheci bir doğrulayıcı. Uygulama notlarındaki satır numaraları ve "şu fonksiyonu değiştir" önerileri eklenti iskeletinden ÖNCE yazıldı. Ortak altyapı (birim/val, komşuluk adj, bölünmüş düğüm, tree(), kayıt imzası, kural kartı göçü, çakışma) artık çekirdekte hazır; kural yalnız kendi dosyasında, kancalarla yazılır: docs/kurallar/README.md.

**Neden seçildi:** Son yeni kural: kavramsal ve teknik olarak en karmaşık olanı. Adj altyapısını tek başına getiriyor, uzaktan komşuluk ve kenar ipucunun kalkması gibi yeni çıkarımlar istiyor. Zorluğu artıran tek kural olması %99 zorluk bölgesine çok uygun; bunu kendi prototipimle ölçtüm (+1,3/+2,0/+3,7). Çözülebilirlik ve 'eski bölümler aynı' iddiasını da doğruladım. Türü: geometri; M11 köprüden 8 hat sonra geldiği için çeşitlilik korunuyor. Seçimde değişiklik yaptım: adj yalnız tünelli bölümde kuruluyor (eski kod yolu korunuyor), kenar payı küçültüldü (.22s, yalnız ağızlı yanlar), sabit ve tabla aday dışlamaları eklendi, 3 çift yalnız finalde.

## Kural kartı metni

Kenardaki <b>aynı harfli</b> iki tünel ağzı bağlıdır: birine giren ray <b>öbüründen çıkar</b>. Tüneli kullanmak zorunlu değil; harfsiz kenar <b>kapalıdır</b>.

## Görünüş

Tahta kenarında dışa taşan yarım daire ağız (r = .2s), içinde harf ve şekil: A◆, B●, C▲. Çiftler renkle değil, harf ve şekille ayırt edilir. Kullanılan tünelde ağzın içi hat rengiyle dolar.

## Mekanik

Tahtanın dış kenarında 1–3 geçit çifti bulunur. Bir geçit, bir kenar hücresi ile onun dışa bakan yönünden oluşur. Çiftin iki ağzı birbirinin komşusu sayılır. A ağzındaki karo dışarı ray uzatırsa eşi A' ağzındaki karo da uzatmalıdır, yoksa açık uç oluşur. İkisi de uzatmazsa iki ağız kapalı kenar gibi davranır; kullanılmayan çift de geçerli bir 'tuzak'tır.
Tanıtımda çift aynı satırın iki ucundadır (sağdan çıkan soldan girer); sonra herhangi iki kenarda olabilir.
Eşli karodan farkı: eşli dönüşü bağlar, tünel komşuluğu bağlar; uzaktaki iki karo birbirinin kolunu doğrular. Kenar ipucunu kaldırdığı için zorluğu ARTIRAN tek kural budur; geç hatlar için idealdir.

## Üretim ve çözülebilirlik kanıtı

ADJ ALTYAPISI (ilk ve tek kullanıcı bu kural): yalnız x.portal varken P.adj = Int16Array(n·4) (komşu ya da −1) ve P.ao = Uint8Array(n·4) (komşudaki karşılık bit) kurulur. P.adj yoksa addF, lit, difficulty.step ve reveal ESKİ geometrik yolu kullanır. Böylece 1–828 bölümleri ve how() demosu birebir aynı kalır, sıcak yol yavaşlamaz.
Geçit seçimi (Prim'den önce, R() yalnız portal varken):
- aday (hücre, yön) için adj<0 olmalı;
- köşede tek geçit olur;
- merkez ya da merkez komşusu geçit olamaz;
- çiftin iki hücresi aynı hücre ya da ızgara komşusu olamaz.
Sonra adj[a·4+ka]=b, ao=bitB ve tersi yazılır; addF adj'den okuduğu için Prim tüneli de frontier'e alır.
Prim sonrası hiçbir tünel kullanılmadıysa DÖNGÜ DEĞİŞ TOKUŞU yapılır: a→b ağaç yolu BFS ile bulunur, yoldan rastgele bir kenar silinir ve tünel kolu eklenir. İki merkezde a ile b aynı ağaçta değilse bu adım atlanır.
KANIT: T+e tam bir döngü içerir; döngüden e dışında bir kenar çıkarmak yine yayılan ağaç verir. Yolun iç düğümlerinin yolda 2 kolu vardır, uçların eksilen kolu tünel koluyla telafi edilir; hiçbir hücre 0 kola düşmez (merkez de yolun içindeyse ≥1 kolla kalır). lit adj'den okuduğu için sol çözülüdür. Karıştırma yalnız geri alınabilir işlemlerle yapılır.
DOĞRULAMA (kendi prototipim, hakem12/portal.js): 7×9'da 0, 1, 2 ve 3 çiftle 600 bulmacada 0 hata. Çift yokken zorluk eski difficulty ile birebir aynı (13,63), yani R() tüketilmiyor. Kullanılan tünel ortalaması 1 çiftte 1,00, 2 çiftte 1,34, 3 çiftte 1,65.

## Kazanma koşulu

lit() komşuyu adj'den, varış bitini ao'dan okur: j<0 ya da cur[j]&ao yoksa loose++. Tünel kenarı BFS'e sıradan bir komşuluk gibi girer; d uzaklığı ve kazanma dalgası tünelden sıçrar. Başka değişiklik yok.

## Dokunma

Değişmez: karoya tek dokunuş. Ağız tahta dışında kalır ve dokunulmaz; pointerdown'daki sınır denetimi zaten reddeder. İlk kez bir tünel iki uçtan bağlanınca bir kez 'Tünel · A'dan girdi, A'dan çıktı' toast'ı ve kısa bir ton.

## Çizim

resize(): yalnız ağız bulunan yanlara s·.22 pay bırakılır: s = min((Wd−8)/(cols + .22·yanSayısı), (Hd−8)/(rows + .22·dikeySayısı), 96). 7 sütunda sol ve sağ ağız varsa karo ~%5 küçülür; üst/alt ağızda dikey boşluk genelde yeter.
6e (6c örtüsünden sonra, her zaman görünür): bütün ağızlar tek yolda yarım daire olarak çizilir (r = .2s, kenarın dışına); dolgu pal.tile, kenar pal.mut (+2 çağrı). Harf ve şekil fillText ile yazılır, 800 ağırlık, s·.2 boy (çift başına 2, en çok 6). Bağlı tünelin ağızları aynı yolda hat rengiyle doldurulur (+1). railPath hücre sınırına kadar çizdiği için ray ağza giriyormuş gibi görünür.
Kare başına +3–4 çağrı, animasyon yok.

## Zorluk çözücüsü ve robot

difficulty(): step()'teki komşu ve out hesabı P.adj varken adj/ao'dan okunur: out = adj<0, can() içinde o = ao[i·4+k]. Tünel kenarında 'boş olmalı' kısıtı kalktığı için elemeler azalır ve puan doğru şekilde artar. P.adj yoksa eski kod yolu çalışır.
Robot solve(): karoları sol'e getirir, DEĞİŞİKLİK GEREKMEZ. Tek şart: karanlık tünelli bölümde reveal() ışığı tünelden geçirmeli; yoksa robot da oyuncu da karanlık eş ağızda takılır.
hakem testleri:
- 300 tohumla {portal:3} üretilir; lit(sol) çözülü olmalı ve en az bir tünel kullanılmalı.
- Tüneli tek taraftan kullanan bir cur açık uç sayılmalı.
- {fog:true, portal:2} ile solve() kazanmalı.
- {portal:0} ile difficulty eski puana birebir eşit olmalı.

## İpucu, baştan, kayıt

İpucu: değişmez. nearLit adj ile tünel eşini de komşu sayarsa ipucu tünelin öbür ucunu da önceliklendirir (isteğe bağlı).
↺ baştan: tüneller tohumdan gelir.
Kayıt: yeni alan yok. Karanlıkta tünelle açılan hücreler de seen'e girer. Ortak sig yeterli.

## Öteki kurallarla karışım

Karanlık tünel: ZORUNLU ek. reveal()'de yanan bir geçit hücresinin eşi ve eşin FOG_R içindeki komşuları da aydınlanır; 'ağaç komşusu görünür' değişmezi korunur.
İki merkez: tünel iki rengi karşı köşelere taşıyabilir; merged aynen çalışır. Döngü değiş tokuşu yalnız aynı ağaçta yapılır.
Sabit: sabit adaylarından geçit hücreleri çıkarılır, yoksa tüneli ele verir.
Eşli, ters, sayaçlı: bağımsız.
Makas: b kolu tünele bakabilir (adj≥0).
Tabla: geçit hücresi tablaya girmez.
Köprü: köprü içte, geçit kenarda; bağımsız.
Tabela: ebeveyn tünelin öbür ucundaysa ok o kenara bakar; lit adj'den okur.
Halka: halka kenarı tünel olabilir.
CLASH yok.

## Kural kartı demosu

.rdemo11: üç .ft karo yan yana, ortalarından yatay ray geçer. İki uçta tahta dışına taşan yarım daire ağız var (border-radius, var(--tile)), içinde 'A◆' yazar. Küçük parlak bir nokta (i.tr) @keyframes tunnel ile hareket eder: 0→40% sağa ilerler, 41%'de sağ ağızda opacity 0 olur, 42%'de sol ağızda opacity 1 ile belirir, 42→100% ortaya ilerler. Altında 1 cümle: 'Sağdaki A'dan çıkan tren soldaki A'dan girer.'

## Zorluğa etkisi

Zorluğu artıran tek kural. Kendi ölçümüm (7×9, 150 tohum, adj'li difficulty): 0 çift 13,63; 1 çift 14,93 (+1,3); 2 çift 15,59 (+2,0); 3 çift 17,34 (+3,7).
M19'da z ≈ .99 ve hedef ≈ 15,9 olduğundan, yalın tahtanın ortalamasıyla (13,6) hedef arasındaki farkı kapatmaya en uygun kural budur.
Öneri: x.portal = intro ? 1 (aynı satırın iki ucu) : 2; 3 çift yalnız hat finalinde.

## Riskler

(1) En kritik hata: karanlık tünelle birlikte reveal() güncellenmezse bölüm çözülemez; hakem {fog, portal} testi şart.
(2) Kenar payı resize'a eklenmezse ağızlar ekran dışına taşar; pointerdown geo.ox ile hizalı kalmalı.
(3) Uzak eşleşmeyi okumak zor olabilir: harf + şekil ve 'tanıtımda aynı satır' şart.
(4) Döngü değiş tokuşu kavşak seyreltmesini biraz bozabilir.
(5) adj yolunun yalnız P.adj varken çalıştığı hakemle doğrulanmalı (portal:0 = eski puan).

## Doğrulayıcının kararı

Tasarımdaki hâliyle çözülebilir DEĞİL: tree aşamasındaki döngü değiş tokuşu köprüyle aynı bölümde bozuk bölüm üretiyordu (karşı örnek: `generate(7, 9, 55446, 0, 0, { portal: 1, bridge: 2 })`). Zorunlu düzeltmeler (yukarıdaki ilgili maddelerin yerine geçer, uygulandı):

1. Üretim: döngü değiş tokuşu yok, `tOrder` yok. Yerine köprü kalıbıyla `C.onTake`: ağaca ilk giren ağzın eşi henüz ağaçta değilse eşi de tünelden alınır. İlk değen çift her zaman kullanılır, sonraki çiftler R() < .5 ile serbest kalır. Doğrulayıcı ölçümü: 34 200 bulmaca + 143 gerçek tünel+köprü bölümünde 0 hata.
2. Çift bulunamazsa `C.adj/C.ao` ve `C.out.portal` yazılmaz.
3. Karanlık: `d[a] ≥ 0` → `on(b)`, `area(b)` (ve tersi). Kancasız 600 bulmacanın 6–17'sinde robot takılıyordu.
4. Çizim: kenardan dışa .27s taşan, .54s boyunda yuvarlak köşeli sekme, içinde tek harf (800, max(10, .26s) px), ek şekil yok. pad: ağızlı yanlara .3 karo.
5. Bağlı ağız dolgusu yalnız iki kol da tünele bakıyor ve iki uç da yanıyorsa; renk `OC[own(a)]` (karışmada uyarı rengi), harf `lum(dolgu) > .5 ? '#16182a' : '#fff'`.
6. Tanıtım: `amount` −1 döndürür (1 çift, merkez satırının bir üstü ya da altında satırın iki ucu); öteki bölümler `fin ? 3 : 2`.
7. Kart: `rd-portal`, ağızlar `.ft`'nin kardeşi; azaltılmış harekette nokta gizlenir, iki ağız dolu kalır; metin yukarıdaki gibi.
8. Zorluk beyanı (doğrulayıcı, 7×9): 1 çift ≈ 14,56 (+0,9), 2 çift ≈ 15,70 (+2,1), 3 çift ≈ 17,57 (+3,9).

## Uygulama (www/rules/tunel-agzi.js)

Kural yalnız kancalarla yazıldı, çekirdekte değişiklik yok. Yukarıdaki "game.js'te şunu değiştir" önerilerinin hepsi çekirdekteki ortak altyapıyla karşılandı: `nb/ob` `P.adj/P.ao` varsa onu okur (addF, lit, tree, difficulty.step), `pad`, `reveal`, `top` kancaları.

- **Miktar:** `amount = intro ? -1 : fin ? 3 : 2`. Çekirdek yalnız `x.portal`'ın truthy olmasına bakar; `pre` `Math.abs(x.portal)` ve `x.portal < 0` (tanıtım biçimi) okur. Tanıtım (bölüm 829, 6×8): tek çift, merkez satırının bir üstünde ya da altında satırın iki ucu (sağdan çıkan soldan girer).
- **`pre(C)`** (R() yalnız portal ≠ 0 iken):
  - `adj/ao` önce geometrik komşularla doldurulur.
  - Aday: kenar hücresi + dışa bakan yön (`adj < 0`). Köşede iki yön arasından biri rastgele seçilir (köşede tek geçit). Merkez(ler) ve ızgara komşuları, `C.keep` hücreleri (köprü) aday olamaz. Bir hücre en çok bir geçit taşır.
  - Çift: iki ağzın Manhattan uzaklığı ≥ 3 (aynı ve komşu hücre yasak; 2 uzaklıktaki köşe çiftleri sıkıcı olduğu için elendi). Çift başına en çok 40 deneme; olmazsa o çift atlanır.
  - Çift yoksa hiçbir şey yazılmaz (kural o bölümde kapalı). Varsa `adj[a·4+ka] = b`, `ao[a·4+ka] = bit(kb)` ve tersi; `C.mouth`, `C.keep[ağız] = true`, `C.out.portal = [{ a, ka, b, kb, id }]` (`id` 0, 1, 2 → A, B, C).
  - `C.onTake` kancası: bir ağız ağaca ilk girdiğinde, o çift daha önce görülmediyse ve eşi henüz ağaçta değilse, ilk çift için her zaman, sonrakiler için R() < .5 ile `sol[j] |= bit(kj)`, `sol[o] |= bit(ko)`, `C.take(o)`. Prim tünel kenarını frontier'den de kendiliğinden kullanabilir (`addF` adj'den okur).
- **`reveal`:** yanan (d ≥ 0) her ağzın eşi `on()` + `area()` ile FOG_R çevresiyle açılır.
- **`pad`:** ağız bulunan her yana .3 karo.
- **`after`:** bir tünel bölümde ilk kez bağlanıp iki ucu da yanınca kısa iki notalı ton ve iki ağızda küçük kıvılcım; ilk bağlantıda bir kez bildirim: "Tünel A · bir ağızdan girdi, öbüründen çıktı". Kayda yeni alan yazılmaz.
- **`top`:** ağız = kenardan dışa .27s taşan, .54s boyunda yuvarlak köşeli sekme, içinde tek harf. Boş ağızlar tek yolda (`pal.bg` dolgu, `pal.mut` kenar); bağlı tünelin ağızları (iki kol tünele bakıyor + iki uç yanıyor) `OC[own(a)]` renginde, renk başına bir yol. Harfler `fillText` (en çok 6). Karanlıkta yanmayan uç dolmaz → yön sızmaz. Kare başına ~5–9 çağrı, animasyon yok.
- **Kural kartı:** `.rd-portal`: iki yanda turuncu ağız (A), ortada üç yanan karo; beyaz nokta sağ ağza girer, sol ağızdan çıkar (`@keyframes rdpt`, yalnız transform/opacity). Azaltılmış harekette nokta gizlenir, ağızlar dolu kalır.

## Kanıt (onTake)

Prim, merkez(ler)den büyüyen bir orman kurar; her `take(j)` ormana bir yaprak ekler. Kanca, ağaca giren ağız j'nin eşi o **henüz hiçbir ağaçta değilken** çalışır: tünel kenarı (j, kj)–(o, ko) ormana yeni bir yaprak (o) ekler. Bu yüzden döngü oluşmaz, iki merkezin ağaçları birleşmez (o hiçbir ağaçta değildi) ve başka hiçbir kenar silinmez; köprü yarılarına dokunulmaz. j kenar hücresi olduğu için `bit(kj)` daha önce boştur, aynı şekilde o için `bit(ko)`. `take(o)` sıradan bir alım olduğundan o'nun komşuları frontier'e girer, köprü gibi başka `onTake` kancaları da çalışır. Sonuçta `sol` yine yayılan orman, her hücre ≥ 1 kollu. `lit` komşuyu `adj/ao`'dan okuduğu için `sol` çözülüdür. Bütün hücreler ağaca girdiği için bir ağız mutlaka alınır; bir çiftin ilk alınan ağzında eşi henüz ağaçta olamaz (olsaydı kanca eş için daha önce çalışırdı), bu yüzden ilk değen çift her zaman kullanılır. Karıştırma çekirdekte geri alınabilir işlemlerle yapılır.

Eski döngü değiş tokuşu (tree aşamasında ağaç yolundan bir kenar çıkarmak) doğrulayıcının karşı örneğinde köprüyle birlikte bozuk bölüm ürettiği için kaldırıldı; onTake hiçbir kenarı silmediği için bu sınıf hata oluşamaz.

Karanlık tünel: robot ve oyuncu aydınlık karoları çözdükçe ışık ağacın kenarları boyunca ilerler. Ağaç kenarı geometrikse çocuk FOG_R içinde zaten açılır. Tünel kenarıysa ebeveyn ağız yanınca `reveal` eşi açar. Bu yüzden her hücre sonunda görünür. Merkez ve merkez komşusu ağız olmadığı için çekirdekteki "merkez başta bağlı gelmesin" adımı (geometrik komşu okur) tünelden etkilenmez.

## Ölçümler (hakem, tools/hakem/tunel-agzi.cjs)

- 300 tohum, 7×9, `{portal:3}`: `lit(sol)` 300/300 çözülü, 300/300'de en az bir tünel kullanılıyor; geçit kuralları (merkezden uzak, komşu değil, hücre başına bir geçit, adj simetrik) 0 ihlal.
- Tek taraflı kullanım: kullanılmayan çiftte yalnız bir ağza kol eklenince 144/144 çözülmez (açık uç); kullanılan tünelin bir kolu kesilince 300/300 çözülmez.
- Karanlık tünel + 2 çift + sabit + eşli + ters + sayaçlı, 200 tohum: ışığı izleyen robot benzetimi 200/200 çözüme varır, bütün karolar aydınlanır. Gerçek oyunda bölüm 833 (karanlık + 2 tünel) `solve()` ile kazanılıyor.
- `{portal:0}`: 60 tohumda üretim JSON'u ve zorluk birebir aynı, `adj` yok. Bölüm 1–208 ve Günün Hattı imzası kural eklenmeden önce ölçülenle aynı. 1–828 arasında hiçbir bölümde tünel yok.
- Köprü regresyonu (karşı örnek + bölüm 987, 2120, 2780, 13592, 17037, 17633: `lit(sol)` çözülü, köprüde sol = cur = 15): köprü eklentisi bu dalda yok, test köprü yüklüyse çalışacak şekilde koşullu; şimdilik atlanıyor.
- Bölüm 829: kural kartı açılıyor (animasyon `rdpt`), 6×8, 1 çift merkez satırının komşu satırında; ağızlar tahta dışında ve ekranda; robot kazanıyor.
- Zorluk (bu dal, 7×9, 150 tohum): 0 çift 14,65 · 1 çift 15,28 · 2 çift 16,31 · 3 çift 17,31. Doğrulayıcının beyanı yukarıda (+0,9 / +2,1 / +3,9); ikisi de tünelin zorluğu artırdığını gösteriyor.
- Zorluk hesabı tünelli bölümde ~0,3 ms (generate + difficulty).
- Küçük ızgaralar (3×3, 4×4, 4×5; iki merkez, sabit, eşli ile birlikte): istisna yok, `lit(sol)` çözülü. 3×3'te 3 çift istenince ortalama 2 çift çıkıyor. 4×4 iki merkezde çekirdek zaten ~%1,5 oranında kolsuz merkez üretiyor (tünelden bağımsız, oyunda bu boyut iki merkezle gelmez).

## Bilinen sınırlar

- Web paketi bütçesi: bu dosya ~7,8 KB. Eklentiden önce paket 297,2 KB'tı; şimdi 304,8 KB, yani hakemin `size` (< 300 KB, önem: low) kontrolü düşüyor. Altı kuralın hepsi eklenince bütçenin ana oturumda yeniden belirlenmesi gerekecek.
- İpucu `nearLit` geometrik komşuya bakar; tünelin öbür ucunu önceliklendirmez (isteğe bağlıydı, çekirdeğe dokunmamak için yapılmadı).
- Kullanılmayan bir çiftin iki ucuna birden kol vermek de geçerli bir çözümdür (döngü oluşur, açık uç yok). Bu, çekirdeğin "bağlı + açık uç yok" tanımıyla tutarlı.
- Tünel bağlandığında ağız rengi anında değişir; ayrı bir animasyon yok (kıvılcım ve ton geri bildirim verir).
