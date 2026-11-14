// node kut/test/lobi.test.cjs — 8 kişilik hayalet lobi (OYNANIS_DERINLIK.md bölüm 4 ve 11): bot izi, kayıtlı iz, lobi kurma, eşleşme sırası,
// Yansıma, hayalet × hayalet savaşları, hasar, elenme, sıralama ve kupa. Sonda 8 bot izinden oluşan lobiler baştan sona oynatılır
// (canlı oyuncu da bot) ve maç süresi hedefi doğrulanır: birinci için 22–26 savaş turu. Lobi sayısı: LOBI_N (varsayılan 200).
global.btoa = s => Buffer.from(s, 'binary').toString('base64'); global.atob = s => Buffer.from(s, 'base64').toString('binary');
const D = require('../data.js'), S = require('../sim.js'), L = require('../lobi.js'), O = require('../online.js');
const K = D.KURAL;
let hata = 0; const ok = (c, m) => { if (!c) { hata++; console.log('✗', m); } else console.log('✓', m); };
const medyan = (a) => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : NaN; };
const dilim = (a, q) => { const b = a.slice().sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(b.length * q))]; };
const botLobi = (tohum, kupa) => { const iz = O.lobiIzler(kupa, tohum, [], null, null, 8); return L.lobiYeni({ ad: iz[0].ad, kupa, iz: { bot: iz[0].bot } }, iz.slice(1), tohum); };

// ── 1) veri (bölüm 4.4, 4.5, 4.8) ──
ok(K.lobiBoyut === 8 && K.yasakTur === 3 && K.eslesmeDeneme === 50 && K.canBaslangic === 100, 'lobi 8 kişi, 100 can; eşleşme yasağı son 3 tur, 50 deneme');
ok(K.kupaTablo.slice(1).join() === '40,30,20,10,-10,-20,-30,-40' && K.kupaKoruma === 400, 'kupa: 1. +40 … 8. −40; 0–400 kupada kayıp yarı');
ok(K.botIz.egri.slice(1).map(l => l.slice(0, 6).join('/')).join(' ') === '2/3/0.2/0/0/0 5/4/0.35/0/1/0 12/6/0.55/0/3/1 19/7/0.75/0.05/5/1 26/8/0.85/0.12/7/2', 'bot izi eğrisi tablo 4.8 ile aynı (1-3, 2-3, 3-3, 4-3, 5-3)');

