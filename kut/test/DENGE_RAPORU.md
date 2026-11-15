# Denge raporu (son denetim)

Belgenin 11. bölümündeki denge hedefleri benzetimle sınandı. Hedef dışı kalanlar `data.js` (ve gerekince `sim.js` + `KutSavas.cs`) değerleriyle ayarlandı. C# eşdeğerliği korundu: **9596/9596 birebir aynı** (tempo ayarından sonra da).

## 0. Tempo ayarı (2026-11-15)

Kullanıcı isteği: savaş "mahalle kavgası" gibi hızlı ve seri; kahramanların vuruş sıklığı kişiliklerine göre belirgin farklı olsun, savaş TFT gibi sakin ve okunur aksın. Savaş süresi hedefi **16–20 sn'den 24–32 sn'ye** çıktı (aşağıdaki eski bölümlerdeki 16–20 sn hedefi bu ayardan öncesine aittir).

| Değer | Önce | Sonra |
|---|---|---|
| Varsayılan oynatma hızı (`web/arayuz.js`) | 2× (ölçümde) | 1× |
| Saldırı hızı (`as`) | 0,60–1,00 | ağır 0,45–0,60 (kaplumbağa, golem, ayı, koç) · orta 0,55–0,70 · çevik 0,75–0,85 (tilki, yarasa, kurt, bulut atı) |
| Vuruş başı hasar (`atk`) | 37–62 | saniyede hasar × 0,8 korunarak frekansla ters: koç 68, ayı 67, ejder 60 … kurt 46, yarasa 42 |
| Can (kahraman ve canavar) | — | × 1,4 (canavar saldırısı × 0,8) |
| Vuruş başı mana (`sim.js`) | 10 (Keskin Göz 15) | 8 (Keskin Göz 12) |
| Yürüme (`sim.js`) | 1,7 hücre/sn, Çevik 2,4 | 1,2, Çevik 1,6 |
| Çevik soyu | ilk 4 sn +%40/+%90 | ilk 6 sn +%30/+%60 |
| Rüzgâr Ayak | ilk 5 sn | ilk 7 sn |
| `KURAL.savasSuresi` | 30 sn | 45 sn |
| Gün Batımı / Uzun Gölge | 20 / 12 sn | 30 / 20 sn |
| Kut: ara, yapay zekâ 1. ve 2. hak | 4 / 5 / 12 sn | 6 / 8 / 18 sn |
| Kurbağa | mana 60, Ruh Bağı +35 | mana 70, Ruh Bağı +25 (savaş başına 3,9 → 3,7 yetenek) |
| `bolumTabani` | 0/0/4/8/12/16/20/24 | 0/0/4/9/13/17/21/25 (maç yine 5-3'te bitsin) |
| Süre sınırı karşılaştırması (`sim.js`, `KutSavas.cs`) | `t >= 30` | `t + 1e-9 >= 45` (0,05'lik adım birikimi 45,05'e taşmasın) |

Kahraman ince ayarı (E bölümü, 1500 vaka): kurbağa can 930 / saldırı 49, tilki saldırı 50 / mana 90, kuğu can 980, bulut atı can 800 / saldırı 58, anka 56, ejder 60, koç 68, yarasa 42.

Sonuçlar (`node test/denge_benzetim.mjs 0.3`, E bölümü 3 ile):

| Ölçüt | Hedef | Sonuç |
|---|---|---|
| Savaş süresi ortanca / %90 dilim | 24–32 sn / ≤ 42 sn | 28,95 / 40,25 sn |
| Süre sınırına kalan savaş | < %5 | %3,1 |
| İlk ölüm ortancası | 5–8 sn | 6,5 sn (tempo ölçümü, 3166 savaş) |
| Vuruş aralığı ortancası (bütün vuruşlar) | — | 1,15 → 1,40 sn; kaplumbağa 2,25 · golem 2,0 · ayı 1,75 … kurt 0,95 · bulut atı 0,8 |
| Sahadaki vuruş sayısı | — | saniyede 5,9 → 4,8 |
| Maçın bittiği tur / ilk elenme | 5-3 / 4-1 | 5-3 / 4-1 |
| Birincinin tahmini süresi | 22–26 dk (önce 18–20) | 23,1 dk (lobi.test) |
| Kahraman kazanma oranı (kademe ortalamasının ±5 puanı) | ±5 | 16/16 (−3,6 … +3,3) |
| Kut en iyi hedef × rastgele | +8 … +15 | +8,4 puan |
| Faiz × harca sıra farkı | ≤ 0,8 | 0,51 |
| Bölüm 1 canavar kaybı | ≤ %10 | %0 |

Açık nokta: Hızlı Maç'ta Gün Batımı yok; bot takımlarıyla (eşyasız) süre sınırına kalan savaş %2,8'den %7,7'ye çıktı. Hızlı Maç'a Gün Batımı eklemek bir kural kararı olduğu için yapılmadı.

Görüntü tarafı (`web/sahne3d.js`, `web/hareket.js`): vuruş kurulması ağırlık sınıfına göre (ağır 0,7 · orta 0,45 · çevik 0,25 sn; dört ayaklıda 0,6 / 0,4 / 0,25); motor yalnız 0,4 sn önde olduğu için uzun kurulma, anlığa eklenen `cd` alanından vuruş anı tahmin edilerek önden başlar ve gerçek olay gelince darbeye bağlanır (motor değişmez). Klip hızlanma tavanı 1,3; ağır sınıfta yavaş toparlanma ve darbede 0,06 sn duraklama; yakın atılma 0,4 → 0,2 (ağır 0,12); ekranda en çok 10 sayı (hafif 8), birleştirme 0,5 sn (DOT 1 sn); kamera yakınlaşma alt sınırı 0,8.

Üreten komutlar (belirlenimci; aynı sayıyla aynı sonuç):

```bash
node kut/test/esya_denge.cjs 2000          # eşya taraması → test/esya_denge_sonuc.md / .json
node kut/test/denge_benzetim.mjs 1.5       # A–E bölümleri → test/denge_sonuc.json  (~8 dk)
node kut/test/denge_benzetim.mjs 1.5 B     # yalnız bir bölüm (öbür sonuçlar korunur)
node kut/test/lobi.test.cjs                # süre hedefleri (200 lobi, test olarak)
```

`denge_benzetim.mjs` beş bölümden oluşur:

- **A) Bot lobisi:** 2250 lobi, her birinde 8 bot izi. Canlı oyuncu da bot. 141 bin PvP savaşı oynandı.
- **B) Ajan lobisi:** 1800 maç. `web/oyun.js` görüntüsüz oynatılır; canlı oyuncu kurallı bir ajandır, rakipleri 7 bot izi. Ajan dükkân, deneyim, yenileme, yerleştirme, eşya, kaynaştırma, armağan, Kervan ve ganimet kararlarını verir. Ekonomi yolu (dengeli / faiz / harca) ve kaynaştırma (evet / hayır) maç başına atanır; armağan kartı rastgele seçilir.
- **C) Kut hedefi:** 4500 savaş. Bölüm 2–5 arasındaki bot izi takımlarında taraf 0 Kut'u en iyi hedefe (yapay zekâ puanı, 7.4) ya da rastgele bir sağ birime verir.
- **D) Eşya taraması:** `esya_denge.cjs`, 2000 vaka × 45 eşya.
- **E) Kahraman ve soy:** 2250 vaka. 4×3 tahta, seviyeye bağlı takım boyu, eşyalı ve armağanlı bot izi takımları.

