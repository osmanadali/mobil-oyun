# M15 · Döner tabla (anahtar: `table`)

> Bu belge tasarım iş akışının çıktısıdır: üç bağımsız tasarımcı, bir seçici ve şüpheci bir doğrulayıcı. Uygulama notlarındaki satır numaraları ve "şu fonksiyonu değiştir" önerileri eklenti iskeletinden ÖNCE yazıldı. Ortak altyapı (birim/val, komşuluk adj, bölünmüş düğüm, tree(), kayıt imzası, kural kartı göçü, çakışma) artık çekirdekte hazır; kural yalnız kendi dosyasında, kancalarla yazılır: docs/kurallar/README.md.

**Neden seçildi:** Metro temasında gerçek bir aygıt ve en tatmin edici dokunuş kurallarından biri. Yeni bir düşünme biçimi getiriyor: büyük parça mantığı, karonun yeri de değişiyor. R⁴ = kimlik kanıtı çok temiz; prototipi yeniden koşturdum. Kızaktan farklı olarak 'her hücre dolu' varsayımını bozmuyor, bu yüzden daha az riskli. Kolaylaştırma etkisine rağmen pick()'in hedefe ulaştığını ölçtüm. Türü: etkileşim (makastan farklı: şekil değil, konum değişiyor). Seçimde değişiklik yaptım: merkeze bitişiklik, köprü ve tünel ağzı dışlandı, animasyonda zemin atlanıyor, ipucunda tabla sona alınıyor.

## Kural kartı metni

Yuvarlak <b>döner tabla</b> dört karoyu taşır: birine dokun, tabla bütünüyle <b>90° döner</b>. Karolar yer değiştirir, aralarındaki raylar <b>kopmaz</b>.

## Görünüş

2×2 karo dörtlüsünün altında, dört karonun ortak köşesinde ortalanmış yuvarlak plaka ve ortada pim halkası (◉). Karo köşeleri dairenin dışına taşar. Biçim renk olmadan okunur.

## Mekanik

Gerçek bir demiryolu döner tablası. plates[k] = [sol-üst, sağ-üst, sağ-alt, sol-alt] (saat yönünde), plate[i] = k. Dörtlüdeki herhangi bir karoya dokunmak tablayı tek parça hâlinde saat yönüne 90° çevirir. Her karo bir sonraki köşeye TAŞINIR ve kendisi de 90° döner: cur[Q[p]] = rot(eski[Q[(p+3)%4]]).
İç bağlantılar korunur; değişen yalnız tablanın 8 dış ucunun yönüdür. Dörtlü, 4 durumlu tek bir '2×2 süper karo' olur. Karar tek karoya bakarak değil, 8 dış ucun bütününe bakarak verilir.
Eşliden farkı: karolar yerinde dönmez, konum değiştirerek döner; dörtlünün iç düzeni sabittir.

## Üretim ve çözülebilirlik kanıtı