// ── 2) bot izi (4.8) ──
{
  const eg = [2, 5, 12, 19, 26].map(r => O.izEgri(r));
  ok(eg.map(e => e[0]).join() === '3,4,6,7,8' && eg.map(e => e[3]).join() === '0,1,3,5,7' && eg.map(e => e[4]).join() === '0,0,1,1,2', 'eğri: seviye 3/4/6/7/8, tam eşya 0/1/3/5/7, kaynaşmış 0/0/1/1/2');
  ok(O.izEgri(60)[0] === 8 && O.izEgri(60)[1] === K.botIz.tavan[2] && O.izEgri(60)[3] === K.botIz.tavan[4], 'eğri 5-3\'ten sonra tavanda durur');
  let tamam = true, svOk = true, hucre = true, esya = true;
  for (let i = 0; i < 200; i++) {
    const t = O.botIzTur(1000 + i * 17, (i % 5) / 4, i % 40), t2 = O.botIzTur(1000 + i * 17, (i % 5) / 4, i % 40);
    if (JSON.stringify(t) !== JSON.stringify(t2)) tamam = false;
    if (t.takim.length !== K.takimBoyutu(t.seviye) || t.seviye < 2 || t.seviye > 8) svOk = false;
    if (new Set(t.takim.map(b => b.y * 4 + b.x)).size !== t.takim.length || t.takim.some(b => b.x < 0 || b.x > 3 || b.y < 0 || b.y > 2)) hucre = false;
    if (t.takim.some(b => (b.e || []).length > 3)) esya = false;
  }
  ok(tamam, 'bot izi belirlenimci: aynı tohum, güç ve tur → aynı kadro');
  ok(svOk && hucre && esya, 'bot izi: takım boyu = seviye, 4×3 tahtada farklı hücreler, birim başına en çok 3 eşya');
  const ort = (r, g, f) => { let s = 0; for (let i = 0; i < 100; i++) s += f(O.botIzTur(5000 + i * 31, g, r)); return s / 100; };
  const y2 = (t) => t.takim.filter(b => b.s >= 2).length / t.takim.length, te = (t) => t.takim.reduce((s, b) => s + (b.e || []).filter(id => D.esya(id).tip === 'tam').length, 0);
  ok(ort(5, 0.5, y2) < ort(12, 0.5, y2) && ort(12, 0.5, y2) < ort(19, 0.5, y2), `★2 oranı turla artar (2-3 ${ort(5, 0.5, y2).toFixed(2)}, 3-3 ${ort(12, 0.5, y2).toFixed(2)}, 4-3 ${ort(19, 0.5, y2).toFixed(2)})`);
  ok(ort(19, 0, te) < ort(19, 1, te) && ort(19, 0, y2) < ort(19, 1, y2), `güç ★2'yi ve eşyayı artırır (4-3 tam eşya: güç 0 → ${ort(19, 0, te).toFixed(1)}, güç 1 → ${ort(19, 1, te).toFixed(1)})`);
  ok(ort(26, 0.5, (t) => t.takim.filter(b => b.f).length) >= 1.5 && ort(2, 0.5, (t) => t.takim.filter(b => b.f).length) === 0, 'kaynaşmış birim: 1-3\'te yok, 5-3\'te 2');
  const b0 = O.botIzTur(77, 0.5, 2); ok(b0.takim.reduce((s, b) => s + (b.e || []).length, 0) >= 1 && b0.yedek.length === 0 && b0.kut === null, '1-3: 2 bileşen (tam eşyaya dönüşebilir), yedek boş, Kut kaydı yok (yapay zekâ)');
}

// ── 3) kayıtlı iz ve iz tükenmesi (4.7) ──
{
  const turlar = [{ r: 3, seviye: 4, takim: [{ h: 'golem', s: 1, x: 0, y: 0 }, { h: 'kurt', s: 1, x: 2, y: 0 }, { h: 'ayi', s: 2, x: 1, y: 0 }], yedek: [], armagan: [], kut: { i: 1, t: 4 } },
    { r: 5, seviye: 4, takim: [{ h: 'golem', s: 1, x: 3, y: 0 }, { h: 'kurt', s: 1, x: 1, y: 0 }, { h: 'ayi', s: 2, x: 0, y: 1 }], yedek: [], armagan: [], kut: null }];
  const iz = { turlar };
  ok(O.izTur(iz, 4).takim[0].x === 0 && O.izTur(iz, 4).kut.i === 1 && O.izTur(iz, 5).takim[0].x === 3 && O.izTur(iz, 1).r === 1 && O.izTur(iz, 1).takim[0].x === 0, 'r\'ye kadarki en son tur kullanılır (önce yoksa ilk tur)');
  const t6 = O.izTur(iz, 6), t7 = O.izTur(iz, 7), t9 = O.izTur(iz, 9);
  ok(t6.takim[1].s === 2 && t6.takim[0].s === 1 && t7.takim.every(b => b.s === 2) && t9.takim.every(b => b.s === 2), 'iz tükenince her ek tur ★\'ı en düşük birim (en soldaki önce) bir ★ yükselir, en çok ★2');
  ok(!t9.takim.some(b => b.e) && O.izTur(iz, 10).takim.some(b => (b.e || []).some(id => D.esya(id).tip === 'tam')), 'bölüm değişiminde (2 → 3) 1 tam eşya');
  ok(turlar[1].takim[0].s === 1 && !turlar[1].takim.some(b => b.e), 'iz kaydı değişmez');
}

