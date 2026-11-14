# Kut Arena: animasyon planı

Bu belge, savaş motorunun ürettiği olayların (`Fx`) ekranda nasıl canlanacağını tanımlar. Unity'deki uygulayıcı ve tarayıcı sürümü aynı kurallara uyar. Animasyon kaynağı Quaternius Universal Animation Library'dir (UAL, CC0; `kut/animasyon/`). Sürelerin hepsi UAL kliplerinden ölçüldü.

## 1. Temel ilke: motor önde, görüntü arkada

Savaş motoru bir vuruşu anında uygular, ama gerçek bir yumrukta elin hedefe varması yaklaşık 0,25 sn sürer. Animasyonun "oturması" için:

- **Görüntü, motoru 0,4 sn geriden izler.** Motor her zaman 0,4 sn ileride hesaplar, olayları bir kuyruğa yazar. Görsel katman bir saldırı olayını, darbe anı tam olay zamanına denk gelecek şekilde önceden başlatır (aşağıdaki "darbe anı" değerleri).
- **Hasar sayısı, darbe efekti ve vurulma tepkisi** olay zamanında (yani klibin darbe karesinde) görünür.
- **Kut dokunuşu:** oyuncu dokunduğu anda ışık sütunu ve "toplanma" efekti hemen başlar; motor Kut'u o andan 0,4 sn sonrasına yazar. Oyuncu bunu gecikme olarak değil, gücün toplanması olarak görür. Motor belirlenimci kaldığı için tekrar izleme ve çevrimiçi doğrulama bozulmaz: Kut kaydı motorun yazdığı zamandır.
- Savaş sonu bandı, motor bittikten 0,4 sn sonra (son ölüm animasyonu başlarken) çıkar.

## 2. UAL klipleri ve darbe anları

| Klip | Süre | Darbe anı (klip içi) | Kullanım |
|---|---|---|---|
| Idle_Loop | 2,50 sn | — | Bekleme (döngü) |
| Walk_Loop | 1,33 sn | — | Yürüme (döngü, yerinde) |
| Jog_Fwd_Loop | 0,92 sn | — | Çevik soyu ve hücum (döngü) |
| Punch_Jab | 0,83 sn | **0,21 sn** (%25) | Hızlı yakın vuruş |
| Punch_Cross | 1,00 sn | **0,30 sn** (%30) | Ağır yakın vuruş |
| Sword_Attack | 1,50 sn | **0,43 sn** (%29) | Tepeden ezme (yetenek) |
| Spell_Simple_Enter | 0,50 sn | sonda kol ileride | Büyü hazırlığı |
| Spell_Simple_Shoot | 0,50 sn | **0,00 sn** (açılışta) | Menzilli atış; mermi ilk karede çıkar |
| Spell_Simple_Idle_Loop | 2,08 sn | — | Büyüyü tutma (kanalize) |
| Hit_Chest | 0,33 sn | — | Gövdeye darbe tepkisi |
| Hit_Head | 0,42 sn | — | Başa darbe tepkisi |
| Death01 | 2,38 sn | yere çarpma %56 (1,33 sn) | Ölüm |
| Dance_Loop | 1,00 sn | — | Zafer, davul dansı |
| Jump_Start / Jump_Land | 1,33 / 1,25 sn | — | Yeniden doğuş, sıçrama |

**Saldırı hızı uyumu:** iki saldırı arası `1 / (as × hızÇarpanı)` saniyedir. Klip bu süreden uzunsa oynatma hızı `klipSüresi × as × hızÇarpanı` kadar artırılır (en az 1). Böylece klip bir sonraki vuruştan önce biter. Darbe anı da aynı oranda kısalır; önceden başlatma süresi buna göre hesaplanır.

**Yürüme hızı:** motor hızı 1,7 hücre/sn, Çevik soyunda 2,4. Walk_Loop oynatma hızı, ayakların kaymadığı değere sahnede ayarlanır (başlangıç: 1,0 ve Jog için 1,0); Çevik soyu Jog_Fwd_Loop kullanır.

## 3. İki ayaklılar (insan iskeleti, UAL'den hedeflenir)

