> **Diğer oturuma yapıştırılacak görev (kısa):**
> `claude/epic-albattani-jbmonn` dalını çek ve `kut/GORSEL_ISTEK_3.md` dosyasını baştan sona oku. Oradaki 64 görselin hepsini sırayla (1'den 64'e) robotla (GPT görsel) üret. Her komutun başına dosyadaki ortak girişi ve köşeli parantezle anılan ekleri koy; listedeki referans görselleri ekle. Görsellerde hiç yazı olmasın, arka plan şeffaf olsun (arka plan görselleri, dokular, [IŞIK] ekli ışık görselleri ve #63 vinyet hariç; onların zemini komutta yazılı). Dosyaları verilen adlarla, `_a` / `_b` çeşitleriyle `kut/gelen_gorsel/` altına PNG olarak koy. Set görsellerini kesme, olduğu gibi koy. Başka dosyaya dokunma. Bitince tek commit yap (`Kut Arena: arayüz kiti görselleri (robot, GORSEL_ISTEK_3)`) ve aynı dala push et.

# Kut Arena: arayüz kiti görsel istek listesi 3 (robot / GPT görsel)

**Kural (kullanıcıdan):** Oyunda tasarımsız, elle CSS ile yapılmış hiçbir yer kalmayacak. "Bir arka plan ve yazı" yetmez; her parça aynı elden çıkmış gibi durmalı. Bütünlük her şeyden önce gelir.

Tarayıcı taraması oyunda 229 düz CSS ya da düz SVG öğe buldu; tamlık denetimi (ekran ekran ikinci tarama) bunlara canvas ile çizilen 3D arayüz parçalarını, eski `ik_*` ikonlarını ve CSS filtreyle yapılmış durumları ekledi. Bu belge hepsini **64 görsele** indirir. Görsellerin çoğu birden çok parça taşıyan **set** görselidir (toplam 225 parça: 211 set parçası ve 14 tek görsel). Aynı parça birçok ekranda kullanılır. Örneğin `satir_plaka` Kodeks'te soy satırı, Ayarlar'da ayar satırı, Hasar özeti'nde kahraman satırı ve maç sonunda lobi sıralaması olur.

Bu kit şunların yerine geçer:
- eski `kut/arayuz/ui/w_*` seti (`w_panel`, `w_dugme_*`, `w_kut_*`, `w_kart_k1..3`, `w_gunbatimi`);
- eski `kut/arayuz/ui/ik_*` ikonları (`arayuz.js` `IK_RESIM`: `ik_altin`, `ik_kalp`, `ik_kalp_bos`, `ik_kupa`, `ik_tac`, `ik_yildiz_altin`). Bunlar robot ikonlarından ayrı bir tarzda (düz altın sikke, düz kırmızı kalp) ve bugün dükkân fiyatında, Yenile / Deneyim düğmesinde, ayrıntı kartında robot `ikon_altin` ile aynı ekranda yan yana duruyor. Karşılıkları "Yeni görsel istenmeyen" bölümündedir;
- oyundaki tek renk SVG ikonlar (`#i-kilic`, `#i-tac`, `#i-kitap`…) ve emojiler;
- CSS gradyan kutular, haplar ve çubuklar; CSS `filter: grayscale` ile yapılmış durumlar (boş kalp, alınamayan kart, pasif düğme);
- `sahne3d.js` içinde canvas ile çizilen 3D arayüz parçaları (birim can çubuğu, kalkan deseni, yıldız rozeti, taraf diski, karo, konuşma balonu).

Mevcut robot görselleri (`dugme_oyna`, `dugme_ikincil`, `dugme_savas`, `dugme_yuvarlak`, `menu_panel`, `hud_*`, `ikon_*`, `profil_cerceve`) kitin **ölçüsüdür**. Yeni her parça onlarla aynı malzemeden olmalı.

## Tarz referansları (her isteğe ekle)

Komutla birlikte şu dosyaları referans görsel olarak ekle:

- **Düğme ve panel dili** (her komutta; [SAHNE] ve [IŞIK] komutlarında yalnız kendi listeleri eklenir): `kut/web/arayuz/menu/dugme_oyna.webp`, `dugme_ikincil.webp`, `menu_panel.webp`, `hud_ust_serit.webp`, `hud_altin_rozet.webp`.
- **İkon dili** (ikon ve amblem komutlarında ayrıca): `kut/web/arayuz/menu/ikon_ayarlar.webp`, `ikon_yenile.webp`, `ikon_kilit.webp`, `ikon_can.webp`, `ikon_bilgi.webp`.
- **Yuvarlak ve madalyon dili** (madalyon, KUT, halka komutlarında ayrıca): `kut/web/arayuz/menu/dugme_yuvarlak.webp`, `hud_saat.webp`, `hud_portre_cerceve.webp`. (`profil_cerceve` taş ve yaprak süslüdür; yalnız oyuncu avatarına özgü kalsın, referans olarak eklenmez.)
- **Işık dili** ([IŞIK] ekli komutlarda): `kut/web/arayuz/menu/karsilama_arka.webp`, `mvp_arka.webp` (yalnız ışığın rengi ve yumuşaklığı için).
- **Sahne dili** (mod kartları ve arka planlarda ayrıca): `kut/gorsel/arena_konsept.webp`, `kut/web/arayuz/menu/karsilama_arka.webp`.

Malzeme dili kısaca:
- cilalı sıcak altın çerçeve, yumuşak eğim (bevel) ve parlak kenar ışığı;
- uçlarda ve köşelerde dört köşeli altın yıldız yuvasına oturmuş küçük, yontulmuş mor kristal taşlar;
- içte koyu menekşe-mor, parlak cam yüzey, çok hafif bulut dokusu ve yumuşak iç ışıma.

### Ortak giriş: [GİRİŞ] (her komutun başına yaz)

```
Match the exact art style, materials, colors and lighting of the attached reference UI images. Hand-painted stylized fantasy mobile game UI, premium quality, same family as the references: polished warm gold frames with a soft bevel and bright rim highlights, small faceted violet crystal gems set in four-pointed gold star mounts, deep violet-purple glossy glass surfaces with a very subtle cloudy texture and a soft inner glow. Straight front view, flat even lighting from the top, crisp clean edges, no perspective, no tilt. Fully transparent background (real alpha), no backdrop, no cast shadow, no scene around the object. NO TEXT, NO LETTERS, NO NUMBERS, NO LOGO, NO watermark. No human faces or human body parts, no real-world culture, religion or nation symbols (no crosses, no real alphabets, no real runes).
```

### Ekler (komutta köşeli parantezle anıldığında, o yere aynen yaz)

**[9-SLICE]**: her yönde esneyecek çerçeve, panel ve plakalar için.
```
9-SLICE READY: ornaments ONLY inside the four corners; NO ornament, gem or bump in the middle of any edge; the edges between the corners are perfectly straight with a uniform thickness so they can stretch; any inner fill is one smooth even color with no spots, no texture detail, no vignette and no inner rectangle lines, so stretching shows no seams. Leave a small empty transparent margin around the object.
```

**[3-SLICE]**: yalnız yatay esneyecek düğme, şerit ve haplar için.
```
3-SLICE READY (horizontal): all ornaments, gems and end caps stay inside the left 20% and the right 20%; the middle 60% is perfectly uniform from left to right (same height, same colors, no ornament, no change along its length) so it can be stretched horizontally without seams. Leave a small empty transparent margin around the object.
```

**[SET n, düzen]**: tek görselde birden çok ayrı parça. `n` ve `düzen` komutta yazılıdır.
```
SPRITE SHEET: exactly {n} separate items arranged {düzen}, all at the same scale and in the same style, evenly spaced on one empty background (fully transparent; pure black instead when this sheet is a [IŞIK] light sheet) with wide empty gaps between them; no item touches another item or the image border; no labels, no numbers, no grid lines, no boxes or panels behind the items.
```

**[DURUM n]**: aynı nesnenin durumları, alt alta.
```
STATE SHEET: the SAME object drawn {n} times, stacked vertically from top to bottom, with an identical outline, size and proportions in every row; only the colors and lighting change as listed; wide empty transparent gaps between the rows.
```

**[İKON]**: ikon ve amblem komutlarında.
```
ICON STYLE: chunky sculpted polished-gold icons with violet crystal accents, same family as the attached ikon_ayarlar, ikon_yenile, ikon_kilit and ikon_can; bold readable silhouette that still reads at 24 px; thin dark-bronze outline; soft top-left highlight; no background disc or plate unless asked.
```

**[SAHNE]**: yalnız arka plan görsellerinde, [GİRİŞ] yerine yaz (`GORSEL_ISTEK.md` ile aynı).
```
Match the exact art style, colors and lighting of the attached reference images. Stylized hand-painted 3D fantasy game art, rich and cinematic, premium mobile/PC game quality (not childish, not cartoon-flat). Purple-violet dusk sky, warm gold accents, glowing magic crystals, floating island arena. Creatures are NOT human: no human faces, no gender cues, no real-world culture, religion or nation symbols. NO TEXT, NO LOGO, NO UI, NO watermark.
```

**[IŞIK]**: yalnız ışık, parıltı ve 3D ışık decal'lerinde (#37, #54, #56, #57), [GİRİŞ] yerine yaz. [GİRİŞ] her görsele altın çerçeve ve mor taş ister; ışık huzmesine çerçeve takılmasın diye bu görsellerde kullanılmaz. Zemin şeffaf değil **saf siyahtır**: robotun şeffaf zemini yumuşak ışımayı sert kenarla keser. Oyun bu görselleri "screen" / toplamalı (additive) karışımla koyar; siyah görünmez, ışık yumuşak kalır.
```
Soft painted light-effect sprite for a fantasy mobile game, same warm gold and violet palette and hand-painted finish as the attached reference UI images, but ONLY light: no frame, no gems, no metal, no object, no glass. Pure solid black background (#000000) everywhere outside the light, opaque image, no transparency. Smooth feathered falloff from bright to black with no hard edges, no banding, no noise. Centered, perfectly symmetric when the item is round. NO TEXT, NO LETTERS, NO NUMBERS, NO LOGO, NO watermark.
```

## Kit kuralları

- **Tuval:** robotun verdiği boyutlardan en yakını: kare 1024×1024, yatay 1536×1024, dikey 1024×1536. Arka planlarda en büyük yatay boyutu seç. Nesneyi verilen oranda ve ortalı çiz, kalan yer şeffaf kalsın. Kırpmayı Claude yapar.
- **Şeffaflık:** arka plan görselleri, dokular, [IŞIK] ekli görseller (siyah zemin) ve #63 vinyet (beyaz orta) dışında hepsi şeffaf PNG. Şeffaf zemin seçeneğini aç; beyaz ya da gri zeminli çıktıyı koyma.
- **Yarı saydam dolgu yok:** robot "yüzde 80 opak cam" gibi yarı saydam iç dolguyu güvenilir çizemiyor; ya tam opak ya tam şeffaf veriyor. Bu yüzden iç dolgular ya **tam opak** (panel, plaka, düğme) ya **tam şeffaf** (yalnız çerçeve) istenir. Saydamlık gerekiyorsa oyun verir (çerçeve ve doku ayrı katman olduğu için).
- **Tuvale sığma:** setlerde parçaların toplam boyu tuvalin yaklaşık %85'ini geçmesin; parçalar arasında ve kenarda geniş boşluk kalsın. Oranlar buna göre seçildi; robot sığdıramazsa parçaları küçült, oranı bozma.
- **Yazı yok:** "OYNA", "BAŞLA", sayılar, harfler hiçbir görselde olmayacak; yazıyı oyun koyar. Soru işareti, ünlem ve onay işareti yalnız komutta açıkça istendiği ikonlarda bulunur.
- **Aile tutarlılığı:** bir ailenin ilk görseli beğenilince sonraki komutlara referans olarak eklenir. Komutta "attach it" diye geçen yer bunu ister. Örneğin #20 için #19'un, #31 için #30'un çıktısı eklenir. Mevcut robot görseline bağlı aileler: #28 dolgular `hud_can_dolgu_*` ile, #46'daki boş kalp `ikon_can` ile, #48'deki hız ikonları `ikon_hiz` ile, #51 `dugme_savas` ile, #23 plakalar `hud_altin_rozet` ile birebir aynı biçimde çizilir. Üç mod kartını (#1–#3) aynı sohbette sırayla üret; #2 ve #3'e #1'in çıktısını ekle.
- **Çeşit sayısı:** Öncelik 1 ve 2'de her görselin iki çeşidi (`_a`, `_b`); Öncelik 3 ve 4'te bir çeşidi (`_a`) yeter. Beğenmediğin çeşidi koyma.
- **Set dosyaları kesilmez.** Set görseli `<ad>_a.png` olarak tek dosya gelir. Parçalara ayırma, webp'ye çevirme ve oyuna bağlama işini Claude yapar. Parça adları her başlıkta "Parçalar" satırındadır.

---

# ÖNCELİK 1: Mod seç penceresi ve çekirdek kit

Kullanıcının örnek şikâyeti buradaydı: Arena / Lobi Maçı / Hızlı Maç kartları düz mor gradyan kutu ve yazıydı; "Başla" düğmeleri CSS haptı. Ayrıca pencere çerçevesi, başlık ve ikonlar bu bölümde çözülür, çünkü bütün pencereler bunları kullanır.

## 1. Mod kartı: Arena: `mod_kart_arena`
- Dikey **4:5** (tuval 1024×1536, kart ortada yaklaşık 900×1125; çevresinde her yönde şeffaf boşluk kalsın, kart tuvalin kenarına değmesin, yoksa robot kenarı kırpar). Sabit oranlı, 9-slice değil. Kartın dışı şeffaf.
- Kartın üst %45'i sahne illüstrasyonu, alt %55'i yazı ve Başla düğmesi için boş, koyu mor cam alan. İki bölümün sınırının ortasına oyun madalyonu (#4) koyar; orası boş kalsın.
- Ek referans: `kut/gelen_gorsel/canavar_kumAkrebi_a.png`, `canavar_tasKabuk_a.png`, `canavar_gokBalinasi_a.png` (silüetler bunlara benzesin).
```
[GİRİŞ] Vertical collectible game-mode card, 4:5 portrait, centered with a wide empty transparent margin around it (the card must not touch the image border). Ornate polished gold frame with carved filigree corners and a small violet crystal gem in each corner, plus a larger warm AMBER-GOLD crystal gem set at the top center of the frame. Inside the frame: the TOP 45% is a painted scene window, the BOTTOM 55% is a calm, smooth, empty dark violet glass panel; a thin gold divider line separates them. Scene: a round stone battle arena on a floating island at golden dusk, seen from a low angle, carved arches with gold inlay, purple crystals, warm volumetric light rays, and three large dark monster silhouettes looming in the warm haze behind the arena: a giant sand scorpion, a hulking stone-shelled beast and a sky whale far above. Keep the middle of the divider line clear (a round medallion will be placed there). The bottom panel stays empty and even (text and a button will be placed on it). Warm gold and amber mood.
```
- **Nerede:** `.modSec .modK.m-arena` kart zemini. Şimdiki gradyan zemin, gradyan kenarlık ve `--mr` parıltısı kalkar. Pencere 1180×820'de kart yaklaşık 272×340 olur (oran 4:5'e geçer).

## 2. Mod kartı: Lobi Maçı: `mod_kart_lobi`
- #1 ile aynı ölçü ve yerleşim. #1'in çıktısını ekle.
```
[GİRİŞ] Use the EXACT same card frame, size and layout as the attached first card; only the scene, the top gem color and the light color change. Top center gem: AMETHYST violet. Scene: a circular stone dais under a deep violet dusk sky; at its center a glowing amethyst crystal with a floating gold crown above it; around it a ring of EIGHT small stone pedestals, each holding a faint violet ghost flame (eight rivals), soft violet light, mysterious and competitive mood. Middle of the divider clear, bottom panel empty dark violet glass.
```
- **Nerede:** `.modSec .modK.m-lobi` kart zemini.

## 3. Mod kartı: Hızlı Maç: `mod_kart_hizli`
- #1 ile aynı ölçü ve yerleşim. #1'in çıktısını ekle.
```
[GİRİŞ] Use the EXACT same card frame, size and layout as the attached first card; only the scene, the top gem color and the light color change. Top center gem: TURQUOISE. Scene: an ornate gold hourglass with glowing turquoise sand standing on the edge of a floating island, a crackling turquoise lightning bolt striking across it, swift wind streaks and small teal crystals, cool turquoise-teal light with gold accents, energetic mood. Middle of the divider clear, bottom panel empty dark violet glass.
```
- **Nerede:** `.modSec .modK.m-hizli` kart zemini.

## 4. Madalyon yuvası: `madalyon_yuva`
- Kare (tuval 1024×1024). Sabit oran. Ortası sakin; üstüne ikon ya da amblem konur.
- Ek referans: `dugme_yuvarlak.webp`, `hud_saat.webp`.
```
[GİRİŞ] Round emblem medallion socket: a thick polished gold ring with carved filigree, a violet crystal gem in a four-pointed gold star mount at the top and a smaller one at the bottom, the inner disc deep violet glossy glass with a soft radial inner glow; the center area plain and calm so an icon can be placed on top. Front view.
```
- **Nerede:** `.modK .modIk` (mod kartı madalyonu; CSS radyal daire ve halkalar kalkar), `.yukEkran .ipucu` madalyonu, `.sonSerit .mad.l` / `.mad.r`, `.ogrPor` (öğretici rehberi), `#kodeks .kodUst .rozet .top`, `.kut .el` zemini, seviye madalyonu (`#mac .dukkanSol .xpBtn` yanı, ARAYUZ_V2 §4.5).

## 5. Mod amblemleri: `amblem_mod_set`
- Yatay (tuval 1536×1024), üç amblem yan yana. Her biri bir dairenin içine sığar; #4'ün üstüne oturur.
- Parçalar: `amblem_arena`, `amblem_lobi`, `amblem_hizli`.
```
[GİRİŞ] [İKON] [SET 3, in one horizontal row] Three game-mode emblems: 1) ARENA: two crossed swords with gold hilts and violet gems over a round gold shield; 2) LOBBY: a gold crown with a violet gem, encircled by a ring of eight small glowing violet crystals; 3) QUICK MATCH: a gold hourglass with glowing turquoise sand and a turquoise lightning bolt crossing it. Each emblem fits inside a circle.
```
- **Nerede:** `.modK .modIk .ik` (şimdi üç ayrı dilde: SVG `#i-kilic`, PNG taç, SVG `#i-oyna`). Lobi amblemi ayrıca lobi listesi başlığında ve küçük boyda `.rakipKim .lbS`'de (lobi için tek simge budur; #46'daki eski `ikon_lobi` kaldırıldı). Arena amblemi `ikon_savas` (#47) ile aynı çapraz kılıç fikrini taşır; ikisi aynı sohbette üretilirse kılıç biçimi ortak olur.

## 6. Küçük altın düğme: `dugme_altin_kucuk_set`
- Dikey (tuval 1024×1536), üç durum alt alta. Her durum yaklaşık 4:1. [3-SLICE].
- Parçalar: `dugme_altin_kucuk`, `dugme_altin_kucuk_basili`, `dugme_altin_kucuk_pasif`.
```
[GİRİŞ] [DURUM 3] Small primary game button, horizontal rounded pill about 4:1, same material as the attached dugme_oyna: polished gold frame with a small violet crystal gem cap at the LEFT end and at the RIGHT end only, inner surface glossy warm gold-to-amber with a soft top highlight band and a slightly darker bottom lip for depth. Row 1 NORMAL. Row 2 PRESSED: same shape, surface a little darker, highlight band lower and thinner, inner shadow along the top. Row 3 DISABLED: same shape, desaturated warm grey-stone surface, dull grey-bronze frame, unlit grey gems, no glow, fully opaque. [3-SLICE]
```
- **Nerede:** `.modK .modGir` (Başla), büyük olmayan bütün `.btn.altin` (Kaydet, Tamam, Dövüştür, `#pencere .eylemler .btn.altin`), `.pencere .btn[disabled]` ve `.btn.altin:disabled` (pasif hâl; `opacity .5 + grayscale` kalkar). `dugme_oyna` yalnız büyük OYNA / DEVAM ET / Yeniden oyna düğmesinde kalır (küçük boyda orta elmasları esneyip çizgiye dönüyordu).

## 7. Mor (ikincil) düğme seti: `dugme_mor_set`
- Dikey (tuval 1024×1536), beş durum alt alta. Her durum yaklaşık 4,5:1. [3-SLICE]. Mevcut `dugme_ikincil`'in yerine geçer (gerilince içinde dikdörtgen dikiş çizgileri görünüyordu).
- Parçalar: `dugme_mor`, `dugme_mor_basili`, `dugme_mor_secili`, `dugme_mor_pasif`, `dugme_hayalet`.
```
[GİRİŞ] [DURUM 5] Secondary game button, horizontal rounded pill about 4.5:1, same family as the attached dugme_ikincil: polished gold rim, a small violet crystal gem cap at the left end and at the right end only, inner surface deep violet glossy glass with a soft top highlight band; the inner violet fill is perfectly flat along the middle with no inner rectangle line. Row 1 NORMAL. Row 2 PRESSED: darker violet, highlight lower, inner shadow along the top. Row 3 SELECTED: same shape, brighter and thicker glowing gold rim with a warm gold outer glow, gems lit bright, violet surface slightly lighter. Row 4 DISABLED: dull grey-violet stone surface, dull bronze rim, unlit grey gems, fully opaque, no glow. Row 5 GHOST: only a thin gold outline pill with tiny gem caps, the inside completely EMPTY and fully transparent (no fill at all). [3-SLICE]
```
- Hayalet satırının içi bilerek boş: hafif koyu zemini oyun altına koyar (robot yarı saydam dolguyu güvenilir çizemiyor).
- **Nerede:** bütün `.btn.mor`; seçili → `#aHedef .btn.altin.secik`, `#sOzet.secik` (şimdiki dikdörtgen lila çerçeve kalkar); pasif → `.btn.mor:disabled`; hayalet → Vazgeç / İptal / Kapat metin düğmeleri ve `.ogrDug .atla` (#ogrAtla).

## 8. Renkli düğmeler: yakut ve gün batımı: `dugme_renk_set`
- Dikey (tuval 1024×1536), dört satır. Biçim #7 ile birebir aynı; #7'nin çıktısını ekle.
- Parçalar: `dugme_yakut`, `dugme_yakut_basili`, `dugme_gunbatimi`, `dugme_gunbatimi_basili`.
```
[GİRİŞ] [DURUM 4] The SAME button shape as the attached secondary button (horizontal pill about 4.5:1, polished gold rim, gem caps at the left and right ends only). Row 1 RUBY: deep crimson-burgundy glossy glass surface, ruby red gems. Row 2 RUBY PRESSED: darker, inner shadow on top. Row 3 SUNSET: glossy surface with a vertical gradient from warm golden yellow at the top through orange and coral pink to magenta-violet at the bottom, rose-gold gems, a faint warm sparkle. Row 4 SUNSET PRESSED. [3-SLICE]
```
- **Nerede:** yakut → `#aCik.btn.sat` (Ana menüye dön; şimdi mor görsel üstünde pembe yazı), duraklatma paneli "Maçtan çık", bütün `.btn.sat`; gün batımı → `#son .kodSatir .btn.gb` (Paylaş; eski `w_gunbatimi.png` yerine), KAYNAŞTIR (`#eKay`, `.bilgiKart .bkEylem .btn.gb`). Pasif hâl (`.btn.gb:disabled`: altın yetmeyince Kaynaştır, `.btn.sat:disabled`): biçim #7 ile aynı olduğu için #7'nin `dugme_mor_pasif` satırı kullanılır; ayrı görsel istenmez.
- Ad notu: `dugme_gunbatimi` parçası, `kut/arayuz/ui/` altındaki kullanılmayan eski `dugme_gunbatimi.png` ile aynı adı taşır. Yeni parça kit klasörüne (`kut/web/arayuz/kit/`) gider, eski dosya silinir; çakışma olmaz.

## 9. Pencere çerçevesi: `pencere_cerceve`
- Yatay 16:10 (tuval 1536×1024). **Yalnız çerçeve**: içi tamamen şeffaf. İç zemin #10 dokusudur. [9-SLICE].
- Ek referans: `menu_panel_b.webp`.
```
[GİRİŞ] Ornate game window FRAME ONLY, landscape 16:10, same family as the attached menu_panel: polished gold border of even thickness with a thin dark-bronze outer outline and a thin bright inner gold line, carved gold filigree ornaments each holding a violet crystal gem in the FOUR CORNERS only (the corner ornaments may extend slightly outside the border). The whole inside window is EMPTY and fully transparent. [9-SLICE]
```
- **Nerede:** bütün pencereler: `#perde .pencere` (karşılamadaki `menu_panel` + `fill` ile oyundaki eski `w_panel.png` ikisinin yerine tek çerçeve; aynı Ayarlar penceresi artık her ekranda aynı görünür), `#son .sonKart`, `#kodeks .kahPanel` ve `.soyKod`, `#perde[data-tur=kahraman] #pencere`, seçim pencereleri (Başlangıç, Kervan, Ganimet, Soy Mührü, Armağan), duraklatma paneli. `.pn.gem::before/::after` CSS elmasları kalkar; köşe süsü artık çerçevede (Kodeks'te üst üste binen mavi-altın elmas ve ayrıntı kartında kırpılan üçgen sorunu biter).

## 10. Cam iç dokusu: `doku_cam_mor`
- Kare (tuval 1024×1024). **Opak**, dikişsiz döşenebilir. [GİRİŞ] yazılmaz (şeffaf zemin ve çerçeve istemesin diye).
- Ek referans: `menu_panel_b.webp` (yalnız iç cam yüzeyin rengi ve bulut dokusu için; çerçevesi alınmaz).
```
Match the colors and the painterly glass surface of the attached reference panel's INSIDE only (ignore its gold frame). Seamless tileable texture, square, front view: deep violet-purple glass surface (colors between #2a1446 and #1a0b2e) with a very subtle hand-painted cloudy swirl and a few tiny faint gold specks, low contrast, even brightness across the whole tile, no vignette, no frame, no border, no light spot; the edges wrap perfectly left-right and top-bottom. Opaque, no transparency. NO TEXT.
```
- **Nerede:** #9, #16 ve büyük kutuların iç zemini (CSS `background` olarak döşenir). Panel dikiş çizgisi sorunu böyle çözülür: çerçeve ayrı, iç doku ayrı.

## 11. Başlık kurdelesi seti 1: `kurdele_set_1`
- Yatay (tuval 1536×1024), üç kurdele alt alta, her biri yaklaşık 5:1. [3-SLICE].
- Parçalar: `kurdele_mor`, `kurdele_altin`, `kurdele_gumus`.
```
[GİRİŞ] [DURUM 3] Horizontal title ribbon banner, about 5:1: a front-facing banner band with gold-trimmed top and bottom edges; both ends finished with short folded ribbon tails curling back and a small crystal gem stud at each end; the middle part is a plain smooth band where the game will write a title. Row 1 VIOLET: deep violet glossy band, gold trim, violet gems. Row 2 GOLD: rich glossy gold band with warm amber shading, violet gems. Row 3 SILVER: cool polished silver-blue band, silver trim, pale blue gems. [3-SLICE]
```
- **Nerede:** mor → `.pencere h3` (`.modBas`, `.adBas`; Mod seç, Oyuncu adı, Ayarlar, Nasıl oynanır, Düello), seçim penceresi başlıkları (`#pencere h3`), `#kodeks .kodUst h2`, `#hasarOzet .ust b`, DURAKLATILDI başlığı, `#ana .slogan` (şimdiki CSS hap ve yan çizgiler yerine), `#ana .sezon b`, `.dondur span`, rakip paneli "SIRADAKİ RAKİP / SIRADAKİ DALGA", lobi "SON ÜÇ / FİNAL DÜELLOSU"; altın → `#sonSerit` (ZAFER, 1.), `#sonToren .trYazi` (1.), `.mvpAd` (MVP ad kartuşu), "SAVAŞ!" yazısının arkası (`.savasGiris b`), `.sonucBant .sYazi b` (zafer); gümüş → 2.–4. sıra, berabere.

## 12. Süslü ayraç: `ayrac_suslu`
- Çok yatay, yaklaşık 16:1 (tuval 1536×1024, nesne ortada). Sabit oranla ölçeklenir.
```
[GİRİŞ] Decorative horizontal divider, about 16:1: a thin polished gold filigree line that tapers to fine points at both ends, small curled gold flourishes near the center, and one faceted violet crystal gem in a four-pointed gold star mount exactly at the center. Thin and elegant, front view.
```
- **Nerede:** `.sAyrac` (sonuç bandı), `.mvpCizgi`, `.mvpSerit` iç kenarı (MVP sinema şeritleri), `#pencere .kDetay .kdAd` altı, `.yukEkran .durum` altı, kurdele kullanılmayan pencere başlıklarının altı, `#hasarOzet .toplam` üstü, uzun listelerin alt ucu.

## 13. Vurgu (seçili) çerçeve seti: `vurgu_set`
- Dikey (tuval 1024×1536), üç çerçeve alt alta, her biri yaklaşık 5:2 (3:2 üç kez alt alta tuvale sığmıyordu; 9-slice olduğu için oran oyunda serbest). **Yalnız çerçeve**, içi şeffaf. [9-SLICE].
- Parçalar: `vurgu_altin`, `vurgu_zumrut`, `vurgu_gunbatimi`.
```
[GİRİŞ] [DURUM 3] Glowing selection highlight FRAME ONLY, landscape about 5:2: a bright rounded-rectangle rim of light with ornate L-shaped gold corner brackets at the four corners and a soft outer glow; the whole inside fully transparent. Row 1 GOLD glow. Row 2 EMERALD green glow with gold brackets. Row 3 SUNSET pink-orange glow with rose-gold brackets. [9-SLICE]
```
- **Nerede:** altın → `.modK:hover` / `:active` (mod kartı seçili; şimdi yalnız CSS kayma ve parıltı), `.ogrCerceve::after` (öğretici spot çerçevesi), armağan kartı seçili, `.secimler .sc:hover`; zümrüt → `#mac .kart.yuksel` (★2 olur); gün batımı → kaynaştırma hedefi.

## 14. İkon seti 1: menü: `ikon_set_menu`
- Yatay (tuval 1536×1024), 6 ikon, 3 sütun × 2 satır.
- Parçalar: `ikon_kahramanlar`, `ikon_nasil`, `ikon_duello`, `ikon_kalem`, `ikon_ev`, `ikon_geri`.
```
[GİRİŞ] [İKON] [SET 6, in 3 columns and 2 rows] 1) HEROES: a thick closed spellbook (codex) with a gold cover and a violet crystal on the cover; 2) HOW TO PLAY: a rolled parchment scroll with a sculpted gold question-mark ornament in front of it (the question-mark shape is the only symbol allowed); 3) DUEL CODE: two crossed short swords linked by a gold chain ring; 4) EDIT: a gold quill feather pen; 5) HOME: a small domed fantasy pavilion with a gold dome and a violet gem on top; 6) BACK: a bold gold arrow pointing LEFT with a violet gem at its tail.
```
- **Nerede:** `#ana .yanDug .btn .ik` (`#i-kitap`, `#i-soru`, `#i-zincir`; Ayarlar zaten `ikon_ayarlar`), `#ana .kahBtn`, `#ana .profil .pKalem` (`#i-kalem`), `#son .btn` Ana menü (`#i-ev`), `#kodeks .kodUst .btn` (`#i-geri`; `dugme_yuvarlak` üstünde, ezilmiş hap düğme yerine).

## 15. İkon seti 2: eylem ve durum: `ikon_set_durum`
- Yatay (tuval 1536×1024), 6 ikon, 3 sütun × 2 satır.
- Parçalar: `ikon_kapat`, `ikon_onay`, `ikon_uyari`, `ikon_kopya`, `ikon_paylas`, `ikon_dokun`.
```
[GİRİŞ] [İKON] [SET 6, in 3 columns and 2 rows] 1) CLOSE: a bold X made of two crossed gold bars with a small violet gem at the crossing; 2) CONFIRM: a bold check mark carved from a glowing emerald-green crystal set in gold; 3) WARNING: an amber-gold triangular gem plaque with a sculpted exclamation-mark shape (the only symbol allowed); 4) COPY: two overlapping gold-framed stone tablets; 5) SHARE: a gold ring with three small linked violet orbs branching out; 6) TAP: a stylized gold glove-like pointing cursor with one finger pressing down and a small glowing ring under the fingertip (no skin, no human features).
```
- **Nerede:** kapat → bütün pencerelere yeni sağ üst kapat düğmesi (`dugme_yuvarlak` + ikon), `#hasarOzet .kapat` (✕ karakteri yerine); onay → `.kut.bitti .onay`, iyi bildirim; uyarı → `.pencere .modUyari`, `.adHata`, hata bildirimi; kopya → `#dKopya`, `#son` Kopyala (`#i-kopya`); paylaş → `#son` Paylaş (`#i-paylas`); dokun → `.ogrEl`, `.kut .el` (`#i-el`), `.mvpIpucu`, `#soyListe .soyBos` (boş soy listesinde "kahraman koy" ipucu, `#i-el`), `.secIpucu` (2D hazırlık).

---

# ÖNCELİK 2: Ekranlar arası ortak parçalar

## 16. İnce panel seti: `panel_ince_set`
- Dikey (tuval 1024×1536), dört panel alt alta, her biri yaklaşık 3:1. İç dolgu düz ve **opak** (3D sahnenin üstündeki paneller biraz saydam olacaksa oyun paneli bütünüyle %90 opaklıkla koyar). [9-SLICE].
- Parçalar: `panel_ince_mor`, `panel_ince_yakut`, `panel_ince_kehribar`, `panel_ince_tas`.
```
[GİRİŞ] [DURUM 4] Slim game info panel, landscape about 3:1: a thin polished gold border with a thin dark outline, small gold corner caps each holding a tiny crystal gem at the four corners only, inside a smooth flat fully OPAQUE dark glass fill. Row 1 VIOLET glass, violet gems. Row 2 RUBY: dark crimson-violet glass, ruby red gems. Row 3 AMBER: warm dark amber-brown glass, sun-yellow gems. Row 4 STONE: dull grey-violet stone glass, bronze border, unlit grey gems. [9-SLICE]
```
- **Nerede:** mor → `.bilgiKart`, `body.hz3 #esyaRaf`, `#hasarOzet`, `#savas .hizlar`, `#savas .ayakta`, `#son .kutu`, `#ogrBalon` (eski `w_panel` yerine; altına #18 kuyruğu), `body.hz3 #armaganSerit`; yakut → `body.hz3 #mac .rakip.acik` (Gözcü paneli), `#mac.surSat .dukkan::after` (satış alanı; ortada `ikon_sat`, bozuk CSS "Sat" yazısı yerine), `#savas .alametK.acik`, canavar dalgası paneli; kehribar → `#kutAlan .kutBant` (Kut bandı); taş → `.kutBant.bitti`.

## 17. Panel başlık bandı: `baslik_bandi`
- Çok yatay, yaklaşık 8:1 (tuval 1536×1024, nesne ortada). [3-SLICE].
```
[GİRİŞ] Panel header band, horizontal about 8:1: a dark violet glass plaque strip with a fine gold filigree line along its bottom edge ending in small curls at both ends, and a tiny violet crystal stud at the left end; the top edge soft and thin; the middle plain and calm for text. [3-SLICE]
```
- **Nerede:** `#kodeks .pn-bas` (Kahramanlar · 16, Soylar), `#son .kutu h4`, `#hasarOzet .ust`, rakip paneli üst satırı, hazırlıktaki küçük panel başlıkları.

## 18. Küçük süs parçaları: `sus_set`
- Yatay (tuval 1536×1024), altı parça, 3 sütun × 2 satır.
- Parçalar: `madde_kristal`, `ayrac_dikey`, `kaydir_ok`, `balon_kuyruk`, `yildiz_hap`, `ok_sag`.
```
[GİRİŞ] [SET 6, in 3 columns and 2 rows] 1) BULLET GEM: a tiny faceted violet crystal in a four-pointed gold star mount; 2) VERTICAL DIVIDER: a thin vertical gold bar (about 1:5) with a small violet gem at its middle; 3) SCROLL HINT: a small downward-pointing gold-and-violet crystal arrow; 4) BUBBLE TAIL: a downward-pointing triangular speech-bubble tail with a thin gold edge and a dark violet glass fill, flat top edge (it attaches under a panel); 5) SMALL CAPSULE: a small empty horizontal capsule badge (about 3:1) with a thin polished gold rim and a flat opaque dark violet inside, no gems; 6) SMALL ARROW RIGHT: the same crystal arrow as item 3 but pointing RIGHT.
```
- **Nerede:** madde → `#kodeks .pn-bas .elmas`, `#son .kutu h4 .elmas`, `.pencere ul li` (Nasıl oynanır madde imleri); dikey ayraç → `body.hz3 #mac .macUst>.rozet::after`, `.alamet::after`, `.tahtaSayac::after`, `.mvpIst` arası; kaydırma oku → uzun pencerelerin ve listelerin alt ucu (`.pencere`, `#hasarOzet .satirlar`, `#soyKodListe`), ayrıca açılır liste imi `body.hz3 #armaganSerit>b::after` (bugün " ▾" karakteri); kuyruk → `#ogrBalon`, `.alamet.acik .t`, `.soyAc`, `.sansKutu`, sahne3d.js `balonCiz()`; küçük kapsül → sahne3d.js `cubukCiz()` içindeki yıldız rozeti hapı (can çubuğunun üstünde, canvas `yuvarlak()` + takım rengi kontur yerine) ve kaynaşık birimin çubuk solundaki koyu hap; sağ ok → `#kupaSayi` içindeki "1.240 →" metin oku, `#son .lig` "sonraki lig" satırı, 2D hazırlıkta `.dusmanOk`.

## 19. Satır plakası seti 1: `satir_plaka_set_1`
- Yatay (tuval 1536×1024), üç satır, her biri yaklaşık 6:1, köşeler yumuşak yuvarlak. [9-SLICE].
- Parçalar: `satir_plaka`, `satir_plaka_vurgu`, `satir_plaka_tas`.
```
[GİRİŞ] [DURUM 3] Row plate for lists and stat boxes, horizontal about 6:1 with softly rounded corners: a thin gold edge, tiny gold rivet studs only at the four corners, inside a smooth flat dark violet glass fill. Row 1 NORMAL: dark violet glass, thin muted gold edge. Row 2 HIGHLIGHT: brighter polished gold edge with a soft warm inner glow along the border. Row 3 STONE: dull grey-violet stone fill, dull bronze edge. [9-SLICE]
```
- **Nerede:** normal → `#soyKodListe .sk`, `.soy3`, `#hasarOzet .sr`, `#pencere .kdStat>div` (stat kutuları), `#ozet div` (maç sonu sayı karoları), ayar satırları (`ayarPencere()`), `.sansKutu`, `.alamet.acik .t`, `.soyAc`, `#kodeks .kodUst .acik`, lobi sıralama satırı (`#son .siradaK`), kart ad plakası (`#mac .kart .ad`, `#kahIzgara .kk .alt`), `#pencere .kdEsya>div`; vurgu → `#hasarOzet .sr.mvp`, lobide kendi satırın, `.soy3.on` (eşik 2), `#son .yildizMac`; taş → `.soy3` etkin değil, elenen lobi satırı, `#rakipTahta .m.bos`.

## 20. Satır plakası seti 2: `satir_plaka_set_2`
- #19 ile aynı biçim; #19'un çıktısını ekle. Dikey (tuval 1024×1536), dört satır.
- Parçalar: `satir_plaka_safir`, `satir_plaka_ametist`, `satir_plaka_yakut`, `satir_plaka_gunbatimi`.
```
[GİRİŞ] [DURUM 4] The SAME row plate shape as the attached one (horizontal about 6:1). Row 1 SAPPHIRE: dark navy-violet glass, gold-and-blue edge, a tiny blue crystal at the top-left corner. Row 2 AMETHYST: dark violet glass, gold-and-violet edge, a tiny violet crystal at the top-left corner. Row 3 RUBY: dark crimson glass, gold-and-red edge. Row 4 SUNSET: dark plum glass, edge with a gold-orange-pink gradient. [9-SLICE]
```
- **Nerede:** safir → `#pencere .kdKutu.yet` (yetenek kutusu); ametist → `#pencere .kdKutu.pas` (pasif kutusu); yakut → lobide sıradaki rakip satırı; gün batımı → `.soy3` eşik 3, kaynaşmış kahraman satırı.

## 21. Çip seti 1: `cip_set_1`
- Dikey (tuval 1024×1536; dört satır 4:1 kare tuvale boşluksuz sığmıyordu), her biri yaklaşık 4:1. Sol uçta yuvarlak ikon yuvası. [3-SLICE] (yuva sabit sol uç).
- Parçalar: `cip_notr`, `cip_altin`, `cip_zumrut`, `cip_yakut`.
```
[GİRİŞ] [DURUM 4] Small value chip, horizontal pill about 4:1: at the LEFT end a round socket with a thin gold ring (an icon will be placed in it), the rest a smooth glass pill with a thin gold edge. Row 1 NEUTRAL: dark violet glass. Row 2 GOLD: warm dark-amber glass, brighter gold edge. Row 3 EMERALD: dark green glass, gold-green edge. Row 4 RUBY: dark red glass, gold-red edge. [3-SLICE]
```
- **Nerede:** nötr → `#ana .pRoz span` (`.pKupa`, `.pUsta`), `.modK em` (mod künyesi), `.kart .sahipEt`, `#pencere .kdCip.kad` / `.kdCip.soy` (sokette kademe taşı ya da soy simgesi), `#rakipSoy .cip`, `.bilgiKart .bkSoy .bs`, `.rakipKim .etiket` (türe göre ikon), `.adForm .adSay`, `.kut.bitti .sayac`, `.sonucBant .cip.notr`, `#pencere .kdEk`; altın → `.kart .fiyat` (sokette `ikon_altin`), `#pencere .kdCip.fiyat`, `.sonucBant .cip.altin`; zümrüt → `.kart .yukselEt`, `.kupaD .art`, `.sonucBant .cip.iyi`, ayakta paneli "SEN"; yakut → `.kupaD .art.eksi`, `.rakipKim .rkCan`, `.sonucBant .cip.kotu`, `body.hz3 #esyaRaf .tasan`, ayakta paneli "RAKİP", `.kart.pahali .fiyat` (altının yetmediği kart: fiyat çipi yakut olur; bugünkü bütün karta `filter: grayscale(.55) brightness(.8)` kalkar). Bütün altın soketlerinde ikon robot `ikon_altin`'dir (eski `ik_altin.png` emekli).

## 22. Çip seti 2: `cip_set_2`
- #21 ile aynı biçim; #21'in çıktısını ekle. Kare (tuval 1024×1024), üç satır.
- Parçalar: `cip_ametist`, `cip_gunbatimi`, `cip_buz`.
```
[GİRİŞ] [DURUM 3] The SAME chip shape as the attached one (round socket at the left, pill about 4:1). Row 1 AMETHYST: violet glass, gold-violet edge. Row 2 SUNSET: orange-to-pink gradient glass, gold edge. Row 3 FROST: icy blue glass, silver-blue edge. [3-SLICE]
```
- **Nerede:** ametist → `.sonucBant .cip.mvp`, `#pencere .kdVidEt` (video etiketi); gün batımı → `#savas .saat .gunBatimi` (×1,6), kazanma serisi; buz → kaybetme serisi (`#mac .macUst .rozet:nth-child(2)`).
- **Armağan rozetleri** (`#armaganSerit .ar`; bugün kademe renginde kenarlıklı düz CSS hap, içinde armağan adı): kıvılcım → `cip_buz`, alev → `cip_gunbatimi`, güneş → `cip_altin` (#21); sokette #52'nin kademe ikonu (`ikon_kivilcim` / `ikon_alev` / `ikon_gunes`). Aynı paneldeki `#alSus` (Alameti sustur) ve `#arAc` (Armağan seç / Soy seç) düğmeleri `.btn` sınıfsız çıplak `button`'dur; `dugme_mor` (#7) ve `dugme_altin_kucuk` (#6) olur.

## 23. Soketli plaka seti: `plaka_set`
- Dikey (tuval 1024×1536), dört satır, her biri yaklaşık 5:1. Solda büyük yuvarlak soket. [3-SLICE] (soket sabit sol uç, taş sabit sağ uç).
- Ek referans: `hud_altin_rozet.webp` (soket + plaka birleşimi tam bu), `hud_portre_cerceve.webp`. `profil_cerceve` referans olarak **eklenmez**: taş ve yaprak süsü bütün plakalara (rakip etiketi, bildirim…) taşınmasın; o yalnız oyuncu plakasında sokete oturan ayrı parçadır.
- Parçalar: `plaka_mor`, `plaka_yakut`, `plaka_zumrut`, `plaka_kehribar`.
```
[GİRİŞ] [DURUM 4] Name plate / notification plate, horizontal about 5:1: at the LEFT a large round socket with a polished gold ring (an avatar or medallion sits inside it; the inside of the socket is dark), joined to a horizontal glass plate with an ornate polished gold border and a small crystal gem stud at the RIGHT end; the socket-and-plate joint exactly like the attached hud_altin_rozet; only gold and crystal ornaments (no stone, no leaves). Row 1 VIOLET glass, violet gems. Row 2 RUBY glass, ruby gems. Row 3 EMERALD glass, emerald gems. Row 4 AMBER glass, sun-yellow gems. [3-SLICE]
```
- **Nerede:** mor → `#ana .profil` (oyuncu plakası; `profil_cerceve` sokete oturur, düz kenarlı CSS hap kalkar), `#kodeks .kodUst .rozet` (ustalık rozeti), `.yukEkran .ipucu` (ipucu kutusu; sokette #4 + `ikon_ipucu`), `.bildirim` (bilgi), `.tabletNot`; yakut → `body.hz3 #mac .macUst .rakip` (rakip etiketi), `#savas .rakipK`, `#savas .alametK` (kapalı hâl; sokette alamet madalyonu), `.bildirim.hata`, `.pencere .adHata`; zümrüt → `.bildirim.iyi`; kehribar → `.pencere .modUyari` (kayıtlı maç uyarısı), Kervan bilgi plakası (`#mac .rakip .rakipKim > div`).

## 24. Sekme seti: `sekme_set`
- Kare (tuval 1024×1024), üç satır. Sekme yaklaşık 3,5:1, iz yaklaşık 8:1. [3-SLICE].
- Parçalar: `sekme_aktif`, `sekme_pasif`, `sekme_iz`.
```
[GİRİŞ] [DURUM 3] Tab / filter button, horizontal about 3.5:1, with chamfered (cut) corners instead of a round pill, so it reads differently from normal buttons; small violet crystal studs at the left and right ends. Row 1 ACTIVE: glossy gold-amber surface, bright polished gold rim, lit gems, soft warm glow. Row 2 INACTIVE: dark violet stone surface, muted gold rim, unlit gems. Row 3 TRACK: a longer recessed dark groove plate (about 8:1) with a thin gold edge, in which several tabs sit side by side. [3-SLICE]
```
- **Nerede:** `#kodeks .filtre .btn.sade` ve `.on` (Hepsi / Kademe 1-3), `#hasarOzet .sekmeler button` ve `.on` (iz arkada), `#aHedef` kare hızı seçici (60 / 120 / Otomatik; iz + sekmeler), Ayarlar sekmeleri (Ses / Görüntü / Oynanış / Hesap; ARAYUZ_V2 §8.4).

## 25. Metin alanı: `metin_alani_set`
- Kare (tuval 1024×1024), iki satır, her biri yaklaşık 6:1. [9-SLICE].
- Parçalar: `metin_alani`, `metin_alani_odak`.
```
[GİRİŞ] [DURUM 2] Text input field, horizontal about 6:1: a recessed dark violet-black slot set into a polished gold frame with a thin bevel, tiny violet gem studs in the four corners only (none in the middle of the left or right edge, because the field also stretches vertically for multi-line text), the inside flat and dark for typed text. Row 1 NORMAL. Row 2 FOCUSED: the gold frame brighter, with a soft warm gold glow around it and lit gems. [9-SLICE]
```
- **Nerede:** `.adForm input#adGir`, `.pencere textarea` (`#dKod`, `#dGir`; çok satırlı, şimdiki düz mor kenar yerine), `#son .kodKutu` (kesik çizgili kutu yerine).

## 26. Aç/kapa anahtarı: `anahtar_set`
- Kare (tuval 1024×1024), iki satır, her biri yaklaşık 2,2:1. Sabit oran.
- Parçalar: `anahtar_acik`, `anahtar_kapali`.
```
[GİRİŞ] [DURUM 2] Toggle switch: a horizontal capsule track (about 2.2:1) with a polished gold frame, and a round gold knob with a crystal in its center. Row 1 ON: the track inside glowing emerald-gold, the knob on the RIGHT, knob crystal bright emerald. Row 2 OFF: the track inside dark dull violet-grey, the knob on the LEFT, knob crystal unlit grey.
```
- **Nerede:** Ayarlar'da `#aSes`, `#aMuzik`, `#aUyarla`, `#aFps`, `#aAz` (bugün "Sesi kapat" gibi metin düğmeleri; anahtara dönüşür), ileride Titreşim ve Ekran sarsıntısı.

## 27. Çubuk çerçeve seti: `cubuk_set`
- Yatay (tuval 1536×1024), dört boş çubuk çerçevesi alt alta. [3-SLICE].
- Parçalar: `cubuk_buyuk`, `cubuk_mini_dost`, `cubuk_mini_rakip`, `cubuk_ince`.
```
[GİRİŞ] [SET 4, stacked vertically] Empty progress bar frames, each an empty recessed dark groove inside a gold frame, no fill. 1) LARGE (about 10:1): ornate polished gold frame with a violet crystal gem cap at each end. 2) MINI ALLY (about 6:1): small simple gold frame with emerald gem caps at both ends. 3) MINI ENEMY (about 6:1): the same with ruby gem caps. 4) SLIM TRACK (about 14:1): a very thin recessed groove with a fine gold edge and tiny gold end caps. [3-SLICE]
```
- **Nerede:** büyük → `.yukEkran .cubuk` (açılış `#acilis` ve maça giriş `#macYuk`), `#son .lig .takimCan`, `#son .siradaK + .takimCan`, ustalık çubuğu; mini → sahne3d.js `cubukOlcu` / `canDegrade` (birim can çubukları, canvas `drawImage`); ince → yeni ses / müzik kaydırıcısı, `#hasarOzet .c`.

## 28. Çubuk dolguları: `cubuk_dolgu_set`
- Yatay (tuval 1536×1024), beş şerit alt alta, her biri yaklaşık 12:1. **Opak**, yatayda dikişsiz. Mevcut `hud_can_dolgu_yesil` / `hud_can_dolgu_kirmizi` / `hud_mana_cubuk` ile aynı aileden; onları referans olarak ekle.
- Parçalar: `dolgu_altin`, `dolgu_turuncu`, `dolgu_lila`, `dolgu_kalkan`, `dolgu_iz`.
```
[GİRİŞ] [SET 5, stacked vertically] Seamless horizontally tileable bar fill strips, about 12:1, same glossy liquid-light look as the attached health bar fills, with a bright highlight band on top, a darker bottom and faint diagonal energy streaks: 1) GOLD-AMBER; 2) ORANGE; 3) LILAC-VIOLET; 4) SHIELD: pale silver-white with fine evenly spaced diagonal silver hatch lines and a cool blue-white sheen; 5) DAMAGE TRAIL: soft warm cream-white with a faint inner glow and no streaks. The left and right edges of each strip wrap seamlessly. The strips themselves are opaque.
```
- **Nerede:** altın → `.yukEkran .cubuk i` (şimdiki CSS gradyan ve akan çizgi yerine), lig / ustalık çubukları, kaydırıcı dolgusu; turuncu ve lila → `#hasarOzet .c i` (verilen ve alınan hasar; iyileştirme için mevcut `hud_can_dolgu_yesil`); kalkan → sahne3d.js `kalkanDesen()` (birim can çubuğunda canın sağına uzanan kalkan; bugün 6 px'lik canvas tarama deseni); hasar izi → sahne3d.js `cubukCiz()` iz şeridi ve `#savas .skor .takimCan s.iz` (bugün düz krem renk / CSS gradyan). Birim can çubuğunun can dolgusu da bugün canvas gradyanıdır (`canDegrade`); mevcut `hud_can_dolgu_yesil` / `hud_can_dolgu_kirmizi` `drawImage` ile kullanılır (mana zaten `hud_mana_cubuk`).

## 29. Denetim parçaları: `kontrol_set`
- Kare (tuval 1024×1024), dört parça, 2 × 2.
- Parçalar: `kaydirici_topuz`, `kivilcim_uc`, `kaydirma_ray`, `kaydirma_tutamak`.
```
[GİRİŞ] [SET 4, in 2 columns and 2 rows] 1) SLIDER KNOB: a round polished gold knob with a violet crystal in its center; 2) SPARK HEAD: a bright glowing gold-white spark star with a soft glow (it sits at the tip of a filling bar); 3) SCROLL RAIL: a thin vertical gold rail (about 1:16) with tiny end caps; 4) SCROLL HANDLE: a small vertical gold capsule with a violet gem.
```
- **Nerede:** kaydırıcı topuzu (yeni ses / müzik kaydırıcıları), `.cubuk i::after` (dolgunun parlayan ucu), `.pencere` ve `#hasarOzet .satirlar` kaydırma göstergesi (bugün kaydırma çubuğu tamamen gizli).

## 30. Kart çerçevesi seti 1: `kart_cerceve_set_1`
- Yatay (tuval 1536×1024), üç çerçeve yan yana, her biri yaklaşık 4:5. **Yalnız çerçeve**, içi şeffaf. [9-SLICE] (her orana esner: dükkân kartı yatay, kodeks kartı kareye yakın, seçim kartı dikey).
- Parçalar: `kart_cerceve_k1`, `kart_cerceve_k2`, `kart_cerceve_k3`.
```
[GİRİŞ] [SET 3, in one horizontal row] Collectible hero card FRAME ONLY, portrait about 4:5, the inside window fully transparent: a polished metal border of even thickness with a thin dark outline and a fine inner bevel line, ornate carved filigree with a faceted gem only at the four corners. 1) TIER 1 SILVER: polished silver border, pale silver-white gems. 2) TIER 2 EMERALD: gold border with an emerald-green inlay line and emerald gems. 3) TIER 3 SAPPHIRE: gold border with a sapphire-blue inlay line and sapphire gems. All three identical in shape and size. [9-SLICE]
```
- **Nerede:** `#mac .kart.k1–k3` (dükkân; şimdiki 2 px düz kademe kenarlık yerine), `#kahIzgara .kk` (kodeks kartı; CSS gradyan çerçeve yerine), `#pencere .kdCer` (ayrıntı portre çerçevesi), `#pencere .kdVid` (yetenek videosu çerçevesi), `.bilgiKart .bkPor`, `#sonTakim .m`, `#savas .ayakta .bas` (küçük pay), `.secimler .sc` (kahraman seçimi, Kervan). Armağan kartlarında kıvılcım → K3.

## 31. Kart çerçevesi seti 2: `kart_cerceve_set_2`
- #30 ile aynı biçim; #30'un çıktısını ekle. Yatay (tuval 1536×1024), üç çerçeve.
- Parçalar: `kart_cerceve_k4`, `kart_cerceve_k5`, `kart_cerceve_altin`.
```
[GİRİŞ] [SET 3, in one horizontal row] The SAME card frame as the attached one (portrait about 4:5, frame only, transparent window, gems only at the corners). 1) TIER 4 AMETHYST: gold border with a violet inlay line and amethyst gems. 2) TIER 5 SUNSET: rose-gold border with a gold-orange-pink gradient inlay and sunset-orange gems. 3) PURE GOLD: bright polished gold border, warm white-gold gems with a soft glow. [9-SLICE]
```
- **Nerede:** `#mac .kart.k4` / `.k5`; gün batımı → kaynaşmış kahraman karosu (`#sonTakim .m.kaynas`), armağan alev kademesi (`.sc.arm.k-alev`); altın → `.secimler .sc` (Soy Mührü, Ganimet, eşya seçimi), armağan güneş kademesi (`.sc.arm.k-gunes`).

## 32. Kart zemini: `kart_zemin`
- Kare (tuval 1024×1024). **Opak**. Kademe rengini çerçeve ve taş taşır; zemin ortaktır.
```
Hand-painted stylized fantasy background for a hero portrait card, square, NO creature in it: a soft misty violet niche with a warm glowing light pool on a round stone pedestal at the bottom center, faint floating gold dust, darker edges, calm and simple so a creature portrait reads clearly in front of it. No frame. Opaque. NO TEXT.
```
- **Nerede:** `#kahIzgara .kk::before`, `#mac .kart .resim`, `#pencere .kdCer::before`, `.bilgiKart .bkPor`, `.secimler .sc img.pp` arkası, `#ana .profil .avatar` (daire kırpılır). Bugün hepsi CSS radyal gradyan.

## 33. Kademe taşları: `kademe_tas_set`
- Yatay (tuval 1536×1024), beş taş yan yana.
- Parçalar: `kademe_k1`, `kademe_k2`, `kademe_k3`, `kademe_k4`, `kademe_k5`.
```
[GİRİŞ] [SET 5, in one horizontal row] Tier gems: each a faceted diamond-shaped (rhombus) cut gem in a small polished gold mount, the central facet lighter and flat so a short label can be written on top. 1) SILVER-WHITE; 2) EMERALD; 3) SAPPHIRE; 4) AMETHYST; 5) SUNSET (gold-orange-pink).
```
- **Nerede:** `#kahIzgara .kk .kTag`, `#pencere .kdKad`, `.kTag` (`#mac`, `.bilgiKart`), `.kdCip.kad` soketi, Kodeks filtre düğmeleri, `.sansKutu` olasılık satırı. Bugün hepsi `clip-path` ile CSS elmas.

## 34. İkon seti 3: istatistik: `ikon_set_stat`
- Yatay (tuval 1536×1024), 6 ikon, 3 × 2.
- Parçalar: `ikon_saldiri`, `ikon_saldiri_hizi`, `ikon_menzil`, `ikon_mana`, `ikon_kalkan`, `ikon_iyilestirme`.
```
[GİRİŞ] [İKON] [SET 6, in 3 columns and 2 rows] 1) ATTACK: a single gold sword pointing up with a violet gem in the hilt; 2) ATTACK SPEED: a small gold sword with a lightning-bolt-shaped wing and speed streaks; 3) RANGE: an arrow striking a round gold target; 4) MANA: a glowing sky-blue crystal droplet with a gold cap; 5) DEFENSE: a round-topped gold shield with a violet gem boss (no cross); 6) HEALING: a green leaf cradling a glowing emerald droplet.
```
- **Nerede:** `#pencere .kdStat small .ik` (Saldırı, Saldırı hızı, Menzil, Mana; şimdiki düz SVG `#i-kilic`, `#i-simsek`, `#i-hedef`, `#i-damla` yerine; Can için mevcut `ikon_can`), `#hasarOzet .lejant` (verilen = saldırı, alınan = kalkan, iyileştirme; CSS renk kareleri yerine), `.mvpIst` (hasar, kalkan, iyileştirme), Nasıl oynanır konu ikonları.

## 35. İkon seti 4: yetenek ve ilerleme: `ikon_set_ilerleme`
- Yatay (tuval 1536×1024), 6 ikon, 3 × 2.
- Parçalar: `ikon_yetenek`, `ikon_pasif`, `ikon_kupa`, `ikon_ustalik`, `ikon_yuksel`, `ikon_dustu`.
```
[GİRİŞ] [İKON] [SET 6, in 3 columns and 2 rows] 1) ABILITY: a blue crystal with a gold lightning bolt across it; 2) PASSIVE: a violet crystal behind a small gold shield; 3) TROPHY: a gold trophy cup with two handles and a violet gem; 4) MASTERY: a gold crown with violet gems on a small violet glass medallion; 5) UPGRADE: a bold emerald-green crystal arrow pointing up with a gold rim; 6) FALLEN: a cracked, dull violet crystal with a faded gold rim (a unit knocked out; no skull).
```
- **Nerede:** yetenek / pasif → `#kodeks .kahPanel .pn-bas .sag` (■ karakterleri yerine), `#kahIzgara .kk .alt span i`, `#pencere .kdKutu h4 .ik` (`#i-simsek`, `#i-kalkan`), `.kdVidEt`; kupa → `#ana .pKupa` (`#i-kupa`), `.kupaD .ik` (eski `ik_kupa.png`); ustalık → `#ana .pUsta` (`#i-tac`), `#kodeks .kodUst .rozet .top`, `#pencere .kdEk`; yüksel → `.kart .yukselEt` (`#i-ok`); düştü → `#savas .ayakta .bas.olu::after` (CSS kırmızı X yerine).

---

# ÖNCELİK 3: Savaş, sonuç ve maç sonu

## 36. KUT düğmesi: `kut_set`
- Yatay (tuval 1536×1024), iki düğme yan yana, aynı boy. Sabit oran.
- Ek referans: `hud_saat.webp`, `dugme_yuvarlak.webp`, eski `kut/arayuz/ui/w_kut_hazir.png` (yalnız konu için; tarz yenilerden).
- Parçalar: `kut_dugme_hazir`, `kut_dugme_bitti` (adlar bilerek `kut_` ile değil `kut_dugme_` ile başlar: `kut/arayuz/ui/` altında kullanılmayan eski `kut_hazir.png` / `kut_bitti.png` ve kullanılan `w_kut_hazir.png` / `w_kut_bitti.png` var, karışmasın).
```
[GİRİŞ] [SET 2, side by side, identical size] Large round ultimate-power button, same ring language as the attached hud_saat and dugme_yuvarlak: a thick ornate polished gold ring with a radiant sun-ray crown on top, violet crystal gems at the left, right and bottom, and a small empty stone slot on the bottom edge for a counter. 1) READY: the center a blazing golden sun-ember orb with molten amber swirls and a strong warm glow. 2) USED: the same ring dulled to bronze-grey, the center a calm dark grey-violet stone disc (a portrait will be placed in it), gems unlit.
```
- **Nerede:** `.kut` (eski `w_kut_hazir.png`, 220 px, yumuşak), `.kut.bitti` (eski `w_kut_bitti.png`).

## 37. KUT ışın halkası: `kut_isin`
- Kare (tuval 1024×1024). Simetrik. **Siyah zemin, opak** ([IŞIK]); ortası siyah kalır, oyun toplamalı karışımla koyar.
```
[IŞIK] A circular ring of soft radiant golden light rays with small floating gold sparkles shaped like abstract geometric glyphs (not real letters), symmetrical around the center, the center pure black (empty), made to rotate slowly behind a round button.
```
- **Nerede:** `.kut .isin` (eski `w_kut_isin.png`), `.kut.secim` (Kut hedef seçme kipi; daha hızlı döner, bugün yalnız ölçek nabzı var).

## 38. Geniş sonuç bandı seti: `bant_genis_set`
- Dikey (tuval 1024×1536; robotta 1536×1536 yok, dört 5:1 bant kare tuvale boşluksuz sığmıyordu), dört bant alt alta, her biri yaklaşık 5:1. Uçlar yumuşak saydamlığa sönmez (robot yarı saydam geçişi güvenilir çizemiyor); ince sivri altın süs uçlarıyla biter, şeffafa sönmeyi oyun CSS maskesiyle verir. [3-SLICE].
- Parçalar: `bant_zafer`, `bant_yenilgi`, `bant_berabere`, `bant_savas`.
```
[GİRİŞ] [DURUM 4] Full-width cinematic banner band, about 5:1, both the left and right ends tapering into thin pointed gold filigree tips (no soft fade, the band itself fully opaque): a dark glass-and-fabric band with ornate gold filigree trim along the top and bottom edges; the middle calm for a large title. Row 1 VICTORY: deep violet band with bright gold filigree and a warm gold glow. Row 2 DEFEAT: dark plum-crimson band with tarnished gold trim and a few hairline cracks near the ends. Row 3 DRAW: dark navy band with silver-blue trim. Row 4 BATTLE: deep violet band with gold trim and small violet gems. [3-SLICE]
```
- **Nerede:** `.sonucBant` ve `::before/::after` (ZAFER / YENİLGİ / BERABERE; bugün üçü de aynı CSS şerit, yalnız ton değişiyor), `.savasGiris .sgBant` (SAVAŞ! bandı).

## 39. Kurdele seti 2: `kurdele_set_2`
- #11 ile aynı biçim; #11'in çıktısını ekle. Yatay (tuval 1536×1024), üç satır. [3-SLICE].
- Parçalar: `kurdele_bronz`, `kurdele_yakut`, `kurdele_tas`.
```
[GİRİŞ] [DURUM 3] The SAME ribbon banner as the attached one (about 5:1, folded tails and gem studs at both ends, plain middle). Row 1 BRONZE: warm bronze-copper band, bronze trim, amber gems. Row 2 RUBY: deep crimson band, gold trim, ruby gems. Row 3 STONE: dull grey-violet carved stone band, weathered bronze trim, unlit grey gems. [3-SLICE]
```
- **Nerede:** bronz → 3. sıra (`#sonSerit`, `#sonToren .trYazi`); yakut → `.sonSerit.kayip` (elendin), `.sonucBant .sYazi b` (yenilgi); taş → 5.–8. sıra, MAÇ BİTTİ. `#sonSerit` artık kurdeledir (CSS gradyan ve görünmeyen clip-path uçlar kalkar).

## 40. Silah seti: `silah_set`
- Yatay (tuval 1536×1024), üç dikey parça yan yana.
- Parçalar: `kilic`, `kilic_kirik_ust`, `kilic_kirik_alt`.
```
[GİRİŞ] [SET 3, side by side, each standing vertically] 1) SWORD: a single heroic fantasy sword pointing UP, polished silver blade with a faint violet edge glow, ornate gold crossguard with curled tips, a violet gem in the guard center and a gold pommel. 2) and 3) the SAME sword broken in two: the upper blade piece with a jagged break at its bottom end, and the lower piece (the hilt with a short jagged stump of blade); a few tiny glowing cracks at the break.
```
- **Nerede:** `.sgAmblem .kilic` (savaş girişi; iki kopya CSS ile çaprazlanır), `.zafer .sAmblem .kilic`, `.yenilgi .dusen .kilic.ust` / `.alt`. Elle çizilmiş SVG `#s-kilic` kalkar.

## 41. Tören amblemleri: `toren_amblem_set`
- Kare (tuval 1024×1024), dört amblem, 2 × 2.
- Parçalar: `amblem_tac`, `amblem_kupa_gumus`, `amblem_kupa_bronz`, `amblem_kalkan`.
```
[GİRİŞ] [İKON] [SET 4, in 2 columns and 2 rows] Large award emblems: 1) GOLD CROWN with violet and amber gems and a soft golden glow; 2) SILVER TROPHY CUP with two handles and pale blue gems; 3) BRONZE TROPHY CUP, same shape, warm bronze with amber gems; 4) RUNE SHIELD: a round-topped shield in blue-silver with an abstract carved crystal motif and a central sapphire boss (NO cross, no real symbols).
```
- **Nerede:** `#sonToren svg.trAmb` (taç 1., kupalar 2.–3., kalkan 4.+; SVG `#s-tac`, `#s-kupa`, `#s-kalkan` kalkar, kalkandaki haç bezeği de gider), `.sonSerit .mad .trMini` (küçük), `.berabere .sAmblem .kalkan` (iki kalkan, biri aynalı).

## 42. Jeton seti: `jeton_set`
- Yatay (tuval 1536×1024), sekiz parça, 4 sütun × 2 satır. Ortaları düz; sayıyı oyun yazar.
- Parçalar: `jeton_kazandi`, `jeton_kaybetti`, `jeton_canavar`, `jeton_berabere`, `sira_altin`, `sira_gumus`, `sira_bronz`, `sira_tas`.
```
[GİRİŞ] [SET 8, in 4 columns and 2 rows] Row 1 ROUND-RESULT TOKENS: rounded-square gem tokens with a gold rim and a flat center: EMERALD, RUBY, AMETHYST, GREY STONE. Row 2 PLACEMENT COINS: round coins with a raised ornate rim and a flat center: GOLD with a tiny crown motif on the rim, SILVER, BRONZE, STONE.
```
- **Nerede:** `#turlar .tr.g` / `.tr.k` (tur geçmişi; CSS yeşil-kırmızı kareler yerine), bölüm haritası (ARAYUZ_V2 §4.10), `#son .siradaK` (lobi sıralaması satır başı), hazırlıktaki lobi listesi. Eski `kut/arayuz/ui/esya/sira_1..8.png` yerine.

## 43. Portre halkaları: `halka_set`
- Yatay (tuval 1536×1024), altı halka, 3 × 2. Ortaları şeffaf.
- Parçalar: `halka_altin`, `halka_zumrut`, `halka_yakut`, `halka_safir`, `halka_ametist`, `halka_gunbatimi`.
```
[GİRİŞ] [SET 6, in 3 columns and 2 rows] Small round portrait rings: a thin ornate polished ring with a tiny gem at the top, the center fully transparent (a portrait goes inside). 1) GOLD; 2) EMERALD; 3) RUBY; 4) SAPPHIRE; 5) AMETHYST; 6) SUNSET rose-gold with a soft pink glow.
```
- **Nerede:** zümrüt / yakut → `#hasarOzet .por.biz` / `.dus`; altın → `#son .ustaD img`, `#soyKodListe .sk .tasiyan img`; gün batımı → kaynaşma madalyonu (`.bilgiKart`, `#sonTakim .madalyon`, sahne3d.js `kaynasCiz()` billboard); safir / gün batımı / altın → armağan rozet çipinin (#22 altındaki not) soketinde kademe ikonu yerine armağanın kendi küçük resmi (`web/arayuz/armagan/*.webp`) gösterildiğinde onu saran halka (kıvılcım / alev / güneş).

## 44. Yıldız seti: `yildiz_set`
- Yatay (tuval 1536×1024), dört parça yan yana.
- Parçalar: `yildiz_bronz`, `yildiz_gumus`, `yildiz_altin`, `yildiz_tacli`.
```
[GİRİŞ] [İKON] [SET 4, in one horizontal row] Star-level badges, chunky and readable at 16 px: 1) BRONZE five-pointed star with a polished bevel; 2) SILVER star; 3) GOLD star with a soft glow; 4) a GOLD star wearing a tiny gold crown.
```
- **Nerede:** `.yildizlar .ik` (★1 bronz, ★2 gümüş, ★3 altın + taç; bugün üçü de altın), sahne3d.js `yildizCiz()` (baş üstü; canvas poligonu yerine), `#hasarOzet .ad small` (★ karakteri yerine), `#pencere .kdPortre .yildizlar`.

## 45. Boncuk ve eşik seti: `boncuk_set`
- Yatay (tuval 1536×1024), sekiz parça, 4 × 2. Altıgenlerin ortası düz; sayıyı oyun yazar.
- Parçalar: `boncuk_sikke`, `boncuk_sikke_bos`, `boncuk_elmas`, `boncuk_elmas_bos`, `esik_bronz`, `esik_altin`, `esik_gunbatimi`, `esik_bos`.
```
[GİRİŞ] [SET 8, in 4 columns and 2 rows] Row 1: a GOLD COIN BEAD (glossy gold coin with a tiny gem), an EMPTY COIN SOCKET (dark recessed ring), a VICTORY GEM (bright violet-pink faceted gem in a gold mount), an EMPTY GEM SOCKET (dark). Row 2 HEXAGON THRESHOLD BADGES with a flat center: BRONZE-GOLD, BRIGHT GOLD, SUNSET orange-pink, DIM GREY.
```
- **Nerede:** faiz boncukları (`.altinRozet`), zafer elmasları (`#mac .zaferler`; eski `ik_elmas`), `.kart .sahipEt` kopya sayacı, `.ogrSay` öğretici adım noktaları; altıgenler → `#soyKodListe .sk .esk em` (2 / 4), `.soy3` eşik kutuları, `.soyAc em`.

## 46. İkon seti 5: oyun kavramları: `ikon_set_oyun`
- Yatay (tuval 1536×1024), 6 ikon, 3 × 2.
- Ek referans: `ikon_can.webp` (4. ikon bunun boş hâlidir; biçimi birebir aynı olmalı).
- Parçalar: `ikon_tahta`, `ikon_havuz`, `ikon_esya`, `ikon_can_bos`, `ikon_gozcu`, `ikon_ipucu`.
```
[GİRİŞ] [İKON] [SET 6, in 3 columns and 2 rows] 1) BOARD: a small stone platform with a 4-by-3 grid of glowing gold tiles; 2) POOL: a fanned stack of three cards with gold backs; 3) ITEMS: a leather satchel with gold buckles and a violet gem clasp; 4) EMPTY LIFE: the EXACT same heart as the attached ikon_can (same gold frame, same outline, same size), but the crystal heart is drained: dark unlit grey-violet glass with a faint hairline crack, no red, no glow, the gold frame slightly dull; 5) FORESIGHT: a small gold spyglass with a glowing violet crystal lens; 6) HINT: a short gold candle holder with a small bright warm flame and a violet gem on its base (clearly different from a lantern).
```
- **Nerede:** tahta → `body.hz3 #mac .tahtaSayac svg.ik` (`#i-kilic` yerine); havuz → `#pencere .kdEk` (Havuzda x/y), 2D hazırlıkta `.kart .havuzEt`; eşya → `#esyaRaf` başlığı, Nasıl oynanır; boş can → Hızlı Maç'ta `#kalpler .hik.bos` (kaybedilen canlar; bugün `ikon_can`'a `filter: grayscale(1) brightness(.45)` uygulanıyor), eski `ik_kalp_bos.png` yerine; gözcü → rakip önizleme, Önceden görme armağan türü; ipucu → `.yukEkran .ipucu .ik` (`#i-isik`), `.tabletNot .ik`, `#mac .rakip .ipucuSatir .ik` (`#i-isik`).
- Önceki sürümde 4. sırada olan `ikon_lobi` çıkarıldı: lobi için #5'in `amblem_lobi`'si kullanılır (`.rakipKim .lbS`, lobi paneli başlığı). Aynı kavrama iki ayrı simge bütünlüğü bozuyordu. İpucu ikonu da fener yerine mum oldu: `ikon_hayalet` (#47) zaten fenerdi, ikisi aynı silüete düşüyordu.

## 47. İkon seti 6: tur ve rakip türü: `ikon_set_tur`
- Yatay (tuval 1536×1024), 6 ikon, 3 × 2.
- Parçalar: `ikon_savas`, `ikon_armagan`, `ikon_kervan`, `ikon_canavar`, `ikon_hayalet`, `ikon_yansima`.
```
[GİRİŞ] [İKON] [SET 6, in 3 columns and 2 rows] 1) BATTLE: two crossed gold swords; 2) GIFT: a small ornate gold offering chalice with a glowing violet crystal hovering just above its rim, a few tiny sparkles (NOT a sun, NOT a star: the sun gem is a different icon); 3) CARAVAN: a small banner flag on a pole above a gold-bound wooden chest; 4) MONSTER: three deep red claw scratch marks over a dark stone disc (no skull); 5) GHOST PLAYER: a small spectral violet flame inside a gold lantern; 6) MIRROR: an oval hand mirror with a gold frame and violet reflective glass.
```
- **Nerede:** tur tipi → `#mac .macUst > .rozet:nth-child(3)` ve bölüm haritası; `.rakipKim .etiket` türe göre (bot = hayalet, gerçek oyuncu = `ikon_ustalik`, canavar, yansıma; bugün hepsi aynı yeşil hap); kervan → Kervan penceresi başlığı, Kervan bilgi plakası; savaş → `#sOzet .ik`, `#son` Yeniden oyna (`#i-kilic`), `#dDovus`.

## 48. İkon seti 7: hız ve ses: `ikon_set_hiz`
- Yatay (tuval 1536×1024), 6 ikon, 3 × 2.
- Ek referans: `kut/web/arayuz/menu/ikon_hiz.webp` (oyunda bugün kullanılan ileri sar ikonu: iki altın üçgen, mor taşlı). 1–4 onunla aynı üçgen biçiminden türer; yeni bir ok dili açılmaz.
- Parçalar: `ikon_hiz1`, `ikon_hiz2`, `ikon_hiz3`, `ikon_sona_gec`, `ikon_ses`, `ikon_muzik`.
```
[GİRİŞ] [İKON] [SET 6, in 3 columns and 2 rows] Items 1 to 4 use EXACTLY the same gold triangle shape, bevel and small violet gem as the attached ikon_hiz (two gold triangles pointing right). 1) SPEED 1: one such gold triangle pointing right; 2) SPEED 2: two such triangles (like the attached); 3) SPEED 3: three such triangles with a warm glow; 4) SKIP TO END: two such triangles followed by a vertical gold bar; 5) SOUND: a small gold horn with three curved sound waves; 6) MUSIC: a small fantasy gold harp with a violet gem.
```
- **Nerede:** `#savas .hizlar .btn` (1× / 2× / 3×; bugün üçünde aynı ikon ve ikona binen yazı), `#savas .duraklat .btn.sonaGec` (`dugme_yuvarlak` + ikon; sıkışmış "SONUCA GEÇ" hap düğmesi yerine), `.ogrDug .atla` yanında; ses / müzik → Ayarlar satırları ve Ses sekmesi.

## 49. Eksik alamet madalyonları: `alamet_set_1`
- Kare (tuval 1024×1024), dört madalyon, 2 × 2. Dördünde aynı halka.
- Parçalar: `al_demirci`, `al_gocMevsimi`, `al_kutSessiz`, `al_uzunGolge`.
```
[GİRİŞ] [SET 4, in 2 columns and 2 rows] Round omen medallions: each a circular painted sky scene inside the same polished gold ring with a tiny violet gem at the top. 1) SMITH'S FIRE: a glowing anvil with a hammer and flying orange embers; 2) MIGRATION SEASON: swirling autumn leaves in an amber sky; 3) SILENCE OF KUT: a dark eclipsed sun with a faint grey corona; 4) LONG SHADOW: a low orange sunset sun casting long violet shadows over hills.
```
- **Nerede:** `#mac .alamet .ay` ve `#savas .alametK .ay` (bugün ⚒️ 🍂 🌑 🌇 emojisi ya da boş koyu daire); `arayuz.js` `AL_RESIM` listesine eklenir.

---

# ÖNCELİK 4: Hazırlık ayrıntıları, 3D, ışık ve arka planlar

## 50. Yuva seti: `yuva_set`
- Kare (tuval 1024×1024), dört parça, 2 × 2.
- Parçalar: `yuva_kare`, `yuva_kare_secili`, `yuva_kart_bos`, `muhur_kilit`.
```
[GİRİŞ] [SET 4, in 2 columns and 2 rows] 1) EMPTY SQUARE SLOT: a recessed dark square socket with a thin gold rim and rounded corners; 2) SELECTED SQUARE SLOT: the same with a bright glowing gold rim; 3) EMPTY CARD EMBLEM: a faded, dim engraved gold sun-crest emblem (placeholder for an empty shop slot); 4) LOCK SEAL: a small round gold seal medallion with a padlock motif and a violet gem.
```
- **Nerede:** `body.hz3 #esyaRaf .re` / `.esyaRaf .re.secik` (eşya ikonunun kendi halkasıyla çift çerçeve olmasın diye yuva sade), `#rakipTahta .m` (mini hücre), `#kartlar .kart.bos` (kesik çizgi yerine `kart_cerceve` + sönük amblem), kilitli dükkân (`oyun.M.kilit`; her kartın köşesine mühür).

## 51. KERVAN düğmesi: `dugme_kervan_set`
- Yatay (tuval 1536×1024), iki düğme yan yana, `dugme_savas` ile aynı boy ve biçim.
- Ek referans: `dugme_savas.webp`, `dugme_savas_basili.webp`.
- Parçalar: `dugme_kervan`, `dugme_kervan_basili`.
```
[GİRİŞ] [SET 2, side by side, identical size] The SAME square button as the attached dugme_savas (ornate gold frame with violet corner gems, glossy gold-amber face), but the emblem in the middle is a caravan: a small banner flag on a pole over a gold-bound chest. 1) NORMAL; 2) PRESSED: slightly darker, inner shadow.
```
- **Nerede:** `#mac .savasBtn` Kervan turunda (bugün savaş olmayan turda çapraz kılıç görünüyor).

## 52. İkon seti 8: ayar ve armağan kademesi: `ikon_set_ayar`
- Yatay (tuval 1536×1024), 6 ikon, 3 × 2.
- Parçalar: `ikon_grafik`, `ikon_kare_hizi`, `ikon_kivilcim`, `ikon_alev`, `ikon_gunes`, `ikon_alamet`.
```
[GİRİŞ] [İKON] [SET 6, in 3 columns and 2 rows] 1) GRAPHICS: a faceted crystal prism splitting light into a small rainbow; 2) FRAME RATE: a small gold gauge dial with a needle; 3) SPARK TIER: a small silver-blue spark gem with tiny rays; 4) FLAME TIER: an orange-gold flame-shaped gem; 5) SUN TIER: a radiant golden sun gem; 6) OMEN: a violet orb showing an eclipse, resting in a gold cradle.
```
- **Nerede:** Ayarlar Görüntü satırları (kalite, uyarlanır kalite, kare hızı), `#perde.armagan .sc.arm .kd` (KIVILCIM / ALEV / GÜNEŞ yazısının solunda kademe arması), armağan türü Alamet, `#armaganSerit`.

## 53. Pencere amblemleri: `amblem_set_2`
- Kare (tuval 1024×1024), dört amblem, 2 × 2.
- Parçalar: `amblem_sezon`, `amblem_ganimet`, `amblem_soy_muhru`, `amblem_cihaz_cevir`.
```
[GİRİŞ] [İKON] [SET 4, in 2 columns and 2 rows] Larger painted emblems: 1) SEASON: a gold shield-shaped crest with a radiant sun gate (an arch with a rising sun) and violet gems; 2) LOOT: an open gold-bound treasure chest with glowing violet crystals inside; 3) LINEAGE SEAL: a round gold seal stamp with an abstract crystal mark and a violet ribbon; 4) ROTATE DEVICE: a gold-framed tablet standing upright, its screen plain dark violet glass and completely blank (no interface, no symbols on it), with a curved glowing arrow around it suggesting turning it sideways.
```
- **Nerede:** sezon → `#ana .sezon` (yanında `kurdele_mor`); ganimet → Ganimet seçimi başlığı; soy mührü → Soy Mührü seçimi başlığı; cihaz → `.dondur i` (dikey uyarı; dönen boş CSS dikdörtgen yerine, zemin `yukleme_arka`).

## 54. Rün halkaları (3D decal): `run_halka_set`
- Yatay (tuval 1536×1024), iki halka yan yana, aynı boy. Beyaz-altın; oyun renklendirir. **Siyah zemin, opak** ([IŞIK]; three.js toplamalı karışımla koyar).
- Parçalar: `run_halka_dost`, `run_halka_rakip`.
- (Önceki sürümde tek görsel `run_halka` idi. Rakip diskinde bugün canvas ile çizilmiş üç dışa bakan diken var; renk körü oyuncu için dost ve rakibi biçim de ayırsın diye ikinci halka eklendi.)
```
[IŞIK] [SET 2, side by side, identical size] Top-down circular magic ring decals for a game board, each perfectly centered: 1) ALLY: two thin concentric glowing rings with small abstract geometric glyphs between them (not real letters), perfectly round and symmetric; 2) ENEMY: the SAME two rings and glyphs, plus three short sharp outward-pointing light spikes on the outer ring, evenly spaced at 120 degrees. Both pale white-gold so they can be tinted in the engine, soft glow, the centers black (empty).
```
- **Nerede:** dost → sahne3d.js `hzr.secHalka` (seçili kahraman; düz sarı halka yerine), `tarafMalzeme(0)` (oyuncu, mavi tint; canvas radyal disk yerine), kaynaşma ayak halkası (pembe tint), Kut kipinde birim ayağı; rakip → `tarafMalzeme(1)` (kırmızı tint; canvas dikenli disk yerine).

## 55. Tahta karo ve kaide decal'leri: `karo_set`
- Yatay (tuval 1536×1024), üç parça: üstte iki parça yan yana, altta boydan boya ince çizgi. Açık altın-beyaz; oyun renklendirir.
- Parçalar: `karo_yuva`, `kaide_yuva`, `orta_cizgi`.
```
[GİRİŞ] [SET 3, two side by side on top and one long strip across the bottom] Top-down decals for a stone game board, pale gold-white so they can be tinted in the engine: 1) SQUARE TILE SOCKET (about 3:2): a rounded-rectangle engraved groove with thin gold inlay lines and tiny corner studs, the inside transparent; 2) ROUND PEDESTAL SOCKET: a circular engraved ring with gold inlay and four small notches, the inside transparent; 3) CENTER LINE (very long, about 16:1): a thin glowing gold inlay line with small abstract geometric nodes evenly spaced along it (not letters), both ends tapering to fine points.
```
- **Nerede:** sahne3d.js `karoDoku()` / `hzr.karo` (tahta hücreleri; canvas ile çizilmiş beyaz çizgili dikdörtgen yerine; normal, hedef altın, geçersiz kırmızı, seçili, kaynaşma pembe tint), `hzr.yKaro` ve `hzr.sira` (yedek sırası kaideleri); orta çizgi → arenanın iki tarafını ayıran altın çizgi (`sahneyiHazirla` içindeki düz `PlaneGeometry` çizgi + 8×64 canvas gradyan parıltı yerine; hazırlıkta ve savaşta tahtanın ortasında her an görünür).

## 56. Işık huzmesi: `isik_huzme`
- Kare (tuval 1024×1024; robotun en büyük kare boyutu bu). Yumuşak, ortadan yayılır. **Siyah zemin, opak** ([IŞIK]).
```
[IŞIK] Soft volumetric god-ray burst texture: many soft-edged golden light beams radiating from the exact center in all directions, varied widths, feathered edges fading into the black toward the outside, a bright warm glow at the center, no hard wedges, painterly.
```
- **Nerede:** `#perde.armagan::before`, `.sonucPerde .spIsin`, `#sonToren .trIsin`, `#son .isinlar`, `.yukEkran .huzme` (hepsi bugün keskin kenarlı CSS `repeating-conic-gradient`; CSS ile döner, gümüş ve mavi tonu `filter` ile).

## 57. Işık parçaları: `fx_set`
- Kare (tuval 1024×1024), dört parça, 2 × 2. **Siyah zemin, opak** ([IŞIK]). Duman bu setten çıktı (#64): koyu duman toplamalı karışımla görünmez, gerçek şeffaflık ister.
- Parçalar: `fx_hale`, `fx_sok_halka`, `fx_kivilcim`, `fx_parilti`.
```
[IŞIK] [SET 4, in 2 columns and 2 rows] Soft painted light effect sprites: 1) GLOW HALO: a round soft warm-gold glow fading into the black; 2) SHOCK RING: a thin bright gold ring of light with a soft falloff, the center black; 3) SPARK STAR: a four-pointed bright white-gold sparkle; 4) SHINE SWEEP: a tall soft diagonal streak of white-gold light (about 1:3, tilted about 18 degrees), brightest along its center line and fading to black on both sides, like a glint sliding across polished metal.
```
- **Nerede:** hale → `#ana .logoKap::before`, `#ana .oynaKol::before`, `#kutParlama`, `.sonucPerde .spPatla`, `.sAmblem .isik` ve `.sAmblem .flas` (sonuç bandı amblem ışığı ve patlama flaşı; bugün CSS radyal gradyan, zafer altın / yenilgi kırmızı / berabere mavi tonu `filter` ile); şok halkası → `.sgAmblem .halka`, `#sonToren .halka`, `.sAmblem .halka`, öğretici dokunuş halkası; kıvılcım → `.kivilcim i`, `#ana .anaKivilcim i`; parıltı → `#ana .oyna .parilti::before` (OYNA düğmesinden kayan parıltı), `.sonucBant .sParilti` (ZAFER / BERABERE yazısından kayan parıltı); ikisi de bugün CSS doğrusal gradyan.

## 58. Zerre seti: `zerre_set`
- Yatay (tuval 1536×1024), sekiz parça, 4 × 2.
- Parçalar: `zerre_kor`, `zerre_altin_pul`, `zerre_kristal`, `zerre_yildiz`, `zerre_yaprak`, `zerre_toz`, `zerre_mavi`, `zerre_turuncu`.
```
[GİRİŞ] [SET 8, in 4 columns and 2 rows] Small particle sprites, NO frame, NO mount and NO gem setting around them (ignore the frame style of the references, keep only their colors and painterly finish): a glowing ember, a gold flake, a violet crystal shard, a tiny gold star, a pink petal, a golden dust mote, a sky-blue sparkle, a warm orange ember.
```
- **Nerede:** `#konfeti i` (CSS renkli dikdörtgenler yerine), `.yukEkran .parca i`, `#perde.armagan::after`, `#ana .anaKivilcim`.

## 59. Kodeks arka planı: `kodeks_arka`
- Yatay, en büyük yatay tuval (en az 1536×1024; 2560×1600 olursa daha iyi). **Opak**.
- Referans: `kut/gorsel/arena_konsept.webp`, `kut/web/arayuz/menu/karsilama_arka.webp`.
```
[SAHNE] Wide painted "hall of heroes" backdrop on a floating island at violet dusk: tall carved stone arches with gold inlay, hanging violet-and-gold banners with abstract crystal motifs (no real symbols), glowing crystal pedestals along the sides, soft volumetric light from above. The CENTER 70% is calm, darker and low in detail (two large panels will cover it); details only near the edges and the top. No creatures.
```
- **Nerede:** `#kodeks .gok` (bugün maçın genel `gokyuzu.webp`'si ve CSS karartma).

## 60. Armağan arka planı: `armagan_arka`
- Yatay, en büyük yatay tuval. **Opak**.
```
[SAHNE] Wide magical backdrop: a deep violet sky with a radiant golden light source at the center sending soft volumetric rays outward, drifting gold motes and faint floating island silhouettes far below, the center bright but calm (three cards will be placed over it). No creatures, no frame.
```
- **Nerede:** `#perde.armagan` (CSS radyal gradyan ve conic huzmeler yerine; üstünde #56 dönebilir).

## 61. Alamet madalyonları, yeniden (bütünlük) 1: `alamet_set_2`
- #49 ile aynı halka; #49'un çıktısını ekle. Kare (tuval 1024×1024), 2 × 2.
- Parçalar: `al_yok`, `al_kanAyi`, `al_sis`, `al_tipi`.
```
[GİRİŞ] [SET 4, in 2 columns and 2 rows] The SAME round omen medallion ring as the attached one, each with a circular painted sky scene inside: 1) CALM SKY: a gentle sun behind soft clouds; 2) BLOOD MOON: a large red full moon; 3) MIST: swirling violet fog; 4) BLIZZARD: a driving snowstorm with icy blue light.
```
- **Nerede:** eski 128 px `kut/arayuz/ui/al_yok.png`, `al_kanAyi.png`, `al_sis.png`, `al_tipi.png` yerine (`alametArka()`).

## 62. Alamet madalyonları, yeniden (bütünlük) 2: `alamet_set_3`
- #49 ile aynı halka; #49'un çıktısını ekle. Kare (tuval 1024×1024), 2 × 2.
- Parçalar: `al_kutYagmur`, `al_pazar`, `al_tutulma`, `al_yaz`.
```
[GİRİŞ] [SET 4, in 2 columns and 2 rows] The SAME round omen medallion ring as the attached one, each with a circular painted sky scene inside: 1) KUT RAIN: glowing gold light droplets falling from a violet sky; 2) BOUNTIFUL MARKET: a small pile of gold coins beside a little cloth sack; 3) ECLIPSE: a dark disc sliding over a glowing sun; 4) SUMMER HEAT: a blazing sun with shimmering heat waves.
```
- **Nerede:** eski `al_kutYagmur.png`, `al_pazar.png`, `al_tutulma.png`, `al_yaz.png` yerine.

## 63. Perde vinyeti: `perde_vinyet`
- Yatay, en büyük yatay tuval (1536×1024). **Opak**: ortası saf beyaz, kenarlar koyu mor-siyah. Şeffaf istenmez: yumuşak yarı saydam geçişi robot güvenilir çizemiyor. Oyun bu görseli "multiply" karışımla koyar; beyaz yer görünmez, koyu kenar karartır. Tam ekrana `cover` ile gerilir, ayrıntı olmadığı için esneme görünmez.
```
Full-screen vignette multiply mask, landscape 3:2, opaque image, no transparency: the large center area pure white (#FFFFFF), the edges and corners gradually darkening through soft lavender into deep violet-black (#140820) with a faint painterly violet mist in the darkest corners, a smooth even falloff, no shapes, no frame, no objects. NO TEXT.
```
- **Nerede:** `.perde` / `#perde` (düz `rgba(8,2,20,.66)` karartma yerine; altında hafif düz karartma kalır), `#ana .anaPerde` (karşılama arka planının üstündeki CSS doğrusal gradyan karartma), `.ogrCerceve` dışındaki öğretici karartması.

## 64. Duman ve çatlak: `fx_set_2`
- Yatay (tuval 1536×1024), iki parça yan yana. **Şeffaf** (gerçek alfa; #57'nin tersine koyu parçalar olduğu için siyah zemin olmaz).
- Parçalar: `fx_duman`, `fx_catlak`.
```
[GİRİŞ] [SET 2, side by side] Hand-painted effect sprites, NO frame, NO gems, NO metal on them (ignore the frame style of the references, keep only their colors and painterly finish): 1) SMOKE PUFF: a soft round violet-grey smoke puff with a few curls, denser in the middle; 2) CRACK: a long jagged horizontal crack line (about 8:1), dark burgundy-black with a thin bright red-orange glowing edge along one side, a few short side branches, both ends tapering to hairline points.
```
- **Nerede:** duman → `.yenilgi .duman i` (bugün CSS radyal gradyan daireler; önceki sürümde #57'deydi); çatlak → `.yenilgi .catlakCizgi` (YENİLGİ yazısının ortasından geçen çatlak; bugün elle yazılmış SVG `polyline`, düz koyu çizgi), `bant_yenilgi` uçlarındaki çatlaklarla aynı dil.

---

## Yeni görsel istenmeyen, kitten karşılanan öğeler

Tarama listesindeki bazı öğeler için ayrı görsel istenmedi; kitteki bir parçayla ya da mevcut robot görseliyle çözülür:

- **OYNA ikonu** (`#ana .oyna .ana .ik`), Öğreticiyi baştan oyna (`#nOgr`), video oynat (`.kdVidOyna`): mevcut `ikon_oynat.webp` (videoda `dugme_yuvarlak` üstünde).
- **Yeni Maç ikonu** (`#ana .macSec .yeniMac .ik`), armağan Yenile kartı (`#perde.armagan .sc[data-yenile]`): mevcut `ikon_yenile.webp` (Yenile kartında `dugme_yuvarlak` + #42'den küçük hak rozeti).
- **Kapat, geri, sona geç düğmeleri:** mevcut `dugme_yuvarlak.webp` + #14, #15, #48 ikonları.
- **Kart üstü soy simgesindeki çift halka** (`#kahIzgara .kk .soylar .soyIk`): yeni görsel yok; CSS halkası kaldırılır.
- **Seçim sayacı** (`#arSaat`): mevcut `hud_saat.webp` küçük boyda.
- **Seviye göstergesi:** #4 madalyon + mevcut `ikon_deneyim` ve `cubuk_deneyim`.
- **Armağan türü rozetleri:** Kut → `ikon_gunes`, Kaynaştırma → mevcut `ikon_kaynastir`, Önceden görme → `ikon_gozcu`, Eşya → `ikon_esya`, Ekonomi → mevcut `ikon_altin`, Seviye → mevcut `ikon_deneyim`, Alamet → `ikon_alamet`, Geri dönüş → mevcut `ikon_yenile`.
- **Savaş konuşma balonları** (sahne3d.js `balonCiz`): dost `cip_altin`, düşman `cip_yakut`, Kut `cip_gunbatimi`; altına `balon_kuyruk`.
- **Kut portre kartı** (sahne3d.js `kutKart`): `plaka_kehribar` + `halka_altin`.
- **Canavar dalgası portreleri:** mevcut `kut/gelen_gorsel/canavar_*` görselleri.

Tamlık denetiminde (ikinci tarama) bulunan ve yeni görsel gerektirmeyen eşleşmeler:

- **Eski `ik_*` ikonları** (`arayuz.js` `IK_RESIM`, `ik()` yardımcısı; robot ikonlarıyla aynı ekranda iki ayrı tarz): `ik('coin')` / `ik_altin.png` → mevcut `ikon_altin` (dükkân fiyatı `.kart .fiyat`, Yenile ve Deneyim düğmelerindeki bedel, `.kdCip.fiyat`, `#eSat` / `#bkSat` satış değeri, faiz satırı); `ik('kalp')` / `ik_kalp.png` → mevcut `ikon_can` (`.kdStat` Can, 2D `secPanel` statı), boşu #46 `ikon_can_bos`; `ik('kupa')` / `ik_kupa.png` → #35 `ikon_kupa`; `ik('tac')` / `ik_tac.png` → profilde #35 `ikon_ustalik`, mod kartında #5 `amblem_lobi`; `ik('yildiz')` / `ik_yildiz_altin.png` → #44 `yildiz_set` (`#sonSerit .mad.r` dahil). `IK_RESIM` boşalınca `ik()` yalnız kit görsellerine bakar.
- **Kaynaşma simgesi** (sahne3d.js `kaynasCiz()` / `kaynasDoku()`: canvas ile çizilmiş iç içe iki renkli halka, birim başında ve can çubuğunun solunda): mevcut `ikon_kaynastir` (iki iç içe altın halka) küçük boyda; altında #18 `yildiz_hap`. #43'teki `halka_gunbatimi` portreli kaynaşma madalyonu (`.madalyon`) içindir.
- **Kut balonundaki güneş** (sahne3d.js `gunesCiz()`: canvas çizgiler ve radyal gradyan): #52 `ikon_gunes`.
- **Birim can çubuğu yıldızları** (sahne3d.js `yildizCiz()` + `YILDIZ_RENK`): #44 `yildiz_set` (★1 bronz, ★2 gümüş, ★3 altın); çevresindeki hap #18 `yildiz_hap`.
- **Pasif düğmeler** (`.btn.sat:disabled`, `.btn.gb:disabled`): #7 `dugme_mor_pasif` (biçimler aynı).
- **2D hazırlık yedeği** (yalnız WebGL açılamazsa ya da `?hazirlik3d=0` ile görünür; `body:not(.hz3)`): yuva `.yuva` → #50 `yuva_kare` / `yuva_kare_secili` ve #30 kart çerçevesi; `.yuva .seciliEt` ("Seçili") → `cip_altin`; `.yuva .kaynasEt` ("KAYNAŞIK") → `cip_gunbatimi` + `ikon_kaynastir`; `.kart .havuzEt` → `cip_notr` + `ikon_havuz`; `.dusmanOk` → #18 `ok_sag` (döndürülmüş) + #12 ayraç; `.siraAd` → #17 `baslik_bandi`; `.secPanel` → #16 `panel_ince_mor`; `.secPanel .statlar .ik` → #34 stat ikonları (bugün SVG'ler inline `color` ile boyanıyor); `.kaynasSema .kk` → #30 çerçeve, `.kaynasSema .soru` → #14 `ikon_nasil`; `.yetenek` / `.yetenek.pasif` kutuları → #20 safir / ametist plaka. Yeni görsel gerekmez.

## Dosya adları ve çakışmalar

Denetim bütün başlık ve parça adlarını (64 dosya adı, 211 parça adı) birbiriyle ve depodaki mevcut dosyalarla (`kut/arayuz/**`, `kut/web/arayuz/**`, `kut/gelen_gorsel/`, `kut/gorsel/`, `kut/konsept/`) karşılaştırdı. Belge içinde aynı ad iki kez geçmiyor. Mevcut dosyalarla aynı adı taşıyanlar:

- `al_yok`, `al_kanAyi`, `al_sis`, `al_tipi`, `al_kutYagmur`, `al_pazar`, `al_tutulma`, `al_yaz` (#61, #62): **bilerek aynı**. `kut/arayuz/ui/al_*.png` (128 px, `alametArka()` kullanıyor) bunların yerine geçer; eskiler silinir.
- `dugme_gunbatimi` (#8): `kut/arayuz/ui/dugme_gunbatimi.png` kodda kullanılmıyor; yeni parça kit klasörüne gider, eskisi silinir.
- `kut_hazir` / `kut_bitti`: çakışmasın diye #36'nın parçaları `kut_dugme_hazir` / `kut_dugme_bitti` olarak yeniden adlandırıldı.
- Ad benzerliği, çakışma değil: yeni `ikon_hiz1..3` ile mevcut `ikon_hiz` (#48 onu referans alır, mevcut ikon `ikon_hiz2`'nin yerine kalabilir); yeni `yildiz_*` ile eski `ik_yildiz_*`; yeni `kart_cerceve_k1..3` ile eski `w_kart_k1..3`.

Kesilen bütün parçalar tek yeni klasöre, `kut/web/arayuz/kit/` altına webp olarak gider (mevcut `web/arayuz/menu/` ile karışmaz). Robotun teslim ettiği `kut/gelen_gorsel/*_a.png` adları başlıktaki dosya adlarıdır; `gelen_gorsel` içinde bunlarla çakışan dosya yok.

## Teslim

- Dosyaları `kut/gelen_gorsel/` klasörüne PNG olarak koy. Ad: başlıktaki dosya adı + `_a` (ve varsa `_b`). Örnek: `mod_kart_arena_a.png`, `dugme_mor_set_a.png`, `ikon_set_menu_b.png`.
- Set görsellerini kesme; tek dosya olarak koy.
- Göndermeden önce her görselde bak:
  1. yazı, harf ya da sayı yok;
  2. arka plan gerçekten şeffaf (arka planlar ve dokular hariç); [IŞIK] ekli #37, #54, #56, #57'de zemin saf siyah ve opak, ışıkta çerçeve ya da taş yok; #63'te orta saf beyaz;
  3. 9-slice / 3-slice parçalarda kenarın ortasında süs yok, iç dolgu düz ve tam opak (yarı saydam değil); "yalnız çerçeve" parçalarda içi tamamen boş;
  4. set görsellerinde parça sayısı doğru ve parçalar birbirine değmiyor, tuvalin kenarına da değmiyor;
  5. aile görsellerinde biçim referansla aynı (#46'daki boş kalp `ikon_can` ile, #48'deki hız ikonları `ikon_hiz` ile birebir aynı biçimde);
  6. aynı kavrama iki ayrı simge çıkmadı: `ikon_armagan` (kadeh) güneşe, `ikon_ipucu` (mum) fenere benzemiyor.
- Beğenmediğin çeşidi koyma. Bir görsel hiç tutmazsa atla ve commit mesajında numarasını yaz.
- Başka dosyaya dokunma. Tek commit: `Kut Arena: arayüz kiti görselleri (robot, GORSEL_ISTEK_3)`. `claude/epic-albattani-jbmonn` dalına push et.
- Görseller gelince Claude onları keser, sıkıştırır (webp), `kut/web/arayuz/kit/` altına koyar ve oyuna bağlar; eski `w_*` seti, eski `ik_*` ikonları (`IK_RESIM`), SVG ikonlar, emojiler ve `sahne3d.js` içindeki canvas çizimleri emekliye ayrılır.
