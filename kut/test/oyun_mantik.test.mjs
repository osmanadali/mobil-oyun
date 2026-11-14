// node kut/test/oyun_mantik.test.mjs — web/oyun.js: tam maç (satın alma, birleşme, kaynaştırma, savaş, maç sonu), seviye/deneyim, havuz, Hızlı Maç
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
globalThis.window = globalThis; globalThis.btoa = s => Buffer.from(s, 'binary').toString('base64'); globalThis.atob = s => Buffer.from(s, 'base64').toString('binary');
const depo = {}; globalThis.localStorage = { getItem: k => depo[k] ?? null, setItem: (k, v) => { depo[k] = v; } };
require('../data.js'); require('../sim.js'); require('../online.js'); require('../lobi.js');
const K = window.KUT_DATA.KURAL;
const { Oyun } = await import('../web/oyun.js');
let hata = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) hata++; };
const o = new Oyun(); const olaylar = []; o.on('birlesti', e => olaylar.push(['birlesti', e])); o.on('kaynasti', e => olaylar.push(['kaynasti', e]));
await o.yeniMac();
ok(o.M.mod === 'arena' && o.M.tur === 1 && o.M.altin === 3 && o.M.can === 100 && o.M.dukkan.length === 5 && o.M.rakip, 'maç başladı: tur 1-1, başlangıç geliri 3 altın, 100 can, 5 kart, rakip hazır');
ok(o.M.tahta.length === 12 && o.M.yedek.length === 7 && o.M.seviye === 2 && o.M.xp === 0 && o.yuva() === 2, 'seviyeli maç: 4×3 tahta, 7 yedek, Sv 2, takım 2');
ok(o.M.dukkan.every(id => window.KUT_DATA.kahraman(id).kademe === 1), 'Sv 2 dükkânı yalnız K1');
ok(o.M.rakip.takim.length === 2 && o.M.rakip.takim.every(b => b.x >= 0 && b.x < 4 && b.y >= 0 && b.y < 3), 'rakip bot Sv 2: 2 kahraman, 4×3 konumlar');
// deneyim satın alma: 4 altın → 4 deneyim; Sv2→3 için 2 gerek, artan 2 taşınır
o.M.altin = 10; o.xpAl(); ok(o.M.seviye === 3 && o.M.xp === 2 && o.M.altin === 6 && o.yuva() === 3, 'deneyim al: Sv 3, 2/6 deneyim, 6 altın kaldı');
o.M.altin = 10;
// birleşme: aynı kahramandan 3 tane
o.M.dukkan = ['golem', 'golem', 'golem', 'kurt', 'kurbaga']; o.satinAl(0); o.satinAl(1); o.satinAl(2);
ok([...o.M.tahta, ...o.M.yedek].some(b => b && b.h === 'golem' && b.s === 2) && olaylar.some(e => e[0] === 'birlesti'), '3 golem → ★2 golem');
o.satinAl(3); o.satinAl(4);
// kaynaştır: kurt (tahta) × kurbağa
const ki = o.M.tahta.findIndex(b => b && b.h === 'kurt'), kb = [...o.M.tahta.keys()].find(i => o.M.tahta[i] && o.M.tahta[i].h === 'kurbaga');
o.M.altin = 5; o.yuvaDokun('tahta', ki); o.kaynasModDegistir(); o.yuvaDokun('tahta', kb);
ok(o.M.tahta[ki] && o.M.tahta[ki].f === 'kurbaga' && o.M.altin === 2, 'kaynaştırma: kurt × kurbağa, 3 altın düştü');
// maçı sonuna kadar oyna (görüntüsüz)
let ozet = null, tur = 0;
while (!ozet && tur++ < 40) {
  if (!o.M.rakip) await o.turBaslat(false);
  // parası yettikçe al, tahtayı doldur
  for (let i = 0; i < 5; i++) if (o.M.dukkan[i] && o.M.altin >= window.KUT_DATA.kahraman(o.M.dukkan[i]).kademe) o.satinAl(i);
  for (let i = 0; i < 4; i++) { const yi = o.M.yedek.findIndex(Boolean), ti = o.M.tahta.findIndex(x => !x); if (yi < 0 || ti < 0 || o.tahtaSay() >= o.yuva()) break; o.yuvaDokun('yedek', yi); o.yuvaDokun('tahta', ti); }
  const sim = o.savasHazirla(); const s = sim.sonunaKadar(); const r = o.savasBitti(s);
  if (r.bitti) ozet = r; else await o.turBaslat(false);
}
ok(ozet && ozet.bitti && ozet.kod.startsWith('KUT2-') && (ozet.kazandi ? ozet.can > 0 && ozet.turAd === '5-3' : ozet.can === 0), `maç bitti (${tur} tur, ${ozet && ozet.turAd}, ${ozet && ozet.kazandi ? 'kazandı' : 'elendi'}, ${ozet && ozet.can} can, kupa ${ozet && ozet.fark})`);
ok(o.P.mac === null && JSON.parse(depo['kut.profil.v2']).istat.mac === 1, 'profil kaydedildi, maç kapandı');
const d = o.duelloHazirla(ozet.kod); ok(d && d.sonunaKadar().kazanan !== undefined, 'düello kodu ile savaş');
ok(ozet.seviye >= 2 + 1, `maç sonunda savaş deneyimiyle seviye arttı (Sv ${ozet.seviye})`);

