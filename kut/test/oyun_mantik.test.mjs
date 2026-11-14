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
ok(o.M.mod === 'arena' && o.M.tur === 1 && o.M.altin === 10 && o.M.dukkan.length === 5 && o.M.rakip, 'maç başladı: tur 1, 10 altın, 5 kart, rakip hazır');
ok(o.M.tahta.length === 12 && o.M.yedek.length === 7 && o.M.seviye === 2 && o.M.xp === 0 && o.yuva() === 2, 'seviyeli maç: 4×3 tahta, 7 yedek, Sv 2, takım 2');
ok(o.M.dukkan.every(id => window.KUT_DATA.kahraman(id).kademe === 1), 'Sv 2 dükkânı yalnız K1');
ok(o.M.rakip.takim.length === 2 && o.M.rakip.takim.every(b => b.x >= 0 && b.x < 4 && b.y >= 0 && b.y < 3), 'rakip bot Sv 2: 2 kahraman, 4×3 konumlar');
// deneyim satın alma: 4 altın → 4 deneyim; Sv2→3 için 2 gerek, artan 2 taşınır
o.xpAl(); ok(o.M.seviye === 3 && o.M.xp === 2 && o.M.altin === 6 && o.yuva() === 3, 'deneyim al: Sv 3, 2/6 deneyim, 6 altın kaldı');
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
while (!ozet && tur++ < 20) {
  if (!o.M.rakip) await o.turBaslat(false);
  // parası yettikçe al, tahtayı doldur
  for (let i = 0; i < 5; i++) if (o.M.dukkan[i] && o.M.altin >= window.KUT_DATA.kahraman(o.M.dukkan[i]).kademe) o.satinAl(i);
  for (let i = 0; i < 4; i++) { const yi = o.M.yedek.findIndex(Boolean), ti = o.M.tahta.findIndex(x => !x); if (yi < 0 || ti < 0 || o.tahtaSay() >= o.yuva()) break; o.yuvaDokun('yedek', yi); o.yuvaDokun('tahta', ti); }
  const sim = o.savasHazirla(); const s = sim.sonunaKadar(); const r = o.savasBitti(s);
  if (r.bitti) ozet = r; else await o.turBaslat(false);
}
ok(ozet && ozet.bitti && ozet.kod.startsWith('KUT2-') && (ozet.kazandi ? ozet.zafer === 7 : true), `maç bitti (${tur} tur, ${ozet && ozet.kazandi ? 'kazandı' : 'kaybetti'}, kupa ${ozet && ozet.fark})`);
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
process.exit(hata ? 1 : 0);
