// node kut/test/esdeger_uret.cjs → kut/unity/Test/esdeger.json
// JS motorunun ürettiği savaşları (takımlar, tohum, alamet, Kut, adım sayısı, son canlar) ve seviyeli maç kurallarının
// (deneyim, havuz, dükkân çekimi) sonuçlarını kaydeder; C# testi (cd kut/unity/Test && dotnet run) aynısını üretmeli.
global.btoa = s => Buffer.from(s, 'binary').toString('base64');
const D = require('../data.js'), S = require('../sim.js'), O = require('../online.js'), L = require('../lobi.js');
const K0 = D.KURAL;
const H = D.KAHRAMANLAR.map(h => h.id);
const savas = [];
function oyna(A, B, opt) {
  const sv = S.Savas(A, B, opt); let n = 0; while (!sv.bitti && n < 100000) { sv.adim(); n++; }
  return { adim: n, t: sv.t, sonuc: sv.sonuc, hp: sv.birimler.map(u => u.hp), xy: sv.birimler.map(u => [u.x, u.y]), mp: sv.birimler.map(u => u.mp), kalkan: sv.birimler.map(u => u.kalkan) };
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

// 4b) eşyalı savaşlar: her tam eşya, bileşen ve özel eşya; elle kurulmuş 4×3 takımlar (Kut Ocağı için çoğunda Kut dokunuşu)
const TAM = D.ESYALAR.map(e => e.id), BIL = D.BILESENLER.map(b => b.id), SOYID = Object.keys(D.SOYLAR);
const OZEL = ['kutTasi', 'sokumTasi', 'muhur-ates', 'muhur-dev', 'muhur-' + SOYID[3], 'yok-boyle', 'muhur-yok'];
for (let j = 0; j < 288; j++) {
  const tip = j % 4; // 0: tam eşya ağırlıklı, 1: bileşen, 2: karışık + özel, 3: tek taşıyıcıda 3 tam eşya
  const yap = (bas, n, taraf) => Array.from({ length: n }, (_, k) => {
    const hucre = (k * 7 + j + taraf * 3) % 12;
    const b = { h: H[(bas + k * 5) % 16], s: 1 + ((j + k + taraf) % 3), x: hucre % 4, y: Math.floor(hucre / 4) };
    if ((j + k) % 6 === 0) { const f = H[(bas + k + 7) % 16]; if (f !== b.h) b.f = f; }
    const z = j * 3 + k * 11 + taraf * 17;
    if (tip === 0) b.e = [TAM[(j + k * 9 + taraf * 4) % 36], ...(k % 2 ? [TAM[(z + 5) % 36]] : [])];
    else if (tip === 1) b.e = Array.from({ length: 1 + k % 3 }, (_, q) => BIL[(z + q * 3) % 8]);
    else if (tip === 2) b.e = [TAM[(j + k) % 36], BIL[z % 8], OZEL[(j + k + taraf) % OZEL.length]];
    else if (k === 0) b.e = [TAM[j % 36], TAM[(j + 13) % 36], TAM[(j + 25) % 36]];
    else if (k < 3) b.e = [TAM[(j * 5 + k * 7 + taraf) % 36]];
    return b;
  });
  const A = yap(j, 5 + j % 4, 0), B = yap(j + 9, 5 + (j + 2) % 4, 1);
  // her tam eşya en az bir kez taraf 0'ın ilk biriminde: Kut dokunuşu da ona
  if (tip !== 3) A[0].e = [TAM[j % 36], ...(A[0].e || []).slice(0, 2)];
  const opt = { tohum: 9100 + j * 7, alamet: D.ALAMETLER[(j * 3) % D.ALAMETLER.length].id, yz: j % 3 === 2 ? [0, 1] : [1] };
  if (j % 3 !== 2) opt.kut = [{ t: +(0.2 + (j % 25) * 0.2).toFixed(2), taraf: 0, i: j % 3 === 0 ? 0 : j % A.length }];
  savas.push({ elle: true, A, B, opt, sonuc: oyna(A, B, opt), kod: O.kodla(A, 'Eşya ' + j) });
}
// 4c) eşyalı seviyeli botlar: botEsya (r turuna kadarki eşya ganimeti, en güçlü birime yığılır)
for (let i = 0; i < 240; i++) {
  const r = 1 + (i * 7) % 45, sv = O.botSeviye(r), svB = O.botSeviye((r + i) % 45), gA = (i % 5) / 4, gB = ((i * 3) % 5) / 4, tur = r + 1;
  const tA = 3000 + i * 13, tB = 8000 + i * 11;
  const A = O.botEsya(O.botTakim(tur, tA, gA, sv), r, tA), B = O.botEsya(O.botTakim(tur, tB, gB, svB), (r + i) % 45, tB);
  const opt = { tohum: i * 19 + 5, alamet: D.ALAMETLER[(i * 5) % D.ALAMETLER.length].id, yz: i % 2 ? [0, 1] : [1] };
  if (i % 2 === 0) opt.kut = [{ t: +((i % 30) * 0.15 + 0.3).toFixed(2), taraf: 0, i: i % A.length }];
  savas.push({ tur, sv, svB, tohumA: tA, gucA: gA, tohumB: tB, gucB: gB, esyaR: r, esyaRB: (r + i) % 45, A, B, opt, sonuc: oyna(A, B, opt), kod: O.kodla(A, 'Botlu ' + i) });
}

// 4d) canavar turları: eşyalı seviyeli bot × canavar dalgası (Gün Batımı açık; canavar Kut kullanmaz). B, lobi.pveDalga(pveR) ile yeniden kurulur.
const PVE_R = [0, 1, 2, 9, 16, 23, 30, 37, 44];
for (let i = 0; i < 270; i++) {
  const r = PVE_R[i % PVE_R.length], sv = O.botSeviye(r), gA = (i % 5) / 4, tur = r + 1, tA = 4000 + i * 17;
  const A = O.botEsya(O.botTakim(tur, tA, gA * 0.6, sv), r, tA), B = L.pveDalga(r);
  const opt = { tohum: i * 23 + 11, alamet: D.ALAMETLER[(i * 7) % D.ALAMETLER.length].id, yz: i % 3 ? [0] : [], gunBatimi: K0.gunBatimi.basla };
  if (i % 3 === 0) opt.kut = [{ t: +((i % 20) * 0.25 + 0.2).toFixed(2), taraf: 0, i: i % A.length }];
  if (i % 9 === 4) opt.kut = [...(opt.kut || []), { t: 1.5, taraf: 1, i: 0 }]; // canavara Kut: yeteneği erken çalışsın
  savas.push({ tur, sv, svB: 0, tohumA: tA, gucA: gA * 0.6, esyaR: r, pveR: r, A, B, opt, sonuc: oyna(A, B, opt), kod: O.kodla(A, 'Canavar ' + i) });
}
// 4e) Gün Batımı'na giden PvP savaşları: eşyalı seviyeli botlar, Gün Batımı 20 sn (bir kısmı 12 sn: Uzun Gölge alameti için)
for (let i = 0; i < 240; i++) {
  const r = 3 + (i * 11) % 40, sv = O.botSeviye(r), svB = O.botSeviye((r + 3) % 45), gA = (i % 5) / 4, gB = ((i * 2) % 5) / 4, tur = r + 1;
  const tA = 6000 + i * 7, tB = 11000 + i * 5;
  const A = O.botEsya(O.botTakim(tur, tA, gA, sv), r, tA), B = O.botEsya(O.botTakim(tur, tB, gB, svB), r, tB);
  const opt = { tohum: i * 29 + 1, alamet: D.ALAMETLER[(i * 3) % D.ALAMETLER.length].id, yz: i % 2 ? [0, 1] : [1], gunBatimi: i % 4 === 3 ? 12 : K0.gunBatimi.basla };
  if (i % 2 === 0) opt.kut = [{ t: +((i % 30) * 0.2 + 0.4).toFixed(2), taraf: 0, i: i % A.length }];
  savas.push({ tur, sv, svB, tohumA: tA, gucA: gA, tohumB: tB, gucB: gB, esyaR: r, esyaRB: r, A, B, opt, sonuc: oyna(A, B, opt), kod: O.kodla(A, 'Gün Batımı ' + i) });
}
// 4f) elle kurulmuş canavar dalgaları: her canavar her iki tarafta, kahramanlara karşı, eşyalı (Diken Kirpi'ye yakın dövüşçüler vurur)
const CAN = D.CANAVARLAR.map(c => c.id);
for (let j = 0; j < 96; j++) {
  const B = Array.from({ length: 1 + j % 3 }, (_, k) => ({ h: CAN[(j + k * 3) % 8], s: 1, x: (j + k) % 4, y: (j + k * 2) % 3 }));
  const A = Array.from({ length: 3 + j % 5 }, (_, k) => { const hucre = (k * 5 + j) % 12; const b = { h: H[(j * 3 + k * 7) % 16], s: 1 + (j + k) % 3, x: hucre % 4, y: Math.floor(hucre / 4) };
    if ((j + k) % 4 === 0) b.e = [TAM[(j + k * 5) % 36]]; return b; });
  const [X, Y] = j % 2 ? [B, A] : [A, B];
  const opt = { tohum: 13000 + j * 3, alamet: D.ALAMETLER[j % D.ALAMETLER.length].id, yz: [0, 1], ...(j % 3 ? { gunBatimi: 20 } : {}) };
  // düello kodu canavar taşımaz: kod yalnız kahraman tarafı A iken
  savas.push({ elle: true, A: X, B: Y, opt, sonuc: oyna(X, Y, opt), ...(X === A ? { kod: O.kodla(X, 'Elle canavar ' + j) } : {}) });
}

// 4g) uzun tank savaşları: Diken Kabuk ve Diken Kirpi yansıması Gün Batımı'nda (yansıma bir daha çarpılmaz)
const TANK = ['golem', 'kaplumbaga', 'ayi', 'koc', 'kurt', 'bulutat'];
for (let j = 0; j < 60; j++) {
  const yap = (bas, taraf) => [
    { h: j % 2 ? 'kirpi' : 'tasKabuk', s: 1, x: (bas + 1) % 4, y: 0 },
    ...Array.from({ length: 2 + j % 3 }, (_, k) => ({ h: TANK[(bas + k * 2 + taraf) % 6], s: 1 + (j + k) % 2, x: (bas + k + 2) % 4, y: k % 2, e: ['dikenKabuk', ...(k % 2 ? ['anaKaya'] : ['uluKok'])] })),
  ].filter((b, i, l) => l.findIndex(o => o.x === b.x && o.y === b.y) === i);
  const A = yap(j, 0), B = yap(j + 3, 1);
  const opt = { tohum: 17000 + j * 5, alamet: 'yok', yz: [], gunBatimi: j % 3 === 0 ? 12 : j % 3 === 1 ? 16 : 20 };
  savas.push({ elle: true, A, B, opt, sonuc: oyna(A, B, opt) });
}

// 4h) Kut Yankısı, Kut hakkı ve Kut Armağanları (bölüm 6, 7): eşyalı Kut taşıyıcıları, birden çok dokunuş (4 sn kuralı), Çifte Kut,
// Son İki (kutHak 2), kayıtlı dokunuş + yapay zekâ yedeği, Kut Sessizliği, Uzun Gölge, Kusursuz Melez, Karşı Hamle, Üçlü Kaynaşma (f2)
const SAVAS_AR = D.ARMAGANLAR.filter(a => a.savas).map(a => a.id), ALAM = D.ALAMETLER.map(a => a.id), RK = S.rng(777001);
const kutTasiyici = (j, k) => { const l = [[TAM[(j * 7 + k) % 36]], [BIL[(j + k) % 8], BIL[(j * 3 + k) % 8]], ['kutOcagi', BIL[j % 8]], ['kutTasi', TAM[(j + k * 11) % 36], BIL[(j * 5) % 8]],
  [TAM[j % 36], TAM[(j + 17) % 36], 'kutTasi'], ['yirticiPence', 'anaKaya', 'kutTasi'], ['ciy', 'ciy', 'bilgeAsasi'], ['pul', 'kabuk', 'yurek']]; return l[(j + k) % l.length]; };
let kutSavasSay = 0;
for (let j = 0; j < 360; j++) {
  const yap = (bas, n, taraf) => Array.from({ length: n }, (_, k) => {
    const hucre = (k * 5 + j + taraf * 7) % 12;
    const b = { h: H[(bas + k * 7) % 16], s: 1 + ((j + k + taraf) % 3), x: hucre % 4, y: Math.floor(hucre / 4) };
    if ((j + k + taraf) % 4 === 0) { const f = H[(bas + k + 5) % 16]; if (f !== b.h) { b.f = f; if ((j + k) % 3 === 0) { const f2 = H[(bas + k + 9) % 16]; if (f2 !== b.h && f2 !== f) b.f2 = f2; } } }
    if (k < 3 || RK() < 0.4) b.e = kutTasiyici(j + taraf * 3, k);
    return b;
  });
  const A = yap(j, 4 + j % 5, 0), B = yap(j + 6, 4 + (j + 3) % 5, 1);
  const arm = (tr) => SAVAS_AR.filter(() => RK() < 0.3 + 0.2 * tr);
  const opt = { tohum: 23000 + j * 11, alamet: j % 5 === 0 ? 'kutSessiz' : j % 5 === 1 ? 'uzunGolge' : ALAM[(j * 7) % ALAM.length], armagan: [arm(0), arm(1)] };
  if (j % 2 === 0) opt.gunBatimi = 20;
  if (j % 3 === 0) opt.kutHak = [2, 2];
  const t0 = +(0.3 + (j % 17) * 0.35).toFixed(2), ka = [{ t: t0, taraf: 0, i: j % A.length }, { t: +(t0 + 2.5).toFixed(2), taraf: 0, i: (j + 1) % A.length }, { t: +(t0 + 4.6).toFixed(2), taraf: 0, i: (j + 2) % A.length }];
  const tip = j % 4; // 0: iki taraf yapay zekâ, 1: taraf 0 dokunuş + taraf 1 yapay zekâ, 2: taraf 1 kayıtlı dokunuş + yedek, 3: ikisi dokunuş + yedek
  if (tip === 0) opt.yz = [0, 1];
  else if (tip === 1) { opt.kut = ka; opt.yz = [1]; }
  else if (tip === 2) { opt.kut = [{ t: +(1 + (j % 9) * 0.9).toFixed(2), taraf: 1, i: (j * 3) % B.length }]; opt.yz = [0]; opt.yzYedek = [1]; }
  else { opt.kut = [...ka.slice(0, 2), { t: +(0.5 + (j % 11) * 0.7).toFixed(2), taraf: 1, i: B.length - 1 }]; opt.yzYedek = [0, 1]; }
  savas.push({ elle: true, A, B, opt, sonuc: oyna(A, B, opt) }); kutSavasSay++;
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
const rastBirim = () => { const b = { h: H[Math.floor(R0() * 16)], s: 1 + Math.floor(R0() * 3) }; if (R0() < 0.2) { b.f = H[Math.floor(R0() * 16)]; if (R0() < 0.3) b.f2 = H[Math.floor(R0() * 16)]; } return b; };
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

// 7) tur planı, birikimli ekonomi ve kaybedince hasar (lobi.js)
const turPlan = Array.from({ length: 90 }, (_, r) => ({ ...L.turPlan(r), ad: L.turAd(r) }));
const rastSeri = () => { const n = Math.floor(R0() * 9); return n === 0 && R0() < 0.5 ? { tip: null, n: 0 } : { tip: R0() < 0.5 ? 'G' : 'M', n }; };
const alametId = () => D.ALAMETLER[Math.floor(R0() * D.ALAMETLER.length)].id;
const gelir = [];
for (let i = 0; i < 400; i++) {
  const r = Math.floor(R0() * 60), altin = Math.floor(R0() * 130) - (i % 50 === 0 ? 5 : 0), seri = rastSeri(), gal = R0() < 0.5, al = i % 7 === 0 ? 'pazar' : alametId();
  const ft = i % 3 === 0 ? K.armaganSayi.bereketFaiz : 0; // Bereket Küpü: faiz tavanı 7
  gelir.push({ r, altin, seri, galibiyet: gal, alamet: al, faizTavan: ft, sonuc: L.gelirHesapla(r, altin, seri, gal, al, ft || undefined) });
}
const seri = [];
for (let i = 0; i < 200; i++) {
  const s0 = rastSeri(), k = Math.floor(R0() * 3) - 1, tip = ['pvp', 'pve', 'kervan'][i % 5 < 3 ? 0 : i % 5 === 3 ? 1 : 2];
  seri.push({ seri: s0, kazanan: k, tip, sonuc: L.seriGuncelle(s0, k, tip) });
}
const hasar = [];
for (let i = 0; i < 400; i++) {
  const r = Math.floor(R0() * 70), k = Math.floor(R0() * 3) - 1, kp = Math.floor(R0() * 25), ks = Math.floor(R0() * 9), y = [0, 0, 2, 3, 4, 8][i % 6];
  hasar.push({ r, kazanan: k, kalanPuan: kp, kalanSayi: ks, yasayan: y, sonuc: L.kayipHasar(r, k, kp, ks, y) });
}
const kaynastir = [];
for (let a = 0; a <= 3; a++) for (let b = 0; b <= 3; b++) kaynastir.push({ a, b, sonuc: L.kaynastirBedel(a, b) });
const ganimet = Array.from({ length: 60 }, (_, r) => L.ganimetAltin(r));
// tam ekonomi zincirleri: her tur gelir → harcama (kayıtlı) → savaş sonucu (kayıtlı) → tur sonu; her adımın durumu kaydedilir
const zincir = [];
for (let z = 0; z < 120; z++) {
  const d = { altin: 0, can: 100, seri: { tip: null, n: 0 }, galibiyet: false, seviye: 2, xp: 0, armagan: z % 5 === 2 ? ['bereketKupu'] : [] }, turlar = [];
  const yasayan = z % 4 === 0 ? 3 : z % 4 === 1 ? 2 : 0;
  for (let r = 0; r < 40 && d.can > 0; r++) {
    const al = alametId(), gl = L.turBasi(d, r, al);
    const harca = Math.min(d.altin, Math.floor(R0() * (d.altin + 1) * (z % 3 === 0 ? 0.3 : 0.8)));
    d.altin -= harca;
    const xpAl = d.altin >= 4 && R0() < 0.25 && d.seviye < 8; if (xpAl) { d.altin -= 4; const x = L.xpEkle(d.seviye, d.xp, 4); d.seviye = x.seviye; d.xp = x.xp; }
    const sonuc = { kazanan: Math.floor(R0() * 3) - 1, kalanPuan: Math.floor(R0() * 16), kalanSayi: Math.floor(R0() * 8) };
    if (sonuc.kazanan === -1 && R0() < 0.6) sonuc.kazanan = 1;
    const ts = L.turSonu(d, r, sonuc, yasayan);
    turlar.push({ r, alamet: al, harca, xpAl, sonuc, gelir: gl, ozet: ts, durum: JSON.parse(JSON.stringify(d)) });
  }
  zincir.push({ yasayan, armagan: d.armagan, turlar });
}

// 8) eşya kuralları (lobi.js) ve birim istatistiği (sim.birimStat)
const tumEsya = [...TAM, ...BIL, ...OZEL, ...SOYID.map(x => 'muhur-' + x)];
const rastEsya = () => tumEsya[Math.floor(R0() * tumEsya.length)];
const rastEBirim = () => { const b = rastBirim(); const n = Math.floor(R0() * 5); if (n) b.e = Array.from({ length: n }, rastEsya); return b; };
const esyaStat = [];
for (let i = 0; i < 300; i++) {
  const b = rastEBirim(), st = S.birimStat(b);
  esyaStat.push({ b, km: i % 4 === 3 ? K.armaganSayi.kusursuzMelez : 0, sonuc: { can: (i % 4 === 3 ? S.birimStat(b, K.armaganSayi.kusursuzMelez) : st).can, atk: (i % 4 === 3 ? S.birimStat(b, K.armaganSayi.kusursuzMelez) : st).atk, yankiSira: st.yankiSira, asEk: st.asEk, yg: st.yg, mana0: st.mana0, azalt: st.azalt, cal: st.cal, kalkan0: st.kalkan0, esya: st.esya, soy: st.soy, kutTasi: st.kutTasi, yanki: st.kutYanki } });
}
const esyaTak = [];
for (let i = 0; i < 400; i++) { const b = rastEBirim(), id = i % 3 === 0 ? BIL[Math.floor(R0() * 8)] : rastEsya(); esyaTak.push({ b, id, sonuc: L.esyaTak(b, id) }); }
const esyaTopla = [];
for (let i = 0; i < 200; i++) {
  const b = rastBirim(), listeler = Array.from({ length: 2 + Math.floor(R0() * 2) }, () => Array.from({ length: Math.floor(R0() * 4) }, () => (R0() < 0.4 ? BIL[Math.floor(R0() * 8)] : rastEsya())));
  esyaTopla.push({ b, listeler, sonuc: L.esyaToplaBirim(b, listeler) });
}
const rafBirlestir = [];
for (let i = 0; i < 150; i++) {
  const raf = Array.from({ length: 1 + Math.floor(R0() * 10) }, () => (R0() < 0.6 ? BIL[Math.floor(R0() * 8)] : rastEsya()));
  const a = Math.floor(R0() * raf.length), b2 = Math.floor(R0() * raf.length);
  rafBirlestir.push({ raf, i: a, j: b2, sonuc: L.rafBirlestir(raf, a, b2) });
}
const ganimetEsya = [];
for (let i = 0; i < 300; i++) { const r = i % 60, tohum = 5000 + i * 37; ganimetEsya.push({ r, tohum, sonuc: L.ganimetEsya(r, S.rng(tohum)) }); }

// 9) canavar turu, ganimet, Kervan, bedava kahraman seçimi (lobi.js)
const rastKalan = (tip) => { const k = {}; for (const h of D.KAHRAMANLAR) { const tam = K.havuzAdet[h.kademe];
  k[h.id] = tip === 0 ? tam : tip === 1 ? Math.floor(R0() * (tam + 1)) : tip === 2 ? (R0() < 0.7 ? 0 : 1 + Math.floor(R0() * 3)) : (R0() < 0.9 ? 0 : 1); } return k; };
const pveDalga = Array.from({ length: 60 }, (_, r) => L.pveDalga(r));
const ganimetV = [];
for (let i = 0; i < 600; i++) {
  const r = [0, 1, 2, 9, 16, 23, 30, 37, 44, 3, 6][i % 11] + (i % 23 === 0 ? 1 : 0), tohum = 21000 + i * 41, kalan = i % 5 === 4 ? null : rastKalan(i % 4);
  ganimetV.push({ r, tohum, kalan, sonuc: L.ganimet(r, S.rng(tohum), kalan) });
}
const kervanV = [];
for (let i = 0; i < 400; i++) {
  const r = [6, 13, 20, 27, 34, 41, 48, 5][i % 8], tohum = 31000 + i * 43, adet = L.kervanAdet(1 + i % 8), kalan = i % 5 === 4 ? null : rastKalan(i % 4);
  kervanV.push({ r, tohum, adet, kalan, sonuc: L.kervanSecenek(r, S.rng(tohum), adet, kalan) });
}
const baslangic = [];
for (let i = 0; i < 150; i++) { const tohum = 41000 + i * 7, kalan = i % 3 === 2 ? null : rastKalan(i % 4); baslangic.push({ tohum, kalan, sonuc: L.baslangicSecenek(S.rng(tohum), kalan) }); }
const kervanAdet = Array.from({ length: 11 }, (_, i) => L.kervanAdet(i - 1));

// 10) 8 kişilik hayalet lobi: bot izi, kayıtlı iz, lobi izleri, alamet, eşleşme, kupa, tam lobi benzetimleri (online.js, lobi.js)
const RL = S.rng(424242);
const izEgriV = Array.from({ length: 140 }, (_, i) => { const r = i * 0.37; return { r, v: O.izEgri(r) }; });
const botIzV = [];
for (let i = 0; i < 400; i++) { const tohum = Math.floor(RL() * 1e9), guc = [0, 0.25, 0.5, 0.75, 1, RL()][i % 6], r = i % 46; botIzV.push({ tohum, guc, r, sonuc: O.botIzTur(tohum, guc, r) }); }
const izKayit = (t, g, n, kutlu) => O.botIz(t, g, n).filter((x, k) => L.turPlan(k).tip !== 'kervan' && (k % 3 !== 1 || n % 2)).map((x, k) => (kutlu && k % 2 ? { ...x, kut: { i: k % x.takim.length, t: 2 + (k % 7) * 0.65 } } : x));
const izTurV = [];
for (let i = 0; i < 200; i++) { const turlar = izKayit(100 + i * 31, (i % 5) / 4, 2 + i % 24, i % 4 === 1), r = (i * 7) % 52; izTurV.push({ turlar, r, sonuc: O.izTur({ turlar }, r) }); }
const lobiIzV = [];
for (let i = 0; i < 80; i++) {
  const kupa = (i * 53) % 900, tohum = 7000 + i * 11;
  const kayit = i % 2 ? [] : Array.from({ length: i % 11 }, (_, k) => ({ macId: 'm' + k, oyuncu: k % 5 === 4 ? null : 'o' + (k % 4), ad: k % 6 === 5 ? '' : 'Ad' + k, kupa: kupa + ((k * 67) % 400) - 200, sira: k % 9, surum: k % 3 === 0 ? 2 : 1, turlar: [O.botIzTur(k + 1, 0.5, 3 + k)] }));
  const oyuncu = i % 3 ? 'o1' : null, surum = i % 4 === 0 ? 1 : null;
  lobiIzV.push({ kupa, tohum, kayit, oyuncu, surum, sonuc: O.lobiIzler(kupa, tohum, kayit, oyuncu, surum) });
}
const alametV = Array.from({ length: 200 }, (_, i) => { const tohum = Math.floor(RL() * 4294967296), r = i % 50; return { tohum, r, al: L.lobiAlamet(tohum, r) }; });
const kupaV = [];
for (const sira of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) for (const kupa of [0, 5, 20, 399, 400, 401, 1000]) kupaV.push({ sira, kupa, d: L.kupaDegisim(sira, kupa) });
const lobiKur = (tohum, kupa, kayitli, canli) => {
  const iz = O.lobiIzler(kupa, tohum, [], null, null, 8);
  if (kayitli) for (let k = 1; k < 8; k += 3) iz[k] = { ad: iz[k].ad, kupa, turlar: izKayit(iz[k].bot.tohum, iz[k].bot.guc, 8 + k * 3, true) };
  return L.lobiYeni(canli ? { ad: 'Sen', kupa } : { ad: iz[0].ad, kupa, iz: iz[0].bot ? { bot: iz[0].bot } : { turlar: iz[0].turlar } }, iz.slice(1), tohum * 2654435761);
};
const eslesmeV = [];
for (let i = 0; i < 300; i++) {
  const lb = lobiKur(500 + i, 300, false, false);
  for (const o of lb.oyuncular) { o.olu = RL() < 0.3; o.sonYansima = RL() < 0.3; o.gecmisRakip = Array.from({ length: Math.floor(RL() * 6) }, () => Math.floor(RL() * 9) - 1); }
  const r = 3 + (i % 40);
  eslesmeV.push({ tohum: lb.tohum, olu: lb.oyuncular.map(o => o.olu), sonYansima: lb.oyuncular.map(o => o.sonYansima), gecmis: lb.oyuncular.map(o => o.gecmisRakip), r, es: L.eslesmeKur(lb, r) });
}
const lobiV = [];
for (let n = 0; n < 24; n++) {
  const tohum = 90000 + n * 977, kupa = (n * 41) % 700, kayitli = n % 3 === 1, canli = n % 4 === 3;
  const lb = lobiKur(tohum, kupa, kayitli, canli), turlar = [];
  while (!L.lobiBitti(lb) && lb.r < K.lobiTurTavan) {
    const r = lb.r, p = L.turPlan(r), es = p.tip === 'pvp' ? L.eslesmeKur(lb, r) : null, kayit = { r, es };
    const ops = { eslesme: es || undefined };
    if (canli && !lb.oyuncular[0].olu && p.tip !== 'kervan') {
      // canlı oyuncu: bot izi kadrosuyla kendi savaşını oynar (oyun.js gibi), sonucu lobiye verilir
      const ct = O.botIzTur(tohum + 5, 0.6, r).takim, rk = es ? L.lobiRakip(es, 0) : null;
      const rakip = p.tip === 'pve' ? L.pveDalga(r) : rk ? L.lobiKadro(lb, rk.j, r, ct).takim : null;
      if (rakip) { const s2 = S.Savas(ct, rakip, { tohum: tohum + r, alamet: L.lobiAlamet(lb.tohum, r), yz: p.tip === 'pve' ? [0] : [0, 1], gunBatimi: K.gunBatimi.basla }).sonunaKadar();
        ops.canliTakim = ct; ops.canliSonuc = { kazanan: s2.kazanan, kalanPuan: s2.kalanPuan, kalanSayi: s2.kalanSayi, sure: s2.sure }; kayit.canliTakim = ct; kayit.canliSonuc = ops.canliSonuc; }
    }
    const rp = L.lobiTurOyna(lb, r, ops);
    kayit.alamet = rp.alamet; kayit.sonuclar = rp.sonuclar; kayit.hasar = rp.hasar; kayit.elenen = rp.elenen; kayit.can = lb.oyuncular.map(o => o.can);
    kayit.sira = lb.oyuncular.map(o => L.lobiSira(lb, o.i)); kayit.seri = lb.oyuncular.map(o => (o.seri.tip || '') + o.seri.n);
    if (r % 6 === 2) kayit.havuz = L.havuzLobi(lb, r, O.botIzTur(tohum, 0.5, r).takim);
    turlar.push(kayit);
  }
  L.lobiSonaKadar(lb);
  lobiV.push({ tohum, kupa, kayitli, canli, turlar, sira: lb.oyuncular.map(o => o.sira), elenmeR: lb.oyuncular.map(o => o.elenmeR) });
}

// 11) Kut Armağanı kuralları (lobi.js): aşama seçenekleri, yenileme (haric), savaş armağanları, bot armağanları, alamet sırası
const RA = S.rng(515151), ARID = D.ARMAGANLAR.map(a => a.id);
const armaganV = [];
for (let i = 0; i < 300; i++) {
  const bolum = 1 + i % 6, tohum = 60000 + i * 37, alinan = ARID.filter(() => RA() < (i % 3) * 0.3);
  armaganV.push({ bolum, tohum, alinan, sonuc: L.armaganSecenek(bolum, S.rng(tohum), alinan) });
}
const armaganCekV = [];
for (let i = 0; i < 200; i++) {
  const kd = K.armagan.kademeler[i % 3], tohum = 61000 + i * 41, alinan = ARID.filter(() => RA() < 0.35), haric = ARID.filter(() => RA() < 0.25);
  armaganCekV.push({ kd, tohum, alinan, haric, sonuc: L.armaganCek(kd, S.rng(tohum), alinan, haric) });
}
const savasArmaganV = [];
for (let i = 0; i < 120; i++) { const liste = [...ARID.filter(() => RA() < 0.3), ...(i % 7 === 0 ? ['yokBoyle'] : [])], can = i % 9 === 0 ? null : Math.floor(RA() * 101); savasArmaganV.push({ liste, can, sonuc: L.savasArmagan(liste, can) }); }
const botArmaganV = Array.from({ length: 120 }, (_, i) => { const tohum = Math.floor(RA() * 1e9), r = i % 45; return { tohum, r, sonuc: L.botArmagan(tohum, r) }; });
const alametSiraV = Array.from({ length: 60 }, (_, i) => { const tohum = Math.floor(RA() * 4294967296), r = i % 40; return { tohum, r, n: 1 + i % 3, sonuc: L.alametSirasi(tohum, r, 1 + i % 3) }; });

const fs = require('fs'), path = require('path');
const out = path.join(__dirname, '..', 'unity', 'Test', 'esdeger.json');
fs.writeFileSync(out, JSON.stringify({ savas, kut1, kut2, xp, havuz, dukkan, botSeviye, ekonomi: { turPlan, gelir, seri, hasar, kaynastir, ganimet, zincir },
  esya: { stat: esyaStat, tak: esyaTak, topla: esyaTopla, raf: rafBirlestir, ganimet: ganimetEsya },
  canavar: { pveDalga, ganimet: ganimetV, kervan: kervanV, baslangic, kervanAdet },
  armagan: { secenek: armaganV, cek: armaganCekV, savas: savasArmaganV, bot: botArmaganV, alametSira: alametSiraV },
  lobi: { izEgri: izEgriV, botIz: botIzV, izTur: izTurV, lobiIz: lobiIzV, alamet: alametV, kupa: kupaV, eslesme: eslesmeV, lobi: lobiV } }));
const k = savas.map(v => v.sonuc.sonuc.kazanan);
console.log('savaş', savas.length, '(A kazanır', k.filter(x => x === 0).length, '· B', k.filter(x => x === 1).length, '· berabere', k.filter(x => x === -1).length + ')',
  '| Kut (yankı, hak, armağan) savaşı', kutSavasSay, '(Kut sayıları ' + JSON.stringify(savas.slice(-kutSavasSay).reduce((o, v) => { const k = v.sonuc.sonuc.kut.join('-'); o[k] = (o[k] || 0) + 1; return o; }, {})) + ')',
  '| armağan: seçenek', armaganV.length, 'yenileme', armaganCekV.length, 'savaş', savasArmaganV.length, 'bot', botArmaganV.length, 'alamet sırası', alametSiraV.length,
  '| KUT1 kodu', kut1.length, '| KUT2 kodu', kut2.length, '(bozuk ' + kut2.filter(v => !v.cozum).length + ')', '| deneyim', xp.length, '| havuz', havuz.length, '| dükkân', dukkan.length,
  '| ekonomi: tur planı', turPlan.length, 'gelir', gelir.length, 'seri', seri.length, 'hasar', hasar.length, 'kaynaştırma', kaynastir.length, 'ganimet', ganimet.length,
  'zincir', zincir.length, '(' + zincir.reduce((t, z) => t + z.turlar.length, 0) + ' tur)',
  '| eşya: savaş', savas.filter(v => [...v.A, ...v.B].some(b => b.e && b.e.length)).length, 'istatistik', esyaStat.length, 'takma', esyaTak.length, 'toplama', esyaTopla.length, 'raf', rafBirlestir.length, 'ganimet', ganimetEsya.length,
  '| canavar: savaş', savas.filter(v => [...v.A, ...v.B].some(b => D.canavar(b.h))).length, 'Gün Batımı', savas.filter(v => v.opt.gunBatimi != null).length,
  '(30 sn\'ye kalan', savas.filter(v => v.opt.gunBatimi != null && v.sonuc.sonuc.sure >= 30).length + ')', 'dalga', pveDalga.length, 'ganimet', ganimetV.length, 'Kervan', kervanV.length, 'bedava seçim', baslangic.length,
  '| lobi: eğri', izEgriV.length, 'bot izi', botIzV.length, 'kayıtlı iz', izTurV.length, 'lobi izleri', lobiIzV.length, 'alamet', alametV.length, 'kupa', kupaV.length, 'eşleşme', eslesmeV.length,
  'tam lobi', lobiV.length, '(' + lobiV.reduce((t, l) => t + l.turlar.length, 0) + ' tur, ' + lobiV.reduce((t, l) => t + l.turlar.reduce((u, x) => u + x.sonuclar.length, 0), 0) + ' lobi savaşı)', '→', out);
