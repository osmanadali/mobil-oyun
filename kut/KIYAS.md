# Kut: Türdeki oyunlarla kıyas

Kıyaslanan oyunlar: TFT, Dota Underlords, Auto Chess mobil, Hearthstone Battlegrounds, Super Auto Pets, Mechabellum.
Bizim değerler koddan ve 200 savaşlık ölçümden (sim.js, online.botTakim) geliyor. Rakiplerin değerleri yama notlarından, wiki'lerden, incelemelerden ve oyuncu forumlarından toplandı. Kaynağı olmayan rakam "tahmin" diye işaretli.

Ana hedef: oyun 60-120 fps arasında dönsün ve takılma hissi olmasın. Bu yüzden performans maddeleri listenin başında.

---

## 1. Üstünlüklerimiz

- **Savaş temposu.** Ortalama savaş 13-17 sn (medyan 12-16, p90 19-26). TFT'nin tahmini 15-25 sn bandının kısa ucunda. 1×, 2×, 3× hız ve duraklatma var.
- **Yönetilebilir olay yoğunluğu.** Birim başına saniyede 1,5-3,0 olay (DOT dahil), 0,6-1,2 yetenek. Ekranda ortalama 5-12 sayı/sn.
- **His katmanları zengin.** Birime özel hit-stop (his.donuk), gücüne göre kademeli sarsıntı (yalnız güç ≥ 0,65), Kut anında 0,25 sn yavaşlama, yakınlaşma ve altın parlama, vurulma tepkileri, vuruş anına denk saldırı klipleri, elemente göre renkli darbe efektleri. Rakiplerin belgelenmiş durumundan zengin.
- **Can çubuğu TFT düzeyinde.** Takım rengi, gecikmeli beyaz hasar izi, kalkan dilimi, 100/500 çentikleri, mana nabzı, yıldız rozeti. Çakışan çubuklar kendiliğinden ayrılıyor.
- **Yetenek balonu sırası ve hasar özeti.** Aynı anda en çok 2 balon, Kut öncelikli. Savaş sonu özetinde verilen, alınan, iyileştirme ve kalkan; iki sekme, en iyi oyuncu tacı.
- **Havuzlu parçacık ve ses.** Tek InstancedMesh; %85-95 dolulukta süs efektleri düşüyor. Aynı anda en çok 10 ses ve ses başına en kısa tekrar aralığı. Atış ve isabet katmanları ayrı.
- **Dokunma.** Bütün düğmeler en az 48 px. Dükkân kartında 480 ms basılı tutunca bilgi kartı. Kut dokunuşunda ekran ölçüsüne göre isabet yarıçapı. Taşıma dokun-seç-dokun; TFT'deki kaçan sürükleme sorunu yok.
- **Renk körlüğü.** Rakip diskinde dışa bakan dikenler var; takım bilgisi yalnız renkle verilmiyor.
- **Ölü bekleme yok.** Eşzamansız hayalet rakip, havuz boşsa anında bot. Mechabellum'un yavaş eşleşme şikâyetine karşı güçlü.
- **Kısa maç.** Hızlı Maç en çok 11 tur (6-8 dk). SAP'ın 10 dk hedefiyle aynı bantta; TFT ve Underlords'un 30-45 dk'sından çok kısa.
- **Belirlenimci motor.** Aynı takımlar, tohum ve Kut kaydı aynı savaşı verir. Tekrar izleme, sonuca atlama ve doğrulanabilir çevrimiçi için altyapı hazır. Düello kodu (KUT2-) ile takım paylaşımı var.
- **Sade ekonomi.** Faiz 10'da +1, en çok +5; seri tablosu, kilit. Yenile, Kilit ve XP Al düğmelerinin yeri sabit.

---

## 2. Eksiklerimiz (önem sırasıyla)

Dosya yolları `kut/` altına göredir.

