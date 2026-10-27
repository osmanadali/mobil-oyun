# M9 · Makas (anahtar: `sw`)

> Bu belge tasarım iş akışının çıktısıdır: üç bağımsız tasarımcı, bir seçici ve şüpheci bir doğrulayıcı. Uygulama notlarındaki satır numaraları ve "şu fonksiyonu değiştir" önerileri eklenti iskeletinden ÖNCE yazıldı. Ortak altyapı (birim/val, komşuluk adj, bölünmüş düğüm, tree(), kayıt imzası, kural kartı göçü, çakışma) artık çekirdekte hazır; kural yalnız kendi dosyasında, kancalarla yazılır: docs/kurallar/README.md.

**Neden seçildi:** M9 için en sade kural: tek satırlık dokunuş, 2 durumlu ve kendi tersi olan bir işlem. Çözülebilirlik kanıtı en sağlam kurallardan biri; prototipini ben de yeniden koşturdum (600/600). Yeni bir düşünme biçimi getiriyor: karo dönmüyor, şekil değiştiriyor. İki merkezle çok iyi karışıyor. Ortak altyapıyı (birim/val refaktörü, kayıt imzası, kural kartı göçü) taşıyan ilk kural olmaya en uygun aday bu. Türü: etkileşim. Seçimde değişiklik yaptım: merkeze bitişiklik yasağı, ortadaki üçgenin kaldırılması (tabelayla karışmasın) ve eski oyuncular için kart göçü.

## Kural kartı metni

<b>Makas</b> dönmez: dokununca yol <b>düz</b> ile <b>sapak</b> arasında değişir. <b>Kesik çizgi</b> öbür yolu gösterir.

## Görünüş

Karo dönmez. Açık kol normal ray olarak çizilir. Öbür kol ince, kesik, gri bir çizgidir ve ucunda küçük boş bir halka vardır (⑂ / Y). Ortadaki üçgen 'dil' KALDIRILDI, çünkü M13 tabelasının okuyla karışırdı. Ayrım dolu/kesik çizgiyle yapılır, renge dayanmaz.

## Mekanik

Makas karo hiç dönmez. Gövde rayı sabittir; karşı ucu iki kol arasında değişir: gövdenin tam karşısındaki düz kol ile gövdeye dik sapak kol. Veri: sw[i] iki kolun bit maskesidir (gövde S ise sw = N|E), makas olmayan karoda 0'dır. Dokunuş cur[i] ^= sw[i] olur. Karoda iki koldan yalnız biri açık olduğu için XOR ikisinin yerini değiştirir. Gövde = cur & ~sw, kullanılmayan kol = sw & ~cur. Eşli, ters ve sayaçlı karodan farkı: dönüş yoktur, karonun ŞEKLİ değişir. Oyuncu tahtada gördüğü iki seçenekten birini seçer. 'Hangi kol, hangi istasyon' kararı iki merkezle birlikte özellikle güçlüdür.

## Üretim ve çözülebilirlik kanıtı

