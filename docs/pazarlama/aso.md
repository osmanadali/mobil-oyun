# Ray: ASO planı (App Store + Google Play)

Hazırlanma: 20 Kasım 2026. Kapsam: 9 dil (tr, en, de, es, pt-BR, fr, ko, ja, zh-Hant), sürüm 1.2. Play'de yayın 21 Kasım 2026. Bu belge `docs/MAGAZA.md` metinlerini temel alır ve onları iyileştirir; oyun kodu ve MAGAZA.md değişmez. Metinler onaylanınca MAGAZA.md'ye işlenmeli.

> **Dürüstlük notu (öncelikli):** 1.2 ile haftalık lig ve canlı kapışma Firebase üzerinden çalışıyor (`www/lig.js`), yani bağlantı gerektirir. Mevcut "internetsiz" vurgusu bölümler için doğru; fakat mağaza metinleri kapışma/lig'i de öne çıkaracağı için her yerde "bölümler internetsiz, kapışma ve lig bağlantı gerektirir" ayrımı yazıldı (Apple 2.3.1 ve Play "yanıltıcı beyan" ilkeleri). Aşağıdaki Play uzun açıklama satırları bunu içerir; App Store alt başlığından "internetsiz" bilerek çıkarıldı, ama kısa açıklama ve açıklamada kalıyor.

## 1. İlkeler ve mevcut durum

**İlkeler**

- **Apple arama alanı**: ad (30) + alt başlık (30) + anahtar kelime (100 bayt) birlikte indekslenir. Aynı kelimeyi iki alanda yazmak boşa gider. Açıklama (4000) App Store'da aramaya girmez, dönüşüme hizmet eder. Çoğul/tekil ve virgülsüz boşluk Apple tarafından birleştirilir. Aynı kelime farklı yerelde (ör. es-ES, es-MX) ikinci anahtar alanı sağlar.
- **Google Play arama alanı**: başlık (30), kısa açıklama (80), uzun açıklama (4000, tamamı indekslenir; ilk 3 satır görünür kısım). Play kelime sıklığına bakar ama yığma cezalandırılır; aynı sözcük 3-5 kez doğal cümlede yeter. Play'de ayrı anahtar kelime alanı yok.
- **Dönüşüm sıralaması belirler**: arama sonucunda ikon, ad, ilk 3 ekran görüntüsü ve puan görünür. İkon + ilk görsel indirme oranını, indirme hızı da sıralamayı etkiler.
- **Yasak**: "en iyi", "#1", "ücretsiz ödül/bedava hediye", fiyat/indirim iddiası ad ve alt başlıkta, başka uygulama/marka adı, emoji spam. Uygulama içi ödüller yalnız oyunda kazanılan biletle açılır, gerçek para ödülü yoktur; metin bunu abartmaz.
- **Yerel dil, çeviri değil**: her dilde o pazarın arama kalıbı yazıldı (ör. ja "脳トレ", ko "지하철", de "U-Bahn").

**Mevcut durum (MAGAZA.md)**

| Güçlü | Zayıf / fırsat |
|---|---|
| Ad "Ray: Metro Bulmaca" kısa, marka + tür net; 9 dilde tutarlı | Alt başlıklar yalnız özellik sayar ("Tek elle, internetsiz, sakin"); arama hacmi olan "hat bağla / boru / bağla" tür sözcükleri yok |
| Gerçek oyundan üretilmiş 7 sahne, 9 dilde başlıklı görsel; ilk görsel oynanış | Görseller 1.1 durumunda: lig, canlı kapışma, şehir haritası, öğretici yok. 04-harita başlığı "24 kural" eskidi (şimdi 33 hat) |
| Anahtar kelime alanı ad/alt başlığı tekrarlamıyor; ko/ja/zh kısa ama uyumlu | tanıtım metni "24 kural" der (eski); 1.2 yenilikleri (kapışma, lig) tanıtım ve açıklamada öne çıkmıyor |
| İnternetsiz + tek elle + sakin: Net/Pipes türünde net farklılaşma | "İnternetsiz" artık kapışma/lig ile kısmen çelişir, ayrım yazılmalı (bkz. not) |
| Ücretsiz + sınırlı reklam + Reklamsız paket; sakin ton tutarlı | Ko/ja/zh metinlerinde "hub" terimi tutarlı ama arama kalıpları (두뇌게임, 脳トレ, 益智) alt başlıkta yok |
| Puan/yorum isteği yok, gamificasyon var; Günün Hattı geri dönüş sebebi | Play'de henüz puan/yorum yok (21 Kasım yayın); ilk 4 haftada puan toplamak şart |

## 2. Anahtar kelimeler (9 dil)

Hacim ve rekabet **tahmindir** (D=düşük, O=orta, Y=yüksek; araç verisi değil, alan bilgisine dayalı). Yayından sonra App Store Connect Analytics (Arama terimleri), Play Console (Arama terimleri/edinme raporu) ve gerekirse AppTweak / Sensor Tower / AppFigures ile gerçek veriyle değiştirilmeli. "Birincil" = ad/alt başlık/kısa açıklama veya anahtar alanına mutlaka girecek; "ikincil" = uzun açıklama, anahtar alanında yer kalırsa.

### Türkçe (tr-TR)

| Kelime / kalıp | Rol | Hacim (tahmin) | Rekabet (tahmin) |
|---|---|---|---|
| metro bulmaca | Birincil | orta | orta |
| boru bulmacası | Birincil | yüksek | yüksek |
| tren yolu oyunu | Birincil | orta | orta |
| zeka oyunları | Birincil | yüksek | yüksek |
| mantık oyunu | Birincil | orta | yüksek |
| internetsiz oyun | Birincil | yüksek | yüksek |
| offline oyun | Birincil | yüksek | yüksek |
| tek elle oyun | İkincil | düşük | düşük |
| sakin oyun | İkincil | düşük | düşük |
| istasyon bağla | İkincil | düşük | düşük |
| hat bağlama | İkincil | düşük | düşük |
| beyin oyunu | İkincil | orta | yüksek |
| günlük bulmaca | İkincil | düşük | düşük |
| karo döndürme | İkincil | düşük | düşük |
| net oyunu | İkincil | düşük | orta |
| canlı kapışma | İkincil | düşük | düşük |
| rayları döndür | İkincil | düşük | düşük |
| metro haritası | İkincil | düşük | düşük |
| bulmaca oyunları | Birincil | yüksek | yüksek |
| rahatlatıcı oyun | İkincil | orta | orta |

**Rakiplerin kullandığı terimler:** pipe/boru, connect/bağla, loop/halka, metro, subway/"metro" (Türkçede "subway" yerine "metro" denir), train/tren, logic/mantık, brain/beyin. Rakipler çoğunlukla İngilizce ad kullanır ("Pipe Puzzle", "Mini Metro" türü); Türkçe "boru bulmacası" ve "metro bulmaca" birleşimi neredeyse boş. Kategori sözcükleri: zeka, mantık, bulmaca.

### İngilizce (en-US)

| Kelime / kalıp | Rol | Hacim (tahmin) | Rekabet (tahmin) |
|---|---|---|---|
| pipe puzzle | Birincil | yüksek | yüksek |
| connect puzzle | Birincil | yüksek | yüksek |
| metro puzzle | Birincil | orta | orta |
| subway puzzle | İkincil | orta | orta |
| train puzzle | Birincil | orta | yüksek |
| logic puzzle | Birincil | yüksek | yüksek |
| brain game | Birincil | yüksek | yüksek |
| offline puzzle | Birincil | yüksek | yüksek |
| one hand game | İkincil | düşük | düşük |
| relaxing game | Birincil | yüksek | yüksek |
| rotate tiles | İkincil | düşük | düşük |
| rail puzzle | İkincil | düşük | düşük |
| line connect | İkincil | orta | orta |
| net game | İkincil | düşük | orta |
| daily puzzle | İkincil | orta | yüksek |
| zen puzzle | İkincil | orta | orta |
| station connect | İkincil | düşük | düşük |
| puzzle duel | İkincil | düşük | düşük |
| subway map game | İkincil | düşük | düşük |
| calm game | İkincil | orta | orta |

