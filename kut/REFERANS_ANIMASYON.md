# Kut Arena: animasyon ve sinematik referansları

Amaç: başka oyunları kopyalamak değil, onlardan prensip çıkarmak. Hedef his: sakin, taktik, satranç gibi; ama oyuncu sahnede "orada" olmalı.

Not: Aşağıdaki oyunların maç sonu ekranları için resmî tasarım yazısı çok az. Kaynaklı bilgiler linklidir. "(gözlem)" diye işaretli maddeler oyunların kendisinden bilinen, yayınlanmış bir kaynağa dayanmayan gözlemlerdir. Sürelerin hepsi 60 kare/sn'ye göredir (1 kare ≈ 16,7 ms).

---

## 0. Şu anki MVP neden çocukça duruyor (kodu okuyarak)

| Öğe | Yer | Sorun |
|---|---|---|
| Zafer animasyonu `Dance_Loop` (1,0 sn döngü) | `sahne3d.js` `mvpGoster` | Ritmik dans, yaratığı oyuncak gibi gösteriyor. Ağırlık, nefes ve duruş yok. |
| Zafer kuyruğu `sin(t·16)·0,35` (yaklaşık 2,5 Hz, ±20°) | `hareket.js` kuyruk döngüsü | Köpek heyecanı gibi duruyor. Sakin bir kahraman yavaş sallar (0,6–1,2 Hz). |
| Yıldızlı patlama (`yildiz: true`) | `mvpGoster` | Kamera daha gelmeden ekrana konfeti saçıyor. |
| Dönen konik ışınlar (`repeating-conic-gradient`, 9 sn) | `index.html` `.mvpIsinlar` | Çizgi film ödül ekranı kalıbı. |
| Altın degrade şerit, 4 yönlü kalın kontur, `0 4px 0` sert gölge | `.mvpSerit`, `.mvpSayi` | Büyük çizgi-film yazısı ve "jelibon" buton dili. |
| Taşan yaylar: `cubic-bezier(…1.3)`, `(…1.5)`, `scale(.4)→1`, `rotate(-90deg)` | `mvpPor`, `yildizPop` | Her öğe zıplayarak giriyor. Beş öğe aynı anda zıplayınca ekran "pıtırcık" görünüyor. |
| Yuvarlak portre ve yaratığın 3D'si aynı anda | kart + yakın plan | 3D'de yaratık zaten büyük. Portre aynı şeyi ikinci kez söylüyor ve dikkati 3D'den çalıyor. |
| Kamera 0,9 sn'de `smoothstep` ile tek hamlede geliyor, sonra donuyor | `mvpKarisim` | Sinematik çekimlerde kamera hiç tam durmaz: yavaş itme ve nefes olur. |

**Kaçınılacaklar listesi** (bütün öneriler için geçerli):
- Taşma (overshoot) en fazla %4–6 olmalı. Aynı anda birden fazla zıplayan öğe olmamalı.
- Doygun ve düz renk degrade kullanılmamalı. Altın tek vurgu rengi olabilir ama metalik ve az doygun olsun (ör. `#d9b46a`), parlak sarı değil.
- Yıldız, kıvılcım ve konfeti olmamalı. Ortam parçacığı yeterli: birkaç toz zerresi ya da kor.
- Kontur ve sert alt gölgeli kalın "kabarık" yazı kullanılmamalı. İnce, harf aralığı geniş, büyük harf başlık yeterli. Rakamlar tablo hizalı olsun.
- Ekran sarsıntısı yalnız darbede olmalı, kutlamada olmamalı.
- Dans, el çırpma ya da zıplama döngüsü kullanılmamalı. Zafer, tek seferlik bir hareket ve ardından onu tutan bir duruştur.

---

## 1. MVP / Maçın Yıldızı: üç sinematik öneri

### Referanslardan çıkan prensipler

