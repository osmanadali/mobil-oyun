# Ray — Metro Bulmaca

Tek elle, internetsiz oynanan sade bir bulmaca. Karoya dokun → ray 90° döner. Merkez istasyondan çıkan hattı tüm duraklara bağla, açıkta ray ucu kalmasın.

- **Çevrimdışı:** Bölümler cihazda üretilir (sonsuz, her zaman çözülebilir). Service worker ile PWA olarak da çalışır.
- **Reklam:** Yalnızca internet varken. Her 4 bölümde bir geçiş reklamı (5. bölümden sonra, en az 90 sn arayla) + ipucu bitince isteğe bağlı ödüllü reklam (+2 ipucu).
- **Tutundurma:** 3 yıldız (hedef hamle), Günün Hattı + gün serisi, her gün 3 ücretsiz ipucu, her 10 bölümde +2 ipucu, kademeli büyüyen ızgara (3×3 → 7×9).
- **Göz dostu:** Koyu/açık/otomatik tema, düşük kontrastlı yumuşak palet, animasyon sadece hareket varken çalışır (pil dostu).

## Çalıştır (tarayıcı)
```bash
npm run serve   # http://localhost:8080
```

## Android (Capacitor + AdMob)
```bash
npm install
npx cap add android
npx cap sync android
npx cap open android      # Android Studio → Run / Build APK-AAB
```
`android/app/src/main/AndroidManifest.xml` içine AdMob App ID eklenmeli:
```xml
<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="ca-app-pub-XXXX~YYYY"/>
```
`www/ads.js` içindeki test reklam kimliklerini kendi kimliklerinle değiştir, `isTesting` / `initializeForTesting` değerlerini `false` yap.

## Hakem (test + değerlendirme)
- **Test robotu:** `node tools/hakem.cjs` → oyunu gerçek tarayıcıda oynar; çözülebilirlik, 3 ekran boyutu × 2 tema, 12 bölüm oynanış, Günün Hattı/seri, ipucu, reklam akışı (sahte AdMob), boşta pil kullanımı, 4× yavaş CPU'da akıcılık, çevrimdışı açılış. Çıktı: `hakem-out/ozet.md`, ekran görüntüleri. Her push'ta GitHub Actions'ta da çalışır.
- **Yapay zekâ jürisi:** Claude Code'da `hakem` workflow'u (`.claude/workflows/hakem.js`) → robot + 4 hakem (oyuncu, tasarımcı, büyüme, teknik) → 100 üzerinden puan, yayın eşiği 80, öncelikli geliştirme listesi `docs/HAKEM_RAPORU.md`.

## Dosyalar
| Dosya | İş |
|---|---|
| `www/game.js` | Üretim, oyun döngüsü, çizim, kayıt |
| `www/ads.js` | Reklam soyutlaması (çevrimdışı → no-op) |
| `www/style.css` | Tema ve arayüz |
| `www/sw.js` | Çevrimdışı önbellek |
| `docs/RAPOR.md` | Pazar araştırması ve aşama raporları |
| `tools/hakem.cjs` | Test robotu |
| `docs/HAKEM_RAPORU.md` | Son jüri raporu |
