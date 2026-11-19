#!/usr/bin/env node
/* Kut Arena — donuk kemik denetimi (yalnız görüntü; motora dokunmaz).
   Her kahraman (canavarlar bu modelleri kullanır) gerçek sahne3d.js boru hattında savaştırılır; her karede her kemiğin
   YEREL dönüşü (ebeveynine göre) ve gövdeye (Hips/kök) göre dönüşü örneklenir. Duruma (bekle, yuru, saldir, yetenek, zafer,
   olum) göre her kemiğin, uzvun gövdeye bağlandığı kemiğe (kol → göğüs, bacak → kalça, kuyruk → omurga) göre hareket genliği (derece) çıkarılır ve şu durumlar işaretlenir:
     DONUK   — büyük uzuv (kol, ön kol, el, baş, kanat, kuyruk, bacak) bir durumda < ESIK_DONUK derece oynuyor,
               ama aynalı eşi (sol↔sağ) ya da durumun geneli belirgin oynuyor
     ASIMETRI — sol/sağ eşlerinden biri diğerinin %25'inden az oynuyor (iki ayaklıda tek elle büyü klipleri hariç tutulmaz:
               uyarı olarak gösterilir)
   Kullanım:  (sunucu)  cd kut && python3 -m http.server 8092
              node tools/kemik_denetim.cjs [--port 8092] [--a kurbaga,golem] [--sn 22] [--json cikti.json]
   Çıkış kodu: DONUK bulgu varsa 1. */
const { chromium } = require('playwright');
const fs = require('fs');
const arg = (ad, vars) => { const i = process.argv.indexOf('--' + ad); return i > 0 ? process.argv[i + 1] : vars; };
const PORT = +arg('port', 8092), KOK = arg('kok', 'web'), SURE = +arg('sn', 24), JSON_CIKTI = arg('json', null);
const HEPSI = ['golem', 'kurbaga', 'yarasa', 'ruzgar', 'kugu', 'ayi', 'anka', 'baykus', 'tilki', 'ejder', 'kurt', 'koc', 'kaplumbaga', 'semender', 'bulutat', 'yilan'];
const SECIM = (arg('a', '') || '').split(',').filter(Boolean);
const LISTE = SECIM.length ? SECIM : HEPSI;
const ESIK_DONUK = 1.5, ESIK_ES = 6;

