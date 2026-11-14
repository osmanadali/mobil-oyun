// node kut/test/esdeger_uret.cjs → kut/unity/Test/esdeger.json
// JS motorunun ürettiği savaşları (takımlar, tohum, alamet, Kut, adım sayısı, son canlar) ve seviyeli maç kurallarının
// (deneyim, havuz, dükkân çekimi) sonuçlarını kaydeder; C# testi (cd kut/unity/Test && dotnet run) aynısını üretmeli.
global.btoa = s => Buffer.from(s, 'binary').toString('base64');
const D = require('../data.js'), S = require('../sim.js'), O = require('../online.js'), L = require('../lobi.js');
const H = D.KAHRAMANLAR.map(h => h.id);
const savas = [];
function oyna(A, B, opt) {
  const sv = S.Savas(A, B, opt); let n = 0; while (!sv.bitti && n < 100000) { sv.adim(); n++; }
  return { adim: n, t: sv.t, sonuc: sv.sonuc, hp: sv.birimler.map(u => u.hp), xy: sv.birimler.map(u => [u.x, u.y]) };
}
// 1) Hızlı Maç bot takımları: tur 1–12, farklı güç, alamet, Kut
for (let i = 0; i < 400; i++) {
  const tur = 1 + i % 12, gA = (i % 5) / 4, gB = ((i * 3) % 5) / 4;
  const A = O.botTakim(tur, 1000 + i, gA), B = O.botTakim(tur, 5000 + i * 7, gB);
  const opt = { tohum: i * 13 + 7, alamet: D.ALAMETLER[i % D.ALAMETLER.length].id };
  if (i % 3 === 0) opt.yz = [0, 1]; else if (i % 3 === 1) { opt.yz = [1]; opt.kut = [{ t: +((i % 40) * 0.05 + 0.5).toFixed(2), taraf: 0, i: i % A.length }]; }
  savas.push({ tur, tohumA: 1000 + i, gucA: gA, tohumB: 5000 + i * 7, gucB: gB, A, B, opt, sonuc: oyna(A, B, opt), kod: O.kodla(A, 'Oyuncu ' + i) });
}
// 2) seviyeli bot takımları: Sv 2–8 (takım boyu = seviye, seviyeye bağlı dükkân olasılığı), 4×3 yerleştirme
for (let i = 0; i < 210; i++) {
  const tur = 1 + i % 20, sv = 2 + i % 7, svB = 2 + ((i * 5) % 7), gA = (i % 5) / 4, gB = ((i * 2) % 5) / 4;
  const A = O.botTakim(tur, 2000 + i, gA, sv), B = O.botTakim(tur, 7000 + i * 3, gB, svB);
  const opt = { tohum: i * 17 + 3, alamet: D.ALAMETLER[(i * 3) % D.ALAMETLER.length].id };
  if (i % 3 === 0) opt.yz = [0, 1]; else if (i % 3 === 1) { opt.yz = [1]; opt.kut = [{ t: +((i % 30) * 0.1 + 0.2).toFixed(2), taraf: 0, i: i % A.length }]; }
  savas.push({ tur, sv, svB, tohumA: 2000 + i, gucA: gA, tohumB: 7000 + i * 3, gucB: gB, A, B, opt, sonuc: oyna(A, B, opt), kod: O.kodla(A, 'Arena ' + i) });
}
// 3) elle kurulmuş takımlar (eski 3×2 koordinatlar): her kahraman, her kaynaşma çifti ve ★3 sınansın
for (let j = 0; j < 96; j++) {
  const yap = (bas) => Array.from({ length: 6 }, (_, k) => {
    const b = { h: H[(bas + k) % 16], s: 1 + ((j + k) % 3), x: k % 3, y: Math.floor(k / 3) };
    if ((j + k) % 4 === 0) { const f = H[(bas + k + 5 + (j % 7)) % 16]; if (f !== b.h) { b.f = f; } }
    return b;
  });
  const A = yap(j), B = yap(j + 8);
  const opt = { tohum: 777 + j, alamet: D.ALAMETLER[j % D.ALAMETLER.length].id, yz: [0, 1] };
  savas.push({ elle: true, A, B, opt, sonuc: oyna(A, B, opt), kod: O.kodla(A, 'Çağrı ' + j) });
}
// 4) elle kurulmuş 4×3 takımlar: 6–8 kahraman, 12 hücreye dağılmış (sütun 3 ve arka sıra dahil)
for (let j = 0; j < 96; j++) {
  const yap = (bas, n) => Array.from({ length: n }, (_, k) => {
    const hucre = (k * 5 + j) % 12;
    const b = { h: H[(bas + k * 3) % 16], s: 1 + ((j + k) % 3), x: hucre % 4, y: Math.floor(hucre / 4) };
    if ((j + k) % 5 === 0) { const f = H[(bas + k + 3 + (j % 5)) % 16]; if (f !== b.h) b.f = f; }
    return b;
  });
  const A = yap(j, 6 + j % 3), B = yap(j + 5, 6 + (j + 1) % 3);
  const opt = { tohum: 4242 + j * 3, alamet: D.ALAMETLER[(j * 5) % D.ALAMETLER.length].id, yz: j % 2 ? [0, 1] : [1] };
  if (j % 2 === 0) opt.kut = [{ t: +(0.3 + (j % 20) * 0.15).toFixed(2), taraf: 0, i: j % A.length }];
  savas.push({ elle: true, A, B, opt, sonuc: oyna(A, B, opt), kod: O.kodla(A, 'Dört Üç ' + j) });
}