generate() içinde eşli karolardan sonra, rev/cnt'den önce çalışır (satır 281 civarı). R() yalnız x.sw varken tüketilir, 1–208 bölümleri bit bit aynı kalır.
Aday koşulları: free(i) && popc(sol[i])===2 && hub ve hub2'ye Manhattan ≥2. Bu son koşul İYİLEŞTİRME: fog'un 'merkez yalnız başlar' adımı (satır 286–291) makası çeviremez, merkeze bitişik makas karanlık tünel başlangıcını bozardı.
Gövde t, sol[i]'nin raylarından rastgele biridir; açık kol a = sol[i]&~t. a düz yolsa b ∈ {rot(t), unrot(t)} (sapak), değilse b = rot(rot(t)) (düz). b tahtanın içine bakmalıdır; P.adj varsa (M19) adj≥0 yeterli. Sonra sw[i]=a|b ve cur[i] = R()<.75 ? sol[i]^sw[i] : sol[i]. Sayı: x.sw = max(2, round(n·(intro ? .05 : .08))), yani 6×8 girişte 2, 7×9'da 5.
free() genişletilir: && !sw[i] && plate[i]<0. Böylece rev, cnt ve fog'un komşu döndürmesi makası atlar.
KRİTİK: satır 293'teki 'çözülmüş gelmesin' findIndex'ine !sw[j] && plate[j]<0 eklenmelidir. Eklenmezse rot() makası {sol, sol^sw} yörüngesinin dışına çıkarır ve bölüm çözülemez olur.
par/taps: makas için r = cur!==sol ? 1 : 0.
KANIT: f(m)=m^sw kendi tersidir (f∘f = kimlik). Üretici çözümden başlar ve cur'u {sol, f(sol)} içinden seçer; oyuncu en çok 1 dokunuşla sol'e döner. Oyuncunun varabileceği her durum bu 2 elemanlı yörüngededir, dolayısıyla hiçbir hamle bölümü kilitleyemez. Öteki karolar eskisi gibi geri alınabilir: rot⁴ = kimlik, unrot, eşli t, sayaç ≤3.
DOĞRULAMA: prototip proto.js ile 5×6–7×9 arası 600 bulmacada 0 hata ve 0 hazır çözülü çıktı. walk.js'i (300+100 rastgele dokunuş + 3 ipucu + robot) yeniden çalıştırdım: 600/600 çözüldü.
ORTAK ALTYAPI (ilk yeni kural getirir): RULE_LINE = {…, sw:8, bridge:10, sign:12, table:14, ring:16, portal:18}; RULES[8], [10], [12], [14], [16], [18] eklenir. sizeFor testere dişi RULES anahtarından otomatik gelir.

## Kazanma koşulu

lit() değişmez. Makas her durumda 2 raylıdır, durak sayılmaz. Kullanılmayan kol ray değildir, lit() onu görmez. Kazanma koşulu aynen geçerlidir: açık uç yok, hepsi bağlı, iki hat karışmamış. İki merkezde makas bir dalı öbür hatta çevirirse mevcut 'hatlar karıştı' uyarısı kendiliğinden çalışır.

## Dokunma

Tek dokunuş. pointerdown'da fixed, fog, pinned ve cnt kontrollerinden sonra, satır 951 şöyle olur: if (G.sw[i]) G.cur[i] ^= G.sw[i]; else G.cur[i] = G.rev[i] ? unrot(G.cur[i]) : rot(G.cur[i]).
Makasta anim.set(i) ÇAĞRILMAZ; çağrılırsa karo dönüyormuş gibi çizilir. press + ripple + kısa bir 'tık' tonu yeter.
lastTile anahtarı i'dir; aynı makasa art arda dokunuş 1 hamle sayılır. İlk dokunuşta bir kez 'Makas · düz ↔ sapak' bildirimi çıkar (save.swTold).

## Çizim

6d'nin yanına yeni 6e bloğu, yalnız G.sw.some(Boolean) iken çalışır.
(1) Tek yol: her görünür (vis) ve ipucuyla sabitlenmemiş makas için railPath(X[i], sw[i]&~cur[i]). Ardından setLineDash([s·.07, s·.07]), lineWidth s·.06, pal.mut ile stroke, sonra setLineDash([]).
(2) Tek yol: kesik kolun ucunda r = s·.06 boş halka, pal.mut ile stroke.
Açık kol normal ray geçişlerinde (sönük ya da yanan) çizilir, ek maliyeti yoktur. Toplam +2 çağrı, animasyon yok. İpucuyla sabitlenen makasta kesik kol çizilmez.

## Zorluk çözücüsü ve robot

