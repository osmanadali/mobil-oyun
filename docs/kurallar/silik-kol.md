# M12 · Silik kol (anahtar: `faint`)

> Tasarım başvurusu: `proto-zor` dalı, `proto/zor/tasarimlar.json` (id `silik-kol`) ve `proto/zor/gizli/plugins.cjs` (FAINT). Prototip eski kanca imzalarıyla yazılmıştı; eklenti main'deki birleşik kancalarla (`cands`, `P.self`, `api.difficulty(P, leaf, cap)`, `api.lit`, `P.reject`) yeniden yazıldı, çizim ve kart eklendi, ölçümler gerçek kodla yenilendi.

Dosyalar: `www/rules/silik-kol.js` (kural), `tools/hakem/silik-kol.cjs` (robot testleri), bu belge.

## Kural kartı metni

<b>Silik kolun (?)</b> altında ray <b>olabilir de, olmayabilir de</b>. Karo dönünce ? de döner. Kol gerçekte var mı, <b>komşulardan</b> çıkar.

Kart demosu: tek karo; yukarı dolu kol, sola soluk kol ve "?". Karo 90° döner ("?" yukarı, ışık kaynağına bakar). Önce üstten ışık gelir ve soluk kol dolu raya döner (kol vardı); sonra aynı sahnede ışık geçmez ve "?" solar (kol yoktu). Yalnız `transform` ve `opacity` canlanır. Hareketi azalt açıkken canlanma yoktur.

İlk dokunuşta bir kez (kalıcı, `save.faintTold`) bildirim çıkar: "Silik kol · ? altında ray olabilir de olmayabilir de".

## Mekanik

Bölümdeki birkaç karonun bir kolu silinmiştir. O kenarda soluk bir kol ve "?" görünür; altında ray ya vardır ya yoktur. Karo normal döner (tek dokunuş, 90°), "?" karoyla birlikte döner.

Sızıntısız biçim:

- Görünen kısım `V = cur & ~q` her zaman **uç** ya da **köşedir**.
- "?" biti `q`, görünen kollardan birine 90° açıdadır.
- Gerçek karo bu yüzden ya "uç ↔ köşe" ya da "köşe ↔ T" ikilisinden biridir ve her desende iki seçenek de gerçekten çıkar (test `rule.faint.both`: 300 tohumda uç+var 193, uç+yok 426, köşe+var 232, köşe+yok 199).
- Düz karo ve "karşıda ?" desenleri elenmiştir: orada gerçek sınıf hep belliydi (tasarımda ölçüldü).

Oyuncu, kolun gerçekte var olup olmadığını komşulardan çıkarır: köşe köşeye oturur, uç çıkmaza gider. Şekil sınıfı Net çıkarımının çıpasıdır; silik karo iki sınıf arasında kalır, olası yön sayısı 4'ten 8'e çıkar.

## Üretim

Aşama `mark` (sayaçlıdan sonra, tabeladan önce). `R()` yalnız silikli bölümde tüketilir.

- Aday: `C.free(i)` (merkez, sabit, eşli, birim ve öteki eklentilerin `busy` karoları değil), ters ve sayaçlı değil, gerçek karo simetrisiz (uç, köşe, T), merkez(ler)den Manhattan ≥ 2.
- Silik karolar birbirine 4-komşu olmaz.
- `?` biti yarı yarıya "var" (gerçek kol) ya da "yok" (boş kenar) havuzundan seçilir; havuz boşsa öbürü.
- Veri: `out.faint[i] = [c0, q0]`, üretim anındaki görünen karo (cur) ve "?" biti. Anlık "?" konumu, `q0`'ı `c0`'dan `cur`'a kaç dönüş varsa o kadar döndürerek bulunur. Gerçek karo simetrisiz olduğu için bu tek anlamlıdır; oyun durumu ya da kayıt alanı gerekmez.
- `out.self[i] = 1`: çekirdek bu karonun rayını, parlamasını ve durağını çizmez.
- Silik karo `busy` olur: sonraki eklentiler (tabela, halka…) ve "çözülmüş gelmesin" adımı dokunmaz.
- Hiç yerleşemezse `out.faint` silinir ve `out.reject = true` yazılır; seçici başka adayı alır (ölçümde hiç olmadı).

Miktar (`amount`): tanıtım (bölüm 353, 6×8) 2 · 6×8 3 · 7×9 4 · 7×9 hat finali 5.

