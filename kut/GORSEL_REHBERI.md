# Kut Arena: görsel üretim rehberi (ChatGPT → Tripo → Unity)

Bu rehber, karakterleri ve arenayı ChatGPT'de çizip Tripo'da 3D'ye çevirerek Unity'ye almak için gereken adımları ve hazır komutları içerir.

**Tema kararı:** Bütün kahramanlar **yaratık**: element yaratıkları ve büyülü hayvanlar. İnsan yok. Cinsiyet, ırk ya da milliyet çağrıştırmazlar, gerçek bir kültürün kıyafetini ya da sembolünü taşımazlar. Her ülkeden oyuncuya aynı mesafede dururlar.

Komutlar İngilizce, çünkü görsel modeller İngilizce komutta daha tutarlı sonuç veriyor. Kopyalayıp aynen yapıştırabilirsin.

## 0. Önce tek kahramanla dene

16 karakterin hepsini çizdirmeden önce **yalnız Kaya Golemi** ile bütün yolu bir kez yürü: ChatGPT → Tripo → iskelet ve animasyon → Unity. Ölçek, iskelet ve doku sorunları burada çıkar. 16 modelde çıkarsa 16 kez düzeltmek gerekir.

## 1. Tarzı sabitle

Her çizimi ayrı sohbette istersen karakterler birbirine benzemez. Bunu önlemek için:

1. ChatGPT'de bir sohbet aç ve **önce 4 yaratığı yan yana** çizdir (aşağıdaki "Toplu görsel" komutu). Beğendiğin görseli kaydet; bu, **tarz referansın** olacak.
2. Sonraki her yaratığı **aynı sohbette** iste ve her seferinde tarz referansı görselini ekle. Komutun başına şunu yaz: `Match the exact art style of the attached reference image.`

### Ortak tarz bloğu (her yaratık komutunun başına eklenir)

```
Stylized 3D game creature concept art for a tablet auto-battler game. A magical creature that is cute but powerful, hand-painted texture look, chunky readable proportions (large head, slightly oversized hands or paws), bold clear silhouette, saturated but soft colors, glowing elemental details.
The creature is NOT human: no human face, no gender cues, no makeup, no human hairstyle, no clothing or symbols from any real-world culture, religion or nation. Original fantasy design only.
Single creature only, centered, plain light grey background, soft even studio lighting, no cast shadow, no ground, no text, no logo, no frame, no motion blur, no cropping.
```

Bu bloğun ardından yaratığın türüne göre **duruş satırı** gelir:

- **İki ayaklı** (kollu ya da kanatlı):
  ```
  FULL BODY, FRONT VIEW, standing upright on two legs, A-POSE: arms (or wings) held 30 degrees away from the body, legs slightly apart, both feet fully visible, calm neutral pose. Any prop is held clear of the body.
  ```
- **Dört ayaklı:**
  ```
  FULL BODY, THREE-QUARTER FRONT VIEW, standing on all four legs, legs clearly separated, tail held away from the body, calm neutral pose.
  ```

> **Neden bu kurallar:** Tripo tek bir görselden 3D çıkarıyor. Uzuvlar gövdeden ayrık, fon düz ve ışık gölgesizse model temiz çıkar. Kol ya da kanat gövdeye yapışıksa model yapışık çıkar ve iskelet bozulur.

### Toplu görsel (tarz referansı için ilk iş)

```
[ORTAK TARZ BLOĞU]
Show a lineup of four different creatures side by side on the same grey background, same scale, same style: a mossy boulder golem with a glowing core, a frog drumming on a big drum, a snowy owl mage with an ice crystal staff, and a small storm dragon with lightning sparks. The golem, frog, owl and dragon all stand upright on two legs in A-pose, front view.
```

## 2. Kahraman komutları

Her komut `[ORTAK TARZ BLOĞU]` + uygun `[DURUŞ SATIRI]` ile başlar, ardından yaratığın satırı gelir. Ana renkler `data.js`'teki oyun renkleriyle aynıdır, böylece arayüzle uyumlu olur.