difficulty() ortak birim refaktörü (öteki kurallar da kullanır): grp(i) birimi döndürür (eş → [i,j], tabla → 4 hücre, diğer → [i]). val(i,r) birimin r. durumundaki maskesidir; K birimin durum sayısıdır.
Makasta val(i,r) = r ? cur[i]^sw[i] : cur[i] ve K = 2. C0 'for r<K' ile kurulur; step() içindeki can(), aday filtresi ve dfs yaprağındaki lit çağrısı rn(cur[i],r) yerine val(i,r) kullanır.
Normal karoda val = rn olduğundan eski puan birebir korunur (prototipte 150/150 aynı puan).
Robot solve() (hakem.cjs satır 96 civarı), döndürme döngüsünden ÖNCE: if (G.sw?.[i]) { if (v !== G.sol[i]) out.push(i); return; }. Bu eklenmezse robot dönüş sayısını hesaplar ve makasa 2–3 kez dokunarak yanlış duruma düşer.
Testler: 300 tohumla generate(7,9,s,0,0,{sw:5}) çalıştırılır; lit(sol).solved, !lit(cur).solved ve cur[i] ∈ {sol, sol^sw} olmalı, hiçbir makas merkeze bitişik olmamalı. Ayrıca kural kartında /Makas/ aranır, dokununca cur[i] === eski^sw olmalı, solve() bölümü kazanmalı.

## İpucu, baştan, kayıt

İpucu: wrong[] içindeki makasa cur=sol ve fixed=true atanır; kesik kol gizlenir. Sabitlenen makasa dokununca mevcut 'ipucuyla sabitlendi' yolu reddeder.
↺ baştan: start() önbellekten ilk durumu getirir, keep[] sabitlenen makası sol'de tutar.
Kayıt: hangi kolun açık olduğu cur'dadır, yeni alan gerekmez.
ORTAK KAYIT GÖÇÜ (bu kuralla gelir):
(a) 209+ bölümler değiştiği için saveRun'a sig: hashStr(G.sol.join()) eklenir. start() içindeki satır 676 koşulu run.sig === sig || (run.pv === 4 && !daily && lvl < 209) olur; daily değişmez, onun için de sig yeterli.
(b) KURAL KARTI GÖÇÜ: start() satır 694 yalnız o hattın kartını gösterir. Bugün M10+ oynayan oyuncu karma bölümde makasla kartsız karşılaşır. Düzeltme: const c = G.rules.map(k => RULE_LINE[k]).filter(c => RULES[c] && !save.seen[c]).sort((a, b) => a - b)[0]; if (c != null) ruleCard(c).

## Öteki kurallarla karışım

Hücre düzeyinde ayrık: makas sabit, eşli, ters ya da sayaçlı olamaz (free() dışlar). Tabla adayları !sw şartını arar. Tabela ve halka işaretleri yalnız bare karoya konduğu için makasa düşmez.
Karanlık tünel: merkeze bitişik makas yok; kesik kol vis() ile gizlenir.
İki merkez: en güçlü eşleşme, makas dalı hangi istasyona gideceğini seçer.
Köprü: makas popc 2, köprü 15 olduğundan çakışmaz.
Halka: makasın iki durumu da 2 kollu olduğu için toplam kol sayısı değişmez. 'Tek halka' sayım kanıtı korunur.
Tünel ağzı: b kolunun 'içe bakma' denetimi adj≥0 olur, tünele bakan sapak geçerlidir.
CLASH yok.

## Kural kartı demosu

.rdemo6: tek .pt karo (76 px). İçinde .g alt yarıda dolu gövde (var(--acc)), .d üstte düz kol, .s sağda sapak kol.
@keyframes swA{0%,49%{background:var(--acc)}50%,100%{background:none;box-shadow:inset 0 0 0 2px var(--mut)}} tanımlanır. .d{animation:swA 2s steps(1) infinite} ve .s{animation:swA 2s -1s steps(1) infinite} ile iki kol dönüşümlü dolup kesik olur.
Mevcut .rtap2 halkası her yarım dönemde 'dokunur'. Kart altında 1 cümle: 'Dokun: yol düzden sapağa geçer.' Yaklaşık 6 satır CSS.

