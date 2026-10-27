# M17 · Halka hat (anahtar: `ring`)

> Bu belge tasarım iş akışının çıktısıdır: üç bağımsız tasarımcı, bir seçici ve şüpheci bir doğrulayıcı. Uygulama notlarındaki satır numaraları ve "şu fonksiyonu değiştir" önerileri eklenti iskeletinden ÖNCE yazıldı. Ortak altyapı (birim/val, komşuluk adj, bölünmüş düğüm, tree(), kayıt imzası, kural kartı göçü, çakışma) artık çekirdekte hazır; kural yalnız kendi dosyasında, kancalarla yazılır: docs/kurallar/README.md.

**Neden seçildi:** Hedef türünde en derin kural: Net türünün temel sezgisini (döngü yok) bir kez tersine çeviriyor. Sayım kanıtını tüm kurallarla birlikte denetledim: makas, tabla, köprü ve tünel kol sayısını korur. Bu yüzden zarif ve sağlam. Kavramsal olarak tabladan zor, tünel ağzından kolay. M13'ün tree() yardımcısını yeniden kullanıyor. Türü: hedef (tabla gibi bir etkileşim kuralından sonra, tünel gibi bir geometri kuralından önce). Seçimde değişiklik yaptım: CLASH'e köprü eklendi, halka kenarının tünelden geçebilmesi, işaretin makas ve tablaya konmaması, iki merkezde sayım kanıtı.

## Kural kartı metni

Bu hatta raylar <b>bir kez</b> kendi üstüne kapanır ve <b>halka</b> olur. Halka <b>◯ işaretli</b> karodan geçmeli.

## Görünüş

◯: karonun içinde kesik çizgili büyük çember (r = .36s). Halka bu karodan geçip kapanınca çember düz çizgiye döner, halka rayları da ortada ince bir zemin çizgisiyle 'çift ray' görünür. Ayrım kesik/düz biçimle yapılır.

## Mekanik

Çözüm artık ağaç değil, tek döngülü bir çizgedir. Kol sayıları rot, makas, tabla ve köprü işlemlerinde değişmez. Tek merkezde n düğüm ve n kenar vardır, iki merkezde n düğüm, n−1 kenar ve 2 bileşen. Dolayısıyla açık ucu olmayan ve hepsi bağlı (karışmamış) her dizilimde TAM OLARAK bir halka vardır.
Kural bunu söyler ve halkanın yerini ◯ işaretine bağlar. Net oyuncusunun en güçlü sezgisi 'döngü kapatma' bu hatta bir kez tersine döner: bir yerde kapatman gerekir, ama yalnız işaretli karodan geçerek. Metro teması: çevre hattı.

## Üretim ve çözülebilirlik kanıtı

Ağaç döngüsünden (satır 254–261) sonra, cur karıştırmasından (262) ÖNCE, yalnız x.ring iken çalışır; eski bölümler bit bit aynı kalır.
(1) sol'de tree() (M13'ten) ile pa, dep ve sahip bulunur.
(2) Aday kenar (a,b): komşu (P.adj varsa tünel kenarı da olabilir), sol'de bağlı değil, ikisi de merkez ya da köprü değil, sahipleri aynı. Döngü = a→LCA→b ağaç yolu + yeni kenar, uzunluk L = dep[a]+dep[b]−2·dep[lca]+1. Koşul 8 ≤ L ≤ 20; hattın ilk 3 bölümünde L ≤ 12.
(3) sol[a] |= b, sol[b] |= o.
(4) Karıştırma ve öteki kurallar olduğu gibi yeni sol üzerinden yapılır.
(5) İşaret: döngü karolarından bare olanlardan x.ring tane seçilir (n<48 ise 1, sonra 2). ringMark[i] = true, döngü P.ringCyc'e yazılır.
KANIT: Karıştırma yine yalnız geri alınabilir işlemlerden oluşur; cur→sol erişilebilir. Eklenen kenar iki uçta da kol eklediği için sol'de açık uç yoktur; bağlılık değişmez; a ve b aynı sahipte olduğundan karışma olmaz. İşaret sol'ün döngüsündedir, dolayısıyla lit(sol).solved.
DOĞRULAMA: tasarımcı 360 bulmacada 0 hata bildirdi. Ben 6×8 ve 7×9'da ortalama 16,4 aday kenar ve 11,0 karoluk ortalama halka ölçtüm; aday hiç tükenmiyor.