// ── pasif deneyim: ilk tur sonunda gelmez, sonra her savaş +2 ──
{
  const p = new Oyun(); await p.yeniMac('arena');
  p.M.dukkan = ['golem', null, null, null, null]; p.satinAl(0);
  let r = p.savasBitti(p.savasHazirla().sonunaKadar());
  ok(p.M.seviye === 2 && p.M.xp === 0, '1. tur sonu deneyim yok');
  await p.turBaslat(false); r = p.savasBitti(p.savasHazirla().sonunaKadar());
  ok(r.bitti || (p.M.seviye === 3 && p.M.xp === 0), '2. tur sonu +2 deneyim → Sv 3');
  // tavan: Sv 8'de deneyim alınmaz
  p.M.seviye = 8; p.M.xp = 0; p.M.altin = 20; p.xpAl(); ok(p.M.altin === 20 && p.M.seviye === 8, 'Sv 8: deneyim düğmesi kapalı');
  // takım sınırı = seviye
  p.M.seviye = 4; p.M.tahta = Array(12).fill(null); p.M.yedek = Array(7).fill(null);
  ['golem', 'kurt', 'kurbaga', 'yarasa'].forEach((h, i) => { p.M.tahta[i] = { h, s: 1 }; }); p.M.yedek[0] = { h: 'ruzgar', s: 1 };
  p.yuvaDokun('yedek', 0); p.yuvaDokun('tahta', 4);
  ok(p.M.tahta[4] === null && p.M.yedek[0].h === 'ruzgar', 'Sv 4: 5. kahraman tahtaya konmaz');
  p.secili = null; p.M.seviye = 5; p.yuvaDokun('yedek', 0); p.yuvaDokun('tahta', 11);
  ok(p.M.tahta[11] && p.M.tahta[11].h === 'ruzgar' && p.takim().find(b => b.h === 'ruzgar').x === 3 && p.takim().find(b => b.h === 'ruzgar').y === 2, 'Sv 5: 5. kahraman arka sıra, sağ sütun (x 3, y 2)');
}

