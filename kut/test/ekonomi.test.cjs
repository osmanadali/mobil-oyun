// node kut/test/ekonomi.test.cjs — lobi.js: tur planı, birikimli ekonomi (gelir, faiz, seri, galibiyet, ganimet altını),
// kaybedince alınan hasar ve beklenen altın eğrisi (OYNANIS_DERINLIK.md 1.1, 3, 4.4)
const D = require('../data.js'), L = require('../lobi.js');
const K = D.KURAL;
let hata = 0; const ok = (c, m) => { if (!c) { hata++; console.log('✗', m); } else console.log('✓', m); };

// 1) KURAL: belgedeki sayılar
ok(K.tabanGelirBolum1.join() === '3,3,4' && K.tabanGelir === 5 && K.faizAdim === 10 && K.faizTavan === 5, 'taban 3/3/4 sonra 5; faiz her 10 altına 1, en çok 5');
ok(K.galibiyetBonus === 1 && K.pazarBonus === 2 && K.yenile === 2 && K.hizli.yenile === 1, 'galibiyet +1, Bereketli Pazar +2, yenileme 2 (Hızlı Maç 1)');
ok(K.canBaslangic === 100 && K.bolumTabani.join() === '0,0,4,8,12,16,20,24' && K.sonUcEk === 3 && K.sonIkiEk === 5, '100 can, bölüm tabanı 0/4/8/12/16/20/24 (lobi benzetimiyle ayarlı), Son Üç +3, Son İki +5');

// 2) tur planı (bölüm 1.1)
const adlar = Array.from({ length: 25 }, (_, r) => L.turAd(r));
ok(adlar.slice(0, 11).join() === '1-1,1-2,1-3,2-1,2-2,2-3,2-4,2-5,2-6,2-7,3-1' && adlar[24] === '5-1', 'tur adları: 1-1…1-3, sonra bölüm başına 7 tur');
ok([0, 1, 2].every(r => L.turPlan(r).tip === 'pve') && L.turPlan(6).tip === 'kervan' && L.turPlan(9).tip === 'pve' && L.turPlan(13).tip === 'kervan' && L.turPlan(3).tip === 'pvp', 'bölüm 1 canavar; x-4 Kervan; x-7 canavar; diğerleri PvP');
ok(L.turPlan(3).armagan && L.turPlan(11).armagan && L.turPlan(19).armagan && adlar.filter((_, r) => L.turPlan(r).armagan).join() === '2-1,3-2,4-3', 'Kut Armağanı 2-1, 3-2, 4-3');

// 3) gelir
ok([0, 1, 2, 3, 10, 40].map(L.tabanGelir).join() === '3,3,4,5,5,5', 'taban geliri tura göre');
ok(L.faiz(49, 2) === 0 && L.faiz(9, 3) === 0 && L.faiz(10, 3) === 1 && L.faiz(37, 3) === 3 && L.faiz(50, 3) === 5 && L.faiz(200, 3) === 5 && L.faiz(-4, 3) === 0, 'faiz: bölüm 1 yok, floor(altın/10), 50 altında doyar');
ok([0, 1, 2, 3, 4, 5, 6, 12].map(L.seriBonus).join() === '0,0,1,2,2,3,3,3', 'seri bonusu: 2 → 1, 3–4 → 2, 5+ → 3');
const g = L.gelirHesapla(5, 37, { tip: 'M', n: 3 }, true, 'pazar');
ok(g.taban === 5 && g.faiz === 3 && g.seri === 2 && g.galibiyet === 1 && g.alamet === 2 && g.toplam === 13, 'gelir = taban + faiz + seri + galibiyet + alamet (5+3+2+1+2 = 13)');
ok(L.gelirHesapla(6, 50, { tip: 'G', n: 6 }, true, 'pazar').toplam === 0, 'Kervan turunda gelir yok');
ok(L.gelirHesapla(0, 0, null, false, 'yok').toplam === 3 && L.gelirHesapla(2, 30, { tip: 'G', n: 2 }, false, 'yok').toplam === 5, '1-1 başlangıç 3; bölüm 1\'de faiz yok (seri varsa sayılır)');

// 4) seri
let s = { tip: null, n: 0 };
s = L.seriGuncelle(s, 0, 'pvp'); s = L.seriGuncelle(s, 0, 'pvp'); ok(s.tip === 'G' && s.n === 2, 'iki galibiyet → G2');
s = L.seriGuncelle(s, -1, 'pvp'); ok(s.tip === 'G' && s.n === 2, 'beraberlik seriyi bozmaz, uzatmaz');
s = L.seriGuncelle(s, 1, 'pve'); ok(s.tip === 'G' && s.n === 2, 'canavar turu seriyi bozmaz');
s = L.seriGuncelle(s, 1, 'pvp'); ok(s.tip === 'M' && s.n === 1, 'yenilgi kazanma serisini bitirir → M1');

