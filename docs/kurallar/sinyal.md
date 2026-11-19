# M28 · Sinyal karosu (`signal`)

Hat M28, ilk bölüm 717 (19 Kasım, `kurallar-4` sonrası). Dosyalar: `www/rules/sinyal.js`, `tools/hakem/sinyal.cjs`. Mühürlü karonun (M11, `seal`) tam tersi.

**Kural.** 🚦 Sinyalli karo yalnız **hiçbir komşusu yanmıyorken** döner. Komşularından biri yanınca (hat sinyalin yanına ulaşınca) sinyal **kırmızı** yanar ve kilitlenir: dokunuş yok sayılır, hamle sayılmaz. Hat kopunca sinyal yeniden açılır. Durum saklanmaz; her an `G.L.d`'den okunur. Komşuluk `api.nb` ile okunur (tünel ağzı ve sarmal tahta komşuları da sayılır).

**Kilidin tek tanımı:** "sinyalin komşularından biri yanıyor". Sinyalin kendisi hatta bağlıysa onu besleyen komşusu da yanar (merkez dışındaki her yanan karonun yanan bir komşusu vardır), yani hattaki sinyal her zaman kilitlidir. Kartta "komşularından biri yanınca (kendisi hatta bağlanınca da) kırmızı yanar" diye anlatılır. Robot bunu çözüm diziliminde denetler: çözümde her sinyal kilitli.

**Oyuncuya.** "Sinyalli karo yalnız hat ona ulaşmadan döner. Komşularından biri yanınca (kendisi hatta bağlanınca da) kırmızı yanar ve kilitlenir; hat kopunca açılır. Sinyali önce ayarla, dıştan içe çöz."

**Neden zorlaştırır.** Bilgi eklemez: çözüm kümesi, tahta ve başlangıç dizilimi kuralsız tohumla aynıdır; kilit yalnız oyuncunun zaten gördüğü ışıktan çıkar (yön, uzaklık söylemez). Kural yalnız sırayı kısıtlar: sinyalin yönü, hat oraya gelip yanma geri bildirimi vermeden, **kafada** çözülmelidir. Merkezden dışa ilerleme alışkanlığı (mühürlü karoda zorunlu olan yol) burada sinyali yanlış yönde kilitler; oyuncu hattı koparıp geri dönmek ve hamle kaybetmek zorunda kalır.

**Üretim (`mark`, `ord: 26`; mühürlüden ve kayan sütundan sonra, ekspres duraktan önce).** Aday karo:

- Çıplak bir karodur: birim, eşli, ters, sayaçlı, köprü, tünel ağzı değildir; başka bir eklentinin n uzunluklu işaret dizisinde ya da `.mark` dizisinde yer almaz; `per(sol) > 1` (dört yönlü kavşak değil).
- Başlangıçta çözümde yanlış durur (`cur ≠ sol`).
- Merkezin komşusu değildir (merkez hep yanar, orada sinyal hep kilitli olurdu) ve o anki dizilimde hiçbir komşusu yanmaz.

Seçilen karolar `C.busy` olur: karanlık tünelin merkez komşusu ayarı ve "çözülmüş gelmesin" onlara dokunmaz. **`fin`** (başlangıç dizilimi kesinleştikten sonra) yeniden denetler: başta kilitli ya da çözüm yönünde duran sinyal kalırsa çıkarılır; hiç sinyal kalmazsa aday reddedilir (`P.reject`, `pick` başkasını seçer; ölçümde 320 tohumda hiç olmadı). Miktar: tanıtımda (6×8) 2, sonra ızgaranın ~%6'sı (6×8 3, 7×9 4), hat finalinde ~%8 (7×9 5). Eklenti `R()`'yi yalnız sinyalli bölümde, `mark` aşamasında (karıştırmadan sonra) tüketir; bu yüzden çözüm ve başlangıç dizilimi sinyalsiz tohumla bit bit aynıdır.

**Çözülebilirlik kanıtı.** Başlangıçta her sinyal kilitsizdir (`fin` garanti eder).

1. *Lemma:* kilitsiz bir sinyal s'yi çevirmek yanan karo kümesini değiştirmez. Işık merkezden, iki ucu da birbirine bakan kollar üzerinden yayılır (`lit`, BFS). s'nin hiçbir komşusu yanmıyorsa merkezden s'ye ya da s üzerinden başka bir karoya giden yanan yol yoktur; s'nin maskesi bu yolların hiçbirinde yer almaz. Çevrildikten sonra da komşuları aynı kalır (yanmıyor), s yine erişilmez. Köprü yarıları, tünel ağzı, sarmal tahta ve iki merkez aynı komşuluk ve BFS üzerinden işler.
2. *Sıra:* oyuncu önce bütün sinyalleri çözüm yönüne çevirir. Lemma gereği her adımdan sonra ışık aynı kalır, öyleyse sıradaki sinyal de kilitsizdir.
3. Sonra kalan karolar herhangi bir sırayla çözüme getirilir; sinyallere bir daha dokunmak gerekmez (çözümde zaten doğrudurlar), kilitlenmeleri bir şeyi engellemez.

