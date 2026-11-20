// node kut/test/kut.test.cjs — Kut Yankısı (OYNANIS_DERINLIK.md 7.1), Kut hakkı (7.2), yapay zekâ Kut'u (7.4), Kut Armağanı (6),
// lobi alametleri (8). Motor: sim.js; kurallar: lobi.js; bot armağanları: online.js.
const D = require('../data.js'), S = require('../sim.js'), L = require('../lobi.js'), O = require('../online.js');
const K = D.KURAL, KY = K.kutYanki, AS = K.armaganSayi;
let hata = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) hata++; };
const yakin = (a, b) => Math.abs(a - b) < 1e-9;
// yetenek kurulumu (KURAL.savas.kurulum): mana dolunca yetenek kurulum süresi sonra etki eder → birimin 'yetenek' olayına dek adım at
const yetBekle = (sv, uid) => { for (let i = 0; i < 40 && !sv.bitti; i++) { sv.adim(); if (sv.fx.some(f => f.tip === 'yetenek' && f.u === uid)) return true; } return false; };
// tek birim × uzak, dayanıklı rakip (yetenek hemen patlamasın diye Kut sonrası adım atılmadan bakılır)
const savas = (e, opt = {}, h = 'golem', s = 1) => S.Savas([{ h, s, x: 1, y: 0, ...(e ? { e } : {}) }, { h: 'kurt', s: 1, x: 2, y: 0 }], [{ h: 'golem', s: 3, x: 1, y: 2 }], { tohum: 7, ...opt });

// ── 1) Kut Yankısı: her bileşenin etkisi, tam eşya iki bileşen, Kut Taşı ×2, Kut Ocağı ek ×1,5 ──
{
  let sv = savas(['yirticiPence']); sv.kut(0, 0); let u = sv.birimler[0];
  ok(u.yankiDis === KY.disVurus && yakin(u.yankiDisOran, 2 * KY.disOran), 'Diş yankısı: Yırtıcı Pençe (Diş+Diş) → sonraki 3 vuruş +%100');
  sv = savas(['tuy']); sv.kut(0, 0); u = sv.birimler[0];
  ok(u.durum.yankiTuy && yakin(u.durum.yankiTuy.deger, 0.5) && yakin(u.durum.yankiTuy.sure, 3), 'Tüy yankısı: 3 sn +%50 saldırı hızı');
  sv = savas(['kor', 'kor']); sv.kut(0, 0); ok(yakin(sv.birimler[0].kutCarpan, 1.25 * 1.25), 'Kor yankıları çarpılır: 2 Kor → ×1,25 × 1,25');
  sv = savas(['kutOcagi']); sv.kut(0, 0); ok(yakin(sv.birimler[0].kutCarpan, 1.25 * 1.25 * 1.5), 'Kut Ocağı: iki Kor yankısına ek ×1,5');
  sv = savas(['kabuk', 'anaKaya']); sv.kut(0, 0); ok(yakin(sv.birimler[0].durum.yankiKabuk.deger, KY.kabukTavan), `Kabuk yankısı 3 × %40, tavan %${KY.kabukTavan * 100}`);
  sv = savas(['kabuk']); sv.kut(0, 0); ok(yakin(sv.birimler[0].durum.yankiKabuk.deger, 0.4), 'Kabuk yankısı: 3 sn −%40 alınan hasar');
  sv = savas(['pul']); sv.kut(0, 0); ok(yakin(sv.birimler[0].durum.yankiPul.deger, 0.4), 'Pul yankısı: 3 sn %40 can çalma');
  sv = savas(['buz'], {}, 'golem', 2); const k0 = sv.birimler[0].kalkan; sv.kut(0, 0);
  ok(yakin(sv.birimler[0].kalkan - k0, 150 * 1.8), 'Buz yankısı: 150 ×★ kalkan (★2: 270)');
  sv = savas(['yurek']); u = sv.birimler[0]; u.hp = 100; sv.kut(0, 0); ok(yakin(u.hp, 100 + u.mx * 0.15), 'Yürek yankısı: azami canın %15\'i iyileşme');
  sv = savas(['ciy', 'dolunayTestisi']); sv.kut(0, 0); u = sv.birimler[0];
  ok(u.yankiCiy === 3 * KY.ciy, 'Çiy yankısı: 3 Çiy → yetenekten sonra 90 mana bekler');
  yetBekle(sv, 0); ok(u.yankiCiy === 0 && u.mp === u.mana, `Çiy yankısı yetenekten hemen sonra mana verdi (mp ${u.mp.toFixed(1)}, azami ${u.mana} ile sınırlı)`);
  sv = savas(['kutTasi', 'tuy']); sv.kut(0, 0); ok(yakin(sv.birimler[0].durum.yankiTuy.deger, 1), 'Kut Taşı yankıyı ikiye katlar: 1 Tüy → +%100 hız');
  sv = savas(['kutTasi', 'kor']); sv.kut(0, 0); ok(yakin(sv.birimler[0].kutCarpan, 1.25 * 1.25), 'Kut Taşı + Kor → ×1,25²');
  sv = savas(['avCoskusu', 'kutTasi', 'buz']); sv.kut(0, 0);
  ok(JSON.stringify(sv.fx.filter(f => f.tip === 'kutYanki').map(f => f.bilesen)) === '["dis","tuy","buz"]', 'kutYanki olayları yuva ve tarif sırasıyla, bileşen başına bir kez');
  sv = savas(null); sv.kut(0, 0); ok(sv.birimler[0].kutCarpan === 1 && !sv.fx.some(f => f.tip === 'kutYanki'), 'eşyasız birimde yankı yok: Kut yalnız manayı doldurur');
  // Diş yankısı vuruş hasarını artırır ve 3 vuruşta biter
  const dene = (e) => { const sv2 = S.Savas([{ h: 'kurt', s: 1, x: 1, y: 0, e }], [{ h: 'golem', s: 3, x: 1, y: 0 }], { tohum: 3 }); sv2.kut(0, 0); let vur = 0;
    for (let i = 0; i < 400 && vur < 5 && !sv2.bitti; i++) { sv2.adim(); vur = sv2.birimler[0].vurus; } return sv2.birimler[0]; };
  const d = dene(['dis']); ok(d.yankiDis === 0, 'Diş yankısı 3 vuruştan sonra biter');
}