## 1. Özet tablosu (ayarlardan sonra)

| Ölçüt (bölüm 11) | Hedef | Sonuç | Durum |
|---|---|---|---|
| Maçın bittiği tur (ortanca) | 5-2 … 5-4 | 5-3 | ✓ |
| İlk elenme turu (ortanca) | 4-1 ± 2 tur | 4-1 | ✓ |
| Birincinin toplam süresi | 18–20 dk | 19,2 dk (lobi.test) | ✓ |
| Savaş süresi ortanca / %90 dilim | 16–20 sn / ≤ 28 sn | 16,4 / 25,0 sn | ✓ |
| Süre sınırıyla biten savaş | < %5 | %2,1 | ✓ |
| Her tam eşyanın taşıyıcı kazanma oranı | ortalamanın ±5 puanı | 36/36 bantta (−3,5 … +3,6) | ✓ (önce 34/36) |
| Her armağanın ilk-4 oranı | %40–60 | bot lobisi %45,5–59,8; ajan (düzeltilmiş) %42,4–56,7 | ✓ |
| Kut en iyi hedef × rastgele hedef | +8 … +15 puan | +10,0 puan (%51,6 / %41,5) | ✓ |
| Faizi tavanda tutan × hiç biriktirmeyen, ortalama sıra farkı | ≤ 0,8 sıra | 0,38 (3,51 / 3,13) | ✓ (önce 0,96) |
| Kaynaşmış birim içeren takımın ilk-4 oranı | %45–55 | bot lobisi %50,1; ajan (düzeltilmiş) %45,1 | ✓ (ajanda sınırda) |
| Bölüm 1'de canavarı kaybetme | ≤ %10 | %0,02 | ✓ |
| Kahraman kazanma oranı (kendi ölçütüm: kademe ortalamasının ±5 puanı) | ±5 | 16/16 (−3,5 … +3,7) | ✓ (önce 10/16) |

