# Ray: Metro Bulmaca — Reklam Kampanyası Planı

> **ANA SENARYO: 5.000 TL/ay (kullanıcı onayladı).** Kur **TAHMİN**: ~40 TL/$ varsayımıyla 5.000 TL ≈ **125 $/ay ≈ 4 $/gün (günlük ~165 TL)**; kur 33-50 TL/$ arasında oynarsa 100-150 $. Düşük/Orta/Yüksek ek senaryolar: **5.000 / 15.000 / 40.000 TL**. Bütün CPI/indirme/gelir rakamları **TAHMİN** (kaynaklar §1/§3/§7); gerçek veri ilk 2 hafta sonra bu belgedeki tahminlerin yerini alır. Hiçbir hesaba girilmedi, hiçbir reklam başlatılmadı, para harcanmadı; her şey öneridir.
>
> **Kararlar (kullanıcı):** (1) Bütçe küçük → **1-2 kanalda yoğunlaş**, çok kanala bölme. (2) **Türkiye kesin öncelik**; öteki ülkeler ucuz yollardan (Tier 3 test pazarları, oyunun 9 dili, organik/ASO). (3) Kreatifler **yalnız ekran kaydı + yazı + müzik** (yüz ve ses yok). (4) **Playable reklam** ilgi çekiyor → ayrı bölüm §4.5. (5) Sosyal: Instagram var; TikTok ve Reddit açılacak; **YouTube ve X kullanılmayacak** (bu belgede de yok).
>
> **Dürüst ön sonuç (§7):** mevcut gelir modeliyle (AdMob geçiş + ödüllü + 2,99 $ Reklamsız ve küçük IAP) Türkiye'de bile CPI tahmini LTV'nin birkaç katı (TR ARPDAU çok düşük). 5.000 TL, **kâr aracı değil, 4-6 haftalık öğrenme + marka koruma + ilk değerlendirme/sıralama yatırımı**dır. **Platform asgari eşikleri:** Apple Ads bu bütçeye uyar; **Google App Campaigns uymaz** (günlük bütçe ≈ 50 × hedef CPI kuralı; TR Android tCPI 0,10-0,15 $ → 5-7,5 $/gün ≈ 200-300 TL > toplam günlük bütçeniz). Ayrıntı §3.3.
>
> Tarih bağlamı: bugün 20 Kasım 2026. App Store'da yayında (id6831928554), Google Play 21 Kasım 2026'da açılıyor (`com.osmanadali.ray`). Kasım-Aralık reklam maliyetlerinin en pahalı dönemi; ölçek kararını Ocak'a bırakmak meşru.

İçindekiler: 0 Ölçüm gerçeği · 1 Kanal sırası · 2 Kampanya yapıları · 3 Bütçe senaryoları · 4 Kreatif ve playable · 5 Test/ölçekleme · 6 Dönüşüm takibi · 7 Gelir/LTV · 8 Hazırlık listesi

---

## 0. Ölçüm gerçeği (her kararı belirler)

Kodda (`www/olcum.js`, `docs/YAYIN.md` §5) şu tasarım var; kampanya planı buna uymak zorunda:

| Durum | Sonuç | Kampanyaya etkisi |
|---|---|---|
| UMP `REQUIRED/OBTAINED` bölgeler (AB/AEA, BK, İsviçre, ABD eyalet mesajı gösterilen kullanıcılar) | Firebase toplama **kapalı**, olaylar atılıyor | Bu ülkelerden gelen oyuncuların seviye/öğretici/gelir verisi **yok**. Yalnız mağaza konsollarının (App Store Connect, Play Console) ve reklam platformunun kendi yükleme sayıları var. |
| `ad_storage`, `ad_user_data`, `ad_personalization` **her yerde reddedilir** | Firebase olayları reklam platformlarına "reklam ölçümü" için kullanılamaz; Google Ads'in in-app olay içe aktarımı/derin olay optimizasyonu büyük olasılıkla **çalışmaz** (yeni Google tüketici rızası kuralları ad_user_data ister; Google'dan doğrulayın) | **Derin olaya (tutorial_complete, level_end≥X) ya da tROAS'a göre optimize etmek bugün gerçekçi değil.** Optimizasyon hedefi yükleme (tCPI / Maximize installs / Apple CPT+CPA hedefi) olur. |
| IDFA kullanılmıyor, ATT reddi ölçümü etkilemez | iOS'ta kullanıcı düzeyi kampanya atfı yok | ASA atfı için AdServices (kimliksiz) + SKAdNetwork/AdAttributionKit gerekir; ikisi de **bugün uygulamada yok** (kod değişikliği, §6.5 "geliştiriciye öneri"). |
| Meta / TikTok SDK'sı yok, MMP (AppsFlyer/Adjust/Singular vb.) yok | Meta ve TikTok yüklemeleri atfedemez, optimize edemez | Meta ve TikTok **MMP ya da resmi SDK olmadan ciddi biçimde çalıştırılamaz** → önceliği düşük, koşullu (§1, §2.3-2.4). |

Sonuç: bugün **ölçülebilir ve gerçekçi** olanlar: (1) Apple Ads (kendi panosu yükleme sayar; atıf için SDK gerekmez), (2) Google App Campaigns'te **Google Play yükleme** dönüşümü (Play Console bağlantısı yeter, Firebase gerekmez), (3) coğrafya bazlı kalite okuma: kampanyayı ülke ülke ayırıp Firebase'deki ülke düzeyi öğretici tamamlama / D1 oranını (yalnız UMP gerektirmeyen ülkelerde) taban çizgisiyle karşılaştırmak.

---

## 1. Kanal öncelik sırası ve gerekçe

5.000 TL/ay için **tek kanal + küçük pilot** önerilir; kanalları bölmek her birini öğrenme eşiğinin altında bırakır.

| Sıra | Kanal | Ne zaman | Gerekçe |
|---|---|---|---|
| **1 (tek ana kanal)** | **Apple Search Ads (Apple Ads) — Türkiye** | Hemen (iOS yayında) | Niyet yüksek; asgari bütçe eşiği yok; SDK'sız yükleme/CPT/CPA raporu; marka aramasını korur; Custom Product Page ile mesaj testi; TR'de CPT tahminen düşük. Dezavantaj: Türkiye'de iOS payı Android'den küçük, aranma hacmi sınırlı (bütçeyi tüketemeyebilirsiniz). |
| 2 (koşullu) | **Google App Campaigns — Türkiye/Android** | Bütçe **≥ ~15.000 TL/ay** olunca ya da ASA'dan sonra tek seferlik 2 haftalık patlama; Play açılışından ≥ 7 gün sonra | Android Türkiye'nin ana hacmi ve en ucuz yükleme; ama eşik kuralı (~50 × tCPI) 5.000 TL'de sağlanmaz. Yükleme dönüşümü Play Console bağlantısıyla SDK'sız ölçülür. |
| 3 (organikte kazanan çıkınca) | **Meta (Instagram) Advantage+** | Organik Instagram/TikTok'ta kazanan video çıkınca, küçük test (~1.500-3.000 TL) | MMP/SDK olmadığı için yükleme optimizasyonu yok; yalnız **trafik/etkileşim** hedefli test yapılabilir (§2.3). |
| 4 | **TikTok App Campaigns** | 3 ile aynı koşul + MMP | Yalnız organik TikTok hesabı kazanan videoyu kanıtladıktan sonra; MMP şart. |

