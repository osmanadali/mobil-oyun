#!/usr/bin/env node
/* Kut Arena — donuk kemik denetimi (yalnız görüntü; motora dokunmaz).
   Her kahraman (canavarlar bu modelleri kullanır) gerçek sahne3d.js boru hattında savaştırılır; her karede her kemiğin
   YEREL dönüşü (ebeveynine göre) ve gövdeye (Hips/kök) göre dönüşü örneklenir. Duruma (bekle, yuru, saldir, yetenek, zafer,
   olum) göre her kemiğin hareket genliği (derece) çıkarılır ve şu durumlar işaretlenir:
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
const PORT = +arg('port', 8092), SURE = +arg('sn', 24), JSON_CIKTI = arg('json', null);
const HEPSI = ['golem', 'kurbaga', 'yarasa', 'ruzgar', 'kugu', 'ayi', 'anka', 'baykus', 'tilki', 'ejder', 'kurt', 'koc', 'kaplumbaga', 'semender', 'bulutat', 'yilan'];
const SECIM = (arg('a', '') || '').split(',').filter(Boolean);
const LISTE = SECIM.length ? SECIM : HEPSI;
const ESIK_DONUK = 1.5, ESIK_ES = 6;

// sayfa içinde koşan ölçüm (S3 = sahne3d modülü)
async function denetle(sayfa, takimA, takimB) {
  await sayfa.goto(`http://localhost:${PORT}/web/test3d.html?elle=1&hafif=1&a=${takimA.join(',')}&b=${takimB.join(',')}&tohum=5`);
  await sayfa.waitForFunction(() => window.HAZIR, null, { timeout: 240000 });
  return sayfa.evaluate(async (SURE) => {
    const THREE = await import('three');
    const S3 = window.SAHNE;
    const liste = S3._birimler().map(x => S3._bTMP(x.uid));
    const BUYUK = /Arm|ForeArm|Hand$|Head$|Neck|Spine|UpLeg|Leg$|Foot$|Limb|Tail|Head_|Shoulder/;
    const q0 = new THREE.Quaternion(), q1 = new THREE.Quaternion(), qm = new THREE.Quaternion(), qa = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3();
    const kayit = new Map();   // uid → {h, kemik: ad → {durum → {ilkY, ilkG, maxY, maxG, n}}}
    for (const b of liste) {
      const k = {}; for (const ad in b.kemik) if (BUYUK.test(ad)) k[ad] = {};
      kayit.set(b.uid, { h: b.u.b.h, tur: b.gor.tur, taraf: b.u.taraf, kemik: k });
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
    const ornek = () => {
      for (const b of liste) {
        if (!b.kok.visible || !b.govde.visible) continue;
        const r = kayit.get(b.uid), du = durumAl(b);
        b.model.updateWorldMatrix(true, true);
        b.model.matrixWorld.decompose(v, qm, s); qm.invert();
        for (const ad in r.kemik) {
          const t = b.kemik[ad]; t.matrixWorld.decompose(v, qa, s);
          q0.copy(t.quaternion); q1.copy(qm).multiply(qa);   // yerel; gövdeye göre
          const o = r.kemik[ad][du] || (r.kemik[ad][du] = { y: q0.clone(), g: q1.clone(), my: 0, mg: 0, n: 0 });
          o.my = Math.max(o.my, aci(o.y, q0)); o.mg = Math.max(o.mg, aci(o.g, q1)); o.n++;
        }
      }
    };
    // savaş: 0,05 sn adımlarla; bittikten sonra kazananlar sevinir, kalanlar 3 sn daha örneklenir
    let t = 0, bitti = false;
    while (t < SURE) { const r = S3.kare(0.05); t += 0.05; ornek(); if (r.bitti && !bitti) { bitti = true; const kaz = r.sonuc && r.sonuc.kazanan; S3.zafer(kaz === 1 ? 1 : 0); SURE = Math.min(SURE, t + 3.5); } }
    const cik = [];
    for (const [uid, r] of kayit) {
      const k = {};
      for (const ad in r.kemik) { k[ad] = {}; for (const du in r.kemik[ad]) { const o = r.kemik[ad][du]; k[ad][du] = [+o.my.toFixed(1), +o.mg.toFixed(1), o.n]; } }
      cik.push({ uid, h: r.h, tur: r.tur, taraf: r.taraf, kemik: k });
    }
    return cik;
  }, SURE);
}

function esAd(ad) {
  if (ad.includes('Left')) return ad.replace('Left', 'Right'); if (ad.includes('Right')) return ad.replace('Right', 'Left');
  return null;
}
const ONEMLI = /Arm|ForeArm|Hand$|Head$|Limb|Tail|UpLeg|Shoulder/;
function incele(birim) {
  const bulgu = [];
  const durumlar = new Set(); for (const ad in birim.kemik) for (const du in birim.kemik[ad]) durumlar.add(du);
  for (const du of durumlar) {
    if (du === 'olum') continue;   // ölümde çözülme: kemik donması beklenir
    for (const ad in birim.kemik) {
      if (!ONEMLI.test(ad)) continue; const o = birim.kemik[ad][du]; if (!o || o[2] < 6) continue;
      const es = esAd(ad), oe = es && birim.kemik[es] && birim.kemik[es][du];
      const yerel = o[0], esY = oe ? oe[0] : null;
      if (yerel < ESIK_DONUK && esY != null && esY > ESIK_ES) bulgu.push({ tip: 'DONUK', durum: du, kemik: ad, derece: yerel, es: es, esDerece: esY });
      else if (esY != null && yerel > 0.5 && esY > ESIK_ES && yerel < esY * 0.25) bulgu.push({ tip: 'ASIMETRI', durum: du, kemik: ad, derece: yerel, es, esDerece: esY });
    }
    // bütün durumlarda donuk büyük uzuv (eşi yoksa da)
  }
  for (const ad in birim.kemik) {
    if (!ONEMLI.test(ad)) continue; let mx = 0, n = 0;
    for (const du in birim.kemik[ad]) { if (du === 'olum') continue; mx = Math.max(mx, birim.kemik[ad][du][0]); n += birim.kemik[ad][du][2]; }
    if (n > 20 && mx < ESIK_DONUK) bulgu.push({ tip: 'DONUK', durum: 'hepsi', kemik: ad, derece: mx });
  }
  return bulgu;
}

(async () => {
  const tarayici = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const sayfa = await tarayici.newPage({ viewport: { width: 1180, height: 760 } });
  sayfa.on('pageerror', e => console.error('sayfa hatası:', e.message));
  // 4'erli gruplar: taraf A ve B'ye ikişer kahraman (birbirleriyle savaşsınlar; her biri saldırsın, yetenek kullansın)
  const sonuc = [];
  for (let i = 0; i < LISTE.length; i += 4) {
    const g = LISTE.slice(i, i + 4), A = g.filter((_, j) => j % 2 === 0), B = g.filter((_, j) => j % 2 === 1);
    if (!B.length) B.push('golem');
    process.stderr.write(`denetim: ${A.join(',')} × ${B.join(',')}\n`);
    const r = await denetle(sayfa, A, B);
    for (const x of r) if (g.includes(x.h) && !sonuc.find(y => y.h === x.h)) sonuc.push(x);
  }
  await tarayici.close();
  let donuk = 0;
  const satir = [];
  satir.push('| Kahraman | Tür | Durumlar (örnek) | Kol/ön kol/el genliği sol·sağ (°, en büyük) | Bulgular |');
  satir.push('|---|---|---|---|---|');
  for (const b of sonuc) {
    const bl = incele(b); donuk += bl.filter(x => x.tip === 'DONUK').length;
    const du = {}; for (const ad in b.kemik) for (const d in b.kemik[ad]) du[d] = Math.max(du[d] || 0, b.kemik[ad][d][2]);
    const gen = (ad) => { const k = b.kemik[ad]; if (!k) return '-'; let m = 0; for (const d in k) if (d !== 'olum') m = Math.max(m, k[d][0]); return m.toFixed(0); };
    const kol = b.tur === 'iki' ? `${gen('LeftArm')}·${gen('RightArm')} / ${gen('LeftForeArm')}·${gen('RightForeArm')} / ${gen('LeftHand')}·${gen('RightHand')}` : '(dört ayaklı/yılan: uzuv zinciri)';
    satir.push(`| ${b.h} | ${b.tur} | ${Object.entries(du).map(([d, n]) => d + ':' + n).join(' ')} | ${kol} | ${bl.length ? bl.map(x => `${x.tip} ${x.kemik}@${x.durum} ${x.derece}°${x.es ? ' (eş ' + x.esDerece + '°)' : ''}`).join('; ') : 'yok'} |`);
  }
  console.log(satir.join('\n'));
  if (JSON_CIKTI) fs.writeFileSync(JSON_CIKTI, JSON.stringify(sonuc, null, 1));
  process.exit(donuk ? 1 : 0);
})();