"Düzeltilmiş" şunu demek: ajan bot izlerinden güçlü oynuyor (ortalama sıra 3,67, ilk-4 %69,7). Bu yüzden ajanın oranları ajan ortalamasına göre kaydırıldı: `oran − %69,7 + %50`.

## 2. Yapılan ayarlar

| Değer | Önce | Sonra | Neden |
|---|---|---|---|
| `KURAL.faizAdim` | 10 (50 altında doyar) | **8** (40 altında doyar) | Faizi tavanda tutan ajan, harcayandan ortalama 0,96 sıra gerideydi (hedef ≤ 0,8). |
| Bereket Küpü metni | 70 altında doyar | 56 altında doyar | Faiz adımına bağlı; tavan 7 aynı. |
| Ruh Testisi (`sim.js`, `KutSavas.cs`) | dost ölünce +30 mana | **+20 mana** | Ortalamanın +5,6 puan üstündeydi; şimdi +3,2. |
| Gölge Pelerini (`sim.js`, `KutSavas.cs`) | öldürünce 1,5 sn hedef alınamaz | aynı **+ azami canının %15'i kadar iyileşme** | Ortalamanın −5,0 puan altındaydı; şimdi −3,3. |
| Kaya Golemi | can 820, saldırı 48 | can 700, saldırı 37 | +9,5 puan (kademe 1 ortalamasına göre) → +3,3 |
| Buz Kaplumbağası | can 860, saldırı 46 | can 820, saldırı 38 | +7,1 → +3,7 |
| Gölge Tilki | saldırı 70 | saldırı 58 | +6,2 → +1,3 |
| Fırtına Ejderi | can 560, saldırı 46 | can 600, saldırı 51 | −5,5 → −1,7 |
| Zümrüt Yılan | can 560, saldırı 40 | can 610, saldırı 41 | −5,5 → −2,4 |
| Davulcu Kurbağa | can 500, saldırı 38, hız 0,70 | can 610, saldırı 42, hız 0,85 | −9,6 → −3,5 |

Kahraman ayarlarında güçlülerin saldırısı, zayıfların canı daha çok oynatıldı. İlk denemede tankların canı düşürülmüştü; bu savaş süresi ortancasını 15,7 sn'ye indirdi, yani hedefin dışına çıkardı. Son değerlerle süre 16,4 sn.

Hızlı Maç da aynı kahraman ve eşya sayılarını kullanır, kuralları değişmedi. Belgede güncellenen yerler:

- `OYNANIS_DERINLIK.md`: 0. bölüm tablosu, 3.2, 3.4 (not), 5.3 tablosu (iki eşya), 6.2 (Bereket Küpü), 10.2 (faiz boncuğu), 11 (bu rapora bağlantı), 12.1.
- `OGRETICI.md`: Golem ★2 kartının sayıları.

### Denenip bırakılanlar

Faiz farkı için şu ayarlar da denendi. Hepsi ajan lobisinde 1800 maçla ölçüldü.

