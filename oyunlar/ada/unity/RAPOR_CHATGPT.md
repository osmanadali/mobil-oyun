# Ada: uygulama durum raporu

Bu rapor, iki brief'e karşılık yapılan işi özetler:
1. Unity 6 URP mobil oyun teknik tasarımı.
2. Final hedef atışı sahnesi (onaylı görsel referansla).

- Depo: `osmanadali/mobil-oyun`, dal `claude/exciting-albattani-rqjkg4`, klasör `oyunlar/ada/`.
- Ayrıntılı belgeler:
  - `oyunlar/ada/unity/TEKNIK_TASARIM.md`: riskler, mimari, Animator tabloları, Shader Graph, kamera, game feel, ölçüm, yol haritası, Inspector kurulumu.
  - `oyunlar/ada/unity/FINAL_ATIS.md`: final atış planı, prefab hiyerarşisi, materyaller, eksik varlıklar, kabul testleri.

## 1. Durum (önemli)

- **Unity projesi henüz yok.** C# kodları Unity 6 (6000.x), URP 17, Input System 1.x (EnhancedTouch), TextMeshPro ve UnityEngine.Pool varsayımıyla yazıldı. **Derlenmedi, cihazda test edilmedi.** Unity kurulu bir ortama erişim yoktu.
- **Kod incelemesi:** İki tur bağımsız inceleme yapıldı: Unity API/derleme ve oyun mantığı/brief uyumu. 31 bulgu düzeltildi.
- **Web prototipi:** Ayrıca Three.js ile oynanabilir bir prototip var (`oyunlar/ada/prototip/`).
  - İçerik: Üçlü Köprü, Hedef Dizisi, Final Atışı, tüm UI ekranları.
  - Test: Playwright ile 390×844 dokunmatik ekranda uçtan uca, konsol hatası yok.
  - Kapsamı yalnız kontrol eşikleri, ezber süresi ve UI akışı; Unity performansı için ölçüt değil.
- **Performans:** Hiçbir değer ölçülmedi. Belgelerdeki sayılar başlangıç önerisidir.

## 2. Kod yapısı (`oyunlar/ada/unity/Assets/Ada/Scripts/`)

| Klasör | Dosyalar | Görev |
|---|---|---|
| Core | `GameClock`, `ResumeCountdown`, `RaceTimer` | Tek oyun saati (timeScale; duraklatma nedenleri kümesi + hit-stop), 3-2-1 dönüş sayımı, süre ve ceza |
| Input | `TouchInput` | EnhancedTouch tek parmak: dokunma, kaydırma, sürükleme, basılı tutma. UI üstü dokunuş elenir. Duraklatmada ClearAll |
| Player | `PlayerMotor`, `MotorTuning`, `PlayerAnimatorBridge`, `VisualSquash`, `SwimTilt` | Kinematik hareket (tek sahip), ortak ayar varlığı, Animator parametre köprüsü, squash/stretch ve dalış eğimi yalnız VisualRoot'ta |
| Bridge | `BridgeController`, `BridgePlatform` | Desen, ezber gösterimi, hedef seçimi (dokun ya da kaydır), 130 ms iniş tamponu, yanlış → düşüş → kontrol noktası, Fener (+6 sn) |
| Throw | `Ballistics`, `Ball`, `AimArc`, `ThrowController`, `ThrowStateGuard`, `AnimationEventRelay`, `TargetBoard`, `ThrowStage`, `ThrowCourse` | Atış fiziği ve önizleme, nişan yayı, sapan kontrolü, bırakma olayı, menteşeli hedef, final etabı (sırasız), sıralı ezber varyantı |
| Water | `BreathSystem`, `DiveController` | Nefes kaynağı, basılı tut = dal, jeton, zorla yüzeye çıkış, cezalar |
| CameraSystem | `CameraRig` | Script tabanlı profiller (Bridge / Aim / Dive / Finish), sabit kadraj noktası, dar ekran FOV uyumu, sarsıntı, su altı sis/örtü |
| Effects | `FxPool` | Sabit halka tampon parçacık havuzu |
| UI | `UiTexts`, `ThrowHud`, `SafeAreaFitter` | Merkezi Türkçe metinler, final atış HUD'u, safe area |
| Flow | `LevelFlow` | Köprü → dalış → final atışı → sonuç |

## 3. Temel mimari kararlar

- **Hareket:**
  - Oyuncunun konumunu yalnız `PlayerMotor` değiştirir (kinematik Transform). Rigidbody ve CharacterController yok; fizik yalnız sorgu için kullanılır.
  - Gerekçe: köprü hareketi ayrık. Kalkışta hedef kesinleşir ve parabol sabit sürelidir. İki karakterin eşit olması analitik hareketle garanti edilir.
  - Zıplama ve hızlar tek bir `MotorTuning` ScriptableObject'te tutulur; Kerem ve Deniz aynı varlığa bağlanır.