**Rakiplerin kullandığı terimler:** pipe, connect, loop, flow, metro, subway, train, rail, logic, brain, relax, "puzzle". En kalabalık küme "pipe/connect/logic/brain"; "metro/subway + puzzle" daha az kalabalık ama Mini Metro türü güçlü. "Subway" ABD'de, "metro/underground" İngiltere'de daha yaygın; ikisi de anahtar kelimede. ("Subway Surfers" markasıyla karışmaz; yalnızca tür anlamı.)

### Almanca (de-DE)

| Kelime / kalıp | Rol | Hacim (tahmin) | Rekabet (tahmin) |
|---|---|---|---|
| rohrpuzzle | Birincil | orta | orta |
| logikspiel | Birincil | yüksek | yüksek |
| denkspiel | Birincil | yüksek | yüksek |
| u-bahn spiel | Birincil | orta | orta |
| zugspiel | İkincil | orta | yüksek |
| rätsel offline | Birincil | orta | yüksek |
| offline spiele | Birincil | yüksek | yüksek |
| einhändig spielen | İkincil | düşük | düşük |
| entspannendes spiel | İkincil | orta | orta |
| linien verbinden | İkincil | düşük | düşük |
| bahnhof puzzle | İkincil | düşük | düşük |
| kachel puzzle | İkincil | düşük | düşük |
| tägliches rätsel | İkincil | düşük | düşük |
| knobelspiel | Birincil | orta | orta |
| gleise drehen | İkincil | düşük | düşük |
| live duell | İkincil | düşük | düşük |
| metro karte | İkincil | düşük | düşük |

**Rakiplerin kullandığı terimler:** rohre, verbinden, netz, u-bahn (metro yerine), zug, bahnhof, logik, denk/knobel. Almancada "Metro" yalnız market zinciri çağrışımı yapar; "U-Bahn" arama hacmi daha yüksek. Ad "Metro-Linienrätsel" kalsın, "ubahn" anahtar alanında olsun.

### İspanyolca (es-ES / es-419)

| Kelime / kalıp | Rol | Hacim (tahmin) | Rekabet (tahmin) |
|---|---|---|---|
| puzle de tuberías | Birincil | orta | orta |
| juego de lógica | Birincil | yüksek | yüksek |
| juegos de ingenio | Birincil | yüksek | yüksek |
| juego de metro | Birincil | orta | orta |
| juego de trenes | İkincil | orta | yüksek |
| sin internet | Birincil | yüksek | yüksek |
| juegos offline | Birincil | yüksek | yüksek |
| a una mano | İkincil | düşük | düşük |
| juego relajante | İkincil | yüksek | yüksek |
| conectar líneas | İkincil | düşük | düşük |
| rompecabezas | Birincil | yüksek | yüksek |
| estaciones puzle | İkincil | düşük | düşük |
| reto diario | İkincil | düşük | düşük |
| girar piezas | İkincil | düşük | düşük |
| duelo en vivo | İkincil | düşük | düşük |
| mapa de metro | İkincil | düşük | düşük |

**Rakiplerin kullandığı terimler:** tuberías, conectar, metro/subte (Arjantin), tren, estación, lógica, ingenio, rompecabezas, "sin internet". Latin Amerika'da "metro", Arjantin'de "subte", İspanya'da "metro"; es-419 için aynı metin yeterli, subte anahtarda.

### Portekizce (pt-BR)

| Kelime / kalıp | Rol | Hacim (tahmin) | Rekabet (tahmin) |
|---|---|---|---|
| quebra-cabeça de canos | Birincil | orta | orta |
| jogo de lógica | Birincil | yüksek | yüksek |
| jogo de metrô | Birincil | orta | orta |
| jogo de trem | İkincil | orta | yüksek |
| jogo offline | Birincil | yüksek | yüksek |
| sem internet | Birincil | yüksek | yüksek |
| jogo para uma mão | İkincil | düşük | düşük |
| jogo relaxante | İkincil | yüksek | yüksek |
| ligar estações | İkincil | düşük | düşük |
| quebra-cabeça | Birincil | yüksek | yüksek |
| desafio diário | İkincil | düşük | düşük |
| girar peças | İkincil | düşük | düşük |
| duelo ao vivo | İkincil | düşük | düşük |
| mapa do metrô | İkincil | düşük | düşük |
| jogo de raciocínio | Birincil | orta | yüksek |

**Rakiplerin kullandığı terimler:** canos/tubos, ligar/conectar, metrô, trem, estação, lógica, raciocínio, "sem internet", "offline". Brezilya'da "metrô" aksanlı yazılır; aksansız arama da yaygın, Apple aksan farkını büyük ölçüde eşler.

### Fransızca (fr-FR)

| Kelime / kalıp | Rol | Hacim (tahmin) | Rekabet (tahmin) |
|---|---|---|---|
| puzzle de tuyaux | Birincil | orta | orta |
| jeu de logique | Birincil | yüksek | yüksek |
| jeu de réflexion | Birincil | yüksek | yüksek |
| jeu de métro | Birincil | orta | orta |
| jeu de train | İkincil | orta | yüksek |
| jeu hors ligne | Birincil | yüksek | yüksek |
| sans internet | Birincil | yüksek | yüksek |
| jeu à une main | İkincil | düşük | düşük |
| jeu relaxant | İkincil | orta | yüksek |
| relier les lignes | İkincil | düşük | düşük |
| casse-tête | Birincil | yüksek | yüksek |
| défi quotidien | İkincil | düşük | düşük |
| tourner les tuiles | İkincil | düşük | düşük |
| duel en direct | İkincil | düşük | düşük |
| plan de métro | İkincil | düşük | düşük |

**Rakiplerin kullandığı terimler:** tuyaux, relier, métro, train, gare, logique, réflexion, casse-tête, "hors ligne". Fransızcada "offline" İngilizce kalıp olarak da aranır.

### Korece (ko-KR)

| Kelime / kalıp | Rol | Hacim (tahmin) | Rekabet (tahmin) |
|---|---|---|---|
| 지하철 퍼즐 | Birincil | orta | orta |
| 파이프 퍼즐 | Birincil | yüksek | orta |
| 퍼즐 게임 | Birincil | yüksek | yüksek |
| 두뇌 게임 | Birincil | yüksek | yüksek |
| 오프라인 게임 | Birincil | yüksek | yüksek |
| 노선 연결 | İkincil | düşük | düşük |
| 한 손 게임 | İkincil | düşük | düşük |
| 힐링 게임 | Birincil | yüksek | yüksek |
| 기차 퍼즐 | İkincil | orta | orta |
| 논리 퍼즐 | İkincil | orta | orta |
| 지하철 노선도 | İkincil | orta | orta |
| 타일 돌리기 | İkincil | düşük | düşük |
| 오늘의 퍼즐 | İkincil | düşük | düşük |
| 실시간 대결 | İkincil | düşük | düşük |
| 캐주얼 퍼즐 | İkincil | orta | yüksek |