// 5) eski KUT1- kodları (3×2 tahta): çözülünce x aynen, arka → y 2
const kut1 = [];
for (let j = 0; j < 40; j++) {
  const ham = Array.from({ length: 1 + j % 6 }, (_, k) => [(j + k * 3) % 16, 1 + (j + k) % 3, (j + k) % 4 === 0 ? (j + k + 7) % 16 : -1, k % 3, Math.floor(k / 3)].join('.')).join('_');
  const kod = 'KUT1-' + btoa(unescape(encodeURIComponent('Eski ' + j + '|' + ham))).replace(/=+$/, '');
  kut1.push({ kod, cozum: O.coz(kod) });
}

// 5b) KUT2- kodları: eşya taşıyan takımlar (kodla → çöz gidiş-dönüş) ve bozuk kodlar (ikisi de null dönmeli)
const kut2 = [];
const ESYA = ['kilic', 'yay', 'asa', 'zirh', 'pelerin', 'kemer', 'tuy', 'damla'];
const ham2 = (ad, parca) => 'KUT2-' + btoa(unescape(encodeURIComponent(ad + '|' + parca.join('_')))).replace(/=+$/, '');
for (let j = 0; j < 60; j++) {
  const takim = Array.from({ length: 1 + j % 8 }, (_, k) => {
    const b = { h: H[(j + k * 5) % 16], s: 1 + (j + k) % 3, x: (j + k) % 4, y: (j * 3 + k) % 3 };
    if ((j + k) % 6 === 0) b.f = H[(j + k + 9) % 16];
    const ne = (j + k) % 4; if (ne) b.e = Array.from({ length: ne }, (_, z) => ESYA[(j + k + z * 3) % 8]); // 4. eşya kesilir
    return b;
  });
  const kod = O.kodla(takim, 'Eşyalı ' + j);
  kut2.push({ kod, cozum: O.coz(kod) });
}
const bozuk = [
  ham2('a', ['0.1.-1.0.0', 'x.1.-1.0.0']), ham2('a', ['0.1.-1.0']), ham2('a', ['0.1.-1.0.']), ham2('a', ['0.1.-1.0. 1']),
  ham2('a', ['0.1.-1.-1.0']), ham2('a', ['16.1.-1.0.0']), ham2('a', ['0.1.16.0.0']), ham2('a', ['0.a.-1.0.0']),
  ham2('a', ['0.1.-1.1e1.0']), ham2('a', ['0.1.-1.0x1.0']), ham2('a', ['0.1.-1.+1.0']), ham2('a', ['0.1.-1.1234567.0']),
  ham2('a', Array.from({ length: 8 }, () => '0.1.-1.0.0').concat(['bozuk'])), 'KUT2-', 'KUT2-!!!!', 'KUT2-' + btoa('\xff\xfe|0.1.-1.0.0'),
  ham2('a', ['0.9.-5.7.5.,,a,b,c,d']), ham2('a', ['15.0.3.3.2']), 'KUT1-' + btoa('b|0.1.-1.2.1_3.2.4.0.0'),
];
for (const kod of bozuk) kut2.push({ kod, cozum: O.coz(kod) });

// 6) seviyeli maç kuralları (lobi.js)
const K = D.KURAL, R0 = S.rng(9001);
const xp = [];
for (let i = 0; i < 400; i++) {
  const sv = 2 + Math.floor(R0() * 7), gerek = L.xpGerek(sv), x = gerek ? Math.floor(R0() * gerek) : 0, m = Math.floor(R0() * 70);
  xp.push({ seviye: sv, xp: x, miktar: m, sonuc: L.xpEkle(sv, x, m) });
}
const rastBirim = () => { const b = { h: H[Math.floor(R0() * 16)], s: 1 + Math.floor(R0() * 3) }; if (R0() < 0.2) b.f = H[Math.floor(R0() * 16)]; return b; };
const havuz = [];
for (let i = 0; i < 150; i++) {
  const gruplar = Array.from({ length: 1 + Math.floor(R0() * 8) }, () => Array.from({ length: Math.floor(R0() * 16) }, () => (R0() < 0.1 ? null : rastBirim())));
  havuz.push({ gruplar, sonuc: L.havuzKalan(gruplar) });
}
const dukkan = [];
for (let i = 0; i < 500; i++) {
  const sv = 2 + i % 7, tohum = 31337 + i * 101;
  // kalan: tam havuz, rastgele azalmış, kademesi tükenmiş ya da neredeyse boş
  const kalan = {};
  for (const h of D.KAHRAMANLAR) {
    const tam = K.havuzAdet[h.kademe], tip = i % 4;
    kalan[h.id] = tip === 0 ? tam : tip === 1 ? Math.floor(R0() * (tam + 1)) : tip === 2 ? (h.kademe === 1 + (i % 3) ? 0 : Math.floor(R0() * (tam + 1))) : (R0() < 0.85 ? 0 : 1 + Math.floor(R0() * 2));
  }
  dukkan.push({ seviye: sv, tohum, kalan, sonuc: L.dukkanCek(sv, kalan, S.rng(tohum)) });
}
const botSeviye = Array.from({ length: 40 }, (_, r) => O.botSeviye(r));

const fs = require('fs'), path = require('path');
const out = path.join(__dirname, '..', 'unity', 'Test', 'esdeger.json');
fs.writeFileSync(out, JSON.stringify({ savas, kut1, kut2, xp, havuz, dukkan, botSeviye }));
const k = savas.map(v => v.sonuc.sonuc.kazanan);
console.log('savaş', savas.length, '(A kazanır', k.filter(x => x === 0).length, '· B', k.filter(x => x === 1).length, '· berabere', k.filter(x => x === -1).length + ')',
  '| KUT1 kodu', kut1.length, '| KUT2 kodu', kut2.length, '(bozuk ' + kut2.filter(v => !v.cozum).length + ')', '| deneyim', xp.length, '| havuz', havuz.length, '| dükkân', dukkan.length, '→', out);
