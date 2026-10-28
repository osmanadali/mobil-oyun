# Kural eklentileri (M9 ve sonrası)

M9'dan sonraki yeni kurallar çekirdeğe (`www/game.js`) dağılmaz. Her kural üç dosyada yaşar:

| Dosya | İçerik |
|---|---|
| `www/rules/<ad>.js` | Kuralın bütün kodu: üretim, dokunma, kazanma denetimi, çizim, kural kartı ve CSS |
| `tools/hakem/<ad>.cjs` | Kuralın robot testleri; `tools/hakem.cjs` K bölümünde sırayla çağırır |
| `docs/kurallar/<ad>.md` | Kuralın tasarımı, çözülebilirlik kanıtı ve doğrulama notları |

Çekirdek, eklentilere kancalar ve ortak altyapı sunar. Bir kuralı yazan kişi **yalnız kendi üç dosyasını** değiştirir. Çekirdekte zorunlu bir değişiklik gerekirse en küçük hâliyle yapılır ve raporda ayrıca belirtilir.

| Hat | İlk bölüm | Kural | Anahtar | Dosya adı |
|---|---|---|---|---|
| M9 | 209 | Makas | `sw` | `makas` |
| M11 | 301 | Köprü | `bridge` | `kopru` |
| M13 | 409 | Yön tabelası | `sign` | `tabela` |
| M15 | 533 | Döner tabla | `table` | `doner-tabla` |
| M17 | 673 | Halka hat | `ring` | `halka` |
| M19 | 829 | Tünel ağzı | `portal` | `tunel-agzi` |

Çift hatlar (zor kurallar; gizli bilgi ve küresel koşul):

| Hat | İlk bölüm | Kural | Anahtar | Dosya adı |
|---|---|---|---|---|
| M10 | 253 | Kapak | `cover` | `kapak` |
| M12 | 353 | Silik kol | `faint` | `silik-kol` |
| M14 | 469 | Gizli depo | `depot` | `gizli-depo` |
| M16 | 601 | Kapalı durak | `closed` | `kapali-durak` |
| M18 | 749 | Nehir | `river` | `nehir` |
| M20 | 913 | Tarife bölgesi | `zone` | `tarife-bolgesi` |

M20 sonrası hatlar karmadır: her bölüm öğrenilmiş kurallardan 1–2 tanesini taşır (`rulesFor`).

## Temel ilkeler

1. **Eski bölümler bit bit aynı kalır.** Eklenti `R()` rastgele sayısını yalnız kendi miktarı sıfırdan farklıyken tüketir. Çekirdek, eklentisi olmayan bölümde hiçbir kancayı çağırmaz.
2. **Yapı gereği çözülebilir.** Üretim çözümden (`sol`) başlar. Karıştırma yalnız oyuncunun geri alabileceği işlemlerle yapılır. Kanıt `docs/kurallar/<ad>.md` içine yazılır.
3. **Bölüm verisi `P[key]`'de durur.** Eklentinin bölüme özgü verisi üretimde `C.out[key]` alanına yazılır, dönüş nesnesinde `P[key]` olur. Bu alan doluysa (truthy) eklentinin bütün oyun ve çizim kancaları o bölümde çalışır, boşsa hiçbiri çalışmaz.
4. **Tek dokunuş, gerçek zamanlı baskı yok, kendi kendine hareket eden karo yok.**
5. **Renk körü dostu:** işaretler yalnız renge dayanmaz, biçim de taşır.
6. **Ucuz çizim:** aynı stildeki her şey tek yolda toplanır, kare başına birkaç çağrı.

## Eklenti dosyası

