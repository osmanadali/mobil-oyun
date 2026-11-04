# ⬡ Altıgen gün (cumartesi Günün Hattı, deneme)

Dosyalar: `www/altigen.js` (motor), `tools/hakem/altigen.cjs` (robot), bu belge. Kural eklentisi değildir: `RAY_RULES` yerine `window.RAY_HEX` fabrikasıyla yüklenir, hat taşımaz. Oyuncu kararı (3 Kasım): altıgen önce yalnız **cumartesi Günün Hattı** olarak çıkar; beğenilirse sonra hatlara yayılır. Pazar haftanın kuralı günü olarak kalır.

## Kural

- Karo sivri tepeli altıgendir, altı yönü vardır. Her dokunuş saat yönünde **60°** döndürür (6 duruş).
- Amaç kare oyunla aynı: bütün durakları merkezdeki istasyona bağla, açık uç kalmasın. Çözüm kapsayan ağaçtır; bütün karolar bağlı ve hiç eşsiz kol yoksa kol sayısı 2·(n−1) olduğundan kapalı devre kendiliğinden olamaz.
- Tahta büyük bir altıgen: 3 halka (37 karo) ya da 4 halka (61 karo).

## Geometri

- Eksenel koordinat (q, r); yön k ekranda k·60° (y aşağı, saat yönü): 0 doğu, 1 güneydoğu, 2 güneybatı, 3 batı, 4 kuzeybatı, 5 kuzeydoğu. Bit = `1 << k`, karşı yön `(k + 3) % 6`, döndürme `((m << 1) | (m >> 5)) & 63`.
- Komşuluk `adj[i·6 + k]` (tahta dışı −1), tahta başına bir kez kurulur (`board(R)`).
- Yerleşim (`fit`): `geo.s` = karonun düz kenarlar arası genişliği (kare karonun `s`'siyle aynı ölçek: ray kalınlığı, durak, dalga ve kıvılcım boyları aynı formüllerle), `ox/oy` = tahta merkezi. Karo merkezi `x = ox + s·(q + r/2)`, `y = oy + s·√3/2·r`. Tahta genişliği (2R+1)·√3, yüksekliği 3R+2 köşe yarıçapı birimidir.
- Dokunma isabeti (`hit`): piksel → kesirli eksenel → küp yuvarlama. Altıgenin içindeki her nokta tam o karoyu seçer; kenarlar ve köşeler de doğru karoya düşer.

## Üretim

- `generate(R, tohum)`: kare üreticinin aynısı, 6 yönle. Merkezden rastgele sınırla (Prim) kapsayan ağaç; kavşak seyreltme: kolu ≥ 2 olan karo %62 olasılıkla, ≥ 4 olan her zaman sıranın sonuna atılır (60 denemeye dek). Ölçüm (600 tohum): beş-altı kollu karo hiç çıkmaz; şekil payları uç %33, geniş dirsek %18, dar dirsek %16, üçlü %16, düz %10, dörtlü %5, Y %2.
- Karıştırma: her karo 0–5 kez döndürülür; çözülmüş gelirse bir karo çevrilir.
- `par` = döndürülmesi gereken karo sayısı, `taps` = en az dokunuş (karo başına 0–5; simetrik karoda daha az).
- Zorluk puanı (`difficulty`): kare çözücüsünün 6 yönlü kopyası, aynı ölçek (çıkarım turu + 3 × tahmin dalı + 10 × ilk turda elenemeyen oran). `pick`: 6 + 6z aday arasından hedefe (5 + 11z) en yakını.
- Günün Hattı: `daily(gün, z)`, tohum `hashStr('altigen' + gün)`, halka sayısı `z < 0,8 ? 3 : 4`. Masaüstünde ~12 ms (robot eşiği 60 ms).
- Uyumluluk alanları: `hex: true, R, cols, rows (2R+1), adj, hub, hub2: −1, pinned, link, rev, cnt, fixed` (kare oyunun beklediği diziler, hep boş).

## Çekirdekteki dallanma noktaları (`game.js`, `G.hex`)

`dailyFor` (cumartesi ve `base` değilse `HX.daily`), `lit`, `start` (kart ve başlık), `resize` (`HX.fit`), `draw` (`HX.draw`; kare çizimin aynı katmanları), `burst` (`HX.xy`), dokunma (`HX.hit`, `HX.rot`), `nearLit` (ipucu sırası), `plan` (robot), ana sayfa kartı (⬡), arşiv ızgarası (`hex` sınıfı), paylaşım başlığı (⬡). `popc` 6 bit sayar (kare karoda üst bitler hep 0, üretim değişmez). `API`'ye `rng, modal, closeModal, pause, resume, active` eklendi; `window.__ray.HX` robota açık.

## Çizim

Kare oyunla aynı dil ve sıra: zemin (karo rengi, ~3 px boşluk, yuvarlatılmış köşe; yanan karoda hat renginde hafif ton) → sönük ray → yanan hattın ışıması → yanan ray → yeni yanan karoda parlama (karoya kırpılır) → duraklar (yanan: beyaz + hat rengi, sönük: zemin rengi) → merkez istasyon simgesi → ipucu rozeti → dokunma dalgası → kıvılcım. Dönüş animasyonu 60° geriden yaylanarak gelir (kare oyundaki `back` eğrisi), bitişte merkezden dışa nabız. Renk temaları, açık/koyu tema `pal` ve hat rengiyle gelir.

## Bilinen sınır

320 px genişlikte 4 halkalı tahtada karo genişliği 30 px (kare 7×9'da 44 px). Sivri tepeli karoyla 4 halka 9 karo eninde olduğundan genişlik sınırlıdır; dokunma isabeti en yakın merkeze göre olduğundan karonun bütün alanı dokunma alanıdır. Daha iri karo istenirse seçenekler: düz tepeli karo (4 halkada genişlik 14 köşe yarıçapı, 320 px'te ~45 px) ya da cumartesileri hep 3 halka.

## Doğrulama (`node tools/hakem.cjs --only=altigen`)

- `hex.day`: 120 günde yalnız cumartesi altıgen (3 ve 4 halka karışık), pazar haftanın kuralı, `dailyBase` cumartesi eski kare bulmaca.
- `hex.gen`: 600 tohum çözülebilir, çözülmüş gelmez, kapsayan ağaç, komşuluk simetrik, yedi şeklin hepsi çıkar.
- `hex.fp`: iki sayfada aynı, sabit parmak izi (değişirse geçmiş cumartesiler/arşiv değişir).
- `hex.fast`: Günün Hattı üretimi < 60 ms.
- `hex.hit`, `hex.tap`: 1272 noktada isabet; dış halkada gerçek dokunuşla yalnız o karo 60° döner.
- `hex.card`, `hex.home`, `hex.robot`, `hex.daily`: kart bir kez, ⬡ işaretleri, robot `plan()` ile par hamlede 3★, seri/ipucu/🎫/görev/paylaşım.
- `hex.hint`, `hex.resume`: ipucu karosu oturur ve dönmez; yarım oyun ve duraklat.
- `hex.320`: 320×568 koyu/açık temada sığar. `hex.en`: İngilizce ve Almanca metin, sözlükte eksik yok. `hex.arch`: arşivde geçmiş cumartesi altıgen.
- `week.fp` (`gunluk-gorev.cjs`): pazartesi–cuma bit bit aynı; cumartesi parmak izine `dailyBase` girer, sabit değişmedi.
