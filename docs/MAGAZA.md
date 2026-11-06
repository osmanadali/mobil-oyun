# Ray — Mağaza sayfası, beyanlar ve yayın listesi

Bu belge Google Play ve App Store'a gönderim için gereken her şeyi tek yerde toplar: mağaza metinleri (Türkçe ve İngilizce), görseller, veri güvenliği ve gizlilik beyanları, yaş derecelendirmesi, uygulama içi ürün ve kullanıcının yapması gereken işler.

- Metinler kopyalanıp yapıştırılmak üzere kod bloklarındadır. Karakter sayıları tablolarda, sınırla birlikte verilmiştir (Unicode karakter; Türkçe harfler tek karakter sayılır).
- Geliştirici adı: Osman Adalı. `[iletişim e-postası]` yer tutucudur; gönderimden önce gerçek adresle değiştirilmeli.
- Bütün özellikler `README.md` ve `docs/BOLUM_TASARIMI.md` ile doğrulanmıştır. Oyun değişirse (ör. çift hatlara yeni kurallar gelince) "Bilinen sınırlar" bölümündeki maddeler güncellenmeli.

## 1. Kimlik bilgileri

| Alan | Değer |
|---|---|
| Uygulama adı (cihazda) | Ray |
| Paket / Bundle ID | `com.osmanadali.ray` |
| Uygulama içi ürün | `ray_reklamsiz` (tüketilemez, iki mağazada aynı kimlik) |
| Gizlilik politikası | https://osmanadali.github.io/mobil-oyun/gizlilik.html |
| Destek URL'si (App Store) | https://osmanadali.github.io/mobil-oyun/gizlilik.html (İletişim bölümü) |
| Pazarlama URL'si (isteğe bağlı) | https://osmanadali.github.io/mobil-oyun/ (oyunun web sürümü) |
| Telif (App Store) | © 2026 Osman Adalı |
| İletişim e-postası (iki mağaza, herkese açık) | [iletişim e-postası] |
| Dil | Türkçe, İngilizce, Almanca, İspanyolca, Portekizce (Brezilya), Fransızca (oyun cihaz diline göre açılır, desteklenmeyen dilde İngilizce; Ayarlar › Dil ile değişir; mağaza metinleri §4, §5, §5b) |
| Cihaz | Android telefon, iPhone (yalnız dikey; iPad yok) |

Gizlilik ve destek adresleri GitHub Pages açılınca yayına girer. Pages kullanıcının onayıyla açılacak (bkz. §11).

## 2. Görseller

Bütün görseller `node tools/store-shots.cjs` ile gerçek oyundan üretilir. Araç oyunu yerel sunucuda Playwright ile açar, oyuncu durumunu kayıtla kurar, karolara gerçekten dokunur, sonra her ekranı başlıklı bir pazarlama çerçevesine koyar. Oyun koduna dokunmaz.

```bash
node tools/store-shots.cjs                 # hepsi (Play, iPhone 6,9", iPhone 6,5", öne çıkan görsel)
node tools/store-shots.cjs play 02 03      # yalnız Play'in 2. ve 3. sahnesi
node tools/store-shots.cjs feature         # yalnız öne çıkan görsel
node tools/store-shots.cjs en              # İngilizce: oyun en-US'de, başlıklar İngilizce → store/screens-en/, store/feature-graphic-en.png
node tools/store-shots.cjs all             # 6 dil (tr, en, de, es, pt-BR, fr) → store/screens[-<dil>]/, store/feature-graphic[-<dil>].png
```

| Dosya | Boyut | Nereye |
|---|---|---|
| `store/play-icon-512.png` | 512×512 | Play › Mağaza girişi › Uygulama simgesi |
| `store/feature-graphic.png` | 1024×500 | Play › Öne çıkan grafik |
| `store/screens/play/*.png` | 1080×1920 (9:16) | Play › Telefon ekran görüntüleri (7 adet; Play 2–8 kabul eder) |
| `store/screens/ios-69/*.png` | 1320×2868 | App Store Connect › iPhone 6,9" ekran (zorunlu boy) |
| `store/screens/ios-65/*.png` | 1284×2778 | App Store Connect › iPhone 6,5" (6,9" yüklenince gerekmez; yedek) |
| `store/screens-en/…`, `store/feature-graphic-en.png` | aynı boylar | İngilizce mağaza girişi (Play › İngilizce çeviri, App Store Connect › English (U.S.)) |
| `store/screens-{de,es,pt-BR,fr}/…`, `store/feature-graphic-{de,es,pt-BR,fr}.png` | aynı boylar | Almanca, İspanyolca, Portekizce (Brezilya), Fransızca mağaza girişleri (§5b) |
| `store/appstore-icon-1024.png` | 1024×1024 | iOS projesinin simgesi (App Store simgesi derlemeden gelir) |

Hepsi 24 bit PNG'dir, saydamlık (alfa) içermez; iki mağazanın kuralına uyar.

**Sahneler** (aynı sıra üç boyda da):

| # | Dosya | Başlık | Alt satır | Ekranda |
|---|---|---|---|---|
| 1 | `01-oyun` | Dokun, döndür, hattı yak | Bütün durakları merkeze bağla, açık uç kalmasın | Bölüm 198 (M9, iki merkez), hat yarıya kadar yanmış. Mağazada ilk bakılan görsel oynanıştır. |
| 2 | `02-ana` | Hatları bağla, şehri canlandır | Tek elle · internetsiz · her gün yeni bir Günün Hattı | Ana ekran: 12 günlük seri, Günün Hattı, M11 |
| 3 | `03-kazan` | Kusursuz bitir, bilet kazan | Süre ve hamle hedefini tuttur, üç yıldızı topla | Bölüm 45 kusursuz: 3 yıldız, bilet, 5'li seri bonusu |
| 4 | `04-harita` | 24 kural, sonu gelmeyen bölüm | Zorluk dalga dalga artar, arada mola var | Hat haritası: biten M11, süren M12 |
| 5 | `05-kural` | Hat ilerledikçe yeni kurallar | Makas, köprü, tabela, döner tabla, halka, tünel ağzı… | Tünel ağzı kural kartı (M16) |
| 6 | `06-tema` | Bilet topla, 25 renk teması aç | Kusursuz bitirdiğin her bölüm bir bilet kazandırır | Renk temaları penceresi |
| 7 | `07-sandik` | Sürpriz sandık, yeni trenler | İpucu, seri kalkanı ya da yeni bir tren kaplaması | Sandık açılışı: destansı Lavanta kaplaması |

Öne çıkan görsel: koyu lacivert zemin, uygulama ikonu (Gece Işığı: turuncu L ray, yanan kare merkez), "Ray", "Hatları bağla · Şehri canlandır" ve üç rozet (Tek elle, İnternetsiz, Metro bulmacası).

İngilizce sahne başlıkları (`en`): 1 Connect the lines, light up the city · 2 Tap, turn, light the line · 3 Finish perfect, earn tickets · 4 24 rules, endless levels · 5 New rules as the line grows · 6 Collect tickets, unlock 25 themes · 7 Surprise chest, new trains. Öne çıkan görselde "Connect the lines · Light up the city" ve One hand, Offline, Metro puzzle rozetleri.

## 3. Karakter sayıları

| Metin | Sınır | TR | EN |
|---|---|---|---|
| Play: uygulama adı | 30 | 18 | 22 |
| Play: kısa açıklama | 80 | 78 | 73 |
| Play: tam açıklama | 4000 | 2554 | 2818 |
| App Store: ad | 30 | 18 | 22 |
| App Store: alt başlık | 30 | 28 | 28 |
| App Store: tanıtım metni | 170 | 152 | 152 |
| App Store: açıklama | 4000 | 2554 | 2818 |
| App Store: anahtar kelimeler | 100 | 87 (94 bayt) | 99 |
| Ürün adı (App Store) | 30 | 15 | 15 |
| Ürün açıklaması (App Store) | 45 | 41 | 41 |
| Ürün açıklaması (Play) | 200 | 130 | 138 |
| Play sürüm notu | 500 | 103 | 109 |

Türkçe anahtar kelimeler bayt olarak da 100'ün altında kalır (bazı araçlar ğ, ı, ş gibi harfleri iki bayt sayar).

## 4. Google Play mağaza girişi

**Uygulama adı** (30)

```text
Ray: Metro Bulmaca
```
```text
Ray: Metro Line Puzzle
```

**Kısa açıklama** (80)

```text
Rayları döndür, durakları bağla. Tek elle, internetsiz, sakin metro bulmacası.
```
```text
Rotate the rails, link every station. A calm, one-handed, offline puzzle.
```

**Tam açıklama** (4000). Aynı metin App Store açıklaması olarak da kullanılır (başka platform adı geçmez).

