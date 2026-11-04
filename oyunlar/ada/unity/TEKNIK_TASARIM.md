# Ada — Unity 6 URP teknik tasarım (v1)

> **Durum:** Bu depoda henüz Unity projesi yok. Buradaki C# kodları Unity 6 (6000.x), URP 17 ve Input System 1.x varsayımıyla yazıldı. **Derlenmedi ve cihazda test edilmedi.** İlk iş, kodları boş bir Unity 6 URP projesine koyup derleme hatalarını temizlemek olmalı. Bu belgedeki performans değerleri **öneri ve başlangıç değeridir**; ölçülen sonuçlar ayrıca "ölçüldü" diye işaretlenecek.

Kod: `Assets/Ada/Scripts/` (Unity projesindeki `Assets/` altına aynen kopyalanır).

---

## 1. Teknik riskler ve kararlar

| # | Risk | Karar |
|---|---|---|
| 1 | Duraklatma, reklam ve hit-stop farklı saatlerle çalışırsa yarış süresi, nefes ve fizik birbirinden kopar | Tek saat: `GameClock`, `Time.timeScale` üzerinden. Fizik sorguları, Animator (Update Mode: Normal), parçacıklar, `RaceTimer` ve `BreathSystem` aynı anda durur. UI ve geri sayım unscaled çalışır. |
| 2 | Kalkış karesindeki eski `Grounded` değeri, Land geçişini erken açar | Land geçişi yalnız `Land` tetikleyicisiyle açılır. Tetikleyiciyi motorun **onaylanmış** iniş olayı atar; kalkışta `ResetTrigger(Land)` yapılır. `Grounded` hiçbir geçişte koşul değildir, yalnız hata ayıklama içindir. |
| 3 | Nişan önizlemesi ile gerçek top farklı yere düşer | Tek hesap: `Ballistics` (1/60 sn sabit adım). Başlangıç noktası animasyonlu el değil, sabit `ThrowOrigin`. Rüzgâr ve ayarlar atış anında dondurulur. |
| 4 | Çift top üretimi ya da kilitlenen atış | `pendingId` + `released` bayrağı. Bırakmadan önce kesilen animasyon `ThrowStateGuard.OnStateExit` ile atışı iptal eder. Bırakma olayı gelmezse `releaseTimeout` (1,2 sn) atışı temizler. |
| 5 | Boy farkı avantaj yaratır | Zıplama süresi, tepe yüksekliği, iniş noktası ve tamponu `PlayerMotor` sabitleridir, karakterden bağımsızdır. Kamera odağı karakter boyuna bağlı değil, sabit yüksekliktedir. Ayak kayması yalnız animasyon oynatma hızıyla düzeltilir (`MoveAnimSpeed`, `strideScale`). |
| 6 | Su altındaki karakter görünmez | v1 su yarı saydam: sığda daha saydam. Dalış alanı sığ (≤1,5 m) ve açık renkli zeminli. Dalış kamerası yüzeyin altına inince sis, turkuaz örtü ve suyun alt yüz rengi devreye girer (bkz. §5). |
| 7 | Depth/Opaque Texture gereksiz açılıp GPU maliyeti getirir | v1 suda Scene Depth ve Scene Color kullanılmaz. Derinlik ve köpük maskesi vertex renginden gelir, iki doku da kapalı kalabilir. |
| 8 | Yapay zekâ ile üretilmiş mesh: dağınık topoloji, omuz ve dirsek deformasyonu | Önce ölç, sonra karar ver: üçgen sayısı, draw call, deformasyon görüntüsü. Gerekirse yeniden topoloji ya da LOD. Kontrol pozları: Run, Throw, Swim. |
| 9 | AdMob geri çağrıları ana iş parçacığında gelmez | `MobileAds.RaiseAdEventsOnUnityMainThread = true`. Reklam açılınca `GameClock.Pause(Ad)`, kapanınca `ResumeCountdown.OnAdClosed()`. Reklam yüklenmezse akış beklemez. |
| 10 | Kare zamanlaması: 120 Hz ekran, Android titreme | `Application.targetFrameRate = 60`, `QualitySettings.vSyncCount = 0`. Android'de Player Settings → Optimized Frame Pacing açık. |
| 11 | UI'ye dokunuş oyuna geçer | `TouchInput`, dokunuş başlangıcında `EventSystem.RaycastAll` ile UI üstünü eler. |