**Öteki ülkeler (ucuz yollar):** ücretli bütçe yerine (a) 9 dilde mağaza ASO/yerelleştirme, (b) organik video (Instagram, TikTok, Reddit; §4.6), (c) ASA'da yalnız **1.000 TL'lik** BR/MX pilotu (isteğe bağlı), (d) Orta/Yüksek senaryoda Google T3/T2.

Kaynaklar (rakamların dayanağı; hepsi "tahmin" olarak kullanılır):
- Apple Ads kıyasları: https://www.apptweak.com/en/aso-blog/apple-ads-benchmarks (ABD oyun medyan CPI ~4,63 $; Discovery ~1,34 $ – Competitor ~8,69 $; Kasım CPT tepe noktası)
- Admiral Media ASA kıyasları (casual oyun CPI 0,60-1,60 $, TTR %8-14, kurulum dönüşümü %55-70): https://admiral.media/apple-search-ads-benchmarks/
- Oyun UA maliyetleri: https://foxdata.com/en/blogs/2026-mobile-game-user-acquisition-cost-benchmarks-how-much-should-you-spend/ · https://gamegrowthadvisor.com/blog/2026-03-17-user-acquisition-cpi-benchmarks-2026/
- AppsFlyer oyun kıyas tablosu (bulmaca ABD iOS ~9,48 $, Android ~4,81 $; tarih/yöntem doğrulanmalı): https://www.appsflyer.com/?p=549948
- Google App Campaigns bütçe kuralları (üçüncü taraf özetleri; Google yardım sayfasında doğrulayın): https://adapty.io/blog/google-app-campaigns-playbook-2025/ · https://www.rocketshiphq.com/google-app-campaigns-uac-complete-guide/
- ARPDAU/tutundurma: https://blog.playio.co/arpdau-benchmarks-mobile-games · https://gamegrowthadvisor.com/blog/2026-03-17-mobile-game-kpis-benchmarks-2026/

Kaynaklar birbiriyle çelişiyor; aralıklar bilinçli geniş. **Türkiye'ye özgü güvenilir CPI/CPT kıyası bulunamadı**: TR rakamları gelişen pazar çıkarımıdır (TAHMİN).

---

## 2. Kanal başına kampanya yapısı

### 2.0 Ortak hedefleme kuralları

**Ülke grupları** (kullanıcı kararı: **Türkiye kesin öncelik**; öteki ülkeler ucuz test):

| Grup | Ülkeler | Dil/kreatif | Firebase ölçümü |
|---|---|---|---|
| **TR (öncelik)** | Türkiye | tr | Açık (UMP gerekmez) |
| **T3 test pazarları** (sonra, ucuz) | Brezilya (pt-BR), Meksika (es), yalnız ASA/Google'da ≥ 15.000 TL bütçeyle; ilgili Tier 3 ülkeler | pt-BR / es / en | Açık |
| T2 (yalnız Yüksek) | Japonya, G. Kore, Tayvan | ja / ko / zh-Hant | Açık (AdMob yanıtını doğrulayın) |
| T1 (bu bütçede yok) | ABD/Kanada/Avustralya + AB/BK (de, fr, es) | en/de/fr/es | T1-B (BK, AB, İsviçre) **kapalı** (UMP) |


Her kampanya **tek dil + tek ülke grubu** olsun; kreatif dili mağaza sayfası diliyle aynı olsun (9 dil: tr, en, de, es, pt-BR, fr, ko, ja, zh-Hant).

**Cihaz:** iOS'ta iPhone + iPad ayrı raporlanır (iPad 1.1'den beri destekli; ilk testte hepsi açık, 2 hafta sonra CPI farkına göre ayır). Android'de telefon; tablet ve Android sürüm alt sınırı Play'deki ile aynı.

**Yaş ve çocuk ayarları:** Oyun 13+ ve çocuklara yönelik değil. Reklam hedeflemesini **18+** tutun (platformlar zaten 18 altına uygulama reklamı hedeflemesini kısıtlar; 13-17 yaşa bilerek reklam göstermeyin). Google Ads / Play'de uygulamayı "çocuklara yönelik / Aileler programı" olarak işaretlemeyin; Play Console hedef kitle 13+ ile uyumlu kalsın. Meta ve TikTok'ta uygulamayı çocuk kategorisi saymayın, yaş alt sınırı 18 olsun. Reklam kreatifinde çocuk, çizgi film karakteri, "kids" dili yok. Bu ayarların her platformdaki tam adı değişebilir; hesap açılınca arayüzde doğrulayın.

**Kitle:** yalnız "yeni kullanıcılar"; mevcut oyuncuları hariç tutun. Rıza bölgelerinde ek ayar gerekmez (kullanıcı hedeflemesi platformun kendi verisiyle yapılır, uygulamanın reddettiği reklam rızası bunu değiştirmez; ancak hedefleme kalitesi ve ölçüm sınırlı kalır).

### 2.1 Apple Search Ads (Apple Ads) — Advanced

Ağaç (kampanya → reklam grubu):

```
Ray-ASA-{ülke grubu}            (örn. Ray-ASA-T1A-en, Ray-ASA-T3-tr)
├── 01-Marka          (Exact)    ray metro bulmaca, ray metro, ray puzzle
├── 02-Rakip          (Exact)    rakip uygulama adları (aşağıdaki kurallar)
├── 03-Kategori       (Exact)    bulmaca / boru / metro / karo döndürme terimleri
├── 04-Kesif-Broad    (Broad)    kategori kelimeleri, geniş eşleşme, negatifli
└── 05-Kesif-SearchMatch (Search Match açık, anahtar kelimesiz)
```

Hedef: **yükleme**. Teklif: ağırlıklı **CPT max teklif** + reklam grubunda **CPA hedefi** (Apple Ads "CPA goal" seçeneği varsa). Başlangıç: ilk 14 gün CPT sabit, günlük bütçe = hedef CPI × 10-20 yükleme. CPT başlangıç teklifleri (TAHMİN, hesaptaki "önerilen teklif" aralığını esas alın): marka 0,3-0,8 $, kategori T1 0,8-2 $, T3 0,05-0,3 $.

**Anahtar kelime grupları**