// ── 2) Kut hakkı: 1 hak; kutHak 2 / Çifte Kut ile 2, ikincisi en az 6 sn sonra (KURAL.kut.ara); Kut Mirası; Kut Sessizliği ──
{
  let sv = savas(null); ok(sv.kut(0, 0) && !sv.kut(0, 1) && sv.kutKalanSay(0) === 0 && !sv.kutVar(0), 'temel: savaş başına 1 Kut');
  sv = savas(null, { kutHak: [2, 2] }); ok(sv.kut(0, 0) && !sv.kut(0, 1) && sv.kutVar(0) && !sv.kutHazir(0), 'Son İki (kutHak 2): ikinci Kut hemen kullanılamaz');
  for (let i = 0; i < 119; i++) sv.adim(); ok(K.kut.ara === 6 && !sv.kut(0, 1), 'ikinci Kut 5,95 sn sonra reddedilir');
  sv.adim(); ok(sv.kutHazir(0) && sv.kut(0, 1) && sv.kutKalanSay(0) === 0 && sv.kutHakSay(0) === 2, 'ikinci Kut 6 sn sonra kullanılır (sayaç 0/2)');
  sv = savas(null, { armagan: [['cifteKut'], []] }); ok(sv.kutHakSay(0) === 2 && sv.kutHakSay(1) === 1, 'Çifte Kut: armağanı alan tarafın 2 hakkı var');
  sv = savas(null, { kutHak: [2, 2], armagan: [['cifteKut'], []] }); ok(sv.kutHakSay(0) === 3, 'Çifte Kut + Son İki: 3 hak');
  // Kut Mirası: Kut verilen birim ölünce hak bir kez geri gelir
  sv = S.Savas([{ h: 'kurt', s: 1, x: 1, y: 0 }, { h: 'golem', s: 3, x: 2, y: 2 }], [{ h: 'ayi', s: 3, x: 1, y: 0 }, { h: 'koc', s: 3, x: 2, y: 0 }], { tohum: 5, armagan: [['kutMirasi'], []] });
  sv.kut(0, 0); let geri = false;
  for (let i = 0; i < 800 && !sv.bitti; i++) { sv.adim(); if (sv.birimler[0].olu) { geri = sv.kutKalanSay(0) === 1 && sv.fx.some(f => f.tip === 'kutMiras') || geri; break; } }
  ok(geri, 'Kut Mirası: Kut verilen kurt ölünce Kut hakkı geri geldi');
  for (let i = 0; i < 100 && !sv.kutHazir(0) && !sv.bitti; i++) sv.adim();
  ok(sv.kut(0, 1) && sv.kutKalanSay(0) === 0, 'geri gelen hak (6 sn arayla) kullanılabilir, bir kez');
  // Kut Sessizliği
  sv = savas(null, { alamet: 'kutSessiz' });
  ok(!sv.kutVar(0) && !sv.kut(0, 0) && sv.kutYok && sv.birimler.every(u => u.mp >= u.mana * 0.25 - 1e-9), 'Kut Sessizliği: Kut yok, herkes %25 mana ile başlar');
  const s2 = savas(null, { alamet: 'kutSessiz', yz: [0, 1] }).sonunaKadar(); ok(s2.kut[0] === 0 && s2.kut[1] === 0, 'Kut Sessizliği: yapay zekâ da Kut kullanamaz');
  // Uzun Gölge
  ok(savas(null, { alamet: 'uzunGolge', gunBatimi: 30 }).gunBatimiBasla === 20 && savas(null, { alamet: 'uzunGolge' }).gunBatimiBasla === null && savas(null, { gunBatimi: 30 }).gunBatimiBasla === 30,
    'Uzun Gölge: Gün Batımı 20. sn\'de (yalnız Gün Batımı açık savaşlarda; Hızlı Maç etkilenmez)');
  const r = savas(null, { kutHak: [2, 1], yz: [0, 1] }).sonunaKadar(); ok(Array.isArray(r.kut) && r.kut.length === 2, `sonuç tarafların kullandığı Kut sayısını taşır (${r.kut})`);
}

