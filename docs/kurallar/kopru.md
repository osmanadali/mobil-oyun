# M13 · Köprü (anahtar: `bridge`)

> **Hat düzeni 31 Ekim'de değişti:** bu kural artık **M13** (ilk bölüm 297). Aşağıdaki hat ve bölüm numaraları ve ölçümler eski düzene aittir; güncel tablo `docs/kurallar/README.md`.

> Bu belge tasarım iş akışının çıktısıdır: üç bağımsız tasarımcı, bir seçici ve şüpheci bir doğrulayıcı. Uygulama notlarındaki satır numaraları ve "şu fonksiyonu değiştir" önerileri eklenti iskeletinden ÖNCE yazıldı. Ortak altyapı (birim/val, komşuluk adj, bölünmüş düğüm, tree(), kayıt imzası, kural kartı göçü, çakışma) artık çekirdekte hazır; kural yalnız kendi dosyasında, kancalarla yazılır: docs/kurallar/README.md.

**Neden seçildi:** Topoloji türünde ve metro temasına en doğal kural; iki merkezle (M8) güçlü bir karma oluşturur. Kavramı kolay anlaşılır: köprü dönmez, statik bir karodur. Bu yüzden M11'de ikinci sıraya uygun. Adj altyapısı gerektirmediği için tasarımcının tahmininden daha küçük. Üretim kanıtını ve zorluk etkisini kendi prototipimle doğruladım: 600/600 bulmaca, 2+ köprüde −1,6 puan. Seçimde değişiklik yaptım: tabla adaylarından köprü dışlandı, tabela köprü komşusuna konmuyor, halkayla CLASH eklendi, köprü sayısı en çok 2.

## Uygulama (güncel durum)

Kural uygulandı. Kod: `www/rules/kopru.js`, robot: `tools/hakem/kopru.cjs`. Çekirdekte değişiklik yok; her şey kancalarla. Bu bölüm günceldir. Aşağıdaki tasarım ve doğrulayıcı planı tarihçe olarak durur; plandaki "game.js'te şunu değiştir" maddelerinin karşılığı en altta "Plan → uygulama" listesindedir.

**Eklenti alanları**

| Alan | Ne yapar |
|---|---|
| `key: 'bridge', line: 10` | M11, bölüm 301–352. Kural kartı `RULES[10]` olur; 301–303 testere dişiyle 6×8 gelir |
| `clash: ['ring']` | Halka dosyası da tanımlar; simetrik, iki kez yazmak zararsız |
| `amount` | Tanıtım bölümünde (301) 1, sonra 2. Karma hatlarda da en çok 2 |
| `pre(C)` | Köprü hücrelerini seçer, `C.onTake`'e karşı kolu birlikte alan işlevi ekler. `C.br`, `C.out.split`, `C.out.bridge` |
| `block(G, i)` | Köprüye dokunuş: hamle saymaz, karo dönmez, oyun başına bir kez "Köprü · dönmez" |
| `under(D)` | Yalnız D–B yarısıyla yanan köprü karosunun zeminini o hattın tonuyla boyar (çekirdek K–G sahibine göre boyar) |
| `rails(D)` | Köprünün raylarını, korkuluğunu ve parlamasını çizer |
| `card`, `css` | Kural kartı ve canlı demo (`.rd-bridge*`) |

`check`, `allow`, `reveal`, `pad` gerekmedi: iki yarı şartı ve "karıştı" denetimi çekirdekteki bölünmüş `lit()` içinde. Karanlıkta `d[B]` yanan yarının değeri olduğu için çevresi kendiliğinden aydınlanır.

**Üretim (`pre`)**

- `R()` yalnız `x.bridge > 0` iken tüketilir. En çok 200 deneme: iç bölgede rastgele hücre. Merkez(ler)e Manhattan ≥ 2 (`hub2 = −1` ise o denetim atlanır). Önceki köprülere Chebyshev ≥ 3. `inT` ya da `keep` olan hücre atlanır. Yer yoksa daha az köprü konur; hiç yoksa `out.split`/`out.bridge` yazılmaz ve bölüm köprüsüz (eski `lit` yolu) oynanır.
- Köprü `B`: `sol[B] = 15`, `inT[B] = true`, `C.keep[B] = C.busy[B] = true`. `busy`, öteki eklentiler de köprüye dokunmasın diye eklendi; ters, sayaçlı ve "çözülmüş gelmesin" adayları köprüyü zaten dışlıyordu (`per(15) = 1`, `rot(15) = 15`).
- Kol grupları `C.nb/C.ob` ile kurulur (tünel ağzı `adj` gelse de doğru): `grp[kol] = [karşı kol, koldaki köprüye bakan bit, karşı koldaki bit]`. `C.onTake` işlevi: alınan `j` bir kolsa ve karşı kol ağaçta değilse iki kola köprüye bakan biti yazar, karşı kolu `C.take` ile ağaca çeker.
- Kanıt değişmedi (aşağıda): ilk giren kol karşısını çeker, o an karşı kol ağaçta olmadığından döngü yok. Kollar en çok bir köprüye aittir (Chebyshev ≥ 3), merkez hiçbir köprünün kolu değildir (Manhattan ≥ 2). Merkezler `take` ile değil `addF` ile başlar; onTake'in onlar için çağrılması gerekmez.

**Çizim (`rails`)**

