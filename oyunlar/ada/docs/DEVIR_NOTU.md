# Devir notu: önceki oturumdan Ada reposuna

Bu repo, `osmanadali/mobil-oyun` deposundaki `oyunlar/ada/` klasöründen geçmişiyle birlikte taşındı. Önceki Claude Code oturumunun bütün bağlamı burada özetlenmiştir. Yeni oturum önce bu dosyayı, sonra `README.md`, `unity/TEKNIK_TASARIM.md` ve `unity/FINAL_ATIS.md` belgelerini okumalıdır.

## Kullanıcı

- Türkçe konuşur, çoğunlukla telefondan (Claude uygulaması) takip eder.
- Kısa, net yanıt ister. Önceki oturumda "caveman ultra" (telgraf üslubu) açıktı. Teslim edilen belgeler normal Türkçe yazılır.
- **Düşük kredi ve limit kullanımı ister**, ama kaliteden ödün istemez. Gereksiz ajan ya da workflow açmayın.
- İşin baştan sona yapılmasını ister. Soru yalnız gerçekten gerekince sorulmalı.
- Geçmiş oyunları: "Ray" (metro bulmaca, mobil-oyun reposunda, arkadaşları çok sevdi), ayrıca Boğaz, Damla, Uçurtma prototipleri.

## Oyun: Ada

Dikey (9:16) mobil ezber parkuru. Oyuncu bir deseni ezberler, tropik ada parkurunda mini oyunlardan geçer ve en kısa sürede bitirir. Survivor'daki hafıza oyunundan ilham alındı; "Survivor" adı ve logosu kullanılmaz.

- **Etaplar:**
  - **Üçlü Köprü:** her sırada 3 platform, biri dolu; ezberle ve atla.
  - **Hedef Dizisi:** hedefleri sırayla vur.
  - **Dalış:** basılı tut = nefes tut.
  - **Final Atışı:** 3 hedef, sırasız.
- **Sıralama:** süre + cezalar − bonus. Haftalık lig, Günün Adası, hayalet yarışı.
- **Karakterler:** Kerem (1,84 m, buğday tenli, esmer, kırmızı takım, 12 numara) ve Deniz (1,70 m, mavi takım, 07 numara, atkuyruğu).
- **Motor:** Unity 6 URP, Android ve iOS, internetsiz çalışır, AdMob. Ücretsiz araç ve varlık tercih edilir.

## Durum

| Alan | Durum | Yer |
|---|---|---|
| Referans görseller | Onaylı (Nano Banana): karakter dönüş ve ifade tabloları, ortam konsepti, **onaylı final atış referansı** | `referans/` |
| Görsel üretim istemleri | Hazır | `README.md` |
| Ortam (Üçlü Köprü lagünü) | Blender'da prosedürel; GLB ve renderlar hazır | `3d/ortam_uclu_kopru.glb`, `3d/scripts/build_env.py` |
| Render hattı | `render_glb.py`: herhangi bir GLB için dönüş görüntüleri ve animasyon MP4'leri | `3d/scripts/` |
| Karakterler | Önceki oturumda bir ajan çalışıyordu (bkz. aşağı). Şekil: Hunyuan3D-2 (ücretsiz HF Space). Doku: referans projeksiyonu. İskelet ve animasyon: Quaternius UAL (CC0) | `3d/kerem.glb`, `3d/deniz.glb`, `3d/render/kerem/` |
| Web prototipi | Oynanabilir (Three.js): Üçlü Köprü, Hedef Dizisi, Final Atışı, tüm UI. Playwright'ta konsol hatası yok | `prototip/`. Yayın: https://claude.ai/artifact/3yL4HuV6Hhb9eGwzVBhs99 |
| Unity kodu | Köprü, atış (Rigidbody), dalış, kamera, HUD; 21 script. İki tur bağımsız incelemede 31 hata düzeltildi. **Derlenmedi** | `unity/Assets/Ada/Scripts/` |
| Teknik belgeler | Mimari, Animator tabloları, Shader Graph, kamera, game feel, yol haritası, Inspector kurulumu, final atış ve kabul testleri | `unity/TEKNIK_TASARIM.md`, `unity/FINAL_ATIS.md` |
| ChatGPT raporu | Kullanıcı ChatGPT ile de çalışıyor; durum raporu orada | `unity/RAPOR_CHATGPT.md` |
| Tasarım tuvali | Eski 2D taslak (kullanıcı beğenmedi) ve parkur, sıralama tasarımları | https://claude.ai/artifact/RtVmQDT5nenuBgxnDaCziN |
| Claude Code Game Studios | v1.2.0, bu reponun kökünde; motor Unity 6 olarak ayarlandı | `.claude/`, `CLAUDE.md`, `project.yaml` |

## Bekleyen kararlar ve işler

1. **CCGS kurulumu:** `/start` (onboarding) ve `/setup-engine unity`. Tam kurulumun ilk kez çalışacağı oturum bu.
2. **Karakterler:**
   - Önceki oturumdaki ajanın son çıktıları buraya da kopyalanmalı (önceki repo dalı: `claude/exciting-albattani-rqjkg4`, klasör `oyunlar/ada/3d/`).
   - Kerem'in dokulu T-poz modeli ve bekleme, koşu, zıplama, yüzme klipleri vardı.
   - Bilinen kusur: yan yüzeylerde ve kol altında projeksiyon lekeleri.
   - Daha temiz doku için ücretsiz HF hesabının `HF_TOKEN`'ı ile TRELLIS önerildi; kullanıcı henüz eklemedi.
3. **Kullanıcı kararı bekleniyor:** Hedef Dizisi'nin kontrolü de Final Atışı gibi "geri çek ve bırak" (sapan) olsun mu? Şu an prototipte Hedef Dizisi yukarı kaydırmayla oynanıyor.
4. **Karar verildi:** `mobil-oyun` reposundaki `oyunlar/ada/` klasörü kaldırılmayacak, olduğu gibi kalacak.
5. **Unity:**
   - Boş Unity 6 URP projesi kurulup kodlar derlenecek.
   - M1 Köprü → M2 Atış → M3 Su → M4 Görsel → M5 Cihaz (`TEKNIK_TASARIM.md` §9).
6. **Eksik varlıklar:**
   - hedef standı, iskele parçası, top
   - AimIdle ve nihai Throw animasyonu (önerilen: Mixamo)
   - sesler
   - Türkçe karakterli TMP font

## Teknik notlar

- **Blender 4.2:** Önceki oturumda geçici klasöre kurulmuştu; yeni oturumda `3d/README.md`'deki komutla yeniden indirilir. Cycles CPU, 4 çekirdekte kare başına 5–9 sn.
- **Ücretsiz 3D:**
  - `gradio_client` ile `tencent/Hunyuan3D-2` `/shape_generation` anonim olarak çalışıyor (dokusuz şekil).
  - Dokulu modeller (TRELLIS, Hunyuan 2.1) kota ya da PRO istiyor.
  - Meshy ve Tripo API'leri ücretli; kullanıcı ücretsiz yolu seçti.
- **Artifact yayını:** `.glb` sunulmuyor. Prototipi yayınlarken GLB base64 JSON'a gömülüp `GLTFLoader.parseAsync` ile çözülüyor.
- **Commit kuralı:** Commit sonuna şu satırlar eklenir:
  - `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
  - oturum bağlantısı (sistem hatırlatmasındaki).