// ── 3) Yapay zekâ Kut'u (7.4): puan = (mana − mp) × kc + 20 × bileşen + (Kut Ocağı 60); eşitlikte küçük i; ilk hak 8., ikinci hak 18. sn ──
{
  const takim = (e1, e2) => [{ h: 'kurt', s: 1, x: 0, y: 0, ...(e1 ? { e: e1 } : {}) }, { h: 'kurt', s: 1, x: 3, y: 0, ...(e2 ? { e: e2 } : {}) }];
  const kim = (A, ops = {}) => { const kay = []; const sv = S.Savas(A, [{ h: 'golem', s: 3, x: 1, y: 2 }], { tohum: 9, yz: [0], kayit: kay, ...ops }); for (let i = 0; i < 200 && !kay.length; i++) sv.adim(); return kay[0]; };
  // yzZaman küçük: iki birimin de manası 0 iken karar verilir
  const erken = { yzZaman: 0.01 };
  ok(kim(takim(), erken).i === 0, 'eşitlikte birim sırası küçük olan seçilir');
  ok(kim(takim(null, ['dis']), erken).i === 1 && kim(takim(['dis'], ['dis', 'tuy']), erken).i === 1, 'bileşen taşıyan önce (20 × bileşen)');
  ok(kim(takim(['yirticiPence'], ['kutOcagi']), erken).i === 1, 'Kut Ocağı +60: aynı bileşen sayısında Kut Ocağı taşıyan seçilir');
  const k1 = kim(takim()); ok(k1 && k1.t >= 8 - 1e-9 && k1.t < 8.1, `ilk hak 8. sn'de (${k1.t})`);
  const dayanikli = [{ h: 'golem', s: 3, x: 1, y: 0 }, { h: 'kaplumbaga', s: 3, x: 2, y: 0 }];
  const kay = []; const sv = S.Savas(dayanikli, [{ h: 'golem', s: 3, x: 1, y: 0 }, { h: 'kaplumbaga', s: 3, x: 2, y: 0 }], { tohum: 9, yz: [0], kayit: kay, kutHak: [2, 1] });
  for (let i = 0; i < 450 && kay.length < 2 && !sv.bitti; i++) sv.adim();
  ok(kay.length === 2 && kay[1].t >= 18 - 1e-9 && kay[1].t < 18.1, `ikinci hak 18. sn'de (${kay.map(k => k.t)})`);
  // kayıtlı dokunuş + yedek: kayıttaki birim ölmüşse yapay zekâ kullanır; yedek taraf kendi kaydından önce Kut kullanmaz
  const A = [{ h: 'kurt', s: 1, x: 1, y: 0 }, { h: 'golem', s: 2, x: 2, y: 2 }], B = [{ h: 'ayi', s: 3, x: 1, y: 0 }, { h: 'koc', s: 3, x: 2, y: 0 }];
  const ilk = S.Savas(A, B, { tohum: 4 }); let olumT = null; for (let i = 0; i < 800 && !ilk.bitti && olumT === null; i++) { ilk.adim(); if (ilk.birimler[0].olu) olumT = ilk.t; }
  const kay2 = []; const s3 = S.Savas(A, B, { tohum: 4, kut: [{ t: +(olumT + 1).toFixed(2), taraf: 0, i: 0 }], yzYedek: [0], kayit: kay2 }); s3.sonunaKadar();
  ok(olumT !== null && kay2.length === 1 && kay2[0].i === 1 && kay2[0].t >= olumT + 1 - 1e-9, `kayıttaki birim ölmüş: yapay zekâ yedeği hakkı kullandı (kurt ${olumT && olumT.toFixed(2)} sn'de öldü, Kut ${kay2.map(k => k.t)} sn)`);
  const kay3 = []; S.Savas(A, B, { tohum: 4, kut: [{ t: 6, taraf: 0, i: 1 }], yzYedek: [0], kayit: kay3 }).sonunaKadar();
  ok(kay3.length === 1 && kay3[0].t === 6, 'yedek taraf: kayıttaki dokunuştan önce yapay zekâ Kut kullanmaz');
}

