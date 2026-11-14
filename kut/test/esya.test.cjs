// node kut/test/esya.test.cjs — eşyalar (OYNANIS_DERINLIK.md bölüm 5): veri, istatistik, takma/toplama kuralları, motor kancaları, ganimet, bot eşyası
global.btoa = s => Buffer.from(s, 'binary').toString('base64'); global.atob = s => Buffer.from(s, 'base64').toString('binary');
const fs = require('fs'), path = require('path');
const D = require('../data.js'), S = require('../sim.js'), O = require('../online.js'), L = require('../lobi.js');
const K = D.KURAL;
let hata = 0; const ok = (c, m) => { if (!c) { hata++; console.log('✗', m); } else console.log('✓', m); };

// ── 1) veri ──
ok(D.BILESENLER.length === 8 && D.ESYALAR.length === 36 && D.OZEL_ESYA.length === 3, '8 bileşen, 36 tam eşya, 3 özel eşya');
{
  const ciftler = new Set(D.ESYALAR.map(e => e.tarif.slice().sort().join('+')));
  let hepsi = true; for (const a of D.BILESENLER) for (const b of D.BILESENLER) if (!D.tarif(a.id, b.id)) hepsi = false;
  ok(ciftler.size === 36 && hepsi, 'her iki bileşen tek bir tam eşyaya karşılık gelir (sıra önemsiz)');
  ok(D.tarif('tuy', 'dis') === 'avCoskusu' && D.tarif('dis', 'tuy') === 'avCoskusu' && D.tarif('buz', 'buz') === 'isikKalkani', 'tarif örnekleri: Diş+Tüy = Av Coşkusu, Buz+Buz = Işık Kalkanı');
  const kok = path.join(__dirname, '..', 'arayuz', 'ui', 'esya');
  const simgeler = [...D.BILESENLER, ...D.ESYALAR, ...D.OZEL_ESYA].map(x => x.simge);
  ok(simgeler.every(s => fs.existsSync(path.join(kok, s + '.png'))), 'her eşyanın simgesi arayuz/ui/esya altında var');
  ok(D.esya('muhur-ates').soy === 'ates' && D.esya('muhur-yok') === null && D.esya('muhur-constructor') === null && D.esya('kilic') === null, 'Soy Mührü kimliği muhur-<soy>; bilinmeyen kimlik null');
}

// ── 2) birim istatistiği ──
{
  const G = D.kahraman('golem'), yalin = S.birimStat({ h: 'golem', s: 2 });
  const st = S.birimStat({ h: 'golem', s: 2, e: ['yirticiPence', 'yurek', 'kor'] });
  ok(st.atk === Math.round(G.atk * 1.8 * 1.3) && st.can === yalin.can + 180 && Math.abs(st.yg - 0.2) < 1e-12, 'istatistik: Yırtıcı Pençe +%30 saldırı, Yürek +180 can (yıldızla çarpılmaz), Kor +%20 YG');
  ok(st.esya.join() === 'yirticiPence' && st.kutYanki.dis === 2 && st.kutYanki.yurek === 1, 'tam eşya iki bileşen sayılır (Kut Yankısı sayacı)');
  const az = S.birimStat({ h: 'golem', s: 1, e: ['anaKaya', 'anaKaya', 'kabuk'] });
  ok(az.azalt === 0.4 && az.esya.length === 1, 'hasar azaltma eşyalardan en çok %40; aynı tam eşyanın etkisi bir kez');
  const m = S.birimStat({ h: 'golem', s: 1, e: ['muhur-ates', 'muhur-ates', 'kutTasi', 'kilic'] });
  ok(m.soy.join() === 'yer,dev,ates' && m.kutTasi === 1 && m.can === S.birimStat({ h: 'golem', s: 1 }).can, 'Soy Mührü soyu ekler, Kut Taşı yuva kaplar, bilinmeyen kimlik yok sayılır');
  ok(S.birimStat({ h: 'golem', s: 1, e: ['yurek', 'yurek', 'yurek', 'yurek'] }).can === D.kahraman('golem').can + 540, 'en çok 3 yuva okunur');
  const soy = S.soySay([{ h: 'golem', s: 1, e: ['muhur-ates'] }, { h: 'semender', s: 1 }]);
  ok(soy.ates && soy.ates.n === 2 && soy.ates.seviye === 1, 'mühür soyu soy sayımına girer (Od 2)');
}

