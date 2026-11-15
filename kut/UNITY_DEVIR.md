# Kut Arena: Unity devir belgesi

Bu belge, Unity'ye bağlı (bilgisayardaki) Claude oturumunun işi kaldığı yerden alması için yazıldı. Önce bunu, sonra `TASARIM.md` ve `GORSEL_REHBERI.md` dosyalarını oku.

## 0. Yeni belgeler (önce bunları oku)

- **`YOL_HARITASI.md`** (en önce): prototip ile asıl oyun arasındaki farklar, aşamalar ve hangi işin Unity'de yapılacağı. Asıl oyunun kuralları `OYNANIS_DERINLIK.md`, ekranları `ARAYUZ_V2.md` (aşağıdaki `ARAYUZ_TASARIM.md`'nin yapısal yerini alır; renk, yazı ve 9-slice belirteçleri orada kalır), öğretici ve bütün metinler `OGRETICI.md`'dedir.
- **`ARAYUZ_TASARIM.md`**: tablet arayüzünün son tasarımı. Renk ve yazı belirteçleri, her ekranın yerleşimi (16:10 ve 4:3), bileşen durumları, 9-slice payları, geri bildirim animasyonları ve ChatGPT ile çizdirilecek 12 raster parçanın listesi. Görsel karşılığı `tasarim/final/index.html` (`?ekran=ana|mac|savas|son|kodeks`) ve `tasarim/final/shot_*.png`. Unity'de UGUI ile birebir kur.
- **`ANIMASYON_PLANI.md`**: savaşın nasıl canlanacağı. Motor 0,4 sn önde, görüntü arkada; UAL kliplerinin darbe anları; 16 yaratığın saldırı ve yetenek animasyonları; dört ayaklı ve yılan için kodlu hareket kuralları; Kut, kaynaşma ve birleşme efektleri.
- **Çalışan örnek (tarayıcı):** `web/` klasörü bu iki belgenin oynanır uygulaması. `web/sahne3d.js` (3D savaş: UAL aktarımı, dört ayaklı hareket, motor-önde zamanlama, efektler), `web/arayuz.js` (ekranlar), `web/oyun.js` (maç mantığı). Unity'de takıldığın her yerde önce buradaki çözüme bak: kemik eşlemesi, hangi klibin hangi anda başladığı, kamera açısı ve HUD aynıdır.
- **Portreler:** `arayuz/portre/<id>.png`, 3D modellerden şeffaf, 512 px. Dükkân kartları ve HUD için.

## 1. Durum

- **Oyun tasarımı bitti** ve tarayıcı prototipiyle sınandı (`kut/*.js`). Kurallar, denge sayıları ve kahraman verisi `data.js`'te; savaş motoru `sim.js`'te. Motor belirlenimci: aynı takımlar, tohum ve Kut zamanı aynı sonucu verir.
- **Bütün görseller hazır.** Modeller kullanıcının bilgisayarında, Tripo'dan inen zip'ler hâlinde: `tripo_convert_<kimlik>-....zip`. Her zip'te bir FBX ve `.fbm` klasöründe 4K PBR dokular (renk, normal, pürüzlülük, metallik) var.
- **Animasyonlar:** Quaternius Universal Animation Library (CC0). Depoda glTF olarak `kut/animasyon/` klasöründe. Kullanıcının bilgisayarında FBX sürümleri de var: `Universal Animation Library-Standard` ve `Universal Animation Library 2-Standard` klasörleri. Unity için FBX sürümünü kullan.
- **Tablet, yatay ekran** öncelikli. Grafik kalitesi düşürülmez (kullanıcı kuralı). Zayıf cihazlar için ayrı hafif kopya (LOD) üretilir, orijinal modeller değiştirilmez.

## 2. Model eşlemesi (Tripo zip kimliği → yaratık)

Zip adının `tripo_convert_` sonrasındaki ilk 8 karakteri:

| Kimlik | Yaratık (`data.js` id) | İskelet | Not |
|---|---|---|---|
| `3187858f` | Kaya Golemi (`golem`) | Mixamo insan, 65 kemik | 56 bin üçgen |
| `828a8d76` | Davulcu Kurbağa (`kurbaga`) | Mixamo insan | Davul ve tokmaklar modelde |
| `a9664aff` | Sis Yarasası (`yarasa`) | Mixamo insan | Kanatlar kol yerinde |
| `eb9059d9` | Rüzgâr Ruhu (`ruzgar`) | Mixamo insan | |
| `3264ba80` | Kristal Kurt (`kurt`) | Tripo dört ayaklı, 33 kemik | |
| `2717321b` | Dağ Koçu (`koc`) | Tripo dört ayaklı, 40 kemik | |
| `fd7dcbdc` | Zümrüt Yılan (`yilan`) | Tripo yılan: kuyruk + 5 baş kemiği | Kıvrım gövde sabit, boyun ve baş oynar |
| `ae9d6b6d` | Buz Kaplumbağası (`kaplumbaga`) | Tripo dört ayaklı, 29 kemik | |
| `816e7cd5` | Kor Semenderi (`semender`) | Tripo dört ayaklı, 40 kemik | Dört ayak da kemikli; bazı kemik adları `bone_NN` |
| `8f464867` | Bulut Atı (`bulutat`) | Tripo dört ayaklı, 36 kemik | Kanatlar kemiksiz; çırpmayı kodla ekle |
| `4ad3cda1` | Işık Kuğusu (`kugu`) | Mixamo insan | Baş üstü ışık halkası Unity'de efekt olarak eklenecek |
| `1975d6dd` | Gece Ayısı (`ayi`) | Mixamo insan | |
| `2fb6dfa1` | Anka (`anka`) | Mixamo insan | Kanatlar kol yerinde; Yeniden Doğuş efekti özel yapılacak |
| `5f088683` | Ayaz Baykuşu (`baykus`) | Mixamo insan | Asa modelde, ele bağlı |
| `edaee224` | Gölge Tilki (`tilki`) | Mixamo insan | Yay modelde, ele bağlı (test edildi) |
| `7a7935f5` | Fırtına Ejderi (`ejder`) | Mixamo insan | |

**Kullanılmayacaklar:** `1136bfb0` ve `2559d70d` (iskeletsiz golem), `99d51416` ve `f49918d5` (insan iskeletli koç ve kurt), `c5ac0c73` (bir bacağı kemiksiz semender).

**Arena nesneleri (iskeletsiz):**

| Kimlik | Nesne |
|---|---|
| `b2920c87` | Arena platformu (yüzen ada, üstü düz) |
| `ad3fbce1` | Taş kemer |
| `bd2b5866` | Kristal kümesi |
| `b80351cf` | Kaya grubu |
| `c2172b08` | Yüzen kaya (ağaçlı) |
| `eb1cccbf` | Dev mantar |
| `1cf91544` | Ateş kâsesi (alev efekti eklenecek) |

**2D (depoda):**
- `kut/gorsel/`: `arena_konsept`, `gokyuzu`, `doku_tas`, `doku_cimen` (iki doku da dikişsiz döşenir).
- `kut/arayuz/`: 10 soy simgesi (`soy_<id>.png`, 256 px, şeffaf) ve `logo.png`.
- `kut/konsept/`: her yaratığın ChatGPT konsept görseli (referans).

Tripo modelleri **çapraz durabilir** (dört ayaklılar dörtte üç açıdan çizildi). İçe aktarırken ön yönü düzelt: yaratık +Z'ye baksın.

## 3. Animasyon eşlemesi (UAL → oyun)

| Durum | UAL klibi |
|---|---|
| `bekle` | Idle_Loop |
| `yuru` | Walk_Loop |
| `saldir` (yakın) | Punch_Jab / Punch_Cross (golem, ayı, koç benzeri iriler); Sword_Attack |
| `atis` (menzilli) | Spell_Simple_Shoot |
| `yetenek` | Spell_Simple_Enter → Spell_Simple_Shoot |
| `vurul` | Hit_Chest / Hit_Head |
| `olum` | Death01 |
| `zafer` | Dance_Loop |

- **İki ayaklılar:** FBX'leri **Humanoid** avatar olarak içe aktar; UAL FBX'leri de Humanoid olsun, retarget Unity'de otomatik çalışır. Tarayıcıda golemle denendi: yürüme, yumruk, büyü, darbe ve ölüm doğru oynuyor. İri kollu yaratıklarda beklerken kollar gövdeye giriyor; avatar ayarlarında "Arm Stretch" ve kas sınırlarıyla ya da Idle'da omuz açısını artıran küçük bir ek katmanla düzelt.
- **Dört ayaklılar ve yılan:** Generic avatar. Hazır animasyon yok. Prosedürel yap: bacakları sırayla salla (çapraz çiftler birlikte), gövdeyi inip kaldır, hamlede başı ileri at, ölümde yana devir. Kullanıcı Tripo'dan dört ayaklı animasyonu getirirse onları kullan.
- **Kanatlar:** Kuğu, Anka ve Yarasa'da kol kanadı oynatır. Bulut Atı'nın kanatları için ayrı, kodlu çırpma ekle.