**Rakiplerin kullandığı terimler:** 파이프, 연결, 지하철 (메트로 yerine), 노선, 기차, 두뇌, 논리, 힐링. Koreede "지하철" baskın; 지하철 노선도 (Seoul metro map) kullanıcıları için güçlü ilgi. 아이콘/ilk ekran görseli çok belirleyici.

### Japonca (ja-JP)

| Kelime / kalıp | Rol | Hacim (tahmin) | Rekabet (tahmin) |
|---|---|---|---|
| パイプパズル | Birincil | orta | orta |
| メトロ パズル | Birincil | orta | orta |
| 脳トレ | Birincil | yüksek | yüksek |
| パズルゲーム | Birincil | yüksek | yüksek |
| オフライン ゲーム | Birincil | yüksek | yüksek |
| 電車 パズル | Birincil | orta | orta |
| 路線 パズル | İkincil | düşük | düşük |
| 片手 ゲーム | İkincil | düşük | düşük |
| 暇つぶし | Birincil | yüksek | yüksek |
| 癒し ゲーム | İkincil | yüksek | orta |
| 駅 つなぐ | İkincil | düşük | düşük |
| ロジックパズル | İkincil | orta | orta |
| 毎日 パズル | İkincil | düşük | düşük |
| ライブ対戦 | İkincil | düşük | düşük |
| 路線図 | İkincil | orta | orta |

**Rakiplerin kullandığı terimler:** パイプ, つなぐ, 電車/路線 (地下鉄 yerine), 駅, 脳トレ, ロジック, 暇つぶし, 癒し. Japonyada "電車" ve "路線図" çok güçlü; "脳トレ" ve "暇つぶし" yüksek hacimli kalıplardır. Katakana "メトロ" ad ve alt başlıkta.

### Geleneksel Çince (zh-TW / zh-Hant)

| Kelime / kalıp | Rol | Hacim (tahmin) | Rekabet (tahmin) |
|---|---|---|---|
| 水管遊戲 | Birincil | orta | orta |
| 燒腦遊戲 | Birincil | yüksek | yüksek |
| 益智遊戲 | Birincil | yüksek | yüksek |
| 解謎遊戲 | Birincil | yüksek | yüksek |
| 地鐵解謎 | Birincil | orta | orta |
| 捷運遊戲 | İkincil | orta | orta |
| 離線遊戲 | Birincil | yüksek | yüksek |
| 單手遊戲 | İkincil | düşük | düşük |
| 療癒遊戲 | Birincil | yüksek | yüksek |
| 路線圖 | İkincil | orta | orta |
| 火車解謎 | İkincil | düşük | düşük |
| 連線遊戲 | İkincil | orta | orta |
| 每日挑戰 | İkincil | düşük | düşük |
| 即時對戰 | İkincil | düşük | düşük |
| 邏輯遊戲 | İkincil | orta | orta |

**Rakiplerin kullandığı terimler:** 水管, 連線, 地鐵/捷運 (Tayvan'da 捷運, Hong Kong'da 地鐵), 火車, 燒腦, 益智, 邏輯, 療癒. Ad "地鐵" (mevcut, HK ve genel), kelime alanında 捷運 (Tayvan).

## 2b. Öncelikli pazar: Türkiye (tr-TR) ayrıntılı plan

Karar: öncelikli pazar Türkiye, reklam bütçesi çok küçük (~5.000 TL/ay), bu yüzden ASO ana edinme kanalıdır. Diğer 8 dilde ucuz/organik yaklaşım: metinler bir kez yerleşir, ek bütçe harcanmaz; yalnız ilk 8 haftada arama terimi raporuna göre anahtar alanı bir kez güncellenir.

**TR anahtar kelime stratejisi.** Türkçe arama hacmi İngilizce "pipe puzzle" gibi küme yerine günlük dil kalıplarında toplanır ("zeka oyunları", "internetsiz oyunlar", "bulmaca oyunları", "tren oyunu"). Çevrimdışı/internetsiz arama Türkiye'de yüksek hacimlidir (ucuz veri paketi, ulaşımda oyun oynama): bu kalıp açıklamada ve kısa açıklamada kalmalı, App Store alanında "offline" ile desteklenmeli.

| Katman | Alan | Kalıp | Not |
|---|---|---|---|
| 1 (ad) | App Store/Play ad | Ray: Metro Bulmaca | Marka + "metro bulmaca" (orta hacim, düşük-orta rekabet) |
| 2 (alt başlık) | App Store alt başlık | Hattı bağla, tek elle, sakin | "bağla/hat" fiil+tür; "internetsiz" bilerek anahtar alanında "offline" ile |
| 3 (anahtar alanı) | App Store anahtar | boru,tren,durak,istasyon,zeka,mantık,beyin,günlük,karo,net,pipes,lig,kapışma,harita,offline | "zeka"+"mantık" ile "zeka oyunları/mantık oyunu" kombinasyonu; Apple kelimeleri birleştirir, "oyun" kelimesi kategori gereği zaten uygun |
| 4 (Play kısa) | Play kısa açıklama | Rayları döndür, durakları bağla. Tek elle, internetsiz, sakin metro bulmacası. | "internetsiz" Play'de kısa açıklamada tutulur (Play'de ayrı anahtar alanı yok) |
| 5 (Play uzun) | Play uzun açıklama | zeka oyunu, mantık oyunu, boru bulmacası, tren hattı, internetsiz, tek elle, kapışma, lig | Her biri 2-4 kez, doğal cümlede; "boru bulmacası" Net/Pipes türünü arayanları yakalar |

**TR alternatif başlık/alt başlık denemeleri** (ilk 4 haftanın sonunda arama terimi raporuna göre): alt başlık B "Zeka oyunu, tek elle, sakin" (27), alt başlık C "Tren hattı bulmacası, sakin" (27). Karakter sayıları elle doğrulanmalı; uygulanmadan önce `[...str].length` ile say.

**TR 1.2 Yenilikler (tanıtım metni, 170)** döngüsü (sürüm göndermeden değişir): Kasım: kapışma+lig (yukarıdaki), Aralık: "Yılbaşı kupası/hafta etkinliği" (varsa), Ocak: yeni hat. Aynı metin Play "Güncel gelişmeler" ile eşleşmeli.

**Düşük bütçeli edinme (5.000 TL/ay) önerisi.** Sıralama: (1) 21 Kasım Play yayınında ilk 2 hafta Play'de ilk puanları toplamak için kapalı/açık test topluluğu (arkadaş ve aile gerçek kullanıcı; yorum satın alma/teşvik yok); (2) App Store tarafında Apple Search Ads Basic değil **Advanced** ile günlük ~50-60 TL, yalnız marka+tür kelimeleri (tam eşleşme: "metro bulmaca", "boru bulmacası", "zeka oyunları"), amaç ücretli reklamdan çok **arama terimi verisi** toplamak; CPT/CPI ölçülür, kötü terimler negatif yapılır; (3) Google Play tarafında 1-2 hafta sonra Google Ads UAC değil, düşük günlük limitli "Uygulama kampanyası" denemesi yalnız tr; (4) kalan bütçe ile mikro-influencer ve bulmaca/zeka topluluklarında (organik paylaşım, "arkadaşına öner" özelliği ücretsiz kanal). Sabit rakamlar tahmindir, Türkiye'de TBM/TBT oranları sürekli değişir.

**Yerel işaretler:** Türkçe başlıklarda "Metro" (İstanbul/Ankara metro algısı) yakın çağrışım yapar; ekran görüntülerinde İstanbul metro hatlarına benzer renkli hatlar kullanılabilir ancak gerçek hat adı/logosu (marka) kullanılmaz. TL fiyatlı IAP (Reklamsız paket) açıklamada yer alır.


