// node kut/test/canavar.test.cjs — canavar turları (5.5), ganimet (5.4), Kervan (5.4), bölüm-tur yapısı (1.1), Gün Batımı (1.4)
global.btoa = s => Buffer.from(s, 'binary').toString('base64'); global.atob = s => Buffer.from(s, 'base64').toString('binary');
const D = require('../data.js'), S = require('../sim.js'), L = require('../lobi.js'), O = require('../online.js');
const K = D.KURAL;
let hata = 0; const ok = (c, m) => { if (!c) { hata++; console.log('✗', m); } else console.log('✓', m); };

// ── 1) canavar verisi (tablo 5.5) ──
{
  // tempo ayarı: tablo 5.5'in canı ×1,4, saldırısı ×0,8 (kahramanlarla aynı oran; DENGE_RAPORU.md)
  const t = { cakil: [392, 18, 0.7, 1, null], kirpi: [588, 24, 0.8, 1, null], tasKabuk: [1260, 22, 0.5, 1, null], kumAkrebi: [980, 40, 0.8, 1, null],
    anaAkrep: [2100, 56, 0.7, 1, 'akrepZehir'], gokBalinasi: [7280, 68, 0.5, 3, 'balinaSarki'], kadimBekci: [4480, 88, 0.6, 1, 'bekciDarbe'], yildizYiyen: [12600, 112, 0.6, 3, 'yildizYutan'] };
  ok(D.CANAVARLAR.length === 8 && D.CANAVARLAR.every(c => { const v = t[c.id]; return v && c.can === v[0] && c.atk === v[1] && c.as === v[2] && c.menzil === v[3] && c.yetenek === v[4]; }), '8 canavar: can, saldırı, hız, menzil, yetenek (tablo 5.5, tempo oranıyla)');
  const mana = { anaAkrep: 80, gokBalinasi: 100, kadimBekci: 90, yildizYiyen: 100 };
  ok(D.CANAVARLAR.every(c => c.mana === (mana[c.id] || 9999)), 'yeteneksizlerin manası 9999; Ana Akrep 80, Gök Balinası 100, Kadim Bekçi 90, Yıldız Yiyen 100');
  ok(D.CANAVARLAR.every(c => c.kademe === 0 && c.soy.length === 0 && D.kahraman(c.id) === c && D.canavar(c.id) === c), 'canavar: kademe 0, soy yok; kahraman(id) canavara da bakar');
  ok(D.CANAVARLAR.every(c => c.gorunum === c.id) && D.CANAVARLAR.every(c => !D.KAHRAMANLAR.some(h => h.id === c.id)), 'canavar kahraman listesinde yok; kendi modeli var');
  ok(Object.keys(L.havuzKalan([L.pveDalga(9)])).length === D.KAHRAMANLAR.length && Object.values(L.havuzKalan([L.pveDalga(9)])).every((n, i) => n === K.havuzAdet[D.KAHRAMANLAR[i].kademe]), 'canavarlar kahraman havuzundan düşmez');
  ok(D.YETENEK.akrepZehir && D.YETENEK.balinaSarki && D.YETENEK.bekciDarbe && D.YETENEK.yildizYutan && D.PASIF.dikenKirpi, 'canavar yetenek ve pasif metinleri');
}