## Zorluğa etkisi

Makas aday sayısını 4'ten 2'ye indirir ve bulmacayı hafifçe kolaylaştırır. Prototip ölçümü (150 tohum): 7×9'da 13,63 → 13,30 (5 makas), 6×8'de 12,78 → 12,32.
pick() bunu telafi eder. Kendi ölçümümde 7×9, hedef 13,2, K=25 ile seçilen ortalama yalın tahtada 13,08, makaslıda yine 13,08 çıktı; hedef tutuyor.
hakem difficulty.ladder M9'u da denetler (c<9): M9 ortalaması M8'i (12,3) aşmalı. Hedef 5+11z = 12,8–13,5 olduğundan beklenen sonuç geçer; yine de ilk koşuda ölçülmeli.

## Riskler

(1) Satır 293'e !sw eklenmezse bölüm çözülemez olur; hakem testi bunu yakalamalı.
(2) solve() güncellenmezse robot makasta takılır.
(3) anim.set unutulursa karo dönüyormuş gibi görünür.
(4) Kesik kol, eşli karonun dokununca beliren kesik bağ çizgisiyle karışabilir. Makas kolu ince, gri ve uçta halkalıdır; eşli bağ renkli, kalın ve geçicidir.
(5) Hiç dönmediği için sabit karo sanılabilir; kesik kol ve kural kartı bunu önler.
(6) M9 artık kural hattı olduğu için hakem rule.mix testi (satır 629: 209–240) M10'a (253–300) taşınmalı; BOLUM_TASARIMI §5 tablosu güncellenmeli.

## Doğrulayıcının kararı

Çözülebilir: evet · Uygulanabilir: evet · Tutulsun: evet

**Karşı örnek / risk:** ÇÖZÜLEMEZLİK İÇİN KARŞI ÖRNEK BULUNAMADI. Kanıt: f(m)=m^sw kendi tersidir (f∘f = kimlik). Üretici cur[i]'yi {sol, sol^sw} yörüngesinden seçiyor. Ondan sonra makasa yalnız iki şey dokunuyor: kendi XOR'u ve ipucu (cur=sol). İkisi de yörüngenin içinde kalıyor.

Kendi deneyim: game.js'in gerçek generate/difficulty/lit kodunu Node'a çıkarıp öneriyi yamayla uyguladım (/tmp/claude-0/-home-user-mobil-oyun/bb21aa69-f6d1-52e7-9b31-ec2477378b24/scratchpad/m9v/load.cjs, test.cjs).
- Örnek: 3×3–7×9 arası 7 boy × 9 kural birleşimi (yalın, sabit, eşli, ters, sayaçlı, karanlık, iki merkez, iki merkez+karanlık, hepsi birden) × 120 tohum = 7560 bulmaca.
- Hatalı 0, hazır çözülü 0, değişmez ihlali 0.
- Işığı izleyen robot 0 başarısız. 300 rastgele dokunuş + 3 ipucu + 100 dokunuş + robot da 0 başarısız.
- 1–208 bölümleri bit bit aynı (sol, cur, diff, par, taps, rules: 0 fark).
- Merdiven önce: …12,3 → 13,2 → 13,9. Sonra: …12,3 → 13,1 → 13,9. M9 hâlâ M8'den zor. 901–910 bölümleri 12 ms/bölüm.