```text
Ray, tek elle ve internetsiz oynanan sakin bir metro bulmacasıdır. Karoya dokun, ray 90° döner. Merkez istasyondan çıkan hattı bütün duraklara bağla, açıkta ray ucu kalmasın. Hat bağlandıkça şehir ışıl ışıl yanar.

NASIL OYNANIR
• Karoya dokun, ray döner.
• Bütün durakları merkeze bağla, açık uç bırakma.
• Üç yıldız: bölümü bitir, süre hedefini tuttur, hamle hedefini tuttur.
• Süreyi ve hamleyi birlikte tutturursan bölüm kusursuz olur, bilet kazanırsın.

24 HAT, SONU GELMEYEN BÖLÜMLER
Her metro hattı yeni bir kural getirir, her bölüm bir öncekinden biraz daha zordur. 24 kurallı hattan sonra oyun karma hatlarla sonsuza dek sürer. Bölümler cihazında üretilir, hepsi çözülebilir ve herkes aynı numaralı bölümde aynı bulmacayı görür.

HAT İLERLEDİKÇE YENİ KURALLAR
Eşli karo, ters karo, kayan sıra, karanlık tünel, sayaçlı karo, soğuyan karo, iki merkez, makas, mühürlü karo, döner tabla, köprü, bakım karosu, kapak, tünel ağzı, yön tabelası, halka hat, silik kol, gizli depo, sarmal tahta, nehir, kapalı durak, tarife bölgesi, son sefer ve kayan sütun: 24 kural. Her yeni kural kısa, canlandırmalı bir kartla anlatılır. Tahta hiçbir zaman kalabalıklaşmaz.

GÜNÜN HATTI
Her gün herkes aynı bulmacayı çözer. Bulmaca hafta boyunca zorlaşır, Pazar büyük bulmaca günüdür. Gün serini koru, sonucunu paylaş, arkadaşlarına meydan oku.

TAÇLAR, TEMALAR VE SÜRPRİZ SANDIK
Kusursuz bitirdiğin her bölüm bir bilet kazandırır. Biletlerle 25 renk temasının 22'sini açabilir ya da sürpriz sandığı açabilirsin: içinden ipucu, seri kalkanı ya da yeni bir tren kaplaması çıkar. Sandık yalnız oyunda kazanılan biletle açılır, olasılıklar sandık ekranında yazılıdır.

SEFER ŞERİDİ VE KUSURSUZ SERİ
Saatin altındaki küçük tren süre hedefine doğru ilerler. Süre dolsa da oyun bitmez; tren yalnız rötar yapar, peronda bekleyen yolcular da nazikçe takılır. Kusursuz bölümleri art arda bitir, seriyi büyüt, bonus bilet kazan.

GÖZ DOSTU, PİL DOSTU
Koyu, açık ve otomatik görünüm. Yumuşak renkler. Animasyonlar yalnız hareket olduğunda çalışır. Müzik, ses ve titreşim ayrı ayrı kapatılabilir. İstersen günlük hatırlatma kurabilirsin.

ÜCRETSİZ VE ADİL
Ray ücretsizdir. İpucun her gün en az 3'e tamamlanır, hat sonlarında ek ipucu kazanırsın. Reklamlar yalnız internet varken gösterilir: bölüm aralarında ara sıra bir geçiş reklamı ve yalnız sen istersen izlediğin ödüllü videolar (ek ipucu, ödülü ikiye katlama, kopan seriyi kurtarma). Günün Hattı'nda geçiş reklamı yoktur.

REKLAMSIZ PAKET
Tek seferlik satın alma. Bölüm aralarındaki reklamlar kalkar, 20 ipucu hediye edilir, 3 özel tema (Altın, Elmas, Yakut) açılır. İpucu videoları isteğe bağlı kalır.

Hesap gerekmez, kişisel bilgi istenmez. İlerlemen cihazında kalır.
```

```text
Ray is a calm metro puzzle you can play with one hand and without an internet connection. Tap a tile and the rail turns 90°. Extend the line from the central station to every stop and leave no loose rail ends. As the line connects, the city lights up.

HOW TO PLAY
• Tap a tile to rotate the rail.
• Connect every station to the hub, leave no open ends.
• Three stars: finish the level, beat the time target, beat the move target.
• Hit both targets in one go and the level is flawless: you earn a ticket.

24 LINES, ENDLESS LEVELS
Each metro line brings a new rule and every level is a little harder than the one before. After 24 rule lines the game continues forever with mixed lines. Levels are generated on your device, every one is solvable, and everyone gets the same puzzle on the same level number.

NEW RULES AS YOU TRAVEL
Paired tiles, reverse tiles, sliding rows, dark tunnels, counter tiles, cooling tiles, two hubs, switches, sealed tiles, turntables, bridges, gear tiles, covers, tunnel portals, signposts, loop lines, faint arms, hidden depots, wrap-around boards, rivers, closed stations, fare zones, timed stations and sliding columns: 24 rules. Each new rule is introduced with a short animated card, and the board never gets cluttered.

DAILY LINE
Every day everyone solves the same puzzle. It gets harder through the week, and Sunday is big puzzle day. Keep your daily streak, share your result and challenge your friends.

CROWNS, THEMES AND THE SURPRISE CHEST
Every level you finish flawlessly earns a ticket. Spend tickets on 22 of the 25 color themes or open the surprise chest for a hint, a streak shield or a new train livery. The chest only opens with tickets earned in the game, and its odds are shown on the chest screen.

TRAIN STRIP AND FLAWLESS STREAK
A little train below the clock rolls toward your time target. When time runs out the game does not end; the train is just running late, and the passengers on the platform tease you gently. Finish flawless levels in a row, grow your streak and earn bonus tickets.

EASY ON THE EYES AND THE BATTERY
Dark, light and automatic appearance. Soft colors. Animations only run while something is moving. Music, sound effects and vibration can each be turned off. Set a daily reminder if you like.

FREE AND FAIR
Ray is free to play. Your hints are topped up to at least 3 every day, and you earn extra hints at the end of each line. Ads are only shown when you are online: an occasional interstitial between levels, and rewarded videos only when you choose to watch them (extra hints, doubling a reward, saving a broken streak). The Daily Line has no interstitials.

AD-FREE PACK
A one-time purchase. Removes the ads between levels, gives you 20 hints and unlocks 3 exclusive themes (Gold, Diamond, Ruby). Hint videos stay optional.

No account needed and no personal details asked. Your progress stays on your device.

Available in English, German, Spanish, Portuguese, French and Turkish.
```

**Diğer Play alanları**

| Alan | Değer |
|---|---|
| Uygulama mı, oyun mu | Oyun |
| Kategori | Bulmaca (Puzzle) |
| Etiketler (en çok 5, önerilen) | Bulmaca, Mantık, Çevrimdışı, Tek oyunculu, Gündelik |
| Ücretli / ücretsiz | Ücretsiz (yayından sonra ücretliye çevrilemez) |
| İletişim e-postası | [iletişim e-postası] |
| Web sitesi | https://osmanadali.github.io (app-ads.txt için, bkz. §11) |
| Sürüm notu (ilk sürüm) | `İlk sürüm. Tek elle, internetsiz metro bulmacası: 24 kural, Günün Hattı, renk temaları ve sürpriz sandık.` |
| Sürüm notu (EN) | `First release. A one-handed, offline metro puzzle: 24 rules, a Daily Line, color themes and a surprise chest.` |

## 5. App Store girişi

**Fiyat:** Ücretsiz (App Store Connect › Fiyatlandırma ve Uygunluk › Fiyat **0,00 $ / Ücretsiz**). Uygulamanın kendisi ücretsiz indirilir; tek ücretli şey isteğe bağlı Reklamsız paket (§10).

**Ad** (30)

```text
Ray: Metro Bulmaca
```
```text
Ray: Metro Line Puzzle
```

**Alt başlık** (30)

```text
Tek elle, internetsiz, sakin
```
```text
Calm, one-handed and offline
```

**Tanıtım metni** (170). Sürüm göndermeden değiştirilebilir; kampanya ve yeni kural duyurusu için kullanılır.

```text
Her gün yeni bir Günün Hattı! Rayları döndür, durakları bağla, kusursuz bitir, bilet topla. 24 kural ve sonu gelmeyen bölümler seni bekliyor.
```
```text
A new Daily Line every day! Rotate the rails, connect every station, finish flawlessly and collect tickets. 24 rules and endless levels await.
```

**Açıklama** (4000): §4'teki tam açıklamanın aynısı.

**Anahtar kelimeler** (100, virgülle, boşluksuz). Ad ve alt başlıktaki sözcükler (ray, metro, bulmaca, tek elle, internetsiz, sakin) zaten aranır; burada tekrarlanmaz.

```text
boru,tren,hat,durak,istasyon,zeka,mantık,beyin,günlük,çevrimdışı,karo,net,pipes,offline
```
```text
pipes,net,subway,train,station,logic,brain,daily,relaxing,rotate,connect,tiles,rail,map,minimal,zen
```