| Deneme | Faiz − harca sıra farkı | Not |
|---|---|---|
| Ayarsız | 0,96 | |
| Bölüm tabanı 0/0/2/6/12/16/20/24 | 0,90 | Maç 5-3'ten 5-5'e uzadı, ilk elenme 4-2'ye kaydı. Bölüm tabanı çok hassas: ±1 bile maç sonunu 2 tur oynatıyor. |
| Bu taban + seri tablosu 0,0,1,2,3,3 | 0,74 | Maç yine 5-5'e uzadı. |
| Seri tablosu 0,0,1,2,3,4 | 0,97 | Etkisiz. |
| Faiz tavanı 6 | 0,95 | Etkisiz. |
| Deneyim bedeli 5 | 0,76 | Herkesi zayıflatıyor; belgedeki "4 altın = 4 deneyim" kuralını bozuyor. |
| **Faiz adımı 8** | **0,72 → 0,38** | 0,72, biriktiren ajan hâlâ 50'de dururken ölçüldü. Ajan tavanı 40'a çekince fark 0,38'e indi. Botlar ekonomi oynamadığı için lobi süresine etkisi yok. Seçilen ayar bu. |

Ayaz soyu (eşiği açıkken %64–67 kazanma) için düşman saldırı hızı azaltmasını −%15/−%30'dan −%10/−%20'ye indirmek de denendi. Oran yalnız 3 puan düştü. Ayaz'ı yalnız kademe 2 ve 3 kahramanları (Buz Kaplumbağası, Ayaz Baykuşu) taşıdığı için ölçüm kademeyle karışıyor (bkz. 5). Bu yüzden değişiklik geri alındı.

## 3. Bot lobisi (A): süre, elenme, armağan, kaynaşma

- **Süre ve elenme:** maç 5-3'te biter (r 26), ilk elenme 4-1 (r 17), elenenlerin ortancası 4-6.
- **PvP savaşları:** süre ortancası 16,4 sn, %90 dilim 25,0 sn. Süre sınırına kalan %2,1.
- **Bölüm 1 canavarları:** yaklaşık 54 000 savaşta 12 kayıp (%0,02).

**Armağanların ilk-4 oranı:** botlar her aşamada ilk kartı alır (`botArmagan`).

| Armağan | İlk-4 | Armağan | İlk-4 |
|---|---|---|---|
| Son Direniş | %59,8 | Bereket Küpü | %47,3 |
| Çifte Kut | %55,4 | Usta Demirci | %47,3 |
| Kızıl Gök Çocuğu | %55,1 | Altın Yumurta | %47,3 |
| Karşı Hamle | %54,5 | Pazar Dostu | %47,1 |
| Işık Sütunu | %52,8 | Alamet Bilgesi | %46,8 |
| Uyanış | %51,2 | Gözcü Baykuşu | %46,6 |
| Kut Mirası | %50,4 | Hızlı Büyüme | %46,3 |
| Kusursuz Melez | %50,3 | Ocak Ustası | %46,1 |
| Üçlü Kaynaşma | %47,5 | Saklı Kut | %45,8 |
| Soy Mührü | %47,5 | Ganimet Kesesi | %45,5 |

Okuma notları:

- Bot izinde yalnız savaş armağanları etki eder; ekonomi ve eşya armağanları botun gücünü değiştirmez. O satırlar bu yüzden %46–47 civarında, yani "etkisiz armağan" düzeyinde. Onların gerçek değeri ajan lobisinde ölçüldü (4).
- Son Direniş %59,8 ile bandın tam üst sınırında. Ajan lobisinde de en güçlülerden (düzeltilmiş %56,5). Şimdilik bırakıldı; bir sonraki ayarda ilk aday (`armaganSayi.sonDirenisOran` 0,2 → 0,15).

**Kaynaşma:** 3-3 kadrosunda kaynaşmış birim olan botların ilk-4 oranı **%50,1** (17 929 oyuncu). Olmayanlar %29,6. Bu fark kaynaşmanın gücünden değil, bot izinin yapısından gelir: kaynaşmış birim sayısı bot eğrisinden okunur ve güçlü botlar eğrinin önündedir.