## 4. Unity proje yapısı (öneri)

```
Assets/Kut/
  Kahramanlar/<id>/<id>.fbx (+ dokular)     ← Tripo zip'lerinden, kimlik eşlemesine göre adlandır
  Animasyon/UAL/                             ← Universal Animation Library FBX
  Arena/Nesneler/, Arena/Doku/, Arena/Gok/
  Arayuz/                                    ← soy simgeleri, logo
  Kod/                                       ← C#
  Sahneler/Ana.unity, Mac.unity, Savas.unity
```

- **Dokular:** 4K kaynak kalsın. Tablet için Max Size 2048, ASTC sıkıştırma. Zayıf cihaz profilinde 1024.
- **LOD:** her yaratığa LOD0 (orijinal, yaklaşık 55 bin üçgen) ve LOD1 (yaklaşık 18 bin). LOD1'i UnityMeshSimplifier (Whinarn, açık kaynak) ile iskeleti koruyarak üret. Kalite ayarı ilk açılışta cihaz ölçümüyle seçilsin; oyuncu Ayarlar'dan değiştirebilsin.
- **Işık:** URP. Bir ana yön ışığı (gün batımı, sıcak), gökyüzü rengiyle uyumlu ortam ışığı ve hafif bloom. Kristal, göz ve desen gibi parlayan parçalara Emission ekle; Tripo dokusundaki parlak renk bölgesinden maske üret.

## 5. Kod: prototipten C#'a

**✅ Motor hazır ve sınandı:** `kut/unity/Kod/` (KutVeri, KutSavas, KutHayalet). Tarayıcı motoruyla 496/496 savaşta bit bit aynı sonuç veriyor; ayrıntılar `kut/unity/README.md`'de. Bu dosyaları `Assets/Kut/Kod/` altına kopyala. Aşağıdaki tablo yalnız arayüz ve sahne tarafı için yol gösterir.

