# Final atış sahnesi — uygulama (v1)

Onaylı görsel referans: `../referans/final_atis_onayli.png`. Görsel kabul bu görsele göre yapılır. Görsel bir konsept çalışmasıdır; aynı görünüm gerçek zamanlı 3D nesnelerle ve mobil bütçeyle üretilir, arka plan resmi üzerine bindirme yapılmaz.

> **Durum:** Unity projesi henüz yok. Kodlar **derlenmedi ve cihazda test edilmedi**. Aşağıdaki "kabul ölçütleri", proje kurulunca yapılacak testlerdir; sonuçlar ölçüldükçe buraya işlenecek. Referans görseldeki kalite (karakter, stand, ışık) hedeftir. Şu an elde olan geçici varlıklar §7'de ayrıca listelendi.

## 1. Uygulama planı

1. **Döngü (graybox):** küp stand, 3 disk, kapsül karakter. Akış uçtan uca çalışır: giriş → nişan → atış → isabet/ıska → hazırlanma → 3/3 → zafer → sonuç → yeniden oyna.
2. **Doğruluk:** önizleme ile gerçek uçuş arasındaki sapma ölçülür (geliştirme yapısında log). Hedef: temas öncesi en büyük sapma < 2 cm.
3. **His:** isabet efekti, ses, son isabette duraklama ve sarsıntı; arayüz metinleri ve simgeler.
4. **Görsel:** referansa göre model, ışık ve malzeme. Kadraj sabit kamera noktasıyla ayarlanır. Su shader'ı ana tasarım belgesinin §5'indeki gibi.
5. **Cihaz:** overdraw ve kare süresi ölçümü (Android ve iOS); reklam akışı testi.

## 2. Kontrol (tek el)

- **Başlangıç bölgesi:** dokunuş güvenli alanın alttan %45'inde başlamalı. Parmak hedefleri ve yayı örtmez.
- **Nişan:** geri (aşağı) çekme mesafesi gücü belirler: 28 dp altında atış yok, 220 dp'de tam güç. Yatay hareket yönü belirler: ±160 dp → ±16°.
  - Sapan eşlemesi açık: sola çekmek sağa nişan alır. Inspector'dan `slingshotHorizontal` ile kapatılabilir.
- **Atış:** parmak bırakılınca. Eşik altındaki hareket ya da hareketsiz dokunuş top fırlatmaz.
- **Çözünürlükten bağımsızlık:** bütün eşikler dp cinsinden; `Screen.dpi` okunamazsa 160 kabul edilir.
- **UI önceliği:** UI'nin üstünde başlayan dokunuş atış başlatmaz (`TouchInput`, EventSystem ile kontrol eder).
- **Odak kaybı ve reklam dönüşü:** `TouchInput.Cleared` ve `GameClock.PauseChanged` bekleyen nişanı iptal eder. Basılı parmak kaldırılana kadar yeni girdi alınmaz.

## 3. Nişan yayı ve hareket izi (ayrı sistemler)

| | Nişan yayı (`AimArc`) | Hareket izi (`TrailRenderer`, topta) |
|---|---|---|
| Ne zaman | Atıştan önce, gelecekteki yol | Atıştan sonra, topun geçtiği kısa mesafe |
| Görünüm | İnce (0,045 m), süt beyazı, %42 opaklık, yumuşak kenar; 0,75 m arayla küçük yumuşak noktalar (%75) | Kısa (0,12 sn), uca doğru incelir, beyaz %60 → %0 |
| Başlangıç | `ThrowOrigin` (bırakma karesindeki el) | Topun kendisi |
| Bitiş | İlk gerçek çarpışma (hedefin arkasına devam etmez) | Kendiliğinden söner |
| Hedef halkası | Yay geçerli bir hedefte bitiyorsa küçük beyaz halka | — |
| Sönme | Top elden çıkınca 0,12 sn | Temasla birlikte üretim durur |