// ── havuz: elde ve rakipte tutulan kopyalar dükkâna gelmez ──
{
  const p = new Oyun(); await p.yeniMac('arena');
  const K1 = window.KUT_DATA.KAHRAMANLAR.filter(h => h.kademe === 1).map(h => h.id);
  // golem dışındaki bütün K1'leri tüket: 22 kopya = 2 × ★3 (18) + 1 × ★2 (3) + 1 × ★1
  p.M.tahta = Array(12).fill(null); p.M.yedek = Array(7).fill(null); p.M.rakip = { ad: 'x', takim: [] };
  let yi = 0; const ekle = (b) => { p.M.yedek[yi++ % 7] = b; };
  const tut = []; for (const h of K1) if (h !== 'golem') tut.push({ h, s: 3 }, { h, s: 3 }, { h, s: 2 }, { h, s: 1 });
  p.M.rakip.takim = tut; // rakibin elindekiler de düşer
  let hep = true; for (let n = 0; n < 30; n++) { p._dukkanDoldur(); if (!p.M.dukkan.every(id => id === 'golem')) hep = false; }
  ok(hep, 'diğer K1\'ler tükenince Sv 2 dükkânı yalnız golem getirir');
  ok(p.havuzBilgi('golem').kalan === 22 && p.havuzBilgi('kurt').kalan === 0, 'havuz bilgisi: golem 22/22, kurt 0/22');
  p.M.rakip.takim.push({ h: 'golem', s: 3 }, { h: 'golem', s: 3 }, { h: 'golem', s: 2 }); // golem 1 kopya kaldı
  p._dukkanDoldur(); ok(p.M.dukkan.filter(Boolean).length === 1 && p.M.dukkan.filter(id => id === 'golem').length === 1, 'son kopya: dükkânda tek golem, diğer yuvalar boş');
  void ekle;
}

// ── Hızlı Maç: eski kurallar aynen (tura bağlı takım, yedek 4, seviye yok) ──
{
  const h = new Oyun(); await h.yeniMac('hizli');
  ok(h.M.mod === 'hizli' && h.M.yedek.length === K.hizli.yedek && h.yuva() === K.hizli.yuva(1) && !h.seviyeli(), 'Hızlı Maç: takım tura bağlı (3), yedek 4, seviye yok');
  const once = h.M.altin; h.xpAl(); ok(h.M.altin === once, 'Hızlı Maç: deneyim alınmaz');
  ok(h.havuzBilgi('golem') === null, 'Hızlı Maç: havuz yok');
  let oz = null, n = 0;
  while (!oz && n++ < 20) {
    for (let i = 0; i < 5; i++) if (h.M.dukkan[i] && h.M.altin >= window.KUT_DATA.kahraman(h.M.dukkan[i]).kademe) h.satinAl(i);
    for (let i = 0; i < 4; i++) { const yi = h.M.yedek.findIndex(Boolean), ti = h.M.tahta.findIndex(x => !x); if (yi < 0 || ti < 0 || h.tahtaSay() >= h.yuva()) break; h.yuvaDokun('yedek', yi); h.yuvaDokun('tahta', ti); }
    ok(h.tahtaSay() <= Math.min(6, K.hizli.yuva(h.M.tur)), `Hızlı Maç tur ${h.M.tur}: takım ≤ ${K.hizli.yuva(h.M.tur)}`);
    const r = h.savasBitti(h.savasHazirla().sonunaKadar()); if (r.bitti) oz = r; else await h.turBaslat(false);
  }
  ok(oz && oz.bitti && oz.mod === 'hizli' && (oz.kazandi ? oz.zafer === K.hizli.zaferHedef : true), `Hızlı Maç bitti (${n} tur)`);
}