| Yaratık | Normal saldırı | Darbe anı | Özel güç (yetenek) animasyonu | Efekt |
|---|---|---|---|---|
| Kaya Golemi | Punch_Cross | 0,30 sn | Spell_Simple_Enter → Shoot (kaya fırlatma) | Göğüs kristali parlar, kaya mermisi, hedefte toz ve sersemleme yıldızları |
| Davulcu Kurbağa | Spell_Simple_Shoot (ses dalgası) | 0,00 sn | Dance_Loop × 1 (davul dansı) | Her vuruşta halka şeklinde ses dalgası; takımın üstünde turuncu güç aurası 4 sn |
| Sis Yarasası | Punch_Jab (pençe) | 0,21 sn | Spell_Simple_Enter → Idle_Loop 0,6 sn | Hedeften yarasaya kızıl can akışı (çizgi parçacık) |
| Rüzgâr Ruhu | Spell_Simple_Shoot | 0,00 sn | Spell_Simple_Enter → Shoot | Yaprak dolu küçük kasırga, düşmanları geri iter |
| Işık Kuğusu | Spell_Simple_Shoot | 0,00 sn | Spell_Simple_Enter → Idle_Loop 0,8 sn | Kanatlardan yükselen ışık tüyleri; dostlarda kalkan kabarcığı |
| Gece Ayısı | Punch_Cross | 0,30 sn | Sword_Attack (tepeden ezme) | Mor gölge pençesi, hedefte lanet işareti (5 sn) |
| Anka | Spell_Simple_Shoot (ateş tüyü) | 0,00 sn | Spell_Simple_Enter → Shoot | Hedef çevresine kül yağmuru; ölünce küle dönüp Jump_Land ile alevden doğuş |
| Ayaz Baykuşu | Spell_Simple_Shoot (buz kıymığı) | 0,00 sn | Spell_Simple_Enter → Idle_Loop 0,8 sn → Shoot | Bütün sahaya kırağı dalgası, düşmanlarda buz kaplaması |
| Gölge Tilki | Spell_Simple_Shoot (ok) | 0,00 sn | Spell_Simple_Enter (yay germe) → Shoot | Yay ipine ışık çizgisi; canı en düşük düşmana gölge oku |
| Fırtına Ejderi | Spell_Simple_Shoot | 0,00 sn | Jump_Start (yarısı) → Shoot | Gökten 3 yıldırım; hedeflerde sersemleme |

Her iki ayaklı için ayrıca:
- **Bekleme:** Idle_Loop. Aynı türden birkaç yaratık senkron görünmesin diye her birinin başlangıç zamanı rastgele kaydırılır.
- **Vurulma:** yalnız 60'tan büyük darbede Hit_Chest (0,33 sn), üst katmanda ve yarı ağırlıkla. Yürüme ya da saldırı kesilmez.
- **Ölüm:** Death01. Yere çarpma anında toz efekti; 1,8 sn sonra 0,6 sn içinde erir.
- **Zafer:** savaş kazanılınca yaşayanlar Dance_Loop.
- **Kanatlılar** (Kuğu, Anka, Yarasa) kolu kanat olarak kullanır. Bekleme ve yürümede kanatlara küçük, kodlu bir çırpma (±8°, 1,6 Hz) eklenir.
- **İri kollular** (Golem, Ayı): Idle'da kollar gövdeye giriyor. Humanoid avatarda omuz ve kol kas sınırlarıyla ya da kollara +12° dışa açı ekleyen ek bir katmanla düzelt.

## 4. Dört ayaklılar ve yılan (kodla canlandırma)

UAL insan iskeleti içindir; dört ayaklılar Tripo'nun dört ayaklı iskeletini kullanır. Kemik adları:
- Omurga: `tripoSpine_0..n`, baş: `tripoHead_0..n`, kuyruk: `tripoTail_*`
- Ön bacaklar: `tripo0_Left/Right_Limb_0..3`, arka bacaklar: `tripo1_Left/Right_Limb_0..3`
- `bone_NN` adlı kemikler kulak, parmak ve ek parçalardır; ellenmez.