```js
// M9 · Makas (anahtar: sw)
(window.RAY_RULES = window.RAY_RULES || []).push(api => ({
  key: 'sw', line: 8,                       // 0 tabanlı hat: M9 → 8
  clash: [],                                 // aynı bölümde birlikte gelemeyeceği kurallar (simetrik)
  card: { name: 'Makas', tag: 'Yeni: makas', demo: '<div class="rd-sw">…</div>', text: '…' },
  css: `.rd-sw{…}`,                          // kural kartı demosu ve gerekirse başka stiller (sınıf adları rd-<anahtar> ile başlar)
  amount: (n, intro, z, fin, cols, rows) => 0,   // bu bölümdeki miktar (0 → kural yok; sıfırdan farklı her değer kuralı açar, ör. tanıtım işareti −1)
  // üretim aşamaları (aşağıda C)
  pre(C) {}, tree(C) {}, shape(C) {}, mark(C) {},
  tOrder: 8,                                 // isteğe bağlı: tree aşamasında sıra (varsayılan line)
  // oyun
  block(G, i) {},                            // dokunuşu reddet: bildirim metni ya da true döndür
  onTap(G, U, i, now) {},                    // bu kuralın birimine dokunuldu (animasyon, ilk dokunuş bildirimi)
  after(G, i, now) {},                       // her dokunuştan sonra, lit hesaplandıktan sonra (geri bildirim)
  check(P, L) { return 0; },                 // kazanma denetimi: bozuk sayısı (0 = tamam); L'ye çizim verisi yazılabilir
  allow(P, i, mask) { return true; },        // zorluk çözücüsü için yerel süzgeç: bu maske i karosunda olabilir mi
  // gizli bilgi ve küresel koşullar (M10–M20 zor kuralları)
  cands(P, i) { return null; },              // gizli karo: oyuncunun bu karo için düşünebileceği maskeler dizisi (null = karo normal)
  open(P, i, k) { return 0; },               // i karosunun k kolu eşi olmadan bitebilir mi (tampon, depo çıkışı); lit ve çözücü
  prune(P, C, M, unit, units) { return []; },// çözücünün her turunda küresel süzgeç (sayım): daralttığı birimler ya da −1 (çelişki)
  reveal(G, on, area) {},                    // karanlık tünel: on(i) karoyu açar, area(i) onun FOG_R çevresini açar
  pad(G, p) {},                              // tahta dışı pay (karo cinsinden): p.l, p.r, p.t, p.b artırılır
  // çizim kancaları (D aşağıda); true dönerse animasyon sürüyor demektir
  xform(D) {}, base(D) {}, under(D) {}, rails(D) {}, over(D) {}, top(D) {},
}));
```

Oyuncuya görünen bütün metinler (kart adı, etiketi ve metni, `block()` mesajı, bildirimler, çizime yazılan etiketler) iki dilli yazılır: `L('Türkçe', 'English')`. Ayrıntı, yazım ilkeleri ve sözlük: [`docs/CEVIRI.md`](../CEVIRI.md). `L` küreseldir; bir işlevin içinde `const L = G.L` gibi bir ad onu gölgeliyorsa metinler eklentinin başında bir `MSG` nesnesine alınır. Robot (`tools/hakem/ceviri-kurallar.cjs`) Türkçe harfli her dizginin `L()` içinde olduğunu, kartların İngilizcede taşmadığını ve iki dilde tahtaların aynı olduğunu denetler.

Yalnız gereken alanlar yazılır. `api` çekirdeğin yardımcılarını taşır: `N, E, S, W, DIRS, FOG_R, PAIR_COLS, rot, unrot, popc, nb, ob, tree, hashStr, rgba, shade, lum, hueRot, okl, oklch, toast, tone, note, haptic, persist, kick, burst, rrp, rr, railPath, ease, back, anim, press, lineName` ve canlı değerler için alıcılar: `api.G, api.pal, api.save, api.geo, api.vg, api.cx`.

Karo maskesi 4 bittir: `N = 1, E = 2, S = 4, W = 8`. `DIRS[k] = [bit, dx, dy, karşı bit]`, sıra K, D, G, B. `rot` saat yönünde 90°, `unrot` tersi.

## Üretim (`generate`) ve C çalışma alanı

Aşamalar ve sırası:

1. **`pre(C)`:** Ağaç kurulmadan önce. Köprü hücresi, tünel komşuluğu (`C.adj`, `C.ao`) ve ikisinin `C.onTake` kancaları burada hazırlanır.
2. Ağaç (Prim): `C.take(j)` hücreyi ağaca alır. `C.onTake` dizisine eklenen işlevler her alınan hücre için çağrılır: köprü karşı kolu, tünel ağzı eş ağzı birlikte alır. Böylece eklenen her kenar ormana yeni bir yaprak ekler, döngü ve hat karışması oluşmaz.
3. **`tree(C)`:** Ağaç bittikten sonra, karıştırmadan önce. Halka kenarı burada eklenir. Sıra `tOrder ?? line`. Ağaçtan kenar SİLMEK yasaktır: köprü yarılarını ve iki merkezin ayrılığını bozar (tünel doğrulamasında karşı örnekle görüldü).
4. Karıştırma (`C.cur`), sabit karo, eşli karo.
5. **`shape(C)`:** Eşliden sonra, ters/sayaçlıdan önce. Makas, döner tabla burada `C.unit(...)` ile birim kurar.
6. Ters ve sayaçlı karo (`C.free(i)` bu aşamada kurulan birimleri dışlar).
7. **`mark(C)`:** Sayaçlıdan sonra, karanlıktan önce. Tabela ve halka işareti burada konur.
8. Karanlık tünel, "çözülmüş gelmesin", par ve dokunuş sayısı (birimler dahil).

C alanları:

| Alan | Anlamı |
|---|---|
| `cols, rows, n, R, x` | ızgara, rastgele sayı üreteci, bölümün kural miktarları (`x[key]`) |
| `sol, cur, inT` | çözüm, karıştırılmış başlangıç (aşama 4'ten sonra), ağaçta mı |
| `hub, hub2, isHub(i)` | merkez(ler); `hub2 = -1` tek merkezde |
| `nb(i, k), ob(i, k)` | komşu karo (yoksa −1) ve komşudaki karşılık bit; `C.adj` varsa onu kullanır |
| `adj, ao` | tünel ağzı: `Int16Array(n·4)` komşu ve `Uint8Array(n·4)` karşılık bit. Yalnız tünelli bölümde kurulur |
| `addF(i), take(j), onTake` | ağaç büyütme |
| `keep[i]` | true → sabit ve eşli karo adayı olamaz (köprü, tünel ağzı) |
| `busy[i]` | true → ters, sayaçlı, "çözülmüş gelmesin" ve öteki eklentiler dokunmaz |
| `unit(cells, K, tap, kind)` | eklenti birimi kurar; hücreleri `busy` ve `unitOf` olur. Dönüş birim numarasıdır |
| `units, unitOf` | birimler ve hücre → birim |
| `pinned, link, rev, cnt, per(m), free(i)` | aşama 4'ten sonra |
| `out` | dönüş nesnesine eklenecek alanlar (`out[key]` zorunlu) |

### Birim (`C.unit`)

Birden çok durum taşıyan, dönmeyen ya da birlikte hareket eden karolar içindir (makas, döner tabla).

- `cells`: birimin karoları.
- `K`: döngü uzunluğu. `K` dokunuş sonra birim başlangıç durumuna döner.
- `tap(cur)`: bir dokunuşu **verilen dizi üzerinde** uygular. Kapanışta `C.cur`'u tutmayın, her zaman parametreyi değiştirin; oyun, zorluk çözücüsü, robot ve par hesabı aynı işlevi kopyalar üzerinde çağırır.
- `kind`: eklentinin anahtarı. Çekirdek dokunuşta `onTap`'i bununla bulur.

Çekirdek birimleri kendiliğinden şöyle işler:

- **Oyun:** dokunuş `tap(G.cur)`'u çağırır. Art arda aynı birime dokunmak 1 hamle sayılır.
- **İpucu:** birimin bütün karolarını çözüme oturtup sabitler. Büyük birimler sona alınır.
- **Zorluk çözücüsü:** birimin `K` durumunu dener.
- **Gizli karo (`cands`):** tek karolu birim olmalı. Çözücü o karonun gerçek maskesi yerine `cands` dizisini aday kabul eder (ör. kapak: görünmeyen ama sabit ray; silik kol: kol var ya da yok). Bölüm, oyuncunun gördüğü bilgiyle tek çözüme inmelidir; üretimde adillik bunu denetler.
- **Par ve robot:** `unitTaps` ile dokunuş sayısını bulur; robot `__ray.plan()` ile dokunur.

## Kazanma (`lit`)

- Komşuluk `nb/ob` ile okunur, tünel komşuluğu kendiliğinden geçerlidir.
- **Bölünmüş düğüm (köprü):** `P.split[i] = 1` olan karo iki ayrı düğümdür. K–G yarısı (bitler 5) `d/own`, D–B yarısı (bitler 10) `dB/ownB` dizilerine yazılır. Çözülmüş sayılması için iki yarı da bağlanmalıdır. Çizim için `d[i]` iki yarının yanan küçüğü olur. Köprü eklentisi `C.out.split` alanını doldurur.
- **Yok sayılan karo (`P.void`):** `P.void[i] = 1` olan karonun rayları yok sayılır (0 maske gibi), ışık almasa da çözüm bozulmaz; ipucu bu karoya verilmez. `L.n` bu karoları yanmış sayar. Kapalı durak eklentisi `C.out.void` alanını doldurur.
- **Eşsiz biten kol (`open`):** `open(P, i, k)` doğru dönerse i karosunun k yönündeki kol, komşusu karşılamasa da (ya da tahta dışına baksa da) gevşek sayılmaz; `L.open` bunları sayar (`L.openBy[anahtar]` kurala göre ayrı). Kaç tane olması gerektiğini eklenti `check` ile denetler. İç kenarda simetrik olmalı: `open(P, i, k)` ile `open(P, j, ters k)` aynı değeri döndürür. Çözücüde bu kenar serbest bırakılır, sayım `prune` ile yapılır.
- **Eklenti denetimi:** `check(P, L)` bozuk sayısını döndürür. Sıfırdan büyükse `L.solved = false` olur. L'ye çizim verisi yazılabilir (ör. `L.signBad`, `L.core`). Bu işlev zorluk çözücüsünün yaprağında da çağrılır, ucuz olmalıdır.

## Oyun ve çizim

- `G` = bölüm (`P`) + oyun durumu (`G.cur`, `G.fixed`, `G.seen`, `G.L`, `G.moves`…).
- `block(G, i)`: sabit/karanlık/sayaç denetimlerinden sonra çağrılır. Metin dönerse ilk seferde bildirim gösterilir.
- `after(G, i, now)`: her dokunuşta, yeni `G.L` hesaplandıktan sonra çağrılır.
- Çizim nesnesi `D`: `G, s (karo boyu), n, X, now, col, on(i), vis(i), own(i), OC, cx, pal, railPath, rrp, rr, rgba, tiles(f)`.
  - `X[i] = [x, y, açı, ölçek]`. `xform` X'i değiştirebilir (tabla dönüş animasyonu); `X[i][4] = true` o karonun zeminini çizdirmez.
  - `on(i)` yanıyor mu, `vis(i)` karanlıkta görünür mü, `own(i)` hangi merkeze bağlı (1, 2; 3 = karışmış), `OC[own]` o hattın rengi.
- Katman sırası:
  1. `xform`
  2. `base`: karo zemininden önce
  3. zemin ve sabit karolar
  4. `under`
  5. raylar (`G.split` ve `G.self` karoları atlanır)
  6. `rails`: bölünmüş karonun ve `G.self` karosunun rayları
  - `G.self[i] = 1` olan karonun rayını, parlamasını ve durak noktasını çekirdek çizmez; eklenti kendisi çizer (ör. silik kol). `C.out.self` ile doldurulur.
  7. parlama, duraklar, merkez, rozetler
  8. `over`
  9. karanlık örtü
  10. `top`: en üstte (tahta dışındaki tünel ağızları)
- `pad(G, p)`: tahta dışında yer gerektiğinde. Çekirdek karo boyunu ve kaydırmayı buna göre hesaplar.

## Ortak alan adları (kurallar birbirini bu adlarla tanır)

| Kural | C / P alanları |
|---|---|
| Makas `sw` | `out.sw`: uzunluğu n olan dizi; makas karosunda iki kolun maskesi, diğerlerinde 0. Birim türü `'sw'`, K = 2 |
| Köprü `bridge` | `out.split`: n uzunlukta 0/1 dizi; `out.bridge`: köprü hücreleri dizisi; `C.br`: aynı dizi; köprü hücreleri `C.keep` |
| Tabela `sign` | `out.sign`: n uzunlukta dizi; ok yönünün biti ya da 0 |
| Döner tabla `table` | `out.table = { plates: [[sol-üst, sağ-üst, sağ-alt, sol-alt], …], plate: n uzunlukta (−1 ya da tabla no) }`; birim türü `'table'`, K = 4 |
| Halka `ring` | `out.ring = { mark: n uzunlukta bool, cyc: [döngü karoları] }` |
| Tünel ağzı `portal` | `C.adj/C.ao` (pre; çift yoksa kurulmaz), `out.portal`: `[{ a, ka, b, kb, id }]` çiftleri, `C.mouth`: ağız hücrelerinin Set'i; ağız hücreleri `C.keep` |

Çakışma ve dışlamalar (tasarım doğrulamasından):

- Döner tabla adayları köprü (`C.br`), tünel ağzı (`C.mouth`) ve merkeze bitişik hücreleri dışlar.
- Makas merkeze bitişik olmaz.
- Tabela köprü komşusuna konmaz.
- Halka, tabela ve köprü ile aynı bölümde olmaz: `clash: ['sign', 'bridge']` halka dosyasında tanımlanır.
- Karanlık tünelde tabla dört karosuyla birlikte aydınlanır; tünel ağzı aydınlanınca eşi de aydınlanır (`reveal`).

## Çözücü ve seçim yardımcıları

- `api.difficulty(P, leaf, cap)`: zorluk puanı. `leaf(cfg)` verilirse çözücü her tam dizilimde `lit` yerine onu çağırır (çözüm sayımı, adillik denetimi için); `cap` düğüm tavanıdır (varsayılan 200). `api.lit(P)` da açıktır.
- `P.reject = true`: eklenti adayı adil bulmazsa (ör. gizli bilgiyle tek çözüme inmiyor) işaretler. `pick` reddedilmemiş adaylar arasından seçer; hepsi reddedilirse eski davranış sürer.
- `boost`: kuralın zorluk payı (puan). Kuralın kendi hattının ilk 3 bölümü dışında hedef puana eklenir; böylece kurallı bölüm daha zor tabandan seçilir. Kuralın ölçülmüş zorluk artışına göre verilir.

## Robot testi

```js
// tools/hakem/makas.cjs
module.exports = async T => {
  const { browser, URL, open, check, solve, shot, getSave, tapTile, waitModal, starsUpTo } = T;
  const { ctx, page, errors } = await open(browser, URL, { save: { played: 6, level: 209, stars: starsUpTo(209) } });
  // …
  check('rule.sw', 'Makas: …', ok, detay, 'high');
  await ctx.close();
};
```

- `window.__ray` şunları verir: `generate, lit, difficulty, puzzleFor, rulesFor, MODS, nb, tree, unitTaps, plan, G, geo…`.
- Üretimi doğrudan denemek için: `__ray.generate(7, 9, tohum, 0, 0, { sw: 5 })`.
- `window.__rayTest = 1` başlatma betiğiyle bütün hatlar açılır: `open(browser, URL, { init: 'window.__rayTest = 1' })`.
- Bütün robot `node tools/hakem.cjs` ile çalışır; hepsi geçmelidir.

## Teslim

- Kendi dalında commit ve push (dal adı oturum isteminde yazılı).
- Bitince `docs/kurallar/<ad>.md` güncel olmalı: kural, kanıt, ölçümler ve bilinen sınırlar.