BOZULMA SENARYOLARI (öneride eksik ya da hatalı):
(1) Satır 293'te !sw eklenmezse bölüm kesin çözülemez. Örnek: sol=N|S, sw=N|E. rot ile cur=E|W olur, yörünge {E|W, N|W} olur ve N|S'ye hiç dönülmez. Pratikte 6×8 ve üstünde 900 bin denemede tetiklenmedi, ama kod yolu var. Ayrıca findIndex -1 dönerse cur[-1] yazılır (zaten var olan kusur).
(2) ÇİZİM HATASI (Chromium'da çizip doğruladım, dash.png): draw() lineCap='round' kullanıyor. setLineDash([.07s, .07s]) ve lineWidth .06s ile her parçaya yuvarlak uç eklenir, boşluk ~.01s ≈ 0,5 px kalır ve kesik çizgi neredeyse DÜZ görünür. Uçtaki halka s/2'de, yani karo kenarında duruyor; komşunun ray ucunun tam üstüne biniyor ve bir 'bağlantı eklemi' gibi okunuyor. Halka r=.06s ve kalınlık .06s olunca içi de dolu görünüyor.
(3) hint() satır 1196 anim.set(k) çağırıyor. İpucu bir makası oturtunca karo 90° dönüyormuş gibi canlanır. Öneri bunu yalnız dokunuş için düşünmüş.
(4) Demo CSS'i: '.pt b{animation:spin4}' kuralı var. Makas demosu .pt içinde <b> ya da :before/:after kullanırsa karo döner, yani 'dönmez' dersinin tersi gösterilir. inset box-shadow kesik değil düz çizgi verir.
(5) Kayıt koşulu (run.sig===sig || (pv===4 && !daily && lvl<209)) eski Günün Hattı yarım kaydını da siler. Oysa dailyFor değişmiyor.
(6) Küçük: 6×8 sw=2'de bölümlerin ~%6'sında iki makas da baştan doğru gelir. 209 bugün iki makası da ters getiriyor, ama bu güvenceye bağlı değil. M10'da yalnız 3/48 bölümde makas var (uzun vadede pay %18, normal).

### Zorunlu düzeltmeler

- generate() satır 293: findIndex koşuluna !sw[j] eklenmeli. i<0 olursa yedek olarak ilk makas çevrilsin (cur[q]^=sw[q]); hiç makas yoksa dokunulmasın. Bu, cur[-1] yazımını da kapatır.
- Makas yerleştirmede hub2<0 iken Manhattan uzaklığı 99 sayılmalı (md(i,-1)=99). b'nin tahta içine bakmasını sağlamak için gövde ve kol için olası [t,a,b] üçlüleri süzülmeli, aralarından R() ile seçilmeli; hiç üçlü kalmazsa aday atlanmalı. 3×3'te hiçbir aday kalmıyor, bu sorun değil (M9 en küçük 6×8).
- Çizim 6e: kesik kol cx.lineCap='butt' ile, setLineDash([s*.055, s*.045]) ve lineWidth s*.055 ile çizilmeli. Kol merkezden .10s'den .29s'ye uzanmalı, halka KARONUN İÇİNDE .355s'de durmalı (r=.055s, kalınlık .03s). Renk pal.mut, globalAlpha .85. Kenardaki halka komşu rayın ucuna biniyor; render ile doğrulandı.
- hint(): G.sw[k] olan karoda anim.set(k) çağrılmamalı, yalnız press.set kullanılmalı. pointerdown'da da anim.set atlanmalı (öneride var).
- Kural kartı demosu .pt içinde <b> ya da :before/:after KULLANMAMALI (spin4 kuralı onları döndürür). <u> öğeleri kullanılmalı. Kesik görünüm 'border:2px dashed var(--mut)' ile verilmeli. Dokunma halkasının fazı makas geçişine denk getirilmeli (.rdemo6 .rtap2{animation-delay:-.55s}).
- start() kayıt koşulu şöyle olmalı: run.sig===sig || (run.pv===4 && !run.sig && (daily || lvl<209)). Günün Hattı üretimi değişmediği için eski günlük yarım kayıt korunur. Eski uzunluk ve lvl/day denetimleri yerinde kalmalı.
- Kural kartı göçü: G.rules içinde görülmemiş en küçük kural hattının kartı gösterilmeli (yalnız !daily). Yoksa M10+ oyuncusu makasla kartsız karşılaşır.
- Robot solve() (hakem.cjs ~satır 96), dönüş döngüsünden önce: if (G.sw?.[i]) { if (v !== G.sol[i]) out.push(i); return; }. Bu olmazsa robot makasa 4 kez dokunur ve aynı yerde döner durur.
- hakem rule.mix aralığı 209–240'tan 253–300'e (M10) taşınmalı. M9 artık kendi kuralı olan bir hat; M10'da 18 çeşit karışım ölçtüm.
- Giriş bölümü güvencesi: intro iken en az bir makas ters başlamalı. Ya generate içinde !sw.some(ters) ise ilk makas çevrilmeli, ya da hakem 209'u denetlemeli. Bugün 209'da iki makas da ters, ama bu bir güvenceye bağlı değil.
- BOLUM_TASARIMI.md güncellenmeli: §5 tablosunda M9 satırı 'Makas' olmalı, 'M10+ karma' yazılmalı; §7'ye makas çözülebilirlik maddesi eklenmeli.

### Doğrulayıcının uygulama planı

GAME.JS: FONKSİYON FONKSİYON (sözde kod)

1) Kural kayıt defteri (satır 205–221)
RULES[8] = { name:'Makas', tag:'Yeni: makas',
  demo:'<div class="rdemo2 rdemo6" aria-hidden="true"><i class="pt sw"><u class="g"></u><u class="d"></u><u class="s"></u></i><i class="rtap2"></i></div>',
  text:'<b>Makas</b> dönmez: dokununca yol <b>düz</b> ile <b>sapak</b> arasında değişir. <b>Kesik çizgi</b> öbür yolu gösterir.' }