**Yürüyüş (tırıs):**
- Çapraz çiftler birlikte hareket eder: sol ön + sağ arka faz 0, sağ ön + sol arka faz 0,5.
- Adım frekansı hız ile orantılıdır (1,7 hücre/sn'de 2,2 adım/sn).
- Her bacakta `Limb_0` ileri-geri ±22° salınır; `Limb_1` salınımın ileri yarısında 30° bükülür (ayak kalkar).
- Gövde adım başına 2 kez 0,03 birim iner kalkar. Baş, gövdenin tersine hafifçe dengelenir.

**Bekleme:** omurga nefes alır (±2°, 0,4 Hz). Baş hedefe döner (en fazla 35°). Kuyruk yavaş sallanır.

**Saldırı (ısırma/toslama):** 0,15 sn'de kök 0,3 hücre ileri, baş 15° aşağı; **darbe 0,15 sn'de**; 0,3 sn'de geri döner.

**Özel güçler:**
| Yaratık | Hareket | Efekt |
|---|---|---|
| Kristal Kurt (Uluma) | Baş 40° yukarı, 0,6 sn tutar | Sırttaki kristaller parlar; yanındaki dostlarda mavi hız izleri |
| Dağ Koçu (Boynuz Öfkesi) | Ön bacaklar 0,4 sn şahlanır, yere vurur | Boynuz desenleri kızıl yanar; 3 vuruş boyunca buhar |
| Buz Kaplumbağası (Buz Nefesi) | Baş öne uzanır, 0,5 sn | Ağızdan koni şeklinde buz, hedefler donar |
| Kor Semenderi (Kor Halkası) | Yerinde döner (360°, 0,5 sn) | Çevresinde ateş halkası; dostlarda iyileşme parıltısı |
| Bulut Atı (Bulut Hücumu) | Şahlanır, sonra hedefe atılır (motor konumu ışınlar; görüntü 0,25 sn'de kayar) | Arkada bulut izi |

**Vurulma:** gövde 0,1 hücre geri sarsılır. **Ölüm:** 0,6 sn'de yana 90° devrilir, sonra erir.

**Yılan:** kıvrık alt gövde sabittir; boyun ve baş zinciri (`tripoHead_0..4`) sinüs dalgasıyla salınır.
- Saldırı: baş 0,12 sn geri çekilir, 0,1 sn'de ileri atılır (**darbe 0,22 sn**).
- Zümrüt Zehri: baş yükselir, ileri tükürür (yeşil zehir mermisi).
- Ölüm: baş zinciri yere serilir.

## 5. Ortak görsel kurallar

- **Yıldız:** ★1 ölçek 1,00, ★2 1,12, ★3 1,25. ★3'te ayak altında altın parıltı halkası.
- **Kaynaşma** (A × B): A'nın modeli kullanılır. Gövde kenarında B'nin renginde ışıma (rim), ayak altında B renginde ikinci halka, başın üstünde B'nin küçük portre rozeti. Kaynaşma anında iki yaratık birbirine doğru çekilir, beyaz ışık patlar, yeni birim belirir (0,8 sn).
- **Birleşme** (3 aynı → ★2/★3): üç kopya ortadakine uçar, yıldız yağmuru, ölçek zıplaması (1,0 → 1,3 → yeni ölçek, 0,5 sn).
- **Durum göstergeleri:**
  - Sersem: başın üstünde dönen 3 yıldız.
  - Yavaş: ayaklarda buz kristali.
  - Yanık: turuncu alev parçacıkları.
  - Zehir: yeşil kabarcıklar.
  - Lanet: başın üstünde mor göz simgesi.
  - Kalkan: yarı saydam kabarcık; miktarı can çubuğunun üstünde beyaz şerit.
- **Mermiler:** menzilli normal saldırıda yaratığın soy rengiyle küçük mermi. Uçuş süresi = mesafe / 12 hücre/sn. Mermi gidişini de önden başlatma süresine ekle (darbe olay zamanında hedefe varır).
- **Hasar sayıları:** beyaz (normal), turuncu (yetenek), yeşil (iyileşme), gri "kaçtı", büyük ve sarı (kritik ya da yetenek ≥ 200).
- **Kut:** dokunulan yaratığın üstüne mor-altın ışık sütunu ve 0,15 sn hafif zaman yavaşlaması (yalnız görüntü). Ardından yeteneği normalden büyük efektle oynar.

## 6. Unity uygulama notları

- İki ayaklılar: tek bir **Animator Controller** ve iki katman.
  - Taban: Idle / Walk / Jog blend; tetikleyiciler: Saldir, Atis, Yetenek, Olum, Zafer.
  - Üst katman (Additive / Override, gövde maskesi): Vurul.
- Yaratık başına farklılık (hangi saldırı klibi, darbe anı, yetenek dizisi) bir **AnimatorOverrideController** ve `KahramanGorsel` ScriptableObject ile verilir. Tablo yukarıda.
- Dört ayaklılar ve yılan: `DortAyakliHareket.cs` ve `YilanHareket.cs`, LateUpdate'te kemik dönüşü yazar (kodla canlandırma).
- Savaş sahnesi: `SavasSahnesi.cs`, motoru 0,4 sn önde çalıştırır, `Fx` olaylarını zaman damgalı kuyruğa koyar, her kare görüntü zamanına gelen olayları uygular.
