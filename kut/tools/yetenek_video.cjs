// Kahraman ayrıntı kartındaki YETENEK ÖNİZLEME videolarını önceden üretir (web/arayuz/yetenek/<id>.mp4 + liste.json).
// Kullanım (kut/ klasöründen; sunucu 8092'de açık olmalı: python3 -m http.server 8092; başka kapı: PORT=<kapı>):
//   node tools/yetenek_video.cjs                 → 16 kahramanın hepsi
//   node tools/yetenek_video.cjs golem,anka      → yalnız seçilenler
//   Çıktı: web/arayuz/yetenek/<id>.mp4 (H.264, iOS) + <id>.webm (VP9 yedeği) + liste.json
//   Var olan <id>.mp4 atlanır (YENIDEN=1 hepsini yeniden üretir).
//   ORTAM: KARE_DIR=<geçici kare klasörü> (varsayılan /tmp/kut_yetvid), HAFIF=1 (gölgesiz, hızlı), SADECE_KARE=1 (ffmpeg yok; döngü
//          seçimi <KARE_DIR>/<id>/dongu.json'a yazılır),
//          ADIM=<n> (yalnız her n'inci kare: kadraj denetimi için hızlı önizleme; SADECE_KARE=1 ile)
// Gerekenler: playwright (chromium, SwiftShader WebGL), /usr/bin/ffmpeg.
// Akış: test3d.html?elle=1 sahnesinde KUT_SIM.Savas ile kahraman (taraf 0, ön sıra) + 2 rakip (+ dostlara etki eden yeteneklerde
// 1–2 dost) kurulur; rakiplerin manası erişilmez, saldırı sayacı (cd) sonsuz, menzili sınırsız yapılır: rakipler yalnız hedeftir
// (yetenek kullanmaz, saldırmaz, yürümez — menzilli mermileri ve darbe halkaları gösterilen yeteneği örtmesin, kadraj oynamasın);
// dostlar da öyle ve yerlerine çivili (yalnız görüntü). Kahramanın manası savaş girişinin tozu dağıldıktan sonra, iki vuruşu arasındaki
// sakin bir anda doldurulur (sunum: motor dosyaları değişmez, yalnız bu sim nesnesinin alanı). Sahne SAHNE.kare(1/30) ile sabit adımla
// ilerletilir (belirlenimci),
// yetenek pozunun başlangıcından ÖNCE_SN önce ile SONRA_AZAMI sonra arası 480×320 kare kare yakalanır; kamera kahramana
// 3/4 açıdan, rakipleri (ve dostları) da kadraja alan orta plan. Kamera sarsıntısı ve yakınlaştırması (his + vfx) önizlemede kapalı:
// sabit kamera; 2B katman (can çubukları, sayılar, ad balonu) da aynı kamerayla çizilir (sarsıntıda modellerden kopmasın).
// Kadraj: ilk (bulma) geçişte her karede birimlerin sahne konumu kaydedilir; çekim penceresinin bütün karelerinde kahraman, bütün
// rakipler ve dostlar (model kutusu, taban diski, can çubuğu) kenar payı içinde kalacak biçimde SABİT kamera seçilir: önce yanal
// ve dikey kaydırma (varsayılan odağa en yakın), sığmazsa en az geri çekilme (kahraman baskın kalsın). Sonra ÖLÇÜM geçişi (çizimsiz,
// hızlı): seçilen kamerayla 2B katman çizilirken her yazının (yüzen sayılar, ad balonu, yıldızlar) ekran kutusu kaydedilir; kutular
// en yakın birimin can çubuğu dayanağına piksel payı olarak bağlanır ve kadraj bu paylarla yeniden çözülür (yazılar da kadraja sığar;
// eskiden yalnız 28 px tahmini pay vardı, arkadaki rakibin sayıları üst kenardan taşıyordu). Son ölçüm taşan yazıyı raporlar.
// Döngü: kareler ONCE_SN önce ile pencere sonu arası yakalanır; videonun sonu baştaki GECIS kareyle çapraz geçer (ağırlık (i+1)/GECIS: son
// kare TAMAMEN başlangıç görüntüsü). Başlangıç kaydırması S ∈ [0, Smax] (video yetenek pozundan en az ONDE_PAY kare önce başlar) ve bitiş
// Lb birlikte seçilir; maliyet = geçiş kare çiftlerinin 96×64 farkı + kahramanın vuruş evresi farkı (motor vuruş anlarından, görsel
// zamanla: geçişte poz çift görüntüsü yok — Kristal Kurt, Bulut Atı) + dikiş adımının (S+G−1 → S+G) farkı (dikiş sakin bir anda).
// KALICI DURUMLAR: yeteneğin olduğu motor adımında yeni gelen/yenilenen durumlar (birim, ad, değer, süre), öfke yükü ve kalkan "yetenek
// belirteci" olarak alınır (kahramanın sıradan vuruş durumları — Zehirli Diş, Soğuk Dokunuş — sayılmaz). Belirteç motorda durdukça ve
// verildiği süre dolmadıkça kare kirli; son kirli kareden sonraki motor anına görsel zamanın SONUM_SN payla ulaştığı ilk kare "temiz".
// Geçiş temiz kareden önce başlamaz: donmuş rakipler (Ayaz), zehir yeşili, öfke parıltısı ve yükü, kor/kül halkaları, davul/uluma gücü
// geçişte erimez. Pencere kahramana göre uzar (temiz kare + geçiş + bir vuruş aralığı; en çok SONRA_UZUN): video ~3,5–7 sn (Kara
// Gölge'nin 5 sn laneti en uzunu). Hiç bitmeyen durumda (Işık Kanadı kalkanı) eski pencere. Yetenekten sonra mana sıfırda tutulur
// (uzun pencerede ikinci yetenek gelmez; mana çubuğu baştakiyle aynı).
// Kodlama: dikişsiz — H.264 crf CRF (14, film), tek anahtar kare, B-kare yok, I/P nitelik oranı eşit, mbtree kapalı (son kare ilk kareyle aynı
// nitelikte: eski crf 26'da ilk I ile son P arasındaki nitelik sıçraması döngüde "tık" yapıyordu); VP9 aynı kare dizisinden (mp4'ten
// yeniden kodlanmaz) crf CRF_VP9 (20), tek anahtar kare. Boyut ikinci planda (~2–3 MB mp4).
// Yer değiştiren yetenekler (Kasırga: rakipler geri itilir; Bulut Hücumu: at en arka rakibe atılır) için DONUS: etki bittikten sonra
// ilgili birimler motor nesnesinde yumuşakça yetenek öncesi yerlerine döner (rakipler toparlanıp yerine yürür; at arka yaydan dolanıp
// ilk hedefine döner) → bitiş görüntüsü başlangıçla aynı düzende, geçişte hayalet yok.
// Kadraj ekleri: kahramanın gerçek (iskeletli) tepe noktaları (16 yatay doğrultuda en uç + en üst; asa, kanat, kuyruk dahil) her
// karede ölçülür, kenardan ≥16 px içeride tutulur (Ayaz Baykuşu'nun asası sol kenara değiyordu). Alan halkaları (Kor Halkası) yerde
// çember noktalarıyla kadraja katılır (≥%90'ı içeride; esnek pay).
// ORTAM (ek): CIKTI_DIR=<video klasörü> (varsayılan web/arayuz/yetenek; deneme kodlamaları için), CRF, CRF_VP9.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const KUT = path.join(__dirname, '..'), OUTD = process.env.CIKTI_DIR ? path.resolve(process.env.CIKTI_DIR) : path.join(KUT, 'web', 'arayuz', 'yetenek');
const D = require(path.join(KUT, 'data.js'));
const TUM = D.KAHRAMANLAR.map(h => h.id);
const L = (process.argv[2] ? process.argv[2].split(',') : TUM).filter(h => TUM.includes(h));
const KD = process.env.KARE_DIR || '/tmp/kut_yetvid', HAFIF = process.env.HAFIF === '1';
// kamera ayarı: KAM_ON (önden bakış payı), KAM_UZAK, KAM_Y
const KAM = { on: +(process.env.KAM_ON || 0.55), uzak: +(process.env.KAM_UZAK || 4.8), y: +(process.env.KAM_Y || 2.2), W: 480, H: 320 };
// SONRA_SN: bitiş noktasının en erken yeri (yetenek pozundan sonra), SONRA_AZAMI: kalıcı durumsuz yetenekte pencerenin en kısa sonu,
// SONRA_UZUN: kalıcı durum bitene dek uzatmanın üst sınırı; GECIS: döngü çapraz geçişi (kare). ONCE_SN 0,8: dikiş (başlangıç kaydırması
// S) yetenek ön uyarısından önceki sakin bölümde seçilebilsin (eskiden 0,5: dikiş tam ön uyarı ışımasının başladığı kareye düşüyordu).
// SONUM_SN: motor durumu bittikten sonra görsel sönümü (boya, ikon, halka) için pay; ONDE_PAY: video yetenek pozundan en az bu kadar
// kare önce başlar.
const W = 480, H = 320, FPS = 30, ONCE_SN = 0.8, SONRA_SN = 2.5, SONRA_AZAMI = 3.1, SONRA_UZUN = 7.2, SONUM_SN = 0.5, ONDE_PAY = 6, GECIS = 12, AZAMI_BEKLE = 10;
const CRF = process.env.CRF || '14', CRF_VP9 = process.env.CRF_VP9 || '20';
// mana doldurma: savaş başından en erken BEKLE_SN sonra, son (motor) vuruşundan SUKUN_SN sonra (1,5: önceki vuruşun darbesi pencere
// başından önce sönsün; hızlı vuranda vuruş aralığından 3 kare kısa)
const BEKLE_SN = 2.2, SUKUN_SN = 1.5;
// Sahne yerleşimi (yalnız bu betiğin sim nesnesi; arena birimi: ızgara sütunu x = 0,75 + 1,5·sütun, taraf 0 ön sıra y = 5, taraf 1
// ön sıra y = 3, orta sıra 2). Kamera her kahramanda +x yanında (gök hep gün batımı tarafı).
// Rakipler: menzilli iki kahraman (saldırmaz, yürümez): karşı ön sırada kahramanın sütunu (1) ve onun sol arka çaprazı (1,17 / 2,28).
// Eski ikinci yer (0. sütun orta sıra: 0,75 / 2) kameradan bakınca yanal olarak çok açıktı: kahraman ile iki rakip kadraja sığmıyor,
// ikinci rakip (kurbağa) sağ kenarda yarım kesiliyordu (Yıldırım, Kül Doğuşu, Gölge Ok, Ayaz, Ocak); yeni yer ~1 birim yakın, öndeki
// rakibin ardında kalmaz, alan yetenekleri (Kül Doğuşu, Kasırga, Buz Nefesi: 1,6 hücre) ikisine de değer.
// Kor Halkası (2,2 hücre, kahramanın çevresi): kahraman biraz öne (4,3), kurbağa (1,35 / 2,6): halka iki rakibi de yakar.
// Bulut Hücumu: ilk hedef kurbağa atın ARDINDA (arenada +y; kameradan bakınca atın solunda), en arka rakip yılan sağda uzakta (aynalı:
// 3,95 / 1,15: kurbağa–yılan açıklığı kadrajı genişletmesin, at baskın kalsın). At hücumda kurbağadan uzaklaşıp yılanın önüne (y + 0,8)
// iner, dönüşte aynı yoldan (arka yaydan) gelir: hücum ve dönüş
// yolunda kimse yok. Eskiden kurbağa at ile yılanın arasındaydı: at hücumda kurbağanın ardından geçiyor (ad balonu kurbağanın can
// çubuğuna biniyordu), dönüşte kurbağanın önünden geçip onu örtüyordu.
const RAKIP_SIRA = { bulutat: ['kurbaga', 'yilan'] };   // [öndeki, ikinci]
const RAKIP1 = { bulutat: [2.25, 5.0] };   // ilk rakibin yeri (varsayılan: karşı ön sıra, kahramanın sütunu)
// Zümrüt Zehri (kamera hafif arkadan): ikinci rakip (rüzgâr) kurbağanın ardında kalıyordu → biraz kameraya ve sağa (1,6 / 1,8)
const RAKIP2 = { bulutat: [2.05, 1.15], kurt: [1.0, 2.55], kugu: [1.0, 2.55], kurbaga: [1.0, 2.55], semender: [1.35, 2.6], yilan: [1.6, 1.8] };   // ikinci rakibin yeri
const RAKIP = (h) => {
  const l = (RAKIP_SIRA[h] || ['yilan', 'kurbaga', 'ruzgar']).filter(x => x !== h);
  return [{ h: l[0], s: 2, x: 1, y: 0, p: RAKIP1[h] }, { h: l[1], s: 2, x: 0, y: 1, p: h in RAKIP2 ? RAKIP2[h] : [1.17, 2.28] }];
};
// Dostlar: dostlara etki eden yeteneklerde (Uluma: 2,1 hücre içindeki dostlar; Işık Kanadı ve Savaş Davulu: bütün dostlar; Kor Halkası:
// 2,2 hücredeki dostlara can; Zümrüt Zehri: en yaralı dosta can) etkinin dostlara gittiği görünsün diye kahramanın yanında dost
// (saldırmaz, yürümez, vurulmaz). Kahramanla ortak soyları yok (soy eşiği açılıp kahramanın vuruşu/sayıları değişmesin). Kuğu'nun
// Ana pasifinin savaş başı kalkanı silinir (kalkanı yetenek versin). İyileştiren yeteneklerde dost yaralı başlar (YARALI: can oranı).
const DOST = { kurt: ['yarasa', 'semender'], kugu: ['koc', 'tilki'], kurbaga: ['kurt', 'koc'], semender: ['kurt'], yilan: ['tilki'] };
const YARALI = { semender: 0.5, yilan: 0.45 };
// dost yerleri: kahramana göre arena farkı. Kamerada kahramanın solunda, biraz geride (küçük görünür: kahraman baskın, ortada);
// ikincisi de Uluma'nın 2,1 hücresi içinde. Bu sahnelerde kahraman öne (rakibe vuruş uzaklığına) alınır, ikinci rakip öndekinin sağ
// arkasına (2,55): beş birim kadraja az geri çekilmeyle sığsın; Kristal Kurt yürüyüp dostlarından uzaklaşmasın.
// Uluma: yarasa eski yerde (kameradan 0,95 sol, 1,3 geride) kurdun ardında ~%40 örtülüydü → 1,25 sola, semender 1,95 sola (ikisi de
// 2,1 içinde; kamera doğrultusuna göre hesaplı).
const DOST_YER = [[-0.72, 1.48], [0.36, 1.8]];
// Zümrüt Zehri: kamera kahramanın hafif ardından bakıyor; dost kameradan uzak yana (−x) ve sola: yılandan büyük görünmesin
const DOST_YER_H = { kurt: [[-0.71, 1.82], [0.81, 1.78]], yilan: [[-1.3, 0.75]] };
const KAHRAMAN_YER = { kurt: [2.25, 4.0], kugu: [2.25, 4.0], kurbaga: [2.25, 4.0], semender: [2.25, 4.3], bulutat: [2.25, 4.0] };   // varsayılan: ön sıra 1. sütun (2,25 / 5)
// Bulut Hücumu: at en uzak rakibe ışınlanıp önüne iner. Eskiden iniş noktası kameradan bakınca rakiplerin ARKASINDA kaldığı için kamera
// öbür yandan bakıyordu (yan −1: gök mor-pembe, öteki videolar gün batımı sarısı). Yerleşim x'te aynalanır (kamera öteki videolarla
// aynı yanda, gök gün batımı sarısı).
const AYNA = { bulutat: true };
// yetenek başına kadraj (varsayılanların üstüne): hedef 'uzak' → doğrultu en uzak rakibe (varsayılan en yakın), yan −1 → kamera
// doğrultunun öbür yanında (ekranda kahraman sağda), on → önden bakış payı, uzak/y → uzaklık ve yükseklik çarpanı, odak → odağın
// rakip ortasına payı (varsayılan 0,45; kalanı kahraman). Kenar payı sığdırması (kadraj) bunların üstüne uygulanır.
// Bulut Hücumu: daha yandan (on 0,15: hücum ekranda soldan sağa okunur); doğrultu en uzak rakibe (yılan sağda, kurbağa solda).
// Zümrüt Zehri: hedef kurbağa önden bakışta kameraya en yakın birim olup kadrajın ortasını kaplıyordu, yılan küçük kalıyordu →
// kamera hafif kahramanın ardından (on −0,1) ve odak kahramana yakın: yılan öne, kurbağa geriye düşer.
const KAMH = { bulutat: { on: 0.15, y: 1.08, hedef: 'uzak' }, yilan: { on: -0.1, odak: 0.35 } };
// Alan halkaları (yerde, kahramanın çevresinde; r: görsel yarıçap, arena birimi; izin: kadraj dışında kalabilecek çevre payı). Kor
// Halkası (vfx ocak: 2,25 × güç) sol kenardan taşıyordu: çember noktaları kadraja katılır, ≥%90'ı içeride.
const HALKA = { semender: { r: 2.25, izin: 0.1 } };
// DONUS: yer değiştiren yeteneklerde birimler etkiden sonra yetenek öncesi yerlerine döner (döngü dikişi). bas: yetenek olayından sonra
// başlama (motor sn), sure: dönüş süresi, kavis: yolun ortasındaki yana sapma (arena birimi, aynalamadan sonra; +x kameraya doğru).
// Bulut Atı arka yaydan (kameradan uzak yandan) döner: kimsenin önünden geçmez. kim: 'rakip' (bütün rakipler) | 'kahraman'.
const DONUS = { ruzgar: { kim: 'rakip', bas: 1.25, sure: 0.8 }, bulutat: { kim: 'kahraman', bas: 1.15, sure: 0.95, kavis: [-0.3, 0] } };
// kahramanın menzili (yalnız bu sim nesnesi): Kasırga rakipleri menzil (3) dışına iter, Rüzgâr Ruhu öne yürüyordu → döngüde çift görüntü
const MENZIL = { ruzgar: 4 };
// sahne: iki takım (sim birimleri), p: arena konumu [x, y] (ızgara yerine; aynalama burada)
const izgara = (x, y, taraf) => [0.75 + x * 1.5, taraf === 0 ? [5, 6, 7][y] : [3, 2, 1][y]];
function sahne(h) {
  const k = KAHRAMAN_YER[h] || izgara(1, 0, 0), dy = DOST_YER_H[h] || DOST_YER;
  const a = [{ h, s: 1, x: 1, y: 0, p: k }];
  (DOST[h] || []).forEach((d, i) => a.push({ h: d, s: 1, x: 2, y: 1 + i, p: [k[0] + dy[i][0], k[1] + dy[i][1]] }));
  const b = RAKIP(h).map(r => ({ ...r, p: r.p || izgara(r.x, r.y, 1) }));
  if (AYNA[h]) for (const o of [...a, ...b]) o.p = [6 - o.p[0], o.p[1]];
  return { a, b, yarali: YARALI[h] || 0, donus: DONUS[h] || null, menzil: MENZIL[h] || 0, halka: HALKA[h] || null };
}
(async () => {
  if (process.env.SADECE_KARE !== '1') fs.mkdirSync(OUTD, { recursive: true });
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const p = await br.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  p.setDefaultTimeout(200000);
  p.on('pageerror', e => console.log('HATA', e.message));
  // belirlenimci zaman: performance.now kare başına sabit 1/FPS ilerler (gerçek saate bağlı görsel hesaplar CPU yükünden bağımsız;
  // geçişler — yetenek anını bulma, yazı ölçümü ve yakalama — aynı kareleri üretir)
  await p.addInitScript(() => { const ger = performance.now.bind(performance); window.__sz = { aktif: false, t: 0 }; performance.now = () => window.__sz.aktif ? window.__sz.t : ger(); });
  await p.goto(`http://localhost:${process.env.PORT || 8092}/web/test3d.html?elle=1${HAFIF ? '&hafif=1' : ''}&a=golem&b=golem&tohum=7`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await p.waitForFunction(() => window.HAZIR, null, { timeout: 240000 });
  await p.evaluate(async () => {
    // ilerletirken çizim yok (yalnız yakalanan karede _ciz): SwiftShader'da 2–3 kat hızlı
    if (SAHNE._cizAtla) SAHNE._cizAtla(true);
    // sabit kamera: kare() içindeki sarsıntı/yakınlaştırma (his) ve vfx sarsıntısı kapalı. Eskiden 3B çizim sabit kamerayla, 2B katman
    // sarsılan kamerayla çiziliyordu: Yıldırım'da can çubukları ve ad balonu modellerden kopup zıplıyordu.
    const { his } = await import('/web/hareket.js'), { vfx } = await import('/web/vfx.js');
    his.kameraUygula = () => {}; his.kameraGeriAl = () => {};
    const sifir = vfx.sarsintiOfset(); vfx.sarsintiOfset = () => sifir.set(0, 0, 0);
    // yazı ölçümü: 2B katmana çizilen her yazının ekran kutusu (window.__YZ dizi iken). [metin, x0, y0, x1, y1, balon]
    const kc = document.getElementById('k').getContext('2d'), f0 = kc.fillText.bind(kc);
    kc.fillText = function (t, x, y, mw) {
      const Z = window.__YZ;
      if (Z && this.globalAlpha > 0.3 && t && String(t).trim()) {
        const m = this.getTransform(), mt = this.measureText(t);
        const l = x - mt.actualBoundingBoxLeft, r = x + mt.actualBoundingBoxRight, u = y - mt.actualBoundingBoxAscent, d = y + mt.actualBoundingBoxDescent;
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
        for (const [px, py] of [[l, u], [r, u], [l, d], [r, d]]) { const X = m.a * px + m.c * py + m.e, Y = m.b * px + m.d * py + m.f; x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); }
        Z.push([String(t), x0, y0, x1, y1, this.textBaseline === 'middle' ? 1 : 0]);
      }
      return f0(t, x, y, mw);
    };
    window.__sz.t = performance.now(); window.__sz.aktif = true;
  });
  const kur = (h) => p.evaluate(async ({ dz }) => {
    const sim = KUT_SIM.Savas(dz.a, dz.b, { tohum: 7, alamet: 'yok' });
    const civi = [];
    for (const u of sim.birimler) {
      const t = (u.taraf ? dz.b : dz.a)[u.i];
      u.x = u.x0 = t.p[0]; u.y = u.y0 = t.p[1];
      if (u.taraf === 1) { u.mana = 1e9; u.mp = 0; u.cd = 1e9; u.menzil = 99; }   // rakip: yalnız hedef (saldırmaz, yürümez)
      else if (u.i > 0) {   // dost: yalnız görüntü (iyileştiren yetenekte yaralı başlar)
        u.mana = 1e9; u.mp = 0; u.cd = 1e9; u.menzil = 99; u.kalkan = 0; if (dz.yarali) u.hp = Math.round(u.mx * dz.yarali); civi.push([u, u.x, u.y]);
      }
    }
    await SAHNE.savasKur(sim);
    const u = sim.birimler.find(o => o.taraf === 0 && o.i === 0);
    if (dz.menzil) u.menzil = dz.menzil;
    // sahnenin kökünde vfx'in 3B yetenek nesneleri (kadraj kutuları için)
    { const THREE = await import('three'); let r = SAHNE._bTMP(u.uid).kok; while (r.parent) r = r.parent;
      // yalnız gölge pençesi: kaya/ok/zümrüt yayları vfx'te zaten kadraja göre alçalır (kutuları kamerayı gereksiz geri çekiyordu)
      const AD = ['vfx_pence'];
      window.__vfxNes = r.children.filter(o => AD.includes(o.name)); window.__kutu = window.__kutu || new THREE.Box3(); window.__THREE = THREE; }
    // geniş kamera + bir çizim: bulma/ölçüm geçişlerinde bütün birimler görüş alanında (kare() ekran dışı birimin iskeletini güncellemez;
    // kahramanın iskeletli tepe noktaları ölçülür). Çekimde kamera __kamKur ile yeniden kurulur.
    SAHNE.yakinKamera(u.uid, 13, 0.9, 9, 0); SAHNE._ciz();
    // kahramanın iskeletli tepe noktaları: modelin kendi örgüleri (kurulumda; sonradan kemiklere takılan vfx sayılmaz), seyreltilmiş
    // tepeler 16 yatay doğrultuda en uç + en üst (asa, kanat, kuyruk ucu); dünyada [x, y, z]
    { const THREE = window.__THREE, M = SAHNE._bTMP(u.uid).model, ML = [], v = new THREE.Vector3(), D = 16;
      M.traverse(o => { if (o.isMesh && o.geometry && o.geometry.attributes.position) ML.push(o); });
      const gorunur = (o) => { for (let q = o; q && q !== M.parent; q = q.parent) if (!q.visible) return false; return true; };
      window.__ucNok = (b) => {
        if (!b) return null;
        b.kok.updateMatrixWorld(true);
        const en = new Array(D).fill(-1e9), P = new Array(D).fill(null); let yu = -1e9, Pu = null;
        for (const o of ML) {
          if (!gorunur(o)) continue;
          const n = o.geometry.attributes.position.count, st = Math.max(1, Math.floor(n / 1500));
          for (let i = 0; i < n; i += st) {
            o.getVertexPosition(i, v); v.applyMatrix4(o.matrixWorld);
            for (let d = 0; d < D; d++) { const a = d / D * 2 * Math.PI, sk = v.x * Math.cos(a) + v.z * Math.sin(a); if (sk > en[d]) { en[d] = sk; P[d] = [v.x, v.y, v.z]; } }
            if (v.y > yu) { yu = v.y; Pu = [v.x, v.y, v.z]; }
          }
        }
        return [...P, Pu].filter(Boolean);
      }; }
    const V = window.__V = { sim, u, uid: u.uid, dolu: false, kare: 0, yet: 0, yetT: null, on: null, donus: dz.donus, donBas: null, donBitti: false, vurSon: -1, vurK: 0, vurT: [] };
    // mana: savaş girişinin tozu dağıldıktan sonra (BEKLE) ve son vuruştan SUKUN kare sonra (motor görüntünün 0,4 sn önünde: görüntüdeki
    // vuruş, mermisi ve sayısı geçmiş olur) doldurulur → yetenek sakin bir duruştan başlar; döngünün başı da (yetenekten 0,5 sn önce) sakin.
    // Eskiden ilk vuruşta doluyordu: başlangıçta giriş tozu ve vuruş mermisi vardı, sondaki görüntüyle çapraz geçişte hayalet kalıyordu.
    // Hızlı vuranda (Bulut Atı ~0,9 sn) bekleme vuruş arasından 3 kare kısa tutulur. Dolana dek doğal mana birikmez (yetenek kendiliğinden
    // erken gelip bulma geçişini şaşırtmasın).
    V.mana = () => {
      if (V.dolu) return;
      u.mp = 0;
      if (u.vurus !== V.vurSon) { if (V.vurSon >= 0) V.vurAra = V.kare - V.vurK; V.vurSon = u.vurus; V.vurK = V.kare; }
      const ara = V.vurAra ? Math.min(dz.sukun, V.vurAra - 3) : dz.sukun;
      if (V.kare >= dz.bekle && u.ilkVurusYapildi && V.kare - V.vurK >= ara) { u.mp = u.mana; V.dolu = true; }
    };
    // DONUS: yetenek öncesi yerlere yumuşak dönüş (motor zamanıyla; anlık görüntü adımdan sonra alındığı için kayma görüntüye aynen geçer)
    const donus = () => {
      const Dn = V.donus; if (!Dn || V.yetT == null || !V.on || V.donBitti) return;
      const t0 = V.yetT + Dn.bas, t1 = t0 + Dn.sure; if (sim.t < t0) return;
      if (!V.donBas) {
        const liste = Dn.kim === 'rakip' ? sim.birimler.filter(o => o.taraf === 1 && !o.olu) : [u];
        V.donBas = liste.map(o => [o, o.x, o.y, o.cd]); for (const o of liste) o.cd = 1e9;   // dönerken vurmaz
      }
      const e = Math.min(1, (sim.t - t0) / (t1 - t0)), s = e * e * (3 - 2 * e), q = 1 - s, kv = Dn.kavis || [0, 0];
      for (const [o, ax, ay] of V.donBas) {
        const B = V.on[sim.birimler.indexOf(o)]; if (!B) continue;
        const mx = (ax + B[0]) / 2 + 2 * kv[0], my = (ay + B[1]) / 2 + 2 * kv[1];   // ikinci derece Bezier: tepe sapması kavis
        o.x = q * q * ax + 2 * q * s * mx + s * s * B[0]; o.y = q * q * ay + 2 * q * s * my + s * s * B[1];
      }
      if (e >= 1) { V.donBitti = true; for (const [o, , , cd] of V.donBas) { if (o === u) { o.cd = 0.3; o.hedef = null; } else o.cd = cd; } }   // kahraman en yakın rakibe döner
    };
    // yetenek belirteçleri: yeteneğin olduğu adımda yeni gelen ya da yenilenen durumlar (birim, ad, değer), artan öfke yükü ve kalkan.
    // Belirteç motor durumunda durdukça ve verildiği süre dolmadıkça kare "kirli" (kahramanın sıradan vuruşlarının durumları — Zehirli Diş,
    // Soğuk Dokunuş — sayılmaz; Zehirli Diş'in 18'lik zehri yeteneğin 55'lik zehrini erken ezse de yeşil boya 4 sn sürer: süre esas)
    const durumAl = () => sim.birimler.map(o => ({ d: Object.fromEntries(Object.entries(o.durum).map(([k, x]) => [k, [x.sure, x.deger || 0]])), ofke: o.ofke, kalkan: o.kalkan }));
    V.tok = [];
    V.kirli = () => V.tok.some(([i, ad, dg, su]) => { const o = sim.birimler[i]; if (!o || o.olu) return false;
      if (ad === 'ofke') return o.ofke > 0; if (ad === 'kalkan') return o.kalkan > 0.5; if (sim.t < V.yetT + su) return true;
      const d = o.durum[ad]; return !!d && Math.abs((d.deger || 0) - dg) < 1e-6; });
    const ad0 = sim.adim.bind(sim);
    sim.adim = () => {
      const once = V.yetT == null ? sim.birimler.map(o => [o.x, o.y]) : null, dOnce = V.yetT == null ? durumAl() : null;
      ad0();
      for (const [d, x, y] of civi) { d.x = x; d.y = y; }
      for (const f of sim.fx) {
        if (f.tip === 'yetenek' && f.u === u.uid) { V.yet++; if (V.yetT == null) { V.yetT = sim.t; V.on = once;
          durumAl().forEach((o, i) => { const a = dOnce[i]; if (!a) return;
            for (const [k, [su, dg]] of Object.entries(o.d)) if (!a.d[k] || su > a.d[k][0] + 1e-6 || dg !== a.d[k][1]) V.tok.push([i, k, dg, su]);
            if (o.ofke > a.ofke) V.tok.push([i, 'ofke']); if (o.kalkan > a.kalkan + 0.5) V.tok.push([i, 'kalkan']); }); } }
        if (f.tip === 'vurus' && f.k === u.uid) V.vurT.push(f.t);   // kahramanın vuruş anları (motor): döngüde vuruş evresi eşleşmesi
      }
      // yetenekten sonra mana sıfırda: ikinci yetenek gelmez (uzun pencerede), mana çubuğu döngü başındakiyle (0) aynı
      if (V.yetT != null) u.mp = 0;
      donus();
    };
  }, { dz: { ...sahne(h), bekle: Math.round(BEKLE_SN * FPS), sukun: Math.round(SUKUN_SN * FPS) } });
  // n kare ilerlet (ekran görüntüsü yok); bul: yetenek pozunun ilk karesinde dur. Her karede birimlerin sahne konumu window.__IZ'e
  // (kadraj hesabı için; yeniden oynatma aynı kareleri üretir). yazi: her karede 2B katman yazı kutuları window.__YZK'ye
  const ilerle = (n, bul = false, yazi = false) => p.evaluate(({ n, bul, yazi, FPS }) => {
    const V = window.__V, IZ = window.__IZ || (window.__IZ = []), YZK = window.__YZK || (window.__YZK = []);
    for (let i = 0; i < n; i++) {
      window.__sz.t += 1000 / FPS; if (yazi) window.__YZ = [];
      SAHNE.kare(1 / FPS); V.kare++;
      if (yazi) { YZK[V.kare] = window.__YZ; window.__YZ = null; }
      V.mana();   // giriş tozu dağılıp son vuruş geçince mana dolu → yetenek hemen
      if (!yazi) {
        IZ[V.kare] = V.sim.birimler.map(o => { const q = SAHNE._bTMP(o.uid); return q && { uid: o.uid, taraf: o.taraf, x: q.kok.position.x, y: q.kok.position.y, z: q.kok.position.z }; }).filter(Boolean);
        // yetenek durumu sürüyor mu (motor), motor ve görsel zaman (temiz kare ve vuruş evresi için); kahramanın iskeletli tepe noktaları
        (window.__DZ || (window.__DZ = []))[V.kare] = V.kirli() ? 1 : 0; (window.__ST || (window.__ST = []))[V.kare] = V.sim.t; (window.__GT || (window.__GT = []))[V.kare] = SAHNE._yet(V.uid).g;
        const KH = window.__KH || (window.__KH = []); if (!KH[V.kare]) KH[V.kare] = window.__ucNok(SAHNE._bTMP(V.uid));
        // yeteneğin 3B nesnesi (Kara Gölge'nin dev pençesi): kutusu kadraja girer (eskiden kadraj dışından, sağ ve üst kenardan giriyordu)
        const NS = window.__NS || (window.__NS = []), L3 = [];
        for (const o of window.__vfxNes || []) if (o.visible && o.position.y > -5) { window.__kutu.setFromObject(o); if (!window.__kutu.isEmpty()) L3.push([window.__kutu.min.x, window.__kutu.min.y, window.__kutu.min.z, window.__kutu.max.x, window.__kutu.max.y, window.__kutu.max.z]); }
        NS[V.kare] = L3;
      }
      const b = SAHNE._bTMP(V.uid);
      // görsel yetenek başlangıcı: yetenek pozu ya da hücum kayması (Bulut Hücumu); yedek: motor manayı harcadıktan 0,5 sn sonra
      if (bul && V.dolu && b && (b.durum === 'yetenek' || b.kay)) return V.kare;
      if (bul && V.dolu && V.u.mp < V.u.mana * 0.5 && V.harca == null) V.harca = V.kare;
      if (bul && V.harca != null && V.kare - V.harca >= 15) return V.kare;
    }
    return bul ? -1 : V.kare;
  }, { n, bul, yazi, FPS });
  // kadraj (sayfada): kahraman solda, rakipler sağda; bakış kahraman→rakip doğrultusuna dik, biraz önden (3/4); doğrultu ve
  // varsayılan odak (kahraman ile rakip ortası arası) çekimin ilk karesinden. Sonra pencerenin bütün karelerindeki birimler (ve yazılar)
  // kenar payına sığacak biçimde odak yana ve dikeyde kaydırılır (en az kayma), yetmezse kamera aynı açıyla geri çekilir (azami ×1,8).
  // Ölçüler: model kutusu (köke göre yatay yarıçap, tepe), taban diskinin kameraya yakın kenarı, can çubuğu (dayanak + piksel payı).
  // yazi: ölçüm geçişinin yazı kutuları (o geçişin kamerası window.__KAM) → birimin dayanağına bağlı piksel payları; yoksa tahmini pay.
  const kadraj = (ilk, N, KH, yazi, halka) => p.evaluate(async ({ ilk, N, K, KH, yazi, halka }) => {
    const THREE = await import('three');
    const V = window.__V, IZ = window.__IZ, kutu = new THREE.Box3(), olcu = {};
    for (const o of V.sim.birimler) {
      const b = SAHNE._bTMP(o.uid); if (!b) continue;
      b.kok.updateMatrixWorld(true); kutu.setFromObject(b.model || b.kok); const q = b.kok.position, boy = b.kok.userData.vfxBoy || 1.3;
      const r = Math.max(q.x - kutu.min.x, kutu.max.x - q.x, q.z - kutu.min.z, kutu.max.z - q.z);
      olcu[o.uid] = { r: Math.max(0.35, Math.min(1.1, r)), ust: Math.max(0.5, Math.min(2.2 * boy, kutu.max.y - q.y)), cub: 1.12 * boy + 0.12 };
    }
    const tV = Math.tan(THREE.MathUtils.degToRad(17.5)), tH = tV * K.W / K.H;
    // izdüşüm (sahne3d.yakinKamera + PerspectiveCamera 35°, 3:2 ile aynı): [px, py, derinlik]
    const kamHazir = (KM) => {
      const sa = Math.sin(KM.aci), ca = Math.cos(KM.aci), cx = KM.fx + sa * KM.U, cy = KM.Y, cz = KM.fz + ca * KM.U;
      let wx = KM.fx - cx, wy = KM.bakY - cy, wz = KM.fz - cz; const wl = Math.hypot(wx, wy, wz); wx /= wl; wy /= wl; wz /= wl;
      let qx = -wz, qz = wx; const ql = Math.hypot(qx, qz); qx /= ql; qz /= ql;   // sağ
      return { cx, cy, cz, wx, wy, wz, qx, qz, ux: -qz * wy, uy: qz * wx - qx * wz, uz: qx * wy };   // yukarı = sağ × ileri
    };
    const izd = (c, x, y, z) => {
      const vx = x - c.cx, vy = y - c.cy, vz = z - c.cz, d = vx * c.wx + vy * c.wy + vz * c.wz;
      const X = (vx * c.qx + vz * c.qz) / (d * tH), Y = (vx * c.ux + vy * c.uy + vz * c.uz) / (d * tV);
      return [(X + 1) / 2 * K.W, (1 - Y) / 2 * K.H, d];
    };
    const F = IZ[ilk], kah = F.find(o => o.uid === V.uid), rk = F.filter(o => o.taraf === 1);
    let rx = kah.x, rz = kah.z - 2;
    if (rk.length) { rx = 0; rz = 0; for (const r of rk) { rx += r.x; rz += r.z; } rx /= rk.length; rz /= rk.length; }
    const ok = KH.odak != null ? KH.odak : 0.45, fx0 = kah.x * (1 - ok) + rx * ok, fz0 = kah.z * (1 - ok) + rz * ok;
    // doğrultu: en yakın rakip (yakın dövüşçünün hedefi) → kahramanla hedef arasına kimse girmez
    const sg = KH.hedef === 'uzak' ? -1 : 1;   // en yakın (varsayılan) ya da en uzak rakip
    let en = null, ed = 1e9; for (const r of rk) { const d = sg * Math.hypot(r.x - kah.x, r.z - kah.z); if (d < ed) { ed = d; en = r; } }
    let dx = (en ? en.x : rx) - kah.x, dz = (en ? en.z : rz) - kah.z; const Ld = Math.hypot(dx, dz) || 1; dx /= Ld; dz /= Ld;
    const on = KH.on != null ? KH.on : K.on, yan = KH.yan || 1;
    const ox = -dz * yan + dx * on, oz = dx * yan + dz * on;   // ekranın sağı = rakip doğrultusu (yan −1: solu); on: önden bakış payı
    const aci = Math.atan2(ox, oz), sa = Math.sin(aci), ca = Math.cos(aci), Rx = ca, Rz = -sa;   // R: ekranın sağı (yatay)
    const b0 = SAHNE._bTMP(V.uid), v = b0.kok.userData.vfxBoy || 1.3, o = 0.7 + 0.3 * v / 1.3;   // büyük gövdede kamera geri çekilir
    const U0 = K.uzak * o * (KH.uzak || 1), Y0 = K.y * o * (KH.y || 1), bakY = 0.6 * o;
    // denetim noktaları: [x, y, z, sol pay, sağ pay, üst pay, alt pay (px), yatay kenar, dikey kenar (px)]
    const nk = [], MX = 12, MY = 6.4;
    for (let k = ilk; k < ilk + N; k += 2) {
      const Lk = IZ[k]; if (!Lk) continue;
      for (const q of Lk) {
        const m = olcu[q.uid]; if (!m) continue;
        for (const s of [-1, 1]) { nk.push([q.x + s * m.r * Rx, q.y, q.z + s * m.r * Rz, 0, 0, 0, 0, MX, MY]); nk.push([q.x + s * m.r * Rx, q.y + m.ust, q.z + s * m.r * Rz, 0, 0, 0, 0, MX, MY]); }
        nk.push([q.x + 0.62 * sa, 0, q.z + 0.62 * ca, 0, 0, 0, 0, MX, MY]);   // taban diskinin kameraya yakın kenarı
        // can çubuğu (yarı genişlik ~23 px + kalabalık ayrımı, üstte yıldız rozeti). Yazı ölçümü yoksa tahmini yazı payı: rakip ve dostta
        // yüzen sayılar (~60 px yükselir), kahramanda ad balonu (~50 px)
        const ust = yazi ? 24 : q.uid === V.uid ? 52 : 62;
        nk.push([q.x, q.y + m.cub, q.z, 28, 28, ust, 8, 4, 4]);
      }
    }
    // kahramanın iskeletli tepe noktaları (asa, kanat, kuyruk ucu dahil): kenardan ≥16 px içeride
    for (let k = ilk; k < ilk + N; k += 2) for (const q of (window.__KH && window.__KH[k]) || []) nk.push([q[0], q[1], q[2], 0, 0, 0, 0, 16, 16]);
    // alan halkası (yerde, yetenek anındaki kahraman konumu çevresinde 32 nokta; kenar payı 4 px): esnek, en çok izin × 32 nokta dışarıda
    let yumIzin = 0;
    if (halka) { for (let i = 0; i < 32; i++) { const a = i / 32 * 2 * Math.PI; nk.push([halka.x + halka.r * Math.cos(a), halka.y + 0.03, halka.z + halka.r * Math.sin(a), 0, 0, 0, 0, 4, 4, 1]); }
      yumIzin = Math.floor(halka.izin * 32); }
    // yeteneğin 3B nesneleri: kutunun 8 köşesi (kenar payı 4 px); yerin altı sayılmaz (pençe sonunda yarığa batar: kutunun altı yerin
    // 2 birim altına iniyordu, kamera boş arenayı gösterecek kadar geri çekilip aşağı bakıyordu)
    for (let k = ilk; k < ilk + N; k += 2) for (const b of (window.__NS && window.__NS[k]) || []) {
      if (b[4] < kah.y + 0.25) continue;
      for (const x of [b[0], b[3]]) for (const y of [Math.max(kah.y, b[1]), b[4]]) for (const z of [b[2], b[5]]) nk.push([x, y, z, 0, 0, 0, 0, 4, 4]);
    }
    let ty = 0;
    if (yazi && window.__YZK && window.__KAM) {
      // yazı kutusu → en yakın birimin dayanağı (balon: kahraman); piksel payları kameradan bağımsız sayılır (sayılar px ile yükselir)
      const c0 = kamHazir(window.__KAM);
      for (let k = ilk; k < ilk + N; k++) {
        const Z = window.__YZK[k], Lk = IZ[k]; if (!Z || !Lk) continue;
        const ank = Lk.map(q => { const m = olcu[q.uid]; if (!m) return null; const a = izd(c0, q.x, q.y + m.cub, q.z); return { q, m, ax: a[0], ay: a[1] }; }).filter(Boolean);
        for (const [, x0, y0, x1, y1, bal] of Z) {
          let sec = null, es = 1e9; const cx = (x0 + x1) / 2;
          for (const a of ank) {
            if (bal && a.q.uid !== V.uid) continue;
            const sk = Math.abs(cx - a.ax) + 0.6 * Math.max(0, y0 - a.ay - 12) + 0.25 * Math.max(0, a.ay - y1 - 40);
            if (sk < es) { es = sk; sec = a; }
          }
          if (!sec) continue;
          const bx = bal ? 11 : 4, by = bal ? 7 : 3;   // balon gövdesi yazının çevresinde
          nk.push([sec.q.x, sec.q.y + sec.m.cub, sec.q.z, sec.ax - x0 + bx, x1 - sec.ax + bx, sec.ay - y0 + by, y1 - sec.ay + by, 3, 3]); ty++;
        }
      }
    }
    const sigar = (s, kk, vv) => {
      const KM = { aci, fx: fx0 + s * Rx, fz: fz0 + s * Rz, U: U0 * kk, Y: Y0 * kk + vv, bakY: bakY + vv }, c = kamHazir(KM);
      let yum = 0;
      for (let i = 0; i < nk.length; i++) {
        const n = nk[i], a = izd(c, n[0], n[1], n[2]);
        if (a[2] < 0.5 || a[0] - n[3] < n[7] || a[0] + n[4] > K.W - n[7] || a[1] - n[5] < n[8] || a[1] + n[6] > K.H - n[8]) {
          if (n[9] && ++yum <= yumIzin) continue;   // esnek (halka) nokta
          if (i) { nk[i] = nk[0]; nk[0] = n; }   // ilk bakılan: son taşan nokta (arama hızlanır)
          return false;
        }
      }
      return true;
    };
    // arama: en az geri çekilme; o çekilmede en az kayma (yanal |s| + 2·dikey |v|)
    let sec = null;
    for (let i = 0; i <= 40 && !sec; i++) {
      const kk = 1 + i * 0.02; let ec = 1e9;
      for (let jv = -10; jv <= 10; jv++) { const vv = jv * 0.05;
        for (let j = -60; j <= 60; j++) { const s = j * 0.05, cst = Math.abs(s) + 2 * Math.abs(vv); if (cst >= ec) continue; if (sigar(s, kk, vv)) { ec = cst; sec = { s, kk, vv }; } } }
    }
    const tasma = !sec; if (!sec) sec = { s: 0, kk: 1.8, vv: 0 };
    window.__KAM = { aci, fx: fx0 + sec.s * Rx, fz: fz0 + sec.s * Rz, U: U0 * sec.kk, Y: Y0 * sec.kk + sec.vv, bakY: bakY + sec.vv };
    // sabit kamerayı kur (yakinKamera kahramanın köküne göre konumlar: kök geçici olarak odağa)
    window.__kamKur = () => {
      const KM = window.__KAM, V = window.__V, b = SAHNE._bTMP(V.uid), p0 = b.kok.position.clone();
      b.kok.position.set(KM.fx, p0.y, KM.fz); SAHNE.yakinKamera(V.uid, KM.U, KM.aci, KM.Y, KM.bakY); b.kok.position.copy(p0);
    };
    return { kay: +sec.s.toFixed(2), dikey: +sec.vv.toFixed(2), geri: +sec.kk.toFixed(2), tasma, yazi: ty };
  }, { ilk, N, K: KAM, KH: KH || {}, yazi: !!yazi, halka: halka || null });
  // yazı taşması denetimi (son ölçüm geçişinden sonra): kadraj dışına taşan yazılar [kare, metin, taşma px]
  const yaziTasma = (ilk, N) => p.evaluate(({ ilk, N, W, H }) => {
    const out = [];
    for (let k = ilk; k < ilk + N; k++) for (const [t, x0, y0, x1, y1] of (window.__YZK[k] || [])) {
      const ts = Math.max(0 - x0, 0 - y0, x1 - W, y1 - H); if (ts > 0.5) out.push([k - ilk, t, Math.round(ts)]);
    }
    return out;
  }, { ilk, N, W, H });
  // ölçüm geçişi: aynı kurulum, seçilen kamera; çizimsiz ilerleyip 2B katmanın yazı kutularını kaydeder
  const olc = async (h, ilk, N) => {
    // kamera matrisleri yalnız çizimde güncellenir (yakinKamera konum/bakış verir): bir çizim, yoksa 2B katman eski kamerayla çizilir
    await kur(h); await p.evaluate(() => { window.__YZK = []; window.__kamKur(); SAHNE._ciz(); });
    await ilerle(ilk - 1); await ilerle(N, false, true);
  };
  // çekim: sabit kamera (kadraj); kare = WebGL tuvali + 2B üst katman (can çubukları, yazılar) aynı görevde birleştirilip JPEG döner
  // (ekran görüntüsünden çok hızlı) + döngü noktası seçimi için 96×64 küçük RGB (48×32 kahramanın poz farkını seçemiyordu)
  const cek = (n, adim) => p.evaluate(({ n, adim, K, FPS }) => {
    const V = window.__V, out = [], kucuk = [];
    const t = document.getElementById('t'), k = document.getElementById('k');
    const c = document.createElement('canvas'); c.width = K.W; c.height = K.H; const x = c.getContext('2d');
    const th = document.createElement('canvas'); th.width = 96; th.height = 64; const tx = th.getContext('2d', { willReadFrequently: true });
    for (let i = 0; i < n; i++) {
      window.__sz.t += 1000 / FPS; SAHNE.kare(1 / FPS); V.kare++;
      V.mana();   // (bulma geçişiyle aynı kural: belirlenimci yeniden oynatma)
      const b = SAHNE._bTMP(V.uid); if (!b) break;
      if (V.kare % adim) continue;
      window.__kamKur();
      SAHNE._ciz();
      x.drawImage(t, 0, 0, K.W, K.H); x.drawImage(k, 0, 0, K.W, K.H);
      out.push(c.toDataURL('image/jpeg', 0.94));
      tx.drawImage(c, 0, 0, 96, 64); const d = tx.getImageData(0, 0, 96, 64).data, a = new Array(96 * 64 * 3);
      for (let j = 0, q = 0; j < d.length; j += 4) { a[q++] = d[j]; a[q++] = d[j + 1]; a[q++] = d[j + 2]; }
      kucuk.push(a);
    }
    return { out, kucuk };
  }, { n, adim, K: KAM, FPS });
  // temiz kare (bulma geçişinden sonra, sayfada): yetenek belirteçlerinin motorda son durduğu kareden sonraki motor anı Tm; görsel zaman
  // Tm + SONUM'a ulaştığı ilk kare. Yetenek durumu yoksa pencere başı; pencere sonuna dek sürüyorsa (Işık Kanadı kalkanı) null.
  // vurT: kahramanın motor vuruş anları; gt: görsel zaman (kare başına)
  const temizlik = (ilk, NU) => p.evaluate(({ ilk, NU, SONUM }) => {
    const DZ = window.__DZ, ST = window.__ST, GT = window.__GT, son = ilk + NU - 1;
    let kirli = -1; for (let k = ilk; k <= son; k++) if (DZ[k]) kirli = k;
    let temiz = null;
    if (kirli < 0) temiz = ilk;
    else if (kirli < son) { const Tm = ST[kirli + 1]; for (let k = kirli; k <= son; k++) if (GT[k] >= Tm + SONUM) { temiz = k; break; } }
    return { temiz, kirli: kirli < 0 ? null : kirli, vurT: window.__V.vurT.slice(), gt: GT.slice(ilk, ilk + NU) };
  }, { ilk, NU, SONUM: SONUM_SN });
  // vuruş evresi (sn): görsel zamanda son motor vuruşundan bu yana geçen süre (kahramanın saldırı pozu aynı evrede aynı)
  const evre = (g, vurT) => { let e = 99; for (const t of vurT) if (t <= g + 1e-6) e = g - t; return e; };
  const sonuc = [];
  const T0 = Date.now();
  for (const h of L) {
    if (process.env.YENIDEN !== '1' && process.env.SADECE_KARE !== '1' && fs.existsSync(path.join(OUTD, h + '.mp4'))) { console.log(h, 'var, atlandı'); continue; }
    const dir = path.join(KD, h); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    await p.evaluate(() => { window.__IZ = []; window.__YZK = []; window.__NS = []; window.__DZ = []; window.__ST = []; window.__GT = []; window.__KH = []; });
    await kur(h);
    const bas = await ilerle(AZAMI_BEKLE * FPS, true);
    if (bas < 0) { console.log(h, 'YETENEK GÖRÜLMEDİ'); continue; }
    const ilk = Math.max(1, bas - Math.round(ONCE_SN * FPS)), NU = Math.round((ONCE_SN + SONRA_UZUN) * FPS);
    await ilerle(ilk + NU - bas);   // uzun pencere: konum kaydı (kadraj), yetenek durumu, görsel zaman
    // pencere: kalıcı yetenek durumu bitip görüntüsü söndükten sonra geçiş (G) + bir vuruş aralığı (evre eşleşmesi için) sığsın
    const tz = await temizlik(ilk, NU), hk = D.KAHRAMANLAR.find(o => o.id === h);
    const ara = tz.vurT.slice(1).map((t, i) => t - tz.vurT[i]).filter(x => x > 0.2).sort((a, b) => a - b), P = Math.round(FPS * (ara.length ? ara[ara.length >> 1] : 1 / hk.as));
    const N0 = Math.max(Math.round((ONCE_SN + SONRA_AZAMI) * FPS), bas - ilk + Math.round(SONRA_SN * FPS) + P + 2);
    const N = Math.min(NU, Math.max(N0, tz.temiz != null ? tz.temiz - ilk + GECIS + P + 2 : 0));
    const bk = await p.evaluate(({ bas, uid }) => window.__IZ[bas].find(o => o.uid === uid), { bas, uid: await p.evaluate(() => window.__V.uid) });
    const halka = HALKA[h] ? { ...HALKA[h], x: bk.x, y: bk.y, z: bk.z } : null;
    console.log(h, 'pencere', N, 'kare', `(${(N / FPS).toFixed(2)} sn)`, 'temiz', tz.temiz != null ? tz.temiz - ilk : 'YOK (kalıcı durum pencere sonuna dek)', 'vuruş aralığı', P);
    const kd0 = await kadraj(ilk, N, KAMH[h], false, halka);
    await olc(h, ilk, N);                                // 1. ölçüm: tahmini kameranın yazı kutuları
    const kd = await kadraj(ilk, N, KAMH[h], true, halka);
    await olc(h, ilk, N);                                // 2. ölçüm: son kamerayla denetim
    const ts = await yaziTasma(ilk, N);
    console.log(h, 'yetenek pozu karesi', bas, 'kadraj', JSON.stringify(kd0), '→', JSON.stringify(kd), ts.length ? 'TAŞAN YAZI ' + JSON.stringify(ts.slice(0, 8)) : 'yazılar içeride', `(${((Date.now() - T0) / 1000).toFixed(0)} sn)`);
    await kur(h);   // aynı kurulum, aynı adımlar: belirlenimci yeniden oynatma
    // kamera çekimden önce kurulur ve matrisleri bir çizimle güncellenir: kare() can çubuklarını, yazıları (2B katman) ve görüş alanı
    // denetimini o anki kamerayla yapar (yoksa ilk karenin çubukları önceki kahramanın kamerasına göre kayık çıkıyordu)
    await p.evaluate(() => { window.__kamKur(); SAHNE._ciz(); });
    await ilerle(ilk - 1);
    const ADIM = +(process.env.ADIM || 1);   // önizleme: yalnız her ADIM'ıncı kare
    let sira = 0; const kucuk = [];   // 15'erli parçalar (bellek: tek seferde 100+ JPEG dönmesin)
    for (let i = 0; i < N; i += 15) {
      const r = await cek(Math.min(15, N - i), ADIM);
      for (const url of r.out) fs.writeFileSync(path.join(dir, `k${String(sira++).padStart(3, '0')}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
      kucuk.push(...r.kucuk);
    }
    const yet = await p.evaluate(() => window.__V.yet);
    console.log(h, 'kareler', sira, 'yetenek', yet, `(${((Date.now() - T0) / 1000).toFixed(0)} sn)`);
    if (!yet) { console.log(h, 'YAKALAMADA YETENEK YOK — video üretilmedi'); continue; }
    if (ADIM !== 1) continue;
    // döngü: başlangıç kaydırması S ve bitiş Lb birlikte. Geçiş çiftleri (Lb−G+i ↔ S+i) temiz karelerde (kalıcı durum sönmüş); maliyet =
    // çiftlerin 96×64 farkı + 0,5 × vuruş evresi farkı (kare, en çok 15) + 1,5 × dikiş adımı farkı (S+G−1 → S+G) + 0,01 × uzunluk.
    // Vuruş evresi: vuruştan sonraki AKT sn (darbe ve toparlanma) ya da sonraki vuruştan önceki HAZ sn (kurulma) eşleşmeli; ikisi de
    // arada (boşta duruş) ise evre farkı yok (yavaş vuranda döngü bir vuruş aralığı gereksiz uzamasın)
    const G = GECIS, FM = new Map(), fark = (i, j) => { const ky = i * 4096 + j; let v = FM.get(ky); if (v !== undefined) return v;
      const a = kucuk[i], b = kucuk[j]; let s = 0; for (let q = 0; q < a.length; q++) s += Math.abs(a[q] - b[q]); v = s / a.length; FM.set(ky, v); return v; };
    const Ps = P / FPS, AKT = Math.min(0.9, 0.55 * Ps), HAZ = 0.4;
    const evD = (i) => { const e = evre(tz.gt[i], tz.vurT); return e < AKT ? e : e > Ps - HAZ && e < Ps + 0.5 ? e - Ps : null; };
    const evF = (i, j) => { const a = evD(i), b = evD(j); if (a === null && b === null) return 0; if (a === null || b === null) return 15; return Math.min(15, Math.abs(a - b) * FPS); };
    const Smax = Math.max(0, bas - ilk - G - ONDE_PAY), Lmin0 = Math.min(sira, bas - ilk + Math.round(SONRA_SN * FPS));
    const Lmin = Math.min(sira, Math.max(Lmin0, tz.temiz != null ? tz.temiz - ilk + G : 0));
    let sec = null;
    for (let S = 0; S <= Smax; S++) {
      const dk = fark(S + G - 1, S + G);
      for (let Lc = Math.max(Lmin, S + 3 * G); Lc <= sira; Lc++) {
        let im = 0; for (let i = 0; i < G; i++) im += fark(Lc - G + i, S + i); im /= G;
        let de = 0; for (let i = 0; i < G; i += 3) de = Math.max(de, evF(Lc - G + i, S + i));
        const m = im + 0.5 * de + 1.5 * dk + 0.01 * (Lc - Lmin);
        if (!sec || m < sec.m) sec = { S, Lb: Lc, m, im, de, dk };
      }
    }
    const { S, Lb } = sec, nV = Lb - S - G;
    console.log(h, 'döngü: S', S, 'bitiş', Lb, `(${(nV / FPS).toFixed(2)} sn video)`, 'geçiş farkı', sec.im.toFixed(2), 'evre farkı', sec.de.toFixed(1), 'kare',
      'dikiş adımı', sec.dk.toFixed(2), 'temiz', tz.temiz != null ? tz.temiz - ilk : null, 'en erken bitiş', Lmin);
    fs.writeFileSync(path.join(dir, 'dongu.json'), JSON.stringify({ ilk, bas: bas - ilk, N, temiz: tz.temiz != null ? tz.temiz - ilk : null, P, S, Lb, G, kare: nV, ...sec, Lmin, gt: tz.gt.slice(0, sira), vurT: tz.vurT }) + '\n');
    if (process.env.SADECE_KARE === '1') continue;   // kareler + döngü seçimi (dongu.json), kodlama yok
    // döngü: kareler S+G..Lb−G−1 düz; son G kare (Lb−G..Lb−1) S..S+G−1 ile (i+1)/G ağırlığıyla karışır: son kare = kare S+G−1, videonun
    // başı kare S+G → başa sarış iki ardışık kare (dikişsiz)
    const fc = `[0:v]format=yuv444p,split=3[s0][s1][s2];[s0]trim=start_frame=${S + G}:end_frame=${Lb - G},setpts=PTS-STARTPTS[gov];` +
      `[s1]trim=start_frame=${Lb - G}:end_frame=${Lb},setpts=PTS-STARTPTS[son];[s2]trim=start_frame=${S}:end_frame=${S + G},setpts=PTS-STARTPTS[bas];` +
      `[son][bas]blend=all_expr='A+(B-A)*min(1,(N+1)/${G})'[gec];[gov][gec]concat=n=2:v=1:a=0,format=yuv420p[v]`;
    const gir = ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, 'k%03d.jpg'), '-filter_complex', fc, '-map', '[v]', '-r', String(FPS)];
    // H.264 (iOS): tek anahtar kare (yalnız ilk kare I), B-kare yok, I/P nitelik oranı 1, mbtree kapalı → son kare ilk kareyle aynı
    // nitelikte (döngüde nitelik sıçraması yok); crf 14, film ayarı (ince doku korunur). Ölçüm (çözülmüş video, son→ilk kare farkı /
    // ardışık kare farkı ortancası): eski crf 26 ile 1,9–3,2; bununla 0,9–1,05
    const mp4 = path.join(OUTD, h + '.mp4');
    execFileSync('/usr/bin/ffmpeg', [...gir, '-c:v', 'libx264', '-profile:v', 'main', '-preset', 'slow', '-crf', CRF, '-bf', '0', '-g', String(nV + 10), '-keyint_min', String(nV + 10),
      '-sc_threshold', '0', '-tune', 'film', '-x264-params', 'ipratio=1.0:pbratio=1.0:mbtree=0', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', mp4]);
    // WebM (VP9) yedeği: H.264 çözücüsü olmayan tarayıcılar (ör. Chromium) için; aynı kare dizisinden (mp4'ten yeniden kodlanmaz), tek anahtar kare
    const webm = path.join(OUTD, h + '.webm');
    execFileSync('/usr/bin/ffmpeg', [...gir, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', CRF_VP9, '-g', '9999', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '1', '-pix_fmt', 'yuv420p', '-an', webm]);
    const kb = Math.round(fs.statSync(mp4).size / 1024), kbw = Math.round(fs.statSync(webm).size / 1024);
    sonuc.push([h, kb, kbw, nV]); console.log(h, 'mp4', kb, 'KB · webm', kbw, 'KB ·', nV, 'kare');
  }
  // liste.json: var olan videolar (arayuz.js 404 yerine buna bakar; web_paket.cjs de yeniden yazar)
  if (process.env.SADECE_KARE !== '1') {   // yalnız kare çekiminde video klasörüne dokunulmaz
    const l = fs.readdirSync(OUTD).filter(f => f.endsWith('.mp4')).map(f => f.slice(0, -4)).sort();
    fs.writeFileSync(path.join(OUTD, 'liste.json'), JSON.stringify(l) + '\n');
  }
  console.log(JSON.stringify(sonuc));
  await br.close();
})();