// ── 2) bölüm-tur yapısı ve dalgalar (1.1, 5.5) ──
{
  const ad = (r) => L.pveDalga(r).map(b => b.h).join(',');
  ok(ad(0) === 'cakil,cakil' && ad(1) === 'cakil,cakil,cakil' && ad(2) === 'tasKabuk,kirpi,kirpi', '1-1 2 Çakıl, 1-2 3 Çakıl, 1-3 2 Diken Kirpi + Taş Kabuk');
  ok(ad(9) === 'kumAkrebi,kumAkrebi,kumAkrebi,anaAkrep' && ad(16) === 'gokBalinasi' && ad(23) === 'kadimBekci,kadimBekci' && ad(30) === 'yildizYiyen', '2-7 3 Kum Akrebi + Ana Akrep, 3-7 Gök Balinası, 4-7 2 Kadim Bekçi, 5-7 Yıldız Yiyen');
  ok([37, 44, 51].every(r => ad(r) === 'yildizYiyen,kadimBekci,kadimBekci'), '6-7 ve sonrası Yıldız Yiyen + 2 Kadim Bekçi');
  ok([3, 4, 5, 6, 7, 8].every(r => L.pveDalga(r).length === 0), 'PvP ve Kervan turlarında dalga yok');
  let hep = true;
  for (let r = 0; r < 60; r++) { const p = L.turPlan(r), d = L.pveDalga(r); if ((p.tip === 'pve') !== (d.length > 0)) hep = false;
    if (new Set(d.map(b => b.y * 4 + b.x)).size !== d.length || d.some(b => b.x < 0 || b.x > 3 || b.y < 0 || b.y > 2 || b.s !== 1)) hep = false; }
  ok(hep, 'her canavar turunda dalga var (★1, farklı hücreler, 4×3 içinde)');
  ok(['1-1', '1-2', '1-3', '2-7', '3-7', '4-7', '5-7', '6-7'].every(a => { const r = [...Array(60).keys()].find(x => L.turAd(x) === a); return L.turPlan(r).tip === 'pve'; })
    && ['2-4', '3-4', '4-4', '5-4'].every(a => L.turPlan([...Array(60).keys()].find(x => L.turAd(x) === a)).tip === 'kervan'), 'tur planı: 1-1…1-3 ve x-7 canavar, x-4 Kervan');
  const bs = L.baslangicSecenek(S.rng(5));
  ok(bs.length === 3 && new Set(bs).size === 3 && bs.every(id => D.kahraman(id).kademe === 1), 'bölüm 1 öncesi 3 farklı kademe-1 kahraman seçeneği');
  const az = {}; for (const h of D.KAHRAMANLAR) az[h.id] = 0; az.kurt = 3; az.golem = 1;
  ok(L.baslangicSecenek(S.rng(5), az).sort().join() === 'golem,kurt', 'bedava seçim havuzda kalanlardan (tükenen gelmez)');
}

// ── 3) canavar yetenekleri ve Diken Sırt (motor) ──
{
  // birim sırası: taraf 0 önce. Canavara Kut verilir (kut(1, 0)): mana dolar, yetenek ilk adımda çalışır.
  const sav = (A, B) => S.Savas(A, B, { tohum: 3 });
  const kurtlar = (n) => Array.from({ length: n }, (_, i) => ({ h: 'kurt', s: 1, x: i, y: 2 })); // uzakta: henüz vuruş yok
  const ilk = (sv, ad) => { sv.kut(1, 0); for (let i = 0; i < 3; i++) { sv.adim(); const f = sv.fx.filter(x => x.tip === 'yetenek' && x.ad === ad); if (f.length) return sv.fx; } return []; };
  let sv = sav(kurtlar(4), [{ h: 'gokBalinasi', s: 1, x: 1, y: 2 }]); let fx = ilk(sv, 'balinaSarki');
  ok(fx.length && sv.birimler.filter(u => u.taraf === 0).every(u => Math.abs(u.mx - u.hp - 110) < 1e-9), 'Balina Şarkısı: bütün düşmanlara 110 hasar');
  sv = sav(kurtlar(4), [{ h: 'yildizYiyen', s: 1, x: 0, y: 2 }]); fx = ilk(sv, 'yildizYutan');
  const vur = sv.birimler.filter(u => u.taraf === 0 && u.mx - u.hp > 0);
  ok(fx.length && vur.length === 3 && vur.every(u => Math.abs(u.mx - u.hp - 220) < 1e-9) && sv.birimler[3].hp === sv.birimler[3].mx, 'Yıldız Yutan: en yakın 3 düşmana 220 (en uzak sağlam)');
  sv = sav([{ h: 'kurt', s: 1, x: 1, y: 0 }], [{ h: 'kadimBekci', s: 1, x: 1, y: 0 }]); for (let i = 0; i < 4; i++) sv.adim(); fx = ilk(sv, 'bekciDarbe');
  ok(fx.length && fx.some(f => f.tip === 'hasar' && f.u === 0 && f.n === 250) && sv.birimler[0].durum.sersem, 'Bekçi Darbesi: hedefe 250 hasar ve sersemletme');
  sv = sav([{ h: 'kurt', s: 1, x: 1, y: 0 }], [{ h: 'anaAkrep', s: 1, x: 1, y: 0 }]); for (let i = 0; i < 4; i++) sv.adim(); fx = ilk(sv, 'akrepZehir');
  ok(fx.length && sv.birimler[0].durum.zehir && sv.birimler[0].durum.zehir.deger === 60 && sv.birimler[0].durum.zehir.sure > 3.9, 'Akrep Zehri: 4 sn, 60/sn');
  // Diken Sırt: Kurt (yakın) Diken Kirpi'ye vurunca vuruşun %15'i geri döner
  sv = sav([{ h: 'kurt', s: 1, x: 1, y: 0 }], [{ h: 'kirpi', s: 1, x: 1, y: 0 }]); let yans = null, vuru = null;
  for (let i = 0; i < 400 && !yans; i++) { sv.adim(); const h = sv.fx.find(f => f.tip === 'hasar' && f.u === 10 && f.k === 0), y = sv.fx.find(f => f.tip === 'hasar' && f.u === 0 && f.k === 10);
    if (h && y && sv.fx.indexOf(y) === sv.fx.indexOf(h) + 1) { vuru = h; yans = y; } }
  ok(yans && Math.abs(yans.n - Math.round(vuru.n * 0.15)) <= 1, `Diken Sırt: yakın vuruşun %15'i geri döner (${vuru && vuru.n} → ${yans && yans.n})`);
  // canavarla tam savaş: biter, kalanPuan canavar başına 1, kalan (eski ölçü) 0
  const r = S.Savas([{ h: 'golem', s: 1, x: 1, y: 0 }], L.pveDalga(1), { tohum: 2, gunBatimi: K.gunBatimi.basla }).sonunaKadar();
  ok(r && (r.kazanan !== 1 || (r.kalanPuan === r.kalanSayi && r.kalan === 0)), 'canavar savaşı biter; canavarın kalanPuan\'ı 1, eski kalan ölçüsü 0');
  // Arena'nın bot takımları canavarları ne sıklıkla yener (yalnız bilgi)
  const sat = [];
  for (const rr of [0, 1, 2, 9, 16, 23, 30, 37]) { let k = 0; for (let i = 0; i < 60; i++) { const A = O.botEsya(O.botTakim(rr + 1, 100 + i, 0.3, O.botSeviye(rr)), rr, 100 + i);
    if (S.Savas(A, L.pveDalga(rr), { tohum: i + 1, yz: [0], gunBatimi: K.gunBatimi.basla }).sonunaKadar().kazanan === 0) k++; } sat.push(L.turAd(rr) + ' %' + Math.round(100 * k / 60)); }
  console.log('  bot takımı canavara karşı kazanır:', sat.join(' · '));
}

