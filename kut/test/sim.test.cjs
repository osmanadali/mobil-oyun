// node kut/test/sim.test.cjs — motor: belirlenimcilik, süre, kahraman denge taraması
global.btoa = s => Buffer.from(s, 'binary').toString('base64'); global.atob = s => Buffer.from(s, 'base64').toString('binary');
const D = require('../data.js'), S = require('../sim.js'), O = require('../online.js');
let hata = 0; const ok = (c, m) => { if (!c) { hata++; console.log('✗', m); } else console.log('✓', m); };

// 1) belirlenimcilik
const a = O.botTakim(6, 11), b = O.botTakim(6, 22);
const r1 = S.Savas(a, b, { tohum: 5, yz: [0, 1] }).sonunaKadar(), r2 = S.Savas(a, b, { tohum: 5, yz: [0, 1] }).sonunaKadar();
ok(JSON.stringify(r1) === JSON.stringify(r2), 'aynı girdi → aynı sonuç ' + JSON.stringify(r1));
// kayıt ile tekrar oynatma
const kayit = []; const s1 = S.Savas(a, b, { tohum: 9, kayit }); for (let i = 0; i < 40; i++) s1.adim(); s1.kut(0, 0); const x1 = s1.sonunaKadar();
const x2 = S.Savas(a, b, { tohum: 9, kut: kayit }).sonunaKadar();
ok(JSON.stringify(x1) === JSON.stringify(x2), 'Kut kaydıyla tekrar oynatma aynı');

// 2) süre dağılımı
let sure = [], beraber = 0;
for (let i = 0; i < 300; i++) { const tur = 1 + i % 11; const r = S.Savas(O.botTakim(tur, i), O.botTakim(tur, i + 999), { tohum: i, yz: [0, 1], alamet: D.ALAMETLER[i % 8].id }).sonunaKadar(); sure.push(r.sure); if (r.kazanan === -1) beraber++; }
sure.sort((x, y) => x - y);
console.log('  savaş süresi medyan', sure[150], 'sn, %90', sure[270], 'sn, beraberlik', beraber);
ok(sure[150] > 12 && sure[150] < 34, 'medyan savaş 12–34 sn (tempo: savaş ortancası 24–32 sn hedefi, Gün Batımı yok)');
ok(beraber < 30, 'beraberlik %10 altı');

// 3) kahraman denge: her kahraman ★2 tek başına 2 rastgele ★1'e karşı... yerine: aynı soy dağılımlı takımda kahramanı değiştir
const oran = {};
for (const h of D.KAHRAMANLAR) {
  let k = 0, n = 0;
  for (let i = 0; i < 120; i++) {
    const tur = 5 + i % 5; const tA = O.botTakim(tur, 5000 + i); tA[0] = { ...tA[0], h: h.id, f: undefined };
    const tB = O.botTakim(tur, 9000 + i);
    const r = S.Savas(tA, tB, { tohum: i, yz: [0, 1] }).sonunaKadar(); n++; if (r.kazanan === 0) k++; else if (r.kazanan === -1) k += 0.5;
  }
  oran[h.id] = k / n;
}
const s = Object.entries(oran).sort((x, y) => y[1] - x[1]);
console.log('  kahraman kazanma (takımda yer alınca):', s.map(([i, v]) => i + ' ' + (v * 100).toFixed(0)).join(' · '));
ok(s[0][1] - s[s.length - 1][1] < 0.40, 'en güçlü/en zayıf kahraman farkı < 40 puan');