- **Zaman:**
  - `GameClock`, `Time.timeScale` üzerinden çalışır. Fizik, Animator (Normal), parçacıklar, süre ve nefes aynı anda durur. UI ve geri sayım unscaled zaman kullanır.
  - Duraklatma nedenleri kümeyle tutulur. Android'de reklam hem Ad hem App nedeni bırakır; geri sayım bekleyen tüm nedenleri birlikte kaldırır (donma hatası bu şekilde düzeltildi).
  - GameClock kalıcı değil (tek sahne).
- **Animator:**
  - Root motion kapalı, `OnAnimatorMove` yok, oyun durumu Animator'da tutulmuyor.
  - Land yalnız motorun onayladığı iniş olayıyla tetiklenir; kalkışta `ResetTrigger(Land)` çağrılır. `Grounded` hiçbir geçişte koşul değildir.
  - Zıplama zincirinde Fixed Duration, Has Exit Time kapalı ve Any State yok. Ayrıntılı tablo belgede.
  - `MoveAnimSpeed` parametresi ayak kaymasını telafi eder (`strideScale`, Deniz ≈ 0,92).
- **Kamera:**
  - Cinemachine kullanılmadı: tek yumuşatma, `SmoothDamp`.
  - Bridge profili yanal kilitli (sütunların merkezi) ve zıplama yüksekliğini izlemez.
  - Aim profili sahnedeki `ThrowCamPose` noktasında sabit durur. `minHorizontalFovDeg` dar ekranlarda kenar hedefleri korur.