// ── denetim ekleri: yer yokken 3. kopya, havuza alış/satış, dükkân tohumu, deneyim parası, eski kayıt ──
{
  // yedek dolu, takım dolu: 3. kopya birleşir, takım sınırı aşılmaz, birleşen birim eldeki kopyanın yerinde
  const p = new Oyun(); await p.yeniMac('arena');
  p.M.seviye = 3; p.M.altin = 50; p.M.tahta = Array(12).fill(null); p.M.yedek = Array(7).fill(null);
  ['kurt', 'yarasa', 'ruzgar'].forEach((h, i) => { p.M.tahta[i] = { h, s: 1 }; });
  for (let i = 0; i < 7; i++) p.M.yedek[i] = i < 2 ? { h: 'golem', s: 1 } : { h: 'kurbaga', s: 2 };
  p.M.dukkan = ['golem', null, null, null, null]; p.satinAl(0);
  ok(p.tahtaSay() === 3 && p.M.yedek[0] && p.M.yedek[0].h === 'golem' && p.M.yedek[0].s === 2 && !p.M.yedek[1], 'yer yokken 3. kopya: ★2 yedekte oluşur, takım 3/3 kalır');
  // aynı ★2 zinciri: iki ★2 tahtada + iki ★1 → ★3
  p.M.tahta = Array(12).fill(null); p.M.yedek = Array(7).fill(null);
  p.M.tahta[0] = { h: 'golem', s: 2 }; p.M.tahta[1] = { h: 'golem', s: 2 }; p.M.yedek[0] = { h: 'golem', s: 1 }; p.M.yedek[1] = { h: 'golem', s: 1 };
  p.M.dukkan = ['golem', null, null, null, null]; p.satinAl(0);
  ok(p.M.tahta[0] && p.M.tahta[0].s === 3 && [...p.M.tahta, ...p.M.yedek].filter(Boolean).length === 1, '★2 + ★2 + (★1 ×3) → ★3 ilk ★2\'nin yerinde');
}
{
  // havuz: alınan kopya düşer, satılan geri döner; ★2 satışı 3 kopya iade eder
  const q = new Oyun(); await q.yeniMac('arena'); q.M.rakip = { ad: 'x', takim: [] };
  q.M.altin = 20; q.M.tahta = Array(12).fill(null); q.M.yedek = Array(7).fill(null);
  q.M.dukkan = ['golem', 'golem', 'golem', null, null]; q.satinAl(0); q.satinAl(1);
  ok(q.havuzBilgi('golem').kalan === 20, 'havuz: 2 golem alındı → 20/22');
  q.satinAl(2); ok(q.havuzBilgi('golem').kalan === 19, '★2 golem 3 kopya tutar → 19/22');
  const yer = ['tahta', 'yedek'].map(y => ({ yer: y, i: q.M[y].findIndex(Boolean) })).find(s => s.i >= 0);
  q.secili = yer; q.sat(); ok(q.havuzBilgi('golem').kalan === 22, 'satılan ★2 havuza 3 kopya döner → 22/22');
  // kaynaşmış birim: ikinci kahraman 1 kopya
  q.M.tahta[0] = { h: 'kurt', f: 'golem', s: 1 }; ok(q.havuzBilgi('golem').kalan === 21 && q.havuzBilgi('kurt').kalan === 21, 'kaynaşmış kurt × golem: ikisi de 1 kopya');
}
{
  // dükkân: aynı maç tohumu, tur ve yenileme sayacı → aynı kartlar (belirlenimci)
  const a = new Oyun(); await a.yeniMac('arena'); const b = new Oyun(); await b.yeniMac('arena');
  b.M.tohum = a.M.tohum; b.M.rakip = a.M.rakip; b.M.tahta = a.M.tahta.slice(); b.M.yedek = a.M.yedek.slice();
  a.M.yenileN = 5; b.M.yenileN = 5; a._dukkanDoldur(); b._dukkanDoldur();
  ok(JSON.stringify(a.M.dukkan) === JSON.stringify(b.M.dukkan), 'seviyeli dükkân aynı tohumla aynı');
  // yenileme: altın düşer, kartlar yeni tohumla çekilir
  a.M.altin = 5; const n0 = a.M.yenileN; a.yenile(); ok(a.M.altin === 5 - a.kural().yenile && a.M.yenileN === n0 + 1, 'yenile: altın düştü, sayaç arttı');
  // deneyim: altın yetmezse alınmaz
  a.M.altin = K.xpBedel - 1; const sv0 = a.M.seviye, xp0 = a.M.xp; a.xpAl();
  ok(a.M.altin === K.xpBedel - 1 && a.M.seviye === sv0 && a.M.xp === xp0, 'deneyim: altın yetmezse alınmaz');
}
{
  // eski biçimde (3×2, mod yok) kaydedilmiş yarım maç açılışta kapatılır; Hızlı Maç kaydı korunur
  depo['kut.profil.v2'] = JSON.stringify({ kupa: 0, usta: {}, oyuncu: 'x', ad: 'O', sonTakim: null, istat: { mac: 0, birinci: 0 }, mac: { tur: 3, tahta: Array(6).fill(null), yedek: Array(4).fill(null) } });
  ok(new Oyun().M === null, 'eski 3×2 yarım maç kapatıldı');
  const h = new Oyun(); await h.yeniMac('hizli'); h.kaydet();
  const h2 = new Oyun(); ok(h2.M && h2.M.mod === 'hizli' && h2.M.tahta.length === 12, 'Hızlı Maç kaydı yeniden açılınca sürüyor');
}
// ── birikimli ekonomi (bölüm 3) ve kaybedince hasar (4.4) oyun.js içinde ──
{
  const L = window.KUT_LOBI;
  const e = new Oyun(); await e.yeniMac('arena');
  const bitir = (kazanan, kalanPuan = 4, kalanSayi = 2) => { e.savasHazirla(); return e.savasBitti({ kazanan, kalanPuan, kalanSayi, kalan: 0.5, sure: 10 }); };
  e.M.dukkan = ['golem', null, null, null, null]; e.satinAl(0); // 1 altın harcandı
  ok(e.M.altin === 2 && e.turAd() === '1-1' && e.M.gelir && e.M.gelir.toplam === 3, '1-1: gelir 3, golem alındı, 2 altın kaldı');
  let r = bitir(1, 6); ok(r.devam && r.hasar === 0 && e.M.can === 100, '1-1 yenilgisi: bölüm 1\'de can gitmez');
  await e.turBaslat(false);
  ok(e.turAd() === '1-2' && e.M.altin === 2 + e.M.gelir.toplam && e.M.gelir.taban === 3 && e.M.gelir.faiz === 0, '1-2: altın birikti (2 + 3), bölüm 1\'de faiz yok');
  const a12 = e.M.altin; r = bitir(0); ok(r.ganimet === 2 && e.M.altin === a12 + 2 && e.M.seviye === 3, '1-2 sonu: +2 ganimet altını, +2 deneyim (Sv 3)');
  // 2-1 PvP: galibiyet → sonraki tur +1; faiz biriken altına göre
  e.M.tur = 4; await e.turBaslat(false); e.M.altin = 27; r = bitir(0); ok(e.M.galibiyet && e.M.seri.tip === 'G' && e.M.seri.n === 1, '2-1 galibiyeti: G1');
  await e.turBaslat(false); const g = e.M.gelir;
  ok(e.turAd() === '2-2' && g.taban === 5 && g.faiz === 2 && g.galibiyet === 1 && g.seri === 0 && e.M.altin === 27 + g.toplam, `2-2 başı: 5 taban + 2 faiz + 1 galibiyet${g.alamet ? ' + 2 alamet' : ''} (27 → ${e.M.altin})`);
  ok(e.faizSonraki() === Math.min(5, Math.floor(e.M.altin / 10)), 'sonraki turun faizi gösterilir');
  r = bitir(1, 5); ok(r.hasar === 7 && e.M.can === 93 && !e.M.galibiyet && e.M.seri.tip === 'M', '2-2 yenilgisi: −7 can (taban 2 + 5 yıldız)');
  // yenileme 2 altın, kaynaştırma 2 + en yüksek kademe
  e.M.altin = 10; e.yenile(); ok(e.M.altin === 8, 'yenileme 2 altın');
  e.M.tahta = Array(12).fill(null); e.M.yedek = Array(7).fill(null); e.M.tahta[0] = { h: 'kurt', s: 1 }; e.M.tahta[1] = { h: 'anka', s: 1 };
  ok(e.kaynastirBedel('kurt', 'anka') === 5 && e.kaynastirBedel('kurt') === 3, 'kaynaştırma bedeli: K1 × K3 = 5');
  e.M.altin = 4; e.secili = null; e.yuvaDokun('tahta', 0); e.kaynasModDegistir(); e.yuvaDokun('tahta', 1);
  ok(!e.M.tahta[0].f && e.M.altin === 4, 'altın 4 iken K1 × K3 kaynaşmaz');
  e.M.altin = 6; e.yuvaDokun('tahta', 1); ok(e.M.tahta[0].f === 'anka' && e.M.altin === 1, 'K1 × K3 kaynaştı, 5 altın düştü');
  // 2-3'ten sonra 2-4 Kervan atlanır: gelir yok, sonraki tur 2-5
  e.M.tur = 6; e.secili = null; e.kaynasMod = false; bitir(0); const once = e.M.altin; await e.turBaslat(false);
  ok(e.turAd() === '2-5' && e.M.altin === once + e.M.gelir.toplam, 'Kervan turu (2-4) şimdilik atlanır, gelir bir kez eklenir');
  // 2-7 canavar turu (şimdilik bota karşı): seri bozulmaz; yenilgide taban + kalan sayısı
  e.M.tur = 10; e.M.seri = { tip: 'G', n: 3 }; r = bitir(1, 9, 3); ok(r.hasar === 5 && e.M.seri.n === 3, '2-7 canavar yenilgisi: −5 (2 + 3 kalan), seri bozulmadı');
  // ölüm: can 0 → maç biter
  e.M.can = 6; e.M.tur = 18; await e.turBaslat(true); r = bitir(1, 4); ok(r.bitti && !r.kazandi && r.can === 0 && r.turAd === '4-1', `can bitti: ${r.turAd} turunda elendi (kupa ${r.fark})`);
  // son tura (5-3) canlı ulaşan kazanır
  const w = new Oyun(); await w.yeniMac('arena'); w.M.dukkan = ['golem', null, null, null, null]; w.satinAl(0);
  w.M.tur = 27; w.M.can = 12; w.savasHazirla(); const z = w.savasBitti({ kazanan: 0, kalanPuan: 2, kalanSayi: 2, kalan: 0.4, sure: 9 });
  ok(z.bitti && z.kazandi && z.fark === 40 && z.turAd === '5-3' && z.can === 12, '5-3 sonu canlı: maç kazanıldı, +40 kupa');
  const w2 = new Oyun(); await w2.yeniMac('arena'); w2.M.dukkan = ['golem', null, null, null, null]; w2.satinAl(0);
  w2.M.tur = 27; w2.M.can = 12; w2.savasHazirla(); const z2 = w2.savasBitti({ kazanan: 1, kalanPuan: 0, kalanSayi: 0, kalan: 0.4, sure: 9 });
  ok(z2.bitti && !z2.kazandi && z2.can === 0, '5-3 yenilgisi 12 can götürür (taban 12): son turda elendi');
}
{
  // Hızlı Maç ekonomisi aynen: her tur 10 altın (birikmez), yenileme 1, yenilgide 1 can
  const h = new Oyun(); await h.yeniMac('hizli');
  ok(h.M.altin === 10 || h.M.altin === 12, 'Hızlı Maç: tur başında 10 altın');
  h.yenile(); ok(h.M.altin === 9 || h.M.altin === 11, 'Hızlı Maç: yenileme 1');
  h.M.dukkan = ['golem', null, null, null, null]; h.satinAl(0); h.M.altin = 40; h.savasHazirla(); h.savasBitti({ kazanan: 1, kalanPuan: 6, kalanSayi: 3, kalan: 0.5, sure: 9 });
  ok(h.M.can === K.hizli.can - 1, 'Hızlı Maç: yenilgide 1 can');
  await h.turBaslat(false); ok(h.M.altin === 10 + (h.M.alamet === 'pazar' ? 2 : 0) && !h.M.gelir, 'Hızlı Maç: biriken altın sıfırlanır, faiz yok');
  ok(h.kaynastirBedel('kurt', 'anka') === 3 && h.kural().yenile === 1, 'Hızlı Maç: kaynaştırma 3, yenileme 1');
}
{
  // birikimli ekonomiden önce kaydedilmiş seviyeli yarım maç (seri yok, 5 can) kapatılır
  depo['kut.profil.v2'] = JSON.stringify({ kupa: 0, usta: {}, oyuncu: 'x', ad: 'O', sonTakim: null, istat: { mac: 0, birinci: 0 }, mac: { mod: 'arena', tur: 3, can: 5, tahta: Array(12).fill(null), yedek: Array(7).fill(null) } });
  ok(new Oyun().M === null, 'adım 1 biçimindeki seviyeli yarım maç kapatıldı');
}
process.exit(hata ? 1 : 0);