// 4) düello kodu
const kod = O.kodla(a, 'Osman'); const c = O.coz(kod);
ok(c && c.ad === 'Osman' && JSON.stringify(c.takim.map(({ h, s, f, x, y }) => ({ h, s, f, x, y }))) === JSON.stringify(a.map(({ h, s, f, x, y }) => ({ h, s, f, x, y }))), 'düello kodu gidiş-dönüş (' + kod.length + ' karakter)');
ok(O.coz('çöp') === null, 'bozuk kod reddedilir');
// 5) 4×3 tahta: motor konumları, yerleştirme, seviyeli bot takımı, KUT1 eski kod
{
  const sv = S.Savas([{ h: 'golem', s: 1, x: 0, y: 0 }, { h: 'kugu', s: 1, x: 3, y: 2 }, { h: 'semender', s: 1, x: 1, y: 1 }], [{ h: 'kurt', s: 1, x: 2, y: 0 }, { h: 'tilki', s: 1, x: 3, y: 2 }], { tohum: 3 });
  const k = (u) => [u.x, u.y].join(',');
  ok(sv.birimler.map(k).join(' ') === '0.75,5 5.25,7 2.25,6 3.75,3 5.25,1', 'konum: x = 0,75 + 1,5·sütun; taraf 0 y 5/6/7, taraf 1 y 3/2/1');
  let hep = true, sekiz = true;
  for (let i = 0; i < 200; i++) {
    const sv8 = 2 + i % 7, t = O.botTakim(1 + i % 20, 300 + i, (i % 5) / 4, sv8);
    if (t.length !== sv8) sekiz = false;
    const hucre = new Set(t.map(b => b.y * 4 + b.x));
    if (hucre.size !== t.length || t.some(b => b.x < 0 || b.x > 3 || b.y < 0 || b.y > 2)) hep = false;
    const sira = (y) => t.filter(o => o.y === y).length;
    for (const b of t) { const m = D.kahraman(b.h).menzil; if (m === 1 && b.y !== 0 && sira(0) < 4) hep = false; if (m === 3 && b.y !== 2 && sira(2) < 4) hep = false; }
  }
  ok(sekiz, 'seviyeli bot: takım boyu = seviye (2–8)');
  ok(hep, 'yerleştirme: farklı hücreler, yakın dövüşçü önde, menzil 3 arkada (sıra doluysa taşar)');
  const t8 = O.botTakim(12, 77, 0.8, 8), r8 = S.Savas(t8, O.botTakim(12, 78, 0.8, 8), { tohum: 4, yz: [0, 1] }).sonunaKadar();
  ok(t8.length === 8 && r8 && r8.kazanan !== undefined && r8.kalanSayi >= 0, '8 kahramanlı takımlar savaşır (' + r8.sure + ' sn)');
  const H1 = O.botTakim(6, 11); ok(H1.length === D.KURAL.hizli.yuva(6), 'Hızlı Maç botu: takım tura bağlı (' + H1.length + ')');
  // KUT1 (eski 3×2) kodu: ön → y 0, arka → y 2, x aynen
  const eski = 'KUT1-' + btoa(unescape(encodeURIComponent('Eski|0.2.-1.1.0_10.1.3.2.1'))).replace(/=+$/, '');
  const ce = O.coz(eski);
  ok(ce && ce.ad === 'Eski' && JSON.stringify(ce.takim) === JSON.stringify([{ h: 'golem', s: 2, x: 1, y: 0 }, { h: 'kugu', s: 1, x: 2, y: 2, f: 'yarasa' }]), 'KUT1 kodu çözülür (arka → y 2)');
  const e2 = O.coz(O.kodla([{ h: 'golem', s: 1, x: 3, y: 2, e: ['a', 'b'] }], 'E'));
  ok(e2 && e2.takim[0].x === 3 && e2.takim[0].y === 2 && e2.takim[0].e.join() === 'a,b', 'KUT2 kodu sütun 3, sıra 2 ve eşyaları taşır');
}
// 5) sakin, okunur savaş kuralları (KURAL.savas)
{
  const KS = D.KURAL.savas, L = require('../lobi.js'), DT = S.Savas([], []).DT;
  // 5a) üst üste binme yok: yaşayan iki birim hiçbir adımda 0,4 hücreden yakın olmaz, ayrim'in 0,1 altına inen anlar ‰1'in altında
  let enAz = 9, yakin = 0, cift = 0;
  for (let i = 0; i < 60; i++) { const tur = 1 + i % 11, sv = S.Savas(O.botTakim(tur, i), O.botTakim(tur, i + 999), { tohum: i + 1, yz: [0, 1], alamet: D.ALAMETLER[i % 8].id });
    while (!sv.bitti) { sv.adim(); const Lb = sv.birimler.filter(o => !o.olu);
      for (let a = 0; a < Lb.length; a++) for (let b = a + 1; b < Lb.length; b++) { const d = Math.hypot(Lb[a].x - Lb[b].x, Lb[a].y - Lb[b].y); cift++; if (d < enAz) enAz = d; if (d < KS.ayrim - 0.1) yakin++; } } }
  ok(enAz >= 0.4 && yakin / cift < 0.001, `çakışma yok: en yakın iki birim ${enAz.toFixed(3)} hücre, ayrim−0,1 altı ‰${(1000 * yakin / cift).toFixed(3)}`);
  // 5b) kalıcı hedef: Gölge Tilki menzildeki Işık Kuğusu'nu vururken Kurt yanına gelse de hedef değişmez (eskiden 0,5 sn'de bir en yakına dönerdi)
  { const sv = S.Savas([{ h: 'tilki', s: 1, x: 1, y: 2 }], [{ h: 'kugu', s: 3, x: 1, y: 0 }, { h: 'kurt', s: 1, x: 3, y: 2 }], { tohum: 2 });
    const [ti, ayi, kurt] = sv.birimler; let yakinAn = 0, sadik = true, vurdu = false;
    while (!sv.bitti && !ti.olu && !ayi.olu && sv.t < 20) { sv.adim(); if (sv.fx.some(f => f.tip === 'vurus' && f.k === ti.uid && f.u === ayi.uid)) vurdu = true;
      if (vurdu && !ti.durum.sersem && Math.hypot(ti.x - kurt.x, ti.y - kurt.y) + 0.3 < Math.hypot(ti.x - ayi.x, ti.y - ayi.y)) { yakinAn++; if (ti.hedef !== ayi) sadik = false; } }
    ok(yakinAn > 5 && sadik, `kalıcı hedef: Kurt daha yakınken (${yakinAn} adım) Tilki Kuğu'yu bırakmadı`); }
  // 5c) yetenek kurulumu: Kut ile dolan Kaya Golemi önce 'kurulum' olayı (sure), kurulum boyunca yürümez/vurmaz/mana almaz, sure sn sonra 'yetenek'
  { const sv = S.Savas([{ h: 'golem', s: 1, x: 1, y: 0 }], [{ h: 'kurbaga', s: 1, x: 1, y: 0 }], { tohum: 4 }); const g = sv.birimler[0], kb = sv.birimler[1];
    sv.kut(0, 0); sv.adim(); const kf = sv.fx.find(f => f.tip === 'kurulum' && f.u === g.uid);
    ok(kf && kf.sure === KS.kurulum && kf.ad === 'tasFirlat' && g.mp === 0 && g.kurulum > 0 && !sv.fx.some(f => f.tip === 'yetenek'), `mana dolunca kurulum başlar (${kf && kf.sure} sn), yetenek henüz yok`);
    const x0 = g.x, y0 = g.y, t0 = kf.t; let n = 0, yf = null, vurus = false;
    while (!yf && n++ < 40) { sv.adim(); yf = sv.fx.find(f => f.tip === 'yetenek' && f.u === g.uid); if (sv.fx.some(f => f.tip === 'vurus' && f.k === g.uid)) vurus = true; }
    ok(yf && Math.abs(yf.t - t0 - KS.kurulum) < 1e-6 && g.x === x0 && g.y === y0 && !vurus, `yetenek kurulumdan ${yf ? (yf.t - t0).toFixed(2) : '?'} sn sonra; kurulumda yürümedi, vurmadı`);
    // kurulumda vurulsa da mana gelmez (kurulumu uzatıp Davulcu Kurbağa'nın vuruşlarını bekle); kurbağanın vuruş manası KS.vurusMana
    const sv2 = S.Savas([{ h: 'golem', s: 1, x: 1, y: 0 }], [{ h: 'kurbaga', s: 1, x: 1, y: 0 }], { tohum: 4 }); const g2 = sv2.birimler[0], k2 = sv2.birimler[1];
    sv2.kut(0, 0); sv2.adim(); g2.kurulum = 5; let vurul = 0, ilkMana = null;
    for (let i = 0; i < 60; i++) { sv2.adim(); if (sv2.fx.some(f => f.tip === 'hasar' && f.u === g2.uid)) vurul++; if (ilkMana === null && sv2.fx.some(f => f.tip === 'vurus' && f.k === k2.uid)) ilkMana = k2.mp; }
    ok(vurul > 0 && g2.mp === 0 && ilkMana === KS.vurusMana, `kurulumda ${vurul} kez vuruldu, mana 0 kaldı; vuruş başına mana ${ilkMana} (${KS.vurusMana})`);
    // sersemlik kurulumu iptal etmez, geciktirir
    const sv3 = S.Savas([{ h: 'golem', s: 1, x: 1, y: 0 }], [{ h: 'kurbaga', s: 1, x: 1, y: 0 }], { tohum: 4 }); const g3 = sv3.birimler[0];
    sv3.kut(0, 0); sv3.adim(); const t3 = sv3.t; g3.durum.sersem = { sure: 1 }; let y3 = null;
    for (let i = 0; i < 80 && !y3; i++) { sv3.adim(); y3 = sv3.fx.find(f => f.tip === 'yetenek' && f.u === g3.uid); }
    ok(y3 && y3.t - t3 > 1 + KS.kurulum - 2 * DT, `sersem kurulumu iptal etmez, geciktirir (${y3 ? (y3.t - t3).toFixed(2) : '?'} sn)`);
    ok(S.Savas([{ h: 'bulutat', s: 1 }], [{ h: 'golem', s: 1 }]).birimler[0].kurulumSure === D.YETENEK.dortnal.kurulum && D.YETENEK.dortnal.kurulum !== KS.kurulum, 'yeteneğe özgü kurulum süresi (YETENEK.dortnal.kurulum)'); }
  // 5d) hasar alınca mana: alınan hasarın %7'si, vuruş başına en çok hasarManaTavan (Kut'lu Gölge Oku ★3 Golem'e)
  { const sv = S.Savas([{ h: 'golem', s: 3, x: 1, y: 0 }], [{ h: 'tilki', s: 3, x: 1, y: 2, e: ['kutOcagi'] }], { tohum: 6 }); const g = sv.birimler[0];
    sv.kut(1, 0); let yf = null, n = 0; while (!yf && n++ < 40) { sv.adim(); yf = sv.fx.find(f => f.tip === 'yetenek' && f.ad === 'golgeOk'); }
    const hf = sv.fx.find(f => f.tip === 'hasar' && f.u === g.uid);
    ok(yf && hf && hf.n * KS.hasarMana > KS.hasarManaTavan && Math.abs(g.mp - KS.hasarManaTavan) < 1e-9, `alınan ${hf && hf.n} hasar → ${g.mp.toFixed(1)} mana (tavan ${KS.hasarManaTavan})`); }
  // 5e) süre dolunca iki taraf da kaybeder: Taş Kabuk × Taş Kabuk 45 sn'de bitmez
  { const r = S.Savas([{ h: 'tasKabuk', s: 2, x: 1, y: 0 }], [{ h: 'tasKabuk', s: 1, x: 1, y: 0 }], { tohum: 1 }).sonunaKadar();
    ok(r.kazanan === -2 && r.sureDoldu && r.sure >= D.KURAL.savasSuresi - 1e-6 && r.kalanPuan === 1 && r.kalanSayi === 1 && r.kalanPuanB === 2 && r.kalanSayiB === 1,
      `süre doldu: kazanan −2, iki tarafın sağ kalanları (taraf 1: ${r.kalanPuan}★, taraf 0: ${r.kalanPuanB}★)`);
    const r9 = 4; // 2-2: PvP, bölüm 2
    const h = L.kayipHasar(r9, -2, r.kalanPuan, r.kalanSayi, 0, r.kalanPuanB), t = L.bolumTaban(2, 0);
    ok(h[0] === t + 1 && h[1] === t + 2, `süre doldu: iki tarafa yenilgi hasarı [${h}] (taban ${t} + rakibin sağ yıldızları)`);
    const d = { altin: 0, can: 100, seri: { tip: 'G', n: 2 }, galibiyet: true, seviye: 3, xp: 0 }; const o = L.turSonu(d, r9, r);
    ok(o.hasar === t + 1 && d.can === 100 - t - 1 && d.seri.tip === 'M' && d.seri.n === 1 && !d.galibiyet, 'süre doldu: tur sonunda yenilgi (can, seri M1, galibiyet bonusu düşer)'); }
}

process.exit(hata ? 1 : 0);
