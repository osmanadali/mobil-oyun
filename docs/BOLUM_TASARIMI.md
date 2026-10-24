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

| Hat | İlk bölüm | Kural | Tanıtım |
|---|---|---|---|
| M3 | 29 | **Sabit karo:** koyu, cıvatalı karolar dönmez | İlk bölümde daha çok sabit karo, animasyonlu kural kartı |
| M4 | 49 | **Eşli karo:** aynı numaralı iki karo birlikte döner | İlk bölümde tek eş, animasyonlu kural kartı |
| M6 | 101 | **Karanlık tünel:** hattın ulaşmadığı karolar karanlıktır, rayları görünmez ve dokunulamaz. Yanan hattın 2 karo yakını aydınlanır ve açık kalır. | Animasyonlu kural kartı; ilk 3 bölüm 6×8 |
| M8 | 169 | Boş yer (ileride yeni kural) | |

Yeni kural gelen hattın **ilk 3 bölümü bir boy küçük ızgarayla** gelir ve ilk bölüm biraz daha kolay seçilir. Böylece oyuncu kuralı rahatça öğrenir (testere dişi).

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

Kusursuz bitirilen her bölüm (⏱ ve ↻ hedefi aynı oyunda) bir kez 1 👑 verir; Günün Hattı'nı kusursuz bitirmek de 1 👑. Taç bir para birimidir: tema satın alınınca bakiyeden düşer ve geri gelmez. Fiyatlar hızla artar, oyuncu bölümleri daha başarılı geçmeye zorlanır.

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