// ── 4) Savaş armağanları ──
{
  let sv = savas(null, { armagan: [['uyanis'], []] }); sv.kut(0, 0); ok(sv.birimler[0].durum.uyanis && sv.birimler[0].durum.uyanis.deger === AS.uyanis, 'Uyanış: Kut verilen birim +%25 saldırı hızı');
  sv = S.Savas([{ h: 'golem', s: 1, x: 1, y: 0 }, { h: 'kurt', s: 1, x: 2, y: 0 }, { h: 'kurbaga', s: 1, x: 0, y: 2 }], [{ h: 'golem', s: 3, x: 1, y: 2 }], { tohum: 1, armagan: [['isikSutunu'], []] });
  sv.kut(0, 0); const [g, k, kb] = sv.birimler;
  ok(yakin(k.mp, k.mana * 0.5) && kb.mp === 0 && g.mp === g.mana, 'Işık Sütunu: 2 hücredeki dosta azami mananın %50\'si (uzaktakine yok)');
  const vurus = (ar, al) => { const s4 = S.Savas([{ h: 'kurt', s: 1, x: 1, y: 0 }], [{ h: 'golem', s: 1, x: 1, y: 0 }], { tohum: 2, alamet: al, armagan: [ar, []] }); for (let i = 0; i < 400; i++) { s4.adim(); const f = s4.fx.find(x => x.tip === 'hasar' && x.k === 0); if (f) return f.n; } };
  const v0 = vurus([], 'sis'), v1 = vurus(['kizilGok'], 'sis'), v2 = vurus(['kizilGok'], 'yok');
  ok(v1 === Math.round(v0 / 0.8 * 1.1 * 0.8) || Math.abs(v1 - v0 * 1.1) <= 1, `Kızıl Gök Çocuğu: alamet varken +%10 hasar (${v0} → ${v1})`);
  ok(v2 === vurus([], 'yok'), 'Kızıl Gök Çocuğu: Durgun Gök\'te etkisiz');
  const A = [{ h: 'golem', s: 1, x: 0, y: 0 }, { h: 'kaplumbaga', s: 1, x: 1, y: 0 }], B = [{ h: 'kurt', s: 1, x: 1, y: 0 }];
  ok(S.Savas(B, A, {}).soylar[1].dev.seviye === 1 && S.Savas(B, A, { armagan: [['karsiHamle'], []] }).soylar[1].dev.seviye === 0, 'Karşı Hamle: rakibin en kalabalık soyu (Dev 2) bir eşik düşük');
  const fu = { h: 'golem', s: 1, f: 'kurt', x: 1, y: 0 };
  const m1 = S.Savas([fu], B, {}).birimler[0], m2 = S.Savas([fu], B, { armagan: [['kusursuzMelez'], []] }).birimler[0];
  ok(m1.mx === Math.round((D.kahraman('golem').can + D.kahraman('kurt').can) / 2 * 1.15) && m2.mx === Math.round((D.kahraman('golem').can + D.kahraman('kurt').can) / 2 * 1.3), 'Kusursuz Melez: kaynaşmış birim çarpanı ×1,15 → ×1,30');
  const u3 = S.birimStat({ h: 'golem', s: 1, f: 'kurt', f2: 'yilan' });
  ok(u3.can === Math.round((D.kahraman('golem').can + D.kahraman('kurt').can) / 2 * 1.15 * 1.1) && ['su', 'bilge'].every(x => u3.soy.includes(x)) && u3.pasif === 'suru' && u3.yetenek === 'tasFirlat', 'Üçlü Kaynaşma: üçüncüden soylar ve +%10; yetenek ve pasif değişmez');
  const c1 = S.Savas([{ h: 'golem', s: 1, x: 1, y: 0 }], B, { armagan: [['sonDirenis'], []] }).birimler[0];
  ok(c1.mx === Math.round(D.kahraman('golem').can * 1.2), 'Son Direniş: takım +%20 can');
  ok(JSON.stringify(L.savasArmagan(['sonDirenis', 'cifteKut', 'pazarDostu'], 39)) === '["sonDirenis","cifteKut"]' && JSON.stringify(L.savasArmagan(['sonDirenis', 'cifteKut'], 40)) === '["cifteKut"]',
    'savasArmagan: yalnız savaş armağanları; Son Direniş can 40\'ın altındayken');
  ok(JSON.stringify(S.Savas([{ h: 'golem', s: 1, x: 1, y: 0 }], B, {}).birimler.map(u => u.mx)) === JSON.stringify(S.Savas([{ h: 'golem', s: 1, x: 1, y: 0 }], B, { armagan: [[], []] }).birimler.map(u => u.mx)), 'armağansız savaş değişmez');
}