Eşli karolar ve makastan sonra, rev/cnt'den önce; R() yalnız x.table varken tüketilir.
Aday: bütün 2×2 bloklar. Dört hücrenin her biri şu koşulları sağlamalı: free(i) (merkez, sabit, eşli ve makas dışlanır), merkez(ler)e bitişik değil (İYİLEŞTİRME: fog'un merkezi yalnızlaştırma adımı tablayı çeviremez), köprü değil (!br[i]), tünel ağzı hücresi değil. Dönünce kendisiyle aynı görünen blok da elenir: t=1..3 için çözüm görünümü değişmeli.
Seçimden sonra t = 1 + R()·3|0. Dört hücreye ÖNCE cur = sol konur (bağımsız karıştırma silinir), sonra t kez tabla dönüşü uygulanır. Döngü değişkeni x0 adını alır, generate'in x parametresiyle çakışmaz.
free() artık plate[i]<0 şartını da içerir; rev, cnt ve fog'un komşu döndürmesi tablayı bozmaz. Satır 293'teki findIndex'e plate[j]<0 eklenir. par: tabla tek birimdir, r = (4−t)%4.
KANIT: Tabla dönüşü R, 4 hücreyi yine kendi hücrelerine taşır ve R⁴ = kimliktir (her karo 4 köşeyi dolaşıp toplam 4×90° döner). Üretici sol'den başlar ve yalnız R^t uygular; oyuncu 4−t dokunuşla sol'e döner. Ulaşılabilen her durum R'nin yörüngesindedir, kilitlenme olmaz.
DOĞRULAMA: prototipte 600 bulmaca 0 hata, 0 hazır çözülü çıktı. walk.js'te 2 tablalı karma tahtada 600/600 çözüldüğünü kendim yeniden koşturarak gördüm.

## Kazanma koşulu

lit() değişmez. Karolar yer değiştirse de kazanma koşulu cur üzerinden aynıdır: açık uç yok, hepsi bağlı, hatlar karışmamış. Tabla iki merkezin hatlarını birbirine değdirirse mevcut merged uyarısı çalışır.

## Dokunma

Tek dokunuş: if (G.plate[i] >= 0) { const k = G.plate[i], Q = G.plates[k], v = Q.map(q => G.cur[q]); Q.forEach((q, p) => { G.cur[q] = rot(v[(p+3)%4]); }); plAnim.set(k, now); key = 'p' + k; }.
Tablanın hangi karosuna dokunulursa dokunulsun işlem aynıdır; art arda tabla dokunuşu 1 hamle sayılır. İpucuyla sabitlenen tabla (4 karo birlikte fixed) mevcut fixed kontrolüyle reddedilir. Karanlıkta tablanın bir hücresi aydınlanınca reveal() dördünü birden açar; yarı karanlık tabla olmaz.

## Çizim

(1) Karo zemininden önce tek yolda her tabla için blok merkezinde r = s·.98 daire çizilir: rgba(pal.fg,.06) dolgu + pal.mut 2 px kenar (2 çağrı).
(2) Ortak köşeye pim: halka + nokta (1 çağrı).
(3) Dönüş animasyonu 190 ms sürer ve mevcut back yumuşatmasını kullanır. plAnim varsa a = −(1−back(t))·π/2. Karo merkezi blok merkezi çevresinde a kadar döndürülür (x' = bx + dx·cos a − dy·sin a, y' = …) ve raylar a açısıyla çizilir (railPath açı alıyor).
İYİLEŞTİRME: animasyon süresince bu 4 karonun eksen hizalı zemini çizilmez. Yuvarlak plaka dönüşten etkilenmediği için dönen raylar plakanın üstünde doğal görünür; 'zemin dönmüyor' kusuru ücretsiz ortadan kalkar.
Toplam +3 çağrı.

## Zorluk çözücüsü ve robot

difficulty(): ortak birim refaktörü. Tabla birimi 4 hücredir ve val(i,r) = rn(cur[Q[(pos(i)−r+4)%4]], r). C0 r=0..3'ü dener, aynı görünen durumlar elenir. Normal karoda eski puan birebir korunur.
Robot solve(): if (G.plate?.[i] >= 0) { const Q = G.plates[G.plate[i]]; if (i !== Q[0]) return; const c = Q.map(j => G.cur[j]); let k = 0; while (Q.some((j, p) => c[p] !== G.sol[j]) && k < 4) { const v = c.slice(); Q.forEach((_, p) => { c[p] = rot(v[(p+3)%4]); }); k++; } for (let q = 0; q < k; q++) out.push(Q[0]); return; }. Karanlıkta Q[0] görünür değilse tablanın görünen ilk hücresine dokunulur.
Testler:
- 300 tohumla {table:2} üretilir; lit(sol) çözülü olmalı.
- Her tablanın dört hücresi aynı yörüngede olmalı.
- Tabla merkeze bitişik ya da köprü üzerinde olmamalı.
- Kart, dokunuş (4 karo yer değiştirir) ve solve() kazanma senaryosu çalışmalı.

## İpucu, baştan, kayıt

İpucu: wrong[] içinde bir tabla karosu varsa dördü birden sol'e konur ve fixed olur (eşlideki 'ikisi birden' gibi). Tek ipucu 4 karo açtığı için wrong.sort'ta tabla sona alınır.
↺ baştan: önbellek + keep[] dört karoyu birlikte sol'e koyar, tutarlıdır.
Kayıt: durumun tamamı (konum + yön) cur'dadır, yeni alan yok; ortak sig yeterli. cached() yalnız cur, fixed ve cnt'yi kopyalar; plates hiç değişmediği için paylaşılması güvenlidir.

## Öteki kurallarla karışım

Tabla hücresi sabit, eşli, ters, sayaçlı, makas, köprü ya da tünel ağzı olamaz; aday filtresi bunları dışlar. Tabela ve halka işaretleri bare karoya konduğundan tablaya düşmez.
Karanlık: dördü birlikte aydınlanır.
İki merkez: serbest ve ilginç; tabla dönerek iki hattı değdirebilir.
Halka: tabla kolları yalnız yer değiştirir, toplam kol sayısı korunur; sayım kanıtı geçerlidir.
Tünel ağzı: geçit hücresi tablaya girmez.
Izgara en az 4×4 olmalı. M15 girişi 6×8, karma hatlar 7×9 olduğundan sorun yok.

## Kural kartı demosu

.rdemo9 (96×96): dairesel .tb zemini (var(--pin)) içinde 2×2 küçük karo; raylar dörtlü boyunca bir U çizer. .tb{animation:spin4 4s cubic-bezier(.3,1.4,.5,1) infinite}: spin4 kareleri 4×90° adım attığı için döngü kesintisizdir. .rtap halkası bir karoya dokunur. Altında 1 cümle: 'Dokun: dört karo birlikte döner ve yer değiştirir.' Yaklaşık 7 satır.

## Zorluğa etkisi

Tabla 4 karonun 256 olası bileşimini 4 duruma indirir, bu yüzden bulmacayı kolaylaştırır. Prototip: 7×9'da 13,63 → 13,00 (1 tabla), 11,80 (3 tabla).
Kendi pick ölçümüm (7×9, 40 bölüm): hedef 15,5 ve K=31 iken yalın tahtada seçilen ortalama 15,52, 2 tablalıda 15,52. Hedefe hâlâ ulaşılıyor.
Öneri: x.table = intro ? 1 : 2, en çok 2. Sabit karo kuralıyla aynı bölümdeyse sabit karo oranı düşürülür.

## Riskler

(1) Bulmacayı en çok kolaylaştıran kural; en çok 2 tabla.
(2) Oyuncu tek karonun döneceğini sanabilir; daire, pim ve demo şart.
(3) Bir ipucu 4 karo açar, cömert sayılır; sıralama cezası bunu yumuşatır.
(4) Dönüş animasyonunda X[] koordinat dönüşümü hatalı yazılırsa dokunma ızgarası şaşar; animasyon yalnız çizimi etkilemeli, G.cur anında güncellenmeli.
(5) Makas ya da tabela yakındaysa görünüm sıkışabilir; aday aralığı ölçülmeli.

## Doğrulayıcının kararı

Çözülebilir: evet · Uygulanabilir: evet · Tutulsun: evet

**Karşı örnek / risk:** Üretimde çözülemezlik bulamadım. Yörünge kanıtı doğru: R dört hücreyi yine kendi hücrelerine taşıyor ve R⁴ = kimlik. Tabla hücresine R dışında dokunan tek yol ipucu ve ↺; ikisi de çözüm ya da başlangıç durumu koyuyor, bunlar da yörüngede. Doğrulamayı HEAD game.js üzerinde öneriyi bağımsız yamalayarak yaptım (scratchpad/tabla-v/load.cjs ve test.cjs):
- 7 boyut × 11 karışım × 150 tohum (sabit, eşli, ters, sayaçlı, iki merkez, karanlık, hepsi bir arada): 0 hatalı, 0 hazır çözülü, 0 yörünge dışı, 0 merkeze bitişik, 0 çakışma. Robot hepsini çözdü, par/taps tuttu.
- Rastgele oyun + ipucu + kaydet/yükle + ↺ + robot: 1200 denemede 0 çözülemeyen. 410 sayaç kilidi ↺ ile açıldı.
- Tablasız bölümler bit bit aynı: 1350 üretimde 0 fark, 0 zorluk farkı; 1–532 arası bölümlerde 0 fark.
- pick(): 533–672 arasında ortalama |d − hedef| = 0,41. Tablası hiç çıkmayan ya da girişte tablasız kalan bölüm yok.

BULDUĞUM KUSURLAR (karşı örnekler):
(1) KAYIT İMZASI DELİĞİ — gerçek. Çalışma ağacındaki saveRun artık sig: hashStr(G.sol.join()) kullanıyor. Tabla sol'ü değiştirmez, yalnız cur'u ve birim düzenini değiştirir. Eski üreticiyle yeni üreticinin aynı sol'ü verdiği 11 bölüm buldum (90 tablalı 536–760 bölümü içinde). Örnekler: 538 (eski: pairs → yeni: table+pairs), 542, 545 (pins → table+pins), 547 (cnt+fog → table). Bu bölümlerde yarım kalan eski kayıt imzadan geçip yükleniyor. 11 vakanın 11'inde de tabla hücreleri R yörüngesinin dışında kalıyor: bölüm dokunuşla çözülemez, yalnız 💡 ya da ↺ kurtarır. HEAD'deki pv:4 denetimi de aynı açığı bırakır.
(2) KARANLIKTA YARIM TABLA: dördünü birlikte açma (reveal4) uygulanmazsa 800 karanlık koşuda 557 kez yarısı karanlık tabla oluştu. O tablaya dokununca karanlık karonun içeriği aydınlık hücreye taşınıyor (bilgi sızıntısı). Öneride çözüm var, uygulanması zorunlu.
(3) KÜÇÜK IZGARADA ADAY YOK: 3×3'te hiç aday yok. 4×4'te en çok 1 aday var; iki merkez, sabit ya da eşliyle 0 kalıyor. 5×6'da iki merkez + karanlık + eşli karışımında %59'a, 5×7'de %35'e varan eksik tabla görüldü. M15'in 6×8 ve 7×9 ızgaralarında eksik 0, ama amount() ve pick() koruması şart.
(4) OKUNURLUK: çizimi canvas'ta 7×9, s = 52 px, koyu ve açık temada canlandırdım (tabla-v/mock.png). Karo zemini yarı saydam olduğu için daire görünüyor. Ama önerideki pim (içi boş halka + nokta) durak glifine (içi boş halka, r = .15s) fazla benziyor. Yan yana iki tabla da yaklaşık 2 px arayla birbirine değiyor.

### Zorunlu düzeltmeler

- Kayıt imzası birim düzenini de kapsamalı. start()'ta, kayıt yüklenmeden önce G.sig = hashStr(G.sol.join() + '|' + G.cur.join()) hesapla (önbellekten gelen ilk cur). Yükleme koşulu run.sig === G.sig olsun, saveRun sig: G.sig yazsın. HEAD yolunda ise pv:4 → pv:5. Karşı örnek: 538, 542, 545 ve 547. bölümlerde sol aynı kalıyor ama tabla yörünge dışı yükleniyor.
- reveal kancası zorunlu: tablanın bir hücresi görünürse dördü birden açılsın (U.cells.some(seen) → U.cells.forEach(on)). Aksi hâlde yarı karanlık tabla oluşur ve dokunuş karanlık içeriği aydınlığa taşır.
- Aday süzgeci: free(i) (merkez, sabit, eşli ve !C.busy dahil) && !C.keep[i] && iki merkeze de Manhattan > 1 && dört hücrenin dört komşusu da geometrik olsun (tünel ağzı olmasın: C.adj yoksa ya da adj[i*4+k] geometrik komşuya eşitse) && köprü (split) olmasın && tabla, t = 1..3 için kendine simetrik olmasın. Tabla 'shape' aşamasında C.unit(Q, 4, tap, 'table') ile kaydedilsin. 'mark' aşamasındaki ve sonraki eklentiler C.busy hücrelerine dokunmasın; bu kural eklenti sözleşmesine yazılsın.
- amount(): cols < 4 ya da rows < 4 ise 0. pick(): istenenden az tabla üreten aday, başka aday varsa seçilmesin (giriş bölümünde tablasız kural kartı çıkmasın).
- Pim glifi durağa benzememeli: içi dolu pal.mut disk (r ≈ .07s) ve ortasında pal.bg ile küçük mil noktası (r ≈ .025s). İçi boş halka kullanılmasın. Pim karo zemininden SONRA çizilsin.
- İpucu tablaya düşerse dört hücreye anim.set (yerinde dönme) verilmesin; press.set ve burst yeter, yoksa karolar hem yer değiştirip hem yerinde dönüyormuş gibi görünür. Kilit rozeti dört karoda ayrı ayrı değil, pimin yanında tek olsun (kozmetik).
- Okunurluk için iki tablanın hücreleri birbirine 4-komşu olmasın; en az bir karo aralık kalsın. Ölçümde 6×8 ve 7×9'da aday sayısı buna yetiyor.
- Animasyon yalnız çizimi etkilesin: G.cur dokunuşta anında güncellensin, dokunma ızgarası geo'dan hesaplansın. prefers-reduced-motion (calmMotion) açıksa tabla animasyonu atlansın. Hamle anahtarı 'u'+u olsun; çalışma ağacında öyle, art arda tabla dokunuşu 1 hamle sayılır.

### Doğrulayıcının uygulama planı

NOT: www/game.js çalışma ağacında başka bir ajan şu an eklenti altyapısını yazıyor (MODS, loadRules, generate'te stage('pre'|'tree'|'shape'|'mark'), C.unit/unitTaps, difficulty içinde M[i][r], pointerdown birim dalı, draw kancaları xform/base/under/over/top, reveal kancası, hint'te usz, sig). www/rules/doner-tabla.js henüz boş bir taslak. Plan önce bu sözleşmeye göre yazıldı; altyapı birleşmezse HEAD'e doğrudan yama (B) geçerli.

A) www/rules/doner-tabla.js (kuralın tamamı)
window.RAY_RULES = window.RAY_RULES || []; RAY_RULES.push(api => {
  const { rot } = api, plRot = (c, Q) => { const v = Q.map(q => c[q]); Q.forEach((q, p) => { c[q] = rot(v[(p + 3) % 4]); }); };
  const t0 = new Map();   // birim → dönüş başlangıcı (yalnız çizim)
  const md = (C, a, b) => b < 0 ? 99 : Math.abs(a % C.cols - b % C.cols) + Math.abs((a / C.cols | 0) - (b / C.cols | 0));
  return {
    key: 'table', line: 14,
    card: { name: 'Döner tabla', tag: 'Yeni: döner tabla', demo: '<div class="rdemo9" aria-hidden="true"><div class="tb"><i></i><i></i><i></i><i></i><b></b></div><s class="pn"></s><i class="rtap9"></i></div>', text: 'Yuvarlak <b>döner tabla</b> dört karoyu taşır: birine dokun, tabla bütünüyle <b>90° döner</b>. Karolar yer değiştirir, aralarındaki raylar <b>kopmaz</b>.' },
    amount: (n, intro, z, fin, c, r) => c < 4 || r < 4 ? 0 : intro ? 1 : 2,
    shape(C) {   // eşli ve makastan sonra, ters ve sayaçtan önce; R() yalnız burada tüketilir
      const ok = i => C.free(i) && !C.keep[i] && md(C, i, C.hub) > 1 && md(C, i, C.hub2) > 1 && !C.out.split?.[i] && geom(C, i);
      for (let k = 0; k < C.x.table; k++) {
        const cand = [];
        for (let y = 0; y < C.rows - 1; y++) for (let x0 = 0; x0 < C.cols - 1; x0++) {
          const Q = [y*C.cols+x0, y*C.cols+x0+1, (y+1)*C.cols+x0+1, (y+1)*C.cols+x0];
          if (!Q.every(ok) || Q.some(q => nearTable(C, q))) continue;   // en az 1 karo aralık
          const c = C.sol.slice(), s0 = Q.map(q => C.sol[q]).join(); let sym = false;
          for (let t = 1; t < 4; t++) { plRot(c, Q); if (Q.map(q => c[q]).join() === s0) sym = true; }
          if (!sym) cand.push(Q);
        }
        if (!cand.length) break;
        const Q = cand[C.R() * cand.length | 0], t = 1 + (C.R() * 3 | 0);
        Q.forEach(q => { C.cur[q] = C.sol[q]; });                 // bağımsız karıştırma silinir
        C.unit(Q, 4, c => plRot(c, Q), 'table');                  // busy + unitOf; par/taps unitTaps'ten
        for (let q = 0; q < t; q++) plRot(C.cur, Q);              // oyuncu 4−t dokunuşla geri döner
      }
      if (C.units.some(U => U.kind === 'table')) C.out.table = 1;   // G.table bayrağı: kancalar G[m.key] ile çalışır
    },
    reveal(G, on) { for (const U of G.units) if (U.kind === 'table' && U.cells.some(q => G.seen[q])) U.cells.forEach(on); },
    onTap(G, U, i, now) { if (!api.calm()) t0.set(U, now); if (!api.save.tableTold) { api.save.tableTold = 1; api.persist(); api.toast('Döner tabla · dört karo birlikte döner'); } },
    xform(D) {   // dönüş 190 ms, back yumuşatması; X[q][4] = true → eksen hizalı zemin çizilmez
      let busy = false;
      for (const [U, s0] of t0) {
        const t = Math.min((D.now - s0) / 190, 1); if (t >= 1) { t0.delete(U); continue; } busy = true;
        const a = -(1 - api.back(t)) * Math.PI / 2, [bx, by] = ctr(D, U.cells), c = Math.cos(a), s = Math.sin(a);
        for (const q of U.cells) { const [x, y, , sc] = D.X[q], dx = x - bx, dy = y - by; D.X[q] = [bx + dx*c - dy*s, by + dx*s + dy*c, a, sc, true]; }
      }
      return busy;
    },
    base(D) {   // zeminden önce, tek yolda bütün tablalar: 2 çağrı
      D.cx.beginPath(); for (const U of tables(D.G)) { const [bx, by] = ctr(D, U.cells); D.cx.moveTo(bx + D.s*.98, by); D.cx.arc(bx, by, D.s*.98, 0, 7); }
      D.cx.fillStyle = D.rgba(D.pal.fg, .06); D.cx.fill(); D.cx.lineWidth = 2; D.cx.strokeStyle = D.pal.mut; D.cx.stroke();
    },
    over(D) {   // pim: içi dolu disk + mil noktası (durak halkasına benzemez), 2 çağrı; vis(Q[0]) değilse çizme
      D.cx.beginPath(); for (const U of tables(D.G)) if (D.vis(U.cells[0])) { const [bx, by] = ctr(D, U.cells); D.cx.moveTo(bx + D.s*.07, by); D.cx.arc(bx, by, D.s*.07, 0, 7); } D.cx.fillStyle = D.pal.mut; D.cx.fill();
      D.cx.beginPath(); /* aynı döngü, r = .025s */ D.cx.fillStyle = D.pal.bg; D.cx.fill();
    },
    css: '…rdemo9 (aşağıda D)…'
  };
});
Yardımcılar: ctr = iki çapraz hücre merkezinin ortası, (X[Q[0]] + X[Q[2]]) / 2. Animasyon X'i değiştirse bile merkez değişmez, çünkü Q[0] ile Q[2] simetrik döner; yine de geo'dan hesaplamak daha güvenli. geom(C, i): C.adj yoksa true, varsa dört yönde adj[i*4+k] geometrik komşuya eşit olmalı. tables(G) = G.units.filter(U => U.kind === 'table'). api'ye back, calm, toast, save, persist verilir.