// 5) harcamalar
ok(L.kaynastirBedel(1, 1) === 3 && L.kaynastirBedel(1, 3) === 5 && L.kaynastirBedel(2, 1) === 4, 'kaynaştırma 2 + en yüksek kademe (3–5)');
ok(L.ganimetAltin(0) === 0 && L.ganimetAltin(1) === 2 && L.ganimetAltin(2) === 2 && L.ganimetAltin(16) === 3 && L.ganimetAltin(9) === 0, 'ganimet altını: 1-2 +2, 1-3 +2, 3-7 +3');

// 6) kaybedince alınan hasar (bölüm 4.4)
const r2 = 4, r3 = 10, r4 = 17, r5 = 24, r7 = 3 + 7 * 5;
ok(L.kayipHasar(r2, 1, 4, 3)[0] === 8 && L.kayipHasar(r2, 1, 4, 3)[1] === 0, '2-2 yenilgi: 4 + 4 kalan yıldız = 8');
ok(L.kayipHasar(r3, 0, 5, 3).join() === '0,13' && L.kayipHasar(r4, 1, 7, 4)[0] === 19 && L.kayipHasar(r5, 1, 3, 2)[0] === 19 && L.kayipHasar(r7, 1, 0, 0)[0] === 24, 'taban bölüm 3: 8, 4: 12, 5: 16, 7+: 24');
ok(L.kayipHasar(r3, -1, 0, 0).join() === '8,8', 'beraberlik: iki taraf da yalnız taban');
ok(L.kayipHasar(0, 1, 6, 3).join() === '0,0' && L.kayipHasar(2, 1, 6, 3).join() === '0,0', 'bölüm 1 canavar: hasar yok');
ok(L.kayipHasar(9, 1, 6, 3).join() === '7,0' && L.kayipHasar(9, 0, 0, 0).join() === '0,0', '2-7 canavar yenilgisi: taban 4 + kalan canavar sayısı 3; canavar can kaybetmez');
ok(L.kayipHasar(6, 1, 9, 9).join() === '0,0', 'Kervan turunda hasar yok');
ok(L.kayipHasar(r4, 1, 2, 2, 3)[0] === 17 && L.kayipHasar(r4, 1, 2, 2, 2)[0] === 19 && L.kayipHasar(r4, -1, 0, 0, 2).join() === '17,17', 'Son Üç taban +3, Son İki +5');

// 7) tur sonu: durum yerinde değişir
{
  const d = { altin: 0, can: 100, seri: { tip: null, n: 0 }, galibiyet: false, seviye: 2, xp: 0 };
  L.turBasi(d, 0, 'yok'); ok(d.altin === 3, '1-1 başı 3 altın');
  let o = L.turSonu(d, 0, { kazanan: 1, kalanPuan: 4, kalanSayi: 2 }); ok(o.hasar === 0 && d.can === 100 && d.xp === 0 && d.seviye === 2, '1-1 sonu: hasar yok, deneyim yok');
  L.turBasi(d, 1, 'yok'); o = L.turSonu(d, 1, { kazanan: 0, kalanPuan: 2, kalanSayi: 2 });
  ok(d.altin === 8 && o.altin === 2 && d.seviye === 3 && !d.galibiyet && d.seri.n === 0, '1-2: +3 gelir, +2 ganimet, +2 deneyim (Sv 3); canavar galibiyeti seri ve galibiyet saymaz');
  L.turBasi(d, 3, 'yok'); L.turSonu(d, 3, { kazanan: 0, kalanPuan: 2, kalanSayi: 2 }); ok(d.galibiyet && d.seri.tip === 'G' && d.seri.n === 1, '2-1 PvP galibiyeti: galibiyet bonusu hazır, G1');
  const once = d.altin; const gl = L.turBasi(d, 4, 'yok'); ok(gl.galibiyet === 1 && gl.faiz === Math.floor(once / 10) && d.altin === once + gl.toplam, '2-2 başı: galibiyet +1 ve faiz eklendi');
  o = L.turSonu(d, 4, { kazanan: 1, kalanPuan: 5, kalanSayi: 3 }); ok(o.hasar === 9 && d.can === 91 && !d.galibiyet && d.seri.tip === 'M', '2-2 yenilgi: −9 can (4 + 5), galibiyet bonusu düştü');
  d.can = 4; L.turSonu(d, 17, { kazanan: 1, kalanPuan: 6, kalanSayi: 4 }); ok(d.can === 0, 'can 0\'ın altına inmez');
  const tavan = { altin: 0, can: 50, seri: { tip: null, n: 0 }, galibiyet: false, seviye: 8, xp: 0 };
  ok(L.turSonu(tavan, 5, { kazanan: 0, kalanPuan: 1, kalanSayi: 1 }).xp === 0 && tavan.seviye === 8 && tavan.xp === 0, 'Sv 8: savaş deneyimi eklenmez');
}