// ── 4) lobi kurma (4.7) ──
{
  const z = (o, kupa, sira, surum = 1) => ({ macId: o + kupa, oyuncu: o, ad: 'İz ' + o, kupa, sira, surum, turlar: [O.botIzTur(3, 0.5, 4)] });
  const l = O.lobiIzler(300, 11, [z('a', 320, 6), z('b', 500, 1), z('c', 200, 2), z('a', 310, 1), z('ben', 300, 1), z('d', 290, 0, 2), z('e', 250, 7)], 'ben', 1);
  ok(l.length === 7 && l[0].oyuncu === 'c' && l[1].oyuncu === 'a' && l[2].oyuncu === 'e' && l.filter(x => x.turlar).length === 3 && l.slice(3).every(x => x.bot),
    'lobi izleri: ±150 kupa, kendi izi yok, oyuncu başına 1, sürüm aynı; ilk 4\'e girmişler önde; eksik bot izi');
  const b = O.lobiIzler(800, 5);
  ok(b.length === 7 && new Set(b.map(x => x.ad)).size === 7 && b.every(x => x.bot && x.bot.guc >= 0 && x.bot.guc <= 1 && x.kupa === 800), 'iz yoksa 7 bot izi, adları farklı, güç 0–1');
  const lb = botLobi(42, 300);
  ok(lb.oyuncular.length === 8 && lb.oyuncular.every(o => o.can === 100 && !o.olu) && !lb.oyuncular[0].canli, 'lobi: 8 oyuncu, 100 can');
  const lc = L.lobiYeni({ ad: 'Sen', kupa: 300 }, O.lobiIzler(300, 1), 9);
  ok(lc.oyuncular[0].canli && !lc.oyuncular[1].canli && JSON.parse(JSON.stringify(lc)).oyuncular.length === 8, 'canlı oyuncu 0; lobi JSON\'a yazılabilir (kayıt için)');
}

// ── 5) eşleşme sırası ve Yansıma (4.2) ──
{
  const lb = botLobi(7, 300), r = 4, es = L.eslesmeKur(lb, r), hep = es.ciftler.flat();
  ok(es.ciftler.length === 4 && !es.yansima && new Set(hep).size === 8, '8 yaşayan: 4 çift, herkes bir kez');
  ok(JSON.stringify(L.eslesmeKur(lb, r)) === JSON.stringify(es) && JSON.stringify(L.eslesmeKur(lb, r + 1)) !== JSON.stringify(es), 'eşleşme lobi tohumu + tur ile belirlenimci');
  lb.oyuncular[3].olu = true; const e7 = L.eslesmeKur(lb, r);
  ok(e7.ciftler.length === 3 && e7.yansima && e7.yansima.a !== 3 && e7.yansima.kopya !== 3 && e7.yansima.kopya !== e7.yansima.a && !e7.ciftler.flat().includes(e7.yansima.a), '7 yaşayan: 3 çift + biri Yansıma ile (kopya başka bir yaşayan)');
  for (const o of lb.oyuncular) o.sonYansima = o.i !== 5;
  lb.oyuncular[3].sonYansima = false; const e7b = L.eslesmeKur(lb, r);
  ok(e7b.yansima.a === 5, 'geçen tur Yansıma\'yla dövüşen bu tur Yansıma\'ya düşmez');
  // yasak: son 3 turun rakibi
  const lx = botLobi(8, 300); let ihlal = 0, kontrol = 0;
  for (let rr = 3; rr < 25; rr++) {
    if (L.turPlan(rr).tip !== 'pvp') continue;
    const ee = L.eslesmeKur(lx, rr);
    for (const [a, b] of ee.ciftler) { kontrol++; if (lx.oyuncular[a].gecmisRakip.slice(-3).includes(b)) ihlal++; }
    for (const o of lx.oyuncular) { const rk = L.lobiRakip(ee, o.i); o.gecmisRakip.push(rk.j); }
  }
  ok(ihlal === 0 && kontrol > 40, `8 kişide son 3 turun rakibiyle karşılaşılmaz (${kontrol} eşleşme, ${ihlal} tekrar)`);
  const l2 = botLobi(9, 300); l2.oyuncular.forEach(o => { o.olu = o.i > 1; }); l2.oyuncular[0].gecmisRakip = [1, 1, 1];
  const e2 = L.eslesmeKur(l2, 10); ok(e2.ciftler.length === 1 && e2.ciftler[0].sort().join() === '0,1', '2 kişi kalınca yasak yok: final düellosu');
}

