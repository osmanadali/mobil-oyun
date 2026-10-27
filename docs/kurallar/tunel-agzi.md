# M19 · Tünel ağzı (anahtar: `portal`)

> Bu belge tasarım iş akışının çıktısıdır: üç bağımsız tasarımcı, bir seçici ve şüpheci bir doğrulayıcı. Uygulama notlarındaki satır numaraları ve "şu fonksiyonu değiştir" önerileri eklenti iskeletinden ÖNCE yazıldı. Ortak altyapı (birim/val, komşuluk adj, bölünmüş düğüm, tree(), kayıt imzası, kural kartı göçü, çakışma) artık çekirdekte hazır; kural yalnız kendi dosyasında, kancalarla yazılır: docs/kurallar/README.md.

**Neden seçildi:** Son yeni kural: kavramsal ve teknik olarak en karmaşık olanı. Adj altyapısını tek başına getiriyor, uzaktan komşuluk ve kenar ipucunun kalkması gibi yeni çıkarımlar istiyor. Zorluğu artıran tek kural olması %99 zorluk bölgesine çok uygun; bunu kendi prototipimle ölçtüm (+1,3/+2,0/+3,7). Çözülebilirlik ve 'eski bölümler aynı' iddiasını da doğruladım. Türü: geometri; M11 köprüden 8 hat sonra geldiği için çeşitlilik korunuyor. Seçimde değişiklik yaptım: adj yalnız tünelli bölümde kuruluyor (eski kod yolu korunuyor), kenar payı küçültüldü (.22s, yalnız ağızlı yanlar), sabit ve tabla aday dışlamaları eklendi, 3 çift yalnız finalde.

## Kural kartı metni

Kenardaki <b>aynı harfli</b> iki tünel ağzı bağlıdır: birine giren ray <b>öbüründen çıkar</b>. Harfsiz kenar <b>kapalıdır</b>.

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

Henüz yok (ana oturum doğrulayıcının düzeltmelerini sonra iletecek). Uygulama sırasında yapılan şüpheci öz-sınama aşağıda.

## Uygulama (www/rules/tunel-agzi.js)

Kural yalnız kancalarla yazıldı, çekirdekte değişiklik yok. Yukarıdaki "game.js'te şunu değiştir" önerilerinin hepsi çekirdekteki ortak altyapıyla karşılandı: `nb/ob` `P.adj/P.ao` varsa onu okur (addF, lit, tree, difficulty.step), `pad`, `reveal`, `top` kancaları.

- **Miktar:** `amount = intro ? 1 : fin ? 3 : 2`. Tanıtım (bölüm 829, 6×8) tek çift, aynı satırın iki ucunda (sağdan çıkan soldan girer). `x.portal === 1` her zaman bu "satır ucu" biçimini seçer.
- **`pre(C)`** (R() yalnız portal > 0 iken):
  - `adj/ao` önce geometrik komşularla doldurulur.
  - Aday: kenar hücresi + dışa bakan yön (`adj < 0`). Köşede iki yön arasından biri rastgele seçilir (köşede tek geçit). Merkez(ler) ve ızgara komşuları, `C.keep` hücreleri (köprü) aday olamaz. Bir hücre en çok bir geçit taşır.
  - Çift: iki ağzın Manhattan uzaklığı ≥ 3 olmalı (aynı ve komşu hücre yasak; 2 uzaklıktaki köşe çiftleri de sıkıcı olduğu için elendi). Çift başına en çok 40 deneme; olmazsa o çift atlanır (çok küçük ızgarada daha az çift çıkabilir).
  - Yazılır: `adj[a·4+ka] = b`, `ao[a·4+ka] = bit(kb)` ve tersi. `C.mouth` = ağızlar, `C.keep[ağız] = true` (sabit ve eşli adayı olmaz, tabla dışlar). `C.adj/C.ao` yalnız en az bir çift varken kurulur.
  - `C.out.portal = [{ a, ka, b, kb, id }]`; `id` 0, 1, 2 → A◆, B●, C▲.
- **`tree(C)`** (`tOrder: 0`, halkadan önce): hiçbir tünel kullanılmadıysa rastgele bir çiftten başlayarak döngü değiş tokuşu. BFS `lit` ile aynı kurala uyar (köprünün iki yarısı ayrı düğüm). Köprü hücresine değen yol kenarları çıkarılmaz (köprünün kolları bozulmasın). b'ye ulaşılamıyorsa (iki merkez, ayrı ağaç) sıradaki çift denenir.
- **`reveal`:** yanan (d ≥ 0) her ağzın eşi `area()` ile FOG_R çevresiyle açılır.
- **`pad`:** ağız bulunan her yana .22 karo.
- **`after`:** bir tünel bölümde ilk kez iki uçtan bağlanıp yanınca kısa iki notalı ton ve iki ağızda küçük kıvılcım; ilk bağlantıda bir kez bildirim: "Tünel A · bir ağızdan girdi, öbüründen çıktı". Kayda yeni alan yazılmaz.
- **`top`:** ağız = kenar ortasında dışa taşan yarım elips (yarı eksenler .34s kenar boyunca, .215s dışa). Boş ağızlar tek yolda (`pal.bg` dolgu, `pal.mut` kenar); bağlı tünelin ağızları hat renginde (renk başına bir yol). Harf (`fillText`, en çok 6) ve şekil (tek yolda ◆ ● ▲). Renk körü dostu: çift harf + şekille ayırt edilir. Kare başına ~5–7 çağrı, animasyon yok.
- **Kural kartı:** `.rd-portal`: iki yanda turuncu ağız (A◆), ortada üç yanan karo; beyaz nokta sağ ağza girer, sol ağızdan çıkar (`@keyframes rdpt`, yalnız transform/opacity).

