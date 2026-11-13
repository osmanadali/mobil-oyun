# Magic Sudoku — iOS yayın rehberi

Uygulama `sudoku/` klasöründe ayrı bir Capacitor projesi. Ray ile aynı Apple hesabını ve Codemagic'i kullanır.

| | |
|---|---|
| Paket kimliği (Bundle ID) | `com.osmanadali.sudoku` |
| Mağaza adı (öneri, en çok 30 karakter) | **Magic Sudoku: Creature Spells** |
| Alt başlık (öneri) | Tap to cast numbers & spells |
| Ana ekrandaki ad | Magic Sudoku (Türkçe cihazda "Büyülü Sudoku", Japonca "まほうのナンプレ"…) |
| Diller | en (ana), tr, de, es, pt-BR, fr, ko, ja, zh-Hant |
| Kategori | Games › Puzzle (ikincil: Games › Board) |
| Gizlilik politikası | `https://osmanadali.github.io/mobil-oyun/sudoku/privacy.html` (GitHub Pages yayınında) |
| Gelir | AdMob: bulmaca aralarında geçiş reklamı (ilk 2 bulmaca reklamsız, en az 90 sn arayla) + ipucu bitince isteğe bağlı ödüllü video (+2 ipucu) |

> Not: Japonca'da "数独 / Sudoku" Nikoli şirketinin tescilli markası. Bu yüzden oyun içinde ve Japonca ana ekran adında genel ad olan **ナンプレ** kullanılıyor. Japonca mağaza metninde de "数独" yazma.

## Senin yapacakların (bir kez)

### 1. Paket kimliğini kaydet
developer.apple.com › Certificates, Identifiers & Profiles › Identifiers › **+** › App IDs › App
- Description: `Magic Sudoku`
- Bundle ID: **Explicit** → `com.osmanadali.sudoku`
- Capabilities: hiçbirini işaretleme → Register

### 2. App Store Connect'te uygulamayı aç
appstoreconnect.apple.com › Apps › **+** › New App
- Platform: iOS · Name: `Magic Sudoku: Creature Spells` (ad alınmışsa: `Magic Sudoku: Creature Puzzle` gibi)
- Primary Language: English (U.S.) · Bundle ID: `com.osmanadali.sudoku` · SKU: `magic-sudoku`

### 3. AdMob'da uygulama ve 2 reklam birimi
admob.google.com › Apps › Add app › **iOS** › "Is the app listed?" **No** › App name: `Magic Sudoku`
- Uygulama kimliğini kopyala: `ca-app-pub-…~…`
- Ad units › Add › **Interstitial** (ad: `sudoku_interstitial`) → `ca-app-pub-…/…`
- Ad units › Add › **Rewarded** (ad: `sudoku_rewarded`, ödül: 2 hint) → `ca-app-pub-…/…`
- Mağazada yayınlanınca AdMob'da uygulamayı App Store kaydına bağla (Apps › App settings › Link).

Bu üç kimliği bana gönder (gizli değil) ya da kendin `codemagic.yaml` › `sudoku-ios` › `vars` altına yaz. Kimlikler boşken derleme bilerek durur, çünkü test reklamlı bir sürüm mağazaya gitmemeli.

### 4. GitHub Pages (gizlilik sayfası için)
Ray'in rehberindeki gibi: Settings › Pages › Source: GitHub Actions, sonra Actions › **Web (Pages)** › Run workflow.
Gizlilik sayfası `…/mobil-oyun/sudoku/privacy.html` adresinde yayına girer. Oyunun tarayıcı sürümü de `…/mobil-oyun/sudoku/` adresinde açılır.

### 5. Codemagic'te derle ve yükle
Codemagic › mobil-oyun › Start new build › branch: bu dal (ya da birleştirildikten sonra main) › workflow **Magic Sudoku iOS**.
- Apple anahtarları Ray'in `ray_ios` grubundan gelir, yeni gizli değer gerekmez.
- Her yeni yüklemede `BUILD_NO` değerini 1 artır.
- 10-30 dk sonra TestFlight'ta görünür. Önce kendi telefonunda dene.

### 6. App Store Connect formları
- **App Privacy:** Data Used to Track You → Identifiers › Device ID; Data Linked/Not linked → Usage Data (Advertising Data, Product Interaction), Diagnostics. Hepsi "Third-Party Advertising" amaçlı (AdMob). Ray'deki cevaplarla aynı, yalnız Analytics yok.
- **Yaş derecelendirmesi:** kumar, şiddet, sohbet yok → 4+ çıkar; reklam olduğu için Apple 4+ verse de AdMob içeriği PG ile sınırlı.
- **Ekran görüntüleri:** iPhone 6,9" (1320×2868) ve iPad 13" (2048×2732). Bunları ben test robotuyla 9 dilde üretebilirim.
- **Açıklama ve anahtar kelimeler:** 9 dilde ben hazırlarım; Ray'in `tools/ios/metin.cjs` aracıyla App Store Connect'e API'den yüklenebilir.

## Teknik
- `npm ci && npx cap add ios && npx @capacitor/assets generate --ios && bash tools/ios-hazirla.sh && npx cap sync ios` (Codemagic hepsini yapar; `ios/` depoda yok).
- Simge ve açılış ekranı: `assets/icon-only.png`, `assets/splash*.png` (oyun görsellerinden üretildi).
- Test: `npm test` (sudoku klasöründe) → 49 kontrol: üretici, oynanış, 4 ekran, 9 dil, performans.