// ── 5) Kut Armağanı seçimi (bölüm 6.1) ──
{
  const say = { 2: {}, 3: {}, 4: {} };
  for (const b of [2, 3, 4]) for (let i = 0; i < 3000; i++) { const s = L.armaganSecenek(b, S.rng(1000 + i * 13 + b), []); say[b][s.kademe] = (say[b][s.kademe] || 0) + 1; }
  const oran = (b) => K.armagan.kademeler.map(k => (say[b][k] || 0) / 3000);
  ok([2, 3, 4].every(b => oran(b).every((v, i) => Math.abs(v - K.armagan.olasilik[b][i]) < 0.03)), `kademe olasılıkları tabloya uyar (2-1 ${oran(2).map(v => v.toFixed(2))}, 3-2 ${oran(3).map(v => v.toFixed(2))}, 4-3 ${oran(4).map(v => v.toFixed(2))})`);
  let hepUc = true, ayniKademe = true, tekrar = false;
  for (let i = 0; i < 500; i++) {
    const alinan = [], R = S.rng(5000 + i);
    for (const b of [2, 3, 4]) {
      const s = L.armaganSecenek(b, R, alinan);
      if (s.secenek.length !== 3 || new Set(s.secenek).size !== 3) hepUc = false;
      if (s.kademe !== 'gunes' && !s.secenek.every(id => D.armagan(id).kademe === s.kademe)) ayniKademe = false;
      if (s.secenek.some(id => alinan.includes(id))) tekrar = true;
      alinan.push(s.secenek[i % 3]);
    }
  }
  ok(hepUc && ayniKademe && !tekrar, 'her aşamada 3 farklı kart, kademesi aynı; alınan armağan bir daha çıkmaz');
  const ilk = L.armaganCek('alev', S.rng(3), [], []), yeni = L.armaganCek('alev', S.rng(4), [], ilk);
  ok(yeni.length === 3 && yeni.every(id => !ilk.includes(id) && D.armagan(id).kademe === 'alev'), 'yenileme: üç kartın hepsi değişir, kademe aynı');
  const gunes = L.armaganCek('gunes', S.rng(8), ['cifteKut'], []);
  ok(gunes.length === 3 && gunes.filter(id => D.armagan(id).kademe === 'gunes').length === 2, 'kademede yetmezse alt kademeden tamamlanır (Güneş 3 kart)');
  ok(D.ARMAGANLAR.length === 20 && D.ARMAGANLAR.every(a => a.ad && a.m && a.neden && D.ARMAGAN_KADEME[a.kademe]), '20 armağan: ad, etki, "Neden seç?" ve kademe');
  const ba = (r) => O.botIzTur(77, 0.5, r).armagan.length;
  ok(ba(2) === 0 && ba(3) === 1 && ba(10) === 1 && ba(11) === 2 && ba(19) === 3 && ba(40) === 3, 'bot izi armağanları: 2-1, 3-2, 4-3\'te birer');
  ok(L.faiz(70, 10, L.faizTavan(['bereketKupu'])) === 7 && L.faiz(70, 10, L.faizTavan([])) === 5 && L.gelirHesapla(10, 50, null, false, 'yok', 7).faiz === 6, 'Bereket Küpü: faiz tavanı 7');
}

