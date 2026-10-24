# Fikir havuzu ve raftaki oyunlar

Ray'den sonraki oyun için yapılan fikir turlarının ve denenen prototiplerin notları. Son güncelleme: 2026-10-24.

## Tercih edilen tarz
- İstenen tarz: **kafa çalıştıran ama basit** bulmaca. Kuralı 5 saniyede anlaşılmalı (2048, Block Blast tadında).
- Beğenilmeyenler: kuralı uzun ya da karmaşık fikirler (Per, Bekçi). "Anlamadım, hoşuma gitmedi."

---

## 🐟 Büyük Balık: RAFTA

- **Prototip:** `prototipler/buyuk-balik.html` ([oynanabilir link](https://claude.ai/artifact/YRA28QVnLhGEmmKgmLzHkv))
- **Şimdiki kural:** Büyük balık yanındaki (sağ, sol, üst, alt) daha küçük balığı yer ve onun yerine geçer. Tahtada tek balık kalınca bölüm biter.
- **Prototipte olanlar:**
  - Elle yapılmış 3 öğretici bölüm.
  - Tersten üretildiği için her zaman çözülebilen, bitmeyen bölümler.
  - Tahta çözülemez hale gelince anında uyarı.
  - Geri al, ipucu, yıldız.

### Geri bildirim (kullanıcı)
> "Burada şu mantık sıkıntı. Yani tamamen yerleştirmeyle alakalı bir oyun bu. Küçük balığı yediğim zaman o toplam kadar olmam lazım. Ama önümdeki balıkların da büyüklüğünün değişmesi lazım bence. Yani öyle bir kısıt var burada."

**Özet:**
- Sorun: yemek sadece konum değiştiriyor, kimsenin boyu değişmiyor. Bu yüzden oyun "hangi sırayla" sorusundan ibaret bir yerleştirme bulmacası gibi hissettiriyor.
- İstenenler:
  1. Yiyen balık yediği kadar büyüsün. Örnek: 3, 2'yi yerse 5 olsun.
  2. Diğer balıkların boyu da değişsin, böylece tahtada bir kısıt ya da gerilim oluşsun.

### Geri dönünce denenecek yönler (öneri, karar verilmedi)
Yalnızca toplayarak büyüme eklenirse ilk yiyen balık hızla en büyük olur ve oyun kolaylaşır. Bu yüzden büyümeyi dengeleyen ikinci bir kural gerekiyor:

| Yön | Kural fikri | Artısı | Riski |
|---|---|---|---|
| A. Herkes büyür | Her hamleden sonra yenmeyen balıklar +1 büyür (ya da her 2 hamlede bir). | "Şimdi yemezsen sonra yiyemezsin" zamanlama gerilimi | Sayılar hızla büyür, okunurluk düşer |
| B. Komşular tepki verir | Yenen balığın komşuları korkup +1 büyür. | Yerel ve görünür etki, hamlenin sonucu tahmin edilebilir | Kural iki cümleye çıkar |
| C. Hedef boy | Bölüm hedefi "son balık tam 10 olsun": yiyen yediği kadar büyür, toplam hedefi tutturmak gerekir. | Toplama bulmacası, net hedef | Matematik ödevi hissi |
| D. Açlık | Her balığın boyu her hamlede −1 azalır, yemek büyütür; 0 olan kaybolur. | Hayatta kalma gerilimi | Basitlikten uzaklaşır |

Dönüldüğünde önce A ile C'nin iki küçük prototipi yapılıp yan yana denenmeli.

### Not
- Prototip için başlatılan test turu (oyuncu testi, bölüm denetimi, hata avı) mekanik değişeceği için durduruldu.
- Bölüm üretici ve çözücü kod (`revGen`, `analyzer`) yeni kurala uyarlanabilir.

---

## Fikir turları (jüri puanı, 100 üzerinden)

### 3. tur: basit bulmaca (sadelik %25 ağırlıklı)
| Oyun | Kural | Puan | Durum |
|---|---|---|---|
| Büyük Balık | Büyük balık yanındaki küçük balığı yer; tek balık kalsın. | 77 | Rafta (yukarıda) |
| Kargo | Parçaları farklı boydaki kutulara koy; tam dolan kutu kargoya gider. | 72 | Sırada. Block Blast'e çok benzeme riski var |
| Boncuk | Boncuğa dokun, en sona kaysın; yan yana 3 aynı renk patlar. | 72 | Sırada. Hakem önerisi: dik tüp düzeni |
| Kaydırak | 2048 gibi, ama sadece dokunduğun taş kayar. | 70 | Yedek |
| Kaç Kişiyiz? | Her sayı, kendisi kadar aynı sayıyla yan yana gelince patlar. | 69 | Yedek (iOS'ta DropNumber benzeri var) |

### 1. ve 2. tur: farklı türler
| Oyun | Tür | Puan |
|---|---|---|
| Per | Okey taşlı Balatro tarzı roguelite | 74 / 73 |
| Bekçi — Gece Kapısı | Kapıda kural kontrolü, kaydırarak karar | 71 |
| Sekme | Daire biçimli Breakout + survivor-lite | 70 |
| Martı: Simit Kaçamağı | Tek dokunuşla uçuş | 69 / 68 |
| Yılan '97 | Yılan oyunu + Tamagotchi tarzı evrim | 68 |
| Beş Kale | Gizli asker dağıtma düellosu | 67 |
| Misket — Mahalle Ligi | Çek-bırak misket fiziği | 65 |
| Ebru: Günün Deseni | Rahatlatıcı jest bulmacası | 64 |
| Pelte | Basılı tut, şişir, yığ | 63 |
| Dilim | Alan kesme (JezzBall) | 62 |
| Hece | Türkçe hece kelime oyunu | 62 |
| Çay Ocağı | Idle tycoon | 61 |
| Çiziktir | Linkle çiz-tahmin et | 61 |