// sayfa içinde koşan ölçüm (S3 = sahne3d modülü)
async function denetle(takimA, takimB) {
  // her grup kendi tarayıcısında (yazılım GPU'sunda önceki sahnenin artıkları yeni sayfanın yüklenmesini bekletmesin)
  const tarayici = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const sayfa = await tarayici.newPage({ viewport: { width: 1180, height: 760 } });
  sayfa.on('pageerror', e => console.error('sayfa hatası:', e.message));
  await sayfa.goto(`http://localhost:${PORT}/${KOK}/test3d.html?elle=1&hafif=1&a=${takimA.join(',')}&b=${takimB.join(',')}&tohum=5`, { timeout: 120000, waitUntil: 'domcontentloaded' });
  await sayfa.waitForFunction(() => window.HAZIR, null, { timeout: 240000 });
  const r = await sayfa.evaluate(async (SURE) => {
    const THREE = await import('three');
    const S3 = window.SAHNE;
    const liste = S3._birimler().map(x => S3._bTMP(x.uid)); const birimler = new Map(liste.map(b => [b.uid, b]));
    const BUYUK = /Arm|ForeArm|Hand$|Head$|Neck|Spine|UpLeg|Leg$|Foot$|Limb|Tail|Head_|Shoulder/;
    const q0 = new THREE.Quaternion(), q1 = new THREE.Quaternion(), qm = new THREE.Quaternion(), qa = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3();
    const kayit = new Map();   // uid → {h, kemik: ad → {durum → {ilkY, ilkG, maxY, maxG, n}}}
    for (const b of liste) {
      const k = {}, ata = {}, kem = {};
      if (b.isk) {
        for (const ad in b.kemik) if (BUYUK.test(ad)) {
          k[ad] = {}; kem[ad] = b.kemik[ad];
          // uzvun gövdeye bağlandığı ata: birden çok kemik çocuğu olan ilk ata (kol → göğüs, bacak → kalça)
          let a = b.kemik[ad].parent; while (a && a.isBone && a.children.filter(c => c.isBone).length < 2) a = a.parent;
          ata[ad] = a && a.isBone ? a : b.model;
        }
      } else {
        // dört ayaklı / yılan: Tripo kemik adları güvenilmez (ör. Semender'de 'Limb' adlı gövde kemikleri, Kaplumbağa'da yanlış taraf);
        // hareket.js'in bulduğu bacak zincirleri, kuyruk ve boyun rol adıyla izlenir (önSol_0 … ; aynası önSag_0), ata = zincirin bağlandığı kemik
        const d = b.dort || b.yilan, say = {};
        const ekle = (rol, zincir) => { say[rol] = (say[rol] || 0) + 1; const r = say[rol] > 1 ? rol + say[rol] : rol;
          zincir.forEach((t, j) => { const ad = r + '_' + j; k[ad] = {}; kem[ad] = t; ata[ad] = zincir[0].parent && zincir[0].parent.isBone ? zincir[0].parent : b.model; }); };
        if (b.dort) for (const L of d.bacaklar) ekle((L.on ? 'on' : 'arka') + (L.sol ? 'Sol' : 'Sag') + 'Bacak', L.zincir);
        if (d.kuyruk && d.kuyruk.length) ekle('Kuyruk', d.kuyruk);
        if (d.boyun && d.boyun.length) ekle('Boyun', d.boyun.map(o => o.k || o));
      }
      kayit.set(b.uid, { h: b.u.b.h, tur: b.gor.tur, taraf: b.u.taraf, kemik: k, ata, kem, gom: {} });
    }
    const durumAl = (b) => {
      if (b.olumT >= 0) return 'olum';
      if (b.zaferMi) return 'zafer';
      if (b.dort) { if (b.dort.yet) return 'yetenek'; if (b.dort.sal) return 'saldir'; }
      if (b.yilan) { if (b.yilan.yet) return 'yetenek'; if (b.yilan.sal) return 'saldir'; }
      const d = b.durum; if (d === 'saldir' || d === 'yetenek' || d === 'ara') return d;
      return b.hizS > 0.08 ? 'yuru' : 'bekle';
    };
    const aci = (a, c) => 2 * Math.acos(Math.min(1, Math.abs(a.dot(c)))) * 180 / Math.PI;
    // Örnekleme: her durum bölütü (durum kesintisiz sürdüğü aralık) için kemiğin bölüt başındaki dönüşünden en büyük sapması;
    // ilk 0,3 sn (klip geçişi) sayılmaz. Bir durumun genliği = bölüt genliklerinin ORTANCASI (geçişlerin büyük sıçramaları
    // değil, o durumun tipik hareketi; ör. sürekli saldıran birimin her saldırıda tuttuğu kol), ayrıca en büyüğü.
    const kapat = (r, du) => { for (const ad in r.kemik) { const o = r.kemik[ad][du]; if (o && o.cn >= 8) o.seg.push(o.cm); if (o) { o.cn = 0; o.cm = 0; o.bas = 6; } } };
    const ornek = () => {
      for (const b of liste) {
        if (!b.kok.visible || !b.govde.visible) continue;
        const r = kayit.get(b.uid), du = durumAl(b);
        if (b._kdDurum !== du) { if (b._kdDurum) kapat(r, b._kdDurum); b._kdDurum = du; }
        b.model.updateWorldMatrix(true, true);
        for (const ad in r.kemik) {
          const t = r.kem[ad]; t.matrixWorld.decompose(v, qa, s); r.ata[ad].matrixWorld.decompose(v, qm, s); qm.invert();
          q1.copy(qm).multiply(qa);   // uzvun bağlandığı gövde kemiğine göre
          const o = r.kemik[ad][du] || (r.kemik[ad][du] = { g: q1.clone(), seg: [], cm: 0, cn: 0, bas: 6, mg: 0, n: 0 });
          if (o.bas > 0) { o.bas--; o.g.copy(q1); continue; }
          const x = aci(o.g, q1); o.cm = Math.max(o.cm, x); o.cn++; o.mg = Math.max(o.mg, x); o.n++;
        }
        // kol gövdeye gömülü mü (iki ayaklı): elin gövde eksenine yatay uzaklığı / bağlama duruşundaki uzaklık
        if (b.isk && b.isk.tRelP && b.isk.tRelP.LeftHand) for (const el of ['LeftHand', 'RightHand']) {
          const T = b.isk.tRelP; const rest = Math.abs(T[el].x - T.Hips.x); if (rest < 1e-4) continue;
          v.setFromMatrixPosition(b.kemik[el].matrixWorld); b.model.worldToLocal(v); s.setFromMatrixPosition(b.kemik.Hips.matrixWorld); b.model.worldToLocal(s);
          const o = r.gom[el] || (r.gom[el] = {}); (o[du] || (o[du] = [])).push(Math.abs(v.x - s.x) / rest);
        }
      }
    };
    // savaş: 0,05 sn adımlarla; bittikten sonra kazananlar sevinir, kalanlar 3 sn daha örneklenir
    let t = 0, bitti = false;
    while (t < SURE) { const r = S3.kare(0.05); t += 0.05; ornek(); if (r.bitti && !bitti) { bitti = true; const kaz = r.sonuc && r.sonuc.kazanan; S3.zafer(kaz === 1 ? 1 : 0); SURE = Math.min(SURE, t + 3.5); } }
    const cik = [];
    const ortanca = (l) => { if (!l.length) return 0; const x = l.slice().sort((a, b) => a - b); return x[x.length >> 1]; };
    for (const [uid, r] of kayit) {
      const b = birimler.get(uid); if (b && b._kdDurum) kapat(r, b._kdDurum);
      const k = {};
      for (const ad in r.kemik) { k[ad] = {}; for (const du in r.kemik[ad]) { const o = r.kemik[ad][du]; k[ad][du] = [+ortanca(o.seg).toFixed(1), +o.mg.toFixed(1), o.n, o.seg.length]; } }
      const gom = {}; for (const el in r.gom) { gom[el] = {}; for (const du in r.gom[el]) gom[el][du] = +ortanca(r.gom[el][du]).toFixed(2); }
      cik.push({ uid, h: r.h, tur: r.tur, taraf: r.taraf, kemik: k, gom });
    }
    return cik;
  }, SURE);
  await tarayici.close();
  return r;
}