// ── 4) Gün Batımı (1.4) ──
{
  // iki Taş Kabuk süre sınırına kadar dövüşür: GB. sn'den sonra her vuruş taban × (1 + 0,1 × tam saniye)
  const GB = K.gunBatimi.basla, SS = K.savasSuresi, TAB = D.canavar('tasKabuk').atk;
  const A = [{ h: 'tasKabuk', s: 1, x: 1, y: 0 }], B = [{ h: 'tasKabuk', s: 1, x: 1, y: 0 }];
  const sv = S.Savas(A, B, { tohum: 4, gunBatimi: GB }); let olay = null, c25 = 0, c30 = 0, once = 0, sonra = 0, yanlis = [];
  while (!sv.bitti) { sv.adim(); for (const f of sv.fx) { if (f.tip === 'gunBatimi') olay = f.t; if (f.tip !== 'hasar') continue;
      const bek = Math.round(TAB * (f.t < GB ? 1 : 1 + 0.1 * Math.floor(f.t - GB + 1e-9))); if (f.n !== bek) yanlis.push(f.t.toFixed(2) + ':' + f.n); if (f.t < GB) once++; else sonra++; }
    if (Math.abs(sv.t - (GB + 5.5)) < 0.01) c25 = sv.gunBatimiCarpan(); if (sv.t > GB + 9.9 && !c30) c30 = sv.gunBatimiCarpan(); }
  ok(!yanlis.length && once > 10 && sonra >= 4, `vuruş hasarı ${GB}. sn'den sonra her saniye +%10 (${once} vuruş önce, ${sonra} sonra${yanlis.length ? '; yanlış ' + yanlis.join(' ') : ''})`);
  ok(Math.abs(olay - GB) < 1e-6 && Math.abs(c25 - 1.5) < 1e-9 && Math.abs(c30 - 1.9) < 1e-9, `Gün Batımı olayı ${GB}. sn'de; çarpan +5,5 sn ×${c25}, +9,9 sn ×${c30}`);
  const yok = S.Savas(A, B, { tohum: 4 }); while (!yok.bitti) yok.adim();
  ok(yok.gunBatimiCarpan() === 1 && yok.sonuc.sure === SS && sv.sonuc.sure === SS, 'Gün Batımı verilmezse (Hızlı Maç) çarpan 1');
  ok(K.gunBatimi.basla === 30 && K.gunBatimi.artis === 0.1 && K.hizli.gunBatimi === null && SS === 45, 'KURAL.gunBatimi 30 sn, +%10 (süre sınırı 45 sn); Hızlı Maç\'ta yok');
  // zaman içi hasar da artar: GB + 5. sn'de 100/sn yanık adımı 5 yerine 7,5
  const yz = S.Savas(A, B, { tohum: 4, gunBatimi: GB }); let dot = null;
  while (!yz.bitti && dot === null) { if (Math.abs(yz.t - (GB + 5)) < 0.026) yz.birimler[1].durum.yanik = { sure: 5, deger: 100 }; yz.adim(); const f = yz.fx.find(x => x.tip === 'dot' && x.u === 10); if (f && yz.t > GB + 5) dot = f.n; }
  ok(dot === Math.round(100 * 0.05 * 1.5), `zaman içi hasar da artar (yanık adımı ${dot})`);
  // süre sınırına kalan savaş %5'in altında (Arena bot takımları, eşyalı)
  let sayi = 0, sinir = 0;
  for (let i = 0; i < 300; i++) { const r = 3 + (i * 7) % 38; if (L.turPlan(r).tip !== 'pvp') continue; const sv8 = O.botSeviye(r);
    const a = O.botEsya(O.botTakim(r + 1, 500 + i, (i % 5) / 4, sv8), r, 500 + i), b = O.botEsya(O.botTakim(r + 1, 9000 + i, ((i * 3) % 5) / 4, sv8), r, 9000 + i);
    const s = S.Savas(a, b, { tohum: i + 3, yz: [0, 1], gunBatimi: GB, alamet: D.ALAMETLER[i % 8].id }).sonunaKadar(); sayi++; if (s.sure >= SS) sinir++; }
  ok(sinir / sayi < 0.05, `süre sınırına kalan savaş %${(100 * sinir / sayi).toFixed(1)} (< %5, ${sayi} savaş)`);
}