// 8) beklenen altın eğrisi (bölüm 3.4). "An" = o turun hazırlığı başında, gelir eklenmeden önceki altın.
//   Dengeli: bölüm 1'de tur başına 1 altın harcar, sonra her tur 5 altın (kahraman, yenileme); 3-5'ten sonra Sv 6 için deneyim alır.
//   Biriktiren: bölüm 1'de harcamaz, sonra her tur 3 altın harcar, deneyim almaz; 50'nin üstünü harcar (faiz 50'de doyar).
function benzet(harca, sonuc) {
  const d = { altin: 0, can: 100, seri: { tip: null, n: 0 }, galibiyet: false, seviye: 2, xp: 0 }, iz = {}; let elli = null;
  for (let r = 0; r <= 24; r++) {
    const p = L.turPlan(r), ad = L.turAd(r);
    iz[ad] = { altin: d.altin, sv: d.seviye }; if (elli === null && d.altin >= 50) elli = ad;
    L.turBasi(d, r, 'yok');
    if (p.tip === 'kervan') continue;
    harca(d, p);
    L.turSonu(d, r, { kazanan: sonuc(r), kalanPuan: 3, kalanSayi: 2 });
  }
  return { iz, elli };
}
const xpAl = (d) => { d.altin -= K.xpBedel; const x = L.xpEkle(d.seviye, d.xp, K.xpMiktar); d.seviye = x.seviye; d.xp = x.xp; };
const dengeli = (d, p) => {
  if (p.bolum === 1) { d.altin -= Math.min(d.altin, 1); return; }
  let butce = 5;
  if ((p.bolum > 3 || (p.bolum === 3 && p.tur >= 5)) && d.seviye < 6) while (d.seviye < 6 && d.altin >= K.xpBedel && butce > 0) { xpAl(d); butce -= K.xpBedel; }
  d.altin -= Math.min(d.altin, Math.max(0, butce));
};
const biriktiren = (d, p) => { if (p.bolum === 1) return; d.altin -= Math.min(d.altin, 3); if (d.altin > 50) d.altin -= Math.min(d.altin - 50, 8); };
const yariYariya = (r) => (r % 2 ? 0 : 1), hepYenilgi = () => 1;
const ar = (x, a, b) => x >= a && x <= b;
for (const [ad, s] of [['yarı yarıya', yariYariya], ['hep yenilgi', hepYenilgi]]) {
  const dn = benzet(dengeli, s).iz, bi = benzet(biriktiren, s);
  const yaz = (iz) => ['2-1', '3-1', '4-1'].map(k => `${k} ${iz[k].altin} (Sv${iz[k].sv})`).join(', ');
  console.log(`  ${ad}: dengeli ${yaz(dn)} · biriktiren ${yaz(bi.iz)} · 50'ye ilk ${bi.elli}`);
  if (ad === 'yarı yarıya') ok(ar(dn['2-1'].altin, 10, 14) && ar(dn['3-1'].altin, 20, 30) && ar(dn['4-1'].altin, 30, 50) && dn['4-1'].sv === 6, `dengeli oyuncu (${ad}): 2-1 10–14, 3-1 20–30, 4-1 30–50 ve Sv 6`);
  ok(bi.iz['2-1'].altin === 14 && ar(bi.iz['3-1'].altin, 40, 50) && bi.iz['4-1'].altin >= 50 && bi.iz['4-1'].sv === 5, `biriktiren oyuncu (${ad}): 2-1 14, 3-1 40–50, 4-1 50+ ve Sv 5`);
  ok(['3-2', '3-3', '3-5'].includes(bi.elli), `biriktiren (${ad}) 50 altına 3-2 ile 3-5 arasında ulaşır (${bi.elli})`);
}

console.log(hata ? `${hata} HATA` : 'hepsi geçti');
process.exitCode = hata ? 1 : 0;
