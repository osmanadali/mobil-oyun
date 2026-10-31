# M15 · Kapak (anahtar: `cover`)

> **Hat düzeni 31 Ekim'de değişti:** bu kural artık **M15** (ilk bölüm 353). Aşağıdaki hat ve bölüm numaraları ve ölçümler eski düzene aittir; güncel tablo `docs/kurallar/README.md`.

İlk çift hat kuralı (gizli bilgi). Kod: `www/rules/kapak.js` · testler: `tools/hakem/kapak.cjs` · tasarım başvurusu: `proto-zor` dalı, `proto/zor/tasarimlar.json` (id `kapak`) ve `proto/zor/gizli/plugins.cjs` (`COVER`).

## Kural kartı metni

<b>Kapaklı</b> karonun rayı görünmez ve <b>dönmez</b>; altındaki ray zaten doğru yönde. Komşulara bakıp <b>hangi yönlere açıldığını</b> çıkar.

Demo (`.rd-cover`, 4 sn döngü): solda yatay ray yanar, ortadaki kapağın sol kenarında hat renginde kısa bir kol belirir, sonra sağ kenarında; sağdaki durak yanar (ışık kapağın altından geçti). Yalnız `background`, `opacity` canlandırılır; azaltılmış hareket tercihinde durur.

## Mekanik

Bölümde 1–3 karo yuvarlak bir rögar kapağıyla örtülüdür. Kapağın altındaki karo **sabittir ve çözüm yönündedir**, ama şekli (kaç kolu var, hangi yöne açılıyor) görünmez; üstünde sayı da yoktur. Oyuncu kapağın hangi komşulara açıldığını çevreden ve "açık uç kalmasın, her şey bağlansın" kuralından çıkarır.

- Işık kapağın altından geçer. Kapak yanıyorsa ve yanan bir komşunun kolu kapağın gerçek koluna değiyorsa, o kolda daireden karo kenarına hat renginde kısa bir ray görünür. Bu geri bildirim ancak oyuncu bir karar verip komşuyu çevirdikten sonra gelir.
- Kapağa dokunmak hamle sayılmaz; bölümde bir kez "Kapak · altındaki ray sabit ve doğru yönde, dönmez" bildirimi çıkar.
- Işık ilk kez bir kapağın altından geçince (oyunda bir kez) "Kapak · ışık altından geçti, parlayan kollar açık" bildirimi.
- Kazanınca kapak 420 ms'de solar ve altındaki ray görünür.

**Neden zor:** Net türünde en güçlü yerel bilgi karonun şeklidir. Sabit karo (M3) bu bilgiyi bedava verir, kapak tersine çevirir: hücre sabit ama 15 olası maskeden biridir. "Kapağa bak, ona göre dön" çıkarımı yapılamaz; çıkarım ters yönde işler, kapağın içeriği dışarıdan çözülür ve çoğu zaman yerel olmayan bir zincir (bağlantı, açık uç) ister.

## Üretim (aşama `mark`)

Sayaçlıdan sonra, karanlıktan önce çalışır. `R()` yalnız kapaklı bölümde tüketilir.

1. Adaylar: `C.free(i)` (merkez, sabit, eşli, birim değil), `keep` değil (köprü, tünel ağzı), ters ve sayaçlı değil, çözümde 2–3 kollu, merkez(ler)den Manhattan uzaklığı ≥ 2.
2. Rastgele aday çekilir; bir kapağa 4-komşuysa atlanır.
3. `cover[i] = sol[i]`, `cur[i] = sol[i]` yazılır, sonra **adillik denetimi** yapılır. Geçerse `busy[i] = true` (tabela, halka işareti ve "çözülmüş gelmesin" dokunmaz) ve `self[i] = 1` (çekirdek rayını, parlamasını, durağını çizmez). Geçmezse geri alınır, başka aday denenir.
4. Hiç kapak konamazsa `out.cover` silinir: kural o bölümde kapalı.