## Kazanma koşulu

lit()'e yalnız P.ringMark varken eklenir: yanan alt çizgede 2-çekirdek hesaplanır. Her karonun derecesi (karşılıklı bağlı kol sayısı) bulunur, derecesi ≤1 olanlar kuyrukla soyulur, kalanlar core[i] olur. ringBad = core'da olmayan işaretli karo sayısı; solved &&= !ringBad. Maliyet O(n). Kazanma anında çizge tek döngülü olduğundan core tam olarak halkadır. Dönüşe core eklenir (çizim ve ses için).

## Dokunma

Değişmez. pointerdown sonunda: işaretli karo core'a ilk kez girince 'halka kapandı' tonu (note(k+4)), hafif titreşim ve bir kez 'Halka kapandı' toast'ı. Halka işaret dışında kapanırsa (core boş değil ama işaret core'da değil) bir kez '◯ karo halkanın üstünde olmalı' toast'ı ve işaret press.set ile nabız atar.

## Çizim

(1) İşaret tek yolda: arc(x, y, .36s). Core'da değilken kesik (setLineDash([s·.07, s·.06])) ve pal.mut; core'daysa düz ve OC[own].
(2) Halka kapanınca core karolarının yalnız core komşularına giden kollarına ikinci bir ince geçiş yapılır: lineWidth .05s, strokeStyle pal.bg. Bu 'çift ray' görünümü verir (tek yol).
Toplam ~4 çağrı. vis(i) karanlıkta gizler. İşaret yalnız bare karoya konduğu için köşe rozetleriyle çakışmaz.

## Zorluk çözücüsü ve robot

Robot solve() değişmez: cur→sol yapar, sol da işaretleri sağlar.
difficulty(): yerel eleme ve DFS aynen çalışır (döngüsüzlüğü zaten kullanmıyordu); kısıtı yapraktaki lit uygular. Tasarımcı ölçümü: 7×9'da puan 13,8 → 13,5; halkalı tabanların %6–10'u çok çözümlü ve işaret çoğunu tekleştiriyor.
İsteğe bağlı RULE_W.ring = 1: P.diff'e eklenirse pick() algılanan zorluğu dengelemek için biraz daha hafif bir taban seçer. Önce ölçülmeli.
hakem testleri:
- 600 üretimde lit(sol) çözülü olmalı ve core tam bir döngü olmalı.
- İşaret halka dışına taşınınca sol reddedilmeli.
- {ring:1, sw:3, table:1} karışımında sayım kanıtı denenmeli (solve kazanmalı).

## İpucu, baştan, kayıt

İpucu: mekanizma değişmez; sol işaretli halkayı içerdiği için ipucu asla yanlış halkaya itmez. ringBad varsa P.ringCyc'teki yanlış karolar öne alınır.
↺ baştan: halka ve işaret statiktir.
Kayıt: yeni alan yok, ortak sig yeterli.

## Öteki kurallarla karışım

Sabit: halkada olabilir, yardım eder. Eşli, ters, sayaçlı: karıştırma yeni sol'e göre yapıldığından aynen geçerli; sayaç kanıtı per(sol)'e bağlıdır.
Makas ve tabla: kol sayısı korunur, sayım kanıtı geçerli; işaret bu karolara konmaz.
Karanlık: merkezi yalnızlaştırma yalnız merkez komşularını döndürür, halka karanlıkta keşfedilir.
İki merkez: halka tek hattın içindedir (a ve b aynı sahipte).
Tünel ağzı: halka kenarı tünelden geçebilir; lit ve 2-çekirdek adj'den okur.
Tabela ve köprü ile ÇAKIŞIR: CLASH = {ring: ['sign', 'bridge']}. Köprüde 2-çekirdek bölünmüş düğümle yapılırsa köprü yasağı kaldırılabilir.
Karma hatlarda öteki 8 kuralla karışır.

## Kural kartı demosu

.rdemo10 (satır içi SVG, 96×96): 2×2 karo zemini, köşeleri yuvarlatılmış kare halka yolu (rect rx). Mevcut .ln/draw kalıbıyla stroke-dashoffset kullanılarak 1,1 sn'de çizilir. Sağ üst karoda kesik bir çember vardır; çizim tamamlanınca iki katman arasında opaklık geçişiyle düzleşir. 3 sn döngü. Altında 1 cümle: 'Halkayı ◯ karodan geçirerek kapat.'

## Zorluğa etkisi

Gerçek bir hedef değişikliği: 'döngü kapatma' alışkanlığı bir kez bırakılır ve kapatma yeri işaretten çıkarılır. 4'lü kavşak sayısı biraz artar. Ölçülen puan yaklaşık −0,3, algılanan zorluk ise artar. İsteğe bağlı kural ağırlığıyla dengelenir.

## Riskler

(1) Oyuncu halkayı başka yerde kapatırsa 'neden bitmedi' diye düşünebilir; kesik/düz çember, toast ve nabız bunu açıklar.
(2) Kart iki kavramı birden anlatıyor; testere dişi küçük ızgara ve ilk 3 bölümde L ≤ 12 bunu hafifletir.
(3) Bir yerde 'her zaman ağaç' varsayımı varsa kırılır: win() dalgası ve durak patlaması d'ye dayanır, döngüde de çalışır. hakem gen.solvable varsayılan üretimi denetlediği için etkilenmez.
(4) CLASH uygulanmazsa tabela ya da köprüyle aynı bölümde yanlış sonuç çıkar; rulesFor testi eklenmeli.

## Doğrulayıcının kararı

Çözülebilir: evet · Uygulanabilir: evet · Tutulsun: evet

**Karşı örnek / risk:** ÇÖZÜLEMEZLİK İÇİN KARŞI ÖRNEK BULUNAMADI. Kanıt doğru: rot, makas (iki durumu da 2 kollu), tabla (karo taşır) ve tünel kol toplamını (Σpopc) değiştirmez. Halkalı sol'de bu toplam 2n'dir; açık uç yoksa kenar sayısı n olur. Tek merkezde bağlı n düğüm ve n kenar, iki merkezde karışmamış 2 bileşen ve n−1 kenar demektir. Her iki durumda döngü sayısı (m−n+c) tam 1'dir, kazanma anında 2-çekirdek tam o döngüdür. Köprüde bölünmüş düğüm tree() ile uyuşmaz; tabela da ağaç aşamasında halkadan önce çalışıp eski ağaca göre ok koyar. Bu yüzden CLASH ['sign','bridge'] haklı. rulesFor ile 673–20000 arasındaki 2079 halkalı bölümde 0 çakışma çıktı.

DENEY: game.js'in gerçek generate/lit/difficulty/tree/rulesFor/puzzleFor kodunu Node'a çıkarıp öneriyi eklenti olarak yazdım. Dosyalar: /tmp/claude-0/-home-user-mobil-oyun/bb21aa69-f6d1-52e7-9b31-ec2477378b24/scratchpad/ring/load.cjs, ring.js, t1–t10.cjs.
- Kapsam: 7 boy (3×3–7×9) × 9 karışım (yalın, sabit, eşli, ters, sayaçlı, iki merkez, karanlık, iki merkez+karanlık, hepsi) × 150 tohum × 2 işaret aşaması = 18 900 bulmaca.
- Sonuç: lit(sol) hatası 0, hazır çözülü 0, "core ≠ döngü" 0. İşaret döngü dışına taşınınca sol 1050/1050 reddedildi.
- puzzleFor 673–1300: 166 halkalı bölüm, hepsinde halka var, hepsi çözülür. Ortalama 16 ms/bölüm.
- Merdiven: M16 ortalaması 15,58, M17 ortalaması 15,64. difficulty 7×9'da 13,85 → 13,40, 6×8'de 11,61 → 11,53. Tasarımcının "16,4 aday / 11 karoluk halka" ölçümü doğrulandı: 6×8'de 13,1, 7×9'da 19,6 aday; halka 10,8 / 11,3 karo.

BOZULMA VE YANLIŞ İDDİALAR (çözülebilirliği bozmuyor, düzeltilmeli):
(1) Yanlış uyarı. Öneri "core boş değil ama işaret core'da değil" olunca toast gösteriyor. Merkezden dışa doğru KUSURSUZ çözen oyuncu bile 200 bölümün 39'unda bu uyarıyı görür, çünkü karıştırılmış karolar yanan bölgede rastgele döngü kurar.
(2) Erken "Halka kapandı". Doğru çözen oyuncuda bu bildirim 42/200 bölümde asıl halka bitmeden çalar; 16/200 bölümde de kapanıp açılıp yeniden kapanır. Rastgele dokunuşla 80 000 durumda, işaretin 2-çekirdekte olup hiçbir döngüde olmadığı 10 sahte olumlu durum çıktı. Kutlayan toast ve titreşim yanıltıcı.
(3) "İşaret çok çözümlülüğü tekleştirir" iddiası YANLIŞ. Bütün açık-uçsuz dizilimleri saydım:
  - 6×8'de çok çözümlü pay işaretsiz 6/60, işaretle 5/60.
  - 7×9'da 4/50; 1 ya da 2 işaret bunu hiç değiştirmiyor.
  İşaret pratikte kısıt değil, bilgi ve görsel bir noktadır. Kuralın asıl etkisi çözüm topolojisinin değişmesi: tek döngü, 1–2 durak eksik.
(4) Miktar hatası. Gerçek boyutlar yalnız 6×8 (n=48) ve 7×9 (n=63) olduğu için "n<48 ise 1" hiç tutmaz; giriş bölümü dahil hep 2 işaret gelir, kart ise tek işaretten söz ediyor. Ayrıca amount() bölüm sırasını almadığı için "ilk 3 bölümde L≤12" yazıldığı gibi uygulanamaz.
(5) İşaret aşaması. İşaret "sayaçtan sonra çıplak karo" olarak seçilirse karma bölümlerde 32 bulmacada döngüde hiç çıplak karo kalmadı. İşaret ağaç aşamasında ayrılınca 0 oldu.
(6) Aday tükenmesi. 6×8 ve 7×9'da 400'er tohumda hiç tükenmedi. İki merkezde ise 3×3'te 68/400 tohumda aynı sahipte ağaç dışı kenar HİÇ yok. Küçük boyda halka kurulamaz; yedek davranış ve pick süzgeci gerekir.
(7) Sözleşme uyumsuzluğu. docs/kurallar/README.md out.ring = { mark, cyc } istiyor, öneri P.ringMark/P.ringCyc kullanıyor. CSS sınıfı rd-ring olmalı, öneride .rdemo10 var. İpucu önceliği için çekirdekte kanca yok.
(8) Çizim. Chromium'da 48 px karoyla çizdim (ring-render.png). Kesik ve düz çember iki temada da renk körü için ayrışıyor. Ancak draw() lineCap='round' iken kesik boşluk ~0,7 px'e düşüyor; 'butt' uç gerekir. Düz çember hat renginde olunca raylarla birleşip ağır bir "⊕" görüntüsü veriyor.
(9) Azaltılmış hareket. Global kural animasyonu .01 sn ve tek turda bitiriyor. Demo temel stilde KAPALI halka göstermezse bu oyuncular boş kart görür.

### Zorunlu düzeltmeler

- Toast uyarısı yalnız 'yakın kazanç' anında çıkmalı: check() içinde L.ringNear = (bad > 0 && L.solved). Bu andaki L.solved, ring denetimi bozuk saymadan önceki temel sonuçtur: açık uç yok, hepsi yanıyor, karışma yok. after() yalnız L.ringNear iken bir kez (G.ringWarn) toast + press nabzı verir. 'core boş değil ama işaret yok' koşulu kaldırılmalı (doğru çözende 39/200 yanlış uyarı).
- 'Halka kapandı' kutlaması kaldırılmalı. İşaret döngüye girince yalnız olgusal bir geri bildirim kalır: çember düzleşir, kısa yumuşak ton, toast ve titreşim yok. Gerekirse oyuncunun hayatında bir kez açıklayıcı toast (save.ringTold). Kutlama win() ile gelir. Neden: doğru çözende 42/200 erken kapanma, 16/200 yanıp sönme.
- Döngü göstergesi doğru olmalı. L.ringOn = işaretler core'da VE core basit (her core düğümünün core derecesi 2). Çift ray yalnız ringOn iken ve yalnız core kollarına çizilir. Böylece iki döngü arasındaki yol 'halka' gibi çizilmez.
- Veri sözleşmeye uymalı: C.out.ring = { mark: bool[n], cyc: number[] }, x.ring = işaret sayısı. check P.ring.mark okur. Çizim ve geri bildirim için yalnız G'ye bayrak yazılır, G.ring nesnesine yazılmaz (cached() bu nesneyi paylaşıyor).
- amount = (n, intro) => (intro || n < 63) ? 1 : 2. Kısa halka sınırı tree(C) içinde hi = C.n < 63 ? 12 : 20 olarak yazılır: testere dişi yalnız M17'nin ilk 3 bölümünü 6×8 yapar, karma hatlar hep 7×9'dur.
- İşaret ağaç aşamasında, halka kenarıyla birlikte ayrılmalı. Seçim e.cyc içinden yapılır: merkez değil, per(sol) > 1 (dört yollu kavşak değil), tünel ağzı (C.mouth) değil. Ayrılan karoya C.keep ve C.busy yazılır. mark(C) aşamasında busy geri alınır; böylece karanlık yalnızlaştırma ve 'çözülmüş gelmesin' bu karoyu döndürebilir. 'Çıplak karo' arayan sürüm karma bölümlerde 32 kez boş kaldı.
- Aday kenar koşulları: b > a (tünelde de tekil), iki kol da sol'de boş, iki uç da merkez değil, iki uç da C.keep değil (köprü ya da tünel ağzı), T.ow eşit ve sıfırdan büyük. 8 ≤ L ≤ hi içinde aday yoksa bütün adaylara düşülür. Hiç aday yoksa out.ring yazılmaz. pick() de bu adayı atlar: MODS.some(m => x[m.key] && !P[m.key]) ise, son aday değilse atla. Bu, iki merkezli küçük ızgaradaki (3×3'te 68/400) durumu kapatır.
- Kesik çember cx.lineCap = 'butt' ile çizilmeli, sonra 'round' geri yüklenmeli. Düz çember hat renginden ayrışmalı: hat renginde ama ince (lineWidth .04s), yarıçap .38s; ya da pal.fg. Kesik ve düz biçim farkı korunur.
- Kart metninde ◯ (U+25EF) Android yazı tipinde boş kutu çıkabilir. Kartta satır içi SVG ikonu kullanılmalı, toast metninde 'kesik çemberli karo' denmeli.
- Demo CSS'i sözleşmeye uymalı: sınıf adı .rd-ring, kendi keyframe adları (rd-ring-draw, rd-ring-a, rd-ring-b). Temel (animasyonsuz) stil KAPALI hâli gösterir: stroke-dashoffset:0, kesik çember opacity:0, düz çember opacity:1. Böylece azaltılmış hareket kuralı demoyu boş bırakmaz.
- Çekirdekte en küçük değişiklik: pointerdown içinde lit'ten önce const prevL = G.L yazılır ve m.after(G, i, now, prevL) çağrılır. Bu, kapanma geçişini başlangıçta zaten kapalı durumdan ayırmak için gerekir. Raporda belirtilmeli.
- Belgeler düzeltilmeli. docs/kurallar/halka.md'de 'işaret çoğunu tekleştirir' yerine ölçüm yazılmalı (6×8: 6/60 → 5/60, 7×9: 4/50 → 4/50). Kuralın asıl etkisi topoloji değişimidir (tek döngü, 1–2 durak eksik); işaret bilgi verir ve geri bildirim noktasıdır. BOLUM_TASARIMI §5 tablosuna M17 satırı eklenmeli.