- **Overwatch, "Play of the Game" ve öne çıkan girişleri:** Giriş yaklaşık 5 sn sürer, ardından 12 sn oyun görüntüsü gelir ([Overwatch Wiki](https://overwatch.fandom.com/wiki/Play_of_the_Game)). Girişler oyunun kendi haritası ve modelleriyle sahnelenir: karakter bir set üzerindeki oyuncu gibi yerleştirilir ve kamera ona göre konur ([Dexerto](https://www.dexerto.com/overwatch/overwatch-player-discovers-secret-about-how-highlight-intros-are-made-1310666)). Tek bir giriş animasyonu yaklaşık 4 günlük el işidir, en çok zaman da yüze gider ([Kotaku](https://kotaku.com/how-overwatch-highlight-animations-are-made-1792608768), [80.lv / David Gibson](https://80.lv/articles/david-gibson-animating-mei-in-overwatch)). Kaplan'a göre kartlar ve oylama "sosyal bir an"dır ([GamesRadar](https://gamesradar.com/how-overwatch-is-inspiring-good-sportsmanship-through-a-broken-feature)). OW2'de çoğu oyuncu kartları beklemeden çıktığı için kaldırıldılar ([Dexerto](https://dexerto.com/overwatch/overwatch-devs-want-post-game-match-cards-to-be-more-meaningful-in-ow2-2088661)). **Ders:** Sahne kısa olmalı ve atlanabilmeli. Karakter tek bir imza hareketi yapmalı. Yazı küçük ve geç gelmeli: önce ad ve rol, sonra istatistik.
- **PotG seçimi:** Ham toplamın yanında zorluk da ağırlıklandırılıyor ([Game Developer](https://gamedeveloper.com/design/designing-and-improving-i-overwatch-i-s-play-of-the-game-highlights)). **Ders:** MVP yalnız "en çok hasar" olmamalı. Kalkan veya iyileştirme yapan ya da son vuruşu yapan kahraman da seçilebilmeli, gerekçesi tek satırda yazmalı.
- **TFT:** Little Legend'lar konuşmadığı için hikâye beden dili ve hareketle anlatılıyor ([TFT tasarım ilkeleri](https://teamfighttactics.leagueoflegends.com/en-gb/news/dev/dev-design-pillars-of-tft)). Yıldız yükseltme animasyonu 14.20 yamasında gecikmesiz hale getirildi ([Mobafire 14.20](https://www.mobafire.com/league-of-legends/news/tft-14-20)). **Ders:** Oyun akışındaki törenler kısa olmalı. Uzun tören yalnız maç sonuna yakışır.
- **League of Legends (gözlem):** Nexus patlarken kamera kendi kendine üsse gider. Oyun ağır çekime geçmez; patlama tek ve büyük bir olaydır. ZAFER/BOZGUN yazısı ince ve metalik bir amblemdir, renk çok azdır ([Behance: Victory/Defeat](https://www.behance.net/gallery/53065555/League-of-Legends-Victory-Defeat)).
- **Legends of Runeterra:** Seviye atlama, oyunun ortasında kısa bir ara sahnedir ve şampiyonun hikâyesini anlatır ([Riot: From Champ Select to Your Deck](https://riotgames.com/en/news/from-champ-select-to-your-deck)). **Ders:** Kamera kahramanın karakterine özgü bir hareket yapar; genel bir "parıltı" yetmez.
- **Clash Royale (gözlem):** Taçlar tek tek ve her biri ayrı bir ses vuruşuyla düşer. Kule yıkılınca kısa bir duraklama olur. Kral sahnenin ortasında tek bir tepki verir. **Ders:** Sayıları tek tek ve ritimle göster, hepsini birden saydırma.
- **Hearthstone (gözlem):** Kaybedenin portresi çatlar ve parçalanır, kazanan sakin kalır. Katarsis duygusu Peggle'dan alındı ([GDC notu](https://sites.google.com/a/c.ringling.edu/ringling-ca-ga-wiki/gdc-notes/gdc-observation-clayton-chod)). **Ders:** Duyguyu yaratan şey ters kontrasttır: kaybeden taraf söner, kazanan taraf aydınlanır.
- **Marvel Snap (gözlem):** Maç sonu sayı odaklıdır: küp sayısı ağır ve tok bir sesle tek vuruşta konur. Kart efektleri ise karakterin kişiliğini taşır ([Seasoned Gaming](https://seasonedgaming.com/2022/10/19/review-marvel-snap-the-art-of-the-cards/)).
- **Brawl Stars:** Takım modlarında her maç sonunda bir Yıldız Oyuncu seçilir ([Supercell destek](https://support.supercell.com/brawl-stars/en/articles/star-player-2.html)) ve bu ödül kaybeden takıma da gidebilir ([Trophy Coach](https://trophycoach.com/brawl-stars/guides/brawl-stars-star-player-explained)). Supercell kahramana özgü zafer pozlarını araştırıyor ([EGW](https://egw.news/gaming/news/36049/brawl-stars-survey-hints-at-new-cosmetic-customiza-9k8iX_j0z)). **Ders:** Kahramana özgü poz, genel dansın önüne geçiyor. Bizim yenilgi "sade" moduna da uyuyor.
- **Dota Underlords / Auto Chess:** Kazanılan turda kahramanlardan biri kısa bir zafer sesi çıkarır ([Inven Global](https://www.invenglobal.com/articles/8543/11-heroes-now-have-unique-voicelines-in-dota-underlords)). **Ders:** Tek bir ses ve tek bir hareket yeter.

### Öneri A: "Selam" (yavaş itme ve imza duruş)

Kamera alçaktan yavaşça yaklaşır, kahraman tek bir imza hareketi yapıp duruşunu tutar, yazı ince ve sonradan gelir. En az iş isteyen ve en yetişkin görünen öneri budur.

| Zaman | Kamera | Işık / son işlem | Zaman ölçeği | Kahraman | UI | Ses |
|---|---|---|---|---|---|---|
| 0,00 (son ölüm) | Kadraj kamerası yerinde | — | 1,0 → 0,35 (120 ms'de) | Son darbe: hit-stop 6 kare | Can çubukları 200 ms'de söner | Darbe sesi ve alçak geçiren filtre başlar (müzik boğuklaşır) |
| 0,15–0,60 | Bekler | Kaybedenlerin malzemesi %35 karartılır, doygunluk düşer | 0,35'te kalır | Ölen düşüyor (ağır çekim) | Üst ve alt letterbox bantları 0→%9 (400 ms, ease-out) | Ortam sesi kısılır, tek bir alçak "dum" |
| 0,60–1,60 | Kahramana doğru **kesme değil, hızlı ama yumuşak geçiş** (1,0 sn, ease-in-out-kübik). Hedef: göz hizasından biraz aşağı (kahraman boyunun ~%45'i), 28–32 mm muadili (fov 38–42) | Arka ışık (rim) 0→1 açılır. Anahtar ışık hafifçe kahramana çevrilir. Odak düzlemi kahramanda, arka plan bulanıklığı 0→tam | 0,35 → 1,0 (geçiş boyunca) | Hazırlık: baş hafif eğilir, kuyruk iner (anticipation, 250 ms) | — | Müzik filtresi açılır |
| 1,60–2,40 | **Dolly-in**: 1,0 sn'de mesafenin %8'i kadar yaklaşma ve 4–6° yörünge (ease-out). Kamera nefesi başlar | Ortam parçacıkları (toz, kor) odak dışında süzülür | 1,0 | **İmza hareketi** (kahramana özgü, 600–900 ms): kurt başını kaldırıp hırlar, kurbağa tek davul vurur, anka kanatlarını açıp kapatır, golem yumruğunu yere koyar. Kuyruk ve yele 100–200 ms gecikmeyle izler | — | **Vuruş 1:** hareketin tepe karesinde tok bir vurgu sesi (1 adet) |
| 2,40–2,90 | Yavaş itme sürer (0,5 sn'de %2) | — | 1,0 | Duruşa oturma: 2–3 kare küçük çökme (%3), sonra tutma | **Ad** soldan 24 px kayarak ve saydamlıktan gelir (300 ms ease-out, taşma yok). İnce, büyük harf, harf aralığı 0,2 em, 28–34 px. Altında 1 px'lik ince çizgi soldan sağa uzar | — |
| 2,90–3,60 | Sürer | — | 1,0 | Zafer boşta döngüsü: nefes, kuyruk 0,8 Hz | "MAÇIN YILDIZI" küçük üst etiket (12–13 px, %60 opak). **Sayı** 500 ms'de sayar (ease-out-kuartik); son karede 1 kare parlama (bloom) | **Vuruş 2:** sayı durduğunda tek "tık" |
| 3,60–4,20 | Sürer | — | 1,0 | — | Yan veri: "+1.240 kalkan · son vuruş" tek satır, gri | — |
| 4,20+ / dokunuş | 0,6 sn'de geri döner | Rim ve DOF söner | — | — | Bantlar 250 ms'de kapanır | Müzik normale döner |

Yenilgide aynı akış kısaltılır: ağır çekim olmaz, rim ışığı soğuk ve %50'dir, imza hareketi yerine duruş olur (baş eğik, nefes alıyor), yazı gri olur.

### Öneri B: "Son Vuruş" (ağır çekim tekrar, PotG benzeri)

Motor belirlenimci ve görüntü motoru 0,4 sn geriden izliyor (`ANIMASYON_PLANI.md` §1). Son 1,5 sn'nin olay kuyruğu saklanıp yeniden oynatılabilir.

| Zaman | Olay |
|---|---|
| 0,0–0,3 | Savaş biter. Ekran 1 kare beyaza yakın parlar (%20), letterbox kapanır. Ses: "geri sarma" yerine tek bir nefes sesi. |
| 0,3–2,3 | MVP'nin karar anı (son vuruş ya da en büyük yeteneği) **0,4× hızla** yeniden oynar. Kamera omuz arkasından alçak açıyla bakar, sonra hedefe doğru yavaşça döner (8–12°). Odak MVP'de. Darbe karesinde 10 kare hit-stop ve 40 ms'lik beyaz kenar (rim) parlaması. |
| 2,3–2,6 | Darbeden hemen sonra zaman 0,4'ten 1,0'a çıkar (150 ms). Kamera kahramanın önüne geçer (Öneri A'nın 1,60 sn'sindeki konuma). |
| 2,6–4,5 | Öneri A'nın 1,60–3,60 kısmı (imza hareketi, ad, sayı). |

Sinematik etkisi yüksektir ama iş çoktur: olay kuyruğunun saklanması, birimlerin konumlarının geri alınması ve vfx'in yeniden çalınması gerekir. Atlanabilir olmalı ve haftada bir kez görülen bir ödül gibi kullanılmalı: her maçta değil, yalnız "maçı çeviren hareket"te.

### Öneri C: "Diorama" (sahnede kalan anıt)

Kamera yukarı çıkmaz, savaş alanında kalır. Kazanan taraf canlı kalır, kaybedenler söner. MVP'nin ayağındaki taş karo yavaşça 4 cm yükselir ve kenarından ince bir ışık çizgisi geçer (yazı 3D'de, taş üstüne kazınmış gibi). Kamera 6 sn boyunca 15° yavaş yörünge yapar. Yazı HTML değil, yere düşen bir decal'dir. Satranç/masa oyunu tonuna en yakın öneri budur ama tablette küçük kalabilir. İkinci bir aşama olarak, turnuva birinciliği gibi büyük anlarda kullanılabilir.

### Benim önerim: **A**

Gerekçe: Mevcut kod (yakın plan kamerası, açı seçimi, ışın düzlemi, `zafer` durumu) A'nın %70'ini zaten yapıyor. Asıl fark ton: dansı kaldırıp tek imza hareketi koymak, yıldız ve ışınları atmak, kamerayı durdurmak yerine yavaşça itmek, kartı kaldırıp ince tipografi koymak. B daha sonra "maçı çeviren an" için bir katman olarak eklenebilir.

UI'da kart ve portre tamamen kalkmalı. Yaratık 3D'de zaten görünüyor. Sol üçte birlik alan koyu bir degradeyle (zaten var) yazıya ayrılır.

---

## 2. Kahraman animasyon katmanları

### 2.1 Katman yapısı

1. **Temel klip** (UAL/UAL2 ya da yordamsal dört ayaklı).
2. **Kök ivmesine tepki:** gövde, ivmenin tersine 2–5° yatar ve yayla geri gelir. Kuyruk, kulak ve yele bu katmandan girdi alır.
3. **İkincil zincirler:** kuyruk, kulak, yele, kanat ucu, sakal, anten. Her kemik bir öncekini yayla izler.
4. **Fidget katmanı:** rastgele aralıkla çalan küçük hareketler.
5. **Darbe katmanı:** hit-stop, beyaz parlama, ezilme, geri itilme (`hareket.js`'de zaten var: `durdur`, `ezil`, `geri`).

Kural: temel animasyon önce bitmeli. İkincil hareket bir kuvvetten doğar, kendi başına salınmaz ([AzureLib, secondary motion](https://moddedmc.wiki/en/project/azurelib/latest/docs/misc/animating/secondary_motion), [CG Wire](https://blog.cg-wire.com/follow-through-overlapping-action)).

### 2.2 Yay-sönümleyici (frekans ve sönüm ile)

`k, c` yerine frekans `f` (Hz) ve sönüm oranı `ζ` ile ayarlamak, ayarı çok kolaylaştırır ([Allen Chou](https://allenchou.net/2015/04/game-math-precise-control-over-numeric-springing), [t3ssel8r, ikinci derece dinamik](https://www.patreon.com/posts/procedural-video-82487305)).

```js
// örtük Euler: büyük dt'de de kararlı (tablet kare düşüşü)
function yayFZ(s, hedef, f, z, dt) {         // s = {x, v}
  const w = 2 * Math.PI * f, a = 1 + 2 * dt * z * w, b = dt * dt * w * w, d = 1 / (a + b);
  const x = (a * s.x + dt * s.v + b * hedef) * d;
  s.v = (s.v + dt * w * w * (hedef - s.x)) * d; s.x = x;
}
// dönüşüm: k = w², c = 2·ζ·w  (mevcut yay(s,h,k,c,dt) ile aynı)
// Ör. mevcut kuyrukYay k=90, c=9 → f ≈ 1,5 Hz, ζ ≈ 0,47
```

`ζ` seçimi: `ζ = ln(p) / (−w · t)`. Ör. salınımın %90'ının 0,5 sn'de sönmesi için 2 Hz'de `ζ ≈ 0,37` ([Allen Chou](https://allenchou.net/2015/04/game-math-precise-control-over-numeric-springing)).

### 2.3 Fazı gecikmeli zincir

```js
// her kemik bir öncekinin açısını gecikmeyle ve büyüyerek izler
// girdi: gövde açısal hızı + kök ivmesi (dünyadan yerele) + temel salınım
for (let i = 0; i < n; i++) {
  const a = (i + 1) / n;                         // 0→1 kökten uca
  const hedef = (i === 0 ? girdi : zincir[i - 1].x) * kazanc[i];
  yayFZ(zincir[i], hedef, lerp(fKok, fUc, a), lerp(zKok, zUc, a), dt);
  kemik[i].quaternion.multiply(q.setFromAxisAngle(eksen, zincir[i].x));
}
// temel salınım (boşta): sin(2π·fSal·t − i·faz)
```

Tablo değerleri, oyunlardan gözlenen hisle yukarıdaki formüllerin birleşimidir ve başlangıç ayarı olarak verilmiştir. 24 kare/sn'de kademe başına 2–4 kare gecikme ([dylantarre / follow-through](https://playbooks.com/skills/dylantarre/animation-principles/follow-through-overlapping)), 60 kare/sn'de 80–170 ms eder.

| Parça | Yay f (kök→uç) | ζ | Kademe başına faz gecikmesi | Genlik (kök / uç) | Boşta temel salınım |
|---|---|---|---|---|---|
| Kuyruk (kurt, tilki) | 3,0 → 1,8 Hz | 0,45 → 0,30 | 0,6–0,9 rad (≈ 90–140 ms) | 4–8° / 15–25° | 0,35–0,5 Hz, uçta ±10° |
| Kuyruk (sürüngen, ejder, kalın) | 2,0 → 1,2 Hz | 0,55 → 0,40 | 0,5–0,7 rad | 3–5° / 10–18° | 0,25–0,35 Hz, yere yakın |
| Kulak (uzun) | 5–7 Hz | 0,30–0,45 | uç kemik 50–80 ms | 6–15° | yok, fidget ile |
| Yele / tüy öbeği | 3,5–5 Hz | 0,40–0,60 | 40–70 ms | kuyruğun 0,3–0,5'i | nefesle 0,25 Hz |
| Kanat (katlı, anka) | 3–4 Hz | 0,55–0,70 | uç tüyler 60–100 ms | 2–5° | nefesle açılıp kapanma, 1–2° |
| Kanat çırpma | çırpma 2–3 Hz; aşağı vuruş %40, yukarı %60 | uç tüyler 0,3 ζ ile 80 ms geride | — | — | — |
| Anten, sakal, bıyık | 6–9 Hz | 0,25–0,35 | 30–50 ms | 5–12° | yok |

Kurallar:
- **Girdi kaynakları:** (1) kökün ivmesi, terse yatma: `−ivme · 0,02–0,05 rad/(m/s²)`; (2) gövde dönüş hızı: `−ω · 0,08–0,15`; (3) iniş ve çömelme: `bobHiz` (kodda var).
- Genlik **kırpılmalı** (uçta ±35°), yoksa kuyruk vurulunca bacakların içine girer. Gerekirse küre çarpıştırıcı kullanılır ([AzureLib](https://moddedmc.wiki/en/project/azurelib/latest/docs/misc/animating/secondary_motion)).
- **Sallama ≠ titreme:** sakin kahramanda temel salınım 0,6 Hz'i geçmemeli. Mevcut zafer değeri (≈2,5 Hz) 0,8–1,2 Hz'e inmeli, genlik uçta 15–20° olmalı.
- Kuyruk ucu, kök hareket ettikten 2–3 kademe sonra en büyük genliğe ulaşır. Bu "kamçı" görüntüsü, tek tek kemiklere ayrı sinüs vermekten daha canlı durur.
- Ölümde zincir sönümü 0,8'e çıkar ve yerçekimi hedefi eklenir: kuyruk yere iner, 1 küçük sekme yapar, durur.

### 2.4 Squash & stretch dozu

Hacim korunmalı: `y = 1 + s`, `x = z = 1/√(1+s)`. Ezilme ve uzama gövde kemiğine uygulanır, kökte ayakların kaymaması gerekir.

| Ton | Gövde | İniş / darbe | Not |
|---|---|---|---|
| Kut Arena (sakin, yetişkin) | %2–4 | %5–8, en fazla %10 | Yüze ve başa uygulanmamalı |
| Çizgi film (kaçın) | %10–20 | %25+ | Çocukça görünmeye yol açar |

Mevcut `ezil.x = −0,38` iniş değeri büyük. Görüntüde ~%8'i geçmemeli (kazanç ile sınırlanabilir).

### 2.5 Durumlara göre zamanlamalar

Hit-stop prensipleri: Süre hasarla artar ve bir üst sınırı vardır. Mermilerde daha kısadır. Donma sırasında vurulan taraf titrer; yerdeyse yana doğru titrer, genlik büyükten küçüğe iner. Saldıran da çok yavaş hareket etmeye devam eder ([Sakurai, Source Gaming](https://sourcegaming.info/2015/11/11/thoughts-on-hitstop-sakurais-famitsu-column-vol-490-1/), [SmashWiki: Hitlag](https://ssbwiki.com/Hitlag)). Hafif vuruşta 2 kare, mükemmel savuşturmada 12 kare; 20 kareyi geçerse hata gibi görünür ([CritPoints](https://critpoints.net/2017/05/17/hitstophitfreezehitlaghitpausehitshit/), [gamejuice](https://gamejuice.pages.dev/articles/hit-stop-frame-trick)). Hazırlık (anticipation) tasarımcı ile animatör arasındaki pazarlıktır ([Game Developer, J. Cooper](https://www.gamedeveloper.com/production/the-12-principles-of-animation-in-video-games)). Burada oyuncu birimleri doğrudan yönetmediği için hazırlık uzun tutulabilir.

| Durum | Aşama | Kare (60 fps) | ms | Not |
|---|---|---|---|---|
| **Boşta** | Nefes döngüsü | 180–240 | 3,0–4,0 sn | Göğüs %1–2 ölçek, baş 1°. 2,5 sn'lik UAL döngüsü biraz hızlı; 0,8× oynatılabilir |
| | Fidget aralığı | — | 6–14 sn, rastgele | Her birimin tohumu farklı olmalı, eşzamanlı olmamalı |
| | Fidget süresi | 30–90 | 0,5–1,5 sn | Kulak silkme (8–12 kare), baş çevirme, kuyruk kıvırma, ağırlık aktarma |
| | Göz kırpma | 6–8 | 100–130 ms | 3–7 sn arayla, bazen çift |
| **Saldırı (hafif)** | Hazırlık | 8–12 | 130–200 | Gövde geri, kuyruk ters yöne kurulur |
| | Vuruş (smear) | 2–4 | 33–67 | En hızlı kısım, hareket bulanıklığı veya iz efekti |
| | Hit-stop | 3–5 | 50–85 | Saldıran %10 hızla kayar, hedef titrer |
| | Toparlanma | 12–20 | 200–330 | Kuyruk ve yele burada gecikmeyle oturur |
| **Saldırı (ağır / yetenek)** | Hazırlık | 18–30 | 300–500 | Kamera yok; ışık hafifçe yükselir (yetenek rengi) |
| | Hit-stop | 6–10 | 100–170 | Ekran sarsıntısı (travma) yalnız burada |
| | Toparlanma | 24–36 | 400–600 | |
| **Vurulma** | Beyaz parlama | 1–2 | 17–33 | Emissive, %60–80 (tam beyaz değil) |
| | Ezilme / geri itilme | 3–5 | 50–85 | Darbe yönünde 3–6° yatma, %4 ezilme |
| | Geri dönüş | 10–18 | 170–300 | ζ 0,4, bir küçük taşma |
| **Ölüm** | Son darbe hit-stop | 8–12 | 130–200 | Maçın son ölümünde 14 kare |
| | Ağır çekim (yalnız son ölüm) | — | 300–600 | Zaman ölçeği 0,3–0,4, ardından 150 ms'de 1,0 |
| | Çöküş | 48–80 | 0,8–1,3 sn | UAL Death01'de yere çarpma 1,33 sn |
| | Yerde durma | 30–60 | 0,5–1,0 sn | Kuyruk iner, 1 sekme |
| | Çözülme | 30–48 | 0,5–0,8 sn | Aşağıdan yukarı, kor parçacıkları |
| **Zafer** | Nefes payı | 12–18 | 200–300 | Son düşmanın ölümünden sonra kısa durgunluk |
| | Hazırlık | 9–15 | 150–250 | Baş aşağı, kuyruk iner |
| | İmza hareketi | 36–54 | 600–900 | Tek seferlik, döngü değil |
| | Oturma | 18–30 | 300–500 | %3 çökme ve tutma |
| | Zafer boşta | döngü | 2,5–3,5 sn | Göğüs dik, kuyruk 0,8–1,2 Hz, ±15° |

Zafer sırasında birimler aynı anda başlamamalı: 80–150 ms arayla, MVP en son başlamalı.

---

## 3. "Orada hissetme": grafik ve atmosfer

Bütçe: tablet (Mali/Adreno orta sınıf), 60 fps, 16,7 ms. Mevcut zincir: PCF gölge, NeutralToneMapping, UnrealBloom ('yüksek'), vinyet ve doygunluk ShaderPass'i, `THREE.Fog`. Kodda `vendor/three/addons/postprocessing` içinde yalnız EffectComposer, RenderPass, ShaderPass, UnrealBloomPass, OutputPass, MaskPass var; başka bir pass gerekirse r170 örneklerinden kopyalanmalı.

İşaretler: **[UYGUN]** 60 fps tablette rahat. **[MVP]** yalnız MVP/yakın planda açılırsa uygun. **[PAHALI]** kaçınılmalı veya düşük kalitede kapatılmalı.

| Teknik | Etki | Nasıl | İşaret |
|---|---|---|---|
| **Rim / fresnel ışığı** | Siluet arka plandan ayrılır, karakter "parlar" | `onBeforeCompile` ile `pow(1 − dot(N,V), 3) · renk · güç`. Yalnız yakın planda güç 0→0,6 | **[UYGUN]** (shader'da 3 satır) |
| **Üç nokta ışık** | Hacim | Anahtar ışık (yön), dolgu ışığı (yarımküre, düşük), arka ışık (rim). MVP'de anahtar ışık 10–15° kahramana döner | **[UYGUN]** |
| **Yükseklik sisi** | Derinlik, arka planın hava perspektifi | `Fog` → `FogExp2` veya shader yaması ile yerde yoğun, yukarıda ince sis. Renk gökyüzünün ufuk rengiyle aynı | **[UYGUN]** |
| **Sahte hacimsel ışık (ışık kartları)** | God-ray hissi | Toplamalı ve gradyanlı düzlemler/koniler, gürültüyle yavaşça kayar, kameraya yaklaşınca solar. Mevcut MVP ışını bunun bir örneği; daha ince, eğik ve 2–3 katman yapılmalı | **[UYGUN]** |
| God-ray post pass (radyal bulanıklık) | Aynı his, daha gerçekçi | Tam ekran ek pass | **[PAHALI]** |
| **Ortam parçacıkları** | Havada toz ve kor, ölçek hissi | 150–300 adet `Points` veya instanced düzlem; vertex shader'da yavaş Perlin kayması, ağır kısımda %20'si odak dışı ve büyük. CPU güncellemesi gerekmez | **[UYGUN]** |
| **Renk derecelendirme** | Sinematik ton | Mevcut vinyet ShaderPass'ine ekle (ayrı pass açma): split-tone (gölge soğuk, ışık sıcak), kontrast eğrisi, gerekirse 16³ LUT dokusu | **[UYGUN]** |
| **Alan derinliği (DOF)** | "Lens" hissi, odak | `BokehPass` ([three.js docs](https://threejs.org/docs/pages/BokehPass.html), [DOF örneği](https://threejs.org/examples/webgl_postprocessing_dof2)) tam çözünürlükte pahalı. Yarım çözünürlüklü derinlik + 2 dokulu bulanıklık karışımı (yalnız arka plan) daha ucuz. Yalnız MVP sırasında açılmalı | **[MVP]** |
| **Rack focus** | Dikkati önden kahramana taşır | DOF'un odak mesafesi 0,4 sn'de değişir | **[MVP]** |
| **Zemin temas gölgesi** | Yaratık yere basar, "yüzmez" | Her birimin altına yumuşak radyal gradyanlı bir disk (decal, `multiply`), boyu birimin yerden yüksekliğiyle küçülür. PCF gölgeyi tamamlar. Three'nin ContactShadows örneği uzaktan titriyor ([forum](https://discourse.threejs.org/t/example-contact-shadows-is-blinking-artifacts/21318.md)), gerek yok | **[UYGUN]** |
| SSAO / GTAO | Köşelerde kararma | Tam ekran, derinlik ve normal gerektirir | **[PAHALI]** (yerine baked AO ve temas diski) |
| **Kamera nefesi** | "Elde tutulan" kamera, canlılık | Konuma 2–3 oktav düşük frekanslı gürültü: 0,15–0,4 Hz, ±0,5–1,5 cm; dönmeye ±0,1–0,25°. Savaşta %30, MVP'de %100 | **[UYGUN]** |
| **Travma sarsıntısı** | Darbe | `sarsıntı = travma²`, Perlin gürültü, travma zamanla azalır ([Eiserloh, GDC 2016](https://gdcvault.com/play/1023146/Math-for-Game-Programmers-Juicing)). Kodda `H.travma` var. Kutlamada kapalı | **[UYGUN]** |
| **Letterbox** | Sinema kodu, "artık izliyorsun" | CSS `::before/::after` bantları, `transform: scaleY` | **[UYGUN]** |
| **Ağır çekim** | Ağırlık | Görsel zaman ölçeği (`dtR`) ile; motor değişmez. Ses de alçak geçiren filtre ve hafif perde düşüşüyle eşlik eder | **[UYGUN]** |
| Hareket bulanıklığı (tam ekran) | Hız | Hız tamponu gerekir | **[PAHALI]** (yerine silah/pençe iz efekti) |
| **Bloom dozu** | Sihir ve ateş | Eşik yüksek tutulmalı; yalnız HDR çekirdekler parlamalı (kodda böyle). MVP'de bloom artırılmamalı, rim yeterli | **[UYGUN]** |
| Gerçek zamanlı yansıma | — | — | **[PAHALI]** |

"Orada" hissini en çok veren üçlü: **temas gölgesi + ortam parçacıkları + kamera nefesi**. Üçü birlikte ~0,3 ms sürer.

---

## 4. Uygulama sırası (en çok etki, en az iş)

| # | İş | Etki | İş yükü | Dosya |
|---|---|---|---|---|
| 1 | MVP'de **çocukça öğeleri kaldır**: yıldız patlaması, dönen ışınlar, portre, altın şerit, `yildizPop`, taşan yaylar | Çok yüksek | 1 saat | `index.html`, `arayuz.js`, `sahne3d.js` |
| 2 | Zafer **kuyruk frekansını düşür** (2,5 → 0,9 Hz, uç ±15°); `Dance_Loop` yerine tek seferlik `Yes`/imza hareketi + zafer boşta | Çok yüksek | 2 saat | `hareket.js`, `sahne3d.js` |
| 3 | **İnce tipografi**: ad, üst etiket, sayı (500 ms), tek satır gerekçe; letterbox bantları | Yüksek | 2 saat | `index.html`, `arayuz.js` |
| 4 | **Son ölümde ağır çekim + hit-stop + ses filtresi** (0,35×, 450 ms) | Yüksek | 2–3 saat | `sahne3d.js`, `ses.js` |
| 5 | MVP kamerası: **yavaş itme + 4–6° yörünge + kamera nefesi** (durmak yerine) | Yüksek | 2 saat | `sahne3d.js` `mvpKarisim` |
| 6 | **Rim ışığı** (fresnel yaması), yalnız yakın planda | Yüksek | 2 saat | `gorunum.js` |
| 7 | **Temas gölgesi diski** her birime | Orta-yüksek (her an görünür) | 2 saat | `sahne3d.js` |
| 8 | **Ortam parçacıkları** (GPU'da kayan toz/kor) | Orta-yüksek | 3 saat | `vfx.js` |
| 9 | Yay parametrelerini **f/ζ'ye çevir**, kuyruk/kulak/yele için 2.3'teki tablo; kök ivmesi girdisi | Orta-yüksek | 4–6 saat | `hareket.js` |
| 10 | **Fidget katmanı** (kulak silkme, göz kırpma, ağırlık aktarma), tohumlu ve eşzamansız | Orta | 4 saat | `hareket.js` |
| 11 | **Renk derecelendirme** (mevcut vinyet pass'ine split-tone) | Orta | 1–2 saat | `gorunum.js` |
| 12 | Squash ve stretch dozunu sınırla (≤%8), vurulma parlamasını %70'e indir | Orta | 1 saat | `hareket.js` |
| 13 | MVP'de **DOF + rack focus** (yarım çözünürlük, yalnız 'yuksek') | Orta | 4–6 saat | `gorunum.js` |
| 14 | Kahramana özgü **imza hareketleri** (her yaratık için 1 adet) | Yüksek ama pahalı | yaratık başına 0,5–1 gün | `hareket.js`, modeller |
| 15 | Öneri B: **son vuruş tekrarı** | Yüksek, nadir | 2–3 gün | motor kuyruğu, `sahne3d.js` |

İlk 5 madde bir günde biter ve kullanıcının "çocukça" şikâyetinin büyük kısmını giderir.

---

## Kaynaklar

- Overwatch Wiki, Play of the Game: https://overwatch.fandom.com/wiki/Play_of_the_Game
- Game Developer, PotG tasarımı: https://gamedeveloper.com/design/designing-and-improving-i-overwatch-i-s-play-of-the-game-highlights
- Dexerto, öne çıkan girişlerin yapımı: https://www.dexerto.com/overwatch/overwatch-player-discovers-secret-about-how-highlight-intros-are-made-1310666
- Kotaku, Overwatch giriş animasyonları: https://kotaku.com/how-overwatch-highlight-animations-are-made-1792608768
- 80.lv, David Gibson / Mei: https://80.lv/articles/david-gibson-animating-mei-in-overwatch
- GDC Vault, The Animation Pipeline of Overwatch: https://www.gdcvault.com/play/1024267/The-Animation-Pipeline-of-Overwatch
- GamesRadar, Overwatch kartları ve oylama: https://gamesradar.com/how-overwatch-is-inspiring-good-sportsmanship-through-a-broken-feature
- Dexerto, OW2 maç sonu kartları: https://dexerto.com/overwatch/overwatch-devs-want-post-game-match-cards-to-be-more-meaningful-in-ow2-2088661
- TFT tasarım ilkeleri: https://teamfighttactics.leagueoflegends.com/en-gb/news/dev/dev-design-pillars-of-tft
- TFT 14.20 (yıldız yükseltme anında): https://www.mobafire.com/league-of-legends/news/tft-14-20
- Riot, LoR seviye atlama animasyonları: https://riotgames.com/en/news/from-champ-select-to-your-deck
- Behance, LoL Victory/Defeat: https://www.behance.net/gallery/53065555/League-of-Legends-Victory-Defeat
- Hearthstone GDC notu (Peggle katarsisi): https://sites.google.com/a/c.ringling.edu/ringling-ca-ga-wiki/gdc-notes/gdc-observation-clayton-chod
- Marvel Snap, kart sanatı: https://seasonedgaming.com/2022/10/19/review-marvel-snap-the-art-of-the-cards/
- GDC Vault, Designing MARVEL SNAP: https://www.gdcvault.com/play/1029024/Designing-MARVEL-SNAP
- Brawl Stars Yıldız Oyuncu: https://support.supercell.com/brawl-stars/en/articles/star-player-2.html ve https://trophycoach.com/brawl-stars/guides/brawl-stars-star-player-explained
- Brawl Stars kutlama pozu anketi: https://egw.news/gaming/news/36049/brawl-stars-survey-hints-at-new-cosmetic-customiza-9k8iX_j0z
- Underlords zafer sesleri: https://www.invenglobal.com/articles/8543/11-heroes-now-have-unique-voicelines-in-dota-underlords
- Sakurai, hitstop: https://sourcegaming.info/2015/11/11/thoughts-on-hitstop-sakurais-famitsu-column-vol-490-1/
- SmashWiki, Hitlag: https://ssbwiki.com/Hitlag
- CritPoints, hitstop: https://critpoints.net/2017/05/17/hitstophitfreezehitlaghitpausehitshit/
- Hit stop kare hilesi: https://gamejuice.pages.dev/articles/hit-stop-frame-trick
- J. Cooper, Game Anim, 12 ilke: https://www.gamedeveloper.com/production/the-12-principles-of-animation-in-video-games
- Allen Chou, sayısal yay: https://allenchou.net/2015/04/game-math-precise-control-over-numeric-springing
- t3ssel8r, Giving Personality to Procedural Animations using Math: https://www.patreon.com/posts/procedural-video-82487305
- AzureLib, ikincil hareket: https://moddedmc.wiki/en/project/azurelib/latest/docs/misc/animating/secondary_motion
- Follow-through ve overlapping action: https://blog.cg-wire.com/follow-through-overlapping-action ve https://playbooks.com/skills/dylantarre/animation-principles/follow-through-overlapping
- David Rosen, An Indie Approach to Procedural Animation (GDC 2014): https://gdcvault.com/play/1020049/Animation-Bootcamp-An-Indie-Approach
- Squirrel Eiserloh, Juicing Your Cameras With Math (GDC 2016): https://gdcvault.com/play/1023146/Math-for-Game-Programmers-Juicing
- Vlambeer, Art of Screenshake (yeniden yapım dökümü): https://dkliao.itch.io/the-art-of-screenshake-recreation/devlog/451576/quick-breakdown-of-all-the-effects
- three.js BokehPass: https://threejs.org/docs/pages/BokehPass.html
- three.js DOF örneği: https://threejs.org/examples/webgl_postprocessing_dof2
- three.js ContactShadows titreme sorunu: https://discourse.threejs.org/t/example-contact-shadows-is-blinking-artifacts/21318.md