## 3. Önerilen metinler ve karakter sayıları

Karakterler `[...str].length` ile (Unicode kod noktası), bayt `Buffer.byteLength` (UTF-8) ile sayıldı. Marka adı "Ray" ve mevcut adlandırma korundu (ad alanları MAGAZA.md ile aynı; değişen: alt başlık, anahtar kelime, tanıtım, kısa açıklama, uzun açıklama girişi). Anahtar alan: ad ve alt başlıktaki sözcükler tekrarlanmadı (gövde farklı ekli biçimler hariç); virgül sonrası boşluk yok.

### 3.1 Sayı tablosu

| Alan | Sınır | TR | EN | DE | ES | PT | FR | KO | JA | ZH |
|---|---|---|---|---|---|---|---|---|---|---|
| App Store ad | 30 | 18 | 22 | 23 | 26 | 27 | 21 | 14 | 13 | 11 |
| App Store alt başlık | 30 | 28 | 28 | 27 | 26 | 27 | 28 | 15 | 16 | 9 |
| App Store anahtar (karakter) | 100 bayt | 91 | 98 | 96 | 93 | 85 | 94 | 41 | 40 | 42 |
| App Store anahtar (UTF-8 bayt) | 100 | 96 | 98 | 97 | 96 | 91 | 95 | 99 | 100 | 100 |
| App Store tanıtım metni | 170 | 147 | 152 | 156 | 158 | 160 | 164 | 83 | 69 | 58 |
| Play başlık | 30 | 18 | 22 | 23 | 26 | 27 | 21 | 14 | 13 | 11 |
| Play kısa açıklama | 80 | 78 | 79 | 78 | 79 | 79 | 77 | 48 | 44 | 33 |
| Play uzun: 1. / 2. / 3. satır (karakter) | 4000 toplam | 119/113/67 | 116/116/60 | 153/114/63 | 136/133/71 | 129/130/58 | 140/143/74 | 75/62/37 | 72/57/34 | 53/53/20 |

Hepsi sınırın altında (ad/alt başlık ≤30, tanıtım ≤170, Play kısa ≤80, anahtar ≤100 bayt). ko/ja/zh'de bayt sınırı belirleyicidir: ko 41 karakter = 99 bayt, ja 40 karakter = 100 bayt, zh 42 karakter = 100 bayt.

### 3.2 Türkçe (tr-TR)

| Alan | Metin | Sayı |
|---|---|---|
| App Store ad | `Ray: Metro Bulmaca` | 18/30 |
| App Store alt başlık | `Hattı bağla, tek elle, sakin` | 28/30 |
| App Store anahtar | `boru,tren,durak,istasyon,zeka,mantık,beyin,günlük,karo,net,pipes,lig,kapışma,harita,offline` | 91 karakter, 96/100 bayt |
| App Store tanıtım | Yeni: canlı kapışma ve haftalık lig! Rayları döndür, durakları bağla, kusursuz bitir. 33 hat, şehir metro haritası ve her gün yeni bir Günün Hattı. | 147/170 |
| Play başlık | `Ray: Metro Bulmaca` | 18/30 |
| Play kısa | Rayları döndür, durakları bağla. Tek elle, internetsiz, sakin metro bulmacası. | 78/80 |

**Play uzun açıklama, ilk 3 satır önerisi** (görünen kısım; arkasından MAGAZA.md'deki "nasıl oynanır" gövdesi gelir, orada "24 hat/24 kural" ifadeleri 33'e güncellenmeli):

1. Ray, tek elle oynanan sakin bir metro bulmacasıdır. Karoya dokun, ray 90° döner; hattı merkezden bütün duraklara bağla.
2. YENİ 1.2: canlı kapışma, haftalık lig, şehir metro haritası ve 7 yeni hat (toplam 33 kural hattı + sonsuz karma).
3. Bölümler internetsiz oynanır; kapışma ve lig için bağlantı gerekir.

**Yerleşim notu:** Başlık/ad: "Metro Bulmaca" (hacim + marka). Kısa açıklamanın ilk 40 karakterinde "rayları döndür, durakları bağla"; uzun açıklamada "bulmaca", "metro", "mantık", "zeka", "internetsiz", "tek elle", "kapışma", "lig" 2-4 kez doğal akışta geçsin; başlıklar (YENİ 1.2, NASIL OYNANIR) kelime yığma yeri değil.

### 3.3 İngilizce (en-US)

| Alan | Metin | Sayı |
|---|---|---|
| App Store ad | `Ray: Metro Line Puzzle` | 22/30 |
| App Store alt başlık | `Connect the line, one-handed` | 28/30 |
| App Store anahtar | `pipes,net,subway,train,station,logic,brain,daily,relaxing,rotate,tiles,map,zen,duel,league,offline` | 98 karakter, 98/100 bayt |
| App Store tanıtım | New: live duels and a weekly league! Rotate the rails, link every station, finish flawlessly. 33 lines, a city metro map and a new Daily Line every day. | 152/170 |
| Play başlık | `Ray: Metro Line Puzzle` | 22/30 |
| Play kısa | Rotate the rails, link every station. A calm, one-handed metro puzzle, offline. | 79/80 |

**Play uzun açıklama, ilk 3 satır önerisi** (görünen kısım; arkasından MAGAZA.md'deki "nasıl oynanır" gövdesi gelir, orada "24 hat/24 kural" ifadeleri 33'e güncellenmeli):

1. Ray is a calm, one-handed metro puzzle. Tap a tile, the rail turns 90°; link the line from the hub to every station.
2. NEW in 1.2: live duels, a weekly league, a city metro map and 7 new lines (33 rule lines plus endless mixed levels).
3. Levels play offline; duels and the league need a connection.

**Yerleşim notu:** Title "Metro Line Puzzle". Short description: rotate, link, station, calm, one-handed, offline. Long description: pipe, connect, logic, brain, subway, train 2-4 kez doğal cümlede; ilk 3 satırda "metro puzzle", "live duels", "weekly league".

### 3.4 Almanca (de-DE)

| Alan | Metin | Sayı |
|---|---|---|
| App Store ad | `Ray: Metro-Linienrätsel` | 23/30 |
| App Store alt başlık | `Linien verbinden, einhändig` | 27/30 |
| App Store anahtar | `rohre,netz,ubahn,zug,bahnhof,logik,denkspiel,täglich,drehen,kacheln,karte,zen,liga,duell,offline` | 96 karakter, 97/100 bayt |
| App Store tanıtım | Neu: Live-Duelle und Wochenliga! Dreh die Gleise, verbinde jede Station, spiel perfekt. 33 Linien, eine Metro-Stadtkarte und jeden Tag eine neue Tageslinie. | 156/170 |
| Play başlık | `Ray: Metro-Linienrätsel` | 23/30 |
| Play kısa | Dreh die Gleise, verbinde jede Station. Ruhiges Rätsel für eine Hand, offline. | 78/80 |

**Play uzun açıklama, ilk 3 satır önerisi** (görünen kısım; arkasından MAGAZA.md'deki "nasıl oynanır" gövdesi gelir, orada "24 hat/24 kural" ifadeleri 33'e güncellenmeli):

1. Ray ist ein ruhiges Metro-Rätsel für eine Hand. Tippe eine Kachel an, das Gleis dreht sich um 90°; verbinde die Linie von der Zentrale mit jeder Station.
2. NEU in 1.2: Live-Duelle, Wochenliga, Metro-Stadtkarte und 7 neue Linien (33 Regel-Linien plus endlose Mischlevel).
3. Level laufen offline; Duelle und Liga brauchen eine Verbindung.