// ── 6) Lobi alametleri (bölüm 8) ──
{
  ok(D.ALAMETLER.length === 12 && D.ALAMETLER_HIZLI.length === 8 && D.ALAMETLER_HIZLI.every(a => !a.lobi), '12 alamet; Hızlı Maç eski 8 alameti kullanır');
  const say = {}; let ard = false, n = 0, b1 = true;
  for (let t = 0; t < 400; t++) { let once = null; for (let r = 0; r < 45; r++) { const a = L.lobiAlamet(1000 + t * 7, r), p = L.turPlan(r);
    if (p.bolum === 1 || p.tip === 'kervan') { if (a !== 'yok') b1 = false; once = null; continue; } if (a === once) ard = true; once = a; say[a] = (say[a] || 0) + 1; n++; } }
  const yok = say.yok / n, digr = D.ALAMETLER.filter(a => a.id !== 'yok').map(a => say[a.id] / n);
  ok(b1 && !ard, 'bölüm 1 ve Kervan Durgun Gök; aynı alamet art arda gelmez');
  ok(yok > 0.13 && yok < 0.19 && digr.every(v => v > 0.06 && v < 0.1), `ağırlıklar: Durgun Gök %${(yok * 100).toFixed(1)}, diğerleri %${(Math.min(...digr) * 100).toFixed(1)}–${(Math.max(...digr) * 100).toFixed(1)}`);
  ok(['demirci', 'gocMevsimi', 'kutSessiz', 'uzunGolge'].every(id => say[id] > 0), 'yeni alametler lobide çıkar');
  ok(JSON.stringify(L.alametSirasi(42, 5, 3)) === JSON.stringify([5, 6, 7].map(r => L.lobiAlamet(42, r))), 'sıradaki alametler önceden hesaplanır');
}

// ── 7) belirlenimcilik: aynı girdi → aynı sonuç ──
{
  const A = O.botIzTur(11, 0.7, 30).takim, B = O.botIzTur(12, 0.4, 30).takim, opt = { tohum: 5, alamet: 'kanAyi', yz: [0, 1], kutHak: [2, 2], gunBatimi: 20, armagan: [['cifteKut', 'uyanis', 'kizilGok'], ['kutMirasi', 'isikSutunu']] };
  const a = S.Savas(A, B, opt).sonunaKadar(), b = S.Savas(A, B, opt).sonunaKadar();
  ok(JSON.stringify(a) === JSON.stringify(b), `armağanlı, çift Kut'lu savaş belirlenimci (${JSON.stringify(a)})`);
}

console.log(hata ? `${hata} hata` : 'Kut testleri geçti');
process.exit(hata ? 1 : 0);