- **Marka (Exact):** `ray metro bulmaca`, `ray metro`, `ray puzzle`, `ray metro puzzle`. Amaç: marka aramasını korumak ve başkasına kaptırmamak; düşük teklif, yüksek dönüşüm. Organik zaten üstteyse bütçeyi minimumda tut.
- **Kategori (Exact), örnek:** en: `pipe puzzle`, `pipe game`, `connect the pipes`, `rotate puzzle`, `tile rotation puzzle`, `subway puzzle`, `metro puzzle`, `relaxing puzzle`, `offline puzzle games`, `one hand puzzle`, `logic puzzle`. tr: `boru bulmaca`, `bulmaca oyunları`, `metro oyunu`, `çevrimdışı oyunlar`, `zeka oyunları`, `rahatlatıcı oyunlar`. de/fr/es/pt/ko/ja/zh-Hant: aynı kavramları mağaza ASO anahtar listesiyle (`docs/MAGAZA.md`) eşleştirerek yerel dilde ekleyin; çeviri kelimelerini canlı arama önerisiyle doğrulayın.
- **Rakip (Exact):** türün öne çıkan uygulama adları (örn. Mini Metro, Flow Free, Pipe Mania, Water Connect türü). **Kurallar ve riskler:**
  1. Apple Ads'te başkasının uygulama adına anahtar kelime olarak teklif vermek genelde mümkün; reklam metni **Apple tarafından kendi mağaza sayfanızdan** üretilir, yani rakip adını reklamda kullanmazsınız. Rakip adını **metadata'ya, ekran görüntüsüne, reklam görseline yazmayın**; bu mağaza ve marka kuralı ihlalidir.
  2. Marka sahibi Apple'a şikayet edebilir (ticari marka); nadiren reklam kaldırılabilir. Rakip kampanyayı ayrı kampanya/reklam grubunda tutun ki marka kampanyanız etkilenmesin.
  3. Genelde pahalıdır (AppTweak'te Competitor tipi 8,69 $ medyan CPI) ve dönüşüm düşüktür; bütçenin en fazla %10-15'i, ilk 2 hafta sonunda CPI hedefin %150'sini aşıyorsa kapat.
  4. Rakip adı "adlandırıcı" olduğunda yanlış izlenim yaratmamak için, sayfanızın (özellikle Custom Product Page) rakiple karıştırılabilecek içerik göstermediğinden emin olun.
  5. Yasal tavsiye değil; ciddi bir marka itirazı gelirse kampanyayı durdurup mali/hukuk danışmanına sorun.
- **Keşif:** `04` Broad + `05` Search Match; amaç yeni aranan terimleri bulmak. Haftalık: Arama terimleri raporundan ≥ 3 yükleme getiren, düşük CPI'lı terimleri `03`'e **Exact** olarak taşı; alakasızları negatif yap.
- **Negatif kelimeler (kampanya düzeyi, Exact + Broad):**
  - Hile/yasadışı: `hack`, `mod`, `apk`, `cheat`, `unlimited`, `free robux`, `crack`
  - Yanlış "metro": `subway surfers`, `metro exodus`, `metro simulator`, `train simulator`, `bus`, `ticket`, `metro bilet`, `istanbul metro`, `metrobüs`, `metro harita`, `akbil`, `transit`, `route planner`, `navigation`
  - Alakasız tür: `casino`, `slots`, `poker`, `coloring`, `cooking`, `shooter`, `fps`, `rpg`, `idle clicker`, `match 3` (hedef değil; test edilebilir)
  - Çocuk odaklı: `kids`, `toddler`, `baby game`, `for kids` (13+ konumuyla uyum)
  - Marka kampanyasında kategori terimleri, kategori kampanyasında marka terimleri (kendi kendine rekabeti engelle)

**Custom Product Page (CPP):** her reklam grubu için ayrı CPP (örn. "Marka: genel", "Kategori: sakin", "Rakip: Net bulmaca mantığı" — rakip adı olmadan). Bkz. §6.6.

### 2.2 Google App Campaigns (UAC) — Android (iOS sonra)

```
Ray-GAC-AND-{grup}-{dil}
├── Kampanya: Ray-GAC-AND-T3-tr    (hedef: yükleme, tCPI)
├── Kampanya: Ray-GAC-AND-T2-mix   (BR/MX ayrı dil; JP/KR/TW ayrı kampanyalar)
└── Kampanya: Ray-GAC-AND-T1A-en   (yalnız Orta/Yüksek'te ve eşik karşılanırsa)
```
Her kampanyada birden çok **varlık grubu** (asset group): 5 görsel + 4-5 video (9:16, 1:1, 16:9) + 5 başlık + 5 açıklama; dil = kampanya dili.

- **Hedef:** Başlangıç **"Yükleme" (Install volume) + hedef CPI (tCPI)**. Google Play yükleme dönüşümü Play Console'daki Google Ads bağlantısıyla gelir; Firebase gerekmez.
- **Derin olay hedefi (sonra):** `tutorial_complete` ve ardından `level_end≥X` (X, Firebase'de "Create event" ile oluşturulan `level_10` gibi özel olay) → tCPA, sonra tROAS. Bunun için **ad_user_data rızası ve Firebase↔Ads bağlantısı** gerekir; ikisi bugün kapalı ve kapalı kalmaları gizlilik beyanlarıyla tutarlı (§6.2). Yani bu adım **geliştirici/gizlilik kararı bekler**; plan: önce yükleme, derin olay değil.
- **Hedefleme:** konum "Konumda bulunan veya ilgilenen" yerine yalnız "bulunan"; dil kampanya diline; cihaz Android; "Çocuklara yönelik" işaretlemeyin; yaş zaten uygulama kampanyalarında kısıtlı sayılır, 18+ tutun.
- **Teklif:** tCPI hedefi = pazarlama hedef CPI'nızın %80-100'ü (ilk 2 hafta Google'a öğrenme alanı bırakmak için hedefi gevşek tutun). **Öğrenme dönemi:** ilk ~1-2 hafta; bu sürede hedef/bütçeyi %20'den fazla oynatmayın.
- **Platform eşikleri (Google belgelerine göre yaklaşık, hesapta doğrulayın):** günlük bütçe ≥ ~**50 × hedef CPI** (yükleme kampanyası; örn. tCPI 0,5 $ → ≥ 25 $/gün); uygulama içi olay hedefinde ≥ ~**10 × hedef CPA** ve olay başına yeterli hacim (haftada ~50 dönüşüm). Eşiğin altında kampanya "öğrenme sınırlı" kalır.
- Play açılışı sonrası ilk günler: mağaza dönüşümü (CVR) ve değerlendirme sayısı düşük olabilir; ilk 5-7 gün organik/yakın çevre ile en az ~20-50 yorum/puan biriktirmek CPI'yı düşürür.

### 2.3 Meta Advantage+ App Campaigns — **MMP gelince**

```
Ray-META-AAC-{iOS|AND}-{grup}
└── Advantage+ App Campaign (hedef: Uygulama yüklemeleri; sonra "Uygulama olayları" – MMP ile)
    └── tek reklam seti (otomatik), 10-15 kreatif
```
- Önkoşul: Meta SDK ya da MMP (SKAN dönüşüm değeri, Android atıf). SDK/MMP olmadan başlamayın; aksi halde bütçe optimize edilemez, ölçülemez.
- Hedefleme: ülke grubu, dil, 18+, otomatik yerleşimler (Reels/Stories/Feed); iOS'ta SKAN limitleri nedeniyle günlük bütçe ≥ ~hedef CPI × 50.
- Sakin/tatmin edici bulmaca videosu Reels'te iyi gider; kreatif testi §4/§5.

### 2.4 TikTok App Campaigns — **MMP gelince, yalnız Yüksek senaryoda**

```
Ray-TT-APP-{grup}
└── App Promotion (Smart+ / otomatik) → 8-12 video (9:16)
```
- Önkoşul: MMP/TikTok SDK. Yaş 18+, çocuk kategorisi değil. Müzik yalnız TikTok Commercial Music Library veya kendi/lisanslı ses.
- Beklenti: düşük CPI, ancak ARPDAU'su düşük kullanıcı kalitesi riski; ilk test küçük ve yalnız T2/T3.

---

## 3. Bütçe senaryoları

> **TAHMİN.** Bütçe, CPI ve indirme sayıları senaryodur; gerçek sonuçlar bunun çok altında/üstünde çıkabilir. Kaynaklar §1'de. Aylık = günlük × 30.

### 3.1 Beklenen CPI aralıkları (TAHMİN, $)

| Kanal / platform | T1-A | T1-B | T2 | T3 (TR) |
|---|---|---|---|---|
| Apple Ads (iOS) | 1,5 – 4,5 | 1,5 – 4,0 | 0,8 – 2,5 | 0,2 – 0,8 |
| Google (Android) | 1,5 – 4,0 | 1,2 – 3,5 | 0,4 – 1,5 | 0,1 – 0,4 |
| Meta (koşullu) | 2,0 – 6,0 | 2,0 – 5,0 | 0,6 – 2,0 | 0,15 – 0,6 |
| TikTok (koşullu) | 1,5 – 5,0 | 1,5 – 4,5 | 0,5 – 1,8 | 0,1 – 0,5 |

Notlar: Kaynaklar çelişkili: AppTweak ABD oyun medyan ASA CPI 4,63 $; Admiral casual 0,60-1,60 $; AppsFlyer tablosunda bulmaca ABD iOS 9,48 $ / Android 4,81 $; Türkiye/Hindistan benzeri pazarlar çok daha ucuz. iOS genelde Android'den pahalı. Kasım-Aralık pahalı, Ocak-Şubat ucuzlar (AppTweak CPT mevsimselliği).

### 3.2 Senaryolar

| | **Düşük** (öğrenme testi) | **Orta** | **Yüksek** |
|---|---|---|---|
| Günlük | **15 $** | **60 $** | **200 $** |
| Aylık (×30) | **450 $** | **1.800 $** | **6.000 $** |
| Apple Ads | 15 $: T1-A 9 · T2 4 · T3 2 | 30 $: T1-A 14 · T2 10 · T3 6 | 70 $: T1-A 35 · T2 20 · T3 15 |
| Google (Android) | — (min. bütçe eşiği nedeniyle yok; ya da yalnız T3 tCPI 0,2 $ ile ≥ 10 $/gün) | 30 $: T2/T3 karma (tCPI ~0,6 $ → ≥ 30 $) | 60 $: T2/T3 + T1-A yalnız eşik sağlanırsa |
| Meta | — | — | 50 $ **(MMP şartıyla; yoksa Google'a)** |
| TikTok | — | — | 20 $ **(MMP şartıyla; yoksa Google'a)** |
| Günlük beklenen indirme (**TAHMİN**) | **6 – 21** | **45 – 150** | **130 – 470** |
| Aylık beklenen indirme (**TAHMİN**) | **~180 – 630** | **~1.350 – 4.500** | **~4.000 – 14.000** |
| Karma CPI (tahmin) | ~0,7 – 2,5 $ | ~0,4 – 1,3 $ | ~0,4 – 1,5 $ |

Hesap yöntemi: kanal×ülke grubu bütçesi ÷ §3.1 CPI aralığının uç değerleri; ilk sayı pahalı uç (CPI yüksek), ikinci ucuz uç. Gerçek dağılım T3 (Türkiye) payına çok bağımlıdır: indirme sayısını şişiren ama gelir getirmeyen bölge o. Bütçeyi iOS/T1-A'dan çok kaydırırsanız indirme belirgin düşer, LTV biraz yükselir.

**Öğrenme dönemi / platform eşikleri:** Google App Campaigns günlük bütçe ≈ 50 × hedef CPI (ve olay hedefinde ≈ 10 × hedef CPA); eşik altı = yavaş öğrenme. Apple Ads'te asgari yok ama haftada anahtar kelime başına 5-10 yükleme yoksa teklif kararı gürültüdür. Meta ve TikTok için "haftada ~50 optimizasyon olayı" kuralı; iOS'ta SKAN eşikleri nedeniyle daha da yüksek.

**Önerilen yol:** Düşük senaryo, 2-3 hafta → gerçek CPI, D1/D7, ARPDAU. Gelir tahmini (§7) tutmazsa, Orta'ya geçmeyin; ürün/monetizasyon iyileştirmesi ya da yalnız marka-koruma bütçesi (günde 3-5 $ ASA marka) daha akıllıca.

---

## 4. Kreatif listesi

**Kural (kesin):** Bütün video ve görseller **Ray'in gerçek oyun görüntüsünden** (ekran kaydı/ekran görüntüsü) üretilir. Oyunda olmayan oynanış, sahte "kazan/kaybet" ekranı, sahte bildirim, sahte kullanıcı yorumu, sahte ödül/para, "fake ad" tarzı yanıltıcı kurgu **yasak**. Görüntü içinde yalnız oyunda gerçekten var olan özellikler: karo döndürme, öğretici, günün hattı, 33 kural hattı + sonsuz karma, şehir metro haritası, haftalık lig, canlı kapışma (1.2), çevrimdışı oynanış, tek elle oynanış.

### 4.1 Video (en az 12)

| # | Ad | Kanca (ilk 3 sn) | Süre | Format | Mesaj | CTA | Dil |
|---|---|---|---|---|---|---|---|
| V1 | Tek dokunuş | Karışık ağ, tek dokunuşla hat bağlanır | 15 sn | 9:16 | Sakin, tatmin edici bağlantı | "Ücretsiz oyna" / Play | tr, en |
| V2 | Tek el | Parmak tek elle metroda oynar (gerçek ekran kaydı + el çekimi) | 15 sn | 9:16 | Tek elle, yolda | "Şimdi indir" | tr, en, ja |
| V3 | Çevrimdışı | "İnternet yok mu? Sorun değil." uçak modu açık ekranı | 15 sn | 9:16 | İnternetsiz oyun | "Ücretsiz indir" | tr, en, de, fr |
| V4 | Metro haritası | Boş şehir haritası dolar | 20 sn | 9:16 + 1:1 | Her hat bitince şehir büyür | "Metronu kur" | en, ja, ko |
| V5 | 3 sn bulmaca | Yanlış bağlı hat, doğru bağlanınca ışık yanar | 10 sn | 9:16 | Doğru bağlayınca tatmin | "Dene" | tr, en, zh-Hant |
| V6 | Öğretici | Yeni oyuncu ilk bölümü adım adım | 30 sn | 9:16 | "Öğrenmesi 1 dakika" | "Hemen başla" | tr, en, es, pt-BR |
| V7 | Kapışma | Canlı kapışma anı (gerçek ekran kaydı) | 20 sn | 9:16 | Rakibe karşı hız | "Rakibini bul" | tr, en, ko |
| V8 | Haftalık lig | Lig sıralaması + yükseliş | 15 sn | 9:16 | Haftalık yarış | "Ligde yarış" | tr, en, de |
| V9 | ASMR/sakin | Yalnız oyun sesi, yazı yok, dönüşler | 20 sn | 9:16 | Sakin, stres atma | "Rahatla" | tüm diller (yazısız) |
| V10 | 7 yeni hat | Yeni hat türleri montaj (Ekspres durak, Sinyal, Sarsıntı...) | 20 sn | 9:16 + 16:9 | 1.2 yenilik | "Güncelle/Oyna" | tr, en, de, fr |
| V11 | Zorluk eğrisi | Kolay → zor 5 bölüm hızlı geçiş | 25 sn | 1:1 | "Zihnin için" | "İndir" | en, de, es |
| V12 | Ödüllü tanıtım yok / reklamsız | "Reklamsız paketle sessiz yolculuk" (gerçek mağaza ekranı) | 15 sn | 9:16 | Reklamsız seçenek var, zorunlu değil | "Ücretsiz dene" | tr, en |
| V13 | Gerçek oyuncu tepkisi | **Yalnız gerçek, izinli** oyuncu yorumu/tepkisi (yoksa üretme) | 20 sn | 9:16 | Sosyal kanıt | "Dene" | en, tr (izin gelirse) |
| V14 | Playable ekran kaydı | Playable tarzı interaktif seri | 20 sn | 1:1 + 16:9 | "Sen de dene" | "Oyna" | en |

(V13 yalnız gerçek ve yazılı izinli içerikle; yoksa listeden çıkarın. Sahte yorum/oyuncu üretmeyin.)

### 4.2 Görsel (en az 6)

| # | Ad | İçerik | Format | Mesaj | CTA | Dil |
|---|---|---|---|---|---|---|
| G1 | Hero harita | Doldurulmuş şehir metro haritası ekran görüntüsü | 1:1, 9:16 | "Metronu bağla" | "Ücretsiz indir" | tr, en |
| G2 | Önce/sonra | Karışık karo → bağlı hat (iki gerçek ekran görüntüsü yan yana) | 1:1, 16:9 | "Doğru bağla" | "Dene" | tr, en, de |
| G3 | Hat çeşitliliği | 7 yeni hat simgeleri (gerçek arayüzden) | 1:1 | "33 hat, sonsuz karma" | "Keşfet" | tr, en, fr, es |
| G4 | Lig/kapışma | Lig ve kapışma ekranları | 9:16 | "Rakibine karşı oyna" | "Başla" | tr, en, ko |
| G5 | Çevrimdışı | Uçak modu + oyun ekranı | 1:1, 9:16 | "İnternetsiz bulmaca" | "İndir" | tr, en, ja |
| G6 | Mağaza/ödül uyumlu afiş | Ayarlar: tek elle ekran + sakin tema (gerçek ekran) | 16:9 | "Sakin, tek elle" | "Ücretsiz oyna" | zh-Hant, pt-BR, de |

Ayrıca görsel A/B için kareden başlık yazı varyasyonları: kanca "Sakin bulmaca" / "Metroyu kur" / "1 dakikada öğren".

### 4.3 Politika ve uyum notları

- **Apple:** Mağaza önizleme/ekran görüntüsü gerçek uygulamayı göstermeli (metadata doğruluğu); Apple Ads metnini sayfanızdan üretir; CPP'ler Apple incelemesinden geçer.
- **Google Ads/Play:** "Yanıltıcı içerik" ve "yanıltıcı reklam" politikası: oyunda olmayan oynanışı göstermeyin; "kaybettin/yanlış hamle" gibi sahte bildirimle tıklama toplamayın; reklam metninde "#1/en iyi" gibi kanıtsız iddia yok. Oyun grafikleri gerçek olmalı.
- **Meta / TikTok:** Yanıltıcı/abartılı iddia, sahte UI, sahte bildirim ve "oynanış olmayan" kurgu reddedilir. Kısa video müziği lisanslı olmalı.
- **Açıklama:** "Ücretsiz; uygulama içi satın alma ve reklam içerir" ifadesini reklam metni/mağaza sayfasında bırakın; "ücretsiz para/ödül" izlenimi vermeyin. Ödüllü videoyu "isteğe bağlı" olarak gösterin.
- **Yaş:** çocuk karakteri/çizgi film yok; 13+ konum; hedefleme 18+.
- **Üretim:** Ekran kaydı gerçek cihazdan (iPhone/iPad, Android). Gerçek oyun içi ses ya da lisanslı müzik. Çözünürlük: 1080×1920 / 1080×1080 / 1920×1080; kayıtsız güvenli alan (platform arayüz katmanı).

### 4.4 Playable reklam fikri

Oyun HTML5 olduğundan (`www/`), **oyun koduna dokunmadan ayrı bir klasörde** (depo dışında ya da `tools/` dışında ayrı bir paket) kısa bir oynanabilir reklam yapılabilir: 5-6 karolu tek bölüm + "Metronu bağla" bitiş ekranı + mağaza düğmesi. Süre 15-30 sn, tek dosya HTML (≈ 2-5 MB altı; platform sınırlarını Google/Meta/TikTok belgelerinde doğrulayın), `mraid`/platform çağrısıyla mağazaya yönlendirme. Gerçek oyunun ilk bölümünün oyun mantığını kullanın (sahte oynanış yok). Playable testi Orta/Yüksek'te; ilk aşama gerekmez. Playable üretimi için geliştirici işi ayrı sprint.

---

## 5. Test ve ölçekleme kuralları

### 5.1 Test matrisi (her seferinde tek değişken)

| Aşama | Süre | Ne test edilir | Başarı ölçütü |
|---|---|---|---|
| 1 | Hafta 1-2 | Kanal + ülke grubu (örn. ASA T1-A vs T3) | CPI, CR, D1 (UMP'siz ülkelerde) |
| 2 | Hafta 2-3 | Kanca (V1, V5, V9, G1-G3) | Hold rate 3 sn, CTR, CPI |
| 3 | Hafta 3-4 | Mesaj (sakin / hız / çevrimdışı / harita) | CPI, tutorial_complete oranı (ölçülebilirse) |
| 4 | Hafta 4+ | Format/süre, dil, CPP | CPI, CVR |
| 5 | Sürekli | Anahtar kelime/negatif | CPI, CR |

### 5.2 İstatistik yeterliliği

- Karar için en az: kreatif başına ≥ **5.000 gösterim** ve ≥ **30-50 yükleme**; CPI karşılaştırması için varyant başına ≥ **100 yükleme** (±%20 ayırt etmek için bile gürültülü).
- Oran testleri için varyant başına gereken örnek: **n ≈ 16·p(1−p)/δ²** (δ = mutlak fark). Örn. dönüşüm p=%30, δ=%5 → n ≈ 1.350 dokunma/varyant; p=%5, δ=%1 → n ≈ 7.600.
- Aynı anda en fazla 3-4 varyant; en az **7 gün** (hafta içi/hafta sonu etkisi); öğrenme dönemini (ilk 3-5 gün) hesaba katmayın.
- Kalite ölçütleri (D1 vb.) yalnız Firebase'in açık olduğu ülkelerde (T1-A, T2, T3) okunur; rıza bölgeleri için yalnız CPI/CVR.

### 5.3 Öldür / ölçekle kuralları

"Hedef CPI" = §7'deki kârlılık hesabından ya da pazarlama hedefinden çıkan değer. Bu belgedeki ilk önerinin dürüst sonucu: kârlı CPI çok düşük; bu yüzden hedefi iki katmanlı tanımlayın:
- **Kâr hedefi CPI** (§7 formülü; çoğunlukla çok düşük),
- **Kabul edilen CPI** (büyüme için ödemeyi göze aldığınız; bütçe tavanıyla birlikte belirlenir).

| Kural | Tetik | Eylem |
|---|---|---|
| Öldür-1 | 3 gün sonra CPI > hedefin **%150'si**, ≥ 20 yükleme | Varyantı/kampanyayı durdur |
| Öldür-2 | 7 gün, ≥ 5.000 gösterim, CTR < kanal medyanının %50'si | Kreatifi durdur |
| Öldür-3 | D1 geri dönüş < %15 (ölçülebilir ülkede, ≥ 100 kullanıcı) | Kaynağı durdur / hedeflemeyi daralt |
| Uyar | Tutorial tamamlama oranı organiğin %70'inin altına düşer | Kanal kalitesini incele |
| Ölçekle-1 | CPI ≤ hedef ve D1 ≥ %25, 7 gün istikrar | Bütçeyi **%20** artır (haftada en çok bir kez) |
| Ölçekle-2 | **ROAS D7 > %40** (§7: D7 ≈ D90 LTV'nin ~%40'ı; bu yüzden D90 başa baş yolu) | Bütçeyi %20-30 artır |
| Ölçekle-3 | Bütçe artışından sonra CPI %30'dan fazla artarsa | Geri al, bir önceki bütçeye dön |
| Eşik | Öğrenme dönemindeyken (ilk 7-14 gün) | Bütçe/teklif/hedef değişikliğini %20 altında tut |

Dürüst not: ROAS D7 > %40 gerçekçi değil (§7: tahmini ROAS çoğunlukla %5-20); bu yüzden ilk dönemde pratikte "CPI ve kalite ölçütleri sınırı + toplam bütçe tavanı" ile yönetilir, kâr kuralı ARPDAU/tutundurma beklentinizden iyi çıkarsa devreye girer.

### 5.4 Haftalık rapor şablonu

```
HAFTA: ____  (tarih aralığı)        HAZIRLAYAN: ____
1. ÖZET: toplam harcama __ $ · yükleme __ · karma CPI __ $ · plan/gerçek __/__
2. KANAL TABLOSU: kanal | ülke grubu | harcama | gösterim | tık/CTR | yükleme | CPI | CVR
3. KALİTE (yalnız Firebase açık ülkeler): tutorial_complete % | D1 % | D7 % | level_end/oyuncu | 
   purchase sayısı + in_app_purchase geliri | ad_impression/DAU | tahmini ARPDAU
4. ROAS: D1/D7 tahmini ROAS (reklam geliri + IAP) / harcama
5. EN İYİ / EN KÖTÜ 3 kreatif ve 3 anahtar kelime (CPI, CR)
6. KARARLAR: öldürülenler · ölçeklenenler · bütçe değişimi (±%) · yeni test
7. RİSK / ENGEL: ölçüm boşluğu (UMP bölgeleri), eşikler, politika uyarıları
8. GELECEK HAFTA: test matrisi satırı, kreatif teslimatı, CPP
```
Veri kaynakları: Apple Ads panosu, Google Ads, Play Console / App Store Connect (kaynağa göre yükleme), Firebase (öğretici/seviye/gelir), AdMob (reklam geliri).

---

## 6. Dönüşüm takibi

### 6.1 Önce karar: Firebase'i Google Ads'e BAĞLAMAK GİZLİLİK BEYANLARINI DEĞİŞTİRİR

`docs/YAYIN.md` §5.1: Google sinyalleri ve Google Ads bağlantısı **kapalı** kalsın. `docs/MAGAZA.md` §6-7: Firebase verisi yalnız **Analiz** amaçlı, reklam/izleme amaçlı değil. Firebase'i Google Ads'e bağlayıp olay içe aktarmak bu beyanları (Veri Güvenliği + App Privacy) ve rıza modelini değiştirir. Bu yüzden: **lansmanda bağlamayın**; ilk kampanyalar Google Play yükleme dönüşümüyle çalışsın. Bağlama kararı yalnız geliştirici + gizlilik formlarının güncellenmesiyle birlikte alınmalı.

### 6.2 İleride Firebase → Google Ads bağlama adımları (karar verilirse)

1. Firebase Console → Proje ayarları → Entegrasyonlar → **Google Ads** → Bağla (Firebase proje sahibi + Google Ads yöneticisi).
2. Google Ads → Araçlar → Dönüşümler → Yeni → **Uygulama** → Firebase olaylarını içe aktar.
3. Firebase → Analytics → Events: `tutorial_complete`, `purchase`/`in_app_purchase` **Anahtar olay** işaretle; özel olay üret: **Create event** ile `level_end` (level ≥ 10) → `level_10_reached` (koda dokunmadan konsoldan).
4. Google Ads'e içe aktarılacaklar (öncelik): (a) **first_open / Google Play yükleme** (zaten bağlantıyla), (b) `tutorial_complete` (ilk derin olay, tCPA için), (c) `level_10_reached` (kalite), (d) `in_app_purchase` (gelir/ROAS, tROAS yalnız yeterli hacimde), (e) `ad_impression` yalnız AdMob↔Firebase bağlıysa ve çift olay riskini çözerseniz (`docs/YAYIN.md` §5.1 notu; ayrıca reklam geliri değeri için).
5. **Sınır:** `ad_storage`/`ad_user_data` reddedildiği sürece Google Ads bu olayları tıklamaya atfedemez; tCPA/tROAS pratikte beslenmez. Önce rıza modeli/beyan kararı (§6.5).

### 6.3 ASA atfı (AdServices)

Apple Ads panosu kendi yükleme/tekrar yükleme sayılarını **uygulamadan bağımsız** verir. Kampanya/anahtar kelime düzeyinde uygulama içi atıf için uygulamanın **AdServices** (`AAAttribution.attributionToken()`) çağırması gerekir; jeton Apple'ın API'sine gönderilir ve kampanya/reklam grubu/anahtar kelime kimliği döner. Kimlik, IDFA yok, ATT gerektirmez. Bugün **uygulamada yok** → geliştiriciye öneri §6.5. Gelene kadar ASA sonuçları Apple Ads panosu + App Store Connect "Kaynak" raporundan okunur.

### 6.4 SKAdNetwork / AdAttributionKit dönüşüm değeri şeması (öneri)

Bu şema yalnız Google/Meta/TikTok iOS kampanyalarında ve SKAN raporlayan MMP/SDK varsa anlamlı; ASA SKAN'a ihtiyaç duymaz. Uygulama `updatePostbackConversionValue` çağırmazsa tüm postback'ler "değer 0 / boş" gelir (yalnızca yükleme sayısı). `tools/ios/skadnetwork.txt` zaten var (mevcut liste).

Önerilen **6 bit (0-63) ince dönüşüm değeri**:

| Bit | Anlam | Olay |
|---|---|---|
| b0 (1) | Öğretici tamamlandı | `tutorial_complete` |
| b1-b2 (2-6) | İlerleme kovası: 0 → 0-4 seviye, 1 → 5-14, 2 → 15-39, 3 → 40+ | `level_end` sayacı |
| b3 (8) | Sosyal/günlük etkileşim | `daily_end`, lig ya da kapışma oynandı |
| b4 (16) | Ödüllü reklam izledi | `ad_impression` rewarded earned |
| b5 (32) | Satın alma | `purchase` |

Değer = toplam. **Kaba (SKAN 4) eşlemesi:** low = öğretici tamamlanmadı (değer 0-1); medium = `tutorial_complete` + ≥ 5 seviye ya da değer 3-15; high = değer ≥ 16 (ödüllü izledi/satın aldı). Güvenilir (anonimlik eşiği) için kampanya başına günde onlarca yükleme gerekir; Düşük bütçede çoğu postback `null` döner, bu yüzden bu şemanın yararı Orta/Yüksek'te. iOS 17.4+ için **AdAttributionKit** aynı mantıkla çalışır (alt sürümlerde SKAN); uygulama iOS 15+ olduğundan ikisi birlikte düşünülmeli.

### 6.5 Geliştiriciye öneri (oyun koduna dokunmadan yazıldı; öncelik sırasıyla)

1. **AdServices jetonu:** iOS'ta ilk açılışta bir kez jeton alıp Apple API'siyle çözmek, sonuçtaki `campaignId`/`keywordId` gibi kişisel olmayan alanları Firebase olayı olarak yazmak (yalnız rıza gerektirmeyen bölgelerde). ATT gerektirmez, IDFA yok → mevcut gizlilik ilkelerine uyar; App Privacy'de "Ürün etkileşimi/analiz" altında kalır.
2. **Play Install Referrer:** Android'de install referrer'dan UTM (kampanya) alanlarını okuyup bir olay parametresi olarak yazmak (kişisel olmayan). Kampanya düzeyinde kalite görmek için.
3. **SKAN/AdAttributionKit dönüşüm değeri:** §6.4 şemasını uygulayan küçük eklenti; yalnız iOS Google/Meta/TikTok kampanyaları açılırsa.
4. **MMP kararı:** Meta/TikTok açılacaksa SDK yerine bir MMP (AppsFlyer, Adjust, Singular vb.) seçmek; çoğunun küçük hacim için ücretsiz/başlangıç katmanı olabilir (hesapta doğrulayın). MMP, SDK ekleyeceği için **App Privacy, Data Safety ve UMP/ATT akışlarını yeniden gözden geçirmeyi** gerektirir; bu uygulamanın "reklam kimliksiz, rıza reddedilen" ölçüm ilkesiyle çelişir. Bu yüzden öncelik: önce ASA + Google yükleme.
5. **Rıza kararı (ayrı bir ürün/hukuk kararı):** `ad_user_data`/`ad_storage` reddini rıza gerektirmeyen bölgelerde ve ATT izinli iOS'ta koşullu açmak, Firebase→Ads bağlamayı ve derin olay optimizasyonunu mümkün kılar; ancak gizlilik beyanları ve 13+ konumu yeniden değerlendirilmelidir. Mevcut ilke bilinçli ("izleme" yok); bu öneri yalnız **büyüme tavanına çarpıldığında** gündeme gelsin.
6. **Analitik rıza satırı (opsiyonel):** UMP bölgeleri için ayrı bir "analitik onayı" satırı (YAYIN §5.3'te zaten "ileride" diye not edilmiş) açılırsa Avrupa oyuncularının seviye/öğretici verisi görünür olur.

### 6.6 UTM ve mağaza özel sayfaları

- **App Store Custom Product Pages (CPP):** App Store Connect → Uygulama → Özel Ürün Sayfaları (en çok 70). Her reklam grubu/mesaj için bir CPP (ekran görüntüsü + metin; yalnız gerçek ekranlar). ASA'da reklam grubuna CPP bağlanır; bağlantı `https://apps.apple.com/app/id6831928554?ppid=<CPP-ID>`.
- **Kampanya bağlantısı:** App Store Connect → Analitik → Kampanya bağlantıları: `?pt=<sağlayıcı>&ct=<kampanya>&mt=8` (Meta/TikTok/web gibi dış trafik için).
- **Play Custom Store Listings:** Play Console → Mağaza varlığı → Özel mağaza girişleri (ülke/kitle/URL başına); ve **`referrer`** parametreli bağlantı: `https://play.google.com/store/apps/details?id=com.osmanadali.ray&referrer=utm_source%3Dgoogle%26utm_medium%3Dcpc%26utm_campaign%3D<ad>`.
- **Adlandırma:** `{kanal}_{platform}_{ülkegrubu}_{dil}_{hedef}_{kreatif}` — örn. `asa_ios_t3_tr_install_V5`, `gac_and_t2_ptBR_install_G1`. Bütün raporlar aynı ada dayansın.

---

## 7. Gelir tarafı: AdMob ARPDAU → LTV → "hangi CPI'ya kadar kârlı"

> Hepsi **TAHMİN**; gerçek D1/D7, reklam gösterimi/DAU ve eCPM ilk 2 haftada ölçülmeli. Kaynaklar: https://blog.playio.co/arpdau-benchmarks-mobile-games , https://gamegrowthadvisor.com/blog/2026-03-17-mobile-game-kpis-benchmarks-2026/ (rewarded eCPM ABD iOS ~24 $ (Q2 2024 eski veri), genel kıyas 5-15 $ ABD, 2-5 $ gelişen pazar; casual oyunda geçiş+ödüllü ≈ gelirin %80'i).

### 7.1 Varsayımlar

| | T1-A | T2 | T3 (TR) |
|---|---|---|---|
| Geçiş reklamı eCPM (kişiselleşmemiş; rıza reddi eCPM'yi düşürür) | 8 $ | 3 $ | 1 $ |
| Ödüllü eCPM | 20 $ | 8 $ | 3 $ |
| DAU başına geçiş / ödüllü gösterimi | 3 / 0,8 | 3 / 0,8 | 3 / 0,8 |
| **Reklam ARPDAU** | 3×8/1000 + 0,8×20/1000 = **0,040 $** | **0,0154 $** | **0,0054 $** |
| Yükleme başına aktif gün (D0-D90; D1 %25, D7 %8, D30 %3 varsayımı) | ~4,0 | ~3,5 | ~3,5 |
| Ödeme yapan oranı × net IAP (Apple/Google %15 sonrası) | %1,5 × 3,0 $ ≈ **0,045 $/yükleme** | %0,7 × 2,5 $ ≈ **0,015 $** | %0,2 × 1,5 $ ≈ **0,003 $** |

### 7.2 LTV (D90) ve "başa baş CPI" formülü

```
LTV_D90 = (aktif gün × ARPDAU_reklam) + IAP_yükleme_başına
CPI_max (başa baş)   = LTV_D90 / hedef_ROAS          (hedef_ROAS 1,00 = D90'da başa baş)
CPI_max (temkinli)   = LTV_D90 / 1,5                  (D90'da %50 kâr payı)
ROAS_D7 ≈ 0,40 × LTV_D90 / CPI        (tahmin: D7 birikimi D90'ın ~%40'ı)
```

| | T1-A | T2 | T3 |
|---|---|---|---|
| LTV_D90 (taban) | 4,0 × 0,040 + 0,045 = **~0,21 $** | 3,5 × 0,0154 + 0,015 = **~0,07 $** | 3,5 × 0,0054 + 0,003 = **~0,022 $** |
| Başa baş CPI (ROAS 1,0) | **~0,21 $** | **~0,07 $** | **~0,02 $** |
| Piyasa CPI'ı (§3.1, TAHMİN) | 1,5 – 4,5 $ | 0,4 – 2,5 $ | 0,1 – 0,8 $ |
| Taban ROAS D90 | ~%5-14 | ~%3-17 | ~%3-20 |

**Duyarlılık (iyimser):** T1-A'da ARPDAU 0,10 $ (daha yoğun reklam / yüksek eCPM), 5 aktif gün, IAP 0,12 $ → LTV ≈ 0,62 $; başa baş CPI ≈ 0,6 $: hâlâ piyasa CPI'sının altında. **Hybrid-casual** kıyas aralığı (ARPDAU 0,15-0,50 $) tutturulabilirse tablo tersine döner; ancak bu yoğun reklam yükü ve Ray'in "sakin" konumuyla çelişir (daha çok reklam = tutundurma düşer).

**Örnek senaryo (Orta, 1 ay):** harcama 1.800 $ → ~2.900 yükleme (orta nokta; karma CPI ~0,6 $) → karma LTV ~0,06 $ → D90 geliri ~170 $ → **ROAS ~%10**. Yani kampanya, geliri finanse etmez; kazanç organik büyüme/sıralama/yorum etkisinden gelmelidir ve bu da ölçülemez ya da çok yavaş ölçülür.

### 7.3 Sonuç ve öneri

1. Ücretli edinmeyi **kâr aracı değil, test/sıralama yatırımı** sayın; tavanı baştan belirleyin (örn. toplam 450-900 $).
2. Gerçek ARPDAU ve tutundurma ilk 2 haftada ölçülecek; ARPDAU > 0,08 $ ve D7 > %10 çıkmadıkça Orta'ya geçmeyin.
3. En çok marj yönetilebilen yerler: ASA marka + yüksek niyet kategori terimleri, T3/T2 Android tCPI, ASO ve CPP; Meta/TikTok MMP olmadan yok.
4. Gelir artırıcı (kampanya dışı) hamleler: Reklamsız paketin fiyat/konum testi, ödüllü video yerleşimleri, IAP ipucu; bunlar LTV'yi doğrudan artırır ve kârlı CPI sınırını yükseltir.

---

## 8. Bütçe vermeden önce yapılacaklar (kontrol listesi)

**A. Karar ve bütçe**
- [ ] Toplam bütçe ve tavan (Düşük/Orta/Yüksek) ve deneme süresi (2-3 hafta) kararı
- [ ] Hedef CPI (kâr hedefi ve kabul edilen) ve "durdur" sınırı yazılı
- [ ] Zamanlama: Kasım sonu Black Friday/Aralık pahalı; Ocak daha ucuz olabilir

**B. Hesaplar ve ödeme (yalnız sizin yapabileceğiniz adımlar)**
- [ ] **Apple Ads** hesabı (ads.apple.com) → Advanced; ödeme yöntemi; App Store Connect uygulamasına bağlama
- [ ] **Google Ads** hesabı; fatura/ödeme profili; Play Console → Ayarlar → Bağlı hesaplar → Google Ads bağlama (Play Console'da uygulama yayında olmalı)
- [ ] **Google Play** yayını 21 Kasım; Play mağaza girişi son kez gözden geçirilmiş; en az 3-7 gün organik veri/yorum
- [ ] **Meta Business + reklam hesabı**, **TikTok Ads** hesabı (yalnız MMP kararı verilince)
- [ ] Muhasebe: reklam gideri fatura/KDV/vergi (Türkiye) için mali müşavire danışma
- [ ] İki faktörlü doğrulama, hesap sahibi e-postaları, bütçe üst sınırı/uyarı (günlük ve aylık limit)

**C. Mağaza varlıkları**
- [ ] App Store Custom Product Pages (en az 2-3)
- [ ] Play Custom Store Listings (en az 1-2)
- [ ] Mağaza ekran görüntüleri 9 dilde güncel; 1.2 öne çıkanlar
- [ ] §4'teki video ve görseller (gerçek oyun görüntüsü; ses hakları temiz)

**D. Ölçüm**
- [ ] Firebase: `FIREBASE_ANDROID_JSON` / `FIREBASE_IOS_PLIST` ile **ölçümlü** yapı (1.2) yayında; DebugView ile `level_start`, `level_end`, `tutorial_*`, `purchase`, `ad_impression` doğrulanmış (`docs/YAYIN.md` §5.1)
- [ ] Firebase konsolunda anahtar olaylar (tutorial_complete, in_app_purchase) ve özel olay `level_10_reached` (konsoldan, kodsuz)
- [ ] **Firebase→Google Ads bağlama kararı**: lansmanda bağlama (§6.1); bağlamadan önce Data Safety/App Privacy güncellemesi
- [ ] AdMob raporu ile ARPDAU hesaplama sayfası (impression/DAU, eCPM) hazır
- [ ] §5.4 rapor şablonu bir tabloya aktarılmış
- [ ] Geliştiriciye §6.5 önerileri iletildi (AdServices, referrer, SKAN, MMP kararı)

**E. Politika**
- [ ] Reklamlar yalnız gerçek oyun görüntüsü; "ücretsiz/reklam ve satın alma içerir" ibaresi
- [ ] Hedefleme 18+, çocuk/aile kategorisi yok
- [ ] Rakip adı yalnız Apple Ads anahtar kelimesinde; reklam/mağaza metninde yok
- [ ] Kampanyaları başlatmadan önce her hesapta bütçe tavanı ve fatura uyarısı

---

*Bu belge öneridir; hiçbir hesaba girilmedi, hiçbir reklam başlatılmadı, para harcanmadı, oyun kodu değiştirilmedi.*
