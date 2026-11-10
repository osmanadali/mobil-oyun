# Yerelleştirme (9 dil)

Oyun Türkçe, İngilizce, Almanca, İspanyolca, Portekizce (Brezilya), Fransızca, Korece, Japonca ve Geleneksel Çince oynanır (son üçü 1.1 ile, §1c). Bu belge altyapıyı ve ortak sözlüğü anlatır; iki dildeki metinlerin tutarlı kalması için yeni metin yazan herkes buraya bakar.

## 1. Altyapı (`www/i18n.js`)

- `i18n.js` bütün betiklerden önce yüklenir ve iki küresel ad tanımlar:
  - `RAY_LANG`: `'tr'`, `'en'`, `'de'`, `'es'`, `'pt-BR'`, `'fr'`, `'ko'`, `'ja'` ya da `'zh-Hant'` (öteki diller: §1b, §1c).
  - `L(tr, en)`: seçili dildeki metni döndürür. Örnek: `L('İpucu', 'Hint')`, `` L(`${n} hamle`, `${n} moves`) ``.
- **Dil seçimi:** kayıtta `save.lang` varsa o kullanılır. Yoksa cihaz dili okunur: `tr`, `de`, `es`, `pt`, `fr` ile başlıyorsa o dil, öteki her dilde İngilizce.
- **Dil değişince sayfa yenilenir.** Metinler yüklemede bir kez seçilir; bu yüzden kural kartları gibi yükleme anında kurulan nesnelerde `L()` doğrudan kullanılabilir.
- **Durağan HTML** (`index.html`): Türkçe metin yerinde kalır, İngilizcesi özniteliğe yazılır.
  - `data-en="…"` → öğenin yazısı (`textContent`); öğenin içinde başka öğe varsa yazı ayrı bir `<span>`'e alınır.
  - `data-en-label="…"` → `aria-label`, `data-en-title="…"` → `title`.
- **Robot:** `tools/hakem.cjs` bütün tarayıcı bağlamlarını `locale: 'tr-TR'` ile açar, yani testler varsayılan olarak Türkçe koşar. İngilizce testi bağlamı `locale: 'en-US'` ile açar.
- **Bölüm üretimi dile bağlı değildir.** `L()` rastgele sayı tüketmez; çeviri bölümleri bit bit aynı bırakır.

## 1b. Öteki diller: Almanca, İspanyolca, Portekizce (Brezilya), Fransızca

- **Dil kodları:** `RAY_LANG` = `tr` · `en` · `de` · `es` · `pt-BR` · `fr`. Cihaz dili `de…`, `es…`, `pt…` (pt-PT de Brezilya Portekizcesine düşer), `fr…` ise o dil; desteklenmeyen her dil İngilizce. Ayarlar › Dil seçicisi 6 dili kendi adıyla gösterir (`RAY_LANGS`, 3×2 ızgara).
- **Sözlük, anahtar İngilizce metin:** `L(tr, en)` imzası değişmedi. `de/es/pt-BR/fr`'de `L` İngilizce metni sözlükte arar; bulamazsa İngilizce gösterir (ve `window.__L_MISS`'e yazar, robot bunu denetler). Durağan HTML'de `data-en` değeri de aynı sözlükten çevrilir.
- **Yer tutucular:** `${}` içeren metinler için çağrıları değiştirmek yerine kalıp anahtarı kullanılır. `tools/diller.cjs` kaynağı tarar, şablondaki her `${…}`'yi sırayla `{0}`, `{1}`… yapar: `` L(`${n} hamle geri alındı`, `↶ ${k} ${pl(k, 'move', 'moves')} undone`) `` → anahtar `↶ {0} {1} undone`. Çeviri yer tutucuları istediği sırada kullanabilir (`Ray 🚇 Daily Line {0}/{1}` → de `… {1}.{0}.`) ya da düşürebilir. Çalışırken `i18n.js` hazır İngilizce metni kalıplarla eşler (en uzun sabit metinli kalıp önce) ve yakalanan parçaları da sözlükten geçirir: `pl()` ile gelen `moves` gibi tekil/çoğul sözcükler böylece çevrilir (`move` → `Zug`, `moves` → `Züge`).
  - **Neden bu yol:** ~500 çağrıyı elle `L('{n} bölüm', '{n} levels', { n })` biçimine dönüştürmek hem büyük, hem hataya açık bir değişiklik olurdu ve aynı anda çalışılan dosyalarla çakışırdı. Kalıp anahtarları kaynaktan otomatik çıkar, Türkçe/İngilizce davranış bit bit aynı kalır, yeni metin yazan kişi alışık olduğu `L(tr, en)`'i yazmaya devam eder; çeviri eksiği `node tools/diller.cjs` ve robotla hemen görünür. Bedeli: kalıp eşleme sözlükte bulunmayan metinde birkaç yüz düzenli ifade dener (sonuç önbelleğe alınır; ölçülebilir yük yok).