### Doğrulayıcının uygulama planı

YER: Sözleşme gereği kodun hepsi www/rules/halka.js (anahtar 'ring', line 16), tools/hakem/halka.cjs ve docs/kurallar/halka.md dosyalarına girer. game.js'te yalnız 2 küçük değişiklik var (aşağıda Ç1, Ç2).

=== www/rules/halka.js ===
(window.RAY_RULES ||= []).push(api => {
  const { DIRS, rot, nb, ob, tree, toast, tone, note, haptic, press, kick } = api;
  const per = m => rot(m) === m ? 1 : rot(rot(m)) === m ? 2 : 4;

  // 2-çekirdek: yanan alt çizge, yalnız karşılıklı kollar
  // Dönüş: core (Uint8Array), arm (core komşusuna giden kollar), simple (her core düğümünün derecesi 2)
  function core2(P, L) {
    n = P.cur.length; deg = Uint8Array(n); core = Uint8Array(n); arm = Uint8Array(n); q = [];
    for i with L.d[i] >= 0:
      core[i] = 1
      for k in 0..3:
        if (cur[i] & DIRS[k][0]) && (j = nb(P,i,k)) >= 0 && L.d[j] >= 0 && (cur[j] & ob(P,i,k)): deg[i]++
    kuyruk: deg ≤ 1 olanlar soyulur; soyulan düğümün core komşularının deg'i 1 azalır
    for i with core[i]:
      arm[i] = core komşusuna giden kol bitleri
      simple &&= popc(arm[i]) === 2
    return { core, arm, simple }
  }

  return {
    key: 'ring', line: 16, clash: ['sign', 'bridge'],
    amount: (n, intro) => (intro || n < 63) ? 1 : 2,

    tree(C) {   // tOrder yok → line 16; tünel (tOrder 0) önce çalışır, C.adj hazırdır
      const { sol, n, R } = C, T = tree(C, sol), hi = n < 63 ? 12 : 20, all = [], ok = [];
      for a in 0..n-1, for k in 0..3:
        b = C.nb(a,k); if (b <= a) continue
        o = C.ob(a,k); bit = DIRS[k][0]
        if ((sol[a] & bit) || (sol[b] & o)) continue
        if (C.isHub(a) || C.isHub(b) || C.keep[a] || C.keep[b]) continue
        if (!T.ow[a] || T.ow[a] !== T.ow[b]) continue
        // LCA: derin olan yukarı çıkar
        pu = [a], pv = [b]; u = a; v = b
        while (u !== v): dep[u] >= dep[v] ? pu.push(u = pa[u]) : pv.push(v = pa[v])
        pv.pop(); cyc = pu.concat(pv.reverse())
        e = { a, b, bit, o, cyc }; all.push(e); if (8 <= cyc.length <= hi) ok.push(e)
      pool = ok.length ? ok : all
      if (!pool.length) return          // out.ring yazılmaz → pick() bu adayı atlar
      e = pool[R() * pool.length | 0]; sol[e.a] |= e.bit; sol[e.b] |= e.o
      // işaret burada ayrılır: sabit, eşli, ters, sayaçlı ve birimler (makas/tabla) busy/keep'e saygı gösterir
      c1 = e.cyc.filter(i => !C.isHub(i) && per(sol[i]) > 1 && !C.mouth?.has(i))
      cand = c1.length ? c1 : e.cyc.filter(i => !C.isHub(i))
      mark = Array(n).fill(false)
      for (k = 0; k < C.x.ring && cand.length; k++):
        i = cand.splice(R() * cand.length | 0, 1)[0]; mark[i] = true; C.keep[i] = C.busy[i] = true
      C.out.ring = { mark, cyc: e.cyc }
    },
    mark(C) {   // sayaçtan sonra: busy geri alınır (karanlık yalnızlaştırma ve "çözülmüş gelmesin" çevirebilsin)
      C.out.ring?.mark.forEach((v, i) => v && (C.busy[i] = false))
    },

    check(P, L) {   // lit() ve difficulty yaprağı; O(n)
      const r = core2(P, L); L.core = r.core; L.cArm = r.arm
      let bad = 0; P.ring.mark.forEach((v, i) => { if (v && !r.core[i]) bad++ })
      L.ringOn = !bad && r.simple
      L.ringNear = bad > 0 && L.solved   // L.solved burada henüz temel sonuçtur
      return bad
    },

    after(G, i, now, prevL) {   // Ç1 gerektirir
      if (G.L.ringOn && !prevL?.ringOn) {
        tone(note(10), .18, .03)   // olgusal, kutlamasız
        if (!api.save.ringTold) { api.save.ringTold = 1; api.persist(); toast('Halka kesik çemberli karodan geçti') }
      }
      if (G.L.ringNear && !G.ringWarn) {
        G.ringWarn = 1; haptic('light'); toast('Halka kesik çemberli karodan geçmeli')
        G.ring.mark.forEach((v, j) => v && press.set(j, now)); kick()
      }
    },

    rails(D) {   // çift ray: 1 çağrı
      const { G, cx, s, X, vis, pal, railPath } = D; if (!G.L.ringOn) return
      cx.beginPath()
      for i: if (G.L.core[i] && vis(i) && !G.split?.[i]) railPath(X[i], G.cur[i] & G.L.cArm[i])
      cx.lineWidth = s * .05; cx.strokeStyle = pal.bg; cx.stroke()
    },

    over(D) {   // işaret: kesik 1 + düz ≤3 çağrı; karanlık örtüden önce
      const { G, cx, s, X, vis, own, OC, pal } = D, mk = G.ring.mark, on = i => G.L.core?.[i] && G.L.ringOn
      // kesik
      cx.beginPath()
      for i: if (mk[i] && vis(i) && !on(i)): [x, y, , sc] = X[i]; cx.moveTo(x + s*.38*sc, y); cx.arc(x, y, s*.38*sc, 0, 7)
      cx.lineCap = 'butt'; cx.setLineDash([s*.07, s*.06]); cx.lineWidth = s*.045; cx.strokeStyle = pal.mut; cx.stroke()
      cx.setLineDash([]); cx.lineCap = 'round'
      // düz
      for t of [1, 2, 3]: aynı yol yalnız on(i) && own(i) === t için; lineWidth s*.04; strokeStyle OC[t]
    },

    card: {
      name: 'Halka hat', tag: 'Yeni: halka hat',
      demo: '<div class="rd-ring" aria-hidden="true"><svg viewBox="0 0 96 96"><rect class="t" .../>×4<rect class="p" x="24" y="24" width="48" height="48" rx="12"/><circle class="m0" cx="72" cy="24" r="13"/><circle class="m1" cx="72" cy="24" r="13"/></svg></div>',
      text: 'Bu hatta raylar <b>bir kez</b> kendi üstüne kapanır ve <b>halka</b> olur. Halka <b>kesik çemberli</b> karodan geçmeli; geçince çember dolar.'
    },
    css: `
      .rd-ring{align-self:center;margin:6px 0 2px}
      .rd-ring svg{width:96px;height:96px}
      .rd-ring .t{fill:var(--tile);stroke:var(--stroke)}
      .rd-ring .p{fill:none;stroke:var(--acc);stroke-width:9;stroke-linecap:round;stroke-dasharray:180;stroke-dashoffset:0;animation:rd-ring-draw 3s ease-in-out infinite}
      .rd-ring .m0{fill:none;stroke:var(--mut);stroke-width:3;stroke-dasharray:5 4;opacity:0;animation:rd-ring-a 3s infinite}
      .rd-ring .m1{fill:none;stroke:var(--acc);stroke-width:3;opacity:1;animation:rd-ring-b 3s infinite}
      @keyframes rd-ring-draw{0%{stroke-dashoffset:180}45%,100%{stroke-dashoffset:0}}
      @keyframes rd-ring-a{0%,45%{opacity:1}55%,100%{opacity:0}}
      @keyframes rd-ring-b{0%,45%{opacity:0}55%,100%{opacity:1}}`
      // temel stil = KAPALI hâl → azaltılmış harekette de doğru kare
  };
});

