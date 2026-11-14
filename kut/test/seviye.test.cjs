// node kut/test/seviye.test.cjs — lobi.js: deneyim/seviye eğrisi, kahraman havuzu, seviyeye bağlı dükkân olasılıkları
const D = require('../data.js'), S = require('../sim.js'), L = require('../lobi.js');
const K = D.KURAL;
let hata = 0; const ok = (c, m) => { if (!c) { hata++; console.log('✗', m); } else console.log('✓', m); };

// 1) KURAL: Hızlı Maç ayrı, yeni alanlar belgedeki sayılarla
ok(K.hizli && K.hizli.altinTur === 10 && K.hizli.can === 5 && K.hizli.zaferHedef === 7 && K.hizli.yenile === 1 && K.hizli.kaynastir === 3 && K.hizli.yedek === 4, 'KURAL.hizli: eski kurallar (10 altın, 5 can, 7 zafer, yenile 1, kaynaştır 3, yedek 4)');
ok([1, 2, 3, 4, 5, 6, 7, 8, 9, 12].map(K.hizli.yuva).join() === '3,3,4,4,5,5,6,6,6,6', 'KURAL.hizli.yuva(tur) eski eğri');
ok(K.yedek === 7 && K.tahtaSutun === 4 && K.tahtaSira === 3 && K.takimTavan === 8, 'tahta 4×3, en çok 8, yedek 7');
ok(K.seviyeBaslangic === 2 && K.seviyeTavan === 8 && K.xpTablo.slice(2).join() === '2,6,10,20,32,48' && K.pasifXp === 2 && K.xpBedel === 4 && K.xpMiktar === 4, 'seviye 2→8, deneyim tablosu 2/6/10/20/32/48, +2 pasif, 4 altın = 4 deneyim');
ok(K.havuzAdet[1] === 22 && K.havuzAdet[2] === 18 && K.havuzAdet[3] === 14, 'havuz K1 22, K2 18, K3 14');
const tablo = { 2: [100, 0, 0], 3: [75, 25, 0], 4: [55, 40, 5], 5: [40, 45, 15], 6: [30, 45, 25], 7: [20, 40, 40], 8: [15, 35, 50] };
ok(Object.entries(tablo).every(([sv, t]) => K.kademeOlasilik(+sv).map(x => Math.round(x * 100)).join() === t.join()), 'dükkân olasılıkları seviyeye bağlı (tablo 2.2)');
ok(Object.keys(tablo).every(sv => Math.abs(K.kademeOlasilik(+sv).reduce((a, b) => a + b, 0) - 1) < 1e-9), 'her seviyede olasılıklar toplamı 1');

// 2) deneyim eğrisi: toplam deneyim → seviye (tablo 2.1)
const topla = (n) => { let r = { seviye: 2, xp: 0 }; for (let i = 0; i < n; i++) r = L.xpEkle(r.seviye, r.xp, 1); return r; };
ok([[0, 2], [1, 2], [2, 3], [7, 3], [8, 4], [17, 4], [18, 5], [37, 5], [38, 6], [69, 6], [70, 7], [117, 7], [118, 8], [500, 8]].every(([n, sv]) => topla(n).seviye === sv), 'toplam deneyim 2/8/18/38/70/118 → Sv 3/4/5/6/7/8');
ok(JSON.stringify(L.xpEkle(2, 0, 4)) === '{"seviye":3,"xp":2}', 'artan deneyim taşınır: Sv2 +4 → Sv3 2/6');
ok(JSON.stringify(L.xpEkle(3, 4, 40)) === '{"seviye":6,"xp":8}', 'tek eklemede birden çok seviye: Sv3 4/6 +40 → Sv6 8/32');
ok(JSON.stringify(L.xpEkle(7, 40, 30)) === '{"seviye":8,"xp":0}' && L.xpGerek(8) === 0, 'tavan Sv 8: deneyim 0, gereken 0');
// pasif deneyimle kendiliğinden ulaşılan seviye: 1-2 sonu Sv3 (2 deneyim)
ok(L.xpEkle(2, 0, K.pasifXp).seviye === 3, 'ilk pasif deneyim (2) → Sv 3');

// 3) kopya sayımı ve havuz
const say = L.kopyaSay([{ h: 'golem', s: 1 }, { h: 'golem', s: 2 }, { h: 'kurt', s: 3 }, { h: 'kugu', s: 1, f: 'golem' }, null]);
ok(say.golem === 5 && say.kurt === 9 && say.kugu === 1, 'kopya: ★1 = 1, ★2 = 3, ★3 = 9, kaynaşmış ikinci kahraman 1');
const kalan = L.havuzKalan([[{ h: 'golem', s: 3 }, { h: 'anka', s: 2 }], [{ h: 'golem', s: 3 }, { h: 'golem', s: 3 }, { h: 'anka', s: 1 }]]);
ok(kalan.golem === 0 && kalan.anka === 10 && kalan.kurt === 22 && kalan.ejder === 14 && Object.keys(kalan).length === D.KAHRAMANLAR.length, 'havuzKalan: oyuncu + hayaletler düşülür, 0 altına inmez');

// 4) dükkân çekimi: belirlenimci, olasılıklar seviyeye uyar, havuz ağırlığı
const tam = L.havuzKalan([]);
const a1 = L.dukkanCek(5, tam, S.rng(42)), a2 = L.dukkanCek(5, tam, S.rng(42));
ok(a1.length === 5 && JSON.stringify(a1) === JSON.stringify(a2), 'aynı tohum → aynı dükkân ' + a1.join(','));
for (const sv of [2, 3, 4, 6, 8]) {
  const n = [0, 0, 0, 0], R = S.rng(1000 + sv); let top = 0;
  for (let i = 0; i < 4000; i++) for (const id of L.dukkanCek(sv, tam, R)) { n[D.kahraman(id).kademe]++; top++; }
  const ol = K.kademeOlasilik(sv), fark = Math.max(...ol.map((o, k) => Math.abs(n[k + 1] / top - o)));
  ok(fark < 0.02, `Sv ${sv} kademe dağılımı ${n.slice(1).map(x => (100 * x / top).toFixed(1)).join('/')} ≈ ${ol.map(x => Math.round(x * 100)).join('/')}`);
}
{ // ağırlık: kalan kopyayla orantılı (golem 22, kurt 2 kaldıysa kurt nadir)
  const k = { ...tam, kurt: 2 }; let g = 0, ku = 0; const R = S.rng(7);
  for (let i = 0; i < 4000; i++) for (const id of L.dukkanCek(2, k, R)) { if (id === 'golem') g++; if (id === 'kurt') ku++; }
  ok(ku > 0 && g / ku > 6, `kalan kopyaya göre ağırlık: golem ${g} / kurt ${ku}`);
}
{ // kademe boşsa alt kademe; hiç yoksa boş yuva; dükkândaki kart çekim boyunca düşer
  const k = {}; for (const h of D.KAHRAMANLAR) k[h.id] = h.kademe === 3 ? 0 : h.kademe === 2 ? (h.id === 'koc' ? 1 : 0) : 0;
  const d = L.dukkanCek(8, k, S.rng(5));
  ok(d.filter(x => x === 'koc').length === 1 && d.filter(x => x === null).length === 4, 'K3 boş → K2; son kopya bir kez çıkar, gerisi boş yuva: ' + JSON.stringify(d));
  ok(k.koc === 1, 'dukkanCek verilen havuzu değiştirmez');
}
process.exit(hata ? 1 : 0);