**Varsayımlar** (engelleyici değil, sonra değiştirilebilir):
- Kontrol noktası, son doğru basılan sıra.
- Kaydırma eşlemesi mutlak: sol-yukarı = sol, yukarı = orta, sağ-yukarı = sağ. Dokunmada doğrudan platform seçilir.
- Ezber adımı 0,6 sn.
- Ceza süreleri: yanlış platform +4 sn, Fener +6 sn, ıska +3 sn, nefes biterse +5 sn, jeton alınmazsa +5 sn.
- Süre ilk zıplamada başlar, bitiş noktasında durur.

---

## 2. Mimari

### Sahne hiyerarşisi

```
GameSystems             GameClock, ResumeCountdown (+ UI overlay), RaceTimer, TouchInput
PlayerRoot              PlayerMotor, PlayerAnimatorBridge, VisualSquash, SwimTilt, ThrowController, BreathSystem
  CameraTarget          (kamera odağı; karakter boyundan bağımsız)
  ThrowOrigin           (bırakma karesindeki el konumuna hizalı sabit nokta)
  VisualRoot            (yerel konum 0 = ayak tabanı; ölçek ve eğim yalnız burada)
    Character           Animator, AnimationEventRelay
      Rig … RightHand
        HandSocket
      Mesh              SkinnedMeshRenderer (tek, opak malzeme)
CameraRig               Camera, CameraRig
Bridge                  BridgeController
  Platform_S1_K0 …      BridgePlatform + BoxCollider (Layer: Platform)
ThrowStand              ThrowCourse
  Target_0 …            TargetBoard + collider (Layer: Target)
DivePool                DiveController, Token, Exit
LevelFlow               LevelFlow
```

### Hareket yöntemi: kod tarafından sürülen kinematik Transform

Oyuncunun konumunu yalnız `PlayerMotor` değiştirir. Rigidbody ve CharacterController kullanılmaz. Gerekçeler:

- **Köprüde hareket ayrık.** Platformdan platforma sabit süreli parabol var. Kalkışta hedef kesinleşir; fizik çözücüye bırakmak sapma, zıplama ya da takılma riski getirir ve adaleti bozar.
- **İki karakter aynı yörüngeyi izlemeli.** Bu yalnız analitik hareketle garanti edilir: süre, yükseklik ve iniş noktası aynı.
- **Çarpışmaya ihtiyaç yok.** Doğru ya da yanlış kararı veriyle alınır (desen dizisi), temas olayıyla değil. Fizik yalnız sorgu için kullanılır: dokunma raycast'i ve top spherecast'i.
- **Su hareketi** de motor üzerinden geçer (`SwimMove`). Dalış denetleyicisi hız verir, konumu motor uygular. Böylece tek sahiplik kuralı korunur.

### Veri sahipliği

Animator yalnız görselleştirir; aşağıdaki hiçbir bilgi Animator'da tutulmaz.

| Bilgi | Sahibi |
|---|---|
| Doğru platform deseni, kontrol noktası, mevcut sıra | `BridgeController` |
| Süre ve ceza | `RaceTimer` |
| Nefes | `BreathSystem` |
| Hedef sırası ve isabet doğruluğu | `ThrowCourse` |
| Bekleyen atış, bırakıldı mı | `ThrowController` |
| Konum, zıplama, su durumu | `PlayerMotor` |
| Duraklatma nedenleri | `GameClock` |

### Akış (`LevelFlow`, ilk sürüm)

Köprü (ezber → geçiş) → atış standına koşu → `Aim` kamerası → hedef dizisi → havuz kenarı → suya zıplama → `Dive` kamerası → dalış ve jeton → çıkış → bitişe koşu → `Finish` kamerası ve Victory → sonuç.

---

## 3. Animator