// ── 5) ganimet (5.4) ──
{
  const g = (r, t, kalan) => L.ganimet(r, S.rng(t), kalan);
  ok(g(0, 1).esya.length === 1 && D.esya(g(0, 1).esya[0]).tip === 'bilesen' && g(0, 1).altin === 0, '1-1: 1 rastgele bileşen');
  const g12 = g(1, 2); ok(g12.kahraman.length === 1 && D.kahraman(g12.kahraman[0].h).kademe === 1 && g12.kahraman[0].s === 1 && g12.altin === 2 && g12.ekAltin === 0 && !g12.esya.length, '1-2: 1 kademe-1 kahraman + 2 altın');
  const g13 = g(2, 3); ok(g13.secim.length === 2 && new Set(g13.secim).size === 2 && g13.secim.every(id => D.esya(id).tip === 'bilesen') && g13.altin === 2, '1-3: 2 farklı bileşenden biri seçilir + 2 altın');
  const z = { altin: 0, bilesen: 0, kahraman: 0 }; let ort = 0; const N = 3000;
  for (let i = 0; i < N; i++) { const x = g(9, 100 + i); z[x.zarf]++;
    if (x.zarf === 'altin' && (x.ekAltin !== 3 || x.esya.length !== 1)) z.bozuk = 1; if (x.zarf === 'bilesen' && x.esya.length !== 2) z.bozuk = 1;
    if (x.zarf === 'kahraman' && (x.kahraman.length !== 1 || D.kahraman(x.kahraman[0].h).kademe !== 2 || x.esya.length !== 1)) z.bozuk = 1;
    let b = 0; for (let r = 0; r <= 16; r++) { const y = r === 9 ? x : g(r, 100 + i); b += y.esya.filter(id => D.esya(id).tip === 'bilesen').length + (y.secim && D.esya(y.secim[0]).tip === 'bilesen' ? 1 : 0); }
    b += 2; ort += b; } // 2-4 ve 3-4 Kervan: birer bileşen
  ok(!z.bozuk && Math.abs(z.altin / N - 0.4) < 0.03 && Math.abs(z.bilesen / N - 0.3) < 0.03 && Math.abs(z.kahraman / N - 0.3) < 0.03, `2-7: 1 bileşen + zarf (3 altın %${(100 * z.altin / N).toFixed(0)} / bileşen %${(100 * z.bilesen / N).toFixed(0)} / K2 kahraman %${(100 * z.kahraman / N).toFixed(0)})`);
  ok(Math.abs(ort / N - 7.3) < 0.05, `3-7 sonunda ortalama ${(ort / N).toFixed(2)} bileşen (belge: ~7,3)`);
  const g37 = g(16, 4); ok(g37.esya.length === 2 && g37.altin === 3, '3-7: 2 bileşen + 3 altın');
  const g47 = g(23, 5); ok(g47.secim.length === 3 && new Set(g47.secim).size === 3 && g47.secim.every(id => D.esya(id).tip === 'tam') && !g47.esya.length, '4-7: 3 tam eşyadan biri seçilir');
  ok(g(30, 6).esya.join() === 'kutTasi,sokumTasi', '5-7: Kut Taşı + Söküm Taşı');
  ok([37, 44, 51].every(r => { const x = g(r, r); return x.secim && x.secim.length === 3 && x.secim.every(id => D.esya(id).tip === 'tam'); }), '6-7 ve sonrası: 3 tam eşyadan biri');
  ok([3, 4, 5, 6, 7, 8].every(r => { const x = g(r, 1); return !x.esya.length && !x.kahraman.length && !x.secim && !x.altin; }), 'PvP ve Kervan turunda canavar ganimeti yok');
  ok([1, 2, 16].map(r => L.ganimetAltin(r)).join() === '2,2,3' && L.ganimetAltin(9) === 0, 'sabit ganimet altını 1-2 +2, 1-3 +2, 3-7 +3 (zarf altını ayrı)');
  const az = {}; for (const h of D.KAHRAMANLAR) az[h.id] = 0; az.yarasa = 1;
  ok([...Array(20).keys()].every(t => g(1, t, az).kahraman[0].h === 'yarasa'), 'kahraman ganimeti havuzda kalan kopyalardan');
  ok(JSON.stringify(g(9, 77)) === JSON.stringify(g(9, 77)), 'ganimet aynı tohumla aynı (belirlenimci)');
}

