# Ray — Bölüm tasarımı ve zorluk merdiveni

Bu belge, bölümlerin nasıl üretildiğini, hatların nasıl uzadığını ve zorluğun bölüm ilerledikçe nasıl arttığını anlatır. Kodda karşılığı `www/game.js` içindeki "hatlar", "zorluk puanı" ve "zorluk merdiveni" bölümleridir.

## 1. Temel ilke

- Bölümler elle çizilmez, her bölüm numarasından **aynı bulmaca** üretilir. Herkes 57. bölümde aynı haritayı görür.
- Bölüm sayısı **sonsuzdur**. Oyun hiçbir zaman "bitmez"; zorluk dalga dalga artar: her hat bir öncekinden zordur, hat içinde arada kısa **mola bölümleri** gelir (§5).
- Zorluk tek bir eğriyle yönetilir: **z(l) = 1 − e^(−l/170)**. Bu değer 0'dan başlar, hiç düşmez ve sonsuzda %100'e, yani "imkânsız"a yaklaşır ama hiç değmez. Oyuncu bu değeri ekranda "⚡ Zorluk %" olarak görür.

## 2. Hatlar: hat boyu 28 bölümde durur

Hat boyu M1'den M5'e 4'er bölüm uzar (12, 16, 20, 24, 28), sonra **28'de sabit kalır**: `lineLen(c) = min(12 + 4c, 28)`. Böylece 22 kuralın hepsi ~600. bölüme kadar tanıtılır (son kural M24 605. bölümde; 31 Ekim'den önce M23 1189. bölümdeydi ve oyuncuların çoğu M10'un ötesini görmüyordu). Yeni hattın kilidi, önceki bütün bölümlerden ortalama **2,2 yıldız** toplayınca açılır. Zorluk z(l) yine bölüm numarasına bağlıdır; hatlar kısaldığı için her kural daha düşük bir z'de gelir.

| Hat | Bölümler | Bölüm sayısı | Kilidi açmak için | Zorluk | Kural | Ortalama zorluk puanı |
|---|---|---|---|---|---|---|
| M1 | 1–12 | 12 | — | %1–7 | — | 5,6 |
| M2 | 13–28 | 16 | ★ 26 | %7–15 | — | 6,7 |
| M3 | 29–48 | 20 | ★ 62 | %16–25 | 🔗 Eşli karo | 7,3 |
| M4 | 49–72 | 24 | ★ 106 | %25–35 | ↺ Ters karo | 8,2 |
| M5 | 73–100 | 28 | ★ 158 | %35–44 | ↔ Kayan sıra | 9,8 |
| M6 | 101–128 | 28 | ★ 220 | %45–53 | 🌑 Karanlık tünel | 10,1 |
| M7 | 129–156 | 28 | ★ 282 | %53–60 | 🔢 Sayaçlı karo | 10,9 |
| M8 | 157–184 | 28 | ★ 343 | %60–66 | ❄ Soğuyan karo | 11,9 |
| M9 | 185–212 | 28 | ★ 405 | %66–71 | 🚉 İki merkez | 12,1 |
| M10 | 213–240 | 28 | ★ 466 | %71–76 | ✂ Makas | 13,7 |
| M11 | 241–268 | 28 | ★ 528 | %76–79 | 🔒 Mühürlü karo | 14,1 |
| M12 | 269–296 | 28 | ★ 590 | %79–82 | ◉ Döner tabla | 14,9 |
| M13 | 297–324 | 28 | ★ 651 | %83–85 | 🌉 Köprü | 15,1 |
| M14 | 325–352 | 28 | ★ 713 | %85–87 | ⚙ Bakım karosu | 15,2 |
| M15 | 353–380 | 28 | ★ 774 | %87–89 | ⊙ Kapak | 16,7 |
| M16 | 381–408 | 28 | ★ 836 | %89–91 | ⊂ Tünel ağzı | 16,9 |
| M17 | 409–436 | 28 | ★ 898 | %91–92 | ➜ Yön tabelası | 17,2 |
| M18 | 437–464 | 28 | ★ 959 | %92–93 | ◯ Halka hat | 17,5 |
| M19 | 465–492 | 28 | ★ 1021 | %94 | ? Silik kol | 18,2 |
| M20 | 493–520 | 28 | ★ 1082 | %94–95 | ⌂ Gizli depo | 18,4 |
| M21 | 521–548 | 28 | ★ 1144 | %95–96 | 🌐 Sarmal tahta | 18,7 |
| M22 | 549–576 | 28 | ★ 1206 | %96–97 | ≈ Nehir | 19,0 |
| M23 | 577–604 | 28 | ★ 1267 | %97 | ⊘ Kapalı durak | 19,5 |
| M24 | 605–632 | 28 | ★ 1329 | %97–98 | ⇄ Tarife bölgesi | 20,1 |
| M25+ | 633– | 28 | ★ 1390… | %98 → %100 | karma | ~19,7–20,5 |

Kod: `LINE_MAX`, `lineLen`, `lineStart`, `lineOf` (tavandan sonra kapalı biçim, döngü yok). 3 Kasım'da sabit karo kalktı ve iki kural eklendi (🔒 mühürlü karo M11, 🌐 sarmal tahta M21): 1–28. bölümler (M1–M2) eskisi gibidir, 29. bölümden sonrası yeni kural sırasıyla yeniden üretilir (kasıtlı; parmak izi testleri yenilendi).

Hattın son bölümünü ilk kez bitiren oyuncu +2 ipucu kazanır (videoyla +4).

## 3. Zorluk puanı: zorluk nasıl ölçülür?

Her bulmaca, oyuncunun yapacağı mantık adımlarını taklit eden küçük bir çözücüyle puanlanır:

- **Çıkarım zinciri:** Kenarlardan ve kesin bilinen komşulardan başlayarak kaç tur art arda "bu karo kesin böyle durur" çıkarımı gerekiyor? Zincir uzadıkça bulmaca zorlaşır.
- **Giriş noktası:** İlk turda kaç karo hemen çözülebiliyor? Az giriş noktası, "nereden başlasam" duygusu demektir.
- **Tahmin dalı:** Saf mantık tıkandığında kaç kez deneme yapmak gerekiyor?

Puan = zincir + 3 × tahmin dalı + 10 × (ilk turda çözülemeyen oran). Kabaca 5 çok kolay, 8 orta, 12 zor, 15 ve üstü usta düzeyidir.

## 4. Zorluk merdiveni: hangi kollar zorluğu artırır?

Her bölüm için birden çok aday bulmaca üretilir; zorluk puanı hedefe (**5 + 11·z**) en yakın olan seçilir. z büyüdükçe:

| Kol | Başta | İleride | Etkisi |
|---|---|---|---|
| Izgara boyu | 3×3 | 7×9 (telefonda başparmak sınırı) | Daha çok karo, daha uzun zincir |
| Taranan aday | 6 | 32 | Hedefe daha yakın (daha zor) bulmaca bulunur |
| Hamle toleransı | par × 1,3–1,4 (en az +2) | z %30'u geçince pay yavaşça %60'ına iner (sonsuzda ≈ par × 1,2) | ↻ yıldızı ve bilet zorlaşır |
| Süre hedefi | Gereken dokunuşa göre | Zor bulmacaya düşünme payı eklenir (+3 sn/puan); hepsi × 0,75 | Zor bölüm haksız olmaz |

**Hedef formülleri (`limits`, 31 Ekim'de %25 sıkılaştı):**

- ↻ hamle hedefi = par + max(2, round(par · tol · sıkılık)); tol = 0,30 (küçük ızgara) → 0,40 (7×9), sıkılık = 1 − 0,4·max(0, (z − 0,3)/0,7). Önceden tol 0,60–0,75 ve en az +3 idi (par × 1,6–1,75).
- ⏱ süre hedefi = max(11, round(0,75 · (dokunuş·1,3 + karo·0,5 + 3·max(0, puan − 8)))) saniye. Önceden çarpan yoktu, taban 15 sn idi.
- Kusursuz oynayan (par hamle, hızlı dokunuş) her bölümü yine iki yıldızla bitirir; robot bunu her kuralın tanıtım bölümünde denetler.

Izgara boyu bölüme göre büyür: 1–3 3×3 · 4–8 4×4 · 9–15 4×5 · 16–25 5×6 · 26–40 5×7 · 41–60 6×8 · 61+ 7×9.

## 5. Yeni kurallar (öğrenme basamakları)

Sıra ilkesi (31 Ekim): **göze çarpan ve kolay kurallar önce, gizli bilgili ve ince kurallar sona.** Karonun üstünde görünen ve dokunuşla hemen anlaşılan kurallar (ters, kayan sıra, sayaç, soğuma) erken gelir; gizli bilgi (kapak, silik kol, gizli depo, kapalı durak) ve küresel sayım (nehir, tarife bölgesi) en sonda.

| Hat | İlk bölüm | Kural | Ne yapar? |
|---|---|---|---|
| M3 | 29 | 🔗 **Eşli karo** | Aynı numaralı iki karo birlikte döner. |
| M4 | 49 | ↺ **Ters karo** | Oklu karo saat yönünün tersine döner. |
| M5 | 73 | ↔ **Kayan sıra** | Raylı sıranın karoları dönmez; sıraya dokununca bütün sıra bir kare sağa kayar. |
| M6 | 101 | 🌑 **Karanlık tünel** | Hattın ulaşmadığı karolar karanlıktır, dokunulamaz; yanan hattın 2 karo yakını aydınlanır; bağlantı kopunca o bölge yeniden kararır. Merkez başta yalnız başlar. |
| M7 | 129 | 🔢 **Sayaçlı karo** | En fazla 3 kez döner, sayı bitince kilitlenir. Önce düşün, sonra dokun. |
| M8 | 157 | ❄ **Soğuyan karo** | Çevirip başka karoya geçince o karo 2 hamle donar. |
| M9 | 185 | 🚉 **İki merkez** | İki istasyon, iki renk; her durak kendi merkezine bağlanmalı. İki hat birbirine değerse kırmızı yanar, bölüm bitmez. |
| M10 | 213 | ✂ **Makas** | Dönmez; dokununca yol düz ile sapak arasında değişir. Kesik çizgi öbür yolu gösterir. |
| M11 | 241 | 🔒 **Mühürlü karo** | Komşularından biri hatta bağlanana (yanana) dek dönmez; bağlantı kopunca yeniden mühürlenir. Merkezden dışa sırayla çözmeyi zorlar. |
| M12 | 269 | ◉ **Döner tabla** | Dört karoyu taşır; dokununca tabla bütünüyle 90° döner, karolar yer değiştirir. |
| M13 | 297 | 🌉 **Köprü** | İki hat üst üste geçer ama birleşmez; köprü dönmez, dört ucuna da ray bağlanmalı. |
| M14 | 325 | ⚙ **Bakım karosu** | Dokunulmaz; her 2 hamlede bir kendiliğinden 90° döner. |
| M15 | 353 | ⊙ **Kapak** | Kapaklı karonun rayı görünmez ve dönmez; doğru yönde durur. Hangi yönlere açıldığı komşulardan çıkarılır. |
| M16 | 381 | ⊂ **Tünel ağzı** | Kenardaki aynı harfli iki ağız bağlıdır: birine giren ray öbüründen çıkar. Tünel kullanmak zorunlu değil. |
| M17 | 409 | ➜ **Yön tabelası** | Tabelalı karodan merkeze giden yol okun gösterdiği kenardan çıkmalı; karo döner, tabela dönmez. |
| M18 | 437 | ◯ **Halka hat** | Raylar bir kez kendi üstüne kapanır; halka kesik çemberli karodan geçmeli. |
| M19 | 465 | ? **Silik kol** | Soluk kolun altında ray olabilir de olmayabilir de; karo dönünce "?" de döner. Gerçeği komşulardan çıkarılır. |
| M20 | 493 | ⌂ **Gizli depo** | Kenardaki ayracın altındaki üç karodan tam biri dışarı, depoya çıkar; hangisi olduğu gizli. |
| M21 | 521 | 🌐 **Sarmal tahta** | Sağ kenar sola, üst kenar alta bağlı: kenardan çıkan ray karşı kenardan girer. Kenardan başlama taktiği çöker; kenardaki oklar geçişi gösterir. |
| M22 | 549 | ≈ **Nehir** | Ray nehri geçitten geçer ya da kıyıda tamponla biter; kıyıda tam rozetteki sayı kadar tampon olmalı (eksikse döngü var). |
| M23 | 577 | ⊘ **Kapalı durak** | Bazı duraklar kapalı ama sıradan görünür; merkezdeki ⊘ sayısı kaç tane olduğunu söyler. Kapalıya ray bağlanmaz. |
| M24 | 605 | ⇄ **Tarife bölgesi** | Merkezi saran bölge sınırında ray geçer ya da tamponla biter; geçiş ve tampon sayıları rozetle aynı olmalı. |
| M25+ | 633 | Karma hatlar | Yeni kural yok; her bölümde öğrenilmiş kurallardan 1–2 tanesi. |

**Zor kurallar (M15'ten sonra):** Oyuncu geri bildirimi "yeni kurallar zorluk katmıyor" oldu. Son hatların kuralları bu yüzden gizli bilgi (kapak, silik kol, gizli depo, kapalı durak) ya da küresel sayım (nehir, tarife bölgesi) üzerine kuruludur: yerel çıkarım çıpalarını bozar, oyuncuyu komşulardan ve sayılardan akıl yürütmeye zorlar. Her biri aynı tohum ve boyutta zorluk puanını ölçülerek artırır (7×9'da +3 ile +8 arası) ve gördüğün bilgiyle tek çözüme iner (üretimde çözüm sayımıyla denetlenir). Ayrıca her kuralın bir **zorluk payı** (`boost`) vardır: kuralın kendi hattının ilk 3 bölümü dışında seçicinin hedef puanına eklenir, böylece kurallı bölüm kolay tabandan seçilip fark silinmez. Paylar (31 Ekim'de yeni sırada hat ortalamaları her hatta artsın diye ayarlandı): kayan sıra 1 · soğuyan karo 0,5 · makas 1,5 · tabla 2 · köprü 2 · bakım karosu 1 · kapak 2,5 · tünel 3 · tabela 3 · halka 3,5 · silik kol 3 · gizli depo 3,5 · nehir 3,5 · kapalı durak 3,5 · tarife bölgesi 4,5. Karma hatlarda (M24+) hedefe ayrıca +3.

Eşli, ters, karanlık tünel, sayaçlı ve iki merkez dışındaki kurallar çekirdekte değil, eklenti dosyalarındadır (`www/rules/*.js`; hattı `line`, üretim aşamalarındaki sırası `ord` alanı). Her kuralın tasarımı, çözülebilirlik kanıtı ve ölçümleri `docs/kurallar/` altındadır; eklenti sözleşmesi `docs/kurallar/README.md`'dedir.

**Öğretme:**

- Yeni kuralın ilk girişinde animasyonlu bir kural kartı çıkar.
- Yeni kural gelen hattın ilk 3 bölümü bir boy küçük ızgarayla gelir, yalnızca o kuralı içerir ve ilk bölüm biraz daha kolay seçilir (testere dişi).
- **Mola bölümü (☕):** M2'den itibaren her hattın 6., 12., 18.… bölümü (ilk 3 öğrenme bölümü ve son durak hariç) bir boy küçük ızgarayla gelir; hedef zorluk puanı `5 + 11·z·0,55`, kural payı yok. Ölçüm: mola bölümleri hattın ortalamasından yaklaşık %25 kolay (ör. M8'de 6×8 ve 9 puan, komşuları 7×9 ve 12 puan). Oyunda başlıkta "⚡%" yerine "☕ mola", ana sayfada "☕ mola bölümü" yazar. Uzun hatlarda yorgunluğu kırar; hat ortalamaları yine her hatta artar. Kod: `breath(l)`.
- **Kısa bölüm:** 7×9 ızgaralı hatlarda her 6 bölümün biri (hattın 3., 9., 15.… bölümü; öğrenme bölümleri ve son durak hariç) 6×8 gelir. Zorluk hedefi aynıdır (ör. bir hattın 9. bölümü 6×8, komşuları 7×9, zorluk hedefi aynı); yalnız bölüm kısalır, büyük ızgara yorgunluğu kırılır. Kod: `short(l)`.

**Kural dönüşümü:**

- Kurallar üst üste yığılmaz. Bir kural kendi hattında her bölümde vardır.
- Sonraki hatlarda kendi kuralına ek olarak bölüm bölüm değişen en fazla 1 eski kural gelir.
- M24 sonrası karma hatlardır: her bölüm 1–2 kuralın farklı bir karışımıdır. Kurallı hatlarda da bölümlerin yaklaşık yarısına bir eski kural eklenir. M9–M24 arasında ek kuralın yarısı en yeni 3 kuraldan (hat sırasıyla) seçilir, böylece yeni öğrenilen kural sık tekrar eder. M25 ve sonrasında bütün kurallar eşit sıklıkta gelir ve hedef puana sabit +3 pay eklenir; sınırsız karma M24 düzeyinde kalır.
- Ölçülen merdiven (hat ortalaması, zorluk puanı) §2 tablosundadır: M1 5,6'dan M24 20,1'e her hat bir öncekinden zor; M25+ ~19,7–20,5. 3 Kasım ayarı: sarmal tahta `boost: 3.5`, silik kol 3 → 3,5, nehir ve kapalı durak 3,5 → 4, tarife bölgesi 4,5 → 5 (yeni sırada merdiven kesintisiz kalsın).
- Birlikte gelemeyen kurallar vardır (çakışan kural sıradaki uyumlu kuralla değişir): halka ↔ tabela, köprü; kapak ↔ karanlık tünel, silik kol; kapalı durak ↔ kapak, silik kol, gizli depo; nehir ↔ köprü, tabla, halka, tarife bölgesi; tarife bölgesi ↔ iki merkez; mühürlü karo ↔ bakım karosu; sarmal tahta ↔ tünel ağzı, gizli depo, nehir, tarife bölgesi; kayan sıra ↔ kapalı durak, nehir, tarife bölgesi, gizli depo.
- Böylece tahta kalabalıklaşmaz ve her bölüm biraz farklı hissettirir.

**Hat finali (🏁 Son durak):**

- Her hattın son bölümü finaldir: zorluk hedefi +2 puan, en çok aday taranır.
- Tahtada altın çerçeve olur, haritada 🏁 işareti görünür.
- Finali kusursuz bitiren oyuncu bir kez **+1 bonus 🎫** kazanır. Hattın son bölümü olduğu için +2 ipucu da verir.

## 6. Günün Hattı

- Herkes aynı gün aynı bulmacayı oynar, paylaşım ve karşılaştırma bu sayede adil kalır.
- Zorluk **haftalık bir dalga** çizer: Pazartesi haftanın en kolayı, her gün biraz zorlaşır, Pazar en zorudur (%85–100). Oyuncu hafta boyunca ısınır, Pazar "büyük bulmaca" günüdür.
- Dalganın dibi ve tepesi bir yıl içinde yavaşça yükselir (dip %45 → %60, tepe %85 → %97); oyuncu oyuna alıştıkça daha zor bulmacaları çözebilir.
- Her hafta ±%8 farklıdır, haftalar birbirinin kopyası olmaz.
- Hiçbir gün **%40'ın altına düşmez**; Günün Hattı hiçbir zaman fazla kolay olmaz.
- Kural içermez (pazar günü haftanın kuralı hariç); kuralları bilmeyen yeni oyuncu da oynayabilir. Izgara 7×9'dur.

| Hafta | Pzt | Sal | Çar | Per | Cum | Cmt | Paz |
|---|---|---|---|---|---|---|---|
| 26 Ekim 2026 | %45 | %50 | %56 | %63 | %70 | %77 | %85 |
| 2 Kasım 2026 | %52 | %56 | %62 | %69 | %76 | %84 | %92 |
| 6 Eylül 2027 | %66 | %70 | %76 | %82 | %89 | %96 | %100 |

**Haftanın kuralı (pazar):** Pazar günkü Günün Hattı o haftanın kuralını taşır; pazartesi–cumartesi kuralsızdır ve bit bit eskisi gibidir. Kural yalnız erken kurallardan (M3–M9) seçilir ve haftaya göre döner: eşli karo, ters karo, kayan sıra, karanlık tünel, sayaçlı karo, soğuyan karo, iki merkez (sabit karo 3 Kasım'da listeden çıktı). Listede olup oyunda henüz tanımlı olmayan kural atlanır; tanımlanınca dönüş sırası kayar. Miktar bölümlerdeki gibidir (ör. 7×9'da 4 çift eşli karo, %15 ters, %12 sayaçlı). Tohum ve kural herkeste aynıdır. Oyuncu o kuralı henüz görmediyse oyun "Haftanın kuralı" kartıyla açılır; başlığın alt satırında kuralın adı yazar, haftalık görev penceresi de pazarın kuralını önceden söyler. Kod: `WEEK_RULES`, `weekRule`, `dailyRule`, `dailyFor`.

### Günlük ve haftalık görevler, 🎫 bilet

- **Görevler:** Her hafta (pazartesi başlar, yerel takvim) 3 görev gelir. Seçim haftanın tohumuyla yapılır, bu yüzden aynı basamaktaki herkes aynı görevleri görür. Miktar oyuncunun basamağına göre değişir:

  Kullanıcı testi (3 Kasım) sonrası iki katman: **☀️ günlük** (gece yarısı yenilenir, her görev +1 💡, üçü birden +1 🎫 günlük ödül, `save.dq`, `save.dqc`) ve **📅 haftalık** (pazartesi, aşağıdaki ödüller, üçü birden +2 🎫 haftalık ödül, `save.wk`). Sayılar günlük / haftalık:

  | Görev | M1–M2 | M3–M5 | M6+ | Haftalık ödül |
  |---|---|---|---|---|
  | Bölüm bitir | 3 / 15 | 5 / 25 | 5 / 40 | +1 🎫 +1 💡 |
  | Bölümü kusursuz bitir | 2 / 6 | 3 / 12 | 3 / 20 | +1 🎫 + ❤️∞ 30 dk |
  | İpucusuz bölüm bitir | 2 / 6 | 3 / 12 | 3 / 20 | +1 🎫 + ❤️∞ 15 dk |
  | Günün Hattı bitir | — | 1 / 4 | 1 / 5 | +1 🎫 + ❤️∞ 30 dk |
  | Güçlendirici kullan | — | 1 / 3 | 1 / 4 | +1 🎫 +1 💡 |

  - Günün Hattı görevi yalnız Günün Hattı'nı bir kez bitirmiş ya da 61. bölüme gelmiş oyuncuya çıkar; güçlendirici görevi yalnız elinde o kadar güçlendirici olana. Görevler haftanın ilk açılışında o anki duruma göre seçilir ve hafta boyunca değişmez.
  - Kusursuz bitirilmiş (bileti alınmış) bir bölümü yeniden oynamak sayılmaz (kolay bölümde biriktirilmesin). İpucu kullanılan bölüm "ipucusuz" görevine sayılmaz (yarım oyunla ve baştan başlamayla korunur).
  - Ödül görev tamamlandığı an verilir; ekrana üstten bildirim olarak düşer (rozet bildirimiyle aynı sıra, sonuç paneline yazılmaz). Haftalık üç görev birden bitince +2 🎫 (haftalık ödül); günlük üç görev birden +1 🎫 (günlük ödül).
  - Giriş: ana sayfada Günün Hattı kartının altında tek ince satır ("🎯 Görevler · ☀️ 1/3 · 📅 2/3"). Satır ilk hat bitene ya da ilk Günün Hattı'na dek gizlidir.
- **🎫 Bilet:** Oyunun tek para birimidir (eski adı taç 👑; kayıtta `crowns`, `crownBal` adları uyum için kaldı). Ana sayfadaki çip bakiyeyi gösterir. Görevler bilete ek olarak **❤️∞ sınırsız can** verebilir: `save.infUntil = max(infUntil, şimdi) + süre` (can sistemiyle ortak kayıt: `save.lives` 0–5, `save.lifeT`, `save.infUntil` ms; can sistemi §9 › Son süre ve can).
- **Günün Hattı:** bitirmek +1 🎫 (günde bir; pratik ve arşiv vermez, `save.dt`), kusursuz bitirmek +1 🎫 daha (eskiden yalnız kusursuz 1 taç veriyordu). Günde en çok 2 🎫: bir kusursuz bölüm (1 🎫) ile seri bonusu (5 kusursuzda +1) arasında, temalar hızlanmadan Günün Hattı'nı oynamaya değer kılar. Haftada görevlerden en çok 4 🎫, Günün Hattı'ndan en çok 14 🎫.
- Kod: `QUESTS`, `weekQ`, `questStep`, `questRow`, `questSheet`; kayıt `save.wk = { id: pazartesi, q: [{ t, n, p }], all }`, görev bileti `save.qc`, sınırsız can `giveInf`.

### Günün Hattı arşivi

- Seri penceresinden ("📅 Geçmiş günler") ya da görev penceresinden açılır. Son 30 günün Günün Hattı'nı listeler (pazarlar alt çizgili).
- Oynanmış günler (✓, kusursuzsa 🎫) bedava açıktır ama ödül vermez. Kapalı bir gün (🔒) **3 🎫** ile **kalıcı** açılır (`ARCH_COST`, `save.arch`). Bedel bir sandığın (10 🎫) üçte biri, bir kusursuz geçmiş günün getirisinin (1 🎫) üç katıdır: arşiv bilet kazanma yolu değil, kaçırılan günü oynama hakkıdır.
- Arşiv seriyi, günlük kaydı ve bugünün sonucunu etkilemez. O günün ilk bitişi kusursuzsa 1 🎫 verir (normal Günün Hattı kuralı; `save.aCrowns`) ve Günün Hattı görevine sayılır (`save.archDone`).
- Paylaşım "Günün Hattı 12.10 · geçmiş gün" diye yazar ve meydan okuma bağlantısı taşımaz (arkadaşın açınca "eski" görmesin).
- Yarım oyun ayrı tutulur (`runs.arch`), bugünün yarım Günün Hattı'nı ezmez. Kod: `archSheet`, `start('arch', gün)`.

## 7. Doğrulama

Test robotu (`tools/hakem.cjs`) her değişiklikte şunları kontrol eder:

- Hat uzunlukları 12, 16, 20, 24, sonra hep 28.
- Her hattın ortalama zorluk puanı bir öncekinden yüksek.
- Sonsuzda zorluk %99'a ulaşıyor.
- Günün Hattı haftalık dalga çiziyor, %40'ın altına düşmüyor, zamanla yükseliyor.
- Eşli karolu 600 bölümün hepsi çözülebiliyor; hiçbir bölümde ve Günün Hattı'nda sabit karo yok.
- Yeni kuralların her biri kendi testinde yüzlerce üretimle denenir: çözüm geçerli, başlangıç çözülmüş değil, kural kartı çıkıyor, robot bölümü kazanıyor; kuralın hattından önceki bölümler ve Günün Hattı eklenti yüklü/yüksüz bit bit aynı. Testler bölüm numarası yazmaz, hat başını kuraldan okur (`AT('fog')`, `RL.ring`, `seenTo(c)`); kural sırası ya da hat boyu değişince kendiliğinden uyar.
- Bir bölümü üretmek tarayıcıda 60 ms'nin altında sürüyor; sonraki bölüm kazanma ekranındayken önceden hazırlanıyor.

## 8. Bilet ekonomisi (renk temaları)

🎫 bilet oyunun para birimidir (31 Ekim'e dek adı taç 👑 idi). Kusursuz bitirilen her bölüm (⏱ ve ↻ hedefi aynı oyunda) bir kez 1 🎫 verir; Günün Hattı'nı bitirmek 1 🎫, kusursuz bitirmek 1 🎫 daha; arşivden geçmiş bir günü kusursuz bitirmek 1 🎫; her haftalık görev 1 🎫, üçü birden 1 🎫 ek (bkz. bölüm 6). Harcama: temalar, sandık (10 🎫) ve arşiv (gün başına 3 🎫). Hat finalini kusursuz bitirmek ve kusursuz serinin her 5 adımı birer bonus 🎫 daha verir (bkz. bölüm 9). Taç bir para birimidir: tema satın alınınca bakiyeden düşer ve geri gelmez. Fiyatlar hızla artar, oyuncu bölümleri daha başarılı geçmeye zorlanır.

| Tema | Fiyat |
|---|---|
| Metro | Hazır |
| Gün Batımı | 🎫 5 |
| Okyanus | 🎫 25 |
| Orman | 🎫 40 |
| Çöl | 🎫 55 |
| Sakura | 🎫 70 |
| Neon Gece | 🎫 90 |
| Kuzey Işıkları | 🎫 110 |
| Lav | 🎫 135 |
| Kozmos | 🎫 160 |
| Buzul | 🎫 190 |
| Bahar | 🎫 220 |
| Sonbahar | 🎫 250 |
| Mercan Resifi | 🎫 280 |
| Çay Bahçesi | 🎫 310 |
| Lale | 🎫 340 |
| Fırtına | 🎫 370 |
| Gece Yarısı | 🎫 400 |
| Gökkuşağı | 🎫 440 |
| Retro Dalga | 🎫 480 |
| Pastel | 🎫 520 |
| Şafak | 🎫 560 |
| Altın, Elmas, Yakut | Yalnızca Reklamsız paketle |

Toplam 25 renk teması vardır: 22'si biletle, 3'ü Reklamsız paketle açılır. Mağazadaki **Tema paketi** (`ray_temalar`, tüketilemez) 22 biletli temanın hepsini birden açar (`save.allThemes`; 3 özel tema yine Reklamsız pakette kalır). Bunlara ek olarak 6 **mevsim teması** yalnız kendi tarihinde gelir (bölüm 10).

**Satın alınan bilet (31 Ekim):** taç para birimi 🎫 bilet olarak yeniden adlandırıldı (kodda `crown` adları aynı). Mağazadaki **Bilet paketi** (`ray_bilet_50`) 50 bilet verir. Bunlar ayrı sayılır (`save.bCrowns`, harcanan kısmı `save.bSpent`): bakiyeye (`crownBal`) eklenir ve **yalnız temada** harcanır; tema alınırken önce satın alınan bilet düşer. Sandık yalnız kazanılan biletle açılır (`chestBal` = kazanılan − sandığa/temaya giden kazanılmış taç). Böylece gerçek parayla rastgele ödül (ganimet kutusu) alınamaz. Kazanılan sayı (`crownCount`) satın almadan etkilenmez. Bunlara ek olarak 6 **mevsim teması** yalnız kendi tarihinde gelir (bölüm 10).

### Özel teklif (3 Kasım)

Satın alma ürünleri seyrek bir **Özel teklif** penceresiyle de önerilir. Oyunun temposunu bozmasın diye kurallar sıkıdır:

- Yalnız bir **bölüm kazanıldıktan** sonra (sonuç paneli açıldıktan ~1,5 sn sonra); başka pencere ya da puan isteği varsa o tur yok.
- En çok **48 saatte bir**; ilk açılıştan sonraki **ilk 2 günde** ve **ilk 15 bölümde** hiç (16. bölümden itibaren).
- **Günün Hattı**, arşiv, pratik ve zen bitişlerinde yok.
- Aynı turda **geçiş reklamıyla birlikte çıkmaz**: o turun "Sonraki"sinde geçiş reklamı varsa teklif ertelenir.
- İçerik gerçek mağaza ürünüdür (sıra: 🎁 Başlangıç paketi `ray_baslangic` → Reklamsız paket → Güçlendirici paketi → 30 ipucu); reklamsız sahibine Reklamsız paket gösterilmez.
- Sahte indirim, üstü çizili fiyat ya da geri sayım yoktur; "Hayır, teşekkürler" belirgindir.

Başlangıç paketi: 10 💡 + her güçlendiriciden 2 + ❤️∞ 1 saat sınırsız can (`save.infUntil = max(infUntil, şimdi) + 60 dk`) + 20 🎫 satın alınan bilet (yalnız temada; sandık açmaz). Ayrıntı ve mağaza kuralları: `docs/MAGAZA.md` §10.3.

### Hat adları ve renkleri

Sonsuz bölümlerde hiçbir hat bir öncekinin kopyası olmaz:

- **Adlar:** Hat adları renk değil, yer adıdır; böylece hangi renk teması seçilirse seçilsin ad renkle çelişmez. İlk 25 hat: Liman, Çarşı, Sahil, Kule, Bahçe, Köprü, Fener, Vadi, Pınar, Meydan, Tepe, Ada, Saray, Rıhtım, Kanal, Çınar, Yayla, Koru, Kervan, Değirmen, Göl, Bağ, Pazar, Kale, Gar. Sonra "Yeni Liman", "Eski Liman", "Kuzey Liman"… diye sürer, 275 hattan sonra numara eklenir ("Liman 2").
- **Metro (varsayılan) renkleri:** Algısal renk uzayında (OKLCH) üretilir, bu yüzden bütün hatlar eşit parlaklıkta ve koyu/açık zeminde okunur. Ton, altın oran adımıyla ilerler; komşu hatlar renk tekerleğinde en az ~115° ayrıdır ve hiçbir hat birebir tekrar etmez. M1 turuncudur.
- **Renk temaları:** Her tema bir renk ailesidir. İlk 6 hat temanın temel tonlarıdır; sonraki turlarda ton ve parlaklık kayar. Her hat için birkaç aday denenir: komşu hattan ve 6 hat öncekinden yeterince ayrışan, daha önce kullanılmamış ilk aday seçilir.
- **Uyarı rengi:** İki hat değince yanan kırmızı hiçbir hat rengiyle karışmaz. Metro renkleri kırmızının çevresini atlar; kırmızı ağırlıklı temalarda (Lav, Yakut…) oyun içi uyarı rengi kehribara döner.

Robot her temada ilk 60 hattı, koyu ve açık görünümde ayrı ayrı denetler.

### Sürpriz sandık

Biletlerin temalar dışındaki tek harcama yeri. Oyun içinde kendiliğinden çıkmaz; oyuncu Renk temaları sayfasından **🎫 10** harcayarak açar. İçinden asla bilet çıkmaz, böylece biletle bilet kazanma kumarı oluşmaz. Satın alınan bilet (Mağaza › Bilet paketi) sandıkta kullanılamaz; sandık yalnız kazanılan biletle açılır, bu yüzden sandık parayla açılamaz.

| Nadirlik | Olasılık | İçerik |
|---|---|---|
| Sıradan | %60 | +2 💡 ipucu ya da 1 güçlendirici (yarı yarıya) |
| Nadir | %28 | üçte bir 🛡 seri kalkanı, üçte bir 2 güçlendirici, kalanın dörtte üçü ❤️∞ 15 dk sınırsız can, dörtte biri +4 💡 (en çok 3 kalkan birikir, doluysa 💡) |
| Destansı | %12 | %30 ❤️∞ 30 dk sınırsız can, %70 sahip olunmayan bir tren kaplaması (hepsi varsa yarı yarıya ❤️∞ 30 dk ya da 3 güçlendirici). Şanssızlık korumasıyla gelen destansı her zaman kaplamadır. |

**Güçlendiriciler** (31 Ekim). Sandıktan çıkar; oyunda kalıcı düğmeleri yoktur, yalnız işe yaradığı an alt çubukta belirir (sağ üstte kalan sayı). İlgili kural açılmadan sandıktan çıkmaz. Ölçülen dağılım (600 sandık, sayaçlı ve karanlık tünel açılmış oyuncu): 💡 %38, güçlendirici %40, 🛡 %9, kaplama %12.

| Güçlendirici | Ne zaman görünür | Ne yapar | Sandıktan çıkmaya başlar |
|---|---|---|---|
| 🔄 Ek tur | Hakkı biten sayılı karoya (yanlış yöndeyken) dokununca sorulur | Karo bir kez daha döner | M7 |
| 🔦 Fener | Karanlık tünel bölümünde | 5 sn bütün tahta aydınlık, sonra yeniden kararır | M6 |
| ⏱ +15 sn | Son 10 saniyede, ⏱ yıldızı yanarken | Süre hedefi 15 sn uzar (yarım oyunla birlikte kaydedilir) | baştan |
| ↶ Geri al | Hamle yapılmışken | Son 5 hamle silinir, hamle sayacı geri gider (ipucu kullanılınca geçmiş sıfırlanır) | baştan |

Kod: `BST`, `bstUi`, `undo`, `lamp`, `plus15`, `turSheet`; test: `tools/hakem/guclendirici.cjs`.

**Algoritma:**

- Her oyuncunun ilk sandıkta bir kez belirlenen kendi tohumu vardır.
- Sonuç, bu tohum ve sandığın sıra numarasından ağırlıklı çekilişle hesaplanır.
- Sonuç bilet harcandığı anda ödülle birlikte kaydedilir. Uygulamayı kapatıp açmak sonucu değiştirmez.
- **Şanssızlık koruması:** 7 sandık üst üste destansı çıkmazsa 8. sandık destansı olur.
- Olasılıklar sandık ekranında tek satırda yazılıdır; yanındaki **?** sandıktan ne çıkabileceğini gösterir.
- **Açılış:** sandık tam ekranda düşer; dokununca kapak açılır, ödül sandıktan fırlar (ipucu ve kalkanda sağ altta sayı rozeti, kaplamada trenin kendisi). Ödül açılış başlamadan kaydedilmiştir.

**Ödüller:**

- **🛡 Seri kalkanı:** Kusursuz seri kırılacağı zaman bir kez devreye girer ve seriyi korur.
- **🚆 Tren kaplaması:** Sefer şeridindeki trenin görünüşünü değiştirir. Hat rengine ek olarak 8 kaplama vardır: Kırmızı Ekspres, Gece Treni, Nane, Retro, Gün Batımı, Buz, Lavanta, Altın Ekspres.

## 9. Sefer şeridi ve kusursuz seri

Bu iki sistemin amacı oyuncuya "bir bölüm daha" dedirtmektir. Yıldız süresi dolunca oyun bitmez, yalnızca ⏱ yıldızı söner; bölüm ancak çok geç kalınınca, **son süre** dolunca biter (aşağıda › Can).

**Sefer şeridi (tren sayacı):**

- Saatin altındaki ince ray şeridinde küçük bir tren, süre hedefi boyunca sinyale doğru ilerler.
- Rayın yanan kısmı bağlantı oranıdır (yanan karo / bütün karo): oyuncu rayı döşer, tren arkasından gelir. Eski ayrı "%" çubuğu kaldırıldı; tek şerit hem süreyi hem ilerlemeyi gösterir.
- Son 10 saniyede sinyal sarıya döner.
- Süre dolunca sinyal kırmızıya döner; tren sinyalde bekler ve "+0:12 rötar" sayar.
- Rötar sürerken peronda yolcular arada bir nazik ve esprili bir laf atar (3, 15 ve 30. saniyelerde, en fazla 3 kez).
- Bulmaca bitince tren perona girer. Rötar varsa yolcular "Nihayet! 👏" der.
- Aynı anda **şehir canlanır**: arkaplandaki metro haritası parlar, duraklar sarı yanar, ekran dışından ekran dışına bir tren bir hattan geçer (`cityUp`). Sonraki bölümde ya da menüye dönünce söner. "Hareketi azalt" açıksa tren geçmez, yalnız ışık yanar.
- Telefonda "hareketi azalt" ayarı açıksa tren akarak değil, 8 kademede ilerler.

**Son süre ve ❤️ can (3 Kasım):**

- **Son süre** (`lastCall`) = max(2 × yıldız süresi, yıldız süresi + 60 sn). Yıldız süresi (`limits().t`) değişmedi.
  - Gerekçe: yıldız süresi kusursuzluk hedefidir ve ¾'e sıkılaştı (en az 11 sn); "bitirememe" eşiği ondan çok daha gevşek olmalı. 2 kat, uzun bölümde düşünme payını orantılı büyütür; +60 sn tabanı kısa bölümlerde (11–30 sn hedef) takılan oyuncuya en az bir dakika rötar tanır. Robot ve kusursuz oynayan oyuncu buna hiç yaklaşmaz.
  - Rötardayken son 10 sn: sinyal kırmızı, sakince yanıp söner; şeritte süre yerine "🚉 0:09" yazar ve bir kez "🚉 Son trene 10 sn" bildirimi çıkar. Ayrı gösterge yok.
  - ⏱ +15 güçlendiricisi son süreyi de 15 sn uzatır ve son süreye 10 sn kala da belirir.
  - Son süre dolarsa bölüm **başarısız**: tahta kilitlenir, yarım oyun silinir, "🚉 Son tren kaçtı" penceresi (kalan canlar kalp sırasıyla) · **Tekrar dene** (alt satırda kalan can) · Ana sayfa. 1 ❤️ gider.
  - Eski bir yarım oyun son süreyi geçmişse açılışta son 10 sn'ye çekilir (uyarıyla sürer, anında düşmez).
  - ↺ Baştan başlamak can harcamaz (süre de sıfırlanır); can yalnız son süre dolunca gider. Oyun sakin kalır: ceza bekleyene değil, takılıp bırakmayana.
- **Can:** en çok 5, 30 dk'da 1 dolar. Dolum kayıttaki zaman damgasından hesaplanır (`lives()`), bu yüzden uygulama kapalıyken ve çevrimdışıyken de doğrudur; saat geri alınırsa sayaç şimdiye çekilir. Kayıt sözleşmesi (adlar sabit): `save.lives` (0–5, yoksa 5), `save.lifeT` (son dolum hesabı, ms; dolu candan düşünce başlar), `save.infUntil` (bu ana dek ❤️∞ sınırsız can, ms; haftalık görev ve sandık yazar).
  - 0 canda yeni bölüm başlamaz (aynı bölümün yarım oyunu sürer): "Canın kalmadı" penceresi sıradaki cana geri sayar, **▶ Video izle → +1 ❤️** (ödüllü video), can dolunca ya da videodan sonra Oyna.
  - ❤️∞ sınırsız can açıkken başarısızlıkta can gitmez, 0 canda da oynanır.
  - **Günün Hattı, geçmiş gün arşivi ve 🍃 zen** can harcamaz ve son süreleri yoktur.
  - Gösterge: ana sayfada yalnız Oyna düğmesinin alt satırı ("Bölüm 12 · ❤️ 4 · 23:10", sınırsızda "❤️∞ 14:59", zen'de yazmaz). Oyunda can gösterilmez; yalnız son süreye 10 sn kala sinyal.
  - Ölçüm: `Olcum.event('life_lost', { lvl })` (can gerçekten gidince), `Olcum.event('life_refill_ad')`.
  - Kod: `lastCall`, `lives`, `loseLife`, `addLife`, `fail`, `failSheet`, `lifeSheet`, `lifeRow`; test `tools/hakem/can.cjs` (`--only=can`).

**Kusursuz seri (✨):**

- Bileti alınmamış bir bölümü kusursuz bitirmek seriyi 1 artırır; kusursuz olmadan bitirmek seriyi sıfırlar. Bileti alınmış bölümleri yeniden oynamak seriyi etkilemez, bu yüzden seri eski bölümlerde biriktirilemez.
- Seri 2 ve üstündeyken saatin yanında ✨ sayısı görünür. Hedeflerden biri kaçarsa ✨ sönükleşir ve "↺ baştan → seri sürer" bildirimi çıkar (baştan başlamak süreyi de sıfırlar).
- Ödüller: 3. kusursuz bölüm +1 ipucu; 5, 10, 15… kusursuz bölüm +1 bonus 🎫.
- Seri kırılınca oyuncu aynı bölümü kusursuz bitirirse seri kaldığı yerden sürer. Başka bir bölümü bitirince bu hak düşer.

**Kıl payı tekrar:**

- Hedef az farkla kaçtıysa (en çok 4 sn rötar ve en çok 2 hamle fazla; süre hedefi ¾'e inince 5 sn'den indi) ya da seri kırıldıysa, sonuç panelinde büyük düğme "Tekrar dene" olur ve Sonraki altına küçük iner. Öteki durumda panelde tek ana düğme (Sonraki) vardır: tekrar sağ üstteki ↺, ana sayfa sol üstteki ‹; tahtaya dokunmak paneli küçültür. Boşalan yer bölüm sonu başarımlarına ayrıldı.
- Büyük düğmenin alt satırı nedenini söyler: "Kıl payı · ⏱ 2 sn" ya da "🔥 4 seri geri gelsin".


## 10. Zen modu, mevsim temaları, şehir haritası, rozetler

Oyunun "meta" katmanı: bulmacaya dokunmaz. Kod: `www/game.js` › "meta" bölümü ve `G.zen` kancaları; test: `tools/hakem/meta.cjs` (`node tools/hakem.cjs --only=meta`). Para birimi 🎫 bilet olarak yeniden adlandırılıyor (eski adı 👑 taç; kayıt alanları aynı).

### Zen modu

- **Ayarlar › 🍃 Zen modu** (tek anahtar).
- Açıkken bölümlerde süre ve hamle hedefi gizlidir: tren şeridi, yıldız çipi, hamle hedefi, rötar ve "hedef aşıldı" uyarıları, kıl payı tekrar, ⏱ +15 güçlendiricisi yoktur; müzik gerilimi artmaz. Üstte yalnız "🍃 Zen" yazar.
- Her bitiş **3 ★** sayılır (hat kilitleri ilerler); **🎫 bilet verilmez**, ✨ kusursuz seri ne artar ne kırılır, kaçan hedef kaydı (`miss`) tutulmaz. Böylece bilet ekonomisi korunur: bilet isteyen oyuncu zen'i kapatıp aynı bölümü yeniden oynar.
- Anahtar `save.zen`'dir (can sistemi okur: zen'de can harcanmaz, süre başarısızlığı olmaz).
- **Günün Hattı zen'den etkilenmez**: herkes aynı koşulda oynar, 🎫 ve seri her zamanki gibi.

### Mevsim temaları

Tarihe bağlı, kendiliğinden gelen sınırlı süreli renk temalarıdır. **Öneri ve uygulanan: mevsimindeyken ücretsiz alınır**, mevsim bitince sahibinde kalır ve seçilebilir; mevsimi kaçıran oyuncu temayı göremez (bir sonraki yıl yine gelir). Biletle satılmaz: bilet ekonomisi değişmez, geri dönen oyuncuya küçük bir hediye olur. Yeni mevsim teması gelince bilet (👑) çipinde nokta yanar; temalar sayfasında en üstte "Mevsim teması · … tarihine dek ücretsiz" başlığıyla görünür.

| Tema | Dönem |
|---|---|
| ❄️ Kar Feneri (kış / yılbaşı) | 1 Aralık – 31 Ocak |
| 🌸 Erguvan (bahar) | 20 Mart – 20 Mayıs |
| ☀️ Yaz Gecesi | 15 Haziran – 31 Ağustos |
| 🍂 Hazan (sonbahar) | 1 Ekim – 30 Kasım |
| 🌙 Bayram Fenerleri | Ramazan Bayramı: ilk günden 2 gün önce – 6 gün sonra |
| 🌤 Bayram Sabahı | Kurban Bayramı: ilk günden 2 gün önce – 6 gün sonra |

Bayramların ilk günü (Diyanet takvimi; Ümmü'l-Kurâ hesabıyla 2026'da birebir aynı, sonraki yıllarda en çok 1 gün fark olabilir, pencere bunu karşılar). Tablo `BAYRAM` sabitindedir; 2035'ten sonrası eklenmelidir.

| Yıl | Ramazan Bayramı | Kurban Bayramı |
|---|---|---|
| 2026 | 20 Mart | 27 Mayıs |
| 2027 | 9 Mart | 16 Mayıs |
| 2028 | 26 Şubat | 5 Mayıs |
| 2029 | 14 Şubat | 24 Nisan |
| 2030 | 4 Şubat | 13 Nisan |
| 2031 | 24 Ocak | 2 Nisan |
| 2032 | 14 Ocak | 22 Mart |
| 2033 | 3 Ocak · 23 Aralık | 12 Mart |
| 2034 | 12 Aralık | 1 Mart |
| 2035 | 1 Aralık | 19 Şubat |

Mevsim temaları da öteki temalar gibi robotta 60 hat boyunca renk ayrışması ve uyarı rengi için denetlenir. Robot tarihi `window.__rayDate` ile değiştirir.

### Şehir haritası

Kod: `www/game.js` › "meta" bölümü; test: `tools/hakem/meta-2.cjs` (`node tools/hakem.cjs --only=meta-2`). Menüler sade kalsın diye yeni büyük düğme yoktur.

- **Giriş:** ana sayfadaki logo (dokununca) ya da Hatlar ekranının başlığındaki şehir simgesi. Ekranda iki sekme vardır: **Şehir** ve **Rozetler**.
- **Semt:** her hat şehrin bir semtidir; semt hattın adını (`lineName`, ör. "M5 · Bahçe Hattı") ve rengini (`lineCol`) taşır.
  - Hat baştan sona bitince semt **yanar**: hat renginde dolgu, ışıltı ve göz kırpan pencere ışıkları, merkeze uzanan metro kolu ve durak.
  - Hattın bütün bölümleri kusursuzsa (hepsinde 🎫 kazanılmış) semt **altın** parlar.
  - Sıradaki hat kesik çizgiyle "yapımda" görünür; ötekiler sönük kalır.
  - Semte dokununca altta bilgi kartı çıkar: ad, ★ ve 🎫 sayısı, durum (Semt yandı ✓ · ✨ Altın semt · N bölüm kaldı · 🔒 Kilitli).
- **Hat sınırları:** yalnız `lineStart`/`lineEnd`/`lineOf` ile okunur (hat boyu ve kural sırası değişebilir; sabit sayı yok). Biten hat sayısı `lineOf(save.level)`.
- **Düzen (sonsuz hat):** bir şehir 24 semttir ve **halka halka büyür**: merkez halkada 6, orta halkada 8, dış halkada 10 semt. 24. hattan sonra yeni şehir açılır (sayfa: Işık Kent, Liman Kent, Yıldız Kent, Gece Kent, Pınar Kent, Kuzey Kent, Ufuk Kent, Gökkent, sonra numaralı). Sayfa okları yalnız ikinci şehir açılınca görünür. Merkezdeki ışık halesi yanan semt oranıyla güçlenir.
- **Açılış:** son ziyaretten beri yanan semtler ekran açılınca sırayla yanar (`save.cityLit`).
- **Performans:** tek SVG; animasyonlar yalnız `transform` ve `opacity` (semt başına iki ışık grubu). "Hareketi azalt" açıksa ışıklar sabit yanar, açılış animasyonu olmaz.

### Rozetler

Yerel ve sunucusuzdur; **ödül yoktur** (🎫 ve ipucu ekonomisi değişmez). Kazanılınca ekranın üstünde küçük bir bildirim çıkar (dokunmayı engellemez); liste Şehir ekranının Rozetler sekmesindedir, kazanılmayanlarda ilerleme çubuğu görünür. Güncellemeden önce hak edilmiş rozetler ilk açılışta sessizce işlenir (bildirimsiz, tarihsiz). Kayıt: `save.ach` (kimlik → tarih), `save.bstUsed`, `save.wqAll`, `save.cityLit`.

| Rozet | Koşul |
|---|---|
| 🎫 İlk kusursuz · Kusursuz 10 · Kusursuz 100 | 1 / 10 / 100 bölüm kusursuz |
| 🏙 İlk semt | Bir hattı baştan sona bitir |
| ✨ Altın semt | Bir hattın bütün bölümleri kusursuz |
| 🧭 Kural ustası | Her kuralın hattını bitir (hatlar `RULE_LINE`'dan canlı okunur; eklenti kuralları dahil) |
| 🚇 100 bölüm · 500 bölüm | Bitirilen bölüm sayısı |
| 🔥 7 gün seri · 30 gün seri | Günün Hattı serisi (en iyi seri sayılır) |
| 🎁 İlk sandık · Sandık avcısı | 1 / 25 sürpriz sandık |
| ⚡ Güçlendirici | 10 güçlendirici kullan |
| 🎯 Haftanın yolcusu | Bir haftanın üç görevini bitir |
| 🍃 Zen yolcusu | Zen modunda 10 bölüm |
