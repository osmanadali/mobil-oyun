# Kut Arena: Unity devir belgesi

Bu belge, Unity'ye bağlı (bilgisayardaki) Claude oturumunun işi kaldığı yerden alması için yazıldı. Önce bunu, sonra `TASARIM.md` ve `GORSEL_REHBERI.md` dosyalarını oku.

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

`sim.js` → `KutSavas.cs` (saf C#, MonoBehaviour değil). Tarayıcı sürümüyle **aynı sonucu** vermeli: aynı tohum (mulberry32), aynı 0,05 sn adım, aynı sıra. Bunu doğrulamak için `node kut/test/sim.test.cjs` çıktısındaki örnek savaşları C# testine koy.

| JS | C# |
|---|---|
| `data.js` | `KutVeri.cs` (ScriptableObject ya da JSON); kahraman, soy, alamet, `KURAL` |
| `sim.js` | `KutSavas.cs`: `Adim()`, `Kut(taraf, i)`, `fx` olay listesi |
| `online.js` | `Hayalet.cs`: bot takım, düello kodu (`KUT1-` biçimi aynı kalsın, iki sürüm birbirinin kodunu çözebilsin), uzak havuz arayüzü |
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
4. `KutSavas.cs`'i yaz, JS testleriyle aynı sonucu verdiğini doğrula.
5. 16 yaratığı içe aktar, iki takım dizip ilk tam savaşı oynat.
6. Dükkân ve tahta arayüzü, Kut dokunuşu, kaynaştırma.
7. Efektler; sonra çevrimiçi (Firebase) ve paketleme.

## 8. Kullanıcıyla çalışma

- Türkçe, kısa ve öz.
- Görsel kararlarda ekran görüntüsü göster, onay al.
- Kredi harcayan üretimler (Tripo, ChatGPT) kullanıcıda.
- Commit mesajlarına model adı yazılmaz.
