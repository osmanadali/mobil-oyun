// Kahraman ayrıntı kartındaki YETENEK ÖNİZLEME videolarını önceden üretir (web/arayuz/yetenek/<id>.mp4 + liste.json).
// Kullanım (kut/ klasöründen; sunucu 8092'de açık olmalı: python3 -m http.server 8092):
//   node tools/yetenek_video.cjs                 → 16 kahramanın hepsi
//   node tools/yetenek_video.cjs golem,anka      → yalnız seçilenler
//   Çıktı: web/arayuz/yetenek/<id>.mp4 (H.264, iOS) + <id>.webm (VP9 yedeği) + liste.json
//   Var olan <id>.mp4 atlanır (YENIDEN=1 hepsini yeniden üretir).
//   ORTAM: KARE_DIR=<geçici kare klasörü> (varsayılan /tmp/kut_yetvid), HAFIF=1 (gölgesiz, hızlı), SADECE_KARE=1 (ffmpeg yok)
// Gerekenler: playwright (chromium, SwiftShader WebGL), /usr/bin/ffmpeg.
// Akış: test3d.html?elle=1 sahnesinde KUT_SIM.Savas ile kahraman (taraf 0, ön sıra) + 2 rakip kurulur; rakiplerin manası
// erişilmez yapılır (yalnız gösterilen yetenek görünsün), kahraman ilk vuruşunu yapınca manası doldurulur (sunum: motor
// dosyaları değişmez, yalnız bu sim nesnesinin alanı). Sahne SAHNE.kare(1/30) ile sabit adımla ilerletilir (belirlenimci),
// yetenek pozunun başlangıcından ÖNCE_SN önce ile SONRA_SN sonra arası 480×320 kare kare yakalanır; kamera kahramana
// 3/4 açıdan, rakipleri de kadraja alan orta plan. ffmpeg: başta/sonda kısa çapraz geçişli döngü, H.264 yuv420p crf 26 faststart.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const KUT = path.join(__dirname, '..'), OUTD = path.join(KUT, 'web', 'arayuz', 'yetenek');
const D = require(path.join(KUT, 'data.js'));
const TUM = D.KAHRAMANLAR.map(h => h.id);
const L = (process.argv[2] ? process.argv[2].split(',') : TUM).filter(h => TUM.includes(h));
const KD = process.env.KARE_DIR || '/tmp/kut_yetvid', HAFIF = process.env.HAFIF === '1';
// kamera ayarı: KAM_ON (önden bakış payı), KAM_UZAK, KAM_Y
const KAM = { on: +(process.env.KAM_ON || 0.55), uzak: +(process.env.KAM_UZAK || 4.8), y: +(process.env.KAM_Y || 2.2), W: 480, H: 320 };
const W = 480, H = 320, FPS = 30, ONCE_SN = 0.5, SONRA_SN = 2.6, AZAMI_BEKLE = 8;
// rakipler: menzilli iki kahraman (yerinden kımıldamaz, kahramanla kamera arasına yürümez), karşı ön sırada aynı sütun (1) ve
// kameradan uzak sütunda orta sıra (0); kamera +x yanında. Yakın dövüşçü kahraman onlara yürür, menzilli kahraman yerinden atar.
const RAKIP = (h) => { const l = ['yilan', 'kurbaga', 'ruzgar'].filter(x => x !== h); return [{ h: l[0], s: 2, x: 1, y: 0 }, { h: l[1], s: 2, x: 0, y: 1 }]; };
(async () => {
  fs.mkdirSync(OUTD, { recursive: true });
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const p = await br.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  p.setDefaultTimeout(200000);
  p.on('pageerror', e => console.log('HATA', e.message));
  // belirlenimci zaman: performance.now kare başına sabit 1/FPS ilerler (gerçek saate bağlı görsel hesaplar CPU yükünden bağımsız;
  // iki geçiş — yetenek anını bulma ve yakalama — aynı kareleri üretir)
  await p.addInitScript(() => { const ger = performance.now.bind(performance); window.__sz = { aktif: false, t: 0 }; performance.now = () => window.__sz.aktif ? window.__sz.t : ger(); });
  await p.goto(`http://localhost:8092/web/test3d.html?elle=1${HAFIF ? '&hafif=1' : ''}&a=golem&b=golem&tohum=7`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await p.waitForFunction(() => window.HAZIR, null, { timeout: 240000 });
  // ilerletirken çizim yok (yalnız yakalanan karede _ciz): SwiftShader'da 2–3 kat hızlı
  await p.evaluate(() => { if (SAHNE._cizAtla) SAHNE._cizAtla(true); window.__sz.t = performance.now(); window.__sz.aktif = true; });
  const kur = (h) => p.evaluate(async ({ h, rakip }) => {
    const sim = KUT_SIM.Savas([{ h, s: 1, x: 1, y: 0 }], rakip, { tohum: 7, alamet: 'yok' });
    for (const u of sim.birimler) if (u.taraf === 1) { u.mana = 1e9; u.mp = 0; }
    await SAHNE.savasKur(sim);
    const u = sim.birimler.find(o => o.taraf === 0);
    window.__V = { sim, u, uid: u.uid, dolu: false, kare: 0, kam: null, yet: 0 };
    const ad0 = sim.adim.bind(sim); sim.adim = () => { ad0(); for (const f of sim.fx) if (f.tip === 'yetenek' && f.u === u.uid) window.__V.yet++; };
  }, { h, rakip: RAKIP(h) });
  // n kare ilerlet (ekran görüntüsü yok); bul: yetenek pozunun ilk karesinde dur
  const ilerle = (n, bul = false) => p.evaluate(({ n, bul, FPS }) => {
    const V = window.__V;
    for (let i = 0; i < n; i++) {
      window.__sz.t += 1000 / FPS; SAHNE.kare(1 / FPS); V.kare++;
      if (!V.dolu && V.u.ilkVurusYapildi) { V.u.mp = V.u.mana; V.dolu = true; }   // ilk vuruştan sonra mana dolu → yetenek hemen
      const b = SAHNE._bTMP(V.uid);
      // görsel yetenek başlangıcı: yetenek pozu ya da hücum kayması (Bulut Hücumu); yedek: motor manayı harcadıktan 0,5 sn sonra
      if (bul && V.dolu && b && (b.durum === 'yetenek' || b.kay)) return V.kare;
      if (bul && V.dolu && V.u.mp < V.u.mana * 0.5 && V.harca == null) V.harca = V.kare;
      if (bul && V.harca != null && V.kare - V.harca >= 15) return V.kare;
    }
    return bul ? -1 : V.kare;
  }, { n, bul, FPS });
  // kamera (sayfada): kahraman solda, rakipler sağda; bakış kahraman→rakip ortası doğrultusuna dik, biraz önden (3/4).
  // Doğrultu ve odak çekimin ilk karesinde belirlenir, sonra odak yavaşça izler (döngü için sakin kamera).
  // Kare: WebGL tuvali + 2B üst katman (can çubukları, yazılar) aynı görevde birleştirilip JPEG döner (ekran görüntüsünden çok hızlı).
  const cek = (n, adim) => p.evaluate(({ n, adim, K, FPS }) => {
    const V = window.__V, out = [];
    const t = document.getElementById('t'), k = document.getElementById('k');
    const c = document.createElement('canvas'); c.width = K.W; c.height = K.H; const x = c.getContext('2d');
    for (let i = 0; i < n; i++) {
      window.__sz.t += 1000 / FPS; SAHNE.kare(1 / FPS); V.kare++;
      // ilk vuruş yakalama penceresine düşerse de mana dolsun (yoksa yetenek hiç gelmez: eski golem önizlemesinde Kaya Fırlat yoktu)
      if (!V.dolu && V.u.ilkVurusYapildi) { V.u.mp = V.u.mana; V.dolu = true; }
      const b = SAHNE._bTMP(V.uid); if (!b) break;
      const rk = V.sim.birimler.filter(o => o.taraf === 1).map(o => SAHNE._bTMP(o.uid)).filter(Boolean);
      const p0 = b.kok.position.clone(); let rx = p0.x, rz = p0.z - 2;
      if (rk.length) { rx = 0; rz = 0; for (const r of rk) { rx += r.kok.position.x; rz += r.kok.position.z; } rx /= rk.length; rz /= rk.length; }
      const fx = p0.x * 0.55 + rx * 0.45, fz = p0.z * 0.55 + rz * 0.45;
      if (!V.kam) {
        // doğrultu: en yakın rakip (yakın dövüşçünün hedefi) → kahramanla hedef arasına kimse girmez
        let en = null, ed = 1e9; for (const r of rk) { const d = Math.hypot(r.kok.position.x - p0.x, r.kok.position.z - p0.z); if (d < ed) { ed = d; en = r; } }
        let dx = (en ? en.kok.position.x : rx) - p0.x, dz = (en ? en.kok.position.z : rz) - p0.z; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
        const ox = -dz + dx * K.on, oz = dx + dz * K.on;   // ekranın sağı = rakip doğrultusu; K.on: önden bakış payı
        V.kam = { aci: Math.atan2(ox, oz), fx, fz };
      } else { V.kam.fx += (fx - V.kam.fx) * 0.06; V.kam.fz += (fz - V.kam.fz) * 0.06; }
      if (i % adim) continue;
      const v = b.kok.userData.vfxBoy || 1.3, o = 0.7 + 0.3 * v / 1.3;   // büyük gövdede kamera geri çekilir
      b.kok.position.set(V.kam.fx, p0.y, V.kam.fz);
      SAHNE.yakinKamera(V.uid, K.uzak * o, V.kam.aci, K.y * o, 0.6 * o);
      b.kok.position.copy(p0);
      SAHNE._ciz();
      x.drawImage(t, 0, 0, K.W, K.H); x.drawImage(k, 0, 0, K.W, K.H);
      out.push(c.toDataURL('image/jpeg', 0.94));
    }
    return out;
  }, { n, adim, K: KAM, FPS });
  const sonuc = [];
  const T0 = Date.now();
  for (const h of L) {
    if (process.env.YENIDEN !== '1' && process.env.SADECE_KARE !== '1' && fs.existsSync(path.join(OUTD, h + '.mp4'))) { console.log(h, 'var, atlandı'); continue; }
    const dir = path.join(KD, h); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    await kur(h);
    const bas = await ilerle(AZAMI_BEKLE * FPS, true);
    if (bas < 0) { console.log(h, 'YETENEK GÖRÜLMEDİ'); continue; }
    console.log(h, 'yetenek pozu karesi', bas, `(${((Date.now() - T0) / 1000).toFixed(0)} sn)`);
    await kur(h);   // aynı kurulum, aynı adımlar: belirlenimci yeniden oynatma
    const ilk = Math.max(1, bas - Math.round(ONCE_SN * FPS)), N = Math.round((ONCE_SN + SONRA_SN) * FPS);
    await ilerle(ilk - 1);
    const ADIM = +(process.env.ADIM || 1);   // önizleme: yalnız her ADIM'ıncı kare
    let sira = 0;   // 15'erli parçalar (bellek: tek seferde 90+ JPEG dönmesin)
    for (let i = 0; i < N; i += 15) {
      const kareler = await cek(Math.min(15, N - i), ADIM);
      for (const url of kareler) fs.writeFileSync(path.join(dir, `k${String(sira++).padStart(3, '0')}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
    }
    const yet = await p.evaluate(() => window.__V.yet);
    console.log(h, 'kareler', N, 'yetenek', yet, `(${((Date.now() - T0) / 1000).toFixed(0)} sn)`);
    if (!yet) { console.log(h, 'YAKALAMADA YETENEK YOK — video üretilmedi'); continue; }
    if (process.env.SADECE_KARE === '1') continue;
    const mp4 = path.join(OUTD, h + '.mp4'), X = 0.4, sure = N / FPS;
    // döngü: videonun sonu ilk X sn ile çapraz geçer (son kare → ilk kare dikişsiz)
    execFileSync('/usr/bin/ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, 'k%03d.jpg'),
      '-filter_complex', `[0:v]split[a][b];[a]trim=start=${X},setpts=PTS-STARTPTS[gov];[b]trim=0:${X},setpts=PTS-STARTPTS[bas];[gov][bas]xfade=transition=fade:duration=${X}:offset=${(sure - 2 * X).toFixed(3)},format=yuv420p[v]`,
      '-map', '[v]', '-c:v', 'libx264', '-profile:v', 'main', '-preset', 'slow', '-crf', '26', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', mp4]);
    // WebM (VP9) yedeği: H.264 çözücüsü olmayan tarayıcılar (ör. Chromium) için; iOS mp4'ü oynatır
    const webm = path.join(OUTD, h + '.webm');
    execFileSync('/usr/bin/ffmpeg', ['-y', '-loglevel', 'error', '-i', mp4, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '40', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-an', webm]);
    const kb = Math.round(fs.statSync(mp4).size / 1024), kbw = Math.round(fs.statSync(webm).size / 1024);
    sonuc.push([h, kb, kbw]); console.log(h, 'mp4', kb, 'KB · webm', kbw, 'KB');
  }
  // liste.json: var olan videolar (arayuz.js 404 yerine buna bakar; web_paket.cjs de yeniden yazar)
  const l = fs.readdirSync(OUTD).filter(f => f.endsWith('.mp4')).map(f => f.slice(0, -4)).sort();
  fs.writeFileSync(path.join(OUTD, 'liste.json'), JSON.stringify(l) + '\n');
  console.log(JSON.stringify(sonuc));
  await br.close();
})();
