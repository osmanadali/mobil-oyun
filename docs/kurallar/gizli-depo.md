# M20 · Gizli depo (anahtar: `depot`)

> **Hat düzeni 31 Ekim'de değişti:** bu kural artık **M20** (ilk bölüm 493). Aşağıdaki hat ve bölüm numaraları ve ölçümler eski düzene aittir; güncel tablo `docs/kurallar/README.md`.

> Tasarım başvurusu: `proto-zor` dalındaki `gizli-depo` önerisi (`proto/zor/tasarimlar.json`) ve `proto/zor/gizli/plugins.cjs` içindeki `DEPOT` taslağı. Taslak eski kancalarla (`P.exit` + `edge`, H5 `prune → bool`) yazılmıştı. Bu eklenti main'deki birleşik `open` ve `prune` kancalarını kullanır ve ölçümle yeniden ayarlandı. Kod: `www/rules/gizli-depo.js`, testler: `tools/hakem/gizli-depo.cjs`.

## Kural kartı metni

Kenardaki <b>ayraç</b>: altındaki üç karodan <b>tam biri</b> dışarı, depoya ⌂ çıkar. Hangisi olduğu <b>gizli</b>; ayraç dışında kenar yine duvardır.

## Mekanik

- Tahtanın kenarında 3 karo boyunda köşeli ayraçlar (⌐ ¬) vardır. Her ayracın ortasında, tahtanın dışında küçük bir depo durur.
- Ayracın altındaki 3 kenar karosundan **tam biri** dışarıya, depoya bir kol uzatır. Hangisinin uzatacağı gösterilmez.
- Ayraç dışındaki kenar her zamanki gibi duvardır: dışa bakan kol açık uçtur.
- Miktar: M14'ün ilk bölümünde (469, 6×8) 1 depo, sonra 2, hat finalinde 3.

**Neden zorlaştırır:** Net türünde ilk ve en güvenilir çıkarım kenardan gelir: "kenara bakan kol olamaz". Ayraç bu çıpayı 3 karoda kaldırır. Yerine "3 karodan tam 1" sayım kısıtı gelir; bu kısıt yerel değildir, kenar boyunca işler. Oyuncu ayraç karolarını tahtanın içinden gelen bilgiyle kesinleştirmek zorundadır.

## Üretim ve çözülebilirlik kanıtı

1. **`tree` aşaması (`tOrder` 30: halka ve tünel ağzından sonra, karıştırmadan önce).**
   - Aday kenar: tahta dışına bakan (`C.nb(i, k) < 0`) bir yön. Tünel ağzı kenarları bu yüzden kendiliğinden dışarıda kalır.
   - Aday karo: merkez değil, en çok 2 kollu, `keep` değil, tünel ağzı değil.
   - Seçilen karoya dışa bakan kol eklenir: `sol[i] |= bit(k)`. Bu, ağaca tahta dışında bir yaprak (depo) eklemektir. Kenar silinmez, dolayısıyla döngü ya da hat karışması oluşmaz.
   - Ayraç, `i`'yi içeren 3 ardışık kenar karosudur. Gerçek çıkışın ayraçtaki yeri rastgeledir. Merkez ve tünel ağzı ayraca girmez.
   - İki ayraç ortak karo taşımaz ve aynı kenarda bitişik olmaz. İki çıkış karosu birbirine 4-komşu olmaz.
   - Ayraç karoları `keep` olur. Böylece sabit karo (depoyu ele verirdi), eşli karo ve döner tabla (karoları kenar boyunca taşırdı) bu karolara konmaz. Makas, ters ve sayaçlı karo konabilir.
2. Çekirdek karıştırır; yalnız geri alınabilir işlemler kullanılır. `sol` her ayraçta tam bir çıkış taşır, açık ucu yoktur ve ağaçtır. Bu yüzden `lit(sol)` çözülüdür ve döndürmelerle ulaşılabilir.
3. **`mark` aşaması (adillik).**
   - `api.difficulty(P, leaf, 3000)` ile oyuncunun gördüğü bilgiyle çözümler sayılır. Oyuncu depo yerini bilmez; `lit` de bilmez, yalnız ayracı bilir.
   - Her çözümün anahtarı, depo yerlerinin dizisidir. Tek anahtar varsa bölüm adildir.
   - Birden çok anahtar varsa ya da arama tavana vurursa, yeri ayrışan ayraç gerçek çıkış karosuna daraltılır. Depo görünür olur, böylece bölüm her zaman adildir. Ayrıca aday `P.reject` olur ve seçici gizli kalan bir adayı yeğler.
   - Ölçüm: 900 üretimde daralan ayraç %1–3. Bağımsız sayımda (süzgeç kapalı, tavan 30 000) 120/120 bölümde tek anahtar var ve bu `sol`'un anahtarı.
   - `mark` R() tüketmez.