function esAd(ad) {
  if (ad.includes('Left')) return ad.replace('Left', 'Right'); if (ad.includes('Right')) return ad.replace('Right', 'Left');
  if (ad.includes('Sol')) return ad.replace('Sol', 'Sag'); if (ad.includes('Sag')) return ad.replace('Sag', 'Sol');
  return null;
}
const ONEMLI = /Arm|ForeArm|Hand$|Head$|UpLeg|Shoulder|Bacak|Kuyruk|Boyun/;
function incele(birim) {
  const bulgu = [];
  const durumlar = new Set(); for (const ad in birim.kemik) for (const du in birim.kemik[ad]) durumlar.add(du);
  for (const du of durumlar) {
    if (du === 'olum') continue;   // ölümde çözülme: kemik donması beklenir
    for (const ad in birim.kemik) {
      if (!ONEMLI.test(ad)) continue; const o = birim.kemik[ad][du]; if (!o || o[2] < 6) continue;
      const es = esAd(ad), oe = es && birim.kemik[es] && birim.kemik[es][du];
      const yerel = o[1], esY = oe ? oe[1] : null, el = /Hand$/.test(ad);   // gövdeye göre genlik; el küçük kemik: yalnız uyarı
      if (!el && yerel < ESIK_DONUK && esY != null && esY > ESIK_ES) bulgu.push({ tip: 'DONUK', durum: du, kemik: ad, derece: yerel, es: es, esDerece: esY });
      else if (esY != null && esY > ESIK_ES && yerel < esY * 0.25) bulgu.push({ tip: 'ASIMETRI', durum: du, kemik: ad, derece: yerel, es, esDerece: esY });
    }
    // bütün durumlarda donuk büyük uzuv (eşi yoksa da)
  }
  for (const ad in birim.kemik) {
    if (!ONEMLI.test(ad)) continue; let mx = 0, n = 0;
    for (const du in birim.kemik[ad]) { if (du === 'olum') continue; mx = Math.max(mx, birim.kemik[ad][du][1]); n += birim.kemik[ad][du][2]; }
    if (n > 20 && mx < ESIK_DONUK) bulgu.push({ tip: 'DONUK', durum: 'hepsi', kemik: ad, derece: mx });
  }
  return bulgu;
}