- **Kaynak ve üretim:** çeviriler `tools/diller/sozluk-*.txt`'te, anahtar bir kez yazılır, ardından dört dil:
  ```text
  @ ↶ {0} {1} undone
  de: ↶ {0} {1} zurückgenommen
  es: ↶ {0} {1} deshechas
  pt: ↶ {0} {1} desfeitas
  fr: ↶ {0} {1} annulés
  ```
  Boşluklar tek boşluğa sıkıştırılır (çok satırlı HTML anahtarı tek satır yazılır); satır sonundaki boşluk `␣` ile yazılır. Fransızcada `: ; ! ? »` önüne bölünmez boşluk derleyici ekler. `node tools/diller.cjs` sözlükleri `www/lang/<dil>.js` olarak üretir, eksik ve artık anahtarı listeler (eksik varsa çıkış kodu 1). Üretilen dosya elle düzenlenmez.
- **Yalnız seçili dilin sözlüğü yüklenir:** `i18n.js` seçili dil `de/es/pt-BR/fr` ise `lang/<dil>.js`'yi `document.write` ile eşzamanlı ekler (sonraki betikler yüklenirken sözlük hazırdır; tr/en'de hiçbir sözlük yüklenmez). Dört sözlük `sw.js` önbelleğindedir (çevrimdışı dil değişimi için). Web paketi boyut ölçümü (`hakem.cjs` I bölümü) sözlükleri ayrı sayar: oyuncu yalnız birini indirir.
- **Yeni metin yazarken:** `L(tr, en)` yaz, sonra `node tools/diller.cjs --skeleton` eksik anahtarları boş kalıp olarak döker; uygun `sozluk-*.txt`'e ekle, `node tools/diller.cjs` çalıştır. `L(tr, değişken)` gibi değişkenle çağıran yardımcıyı (ör. ayarlardaki `opt`) `tools/diller.cjs` `WRAP` listesine ekle.
- **Sayı, tarih, büyük harf:** tarih `toLocaleDateString(LOC)` (`LOC = RAY_LOCALE`: tr-TR, en-US, de-DE, es-ES, pt-BR, fr-FR; cihaz aynı dilde başka bölgedeyse onunki, ör. es-MX), yüzde `LP(n)` (`%30` · `30%` · `30 %`), büyük harf `toLocaleUpperCase(RAY_LANG)`.
- **Hat adı:** `M1 · Liman Hattı` / `M1 · Harbor Line` / `M1 · Linie Hafen` / `M1 · Línea Puerto` / `M1 · Linha Porto` / `M1 · Ligne Port`. 26. hattan sonraki önekler: Almancada tireli önek (`Neu-Hafen`, `Nord-…`), İspanyolca/Portekizce/Fransızcada adın ardından, cinsiyetle değişmeyen sözcük (`Puerto Norte`, `Porto Central`, `Port d’Antan`); bu yüzden "New/Old/Upper…" bu dillerde bilerek serbest çevrilir.
- **Robot:** `tools/hakem/diller.cjs` (K bölümü; tek başına `node tools/hakem.cjs --only=diller`): sözlükler eksiksiz ve güncel; cihaz dili ve dil seçici; dört dilde 320 px'te açılış, ana sayfa, ayarlar, mağaza, görevler, renk temaları, Hatlar, oyun, kazanma paneli ve 24 kural kartı — Türkçe harf, sözlükte bulunamayan metin, ekranda İngilizce sözcük, taşma ve iki satıra bölünen düğme yok; tarih/yüzde/hat adı biçimi.

## 1c. Korece, Japonca, Geleneksel Çince (1.1)