## Kazanma koşulu

- `open(P, i, k)`: `i` bir ayraç karosu, `k` o ayracın dışa bakan yönü ve kenar gerçekten tahta dışıysa doğru döner. Bu kol açık uç sayılmaz, `L.open` onu sayar. İç kenarda hiç doğru dönmez; simetri kendiliğinden sağlanır.
- `check(P, L)`: her ayraçta dışa bakan kol sayısı tam 1 olmalı. Değilse bozuk sayılır. `L.dpN` ayraç başına sayıyı taşır (çizim ve bildirim).
- Kazanma: her karo yanıyor, açık uç yok, her ayraçta tam bir çıkış var.

## Çözücü (`difficulty`)

- `open` doğru dönen kenar çözücüde serbesttir.
- `prune(P, C, M, unit)` her turda her ayraç için sayım yapar. Kesin çıkış (bütün adaylarda dışa bakan) ve olası çıkış (bazı adaylarda dışa bakan) sayılır.
  - Kesin çıkış > 1 ya da olası çıkış yok: çelişki (−1).
  - Tam 1 kesin çıkış: öbür karoların dışa bakan adayları elenir.
  - Kesin yok ve tek olası çıkış: o karo çıkış olur.
- Süzgeç sağlam: açıkken de 120/120 bölümde tek ve doğru anahtar bulunur. Bu kural, oyuncunun yapacağı sayımın aynısıdır; çözücüyü insana yaklaştırır.

## Ölçümler

Gerçek kodla, `__ray.generate(cols, rows, s·7919, 0, 0, { depot })` ile, aynı tohumlarda kural kapalı ve açık, 160 tohum:

| Boyut | Depo | Kapalı | Açık | Δ | Puanı artan bölüm |
|---|---|---|---|---|---|
| 7×9 | 1 | 14,19 | 15,11 | +0,92 | 118/160 |
| 7×9 | 2 | 14,19 | 16,23 | **+2,04** | 139/160 |
| 7×9 | 3 | 14,19 | 17,35 | +3,16 | 149/160 |
| 6×8 | 1 | 11,59 | 12,67 | +1,08 | 118/160 |
| 6×8 | 2 | 11,59 | 14,47 | **+2,88** | 142/160 |
| 6×8 | 3 | 11,59 | 15,11 | +3,53 | 148/160 |

Prototipin ölçtüğü +4,3'ten düşük çıkmasının iki nedeni var:

- Çözücüdeki sayım süzgeci (`prune`) "tam 1" çıkarımını çözücüye de yaptırıyor. Prototipte bu süzgeç isteğe bağlıydı.
- Ayraç karoları sabit, eşli ve tabla olmaktan dışlandı.

Hat ortalaması (`puzzleFor`, `P.diff`):

| Hat | Ortalama |
|---|---|
| M13 | 16,80 |
| **M14 (gizli depo)** | **18,74** (+1,94) |
| M15 (bilgi için) | 17,6 → 17,9 (karma bölümlere depo da giriyor) |

- **Zorluk payı (`boost`): 3.** Hattın ilk 3 bölümünde pay uygulanmaz (tanıtım). Payla M14 ortalaması M13'ün ~2 puan üstüne çıkar.
- Üretim maliyeti: aday başına ~2–5 ms. M14 bölümü (24 aday) ~60 ms sürer.

## Dokunma ve geri bildirim

- Tek dokunuş, normal dönme. Ayraç ve depo tahta dışındadır ve dokunulmaz.
- Bir ayraç karosuna ilk dokunuşta ömürde bir kez şu bildirim gelir: "Depo · ayraçtaki karolardan yalnız biri dışarı çıkar".
- Bir ayraçta iki çıkış oluşunca ayraç uyarı renginde kesik çizgi olur. Bölümde bir kez "Bir ayraçtan yalnız bir ray çıkar" bildirimi ve hafif titreşim gelir. Açılışta karıştırma iki çıkış gösterse de uyarı ilk dokunuşa kadar çizilmez (sakin açılış).
- Bir depo dolunca (tam bir çıkış, karo yanıyor) kısa iki ton çalar.