- Çekirdekteki üç geçişin aynısı, yarı bazında: sönük (`pal.rail`, .17s) → ışıma (.38s, yarı saydam) → yanan (.17s). K–G yarısı `railPath(X, 5)` ile `own[B]` renginde, D–B yarısı `ownB[B]` renginde iki kısa parça: kenar ±.5s'den iç uç ±.31s'ye. Yuvarlak uç ±.225s'de görünür; K–G rayının kenarı ±.085s'de olduğu için ortada açık bir boşluk (alt geçit) kalır.
- Korkuluk: K–G rayına paralel ±.17s'de, boy .5s, `lineWidth = max(2, s·.045)`, `pal.mut`. Tek yol.
- Işıma kırpması: çekirdek komşuların ışımasını tek yolda çizer, ucu (yarıçap .19s yarım daire) köprü karosuna taşar. Köprünün ışıması ayrı çizildiği için bu yarım daireler iki kat koyulaşıp "kabarcık" görünüyordu (ekran görüntüsünde görüldü). Düzeltme: köprünün ışıması karosuna kırpılır ve aynı renkte ışıyan, köprüye kolu olan komşunun uç yarım dairesi `evenodd` ile dışarıda bırakılır. Birleşim birebir, renk tek kat.
- Parlama (çekirdekteki 3. geçiş bölünmüş karoyu atlar): yarı yeni yanınca (dokunuş ya da ipucu) 420 ms beyaz (açık temada hat rengi) parlama; kazanınca dalgayla (`110 + d·45` ms). Durum `G.brFx`'te; ilk çizimde yalnız kaydedilir, açılışta yanık gelen yarı parlamaz.
- `vis(i)` karanlıktaki köprüyü gizler. Bütün döngüler yalnız köprü hücrelerinde (≤ 2); kare başına sabit birkaç çağrı. Köprüsüz bölümde kanca hiç çağrılmaz.

