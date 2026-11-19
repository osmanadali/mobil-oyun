# M31 · Manevra karosu (`shunt`)

Hat M31, ilk bölüm 801 (`line: 30`, `ord: 29`). Dosyalar: `www/rules/manevra.js`, `tools/hakem/manevra.cjs`, çeviri `tools/diller/sozluk-13.txt`. `KARMA` 30 → 31: karma hatlar artık M32'den (829. bölüm).

**Kural.** ⇄ rozetli manevra karoları **dönmez**. Birine dokununca seçilir (kalın çerçeve, karo hafifçe kalkar, rozeti dolar), başka bir ⇄ karoya dokununca ikisi **yer değiştirir**; yönleri aynı kalır. Seçili karoya yeniden dokunmak seçimi bırakır; ⇄ olmayan bir karoya dokunmak da seçimi bırakır (o karo normal döner). Biçimler doğru yönde ama yanlış yerde başlar: oyuncu hangi biçimin nereye ait olduğunu bulur. Bir takas = 1 hamle; seçim ve bırakma hamle değildir. Oyuncuya: "⇄ işaretli manevra karoları dönmez. Birine dokun, sonra başka bir ⇄ karoya: ikisi yer değiştirir, yönleri aynı kalır. Her biçim doğru yönde ama yanlış yerde; hangisinin nereye ait olduğunu bul."

Kayan sıra/sütun (M5/M26) ve döner tabla (M12) da karoların yerini değiştirir ama sabit düzenle (kaydırma, 90° tur); manevrada takas serbesttir (grubun herhangi iki karosu).

## Tanım ve çekirdek sözleşmesi

