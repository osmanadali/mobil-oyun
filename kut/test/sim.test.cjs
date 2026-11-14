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
ok(sure[150] > 6 && sure[150] < 22, 'medyan savaş 6–22 sn');
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
process.exit(hata ? 1 : 0);