**Kural kartı:** 96 px karo. Önce alt geçidin sol parçası, kısa bir aradan sonra (tren köprünün altında) sağ parçası vurgu renginde yanar; sonra üst hat mavi (#4cc9ff) yukarıdan aşağı yanar; iki renk hiç karışmaz. Yalnız `transform/opacity` canlanır. Pencere kapalıyken durur. Hareketi azalt: canlanma yok, iki yarı yanık durur.

**Kayıt:** Çekirdeğin ortak imza kuralı (`sig = hashStr(sol)`) yeterli. İmzasız eski kayıt yalnız 209 öncesinde yüklenir. İmza tutuyorsa köprü hücresi zorunlu olarak 15'tir, çünkü `sol[B] = 15` ve 15'in her dönüşü 15'tir. Doğrulayıcının "pv 5 ya da cur[B] ≠ 15 ise yükleme" düzeltmesi böylece karşılandı.

**Robot testleri (`tools/hakem/kopru.cjs`, 11 kontrol)**

1. `bridge.gen`: 3200 bulmaca. Boyutlar 4×4, 5×6, 6×8, 7×9. Kombinasyonlar: yalın (300 tohum), sabit, eşli, ters+sayaç, karanlık, iki merkez, hepsi (100'er tohum). İki merkez yalnız ≥ 6×8. Her bulmacada `lit(sol)` çözülü, iki yarı bağlı (`own > 0`, `ownB > 0`) ve boş hücre yok. Köprü 15, sabit, eşli, ters ya da sayaçlı değil, birim değil. Köprü iç bölgede, merkeze ≥ 2, köprüler arası ≥ 3. `split` ile `bridge` tutarlı. Hazır çözülü bulmaca yok.
2. `bridge.split`: 3×3 sabit regresyonlar. `[4,6,12,3,15,9,2,11,8]` çözülü. Sahte `[4,6,8,3,15,8,2,11,8]` çözülü değil: D–B yarısına yalnız K–G üzerinden varılıyor. Aynı düzeni eski kavşak `lit`'i "çözüldü" sayar.
3. `bridge.two`: İki merkez + köprüde `merged` hiç yok ve renk çaprazı var. 3×3 örnekte `own[4] = 1`, `ownB[4] = 2`.
4. `bridge.old`: `puzzleFor(1..208)` ve iki Günün Hattı (2026-10-27, 2027-03-14), köprüden önce ölçülen sabit parmak izine eşit. 209–300, köprü eklentisi `MODS`'tan çıkarılınca da birebir aynı; bu bölüm makas birleşince değişebileceği için sabite bağlanmadı. 1–300'de köprü yok.
5. `bridge.perf`: 301–340 üretimi < 60 ms/bölüm. Bölünmüş `lit` 7×9'da < 150 µs/çağrı.
6. `bridge.card`: Bölüm 301'de kart açılır, canlı demo görünür ve kart açıkken süre durur. Izgara 6×8, tek köprü.
7. `bridge.tap`: Köprüye iki dokunuş: hamle, karo ve `lastTile` değişmez, "Köprü · dönmez" bildirimi çıkar. Ardından `solve()` kazanır.
8. `bridge.mixed`: Köprülü ilk karma bölüm robotla çözülür.
9. `bridge.cross`: Köprüde renk çaprazı olan iki merkezli bölümde tahta, bir istasyon dışında çözülür. `merged` yok. K–G ve D–B pikselleri kendi hat renginde, alt geçit boşluğu D–B renginde değil. Son dokunuşla kazanılır.
10. `bridge.save`: İmzasız (pv:4) ya da imzası tutmayan, köprüsü 5 yazılmış yarım oyun yüklenmez. Doğru imzalı yarım oyun sürer.
11. `bridge.errors`: konsol hatası yok.

Ekran görüntüleri: `kopru-kart`, `kopru-oyun`, `kopru-iki-merkez`.

**Ölçümler (bu uygulamada, Chromium)**

| Ölçüm | Sonuç |
|---|---|
| Zorluk, 7×9, 150 tohum, köprü 0 / 1 / 2 | 13,63 / 13,71 / 11,95. 2 köprü ~1,7 puan kolaylaştırır; doğrulayıcının ölçümünde 1 köprü de ~1,5 kolaylaştırıyordu. Etki tohuma bağlı, `pick()` telafi ediyor |
| `pick()` hedefi | 304: 14,3 (hedef 14,16) · 800: 16,0 (15,90) · 352 (final, hedef +2 = 16,61): 17,1 |
| Yerleşim, istenen 2 köprü (500 tohum) | 6×8 ve 7×9: 2,00 · 5×6: 1,73 · 4×4: 1,00 |
| İki merkez, 6×8 / 7×9 | Bulmaca başına 0,44 / 0,37 renk çaprazı; aç merkez 0/500 |
| M11 hattı (301–352) | Bölüm başına ortalama 1,98 köprü |
| Karma hatlar, 353–1000 | 648 bölümün 114'ünde köprü, 5'inde köprü + iki merkez |
| Süre | Üretim ~12 ms/bölüm (301–340, pick + zorluk). `lit` 7×9 + 2 köprü ~8 µs (köprüsüz ~7 µs) |

**Bilinen sınırlar**

- İki merkezli küçük ızgarada (3×3, 4×4) merkez aç kalabilir (`sol[hub2] = 0`). Sorun kodda zaten var, köprü onu artırır. Oyunda iki merkez + köprü yalnız ≥ 6×8'de (301+ bölümlerin hepsi ≥ 6×8) gelir; orada 0/500. Doğrulayıcının önerdiği `pick()` elemesi çekirdek değişikliği olduğu için yapılmadı; robot bu birleşimi ≥ 6×8 ile sınırlar.
- Halka ile aynı bölüme girmez (`clash`). Halkanın 2-çekirdeği bölünmüş düğümle hesaplanırsa yasak kalkabilir.
- `tree()` yardımcısı bölünmüş düğümü bilmez: köprüyü kavşak gibi görür. Tabela tasarımı bu yüzden köprü komşusunu dışlar (`C.br`). Bu yardımcıyı kullanacak yeni kurallar da köprü komşusunu dışlamalı.
- Kart demosu tek karodur. "Soldan gelen sağa" komşu karolarla değil, metin ve ışığın sırasıyla anlatılır.

**Plan → uygulama**

| Plan | Durum |
|---|---|
| 0, 11 Kart, `RULE_LINE` | `card` ve `line: 10` (çekirdek `loadRules` yazar) |
| 1 `generate` | `pre(C)` ve `C.onTake`. `free` ve tabla dışlaması `C.keep/busy` ve `C.br` ile |
| 2 `lit` | Çekirdekte hazır (`P.split`, `dB/ownB`). Alan adları planla farklı: `dEW/ownEW` yerine `dB/ownB` |
| 3 `difficulty`, `pick` | Değişiklik yok. `P.bad` elemesi yapılmadı (bilinen sınırlar) |
| 4 `puzzleFor` | `amount` |
| 5 `rulesFor` CLASH | Çekirdekte hazır; `clash: ['ring']` |
| 6 `pointerdown` | `block` (bildirim, ses, titreşim ve basma animasyonu çekirdekte) |
| 7 `draw` | `rails` ve `under` kancaları. Parlama da kancada; çekirdek bölünmüş karoyu atlar |
| 8, 9 İpucu, baştan | Değişiklik yok (`cur = sol = 15`) |
| 10 Kayıt | Ortak imza kuralı (yukarıda) |
| 12 CSS | `css` alanı, `.rd-bridge*` sınıfları |
| 13 `BOLUM_TASARIMI.md` | Bu görevin kapsamı dışında, dokunulmadı |
| 14 Hakem | `tools/hakem/kopru.cjs` (yukarıda) |

## Kural kartı metni

<b>Köprüde</b> iki hat üst üste geçer ama <b>birleşmez</b>: soldan gelen sağa, üstten gelen alta gider. Köprü dönmez; <b>dört ucuna</b> da ray bağla.

## Görünüş

╫ benzeri: üstteki (kuzey–güney) ray kesintisizdir ve iki yanında ince korkuluk çizgileri vardır. Alttaki (doğu–batı) ray ortada boşlukludur, yani alt geçittir. Köprü dört yönlü kavşaktan biçimiyle ayrılır, renge dayanmaz.

## Mekanik

Köprü karosunun dört kolu vardır (cur = sol = 15), ama karo iki ayrı düğümdür: kuzey–güney (KG) yarısı ve doğu–batı (DB) yarısı. Işık köprüden düz geçer, dönmez. İki yarının her biri ayrı ayrı merkeze bağlanmalıdır.
Dört yönlü kavşaktan farkı: kavşakta dört kol birbirine bağlıdır ve iki koldan merkeze ulaşmak döngü demektir. Köprüde KG ve DB yarıları merkeze bağımsız yollarla ulaşabilir; 'döngü yasak' sezgisi köprüde geçmez.
İki merkezde iki renk köprüde karışmadan çaprazlanabilir. Metro temasına en doğal uyan topoloji kuralı budur.

## Üretim ve çözülebilirlik kanıtı

Prim'den ÖNCE, yalnız x.bridge varken (R() başka durumda tüketilmez). Adj altyapısı GEREKMEZ.
Köprü hücresi seçimi:
- iç bölgede (kenara ≥1),
- hub ve hub2'ye Manhattan ≥2 (merkez hiçbir köprünün komşusu olmaz),
- başka köprülere Chebyshev ≥3 (ortak komşu yok).
Uygun yer bulunamazsa üretici sessizce daha az köprü koyar.
Köprü B için sol[B]=15 ve inT[B]=true; frontier B'ye hiç girmez. Kol grupları tanımlanır: grp[N]=[S,bitS,bitN], grp[S]=[N,bitN,bitS], grp[W]=[E,bitE,bitW], grp[E]=[W,bitW,bitE].
Prim'de 'inT[b]=true; addF(b)' yerine take(b) çağrılır: take = j => { inT[j]=true; addF(j); const g = grp[j]; if (g && !inT[g[0]]) { sol[j] |= g[1]; sol[g[0]] |= g[2]; take(g[0]); } }. Başlangıçta take(hub) ve take(hub2) çağrılır.
KANIT: N ile S her zaman birlikte ağaca girer. Eklenme anında S ağaçta olmadığı için döngü oluşmaz. Köprüler çıkarılınca ızgara bağlı kalır (seyrek iç hücreler) ve sanal N–S, W–E kenarları eklenir; Prim bu grafikte yayılan ağaç kurar. Dolayısıyla sol, bölünmüş düğümlü grafikte yayılan ağaçtır ve bölünmüş lit(sol) çözülüdür.
rot(15)=15 olduğundan köprü karıştırılmaz. Sabit/eşli (sol!==15), ters (per 4), sayaç (per>1) ve 'çözülmüş gelmesin' (rot(v)!==v) adayları köprüyü zaten dışlar. YENİ: tabla adaylarına !br[i] eklenir; tabla köprüyü başka hücreye taşırsa köprü kimliği bozulur.
DOĞRULAMA (kendi prototipim, hakem12/check.js): 6×8 ve 7×9'da 600 bulmacada bölünmüş lit(sol) 0 hata verdi, boş hücre yok, istenen 3 köprüden ortalama 2,91'i yerleşti.

## Kazanma koşulu

lit() düğüm böler. Kuyruktaki u için hücre i = u mod n. Köprüde u<n ise yalnız N|S (5), u≥n ise yalnız E|W (10) kolları yürür. Varılan komşu j köprüyse ve varış biti E ya da W ise düğüm n+j, değilse j olur.
d ve own n uzunlukta kalır (KG yarısı); P.br varken ek dEW ve ownEW dizileri tutulur. Çizim, hud ve reveal 'yanıyor mu' sorusunu sorduğunda d[B] iki yarının yanan küçüğü olur.
solved = loose===0 && !merged (own ya da ownEW'de 3 yok) && her hücre bağlı && her köprüde dNS≥0 ve dEW≥0.
P.br yoksa eski kod yolu birebir çalışır. pointerdown ve draw'daki d.forEach((v,j)) ile litAt kalıpları bozulmaz.

## Dokunma

Köprüye dokunmak hamle sayılmaz, karo dönmez. pointerdown'da fixed kontrolünden sonra pinned kalıbıyla: if (G.br?.[i]) { haptic('light'); press.set(i, now); kick(); if (!G.brTold) { toast('Köprü · dönmez'); G.brTold = true; } return; }. Bugün sol=15 kavşağa dokunmak boşuna hamle sayıyor; köprüde bu olmaz.

## Çizim

2) Ray geçişlerinde (sönük, ışıma, yanan) köprü hücresi rails() içinde özel çizilir. KG yarısı own(i) rengiyle railPath(X[i], 5) olarak çizilir. DB yarısı ownEW rengiyle, merkezden ±s·.17 boşluk bırakan iki kısa parça olarak aynı yola eklenir (alt geçit). Toplu çizim korunur.
Ek tek yol: korkuluklar. KG rayına paralel, ±s·.14 uzaklıkta, s·.4 boyunda iki kısa çizgi; pal.mut, lineWidth 2 (+1 stroke). vis() karanlıkta gizler.
Animasyon yok, kare başına +1 çağrı. Renk körü dostudur, biçimle (╫) okunur.

## Zorluk çözücüsü ve robot

difficulty(): köprüde C0 = [0] olur (rn(15,r)=15 ve seen tek değere iner). Değişiklik gerekmez. Komşuların köprüye bakması gerektiği yerel elemeden kendiliğinden çıkar. dfs yaprağındaki lit() bölünmüş olduğu için sonuç doğrudur.
Robot solve(): köprüde cur===sol olduğu için k=0, dokunmaz; DEĞİŞİKLİK GEREKMEZ.
hakem testleri:
- 300 tohumla {bridge:2} üretilir; lit(sol).solved olmalı ve her köprünün iki yarısı bağlı olmalı.
- DB yarısına yalnız KG üzerinden ulaşılan sahte bir cur çözülü SAYILMAMALI.
- {two:true, bridge:2} ile iki renk köprüde kesişip merged=false kalmalı.
- Köprüye dokununca moves değişmemeli.
- lit süresi ölçülmeli (60 ms/bölüm sınırı).

## İpucu, baştan, kayıt

İpucu: köprü hiç yanlış olmaz (cur = sol = 15), seçilmez.
↺ baştan: köprüler tohumdan gelir.
Kayıt: cur'da 15 olarak durur, yeni alan yok. Ortak sig kuralı yeterlidir.

## Öteki kurallarla karışım

Sabit/eşli/ters/sayaç: köprünün per değeri 1 olduğundan hiçbirinin adayı olamaz; mevcut kod zaten eler.
Makas: çakışmaz. Tabla: tabla adayları !br[i] (yeni şart).
Karanlık tünel: köprü merkezden ≥2 uzakta. N yanınca S (Manhattan 2) FOG_R=2 içinde aydınlanır; 'ağaç komşusu görünür' değişmezi korunur.
İki merkez: en güçlü karışım. İki renk köprüde kesişir; merged yalnız aynı yarıda iki etiket olursa oluşur.
Tabela: köprü komşularına tabela konmaz. Böylece 'ebeveyn köprünün hangi yarısı' ayrımı gerekmez.
Halka: CLASH ring:['bridge'], çünkü 2-çekirdek bölünmüş düğümle hesaplanmadıkça yanlış halka görür. İleride 2-çekirdek bölünmüş düğümle yapılırsa yasak kaldırılabilir.
Tünel ağzı: köprü içte, geçit kenarda; bağımsızdır.

## Kural kartı demosu

.rdemo7: tek büyük karo (96 px). ::before yatay alt rayı çizer: ortada 22 px boşluk bırakan, linear-gradient ile iki parça. ::after dikey üst rayı ve box-shadow ile iki ince korkuluğu çizer.
@keyframes: 0–40% arasında yatay ray var(--acc) ile soldan sağa dolar (background-size). 50–90% arasında dikey ray ikinci renkle (#4cc9ff, .rdemo5'teki gibi) yukarıdan aşağı dolar. İki renk ortada hiç karışmaz.
Altında 1 cümle: 'Köprüde iki hat kesişir ama birleşmez.'

## Zorluğa etkisi

Kendi ölçümüm (7×9, 150 tohum, bölünmüş lit'li difficulty): 0 köprü 13,69; 1 köprü 13,67; 2 köprü 11,87; 3 köprü 12,07. Yani 2 ve üstü köprü komşuları zorladığı için yaklaşık 1,6 puan kolaylaştırır. pick() telafi eder (tabla ve makasta hedefin tuttuğunu ölçtüm).
Öneri: x.bridge = intro ? 1 : 2; karma hatta en çok 2. Gerçek kazanç insan tarafında: 'iki hat kesişebilir' ve iki merkezle renk çaprazı.

## Riskler

(1) Görsel olarak sol=15 kavşağa benzer; korkuluk ve alt raydaki boşluk şart, kart demosu bu farkı göstermeli.
(2) lit sıcak yolda çalışır (her dokunuş ve DFS yaprağı); ek dizileri yalnız P.br varken ayır.
(3) d/own'u 2n'e çıkarmak pointerdown'daki d.forEach ve litAt kullanımını bozar; ayrı dEW/ownEW şart.
(4) İki merkezde merged denetimi iki yarı için ayrı yapılmazsa çapraz geçiş yanlışlıkla 'karıştı' sayılır.

## Doğrulayıcının kararı

Çözülebilir: evet · Uygulanabilir: evet · Tutulsun: evet

**Karşı örnek / risk:** ÇÖZÜLEMEZLİK KARŞI ÖRNEĞİ BULUNAMADI. Önerinin üreticisini ve bölünmüş lit'ini birebir uyguladım; game.js'in gerçek generate/lit/difficulty metni çıkarılıp yamalandı, kod değişmedi. Test betikleri: /tmp/claude-0/-home-user-mobil-oyun/bb21aa69-f6d1-52e7-9b31-ec2477378b24/scratchpad/kopru/bridge.cjs ile t1.cjs–t6b.cjs.
- Kapsam: 3×3…7×9 ızgara × {yalın, sabit, eşli, ters, sayaç, karanlık, iki merkez, hepsi birden, iki merkez+karanlık} × 1/2/3 köprü × 150 tohum = 28 350 bulmaca. Sonuç: 0 tane çözülemeyen sol, 0 hazır çözülü bulmaca. Köprü hiçbir bulmacada sabit, eşli, ters, sayaçlı ya da merkez olmadı.
- Robot: pointerdown kurallarını ve karanlıkta yalnız görüneni çeviren solve() mantığını taklit eden robot, 28 350 bulmacanın hepsini çözdü; köprüye hiç dokunmadı.
- Köprüsüz bölümler: eski ve yeni üretici 6000 örnekte birebir aynı çıktı verdi, yani köprü yokken R() tüketilmiyor.

ÖNERİDE BULDUĞUM KUSURLAR:
(1) ÇİZİM: Önerilen ±s·.17 boşluk, round lineCap yüzünden kapanıyor. Alt ray parçasının görünür ucu ±.085s'ye, yani KG rayının tam kenarına geliyor; korkuluk da bu uca yapışıyor. Telefon boyunda (s=46, dpr 2) çizip baktım: köprü, üstünde çentik olan bir kavşak gibi okunuyor. Görüntü: /tmp/claude-0/-home-user-mobil-oyun/bb21aa69-f6d1-52e7-9b31-ec2477378b24/scratchpad/kopru/glyph.png (orta sütun öneri, sağ sütun düzeltilmiş hâli).
(2) Bölünmüş lit ZORUNLU, isteğe bağlı değil: Tam çözücüyle 5×6 tohum 150474 ve 649371'de, eski lit'in (köprü = kavşak) "çözüldü" dediği ama merkezden kopuk bir parçanın yalnız köprü üzerinden bağlandığı düzenler buldum. Elle kurulmuş 3×3 karşı örnek: cur=[4,6,8,3,15,8,2,11,8], hub=0, köprü 4. Eski lit sonucu true, bölünmüş lit sonucu false.
(3) İki merkezli küçük ızgarada merkez aç kalabiliyor (sol[hub2]=0). Oranlar: 3×3'te %58 (köprüsüz de %9 vardı, yani sorun kodda zaten var, köprü artırıyor), 4×4'te %1,7, 5×6'da %0,2. Oyunda iki merkez+köprü yalnız ≥6×8'de geliyor; orada 2000 örnekte 0. Bugün zararsız ama hakem testi buna göre sınırlanmalı.
(4) Kayıt: pv:4 ile kalmış bir yarım oyun, 301+ bölümler yeni üreticiyle değiştiğinde aynı uzunlukta olduğu için yüklenir. Köprü hücresine 15 olmayan bir değer gelir ve köprüye dokunulamadığı için tahta yalnız 💡 ipucu ya da ↺ baştan ile kurtulur.
(5) draw() 3) parlama geçişi railPath(X[i], 15) çizer, yani köprü 420 ms boyunca "+" görünür.
(6) Önerilen "DB yarısına yalnız KG üzerinden ulaşılan sahte cur" testi tanımsız, çünkü iki yarı ayrık düğümdür. Ayrıca 1200 yarıda tam aramayla "her hücre yanıyor, açık uç yok, bir yarı kopuk" durumu bulunamadı. Yarı şartı ucuz bir güvence olarak kalsın, ama test (2)'deki sabit örneklerle yazılmalı.
(7) Zorluk beyanı yanlış: Tek köprü de 7×9'da puanı ~1,5 düşürüyor (13,81 → 12,33; 2 köprüde 12,01). Yine de pick() hedefi tutuyor: hedefe ortalama uzaklık köprüsüz 0,05–0,23, köprülü 0,20–0,60 (l=304/520/800). Üretim ~12 ms/bölüm.

İki merkezde renk çaprazı gerçekten oluşuyor: iki merkezli köprülü bulmaca başına ~0,42 köprüde iki yarı farklı renkte.

### Zorunlu düzeltmeler

- Çizim: DB alt ray parçaları kenardan (±.5s) iç uç ±.31s'ye kadar çizilmeli; round cap ile görünür uç ±.225s olur. Korkuluklar ±.17s'de, boy .5s, lineWidth max(2, s·.045). Önerideki ±.17s boşluk round cap yüzünden kapanıyor ve köprü kavşağa benziyor (render ile doğrulandı).
- draw(): sönük/ışıma/yanan raylar yarı bazında seçilmeli, on(i) ile değil. Köprüde KG yarısı own[i]===t ise railPath(X[i],5), DB yarısı ownEW[i]===t ise brPath(X[i]). tags hesabı ownEW'yi de taramalı.
- draw() 3) parlama geçişi: köprüde railPath(X[i], cur=15) yerine KG(5)+brPath çizilmeli; yoksa 420 ms boyunca '+' görünür.
- lit(): P.br yoksa eski gövde birebir çalışmalı. P.br varsa düğümler 2n olmalı (DB yarısı n+i), ayrı dEW/ownEW dizileri tutulmalı. Görünür d[B] iki yarının yanan küçüğü olmalı. solved ifadesine 'her köprüde dKG>=0 && dEW>=0' eklenmeli; merged için own veya ownEW'de 3 aranmalı. Bölünmüş lit zorunludur: eski lit, köprü üzerinden bağlanan kopuk parçayı kabul ediyor (3×3 örnek [4,6,8,3,15,8,2,11,8]).
- Yarım kayıt: pv 4→5 yapılmalı (ya da ortak sig kuralı). start()'ta G.br varken run.cur'da köprü hücresi 15 değilse kayıt yok sayılmalı.
- generate(): hub2<0 iken ikinci merkez mesafe kontrolü atlanmalı. İki merkezde aç kalan merkez (sol[hub]===0 || sol[hub2]===0) adayı pick()'te elenmeli (diff=Infinity) ya da hakem testi iki merkez+köprüyü ≥6×8 ile sınırlamalı. Bu sorun 3×3/4×4'te kodda zaten var, köprü onu artırıyor.
- Hakemdeki 'sahte cur' testi yeniden yazılmalı. Önerideki tanım mümkün değil. Yerine üç sabit 3×3 regresyonu konmalı: pozitif [4,6,12,3,15,9,2,11,8] → true; negatif [4,6,8,3,15,8,2,11,8] → false (eski lit true); iki merkez hub0/hub2=8 [2,12,4,2,15,13,2,9,1] → solved, merged=false, own[4]=1, ownEW[4]=2.
- Köprüsüz bölümlerin değişmediğini kilitleyen hakem testi eklenmeli: puzzleFor(1..300) ve dailyFor için cur+sol özeti değişiklik öncesi sabite eşit olmalı.
- Belgedeki zorluk etkisi düzeltilmeli: 1 köprü de ~1,5 puan kolaylaştırır. pick() telafi ediyor; kod değişmez.
- rulesFor'a CLASH süzgeci eklenmeli (bugün kodda yok). İleride ağaç yapısını (ebeveyn yönü, döngü, 2-çekirdek) okuyan bir kural (halka, tabela vb.) ya bölünmüş düğümle hesaplanmalı ya da köprüyle aynı bölüme girmemeli.
- Kural kartı demosu: prefers-reduced-motion'da global kural animasyonu tek karede bitirir. .rdemo7 için iki yarının yanık hâli statik olarak gösterilmeli.

### Doğrulayıcının uygulama planı

0) SABİTLER / KAYIT DEFTERİ
- RULE_LINE = { pins:2, pairs:3, rev:4, fog:5, cnt:6, two:7, /*M9 kuralı:8*/ bridge:10 }.
- RULES[10] = { name:'Köprü', tag:'Yeni: köprü',
  demo:'<div class="rdemo7" aria-hidden="true"><i class="w"></i><i class="e"></i><i class="ns"></i><i class="g l"></i><i class="g r"></i></div>',
  text:'<b>Köprüde</b> iki hat üst üste geçer ama <b>birleşmez</b>: soldan gelen sağa, üstten gelen alta gider. Köprü dönmez; <b>dört ucuna</b> da ray bağla.' }.
- sizeFor() değişmez: RULES[10] olduğu için 301–303. bölümler 6×8 gelir.

1) generate(cols, rows, seed, pins, pairs, x)
Eklenecek yer: hub/hub2 ve inT tanımlarından sonra, frontier'den önce.
  const br = new Array(n).fill(false), grp = {};
  if (x.bridge) {                       // R() yalnız burada tüketilir
    const far = (bx, by, h) => h < 0 || Math.abs(bx - h % cols) + Math.abs(by - (h / cols | 0)) >= 2;
    const B = [];
    for (let t = 0; t < 200 && B.length < x.bridge && cols > 2 && rows > 2; t++) {
      const bx = 1 + (R() * (cols - 2) | 0), by = 1 + (R() * (rows - 2) | 0), i = by * cols + bx;
      if (!far(bx, by, hub) || !far(bx, by, hub2)) continue;
      if (B.some(j => Math.max(Math.abs(j % cols - bx), Math.abs((j / cols | 0) - by)) < 3)) continue;
      B.push(i);
    }
    for (const b of B) { br[b] = true; sol[b] = 15; inT[b] = true;
      grp[b - cols] = [b + cols, S, N]; grp[b + cols] = [b - cols, N, S]; grp[b - 1] = [b + 1, E, W]; grp[b + 1] = [b - 1, W, E]; }
  }
  const take = j => { inT[j] = true; addF(j); const g = grp[j]; if (g && !inT[g[0]]) { sol[j] |= g[1]; sol[g[0]] |= g[2]; take(g[0]); } };