- **Dil kodları:** `ko`, `ja`, `zh-Hant` (sözlük satırında `ko:`, `ja:`, `zh:`). Cihaz dili `ko…` → Korece, `ja…` → Japonca; `zh-Hant…`, `zh-TW`, `zh-HK`, `zh-MO` → Geleneksel Çince. **Basitleştirilmiş Çince (`zh-CN`, `zh-Hans`, `zh-SG`) bilerek İngilizceye düşer**: Geleneksel Çince metin anakara kullanıcısına verilmez. Ayarlar › Dil seçicisi 9 dili 3×3 ızgarada gösterir (한국어 · 日本語 · 繁體中文).
- **Tarih ve sayı:** `RAY_LOCALE` ko-KR, ja-JP, zh-TW (Hong Kong/Makao cihazında zh-HK/zh-MO); `LP(30)` üçünde de `30%`. Tarih `1월 5일` · `1月5日` · `1月5日`.
- **Yazı tipi:** Outfit'te CJK harfi yok. `style.css` ve `gizlilik.html` dile göre sistem yazı tipine düşer: ko Apple SD Gothic Neo / Noto Sans KR, ja Hiragino Sans / Noto Sans JP, zh-Hant PingFang TC / Noto Sans TC; Latin harf ve rakam Outfit'te kalır. `<html lang>` dili taşıdığı için Han harfleri doğru biçimde (Japonca/Geleneksel) çizilir. Korecede `word-break: keep-all` (sözcük ortasından bölünmez).
- **Yer tutucular:** Bu dillerde tekil/çoğul yok; `pl()` ile gelen sözcük yer tutucusu genelde düşürülür, sayaç cümleye yazılır: `↶ {0} {1} undone` → `↶ {0}번 이동 되돌림` · `↶ {0}手戻しました` · `↶ 已復原 {0} 步`. `move`/`moves` gibi tek sözcükler yine çevrilir (yalnız kalıp dışında kullanıldıkları yerler için).
- **Hat adı:** önek bitişik tek hecedir (`PRE_JOIN`): `M31 · 신다리선` · `M31 · 新橋線` · `M31 · 新橋樑線`; "Hat" → ko `선`, ja/zh `線`.
- **Hitap ve üslup:** ko 해요체 (düğmeler ad biçiminde: 다시 시작, 공유), ja です/ます ve kısa düğme adları (やり直し, シェア), zh-Hant Tayvan kullanımı ve `你` (資料, 設定, 影片). Noktalama: ja/zh tam genişlik `。、！？：`, ko Latin noktalama.
- **Terim listesi:** `tools/diller/sozluk-1.txt` başında. Öne çıkanlar:

| İngilizce | Korece | Japonca | Geleneksel Çince |
|---|---|---|---|
| Ray · Metro Puzzle | Ray · 지하철 퍼즐 | Ray · メトロパズル | Ray · 地鐵解謎 |
| level | 레벨 | ステージ | 關卡 (Level 12 = 第 12 關) |
| line · Daily Line | 노선 · 오늘의 노선 | 路線 · 今日の路線 | 路線 · 每日路線 |
| tile · track · station · hub | 타일 · 선로 · 역 · 허브 | タイル · 線路 · 駅 · ハブ | 方塊 · 軌道 · 車站 · 樞紐 |
| move · target · hint · star | 이동 · 목표 · 힌트 · 별 | 手 · 目標 · ヒント · 星 | 步 · 目標 · 提示 · 星 |
| ticket 🎫 | 티켓 | 切符 | 車票 |
| perfect · streak | 퍼펙트 · 연속 기록 | パーフェクト · 連続記録 | 完美 · 連續紀錄 |
| last stop · last train · late | 종점 · 막차 · 지연 | 終点 · 終電 · 遅延 | 終點站 · 末班車 · 誤點 |
| life ❤️ · booster | 하트 · 부스터 | ライフ · ブースター | 生命 · 道具 |
| quests · surprise chest | 미션 · 깜짝 상자 | ミッション · びっくり宝箱 | 任務 · 驚喜寶箱 |
| Shop · Settings · Play | 상점 · 설정 · 플레이 | ショップ · 設定 · プレイ | 商店 · 設定 · 開始 |
| Move progress | 진행 상황 옮기기 | データ引き継ぎ | 轉移進度 |
| New: … | 새 규칙: … | 新ルール：… | 新規則：… |

**Kural adları**

| Hat | İngilizce | Korece | Japonca | Geleneksel Çince |
|---|---|---|---|---|
| M3 | Paired tiles | 짝 타일 | ペアタイル | 成對方塊 |
| M4 | Reverse tile | 역회전 타일 | 逆回転タイル | 反轉方塊 |
| M5 | Sliding row | 가로 슬라이드 | 横スライド | 橫向滑動 |
| M6 | Dark tunnel | 어두운 터널 | 暗いトンネル | 黑暗隧道 |
| M7 | Counter tile | 카운터 타일 | カウンタータイル | 計數方塊 |
| M8 | Cooling tile | 얼음 타일 | 凍るタイル | 結冰方塊 |
| M9 | Two hubs | 두 허브 | ふたつのハブ | 雙樞紐 |
| M10 | Switch | 전환기 | 分岐器 | 轉轍器 |
| M11 | Sealed tile | 봉인 타일 | 封印タイル | 封印方塊 |
| M12 | Turntable | 회전대 | 転車台 | 轉車台 |
| M13 | Bridge | 다리 | 橋 | 橋樑 |
| M14 | Gear tile | 톱니 타일 | 歯車タイル | 齒輪方塊 |
| M15 | Cover | 덮개 | カバー | 蓋板 |
| M16 | Tunnel portal | 터널 입구 | トンネル口 | 隧道口 |
| M17 | Signpost | 표지판 | 標識 | 路標 |
| M18 | Loop line | 순환선 | 環状線 | 環狀線 |
| M19 | Faint arm | 흐릿한 가지 | 淡い枝 | 淡色分支 |
| M20 | Hidden depot | 숨은 차고 | 隠れ車庫 | 隱藏車庫 |
| M21 | Wrap-around board | 끝없는 보드 | 端のない盤面 | 無邊盤面 |
| M22 | River | 강 | 川 | 河流 |
| M23 | Closed station | 폐쇄역 | 閉鎖駅 | 封閉車站 |
| M24 | Fare zone | 요금 구역 | 運賃ゾーン | 票價區 |
| M25 | Timed station | 시간제한 역 | 時限駅 | 限時車站 |
| M26 | Sliding column | 세로 슬라이드 | 縦スライド | 縱向滑動 |