// ── 3) takma, toplama, raf kuralları ──
{
  ok(JSON.stringify(L.esyaTak({ h: 'kurt', s: 1 }, 'dis')) === '{"e":["dis"],"birlesen":null}', 'boş kahramana bileşen takılır');
  ok(JSON.stringify(L.esyaTak({ h: 'kurt', s: 1, e: ['yirticiPence', 'tuy'] }, 'dis')) === '{"e":["yirticiPence","avCoskusu"],"birlesen":"avCoskusu"}', 'yarım bileşen + bileşen → kendiliğinden tam eşya');
  ok(L.esyaTak({ h: 'kurt', s: 1, e: ['yirticiPence', 'avCoskusu', 'isikKalkani'] }, 'dis') === null, 'dolu kahramana (3 tam eşya) yeni bileşen takılmaz');
  ok(L.esyaTak({ h: 'kurt', s: 1, e: ['yirticiPence', 'avCoskusu', 'buz'] }, 'dis').birlesen === 'buzMizragi', 'dolu kahramana yarım bileşeni tamamlayan bileşen takılır');
  ok(L.esyaTak({ h: 'kurt', s: 1, e: ['dis', 'tuy'] }, 'isikKalkani').e.join() === 'dis,tuy,isikKalkani' && L.esyaTak({ h: 'kurt', s: 1, e: ['dis', 'tuy'] }, 'buz').e.join() === 'buzMizragi,tuy', 'tam eşya boş yuvaya; bileşen ilk yarım bileşenle birleşir');
  ok(L.esyaTak({ h: 'kurt', s: 1 }, 'sokumTasi') === null && L.esyaTak({ h: 'kurt', s: 1 }, 'muhur-avci') === null && L.esyaTak({ h: 'kurt', s: 1, f: 'golem' }, 'muhur-dev') === null
    && L.esyaTak({ h: 'kurt', s: 1 }, 'muhur-dev').e.join() === 'muhur-dev', 'Söküm Taşı takılmaz; taşıdığı (kaynaşmadan gelen dahil) soyun mührü takılmaz');
  const t = L.esyaToplaBirim({ h: 'kurt', s: 2 }, [['dis', 'isikKalkani'], ['tuy'], ['yelKanadi', 'anaKaya', 'kor']]);
  ok(t.e.join() === 'avCoskusu,isikKalkani,yelKanadi' && t.tasan.join() === 'anaKaya,kor', '★ birleşmede eşyalar toplanır, bileşenler birleşir, 3\'ü aşan rafa döner');
  ok(L.rafBirlestir(['isikKalkani', 'kor', 'buz', 'tuy'], 3, 1).join() === 'isikKalkani,simsekTuyu,buz' && L.rafBirlestir(['isikKalkani', 'kor'], 0, 1) === null, 'rafta iki bileşen birleşir; tam eşya bileşenle birleşmez');
}