- 'addF(hub); if (hub2 >= 0) addF(hub2);' → 'take(hub); if (hub2 >= 0) take(hub2);'
- Prim içinde: 'inT[b] = true; addF(b);' → 'take(b);'
- free = i => ... && !br[i]. R tüketimi değişmez, köprü zaten aday değildi.
- return {..., ...(br.includes(true) ? { br } : {})}. Köprüsüz bölümde P.br olmaz ve eski lit yolu çalışır (6000 örnekte birebir aynı olduğunu doğruladım).
- (Önerilen ek) if (hub2 >= 0 && (!sol[hub] || !sol[hub2])) P.bad = true. pick() içinde: P.diff = P.bad ? Infinity : difficulty(P).
KANIT (değişmez): Bir köprünün N/S (W/E) komşularından ağaca İLK giren take() ile girer. Komşular merkez değildir ve her hücre en çok bir köprünün komşusudur (Chebyshev ≥3). O anda karşı komşu ağaçta olmadığından sanal kenar (N–KG–S) eklenir ve döngü oluşmaz. Köprüler çıkarılınca ızgara bağlı kalır, çünkü köprüler seyrek ve iç bölgededir. Dolayısıyla sol, bölünmüş düğümlü grafikte yayılan ağaçtır. Karıştırma: rot(15)=15 olduğundan köprü değişmez; öteki karolar yalnız oyuncunun geri alabileceği dönüşlerle karıştırılır.