- **Gözden geçirme:** çeviriler yayından önce anadili konuşan birine okutulmalı (Korece için kullanıcının Koreli arkadaşı). Robot (`--only=diller`) eksik/İngilizce kalan metni ve 320 px taşmayı yakalar, dil doğruluğunu denetlemez.

## 2. Yazım ilkeleri

- İngilizce metin Türkçe kadar kısa ve sakin olmalı. Düğme ve çip yazıları dar alanlara sığmalı; uzun gelirse kısaltılır, yazı küçültülmez.
- Sayılı ifadelerde tekil/çoğul ayrılır: `1 move`, `2 moves`. Yardımcı: `n === 1 ? 'move' : 'moves'`.
- Türkçe ekler (`'i`, `'e`, `-si`) İngilizcede kaldırılır; cümle yeniden kurulur, kelime kelime çevrilmez.
- Tarihler `toLocaleDateString(LOC, …)` (`LOC = RAY_LOCALE`), yüzde `LP(n)`, büyük harf `toLocaleUpperCase(RAY_LANG)` ile yazılır.
- Simgeler (★, 🎫, ⏱, ↻, 🔥) iki dilde aynıdır.

## 3. Sözlük

### Temel kavramlar

| Türkçe | İngilizce |
|---|---|
| Ray (oyunun adı) | Ray |
| Metro bulmaca | Metro puzzle |
| Hatları bağla · Şehri canlandır | Connect the lines · Light up the city |
| bölüm | level |
| hat | line |
| Günün Hattı | Daily Line |
| karo | tile |
| ray | track |
| durak | station |
| merkez | hub |
| kol (karonun açık yönü) | arm |
| hamle | move |
| hedef (hamle hedefi) | target |
| ipucu | hint |
| yıldız (★) | star |
| bilet (🎫; eski adı taç 👑, kodda `crowns`) | ticket |
| kusursuz | perfect |
| kusursuz seri (✨; günlük seri 🔥 ayrıdır) | perfect streak |
| seri (günlük) | streak |
| seri kalkanı (🛡) | streak shield |
| sefer şeridi | trip bar |
| son durak (hat finali) | last stop |
| renk temaları | color themes |
| tren kaplaması | train livery |
| sürpriz sandık | surprise chest |
| Sıradan · Nadir · Destansı | Common · Rare · Epic |
| sınırsız can (❤️∞) | unlimited lives |
| can (❤️) · canın kalmadı | life · out of lives |
| sıradaki can | next life |
| son süre · son tren (🚉) | last train |
| Son tren kaçtı | The last train left |
| Tekrar dene | Try again |
| haftalık görevler (🎯) | weekly quests |
| görev tamam | quest done |
| ipucusuz | without hints |
| güçlendirici | booster |
| geçmiş gün · geçmiş günler | past day · past days |
| Günün Hattı arşivi | Daily Line archive |
| haftanın kuralı | rule of the week |
| Reklamsız paket | Ad-free pack |
| Mağaza | Shop |
| Tema paketi | Theme pack |
| Güçlendirici paketi | Booster pack |
| İpucu paketleri | Hint packs |
| Bilet paketi · 50 bilet | Ticket pack · 50 tickets |
| Başlangıç paketi | Starter pack |
| Özel teklif | Special offer |
| Hayır, teşekkürler | No, thanks |
| sınırsız can | unlimited lives |
| ızgara | grid |
| Oyna | Play |
| Nasıl oynanır? | How to play? |
| Ayarlar | Settings |
| Gizlilik | Privacy |
| Verilerimi sil | Delete my data |
| Şehir (haritası) | City (map) |
| semt · yanan semt · altın semt | district · lit district · golden district |
| rozet · Rozetler · YENİ ROZET | badge · Badges · NEW BADGE |
| Zen modu (🍃) | Zen mode |
| mevsim teması | seasonal theme |
| Ücretsiz | Free |