**Yerleşim notu:** Titel "Metro-Linienrätsel" (rätsel Puzzle yerine). "U-Bahn", "Logik", "Denkspiel", "Zug", "Bahnhof" uzun açıklamada; Almanca birleşik sözcüklerde Play arama parçalamaz, "U-Bahn-Rätsel" ve "Denkspiel" ayrı geçsin.

### 3.5 İspanyolca (es-ES / es-419)

| Alan | Metin | Sayı |
|---|---|---|
| App Store ad | `Ray: Puzle de Líneas Metro` | 26/30 |
| App Store alt başlık | `Conecta líneas, a una mano` | 26/30 |
| App Store anahtar | `tuberías,red,subte,tren,estación,lógica,mente,diario,girar,piezas,mapa,zen,liga,duelo,offline` | 93 karakter, 96/100 bayt |
| App Store tanıtım | Novedad: duelos en vivo y liga semanal. Gira las vías, conecta cada estación y termina perfecto. 33 líneas, mapa metro de la ciudad y una Línea del día nueva. | 158/170 |
| Play başlık | `Ray: Puzle de Líneas Metro` | 26/30 |
| Play kısa | Gira las vías y conecta cada estación. Un puzle tranquilo de metro, a una mano. | 79/80 |

**Play uzun açıklama, ilk 3 satır önerisi** (görünen kısım; arkasından MAGAZA.md'deki "nasıl oynanır" gövdesi gelir, orada "24 hat/24 kural" ifadeleri 33'e güncellenmeli):

1. Ray es un puzle de metro tranquilo para jugar con una mano. Toca una pieza y la vía gira 90°; lleva la línea del centro a cada estación.
2. NOVEDAD 1.2: duelos en vivo, liga semanal, mapa metro de la ciudad y 7 líneas nuevas (33 líneas con reglas y niveles mixtos sin fin).
3. Los niveles se juegan sin red; los duelos y la liga necesitan conexión.

**Yerleşim notu:** Başlıkta "Puzle" + "Líneas" + "Metro". Uzun açıklamada "tuberías", "lógica", "ingenio", "rompecabezas", "sin conexión", "subte" doğal geçsin; "Línea del día", "duelos en vivo", "liga semanal" ilk paragrafta.

### 3.6 Portekizce (pt-BR)

| Alan | Metin | Sayı |
|---|---|---|
| App Store ad | `Ray: Quebra-Cabeça do Metrô` | 27/30 |
| App Store alt başlık | `Conecte linhas, com uma mão` | 27/30 |
| App Store anahtar | `canos,rede,trem,estação,lógica,cérebro,diário,girar,peças,mapa,zen,liga,duelo,offline` | 85 karakter, 91/100 bayt |
| App Store tanıtım | Novo: duelos ao vivo e liga semanal! Gire os trilhos, ligue cada estação, termine perfeito. 33 linhas, mapa do metrô da cidade e uma Linha do Dia nova todo dia. | 160/170 |
| Play başlık | `Ray: Quebra-Cabeça do Metrô` | 27/30 |
| Play kısa | Gire os trilhos, ligue as estações. Quebra-cabeça calmo de metrô, para uma mão. | 79/80 |

**Play uzun açıklama, ilk 3 satır önerisi** (görünen kısım; arkasından MAGAZA.md'deki "nasıl oynanır" gövdesi gelir, orada "24 hat/24 kural" ifadeleri 33'e güncellenmeli):

1. Ray é um quebra-cabeça de metrô calmo, para uma mão. Toque numa peça e o trilho gira 90°; ligue a linha do centro a cada estação.
2. NOVO na 1.2: duelos ao vivo, liga semanal, mapa do metrô da cidade e 7 linhas novas (33 linhas com regras e fases mistas sem fim).
3. As fases rodam offline; duelos e liga precisam de conexão.

**Yerleşim notu:** Başlıkta "Quebra-Cabeça" + "Metrô". Uzun açıklamada "canos", "lógica", "raciocínio", "trem", "offline", "sem internet", "duelos ao vivo", "liga semanal"; "fases" (oyun bölümü) kullanımı Brezilya'da doğal.

### 3.7 Fransızca (fr-FR)

| Alan | Metin | Sayı |
|---|---|---|
| App Store ad | `Ray : Puzzle de Métro` | 21/30 |
| App Store alt başlık | `Relie les lignes, à une main` | 28/30 |
| App Store anahtar | `tuyaux,réseau,train,gare,logique,cerveau,quotidien,tourner,tuiles,carte,zen,ligue,duel,offline` | 94 karakter, 95/100 bayt |
| App Store tanıtım | Nouveau : duels en direct et ligue hebdo ! Tourne les rails, relie chaque station, finis parfait. 33 lignes, plan de métro de la ville et une Ligne du jour inédite. | 164/170 |
| Play başlık | `Ray : Puzzle de Métro` | 21/30 |
| Play kısa | Tourne les rails, relie chaque station. Un puzzle de métro calme, à une main. | 77/80 |

**Play uzun açıklama, ilk 3 satır önerisi** (görünen kısım; arkasından MAGAZA.md'deki "nasıl oynanır" gövdesi gelir, orada "24 hat/24 kural" ifadeleri 33'e güncellenmeli):

1. Ray est un puzzle de métro calme, à jouer d’une main. Touche une tuile et le rail tourne de 90° ; relie la ligne du centre à chaque station.
2. NOUVEAU en 1.2 : duels en direct, ligue hebdo, plan de métro de la ville et 7 nouvelles lignes (33 lignes à règles et niveaux mixtes sans fin).
3. Les niveaux se jouent hors ligne ; duels et ligue demandent une connexion.

**Yerleşim notu:** Başlıkta "Puzzle" + "Métro". "tuyaux", "casse-tête", "logique", "réflexion", "hors ligne", "duels en direct", "ligue hebdo" uzun açıklamada; tutoyer (tu) tonu mevcut metinle tutarlı.

### 3.8 Korece (ko-KR)

| Alan | Metin | Sayı |
|---|---|---|
| App Store ad | `Ray: 지하철 노선 퍼즐` | 14/30 |
| App Store alt başlık | `한 손으로 노선을 잇는 퍼즐` | 15/30 |
| App Store anahtar | `파이프,연결,기차,역,두뇌,논리,힐링,타일,회전,노선도,오프라인,리그,대결` | 41 karakter, 99/100 bayt |
| App Store tanıtım | 신규: 실시간 대결과 주간 리그! 선로를 돌려 모든 역을 잇고 퍼펙트로 깨 보세요. 33개 노선, 도시 노선도, 매일 새로운 오늘의 노선이 기다려요. | 83/170 |
| Play başlık | `Ray: 지하철 노선 퍼즐` | 14/30 |
| Play kısa | 선로를 돌려 모든 역을 이어요. 한 손으로 즐기는 차분한 지하철 퍼즐, 오프라인 가능. | 48/80 |

**Play uzun açıklama, ilk 3 satır önerisi** (görünen kısım; arkasından MAGAZA.md'deki "nasıl oynanır" gövdesi gelir, orada "24 hat/24 kural" ifadeleri 33'e güncellenmeli):

1. Ray는 한 손으로 즐기는 차분한 지하철 퍼즐이에요. 타일을 탭하면 선로가 90° 돌아가요. 허브역의 노선을 모든 역까지 이어 주세요.
2. 1.2 신규: 실시간 대결, 주간 리그, 도시 노선도, 새 노선 7개(규칙 노선 33개 + 끝없는 혼합 레벨).
3. 레벨은 오프라인으로 즐기고, 대결과 리그는 인터넷 연결이 필요해요.