2) lit(P)
  const { cols, rows, cur, hub, hub2 = -1, br } = P;
  if (!br) { /* eski gövde birebir */ }
  d, own, dEW, ownEW = n uzunlukta; loose = 0;
  her merkez (h, tag) için: dd = new Array(2n).fill(-1); q = [h]; dd[h] = 0;
    for (qi = 0; qi < q.length; qi++) {     // shift yerine indeks
      u = q[qi]; i = u % n; ew = u >= n;
      ew ? (ownEW[i] |= tag, dEW[i] = min) : (own[i] |= tag, d[i] = min);
      m = br[i] ? (ew ? 10 : 5) : cur[i];
      DIRS üzerinde: (m & b) yoksa geç; dışarı ya da !(cur[j] & o) ise loose++;
        v = br[j] && (o === E || o === W) ? n + j : j;  dd[v] < 0 ise kuyruğa ekle.
    }
  dKG = d.slice(); halves = true;
  her köprü i için: (dKG[i] < 0 || dEW[i] < 0) ise halves = false; d[i] = iki yarının yanan küçüğü.
  merged = own.includes(3) || ownEW.includes(3);
  return { d, own, ownEW, dKG, dEW, merged, n: d.filter(v >= 0).length, solved: loose === 0 && !merged && halves && d.every(v >= 0) };