### Dört dilin sözlüğü

Oyun dili: kısa, sıcak, "sen/du/tú/você/tu" ile. "Ray" adı hiçbir dilde çevrilmez. Simgeler (★, 🎫, ⏱, ↻, 🔥, ✨, 💡) her dilde aynıdır.

| Türkçe | İngilizce | Almanca | İspanyolca | Portekizce (BR) | Fransızca |
|---|---|---|---|---|---|
| Ray · Metro Bulmaca | Ray · Metro Puzzle | Ray · Metro-Rätsel | Ray · Puzle de metro | Ray · Quebra-cabeça do metrô | Ray · Puzzle de métro |
| bölüm | level | Level | nivel | fase | niveau |
| hat | line | Linie | línea | linha | ligne |
| Günün Hattı | Daily Line | Tageslinie | Línea del día | Linha do Dia | Ligne du jour |
| karo | tile | Kachel | pieza | peça | tuile |
| ray | track | Gleis | vía | trilho | rail |
| durak | station | Station | estación | estação | station |
| merkez | hub | Zentrum | centro | centro | centre |
| hamle | move | Zug | jugada | jogada | coup |
| hedef | target | Ziel | objetivo | meta | objectif |
| ipucu | hint | Tipp | pista | dica | indice |
| yıldız | star | Stern | estrella | estrela | étoile |
| bilet 🎫 | ticket | Ticket | billete | bilhete | ticket |
| kusursuz | perfect | perfekt | perfecto | perfeito | parfait |
| seri | streak | Serie | racha | sequência | série |
| seri kalkanı 🛡 | streak shield | Serienschild | escudo de racha | escudo de sequência | bouclier de série |
| son durak 🏁 | last stop | Endstation | última parada | última parada | terminus |
| son tren 🚉 · rötar | last train · late | letzter Zug · Verspätung | último tren · retraso | último trem · atraso | dernier train · retard |
| mola bölümü ☕ | breather level | Pausenlevel | nivel de respiro | fase de pausa | niveau détente |
| can ❤️ · sınırsız can | life · unlimited lives | Leben · unendlich Leben | vida · vidas ilimitadas | vida · vidas ilimitadas | vie · vies illimitées |
| güçlendirici | booster | Booster | potenciador | reforço | booster |
| ek tur · fener · geri al | extra turn · lantern · undo | Extradrehung · Laterne · Rückgängig | giro extra · linterna · deshacer | giro extra · lanterna · desfazer | tour bonus · lanterne · annuler |
| görevler 🎯 | quests | Aufgaben | misiones | missões | quêtes |
| haftanın kuralı | rule of the week | Regel der Woche | regla de la semana | regra da semana | règle de la semaine |
| renk temaları | color themes | Farbthemen | temas de color | temas de cores | thèmes de couleur |
| tren kaplaması | train livery | Zuglack | diseño de tren | pintura de trem | livrée |
| sürpriz sandık | surprise chest | Überraschungskiste | cofre sorpresa | baú surpresa | coffre surprise |
| Sıradan · Nadir · Destansı | Common · Rare · Epic | Gewöhnlich · Selten · Episch | Común · Raro · Épico | Comum · Raro · Épico | Commun · Rare · Épique |
| Mağaza | Shop | Shop | Tienda | Loja | Boutique |
| Reklamsız paket | Ad-free pack | Werbefrei-Paket | Paquete sin anuncios | Pacote sem anúncios | Pack sans pub |
| Tema paketi | Theme pack | Themenpaket | Paquete de temas | Pacote de temas | Pack de thèmes |
| Başlangıç paketi | Starter pack | Starterpaket | Paquete inicial | Pacote inicial | Pack de départ |
| Ayarlar | Settings | Einstellungen | Ajustes | Ajustes | Réglages |
| Oyna | Play | Spielen | Jugar | Jogar | Jouer |
| Zen modu 🍃 | Zen mode | Zen-Modus | modo zen | modo zen | mode zen |
| Şehir · semt · rozet | City · district · badge | Stadt · Viertel · Abzeichen | Ciudad · barrio · insignia | Cidade · bairro · medalha | Ville · quartier · badge |
| İlerlemeyi taşı | Move progress | Fortschritt übertragen | Pasar progreso | Transferir progresso | Transférer la partie |
| Verilerimi sil | Delete my data | Meine Daten löschen | Borrar mis datos | Apagar meus dados | Effacer mes données |
| Paylaş | Share | Teilen | Enviar | Enviar | Partager |
| Kart etiketi "Yeni: …" | New: … | Neu: … | Nuevo: … | Novo: … | Nouveau : … |