**Yerleşim notu:** Başlık "지하철 노선 퍼즐". Kısa açıklamada 선로, 역, 한 손, 오프라인. Uzun açıklamada 두뇌 게임, 논리, 힐링, 파이프, 노선도, 실시간 대결, 주간 리그; Korece metinde kelime aralarındaki boşluk aramayı etkilediği için "지하철 노선도" gibi kalıplar bütün yazılsın.

### 3.9 Japonca (ja-JP)

| Alan | Metin | Sayı |
|---|---|---|
| App Store ad | `Ray: メトロ路線パズル` | 13/30 |
| App Store alt başlık | `片手でつなぐ、のんびり路線パズル` | 16/30 |
| App Store anahtar | `パイプ,電車,駅,脳トレ,ロジック,回転,タイル,癒し,オフライン,対戦,リーグ` | 40 karakter, 100/100 bayt |
| App Store tanıtım | 新登場：ライブ対戦と週間リーグ！線路を回して駅をつなぎ、パーフェクトを目指そう。33路線、街のメトロ路線図、毎日あたらしい「今日の路線」。 | 69/170 |
| Play başlık | `Ray: メトロ路線パズル` | 13/30 |
| Play kısa | 線路を回して、すべての駅をつなごう。片手でオフラインでも遊べる、落ち着いたメトロパズル。 | 44/80 |

**Play uzun açıklama, ilk 3 satır önerisi** (görünen kısım; arkasından MAGAZA.md'deki "nasıl oynanır" gövdesi gelir, orada "24 hat/24 kural" ifadeleri 33'e güncellenmeli):

1. Rayは、片手で遊べる落ち着いたメトロパズルです。タイルをタップすると線路が90°回ります。中央のハブ駅から、すべての駅へ路線をつなぎましょう。
2. 1.2の新機能：ライブ対戦、週間リーグ、街のメトロ路線図、新路線7本（ルール路線33本＋終わらない混合ステージ）。
3. ステージはオフラインで遊べます。対戦とリーグはネット接続が必要です。

**Yerleşim notu:** Ad "メトロ路線パズル". 簡単な説明 (Play 80) içinde 線路, 駅, 片手, オフライン; 長い説明 ilk 3 satırda 脳トレ ve 暇つぶし bağlamında "ひまつぶし/脳トレに" cümlesi, ライブ対戦, 週間リーグ. Japonca'da Play kısa açıklaması 80 karakterde gerçek sınır; kanji+kana karışık yazı.

### 3.10 Geleneksel Çince (zh-TW / zh-Hant)

| Alan | Metin | Sayı |
|---|---|---|
| App Store ad | `Ray: 地鐵路線解謎` | 11/30 |
| App Store alt başlık | `單手連線，輕鬆療癒` | 9/30 |
| App Store anahtar | `水管,火車,車站,燒腦,邏輯,旋轉,方塊,療癒,捷運,路線圖,離線,益智,聯賽,對戰` | 42 karakter, 100/100 bayt |
| App Store tanıtım | 全新：即時對戰與每週聯賽！轉動軌道、連起每個車站，挑戰完美過關。33 條路線、城市捷運路線圖，每天都有新的每日路線。 | 58/170 |
| Play başlık | `Ray: 地鐵路線解謎` | 11/30 |
| Play kısa | 轉動軌道，連起每個車站。單手也能玩的療癒地鐵解謎，關卡可離線遊玩。 | 33/80 |

**Play uzun açıklama, ilk 3 satır önerisi** (görünen kısım; arkasından MAGAZA.md'deki "nasıl oynanır" gövdesi gelir, orada "24 hat/24 kural" ifadeleri 33'e güncellenmeli):

1. Ray 是一款單手就能玩的輕鬆地鐵解謎遊戲。點一下方塊，軌道就轉 90°；把路線從中央樞紐連到每一個車站。
2. 1.2 新功能：即時對戰、每週聯賽、城市捷運路線圖與 7 條新路線（共 33 條規則路線＋無限混合關卡）。
3. 關卡可離線遊玩；對戰與聯賽需要網路連線。

**Yerleşim notu:** Ad "地鐵路線解謎". 簡短說明 (80) içinde 軌道, 車站, 單手, 離線; 完整說明 ilk 3 satırda 療癒/燒腦, 即時對戰, 每週聯賽, 城市捷運路線圖. Tayvan terimi 捷運 uzun açıklamada en az 2 kez.

Not (App Store): alt başlık "internetsiz" yerine tür/eylem sözcüğü taşır; "internetsiz/offline" anahtar alanındaki "offline" (ve ko "오프라인", ja "オフライン", zh "離線") ile aranır, açıklamada ise bölümlerin internetsiz olduğu açıkça yazılır. App Store açıklamasının girişi Play uzun açıklama girişiyle aynı kullanılabilir.

## 4. Ekran görüntüleri

Mevcut 7 sahne (`store/screens*/`): 01-oyun, 02-ana, 03-kazan, 04-harita, 05-kural, 06-tema, 07-sandik. Üretim: `node tools/store-shots.cjs` (başlıklar `TX` tablosunda). App Store arama sonuçlarında ilk 3 dikey görsel (özellikle ilk) görünür; Play'de ilk 2-3 görsel kaydırmadan önce görülür. Bu yüzden ilk üçe 1.2'nin en güçlü kancaları konur.

### 4.1 Önerilen sıra (Play 8, App Store 8-10)

| # | Sahne | Başlık (tr) | Başlık (en) | Durum |
|---|---|---|---|---|
| 1 | Oynanış (01-oyun) | Dokun, döndür, hattı yak | Tap, turn, light the line | Mevcut görsel kullanılır; yalnız alt satır güncellenir |
| 2 | Canlı kapışma (rakip + iki tahta, sayaç) | Canlı kapışmada yarış | Race in live duels | YENİ çekim |
| 3 | Şehir metro haritası (açılış töreni sonrası, yanan şehir) | Hatlarınla şehri büyüt | Grow your city metro map | YENİ çekim |
| 4 | Haftalık lig sıralaması | Haftalık ligde yüksel | Climb the weekly league | YENİ çekim |
| 5 | Hat haritası, M33 görünür (04-harita) | 33 hat, sonu gelmeyen bölüm | 33 lines, endless levels | Yeniden çek: eski başlık "24 kural" yanlış |
| 6 | Kural kartı (05-kural; yeni hat: ekspres durak ya da sinyal) | Hat ilerledikçe yeni kurallar | New rules as the line grows | Yeniden çek: 1.2 hatlarından biri |
| 7 | Kusursuz bitir (03-kazan) | Kusursuz bitir, bilet kazan | Finish perfect, earn tickets | Mevcut |
| 8 | Ana ekran / Günün Hattı (02-ana) | Her gün yeni Günün Hattı | A new Daily Line every day | Mevcut (seri sayısı güncel, sakin) |
| 9 (yalnız App Store) | Temalar + sandık (06-tema/07-sandik birleşik) | Bilet topla, tema aç | Collect tickets, unlock themes | Mevcut (06 veya 07 biri yeter) |

İlk görsel gerekçesi: bulmaca kategorisinde ilk karede oyunun ne olduğunu göstermek şart; kapışma ve şehir haritası 2-3. sıraya konur. A/B testi (bkz. 5) "1. görsel = kapışma" varyantını ölçer. Yalnız gerçekten oyunda olan ekran gösterilir; sahte rakip ismi/puanı, uydurma yorum kullanma.

### 4.2 Üst başlık metinleri (yeni olanlar, 9 dil)