**İskelet türü:**
- **İki ayaklı** yaratıklara (10 tane) Unity'nin insan iskeleti (Humanoid) takılır. Kanatlılarda kanatlar kol yerine geçer. Böylece **bir animasyon setini 10 yaratık ortak kullanır**; bu büyük iş tasarrufu.
- **Dört ayaklılar** (5 tane) dört ayaklı iskeleti ortak kullanır.
- **Yılan** tek özel model; animasyonunu Unity'de kodla yaparım (bkz. §4).

| # | Kahraman (kimlik) | Duruş | Komut (tarz bloğu + duruş satırından sonra) |
|---|---|---|---|
| 1 | Kaya Golemi (`golem`) | İki ayaklı | `A sturdy boulder golem made of stacked rounded rocks (#a3775a), moss and tiny flowers growing on its shoulders, one large glowing amber crystal core in its chest, huge stone fists, short thick legs.` |
| 2 | Davulcu Kurbağa (`kurbaga`) | İki ayaklı | `A chubby cheerful frog creature (#c9a24a ochre-gold skin with green spots) carrying a round war drum on a strap at its side, holding two drumsticks in its hands away from the body, small leaf cape.` |
| 3 | Sis Yarasası (`yarasa`) | İki ayaklı (kanatlar kol) | `A spooky but cute bat creature standing upright, crimson and dark-red fur (#b4435a), large membrane wings spread like arms, glowing red eyes, small fangs, wisps of mist curling from its wings.` |
| 4 | Rüzgâr Ruhu (`ruzgar`) | İki ayaklı | `A small airy wind elemental: body made of swirling teal wind (#7fc8c0) with floating leaves orbiting it, round face with two glowing eyes, little arms and legs that fade into spirals, a ring of wind around it.` |
| 5 | Kristal Kurt (`kurt`) | Dört ayaklı | `A noble grey wolf (#8c97a8) with a mane of sharp blue crystals along its back, glowing sky-blue eyes, crystal shards on its paws.` |
| 6 | Dağ Koçu (`koc`) | Dört ayaklı | `A powerful mountain ram with huge curled horns covered in glowing orange runes (abstract, not real letters), rust-orange wool (#d06a3c), rocky armored plates on its chest, determined expression.` |
| 7 | Buz Kaplumbağası (`kaplumbaga`) | Dört ayaklı | `A big sturdy tortoise whose shell is a cluster of icy blue crystals (#7aa6d6), frost covering its legs, calm wise eyes, snowflakes drifting around the shell.` |
| 8 | Kor Semenderi (`semender`) | Dört ayaklı | `A glowing fire salamander, orange-red skin (#ef8a3a) with cracks of molten light, small water bubbles floating around its tail, frill around its neck, friendly face.` |
| 9 | Bulut Atı (`bulutat`) | Dört ayaklı | `A magical cloud horse, cream-white coat (#e7d9b5), mane and tail made of soft fluffy clouds, small feathered wings folded on its back, golden hooves.` |
| 10 | Zümrüt Yılan (`yilan`) | Özel (yılan) | `A wise emerald serpent (#5aa86a) coiled with its upper body raised, a crown-shaped crest of golden scales on its head, glowing jade eyes, small glowing runes along its body. THREE-QUARTER FRONT VIEW, body coiled in a clear spiral.` |
| 11 | Işık Kuğusu (`kugu`) | İki ayaklı (kanatlar kol) | `A graceful guardian swan standing upright, pale gold and white feathers (#f1e7a6), wings spread like arms with glowing light edges, a halo of soft light above its head, calm expression.` |
| 12 | Gece Ayısı (`ayi`) | İki ayaklı | `A big bear standing upright, deep purple-black fur (#5b3f7a) with glowing violet runes (abstract, not real letters), a crescent-shaped light mark on its chest, heavy claws, imposing but not scary.` |
| 13 | Anka (`anka`) | İki ayaklı (kanatlar kol) | `A legendary phoenix bird standing upright, emerald-green body feathers with flaming orange-red wing tips and tail (#ff6a3d), wings spread like arms, small crest of fire, long elegant tail feathers.` |
| 14 | Ayaz Baykuşu (`baykus`) | İki ayaklı (kanatlar kol) | `A snowy owl mage standing upright, pale icy blue and white feathers (#bfe0ff), wings spread like arms, holding a short staff topped with a glowing ice crystal in one wing, frost sparkles around it.` |
| 15 | Gölge Tilki (`tilki`) | İki ayaklı | `A mysterious shadow fox standing upright on two legs, dark slate-blue fur (#4a5578), three spectral ghostly tails, glowing pale eyes, a small crescent-moon bow made of light in its paw.` |
| 16 | Fırtına Ejderi (`ejder`) | İki ayaklı | `A small young storm dragon standing upright on two legs, golden-yellow scales (#ffd84a), lightning crackling along its horns and back spikes, small wings on its back, short arms with sparks between its claws.` |

