# Kut Arena: görsel üretim rehberi (ChatGPT → Tripo → Unity)

Bu rehber, karakterleri ve arenayı ChatGPT'de çizip Tripo'da 3D'ye çevirerek Unity'ye almak için gereken adımları ve hazır komutları içerir. Komutlar İngilizce, çünkü görsel modeller İngilizce komutta daha tutarlı sonuç veriyor. Kopyalayıp aynen yapıştırabilirsin.

## 0. Önce tek kahramanla dene

16 karakterin hepsini çizdirmeden önce **yalnız Tepegöz** ile bütün yolu bir kez yürü: ChatGPT → Tripo → iskelet ve animasyon → Unity. Ölçek, iskelet ve doku sorunları burada çıkar. 16 modelde çıkarsa 16 kez düzeltmek gerekir.

## 1. Tarzı sabitle

Her çizimi ayrı sohbette istersen karakterler birbirine benzemez. Bunu önlemek için:

1. ChatGPT'de bir sohbet aç ve **önce 4 kahramanı yan yana** çizdir (aşağıdaki "Toplu görsel" komutu). Beğendiğin görseli kaydet; bu, **tarz referansın** olacak.
2. Sonraki her karakteri **aynı sohbette** iste ve her seferinde tarz referansı görselini ekle. Komutun başına şunu yaz: `Match the exact art style of the attached reference image.`

### Ortak tarz bloğu (her karakter komutunun başına eklenir)

```
Stylized 3D game character concept art for a tablet auto-battler game. Hand-painted texture look, chunky readable proportions (head about 1/4.5 of body height, slightly oversized hands and feet), bold clear silhouette, saturated but soft colors. Fashion inspired by Turkic and Central Asian steppe folklore: felt and fur garments, embroidered ornaments, coin jewelry, ancient Turkic geometric patterns.
FULL BODY, FRONT VIEW, A-POSE: arms held 30 degrees away from the body, legs slightly apart, standing straight, both feet fully visible, neutral calm pose. Weapons and props held clear of the body, not overlapping the torso or legs.
Single character only, centered, plain light grey background, soft even studio lighting, no cast shadow, no ground, no text, no logo, no frame, no motion blur, no cropping.
```

> **Neden bu kurallar:** Tripo tek bir görselden 3D çıkarıyor. Önden bakış, kollar gövdeden ayrık (A-poz), düz fon ve gölgesiz ışık en temiz modeli verir. Kol gövdeye yapışıksa model yapışık çıkar ve iskelet bozulur. Silah gövdenin önündeyse gövdeyle kaynaşır.

### Toplu görsel (tarz referansı için ilk iş)

```
[ORTAK TARZ BLOĞU]
Show a lineup of four different characters side by side on the same grey background, same scale, same style: a one-eyed giant shepherd, an old shaman with a frame drum, a fierce bearded sword warrior, and a winter elder with a long white beard and ice staff. Each in A-pose, front view.
```

## 2. Kahraman komutları

Her komut `[ORTAK TARZ BLOĞU]` ile başlar, ardından karakterin satırı gelir. Ana renkler `data.js`'teki oyun renkleriyle aynıdır, böylece arayüzle uyumlu olur.

**İskelet türü:** **İnsan** iskeletli modeller, Unity'nin insan iskeleti (Humanoid) sayesinde animasyonları **ortak kullanır**. Bu büyük tasarruf: bir saldırı animasyonu bütün insan kahramanlara gider. **Dört ayaklı** modeller kendi iskeletini alır. **Özel** modeller sona bırakılır (bkz. §4).

