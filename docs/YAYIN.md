# Yayın rehberi: Google Play ve App Store

Bu belge Ray'i mağazalara göndermek için gereken her adımı sırayla anlatır. Depodaki iş akışları derlemeyi yapar; hesap açmak, anahtar üretmek ve mağaza formlarını doldurmak senin işin.

## 0. Kısa bakış

| İş akışı | Ne üretir | Ne zaman |
|---|---|---|
| `apk.yml` | Test APK'sı (Google test reklamları, imzasız hata ayıklama derlemesi) | "APK çıkar" denince. `-f yayin=false` yalnız artifact yükler, sabit test linkine dokunmaz. |
| `release.yml` | **İmzalı AAB** (Play'e yüklenen) + imzalı APK (elle kurup denemek için) | Play'e yeni sürüm gönderirken |
| `ios.yml` | İmzasız iOS simülatör derlemesi | iOS projesinin derlendiğini doğrulamak için. App Store'a gönderim imza ister (§3). |

Ortak noktalar:

- `android/` ve `ios/` depoda yoktur. Her derlemede `npx cap add` ile yeniden üretilir, sonra `tools/android/hazirla.cjs` ve `tools/ios/hazirla.sh` bu projeleri Ray'e göre yamalar.
- Capacitor 8 kullanılır: Node 22+, JDK 21, Xcode 26+. Android hedef API düzeyi 36'dır (Play 2025-08'den beri en az 35 istiyor), en düşük API 24'tür.
- Sürüm adı (`versionName`, iOS'ta `MARKETING_VERSION`) `package.json` içindeki `version` alanından gelir. Yeni sürümden önce orayı artır (ör. `0.4.0` → `1.0.0`).
- Gerçek reklam kimlikleri yalnız derleme sırasında girer: `index.html`'de `ads.js`'ten önce `window.RAY_ADS = { android: {…}, ios: {…} }` betiği. Yoksa `ads.js` Google'ın test kimliklerini kullanır.
- Ölçüm (Firebase Analytics) isteğe bağlıdır: `FIREBASE_ANDROID_JSON` / `FIREBASE_IOS_PLIST` gizli değerleri yoksa derleme ölçümsüz çıkar (§5).
- Gizlilik politikası adresi: `https://osmanadali.github.io/mobil-oyun/gizlilik.html`. Bu adres GitHub Pages açılınca yayına girer. Pages'i açmak senin onayını ister; iki mağaza da bu adresi zorunlu tutar.

## 1. Android: yükleme anahtarı

Play'e yüklenen her AAB, senin **yükleme anahtarınla** imzalanır. Play App Signing açıkken Google, uygulamayı kullanıcılara kendi sakladığı **uygulama imzalama anahtarıyla** dağıtır. Yeni uygulamalarda bu varsayılandır; öyle kalsın.

### 1.1 Anahtarı üret (bir kez)

JDK kurulu bir bilgisayarda:

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore ray-upload.jks -alias ray \
  -keyalg RSA -keysize 4096 -validity 10000
```

- Parola sorar. PKCS12 depoda anahtar parolası depo parolasıyla aynıdır. Aşağıda iki parola alanına da **aynı parolayı** gir.
- Ad, kuruluş gibi sorulara istediğini yazabilirsin. Bunlar kullanıcıya görünmez.

### 1.2 Yedekle

- `ray-upload.jks` dosyasını ve parolasını en az iki ayrı yerde sakla: bir parola yöneticisi ve şifreli bir yedek.
- **Depoya koyma.** Depo herkese açık.
- Kaybedersen Play App Signing sayesinde uygulama ölmez. Play Console → Uygulama bütünlüğü → "Yükleme anahtarını sıfırla" ile yeni anahtar istenir. Bu işlem birkaç gün sürer ve o sürede güncelleme gönderemezsin.

### 1.3 GitHub'a ekle

Depo → **Settings → Secrets and variables → Actions**.

**Secrets** sekmesi (gizli değerler):

| Ad | Değer |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `ray-upload.jks` dosyasının tek satır base64 hâli |
| `ANDROID_KEYSTORE_PASSWORD` | depo parolası |
| `ANDROID_KEY_ALIAS` | `ray` (keytool'da `-alias` ne verdiysen) |
| `ANDROID_KEY_PASSWORD` | anahtar parolası (PKCS12'de depo parolasıyla aynı) |

**Variables** sekmesi (gizli olmayan değişkenler):

| Ad | Örnek biçim | Nereden |
|---|---|---|
| `ADMOB_APP_ID_ANDROID` | `ca-app-pub-1234567890123456~1234567890` | AdMob → Uygulamalar → Ray (Android) → Uygulama ayarları |
| `ADMOB_INTERSTITIAL_ANDROID` | `ca-app-pub-1234567890123456/1234567890` | AdMob → Reklam birimleri → geçiş reklamı |
| `ADMOB_REWARDED_ANDROID` | `ca-app-pub-1234567890123456/1234567890` | AdMob → Reklam birimleri → ödüllü reklam |

App ID'de `~`, reklam biriminde `/` bulunur. Karıştırılırsa `release.yml` açık bir hata verip durur.

AdMob Android kaydı açıldı ("Ray (Android)", 29 Ekim 2026). Kimlikler `release.yml`'de varsayılan olarak yazılı, değişken girmek gerekmez (girilirse değişken geçer):

- Uygulama: `ca-app-pub-1478688740631972~8621751038`
- Geçiş: `ca-app-pub-1478688740631972/2829660461` ("Ray Android geçiş")
- Ödüllü: `ca-app-pub-1478688740631972/5430491817` ("Ray Android ödüllü", ödül 1 ipucu)

Test APK'sı (`apk.yml`) bilerek Google test kimlikleriyle kalır: testçilerin gerçek reklama dokunması AdMob'da geçersiz trafik sayılabilir.

Base64 üretmek:

- Linux: `base64 -w0 ray-upload.jks`
- macOS: `base64 -i ray-upload.jks | tr -d '\n'`
- Windows PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("ray-upload.jks"))`

`gh` komut satırı aracı kuruluysa hepsini oradan da ekleyebilirsin:

```bash
gh secret set ANDROID_KEYSTORE_BASE64 --body "$(base64 -w0 ray-upload.jks)"
gh secret set ANDROID_KEYSTORE_PASSWORD      # parolayı sorar, ekrana yazmaz
gh secret set ANDROID_KEY_ALIAS --body ray
gh secret set ANDROID_KEY_PASSWORD
gh variable set ADMOB_APP_ID_ANDROID --body "ca-app-pub-…~…"
gh variable set ADMOB_INTERSTITIAL_ANDROID --body "ca-app-pub-…/…"
gh variable set ADMOB_REWARDED_ANDROID --body "ca-app-pub-…/…"
```

## 2. Android: imzalı sürüm ve Play Console

### 2.1 `release.yml`'yi çalıştır

Actions → **Android yayın (imzalı AAB)** → Run workflow. Komut satırından: `gh workflow run release.yml`.

- **versionCode:** boş bırakılırsa çalıştırma numarası kullanılır. Play her yüklemede öncekinden büyük bir sayı ister. Elle vermek için: `gh workflow run release.yml -f versionCode=12`.
- **Eksik ayar:** gizli değer ya da değişken eksikse iş akışı ilk adımda durur ve neyin eksik olduğunu Türkçe listeler. Test kimliği verilmişse de durur.
- **Denetimler:** derlemeden sonra şunlar denetlenir ve sonuç günlüğe yazılır:
  - imza
  - `targetSdk` en az 35 mi
  - paketin içinde test App ID kalmış mı
  - `window.RAY_ADS` pakete girmiş mi
  - yerel kitaplıkların 16 KB sayfa uyumu
- **Çıktı:** sonuç artifact olarak 30 gün saklanır. Adı `ray-<sürüm>-<versionCode>` biçimindedir ve içinde `.aab` ile `.apk` dosyaları vardır.

### 2.2 Play Console'da ilk kurulum

1. **Geliştirici hesabı:** play.google.com/console, tek seferlik 25 USD. Kimlik doğrulaması birkaç gün sürebilir.
2. **Uygulamayı oluştur:** varsayılan dil Türkçe, tür Oyun, ücretsiz.
3. **Uygulama içeriği** (Politika → Uygulama içeriği):
   - **Gizlilik politikası:** yukarıdaki adres (Pages açık olmalı).
   - **Reklamlar:** "Evet, reklam içeriyor".
   - **Uygulama erişimi:** bütün işlevler kısıtlamasız.
   - **İçerik derecelendirmesi:** IARC anketi. Şiddet yok, kumar yok; kullanıcılar arası iletişim yok.
   - **Hedef kitle:** 13 yaş ve üstü önerilir. 13 yaş altını seçersen Aileler Politikası devreye girer. O durumda AdMob'da çocuklara yönelik işaretleme ve yalnız sertifikalı reklam ağları gerekir.
   - **Veri güvenliği:** AdMob, reklam kimliği (Cihaz veya diğer kimlikler), uygulama etkileşimleri ve teşhis verileri toplar. Bunlar reklam ve analiz amacıyla üçüncü tarafla paylaşılır ve aktarımda şifrelidir. Satın almayı Google Play yürütür. Oyunun kendisi sunucuya veri göndermez; ilerleme cihazda kalır.
   - **Reklam kimliği beyanı:** "Evet, reklam amacıyla kullanılıyor". `AD_ID` izni AdMob kitaplığından otomatik gelir.
4. **İç test kanalı** (Test et ve yayınla → Test → Dahili test):
   - Yeni sürüm oluştur ve `.aab` dosyasını yükle. İlk yüklemede Play App Signing'i kabul et ("Google tarafından oluşturulan anahtar").
   - Sürüm notunu Türkçe yaz, kaydet, incele ve dağıtıma çıkar.
   - Test edenler sekmesinde e-posta listesi oluştur, katılım linkini test edenlere gönder.
5. **Reklamsız paket** (Para kazanma → Ürünler → Uygulama içi ürünler):
   - Bu menü, `BILLING` izni taşıyan bir AAB yüklendikten sonra açılır. `release.yml` çıktısı bu izni taşır.
   - Ürün kimliği tam olarak `ray_reklamsiz` olmalı.
   - Tek seferlik ürün olarak ad, açıklama ve fiyat gir, sonra etkinleştir.
   - Satış için ödeme profili (satıcı hesabı) gerekir.
6. **Mağaza sayfası:**
   - kısa açıklama (80 karakter) ve tam açıklama
   - 512 px simge: `store/play-icon-512.png`
   - 1024×500 öne çıkan görsel
   - en az 2 telefon ekran görüntüsü
7. **Üretime geçiş:** 2023-11'den sonra açılan kişisel hesaplarda önce kapalı test gerekir. En az 12 test eden 14 gün boyunca kesintisiz katılmış olmalı. Ancak bundan sonra "Üretime erişim" başvurusu açılır.
8. **Test APK'ları ayrı pakettir:** `apk.yml` normal test sürümünü `com.osmanadali.ray.dev` ("Ray Dev"), her şey açık sürümü `com.osmanadali.ray.test` ("Ray Test") kimliğiyle derler. Play sürümü (`com.osmanadali.ray`) yükleme anahtarıyla imzalıdır; aynı paket adı farklı imzayla aynı telefona kurulamaz. Bu yüzden üçü yan yana kurulur, kayıtları da ayrıdır. Eski (bu değişiklikten önceki) `ray-test.apk` hâlâ `com.osmanadali.ray` paketindedir: kapalı teste katılan, telefonunda bu eski APK varsa Play sürümünü kurmadan önce onu **kaldırmalı**. Testçi davetine bu notu ekle.

### 2.3 Sonraki güncellemeler

1. Gerekirse `package.json` içindeki `version` alanını artır.
2. `release.yml`'yi çalıştır.
3. Yeni `.aab` dosyasını uygun kanala yükle. versionCode kendiliğinden artar.

## 3. iOS: App Store

`ios.yml` imzasız bir simülatör derlemesi üretir. Bu derleme projenin derlendiğini ve şunların doğru olduğunu kanıtlar:

- `Info.plist`:
  - AdMob App ID
  - izleme izni metni
  - SKAdNetwork listesi
  - şifreleme beyanı
  - yalnız dikey yön
  - diller: geliştirme bölgesi `en`, `CFBundleLocalizations` = en + tr
- `en.lproj` ve `tr.lproj` (`InfoPlist.strings`: izleme izni metninin İngilizcesi ve Türkçesi) pakette
- yalnız iPhone desteği
- simgeler

AdMob değişkenleri eksikse ya da Google test kimliği içeriyorsa `ios.yml` yalnız uyarır, durmaz.

App Store'a göndermek için Apple hesabı ve imza gerekir: `ios-release.yml` (§3.2-A).

**Dil:** `www/i18n.js` dili `navigator.languages[0]`'dan alır. iOS'ta WKWebView bu değeri yalnız uygulamanın bildirdiği diller arasından verir; eşleşme yoksa geliştirme bölgesine düşer. Bu yüzden `tools/ios/hazirla.sh` geliştirme bölgesini `en` yapar, iki dili `CFBundleLocalizations` ile bildirir ve `en.lproj`/`tr.lproj` klasörlerini `xcodeproj` gem'iyle projeye (Resources) ekler. Böylece Türkçe iPhone'da oyun Türkçe, öteki her dilde İngilizce açılır; izleme izni metni de aynı dilde görünür.

### 3.1 Hesap ve kayıtlar

1. **Apple Developer Program:** developer.apple.com/programs, yıllık 99 USD. Bireysel kayıt yeter.
2. **Identifiers** (Certificates, Identifiers & Profiles → Identifiers → +):
   - App ID: `com.osmanadali.ray` (Explicit).
   - In-App Purchase yeteneği varsayılan olarak açıktır.
3. **App Store Connect** (My Apps → + → New App):
   - platform iOS
   - ad "Ray"
   - birincil dil Türkçe
   - paket kimliği `com.osmanadali.ray`
   - SKU `ray-ios`
4. **Sözleşmeler** (Business → Agreements):
   - Paid Apps sözleşmesini imzala.
   - Vergi ve banka bilgilerini doldur. Bunlar olmadan uygulama içi satış çalışmaz.
5. **Reklamsız paket** (Uygulama → Monetization → In-App Purchases → +):
   - Tür **Non-Consumable**. Product ID tam olarak `ray_reklamsiz` olmalı (Play'deki kimlikle aynı; `shop.js` iki mağazada da bunu arar).
   - Fiyat, Türkçe ad ve açıklama gir.
   - İnceleme için satın alma ekranının görüntüsünü ekle.
   - İlk uygulama sürümüyle birlikte incelemeye gönder.
   - Oyunda "Satın alımı geri yükle" düğmesi var. Apple bunu tüketilemez ürünlerde zorunlu tutar.
6. **AdMob:** iOS kaydı açıldı ("Ray (iOS)", 29 Ekim 2026). Kimlikler `ios-release.yml`'de varsayılan olarak yazılı, değişken girmek gerekmez:
   - Uygulama: `ca-app-pub-1478688740631972~9395068810`
   - Geçiş: `ca-app-pub-1478688740631972/5351882023` ("Ray iOS geçiş")
   - Ödüllü: `ca-app-pub-1478688740631972/8249508106` ("Ray iOS ödüllü", ödül 1 ipucu)
   Değiştirmek istersen GitHub değişkenlerine şunları ekle (değişken varsayılanın önüne geçer):
   - `ADMOB_APP_ID_IOS` (`ca-app-pub-…~…`)
   - `ADMOB_INTERSTITIAL_IOS`
   - `ADMOB_REWARDED_IOS`

   Üçü de **iOS yayınında zorunludur**: `ios-release.yml` biri eksikse, biçimi yanlışsa ya da Google test kimliği (`3940256099942544`) içeriyorsa hiç derlemeden durur. Bunlar yoksa `ios.yml` (simülatör) Google'ın test App ID'sini (`ca-app-pub-3940256099942544~1458002511`) kullanır ve uyarı verir; `www/ads.js` de `window.RAY_ADS.ios` yoksa test reklamlarına düşer ("Test Ad", gelir sıfır).

### 3.2 İmzalı arşiv: dört yol

**A) GitHub Actions + App Store Connect API anahtarı (önerilen).** Mac gerekmez.

1. App Store Connect → Users and Access → Integrations → App Store Connect API → Team Keys → +. Rol **Admin** olmalı; bulutta yönetilen dağıtım sertifikası bunu ister.
2. `AuthKey_XXXX.p8` dosyasını indir. Dosya **yalnız bir kez** indirilebilir, yedekle.
3. GitHub gizli değerlerine şunları ekle:

| Ad | Değer |
|---|---|
| `APPSTORE_API_KEY_ID` | anahtar kimliği (10 karakter) |
| `APPSTORE_API_ISSUER_ID` | sayfanın üstündeki Issuer ID (UUID) |
| `APPSTORE_API_KEY_P8_BASE64` | `.p8` dosyasının base64 hâli |
| `APPLE_TEAM_ID` | Membership sayfasındaki Team ID (10 karakter) |

Gerekli ayarların tamamı (Settings → Secrets and variables → Actions):

| Tür | Ad |
|---|---|
| Gizli değer | `APPSTORE_API_KEY_ID`, `APPSTORE_API_ISSUER_ID`, `APPSTORE_API_KEY_P8_BASE64`, `APPLE_TEAM_ID` |
| Değişken | `ADMOB_APP_ID_IOS`, `ADMOB_INTERSTITIAL_IOS`, `ADMOB_REWARDED_IOS` |

`.p8` dosyasını kodlamak için: `base64 -i AuthKey_XXXX.p8 | pbcopy` (macOS) ya da `base64 -w0 AuthKey_XXXX.p8` (Linux).

Sonra Actions → **iOS yayın (App Store Connect)** → Run workflow (ya da `gh workflow run ios-release.yml [-f buildNumber=12]`). `.github/workflows/ios-release.yml` sırayla şunları yapar:

1. **Ön denetim:** yukarıdaki yedi ayardan biri eksikse, AdMob kimliklerinin biçimi yanlışsa, biri Google test kimliği içeriyorsa ya da yapı numarası geçersizse durur (Android'deki `release.yml` korumasının aynısı).
2. `ios.yml` ile aynı hazırlık: `npx cap add ios`, simgeler, `tools/ios/hazirla.sh` (gerçek App ID, `window.RAY_ADS`, diller), `npx cap sync ios`.
3. API anahtarıyla imzalı arşiv; yapı numarası `CURRENT_PROJECT_VERSION` = çalıştırma numarası (ya da `buildNumber` girdisi).
4. **Arşiv denetimi:** `GADApplicationIdentifier` test kimliği değil, paketteki `public/index.html` içinde `window.RAY_ADS` var ve test kimliği taşımıyor, sürüm numarası doğru, yalnız iPhone, en + tr dil dosyaları yerinde, uygulama imzalı. Biri tutmazsa yükleme yapılmaz.
5. Dışa aktarma ve yükleme (`ExportOptions.plist`, `destination: upload`). Yapı işlenince TestFlight'ta görünür.
6. Günlükler ve dSYM dosyaları iş akışı çıktısı olarak 30 gün saklanır; `.p8` makineden silinir.

İş akışının özü:

```bash
echo "$APPSTORE_API_KEY_P8_BASE64" | base64 -d > "$RUNNER_TEMP/AuthKey.p8"
AUTH="-allowProvisioningUpdates -authenticationKeyPath $RUNNER_TEMP/AuthKey.p8 -authenticationKeyID $APPSTORE_API_KEY_ID -authenticationKeyIssuerID $APPSTORE_API_ISSUER_ID"
xcodebuild archive -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -archivePath build/Ray.xcarchive \
  DEVELOPMENT_TEAM=$APPLE_TEAM_ID CODE_SIGN_STYLE=Automatic $AUTH
xcodebuild -exportArchive -archivePath build/Ray.xcarchive -exportPath build/out \
  -exportOptionsPlist ExportOptions.plist $AUTH
```

`ExportOptions.plist` dosyası (`destination: upload` dışa aktarırken yüklemeyi de yapar):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>method</key><string>app-store-connect</string>
  <key>destination</key><string>upload</string>
  <key>teamID</key><string>TAKIM_KIMLIGIN</string>
  <key>signingStyle</key><string>automatic</string>
</dict></plist>
```

Yapı numarası (`CURRENT_PROJECT_VERSION`) aynı sürümde her yüklemede artmalı. `tools/ios/hazirla.sh` bunu `VERSION_CODE` ortam değişkeninden alır; iş akışı çalıştırma numarasını verir ve arşivlerken komut satırında da geçirir. Yükleme bir kez reddedilip yeniden denenirse çalıştırma numarası zaten artmış olur.

**B) Elle sertifika ve profil.**

1. Apple Distribution sertifikasını `.p12` olarak dışa aktar.
2. App Store provisioning profili oluştur.
3. Gizli değerleri ekle:
   - `IOS_DIST_CERT_P12_BASE64`
   - `IOS_DIST_CERT_PASSWORD`
   - `IOS_PROVISIONING_PROFILE_BASE64`
   - `IOS_KEYCHAIN_PASSWORD`
4. İş akışı geçici bir anahtar zinciri kurar ve profili `~/Library/MobileDevice/Provisioning Profiles` altına koyar. Arşivleme `CODE_SIGN_STYLE=Manual` ile yapılır.

Bu yol A'dan daha zahmetlidir ve sertifika her yıl yenilenir.

**C) Xcode Cloud.**

- Xcode Cloud projeyi depodan derler. Bu yüzden `ios/` klasörünün depoya girmesi gerekir: `.gitignore`'dan çıkarılır ve bir kez `npx cap add ios` ile `tools/ios/hazirla.sh` çalıştırılıp eklenir.
- `ios/App/ci_scripts/ci_post_clone.sh` betiği şunları yapar:
  - Node kurar
  - `npm ci` çalıştırır
  - `npx cap sync ios` çalıştırır
- Avantajı: imza ve yükleme Apple'da kalır, Developer Program üyeliğinde ayda 25 saat ücretsiz.
- Dezavantajı: `ios/` artık elle güncel tutulur.

**D) Mac'te Xcode ile elle.**

1. Şu komutları çalıştır:

   ```bash
   npm ci
   npx cap add ios
   tools/ios/hazirla.sh
   npx cap sync ios
   npx cap open ios
   ```

2. Xcode'da Signing & Capabilities → Team seç.
3. Product → Archive → Distribute App → App Store Connect.

### 3.3 App Store Connect formları

- **Gizlilik politikası adresi:** yukarıdaki Pages adresi.
- **App Privacy** (veri toplama anketi): AdMob üzerinden şunlar toplanır ve üçüncü taraf reklam için kullanılır:
  - Identifiers → Device ID
  - Usage Data → Product Interaction ve Advertising Data
  - Diagnostics

  Kullanıcı izleme iznini verirse bu veriler "izleme" (tracking) sayılır.
- **İzleme izni (ATT):** `Info.plist`'te `NSUserTrackingUsageDescription` var (İngilizce; Türkçesi `tr.lproj/InfoPlist.strings`'te). ABD'deki inceleyici İngilizce metni görür.
  - Reklam katmanı izni `AdMob.requestTrackingAuthorization()` ile istemeli. Bu iş reklam dalının işidir.
  - İzin istenmeden IDFA kullanılamaz. Apple, izin metnini yazıp hiç sormamayı da reddedebilir.
- **Şifreleme:** `ITSAppUsesNonExemptEncryption = false` yazılı olduğu için her yüklemede soru sorulmaz.
- **Yaş derecelendirmesi:** anketi doldur. Oyunda kumar, şiddet ya da sohbet yok.
- **Kategori:** Games → Puzzle.
- **Ekran görüntüleri:** yalnız iPhone. 6,9 inç (1320×2868) zorunludur, küçük ekranlar bundan türetilir.
- **TestFlight:** yüklenen yapı işlenince önce iç test edenlere aç, sonra incelemeye gönder.

## 4. Teknik kararlar

### Hedef API

Capacitor 8 şablonu `targetSdk = 36`, `compileSdk = 36` ve `minSdk = 24` ile gelir. Play Billing için en az 23 gerekir. İki iş akışı da üretilen APK'yı `aapt2` ile okur ve hedef API 35'ten küçükse durur.

### Kenardan kenara (Android 15+)

Capacitor 8'de eski `adjustMarginsForEdgeToEdge` kaldırıldı. Yerine çekirdekte **SystemBars** eklentisi var ([belge](https://capacitorjs.com/docs/apis/system-bars)). Ray şunları kullanır:

- `capacitor.config.json` içinde `SystemBars.insetsHandling = "css"` ve `initialViewportFitValueHint = "cover"` (sayfada `viewport-fit=cover` var).
  - **Eski WebView (<140):** Capacitor web görünümünü çubuk payı kadar içeri alır ve `env(safe-area-inset-*)` 0 olur.
  - **Yeni WebView:** görünüm kenardan kenara açılır, `env()` doğru değeri verir. Capacitor ayrıca `--safe-area-inset-*` CSS değişkenlerini yazar.
- `style.css` içinde `--sat/--sab/--sal/--sar` = `max(env(…), var(--safe-area-inset-…))`. Hangisi doğru değeri taşırsa o kullanılır; web ve iOS'ta değişken yoktur, `env()` kullanılır.
- `MainActivity` içinde `EdgeToEdge.enable(this)`. Belge bunu önerir; Capacitor 9'da varsayılan olacak. Böylece Android 15 öncesi de aynı davranır.
- Çubuk rengi artık ayarlanamaz; çubuklar saydamdır, arkada oyunun zemini görünür. Tema değişince yalnız simge rengi değişir: `SystemBars.setStyle`. Bu yüzden `@capacitor/status-bar` kaldırıldı.

### Bildirimler

LocalNotifications 8.3, varsayılan olarak kesin alarm ister. Bu izin yoksa her planlamada "Alarmlar ve hatırlatıcılar" ayar ekranını açar. Ray hatırlatmaları `isExactNotification: false` ile planlar ve `SCHEDULE_EXACT_ALARM` izni bildirgeden çıkarılır. Bildirim birkaç dakika kayabilir; bunun bir sakıncası yok.

### iOS projesi

- Capacitor 8 varsayılanı olan **Swift Package Manager** kullanılır; CocoaPods gerekmez.
- En düşük iOS sürümü 15'tir.
- Yalnız iPhone (`TARGETED_DEVICE_FAMILY = 1`) ve yalnız dikey.
- SKAdNetwork listesi `tools/ios/skadnetwork.txt` dosyasındadır. Google'ın sayfası güncellenirse bu dosya da güncellenmeli.

## 5. Ölçüm (Firebase Analytics)

Oyun, bölüm ve ekonomi kararlarını veriye dayandırmak için **Google Analytics for Firebase** kullanır (`@capacitor-firebase/analytics` 8.5.2, `www/olcum.js`). Ölçüm isteğe bağlıdır: yapılandırma dosyası verilmezse derleme yine çalışır, eklenti o derlemeden çıkarılır ve ölçüm kapalı kalır. Web'de ölçüm yoktur.

### 5.1 Senin yapacakların

1. https://console.firebase.google.com › **Proje ekle** (ör. `ray-metro`). Google Analytics'i aç; hesap olarak yeni bir Analytics hesabı seç. Kullanıcının e-postası ya da başka kişisel bilgi hiçbir yere girilmez.
2. Projeye **Android uygulaması** ekle: paket adı `com.osmanadali.ray`. Test APK'larında da ölçüm istersen aynı projeye `com.osmanadali.ray.dev` ve `com.osmanadali.ray.test` adlı iki Android uygulaması daha ekle (verileri ayrı uygulama akışlarında görünür). Sonra **google-services.json** indir; bu dosya projedeki bütün Android uygulamalarını içerir.
3. Projeye **iOS uygulaması** ekle: bundle kimliği `com.osmanadali.ray`. **GoogleService-Info.plist** indir.
4. İki dosyayı base64'e çevirip GitHub'a **gizli değer** olarak gir (Settings › Secrets and variables › Actions › New repository secret). Dosyaları depoya koyma.

   ```bash
   base64 -w0 google-services.json        # macOS: base64 -i google-services.json
   base64 -w0 GoogleService-Info.plist
   ```

   | Gizli değer | İçerik | Kullanan |
   |---|---|---|
   | `FIREBASE_ANDROID_JSON` | google-services.json (base64 ya da ham JSON) | `apk.yml`, `release.yml` |
   | `FIREBASE_IOS_PLIST` | GoogleService-Info.plist (base64 ya da ham XML) | `ios.yml`, `ios-release.yml` |

5. Firebase/Analytics ayarları:
   - Analytics › Yönetici › Veri saklama: **14 ay**.
   - **Google sinyalleri kapalı** kalsın; Google Ads/AdMob bağlantısı ve reklam kişiselleştirmesi kapalı kalsın (uygulama zaten `ad_*` rızalarını reddeder).
   - AdMob uygulamasını Firebase'e bağlarsan AdMob kendi `ad_impression` olayını da yazabilir; DebugView'da çift olay görürsen `ads.js`'teki iki `ad_impression` satırını kaldır ya da Firebase bağlantısını yapma.
6. Ölçümle yayımlıyorsan mağaza formlarını güncelle: Veri güvenliği (`docs/MAGAZA.md` §6) ve App Privacy (§7) Firebase satırları.
7. Deneme: Android'de `adb shell setprop debug.firebase.analytics.app com.osmanadali.ray`, iOS'ta Xcode şemasına `-FIRDebugEnabled`; Firebase › DebugView'da olaylar görünür.

### 5.2 Derleme ne yapar

`tools/olcum-hazirla.cjs` (`tools/android/hazirla.cjs` ve `tools/ios/hazirla.sh` çağırır, `cap add` ile `cap sync` arasında):

- Gizli değer yoksa, çözülemezse ya da içindeki paket/bundle kimliği o derlemenin `appId`'siyle eşleşmezse `npm uninstall @capacitor-firebase/analytics` (yalnız CI kopyasında) → eklenti derlemeye girmez, günlükte "Ölçüm kapalı" notu çıkar.
- Android: `android/app/google-services.json` yazılır (Capacitor şablonu dosya varsa `com.google.gms.google-services` eklentisini kendiliğinden uygular), bildirge varsayılanları: `firebase_analytics_collection_enabled=false`, `google_analytics_adid_collection_enabled=false`, `google_analytics_ssaid_collection_enabled=false`, `google_analytics_default_allow_{analytics_storage,ad_storage,ad_user_data,ad_personalization_signals}=false`.
- iOS: `GoogleService-Info.plist` yazılır ve Xcode projesine kaynak olarak eklenir (xcodeproj gem'i); Info.plist: `FIREBASE_ANALYTICS_COLLECTION_ENABLED`, `GOOGLE_ANALYTICS_IDFV_COLLECTION_ENABLED` ve dört `GOOGLE_ANALYTICS_DEFAULT_ALLOW_*` anahtarı `NO`. SPM'de IDFA'sız `AnalyticsWithoutAdIdSupport` özelliği ve paket kimliği çakışmasına karşı `symlink` (capacitor.config.json CI kopyasına yazılır; Capacitor CLI 8.4+, Xcode 16.3+). `ios.yml` paket denetiminde "Ölçüm: GoogleService-Info.plist pakette" ya da "Ölçüm kapalı" yazar.

### 5.3 Rıza kararı ("temel" consent mode)

Google'ın uygulama rıza modu belgesine göre iki yol var: SDK'yı rıza gelene dek hiç çalıştırmamak (temel) ya da rıza durumunu `setConsent` ile bildirip SDK'yı çalıştırmak (gelişmiş; rıza yokken kimliksiz sinyaller gider). Ray **temel** yolu seçer, çünkü AdMob'un UMP penceresi TCF reklam amaçlarını sorar, ayrı bir analitik onayı toplamaz ve uygulama TCF dizesini JS'ten okuyamaz:

- Yerel projede toplama varsayılan **kapalı**. Her açılışta `ads.js` UMP sonucunu `Olcum.consent()`'e verir; o ana kadar olaylar bellekte bekler (en çok 60).
- UMP `NOT_REQUIRED` (rıza mesajı gerekmeyen bölge) → `setEnabled(true)`, `analytics_storage` verilir, bekleyen olaylar gönderilir.
- UMP `REQUIRED`/`OBTAINED` (AB/AEA, BK, İsviçre, rıza mesajı gösterilen ABD eyaletleri) → toplama kapalı kalır, bekleyen olaylar atılır. Bu bölgelerden veri gelmez; ileride ayrı bir analitik onay satırı eklenirse açılabilir.
- Sorgu sonuçsuz (internet yok) → karar değişmez, sonraki denemede verilir.
- `ad_storage`, `ad_user_data`, `ad_personalization` her zaman reddedilir; reklam kimliği (AAID/IDFA/IDFV) ölçüme girmez. Bu yüzden ölçüm iOS'ta "izleme" sayılmaz ve ATT kararından bağımsızdır: ATT reddedilse de ölçüm reklam kimliği kullanmadığından aynı kalır.
- Ayarlar › Gizlilik › Verilerimi sil → `setEnabled(false)` + `resetAnalyticsData()`.

Belge: https://developers.google.com/tag-platform/security/guides/app-consent

### 5.4 Olaylar

| Olay | Ne zaman | Parametreler |
|---|---|---|
| `level_start` | Bölüm ya da Günün Hattı açılınca | `mode` (level/daily), `level`, `line`, `resumed` |
| `level_end` | Bölüm bitince | `level`, `line`, `stars`, `time_s`, `moves`, `hints`, `perfect`, `first` (ilk geçiş) |
| `level_quit` | En az bir hamle ya da ipucuyla başlanmış bölümden çıkınca | `level`, `line`, `time_s`, `moves`, `hints` |
| `daily_end` | Günün Hattı bitince | `stars`, `time_s`, `moves`, `hints`, `perfect`, `practice`, `streak` |
| `tutorial` | Nasıl oynanır? açılınca / kapanınca | `step` (begin/complete/skip), `first` |
| `ad_impression` | Geçiş reklamı kapanınca, ödüllü video gösterilince | `ad_platform` (admob), `ad_format` (interstitial/rewarded), `earned` |
| `purchase` | Mağaza ödemesi başarıyla bitince | `item_id`, `kind` (consumable/non_consumable), `currency` — **tutar (`value`) yok**: gelir Firebase'in kendiliğinden yazdığı `in_app_purchase` olayında, çift sayılmasın |
| `booster_use` | Güçlendirici kullanılınca | `booster` (tur/fener/sure/geri), `level`, `line` |

Parametreler sayı ya da en çok 100 karakterlik metindir; kullanıcı kimliği, e-posta, serbest metin gönderilmez. Robot: `node tools/hakem.cjs --only=gelir-olcum` (sahte eklentiyle olaylar, rıza ve silme).