**Kural adları**

| Hat | Türkçe | İngilizce | Almanca | İspanyolca | Portekizce (BR) | Fransızca |
|---|---|---|---|---|---|---|
| M3 | Eşli karo | Paired tiles | Paarkacheln | Piezas gemelas | Peças gêmeas | Tuiles jumelles |
| M4 | Ters karo | Reverse tile | Umkehrkachel | Pieza inversa | Peça inversa | Tuile inverse |
| M5 | Kayan sıra | Sliding row | Schiebereihe | Fila deslizante | Fileira deslizante | Rangée glissante |
| M6 | Karanlık tünel | Dark tunnel | Dunkler Tunnel | Túnel oscuro | Túnel escuro | Tunnel sombre |
| M7 | Sayaçlı karo | Counter tile | Zählkachel | Pieza contador | Peça contador | Tuile compteur |
| M8 | Soğuyan karo | Cooling tile | Frostkachel | Pieza helada | Peça gelada | Tuile givrée |
| M9 | İki merkez | Two hubs | Zwei Zentren | Dos centros | Dois centros | Deux centres |
| M10 | Makas | Switch | Weiche | Desvío | Desvio | Aiguillage |
| M11 | Mühürlü karo | Sealed tile | Siegelkachel | Pieza sellada | Peça lacrada | Tuile scellée |
| M12 | Döner tabla | Turntable | Drehscheibe | Plataforma giratoria | Plataforma giratória | Plaque tournante |
| M13 | Köprü | Bridge | Brücke | Puente | Ponte | Pont |
| M14 | Bakım karosu | Gear tile | Zahnradkachel | Pieza engranaje | Peça engrenagem | Tuile engrenage |
| M15 | Kapak | Cover | Abdeckung | Tapa | Tampa | Cache |
| M16 | Tünel ağzı | Tunnel portal | Tunnelportal | Boca de túnel | Boca de túnel | Portail de tunnel |
| M17 | Yön tabelası | Signpost | Wegweiser | Señal | Placa | Panneau |
| M18 | Halka hat | Loop line | Ringlinie | Línea circular | Linha circular | Ligne circulaire |
| M19 | Silik kol | Faint arm | Blasser Arm | Brazo tenue | Braço apagado | Bras pâle |
| M20 | Gizli depo | Hidden depot | Verstecktes Depot | Depósito oculto | Depósito oculto | Dépôt caché |
| M21 | Sarmal tahta | Wrap-around board | Endlosbrett | Tablero sin bordes | Tabuleiro sem bordas | Plateau sans bords |
| M22 | Nehir | River | Fluss | Río | Rio | Rivière |
| M23 | Kapalı durak | Closed station | Geschlossene Station | Estación cerrada | Estação fechada | Station fermée |
| M24 | Tarife bölgesi | Fare zone | Tarifzone | Zona tarifaria | Zona tarifária | Zone tarifaire |
| M25 | Son sefer | Timed station | Zeitstation | Estación con reloj | Estação com relógio | Station minutée |
| M26 | Kayan sütun | Sliding column | Schiebespalte | Columna deslizante | Coluna deslizante | Colonne glissante |

Son sefer İngilizcede bilerek "Timed station": "last train" son süre (🚉) için ayrılmış. Saatli durak = timed station = Zeitstation · estación con reloj · estação com relógio · station minutée.

Kural metinlerindeki ortak terimler: tampon = buffer = Prellbock · tope · para-choque · butoir; geçiş = crossing = Übergang · cruce · travessia · passage; düz/sapak = straight/branch = gerade/abzweigend · recto/ramal · reto/ramal · tout droit/bifurcation.

Hat adları, tema, tren kaplaması, rozet ve şehir adlarının bütün karşılıkları `tools/diller/sozluk-*.txt`'tedir (yer adları çevrilir, "Ray" ve "Zen" çevrilmez).

### Kurallar

| Hat | Türkçe | İngilizce |
|---|---|---|
| M3 | Eşli karo | Paired tiles |
| M4 | Ters karo | Reverse tile |
| M5 | Kayan sıra | Sliding row |
| M6 | Karanlık tünel | Dark tunnel |
| M7 | Sayaçlı karo | Counter tile |
| M8 | Soğuyan karo | Cooling tile |
| M9 | İki merkez | Two hubs |
| M10 | Makas | Switch |
| M11 | Mühürlü karo | Sealed tile |
| M12 | Döner tabla | Turntable |
| M13 | Köprü | Bridge |
| M14 | Bakım karosu | Gear tile |
| M15 | Kapak | Cover |
| M16 | Tünel ağzı | Tunnel portal |
| M17 | Yön tabelası | Signpost |
| M18 | Halka hat | Loop line |
| M19 | Silik kol | Faint arm |
| M20 | Gizli depo | Hidden depot |
| M21 | Sarmal tahta | Wrap-around board |
| M22 | Nehir | River |
| M23 | Kapalı durak | Closed station |
| M24 | Tarife bölgesi | Fare zone |
| M25 | Son sefer | Timed station |
| M26 | Kayan sütun | Sliding column |