## 4. Ajan lobisi (B): ekonomi yolları, altın eğrisi, armağan, kaynaştırma

| Ekonomi yolu | Maç | Ortalama sıra | İlk-4 | Birinci |
|---|---|---|---|---|
| Dengeli | 600 | 4,37 | %52,7 | %5,3 |
| Faiz (tavanda tutar: 40 altın) | 600 | 3,51 | %73,5 | %10,0 |
| Harca (hiç biriktirmez, seviyede eğrinin 1 önünde) | 600 | 3,13 | %82,8 | %14,5 |

- **Faiz × harca: 0,38 sıra** (hedef ≤ 0,8). İki yol da yaşıyor.
- "Dengeli" ajanın sırası kötü. Bu ajanın kendi kusuru: 20–30 altın tutuyor ama faizin tamamını almıyor, harcadığı parayla da öne geçmiyor. Belgenin bir hedefi değil, yalnız bilgi olsun diye tabloda.

### Altın eğrisi (3.4)

"Önce" o turun gelirinden önceki altın, "sonra" gelir eklenince oyuncunun gördüğü altındır. Ortancalar:

| An | Dengeli: önce / sonra | Seviye | Faiz: önce / sonra | Seviye | Belge (dengeli / biriktiren) |
|---|---|---|---|---|---|
| 2-1 | 8 / 14 | Sv 3 | 8 / 14 | Sv 3 | 10–14 / 14 |
| 3-1 | 23 / 33 | Sv 5 | 43 / 55 | Sv 5 | 20–30 / 40–50 |
| 4-1 | 37 / 47 | Sv 6 | 45 / 57 | Sv 7 | 30–50 (Sv 6) / 50+ (Sv 5 → Sv 7) |

- Faiz tavanına (40) ilk ulaşma: faiz yolunda ortanca 2-6 (en erken 2-5), dengeli yolda 3-2.
- `test/ekonomi.test.cjs`'teki basit ekonomi modeli yeni tavanla belgedeki eğriye uyuyor. Dengeli 2-1 / 3-1 / 4-1: 11 / 23 / 44 (Sv 6). Biriktiren: 14 / 40 / 43 (Sv 5); tavana ilk 2-7'de ulaşıyor.
- Ajan bölüm 1'de tahtasını doldurduğu için 2-1'e 8 altınla giriyor. Bu bir ajan seçimi; kural değil.

### Armağanların ilk-4 oranı (ajanın seçtiği kart)

Ham oran ve ajan ortalamasına göre düzeltilmiş oran:

| Armağan | Ham | Düzeltilmiş | Seçim | Armağan | Ham | Düzeltilmiş | Seçim |
|---|---|---|---|---|---|---|---|
| Soy Mührü | %76,3 | %56,7 | 334 | Altın Yumurta | %70,5 | %50,8 | 281 |
| Son Direniş | %76,2 | %56,5 | 298 | Hızlı Büyüme | %69,7 | %50,1 | 195 |
| Çifte Kut | %75,3 | %55,7 | 365 | Kusursuz Melez | %69,6 | %50,0 | 313 |
| Karşı Hamle | %75,1 | %55,4 | 321 | Üçlü Kaynaşma | %67,3 | %47,7 | 352 |
| Usta Demirci | %74,3 | %54,6 | 354 | Alamet Bilgesi | %67,3 | %47,6 | 217 |
| Kızıl Gök Çocuğu | %73,2 | %53,5 | 291 | Saklı Kut | %65,0 | %45,4 | 203 |
| Ocak Ustası | %73,0 | %53,3 | 185 | Bereket Küpü | %63,7 | %44,1 | 204 |
| Kut Mirası | %72,7 | %53,0 | 315 | Gözcü Baykuşu | %63,1 | %43,4 | 168 |
| Ganimet Kesesi | %72,5 | %52,8 | 211 | Uyanış | %63,1 | %43,4 | 195 |
| Işık Sütunu | %72,1 | %52,4 | 290 | Pazar Dostu | %62,1 | %42,4 | 219 |