// ── 6) hasar, seri, elenme ve sıralama (4.4, 4.5) ──
{
  const lb = botLobi(21, 300), r = 10; lb.r = r; // 3-1
  const es = L.eslesmeKur(lb, r), rp = L.lobiTurOyna(lb, r, { eslesme: es });
  ok(rp.sonuclar.length === 4 && rp.sonuclar.every(s => s.tip === 'pvp'), '8 hayalet: 4 hayalet × hayalet savaşı motorda oynandı');
  const taban = K.bolumTabani[3];
  ok(rp.sonuclar.every(s => (s.kazanan === 0 ? s.hasar[0] === 0 && s.hasar[1] === taban + s.kalanPuan : s.kazanan === 1 ? s.hasar[1] === 0 && s.hasar[0] === taban + s.kalanPuan : s.hasar[0] === taban && s.hasar[1] === taban)),
    `kaybeden bölüm tabanı (${taban}) + kazananın sağ kalan yıldızları kadar can kaybeder; beraberlikte ikisi de taban`);
  ok(lb.oyuncular.every(o => o.can === 100 - rp.hasar[o.i]) && lb.oyuncular.every(o => o.gecmisRakip.length === 1 && o.seri.n === 1), 'canlar düştü, rakipler ve seriler kaydedildi');
  // Yansıma: kopyalanan oyuncu hasar almaz
  const ly = botLobi(22, 300); ly.oyuncular[7].olu = true; ly.oyuncular[7].sira = 8; ly.r = 11;
  const ey = L.eslesmeKur(ly, 11), ry = L.lobiTurOyna(ly, 11, { eslesme: ey }), sy = ry.sonuclar.find(s => s.tip === 'yansima');
  ok(sy && sy.b === ey.yansima.kopya && sy.hasar[1] === 0 && ry.hasar[sy.b] === (ry.sonuclar.find(s => s.tip === 'pvp' && (s.a === sy.b || s.b === sy.b)) || { hasar: [0, 0] }).hasar[ry.sonuclar.find(s => s.tip === 'pvp' && (s.a === sy.b || s.b === sy.b)).a === sy.b ? 0 : 1],
    'Yansıma\'ya kaybeden normal hasar alır; Yansıma\'yı yenmek kopyalanana hasar vermez');
  // Son Üç ve Son İki
  const l3 = botLobi(23, 300); l3.oyuncular.forEach(o => { if (o.i > 2) { o.olu = true; o.sira = 9 - o.i; } }); l3.r = 17;
  const r3 = L.lobiTurOyna(l3, 17), s3 = r3.sonuclar.find(s => s.tip === 'pvp');
  ok(r3.yasayan === 3 && s3 && Math.max(...s3.hasar) === (s3.kazanan === -1 ? K.bolumTabani[4] + 3 : K.bolumTabani[4] + 3 + s3.kalanPuan), 'Son Üç: taban +3');
  // elenme ve sıra: aynı turda elenenlerde tur başı canı fazla olan önde
  const le = botLobi(24, 300); le.oyuncular[2].can = 1; le.oyuncular[5].can = 3; le.oyuncular[2].turBasiCan = 1; le.oyuncular[5].turBasiCan = 3;
  le.oyuncular.forEach(o => { if (o.i === 2 || o.i === 5) o.can = 0; });
  const el = L.siralamaGuncelle(le, 12);
  ok(el.join() === '5,2' && le.oyuncular[5].sira === 7 && le.oyuncular[2].sira === 8 && le.oyuncular[5].elenmeR === 12, 'aynı turda elenenler: tur başı canı fazla olan önde (7.), öbürü 8.');
  ok(L.lobiSira(le, 0) === 1 && L.lobiSira(le, 2) === 8, 'anlık sıra: yaşayanlar cana göre, elenenler kesin sıralarıyla');
}

// ── 7) kupa (4.5) ──
ok([1, 2, 3, 4, 5, 6, 7, 8].map(s => L.kupaDegisim(s, 1000)).join() === '40,30,20,10,-10,-20,-30,-40', 'kupa tablosu (1000 kupada)');
ok([5, 8].map(s => L.kupaDegisim(s, 300)).join() === '-5,-20' && L.kupaDegisim(8, 10) === -10 && L.kupaDegisim(8, 0) === 0 && L.kupaDegisim(1, 0) === 40, '0–400 kupada kayıp yarı; kupa 0\'ın altına düşmez');