RULE_LINE = { pins:2, pairs:3, rev:4, fog:5, cnt:6, two:7, sw:8 }
Anahtar sona eklenir, sıra korunur. rulesFor() ve sizeFor() değişmez: testere dişi RULES[8]'den kendiliğinden gelir (sizeFor 208–212 = 7x9 6x8 6x8 6x8 7x9).

2) generate() (satır 280–302)
Satır 281'den ÖNCE:
  const sw = new Array(n).fill(0)
free tanımı şöyle olur:
  free = i => !isHub(i) && !pinned[i] && link[i] < 0 && !sw[i]
free'den sonra, rev/cnt'den önce:
  if (x.sw) {
    md = (a,b) => b<0 ? 99 : |ax-bx| + |ay-by|
    inside = (i,b) => b yönündeki komşu tahtada mı
    cand = [i | free(i) && popc(sol[i])===2 && md(i,hub)>=2 && md(i,hub2)>=2]
    for (k=0; k<x.sw && cand.length; ) {
      i = cand.splice(R()*cand.length|0, 1)[0]; m = sol[i]
      opts = []
      for t of bits(m):
        a = m & ~t
        for b of (a === rot(rot(t)) ? [rot(t), unrot(t)] : [rot(rot(t))]):
          if inside(i,b): opts.push([a,b])
      if (!opts.length) continue
      [a,b] = opts[R()*opts.length|0]
      sw[i] = a|b
      cur[i] = (R() < .75) ? m ^ sw[i] : m
      k++
    }
  }
R() yalnız x.sw varken tüketilir; 1–208 bölümlerinin aynı kaldığını doğruladım.
Karanlık tünelin komşu döndürmesi (satır 290) free() kullandığı için makası kendiliğinden atlar.

Satır 293:
  i = cur.findIndex((v,j) => !pinned[j] && link[j]<0 && !sw[j] && rot(v)!==v)
  if (i>=0) cur[i] = rot(cur[i])
  else { q = sw.findIndex(Boolean); if (q>=0) cur[q] ^= sw[q] }