=== game.js (en küçük çekirdek değişikliği) ===
Ç1 pointerdown:
  const prev = G.L.d, prevL = G.L, wasMerged = G.L.merged
  ...
  for (const m of MODS) if (m.after && G[m.key]) m.after(G, i, now, prevL)
Ç2 pick(): her adayda
  if (MODS.some(m => x[m.key] && !P[m.key]) && k < K - 1) continue
  Halka kurulamayan aday seçilmez. Eklentisiz bölümlerde MODS boş olduğundan sonuç bit bit aynı kalır.
İsteğe bağlı Ç3: hint() içinde "wrong" sıralamasından önce G.L.ringNear ise P.ring.cyc içindeki yanlış karolar öne alınır, ya da genel bir m.hintOrder kancası eklenir. Yakın kazanç durumu 6×8'de ~1/60 tahtada olası; zorunlu değil.

=== Değişmeyenler ===
- generate'in kendisi (kanca aşamaları yeterli), lit (check kancası), difficulty (eleme döngüye bakmıyor; yaprakta lit+check), solve() (cur→sol).
- İpucu (sol işaretli halkayı içerir), reset (start yeni G kurar, G.ringWarn sıfırlanır), saveRun (sig = hash(sol) halka kenarını içerir; işaret tohumdan yeniden üretilir).
- index.html'de rules/halka.js script etiketi iskelette var. sw.js önbellek listesine halka.js eklenmeli.

