# Ray — Bölüm tasarımı ve zorluk merdiveni

Bu belge, bölümlerin nasıl üretildiğini, hatların nasıl uzadığını ve zorluğun bölüm ilerledikçe nasıl arttığını anlatır. Kodda karşılığı `www/game.js` içindeki "hatlar", "zorluk puanı" ve "zorluk merdiveni" bölümleridir.

## 1. Temel ilke

- Bölümler elle çizilmez, her bölüm numarasından **aynı bulmaca** üretilir. Herkes 57. bölümde aynı haritayı görür.
- Bölüm sayısı **sonsuzdur**. Oyun hiçbir zaman "bitmez"; zorluk dalga dalga artar: her hat bir öncekinden zordur, hat içinde arada kısa **mola bölümleri** gelir (§5).
- Zorluk tek bir eğriyle yönetilir: **z(l) = 1 − e^(−l/170)**. Bu değer 0'dan başlar, hiç düşmez ve sonsuzda %100'e, yani "imkânsız"a yaklaşır ama hiç değmez. Oyuncu bu değeri ekranda "⚡ Zorluk %" olarak görür.

## 2. Hatlar: bölüm sayısı doğrusal artar

Her metro hattı bir öncekinden **4 bölüm daha uzundur**. M1 12 bölüm, M2 16, M3 20… Yeni hattın kilidi, önceki bütün bölümlerden ortalama **2,2 yıldız** toplayınca açılır.