Tek katman (Base). Root motion kapalı (`PlayerAnimatorBridge.Awake`). Projede `OnAnimatorMove` tanımlanmaz. Tüm geçişlerde **Fixed Duration açık**. Normal akışta **Any State geçişi yok**.

### Parametreler

| Parametre | Tür | Kaynak | Not |
|---|---|---|---|
| `Speed` | float 0–1 | `motor.LocomotionBlend` | Locomotion blend: 0 Idle, 0,5 Run, 1 Sprint |
| `MoveAnimSpeed` | float 0,6–1,6 | gerçek hız ÷ klip hızı | Locomotion durumunun Speed Multiplier'ı (ayak kayması) |
| `Grounded` | bool | motor | Yalnız hata ayıklama, geçiş koşulu DEĞİL |
| `Jump` | trigger | `motor.TookOff` | Kalkışta `Land` sıfırlanır |
| `Land` | trigger | `motor.Landed` (onaylı iniş) | |
| `Fall` | trigger | `motor.FallStarted` | Yanlış platform düşüşü |
| `Roll` | trigger | oyun | İsteğe bağlı |
| `InWater` | bool | motor | |
| `Diving` | bool | motor | |
| `SwimSpeed` | float 0–1 | motor | Swim blend |
| `Aiming` | bool | `ThrowController` | |
| `Throw` | trigger | `ThrowController` | İptalde `ResetTrigger` |
| `Victory` | trigger | `LevelFlow` | |

### Durumlar ve klipler (Quaternius UAL, CC0)

| Durum | Klip | Not |
|---|---|---|
| Locomotion (1D blend, `Speed`) | Idle_Loop / Jog_Fwd_Loop / Sprint_Loop | Eşikler 0 / 0,5 / 1. Speed Multiplier = `MoveAnimSpeed` |
| JumpStart | Jump_Start | |
| JumpAir | Jump_Loop | Yanlış platform düşüşünde de kullanılır |
| Land | Jump_Land | Kısa; kontrolü kilitlemez (aşağıda Land → JumpStart) |
| Roll | Roll | |
| WaterEnter | **eksik** → Jump_Loop sonu + Swim_Idle_Loop harmanı | İleride özel suya giriş klibi |
| Swim (1D blend, `SwimSpeed`) | Swim_Idle_Loop / Swim_Fwd_Loop | |
| DiveEnter / DiveLoop / Surface | **eksik** → Swim_Fwd_Loop + `SwimTilt` (VisualRoot eğimi) | Özel dalış klipleri eksik |
| Aim | **eksik** → Idle_Loop | İleride nişan duruşu |
| Throw | OverhandThrow | Bırakma karesine `ThrowRelease` olayı; duruma `ThrowStateGuard` eklenir |
| Recover | OverhandThrow kuyruğu (klip içe aktarmada ayrı aralık) | |
| Victory | Dance_Loop veya Yes | |

### Geçişler

| Kaynak → Hedef | Koşul | Has Exit Time | Süre (sn, fixed) |
|---|---|---|---|
| Locomotion → JumpStart | `Jump` | Kapalı | 0,05 (0,04–0,07) |
| JumpStart → JumpAir | — | Açık, exit ≈ 0,85 | 0,05 (0,04–0,06) |
| JumpStart → Land | `Land` | Kapalı | 0,04 (kısa zıplamada JumpAir atlanır) |
| JumpAir → Land | `Land` | Kapalı | 0,05 (0,03–0,06) |
| Land → Locomotion | — | Açık, exit ≈ 0,5 | 0,08 (0,06–0,10) |
| Land → JumpStart | `Jump` | Kapalı | 0,05 (tamponlu komut inişi beklemez) |
| Locomotion → JumpAir | `Fall` | Kapalı | 0,08 |
| Land → JumpAir | `Fall` | Kapalı | 0,06 |
| JumpAir → WaterEnter | `InWater` = true | Kapalı | 0,08 |
| WaterEnter → Swim | — | Açık | 0,15 |
| Swim → DiveEnter | `Diving` = true | Kapalı | 0,10 |
| DiveEnter → DiveLoop | — | Açık | 0,10 |
| DiveLoop → Surface | `Diving` = false | Kapalı | 0,12 |
| Surface → Swim | — | Açık | 0,15 |
| Swim → Locomotion | `InWater` = false | Kapalı | 0,15 |
| Locomotion → Roll | `Roll` | Kapalı | 0,06 |
| Roll → Locomotion | — | Açık, exit ≈ 0,85 | 0,10 |
| Locomotion → Aim | `Aiming` = true | Kapalı | 0,15 |
| Aim → Throw | `Throw` | Kapalı | 0,05 |
| Throw → Recover | — | Açık, bırakmadan sonra (≈ 0,7) | 0,08 |
| Recover → Aim | — | Açık | 0,10 |
| Aim → Locomotion | `Aiming` = false | Kapalı | 0,20 |
| Aim / Recover → Victory | `Victory` | Kapalı | 0,15 |