- Her satırda yaklaşık 170–370 maç var, yani satır başına standart hata yaklaşık ±3 puan.
- En zayıflar (Pazar Dostu, Uyanış, Gözcü Baykuşu) ajanın kullanmadığı bilgiden ya da Kut zamanlamasından yararlanıyor. Ajan Gözcü'yle rakibe göre dizilmiyor, Kut'u da yalnız yapay zekâ kuralıyla veriyor. Gerçek oyuncuda daha yüksek çıkmaları beklenir.

### Kaynaştırma

| | Maç | Ortalama sıra | İlk-4 | Düzeltilmiş ilk-4 |
|---|---|---|---|---|
| Kaynaştıran strateji | 900 | 3,78 | %66,6 | – |
| Kaynaştırmayan strateji | 900 | 3,56 | %72,8 | – |
| Tahtasında kaynaşmış birimle savaşmış | 992 | 3,87 | %64,8 | **%45,1** |
| Hiç kaynaşmış birimle savaşmamış | 808 | 3,43 | %75,6 | %55,9 |

Ajanın kaynaştırma kuralı kaba. Yedekte çifti olmayan bir ★1'i, tahtadaki en zayıf aynı yıldızlı birimle birleştiriyor ve her seferinde 3–5 altın ödüyor. Bu yüzden kaynaştırma ajanda biraz kötü görünüyor. Bot lobisindeki ölçüm (%50,1) hedefin ortasında olduğu için çarpana (`kaynasCarpan` 1,15) dokunulmadı. Ajanda düzeltilmiş oran %45,1 ile bandın alt sınırında; daha iyi bir kaynaştırma ajanıyla yeniden bakılmalı.

## 5. Kahraman ve soy (E)

Yöntem şöyle:

- Bot izi takımındaki ilk aynı kademeli birim (kaynaşmamış) sırayla o kademenin her kahramanına çevrilir. Yıldız ve eşyalar aynı kalır.
- Takım menzile göre yeniden dizilir (`online.js yerlestir`).
- Her vaka bir kademenin bütün kahramanları için aynı yuvadır, yani karşılaştırma ortak bir vaka kümesinde yapılır.
- Fark, kademe ortalamasına göre verilir.

| Kahraman | Kademe | Kazanma | Fark | | Kahraman | Kademe | Kazanma | Fark |
|---|---|---|---|---|---|---|---|---|
| Kaya Golemi | 1 | %51,4 | +3,3 | | Bulut Atı | 2 | %46,6 | −1,9 |
| Rüzgâr Ruhu | 1 | %48,9 | +0,9 | | Anka | 3 | %56,8 | +3,6 |
| Sis Yarasası | 1 | %48,0 | −0,1 | | Ayaz Baykuşu | 3 | %55,8 | +2,6 |
| Kristal Kurt | 1 | %47,4 | −0,7 | | Gölge Tilki | 3 | %54,5 | +1,3 |
| Davulcu Kurbağa | 1 | %44,6 | −3,5 | | Fırtına Ejderi | 3 | %51,5 | −1,7 |
| Buz Kaplumbağası | 2 | %52,2 | +3,7 | | Işık Kuğusu | 3 | %50,5 | −2,7 |
| Dağ Koçu | 2 | %51,4 | +2,9 | | Gece Ayısı | 3 | %50,0 | −3,2 |
| Zümrüt Yılan | 2 | %46,1 | −2,4 | | | | | |
| Kor Semenderi | 2 | %46,1 | −2,4 | | | | | |

- Kademe 1 ve 2 kahramanları 698–750 vakayla ölçüldü. Kademe 3 kahramanları 198 vakayla ölçüldü (Sv 6+ takımlarda K3 seyrek); onların standart hatası yaklaşık ±3,5 puan.
- Ayar öncesi (aynı yöntem): Golem +9,5, Kaplumbağa +7,1, Tilki +6,2, Ejder −5,5, Yılan −5,5, Kurbağa −9,6.
- Ön sıradaki tanklar (Golem, Kaplumbağa) bu tahtada en değerli birimlerdi. Destekçi menzilliler (Kurbağa) en zayıflarıydı.

Soylar (eşiği açıkken o tarafın kazanma oranı; gözlemsel):