=== tools/hakem/halka.cjs ===
(1) Üretim:
  - Boylar: 6×8 ve 7×9. Karışımlar: {ring:1}, {ring:2}, +pins, +pairs, +rev, +cnt, +two, +fog, +two+fog, {ring:2, sw:3, table:1}, {ring:2, portal:..}. Her biri 300 tohum.
  - Beklenen: P.ring var; lit(sol).solved; L.core'daki kümenin P.ring.cyc'e eşit olması ve her düğümün core derecesinin 2 olması; işaretler ⊂ cyc; işaretlerde hub yok, per > 1; !lit(cur).solved.
(2) İşaret döngü dışına taşınınca lit(sol) çözülmüş sayılmamalı.
(3) Hiçbir l < 673 için rulesFor(l) 'ring' içermemeli ve puzzleFor(l).ring tanımsız olmalı. 673–5000'de ring ile sign ya da bridge birlikte gelmemeli.
(4) 673–760 arasında rulesFor 'ring' içeren her bölümde puzzleFor(l).ring var. 673–675'te halka uzunluğu ≤ 12 ve 1 işaret. Ortalama üretim < 60 ms.
(5) Oyun:
  - open({ save: { played: 6, level: 673, stars: starsUpTo(673) } }).
  - Kural kartında /Halka/ çıkar; 'Anladım'a basılır.
  - solve(page) → waitModal; G.L.ringOn true; G.ring.mark'taki her karo G.L.core'da.
(6) Uyarı yolu:
  - page.evaluate: G.cur = G.sol.slice(); G.ring = { ...G.ring, mark: döngü dışı bir karoya taşınmış }. Bu yalnız test kopyasıdır.
  - Bir karoya iki kez değil dört kez dokunulur (aynı duruma döner) → toast /kesik çemberli/ bir kez görünür, kazanma olmaz.
(7) Karanlık ile halka (fog+ring bölümü, ör. rulesFor'dan bulunur): ışığı izleyen solve() kazanır.
(8) Görsel: 7×9 halkalı bölümde shot 'ring-dark' ve 'ring-light' alınır. Hata konsolu boş olmalı.
(9) Performans: halkalı 7×9'da 30 dokunuşta p95 kare süresi mevcut sınırın (34 ms, 4× CPU) altında kalmalı.

=== docs/kurallar/halka.md ===
Kanıt, ölçümler, CLASH gerekçesi (tabela ağaç aşamasında halkadan önce; köprü bölünmüş düğüm) ve bilinen sınırlar yazılır: iki merkezde küçük ızgarada halka kurulamayabilir, işaret pratikte bilgi verir.