B) game.js çekirdeği (çalışma ağacında çoğu hazır; değişecek ya da doğrulanacak yerler)
- start(): restore'dan önce G.sig = hashStr(G.sol.join() + '|' + G.cur.join()). Koşul: run.sig === G.sig (eski run.sig = hash(sol) artık kabul edilmez; eski pv:4 yolu yalnız lvl < lineStart(8) için kalsın). saveRun: sig: G.sig. Bu, karşı örnek 538/542/545/547'yi kapatır.
- pick(): if (x.table && (P.units || []).filter(U => U.kind === 'table').length < x.table) P.diff += 50 (başka aday varsa seçilmez).
- generate(): ek değişiklik yok. 'shape' aşaması tablayı çağırır. free() içinde !C.busy var. Karanlıkta merkezi yalnızlaştırma adımı ve 293. satırdaki findIndex tabla hücresini zaten atlıyor (C.busy). par/taps: tabla için unitTaps (K = 4).
- difficulty(): değişiklik yok. Tabla birimi için M[i][r] = r kez U.tap uygulanmış kopyadaki değer, yani val(i, r) = rn(cur[Q[(pos − r + 4) % 4]], r) ile özdeş. Tablasız tahtada puan birebir aynı (1350/1350 ölçüldü).
- lit(): değişiklik yok. Kazanma koşulu cur üzerinden; merged uyarısı iki merkezde de çalışır.
- pointerdown: birim dalı mevcut (U.tap(G.cur), anahtar 'u'+u, onTap). Sabit (fixed) kontrolü, ipucuyla sabitlenen tablayı reddeder; dört hücre birlikte fixed olduğundan bu yeter.
- hint(): wrong.sort'ta usz (tabla = 4) sona alınıyor ✓. Birim hücrelerine anim.set yerine yalnız press.set verilsin: if (ui >= 0 && G.units[ui].kind === 'table') anim'i atla.
- reset(): değişiklik yok. keep[] dört hücreyi birlikte sol'e koyar, önbellek cur'u yörüngededir.
- draw(): kancalar mevcut. Toplam ek çizim çağrısı +4 (daire dolgu + kenar, pim iki katman). Animasyonsuz karede yalnız base ve over çalışır.