- **Su (v1):**
  - URP Lit, Transparent; iki yönde kayan normal haritası; Fresnel (normal world space'e dönüştürülerek); köpük ve derinlik maskesi vertex renginden; Is Front Face ile alt yüz rengi.
  - Depth Texture ve Opaque Texture gerekmiyor.
  - Su altında üstel sis ve örtü var. Fog Modes = Custom (Exponential), aksi halde build'de sis kaybolur.

## 4. Final atış sahnesi (ikinci brief)

- **Kontrol:**
  - Güvenli alanın alttan %45'inde başlayan dokunuş geçerlidir.
  - Geri (aşağı) çekme gücü belirler: 28–220 dp. Yatay hareket yönü belirler: ±160 dp → ±16°.
  - Parmak bırakılınca atış yapılır. Eşik altı ya da hareketsiz dokunuşta atış yok.
  - Atılan hız, ekranda **son çizilen** yayın hızıdır; yay görünmüyorsa atış yapılmaz.
- **Nişan yayı (`AimArc`):**
  - LineRenderer: 0,045 m, süt beyazı, %42 opak; yumuşak kenar dokusu kodla üretiliyor.
  - 0,75 m arayla en fazla 14 yumuşak nokta.
  - İlk gerçek çarpışmada biter; geçerli hedefte küçük beyaz halka gösterir.
  - Top elden çıkınca 0,12 sn'de söner.
  - Topun TrailRenderer izi ayrı bir sistemdir (0,12 sn).
- **Fizik:**
  - Top: Rigidbody + SphereCollider. `useGravity` kapalı, `linearDamping` 0, Interpolate.
  - Çarpışma algılama uçuşta ContinuousDynamic; elde kinematik ve ContinuousSpeculative.
  - Her FixedUpdate'te `AddForce(a(v), Acceleration)` uygulanır. `a(v) = (0, −9,81, 0) + rüzgâr − 0,08·v`.
  - Önizleme aynı formülü kullanır: `dt = Time.fixedDeltaTime`, yarı örtük Euler, her adımda top yarıçapıyla SphereCast.
  - Uçuşta `excludeLayers = ~hitMask`: top yalnız önizlemenin gördüğü katmanlara çarpar.
  - Aynı adımdaki temaslarda hedef teması önceliklidir.
  - Geliştirme build'inde önizleme ile gerçek konum arasındaki en büyük sapma loglanır. Kabul eşiği < 2 cm (ölçülmedi).
- **Bırakma:**
  - Top HandSocket'te kinematik durur.
  - Throw klibindeki `ThrowRelease` Animation Event topu ayırır ve `ThrowOrigin`'den (bırakma karesindeki el konumu) fırlatır.
  - `pendingId` + `released` çift topu engeller.
  - `ThrowStateGuard`: Throw durumu bitene kadar yeni atış başlamaz. Bırakmadan önce kesilen atışı yalnız kendisi iptal eder. 1,2 sn zaman aşımı kilitlenmeyi önler.
- **Hedefler:**
  - Rigidbody yok. Kontrollü menteşe devrilmesi: 82°, ease-out-back, 0,32 sn.
  - `RegisterHit` her hedefi yalnız bir kez sayar.
  - Skor, ses, parçacık, sayaç ve simge aynı fiziksel isabet olayından beslenir.
  - Devrilmiş hedefe çarpan top ıska geri bildirimi alır.
- **Etap (`ThrowStage`):**
  - Hedefler sırasız vurulur.
  - Son isabette girdi hemen kilitlenir. Ardından 40 ms hit-stop, 100 ms ve %0,25 sarsıntı, Victory ve sonuç paneli gelir.
  - "Tekrar oyna": hedefler, toplar, efektler, UI ve Animator (Victory'den Locomotion'a) sıfırlanır.
  - Reklam yalnız `IsSafeForAds` iken açılır: nişan ve uçuş yokken.
- **HUD:**
  - Bütün metinler `UiTexts` içinde.
  - Üstte 3 simge; işaretlenen simge, vurulan hedefin `SlotIndex`'iyle (sol/orta/sağ) eşleşir.
  - Ekranda: "Hedef: n/3" sayacı, giriş başlığı, ilk kullanım ipucu (PlayerPrefs), "İSABET!" / "Tekrar dene", sonuç paneli.
  - UI her kare değil, yalnız olaylarla güncellenir; safe area'ya uyar.

## 5. Brief'ten sapmalar ve yorumlar

- **ThrowOrigin karakter başına:** Çıkış noktası her karakterin kendi elinde. Adalet tanımı: aynı sürükleme aynı noktaya düşmek zorunda değil, ama iki karakter de aynı güç aralığıyla her hedefe ulaşabilmeli. Oyuncu yaya bakarak nişan alır. (İnceleme ortak sabit nokta önerdi; "el çıkış noktaları doğru olsun" maddesi nedeniyle uygulanmadı.)
- **Sapan eşlemesi varsayılan:** Sola çekmek sağa nişan alır. Inspector'dan değiştirilebilir.
- **Sıralı ezber varyantı:** "Hedef Dizisi" ayrı tutuldu (`ThrowCourse`). Prototipte bu bölüm yukarı kaydırmayla oynanıyor, final atışı sapanla. Kontrolün birleştirilmesi kullanıcı kararı bekliyor.
- **Cinemachine kullanılmadı:** Script kamera tercih edildi. Cinemachine 3'e geçilirse script yumuşatması kaldırılmalı.

## 6. Eksikler

- **Modeller:**
  - Hedef standı (ahşap çerçeve, halat, taş kaideler, menteşeli 3 disk), iskele parçası ve top yok.
  - Ortam (Üçlü Köprü lagünü) Blender'da prosedürel olarak hazır.
  - Karakterler hazırlanıyor: Nano Banana referansı → Hunyuan3D-2 şekli → referans görsellerin projeksiyonuyla doku → Quaternius CC0 iskelet ve animasyon.
- **Animasyonlar:**
  - AimIdle yok.
  - Throw geçici: Quaternius `OverhandThrow`, ağırlık aktarımı ve follow-through kalitesi doğrulanmadı.
  - Recover ve Victory geçici. WaterEnter ve Dive klipleri eksik.
  - Nihai için ücretsiz öneri: Mixamo "Throw" / "Baseball Pitching" ya da özel animasyon.
- **Diğer:** Sesler, Türkçe karakterli TMP font, halka ve kıymık dokuları.
- **Doğrulanmamış:**
  - PhysX entegrasyonunun önizlemeyle birebir aynı olduğu varsayımı (ölçüm koduyla sınanacak).
  - AdMob olay adları.
  - Tüm performans hedefleri.

## 7. Senden istenenler

1. Mimari kararları gözden geçir. Özellikle kinematik oyuncu + Rigidbody top ayrımını, GameClock/timeScale yaklaşımını ve ThrowOrigin adalet tanımını değerlendir.
2. Boş bir Unity 6 URP projesine kurulum için adım adım sıra öner: paketler, katmanlar, Collision Matrix, Animator Controller kurulumu, prefab'lar.
3. Koddaki olası Unity 6 API ya da derleme sorunlarını işaretle. Kodu görmen gerekirse ilgili dosyaları iste.
4. Atış ve AimIdle animasyonları için ücretsiz ve ticari kullanıma uygun en iyi kaynakları öner.
5. M1 (köprü) ve M2 (atış) için cihaz test planını netleştir.