| Soy | Kazanma | Sıklık | | Soy | Kazanma | Sıklık |
|---|---|---|---|---|---|---|
| Ayaz | %66,9 | %11,9 | | Çevik | %50,9 | %58,7 |
| Yer | %54,6 | %34,1 | | Avcı | %50,9 | %54,5 |
| Karanlık | %53,9 | %27,1 | | Gök | %50,4 | %78,1 |
| Od | %53,4 | %22,6 | | Su | %48,5 | %65,8 |
| Dev | %52,0 | %45,1 | | | | |
| Bilge | %52,0 | %55,4 | | | | |

- Belgede soy için sayısal hedef yok.
- Ayaz yüksek çıkıyor ama ölçüm karışık. Ayaz'ı yalnız K2 ve K3 kahramanlar taşıyor ve eşiği yalnız iki taşıyıcıyla açılıyor; bu da genelde güçlü, ileri turdaki takımlarda oluyor. Gök ve Su ise neredeyse her takımda açık olduğu için %50'ye yakın.
- Soy gücünü ayırmak için ayrı bir tarama önerilir: aynı takımda eşiği açan kahraman ile eşiği açmayan aynı kademeden bir kahraman karşılaştırılmalı.

## 6. Kut hedefi (C)

| Taraf 0'ın Kut kullanımı | Kazanma |
|---|---|
| En iyi hedef (yapay zekâ puanı, 5. ve 12. sn) | %51,6 |
| Rastgele sağ birim (aynı anlarda) | %41,5 |
| Kut yok | %33,5 |

- En iyi × rastgele farkı **+10,0 puan** (hedef +8 … +15).
- Kut'un kendisi (rastgele × yok) +8 puan değerinde; hedef seçimi bunun üstüne +10 puan daha katıyor.

## 7. Eşya taraması (D)

- 2000 vaka, 90 bin savaş.
- Taban (iki taraf eşyasız) %51,5; 36 tam eşyanın ortalaması %62,0.
- **36/36 bantta.** En güçlüler Kut Ocağı %65,6 (+3,6), Can Ateşi %65,5 ve Ruh Testisi %65,3. En zayıflar Ayaz Asası %58,5 (−3,5), Gölge Pelerini %58,7 ve Diken Kabuk %58,7.
- Tam tablo: `test/esya_denge_sonuc.md`.

Önceki taramadan (Adım 3) bu yana ortalama %59'dan %62'ye çıktı. Bunun nedeni Kut hakkı, yankı ve armağanlarla motorun değişmesi. Ayar öncesinde bu yüzden iki eşya bandın dışına düşmüştü: Ruh Testisi +5,6, Gölge Pelerini −5,0.

## 8. Sınırlar ve açık noktalar

- **Bot izi rakipler ekonomi oynamaz.** Kurallı ajan, botların ortalamasından açıkça güçlü (sıra 3,67). Gerçek oyuncu lobisinde (kayıtlı izler) yollar arasındaki fark başka çıkabilir. Uzak iz havuzu gelince B bölümü kayıtlı izlerle yeniden koşulmalı.
- **Ajan sonuçları ajanın kalitesine bağlı.** Ekonomi, kaynaştırma ve armağan sonuçları bu sınırla okunmalı. Kaynaştırma ve dengeli ekonomi kuralları özellikle kaba.
- **"Ortalamanın ±%5'i"** ±5 puan olarak okundu (Adım 3'teki gibi). Göreli ±%5 okunursa (ortalama %62'nin %5'i = ±3,1 puan) bantta kalan 29/36 olur; dışarıda kalanlar Kut Ocağı, Can Ateşi, Ruh Testisi, Ayaz Asası, Diken Kabuk, Gölge Pelerini ve Kara Buz (hepsi 3,1–3,6 puan arasında).
- **Onay bekleyen sapmalar:**
  - Bölüm tabanı 0/4/8/12/16/20/24 (Adım 5).
  - Faiz adımı 8 (bu adım).
  - Ruh Testisi ve Gölge Pelerini metinleri.
  - Altı kahramanın sayıları.
- **Bu raporun bölüm 11 tablosuna eklediği ölçütler** (belgede yok): kahraman ve soy kazanma oranları.
