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
process.exit(hata ? 1 : 0);