| # | Önem | Ölçüt | Biz | Türün iyileri | Öneri | Dosya |
|---|---|---|---|---|---|---|
| 1 | Kritik | Kare hızı ölçümü ve kendini ayarlayan kalite | FPS ölçen, kare süresine bakan ya da kaliteyi kendi düşüren kod yok. Varsayılan her cihazda "yuksek": 4×MSAA, HalfFloat hedef, bloom, 2048 PCF gölge, DPR 1,5. Hafif kaliteye yalnız Ayarlar'dan, sayfa yenilenerek geçiliyor (arayuz.js:110). gorunum.js:134'teki kaliteDegistir() kullanılmıyor. 60/120 sınırı yok. | TFT'nin bilinen zayıflığı kalabalık savaşta FPS düşüşü; oyuncular FPS sınırı istiyor. Hearthstone 30/60/120 ayarı sunuyor, pilde 30'a iniyor. Underlords mobilde 60'ı tutturamadı, şikâyet aldı. | Son 90 karenin ortalaması ve 95. yüzdeliğini ölç. p95 2 sn boyunca bütçeyi (60 Hz'de 16,6 ms, 120 Hz'de 8,3 ms) aşarsa sırayla: DPR 1,5 → 1,25 → 1,0; bloom kapat; MSAA 4 → 0 ve gölge kapat. G.kaliteDegistir ile, sayfa yenilemeden. Geri yükseltme 5 sn histerezisle. Ayarlara "Kare hızı: 60 / 120 / Otomatik". İlk açılışta 3 sn sessiz ölçümle başlangıç kademesi. ?fps=1 ile geliştirici göstergesi. | web/sahne3d.js, web/gorunum.js, web/arayuz.js |
| 2 | Yüksek | Kare başına bellek ayırma ve 2D kaplama yükü (takılmanın kaynağı) | anlikGorsel() her karede iki kez çağrılıyor, her seferinde birim başına yeni nesne. kaplamaCiz'de birim başına clone() ve new Vector3 (dosyada 31 clone, 13 new Vector3). İç döngüde findIndex. yazilar.filter her karede yeni dizi. Kaplama tuvali DPR 2'de tam ekran, her karede baştan çiziliyor; her sayıda font yeniden atanıyor. Sonuç: mobilde çöp toplayıcı duraklaması. | Mechabellum'un en büyük şikâyeti son turlardaki birim, mermi ve efekt yükünden gelen takılma; yamalarla efekt maliyeti düşürüldü. TFT geç oyun FPS düşüşünü açıkça sorun saydı. | anlikGorsel'i karede bir kez hesapla, önceden ayrılmış diziye yaz. findIndex yerine uid→indeks Map'i. ekran() için modül düzeyinde geçici vektör. yazilar'ı yerinde sıkıştır (swap-remove). Sayıları en çok 3 font grubunda çiz. Kaplama tuvalini DPR 1,5 ile sınırla. Hedef: 16 birimlik sv8 savaşında Minor GC sayısı savaş başına 1'den az. | web/sahne3d.js |
| 3 | Yüksek | 120 Hz'de render bütçesi | 4×MSAA, HalfFloat composer, ekranın %50'sinde bloom; gölge haritası her karede güncelleniyor, oysa ışık ve arena sabit. 16 iskeletli karakter. 2560×1600 tablette DPR 1,5 ≈ 3840×2400 piksel, 120 Hz'de bütçe 8,3 ms. | Rakiplerin hiçbiri mobilde 120 Hz hedeflemiyor. Bizim 60-120 hedefimiz bir ayrışma noktası. | Gölge haritası 30 Hz (shadowMap.autoUpdate = false, iki karede bir needsUpdate). 120 Hz modunda bloom %35 çözünürlükte, composer MSAA 2. Ekran dışı ya da ölü birimin mixer'ını güncelleme. Gerekirse uzak birimlerin iskelet animasyonu yarı hızda. | web/gorunum.js, web/sahne3d.js |
| 4 | Yüksek | Yüzen sayı yoğunluğu ve üst sınır | Görünür sayı: seviye 3'te 4,9/sn (tepe 15), seviye 5'te 8,6/sn (tepe 27), seviye 8'de 12,4/sn (tepe 38, en kötü savaşta 128/sn). Her sayı 0,95 sn yaşıyor; genel üst sınır yok, 16 birimde aynı anda 30'dan fazla sayı birikebilir. "KRİTİK" gerçek kritik değil, yalnız n ≥ 200 eşiği. | Hearthstone BG'de ekranda 1-3 sayı. SAP sayı göstermiyor, rakamı değiştiriyor. Auto Chess mobilde 20 birimlik savaş "okunamaz" bulundu. TFT ayrıntıyı savaş sonu tablosuna bırakıyor. | Aynı anda en çok 18 sayı; sınır dolunca önce DOT ve küçük sayılar düşsün, büyük hasar, yetenek ve Kut sayıları kalsın. Aynı hedefe 0,15 sn içindeki vuruşlar tek sayıda toplansın. Rakibin küçük sayıları %70 boy, %60 opaklık. "KRİTİK" yalnız yetenek veya Kut ile 200+ hasarda. | web/sahne3d.js |
| 5 | Yüksek | Süreli hasar (yanık, zehir) görünmüyor, özete yazılmıyor | sim.js DOT'u her 0,05 sn'lik adımda ayrı olay yayıyor, yalnız m ≥ 1 ise. Seviye 1 Od yanığı (12/sn) adım başına 0,6 eder: hiç olay üretmez ama can düşer. Seviye 8 ölçümünde 72.502 DOT olayının yalnız %13'ü ekrana çıktı. Oyuncu Od ve Zehir'in işe yaradığını göremiyor. | Tür genelinde DOT 0,5-1 sn aralıklı tiklerle, element renginde gösteriliyor. Riot savaşın "takdir edilebilir" olmasını yayın öncesi kontrol maddesi yapıyor. | Birim başına DOT birikimi tut, 0,5 sn'de bir tek "dot" olayı yay. Can hesabı her adımda aynı kalsın, yalnız olay yayma toplu olsun; belirlenimcilik bozulmaz. Görünürde 0,8 boy, element rengi. C# KutSim'e de yansıt, esdeger_uret.cjs ile eşdeğerliği yeniden üret. | sim.js |
| 6 | Yüksek | Öğretici | Yalnız "Nasıl oynanır" madde listesi (arayuz.js:77) ve bir ipucu satırı. OGRETICI.md'deki tasarım koda dökülmemiş. | Underlords öğreticisi 3'ten az maçı olana kendiliğinden açılıyor, tekrar oynanabiliyor. Hearthstone'da Bob anlatıyor. Auto Chess mobil ve Mechabellum öğreticileri yetersiz bulundu; TFT mobilde oyuncu satmayı bulamadı. | İlk Hızlı Maç'ın ilk 3 turunda adım adım: kahraman al, tahtaya koy, Kut'a dokun, üçünü birleştir, sat. Her adımda tek öğe parlasın, gerisi kararsın. P.mac < 3 ise kendiliğinden başlasın, "Nasıl oynanır" altından tekrar açılsın. Metinler OGRETICI.md'den. | web/arayuz.js, OGRETICI.md |
| 7 | Orta | Uzatma ve zaman aşımı kararı | Üst sınır 30 sn, uzatma yok. Seviye 8'de savaşların %10'u süre dolunca kalan can yüzdesiyle bitiyor (Hızlı Maç geç turlarında %4,5-8). Ekranda görünmeyen bir hesapla kapanıyor. | TFT'de 30. sn'de uzatma: her saniye +%10 hasar ve saldırı hızı, -%10 iyileşme/kalkan (en çok %70), kesin sınır 40 sn. Hearthstone uzun savaşta animasyonu hızlandırıyor. | Toplam 30 sn kalsın; 22. sn'den sonra saniyede +%12 hasar ve saldırı hızı, -%12 iyileşme ve kalkan (en çok %70). HUD'da saat "UZATMA" diye kırmızıya dönsün. Hedef: seviye 8'de süreyle biten savaş %3'ün altında (olc.js ile ölç). C# ve sim.test.cjs de güncellenmeli. | sim.js, data.js |
| 8 | Orta | Son 10 saniye uyarısı | hudCiz yalnız "0:SS kalan" yazıyor; nabız, renk ya da ses yok. | Mechabellum 1.0'da son 10 sn'de müzik duruyor, saat tik sesi çalıyor. | Kalan 8 sn'de saat rozeti kırmızı ve 1 Hz nabız. Her saniye kısık kısa tik (WebAudio osilatörü yeter). Uzatma başlangıcını da duyursun. | web/arayuz.js, web/ses.js |
| 9 | Orta | Savaşı sonuca atlama | 1×/2×/3× ve duraklat var, "Atla" yok. sim.sonunaKadar() zaten var; atlama teknik olarak bedava. | Animasyon atlama Hearthstone oyuncularının en sık isteği. Mechabellum'da hızlandırma yokluğu şikâyet oldu. | Kut kullanıldıktan ya da 5. sn'den sonra hız sütununa 48 px "Atla". sonunaKadar() ile bitir, kuyruğu boşalt, son anlığa geç, sonuç bandını göster. istatTopla motor ilerlerken çağrılsın ki özet dolsun. | web/sahne3d.js, web/arayuz.js |
| 10 | Orta | Ekonomi dökümü dokunmatikte görünmüyor | Rozet "Gelir +N" yazıyor; taban/faiz/seri/galibiyet dökümü yalnız title niteliğinde (arayuz.js:156), dokunmatikte görünmez. Faiz ve seri kuralları yazmıyor. | Underlords çıkarımı: faiz ve seri görünür olmalı. TFT seviye çubuğunda oranları gösteriyor. | Rozete dokununca balon: "Taban 5 · Faiz 3 (30 altın) · Seri 2 · Galibiyet 1 = +11" ve "+1 faiz için 4 altın daha". Rozet üstünde 5 noktalı faiz göstergesi. | web/arayuz.js, web/index.html |
| 11 | Orta | Erişilebilirlik: metin boyu, sarsıntı azaltma, ses kanalları | Tek ana ses kazancı, müzik/efekt ayrımı yok. Metin boyu ayarı yok; çok sayıda 11 px etiket. Sarsıntı/flaş azaltma yok. | TFT mobilin şikâyeti küçük metin ve simge. Hearthstone'da müzik, efekt, ses ayrı kısılıyor. GAG: temel bilgi yalnız renkle verilmemeli. | Ayarlar'a: "Metin boyu: Normal / %115 / %130" (--olcek, en küçük etiket 12 px); "Sarsıntı ve flaş: Azaltılmış" (×0,3, prefers-reduced-motion varsayılan açar); efekt ses kaydırıcısı ve müzik için ayrı kazanç düğümü. | web/arayuz.js, web/ses.js, web/index.html |
| 12 | Düşük | Görevler ve tekrar izleme | Kupa, kodeks, düello kodu var. Haftalık görev, sezon yok. Savaş kaydı saklanıyor (oyun.js:189) ama "Tekrar izle" yok. | TFT haftalık/sezonluk görev ve "1 maç oyna = 400 XP". SAP tam maç tekrarı ve komik takım adları. Mechabellum 3 aylık sezon. | Yerelde 3 haftalık görev (kozmetik ödül, pazartesi sıfırlanır). Sonuç bandına "Tekrar izle" (aynı takımlar, tohum, opt.kut ile S3.baslat). Düello koduna tohum ve Kut kaydı ekleyip "bu savaşı izle" bağlantısı. | web/arayuz.js, web/oyun.js, online.js |