par/taps döngüsünde, rotasyondan önce:
  if (sw[i]) { r = v!==sol[i] ? 1 : 0; taps += r; par += r; return }

return nesnesine sw eklenir.
cached() değişmez: sw hiç değişmeyen bir dizi.

3) difficulty() (satır 309–342)
  val = (i,r) => P.sw?.[i] ? (r ? cur[i]^P.sw[i] : cur[i]) : rn(cur[i], r)
  C0: K = P.sw?.[U[0]] ? 2 : 4, döngü r<K, anahtar U.map(i => val(i,r))
  step.can: rn(cur[j],r) yerine val(j,r); aday filtresi: val(i,r)
  dfs yaprağı: cur.map((v,i) => val(i, D[unit[i]][0]))
Normal karoda val = rn olduğu için puan birebir aynı (1–208'de diff farkı 0).

4) puzzleFor() (satır 362)
  x.sw = U.has('sw') ? Math.max(2, Math.round(n*(intro ? .05 : .08))) : 0
6×8 girişte 2 makas, 6×8'de 4, 7×9'da 5. M9 ortalaması 13,1, M8'in 12,3'ünden yüksek.

5) pointerdown (satır 950–957)
  if (G.sw[i]) {
    G.cur[i] ^= G.sw[i]
    if (!save.swTold) { save.swTold=1; persist(); toast('Makas · düz ↔ sapak') }
  } else {
    G.cur[i] = G.rev[i] ? unrot(G.cur[i]) : rot(G.cur[i])
    if (G.cnt[i] > 0) G.cnt[i]--
  }
  hamle sayımı aynen (key = i)
  if (!G.sw[i]) anim.set(i, now)
  press.set(i, now); ripples.push(...)
lit, reveal, ses ve titreşim değişmez.

6) hint() (satır 1196)
  for k of birim: G.cur[k]=G.sol[k]; G.fixed[k]=true; if (!G.sw[k]) anim.set(k,now); press.set(k,now)

7) draw(): yeni 6e bloğu 6d'den sonra, 6c'den (karanlık örtü) önce
start()'ta bir kez: G.anySw = G.sw.some(Boolean)
  if (G.anySw && !G.won) {
    L = []; for i: if (G.sw[i] && vis(i) && !G.fixed[i]) L.push(i)
    if (L.length) {
      cx.save(); cx.lineCap='butt'; cx.globalAlpha=.85; cx.strokeStyle=pal.mut
      cx.setLineDash([s*.055, s*.045]); cx.lineWidth = s*.055; cx.beginPath()
      for i of L:
        [x,y,,sc] = X[i]; b = G.sw[i] & ~G.cur[i]; [,dx,dy] = DV.find(d => d[0]===b)
        cx.moveTo(x+dx*s*.10*sc, y+dy*s*.10*sc); cx.lineTo(x+dx*s*.29*sc, y+dy*s*.29*sc)
      cx.stroke(); cx.setLineDash([])
      cx.beginPath()
      for i of L:
        rx = x+dx*s*.355*sc; ry = y+dy*s*.355*sc
        cx.moveTo(rx+s*.055*sc, ry); cx.arc(rx, ry, s*.055*sc, 0, 7)
      cx.lineWidth = s*.03; cx.stroke(); cx.restore()
    }
  }
Toplam +2 stroke, animasyon yok. Açık kol bugünkü ray geçişlerinde çizilir.
Neden butt: lineCap round iken kesik çizgi düz görünüyor (render ile doğrulandı). Halka iç kısımda durur, komşu raya değmez. Rozetlerle çakışmaz: makas eşli, ters ya da sayaçlı olamaz; ipucuyla sabitlenen makasta kol gizlenir.

8) saveRun() ve start()
saveRun: { ..., pv:4, sig: hashStr(G.sol.join()) }
start, satır 676:
  sig = hashStr(G.sol.join())
  ok = run && lvl/day eşleşir && run.cur?.length===G.cur.length && run.pv===4
       && (run.sig===sig || (!run.sig && (daily || lvl<209)))