C) HEAD'e doğrudan yama (altyapı gelmezse; tabla-v/load.cjs'teki yama test edildi)
- generate: pairs bloğundan sonra plate = new Array(n).fill(-1), plates = []; free'ye && plate[i] < 0 eklenir; yukarıdaki aday döngüsü (x0 değişkeni) uygulanır; 293. satıra && plate[j] < 0; par döngüsünde if (plate[i] >= 0) { yalnız Q[0]'da plRot simülasyonuyla r hesapla; taps += r; par += !!r; return }; dönüşe plate, plates eklenir.
- difficulty: plA = P.plate || [], pos[]; birim kurulumunda tabla = Q; val(i, r) yukarıdaki gibi; can, filter ve dfs yaprağındaki rn(cur[..], r) çağrıları val ile değiştirilir.
- pointerdown: fog/pinned/cnt kontrollerinden sonra: if (G.plate?.[i] >= 0) { plRot(G.cur, Q); key = Q[0]; plAnim.set(k, now) } else { eski dal }.
- reveal: sonuna tabla dörtlüsünü birlikte açma eklenir.
- hint: grup = plate ? Q : link ? [i, j] : [i]; sort'ta tabla sona.
- saveRun ve start: pv:5.
- draw: X döngüsünden sonra plAnim dönüşümü, zemin döngüsünde atlama, 1 numaralı adımdan önce daire, 5 numaralı adımdan sonra pim.