Karanlık tünelde sinyal karosu her zaman görünür (`reveal`: yalnız karonun kendisi, çevresi değil; "sinyal lambası karanlıkta da yanar"), böylece 2. adım karanlıkta da yapılabilir. Kilit yalnız ışığa bağlı olduğundan karanlık bilgi sızdırmaz; görünen tek şey sinyal karosunun rayıdır.

Oyuncu yanlış sırayla kilitlenirse: hattı koparıp sinyali açabilir, ↺ baştan her zaman geri getirir; 💡 ipucu önce yanlış sinyali (kilitli olsa da) çözüme oturtur.

**Çakışma.** `clash: ['seal', 'gear', 'last']`.

- Mühürlü karo: tam tersi kural; aynı tahtada iki ters sıra.
- Bakım karosu: her 2 hamlede kendiliğinden döner; sinyal ayarlanırken hattı sinyalin yanına getirebilir (oyuncunun elinde olmadan kilit).
- Son sefer: hamle payı merkezden dışa yol için hesaplanır; sinyali önce ayarlamak bu payı yer.

**Oyun.**

- `block`: kilitliyken ilk seferde "🚦 Sinyal kırmızı · hat yanına ulaştı, karo dönmez". Çekirdek karoyu bastırma animasyonuyla oynatır.
- `after`: bir sinyal kırmızıya dönünce kısa, alçak tık. Doğru ya da yanlış ayarlanmış olsun aynı ses (bilgi vermez).
- `prio`: ipucu ve robot önce yanlış duran sinyalleri çözer (robot turu yalnız onları çevirir, sonra kalan karolar).

**Çizim (`over`).** Karonun sol üstünde koyu, dikey sinyal başı ve iki lamba:

- Açık (dönebilir): **alt** lamba yeşil.
- Kilitli: **üst** lamba kırmızı ve içinde yatay "dur" çizgisi.

Durum renge ek olarak lambanın konumu ve biçimiyle ayrılır (renk körü dostu, gerçek trafik ışığı gibi). Animasyon ve nabız yok (sakin). Lambalar tek yolda toplanır (kare başına birkaç çağrı). Açık temada koyu kırmızı/yeşil.

**Kural kartı.** Demo: iki karo; sinyalli karo önce döner (alt lamba yeşil), sonra yanındaki karo yanar, üst lamba kırmızı olur; dokunuş halkası belirir, karo yalnız kıpırdar, dönmez. `prefers-reduced-motion`'da son kare durağan. 9 dilde 320 px'te taşmaz.

**Ölçümler (19 Kasım).**

| Ölçüm (320 tohum, 6×8 · 7×9; yalın, iki merkez, karanlık+ters+sayaçlı ve çakışmayan her eklentiyle) | Sonuç |
|---|---|
| Sinyali önce ayarlayan oyuncu çözer | 320 / 320 (en çok 1 tur) |
| Kilitsiz sinyali çevirmek ışığı değiştirir (lemma ihlali) | 0 |
| Başta kilitli sinyal · çözümde kilitsiz sinyal · yer kuralı ihlali | 0 · 0 · 0 |
| Merkezden dışa (derinlik sırasıyla) çözen oyuncu takılır | 320 / 320 |
| Tahta sinyalsiz tohumla aynı · çözücü puanı aynı | 320 / 320 · 320 / 320 |
| `fin`'de hiç sinyal kalmayan (reddedilen) aday | 0 / 320 (8 aday başka kuralın adillik denetimiyle reddedildi) |

**Zorluk ve merdiven.** Çözücü puanı sırayı ölçmez: aynı tohumda sinyalli ve sinyalsiz tahta aynı, puan da aynı (önce = sonra, 320/320). Kuralın zorluğu (yönü kafada çözmek, yanlış sırada kilitlenmek) puana girmediği için pay `boost` ile verilir; kurallı bölüm daha zor tabandan seçilir. Hat ortalaması (ekspres-durak.md'deki yöntem, `puzzleFor(l).diff` hattın 28 bölümünde): `boost: 0` → M28 16,5; `boost: 16` → **M28 24,0** > M27 (ekspres) 23,6. (ekspres-durak.md'deki 21,6, tek yön kaldırılmadan önceki hat düzeninde ölçülmüştü; bugünkü koşuda M27 23,6.) Karma (M29+) sinyalli bölümleri 280 bölümde 14 kez.

**Bilinen sınırlar.**

- Karanlık tünelde sinyal karosunun rayı görünür (yalnız o karo). Sinyalin ayarlanabilmesi için gereklidir.
- Hattın yanlış sırayla kilitlediği bir sinyal, kilidi açacak karo ipucuyla sabitlenmiş ya da sayacı bitmişse yalnız ↺ baştan ya da 💡 ipucuyla düzelir.

**Test.** `tools/hakem/sinyal.cjs`: `rule.signal.gen` (320 tohum), `.solve` (sinyali önce ayarlayan oyuncu, lemma), `.effect` (merkezden dışa takılır, tahta ve puan aynı), `.clash`, `.line` (merdiven M27 < M28), `.old`, `.card` (9 dil, 320 px), `.play` (kilitsiz döner, komşu yanınca dokunuş yok sayılır, kopunca açılır, robot kazanır), `.mid` (7×9), `.fog`, `.errors`.