- Bölümde tek grup: 3–5 ⇄ karo. Bütün grup **tek birimdir** (`C.unit(cells, K, tap, 'shunt')`). Durum yalnız maskededir (`G.cur`): takas iki maskeyi yer değiştirir. Bu yüzden ↶ geri al (çekirdek `cur`'u geri yükler), kayıt/sürdürme (`saveRun` `cur`'u saklar) ve imza ek bilgi istemez. Seçim `G.shSel`'dedir; kaydedilmez (yarım oyun seçimsiz açılır), `undo` kancası ve ipucu bırakır.
- `K` = grubun farklı dizilim sayısı (çoklu küme permütasyonu; 5 farklı biçim → 120). `tap(c)` birim sözleşmesine uyar: grubun **sözlük sırasında sıradaki** dizilimini yazar, sonuncudan sonra başa döner. Böylece `K` dokunuşta başa dönülür, her dizilim bir kez gezilir; zorluk çözücüsü (`difficulty`) bütün dizilimleri aday bilir, `unitTaps` + `tap` döngüsü (son sefer, öteki testlerin "birimi çözüme getir" yardımcıları) çözüme varır.
- Oyunda dokunuş çekirdeğin birim yolundan geçer. `block(G, i)` ⇄ karoda reddetmez; yapılacak işi (`pend = { c: G.cur, a, b }`) hazırlar ve 0 döndürür. `tap` yalnız `pend.c === c` iken (oyunun `G.cur`'u) takası uygular ya da (seçim/bırakma) hiçbir şey yapmaz; çözücünün kopyalarında sıradaki dizilime geçer.
- Hamle sayımı: seçimde ve bırakmada `G.lastTile` birimin anahtarına (`'u' + u`) çekilir → çekirdek ne hamle sayar ne geri al kaydı açar. Takasta `G.lastTile = −1` → çekirdek yeni hamle sayar ve geri al için durumu saklar (art arda iki takas iki hamledir).

### Çekirdek değişiklikleri (en küçük hâl)

`www/game.js`:

1. Satır 302: `KARMA = 31` (yorum güncel).
2. Satır 413–414 (par/dokunuş hesabı): birim isteğe bağlı `U.moves(cur, sol)` verirse par her hamleyi sayar, süre hedefi hamle başına 2 dokunuş alır; yoksa eskisi gibi (birim 1, `unitTaps`). Manevrada `U.moves` = en az takas sayısı. Bu olmadan 4–5 karoluk grup par'da 1 sayılır, hamle hedefi 2–3 takas eksik kalırdı.
3. Satır 1924 (ipucu): birim isteğe bağlı `U.hint(cur, sol, i, fixed)` verirse ipucu adımını birim yapar ve sabitlenecek karoları döndürür; yoksa birimin bütün karoları çözüme oturur. Manevrada `U.hint` bir takas yapar (i karosuna doğru biçimi getirir; tercihen ikisi birden yerine oturan eş), yerine oturan karo(lar)ı sabitler.

İkisi de alan yoksa çalışmaz: eski bölümler, öteki eklentiler ve Günün Hattı bit bit aynıdır (`rule.shunt.old`).

## Üretim (`shape`, `ord: 29`)

Eşliden sonra, ters/sayaçlıdan önce; dönüşen karodan (28) sonra:

1. Aday: `C.free(i)` (merkez, eşli, sabit, başka birim değil), `keep` değil, köprü/tünel ağzı değil.
2. Küme: rastgele bir adayın çevresindeki en yakın `round(2,5·k)` aday (Manhattan). Takaslar yerel bir bulmaca olur; ⇄ karolar birbirine bakar.
3. Kümeden `k` karo `R()` ile; önce **farklı biçimler** (çözüm maskesi), yetmezse aynı biçim de olur (240 örnekte 1).
4. Başlangıç: çözüm biçimlerinin **düzensiz** karıştırması (en çok 60 deneme; biçimler farklıysa hiçbir karo kendi biçimini taşımaz). Yönler çözümdeki gibidir (`cur[hücre] = sol[başka hücre]`).
5. Birim + `U.moves` + `U.hint`; `out.shunt = cells`.

Miktar: tanıtım (801) 3, 6×8 4, 7×9 ve hat finali 5. `R()` yalnız manevralı bölümde tüketilir.

## Çözülebilirlik

- Başlangıç, çözüm biçimlerinin bir permütasyonudur (çoklu küme aynı); takaslar simetrik grubu üretir, dolayısıyla çözüm dizilimine her zaman en çok `k − 1` takasla ulaşılır. Öteki karolar çekirdeğin karıştırmasıyla aynı kalır (yalnız geri alınabilir işlemler).
- Aynı biçimli iki ⇄ karo varsa birbirinin yerine konmaları **aynı tahtayı** verir (maskeler eş): ayrı bir çözüm değildir, adillik sorunu yoktur. Kazanma zaten `lit` ile denetlenir.
- Kural gizli bilgi taşımaz (`cands` yok): bütün biçimler görünür, yalnız yerleri yanlıştır.
- Robot (`plan`): seçili karo varsa önce bırakır, sonra açgözlü döngü ayrıştırmayla en az takası dokunur (biçimler farklıyken en kısa: `k − döngü sayısı`). Hat başında robot par hamlede kazanır.
- Karanlık tünelde bir ⇄ karo görününce grubun bütün karoları görünür (`reveal`, yalnız karolar; takas eşi seçilebilsin).
- Doğrulama (`rule.shunt.gen`, 322 tohum, 6×8 · 7×9, kuralsız, iki merkez, karanlık+ters+sayaçlı ve uyumlu her eklentiyle): çözüm geçerli, çözülmüş gelen 0, çoklu küme farkı 0, farklı biçimli grupta yerinde başlayan 0, birim sözleşmesi (K, döngü, `unitTaps`, `U.moves`) hatası 0, çözücü yapraklarında grup dışı dizilim 0, çözücü çözümü her bölümde bulur.

## Zorluk

Çözücü puanı, 7×9, aynı 40 tohum (ağaç ve öteki karoların karışıklığı aynı; `shape` aşamasında `R()` tüketimi ağaçtan sonradır):

| Ölçüm | Puan |
|---|---|
| Kuralsız | 13,7 |
| Çekirdek çözücü, 4 ⇄ karo | 13,6 |
| Çekirdek çözücü, 5 ⇄ karo | 13,8 |
| İnsan modeli, 4 ⇄ karo | 15,6 |
| İnsan modeli, 5 ⇄ karo | 19,3 |

- **Çekirdek çözücü** grubu tek birim görür: her kenar kısıtı bütün dizilimleri birlikte eler ("her biçim bir kez" defterini kusursuz tutar) ve ilk turda grubun tümü "daraldı" sayılır. Bu yüzden kural çözücü puanını artırmaz.
- **İnsan modeli** (testte geçici bir `cands` eklentisiyle): her ⇄ karo grubun biçimlerinden biri olabilir, oyuncu karo karo düşünür ve permütasyon defteri tutmaz. Karo başına aday 4 dönüş yerine 3–5 farklı biçimdir ve komşu kenarlar daha geç kesinleşir: 13,7 → 19,3 (+5,6). Ayrıca yanlış deneme pahalıdır: bir takas iki karoyu birden bozar ve 2 dokunuştur.
- Kümeleme ölçümü (5 karo, insan modeli): dağınık 17,1 · küme 2,5·k 19,3.

Merdiven (hattın 28 bölümünün `puzzleFor(l).diff` ortalaması; ekspres durağın yöntemi):

| Hat | Ortalama |
|---|---|
| M29 sarsıntı | 24,8 |
| M30 dönüşen karo | 26,6 |
| **M31 manevra** | **27,0** |
| M32 karma | 22,4 |

`boost` / `scan` denemeleri: scan yok → boost 0: 19,0 · 16: 24,6 · 20: 25,4 · 24: 25,4 · 28: 25,8 · 34: 25,8 (**seçici tavanı**: 24 adayda hedefe yakın aday kalmıyor). `scan: 48` → boost 16: 26,0 · 20: 27,0 · 26: 27,0 (yine tavan); `scan: 72` → 20: 27,4 · 26: 27,8. Seçilen: `boost: 20, scan: 48` (M30'un üstünde, bölüm üretimi ~30 ms).

## Çakışma

`clash: ['slide', 'column', 'table']`: kayan sıra, kayan sütun ve döner tabla da karoların yerini değiştirir ama sabit düzenle; serbest takasla aynı tahtada iki ayrı "yer değiştirme" dili karışır. Öteki eklentilerle hücre düzeyinde çakışma yoktur: grup birimdir (`busy`), işaretleri (tabela, sinyal, ekspres/sarsıntı durağı) `busy` hücrelere konmaz; ⇄ rozeti sağ üstte (dönüşen karonun önizlemesi sağ altta, sinyal sol üstte, sayaç sol altta).

## Oyun ve çizim

- Seçim: kalın çerçeve (önplan rengi + içte hat rengi), karo %6 büyür ve hafifçe kalkar, ⇄ rozeti dolu (ters renk). Renkten bağımsız: biçim (çerçeve kalınlığı, dolu rozet) ve ölçek.
- Takas: 240 ms, iki karo birbirinin yerinden kayarak gelir ve ortada %8 kalkar; yumuşak iki notalı ses, hafif titreşim. Azaltılmış harekette animasyon yok. İpucunun takası da kayar (dönüş animasyonu yerine).
- Bildirim: ilk seçimde oyuncu başına bir kez "⇄ Manevra · başka bir ⇄ karoya dokun, yer değiştirsinler".
- `under`: ⇄ karolarda düz (kesiksiz) iç çerçeve; `over`: sağ üstte küçük kutu içinde iki zıt ok (tek yol). İpucuyla sabitlenen karoda ve kazanınca çizilmez.
- 4× yavaş CPU, 7×9 hat finali (5 ⇄ karo, 30 dokunuş seçim/takas): kare çizimi ortanca 2,5–2,8 ms (p95 6,2–8,9; makine yüküne göre), manevra kancaları ortanca 0,1 ms.

## Bilinen sınırlar

- Çekirdek çözücü kuralın zorluğunu ölçemez (ortak dizilim çıkarımı); merdiveni `boost` + `scan` taşır ve seçici tavanına dayanır (boost 20'den sonra etkisiz).
- Robotun takas planı açgözlüdür: aynı biçimli karolu grupta (nadir) en kısa olmayabilir.
- Seçim bir başka eklentinin `block`'u aynı dokunuşu reddederse (şimdilik böyle eklenti yok) seçim durumu güncellenmiş kalır; `pend` dizi kimliğiyle korunur, çözücüyü etkilemez.

## Test

`tools/hakem/manevra.cjs`: `rule.shunt.gen` (322 tohum), `.solver` (yapraklar, çözüm bulunur, zorluk çekirdek + insan modeli), `.clash` (900 bölüm), `.line` (800'den önce yok, hattın her bölümünde, giriş 3, 7×9 5, final 5, merdiven M29 < M30 < M31 > 26,6), `.old` (eklenti çıkarılınca 1–800 ve Günün Hattı aynı), `.card` (9 dil, 320×568), `.tap` (seçim, bırakma, takas 1 hamle, ikinci takas ayrı hamle, bildirim), `.undo`, `.resume`, `.hint`, `.play` (hat başı, par hamlede), `.mid` (7×9), `.fog`, `.perf` (4× yavaş CPU), `.errors`.