- **Kesinti ayarları:** zıplama zincirinde Interruption Source = None. Tek istisna Land → JumpStart'tır.
- **İniş tamponu:** `BridgeController` iniş tamponunu yönetir. İnişten 130 ms önceye kadar gelen komut inişte uygulanır, daha erkeni atılır.

### Humanoid içe aktarma (iki karakter)

- **Rig:** Humanoid. Her karakterin kendi Avatar'ı olur; animasyon klipleri UAL Unity FBX'ten gelir.
- **Model:**
  - Skin Weights: 4 Bones.
  - Blend Shapes: kullanılmıyorsa kapalı.
  - Optimize Game Objects açık, Extra Transforms to Expose içinde `RightHand` (HandSocket için).
- **Klipler:**
  - Loop Time açık (döngüler).
  - Root Transform Rotation/Position (Y) "Bake Into Pose" açık. Root motion kapalı olduğu için kök kayması görsele taşınmaz.
- **Kontroller:**
  - **Ayak kayması:** Run/Sprint'te `runClipSpeed` ve `sprintClipSpeed` değerlerine klibin Average Velocity'sini girin. Deniz için `strideScale` ≈ 0,92.
  - **Dizler:** Land klibinde diz içe kaçıyorsa Avatar → Muscles → Leg Twist ayarı.
  - **Eller:** HandSocket konumu iki karakterde ayrı ayarlanır (avuç ortası). Atışta topun ele oturduğu görsel olarak kontrol edilir.
  - **Foot IK:** Locomotion ve Land durumlarında açık; yüzme durumlarında kapalı.

---

## 4. Atış sistemi

- İlk sürümde tam vücut atış animasyonu kullanılır, karakter sabit durur.
- İleride hareket ederek atış gerekirse: üst gövde Avatar Mask'i + Override katmanında Throw; alt gövde Locomotion'da kalır.
- **Akış:**
  1. **Sürükleme:** Yukarı sürükleme nişan alır. Yön sürükleme açısından gelir (±25°), güç sürükleme uzunluğundan (7–15 m/sn), eğim sabittir (28°).
  2. **Önizleme:** `Ballistics.Predict` ile çizilir: `LineRenderer`, en fazla 90 nokta.
  3. **Bırakma:** Parmak kalkınca `pendingId` atanır, rüzgâr ve ayarlar dondurulur, `Throw` tetiklenir.
  4. **Animation Event:** Klipteki `ThrowRelease` olayı → `AnimationEventRelay` → `ThrowController.OnReleaseEvent()`. Top HandSocket'ten ayrılır ve `ThrowOrigin`'den aynı hız ve ayarlarla fırlatılır.
  5. **Tek kaynak:** `Released` olayı ses, parçacık ve kamera tepkisinin tek kaynağıdır.
- **Çift top yok:** `pendingId < 0` ya da `released` ise olay yok sayılır.
- **İptal:** Bırakmadan önce Throw durumundan çıkılırsa `ThrowStateGuard` atışı iptal eder. Olay hiç gelmezse 1,2 sn zaman aşımı devreye girer.
- **Havuz:** `UnityEngine.Pool.ObjectPool<Ball>` kullanılır, en fazla 8 top. Efektler için de aynı yaklaşım uygulanır.
- **Rüzgâr:** Değişken olacaksa nişan sırasında da `settings.wind` güncellenir ve önizleme aynı değeri kullanır. Atış anında dondurulur.
- **`ThrowOrigin` hizalaması:** Throw klibini bırakma karesinde durdurun. `ThrowOrigin`'i sağ elin o karedeki dünya konumuna koyun. İki karakter için ayrı ayrı yapılır.