Yay, kalın lazer ya da katı boru gibi görünmemelidir. Ayarlar: `opacity` 0,35–0,5, `lineWidth`, `dotSpacing`.

Yörüngenin gösterilmesi otomatik isabet anlamına gelmez: topun uçuşuna hiçbir gizli düzeltme ya da hedefe yapışma uygulanmaz.

## 4. Atış fiziği ve önizleme doğruluğu

- **Top:**
  - `Rigidbody` + `SphereCollider` (r = 0,11 m) + `TrailRenderer`.
  - `useGravity` kapalı, `linearDamping` 0, Interpolate.
  - Uçuşta CCD **ContinuousDynamic**; elde ContinuousSpeculative + kinematik + collider kapalı.
- **Hareket modeli** (önizleme ve gerçek top için aynı): `a(v) = (0, −9,81, 0) + rüzgâr − 0,08·v`.
  - Gerçek top: her `FixedUpdate`'te `AddForce(a(v), ForceMode.Acceleration)`. Uçuşu yalnız Rigidbody yönetir.
  - Önizleme: aynı formül, `dt = Time.fixedDeltaTime`, yarı örtük Euler (önce hız, sonra konum; PhysX'in gövde entegrasyon sırası).
  - Çarpışma: her adımda top yarıçapıyla `SphereCast`.
  - Aynı başlangıç konumu (`ThrowOrigin`), hız ve ayarlar. Rüzgâr atış anında dondurulur.
- **Doğrulama:** `Ball`, geliştirme yapısında her `FixedUpdate`'te konumunu önizleme noktasıyla karşılaştırır. İlk temasta en büyük sapma loglanır (`[Atış] önizleme sapması`). Kabul eşiği < 2 cm.
  - Fixed Timestep 0,02 sn (varsayılan) ya da 0,0167 sn olabilir; önizleme hangisi kullanılıyorsa onu kullanır.
- **Atılan yay = son çizilen yay:** Parmak kalkarken birkaç dp kayma olur. Bu yüzden gerçek hız bitiş konumundan yeniden hesaplanmaz; ekranda son çizilen yayın hızı fırlatılır.
- **Art arda atış:** Throw animasyonu bitene kadar (`ThrowStateGuard` giriş/çıkış) yeni atış başlamaz. Çıkışta yalnız o animasyona ait atış (bırakılmadıysa) iptal edilir.
- **Bırakma:** Topun tam el açılma anında çıkması için:
  1. Throw klibinin bırakma karesine `ThrowRelease` olayı konur.
  2. Klip o karede durdurulur; `ThrowOrigin` elin dünya konumuna taşınır.
  3. Kerem ve Deniz için ayrı ayrı yapılır.
- **Kerem ve Deniz:**
  - Boy farkı korunur; çıkış noktaları kendi ellerinde (el bırakma karesine hizalı).
  - Adalet tanımı: aynı sürükleme iki karakterde birebir aynı noktaya düşmek zorunda değil. Çıkış yüksekliği farklıdır ve yay bunu tam gösterir. Adalet, iki karakterin de aynı güç aralığıyla her hedefe rahatça ulaşabilmesidir; oyuncu yaya bakarak nişan alır.
  - Güç aralığı (8–14 m/sn) ve eğim (24°) iki karakterde aynıdır.
  - Kabul testi: iki karakterle de üç hedef minimum ve maksimum güç arasında vurulabilmeli.
  - Gerekirse stand mesafesi değil, güç aralığı ayarlanır (iki karakter için aynı değer).

## 5. Hedefler

- **Kurulum:** `TargetBoard`, menteşe (`hinge`) diskin alt kenarında.
  - Yerel +X disk genişliği boyunca, +Z oyuncudan uzağa bakar.
  - Disk collider'ı "Target" katmanında.
  - Rigidbody yok: devrilme kontrollüdür.
- **İsabet akışı:**
  1. Topun ilk fiziksel teması (`OnCollisionEnter`) → `ThrowController.TargetHit`.
  2. `ThrowStage`, `RegisterHit` çağırır.
  3. Hedef **yalnız bir kez** sayılır; aynı hedefe tekrar temas puan vermez.
- **Devrilme:** 0,32 sn'de geriye 82°, ease-out-back aşımıyla. Kısa geri tepki hissi bu aşımdan gelir.
- **Tek kaynak:** Skor, ses, parçacık, UI simgesi ve sayaç aynı `OnTargetHit` olayından beslenir. Animasyon bitişi ya da UI skor üretmez.
- **Sıra serbest:** Hedefler herhangi bir sırayla vurulabilir. Sıralı ezber varyantı ayrıdır: `ThrowCourse`.
- **Havuzlar:**
  - Toplar: `ObjectPool<Ball>`, en fazla 8.
  - Efektler: `FxPool`, sabit halka tampon (oyun sırasında bellek ayırmaz).

## 6. Prefab hiyerarşisi ve bağlantılar

```
FinalThrowArea                    ThrowStage
  ThrowSpot                       (iskelede atış noktası; forward = hedeflere)
  ThrowCamPose                    (CameraRig 'Aim' profilinin fixedPose'u)
  Dock                            (ahşap iskele, direkler, halat)
  TargetStand                     (ahşap çerçeve, halat bağları, taş kaideler)
    Target_L  (TargetBoard slot 0)  Hinge → Disc (MeshRenderer + MeshCollider/CapsuleCollider, Layer Target)
    Target_M  (TargetBoard slot 1)
    Target_R  (TargetBoard slot 2)
  FX
    HitFxPool                     FxPool (prefab: küçük beyaz/sarı parlama + 6–10 kıymık, 0,4 sn)
    FinalFxPool                   FxPool (daha belirgin, 0,6 sn)
  Audio                           AudioSource (2D, PlayOneShot)
PlayerRoot
  ThrowOrigin                     (bırakma karesindeki el konumu)
  VisualRoot / Character
    Animator, AnimationEventRelay
    ... RightHand / HandSocket
AimArc                            AimArc + LineRenderer (+ nokta prefabı, hedef halkası)
HUD (Canvas, Screen Space - Overlay, Scale With Screen Size 1080×1920, Match 0,5)
  SafeArea                        SafeAreaFitter
    TopBar                        sayaç TMP + 3 hedef simgesi (+ onay işaretleri)
    EntryBanner                   "FİNAL ATIŞI" / "3 hedefi devir"
    Tutorial                      "Nişan almak için geri çek" / "Atmak için bırak"
    Popup                         "İSABET!" / "Tekrar dene"
    ResultPanel                   "ETAP TAMAMLANDI!" + Devam / Tekrar oyna
  ThrowHud
```

**Inspector bağlantıları**

**`ThrowController`** (PlayerRoot):
- `input` (TouchInput), `anim` (PlayerAnimatorBridge)
- `handSocket`, `throwOrigin`
- `aimReference` = PlayerRoot
- `ballPrefab`
- `arc` (AimArc)
- `hitMask` = Target + Environment (stand, iskele, kaya, zemin; **su hariç**)

**`ThrowStage`:**
- `targets` [L, M, R], `thrower`, `motor`, `anim`, `cameraRig`, `timer`
- `throwSpot`
- `hitFx` / `finalFx`
- `sfx` ve klipler

**`AimArc`:**
- `line` (LineRenderer: Alignment View, Texture Mode Stretch)
- `dotPrefab` (Quad, collider silinmiş, M_AimDot)
- `targetRing` (Quad, M_AimRing)
- `cam`

**`ThrowHud`:** `stage` ve tüm UI referansları.

**Character:**
- `AnimationEventRelay.throwController`.
- Animator'daki Throw durumuna `ThrowStateGuard`.

**`CameraRig`** 'Aim' profili:
- `fixedPose` = ThrowCamPose.
- `minHorizontalFovDeg` ≈ 48: dar ekranlarda kenar hedefler kesilmez.

**Malzemeler** (URP):

| Malzeme | Shader | Ayarlar |
|---|---|---|
| `M_AimArc` | Universal Render Pipeline/Particles/Unlit | Surface Transparent, Blend Alpha, Color beyaz. Doku çalışma anında yumuşak kenar olarak atanır |
| `M_AimDot` | Aynı | Doku çalışma anında yumuşak nokta |
| `M_AimRing` | Aynı | Beyaz ince halka dokusu, %60 |
| `M_BallTrail` | Particles/Unlit | Transparent Alpha |
| Hedef diski | URP Lit | Kırmızı-beyaz halka dokusu, Smoothness 0,4, Emission açık (dizi modunda yanıp sönme için) |

**Kamera kadrajı** (referansa göre):
- `ThrowCamPose` karakterin arkasında ve hafif yukarıda: yaklaşık 1,6 m arkada, 2,2 m yukarıda, 14–18° aşağı bakış.
- FOV 45–50.
- Karakter alt sol/orta bölgede, hedefler üst orta bölgede, yayın tamamı görünür.
- Alana girişte 0,5 sn yumuşak geçiş. Nişan ve atış sırasında kamera sabittir: FOV değişimi ya da büyük hareket yok.
- Yalnız son isabette 100 ms, ekran yüksekliğinin %0,25'i kadar sarsıntı.

## 7. Animator (atış)

**Akış:** AimIdle (`Aiming` = true) → Throw (`Throw`) → Recover (exit) → AimIdle. Son hedefte Recover → Victory (`Victory`).

Root motion kapalı. Atış klibinde Root Transform Position (XZ ve Y) ve Rotation "Bake Into Pose" açık olmalı; aksi halde ayak iskelede kayar. Geçiş süreleri ana tasarım belgesindeki tabloda.

| İhtiyaç | Şu an elde (geçici) | Nihai için gereken |
|---|---|---|
| AimIdle | **Yok**. Idle_Loop kullanılıyor | Hafif öne eğik, topu tutan bekleme duruşu |
| Throw | Quaternius UAL2 `OverhandThrow` (CC0). Tam vücut, ağırlık aktarımı ve follow-through kalitesi **doğrulanmadı** | Ağırlık aktarımı, omuz-gövde-kol zinciri, belirgin follow-through içeren atış. Ücretsiz seçenek: Mixamo "Throw" / "Baseball Pitching" (kendi karakterine retarget) ya da özel animasyon |
| Recover | OverhandThrow kuyruğu (klipten ayrı aralık) | Kontrollü toparlanma |
| Victory | `Dance_Loop` / `Yes` | Kısa sevinç (zıplama ya da yumruk). Takla normal atışa eklenmez |

Eksikler geçici animasyonla doldurulur. Nihai kalite, referanstaki duruş ve atış sonrası kol uzanışıyla karşılaştırılarak kabul edilir.

## 8. Arayüz

- **Metinler:** hepsi `UiTexts` içinde, tek merkezde. Font: Türkçe karakterleri içeren TMP Font Asset (ör. Nunito ya da Baloo 2, Latin Extended-A, SDF).
- **Hangi metin ne zaman görünür:** aynı anda tek durum metni.
  - **Giriş:** "FİNAL ATIŞI" + "3 hedefi devir", 1,1 sn görünür, sonra söner.
  - **İpucu:** "Nişan almak için geri çek" / "Atmak için bırak". Yalnız ilk kullanımda görünür, ilk başarılı atışta kaybolur (`PlayerPrefs`).
  - **Sayaç:** "Hedef: n/3". Metinler önceden üretilir, oyun sırasında bellek ayrılmaz.
  - **Hedef simgeleri:** Vurulan hedefin `SlotIndex`'iyle eşleşen simge (sol / orta / sağ) onaylanır ve kısa büyüme animasyonu oynar.
  - **İsabet / ıska:** "İSABET!" ya da "Tekrar dene", ~0,8 sn.
  - **Sonuç:** "ETAP TAMAMLANDI!" + Devam / Tekrar oyna. Ekranı kaplayan tek panel budur.
- **Güncelleme:** UI yalnız olaylarla güncellenir; her kare metin yazılmaz.
- **Güvenli alan:** `SafeAreaFitter`. Yazı boyutları 1080×1920 referansında en az 40 px (küçük telefonda ~14 pt).

## 9. Performans ve reklam

- Önerilen bütçe (ölçülecek): yay 1 LineRenderer + en fazla 14 nokta; iz 1 TrailRenderer; parçacık patlaması başına ≤ 12 parçacık; aynı anda en fazla 1 final efekti.
- Su + yay + iz + parçacık + UI overdraw'ı cihazda ölçülür (bkz. ana belge §8). Gerçek zamanlı yansıma ve tam ekran efekt yok.
- **Bellek ayırma yok:** Tekrarlanan atışlarda önizleme dizisi, nokta havuzu, top havuzu, efekt halkası ve sayaç metinleri önceden ayrılmış. Geliştirme logundaki string, yalnız `Debug.isDebugBuild` iken üretilir.
- **Reklam:**
  - Yalnız `ThrowStage.IsSafeForAds` true iken (nişan ya da uçuş yokken) ve sonuç ekranında açılır.
  - Dönüşte `ResumeCountdown` girdileri temizler ve 3-2-1 sayar.
  - İnternet ya da reklam yoksa akış değişmez.

## 10. Eksik varlıklar

| Tür | Eksik | Öneri |
|---|---|---|
| Model | Hedef standı (ahşap çerçeve, halat bağları, taş kaideler, menteşeli 3 disk), atış iskelesi parçası (direk + halat), top | Blender'da (bu depodaki prosedürel ortam betiği gibi) üretilebilir. Referanstaki stil: yuvarlatılmış, sade ahşap |
| Animasyon | AimIdle, nihai Throw ve Recover, kısa Victory | §7 |
| Ses | Atış "vuş", ahşap hedef "tok", devrilme "tak", son isabet ödül sesi, ıska/su "şıp", UI tık | Ücretsiz CC0 paketler (ör. Kenney) ya da üretim |
| Efekt dokuları | Yumuşak nokta, ince halka, kıvılcım/kıymık | Nokta ve çizgi dokusu kodla üretiliyor; halka ve kıymık için küçük dokular gerekir |
| Font | Türkçe karakterli TMP Font Asset | Google Fonts (OFL) → TMP Font Asset Creator |

## 11. Kabul testleri (proje kurulunca)

| Ölçüt | Nasıl test edilir |
|---|---|
| Yay referanstaki gibi okunuyor | Referansla yan yana ekran görüntüsü; opaklık ve kalınlık ayarı |
| Önizleme ile uçuş örtüşüyor | 20 atış; logdaki en büyük sapma < 2 cm |
| Top tam bırakma anında çıkıyor | Yavaş çekim (Time.timeScale 0,1) ile el ve top kontrolü |
| İsabet hedefi fiziksel olarak etkiliyor, her hedef bir kez sayılıyor | Aynı hedefe 3 top: sayaç bir kez artar |
| 3/3 → zafer ve sonuç arayüzü | Farklı sıralarla (S-O-Ğ, Ğ-S-O …) |
| Iska kilitlemiyor | 10 ardışık ıska; 0,4 sn sonra yeni top elde |
| Yeniden başlatma her şeyi sıfırlıyor | Uçuş sırasında "Tekrar oyna": top, efekt, simge, sayaç sıfır |
| Reklam ve arka plan dönüşü | Nişan sırasında uygulamayı arka plana al → dönüşte nişan iptal, 3-2-1, atış yok |
| Kerem ve Deniz adil | İki karakterle aynı hedefleri minimum ve maksimum güçte vur |
| Dar ve geniş ekranlarda kadraj | 9:16, 9:19,5, 9:21, 3:4 (tablet): karakter ve 3 hedef görünür |