// ── 4) motor kancaları ──
const tek = (A, B, opt = {}) => S.Savas(A, B, { tohum: 3, ...opt });
{
  const sv = tek([{ h: 'golem', s: 1, x: 1, y: 0, e: ['isikKalkani', 'uluKok', 'dolunayTestisi'] }, { h: 'kurt', s: 1, x: 2, y: 0 }, { h: 'kugu', s: 1, x: 1, y: 1, e: ['buzDagi', 'keskinGoz'] }],
    [{ h: 'kurt', s: 1, x: 1, y: 0 }]);
  const [g, k, ku] = sv.birimler;
  // Işık Kuğusu'nun Koruyucu Tüy pasifi komşulara 90 kalkan verir
  ok(g.kalkan === 240 + 90 && k.kalkan === 120 + 90 && Math.abs(ku.kalkan - (120 + ku.mx * 0.2 + 120)) < 1e-9, 'savaş başı kalkan: Buz bileşenleri, Işık Kalkanı (2 hücre dostlar), Buz Dağı (%20 azami can)');
  ok(k.mx === S.birimStat({ h: 'kurt', s: 1 }).can + 150 && g.mx === D.kahraman('golem').can + 360, 'Ulu Kök: 2 hücre içindeki dostlara +150 azami can');
  ok(g.mana === 64 && ku.mp === 15 && ku.vurusMana === 15, 'Dolunay Testisi mana −%20 (80 → 64); Çiy +15 başlangıç manası; Keskin Göz vuruş başına 15 mana');
}
{
  // Sis Pelerini: ilk 2,5 sn hedef alınamaz (diğer düşman varken)
  const sv = tek([{ h: 'golem', s: 1, x: 1, y: 0, e: ['sisPelerini'] }, { h: 'kurt', s: 1, x: 2, y: 0 }], [{ h: 'tilki', s: 1, x: 1, y: 2 }]);
  sv.adim(); ok(sv.birimler[0].durum.hedefAlinmaz && sv.birimler[2].hedef !== sv.birimler[0], 'Sis Pelerini kuruldu: ilk adımda hedef alınmaz');
  let hedefGolem = false; for (let i = 0; i < 45; i++) { sv.adim(); if (sv.birimler[2].hedef === sv.birimler[0]) hedefGolem = true; }
  ok(!hedefGolem, 'Sis Pelerini: ilk 2,5 sn boyunca hedef seçilmez');
  // Dev Kükremesi: yakındaki düşmanlar 3 sn yalnız onu hedef alır
  const dk = tek([{ h: 'golem', s: 1, x: 0, y: 0, e: ['devKukremesi'] }, { h: 'kurt', s: 1, x: 1, y: 0 }], [{ h: 'kurt', s: 1, x: 1, y: 0 }]);
  dk.adim(); ok(dk.birimler[2].hedef === dk.birimler[0] && dk.birimler[2].durum.zorla, 'Dev Kükremesi: yakın düşman onu hedef alır (en yakın başkası olsa da)');
}
{
  // Ana Kaya: canı %40 altına ilk inişte 2 sn hasar almaz
  const sv = tek([{ h: 'kurbaga', s: 1, x: 1, y: 0, e: ['anaKaya'] }], [{ h: 'ayi', s: 3, x: 1, y: 0 }, { h: 'koc', s: 3, x: 2, y: 0 }]);
  let gordu = false, korundu = true, hp0 = 0;
  for (let i = 0; i < 600 && !sv.bitti; i++) { sv.adim(); const u = sv.birimler[0]; if (u.durum.dokunulmaz) { if (!gordu) { gordu = true; hp0 = u.hp; } else if (u.hp < hp0 - 1e-9) korundu = false; } }
  ok(gordu && korundu, 'Ana Kaya: dokunulmaz sürede can düşmez');
}
{
  // Kut Ocağı: Kut ile patlayan yetenek ×1,5
  const vur = (e) => { const sv = tek([{ h: 'golem', s: 1, x: 1, y: 0, e }], [{ h: 'golem', s: 1, x: 1, y: 0 }]); sv.kut(0, 0); sv.adim(); return sv.birimler[1].mx - sv.birimler[1].hp; };
  const a = vur(['kor']), b = vur(['kutOcagi']);
  // kor: YG 0,2, Kor yankısı ×1,25 → 200×1,2×1,25 = 300 (taş deri ×0,8); Kut Ocağı (Kor+Kor): YG 0,4, iki Kor yankısı ×1,25² ve ek ×1,5 → 200×1,4×1,5625×1,5 (×0,8)
  ok(Math.abs(a - 200 * 1.2 * 1.25 * 0.8) < 1e-6 && Math.abs(b - 200 * 1.4 * 1.25 * 1.25 * 1.5 * 0.8) < 1e-6, `YG yetenek hasarını büyütür, Kut Ocağı Kut yeteneğini Kor yankılarına ek ×1,5 (${a.toFixed(1)} / ${b.toFixed(1)})`);
}
{
  // Diken Kabuk: yakın vuruşun %25'i geri döner
  const sv = tek([{ h: 'kurt', s: 1, x: 1, y: 0 }], [{ h: 'golem', s: 1, x: 1, y: 0, e: ['dikenKabuk'] }]);
  let geri = false; for (let i = 0; i < 200 && !geri; i++) { sv.adim(); if (sv.birimler[0].hp < sv.birimler[0].mx && sv.birimler[1].hp < sv.birimler[1].mx && !sv.fx.some(f => f.tip === 'vurus' && f.k === sv.birimler[1].uid)) geri = sv.fx.some(f => f.tip === 'hasar' && f.u === sv.birimler[0].uid); }
  ok(geri, 'Diken Kabuk: saldırgan, vuruşu sırasında hasar alır');
}
{
  // belirlenimcilik: aynı eşyalı takımlar → aynı sonuç
  const A = O.botEsya(O.botTakim(25, 17, 0.6, 7), 25, 17), B = O.botEsya(O.botTakim(25, 18, 0.6, 7), 25, 18);
  const r1 = S.Savas(A, B, { tohum: 4, yz: [0, 1] }).sonunaKadar(), r2 = S.Savas(A, B, { tohum: 4, yz: [0, 1] }).sonunaKadar();
  ok(JSON.stringify(r1) === JSON.stringify(r2) && A.some(b => b.e), 'eşyalı savaş belirlenimci');
  // her tam eşya ve özel eşya bir savaşı hatasız oynatır
  let hatasiz = true;
  for (const e of [...D.ESYALAR.map(x => x.id), 'kutTasi', 'muhur-avci']) {
    try { const t = O.botTakim(12, 5, 0.5, 6); t[0] = { ...t[0], e: [e, e, 'yurek'] }; S.Savas(t, O.botTakim(12, 6, 0.5, 6), { tohum: 1, yz: [0, 1] }).sonunaKadar(); } catch (er) { hatasiz = false; console.log(e, er); }
  }
  ok(hatasiz, 'her eşya ile savaş hatasız biter');
}