---

## 5. Su (Shader Graph) ve URP

### v1 su grafiği: Universal → Lit

**Graph Settings:**
- Surface: Transparent; Blending: Alpha.
- Render Face: Both.
- Depth Write: Off.
- Receive Shadows: kapalı (maliyet).
- Workflow: Metallic.

**Özellikler:**
- `ShallowColor` (#7FE0E6), `DeepColor` (#1C8FB0), `UndersideColor` (#2AA6B8)
- `FoamColor` (beyaz)
- `ShallowAlpha` 0,55, `DeepAlpha` 0,85
- `NormalMap` (küçük dalga normal haritası), `NormalTiling` 6, `NormalStrength` 0,35
- `Speed1` (0,03, 0,02), `Speed2` (−0,02, 0,035)
- `FresnelPower` 4, `HorizonColor` (#BFEFF2)
- `FoamNoiseScale` 18, `FoamThreshold` 0,55
- `Smoothness` 0,92

**Mesh vertex rengi** (Blender'da boyanır):
- **R** = derinlik: 0 sığ, 1 derin.
- **G** = köpük maskesi: kıyı şeridi ve platform ayaklarının çevresi.

**Düğüm zinciri:**
1. **Renk:** `Vertex Color.R` → `Lerp(ShallowColor, DeepColor, R)` → A.
2. **Normal:**
   - `UV0 × NormalTiling` → `Tiling And Offset(offset = Time × Speed1)` → `Sample Texture 2D (Type: Normal)` → N1.
   - Aynısını `Speed2` ile ve tiling × 1,37 ile yap → N2.
   - `Normal Blend(N1, N2)` → `Normal Strength(NormalStrength)` → **Normal (Tangent)**.
3. **Fresnel:** `Fresnel Effect(Normal = yukarıdaki normal, Power = FresnelPower)` → `Lerp(A, HorizonColor, Fresnel × 0,6)` → B.
4. **Köpük:**
   - `UV0 × FoamNoiseScale` + `Time × 0,05` → `Gradient Noise`.
   - `Step(FoamThreshold, Noise × Vertex Color.G + Vertex Color.G × 0,6)` → F.
   - `Lerp(B, FoamColor, F)` → C.
5. **Alt yüz:** `Is Front Face` → `Branch(True = C, False = UndersideColor)` → **Base Color**.
6. **Alfa:** `Lerp(ShallowAlpha, DeepAlpha, R)` → `Maximum(·, F)` → `Branch(Is Front Face, ·, 0,6)` → **Alpha**.
7. **Kalan çıkışlar:** Smoothness → `Smoothness` (köpükte `Lerp(Smoothness, 0,2, F)`). Metallic 0.
8. **Güneş parıltısı ve yansıma:** Güneş parıltısı Lit'in ana ışık speküleriyle gelir. Yansıma için lagüne bir **baked Reflection Probe** (statik cubemap) konur.

Bu sürümde Scene Color ve Scene Depth düğümü yok; **Opaque Texture ve Depth Texture gerekmez**.

**İleride gerekirse:**
- **Derinlikle köpük** (`Scene Depth`): URP Asset → **Depth Texture açık**. Saydam su, derinlik dokusu hazırlandıktan sonra çizilir (opaklar ve skybox'tan sonra). Sırayı Frame Debugger'da doğrulayın.
- **Kırılma** (`Scene Color`): **Opaque Texture açık**. Bu ek kopya maliyeti getirir, mobilde ölçülmeden açılmaz.

### Dalış görünürlüğü

- **Yüzeyden bakış:** Sığ alan ShallowAlpha ≈ 0,55 olduğu için dalan karakter görünür. Dalış havuzu sığ (≤1,5 m) ve açık kum zeminlidir. Tamamen opak su karakteri örter; bu yüzden kullanılmaz.
- **Dalış kamerası (`Dive` profili):** Kamera su yüzeyinin altına inince `CameraRig`:
  - üstel sisi açar (turkuaz, yoğunluk ≈ 0,12),
  - tam ekran turkuaz örtüyü (%15–25) gösterir.
  Su yüzeyinin alt tarafı `UndersideColor` ile görünür. Kamera yüzeyin üstüne çıkınca her şey eski haline döner.
- **Overdraw:** Su, köpük, sıçrama ve UI üst üste biner. Scene görünümünde Overdraw modu, Frame Debugger, Android GPU Inspector ve Xcode GPU Capture ile ölçülür. Sıçrama parçacıkları küçük ve az tutulur.

### Başlangıç URP profili (cihazda ölçülecek, reçete değil)

- **Render yolu:** Forward. Ana ışık 1 (yönlü). Ek ışıklar: Disabled ya da Per Vertex.
- **Gölge:** Shadow distance 25 m, 1 cascade. Soft shadows kapalı, gölge çözünürlüğü 1024.
- **Işıklandırma:** Statik çevre baked lightmap + Light Probes; karakter dinamik.
- **Kapalı olanlar:** HDR, SSAO, Depth of Field, Motion Blur, Bloom.
- **Kenar yumuşatma:** MSAA 2×.
- **Render Scale:** 1,0 ile başla. GPU sınırdaysa 0,85 ile karşılaştır.
- **Dokular:** Depth Texture ve Opaque Texture kapalı (§5 v1).

### Dokular

- **Sıkıştırma:** Android ve iOS'ta ASTC. Karakter rengi için 6×6, UI için 4×4. Eski Android yedeği ETC2.
- **1K ya da 2K:** Oyun kamerasında karakter ekran yüksekliğinin ~%25–30'u. 1K ile 2K aynı karede yan yana karşılaştırılır; fark görünmüyorsa 1K seçilir.

---

## 6. Kamera

Script tabanlı `CameraRig`; Cinemachine kullanılmıyor. Tek yumuşatma vardır: `SmoothDamp`.

İleride Cinemachine 3'e geçilirse script yumuşatması kaldırılır, yalnız Cinemachine bileşenlerinin damping'i kullanılır. Cinemachine 2 ve 3 örnekleri karıştırılmaz.

| Profil | Bakış açısı | FOV | Mesafe | Yumuşatma | Yanal kilit | Yükseklik | Önden bakış |
|---|---|---|---|---|---|---|---|
| Bridge | 55° | 50° | 9 m | 0,14 sn | Açık (sütun merkezi x=0) | Sabit 0,55 (zıplamayı izlemez) | 2,5 m |
| Aim | 22° | 45° | 5,5 m | 0,20 sn | Kapalı | Sabit | 4 m |
| Dive | 15° | 55° | 6 m | 0,18 sn | Kapalı | Oyuncuyu izler | 1 m, `underwaterEffects` açık |
| Finish | 25° | 45° | 6,5 m | 0,25 sn | Kapalı | Sabit | 0 |

**Bridge profili:**
- Karakter ekranın alt üçte birinde kalır.
- Üç sütun ve sonraki en az iki sıra görünür.
- Ezber ve oynanış aynı profili kullanır: açı ve FOV değişmez.

**Aim profili:** Karakter platforma yerleştikten sonra 0,5 sn'lik geçişle başlar. Nişan sırasında kadraj sabit kalır.

---

## 7. Oyun hissi (game feel)

| Olay | Değer |
|---|---|
| Kalkış | VisualRoot ölçeği (0,976; 1,05; 0,976) |
| İniş | (1,03; 0,94; 1,03); 110 ms'de normale döner (80–140) |
| Ayak tabanı | VisualRoot pivotu ayakta olduğu için zeminde kalır |
| Normal iniş | Kısa ses + küçük toz; **kamera sarsıntısı yok** |
| Sarsıntı yok | Ezber sırasında, hassas zıplamada, nişanda |
| Son hedef isabeti | Hit-stop 40 ms (30–50). `GameClock` ile fizik, süre ve nefes de durur |
| Final sarsıntısı | 100 ms (80–120), ekran yüksekliğinin %0,25'i (0,15–0,35) |
| Efekt birikmesi | Aynı anda en fazla bir sarsıntı. Parçacık havuzları sabit boyutlu |
| Arka plan ve reklam | Oyun durur. Dönüşte basılı girdiler temizlenir, 3-2-1 geri sayımla devam edilir |

---

## 8. Doğrulama

- **Kare hızı ayarı:** `Application.targetFrameRate = 60; QualitySettings.vSyncCount = 0;` (açılış betiğinde).
- **Kare bütçesi:** 60 FPS için 16,7 ms. CPU ve GPU ayrı ölçülür, toplanmaz. İlk hedef ikisinde de ~12–13 ms altı; aradaki pay ısınma için.
- **Araçlar:**
  - Unity Profiler (Development Build, cihaz)
  - Android GPU Inspector ya da Snapdragon Profiler
  - Xcode Instruments / GPU Frame Capture
  - Frame Debugger (render sırası)
- **Senaryolar** (her biri 10–15 dk, gerçek Android ve iOS cihaz):
  1. Su ekranın tamamını kaplarken.
  2. İki karakter görünürken.
  3. Final efektleri sırasında.
  4. Reklamdan dönüşte.
  5. Uygulama arka plana alınıp geri getirilince.
- **Kayıt:** cihaz modeli, ortalama ve %1 kötü kare süresi, CPU/GPU ms, sıcaklık ve kısma (throttling) gözlemi.
- **Editor FPS'si kanıt sayılmaz.** Three.js prototipi yalnız kontrol eşikleri, ezber süresi ve UI akışı için ölçüttür.

---

## 9. Yol haritası (her adım oynanabilir)

| Adım | Kapsam | Kabul ölçütü |
|---|---|---|
| **M1 Köprü** (graybox) | Boş URP projesi, Input System, scriptler derlenir. Ortam `ortam_uclu_kopru` (FBX/glTF). Kapsül karakter. Ezber, zıplama, yanlış → düşüş → kontrol noktası. Süre ve ceza. Bridge kamerası | Telefonda 5 sıra baştan sona oynanır. Tamponlu komut çalışır. Yanlışta kilitlenme olmaz. Arka plana alıp dönünce sayımla devam edilir |
| **M2 Atış** | Atış standı, 3 hedef, sürükle-nişan, önizleme, Throw olayı, havuz, sıra ve ceza, Aim kamerası | Önizleme ile gerçek iniş noktası aynı (10 atışta görsel olarak çakışır). Çift top yok. İptal edilen atış kilitlemez |
| **M3 Su** | Havuz, suya zıplama, basılı tut = dal, nefes UI, jeton, çıkış, Dive kamerası, sis ve örtü | Nefes biterse zorla yüzeye çıkılır ve ceza yazılır. Duraklatmada nefes azalmaz |
| **M4 Görsel** | Kerem/Deniz modelleri, Humanoid Avatar, tam Animator, su grafiği, his değerleri, prototipteki UI'nin Unity'ye aktarılması | İki karakter aynı sürede bitirir (aynı girdiyle). Ayak kayması kabul edilir düzeyde. İniş hissi prototiple eş |
| **M5 Cihaz** | Profil ölçümleri, URP ayarları, doku karşılaştırması, gerekirse LOD (12–20k), AdMob | Hedef cihazlarda ölçülmüş 60 FPS, 15 dk testte belirgin kısma yok |

---

## 10. Inspector kurulumu

### Proje
- **Paketler:** Input System (Active Input Handling: *Input System Package* ya da *Both*). URP. TextMeshPro (Unity 6'da uGUI ile gelir).
- **Katmanlar:** `Platform`, `Target`.
- **Fizik:** Physics → Queries Hit Triggers kapalı (kod zaten belirtiyor).

### Bileşen bağlantıları

**GameSystems**
- `GameClock`: yalnız eklenir.
- `RaceTimer`: yalnız eklenir.
- `TouchInput`: eşikler varsayılan.
- `ResumeCountdown`: `overlay` (tam ekran panel), `label` (TMP_Text), `input` (TouchInput).

**PlayerRoot**
- `PlayerMotor`: zıplama 0,42 sn / 0,9 m, `waterSurfaceY` = su düzlemi Y'si.
- `PlayerAnimatorBridge`: `motor`, `animator` (Character), `runClipSpeed` / `sprintClipSpeed` (klip Average Velocity), `strideScale`.
- `VisualSquash`: `motor`, `visualRoot`.
- `SwimTilt`: `motor`, `visualRoot`.
- `BreathSystem`: kapasite 6 sn.
- `ThrowController`:
  - `input`, `anim`
  - `handSocket` (RightHand çocuğu), `throwOrigin` (PlayerRoot çocuğu)
  - `aimReference` = PlayerRoot
  - `ballPrefab` (Ball bileşenli küre, collider yok)
  - `preview` (LineRenderer, World Space, genişlik 0,05)
  - `hitMask` = Target + Default (zemin)

**Character** (Animator nesnesi)
- `AnimationEventRelay`: `throwController`.
- OverhandThrow klibine `ThrowRelease` olayı.
- Animator'daki Throw durumuna `ThrowStateGuard`.

**Bridge**
- `BridgeController`:
  - `rows`: 5 sıra × 3 platform, alttan üste. Ortamdaki adlar `Platform_S<sıra>_K<sütun>`.
  - `startPoint` (iskele ucu, forward = parkur yönü), `finishPoint`
  - `motor`, `input`, `cam`
  - `platformMask` = Platform
  - `timer`
- Her platformda `BridgePlatform`: `glowRenderer` (Emission açık malzeme), isteğe bağlı `landingPoint`, `leftHalf` / `rightHalf`.

**ThrowStand**
- `ThrowCourse`: `targets`, `thrower`, `timer`, `sequenceLength` 3.
- Her hedefte `TargetBoard`: `pivot` (alt kenar), `highlight`.

**DivePool**
- `DiveController`: `motor`, `input`, `breath`, `timer`, `exitPoint`, `token`, `bottomRootY`.

**CameraRig**
- `cam`, `target` (PlayerRoot/CameraTarget), `courseFrame` (= Bridge startPoint).
- `profiles`: 4 profil, değerler §6.
- `underwaterTint`: tam ekran Image'lı CanvasGroup.

**LevelFlow**
- Tüm referanslar.
- Noktalar: `throwStand`, `diveJumpFrom` (havuz kenarı), `diveEntry` (su yüzeyi), `finishSpot`.

### AdMob (eklenti kurulunca; Google Mobile Ads Unity, ücretsiz)

```csharp
// Başlangıçta bir kez:
GoogleMobileAds.Api.MobileAds.RaiseAdEventsOnUnityMainThread = true;
// Geçiş ya da ödüllü reklam nesnesi için:
ad.OnAdFullScreenContentOpened += () => Ada.Core.GameClock.Pause(Ada.Core.PauseReasons.Ad);
ad.OnAdFullScreenContentClosed += () => resumeCountdown.OnAdClosed();
ad.OnAdFullScreenContentFailed += _ => Ada.Core.GameClock.Resume(Ada.Core.PauseReasons.Ad);
```

- Reklam yüklenmediyse gösterilmez, oyun akışı beklemez.
- Eklenti sürümünüzdeki olay adlarını kurulumda doğrulayın.

---

## 11. Varlıklar

- **Ortam:** `../3d/ortam_uclu_kopru.glb`. Unity'ye glTFast (ücretsiz) ile ya da Blender'dan FBX dışa aktarımıyla girer. Ölçüler `../3d/README.md` içinde.
- **Karakterler:** `../3d/kerem.glb`, `../3d/deniz.glb` (hazırlanıyor). Humanoid Avatar için FBX dışa aktarım önerilir.
- **Animasyonlar:** Quaternius Universal Animation Library 1 ve 2 (CC0). Unity için kendi FBX sürümleri kullanılır.
- **Web prototipi:** `../prototip/`. Kontrol eşikleri, ezber süresi ve UI akışı referansı.