Kart etiketi: `Yeni: kapak` → `New: cover`.

### Hat adları

Hat adları yer adıdır ve çevrilir:

| Türkçe | İngilizce | Türkçe | İngilizce |
|---|---|---|---|
| Liman | Harbor | Rıhtım | Quay |
| Çarşı | Bazaar | Kanal | Canal |
| Sahil | Shore | Çınar | Plane Tree |
| Kule | Tower | Yayla | Highland |
| Bahçe | Garden | Koru | Grove |
| Köprü | Bridge | Kervan | Caravan |
| Fener | Lighthouse | Değirmen | Mill |
| Vadi | Valley | Göl | Lake |
| Pınar | Spring | Bağ | Vineyard |
| Meydan | Square | Pazar | Market |
| Tepe | Hill | Kale | Castle |
| Ada | Island | Gar | Terminal |
| Saray | Palace | | |

Önekler: Yeni New · Eski Old · Kuzey North · Güney South · Doğu East · Batı West · Yukarı Upper · Aşağı Lower · Büyük Great · Küçük Little. "Hat" → "Line" (ör. `M1 · Liman Hattı` → `M1 · Harbor Line`).

### Arayüz

Çekirdek arayüzde (`game.js`, `index.html`) kullanılan terimler. Yeni metin yazarken buradaki karşılıkları kullan.

| Türkçe | İngilizce |
|---|---|
| Bölüm 12 | Level 12 |
| Hatlar (harita) | Lines |
| Sonraki · Tekrar · Tekrar dene | Next · Retry · Try again |
| Paylaş · Ana sayfa | Share · Home |
| Arkadaşına meydan oku | Challenge a friend |
| Hat açıldı! (bölüm bitti) | Connected! |
| Bölümlere devam (Günün Hattı sonucu) | Back to levels |
| Duraklat · Duraklatıldı · Devam et | Pause · Paused · Resume |
| Topla (görev ödülü) · 🎁 Görevlerde · Üçü birden | Collect · 🎁 In Quests · All three |
| GÜNLÜK GÖREV TAMAM · HAFTALIK GÖREV TAMAM | DAILY QUEST DONE · WEEKLY QUEST DONE |
| GÜNLÜK ÖDÜL · HAFTALIK ÖDÜL | DAILY REWARD · WEEKLY REWARD |
| tam vaktinde · rötar | on time · late |
| ↻ HAMLE HEDEFİ · ↻ HEDEF AŞILDI | ↻ MOVE TARGET · ↻ OVER TARGET |
| Kıl payı | So close |
| Kusursuz için: … ve … | For perfect: … and … |
| KUSURSUZ · YENİ HAT AÇILDI · TEMA ALINABİLİR | PERFECT · NEW LINE OPEN · NEW THEME |
| YENİ KURAL · Anladım | NEW RULE · Got it |
| ⚡ zorluk %30 | ⚡ 30% hard |
| ☕ mola · ☕ mola bölümü | ☕ breather · ☕ breather level |
| Sıradaki (tema) | Next up |
| 🎫 3 yeni bilet · +1 ipucu | 🎫 3 new tickets · +1 hint |
| İlerlemeyi taşı · Kodu kopyala · Kodu yükle | Move progress · Copy code · Load code |
| Bize yaz · Öneri · hata | Contact us · Ideas · bugs |
| 🎯 Görevler · ☀️ Bugün · 📅 Bu hafta | 🎯 Quests · ☀️ Today · 📅 This week |
| günlük ödül · haftalık ödül | daily reward · weekly reward |
| güçlendirici | booster |
| 🔄 Ek tur · 🔦 Fener · ⏱ +15 sn · ↶ Geri al | 🔄 Extra turn · 🔦 Lantern · ⏱ +15 s · ↶ Undo |
| ★ 11 kaldı → M3 | ★ 11 to go → M3 |
| Tamamlandı ✓ · Hazır | Done ✓ · Ready |
| 5 günlük seri | 5-day streak |
| en iyi seri · toplam gün | best streak · total days |
| Seriyi kurtar | Save streak |
| İpucu parçası 1/3 | Hint piece 1/3 |
| ▶ 2 katı | ▶ Double |
| İzle · +2 ipucu | Watch · +2 hints |
| Vazgeç · Kapat · Tamam | Cancel · Close · Done (OK) |
| Bilet topla | Earn tickets |
| Bakiye · Satın al · Seç · Seçili | Balance · Buy · Select · Selected |
| Temalara dön | Back to themes |
| Trenin · Trenine tak | Your train · Put on your train |
| Hat rengi (kaplama) | Line color |
| seri kalkanı | streak shield |
| Ayarlar: Müzik · Efekt sesleri · Titreşim · Günlük hatırlatma | Music · Sound effects · Vibration · Daily reminder |
| Görünüm: Oto · Koyu · Açık | Theme: Auto · Dark · Light |
| Dil | Language (seçenekler kendi dilinde: Türkçe · English) |
| Gizlilik politikası · Reklam gizlilik seçenekleri | Privacy policy · Ad privacy options |
| Verilerin silinsin mi? · Evet, hepsini sil | Delete your data? · Yes, delete it all |
| Satın alımı geri yükle | Restore purchase |
| Hatırlatayım mı? · Evet, hatırlat · Şimdi değil | Want a reminder? · Yes, remind me · Not now |
| Kaldığın yeri hatırlatayım mı? | Remind you where you left off? |
| Bölüm 12 seni bekliyor · bir dakikalık bulmaca | Level 12 is waiting · a one-minute puzzle |
| Reklamsız oyna · {fiyat} | Play ad-free · {price} |
| Şu an video yok · biraz sonra dene | No video right now · try again soon |
| Nasıl oynanır? · İleri › · ‹ kaydır › · Hadi oynayalım! | How to play? · Next › · ‹ swipe › · Let’s play! |