// ── 5) ganimet ve bot eşyası ──
{
  // bot ganimeti: seçimlerde ilk seçenek, Kervan'da ilk seçeneğin eşyası. 2-7 zarfı %30 bir bileşen daha verir.
  const zarfB = (t) => L.ganimet(9, S.rng(t), null).zarf === 'bilesen' ? 1 : 0;
  let bil = 0, tam = 0, ozel = [];
  for (let r = 0; r <= 30; r++) for (const id of L.ganimetEsya(r, S.rng(9 + r))) { const x = D.esya(id); if (x.tip === 'bilesen') bil++; else if (x.tip === 'tam') tam++; else ozel.push(id); }
  let b37 = 0; for (let r = 0; r <= 16; r++) b37 += L.ganimetEsya(r, S.rng(r)).length;
  ok(b37 === 7 + zarfB(9), '3-7 sonunda 7 bileşen + zarf (bölüm 5.4: ~7,3)');
  ok(bil === 8 + zarfB(18) && tam === 2 && ozel.join() === 'kutTasi,sokumTasi', '5-7 sonunda: 8 bileşen (+ zarf), 2 tam eşya (4-7 seçimi, 5-4 Kervan), Kut Taşı + Söküm Taşı');
  ok(L.ganimetEsya(0, S.rng(1)).length === 1 && L.ganimetEsya(2, S.rng(1)).length === 1 && L.ganimetEsya(1, S.rng(1)).length === 0 && L.ganimetEsya(5, S.rng(1)).length === 0, '1-1 bileşen, 1-3 seçilen bileşen; 1-2 (kahraman) ve PvP turu eşya yok');
  const t = O.botTakim(30, 44, 0.5, 7);
  ok(JSON.stringify(O.botEsya(t, 0, 44)) === JSON.stringify(t), 'bot eşyası: r 0 → eşyasız (eski takım aynen)');
  const te = O.botEsya(t, 17, 44), say = te.reduce((s, b) => s + (b.e || []).reduce((q, id) => q + (D.esya(id).tip === 'tam' ? 2 : 1), 0), 0);
  const guc = (b) => D.kahraman(b.h).kademe * b.s, enGuclu = te.slice().sort((a, b) => guc(b) - guc(a))[0];
  let z = 0; for (let rr = 0; rr < 17; rr++) z += L.ganimetEsya(rr, S.rng(44 * 977 + rr * 7919)).reduce((q, id) => q + (D.esya(id).tip === 'tam' ? 2 : 1), 0);
  ok(say === z && (say === 7 || say === 8) && enGuclu.e && enGuclu.e.length === 3, `bot eşyası: 3-7 sonrası ${say} bileşen değeri (7 + zarf), en güçlü birim 3 eşya taşır (${enGuclu.e})`);
}
// ── 6) vuruş eşyalarının sayıları (bölüm 5.3): saldıran Kurt, hedef Golem (Taş Deri: alınan hasar ×0,8) ──
{
  // Kurt'un her vuruş adımında Golem'in can kaybı (Golem kendini iyileştirmez; Kurt'un yeteneği yalnız hız verir)
  const vuruslar = (e, n = 6) => {
    const sv = tek([{ h: 'kurt', s: 1, x: 1, y: 0, e }], [{ h: 'golem', s: 1, x: 1, y: 0 }]), out = [];
    for (let i = 0; i < 2000 && out.length < n && !sv.bitti; i++) {
      const hp = sv.birimler[1].hp; sv.adim();
      const v = sv.fx.filter(f => f.tip === 'vurus' && f.k === sv.birimler[0].uid).length;
      if (v) out.push({ v, d: +(hp - sv.birimler[1].hp).toFixed(6) });
    }
    return out;
  };
  const yak = (a, b) => Math.abs(a - b) < 1e-6;
  const p = vuruslar(['yirticiPence']), atkP = Math.round(52 * 1.3);
  ok(yak(p[0].d, atkP * 0.8) && yak(p[1].d, atkP * 0.8) && yak(p[2].d, (atkP + D.kahraman('golem').can * 0.08) * 0.8) && yak(p[5].d, (atkP + D.kahraman('golem').can * 0.08) * 0.8),
    `Yırtıcı Pençe: her 3. vuruş hedefin azami canının %8'i kadar ek (${p.map(x => x.d.toFixed(1))})`);
  const b = vuruslar(['bulutNali']);
  ok(yak(b[0].d, 52 * 2 * 0.8) && yak(b[1].d, 52 * 0.8), `Bulut Nalı: ilk vuruş 2 kat (${b.map(x => x.d.toFixed(1))})`);
  const dy = vuruslar(['devYumrugu']), atkD = Math.round(52 * 1.15), mxD = 520 + 180;
  ok(yak(dy[0].d, (atkD + mxD * 0.02) * 0.8), `Dev Yumruğu: vuruşa kendi azami canının %2'si eklenir (${dy[0].d.toFixed(1)})`);
  const y = vuruslar(['yelKanadi']);
  ok(y[4].v === 2 && yak(y[4].d, 2 * 52 * 0.8) && y.filter((x, i) => i !== 4).every(x => x.v === 1 && yak(x.d, 52 * 0.8)), 'Yel Kanadı: 5. vuruşun ardından anında bir vuruş daha');
}
{
  // "İlk kez" eşik etkileri savaşta bir kez tetiklenir; Gölge Pelerini öldürünce hedef alınamaz; Buzul Zırh saldırganı yavaşlatır
  const sv = tek([{ h: 'kurbaga', s: 1, x: 1, y: 0, e: ['ofkeTilsimi', 'geceKanadi', 'karaBuz'] }, { h: 'golem', s: 1, x: 2, y: 0, e: ['anaKaya', 'buzulZirh'] }],
    [{ h: 'ayi', s: 3, x: 1, y: 0, e: ['golgePelerini'] }, { h: 'koc', s: 3, x: 2, y: 0, e: ['golgePelerini'] }, { h: 'kurt', s: 2, x: 0, y: 0, e: ['golgePelerini'] }]);
  const say = {}; let yavas = false, pelerin = false;
  for (let i = 0; i < 1200 && !sv.bitti; i++) {
    sv.adim();
    for (const f of sv.fx) if (f.tip === 'esya') say[f.ad] = (say[f.ad] || 0) + 1;
    if (sv.birimler.slice(2).some(u => !u.olu && u.durum.yavas && Math.abs(u.durum.yavas.deger - 0.2) < 1e-9)) yavas = true;
    if (sv.fx.some(f => f.tip === 'olum' && f.u < 10) && sv.birimler.slice(2).some(u => u.durum.hedefAlinmaz && u.durum.hedefAlinmaz.sure > 1.4)) pelerin = true;
  }
  ok(['ofkeTilsimi', 'geceKanadi', 'karaBuz', 'anaKaya'].every(a => say[a] === 1), `eşik etkileri birer kez tetiklenir (${JSON.stringify(say)})`);
  ok(yavas, 'Buzul Zırh: ona vuran 2 sn −%20 saldırı hızı alır');
  ok(pelerin, 'Gölge Pelerini: düşman öldürünce 1,5 sn hedef alınamaz');
}
{
  // Kızgın Diş ve Ayaz Asası: yeteneğin vurduğu düşmanlara yanık (30 ×★×YG) ve −%30 hız; Taş Mühür kalkanı 120 ×★×YG
  const sv = tek([{ h: 'golem', s: 2, x: 1, y: 0, e: ['kizginDis', 'ayazAsasi', 'tasMuhur'] }], [{ h: 'ayi', s: 3, x: 1, y: 0 }]);
  sv.kut(0, 0); sv.adim();
  const g = sv.birimler[0], k = sv.birimler[1], ky = 1.8 * (1 + 0.6);
  ok(k.durum.yanik && Math.abs(k.durum.yanik.deger - 30 * ky) < 1e-9 && k.durum.yavas && k.durum.yavas.deger === 0.3, 'Kızgın Diş yanığı ve Ayaz Asası yavaşlatması yeteneğin vurduğuna');
  ok(Math.abs(g.kalkan - (120 + 150 * 1.8 + 120 * ky)) < 1e-9, 'Taş Mühür: yetenekte kendine 120 ×★×YG kalkan (Ayaz Asası\'nın Buz kalkanına ve Kut\'un Buz yankısına ek)');
}
{
  // Hızlı Maç'ta eşya yok: eşyasız takımda birimStat eski alanlarını aynen verir
  const st = S.birimStat({ h: 'ejder', s: 2 });
  ok(st.atk === Math.round(D.kahraman('ejder').atk * 1.8) && st.can === Math.round(D.kahraman('ejder').can * 1.8) && st.asEk === 0 && st.yg === 0 && st.azalt === 0 && st.esya.length === 0, 'eşyasız birim: istatistikler eskisiyle aynı');
}
{
  // Denge ayarı (DENGE_RAPORU.md): Ruh Testisi dost ölünce +20 mana (30'du), Gölge Pelerini öldürünce ek %15 iyileşme.
  // Karşılaştırma: tam eşya ile aynı iki bileşen aynı istatistiği verir; savaşlar etkinin ilk tetiklendiği adıma kadar birebir aynı gider.
  const ikiz = (A, B, esya, bil, tas, olay) => {
    const kur = (e) => S.Savas(A.map((b, j) => (j === tas ? { ...b, e } : b)), B, { tohum: 77, alamet: 'yok', yz: [] });
    const a = kur([esya]), b = kur(bil); let n = 0;
    while (!a.bitti && n++ < 4000) { const once = a.birimler.map(u => [u.mp, u.hp]); a.adim(); b.adim();
      const f = a.fx.find(olay); if (f) return { a, b, once, f }; }
    return null; };
  const r = ikiz([{ h: 'kugu', s: 1, x: 1, y: 2 }, { h: 'kurt', s: 1, x: 1, y: 0 }], [{ h: 'ayi', s: 3, x: 1, y: 0 }, { h: 'ejder', s: 2, x: 2, y: 2 }], 'ruhTestisi', ['ciy', 'pul'], 0,
    f => f.tip === 'olum' && f.u === 1);
  ok(r && (() => { const u = r.a.birimler[0], v = r.b.birimler[0]; return Math.abs((u.mp - v.mp) - Math.min(20, u.mana - v.mp)) < 1e-9; })(), 'Ruh Testisi: dost ölünce taşıyıcı 20 mana kazanır (denge: 30 → 20)');
  const g = ikiz([{ h: 'koc', s: 3, x: 1, y: 0 }], [{ h: 'kurt', s: 1, x: 1, y: 0 }, { h: 'kurbaga', s: 1, x: 2, y: 0 }], 'golgePelerini', ['pul', 'pul'], 0,
    f => f.tip === 'olum');
  ok(g && (() => { const u = g.a.birimler[0], v = g.b.birimler[0]; return u.hp - v.hp > 0 && Math.abs((u.hp - v.hp) - Math.min(u.mx - v.hp, u.mx * 0.15)) < 1e-6 && u.durum.hedefAlinmaz; })(), 'Gölge Pelerini: öldürünce 1,5 sn hedef alınamaz ve azami canının %15\'i kadar iyileşir (denge eki)');
}
process.exit(hata ? 1 : 0);