- reveal, nearLit, win, litAt ve pointerdown'daki gained hesabı birleşik d ile değişmeden çalışır.

3) difficulty() ve pick(): DEĞİŞİKLİK YOK. Köprüde C0 = [0] olur; yaprak lit bölünmüş olduğu için doğrudur. pick() yalnız isteğe bağlı P.bad elemesini alır.

4) puzzleFor(l): x.bridge = U.has('bridge') ? (intro && ln === RULE_LINE.bridge ? 1 : 2) : 0. Karma hatlarda en çok 2.
   cached(): br paylaşılır, değişmez dizi olduğu için kopyalamak gerekmez.

5) rulesFor(l): RULE_LINE güncellenir. Ayrıca CLASH = { bridge: [...] } süzgeci eklenir: set kurulduktan sonra çakışan çiftten biri, h ile deterministik olarak atılır.

6) pointerdown: 'G.fog && !G.seen[i]' ve 'G.pinned[i]' satırlarından sonra:
  if (G.br?.[i]) { haptic('light'); tone(220, .05, .015); press.set(i, now); kick(); if (!G.brTold) { toast('Köprü · dönmez, iki hat ayrı geçer'); G.brTold = true; } return; }
  moves, lastTile ve anim değişmez.

7) draw()
- Yardımcı: function brPath(T) { const [x, y, , sc] = T, L = vg.s / 2 * sc, g = .62 * L; cx.moveTo(x - L, y); cx.lineTo(x - g, y); cx.moveTo(x + L, y); cx.lineTo(x + g, y); }
- const BR = G.br, ownEW = i => G.L.ownEW?.[i] || 0;
- tags = [1, 2, 3].filter(t => G.L.own.includes(t) || G.L.ownEW?.includes(t));
- const railsT = t => { cx.beginPath(); for (i) { if (!vis(i)) continue; if (BR?.[i]) { if (own(i) === t) railPath(X[i], 5); if (ownEW(i) === t) brPath(X[i]); } else if (own(i) === t) railPath(X[i], G.cur[i]); } cx.stroke(); };
  Sönük geçiş railsT(0) olur; köprüsüz hücrede own 0 ile d<0 eşdeğerdir. Işıma ve yanan geçişler railsT(t) olur. Toplu çizim korunur.