Yeni/değişen başlıklar: 2 kapışma, 3 şehir haritası, 4 lig, 5 33 hat, 8 Günün Hattı. 1, 6, 7, 9 mevcut çevirileri `tools/store-shots.cjs` TX tablosunda; 6 dilde (de, es, pt-BR, fr, ko, ja, zh) 2-5 ve 8 ilk kez eklenir. Başlık en çok ~28 karakter olmalı (Play 1080 genişlik, iki satıra bölünür).

| Dil | 2 Kapışma | 3 Şehir haritası | 4 Lig | 5 33 hat | 8 Günün Hattı |
|---|---|---|---|---|---|
| tr | Canlı kapışmada yarış | Hatlarınla şehri büyüt | Haftalık ligde yüksel | 33 hat, sonu gelmeyen bölüm | Her gün yeni Günün Hattı |
| en | Race in live duels | Grow your city metro map | Climb the weekly league | 33 lines, endless levels | A new Daily Line every day |
| de | Live-Duelle spielen | Bau deine Metro-Stadt aus | Steig in der Wochenliga auf | 33 Linien, endlose Level | Jeden Tag eine Tageslinie |
| es | Duelos en vivo | Haz crecer tu ciudad | Sube en la liga semanal | 33 líneas, niveles sin fin | Una Línea del día nueva |
| pt | Duelos ao vivo | Faça sua cidade crescer | Suba na liga semanal | 33 linhas, fases sem fim | Uma Linha do Dia nova |
| fr | Duels en direct | Fais grandir ta ville | Grimpe dans la ligue | 33 lignes, niveaux sans fin | Une Ligne du jour inédite |
| ko | 실시간 대결 | 노선으로 도시를 키우세요 | 주간 리그에서 올라가요 | 33개 노선, 끝없는 레벨 | 매일 새로운 오늘의 노선 |
| ja | ライブ対戦 | 路線で街を育てよう | 週間リーグで上を目指そう | 33路線、終わらないステージ | 毎日あたらしい今日の路線 |
| zh | 即時對戰 | 用路線讓城市成長 | 在每週聯賽往上爬 | 33 條路線，無限關卡 | 每天一條新的每日路線 |

### 4.3 Mevcut görsellerden hangisi kullanılır