(async () => {
  // 4'erli gruplar: taraf A ve B'ye ikişer kahraman (birbirleriyle savaşsınlar; her biri saldırsın, yetenek kullansın)
  const sonuc = [];
  for (let i = 0; i < LISTE.length; i += 4) {
    const g = LISTE.slice(i, i + 4), A = g.filter((_, j) => j % 2 === 0), B = g.filter((_, j) => j % 2 === 1);
    if (!B.length) B.push('golem');
    process.stderr.write(`denetim: ${A.join(',')} × ${B.join(',')}\n`);
    const r = await denetle(A, B);
    for (const x of r) if (g.includes(x.h) && !sonuc.find(y => y.h === x.h)) sonuc.push(x);
  }
  let donuk = 0;
  const satir = [];
  satir.push('| Kahraman | Tür | Durumlar (örnek) | Genlik (°, gövdeye göre, en büyük): kol/ön kol/el sol·sağ; dört ayaklıda zincirin 2. kemiği | Bulgular |');
  satir.push('|---|---|---|---|---|');
  for (const b of sonuc) {
    const bl = incele(b); donuk += bl.filter(x => x.tip === 'DONUK').length;
    const du = {}; for (const ad in b.kemik) for (const d in b.kemik[ad]) du[d] = Math.max(du[d] || 0, b.kemik[ad][d][2]);
    const gen = (ad) => { const k = b.kemik[ad]; if (!k) return '-'; let m = 0; for (const d in k) if (d !== 'olum') m = Math.max(m, k[d][1]); return m.toFixed(0); };
    const kol = b.tur === 'iki' ? `${gen('LeftArm')}·${gen('RightArm')} / ${gen('LeftForeArm')}·${gen('RightForeArm')} / ${gen('LeftHand')}·${gen('RightHand')}`
      : Object.keys(b.kemik).filter(a => /_1$/.test(a)).map(a => a.replace('_1', '') + ' ' + gen(a)).join(', ');
    satir.push(`| ${b.h} | ${b.tur} | ${Object.entries(du).map(([d, n]) => d + ':' + n).join(' ')} | ${kol} | ${bl.length ? bl.map(x => `${x.tip} ${x.kemik}@${x.durum} ${x.derece}°${x.es ? ' (eş ' + x.esDerece + '°)' : ''}`).join('; ') : 'yok'} |`);
  }
  console.log(satir.join('\n'));
  if (JSON_CIKTI) fs.writeFileSync(JSON_CIKTI, JSON.stringify(sonuc, null, 1));
  process.exit(donuk ? 1 : 0);
})();