// ── 6) Kervan (5.4) ──
{
  const kv = (r, t, adet, kalan) => L.kervanSecenek(r, S.rng(t), adet, kalan);
  ok([1, 2, 3, 4, 5, 6, 7, 8].map(L.kervanAdet).join() === '3,3,4,4,5,5,5,5', 'seçenek sayısı: 1–2. sıra 3, 3–4. sıra 4, 5–8. sıra 5');
  ok(kv(5, 1, 3).length === 0 && kv(9, 1, 3).length === 0, 'Kervan turu değilse seçenek yok');
  const b2 = kv(6, 3, 5); ok(b2.length === 5 && b2.every(o => [1, 2].includes(D.kahraman(o.birim.h).kademe) && o.birim.s === 1 && !o.birim.f && D.esya(o.esya).tip === 'bilesen'), '2-4: K1–K2 kahraman + üstünde 1 bileşen');
  let hep3 = true; for (let t = 0; t < 50; t++) { const l = kv(13, t, 4); const f = l[0].birim;
    if (!(f.f && D.kahraman(f.h).kademe === 2 && D.kahraman(f.f).kademe === 1 && f.s === 1) || l.slice(1).some(o => o.birim.f || ![2, 3].includes(D.kahraman(o.birim.h).kademe)) || l.some(o => D.esya(o.esya).tip !== 'bilesen')) hep3 = false; }
  ok(hep3, '3-4: ilk seçenek hazır kaynaşmış K2×K1, diğerleri K2–K3, hepsi + 1 bileşen');
  const b4 = kv(20, 9, 5); ok(b4.every((o, i) => (i % 2 === 0 ? D.kahraman(o.birim.h).kademe === 3 && o.birim.s === 1 : D.kahraman(o.birim.h).kademe === 2 && o.birim.s === 2) && D.esya(o.esya).tip === 'bilesen'), '4-4: K3 ★1 ya da ★2 K2, + 1 bileşen');
  ok([27, 34, 41].every(r => kv(r, r, 3).every(o => D.kahraman(o.birim.h).kademe === 3 && o.birim.s === 1 && D.esya(o.esya).tip === 'tam')), '5-4 ve sonrası: K3 ★1 + 1 tam eşya');
  const az = havuz => { const k = {}; for (const h of D.KAHRAMANLAR) k[h.id] = 0; Object.assign(k, havuz); return k; };
  ok(kv(20, 2, 2, az({ ayi: 1, koc: 3 })).map(o => o.birim.h).join() === 'ayi,koc', 'Kervan kahramanları havuzda kalandan (★2 için 3 kopya gerekir)');
}

// ── 7) bot ve hayaletler: ganimet eşyası ilk seçimle ──
{
  ok(L.ganimetEsya(2, S.rng(8))[0] === L.ganimet(2, S.rng(8)).secim[0] && L.ganimetEsya(6, S.rng(8))[0] === L.kervanSecenek(6, S.rng(8), 3)[0].esya, 'bot: seçimde ve Kervan\'da ilk seçenek');
}

console.log(hata ? `${hata} HATA` : 'hepsi geçti');
process.exitCode = hata ? 1 : 0;