- **Aynen kullanılır (görsel değişmez, yalnız yeni sıraya girer):** 03-kazan, 02-ana (ana ekrandaki seri/Günün Hattı güncel olmalı), 06-tema, 07-sandik. Ana ekran görüntüsünde alt sekme çubuğu 1.2'de değişti (emoji'li yeni çubuk); 02-ana ve 06/07 eski çubukla çekildiyse yeniden çek (1.1 görseli 1.2 arayüzünde farklı görünür; kullanıcıyı yanıltmamak için).
- **Yeniden çekilmeli:** 04-harita (başlık "24 kural" ve harita M33'ü göstermeli), 05-kural (1.2 hatlarından biri), 01-oyun alt satırı ("24 kural" geçiyorsa).
- **Yeni çekilmeli:** kapışma, lig, şehir haritası/açılış töreni (3 sahne). Öğretici ilk açılış ekranı için ayrı görsel gerekmez; açıklamada anlatılır. `tools/store-shots.cjs`'e 08-kapisma, 09-lig, 10-sehir sahneleri eklenmeli; kapışma/lig ekranları gerçek (veya test) veriyle çekilir, takma ad uydurma görünürse gerçek kullanıcı gibi sunulmamalı.
- Öne çıkan grafik (feature-graphic): rozetler "Tek elle, İnternetsiz, Metro bulmacası" kalır; ama "İnternetsiz" rozeti için ayrım gerekmez (grafik mağaza dışı bağlamda kullanılmaz); 1.2 sonrası üçüncü rozeti "Canlı kapışma" ile değiştirmek test edilebilir.
- iPad: `store/screens/ios-ipad13` var ama oyun yalnız iPhone (MAGAZA.md §1); iPad görseli yüklenmez.

## 5. A/B test planı

Genel kural: aynı anda tek test, tek değişken; her test en az 7 gün (haftanın günü etkisi için tam hafta katları); Play'de varyant başına en az ~1.000 mağaza ziyaretçisi / ~100 yükleme hedeflenir, App Store'da PPO araç güveni %90 gösterir. Düşük trafikte (günlük <200 ziyaret) test uzar; bu durumda 1-2 değişiklik tek sıralı denemeye (önce/sonra) çevrilir ve sezon etkisi notlanır.

### 5.1 Google Play Store Listing Experiments (Console › Mağaza girişi denemeleri)

Play 1 varsayılan yerelde 1 deneme, ayrıca yerelde başka deneme yürütebilir. Metin ve grafik varyantları test edilir; ad testte değişmez. **İlk deneme tr-TR (öncelikli pazar) varsayılan yerelinde yürütülür**; en ve diğer diller trafik yetersizse (günlük <100 ziyaret) test edilmez, tr kazananı uyarlanır.

| Sıra | Test | Hipotez | Varyant | Metrik | Süre | Min. trafik | Karar kuralı |
|---|---|---|---|---|---|---|---|
| P1 (tr-TR) | İlk görsel | Kapışma ilk karede oynanıştan daha çok indirme getirir | A: 01-oyun · B: 02-kapışma (diğerleri aynı sıra) | İlk kez yükleyen / mağaza ziyaretçisi | 14 gün | 1.000 ziyaretçi/varyant | Güven aralığı sıfırı geçmiyorsa ve ≥%5 üstündeyse B; belirsizse A'yı koru |
| P2 | Kısa açıklama | "Sakin, tek elle" tonu "kapışma + lig" özelliğinden daha fazla indirme getirir | A: Rayları döndür… sakin metro bulmacası · B: Rayları döndür… canlı kapışma ve haftalık lig | Yükleme dönüşümü | 14 gün | 1.000/varyant | ≥%3 fark ve %90 güven |
| P3 | Öne çıkan grafik | "Canlı kapışma" rozeti "İnternetsiz" rozetinden iyi | A: mevcut feature-graphic · B: rozet 3'ü "Canlı kapışma" | Yükleme dönüşümü | 14 gün | 1.000/varyant | ≥%3 fark |
| P4 | Ekran görüntüsü başlık dili | Kısa eylem başlığı (Dokun, döndür) mı fayda başlığı (Şehri büyüt) mı | A: eylem başlıkları · B: fayda başlıkları (tüm görseller) | Yükleme dönüşümü | 14 gün | 1.500/varyant | ≥%5 fark |

Sıra: P1 → P2 → P3 → P4, hepsi önce tr-TR'de. Küçük pazarda trafik düşükse süre 21-28 güne uzar. Kazanan uygulanır, sonraki test kazanan üzerine kurulur. Play yalnız kısa/uzun açıklama ve görsel değişkenini destekler; başlık (ad) değişmez.

### 5.2 App Store Product Page Optimization (App Store Connect › Ürün Sayfası Optimizasyonu)

PPO yalnız ikon, ekran görüntüleri ve önizleme videosunu test eder (metin, ad, alt başlık, anahtar kelime test edilmez). En fazla 3 varyant (+ orijinal), 90 güne kadar, yayınlanmış sürümde ve onaydan geçmiş varlıklarla; yerelleştirme başına ayrı. İlk test tr-TR (öncelikli pazar); en ve diğer diller sonra, organik trafikle.

| Sıra | Test | Hipotez | Varyant | Metrik | Süre | Min. trafik | Karar kuralı |
|---|---|---|---|---|---|---|---|
| A1 (tr-TR) | Ekran görüntüsü sırası | Kapışma/şehir haritası ilk 3'te dönüşümü artırır | Orijinal · V1: 1 oynanış,2 kapışma,3 şehir · V2: 1 kapışma,2 oynanış,3 lig | Dönüşüm oranı (indirme/gösterim) | 14-21 gün | ~5.000 ürün sayfası gösterimi/varyant (App Store Connect güven göstergesi ≥%90) | ≥%90 güvenle en yüksek varyant; fark <%2 ise orijinal |
| A2 | İkon | Sıcak (turuncu L ray) mevcut ikon ile alternatif arka plan | Orijinal · V1: daha parlak merkez istasyon | Dönüşüm oranı | 21 gün | 5.000 gösterim/varyant | %90 güven + ≥%3 |
| A3 | Önizleme videosu | 15-20 sn oynanış videosu dönüşümü artırır (ses kapalı, altyazılı) | Orijinal (video yok) · V1: oynanış + kapışma videosu | Dönüşüm + oynatma oranı | 21 gün | 5.000 gösterim/varyant | %90 güven; yoksa videoyu çıkar (yükleme yavaşlatmasın) |
| A4 | Başlık stili | Eylem başlığı vs fayda başlığı (P4 ile tutarlı) | Orijinal · V1: fayda | Dönüşüm oranı | 14-21 gün | 5.000/varyant | Play P4 sonucuyla çelişirse App Store kendi kazananını kullanır |

Sıra: A1 → A2 → A3 → A4, hepsi önce tr-TR'de; (Play P1-P4 ile paralel, ama aynı dönemde aynı varlığı iki mağazada aynı anda değiştirme; sonuçlar mağazaya özgüdür). Tüm testlerde mevsimsellik (okul tatili, Kasım-Aralık indirme artışı) notlanır; Kasım sonu/Aralık yoğun dönemde sonuçlar iyimser çıkabilir.

## 6. Yerelleştirme, puan/güncelleme ve öne çıkarma

### 6.1 Pazar notları

- **Korece (ko-KR):** "지하철" baskın terim; mobil bulmaca/두뇌 게임/힐링 kategorisi çok rekabetçi. Karakter başına 3 bayt: anahtar alanı yalnız 33 karakter. Metin yumuşak ("-요") tonda kalmalı (mevcut metin tutarlı). Kakao/Naver mağaza etkisi yok; Play ağırlığı yüksek (Android baskın). Büyük metin ve kontrast ekran görüntülerinde önemli.
- **Japonca (ja-JP):** "脳トレ", "暇つぶし", "癒し" aramaları güçlü; "メトロ" yerine "電車/路線" daha doğal arama olabilir (alt başlıkta 路線). Japon mağazası ikon/görsel estetiği ve ayrıntılı ("丁寧") metin bekler; kısa açıklama 80'de dolu bir cümle. Apple'da keyword bayt sınırı ja için ~33 karakter.
- **Geleneksel Çince (zh-Hant):** Tayvan/Hong Kong hedeflenir; Tayvan'da "捷運", Hong Kong'da "地鐵". Ad "地鐵" (HK genel), anahtar alanında 捷運. Yazı tipi/görsel zh-Hant harf biçimleriyle; Basitleştirilmiş Çince (zh-Hans) bu sürümde yok; Çin anakarası Google Play dışı pazar ve ayrı yayın izni (ISBN/lisans) gerektirdiği için planlanmaz.
- **de/es/pt/fr:** Alman pazarında "Rätsel/Denkspiel", İspanyolcada subte/metro farkı, Brezilya'da "fases", Fransızcada "hors ligne" ve "casse-tête". es-419 aynı metin, Meksika için ayrı mağaza yerelinde "juegos sin internet" tercih edilebilir.
- Tüm dillerde "Günün Hattı", "kapışma", "lig" oyun içi terimlerle birebir aynı (docs/CEVIRI.md §3) olmalı.

### 6.2 Yorum, puan ve güncelleme sıklığı

- Puan görünürlüğü: App Store sonuçlarında ve Play'de ≥4,0 yıldız dönüşümü belirgin artırır; 1.2 ile ilk puan istemi **kusursuz seri / hat bitişi** gibi olumlu bir andan sonra, günde en fazla bir kez, ilk 5. bölümden sonra gösterilmeli (zorlayıcı değil, ödül vermeden; Apple/Play sistem istemi kullanılır, yorum karşılığı ödül yok). Mevcut kodda puan istemi varsa tetik koşulu bu şekilde gözden geçirilsin.
- Yorumlara yanıt: ilk 30 günde tüm 1-3 yıldızlı yorumlara (Play Console, App Store Connect) 48 saat içinde yanıt; Play'de yanıt güncellenen yorumları sıklıkla yükseltir. Yaygın şikayetler (reklam sıklığı, internet) ürün listesine alınmalı.
- Güncelleme sıklığı: Play ve App Store yeni/güncel uygulamaları tercih eder; 4-6 haftada bir içerik güncellemesi (yeni hat, etkinlik), her güncellemede "yenilikler" metni 9 dilde. Haftalık Günün Hattı ve lig ek geri dönüş sağlar (haftalık aktif kullanıcı oranı ASO sinyalidir). Hata düzeltmeleri hızlı yayınlanır (çökme oranı Play Vitals eşiği %1,09, ANR %0,47 altında kalmalı).
- Tanıtım metni (170) sürüm göndermeden değişir: kampanya/etkinlik (hafta etkinliği, yeni hat) ile 2-4 haftada bir yenilenir. Play'de "Güncel gelişmeler" (LiveOps / Öne Çıkan Etkinlik) ayrı kanal.

### 6.3 Öne çıkarma başvuruları

**App Store (Featuring Nomination):** App Store Connect › Uygulamam › "Öne Çıkarma Önerisi / Featuring Nominations" bölümünden form; yeni sürüm veya yeni içerik/etkinlik (1.2: canlı kapışma, haftalık lig, şehir haritası) için **en az 3-4 hafta önceden**, sürüm yayında olmadan önce gönderilir. Alanlar: uygulama hakkında kısa özet, yeni olan, hedef tarih, yerel pazarlar (tr, ko, ja, zh-TW özellikle), erişilebilirlik ve yerelleştirme özeti, ekran görüntüleri/videolar. Öneri: "Yeni içerik" olarak 1.2'yi ve yaz-kış "mevsimlik" etkinlik planını göster. Apple editör ekibi sevecen sakin, sade ve yerel pazar başarısına bakar. Bağımsız geliştirici için "Today/Games" olasılığı düşük ama sıfır maliyet; her büyük sürümde yinele.

**Google Play (Öne Çıkanlar):** Play Console › Mağaza varlığı › "Öne çıkarma/Promote" (Play Store feature nomination) ve "Güncel gelişmeler" (LiveOps) ile etkinlik gönderimi; Android vitals iyi (çökme %<1), 64-bit, hedef API güncel, yüksek çözünürlüklü görsel (feature graphic 1024x500, 7+ ekran görüntüsü, tablet/katlanabilir uyum) olmalı. 21 Kasım üretim yayınından sonra puan ≥4,2 ve yeterli kurulum sonrası başvuru; yeni içerikte ("Haftalık lig sezonu başladı") LiveOps etkinliği açılır. Play "Yerel Öne Çıkan" için Türkiye ve Güney Kore ofislerine ulaşan form; kısa pitch, 3 ekran görüntüsü ve 30 sn video bağlantısı ekle.

Dürüst ton: Apple/Google editörleri "en iyi" iddiası görmez; farklılaştırıcı olarak "tek elle, sakin, 33 hatlık metro bulmacası, canlı kapışma" yeterlidir.

