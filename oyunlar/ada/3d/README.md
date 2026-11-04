# Ada — 3D (Blender)

Ortam ve render hattı Blender 4.2 LTS ile başsız (headless) Python betikleriyle üretilir. Karakterler daha sonra görselden-3D servisinden `.glb` olarak gelecek; `render_glb.py` onları bu ortamda render eder.

## Dosyalar
- `ortam_uclu_kopru.glb`: Üçlü Köprü parkuru (Unity'ye girecek ortam, ~1.7 MB, ~59k üçgen)
- `render/ortam_oyun_kamerasi.png`, `render/ortam_genis_plan.png`: 1080x1920 dikey görseller (oyun kamerası ve geniş plan)
- `render/test_manken/`: render hattının yer tutucu mankenle test çıktısı
- `scripts/build_env.py`: ortamı prosedürel kurar, `.glb` dışa aktarır, iki görseli render eder
- `scripts/render_glb.py`: herhangi bir karakter `.glb` dosyası için dönüş görselleri ve animasyon klipleri üretir
- `scripts/make_test_mannequin.py`: test için kapsüllerden yapılmış iskeletli manken (oyun varlığı değil)

## Kurulum
Blender 4.2 LTS Linux sürümünü indirip açın (ek Python paketi gerekmez):
```
curl -O https://download.blender.org/release/Blender4.2/blender-4.2.3-linux-x64.tar.xz
tar xf blender-4.2.3-linux-x64.tar.xz && rm blender-4.2.3-linux-x64.tar.xz
B=$PWD/blender-4.2.3-linux-x64/blender
```

## Komutlar (`oyunlar/ada/3d` klasöründen)
```
# Ortam: glb + 2 görsel (4 CPU'da ~4,5 dk). Sadece glb için: --no-render
$B -b -P scripts/build_env.py -- --samples 48

# Karakter: dönüş görselleri (ön, 3/4, yan, arka) ve her animasyon için 540x960 MP4
$B -b -P scripts/render_glb.py -- --glb kerem.glb --name kerem --height 1.84
#   --no-anim: yalnız dönüş görselleri   --no-env: klipler ortam yerine sade gökyüzü önünde
#   --max-frames 96: klip başına üst sınır   --samples / --anim-samples: Cycles örnek sayısı
#   Çıktı: render/<name>/  (<name>_on|_34|_yan|_arka.png, <name>_donus_tablosu.png, <name>_<animasyon>.mp4)

# Hattı test etmek için yer tutucu manken
$B -b -P scripts/make_test_mannequin.py -- /tmp/manken.glb
```
`render_glb.py` modeli ayakları zemine (z=0) ve ortaya yerleştirir. Boy 0,3–4 m dışındaysa ya da `--height` verilmişse ölçekler. Dönüş görselleri bağlama (rest) pozunda alınır. Klipler başlangıç iskelesinin ucunda, arkada parkur görünecek şekilde, otomatik çerçevelenen kamerayla çekilir. Render motoru Cycles (CPU) ve OIDN gürültü gidericidir. Klip karesi ~5–9 sn sürer.

## Parkur ölçüleri (metre, Blender: Z yukarı, parkur +Y yönünde; Unity: Y yukarı, parkur +Z)
- Başlangıç iskelesi: y = −8…0, genişlik 3,2. Platform ve iskele üst yüzeyi z = 0,55. Su seviyesi 0, lagün tabanı −1,45.
- 5 sıra × 3 kare platform (1,3 × 1,3). Sıralar arası boşluk 1,6, sütunlar arası 1,2. Sütun merkezleri x = −2,5 / 0 / 2,5. Sıra merkezleri y = 2,25 / 5,15 / 8,05 / 10,95 / 13,85. Nesne adları `Platform_S<sıra>_K<sütun>`.
- Bitiş platformu: y = 16,1…20,6, genişlik 7,5. Damalı bayrak ve iki meşale üzerinde.

## Unity notları
- `.glb` için glTFast paketi (`com.unity.cloud.gltfast`) kullanın. Ölçek 1 birim = 1 m.
- Kum, deniz tabanı ve adalar renklerini köşe renginden (COLOR_0) alır. glTFast bunu destekler. Kendi shader'ınızı kullanacaksanız köşe rengini taban renkle çarpın.
- `Lagun_Su` alfa karışımlı basit bir malzemedir (%80 opak). Oyunda kendi su shader'ınızla (dalga, köpük) değiştirmeniz önerilir. Render'daki dalgacık efekti yalnız Blender'dadır.
- Gökyüzü, güneş ve kameralar glb'ye dahil değildir. Unity'de gökyüzünü gradyan skybox ile, güneşi sıcak tonlu (#FFE0B5) ve ~22° yükseklikte bir Directional Light ile verin.
