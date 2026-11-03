# M25 · Son sefer (`last`)

Hat M25, ilk bölüm 633 (3 Kasım, `kurallar-3`). Dosyalar: `www/rules/son-sefer.js`, `tools/hakem/son-sefer.cjs`. Esin kaynağı: Candy Crush'ın sayılı bombası (hamle sayacı biter, bir şey kaybedilir).

**Kural.** Bazı duraklar ⏳ saatlidir: üstündeki sayı kadar **hamle içinde** merkeze bağlanmalıdır. Yetişmezse **↻ hamle yıldızı söner**. Oyun bitmez, can gitmez, bölüm sürer. Durak bağlanınca sayaç kalkar ve bir daha gelmez (sonradan kopsa da). İngilizce adı bilerek "Timed station": "last train" son süre (🚉) için kullanılıyor.

**Sayaç tanımı.** Sayaç `B` ise oyuncunun `B` hamlesi vardır. Ekrandaki sayı `B − hamle`; 0 gösterirken oyuncu aynı karoya dokunmaya devam edebilir (aynı karoya art arda dokunuş tek hamle). Kaçırma, **yeni bir hamle başlarken** (`hamle > B`) durak hâlâ bağlı değilse olur. Bağlı olup olmadığına hamleden önceki dizilimle (`G.hist`'in son kaydı) bakılır; böylece ipucuyla bağlanan durak da doğru sayılır.

**Neden zorlaştırır.** Çözücü puanını değiştirmez, oyuncuya **sıra** dayatır: saatli durağın yolunu önce kurmak gerekir. Tahtanın geri kalanında "kolay olanı önce çöz" alışkanlığı ↻ yıldızına mal olur. Ölçüm: karoları dizin sırasıyla düzelten (sırasız) oyuncu 400 tohumun 398'inde en az bir sayacı kaçırır.

**Üretim (`fin` aşaması, `ord: 25`).** Çekirdeğe yeni `fin` aşaması eklendi: karanlık tünel ve "çözülmüş gelmesin" başlangıç dizilimini kesinleştirdikten **sonra**, par hesabından önce çalışır (yalnız miktarı > 0 olan eklenti için; eski bölümler bit bit aynı).

1. Çözüm ağacı (`tree(P, sol)`, tünel/sarmal komşuluğu dahil) ile her uç durağın merkezden yolu bulunur.
2. Aday durak: çözümde tek kollu, merkez değil, birimde (makas, tabla, sıra, sütun) değil, `busy`/`keep` değil, kapalı (`void`) ya da silik (`self`) değil; yolunda köprü (`split`) ya da kapalı karo yok.
3. Yolun **yanlış birimleri** sayılır (`need`): normal karo, eşli karo (ikisi bir), eklenti birimi (`unitTaps > 0`) her biri 1 hamle.
4. Yolunda en az 3 yanlış birim olan duraklar tercih edilir; `R()` ile `x.last` tane seçilir, `need` küçükten büyüğe sıralanır.
5. Sayaç: j. durak için `B_j = |yol_1 ∪ … ∪ yol_j yanlış birimleri| + pay` (pay: tek duraklı bölümde 3, sonra 2).
6. Veri: `out.last = { st: [durak], B: [sayaç], path: [[merkez … durak]] }`.

Miktar: hattın ilk bölümü 1 saatli durak, sonra 2, hat finali 3.

**Hamle payı kanıtı.** Durakları sırayla bağlayan oyuncu, j. durağa kadar yalnız `yol_1 ∪ … ∪ yol_j` üzerindeki yanlış birimleri düzeltir; her biri tam 1 hamledir (aynı karoya art arda dokunuş tek hamle, eşli karo ikisini birden, birim kendi dokunuşlarıyla). Yol karoları çözüm yönündeyse merkezden durağa kollar karşılıklıdır, durak yanar. Böylece j. durak en geç `B_j − pay` hamlede bağlanır. Toplam hamle = düzeltilen birim sayısı = `par` ≤ ↻ hedefi. Robot testi bunu 400 tohumda (her uyumlu eklentiyle) sınar: hiçbir sayaç kaçmaz, toplam hamle tam `par`.

Oyun içi kısıtlar sırayı bozmaz:

- Karanlık tünel: yol merkezden dışa kurulduğu için sıradaki karo hep yanan hattın 2 karo yakınındadır.
- Mühürlü karo: yoldaki mühürlü karonun ebeveyni ondan önce bağlanır, mühür açıktır.
- Soğuyan karo: yoldaki karoya bir kez dönülür, geri gelinmez.
- Sayaçlı karo: çözüm yönü ≤ 3 dokunuş.

**Çakışma.** `clash: ['gear']`: ⚙ bakım karosu her 2 hamlede kendiliğinden döner, yolu hamle sayısından bağımsız bozar; pay kanıtı geçmez.

**Oyun.**

- Durum `G.lastS = { at, miss }` (bulmaca verisi önbellekte paylaşıldığı için ona yazılmaz). Yarım oyundan dönüşte yanan durak yetişmiş, yanmayan ve sayacı geçmiş durak kaçmış sayılır.
- Kaçınca `G.mLost` dolar. Çekirdek `movesOk()` bunu okur: ↻ yıldızı söner, "⏳ Son sefer kaçtı · ↻ ★ söndü" bildirimi, gösterge "⏳ SEFER KAÇTI". Kazanma panelinde kaçan hedef "⏳ son sefer", kayıtta `miss[l][1] = −1` ("⏳ son sefer kaçtı").
- ↶ geri al (`undo`): geri alınan hamlelerdeki bağlanma ve kaçırma silinir; sayacın içine dönülünce ↻ yıldızı geri yanar.
- Yetişince kısa iki nota ve "⏳ Son sefere yetişti" bildirimi.
- `prio(G)` (yeni genel kanca): bekleyen saatli durakların yolları, en kısa sayaç önce, merkezden dışa. İpucu yanlış karolardan önce bunu seçer; robot (`tools/hakem.cjs` › `solve`) her turda önce bu karolara dokunur.

**Çizim (`top`, karanlık örtünün üstünde).**

- Durağın çevresinde kalan payı gösteren yay (12'den saat yönünde) ve sağ üstte kalan hamle rozeti, amber.
- Son hamlede kırmızı nabız; kaçınca kesik gri çember ve "–". Biçim renge bağlı değildir.
- Sayaç karanlık tünelde de görünür: oyuncu saatli durağın yerini bilmelidir.

**Zorluk ve merdiven (3 Kasım).** Kural çözücü puanını değiştirmez (7×9, 60 tohum: 14,5 → 14,5). Hat ortalamasını seçici hedefi taşır: `boost: 7` ve `scan: 48` (yeni alan; yalnız kendi hattında en az 48 aday taranır, çünkü bazı tohumlarda 32 aday hedefe ulaşmıyordu). Ölçüm: M24 20,1 < **M25 20,5** < M26 20,9.

**Bilinen sınırlar.**

- Sayaç bir "kusursuz" ölçüttür; oyunu bitirmeye engel değildir. Bu bilerek böyle: kural can ya da bölüm kaybettirmez.
- Halka hatta (döngü) durak başka yoldan da bağlanabilir; bu yalnız oyuncunun lehinedir.

**Test.** `tools/hakem/son-sefer.cjs`: `rule.last.gen`, `.fair` (kusursuz oyuncu yetişir, sırasız kaçırır), `.line` (merdiven), `.old`, `.card` (320 px), `.play`, `.miss` (söner, oyun sürer, ↶ geri al, kayıt), `.hint`, `.fog`, `.errors`.
