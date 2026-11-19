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

**UAL2 klipleri** (`web/modeller/ual2.glb`, Unreal adlı iskelet). Yükleme anında önce UAL iskeletine aktarılır (`sahne3d.js` `ual2Aktar`: iki iskelet A duruşunda, kemik başına model-göreli dünya dönüş farkı, kemik yönleri hizalanır), sonra her yaratığa UAL klipleri gibi aktarılır. Darbe anları aktarılmış klipte ölçüldü (60 kare/sn; elin kalçaya göre en ileri gittiği kare ve el hızının tepesi):

| Klip | Süre | Darbe anı | Kullanım |
|---|---|---|---|
| Melee_Hook | 0,47 sn | **0,28 sn** | Kanca yumruk (Golem, Ayı) |
| Sword_Regular_A | 0,43 sn | **0,24 sn** | Yatay pençe savuruşu (Ayı, Yarasa) |
| Sword_Regular_B | 0,53 sn | **0,25 sn** | Ters savuruş (Ayı; A'nın bitiş duruşundan başlar) |
| Sword_Regular_C | 2,00 sn | **0,64 sn** | Geniş savuruş (yedek) |
| Zombie_Scratch | 1,80 sn | **0,58 sn** | Çift pençe tırmalama (Yarasa) |
| Agir_Ezme | 1,60 sn | **0,62 sn** | Sword_Heavy_Combo'nun 2,0–3,6 sn kesiti: iki elle tepeden ezme (Ayı yeteneği) |
| OverhandThrow | 1,33 sn | **0,36 sn** (bırakma) | Kaya Fırlat (Golem), Gölge Ok (Tilki), Kül Doğuşu (Anka) |
| Sword_Dash | 1,57 sn | **0,30 sn** | Hücum (yedek) |
| NinjaJump_Start / Land | 0,97 / 1,27 sn | sıçrama: klip sonu; iniş çömelmesi **0,18 sn** | Davul dansı (Kurbağa), Anka'nın alevden doğuşu |
| Hit_Knockback | 0,83 sn | — | İlk 0,2 sn'lik geri savrulma, ileri-geri, üste eklenen (güçlü darbe) |
| Idle_FoldArms_Loop, Idle_No_Loop, Yes | 2,50 sn | — | Golem beklemesi, ara hareket, zafer |

Not: Sword_Heavy_Combo (4,33 sn) dört vuruşludur; bütünü bir saldırı aralığına sığmaz, yalnız son ezme vuruşu kesit olarak kullanılır. Hit_Knockback 0,3 sn'den sonra yere düşer; bu yüzden yalnız ilk savrulma alınır.

**Saldırı hızı uyumu:** iki saldırı arası `1 / (as × hızÇarpanı)` saniyedir. Klip bu süreden uzunsa oynatma hızı `klipSüresi × as × hızÇarpanı` kadar artırılır (en az 1). Böylece klip bir sonraki vuruştan önce biter. Darbe anı da aynı oranda kısalır; önceden başlatma süresi buna göre hesaplanır.

**Yürüme hızı:** motor hızı 1,7 hücre/sn, Çevik soyunda 2,4. Walk_Loop oynatma hızı, ayakların kaymadığı değere sahnede ayarlanır (başlangıç: 1,0 ve Jog için 1,0); Çevik soyu Jog_Fwd_Loop kullanır.

## 3. İki ayaklılar (insan iskeleti, UAL'den hedeflenir)

| Yaratık | Normal saldırı | Darbe anı | Özel güç (yetenek) animasyonu | Efekt |
|---|---|---|---|---|
| Kaya Golemi | Punch_Cross / Melee_Hook | 0,30 / 0,28 sn | OverhandThrow + yordamsal çömelme, yerden kaya koparma (§7) | Göğüs kristali parlar, kaya mermisi, hedefte toz ve sersemleme yıldızları |
| Davulcu Kurbağa | Spell_Simple_Shoot (ses dalgası) | 0,04 sn | Idle_Loop + yordamsal dört göbek vuruşu, son vuruşta sıçrayıp iniş (§7) | Her vuruşta halka şeklinde ses dalgası; takımın üstünde turuncu güç aurası 4 sn |
| Sis Yarasası | Zombie_Scratch / Sword_Regular_A (pençe) | 0,58 / 0,24 sn | Zombie_Scratch (kavrama 0,58) + atılma, kanatla sarma, şişme (§7) | Hedeften yarasaya kızıl can akışı (çizgi parçacık) |
| Rüzgâr Ruhu | Spell_Simple_Shoot | 0,00 sn | Spell_Simple_Enter → Shoot + yordamsal tam tur dönüş, iki kol itme (§7) | Yaprak dolu küçük kasırga, düşmanları geri iter |
| Işık Kuğusu | Spell_Simple_Shoot | 0,00 sn | Spell_Simple_Enter → Idle_Loop 0,8 sn | Kanatlardan yükselen ışık tüyleri; dostlarda kalkan kabarcığı |
| Gece Ayısı | Melee_Hook / Sword_Regular_A / B | 0,28 / 0,24 / 0,25 sn | Agir_Ezme (tepeden ezme, 0,62 sn) + yordamsal kalkış ve ezme (§9) | Ayağın altındaki gölge yerde hedefe akar, hedefin altından mor pençe; lanet işareti (5 sn) |
| Anka | Spell_Simple_Shoot (ateş tüyü) | 0,04 sn | Idle_Loop + yordamsal kanat vuruşu ve havalanma (§9) | Kanat uçlarından göğe kor dalgası, hedefin üstünde kor bulutu, yağmur buluttan iner; ölünce küle dönüp NinjaJump_Land ile alevden doğuş |
| Ayaz Baykuşu | Spell_Simple_Shoot (buz kıymığı) | 0,00 sn | Idle_Loop + yordamsal tüy kabartma ve kanat çırpma (§9) | Kanat çırpışıyla ayak altından sahaya kırağı dalgası, düşmanlarda buz kaplaması |
| Gölge Tilki | Pistol_Aim → Pistol_Shoot (ok) | 0,03 sn | Pistol_Aim → Pistol_Shoot (yay germe, bırakma 0,03 sn) + derin nişan ve geri tepme (§9) | Hedefte mor nişan işareti; iki el arasından gölge oku, canı en düşük düşmana |
| Fırtına Ejderi | Spell_Simple_Shoot | 0,00 sn | Idle_Loop + yordamsal kollar ve baş göğe (§9) | Baştan göğe şimşek, ardından gökten 3 yıldırım; hedeflerde sersemleme |

Her iki ayaklı için ayrıca:
- **Bekleme:** Idle_Loop. Aynı türden birkaç yaratık senkron görünmesin diye her birinin başlangıç zamanı rastgele kaydırılır.
- **Vurulma:** Hit_Chest / Hit_Head sırayla, üste eklenen (additive) katmanda; güçlü darbede (yetenek ya da büyük vuruş, his gücü ≥ 0,7) UAL2 Hit_Knockback'in ilk savrulması. Yürüme ya da saldırı kesilmez.
- **Ölüm:** Death01. Yere çarpma anında toz efekti; 1,8 sn sonra 0,6 sn içinde erir.
- **Zafer:** savaş kazanılınca yaşayanlar Dance_Loop ya da Yes (yaratık tablosunda).
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
| Kristal Kurt (Uluma) | Nefes al (baş aşağı), yaslan, baş ~45° göğe, 0,6 sn tutar (§7) | Sırttaki kristaller parlar; yanındaki dostlarda mavi hız izleri |
| Dağ Koçu (Boynuz Öfkesi) | Toynakla iki eşeleme, kısa şahlanma, 0,36 sn'de yere vurur (§7) | Boynuz desenleri kızıl yanar; 3 vuruş boyunca buhar |
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

## 7. İmza yetenekleri (grup 1: Golem, Kurt, Kurbağa, Yarasa, Rüzgâr, Koç)

**Zamanlama kuralı.** Motor görüntünün 0,4 sn önünde koştuğu için yetenek olayı görüntüye en fazla 0,35–0,4 sn önce gelir; mana dolumu önceden bilinemez. Bu yüzden her yeteneğin hazırlığı bu bütçeye sığar. "Patlama anı", efektin çıkış anıdır (vfx `onSure`; mermisiz yeteneklerde motorun etki anı). Poz anahtar kareleri patlama anına göre yazılır. Kalan süre hazırlıktan kısaysa yalnız hazırlık kısmı sıkıştırılır, patlama karesi yine tam o ana düşer. Unity'de de aynısı geçerli: `SavasSahnesi` yetenek olayını aldığında `an = olayT − onSure − şimdi` hesaplar ve Animator'a hazırlık hızını `hazırlık / an` olarak verir.

Ortak yapı (tarayıcıda `hareket.js` `YET_POZ`, dört ayaklıda `DA`; `sahne3d.js` `YET_IMZA`, `yetenekHis`; `vfx.js` `HAZIR`):
- İki ayaklı poz kanalları: eğilme (rad, + öne), çömelme (boy oranı; diz bükülür, ayak yerde kalır; eksi değer sıçrama), ölçek nabzı, kök dönüşü (Y), kollar yana (+ dışa ve yukarı; gövdenin ileri ekseni çevresinde sol kol +, sağ kol −), kollar öne, sağ kol, baş. Not (2026-11-15 denetimi): kollar-yana kanalının işareti tersti, kanatları ve kolları gövdenin önünde çaprazlıyordu; düzeltildi. Hepsi klibin üstüne eklenir. Unity'de bunlar additive bir katman ya da LateUpdate'te kemik dönüşüdür.
- Hazırlık parlaması: gövde element renginde ışır, patlama anında en parlaktır, 0,35 sn sonra söner. Mevcut parlama uniform'u kullanılır, yeni malzeme gerekmez. Unity'de `_EmissionColor` × zarf.
- Soket: efekt kemikten çıkar (el, ağız, iki elin ortası; dört ayaklıda boyun zincirinin ucu). Unity'de `KahramanGorsel.yetenekSoketi` (Transform adı).

| Kahraman | Hazırlık (patlamadan önce) | Patlama (u = 0) | Toparlanma | Efekt ve his |
|---|---|---|---|---|
| Kaya Golemi (Kaya Fırlat) | Çömel (boyun %10'u), sağ el yere uzanır; yer çatlar, toprak fışkırır, kaya kopar ve el kemiğine bağlanıp başın üstüne kalkar. Göğüs turuncu parlar. | OverhandThrow bırakma karesi (0,36), gövde +0,34 rad öne. Kaya el soketinden ayrılır, 0,2 sn uçar (golem 1 hücreden atar; hazırlığa yer açmak için uçuş kısa). | 0,5 sn | İnişte toz şoku, çatlak, sarsıntı 0,25, hedefte 0,07 sn yerel duraklama; sersemlik yıldızları motor durumundan. |
| Kristal Kurt (Uluma) | 0–0,22 sn nefes: baş ve göğüs aşağı, sırttaki kristal zerreleri başa akar, gövde mavi parlar. | 0,32 sn: arkaya yaslan (arka pivot), ön ayaklar gerilir, baş ~45° göğe. Çene kemiği olmadığı için baş kemiğine ölçek nabzı (ağız açılması yerine). Ağızdan göğe yükselen halka konisi ve ışın. | 0,9 sn'ye dek titreyerek tut, 1,2'de bitir | Kurttan her dosta 0,1 sn arayla mavi bağ çizgisi ve dostta kısa parlama; kamera 0,55 sn hafif yaklaşır. |
| Davulcu Kurbağa (Savaş Davulu) | Kollar yana ve yukarı kalkar, gövde turuncu parlar. | Dört göbek vuruşu: u = 0 / 0,2 / 0,4 / 0,6. Her vuruşta kollar 0,08 sn kalkar, karna iner, gövde çöker, ölçek nabzı +%7. Her vuruş bir halka dalgasıyla eşleşir. Dördüncüden önce küçük sıçrama, inişte büyük halka. | 0,98 sn | Son vuruşta 0,05 sn yerel duraklama ve sarsıntı. Vuruş 2–4 için `yetenekAlt` ses olayı (ses.js'te karşılığı yoksa sessiz geçer). |
| Sis Yarasası (Can Emme) | Kanatlar arkaya açılır, gövde geri yaslanır, kızıl sis sızar; hedefe 0,35 hücre atılma başlar. | Zombie_Scratch kavrama karesi (0,58) patlamaya kilitli; hedefte kızıl kesik. | Emme 0,55 sn: klip kavrama karesinde tutulur (0,06 hızla akar; klibin 0,8–1,2 sn'deki yataya iniş kısmı oynamaz), atılmanın öne eğilmesi 0,04'e iner; kanatlar öne kapanıp sarar, gövde dik kalır ve nefes alır gibi +%9 şişer, can akışı ağız soketine akar; 0,62'de beklemeye döner, 0,3 sn'de geri sıçrar. | Ekran kenarında 0,45 sn hafif kızıl vinyet, kavramada 0,06 sn yerel duraklama (yarasa ve hedef). |
| Rüzgâr Ruhu (Kasırga) | Kollar yana açık, hızlanan tam tur (kök Y'de 360°); çevresinde yapraklar ve rüzgâr çizgileri daralarak toplanır. | Spell_Simple_Enter sonu (kollar ileri) mermi çıkışına kilitli; iki kol ileri itilir, gövde +0,26 rad öne. Rüzgâr darbesi iki avucun ortasından çıkar, 0,1 sn'de hedefe varır. | 0,45 sn | Kamera kasırga yönüne kısa tekme; itilen her düşmanın ayağı altında 0,35 sn sürtünme tozu (savrulma his.darbe'de). |
| Dağ Koçu (Boynuz Öfkesi) | Baş aşağı, sağ ön toynakla iki kez eşeleme (toz), burundan iki buhar, gövde kızıl parlar. | 0,29'da kısa şahlanma, baş yukarı savrulur; 0,36'da yere vurma (motorun etki anı): şok, toz, sarsıntı, yakındaki düşmanlar sarsılır. | 0,68 sn | Aura ve öfke durumu seyreltildi, gövde okunur. Güçlenmiş 3 vuruşta kızıl boynuz kesiği (güç 1,6), 0,05 sn yerel duraklama; başın üstünde kalan sayaç (×3, ×2, ×1). |

Unity için: Koç ile Bulut Atı artık ayrı stil kullanır (`ofke` / `sahlan`). Kurbağanın eski NinjaJump dizisi bırakıldı (davula vurmuyordu). Golem ve Rüzgâr'ın mermi uçuş süreleri kısaldı (0,45 → 0,2 ve 0,22 → 0,1). Bu sürelerin `KahramanGorsel` tablosunda da aynı olması gerekir, yoksa hazırlık 0,4 sn bütçesini aşar ve bırakma geç kalır.


## 8. İmza yetenekleri (grup 2: Yılan, Kaplumbağa, Semender, Bulut Atı, Kuğu)

Grup 1'deki zamanlama kuralı burada da geçerli. Dört ayaklılar ve yılan için de patlama karesi artık `an`'a kilitli: `hareket.js` `DA_AN` tablosu her stilin patlama karesini tutar, `yetZaman(t, an, P)` yetenek saatini stil saatine çevirir (kalan süre kısaysa hazırlık sıkışır, uzunsa poz dinlenmede bekler). Kurt (`ulu` 0,32) ve Koç (`ofke` 0,36) da bu yoldan geçer. Yeteneğin stili kahramanın görünümünden değil yetenek adından seçilir (`YET_STIL`); aynı görünümü kullanan canavarlar (Ana Akrep, Taş Kabuk, Gök Balinası) eski stillerinde kalır.

Dört ayaklıya iki yeni gövde kanalı eklendi: **uz** (gövde ileri yönde uzar, dikeyde basılır) ve **şiş** (gövde bütünüyle şişer); ikisi de zemin hizasındaki gövde merkezini pivot alır. Bir de **dönüş** (dikey eksende rad) ve **kuyruk** (yana kıvrılma) kanalı var. Unity'de bunlar kök nesnenin `localScale`/`localRotation`'ı ve kuyruk zincirine eklenen açıdır.

Mermi uçuşları hazırlık bütçesi için kısaldı: Zümrüt Zehri 0,36 → 0,14, Buz Nefesi 0,22 → 0,12, Bulut Hücumu 0,25 → 0,2. `KahramanGorsel` tablosunda da aynı olmalı.

| Kahraman | Hazırlık (patlamadan önce) | Patlama | Toparlanma | Efekt ve his |
|---|---|---|---|---|
| Zümrüt Yılan (Zümrüt Zehri) | Boyun S'ye kıvrılıp yükselir (taban +0,66 rad, uç −0,46), baş geri çekilir ve kalkar; ağız soketinde yeşil damla büyür, zehir damlar. Gövde yeşil parlar. | 0,36 (stil saati): baş ileri atılır (taban −0,62), gövde +0,15H öne. Mermi tam bu karede baş kemiğinden (ağız) çıkar, 0,14 sn'de varır; ağızda yeşil parlama, geri saçılan damlalar. | 0,55 sn: baş iki kez yana sallanır (yan kanalı, uca doğru artar). | Hedefte zehir gölü ve kabarcık (eski). En yaralı dosta yılanın ağzından 0,35 sn'lik yumuşak yeşil yay; yay değince iyileşme. |
| Buz Kaplumbağası (Buz Nefesi) | Baş kabuğa çekilir: boyun kıvrılır (+0,6), baş aşağı (−0,5), baş kemiği %18 küçülür (içeri çekilmiş okunur); kabuk 1,065 şişer. Ağızdan kırağı buharı, kabuğun üstünde kar taneleri, gövde mavi parlar. | 0,3: baş ileri fırlar (boyun −0,6, baş +0,38), baş nabzı +%16 (çene açılır), kabuk söner. Koni baş soketinden çıkar, ±0,45 genişlikte, yere sürtünen kırağı izi (4 dekal + küçük kristaller). Kamera 0,15 sn hafif titrer. | 0,45 sn titreyerek nefes, 1,02'de biter. | Hedefte kristal patlaması (eski) ve 1,2 sn yarı saydam buz kabuğu (`donKabuk` durumu: gövdeyi saran 7 dikey kristal, buz pusu). Kabuk sürerken motorun `sersem` yıldızları gösterilmez; bitince kabuk kırılır, buz parçaları saçılır. |
| Kor Semenderi (Kor Halkası) | Gövde yere yapışır, kuyruk kıvrılır (kuyruk +0,55), ters yöne kurulma (−0,45 rad). Sırttan korlar yükselir, gövde turuncu parlar. | Kuyruk önde hızlanan dönüş: 0,14 → 0,31 arası ~1,1 tur, son çeyreği 0,25'te (halkanın çıkışı). Dönerken kuyruk ucu kemiğinden yerde alev izi; halka kuyruk yarıçapından büyür. Halkada 0,05 sn yerel duraklama, sarsıntı 0,1. | 0,6 sn: ağzını yukarı açar (boyun +0,5, baş nabzı), yukarı küçük kor püskürtür. | Yerde alev dilleri (eski), dostlara iyileşme. |
| Bulut Atı (Bulut Hücumu) | 0,1 sn kısa şahlanma (0,4 rad, arka pivot), yeleden ve kanatlardan bulut buharı, ayak altında altın toz. Gövde beyaz-altın parlar. | 0,17: hücum başlar. Görüntü motor ışınlamasını beklemeden 0,2 sn'de A'dan B'ye çıkış3 eğrisiyle kayar (`sahne3d` `kaymaBaslat`; gövde hücum yönüne hızla döner). Gövde uzar (uz 0,15: ileri ×1,15, dikey ×0,92), ön bacaklar dörtnal pozunda toplanır. Hücum süresince atın gövde pozu yerel duraklamayla donmaz (gelen vuruşlar pozu kaymadan ayırmasın). Bulut izi gövdeye bağlı akar. 0,37 varış: boynuz öne savrulur (tosla). | 0,38 sn; ön ayaklarda fren tozu. | Varışta beyaz-altın boynuz kesiği, 0,08 sn yerel duraklama (at ve hedef), sarsıntı 0,2, kamera hedefe hafif yaklaşır. Koç artık ayrı (`ofke`). |
| Işık Kuğusu (Işık Kanadı) | Taban klip Idle_Loop (büyü tutuşu değil). Kanatlar gövdenin önünde kapanır (kolÖn +1,05), baş eğilir, hafif çömel; göğüs kemiğinde altın ışık birikir (zerreler göğse akar). | u = 0 çevresinde (0,12 sn) kanatlar iki yana tam açılır (kolYan +1,2, ön kol düz), gövde 0,08 boy yükselir. Kanat uçlarından (el kemikleri) yay çizen tüy dalgası. | 0,4 sn açık kanatla süzülme, 0,85'te biter. | Işık sütunu yarı alfa, yarı en, gövdenin arkasında; gövde parlaması küçük. Her dosta kuğunun göğsünden 0,06 sn arayla bir tüy uçar (0,24 sn); kalkan kabarcığı tüy değince açılır. Kuğunun kendisinde kabarcık yok. |


## 9. İmza yetenekleri (grup 3: Ayı, Anka, Baykuş, Tilki, Ejder)

§7'deki zamanlama kuralı burada da geçerli. Beşinin de normal saldırıdan ayrı bir yetenek gövdesi var: Baykuş, Anka ve Ejder artık Spell_Simple ya da OverhandThrow dizisini kullanmıyor. Taban klip Idle_Loop; hareket `YET_POZ`'dan gelir ve süre pozla belirlenir (`yetSure`). Tilki yay klibini kullanır: kurulma klibi (Pistol_Aim) patlamadan 0,04 sn önce biter, Pistol_Shoot'un bırakma karesi tam patlama anına düşer (`yetHazir`). Ayı Agir_Ezme'de kalır, ezme karesi patlama anına kilitlidir.

`YET_IMZA.bak`: hazırlık boyunca kahraman yetenek hedefine döner (Ayı en güçlü, Tilki en zayıf düşmana vurur; birimin o anki hedefi başka olabilir). `eller`: VFX iki el kemiğinden de çıkar (Anka ve Baykuşun kanat uçları).

Patlama anları (vfx `onSure`, olaydan önce): Kara Gölge 0,14 (ezme; gölge şeridi bu sürede hedefe akar), Kül Yağmuru 0,22 (kanat vuruşu; 0,09 sn'de kor bulutu, ilk kor olay anında yere değer), Ayaz 0 (dalga olay anında ayak altından çıkar), Gölge Oku 0,2 (bırakma; ok 0,2 sn uçar), Yıldırım 0,05 (baştan göğe şimşek; yıldırımlar olay anından başlayıp 0,09 sn arayla düşer). `KahramanGorsel` tablosunda da aynı olmalı.

| Kahraman | Hazırlık (patlamadan önce) | Patlama | Toparlanma | Efekt ve his |
|---|---|---|---|---|
| Gece Ayısı (Kara Gölge) | Agir_Ezme'nin kalkışı; üstüne geri yaslanma (−0,22 rad), gövde +%7 şişer, kollar başın üstüne. Ayağın altındaki gölge büyür ve morlaşır, kenarından kara duman yükselir, gözlerde iki mor parıltı (baş soketi). Gövde hafif mor parlar (0,18; ayı zaten mor). | Ezme karesi (0,62): gövde +0,36 rad öne, %11 çömelme. Önündeki yerde mor şok, çatlak, taş kırıntısı. Gölge yerde kara bir şerit olarak 0,14 sn'de hedefe akar (iz boyunca dekal ve duman; hedef uzaksa şerit mesafeyi taşır), hedefin altından dev mor pençe yükselir, üç kesik. | 0,5 sn | Ezmede ayıda 0,07 sn yerel duraklama ve sarsıntı 0,22; pençe çıkınca hedefte 0,07 sn duraklama. Lanet gözü ve gölge runu (eski). |
| Anka (Kül Yağmuru) | Çömelme (%12), kanatlar arkaya gerilir (kolÖn −0,75), sonra yukarı açılır (kolYan +1,3). Kanat uçlarından ve sırttan küçük alevler, gövde turuncu parlar (0,26). | u = 0..0,04 güçlü aşağı kanat vuruşu, gövde 0,24 boy havalanır; ayak altında hava dalgası. İki kanat ucundan göğe kor dalgası (0,09 sn) hedefin 3 birim üstünde bir kor bulutunda toplanır; bulut yağmur boyunca kızıl-kara duman. Korlar buluttan iner. | 0,85 sn'ye dek açık kanatla yavaşça süzülerek iner. | Kanat vuruşundan sonra kamera 0,9 sn hedefin üstüne hafifçe bakar. Yerde alev öbekleri, yanık izi, şok, sarsıntı. |
| Ayaz Baykuşu (Ayaz) | Tüyler kabarır (ölçek +%11), kanatlar yavaşça yana açılır (kolYan +1,35), baş kalkar; çevrede daralan kar halkası, gözler buz mavisi parlar (baş soketi). | u = 0: kanatlar sertçe aşağı (kolYan −0,35), gövde 0,1 boy kalkar. Kar iki kanat ucundan aşağı ve dışa savrulur; kırağı dalgası aynı karede ayak altından çıkar. | 0,55 sn: kanatlar katlanır, tüyler iner. | Dalga çıkışında 0,05 sn tam ekran duraklama ve 0,5 sn buzlu kenar vinyeti (hafifte soluk). |
| Gölge Tilki (Gölge Oku) | Pistol_Aim ama derin: gövde 0,15 rad geri, hafif çömel, sağ kol yukarı. İki elin ortasında (yay) mor gölge toplanır: büyüyen parıltı, ele akan kara zerreler. Hedefin üstünde mor nişan işareti (daralan halka, dönen yıldız) ve ayağının altında halka. | Pistol_Shoot bırakma karesi; güçlü geri tepme (−0,3 rad, kök −0,12 dönüş). Yaydan mor halka ve dikey ip ışığı; ok, ucunu izleyen kalın mor iz ve kara dumanla 0,2 sn uçar. | 0,4 sn | Varışta çapraz kesik ve hedefte 0,08 sn duraklama. Ok öldürürse 0,15 sn %60 zaman yavaşlaması (yalnız görüntü; ölüm olayı yetenek olayının ardındaki olaylardan okunur). |
| Fırtına Ejderi (Yıldırım) | Kollar ve baş göğe kalkar (kolÖn +2,3, baş +0,45), geri yaslanır. Başın üstünde dönen kara fırtına bulutu (içinde sarı çakmalar), gövdede sarı kıvılcımlar, baş soketinde büyüyen ışık. Gövde parlaması düşük (0,2): ejder sarı, güçlü parlama gövdeyi siliyordu. | u = 0: baştan göğe şimşek. Yıldırımlar u = 0,05 / 0,14 / 0,23'te düşer; her düşüşte omuzlar sarsılır (kısa öne çöküş ve ölçek nabzı). | 0,62 sn: kollar iner. | İlk yıldırımda 0,06 sn tam ekran duraklama ve 0,1 sn beyaz kenar parlaması (hafifte soluk). |

Unity için: Baykuşun normal saldırısı ile yeteneği artık farklı (Spell_Simple Shoot yalnız saldırıda). Tilkinin oku `golgeOk`'ta normal oktan küçük güçle çizilir (iz kalın, gövde ışını kısa), aksi hâlde yakın hedefte ışın hedefin çok ötesine taşıyor. Hata ayıklama için `sahne3d.yakinKamera(uid, uzak, aci, y, bakY)` kamera yüksekliği alır.


## Tempo: vuruş ağırlığı (2026-11-15)

- `sahne3d.js` `AGIRLIK` tablosu ve `GORSEL[id].agirlik`: ağır (golem, ayı, kaplumbağa, koç) · orta · çevik (kurt, bulut atı, yarasa, tilki).
  Kurulma: ağır 0,7 · orta 0,45 · çevik 0,25 sn (dört ayaklıda 0,6 / 0,4 / 0,25). Toparlanma hızı ağırda 0,85, ötekilerde 1,0 (eskiden 1,4).
  Darbe karesinde yerel duraklama: ağır 0,06, çevik 0,03 sn. Yakın atılma 0,2 birim (ağır 0,12, en az 0,25 sn).
- Klip hızlanma tavanı `KLIP_HIZ_TAVAN` 1,3: aralık yetmezse sıradaki vuruş klibin sonunu keser.
- Önden kurulma (`onKurulmaTahmin`): ONDE_SN 0,4 korunur. Anlığa birimin `cd` değeri yazılır (ALAN 16); birim menzilde bekliyorsa bir sonraki
  vuruş anı cd'nin azalma hızından tahmin edilir ve kurulma o kadar önce başlar, tutma pozunda bekler. Gerçek vuruş olayı (aynı hedef) gelince
  `onKurulmaOnayla` kurulmayı kaldığı yerden darbeye bağlar; gelmezse (hedef öldü, sersemledi, yetenek geldi) `onKurulmaIptal` bekleme pozuna döner.
  Dört ayaklıda `hareket.js` `d.sal` için `{darbe, on, onay, iptal, sonra}` seçenekleri. Motor değişmez, belirlenimcilik korunur.
- Unity: aynı tablo; saldırı zamanını önceden bilmek için motorun `Cd` değeri ve hız çarpanı okunabilir (motor kodu değişmeden).

## Bitiş ekranları (2026-11-15)
Web: `web/arayuz.js` (bölüm "BİTİŞ ANİMASYONLARI"), `web/index.html` (CSS "BİTİŞ EKRANLARI", SVG `s-kilic`/`s-kalkan`/`s-tac`/`s-kupa`),
`web/sahne3d.js` (`mvpGoster`, `mvpBitir`, `sarsinti`). Hepsi yalnız transform/opaklık; öğeler an başına bir kez kurulur.
Zamanlar savaş bittiği (sonuç bandının açıldığı) andan saniye. Unity: DOTween dizisi (Sequence) + Animator; eğriler parantezde.

| An | Olay | Zaman | Not |
|---|---|---|---|
| ZAFER | bant açılır | 0–0,28 | scaleY 0,05→1 (geri taşma 1,15) |
| | iki altın kılıç yanlardan dönerek gelir | 0–0,45 | ±46 vw → 0, dönüş ∓560°→∓42°, hızlanarak (0.5,0,0.85,0.45) |
| | **çarpışma**: kıvılcım (14 çizgi), ışık halkası, flaş, sarsıntı | 0,45 | halka 0,55 sn ölçek 0,12→1,7; ekran sarsıntısı 0,3 sn (DOM) + kamera 0,26/0,3 sn; **zafer sesi** |
| | kılıçlar geri teper, çapraz durur | 0,45–0,85 | ±12 px, ±33° → ±44° |
| | "ZAFER" ölçek yayıyla iner | 0,5–1,05 | 2,6 → 0,88 → 1,07 → 0,98 → 1 |
| | altın parıltı süpürür | 1,0–1,65 | renk soldurma (color-dodge) şerit, soldan sağa |
| | bilgi satırı + düğmeler | 1,05–1,4 | Devam 1,1 sn'ye kadar opaklık 0 ve basılamaz, sonra 0,2 sn belirir |
| YENİLGİ | kılıç tepeden düşer, saplanır | 0–0,35 | −70 vh → 0, hızlanarak; **yenilgi sesi 0,35** (dosyanın tepesi +0,2 sn = kırılma) |
| | kılıç ortadan kırılır, iki parça döne döne düşer | 0,45–1,2 | üst: (−70, +110) px, −60°; alt: (+60, +130) px, +55°; sönerek |
| | kırmızı-gri duman (6 küme) | 0,38–1,6 | 0,3 → 1,4–2,1 ölçek, 46 px yükselir |
| | "YENİLGİ" iner, sarsılır, çatlağı boyunca iki parça ayrılır | 0,5 / 0,8 / 0,8 | 1,7→1 ölçek 0,3 sn; ardından sarsıntı 0,38 sn (tek eğri, 0,5–1,18); parçalar ±2–3 px, ±0,7° |
| BERABERE | iki kalkan yanlardan çarpışır | 0–0,4 | **ses 0,4** (zafer sesi, hız 0,9); mavi şok halkası |
| | kalkanlar geri seker, yan yana durur | 0,4–0,85 | ±40 px, ±10° |
| SAVAŞ! | bant + iki küçük kılıç ortada çarpışır | 0–0,3 | **savaş başla sesi 0,3**; halka 0,4 sn |
| | kılıçlar bandın iki ucuna seker, "SAVAŞ!" yayla belirir | 0,3–0,5 | 2,2→0,9→1 ölçek |
| | tümü söner | 0,6–0,8 | toplam 0,8 sn, dokunmayı engellemez; yazı bandın tam ortasında |
| MAÇIN YILDIZI | açılış | 2,2 | yalnız öğretici/pencere/hasar özeti kapalıyken; sonuç bandı gizlenir |
| | kamera yakın planı | 2,2–3,1 | kadraj kamerasından yumuşak adımla (smoothstep) 0,9 sn; kahraman sağda, kameraya döner, zafer klibi + zıplama; arkasında element renginde ışın (açık silindir, kenarı ve tepesi sönük) ve zemin halkası |
| | kart soldan girer, şerit, portre | +0–0,5 | kart 0,5 sn yay; şerit 0,15'te; portre 0,2'de 0,4→1 |
| | hasar sayacı | +0,5–1,4 | 0 → hasar, kübik yavaşlayan |
| | yıldızlar (★ sayısı kadar) | +0,9, +1,05, +1,2 | 0 → 1 ölçek, −90° → 0 |
| | kapanış | dokununca ya da +4,2 sn | kart 0,3 sn söner, kamera 0,6 sn'de geri döner, sonuç bandı yeniden açılır |
| | yenilgide | | sade gri kart, ortada; kamera ve ışın yok |
| MAÇ SONU | amblem tepeden iner (1.: taç, 2.: gümüş kupa, 3.: bronz kupa, 4.+: kalkan) | 0–0,6 | −55 vh → 0, ezilip (1,08×0,9) zıplar |
| | halka + kıvılcım, arka ışınlar | 0,45–1,1 | ışınlar 14 sn'de bir tur döner |
| | sıra yazısı | 0,7–1,15 | 0,4 → 1 yay |
| | tören söner, maç sonu kartı açılır | 1,9–2,3 | dokununca hemen; şeridin sol madalyonunda aynı amblem |

- Telefon yatay (yükseklik ≤ 520 px): bant %59'da, kılıçlar 108 px ve başlığın 38 px üstünde çaprazlanır; YENİLGİ kılıcı 124 px,
  başlığın 34 px üstünde saplanır (uçlar skor şeridinin altında kalır). SAVAŞ! bandı telefonda %44'te (KUT HAZIR kutusunun üstünde).
- Katman: skor şeridi bitiş efektlerinin üstündedir; düşen kılıç ve genişleyen halka şeridin arkasından geçer. Unity: üst şerit Canvas
  sıralaması efekt Canvas'ının üstünde.
- Tek eğri kuralı: bir öğenin hem gelişi hem tepmesi/sekmesi tek animasyon (ara anahtar karelerde ayrı eğri). ZAFER kılıcı 0,85 sn
  (geliş %0–52,9, tepme %52,9–100), BERABERE kalkanı 0,85 sn (%0–47,1 / %47,1–100). Web'de iki ayrı transform animasyonu üst üste
  binince ikincisinin bekleme karesi birincisini eziyordu. Unity: tek DOTween Sequence, Append(geliş).Append(tepme).
- Gecikmeli başlayan halka ve kıvılcımlar başlangıçta görünmez (ilk anahtar karede opaklık 0, %2'de 1); çarpışma anına kadar ekranda yoklar.
- Başlık büyükten (2,6×) inerken kırpılmaz; parıltı şeridi yalnız kendi kabında (başlık kutusu) kırpılır.
  MVP kamerası en/boy > 1,9'da %11 daha uzak ve bakış 0,68×boy yükseklikte (başı üst şeridin altında kalmasın).
- Yükleme ekranında `renderer.compile` ile tüm görünür malzemeler + MVP ışını derlenir (yakın plan ilk kez görülen arka planı kadraja
  soktuğunda takılma olmasın). Unity: ShaderVariantCollection.WarmUp ile aynı iş.
- MVP seçimi: oyuncunun takımında en çok verilen hasar; eşitse en çok iyileştirme + kalkan. Kimse katkı yapmadıysa gösterilmez.
- Animasyonları azalt (Ayarlar; ayarlanmadıysa işletim sisteminin "hareketi azalt" tercihi): uçuş, sarsıntı, dönme, kamera geçişi yok;
  amblemler son duruşunda belirir, sesler hemen çalar, MVP 0,9 sn'de açılır ve kamera geçişsiz.
- Düğmeler: basınca ölçek 0,95 (0,09 sn), üzerine gelince parlama (opaklık 0,15 sn). Yazı tipi: başlık/düğme "Kut Baslik" (Lilita One + Türkçe harfler), gövde Nunito.

## Canlılık katmanları ve donuk kemik denetimi (2026-11-19)
Web: `web/hareket.js` (`canlilik`, `FID`, `DAVUL_P`; dört ayaklı ve yılanda "canlılık (boşta)" blokları), `web/sahne3d.js` (`GORSEL` `salStil`,
`fidget`, `onKolAci`; `Davul_Vur` klibi; `KADRAJ_PAY`), denetim `tools/kemik_denetim.cjs`. Hepsi klibin ÜSTÜNE eklenen küçük dünya-eksenli
dönüşler (additive); klip ezilmez. Unity: Animator'da ayrı "Additive" katman + `LateUpdate` içinde aynı açılarla kemik döndürme.

- **Donuk kol hatası (Kurbağa):** (1) `kolAci` (tombul gövdede kolları dışa açma) yanlış işaretle uygulanıyordu: kollar gövdeye gömülüyordu.
  En tombul Kurbağa'da iki kol ve tokmaklar göbeğin içinde, sağ kol sırtta kıpırtısız kalıyordu. İşaret düzeltildi (`_F` etrafında +açı
  sol kolu, −açı sağ kolu dışa açar); Kurbağa `kolAci` 0,45, ön kol oranı `onKolAci` 1,4 (portredeki gibi tokmaklar yanlarda aşağı).
  (2) Menzilli vuruşu Spell_Simple_Enter/Shoot idi: bu klipler sağ kolu tek pozda tutar (sağ kol genliği 8–10°, sol kol 77°); sürekli
  saldıran kurbağada sağ kol hep donuk görünüyordu. Yeni saldırı: `Davul_Vur` (Idle_Loop'un ilk 0,8 sn'si) + yordamsal iki tokmak:
  sol tokmak T−0,2 sn, sağ tokmak T'de (mermi çıkışı) davula iner; her vuruşta tokmak kalkar (0,15 sn) ve hızla iner (0,05 sn).
- **Tek kollu klipler** (ölçüldü, aktarılmış UAL): Spell_Simple_Enter/Shoot ve Yes sağ kolu tutar (≤10°), Idle_FoldArms_Loop iki kolu
  tümüyle tutar (0°), Idle_Loop kolları 4–6° oynatır. Çözüm: büyü atan kanatsızlarda (Rüzgâr, Baykuş, Ejder) tutan kol bırakmada ileri
  itilir (0,42 rad, e^(−8t) sönüm) ve tutarken hafif titrer; zaferde Yes klibinin sağ kolu zıplama temposunda (0,78 sn) havaya kalkar.
- **Boşta (ağırlık 1 − yürüme, saldırı/yetenek/zaferde söner):** göğüs iki yana yavaş salınır (0,13–0,2 Hz, ±0,035 rad; kalça dönmez,
  ayak kaymaz), baş gürültüyle etrafa bakar (±0,3 rad), kollar nefes fazında ileri-geri ve dışa (±0,06 rad; sol/sağ farklı faz).
  Her birimin fazı `ozet(faz)` ile farklı: birimler senkron durmaz.
- **Fidget** (yalnız sakin beklemede, 6–12 sn'de bir, kişiliğe göre sırayla): `bak` (baş ve göğüs önce bir yana, sonra öbürüne), `gerin`
  (kollar yukarı-yana, geriye yaslanma), `omuz` (Golem, Ayı: kolları pompalama), `kanat` (Kuğu, Anka, Yarasa: kanatları açıp silkme),
  `davul` (Kurbağa: havada dört vuruş), `silah` (Tilki: sağ eli kaldırıp bilek çevirme). Dört ayaklıda `kokla`, `silkin`, `kuyruk`;
  yılanda baş yükselip etrafa bakar.
- **Saldırı:** yakın dövüşte göğüs hazırlıkta −0,2 rad (sağ omuz geri) döner, darbede +0,16'ya savrulur, 0,35 sn'de toparlanır (mevcut
  eğilme + atılma ile birlikte). Menzilli tek kollu büyüde bırakma itişi (yukarıda). Vurulma yön bağımlıdır (his.darbe: vurulan yönden
  geri savrulma ve tepe eğilmesi), ölüm Death01 / devrilme + kor kenarlı çözülme + kül parçacıkları, zaferde zıplama + sevinç klibi.
- **İkincil zincir (yay-sönümleyici, f/ζ):** `hareket.js` `yayFZ(s, hedef, f, ζ, dt)` (örtük Euler; REFERANS_ANIMASYON 2.2). Dört ayaklı
  kuyruğu fazı gecikmeli zincir: her kemik bir öncekini yayla izler (ince kuyruk 3,0→1,8 Hz, ζ 0,45→0,30; kalın/sürüngen 2,0→1,2 Hz,
  ζ 0,55→0,40; ölümde ζ 0,8 ve kuyruk yere iner). Girdi: kökün yaw hızı (−ω·0,12, dönüşte kuyruk terse savrulur), boşta 0,36–0,44 Hz
  temel salınım (birime özgü faz), kuyruk fidget'ı ≈1,05 Hz, zafer ≈0,95 Hz (eski 2,4–2,5 Hz titreme kaldırıldı), adım fazı; uçta ±0,6 rad
  kırpılır. Kanatlılarda (Yarasa, Kuğu, Anka) boşta sürekli çırpma yok: katlı kanat nefesle 0,35 Hz ±3° açılıp kapanır, yürümede 1,8 Hz,
  çırpışta 2,8 Hz; kanat ucu (ön kol) kökü 2,2–3,5 Hz, ζ 0,6 yayla izler. Unity: `LateUpdate`'te aynı yay (kemik başına {x,v}).
- **Kamera:** taban kadraj tahta güvenli alana sığdırıldıktan sonra `KADRAJ_PAY` 1,12 kat geri çekilir (tahta ekranda ≈ %14 küçük, görüş ≈ %16 geniş; çevre arena,
  kemerler, kristaller görünür; tahta HUD dışında ve ortada kalır). Savaş içi kadraj yakınlaşması en çok 0,8 → 0,86, his.yakinlastir
  oranları ×0,85.
- **Denetim:** `node tools/kemik_denetim.cjs` (sunucu 8092'de): 16 kahraman gerçek sahne boru hattında savaşır; her kemiğin yerel dönüş
  genliği duruma göre (bekle, yuru, saldir, yetenek, ara, zafer) ölçülür. Büyük uzuv eşi oynarken < 1,5° kalırsa DONUK, eşinin %25'inden
  azsa ASİMETRİ yazar; DONUK varsa çıkış kodu 1. `--a kurbaga,golem` ile seçim, `--json` ile ham veri.