## Çizim

- `pad(G, p)`: ayraç bulunan kenarlara .46 karo pay.
- `top(D)` (karanlık örtünün üstünde, her zaman görünür):
  - Ayraç: ince köşeli çizgi, iki ucunda tahtaya dönük kısa dik çizgi.
  - Depo: ayracın ortasında, dışa bakan çatılı beşgen (ev). Tünel ağzının yuvarlak sekmesi ve harfinden biçimce ayrıdır.
  - Dışa bakan kol için karo kenarından ayraca kısa ray çizilir.
  - Boş depo: ayraç ve depo çizgisi `pal.mut`, depo içi boş.
  - Dolu depo: ray, ayraç ve depo hat renginde, depo içi dolu. Bilgi renkle birlikte biçimle de (dolu/boş) verilir.
  - İki çıkış: uyarı renginde kesik ayraç (biçim: kesik çizgi).
- Ayraç başına 3–5 çağrı, en çok 3 ayraç, animasyon yok.
- 360 px genişlikte 7×9 bölümde karo ~40 px; ayraç ve depo okunur (`hakem-out/shots/depot*.png`).

## İpucu, baştan, kayıt

- İpucu değişmez: yanlış karoyu `sol`'e oturtup sabitler. Depo karosuysa depo yeri açığa çıkar; bu beklenen davranıştır.
- ↺ Baştan ve yarım oyun kaydı değişmez. Depo verisi (`P.depot`) üretimden gelir, ek kayıt alanı gerekmez.

## Çakışma ve karışım

- `clash: []`.
  - Prototip `['portal', 'sw', 'table']` öneriyordu. Gözden geçirildi:
  - Tünel ağzı: ağız hücresi ayraca girmez, ağız kenarı zaten `nb ≥ 0` olduğu için aday olamaz. Görsel olarak sekme+harf ile ayraç+çatı ayrışır; aynı kenarda çakışmazlar.
  - Döner tabla: ayraç karoları `keep` olduğundan tabla bu karolara gelmez.
  - Makas: ayraç karosu makas olabilir; çözücü birimi bilir, adillik denetimi de birimle çalışır.
- Ölçülen karışımlar (7×9, 200 tohum; sabit, eşli, karanlık, iki merkez, ters, sayaçlı ile dönüşümlü): makas, köprü, tabela, tabla, halka, tünel ağzı ile 0 hata.
- Karma hat taraması: M14 sonrası depo taşıyan ilk 300 bölümün 180'i öteki kurallarla gelir. Hepsi üretilir, `sol` çözülü, başlangıç çözülmemiş.

## Eski bölümler

- Eklenti R()'yi yalnız `x.depot` sıfırdan farklıyken tüketir. `{depot: 0}` üretimi `{}` ile birebir aynıdır.
- 1–468. bölümler ve Günün Hattı, kural dosyası yüklü ve yüksüz sayfada bit bit aynıdır (robot: `rule.depot.old`).

## Robot testleri (`tools/hakem/gizli-depo.cjs`)

- **`gen`, `win`:** 300 üretim, ayraç biçimi; iki çıkış, çıkışsız ayraç ve delinmiş duvar reddedilir.
- **`fair`:** bağımsız sayımla adillik.
- **`prune`:** süzgeç sağlamlığı.
- **`diff`:** Δ ≥ +1.
- **`zero`:** `{depot: 0}` ≡ `{}`.
- **`old`:** parmak izi.
- **`line`, `ladder`, `mix`:** hat, merdiven ve karma hat taraması.
- **Oyun içi:**
  - `card`: kural kartı.
  - `screen`: ekran yerleşimi.
  - `warn`: bildirimler.
  - `run`: yarım oyun, ↺ baştan, robotun kazanması.
  - `hint`: ipucu.

## Bilinen sınırlar

- Karıştırma, açılışta bir ayraçta 2–3 dışa bakan kol bırakabilir. Uyarı ilk dokunuşa kadar gösterilmez.
- Daralan ayraç (%1–3) tek karoluk ayraç olarak çizilir. Depo yeri o bölümde görünürdür. Seçici bu adayları yalnız başka aday yoksa alır.
- 1 depolu tanıtım bölümünde zorluk artışı küçüktür (+1); bu bilerek böyle bırakıldı.
