// Kahraman ayrıntı kartındaki YETENEK ÖNİZLEME videolarını önceden üretir (web/arayuz/yetenek/<id>.mp4 + liste.json).
// Kullanım (kut/ klasöründen; sunucu 8092'de açık olmalı: python3 -m http.server 8092; başka kapı: PORT=<kapı>):
//   node tools/yetenek_video.cjs                 → 16 kahramanın hepsi
//   node tools/yetenek_video.cjs golem,anka      → yalnız seçilenler
//   Çıktı: web/arayuz/yetenek/<id>.mp4 (H.264, iOS) + <id>.webm (VP9 yedeği) + liste.json
//   Var olan <id>.mp4 atlanır (YENIDEN=1 hepsini yeniden üretir).
//   ORTAM: KARE_DIR=<geçici kare klasörü> (varsayılan /tmp/kut_yetvid), HAFIF=1 (gölgesiz, hızlı), SADECE_KARE=1 (ffmpeg yok),
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
// Döngü: kareler ONCE_SN + SONRA_AZAMI boyunca yakalanır; videonun sonu ilk GECIS karesiyle çapraz geçer. Bitiş noktası
// [SONRA_SN, SONRA_AZAMI] aralığında, geçiş kare çiftlerinin (son GECIS kare ↔ ilk GECIS kare) farkı en küçük olacak biçimde seçilir
// (kahramanın vuruş döngüsü başlangıçtakiyle aynı evrede: çift görüntü yok). Geçiş ağırlığı (i+1)/GECIS: son kare TAMAMEN
// başlangıç görüntüsüdür (eskiden xfade son karede ~%8–15 bitiş görüntüsü bırakıyordu, döngü başında tek karede siliniyordu).
// Yer değiştiren yetenekler (Kasırga: rakipler geri itilir; Bulut Hücumu: at en arka rakibe atılır) için DONUS: etki bittikten sonra
// ilgili birimler motor nesnesinde yumuşakça yetenek öncesi yerlerine döner (rakipler toparlanıp yerine yürür; at kurbağanın önünden
// dolanıp ilk hedefine döner) → bitiş görüntüsü başlangıçla aynı düzende, geçişte hayalet yok.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const KUT = path.join(__dirname, '..'), OUTD = path.join(KUT, 'web', 'arayuz', 'yetenek');
const D = require(path.join(KUT, 'data.js'));
const TUM = D.KAHRAMANLAR.map(h => h.id);
const L = (process.argv[2] ? process.argv[2].split(',') : TUM).filter(h => TUM.includes(h));
const KD = process.env.KARE_DIR || '/tmp/kut_yetvid', HAFIF = process.env.HAFIF === '1';
// kamera ayarı: KAM_ON (önden bakış payı), KAM_UZAK, KAM_Y
const KAM = { on: +(process.env.KAM_ON || 0.55), uzak: +(process.env.KAM_UZAK || 4.8), y: +(process.env.KAM_Y || 2.2), W: 480, H: 320 };
// SONRA_SN: bitiş noktasının en erken yeri, SONRA_AZAMI: en geç (yakalama penceresi); GECIS: döngü çapraz geçişi (kare)
const W = 480, H = 320, FPS = 30, ONCE_SN = 0.5, SONRA_SN = 2.5, SONRA_AZAMI = 3.1, GECIS = 12, AZAMI_BEKLE = 10;
// mana doldurma: savaş başından en erken BEKLE_SN sonra, son (motor) vuruşundan SUKUN_SN sonra
const BEKLE_SN = 2.2, SUKUN_SN = 1.1;
// Sahne yerleşimi (yalnız bu betiğin sim nesnesi; arena birimi: ızgara sütunu x = 0,75 + 1,5·sütun, taraf 0 ön sıra y = 5, taraf 1
// ön sıra y = 3, orta sıra 2). Kamera her kahramanda +x yanında (gök hep gün batımı tarafı).
// Rakipler: menzilli iki kahraman (saldırmaz, yürümez): karşı ön sırada kahramanın sütunu (1) ve onun sol arka çaprazı (1,17 / 2,28).
// Eski ikinci yer (0. sütun orta sıra: 0,75 / 2) kameradan bakınca yanal olarak çok açıktı: kahraman ile iki rakip kadraja sığmıyor,
// ikinci rakip (kurbağa) sağ kenarda yarım kesiliyordu (Yıldırım, Kül Doğuşu, Gölge Ok, Ayaz, Ocak); yeni yer ~1 birim yakın, öndeki
// rakibin ardında kalmaz, alan yetenekleri (Kül Doğuşu, Kasırga, Buz Nefesi: 1,6 hücre) ikisine de değer.
// Kor Halkası (2,2 hücre, kahramanın çevresi): kahraman biraz öne (4,3), kurbağa (1,35 / 2,6): halka iki rakibi de yakar.
// Bulut Hücumu: öndeki kurbağa (ilk vuruş), en arka rakip yılan kurbağanın epey ardında (aynalı: 3,95 / 0,75). At yılanın önüne
// (y + 0,8) iner: kameradan bakınca kurbağanın yanında, onunla iç içe değil (eski yerde at kurbağanın önüne, yüzüne biniyordu).
const RAKIP_SIRA = { bulutat: ['kurbaga', 'yilan'] };   // [öndeki, ikinci]
// Zümrüt Zehri (kamera hafif arkadan): ikinci rakip (rüzgâr) kurbağanın ardında kalıyordu → biraz kameraya ve sağa (1,6 / 1,8)
const RAKIP2 = { bulutat: [2.05, 0.75], kurt: [1.0, 2.55], kugu: [1.0, 2.55], kurbaga: [1.0, 2.55], semender: [1.35, 2.6], yilan: [1.6, 1.8] };   // ikinci rakibin yeri
const RAKIP = (h) => {
  const l = (RAKIP_SIRA[h] || ['yilan', 'kurbaga', 'ruzgar']).filter(x => x !== h);
  return [{ h: l[0], s: 2, x: 1, y: 0 }, { h: l[1], s: 2, x: 0, y: 1, p: h in RAKIP2 ? RAKIP2[h] : [1.17, 2.28] }];
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
// Bulut Hücumu: daha yandan (on 0,15: hücum ekranda soldan sağa okunur).
// Zümrüt Zehri: hedef kurbağa önden bakışta kameraya en yakın birim olup kadrajın ortasını kaplıyordu, yılan küçük kalıyordu →
// kamera hafif kahramanın ardından (on −0,1) ve odak kahramana yakın: yılan öne, kurbağa geriye düşer.
const KAMH = { bulutat: { on: 0.15, uzak: 1.12, y: 1.08 }, yilan: { on: -0.1, odak: 0.35 } };
// DONUS: yer değiştiren yeteneklerde birimler etkiden sonra yetenek öncesi yerlerine döner (döngü dikişi). bas: yetenek olayından sonra
// başlama (motor sn), sure: dönüş süresi, kavis: yolun ortasındaki yana sapma (arena birimi; at kurbağanın içinden geçmesin, kamera
// yanından dolansın). kim: 'rakip' (bütün rakipler) | 'kahraman'.
const DONUS = { ruzgar: { kim: 'rakip', bas: 1.25, sure: 0.8 }, bulutat: { kim: 'kahraman', bas: 1.15, sure: 0.95, kavis: [0.95, 0] } };
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
  return { a, b, yarali: YARALI[h] || 0, donus: DONUS[h] || null, menzil: MENZIL[h] || 0 };
}
(async () => {
  fs.mkdirSync(OUTD, { recursive: true });
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
      window.__vfxNes = r.children.filter(o => AD.includes(o.name)); window.__kutu = window.__kutu || new THREE.Box3(); }
    const V = window.__V = { sim, u, uid: u.uid, dolu: false, kare: 0, yet: 0, yetT: null, on: null, donus: dz.donus, donBas: null, donBitti: false, vurSon: -1, vurK: 0 };
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
    const ad0 = sim.adim.bind(sim);
    sim.adim = () => {
      const once = V.yetT == null ? sim.birimler.map(o => [o.x, o.y]) : null;
      ad0();
      for (const [d, x, y] of civi) { d.x = x; d.y = y; }
      for (const f of sim.fx) if (f.tip === 'yetenek' && f.u === u.uid) { V.yet++; if (V.yetT == null) { V.yetT = sim.t; V.on = once; } }
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
  const kadraj = (ilk, N, KH, yazi) => p.evaluate(async ({ ilk, N, K, KH, yazi }) => {
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
      for (let i = 0; i < nk.length; i++) {
        const n = nk[i], a = izd(c, n[0], n[1], n[2]);
        if (a[2] < 0.5 || a[0] - n[3] < n[7] || a[0] + n[4] > K.W - n[7] || a[1] - n[5] < n[8] || a[1] + n[6] > K.H - n[8]) {
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
  }, { ilk, N, K: KAM, KH: KH || {}, yazi: !!yazi });
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
  // (ekran görüntüsünden çok hızlı) + döngü noktası seçimi için 48×32 küçük RGB
  const cek = (n, adim) => p.evaluate(({ n, adim, K, FPS }) => {
    const V = window.__V, out = [], kucuk = [];
    const t = document.getElementById('t'), k = document.getElementById('k');
    const c = document.createElement('canvas'); c.width = K.W; c.height = K.H; const x = c.getContext('2d');
    const th = document.createElement('canvas'); th.width = 48; th.height = 32; const tx = th.getContext('2d', { willReadFrequently: true });
    for (let i = 0; i < n; i++) {
      window.__sz.t += 1000 / FPS; SAHNE.kare(1 / FPS); V.kare++;
      V.mana();   // (bulma geçişiyle aynı kural: belirlenimci yeniden oynatma)
      const b = SAHNE._bTMP(V.uid); if (!b) break;
      if (V.kare % adim) continue;
      window.__kamKur();
      SAHNE._ciz();
      x.drawImage(t, 0, 0, K.W, K.H); x.drawImage(k, 0, 0, K.W, K.H);
      out.push(c.toDataURL('image/jpeg', 0.94));
      tx.drawImage(c, 0, 0, 48, 32); const d = tx.getImageData(0, 0, 48, 32).data, a = new Array(48 * 32 * 3);
      for (let j = 0, q = 0; j < d.length; j += 4) { a[q++] = d[j]; a[q++] = d[j + 1]; a[q++] = d[j + 2]; }
      kucuk.push(a);
    }
    return { out, kucuk };
  }, { n, adim, K: KAM, FPS });
  const sonuc = [];
  const T0 = Date.now();
  for (const h of L) {
    if (process.env.YENIDEN !== '1' && process.env.SADECE_KARE !== '1' && fs.existsSync(path.join(OUTD, h + '.mp4'))) { console.log(h, 'var, atlandı'); continue; }
    const dir = path.join(KD, h); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    await p.evaluate(() => { window.__IZ = []; window.__YZK = []; window.__NS = []; });
    await kur(h);
    const bas = await ilerle(AZAMI_BEKLE * FPS, true);
    if (bas < 0) { console.log(h, 'YETENEK GÖRÜLMEDİ'); continue; }
    const ilk = Math.max(1, bas - Math.round(ONCE_SN * FPS)), N = Math.round((ONCE_SN + SONRA_AZAMI) * FPS);
    await ilerle(ilk + N - bas);   // pencerenin kalanı: konum kaydı (kadraj)
    const kd0 = await kadraj(ilk, N, KAMH[h], false);
    await olc(h, ilk, N);                                // 1. ölçüm: tahmini kameranın yazı kutuları
    const kd = await kadraj(ilk, N, KAMH[h], true);
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
    if (process.env.SADECE_KARE === '1' || ADIM !== 1) continue;
    // döngü noktası: bitiş Lb ∈ [ONCE+SONRA_SN, ONCE+SONRA_AZAMI] sn; maliyet = son GECIS kare ile ilk GECIS karenin ortalama farkı
    const G = GECIS, fark = (a, b) => { let s = 0; for (let j = 0; j < a.length; j++) s += Math.abs(a[j] - b[j]); return s / a.length; };
    let Lb = sira, eb = Infinity; const ml = [];
    for (let Lc = Math.round((ONCE_SN + SONRA_SN) * FPS); Lc <= sira; Lc++) {
      let s = 0; for (let i = 0; i < G; i++) s += fark(kucuk[Lc - G + i], kucuk[i]); s /= G; ml.push([Lc, +s.toFixed(2)]);
      if (s < eb - 1e-9) { eb = s; Lb = Lc; }
    }
    console.log(h, 'döngü: bitiş karesi', Lb, `(${((Lb - G) / FPS).toFixed(2)} sn video)`, 'geçiş farkı', eb.toFixed(2), 'adaylar', JSON.stringify(ml.filter((_, i) => i % 3 === 0)));
    const mp4 = path.join(OUTD, h + '.mp4');
    // döngü: kareler G..Lb−G−1 düz; son G kare (Lb−G..Lb−1) ilk G kareyle (0..G−1) (i+1)/G ağırlığıyla karışır: son kare = kare G−1,
    // videonun başı kare G → başa sarış iki ardışık kare (dikişsiz)
    const fc = `[0:v]format=yuv444p,split=3[s0][s1][s2];[s0]trim=start_frame=${G}:end_frame=${Lb - G},setpts=PTS-STARTPTS[gov];` +
      `[s1]trim=start_frame=${Lb - G}:end_frame=${Lb},setpts=PTS-STARTPTS[son];[s2]trim=start_frame=0:end_frame=${G},setpts=PTS-STARTPTS[bas];` +
      `[son][bas]blend=all_expr='A+(B-A)*min(1,(N+1)/${G})'[gec];[gov][gec]concat=n=2:v=1:a=0,format=yuv420p[v]`;
    execFileSync('/usr/bin/ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, 'k%03d.jpg'),
      '-filter_complex', fc, '-map', '[v]', '-r', String(FPS), '-c:v', 'libx264', '-profile:v', 'main', '-preset', 'slow', '-crf', '26', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', mp4]);
    // WebM (VP9) yedeği: H.264 çözücüsü olmayan tarayıcılar (ör. Chromium) için; iOS mp4'ü oynatır
    const webm = path.join(OUTD, h + '.webm');
    execFileSync('/usr/bin/ffmpeg', ['-y', '-loglevel', 'error', '-i', mp4, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '40', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-an', webm]);
    const kb = Math.round(fs.statSync(mp4).size / 1024), kbw = Math.round(fs.statSync(webm).size / 1024);
    sonuc.push([h, kb, kbw, Lb - G]); console.log(h, 'mp4', kb, 'KB · webm', kbw, 'KB ·', Lb - G, 'kare');
  }
  // liste.json: var olan videolar (arayuz.js 404 yerine buna bakar; web_paket.cjs de yeniden yazar)
  const l = fs.readdirSync(OUTD).filter(f => f.endsWith('.mp4')).map(f => f.slice(0, -4)).sort();
  fs.writeFileSync(path.join(OUTD, 'liste.json'), JSON.stringify(l) + '\n');
  console.log(JSON.stringify(sonuc));
  await br.close();
})();