### Çözülebilirlik kanıtı

Gerçek karo değişmez, yalnız rastgele döndürülerek karıştırılmıştır (çekirdeğin karıştırması); silik kol kuralı ne `sol`'u ne `cur`'u değiştirir. `sol` her zaman ulaşılabilir ve `lit(sol)` çözülüdür (test `rule.faint.gen`, 300 tohum).

### Adillik (oyuncunun gördüğüyle tek sınıf)

Önce istenen sayıda silik kol yerleşir ve adillik **tek sayımla** denetlenir (çoğu bölüm geçer). Geçmezse aynı sıra tek tek, adil olmayan yerleşim atlanarak yeniden kurulur ve eksik kalan sayı yeni adaylarla tamamlanır. Sayım şöyledir:

- `api.difficulty(P, leaf, 3000)` çağrılır. Çözücü silik karoda `cands` ile **görünen kısmın ve "? dahil" hâlinin bütün yönlerini** dener (oyuncunun bildiği tam bu).
- `leaf`, kural denetimi olmadan (`faint: null`) `lit` ile çözüm olup olmadığına bakar ve çözümdeki silik karoların sınıf anahtarını toplar (gerçek yörüngede mi).
- Anahtar tek değilse ya da arama tavana çarptıysa yerleşim geri alınır.

Sonuç: oyuncunun gördüğü bilgiyle bulunabilecek her çözümde silik kolların varlığı/yokluğu aynıdır ve gerçektir; şans ya da deneme gerekmez. Test `rule.faint.fair` 120 bölümde 20 000 düğüm tavanıyla tam sayımla bunu yeniden doğrular (0 adil olmayan).

## Kazanma

Kazanma koşulu değişmez: çekirdek `lit` gerçek maskeyle (`cur`) çalışır. Eklentinin `check(P)` işlevi, `cur`'u `c0`'ın yörüngesinde olmayan silik karoları sayar: oyunda hep 0'dır, zorluk çözücüsünün yaprağında yanlış sınıf inancını eler. Böylece `difficulty()` puanı oyuncunun sınıfı çıkarmak zorunda olduğu çözümü ölçer.

## Çizim (`rails` kancası)

- Görünen kısım çekirdekle aynı kalınlık ve stilde çizilir (sönük → ışıma → yanan, `OC[own]`). Görünen kısım tek kolluysa durak noktasını eklenti çizer.
- "?" kolu: ray kalınlığında **soluk "aşınmış ray"** (merkezden .12s → .40s, kenara değmez, `pal.mut` %22–28) ve üstünde **iri "?"** (800, .3s, `pal.fg`). "?" karonun açısıyla yer değiştirir ama dik durur.
- Makastan ayrımı: makasın kullanılmayan kolu ince kesik çizgi + boş halkadır; silik kol kalın, dolu, soluk bir şerit ve soru işaretidir. 360 px genişlikte 7×9'da (karo 45 px) "?" ~14 px okunur; renk değil biçim ayırt eder.
- Gerçek karo düz çizilir: ipucuyla sabitlenince, kazanınca ya da "?" kolundan gerçekten ışık geçince (karo yanıyor, kol var, komşu o kola bağlı ve yanıyor; oyuncu bunu zaten ışıktan görür).
- Maliyet: kare başına sönük/ışıma/yanan yolları + bir şerit yolu + "?" yazıları; birkaç çağrı.

## Zorluk çözücüsü ve robot

- `cands(P, i)` = `orbit(V) ∪ orbit(V | q)`, maske değerine göre sıralı (aday sırası gerçek sınıfı sızdırmasın; prototipte bu hata puanı ~+1,5 şişiriyordu).
- Silik karo birim değildir (tek karo, K = 4); `hid` ile çözücüde tüm adaylar açık başlar.
- Robot `solve()` karoyu `sol`'e normal dönmeyle getirir; `plan()` etkilenmez.

## İpucu, baştan, kayıt

- İpucu: silik karo yanlışsa `cur = sol` yapılır ve sabitlenir; karo gerçek hâliyle çizilir (test `rule.faint.hint`).
- ↺ Baştan: başlangıç dizilimi geri gelir, "?" `c0`'dan yeniden hesaplanır.
- Yarım oyun: ek alan yok; "?" her zaman `cur`'dan türetilir (test `rule.faint.resume`).

