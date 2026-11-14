# Kut Arena: oynanış derinliği (prototipten asıl oyuna)

Bu belge, prototipin sade kurallarını (her tur 10 altın, seviye yok, eşya yok, 1'e 1 hayalet rakip, 5 can/7 zafer) türün en iyi oyunları düzeyinde stratejik derinliğe taşıyan sistemleri anlatır. Sistemler seviye ve deneyim, birikimli ekonomi, eşyalar, 8 kişilik hayalet lobi, Kut Armağanı, canavar turları ve tur yapısıdır. Bütün sayılar ilk denge değeridir. Uygulayıcı bunları `data.js` → `KURAL` ve yeni tablolara olduğu gibi yazar, sonra bölüm 11'deki benzetim testleriyle ayarlar.

Okuma sırası: önce `TASARIM.md`, sonra bu belge. Arayüz yerleşimi için `ARAYUZ_TASARIM.md` geçerli kalır; bu belgenin getirdiği yeni arayüz öğeleri bölüm 10'da listelenir.

**İlkeler**

- Türün genel mekanikleri (seviye, faiz, seri, eşya birleştirme, lobi, takviye seçimi, canavar turu) kullanılır. Ama hiçbir oyunun adı, karakteri, içerik adı, sanatı ya da birebir arayüzü kopyalanmaz. Bütün adlar bizim, Türkçe ve kültürden bağımsızdır.
- Dört imza mekaniğimiz her yeni sistemin içine örülür, yanına iliştirilmez: **KUT dokunuşu**, **KAYNAŞTIRMA**, **RAKİBİ ÖNCEDEN GÖRME**, **ALAMET**.
- Savaş motoru belirlenimci kalır. Her yeni kural `sim.js` ve `unity/Kod/KutSavas.cs` içinde bit bit aynı uygulanır. Eşya ve armağan etkilerinde **rastgelelik yoktur**: `R()` çağrısı eklenmez. Böylece eşdeğerlik korunur ve "şans belirleyici" şikâyetine yeni kapı açılmaz.

---

## 0. Özet: prototip ile asıl oyun arasındaki farklar

| Konu | Prototip (şimdi) | Asıl oyun (bu belge) |
|---|---|---|
| Maç biçimi | 1 oyuncu, her tur 1 hayalet rakip; 5 can, 7 zafer | 8 kişilik hayalet lobi; 100 can; son kalan birinci. Eski biçim **Hızlı Maç** olarak kalır. |
| Süre | En çok 11 tur, 6–8 dk | 22–26 tur, birinci için 17–20 dk; erken elenen 10–14 dk |
| Altın | Her tur 10, birikmez | Birikir; taban gelir 5, faiz (her 10'a 1, en çok 5), seri bonusu, galibiyet +1 |
| Takım boyutu | Tura bağlı (3→6) | **Seviyeye** bağlı (2→8); deneyim satın alınır |
| Dükkân olasılıkları | Tura bağlı | Seviyeye bağlı; kahraman havuzu sınırlı (hayaletler de çeker) |
| Tahta | 3×2 (6 yuva) | 4×3 (12 hücre, en çok 8 kahraman) |
| Yedek | 4 | 7 |
| Eşya | Yok | 8 bileşen, 36 tam eşya, 3 özel eşya; birim başına 3 yuva |
| Takviye | Yok | **Kut Armağanı**: 3 aşamada 3'ten 1 seçim |
| Canavar turu | Yok | İlk 3 tur ve her bölümün 7. turu; bileşen ve altın düşürür |
| Ortak seçim | Yok | **Kervan**: her bölümün 4. turu, eşyalı kahraman seçimi |
| Kut | Savaşta 1 kez, manayı doldurur | Aynı, ayrıca **Kut Yankısı**: Kut verilen birimin eşyalarına göre ek etki |
| Kaynaştırma | 3 altın, kaynaşan birim yıldız atlayamaz | Bedel 2+en yüksek kademe; kaynaşan birim ilk kahramanın kopyalarıyla yıldız atlar; eşyalar birleşir |
| Rakibi önceden görme | Sıradaki tek rakip | Sıradaki rakibin **bu turki** kadrosu, eşyaları ve armağanları; diğer 6 hayaletin geçen turki kadrosu |
| Alamet | Her tur rastgele | Lobinin tamamına aynı; **bir sonraki turun alameti** önceden görünür; 4 yeni alamet |
| Savaş sonu | 30 sn, sonra can yüzdesi | 20. sn'den sonra **Gün Batımı** (hasar her sn +%10), 30 sn sınırı kalır |

---

## 1. Tur yapısı ve maç süresi

### 1.1 Bölüm ve tur

Maç **bölümlere**, her bölüm **turlara** ayrılır. Ekranda "Bölüm 3 · Tur 2" yazar; kısaltması `3-2`.

| Bölüm | Turlar |
|---|---|
| 1 | 1-1, 1-2, 1-3: **canavar** (PvE). 1-1'den önce 3 kademe-1 kahramandan biri bedava seçilir. |
| 2 | 2-1 **Armağan seçimi** + savaş · 2-2 savaş · 2-3 savaş · 2-4 **Kervan** · 2-5 savaş · 2-6 savaş · 2-7 **canavar** |
| 3 | 3-1 savaş · 3-2 **Armağan** + savaş · 3-3 savaş · 3-4 **Kervan** · 3-5 · 3-6 savaş · 3-7 **canavar** |
| 4 | 4-1 · 4-2 savaş · 4-3 **Armağan** + savaş · 4-4 **Kervan** · 4-5 · 4-6 savaş · 4-7 **canavar** |
| 5 ve sonrası | x-1 … x-3 savaş · x-4 **Kervan** · x-5 · x-6 savaş · x-7 **canavar** |

"Savaş" bir oyuncuya (hayalet) karşı PvP savaşı demektir. Kervan turunda savaş, gelir ve deneyim yoktur; yalnız seçim yapılır. Armağan seçimi o turun hazırlığından önce gelir.

İç gösterimde turlar düz bir sayı (`r`, 0'dan başlar) olarak tutulur. `TUR_PLANI` tablosu her `r` için `{bolum, tur, tip: 'pve'|'pvp'|'kervan', armagan: bool}` verir. Hayalet kayıtları da bu `r` ile eşlenir.

### 1.2 Süreler

| Aşama | Süre |
|---|---|
| Hazırlık, bölüm 1 | 20 sn |
| Hazırlık, bölüm 2 ve sonrası | 25 sn |
| Armağan seçimi | 15 sn (ayrı sayaç; sonra normal hazırlık başlar) |
| Kervan | 15 sn |
| Savaş | ≤30 sn, hedef ortanca 18 sn. Giriş ve sonuç geçişleriyle birlikte ortalama 22 sn. |

Dereceli maçta sayaç zorunludur. Hayalet kayıtları da aynı sürelerle oynanmış olur, böylece karşılaşılan takımlar adil koşulda kurulmuştur. Rahat maçta ve Hızlı Maç'ta sayaç durdurulabilir.

### 1.3 Süre hesabı (mobil hedef 15–20 dk)

- Bölüm 1: 3 × (20 + 20) ≈ **2 dk**.
- Bölüm 2–4: her biri 5 savaş × 47 sn + canavar 45 sn + Kervan 15 sn + armağan 15 sn ≈ **5,1 dk**.
- Bölüm 4'ün sonu ≈ 17,4 dk. Hasar tablosuyla (bölüm 4.4) maç ortalama **5-2 ile 5-4 arasında** biter, birinci için toplam süre **18–20 dk** olur.
- Oyuncu elendiğinde kalan hayaletlerin savaşları ekranda oynatılmaz, anında hesaplanır (bölüm 4.6). Oyuncu sıralamasını hemen görür, kimseyi beklemez. Elenen oyuncunun oturumu ortalama 12–15 dk sürer.

### 1.4 Savaş içi: Gün Batımı

8 kahramanlı, eşyalı takımlarla savaşlar uzar. Süre bitip can yüzdesiyle karar verilmesi tatmin etmez. Bu yüzden 20. saniyede gökyüzü kızıla döner ve **Gün Batımı** başlar: her geçen tam saniye bütün hasar (zaman içi hasar dahil) +%10 artar. 25. sn'de ×1,5, 30. sn'de ×2 olur. Formül: `carpan = 1 + 0,10 × floor(t − 20)`, `t ≥ 20` için. 30 sn sınırı ve can yüzdesi kararı yedek olarak kalır.

Hedef: süre sınırına kalan savaş %5'in altında.

---

## 2. Seviye ve deneyim

### 2.1 Kurallar

- Oyuncu **Seviye 2** ile başlar. En yüksek seviye **8**.
- **Takım boyutu = seviye.** Tahtaya seviyeden fazla kahraman konamaz.
- Her savaş turunun (PvP ya da canavar) sonunda **+2 deneyim** gelir. Bu 1-2'den başlar; 1-1 sonunda gelmez. Kervan turu deneyim vermez.
- **Deneyim satın alma**: 4 altın = 4 deneyim. Hazırlıkta istenildiği kadar basılır. Dükkânın solunda, Yenile'nin üstünde durur.
- Artan deneyim bir sonraki seviyeye taşınır. Seviye 8'de deneyim düğmesi kapanır.

| Seviyeden | Sonrakine gereken deneyim | Toplam (Sv2'den) | Kendiliğinden ulaşılan tur (hiç alım yoksa) |
|---|---|---|---|
| 2 → 3 | 2 | 2 | 1-2 sonu |
| 3 → 4 | 6 | 8 | 2-2 sonu |
| 4 → 5 | 10 | 18 | 2-7 sonu |
| 5 → 6 | 20 | 38 | 4-1 sonu |
| 6 → 7 | 32 | 70 | 6-2 sonu |
| 7 → 8 | 48 | 118 | (alım gerekir) |

Bu eğri oyuncuya türün temel ikilemini verir: **seviye mi, yenileme mi, biriktirme mi?** Hızlı seviye yüksek kademeyi ve kalabalık takımı açar, yenileme ise elindeki ucuz kahramanları ★2 ve ★3 yapar.

### 2.2 Dükkân olasılıkları (seviyeye bağlı)

Şu anki 3 kademe için (K1/K2/K3, yüzde):

| Seviye | K1 | K2 | K3 |
|---|---|---|---|
| 2 | 100 | 0 | 0 |
| 3 | 75 | 25 | 0 |
| 4 | 55 | 40 | 5 |
| 5 | 40 | 45 | 15 |
| 6 | 30 | 45 | 25 |
| 7 | 20 | 40 | 40 |
| 8 | 15 | 35 | 50 |

`KURAL.kademeOlasilik(tur)` yerine `KURAL.kademeOlasilik(seviye)` olur. Hızlı Maç eski tura bağlı tabloyu kullanmaya devam eder.

### 2.3 Kahraman havuzu

Her kahramanın sınırlı kopyası vardır: **K1: 22, K2: 18, K3: 14**.

Lobi eşzamansız olduğu için havuz oyuncuya özeldir, ama **hayaletler de havuzdan çeker**. Bir kahramanın dükkâna gelebilecek kalan kopyası şöyle hesaplanır:

```
kalan = havuzAdet(kademe) − (oyuncunun tahta+yedeğindeki kopyalar) − (7 hayaletin bu turki tahta+yedeğindeki kopyalar)
```

Kopya sayarken ★1 = 1, ★2 = 3, ★3 = 9 alınır. Kaynaşmış birim, iki kahramanından birer kopya sayılır.

Dükkânda önce seviyeye göre kademe zarı atılır. Sonra o kademede kahraman, **kalan kopyasıyla ağırlıklı** seçilir. Kademede hiç kopya kalmadıysa bir alt kademeye düşülür. Satılan kahraman havuza geri döner.

Bu, "rakibi önceden görme" imzasının stratejik karşılığıdır. Gözcü panelinde üç hayaletin Kristal Kurt topladığını gören oyuncu, Kurt ★3 peşine düşmemesi gerektiğini bilir. Dükkân kartında "Havuzda 6/22" küçük yazısı görünür.

### 2.4 Yeni kademeler (öneri, ikinci aşama)

16 kahraman ve 3 kademe, 8 kişilik lobi için dar. Çıkıştan önce kadronun **5 kademe ve yaklaşık 28 kahramana** (K1 8, K2 7, K3 6, K4 4, K5 3) büyütülmesi önerilir. Yeni modeller kullanıcı tarafında üretildiği için bu ayrı bir iştir. Sistem şimdiden ona hazır kurulur: kademe sayısı tablodan okunur, sabit `3` yazılmaz.

5 kademe gelince kullanılacak olasılıklar:

| Seviye | K1 | K2 | K3 | K4 | K5 |
|---|---|---|---|---|---|
| 2 | 100 | 0 | 0 | 0 | 0 |
| 3 | 75 | 25 | 0 | 0 | 0 |
| 4 | 55 | 32 | 13 | 0 | 0 |
| 5 | 42 | 35 | 20 | 3 | 0 |
| 6 | 28 | 40 | 25 | 7 | 0 |
| 7 | 20 | 30 | 32 | 16 | 2 |
| 8 | 15 | 22 | 33 | 24 | 6 |

Seviye tavanı da 9'a çıkar (8 → 9: 70 deneyim). K4 ve K5 havuzu 11 ve 9 kopyadır.

---

## 3. Ekonomi

### 3.1 "Her tur sıfırlanan altın" kararının tartışması

Prototipte altın her tur 10'a sıfırlanıyordu. Amaç kartopunu (öndekinin daha da öne geçmesini) önlemek ve kısa maçta geride kalana şans tanımaktı. 1'e 1 ve 11 turluk bir maç için doğru karardı.

8 kişilik, 20 dakikalık maçta ise bu karar derinliği öldürür. Tempo kararı kalmaz: "şimdi güçlen mi, biriktirip sonra patla mı?" sorulamaz. Seviye ve deneyim satın alma anlamını yitirir, çünkü harcanmayan altın zaten yanar. Seriler ödüllendirilemez.

**Karar: altın birikir.** Kartopu riskini şu dört fren karşılar:

1. Faiz tavanı düşük: en çok +5, 50 altında doyar.
2. Kaybetme serisi de kazanma serisi kadar altın verir. Bilerek kaybedip biriktirmek meşru bir yol olur, ama can bedeli vardır.
3. Canavar turları ve Kervan, canı düşük oyuncuya daha fazla seçenek sunar (bölüm 5.4).
4. Kut Armağanı'nda geride kalana özel seçenekler var (ör. Son Direniş).

Hızlı Maç modu eski kuralı korur (her tur 10, faiz yok). Kısa oturum isteyene ve öğreticiye o kalır.

### 3.2 Gelir

Gelir her savaş turunun **hazırlık başında** eklenir. Kervan turunda gelir yoktur.

```
gelir = taban + faiz + seri + galibiyet + alamet
taban   = 1-1: 3 (başlangıç), 1-2: 3, 1-3: 4, 2-1 ve sonrası: 5
faiz    = min(5, floor(altin / 10))        // gelir eklenmeden önceki altına göre; bölüm 1'de faiz yok
seri    = seriBonus(n): n=2 → 1, n=3–4 → 2, n≥5 → 3  (kazanma ya da kaybetme serisi; n=0–1 → 0)
galibiyet = önceki PvP savaşı kazanıldıysa 1
alamet  = Bereketli Pazar ise 2
```

- Seri yalnız PvP sonuçlarıyla sayılır. Canavar turu seriyi bozmaz, uzatmaz.
- Beraberlik seriyi bozmaz ve uzatmaz.
- Elde tutulabilecek altın sınırsızdır, ama faiz 50'de doyar.

### 3.3 Harcamalar

| Eylem | Bedel |
|---|---|
| Kahraman | Kademesi kadar (1–3; ileride 4–5) |
| Yenileme | **2** (prototipte 1). Birikimli ekonomide 1 altın fazla ucuz kalır. |
| Deneyim | 4 altın = 4 deneyim |
| Kaynaştırma | `2 + max(kademeA, kademeB)`, yani 3–5 |
| Kilitleme | Bedava |

Satış prototipteki gibi kalır: ★1 tam iade, ★2 için 3×kademe−1, ★3 için 9×kademe−1. Kaynaşmış birim, iki parçasının satış değerinin toplamını getirir. Satılan birimin eşyaları rafa döner.

### 3.4 Beklenen altın eğrisi (denge testi hedefi)

| An | Dengeli oyuncu | Biriktiren oyuncu |
|---|---|---|
| 2-1 başı | 10–14 | 14 |
| 3-1 başı | 20–30 | 40–50 |
| 4-1 başı | 30–50 (Sv6) | 50+ (Sv5, sonra Sv7'ye atlar) |

50 altına en erken 3-2 ile 3-5 arasında ulaşılabilmeli.

---

## 4. Çok oyunculu lobi: 8 kişilik hayalet lobi

### 4.1 Yapı

Lobide **1 canlı oyuncu ve 7 hayalet** bulunur. Hayalet, başka bir gerçek oyuncunun daha önce oynanmış maçının **tur tur kaydıdır** (bölüm 4.7). Herkes **100 canla** başlar. Canı 0'a düşen elenir. Son kalan birincidir.

Gerçek zamanlı sunucu, bekleme odası ve kopma yoktur. Bu, `TASARIM.md`'deki sunucusuz kararın 8 kişilik karşılığıdır. İleride gerçek zamanlı "Canlı Lobi" eklenirse aynı kurallar geçerli olur; tek fark, rakip önizlemesinde geçen turki kadronun gösterilmesidir.

### 4.2 Eşleşme sırası

Her turun hazırlığı başında, lobi tohumundan (`lobi.tohum + r × 7919`) belirlenimci olarak eşleşme kurulur:

1. Yaşayan oyuncular listelenir (canlı oyuncu dahil).
2. Her oyuncunun son `K = min(3, yaşayan − 2)` turdaki rakipleri yasaklıdır.
3. Lobi RNG'siyle karıştırılmış sırada açgözlü eşleştirme yapılır. Yasağı çiğnemeden eşleşme bulunamazsa 50 denemeye kadar yeniden karılır. Sonra yasak birer birer gevşetilir (önce en eski tur).
4. **Tek sayıda** yaşayan varsa biri **Yankı** ile dövüşür. Yankı, rastgele seçilen başka bir yaşayan oyuncunun bu turki kadrosunun kopyasıdır. Yankıya kaybeden normal hasar alır. Yankıyı yenmek ise kopyalanan oyuncuya hasar vermez. Geçen tur Yankı'yla dövüşen bu tur dövüşmez.

Canavar turunda herkes kendi canavar dalgasıyla dövüşür, eşleşme kurulmaz.

### 4.3 Rakibi önceden görme (imza, lobide)

- Hazırlık başında **sıradaki rakibin bu turda savaşacağı kadro** gösterilir: konumlar, yıldızlar, eşyalar, armağanlar ve soy sayaçları. Hayaletin kadrosu kayıtta hazır olduğundan bu "tam okuma" ancak bizde mümkündür.
- **Gözcü paneli**: diğer 6 hayaletin bir önceki turki kadrosu, canı, seviyesi ve seri durumu. Sol paneldeki rakip kartı kaydırılarak açılır.
- **Sıradaki alamet**: bu turun alametinin yanında bir sonraki turunki de soluk olarak görünür.
- Canavar turunda dalga önceden görünür; canavarların yetenek metinleri de okunur.

### 4.4 Kaybedince alınan hasar

```
hasar = bolumTabani(bolum) + kalanPuan
kalanPuan = kazanan taraftaki sağ birimlerin toplamı (★1 = 1, ★2 = 2, ★3 = 3; canavar = 1)
```

| Bölüm | 1 | 2 | 3 | 4 | 5 | 6 | 7+ |
|---|---|---|---|---|---|---|---|
| Taban | 0 (canavar, hasar yok) | 2 | 5 | 8 | 12 | 15 | 18 |

- **Beraberlik**: iki taraf da yalnız tabanı alır.
- **Canavar turu** (bölüm 2 ve sonrası): kaybeden `taban + kalan canavar sayısı` kadar hasar alır. Ganimet yine verilir (bölüm 5.3).
- **Son Üç**: lobide 3 kişi kalınca taban +3 olur. Süreyi kısaltır, finali gerer.
- **Son İki (Final Düellosu)**: taban +5 olur ve iki tarafın da savaş başına **2 Kut hakkı** olur. Hayalet ikinci hakkı yapay zekâ kuralıyla kullanır (bölüm 7.4).

Beklenen akış (testle doğrulanacak): ortalama oyuncu 4-6 ile 5-3 arasında, en zayıf oyuncu 4-1 civarında elenir. Maç 5-2 ile 5-5 arasında biter.

### 4.5 Sıralama ödülleri

Kupa (dereceli puan) elenme sırasına göre değişir. Aynı turda elenenlerde tur başında canı fazla olan önde sayılır.

| Sıra | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Kupa | +40 | +30 | +20 | +10 | −10 | −20 | −30 | −40 |

Kupa 0'ın altına düşmez. 0–400 kupada kayıplar yarıya iner, yeni oyuncu korunsun diye.

- **İlk 3 (Kürsü)**: maç sonu ekranında üç takım kürsüde 3D dizilir. İlk 3'e giren kadrodaki her kahraman +2 **ustalık puanı** alır (prototipte kazanılan tur başına 1). Hesapta "Kürsü" sayacı tutulur.
- **Birinci**: ustalık +4, "Arena Birincisi" rozeti, maç sonu düello kodu altın çerçeveli paylaşılır.
- İlk 4 istatistikte "iyi bitiriş" sayılır, kupa artısı buradan gelir.
- Ödüller **yalnız görünüştür**. Güç satılmaz kuralı aynen geçerlidir.

### 4.6 Hayaletlerin kendi aralarındaki savaşları

Her tur 8 kişinin eşleşmesi kurulur. Canlı oyuncunun savaşı ekranda oynar. Diğer 3 eşleşme (hayalet × hayalet) aynı anda motorda `sonunaKadar()` ile hesaplanır. Bu cihaz için ucuzdur (her biri birkaç ms). Hayaletlerin Kut'u kayıttaki dokunuşla oynatılır: `{i, t}`, o birim ölmüşse kullanılmaz. Hayaletlerin canları buna göre düşer.

Sonuç tablosu (kim kime kaç hasar verdi) savaş sonunda sağ paneldeki **Lobi şeridinde** görünür. Oyuncu elenince kalan turlar aynı yolla anında hesaplanır.

### 4.7 Hayalet kaydı

Her maç sonunda (ve her tur sonunda, kopmaya karşı) oyuncunun **maç izi** havuza yazılır:

```
{ macId, oyuncu, ad, kupa, surum, turlar: [
  { r, seviye, takim: [{h, s, f?, x, y, e: [esyaId…]}], yedek: [{h, s, f?}], armagan: [id…], kut: {i, t} | null }
] }
```

- **Lobi kurma**: canlı oyuncunun kupasına ±150 içinde, son 14 günün, oyun sürümü aynı 7 maç izi seçilir. Aynı oyuncudan en çok 1 iz alınır, kendi izi hiç alınmaz. İlk 4'e girmiş izler yeğlenir (en az 4 tane), çünkü uzun sürerler.
- **İz tükenirse**: hayaletin gerçek maçı bizim lobideki elenme turundan önce bittiyse, son kadrosu kullanılır. Her ek turda kadrodaki ★'ı en düşük birim (eşitlikte en soldaki) bir ★ yükselir, en çok ★2'ye kadar. Bölüm değişiminde 1 tam eşya kazanır.
- **İz bulunamazsa** (çevrimdışı ya da az oyuncu): bot izi üretilir (bölüm 4.8).

### 4.8 Bot izi (yedek)

`botIz(tohum, guc)` bütün maç boyunca tur tur kadro üretir. Mevcut `botTakim` mantığı genişletilir ve aşağıdaki eğriyle ölçeklenir. `guc` 0–1 arasıdır ve `0,35 + kupa/2000` olarak kalır. ★2 ve eşya sayısı ±%20 bu değerle oynar.

| Tur | Seviye | ★2 oranı | ★3 oranı | Tam eşya | Kaynaşmış birim | Armağan |
|---|---|---|---|---|---|---|
| 1-3 | 3 | 0,2 | 0 | 0 (2 bileşen) | 0 | – |
| 2-3 | 4 | 0,35 | 0 | 1 | 0 | 1 |
| 3-3 | 6 | 0,55 | 0 | 3 | 1 | 2 |
| 4-3 | 7 | 0,75 | 0,05 | 5 | 1 | 3 |
| 5-3 | 8 | 0,85 | 0,12 | 7 | 2 | 3 |

Eşyalar en yüksek kademeli birime yığılır (3'e dolana kadar). Bot Kut'u yapay zekâ kuralıyla kullanır.

---

## 5. Eşyalar

### 5.1 Kurallar

- **Bileşen** canavar turlarında, Kervan'da ve bazı armağanlarla gelir. Önce **eşya rafına** düşer (en çok 10 yer; doluysa yeni ganimet "taşan" rozetiyle bekler ve raf boşalınca iner).
- Bileşen bir kahramanın üstüne sürüklenir. Kahramanda tamamlanmamış bir bileşen varsa ikisi **kendiliğinden tam eşyaya** dönüşür (tablo 5.2). Rafta da iki bileşen üst üste bırakılarak birleştirilebilir.
- Kahraman başına **en çok 3 eşya** (bileşen ya da tam). Dolu kahramana yeni bileşen yalnız elindeki bir bileşeni tamamlıyorsa takılır.
- Takılan eşya geri çıkarılamaz. İstisna: **Söküm Taşı** (bölüm 5.3). Kahraman satılınca eşyaları rafa döner.
- **★ birleşmesinde** üç kopyanın eşyaları yeni birime toplanır. 3'ü aşanlar rafa döner (en son takılanlar önce).
- **Kaynaştırmada** iki birimin eşyaları kaynaşmış birime toplanır, aşan rafa döner. Sıra: önce birinci kahramanınkiler.
- Eşya istatistikleri (bileşenin değeri) tam eşyada **toplanır**: tam eşya = iki bileşenin istatistiği + kendi etkisi.
- Birim üstündeki etkiler eşya yuvası sırasıyla (0, 1, 2) uygulanır. Aynı tam eşyanın iki kopyası istatistiği iki kez verir, ama özel etkisi **bir kez** çalışır.
- Toplam "alınan hasar azaltma" eşyalardan en çok %40, Kut Yankısı dahil en çok %75. Soy (Dev) ayrı çarpan olarak kalır.

### 5.2 Sekiz bileşen

| Bileşen | İstatistik | Tema (soy) |
|---|---|---|
| **Diş** | +%15 saldırı | Avcı |
| **Tüy** | +%15 saldırı hızı | Gök |
| **Kor** | +%20 yetenek gücü (YG) | Od |
| **Çiy** | Savaşa +15 mana ile başlar | Su / Bilge |
| **Kabuk** | Alınan hasar −%10 | Dev |
| **Yürek** | +180 can | Yer |
| **Pul** | %10 can çalma (yalnız vuruş hasarında) | Karanlık |
| **Buz** | Savaş başında 120 kalkan | Ayaz |

**Yetenek gücü (YG)** yeni bir istatistiktir. Yetenek hasarı, iyileştirmesi, kalkanı ve zaman içi hasarı `× yıldız × (1 + YG)` olur. Süreler YG'den etkilenmez. Tablodaki "×★" yıldız çarpanını (`kc`: 1 / 1,8 / 3), "×YG" ise `(1 + YG)`'yi gösterir.

### 5.3 Tam eşyalar (36)

Tarif sırası önemsizdir (Diş+Tüy = Tüy+Diş). İstatistik sütunu iki bileşenin toplamıdır.

| # | Tarif | Ad | İstatistik | Etki |
|---|---|---|---|---|
| 1 | Diş + Diş | **Yırtıcı Pençe** | +%30 saldırı | Her 3. vuruş, hedefin azami canının %8'i kadar ek hasar. |
| 2 | Diş + Tüy | **Av Coşkusu** | +%15 sal., +%15 hız | Takımından biri düşman öldürünce 3 sn +%40 saldırı hızı (yenilenir, birikmez). |
| 3 | Diş + Kor | **Kızgın Diş** | +%15 sal., +%20 YG | Yeteneğinin isabet ettiği her düşman 3 sn yanar: 30/sn ×★×YG. |
| 4 | Diş + Çiy | **Keskin Göz** | +%15 sal., +15 mana | Vuruş başına mana 10 yerine 15. |
| 5 | Diş + Kabuk | **Öfke Tılsımı** | +%15 sal., −%10 hasar | Canı ilk kez %50'nin altına inince 5 sn +%35 saldırı ve −%20 alınan hasar. |
| 6 | Diş + Yürek | **Dev Yumruğu** | +%15 sal., +180 can | Vuruşlar, kendi azami canının %2'si kadar ek hasar verir. |
| 7 | Diş + Pul | **Gece Avcısı** | +%15 sal., %10 çalma | Bir düşmanı öldürünce o düşmanın azami canının %20'si kadar iyileşir. |
| 8 | Diş + Buz | **Buz Mızrağı** | +%15 sal., 120 kalkan | Her yeni hedefe ilk vuruşu 0,8 sn sersemletir. |
| 9 | Tüy + Tüy | **Yel Kanadı** | +%30 hız | Her 5. vuruşun ardından anında bir vuruş daha yapar. |
| 10 | Tüy + Kor | **Şimşek Tüyü** | +%15 hız, +%20 YG | Her 5. vuruşta hedefe en yakın 2 başka düşmana 70 ×★×YG yıldırım. |
| 11 | Tüy + Çiy | **Rüzgâr Çanı** | +%15 hız, +15 mana | Yetenek kullandıktan sonra 3 sn +%40 saldırı hızı. |
| 12 | Tüy + Kabuk | **Sis Pelerini** | +%15 hız, −%10 hasar | Savaşın ilk 2,5 sn'si hedef alınamaz. |
| 13 | Tüy + Yürek | **Bulut Nalı** | +%15 hız, +180 can | Hareket hızı +%50; savaştaki ilk vuruşu 2 kat. |
| 14 | Tüy + Pul | **Gece Kanadı** | +%15 hız, %10 çalma | Canı ilk kez %30'un altına inince 3 sn +%60 saldırı hızı ve %30 can çalma. |
| 15 | Tüy + Buz | **Kar Tanesi** | +%15 hız, 120 kalkan | Vuruşları hedefe 2 sn −%15 saldırı hızı verir (yığılmaz, büyüğü geçerli). |
| 16 | Kor + Kor | **Kut Ocağı** | +%40 YG | **Kut ile patlayan yeteneği ×1,5** (YG'den sonra çarpılır). |
| 17 | Kor + Çiy | **Bilge Asası** | +%20 YG, +15 mana | Yeteneğin ardından 25 mana geri kazanır. |
| 18 | Kor + Kabuk | **Taş Mühür** | +%20 YG, −%10 hasar | Her yetenek kullanımında kendine 120 ×★×YG kalkan. |
| 19 | Kor + Yürek | **Can Ateşi** | +%20 YG, +180 can | Her yetenek, en yaralı dosta 100 ×★×YG iyileştirme de verir. |
| 20 | Kor + Pul | **Gölge Mürekkebi** | +%20 YG, %10 çalma | Can çalma yetenek hasarına da uygulanır, yeteneklerde %25 olur. |
| 21 | Kor + Buz | **Ayaz Asası** | +%20 YG, 120 kalkan | Yeteneğin isabet ettiği düşmanlar 2 sn −%30 saldırı hızı alır. |
| 22 | Çiy + Çiy | **Dolunay Testisi** | +30 mana | Yetenek için gereken mana −%20 (`floor(mana × 0,8 + 0,5)`). |
| 23 | Çiy + Kabuk | **Sabır Taşı** | +15 mana, −%10 hasar | Hasar alınca kazanılan mana iki katı (%5 → %10). |
| 24 | Çiy + Yürek | **Şifa Pınarı** | +15 mana, +180 can | Saniyede azami canının %2'si kadar iyileşir. |
| 25 | Çiy + Pul | **Ruh Testisi** | +15 mana, %10 çalma | Bir dost ölünce 30 mana kazanır ve azami canının %10'u kadar iyileşir. |
| 26 | Çiy + Buz | **Buz Pınarı** | +15 mana, 120 kalkan | Yetenek kullanınca 2 hücre içindeki dostlara 80 ×★ kalkan. |
| 27 | Kabuk + Kabuk | **Ana Kaya** | −%20 hasar | Canı ilk kez %40'ın altına inince 2 sn hiç hasar almaz. |
| 28 | Kabuk + Yürek | **Dev Kükremesi** | −%10 hasar, +180 can | Savaş başında 2,5 hücre içindeki düşmanlar 3 sn yalnız onu hedef alır. |
| 29 | Kabuk + Pul | **Diken Kabuk** | −%10 hasar, %10 çalma | Aldığı yakın vuruş hasarının %25'ini saldırgana geri verir (geri dönen hasar yansımaz). |
| 30 | Kabuk + Buz | **Buzul Zırh** | −%10 hasar, 120 kalkan | Ona vuran 2 sn −%20 saldırı hızı alır. |
| 31 | Yürek + Yürek | **Ulu Kök** | +360 can | Savaş başında 2 hücre içindeki dostlara +150 azami can. |
| 32 | Yürek + Pul | **Gece Yüreği** | +180 can, %10 çalma | Ölünce 2 hücre içindeki dostlara kendi azami canının %25'i kadar kalkan. |
| 33 | Yürek + Buz | **Buz Dağı** | +180 can, 120 kalkan | Savaş başında azami canının %20'si kadar ek kalkan. |
| 34 | Pul + Pul | **Gölge Pelerini** | %20 çalma | Bir düşmanı öldürünce 1,5 sn hedef alınamaz. |
| 35 | Pul + Buz | **Kara Buz** | %10 çalma, 120 kalkan | Canı ilk kez %50'nin altına inince 2 hücre içindeki düşmanlar 1 sn sersemler. |
| 36 | Buz + Buz | **Işık Kalkanı** | 240 kalkan | Savaş başında 2 hücre içindeki dostlara 120 kalkan. |

"Hedef alınamaz": `enYakin` bu birimi atlar. Düşmanların hepsi hedef alınamazsa en yakını yine seçilir, birimler boşta kalmaz. "İlk kez" etkileri savaş başına bir kez tetiklenir.

**Özel eşyalar** (tarifle yapılmaz):

| Ad | Nereden | Etki |
|---|---|---|
| **Söküm Taşı** | Ganimet zarfı, Kervan, armağan | Rafta bir kahramana bırakılınca bütün eşyalarını rafa geri indirir; taş harcanır. |
| **Kut Taşı** | 5-7 canavar ganimeti | Yuva kaplar. Taşıyana Kut verilince Kut Yankısı iki kat çalışır. |
| **Soy Mührü (soy adı)** | Armağan "Soy Mührü" | Yuva kaplar. Taşıyan o soyu da taşır. Aynı kahramanın iki kopyası sayılmaz kuralı geçerli; zaten taşıdığı soyun mührü takılamaz. |

Ayrı bir "soy amblemi bileşeni" yoktur. O rolü **Kaynaştırma** üstlenir: soy eklemenin temel yolu iki kahramanı kaynaştırmaktır. Böylece imza mekaniğimiz eşya sistemiyle yarışmaz, onu tamamlar.

### 5.4 Bileşen düşmesi (ganimet planı)

Ganimet oyuncuya özel tohumla (`M.tohum`) belirlenir. Toplam değer herkes için aynı tutulur, yalnız türü değişir. Bu, "şans belirleyici" eleştirisine karşı **kötü şans koruması**dır.

| Tur | Ganimet |
|---|---|
| 1-1 | 1 rastgele bileşen |
| 1-2 | 1 kademe-1 kahraman + 2 altın |
| 1-3 | 2 bileşen gösterilir, **biri seçilir** + 2 altın |
| 2-4 Kervan | Kahraman (K1–K2) + üstünde 1 bileşen |
| 2-7 | 1 bileşen + **zarf**: 3 altın (%40) / 1 bileşen (%30) / 1 kademe-2 kahraman (%30) |
| 3-4 Kervan | Kahraman (K2–K3) + 1 bileşen. Seçeneklerden biri her zaman **hazır kaynaşmış** bir K1×K2 birimdir. |
| 3-7 | 2 bileşen + 3 altın |
| 4-4 Kervan | Kahraman (K3) + 1 bileşen; ya da ★2 K2 + 1 bileşen |
| 4-7 | **3 tam eşyadan biri seçilir** |
| 5-4 ve sonraki Kervanlar | K3 ★1 + 1 tam eşya |
| 5-7 | Kut Taşı + 1 Söküm Taşı |
| 6-7 ve sonrası | 1 tam eşya seçimi (3'ten 1) |

Beklenen bileşen sayısı: 3-7 sonunda yaklaşık 7,3 (3 tam eşya ve 1 artık), 4-7 sonunda yaklaşık 8,3 bileşen ve 1 tam eşya, yani 5 tam eşya kadar.

Canavar turunda kaybedilse de ganimet verilir. Canavar öldükçe görsel olarak "ganimet küresi" düşer, ama toplam yukarıdaki tablodur.

**Kervan** (eşzamansız ortak seçim): her oyuncuya kahraman+eşya çiftlerinden oluşan bir sıra gösterilir. Sıralamada geride olan daha çok seçenek görür: 1–2. sıradakiler 3, 3–4. sıradakiler 4, 5–8. sıradakiler 5 seçenek. Seçenekler lobi tohumundan gelir, herkesin havuzu aynıdır. Seçilen kahraman yedeğe, eşyası rafa iner. Yedek doluysa kahraman satış değerine çevrilir.

### 5.5 Canavarlar

`data.js`'e `CANAVARLAR` tablosu eklenir. Canavarların soyu yoktur ve kahraman havuzuna girmez. Yeteneksiz olanların manası 9999'dur (`yetenek: null`).

| Canavar | Can | Saldırı | Hız | Menzil | Yetenek / pasif |
|---|---|---|---|---|---|
| Çakıl Kıpırı | 280 | 22 | 0,70 | 1 | – |
| Diken Kirpi | 420 | 30 | 0,80 | 1 | Pasif: aldığı yakın vuruşun %15'ini geri verir. |
| Taş Kabuk | 900 | 28 | 0,50 | 1 | – |
| Kum Akrebi | 700 | 50 | 0,80 | 1 | – |
| Ana Akrep | 1500 | 70 | 0,70 | 1 | Mana 80: hedefi 4 sn zehirler, 60/sn. |
| Gök Balinası | 5200 | 85 | 0,50 | 3 | Mana 100: bütün düşmanlara 110 hasar. |
| Kadim Bekçi | 3200 | 110 | 0,60 | 1 | Mana 90: hedefe 250 hasar, 1,5 sn sersemletir. |
| Yıldız Yiyen | 9000 | 140 | 0,60 | 3 | Mana 100: en yakın 3 düşmana 220 hasar. |

| Tur | Dalga |
|---|---|
| 1-1 | 2 Çakıl Kıpırı |
| 1-2 | 3 Çakıl Kıpırı |
| 1-3 | 2 Diken Kirpi + 1 Taş Kabuk |
| 2-7 | 3 Kum Akrebi + 1 Ana Akrep |
| 3-7 | 1 Gök Balinası |
| 4-7 | 2 Kadim Bekçi |
| 5-7 | 1 Yıldız Yiyen |
| 6-7 ve sonrası | 1 Yıldız Yiyen + 2 Kadim Bekçi |

1-1 ve 1-2 öğretici turlardır: bilerek kolaydır ve ilk Kut dokunuşu burada zorla gösterilir. 1-3 yanlış dizilişte kaybedilebilir, ama hasar vermez.

---

## 6. Kut Armağanı (takviye seçimi)

### 6.1 Kurallar

- Üç aşama: **2-1, 3-2, 4-3**. Her aşamada **3 armağandan 1'i** seçilir. Seçim süresi 15 sn; süre dolarsa ilk kart seçilir.
- Bir aşamada üç kartın kademesi aynıdır. Kademeler: **Kıvılcım**, **Alev**, **Yıldız**.

| Aşama | Kıvılcım | Alev | Yıldız |
|---|---|---|---|
| 2-1 | %50 | %40 | %10 |
| 3-2 | %30 | %50 | %20 |
| 4-3 | %20 | %45 | %35 |

- Aşama başına **1 yenileme hakkı** vardır: üç kartın hepsi değişir, kademe aynı kalır.
- Aynı armağan bir maçta iki kez çıkmaz. Seçenekler oyuncunun tohumundan gelir.
- Armağanlar hayalet kaydına yazılır. Savaşı etkileyenler motorda `opt.armagan` ile iki taraf için de uygulanır.
- Kart dili: başlık, tek cümle etki, alt satırda "Neden seç?" ipucu (ör. "Kut'u eşyalı birime veriyorsan").

### 6.2 Yirmi örnek

| # | Ad | Kademe | Etki | Tür |
|---|---|---|---|---|
| 1 | **Çifte Kut** | Yıldız | Savaş başına 2 Kut hakkı; ikincisi ilkinden en az 4 sn sonra kullanılabilir. | Kut |
| 2 | **Uyanış** | Kıvılcım | Kut verilen birim savaş sonuna dek +%25 saldırı hızı kazanır. | Kut |
| 3 | **Kut Mirası** | Alev | Kut verilen birim ölürse Kut hakkı bir kez geri gelir (savaş başına 1). | Kut |
| 4 | **Işık Sütunu** | Alev | Kut, hedefin 2 hücre çevresindeki dostlara da azami manalarının %50'si kadar mana verir. | Kut |
| 5 | **Saklı Kut** | Kıvılcım | Bir savaşta Kut'u kullanmazsan savaş sonunda 3 altın kazanırsın. | Kut / ekonomi |
| 6 | **Ocak Ustası** | Kıvılcım | Kaynaştırma 1 altın. Hemen 1 bedava kaynaştırma hakkı. | Kaynaştırma |
| 7 | **Kusursuz Melez** | Alev | Kaynaşmış birimlerin istatistik çarpanı ×1,15 yerine ×1,30. | Kaynaştırma |
| 8 | **Üçlü Kaynaşma** | Yıldız | Kaynaşmış bir birim bir kez daha kaynaşabilir. Üçüncü kahramandan yalnız soyları ve +%10 istatistik gelir; yetenek ve pasif değişmez. | Kaynaştırma |
| 9 | **Soy Mührü** | Alev | Seçtiğin bir soyun Mührü'nü (özel eşya) ve 1 bileşen al. | Eşya / soy |
| 10 | **Gözcü Baykuşu** | Kıvılcım | Sonraki 2 turun rakibini de görürsün. Hemen 4 altın. | Önceden görme |
| 11 | **Karşı Hamle** | Alev | Önizlenen rakibin en kalabalık soyu, senin takımına karşı savaşta bir eşik düşük sayılır. | Önceden görme |
| 12 | **Alamet Bilgesi** | Kıvılcım | Sonraki 3 turun alametini görürsün. Her bölümde bir kez kendi savaşının alametini Durgun Gök yapabilirsin. | Alamet |
| 13 | **Kızıl Gök Çocuğu** | Alev | Alametin Durgun Gök olmadığı turlarda takımın +%10 hasar verir. | Alamet |
| 14 | **Bereket Küpü** | Kıvılcım | Faiz tavanı 5'ten 7'ye çıkar (70 altında doyar). | Ekonomi |
| 15 | **Pazar Dostu** | Kıvılcım | Her hazırlıkta ilk yenileme bedava. | Ekonomi |
| 16 | **Altın Yumurta** | Alev | 5 savaş turu sonra yumurta çatlar: 22 altın. | Ekonomi |
| 17 | **Hızlı Büyüme** | Kıvılcım | Hemen +8 deneyim; deneyim alımı 4 yerine 3 altın. | Seviye |
| 18 | **Ganimet Kesesi** | Kıvılcım | Hemen 2 rastgele bileşen. | Eşya |
| 19 | **Usta Demirci** | Yıldız | 3 tam eşyadan birini seç, ayrıca 1 Söküm Taşı. | Eşya |
| 20 | **Son Direniş** | Alev | Canın 40'ın altındaysa takımın +%20 can kazanır. Seçince hemen 1 bileşen. | Geri dönüş |

Çıkışta toplam 45–60 armağan hedeflenir: kademe başına 15–20, her imza mekaniği için en az 6.

---

## 7. KUT ve KAYNAŞTIRMA yeni sistemlerle nasıl güçlenir

### 7.1 Kut Yankısı: Kut gücü eşyaya göre değişir

Prototipte Kut yalnız manayı doldurur. Asıl oyunda bu temel kalır. Ek olarak Kut verilen birim **taşıdığı her bileşen** için bir **yankı** alır. Tam eşya iki bileşen sayılır, Kut Taşı yankıyı ikiye katlar. Yankılar Kut anında uygulanır.

| Bileşen | Yankı (bileşen başına) |
|---|---|
| Diş | Sonraki 3 vuruş +%50 hasar |
| Tüy | 3 sn +%50 saldırı hızı |
| Kor | Bu Kut'la patlayan yetenek ×1,25 |
| Çiy | Yetenekten hemen sonra 30 mana |
| Kabuk | 3 sn −%40 alınan hasar |
| Yürek | Azami canının %15'i kadar iyileşme |
| Pul | 3 sn %40 can çalma (vuruş ve yetenek) |
| Buz | 150 ×★ kalkan |

- Aynı bileşen iki kez sayılırsa değer toplanır. Örneğin Yırtıcı Pençe (Diş+Diş) taşıyana Kut verilince sonraki 3 vuruş +%100 hasar alır. Kor yankıları çarpılır: 2 Kor → ×1,25 × 1,25.
- Yankı sırası sabittir: eşya yuvası 0, 1, 2 ve her eşyada tarif sırası. Fx olayı `{tip: 'kutYanki', u, bilesen}` her yankı için bir kez yayılır. Arayüz eşya simgelerini Kut sütununda sırayla parlatır.
- **Kut Ocağı** (Kor+Kor): yankıdaki ×1,25'lere ek olarak ×1,5. Bu, "Kut taşıyıcısı" diye bir yapı tipi doğurur.
- **Kut düğmesinde önizleme**: Kut seçim kipinde her kendi birimin üstünde, Kut verilirse alacağı yankı simgeleri görünür. Karar okunur hâle gelir.

Sonuç: eşya yerleştirmesi yalnız "kim güçlü olsun" değil, "Kut'u kime vereceğim" sorusunun da cevabı olur. Ustalık tavanı yükselir, ama yeni oyuncu için Kut hâlâ "bir kez dokun" kadar basittir.

### 7.2 Kut hakkı ve lobi

- Temel: savaş başına 1 Kut.
- +1 Kut veren yollar: Çifte Kut armağanı, Kut Mirası (koşullu), Son İki (Final Düellosu).
- Alamet "**Kut Sessizliği**" (yeni) çıkan turda Kut yoktur, ama herkes savaşa %25 mana ile başlar.

### 7.3 Kaynaştırma

1. **Yıldız atlama**: kaynaşmış A×B birimi, ilk kahramanın (A) yıldız birleşmesine katılır. Örneğin A×B ★1 + A ★1 + A ★1 → A×B ★2. B kopyaları sayılmaz. Üç birimden en çok biri kaynaşmış olabilir; iki kaynaşmış A birimi birleşmeye girmez. Sonuç kaynaşmış birimin yerinde oluşur. Bu kural olmadan kaynaşma geç oyunda ölü bir seçenekti.
2. **Bedel**: `2 + max(kademe)`. Ucuz kahramanların kaynaşması erken oyunda erişilebilir kalır, K3×K3 melez ise bir karardır.
3. **Eşya toplama**: iki birimin eşyaları kaynaşmış birime geçer, 3'ü aşan rafa döner. Kaynaşma, eşyaları bir taşıyıcıda toplamanın da yoludur.
4. **Soy rolü**: kaynaşmış birim 4 soya kadar taşır. Lobide 8 kişilik takımlar ve 2/4 eşikleri ile asıl soy aracı budur. Soy eşikleri 8 kişilik takım için 2/4/6'ya genişletilir: 6. eşik, 4'ün yaklaşık 1,6 katı bonus. Sayılar soy denge işinde kesinleşir.
5. **Kervan melezi**: 3-4 Kervan'ında bir seçenek her zaman hazır kaynaşmış bir birimdir. Oyuncu "buldum!" anını erken yaşar.
6. **Armağanlar**: Ocak Ustası, Kusursuz Melez, Üçlü Kaynaşma.
7. **Meta**: maç sonu ekranında "Bu maçta keşfettiğin melezler" listesi ve Kodeks'te melez koleksiyonu (240 olasılık). Yalnız görünüş ödülü.

### 7.4 Yapay zekâ Kut'u (hayalet ve bot)

Hayalet, kayıttaki `{i, t}` dokunuşunu kullanır. Kayıt yoksa, birim ölmüşse ya da ikinci hak gerekiyorsa yapay zekâ kuralı devreye girer: 5. saniyede (ikinci hak 12. saniyede) puanı en yüksek birime verilir.

```
puan = (mana − mp) × kc + 20 × bileşenSayısı + (Kut Ocağı varsa 60)
```

Eşitlikte birim sırası (`i`) küçük olan seçilir.

---

## 8. Alamet lobide

- Alamet bir tur için **lobinin tamamına** aynıdır ve bütün savaşlara (hayalet × hayalet dahil) uygulanır. Bölüm 1'de alamet yoktur (Durgun Gök).
- Sıradaki turun alameti önceden görünür (bölüm 4.3).
- Yeni alametler:

| Ad | Etki |
|---|---|
| **Demirci Ateşi** | Bu turun PvP savaşını kazanan 1 rastgele bileşen alır. |
| **Göç Mevsimi** | Bu hazırlıkta ilk 2 yenileme bedava. |
| **Kut Sessizliği** | Bu tur Kut yok; herkes savaşa %25 mana ile başlar. |
| **Uzun Gölge** | Gün Batımı 20. yerine 12. saniyede başlar. |

- Bereketli Pazar +2 altın olarak kalır.
- Aynı alamet art arda gelmez. Alamet havuzu 12 olunca her biri yaklaşık %8 olasılıkla gelir; Durgun Gök ağırlığı 2'dir.

---

## 9. Tahta ve diziliş

- Hazırlık tahtası **4 sütun × 3 sıra** (12 hücre). En çok `seviye` kadar kahraman (≤ 8) konur. Sıralar: ön, orta, arka.
- Motor koordinatları (arena 6 × 8):
  - `x = 0,75 + b.x × 1,5` → 0,75 / 2,25 / 3,75 / 5,25
  - Taraf 0: `y = [5, 6, 7][b.y]` (ön, orta, arka)
  - Taraf 1: `y = [3, 2, 1][b.y]`
- Ön sıralar arası mesafe 2 kalır, eski savaş temposu korunur.
- Hızlı Maç da bu tahtayı kullanır; 6 kahraman sınırı orada sürer.
- Yedek 7 yuva. Eşya rafı 10 yuva.

---

## 10. Açıklayıcılık: yeni sistemlerin ekranda anlatılması

Bu belge yerleşim vermez (o `ARAYUZ_TASARIM.md`'nin işi). Ama her yeni sistemin oyuncuya nasıl anlatılacağı oynanış kararıdır ve şu kurallar zorunludur:

1. **Seviye rozeti** (dükkânın solu): "Sv 5 · 12/20" ve ilerleme çubuğu. Dokununca o seviyenin ve bir sonrakinin kademe olasılıkları tablo hâlinde açılır.
2. **Altın rozeti**: yanında faiz göstergesi olarak 5 küçük sikke yuvası (her 10 altında biri dolar) ve "+7 sonraki tur" tahmini (taban + faiz + seri + galibiyet).
3. **Seri**: altın rozetinin yanında ateş (kazanma) ya da buz (kaybetme) simgesi ve sayısı. Dokununca bonus tablosu açılır.
4. **Eşya**: bileşen bir kahramanın üstüne sürüklenirken, oluşacak tam eşyanın adı ve etkisi baloncukta görünür. Rafta bir bileşene uzun basınca 8 tarifi gösteren **tarif çarkı** açılır.
5. **Kut Yankısı**: Kut seçim kipinde her birimde yankı simgeleri (bölüm 7.1).
6. **Lobi şeridi** (sağ kenar): 8 oyuncunun portresi, can çubuğu ve sırası. Sıradaki rakip vurgulu, elenenler gri. Dokununca Gözcü paneli açılır.
7. **Hasar önizlemesi**: Savaşa! düğmesinin altında "Kaybedersen ~11 can" (taban + rakibin olası kalan puanı ortalaması).
8. **Bölüm haritası** (üst çubuk): bölümün 7 turu küçük simgelerle; savaş, Kervan, canavar ve armağan farklı simge. Şimdiki tur vurgulu.
9. **Öğretici sırası**: 1-1 Kut (zorla), 1-2 yıldız birleşmesi, 1-3 bileşen takma, 2-1 armağan, 2-2 rakibi önceden görme, 2-4 Kervan, ilk fırsatta kaynaştırma. Her biri tek cümlelik bant ve parmak işaretiyle.

---

## 11. Denge hedefleri ve benzetim testleri

`test/lobi.test.cjs` adıyla yeni bir test yazılır: 8 bot izinden oluşan 10.000 lobiyi motorla baştan sona oynatır, canlı oyuncu da bot olur. Hedefler:

| Ölçüt | Hedef |
|---|---|
| Maçın bittiği tur (ortanca) | 5-2 ile 5-4 arası |
| İlk elenme turu (ortanca) | 4-1 ± 2 tur |
| Birincinin toplam süresi (tahmin: tur sayısı × süre tablosu) | 17–20 dk |
| Savaş süresi ortanca / %90 dilim | 16–20 sn / ≤ 28 sn |
| Süre sınırıyla biten savaş | < %5 |
| Her tam eşyanın taşıyıcı kazanma oranı | ortalamanın ±%5'i |
| Her armağanın ilk-4 oranı | %40–60 |
| Kut'u en iyi hedefe veren × rastgele hedefe veren | +%8 ile +%15 kazanma farkı |
| Faizi tavanda tutan bot × hiç biriktirmeyen bot ortalama sıra | fark ≤ 0,8 sıra (iki yol da yaşar) |
| Kaynaşmış birim içeren takımın ilk-4 oranı | %45–55 |
| Bölüm 1'de canavarı kaybetme | ≤ %10 |

Mevcut `test/sim.test.cjs` kahraman denge taraması 4×3 tahtaya, seviyeye bağlı takım boyutuna ve eşyalı bot takımlarına güncellenir.

---

## 12. Motor ve kod değişiklikleri (işlev ve alan bazında)

Her madde JS'te ve C#'ta birlikte uygulanır. Sıra: önce JS, sonra C#. Ardından `node kut/test/esdeger_uret.cjs` ve `cd kut/unity/Test && dotnet run` çalıştırılır. Eşdeğerlik kümesine eşyalı, armağanlı, canavarlı, Gün Batımı'na giden ve çift Kut'lu savaşlar eklenir. Hedef yine %100 birebir.

### 12.1 `data.js` → `KutVeri.cs` (`tools/csharp_veri.cjs` ile üretilir; üretici yeni tabloları da yazacak şekilde genişletilir)

- `KURAL` yeni alanlar: `canBaslangic: 100`, `seviyeBaslangic: 2`, `seviyeTavan: 8`, `xpTablo: [_,_,2,6,10,20,32,48]` (indeks = mevcut seviye), `pasifXp: 2`, `xpBedel: 4`, `xpMiktar: 4`, `tabanGelir(r)`, `faizAdim: 10`, `faizTavan: 5`, `seriBonus(n)`, `galibiyetBonus: 1`, `yenile: 2`, `kaynastirBedel(a, b) = 2 + max(kademe)`, `takimBoyutu(sv) = sv`, `kademeOlasilik(sv)` (tablo 2.2), `havuzAdet: {1: 22, 2: 18, 3: 14}`, `yedek: 7`, `esyaYuva: 3`, `esyaRaf: 10`, `bolumTabani: [0, 0, 2, 5, 8, 12, 15, 18]`, `sonUcEk: 3`, `sonIkiEk: 5`, `gunBatimi: {basla: 20, artis: 0.10}`, `hazirlikSure`, `kervanSure`, `armaganSure`.
- Hızlı Maç için eski alanlar `KURAL.hizli` altına taşınır: `altinTur`, `can: 5`, `zaferHedef: 7`, `yuva(tur)`, tura bağlı `kademeOlasilik`, `yenile: 1`, `kaynastir: 3`.
- Yeni tablolar: `BILESENLER` (8; `{id, ad, stat: {atk, as, yg, mana0, azalt, can, cal, kalkan0}}`), `ESYALAR` (36 + 3 özel; `{id, ad, tarif: [a, b], etki}`; istatistik tariften hesaplanır), `ARMAGANLAR` (`{id, ad, kademe, etki, savas: bool}`), `CANAVARLAR`, `PVE_DALGA` (`r → [{h, x, y}]`), `TUR_PLANI`, `GANIMET`, `KERVAN`.
- `ALAMETLER`: 4 yeni alamet; seçim ağırlığı alanı `w`.
- `kahraman(id)`: bulamazsa `CANAVARLAR`'a bakar. Canavarın `kademe: 0`, `soy: []`.

### 12.2 `sim.js` → `KutSavas.cs`

- **Takım birimi** yeni alan `e: string[]` (0–3 eşya kimliği; bileşen ya da tam). C#: `TakimBirimi.E` (`List<string>`), `Kopya()` bunu da kopyalar.
- **`birimStat(b)`**: eşya istatistiklerini toplar ve döner: `atk` (×(1+Σatk)), `canEk`, `asEk`, `yg`, `mana0`, `azalt` (≤ 0,4), `cal`, `kalkan0`, `esya: [etki…]` (yuva sırasıyla, tekrarsız), `kutYanki: {dis, tuy, kor, ciy, kabuk, yurek, pul, buz}` sayaçları. Soy Mührü soya eklenir. Canavarda soy boştur. Kaynaşma çarpanı `opt` ile gelen `kaynasCarpan` olur (varsayılan 1,15; Kusursuz Melez 1,30).
- **`soySay(takim)`**: mantık aynı; mühür soyu `birimStat`'tan gelir. 6. eşik eklenirse `seviye: 3`.
- **`Savas(takimA, takimB, opt)`** yeni seçenekler:
  - `armagan: [[…], […]]`
  - `kutHak: [1, 1]` (Çifte Kut ya da Final'de 2)
  - `kaynasCarpan: [1.15, 1.15]`
  - `gunBatimi: 20` (Uzun Gölge'de 12)
  - `kutYok: bool` (Kut Sessizliği)
  - `karsiHamle: [soyId|null, soyId|null]` (o tarafa karşı rakip soyu bir eşik düşük)
  - `pve: bool`
- **Konum**: `x = 0.75 + b.x * 1.5`; `y` taraf 0 için `[5, 6, 7][b.y]`, taraf 1 için `[3, 2, 1][b.y]` (bölüm 9).
- **Birim nesnesi** yeni alanlar: `yg`, `azalt`, `cal`, `asEk`, `esya`, `kutYanki`, `ilkVurusYapildi`, `sonHedefUid`, `esikTetik: {}` (ilk-kez etkileri), `kutCarpan` (1), `yankiDis` (kalan güçlü vuruş), `hedefAlinmaz` (durum), `zorla` (Dev Kükremesi hedef uid'i).
- **Savaş başı**: `mp += mana0` (≤ mana−1); `kalkan0` ve Buz Dağı, Işık Kalkanı, Ulu Kök (azami can, `mx` ve `hp` birlikte), Dev Kükremesi (`zorla`, 3 sn), Sis Pelerini (`hedefAlinmaz` 2,5 sn); armağan Son Direniş (+%20 can), Kızıl Gök Çocuğu. Mevcut savaş başı döngüsünden sonra, birim sırasıyla.
- **`enYakin(u)`**: önce `u.durum.zorla` geçerliyse o hedef; sonra `hedefAlinmaz` olmayanlar arasından en yakın; hepsi hedef alınamazsa eski davranış.
- **`hizCarpan(u)`**: `+ u.asEk` ve geçici durumlar: `cosku` (+0,4), `canRuzgar` (+0,4), `yankiTuy` (+0,5 × sayı), `geceKanat` (+0,6), Uyanış (+0,25). Mevcut alt sınır 0,25 kalır.
- **`hasar(kaynak, hedef, miktar, tur)`**:
  - Kaynak çarpanları: Yırtıcı Pençe (3. vuruşta `+ hedef.mx × 0.08`), Dev Yumruğu (`+ kaynak.mx × 0.02`), Bulut Nalı ilk vuruş ×2, Diş yankısı, Kızıl Gök Çocuğu, Öfke Tılsımı.
  - Gün Batımı çarpanı bütün türlerde: `t ≥ gb` ise `× (1 + 0.1 × floor(t − gb))`.
  - Hedef tarafı: `dokunulmaz` → 0; `× (1 − hedef.azalt)`; Kabuk yankısı; Öfke Tılsımı.
  - Kalkandan sonra: Diken Kabuk ve Diken Kirpi yansıması (`tur: 'yansima'`, yansımaz, mana vermez).
  - Mana kazanımı: Sabır Taşı çarpanı.
  - Can çalma: `cal` (vuruşta), Gölge Mürekkebi (yetenekte %25), Pul yankısı, Gece Kanadı.
  - Eşik kontrolü (`esikTetik`): Öfke Tılsımı %50, Gece Kanadı %30, Ana Kaya %40 (2 sn `dokunulmaz`), Kara Buz %50 (çevre 1 sn `sersem`).
- **`vurusEtki(u, h)`**: Buz Mızrağı (`h.uid !== u.sonHedefUid` ise 0,8 sn sersem), Kar Tanesi (`yavas` 0,15), Yel Kanadı (5. vuruşta anında ek `hasar(u, h, u.atk, 'vurus')`; ek vuruş `vurus` sayacını artırmaz), Şimşek Tüyü (5. vuruş; mevcut `gokGurultu` sıralama kodu yeniden kullanılır), Buzul Zırh (saldırgana `yavas` 0,2).
- **Vuruş başı mana**: `10` sabiti → `u.vurusMana` (Keskin Göz 15). Bilge soyu çarpanı bunun üstüne uygulanır.
- **`yetenek(u)`**:
  - `c = u.kc × (1 + u.yg) × u.kutCarpan`; çağrıdan sonra `u.kutCarpan = 1`.
  - Her `case` isabet ettiği düşmanları bir `vurulan[]` listesine ekler. Bu küçük bir yeniden düzenlemedir: `hasar` çağrısı `vur(o, n)` yardımcısından geçer.
  - Yetenek sonrası kancalar (sabit sıra): Kızgın Diş (vurulanlara yanık), Ayaz Asası (vurulanlara `yavas` 0,3), Taş Mühür, Can Ateşi, Buz Pınarı, Bilge Asası (+25 mp), Rüzgâr Çanı (`canRuzgar` 3 sn), Çiy yankısı (+30 mp, tek seferlik).
  - Canavar yetenekleri için yeni `case`'ler: `akrepZehir`, `balinaSarki`, `bekciDarbe`, `yildizYutan`.
- **Mana eşiği**: `u.mana` savaş başında Dolunay Testisi ile `floor(mana × 0.8 + 0.5)`. Canavarda 9999.
- **`olum(u, katil)`**: Gece Yüreği (çevre kalkan), Ruh Testisi (dost ölünce), Av Coşkusu (takım; `cosku` 3 sn), Gece Avcısı (katil iyileşir), Gölge Pelerini (katil 1,5 sn `hedefAlinmaz`), Kut Mirası (Kut verilen birimse `kutKalan[taraf]++`, bir kez). Mevcut `ruhBagi` ve `karanlikPay` döngüsüyle aynı geçişte, birim sırasıyla.
- **Saniyelik**: Şifa Pınarı yenilenmesi `iyilesSessiz` ile Su soyundan sonra.
- **`kut(taraf, i)`**:
  - `kutKullanildi[]` → `kutKalan[]` (sayaç) ve `sonKutT[]` (Çifte Kut 4 sn kuralı). `kutYok` ise hep reddeder.
  - Yankılar sabit sırayla uygulanır: Kor (`kutCarpan *= 1.25^n`, Kut Ocağı varsa ×1,5), Diş (`yankiDis = 3`, oran 0,5 × n), Tüy, Kabuk, Yürek, Pul, Buz. Çiy, yetenek sonrası kancada uygulanır.
  - Uyanış, Işık Sütunu armağanları.
  - Fx `kutYanki` olayları yayılır. Kayıt biçimi `{t, taraf, i}` değişmez.
- **`kutVar(taraf)`** → `kutKalan[taraf] > 0 && !kutYok`. Yeni `kutKalanSay(taraf)` arayüzdeki "2/2" sayacı için.
- **`kutYZ(taraf)`**: bölüm 7.4'teki puan. İkinci hak `yzZaman2` (12 sn).
- **`adim()`**: `opt.yz` döngüsü çok hakla çalışır (`kutKalan > 0` ve zaman eşiği).
- **`bitir(k)`**: `sonuc` alanlarına `kalanPuan` (Σ sağ birimlerin `b.s`; canavar 1) ve `kalanSayi` eklenir. Eski `kalan` uyumluluk için kalır.
- **Yeni durum adları** (C#'ta `Durum` sözlüğü anahtarları aynı yazılır): `zorla`, `hedefAlinmaz`, `dokunulmaz`, `cosku`, `canRuzgar`, `geceKanat`, `yankiTuy`, `yankiKabuk`, `yankiPul`.
- **Belirlenimcilik kuralları**: eşya ve armağanda `R()` yok; bütün döngüler birim dizisi sırasıyla; sıralamalar kararlı (C#'ta `OrderBy`); `Math.pow` yerine tekrarlı çarpma (`1.25^n` döngüyle); yuvarlamalar `floor(x + 0.5)`.

### 12.3 `online.js` → `KutHayalet.cs`

- `Hayalet.birak(kayit)` → `Hayalet.izBirak(macIzi)` (bölüm 4.7 biçimi). Tur sonunda kısmi, maç sonunda tam yazılır. Yerel anahtar `kut.iz.v2`, en çok 60 iz.
- Yeni `Hayalet.lobiKur({kupa, oyuncu, tohum})` → 7 iz döner (uzak havuz, sonra yerel, sonra `botIz`). `KUT_UZAK` arayüzü `yaz(macIzi)` ve `lobiBul({kupa, oyuncu, adet: 7, surum})` olur. Eski `bul` Hızlı Maç için kalır. C#: `IHayaletHavuzu`'na `IzYaz` ve `LobiBul` eklenir.
- `botTakim(tur, tohum, guc)` korunur (Hızlı Maç). Yeni `botIz(tohum, guc)` bölüm 4.8'deki eğriyle her `r` için `{seviye, takim (e dahil), yedek, armagan, kut: null}` üretir.
- `yerlestir(takim)` → 4×3 tahta: yakın dövüşçüler ön sıra (sütun 1, 2, 0, 3 sırasıyla), menzil 2 orta, menzil 3 arka. Eşya taşıyan menzilli, arka sütun 1–2'ye.
- `kodla/coz`: yeni biçim `KUT2-` eşya kimliklerini de taşır (`h.s.f.x.y.e1,e2,e3`). `KUT1-` kodları çözülmeye devam eder: `x` aynen, `y` 0→0 ve 1→2 eşlenir, eşya boş.
- İz tükenince güçlendirme kuralı (bölüm 4.7) `izTur(iz, r)` işlevinde.

### 12.4 Yeni modül `lobi.js` → `KutLobi.cs` (saf, belirlenimci)

- `lobiYeni(canliOyuncu, izler, tohum)` → `{oyuncular[8]: {ad, can: 100, olu, siraBitis, gecmisRakip[], seri}, tohum, r}`.
- `eslesmeKur(lobi, r)` (bölüm 4.2; Yankı dahil).
- `golgeSavaslari(lobi, r, alamet)` → hayalet × hayalet eşleşmelerini `Savas(...).sonunaKadar()` ile oynatır.
- `hasarUygula(lobi, r, sonuclar)` (bölüm 4.4; Son Üç ve Son İki ekleri).
- `siralamaGuncelle(lobi, r)` ve `bitti(lobi)`.
- `havuzKalan(lobi, r, oyuncuTahta)` (bölüm 2.3).
- `kervanSecenek(lobi, r, sira)` ve `ganimet(oyuncuTohum, r, secim)`.

### 12.5 `web/oyun.js` (Unity'de `MacYoneticisi`)

- `M` yeni alanlar: `r`, `seviye`, `xp`, `altin` (birikimli), `seri {tip: 'G'|'M', n}`, `esyaRaf[]`, `armagan[]`, `armaganSecenek`, `lobi`, `kervan`, `ganimetBekleyen[]`, `tahta` 12 hücre, `yedek` 7.
- Değişen işlevler:
  - `yeniMac()` (lobi kurulur, ilk kahraman seçimi)
  - `turBaslat()` (tur tipine göre dallanır, `gelirHesapla()`, eşleşme, rakip önizleme, sıradaki alamet)
  - `_dukkanDoldur()` (seviye olasılığı ve havuz ağırlığı)
  - `yuva()` → `seviye`
  - `satinAl()` (havuz düşümü)
  - `_birlestir()` (kaynaşmış birim kuralı, eşya toplama)
  - `yuvaDokun()` (kaynaştırma bedeli, eşya toplama)
  - `sat()` (eşya rafa, havuza iade)
  - `takim()` (4×3 ve `e`)
  - `savasHazirla()` (`opt` armağan, kutHak, gunBatimi, kutYok, karsiHamle; PvE'de canavar dalgası)
  - `savasBitti()` (lobi hasarı, seri, deneyim, ganimet, iz yazma)
  - `_macBitti()` (sıra, kupa tablosu, ustalık)
- Yeni işlevler: `xpAl()`, `gelirHesapla()` (arayüzün "+7 sonraki tur" tahmini için de), `esyaTak(rafI, yer, i)`, `esyaBirlestirRaf(a, b)`, `sokumTasi(yer, i)`, `armaganSec(k)`, `armaganYenile()`, `kervanSec(k)`, `ganimetAl()`, `gozcu()` (diğer hayaletlerin kadroları).

### 12.6 Testler

- `test/esdeger_uret.cjs`: eşyalı, armağanlı ve canavarlı savaşlar eklenir (en az 1.000 savaş).
- `test/sim.test.cjs`: 4×3 tahta, Gün Batımı süre ölçümü, eşya denge taraması (her tam eşya ayrı ayrı).
- Yeni `test/lobi.test.cjs` (bölüm 11).
- `test/oyun_mantik.test.mjs`: gelir, faiz, seri, deneyim, havuz, kaynaşmış birim yıldız atlama, eşya toplama ve taşma durumları.

---

## 13. Uygulama sırası (öneri)

1. Tahta 4×3 ve seviye/deneyim. Hızlı Maç'ı `KURAL.hizli`'ye taşı, eşdeğerliği yeniden kur.
2. Birikimli ekonomi (gelir, faiz, seri, yenileme 2).
3. Bileşen ve 36 eşya: motor kancaları, raf ve takma. Eşdeğerlik ve eşya denge taraması.
4. Canavar turları ve ganimet.
5. Lobi modülü, bot izi, eşleşme, hayalet × hayalet savaşları, hasar ve sıralama. `lobi.test.cjs` ile süre hedefi.
6. Kut Yankısı ve Kut hakkı sayacı.
7. Kut Armağanı (20 örnek), Kervan, yeni alametler.
8. Uzak iz havuzu (Firestore: `iz/{surum}_{kupaKovasi}/maclar/{macId}`).
9. Öğretici akışı (bölüm 10.9).