---

## 3. Bu akşam prototipte yapılacaklar

Seçim: kritik ve yüksek önemde, prototipte yapılabilir maddeler. Her biri 1-2 saatlik iş. Sıra, 60-120 fps hedefine katkıya göre.

1. **Kare süresi ölçümü ve ?fps=1 göstergesi** (web/sahne3d.js). Son 90 karenin ortalaması ve p95'i; köşede küçük gösterge. Sonraki maddelerin etkisi bununla ölçülür, o yüzden ilk iş.
   - *Yapıldı:* `?fps=1` ya da `kut.fps=1` (Ayarlar'da düğme) sol altta: son 2 sn ortalama fps, en kötü kare, 33 ms üstü kare sayısı, çizim çağrısı, üçgen, kare başı JS ms ve kalite kademesi. Kapalıyken DOM'a dokunulmaz; ölçüm halkası sabit boyutlu typed array.
2. **Kare başına bellek ayırmayı sıfırlama** (web/sahne3d.js). anlikGorsel karede bir kez ve önceden ayrılmış diziye; findIndex yerine Map; ekran() için geçici vektör; yazilar swap-remove; kaplama tuvali DPR 1,5; en çok 3 font grubu. Kabul: 16 birimlik sv8 savaşında Minor GC savaş başına 1'den az.
   - *Yapıldı:* anlıklar tek Float64Array'de, görsel anlık karede bir kez kalıcı nesnelere; uid→indeks Map; aktar() yeni Quaternion üretmiyor (dünya dönüşü güncel matristen); kaplama yuvaları, ekran() çıktısı, degrade ve renk dizgeleri önbellekte; 3 font grubu + ölçek; yazılar ve efektler yerinde sıkıştırılıyor (sıra korunur); kaplama DPR ≤ 1,5; HUD yalnız değişince yazılıyor; vfx durum efektleri ve hareket.js döngüleri kapanışsız. Ölçüm (SwiftShader, 16 birim, ısınmış kod, örneklemeli yığın profili): 390 → 224 KB/kare; kalanın çoğu three.js içi (karıştırıcı, matris ayrıştırma).
3. **Uyarlamalı kalite kademeleri** (web/gorunum.js, web/sahne3d.js). p95 2 sn bütçeyi aşınca DPR → bloom → MSAA ve gölge sırasıyla iner; 5 sn histerezisle geri çıkar; G.kaliteDegistir ile sayfa yenilemeden. İlk açılışta 3 sn sessiz ölçümle başlangıç kademesi.
   - *Yapıldı:* `G.KADEMELER` (0 = bugünkü görüntü): 120 Hz bütçesi → DPR 1,25 → 1 → bloom yarım → bloom kapalı → MSAA kapalı + gölge 1024 → son işlem kapalı → DPR 0,75 + gölge 512. Bu cihazda aynı sonuç veren kademeler atlanır. 0,5 sn'lik kovalar: 3 sn 55 fps altı → bir iner; 10 sn rahat → bir çıkar (her başarısızlıkta bekleme 2 katı, 3 başarısızlıktan sonra o kademeye dönmez). İnişten 3 sn sonra kare süresi %8 kısalmadıysa (30 Hz pil kilidi, işlemci darboğazı) geri döner, 1 dk inmez. Açılışta 3 sn sessiz ölçüm, sekme gizliyken ölçüm yok, kademe `kut.kademe`'de saklanır, `kut.uyarla=0` kapatır.
4. **"Kare hızı: 60 / 120 / Otomatik" ayarı** (web/arayuz.js). 60 seçiliyse rAF içinde son kareden 15,5 ms geçmeden çizim atlanır. arayuz.js:110'daki sayfa yenilemeli kalite geçişi de kaliteDegistir'e bağlansın.
5. **Gölge 30 Hz ve 120 Hz bütçesi** (web/gorunum.js, web/sahne3d.js). shadowMap.autoUpdate = false, iki karede bir needsUpdate. 120 Hz modunda bloom %35, composer MSAA 2. Ekran dışı ve ölü birimlerin mixer'ı durur.
   - *Yapıldı:* gölge haritası ciz(dt) ile en çok 30 Hz; 120 Hz ekranda 105 fps altında yalnız "120 Hz bütçesi" kademesine (bloom %35, MSAA 2) inilir. Ekran dışı birimin iskeleti ertelenir (süre birikir), çözülmüş ölünün hiç güncellenmez; ekran dışı birimin sürekli durum efekti parçacık üretmez. Çizim çağrısı 104 → 90 (hafif), 119 → 104 (yüksek); üçgen/kare 2,25 M → 1,68 M.
6. **Yüzen sayı üst sınırı** (web/sahne3d.js). En çok 18 sayı, öncelikli düşürme, 0,15 sn içinde aynı hedefe gelenleri toplama, rakibin küçük sayıları %70 boy ve %60 opaklık, "KRİTİK" yalnız yetenek/Kut ile 200+.
7. **DOT olaylarını 0,5 sn'de bir toplu yayma** (sim.js). Can hesabı adım adım aynı kalır, yalnız olay yayma toplanır; m < 1 kaybı biter. Görünürde 0,8 boy, element rengi. sim.test.cjs çalıştırılsın; C# tarafı aşağıdaki listede.
8. **Öğreticinin ilk sürümü** (web/arayuz.js). Beş adım (al, koy, Kut, birleştir, sat), tek öğe vurgusu ve karartma, P.mac < 3 ise kendiliğinden, "Nasıl oynanır" altından tekrar. Bu akşam yalnız akış ve vurgu; metinler OGRETICI.md'den olduğu gibi alınsın.

Bu akşamın kabul ölçütü: orta bir telefonda seviye 8 savaşında p95 kare süresi 16,6 ms'nin altında, 120 Hz destekleyen cihazda Otomatik modda 8,3 ms'nin altında ya da kademe düşerek oraya oturuyor; savaş boyunca gözle görülür takılma yok.

---

## 4. Unity'de yapılacaklar

Prototipte doğrulanan davranışlar Unity'ye şöyle taşınmalı:

- **DOT toplu olay yayma**: C# KutSim'e aynen yansıt, esdeger_uret.cjs ile eşdeğerlik verisini yeniden üret, JS ve C# sonuçlarının bit düzeyinde aynı olduğunu doğrula.
- **Uzatma (22. sn'den sonra +%12/-%12, en çok %70)**: önce JS'te olc.js ile ölç, sonra C# KutSim ve sim.test.cjs eşdeğerlik testleriyle birlikte taşı. Motor değişikliği olduğu için iki taraf aynı sürümde değişmeli.
- **Kare hızı ayarı**: Application.targetFrameRate (60/120) ve Otomatik için ekran tazeleme hızı; pil tasarrufu modunda 30/60'a inme seçeneği (Hearthstone gibi).
- **Uyarlamalı kalite**: prototipteki kademe sırasını (çözünürlük ölçeği → bloom → MSAA ve gölge) URP Render Scale ve kalite seviyeleriyle kur; Android'de Adaptive Performance paketini değerlendir. Kare süresini FrameTimingManager ile ölç.
- **Gölge ve animasyon maliyeti**: sabit ışık için gölge haritasını seyrek güncelle ya da arenayı bake et; ekran dışı birimlerde Animator culling (Cull Update Transforms), uzak birimlerde düşük güncelleme hızı.
- **Bellek ayırma**: kare başına sıfır GC hedefi; yüzen sayılar ve parçacıklar için nesne havuzu, Profiler'da GC Alloc sütunu savaş boyunca 0 kalsın.
- **Yüzen sayı kuralları**: 18'lik üst sınır, öncelik, toplama ve rakip sayılarının sönükleştirilmesi Unity HUD'unda da aynı değerlerle.
- **Orta ve düşük önemdeki maddeler** (son 10 sn uyarısı, Atla düğmesi, ekonomi balonu, erişilebilirlik ayarları, görevler ve tekrar izleme): prototipte denenenler Unity arayüzüne birebir taşınsın, denenmeyenler doğrudan Unity'de yapılsın. Erişilebilirlik için ayrı müzik/efekt/ses Audio Mixer grupları kur.

---

## Kaynaklar

**TFT**
- https://wiki.leagueoflegends.com/en-us/Teamfight_Tactics_%28game%29
- https://www.breakflip.com/guide/tft/combat-tactique-comment-se-deroule-une-partie-14067
- https://teamfighttactics.leagueoflegends.com/en-gb/news/dev/talking-tactics-game-analysis-team-gat/
- https://upcomer.com/teamfight-tactics-mobile-first-impressions/
- https://devtrackers.gg/teamfight-tactics/p/15e47ea8-tft-mobile-early-access-feedback
- https://wiki.leagueoflegends.com/en-us/TFT:Boom
- https://theglobalgaming.com/lol/how-to-unlock-tft-booms
- https://teamfighttactics.leagueoflegends.com/en-us/news/game-updates/teamfight-tactics-patch-18-1
- https://www.riotgames.com/en/news/crafting-visual-effects-in-teamfight-tactics-super-art-power-hour-ep-6
- https://www.invenglobal.com/articles/23690/tft-developers-unreal-engine-is-just-the-beginning
- https://teamfighttactics.leagueoflegends.com/en-us/news/riot-games/teamfight-tactics-mobile-update/
- https://thegamehaus.com/teamfight-tactics/first-images-of-tfts-mobile-interface-released/2020/02/06/
- https://teamfighttactics.leagueoflegends.com/en-gb/news/game-updates/tft-interface-update/
- https://dtcl.vnggames.com/en-us/news/dev/dev-quality-of-life-improvements
- https://devtrackers.gg/teamfight-tactics/p/f1f557f2-please-allow-us-to-move-the-champion-information-panel
- https://upcomer.com/teamfight-tactics-patch-10-2-breakdown/
- https://leagueoflegends.fandom.com/wiki/Augment_(Teamfight_Tactics)
- https://teamfighttactics.leagueoflegends.com/en-gb/news/dev/dev-design-pillars-of-tft
- https://1v9.gg/blog/how-long-is-a-tft-game
- https://theglobalgaming.com/lol/how-long-are-tft-games
- https://devtrackers.gg/teamfight-tactics/p/df2e092b-tft-looks-interesting-but-i-find-the-new-player-experience-too-wretched-to-endure
- https://dotesports.com/?p=252512
- https://apps.apple.com/us/app/id1480616748
- https://www.esportstales.com/teamfight-tactics/how-to-increase-fps-video-settings-client-options
- https://teamfighttactics.leagueoflegends.com/en-gb/news/game-updates/teamfight-tactics-galaxies-ii-pass-and-more/
- https://support.riotgames.com/en-us/tft/events/teamfight-tactics-lore-legends-part-i

**Dota Underlords ve Auto Chess mobil**
- https://www.gamerevolution.com/?p=569149
- https://androidauthority.com/auto-chess-beginners-guide-996654
- https://www.redbull.com/au-en/competitive-analysis-auto-chess
- https://gamesbeat.com/auto-chess-on-mobile-is-improving-but-confusing/
- https://www.invenglobal.com/articles/8439/valve-has-changed-dota-underlords-ui-to-look-less-like-a-mobile-port
- https://www.pressreader.com/australia/edge/20200326/282617444827953
- https://dotaunderlords.fandom.com/wiki/August_08,_2019_Patch
- https://dotaunderlords.fandom.com/wiki/August_30,_2019_Patch
- https://dotaunderlords.fandom.com/wiki/August_01,_2019_Patch
- https://mmobomb.com/news/health-bars-are-now-more-visible-dota-2-voting-opens-collector-cache
- https://www.pcgamer.com/dota-underlords-is-a-streamlined-auto-chess-with-some-nice-tweaks
- https://9to5google.com/2019/06/21/dota-underlords-android-ios/
- https://pcgamesn.com/dota-underlords/gold-how-to-make-money-economy
- https://www.magicgameworld.com/dota-underlords-economy-guide/
- https://peermag.org/articles/video-game-review-dota-underlords/
- https://www.gamingonlinux.com/2019/11/dota-underlords-also-got-a-huge-update-with-a-new-knockout-game-mode-and-multiple-heroes/
- https://www.gamezebo.com/reviews/chess-rush-review-does-turbo-mode-give-tencents-auto-chess-effort-the-edge/
- https://dotaunderlords.gamepedia.com/City_Crawl
- https://toucharcade.com/2019/06/05/auto-chess-mobile-preview/
- https://apps.apple.com/app/id1465996312
- https://www.apkmirror.com/apk/valve-corporation/dota-underlords/
- https://steamcommunity.com/app/1046930/discussions/0/1640918469752725050
- https://www.pcgamer.com/valve-adds-hats-to-dota-underlords-season-1-because-of-course-it-did
- https://gamesbeat.com/dota-underlords-season-one-kicks-off-with-battle-pass-and-more/
- https://www.droidgamers.com/news/auto-chess-gets-season-1-a-battle-pass-and-an-account-level-system-in-a-massive-update/
- https://www.thesixthaxis.com/2019/06/06/auto-chess-update-mobile-weekly-quests-challenges-chess-pass/
- https://gameaccessibilityguidelines.com/ensure-no-essential-information-is-conveyed-by-a-fixed-colour-alone/

**Hearthstone Battlegrounds**
- https://hearthstone.wiki.gg/wiki/Battlegrounds
- https://us.forums.blizzard.com/en/hearthstone/t/battlegrounds-turn-timer/65935
- https://us.forums.blizzard.com/en/hearthstone/t/bg-deathrattle-animations-taking-up-entire-turn/136534
- https://hearthstone.blizzard.com/news/24179332/31-6-patch-notes
- https://eu.forums.blizzard.com/en/hearthstone/t/11612
- https://us.forums.blizzard.com/en/hearthstone/t/battlegrounds-combat-length/130334
- https://hearthstone.blizzard.com/en-us/news/23156373
- https://us.forums.blizzard.com/en/hearthstone/t/battlegrounds-needs-ability-to-see-what-tribes-are-available/87876
- https://us.forums.blizzard.com/en/hearthstone/t/is-there-a-way-to-know-which-battleground-minions-are-in/136621
- https://us.forums.blizzard.com/en/hearthstone/t/battleground-animtions-went-down-in-quality/23086
- https://hearthstone.blizzard.com/en-us/blog/23964694/
- https://hearthstone.wiki.gg/wiki/Battlegrounds/Dr._Boombox_(golden)
- https://blizzardwatch.com/2021/07/07/cosmetic-skins-new-bartenders-coming-hearthstone-battlegrounds/
- https://shacknews.com/article/116552/hearthstone-battlegrounds-conor-kou-on-dragons-hero-powers-and-more
- https://news.blizzard.com/en-us/article/24128997/note-della-patch-30-4-3
- https://outof.cards/comments/193616
- https://theglobalgaming.com/gaming/average-match-time-length-hearthstone
- https://us.forums.blizzard.com/en/hearthstone/t/how-long-does-a-battlegrounds-match-take/17754
- https://us.forums.blizzard.com/en/hearthstone/t/the-new-player-experience-apprentice-track-fall-2025/151882
- https://blizzardwatch.com/2022/05/11/hearthstone-frame-rate-option/
- https://breezewiki.discard.no/hearthstone/wiki/Options
- https://outof.games/hearthstone/guides/197-how-to-play-hearthstone-with-60-or-144-fps-frames-per-second/
- https://www.notebookcheck.net/Hearthstone-Laptop-Benchmarks.459372.0.html
- https://us.forums.blizzard.com/en/hearthstone/t/fix-coming-for-battlegrounds-animation-issues/26429
- https://www.hearthstonetopdecks.com/fix-for-battlegrounds-animation-skipping-issue-is-coming/
- https://us.forums.blizzard.com/en/hearthstone/t/bug-battleground-anim-are-too-slow-on-tablet/138066
- https://support.blizzard.com/en/article/2371
- https://apps.apple.com/gb/app/id625257520
- https://hearthstone.wiki.gg/wiki/Tavern_Pass
- https://www.pcgamer.com/heres-how-hearthstones-new-seasonal-reward-track-and-paid-tavern-pass-will-work
- https://us.forums.blizzard.com/en/hearthstone/t/97531/1
- https://www.pcgamer.com/the-creator-of-a-popular-hearthstone-accessibility-mod-has-ended-support-for-it
- https://us.forums.blizzard.com/en/hearthstone/t/why-no-skip-animation-or-fast-animation/134592
- https://www.hearthstonetopdecks.com/should-we-finally-be-allowed-to-turn-off-animations-in-hearthstone/

**Super Auto Pets ve Mechabellum**
- https://superautopets.wiki.gg/wiki/The_Basics
- https://superautopets.wiki.gg/wiki/Version_0.28
- https://redlib.belloworld.it/r/superautopets/comments/u9dxg6/developers_perspective_on_game_balance (arama özeti; gönderiye doğrudan erişilemedi)
- https://en.wikipedia.org/wiki/Super_Auto_Pets
- https://www.engadget.com/super-auto-pets-auto-battler-game-143026957.html
- https://vaporlens.app/app/1714040/super_auto_pets.md
- https://store.steampowered.com/app/1714040/Super_Auto_Pets/
- https://www.apkmirror.com/apk/team-wood-games/super-auto-pets/super-auto-pets-143-release/super-auto-pets-143-android-apk-download/
- https://www.pcgamer.com/games/strategy/strategic-robot-carnage-intensifies-as-autobattler-mechabellum-hits-its-1-0-release
- https://vaporlens.app/app/669330/mechabellum.md
- https://mbwiki.dreamhaven.com/updates/mechabellum-10-update-patchnotes
- https://store.steampowered.com/app/669330/Mechabellum/
- https://steamcommunity.com/app/669330/discussions/0/3805026824438136946/?ctp=2
- https://mbwiki.dreamhaven.com/updates/update-190-season-6-dimensional-rift-new-techs-and-festivals
- https://mbwiki.dreamhaven.com/updates/update-170
- https://support.dreamhaven.com/hc/articles/35190353653915
