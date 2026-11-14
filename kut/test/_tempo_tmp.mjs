import { createRequire } from 'module';
const require = createRequire('/home/user/mobil-oyun/kut/test/x.mjs');
globalThis.window = globalThis;
let depo = {}; globalThis.localStorage = { getItem: k => depo[k] ?? null, setItem: (k, v) => { depo[k] = v; } };
let rs = 1; Math.random = () => { rs = (rs + 0x6D2B79F5) | 0; let t = Math.imul(rs ^ (rs >>> 15), 1 | rs); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const D = require('../data.js'), S = require('../sim.js'), O = require('../online.js'), L = require('../lobi.js');
const K = D.KURAL;
const orj = globalThis.KUT_SIM.Savas;
const kay = [];
globalThis.KUT_SIM.Savas = function (a, b, opt) {
  const s = orj(a, b, opt); const r = { a: a.length, b: b.length, t: 0, ilkOlum: null, ilkTemas: {}, vurus: {}, yet: {}, sayi: 0, pveMi: false, ilkVurus: null, olumler: [] };
  const adim0 = s.adim; s.adim = function () { adim0(); const t = s.t;
    for (const f of s.fx) {
      if (f.tip === 'olum') { if (r.ilkOlum === null) r.ilkOlum = t; r.olumler.push(t); }
      if (f.tip === 'vurus') { (r.vurus[f.k] = r.vurus[f.k] || []).push(t); if (r.ilkVurus === null) r.ilkVurus = t; }
      if (f.tip === 'yetenek') (r.yet[f.u] = r.yet[f.u] || 0), r.yet[f.u]++;
      if (f.tip === 'hasar' || f.tip === 'dot' || f.tip === 'iyi' || f.tip === 'kalkan') r.sayi++;
    }
  };
  // birimler bilgisi
  r.bir = s.birimler.map(u => ({ uid: u.uid, h: u.b.h, as: u.as, menzil: u.menzil, mana: u.mana, s: u.b.s || 1 }));
  s.sonunaKadar = function () { let n = 0; while (!s.bitti && n++ < 100000) s.adim(); r.t = s.sonuc.sure; r.son = s.sonuc; return s.sonuc; };
  kay.push(r); return s;
};
const N = +(process.argv[2] || 150);
for (let n = 0; n < N; n++) {
  const tohum = 500000 + n * 7717, kupa = (n * 37) % 800; const iz = O.lobiIzler(kupa, tohum, [], null, null, 8);
  const lb = L.lobiYeni({ ad: iz[0].ad, kupa, iz: { bot: iz[0].bot } }, iz.slice(1), tohum);
  while (!L.lobiBitti(lb) && lb.r < K.lobiTurTavan) { const i0 = kay.length; L.lobiTurOyna(lb, lb.r); }
}
// yalnız PvP benzeri: iki taraf da kahraman (canavar değil) — canavarlar kademe 0
const pvp = kay.filter(r => r.bir.every(b => D.KAHRAMANLAR.some(k => k.id === b.h)) && r.son);
const med = a => { const b = a.filter(x => x != null).sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
const q = (a, p) => { const b = a.filter(x => x != null).sort((x, y) => x - y); return b[Math.floor(b.length * p)]; };
console.log('savas sayisi', pvp.length);
console.log('sure medyan', med(pvp.map(r => r.t)), 'p10', q(pvp.map(r => r.t), .1), 'p90', q(pvp.map(r => r.t), .9));
console.log('ilk vurus medyan', med(pvp.map(r => r.ilkVurus)), 'ilk olum medyan', med(pvp.map(r => r.ilkOlum)), 'p10', q(pvp.map(r => r.ilkOlum), .1));
const olumSay = pvp.map(r => r.olumler.length);
console.log('olum/savas ort', olumSay.reduce((a, b) => a + b, 0) / pvp.length, 'birim/savas ort', pvp.reduce((a, r) => a + r.a + r.b, 0) / pvp.length);
// saldırı aralığı (gerçek, bonuslarla) kahraman başına
const ara = {}, yetS = {}, sur = {};
for (const r of pvp) for (const b of r.bir) {
  const v = r.vurus[b.uid] || []; for (let i = 1; i < v.length; i++) { const d = v[i] - v[i - 1]; if (d < 3) (ara[b.h] = ara[b.h] || []).push(d); }
  (yetS[b.h] = yetS[b.h] || []).push(r.yet[b.uid] || 0);
}
console.log('kahraman  as  medAra p10Ara  ort_yetenek/savas');
for (const k of D.KAHRAMANLAR) { const a = ara[k.id] || []; console.log(k.id.padEnd(11), k.as.toFixed(2), (med(a) || 0).toFixed(2), (q(a, .1) || 0).toFixed(2), ((yetS[k.id] || []).reduce((x, y) => x + y, 0) / Math.max(1, (yetS[k.id] || []).length)).toFixed(2), 'atk*as', (k.atk * k.as).toFixed(0)); }
const tumAra = Object.values(ara).flat();
console.log('tum saldiri araligi medyan', med(tumAra), 'p10', q(tumAra, .1), 'p90', q(tumAra, .9));
console.log('sayi/sn medyan', med(pvp.map(r => r.sayi / Math.max(1, r.t))), 'sayi/sn p90', q(pvp.map(r => r.sayi / Math.max(1, r.t)), .9));
console.log('vurus/sn tum sahada medyan', med(pvp.map(r => Object.values(r.vurus).reduce((a, v) => a + v.length, 0) / Math.max(1, r.t))));
console.log('sinira dayanan', pvp.filter(r => r.t >= 30).length / pvp.length);