| Alan | Değer |
|---|---|
| Birincil kategori | Oyunlar › Bulmaca (Games › Puzzle) |
| İkinci oyun alt kategorisi (isteğe bağlı) | Gündelik (Casual) |
| Destek URL'si | https://osmanadali.github.io/mobil-oyun/gizlilik.html |
| Pazarlama URL'si | https://osmanadali.github.io/mobil-oyun/ |
| Gizlilik politikası URL'si | https://osmanadali.github.io/mobil-oyun/gizlilik.html |
| Telif | © 2026 Osman Adalı |
| Şifreleme (export compliance) | Muaf olmayan şifreleme yok (`ITSAppUsesNonExemptEncryption = false`, iOS hazırlık betiği yazar) |
| Üçüncü taraf içerik | "Evet, gerekli haklara sahibim" (Outfit yazı tipi SIL OFL lisanslıdır; reklamlar AdMob'dan gelir) |

## 5b. Almanca, İspanyolca, Portekizce (Brezilya), Fransızca

Oyun bu dillerde de açılır (cihaz dili ya da Ayarlar › Dil). Play Console › Mağaza girişi › Çeviriler'e `de-DE`, `es-ES` (Latin Amerika için `es-419` aynı metinle), `pt-BR`, `fr-FR`; App Store Connect'te German, Spanish (Spain / Mexico), Portuguese (Brazil), French olarak eklenir. Terimler oyundakiyle aynıdır (docs/CEVIRI.md §3). Her dilin kendi ekran görüntüleri ve öne çıkan görseli var (`store/screens-<dil>/`, `store/feature-graphic-<dil>.png`; oyun o dilde açılır, başlıklar o dilde). Başlık metinleri `tools/store-shots.cjs` içindeki `TX` tablosundadır.

| Metin | Sınır | DE | ES | PT-BR | FR |
|---|---|---|---|---|---|
| Uygulama adı / ad | 30 | 23 | 26 | 27 | 21 |
| Play kısa açıklama | 80 | 78 | 80 | 80 | 80 |
| App Store alt başlık | 30 | 28 | 30 | 28 | 29 |
| App Store tanıtım metni | 170 | 150 | 146 | 141 | 163 |
| Anahtar kelimeler | 100 | 98 | 93 | 91 | 90 |
| Tam açıklama | 4000 | 2739 | 2689 | 2648 | 2859 |
| Sürüm notu | 500 | 119 | 127 | 127 | 138 |

### Deutsch (de-DE)

**Name**
```text
Ray: Metro-Linienrätsel
```
**Kurzbeschreibung** (Play)
```text
Dreh die Gleise, verbinde jede Station. Ruhiges Rätsel für eine Hand, offline.
```
**Untertitel** (App Store)
```text
Ruhig, einhändig und offline
```
**Werbetext** (App Store)
```text
Jeden Tag eine neue Tageslinie! Dreh die Gleise, verbinde jede Station, spiel perfekt und sammle Tickets. 24 Regeln und endlose Level warten auf dich.
```
**Schlüsselwörter** (App Store)
```text
rohre,netz,ubahn,zug,bahnhof,logik,denkspiel,täglich,entspannen,drehen,verbinden,kacheln,karte,zen
```
**Beschreibung**
```text
Ray ist ein ruhiges Metro-Rätsel, das du mit einer Hand und ohne Internet spielst. Tippe eine Kachel an und das Gleis dreht sich um 90°. Führe die Linie von der Zentrale zu jeder Station und lass keine offenen Gleisenden übrig. Mit jeder Verbindung leuchtet die Stadt auf.

SO WIRD GESPIELT
• Tippe eine Kachel an, um das Gleis zu drehen.
• Verbinde jede Station mit dem Zentrum, ohne offene Enden.
• Drei Sterne: Level schaffen, Zeitziel schaffen, Zugziel schaffen.
• Schaffst du beide Ziele auf einmal, ist das Level perfekt: Du bekommst ein Ticket.

24 LINIEN, ENDLOSE LEVEL
Jede Metrolinie bringt eine neue Regel, jedes Level ist etwas schwerer als das vorige. Nach 24 Regellinien geht es mit gemischten Linien endlos weiter. Die Level entstehen auf deinem Gerät, jedes ist lösbar, und alle bekommen bei derselben Levelnummer dasselbe Rätsel.

NEUE REGELN UNTERWEGS
Paarkacheln, Umkehrkacheln, Schiebereihen, dunkle Tunnel, Zählkacheln, Frostkacheln, zwei Zentren, Weichen, Siegelkacheln, Drehscheiben, Brücken, Zahnradkacheln, Abdeckungen, Tunnelportale, Wegweiser, Ringlinien, blasse Arme, versteckte Depots, Endlosbretter, Flüsse, geschlossene Stationen, Tarifzonen, Zeitstationen und Schiebespalten: 24 Regeln. Jede neue Regel stellt eine kurze animierte Karte vor, und das Brett wird nie unübersichtlich.

TAGESLINIE
Jeden Tag lösen alle dasselbe Rätsel. Es wird im Lauf der Woche schwerer, sonntags gibt es das große Rätsel. Halte deine Serie, teile dein Ergebnis und fordere Freunde heraus.

TICKETS, THEMEN UND ÜBERRASCHUNGSKISTE
Jedes perfekte Level bringt ein Ticket. Gib Tickets für 22 der 25 Farbthemen aus oder öffne die Überraschungskiste: Tipps, ein Serienschild oder ein neuer Zuglack. Die Kiste öffnet sich nur mit im Spiel verdienten Tickets, die Chancen stehen im Kistenbildschirm.

ANGENEHM FÜR AUGEN UND AKKU
Dunkles, helles und automatisches Design. Sanfte Farben. Animationen laufen nur, wenn sich etwas bewegt. Musik, Soundeffekte und Vibration lassen sich einzeln abschalten. Auf Wunsch gibt es eine tägliche Erinnerung.

KOSTENLOS UND FAIR
Ray ist kostenlos. Deine Tipps werden jeden Tag auf mindestens 3 aufgefüllt, am Ende jeder Linie gibt es Extratipps. Werbung erscheint nur online: ab und zu zwischen Leveln und als Belohnungsvideo nur, wenn du es willst (Extratipps, Belohnung verdoppeln, gerissene Serie retten). Die Tageslinie hat keine Zwischenwerbung.

WERBEFREI-PAKET
Einmaliger Kauf. Entfernt die Werbung zwischen Leveln, schenkt dir 20 Tipps und schaltet 3 exklusive Themen frei (Gold, Diamant, Rubin). Tipp-Videos bleiben freiwillig.

Kein Konto nötig, keine persönlichen Daten. Dein Fortschritt bleibt auf deinem Gerät.

Auf Deutsch, Englisch, Spanisch, Portugiesisch, Französisch und Türkisch.
```
**Versionshinweis**
```text
Erste Version. Ein einhändiges Offline-Metrorätsel: 24 Regeln, eine Tageslinie, Farbthemen und eine Überraschungskiste.
```

### Español (es-ES · es-419)

**Nombre**
```text
Ray: Puzle de Líneas Metro
```
**Descripción breve** (Play)
```text
Gira las vías y conecta cada estación. Un puzle tranquilo, a una mano y sin red.
```
**Subtítulo** (App Store)
```text
Tranquilo, a una mano, sin red
```
**Texto promocional** (App Store)
```text
¡Una nueva Línea del día cada día! Gira las vías, conecta cada estación, termina perfecto y gana billetes. Te esperan 24 reglas y niveles sin fin.
```
**Palabras clave** (App Store)
```text
tuberías,red,subte,tren,estación,lógica,mente,diario,relajante,girar,conectar,piezas,mapa,zen
```
**Descripción**
```text
Ray es un puzle de metro tranquilo que se juega con una mano y sin conexión. Toca una pieza y la vía gira 90°. Lleva la línea desde la estación central hasta cada parada sin dejar extremos sueltos. Con cada conexión, la ciudad se ilumina.

CÓMO SE JUEGA
• Toca una pieza para girar la vía.
• Conecta cada estación con el centro, sin extremos abiertos.
• Tres estrellas: termina el nivel, cumple el objetivo de tiempo y el de jugadas.
• Cumple los dos a la vez y el nivel es perfecto: ganas un billete.

24 LÍNEAS, NIVELES SIN FIN
Cada línea de metro trae una regla nueva y cada nivel es un poco más difícil que el anterior. Tras 24 líneas con reglas, el juego sigue para siempre con líneas mixtas. Los niveles se crean en tu dispositivo, todos tienen solución y todo el mundo juega el mismo puzle en el mismo número de nivel.

REGLAS NUEVAS POR EL CAMINO
Piezas gemelas, piezas inversas, filas deslizantes, túneles oscuros, piezas contador, piezas heladas, dos centros, desvíos, piezas selladas, plataformas giratorias, puentes, piezas engranaje, tapas, bocas de túnel, señales, líneas circulares, brazos tenues, depósitos ocultos, tableros sin bordes, ríos, estaciones cerradas, zonas tarifarias, estaciones con reloj y columnas deslizantes: 24 reglas. Cada regla nueva se presenta con una tarjeta animada corta y el tablero nunca se satura.

LÍNEA DEL DÍA
Cada día todos resuelven el mismo puzle. Se complica a lo largo de la semana y el domingo toca el gran puzle. Mantén tu racha, comparte tu resultado y reta a tus amigos.

BILLETES, TEMAS Y COFRE SORPRESA
Cada nivel perfecto te da un billete. Gástalos en 22 de los 25 temas de color o abre el cofre sorpresa: pistas, un escudo de racha o un nuevo diseño de tren. El cofre solo se abre con billetes ganados jugando y las probabilidades se ven en su pantalla.

CUIDA TUS OJOS Y TU BATERÍA
Tema oscuro, claro y automático. Colores suaves. Las animaciones solo funcionan cuando algo se mueve. Música, efectos y vibración se apagan por separado. Si quieres, activa un aviso diario.

GRATIS Y JUSTO
Ray es gratis. Tus pistas se recargan cada día hasta al menos 3 y ganas pistas extra al final de cada línea. Los anuncios solo salen con conexión: alguno entre niveles y vídeos con premio solo si tú quieres (pistas extra, doblar un premio, salvar una racha rota). La Línea del día no tiene anuncios intersticiales.

PAQUETE SIN ANUNCIOS
Compra única. Quita los anuncios entre niveles, te regala 20 pistas y desbloquea 3 temas exclusivos (Oro, Diamante, Rubí). Los vídeos de pistas siguen siendo opcionales.

Sin cuenta y sin datos personales. Tu progreso se queda en tu dispositivo.

En español, inglés, alemán, portugués, francés y turco.
```
**Notas de la versión**
```text
Primera versión. Un puzle de metro a una mano y sin conexión: 24 reglas, una Línea del día, temas de color y un cofre sorpresa.
```

### Português (pt-BR)

**Nome**
```text
Ray: Quebra-Cabeça do Metrô
```
**Descrição curta** (Play)
```text
Gire os trilhos, ligue as estações. Quebra-cabeça calmo, para uma mão e offline.
```
**Subtítulo** (App Store)
```text
Calmo, com uma mão e offline
```
**Texto promocional** (App Store)
```text
Uma nova Linha do Dia todo dia! Gire os trilhos, ligue cada estação, termine perfeito e ganhe bilhetes. 24 regras e fases sem fim te esperam.
```
**Palavras-chave** (App Store)
```text
canos,rede,trem,estação,lógica,cérebro,diário,relaxar,girar,conectar,peças,mapa,offline,zen
```
**Descrição**
```text
Ray é um quebra-cabeça de metrô calmo, para jogar com uma mão e sem internet. Toque numa peça e o trilho gira 90°. Leve a linha da estação central até cada parada sem deixar pontas soltas. A cada ligação, a cidade se acende.

COMO JOGAR
• Toque numa peça para girar o trilho.
• Ligue cada estação ao centro, sem pontas abertas.
• Três estrelas: termine a fase, bata a meta de tempo e a meta de jogadas.
• Bata as duas de uma vez e a fase fica perfeita: você ganha um bilhete.

24 LINHAS, FASES SEM FIM
Cada linha de metrô traz uma regra nova e cada fase é um pouco mais difícil que a anterior. Depois de 24 linhas com regras, o jogo continua para sempre com linhas mistas. As fases são criadas no seu aparelho, todas têm solução e todo mundo recebe o mesmo quebra-cabeça no mesmo número de fase.

REGRAS NOVAS PELO CAMINHO
Peças gêmeas, peças inversas, fileiras deslizantes, túneis escuros, peças contador, peças geladas, dois centros, desvios, peças lacradas, plataformas giratórias, pontes, peças engrenagem, tampas, bocas de túnel, placas, linhas circulares, braços apagados, depósitos ocultos, tabuleiros sem bordas, rios, estações fechadas, zonas tarifárias, estações com relógio e colunas deslizantes: 24 regras. Cada regra nova chega com um cartão animado curto, e o tabuleiro nunca fica poluído.

LINHA DO DIA
Todo dia todo mundo resolve o mesmo quebra-cabeça. Ele fica mais difícil ao longo da semana, e domingo é dia do desafio grande. Mantenha sua sequência, compartilhe o resultado e desafie os amigos.

BILHETES, TEMAS E BAÚ SURPRESA
Cada fase perfeita rende um bilhete. Use bilhetes em 22 dos 25 temas de cores ou abra o baú surpresa: dicas, um escudo de sequência ou uma nova pintura de trem. O baú só abre com bilhetes ganhos no jogo, e as chances aparecem na tela do baú.

BOM PARA OS OLHOS E PARA A BATERIA
Tema escuro, claro e automático. Cores suaves. As animações só rodam quando algo se mexe. Música, efeitos e vibração desligam separadamente. Se quiser, ative um lembrete diário.

GRÁTIS E JUSTO
Ray é grátis. Suas dicas voltam a pelo menos 3 todo dia, e você ganha dicas extras no fim de cada linha. Anúncios só aparecem com internet: um de vez em quando entre fases e vídeos premiados só se você quiser (dicas extras, dobrar o prêmio, salvar uma sequência perdida). A Linha do Dia não tem anúncios intersticiais.

PACOTE SEM ANÚNCIOS
Compra única. Tira os anúncios entre as fases, dá 20 dicas de presente e libera 3 temas exclusivos (Ouro, Diamante, Rubi). Os vídeos de dicas continuam opcionais.

Sem conta e sem dados pessoais. Seu progresso fica no seu aparelho.

Em português, inglês, espanhol, alemão, francês e turco.
```
**Notas da versão**
```text
Primeira versão. Um quebra-cabeça de metrô para uma mão e offline: 24 regras, a Linha do Dia, temas de cores e um baú surpresa.
```

### Français (fr-FR)

**Nom**
```text
Ray : Puzzle de Métro
```
**Description courte** (Play)
```text
Tourne les rails, relie chaque station. Un puzzle calme, à une main, hors ligne.
```
**Sous-titre** (App Store)
```text
Calme, à une main, hors ligne
```
**Texte promotionnel** (App Store)
```text
Une nouvelle Ligne du jour chaque jour ! Tourne les rails, relie chaque station, finis parfait et gagne des tickets. 24 règles et des niveaux sans fin t’attendent.
```
**Mots-clés** (App Store)
```text
tuyaux,réseau,train,gare,logique,cerveau,quotidien,détente,tourner,relier,tuiles,carte,zen
```
**Description**
```text
Ray est un puzzle de métro calme, à jouer d’une main et sans connexion. Touche une tuile et le rail tourne de 90°. Prolonge la ligne depuis la station centrale jusqu’à chaque arrêt, sans laisser de bout de rail libre. À chaque connexion, la ville s’illumine.

COMMENT JOUER
• Touche une tuile pour tourner le rail.
• Relie chaque station au centre, sans bout ouvert.
• Trois étoiles : finis le niveau, tiens l’objectif de temps et l’objectif de coups.
• Tiens les deux à la fois et le niveau est parfait : tu gagnes un ticket.

24 LIGNES, DES NIVEAUX SANS FIN
Chaque ligne de métro apporte une nouvelle règle et chaque niveau est un peu plus dur que le précédent. Après 24 lignes à règles, le jeu continue à l’infini avec des lignes mixtes. Les niveaux sont créés sur ton appareil, tous ont une solution et tout le monde a le même puzzle au même numéro de niveau.

DE NOUVELLES RÈGLES EN ROUTE
Tuiles jumelles, tuiles inverses, rangées glissantes, tunnels sombres, tuiles compteur, tuiles givrées, deux centres, aiguillages, tuiles scellées, plaques tournantes, ponts, tuiles engrenage, caches, portails de tunnel, panneaux, lignes circulaires, bras pâles, dépôts cachés, plateaux sans bords, rivières, stations fermées, zones tarifaires, stations minutées et colonnes glissantes : 24 règles. Chaque nouvelle règle est présentée par une courte carte animée, et le plateau ne devient jamais surchargé.

LIGNE DU JOUR
Chaque jour, tout le monde résout le même puzzle. Il se corse au fil de la semaine, et le dimanche c’est le grand puzzle. Garde ta série, partage ton résultat et défie tes amis.

TICKETS, THÈMES ET COFFRE SURPRISE
Chaque niveau parfait rapporte un ticket. Dépense-les pour 22 des 25 thèmes de couleur ou ouvre le coffre surprise : des indices, un bouclier de série ou une nouvelle livrée de train. Le coffre ne s’ouvre qu’avec des tickets gagnés en jeu, et ses chances sont affichées sur son écran.

DOUX POUR LES YEUX ET LA BATTERIE
Thème sombre, clair et automatique. Couleurs douces. Les animations ne tournent que quand quelque chose bouge. Musique, effets sonores et vibration se coupent séparément. Un rappel quotidien si tu veux.

GRATUIT ET ÉQUITABLE
Ray est gratuit. Tes indices remontent à au moins 3 chaque jour, et tu gagnes des indices en plus à la fin de chaque ligne. Les pubs n’apparaissent qu’en ligne : de temps en temps entre deux niveaux, et des vidéos récompensées seulement si tu le choisis (indices en plus, récompense doublée, série brisée sauvée). La Ligne du jour n’a pas de pub interstitielle.

PACK SANS PUB
Achat unique. Supprime les pubs entre les niveaux, offre 20 indices et débloque 3 thèmes exclusifs (Or, Diamant, Rubis). Les vidéos d’indices restent facultatives.

Pas de compte, aucune donnée personnelle. Ta progression reste sur ton appareil.

En français, anglais, allemand, espagnol, portugais et turc.
```
**Notes de version**
```text
Première version. Un puzzle de métro à une main et hors ligne : 24 règles, une Ligne du jour, des thèmes de couleur et un coffre surprise.
```

## 6. Google Play "Veri güvenliği" formu

Hesap yok, ayrı çökme raporu aracı yok (hata ve akıcılık bilgisi Firebase olayı olarak gider, aşağıda), ilerleme yalnız cihazda (tarayıcı deposu + kalıcı yedek, Capacitor Preferences). Formda beyan edilecek veriyi iki SDK toplar: **Google Mobile Ads SDK (AdMob)** ve **Google Analytics for Firebase** (oyun olayları, reklam kimliği olmadan, rıza gereken bölgelerde kapalı; ayrıntı `docs/YAYIN.md` §5). Satın almayı Google Play yürütür; uygulama ödeme bilgisi görmez.

Firebase, geliştirici adına çalışan bir hizmet sağlayıcıdır; Play tanımına göre bu "paylaşma" sayılmaz, "toplama" sayılır. Ölçüm derlemeye yalnız `FIREBASE_ANDROID_JSON` gizli değeri verilince girer; vermeden yayımlarsan Firebase satırlarını forma ekleme.

| Soru | Yanıt |
|---|---|
| Uygulama gerekli kullanıcı verisi türlerinden birini topluyor ya da paylaşıyor mu? | Evet |
| Toplanan bütün veriler aktarım sırasında şifreleniyor mu? | Evet (SDK HTTPS kullanır) |
| Hesap oluşturma | Uygulamada hesap oluşturma yok |
| Kullanıcı verilerinin silinmesini isteyebilir mi? | Hayır. Geliştirici kullanıcı adına veri tutmaz; reklam verisini Google işler. Cihazdaki oyun verisi uygulamadan silinebilir (aşağıda). |

Beyan edilecek veri türleri (Google'ın AdMob için yayımladığı eşleşmeye göre):

| Play veri türü | AdMob'daki karşılığı | Toplanıyor | Paylaşılıyor | Geçici mi | Zorunlu mu | Amaç |
|---|---|---|---|---|---|---|
| Konum › Yaklaşık konum | IP adresi (genel konum tahmini) | Evet | Evet | Hayır | Zorunlu | Reklam veya pazarlama · Analiz · Dolandırıcılığı önleme, güvenlik ve uyumluluk |
| Uygulama etkinliği › Uygulama etkileşimleri | Reklam gösterimi, dokunma, video izleme | Evet | Evet | Hayır | Zorunlu | aynı |
| Uygulama bilgileri ve performans › Kilitlenme günlükleri, Teşhis | SDK'nın teşhis bilgisi | Evet | Evet | Hayır | Zorunlu | aynı |
| Cihaz veya diğer kimlikler | Android reklam kimliği, uygulama grubu kimliği | Evet | Evet | Hayır | Zorunlu | aynı |
| Uygulama etkinliği › Uygulama etkileşimleri | **Firebase:** bölüm başlama/bitiş/bırakma, Günün Hattı, anlatım, reklam gösterimi, güçlendirici, özel teklif gösterimi/satın alımı, can olayları | Evet | Hayır | Hayır | Zorunlu | Analiz |
| Cihaz veya diğer kimlikler | **Firebase:** uygulama örneği kimliği (reklam kimliği toplanmaz) | Evet | Hayır | Hayır | Zorunlu | Analiz |
| Uygulama bilgileri ve performans › Teşhis | **Firebase:** JavaScript hata iletisi ve yeri (`js_error`, oturumda en çok 5), takılan kare sayısı/süresi (`level_end` `jank`, `perf_session`: çekirdek sayısı, bellek, ekran ölçeği). Kişisel veri, metin girişi yok | Evet | Hayır | Hayır | Zorunlu | Analiz |
| Finansal bilgiler › Satın alma geçmişi | **Firebase:** satın alınan ürünün kimliği (`purchase`, `offer_buy` olayları; tutar yok, Firebase'in kendi `in_app_purchase` olayı tutarı içerir) | Evet | Hayır | Hayır | Zorunlu | Analiz |
| Konum › Yaklaşık konum | **Firebase:** IP'den ülke/şehir tahmini | Evet | Hayır | Hayır | Zorunlu | Analiz |

Aynı veri türü iki satırda geçiyorsa formda tek kez işaretlenir; amaçlar ve "paylaşılıyor" yanıtı birleştirilir (AdMob paylaşır → Evet). "Zorunlu": oyuncu ölçümü uygulama içinden ayrıca kapatamaz (rıza bölgelerinde zaten kapalı; Verilerimi sil kapatır).

Toplanmayanlar: kişisel bilgiler (ad, e-posta, adres, telefon), ödeme bilgileri (Google Play yürütür), sağlık, mesajlar, fotoğraf ve video, ses, dosyalar, takvim, kişiler, web tarama, kesin konum.

Gönderimden önce Google'ın güncel tablolarıyla son kez karşılaştır: https://developers.google.com/admob/android/privacy/play-data-disclosure · https://firebase.google.com/docs/android/play-data-disclosure

**Silme yolu** (gizlilik politikasıyla aynı):

- Oyun verisi: Ayarlar › Gizlilik › Verilerimi sil (bu düğme `magaza-reklam` dalıyla gelir) ya da uygulamayı kaldırmak. Aynı düğme ölçümü kapatır ve Firebase'in cihazdaki kimliğini sıfırlar (`resetAnalyticsData`).
- Reklam verisi: Android ayarlarından reklam kimliğini sıfırlamak ya da silmek; AB/BK/İsviçre ve ilgili ABD eyaletlerinde rıza seçimini Ayarlar › Gizlilik › Reklam gizlilik seçenekleri ile değiştirmek.

**Reklam kimliği beyanı** (Uygulama içeriği › Reklam kimliği): Evet, kullanıyor. Amaç: Reklam veya pazarlama, Analiz, Dolandırıcılığı önleme. `AD_ID` izni AdMob kitaplığıyla bildirime kendiliğinden eklenir; yayın derlemesinde birleşik bildirimde göründüğünü doğrula.

## 7. Apple "App Privacy" etiketleri

Etiketler AdMob SDK ve Firebase Analytics içindir (Firebase yalnız `FIREBASE_IOS_PLIST` verilen derlemede; IDFA'sız `AnalyticsWithoutAdIdSupport` sürümü, IDFV de kapalı). iOS'ta izleme (IDFA) yalnız kullanıcı ATT penceresinde izin verirse olur, bu yüzden izleme beyan edilir ve ATT penceresi gösterilir (`magaza-reklam` dalı).

| Apple veri türü | Amaç | Kimliğe bağlı mı | İzleme için mi |
|---|---|---|---|
| Tanımlayıcılar › Aygıt kimliği (IDFA, IDFV) | Üçüncü taraf reklam · Analiz | Hayır | Evet (IDFA, yalnız ATT izniyle) |
| Kullanım verileri › Reklam verileri | Üçüncü taraf reklam · Analiz | Hayır | Evet |
| Kullanım verileri › Ürün etkileşimi | Üçüncü taraf reklam · Analiz | Hayır | Evet |
| Konum › Yaklaşık konum (IP'den) | Üçüncü taraf reklam · Analiz | Hayır | Hayır |
| Tanılama › Çökme verileri, Performans verileri, Diğer tanılama verileri | Üçüncü taraf reklam · Analiz | Hayır | Hayır |
| Tanımlayıcılar › Aygıt kimliği (Firebase uygulama örneği kimliği) | Analiz | Hayır | Hayır |
| Kullanım verileri › Ürün etkileşimi (Firebase oyun olayları) | Analiz | Hayır | Hayır |
| Satın alımlar › Satın alma geçmişi (Firebase `purchase`/`offer_buy`: ürün kimliği) | Analiz | Hayır | Hayır |
| Konum › Yaklaşık konum (Firebase, IP'den) | Analiz | Hayır | Hayır |

Aynı tür iki satırda geçerse App Store Connect'te bir kez seçilir, amaçlar birleştirilir. Firebase verisi izleme için kullanılmaz (reklam kimliği yok, başka şirketlerin verisiyle birleştirilmez); "izleme" yanıtı yalnız AdMob satırlarından gelir. Bu yüzden ATT reddi ölçümü değiştirmez.

Ürün sayfasında beklenen görünüm: "Sizi izlemek için kullanılan veriler: Tanımlayıcılar, Kullanım verileri" ve "Sizinle ilişkilendirilmeyen veriler: Konum, Tanılama, Kullanım verileri, Tanımlayıcılar, Satın Alımlar". "Sizinle ilişkilendirilen veri" bölümü çıkmaz.

Google'ın iOS tabloları: https://developers.google.com/admob/ios/privacy/data-disclosure · https://firebase.google.com/docs/ios/app-store-data-collection. Google Mobile Ads SDK kendi gizlilik bildirimini (`PrivacyInfo.xcprivacy`) taşır; Capacitor da öyle.

## 8. Yaş derecelendirmesi

### Google Play (IARC anketi)

| Soru | Yanıt |
|---|---|
| E-posta | [iletişim e-postası] |
| Kategori | Oyun (Game) |
| Şiddet, kan, korku | Hayır |
| Cinsellik, çıplaklık | Hayır |
| Küfür, kaba dil, kaba mizah | Hayır (yolcu sözleri nazik espridir) |
| Uyuşturucu, alkol, tütün | Hayır |
| Kumar: gerçek para ya da kumar benzetimi (kumarhane oyunu) | Hayır |
| Ayrımcılık, nefret | Hayır |
| Kullanıcılar birbiriyle iletişim kuruyor mu (sohbet, içerik paylaşma) | Hayır. "Paylaş" yalnız sonuç metnini sistemin paylaşma penceresine verir. |
| Kullanıcının konumu paylaşılıyor mu | Hayır |
| Dijital ürün satın alma | Evet (Mağaza: 2 tüketilemez, 5 tüketilebilir ürün; §10) |
| Parayla satın alınan rastgele ödül (ganimet kutusu) | Hayır. Sürpriz sandık yalnız oyunda **kazanılan** biletle açılır. Mağazadaki bilet paketi (`ray_bilet_50`, 🎫; taç para birimi bilet olarak yeniden adlandırıldı) ayrı sayılır ve yalnız renk temasına harcanır, sandıkta kullanılamaz (`chestBal`, robot: `gelir.tac`); sandıktan taç çıkmaz. Bütün paketlerin içeriği sabittir. |
| Sınırsız internet erişimi (uygulama içi tarayıcı) | Hayır |

Beklenen sonuç: PEGI 3, ESRB Everyone, USK 0, IARC 3+ (satın alma nedeniyle "Oyun içi satın alma" notu eklenir).

### App Store (yaş derecelendirmesi formu)

- Bütün içerik soruları (şiddet, korku, cinsellik, küfür, uyuşturucu, kumar, yarışma, tıbbi konular): **Yok**.
- Sınırsız web erişimi: Hayır. Kullanıcı içeriği: Hayır. Mesajlaşma: Hayır. Ebeveyn denetimi, yaş doğrulama: Hayır.
- Formda reklam sorusu varsa: **Evet**.
- Hesaplanan derece büyük olasılıkla 4+ çıkar. Reklam içeriği AdMob'da en çok PG'ye ayarlı (`magaza-reklam` dalı, `maxAdContentRating: 'ParentalGuidance'`). Apple reklamların derecelendirmeye uygun olmasını ister. Form izin veriyorsa dereceyi 9+ seç; vermiyorsa AdMob'da iOS uygulaması için en yüksek reklam içeriği derecesini G yap.
- Çocuk kategorisi (Kids): Hayır.

## 9. Hedef kitle, reklam ve diğer Play beyanları

| Play › Uygulama içeriği | Yanıt |
|---|---|
| Gizlilik politikası | https://osmanadali.github.io/mobil-oyun/gizlilik.html |
| Reklamlar | Evet, uygulamada reklam var (AdMob: geçiş ve ödüllü video) |
| Uygulama erişimi | Tüm işlevler özel erişim gerekmeden kullanılabilir (giriş yok) |
| Hedef kitle | 13–15, 16–17, 18 ve üzeri. 13 yaş altı seçilmez; uygulama Aileler programına katılmaz. |
| Çocukların ilgisini çekebilir mi | Hayır. Mağaza görsellerinde çocuklara yönelik karakter ya da dil yok. (Google aksi karar verirse Aileler politikası ve AdMob çocuk ayarları gerekir.) |
| Haber uygulaması | Hayır |
| Devlet uygulaması | Hayır |
| Finansal özellikler | Yok |
| Sağlık | Yok |
| Veri güvenliği | §6 |
| İçerik derecelendirmesi | §8 |
| Reklam kimliği | §6 sonu |

Gizlilik politikası da "13 yaş ve üzeri" der; hedef kitle ve politika uyumludur.

## 10. Uygulama içi ürünler

Oyun iki mağazada da **ücretsiz indirilir**. Aşağıdaki fiyatlar yalnız oyunun içinden isteğe bağlı alınan paketlerin fiyatıdır; uygulamanın kendisine fiyat girilmez. Bütün ürünler tek **Mağaza** penceresindedir (Ayarlar › Mağaza; ipucu bitince açılan pencerede "💡 İpucu paketleri" bağlantısı). Satış sade: rozet ve geri sayım yok; kendiliğinden açılan tek pencere seyrek **özel teklif**tir (§10.3).

### 10.1 Reklamsız paket

| Alan | Google Play | App Store Connect |
|---|---|---|
| Kimlik | `ray_reklamsiz` | `ray_reklamsiz` |
| Tür | Tek seferlik ürün (uygulama içi ürün, tüketilemez) | Non-Consumable (tüketilemez) |
| Ad (TR / EN) | Reklamsız paket / Ad-free Pack | Reklamsız paket / Ad-free Pack (12) |
| Açıklama TR | `Bölüm aralarındaki reklamları kaldırır, 20 ipucu hediye eder ve 3 özel temayı (Altın, Elmas, Yakut) açar. Tek seferlik, ömür boyu.` | `Reklamlar kalkar, 20 ipucu ve 3 özel tema` (45) |
| Açıklama EN | `Removes the ads between levels, gives you 20 hints and unlocks 3 exclusive themes (Gold, Diamond, Ruby). One-time purchase, yours forever.` | `No ads between levels, 20 hints, 3 themes` (45) |
| Fiyat önerisi | Varsayılan ₺59,99; ABD 2,99 $ · AB 2,99 € · BK 2,49 £ elle (ya da USD tabanlı şablon) | Taban ülke **ABD, 2,99 $**; Türkiye elle **₺59,99**; öteki ülkeler ABD'den otomatik |
| İnceleme için | Lisans test hesabıyla dene | İnceleme ekran görüntüsü: Ayarlar › Reklamsız paket penceresi (cihazdan alınır) |

Fiyat gerekçesi: benzer bulmaca oyunlarında reklam kaldırma 2–5 $ arasıdır. Paket yalnız geçiş reklamlarını kaldırır (ödüllü videolar isteğe bağlı kalır), üstüne 20 ipucu ve 3 tema verir; alt uçta bir fiyat ilk satın almayı kolaylaştırır.

Neden taban Türkiye değil: ₺59,99'dan KDV düşülünce kalan yaklaşık 1 $ eder. Taban Türkiye olursa mağazalar öteki ülkeleri bu tutardan çevirir; İngilizce konuşulan ana pazarlarda (ABD, BK, AB) fiyat 2–5 $ bandının altına düşer ve gelir 2–2,5 kat az kalır. Bu yüzden fiyat ABD'ye göre kurulur, Türkiye ayrıca elle girilir.

Fiyat planı:

- **App Store Connect:** Uygulama içi satın alma › `ray_reklamsiz` › Fiyatlandırma › taban ülke **Amerika Birleşik Devletleri**, fiyat **2,99 $**. Öteki ülkeler otomatik gelir. Sonra Türkiye satırını elle **₺59,99** yap.
- **Google Play:** Ürünün varsayılan fiyatı ₺59,99 kalabilir. Ama Play öteki ülkeleri bu tutardan çevirdiği için ABD **2,99 $**, Euro bölgesi **2,99 €** ve Birleşik Krallık **2,49 £** elle girilir. İstersen 2,99 $ tabanlı bir fiyatlandırma şablonu (Ayarlar › Fiyatlandırma şablonları) kurup ürüne bağla, Türkiye'yi orada ₺59,99'a çek.
- Kayıttan sonra iki mağazada ülke listesini gözden geçir: ABD 2,99 $, Türkiye ₺59,99, Almanya 2,99 €, BK 2,49 £ görünmeli.

Geri yükleme: pencerede "Satın alımı geri yükle" düğmesi var (Apple bunu ister).

### 10.2 Öteki ürünler (31 Ekim)

Kimlikler iki mağazada aynıdır (`www/shop.js` › `ITEMS`). Tüketilebilir ürünler Play'de "tüketilebilir uygulama içi ürün" olarak kalır (uygulama her alışta işlemi `finish` ile tüketir), App Store Connect'te **Consumable** seçilir. Tüketilemezler Play'de tek seferlik ürün, App Store'da **Non-Consumable**.

| Kimlik | Tür | Ad TR / EN | İçerik | ABD (taban) | Türkiye (elle) |
|---|---|---|---|---|---|
| `ray_temalar` | Tüketilemez | Tema paketi / Theme Pack | Taçla açılan 22 renk temasının hepsi (Altın, Elmas, Yakut hariç; onlar Reklamsız pakette) | 3,99 $ | ₺79,99 |
| `ray_ipucu_10` | Tüketilebilir | 10 ipucu / 10 Hints | 10 💡 | 0,99 $ | ₺19,99 |
| `ray_ipucu_30` | Tüketilebilir | 30 ipucu / 30 Hints | 30 💡 | 1,99 $ | ₺39,99 |
| `ray_ipucu_80` | Tüketilebilir | 80 ipucu / 80 Hints | 80 💡 | 3,99 $ | ₺79,99 |
| `ray_guclendirici` | Tüketilebilir | Güçlendirici paketi / Booster Pack | 🔄 ek tur ×3, 🔦 fener ×3, ⏱ +15 sn ×3, ↶ geri al ×3 | 1,99 $ | ₺39,99 |
| `ray_bilet_50` | Tüketilebilir | Bilet paketi / Ticket Pack | 50 🎫 bilet, yalnız renk temasında harcanır (sandıkta kullanılamaz) | 1,99 $ | ₺39,99 |
| `ray_baslangic` | Tüketilebilir | Başlangıç paketi / Starter Pack | 10 💡, her güçlendiriciden 2 (🔄 🔦 ⏱ ↶), ❤️∞ 1 saat sınırsız can, 20 🎫 bilet (yalnız temada) | 2,99 $ | ₺59,99 |

Mağaza açıklamaları (App Store görünen ad ≤ 30, açıklama ≤ 45 karakter):

| Kimlik | Açıklama TR | Açıklama EN |
|---|---|---|
| `ray_temalar` | `Taçla açılan 22 renk temasının hepsi` | `All 22 crown color themes, one-time` |
| `ray_ipucu_10` / `_30` / `_80` | `10 (30, 80) ipucu: takıldığın karo yerine oturur` (Play) · `10 ipucu` (App Store) | `10 (30, 80) hints: puts a tricky tile in place` (Play) · `10 hints` (App Store) |
| `ray_guclendirici` | `Her güçlendiriciden 3: ek tur, fener, +15 sn, geri al` | `3 of each booster: turn, lantern, +15 s, undo` |
| `ray_bilet_50` | `50 bilet, renk temaları için` | `50 tickets to spend on color themes` |
| `ray_baslangic` | `10 ipucu, 8 güçlendirici, 1 saat can, 20 bilet` | `10 hints, 8 boosters, 1 h lives, 20 tickets` |

Fiyat gerekçesi (§10.1 ile aynı mantık): fiyatlar ABD'ye göre kurulur, öteki ülkeler mağazanın ABD'den çevirisiyle gelir, Türkiye elle girilir. Türkiye oranı Reklamsız paketteki gibidir (2,99 $ ↔ ₺59,99, yani 1 $ ≈ ₺20): ₺19,99 / 39,99 / 79,99.

- İpucu üç boyda, büyük paket adet başına ucuzlar (0,099 → 0,066 → 0,050 $). Oyun cömert kalır: her gün 3 ipucu, seri, hat sonu ve sandık ipucu verir, ödüllü video +2; paketler acele edenler için.
- Güçlendirici paketi 12 güçlendirici verir; sandığın sıradan ödülü 1 güçlendirici olduğundan 1,99 $ yaklaşık 10 sandıklık güçlendiriciye denk gelir ama sandığın asıl ödülü (tren kaplaması, kalkan) parayla satılmaz.
- Bilet paketi 50 🎫 ≈ 50 kusursuz bölüm. Temalar 5–560 bilet arasında olduğundan bir paket bir-iki orta tema eder; bütün temaları isteyen için Tema paketi (3,99 $) daha uygundur. Satın alınan bilet ayrı sayılır, sandık açmaz (BOLUM_TASARIMI › Taç ekonomisi).
- Tema paketi (3,99 $) Reklamsız paketten (2,99 $) pahalıdır: 22 temayı biletle toplamak yüzlerce kusursuz bölüm ister.
- Başlangıç paketi (2,99 $) karışık bir paket: ayrı ayrı alınsa 10 ipucu (0,99 $) + 8 güçlendirici (~1,33 $) + 20 bilet (~0,80 $) + 1 saat can eder; bu fark gerçektir ama pencerede "indirim" ya da eski fiyat olarak gösterilmez. Sınırsız can süresi var olan süreye eklenir (`save.infUntil = max(infUntil, şimdi) + 60 dk`). Mağazada her zaman satılır.

Uygulamanın davranışı (robot: `tools/hakem/gelir-olcum.cjs`, özel teklif ve ölçüm `tools/hakem/gelir-2.cjs`):

- Tüketilebilir: mağaza işlemi onaylayınca ödül kayda yazılır, kaydın yazıldığı doğrulanır, **sonra** işlem bitirilir (Play'de consume, iOS'ta finish). Aynı işlem yeniden gelirse (uygulama arada kapandıysa) işlem kimliği kayıtta olduğundan ödül ikinci kez verilmez, işlem yine bitirilir. Kayıt yazılamazsa işlem açık kalır ve sonraki açılışta yeniden gelir.
- Geri yükleme yalnız tüketilemezleri getirir (Reklamsız paket, Tema paketi).
- İlerlemeyi taşı kodu iki tüketilemez paketi taşımaz; satın alınan ipucu/güçlendirici/bilet kayıttaki sayılarla taşınır.
- Web'de ya da mağaza dışı APK'da yalnız Reklamsız paket satırı ve "Paketler mağazadan indirilen sürümde açılır" notu görünür.

### 10.3 Özel teklif penceresi (3 Kasım)

Ürünler seyrek bir **Özel teklif** penceresiyle de önerilir (`game.js` › `offerDue`, `maybeOffer`, `offerSheet`). Pencere yalnız gerçek mağaza ürünü gösterir, fiyat mağazanın verdiği gerçek fiyattır.

Sıklık kuralları (hepsi birden sağlanmalı):

- Yalnız bir bölüm **kazanıldıktan** sonra, sonuç paneli açıldıktan ~1,5 sn sonra; o an başka pencere açıksa ya da puan isteği (in-app review) çıktıysa bu tur yok.
- En çok **48 saatte bir** (`save.offerAt`).
- İlk açılıştan (`save.born`) sonraki **ilk 2 günde** ve **ilk 15 bölümde** hiç (`OFFER_MIN`; kazanılan bölüm 16 ve sonrası, en az 15 bölüm oynanmış).
- **Günün Hattı**, arşiv, pratik ve 🍃 zen bitişlerinde yok.
- Aynı turda **geçiş reklamıyla birlikte değil**: bu turun "Sonraki"sinde geçiş reklamı sırası varsa teklif çıkmaz (sıra ve 48 saat korunur).
- Mağaza hazır değilse (web, mağaza dışı APK, bağlantı yok) çıkmaz ve 48 saatlik süre işlemez.
- Sıra: Başlangıç paketi → Reklamsız paket → Güçlendirici paketi → 30 ipucu (`save.offerN`); **reklamsız sahibine Reklamsız paket gösterilmez**, sıradaki ürün gelir.

Mağaza kuralları gereği: üstü çizili eski fiyat, yüzde indirim, geri sayım, "son şans" dili yok; pencerede "Bu paket Ayarlar › Mağaza'da her zaman var" yazar. "Hayır, teşekkürler" düğmesi satın al düğmesi kadar büyük ve ekranda; pencere aşağı çekilerek ya da dışına dokunarak da kapanır. Ölçüm: `offer_shown`, `offer_buy` (YAYIN §5.4).

Kayıt adımları:

- **Play Console:** Para kazanma › Ürünler › Uygulama içi ürünler › Ürün oluştur. Kimlik, ad, açıklama, varsayılan fiyat; sonra ülke fiyatları (ABD tabanlı şablon kullanıyorsan ürünleri o şablona bağla, Türkiye'yi elle düzelt). Etkinleştir.
- **App Store Connect:** Uygulama › Uygulama İçi Satın Almalar › +. Tür (Consumable / Non-Consumable), Referans adı, Ürün kimliği, Fiyat (taban ABD), Türkiye elle, iki dilde görünen ad ve açıklama, inceleme ekran görüntüsü (Ayarlar › Mağaza penceresi). İlk sürümde ürünleri sürümle birlikte incelemeye gönder.

## 11. İnceleme notları

**App Store › Uygulama inceleme bilgileri**

- Oturum açma gerekli: Hayır.
- Not (İngilizce yaz):

```text
No account or sign-in. The game works fully offline; ads (Google AdMob) only load when online. Levels unlock with stars, so the first levels are enough to review the core loop. All in-app purchases are in Settings (top right on the home screen) > "Shop": Ad-free Pack (ray_reklamsiz) and Theme Pack (ray_temalar) are non-consumable and can be restored with the button in the same sheet; hint packs (ray_ipucu_10/30/80), Booster Pack (ray_guclendirici) and Ticket Pack (ray_bilet_50) and Starter Pack (ray_baslangic) are consumable. After some wins (at most once every 48 hours, never in the first 2 days or first 15 levels) a closable "Special offer" sheet may show one of these same products at its normal store price. Purchased tickets can only be spent on color themes, never on the surprise chest. Gameplay analytics (Firebase, no advertising ID) is off in regions where consent is required. The UI follows the device language (English or Turkish) and can be changed in Settings > Language. The ATT prompt appears on first launch after the consent step.
```

**Google Play › Uygulama erişimi**: "Tüm işlevler herhangi bir özel erişim olmadan kullanılabilir."

## 12. Kullanıcının yapacakları (kontrol listesi)

Hesaplar

- [ ] Google Play Console geliştirici hesabı (25 $ tek seferlik) ve kimlik doğrulama. Kişisel hesapta üretime çıkmadan önce en az 12 test kullanıcısıyla 14 gün kapalı test şartı var; testçi listesini erken hazırla.
- [ ] Apple Developer Program (yıllık 99 $). App Store Connect › Sözleşmeler: ücretli uygulama sözleşmesi, vergi ve banka bilgileri (uygulama içi satın alma bunlarsız çalışmaz).
- [ ] İki mağazada AB Dijital Hizmetler Yasası tacir beyanı. Reklam ve satın almayla gelir elde eden geliştirici genelde "tacir" sayılır; adres, telefon ve e-posta AB'de herkese açık gösterilir.

AdMob

- [ ] AdMob hesabı; Android ve iOS için ayrı uygulama (`com.osmanadali.ray`).
- [ ] Her platformda iki birim: geçiş (interstitial) ve ödüllü (rewarded), toplam dört birim.
- [ ] Kimlikleri GitHub › Settings › Variables'a gir: `ADMOB_APP_ID_ANDROID`, `ADMOB_INTERSTITIAL_ANDROID`, `ADMOB_REWARDED_ANDROID` ve iOS karşılıkları `ADMOB_APP_ID_IOS`, `ADMOB_INTERSTITIAL_IOS`, `ADMOB_REWARDED_IOS` (yayın iş akışları `magaza-yerel` dalında). Derleme bunları `window.RAY_ADS` olarak `index.html`'e yazar; yoksa test reklamı çıkar.
- [ ] AdMob › Gizlilik ve mesajlaşma: AB/BK rıza mesajı (GDPR), ABD eyalet mesajı ve iOS için IDFA açıklama mesajı oluştur ve yayınla.
- [ ] AdMob › Engelleme denetimleri: en yüksek reklam içeriği derecesi PG (uygulamadaki ayarla aynı; iOS için §8'deki nota bak).
- [ ] app-ads.txt: AdMob'un verdiği satırı (`google.com, pub-1478688740631972, DIRECT, f08c47fec0942fa0`) `https://osmanadali.github.io/app-ads.txt` adresine koy (alan adının kökünde olmalı; bunun için `osmanadali.github.io` adlı ayrı bir depo gerekir). Mağaza girişlerinde web sitesi olarak `https://osmanadali.github.io` yaz. Yoksa AdMob uyarı verir ve reklam geliri düşebilir.

Gizlilik ve yayın sayfası

- [ ] `www/gizlilik.html` içindeki `[geliştirici adı]` ve `[iletişim e-postası]` yer tutucularını doldur (`magaza-reklam` dalı).
- [ ] GitHub Pages'i aç (onayınla) ve `web.yml` push tetikleyicisini geri getir; gizlilik adresinin açıldığını tarayıcıda doğrula.

İmza

- [ ] Play App Signing'i kullan. Yükleme anahtarını (keystore) oluştur, güvenli bir yere **yedekle**, GitHub gizlerine koy: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
- [ ] iOS: dağıtım sertifikası, App Store profili ya da App Store Connect API anahtarı (`ios.yml`, `magaza-yerel` dalı).

Ölçüm (Firebase Analytics, isteğe bağlı; ayrıntı `docs/YAYIN.md` §5)

- [ ] Firebase projesi; Android uygulaması `com.osmanadali.ray` (test APK'ları için ayrıca `com.osmanadali.ray.dev`, `com.osmanadali.ray.test`) ve iOS uygulaması `com.osmanadali.ray`.
- [ ] GitHub gizli değerleri: `FIREBASE_ANDROID_JSON` (google-services.json, base64), `FIREBASE_IOS_PLIST` (GoogleService-Info.plist, base64). Yoksa ölçüm kapalı derlenir, derleme bozulmaz.
- [ ] Veri saklama süresi 14 ay; Google sinyalleri ve reklam bağlantıları kapalı; AdMob–Firebase bağlantısı yapılırsa `ad_impression` olaylarının ikiye katlanmadığını DebugView'da kontrol et.
- [ ] Ölçümle yayımlarsan Veri güvenliği (§6) ve App Privacy (§7) Firebase satırları eklenmeli; ölçümsüz yayımlarsan eklenmez.

Mağaza

- [ ] Play'de ve App Store Connect'te uygulama kaydı (paket `com.osmanadali.ray`, birincil dil Türkçe, ikinci dil İngilizce).
- [ ] Uygulama içi ürünler (§10) iki mağazada oluşturulup etkinleştirilmeli: `ray_reklamsiz`, `ray_temalar` (tüketilemez) ve `ray_ipucu_10`, `ray_ipucu_30`, `ray_ipucu_80`, `ray_guclendirici`, `ray_bilet_50`, `ray_baslangic` (tüketilebilir). Kimlikler iki mağazada aynı yazılmalı.
- [ ] Öteki ürünlerin fiyatları (§10.2): ABD taban 0,99 / 1,99 / 3,99 $, Türkiye elle ₺19,99 / 39,99 / 79,99; Başlangıç paketi 2,99 $ / ₺59,99.
- [ ] Uygulama fiyatı: iki mağazada **Ücretsiz** (Play'de "Ücretsiz", App Store'da 0,00 $).
- [ ] Reklamsız paket fiyatı (§10.1): App Store'da taban ülke ABD 2,99 $, Türkiye elle ₺59,99. Play'de ABD 2,99 $ · AB 2,99 € · BK 2,49 £ elle (ya da USD tabanlı şablon). Taban Türkiye bırakılmaz.
- [ ] Metinleri (§4, §5) ve görselleri (§2) yükle.
- [ ] Formlar: Veri güvenliği (§6), App Privacy (§7), yaş derecelendirmesi (§8), hedef kitle ve öteki beyanlar (§9), inceleme notları (§11).
- [ ] Gerçek cihazda son deneme: rıza penceresi, iOS ATT penceresi, reklam, satın alma ve geri yükleme (Play lisans test hesabı, Apple Sandbox). Tüketilebilir bir paketi iki kez al (ikisi de verilmeli), uygulamayı satın alma sırasında kapatıp aç (ödül bir kez gelmeli); Firebase DebugView'da `level_start`/`level_end` görünmeli; özel teklif (16. bölümden sonra, kayıt 2 günden eski) bir kez çıkmalı.
- [ ] Yayın: Play'de iç test → kapalı test (14 gün) → üretim. iOS'ta TestFlight → incelemeye gönder.

## 13. Bilinen sınırlar

- **İki dil.** Oyun Türkçe ve İngilizcedir (28 Ekim 2026). İngilizce mağaza girişi İngilizce ekran görüntüleriyle (`store/screens-en/`) yüklenir. Altyapı ve sözlük: `docs/CEVIRI.md`.
- **Kural sayısı.** Açıklama 24 kuralın hepsini hat sırasıyla sayar (4 Kasım: son sefer ve kayan sütun eklendi; tam açıklama 4000 sınırının altında).
- **Görseller çalışan koda bağlı.** Arayüz değişince `node tools/store-shots.cjs` yeniden çalıştırılmalı. Sahneler bölüm numarasıyla kurulur (180, 45, 829…); üretim değişirse aynı numara farklı bir tahta verebilir, çıktı gözle kontrol edilmeli.
- **Veri ve gizlilik yanıtları** AdMob'un ve Firebase Analytics'in Kasım 2026 itibarıyla bilinen davranışına göredir. Gönderimden önce §6 ve §7'deki Google bağlantılarıyla karşılaştırılmalı.
- **Silme düğmesi ve rıza penceresi** `magaza-reklam` dalında, iOS projesi ve imzalı derleme `magaza-yerel` dalındadır; bu belge o dallar `main`e birleşmiş gibi yazıldı.