**Adillik:** `api.difficulty(P, leaf, 3000)` oyuncunun inanç modelindeki bütün çözümleri sayar. Bu modelde her kapak `cands` ile 15 maskeden biridir ve yaprakta `lit` kapak denetimi kapalı (`cover: null`) çalışır. Bulunan bütün çözümlerde konmuş kapakların maskeleri tek değilse ya da arama tavana vurursa kapak geri alınır. Böylece oyuncunun gördüğü bilgiyle (kapak sayısı bilinmese de) kapakların şekli tek biçimde çıkar; görünmeyen bilgi tahmine bırakılmaz. Ölçümde istenen kapak sayısı her bölümde konabildi; `P.reject` gerekmedi.

**Çözülebilirlik kanıtı:** Kapaklı karo çözüm yönünde sabittir. Öteki karolar yalnız döndürülerek karıştırılmıştır (geri alınabilir), yani `sol` her zaman ulaşılabilir. "Çözülmüş gelmesin" adımı `busy` karoyu atlar. Adillik denetimi gizli şeklin mantıkla tek çıkarıldığını garanti eder. Sonradan eklenen kurallar (tabela, halka işareti) yalnız yeni kısıt ekler; çözüm kümesi küçülür, `sol` içinde kalır, tekillik bozulmaz.

## Kazanma ve çözücü

- Kazanma koşulu değişmez: hepsi merkeze bağlı, açık uç yok. Kapaklı karo `lit`'e gerçek maskesiyle girer.
- `check(P)`: kapaklı olup `cur ≠ cover` olan karoları sayar. Oyunda hep 0 (karo dönmez); çözücü yaprağında yanlış kapak inancını eler.
- `cands(P, i)`: kapaklı karoda 1–15 maskelerinin hepsi. `difficulty()` böylece gizli bilgiyi görür: kanca olmasa kapak "sabit karo" sayılır, bölüm olduğundan kolay puanlanır.
- İpucu: kapak hiçbir zaman yanlış değildir (`cur = sol`), ipucu ona gitmez. Robot `solve()` ona dokunmaz; birim yoktur, `plan()` etkilenmez.
- ↺ baştan ve yarım oyun: `P.cover` tohumdan gelir; kayıt yalnız `cur`, hamle, süre tutar, ek alan gerekmez.

## Miktar ve zorluk payı

```
amount: (n, intro, z, fin) => intro || n < 63 ? 1 : fin ? 3 : 2      boost: 2.5
```

- M10'un ilk 3 bölümü (6×8, tanıtım, pay yok): 1 kapak.
- Sonra 7×9: 2 kapak; 7×9 hat finali: 3 kapak.
- Karma hatlarda kapak hep 7×9 bölümde gelir: 2 kapak.

## Çizim

`rails` kancası (çekirdek raylarından sonra, parlamadan önce). Kare başına en çok ~5 çağrı:

- Kapaklar tek yol: daire (r = .33s, `pal.pin` dolgu, `pal.mut` kenar) + içinde 3 yatay yarık (`pal.mut`). Ayırt edici olan biçimdir, renk değil; açık ve koyu temada okunur.
- Işıklı kollar: hat (merkez) başına tek yol, daire kenarından karo kenarına `OC[own]` renginde kısa ray (biçim + renk).
- Kazanınca: gerçek ray `railPath` ile `globalAlpha = t` olarak çizilir, kapak `1 − t` ile solar.
- Karanlık tünelle çakışır (`clash: ['fog', 'faint']`): iki görünmezlik üst üste binmez; silik kolla birlikte şekil gizleyen iki kural aşırı zorlaşır.

## Ölçümler (gerçek kod, Chromium, `__ray`)

**(a) Aynı tohum ve boyut, kural kapalı → açık** (`generate(c, r, s·7919+17, 0, 0, { cover })`, 150 tohum, `difficulty()` ortalaması):