| # | Kahraman | İskelet | Komut (tarz bloğundan sonra) |
|---|---|---|---|
| 1 | Tepegöz | İnsan | `A huge one-eyed giant shepherd: single large eye in the middle of his forehead, bald head, broad muscular body, rough earthy brown skin (#a3775a), sheepskin fur vest, rope belt, cloth wraps on his feet, holding a crude stone club in his right hand held away from the body.` |
| 2 | Kam | İnsan | `An old Turkic shaman: long robe in ochre and gold (#c9a24a) covered with hanging metal pendants and colored ribbons, owl-feather headdress, painted round frame drum in his left hand and a curved drumstick in his right, both held away from the body.` |
| 3 | Alkarısı | İnsan | `An eerie folklore spirit woman: very long tangled black hair, pale skin, glowing crimson eyes, tattered crimson dress (#b4435a), long thin fingers with sharp nails, bare feet, mysterious and creepy but not gory.` |
| 4 | Yel Ana | İnsan | `The mother of winds: graceful woman with floating hair, flowing teal robes (#7fc8c0) whose hem dissolves into swirling wind spirals, carved wooden recurve bow in her left hand, quiver on her back.` |
| 5 | Deli Dumrul | İnsan | `A fierce wild-hearted warrior: thick dark beard, lamellar leather armor, rust-orange cloak (#d06a3c), fur-trimmed pointed helmet, curved sabre in his right hand, round shield on his left arm held away from the body.` |
| 6 | Şahmeran | İnsan | `The wise queen of serpents: woman with a small golden crown and calm wise face, long emerald-green gown (#5aa86a) with snake-scale pattern that reaches the floor, a serpent tail trailing behind her from under the gown, a small snake coiled around her right forearm.` |
| 7 | Karakoncolos | İnsan | `A hunched winter goblin-ogre: covered in shaggy icy-blue fur (#7aa6d6), long arms with big clawed hands, frost crystals growing on shoulders and back, glowing pale eyes, mischievous grin, wide stance.` |
| 8 | Od Ana | İnsan | `The mother of fire: warm matronly woman, embroidered orange-red dress (#ef8a3a), headscarf with gold coin ornaments, holding a clay fire bowl with dancing flames in both hands slightly in front of her, held away from the body.` |
| 9 | Umay Ana | İnsan | `A gentle protector goddess: pale gold and white layered robes (#f1e7a6), tall headdress shaped like spread bird wings, a pair of white swan wings on her back, holding a tall staff topped with a carved bird.` |
| 10 | Erlik Han | İnsan | `The imposing lord of the underworld: tall, black beard, dark purple and black iron armor (#5b3f7a), horned iron crown, heavy fur mantle, holding a long iron scepter with a skull-shaped ornament, menacing posture.` |
| 11 | Ayaz Ata | İnsan | `A frost elder of the steppe: old man with a very long white beard, pale blue felt coat (#bfe0ff) with white fur trim and silver ornaments, tall fur kalpak hat, carved staff topped with an ice crystal. Not Santa Claus; ancient Turkic winter elder.` |
| 12 | Albastı | İnsan | `A shadow huntress: dark slate-blue hooded cloak (#4a5578), face half hidden, glowing pale eyes, crescent-moon bow in her left hand, quiver of black arrows, moon-shaped silver ornaments.` |
| 13 | Kayra Han | İnsan | `The sky creator king: regal bearded man in flowing golden robes (#ffd84a), crown with a sun disk, small lightning sparks around his hands, holding a staff with a crackling thunder orb on top.` |
| 14 | Bozkurt | 4 ayaklı | `A mythic grey wolf (#8c97a8): large, noble, standing on all four legs, glowing sky-blue eyes, turquoise tribal markings on its fur, red cloth ribbon tied around its neck. THREE-QUARTER FRONT VIEW instead of front view.` |
| 15 | Tulpar | 4 ayaklı | `A legendary winged horse: cream-white coat (#e7d9b5), flowing golden mane and tail, large feathered wings half-folded on its back, ornamented saddle cloth with Turkic patterns, standing on all four legs. THREE-QUARTER FRONT VIEW instead of front view.` |
| 16 | Zümrüd-ü Anka | Özel | `A legendary phoenix bird: emerald-green body feathers with flaming orange-red wing tips and tail (#ff6a3d), long elegant tail, small crest, standing upright on its legs with wings slightly spread. THREE-QUARTER FRONT VIEW instead of front view.` |

## 3. Tripo ayarları

1. **Image to 3D**: ChatGPT görselini yükle. Kullanılabilen en yeni model sürümünü seç.
2. **Doku**: açık, PBR açık. Doku çözünürlüğü **2048** (tablette yakın çekimde net görünsün).
3. **Yüz sayısı**: **10.000–20.000** üçgen. Ekranda 12 kahraman ve efektler aynı anda olacak, tablet zorlanmasın.
4. Modelden memnun değilsen **aynı görselle 2–3 kez yeniden üret** ve en iyisini seç. Görseli değiştirmek, modeli değiştirmekten daha etkilidir.
5. **İskelet (Auto Rig)**: insan modellerde insan iskeleti, Bozkurt ve Tulpar için dört ayaklı iskelet.
6. **Animasyonlar**: aşağıdaki listeden Tripo'da bulunanları ekle. Eksik kalanlar için §4'e bak.
7. **Dışa aktarma**: **FBX** (Unity'de insan iskeleti en sorunsuz FBX ile çalışır). Dosya adı kahramanın oyundaki kimliği olsun: `tepegoz.fbx`, `kam.fbx`… (kimlikler `data.js`'te).

### Her kahramana gereken animasyonlar