// ── 8) havuz (2.3): hayaletlerin kadroları düşer ──
{
  const lb = botLobi(31, 300), r = 20, h = L.havuzLobi(lb, r, []), tam = L.havuzKalan([]);
  const gh = L.kopyaSay(lb.oyuncular.flatMap(o => L.lobiKadro(lb, o.i, r).takim)); // benzetim lobisinde oyuncu 0 da hayalet
  ok(D.KAHRAMANLAR.every(x => h[x.id] === Math.max(0, tam[x.id] - (gh[x.id] || 0))), 'lobide havuz: yaşayan hayaletlerin bu turki kopyaları düşülür');
  lb.oyuncular[3].olu = true; const h2 = L.havuzLobi(lb, r, []);
  ok(D.KAHRAMANLAR.some(x => h2[x.id] > h[x.id]) || L.lobiKadro(lb, 3, r).takim.length === 0, 'elenen hayaletin kahramanları havuza döner');
}

// ── 9) alamet (8): lobinin tamamına aynı, art arda gelmez ──
{
  let art = 0, b1 = true;
  for (let r = 0; r < 50; r++) { const a = L.lobiAlamet(1234, r), b = L.lobiAlamet(1234, r + 1), p = L.turPlan(r), q = L.turPlan(r + 1);
    if (p.bolum === 1 && a !== 'yok') b1 = false; if (p.tip !== 'kervan' && q.tip !== 'kervan' && p.bolum > 1 && a === b) art++; }
  ok(b1 && art === 0 && L.turPlan(6).tip === 'kervan' && L.lobiAlamet(1234, 6) === 'yok', 'lobi alameti: bölüm 1 ve Kervan Durgun Gök, aynı alamet art arda gelmez');
}

// ── 10) canlı oyuncunun sonucu lobiye işlenir ──
{
  const lb = L.lobiYeni({ ad: 'Sen', kupa: 300 }, O.lobiIzler(300, 3), 3), r = 4, es = L.eslesmeKur(lb, r), rk = L.lobiRakip(es, 0);
  const rp = L.lobiTurOyna(lb, r, { eslesme: es, canliTakim: [{ h: 'golem', s: 1, x: 0, y: 0 }], canliSonuc: { kazanan: 1, kalanPuan: 3, kalanSayi: 2, sure: 12 } });
  ok(rp.sonuclar.length === 4 && lb.oyuncular[0].can === 100 - (K.bolumTabani[2] + 3) && lb.oyuncular[rk.j].can === 100, 'canlı oyuncunun yenilgisi: 3 hayalet savaşı + canlının sonucu; kazanan hayalet can kaybetmez');
}

