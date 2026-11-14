// node kut/test/oyun_mantik.test.mjs — web/oyun.js: tam maç (satın alma, birleşme, kaynaştırma, savaş, maç sonu)
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
globalThis.window = globalThis; globalThis.btoa = s => Buffer.from(s, 'binary').toString('base64'); globalThis.atob = s => Buffer.from(s, 'base64').toString('binary');
const depo = {}; globalThis.localStorage = { getItem: k => depo[k] ?? null, setItem: (k, v) => { depo[k] = v; } };
require('../data.js'); require('../sim.js'); require('../online.js');
const { Oyun } = await import('../web/oyun.js');
let hata = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) hata++; };
const o = new Oyun(); const olaylar = []; o.on('birlesti', e => olaylar.push(['birlesti', e])); o.on('kaynasti', e => olaylar.push(['kaynasti', e]));
await o.yeniMac();
ok(o.M.tur === 1 && o.M.altin === 10 && o.M.dukkan.length === 5 && o.M.rakip, 'maç başladı: tur 1, 10 altın, 5 kart, rakip hazır');
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
ok(ozet && ozet.bitti && ozet.kod.startsWith('KUT1-') && (ozet.kazandi ? ozet.zafer === 7 : true), `maç bitti (${tur} tur, ${ozet && ozet.kazandi ? 'kazandı' : 'kaybetti'}, kupa ${ozet && ozet.fark})`);
ok(o.P.mac === null && JSON.parse(depo['kut.profil.v2']).istat.mac === 1, 'profil kaydedildi, maç kapandı');
const d = o.duelloHazirla(ozet.kod); ok(d && d.sonunaKadar().kazanan !== undefined, 'düello kodu ile savaş');
process.exit(hata ? 1 : 0);