| Hat | Bölümler | Bölüm sayısı | Kilidi açmak için | Zorluk | Ortalama zorluk puanı |
|---|---|---|---|---|---|
| M1 | 1–12 | 12 | — | %1–7 | 5,4 |
| M2 | 13–28 | 16 | ★ 26 | %7–15 | 6,6 |
| M3 | 29–48 | 20 | ★ 62 | %16–25 | 7,2 |
| M4 | 49–72 | 24 | ★ 106 | %25–35 | 8,3 |
| M5 | 73–100 | 28 | ★ 158 | %35–44 | 9,3 |
| M6 | 101–132 | 32 | ★ 220 | %45–54 | 10,3 |
| M7 | 133–168 | 36 | ★ 290 | %54–63 | 11,6 |
| M8 | 169–208 | 40 | ★ 370 | %63–71 | 12,3 |
| M9 | 209–252 | 44 | ★ 458 | %71–77 | 13,0 |
| M10 | 253–300 | 48 | ★ 554 | %77–83 | 13,6 |
| … | | +4 | | → %100 | → ~16 |

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
| Sabit karo oranı | %16 (M3'ten itibaren) | 0'a iner | Sabit karolar ipucu gibidir; azaldıkça bulmaca zorlaşır |
| Taranan aday | 6 | 32 | Hedefe daha yakın (daha zor) bulmaca bulunur |
| Hamle toleransı | Bol (par'ın ~2 katı) | z %30'u geçince yavaşça yarıya iner | ↻ yıldızı ve taç zorlaşır |
| Süre hedefi | Gereken dokunuşa göre | Zor bulmacaya düşünme payı eklenir (+3 sn/puan) | Zor bölüm haksız olmaz |

Izgara boyu bölüme göre büyür: 1–3 3×3 · 4–8 4×4 · 9–15 4×5 · 16–25 5×6 · 26–40 5×7 · 41–60 6×8 · 61+ 7×9.

## 5. Yeni kurallar (öğrenme basamakları)

| Hat | İlk bölüm | Kural | Ne yapar? |
|---|---|---|---|
| M3 | 29 | 🔩 **Sabit karo** | Koyu, cıvatalı karolar dönmez; zaten doğru yöndedir. |
| M4 | 49 | 🔗 **Eşli karo** | Aynı numaralı iki karo birlikte döner. |
| M5 | 73 | ↺ **Ters karo** | Oklu karo saat yönünün tersine döner. |
| M6 | 101 | 🌑 **Karanlık tünel** | Hattın ulaşmadığı karolar karanlıktır, dokunulamaz; yanan hattın 2 karo yakını aydınlanır; bağlantı kopunca o bölge yeniden kararır. Merkez başta yalnız başlar. |
| M7 | 133 | 🔢 **Sayaçlı karo** | En fazla 3 kez döner, sayı bitince kilitlenir. Önce düşün, sonra dokun. |
| M8 | 169 | 🚉 **İki merkez** | İki istasyon, iki renk; her durak kendi merkezine bağlanmalı. İki hat birbirine değerse kırmızı yanar, bölüm bitmez. |
| M9 | 209 | ✂ **Makas** | Dönmez; dokununca yol düz ile sapak arasında değişir. Kesik çizgi öbür yolu gösterir. |
| M10 | 253 | ⊙ **Kapak** | Kapaklı karonun rayı görünmez ve dönmez; doğru yönde durur. Hangi yönlere açıldığı komşulardan çıkarılır. |
| M11 | 301 | 🌉 **Köprü** | İki hat üst üste geçer ama birleşmez; köprü dönmez, dört ucuna da ray bağlanmalı. |
| M12 | 353 | ? **Silik kol** | Soluk kolun altında ray olabilir de olmayabilir de; karo dönünce "?" de döner. Gerçeği komşulardan çıkarılır. |
| M13 | 409 | ➜ **Yön tabelası** | Tabelalı karodan merkeze giden yol okun gösterdiği kenardan çıkmalı; karo döner, tabela dönmez. |
| M14 | 469 | ⌂ **Gizli depo** | Kenardaki ayracın altındaki üç karodan tam biri dışarı, depoya çıkar; hangisi olduğu gizli. |
| M15 | 533 | ◉ **Döner tabla** | Dört karoyu taşır; dokununca tabla bütünüyle 90° döner, karolar yer değiştirir. |
| M16 | 601 | ⊘ **Kapalı durak** | Bazı duraklar kapalı ama sıradan görünür; merkezdeki ⊘ sayısı kaç tane olduğunu söyler. Kapalıya ray bağlanmaz. |
| M17 | 673 | ◯ **Halka hat** | Raylar bir kez kendi üstüne kapanır; halka kesik çemberli karodan geçmeli. |
| M18 | 749 | ≈ **Nehir** | Ray nehri geçitten geçer ya da kıyıda tamponla biter; kıyıda tam rozetteki sayı kadar tampon olmalı (eksikse döngü var). |
| M19 | 829 | ⊂ **Tünel ağzı** | Kenardaki aynı harfli iki ağız bağlıdır: birine giren ray öbüründen çıkar. Tünel kullanmak zorunlu değil. |
| M20 | 913 | ⇄ **Tarife bölgesi** | Merkezi saran bölge sınırında ray geçer ya da tamponla biter; geçiş ve tampon sayıları rozetle aynı olmalı. |
| M21+ | — | Karma hatlar | Yeni kural yok; her bölümde öğrenilmiş kurallardan 1–2 tanesi. |

**Zor kurallar (M10–M20 çift hatlar):** Oyuncu geri bildirimi "yeni kurallar zorluk katmıyor" oldu. Çift hatların kuralları bu yüzden gizli bilgi (kapak, silik kol, gizli depo, kapalı durak) ya da küresel sayım (nehir, tarife bölgesi) üzerine kuruludur: yerel çıkarım çıpalarını bozar, oyuncuyu komşulardan ve sayılardan akıl yürütmeye zorlar. Her biri aynı tohum ve boyutta zorluk puanını ölçülerek artırır (7×9'da +3 ile +8 arası) ve gördüğün bilgiyle tek çözüme iner (üretimde çözüm sayımıyla denetlenir). Ayrıca her kuralın bir **zorluk payı** (`boost`) vardır: kuralın kendi hattının ilk 3 bölümü dışında seçicinin hedef puanına eklenir, böylece kurallı bölüm kolay tabandan seçilip fark silinmez. Paylar: makas 1,5 · kapak 2,5 · köprü 2 · silik kol 2,5 · tabela 1,5 · gizli depo 3 · tabla 2 · kapalı durak 3,5 · halka 1,5 · nehir 3,5 · tünel 2 · tarife bölgesi 4.

M9 ve sonrasının kuralları çekirdekte değil, eklenti dosyalarındadır (`www/rules/*.js`). Her kuralın tasarımı, çözülebilirlik kanıtı ve ölçümleri `docs/kurallar/` altındadır; eklenti sözleşmesi `docs/kurallar/README.md`'dedir.

**Öğretme:**

- Yeni kuralın ilk girişinde animasyonlu bir kural kartı çıkar.
- Yeni kural gelen hattın ilk 3 bölümü bir boy küçük ızgarayla gelir, yalnızca o kuralı içerir ve ilk bölüm biraz daha kolay seçilir (testere dişi).
- **Mola bölümü (☕):** M2'den itibaren her hattın 6., 12., 18.… bölümü (ilk 3 öğrenme bölümü ve son durak hariç) bir boy küçük ızgarayla gelir; hedef zorluk puanı `5 + 11·z·0,55`, kural payı yok. Ölçüm: mola bölümleri hattın ortalamasından yaklaşık %25 kolay (ör. M8'de 6×8 ve 9 puan, komşuları 7×9 ve 12 puan). Oyunda başlıkta "⚡%" yerine "☕ mola", ana sayfada "☕ mola bölümü" yazar. Uzun hatlarda yorgunluğu kırar; hat ortalamaları yine her hatta artar. Kod: `breath(l)`.
- **Kısa bölüm:** 7×9 ızgaralı hatlarda her 6 bölümün biri (hattın 3., 9., 15.… bölümü; öğrenme bölümleri ve son durak hariç) 6×8 gelir. Zorluk hedefi aynıdır (ör. 183: 6×8 ve 12 puan, komşuları 7×9 ve 12 puan); yalnız bölüm kısalır, büyük ızgara yorgunluğu kırılır. Kod: `short(l)`.

**Kural dönüşümü:**

- Kurallar üst üste yığılmaz. Bir kural kendi hattında her bölümde vardır.
- Sonraki hatlarda kendi kuralına ek olarak bölüm bölüm değişen en fazla 1 eski kural gelir.
- M20 sonrası karma hatlardır: her bölüm 1–2 kuralın farklı bir karışımıdır. Kurallı hatlarda da bölümlerin yaklaşık yarısına bir eski kural eklenir. M9–M20 arasında ek kuralın yarısı en yeni 3 kuraldan seçilir, böylece yeni öğrenilen kural sık tekrar eder. M21 ve sonrasında bütün kurallar eşit sıklıkta gelir ve hedef puana sabit +2 pay eklenir; sınırsız karma M20 düzeyinde kalır.
- Ölçülen merdiven (hat ortalaması, zorluk puanı): M8 12,3 · M9 14,6 · M10 16,3 · M11 16,4 · M12 17,8 · M13 17,2 · M14 19,0 · M15 18,2 · M16 19,5 · M17 18,5 · M18 20,8 · M19 19,0 · M20 20,5 · M21+ ~19,6–20. Çift hatlar (zor kurallar) tepe, tek hatlar kısa bir soluklanmadır; genel çizgi yükselir.
- Birlikte gelemeyen kurallar vardır (çakışan kural sıradaki uyumlu kuralla değişir): halka ↔ tabela, köprü; kapak ↔ karanlık tünel, silik kol; kapalı durak ↔ kapak, silik kol, gizli depo; nehir ↔ köprü, tabla, halka, tarife bölgesi; tarife bölgesi ↔ iki merkez.
- Böylece tahta kalabalıklaşmaz ve her bölüm biraz farklı hissettirir.

**Hat finali (🏁 Son durak):**

- Her hattın son bölümü finaldir: zorluk hedefi +2 puan, en çok aday taranır.
- Tahtada altın çerçeve olur, haritada 🏁 işareti görünür.
- Finali kusursuz bitiren oyuncu bir kez **+1 bonus 👑** kazanır. Hattın son bölümü olduğu için +2 ipucu da verir.

## 6. Günün Hattı

- Herkes aynı gün aynı bulmacayı oynar, paylaşım ve karşılaştırma bu sayede adil kalır.
- Zorluk **haftalık bir dalga** çizer: Pazartesi haftanın en kolayı, her gün biraz zorlaşır, Pazar en zorudur (%85–100). Oyuncu hafta boyunca ısınır, Pazar "büyük bulmaca" günüdür.
- Dalganın dibi ve tepesi bir yıl içinde yavaşça yükselir (dip %45 → %60, tepe %85 → %97); oyuncu oyuna alıştıkça daha zor bulmacaları çözebilir.
- Her hafta ±%8 farklıdır, haftalar birbirinin kopyası olmaz.
- Hiçbir gün **%40'ın altına düşmez**; Günün Hattı hiçbir zaman fazla kolay olmaz.
- Sabit ve eşli karo içermez (kuralları bilmeyen yeni oyuncu da oynayabilir); ızgara 7×9'dur.

| Hafta | Pzt | Sal | Çar | Per | Cum | Cmt | Paz |
|---|---|---|---|---|---|---|---|
| 26 Ekim 2026 | %45 | %50 | %56 | %63 | %70 | %77 | %85 |
| 2 Kasım 2026 | %52 | %56 | %62 | %69 | %76 | %84 | %92 |
| 6 Eylül 2027 | %66 | %70 | %76 | %82 | %89 | %96 | %100 |

## 7. Doğrulama

Test robotu (`tools/hakem.cjs`) her değişiklikte şunları kontrol eder:

- Hat uzunlukları 12, 16, 20… diye doğrusal artıyor.
- Her hattın ortalama zorluk puanı bir öncekinden yüksek.
- Sonsuzda zorluk %99'a ulaşıyor.
- Günün Hattı haftalık dalga çiziyor, %40'ın altına düşmüyor, zamanla yükseliyor.
- Sabit ve eşli karolu 600 bölümün hepsi çözülebiliyor.
- Yeni kuralların her biri kendi testinde yüzlerce üretimle denenir: çözüm geçerli, başlangıç çözülmüş değil, kural kartı çıkıyor, robot bölümü kazanıyor; 1–208. bölümler ve Günün Hattı eklentilerden önceki hâliyle bit bit aynı.
- Bir bölümü üretmek tarayıcıda 60 ms'nin altında sürüyor; sonraki bölüm kazanma ekranındayken önceden hazırlanıyor.

## 8. Taç ekonomisi (renk temaları)

Kusursuz bitirilen her bölüm (⏱ ve ↻ hedefi aynı oyunda) bir kez 1 👑 verir; Günün Hattı'nı kusursuz bitirmek de 1 👑. Hat finalini kusursuz bitirmek ve kusursuz serinin her 5 adımı birer bonus 👑 daha verir (bkz. bölüm 9). Taç bir para birimidir: tema satın alınınca bakiyeden düşer ve geri gelmez. Fiyatlar hızla artar, oyuncu bölümleri daha başarılı geçmeye zorlanır.

| Tema | Fiyat |
|---|---|
| Metro | Hazır |
| Gün Batımı | 👑 5 |
| Okyanus | 👑 25 |
| Orman | 👑 40 |
| Çöl | 👑 55 |
| Sakura | 👑 70 |
| Neon Gece | 👑 90 |
| Kuzey Işıkları | 👑 110 |
| Lav | 👑 135 |
| Kozmos | 👑 160 |
| Buzul | 👑 190 |
| Bahar | 👑 220 |
| Sonbahar | 👑 250 |
| Mercan Resifi | 👑 280 |
| Çay Bahçesi | 👑 310 |
| Lale | 👑 340 |
| Fırtına | 👑 370 |
| Gece Yarısı | 👑 400 |
| Gökkuşağı | 👑 440 |
| Retro Dalga | 👑 480 |
| Pastel | 👑 520 |
| Şafak | 👑 560 |
| Altın, Elmas, Yakut | Yalnızca Reklamsız paketle |

Toplam 25 renk teması vardır: 22'si taçla, 3'ü Reklamsız paketle açılır.

### Hat adları ve renkleri

Sonsuz bölümlerde hiçbir hat bir öncekinin kopyası olmaz:

- **Adlar:** Hat adları renk değil, yer adıdır; böylece hangi renk teması seçilirse seçilsin ad renkle çelişmez. İlk 25 hat: Liman, Çarşı, Sahil, Kule, Bahçe, Köprü, Fener, Vadi, Pınar, Meydan, Tepe, Ada, Saray, Rıhtım, Kanal, Çınar, Yayla, Koru, Kervan, Değirmen, Göl, Bağ, Pazar, Kale, Gar. Sonra "Yeni Liman", "Eski Liman", "Kuzey Liman"… diye sürer, 275 hattan sonra numara eklenir ("Liman 2").
- **Metro (varsayılan) renkleri:** Algısal renk uzayında (OKLCH) üretilir, bu yüzden bütün hatlar eşit parlaklıkta ve koyu/açık zeminde okunur. Ton, altın oran adımıyla ilerler; komşu hatlar renk tekerleğinde en az ~115° ayrıdır ve hiçbir hat birebir tekrar etmez. M1 turuncudur.
- **Renk temaları:** Her tema bir renk ailesidir. İlk 6 hat temanın temel tonlarıdır; sonraki turlarda ton ve parlaklık kayar. Her hat için birkaç aday denenir: komşu hattan ve 6 hat öncekinden yeterince ayrışan, daha önce kullanılmamış ilk aday seçilir.
- **Uyarı rengi:** İki hat değince yanan kırmızı hiçbir hat rengiyle karışmaz. Metro renkleri kırmızının çevresini atlar; kırmızı ağırlıklı temalarda (Lav, Yakut…) oyun içi uyarı rengi kehribara döner.

Robot her temada ilk 60 hattı, koyu ve açık görünümde ayrı ayrı denetler.

### Sürpriz sandık

Taçların temalar dışındaki tek harcama yeri. Oyun içinde kendiliğinden çıkmaz; oyuncu Renk temaları sayfasından **👑 10** harcayarak açar. İçinden asla taç çıkmaz, böylece taçla taç kazanma kumarı oluşmaz. Taç gerçek parayla satılmadığı için sandık da parayla açılamaz.

| Nadirlik | Olasılık | İçerik |
|---|---|---|
| Sıradan | %60 | +2 💡 ipucu |
| Nadir | %28 | +4 💡 ya da 🛡 seri kalkanı (yarı yarıya; en çok 3 kalkan birikir) |
| Destansı | %12 | 🚆 sahip olunmayan bir tren kaplaması (hepsi varsa +6 💡) |

**Algoritma:**

- Her oyuncunun ilk sandıkta bir kez belirlenen kendi tohumu vardır.
- Sonuç, bu tohum ve sandığın sıra numarasından ağırlıklı çekilişle hesaplanır.
- Sonuç taç harcandığı anda ödülle birlikte kaydedilir. Uygulamayı kapatıp açmak sonucu değiştirmez.
- **Şanssızlık koruması:** 7 sandık üst üste destansı çıkmazsa 8. sandık destansı olur.
- Olasılıklar sandık ekranında tek satırda yazılıdır; yanındaki **?** sandıktan ne çıkabileceğini gösterir.
- **Açılış:** sandık tam ekranda düşer; dokununca kapak açılır, ödül sandıktan fırlar (ipucu ve kalkanda sağ altta sayı rozeti, kaplamada trenin kendisi). Ödül açılış başlamadan kaydedilmiştir.

**Ödüller:**

- **🛡 Seri kalkanı:** Kusursuz seri kırılacağı zaman bir kez devreye girer ve seriyi korur.
- **🚆 Tren kaplaması:** Sefer şeridindeki trenin görünüşünü değiştirir. Hat rengine ek olarak 8 kaplama vardır: Kırmızı Ekspres, Gece Treni, Nane, Retro, Gün Batımı, Buz, Lavanta, Altın Ekspres.

## 9. Sefer şeridi ve kusursuz seri

Bu iki sistemin amacı oyuncuya "bir bölüm daha" dedirtmektir. Hiçbiri oyunu cezalandırmaz: süre dolunca oyun bitmez, yalnızca ⏱ yıldızı söner.

**Sefer şeridi (tren sayacı):**

- Saatin altındaki ince ray şeridinde küçük bir tren, süre hedefi boyunca sinyale doğru ilerler.
- Rayın yanan kısmı bağlantı oranıdır (yanan karo / bütün karo): oyuncu rayı döşer, tren arkasından gelir. Eski ayrı "%" çubuğu kaldırıldı; tek şerit hem süreyi hem ilerlemeyi gösterir.
- Son 10 saniyede sinyal sarıya döner.
- Süre dolunca sinyal kırmızıya döner; tren sinyalde bekler ve "+0:12 rötar" sayar.
- Rötar sürerken peronda yolcular arada bir nazik ve esprili bir laf atar (3, 15 ve 30. saniyelerde, en fazla 3 kez).
- Bulmaca bitince tren perona girer. Rötar varsa yolcular "Nihayet! 👏" der.
- Aynı anda **şehir canlanır**: arkaplandaki metro haritası parlar, duraklar sarı yanar, ekran dışından ekran dışına bir tren bir hattan geçer (`cityUp`). Sonraki bölümde ya da menüye dönünce söner. "Hareketi azalt" açıksa tren geçmez, yalnız ışık yanar.
- Telefonda "hareketi azalt" ayarı açıksa tren akarak değil, 8 kademede ilerler.

**Kusursuz seri (✨):**

- Tacı olmayan bir bölümü kusursuz bitirmek seriyi 1 artırır; kusursuz olmadan bitirmek seriyi sıfırlar. Taçlı bölümleri yeniden oynamak seriyi etkilemez, bu yüzden seri eski bölümlerde biriktirilemez.
- Seri 2 ve üstündeyken saatin yanında ✨ sayısı görünür. Hedeflerden biri kaçarsa ✨ sönükleşir ve "↺ baştan → seri sürer" bildirimi çıkar (baştan başlamak süreyi de sıfırlar).
- Ödüller: 3. kusursuz bölüm +1 ipucu; 5, 10, 15… kusursuz bölüm +1 bonus 👑.
- Seri kırılınca oyuncu aynı bölümü kusursuz bitirirse seri kaldığı yerden sürer. Başka bir bölümü bitirince bu hak düşer.

**Kıl payı tekrar:**

- Hedef az farkla kaçtıysa (en çok 5 sn rötar ve en çok 2 hamle fazla) ya da seri kırıldıysa, sonuç panelinde büyük düğme "Tekrar dene" olur ve Sonraki alttaki küçük sıraya iner. Düğme sayısı değişmez, panel kalabalıklaşmaz.
- Büyük düğmenin alt satırı nedenini söyler: "Kıl payı · ⏱ 2 sn" ya da "🔥 4 seri geri gelsin".