Kayıtta makasın durumu cur'da durur, yeni alan gerekmez.
reset(): değişmez. start() önbellekteki ilk cur'u getirir; keep[] sabitlenen makası sol'de tutar.

9) start(), satır 694: kural kartı göçü
  if (!daily) {
    c = (G.rules||[]).map(k => RULE_LINE[k]).filter(c => RULES[c] && !save.seen[c]).sort((a,b) => a-b)[0]
    if (c != null) ruleCard(c)
  }

10) style.css (~8 satır, .rdemo2 bloğunun yanına)
.pt.sw u{position:absolute;border-radius:7px;box-sizing:border-box}
.pt.sw .g{left:31px;top:38px;width:14px;height:38px;background:var(--acc)}
.pt.sw .d{left:31px;top:0;width:14px;height:45px}
.pt.sw .s{left:31px;top:31px;width:45px;height:14px}
.pt.sw .d,.pt.sw .s{border:2px solid transparent;animation:swA 2s steps(1) infinite}
.pt.sw .s{animation-delay:-1s}
@keyframes swA{0%,49.9%{background:var(--acc);border-color:transparent}50%,100%{background:none;border:2px dashed var(--mut)}}
.rdemo6 .rtap2{animation-delay:-.55s}
Açıklama: <b> kullanılmaz, çünkü .pt b spin4 ile döner. Dokunma halkasının tepe anı kol değişimine denk gelir.

11) hakem.cjs
- solve(), satır ~96, tapper/lit denetiminden sonra:
    if (G.sw?.[i]) { if (v !== G.sol[i]) out.push(i); return; }
- YENİ E9 adımı ruleIntro(209,7):
  · kart /Makas/ başlığıyla açık, .rdemo6 var
  · G.sw ≥2 makas
  · makasa dokununca cur===eski^sw ve moves+1; ikinci dokunuşta eski değer geri gelir, moves değişmez
  · ↺ basınca cur ilk duruma döner
  · sayfa yeniden yüklenince yarım kayıt geri gelir, sig var
  · sizeFor 208–212 = '7x9 6x8 6x8 6x8 7x9'
  · 209'da en az 1 makas ters başlar
  · solve() ile bölüm kazanılır
- sw.solvable: 300 tohum × {7×9 sw5; 6×8 sw4 + sabit3 + eşli2 + ters4 + sayaç4 + iki merkez + karanlık}. Beklenen:
  · lit(sol).solved; !lit(cur).solved
  · her makasta cur ∈ {sol, sol^sw}; popc(sol)=2
  · makas sabit, eşli, ters ya da sayaçlı değil; merkeze Manhattan ≥2; b tahtanın içinde
- sw.hint: makas dışındaki her karo sol'e konur, ipucu basılır; fixed[makas] ve cur===sol olmalı, kazanmalı.
- sw.legacy: eski pv:4 kaydı (sig yok) lvl 250 için atılır, lvl 100 için ve daily için korunur.
- rule.mix: aralık 253–300 olur (≥6 çeşit; ölçülen 18).
- difficulty.ladder değişmez (c<9; ölçülen 12,3 → 13,1).

12) BOLUM_TASARIMI.md
§5 tablosuna 'M9 | 209 | ⑂ Makas | Dönmez; dokununca düz ↔ sapak' satırı eklenir, karma satırı M10+ olur. §2'deki M9 zorluk değeri 13,1 yazılır. §7'ye makas çözülebilirlik testi eklenir.

İsteğe bağlı: M10'da makas yalnız 3/48 bölümde çıkıyor. Bir kural tanıtıldıktan sonraki karma hatta o kurala ağırlık verilebilir; 1–208'i etkilemez. Kazanma anında kesik kollar gizli kalır (!G.won), son görüntü temiz olur.