D) style.css · kural kartı demosu (~7 satır)
.rdemo9{position:relative;align-self:center;width:104px;height:104px;margin:6px 0 2px}
.rdemo9 .tb{position:absolute;inset:0;border-radius:50%;background:var(--pin);box-shadow:inset 0 0 0 2px var(--mut);animation:spin4 4s cubic-bezier(.3,1.4,.5,1) infinite}
.rdemo9 .tb i{position:absolute;width:44px;height:44px;border-radius:12px;background:var(--tile);box-shadow:inset 0 0 0 1px var(--stroke)}
.rdemo9 .tb i:nth-child(1){left:6px;top:6px}.rdemo9 .tb i:nth-child(2){right:6px;top:6px}.rdemo9 .tb i:nth-child(3){right:6px;bottom:6px}.rdemo9 .tb i:nth-child(4){left:6px;bottom:6px}
.rdemo9 .tb b{position:absolute;left:22px;top:28px;width:60px;height:48px;border:12px solid var(--acc);border-top:0;border-radius:0 0 16px 16px;box-sizing:border-box}   /* dörtlü boyunca U biçimli ray */
.rdemo9 .pn{position:absolute;left:50%;top:50%;width:12px;height:12px;margin:-6px;border-radius:50%;background:var(--mut)}   /* pim dönmez */
.rdemo9 .rtap9{position:absolute;left:14px;top:14px;width:30px;height:30px;border-radius:50%;border:2.5px solid var(--fg);opacity:0;animation:tap2 1s .1s ease-out infinite}
spin4 zaten var (4 adım × 90°, 100%'de 360°): döngü kesintisiz. Halka, dönüş adımlarına (%15, %40, %65, %90) eşzamanlı vurur. Kartın altındaki tek cümle: 'Dokun: dört karo birlikte döner ve yer değiştirir.'

E) Robot: tools/hakem/doner-tabla.cjs (K bölümü; T yardımcıları)
1. Üretici (page.evaluate): 6×8 ve 7×9 × {table:2} ve +pins, +pairs, +rev/cnt, +two, +fog, hepsi × 300 tohum. Beklenenler: lit(sol).solved; lit(P).solved hiç doğru değil; her tabla kendi çözümünün R^t yörüngesinde (t = 1..3); merkeze Manhattan > 1; sabit, eşli, ters, sayaçlı, busy ya da split ile kesişme yok; 6×8 ve üstünde tabla sayısı istenen kadar; unitTaps toplamı = P.taps. Benim ölçümüm 0 hata.
2. Rastgele yürüyüş: rastgele dokunuşlar + ipucu + JSON kaydet/yükle + ↺ + plan()/solve(); 1200 koşuda 0 çözülemeyen bekleniyor.
3. Uyumluluk: 1–532 arası bölümler (örnekleme) ve tablasız generate çağrıları HEAD ile bit bit aynı olmalı; R() yalnız x.table varken tüketiliyor.
4. Arayüz (bölüm 533, seen 2..13): 'YENİ KURAL · Döner tabla' kartı ve .rdemo9 görünmeli; ızgara 6×8 olmalı. Tabla hücresine bir dokunuşta dört cur değeri plRot(önceki) olmalı ve moves +1. Aynı tablanın başka hücresine dokunuşta moves değişmemeli. 4 dokunuş başa dönmeli. Yalnız tabla yanlışken 💡: dördü fixed ve sol olmalı, bölüm kazanılmalı. ↺ sonrası fixed tabla korunmalı.
5. Kayıt: ortadayken sayfayı yeniden yükle; cur aynı ve yörüngede olmalı. Aynı sol ama farklı ilk cur ile sahte run.sig enjekte et; kayıt REDDEDİLMELİ (karşı örnek testi).
6. Karanlık: {table:2, fog:true} ile her reveal sonrasında yarı karanlık tabla sayısı 0 olmalı.
7. solve() (plan() tabla dalı): if (U.kind === 'table') { dokunuş sayısı k = unitTaps(U, G.cur, G.sol); hücre = U.cells.find(q => görünür) } → 533 ve tablalı bir karma bölümde kazanma. Konsol hatası yok.