## Çakışma

`clash: ['cover']`: şekil gizleyen iki kural birlikte fazla ağır (tasarım ölçümü Δ +14,6). Silik karo adaylarından makas, tabla, tabela, halka işareti (busy), köprü (split/busy), ters, sayaçlı, eşli ve sabit karolar dışlanır. Karma hatlarda 300 silik kollu bölüm (`rule.faint.mix`) tabela, ters, iki merkez, sabit, köprü, karanlık, tabla, halka ve tünel ağzıyla birlikte üretildi; hepsi çözülü.

## Ölçümler (gerçek kod, `__ray`)

Aynı tohum ve boyut, `difficulty()` ortalaması, kural kapalı → açık (160 tohum; robot testi 150 tohumla yeniden ölçer):

| Boyut | Silik | Kapalı | Açık | Δ | Artan bölüm |
|---|---|---|---|---|---|
| 7×9 | 4 | 14,85 | 18,24 | **+3,39** | %72 |
| 7×9 | 5 (final) | 14,85 | 18,84 | +3,99 | %76 |
| 6×8 | 3 | 12,02 | 14,15 | **+2,13** | %61 |
| 6×8 | 2 (tanıtım) | 12,02 | 13,47 | +1,46 | %52 |

Hat ortalaması (`puzzleFor`, P.diff):

| Hat | Ortalama |
|---|---|
| M11 (köprü, önceki tek hat) | 16,30 |
| M12 silik kol, pay 2 | 17,32 |
| **M12 silik kol, pay 2,5 (seçilen)** | **17,73** (+1,43) |
| M13 (karmalarda artık silik kol da var) | 16,8 → 17,03 |

Pay 2 sınırda kaldığı için (+1,02) **boost = 2,5** seçildi. İlk 3 bölüm (tanıtım, pay yok): 12,2 · 14,2 · 14,8.

Üretim süresi (masaüstü Chromium, `puzzleFor` ortalaması): M11 ~30 ms, M12 ~100 ms (24–32 aday, aday başına çoğunlukla tek adillik sayımı), karma hatlar (901–910) ~30 ms. İlk sürümde her yerleşimden sonra ayrı sayım yapılıyordu (M12 ~175 ms, 901–910 ~63 ms); toplu denetim süreyi yarıya indirdi. Sonraki bölüm kazanma ekranında önceden hazırlanır.

Eski bölümler: `silik-kol.js` yüklü ve yüksüz, `puzzleFor(1..352)` ve 28 günlük Günün Hattı imzaları birebir aynı (test `rule.faint.old`).

## Bilinen sınırlar

- Işık geri bildirimi bilgi sızdırır: "?" kolu varsa ve yanan komşuya dönükse ışık geçer, kol dolu çizilir. Bu, Net türünün olağan ışık geri bildirimidir (oyuncu yine dener-görür); zorluk puanı bu denemeyi saymaz.
- Önsel eğilim: "uç + ?" desenlerinde gerçek karo daha çok uç (426'ya 193). Mantık yine tek çözüm verir; istenirse üretimde dengelenebilir.
- Bölümlerin ~%28'inde (7×9) silik kol puanı artırmıyor: karo yerelde kolay çözülüyor. Pay ve seçici bunu dengeler.
- Üretim M12'de M11'e göre ~3 kat yavaş (masaüstünde ~0,1 s); yavaş telefonda M12 bölümü açılışı ~0,5 s sürebilir.

## Öteki testlere dokunan değişiklikler

Silik kol öğrenilmiş kurallara katılınca `rulesFor` karma dağılımı kayar ve M12 artık zor kural hattıdır. İki eski test bu yüzden güncellendi (çekirdek değişmedi):

- `tools/hakem/tabela.cjs` (`sign.ladder`): "M13 > M12" yerine "M13 > M11" (bir önceki tek hat); M12 çift hat olarak bilerek daha zor.
- `tools/hakem/kopru.cjs` (`bridge.cross`): köprü + iki merkezli karma bölüm 40 000 bölümde yalnız 2 kaldı ve ikisinde de köprüde renk çaprazı yok. Böyle bölüm bulunamazsa yalın köprülü bir 7×9 bölüme renkleri köprüde kesişen bir köprü + iki merkez bulmacası (`generate`) yüklenir; çizim ve kazanma denetimi aynı kalır.