`sim.js` → `KutSavas.cs` (saf C#, MonoBehaviour değil). Tarayıcı sürümüyle **aynı sonucu** vermeli: aynı tohum (mulberry32), aynı 0,05 sn adım, aynı sıra. Bunu doğrulamak için `node kut/test/sim.test.cjs` çıktısındaki örnek savaşları C# testine koy.

| JS | C# |
|---|---|
| `data.js` | `KutVeri.cs` (ScriptableObject ya da JSON); kahraman, soy, alamet, `KURAL` |
| `sim.js` | `KutSavas.cs`: `Adim()`, `Kut(taraf, i)`, `fx` olay listesi |
| `online.js` | `Hayalet.cs`: bot takım, düello kodu (`KUT2-` biçimi; eski `KUT1-` kodları da çözülür; iki sürüm birbirinin kodunu çözebilsin), uzak havuz arayüzü |
| `game.js` | Unity arayüzü (UGUI ya da UI Toolkit) ve `SavasSahnesi.cs` (fx olaylarını animasyon ve efekte çevirir) |

**fx olayı → görsel:**
- `vurus`: saldırı animasyonu; menzilliyse mermi.
- `yetenek`: yetenek animasyonu ve soya göre efekt.
- `kut`: ışık sütunu ve kısa ekran parlaması.
- `hasar` / `iyi` / `kalkan`: uçan sayı.
- `olum`: ölüm animasyonu, sonra çözülerek kaybolma.
- `dirilis`: Anka için külden alev patlaması.
- `simsek`: zincir yıldırım.

## 6. Sahne

- **Arena:** `arena_konsept`'i örnek al. Yüzen ada platformu ortada; üstüne 6×8 karo ızgarası (`doku_tas`); ortada parlayan altın çizgi. Kenarlarda kemerler, kristal kaideleri, mantarlar, ateş kâseleri; ada kenarlarından şelaleler (efekt); arkada `gokyuzu` ve uzakta yüzen kayalar.
- **Kamera:** yukarıdan yaklaşık 50–55°, oyuncu tarafı altta, yatay tablet. Kut dokunuşu için yaratıklara dokunma alanı geniş olsun.
- **Arayüz (yatay):** alt kenar dükkân (5 kart); sol kenar soy sayaçları (simgeler); sağ üst can, zafer, altın ve tur; üst orta alamet şeridi ve sıradaki rakibin önizlemesi; sağ alt "Savaşa!".

## 7. Önerilen ilk adımlar

1. URP projesi aç ya da mevcudu kontrol et; klasör yapısını kur.
2. Golemi (`3187858f`) Humanoid olarak içe aktar. UAL FBX'ten Idle, Walk ve Punch'ı bağla. Bir Animator Controller kur; golem arenada yürüsün.
3. Arena platformunu, zemini ve gökyüzünü koy; kamerayı ayarla.
4. `kut/unity/Kod/*.cs` dosyalarını projeye kopyala (yazıldı ve sınandı); `SavasSahnesi.cs` ile Fx olaylarını görsele bağla.
5. 16 yaratığı içe aktar, iki takım dizip ilk tam savaşı oynat.
6. Dükkân ve tahta arayüzü, Kut dokunuşu, kaynaştırma.
7. Efektler; sonra çevrimiçi (Firebase) ve paketleme.

## 8. Kullanıcıyla çalışma

- Türkçe, kısa ve öz.
- Görsel kararlarda ekran görüntüsü göster, onay al.
- Kredi harcayan üretimler (Tripo, ChatGPT) kullanıcıda.
- Commit mesajlarına model adı yazılmaz.

## 9. Oynanış v2 (asıl oyun kuralları: seviye, ekonomi, eşya, canavar, lobi, Kut Armağanı)

Prototipin oynanışı `OYNANIS_DERINLIK.md`'deki asıl oyuna genişletildi (13. bölümdeki 1–7. adımlar). Kurallar önce JS'te (`data.js`, `sim.js`, `lobi.js`, `online.js`, `web/oyun.js`), sonra C#'ta yazıldı. C# portu JS ile **bit bit aynı**: `node kut/test/esdeger_uret.cjs` ve `cd kut/unity/Test && dotnet run` → **9596/9596**. Eski biçim **Hızlı Maç** olarak duruyor (`KURAL.hizli`, C#'ta `KutVeri.Hizli`).

### 9.1 C# dosyaları (`kut/unity/Kod/`, hepsi saf C#, `namespace Kut`)

| Dosya | Durum | İçerik |
|---|---|---|
| `KutVeri.cs` | yeniden üretildi (elle düzenleme; `node kut/tools/csharp_veri.cjs`) | Bütün veri ve sabitler: aşağıdaki 9.2 |
| `KutSavas.cs` | genişledi | 4×3 konumlar (`x = 0,75 + 1,5·sütun`, y taraf 0 için 5/6/7, taraf 1 için 3/2/1); birimde eşya listesi `TakimBirimi.E` ve Üçlü Kaynaşma `F2`; 36 eşyanın motor kancaları; 8 canavar ve 4 canavar yeteneği; Gün Batımı (`gunBatimi`, Uzun Gölge'de 12 sn); Kut hakkı sayacı (`kutHak`, Çifte Kut, Son İki'de 2, 4 sn ara), Kut Yankısı, yapay zekâ Kut'u (7.4; `yz`, `yzYedek`, `yzZaman2`), Kut Sessizliği (`kutYok`); savaşı etkileyen armağanlar (`armagan`). Sonuçta `KalanPuan`, `KalanSayi`, `Kut[2]` |
| `KutHayalet.cs` | genişledi | Seviyeli bot (`BotTakim(..., sv)`, `BotSeviye`), 4×3 `Yerlestir`, `KUT2-` kodu (eşyalı; `KUT1-` hâlâ çözülür), `BotEsya`; bot izi (`IzEgri`, `BotIzTur`, `BotIz`), kayıtlı iz (`IzTurAl`), lobi izleri (`LobiIzler`, `LobiKur`), iz havuzu arayüzü `IIzHavuzu { IzYaz, LobiBul }`, maç izi tipleri `MacIzi`, `IzTur`, `LobiIz`, `KutDokunus` |
| `KutLobi.cs` | **yeni** | `lobi.js`'in kural bölümü: deneyim ve seviye (`XpEkle`, `XpGerek`), havuz (`KopyaSay`, `HavuzKalan`), dükkân (`DukkanCek`), tur planı (`TurPlan`, `TurAd`), ekonomi (`GelirHesapla`, `Faiz`, `SeriGuncelle`, `KayipHasar`, `TurBasi`, `TurSonu`, `KaynastirBedel`), eşya kuralları (`EsyaTak`, `EsyaToplaBirim`, `RafBirlestir`), canavar dalgası (`PveDalga`), ganimet (`Ganimet`, `GanimetEsya`), Kervan (`KervanAdet`, `KervanSecenek`), bedava başlangıç kahramanı (`BaslangicSecenek`), Kut Armağanı (`ArmaganSecenek`, `ArmaganCek`, `SavasArmagan`, `BotArmagan`, `FaizTavanAl`) |
| `KutLobiOda.cs` | **yeni** | 8 kişilik hayalet lobi (`lobi.js`'in lobi bölümü): `LobiYeni`, `EslesmeKur` (son 3 tur yasağı, Yansıma), `LobiRakip`, `GolgeSavaslari` (hayalet × hayalet savaşları motorda), `LobiTurOyna`, `SiralamaGuncelle`, `LobiBitti`, `LobiSonaKadar`, `LobiSira`, `KupaDegisim`, `HavuzLobi`, `LobiAlamet`, `AlametSirasi`, `LobiKadro` |
| `../Test/Program.cs` | genişledi | Eşdeğerlik testi: savaşlar (eşyalı, canavarlı, Gün Batımı'na giden, çift Kut'lu, armağanlı), KUT1/KUT2 kodları, deneyim, havuz, dükkân, ekonomi zincirleri, eşya, canavar/ganimet/Kervan, lobi (24 tam lobi dahil), armağan |

### 9.2 Yeni veriler (`KutVeri.cs`, kaynak `data.js`)

- **Seviye ve havuz:** `SeviyeBaslangic 2`, `SeviyeTavan 8`, `XpTablo`, `XpBedel/XpMiktar 4/4`, `PasifXp 2`, seviyeye bağlı dükkân olasılıkları (tablo 2.2), `HavuzAdet {1: 22, 2: 18, 3: 14}`, `YildizKopya 1/3/9`, `Yedek 7`, 4×3 tahta (`TahtaSutun 4`, `TahtaSira 3`).
- **Ekonomi:** 100 can, `TabanGelirBolum1 3/3/4` sonra `TabanGelir 5`, **faiz her 8 altına 1, en çok 5** (`FaizAdim 8`; belgede 10'du, denge benzetimiyle indi, `kut/test/DENGE_RAPORU.md`), `SeriTablo`, galibiyet +1, Bereketli Pazar +2, yenileme 2, kaynaştırma `2 + en yüksek kademe`, `BolumTabani 0/0/4/9/13/17/21/25` (belgede daha düşüktü; lobi süresi için artırıldı, tempo ayarında +1), Son Üç +3, Son İki +5.
- **Tur planı:** bölüm 1'de 3 tur, sonra 7; x-4 Kervan, x-7 canavar; armağan 2-1, 3-2, 4-3. Ganimet planı, 2-7 zarfı, Kervan planı ve seçenek sayısı (sıraya göre 3/4/5).
- **Eşya:** `Bilesenler` (8), `Esyalar` (36), `OzelEsyalar` (Söküm Taşı, Kut Taşı, Soy Mührü `muhur-<soy>`), `EsyaBul`, `Tarif`, yuva 3, raf 10, azaltma tavanı %40.
- **Canavar:** `Canavarlar` (8, kademe 0, soysuz), `PveDalga`, `PveDalgaGec` (6-7 ve sonrası).
- **Kut:** `KutHak`, `KutAra 4`, yapay zekâ zamanları 5/12 sn ve puan katsayıları, Kut Yankısı sabitleri (`Yanki*`), Gün Batımı 20 sn ve +%10/sn.
- **Lobi:** `LobiBoyut 8`, eşleşme yasağı 3 tur ve 50 deneme, `KupaTablo +40 … −40`, 0–400 kupada kayıp yarı, bot izi eğrisi (`BotIzEgri`, `BotIzTavan`, güç kayması).
- **Armağan ve alamet:** `Armaganlar` (20; kademe, `Savas` alanı), kademe olasılıkları, armağan sayıları (`Arm*`), `Alametler` (12, ağırlıklı; Durgun Gök 2) ve Hızlı Maç için eski 8 alamet.
- **Hızlı Maç:** `KutVeri.Hizli` (10 altın, yenileme 1, kaynaştırma 3, 5 can, 7 zafer, tura bağlı takım ve dükkân).

### 9.3 Unity tarafında yapılacaklar

1. **Kopyala:** `KutVeri.cs`, `KutSavas.cs`, `KutHayalet.cs`, `KutLobi.cs`, `KutLobiOda.cs` → `Assets/Kut/Kod/`. Veri değişince `KutVeri.cs`'yi elle değil, üreticiyle yenile.
2. **`MacYoneticisi` (`web/oyun.js` karşılığı, MonoBehaviour değil):** maç durumu (`tur`, `seviye`, `xp`, birikimli `altin`, `can`, `seri`, 12 hücrelik `tahta`, 7 `yedek`, `dukkan`, `esyaRaf` + taşan kuyruk, `armagan`, bekleyen seçimler: başlangıç kahramanı, Kervan, ganimet, armağan, Soy Mührü). İşlevler: `YeniMac(mod)` (`arena` | `lobi` | `hizli`), `TurBaslat` (tur tipine göre: PvP / canavar / Kervan; gelir `TurBasi`; lobide `EslesmeKur` + `LobiRakip`), `XpAl`, `Yenile`, `SatinAl`, birleşme, kaynaştırma (Üçlü Kaynaşma dahil), `Sat` (eşyalar rafa), `EsyaTak` / raf birleştirme / Söküm Taşı, `ArmaganSec` / `ArmaganYenile`, `KervanSec`, `GanimetSec`, `SavasHazirla` (motor seçenekleri: `gunBatimi`, `kutHak`, `armagan`, `yz`, `kut` kaydı + `yzYedek`), `SavasBitti` (lobide `LobiTurOyna` + canlı sonuç; `TurSonu`; ganimet; iz yazma). JS'teki `web/oyun.js` satır satır örnek alınır; `test/oyun_mantik.test.mjs`'teki senaryolar Unity'de oyun modu testi olarak yeniden kurulabilir.
3. **Maç izi ve havuz:** her tur sonunda kısmi, maç sonunda tam iz (`MacIzi`) yazılır; yerelde en çok 60 iz. Uzak havuz için `IIzHavuzu`'yu Firebase ile uygula (belge 13.8: `iz/{surum}_{kupaKovasi}/maclar/{macId}`). **14 gün ve sürüm süzgeci** JS'te G/Ç katmanında (`online.js Hayalet.lobiKur`); C#'ta `LobiBul` uygulamasının işi. `Date` yalnız bu katmanda kullanılır, kurallarda asla.
4. **Arayüz (ayrıca yeniden tasarlanacak, `ARAYUZ_V2.md`):** 4×3 tahta ve 7 yedek; deneyim düğmesi (Sv, ilerleme, 4 altın); kartlarda havuz sayısı; eşya rafı (10) ve birim üstünde eşya simgeleri; armağan penceresi (15 sn sayaç, süre dolunca ilk kart; 1 yenileme); Kervan ve ganimet seçim pencereleri; lobi şeridi (ayakta kalan, sıra, rakibin canı); Kut düğmesinde hak sayacı (`KutKalanSay` / `KutHakSay`); Gün Batımı göstergesi; sıradaki alamet satırı; maç sonunda 8 kişilik sıralama ve kupa.
5. **3D sahne:** yeni konumlar, canavar modelleri, eşya ve yankı olayları, yeni durumlar. Madde madde liste: `kut/web/SAHNE_GEREKSINIM.md` (Adım 1–7 bölümleri).
6. **Testler:** kural değiştiğinde önce JS, sonra C#; ardından `node kut/test/esdeger_uret.cjs` ve `dotnet run` yeniden %100 olmalı. Denge ölçümü: `node kut/test/denge_benzetim.mjs 1.5` (bot lobisi, kurallı ajan lobisi, Kut hedefi) ve `node kut/test/esya_denge.cjs 2000`; sonuçlar `kut/test/DENGE_RAPORU.md`.
7. **Açık noktalar:** uzak iz havuzu (Firestore), öğretici (Çıraklık Maçı, `OGRETICI.md`), Hızlı Maç ile Arena/Lobi arasında profil ve kupa ayrımı, bölüm tabanı ve faiz adımının belgedeki ilk değerlerden sapması (onay bekliyor; gerekçeler `DENGE_RAPORU.md`'de).
