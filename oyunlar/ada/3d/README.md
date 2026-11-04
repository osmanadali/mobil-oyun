# Ada — 3D (Blender)

Ortam, karakterler ve render hattı Blender 4.2 LTS ile başsız (headless) Python betikleriyle üretilir. Karakter şekilleri ücretsiz Hugging Face Space "tencent/Hunyuan3D-2" ile görselden üretildi; doku, iskelet ve animasyon `rig_character.py` ile eklenir.

## Dosyalar
- `ortam_uclu_kopru.glb`: Üçlü Köprü parkuru (Unity'ye girecek ortam, ~1.7 MB, ~59k üçgen)
- `render/ortam_oyun_kamerasi.png`, `render/ortam_genis_plan.png`: 1080x1920 dikey görseller (oyun kamerası ve geniş plan)
- `render/test_manken/`: render hattının yer tutucu mankenle test çıktısı
- `scripts/build_env.py`: ortamı prosedürel kurar, `.glb` dışa aktarır, iki görseli render eder
- `scripts/render_glb.py`: herhangi bir karakter `.glb` dosyası için dönüş görselleri ve animasyon klipleri üretir
- `scripts/make_test_mannequin.py`: test için kapsüllerden yapılmış iskeletli manken (oyun varlığı değil)
- `kerem.glb` (31 998 üçgen, 1,84 m), `deniz.glb` (34 000 üçgen, 1,70 m): dokulu, iskeletli, 12 animasyonlu oyun karakterleri (~2,5 MB). 2048² taban renk dokusu (JPEG, gömülü), tek Principled malzeme. İskelet Quaternius UAL iskeleti (53 kemik, `DEF-*` adları), bağlama pozu T-poz.
- `ham/kerem_sekil_hunyuan2.glb`, `ham/deniz_sekil_hunyuan2.glb`: Hunyuan3D-2'den gelen dokusuz ham şekiller (A-poz)
- `animasyon_ual/`: kullanılan Quaternius UAL 1 ve UAL 2 dosyaları (CC0, bkz. `LICENSE.txt`)
- `scripts/rig_character.py`: ham şekil → temizlik, doku, iskelet, animasyon, `.glb`
- `render/kerem/`, `render/deniz/`: dönüş görselleri ve ortamda 540x960 klipler (Bekleme, Kosu, Ziplama, Yuzme, Atis, Zafer)

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

## Karakterler: animasyonlar
Kaynak: Quaternius Universal Animation Library (UAL 1 ve UAL 2, CC0). Hepsi yerinde (root motion yok), 30 fps. Kare aralıkları iki karakterde aynı:

| Ad | Kaynak | Kare | Döngü |
|---|---|---|---|
| Bekleme | UAL1 Idle_Loop | 0–75 | evet |
| Kosu | UAL1 Jog_Fwd_Loop | 0–28 | evet |
| Sprint | UAL1 Sprint_Loop | 0–20 | evet |
| Ziplama | UAL1 Jump_Start + Jump_Loop (0–18) + Jump_Land | 0–98 | hayır |
| Ziplama_Basla / Ziplama_Havada / Ziplama_Inis | aynı üç parça ayrı ayrı (oyunda fizikle birleştirmek için) | 0–40 / 0–75 / 0–38 | Havada: evet |
| Yuzme | UAL1 Swim_Fwd_Loop | 0–40 | evet |
| Yuzme_Bekleme | UAL1 Swim_Idle_Loop | 0–100 | evet |
| Atis | UAL2 OverhandThrow | 0–40 | hayır |
| Zafer | UAL1 Dance_Loop | 0–30 | evet |
| Takla | UAL1 Roll | 0–44 | hayır |

UAL 2'nin `.glb` dosyası Unreal kemik adları kullanır (`pelvis`, `upperarm_l` …). İskelet geometrisi UAL 1 ile birebir aynı olduğundan betik kemikleri dinlenme konumuna göre eşler ve dönüşleri UAL 1 adlarına aktarır. Zıplamanın yüksekliği oyunda fizikten gelmeli. Klipteki yay yalnızca render içindir (`--lift`).

## Karakterleri yeniden üretmek (`oyunlar/ada/3d` klasöründen)
```
$B -b -P scripts/rig_character.py -- --char kerem          # ~1 dk; deniz için --char deniz
#   --stages prep,texture,rig,anim (varsayılan hepsi)   --work /tmp/rig_kerem (ara .blend dosyaları)
$B -b -P scripts/render_glb.py -- --glb kerem.glb --name kerem --height 1.84 \
   --actions Bekleme,Kosu,Ziplama,Yuzme,Atis,Zafer --loops Bekleme,Kosu,Yuzme,Zafer \
   --water Yuzme --lift Ziplama:3:50:0.7                   # klip başına ~4-8 dk (4 CPU)
```
Adımlar:
1. **prep:** tek kabuk, ~32-34k üçgene indirgeme, gerçek boy, ayaklar z=0'da, yüz −Y.
2. **texture:** Smart UV. `referans/gorunumler/*_on|arka|yan.png` ortografik olarak yansıtılır. "yan" görseli Kerem'de sol, Deniz'de sağ yüzü gösterir; öbür yan aynalanır. Kamera çerçevesi siluet eşleştirmesiyle (IoU) hizalanır. Baş ayrıca hizalanır, yan görünümde yalnız yüz yarısıyla. Yüzey başına, kameraya bakma oranıyla harmanlanır. Hiçbir kameranın iyi göremediği yerler komşu dokuyla doldurulur.
3. **rig:** Kesitlerden omuz, dirsek, bilek, kalça, diz, ayak bileği, boyun ve kasık noktaları bulunur. UAL iskeleti bu noktalara oturtulur (kemik yönleri ve roll UAL ile aynı). Kopya iskelet A-poza getirilip otomatik ağırlıkla bağlanır. Mesh T-poza çevrilir ve asıl T-poz iskelete yeniden bağlanır. Deniz'in at kuyruğu yalnız `DEF-head` kemiğine bağlıdır.
4. **anim:** Eylemler UAL dosyalarından örneklenir ve `.glb` dışa aktarılır.

## Unity notları (karakterler)
- glTFast ile içe aktarın. Animasyonlar `.glb` içindeki adlarla gelir (Kosu, Atis …). Mecanim için içe aktarma ayarında *Animation Method: Mecanim* seçin.
- Humanoid avatar: hiyerarşi standart insan yapısında ve dinlenme pozu T-poz olduğu için eşleme doğrudan yapılır. Eşleme şöyle: Hips `DEF-hips`; Spine/Chest/UpperChest `DEF-spine.001/.002/.003`; Neck `DEF-neck`; Head `DEF-head`; Shoulder `DEF-shoulder.L/R`; UpperArm `DEF-upper_arm`; LowerArm `DEF-forearm`; Hand `DEF-hand`; UpperLeg `DEF-thigh`; LowerLeg `DEF-shin`; Foot `DEF-foot`; Toes `DEF-toe`; parmaklar `DEF-f_*` ve `DEF-thumb.*`. `root` kemiği deform etmez. Böylece UAL'in Unity sürümündeki (`animasyon_ual` dışında, quaternius.com) Humanoid klipleri de aynı avatarla oynatılabilir.
- Ölçek 1 birim = 1 m. Model glTF ön yönü olan +Z'ye, yani Unity'de `transform.forward` yönüne bakar. Parkur yönünde koşması için kökü kontrol betiğinde döndürün.
- Bilinen kusurlar: Doku yansıtmadır. Kollar ve at kuyruğu gibi referans görünümlerin göremediği yerler komşu renkle doldurulmuştur. Koltuk altı, omuz üstü, el sırtı ve şortun yanında hafif lekeler ya da düz renkli bölgeler vardır. Kerem'in askılarının üstünde gözlük ipinden gelen ince koyu bir şerit kalır. Deniz'in at kuyruğu ucunda koyu çizgiler ve şakağında küçük bir iz vardır.

## Parkur ölçüleri (metre, Blender: Z yukarı, parkur +Y yönünde; Unity: Y yukarı, parkur +Z)
- Başlangıç iskelesi: y = −8…0, genişlik 3,2. Platform ve iskele üst yüzeyi z = 0,55. Su seviyesi 0, lagün tabanı −1,45.
- 5 sıra × 3 kare platform (1,3 × 1,3). Sıralar arası boşluk 1,6, sütunlar arası 1,2. Sütun merkezleri x = −2,5 / 0 / 2,5. Sıra merkezleri y = 2,25 / 5,15 / 8,05 / 10,95 / 13,85. Nesne adları `Platform_S<sıra>_K<sütun>`.
- Bitiş platformu: y = 16,1…20,6, genişlik 7,5. Damalı bayrak ve iki meşale üzerinde.

## Unity notları
- `.glb` için glTFast paketi (`com.unity.cloud.gltfast`) kullanın. Ölçek 1 birim = 1 m.
- Kum, deniz tabanı ve adalar renklerini köşe renginden (COLOR_0) alır. glTFast bunu destekler. Kendi shader'ınızı kullanacaksanız köşe rengini taban renkle çarpın.
- `Lagun_Su` alfa karışımlı basit bir malzemedir (%80 opak). Oyunda kendi su shader'ınızla (dalga, köpük) değiştirmeniz önerilir. Render'daki dalgacık efekti yalnız Blender'dadır.
- Gökyüzü, güneş ve kameralar glb'ye dahil değildir. Unity'de gökyüzünü gradyan skybox ile, güneşi sıcak tonlu (#FFE0B5) ve ~22° yükseklikte bir Directional Light ile verin.