## 3. Tripo ayarları

1. **Image to 3D**: ChatGPT görselini yükle. Kullanılabilen en yeni model sürümünü seç.
2. **Doku**: açık, PBR açık. Doku çözünürlüğü **2048** (tablette yakın çekimde net görünsün).
3. **Yüz sayısı**: **10.000–20.000** üçgen. Ekranda 12 yaratık ve efektler aynı anda olacak, tablet zorlanmasın.
4. Modelden memnun değilsen **aynı görselle 2–3 kez yeniden üret** ve en iyisini seç. Görseli değiştirmek, modeli değiştirmekten daha etkilidir.
5. **İskelet (Auto Rig)**: iki ayaklılar için insan (biped) iskeleti, dört ayaklılar için dört ayaklı (quadruped) iskelet. Yılana iskelet takma.
6. **Animasyonlar**: aşağıdaki listeden Tripo'da bulunanları ekle. Eksik kalanlar için §4'e bak.
7. **Dışa aktarma**: **FBX** (Unity'de iskelet en sorunsuz FBX ile çalışır). Dosya adı kahramanın kimliği olsun: `golem.fbx`, `kurbaga.fbx`… (kimlikler yukarıdaki tabloda parantez içinde).

### Her kahramana gereken animasyonlar

| Ad (Unity'de) | Ne zaman |
|---|---|
| `bekle` | Dururken (döngü) |
| `yuru` | Hedefe giderken (döngü) |
| `saldir` | Normal vuruş (yakın dövüşçüde yumruk, pençe ya da boynuz; menzillide atış) |
| `yetenek` | Özel güç; en gösterişli animasyon |
| `vurul` | Ağır darbe alınca |
| `olum` | Ölüm |
| `zafer` | Tur kazanılınca (isteğe bağlı) |

## 4. Tripo'da eksik kalan animasyonlar

- **İki ayaklılar: Mixamo (ücretsiz, Adobe).** İskeletsiz modeli Mixamo'ya yükle, otomatik iskeleti al. Sonra "Punch", "Spell Cast", "Hit Reaction", "Dying" gibi animasyonları FBX olarak indir. Unity'nin insan iskeleti sayesinde **bu seti 10 iki ayaklı yaratık ortak kullanır**. Her yaratığa yalnız kendi özel gücünün animasyonu ayrıca gerekir.
- **Dört ayaklılar**: Tripo'nun dört ayaklı animasyonları (yürüme, koşma, saldırı) yeterli; 5 yaratık bunları ortak kullanır.
- **Yılan**: iskeletsiz modeli yeter. Kıvrılma, uzanma, ısırma ve süzülme hareketlerini Unity'de kodla ben yaparım.
- **Kanat çırpma**: kanatlı yaratıklarda insan iskeletinin kolu kanadı hareket ettirir. Ek çırpma hareketini Unity'de kodla eklerim.

## 5. Arena

Tripo tek tek nesneler için iyi, koca bir sahne için iyi değil. Bu yüzden arenayı parçalara bölüyoruz: ChatGPT'den **konsept görsel ve zemin dokusu**, Tripo'dan **çevre nesneleri**. Hepsini Unity'de ben birleştiririm.

**Arena teması:** gökte yüzen bir ada üzerinde, doğayla sarılmış eski taş harabeler. Hiçbir gerçek kültüre ait değil.

### 5a. Arena konsepti (yalnız referans, 3D'ye çevrilmeyecek)

```
Concept art of a circular battle arena on a floating island in the sky at dusk, seen from a high three-quarter top-down angle like a strategy game board. Smooth ancient stone floor with a faint 6 by 8 grid of tiles, a glowing golden line across the middle dividing two sides. Around the edge: overgrown ancient stone arches, glowing crystal clusters, giant mushrooms, small waterfalls falling off the island edge, floating rocks in the sky. Purple and orange sky with clouds below, stylized hand-painted game art, warm and magical atmosphere. Original fantasy design with no real-world cultural symbols, no characters, no text.
```

### 5b. Zemin dokusu (ChatGPT; Unity'de zemine döşenir)

```
Seamless tileable texture, top-down orthographic view, ancient smooth stone floor with moss in the cracks and tiny glowing specks, hand-painted stylized game texture, even lighting, no shadows, no perspective, square.
```

İkinci doku için aynı komutu "soft grass and moss ground with small pebbles" olarak bir kez daha iste; arena kenarı için gerekecek.

### 5c. Çevre nesneleri (ChatGPT çizer, Tripo 3D yapar; iskelet gerekmez)

Her birinin başına şunu ekle: `Single 3D game prop concept, stylized hand-painted, front three-quarter view, plain light grey background, no shadow, no ground, no text, no real-world cultural symbols.`

| Nesne | Komut |
|---|---|
| Taş kemer | `An overgrown ancient stone arch with vines and small flowers, weathered grey stone.` |
| Kristal kümesi | `A cluster of glowing purple and gold crystals growing from a rock.` |
| Dev mantar | `A group of three giant glowing mushrooms with spotted caps.` |
| Yüzen taş | `A small floating rock island with grass on top and roots hanging below.` |
| Mangal | `A round stone fire bowl on a short pedestal, carved with simple abstract patterns (fire will be added as an effect, draw it empty).` |
| Kaya grubu | `A cluster of mossy boulders.` |

Tripo'da bu nesneler için 3.000–8.000 üçgen yeterli.

## 6. 2D arayüz parçaları (ChatGPT; 3D gerekmez)

**Soy simgeleri** (10 adet, aynı sohbette sırayla). Her komut:

```
Game UI emblem icon, round badge with a thin gold rim, flat hand-painted style, centered symbol, transparent background, no text. Symbol: [AŞAĞIDAKİ]
```

`Gök`: cloud with a sun ray · `Yer`: mountain peak · `Od`: flame · `Su`: water drop with wave · `Ayaz`: snowflake · `Karanlık`: dark crescent moon · `Dev`: stone fist · `Avcı`: arrow hitting a target · `Bilge`: glowing crystal orb · `Çevik`: paw print with motion lines.

**Kahraman portreleri**: dükkân kartları için. Tripo modelinden Unity'de ben ekran görüntüsü alıp üretirim, ayrıca çizmene gerek yok.

**Logo**:
```
Game logo text "KUT ARENA", golden ornate letters with glowing magical runes (abstract, not real letters), a glowing sun disk behind the letters, epic fantasy mobile game logo, transparent background.
```

## 7. Bana göndereceklerin ve dosya yerleri

| Ne | Nereye |
|---|---|
| Kahraman modelleri (FBX) | `Assets/Kut/Kahramanlar/<kimlik>/<kimlik>.fbx` |
| Ortak animasyonlar (Mixamo FBX) | `Assets/Kut/Animasyon/IkiAyakli/` · `Assets/Kut/Animasyon/DortAyakli/` |
| Çevre nesneleri | `Assets/Kut/Arena/Nesneler/` |
| Zemin dokuları | `Assets/Kut/Arena/Doku/` |
| Simgeler, logo | `Assets/Kut/Arayuz/` |
| ChatGPT konsept görselleri | `Assets/Kut/_Konsept/` (yalnız referans) |

Modeller geldikçe Unity tarafında şunları ben yaparım: iskelet ayarları, animasyon kontrolcüsü, ölçek ve yön, savaş sahnesi, efektler, kamera ve arayüz.
