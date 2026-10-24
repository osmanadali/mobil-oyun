# Ray — Bölüm tasarımı ve zorluk merdiveni

Bu belge, bölümlerin nasıl üretildiğini, hatların nasıl uzadığını ve zorluğun bölüm ilerledikçe nasıl arttığını anlatır. Kodda karşılığı `www/game.js` içindeki "hatlar", "zorluk puanı" ve "zorluk merdiveni" bölümleridir.

## 1. Temel ilke

- Bölümler elle çizilmez, her bölüm numarasından **aynı bulmaca** üretilir. Herkes 57. bölümde aynı haritayı görür.
- Bölüm sayısı **sonsuzdur**. Oyun hiçbir zaman "bitmez", ama her bölüm bir öncekinden biraz daha zordur.
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
| M6 | 101 | 🌑 **Karanlık tünel** | Hattın ulaşmadığı karolar karanlıktır, dokunulamaz; yanan hattın 2 karo yakını aydınlanır ve açık kalır. Merkez başta yalnız başlar. |
| M7 | 133 | 🔢 **Sayaçlı karo** | En fazla 3 kez döner, sayı bitince kilitlenir. Önce düşün, sonra dokun. |
| M8 | 169 | 🚉 **İki merkez** | İki istasyon, iki renk; her durak kendi merkezine bağlanmalı. İki hat birbirine değerse kırmızı yanar, bölüm bitmez. |
| M9+ | 209 | Karma hatlar | Yeni kural yok; her bölümde öğrenilmiş kurallardan 1–2 tanesi. |

**Öğretme:**

- Yeni kuralın ilk girişinde animasyonlu bir kural kartı çıkar.
- Yeni kural gelen hattın ilk 3 bölümü bir boy küçük ızgarayla gelir, yalnızca o kuralı içerir ve ilk bölüm biraz daha kolay seçilir (testere dişi).

**Kural dönüşümü:**

- Kurallar üst üste yığılmaz. Bir kural kendi hattında her bölümde vardır.
- Sonraki hatlarda kendi kuralına ek olarak bölüm bölüm değişen en fazla 1 eski kural gelir.
- M9 ve sonrası karma hatlardır: her bölüm 1–2 kuralın farklı bir karışımıdır.
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
| Altın, Elmas, Yakut | Yalnızca Reklamsız paketle |

## 9. Sefer şeridi ve kusursuz seri

Bu iki sistemin amacı oyuncuya "bir bölüm daha" dedirtmektir. Hiçbiri oyunu cezalandırmaz: süre dolunca oyun bitmez, yalnızca ⏱ yıldızı söner.

**Sefer şeridi (tren sayacı):**

- Saatin altındaki ince ray şeridinde küçük bir tren, süre hedefi boyunca sinyale doğru ilerler.
- Son 10 saniyede sinyal sarıya döner.
- Süre dolunca sinyal kırmızıya döner; tren sinyalde bekler ve "+0:12 rötar" sayar.
- Rötar sürerken peronda yolcular arada bir nazik ve esprili bir laf atar (3, 15 ve 30. saniyelerde, en fazla 3 kez).
- Bulmaca bitince tren perona girer. Rötar varsa yolcular "Nihayet! 👏" der.
- Telefonda "hareketi azalt" ayarı açıksa tren akarak değil, 8 kademede ilerler.

**Kusursuz seri (🔥):**

- Tacı olmayan bir bölümü kusursuz bitirmek seriyi 1 artırır; kusursuz olmadan bitirmek seriyi sıfırlar. Taçlı bölümleri yeniden oynamak seriyi etkilemez, bu yüzden seri eski bölümlerde biriktirilemez.
- Seri 2 ve üstündeyken saatin yanında 🔥 sayısı görünür. Hedeflerden biri kaçarsa 🔥 sönükleşir ve "↺ baştan → seri sürer" bildirimi çıkar (baştan başlamak süreyi de sıfırlar).
- Ödüller: 3. kusursuz bölüm +1 ipucu; 5, 10, 15… kusursuz bölüm +1 bonus 👑.
- Seri kırılınca oyuncu aynı bölümü kusursuz bitirirse seri kaldığı yerden sürer. Başka bir bölümü bitirince bu hak düşer.

**Kıl payı tekrar:**

- Hedef az farkla kaçtıysa (en çok 5 sn rötar ve en çok 2 hamle fazla) ya da seri kırıldıysa, sonuç panelinde büyük düğme "Tekrar dene" olur ve Sonraki alttaki küçük sıraya iner. Düğme sayısı değişmez, panel kalabalıklaşmaz.
- Büyük düğmenin alt satırı nedenini söyler: "Kıl payı · ⏱ 2 sn" ya da "🔥 4 seri geri gelsin".