// ── 11) benzetim: 8 bot izinden oluşan lobiler baştan sona (bölüm 11) ──
{
  const N = +(process.env.LOBI_N || 200), t0 = Date.now();
  const savasTuru = (rSon) => { let n = 0; for (let q = 0; q <= rSon; q++) if (L.turPlan(q).tip !== 'kervan') n++; return n; };
  const sure = (tur) => { // birincinin tahmini süresi (bölüm 1.2): hazırlık 20/25 sn, savaş + 4 sn giriş/sonuç, Kervan 15 sn, Armağan 15 sn
    let s = 0; for (const x of tur) { const p = L.turPlan(x.r); if (p.tip === 'kervan') { s += 15; continue; } s += (p.bolum === 1 ? 20 : 25) + x.sure + 4 + (p.armagan ? 15 : 0); } return s / 60; };
  const bitis = [], birinciTur = [], ilkElenme = [], ortaElenme = [], savasSure = [], birinciDk = [], b1Kayip = [], siraOk = [];
  let sinir = 0, pvp = 0, b1 = 0, belirlenimci = true;
  for (let n = 0; n < N; n++) {
    const tohum = 1000 + n * 7717, kupa = (n * 37) % 800, lb = botLobi(tohum, kupa), turlar = lb.oyuncular.map(() => []);
    while (!L.lobiBitti(lb) && lb.r < K.lobiTurTavan) {
      const rp = L.lobiTurOyna(lb, lb.r);
      for (const s of rp.sonuclar) {
        turlar[s.a].push({ r: rp.r, sure: s.sure }); if (s.tip === 'pvp') turlar[s.b].push({ r: rp.r, sure: s.sure });
        if (s.tip === 'pve') { if (L.turPlan(rp.r).bolum === 1) { b1++; if (s.kazanan !== 0) b1Kayip.push(1); } continue; }
        pvp++; savasSure.push(s.sure); if (s.sure >= K.savasSuresi) sinir++;
      }
      if (rp.tip === 'kervan') for (const o of lb.oyuncular) if (!o.olu) turlar[o.i].push({ r: rp.r, sure: 0 });
    }
    L.lobiSonaKadar(lb);
    const kaz = lb.oyuncular.find(o => o.sira === 1), el = lb.oyuncular.filter(o => o.sira > 1).map(o => o.elenmeR).sort((a, b) => a - b);
    bitis.push(lb.r - 1); birinciTur.push(savasTuru(lb.r - 1)); ilkElenme.push(el[0]); ortaElenme.push(...el); birinciDk.push(sure(turlar[kaz.i]));
    siraOk.push(lb.oyuncular.map(o => o.sira).sort().join() === '1,2,3,4,5,6,7,8');
    if (n < 3) { const l2 = botLobi(tohum, kupa); L.lobiSonaKadar(l2); if (JSON.stringify(l2.oyuncular.map(o => [o.sira, o.can, o.elenmeR])) !== JSON.stringify(lb.oyuncular.map(o => [o.sira, o.can, o.elenmeR]))) belirlenimci = false; }
  }
  const ms = Date.now() - t0;
  console.log(`  ${N} lobi, ${pvp} PvP savaşı, ${(ms / 1000).toFixed(1)} sn`);
  ok(belirlenimci && siraOk.every(Boolean), 'benzetim belirlenimci; her lobide sıralar 1–8, her biri bir kez');
  const bt = medyan(birinciTur);
  ok(bt >= 22 && bt <= 26, `maç süresi: birinci ortanca ${bt} savaş turu oynar (hedef 22–26; Kervan turları hariç; maç ortanca ${L.turAd(medyan(bitis))} turunda biter)`);
  const mb = medyan(bitis);
  ok(mb >= 25 && mb <= 28, `maçın bittiği tur ortanca ${L.turAd(mb)} (hedef 5-2 … 5-5)`);
  const ie = medyan(ilkElenme);
  ok(ie >= 15 && ie <= 19, `ilk elenme turu ortanca ${L.turAd(ie)} (hedef 4-1 ± 2 tur)`);
  const oe = medyan(ortaElenme);
  ok(oe >= 21 && oe <= 26, `elenen oyuncuların ortanca elenme turu ${L.turAd(oe)} (belge: ortalama oyuncu 4-6 … 5-3; 1 tur pay)`);
  const dk = medyan(birinciDk);
  ok(dk >= 17 && dk <= 22, `birincinin tahmini süresi ortanca ${dk.toFixed(1)} dk (hedef 18–20 dk; tur sayısı × süre tablosu 1.2)`);
  ok(medyan(savasSure) >= 14 && medyan(savasSure) <= 20 && dilim(savasSure, 0.9) <= 28, `savaş süresi ortanca ${medyan(savasSure)} sn, %90 dilim ${dilim(savasSure, 0.9)} sn (hedef 16–20 / ≤ 28)`);
  ok(sinir / pvp < 0.05, `süre sınırıyla biten savaş %${(100 * sinir / pvp).toFixed(1)} (hedef < %5)`);
  ok(b1Kayip.length / Math.max(1, b1) <= 0.1, `bölüm 1'de canavarı kaybetme %${(100 * b1Kayip.length / Math.max(1, b1)).toFixed(1)} (hedef ≤ %10)`);
}

console.log(hata ? `${hata} hata` : 'lobi testleri geçti');
process.exit(hata ? 1 : 0);