## Kanıt (döngü değiş tokuşu)

T yayılan ağaç, e = (a, ka)–(b, kb) kullanılmayan tünel kenarı. a ile b aynı ağaçta ise T + e tek bir döngü içerir: a→b ağaç yolu + e. Bu döngüden e dışında herhangi bir f kenarı çıkarmak yine yayılan ağaç verir (bağlılık korunur, kenar sayısı aynı). Hücre başına kol: yolun iç düğümleri yolda 2 kola sahiptir, en çok birini kaybeder → ≥ 1 kol. a ve b en çok bir kol kaybeder ve tünel kolunu kazanır → ≥ 1. Merkez ağız olamaz; yolun içindeyse ≥ 1 kolla kalır. Ağız kenar hücresi olduğu için dışa bakan bit önceden boştur (`sol[a] | bit(ka)` yeni bir koldur, 4'lü sınırı aşılmaz). `lit` komşuyu `adj/ao`'dan okuduğu için yeni `sol` çözülüdür. İki merkezde a ve b ayrı ağaçtaysa e iki ağacı birleştirirdi (`merged`); bu yüzden atlanır. Köprü hücresine değen kenarlar yoldan çıkarılmaz; bu yalnız aday kümesini daraltır, kanıtı değiştirmez. Karıştırma çekirdekte geri alınabilir işlemlerle yapılır.

Karanlık tünel: robot ve oyuncu aydınlık karoları çözdükçe ışık ağacın kenarları boyunca ilerler. Ağaç kenarı geometrikse çocuk FOG_R içinde zaten açılır. Tünel kenarıysa ebeveyn ağız yanınca `reveal` eşi açar. Bu yüzden her hücre sonunda görünür. Merkez ve merkez komşusu ağız olmadığı için çekirdekteki "merkez başta bağlı gelmesin" adımı (geometrik komşu okur) tünelden etkilenmez.

## Ölçümler (hakem, tools/hakem/tunel-agzi.cjs)

- 300 tohum, 7×9, `{portal:3}`: `lit(sol)` 300/300 çözülü, 300/300'de en az bir tünel kullanılıyor; geçit kuralları (merkezden uzak, komşu değil, hücre başına bir geçit, adj simetrik) 0 ihlal.
- Tek taraflı kullanım: kullanılmayan çiftte yalnız bir ağza kol eklenince 256/256 çözülmez (açık uç); kullanılan tünelin bir kolu kesilince 300/300 çözülmez.
- Karanlık tünel + 2 çift + sabit + eşli + ters + sayaçlı, 200 tohum: ışığı izleyen robot benzetimi 200/200 çözüme varır, bütün karolar aydınlanır. Gerçek oyunda bölüm 833 (karanlık + 2 tünel) `solve()` ile kazanılıyor.
- `{portal:0}`: 60 tohumda üretim JSON'u ve zorluk birebir aynı, `adj` yok. Bölüm 1–208 ve Günün Hattı imzası kural eklenmeden önce ölçülenle aynı. 1–828 arasında hiçbir bölümde tünel yok. Ayrıca bu dalda (başka eklenti yokken) 209–828'den 20 bölümün imzası da değişmedi.
- Bölüm 829: kural kartı açılıyor (animasyon `rdpt`), 6×8, 1 çift aynı satırda; ağızlar tahta dışında ve ekranda; robot kazanıyor.
- Zorluk (7×9, 150 tohum): 0 çift 14,65 · 1 çift 14,68 · 2 çift 15,34 · 3 çift 17,35. Tek çift neredeyse etkisiz, 3 çift +2,7.
- Zorluk hesabı tünelli bölümde ~0,3 ms (generate + difficulty).
- Küçük ızgaralar (3×3, 4×4, 4×5; iki merkez, sabit, eşli ile birlikte): istisna yok, `lit(sol)` çözülü. 3×3'te 3 çift istenince ortalama 2 çift çıkıyor. 4×4 iki merkezde çekirdek zaten ~%1,5 oranında kolsuz merkez üretiyor (tünelden bağımsız, oyunda bu boyut iki merkezle gelmez).

## Bilinen sınırlar

- Web paketi bütçesi: bu dosya ~7,8 KB. Eklentiden önce paket 297,2 KB'tı; şimdi 304,8 KB, yani hakemin `size` (< 300 KB, önem: low) kontrolü düşüyor. Altı kuralın hepsi eklenince bütçenin ana oturumda yeniden belirlenmesi gerekecek.
- İpucu `nearLit` geometrik komşuya bakar; tünelin öbür ucunu önceliklendirmez (isteğe bağlıydı, çekirdeğe dokunmamak için yapılmadı).
- Kullanılmayan bir çiftin iki ucuna birden kol vermek de geçerli bir çözümdür (döngü oluşur, açık uç yok). Bu, çekirdeğin "bağlı + açık uç yok" tanımıyla tutarlı.
- Tünel bağlandığında ağız rengi anında değişir; ayrı bir animasyon yok (kıvılcım ve ton geri bildirim verir).
