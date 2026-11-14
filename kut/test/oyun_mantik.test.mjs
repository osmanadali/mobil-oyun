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
let kervanSay = 0, canavarSay = 0;
while (!ozet && tur++ < 40) {
  if (o.M.kervan) { kervanSay++; await o.kervanSec(0); }
  if (!o.M.rakip) await o.turBaslat(false);
  if (o.M.rakip.pve) canavarSay++;
  // parası yettikçe al, tahtayı doldur
  for (let i = 0; i < 5; i++) if (o.M.dukkan[i] && o.M.altin >= window.KUT_DATA.kahraman(o.M.dukkan[i]).kademe) o.satinAl(i);
  for (let i = 0; i < 4; i++) { const yi = o.M.yedek.findIndex(Boolean), ti = o.M.tahta.findIndex(x => !x); if (yi < 0 || ti < 0 || o.tahtaSay() >= o.yuva()) break; o.yuvaDokun('yedek', yi); o.yuvaDokun('tahta', ti); }
  const sim = o.savasHazirla(); const s = sim.sonunaKadar(); const r = o.savasBitti(s);
  if (r.bitti) ozet = r; else await o.turBaslat(false);
}
ok(ozet && ozet.bitti && ozet.kod.startsWith('KUT2-') && (ozet.kazandi ? ozet.can > 0 && ozet.turAd === '5-3' : ozet.can === 0), `maç bitti (${tur} tur, ${ozet && ozet.turAd}, ${ozet && ozet.kazandi ? 'kazandı' : 'elendi'}, ${ozet && ozet.can} can, kupa ${ozet && ozet.fark})`);
ok(o.P.mac === null && JSON.parse(depo['kut.profil.v2']).istat.mac === 1, 'profil kaydedildi, maç kapandı');
ok(canavarSay >= 3 && (ozet.turAd < '2-4' || kervanSay >= 1), `maçta canavar turları (${canavarSay}) ve Kervan (${kervanSay}) oynandı`);
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
  // 2-1 armağanı bu sınamada alınmaz (altını değiştirmesin)
  e.M.tur = 4; await e.turBaslat(false); e.M.armaganSecim = null; e.M.altin = 27; r = bitir(0); ok(e.M.galibiyet && e.M.seri.tip === 'G' && e.M.seri.n === 1, '2-1 galibiyeti: G1');
  await e.turBaslat(false); const g = e.M.gelir;
  ok(e.turAd() === '2-2' && g.taban === 5 && g.faiz === 2 && g.galibiyet === 1 && g.seri === 0 && e.M.altin === 27 + g.toplam, `2-2 başı: 5 taban + 2 faiz + 1 galibiyet${g.alamet ? ' + 2 alamet' : ''} (27 → ${e.M.altin})`);
  ok(e.faizSonraki() === Math.min(5, Math.floor(e.M.altin / 10)), 'sonraki turun faizi gösterilir');
  r = bitir(1, 5); ok(r.hasar === 9 && e.M.can === 91 && !e.M.galibiyet && e.M.seri.tip === 'M', '2-2 yenilgisi: −9 can (taban 4 + 5 yıldız)');
  // yenileme 2 altın, kaynaştırma 2 + en yüksek kademe
  e.M.altin = 10; e.M.bedavaYenile = 0; e.yenile(); ok(e.M.altin === 8, 'yenileme 2 altın'); // (Göç Mevsimi alametinde ilk 2 yenileme bedava olurdu)
  e.M.tahta = Array(12).fill(null); e.M.yedek = Array(7).fill(null); e.M.tahta[0] = { h: 'kurt', s: 1 }; e.M.tahta[1] = { h: 'anka', s: 1 };
  ok(e.kaynastirBedel('kurt', 'anka') === 5 && e.kaynastirBedel('kurt') === 3, 'kaynaştırma bedeli: K1 × K3 = 5');
  e.M.altin = 4; e.secili = null; e.yuvaDokun('tahta', 0); e.kaynasModDegistir(); e.yuvaDokun('tahta', 1);
  ok(!e.M.tahta[0].f && e.M.altin === 4, 'altın 4 iken K1 × K3 kaynaşmaz');
  e.M.altin = 6; e.yuvaDokun('tahta', 1); ok(e.M.tahta[0].f === 'anka' && e.M.altin === 1, 'K1 × K3 kaynaştı, 5 altın düştü');
  // 2-3'ten sonra 2-4 Kervan: savaş ve gelir yok; seçim yapılınca 2-5 başlar (gelir bir kez)
  e.M.tur = 6; e.secili = null; e.kaynasMod = false; bitir(0); const once = e.M.altin; await e.turBaslat(false);
  ok(e.turAd() === '2-4' && e.M.kervan && e.M.kervan.secenek.length >= 3 && e.M.altin === once && e.M.gelir.toplam === 0 && !e.M.rakip && e.savasHazirla() === null, 'Kervan turu (2-4): gelir yok, rakip yok, savaş başlamaz, seçenekler hazır');
  const kv = e.M.kervan.secenek[1], raf0 = e.M.esyaRaf.length; await e.kervanSec(1);
  ok(e.turAd() === '2-5' && !e.M.kervan && e.M.esyaRaf.length === raf0 + 1 && e.M.esyaRaf[e.M.esyaRaf.length - 1] === kv.esya && [...e.M.tahta, ...e.M.yedek].some(b => b && b.h === kv.birim.h)
    && e.M.altin === once + e.M.gelir.toplam, 'Kervan seçimi: kahraman yedeğe, eşya rafa; 2-5 başladı, gelir bir kez eklendi');
  // 2-7 canavar turu: seri bozulmaz; yenilgide taban + kalan sayısı
  e.M.tur = 10; e.M.seri = { tip: 'G', n: 3 }; r = bitir(1, 9, 3); ok(r.hasar === 7 && e.M.seri.n === 3, '2-7 canavar yenilgisi: −7 (4 + 3 kalan), seri bozulmadı');
  // ölüm: can 0 → maç biter
  e.M.can = 6; e.M.tur = 18; await e.turBaslat(true); r = bitir(1, 4); ok(r.bitti && !r.kazandi && r.can === 0 && r.turAd === '4-1', `can bitti: ${r.turAd} turunda elendi (kupa ${r.fark})`);
  // son tura (5-3) canlı ulaşan kazanır
  const w = new Oyun(); await w.yeniMac('arena'); w.M.dukkan = ['golem', null, null, null, null]; w.satinAl(0);
  w.M.tur = 27; w.M.can = 12; w.savasHazirla(); const z = w.savasBitti({ kazanan: 0, kalanPuan: 2, kalanSayi: 2, kalan: 0.4, sure: 9 });
  ok(z.bitti && z.kazandi && z.fark === 40 && z.turAd === '5-3' && z.can === 12, '5-3 sonu canlı: maç kazanıldı, +40 kupa');
  const w2 = new Oyun(); await w2.yeniMac('arena'); w2.M.dukkan = ['golem', null, null, null, null]; w2.satinAl(0);
  w2.M.tur = 27; w2.M.can = 12; w2.savasHazirla(); const z2 = w2.savasBitti({ kazanan: 1, kalanPuan: 0, kalanSayi: 0, kalan: 0.4, sure: 9 });
  ok(z2.bitti && !z2.kazandi && z2.can === 0, '5-3 yenilgisi 16 can götürür (taban 16): son turda elendi');
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
  // kaynaşmış birimin satış değeri iki parçanın satış değerinin toplamı (bölüm 3.3)
  const e = new Oyun(); await e.yeniMac('arena');
  e.M.tahta = Array(12).fill(null); e.M.yedek = Array(7).fill(null);
  e.M.tahta[0] = { h: 'koc', s: 2 }; e.M.tahta[1] = { h: 'anka', s: 1 }; e.M.altin = 20;
  e.secili = null; e.yuvaDokun('tahta', 0); e.kaynasModDegistir(); e.yuvaDokun('tahta', 1);
  const f = e.M.tahta[0];
  ok(f.f === 'anka' && f.s === 1 && e.satisDegeri(f) === (2 * 3 - 1) + 3, `kaynaşmış ★2 K2 × ★1 K3 satışı 5 + 3 = ${e.satisDegeri(f)}`);
  ok(e.satisDegeri({ h: 'kurt', s: 1, f: 'koc' }) === 3 && e.satisDegeri({ h: 'koc', s: 2 }) === 5 && e.satisDegeri({ h: 'anka', s: 3 }) === 26, 'satış: ★1 tam, ★2 3k−1, ★3 9k−1');
}
{
  // birikimli ekonomiden önce kaydedilmiş seviyeli yarım maç (seri yok, 5 can) kapatılır
  depo['kut.profil.v2'] = JSON.stringify({ kupa: 0, usta: {}, oyuncu: 'x', ad: 'O', sonTakim: null, istat: { mac: 0, birinci: 0 }, mac: { mod: 'arena', tur: 3, can: 5, tahta: Array(12).fill(null), yedek: Array(7).fill(null) } });
  ok(new Oyun().M === null, 'adım 1 biçimindeki seviyeli yarım maç kapatıldı');
}
// ── eşyalar (bölüm 5.1): raf, takma, rafta birleştirme, satış, ★ birleşme ve kaynaştırmada toplama, Söküm Taşı, taşan ganimet ──
{
  const DD = window.KUT_DATA;
  const e = new Oyun(); await e.yeniMac('arena');
  ok(Array.isArray(e.M.esyaRaf) && e.M.esyaRaf.length === 0, 'yeni maç: boş eşya rafı');
  // 1-1 savaşından sonra ganimet: 1 bileşen
  e.M.dukkan = ['golem', null, null, null, null]; e.satinAl(0);
  const r1 = e.savasBitti(e.savasHazirla().sonunaKadar());
  ok(e.M.esyaRaf.length === 1 && DD.esya(e.M.esyaRaf[0]).tip === 'bilesen' && r1.esya.length === 1, '1-1 ganimeti: rafa 1 bileşen (' + e.M.esyaRaf[0] + ')');
  await e.turBaslat(false);
  ok(e.M.rakip.pve && e.M.rakip.takim.length === 3 && e.M.rakip.takim.every(b => b.h === 'cakil'), '1-2 rakibi canavar dalgası: 3 Çakıl Kıpırı');
  { const t = new Oyun(); await t.yeniMac('arena'); t.M.tur = 4; await t.turBaslat(false);
    const deger = t.M.rakip.takim.reduce((n, b) => n + (b.e || []).reduce((q, id) => q + (DD.esya(id).tip === 'tam' ? 2 : 1), 0), 0);
    ok(!t.M.rakip.pve && deger === 2, '2-1 bot rakibi bölüm 1 ganimetini (1-1 bileşen + 1-3 seçimi) taşıyor'); }
  // takma: raftaki eşyaya dokun, sonra kahramana
  const gi = e.M.tahta.findIndex(b => b && b.h === 'golem');
  e.M.esyaRaf = ['dis', 'tuy', 'kor', 'isikKalkani'];
  e.esyaSec(0); ok(e.seciliEsya === 0, 'raftaki eşya seçildi');
  e.yuvaDokun('tahta', gi); ok(e.M.tahta[gi].e.join() === 'dis' && e.M.esyaRaf.join() === 'tuy,kor,isikKalkani' && e.seciliEsya === null, 'Diş golem\'e takıldı');
  e.esyaSec(1); e.yuvaDokun('tahta', gi); ok(e.M.tahta[gi].e.join() === 'kizginDis', 'Kor + yarım Diş → Kızgın Diş');
  ok(e.takim()[0].e.join() === 'kizginDis', 'takım (motor) eşyaları taşır');
  // rafta birleştirme
  e.M.esyaRaf = ['tuy', 'isikKalkani', 'buz']; e.esyaSec(0); e.esyaSec(2);
  ok(e.M.esyaRaf.join() === 'karTanesi,isikKalkani', 'rafta Tüy + Buz → Kar Tanesi');
  e.esyaSec(1); e.esyaSec(0); ok(e.seciliEsya === 0 && e.M.esyaRaf.length === 2, 'tam eşyalar rafta birleşmez (seçim değişir)'); e.esyaSec(0);
  // dolu kahraman
  e.M.tahta[gi].e = ['kizginDis', 'isikKalkani', 'anaKaya']; e.M.esyaRaf = ['dis'];
  e.esyaSec(0); e.yuvaDokun('tahta', gi); ok(e.M.esyaRaf.join() === 'dis' && e.M.tahta[gi].e.length === 3, 'dolu kahramana takılmaz, eşya rafta kalır');
  // Söküm Taşı: bütün eşyalar rafa iner, taş harcanır
  e.M.esyaRaf = ['sokumTasi']; e.esyaSec(0); e.yuvaDokun('tahta', gi);
  ok(!e.M.tahta[gi].e && e.M.esyaRaf.join() === 'kizginDis,isikKalkani,anaKaya', 'Söküm Taşı: 3 eşya rafa döndü, taş harcandı');
  // satış: eşyalar rafa döner
  e.M.esyaRaf = []; e.M.tahta[gi].e = ['yelKanadi', 'pul']; e.yuvaDokun('tahta', gi); e.sat();
  ok(!e.M.tahta[gi] && e.M.esyaRaf.join() === 'yelKanadi,pul', 'satılan kahramanın eşyaları rafa döner');
  // raf dolu: taşan bekler, raf boşalınca iner
  e.M.esyaRaf = Array(10).fill('dis'); e._rafEkle(['buz', 'kor']);
  ok(e.M.esyaRaf.length === 10 && e.M.esyaTasan.join() === 'buz,kor', 'raf 10 eşyada doluyor, fazlası taşan olarak bekliyor');
  e.esyaSec(0); e.esyaSec(1); ok(e.M.esyaRaf.length === 10 && e.M.esyaRaf[0] === 'yirticiPence' && e.M.esyaRaf[9] === 'buz' && e.M.esyaTasan.join() === 'kor', 'raf boşalınca taşan iner');
  // ★ birleşme: üç kopyanın eşyaları toplanır, aşan rafa
  e.M.tahta = Array(12).fill(null); e.M.yedek = Array(7).fill(null); e.M.esyaRaf = []; e.M.esyaTasan = []; e.M.altin = 50;
  e.M.tahta[0] = { h: 'kurt', s: 1, e: ['dis', 'isikKalkani'] }; e.M.yedek[0] = { h: 'kurt', s: 1, e: ['tuy', 'anaKaya'] };
  e.M.dukkan = ['kurt', null, null, null, null]; e.satinAl(0);
  const yk = [...e.M.tahta, ...e.M.yedek].find(b => b && b.h === 'kurt' && b.s === 2);
  ok(yk && yk.e.join() === 'avCoskusu,isikKalkani,anaKaya' && e.M.esyaRaf.length === 0, '★2 birleşme: eşyalar toplandı, Diş + Tüy birleşti (' + (yk && yk.e) + ')');
  e.M.tahta[1] = { h: 'golem', s: 1, e: ['yirticiPence', 'kor'] }; e.M.tahta[2] = { h: 'semender', s: 1, e: ['buz', 'muhur-ates'] };
  e.yuvaDokun('tahta', 1); e.kaynasModDegistir(); e.yuvaDokun('tahta', 2);
  ok(e.M.tahta[1].f === 'semender' && e.M.tahta[1].e.join() === 'yirticiPence,ayazAsasi' && e.M.esyaRaf.join() === 'muhur-ates', 'kaynaştırma: önce birinci kahramanın eşyaları; Kor + Buz birleşti, Od zaten taşındığı için mühür rafa döndü');
  // Hızlı Maç'ta eşya yok
  const h = new Oyun(); await h.yeniMac('hizli'); h.M.dukkan = ['golem', null, null, null, null]; h.satinAl(0);
  h.savasBitti(h.savasHazirla().sonunaKadar()); ok(h.M.esyaRaf.length === 0, 'Hızlı Maç: eşya ganimeti yok');
  // eşyalardan önce kaydedilmiş Arena yarım maçı açılır, boş raf eklenir
  const k = JSON.parse(depo['kut.profil.v2']); k.mac = { ...e.M }; delete k.mac.esyaRaf; delete k.mac.esyaTasan; depo['kut.profil.v2'] = JSON.stringify(k);
  const y = new Oyun(); ok(y.M && Array.isArray(y.M.esyaRaf) && y.M.esyaRaf.length === 0, 'eşyasız kayıttaki yarım maç boş rafla sürüyor');
  // seviyeli maçta bot rakipler eşya taşır (geç turlarda)
  const b = new Oyun(); await b.yeniMac('arena'); b.M.tur = 20; await b.turBaslat(false);
  ok(b.M.rakip.takim.some(x => x.e && x.e.length), '4-x turunda bot rakip eşya taşır');
}
// ── canavar turları, ganimet, Kervan, bedava kahraman, Gün Batımı (bölüm 1.1, 1.4, 5.4, 5.5) ──
{
  const DD = window.KUT_DATA, LL = window.KUT_LOBI;
  const e = new Oyun(); await e.yeniMac('arena');
  ok(e.bekleyenSecim() === 'ilk' && e.M.ilkSecim.length === 3 && e.M.ilkSecim.every(id => DD.kahraman(id).kademe === 1), 'yeni Arena maçı: 3 kademe-1 kahramandan biri bedava');
  const sec = e.M.ilkSecim[1], a0 = e.M.altin; e.ilkSec(1);
  ok(!e.M.ilkSecim && e.M.tahta.some(b => b && b.h === sec) && e.M.altin === a0 && e.bekleyenSecim() === null, 'bedava seçim tahtaya kondu, altın düşmedi');
  ok(e.M.rakip.pve && e.M.rakip.kaynak === 'canavar' && e.M.rakip.takim.map(b => b.h).join() === 'cakil,cakil' && e.turTip() === 'pve' && e.turUzun() === 'Bölüm 1 · Tur 1', '1-1 rakibi canavar dalgası (2 Çakıl Kıpırı), "Bölüm 1 · Tur 1"');
  const sim = e.savasHazirla();
  ok(sim.birimler.filter(u => u.taraf === 1).every(u => u.b.canavar === 'cakil' && u.b.h === 'golem' && u.mx === 280), 'savaşta canavar: motor canavar istatistiğiyle, sahneye görünüm kahramanı (u.b.h) ve gerçek kimlik (u.b.canavar)');
  ok(e.birimAd(sim.birimler.find(u => u.taraf === 1).b) === 'Çakıl Kıpırı', 'hasar özetinde canavarın adı');
  let r = e.savasBitti(sim.sonunaKadar());
  ok(r.pve && r.esya.length === 1 && e.M.esyaRaf.length === 1 && r.hasar === 0, '1-1 ganimeti: 1 bileşen, bölüm 1\'de can gitmez');
  // 1-2: kahraman + 2 altın (kaybedilse de)
  await e.turBaslat(false); e.M.yedek = Array(7).fill(null);
  const a12 = e.M.altin; e.savasHazirla(); r = e.savasBitti({ kazanan: 1, kalanPuan: 3, kalanSayi: 3, kalan: 0, sure: 9 });
  ok(r.kahraman.length === 1 && DD.kahraman(r.kahraman[0].h).kademe === 1 && e.M.yedek.some(b => b && b.h === r.kahraman[0].h) && e.M.altin === a12 + 2 && r.ganimet === 2, '1-2 yenilgisinde de ganimet: K1 kahraman yedeğe, +2 altın');
  // 1-3: iki bileşenden biri seçilir
  await e.turBaslat(false); e.savasHazirla(); r = e.savasBitti({ kazanan: 0, kalanPuan: 3, kalanSayi: 3, kalan: 0, sure: 9 });
  ok(r.secim && r.secim.length === 2 && e.bekleyenSecim() === 'ganimet', '1-3: 2 bileşen gösterildi, seçim bekliyor');
  const s2 = e.M.ganimetSecim[1], n0 = e.M.esyaRaf.length; e.ganimetSec(1);
  ok(e.M.esyaRaf.length === n0 + 1 && e.M.esyaRaf[n0] === s2 && !e.M.ganimetSecim, 'seçilen bileşen rafa indi');
  // seçilmeyen ganimet savaştan önce ilk seçenek olur
  e.M.ganimetSecim = ['dis', 'tuy']; await e.turBaslat(false); e.savasHazirla(); ok(!e.M.ganimetSecim && e.M.esyaRaf.includes('dis'), 'seçilmeyen ganimet savaşta ilk seçenek olur');
  e.savasBitti({ kazanan: 0, kalanPuan: 3, kalanSayi: 3, kalan: 0, sure: 9 });
  ok(e.turTip() === 'pvp' && e.turAd() === '2-2', 'bölüm 1 bitti: 2-1 PvP oynandı, sıra 2-2');
  // PvP savaşında Gün Batımı var, canavar ganimeti yok
  await e.turBaslat(false); const ps = e.savasHazirla(); let t25 = 0; while (!ps.bitti && ps.t < 25.2) { ps.adim(); if (Math.abs(ps.t - 25.5) < 0.03) t25 = ps.gunBatimiCarpan(); }
  ok(!e.M.rakip.pve && (ps.bitti || ps.gunBatimiCarpan() === 1.5), 'Arena PvP savaşında Gün Batımı (25. sn ×1,5)');
  // 2-7 zarfı
  e.M.tur = 10; await e.turBaslat(false); ok(e.M.rakip.pve && e.M.rakip.takim.length === 4, '2-7 rakibi: 3 Kum Akrebi + Ana Akrep');
  const a27 = e.M.altin; e.savasHazirla(); r = e.savasBitti({ kazanan: 1, kalanPuan: 4, kalanSayi: 2, kalan: 0, sure: 9 });
  ok(r.hasar === 4 + 2 && r.zarf && (r.zarf === 'altin' ? e.M.altin === a27 + 3 && r.ganimet === 3 : r.zarf === 'bilesen' ? r.esya.length === 2 : r.kahraman.length === 1 && DD.kahraman(r.kahraman[0].h).kademe === 2), `2-7 yenilgisi: −6 can (4 + 2 canavar), bileşen + zarf (${r.zarf})`);
  // Kervan: yedek doluyken kahraman satış değerine çevrilir; 3-4'te ilk seçenek kaynaşmış
  e.M.tur = 14; await e.turBaslat(false);
  ok(e.turAd() === '3-4' && e.M.kervan && e.M.kervan.secenek[0].birim.f && e.M.kervan.secenek.length === LL.kervanAdet(e.siraTahmin()), '3-4 Kervan: ilk seçenek hazır kaynaşmış birim');
  e.M.yedek = Array(7).fill(null).map((_, i) => ({ h: ['golem', 'kurt', 'kurbaga', 'yarasa', 'ruzgar', 'koc', 'yilan'][i], s: 1 }));
  const ak = e.M.altin, ilk = e.M.kervan.secenek[0], dg = e.satisDegeri(ilk.birim); await e.kervanSec(0);
  ok(e.M.altin === ak + dg + e.M.gelir.toplam && e.M.esyaRaf.includes(ilk.esya) && e.turAd() === '3-5', `yedek doluyken Kervan kahramanı ${dg} altına çevrildi, eşya rafa indi, 3-5 başladı`);
  e.M.can = 40; ok(LL.kervanAdet(e.siraTahmin()) === 5, 'canı az olan Kervan\'da daha çok seçenek görür (geçici sıra tahmini)');
  // Hızlı Maç: canavar, Kervan, ganimet, Gün Batımı yok
  const h = new Oyun(); await h.yeniMac('hizli');
  ok(!h.M.ilkSecim && !h.M.rakip.pve && h.turTip() === 'pvp', 'Hızlı Maç: bedava seçim ve canavar turu yok');
  h.M.dukkan = ['golem', null, null, null, null]; h.satinAl(0); const hs = h.savasHazirla(); while (!hs.bitti && hs.t < 26) hs.adim();
  ok(hs.gunBatimiCarpan() === 1, 'Hızlı Maç: Gün Batımı yok');
  const hr = h.savasBitti(hs.sonunaKadar());
  ok(hr && (hr.bitti || (!hr.pve && !hr.esya.length && !hr.kahraman.length && !hr.secim && !h.M.esyaRaf.length && !h.M.ganimetSecim)), 'Hızlı Maç: savaş sonunda ganimet yok');
  // kayıtlı yarım maç: Kervan ve canavar turunda sayfa yenilenince seçim / dalga korunur
  const y = new Oyun(); await y.yeniMac('arena'); y.ilkSec(0);
  y.M.tur = 7; await y.turBaslat(false); const kvS = JSON.stringify(y.M.kervan.secenek);
  const y2 = new Oyun(); ok(y2.M.kervan && JSON.stringify(y2.M.kervan.secenek) === kvS && y2.bekleyenSecim() === 'kervan' && y2.savasHazirla() === null, 'yenilemede Kervan seçenekleri aynı kalır, savaş açılmaz');
  await y2.kervanSec(2); ok(y2.turAd() === '2-5' && !y2.M.kervan && !y2.M.rakip.pve, 'yenilemeden sonra Kervan seçimi 2-5\'i başlatır');
  y2.M.tur = 10; await y2.turBaslat(false); const y3 = new Oyun();
  ok(y3.M.rakip.pve && y3.M.rakip.takim.map(b => b.h).join() === 'kumAkrebi,kumAkrebi,kumAkrebi,anaAkrep', 'yenilemede canavar dalgası korunur');
}
// ── Lobi Maçı: 8 kişilik hayalet lobi (bölüm 4) ──
{
  const LL = window.KUT_LOBI, DD = window.KUT_DATA;
  const o = new Oyun(); o.P.kupa = 300; await o.yeniMac('lobi');
  ok(o.M.mod === 'lobi' && o.lobiMi() && o.seviyeli() && o.M.lobi.oyuncular.length === 8 && o.M.lobi.oyuncular[0].canli && o.M.can === 100, 'Lobi Maçı: 8 oyuncu (sen + 7 hayalet), 100 can, seviyeli kurallar');
  ok(o.M.ilkSecim && o.M.rakip && o.M.rakip.pve && o.lobiDurum().length === 8 && o.lobiDurum()[0].sen, '1-1: bedava kahraman seçimi ve canavar dalgası; lobi durumu okunur');
  o.ilkSec(0);
  const iz0 = JSON.parse(depo['kut.iz.v2'] || '[]').length;
  let oz = null, n = 0, pvpGordu = false, rakipDogru = true, canAyni = true, havuzOk = true, alametOk = true;
  while (!oz && n++ < 70) {
    if (o.M.kervan) { await o.kervanSec(0); continue; }
    const r = o.M.tur - 1;
    if (o.turTip() === 'pvp') {
      pvpGordu = true; const rk = LL.lobiRakip(o.M.lobiEs, 0);
      if (!rk || o.M.rakip.lobiI !== rk.j || JSON.stringify(o.M.rakip.takim) !== JSON.stringify(LL.lobiKadro(o.M.lobi, rk.j, r).takim)) rakipDogru = false;
      if (o.M.alamet !== LL.lobiAlamet(o.M.lobi.tohum, r)) alametOk = false;
      const h = o.havuz(), gh = LL.havuzLobi(o.M.lobi, r, [...o.M.tahta, ...o.M.yedek]);
      if (DD.KAHRAMANLAR.some(x => h[x.id] !== gh[x.id])) havuzOk = false;
    }
    for (let i = 0; i < 5; i++) if (o.M.dukkan[i] && o.M.altin >= 5) o.satinAl(i);
    while (o.M.altin >= 10 && o.M.seviye < 8) o.xpAl();
    for (let i = 0; i < o.M.yedek.length; i++) { const b = o.M.yedek[i], ti = o.M.tahta.findIndex(x => !x); if (b && ti >= 0 && o.tahtaSay() < o.yuva()) { o.M.tahta[ti] = b; o.M.yedek[i] = null; } }
    for (let q = 0; q < 3 && o.M.esyaRaf.length; q++) o.esyaTak(0, 'tahta', o.M.tahta.findIndex(Boolean));
    const sim = o.savasHazirla(); if (!sim) break;
    const res = o.savasBitti(sim.sonunaKadar());
    if (res.bitti) oz = res;
    else { if (o.M.can !== o.M.lobi.oyuncular[0].can || !res.lobi) canAyni = false; await o.turBaslat(false); }
  }
  ok(pvpGordu && rakipDogru, 'PvP turunda rakip, lobi eşleşmesindeki hayaletin bu turki kadrosu (ya da Yansıma)');
  ok(alametOk, 'lobide alamet lobinin tamamına aynı (lobi tohumundan)');
  ok(havuzOk, 'lobide havuz 7 hayaletin kadrolarını da düşer');
  ok(canAyni, 'oyuncunun canı lobideki canıyla aynı; savaş sonucu lobi raporunu taşır');
  ok(oz && oz.bitti && oz.sira >= 1 && oz.sira <= 8 && oz.siralama.length === 8 && oz.siralama.map(x => x.sira).sort().join() === '1,2,3,4,5,6,7,8' && oz.siralama.filter(x => x.sen).length === 1,
    `maç sonu: ${oz ? oz.sira : '?'}. sıra, 8 kişilik sıralama (her sıra bir kez)`);
  ok(oz && oz.fark === LL.kupaDegisim(oz.sira, 300) && o.P.kupa === 300 + oz.fark, `kupa sıralama tablosundan (${oz ? oz.fark : '?'})`);
  const izler = JSON.parse(depo['kut.iz.v2'] || '[]');
  ok(izler.length === iz0 + 1 && izler[izler.length - 1].sira === oz.sira && izler[izler.length - 1].turlar.length >= 5 && izler[izler.length - 1].turlar.every(t => t.takim && t.r >= 0), 'maç izi havuza yazıldı (tur tur kadro, sıra)');
  ok(!o.P.mac, 'maç kapandı');
  // kendi izi kendi lobisine girmez; başka oyuncunun izi girer
  const b2 = new Oyun(); b2.P.kupa = 300; b2.P.oyuncu = 'baska'; await b2.yeniMac('lobi');
  ok(b2.M.lobi.oyuncular.some(x => x.iz && x.iz.turlar), 'başka oyuncunun lobisinde bu maçın izi hayalet olarak yer alır');
  const b3 = new Oyun(); b3.P.kupa = 300; b3.P.oyuncu = o.P.oyuncu; await b3.yeniMac('lobi');
  ok(b3.M.lobi.oyuncular.every(x => x.canli || x.iz.bot), 'oyuncunun kendi izi kendi lobisine girmez');
  // 14 günden eski ya da başka sürümün izi lobiye girmez (bölüm 4.7)
  { const sakla = depo['kut.iz.v2'], l = JSON.parse(sakla);
    depo['kut.iz.v2'] = JSON.stringify(l.map(z => ({ ...z, zaman: Date.now() - 15 * 86400000 })));
    const e1 = new Oyun(); e1.P.kupa = 300; e1.P.oyuncu = 'baska2'; await e1.yeniMac('lobi');
    depo['kut.iz.v2'] = JSON.stringify(l.map(z => ({ ...z, surum: 99 })));
    const e2 = new Oyun(); e2.P.kupa = 300; e2.P.oyuncu = 'baska3'; await e2.yeniMac('lobi');
    depo['kut.iz.v2'] = sakla;
    ok(e1.M.lobi.oyuncular.every(x => x.canli || x.iz.bot) && e2.M.lobi.oyuncular.every(x => x.canli || x.iz.bot), '14 günden eski ve başka sürümün izleri lobiye girmez'); }
  // yarım lobi maçı sayfa yenilenince sürer
  b3.ilkSec(0); const b4 = new Oyun(); ok(b4.M && b4.M.mod === 'lobi' && b4.lobiMi() && b4.M.lobi.oyuncular.length === 8, 'yarım lobi maçı kayıttan açılır');
}
// ── Kut Armağanı (bölüm 6), Kut hakkı ve lobi alametleri (7, 8) ──
{
  const LL = window.KUT_LOBI, DD = window.KUT_DATA, AS = K.armaganSayi;
  const a = new Oyun(); await a.yeniMac('arena'); a.ilkSec(0);
  ok(a.M.alamet === 'yok' && a.sonrakiAlametler().length === 1 && a.sonrakiAlamet() === LL.lobiAlamet(a.M.tohum, a.M.tur), 'Arena: sıradaki turun alameti önceden görünür (maç tohumundan)');
  a.M.tur = 4; await a.turBaslat(false);
  ok(a.turAd() === '2-1' && a.bekleyenSecim() === 'armagan' && a.M.armaganSecim.secenek.length === 3 && a.M.alamet === LL.lobiAlamet(a.M.tohum, 3), '2-1: Kut Armağanı seçimi bekliyor (3 kart), alamet sıradaki tahminle aynı');
  const ilk = a.M.armaganSecim.secenek.slice(); a.armaganYenile();
  ok(a.M.armaganSecim.yenile === 0 && a.M.armaganSecim.secenek.every(id => !ilk.includes(id) || DD.ARMAGANLAR.filter(x => x.kademe === a.M.armaganSecim.kademe).length < 6), 'yenileme: kartlar değişir, hak biter');
  a.armaganYenile(); ok(a.M.armaganSecim.yenile === 0, 'ikinci yenileme yapılamaz');
  const secilen = a.M.armaganSecim.secenek[1]; a.armaganSec(1);
  ok(a.M.armagan.length === 1 && a.M.armagan[0] === secilen && !a.M.armaganSecim, `armağan seçildi: ${DD.armagan(secilen).ad}`);
  // aynı tur yeniden başlarsa (sayfa yenileme) armağan bir daha sorulmaz
  const a2 = new Oyun(); await a2.turBaslat(true); ok(!a2.M.armaganSecim && a2.M.armagan.length === 1, 'yenilemede armağan seçimi tekrar sorulmaz');
  // 3-2 ve 4-3: aynı armağan bir maçta iki kez çıkmaz
  a.M.tur = 12; await a.turBaslat(false); const s2 = a.M.armaganSecim; a.armaganSec(0);
  a.M.tur = 20; await a.turBaslat(false); const s3 = a.M.armaganSecim; a.armaganSec(0);
  ok(s2 && s3 && a.turAd() === '4-3' && a.M.armagan.length === 3 && new Set(a.M.armagan).size === 3 && !s3.secenek.some(id => a.M.armagan.slice(0, 2).includes(id)), `3-2 ve 4-3'te birer armağan, tekrar yok (${a.M.armagan.join(', ')})`);
  // hemen etkili armağanlar
  const t = new Oyun(); await t.yeniMac('arena'); t.ilkSec(0); t.M.tur = 4; await t.turBaslat(false);
  const ver = (id) => { t.M.armaganSecim = { r: 3, kademe: DD.armagan(id).kademe, secenek: [id], yenile: 0, n: 0 }; t.armaganSec(0); };
  let x0 = t.M.xp, sv0 = t.M.seviye; ver('hizliBuyume'); ok(t.M.seviye > sv0 || t.M.xp > x0, 'Hızlı Büyüme: hemen +8 deneyim');
  t.M.altin = 10; t.M.seviye = 4; t.M.xp = 0; t.xpAl(); ok(t.M.altin === 7 && t.xpBedel() === 3, 'Hızlı Büyüme: deneyim 3 altın');
  let raf0 = t.M.esyaRaf.length; ver('ganimetKesesi'); ok(t.M.esyaRaf.length === raf0 + 2 && t.M.esyaRaf.slice(-2).every(id => DD.esya(id).tip === 'bilesen'), 'Ganimet Kesesi: 2 bileşen');
  let al0 = t.M.altin; ver('gozcuBaykusu'); ok(t.M.altin === al0 + AS.gozcuAltin, 'Gözcü Baykuşu: hemen 4 altın');
  raf0 = t.M.esyaRaf.length; ver('soyMuhru'); ok(t.bekleyenSecim() === 'muhur' && t.M.esyaRaf.length === raf0 + 1, 'Soy Mührü: 1 bileşen, soy seçimi bekler');
  t.muhurSec('ates'); ok(t.M.esyaRaf.includes('muhur-ates') && !t.M.muhurSecim, 'Soy Mührü: seçilen soyun mührü rafa');
  ver('ustaDemirci'); ok(t.M.esyaRaf.includes('sokumTasi') && t.M.ganimetSecim && t.M.ganimetSecim.length === 3 && t.M.ganimetSecim.every(id => DD.esya(id).tip === 'tam'), 'Usta Demirci: Söküm Taşı + 3 tam eşyadan seçim');
  t.ganimetSec(0);
  // Ocak Ustası: 1 bedava kaynaştırma, sonra 1 altın
  ver('ocakUstasi'); t.M.tahta = Array(12).fill(null); t.M.yedek = Array(7).fill(null); t.M.seviye = 8;
  t.M.tahta[0] = { h: 'ayi', s: 1 }; t.M.tahta[1] = { h: 'tilki', s: 1 }; t.M.tahta[2] = { h: 'golem', s: 1 }; t.M.tahta[3] = { h: 'kurt', s: 1 };
  al0 = t.M.altin = 5; t.secili = null; t.yuvaDokun('tahta', 0); t.kaynasModDegistir(); t.yuvaDokun('tahta', 1);
  ok(t.M.tahta[0].f === 'tilki' && t.M.altin === 5 && t.M.bedavaKaynas === 0, 'Ocak Ustası: ilk kaynaştırma bedava');
  t.secili = null; t.yuvaDokun('tahta', 2); t.kaynasModDegistir(); t.yuvaDokun('tahta', 3); ok(t.M.tahta[2].f === 'kurt' && t.M.altin === 4, 'Ocak Ustası: kaynaştırma 1 altın (K3 için de)');
  // Üçlü Kaynaşma: kaynaşmış birim düz bir kahramanla bir kez daha
  ver('ucluKaynasma'); t.M.tahta[4] = { h: 'yilan', s: 1 }; t.M.tahta[5] = { h: 'koc', s: 1 }; t.M.altin = 10;
  t.secili = null; t.yuvaDokun('tahta', 0); t.kaynasModDegistir(); t.yuvaDokun('tahta', 4);
  ok(t.M.tahta[0].f2 === 'yilan' && !t.M.tahta[4] && t.birimAd(t.M.tahta[0]).split('×').length === 3, `Üçlü Kaynaşma: ${t.birimAd(t.M.tahta[0])}`);
  t.secili = null; t.yuvaDokun('tahta', 0); t.kaynasModDegistir(); t.yuvaDokun('tahta', 5); ok(t.M.tahta[5] && t.M.tahta[0].f2 === 'yilan', 'üçlü kaynaşmış birim bir daha kaynaşmaz');
  t.secili = null; t.kaynasMod = false;
  ok(t.takim().find(b => b.h === 'ayi').f2 === 'yilan' && LL.kopyaSay([t.M.tahta[0]]).yilan === 1, 'takım ve havuz üçüncü kahramanı sayar');
  ok(t.satisDegeri(t.M.tahta[0]) === 3 + 3 + 2, 'üçlü birimin satış değeri üç parçanın toplamı');
  // Altın Yumurta: 5 savaş turu sonra 22 altın
  ver('altinYumurta'); let yum = 0;
  for (let k = 0; k < 6 && t.M.yumurta; k++) { const al1 = t.M.altin; if (t.M.kervan) await t.kervanSec(0); const sm = t.savasHazirla(); if (!sm) break; const rr = t.savasBitti(sm.sonunaKadar()); if (rr.bitti) break; if (!t.M.yumurta) yum = t.M.altin - al1; await t.turBaslat(false); }
  ok(!t.M.yumurta && yum >= AS.yumurtaAltin, `Altın Yumurta 5 savaştan sonra çatladı (+${yum} altın bu tur)`);
  // Saklı Kut: Kut kullanılmazsa +3
  const sk = new Oyun(); await sk.yeniMac('arena'); sk.ilkSec(0); sk.M.armagan = ['sakliKut'];
  const sm = sk.savasHazirla(), al2 = sk.M.altin; const rs = sm.sonunaKadar(); const rr = sk.savasBitti(rs);
  ok(rs.kut[0] === 0 && rr.ganimet >= AS.sakliKut && sk.M.altin === al2 + rr.ganimet, 'Saklı Kut: Kut kullanılmayan savaştan sonra +3 altın');
  // Pazar Dostu ve Göç Mevsimi: bedava yenileme
  const pz = new Oyun(); await pz.yeniMac('arena'); pz.ilkSec(0); pz.M.armagan = ['pazarDostu']; pz.M.tur = 5; await pz.turBaslat(false);
  const bd = 1 + (pz.M.alamet === 'gocMevsimi' ? 2 : 0);
  pz.M.altin = 10; ok(pz.M.bedavaYenile === bd, `Pazar Dostu: hazırlıkta ${bd} bedava yenileme`);
  for (let k = 0; k < bd; k++) pz.yenile(); ok(pz.M.altin === 10 && pz.yenileBedel() === 2, 'Pazar Dostu: bedava yenileme altın düşmez, sonra 2 altın');
  pz.M.alamet = 'gocMevsimi'; pz.M.bedavaYenile = 2; pz.yenile(); pz.yenile(); pz.yenile(); ok(pz.M.altin === 8, 'Göç Mevsimi: ilk 2 yenileme bedava');
  // Pazar Dostu seçildiği hazırlıkta da bir bedava yenileme verir (armağan aşaması turBaslat'tan sonra seçilir)
  { const pd = new Oyun(); await pd.yeniMac('arena'); pd.ilkSec(0); const b0 = pd.M.bedavaYenile;
    pd.M.armaganSecim = { r: 4, kademe: 'kivilcim', secenek: ['pazarDostu'], yenile: 0, n: 0 }; pd.armaganSec(0);
    ok(pd.M.bedavaYenile === b0 + AS.pazarDostu, 'Pazar Dostu: seçildiği hazırlıkta hemen +1 bedava yenileme'); }
  // Bereket Küpü: faiz tavanı 7
  pz.M.armagan = ['bereketKupu']; pz.M.altin = 75; ok(pz.faizSonraki() === 7, 'Bereket Küpü: faiz 7');
  // Alamet Bilgesi: 3 alamet görünür, bölümde bir kez kendi savaşı Durgun Gök
  const ab = new Oyun(); await ab.yeniMac('arena'); ab.ilkSec(0); ab.M.armagan = ['alametBilgesi'];
  let bul = false; for (let r = 4; r < 11 && !bul; r++) { ab.M.tur = r; ab.M.kervan = null; await ab.turBaslat(false); if (ab.M.alamet !== 'yok' && ab.turTip() === 'pvp') bul = true; }
  ok(ab.sonrakiAlametler().length === 3, 'Alamet Bilgesi: sonraki 3 turun alameti görünür');
  ok(bul && ab.alametSusturabilir(), 'Alamet Bilgesi: susturma kullanılabilir');
  ab.alametSustur(); const asv = ab.savasHazirla();
  ok(ab._savas.alamet === 'yok' && !ab.alametSusturabilir(), 'kendi savaşının alameti Durgun Gök oldu; bu bölümde bir daha susturulamaz');
  asv.sonunaKadar();
  // Kut hakkı: savaşta motor armağanları ve rakibin armağanlarını alır; Son Direniş can 40 altındayken
  const ks = new Oyun(); await ks.yeniMac('lobi'); ks.ilkSec(0); ks.M.armagan = ['cifteKut', 'sonDirenis']; ks.M.can = 30;
  ks.M.dukkan = ['golem', null, null, null, null]; ks.M.altin = 5; ks.satinAl(0);
  const kss = ks.savasHazirla(); ok(kss.kutHakSay(0) === 2 && kss.birimler.filter(u => u.taraf === 0).every(u => u.mx > 0), 'Çifte Kut: oyuncunun savaşında 2 Kut hakkı');
  ok(kss.birimler[0].mx === Math.round(DD.kahraman(kss.birimler[0].b.h).can * 1.2), 'Son Direniş: can 40\'ın altında, takım +%20 can');
  // lobide yalnız 2 kişi kalınca iki tarafın da 2 Kut hakkı (Son İki)
  const si = new Oyun(); await si.yeniMac('lobi'); si.ilkSec(0);
  for (const o2 of si.M.lobi.oyuncular.slice(2)) { o2.olu = true; o2.can = 0; o2.sira = 8; }
  si.M.tur = 5; await si.turBaslat(false); si.M.alamet = 'yok'; si.M.dukkan = ['golem', null, null, null, null]; si.M.altin = 5; si.satinAl(0);
  const sis = si.savasHazirla(), rc = (si.M.rakip.armagan || []).includes('cifteKut') ? 1 : 0;
  ok(sis && sis.kutHakSay(0) === 2 && sis.kutHakSay(1) === 2 + rc, `Son İki: iki tarafın da 2 Kut hakkı${rc ? ' (rakibin Çifte Kut\'u +1)' : ''}`);
  // Gözcü Baykuşu (lobide): sonraki 2 PvP turunun rakip tahmini
  si.M.armagan = ['gozcuBaykusu']; const gz = si.gozcu(); ok(gz && gz.length === 2 && gz.every(x => x.ad && x.tur), `Gözcü: ${gz.map(x => x.tur + ' ' + x.ad).join(', ')}`);
  // Demirci Ateşi: PvP'yi kazanana 1 bileşen
  const dm = new Oyun(); await dm.yeniMac('arena'); dm.ilkSec(0); dm.M.tur = 5; await dm.turBaslat(false); dm.M.alamet = 'demirci';
  dm.M.dukkan = ['ayi', 'ayi', 'tilki', null, null]; dm.M.altin = 9; dm.M.seviye = 8; dm.satinAl(0); dm.satinAl(1); dm.satinAl(2);
  dm.M.rakip = { ad: 'zayıf', takim: [{ h: 'kurt', s: 1, x: 0, y: 2 }], kupa: 0, kaynak: 'bot' };
  const raf1 = dm.M.esyaRaf.length, dr = dm.savasBitti(dm.savasHazirla().sonunaKadar());
  ok(dr.kazanan === 0 && dm.M.esyaRaf.length === raf1 + 1 && DD.esya(dm.M.esyaRaf[dm.M.esyaRaf.length - 1]).tip === 'bilesen', 'Demirci Ateşi: PvP\'yi kazanana 1 bileşen');
  // Hızlı Maç: armağan ve yeni alametler yok
  const hz = new Oyun(); await hz.yeniMac('hizli');
  let hzOk = true; for (let r = 1; r < 12; r++) { hz.M.tur = r; await hz.turBaslat(false); if (hz.M.armaganSecim || DD.ALAMETLER.find(x => x.id === hz.M.alamet).lobi) hzOk = false; }
  ok(hzOk && hz.sonrakiAlamet() === null, 'Hızlı Maç: Kut Armağanı ve lobi alametleri yok');
}
process.exit(hata ? 1 : 0);