| Boyut | Kapak | Kapalı | Açık | Δ | Artan bölüm |
|---|---|---|---|---|---|
| 7×9 | 2 | 13,93 | 18,18 | **+4,25** | %79 |
| 6×8 | 2 | 11,88 | 15,59 | **+3,71** | %80 |
| 7×9 | 1 | 13,93 | 15,58 | +1,65 | %53 |
| 6×8 | 1 | 11,88 | 13,48 | +1,61 | %54 |
| 7×9 | 3 | 13,93 | 20,99 | +7,05 | %87 |
| 6×8 | 3 | 11,88 | 18,89 | +7,01 | %95 |

**(b) Hat ortalaması (`puzzleFor`, `P.diff`):**

| Hat | Ortalama |
|---|---|
| M9 (209–252, makas) | 14,58 |
| M10 kapaksız (eski karma hat) | 14,08 |
| **M10 kapaklı (253–300), pay 2,5** | **16,29** (M9'dan +1,71) |

Üretim maliyeti: 7×9 2 kapak ~2–3 ms/aday (kapaksız ~0,15 ms; fark adillik sayımı); M10'da `puzzleFor` ~65 ms/bölüm (masaüstü, 24–32 aday). Telefonda 3–5 kat sürer; sonraki bölüm zaten kazanma ekranında hazırlanır.

**Eski bölümler:** kapak dosyası yüklü ve yüksüz `puzzleFor(1..252)` ile 40 Günün Hattı parmak izleri eşit (`1xyparl`, `109kff2`); kancalar 1–252'de hiç çağrılmıyor, `{cover: 0} ≡ {}`.

## Doğrulama (robot, `tools/hakem/kapak.cjs`)

- Üretim: 600 bulmaca (6×8 ve 7×9; sabit, eşli, ters, sayaçlı, iki merkez ve yüklü her eklentiyle) → kapak sayısı tam, yerleşim kurala uygun, `lit(sol)` çözülü, hazır çözülü yok.
- Adillik, bağımsız sayım (tavan 20000): 600/600 bölümde kapak bilinmeden bulunan bütün çözümlerde kapak maskeleri gerçek maskeyle aynı.
- Eski bölümler bit bit aynı; zorluk farkı ve hat ortalaması yukarıdaki eşikleri geçiyor.
- Karma hatlar: 301'den itibaren kapaklı 300 bölüm (`rulesFor` taraması) üretilir, kapak yerleşir, çözüm geçerli; 11 farklı eşlik (tabla, halka, tünel, köprü, tabela, makas, iki merkez…). 253–20000'de karanlık tünelle hiç birlikte gelmiyor.
- Oyun: bölüm 253 kural kartı (animasyonlu), kapağa dokunuş dönmez ve hamle saymaz, robot kazanır, kapak açılır; 7×9 bölümde ipucu kapağa gitmez, yarım oyun yenilemeden sonra sürer, ↺ baştan; kapak + eklenti kuralı karma bölümünde robot kazanır.

## Bilinen sınırlar

- Uç değerler: 7×9 2 kapakta tohum başına Δ ortanca +3, p90 +8, en çok +66 (tek tohum, çok tahmin dalı); %21 tohumda artmıyor (en düşük −4). Seçici hedefe en yakın adayı aldığı için uçlar seçilmez.
- Işıkla yoklama yolu her zaman açıktır (komşuyu çevir, kola ışık geliyor mu bak); bunu hamle yıldızı sınırlar.
- Adillik modeli kapağın 2–3 kollu olduğunu oyuncunun bilmediğini varsayar (15 maske); bu en temkinli seçimdir.
- Karma hatlarda kapak çoğunlukla yalnız ya da en yeni kurallarla gelir (`rulesFor` en yeni 3 kurala ağırlık veriyor); eski çekirdek kurallarıyla (ters, sayaçlı) karışım seyrektir.
