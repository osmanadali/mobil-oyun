// node kut/test/esdeger_uret.cjs → kut/unity/Test/esdeger.json
// JS motorunun ürettiği savaşları (takımlar, tohum, alamet, Kut, adım sayısı, son canlar) kaydeder; C# testi aynısını üretmeli.
global.btoa = s => Buffer.from(s, 'binary').toString('base64');
const D = require('../data.js'), S = require('../sim.js'), O = require('../online.js');
const H = D.KAHRAMANLAR.map(h => h.id);
const vakalar = [];
function oyna(A, B, opt) {
  const sv = S.Savas(A, B, opt); let n = 0; while (!sv.bitti && n < 100000) { sv.adim(); n++; }
  return { adim: n, t: sv.t, sonuc: sv.sonuc, hp: sv.birimler.map(u => u.hp), xy: sv.birimler.map(u => [u.x, u.y]) };
}
// 1) bot takımları: tur 1–12, farklı güç, alamet, Kut
for (let i = 0; i < 400; i++) {
  const tur = 1 + i % 12, gA = (i % 5) / 4, gB = ((i * 3) % 5) / 4;
  const A = O.botTakim(tur, 1000 + i, gA), B = O.botTakim(tur, 5000 + i * 7, gB);
  const opt = { tohum: i * 13 + 7, alamet: D.ALAMETLER[i % D.ALAMETLER.length].id };
  if (i % 3 === 0) opt.yz = [0, 1]; else if (i % 3 === 1) { opt.yz = [1]; opt.kut = [{ t: +((i % 40) * 0.05 + 0.5).toFixed(2), taraf: 0, i: i % A.length }]; }
  vakalar.push({ tur, tohumA: 1000 + i, gucA: gA, tohumB: 5000 + i * 7, gucB: gB, A, B, opt, sonuc: oyna(A, B, opt), kod: O.kodla(A, 'Oyuncu ' + i) });
}
// 2) elle kurulmuş takımlar: her kahraman, her kaynaşma çifti ve ★3 sınansın
for (let j = 0; j < 96; j++) {
  const yap = (bas) => Array.from({ length: 6 }, (_, k) => {
    const b = { h: H[(bas + k) % 16], s: 1 + ((j + k) % 3), x: k % 3, y: Math.floor(k / 3) };
    if ((j + k) % 4 === 0) { const f = H[(bas + k + 5 + (j % 7)) % 16]; if (f !== b.h) { b.f = f; } }
    return b;
  });
  const A = yap(j), B = yap(j + 8);
  const opt = { tohum: 777 + j, alamet: D.ALAMETLER[j % D.ALAMETLER.length].id, yz: [0, 1] };
  vakalar.push({ elle: true, A, B, opt, sonuc: oyna(A, B, opt), kod: O.kodla(A, 'Çağrı ' + j) });
}
const fs = require('fs'), path = require('path');
const out = path.join(__dirname, '..', 'unity', 'Test', 'esdeger.json');
fs.writeFileSync(out, JSON.stringify(vakalar));
const k = vakalar.map(v => v.sonuc.sonuc.kazanan);
console.log('vaka', vakalar.length, 'A kazanır', k.filter(x => x === 0).length, 'B', k.filter(x => x === 1).length, 'berabere', k.filter(x => x === -1).length, '→', out);