- Korkuluk (yanan geçişten sonra, tek yol, kare başına +1 çağrı):
  if (BR) { cx.beginPath(); for (i) if (BR[i] && vis(i)) { const [x, y, , sc] = X[i], o = s * .17 * sc, h = s * .25 * sc; cx.moveTo(x - o, y - h); cx.lineTo(x - o, y + h); cx.moveTo(x + o, y - h); cx.lineTo(x + o, y + h); } cx.lineWidth = Math.max(2, s * .045); cx.strokeStyle = pal.mut; cx.stroke(); }
- 3) Parlama: BR?.[i] ise railPath(X[i], 5) ve brPath(X[i]), değilse eski railPath.
- 6c karanlık örtü değişmez; vis() karanlıktaki köprüyü de gizler. Köprü yoksa ek maliyet 0.

8) hint(): değişiklik yok. Köprüde cur === sol olduğundan wrong listesine girmez.
9) reset(): değişiklik yok. Köprüler tohumdan gelir; fixed korunur.
10) saveRun(): pv: 5. start(): if (run && ... && run.pv === 5 && !(G.br && run.cur.some((v, i) => G.br[i] && v !== 15))) { yükle }
11) ruleCard(): değişiklik yok; RULES[10].demo kullanılır.

12) style.css (.rdemo5'in yanına)
.rdemo7{position:relative;align-self:center;width:96px;height:96px;margin:6px 0 2px;border-radius:24px;background:var(--tile);box-shadow:inset 0 0 0 1px var(--stroke)}
.rdemo7 i{position:absolute;border-radius:7px;background:var(--rail)}
.rdemo7 .w,.rdemo7 .e{top:41px;width:24px;height:14px;animation:brw 3.6s ease-in-out infinite}
.rdemo7 .w{left:0}.rdemo7 .e{right:0;animation-delay:.2s}
.rdemo7 .ns{left:41px;top:0;width:14px;height:96px;animation:brn 3.6s ease-in-out infinite}
.rdemo7 .g{top:24px;width:3px;height:48px;border-radius:2px;background:var(--mut)}.rdemo7 .g.l{left:31px}.rdemo7 .g.r{left:62px}
@keyframes brw{0%,10%{background:var(--rail);box-shadow:none}25%,90%{background:var(--acc);box-shadow:0 0 12px var(--accGlow)}100%{background:var(--rail)}}
@keyframes brn{0%,45%{background:var(--rail);box-shadow:none}60%,90%{background:#4cc9ff;box-shadow:0 0 12px rgba(76,201,255,.6)}100%{background:var(--rail)}}
@media (prefers-reduced-motion:reduce){.rdemo7 .w,.rdemo7 .e{background:var(--acc)}.rdemo7 .ns{background:#4cc9ff}}
Demoda önce yatay hat sarı yanar, sonra dikey hat mavi yanar; ortada boşluk ve korkuluk görünür, iki renk hiç karışmaz.

13) docs/BOLUM_TASARIMI.md: kural tablosuna 'M11 | 301 | 🌉 Köprü' satırı eklenir; zorluk etkisi (~-1,5, pick telafi eder) yazılır.

14) tools/hakem.cjs — yeni 'Köprü' bölümü
 a) Üretici (sayfada R.generate): boyutlar 4×4…7×9, tohum 1–300, kombinasyonlar {yalın, pins, pairs, rev, cnt, fog, two, hepsi} × bridge 1..3.
    Her bulmacada denetle: lit({...P, cur: P.sol}).solved; boş hücre yok (two için yalnız ≥6×8); her köprüde cur = sol = 15, !pinned, link < 0, !rev, cnt < 0, merkez değil, kenarda değil, merkezlere Manhattan ≥2, köprüler arası Chebyshev ≥3; !lit(P).solved.
 b) Sabit 3×3 regresyonları (br = köprü yalnız 4. hücrede):
    [4,6,12,3,15,9,2,11,8] → true
    [4,6,8,3,15,8,2,11,8] → false (P.br'siz eski lit true)
    hub 0 / hub2 8, [2,12,4,2,15,13,2,9,1] → solved, merged=false, own[4]=1, ownEW[4]=2
 c) Tarayıcı: kayıt {level:301} + __rayTest. Kural kartı başlığı 'Köprü', boyut 6x8, G.br'de 1 köprü. tapTile(B) sonrası G.moves ve G.cur[B] değişmez. solve() kazanır; waitModal true döner. Karma bir bölümde (bridge içeren ilk l ≥ 345) de solve() kazanır.
 d) Köprüsüz bölümler değişmedi: puzzleFor(1..300) ve dailyFor(bugün) için cur+sol hash'i değişiklik öncesi sabite eşit olmalı.
 e) İki merkez+köprü: 7×9 300 tohumda hepsi merged=false ve en az birinde own[B] !== ownEW[B].
 f) Kayıt: pv:4 içeren ya da cur[B] = 5 yazılmış run start()'ta yüklenmez.
 g) Süre: puzzleFor(301..340) ortalaması < 60 ms (node'da ~12 ms ölçtüm).
 h) Ekran görüntüsü: koyu ve açık temada köprü ile doğal kavşak aynı karede (shot 'bridge').