Renk temaları: Metro · Sunset · Ocean · Forest · Desert · Sakura · Neon Night · Northern Lights · Lava · Cosmos · Glacier · Spring · Autumn · Coral Reef · Tea Garden · Tulip · Storm · Midnight · Rainbow · Retro Wave · Pastel · Dawn · (reklamsız) Gold · Diamond · Ruby.

Mevsim temaları: Kar Feneri = Snow Lights · Erguvan = Redbud · Yaz Gecesi = Summer Night · Hazan = Harvest · Bayram Fenerleri = Eid Lanterns · Bayram Sabahı = Eid Morning.

Rozetler: İlk kusursuz = First perfect · Kusursuz 10/100 = Perfect 10/100 · İlk semt = First district · Altın semt = Golden district · Kural ustası = Rule master · 100/500 bölüm = 100/500 levels · 7/30 gün seri = 7/30-day streak · İlk sandık = First chest · Sandık avcısı = Chest hunter · Güçlendirici = Power-up · Haftanın yolcusu = Weekly rider · Zen yolcusu = Zen rider.

Şehir adları: Işık Kent = Light City · Liman Kent = Harbor City · Yıldız Kent = Star City · Gece Kent = Night City · Pınar Kent = Spring City · Kuzey Kent = North City · Ufuk Kent = Horizon City · Gökkent = Sky City.

Tren kaplamaları: Line color · Red Express · Night Train · Mint · Retro · Sunset · Ice · Lavender · Gold Express.

- Kodda yerel `L` adıyla değişken tanımlama: küresel `L()`'yi gölgeler. Metin içeren işlevlerde başka ad kullan (`lim`, `lo`, `list`).
- Durağan HTML'de `data-en` yalnız JS'in sonradan değiştirmediği öğelere konur (çeviri `DOMContentLoaded`'da uygulanır, JS'in yazdığını ezer).

### Kural metinleri

Kural kartlarında, `block()` mesajlarında ve bildirimlerde kullanılan terimler (`www/rules/*.js`):

| Türkçe | İngilizce |
|---|---|
| düz · sapak (makas yolu) | straight · branch |
| kesik çizgi | dashed line |
| kapaklı karo | covered tile |
| silik kol (?) | faint arm (?) |
| tabelalı karo · ok | signpost tile · arrow |
| ayraç (gizli depo) | bracket |
| depo | depot |
| tabla | table |
| halka | loop |
| kesik çemberli karo · çember | dashed-ring tile · ring |
| nehir · kıyı · geçit | river · bank · ford |
| tampon | buffer |
| rozet (sayı rozeti) | badge |
| tünel ağzı · harf | portal · letter |
| kesikli kare · sınır | dashed square · border |
| geçiş (sınırdan geçen hat) | crossing |
| baştan (↺) | restart |
| dönmez | doesn't turn |
| ray bağlama | don't connect |

- Kart etiketi küçük harfle: `Yeni: tünel ağzı` → `New: tunnel portal`.
- Sayılı bildirimler tekil/çoğul ayrılır: `⊘ 1 station is closed` / `⊘ 2 stations are closed`, `1 buffer` / `2 buffers`, `1 crossing` / `2 crossings`.