| Ad (Unity'de) | Ne zaman |
|---|---|
| `bekle` | Dururken (döngü) |
| `yuru` | Hedefe giderken (döngü) |
| `saldir` | Normal vuruş (yakın dövüşçüde kılıç ya da yumruk, menzillide ok ya da büyü atışı) |
| `yetenek` | Özel güç; en gösterişli animasyon |
| `vurul` | Ağır darbe alınca |
| `olum` | Ölüm |
| `zafer` | Tur kazanılınca (isteğe bağlı) |

## 4. Tripo'da eksik kalan animasyonlar

- **İnsan modeller: Mixamo (ücretsiz, Adobe).** İskeletsiz modeli (mesh) Mixamo'ya yükle, otomatik iskeleti al. Sonra "Sword Slash", "Spell Cast", "Hit Reaction", "Dying" gibi animasyonları FBX olarak indir. Unity'nin insan iskeleti sayesinde **bir animasyon setini bütün insan kahramanlarda ortak kullanırız**. Her kahramana yalnız kendi özel gücünün animasyonu ayrıca gerekir.
- **Bozkurt ve Tulpar**: Tripo'nun dört ayaklı animasyonları (yürüme, koşma, saldırı) yeterli.
- **Anka**: kuş iskeleti otomatik çıkmayabilir. Unity'de kanat çırpma, süzülme ve dalışı kodla (prosedürel animasyonla) yaparım; senden yalnız iskeletsiz modeli isterim.

## 5. Arena

Tripo tek tek nesneler için iyi, koca bir sahne için iyi değil. Bu yüzden arenayı parçalara bölüyoruz: ChatGPT'den **konsept görsel ve zemin dokusu**, Tripo'dan **çevre nesneleri**. Hepsini Unity'de ben birleştiririm.

### 5a. Arena konsepti (yalnız referans, 3D'ye çevrilmeyecek)

```
Concept art of a circular battle arena on the Central Asian steppe at dusk, seen from a high three-quarter top-down angle like a strategy game board. Flat packed-earth floor with a faint 6 by 8 grid of carved stone tiles, a glowing golden line across the middle dividing two sides. Around the edge: felt yurts, ancient carved stone balbal statues, a sacred tree with colorful prayer ribbons, tall horse-hair tug banners, bronze fire braziers. Purple and orange sky, stylized hand-painted game art, warm and magical atmosphere, no characters, no text.
```

### 5b. Zemin dokusu (ChatGPT; Unity'de zemine döşenir)

```
Seamless tileable texture, top-down orthographic view, packed steppe earth with small pebbles and dry grass tufts, hand-painted stylized game texture, even lighting, no shadows, no perspective, square.
```

Aynı komutu "carved stone floor tile with faint ancient Turkic geometric pattern" olarak bir kez daha iste; karolar için gerekecek.

### 5c. Çevre nesneleri (ChatGPT çizer, Tripo 3D yapar; iskelet gerekmez)

Her birinin başına şunu ekle: `Single 3D game prop concept, stylized hand-painted, front three-quarter view, plain light grey background, no shadow, no ground, no text.`

| Nesne | Komut |
|---|---|
| Çadır (yurt) | `A small felt yurt tent with red wooden door and colorful embroidered bands.` |
| Balbal heykeli | `An ancient carved stone balbal statue of a steppe warrior holding a cup, weathered grey stone.` |
| Kutsal ağaç | `A small sacred tree with twisted trunk and many colorful cloth prayer ribbons tied to its branches.` |
| Tuğ sancağı | `A tall wooden pole topped with a golden crescent and long flowing horse-hair tassels.` |
| Mangal | `A bronze fire brazier on three legs with ornamented rim (fire will be added as an effect, draw it empty).` |
| Kaya grubu | `A cluster of mossy steppe boulders.` |

Tripo'da bu nesneler için 3.000–8.000 üçgen yeterli.

## 6. 2D arayüz parçaları (ChatGPT; 3D gerekmez)

**Soy simgeleri** (10 adet, aynı sohbette sırayla). Her komut:

```
Game UI emblem icon, round badge with a thin gold rim, flat hand-painted style, centered symbol, transparent background, no text. Symbol: [AŞAĞIDAKİ]
```

`Gök`: cloud with a sun ray · `Yer`: mountain peak · `Od`: flame · `Su`: water drop with wave · `Ayaz`: snowflake · `Karanlık`: dark crescent moon · `Dev`: stone fist · `Avcı`: bow and arrow · `Bilge`: scroll with an eye · `Atlı`: galloping horse head.

**Kahraman portreleri**: dükkân kartları için. Tripo modelinden Unity'de ben ekran görüntüsü alıp üretirim, ayrıca çizmene gerek yok.

**Logo**:
```
Game logo text "KUT ARENA", golden ornate letters with Turkic geometric patterns, a glowing sun disk behind the letters, epic fantasy mobile game logo, transparent background.
```

## 7. Bana göndereceklerin ve dosya yerleri

| Ne | Nereye |
|---|---|
| Kahraman modelleri (FBX) | `Assets/Kut/Kahramanlar/<kimlik>/<kimlik>.fbx` |
| Ek animasyonlar (Mixamo FBX) | `Assets/Kut/Animasyon/Ortak/` |
| Çevre nesneleri | `Assets/Kut/Arena/Nesneler/` |
| Zemin dokuları | `Assets/Kut/Arena/Doku/` |
| Simgeler, logo | `Assets/Kut/Arayuz/` |
| ChatGPT konsept görselleri | `Assets/Kut/_Konsept/` (yalnız referans) |

Modeller geldikçe Unity tarafında şunları ben yaparım: iskelet ayarları, animasyon kontrolcüsü, ölçek ve yön, savaş sahnesi, efektler, kamera ve arayüz.
